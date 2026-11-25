import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';

/**
 * Con un Python real: un `venv.py` o un `pip.py` en la raíz del proyecto se importaría antes que
 * la biblioteca estándar si no fuera por `-I`. Sin Python en el equipo, la prueba se omite.
 */
const python = ((): string | null => {
  for (const c of ['python3', 'python']) {
    const r = spawnSync(c, ['-I', '-c', 'import sys;print(sys.version_info[0])'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (r.status === 0 && r.stdout.trim() === '3') return c;
  }
  return null;
})();

describe.skipIf(python === null)('python -I con un proyecto hostil', () => {
  async function proyecto(): Promise<{ carpeta: string; centinela: string }> {
    const carpeta = await carpetaTemporal('py-hostil-');
    const centinela = join(carpeta, 'centinela-py.txt');
    const codigo = `open(${JSON.stringify(centinela)}, 'w').write('ejecutado')\n`;
    for (const n of ['venv.py', 'pip.py', 'sitecustomize.py']) {
      await writeFile(join(carpeta, n), codigo);
    }
    await mkdir(join(carpeta, 'sub'), { recursive: true });
    return { carpeta, centinela };
  }

  it('sin -I el centinela aparece (la prueba detecta el problema)', async () => {
    const { carpeta, centinela } = await proyecto();
    spawnSync(python!, ['-m', 'venv', '--help'], { cwd: carpeta, windowsHide: true });
    expect(existsSync(centinela)).toBe(true);
  });

  it('con -I no se importa nada del proyecto', async () => {
    const { carpeta, centinela } = await proyecto();
    const v = spawnSync(python!, ['-I', '-m', 'venv', '--help'], {
      cwd: carpeta,
      windowsHide: true,
    });
    const p = spawnSync(python!, ['-I', '-m', 'pip', '--version'], {
      cwd: carpeta,
      windowsHide: true,
    });
    expect(v.status).toBe(0);
    expect(p.status === 0 || p.status === 1).toBe(true);
    expect(existsSync(centinela)).toBe(false);
  });

  it('el flujo de python-venv (venv sin pip + ensurepip desde fuera, pip con -I -X utf8) no importa nada del proyecto', async () => {
    const { carpeta, centinela } = await proyecto();
    const codigo = `open(${JSON.stringify(centinela)}, 'w').write('ejecutado')
`;
    await writeFile(join(carpeta, 'ensurepip.py'), codigo);
    await writeFile(join(carpeta, 'requirements.txt'), '# Árbol de dependencias: Á é ñ\n');
    const fuera = await carpetaTemporal('pel-py-fuera-');
    const venv = join(carpeta, '.venv');
    const aislado = ['-I', '-X', 'utf8'];
    const a = spawnSync(python!, [...aislado, '-m', 'venv', '--without-pip', venv], {
      cwd: fuera,
      windowsHide: true,
      encoding: 'utf8',
    });
    expect(a.status, a.stderr).toBe(0);
    const exe = existsSync(join(venv, 'Scripts', 'python.exe'))
      ? join(venv, 'Scripts', 'python.exe')
      : join(venv, 'bin', 'python');
    const b = spawnSync(exe, [...aislado, '-m', 'ensurepip', '--default-pip'], {
      cwd: fuera,
      windowsHide: true,
      encoding: 'utf8',
    });
    expect(b.status, b.stderr).toBe(0);
    const c = spawnSync(exe, [...aislado, '-m', 'pip', 'install', '-r', 'requirements.txt'], {
      cwd: carpeta,
      windowsHide: true,
      encoding: 'utf8',
    });
    expect(c.stderr).not.toMatch(/UnicodeDecodeError/);
    expect(existsSync(centinela)).toBe(false);
  }, 120_000);
});
