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
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Supervisor } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { UrlBase } from '../src/sitios/urlbase';
import { SitioSchema, type Sitio } from '../src/tipos';
import type { SecretosTunel } from '../src/tuneles/proveedor';
import { urlAutorizacion } from '../src/tuneles/cloudflareNombre';
import { Tuneles } from '../src/tuneles/tuneles';

const CENTINELA = 'centinela-secreta-d';
const UUID = '6f1d9c9e-1b2a-4c3d-8e4f-5a6b7c8d9e0f';
const CUENTA = 'abcdef0123456789abcdef0123456789';
const BANNER = [
  '2026-11-25T10:00:01Z INF Starting tunnel tunnelID=' + UUID,
  '2026-11-25T10:00:03Z INF Registered tunnel connection connIndex=0 location=mad01',
].join('\n');
const CREDENCIAL = JSON.stringify({
  AccountTag: CUENTA,
  TunnelSecret: CENTINELA,
  TunnelID: UUID,
});

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
let almacenSecretos: Map<string, string>;
let secretosLeidos: number;
let cifrado: boolean;
let sitios: Sitio[];
let llamadas: Array<{
  cmd: string;
  args: string[];
  env?: Record<string, string>;
  quitar?: readonly string[];
}>;
let restringidos: string[];
let bannerEnLog: string;
let falloCloudflared: string | null;
let lanzadas: Array<{
  cmd: string;
  args: string[];
  env?: Record<string, string> | undefined;
  quitar?: readonly string[] | undefined;
}>;
let esperarAbort: boolean;
let salidaRoute: string;
let fallaGuardar: boolean;
let autorizaciones: Array<string | null>;
let guardados: Array<{ sitioId: string; tunel: unknown }>;

const sitio = (extra: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'wolf',
    nombre: 'Wolf',
    dominio: 'wolf.test',
    carpeta,
    tipo: 'estatico',
    urlBaseVar: 'APP_URL',
    tunel: { proveedor: 'cloudflare-nombre', nombre: 'wolf-dev', dominio: 'demo.midominio.com' },
    ...extra,
  });

