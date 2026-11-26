import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * D38c: el diálogo «Datos de conexión» no recibe ningún secreto al abrirse. La clave y el bloque
 * .env completo se piden al pulsar «Mostrar» o «Copiar» (rutas `revelar`, mismo modelo que
 * `env.revelar`).
 */
const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', ...p), 'utf8');

describe('DialogoConexion: secretos solo a pedido', () => {
  const v = fuente('renderer', 'componentes', 'DialogoConexion.vue');

  it('trabaja con la vista sin clave y no lee `datos.clave`', () => {
    expect(v).toContain('DatosConexionVista');
    expect(v).not.toMatch(/\bd\.clave\b|datos\.value\.clave|datos\.clave/);
    expect(v).toContain('tieneClave');
  });

  it('la clave se pide con revelar al pulsar Mostrar o Copiar, y se olvida al cerrar', () => {
    expect(v).toContain('api().servicios.revelarSecreto(');
    expect(v).toContain('api().bd.revelar(');
    expect(v).toContain('@click="alternarClave"');
    expect(v).toMatch(/function olvidar\(\)[\s\S]*claveVisible\.value = null/);
  });

  it('«Copiar .env» pide el bloque completo aparte; el que se ve va enmascarado', () => {
    expect(v).toContain('api().bd.revelarBloqueEnv(');
    expect(v).toContain('@click="copiarEnv"');
    // El texto del recuadro es siempre el bloque enmascarado de bloqueEnv/bloqueEnvSitio.
    expect(v).toContain('api().bd.bloqueEnv(');
    expect(v).not.toMatch(/bloque\.value = .*revelarBloqueEnv/);
  });

  it('el preload expone las rutas de revelar y ninguna de las normales devuelve clave', () => {
    const p = fuente('preload', 'index.ts');
    for (const r of ['bd.revelar', 'bd.revelarBloqueEnv', 'servicios.revelarSecreto']) {
      expect(p).toContain(`'${r}'`);
    }
    const api = fuente('shared', 'api.ts');
    expect(api).toMatch(/conexion\(motor: ObjetivoBdIpc\): Promise<DatosConexionVista>/);
    expect(api).toMatch(
      /conexion\(ref: 'meilisearch' \| IdInstancia\): Promise<DatosConexionVista>/,
    );
  });
});
