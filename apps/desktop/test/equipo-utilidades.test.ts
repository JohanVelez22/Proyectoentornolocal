import { describe, expect, it } from 'vitest';
import type { CompatibilidadModelo, InfoEquipo, SugerenciaEquipo } from '@pel/core';
import { es } from '../src/renderer/i18n/es';
import {
  explicacionCompat,
  lineasEquipo,
  rellenar,
  resumenEquipo,
  textoSugerencia,
} from '../src/renderer/utilidades/equipo';

const GIB = 1024 ** 3;
const t = es.herramientas.entorno.equipo;
const c = es.iaLocal.compat;

const equipo: InfoEquipo = {
  so: { nombre: 'Windows 11 Home', version: '10.0.26300', compilacion: '26300' },
  cpu: { modelo: 'AMD Ryzen 7 5800H', nucleos: 8, hilos: 16 },
  ram: { totalBytes: 16 * GIB, libreBytes: 6 * GIB },
  gpus: [{ nombre: 'NVIDIA GeForce RTX 3060', vramBytes: 6 * GIB, origenVram: 'registro' }],
  discos: [
    { unidad: 'C:', totalBytes: 500 * GIB, libreBytes: 120 * GIB, tipo: 'ssd' },
    { unidad: 'D:', totalBytes: 1000 * GIB, libreBytes: null, tipo: null },
  ],
  placa: { fabricante: 'LENOVO', modelo: 'LNVNB161216' },
};

const vacio: InfoEquipo = {
  so: { nombre: null, version: null, compilacion: null },
  cpu: { modelo: null, nucleos: null, hilos: null },
  ram: { totalBytes: null, libreBytes: null },
  gpus: [],
  discos: [],
  placa: { fabricante: null, modelo: null },
};

describe('rellenar', () => {
  it('sustituye {nombre} y deja intacto lo que no conoce', () => {
    expect(rellenar('{a} y {b} y {c}', { a: 1, b: 'dos' })).toBe('1 y dos y {c}');
    expect(rellenar('sin marcas', { a: 1 })).toBe('sin marcas');
  });
});

describe('lineasEquipo', () => {
  it('añade la compilación solo si la versión no la trae ya', () => {
    const e = { ...equipo, so: { nombre: 'Windows', version: '10.0', compilacion: '26300' } };
    const por = Object.fromEntries(lineasEquipo(e, t).map((x) => [x.etiqueta, x.valor]));
    expect(por[t.so]).toBe('Windows 10.0 (compilación 26300)');
  });

  it('da una línea por dato, con el texto «desconocido» donde falte', () => {
    const l = lineasEquipo(equipo, t);
    const por = Object.fromEntries(l.map((x) => [x.etiqueta, x.valor]));
    // La versión ya termina en la compilación: no se repite.
    expect(por[t.so]).toBe('Windows 11 Home 10.0.26300');
    expect(por[t.cpu]).toContain('AMD Ryzen 7 5800H');
    expect(por[t.cpu]).toContain('8');
    expect(por[t.cpu]).toContain('16');
    expect(por[t.ram]).toContain('16,0 GB');
    expect(por[t.ram]).toContain('6,0 GB');
    expect(por[t.gpu]).toContain('NVIDIA GeForce RTX 3060');
    expect(por[t.gpu]).toContain('6,0 GB');
    expect(por['Disco C:']).toContain('SSD');
    expect(por['Disco C:']).toContain('120 GB');
    expect(por['Disco D:']).toContain(t.desconocido);
    expect(por[t.placa]).toBe('LENOVO LNVNB161216');
  });

  it('un equipo sin datos no lanza y todo queda «desconocido»', () => {
    const l = lineasEquipo(vacio, t);
    expect(l.length).toBeGreaterThanOrEqual(5);
    for (const x of l) {
      expect(x.valor === t.desconocido || x.valor === t.sinGpu, x.etiqueta).toBe(true);
    }
  });
});

describe('resumenEquipo (para pegar en un ticket de soporte)', () => {
  it('es texto plano con la versión de la aplicación y una línea por dato', () => {
    const r = resumenEquipo(equipo, t, '0.1.0');
    expect(r.split('\n')[0]).toContain('0.1.0');
    expect(r).toContain('Windows 11 Home');
    expect(r).toContain('AMD Ryzen 7 5800H');
    expect(r).toContain('NVIDIA GeForce RTX 3060');
    expect(r).not.toMatch(/[<>{}]/);
  });

  it('no lleva identificadores únicos ni nombre del equipo o del usuario', () => {
    const r = resumenEquipo(equipo, t, '0.1.0');
    expect(r).not.toMatch(/serial|serie|uuid|guid|mac\b|hostname|nombre del equipo/i);
    expect(r).not.toMatch(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}/i);
    expect(r).not.toMatch(/[A-Za-z]:\\Users\\/);
  });

  it('sin versión de la aplicación no deja un hueco', () => {
    const r = resumenEquipo(equipo, t, null);
    expect(r.split('\n')[0]).not.toMatch(/\{|null|undefined/);
  });
});

describe('textos de «qué cabe en su equipo»', () => {
  it('la sugerencia dice el tamaño y de qué memoria sale', () => {
    const vram: SugerenciaEquipo = { parametrosMaxB: 7, memoria: 'vram', capacidadBytes: 8 * GIB };
    expect(textoSugerencia(vram, c)).toContain('7B');
    expect(textoSugerencia(vram, c)).not.toContain('{');
    const ram: SugerenciaEquipo = { parametrosMaxB: 14, memoria: 'ram', capacidadBytes: 28 * GIB };
    expect(textoSugerencia(ram, c)).toContain('14B');
    expect(textoSugerencia({ parametrosMaxB: null, memoria: 'ram', capacidadBytes: GIB }, c)).toBe(
      c.sugerenciaPequena,
    );
    expect(textoSugerencia({ parametrosMaxB: null, memoria: null, capacidadBytes: null }, c)).toBe(
      c.sugerenciaDesconocida,
    );
  });

  it('cada motivo se explica con las cifras y sin dejar marcas sin sustituir', () => {
    const motivos = [
      'cabe-vram',
      'justo-vram',
      'solo-ram',
      'cabe-ram',
      'ram-justo',
      'sin-memoria',
      'sin-disco',
      'tamano-desconocido',
      'equipo-desconocido',
    ] as const;
    for (const motivo of motivos) {
      const m: CompatibilidadModelo = {
        nombre: 'x',
        nivel: 'recomendado',
        motivo,
        memoria: 'vram',
        necesarioBytes: 5 * GIB,
        disponibleBytes: 8 * GIB,
        instalado: false,
      };
      const texto = explicacionCompat(m, c);
      expect(texto, motivo).not.toBe('');
      expect(texto, motivo).not.toMatch(/\{/);
    }
    const m: CompatibilidadModelo = {
      nombre: 'x',
      nivel: 'recomendado',
      motivo: 'cabe-vram',
      memoria: 'vram',
      necesarioBytes: 5 * GIB,
      disponibleBytes: 8 * GIB,
      instalado: false,
    };
    expect(explicacionCompat(m, c)).toContain('5,0 GB');
    expect(explicacionCompat(m, c)).toContain('8,0 GB');
  });
});
