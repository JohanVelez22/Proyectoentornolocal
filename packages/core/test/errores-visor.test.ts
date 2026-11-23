import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HUELLA_ERROR,
  InterpreteErrores,
  VisorErrores,
  formatoDeFuente,
  huellaError,
  interpretarLinea,
} from '../src/depuracion/errores';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Registros, type FuenteRegistro } from '../src/monitor/registros';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/* ───────────── Fixtures de cada formato ───────────── */

const PHP_LOG = [
  '[23-Nov-2026 15:04:05 UTC] PHP Warning:  Undefined variable $nombre in C:\\www\\demo\\index.php on line 7',
  '[23-Nov-2026 15:04:06 UTC] PHP Fatal error:  Uncaught RuntimeException: Falló el pedido 1234 in C:\\www\\demo\\app.php:12',
  'Stack trace:',
  '#0 C:\\www\\demo\\index.php(3): pedir()',
  '#1 {main}',
  '  thrown in C:\\www\\demo\\app.php on line 12',
  'PHP Notice:  Something odd in /var/www/x.php on line 2',
];

const LARAVEL_LOG = [
  '[2026-11-23 10:15:00] local.INFO: Usuario entró {"id":5}',
  '[2026-11-23 10:15:01] local.ERROR: Division by zero {"userId":5,"exception":"[object] (DivisionByZeroError(code: 0): Division by zero at /var/www/app/app/Http/Controllers/Caja.php:42)',
  '[stacktrace]',
  '#0 /var/www/app/vendor/laravel/framework/src/Illuminate/Routing/Controller.php(54): App\\Http\\Controllers\\Caja->total()',
  '#1 {main}',
  '"} ',
  '[2026-11-23 10:16:00] production.CRITICAL: Sin conexión a la base',
];

const CI3_LOG = [
  "<?php defined('BASEPATH') OR exit('No direct script access allowed'); ?>",
  '',
  'ERROR - 2026-11-23 09:00:00 --> Severity: Warning --> Undefined variable: total C:\\Mis Sitios\\ci\\application\\controllers\\Ventas.php 88',
  'DEBUG - 2026-11-23 09:00:00 --> Total execution time: 0.01',
  'ERROR - 2026-11-23 09:00:01 --> Severity: error --> Exception: Tabla inexistente /srv/ci/application/models/Venta_model.php 15',
  'ERROR - 2026-11-23 09:00:02 --> 404 Page Not Found: /favicon.ico',
];

const PYTHON_LOG = [
  'INFO:     127.0.0.1:5000 - "GET / HTTP/1.1" 500 Internal Server Error',
  'ERROR:    Exception in ASGI application',
  'Traceback (most recent call last):',
  '  File "/app/.venv/lib/site-packages/uvicorn/protocols/http.py", line 400, in run_asgi',
  '    result = await app(self.scope, self.receive, self.send)',
  '  File "C:\\api\\main.py", line 21, in raiz',
  '    return 1 / cero',
  'ZeroDivisionError: division by zero',
  'INFO:     siguiente',
];

const NGINX_LOG = [
  '2026/11/23 11:00:00 [error] 1234#5678: *9 FastCGI sent in stderr: "PHP message: PHP Warning:  Undefined index: x in C:\\www\\demo\\a.php on line 4PHP message: PHP Fatal error:  Uncaught Error: Call to undefined function f() in C:\\www\\demo\\b.php:9',
  'Stack trace:',
  '#0 {main}',
  '  thrown in C:\\www\\demo\\b.php on line 9" while reading response header from upstream, client: 127.0.0.1, server: demo.test, request: "GET / HTTP/1.1", upstream: "fastcgi://127.0.0.1:9000", host: "demo.test"',
  '2026/11/23 11:00:01 [warn] 1234#5678: *10 an upstream response is buffered to a temporary file',
  '2026/11/23 11:00:02 [error] 1234#5678: *11 open() "C:/www/demo/favicon.ico" failed (2: The system cannot find the file specified), client: 127.0.0.1, server: demo.test, request: "GET /favicon.ico HTTP/1.1"',
];

