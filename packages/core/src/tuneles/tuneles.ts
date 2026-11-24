import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import { ErrorDetenidoAlIniciar, type Supervisor } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import type { GestorSitios } from '../sitios/sitios';
import type { UrlBase } from '../sitios/urlbase';
import type { Config, EstadoTunel, Sitio } from '../tipos';
import { extraerUrlTunel } from './url';
import { nombreEjecutable } from '../plataforma/sistema';

export interface DepsTuneles {
  supervisor: Pick<Supervisor, 'iniciar' | 'detener' | 'estado' | 'pid' | 'alSalir' | 'ids'>;
  sitios: Pick<GestorSitios, 'listar'>;
  almacen: Pick<Almacen, 'leer'>;
  instalador: Pick<Instalador, 'instalados'>;
  rutas: Rutas;
  urlBase: Pick<UrlBase, 'aplicar' | 'restaurar' | 'restaurarPorId'>;
  eventos: Eventos<EventosNucleo>;
  opts?: { esperaMs?: number; intervaloMs?: number };
}

interface RegistroTunel {
  sitioId: string;
  url: string;
  pid: number;
}

const PREFIJO = 'tunel-';

/** Cómo se pidió abrir: `confirmado` solo si el usuario confirmó publicar (interfaz o MCP). */
export interface OpcionesAbrirTunel {
  confirmado?: boolean;
}
const MSG_CERRADO = 'El túnel se cerró. Use Renovar.';

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function leerTexto(archivo: string): string {
  try {
    return readFileSync(archivo, 'utf8');
  } catch {
    return '';
  }
}

export class Tuneles {
  private readonly mapa = new Map<string, EstadoTunel>();
  private readonly cerrando = new Set<string>();
  private readonly abriendo = new Map<string, Promise<EstadoTunel>>();
  /** Se incrementa en cada cerrar() para invalidar aperturas en curso. */
  private readonly generacion = new Map<string, number>();
  /** Cierres en curso: un abrir() del mismo sitio espera a que terminen. */
  private readonly cierres = new Map<string, Promise<void>>();
  /** Se incrementa en cada lanzamiento para no matar el proceso de una apertura más nueva. */
  private readonly lanzamientos = new Map<string, number>();
  private readonly esperaMs: number;
  private readonly intervaloMs: number;

  constructor(private readonly d: DepsTuneles) {
    this.esperaMs = d.opts?.esperaMs ?? 30_000;
    this.intervaloMs = d.opts?.intervaloMs ?? 500;
    d.supervisor.alSalir((id) => {
      void this.alSalirProceso(id);
    });
  }

  estados(): EstadoTunel[] {
    return [...this.mapa.values()].map((e) => ({ ...e }));
  }

  /**
   * Abre el túnel de un sitio. Un sitio con datos reales solo se publica con `confirmado` (el
   * usuario lo confirmó en la ventana): si no, `tuneles.confirmacion_requerida`.
   */
  abrir(sitioId: string, o: OpcionesAbrirTunel = {}): Promise<EstadoTunel> {
    const cierre = this.cierres.get(sitioId);
    if (cierre) return cierre.then(() => this.abrir(sitioId, o));
    const actual = this.mapa.get(sitioId);
    if (actual && actual.estado === 'activo') return Promise.resolve({ ...actual });
    const enCurso = this.abriendo.get(sitioId);
    if (enCurso) return enCurso;
    const p: Promise<EstadoTunel> = this.abrirInterno(sitioId, o).finally(() => {
      if (this.abriendo.get(sitioId) === p) this.abriendo.delete(sitioId);
    });
    this.abriendo.set(sitioId, p);
    return p;
  }

  cerrar(sitioId: string): Promise<void> {
    this.generacion.set(sitioId, this.gen(sitioId) + 1);
    this.abriendo.delete(sitioId);
    const previo = this.cierres.get(sitioId) ?? Promise.resolve();
    const p: Promise<void> = previo
      .catch(() => undefined)
      .then(() => this.cerrarInterno(sitioId))
      .finally(() => {
        if (this.cierres.get(sitioId) === p) this.cierres.delete(sitioId);
      });
    this.cierres.set(sitioId, p);
    return p;
  }

  private gen(sitioId: string): number {
    return this.generacion.get(sitioId) ?? 0;
  }

