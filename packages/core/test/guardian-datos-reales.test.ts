import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { rutaBasePorDefecto } from '../src/rutas';
import { CARPETAS_DATOS_REALES } from './soporte/guardian-datos-reales';

describe('guardián de la carpeta de datos real', () => {
  it('la ruta de datos por defecto cae en la carpeta temporal de las pruebas, nunca en la real', () => {
    const sandbox = process.env.WOLFCORE_GUARDIAN_SANDBOX;
    expect(sandbox).toBeTruthy();
    const base = path.resolve(rutaBasePorDefecto());
    expect(base.toLowerCase().startsWith(path.resolve(sandbox!).toLowerCase())).toBe(true);
    for (const real of CARPETAS_DATOS_REALES) {
      expect(base.toLowerCase()).not.toBe(real.toLowerCase());
    }
  });

  it('conoce la carpeta real del usuario para compararla', () => {
    const esperada = path.join(os.homedir(), 'AppData', 'Local', 'WolfCoreDev').toLowerCase();
    expect(CARPETAS_DATOS_REALES.map((r) => r.toLowerCase())).toContain(esperada);
  });
});
