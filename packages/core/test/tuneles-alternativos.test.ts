import { EventEmitter } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';
import type { Ejecutor } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Supervisor } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { UrlBase } from '../src/sitios/urlbase';
import { SitioSchema, type Sitio } from '../src/tipos';
import {
  alcanceDe,
  modoTailscaleDe,
  tokenTunelValido,
  TunelSitioSchema,
  type SecretosTunel,
} from '../src/tuneles/proveedor';
import { puertoEnUso } from '../src/tuneles/tailscale';
import { Tuneles } from '../src/tuneles/tuneles';

const CENTINELA = 'centinela-secreta-d';
/** Token falso con la forma de los reales (letras, números, guion bajo). */
const TOKEN_NGROK = 'ngrok-prueba-falsa-centinela-secreta-d';
const TOKEN_EXPOSE = 'expose-prueba-falsa-centinela-secreta-d';

const SALIDA_NGROK = [
  '{"lvl":"info","msg":"no config file found at default location","obj":"app"}',
  '{"addr":"http://localhost:8080","lvl":"info","msg":"started tunnel","name":"command_line","obj":"tunnels","url":"https://abc-123.ngrok-free.app"}',
].join('\n');
const SALIDA_EXPOSE = [
  ' Shared site     http://wolf.test:8080',
  ' Dashboard       http://127.0.0.1:55555',
  ' Public URL      https://magic-cat.sharedwithexpose.com',
].join('\n');
const SALIDA_SERVE = [
  'Available within your tailnet:',
  '',
  'https://mi-pc.tail1234.ts.net:8443/',
  '|-- / proxy http://127.0.0.1:8080',
  '',
  'Press Ctrl+C to exit.',
].join('\n');
const SALIDA_FUNNEL = SALIDA_SERVE.replace('within your tailnet', 'on the internet');

/** Toda apertura exige la confirmación del usuario. */
const SI = { confirmado: true };

let base: string;
let carpeta: string;
let rutas: Rutas;
let eventos: Eventos<EventosNucleo>;
let iniciados: DefProceso[];
let estados: Map<string, EstadoProceso>;
let pids: Map<string, number>;
let salidas: Array<(id: string, c: number | null) => void>;
let almacen: Map<string, string>;
let cifrado: boolean;
let sitios: Sitio[];
let salidaProceso: string;
let ejecutables: Map<string, string>;
let tailscaleEstado: { ruta: string | null; sesion: boolean };
let estadoServe: string;
let llamadas: Array<{ cmd: string; args: string[]; quitar?: readonly string[] }>;
let restringidos: string[];
let phpRuta: string | null;
let restringirOk: boolean;

const sitio = (extra: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'wolf',
    nombre: 'Wolf',
    dominio: 'wolf.test',
    carpeta,
    tipo: 'estatico',
    urlBaseVar: 'APP_URL',
    tunel: { proveedor: 'ngrok' },
    ...extra,
  });

const supervisor = () =>
  ({
    iniciar: async (d: DefProceso) => {
      iniciados.push(d);
      estados.set(d.id, 'iniciando');
      pids.set(d.id, 4242);
      mkdirSync(path.dirname(d.log), { recursive: true });
      writeFileSync(d.log, salidaProceso);
    },
    detener: async (id: string) => {
      estados.delete(id);
      pids.delete(id);
    },
    estado: (id: string) => estados.get(id) ?? 'apagado',
    pid: (id: string) => pids.get(id) ?? null,
    ids: () => [...estados.keys()],
    alSalir: (fn: (id: string, c: number | null) => void) => salidas.push(fn),
  }) as never;

const ejecutor: Ejecutor = async (cmd, args, opts) => {
  llamadas.push({ cmd, args, ...(opts?.quitarEntorno ? { quitar: opts.quitarEntorno } : {}) });
  if (args.join(' ') === 'serve status --json') {
    return { codigo: 0, stdout: estadoServe, stderr: '' };
  }
  return { codigo: 0, stdout: '', stderr: '' };
};

const secretos: SecretosTunel = {
  disponible: () => cifrado,
  leer: async (id) => almacen.get(id) ?? null,
  guardar: async (id, v) => {
    almacen.set(id, v);
  },
  borrar: async (id) => {
    almacen.delete(id);
  },
};

const plataforma = () => ({
  restringirAlUsuario: async (r: string) => {
    restringidos.push(r);
    return restringirOk;
  },
  buscarEjecutable: async (n: string) => ejecutables.get(n) ?? null,
  tailscale: async () => ({ ...tailscaleEstado }),
});

