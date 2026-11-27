import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { destinoHallazgo } from '../src/renderer/utilidades/doctor';
import {
  destinoBase,
  destinoServicio,
  destinoSitio,
  destinoTunel,
  destinoVersion,
  focoBase,
  focoServicio,
  focoSitio,
  focoVersion,
  motorDeFocoBase,
} from '../src/renderer/utilidades/foco';

const fuente = (...p: string[]): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', ...p), 'utf8');

/** Plantilla o script de un componente sin saltos de línea, para buscar llamadas partidas. */
const plano = (...p: string[]): string => fuente(...p).replace(/\s+/g, ' ');

describe('destinos con foco (D41)', () => {
  it('cada destino lleva ?foco= con el id que pone el data-foco de su tarjeta', () => {
    expect(destinoServicio('mysql')).toEqual({
      name: 'servicios',
      query: { foco: 'servicio:mysql' },
    });
    expect(destinoSitio('mi-sitio')).toEqual({
      name: 'proyectos',
      query: { foco: 'sitio:mi-sitio' },
    });
    expect(destinoTunel('mi-sitio')).toEqual({
      name: 'tuneles',
      query: { foco: 'sitio:mi-sitio' },
    });
    expect(destinoBase('mysql', 'tienda')).toEqual({
      name: 'basesDeDatos',
      query: { foco: 'base:mysql:tienda' },
    });
    expect(destinoVersion('node', '22.11.0')).toEqual({
      name: 'servicios.versiones',
      params: { servicio: 'node' },
      query: { foco: 'version:node:22.11.0' },
    });
    expect(focoServicio('a')).toBe('servicio:a');
    expect(focoSitio('a')).toBe('sitio:a');
    expect(focoVersion('php', '8.4.1')).toBe('version:php:8.4.1');
    expect(focoBase('postgresql', 'x')).toBe('base:postgresql:x');
  });

  it('una versión desconocida abre la pestaña sin foco', () => {
    expect(destinoVersion('redis')).toEqual({
      name: 'servicios.versiones',
      params: { servicio: 'redis' },
    });
    expect(destinoVersion('redis', null)).toEqual({
      name: 'servicios.versiones',
      params: { servicio: 'redis' },
    });
  });

  it('el motor se saca del foco de una base (y solo de él)', () => {
    expect(motorDeFocoBase('base:postgresql:mi_base')).toBe('postgresql');
    expect(motorDeFocoBase('base:mysql:a:b')).toBe('mysql');
    expect(motorDeFocoBase('sitio:x')).toBeNull();
    expect(motorDeFocoBase('base:mysql:')).toBeNull();
    expect(motorDeFocoBase(undefined)).toBeNull();
    expect(motorDeFocoBase(['base:mysql:a'])).toBeNull();
  });
});

