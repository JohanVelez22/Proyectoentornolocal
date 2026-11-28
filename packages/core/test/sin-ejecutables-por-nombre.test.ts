import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * D54b: ningún ejecutable de Windows se lanza por su nombre (se buscaría en la carpeta actual y en
 * el PATH, que el usuario puede alterar y desde donde un archivo plantado se ejecutaría en lugar
 * del del sistema). Se usa siempre la ruta absoluta de System32 (`rutaPowerShell(entorno)`,
 * `rutaSistema32(entorno, 'tasklist.exe')`…).
 */
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAICES = [
  path.resolve(AQUI, '../src'),
  path.resolve(AQUI, '../../../apps/desktop/src/main'),
  path.resolve(AQUI, '../../../apps/desktop/src/cli'),
];

const EJECUTABLES =
  'powershell|pwsh|cmd|net|net1|ping|attrib|tasklist|netstat|taskkill|reg|sc|wmic|icacls|cacls|schtasks|netsh|takeown|fsutil|ipconfig|nslookup|robocopy|xcopy|where|whoami|rundll32|mshta|cscript|wscript|certutil|msiexec|dism|bcdedit|explorer|wevtutil|route|arp';

/** Una función que lanza un proceso, con el ejecutable como primer argumento literal. */
const INICIO =
  /\b(?:execFile|execFileSync|spawn|spawnSync|exec|execSync|ejecutar|lanzar|lanzarSinShell|run)\w*\s*\(\s*['"`]/
    .source;
const LANZAMIENTO = new RegExp(`${INICIO}(?:${EJECUTABLES})(?:\\.exe)?['"\`]`, 'i');

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return n === 'node_modules' ? [] : archivos(p);
    return /\.(ts|mjs|js)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');

describe('ningún ejecutable del sistema se lanza por nombre', () => {
  it('el detector reconoce los lanzamientos por nombre (una sola línea o en varias)', () => {
    expect(LANZAMIENTO.test("await this.ejecutar('powershell', args)")).toBe(true);
    expect(LANZAMIENTO.test("execFile('tasklist.exe', [])")).toBe(true);
    expect(LANZAMIENTO.test("spawn(\n  'cmd',\n [])")).toBe(true);
    expect(LANZAMIENTO.test("this.ejecutar(rutaPowerShell(this.entorno), ['x'])")).toBe(false);
    expect(LANZAMIENTO.test("lanzar(ruta('cmd')!, ['/K'])")).toBe(false);
  });

  it('el núcleo y el proceso principal de la aplicación usan rutas absolutas', () => {
    const todos = RAICES.flatMap(archivos);
    expect(todos.length).toBeGreaterThan(50);
    const culpables = todos.filter((f) =>
      LANZAMIENTO.test(sinComentarios(readFileSync(f, 'utf8'))),
    );
    expect(culpables.map((f) => path.relative(AQUI, f))).toEqual([]);
  });

  it('el intérprete de comandos no cae a «cmd.exe» a secas', () => {
    const win = sinComentarios(readFileSync(path.join(RAICES[0]!, 'plataforma/win.ts'), 'utf8'));
    expect(win).not.toMatch(/\?\?\s*'cmd\.exe'/);
  });
});
