import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EstadoReverb } from '../src/shared/api';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import {
  idProcesoReverb,
  reverbEncendido,
  reverbVisible,
  tipoEstadoReverb,
} from '../src/renderer/utilidades/reverb';

const estado = (o: Partial<EstadoReverb> = {}): EstadoReverb => ({
  disponible: true,
  motivo: null,
  activo: false,
  puerto: null,
  estado: 'apagado',
  ...o,
});

describe('tarjeta de Reverb (D45a)', () => {
  it('solo se ve en sitios de confianza con laravel/reverb (disponible)', () => {
    expect(reverbVisible(null)).toBe(false);
    expect(reverbVisible(estado({ disponible: false, motivo: 'reverb.no_confiado' }))).toBe(false);
    expect(reverbVisible(estado({ disponible: false, motivo: 'reverb.sin_paquete' }))).toBe(false);
    expect(reverbVisible(estado({ disponible: false, motivo: 'reverb.no_laravel' }))).toBe(false);
    expect(reverbVisible(estado())).toBe(true);
  });

  it('el interruptor sigue al proceso: encendido o iniciando', () => {
    expect(reverbEncendido(null)).toBe(false);
    expect(reverbEncendido(estado({ activo: true, estado: 'encendido', puerto: 8080 }))).toBe(true);
    expect(reverbEncendido(estado({ activo: true, estado: 'iniciando', puerto: 8080 }))).toBe(true);
    expect(reverbEncendido(estado({ activo: true, estado: 'error', puerto: 8080 }))).toBe(false);
    expect(reverbEncendido(estado({ activo: false, estado: 'encendido' }))).toBe(false);
  });

  it('tipo de etiqueta por estado e id de supervisor', () => {
    expect(tipoEstadoReverb('encendido')).toBe('success');
    expect(tipoEstadoReverb('iniciando')).toBe('warning');
    expect(tipoEstadoReverb('error')).toBe('error');
    expect(tipoEstadoReverb('apagado')).toBe('default');
    expect(idProcesoReverb('mi-app')).toBe('proy-mi-app-reverb');
  });

  it('los textos existen en los cuatro idiomas con las mismas claves', () => {
    for (const x of [es, en, pt, fr]) {
      const r = x.reverb;
      expect(Object.keys(r).sort()).toEqual(Object.keys(es.reverb).sort());
      expect(Object.keys(r.estados).sort()).toEqual(['apagado', 'encendido', 'error', 'iniciando']);
      expect(r.puerto(8081)).toContain('8081');
      expect(r.interruptor('app.test')).toContain('app.test');
      expect(r.activarTexto('app.test')).toContain('127.0.0.1');
      expect(r.proponer).toContain('REVERB_*');
    }
  });

  it('francés con «vous»: nada de «tu», «ton» ni imperativos de tutoiement', () => {
    const textos = JSON.stringify(fr.reverb);
    expect(textos).not.toMatch(/\b(tu|ton|ta|tes|toi)\b/i);
  });

  it('contraste: la tarjeta no atenúa el texto con opacity (hereda el color del tema)', () => {
    const origen = readFileSync(
      path.resolve(__dirname, '../src/renderer/componentes/SeccionReverb.vue'),
      'utf8',
    );
    expect(origen).not.toMatch(/opacity\s*:/);
    // Sin colores fijos: sirve en tema claro y oscuro.
    expect(origen).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('solo propone variables: la tarjeta no escribe el .env por su cuenta', () => {
    const origen = readFileSync(
      path.resolve(__dirname, '../src/renderer/componentes/SeccionReverb.vue'),
      'utf8',
    );
    expect(origen).not.toMatch(/env\.guardar|escribirEnv/);
    expect(origen).toContain("emit('proponer'");
  });
});