function crear(opts = { esperaMs: 300, intervaloMs: 10 }) {
  const t = new Tuneles({
    supervisor: supervisor(),
    sitios: { listar: async () => sitios },
    almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
    // Sin cloudflared instalado: ninguno de estos proveedores lo necesita.
    instalador: { instalados: async () => [] } as never,
    rutas,
    urlBase: new UrlBase({
      rutas,
      ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
    }),
    eventos,
    opts,
    plataforma: plataforma() as never,
    ejecutor,
    secretos: () => secretos,
    phpCli: async () => phpRuta,
  });
  return t;
}

const env = () => path.join(carpeta, '.env');
const ENV_ORIGINAL = 'APP_NAME=Wolf\nAPP_URL=http://wolf.test\n';

function archivos(dir: string): string[] {
  const salida: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) salida.push(...archivos(p));
    else salida.push(p);
  }
  return salida;
}

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-talt-'));
  carpeta = path.join(base, 'proyecto');
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(env(), ENV_ORIGINAL);
  rutas = new Rutas(path.join(base, 'datos'));
  eventos = new Eventos<EventosNucleo>();
  iniciados = [];
  estados = new Map();
  pids = new Map();
  salidas = [];
  almacen = new Map([
    ['tunel:ngrok', TOKEN_NGROK],
    ['tunel:expose', TOKEN_EXPOSE],
  ]);
  cifrado = true;
  sitios = [sitio()];
  salidaProceso = SALIDA_NGROK;
  ejecutables = new Map([['ngrok', 'C:\\falso\\ngrok.exe']]);
  tailscaleEstado = { ruta: 'C:\\falso\\tailscale.exe', sesion: true };
  estadoServe = '{}';
  llamadas = [];
  restringidos = [];
  phpRuta = 'C:\\falso\\php.exe';
  restringirOk = true;
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('esquema y alcance', () => {
  it('el modo solo existe con Tailscale y Serve es el predeterminado', () => {
    expect(TunelSitioSchema.safeParse({ proveedor: 'ngrok', modo: 'funnel' }).success).toBe(false);
    expect(TunelSitioSchema.safeParse({ proveedor: 'tailscale', modo: 'funnel' }).success).toBe(
      true,
    );
    expect(modoTailscaleDe({ proveedor: 'tailscale' })).toBe('serve');
    expect(modoTailscaleDe({ proveedor: 'tailscale', modo: 'funnel' })).toBe('funnel');
  });

  it('Serve llega solo a la tailnet; Funnel y los demás, a internet', () => {
    expect(alcanceDe({ proveedor: 'tailscale' })).toBe('tailnet');
    expect(alcanceDe({ proveedor: 'tailscale', modo: 'serve' })).toBe('tailnet');
    expect(alcanceDe({ proveedor: 'tailscale', modo: 'funnel' })).toBe('internet');
    expect(alcanceDe({ proveedor: 'ngrok' })).toBe('internet');
    expect(alcanceDe({ proveedor: 'expose' })).toBe('internet');
    expect(alcanceDe(undefined)).toBe('internet');
  });

  it('el token solo admite letras, números y _ . -', () => {
    expect(tokenTunelValido(TOKEN_NGROK)).toBe(true);
    for (const malo of [
      'corto',
      'con espacio 12345',
      "x'; system('x');12345",
      'a\nb123456789',
      1,
    ]) {
      expect(tokenTunelValido(malo), String(malo)).toBe(false);
    }
  });
});

