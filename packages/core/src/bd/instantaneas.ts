import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  statfs,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { Rutas } from '../rutas';
import { motorDe, type ObjetivoBd } from './basesDeDatos';
import { CerrojoBases } from './cerrojoBases';
import { validarNombreBd } from './clienteMysql';
import { validarNombrePg } from './clientePostgres';
import { ErrorBaseTocada, EXTENSIONES_PERMITIDAS, type ResultadoRestaurar } from './respaldos';

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
  /** Automática: id de la instantánea a la que se iba a volver (la interfaz arma el texto). */
  origen: string | null;
  /**
   * Extensiones de PostgreSQL del volcado que el camino acotado no acepta: si el registro de
   * huellas se perdiera, esta instantánea no se podría restaurar.
   */
  extensionesNoPermitidas: string[];
}

/** Una instantánea en la papelera. */
export interface InstantaneaBorrada extends Instantanea {
  /** Cuándo se borró (ISO 8601). */
  borrada: string;
}

/** Lo que Instantaneas necesita de `Respaldos` (en las pruebas, un doble que registra el orden). */
export interface RespaldosInstantaneas {
  respaldar(
    objetivo: ObjetivoBd,
    base: string,
    carpetaDestino?: string,
    opciones?: { eventos?: boolean; senal?: AbortSignal },
  ): Promise<{ archivo: string }>;
  restaurarAcotada(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
  ): Promise<ResultadoRestaurar>;
  restaurarEstricta(
    objetivo: ObjetivoBd,
    archivo: string,
    base: string,
  ): Promise<ResultadoRestaurar>;
  inspeccionar(
    objetivo: ObjetivoBd,
    archivo: string,
  ): Promise<{ tablas: number; extensiones?: string[] }>;
}

export interface DepsInstantaneas {
  rutas: Rutas;
  respaldos: RespaldosInstantaneas;
  /** Tablas y bytes de la base ahora mismo (solo lectura); sin la base, ceros. */
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
  /** Cerrojo compartido con las demás operaciones de base del núcleo. */
  cerrojo?: CerrojoBases;
  /** Cada cuánto se vigila el tamaño del volcado en curso (por omisión 1 s; pruebas). */
  intervaloVigilanciaMs?: number;
}

/** Tope de tamaño de una instantánea (de la base y del volcado). */
export const MAX_BYTES_INSTANTANEA = 4 * 1024 * 1024 * 1024;
export const MAX_INSTANTANEAS_POR_BASE = 30;
/** Instantáneas automáticas (previas a volver) que se conservan por base. */
export const MAX_AUTOMATICAS = 5;
/** Días que una instantánea borrada sigue en la papelera. */
export const DIAS_PAPELERA = 7;

const MB = 1024 * 1024;
/** Espacio libre mínimo que debe quedar mientras se vuelca. */
const MIN_LIBRE = 64 * MB;
const MAX_NOTA = 200;
const MAX_JSON = 64 * 1024;
const ID = /^\d{8}-\d{6}-[0-9a-f]{6}$/;
const DE_PAPELERA =
  /^[A-Za-z0-9._-]+__[A-Za-z0-9_$.-]+__\d{8}-\d{6}-[0-9a-f]{6}\.(?:dump|sql|json|borrado)$/;

interface Registro extends Instantanea {
  version: 1;
  motor: 'mysql' | 'mariadb' | 'postgresql';
  /** Nombre del volcado dentro de la carpeta: `<id>.dump` (PostgreSQL) o `<id>.sql`. */
  archivo: string;
  /** SHA-256 del volcado: se comprueba antes de restaurar. */
  sha256: string;
}

