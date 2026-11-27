import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lanzadorPorDefecto } from '../src/plataforma/lanzar';
import { carpetaTemporal } from './temporales';

const pids: number[] = [];
afterEach(() => {
  // Limpieza de la prueba: solo los PID que ella misma lanzó.
  for (const p of pids.splice(0)) {
    try {
      process.kill(p, 'SIGKILL');
    } catch {
      // ya no existe
    }
  }
});

/** Un padre que lanza un nieto desprendido que hereda stdout y stderr y se queda vivo. */
async function guion(dir: string, padreSale: boolean): Promise<string> {
  const f = join(dir, 'padre.js');
  await writeFile(
    f,
    [
      "const { spawn } = require('node:child_process');",
      "const n = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'],",
      "  { detached: true, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true });",
      "console.log('NIETO ' + n.pid);",
      'n.unref();',
      padreSale ? 'process.exit(0);' : 'setInterval(() => {}, 1000);',
    ].join('\n'),
  );
  return f;
}

describe('lanzadorPorDefecto: tiempo máximo con un nieto que hereda stdout', () => {
  it('un hijo que sale dejando un nieto con stdout abierto no cuelga el lanzamiento (gracia)', async () => {
    const dir = await carpetaTemporal('pel-lanzar-');
    const f = await guion(dir, true);
    const lineas: string[] = [];
    const t0 = Date.now();
    const r = await lanzadorPorDefecto(process.execPath, [f], {
      graciaMs: 400,
      matarGrupo: true,
      alLinea: (l) => {
        lineas.push(l);
        const m = /^NIETO (\d+)/.exec(l);
        if (m) pids.push(Number(m[1]));
      },
    });
    expect(r.codigo).toBe(0);
    expect(lineas.some((l) => l.startsWith('NIETO'))).toBe(true);
    expect(Date.now() - t0).toBeLessThan(15_000);
  }, 30_000);

  it('al abortar, termina aunque un nieto siga con la salida abierta', async () => {
    const dir = await carpetaTemporal('pel-lanzar-');
    const f = await guion(dir, false);
    const control = new AbortController();
    const t0 = Date.now();
    const p = lanzadorPorDefecto(process.execPath, [f], {
      senal: control.signal,
      graciaMs: 500,
      matarGrupo: true,
      alLinea: (l) => {
        const m = /^NIETO (\d+)/.exec(l);
        if (m) {
          pids.push(Number(m[1]));
          setTimeout(() => control.abort(), 200);
        }
      },
    });
    const r = await p;
    expect(typeof r.codigo).toBe('number');
    expect(control.signal.aborted).toBe(true);
    expect(Date.now() - t0).toBeLessThan(15_000);
  }, 30_000);

  it('sin graciaMs (recetas y demás) el comportamiento de siempre no cambia', async () => {
    const dir = await carpetaTemporal('pel-lanzar-');
    const f = join(dir, 'a.js');
    await writeFile(f, "console.log('hola'); process.exit(3);");
    const lineas: string[] = [];
    const r = await lanzadorPorDefecto(process.execPath, [f], { alLinea: (l) => lineas.push(l) });
    expect(r.codigo).toBe(3);
    expect(lineas).toEqual(['hola']);
  });
});

describe('matarArbol: grupo en POSIX', () => {
  it('con grupo mata el grupo entero (pid negativo) y sin él solo el proceso', async () => {
    const { matarArbol } = await import('../src/plataforma/lanzar');
    const llamadas: Array<[number, string]> = [];
    const kills: string[] = [];
    const hijo = { pid: 4321, kill: (s?: string) => (kills.push(String(s)), true) };
    matarArbol(hijo, {
      salio: false,
      plataforma: 'linux',
      grupo: true,
      matarProceso: (p, s) => llamadas.push([p, s]),
    });
    expect(llamadas).toEqual([[-4321, 'SIGKILL']]);
    expect(kills).toEqual([]);
    matarArbol(hijo, { salio: false, plataforma: 'linux' });
    expect(kills).toEqual(['SIGKILL']);
    // El grupo ya no existe: se prueba con el proceso solo.
    matarArbol(hijo, {
      salio: false,
      plataforma: 'linux',
      grupo: true,
      matarProceso: () => {
        throw new Error('ESRCH');
      },
    });
    expect(kills).toEqual(['SIGKILL', 'SIGKILL']);
    // Un proceso que ya salió no se toca (su PID podría ser de otro).
    matarArbol(hijo, {
      salio: true,
      plataforma: 'linux',
      grupo: true,
      matarProceso: () => llamadas.push([0, 'x']),
    });
    expect(llamadas).toHaveLength(1);
  });
});
