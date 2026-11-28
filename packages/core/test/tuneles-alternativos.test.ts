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
import { VhostsAuxiliares } from '../src/nginx/auxiliares';
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
/** Versiones de ngrok instaladas desde Versiones (`bin/ngrok/<versión>`). */
let ngrokInstalados: string[];
let tailscaleEstado: { ruta: string | null; sesion: boolean };
let estadoServe: string;
let llamadas: Array<{ cmd: string; args: string[]; quitar?: readonly string[] }>;
let restringidos: string[];
let phpRuta: string | null;
let restringirOk: boolean;
/** Lo que decía el archivo de configuración de Expose cuando se lanzó el proceso. */
let configVisto: string | null;
let recargas: number;
let falloRecarga: boolean;
let vhosts: VhostsAuxiliares;

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
      const cfgExpose = d.env?.['EXPOSE_CONFIG_FILE'];
      if (cfgExpose && existsSync(cfgExpose)) configVisto = readFileSync(cfgExpose, 'utf8');
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
    instalador: {
      instalados: async (s: string) => (s === 'ngrok' ? ngrokInstalados : []),
    } as never,
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
    vhostsAux: vhosts,
    puertoLibre: async () => 41234,
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
  ngrokInstalados = [];
  salidaProceso = SALIDA_NGROK;
  ejecutables = new Map([['ngrok', 'C:\\falso\\ngrok.exe']]);
  tailscaleEstado = { ruta: 'C:\\falso\\tailscale.exe', sesion: true };
  estadoServe = '{}';
  llamadas = [];
  restringidos = [];
  phpRuta = 'C:\\falso\\php.exe';
  restringirOk = true;
  configVisto = null;
  recargas = 0;
  falloRecarga = false;
  vhosts = new VhostsAuxiliares({
    rutas,
    recargar: async () => {
      recargas++;
      if (falloRecarga) throw new Error('nginx -t falló');
    },
  });
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

  it('con ngrok instalado desde Versiones usa ese binario (no el del PATH) y sin él cae al del PATH', async () => {
    ngrokInstalados = ['3.38.0', '3.39.13'];
    await crear().abrir('wolf', SI);
    expect(iniciados[0]!.comando).toBe(path.join(rutas.bin('ngrok', '3.39.13'), 'ngrok.exe'));
    // Sin el del PATH, el instalado basta; el token sigue yendo solo por el entorno.
    ejecutables.delete('ngrok');
    iniciados.length = 0;
    await crear().abrir('wolf', SI);
    expect(iniciados[0]!.comando).toBe(path.join(rutas.bin('ngrok', '3.39.13'), 'ngrok.exe'));
    expect(iniciados[0]!.envSecreto).toEqual({ NGROK_AUTHTOKEN: TOKEN_NGROK });
    // Sin ninguno de los dos: ngrok no instalado.
    ngrokInstalados = [];
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.ngrok_no_instalado',
    });
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
    for (
      let i = 0;
      i < 200 &&
      (readFileSync(env(), 'utf8') !== ENV_ORIGINAL ||
        existsSync(path.join(rutas.ngrokRun(), 'wolf.yml')));
      i++
    ) {
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
    const php = configVisto!;
    expect(php).toContain(`'auth_token' => '${TOKEN_EXPOSE}'`);
    expect(php.startsWith('<?php')).toBe(true);
    // Expose 3 ignora dashboard_port: no se escribe una opción muerta.
    expect(php).not.toContain('dashboard_port');
  });

  it('el archivo con el token se borra en cuanto aparece la URL (no dura lo que dura el túnel)', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    expect(configVisto).toContain(TOKEN_EXPOSE);
    expect(existsSync(path.join(rutas.exposeRun(), 'wolf.php'))).toBe(false);
    for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
  });

  it('el SQLite y los temporales de Expose caen en su inicio: TMP, TEMP y TMPDIR', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    const inicio = path.join(rutas.exposeRun(), 'inicio-wolf');
    const d = iniciados[0]!;
    for (const v of ['TMP', 'TEMP', 'TMPDIR', 'HOME', 'USERPROFILE']) {
      expect(d.env?.[v], v).toBe(inicio);
    }
    // Lo que Expose dejó en ese inicio se borra al cerrar.
    writeFileSync(path.join(inicio, 'expose-logs.sqlite'), 'datos de peticiones');
    await t.cerrar('wolf');
    expect(existsSync(inicio)).toBe(false);
  });

  it('con datos reales Expose se rechaza con su código y no se escribe nada (su inspector queda en la red local)', async () => {
    sitios = [sitio({ tunel: { proveedor: 'expose' }, datosReales: true })];
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.expose_datos_reales',
    });
    expect(iniciados).toEqual([]);
    expect(existsSync(rutas.exposeRun())).toBe(false);
  });

  it('expose_no_instalado lleva la carpeta para que el texto no muestre {carpeta}', async () => {
    rmSync(rutas.exposeBin(), { recursive: true, force: true });
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.expose_no_instalado',
      datos: { carpeta: rutas.exposeBin() },
    });
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
    expect(d.args).toEqual(['serve', '--https=8443', 'http://127.0.0.1:41234']);
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
    expect(iniciados[0]!.args).toEqual(['funnel', '--https=8443', 'http://127.0.0.1:41234']);
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
      codigo: 'tuneles.confirmacion_requerida_tailnet',
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
      vhostsAux: vhosts,
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

