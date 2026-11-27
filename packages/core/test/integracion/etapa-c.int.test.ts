/**
 * Prueba real de la Etapa C en Windows (`npm run test:win`): en carpetas temporales y con puertos
 * altos instala PHP 8.4, Xdebug, Nginx, PostgreSQL 16 y 17, MariaDB 11.4 y Node desde el catálogo
 * (con su huella; los que no la publican, con la confirmación explícita), y comprueba lo nuevo de
 * la etapa contra programas de verdad: Xdebug (un cliente DBGp mínimo recibe `init`), la vuelta
 * atrás de php.ini y del vhost, la captura de `dump()`, un proveedor de IA compatible contra un
 * servidor OpenAI falso, el registro del MCP en una configuración de Codex de prueba, el Doctor
 * sobre un hosts de prueba dañado, las métricas con procesos hijos, el catálogo en vivo, las
 * instancias paralelas, la migración a instancias, la actualización de parche con respaldo (y su
 * vuelta atrás) y la desinstalación sin tocar datos. Al final no quedan ventanas ni procesos.
 *
 * Nunca toca el archivo hosts real, el almacén de certificados, el PATH ni las variables del
 * usuario, su carpeta de inicio (la de los agentes es temporal), FlyEnv ni la carpeta de datos
 * real. Ninguna prueba gasta tokens: la IA es un servidor local falso.
 */
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import { huellaFuerte } from '../../src/catalogo/huellas';
import { Instalador } from '../../src/catalogo/instalador';
import { CatalogoVivo, listaFija, validarIndice } from '../../src/catalogo/vivo';
import { Eventos, type EventosNucleo } from '../../src/eventos';
import { MARCA_FIN, MARCA_INICIO } from '../../src/hosts/bloque';
import type { CapacidadesPlataforma, Plataforma } from '../../src/plataforma/tipos';
import { PlataformaWindows } from '../../src/plataforma/win';
import { Rutas } from '../../src/rutas';
import type { IdInstancia, Sitio } from '../../src/tipos';
import {
  esWindows,
  esperar,
  fetchConCache,
  limpiarBase,
  plataformaSegura,
  procesosDeBase,
  ventanasDeBase,
} from './comun';

/** Puertos altos: nada choca con FlyEnv ni con una instalación real de WolfCore Dev. */
const PUERTOS = {
  nginx: 18289,
  https: 18643,
  mcp: 17890,
  dumps: 19912,
  xdebug: 19003,
  pg17: 15517,
  pg16: 15516,
  mariadb: 13507,
  pgMigrada: 15518,
} as const;
const RAMA_PHP = '8.4';
/** Rama de Node que no está en la lista fija de catalogo.json (24 y 26 sí). */
const RAMA_NODE_VIVA = '22';
const MARIADB_ANTERIOR = '11.4.13';
const MARIADB_FIJA = '11.4.14';

const sufijo = randomBytes(4).toString('hex');
const base = path.join(os.tmpdir(), `pel-etapa-c-${sufijo}`);
/** Segunda carpeta de datos: la de la forma vieja (antes de las instancias) que se migra. */
const baseMigracion = path.join(os.tmpdir(), `pel-etapa-c-mig-${sufijo}`);
const proyectos = path.join(base, 'proyectos');
const documentos = path.join(base, 'Documentos');
const inicio = path.join(base, 'inicio');
const hostsCopia = path.join(base, 'hosts-copia');

const MIN = 60_000;
const log = (...a: unknown[]): void => console.log('[etapa-c]', ...a);
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

/** ¿Hay red? Las pruebas del catálogo en vivo se saltan sin ella. */
const hayRed = esWindows
  ? await fetch('https://nodejs.org/dist/index.json', {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    })
      .then((r) => r.ok)
      .catch(() => false)
  : false;

/**
 * Plataforma segura de las pruebas (hosts en copia, sin certificados) más lo de la Etapa C: la
 * carpeta de inicio (configuración de los agentes) es temporal, los agentes nunca se buscan en el
 * equipo (se edita su archivo de prueba, nunca se ejecuta su CLI real) y nada escribe el PATH, las
 * variables del usuario ni servicios del sistema.
 */
function plataformaEtapaC(): Plataforma {
  const real = new PlataformaWindows();
  const prohibido = (que: string) => async (): Promise<never> => {
    throw new Error(`La prueba no debe ${que}`);
  };
  const extra: Partial<CapacidadesPlataforma> = {
    carpetaInicio: () => inicio,
    carpetasNpmGlobal: () => [],
    buscarEjecutable: async (nombre, extras) =>
      ['codex', 'claude', 'hermes'].includes(nombre) ? null : real.buscarEjecutable(nombre, extras),
    leerVariableUsuario: async () => null,
    variableUsuario: prohibido('cambiar variables del usuario'),
    // Un PATH del usuario vacío y de solo lectura: escribirlo falla.
    pathUsuario: () => ({
      leer: async () => [],
      escribir: prohibido('tocar el PATH del usuario'),
    }),
    abrirTerminal: prohibido('abrir terminales'),
    detenerServicioSistema: prohibido('detener servicios del sistema'),
    quitarSoloLecturaHosts: prohibido('tocar el atributo del hosts'),
    instalarVcRedist: prohibido('instalar VC++'),
    perfilesFirefox: async () => [],
  };
  return { ...plataformaSegura(hostsCopia, documentos), ...extra } as Plataforma;
}

/**
 * Índice en vivo del servicio (reintenta: en este equipo algunas conexiones tardan en abrir y una
 * consulta fallida cae a la lista fija, que no trae las versiones que la prueba necesita).
 */
async function catalogoVivo(x: Nucleo, servicio: Parameters<Nucleo['listarCatalogo']>[0]) {
  return esperar(
    `el índice en vivo de ${servicio}`,
    async () => {
      const l = await x.listarCatalogo(servicio, { refrescar: true, todas: true });
      return l.origen === 'vivo' ? l : null;
    },
    3 * MIN,
    5000,
  );
}

const opcionesNucleo = (b: string) => ({
  barrerHuerfanos: false,
  base: b,
  plataforma: plataformaEtapaC(),
  fetch: fetchConCache(log),
  // La revisión de versiones nuevas no compite con la prueba.
  retrasoNovedadesMs: 24 * 60 * MIN,
});

let nucleo: Nucleo | null = null;
const n = (): Nucleo => {
  if (!nucleo) throw new Error('El núcleo no está creado');
  return nucleo;
};
let nucleoMigracion: Nucleo | null = null;
let sitioPhp: Sitio | null = null;
const servidores: (http.Server | net.Server)[] = [];

interface Respuesta {
  status: number;
  cuerpo: string;
  cabeceras: http.IncomingHttpHeaders;
  ms: number;
}

function pedirHttp(dominio: string, ruta: string): Promise<Respuesta> {
  const t = performance.now();
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PUERTOS.nginx,
        path: ruta,
        headers: { Host: dominio },
        timeout: 60_000,
      },
      (res) => {
        let cuerpo = '';
        res.setEncoding('utf8');
        res.on('data', (x: string) => (cuerpo += x));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            cuerpo,
            cabeceras: res.headers,
            ms: performance.now() - t,
          }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error('tiempo agotado')));
    req.on('error', reject);
    req.end();
  });
}

