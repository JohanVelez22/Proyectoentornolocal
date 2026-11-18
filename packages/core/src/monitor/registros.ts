import { watch, type FSWatcher } from 'node:fs';
import { open, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Eventos, EventosNucleo } from '../eventos';
import { idSupervisor } from '../proyectos/procesos';
import { sanear } from '../proyectos/recetas';
import type { Rutas } from '../rutas';
import type { Sitio } from '../tipos';

export type GrupoRegistro =
  'nginx' | 'php' | 'servicio' | 'sitio' | 'proyecto' | 'tunel' | 'laravel';

/** Un archivo de registro que se puede ver. El renderer solo conoce el `id`, nunca pide rutas. */
export interface FuenteRegistro {
  /**
   * Estable: 'nginx', 'nginx:error', 'php:<versión>', 'servicio:<nombre>', 'sitio:<id>:acceso',
   * 'sitio:<id>:error', 'tunel:<sitio>', 'tunel:<sitio>:salida', 'laravel:<sitio>' y, para los
   * procesos de proyecto, el mismo id del supervisor ('proy-<sitio>-<proceso>').
   */
  id: string;
  nombre: string;
  ruta: string;
  grupo: GrupoRegistro;
  sitioId?: string;
}

export interface DepsRegistros {
  rutas: Rutas;
  eventos: Eventos<EventosNucleo>;
  leerSitios: () => Promise<Sitio[]>;
  /** `ProcesosProyecto.rutaLog`: el log de un proceso de proyecto. */
  rutaLogProceso: (sitioId: string, procesoId: string) => string;
  /** Cada cuánto se revisa un archivo seguido aunque `fs.watch` no avise (ms). */
  intervaloMs?: number;
}

/** Líneas como mucho por evento 'registro:lineas'. */
export const MAX_LINEAS_LOTE = 500;
/** Líneas como mucho que devuelve `leerFinal`. */
export const MAX_LINEAS_FINAL = 5000;
/** Bytes como mucho que se leen del final de un archivo en `leerFinal`. */
const MAX_BYTES_FINAL = 4 * 1024 * 1024;
/** Si entre dos revisiones se anexó más que esto, se salta al final (solo se leen estos bytes). */
const MAX_BYTES_REVISION = 1024 * 1024;
/** Líneas como mucho por revisión (las más nuevas). */
const MAX_LINEAS_REVISION = 5000;
/** Una línea sin salto más larga que esto se emite tal cual (no se acumula sin fin). */
const MAX_BYTES_RESTO = 64 * 1024;
const BLOQUE = 64 * 1024;
const SALTO = 0x0a;

const sinRetorno = (t: string): string => (t.endsWith('\r') ? t.slice(0, -1) : t);
const lineaDe = (b: Buffer): string => sanear(sinRetorno(b.toString('utf8')));
const noExiste = (e: unknown): boolean =>
  ['ENOENT', 'ENOTDIR'].includes((e as NodeJS.ErrnoException)?.code ?? '');

/**
 * Sigue un archivo como `tail -f`: lectura incremental por posición en bytes. Tolera:
 * - anexado (lee solo lo nuevo; una línea sin salto espera al salto),
 * - truncado (el archivo se achica: vuelve al principio),
 * - rotación (otro archivo con el mismo nombre: se reabre desde el principio).
 * El archivo se abre y se cierra en cada revisión: nunca se impide rotarlo o borrarlo. Cortar
 * por el byte del salto de línea mantiene íntegros los caracteres UTF-8 de varios bytes.
 */
class Cola {
  private offset = 0;
  private identidad: string | null = null;
  private resto: Buffer = Buffer.alloc(0);
  /** Tras saltar al final se descarta la primera línea, que llega cortada. */
  private descartarPrimera = false;
  private revisando = false;
  private pendiente = false;
  private cerrada = false;
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private vigilante: FSWatcher | null = null;

  constructor(
    private readonly ruta: string,
    private readonly emitir: (lineas: string[]) => void,
    private readonly intervaloMs: number,
  ) {}

