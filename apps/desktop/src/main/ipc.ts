import type { Nucleo } from '@pel/core';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiSistema,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';
import { carpetaExistente, idNoVacio, objetoPlano, texto, urlHttp } from './validacion';

export interface IpcMainLike {
  handle(canal: string, fn: (evento: unknown, ...args: unknown[]) => unknown): void;
}

export interface VentanaLike {
  isDestroyed(): boolean;
  webContents: { send(canal: string, ...args: unknown[]): void };
}

export type NucleoIpc = Nucleo;

type Manejador = (nucleo: NucleoIpc, sistema: ApiSistema, ...args: unknown[]) => unknown;

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
  'servicios.detenerTodo': (n) => n.servicios.detenerTodo(),
  'instalador.listarVersiones': (n, _s, servicio) =>
    n.listarVersiones(idNoVacio(servicio, 'servicio') as Parameters<Nucleo['listarVersiones']>[0]),
  'instalador.instalar': (n, _s, v) =>
    n.instalador.instalar(
      objetoPlano<Parameters<Nucleo['instalador']['instalar']>[0]>(v, 'versión'),
    ),
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
  'config.guardar': (n, _s, c) =>
    n.config.guardar(objetoPlano<Parameters<Nucleo['config']['guardar']>[0]>(c, 'config')),
  'sistema.elegirCarpeta': (_n, s) => s.elegirCarpeta(),
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
): () => void {
  for (const [ruta, fn] of Object.entries(TABLA) as [RutaIpc, Manejador][]) {
    ipcMain.handle(`${PREFIJO_CANAL}${ruta}`, async (e, ...args) => {
      try {
        if (!emisorValido(e)) throw new Error('Origen no permitido');
        const valor = await (fn as (...a: unknown[]) => unknown)(nucleo, sistema, ...args);
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
