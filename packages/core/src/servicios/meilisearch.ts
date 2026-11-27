import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { nombreEjecutable } from '../plataforma/sistema';
import type { DefProceso } from '../procesos/supervisor';
import { claveMayorMenor } from '../rutas';
import { registrarDefinicion } from './datos';
import type { DefServicio } from './definicion';

/** Solo bucle local, puesto de forma explícita: nunca depende del valor por defecto del binario. */
export const DIRECCION_MEILISEARCH = '127.0.0.1';

/**
 * Argumentos de Meilisearch. La master key NO va aquí: se pasa por `MEILI_MASTER_KEY` en
 * `envSecreto` (la línea de órdenes es visible para otros procesos y `estado.json` guardaría
 * los args). `--env production` exige la clave (sin ella no arranca) y desactiva el panel sin
 * autenticar.
 */
export function argsMeilisearch(datos: string, puerto: number): string[] {
  return [
    '--http-addr',
    `${DIRECCION_MEILISEARCH}:${puerto}`,
    '--env',
    'production',
    '--db-path',
    path.join(datos, 'data.ms'),
    '--dump-dir',
    path.join(datos, 'dumps'),
    '--snapshot-dir',
    path.join(datos, 'snapshots'),
    '--no-analytics',
  ];
}

/**
 * Meilisearch (búsqueda para Laravel Scout). Los datos de una rama menor no los abre otra
 * (hay que migrar con un dump), por eso la carpeta y la instancia son por "mayor.menor".
 */
export function defMeilisearch(): DefServicio {
  return {
    id: 'meilisearch',
    nombre: 'Meilisearch',
    categoria: 'herramienta',
    puertoPorDefecto: 7700,
    puertoAlternativo: 7701,
    claveDatos: claveMayorMenor,

    async inicializar(c) {
      await mkdir(c.datos, { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      return {
        id: 'meilisearch',
        comando: path.join(c.bin, nombreEjecutable('meilisearch')),
        args: argsMeilisearch(c.datos, c.puerto),
        cwd: c.datos,
        env: { MEILI_NO_ANALYTICS: 'true' },
        envSecreto: { MEILI_MASTER_KEY: c.credenciales.clave },
        // Meilisearch lee cualquier MEILI_* del entorno (MEILI_IMPORT_DUMP, MEILI_HTTP_ADDR…): una
        // variable de la sesión del usuario no debe cambiar dónde escucha ni qué importa.
        quitarEntorno: ['MEILI_'],
        puerto: c.puerto,
        log: c.rutas.logs('meilisearch.log'),
        reiniciar: false,
      };
    },
  };
}

registrarDefinicion(defMeilisearch());