  /** Se sitúa al final del archivo (solo emite lo que llegue después) y empieza a vigilar. */
  async arrancar(): Promise<void> {
    this.revisando = true;
    try {
      const fh = await open(this.ruta, 'r');
      try {
        const st = await fh.stat({ bigint: true });
        this.identidad = identidadDe(st);
        this.offset = Number(st.size);
      } finally {
        await fh.close();
      }
    } catch {
      // Aún no existe: se leerá desde el principio cuando aparezca.
    } finally {
      this.revisando = false;
    }
    if (this.cerrada) return;
    this.temporizador = setInterval(() => this.avisar(), this.intervaloMs);
    try {
      const nombre = path.basename(this.ruta);
      this.vigilante = watch(path.dirname(this.ruta), (_ev, f) => {
        if (!f || f.toString() === nombre) this.avisar();
      });
      this.vigilante.on('error', () => this.soltarVigilante());
    } catch {
      // La carpeta no existe o no se puede vigilar: queda la revisión periódica.
    }
    if (this.pendiente) this.avisar();
  }

  cerrar(): void {
    this.cerrada = true;
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    this.soltarVigilante();
  }

  private soltarVigilante(): void {
    this.vigilante?.close();
    this.vigilante = null;
  }

  /** Pide una revisión; nunca corren dos a la vez (la pedida durante otra se hace al terminar). */
  avisar(): void {
    if (this.cerrada) return;
    if (this.revisando) {
      this.pendiente = true;
      return;
    }
    this.revisando = true;
    void (async () => {
      try {
        do {
          this.pendiente = false;
          await this.revisar().catch((e: unknown) =>
            console.error('No se pudo leer el registro:', e),
          );
        } while (this.pendiente && !this.cerrada);
      } finally {
        this.revisando = false;
      }
    })();
  }

  private reiniciar(): void {
    this.offset = 0;
    this.resto = Buffer.alloc(0);
    this.descartarPrimera = false;
  }

  private async revisar(): Promise<void> {
    let fh;
    try {
      fh = await open(this.ruta, 'r');
    } catch (e) {
      if (!noExiste(e)) throw e;
      // Se borró o se está rotando: el próximo archivo se lee desde el principio.
      if (this.identidad !== null || this.offset > 0) {
        this.identidad = null;
        this.reiniciar();
      }
      return;
    }
    try {
      const st = await fh.stat({ bigint: true });
      const identidad = identidadDe(st);
      if (this.identidad !== null && identidad !== this.identidad) this.reiniciar(); // rotación
      this.identidad = identidad;
      const tam = Number(st.size);
      if (tam < this.offset) this.reiniciar(); // truncado
      if (tam === this.offset) return;
      let desde = this.offset;
      if (tam - desde > MAX_BYTES_REVISION) {
        desde = tam - MAX_BYTES_REVISION;
        this.resto = Buffer.alloc(0);
        this.descartarPrimera = true;
      }
      const lineas: string[] = [];
      const buf = Buffer.alloc(Math.min(BLOQUE, tam - desde));
      while (desde < tam && !this.cerrada) {
        const { bytesRead } = await fh.read(buf, 0, Math.min(buf.length, tam - desde), desde);
        if (bytesRead <= 0) break;
        desde += bytesRead;
        this.partir(buf.subarray(0, bytesRead), lineas);
      }
      this.offset = desde;
      if (this.cerrada) return;
      const nuevas =
        lineas.length > MAX_LINEAS_REVISION ? lineas.slice(-MAX_LINEAS_REVISION) : lineas;
      for (let i = 0; i < nuevas.length; i += MAX_LINEAS_LOTE) {
        this.emitir(nuevas.slice(i, i + MAX_LINEAS_LOTE));
      }
    } finally {
      await fh.close();
    }
  }

