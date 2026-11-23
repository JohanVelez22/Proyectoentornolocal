import http from 'node:http';
import { mkdir, readFile, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MAX_CUERPO_DUMP,
  ReceptorDumps,
  textoParaCopiar,
  type ResumenDump,
} from '../src/depuracion/receptor';
import { prependPhp, rutasDepuracion } from '../src/depuracion/prepend';
import { wolfdumpPy } from '../src/depuracion/wolfdump.py';
import { iniSitio, necesitaPoolPropio } from '../src/php/poolSitio';
import { Nucleo } from '../src/nucleo';
import type { Plataforma } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const receptores: ReceptorDumps[] = [];
afterEach(async () => {
  for (const r of receptores.splice(0)) await r.detener();
});

async function nuevoReceptor(
  o: { porSegundo?: number; maximo?: number; maxBytes?: number; latidoMs?: number } = {},
): Promise<{ r: ReceptorDumps; base: string; nuevos: ResumenDump[] }> {
  const base = await carpetaTemporal('pel-dumps-');
  const nuevos: ResumenDump[] = [];
  const r = new ReceptorDumps({
    rutas: new Rutas(base),
    puerto: async () => 0,
    emitir: (d) => nuevos.push(d),
    ...(o.porSegundo !== undefined ? { porSegundo: o.porSegundo } : {}),
    ...(o.maximo !== undefined ? { maximo: o.maximo } : {}),
    ...(o.maxBytes !== undefined ? { maxBytes: o.maxBytes } : {}),
    ...(o.latidoMs !== undefined ? { latidoMs: o.latidoMs } : {}),
  });
  receptores.push(r);
  await r.iniciar();
  return { r, base, nuevos };
}

async function tokenDe(base: string): Promise<{ puerto: number; token: string }> {
  return JSON.parse(await readFile(rutasDepuracion(new Rutas(base)).receptor, 'utf8'));
}

function enviar(
  puerto: number,
  cuerpo: string | Buffer,
  cabeceras: Record<string, string> = {},
  o: { metodo?: string; ruta?: string } = {},
): Promise<number> {
  return new Promise((ok, mal) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: puerto,
        method: o.metodo ?? 'POST',
        path: o.ruta ?? '/dump',
        headers: { 'Content-Type': 'application/json', ...cabeceras },
      },
      (res) => {
        res.resume();
        res.on('end', () => ok(res.statusCode ?? 0));
      },
    );
    // Un cuerpo demasiado grande puede cortar la conexión antes de la respuesta.
    req.on('error', (e: NodeJS.ErrnoException) =>
      e.code === 'ECONNRESET' || e.code === 'EPIPE' ? ok(-1) : mal(e),
    );
    req.end(cuerpo);
  });
}

const dump = (extra: Record<string, unknown> = {}): string =>
  JSON.stringify({
    origen: 'php',
    sitio: 'demo',
    archivo: 'C:/proyectos/demo/index.php',
    linea: 12,
    url: 'https://demo.test/',
    texto: 'array:1 [ "a" => 1 ]',
    ...extra,
  });

