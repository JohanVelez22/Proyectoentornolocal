import { existsSync } from 'node:fs';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { sanear } from '../proyectos/recetas';
import type { CapacidadesPlataforma, Ejecutor, Lanzador } from '../plataforma/tipos';

/**
 * Contenedores Docker y Podman (mínimo de la Etapa C): detectar el motor, listar, iniciar,
 * detener, reiniciar y seguir los registros. Nunca crea, borra ni descarga contenedores,
 * imágenes o volúmenes, ni toca compose.
 *
 * Todo pasa por la CLI del motor, sin shell: el ejecutable sale primero de su carpeta de
 * instalación conocida (la de la plataforma) y solo si no está, del PATH (riesgo aceptado y
 * documentado: un `docker` puesto antes en el PATH se ejecutaría con los permisos del usuario,
 * igual que si lo corriera en una terminal). Cada llamada lleva plazo. Los ids se validan con una
 * expresión estricta (nunca empiezan con `-`, así que no pueden leerse como opciones).
 *
 * Solo motores locales, con el destino fijado en la detección y pasado en CADA llamada (un cambio
 * de contexto entre la detección y un `stop` no lo manda a otro equipo): Docker con
 * `-H <endpoint local>` (DOCKER_HOST local del usuario, contexto actual si es local o el `default`;
 * solo tuberías `npipe:////./pipe/…` o sockets `unix:///…`); Podman con `--connection <máquina>`
 * (solo si la predeterminada es `IsMachine` y apunta a este equipo; sin conexiones, local). Las
 * variables DOCKER_HOST/CONTAINER_HOST/contexto/conexión se vacían en el hijo; una remota se avisa.
 */

export const MOTORES_CONTENEDORES = ['docker', 'podman'] as const;
export type MotorContenedores = (typeof MOTORES_CONTENEDORES)[number];

export type EstadoContenedor = 'corriendo' | 'detenido' | 'pausado' | 'otro';

export interface Contenedor {
  /** Id corto (Docker, 12 hex) o largo (Podman, 64 hex) tal como lo da el motor. */
  id: string;
  nombre: string;
  imagen: string;
  estado: EstadoContenedor;
  /** Texto de estado del motor ("Up 2 hours", "Exited (0) …"); puede estar vacío. */
  detalle: string;
  /** Publicaciones de puertos ("0.0.0.0:8080->80/tcp"). */
  puertos: string[];
  /** Proyecto de compose (etiqueta `com.docker.compose.project` o la de podman-compose). */
  proyectoCompose: string | null;
  /** Código de salida si se detuvo y el motor lo dice. */
  codigoSalida: number | null;
}

export interface EstadoMotor {
  motor: MotorContenedores;
  /** Ejecutable de la CLI, o null si no está instalado. */
  ruta: string | null;
  /** De dónde salió la ruta: la carpeta de instalación conocida o el PATH. */
  origen: 'conocida' | 'path' | null;
  /** ¿Responde el demonio (Docker) o la máquina (Podman)? */
  responde: boolean;
  version: string | null;
  /** Había un host o contexto remoto configurado y se ignoró (solo se usan motores locales). */
  hostRemotoIgnorado: boolean;
}

export type AccionContenedor = 'iniciar' | 'detener' | 'reiniciar';
export const ACCIONES_CONTENEDOR: readonly AccionContenedor[] = ['iniciar', 'detener', 'reiniciar'];

/** Lote de líneas de registro de un contenedor (`contenedor:lineas`). */
export interface LineasContenedor {
  motor: MotorContenedores;
  id: string;
  lineas: string[];
  /** El seguimiento terminó (el contenedor se detuvo o el motor cortó). */
  fin?: boolean;
}

export interface DetenidoInesperado {
  motor: MotorContenedores;
  id: string;
  nombre: string;
  codigoSalida: number | null;
}