describe('interpretarLinea: cada formato', () => {
  it('log de PHP: avisos de una línea y fatales con traza', () => {
    const e = interpretarLinea('php', PHP_LOG);
    expect(e).toHaveLength(3);
    expect(e[0]).toMatchObject({
      tipo: 'PHP Warning',
      mensaje: 'Undefined variable $nombre',
      archivo: 'C:\\www\\demo\\index.php',
      linea: 7,
      fecha: '2026-11-23T15:04:05.000Z',
    });
    expect(e[1]).toMatchObject({
      tipo: 'RuntimeException',
      mensaje: 'Falló el pedido 1234',
      archivo: 'C:\\www\\demo\\app.php',
      linea: 12,
    });
    expect(e[1]!.traza).toEqual([
      'Stack trace:',
      '#0 C:\\www\\demo\\index.php(3): pedir()',
      '#1 {main}',
      '  thrown in C:\\www\\demo\\app.php on line 12',
    ]);
    expect(e[2]).toMatchObject({ tipo: 'PHP Notice', archivo: '/var/www/x.php', linea: 2 });
    expect(e[2]!.fecha).toBeNull();
  });

  it('laravel.log: solo ERROR o más grave, con la excepción y su traza multilínea', () => {
    const e = interpretarLinea('laravel', LARAVEL_LOG);
    expect(e).toHaveLength(2);
    expect(e[0]).toMatchObject({
      tipo: 'DivisionByZeroError',
      mensaje: 'Division by zero',
      archivo: '/var/www/app/app/Http/Controllers/Caja.php',
      linea: 42,
    });
    expect(e[0]!.traza[0]).toBe('[stacktrace]');
    expect(e[0]!.traza).toHaveLength(4);
    expect(e[1]).toMatchObject({
      tipo: 'Laravel CRITICAL',
      mensaje: 'Sin conexión a la base',
      archivo: null,
    });
  });

  it('logs de CodeIgniter 3: severidad, rutas con espacios, excepciones y 404', () => {
    const e = interpretarLinea('ci3', CI3_LOG);
    expect(e).toHaveLength(3);
    expect(e[0]).toMatchObject({
      tipo: 'CI3 Warning',
      mensaje: 'Undefined variable: total',
      archivo: 'C:\\Mis Sitios\\ci\\application\\controllers\\Ventas.php',
      linea: 88,
    });
    expect(e[1]).toMatchObject({
      tipo: 'Exception',
      mensaje: 'Tabla inexistente',
      archivo: '/srv/ci/application/models/Venta_model.php',
      linea: 15,
    });
    expect(e[2]).toMatchObject({ tipo: 'CI3 ERROR', mensaje: '404 Page Not Found: /favicon.ico' });
  });

  it('tracebacks de Python: tipo y mensaje de la última línea, archivo del último marco', () => {
    const e = interpretarLinea('python', PYTHON_LOG);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({
      tipo: 'ZeroDivisionError',
      mensaje: 'division by zero',
      archivo: 'C:\\api\\main.py',
      linea: 21,
    });
    expect(e[0]!.traza[0]).toBe('Traceback (most recent call last):');
    expect(e[0]!.traza).toContain('    return 1 / cero');
  });

  it('log de errores de Nginx: los PHP message de FastCGI y los errores propios', () => {
    const e = interpretarLinea('nginx', NGINX_LOG);
    expect(e.map((x) => x.tipo)).toEqual(['PHP Warning', 'Error', 'nginx error']);
    expect(e[0]).toMatchObject({
      mensaje: 'Undefined index: x',
      archivo: 'C:\\www\\demo\\a.php',
      linea: 4,
    });
    expect(e[1]).toMatchObject({
      mensaje: 'Call to undefined function f()',
      archivo: 'C:\\www\\demo\\b.php',
      linea: 9,
    });
    // La cola de Nginx (" while reading…) no queda en la traza.
    expect(e[1]!.traza.at(-1)).toBe('  thrown in C:\\www\\demo\\b.php on line 9');
    expect(e[2]!.mensaje).toMatch(/^open\(\) "C:\/www\/demo\/favicon\.ico" failed/);
    expect(e[2]!.mensaje).not.toContain('client:');
  });

  it('la traza se acota y una línea enorme no pasa entera', () => {
    const muchas = ['Traceback (most recent call last):'];
    for (let i = 0; i < 500; i++) muchas.push(`  File "/a.py", line ${i + 1}, in f`, '    x');
    muchas.push(`ValueError: ${'z'.repeat(50_000)}`);
    const [e] = interpretarLinea('python', muchas);
    expect(e!.traza.length).toBeLessThanOrEqual(60);
    expect(e!.mensaje.length).toBeLessThanOrEqual(2001);
  });

  it('una línea de 1 MiB se procesa en menos de 50 ms en cada formato (sin regex cuadráticas)', () => {
    // Muchas coincidencias parciales (' in ', ' at ', espacios, ' C:/', '--> '): el peor caso.
    const enorme = ' in x:1 at y:2 C:/ 3 --> Severity: E --> '.repeat(24 * 1024);
    const casos: [Parameters<typeof interpretarLinea>[0], string[]][] = [
      ['php', [`PHP Warning:  ${enorme} in x`, `PHP Fatal error:  Uncaught E: ${enorme}`]],
      [
        'laravel',
        [
          `[2026-11-23 10:00:00] local.ERROR: ${enorme} {"exception":"[object] (E(code: 0): ${enorme}`,
        ],
      ],
      ['ci3', [`ERROR - 2026-11-23 09:00:00 --> Severity: Warning --> ${enorme} C:/ x`]],
      ['python', ['Traceback (most recent call last):', `  File "${enorme}`, `${enorme}`]],
      [
        'nginx',
        [
          `2026/11/23 11:00:00 [error] 1#1: *1 FastCGI sent in stderr: "PHP message: PHP Warning:  ${enorme}`,
        ],
      ],
    ];
    for (const [formato, lineas] of casos) {
      const t = performance.now();
      const e = interpretarLinea(formato, lineas);
      expect(performance.now() - t, formato).toBeLessThan(50);
      for (const x of e) expect(x.mensaje.length).toBeLessThanOrEqual(2001);
    }
  });

  it('el intérprete en vivo junta la traza que llega en otro lote', () => {
    const i = new InterpreteErrores('laravel');
    expect(i.agregar(LARAVEL_LOG.slice(0, 3))).toEqual([]);
    const cerradas = i.agregar(LARAVEL_LOG.slice(3));
    expect(cerradas).toHaveLength(1);
    expect(cerradas[0]!.traza).toHaveLength(4);
    expect(i.cerrar()).toHaveLength(1);
  });
});

