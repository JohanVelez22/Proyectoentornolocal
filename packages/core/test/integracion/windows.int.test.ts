/**
 * Prueba real en Windows (`npm run test:win`): descarga Nginx, PHP 8.4 y cloudflared
 * oficiales en una carpeta temporal, levanta los servicios en el puerto 8089 y comprueba
 * los sitios con peticiones HTTP reales. No toca el archivo hosts del sistema ni pide UAC.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import { PlataformaWindows } from '../../src/plataforma/win';
import type { Plataforma } from '../../src/plataforma/tipos';
import type { EstadoGeneral } from '../../src/nucleo';
import type { Sitio } from '../../src/tipos';

const esWindows = process.platform === 'win32';
const PUERTO = 8089;

const base = path.join(os.tmpdir(), `pel-int-${randomBytes(4).toString('hex')}`);
const proyectos = path.join(base, 'proyectos');
const hostsCopia = path.join(base, 'hosts-copia');

let nucleo: Nucleo | null = null;
let estaticoId = '';
let laravelId = '';
let ci3Id = '';
let phpVersion = '';

const log = (...a: unknown[]): void => console.log('[int]', ...a);
const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Plataforma real, salvo el archivo hosts: va a una copia temporal y nunca pide UAC. */
function plataformaSegura(): Plataforma {
  const real = new PlataformaWindows();
  return {
    rutaHosts: () => hostsCopia,
    escribirComoAdmin: async (destino, contenido) => {
      if (destino !== hostsCopia) throw new Error(`Escritura inesperada en ${destino}`);
      writeFileSync(destino, contenido, 'utf8');
      return { ok: true };
    },
    quienUsaPuerto: (p) => real.quienUsaPuerto(p),
    duenosDePuertos: (ps) => real.duenosDePuertos(ps),
    // Nunca se toca el almacén de certificados real desde las pruebas.
    instalarCertificadoUsuario: async () => {
      throw new Error('La prueba no debe instalar certificados');
    },
    quitarCertificadoUsuario: async () => {
      throw new Error('La prueba no debe quitar certificados');
    },
    certificadoInstalado: async () => false,
    procesoVivo: (p) => real.procesoVivo(p),
    matarArbol: (p) => real.matarArbol(p),
    carpetaDocumentos: () => real.carpetaDocumentos(),
    abrirUrl: async () => undefined,
    ejecutable: (n) => real.ejecutable(n),
  };
}

function pedir(dominio: string, ruta: string): Promise<{ status: number; cuerpo: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PUERTO, path: ruta, headers: { Host: dominio }, timeout: 15_000 },
      (res) => {
        let cuerpo = '';
        res.setEncoding('utf8');
        res.on('data', (t: string) => (cuerpo += t));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, cuerpo }));
      },
    );
    req.on('timeout', () => req.destroy(new Error('tiempo agotado')));
    req.on('error', reject);
    req.end();
  });
}