const supervisor = () =>
  ({
    iniciar: async (d: DefProceso) => {
      iniciados.push(d);
      estados.set(d.id, 'iniciando');
      pids.set(d.id, 4242);
      const li = d.args.indexOf('--logfile');
      if (li >= 0) {
        mkdirSync(path.dirname(d.args[li + 1]!), { recursive: true });
        writeFileSync(d.args[li + 1]!, bannerEnLog);
      }
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

/** cloudflared falso: login deja el cert, create deja la credencial, route no hace nada. */
const ejecutor: Ejecutor = async (cmd, args, opts) => {
  llamadas.push({
    cmd,
    args,
    ...(opts?.env ? { env: opts.env } : {}),
    ...(opts?.quitarEntorno ? { quitar: opts.quitarEntorno } : {}),
  });
  if (falloCloudflared !== null) return { codigo: 1, stdout: '', stderr: falloCloudflared };
  const cert = args[args.indexOf('--origincert') + 1]!;
  if (args.includes('login')) {
    mkdirSync(path.dirname(cert), { recursive: true });
    writeFileSync(cert, '-----BEGIN PRUEBA-----');
  }
  if (args.includes('create')) {
    writeFileSync(args[args.indexOf('--credentials-file') + 1]!, CREDENCIAL);
  }
  return { codigo: 0, stdout: '', stderr: args.includes('route') ? salidaRoute : '' };
};

const URL_LOGIN =
  'https://dash.cloudflare.com/argotunnel?aud=&callback=https%3A%2F%2Flogin.cloudflareaccess.org%2Fabc';

/**
 * `cloudflared tunnel login` falso que imita al real: ignora --origincert y escribe el
 * certificado en `$HOME/.cloudflared/cert.pem`; muestra la URL de autorización y espera.
 */
const lanzarFalso: Lanzador = async (cmd, args, opts) => {
  lanzadas.push({ cmd, args, env: opts?.env, quitar: opts?.quitarEntorno });
  const home = opts?.env?.['HOME'];
  if (!home) throw new Error('el login real escribiría en el ~/.cloudflared real del usuario');
  opts?.alLinea?.(
    'Please open the following URL and log in with your Cloudflare account:',
    'stderr',
  );
  opts?.alLinea?.(URL_LOGIN, 'stderr');
  if (falloCloudflared !== null) return { codigo: 1 };
  if (esperarAbort) {
    await new Promise<void>((resolver) => {
      opts?.senal?.addEventListener('abort', () => resolver(), { once: true });
    });
    return { codigo: 1 };
  }
  mkdirSync(path.join(home, '.cloudflared'), { recursive: true });
  writeFileSync(path.join(home, '.cloudflared', 'cert.pem'), '-----BEGIN PRUEBA-----');
  return { codigo: 0 };
};

const secretos: SecretosTunel = {
  disponible: () => cifrado,
  leer: async (id) => {
    secretosLeidos++;
    return almacenSecretos.get(id) ?? null;
  },
  guardar: async (id, v) => {
    if (fallaGuardar) throw new Error('no se pudo guardar');
    almacenSecretos.set(id, v);
  },
  borrar: async (id) => {
    almacenSecretos.delete(id);
  },
};

function crear(opts = { esperaMs: 300, intervaloMs: 10 }) {
  return new Tuneles({
    supervisor: supervisor(),
    sitios: { listar: async () => sitios },
    almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
    instalador: { instalados: async () => ['2026.10.1'] } as never,
    rutas,
    urlBase: new UrlBase({
      rutas,
      ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
    }),
    eventos,
    opts,
    plataforma: {
      restringirAlUsuario: async (r: string) => {
        restringidos.push(r);
        return true;
      },
    },
    ejecutor,
    lanzar: lanzarFalso,
    secretos: () => secretos,
    guardarTunel: async (sitioId, tunel) => {
      guardados.push({ sitioId, tunel });
    },
  });
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
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-tcf-'));
  carpeta = path.join(base, 'proyecto');
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(env(), ENV_ORIGINAL);
  rutas = new Rutas(path.join(base, 'datos'));
  eventos = new Eventos<EventosNucleo>();
  iniciados = [];
  estados = new Map();
  pids = new Map();
  salidas = [];
  almacenSecretos = new Map([['tunel:cloudflare-nombre:wolf-dev', CREDENCIAL]]);
  secretosLeidos = 0;
  cifrado = true;
  sitios = [sitio()];
  llamadas = [];
  restringidos = [];
  bannerEnLog = BANNER;
  falloCloudflared = null;
  lanzadas = [];
  esperarAbort = false;
  salidaRoute = '';
  fallaGuardar = false;
  autorizaciones = [];
  guardados = [];
  // La cuenta ya conectada.
  mkdirSync(rutas.cloudflaredEtc(), { recursive: true });
  writeFileSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'), '-----BEGIN PRUEBA-----');
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('Cloudflare con nombre: abrir', () => {
  it('genera el config.yml con el dominio y el puerto, y lanza cloudflared con la ruta del config', async () => {
    const t = crear();
    const e = await t.abrir('wolf', SI);
    expect(e).toMatchObject({ estado: 'activo', url: 'https://demo.midominio.com' });
    const d = iniciados[0]!;
    const cfg = path.join(rutas.cloudflaredEtc(), 'wolf.yml');
    expect(d.args).toEqual([
      'tunnel',
      '--no-autoupdate',
      '--config',
      cfg,
      '--logfile',
      rutas.logs('tuneles', 'tunel-wolf.log'),
      'run',
    ]);
    const yml = readFileSync(cfg, 'utf8');
    expect(yml).toContain('hostname: "demo.midominio.com"');
    expect(yml).toContain('service: "http://127.0.0.1:8080"');
    expect(yml).toContain('httpHostHeader: "wolf.test"');
    expect(yml).toContain(`tunnel: "${UUID}"`);
    expect(yml).toContain('http_status:404');
    expect(yml).not.toContain(CENTINELA);
  });

  it('el túnel se lanza sin heredar TUNNEL_* del usuario', async () => {
    await crear().abrir('wolf', SI);
    expect(iniciados[0]!.quitarEntorno).toEqual(['TUNNEL_']);
  });

  it('la credencial viaja solo en envSecreto: ni en args, ni en env, ni en el config.yml, ni en archivos', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    const d = iniciados[0]!;
    expect(d.envSecreto).toEqual({ TUNNEL_CRED_CONTENTS: CREDENCIAL });
    expect(JSON.stringify(d.args)).not.toContain(CENTINELA);
    expect(JSON.stringify(d.env ?? {})).not.toContain(CENTINELA);
    const yml = readFileSync(path.join(rutas.cloudflaredEtc(), 'wolf.yml'), 'utf8');
    expect(yml).not.toContain('credentials-file');
    expect(yml).not.toContain(CENTINELA);
    // Nunca se escribe un archivo de credencial.
    expect(existsSync(rutas.cloudflaredRun())).toBe(false);
  });

  it('nada del núcleo guarda la credencial en disco (config, logs, registro) fuera del almacén', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    await t.cerrar('wolf');
    for (const f of archivos(base)) {
      expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
    }
  });

  it('cerrar restaura el .env y no deja ningún archivo de credencial', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL=https://demo.midominio.com/');
    await t.cerrar('wolf');
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    expect(existsSync(rutas.cloudflaredRun())).toBe(false);
  });

  it('si el túnel nunca conecta, no deja la credencial y el .env vuelve', async () => {
    bannerEnLog = 'INF Starting tunnel';
    const t = crear({ esperaMs: 60, intervaloMs: 10 });
    const e = await t.abrir('wolf', SI);
    expect(e.estado).toBe('error');
    expect(existsSync(rutas.cloudflaredRun())).toBe(false);
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
  });

  it('si cloudflared muere, se limpia y el .env vuelve', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    estados.delete('tunel-wolf');
    for (const f of salidas) f('tunel-wolf', 1);
    for (let i = 0; i < 100 && readFileSync(env(), 'utf8') !== ENV_ORIGINAL; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    expect(existsSync(rutas.cloudflaredRun())).toBe(false);
  });

  it('tras matar la app a mano: al arrancar restaura el .env', async () => {
    const t = crear();
    await t.abrir('wolf', SI);
    // Simula la caída: el proceso ya no existe.
    estados.clear();
    pids.clear();
    const nuevo = crear();
    await nuevo.restaurar();
    expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
    expect(nuevo.estados()).toEqual([]);
  });

  it('el log de cloudflared pasa por enmascararSecretos al cerrar y al mostrarlo', async () => {
    bannerEnLog = `${BANNER}\nERR TUNNEL_TOKEN=abc123token y ${CENTINELA} con sk-prueba-falsa-0000`;
    const t = crear();
    await t.abrir('wolf', SI);
    const visto = t.log('wolf');
    expect(visto).not.toContain(CENTINELA);
    expect(visto).not.toContain('abc123token');
    expect(visto).not.toContain('sk-prueba-falsa-0000');
    await t.cerrar('wolf');
    const enDisco = readFileSync(rutas.logs('tuneles', 'tunel-wolf.log'), 'utf8');
    expect(enDisco).not.toContain(CENTINELA);
    expect(enDisco).not.toContain('abc123token');
    expect(enDisco).toContain('Registered tunnel connection');
  });
});

describe('Cloudflare con nombre: seguridad de la apertura', () => {
  it.each([false, true])(
    'sin confirmación no se abre (datos reales=%s): no lee secretos ni escribe nada',
    async (datosReales) => {
      sitios = [sitio({ datosReales })];
      const t = crear();
      await expect(t.abrir('wolf')).rejects.toMatchObject({
        codigo: 'tuneles.confirmacion_requerida',
      });
      await expect(t.renovar('wolf', { confirmado: false })).rejects.toMatchObject({
        codigo: 'tuneles.confirmacion_requerida',
      });
      expect(secretosLeidos).toBe(0);
      expect(iniciados).toEqual([]);
      expect(existsSync(path.join(rutas.cloudflaredEtc(), 'wolf.yml'))).toBe(false);
      expect(readFileSync(env(), 'utf8')).toBe(ENV_ORIGINAL);
      await expect(t.abrir('wolf', SI)).resolves.toMatchObject({ estado: 'activo' });
    },
  );

  it('el proveedor confirmado por el MCP debe ser el del sitio al abrir (sin TOCTOU)', async () => {
    const t = crear();
    // Se confirmó el túnel rápido, pero el sitio ya usa el túnel con nombre.
    await expect(
      t.abrir('wolf', { confirmado: true, tunelConfirmado: { proveedor: 'cloudflare-rapido' } }),
    ).rejects.toMatchObject({ codigo: 'tuneles.confirmacion_obsoleta' });
    // Se confirmó otro dominio público.
    await expect(
      t.abrir('wolf', {
        confirmado: true,
        tunelConfirmado: {
          proveedor: 'cloudflare-nombre',
          nombre: 'wolf-dev',
          dominio: 'otro.midominio.com',
        },
      }),
    ).rejects.toMatchObject({ codigo: 'tuneles.confirmacion_obsoleta' });
    expect(secretosLeidos).toBe(0);
    expect(iniciados).toEqual([]);
    await expect(
      t.abrir('wolf', {
        confirmado: true,
        tunelConfirmado: {
          proveedor: 'cloudflare-nombre',
          nombre: 'wolf-dev',
          dominio: 'demo.midominio.com',
        },
      }),
    ).resolves.toMatchObject({ estado: 'activo' });
  });

  it('nombre o dominio inválidos se rechazan antes de llamar a cloudflared o al almacén', async () => {
    for (const tunel of [
      { proveedor: 'cloudflare-nombre', nombre: 'x', dominio: 'wolf.test' },
      { proveedor: 'cloudflare-nombre', dominio: 'demo.midominio.com' },
    ]) {
      sitios = [{ ...sitio(), tunel } as Sitio];
      await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
        codigo: 'tuneles.cloudflare_datos_invalidos',
      });
    }
    expect(secretosLeidos).toBe(0);
    expect(iniciados).toEqual([]);
    expect(llamadas).toEqual([]);
  });

  it('sin la cuenta conectada o sin cifrado, no abre y lo dice con código', async () => {
    rmSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'));
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_sin_cuenta',
    });
    writeFileSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'), 'x');
    cifrado = false;
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.sin_cifrado',
    });
    expect(iniciados).toEqual([]);
  });

  it('sin credencial guardada para ese túnel no abre', async () => {
    almacenSecretos.clear();
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_sin_credencial',
    });
    expect(iniciados).toEqual([]);
  });

  it('un proveedor sin implementar (ngrok) no abre nada', async () => {
    sitios = [sitio({ tunel: { proveedor: 'ngrok' } })];
    await expect(crear().abrir('wolf', SI)).rejects.toMatchObject({
      codigo: 'tuneles.proveedor_no_disponible',
    });
    expect(iniciados).toEqual([]);
  });
});

