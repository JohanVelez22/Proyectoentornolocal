import type { Nucleo } from '@pel/core';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiSistema,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';
import {
  archivoExistente,
  booleano,
  carpetaExistente,
  enteroEn,
  idNoVacio,
  idServicioDatos,
  motorBd,
  motorSql,
  nombreBase,
  nombreModelo,
  objetoPlano,
  puertoHttps,
  puertoUsuario,
  ramaPhp,
  RutasElegidas,
  servicioInstalable,
  texto,
  textoAcotado,
  textoLibre,
  tipoProyecto,
  urlHttp,
} from './validacion';

type MotorBdIpc = ReturnType<typeof motorBd>;

/** Contenido de un .env (con saltos de línea), hasta 256 KiB. */
function textoAcotadoEnv(v: unknown): string {
  const t = texto(v, 'envActual');
  if (t.length > 256 * 1024) throw new Error('Argumento no válido: envActual');
  return t;
}

/** Solo `confirmarSobrescribir` (booleano) llega al núcleo. */
function opcionesRestaurar(v: unknown): { confirmarSobrescribir?: boolean } | undefined {
  if (v === undefined) return undefined;
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  return o['confirmarSobrescribir'] === undefined
    ? {}
    : { confirmarSobrescribir: booleano(o['confirmarSobrescribir'], 'confirmarSobrescribir') };
}

/** Usuario y clave opcionales al crear una base (no aplica a MongoDB). */
function opcionesCrear(
  motor: MotorBdIpc,
  v: unknown,
): { usuario?: string; clave?: string } | undefined {
  if (v === undefined) return undefined;
  const o = objetoPlano<Record<string, unknown>>(v, 'opciones');
  if (motor === 'mongodb' && (o['usuario'] !== undefined || o['clave'] !== undefined)) {
    throw new Error('Argumento no válido: opciones');
  }
  return {
    ...(o['usuario'] === undefined ? {} : { usuario: nombreBase(motor, o['usuario'], 'usuario') }),
    ...(o['clave'] === undefined ? {} : { clave: textoAcotado(o['clave'], 1, 128, 'clave') }),
  };
}

/** Servidor de origen de una importación; los errores nunca repiten la clave. */
function origenImportar(v: unknown): {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  base: string;
} {
  const o = objetoPlano<Record<string, unknown>>(v, 'origen');
  return {
    host: textoAcotado(o['host'], 1, 253, 'servidor de origen'),
    puerto: enteroEn(o['puerto'], 1, 65535, 'puerto de origen'),
    usuario: textoAcotado(o['usuario'], 1, 128, 'usuario de origen'),
    clave: textoAcotado(o['clave'], 0, 1024, 'clave de origen'),
    base: textoAcotado(o['base'], 1, 64, 'base de origen'),
  };
}

/** Ejecuta `fn` y, si falla, quita `clave` del mensaje (nunca debe volver al renderer). */
async function sinClave<T>(clave: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    const codigo = (e as { codigo?: unknown } | null)?.codigo;
    const limpio = clave ? mensaje.split(clave).join('***') : mensaje;
    throw Object.assign(new Error(limpio), typeof codigo === 'string' ? { codigo } : {});
  }
}

export interface IpcMainLike {
  handle(canal: string, fn: (evento: unknown, ...args: unknown[]) => unknown): void;
}

export interface VentanaLike {
  isDestroyed(): boolean;
  webContents: { send(canal: string, ...args: unknown[]): void };
}

export type NucleoIpc = Nucleo;

/** Lo que ve cada manejador además del núcleo: el sistema y las rutas elegidas en diálogos. */
type Contexto = ApiSistema & { elegidas: RutasElegidas };

type Manejador = (nucleo: NucleoIpc, sistema: Contexto, ...args: unknown[]) => unknown;

