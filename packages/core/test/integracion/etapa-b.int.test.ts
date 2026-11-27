/**
 * Prueba real de la Etapa B en Windows (`npm run test:win`): en una carpeta temporal y con puertos
 * altos instala Node LTS y Python 3.12 desde el catálogo (con su huella), clona laravel/laravel y
 * corre su receta completa (Composer, .env, clave, MySQL, migrate, storage, npm ci y build, sitio
 * HTTPS), monta un FastAPI mínimo (venv, pip, proceso supervisado y proxy), trae cambios de un
 * repositorio local, consulta el MCP y una muestra de métricas, y al final comprueba que no quedan
 * ventanas visibles ni procesos de la carpeta temporal.
 *
 * Nunca toca el archivo hosts, el almacén de certificados, el PATH del usuario ni la carpeta de
 * datos real: la CA temporal solo se usa en el agente HTTPS de la propia prueba. Las cachés de
 * Composer, npm y pip van a la carpeta de caché de las pruebas, no a las del usuario.
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import { PlataformaWindows } from '../../src/plataforma/win';
import type { IdServicio } from '../../src/servicios/servicios';
import type { Sitio } from '../../src/tipos';
import {
  CARPETA_CACHE,
  esWindows,
  esperar,
  fetchConCache,
  limpiarBase,
  plataformaSegura,
  procesosDeBase,
  ventanasDeBase,
} from './comun';

const PUERTOS = { nginx: 18189, https: 18543, mysql: 13406, mcp: 17790 } as const;
/** Fijo en el programa: los PHP-CGI de los sitios escuchan en 9000–9999. */
const RAMA_PHP = '8.4';
const REPO_LARAVEL = 'https://github.com/laravel/laravel.git';

const base = path.join(os.tmpdir(), `pel-etapa-b-${randomBytes(4).toString('hex')}`);
const proyectos = path.join(base, 'proyectos');
const documentos = path.join(base, 'Documentos');
const hostsCopia = path.join(base, 'hosts-copia');
const repos = path.join(base, 'repos');

const MIN = 60_000;
const log = (...a: unknown[]): void => console.log('[etapa-b]', ...a);
const t0 = Date.now();
const reloj = (): string => `${Math.round((Date.now() - t0) / 1000)} s`;
const tiempos: string[] = [];
async function medir<T>(nombre: string, fn: () => Promise<T>): Promise<T> {
  const t = Date.now();
  try {
    return await fn();
  } finally {
    const s = ((Date.now() - t) / 1000).toFixed(1);
    tiempos.push(`${nombre}: ${s} s`);
    log(`${nombre} en ${s} s`);
  }
}

let nucleo: Nucleo | null = null;
const n = (): Nucleo => {
  if (!nucleo) throw new Error('El núcleo no está creado');
  return nucleo;
};
let sitioLaravel: Sitio | null = null;
let sitioFastapi: Sitio | null = null;

/** Variables que esta prueba cambia en su propio proceso (se restauran al final). */
const ENV_PRUEBA: Record<string, string> = {
  COMPOSER_HOME: path.join(CARPETA_CACHE, 'composer-home'),
  COMPOSER_CACHE_DIR: path.join(CARPETA_CACHE, 'composer-cache'),
  COMPOSER_NO_INTERACTION: '1',
  npm_config_cache: path.join(CARPETA_CACHE, 'npm-cache'),
  npm_config_update_notifier: 'false',
  npm_config_fund: 'false',
  npm_config_audit: 'false',
  PIP_CACHE_DIR: path.join(CARPETA_CACHE, 'pip-cache'),
  PIP_DISABLE_PIP_VERSION_CHECK: '1',
};
const envPrevio: Record<string, string | undefined> = {};

interface Respuesta {
  status: number;
  cuerpo: string;
}

/** GET https://<dominio>:<puerto https>/ contra 127.0.0.1, confiando solo en la CA temporal. */
function pedirHttps(dominio: string, ruta: string, ca: string): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: '127.0.0.1',
        port: PUERTOS.https,
        path: ruta,
        servername: dominio,
        headers: { Host: dominio, Accept: 'text/html,application/json' },
        agent: new https.Agent({ ca, keepAlive: false }),
        timeout: 30_000,
      },
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

