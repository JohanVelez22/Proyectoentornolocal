import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  statfs,
  utimes,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import { motorDe, type ObjetivoBd } from './basesDeDatos';
import { validarNombreBd } from './clienteMysql';
import { validarNombrePg } from './clientePostgres';
import type { ResultadoRestaurar } from './respaldos';

/** Una instantánea de una base: un volcado lógico con fecha y nota, propio de WolfCore Dev. */
export interface Instantanea {
  id: string;
  instancia: string;
  base: string;
  /** ISO 8601 (UTC). */
  fecha: string;
  nota: string;
  bytes: number;
  tablas: number;
  /** La tomó WolfCore Dev sola (antes de volver a otra); se conservan solo las últimas. */
  automatica: boolean;
}

/** Lo que Instantaneas necesita de `Respaldos` (en las pruebas, un doble que registra el orden). */
export interface RespaldosInstantaneas {
  respaldar(
    objetivo: ObjetivoBd,
    base: string,
    carpetaDestino?: string,
  ): Promise<{ archivo: string }>;
  restaurar(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
    opts?: { confirmarSobrescribir?: boolean },
  ): Promise<ResultadoRestaurar>;
  restaurarAcotada(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
  ): Promise<ResultadoRestaurar>;
  inspeccionar(objetivo: ObjetivoBd, archivo: string): Promise<{ tablas: number }>;
}

export interface DepsInstantaneas {
  rutas: Rutas;
  respaldos: RespaldosInstantaneas;
  /** Tablas y bytes de la base ahora mismo (solo lectura). */
  estadoBase(objetivo: ObjetivoBd, base: string): Promise<{ tablas: number; bytes: number }>;
  /** Deja una carpeta o archivo legible solo por el usuario (`Plataforma.restringirAlUsuario`). */
  restringir?: (ruta: string) => Promise<boolean>;
  /** Bytes libres de la unidad de `ruta` (por omisión `statfs`; pruebas). */
  espacioLibre?: (ruta: string) => Promise<number>;
  reloj?: () => Date;
  /** Tope de una instantánea (por omisión 4 GiB). */
  maxBytes?: number;
  /** Instantáneas manuales por base (por omisión 30). */
  maxPorBase?: number;
}

/** Tope de tamaño de una instantánea (de la base y del volcado). */
export const MAX_BYTES_INSTANTANEA = 4 * 1024 * 1024 * 1024;
export const MAX_INSTANTANEAS_POR_BASE = 30;
/** Instantáneas automáticas (previas a volver) que se conservan por base. */
export const MAX_AUTOMATICAS = 5;
/** Días que una instantánea borrada sigue en la papelera. */
export const DIAS_PAPELERA = 7;

const MB = 1024 * 1024;
const MAX_NOTA = 200;
const MAX_JSON = 64 * 1024;
const ID = /^\d{8}-\d{6}-[0-9a-f]{6}$/;
const DE_PAPELERA =
  /^[A-Za-z0-9._-]+__[A-Za-z0-9_$.-]+__\d{8}-\d{6}-[0-9a-f]{6}\.(?:dump|sql|json)$/;

interface Registro extends Instantanea {
  version: 1;
  motor: 'mysql' | 'mariadb' | 'postgresql';
  /** Nombre del volcado dentro de la carpeta: `<id>.dump` (PostgreSQL) o `<id>.sql`. */
  archivo: string;
  /** SHA-256 del volcado: se comprueba antes de restaurar. */
  sha256: string;
}

const publico = (r: Registro): Instantanea => ({
  id: r.id,
  instancia: r.instancia,
  base: r.base,
  fecha: r.fecha,
  nota: r.nota,
  bytes: r.bytes,
  tablas: r.tablas,
  automatica: r.automatica,
});

const sinControl = (t: string): string =>
  [...t].map((c) => (c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f ? ' ' : c)).join('');

