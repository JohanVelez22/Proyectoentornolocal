import { describe, expect, it } from 'vitest';
import {
  escaparHtml,
  leerRutaPedida,
  listadoHtml,
  nombreDescarga,
  nombreSeguro,
  sinControles,
  tipoDe,
} from '../src/compartir/contenido';

describe('nombreSeguro', () => {
  it.each(['a.txt', 'Mi carpeta', 'ñandú.pdf', '.gitignore', 'a b.c'])('admite %s', (n) => {
    expect(nombreSeguro(n)).toBe(true);
  });
  it.each([
    '',
    '.',
    '..',
    'a:b',
    'a.txt:flujo',
    'a.txt::$DATA',
    'a\\b',
    'a/b',
    'con',
    'NUL.txt',
    'com1',
    'LPT9.log',
    'aux.x.y',
    'fin.',
    'fin ',
    'a<b',
    'a|b',
    'a?b',
    'a*b',
    'a\u0000b',
    'a\nb',
    'x'.repeat(256),
  ])('rechaza %j', (n) => {
    expect(nombreSeguro(n)).toBe(false);
  });
});

describe('leerRutaPedida', () => {
  it('lee tramos y la barra final', () => {
    expect(leerRutaPedida('/a/b%20c/')).toEqual({
      ok: true,
      tramos: ['a', 'b c'],
      terminaEnBarra: true,
    });
    expect(leerRutaPedida('/')).toEqual({ ok: true, tramos: [], terminaEnBarra: true });
    expect(leerRutaPedida('/x.txt')).toEqual({
      ok: true,
      tramos: ['x.txt'],
      terminaEnBarra: false,
    });
  });
  it('decodifica una sola vez', () => {
    // %252e%252e → el texto «%2e%2e», que es un nombre cualquiera y no un «..»
    expect(leerRutaPedida('/%252e%252e/x')).toEqual({
      ok: true,
      tramos: ['%2e%2e', 'x'],
      terminaEnBarra: false,
    });
  });
  it.each([
    '/..',
    '/a/../b',
    '/%2e%2e/b',
    '/a/%2E%2E/',
    '/a%5cb',
    '/a%2fb/../c',
    '//a',
    '/a//b',
    '/a:b',
    '/a%3Ab',
    '/CON',
    '/%00',
    '/%zz',
    'sin-barra',
    '/' + 'a/'.repeat(70),
    '/' + 'a'.repeat(3000),
  ])('rechaza %j', (r) => {
    expect(leerRutaPedida(r).ok).toBe(false);
  });
});

describe('tipoDe', () => {
  it('lista blanca en línea', () => {
    expect(tipoDe('foto.PNG')).toEqual({ tipo: 'image/png', descarga: false });
    expect(tipoDe('a.txt').descarga).toBe(false);
    expect(tipoDe('a.pdf').descarga).toBe(false);
  });
  it('los tipos activos siempre se descargan', () => {
    for (const n of ['a.html', 'a.HTM', 'a.svg', 'a.xml', 'a.js', 'a.mjs', 'a.css', 'a.xhtml']) {
      expect(tipoDe(n).descarga).toBe(true);
    }
  });
  it('lo desconocido es octet-stream y se descarga', () => {
    expect(tipoDe('a.exe')).toEqual({ tipo: 'application/octet-stream', descarga: true });
    expect(tipoDe('sinextension')).toEqual({ tipo: 'application/octet-stream', descarga: true });
    // sin heredar del prototipo
    expect(tipoDe('a.constructor').tipo).toBe('application/octet-stream');
    expect(tipoDe('a.__proto__').tipo).toBe('application/octet-stream');
  });
});

describe('texto', () => {
  it('escapa HTML', () => {
    expect(escaparHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
    );
  });
  it('el listado escapa nombres y título y codifica los enlaces', () => {
    const h = listadoHtml(
      '<b>x</b>',
      [
        { nombre: '"><script>alert(1)</script>.txt', carpeta: false, bytes: 1500 },
        { nombre: 'a b', carpeta: true, bytes: null },
      ],
      false,
    );
    expect(h).not.toContain('<script>');
    expect(h).not.toContain('<b>x</b>');
    expect(h).toContain('href="a%20b/"');
    expect(h).toContain('&lt;script&gt;');
    expect(h).toContain('1.5 KB');
  });
  it('sinControles tapa controles y recorta', () => {
    expect(sinControles('a\r\nb‮c', 50)).toBe('a��b�c');
    expect(sinControles('x'.repeat(10), 4)).toBe('xxxx…');
  });
  it('nombreDescarga no deja pasar comillas ni saltos', () => {
    const d = nombreDescarga('a"b\r\n%ñ.html');
    expect(d).not.toMatch(/[\r\n]/);
    expect(d).toContain('filename="a_b___ñ'.replace('ñ', '_'));
    expect(d).toContain("filename*=UTF-8''a%22b%0D%0A%25%C3%B1.html");
  });
});