describe('ngrok', () => {
  it('el token viaja solo en NGROK_AUTHTOKEN del proceso: nunca en los argumentos ni en env', async () => {
    const t = crear();
    const e = await t.abrir('wolf', SI);
    expect(e).toMatchObject({ estado: 'activo', url: 'https://abc-123.ngrok-free.app' });
    const d = iniciados[0]!;
    expect(d.envSecreto).toEqual({ NGROK_AUTHTOKEN: TOKEN_NGROK });
    expect(JSON.stringify(d.args)).not.toContain(CENTINELA);
    expect(d.args).not.toContain('--authtoken');
    expect(JSON.stringify(d.env ?? {})).not.toContain(CENTINELA);
  });

  it('no usa la configuración global: --config propio y mínimo en los datos, sin NGROK_* heredado', async () => {
    await crear().abrir('wolf', SI);
    const d = iniciados[0]!;
    const cfg = path.join(rutas.ngrokRun(), 'wolf.yml');
    expect(d.args[d.args.indexOf('--config') + 1]).toBe(cfg);
    expect(d.quitarEntorno).toEqual(['NGROK_']);
    expect(readFileSync(cfg, 'utf8')).toBe('version: "3"\n');
    expect(d.args.slice(0, 2)).toEqual(['http', '8080']);
    expect(d.args).toContain('--inspect=false');
    expect(d.args[d.args.indexOf('--log') + 1]).toBe('stdout');
    expect(d.args[d.args.indexOf('--log-format') + 1]).toBe('json');
    expect(d.comando).toBe('C:\\falso\\ngrok.exe');
    expect(restringidos).toContain(rutas.ngrokRun());
  });

  it('el Host se reescribe al dominio del sitio con una política de tráfico (no con --host-header)', async () => {
    await crear().abrir('wolf', SI);
    const d = iniciados[0]!;
    expect(d.args).not.toContain('--host-header');
    const pol = d.args[d.args.indexOf('--traffic-policy-file') + 1]!;
    expect(pol).toBe(path.join(rutas.ngrokRun(), 'wolf.politica.yml'));
    const yml = readFileSync(pol, 'utf8');
    expect(yml).toContain('type: add-headers');
    expect(yml).toContain('host: "wolf.test"');
    expect(yml).not.toContain(CENTINELA);
  });

  it('la URL sale de la línea started tunnel del log JSON (otras líneas y basura no valen)', async () => {
    salidaProceso = [
      'basura que no es JSON',
      '{"msg":"started tunnel","url":"http://inseguro.example"}',
      '{"msg":"otra cosa","url":"https://no.example"}',
      SALIDA_NGROK.split('\n')[1],
    ].join('\n');
    const e = await crear().abrir('wolf', SI);
    expect(e.url).toBe('https://abc-123.ngrok-free.app');
  });

  it('un error con el token en el log no lo deja: el log y log() salen sin él al cerrar', async () => {
    salidaProceso = `${SALIDA_NGROK}\nfallo con authtoken ${TOKEN_NGROK}`;
    const t = crear();
    await t.abrir('wolf', SI);
    expect(t.log('wolf')).not.toContain(CENTINELA);
    await t.cerrar('wolf');
    for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
  });

  it('cerrar restaura el .env y borra la configuración y la política', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL=https://abc-123.ngrok-free.app/');
    await t.cerrar('wolf');
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    expect(existsSync(path.join(rutas.ngrokRun(), 'wolf.yml'))).toBe(false);
    expect(existsSync(path.join(rutas.ngrokRun(), 'wolf.politica.yml'))).toBe(false);
  });

  it('sin ngrok instalado, sin token o sin cifrado: error con código y no se lanza nada', async () => {
    ejecutables.delete('ngrok');
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.ngrok_no_instalado',
    });
    ejecutables.set('ngrok', 'C:\\falso\\ngrok.exe');
    almacen.delete('tunel:ngrok');
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.ngrok_sin_token',
    });
    almacen.set('tunel:ngrok', TOKEN_NGROK);
    cifrado = false;
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.sin_cifrado',
    });
    expect(iniciados).toEqual([]);
  });

  it('un token guardado alterado no llega al entorno', async () => {
    almacen.set('tunel:ngrok', "x'; rm -rf /; 123456");
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.token_invalido',
    });
    expect(iniciados).toEqual([]);
  });

  it('exige la confirmación como cualquier proveedor', async () => {
    await expect(crear().abrir('wolf')).rejects.toMatchObject({
      codigo: 'tuneles.confirmacion_requerida',
    });
    expect(iniciados).toEqual([]);
    expect(existsSync(rutas.ngrokRun())).toBe(false);
  });

  it('un cierre inesperado devuelve el .env y limpia lo temporal', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    estados.delete('tunel-wolf');
    for (const f of salidas) f('tunel-wolf', 1);
    for (let i = 0; i < 100 && readFileSync(env(), 'utf8') !== ENV_ORIGINAL; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    expect(existsSync(path.join(rutas.ngrokRun(), 'wolf.yml'))).toBe(false);
  });
});