describe('huellaError', () => {
  const base = {
    tipo: 'RuntimeException',
    archivo: 'C:\\www\\demo\\app.php',
    linea: 12,
    fecha: null,
    traza: [],
  };

  it('agrupa mensajes que solo cambian en números, ids y rutas temporales', () => {
    const a = huellaError({ ...base, mensaje: 'Pedido 1234 falló (id 9f8e7d6c5b4a)' });
    const b = huellaError({ ...base, mensaje: 'Pedido 99 falló (id 0123456789abcdef)' });
    expect(a).toBe(b);
    const t1 = huellaError({ ...base, mensaje: 'No se pudo leer /tmp/phpA1b2C3' });
    const t2 = huellaError({
      ...base,
      mensaje: 'No se pudo leer C:\\Users\\yo\\AppData\\Local\\Temp\\phpZ9.tmp',
    });
    expect(t1).toBe(t2);
    const u1 = huellaError({ ...base, mensaje: 'Sin 3f2504e0-4f89-11d3-9a0c-0305e82c3301' });
    const u2 = huellaError({ ...base, mensaje: 'Sin 6ba7b810-9dad-11d1-80b4-00c04fd430c8' });
    expect(u1).toBe(u2);
    expect(a).toMatch(HUELLA_ERROR);
  });

  it('distingue otro tipo, otro mensaje u otro archivo:línea', () => {
    const a = huellaError({ ...base, mensaje: 'x' });
    expect(huellaError({ ...base, mensaje: 'y' })).not.toBe(a);
    expect(huellaError({ ...base, mensaje: 'x', tipo: 'LogicException' })).not.toBe(a);
    expect(huellaError({ ...base, mensaje: 'x', linea: 13 })).not.toBe(a);
    // La misma ruta con otras barras o mayúsculas en Windows es el mismo lugar.
    expect(huellaError({ ...base, mensaje: 'x', archivo: 'c:/www/demo/app.php' })).toBe(a);
  });
});

describe('formatoDeFuente', () => {
  const f = (id: string, grupo: FuenteRegistro['grupo']): FuenteRegistro => ({
    id,
    nombre: id,
    ruta: '/x',
    grupo,
  });
  it('elige el intérprete por fuente; las de acceso no se interpretan', () => {
    expect(formatoDeFuente(f('php:8.4', 'php'))).toBe('php');
    expect(formatoDeFuente(f('nginx:error', 'nginx'))).toBe('nginx');
    expect(formatoDeFuente(f('nginx', 'nginx'))).toBeNull();
    expect(formatoDeFuente(f('sitio:demo:error', 'sitio'))).toBe('nginx');
    expect(formatoDeFuente(f('sitio:demo:acceso', 'sitio'))).toBeNull();
    expect(formatoDeFuente(f('laravel:demo', 'laravel'))).toBe('laravel');
    expect(formatoDeFuente(f('ci3:demo', 'ci3'))).toBe('ci3');
    expect(formatoDeFuente(f('proy-api-web', 'proyecto'))).toBe('python');
    expect(formatoDeFuente(f('tunel:demo', 'tunel'))).toBeNull();
  });
});

