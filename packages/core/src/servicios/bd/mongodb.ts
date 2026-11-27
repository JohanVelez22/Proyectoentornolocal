import { existsSync, readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { DefProceso } from '../../procesos/supervisor';
import { registrarDefinicion } from '../datos';
import type { CtxServicio, DefServicio } from '../definicion';
import { compararVersiones } from '../nginx';
import { nombreEjecutable } from '../../plataforma/sistema';

const exe = (c: CtxServicio, nombre: string): string => path.join(c.bin, 'bin', nombre);

/** mongosh más reciente instalado (es un paquete aparte), o null. */
function mongosh(c: CtxServicio): string | null {
  const carpeta = path.dirname(c.rutas.bin('mongosh', '0'));
  if (!existsSync(carpeta)) return null;
  const versiones = readdirSync(carpeta).sort(compararVersiones).reverse();
  for (const v of versiones) {
    const ruta = path.join(c.rutas.bin('mongosh', v), 'bin', nombreEjecutable('mongosh'));
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

/** Sin autenticación a propósito: solo escucha en 127.0.0.1 (decisión de la especificación). */
export function defMongodb(): DefServicio {
  return {
    id: 'mongodb',
    nombre: 'MongoDB',
    categoria: 'bd',
    puertoPorDefecto: 27017,
    puertoAlternativo: 27018,

    async inicializar(c) {
      await mkdir(c.datos, { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      return {
        id: 'mongodb',
        comando: exe(c, nombreEjecutable('mongod')),
        args: ['--dbpath', c.datos, '--port', String(c.puerto), '--bind_ip', '127.0.0.1'],
        cwd: c.bin,
        puerto: c.puerto,
        log: c.rutas.logs('mongodb.log'),
        reiniciar: false,
      };
    },

    async detenerLimpio(c) {
      // Sin mongosh no hay apagado limpio: el supervisor detiene el proceso.
      const sh = mongosh(c);
      if (!sh) return;
      // shutdownServer corta la conexión y mongosh puede salir con error: no es un fallo real.
      await c.exec(sh, [
        '--host',
        '127.0.0.1',
        '--port',
        String(c.puerto),
        '--quiet',
        '--eval',
        "db.getSiblingDB('admin').shutdownServer()",
      ]);
    },
  };
}

registrarDefinicion(defMongodb());