describe('Expose', () => {
  beforeEach(() => {
    sitios = [sitio({ tunel: { proveedor: 'expose' } })];
    salidaProceso = SALIDA_EXPOSE;
    ejecutables = new Map();
    mkdirSync(rutas.exposeBin(), { recursive: true });
    writeFileSync(path.join(rutas.exposeBin(), 'expose.phar'), 'phar falso');
  });

  it('el token solo va en el archivo de configuración restringido: no en args, env ni envSecreto', async () => {
    const t = crear();
    const e = await t.abrir('wolf', SI);
    expect(e).toMatchObject({ estado: 'activo', url: 'https://magic-cat.sharedwithexpose.com' });
    const d = iniciados[0]!;
    const cfg = path.join(rutas.exposeRun(), 'wolf.php');
    expect(d.env?.['EXPOSE_CONFIG_FILE']).toBe(cfg);
    expect(JSON.stringify(d.args)).not.toContain(CENTINELA);
    expect(d.args.join(' ')).not.toMatch(/--auth|-v\b/);
    expect(JSON.stringify(d.env)).not.toContain(CENTINELA);
    expect(d.envSecreto).toBeUndefined();
    expect(restringidos).toEqual(expect.arrayContaining([rutas.exposeRun(), cfg]));
    const php = readFileSync(cfg, 'utf8');
    expect(php).toContain(`'auth_token' => '${TOKEN_EXPOSE}'`);
    expect(php.startsWith('<?php')).toBe(true);
  });

  it('ejecuta el phar con el PHP de la app, con su propio inicio y sin EXPOSE_* heredado', async () => {
    await crear().abrir('wolf', SI);
    const d = iniciados[0]!;
    expect(d.comando).toBe('C:\\falso\\php.exe');
    expect(d.args).toEqual([
      path.join(rutas.exposeBin(), 'expose.phar'),
      'share',
      'http://wolf.test:8080',
      '--no-vite-detection',
    ]);
    expect(d.quitarEntorno).toEqual(['EXPOSE_']);
    const inicio = path.join(rutas.exposeRun(), 'inicio-wolf');
    expect(d.env?.['HOME']).toBe(inicio);
    expect(d.env?.['USERPROFILE']).toBe(inicio);
    expect(d.cwd).toBe(rutas.exposeRun());
  });

  it('un expose del PATH se usa tal cual, sin PHP', async () => {
    ejecutables.set('expose', 'C:\\falso\\expose.exe');
    phpRuta = null;
    await crear().abrir('wolf', SI);
    expect(iniciados[0]!.comando).toBe('C:\\falso\\expose.exe');
    expect(iniciados[0]!.args[0]).toBe('share');
  });

  it('si el archivo con el token no se puede restringir al usuario, no se usa', async () => {
    restringirOk = false;
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.credencial_no_protegida',
    });
    expect(iniciados).toEqual([]);
    expect(existsSync(path.join(rutas.exposeRun(), 'wolf.php'))).toBe(false);
  });

  it('cerrar borra el archivo con el token y restaura el .env', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    expect(existsSync(path.join(rutas.exposeRun(), 'wolf.php'))).toBe(true);
    await t.cerrar('wolf');
    expect(existsSync(path.join(rutas.exposeRun(), 'wolf.php'))).toBe(false);
    expect(existsSync(path.join(rutas.exposeRun(), 'inicio-wolf'))).toBe(false);
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
  });

  it('al arrancar tras una caída se borra el archivo con token que no tiene túnel vivo', async () => {
    mkdirSync(rutas.exposeRun(), { recursive: true });
    writeFileSync(
      path.join(rutas.exposeRun(), 'huerfano.php'),
      `<?php return ['auth_token'=>'${TOKEN_EXPOSE}'];`,
    );
    mkdirSync(path.join(rutas.exposeRun(), 'inicio-huerfano'), { recursive: true });
    await crear().restaurar();
    expect(readdirSync(rutas.exposeRun())).toEqual([]);
  });

  it('la URL sale de la tabla de conexión (con colores ANSI también)', async () => {
    salidaProceso =
      '\u001b[1mPublic URL\u001b[0m   \u001b[32mhttps://otro-gato.sharedwithexpose.com\u001b[0m';
    const e = await crear().abrir('wolf', SI);
    expect(e.url).toBe('https://otro-gato.sharedwithexpose.com');
  });

  it('sin Expose instalado, sin token o con un token alterado: error con código', async () => {
    rmSync(rutas.exposeBin(), { recursive: true, force: true });
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.expose_no_instalado',
    });
    writeFileSync(
      path.join(
        (mkdirSync(rutas.exposeBin(), { recursive: true }), rutas.exposeBin()),
        'expose.phar',
      ),
      'x',
    );
    almacen.delete('tunel:expose');
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.expose_sin_token',
    });
    almacen.set('tunel:expose', "x');system('calc');//12345");
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.token_invalido',
    });
    expect(iniciados).toEqual([]);
  });

  it('exige la confirmación y no escribe nada sin ella', async () => {
    await expect(crear().abrir('wolf')).rejects.toMatchObject({
      codigo: 'tuneles.confirmacion_requerida',
    });
    expect(existsSync(rutas.exposeRun())).toBe(false);
  });
});

