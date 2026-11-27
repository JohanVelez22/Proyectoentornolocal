import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';
import { detalleRegex } from '../src/renderer/utilidades/herramientasTrabajo';
import { errorWifi, textoQrWifi } from '../src/renderer/utilidades/qrWifi';
import { pngsAIco, TAMANOS_ICO } from '../src/renderer/utilidades/ico';
import {
  bitmapAceptable,
  escalar,
  porcentajeAhorro,
} from '../src/renderer/utilidades/imagenCanvas';
import {
  aBase64,
  agregarAcotado,
  recortarTexto,
  tamanoTexto,
  MAX_TEXTO_DIFF,
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

  it('el error del motor se traduce y el mensaje original queda aparte (D54a, I7)', () => {
    const r = buscarCoincidencias('(abc[', 'g', 'x');
    expect(r.error).toBe('Expresión no válida: falta cerrar un corchete «[».');
    expect(r.errorMotor).toMatch(/Unterminated character class/);
    expect(buscarCoincidencias('(', '', 'x').error).toBe(
      'Expresión no válida: falta cerrar un paréntesis «(».',
    );
    expect(buscarCoincidencias('*a', '', 'x').error).toMatch(/nada que repetir/);
    expect(buscarCoincidencias('a)', '', 'x').error).toMatch(/«\)»/);
    // El mensaje nunca lleva inglés del motor.
    for (const p of ['(', '[', '*', 'a)', '\\', '[z-a]', '(?<>a)', 'a{2,1}']) {
      expect(buscarCoincidencias(p, '', 'x').error).not.toMatch(/Invalid|Unterminated|Unmatched/);
    }
  });

  it('un mensaje del motor que no se reconoce da «Expresión no válida.» sin inglés (D54a)', () => {
    for (const [id, d] of Object.entries({ es, en, pt, fr })) {
      const e = d.herramientas.errores;
      expect(e.regex(null), id).not.toMatch(id === 'en' ? /Unterminated/ : /Invalid|Unterminated/);
      expect(detalleRegex('Invalid regular expression: /a/: algo raro', e.regexDetalle)).toBeNull();
      for (const clave of Object.keys(e.regexDetalle)) {
        expect(e.regexDetalle[clave as keyof typeof e.regexDetalle], `${id}/${clave}`).toBeTruthy();
      }
    }
    expect(es.herramientas.errores.regex(null)).toBe('Expresión no válida.');
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

  it('no carga imágenes remotas: deja el texto alternativo', () => {
    const html = renderizarMarkdown('![logo <b>](https://example.com/a.png) y ![](http://x/y.gif)');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('example.com');
    expect(html).toContain('logo &lt;b&gt;');
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

  it('recorta los mensajes largos con puntos suspensivos', () => {
    expect(recortarTexto('abc', 5)).toBe('abc');
    expect(recortarTexto('abcdefgh', 5)).toBe('abcde…');
  });

  it('mide el texto en bytes UTF-8 para el tope del diff', () => {
    expect(tamanoTexto('añ')).toBe(3);
    expect(MAX_TEXTO_DIFF).toBe(5 * 1024 * 1024);
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

describe('herramienta Buscar', () => {
  it('tiene su tarjeta, su panel y los códigos de error en es, en, pt y fr', () => {
    for (const t of [es, en, pt, fr]) {
      expect(t.herramientas.lista.buscar.nombre).not.toBe('');
      expect(t.herramientas.busqueda.buscar).not.toBe('');
      expect(t.herramientas.busqueda.coincidencias(2)).toMatch(/2/);
      for (const c of ['consulta_invalida', 'raiz_invalida', 'regex_invalida', 'regex_lenta']) {
        expect(t.errores.codigos[`buscar.${c}` as keyof typeof t.errores.codigos]).toBeTruthy();
      }
      expect(t.errores.codigos['buscar.demasiadas']).toContain('{maximo}');
    }
  });
});

describe('QR de Wi-Fi', () => {
  it('arma el texto WIFI: con la seguridad y la red oculta', () => {
    expect(
      textoQrWifi({ ssid: 'Casa', clave: 'secreto123', seguridad: 'WPA', oculta: false }),
    ).toBe('WIFI:T:WPA;S:Casa;P:secreto123;;');
    expect(textoQrWifi({ ssid: 'Casa', clave: 'secreto123', seguridad: 'WEP', oculta: true })).toBe(
      'WIFI:T:WEP;S:Casa;P:secreto123;H:true;;',
    );
  });

  it('una red abierta no lleva contraseña, aunque haya una escrita', () => {
    expect(
      textoQrWifi({ ssid: 'Bar', clave: 'no-debe-ir', seguridad: 'nopass', oculta: false }),
    ).toBe('WIFI:T:nopass;S:Bar;;');
  });

  it('escapa la barra invertida, ; , : y las comillas en el nombre y la contraseña', () => {
    const t = textoQrWifi({
      ssid: 'a;b,c:d"e\\f',
      clave: 'p;q,r:s"t\\u',
      seguridad: 'WPA',
      oculta: false,
    });
    expect(t).toBe('WIFI:T:WPA;S:a\\;b\\,c\\:d\\"e\\\\f;P:p\\;q\\,r\\:s\\"t\\\\u;;');
    // La barra se escapa primero: una `\;` del usuario no se convierte en un separador.
    expect(textoQrWifi({ ssid: 'x\\;', clave: 'y', seguridad: 'WPA', oculta: false })).toBe(
      'WIFI:T:WPA;S:x\\\\\\;;P:y;;',
    );
  });

  it('valida el nombre y la contraseña antes de generar', () => {
    expect(errorWifi({ ssid: '', clave: 'x'.repeat(8), seguridad: 'WPA' })).toBe('ssid');
    expect(errorWifi({ ssid: 'x'.repeat(33), clave: 'x'.repeat(8), seguridad: 'WPA' })).toBe(
      'ssid',
    );
    expect(errorWifi({ ssid: 'Casa', clave: '', seguridad: 'WPA' })).toBe('clave');
    expect(errorWifi({ ssid: 'Casa', clave: 'corta', seguridad: 'WPA' })).toBe('claveWpa');
    expect(errorWifi({ ssid: 'Casa', clave: 'x'.repeat(64), seguridad: 'WPA' })).toBe('claveWpa');
    expect(errorWifi({ ssid: 'Casa', clave: 'x'.repeat(8), seguridad: 'WPA' })).toBeNull();
    expect(errorWifi({ ssid: 'Casa', clave: '', seguridad: 'nopass' })).toBeNull();
  });

  it('tiene sus textos y avisos en es, en, pt y fr', () => {
    for (const t of [es, en, pt, fr]) {
      expect(t.herramientas.lista.qrWifi.nombre).not.toBe('');
      expect(t.herramientas.qrWifi.aviso).not.toBe('');
      expect(t.herramientas.imagenes.ahorro(30)).toMatch(/30/);
      expect(t.herramientas.comprimir.omitidos(2)).toMatch(/2/);
    }
  });
});

describe('imagen a ICO', () => {
  const png = (n: number): { tamano: number; datos: Uint8Array } => ({
    tamano: n,
    datos: new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      ...Array.from({ length: n }, (_, i) => i % 251),
    ]),
  });

  it('escribe la cabecera ICONDIR y los desplazamientos de cada imagen', () => {
    const a = png(10);
    const b = png(256);
    const ico = pngsAIco([
      { tamano: 16, datos: a.datos },
      { tamano: 256, datos: b.datos },
    ]);
    const v = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);
    expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
    expect(v.getUint16(4, true)).toBe(2);
    // Entrada 1: 16×16, 32 bits, tamaño y desplazamiento.
    expect(ico[6]).toBe(16);
    expect(ico[7]).toBe(16);
    expect(v.getUint16(10, true)).toBe(1);
    expect(v.getUint16(12, true)).toBe(32);
    expect(v.getUint32(14, true)).toBe(a.datos.length);
    expect(v.getUint32(18, true)).toBe(6 + 16 * 2);
    // Entrada 2: 256 se escribe como 0.
    expect(ico[22]).toBe(0);
    expect(ico[23]).toBe(0);
    expect(v.getUint32(30, true)).toBe(b.datos.length);
    expect(v.getUint32(34, true)).toBe(6 + 16 * 2 + a.datos.length);
    expect(ico.length).toBe(6 + 16 * 2 + a.datos.length + b.datos.length);
    expect([...ico.subarray(38, 38 + a.datos.length)]).toEqual([...a.datos]);
    expect([...ico.subarray(38 + a.datos.length)]).toEqual([...b.datos]);
  });

  it('rechaza tamaños no admitidos, listas vacías y datos que no son PNG', () => {
    expect(() => pngsAIco([])).toThrow();
    expect(() => pngsAIco([{ tamano: 20, datos: png(4).datos }])).toThrow();
    expect(() => pngsAIco([{ tamano: 16, datos: new Uint8Array([1, 2, 3, 4, 5]) }])).toThrow();
    expect(() => pngsAIco([png(4), png(4)].map((p) => ({ ...p, tamano: 16 })))).toThrow();
    expect(TAMANOS_ICO).toEqual([16, 32, 48, 64, 128, 256]);
  });
});

describe('compresión de imágenes (cálculos)', () => {
  it('limita el lado mayor sin agrandar y conserva la proporción', () => {
    expect(escalar(4000, 2000, 1000)).toEqual({ ancho: 1000, alto: 500 });
    expect(escalar(500, 300, 1000)).toEqual({ ancho: 500, alto: 300 });
    expect(escalar(500, 300, null)).toEqual({ ancho: 500, alto: 300 });
    expect(escalar(10_000, 1, 100)).toEqual({ ancho: 100, alto: 1 });
  });

  it('el ahorro es el porcentaje entero y es negativo si pesa más', () => {
    expect(porcentajeAhorro(1000, 250)).toBe(75);
    expect(porcentajeAhorro(1000, 1200)).toBe(-20);
    expect(porcentajeAhorro(0, 5)).toBe(0);
  });
});

describe('revisión de D33 (renderer)', () => {
  it('el nombre de la red mide 32 bytes en UTF-8, no 32 caracteres', () => {
    expect(errorWifi({ ssid: 'x'.repeat(32), clave: 'x'.repeat(8), seguridad: 'WPA' })).toBeNull();
    expect(errorWifi({ ssid: 'ñ'.repeat(17), clave: 'x'.repeat(8), seguridad: 'WPA' })).toBe(
      'ssid',
    );
    expect(errorWifi({ ssid: 'ñ'.repeat(16), clave: 'x'.repeat(8), seguridad: 'WPA' })).toBeNull();
  });

  it('una clave WPA de 64 caracteres vale solo si es hexadecimal (PSK)', () => {
    expect(errorWifi({ ssid: 'Casa', clave: 'a1'.repeat(32), seguridad: 'WPA' })).toBeNull();
    expect(errorWifi({ ssid: 'Casa', clave: 'g'.repeat(64), seguridad: 'WPA' })).toBe('claveWpa');
  });

  it('un nombre de red que parece hexadecimal va entre comillas', () => {
    expect(
      textoQrWifi({ ssid: 'cafe', clave: 'x'.repeat(8), seguridad: 'WPA', oculta: false }),
    ).toBe('WIFI:T:WPA;S:"cafe";P:xxxxxxxx;;');
    expect(
      textoQrWifi({ ssid: 'Casa', clave: 'x'.repeat(8), seguridad: 'WPA', oculta: false }),
    ).toBe('WIFI:T:WPA;S:Casa;P:xxxxxxxx;;');
  });

  it('la clave centinela solo está en el texto del QR, no en el alt, los registros ni el almacenamiento', () => {
    const centinela = 'centinela-secreta-d33';
    const texto = textoQrWifi({ ssid: 'Casa', clave: centinela, seguridad: 'WPA', oculta: false });
    expect(texto).toContain(centinela);
    expect(
      textoQrWifi({ ssid: 'Casa', clave: centinela, seguridad: 'nopass', oculta: false }),
    ).not.toContain(centinela);
    const fuente = readFileSync(
      path.join(__dirname, '../src/renderer/componentes/herramientas/QrWifi.vue'),
      'utf8',
    );
    expect(fuente).not.toMatch(/localStorage|sessionStorage|console\.|useStorage|defineStore/);
    expect(fuente).toContain(':alt="t.alt"');
    expect(fuente).toContain('spellcheck: false');
    for (const t of [es, en, pt, fr]) expect(t.herramientas.qrWifi.alt).not.toMatch(/\{|\$/);
  });

  it('el bitmap decodificado no puede ser mayor que lo que declaró la cabecera ni salirse de los límites', () => {
    const declarado = { ancho: 100, alto: 50 };
    expect(bitmapAceptable({ width: 100, height: 50 }, declarado)).toBe(true);
    expect(bitmapAceptable({ width: 60, height: 50 }, declarado)).toBe(true);
    expect(bitmapAceptable({ width: 101, height: 50 }, declarado)).toBe(false);
    expect(bitmapAceptable({ width: 100, height: 51 }, declarado)).toBe(false);
    expect(
      bitmapAceptable({ width: 13_000, height: 13_000 }, { ancho: 13_000, alto: 13_000 }),
    ).toBe(false);
    expect(
      bitmapAceptable({ width: 10_000, height: 10_000 }, { ancho: 10_000, alto: 10_000 }),
    ).toBe(false);
    expect(bitmapAceptable({ width: 0, height: 5 }, { ancho: 5, alto: 5 })).toBe(false);
  });

  it('el ahorro dice "sin cambio" si es cero y distingue si pesa más, en los 4 idiomas', () => {
    for (const t of [es, en, pt, fr]) {
      for (const f of [t.herramientas.imagenes.ahorro, t.herramientas.comprimir.ahorro]) {
        expect(f(25)).toMatch(/25/);
        expect(f(-20)).toMatch(/20/);
        expect(f(-20)).not.toBe(f(20));
        expect(f(-20)).not.toMatch(/-/);
        expect(f(0)).not.toMatch(/0/);
      }
      expect(t.herramientas.imagenes.sufijoConvertida).toMatch(/^-/);
      expect(t.herramientas.imagenes.sufijoComprimida).toMatch(/^-/);
      expect(t.herramientas.comprimir.sufijoOptimizado).toMatch(/^-/);
      expect(t.herramientas.comprimir.pdfAyuda).toMatch(/PDF\/A/);
      expect(t.herramientas.qrWifi.avisoPng).not.toBe('');
    }
  });
});