/** git real (oculto, sin la configuración global del usuario para la identidad). */
function git(args: string[], cwd: string): string {
  try {
    return execFileSync(
      'git',
      ['-c', 'user.name=Prueba WolfCore', '-c', 'user.email=prueba@wolfcore.test', ...args],
      {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      },
    );
  } catch (e) {
    const x = e as { stdout?: string; stderr?: string };
    throw new Error(`git ${args.join(' ')} falló:\n${x.stdout ?? ''}\n${x.stderr ?? ''}`);
  }
}

/** Procesos cuyo ejecutable o línea de comandos menciona `base` (sin contar este proceso). */
function procesosQueMencionan(dir: string): string[] {
  const filtro = dir.replace(/'/g, "''");
  const salida = execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne ${process.pid} -and (($_.ExecutablePath -and $_.ExecutablePath.StartsWith('${filtro}', [StringComparison]::OrdinalIgnoreCase)) -or ($_.CommandLine -and $_.CommandLine.IndexOf('${filtro}', [StringComparison]::OrdinalIgnoreCase) -ge 0)) } | ForEach-Object { "$($_.ProcessId)|$($_.Name)|$($_.CommandLine)" }`,
    ],
    { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return (
    salida
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.includes('|'))
      // La propia consulta de PowerShell lleva la ruta en su línea de comandos.
      .filter((l) => !/Get-CimInstance Win32_Process/.test(l))
  );
}

async function esperarServicio(id: IdServicio, ms = 60_000): Promise<void> {
  await esperar(
    `${id} encendido`,
    async () => {
      const e = (await n().estadoGeneral()).servicios.find((s) => s.id === id);
      if (e?.estado === 'error') throw new Error(`${id} en error: ${e.mensaje ?? ''}`);
      return e?.estado === 'encendido' ? e : null;
    },
    ms,
  );
}

/** Enciende PHP y Nginx si no lo están (cada prueba puede correr sin la anterior). */
async function asegurarNginx(): Promise<void> {
  const x = n();
  const estados = (await x.estadoGeneral()).servicios;
  if (estados.find((s) => s.id === 'nginx')?.estado === 'encendido') return;
  await medir('iniciar PHP y Nginx', async () => {
    await x.servicios.iniciar(`php-${RAMA_PHP}`);
    await x.servicios.iniciar('nginx');
    await esperarServicio('nginx', 30_000);
  });
}

/** Monta un proyecto como el asistente: receta propuesta → sitio con "Confío…" → receta. */
async function montar(carpeta: string): Promise<Sitio> {
  const x = n();
  const { receta: propuesta, origen, deteccion } = await x.recetaPropuesta(carpeta);
  // Como el asistente (elegirPhp + aplicarDeteccion): si la rama pedida no está instalada se
  // usa la más nueva instalada, y el paso sitio-crear lleva esa rama.
  const instaladas = await x.instalador.instalados('php');
  const usaPhp = deteccion.php !== null || deteccion.tipo === 'laravel';
  const php = !usaPhp
    ? null
    : deteccion.php && instaladas.includes(deteccion.php)
      ? deteccion.php
      : ([...instaladas].sort((a, b) => b.localeCompare(a, 'es', { numeric: true }))[0] ?? null);
  if (usaPhp && php !== deteccion.php) {
    log(
      `${path.basename(carpeta)} pide PHP ${deteccion.php ?? '-'}; se usa ${php ?? '-'}, como el asistente`,
    );
  }
  const receta = propuesta.map((p) =>
    p.tipo === 'sitio-crear' ? { ...p, args: { ...p.args, php } } : p,
  );
  log(
    `${path.basename(carpeta)}: tipo ${deteccion.tipo}, servicios ${deteccion.servicios.join(',') || '-'}, receta (${origen}):`,
    receta.map((p) => p.tipo).join(' → '),
  );
  const { sitio } = await x.crearSitioProyecto(
    {
      nombre: path.basename(carpeta),
      dominio: deteccion.dominioSugerido,
      alias: [],
      carpeta,
      tipo: deteccion.tipo,
      php,
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: deteccion.urlBaseVar,
      datosReales: false,
      https: true,
      redirigirHttps: false,
      confiado: true,
      git: null,
      procesos: [],
      runtimes: {},
      nota: '',
    },
    receta,
  );
  const tiemposPaso: string[] = [];
  let inicioPaso = Date.now();
  const quitar = x.eventos.on('receta:progreso', (p) => {
    if (p.sitioId !== sitio.id || p.suelta) return;
    if (p.estado === 'listo' || p.estado === 'error' || p.estado === 'omitido') {
      tiemposPaso.push(
        `${p.pasoId} ${p.estado} ${((Date.now() - inicioPaso) / 1000).toFixed(1)} s`,
      );
      inicioPaso = Date.now();
    }
  });
  let r;
  try {
    r = await x.ejecutarReceta(sitio.id, { receta });
  } finally {
    quitar();
  }
  log(`${path.basename(carpeta)}: pasos →`, tiemposPaso.join(' | ') || '(sin eventos)');
  const estado = x.estadoReceta(sitio.id);
  if (r.estado !== 'lista') {
    const fallo = estado.pasos.find((p) => p.estado === 'error');
    log(
      `receta de ${path.basename(carpeta)} terminó en ${r.estado}:`,
      r.mensaje,
      '\n',
      (fallo?.log ?? []).slice(-40).join('\n'),
    );
  }
  expect(r).toMatchObject({ estado: 'lista' });
  for (const p of estado.pasos) expect([p.id, p.estado]).toEqual([p.id, 'listo']);
  return (await x.sitios.listar()).find((s) => s.id === sitio.id)!;
}

describe.skipIf(!esWindows)('Etapa B: integración real en Windows', () => {
  beforeAll(async () => {
    for (const [k, v] of Object.entries(ENV_PRUEBA)) {
      envPrevio[k] = process.env[k];
      process.env[k] = v;
      mkdirSync(v, { recursive: true });
    }
    for (const d of [proyectos, documentos, repos]) mkdirSync(d, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n');
    log('base temporal:', base);
    nucleo = await Nucleo.crear({
      barrerHuerfanos: false,
      base,
      plataforma: plataformaSegura(hostsCopia, documentos),
      fetch: fetchConCache(log),
    });
    const x = n();
    await x.guardarAjustes({ puerto: PUERTOS.nginx, trabajadores: 1 });
    await x.cambiarPuertoHttps(PUERTOS.https);
    await x.cambiarPuertoServicio('mysql', PUERTOS.mysql);
    await x.cambiarPuertoMcp(PUERTOS.mcp);
    const ocupados = await new PlataformaWindows().duenosDePuertos(Object.values(PUERTOS));
    log('puertos ocupados antes de empezar:', JSON.stringify([...ocupados]));
    expect([...ocupados.keys()]).toEqual([]);
  }, 5 * MIN);

  afterAll(async () => {
    if (nucleo) {
      await nucleo.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
      nucleo = null;
    }
    log('tiempos:\n' + tiempos.join('\n'));
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') limpiarBase(base, log);
    for (const [k, v] of Object.entries(envPrevio)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }, 5 * MIN);

  it(
    '1. instala Node LTS, Python 3.12, PHP, Nginx, MySQL y Composer desde el catálogo',
    async () => {
      const x = n();
      const node = (await x.listarVersiones('node')).find((v) => v.version.startsWith('24.'));
      const python = (await x.listarVersiones('python')).find((v) => v.version.startsWith('3.12.'));
      const php = (await x.listarVersiones('php')).find((v) => v.rama === RAMA_PHP);
      expect(node, 'el catálogo no trae Node 24 (LTS)').toBeDefined();
      expect(python, 'el catálogo no trae Python 3.12').toBeDefined();
      expect(php, `releases.json no trae PHP ${RAMA_PHP}`).toBeDefined();
      const nginx = (await x.listarVersiones('nginx'))[0]!;
      const mysql = (await x.listarVersiones('mysql'))[0]!;
      for (const v of [node!, python!, php!, nginx, mysql]) {
        await medir(`instalar ${v.servicio} ${v.version}`, () => x.instalador.instalar(v));
      }
      await medir('instalar Composer', () => x.instalarComposer());
      expect(await x.runtimesInstalados('node')).toEqual([node!.version]);
      expect(await x.runtimesInstalados('python')).toEqual([python!.version]);
      const nodeExe = path.join(x.runtimes.rutaBin('node', node!.version), 'node.exe');
      const pyExe = path.join(x.runtimes.rutaBin('python', python!.version), 'python.exe');
      const vNode = execFileSync(nodeExe, ['--version'], { encoding: 'utf8', windowsHide: true });
      const vPy = execFileSync(pyExe, ['--version'], { encoding: 'utf8', windowsHide: true });
      log('node --version →', vNode.trim(), '| python --version →', vPy.trim());
      expect(vNode.trim()).toBe(`v${node!.version}`);
      expect(vPy.trim()).toBe(`Python ${python!.version}`);
      log('reloj', reloj());
    },
    60 * MIN,
  );

  it(
    '2. clona laravel/laravel y su receta completa deja el sitio HTTPS respondiendo 200',
    async () => {
      const x = n();
      const carpeta = path.join(proyectos, 'laravel');
      await medir('clonar laravel/laravel', () => x.clonarRepo(REPO_LARAVEL, carpeta));
      expect(existsSync(path.join(carpeta, 'artisan'))).toBe(true);
      // El esqueleto trae SQLite por defecto: se pide MySQL como haría un proyecto real.
      const ejemplo = path.join(carpeta, '.env.example');
      const texto = readFileSync(ejemplo, 'utf8');
      expect(texto).toMatch(/^DB_CONNECTION=sqlite$/m);
      writeFileSync(ejemplo, texto.replace(/^DB_CONNECTION=sqlite$/m, 'DB_CONNECTION=mysql'));

      await medir('iniciar MySQL', async () => {
        await x.servicios.iniciar('mysql');
        await esperarServicio('mysql');
      });
      sitioLaravel = await medir('receta de Laravel', () => montar(carpeta));
      expect(sitioLaravel.https).toBe(true);

      const env = readFileSync(path.join(carpeta, '.env'), 'utf8');
      expect(env).toMatch(/^APP_KEY=base64:/m);
      expect(env).toMatch(/^DB_CONNECTION=mysql$/m);
      expect(env).toContain(`DB_PORT=${PUERTOS.mysql}`);
      expect(existsSync(path.join(carpeta, 'vendor', 'autoload.php'))).toBe(true);
      expect(existsSync(path.join(carpeta, 'public', 'build', 'manifest.json'))).toBe(true);
      expect(existsSync(path.join(carpeta, 'public', 'storage'))).toBe(true);
      const base = /^DB_DATABASE=(.+)$/m.exec(env)?.[1]?.trim().replace(/^"|"$/g, '');
      const tablas = (await x.listarBases('mysql')).find((b) => b.nombre === base);
      log('base de Laravel:', base, JSON.stringify(tablas));
      expect(tablas).toBeDefined();
      expect(await x.tieneTablas('mysql', base!)).toBe(true);

      await asegurarNginx();
      const ca = readFileSync(x.rutas.caCrt(), 'utf8');
      const r = await medir('primer GET https de Laravel', () =>
        esperar(
          'Laravel por HTTPS',
          async () => {
            const res = await pedirHttps(sitioLaravel!.dominio, '/', ca);
            return res.status === 200 ? res : null;
          },
          60_000,
          1000,
        ),
      );
      log(
        `GET https://${sitioLaravel.dominio}:${PUERTOS.https}/ →`,
        r.status,
        r.cuerpo.length,
        'bytes',
      );
      expect(r.status).toBe(200);
      // APP_NAME lo escribe el paso env-crear con el nombre del sitio.
      expect(r.cuerpo).toContain(`<title>${sitioLaravel.nombre}</title>`);
      expect(r.cuerpo).toMatch(/\/build\/assets\//);
      log('reloj', reloj());
    },
    60 * MIN,
  );

  it(
    '3. FastAPI mínimo: venv, pip, proceso supervisado y sitio proxy que responde 200',
    async () => {
      const x = n();
      const carpeta = path.join(proyectos, 'api-rapida');
      mkdirSync(carpeta, { recursive: true });
      writeFileSync(path.join(carpeta, 'requirements.txt'), 'fastapi\nuvicorn\n');
      writeFileSync(
        path.join(carpeta, 'main.py'),
        [
          'from fastapi import FastAPI',
          '',
          'app = FastAPI()',
          '',
          '',
          '@app.get("/")',
          'def raiz():',
          '    return {"hola": "wolfcore"}',
          '',
        ].join('\n'),
      );
      sitioFastapi = await medir('receta de FastAPI', () => montar(carpeta));
      const proc = sitioFastapi.procesos.find((p) => p.id === 'uvicorn');
      log('proceso uvicorn:', JSON.stringify(proc), 'puertoProxy', sitioFastapi.puertoProxy);
      expect(proc?.puerto).toBeTypeOf('number');
      expect(proc!.comando).toContain('main:app');
      expect(sitioFastapi.puertoProxy).toBe(proc!.puerto);

      await medir('iniciar uvicorn', async () => {
        await x.iniciarProceso(sitioFastapi!.id, 'uvicorn');
        await esperar(
          'uvicorn encendido',
          async () => {
            const e = (await x.estadosProcesos(sitioFastapi!.id)).find(
              (p) => p.procesoId === 'uvicorn',
            );
            if (e?.estado === 'error') throw new Error(`uvicorn en error: ${e.mensaje ?? ''}`);
            return e?.estado === 'encendido' ? e : null;
          },
          60_000,
        );
      });
      await asegurarNginx();
      const ca = readFileSync(x.rutas.caCrt(), 'utf8');
      const r = await esperar(
        'FastAPI por el proxy',
        async () => {
          const res = await pedirHttps(sitioFastapi!.dominio, '/', ca);
          return res.status === 200 ? res : null;
        },
        60_000,
        1000,
      );
      log(`GET https://${sitioFastapi.dominio}:${PUERTOS.https}/ →`, r.status, r.cuerpo);
      expect(JSON.parse(r.cuerpo)).toEqual({ hola: 'wolfcore' });
      log('reloj', reloj());
    },
    30 * MIN,
  );

  it(
    '4. traerCambios sobre un repositorio local con un commit nuevo detecta composer.lock',
    async () => {
      const x = n();
      const origen = path.join(repos, 'origen.git');
      const trabajo = path.join(repos, 'trabajo');
      const local = path.join(proyectos, 'clon-local');
      git(['init', '--bare', '-b', 'main', origen], repos);
      git(['clone', origen, trabajo], repos);
      writeFileSync(path.join(trabajo, 'index.html'), 'hola');
      git(['add', '.'], trabajo);
      git(['commit', '-m', 'inicio'], trabajo);
      git(['push', 'origin', 'HEAD:main'], trabajo);
      git(['clone', origen, local], repos);
      const { sitio } = await x.guardarSitio({
        nombre: 'Clon local',
        dominio: 'clon-local.test',
        alias: [],
        carpeta: local,
        tipo: 'estatico',
        php: null,
        puertoProxy: null,
        reglasExtra: '',
        urlBaseVar: null,
        datosReales: false,
        https: false,
        redirigirHttps: false,
        confiado: false,
        git: { remoto: origen, rama: 'main' },
        procesos: [],
        runtimes: {},
        nota: '',
      });
      // Nada nuevo todavía.
      const sinCambios = await x.traerCambios(sitio.id);
      log('traerCambios sin commits nuevos →', JSON.stringify(sinCambios));
      expect(sinCambios.actualizado).toBe(false);

      writeFileSync(path.join(trabajo, 'composer.lock'), '{"packages":[]}\n');
      git(['add', '.'], trabajo);
      git(['commit', '-m', 'agrega composer.lock'], trabajo);
      git(['push', 'origin', 'HEAD:main'], trabajo);
      const r = await medir('traerCambios', () => x.traerCambios(sitio.id));
      log('traerCambios →', JSON.stringify(r));
      expect(r.actualizado).toBe(true);
      expect(r.cambios.composerLock).toBe(true);
      expect(r.cambios.packageLock).toBe(false);
      expect(existsSync(path.join(local, 'composer.lock'))).toBe(true);
    },
    5 * MIN,
  );

  it(
    '5. MCP: lista las herramientas y responde estado_general con el token',
    async () => {
      const x = n();
      const estado = await x.iniciarMcp();
      log('MCP:', JSON.stringify(estado));
      expect(estado).toMatchObject({ activo: true, puerto: PUERTOS.mcp });
      const conf = JSON.parse(await x.configuracionMcp()) as {
        mcpJson: { mcpServers: { wolfcore: { url: string; headers: Record<string, string> } } };
      };
      const { url, headers } = conf.mcpJson.mcpServers.wolfcore;
      expect(url).toBe(`http://127.0.0.1:${PUERTOS.mcp}/mcp`);

      // Sin token se rechaza.
      const sinToken = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      });
      log('MCP sin token →', sinToken.status);
      expect(sinToken.status).toBe(401);

      const cliente = new Client({ name: 'prueba-etapa-b', version: '1.0.0' });
      const transporte = new StreamableHTTPClientTransport(new URL(url), {
        requestInit: { headers },
      });
      await cliente.connect(transporte);
      try {
        const { tools } = await cliente.listTools();
        const nombres = tools.map((t) => t.name).sort();
        log('herramientas MCP:', nombres.join(', '));
        expect(nombres).toEqual(
          expect.arrayContaining(['estado_general', 'ejecutar_receta', 'traer_cambios']),
        );
        const r = (await cliente.callTool({ name: 'estado_general', arguments: {} })) as {
          content: { type: string; text: string }[];
          isError?: boolean;
        };
        expect(r.isError).not.toBe(true);
        const texto = r.content.map((c) => c.text).join('');
        log('estado_general →', texto.slice(0, 400), '…');
        expect(texto).toContain('nginx');
        expect(texto).toContain(sitioLaravel!.dominio);
        expect(texto).toContain(sitioFastapi!.dominio);
      } finally {
        await cliente.close();
      }
      await x.detenerMcp();
      expect(x.estadoMcp().activo).toBe(false);
    },
    5 * MIN,
  );

  it(
    '6. métricas: una muestra trae los PIDs de los servicios y del proceso del proyecto',
    async () => {
      const x = n();
      const servicios = (await x.estadoGeneral()).servicios.filter(
        (s) => s.estado === 'encendido' && s.pid,
      );
      const procs = await x.estadosProcesos(sitioFastapi!.id);
      const muestra = await medir('muestra de métricas', () => x.metricas.muestrear());
      log(
        'muestra:',
        `cpu ${muestra.cpu.toFixed(1)}%`,
        `ram ${(muestra.ramUsada / 2 ** 30).toFixed(1)}/${(muestra.ramTotal / 2 ** 30).toFixed(1)} GiB`,
        muestra.procesos
          .map(
            (p) => `${p.id}#${p.pid} ${p.cpu.toFixed(1)}% ${(p.ramBytes / 2 ** 20).toFixed(0)} MiB`,
          )
          .join(' | '),
      );
      const pids = new Set(muestra.procesos.map((p) => p.pid));
      for (const s of servicios) {
        if (s.id === 'ftp') continue; // corre dentro del propio proceso
        expect(pids.has(s.pid!), `${s.id} (${s.pid}) en la muestra`).toBe(true);
      }
      expect(servicios.map((s) => s.id)).toEqual(
        expect.arrayContaining(['nginx', 'mysql', `php-${RAMA_PHP}`]),
      );
      const uvicorn = procs.find((p) => p.procesoId === 'uvicorn');
      expect(uvicorn?.pid).toBeTypeOf('number');
      const enMuestra = muestra.procesos.find((p) => p.pid === uvicorn!.pid);
      expect(enMuestra).toMatchObject({ sitioId: sitioFastapi!.id, procesoId: 'uvicorn' });
      for (const p of muestra.procesos) expect(p.ramBytes).toBeGreaterThan(0);
    },
    5 * MIN,
  );

  it(
    '7. no quedan ventanas visibles ni procesos de la carpeta temporal',
    async () => {
      const x = n();
      const ventanas: string[] = [];
      for (let i = 0; i < 3; i++) {
        ventanas.push(...ventanasDeBase(base));
        await new Promise((r) => setTimeout(r, 500));
      }
      log('ventanas visibles con todo encendido:', JSON.stringify(ventanas));
      expect(ventanas).toEqual([]);
      log(
        'procesos en marcha:',
        procesosDeBase(base)
          .map((p) => p.nombre)
          .join(', '),
      );

      await medir('detenerTodo y cerrar', async () => {
        await x.detenerTodo();
        await x.cerrar({ detenerServicios: false });
      });
      nucleo = null;
      let restantes: string[] = [];
      try {
        restantes = await esperar(
          'que terminen los procesos',
          async () => {
            const p = procesosQueMencionan(base);
            return p.length === 0 ? p : null;
          },
          30_000,
        );
      } catch {
        restantes = procesosQueMencionan(base);
      }
      log('procesos después de apagar:', JSON.stringify(restantes), 'reloj', reloj());
      expect(restantes).toEqual([]);
      expect(ventanasDeBase(base)).toEqual([]);
    },
    5 * MIN,
  );
});