export interface DepsContenedores {
  exec: Ejecutor;
  lanzar: Lanzador;
  plataforma: Pick<
    CapacidadesPlataforma,
    'buscarEjecutable' | 'nombreEjecutable' | 'carpetasContenedores'
  >;
  /** ¿Existe el archivo? (por defecto `existsSync`). */
  existe?: (ruta: string) => boolean;
  /** Variables del proceso (para ver DOCKER_HOST y compañía); por defecto `process.env`. */
  entorno?: NodeJS.ProcessEnv;
  /** Emite un lote de líneas de registro (el núcleo lo publica como `contenedor:lineas`). */
  emitir: (d: LineasContenedor) => void;
  /** Un contenedor que estaba en marcha apareció detenido sin que se lo pidiéramos. */
  alDetenido?: (d: DetenidoInesperado) => void;
  /** Cada cuánto se juntan las líneas antes de emitirlas (por defecto 200 ms). */
  intervaloLineasMs?: number;
  ahora?: () => number;
}

/* ───────────── Validación ───────────── */

const RE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;

/** Id o nombre de contenedor válido; si no, `contenedores.id_invalido`. */
export function validarIdContenedor(id: unknown): string {
  if (typeof id !== 'string' || !RE_ID.test(id)) {
    throw new ErrorWolf('contenedores.id_invalido', 'El id del contenedor no es válido.');
  }
  return id;
}

export function esMotorContenedores(v: unknown): v is MotorContenedores {
  return typeof v === 'string' && (MOTORES_CONTENEDORES as readonly string[]).includes(v);
}

function exigirMotor(v: unknown): MotorContenedores {
  if (!esMotorContenedores(v)) {
    throw new ErrorWolf('contenedores.motor_invalido', 'Motor de contenedores desconocido.');
  }
  return v;
}

/* ───────────── Interpretación de la salida ───────────── */

const MAX_CONTENEDORES = 500;
const MAX_PUERTOS = 30;
const MAX_TEXTO = 200;

/** Secuencias ANSI (colores, cursor) y caracteres de control salvo el tabulador. */
// eslint-disable-next-line no-control-regex
const RE_ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g;
// eslint-disable-next-line no-control-regex
const RE_CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f\u0080-\u009f]/g;

function sinControl(t: string): string {
  return t.replace(RE_ANSI, '').replace(RE_CONTROL, '');
}

