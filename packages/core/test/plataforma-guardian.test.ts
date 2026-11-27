import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Prueba guardián de la capa Plataforma: fuera de `src/plataforma/` ningún módulo del núcleo
 * depende de Windows a mano. Se revisa el código sin comentarios (los comentarios pueden hablar
 * de Windows). Los datos del catálogo (`catalogo.json`) no se revisan: son por sistema a propósito.
 */
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const PLATAFORMA = path.join(SRC, 'plataforma');

const PROHIBIDOS: { nombre: string; patron: RegExp }[] = [
  { nombre: 'process.platform', patron: /process\.platform/ },
  { nombre: 'path.win32', patron: /path\.win32/ },
  { nombre: 'PowerShell', patron: /\bpowershell\b/i },
  { nombre: 'netsh', patron: /\bnetsh\b/i },
  { nombre: "nombre '.exe'", patron: /\.exe['"`]/i },
];

/**
 * Excepciones explícitas (archivo relativo a src → motivo). Vacía: cualquier entrada nueva
 * necesita un motivo escrito aquí y en el informe de la tarea.
 */
const PERMITIDOS: Record<string, string> = {};

function archivosTs(dir: string): string[] {
  const res: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (ruta !== PLATAFORMA) res.push(...archivosTs(ruta));
    } else if (e.name.endsWith('.ts')) res.push(ruta);
  }
  return res;
}

/** Quita comentarios de bloque y de línea (no los `//` de una URL, que van tras `:`). */
export function sinComentarios(codigo: string): string {
  return (
    codigo
      // Se conservan los saltos para que los números de línea sigan siendo los del archivo.
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ''))
      .split('\n')
      .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
      .join('\n')
  );
}

describe('guardián de la capa Plataforma', () => {
  it('quita comentarios sin tocar las URLs', () => {
    expect(sinComentarios("const u = 'https://x'; // powershell")).toBe("const u = 'https://x'; ");
    expect(sinComentarios('/* path.win32 */a')).toBe('a');
  });

  it('detecta cada patrón prohibido', () => {
    const ejemplos = [
      'if (process.platform === "win32") {}',
      'path.win32.join(a, b)',
      "run('powershell', [])",
      "run('netsh', [])",
      "const e = 'php.exe';",
    ];
    for (const [i, ej] of ejemplos.entries()) {
      expect(PROHIBIDOS[i]!.patron.test(sinComentarios(ej))).toBe(true);
    }
  });

  it('ningún módulo fuera de plataforma/ usa process.platform, path.win32, PowerShell, netsh ni .exe', () => {
    const violaciones: string[] = [];
    for (const archivo of archivosTs(SRC)) {
      const rel = path.relative(SRC, archivo).split(path.sep).join('/');
      if (Object.hasOwn(PERMITIDOS, rel)) continue;
      const lineas = sinComentarios(readFileSync(archivo, 'utf8')).split('\n');
      lineas.forEach((l, i) => {
        for (const p of PROHIBIDOS) {
          if (p.patron.test(l)) violaciones.push(`${rel}:${i + 1} (${p.nombre}): ${l.trim()}`);
        }
      });
    }
    expect(violaciones).toEqual([]);
  });
});
