import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { objetivoConexionServicio } from '../src/main/validacion';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

describe('I1: datos de conexión y bloque .env de Meilisearch', () => {
  it('el IPC solo acepta Meilisearch o una instancia suya', () => {
    expect(objetivoConexionServicio('meilisearch')).toBe('meilisearch');
    expect(objetivoConexionServicio('meilisearch@1.58')).toBe('meilisearch@1.58');
    for (const malo of ['redis', 'redis@8', 'mysql', 'meilisearch@..', '', null, 7, {}]) {
      expect(() => objetivoConexionServicio(malo), String(malo)).toThrow();
    }
  });

  it('los textos existen en los cuatro idiomas', () => {
    for (const x of [es, en, pt, fr]) {
      expect(x.servicios.datosConexion.length).toBeGreaterThan(3);
      expect(x.bd.dialogoConexion.tituloServicio).toContain('Meilisearch');
      expect(x.bd.dialogoConexion.notaMeilisearch).toContain('.env');
      expect(x.env.bloques.meilisearch).toContain('Meilisearch');
      expect(JSON.stringify(x.errores)).toContain('env.meilisearch_no_disponible');
    }
  });

  it('el diálogo enmascara la clave hasta «Mostrar» y no pide usuario ni base', () => {
    const origen = readFileSync(
      path.resolve(__dirname, '../src/renderer/componentes/DialogoConexion.vue'),
      'utf8',
    );
    // D38c: la máscara es el valor por omisión; la clave real solo está con «Mostrar» pulsado.
    expect(origen).toContain('valor: claveVisible.value ?? MASCARA');
    expect(origen).toContain("const MASCARA = '••••••••••••'");
    expect(origen).toMatch(/if \(props\.servicio === undefined\)\s+f\.push\(\{ clave: 'base'/);
  });
});

describe('M6: aviso al cambiar de rama menor de Meilisearch', () => {
  it('está en los cuatro idiomas y habla de los índices y de MEILISEARCH_KEY', () => {
    for (const x of [es, en, pt, fr]) {
      expect(x.versiones.avisoMeilisearch).toContain('MEILISEARCH_KEY');
      expect(x.versiones.avisoMeilisearch).toMatch(/1\.58/);
    }
    expect(es.versiones.avisoMeilisearch).toMatch(/índices/);
    expect(en.versiones.avisoMeilisearch).toMatch(/indexes/);
    expect(pt.versiones.avisoMeilisearch).toMatch(/índices/);
    expect(fr.versiones.avisoMeilisearch).toMatch(/index/);
    expect(fr.versiones.avisoMeilisearch).not.toMatch(/\b(tu|ton|ta|tes)\b/i);
  });

  it('la pestaña de versiones lo muestra solo para Meilisearch', () => {
    const origen = readFileSync(
      path.resolve(__dirname, '../src/renderer/componentes/VersionesServicio.vue'),
      'utf8',
    );
    expect(origen).toContain('v-if="servicio === \'meilisearch\'"');
    expect(origen).toContain('t.avisoMeilisearch');
  });
});