describe('Tailscale: server de Nginx propio del túnel (el Host .ts.net no cae en el default_server)', () => {
  beforeEach(() => {
    sitios = [sitio({ tunel: { proveedor: 'tailscale' } })];
    salidaProceso = SALIDA_SERVE;
  });
  const conf = () => path.join(rutas.vhostAux('tunel-wolf'));

  it('Tailscale apunta a un puerto propio cuyo server atiende cualquier Host y reenvía con el del sitio', async () => {
    await crear().abrir('wolf', SI);
    const d = iniciados[0]!;
    expect(d.args).toEqual(['serve', '--https=8443', 'http://127.0.0.1:41234']);
    const c = readFileSync(conf(), 'utf8');
    expect(c).toContain('listen 127.0.0.1:41234;');
    expect(c).toContain('server_name _;');
    expect(c).toContain('proxy_set_header Host "wolf.test";');
    expect(c).toContain('proxy_pass http://127.0.0.1:8080;');
    // No es el server por defecto de Nginx ni toca el vhost del sitio.
    expect(c).not.toContain('default_server');
    expect(existsSync(rutas.vhost('wolf'))).toBe(false);
    expect(recargas).toBeGreaterThanOrEqual(1);
  });

  it('cerrar quita el server y recarga Nginx', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    const antes = recargas;
    await t.cerrar('wolf');
    expect(existsSync(conf())).toBe(false);
    expect(recargas).toBeGreaterThan(antes);
  });

  it('si el proceso cae, el server se quita', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    estados.delete('tunel-wolf');
    for (const f of salidas) f('tunel-wolf', 1);
    for (let i = 0; i < 100 && existsSync(conf()); i++) await new Promise((r) => setTimeout(r, 10));
    expect(existsSync(conf())).toBe(false);
  });

  it('al arrancar: el de un túnel vivo sobrevive (readopción) y el huérfano se quita', async () => {
    await crear().abrir('wolf', SI);
    writeFileSync(rutas.vhostAux('tunel-huerfano'), 'server { listen 127.0.0.1:1; }');
    writeFileSync(rutas.vhostAux('lan-otro'), 'server { listen 127.0.0.1:2; }');
    // Otra instancia del núcleo (la app reiniciada): el proceso del túnel sigue vivo.
    await crear().restaurar();
    expect(existsSync(conf())).toBe(true);
    expect(existsSync(rutas.vhostAux('tunel-huerfano'))).toBe(false);
    // Lo que no es de un túnel (la red local de D25) no se toca.
    expect(existsSync(rutas.vhostAux('lan-otro'))).toBe(true);
  });

  it('al arrancar con el túnel muerto, su server se quita', async () => {
    await crear().abrir('wolf', SI);
    estados.delete('tunel-wolf');
    pids.delete('tunel-wolf');
    await crear().restaurar();
    expect(existsSync(conf())).toBe(false);
  });

  it('si Nginx rechaza el server, no se lanza nada ni queda archivo', async () => {
    falloRecarga = true;
    await expect(crear().abrir('wolf', SI)).rejects.toThrow(/nginx -t/);
    expect(iniciados).toEqual([]);
    expect(existsSync(conf())).toBe(false);
  });

  it('si el túnel no llega a conectar, el server tampoco queda', async () => {
    salidaProceso = 'esperando…';
    const e = await crear({ esperaMs: 50, intervaloMs: 10 }).abrir('wolf', SI);
    expect(e.estado).toBe('error');
    expect(existsSync(conf())).toBe(false);
  });

  it('abrir y cerrar dos veces seguidas no deja restos', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    await t.cerrar('wolf');
    await t.abrir('wolf', SI);
    await t.cerrar('wolf');
    expect(readdirSync(path.dirname(conf()))).toEqual([]);
  });
});