describe('Tailscale', () => {
  beforeEach(() => {
    sitios = [sitio({ tunel: { proveedor: 'tailscale' } })];
    salidaProceso = SALIDA_SERVE;
  });

  it('no instalado: error con código y no se intenta instalar ni lanzar nada', async () => {
    tailscaleEstado = { ruta: null, sesion: false };
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.tailscale_no_instalado',
    });
    expect(iniciados).toEqual([]);
    expect(llamadas).toEqual([]);
  });

  it('sin sesión: error con código', async () => {
    tailscaleEstado = { ruta: 'C:\\falso\\tailscale.exe', sesion: false };
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.tailscale_sin_sesion',
    });
    expect(iniciados).toEqual([]);
  });

  it('Serve por defecto: primer plano (sin --bg), puerto propio, sin tocar la configuración del usuario', async () => {
    const e = await crear().abrir('wolf', SI);
    expect(e).toMatchObject({ estado: 'activo', url: 'https://mi-pc.tail1234.ts.net:8443' });
    const d = iniciados[0]!;
    expect(d.comando).toBe('C:\\falso\\tailscale.exe');
    expect(d.args).toEqual(['serve', '--https=8443', 'http://127.0.0.1:8080']);
    expect(d.args).not.toContain('--bg');
    expect(d.args).not.toContain('--yes');
    expect(d.quitarEntorno).toEqual(['TS_', 'TAILSCALE_']);
    expect(d.envSecreto).toBeUndefined();
    // Solo se consultó el estado; nunca reset ni off.
    expect(llamadas.map((l) => l.args.join(' '))).toEqual(['serve status --json']);
  });

  it('Funnel: el modo elegido llega al comando', async () => {
    sitios = [sitio({ tunel: { proveedor: 'tailscale', modo: 'funnel' } })];
    salidaProceso = SALIDA_FUNNEL;
    await crear().abrir('wolf', SI);
    expect(iniciados[0]!.args).toEqual(['funnel', '--https=8443', 'http://127.0.0.1:8080']);
  });

  it('si el usuario ya publica en el puerto 8443, no se abre ni se pisa', async () => {
    estadoServe = JSON.stringify({
      TCP: { '8443': { HTTPS: true } },
      Web: {
        'mi-pc.tail1234.ts.net:8443': { Handlers: { '/': { Proxy: 'http://127.0.0.1:3000' } } },
      },
    });
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.tailscale_puerto_ocupado',
    });
    expect(iniciados).toEqual([]);
    expect(puertoEnUso('{}', 8443)).toBe(false);
    expect(puertoEnUso('', 8443)).toBe(false);
    expect(puertoEnUso('{"TCP":{"443":{}}}', 8443)).toBe(false);
    expect(puertoEnUso('no es json', 8443)).toBe(true);
  });

  it('cerrar restaura el .env', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL=https://mi-pc.tail1234.ts.net:8443/');
    await t.cerrar('wolf');
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
  });

  it('la confirmación de Serve no vale para Funnel (y al revés): confirmacion_obsoleta', async () => {
    sitios = [sitio({ tunel: { proveedor: 'tailscale', modo: 'funnel' } })];
    const t = crear();
    await expect(
      t.abrir('wolf', {
        confirmado: true,
        tunelConfirmado: { proveedor: 'tailscale', modo: 'serve' },
      }),
    ).rejects.toMatchObject({ codigo: 'tuneles.confirmacion_obsoleta' });
    expect(iniciados).toEqual([]);
    sitios = [sitio({ tunel: { proveedor: 'tailscale' } })];
    await expect(
      t.abrir('wolf', {
        confirmado: true,
        tunelConfirmado: { proveedor: 'tailscale', modo: 'funnel' },
      }),
    ).rejects.toMatchObject({ codigo: 'tuneles.confirmacion_obsoleta' });
    // Sin modo explícito = Serve.
    const e = await t.abrir('wolf', {
      confirmado: true,
      tunelConfirmado: { proveedor: 'tailscale' },
    });
    expect(e.estado).toBe('activo');
  });

  it('exige la confirmación', async () => {
    await expect(crear().abrir('wolf')).rejects.toMatchObject({
      codigo: 'tuneles.confirmacion_requerida',
    });
    expect(llamadas).toEqual([]);
  });
});

