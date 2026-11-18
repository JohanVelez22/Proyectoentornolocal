import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DefProceso } from '../../procesos/supervisor';
import { claveMayor } from '../../rutas';
import { registrarDefinicion } from '../datos';
import type { CtxServicio, DefServicio } from '../definicion';

// El zip (build msys2) trae los ejecutables en la raíz tras quitar la subcarpeta.
const exe = (c: CtxServicio, nombre: string): string => path.join(c.bin, nombre);

/** Redis (msys2) espera "/" en las rutas y comillas si llevan espacios. */
const adelante = (p: string): string => p.replaceAll('\\', '/');

/**
 * Sin clave a propósito: solo escucha en 127.0.0.1 (decisión de la especificación).
 * `protected-mode yes` rechaza además conexiones que no sean de loopback.
 */
export function contenidoRedis(datos: string, puerto: number): string {
  return [
    'bind 127.0.0.1',
    `port ${puerto}`,
    `dir "${adelante(datos)}"`,
    'appendonly yes',
    'protected-mode yes',
    '',
  ].join('\n');
}

function rutaConf(c: CtxServicio): string {
  return path.join(c.rutas.base, 'etc', 'redis', path.basename(c.datos), 'redis.conf');
}

export function defRedis(): DefServicio {
  return {
    id: 'redis',
    nombre: 'Redis',
    categoria: 'bd',
    puertoPorDefecto: 6379,
    puertoAlternativo: 6380,
    claveDatos: claveMayor,

    async inicializar(c) {
      await mkdir(c.datos, { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      // Se regenera en cada arranque: el puerto puede haber cambiado.
      const conf = rutaConf(c);
      await mkdir(path.dirname(conf), { recursive: true });
      await writeFile(conf, contenidoRedis(c.datos, c.puerto), 'utf8');
      return {
        id: 'redis',
        comando: exe(c, 'redis-server.exe'),
        args: [conf],
        cwd: c.bin,
        puerto: c.puerto,
        log: c.rutas.logs('redis.log'),
        reiniciar: false,
      };
    },

    async detenerLimpio(c) {
      const r = await c.exec(exe(c, 'redis-cli.exe'), [
        '-h',
        '127.0.0.1',
        '-p',
        String(c.puerto),
        'shutdown',
      ]);
      if (r.codigo !== 0) throw new Error('No se pudo apagar Redis de forma limpia.');
    },
  };
}

registrarDefinicion(defRedis());