describe('Registros: fuente de CodeIgniter 3', () => {
  it('sigue el log más nuevo de application/logs (o el de hoy si no hay)', async () => {
    const base = await carpetaTemporal('pel-ci3-');
    const carpeta = path.join(base, 'ci');
    const logs = path.join(carpeta, 'application', 'logs');
    const sitio = SitioSchema.parse({
      id: 'ci',
      nombre: 'Ventas',
      dominio: 'ci.test',
      carpeta,
      tipo: 'codeigniter3',
      php: '8.4',
    });
    const registros = new Registros({
      rutas: new Rutas(base),
      eventos: new Eventos<EventosNucleo>(),
      leerSitios: async () => [sitio],
      rutaLogProceso: () => path.join(base, 'x.log'),
    });
    const sinLogs = (await registros.fuentes()).find((f) => f.id === 'ci3:ci')!;
    expect(path.basename(sinLogs.ruta)).toMatch(/^log-\d{4}-\d{2}-\d{2}\.php$/);
    await mkdir(logs, { recursive: true });
    await writeFile(path.join(logs, 'log-2026-11-20.php'), CI3_LOG.join('\n'));
    await writeFile(path.join(logs, 'log-2026-11-22.php'), CI3_LOG.join('\n'));
    await writeFile(path.join(logs, 'index.html'), '');
    const f = (await registros.fuentes()).find((x) => x.id === 'ci3:ci')!;
    expect(f).toMatchObject({ grupo: 'ci3', sitioId: 'ci' });
    expect(path.basename(f.ruta)).toBe('log-2026-11-22.php');
    expect(interpretarLinea('ci3', await registros.leerFinal('ci3:ci', 50))).toHaveLength(3);
  });
});

/* ───────────── VisorErrores sobre Registros ───────────── */

