import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Git, LaboratorioGit } from '@pel/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  accionesDelPaso,
  ejecutarPaso,
  PASOS_CONFLICTO,
  PASO_ELEGIR,
  PASO_MERGE,
  VERSIONES,
} from '../src/renderer/utilidades/conflictoGuiado';

// Ejercicio guiado del laboratorio de Git (D50), con el git real en una carpeta temporal.
const rutaGit = new Git().buscar('git');
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'pel-labconf-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('pasos del ejercicio del conflicto', () => {
  it('solo usan órdenes de la lista cerrada del núcleo y archivos de práctica', async () => {
    const { validarOrdenLaboratorio } = await import('@pel/core');
    for (let p = 0; p < PASOS_CONFLICTO; p++) {
      for (const a of accionesDelPaso(p, 'mia')) {
        if ('orden' in a) expect(() => validarOrdenLaboratorio(a.orden)).not.toThrow();
      }
    }
    expect(accionesDelPaso(PASO_ELEGIR)).toEqual([]);
  });
});

describe.skipIf(rutaGit === null)('con git real', () => {
  it.each(['mia', 'otra', 'ambas'] as const)(
    'recorre los 6 pasos con la elección «%s», el merge deja conflicto y el final lo resuelve',
    async (eleccion) => {
      const lab = new LaboratorioGit({
        raiz: path.join(dir, 'laboratorio-git'),
        buscarGit: () => rutaGit,
      });
      await lab.estado();
      for (let p = 0; p < PASOS_CONFLICTO; p++) {
        const r = await ejecutarPaso(lab, p, eleccion);
        expect(r.fallo, `paso ${p + 1}`).toBe(false);
        if (p === PASO_MERGE) {
          expect(r.ultimo?.codigo).not.toBe(0);
          expect(r.ultimo?.salida).toMatch(/CONFLICT/);
          expect((await lab.leerArchivo('colores.txt')).contenido).toContain('<<<<<<<');
        }
      }
      expect((await lab.leerArchivo('colores.txt')).contenido).toBe(VERSIONES[eleccion]);
      const fin = await lab.ejecutar({ cmd: 'status' });
      expect(fin.salida).toMatch(/nothing to commit|working tree clean/);
      expect(fin.grafo).toContain('Resolver el conflicto');
    },
  );
});
