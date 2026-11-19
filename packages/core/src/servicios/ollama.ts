import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { DefProceso } from '../procesos/supervisor';
import { registrarDefinicion } from './datos';
import type { DefServicio } from './definicion';
import { nombreEjecutable } from '../plataforma/sistema';

const modelos = (datos: string): string => path.join(datos, 'models');

export function defOllama(): DefServicio {
  return {
    id: 'ollama',
    nombre: 'Ollama',
    categoria: 'ia',
    puertoPorDefecto: 11434,
    claveDatos: () => 'actual',

    async inicializar(c) {
      await mkdir(modelos(c.datos), { recursive: true });
    },

    async proceso(c): Promise<DefProceso> {
      return {
        id: 'ollama',
        comando: path.join(c.bin, nombreEjecutable('ollama')),
        args: ['serve'],
        cwd: c.bin,
        // Sin secretos: se guarda en run/estado.json sin problema.
        env: { OLLAMA_HOST: `127.0.0.1:${c.puerto}`, OLLAMA_MODELS: modelos(c.datos) },
        puerto: c.puerto,
        log: c.rutas.logs('ollama.log'),
        reiniciar: false,
      };
    },
  };
}

registrarDefinicion(defOllama());