const pedirSitio = (ruta: string): Promise<Respuesta> => pedirHttp(sitioPhp!.dominio, ruta);

/** Espera un 200 del sitio (los pools tardan un momento en tomar un cambio). */
const esperar200 = (ruta: string, desc: string, ms = 30_000): Promise<Respuesta> =>
  esperar(
    desc,
    async () => {
      const r = await pedirSitio(ruta);
      return r.status === 200 ? r : null;
    },
    ms,
    300,
  );

const escuchar = <S extends http.Server | net.Server>(s: S, puerto = 0): Promise<number> =>
  new Promise((ok, mal) => {
    s.once('error', mal);
    s.listen(puerto, '127.0.0.1', () => {
      servidores.push(s);
      ok((s.address() as net.AddressInfo).port);
    });
  });

/**
 * Cliente DBGp mínimo (el lado del IDE): escucha en `puerto` y resuelve con el primer paquete
 * que manda Xdebug (`<largo>\0<xml init>\0`). Responde `detach` para que la petición siga.
 */
async function clienteDbgp(puerto: number): Promise<{ init: Promise<string> }> {
  let resolver!: (x: string) => void;
  const init = new Promise<string>((r) => (resolver = r));
  const servidor = net.createServer((s) => {
    let buf = Buffer.alloc(0);
    s.on('data', (d: Buffer) => {
      buf = Buffer.concat([buf, d]);
      const a = buf.indexOf(0);
      if (a < 0) return;
      const largo = Number(buf.subarray(0, a).toString('ascii'));
      if (buf.length < a + 1 + largo) return;
      resolver(buf.subarray(a + 1, a + 1 + largo).toString('utf8'));
      s.write('detach -i 1\0');
      s.end();
    });
    s.on('error', () => undefined);
  });
  await escuchar(servidor, puerto);
  return { init };
}

/** Archivos de una carpeta: ruta relativa, tamaño y SHA-256 (para compararla antes y después). */
function fotoCarpeta(dir: string): string[] {
  const res: string[] = [];
  const recorrer = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) recorrer(p);
      else if (e.isFile()) {
        const h = createHash('sha256').update(readFileSync(p)).digest('hex');
        res.push(`${path.relative(dir, p)}|${statSync(p).size}|${h}`);
      }
    }
  };
  recorrer(dir);
  return res.sort();
}

async function esperarInstancia(
  x: Nucleo,
  id: IdInstancia,
  estado: 'encendido' | 'apagado',
  ms = 90_000,
): Promise<void> {
  await esperar(
    `${id} ${estado}`,
    async () => {
      const i = (await x.listaInstancias()).find((y) => y.id === id);
      if (estado === 'encendido' && i?.estado === 'error') throw new Error(`${id} en error`);
      return i?.estado === estado ? i : null;
    },
    ms,
  );
}

async function consultaPg(
  x: Nucleo,
  objetivo: Parameters<Nucleo['conexionBd']>[0],
  base: string,
  sql: string,
  credenciales?: { usuario: string; clave: string | null },
): Promise<pg.QueryResult> {
  const c = await x.conexionBd(objetivo);
  const cliente = new pg.Client({
    host: c.host,
    port: c.puerto,
    user: credenciales?.usuario ?? c.usuario,
    password: credenciales?.clave ?? c.clave ?? undefined,
    database: base,
    connectionTimeoutMillis: 10_000,
  });
  await cliente.connect();
  try {
    return await cliente.query(sql);
  } finally {
    await cliente.end();
  }
}

async function consultaMaria(
  x: Nucleo,
  objetivo: Parameters<Nucleo['conexionBd']>[0],
  base: string,
  sql: string,
): Promise<unknown[]> {
  const c = await x.conexionBd(objetivo);
  const con = await mysql.createConnection({
    host: c.host,
    port: c.puerto,
    user: c.usuario,
    password: c.clave ?? undefined,
    database: base,
    connectTimeout: 10_000,
  });
  try {
    const [filas] = await con.query(sql);
    return filas as unknown[];
  } finally {
    await con.end();
  }
}

/** Procesos cuyo ejecutable o línea de comandos menciona `dir` (sin contar este proceso). */
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
  return salida
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes('|'))
    .filter((l) => !/Get-CimInstance Win32_Process/.test(l));
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