  private async cerrarInterno(sitioId: string): Promise<void> {
    const id = PREFIJO + sitioId;
    this.cerrando.add(sitioId);
    try {
      await this.d.supervisor.detener(id);
      const sitio = await this.buscar(sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
      this.mapa.delete(sitioId);
      this.quitarRegistro(sitioId);
      this.d.eventos.emit('tunel:estado', { sitioId, estado: 'apagado', url: null });
    } finally {
      this.cerrando.delete(sitioId);
    }
  }

  async renovar(sitioId: string, o: OpcionesAbrirTunel = {}): Promise<EstadoTunel> {
    // Se comprueba antes de cerrar: sin confirmación no se toca el túnel que hay.
    const sitio = await this.buscar(sitioId);
    if (sitio) this.exigirConfirmacion(sitio, o);
    await this.cerrar(sitioId);
    return this.abrir(sitioId, o);
  }

  /** Recupera los túneles que siguen vivos tras reiniciar la app (llamar tras supervisor.readoptar). */
  async restaurar(): Promise<void> {
    const registros = this.leerRegistros();
    const vivos: RegistroTunel[] = [];
    const muertos: RegistroTunel[] = [];
    for (const r of registros) {
      const id = PREFIJO + r.sitioId;
      if (this.d.supervisor.estado(id) !== 'apagado' && this.d.supervisor.pid(id) === r.pid) {
        vivos.push(r);
        this.fijar({ sitioId: r.sitioId, estado: 'activo', url: r.url });
      } else {
        muertos.push(r);
      }
    }
    // cloudflared readoptado sin registro vigente: nadie lo controla, se detiene.
    const vigentes = new Set(vivos.map((v) => PREFIJO + v.sitioId));
    for (const id of this.d.supervisor.ids()) {
      if (!id.startsWith(PREFIJO) || vigentes.has(id)) continue;
      const sitioId = id.slice(PREFIJO.length);
      this.cerrando.add(sitioId);
      try {
        await this.d.supervisor.detener(id);
      } catch (e) {
        console.error('No se pudo detener el túnel huérfano:', e);
      } finally {
        this.cerrando.delete(sitioId);
      }
    }
    for (const r of muertos) {
      const sitio = await this.buscar(r.sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
    }
    this.escribirRegistros(vivos);
    await this.barrerHuerfanos(new Set(vivos.map((v) => v.sitioId)));
  }

  /**
   * Cierra todos los túneles (al apagar o con "Detener todo"): primero devuelve los .env
   * —lo más importante si el cierre se corta— y luego cierra los procesos en paralelo.
   * Devuelve los errores (no lanza).
   */
  async cerrarTodos(): Promise<unknown[]> {
    const ids = [...new Set([...this.estados().map((t) => t.sitioId), ...this.abriendo.keys()])];
    await Promise.allSettled(
      ids.map(async (id) => {
        const sitio = await this.buscar(id);
        if (sitio) await this.restaurarUrlBase(sitio);
        else await this.d.urlBase.restaurarPorId(id);
      }),
    );
    const r = await Promise.allSettled(ids.map((id) => this.cerrar(id)));
    return r.filter((x) => x.status === 'rejected').map((x) => x.reason);
  }

  /** Restaura todo run/urlbase-<id>.json cuyo sitio no tiene un túnel vivo. */
  private async barrerHuerfanos(vivos: Set<string>): Promise<void> {
    let archivos: string[] = [];
    try {
      archivos = readdirSync(path.join(this.d.rutas.base, 'run'));
    } catch {
      return;
    }
    for (const f of archivos) {
      const m = /^urlbase-(.+)\.json$/.exec(f);
      if (!m || vivos.has(m[1]!)) continue;
      const sitio = await this.buscar(m[1]!);
      if (sitio) {
        await this.restaurarUrlBase(sitio);
      } else {
        try {
          await this.d.urlBase.restaurarPorId(m[1]!);
        } catch (e) {
          console.error('No se pudo restaurar la URL base huérfana:', e);
        }
      }
    }
  }

  private exigirConfirmacion(sitio: Sitio, o: OpcionesAbrirTunel): void {
    if (sitio.datosReales && o.confirmado !== true) {
      throw new ErrorWolf(
        'tuneles.confirmacion_requerida',
        `${sitio.dominio} tiene datos reales: publicarlo exige confirmarlo en la ventana de WolfCore Dev.`,
        { dominio: sitio.dominio },
      );
    }
  }

  private async abrirInterno(sitioId: string, o: OpcionesAbrirTunel): Promise<EstadoTunel> {
    const gen = this.generacion.get(sitioId) ?? 0;
    const sitio = await this.buscar(sitioId);
    if (!sitio) throw new ErrorWolf('tuneles.sitio_no_encontrado', 'Sitio no encontrado');
    this.exigirConfirmacion(sitio, o);
    const versiones = await this.d.instalador.instalados('cloudflared');
    // Configuración de una versión anterior (o parcial): sin predeterminada, la más nueva.
    const cfg: Partial<Config> = await this.d.almacen.leer();
    const elegida = cfg.catalogo?.predeterminadas?.cloudflared;
    const version =
      elegida && versiones.includes(elegida)
        ? elegida
        : [...versiones].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    if (!version)
      throw new ErrorWolf(
        'tuneles.cloudflared_no_instalado',
        'cloudflared no está instalado. Instálelo desde Servicios.',
      );
    const puerto = (await this.d.almacen.leer()).servicios.nginx.puerto;

    const id = PREFIJO + sitioId;
    const logCloudflared = this.d.rutas.logs('tuneles', `${id}.log`);
    const logSalida = this.d.rutas.logs('tuneles', `${id}.salida.log`);
    if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
    this.fijar({ sitioId, estado: 'iniciando', url: null });
    try {
      // Evita leer una URL de una ejecución anterior.
      mkdirSync(path.dirname(logCloudflared), { recursive: true });
      rmSync(logCloudflared, { force: true });
      rmSync(logSalida, { force: true });
    } catch (e) {
      return this.fijar({
        sitioId,
        estado: 'error',
        url: null,
        mensaje: `No se pudo limpiar el log anterior del túnel: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    const token = (this.lanzamientos.get(sitioId) ?? 0) + 1;
    this.lanzamientos.set(sitioId, token);
    try {
      await this.d.supervisor.iniciar({
        id,
        comando: path.join(
          this.d.rutas.bin('cloudflared', version),
          nombreEjecutable('cloudflared'),
        ),
        args: [
          'tunnel',
          '--no-autoupdate',
          '--url',
          `http://127.0.0.1:${puerto}`,
          '--http-host-header',
          sitio.dominio,
          '--logfile',
          logCloudflared,
        ],
        log: logSalida,
        reiniciar: false,
      });
    } catch (e) {
      // Cerrado a propósito mientras arrancaba: no es un error.
      if (e instanceof ErrorDetenidoAlIniciar || this.gen(sitioId) !== gen) {
        return this.apagado(sitioId);
      }
      this.fijar({
        sitioId,
        estado: 'error',
        url: null,
        mensaje: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }

    if (this.gen(sitioId) !== gen) {
      // Se cerró mientras se lanzaba: este proceso quedaría huérfano. Solo se detiene si
      // ninguna apertura más nueva lanzó otro proceso para el mismo túnel.
      if (this.lanzamientos.get(sitioId) === token) {
        this.cerrando.add(sitioId);
        try {
          await this.d.supervisor.detener(id);
        } catch (e) {
          console.error('No se pudo detener el túnel abandonado:', e);
        } finally {
          this.cerrando.delete(sitioId);
        }
      }
      return this.apagado(sitioId);
    }
    const limite = Date.now() + this.esperaMs;
    for (;;) {
      if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
      const url = extraerUrlTunel(leerTexto(logCloudflared) + '\n' + leerTexto(logSalida));
      if (url) return this.alEncontrarUrl(sitio, url, gen);
      if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
      const actual = this.mapa.get(sitioId);
      if (!actual || actual.estado !== 'iniciando')
        return actual ? { ...actual } : this.apagado(sitioId);
      if (Date.now() >= limite) break;
      await dormir(this.intervaloMs);
    }

    this.cerrando.add(sitioId);
    try {
      await this.d.supervisor.detener(id);
    } catch (e) {
      console.error('No se pudo cerrar el túnel sin URL:', e);
    } finally {
      this.cerrando.delete(sitioId);
    }
    const seg = Math.round(this.esperaMs / 1000);
    return this.fijar({
      sitioId,
      estado: 'error',
      url: null,
      mensaje: `No apareció la URL del túnel en ${seg} s. Revise el log del túnel y que Nginx esté encendido.`,
    });
  }

  private async alEncontrarUrl(sitio: Sitio, url: string, gen: number): Promise<EstadoTunel> {
    if (this.gen(sitio.id) !== gen) return this.apagado(sitio.id);
    const sitioId = sitio.id;
    const pid = this.d.supervisor.pid(PREFIJO + sitioId);
    if (pid !== null) this.agregarRegistro({ sitioId, url, pid });
    let mensaje: string | undefined;
    if (this.mapa.get(sitioId)?.estado !== 'iniciando') return this.estadoActual(sitioId);
    if (sitio.urlBaseVar) {
      try {
        mensaje = (await this.d.urlBase.aplicar(sitio, `${url}/`)) ?? undefined;
      } catch (e) {
        mensaje = `No se pudo cambiar la URL base: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    // Si el proceso murió o se cerró durante la aplicación, no se pisa ese estado.
    const vigente = this.gen(sitioId) === gen;
    if (!vigente || this.mapa.get(sitioId)?.estado !== 'iniciando') {
      // Se cerró o murió mientras se aplicaba: se garantiza que el .env vuelva,
      // salvo que una apertura más nueva ya sea la dueña del túnel.
      const e = this.mapa.get(sitioId)?.estado;
      const hayNueva = !vigente && (e === 'iniciando' || e === 'activo');
      if (sitio.urlBaseVar && !hayNueva) await this.restaurarUrlBase(sitio);
      return this.estadoActual(sitioId);
    }
    return this.fijar({ sitioId, estado: 'activo', url, ...(mensaje ? { mensaje } : {}) });
  }

  private async alSalirProceso(id: string): Promise<void> {
    if (!id.startsWith(PREFIJO)) return;
    const sitioId = id.slice(PREFIJO.length);
    if (this.cerrando.has(sitioId)) return;
    const actual = this.mapa.get(sitioId);
    if (!actual || actual.estado === 'apagado' || actual.estado === 'error') return;
    this.fijar({ sitioId, estado: 'error', url: actual.url, mensaje: MSG_CERRADO });
    const sitio = await this.buscar(sitioId);
    if (sitio) await this.restaurarUrlBase(sitio);
    this.quitarRegistro(sitioId);
  }

  private async restaurarUrlBase(sitio: Sitio): Promise<void> {
    try {
      await this.d.urlBase.restaurar(sitio);
    } catch (e) {
      console.error('No se pudo restaurar la URL base:', e);
    }
  }

  private async buscar(sitioId: string): Promise<Sitio | undefined> {
    return (await this.d.sitios.listar()).find((s) => s.id === sitioId);
  }

  private estadoActual(sitioId: string): EstadoTunel {
    const a = this.mapa.get(sitioId);
    return a ? { ...a } : this.apagado(sitioId);
  }

  private apagado(sitioId: string): EstadoTunel {
    return { sitioId, estado: 'apagado', url: null };
  }

  private fijar(e: EstadoTunel): EstadoTunel {
    this.mapa.set(e.sitioId, e);
    this.d.eventos.emit('tunel:estado', { ...e });
    return { ...e };
  }

  private archivoRegistros(): string {
    return path.join(this.d.rutas.base, 'run', 'tuneles.json');
  }

  private leerRegistros(): RegistroTunel[] {
    try {
      const datos: unknown = JSON.parse(readFileSync(this.archivoRegistros(), 'utf8'));
      if (!Array.isArray(datos)) return [];
      return datos.filter(
        (r): r is RegistroTunel =>
          !!r &&
          typeof r.sitioId === 'string' &&
          typeof r.url === 'string' &&
          typeof r.pid === 'number',
      );
    } catch {
      return [];
    }
  }

  private escribirRegistros(registros: RegistroTunel[]): void {
    const destino = this.archivoRegistros();
    const tmp = `${destino}.tmp`;
    try {
      mkdirSync(path.dirname(destino), { recursive: true });
      writeFileSync(tmp, JSON.stringify(registros, null, 2));
      renameSync(tmp, destino);
    } catch (e) {
      console.error('No se pudo guardar tuneles.json:', e);
    }
  }

  private agregarRegistro(r: RegistroTunel): void {
    this.escribirRegistros([...this.leerRegistros().filter((x) => x.sitioId !== r.sitioId), r]);
  }

  private quitarRegistro(sitioId: string): void {
    this.escribirRegistros(this.leerRegistros().filter((x) => x.sitioId !== sitioId));
  }
}