interface EntradaHuella {
  sha256: string;
  motor: string;
  instancia: string;
  base: string;
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
  origen: r.origen,
  extensionesNoPermitidas: r.extensionesNoPermitidas,
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
  const origen = r.origen === undefined || r.origen === null ? null : cadena('origen');
  const ext = r.extensionesNoPermitidas ?? [];
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
    typeof r.automatica !== 'boolean' ||
    (origen !== null && !ID.test(origen)) ||
    !Array.isArray(ext) ||
    ext.length > 50 ||
    !ext.every((x) => typeof x === 'string' && x.length <= 64)
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
    origen,
    extensionesNoPermitidas: ext as string[],
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

/** Escribe un archivo de texto de forma atómica (temporal y renombrado). */
async function escribirAtomico(ruta: string, texto: string): Promise<void> {
  const tmp = `${ruta}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    await writeFile(tmp, texto, 'utf8');
    await rename(tmp, ruta);
  } catch (e) {
    await rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

/**
 * Instantáneas de base con un clic (D19). Una instantánea es un volcado lógico (`Respaldos`) más
 * un registro con su huella SHA-256, en `instantaneas/<instancia>/<base>/` dentro de la carpeta de
 * datos de WolfCore Dev, con permisos solo del usuario.
 *
 * Además, la huella de cada instantánea se anota **fuera** de esa carpeta
 * (`etc/instantaneas-huellas.json`). Al volver se copia el volcado a una carpeta privada y se
 * calcula la huella de la copia: si coincide con ese registro se restaura como administrador y en
 * modo estricto (conserva dueños, privilegios y extensiones); si no está o no coincide, se usa el
 * camino acotado, con un usuario limitado a la base.
 *
 * Volver nunca pierde datos: antes se toma una instantánea automática del estado actual (salvo que
 * la base no exista o esté vacía, o que el usuario elija seguir sin ella) y, si la restauración
 * falla después de tocar la base, se vuelve sola a ese estado.
 */
export class Instantaneas {
  private readonly cerrojoBases: CerrojoBases;
  private raizRestringida = false;
  private colaHuellas: Promise<unknown> = Promise.resolve();

  constructor(private readonly d: DepsInstantaneas) {
    this.cerrojoBases = d.cerrojo ?? new CerrojoBases();
  }

  private ahora(): Date {
    return this.d.reloj?.() ?? new Date();
  }

  private cerrojo<T>(instancia: string, base: string, fn: () => Promise<T>): Promise<T> {
    return this.cerrojoBases.con(instancia, base, fn);
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

  private async restringir(ruta: string): Promise<boolean> {
    return (await this.d.restringir?.(ruta).catch(() => false)) === true;
  }

  private async prepararCarpeta(dir: string): Promise<void> {
    if (!this.raizRestringida) {
      const raiz = path.join(this.d.rutas.base, 'instantaneas');
      await mkdir(raiz, { recursive: true });
      // Solo se da por hecho si el sistema pudo restringirla; si no, se intenta de nuevo.
      this.raizRestringida = await this.restringir(raiz);
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

  // ---- Registro de huellas (fuera de la carpeta de las instantáneas) ----

  private async leerHuellas(): Promise<Record<string, EntradaHuella>> {
    try {
      const o: unknown = JSON.parse(await readFile(this.d.rutas.huellasInstantaneas(), 'utf8'));
      return o !== null && typeof o === 'object' && !Array.isArray(o)
        ? (o as Record<string, EntradaHuella>)
        : {};
    } catch {
      return {};
    }
  }

  private anotarHuella(id: string, e: EntradaHuella): Promise<void> {
    const ruta = this.d.rutas.huellasInstantaneas();
    const hacer = async (): Promise<void> => {
      const todas = await this.leerHuellas();
      todas[id] = e;
      await mkdir(path.dirname(ruta), { recursive: true });
      await escribirAtomico(ruta, `${JSON.stringify(todas, null, 2)}\n`);
      await this.restringir(ruta);
    };
    const esta = this.colaHuellas.then(hacer, hacer);
    this.colaHuellas = esta.catch(() => undefined);
    return esta;
  }

  /**
   * Copia el volcado a una carpeta privada y comprueba su huella: contra el registro de la
   * instantánea y contra el registro de huellas. `confiable` = ambos coinciden (el archivo lo
   * hizo WolfCore Dev en este equipo y no cambió).
   */
  private async copiaVerificada(
    dir: string,
    reg: Registro,
  ): Promise<{ ruta: string; confiable: boolean; limpiar: () => Promise<void> }> {
    const tmp = path.join(this.d.rutas.tmp(), `instantanea-${randomUUID()}`);
    await mkdir(tmp, { recursive: true });
    await this.restringir(tmp);
    const limpiar = (): Promise<void> =>
      rm(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch(
        () => undefined,
      );
    try {
      const ruta = path.join(tmp, reg.archivo);
      const origen = path.join(dir, reg.archivo);
      if (!(await lstat(origen)).isFile()) throw new Error('no es un archivo');
      await copyFile(origen, ruta);
      await this.restringir(ruta);
      // Lo que se restaura es la copia: lo que se verifica es la copia.
      const huella = await sha256De(ruta);
      if (huella !== reg.sha256) {
        throw new ErrorWolf(
          'instantaneas.huella_no_coincide',
          'El archivo de la instantánea cambió: no se restaura.',
        );
      }
      const e = (await this.leerHuellas())[reg.id];
      const confiable =
        !!e &&
        e.sha256 === huella &&
        e.motor === reg.motor &&
        e.instancia === reg.instancia &&
        e.base === reg.base;
      return { ruta, confiable, limpiar };
    } catch (e) {
      await limpiar();
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
    }
  }

  // ---- Lectura ----

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
      try {
        const ruta = path.join(dir, n);
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

  private async conVolcado(dir: string, regs: Registro[]): Promise<Registro[]> {
    const salida: Registro[] = [];
    for (const r of regs) {
      try {
        if ((await lstat(path.join(dir, r.archivo))).isFile()) salida.push(r);
      } catch {
        // sin su volcado no sirve
      }
    }
    return salida;
  }

  /** Las instantáneas de una base, de la más reciente a la más antigua. */
  async lista(instancia: ObjetivoBd, base: string): Promise<Instantanea[]> {
    const { dir } = this.resolver(instancia, base);
    const regs = (await this.leerTodas(dir)).filter(
      (r) => r.base === base && r.instancia === instancia,
    );
    return (await this.conVolcado(dir, regs)).map(publico);
  }

  /**
   * Las instantáneas de todas las bases de una instancia, también las de bases que ya no existen
   * (para poder recuperarlas).
   */
  async listaInstancia(instancia: ObjetivoBd): Promise<Instantanea[]> {
    const motor = motorDe(instancia);
    if (motor === 'mongodb') return [];
    const raiz = this.d.rutas.instantaneasDeInstancia(instancia);
    let carpetas: string[];
    try {
      carpetas = await readdir(raiz);
    } catch {
      return [];
    }
    const salida: Instantanea[] = [];
    for (const c of carpetas) {
      const dir = path.join(raiz, c);
      const regs = (await this.leerTodas(dir)).filter(
        (r) => r.instancia === instancia && this.d.rutas.instantaneas(instancia, r.base) === dir,
      );
      salida.push(...(await this.conVolcado(dir, regs)).map(publico));
    }
    return salida.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  /** Registro y ruta de una instantánea de esta base; el id no puede salir de su carpeta. */
  private async cargar(
    instancia: ObjetivoBd,
    base: string,
    id: string,
    exigirVolcado: boolean,
  ): Promise<{ reg: Registro; ruta: string; dir: string }> {
    this.validarId(id);
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

  private validarId(id: unknown): asserts id is string {
    if (typeof id !== 'string' || !ID.test(id)) {
      throw new ErrorWolf(
        'instantaneas.id_invalido',
        'El identificador de la instantánea no es válido.',
      );
    }
  }

  // ---- Tomar ----

  /** Toma una instantánea de la base con una nota. */
  async tomar(instancia: ObjetivoBd, base: string, nota: string): Promise<Instantanea> {
    this.resolver(instancia, base);
    return this.cerrojo(instancia, base, async () =>
      publico(await this.tomarInterno(instancia, base, String(nota ?? ''), null)),
    );
  }

  /** `origen` distinto de null = automática (previa a volver a esa instantánea). */
  private async tomarInterno(
    instancia: ObjetivoBd,
    base: string,
    nota: string,
    origen: string | null,
  ): Promise<Registro> {
    const automatica = origen !== null;
    const { motor, dir } = this.resolver(instancia, base);
    await this.prepararCarpeta(dir);
    const maxBytes = this.d.maxBytes ?? MAX_BYTES_INSTANTANEA;
    const demasiado = (): ErrorWolf =>
      new ErrorWolf(
        'instantaneas.demasiado_grande',
        `La base ${base} pesa más de lo que guarda una instantánea.`,
        { maximo: Math.floor(maxBytes / MB) },
      );
    const sinEspacio = (necesario: number, libre: number): ErrorWolf =>
      new ErrorWolf(
        'instantaneas.sin_espacio',
        'No hay espacio libre suficiente para la instantánea.',
        {
          necesarios: Math.ceil(necesario / MB),
          libres: Math.floor(libre / MB),
        },
      );
    const estado = await this.d.estadoBase(instancia, base);
    // PostgreSQL guarda un volcado comprimido: el tamaño de la base (pg_database_size) no dice
    // cuánto pesará, así que no se compara. Se vigila el tamaño real mientras se vuelca.
    if (motor !== 'postgresql') {
      if (estado.bytes > maxBytes) throw demasiado();
      const libre = await this.libre(dir);
      const necesario = Math.ceil(estado.bytes * 1.2) + MIN_LIBRE;
      if (libre !== null && libre < necesario) throw sinEspacio(necesario, libre);
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
      const volcado = await this.volcar(
        instancia,
        base,
        staging,
        dir,
        maxBytes,
        demasiado,
        sinEspacio,
      );
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
      const dentro = await this.d.respaldos
        .inspeccionar(instancia, final)
        .catch(() => ({ tablas: estado.tablas, extensiones: [] as string[] }));
      const reg: Registro = {
        version: 1,
        id,
        instancia,
        base,
        fecha: fecha.toISOString(),
        nota: automatica ? '' : sinControl(nota).trim().slice(0, MAX_NOTA),
        bytes: info.size,
        tablas: dentro.tablas,
        automatica,
        origen,
        extensionesNoPermitidas: (dentro.extensiones ?? []).filter(
          (x) => !EXTENSIONES_PERMITIDAS.includes(x),
        ),
        motor,
        archivo: `${id}${ext}`,
        sha256,
      };
      // La huella se anota fuera de la carpeta antes de dar por buena la instantánea.
      await this.anotarHuella(id, { sha256, motor, instancia, base });
      await escribirAtomico(path.join(dir, `${id}.json`), `${JSON.stringify(reg, null, 2)}\n`);
      await this.restringir(final);
      await this.restringir(path.join(dir, `${id}.json`));
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

  /** El volcado, vigilado: se corta si pasa del tope o si se acaba el espacio libre. */
  private async volcar(
    instancia: ObjetivoBd,
    base: string,
    staging: string,
    dir: string,
    maxBytes: number,
    demasiado: () => ErrorWolf,
    sinEspacio: (necesario: number, libre: number) => ErrorWolf,
  ): Promise<string> {
    const ctl = new AbortController();
    let causa: ErrorWolf | null = null;
    let vigilando = false;
    const vigilar = async (): Promise<void> => {
      if (vigilando || causa) return;
      vigilando = true;
      try {
        let total = 0;
        for (const n of await readdir(staging)) total += (await lstat(path.join(staging, n))).size;
        if (total > maxBytes) causa = demasiado();
        else {
          const libre = await this.libre(dir);
          if (libre !== null && libre < MIN_LIBRE) causa = sinEspacio(MIN_LIBRE, libre);
        }
        if (causa) ctl.abort();
      } catch {
        // la próxima vuelta lo intenta de nuevo
      } finally {
        vigilando = false;
      }
    };
    const timer = setInterval(() => void vigilar(), this.d.intervaloVigilanciaMs ?? 1000);
    try {
      const { archivo } = await this.d.respaldos.respaldar(instancia, base, staging, {
        eventos: true,
        senal: ctl.signal,
      });
      await vigilar();
      if (causa) throw causa;
      return archivo;
    } catch (e) {
      if (causa) throw causa;
      if (e instanceof ErrorWolf) throw e;
      throw new ErrorWolf(
        'instantaneas.tomar_fallo',
        `No se pudo tomar la instantánea de ${base}.`,
        undefined,
        { cause: e },
      );
    } finally {
      clearInterval(timer);
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

  // ---- Volver ----

  /**
   * Vuelve la base a la instantánea. `confirmado` debe ser `true`. Antes toma una instantánea
   * automática del estado actual (si la base tiene tablas): si no se puede, no restaura, salvo
   * que se pida `sinGuardarEstado` (segunda confirmación de la interfaz). Si la restauración
   * falla después de tocar la base, la base vuelve sola a ese estado.
   */
  async volver(
    instancia: ObjetivoBd,
    base: string,
    id: string,
    confirmado: true,
    opciones: { sinGuardarEstado?: boolean } = {},
  ): Promise<{ respaldoPrevio: Instantanea | null; advertencias: string[] }> {
    if ((confirmado as unknown) !== true) {
      throw new ErrorWolf(
        'instantaneas.sin_confirmar',
        'Confirme que quiere volver a esta instantánea.',
      );
    }
    this.resolver(instancia, base);
    return this.cerrojo(instancia, base, async () => {
      const { reg, dir } = await this.cargar(instancia, base, id, true);
      // La copia privada se verifica y es la que se restaura: nada cambia entre revisar y usar.
      const copia = await this.copiaVerificada(dir, reg);
      try {
        const estado = await this.d.estadoBase(instancia, base);
        let previa: Registro | null = null;
        // Sin tablas (la base no existe o está vacía) no hay nada que perder.
        if (estado.tablas > 0 && opciones.sinGuardarEstado !== true) {
          try {
            previa = await this.tomarInterno(instancia, base, '', reg.id);
          } catch (e) {
            if (
              e instanceof ErrorWolf &&
              (e.codigo === 'instantaneas.sin_espacio' ||
                e.codigo === 'instantaneas.demasiado_grande')
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
        }
        let r: ResultadoRestaurar;
        try {
          r = await this.restaurar(instancia, base, copia);
        } catch (e) {
          if (!(e instanceof ErrorBaseTocada)) throw e;
          throw await this.revertir(instancia, base, dir, previa, estado.tablas > 0, e);
        }
        // La poda va después de una restauración correcta y nunca toca a la que se aplicó.
        await this.podarAutomaticas(instancia, base, dir, reg.id);
        return { respaldoPrevio: previa ? publico(previa) : null, advertencias: r.advertencias };
      } finally {
        await copia.limpiar();
      }
    });
  }

  private restaurar(
    instancia: ObjetivoBd,
    base: string,
    copia: { ruta: string; confiable: boolean },
  ): Promise<ResultadoRestaurar> {
    return copia.confiable
      ? this.d.respaldos.restaurarEstricta(instancia, copia.ruta, base)
      : this.d.respaldos.restaurarAcotada(instancia, copia.ruta, base);
  }

  /** La restauración tocó la base y falló: vuelve al estado anterior y devuelve el error final. */
  private async revertir(
    instancia: ObjetivoBd,
    base: string,
    dir: string,
    previa: Registro | null,
    habiaDatos: boolean,
    fallo: ErrorBaseTocada,
  ): Promise<ErrorWolf> {
    const detalle = (fallo.message || '').replace(/\s+/g, ' ').slice(0, 200);
    if (!previa) {
      return new ErrorWolf(
        habiaDatos ? 'instantaneas.restauracion_sin_copia' : 'instantaneas.restauracion_fallo',
        'No se pudo restaurar la instantánea.',
        { detalle },
        { cause: fallo },
      );
    }
    let copiaPrevia: Awaited<ReturnType<Instantaneas['copiaVerificada']>> | null = null;
    try {
      copiaPrevia = await this.copiaVerificada(dir, previa);
      await this.restaurar(instancia, base, copiaPrevia);
    } catch {
      return new ErrorWolf(
        'instantaneas.restauracion_sin_revertir',
        'No se pudo restaurar la instantánea ni volver al estado anterior: está guardado en una instantánea automática.',
        { respaldo: previa.id },
        { cause: fallo },
      );
    } finally {
      await copiaPrevia?.limpiar();
    }
    return new ErrorWolf(
      'instantaneas.restauracion_fallo',
      'No se pudo restaurar la instantánea; la base volvió a como estaba.',
      { detalle },
      { cause: fallo },
    );
  }

  /** Solo se conservan las últimas automáticas; las demás van a la papelera (salvo `excepto`). */
  private async podarAutomaticas(
    instancia: string,
    base: string,
    dir: string,
    excepto: string,
  ): Promise<void> {
    const autos = (await this.leerTodas(dir)).filter(
      (r) => r.automatica && r.base === base && r.instancia === instancia,
    );
    // Sobran las más antiguas, pero nunca la instantánea a la que se acaba de volver.
    const sobran = autos.length - MAX_AUTOMATICAS;
    const candidatas = autos.filter((r) => r.id !== excepto).reverse();
    for (const r of candidatas.slice(0, Math.max(0, sobran))) {
      await this.aPapelera(dir, r).catch(() => undefined);
    }
  }

  // ---- Papelera ----

  private prefijoPapelera(r: { instancia: string; base: string; id: string }): string {
    return `${r.instancia.replace(/[^A-Za-z0-9._-]/g, '_')}__${r.base}__${r.id}`;
  }

  private async aPapelera(dir: string, reg: Registro): Promise<void> {
    const pap = this.d.rutas.papelera();
    await mkdir(pap, { recursive: true });
    await this.restringir(pap);
    const prefijo = this.prefijoPapelera(reg);
    // La fecha de borrado se anota en un archivo propio: no depende de la fecha del sistema de archivos.
    await escribirAtomico(path.join(pap, `${prefijo}.borrado`), `${this.ahora().toISOString()}\n`);
    const mover = async (origen: string, destino: string): Promise<void> => {
      try {
        if (!(await lstat(origen)).isFile()) return;
      } catch {
        return;
      }
      await rename(origen, destino);
    };
    await mover(
      path.join(dir, reg.archivo),
      path.join(pap, `${prefijo}${path.extname(reg.archivo)}`),
    );
    await mover(path.join(dir, `${reg.id}.json`), path.join(pap, `${prefijo}.json`));
  }

  /** Mueve la instantánea a la papelera (se purga a los 7 días y se puede recuperar). */
  async borrar(instancia: ObjetivoBd, base: string, id: string): Promise<void> {
    this.resolver(instancia, base);
    await this.cerrojo(instancia, base, async () => {
      const { reg, dir } = await this.cargar(instancia, base, id, false);
      await this.aPapelera(dir, reg);
    });
    await this.purgarPapelera().catch(() => 0);
  }

  /** Las instantáneas de una base que están en la papelera. */
  async papelera(instancia: ObjetivoBd, base: string): Promise<InstantaneaBorrada[]> {
    this.resolver(instancia, base);
    const pap = this.d.rutas.papelera();
    let nombres: string[];
    try {
      nombres = await readdir(pap);
    } catch {
      return [];
    }
    const salida: InstantaneaBorrada[] = [];
    for (const n of nombres) {
      const m = /^(.+)__(\d{8}-\d{6}-[0-9a-f]{6})\.json$/.exec(n);
      if (!m || !DE_PAPELERA.test(n)) continue;
      try {
        const r = leerRegistro(await readFile(path.join(pap, n), 'utf8'));
        if (!r || r.id !== m[2] || r.base !== base || r.instancia !== instancia) continue;
        const prefijo = this.prefijoPapelera(r);
        if (n !== `${prefijo}.json`) continue;
        const borrada = (
          await readFile(path.join(pap, `${prefijo}.borrado`), 'utf8').catch(() => '')
        ).trim();
        const dump = await lstat(path.join(pap, `${prefijo}${path.extname(r.archivo)}`)).catch(
          () => null,
        );
        if (!dump?.isFile()) continue;
        salida.push({
          ...publico(r),
          borrada: Number.isNaN(Date.parse(borrada))
            ? new Date(dump.mtimeMs).toISOString()
            : borrada,
        });
      } catch {
        // ilegible: no se muestra
      }
    }
    return salida.sort((a, b) => b.borrada.localeCompare(a.borrada));
  }

  /** Saca una instantánea de la papelera y la deja en la lista de su base. */
  async recuperar(instancia: ObjetivoBd, base: string, id: string): Promise<Instantanea> {
    this.validarId(id);
    const { motor, dir } = this.resolver(instancia, base);
    return this.cerrojo(instancia, base, async () => {
      const pap = this.d.rutas.papelera();
      const probe = { instancia, base, id };
      const prefijo = this.prefijoPapelera(probe);
      let reg: Registro | null = null;
      try {
        reg = leerRegistro(await readFile(path.join(pap, `${prefijo}.json`), 'utf8'));
      } catch {
        // abajo
      }
      if (
        !reg ||
        reg.id !== id ||
        reg.base !== base ||
        reg.instancia !== instancia ||
        reg.motor !== motor
      ) {
        throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
      }
      const origenDump = path.join(pap, `${prefijo}${path.extname(reg.archivo)}`);
      if (!(await lstat(origenDump).catch(() => null))?.isFile()) {
        throw new ErrorWolf('instantaneas.no_encontrada', 'No se encontró la instantánea.');
      }
      await this.prepararCarpeta(dir);
      await rename(origenDump, path.join(dir, reg.archivo));
      await rename(path.join(pap, `${prefijo}.json`), path.join(dir, `${id}.json`));
      await rm(path.join(pap, `${prefijo}.borrado`), { force: true }).catch(() => undefined);
      return publico(reg);
    });
  }

  /** Quita de la papelera lo que lleva más de 7 días. Devuelve cuántos volcados y registros borró. */
  async purgarPapelera(): Promise<number> {
    const pap = this.d.rutas.papelera();
    let nombres: string[];
    try {
      nombres = await readdir(pap);
    } catch {
      return 0;
    }
    const limite = this.ahora().getTime() - DIAS_PAPELERA * 24 * 60 * 60 * 1000;
    const fechas = new Map<string, number>();
    for (const n of nombres) {
      if (!DE_PAPELERA.test(n) || !n.endsWith('.borrado')) continue;
      const t = Date.parse((await readFile(path.join(pap, n), 'utf8').catch(() => '')).trim());
      if (!Number.isNaN(t)) fechas.set(n.slice(0, -'.borrado'.length), t);
    }
    let cuantos = 0;
    for (const nombre of nombres) {
      // Solo lo que esta papelera escribió; nunca enlaces ni carpetas.
      if (!DE_PAPELERA.test(nombre) || nombre.endsWith('.borrado')) continue;
      const ruta = path.join(pap, nombre);
      try {
        const info = await lstat(ruta);
        if (!info.isFile()) continue;
        const desde = fechas.get(nombre.slice(0, nombre.lastIndexOf('.'))) ?? info.mtimeMs;
        if (desde >= limite) continue;
        await rm(ruta, { force: true });
        cuantos++;
      } catch {
        // se intenta de nuevo la próxima vez
      }
    }
    // Una marca de fecha sin volcado ni registro ya no sirve.
    const quedan = new Set(await readdir(pap).catch(() => [] as string[]));
    for (const [prefijo, t] of fechas) {
      if (
        t < limite ||
        (!quedan.has(`${prefijo}.json`) &&
          !quedan.has(`${prefijo}.sql`) &&
          !quedan.has(`${prefijo}.dump`))
      ) {
        await rm(path.join(pap, `${prefijo}.borrado`), { force: true }).catch(() => undefined);
      }
    }
    return cuantos;
  }

  /**
   * Al arrancar: quita las carpetas `.tomando-*` y los temporales que dejó una instantánea
   * interrumpida, y los volcados que no llegaron a tener su registro. Devuelve cuántos quitó.
   */
  async limpiarHuerfanos(): Promise<number> {
    const raiz = path.join(this.d.rutas.base, 'instantaneas');
    let n = 0;
    const listar = (d: string): Promise<string[]> => readdir(d).catch(() => []);
    for (const inst of await listar(raiz)) {
      for (const carpeta of await listar(path.join(raiz, inst))) {
        const dir = path.join(raiz, inst, carpeta);
        const nombres = await listar(dir);
        const jsons = new Set(nombres.filter((x) => x.endsWith('.json')));
        for (const nombre of nombres) {
          const huerfano =
            nombre.startsWith('.tomando-') ||
            /\.tmp$/.test(nombre) ||
            (/^(\d{8}-\d{6}-[0-9a-f]{6})\.(?:sql|dump)$/.test(nombre) &&
              !jsons.has(`${nombre.replace(/\.(?:sql|dump)$/, '')}.json`));
          if (!huerfano) continue;
          const ruta = path.join(dir, nombre);
          try {
            // Nunca se sigue un enlace.
            await lstat(ruta);
            await rm(ruta, { recursive: true, force: true });
            n++;
          } catch {
            // se intenta la próxima vez
          }
        }
      }
    }
    return n;
  }
}
