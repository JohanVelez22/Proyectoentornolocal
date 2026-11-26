import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  ATAJO_CAPTURA_POR_DEFECTO,
  CambiosCapturaSchema,
  CapturaConfigSchema,
  ConfigSchema,
  esAtajoCaptura,
} from '../src/tipos';

describe('configuración de la captura (D35)', () => {
  it('por defecto no hay atajo global y el formato es PNG', () => {
    expect(ConfigSchema.parse({}).captura).toEqual({ atajo: null, formato: 'png' });
  });

  it('un valor raro cae al por defecto sin dañar el resto del config', () => {
    const c = ConfigSchema.parse({ captura: { atajo: 'cualquier cosa', formato: 'bmp' } });
    expect(c.captura).toEqual({ atajo: null, formato: 'png' });
    expect(CapturaConfigSchema.parse({ atajo: 'Ctrl+Shift+S', formato: 'jpg' })).toEqual({
      atajo: 'Ctrl+Shift+S',
      formato: 'jpg',
    });
  });

  it('el atajo necesita modificador y tecla, sin repetir ni aceptar otra cosa', () => {
    expect(esAtajoCaptura(ATAJO_CAPTURA_POR_DEFECTO)).toBe(true);
    expect(esAtajoCaptura('Alt+F12')).toBe(true);
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

describe('Plataforma.capturaDisponible', () => {
  it('la falsa devuelve su estado y nunca toca la pantalla', async () => {
    const f = new PlataformaFalsa();
    expect(await f.capturaDisponible()).toEqual({ disponible: true, permiso: 'no_aplica' });
    f.estadoCaptura = { disponible: true, permiso: 'denegado' };
    expect(await f.capturaDisponible()).toEqual({ disponible: true, permiso: 'denegado' });
  });
});