describe('elegir proveedor', () => {
  it('ngrok, Expose y Tailscale se pueden elegir y se guardan sin secretos', async () => {
    const guardados: unknown[] = [];
    const t = new Tuneles({
      supervisor: supervisor(),
      sitios: { listar: async () => sitios },
      almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
      instalador: { instalados: async () => [] } as never,
      rutas,
      urlBase: new UrlBase({
        rutas,
        ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
      }),
      eventos,
      plataforma: plataforma() as never,
      ejecutor,
      secretos: () => secretos,
      guardarTunel: async (_id, tunel) => {
        guardados.push(tunel);
      },
    });
    await t.elegirProveedor('wolf', { proveedor: 'ngrok' });
    await t.elegirProveedor('wolf', { proveedor: 'expose' });
    await t.elegirProveedor('wolf', { proveedor: 'tailscale', modo: 'funnel' });
    expect(guardados).toEqual([
      { proveedor: 'ngrok' },
      { proveedor: 'expose' },
      { proveedor: 'tailscale', modo: 'funnel' },
    ]);
    expect(JSON.stringify(guardados)).not.toContain(CENTINELA);
  });
});

describe('ngrok y Expose con el Supervisor real', () => {
  async function conSupervisor(
    proveedor: 'ngrok' | 'expose',
    salida: string,
    eco: string,
  ): Promise<{ entorno: NodeJS.ProcessEnv | undefined; t: Tuneles; cerrar: () => Promise<void> }> {
    const entornos: Array<NodeJS.ProcessEnv | undefined> = [];
    const vivos = new Set<number>();
    const sup = new Supervisor(
      rutas,
      {
        procesoVivo: async (pid: number) => ({ vivo: vivos.has(pid), ejecutable: 'x.exe' }),
        matarArbol: async (pid: number) => {
          vivos.delete(pid);
        },
        inicioProceso: async () => null,
      } as never,
      eventos,
      {
        intervaloMs: 60_000,
        lanzarOculto: null,
        sonda: async () => true,
        spawn: ((_c: string, _a: string[], o: { env?: NodeJS.ProcessEnv; stdio?: unknown }) => {
          entornos.push(o.env);
          // El proceso falso escribe en el log del supervisor lo que diría el real.
          const log = (iniciadosSup.at(-1) as { log?: string } | undefined)?.log;
          if (log) {
            mkdirSync(path.dirname(log), { recursive: true });
            writeFileSync(log, `${salida}\nfallo con ${eco}`);
          }
          vivos.add(7000);
          return Object.assign(new EventEmitter(), { pid: 7000, unref: () => undefined });
        }) as never,
      },
    );
    const iniciadosSup: DefProceso[] = [];
    const original = sup.iniciar.bind(sup);
    sup.iniciar = (d: DefProceso) => {
      iniciadosSup.push(d);
      return original(d);
    };
    sitios = [sitio({ tunel: { proveedor } })];
    const t = new Tuneles({
      supervisor: sup,
      sitios: { listar: async () => sitios },
      almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
      instalador: { instalados: async () => [] } as never,
      rutas,
      urlBase: new UrlBase({
        rutas,
        ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
      }),
      eventos,
      opts: { esperaMs: 500, intervaloMs: 10 },
      plataforma: plataforma() as never,
      ejecutor,
      secretos: () => secretos,
      phpCli: async () => phpRuta,
    });
    return {
      get entorno() {
        return entornos[0];
      },
      t,
      cerrar: async () => {
        await sup.cerrar().catch(() => undefined);
      },
    };
  }

  it('ngrok: el proceso recibe el token y no el NGROK_* ajeno; estado.json y eventos no lo llevan', async () => {
    const h = await conSupervisor('ngrok', SALIDA_NGROK, TOKEN_NGROK);
    const emitidos: unknown[] = [];
    eventos.on('tunel:estado', (e) => emitidos.push(e));
    process.env['NGROK_AUTHTOKEN'] = 'heredado-ajeno-no-debe-llegar';
    process.env['NGROK_API_KEY'] = 'heredada-ajena-no-debe-llegar';
    try {
      const e = await h.t.abrir('wolf', SI);
      expect(e.estado).toBe('activo');
      expect(h.entorno?.['NGROK_AUTHTOKEN']).toBe(TOKEN_NGROK);
      expect(h.entorno?.['NGROK_API_KEY']).toBeUndefined();
      expect(readFileSync(rutas.estado(), 'utf8')).not.toContain(CENTINELA);
      expect(JSON.stringify(emitidos)).not.toContain(CENTINELA);
      await h.t.cerrar('wolf');
      for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
    } finally {
      delete process.env['NGROK_AUTHTOKEN'];
      delete process.env['NGROK_API_KEY'];
      await h.cerrar();
    }
  });

  it('Expose: el entorno no lleva el token ni EXPOSE_* ajeno; estado.json no lo lleva', async () => {
    mkdirSync(rutas.exposeBin(), { recursive: true });
    writeFileSync(path.join(rutas.exposeBin(), 'expose.phar'), 'phar falso');
    ejecutables = new Map();
    const h = await conSupervisor('expose', SALIDA_EXPOSE, TOKEN_EXPOSE);
    process.env['EXPOSE_CONFIG_FILE'] = 'C:\\ajeno\\config.php';
    try {
      const e = await h.t.abrir('wolf', SI);
      expect(e.estado).toBe('activo');
      expect(h.entorno?.['EXPOSE_CONFIG_FILE']).toBe(path.join(rutas.exposeRun(), 'wolf.php'));
      expect(JSON.stringify(h.entorno)).not.toContain(CENTINELA);
      expect(readFileSync(rutas.estado(), 'utf8')).not.toContain(CENTINELA);
      await h.t.cerrar('wolf');
      for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
    } finally {
      delete process.env['EXPOSE_CONFIG_FILE'];
      await h.cerrar();
    }
  });
});

