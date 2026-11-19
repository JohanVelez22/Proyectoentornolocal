import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import {
  aBase64,
  agregarAcotado,
  arbolJson,
  bcryptComparar,
  bcryptHash,
  buscarCoincidencias,
  codificarUrl,
  compararTextos,
  decodificarJwt,
  decodificarUrl,
  desdeBase64,
  fechaEnZonaAMs,
  formatearEnZona,
  formatearJson,
  generarContrasena,
  hashTexto,
  interpretarTimestamp,
  md5,
  minificarJson,
  probarRegexConLimite,
  renderizarMarkdown,
  segmentosResaltado,
  textoDesplazamiento,
  desplazamientoZona,
  validarDominios,
  validarUrlWs,
  type TrabajadorHerramienta,
} from '../src/renderer/utilidades/herramientas';

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

describe('JSON', () => {
  it('formatea con sangría y conserva el valor', () => {
    const r = formatearJson('{"a":1,"b":[true,null]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.texto).toBe('{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}');
  });

  it('minifica', () => {
    const r = minificarJson('{\n  "a" : 1 ,\n "b": "x y"\n}');
    expect(r).toMatchObject({ ok: true, texto: '{"a":1,"b":"x y"}' });
  });

  it('un JSON roto dice la línea y la columna', () => {
    const r = formatearJson('{\n  "a": 1,\n  "b": }');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.linea).toBe(3);
      expect(r.columna).toBeGreaterThan(0);
      expect(r.error).toMatch(/JSON no válido/);
    }
  });

  it('el texto vacío no es válido', () => {
    expect(formatearJson('   ').ok).toBe(false);
  });

  it('arma un árbol acotado', () => {
    const arbol = arbolJson({ a: 1, b: { c: [1, 2] } });
    expect(arbol).toHaveLength(2);
    expect(arbol[1]?.children?.[0]?.children).toHaveLength(2);
    const grande = arbolJson(
      Array.from({ length: 50 }, (_, i) => i),
      10,
    );
    expect(grande.length).toBeLessThanOrEqual(11);
    expect(grande.at(-1)?.label).toMatch(/más/);
  });
});

