import { describe, expect, it } from 'vitest';
import { raizSistemaCli } from '../src/cli/archivoCli';
import { raizSistema } from '../../../packages/core/src/plataforma/raizSistema';

// El cliente `wolf` no importa `@pel/core` y lleva su copia del criterio de la carpeta de Windows.
// Esta prueba las mantiene idénticas con valores hostiles: si una cambia sin la otra, falla.
const existe = (r: string): boolean => r.toUpperCase().startsWith('C:');
const ENTORNOS: NodeJS.ProcessEnv[] = [
  {},
  { SystemRoot: 'C:\\Windows' },
  { SystemRoot: '\\\\servidor\\recurso\\Windows', windir: 'C:\\W' },
  { SystemRoot: 'Windows' },
  { SystemRoot: 'C:\\Windows\\..\\..\\Temp' },
  { SystemRoot: 'Z:\\Win', SYSTEMROOT: 'C:\\Otra' },
  { windir: 'C:\\Win' },
  { SystemRoot: 'C:\\Win"dows' },
];

describe('raizSistemaCli() del cliente wolf equivale a raizSistema() del núcleo', () => {
  it.each(ENTORNOS.map((e) => [JSON.stringify(e), e] as const))('entorno %s', (_n, e) => {
    expect(raizSistemaCli(e, existe)).toBe(raizSistema(e, existe));
  });
});