/** Tabla explícita: el renderer solo puede invocar estas rutas; cada una valida sus argumentos. */
const TABLA: Record<RutaIpc, Manejador> = {
  estadoGeneral: (n) => n.estadoGeneral(),
  carpetaDatos: (n) => n.rutas.base,
  'sitios.listar': (n) => n.sitios.listar(),
  'sitios.guardar': (n, _s, datos, id) =>
    n.guardarSitio(
      objetoPlano<Parameters<Nucleo['guardarSitio']>[0]>(datos, 'datos'),
      id === undefined ? undefined : idNoVacio(id),
    ),
  'sitios.borrar': (n, _s, id) => n.borrarSitio(idNoVacio(id)),
  'sitios.aplicar': (n) => n.sitios.aplicar(),
  'servicios.estados': (n) => n.servicios.estados(),
  'servicios.iniciar': (n, _s, id) =>
    n.servicios.iniciar(idNoVacio(id) as Parameters<Nucleo['servicios']['iniciar']>[0]),
  'servicios.detener': (n, _s, id) =>
    n.servicios.detener(idNoVacio(id) as Parameters<Nucleo['servicios']['detener']>[0]),
  'servicios.iniciarTodo': (n) => n.servicios.iniciarTodo(),
  'servicios.detenerTodo': (n) => n.detenerTodo(),
  'servicios.cambiarPuerto': (n, _s, id, puerto) =>
    n.cambiarPuertoServicio(idServicioDatos(id), puertoUsuario(puerto)),
  'servicios.borrarDatos': (n, _s, id, confirmacion) =>
    n.borrarDatosServicio(idServicioDatos(id), textoAcotado(confirmacion, 0, 64, 'confirmación')),
  'servicios.autoIniciar': (n, _s, id, valor) =>
    n.autoIniciarServicio(idServicioDatos(id), booleano(valor, 'autoIniciar')),
  'bd.listar': (n, _s, motor) => n.listarBases(motorBd(motor)),
  'bd.crear': (n, _s, motor, nombre, opciones) => {
    const m = motorBd(motor);
    const o = opcionesCrear(m, opciones);
    return sinClave(o?.clave ?? '', () => n.crearBase(m, nombreBase(m, nombre), o));
  },
  'bd.borrar': (n, _s, motor, nombre, confirmacion) => {
    const m = motorBd(motor);
    return n.borrarBase(
      m,
      nombreBase(m, nombre),
      textoAcotado(confirmacion, 0, 64, 'confirmación'),
    );
  },
  // Rutas que devuelven secretos (nunca se registran): bd.conexion (clave del motor),
  // bd.crear (clave generada del usuario nuevo), ftp.activar, ftp.regenerarClave y
  // ftp.credenciales (clave FTP del sitio).
  'bd.conexion': (n, _s, motor) => n.conexionBd(motorBd(motor)),
  'bd.bloqueEnv': (n, _s, motor, base, tipo, envActual) => {
    const m = motorBd(motor);
    return n.bloqueEnvBd(
      m,
      nombreBase(m, base),
      tipoProyecto(tipo),
      envActual === undefined ? undefined : textoAcotadoEnv(envActual),
    );
  },
  'bd.tieneTablas': (n, _s, motor, base) => {
    const m = motorSql(motor);
    return n.tieneTablas(m, nombreBase(m, base));
  },
  'bd.formato': async (n, s, archivo) =>
    n.formatoRespaldo(await archivoExistente(s.elegidas.exigir(archivo, 'archivo'))),
  'bd.restaurar': async (n, s, motor, archivo, base, opciones) => {
    const m = motorSql(motor);
    const b = nombreBase(m, base);
    const o = opcionesRestaurar(opciones);
    return n.restaurarBase(m, await archivoExistente(s.elegidas.exigir(archivo, 'archivo')), b, o);
  },
  'bd.respaldar': async (n, s, motor, base, carpeta) => {
    const m = motorSql(motor);
    const b = nombreBase(m, base);
    return n.respaldarBase(
      m,
      b,
      carpeta === undefined
        ? undefined
        : await carpetaExistente(s.elegidas.exigir(carpeta, 'carpeta')),
    );
  },
  'bd.importar': (n, _s, motor, origen, destino, opciones) => {
    const m = motorSql(motor);
    const o = origenImportar(origen);
    const d = nombreBase(m, destino, 'base destino');
    const op = opcionesRestaurar(opciones);
    return sinClave(o.clave, () => n.importarBase(m, o, d, op));
  },
  'pgvector.estado': (n) => n.estadoPgvector(),
  'pgvector.instalarBuildTools': (n) => n.instalarBuildTools(),
  'pgvector.compilarEInstalar': (n) => n.compilarPgvector(),
  'pgvector.activar': (n, _s, base) => n.activarVector(nombreBase('postgresql', base)),
  'https.estado': (n) => n.estadoHttps(),
  'https.instalarCA': (n) => n.instalarCA(),
  'https.quitarCA': (n) => n.quitarCA(),
  'https.cambiarPuerto': (n, _s, puerto) => n.cambiarPuertoHttps(puertoHttps(puerto)),
  'composer.version': (n) => n.versionComposer(),
  'composer.instalar': (n) => n.instalarComposer(),
  'composer.actualizar': (n) => n.actualizarComposer(),
  'composer.cambiarPhpPorDefecto': (n, _s, rama) => n.cambiarPhpPorDefecto(ramaPhp(rama)),
  'terminal.abrir': (n, _s, id) => n.abrirTerminal(idNoVacio(id)),
  'path.estado': (n) => n.estadoPathUsuario(),
  'path.cambiar': (n, _s, activar) => n.cambiarPathUsuario(booleano(activar, 'activar')),
  'adminer.instalar': (n) => n.instalarAdminer(),
  'adminer.disponibilidad': (n) => n.disponibilidadAdminer(),
  'adminer.url': (n, _s, motor, usuario) => {
    const m = motorBd(motor);
    return n.urlAdminer(m, nombreBase(m === 'mongodb' ? 'mysql' : m, usuario, 'usuario'));
  },
  'ftp.activar': (n, _s, id) => n.activarFtp(idNoVacio(id)),
  'ftp.desactivar': (n, _s, id) => n.desactivarFtp(idNoVacio(id)),
  'ftp.regenerarClave': (n, _s, id) => n.regenerarClaveFtp(idNoVacio(id)),
  'ftp.soloLectura': (n, _s, id, valor) =>
    n.ftpSoloLectura(idNoVacio(id), booleano(valor, 'soloLectura')),
  'ftp.credenciales': (n, _s, id) => n.credencialesFtp(idNoVacio(id)),
  'ftp.redLocal': (n, _s, valor) => n.ftpRedLocal(booleano(valor, 'redLocal')),
  'ia.modelos': (n) => n.modelosIa(),
  'ia.descargar': (n, _s, nombre) => n.descargarModelo(nombreModelo(nombre)),
  'ia.cancelar': (n, _s, nombre) => n.cancelarDescargaModelo(nombreModelo(nombre)),
  'ia.borrar': (n, _s, nombre) => n.borrarModelo(nombreModelo(nombre)),
  'ia.probar': (n, _s, nombre, prompt) =>
    n.probarModelo(nombreModelo(nombre), textoLibre(prompt, 1, 4000, 'texto')),
  'ia.espacioUsado': (n) => n.espacioIa(),
  'ia.bloqueEnv': (n) => n.bloqueEnvIa(),
  'ia.sugeridos': (n) => n.modelosSugeridos(),
  'mailpit.noLeidos': (n) => n.noLeidosCorreo(),
  // Se entrega una sola vez: una recarga del renderer no lo vuelve a mostrar.
  avisoInicio: (n) => n.tomarAvisoInicio(),
  'instalador.listarVersiones': (n, _s, servicio) =>
    n.listarVersiones(idNoVacio(servicio, 'servicio') as Parameters<Nucleo['listarVersiones']>[0]),
  // El renderer solo elige servicio y versión: URL, huella y carpeta salen del catálogo oficial.
  'instalador.instalar': async (n, _s, sel) => {
    const o = objetoPlano<Record<string, unknown>>(sel, 'versión');
    const servicio = servicioInstalable(o['servicio']);
    const version = idNoVacio(o['version'], 'versión');
    const v = (await n.listarVersiones(servicio)).find((x) => x.version === version);
    if (!v) throw new Error(`La versión ${version} de ${servicio} no está en el catálogo`);
    return n.instalador.instalar(v);
  },
  'instalador.instalados': (n, _s, servicio) =>
    n.instalador.instalados(idNoVacio(servicio, 'servicio')),
  'tuneles.abrir': (n, _s, id) => n.tuneles.abrir(idNoVacio(id)),
  'tuneles.cerrar': (n, _s, id) => n.tuneles.cerrar(idNoVacio(id)),
  'tuneles.renovar': (n, _s, id) => n.tuneles.renovar(idNoVacio(id)),
  'tuneles.estados': (n) => n.tuneles.estados(),
  'hosts.sincronizar': async (n) => {
    const sitios = await n.sitios.listar();
    return n.hosts.sincronizar([...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]))]);
  },
  detectarProyecto: (n, _s, carpeta) => n.detectarProyecto(texto(carpeta, 'carpeta')),
  'config.leer': (n) => n.config.leer(),
  'ajustes.guardar': (n, _s, a) => {
    const o = objetoPlano<Record<string, unknown>>(a, 'ajustes');
    return n.guardarAjustes({
      puerto: enteroEn(o['puerto'], 1, 65535, 'puerto'),
      trabajadores: enteroEn(o['trabajadores'], 1, 8, 'trabajadores'),
    });
  },
  'sistema.elegirCarpeta': async (_n, s) => s.elegidas.registrar(await s.elegirCarpeta()),
  'sistema.elegirArchivo': async (_n, s) => s.elegidas.registrar(await s.elegirArchivo()),
  'sistema.abrirUrl': (_n, s, url) => s.abrirUrl(urlHttp(url)),
  'sistema.abrirCarpeta': async (_n, s, ruta) => s.abrirCarpeta(await carpetaExistente(ruta)),
  'sistema.copiar': (_n, s, t) => s.copiar(texto(t, 'texto')),
  'sistema.version': (_n, s) => s.version(),
};

