import { crearLanzadorOculto, type LanzadorOculto } from './lanzarOculto';
import { sistemaActual } from './sistema';
import type { CapacidadesPlataforma, Plataforma, PlataformaCompleta } from './tipos';
import { PlataformaWindows } from './win';

export type {
  AccesoPathUsuario,
  CapacidadesPlataforma,
  ComandoManual,
  Ejecutor,
  EstadoAntivirus,
  EstadoServicioSistema,
  IdCatalogo,
  Lanzador,
  IdTerminal,
  OpcionesAbrirTerminal,
  OpcionesEscrituraAdmin,
  OpcionesLanzar,
  PerfilFirefoxSistema,
  Plataforma,
  PlataformaCompleta,
  RangoPuertos,
  ResultadoEscritura,
  MuestraPlataforma,
  ServicioSistema,
  TerminalDisponible,
  UsoProceso,
} from './tipos';
export { IDS_TERMINAL } from './tipos';
export { lanzadorPorDefecto } from './lanzar';
export {
  PlataformaWindows,
  buscarEjecutableWindows,
  interpretarNetstat,
  interpretarNetstatVarios,
  interpretarTasklist,
  interpretarTasklistTodos,
  interpretarMuestraWindows,
  muestraSistemaWindows,
  scriptMuestraWindows,
  type OpcionesPlataformaWindows,
} from './win';
export { PlataformaFalsa, type OpcionesPlataformaFalsa } from './falsa';
export { ordenTerminalUnix, terminalesUnix } from './terminalUnix';
export {
  interpretarAntivirus,
  interpretarProfilesIni,
  interpretarRangosReservados,
  interpretarServiciosSistema,
} from './diagnosticoWin';
export { interpretarDescendientes } from './procesosWin';
export { nombreEjecutable, sistemaActual } from './sistema';

export function crearPlataforma(): Plataforma {
  if (sistemaActual() === 'win32') return new PlataformaWindows();
  throw new Error('Plataforma aún no soportada (fase 4)');
}

const CAPACIDADES: readonly (keyof CapacidadesPlataforma)[] = [
  'carpetaDatos',
  'carpetaInicio',
  'idCatalogo',
  'nombreEjecutable',
  'buscarEjecutable',
  'carpetasNpmGlobal',
  'carpetasContenedores',
  'pathUsuario',
  'leerVariableUsuario',
  'variableUsuario',
  'abrirTerminal',
  'terminalesInstaladas',
  'lanzadorOculto',
  'descendientes',
  'rangosReservados',
  'serviciosSistema',
  'vcRedistInstalado',
  'perfilesFirefox',
  'firefoxEnUso',
  'raicesSistema',
  'detenerServicioSistema',
  'quitarSoloLecturaHosts',
  'instalarVcRedist',
  'antivirus',
  'comandoManual',
  'restringirAlUsuario',
];

/**
 * Da una `PlataformaCompleta` a partir de una que puede ser parcial (las implementaciones de
 * prueba anteriores a la Etapa C). Lo que falta lo pone `respaldo`; el núcleo usa la de Windows
 * con su ejecutor, que es exactamente lo que hacía el código antes de pasar por la plataforma.
 * La parcial sigue siendo la base: si una prueba le cambia un método, se ve el cambio.
 */
export function completarPlataforma(
  p: Plataforma,
  respaldo: PlataformaCompleta,
): PlataformaCompleta {
  const faltan = CAPACIDADES.filter((k) => typeof p[k] !== 'function');
  if (faltan.length === 0) return p as PlataformaCompleta;
  const res = Object.create(p) as Record<string, unknown>;
  for (const k of faltan) {
    const fn = respaldo[k] as (...a: unknown[]) => unknown;
    res[k] = (...a: unknown[]) => fn.apply(respaldo, a);
  }
  return res as unknown as PlataformaCompleta;
}

/**
 * Lanzador oculto que corresponde a la plataforma: el suyo si lo tiene; con una plataforma
 * parcial, en Windows el de PowerShell con su `procesoVivo`/`matarArbol` (como antes de la
 * migración) y en los demás sistemas ninguno.
 */
export function lanzadorOcultoPara(p: Plataforma, carpetaTmp: string): LanzadorOculto | null {
  if (p.lanzadorOculto) return p.lanzadorOculto(carpetaTmp);
  if (sistemaActual() !== 'win32') return null;
  return crearLanzadorOculto({
    procesoVivo: (pid) => p.procesoVivo(pid),
    matarArbol: (pid) => p.matarArbol(pid),
    carpetaTmp,
  });
}