/** Procesos cuyo ejecutable vive dentro de la carpeta temporal. */
function procesosDeBase(): { pid: number; nombre: string }[] {
  const filtro = base.replace(/'/g, "''");
  const salida = execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith('${filtro}', [StringComparison]::OrdinalIgnoreCase) } | ForEach-Object { "$($_.ProcessId)|$($_.Name)" }`,
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  return salida
    .split(/\r?\n/)
    .filter((l) => l.includes('|'))
    .map((l) => {
      const [pid, nombre] = l.trim().split('|');
      return { pid: Number(pid), nombre: nombre ?? '' };
    });
}

async function esperar<T>(
  desc: string,
  fn: () => Promise<T | null>,
  ms: number,
  cada = 500,
): Promise<T> {
  const limite = Date.now() + ms;
  let ultimo: unknown;
  for (;;) {
    try {
      const r = await fn();
      if (r !== null) return r;
    } catch (e) {
      ultimo = e;
    }
    if (Date.now() >= limite) {
      throw new Error(`Tiempo agotado esperando ${desc}${ultimo ? `: ${String(ultimo)}` : ''}`);
    }
    await dormir(cada);
  }
}

const datosSitio = (extra: Partial<Omit<Sitio, 'id'>>): Omit<Sitio, 'id'> => ({
  nombre: 'Prueba',
  dominio: 'prueba.test',
  alias: [],
  carpeta: proyectos,
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
  ...extra,
});

describe.skipIf(!esWindows)('integración real en Windows', () => {
  beforeAll(async () => {
    mkdirSync(proyectos, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n::1 localhost\r\n');
    log('base temporal:', base);
    nucleo = await Nucleo.crear({ base, plataforma: plataformaSegura() });
    const cfg = await nucleo.config.leer();
    await nucleo.guardarAjustes({
      puerto: PUERTO,
      trabajadores: cfg.servicios.php.trabajadores,
    });
  });

  afterAll(async () => {
    // Red de seguridad: si una prueba falló a medias, no se dejan procesos ni archivos.
    if (nucleo) {
      await nucleo.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
      nucleo = null;
    }
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') {
      for (const p of procesosDeBase()) {
        log('matando proceso residual', p);
        try {
          execFileSync('taskkill', ['/PID', String(p.pid), '/T', '/F'], { windowsHide: true });
        } catch {
          // ya terminó
        }
      }
      rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    }
  });

  it('instala Nginx, PHP 8.4 y cloudflared desde las fuentes oficiales', async () => {
    const n = nucleo!;
    const nginx = (await n.listarVersiones('nginx'))[0]!;
    const php = (await n.listarVersiones('php')).find((v) => v.rama === '8.4');
    const cf = (await n.listarVersiones('cloudflared'))[0]!;
    expect(php, 'releases.json no trae PHP 8.4').toBeDefined();
    phpVersion = php!.version;
    for (const v of [nginx, php!, cf]) {
      const t0 = Date.now();
      await n.instalador.instalar(v);
      log(`instalado ${v.servicio} ${v.version} en ${Date.now() - t0} ms (${v.url})`);
    }
    expect(await n.instalador.instalados('nginx')).toEqual([nginx.version]);
    expect(await n.instalador.instalados('php')).toEqual(['8.4']);
    expect(await n.instalador.instalados('cloudflared')).toEqual([cf.version]);
  });

  it('crea un sitio estático, uno laravel (ruta con espacio y Ñ) y uno CodeIgniter 3', async () => {
    const n = nucleo!;
    const dirEstatico = path.join(proyectos, 'estatico');
    mkdirSync(dirEstatico, { recursive: true });
    writeFileSync(path.join(dirEstatico, 'index.html'), 'hola-estatico');

    const dirLaravel = path.join(proyectos, 'Sitio Prueba Ñ');
    mkdirSync(path.join(dirLaravel, 'public'), { recursive: true });
    writeFileSync(path.join(dirLaravel, 'artisan'), '<?php\n');
    writeFileSync(path.join(dirLaravel, '.env'), 'APP_NAME=Prueba\nAPP_URL=http://laravel.test\n');
    writeFileSync(path.join(dirLaravel, 'public', '.env'), 'SECRETO=1\n');
    writeFileSync(path.join(dirLaravel, 'public', 'foo.PHP'), '<?php echo "no-debe-ejecutarse";');
    writeFileSync(
      path.join(dirLaravel, 'public', 'index.php'),
      '<?php echo "hola-php-" . PHP_VERSION;',
    );

    const dirCi3 = path.join(proyectos, 'ci3 app');
    mkdirSync(path.join(dirCi3, 'application', 'config'), { recursive: true });
    mkdirSync(path.join(dirCi3, 'system', 'core'), { recursive: true });
    writeFileSync(path.join(dirCi3, 'application', 'config', 'x.php'), '<?php echo "secreto";');
    writeFileSync(path.join(dirCi3, 'system', 'core', 'CodeIgniter.php'), '<?php\n');
    writeFileSync(path.join(dirCi3, 'index.php'), '<?php echo "hola-ci3";');

    expect((await n.detectarProyecto(dirLaravel)).tipo).toBe('laravel');
    expect((await n.detectarProyecto(dirCi3)).tipo).toBe('codeigniter3');

    const e = await n.guardarSitio(
      datosSitio({ nombre: 'Estático', dominio: 'estatico.test', carpeta: dirEstatico }),
    );
    log('estatico aplicar:', JSON.stringify(e.aplicar));
    const l = await n.guardarSitio(
      datosSitio({
        nombre: 'Laravel Ñ',
        dominio: 'laravel.test',
        carpeta: dirLaravel,
        tipo: 'laravel',
        php: '8.4',
        urlBaseVar: 'APP_URL',
      }),
    );
    log('laravel aplicar:', JSON.stringify(l.aplicar));
    const c = await n.guardarSitio(
      datosSitio({
        nombre: 'CI3',
        dominio: 'ci3.test',
        carpeta: dirCi3,
        tipo: 'codeigniter3',
        php: '8.4',
      }),
    );
    log('ci3 aplicar:', JSON.stringify(c.aplicar));
    for (const r of [e, l, c]) {
      expect(r.aplicar.nginx.ok, r.aplicar.nginx.salida).toBe(true);
      expect(r.aplicar.hosts.ok).toBe(true);
    }
    estaticoId = e.sitio.id;
    laravelId = l.sitio.id;
    ci3Id = c.sitio.id;
    const g = await n.estadoGeneral();
    expect(g.hosts.pendientes).toEqual([]);
  });

  it('inicia todo y Nginx y PHP 8.4 quedan encendidos', async () => {
    const n = nucleo!;
    await n.servicios.iniciarTodo();
    const g = await esperar<EstadoGeneral>(
      'nginx y php-8.4 encendidos',
      async () => {
        const g = await n.estadoGeneral();
        const ok = ['nginx', 'php-8.4'].every(
          (id) => g.servicios.find((s) => s.id === id)?.estado === 'encendido',
        );
        return ok ? g : null;
      },
      45_000,
    );
    for (const s of g.servicios) log('servicio', s.id, s.estado, s.puertos.join(','), s.pid ?? '');
  });

  it('sirve los sitios por Host y aplica las reglas de seguridad', async () => {
    const est = await pedir('estatico.test', '/');
    log('GET estatico.test/ →', est.status, est.cuerpo);
    expect(est).toEqual({ status: 200, cuerpo: 'hola-estatico' });

    const lar = await pedir('laravel.test', '/');
    log('GET laravel.test/ →', lar.status, lar.cuerpo);
    expect(lar.status).toBe(200);
    expect(lar.cuerpo).toBe(`hola-php-${phpVersion.replace(/-\d+$/, '')}`);

    const ruta = await pedir('laravel.test', '/alguna/ruta?x=1');
    log('GET laravel.test/alguna/ruta →', ruta.status, ruta.cuerpo);
    expect(ruta.status).toBe(200);
    expect(ruta.cuerpo).toMatch(/^hola-php-8\.4\./);

    const env = await pedir('laravel.test', '/.env');
    log('GET laravel.test/.env →', env.status);
    expect([403, 404]).toContain(env.status);
    expect(env.cuerpo).not.toContain('SECRETO');

    const mayus = await pedir('laravel.test', '/foo.PHP');
    log('GET laravel.test/foo.PHP →', mayus.status);
    expect(mayus.status).toBe(404);
    expect(mayus.cuerpo).not.toContain('no-debe-ejecutarse');

    for (const r of ['/application/config/x.php', '/APPLICATION/config/x.php']) {
      const res = await pedir('ci3.test', r);
      log(`GET ci3.test${r} →`, res.status);
      expect(res.status).toBe(403);
      expect(res.cuerpo).not.toContain('secreto');
    }
    const sys = await pedir('ci3.test', '/system/core/CodeIgniter.php');
    log('GET ci3.test/system/core/CodeIgniter.php →', sys.status);
    expect(sys.status).toBe(403);
    const idx = await pedir('ci3.test', '/index.php');
    log('GET ci3.test/index.php →', idx.status, idx.cuerpo);
    expect(idx).toEqual({ status: 200, cuerpo: 'hola-ci3' });
    const raiz = await pedir('ci3.test', '/bienvenida');
    log('GET ci3.test/bienvenida →', raiz.status, raiz.cuerpo);
    expect(raiz).toEqual({ status: 200, cuerpo: 'hola-ci3' });

    const desconocido = await pedir('otro.test', '/');
    log('GET otro.test/ →', desconocido.status);
  });

  it('abre un túnel rápido de Cloudflare hacia el sitio laravel', async (ctx) => {
    const n = nucleo!;
    const t = await n.tuneles.abrir(laravelId);
    log('túnel:', JSON.stringify(t));
    if (t.estado !== 'activo' || !t.url) {
      const motivo = `OMITIDO: Cloudflare no entregó una URL (${t.mensaje ?? t.estado})`;
      log(motivo);
      ctx.skip(motivo);
      return;
    }
    expect(t.url).toMatch(/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/);
    const { readFileSync } = await import('node:fs');
    const env = readFileSync(path.join(proyectos, 'Sitio Prueba Ñ', '.env'), 'utf8');
    log('.env con túnel:', JSON.stringify(env));
    expect(env).toContain(`APP_URL=${t.url}/`);

    let cuerpo = '';
    try {
      cuerpo = await esperar(
        'respuesta del túnel',
        async () => {
          const r = await fetch(t.url!, { signal: AbortSignal.timeout(15_000) });
          const texto = await r.text();
          return r.status === 200 && texto.startsWith('hola-php-') ? texto : null;
        },
        120_000,
        3000,
      );
    } catch (e) {
      const motivo = `OMITIDO: la URL pública no respondió (${String(e)})`;
      log(motivo);
      ctx.skip(motivo);
      return;
    }
    log('GET', t.url, '→', cuerpo);
    expect(cuerpo).toMatch(/^hola-php-8\.4\./);

    await n.tuneles.cerrar(laravelId);
    const envDespues = readFileSync(path.join(proyectos, 'Sitio Prueba Ñ', '.env'), 'utf8');
    expect(envDespues).toBe('APP_NAME=Prueba\nAPP_URL=http://laravel.test\n');
    expect(n.tuneles.estados().find((x) => x.sitioId === laravelId)).toBeUndefined();
  });

  it('apaga todo sin dejar procesos de la carpeta temporal', async () => {
    const n = nucleo!;
    log('procesos antes de apagar:', JSON.stringify(procesosDeBase()));
    await n.tuneles.cerrar(laravelId).catch(() => undefined);
    await n.servicios.detenerTodo();
    await n.cerrar({ detenerServicios: false });
    nucleo = null;
    const restantes = await esperar(
      'que terminen los procesos',
      async () => {
        const p = procesosDeBase();
        return p.length === 0 ? p : null;
      },
      15_000,
    );
    log('procesos después de apagar:', JSON.stringify(restantes));
    expect(restantes).toEqual([]);
    void estaticoId;
    void ci3Id;
  });
});