  /** Corta en líneas completas; lo que queda sin salto se guarda para la próxima lectura. */
  private partir(trozo: Buffer, lineas: string[]): void {
    const datos = this.resto.length > 0 ? Buffer.concat([this.resto, trozo]) : trozo;
    let inicio = 0;
    for (let i = datos.indexOf(SALTO); i >= 0; i = datos.indexOf(SALTO, inicio)) {
      if (this.descartarPrimera) this.descartarPrimera = false;
      else lineas.push(lineaDe(datos.subarray(inicio, i)));
      inicio = i + 1;
    }
    // Copia: `trozo` es el búfer de lectura, que se reutiliza.
    this.resto = Buffer.from(datos.subarray(inicio));
    if (this.resto.length > MAX_BYTES_RESTO) {
      if (this.descartarPrimera) this.descartarPrimera = false;
      else lineas.push(lineaDe(this.resto));
      this.resto = Buffer.alloc(0);
    }
  }
}

/** Identidad del archivo (índice de NTFS / inodo): cambia si otro archivo ocupa el nombre. */
function identidadDe(st: { dev: bigint; ino: bigint }): string {
  return `${st.dev}:${st.ino}`;
}

/**
 * Visor de registros: lista las fuentes conocidas y las sigue o lee por id. Las rutas salen solo
 * de `fuentes()`; un id que no esté ahí da error. Toda línea pasa por `sanear()` (un laravel.log
 * puede traer claves).
 */
export class Registros {
  private readonly colas = new Map<string, { cola: Cola; cuenta: number; listo: Promise<void> }>();

  constructor(private readonly d: DepsRegistros) {}

  async fuentes(): Promise<FuenteRegistro[]> {
    const lista: FuenteRegistro[] = [];
    const vistas = new Set<string>();
    const agregar = (f: FuenteRegistro): void => {
      if (vistas.has(f.id)) return;
      vistas.add(f.id);
      lista.push(f);
    };
    const r = this.d.rutas;

    // Nginx, PHP y cada servicio: los .log de la carpeta logs.
    for (const nombre of await archivosLog(r.logs())) {
      const ruta = r.logs(nombre);
      const base = nombre.slice(0, -'.log'.length);
      if (base === 'nginx') agregar({ id: 'nginx', nombre: 'Nginx', ruta, grupo: 'nginx' });
      else if (base === 'nginx-error') {
        agregar({ id: 'nginx:error', nombre: 'Nginx (errores)', ruta, grupo: 'nginx' });
      } else if (base.startsWith('php-') && base.length > 4) {
        const v = base.slice(4);
        agregar({ id: `php:${v}`, nombre: `PHP ${v}`, ruta, grupo: 'php' });
      } else agregar({ id: `servicio:${base}`, nombre: base, ruta, grupo: 'servicio' });
    }

    // Túneles: logs/tuneles/tunel-<sitio>.log y su .salida.log.
    for (const nombre of await archivosLog(r.logs('tuneles'))) {
      const m = /^tunel-(.+?)(\.salida)?\.log$/.exec(nombre);
      if (!m) continue;
      const sitioId = m[1]!;
      agregar({
        id: m[2] ? `tunel:${sitioId}:salida` : `tunel:${sitioId}`,
        nombre: m[2] ? `Túnel ${sitioId} (salida)` : `Túnel ${sitioId}`,
        ruta: r.logs('tuneles', nombre),
        grupo: 'tunel',
        sitioId,
      });
    }

    // Por sitio: acceso y errores de Nginx, procesos de proyecto y laravel.log.
    for (const s of await this.d.leerSitios()) {
      agregar({
        id: `sitio:${s.id}:acceso`,
        nombre: `${s.dominio} (acceso)`,
        ruta: r.logs('sitios', `${s.id}.access.log`),
        grupo: 'sitio',
        sitioId: s.id,
      });
      agregar({
        id: `sitio:${s.id}:error`,
        nombre: `${s.dominio} (errores)`,
        ruta: r.logs('sitios', `${s.id}.error.log`),
        grupo: 'sitio',
        sitioId: s.id,
      });
      for (const p of s.procesos) {
        let id: string;
        try {
          id = idSupervisor(s.id, p.id);
        } catch {
          continue;
        }
        agregar({
          id,
          nombre: `${s.nombre}: ${p.nombre || p.id}`,
          ruta: this.d.rutaLogProceso(s.id, p.id),
          grupo: 'proyecto',
          sitioId: s.id,
        });
      }
      if (s.tipo === 'laravel') {
        agregar({
          id: `laravel:${s.id}`,
          nombre: `${s.nombre}: laravel.log`,
          ruta: path.join(s.carpeta, 'storage', 'logs', 'laravel.log'),
          grupo: 'laravel',
          sitioId: s.id,
        });
      }
    }
    return lista;
  }