describe('Tailscale: menores', () => {
  beforeEach(() => {
    sitios = [sitio({ tunel: { proveedor: 'tailscale' } })];
    salidaProceso = SALIDA_SERVE;
  });

  it('puertoEnUso también recorre Foreground.*.TCP y Web', () => {
    const fg = (cuerpo: object) => JSON.stringify({ Foreground: { 'sesion-1': cuerpo } });
    expect(puertoEnUso(fg({ TCP: { '8443': { HTTPS: true } } }), 8443)).toBe(true);
    expect(puertoEnUso(fg({ Web: { 'pc.ts.net:8443': {} } }), 8443)).toBe(true);
    expect(puertoEnUso(fg({ TCP: { '443': {} } }), 8443)).toBe(false);
    expect(puertoEnUso(JSON.stringify({ Foreground: 5 }), 8443)).toBe(false);
  });

  it('si serve status sale con error, falla cerrado: no se abre ni se crea el server', async () => {
    const mal: Ejecutor = async (cmd, args) => {
      llamadas.push({ cmd, args });
      return { codigo: 1, stdout: '', stderr: 'no se pudo hablar con tailscaled' };
    };
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
      ejecutor: mal,
      secretos: () => secretos,
      vhostsAux: vhosts,
      puertoLibre: async () => 41234,
    });
    await expect(t.abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.tailscale_estado_ilegible',
    });
    expect(iniciados).toEqual([]);
    expect(existsSync(rutas.vhostAux('tunel-wolf'))).toBe(false);
  });

  it('Funnel o Serve sin habilitar: se reconoce la URL de login.tailscale.com y se informa con su código', async () => {
    salidaProceso =
      'Serve is not enabled on your tailnet.\nTo enable, visit:\n\n         https://login.tailscale.com/f/serve?node=n123abc\n';
    const t = crear();
    await expect(t.abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.tailscale_no_habilitado',
      datos: { enlace: 'https://login.tailscale.com/f/serve?node=n123abc' },
    });
    expect(t.estados()[0]).toMatchObject({ estado: 'error' });
    // El túnel se cerró y no deja el server.
    expect(existsSync(rutas.vhostAux('tunel-wolf'))).toBe(false);
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
  });

  it('un enlace que no es de login.tailscale.com no se muestra como el de habilitación', async () => {
    salidaProceso = 'Serve is not enabled on your tailnet.\nvisit https://malo.example/f/serve';
    const e = await crear({ esperaMs: 50, intervaloMs: 10 }).abrir('wolf', SI);
    expect(e.estado).toBe('error');
  });

  it('sin confirmar, Serve no habla de internet', async () => {
    const e = await crear()
      .abrir('wolf')
      .catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'tuneles.confirmacion_requerida_tailnet' });
    expect(String((e as Error).message)).not.toMatch(/internet/i);
    sitios = [sitio({ tunel: { proveedor: 'tailscale', modo: 'funnel' } })];
    const f = await crear()
      .abrir('wolf')
      .catch((x: unknown) => x);
    expect(f).toMatchObject({ codigo: 'tuneles.confirmacion_requerida' });
  });
});

describe('ngrok: versión antigua', () => {
  it('un ngrok que no entiende los flags pide actualizarlo', async () => {
    salidaProceso = 'Error: unknown flag: --traffic-policy-file';
    const t = crear();
    await expect(t.abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.ngrok_desactualizado',
    });
    expect(existsSync(path.join(rutas.ngrokRun(), 'wolf.yml'))).toBe(false);
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    salidaProceso = 'ERR_NGROK_121\n\nYour ngrok-agent version "3.1.0" is too old.';
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.ngrok_desactualizado',
    });
  });
});
