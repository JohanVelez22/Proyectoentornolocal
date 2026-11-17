import type { Nucleo } from '@pel/core';
import {
  CANAL_EVENTO,
  EVENTOS_IPC,
  PREFIJO_CANAL,
  type ApiSistema,
  type ResultadoIpc,
  type RutaIpc,
} from '../shared/api';

export interface IpcMainLike {
  handle(canal: string, fn: (evento: unknown, ...args: unknown[]) => unknown): void;
}

export interface VentanaLike {
  isDestroyed(): boolean;
  webContents: { send(canal: string, ...args: unknown[]): void };
}

export type NucleoIpc = Nucleo;

type Manejador = (nucleo: NucleoIpc, sistema: ApiSistema, ...args: never[]) => unknown;

/** Tabla explícita: el renderer solo puede invocar estas rutas, nunca acceso dinámico. */
const TABLA: Record<RutaIpc, Manejador> = {
  estadoGeneral: (n) => n.estadoGeneral(),
  'sitios.listar': (n) => n.sitios.listar(),
  'sitios.guardar': (n, _s, ...a: [Parameters<Nucleo['guardarSitio']>[0], string?]) =>
    n.guardarSitio(a[0], a[1]),
  'sitios.borrar': (n, _s, id: string) => n.borrarSitio(id),
  'sitios.aplicar': (n) => n.sitios.aplicar(),
  'servicios.estados': (n) => n.servicios.estados(),
  'servicios.iniciar': (n, _s, id: Parameters<Nucleo['servicios']['iniciar']>[0]) =>
    n.servicios.iniciar(id),
  'servicios.detener': (n, _s, id: Parameters<Nucleo['servicios']['detener']>[0]) =>
    n.servicios.detener(id),
  'servicios.iniciarTodo': (n) => n.servicios.iniciarTodo(),
  'servicios.detenerTodo': (n) => n.servicios.detenerTodo(),
  'instalador.listarVersiones': (n, _s, servicio: Parameters<Nucleo['listarVersiones']>[0]) =>
    n.listarVersiones(servicio),
  'instalador.instalar': (n, _s, v: Parameters<Nucleo['instalador']['instalar']>[0]) =>
    n.instalador.instalar(v),
  'instalador.instalados': (n, _s, servicio: string) => n.instalador.instalados(servicio),
  'tuneles.abrir': (n, _s, id: string) => n.tuneles.abrir(id),
  'tuneles.cerrar': (n, _s, id: string) => n.tuneles.cerrar(id),
  'tuneles.renovar': (n, _s, id: string) => n.tuneles.renovar(id),
  'tuneles.estados': (n) => n.tuneles.estados(),
  'hosts.sincronizar': async (n) => {
    const sitios = await n.sitios.listar();
    return n.hosts.sincronizar([...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]))]);
  },
  detectarProyecto: (n, _s, carpeta: string) => n.detectarProyecto(carpeta),
  'config.leer': (n) => n.config.leer(),
  'config.guardar': (n, _s, c: Parameters<Nucleo['config']['guardar']>[0]) => n.config.guardar(c),
  'sistema.elegirCarpeta': (_n, s) => s.elegirCarpeta(),
  'sistema.abrirUrl': (_n, s, url: string) => s.abrirUrl(url),
  'sistema.abrirCarpeta': (_n, s, ruta: string) => s.abrirCarpeta(ruta),
  'sistema.copiar': (_n, s, texto: string) => s.copiar(texto),
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
): () => void {
  for (const [ruta, fn] of Object.entries(TABLA) as [RutaIpc, Manejador][]) {
    ipcMain.handle(`${PREFIJO_CANAL}${ruta}`, async (_e, ...args) => {
      try {
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
