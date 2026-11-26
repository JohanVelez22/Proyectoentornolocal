import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  ATAJO_CAPTURA_POR_DEFECTO,
  CambiosCapturaSchema,
  CapturaConfigSchema,
  ConfigSchema,
  esAtajoCaptura,
  motivoAtajoCaptura,
} from '../src/tipos';

describe('configuración de la captura (D35)', () => {
  it('por defecto no hay atajo global y el formato es PNG', () => {
    expect(ConfigSchema.parse({}).captura).toEqual({ atajo: null, formato: 'png' });
  });

  it('un valor raro cae al por defecto sin dañar el resto del config', () => {
    const c = ConfigSchema.parse({ captura: { atajo: 'cualquier cosa', formato: 'bmp' } });
    expect(c.captura).toEqual({ atajo: null, formato: 'png' });
    expect(CapturaConfigSchema.parse({ atajo: 'Ctrl+Alt+Shift+S', formato: 'jpg' })).toEqual({
      atajo: 'Ctrl+Alt+Shift+S',
      formato: 'jpg',
    });
  });

  it('el atajo necesita modificador y tecla, sin repetir ni aceptar otra cosa', () => {
    expect(ATAJO_CAPTURA_POR_DEFECTO).toBe('Ctrl+Alt+Shift+S');
    expect(esAtajoCaptura(ATAJO_CAPTURA_POR_DEFECTO)).toBe(true);
    expect(esAtajoCaptura('Ctrl+Shift+F12')).toBe(true);
    for (const malo of [
      'S',
      'Ctrl+',
      'Ctrl+Ctrl+S',
      'Ctrl+Shift+Enter',
      'ctrl+s',
      'Ctrl+S;rm',
      '',
    ]) {
      expect(esAtajoCaptura(malo), malo).toBe(false);
    }
    expect(CambiosCapturaSchema.safeParse({ atajo: 'S' }).success).toBe(false);
    expect(CambiosCapturaSchema.safeParse({ otro: 1 }).success).toBe(false);
    expect(CambiosCapturaSchema.safeParse({ atajo: null }).success).toBe(true);
  });
});

describe('atajo global seguro', () => {
  it('acepta Ctrl o Super con al menos otro modificador (Super solo vale)', () => {
    for (const bueno of [
      'Ctrl+Alt+Shift+S',
      'Ctrl+Shift+F9',
      'Ctrl+Super+P',
      'Shift+Super+4',
      'Super+F10',
      'Alt+Super+K',
      'Shift+Ctrl+K',
    ]) {
      expect(motivoAtajoCaptura(bueno), bueno).toBeNull();
      expect(esAtajoCaptura(bueno), bueno).toBe(true);
    }
  });

  it('rechaza lo que no lleva Ctrl ni Super o trae un solo modificador', () => {
    for (const malo of ['Ctrl+K', 'Alt+K', 'Shift+K', 'Alt+Shift+K', 'Alt+F12', 'Alt+F4']) {
      expect(motivoAtajoCaptura(malo), malo).toBe('no_permitido');
    }
  });

  it('rechaza Ctrl+Alt sin Mayús (AltGr) en cualquier orden', () => {
    for (const malo of ['Ctrl+Alt+Q', 'Alt+Ctrl+Q', 'Ctrl+Alt+Super+Q', 'Ctrl+Alt+7']) {
      expect(motivoAtajoCaptura(malo), malo).toBe('no_permitido');
    }
  });

  it('rechaza los atajos comunes, en cualquier orden de modificadores', () => {
    for (const k of ['A', 'C', 'V', 'X', 'Z', 'Y', 'S', 'P', 'F', 'N', 'W', 'T', 'O']) {
      expect(motivoAtajoCaptura(`Ctrl+${k}`), k).toBe('no_permitido');
    }
    for (const k of ['S', 'T', 'N', 'Z']) {
      expect(motivoAtajoCaptura(`Ctrl+Shift+${k}`), k).toBe('no_permitido');
      expect(motivoAtajoCaptura(`Shift+Ctrl+${k}`), k).toBe('no_permitido');
    }
    expect(motivoAtajoCaptura('Alt+F4')).toBe('no_permitido');
    // Supr no es una tecla admitida: ni llega a ser un atajo.
    expect(esAtajoCaptura('Ctrl+Alt+Supr')).toBe(false);
  });

  it('distingue lo que no es un atajo de lo que es un atajo poco seguro', () => {
    expect(motivoAtajoCaptura('Ctrl+Shift+Enter')).toBe('invalido');
    expect(motivoAtajoCaptura(null)).toBe('invalido');
    expect(motivoAtajoCaptura('Ctrl+Ctrl+S')).toBe('invalido');
    expect(motivoAtajoCaptura('Ctrl+Shift+S')).toBe('no_permitido');
  });

  it('la configuración guardada con un atajo inseguro cae a sin atajo', () => {
    expect(ConfigSchema.parse({ captura: { atajo: 'Ctrl+Shift+S' } }).captura.atajo).toBeNull();
    expect(CambiosCapturaSchema.safeParse({ atajo: 'Ctrl+K' }).success).toBe(false);
    expect(CambiosCapturaSchema.safeParse({ atajo: 'Ctrl+Alt+Shift+S' }).success).toBe(true);
  });
});

describe('Plataforma.capturaDisponible', () => {
  it('la falsa devuelve su estado y nunca toca la pantalla', async () => {
    const f = new PlataformaFalsa();
    expect(await f.capturaDisponible()).toEqual({ disponible: true, permiso: 'no_aplica' });
    f.estadoCaptura = { disponible: true, permiso: 'denegado' };
    expect(await f.capturaDisponible()).toEqual({ disponible: true, permiso: 'denegado' });
  });
});
