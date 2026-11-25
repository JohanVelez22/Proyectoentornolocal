import { describe, expect, it } from 'vitest';
import {
  esUsuarioDeProyecto,
  generarClaveBd,
  PREFIJO_USUARIO_PROYECTO,
  usuarioDeProyecto,
} from '../src/bd/usuarioProyecto';
import { NOMBRE_TEMPORAL } from '../src/bd/temporales';

describe('usuarioDeProyecto', () => {
  it('wolf_u_ + la base, en minúsculas', () => {
    expect(usuarioDeProyecto('mi_tienda')).toBe('wolf_u_mi_tienda');
    expect(usuarioDeProyecto('Tienda')).toBe('wolf_u_tienda');
  });

  it('nunca pasa de 32 caracteres (límite de MySQL) y bases largas distintas dan usuarios distintos', () => {
    const a = usuarioDeProyecto('x'.repeat(60) + 'a');
    const b = usuarioDeProyecto('x'.repeat(60) + 'b');
    expect(a.length).toBeLessThanOrEqual(32);
    expect(b.length).toBeLessThanOrEqual(32);
    expect(a).not.toBe(b);
    expect(a.startsWith(PREFIJO_USUARIO_PROYECTO)).toBe(true);
  });

  it('solo letras minúsculas, números y guion bajo; nunca choca con temporales ni dueños', () => {
    for (const base of ['mi-base', 'tmp_x', 'dueno_x', 'ñandú', 'a'.repeat(63)]) {
      const u = usuarioDeProyecto(base);
      expect(u).toMatch(/^[a-z0-9_]{1,32}$/);
      expect(NOMBRE_TEMPORAL.test(u)).toBe(false);
      expect(u.startsWith('wolf_dueno_')).toBe(false);
      expect(u.startsWith('wolf_tmp_')).toBe(false);
      expect(esUsuarioDeProyecto(u)).toBe(true);
    }
  });

  it('esUsuarioDeProyecto no reconoce root ni otras cuentas', () => {
    for (const u of [
      'root',
      'postgres',
      'wolf_dueno_abc',
      'wolf_tmp_0123456789abcdef',
      'wolf_u_',
    ]) {
      expect(esUsuarioDeProyecto(u)).toBe(false);
    }
  });
});

describe('generarClaveBd', () => {
  it('32 caracteres aleatorios que no necesitan comillas ni escapes', () => {
    const claves = new Set(Array.from({ length: 50 }, () => generarClaveBd()));
    expect(claves.size).toBe(50);
    for (const c of claves) expect(c).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});
