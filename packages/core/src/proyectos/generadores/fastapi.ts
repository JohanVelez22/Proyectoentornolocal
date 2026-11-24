import type { PasoReceta } from '../config';
import { procesoUvicorn } from '../recetas';
import {
  argsBase,
  dominioDe,
  motorDelPedido,
  paso,
  pasoSitio,
  type Generador,
  type PedidoProyecto,
} from './comun';

/**
 * FastAPI: plantilla interna (`main.py`, `requirements.txt`), venv, dependencias, base en
 * PostgreSQL por defecto (pgvector la exige) y el proceso uvicorn supervisado que el sitio usa
 * como destino del proxy.
 */
export const generadorFastapi: Generador = {
  tipoSitio: 'fastapi',
  dominio: dominioDe,
  motorPorDefecto: () => 'postgresql',
  pasos(p: PedidoProyecto): PasoReceta[] {
    const pgvector = p.opciones.pgvector === true && p.base !== null;
    const motor = motorDelPedido(p, 'postgresql');
    const base = argsBase(p, motor);
    return [
      paso('copiar-plantilla-interna', 'Crear los archivos de la API', {
        plantilla: 'fastapi',
        nombre: p.nombre,
        pgvector,
        ...base,
      }),
      paso('python-venv', 'Crear el entorno virtual (.venv)'),
      paso('pip-install', 'Instalar dependencias de Python (pip)'),
      ...(p.base
        ? [
            paso('bd-crear', 'Crear la base de datos', { ...base, nueva: true }),
            paso('env-crear', 'Crear el archivo .env', base),
          ]
        : []),
      ...(pgvector ? [paso('pgvector-activar', 'Activar pgvector en la base', base)] : []),
      pasoSitio(p, generadorFastapi, { procesos: [procesoUvicorn({ moduloAsgi: 'main:app' })] }),
    ];
  },
};
