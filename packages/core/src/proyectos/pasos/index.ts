import type { TipoPaso } from '../config';
import type { ImplementacionPaso, RegistroPasos } from '../pasos';
import { pasoBdCrear, pasoBdRestaurar, pasoPgvectorActivar } from './bd';
import { pasoComando } from './comando';
import type { DepsPasos } from './comun';
import { pasoComposerInstall } from './composer';
import { pasoConfigBdCrear } from './configBd';
import { pasoCopiarPlantillaInterna } from './copiarPlantillaInterna';
import { pasoCrearDesdeComposer } from './crearDesdeComposer';
import { pasoDescargarPlantilla } from './descargarPlantilla';
import { pasoEnvCrear } from './env';
import { pasoKeyGenerate, pasoMigrar, pasoStorageLink } from './laravel';
import { pasoNpmBuild, pasoNpmCi } from './node';
import { pasoPipInstall, pasoPythonVenv } from './python';
import { pasoSitioCrear } from './sitio';

export type { DepsPasos } from './comun';
export { nombreBase } from './comun';
export { fijarLinea, MENSAJE_ENV_EXISTE } from './env';

const FABRICAS: Record<TipoPaso, (d: DepsPasos) => ImplementacionPaso> = {
  'composer-install': pasoComposerInstall,
  'env-crear': pasoEnvCrear,
  'key-generate': pasoKeyGenerate,
  'bd-crear': pasoBdCrear,
  'bd-restaurar': pasoBdRestaurar,
  migrar: pasoMigrar,
  'storage-link': pasoStorageLink,
  'npm-ci': pasoNpmCi,
  'npm-build': pasoNpmBuild,
  'python-venv': pasoPythonVenv,
  'pip-install': pasoPipInstall,
  'pgvector-activar': pasoPgvectorActivar,
  'sitio-crear': pasoSitioCrear,
  comando: pasoComando,
  'crear-desde-composer': pasoCrearDesdeComposer,
  'descargar-plantilla': pasoDescargarPlantilla,
  'copiar-plantilla-interna': pasoCopiarPlantillaInterna,
  'config-bd-crear': pasoConfigBdCrear,
};

/** Registra las implementaciones reales de todos los tipos de paso y devuelve el registro. */
export function registrarPasosReales(registro: RegistroPasos, deps: DepsPasos): RegistroPasos {
  for (const [tipo, fabrica] of Object.entries(FABRICAS) as [
    TipoPaso,
    (d: DepsPasos) => ImplementacionPaso,
  ][]) {
    registro.registrar(tipo, fabrica(deps));
  }
  return registro;
}