function leerRegistro(texto: string): Registro | null {
  let o: unknown;
  try {
    o = JSON.parse(texto);
  } catch {
    return null;
  }
  if (o === null || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  const cadena = (k: string): string | null => (typeof r[k] === 'string' ? (r[k] as string) : null);
  const numero = (k: string): number | null =>
    typeof r[k] === 'number' && Number.isSafeInteger(r[k]) && (r[k] as number) >= 0
      ? (r[k] as number)
      : null;
  const id = cadena('id');
  const motor = cadena('motor');
  const archivo = cadena('archivo');
  const sha256 = cadena('sha256');
  const instancia = cadena('instancia');
  const base = cadena('base');
  const fecha = cadena('fecha');
  const nota = cadena('nota');
  const bytes = numero('bytes');
  const tablas = numero('tablas');
  if (
    r.version !== 1 ||
    id === null ||
    !ID.test(id) ||
    (motor !== 'mysql' && motor !== 'mariadb' && motor !== 'postgresql') ||
    archivo === null ||
    (archivo !== `${id}.dump` && archivo !== `${id}.sql`) ||
    sha256 === null ||
    !/^[0-9a-f]{64}$/.test(sha256) ||
    instancia === null ||
    base === null ||
    fecha === null ||
    Number.isNaN(Date.parse(fecha)) ||
    nota === null ||
    bytes === null ||
    tablas === null ||
    typeof r.automatica !== 'boolean'
  ) {
    return null;
  }
  return {
    version: 1,
    id,
    instancia,
    base,
    fecha,
    nota: sinControl(nota).slice(0, MAX_NOTA),
    bytes,
    tablas,
    automatica: r.automatica,
    motor,
    archivo,
    sha256,
  };
}

async function sha256De(ruta: string): Promise<string> {
  const h = createHash('sha256');
  for await (const t of createReadStream(ruta)) h.update(t as Buffer);
  return h.digest('hex');
}

/**
 * Instantáneas de base con un clic (D19). Una instantánea es un volcado lógico (`Respaldos`) más
 * un registro con su huella SHA-256, en `instantaneas/<instancia>/<base>/` dentro de la carpeta de
 * datos de WolfCore Dev, con permisos solo del usuario.
 *
 * Volver a una instantánea nunca pierde datos: antes se toma siempre una instantánea automática
 * del estado actual (si falla, no se restaura nada) y, si la restauración falla, se vuelve solo a
 * ese estado. El archivo se valida por su huella y se restaura con un usuario limitado a esa base
 * (`Respaldos.restaurarAcotada`): lo que traiga no toca otras bases.
 */
export class Instantaneas {
  private readonly colas = new Map<string, Promise<unknown>>();
  private raizRestringida = false;

  constructor(private readonly d: DepsInstantaneas) {}

  private ahora(): Date {
    return this.d.reloj?.() ?? new Date();
  }

  /** Una operación a la vez por base. */
  private async cerrojo<T>(instancia: string, base: string, fn: () => Promise<T>): Promise<T> {
    const clave = `${instancia}\u0000${base}`;
    const previa = this.colas.get(clave) ?? Promise.resolve();
    const esta = previa.then(fn, fn);
    const cola = esta.catch(() => undefined);
    this.colas.set(clave, cola);
    try {
      return await esta;
    } finally {
      if (this.colas.get(clave) === cola) this.colas.delete(clave);
    }
  }

  private resolver(instancia: ObjetivoBd, base: string): { motor: Registro['motor']; dir: string } {
    const motor = motorDe(instancia);
    if (motor === 'mongodb') {
      throw new ErrorWolf(
        'instantaneas.motor_no_soportado',
        'Las instantáneas son para MySQL, MariaDB y PostgreSQL.',
      );
    }
    if (motor === 'postgresql') validarNombrePg(base);
    else validarNombreBd(base);
    return { motor, dir: this.d.rutas.instantaneas(instancia, base) };
  }

  private async restringir(ruta: string): Promise<void> {
    await this.d.restringir?.(ruta).catch(() => false);
  }

  private async prepararCarpeta(dir: string): Promise<void> {
    if (!this.raizRestringida) {
      const raiz = path.join(this.d.rutas.base, 'instantaneas');
      await mkdir(raiz, { recursive: true });
      await this.restringir(raiz);
      this.raizRestringida = true;
    }
    const nueva = await mkdir(dir, { recursive: true });
    if (nueva !== undefined) await this.restringir(dir);
  }

  private async libre(ruta: string): Promise<number | null> {
    try {
      if (this.d.espacioLibre) return await this.d.espacioLibre(ruta);
      const s = await statfs(ruta);
      return Number(s.bavail) * Number(s.bsize);
    } catch {
      return null;
    }
  }

  private async leerTodas(dir: string): Promise<Registro[]> {
    let nombres: string[];
    try {
      nombres = await readdir(dir);
    } catch {
      return [];
    }
    const salida: Registro[] = [];
    for (const n of nombres) {
      const m = /^(\d{8}-\d{6}-[0-9a-f]{6})\.json$/.exec(n);
      if (!m) continue;
      const ruta = path.join(dir, n);
      try {
        const info = await lstat(ruta);
        if (!info.isFile() || info.size > MAX_JSON) continue;
        const r = leerRegistro(await readFile(ruta, 'utf8'));
        if (r && r.id === m[1]) salida.push(r);
      } catch {
        // un registro ilegible no se muestra ni se usa
      }
    }
    return salida.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  }

  /** Las instantáneas de una base, de la más reciente a la más antigua. */
  async lista(instancia: ObjetivoBd, base: string): Promise<Instantanea[]> {
    const { dir } = this.resolver(instancia, base);
    const salida: Instantanea[] = [];
    for (const r of await this.leerTodas(dir)) {
      if (r.base !== base || r.instancia !== instancia) continue;
      try {
        if ((await lstat(path.join(dir, r.archivo))).isFile()) salida.push(publico(r));
      } catch {
        // sin su volcado no sirve
      }
    }
    return salida;
  }

  /** Registro y ruta de una instantánea de esta base; el id no puede salir de su carpeta. */
  private async cargar(
    instancia: ObjetivoBd,
    base: string,
    id: string,
    exigirVolcado: boolean,
  ): Promise<{ reg: Registro; ruta: string; dir: string }> {
    if (typeof id !== 'string' || !ID.test(id)) {
      throw new ErrorWolf(
        'instantaneas.id_invalido',
        'El identificador de la instantánea no es válido.',
      );
    }
    const { motor, dir } = this.resolver(instancia, base);
    const archivoJson = path.join(dir, `${id}.json`);
    let reg: Registro | null = null;
    try {
      const info = await lstat(archivoJson);
      if (info.isFile() && info.size <= MAX_JSON) {
        reg = leerRegistro(await readFile(archivoJson, 'utf8'));
      }
    } catch {
      // se informa abajo
    }
    if (!reg || reg.id !== id) {
      throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
    }
    if (reg.base !== base || reg.instancia !== instancia || reg.motor !== motor) {
      throw new ErrorWolf(
        'instantaneas.otra_base',
        'Esta instantánea es de otra base: no se puede aplicar a esta.',
      );
    }
    const ruta = path.join(dir, reg.archivo);
    if (exigirVolcado) {
      let info;
      try {
        info = await lstat(ruta);
      } catch {
        throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
      }
      if (!info.isFile() || info.size !== reg.bytes) {
        throw new ErrorWolf(
          'instantaneas.huella_no_coincide',
          'El archivo de la instantánea cambió: no se restaura.',
        );
      }
    }
    return { reg, ruta, dir };
  }

  private async verificarHuella(reg: Registro, ruta: string): Promise<void> {
    let huella: string;
    try {
      huella = await sha256De(ruta);
    } catch {
      throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
    }
    if (huella !== reg.sha256) {
      throw new ErrorWolf(
        'instantaneas.huella_no_coincide',
        'El archivo de la instantánea cambió: no se restaura.',
      );
    }
  }

  /** Toma una instantánea de la base con una nota. */
  async tomar(instancia: ObjetivoBd, base: string, nota: string): Promise<Instantanea> {
    this.resolver(instancia, base);
    return this.cerrojo(instancia, base, async () =>
      publico(await this.tomarInterno(instancia, base, String(nota ?? ''), false)),
    );
  }

  private async tomarInterno(
    instancia: ObjetivoBd,
    base: string,
    nota: string,
    automatica: boolean,
  ): Promise<Registro> {
    const { motor, dir } = this.resolver(instancia, base);
    await this.prepararCarpeta(dir);
    const maxBytes = this.d.maxBytes ?? MAX_BYTES_INSTANTANEA;
    const demasiado = (): ErrorWolf =>
      new ErrorWolf(
        'instantaneas.demasiado_grande',
        `La base ${base} pesa más de lo que guarda una instantánea.`,
        { maximo: Math.floor(maxBytes / MB) },
      );
    const estado = await this.d.estadoBase(instancia, base);
    if (estado.bytes > maxBytes) throw demasiado();
    const libre = await this.libre(dir);
    const necesario = Math.ceil(estado.bytes * 1.2) + 64 * MB;
    if (libre !== null && libre < necesario) {
      throw new ErrorWolf(
        'instantaneas.sin_espacio',
        'No hay espacio libre suficiente para la instantánea.',
        { necesarios: Math.ceil(necesario / MB), libres: Math.floor(libre / MB) },
      );
    }
    const tope = this.d.maxPorBase ?? MAX_INSTANTANEAS_POR_BASE;
    if (!automatica) {
      const manuales = (await this.lista(instancia, base)).filter((x) => !x.automatica).length;
      if (manuales >= tope) {
        throw new ErrorWolf('instantaneas.limite', 'Hay demasiadas instantáneas de esta base.', {
          maximo: tope,
        });
      }
    }
    const staging = path.join(dir, `.tomando-${randomUUID()}`);
    await mkdir(staging, { recursive: true });
    const fecha = this.ahora();
    const id = `${fecha.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-')}-${randomBytes(3).toString('hex')}`;
    let final: string | null = null;
    try {
      let volcado: string;
      try {
        ({ archivo: volcado } = await this.d.respaldos.respaldar(instancia, base, staging));
      } catch (e) {
        throw new ErrorWolf(
          'instantaneas.tomar_fallo',
          `No se pudo tomar la instantánea de ${base}.`,
          undefined,
          { cause: e },
        );
      }
      const info = await lstat(volcado);
      if (!info.isFile() || info.size === 0) {
        throw new ErrorWolf(
          'instantaneas.tomar_fallo',
          `No se pudo tomar la instantánea de ${base}: el volcado quedó vacío.`,
        );
      }
      if (info.size > maxBytes) throw demasiado();
      const ext = path.extname(volcado).toLowerCase() === '.dump' ? '.dump' : '.sql';
      final = path.join(dir, `${id}${ext}`);
      await rename(volcado, final);
      const sha256 = await sha256De(final);
      const tablas = await this.d.respaldos
        .inspeccionar(instancia, final)
        .then((x) => x.tablas)
        .catch(() => estado.tablas);
      const reg: Registro = {
        version: 1,
        id,
        instancia,
        base,
        fecha: fecha.toISOString(),
        nota: sinControl(nota).trim().slice(0, MAX_NOTA),
        bytes: info.size,
        tablas,
        automatica,
        motor,
        archivo: `${id}${ext}`,
        sha256,
      };
      const json = path.join(dir, `${id}.json`);
      await writeFile(`${json}.tmp`, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');
      await rename(`${json}.tmp`, json);
      await this.restringir(final);
      await this.restringir(json);
      if (automatica) await this.podarAutomaticas(instancia, base, dir);
      return reg;
    } catch (e) {
      if (final) await rm(final, { force: true }).catch(() => undefined);
      throw e;
    } finally {
      await rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(
        () => undefined,
      );
    }
  }

  /** Solo se conservan las últimas automáticas; las demás van a la papelera. */
  private async podarAutomaticas(instancia: string, base: string, dir: string): Promise<void> {
    const autos = (await this.leerTodas(dir)).filter(
      (r) => r.automatica && r.base === base && r.instancia === instancia,
    );
    for (const r of autos.slice(MAX_AUTOMATICAS)) {
      await this.aPapelera(dir, r).catch(() => undefined);
    }
  }

  /** Lo que se vería antes de volver: la instantánea y cómo está la base ahora. */
  async vistaPrevia(
    instancia: ObjetivoBd,
    base: string,
    id: string,
  ): Promise<{ instantanea: Instantanea; estadoActual: { tablas: number; bytes: number } }> {
    const { reg } = await this.cargar(instancia, base, id, true);
    return {
      instantanea: publico(reg),
      estadoActual: await this.d.estadoBase(instancia, base),
    };
  }

  /**
   * Vuelve la base a la instantánea. `confirmado` debe ser `true`. Antes toma una instantánea
   * automática del estado actual: si no se puede, no se restaura. Si la restauración falla, la
   * base vuelve sola a ese estado.
   */
  async volver(
    instancia: ObjetivoBd,
    base: string,
    id: string,
    confirmado: true,
  ): Promise<{ respaldoPrevio: Instantanea; advertencias: string[] }> {
    if ((confirmado as unknown) !== true) {
      throw new ErrorWolf(
        'instantaneas.sin_confirmar',
        'Confirme que quiere volver a esta instantánea.',
      );
    }
    this.resolver(instancia, base);
    return this.cerrojo(instancia, base, async () => {
      const { reg, ruta, dir } = await this.cargar(instancia, base, id, true);
      // El archivo es lo que se restaura: se comprueba antes de tocar la base.
      await this.verificarHuella(reg, ruta);
      let previa: Registro;
      try {
        previa = await this.tomarInterno(
          instancia,
          base,
          `Antes de volver a la instantánea del ${reg.fecha.slice(0, 16).replace('T', ' ')}`,
          true,
        );
      } catch (e) {
        if (
          e instanceof ErrorWolf &&
          (e.codigo === 'instantaneas.sin_espacio' || e.codigo === 'instantaneas.demasiado_grande')
        ) {
          throw e;
        }
        throw new ErrorWolf(
          'instantaneas.respaldo_previo_fallo',
          'No se pudo guardar el estado actual de la base: no se restauró nada.',
          undefined,
          { cause: e },
        );
      }
      try {
        const r = await this.d.respaldos.restaurarAcotada(instancia, ruta, base);
        return { respaldoPrevio: publico(previa), advertencias: r.advertencias };
      } catch (e) {
        try {
          const rutaPrevia = path.join(dir, previa.archivo);
          await this.verificarHuella(previa, rutaPrevia);
          await this.d.respaldos.restaurar(instancia, rutaPrevia, base, {
            confirmarSobrescribir: true,
          });
        } catch {
          throw new ErrorWolf(
            'instantaneas.restauracion_sin_revertir',
            'No se pudo restaurar la instantánea ni volver al estado anterior: está guardado en una instantánea automática.',
            { respaldo: previa.id },
            { cause: e },
          );
        }
        throw new ErrorWolf(
          'instantaneas.restauracion_fallo',
          'No se pudo restaurar la instantánea; la base volvió a como estaba.',
          undefined,
          { cause: e },
        );
      }
    });
  }

  private async aPapelera(dir: string, reg: Registro): Promise<void> {
    const pap = this.d.rutas.papelera();
    await mkdir(pap, { recursive: true });
    await this.restringir(pap);
    const instancia = reg.instancia.replace(/[^A-Za-z0-9._-]/g, '_');
    const prefijo = `${instancia}__${reg.base}__${reg.id}`;
    const ahora = this.ahora();
    const mover = async (origen: string, destino: string): Promise<void> => {
      try {
        if (!(await lstat(origen)).isFile()) return;
      } catch {
        return;
      }
      await rename(origen, destino);
      // La papelera cuenta desde que se borró, no desde que se tomó.
      await utimes(destino, ahora, ahora).catch(() => undefined);
    };
    await mover(
      path.join(dir, reg.archivo),
      path.join(pap, `${prefijo}${path.extname(reg.archivo)}`),
    );
    await mover(path.join(dir, `${reg.id}.json`), path.join(pap, `${prefijo}.json`));
  }

  /** Mueve la instantánea a la papelera (se purga a los 7 días). */
  async borrar(instancia: ObjetivoBd, base: string, id: string): Promise<void> {
    this.resolver(instancia, base);
    await this.cerrojo(instancia, base, async () => {
      const { reg, dir } = await this.cargar(instancia, base, id, false);
      await this.aPapelera(dir, reg);
    });
    await this.purgarPapelera().catch(() => 0);
  }

  /** Quita de la papelera lo que lleva más de 7 días. Devuelve cuántos archivos borró. */
  async purgarPapelera(): Promise<number> {
    const pap = this.d.rutas.papelera();
    let nombres: string[];
    try {
      nombres = await readdir(pap);
    } catch {
      return 0;
    }
    const limite = this.ahora().getTime() - DIAS_PAPELERA * 24 * 60 * 60 * 1000;
    let n = 0;
    for (const nombre of nombres) {
      // Solo lo que esta papelera escribió; nunca enlaces ni carpetas.
      if (!DE_PAPELERA.test(nombre)) continue;
      const ruta = path.join(pap, nombre);
      try {
        const info = await lstat(ruta);
        if (!info.isFile() || info.mtimeMs >= limite) continue;
        await rm(ruta, { force: true });
        n++;
      } catch {
        // se intenta de nuevo la próxima vez
      }
    }
    return n;
  }
}