describe('Plataforma.tailscale', () => {
  it('la falsa devuelve lo que se le configura (por defecto, no instalado)', async () => {
    const p = new PlataformaFalsa();
    expect(await p.tailscale()).toEqual({ ruta: null, sesion: false });
    p.tailscaleEstado = { ruta: '/t', sesion: true };
    expect(await p.tailscale()).toEqual({ ruta: '/t', sesion: true });
  });

  describe.skipIf(process.platform !== 'win32')('Windows (sin ejecutar el Tailscale real)', () => {
    const EXE = String.raw`C:\Program Files\Tailscale\tailscale.exe`;
    const montar = (stdout: string, codigo = 0, instalado = true) => {
      const llamadas: Array<{ args: string[]; quitar?: readonly string[] }> = [];
      const p = new PlataformaWindows(
        async (_c, args, o) => {
          llamadas.push({ args, ...(o?.quitarEntorno ? { quitar: o.quitarEntorno } : {}) });
          return { codigo, stdout, stderr: '' };
        },
        undefined,
        {
          entorno: { ProgramFiles: String.raw`C:\Program Files`, Path: '' },
          existeRuta: (r) => instalado && r.toLowerCase() === EXE.toLowerCase(),
        },
      );
      return { p, llamadas };
    };

    it('sin el ejecutable: no instalado y no se ejecuta nada', async () => {
      const { p, llamadas } = montar('', 0, false);
      expect(await p.tailscale()).toEqual({ ruta: null, sesion: false });
      expect(llamadas).toEqual([]);
    });

    it('solo lee: status --json, sin TS_* heredado; con sesión si el backend está en marcha', async () => {
      const { p, llamadas } = montar('{"BackendState":"Running"}');
      expect(await p.tailscale()).toEqual({ ruta: EXE, sesion: true });
      expect(llamadas).toEqual([{ args: ['status', '--json'], quitar: ['TS_', 'TAILSCALE_'] }]);
    });

    it('sin sesión (NeedsLogin, Stopped, salida rara o error): sesion false', async () => {
      for (const stdout of ['{"BackendState":"NeedsLogin"}', '{"BackendState":"Stopped"}', 'x']) {
        expect(await montar(stdout).p.tailscale()).toEqual({ ruta: EXE, sesion: false });
      }
      expect(await montar('', 1).p.tailscale()).toEqual({ ruta: EXE, sesion: false });
    });
  });
});
