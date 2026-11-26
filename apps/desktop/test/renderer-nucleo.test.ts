import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as cliente from '../../../packages/core/src/cliente';

const SRC = path.join(__dirname, '..', 'src');

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return fuentes(p);
    return /\.(ts|vue)$/.test(n) ? [p] : [];
  });
}

/** Nombres que un archivo importa como valor (no tipos) de '@pel/core'. */
function valoresDeNucleo(codigo: string): string[] {
  const res: string[] = [];
  for (const m of codigo.matchAll(/import\s+(?!type\b)\{([^}]*)\}\s*from\s*'@pel\/core'/g)) {
    for (const parte of m[1]!.split(',')) {
      const nombre = parte.trim();
      if (nombre && !nombre.startsWith('type ')) res.push(nombre.split(/\s+as\s+/)[0]!);
    }
  }
  return res;
}

describe('la ventana solo usa la parte pura del núcleo (D41)', () => {
  it('el renderer resuelve @pel/core al archivo `cliente.ts`, no al índice entero', () => {
    const config = readFileSync(path.join(__dirname, '..', 'electron.vite.config.ts'), 'utf8');
    const renderer = config.slice(config.indexOf('renderer: {'));
    expect(renderer).toContain("'@pel/core': coreRenderer");
    expect(config).toContain('packages/core/src/cliente.ts');
  });

  it('todo lo que el renderer y shared importan como valor de @pel/core sale de cliente.ts', () => {
    const faltan: string[] = [];
    for (const f of [
      ...fuentes(path.join(SRC, 'renderer')),
      ...fuentes(path.join(SRC, 'shared')),
    ]) {
      const codigo = f.endsWith('.vue')
        ? [...readFileSync(f, 'utf8').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
            .map((m) => m[1])
            .join('\n')
        : readFileSync(f, 'utf8');
      for (const nombre of valoresDeNucleo(codigo)) {
        if (!(nombre in cliente)) faltan.push(`${path.relative(SRC, f)}: ${nombre}`);
      }
    }
    expect(faltan).toEqual([]);
  });

  it('cliente.ts no importa módulos de Node ni de bases de datos', () => {
    const codigo = readFileSync(
      path.join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'cliente.ts'),
      'utf8',
    );
    expect(codigo).not.toMatch(/node:|mysql2|from 'pg'/);
  });

  it('proveedores.ts no arma la lista de redes al cargar (node:net no existe en la ventana)', () => {
    const codigo = readFileSync(
      path.join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'correo', 'proveedores.ts'),
      'utf8',
    );
    expect(codigo).not.toMatch(/^(const|let)\s+\w+\s*=.*new BlockList/m);
    expect(codigo).not.toMatch(/^const REDES_NO_PUBLICAS/m);
  });
});