describe('ReceptorDumps', () => {
  it('escucha solo en 127.0.0.1 y guarda puerto y token en run/', async () => {
    const { r, base } = await nuevoReceptor();
    const e = r.estado();
    expect(e.activo).toBe(true);
    expect(e.direccion).toBe('127.0.0.1');
    const c = await tokenDe(base);
    expect(c.puerto).toBe(e.puerto);
    expect(c.token).toMatch(/^[0-9a-f]{64}$/);
    // El estado nunca lleva el token.
    expect(JSON.stringify(e)).not.toContain(c.token);
  });

  it('acepta un dump con el token y lo emite sin el texto completo', async () => {
    const { r, base, nuevos } = await nuevoReceptor();
    const { puerto, token } = await tokenDe(base);
    expect(await enviar(puerto, dump(), { Authorization: `Bearer ${token}` })).toBe(204);
    const lista = r.lista();
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      origen: 'php',
      sitioId: 'demo',
      archivo: 'C:/proyectos/demo/index.php',
      linea: 12,
    });
    expect(nuevos).toHaveLength(1);
    const completo = r.leer(lista[0]!.id);
    expect(completo?.texto).toBe('array:1 [ "a" => 1 ]');
    expect(completo?.html).toBeNull();
  });

  it('rechaza sin token, con otro token, otro Host, Origin, otra ruta u otro método', async () => {
    const { r, base } = await nuevoReceptor();
    const { puerto, token } = await tokenDe(base);
    expect(await enviar(puerto, dump())).toBe(401);
    expect(await enviar(puerto, dump(), { Authorization: `Bearer ${'0'.repeat(64)}` })).toBe(401);
    expect(await enviar(puerto, dump(), { Authorization: token })).toBe(401);
    const bien = { Authorization: `Bearer ${token}` };
    expect(await enviar(puerto, dump(), { ...bien, Host: 'evil.example' })).toBe(403);
    expect(await enviar(puerto, dump(), { ...bien, Origin: 'https://evil.example' })).toBe(403);
    expect(await enviar(puerto, dump(), bien, { ruta: '/otra' })).toBe(404);
    expect(await enviar(puerto, '', bien, { metodo: 'GET' })).toBe(405);
    expect(r.lista()).toHaveLength(0);
  });

  it('rechaza cuerpos grandes, JSON roto y formas inválidas sin guardar nada', async () => {
    const { r, base } = await nuevoReceptor();
    const { puerto, token } = await tokenDe(base);
    const bien = { Authorization: `Bearer ${token}` };
    const grande = dump({ texto: 'x'.repeat(MAX_CUERPO_DUMP + 10) });
    expect([413, -1]).toContain(await enviar(puerto, grande, bien));
    expect(await enviar(puerto, '{no es json', bien)).toBe(400);
    expect(await enviar(puerto, dump({ origen: 'ruby' }), bien)).toBe(400);
    expect(await enviar(puerto, dump({ texto: 42 }), bien)).toBe(400);
    expect(await enviar(puerto, '[]', bien)).toBe(400);
    expect(r.lista()).toHaveLength(0);
    // Sigue aceptando después.
    expect(await enviar(puerto, dump(), bien)).toBe(204);
  });

  it('un sitio, archivo o línea raros quedan en null; el texto nunca se interpreta', async () => {
    const { r, base } = await nuevoReceptor();
    const { puerto, token } = await tokenDe(base);
    const texto = '<script>alert(1)</script>${process.exit(1)}';
    await enviar(
      puerto,
      dump({ sitio: '../../etc', linea: -4, archivo: 7, url: 'x'.repeat(5000), texto }),
      { Authorization: `Bearer ${token}` },
    );
    const d = r.leer(r.lista()[0]!.id)!;
    expect(d.sitioId).toBeNull();
    expect(d.linea).toBeNull();
    expect(d.archivo).toBeNull();
    expect(d.url!.length).toBeLessThanOrEqual(2048);
    expect(d.texto).toBe(texto);
  });

  it('anillo: conserva solo los últimos `maximo` y respeta el tope de bytes', async () => {
    const { r, base } = await nuevoReceptor({ maximo: 3, maxBytes: 1000 });
    const { puerto, token } = await tokenDe(base);
    const bien = { Authorization: `Bearer ${token}` };
    for (let i = 0; i < 5; i++) await enviar(puerto, dump({ texto: `n${i}` }), bien);
    expect(r.lista().map((d) => d.vista)).toEqual(['n4', 'n3', 'n2']);
    await enviar(puerto, dump({ texto: 'y'.repeat(600) }), bien);
    await enviar(puerto, dump({ texto: 'w'.repeat(600) }), bien);
    // El último entra y desplaza a los viejos hasta caber.
    expect(r.lista().map((d) => d.vista[0])).toEqual(['w']);
    expect(r.bytes()).toBeLessThanOrEqual(1000);
    // Uno más grande que el tope no entra.
    await enviar(puerto, dump({ texto: 'z'.repeat(1200) }), bien);
    expect(r.lista().every((d) => !d.vista.startsWith('z'))).toBe(true);
  });

  it('limita la cantidad por segundo (429)', async () => {
    const { r, base } = await nuevoReceptor({ porSegundo: 3 });
    const { puerto, token } = await tokenDe(base);
    const bien = { Authorization: `Bearer ${token}` };
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) codigos.push(await enviar(puerto, dump(), bien));
    expect(codigos.filter((c) => c === 204)).toHaveLength(3);
    expect(codigos.filter((c) => c === 429).length).toBeGreaterThan(0);
    expect(r.lista()).toHaveLength(3);
  });

  it('filtra por sitio, origen y texto; limpiar vacía la memoria', async () => {
    const { r, base } = await nuevoReceptor();
    const { puerto, token } = await tokenDe(base);
    const bien = { Authorization: `Bearer ${token}` };
    await enviar(puerto, dump({ sitio: 'a', texto: 'hola mundo' }), bien);
    await enviar(puerto, dump({ sitio: 'b', texto: 'adiós' }), bien);
    await enviar(puerto, dump({ origen: 'python', sitio: 'a', texto: 'pyth' }), bien);
    expect(r.lista({ sitioId: 'a' })).toHaveLength(2);
    expect(r.lista({ origen: 'python' })).toHaveLength(1);
    expect(r.lista({ texto: 'MUNDO' })).toHaveLength(1);
    expect(r.lista({ texto: 'index.php' })).toHaveLength(3);
    r.limpiar();
    expect(r.lista()).toHaveLength(0);
    expect(r.estado().total).toBe(0);
  });

  it('el archivo lleva el PID del receptor y un latido que mantiene su fecha al día', async () => {
    const { base } = await nuevoReceptor({ latidoMs: 40 });
    const archivo = rutasDepuracion(new Rutas(base)).receptor;
    const c = JSON.parse(await readFile(archivo, 'utf8')) as { pid: number };
    expect(c.pid).toBe(process.pid);
    const viejo = new Date(Date.now() - 10 * 60_000);
    await utimes(archivo, viejo, viejo);
    await new Promise((ok) => setTimeout(ok, 200));
    expect(Date.now() - (await stat(archivo)).mtimeMs).toBeLessThan(5000);
  });

  it('el archivo del token se restringe al usuario antes de escribir el token', async () => {
    const base = await carpetaTemporal('pel-dumps-');
    const vistos: { ruta: string; contenido: string }[] = [];
    const r = new ReceptorDumps({
      rutas: new Rutas(base),
      puerto: async () => 0,
      emitir: () => undefined,
      restringir: async (ruta) => {
        vistos.push({ ruta, contenido: await readFile(ruta, 'utf8') });
        return true;
      },
    });
    receptores.push(r);
    await r.iniciar();
    const archivo = rutasDepuracion(new Rutas(base)).receptor;
    expect(vistos).toHaveLength(1);
    expect(path.dirname(vistos[0]!.ruta)).toBe(path.dirname(archivo));
    expect(vistos[0]!.contenido).toBe('');
    expect((await tokenDe(base)).token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('si no se puede restringir el archivo, el receptor arranca igual', async () => {
    const base = await carpetaTemporal('pel-dumps-');
    const r = new ReceptorDumps({
      rutas: new Rutas(base),
      puerto: async () => 0,
      emitir: () => undefined,
      restringir: async () => false,
    });
    receptores.push(r);
    await r.iniciar();
    expect(r.estado().activo).toBe(true);
  });

  it('cada sesión tiene un token nuevo; detener borra el archivo y deja de aceptar', async () => {
    const { r, base } = await nuevoReceptor();
    const primero = await tokenDe(base);
    await r.detener();
    await expect(readFile(rutasDepuracion(new Rutas(base)).receptor)).rejects.toThrow();
    await r.iniciar();
    const segundo = await tokenDe(base);
    expect(segundo.token).not.toBe(primero.token);
    expect(await enviar(segundo.puerto, dump(), { Authorization: `Bearer ${primero.token}` })).toBe(
      401,
    );
  });

  it('puerto ocupado: error con código y sin archivo de token', async () => {
    const ocupado = http.createServer();
    await new Promise<void>((ok) => ocupado.listen(0, '127.0.0.1', () => ok()));
    const puerto = (ocupado.address() as { port: number }).port;
    try {
      const base = await carpetaTemporal('pel-dumps-');
      const r = new ReceptorDumps({
        rutas: new Rutas(base),
        puerto: async () => puerto,
        emitir: () => undefined,
      });
      receptores.push(r);
      await expect(r.iniciar()).rejects.toMatchObject({ codigo: 'depuracion.puerto_ocupado' });
      await expect(readFile(rutasDepuracion(new Rutas(base)).receptor)).rejects.toThrow();
    } finally {
      await new Promise((ok) => ocupado.close(ok));
    }
  });

  it('copiar enmascara secretos con PATRONES_SECRETOS', () => {
    const t = textoParaCopiar({
      id: 'd1',
      fecha: '2026-11-23T00:00:00.000Z',
      origen: 'php',
      sitioId: 'demo',
      archivo: 'C:/x/index.php',
      linea: 3,
      url: 'https://demo.test/?token=abc123',
      html: null,
      texto: 'DB_PASSWORD=supersecreta\n"key" => "sk-abcdefghijklmnop"',
    });
    expect(t).not.toContain('supersecreta');
    expect(t).not.toContain('sk-abcdefghijklmnop');
    expect(t).not.toContain('abc123');
    expect(t).toContain('C:/x/index.php:3');
  });
});

describe('prepend y wolfdump', () => {
  it('el prepend lee el token de un archivo y nunca lo lleva escrito', () => {
    const php = prependPhp({ rutaReceptor: "C:\\Datos\\O'Brien\\run\\depuracion.json" });
    expect(php.startsWith('<?php')).toBe(true);
    expect(php).toContain("'C:\\\\Datos\\\\O\\'Brien\\\\run\\\\depuracion.json'");
    expect(php).not.toMatch(/[0-9a-f]{64}/);
    for (const f of ['wd', 'dump', 'dd']) {
      expect(php).toContain(`if (!function_exists('${f}'))`);
    }
    // Plazo corto y sin errores visibles.
    expect(php).toContain('0.2');
    expect(php).toContain('set_error_handler');
    expect(php).not.toMatch(/\beval\s*\(/);
  });

  it('el token nunca viaja como argumento de una función del prepend', () => {
    const php = prependPhp({ rutaReceptor: 'C:/Datos/run/depuracion.json' });
    // enviar() lee el receptor por dentro: solo recibe los datos, marcados como sensibles.
    expect(php).toMatch(/function enviar\(\s*#\[\\SensitiveParameter\]\s*array \$datos\s*\)/);
    expect(php).not.toMatch(/self::enviar\(\s*\$c\b/);
    expect(php).toMatch(/function capturar\(\s*#\[\\SensitiveParameter\]\s*array \$valores\s*\)/);
    // El atributo va en su propia línea: en PHP 7, `#[` es un comentario hasta el final de la línea.
    for (const l of php.split('\n').filter((x) => x.includes('#[\\SensitiveParameter]'))) {
      expect(l.trim()).toBe('#[\\SensitiveParameter]');
    }
  });

  it('prepend y wolfdump no envían si el receptor no está vivo (PID o latido viejo)', () => {
    const php = prependPhp({ rutaReceptor: 'C:/Datos/run/depuracion.json' });
    expect(php).toContain('filemtime(self::RECEPTOR)');
    expect(php).toContain('clearstatcache');
    expect(php).toContain("isset($c['pid'])");
    expect(php).toContain('posix_kill');
    const py = wolfdumpPy({ rutaReceptor: 'C:/Datos/run/depuracion.json' });
    expect(py).toContain('os.path.getmtime(_RECEPTOR)');
    expect(py).toContain('def _vivo(pid)');
    // En Windows, os.kill(pid, 0) TERMINA el proceso: nunca se usa ahí.
    expect(py).toMatch(/if os\.name == "nt":[\s\S]*OpenProcess[\s\S]*os\.kill\(pid, 0\)/);
  });

  it('el envío de PHP tiene un plazo total (socket no bloqueante y stream_select)', () => {
    const php = prependPhp({ rutaReceptor: 'C:/Datos/run/depuracion.json' });
    expect(php).toContain('stream_set_blocking($s, false)');
    expect(php).toContain('stream_select(');
    expect(php).toContain('$fin = microtime(true) + self::PLAZO;');
    expect(php).not.toContain('stream_set_timeout(');
  });

  it('wolfdump.py lee el mismo archivo y define dump()', () => {
    const py = wolfdumpPy({ rutaReceptor: 'C:\\Datos\\run\\depuracion.json' });
    expect(py).toContain('"C:\\\\Datos\\\\run\\\\depuracion.json"');
    expect(py).toContain('def dump(*valores');
    expect(py).toContain('_PLAZO = 0.2');
    expect(py).not.toMatch(/\beval\s*\(|\bexec\s*\(/);
  });
});

describe('auto_prepend_file solo con la captura activa del sitio', () => {
  const sitio = (extra: Partial<Sitio> = {}): Sitio =>
    SitioSchema.parse({
      id: 'demo',
      nombre: 'Demo',
      dominio: 'demo.test',
      carpeta: path.join('C:', 'p', 'demo'),
      tipo: 'codeigniter3',
      php: '8.4',
      ...extra,
    });
  const PREPEND = 'C:\\Datos\\etc\\php\\wolfcore-prepend.php';

  it('sin captura: no hay pool propio ni auto_prepend_file', () => {
    const s = sitio();
    expect(necesitaPoolPropio(s)).toBe(false);
    expect(iniSitio(s, '[PHP]\nmemory_limit=128M\n', null, [], PREPEND)).not.toContain(
      'auto_prepend_file',
    );
    // Con otros ajustes tampoco.
    const otro = sitio({ phpIni: { memory_limit: '256M' } });
    expect(iniSitio(otro, '[PHP]\n', null, [], PREPEND)).not.toContain('auto_prepend_file');
  });

  it('con captura: pool propio, auto_prepend_file, id del sitio y prepend anterior encadenado', () => {
    const s = sitio({ capturaDumps: true });
    expect(necesitaPoolPropio(s)).toBe(true);
    const ini = iniSitio(s, '[PHP]\nauto_prepend_file = "C:/mio/antes.php"\n', null, [], PREPEND);
    expect(ini).toContain('auto_prepend_file = "C:/Datos/etc/php/wolfcore-prepend.php"');
    expect(ini).toContain('wolfcore.sitio = "demo"');
    expect(ini).toContain('wolfcore.prepend_previo = "C:/mio/antes.php"');
    // La última línea vale: la nuestra va después de la del usuario.
    expect(ini.lastIndexOf('wolfcore-prepend.php')).toBeGreaterThan(ini.indexOf('antes.php'));
  });

  it('el ajuste propio del sitio también se encadena', () => {
    const s = sitio({ capturaDumps: true, phpIni: { auto_prepend_file: 'C:/sitio/pre.php' } });
    const ini = iniSitio(s, '[PHP]\n', null, [], PREPEND);
    expect(ini).toContain('wolfcore.prepend_previo = "C:/sitio/pre.php"');
  });

  it('si el prepend anterior es el nuestro, no se encadena (sin recursión)', () => {
    const s = sitio({ capturaDumps: true });
    for (const previo of [
      'C:/Datos/etc/php/wolfcore-prepend.php',
      '"c:\\datos\\etc\\php\\WOLFCORE-prepend.php"',
    ]) {
      const ini = iniSitio(s, `[PHP]\nauto_prepend_file = ${previo}\n`, null, [], PREPEND);
      expect(ini).not.toContain('wolfcore.prepend_previo');
      expect(ini).toContain('auto_prepend_file = "C:/Datos/etc/php/wolfcore-prepend.php"');
    }
    const propio = sitio({ capturaDumps: true, phpIni: { auto_prepend_file: PREPEND } });
    expect(iniSitio(propio, '[PHP]\n', null, [], PREPEND)).not.toContain('prepend_previo');
  });

  it('el script carga el prepend anterior con require_once y nunca a sí mismo', () => {
    const php = prependPhp({ rutaReceptor: 'C:/Datos/run/depuracion.json' });
    expect(php).toContain('require_once');
    expect(php).not.toMatch(/\brequire get_cfg_var/);
    expect(php).toContain('__FILE__');
  });

  it('un sitio sin PHP nunca lleva prepend', () => {
    const s = sitio({ tipo: 'fastapi', php: null, capturaDumps: true });
    expect(necesitaPoolPropio(s)).toBe(false);
  });
});

async function puertoLibre(): Promise<number> {
  const s = http.createServer();
  await new Promise<void>((ok) => s.listen(0, '127.0.0.1', () => ok()));
  const p = (s.address() as { port: number }).port;
  await new Promise((ok) => s.close(ok));
  return p;
}

describe('Nucleo: captura de dumps por sitio', () => {
  async function crearNucleo(base: string, extra: Record<string, unknown> = {}): Promise<Nucleo> {
    const hosts = path.join(base, 'hosts');
    await writeFile(hosts, '');
    await writeFile(
      path.join(base, 'config.json'),
      JSON.stringify({
        version: 1,
        depuracion: { puerto: await puertoLibre() },
        sitios: [
          {
            id: 'api',
            nombre: 'API',
            dominio: 'api.test',
            carpeta: base,
            tipo: 'fastapi',
            puertoProxy: 8001,
          },
          { id: 'web', nombre: 'Web', dominio: 'web.test', carpeta: base, tipo: 'estatico' },
        ],
        ...extra,
      }),
    );
    const plataforma = {
      rutaHosts: () => hosts,
      escribirComoAdmin: async () => ({ ok: true }),
      quienUsaPuerto: async () => null,
      duenosDePuertos: async () => new Map(),
      instalarCertificadoUsuario: async () => ({ ok: true as const }),
      quitarCertificadoUsuario: async () => ({ ok: true as const }),
      certificadoInstalado: async () => false,
      procesoVivo: async () => ({ vivo: false }),
      matarArbol: async () => undefined,
      abrirUrl: async () => undefined,
      ejecutable: (n: string) => `${n}.exe`,
      carpetaDocumentos: async () => base,
    } as unknown as Plataforma;
    return Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
  }

  it('al iniciar deja el prepend y wolfdump escritos aunque la captura esté apagada', async () => {
    const base = await carpetaTemporal('pel-dumps-nucleo-');
    // Token de una sesión que se cortó: se borra al arrancar con la captura apagada.
    const viejo = rutasDepuracion(new Rutas(base)).receptor;
    await mkdir(path.dirname(viejo), { recursive: true });
    await writeFile(viejo, JSON.stringify({ puerto: 9912, token: 'a'.repeat(64) }));
    const n = await crearNucleo(base);
    try {
      const r = rutasDepuracion(new Rutas(base));
      expect(await readFile(r.prepend, 'utf8')).toContain('WolfCoreDump');
      expect(await readFile(r.python, 'utf8')).toContain('def dump(');
      expect(n.estadoDepuracion().activo).toBe(false);
      await expect(readFile(r.receptor)).rejects.toThrow();
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });

  it('encender exige confirmación, enciende el receptor y apagarlo todo la quita de los sitios', async () => {
    const base = await carpetaTemporal('pel-dumps-nucleo-');
    const n = await crearNucleo(base);
    try {
      await expect(n.capturaDumpsSitio('api', true)).rejects.toMatchObject({
        codigo: 'depuracion.confirmacion',
      });
      await expect(n.capturaDumpsSitio('web', true, true)).rejects.toMatchObject({
        codigo: 'depuracion.tipo_no_soportado',
      });
      const r = await n.capturaDumpsSitio('api', true, true);
      expect(r.sitio.capturaDumps).toBe(true);
      expect(n.estadoDepuracion().activo).toBe(true);
      const cfg = JSON.parse(await readFile(path.join(base, 'config.json'), 'utf8'));
      expect(cfg.depuracion.activa).toBe(true);
      // Apagar el receptor apaga la captura en todos los sitios.
      await n.activarDepuracion(false);
      expect(n.estadoDepuracion().activo).toBe(false);
      const despues = JSON.parse(await readFile(path.join(base, 'config.json'), 'utf8'));
      expect(despues.depuracion.activa).toBe(false);
      expect(despues.sitios.find((s: Sitio) => s.id === 'api').capturaDumps).toBeUndefined();
      // Guardar el sitio no la cambia.
      await n.capturaDumpsSitio('api', true, true);
      const actual = (await n.sitios.listar()).find((s) => s.id === 'api')!;
      const datos: Omit<Sitio, 'id'> & { id?: string } = { ...actual, capturaDumps: false };
      delete datos.id;
      await n.guardarSitio({ ...datos, nota: 'x' }, 'api');
      expect((await n.sitios.listar()).find((s) => s.id === 'api')?.capturaDumps).toBe(true);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });

  it('copiar devuelve el texto enmascarado; un id que no existe da error con código', async () => {
    const base = await carpetaTemporal('pel-dumps-nucleo-');
    const n = await crearNucleo(base, {
      depuracion: { activa: true, puerto: await puertoLibre() },
    });
    try {
      expect(n.estadoDepuracion().activo).toBe(true);
      const { puerto, token } = await tokenDe(base);
      await enviar(puerto, dump({ texto: 'API_KEY=abc123secreto' }), {
        Authorization: `Bearer ${token}`,
      });
      const [d] = n.listaDumps();
      expect(n.leerDump(d!.id)?.texto).toBe('API_KEY=abc123secreto');
      expect(n.textoDumpParaCopiar(d!.id)).not.toContain('abc123secreto');
      expect(() => n.textoDumpParaCopiar('nada')).toThrow(
        expect.objectContaining({ codigo: 'depuracion.argumento_invalido' }),
      );
      n.limpiarDumps();
      expect(n.listaDumps()).toHaveLength(0);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });
});