describe('Cloudflare con nombre: cuenta, túnel y dominio', () => {
  it('conectar lanza el login con un inicio temporal propio y mueve el certificado a etc/', async () => {
    rmSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'));
    eventos.on('tunel:autorizacion', (e) => autorizaciones.push(e.url));
    const t = crear();
    const r = await t.cloudflareNombre!.conectar();
    expect(r).toEqual({ cancelado: false });
    const cert = path.join(rutas.cloudflaredEtc(), 'cert.pem');
    expect(readFileSync(cert, 'utf8')).toContain('PRUEBA');
    expect(restringidos).toContain(cert);
    const l = lanzadas[0]!;
    // Sin --origincert (el login real lo ignora) y con el inicio dentro de la carpeta de datos.
    expect(l.args).toEqual(['tunnel', 'login']);
    expect(l.env).toEqual({
      HOME: rutas.cloudflaredLogin(),
      USERPROFILE: rutas.cloudflaredLogin(),
    });
    expect(rutas.cloudflaredLogin().startsWith(base)).toBe(true);
    expect(l.quitar).toEqual(['TUNNEL_']);
    // La carpeta temporal se borra y nada apunta al ~/.cloudflared real.
    expect(existsSync(rutas.cloudflaredLogin())).toBe(false);
    expect(JSON.stringify(lanzadas)).not.toContain(os.homedir());
    expect(cert.startsWith(base)).toBe(true);
    // La URL de autorización se muestra en cuanto aparece y se retira al terminar.
    expect(autorizaciones).toEqual([URL_LOGIN, null]);
  });

  it('conectar se puede cancelar: no queda certificado ni carpeta temporal', async () => {
    rmSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'));
    esperarAbort = true;
    eventos.on('tunel:autorizacion', (e) => autorizaciones.push(e.url));
    const t = crear();
    const espera = t.cloudflareNombre!.conectar();
    for (let i = 0; i < 100 && autorizaciones.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(autorizaciones[0]).toBe(URL_LOGIN);
    // Una segunda conexión mientras espera no lanza otro login.
    await expect(t.cloudflareNombre!.conectar()).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_conexion_en_curso',
    });
    t.cloudflareNombre!.cancelarConexion();
    await expect(espera).resolves.toEqual({ cancelado: true });
    expect(existsSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'))).toBe(false);
    expect(existsSync(rutas.cloudflaredLogin())).toBe(false);
    expect(autorizaciones.at(-1)).toBeNull();
    expect(lanzadas).toHaveLength(1);
  });

  it('un login que falla no deja certificado y su error no filtra secretos', async () => {
    rmSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'));
    falloCloudflared = 'x';
    await expect(crear().cloudflareNombre!.conectar()).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_fallo',
    });
    expect(existsSync(path.join(rutas.cloudflaredEtc(), 'cert.pem'))).toBe(false);
    expect(existsSync(rutas.cloudflaredLogin())).toBe(false);
  });

  it('solo se muestra una URL de autorización de cloudflare.com', () => {
    expect(urlAutorizacion(URL_LOGIN)).toBe(URL_LOGIN);
    expect(urlAutorizacion('visite https://evil.example.com/x')).toBeNull();
    expect(urlAutorizacion('https://cloudflare.com.evil.io/x')).toBeNull();
    expect(urlAutorizacion('http://dash.cloudflare.com/x')).toBeNull();
    expect(urlAutorizacion('sin url')).toBeNull();
  });

  it('crear el túnel guarda la credencial solo en el almacén y borra el archivo temporal', async () => {
    almacenSecretos.clear();
    const t = crear();
    await t.cloudflareNombre!.crearTunel('wolf-dev');
    expect(almacenSecretos.get('tunel:cloudflare-nombre:wolf-dev')).toContain(CENTINELA);
    const l = llamadas[0]!;
    const i = l.args.indexOf('--credentials-file');
    expect(l.args.slice(-1)).toEqual(['wolf-dev']);
    expect(l.args[i + 1]!.startsWith(rutas.cloudflaredRun())).toBe(true);
    expect(existsSync(l.args[i + 1]!)).toBe(false);
    for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
  });

  it('la carpeta temporal se restringe al usuario antes de que cloudflared escriba en ella', async () => {
    almacenSecretos.clear();
    await crear().cloudflareNombre!.crearTunel('wolf-dev');
    expect(restringidos[0]).toBe(rutas.cloudflaredRun());
  });

  it('crear de nuevo un túnel que ya tiene credencial no llama a cloudflared', async () => {
    await crear().cloudflareNombre!.crearTunel('wolf-dev');
    expect(llamadas).toEqual([]);
  });

  it('enrutar el dominio llama a route dns con el nombre y el dominio', async () => {
    await crear().cloudflareNombre!.enrutar('wolf-dev', 'demo.midominio.com');
    expect(llamadas[0]!.args.slice(-4)).toEqual(['route', 'dns', 'wolf-dev', 'demo.midominio.com']);
    expect(llamadas[0]!.quitar).toEqual(['TUNNEL_']);
  });

  it('nombre o dominio inválidos no llegan a cloudflared', async () => {
    const cf = crear().cloudflareNombre!;
    for (const [n, d] of [
      ['Wolf Dev', 'demo.midominio.com'],
      ['wolf-dev', 'demo.test'],
      ['wolf-dev', '*.midominio.com'],
      ['wolf-dev', 'demo.midominio.com --x'],
      ['-x', 'demo.midominio.com'],
      ['wolf-dev', '127.0.0.1'],
    ] as const) {
      await expect(cf.enrutar(n, d)).rejects.toMatchObject({
        codigo: 'tuneles.cloudflare_datos_invalidos',
      });
    }
    await expect(cf.crearTunel('a b')).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_datos_invalidos',
    });
    expect(llamadas).toEqual([]);
  });

  it('un fallo de cloudflared nunca repite un secreto del mensaje', async () => {
    falloCloudflared = `error TUNNEL_TOKEN=${CENTINELA} Bearer abc.def.ghi sk-prueba-falsa-0000`;
    const e = await crear()
      .cloudflareNombre!.enrutar('wolf-dev', 'demo.midominio.com')
      .catch((x: unknown) => x as Error & { datos?: { detalle?: string } });
    expect((e as Error).message).not.toContain(CENTINELA);
    expect((e as Error).message).not.toContain('sk-prueba-falsa-0000');
    expect((e as Error).message).not.toContain('abc.def.ghi');
    expect(JSON.stringify((e as { datos?: unknown }).datos)).not.toContain(CENTINELA);
  });

  it('si create funciona pero falla el guardado, borra el túnel recién creado y no guarda nada', async () => {
    almacenSecretos.clear();
    fallaGuardar = true;
    await expect(crear().cloudflareNombre!.crearTunel('wolf-dev')).rejects.toThrow(
      'no se pudo guardar',
    );
    expect(llamadas.map((l) => l.args.find((a) => ['create', 'delete'].includes(a)))).toEqual([
      'create',
      'delete',
    ]);
    expect(llamadas.at(-1)!.args.slice(-2)).toEqual(['delete', 'wolf-dev']);
    expect(almacenSecretos.size).toBe(0);
    for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
  });

  it('route dns que registra otro nombre falla con el nombre registrado y no elige el proveedor', async () => {
    salidaRoute =
      'INF Added CNAME demo.midominio.com.otra.com which will route to this tunnel tunnelID=x';
    await expect(
      crear().configurarCloudflareNombre('wolf', 'wolf-dev', 'demo.midominio.com'),
    ).rejects.toMatchObject({
      codigo: 'tuneles.cloudflare_dominio_distinto',
      datos: { registrado: 'demo.midominio.com.otra.com', dominio: 'demo.midominio.com' },
    });
    expect(guardados).toEqual([]);
  });

  it('route dns que registra el mismo nombre sigue adelante', async () => {
    salidaRoute = 'INF Added CNAME demo.midominio.com which will route to this tunnel tunnelID=x';
    await crear().configurarCloudflareNombre('wolf', 'wolf-dev', 'demo.midominio.com');
    expect(guardados).toHaveLength(1);
  });

  it('un nombre de túnel o un dominio que ya usa otro sitio se rechaza antes de crear nada', async () => {
    sitios = [
      sitio(),
      sitio({
        id: 'otro',
        dominio: 'otro.test',
        tunel: {
          proveedor: 'cloudflare-nombre',
          nombre: 'otro-dev',
          dominio: 'otro.midominio.com',
        },
      }),
    ];
    const t = crear();
    await expect(
      t.configurarCloudflareNombre('wolf', 'otro-dev', 'nuevo.midominio.com'),
    ).rejects.toMatchObject({ codigo: 'tuneles.nombre_en_uso', datos: { nombre: 'otro-dev' } });
    await expect(
      t.configurarCloudflareNombre('wolf', 'nuevo', 'otro.midominio.com'),
    ).rejects.toMatchObject({ codigo: 'tuneles.dominio_en_uso' });
    // El propio sitio sí puede reconfigurar su túnel.
    await t.configurarCloudflareNombre('wolf', 'wolf-dev', 'demo.midominio.com');
    expect(llamadas.some((l) => l.args.includes('create') && l.args.includes('otro-dev'))).toBe(
      false,
    );
    expect(guardados).toHaveLength(1);
  });

  it('olvidar o recrear un túnel exige confirmación; olvidar devuelve los sitios al túnel rápido', async () => {
    const t = crear();
    await expect(t.olvidarTunelNombre('wolf-dev', {})).rejects.toMatchObject({
      codigo: 'tuneles.confirmacion_olvidar',
    });
    await expect(t.recrearTunelNombre('wolf-dev', { confirmado: false })).rejects.toMatchObject({
      codigo: 'tuneles.confirmacion_olvidar',
    });
    expect(almacenSecretos.size).toBe(1);
    expect(llamadas).toEqual([]);
    await t.olvidarTunelNombre('wolf-dev', { confirmado: true, borrarEnCloudflare: true });
    expect(llamadas.at(-1)!.args.slice(-2)).toEqual(['delete', 'wolf-dev']);
    expect(almacenSecretos.size).toBe(0);
    expect(guardados).toEqual([{ sitioId: 'wolf', tunel: null }]);
  });

  it('recrear borra el túnel en Cloudflare y crea uno nuevo con credencial nueva', async () => {
    const t = crear();
    await t.recrearTunelNombre('wolf-dev', { confirmado: true });
    const verbos = llamadas.map((l) => l.args.find((a) => ['delete', 'create'].includes(a)));
    expect(verbos).toEqual(['delete', 'create']);
    expect(almacenSecretos.get('tunel:cloudflare-nombre:wolf-dev')).toContain(CENTINELA);
  });

  it('configurar crea, enruta y deja elegido el proveedor del sitio (cerrando un túnel abierto)', async () => {
    almacenSecretos.clear();
    const t = crear();
    await t.configurarCloudflareNombre('wolf', 'wolf-dev', 'demo.midominio.com');
    expect(guardados).toEqual([
      {
        sitioId: 'wolf',
        tunel: {
          proveedor: 'cloudflare-nombre',
          nombre: 'wolf-dev',
          dominio: 'demo.midominio.com',
        },
      },
    ]);
    // Lo guardado en el sitio no lleva credenciales.
    expect(JSON.stringify(guardados)).not.toContain(CENTINELA);
  });
});