describe('expresiones regulares', () => {
  it('encuentra coincidencias con grupos y nombres', () => {
    const r = buscarCoincidencias('(?<user>\\w+)@(\\w+)\\.com', 'i', 'ana@x.com, LUIS@Y.COM');
    expect(r.error).toBeUndefined();
    expect(r.coincidencias).toHaveLength(2);
    expect(r.coincidencias[0]).toMatchObject({ indice: 0, fin: 9, texto: 'ana@x.com' });
    expect(r.coincidencias[0]?.grupos).toEqual(['ana', 'x']);
    expect(r.coincidencias[1]?.nombrados).toEqual({ user: 'LUIS' });
  });

  it('un patrón inválido da un error en español', () => {
    expect(buscarCoincidencias('(', '', 'x').error).toMatch(/^Expresión no válida/);
    expect(buscarCoincidencias('a', 'q', 'x').error).toMatch(/Banderas no válidas/);
  });

  it('las coincidencias vacías no cuelgan y el total se acota', () => {
    const r = buscarCoincidencias('', '', 'abc');
    expect(r.coincidencias).toHaveLength(4);
    const t = buscarCoincidencias('a', '', 'a'.repeat(50), 10);
    expect(t.coincidencias).toHaveLength(10);
    expect(t.truncado).toBe(true);
  });

  it('parte el texto en segmentos para resaltar sin HTML', () => {
    const r = buscarCoincidencias('b+', '', 'abba c b');
    expect(segmentosResaltado('abba c b', r.coincidencias)).toEqual([
      { texto: 'a', n: null },
      { texto: 'bb', n: 0 },
      { texto: 'a c ', n: null },
      { texto: 'b', n: 1 },
    ]);
  });

  /** Worker de Node con la misma interfaz que el Web Worker del renderer. */
  function trabajadorNode(terminados: string[]): TrabajadorHerramienta {
    const w = new Worker(
      `const { parentPort } = require('node:worker_threads');
       parentPort.on('message', (m) => {
         const re = new RegExp(m.patron, m.banderas + 'g');
         const n = [...m.texto.matchAll(re)].length;
         parentPort.postMessage({ resultado: { coincidencias: [], truncado: false, n } });
       });`,
      { eval: true },
    );
    const t: TrabajadorHerramienta = {
      onmessage: null,
      onerror: null,
      postMessage: (m) => w.postMessage(m),
      terminate: () => {
        terminados.push('x');
        void w.terminate();
      },
    };
    w.on('message', (data: unknown) => t.onmessage?.({ data }));
    w.on('error', (e) => t.onerror?.(e));
    return t;
  }

  it('un patrón catastrófico se corta por tiempo y el worker se termina', async () => {
    const terminados: string[] = [];
    const inicio = Date.now();
    const r = await probarRegexConLimite(
      { patron: '(a+)+$', banderas: '', texto: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!' },
      () => trabajadorNode(terminados),
      300,
    );
    expect(r.estado).toBe('tiempo');
    expect(terminados).toHaveLength(1);
    expect(Date.now() - inicio).toBeLessThan(3000);
  });

  it('un patrón normal responde y también libera el worker', async () => {
    const terminados: string[] = [];
    const r = await probarRegexConLimite(
      { patron: 'a', banderas: '', texto: 'banana' },
      () => trabajadorNode(terminados),
      5000,
    );
    expect(r).toMatchObject({ estado: 'ok', resultado: { n: 3 } });
    expect(terminados).toHaveLength(1);
  });
});

describe('diff', () => {
  it('empareja líneas iguales, cambiadas, quitadas y agregadas', () => {
    const r = compararTextos('a\nb\nc\nd\n', 'a\nB\nc\nd\ne\n');
    expect(r.filas.map((f) => f.tipo)).toEqual(['igual', 'cambiado', 'igual', 'igual', 'agregado']);
    expect(r.filas[1]).toMatchObject({ izq: 'b', der: 'B', numIzq: 2, numDer: 2 });
    expect(r.filas[4]).toMatchObject({ izq: null, der: 'e', numIzq: null, numDer: 5 });
    expect(r.agregadas).toBe(2);
    expect(r.quitadas).toBe(1);
  });

  it('textos iguales no tienen cambios', () => {
    const r = compararTextos('x\ny', 'x\ny');
    expect(r.agregadas + r.quitadas).toBe(0);
    expect(r.filas).toHaveLength(2);
  });

  it('una línea quitada queda sola a la izquierda', () => {
    const r = compararTextos('a\nb\nc', 'a\nc');
    expect(r.filas[1]).toMatchObject({ tipo: 'quitado', izq: 'b', der: null });
  });
});

describe('tiempo', () => {
  it('distingue segundos y milisegundos', () => {
    expect(interpretarTimestamp('1700000000')).toEqual({ ms: 1700000000000, unidad: 's' });
    expect(interpretarTimestamp(' 1700000000123 ')).toEqual({ ms: 1700000000123, unidad: 'ms' });
    expect(interpretarTimestamp('-86400')).toEqual({ ms: -86400000, unidad: 's' });
    expect(interpretarTimestamp('abc')).toBeNull();
    expect(interpretarTimestamp('1e9')).toBeNull();
  });

  it('formatea en la zona pedida', () => {
    const ms = Date.UTC(2023, 10, 14, 22, 13, 20);
    expect(formatearEnZona(ms, 'UTC')).toBe('2023-11-14 22:13:20');
    expect(formatearEnZona(ms, 'America/Bogota')).toBe('2023-11-14 17:13:20');
    expect(formatearEnZona(ms, 'Asia/Tokyo')).toBe('2023-11-15 07:13:20');
  });

  it('calcula el desplazamiento con horario de verano', () => {
    expect(desplazamientoZona(Date.UTC(2024, 0, 15), 'Europe/Madrid')).toBe(60);
    expect(desplazamientoZona(Date.UTC(2024, 6, 15), 'Europe/Madrid')).toBe(120);
    expect(desplazamientoZona(Date.UTC(2024, 6, 15), 'America/Bogota')).toBe(-300);
    expect(textoDesplazamiento(-300)).toBe('UTC−05:00');
    expect(textoDesplazamiento(330)).toBe('UTC+05:30');
  });

  it('convierte una fecha de una zona a timestamp', () => {
    expect(fechaEnZonaAMs('2023-11-14 17:13:20', 'America/Bogota')).toBe(
      Date.UTC(2023, 10, 14, 22, 13, 20),
    );
    expect(fechaEnZonaAMs('2024-07-15T12:00', 'Europe/Madrid')).toBe(Date.UTC(2024, 6, 15, 10));
    expect(fechaEnZonaAMs('2024-02-30 10:00', 'UTC')).toBeNull();
    expect(fechaEnZonaAMs('ayer', 'UTC')).toBeNull();
  });
});

describe('base64 y URL', () => {
  it('codifica y decodifica UTF-8', () => {
    expect(aBase64('añoé ✓')).toBe('YcOxb8OpIOKckw==');
    expect(desdeBase64('YcOxb8OpIOKckw==')).toBe('añoé ✓');
    expect(aBase64('??>', true)).toBe('Pz8-');
    expect(desdeBase64('Pz8-')).toBe('??>');
    expect(desdeBase64(' YW Jj\n')).toBe('abc');
  });

  it('rechaza base64 o UTF-8 inválidos', () => {
    expect(() => desdeBase64('@@@')).toThrow(/Base64 no válido/);
    expect(() => desdeBase64('/w==')).toThrow(/UTF-8/);
  });

  it('codifica URL y avisa de secuencias rotas', () => {
    expect(codificarUrl('a b&ñ')).toBe('a%20b%26%C3%B1');
    expect(decodificarUrl('a%20b%26%C3%B1')).toBe('a b&ñ');
    expect(() => decodificarUrl('%E0%A4%A')).toThrow(/no válida/);
  });
});

describe('hash', () => {
  it('MD5 con vectores conocidos', () => {
    expect(md5(bytes(''))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(md5(bytes('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5(bytes('The quick brown fox jumps over the lazy dog'))).toBe(
      '9e107d9d372bb6826bd81d3542a419d6',
    );
    expect(md5(bytes('a'.repeat(1000)))).toBe('cabe45dcc9ae5b66ba86600cca6b8ba8');
  });

  it('SHA-1 y SHA-256', async () => {
    expect(await hashTexto('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await hashTexto('SHA-256', 'abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(await hashTexto('MD5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('bcrypt con coste acotado y verificable', async () => {
    const h = await bcryptHash('secreto', 4);
    expect(h).toMatch(/^\$2b\$04\$/);
    expect(await bcryptComparar('secreto', h)).toBe(true);
    expect(await bcryptComparar('otro', h)).toBe(false);
    await expect(bcryptHash('x', 13)).rejects.toThrow(/entre 4 y 12/);
    await expect(bcryptHash('x', 3)).rejects.toThrow(/entre 4 y 12/);
  });
});

describe('JWT', () => {
  const b64u = (o: unknown) => aBase64(JSON.stringify(o), true);
  const token = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: 'ñu', exp: 1700000000 })}.firma`;

  it('decodifica cabecera y carga sin verificar la firma', () => {
    const r = decodificarJwt(token);
    expect(r.cabecera).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.carga).toEqual({ sub: 'ñu', exp: 1700000000 });
    expect(r.firmaVerificada).toBe(false);
    expect(r.aviso).toMatch(/firma no verificada/i);
    expect(r.vencido).toBe(true);
  });

  it('rechaza tokens mal formados', () => {
    expect(() => decodificarJwt('abc')).toThrow(/tres partes/);
    expect(() => decodificarJwt('e30.@@.x')).toThrow(/carga/);
  });
});

describe('Markdown', () => {
  it('no deja HTML crudo', () => {
    const html = renderizarMarkdown(
      '# Hola\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>',
    );
    expect(html).toContain('<h1>Hola</h1>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('quita los enlaces javascript:, data: y vbscript:', () => {
    const html = renderizarMarkdown(
      '[a](javascript:alert(1)) [b](JaVaScRiPt:alert(1)) [c](data:text/html,x) [d](vbscript:x) ![i](data:image/png;base64,AA)',
    );
    expect(html).not.toMatch(/href="(javascript|data|vbscript)/i);
    expect(html).not.toMatch(/src="data/i);
  });

  it('conserva los enlaces http y les pone rel', () => {
    const html = renderizarMarkdown('[web](https://example.com/a?b=1)');
    expect(html).toContain('href="https://example.com/a?b=1"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('varios', () => {
  it('genera contraseñas con el alfabeto pedido', () => {
    const c = generarContrasena(32, {
      mayusculas: false,
      minusculas: true,
      numeros: true,
      simbolos: false,
    });
    expect(c).toHaveLength(32);
    expect(c).toMatch(/^[a-z0-9]+$/);
    expect(() =>
      generarContrasena(8, {
        mayusculas: false,
        minusculas: false,
        numeros: false,
        simbolos: false,
      }),
    ).toThrow(/al menos un tipo/);
    expect(() =>
      generarContrasena(3, { mayusculas: true, minusculas: true, numeros: true, simbolos: true }),
    ).toThrow(/entre 4 y 256/);
  });

  it('el cliente WebSocket solo acepta ws:// y wss://', () => {
    expect(validarUrlWs('ws://127.0.0.1:8080/x')).toBe('ws://127.0.0.1:8080/x');
    expect(validarUrlWs(' wss://example.com ')).toBe('wss://example.com/');
    expect(validarUrlWs('http://example.com')).toBeNull();
    expect(validarUrlWs('javascript:alert(1)')).toBeNull();
    expect(validarUrlWs('')).toBeNull();
  });

  it('el registro de mensajes queda acotado', () => {
    let l: number[] = [];
    for (let i = 0; i < 10; i++) l = agregarAcotado(l, i, 4);
    expect(l).toEqual([6, 7, 8, 9]);
  });

  it('separa y valida los dominios del certificado', () => {
    expect(validarDominios('a.test, *.b.test\n127.0.0.1  a.test')).toEqual({
      dominios: ['a.test', '*.b.test', '127.0.0.1'],
    });
    expect(validarDominios('').error).toMatch(/al menos un/);
    expect(
      validarDominios(Array.from({ length: 21 }, (_, i) => `d${i}.test`).join(' ')).error,
    ).toMatch(/20/);
  });
});