/** Texto corto mostrable: sin controles, con secretos enmascarados y acotado. */
function textoCorto(v: unknown, max = MAX_TEXTO): string {
  if (typeof v !== 'string') return '';
  const t = sanear(sinControl(v)).trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

/** Una línea de registro lista para la interfaz: sin ANSI ni controles, saneada y acotada. */
export function limpiarLineaRegistro(linea: string): string {
  return sanear(sinControl(linea));
}

function estadoDe(v: unknown): EstadoContenedor {
  const s = typeof v === 'string' ? v.toLowerCase() : '';
  if (s === 'running') return 'corriendo';
  if (s === 'paused') return 'pausado';
  if (['exited', 'created', 'stopped', 'dead', 'configured', 'initialized'].includes(s)) {
    return 'detenido';
  }
  return 'otro';
}

function puertosDe(v: unknown): string[] {
  const res: string[] = [];
  if (typeof v === 'string') {
    for (const p of v.split(',')) {
      const t = textoCorto(p, 80);
      if (t) res.push(t);
    }
  } else if (Array.isArray(v)) {
    for (const p of v) {
      if (typeof p !== 'object' || p === null) continue;
      const o = p as Record<string, unknown>;
      const num = (...k: string[]): number | null => {
        for (const x of k) if (typeof o[x] === 'number' && Number.isInteger(o[x])) return o[x];
        return null;
      };
      const cont = num('container_port', 'containerPort');
      if (cont === null) continue;
      const host = num('host_port', 'hostPort');
      const rango = Math.max(1, num('range') ?? 1);
      const proto = textoCorto(o['protocol'], 8) || 'tcp';
      const ip = textoCorto(o['host_ip'] ?? o['hostIP'], 45) || '0.0.0.0';
      const tramo = (n: number): string => (rango > 1 ? `${n}-${n + rango - 1}` : String(n));
      res.push(host ? `${ip}:${tramo(host)}->${tramo(cont)}/${proto}` : `${tramo(cont)}/${proto}`);
    }
  }
  return [...new Set(res)].slice(0, MAX_PUERTOS);
}

const ETIQUETAS_COMPOSE = ['com.docker.compose.project', 'io.podman.compose.project'];

function proyectoDe(v: unknown): string | null {
  if (typeof v === 'string') {
    // Docker: "k=v,k2=v2" (algunos valores llevan comas: solo se buscan las claves conocidas).
    for (const par of v.split(',')) {
      const i = par.indexOf('=');
      if (i > 0 && ETIQUETAS_COMPOSE.includes(par.slice(0, i))) {
        return textoCorto(par.slice(i + 1), 100) || null;
      }
    }
    return null;
  }
  if (typeof v === 'object' && v !== null) {
    for (const k of ETIQUETAS_COMPOSE) {
      const t = textoCorto((v as Record<string, unknown>)[k], 100);
      if (t) return t;
    }
  }
  return null;
}

function codigoSalidaDe(o: Record<string, unknown>, estado: EstadoContenedor): number | null {
  if (estado !== 'detenido') return null;
  if (typeof o['ExitCode'] === 'number' && Number.isInteger(o['ExitCode'])) return o['ExitCode'];
  const m = typeof o['Status'] === 'string' ? /^Exited \((-?\d{1,5})\)/.exec(o['Status']) : null;
  return m ? Number(m[1]) : null;
}

function contenedorDe(x: unknown): Contenedor | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const idCrudo = o['ID'] ?? o['Id'] ?? o['id'];
  if (typeof idCrudo !== 'string' || !RE_ID.test(idCrudo)) return null;
  const nombres = Array.isArray(o['Names']) ? o['Names'][0] : o['Names'];
  const estado = estadoDe(o['State']);
  return {
    id: idCrudo,
    nombre: textoCorto(typeof nombres === 'string' ? nombres.replace(/^\//, '') : '', 128),
    imagen: textoCorto(o['Image']),
    estado,
    detalle: textoCorto(o['Status'], 100),
    puertos: puertosDe(o['Ports']),
    proyectoCompose: proyectoDe(o['Labels']),
    codigoSalida: codigoSalidaDe(o, estado),
  };
}

/**
 * Lista de `ps -a` de Docker (un objeto JSON por línea) o de Podman (un arreglo JSON). Una
 * entrada dañada o con un id inválido se descarta sin perder las demás.
 */
export function interpretarPs(salida: string): Contenedor[] {
  const t = salida.trim();
  let crudos: unknown[] = [];
  if (t.startsWith('[')) {
    try {
      const v = JSON.parse(t) as unknown;
      if (Array.isArray(v)) crudos = v;
    } catch {
      crudos = [];
    }
  } else {
    for (const linea of t.split(/\r?\n/)) {
      if (!linea.trim().startsWith('{')) continue;
      try {
        crudos.push(JSON.parse(linea) as unknown);
      } catch {
        // línea dañada: se ignora
      }
    }
  }
  const res: Contenedor[] = [];
  for (const c of crudos) {
    const v = contenedorDe(c);
    if (v) res.push(v);
    if (res.length >= MAX_CONTENEDORES) break;
  }
  return res;
}

/* ───────────── Motores locales ───────────── */

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

/** Tubería con nombre de ESTE equipo (`npipe:////./pipe/x` o `npipe://./pipe/x`; nunca `//otro/`). */
const RE_NPIPE_LOCAL = /^npipe:\/\/(?:\/\/)?\.\/pipe\/[A-Za-z0-9_.-]{1,200}$/i;
/** Socket Unix con ruta absoluta y sin host. */
const RE_UNIX_LOCAL = /^unix:\/\/\/[^\s?#]{1,500}$/i;

/**
 * ¿Apunta la URI a este equipo? Docker: solo una tubería con nombre local o un socket Unix.
 * Podman: también ssh a 127.0.0.1/localhost/::1 (así habla con su máquina virtual en Windows y
 * macOS; quien llama exige además que la conexión sea de una máquina, `IsMachine`).
 */
export function esUriLocal(uri: string, motor: MotorContenedores): boolean {
  const u = uri.trim();
  if (RE_NPIPE_LOCAL.test(u) || RE_UNIX_LOCAL.test(u)) return true;
  if (motor !== 'podman' || !/^ssh:\/\//i.test(u)) return false;
  try {
    return LOOPBACK.has(new URL(u).hostname.toLowerCase());
  } catch {
    return false;
  }
}

interface Invocacion {
  cmd: string;
  /** Destino fijado en la detección (`-H <endpoint local>` o `--connection <máquina>`). */
  previos: string[];
  env: Record<string, string>;
}

interface Deteccion {
  estado: EstadoMotor;
  invocacion: Invocacion | null;
  /** Motivo por el que no hay invocación: sin motor, remoto o sin respuesta. */
  motivo: 'sin_motor' | 'remoto' | 'no_responde' | null;
  hora: number;
}

const PLAZO_DETECTAR_MS = 10_000;
const PLAZO_LISTA_MS = 20_000;
/** `stop` espera hasta 10 s a que el proceso salga antes de matarlo; se deja margen. */
const PLAZO_ACCION_MS = 60_000;
/** Una detección vale este tiempo antes de repetirse. */
const VIGENCIA_DETECCION_MS = 30_000;
/** Seguimientos de registros simultáneos (de toda la app). */
export const MAX_REGISTROS_CONTENEDORES = 4;
/** Un seguimiento olvidado se corta solo a las 2 horas. */
const MAX_DURACION_REGISTRO_MS = 2 * 60 * 60_000;
/** Líneas pendientes como mucho entre dos emisiones (las más viejas se descartan). */
const MAX_LINEAS_PENDIENTES = 1000;
/** Ventana en la que una detención pedida desde WolfCore Dev no cuenta como inesperada. */
const VENTANA_PROPIA_MS = 2 * 60_000;

const ARGS_ACCION: Record<AccionContenedor, string> = {
  iniciar: 'start',
  detener: 'stop',
  reiniciar: 'restart',
};

export class Contenedores {
  private readonly deteccion = new Map<MotorContenedores, Deteccion>();
  /** Último estado visto de cada contenedor por motor (para avisar de detenciones). */
  private readonly ultimo = new Map<MotorContenedores, Map<string, Contenedor>>();
  /** Detenciones y reinicios pedidos desde aquí (motor:id → hora). */
  private readonly propias = new Map<string, number>();
  /** Seguimientos de registros por `motor:id`, con cuántas ventanas los usan. */
  private readonly registros = new Map<string, { refs: number; cortar: () => void }>();
  private temporizador: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly d: DepsContenedores) {}

  private get ahora(): number {
    return this.d.ahora ? this.d.ahora() : Date.now();
  }

  /** Ruta de la CLI: primero la carpeta de instalación conocida, luego el PATH. */
  private async ubicar(
    motor: MotorContenedores,
  ): Promise<{ ruta: string; origen: 'conocida' | 'path' } | null> {
    const existe = this.d.existe ?? existsSync;
    const nombre = this.d.plataforma.nombreEjecutable(motor);
    for (const dir of await this.d.plataforma.carpetasContenedores(motor)) {
      const r = path.join(dir, nombre);
      if (existe(r)) return { ruta: r, origen: 'conocida' };
    }
    const r = await this.d.plataforma.buscarEjecutable(motor);
    return r ? { ruta: r, origen: 'path' } : null;
  }

  /**
   * Entorno del hijo: sin host, contexto ni conexión por variable (una variable vacía es lo mismo
   * que no tenerla para las dos CLI). El destino se fija con `-H`/`--connection` en cada llamada.
   * `hostLocal` es el DOCKER_HOST del usuario si apunta a este equipo; `remoto`, si había una
   * variable de este motor apuntando a otro.
   */
  private entornoLocal(motor: MotorContenedores): {
    env: Record<string, string>;
    remoto: boolean;
    hostLocal: string | null;
  } {
    const e = this.d.entorno ?? process.env;
    const env: Record<string, string> = {
      DOCKER_HOST: '',
      DOCKER_CONTEXT: '',
      CONTAINER_HOST: '',
      CONTAINER_CONNECTION: '',
    };
    const variable = (motor === 'docker' ? e['DOCKER_HOST'] : e['CONTAINER_HOST']) ?? '';
    const local = variable !== '' && motor === 'docker' && esUriLocal(variable, 'docker');
    return {
      env,
      remoto: variable !== '' && !local && !(motor === 'podman' && esUriLocal(variable, 'podman')),
      hostLocal: local ? variable.trim() : null,
    };
  }

  /**
   * Endpoint local de Docker para fijarlo con `-H`: el DOCKER_HOST local del usuario, o el del
   * contexto actual si es local, o el del contexto `default`. Así un cambio de contexto entre la
   * detección y una acción nunca manda `stop` a otro equipo. null si no hay ninguno local.
   */
  private async endpointDocker(
    correr: (args: string[]) => Promise<{ codigo: number; stdout: string }>,
    hostLocal: string | null,
  ): Promise<{ endpoint: string | null; remoto: boolean }> {
    if (hostLocal) return { endpoint: hostLocal, remoto: false };
    const host = async (ctx: string[]): Promise<string | null> => {
      const r = await correr([
        'context',
        'inspect',
        ...ctx,
        '--format',
        '{{.Endpoints.docker.Host}}',
      ]);
      return r.codigo === 0 ? (r.stdout.trim().split(/\r?\n/)[0] ?? '').trim() : null;
    };
    const actual = await host([]);
    if (actual !== null && esUriLocal(actual, 'docker')) return { endpoint: actual, remoto: false };
    const pred = await host(['default']);
    const endpoint = pred !== null && esUriLocal(pred, 'docker') ? pred : null;
    return { endpoint, remoto: actual !== null && actual !== '' };
  }

  private async detectar(motor: MotorContenedores): Promise<Deteccion> {
    const hora = this.ahora;
    const base: EstadoMotor = {
      motor,
      ruta: null,
      origen: null,
      responde: false,
      version: null,
      hostRemotoIgnorado: false,
    };
    const u = await this.ubicar(motor);
    if (!u) {
      const r: Deteccion = { estado: base, invocacion: null, motivo: 'sin_motor', hora };
      this.deteccion.set(motor, r);
      return r;
    }
    const { env, remoto, hostLocal } = this.entornoLocal(motor);
    const estado: EstadoMotor = {
      ...base,
      ruta: u.ruta,
      origen: u.origen,
      hostRemotoIgnorado: remoto,
    };
    const inv: Invocacion = { cmd: u.ruta, previos: [], env };
    const correr = (args: string[]) =>
      this.d.exec(u.ruta, [...inv.previos, ...args], { timeoutMs: PLAZO_DETECTAR_MS, env });

    const sinInvocacion = (motivo: 'remoto' | 'no_responde'): Deteccion => {
      const r: Deteccion = { estado, invocacion: null, motivo, hora };
      this.deteccion.set(motor, r);
      return r;
    };
    let versionArgs: string[];
    if (motor === 'docker') {
      const { endpoint, remoto: ctxRemoto } = await this.endpointDocker(correr, hostLocal);
      if (ctxRemoto) estado.hostRemotoIgnorado = true;
      if (!endpoint) return sinInvocacion(ctxRemoto ? 'remoto' : 'no_responde');
      inv.previos = ['-H', endpoint];
      versionArgs = ['version', '--format', '{{.Server.Version}}'];
    } else {
      const con = await correr(['system', 'connection', 'list', '--format', 'json']);
      const c = con.codigo === 0 ? conexionPodman(con.stdout) : { tipo: 'ninguna' as const };
      if (c.tipo === 'remota') {
        estado.hostRemotoIgnorado = true;
        return sinInvocacion('remoto');
      }
      // Con una máquina local se fija por nombre; sin conexiones (Linux nativo) es local.
      if (c.tipo === 'maquina') inv.previos = ['--connection', c.nombre];
      versionArgs = ['info', '--format', '{{.Version.Version}}'];
    }
    const v = await correr(versionArgs);
    const version = v.codigo === 0 ? versionValida(v.stdout) : null;
    estado.responde = version !== null;
    estado.version = version;
    const r: Deteccion = {
      estado,
      invocacion: estado.responde ? inv : null,
      motivo: estado.responde ? null : 'no_responde',
      hora,
    };
    this.deteccion.set(motor, r);
    return r;
  }

  /** Estado de los dos motores (detecta de nuevo cada vez). */
  async motores(): Promise<EstadoMotor[]> {
    const r = await Promise.all(MOTORES_CONTENEDORES.map((m) => this.detectar(m)));
    return r.map((x) => ({ ...x.estado }));
  }

  /** Cómo llamar al motor; lanza con un código claro si no se puede. */
  private async invocacion(motorCrudo: unknown): Promise<Invocacion> {
    const motor = exigirMotor(motorCrudo);
    let det = this.deteccion.get(motor);
    if (!det || !det.invocacion || this.ahora - det.hora > VIGENCIA_DETECCION_MS) {
      det = await this.detectar(motor);
    }
    if (det.invocacion) return det.invocacion;
    if (det.motivo === 'sin_motor') {
      throw new ErrorWolf('contenedores.sin_motor', `${motor} no está instalado.`, { motor });
    }
    if (det.motivo === 'remoto') {
      throw new ErrorWolf(
        'contenedores.remoto',
        `La conexión predeterminada de ${motor} es remota: no se usa.`,
        { motor },
      );
    }
    throw new ErrorWolf('contenedores.no_responde', `${motor} no responde.`, { motor });
  }

  /** `ps -a` del motor. Avisa de los contenedores que se detuvieron solos desde la última vez. */
  async lista(motorCrudo: MotorContenedores): Promise<Contenedor[]> {
    const motor = exigirMotor(motorCrudo);
    const inv = await this.invocacion(motor);
    // Docker con --no-trunc: ids completos (64 hex), los mismos con los que se actúa después.
    const formato =
      motor === 'docker' ? ['--no-trunc', '--format', '{{json .}}'] : ['--format', 'json'];
    const r = await this.d.exec(inv.cmd, [...inv.previos, 'ps', '-a', ...formato], {
      timeoutMs: PLAZO_LISTA_MS,
      env: inv.env,
    });
    if (r.codigo !== 0) {
      // El motor se apagó: la próxima llamada vuelve a detectar.
      this.deteccion.delete(motor);
      throw new ErrorWolf('contenedores.no_responde', `${motor} no responde.`, { motor });
    }
    const lista = interpretarPs(r.stdout);
    this.compararConAnterior(motor, lista);
    return lista;
  }

  private compararConAnterior(motor: MotorContenedores, lista: Contenedor[]): void {
    const previo = this.ultimo.get(motor);
    const ahora = this.ahora;
    for (const [k, t] of this.propias) if (ahora - t > VENTANA_PROPIA_MS) this.propias.delete(k);
    if (previo && this.d.alDetenido) {
      for (const c of lista) {
        const antes = previo.get(c.id);
        if (antes?.estado !== 'corriendo' || c.estado !== 'detenido') continue;
        if (this.propias.has(`${motor}:${c.id}`)) continue;
        try {
          this.d.alDetenido({ motor, id: c.id, nombre: c.nombre, codigoSalida: c.codigoSalida });
        } catch (e) {
          console.error('Error al avisar de un contenedor detenido:', e);
        }
      }
    }
    this.ultimo.set(motor, new Map(lista.map((c) => [c.id, c])));
  }

  /** El contenedor tiene que estar en la última lista (o en una nueva). */
  private async exigirExistente(motor: MotorContenedores, id: string): Promise<void> {
    if (this.ultimo.get(motor)?.has(id)) return;
    const l = await this.lista(motor);
    if (!l.some((c) => c.id === id)) {
      throw new ErrorWolf('contenedores.no_existe', 'El contenedor no existe.');
    }
  }

  /** Inicia, detiene o reinicia un contenedor que existe. Nunca borra nada. */
  async accion(motorCrudo: MotorContenedores, idCrudo: string, a: AccionContenedor): Promise<void> {
    const motor = exigirMotor(motorCrudo);
    if (!ACCIONES_CONTENEDOR.includes(a)) {
      throw new ErrorWolf('contenedores.argumento_invalido', 'Acción no válida.', {
        campo: 'accion',
      });
    }
    const id = validarIdContenedor(idCrudo);
    const inv = await this.invocacion(motor);
    await this.exigirExistente(motor, id);
    if (a !== 'iniciar') this.propias.set(`${motor}:${id}`, this.ahora);
    const r = await this.d.exec(inv.cmd, [...inv.previos, ARGS_ACCION[a], id], {
      timeoutMs: PLAZO_ACCION_MS,
      env: inv.env,
    });
    if (r.codigo !== 0) {
      const detalle = textoCorto(r.stderr || r.stdout, 190);
      throw new ErrorWolf('contenedores.accion_fallo', `No se pudo ${a} el contenedor.`, {
        detalle,
      });
    }
  }

  /** Cuántos registros se están siguiendo. */
  siguiendo(): number {
    return this.registros.size;
  }

  /**
   * Sigue el registro (`logs -f --tail 500`) por el lanzador. Emite `contenedor:lineas` en lotes;
   * devuelve la función que lo corta (también lo corta `cerrar`, el fin del contenedor o 2 horas).
   */
  async seguirLogs(motorCrudo: MotorContenedores, idCrudo: string): Promise<() => void> {
    const motor = exigirMotor(motorCrudo);
    const id = validarIdContenedor(idCrudo);
    const clave = `${motor}:${id}`;
    if (this.registros.has(clave)) return this.tomar(clave);
    if (this.registros.size >= MAX_REGISTROS_CONTENEDORES) {
      throw new ErrorWolf(
        'contenedores.demasiados_registros',
        'Hay demasiados registros abiertos.',
        { maximo: MAX_REGISTROS_CONTENEDORES },
      );
    }
    const inv = await this.invocacion(motor);
    await this.exigirExistente(motor, id);
    // Otra llamada pudo empezar mientras se esperaba.
    if (this.registros.has(clave)) return this.tomar(clave);
    if (this.registros.size >= MAX_REGISTROS_CONTENEDORES) {
      throw new ErrorWolf(
        'contenedores.demasiados_registros',
        'Hay demasiados registros abiertos.',
        { maximo: MAX_REGISTROS_CONTENEDORES },
      );
    }

    const control = new AbortController();
    let pendientes: string[] = [];
    let terminado = false;
    const emitir = (fin: boolean): void => {
      if (pendientes.length === 0 && !fin) return;
      const lineas = pendientes;
      pendientes = [];
      try {
        this.d.emitir({ motor, id, lineas, ...(fin ? { fin: true } : {}) });
      } catch (e) {
        console.error('Error al emitir líneas de un contenedor:', e);
      }
    };
    const lote = setInterval(() => emitir(false), this.d.intervaloLineasMs ?? 200);
    const tope = setTimeout(() => control.abort(), MAX_DURACION_REGISTRO_MS);
    lote.unref?.();
    tope.unref?.();
    const entrada = { refs: 0, cortar: (): void => undefined };
    const dejar = (): void => {
      if (terminado) return;
      terminado = true;
      clearInterval(lote);
      clearTimeout(tope);
      if (this.registros.get(clave) === entrada) this.registros.delete(clave);
      control.abort();
    };
    entrada.cortar = dejar;
    this.registros.set(clave, entrada);
    this.d
      .lanzar(inv.cmd, [...inv.previos, 'logs', '-f', '--tail', '500', id], {
        env: inv.env,
        senal: control.signal,
        alLinea: (l) => {
          if (terminado) return;
          pendientes.push(limpiarLineaRegistro(l));
          if (pendientes.length > MAX_LINEAS_PENDIENTES) {
            pendientes.splice(0, pendientes.length - MAX_LINEAS_PENDIENTES);
          }
        },
      })
      .catch(() => ({ codigo: 1 }))
      .then(() => {
        const cortado = terminado;
        dejar();
        // Si lo cortó quien siguía, no hace falta avisar; si terminó solo, sí.
        if (!cortado) emitir(true);
      })
      .catch(() => undefined);
    return this.tomar(clave);
  }

  /**
   * Una referencia más al seguimiento de `clave` (cada ventana tiene la suya): la función
   * devuelta suelta solo esa referencia (una vez) y el proceso se corta con la última.
   */
  private tomar(clave: string): () => void {
    const e = this.registros.get(clave);
    if (!e) return () => undefined;
    e.refs++;
    let suelta = false;
    return () => {
      if (suelta) return;
      suelta = true;
      e.refs--;
      if (e.refs <= 0) e.cortar();
    };
  }

  /**
   * Revisión liviana para avisar de detenciones aunque la pantalla esté cerrada: solo consulta
   * los motores que en la última lista tenían algún contenedor en marcha. Nunca lanza.
   */
  async revisarEnSegundoPlano(): Promise<void> {
    for (const [motor, mapa] of this.ultimo) {
      if (![...mapa.values()].some((c) => c.estado === 'corriendo')) continue;
      await this.lista(motor).catch(() => undefined);
    }
  }

  /** Revisa cada `ms` (sin retener el proceso). */
  iniciarVigilancia(ms = 60_000): void {
    if (this.temporizador) return;
    this.temporizador = setInterval(() => void this.revisarEnSegundoPlano(), ms);
    this.temporizador.unref?.();
  }

  /** Corta todos los registros y la vigilancia (al cerrar la app). */
  cerrar(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = null;
    for (const e of [...this.registros.values()]) e.cortar();
    this.registros.clear();
  }
}

const RE_VERSION = /^[0-9A-Za-z][0-9A-Za-z.+~_-]{0,63}$/;

function versionValida(salida: string): string | null {
  const v = (salida.trim().split(/\r?\n/)[0] ?? '').trim();
  return RE_VERSION.test(v) ? v : null;
}

/**
 * Conexión predeterminada de Podman (salida de `system connection list --format json`):
 * - `ninguna`: no hay conexiones (Podman nativo de Linux, local);
 * - `maquina`: la máquina virtual local (`IsMachine: true` y URI de este equipo), que se fija
 *   con `--connection <nombre>`;
 * - `remota`: cualquier otra cosa (otro equipo, ssh sin ser máquina, salida rara): no se usa.
 */
export function conexionPodman(
  salida: string,
): { tipo: 'ninguna' } | { tipo: 'maquina'; nombre: string } | { tipo: 'remota' } {
  let v: unknown;
  try {
    v = JSON.parse(salida.trim() || '[]');
  } catch {
    return { tipo: 'remota' };
  }
  if (v === null) return { tipo: 'ninguna' };
  if (!Array.isArray(v)) return { tipo: 'remota' };
  if (v.length === 0) return { tipo: 'ninguna' };
  const pred = v.find(
    (c): c is Record<string, unknown> =>
      typeof c === 'object' && c !== null && (c as Record<string, unknown>)['Default'] === true,
  );
  const nombre = pred?.['Name'];
  const uri = pred?.['URI'];
  if (
    pred?.['IsMachine'] === true &&
    typeof nombre === 'string' &&
    RE_ID.test(nombre) &&
    typeof uri === 'string' &&
    esUriLocal(uri, 'podman')
  ) {
    return { tipo: 'maquina', nombre };
  }
  return { tipo: 'remota' };
}