describe('Cloudflare con nombre con el Supervisor real', () => {
  it('estado.json, los eventos y los errores nunca llevan la credencial; el proceso sí la recibe', async () => {
    const entornos: Array<NodeJS.ProcessEnv | undefined> = [];
    const vivos = new Set<number>();
    const sup = new Supervisor(
      rutas,
      {
        procesoVivo: async (pid: number) => ({
          vivo: vivos.has(pid),
          ejecutable: 'cloudflared.exe',
        }),
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
        spawn: ((_c: string, args: string[], o: { env?: NodeJS.ProcessEnv }) => {
          entornos.push(o.env);
          const li = args.indexOf('--logfile');
          mkdirSync(path.dirname(args[li + 1]!), { recursive: true });
          writeFileSync(args[li + 1]!, BANNER);
          vivos.add(7000);
          return Object.assign(new EventEmitter(), {
            pid: 7000,
            unref: () => undefined,
          });
        }) as never,
      },
    );
    const emitidos: unknown[] = [];
    eventos.on('tunel:estado', (e) => emitidos.push(e));
    const t = new Tuneles({
      supervisor: sup,
      sitios: { listar: async () => sitios },
      almacen: { leer: async () => ({ servicios: { nginx: { puerto: 8080 } } }) } as never,
      instalador: { instalados: async () => ['2026.10.1'] } as never,
      rutas,
      urlBase: new UrlBase({
        rutas,
        ejecutor: async () => ({ codigo: 0, stdout: '', stderr: '' }),
      }),
      eventos,
      opts: { esperaMs: 500, intervaloMs: 10 },
      plataforma: { restringirAlUsuario: async () => true },
      ejecutor,
      secretos: () => secretos,
    });
    process.env['TUNNEL_TOKEN'] = 'heredado-ajeno';
    try {
      const e = await t.abrir('wolf', SI);
      expect(e.estado).toBe('activo');
      expect(entornos[0]!['TUNNEL_CRED_CONTENTS']).toBe(CREDENCIAL);
      expect(entornos[0]!['TUNNEL_TOKEN']).toBeUndefined();
      expect(readFileSync(rutas.estado(), 'utf8')).not.toContain(CENTINELA);
      expect(JSON.stringify(emitidos)).not.toContain(CENTINELA);
      expect(JSON.stringify(e)).not.toContain(CENTINELA);
      await t.cerrar('wolf');
      for (const f of archivos(base)) expect(readFileSync(f, 'latin1'), f).not.toContain(CENTINELA);
    } finally {
      delete process.env['TUNNEL_TOKEN'];
      await sup.cerrar().catch(() => undefined);
    }
  });
});