function aError(e: unknown): ResultadoIpc<never> {
  const mensaje = e instanceof Error ? e.message : String(e);
  const codigo = (e as { codigo?: unknown } | null)?.codigo;
  return {
    ok: false,
    error: typeof codigo === 'string' ? { mensaje, codigo } : { mensaje },
  };
}

/** Registra los canales `entorno:<ruta>` y reenvía los eventos del núcleo a la ventana. */
export function registrarIpc(
  nucleo: NucleoIpc,
  ipcMain: IpcMainLike,
  ventana: VentanaLike,
  sistema: ApiSistema,
  emisorValido: (evento: unknown) => boolean = () => true,
  elegidas: RutasElegidas = new RutasElegidas(),
): () => void {
  const contexto: Contexto = { ...sistema, elegidas };
  for (const [ruta, fn] of Object.entries(TABLA) as [RutaIpc, Manejador][]) {
    ipcMain.handle(`${PREFIJO_CANAL}${ruta}`, async (e, ...args) => {
      try {
        if (!emisorValido(e)) throw new Error('Origen no permitido');
        const valor = await (fn as (...a: unknown[]) => unknown)(nucleo, contexto, ...args);
        return { ok: true, valor } satisfies ResultadoIpc;
      } catch (e) {
        return aError(e);
      }
    });
  }
  const bajas = EVENTOS_IPC.map((nombre) =>
    nucleo.eventos.on(nombre, (dato) => {
      if (ventana.isDestroyed()) return;
      ventana.webContents.send(CANAL_EVENTO, { nombre, dato });
    }),
  );
  return () => bajas.forEach((b) => b());
}