  /**
   * Empieza a emitir 'registro:lineas' con las líneas nuevas de la fuente. Varios seguidores del
   * mismo id comparten una sola cola (un solo evento por línea). Devuelve la función para dejar
   * de seguir (idempotente).
   */
  async seguir(id: string): Promise<() => void> {
    let entrada = this.colas.get(id);
    if (entrada) {
      entrada.cuenta++;
    } else {
      const fuente = await this.buscar(id);
      // Otro seguir() del mismo id pudo crearla mientras se buscaba la fuente.
      entrada = this.colas.get(id);
      if (entrada) entrada.cuenta++;
      else {
        const cola = new Cola(
          fuente.ruta,
          (lineas) => this.d.eventos.emit('registro:lineas', { id, lineas }),
          this.d.intervaloMs ?? 1000,
        );
        entrada = { cola, cuenta: 1, listo: cola.arrancar() };
        this.colas.set(id, entrada);
      }
    }
    const propia = entrada;
    await propia.listo;
    let hecho = false;
    return () => {
      if (hecho) return;
      hecho = true;
      propia.cuenta--;
      if (propia.cuenta > 0) return;
      propia.cola.cerrar();
      if (this.colas.get(id) === propia) this.colas.delete(id);
    };
  }

  /** Las últimas `lineas` líneas (saneadas); de un archivo grande solo se lee el final. */
  async leerFinal(id: string, lineas = 500): Promise<string[]> {
    const fuente = await this.buscar(id);
    const n = Math.min(MAX_LINEAS_FINAL, Math.max(1, Math.floor(lineas) || 1));
    let fh;
    try {
      fh = await open(fuente.ruta, 'r');
    } catch (e) {
      if (noExiste(e)) return [];
      throw e;
    }
    try {
      const tam = (await fh.stat()).size;
      const trozos: Buffer[] = [];
      let pos = tam;
      let saltos = 0;
      let leidos = 0;
      // Se lee hacia atrás hasta tener n líneas completas (n+1 saltos) o llegar al tope.
      while (pos > 0 && saltos <= n && leidos < MAX_BYTES_FINAL) {
        const largo = Math.min(BLOQUE, pos);
        pos -= largo;
        const b = Buffer.alloc(largo);
        const { bytesRead } = await fh.read(b, 0, largo, pos);
        const t = b.subarray(0, bytesRead);
        trozos.unshift(t);
        leidos += largo;
        for (let i = t.indexOf(SALTO); i >= 0; i = t.indexOf(SALTO, i + 1)) saltos++;
      }
      let datos = Buffer.concat(trozos);
      // La primera línea quedó cortada si no se llegó al principio.
      if (pos > 0) {
        const i = datos.indexOf(SALTO);
        datos = i >= 0 ? datos.subarray(i + 1) : Buffer.alloc(0);
      }
      const partes = datos.toString('utf8').split('\n');
      if (partes.at(-1) === '') partes.pop();
      return partes.slice(-n).map((l) => sanear(sinRetorno(l)));
    } finally {
      await fh.close();
    }
  }

  /** Deja de seguir todo (al cerrar la app o la ventana). */
  cerrar(): void {
    for (const e of this.colas.values()) e.cola.cerrar();
    this.colas.clear();
  }

  private async buscar(id: string): Promise<FuenteRegistro> {
    const f = (await this.fuentes()).find((x) => x.id === id);
    if (!f) throw new Error(`La fuente de registro no existe: ${id}`);
    return f;
  }
}

/** Nombres de los archivos .log (no carpetas) de una carpeta; vacía si no existe. */
async function archivosLog(carpeta: string): Promise<string[]> {
  try {
    const entradas = await readdir(carpeta, { withFileTypes: true });
    return entradas
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.log'))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}