describe.skipIf(!esWindows)('Etapa C: integración real en Windows', () => {
  beforeAll(async () => {
    for (const d of [proyectos, documentos, inicio]) mkdirSync(d, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n10.0.0.5 intranet.local\r\n');
    log('base temporal:', base, '| migración:', baseMigracion, '| red:', hayRed);
    nucleo = await Nucleo.crear(opcionesNucleo(base));
    const x = n();
    await x.guardarAjustes({ puerto: PUERTOS.nginx, trabajadores: 1 });
    await x.cambiarPuertoHttps(PUERTOS.https);
    await x.cambiarPuertoMcp(PUERTOS.mcp);
    await x.sitios.modificarConfig((c) => {
      c.depuracion.puerto = PUERTOS.dumps;
    });
    const ocupados = await new PlataformaWindows().duenosDePuertos(Object.values(PUERTOS));
    log('puertos ocupados antes de empezar:', JSON.stringify([...ocupados]));
    expect([...ocupados.keys()]).toEqual([]);
  }, 5 * MIN);

  afterAll(async () => {
    for (const s of servidores) s.close();
    for (const x of [nucleoMigracion, nucleo]) {
      if (x) await x.cerrar({ detenerServicios: true }).catch((e: unknown) => log('cerrar:', e));
    }
    nucleo = null;
    nucleoMigracion = null;
    log('tiempos:\n' + tiempos.join('\n'));
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') {
      limpiarBase(base, log);
      limpiarBase(baseMigracion, log);
    }
  }, 5 * MIN);

  it(
    '1. PHP 8.4 y Xdebug del catálogo: el cliente DBGp recibe init al pedir con el disparador',
    async () => {
      const x = n();
      const php = (await x.listarVersiones('php')).find((v) => v.rama === RAMA_PHP);
      // nginx.org no publica huellas: se usa la versión de la lista fija (SHA-256 propio).
      const nginx = (await x.listarVersiones('nginx')).find((v) => huellaFuerte(v.huella));
      expect(php, `el catálogo no trae PHP ${RAMA_PHP}`).toBeDefined();
      expect(huellaFuerte(php!.huella)).toBe(true);
      for (const v of [php!, nginx!]) {
        await medir(`instalar ${v.servicio} ${v.version}`, () => x.instalador.instalar(v));
      }
      const carpeta = path.join(proyectos, 'php-c');
      mkdirSync(carpeta, { recursive: true });
      writeFileSync(path.join(carpeta, 'index.php'), '<?php echo "hola ", PHP_VERSION;');
      writeFileSync(
        path.join(carpeta, 'xd.php'),
        "<?php echo extension_loaded('xdebug') ? implode('|', ['xdebug', ini_get('xdebug.mode'), ini_get('xdebug.start_with_request'), ini_get('xdebug.client_host'), ini_get('xdebug.client_port')]) : 'sin xdebug';",
      );
      writeFileSync(
        path.join(carpeta, 'dump.php'),
        "<?php dump(['wolf' => 'core-etapa-c', 'n' => 42]); echo 'listo';",
      );
      const { sitio } = await x.guardarSitio(
        datosSitio({
          nombre: 'PHP C',
          dominio: 'php-c.test',
          carpeta,
          tipo: 'personalizado',
          php: RAMA_PHP,
        }),
      );
      sitioPhp = sitio;
      await medir('iniciar PHP y Nginx', async () => {
        await x.servicios.iniciar(`php-${RAMA_PHP}`);
        await x.servicios.iniciar('nginx');
      });
      const r0 = await esperar200('/index.php', 'el sitio PHP');
      log('GET /index.php →', r0.status, r0.cuerpo);
      expect(r0.cuerpo).toMatch(/^hola 8\.4\./);

      const dbgp = await clienteDbgp(PUERTOS.xdebug);
      const r = await medir('activar Xdebug (instala la DLL del catálogo)', () =>
        x.xdebugSitio(sitio.id, {
          activo: true,
          modo: ['debug'],
          puerto: PUERTOS.xdebug,
          inicio: 'trigger',
        }),
      );
      log('xdebugSitio →', JSON.stringify(r.aplicar.nginx), 'avisoPuerto', r.avisoPuerto);
      expect(r.aplicar.nginx.ok).toBe(true);
      const estado = await x.phpSitio(sitio.id);
      log('phpSitio →', JSON.stringify({ ...estado, phpStorm: undefined }));
      expect(estado).toMatchObject({ xdebugInstalado: true, poolPropio: true, enMarcha: true });
      // La DLL no se activa en la rama: solo la carga el pool propio del sitio.
      expect(await x.iniPhp.leer(RAMA_PHP)).not.toMatch(/^\s*zend_extension\s*=.*xdebug/im);

      // El pool propio del sitio carga Xdebug con sus ajustes.
      const xd = await esperar(
        'Xdebug cargado en el pool del sitio',
        async () => {
          const q = await pedirSitio('/xd.php');
          return q.status === 200 && q.cuerpo.startsWith('xdebug|') ? q : null;
        },
        30_000,
        500,
      ).catch(async (e: unknown) => {
        log('xd.php →', (await pedirSitio('/xd.php')).cuerpo);
        throw e;
      });
      log('xd.php →', xd.cuerpo);
      expect(xd.cuerpo).toBe(`xdebug|debug|trigger|127.0.0.1|${PUERTOS.xdebug}`);
      // Sin disparador no conecta; con él, Xdebug manda init al cliente.
      const sin = await esperar200('/index.php', 'el sitio con Xdebug');
      expect(sin.cuerpo).toMatch(/^hola/);
      const [res, init] = await Promise.all([
        pedirSitio('/index.php?XDEBUG_TRIGGER=1'),
        Promise.race([
          dbgp.init,
          new Promise<string>((_, mal) =>
            setTimeout(() => mal(new Error('Xdebug no conectó en 20 s')), 20_000),
          ),
        ]),
      ]);
      log('DBGp init →', init.slice(0, 300));
      expect(init).toContain('<init');
      expect(init).toMatch(/fileuri="file:\/\/\/.*index\.php"/);
      expect(res.status).toBe(200);
      // Se quita Xdebug: el sitio vuelve al pool compartido.
      await x.xdebugSitio(sitio.id, null);
      expect((await x.phpSitio(sitio.id)).poolPropio).toBe(false);
      expect((await esperar200('/index.php', 'el sitio sin Xdebug')).cuerpo).toMatch(/^hola/);
    },
    30 * MIN,
  );

  it(
    '2. php.ini con memory_limit = abc: vuelve atrás y el sitio responde 200',
    async () => {
      const x = n();
      const ini = await x.iniPhp.leer(RAMA_PHP);
      const ruta = x.rutas.phpIni(RAMA_PHP);
      const bytesAntes = readFileSync(ruta);
      // Los valores rápidos ya rechazan 'abc'; aquí llega como texto del editor.
      await expect(x.iniPhp.conValores(RAMA_PHP, { memory_limit: 'abc' })).rejects.toThrow();
      expect(ini).toMatch(/^memory_limit\s*=.*$/m);
      const malo = ini.replace(/^memory_limit\s*=.*$/m, 'memory_limit = abc');
      const error = await x.iniPhp.guardar(RAMA_PHP, malo).then(
        () => null,
        (e: unknown) => e as { codigo?: string; message?: string },
      );
      log('guardar memory_limit=abc →', error?.codigo, error?.message?.slice(0, 200));
      expect(error?.codigo).toMatch(/^php\.(ini_invalido|no_arranco)$/);
      expect(readFileSync(ruta).equals(bytesAntes)).toBe(true);
      expect(await x.iniPhp.leer(RAMA_PHP)).toBe(ini);
      const r = await esperar200('/index.php', 'el sitio tras el ini rechazado');
      expect(r.cuerpo).toMatch(/^hola/);
    },
    5 * MIN,
  );

  it(
    '3. vhost con una regla rota: nginx -t falla, se restaura y Nginx sigue respondiendo',
    async () => {
      const x = n();
      const vhost = x.rutas.vhost(sitioPhp!.id);
      const antes = readFileSync(vhost, 'utf8');
      const r = await x.editorVhost.aplicar(sitioPhp!.id, { reglas: 'gzipp on;' });
      log('regla rota →', JSON.stringify(r).slice(0, 300));
      expect(r).toMatchObject({ ok: false, salida: expect.stringContaining('gzipp') });
      expect(readFileSync(vhost, 'utf8')).toBe(antes);
      const e = (await x.estadoGeneral()).servicios.find((s) => s.id === 'nginx');
      expect(e?.estado).toBe('encendido');
      expect((await pedirSitio('/index.php')).status).toBe(200);
      // Una regla válida sí se aplica (y la cabecera llega).
      const bien = await x.editorVhost.aplicar(sitioPhp!.id, {
        reglas: 'add_header X-Etapa "c" always;',
      });
      expect(bien).toMatchObject({ ok: true });
      await esperar(
        'la cabecera de la regla',
        async () => ((await pedirSitio('/index.php')).cabeceras['x-etapa'] === 'c' ? true : null),
        10_000,
        300,
      );
    },
    5 * MIN,
  );

  it(
    '4. captura activa: dump() llega al receptor; con el receptor detenido la página responde 200',
    async () => {
      const x = n();
      const id = sitioPhp!.id;
      const base0 = await esperar200('/index.php', 'el sitio antes de la captura');
      await expect(x.capturaDumpsSitio(id, true)).rejects.toMatchObject({
        codigo: 'depuracion.confirmacion',
      });
      const r = await medir('activar la captura', () => x.capturaDumpsSitio(id, true, true));
      expect(r.aplicar?.nginx.ok).toBe(true);
      expect(x.estadoDepuracion()).toMatchObject({ activo: true, puerto: PUERTOS.dumps });
      // Tras la recarga, los trabajadores viejos de Nginx pueden atender un momento más con el
      // pool compartido (sin dump()): se espera a que responda el del sitio.
      const con = await esperar(
        'dump.php con la captura',
        async () => {
          const q = await pedirSitio('/dump.php');
          return q.status === 200 && q.cuerpo.includes('listo') ? q : null;
        },
        30_000,
        300,
      );
      expect(con.cuerpo).toContain('listo');
      const resumen = await esperar(
        'el dump en el receptor',
        async () => x.listaDumps().find((d) => d.sitioId === id) ?? null,
        15_000,
        200,
      );
      const dump = x.leerDump(resumen.id);
      log('dump →', JSON.stringify({ ...resumen, vista: resumen.vista.slice(0, 80) }));
      expect(dump?.texto).toContain('core-etapa-c');
      expect(dump?.archivo ?? '').toMatch(/dump\.php$/);

      // Receptor detenido con la captura todavía puesta en el pool del sitio.
      await x.depuracion.detener();
      expect(x.estadoDepuracion().activo).toBe(false);
      const tiemposSin: number[] = [];
      let ultima: Respuesta | null = null;
      for (let i = 0; i < 5; i++) {
        ultima = await pedirSitio('/dump.php');
        expect(ultima.status).toBe(200);
        tiemposSin.push(ultima.ms);
      }
      const mediana = (v: number[]): number =>
        [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]!;
      const ref: number[] = [];
      for (let i = 0; i < 5; i++) ref.push((await pedirSitio('/index.php')).ms);
      log(
        `receptor detenido: dump.php ${mediana(tiemposSin).toFixed(0)} ms (mediana) vs index.php ${mediana(ref).toFixed(0)} ms; antes ${base0.ms.toFixed(0)} ms`,
      );
      expect(ultima!.cuerpo).toContain('listo');
      expect(mediana(tiemposSin) - mediana(ref)).toBeLessThan(250);
      // Se apaga todo: sin captura el ini del sitio no lleva el prepend.
      await x.activarDepuracion(false);
      expect((await x.sitios.listar()).find((s) => s.id === id)?.capturaDumps).toBeFalsy();
      expect((await esperar200('/index.php', 'el sitio sin captura')).cuerpo).toMatch(/^hola/);
    },
    10 * MIN,
  );

  it(
    '5. proveedor compatible contra un servidor OpenAI falso: modelos, latencia y .env confirmado',
    async () => {
      const x = n();
      const CLAVE = 'sk-falsa-prueba-etapa-c-0000000000009z9z';
      const vistas: string[] = [];
      const falso = http.createServer((req, res) => {
        vistas.push(`${req.method} ${req.url} ${req.headers.authorization ?? '-'}`);
        if (req.url === '/v1/models' && req.headers.authorization === `Bearer ${CLAVE}`) {
          res.setHeader('content-type', 'application/json');
          res.end(
            JSON.stringify({
              object: 'list',
              data: [
                { id: 'modelo-falso-1', object: 'model' },
                { id: 'modelo-falso-2', object: 'model' },
              ],
            }),
          );
          return;
        }
        res.statusCode = 401;
        res.end(JSON.stringify({ error: { message: 'clave incorrecta' } }));
      });
      const puerto = await escuchar(falso);
      await x.ia.guardarProveedor(
        {
          id: 'falso',
          tipo: 'compatible',
          nombre: 'OpenAI falso',
          urlBase: `http://127.0.0.1:${puerto}/v1`,
          modelo: 'modelo-falso-1',
        },
        { tieneClave: false },
      );
      const prueba = await x.ia.probarConexion('falso', CLAVE);
      log('probarConexion →', JSON.stringify(prueba));
      expect(prueba.ok).toBe(true);
      expect(prueba.modelos.map((m) => m.id)).toEqual(['modelo-falso-1', 'modelo-falso-2']);
      expect(prueba.latenciaMs).toBeGreaterThanOrEqual(0);
      const mala = await x.ia.probarConexion('falso', 'sk-falsa-otra-clave-00000000000000001');
      expect(mala.ok).toBe(false);
      expect(JSON.stringify(mala)).not.toContain('sk-falsa');

      // .env de un proyecto (repositorio git sin el .env versionado).
      const carpeta = path.join(proyectos, 'ia-c');
      mkdirSync(carpeta, { recursive: true });
      execFileSync('git', ['init', '-q'], { cwd: carpeta, windowsHide: true });
      writeFileSync(path.join(carpeta, '.env'), 'APP_NAME=Prueba\n');
      const { sitio } = await x.guardarSitio(
        datosSitio({ nombre: 'IA C', dominio: 'ia-c.test', carpeta }),
      );
      const vista = await x.ia.previsualizarEnv(sitio.id, 'falso', CLAVE);
      log('bloque enmascarado →', vista.bloque.replace(/\n/g, ' | '));
      expect(vista.bloque).not.toContain(CLAVE);
      expect(vista.bloque).toContain(CLAVE.slice(-4));
      await expect(
        x.ia.escribirEnv(sitio.id, 'falso', CLAVE, {
          confirmado: undefined as unknown as true,
          agregarGitignore: true,
        }),
      ).rejects.toMatchObject({ codigo: 'ia.env_sin_confirmar' });
      expect(readFileSync(path.join(carpeta, '.env'), 'utf8')).toBe('APP_NAME=Prueba\n');
      expect(existsSync(path.join(carpeta, '.gitignore'))).toBe(false);
      const escrito = await x.ia.escribirEnv(sitio.id, 'falso', CLAVE, {
        confirmado: true,
        agregarGitignore: true,
      });
      log('escribirEnv →', JSON.stringify(escrito));
      const env = readFileSync(path.join(carpeta, '.env'), 'utf8');
      expect(env).toContain('APP_NAME=Prueba');
      expect(env).toContain(CLAVE);
      expect(env).toContain(`http://127.0.0.1:${puerto}/v1`);
      expect(escrito).toMatchObject({ respaldo: true, gitignoreAgregado: true });
      expect(readFileSync(path.join(carpeta, '.gitignore'), 'utf8')).toMatch(/^\.env$/m);
      // La clave no queda en config.json.
      expect(readFileSync(x.rutas.config(), 'utf8')).not.toContain(CLAVE);
      log(
        'peticiones al servidor falso:',
        vistas.map((v) => v.replace(CLAVE, '<clave>')),
      );
    },
    5 * MIN,
  );

  it(
    '6. registro del MCP en una configuración de Codex de prueba, con copia',
    async () => {
      const x = n();
      const archivo = path.join(inicio, '.codex', 'config.toml');
      mkdirSync(path.dirname(archivo), { recursive: true });
      const original = [
        '# configuración de prueba (carpeta de inicio temporal)',
        'model = "modelo-de-prueba"',
        '',
        '[mcp_servers.otro]',
        'command = "otro-servidor"',
        'args = ["--quieto"]',
        '',
      ].join('\n');
      writeFileSync(archivo, original);
      const r = await x.agentes.registrarMcp('codex', true);
      log('registrarMcp codex →', JSON.stringify(r));
      expect(r.metodo).toBe('archivo');
      expect(r.respaldo).not.toBeNull();
      expect(readFileSync(r.respaldo!, 'utf8')).toBe(original);
      const nuevo = readFileSync(archivo, 'utf8');
      log('config.toml →\n' + nuevo);
      expect(nuevo).toContain('[mcp_servers.otro]');
      expect(nuevo).toContain('command = "otro-servidor"');
      expect(nuevo).toContain('model = "modelo-de-prueba"');
      expect(nuevo).toContain('[mcp_servers.wolfcore]');
      expect(nuevo).toContain(`http://127.0.0.1:${PUERTOS.mcp}/mcp`);
      // El token no se escribe: va por variable de entorno.
      expect(nuevo).not.toContain(await x.tokenMcp());
      expect(nuevo).toContain('WOLFCORE_MCP_TOKEN');
      // La carpeta de inicio real no se tocó: todo quedó en la temporal.
      expect(path.relative(inicio, r.respaldo!).startsWith('..')).toBe(false);
    },
    5 * MIN,
  );

  it(
    '7. Doctor sobre un hosts de prueba dañado: hallazgo y reparación',
    async () => {
      const x = n();
      const sano = readFileSync(hostsCopia, 'utf8');
      log('hosts de prueba antes de dañarlo:\n' + sano);
      expect(sano).toContain(MARCA_INICIO);
      // Bloque sin cierre y un segundo bloque: lo que deja un editor a medias.
      const danado =
        sano.replace(new RegExp(`^${MARCA_FIN}.*$`, 'm'), '') +
        `\r\n${MARCA_INICIO}\r\n127.0.0.1  viejo.test\r\n`;
      writeFileSync(hostsCopia, danado);
      const hallazgos = await x.doctor.revisar(['hosts']);
      log('hallazgos →', JSON.stringify(hallazgos.map((h) => [h.id, h.gravedad, h.codigo])));
      const roto = hallazgos.find((h) => h.id === 'hosts:sin-cierre');
      expect(roto?.reparacion?.soloInforma).toBe(false);
      expect(await x.doctor.reparar(roto!.id, undefined as unknown as true)).toMatchObject({
        ok: false,
        codigo: 'doctor.confirmacion_requerida',
      });
      expect(readFileSync(hostsCopia, 'utf8')).toBe(danado);
      const rep = await x.doctor.reparar(roto!.id, true);
      log('reparar →', JSON.stringify(rep));
      expect(rep.ok).toBe(true);
      const despues = readFileSync(hostsCopia, 'utf8');
      log('hosts de prueba reparado:\n' + despues);
      expect(despues).toContain('10.0.0.5 intranet.local');
      expect(despues.split(MARCA_INICIO).length - 1).toBe(1);
      expect(despues.split(MARCA_FIN).length - 1).toBe(1);
      expect(despues).toContain(sitioPhp!.dominio);
      expect(x.doctor.ultimo().filter((h) => h.revision === 'hosts')).toEqual([]);
    },
    5 * MIN,
  );

  it(
    '8. métricas: un proceso de proyecto con un hijo suma la RAM del hijo',
    async () => {
      const x = n();
      const node = (await x.listarVersiones('node')).find((v) => v.version.startsWith('24.'));
      expect(node).toBeDefined();
      await medir(`instalar node ${node!.version}`, () => x.instalador.instalar(node!));
      const carpeta = path.join(proyectos, 'metricas-c');
      mkdirSync(carpeta, { recursive: true });
      // El padre no reserva casi nada; el hijo llena 300 MiB y se queda vivo.
      writeFileSync(
        path.join(carpeta, 'padre.js'),
        [
          "const { spawn } = require('node:child_process');",
          "spawn(process.execPath, [require('node:path').join(__dirname, 'hijo.js')], { stdio: 'inherit', windowsHide: true });",
          'setInterval(() => {}, 1000);',
        ].join('\n'),
      );
      writeFileSync(
        path.join(carpeta, 'hijo.js'),
        [
          'const b = Buffer.alloc(300 * 1024 * 1024, 1);',
          "console.log('hijo listo', b.length);",
          'setInterval(() => b[0]++, 1000);',
        ].join('\n'),
      );
      const { sitio } = await x.guardarSitio(
        datosSitio({
          nombre: 'Metricas C',
          dominio: 'metricas-c.test',
          carpeta,
          procesos: [
            {
              id: 'carga',
              nombre: 'carga',
              comando: ['node', 'padre.js'],
              cwd: 'raiz',
              autoIniciar: false,
              reiniciar: false,
              puerto: null,
              proxy: false,
            },
          ],
          runtimes: { node: node!.version },
        }),
      );
      await x.iniciarProceso(sitio.id, 'carga');
      const proc = await esperar(
        'el proceso del proyecto',
        async () => {
          const e = (await x.estadosProcesos(sitio.id)).find((p) => p.procesoId === 'carga');
          if (e?.estado === 'error') throw new Error(`carga en error: ${e.mensaje ?? ''}`);
          return e?.estado === 'encendido' && e.pid ? e : null;
        },
        60_000,
      );
      const muestra = await esperar(
        'la RAM del hijo en la muestra',
        async () => {
          const m = await x.metricas.muestrear();
          const p = m.procesos.find((q) => q.sitioId === sitio.id && q.procesoId === 'carga');
          return p && p.ramBytes > 250 * 2 ** 20 ? p : null;
        },
        60_000,
        1000,
      );
      log(
        `proceso ${muestra.id} PID ${muestra.pid} (supervisado ${proc.pid}) → ${(muestra.ramBytes / 2 ** 20).toFixed(0)} MiB`,
      );
      expect(muestra.ramBytes).toBeGreaterThan(250 * 2 ** 20);
      await x.detenerProceso(sitio.id, 'carga');
    },
    15 * MIN,
  );

  it.skipIf(!hayRed)(
    '9. catálogo en vivo: Node, Composer y Mailpit con huella fuerte; Node de una rama viva; índice manipulado → lista fija',
    async () => {
      const x = n();
      for (const s of ['node', 'composer', 'mailpit'] as const) {
        const l = await medir(`índice en vivo de ${s}`, () => catalogoVivo(x, s));
        const fuertes = l.versiones.filter((v) => huellaFuerte(v.huella));
        log(
          `${s}: origen ${l.origen}, ${l.versiones.length} versiones, ${fuertes.length} con huella fuerte; primeras:`,
          l.versiones
            .slice(0, 3)
            .map((v) => `${v.version} ${v.huella?.algoritmo ?? 'sin huella'}`)
            .join(', '),
        );
        expect(l.origen).toBe('vivo');
        expect(validarIndice(s, l.versiones).length).toBe(l.versiones.length);
        expect(fuertes.length).toBeGreaterThan(0);
      }
      // Node de una rama que no está en la lista fija: huella de SHASUMS256.txt.
      expect(listaFija('node').some((v) => v.rama === RAMA_NODE_VIVA)).toBe(false);
      const ultima = (await x.listarVersiones('node', { rama: RAMA_NODE_VIVA }))[0];
      expect(ultima).toBeDefined();
      const v = await x.buscarVersion('node', ultima!.version);
      expect(v?.origen).not.toBe('fija');
      const sumas = await (
        await fetch(`https://nodejs.org/dist/v${v!.version}/SHASUMS256.txt`)
      ).text();
      const oficial = new RegExp(`^([0-9a-f]{64})\\s+node-v${v!.version}-win-x64\\.zip$`, 'm').exec(
        sumas,
      )?.[1];
      log(`node ${v!.version}: huella ${v!.huella?.valor} / SHASUMS256 ${oficial}`);
      expect(v!.huella).toEqual({ algoritmo: 'sha256', valor: oficial });
      await medir(`instalar node ${v!.version} (rama viva)`, () => x.instalador.instalar(v!));
      const exe = path.join(x.runtimes.rutaBin('node', v!.version), 'node.exe');
      const salida = execFileSync(exe, ['--version'], { encoding: 'utf8', windowsHide: true });
      expect(salida.trim()).toBe(`v${v!.version}`);

      // Servidor falso que sirve un índice manipulado y una SHASUMS256 con otra huella.
      const falso = http.createServer((req, res) => {
        res.setHeader('content-type', 'text/plain');
        if (req.url === '/index.json') {
          res.end(JSON.stringify([{ version: 'v99.0.0', files: 'win-x64-zip', lts: 'Falso' }]));
        } else if (req.url === '/SHASUMS256.txt') {
          res.end(`${'0'.repeat(64)}  node-v${v!.version}-win-x64.zip\n`);
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
      const puerto = await escuchar(falso);
      const hacia =
        (rutas: Record<string, string>): typeof fetch =>
        async (entrada, init) => {
          const url =
            typeof entrada === 'string'
              ? entrada
              : entrada instanceof URL
                ? entrada.href
                : entrada.url;
          const local = rutas[url];
          if (!local) return fetchConCache(log)(entrada, init);
          const r = await fetch(`http://127.0.0.1:${puerto}${local}`);
          return new Response(await r.arrayBuffer(), { status: r.status, headers: r.headers });
        };
      const rutasFalsas = new Rutas(path.join(base, 'catalogo-falso'));
      await rutasFalsas.asegurar();
      const plat = { idCatalogo: () => 'win-x64' as const };
      const manipulado = new CatalogoVivo(
        rutasFalsas,
        plat,
        hacia({ 'https://nodejs.org/dist/index.json': '/index.json' }),
      );
      const l = await manipulado.listar('node', { refrescar: true, todas: true });
      log('índice manipulado → origen', l.origen, l.versiones.map((y) => y.version).join(', '));
      expect(l.origen).toBe('fija');
      expect(l.versiones.map((y) => y.version).sort()).toEqual(
        listaFija('node')
          .map((y) => y.version)
          .sort(),
      );
      // Huella manipulada: la descarga real no coincide y no se instala nada.
      const otraHuella = new CatalogoVivo(
        rutasFalsas,
        plat,
        hacia({ [`https://nodejs.org/dist/v${v!.version}/SHASUMS256.txt`]: '/SHASUMS256.txt' }),
      );
      const vm = await otraHuella.buscar('node', v!.version);
      expect(vm?.huella?.valor).toBe('0'.repeat(64));
      const instalador = new Instalador(
        rutasFalsas,
        new Eventos<EventosNucleo>(),
        fetchConCache(log),
      );
      const fallo = await instalador.instalar(vm!).then(
        () => null,
        (e: unknown) => e as Error,
      );
      log('instalar con huella manipulada →', fallo?.message.slice(0, 200));
      expect(fallo).not.toBeNull();
      expect(await instalador.instalado('node', v!.version)).toBe(false);
    },
    20 * MIN,
  );

  // Necesitan el catálogo en vivo (PostgreSQL 16 y MariaDB 11.4.13 no están en la lista fija).
  it.skipIf(!hayRed)(
    '10. instancias paralelas: PostgreSQL 16 y 17 a la vez, cada una con sus credenciales y sus bases',
    async () => {
      const x = n();
      const v17 = await x.buscarVersion('postgresql', '17.12');
      expect(huellaFuerte(v17?.huella ?? null)).toBe(true);
      await medir('instalar postgresql 17.12 (lista fija)', () => x.instalador.instalar(v17!));
      // La primera versión instalada ya es una instancia (la predeterminada): postgresql@17.
      const id17: IdInstancia = 'postgresql@17';
      expect((await x.listaInstancias('postgresql')).map((i) => i.id)).toEqual([id17]);
      await expect(x.crearInstancia('postgresql', '17.12')).rejects.toMatchObject({
        codigo: 'instancias.existe',
      });
      await x.puertoInstancia(id17, PUERTOS.pg17);

      // PostgreSQL 16 no está en la lista fija y EDB no publica huellas: exige confirmar.
      await catalogoVivo(x, 'postgresql');
      const ultima16 = (await x.listarVersiones('postgresql', { rama: '16' }))[0];
      expect(ultima16, 'el catálogo no trae PostgreSQL 16').toBeDefined();
      const v16 = await x.buscarVersion('postgresql', ultima16!.version);
      log('postgresql 16 →', v16?.version, v16?.url, 'huella', v16?.huella);
      expect(huellaFuerte(v16?.huella ?? null)).toBe(false);
      await expect(x.instalador.instalar(v16!)).rejects.toMatchObject({
        codigo: expect.stringMatching(/^catalogo\.(sin_huella|huella_debil)$/),
      });
      expect(await x.instalador.instalado('postgresql', v16!.version)).toBe(false);
      const { id: id16 } = await medir(`nueva rama postgresql ${v16!.version} (confirmada)`, () =>
        x.nuevaRamaServicio('postgresql', v16!.version, { confirmarSinHuella: true }),
      );
      expect(id16).toBe('postgresql@16');
      await x.puertoInstancia(id16, PUERTOS.pg16);

      await medir('iniciar las dos instancias', async () => {
        await x.iniciarInstancia(id17);
        await x.iniciarInstancia(id16);
        await esperarInstancia(x, id17, 'encendido');
        await esperarInstancia(x, id16, 'encendido');
      });
      const lista = (await x.listaInstancias('postgresql')).map((i) => [
        i.id,
        i.version,
        i.puerto,
        i.estado,
      ]);
      log('instancias →', JSON.stringify(lista));
      expect(lista).toEqual(
        expect.arrayContaining([
          [id17, '17.12', PUERTOS.pg17, 'encendido'],
          [id16, v16!.version, PUERTOS.pg16, 'encendido'],
        ]),
      );
      const v1 = (await consultaPg(x, id17, 'postgres', 'show server_version')).rows[0];
      const v2 = (await consultaPg(x, id16, 'postgres', 'show server_version')).rows[0];
      log('server_version →', JSON.stringify(v1), JSON.stringify(v2));
      expect(String(v1.server_version)).toMatch(/^17\.12/);
      expect(String(v2.server_version)).toMatch(/^16\./);

      // Cada una acepta solo sus credenciales.
      const c17 = await x.conexionBd(id17);
      const c16 = await x.conexionBd(id16);
      expect(c17.clave).not.toBe(c16.clave);
      const cruzada = await consultaPg(x, id16, 'postgres', 'select 1', {
        usuario: c17.usuario,
        clave: c17.clave,
      }).then(
        () => null,
        (e: unknown) => e as { code?: string },
      );
      log('credenciales de @17 contra @16 →', cruzada?.code);
      expect(cruzada?.code).toBe('28P01');

      // Una base creada en una no aparece en la otra.
      await x.crearBase(id16, 'solo_en_16');
      expect((await x.listarBases(id16)).map((b) => b.nombre)).toContain('solo_en_16');
      expect((await x.listarBases(id17)).map((b) => b.nombre)).not.toContain('solo_en_16');
      expect(existsSync(path.join(x.rutas.base, 'data', 'postgresql', '16'))).toBe(true);
      expect(existsSync(path.join(x.rutas.base, 'data', 'postgresql', '17'))).toBe(true);
    },
    60 * MIN,
  );

  it(
    '11. migración: la forma vieja de config.json con PostgreSQL inicializado arranca igual y la fila sigue',
    async () => {
      // 1) Una carpeta de datos como la de antes de las instancias: un solo PostgreSQL implícito.
      let x = await Nucleo.crear(opcionesNucleo(baseMigracion));
      nucleoMigracion = x;
      const v = await x.buscarVersion('postgresql', '17.12');
      await medir('instalar postgresql 17.12 en la carpeta vieja', () => x.instalador.instalar(v!));
      await x.cambiarPuertoServicio('postgresql', PUERTOS.pgMigrada);
      await medir('iniciar el PostgreSQL implícito', async () => {
        await x.servicios.iniciar('postgresql');
        await esperar(
          'postgresql encendido',
          async () => {
            const e = (await x.estadoGeneral()).servicios.find((s) => s.id === 'postgresql');
            if (e?.estado === 'error') throw new Error(`postgresql en error: ${e.mensaje ?? ''}`);
            return e?.estado === 'encendido' ? e : null;
          },
          90_000,
        );
      });
      await x.crearBase('postgresql', 'migrada');
      await consultaPg(
        x,
        'postgresql',
        'migrada',
        "create table cosas (id int primary key, nombre text); insert into cosas values (1, 'fila de antes');",
      );
      const antes = await x.conexionBd('postgresql');
      expect(antes.puerto).toBe(PUERTOS.pgMigrada);
      await x.cerrar({ detenerServicios: true });
      nucleoMigracion = null;

      // 2) config.json y credenciales con la forma vieja (sin instancias).
      const rutasMig = new Rutas(baseMigracion);
      const cfgRuta = rutasMig.config();
      const cfg = JSON.parse(readFileSync(cfgRuta, 'utf8')) as {
        servicios: { datos: Record<string, Record<string, unknown>> };
      };
      const pgCfg = cfg.servicios.datos['postgresql']!;
      log('config de postgresql antes de forzar la forma vieja →', JSON.stringify(pgCfg));
      delete pgCfg['instancias'];
      delete pgCfg['predeterminada'];
      pgCfg['version'] = '17.12';
      pgCfg['puerto'] = PUERTOS.pgMigrada;
      writeFileSync(cfgRuta, JSON.stringify(cfg, null, 2));
      const credRuta = rutasMig.credenciales();
      const cred = JSON.parse(readFileSync(credRuta, 'utf8')) as Record<string, unknown>;
      log('credenciales (solo claves) →', Object.keys(cred).join(', '));
      for (const k of Object.keys(cred)) if (k.startsWith('postgresql@')) delete cred[k];
      expect(cred['postgresql']).toBeDefined();
      writeFileSync(credRuta, JSON.stringify(cred, null, 2));
      expect(
        existsSync(path.join(baseMigracion, 'data', 'postgresql', '17', '.pel-inicializado')),
      ).toBe(true);
      const fotoDatos = fotoCarpeta(path.join(baseMigracion, 'data', 'postgresql', '17'));

      // 3) Arranque con la versión nueva: migra.
      x = await medir('arranque con migración', () => Nucleo.crear(opcionesNucleo(baseMigracion)));
      nucleoMigracion = x;
      const insts = await x.listaInstancias('postgresql');
      log(
        'instancias tras migrar →',
        JSON.stringify(insts.map((i) => [i.id, i.puerto, i.predeterminada])),
      );
      expect(insts.map((i) => [i.id, i.version, i.puerto, i.predeterminada])).toEqual([
        ['postgresql@17', '17.12', PUERTOS.pgMigrada, true],
      ]);
      const respaldos = readdirSync(path.join(baseMigracion, 'etc', 'respaldos')).filter((d) =>
        d.startsWith('pre-instancias-'),
      );
      expect(respaldos.length).toBe(1);
      // La migración no tocó la carpeta de datos.
      expect(fotoCarpeta(path.join(baseMigracion, 'data', 'postgresql', '17'))).toEqual(fotoDatos);
      await x.iniciarInstancia('postgresql@17');
      await esperarInstancia(x, 'postgresql@17', 'encendido');
      const despues = await x.conexionBd('postgresql@17');
      expect({ usuario: despues.usuario, clave: despues.clave, puerto: despues.puerto }).toEqual({
        usuario: antes.usuario,
        clave: antes.clave,
        puerto: antes.puerto,
      });
      const filas = await consultaPg(x, 'postgresql@17', 'migrada', 'select nombre from cosas');
      expect(filas.rows).toEqual([{ nombre: 'fila de antes' }]);
      // Segunda vez: nada que migrar.
      await x.cerrar({ detenerServicios: true });
      nucleoMigracion = null;
      x = await Nucleo.crear(opcionesNucleo(baseMigracion));
      nucleoMigracion = x;
      expect(
        readdirSync(path.join(baseMigracion, 'etc', 'respaldos')).filter((d) =>
          d.startsWith('pre-instancias-'),
        ).length,
      ).toBe(1);
      await x.cerrar({ detenerServicios: true });
      nucleoMigracion = null;
    },
    30 * MIN,
  );

  // Necesitan el catálogo en vivo (PostgreSQL 16 y MariaDB 11.4.13 no están en la lista fija).
  it.skipIf(!hayRed)(
    '12. actualización de parche: respaldo (copia y volcado), la fila sigue; si no arranca vuelve atrás',
    async () => {
      const x = n();
      await catalogoVivo(x, 'mariadb');
      const anterior = await x.buscarVersion('mariadb', MARIADB_ANTERIOR);
      expect(anterior, `el catálogo no trae MariaDB ${MARIADB_ANTERIOR}`).not.toBeNull();
      log('mariadb anterior →', anterior!.version, anterior!.origen, anterior!.huella);
      expect(huellaFuerte(anterior!.huella)).toBe(true);
      await medir(`instalar mariadb ${MARIADB_ANTERIOR} (catálogo en vivo)`, () =>
        x.instalador.instalar(anterior!),
      );
      const id: IdInstancia = 'mariadb@11.4';
      expect((await x.listaInstancias('mariadb')).map((i) => [i.id, i.version])).toEqual([
        [id, MARIADB_ANTERIOR],
      ]);
      await x.puertoInstancia(id, PUERTOS.mariadb);
      await x.iniciarInstancia(id);
      await esperarInstancia(x, id, 'encendido');
      await x.crearBase(id, 'parche');
      await consultaMaria(
        x,
        id,
        'parche',
        'create table cosas (id int primary key, nombre varchar(40))',
      );
      await consultaMaria(x, id, 'parche', "insert into cosas values (1, 'antes del parche')");
      const fija = await x.buscarVersion('mariadb', MARIADB_FIJA);
      expect(fija?.origen === 'fija' || huellaFuerte(fija?.huella ?? null)).toBe(true);
      const r = await medir(`actualizar ${id} a ${MARIADB_FIJA}`, () =>
        x.actualizarServicio(id, MARIADB_FIJA),
      );
      log('actualizar →', JSON.stringify(r));
      expect(r.anterior).toBe(MARIADB_ANTERIOR);
      expect(existsSync(r.respaldo.carpeta)).toBe(true);
      expect(existsSync(path.join(r.respaldo.carpeta, '.pel-inicializado'))).toBe(true);
      expect(r.respaldo.volcados.some((v) => /parche/.test(path.basename(v)))).toBe(true);
      for (const v of r.respaldo.volcados) expect(statSync(v).size).toBeGreaterThan(0);
      expect(
        readFileSync(
          r.respaldo.volcados.find((v) => /parche/.test(v))!,
          'utf8',
        ),
      ).toContain('antes del parche');
      await esperarInstancia(x, id, 'encendido');
      const inst = (await x.listaInstancias('mariadb')).find((i) => i.id === id)!;
      expect(inst.version).toBe(MARIADB_FIJA);
      const ver = (await consultaMaria(x, id, 'parche', 'select version() as v')) as {
        v: string;
      }[];
      expect(ver[0]!.v).toContain(MARIADB_FIJA);
      expect(await consultaMaria(x, id, 'parche', 'select nombre from cosas')).toEqual([
        { nombre: 'antes del parche' },
      ]);
      await consultaMaria(x, id, 'parche', "insert into cosas values (2, 'después del parche')");

      // Arranque forzado a fallar: el ejecutable de la otra versión (ya sin uso) se estropea.
      const exe = path.join(x.rutas.bin('mariadb', MARIADB_ANTERIOR), 'bin', 'mariadbd.exe');
      expect(existsSync(exe)).toBe(true);
      writeFileSync(exe, 'esto no es un ejecutable');
      const fallo = await medir('actualizar con arranque fallido', () =>
        x.actualizarServicio(id, MARIADB_ANTERIOR).then(
          () => null,
          (e: unknown) => e as { codigo?: string; message?: string },
        ),
      );
      log('actualizar a un binario roto →', fallo?.codigo, fallo?.message?.slice(0, 300));
      expect(fallo?.codigo).toBe('servicios.actualizacion_revertida');
      await esperarInstancia(x, id, 'encendido');
      const tras = (await x.listaInstancias('mariadb')).find((i) => i.id === id)!;
      expect(tras.version).toBe(MARIADB_FIJA);
      expect(tras.bloqueo ?? null).toBeNull();
      expect(await consultaMaria(x, id, 'parche', 'select nombre from cosas order by id')).toEqual([
        { nombre: 'antes del parche' },
        { nombre: 'después del parche' },
      ]);
      const copias = (await x.respaldosDeDatos('mariadb')).map((c) => c.tipo).sort();
      log('copias de mariadb →', JSON.stringify(copias));
      expect(copias).toEqual(expect.arrayContaining(['respaldo', 'volcados', 'fallida']));
    },
    40 * MIN,
  );

  // Necesitan el catálogo en vivo (PostgreSQL 16 y MariaDB 11.4.13 no están en la lista fija).
  it.skipIf(!hayRed)(
    '13. desinstalar la versión de una instancia apagada deja su carpeta de datos igual',
    async () => {
      const x = n();
      const id: IdInstancia = 'postgresql@16';
      const version = (await x.listaInstancias('postgresql')).find((i) => i.id === id)!.version;
      await x.detenerInstancia(id);
      await esperarInstancia(x, id, 'apagado');
      const datos = path.join(x.rutas.base, 'data', 'postgresql', '16');
      const foto = fotoCarpeta(datos);
      expect(foto.length).toBeGreaterThan(100);
      const primero = await x.desinstalarVersion('postgresql', version).then(
        () => null,
        (e: unknown) => e as { codigo?: string },
      );
      log(`desinstalar postgresql ${version} con la instancia apagada →`, primero?.codigo ?? 'ok');
      expect(fotoCarpeta(datos)).toEqual(foto);
      if (primero) {
        // En uso por la instancia (aunque apagada): se quita la instancia (los datos quedan).
        expect(primero.codigo).toBe('instalador.version_en_uso');
        await x.quitarInstancia(id);
        expect(fotoCarpeta(datos)).toEqual(foto);
        await x.desinstalarVersion('postgresql', version);
      }
      expect(await x.instalador.instalado('postgresql', version)).toBe(false);
      expect(existsSync(x.rutas.bin('postgresql', version))).toBe(false);
      expect(fotoCarpeta(datos)).toEqual(foto);
      // La otra instancia sigue encendida y sin cambios.
      expect(
        (await x.listaInstancias('postgresql')).find((i) => i.id === 'postgresql@17')?.estado,
      ).toBe('encendido');
    },
    10 * MIN,
  );

  it(
    '14. sin ventanas visibles ni procesos huérfanos al terminar',
    async () => {
      const x = n();
      const ventanas: string[] = [];
      for (let i = 0; i < 3; i++) {
        ventanas.push(...ventanasDeBase(base), ...ventanasDeBase(baseMigracion));
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
        await x.cerrar({ detenerServicios: true });
      });
      nucleo = null;
      let restantes: string[] = [];
      try {
        restantes = await esperar(
          'que terminen los procesos',
          async () => {
            const p = [...procesosQueMencionan(base), ...procesosQueMencionan(baseMigracion)];
            return p.length === 0 ? p : null;
          },
          30_000,
        );
      } catch {
        restantes = [...procesosQueMencionan(base), ...procesosQueMencionan(baseMigracion)];
      }
      log('procesos después de apagar:', JSON.stringify(restantes));
      expect(restantes).toEqual([]);
      expect([...ventanasDeBase(base), ...ventanasDeBase(baseMigracion)]).toEqual([]);
    },
    5 * MIN,
  );
});