async function montar(): Promise<{
  base: string;
  visor: VisorErrores;
  registros: Registros;
  eventos: Eventos<EventosNucleo>;
  sitios: Sitio[];
}> {
  const base = await carpetaTemporal('pel-errores-');
  const rutas = new Rutas(base);
  const carpeta = path.join(base, 'proyectos', 'tienda');
  await mkdir(path.join(carpeta, 'storage', 'logs'), { recursive: true });
  await mkdir(path.join(carpeta, 'app'), { recursive: true });
  await writeFile(path.join(carpeta, 'app', 'Caja.php'), '<?php\n');
  const sitios: Sitio[] = [
    SitioSchema.parse({
      id: 'tienda',
      nombre: 'Tienda',
      dominio: 'tienda.test',
      carpeta,
      tipo: 'laravel',
      php: '8.4',
    }),
  ];
  const archivoCaja = path.join(carpeta, 'app', 'Caja.php');
  await writeFile(
    path.join(carpeta, 'storage', 'logs', 'laravel.log'),
    [
      `[2026-11-23 10:15:01] local.ERROR: Division by zero {"exception":"[object] (DivisionByZeroError(code: 0): Division by zero at ${archivoCaja}:42)`,
      '[stacktrace]',
      '#0 {main}',
      '"} ',
      `[2026-11-23 10:20:01] local.ERROR: Division by zero {"exception":"[object] (DivisionByZeroError(code: 0): Division by zero at ${archivoCaja}:42)`,
      '[stacktrace]',
      '#0 {otra}',
      '"} ',
      '',
    ].join('\n'),
  );
  await mkdir(rutas.logs(), { recursive: true });
  await writeFile(
    rutas.logs('php-8.4.log'),
    `PHP Warning:  Undefined variable $a in ${archivoCaja} on line 3\nPHP Warning:  Otro in /fuera/x.php on line 1\n`,
  );
  const eventos = new Eventos<EventosNucleo>();
  const registros = new Registros({
    rutas,
    eventos,
    leerSitios: async () => sitios,
    rutaLogProceso: (s, p) => path.join(base, 'logs', 'proyectos', `${s}-${p}.log`),
    intervaloMs: 30,
  });
  let reloj = Date.parse('2026-11-23T12:00:00Z');
  const visor = new VisorErrores({
    registros,
    eventos,
    leerSitios: async () => sitios,
    ahora: () => (reloj += 1000),
    esperaCierreMs: 20,
  });
  return { base, visor, registros, eventos, sitios };
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('VisorErrores', () => {
  it('agrupa por huella con contador, primera y última vez, y deduce el sitio por la ruta', async () => {
    const { visor, registros } = await montar();
    try {
      const lista = await visor.lista();
      const laravel = lista.find((e) => e.tipo === 'DivisionByZeroError')!;
      expect(laravel.veces).toBe(2);
      expect(laravel.sitioId).toBe('tienda');
      expect(laravel.fuenteId).toBe('laravel:tienda');
      expect(laravel.primera).toBe(new Date('2026-11-23T10:15:01').toISOString());
      expect(laravel.ultima).toBe(new Date('2026-11-23T10:20:01').toISOString());
      // La lista no lleva la traza; leer sí (la de la última vez).
      expect('traza' in laravel).toBe(false);
      const completo = await visor.leer(laravel.huella);
      expect(completo!.traza).toEqual(['[stacktrace]', '#0 {otra}', '"} ']);
      // El aviso de PHP de un archivo del sitio queda en el sitio; el de afuera, sin sitio.
      const php = lista.filter((e) => e.tipo === 'PHP Warning');
      expect(php.find((e) => e.linea === 3)!.sitioId).toBe('tienda');
      expect(php.find((e) => e.linea === 1)!.sitioId).toBeNull();
      expect((await visor.lista({ sitioId: 'tienda' })).every((e) => e.sitioId === 'tienda')).toBe(
        true,
      );
    } finally {
      visor.cerrar();
      registros.cerrar();
    }
  });

  it('se alimenta de Registros.seguir: las líneas nuevas suman al grupo', async () => {
    const { base, visor, registros } = await montar();
    try {
      await visor.lista();
      const { appendFile } = await import('node:fs/promises');
      await appendFile(
        new Rutas(base).logs('php-8.4.log'),
        'PHP Warning:  Undefined variable $a in /otro/y.php on line 5\n'.repeat(3),
      );
      let grupo;
      for (let i = 0; i < 100 && grupo?.veces !== 3; i++) {
        await esperar(30);
        grupo = (await visor.lista()).find((e) => e.archivo === '/otro/y.php');
      }
      expect(grupo?.veces).toBe(3);
    } finally {
      visor.cerrar();
      registros.cerrar();
    }
  });

  it('filtra por fecha y enmascara secretos del mensaje y la traza', async () => {
    const { visor, registros, eventos } = await montar();
    try {
      await visor.lista();
      eventos.emit('registro:lineas', {
        id: 'php:8.4',
        lineas: [
          'PHP Warning:  Falló con password=hunter2 y sk-abcdefghijklmnop in /z.php on line 1',
        ],
      });
      await esperar(40);
      const e = (await visor.lista()).find((x) => x.archivo === '/z.php')!;
      expect(e.mensaje).not.toContain('hunter2');
      expect(e.mensaje).not.toContain('sk-abcdefghijklmnop');
      expect((await visor.lista({ desde: '2030-01-01T00:00:00Z' })).length).toBe(0);
    } finally {
      visor.cerrar();
      registros.cerrar();
    }
  });

  it('procesa los lotes grandes cediendo el bucle de eventos', async () => {
    const lineas = Array.from(
      { length: 60_000 },
      (_, i) => `PHP Warning:  Aviso ${i} in /p/x${i % 50}.php on line ${i % 7}`,
    );
    const visor = new VisorErrores({
      registros: {
        fuentes: async () => [{ id: 'php:8.4', nombre: 'PHP', ruta: '/x', grupo: 'php' }],
        seguir: async () => () => undefined,
        leerFinal: async () => lineas,
      },
      eventos: new Eventos<EventosNucleo>(),
      leerSitios: async () => [],
    });
    let cedio = false;
    let terminado = false;
    setImmediate(() => {
      if (!terminado) cedio = true;
    });
    const lista = await visor.lista();
    terminado = true;
    visor.cerrar();
    expect(cedio).toBe(true);
    expect(lista.reduce((n, e) => n + e.veces, 0)).toBe(60_000);
  });

  it('leer con una huella desconocida da null', async () => {
    const { visor, registros } = await montar();
    try {
      expect(await visor.leer('0'.repeat(16))).toBeNull();
    } finally {
      visor.cerrar();
      registros.cerrar();
    }
  });
});
