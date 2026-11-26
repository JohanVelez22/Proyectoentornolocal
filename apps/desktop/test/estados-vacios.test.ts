import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

describe('Estados vacíos que guían (D38b)', () => {
  const claves = Object.keys(
    diccionarios.es.estadosVacios,
  ) as (keyof typeof diccionarios.es.estadosVacios)[];

  it('cada estado dice qué es y por qué está vacío en los 4 idiomas', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const k of claves) {
        const e = d.estadosVacios[k];
        expect(e.titulo.length, `${id}/${k}/titulo`).toBeGreaterThan(5);
        expect(e.texto.length, `${id}/${k}/texto`).toBeGreaterThan(30);
      }
    }
  });

  it('si un estado tiene botón en español, lo tiene en los demás idiomas', () => {
    for (const k of claves) {
      const conAccion = diccionarios.es.estadosVacios[k].accion !== '';
      for (const [id, d] of Object.entries(diccionarios)) {
        expect(d.estadosVacios[k].accion !== '', `${id}/${k}`).toBe(conAccion);
      }
    }
  });

  it('las vistas con lista usan EstadoVacio con ilustración y no un NEmpty pelado', () => {
    for (const f of [
      ['vistas', 'Registros.vue'],
      ['vistas', 'Depuracion.vue'],
      ['vistas', 'Doctor.vue'],
      ['vistas', 'Contenedores.vue'],
      ['vistas', 'BasesDeDatos.vue'],
      ['vistas', 'Ia.vue'],
      ['componentes', 'PanelAvisos.vue'],
      ['componentes', 'PanelInstantaneas.vue'],
      ['componentes', 'VersionesServicio.vue'],
    ]) {
      expect(fuente(...f), f.join('/')).toContain('<EstadoVacio');
    }
    expect(fuente('componentes', 'EstadoVacio.vue')).toContain('IlustracionVacia');
  });
});
