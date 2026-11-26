import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { nombreEjecutable } from '../plataforma/sistema';
import type { DefProceso } from '../procesos/supervisor';
import { registrarDefinicion } from './datos';
import type { DefServicio } from './definicion';

/** Solo bucle local, puesto de forma explícita en la API y en la consola. */
export const DIRECCION_MINIO = '127.0.0.1';
/** API S3 (fuera de 9000-9999, reservado a PHP) y consola web. */
export const PUERTO_API_MINIO = 19000;
export const PUERTO_CONSOLA_MINIO = 19001;

/**
 * Argumentos de MinIO. El usuario y la clave raíz NO van aquí: se pasan por `MINIO_ROOT_USER` y
 * `MINIO_ROOT_PASSWORD` en `envSecreto` (no se ven en la línea de órdenes ni en `estado.json`).
 */
export function argsMinio(datos: string, puerto: number): string[] {
  return [
    'server',
    path.join(datos, 'objetos'),
    '--address',
    `${DIRECCION_MINIO}:${puerto}`,
    '--console-address',
    `${DIRECCION_MINIO}:${PUERTO_CONSOLA_MINIO}`,
  ];
}

/**
 * MinIO (almacenamiento S3 para `FILESYSTEM_DISK=s3`). El proyecto está archivado: la última
 * release con binario de Windows es de 2025 y no recibe parches; por eso solo escucha en local.
 */
export function defMinio(): DefServicio {
  return {
    id: 'minio',
    nombre: 'MinIO',
    categoria: 'herramienta',
    puertoPorDefecto: PUERTO_API_MINIO,
    puertosExtra: [PUERTO_CONSOLA_MINIO],
    claveDatos: () => 'actual',
    multiInstancia: false,

    async inicializar(c) {
      await mkdir(path.join(c.datos, 'objetos'), { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      return {
        id: 'minio',
        comando: path.join(c.bin, nombreEjecutable('minio')),
        args: argsMinio(c.datos, c.puerto),
        cwd: c.datos,
        env: { MINIO_UPDATE: 'off' },
        envSecreto: {
          MINIO_ROOT_USER: c.credenciales.usuario,
          MINIO_ROOT_PASSWORD: c.credenciales.clave,
        },
        puerto: c.puerto,
        log: c.rutas.logs('minio.log'),
        reiniciar: false,
      };
    },
  };
}

registrarDefinicion(defMinio());
