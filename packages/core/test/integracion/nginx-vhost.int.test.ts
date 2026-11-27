/**
 * Prueba real del editor de vhost con un Nginx de verdad (Windows): una regla rota no tumba el
 * Nginx en marcha. El Nginx sale de `PEL_NGINX_DIR` (carpeta con nginx.exe) o del zip de nginx.org
 * que dejó la prueba de la Etapa A en la caché de descargas; sin ninguno de los dos, se salta.
 * Todo vive en una carpeta temporal y escucha en un puerto libre.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Almacen } from '../../src/almacen';
import { extraerZip } from '../../src/catalogo/zip';
import { Eventos, type EventosNucleo } from '../../src/eventos';
import { EditorVhost } from '../../src/nginx/editor';
import type { Plataforma } from '../../src/plataforma/tipos';
import { ejecutorPorDefecto, PlataformaWindows } from '../../src/plataforma/win';
import { puertoResponde } from '../../src/procesos/sonda';
import { Supervisor } from '../../src/procesos/supervisor';
import { Rutas } from '../../src/rutas';
import { ServicioNginx } from '../../src/servicios/nginx';
import { GestorSitios } from '../../src/sitios/sitios';
import { CARPETA_CACHE, esperar, esWindows, limpiarBase } from './comun';

const VERSION = '1.30.6';

function zipNginx(): string | null {
  if (!existsSync(CARPETA_CACHE)) return null;
  const zip = readdirSync(CARPETA_CACHE).find((n) => /^nginx\.org_nginx-[\d.]+\.zip$/.test(n));
  return zip ? path.join(CARPETA_CACHE, zip) : null;
}

const hayNginx =
  esWindows &&
  ((!!process.env.PEL_NGINX_DIR && existsSync(path.join(process.env.PEL_NGINX_DIR, 'nginx.exe'))) ||
    zipNginx() !== null);

const puertoLibre = (): Promise<number> =>
  new Promise((ok, mal) => {
    const s = createServer();
    s.once('error', mal);
    s.listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port;
      s.close(() => ok(p));
    });
  });

const pedir = (
  puerto: number,
  host: string,
  ruta = '/',
): Promise<{ estado: number; cuerpo: string; cabeceras: Record<string, unknown> }> =>
  new Promise((ok, mal) => {
    const r = request(
      { host: '127.0.0.1', port: puerto, path: ruta, headers: { Host: host }, timeout: 5000 },
      (res) => {
        let cuerpo = '';
        res.on('data', (c: Buffer) => (cuerpo += c.toString('utf8')));
        res.on('end', () => ok({ estado: res.statusCode ?? 0, cuerpo, cabeceras: res.headers }));
      },
    );
    r.on('error', mal);
    r.on('timeout', () => r.destroy(new Error('tiempo agotado')));
    r.end();
  });

describe.skipIf(!hayNginx)('Editor de vhost con un Nginx real (Windows)', () => {
  const log = (...a: unknown[]): void => console.log('[nginx-vhost]', ...a);
  const base = path.join(os.tmpdir(), `pel-vhost-real-${Date.now()}`);
  const rutas = new Rutas(base);
  const carpeta = path.join(base, 'proyecto');
  let puerto: number;
  let supervisor: Supervisor;
  let nginx: ServicioNginx;
  let editor: EditorVhost;

  beforeAll(async () => {
    await rutas.asegurar();
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(path.join(carpeta, 'index.html'), 'hola desde el sitio');
    const destino = rutas.bin('nginx', VERSION);
    if (process.env.PEL_NGINX_DIR) {
      cpSync(process.env.PEL_NGINX_DIR, destino, { recursive: true });
    } else {
      const tmp = path.join(base, 'tmp', 'zip');
      await extraerZip(zipNginx()!, tmp);
      const dentro = readdirSync(tmp).find((n) => existsSync(path.join(tmp, n, 'nginx.exe')));
      cpSync(dentro ? path.join(tmp, dentro) : tmp, destino, { recursive: true });
    }
    puerto = await puertoLibre();
    const almacen = new Almacen(rutas);
    const cfg = await almacen.leer();
    cfg.servicios.nginx.puerto = puerto;
    cfg.https.puerto = await puertoLibre();
    await almacen.guardar(cfg);
    const real = new PlataformaWindows();
    const plataforma = {
      procesoVivo: (p: number) => real.procesoVivo(p),
      matarArbol: (p: number) => real.matarArbol(p),
      inicioProceso: (p: number) => real.inicioProceso(p),
      quienUsaPuerto: (p: number) => real.quienUsaPuerto(p),
      ejecutable: (n: 'nginx') => real.ejecutable(n),
    } as unknown as Plataforma;
    const instalador = {
      instalados: async (s: string) => (s === 'nginx' ? [VERSION] : []),
      instalado: async (s: string, v: string) => s === 'nginx' && v === VERSION,
    };
    supervisor = new Supervisor(rutas, plataforma, new Eventos<EventosNucleo>(), {
      lanzarOculto: null,
    });
    nginx = new ServicioNginx(
      rutas,
      plataforma,
      supervisor,
      instalador,
      () => almacen.leer(),
      async () => [],
      ejecutorPorDefecto,
    );
    const sitios = new GestorSitios({
      almacen,
      rutas,
      nginx,
      estadoNginx: () => supervisor.estado('nginx'),
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador,
      eventos: new Eventos<EventosNucleo>(),
    });
    await sitios.crear({
      nombre: 'real',
      dominio: 'real.test',
      alias: [],
      carpeta,
      tipo: 'estatico',
      php: null,
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      https: false,
      redirigirHttps: false,
      confiado: false,
      git: null,
      procesos: [],
      runtimes: {},
      nota: '',
    });
    const r = await sitios.aplicar();
    log('aplicar', r.nginx);
    await nginx.iniciar();
    await esperar(
      'nginx encendido',
      async () => (supervisor.estado('nginx') === 'encendido' ? true : null),
      30_000,
    );
    editor = new EditorVhost({
      rutas,
      almacen,
      enCola: (fn) => sitios.enCola(fn),
      vhostDe: (s, c) => sitios.vhostDe(s, c),
      probar: (id, contenido) => nginx.probarConVhost(id, contenido),
      estadoNginx: () => supervisor.estado('nginx'),
      recargar: () => nginx.recargar(),
      sano: () => puertoResponde(puerto),
    });
  }, 120_000);

  afterAll(async () => {
    try {
      await nginx?.detener();
      await supervisor?.cerrar();
    } finally {
      limpiarBase(base, log);
    }
  });

  it('una regla válida se aplica y recarga; una rota no tumba el Nginx en marcha', async () => {
    expect((await pedir(puerto, 'real.test')).cuerpo).toBe('hola desde el sitio');

    const bien = await editor.aplicar('real', { reglas: 'add_header X-Wolf "1" always;' });
    expect(bien).toMatchObject({ ok: true });
    const conRegla = await esperar(
      'la cabecera nueva',
      async () => {
        const r = await pedir(puerto, 'real.test');
        return r.cabeceras['x-wolf'] === '1' ? r : null;
      },
      10_000,
    );
    expect(conRegla.estado).toBe(200);
    const antes = readFileSync(rutas.vhost('real'), 'utf8');

    const rota = await editor.aplicar('real', { reglas: 'gzipp on;' });
    log('salida de nginx -t', rota);
    expect(rota).toEqual({ ok: false, salida: expect.stringContaining('gzipp') });
    // La salida nombra el vhost real, no la copia temporal.
    expect(rota.ok === false && rota.salida).not.toContain('nginx-prueba-');
    expect(readFileSync(rutas.vhost('real'), 'utf8')).toBe(antes);
    expect(supervisor.estado('nginx')).toBe('encendido');
    const sigue = await pedir(puerto, 'real.test');
    expect(sigue).toMatchObject({ estado: 200, cuerpo: 'hola desde el sitio' });
    expect(sigue.cabeceras['x-wolf']).toBe('1');
  });

  it('un rewrite o try_files con ".." sale de la raíz en Nginx: el editor los rechaza', async () => {
    // Fuera de la raíz del sitio (que es `carpeta`): no debe servirse nunca.
    writeFileSync(path.join(base, 'secreto.txt'), 'SECRETO');
    const vhost = readFileSync(rutas.vhost('real'), 'utf8').replace(
      'charset utf-8;',
      [
        'charset utf-8;',
        '    rewrite ^/escapa$ /../secreto.txt last;',
        '    rewrite ^/escapa2$ /$arg_f last;',
        '    location = /escapa3 { try_files /../secreto.txt =404; }',
        // ¿Qué URI queda tras el rewrite? (lo que llegaría a $fastcgi_script_name)
        '    location = /hola { return 200 "hola"; }',
        '    location = /ver { rewrite ^ /../x.php break; add_header X-Uri $uri always; }',
        '    location = /ver2 { rewrite ^ /$arg_f break; add_header X-Uri $uri always; }',
      ].join('\n'),
    );
    // Directo al archivo (sin el editor, que ya lo rechaza) para ver qué hace Nginx 1.30.
    writeFileSync(rutas.vhost('real'), vhost);
    await nginx.recargar();
    // Los trabajadores nuevos tardan un momento en tomar la configuración recargada.
    const control = await esperar(
      'la configuración recargada',
      async () => {
        const r = await pedir(puerto, 'real.test', '/hola');
        return r.estado === 200 ? r : null;
      },
      10_000,
      200,
    );
    log('control /hola →', control.estado, control.cuerpo);
    const r1 = await pedir(puerto, 'real.test', '/escapa');
    const r2 = await pedir(puerto, 'real.test', '/escapa2?f=../secreto.txt');
    const r3 = await pedir(puerto, 'real.test', '/escapa3');
    log('rewrite /../secreto.txt →', r1.estado, r1.cuerpo.slice(0, 40));
    log('rewrite /$arg_f (f=../secreto.txt) →', r2.estado, r2.cuerpo.slice(0, 40));
    log('try_files /../secreto.txt →', r3.estado, r3.cuerpo.slice(0, 40));
    const v1 = await pedir(puerto, 'real.test', '/ver');
    const v2 = await pedir(puerto, 'real.test', '/ver2?f=../x.php');
    log('$uri tras rewrite /../x.php →', v1.estado, v1.cabeceras['x-uri']);
    log('$uri tras rewrite /$arg_f (f=../x.php) →', v2.estado, v2.cabeceras['x-uri']);
    // Observado con Nginx 1.30.6 en Windows: los rewrite dan 403 solo porque el location de ocultos
    // (/\.) los atrapa, pero $uri queda '/../x.php' (llegaría así a $fastcgi_script_name) y
    // try_files /../secreto.txt SÍ sirve el archivo de fuera de la raíz. Por eso el editor rechaza
    // '..' y las variables de la petición en esas rutas internas:
    for (const linea of [
      'rewrite ^/escapa$ /../secreto.txt last;',
      'rewrite ^/escapa2$ /$arg_f last;',
      'location = /escapa3 { try_files /../secreto.txt =404; }',
    ]) {
      await expect(editor.aplicar('real', { reglas: linea })).rejects.toMatchObject({
        codigo: 'nginx.ruta_fuera',
      });
    }
  });
});
