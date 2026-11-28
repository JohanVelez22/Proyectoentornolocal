import { describe, expect, it } from 'vitest';
import { CATEGORIAS, categoriaDe } from '../src/renderer/stores/servicios';
import { ICONOS_CATEGORIA, iconoDeServicio } from '../src/renderer/utilidades/iconosServicio';

describe('Iconos de servicio (D54b C2)', () => {
  it('hay un icono para cada categoría conocida', () => {
    for (const c of CATEGORIAS) expect(ICONOS_CATEGORIA[c], c).toBeDefined();
  });

  it('cada categoría tiene su propio icono: ninguna comparte con otra', () => {
    const usados = CATEGORIAS.map((c) => ICONOS_CATEGORIA[c]);
    expect(new Set(usados).size).toBe(usados.length);
  });

  it('Nginx (web) no usa el icono de las bases de datos', () => {
    const nginx = iconoDeServicio({ id: 'nginx', categoria: 'web' });
    for (const id of ['mysql', 'mariadb', 'postgresql', 'redis', 'mongodb'])
      expect(nginx).not.toBe(iconoDeServicio({ id, categoria: 'bd' }));
    expect(nginx).toBe(ICONOS_CATEGORIA[categoriaDe({ id: 'nginx', categoria: 'web' })]);
  });

  it('las bases comparten el de bases y PHP y correo tienen el suyo', () => {
    expect(iconoDeServicio({ id: 'mysql', categoria: 'bd' })).toBe(ICONOS_CATEGORIA.bd);
    expect(iconoDeServicio({ id: 'php-8.4', categoria: 'php' })).toBe(ICONOS_CATEGORIA.php);
    expect(iconoDeServicio({ id: 'mailpit', categoria: 'herramienta' })).toBe(
      ICONOS_CATEGORIA.correo,
    );
  });
});

describe('Iconos del menú (D54c)', () => {
  it('Bases de datos usa Server, en las tarjetas y en el menú; Servicios usa Toggle', async () => {
    const { Server } = await import('@vicons/ionicons5');
    expect(ICONOS_CATEGORIA.bd).toBe(Server);
    const { readFileSync } = await import('node:fs');
    const marco = readFileSync('src/renderer/componentes/Marco.vue', 'utf8');
    expect(marco).toContain('Server as IconoBases');
    expect(marco).toContain('Toggle as IconoServicios');
    for (const viejo of ['Pulse', 'Apps', 'Grid', 'Layers'])
      expect(marco).not.toMatch(new RegExp(`\b${viejo}\b`));
  });
});