describe('una prueba por camino de navegación', () => {
  it('panel de inicio → servicio', () => {
    expect(plano('vistas', 'Inicio.vue')).toContain('router.push(destinoServicio(s.id))');
  });

  it('panel de inicio → proyecto con túnel', () => {
    expect(plano('vistas', 'Inicio.vue')).toContain('router.push(destinoTunel(tun.sitioId))');
  });

  it('Ctrl+K → servicio, proyecto, versiones y "traer cambios"', () => {
    const p = plano('componentes', 'PaletaComandos.vue');
    expect(p).toContain('irA(destinoServicio(s.id))');
    expect(p).toContain('irA(destinoSitio(s.id))');
    expect(p).toContain('irA(destinoVersion(k, servicios.porId[k]?.version ?? null))');
    // "Traer cambios" ya no cae en la lista sin resaltar nada.
    expect(p).toMatch(/solicitudes\.traerCambios = s\.id; irA\(destinoSitio\(s\.id\)\)/);
  });

  it('aviso de versión nueva → tarjeta de la versión nueva', () => {
    expect(plano('componentes', 'Marco.vue')).toContain(
      '.push(destinoVersion(args.servicio, args.version))',
    );
  });

  it('aviso con foco (servicio caído, puerto ocupado, proyecto, túnel, workspace) → rutaConFoco', () => {
    expect(plano('componentes', 'Marco.vue')).toContain('rutaConFoco(ruta, foco)');
  });

  it('Doctor → servicio o proyecto del hallazgo', () => {
    expect(destinoHallazgo({ revision: 'servicios', id: 'servicios:mysql' })).toEqual(
      destinoServicio('mysql'),
    );
    expect(destinoHallazgo({ revision: 'certificados', id: 'certificados:mi-sitio' })).toEqual(
      destinoSitio('mi-sitio'),
    );
    // Sin tarjeta propia (hosts, PATH, puertos…): no hay botón "Ver".
    expect(destinoHallazgo({ revision: 'hosts', id: 'hosts:duplicado' })).toBeNull();
    expect(destinoHallazgo({ revision: 'ca', id: 'ca:vencimiento' })).toBeNull();
    expect(plano('vistas', 'Doctor.vue')).toContain('void router.push(destino)');
    expect(plano('componentes', 'TarjetaHallazgo.vue')).toContain("emit('ver')");
  });

  it('tarjeta del servicio → pestaña Versiones, sobre la versión que usa', () => {
    expect(plano('componentes', 'TarjetaServicio.vue')).toContain(
      'router.push(destinoVersion(servicioVersiones.value, props.servicio.version))',
    );
  });

  it('instalar desde Servicios → tarjeta de la versión elegida', () => {
    expect(plano('componentes', 'FilaInstalar.vue')).toContain(
      'router.push(destinoVersion(s, v.version))',
    );
  });

  it('proyecto → su base en Bases de datos, con la pestaña del motor', () => {
    const tarjeta = plano('componentes', 'TarjetaProyecto.vue');
    expect(tarjeta).toContain('router.push(destinoBase(motorBase.value, baseDetectada.value))');
    const vista = plano('vistas', 'BasesDeDatos.vue');
    expect(vista).toContain('motorDeFocoBase(f)');
    expect(vista).toMatch(/^.*useFoco\(\);/);
  });

  it('Bases de datos apagada → tarjeta del servicio del motor', () => {
    expect(plano('vistas', 'BasesDeDatos.vue')).toContain('destinoServicio(activo.value)');
  });
});

describe('data-foco en las tarjetas destino', () => {
  it('Versiones: cada tarjeta lleva version:<servicio>:<versión>', () => {
    expect(plano('componentes', 'FilaVersion.vue')).toContain(
      ':data-foco="`version:${servicio}:${f.version}`"',
    );
    // Y la vista que la muestra llama a useFoco().
    expect(fuente('vistas', 'Servicios.vue')).toMatch(/^useFoco\(\);$/m);
  });

  it('Bases de datos: cada fila lleva base:<motor>:<nombre> y la vista llama a useFoco()', () => {
    const v = plano('vistas', 'BasesDeDatos.vue');
    expect(v).toContain(':data-foco="activo ? focoBase(activo, b.nombre) : undefined"');
    expect(fuente('vistas', 'BasesDeDatos.vue')).toMatch(/^useFoco\(\);$/m);
  });

  it('el motor se lee del foco antes de que useFoco() lo quite de la ruta', () => {
    const v = fuente('vistas', 'BasesDeDatos.vue');
    expect(v.indexOf('motorDeFocoBase(f)')).toBeGreaterThan(-1);
    expect(v.indexOf('motorDeFocoBase(f)')).toBeLessThan(v.indexOf('useFoco();'));
  });
});

describe('respeta reducir movimiento', () => {
  it('useFoco decide la clase con prefers-reduced-motion', () => {
    expect(fuente('composables', 'useFoco.ts')).toContain('(prefers-reduced-motion: reduce)');
  });
});
