import { describe, expect, it } from 'vitest';
import { comillas } from '../src/cli/archivoCli';
import { literalPowerShell } from '../../../packages/core/src/plataforma/literalPowerShell';

// El cliente `wolf` es un solo archivo sin dependencias y lleva su copia del literal de PowerShell
// del núcleo. Esta prueba las mantiene idénticas: si una cambia sin la otra, falla.
const HOSTILES = [
  'O’; Write-Output INYECTADO; ’x',
  'O‘; Write-Output INYECTADO; ‘x',
  'O‚; Write-Output INYECTADO; ‚x',
  'O‛; Write-Output INYECTADO; ‛x',
  "O'; Write-Output INYECTADO; 'x",
] as const;

describe('comillas() del cliente wolf equivale a literalPowerShell() del núcleo', () => {
  it.each(HOSTILES)('valor hostil %s', (v) => {
    expect(comillas(v)).toBe(literalPowerShell(v));
  });

  it('también con textos normales, vacíos y con varias comillas seguidas', () => {
    for (const v of ['', String.raw`C:\Datos\a b`, "''", "‘’‚‛'", 'ñandú ’']) {
      expect(comillas(v)).toBe(literalPowerShell(v));
    }
  });
});
