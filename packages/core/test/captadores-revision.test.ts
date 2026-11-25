import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Almacen } from '../src/almacen';
import type { Ejecutor, Plataforma } from '../src/plataforma/tipos';
import { entornoDelHijo, type DefProceso, type EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import {
  aplicarEleccionCaptador,
  CAPTADORES,
  defServicioCaptador,
  estadoCaptador,
  type DefCaptador,
  IDS_CAPTADOR,
  leerRutaSecreta,
  QUITAR_ENTORNO_CAPTADOR,
  rutaSecretaDe,
} from '../src/servicios/correo/captadores';
import type { CtxServicio } from '../src/servicios/definicion';
import { defMailpit, Mailpit } from '../src/servicios/mailpit';
import { Servicios } from '../src/servicios/servicios';
import { ConfigSchema, type Config } from '../src/tipos';

let base: string;
const exec: Ejecutor = async () => ({ codigo: 0, stdout: '', stderr: '' });

const ctx = (id: (typeof IDS_CAPTADOR)[number], puerto = 1025): CtxServicio => {
  const rutas = new Rutas(base);
  mkdirSync(rutas.bin(id, '1.0.0'), { recursive: true });
  return {
    rutas,
    bin: rutas.bin(id, '1.0.0'),
    datos: rutas.datos(id, '1.0.0', () => 'actual'),
    puerto,
    version: '1.0.0',
    credenciales: { usuario: 'x', clave: 'Secr3toSuperClave99' },
    exec,
  };
};

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-capt2-'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('puerto SMTP común y configuración antigua', () => {
  it('por defecto 1025 y un config.json anterior a D21 se lee con Mailpit y su puerto', async () => {
    expect(ConfigSchema.parse({}).correo).toEqual({
      captador: 'mailpit',
      puertoSmtp: 1025,
      proveedores: [],
    });
    const rutas = new Rutas(base);
    mkdirSync(path.dirname(rutas.config()), { recursive: true });
    // Config de antes de D21: sin `correo`, con Mailpit en un puerto propio.
    writeFileSync(
      rutas.config(),
      JSON.stringify({ servicios: { datos: { mailpit: { puerto: 1030 } } } }),
    );
    const cfg = await new Almacen(rutas).leer();
    expect(cfg.correo).toEqual({ captador: 'mailpit', puertoSmtp: 1030, proveedores: [] });
    // Y un config sin ningún dato de correo también.
    writeFileSync(rutas.config(), JSON.stringify({}));
    expect((await new Almacen(rutas).leer()).correo.captador).toBe('mailpit');
  });

  it('un captador descartado o raro en el config vuelve a Mailpit', async () => {
    for (const captador of ['mailhog', 'maildev', 7, null]) {
      expect(ConfigSchema.parse({ correo: { captador } }).correo.captador).toBe('mailpit');
    }
    expect(ConfigSchema.parse({ correo: { puertoSmtp: 80 } }).correo.puertoSmtp).toBe(1025);
  });
});

describe('ruta base secreta de la web', () => {
  it('se crea aleatoria, se guarda restringida, se reutiliza y se rehace si se daña', async () => {
    const datos = path.join(base, 'datos');
    const restringidos: string[] = [];
    const a = await rutaSecretaDe(datos, async (r) => void restringidos.push(r));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(restringidos).toEqual([path.join(datos, 'ruta-web')]);
    expect(await rutaSecretaDe(datos)).toBe(a);
    expect(await leerRutaSecreta(datos)).toBe(a);
    writeFileSync(path.join(datos, 'ruta-web'), 'no-es-hex');
    const b = await rutaSecretaDe(datos);
    expect(b).toMatch(/^[0-9a-f]{32}$/);
    expect(b).not.toBe(a);
    // Otra instalación, otra ruta.
    expect(await rutaSecretaDe(path.join(base, 'otra'))).not.toBe(b);
  });

  it('si restringir falla, igual se devuelve la ruta (permisos de la carpeta del usuario)', async () => {
    const r = await rutaSecretaDe(path.join(base, 'd2'), async () => {
      throw new Error('sin permiso');
    });
    expect(r).toMatch(/^[0-9a-f]{32}$/);
  });

  it('Mailpit arranca con --webroot secreto; Inbucket no (su raíz delata la ruta)', async () => {
    const c = ctx('mailpit');
    const p = await defMailpit().proceso(c);
    const ruta = readFileSync(path.join(c.datos, 'ruta-web'), 'utf8').trim();
    expect(p.args.slice(-2)).toEqual(['--webroot', ruta]);
    expect(CAPTADORES.mailpit.rutaSecreta).toBe(true);
    for (const id of ['smtp4dev', 'inbucket', 'papercut'] as const) {
      expect(CAPTADORES[id].rutaSecreta, id).toBeFalsy();
    }
    const i = await defServicioCaptador('inbucket').proceso(ctx('inbucket'));
    expect(JSON.stringify(i.env)).not.toMatch(/BASEPATH/);
  });

  it('la API de Mailpit que cuenta los sin leer cuelga de la ruta secreta', async () => {
    const urls: string[] = [];
    const peticion = async (u: string) => {
      urls.push(u);
      return { ok: true, json: async () => ({ unread: 3 }) };
    };
    expect(await new Mailpit(8025, peticion, async () => 'abc123').noLeidos()).toBe(3);
    expect(await new Mailpit(8025, peticion).noLeidos()).toBe(3);
    expect(urls).toEqual([
      'http://127.0.0.1:8025/abc123/api/v1/messages?limit=1',
      'http://127.0.0.1:8025/api/v1/messages?limit=1',
    ]);
  });
});

describe('entorno de los captadores', () => {
  it('entornoDelHijo quita lo heredado que cambia su configuración y deja lo demás', () => {
    const heredado = {
      PATH: 'C:\\x',
      Kestrel__Endpoints__Http__Url: 'http://0.0.0.0:5000',
      ASPNETCORE_URLS: 'http://*:80',
      DOTNET_ENVIRONMENT: 'Development',
      DOTNET_ROOT: 'C:\\dotnet',
      INBUCKET_SMTP_ADDR: '0.0.0.0:2500',
      MP_SMTP_BIND_ADDR: '0.0.0.0:1025',
      AllowedHosts: '*',
      Urls: 'http://0.0.0.0:1',
      ServerOptions__BindAddress: '0.0.0.0',
      SmtpServer__IP: 'Any',
    };
    const e = entornoDelHijo(heredado, {
      quitarEntorno: QUITAR_ENTORNO_CAPTADOR,
      conservarEntorno: ['DOTNET_ROOT'],
      env: { AllowedHosts: '127.0.0.1;localhost' },
    });
    expect(Object.keys(e).sort()).toEqual(['AllowedHosts', 'DOTNET_ROOT', 'PATH']);
    expect(e['AllowedHosts']).toBe('127.0.0.1;localhost');
    // Sin lista no cambia nada (el resto de procesos).
    expect(entornoDelHijo({ A: '1' }, { env: { B: '2' } })).toEqual({ A: '1', B: '2' });
  });

  it('todo captador arranca sin esas variables heredadas', async () => {
    for (const id of IDS_CAPTADOR) {
      const p = await defServicioCaptador(id).proceso(ctx(id));
      expect(p.quitarEntorno, id).toEqual(QUITAR_ENTORNO_CAPTADOR);
      expect(p.conservarEntorno, id).toContain('DOTNET_ROOT');
    }
    for (const prefijo of ['KESTREL__', 'ASPNETCORE_', 'DOTNET_', 'INBUCKET_', 'MP_']) {
      expect(QUITAR_ENTORNO_CAPTADOR).toContain(prefijo);
    }
  });
});

describe('Papercut', () => {
  it('declara su canal interno 37403 y fija sus ajustes de usuario en cada arranque', async () => {
    expect(defServicioCaptador('papercut').puertosExtra).toEqual([8028, 37403]);
    const c = ctx('papercut', 1999);
    const archivo = path.join(c.bin, 'Papercut.SMTP.Service.Settings.json');
    // Una opción cambiada desde su web (escuchar en todas las interfaces) no sobrevive.
    writeFileSync(archivo, JSON.stringify({ IP: 'Any', Port: '25' }));
    await defServicioCaptador('papercut').proceso(c);
    expect(JSON.parse(readFileSync(archivo, 'utf8'))).toEqual({ IP: '127.0.0.1', Port: '1999' });
    const p = await defServicioCaptador('papercut').proceso(c);
    // Mensajes y registros dentro de la carpeta de datos propia.
    expect(p.env?.SmtpServer__MessagePath?.startsWith(c.datos)).toBe(true);
    expect(p.env?.SmtpServer__LoggingPath?.startsWith(c.datos)).toBe(true);
  });
});

describe('Servicios: grupo exclusivo', () => {
  let iniciados: DefProceso[];
  let detenidos: string[];
  let estados: Map<string, EstadoProceso>;
  let cfg: Config;

  const servicios = (extra: { plazoSaludMs?: number } = {}): Servicios => {
    const rutas = new Rutas(base);
    for (const id of IDS_CAPTADOR) mkdirSync(rutas.bin(id, '1.0.0'), { recursive: true });
    return new Servicios({
      rutas,
      plataforma: {
        duenosDePuertos: async () => new Map(),
        quienUsaPuerto: async () => null,
      } as unknown as Plataforma,
      supervisor: {
        iniciar: async (d: DefProceso) => {
          // Un arranque lento deja que otro `iniciar` simultáneo se cuele si no hay cola.
          await new Promise((r) => setTimeout(r, 15));
          iniciados.push(d);
          estados.set(d.id, 'encendido');
        },
        detener: async (id: string) => {
          detenidos.push(id);
          estados.delete(id);
        },
        estado: (id: string) => estados.get(id) ?? 'apagado',
        pid: () => null,
      } as never,
      instalador: { instalados: async () => ['1.0.0'], instalado: async () => true } as never,
      leerConfig: async () => cfg,
      modificarConfig: async (fn) => fn(cfg),
      definiciones: IDS_CAPTADOR.map((i) => defServicioCaptador(i)),
      sonda: async () => false,
      ...extra,
    });
  };

  beforeEach(() => {
    iniciados = [];
    detenidos = [];
    estados = new Map();
    cfg = ConfigSchema.parse({});
  });

  it('dos o tres inicios simultáneos dejan un solo captador encendido', async () => {
    const s = servicios();
    await Promise.all([
      s.datos.iniciar('mailpit'),
      s.datos.iniciar('smtp4dev'),
      s.datos.iniciar('inbucket'),
    ]);
    expect([...estados.entries()].filter(([, e]) => e === 'encendido')).toHaveLength(1);
    // El que quedó es el último pedido: el orden de la cola.
    expect(estados.has('inbucket')).toBe(true);
    expect(cfg.correo.captador).toBe('inbucket');
  });

  it('el puerto SMTP es el común: cambiarlo desde uno vale para todos', async () => {
    const s = servicios();
    await s.datos.cambiarPuerto('papercut', 1050);
    expect(cfg.correo.puertoSmtp).toBe(1050);
    await s.datos.iniciar('smtp4dev');
    expect(iniciados[0]!.args).toContain('--smtpport=1050');
    await s.datos.iniciar('mailpit');
    expect(iniciados[1]!.args).toContain('127.0.0.1:1050');
    // Pedir el mismo puerto a otro captador no es un conflicto.
    await expect(s.datos.cambiarPuerto('inbucket', 1050)).resolves.toBeUndefined();
  });

  it('"Iniciar todo" arranca solo el captador elegido y un arranque automático no cambia la elección', async () => {
    cfg.correo.captador = 'smtp4dev';
    for (const id of IDS_CAPTADOR) cfg.servicios.datos[id].autoIniciar = true;
    const s = servicios({ plazoSaludMs: 50 });
    const objetivos = await s.datos.objetivosIniciarTodo([]);
    expect(objetivos.map((o) => o.servicio)).toEqual(['smtp4dev']);
    // Aunque el automático arranque otro (p. ej. Mailpit), la elección no se reescribe.
    await s.datos.iniciarYEsperar([
      { ref: 'mailpit', nombre: 'Mailpit', servicio: 'mailpit', puerto: 1025 },
    ]);
    expect(cfg.correo.captador).toBe('smtp4dev');
  });

  it('elegir deja un solo captador con arranque automático (sobrevive al reinicio)', () => {
    for (const id of IDS_CAPTADOR) cfg.servicios.datos[id].autoIniciar = id === 'mailpit';
    aplicarEleccionCaptador(cfg, 'papercut');
    expect(cfg.correo.captador).toBe('papercut');
    const con = IDS_CAPTADOR.filter((id) => cfg.servicios.datos[id].autoIniciar);
    expect(con).toEqual(['papercut']);
  });

  it('el archivo de la ruta secreta de Mailpit queda en su carpeta de datos', async () => {
    const s = servicios();
    await s.datos.iniciar('mailpit');
    const archivo = path.join(base, 'data', 'mailpit', 'actual', 'ruta-web');
    expect(statSync(archivo).isFile()).toBe(true);
    expect(iniciados[0]!.args.slice(-2)).toEqual([
      '--webroot',
      readFileSync(archivo, 'utf8').trim(),
    ]);
  });
});

describe('estado de un captador para la pantalla', () => {
  it('lleva el aviso de poco mantenimiento (como el de un MailHog hipotético) y la URL con ruta', () => {
    const poco: DefCaptador = { ...CAPTADORES.inbucket, avisoMantenimiento: true };
    const e = estadoCaptador(poco, {
      instalado: true,
      estado: 'iniciando',
      elegido: false,
      puertoSmtp: 1025,
      ruta: null,
    });
    expect(e).toMatchObject({
      avisoMantenimiento: true,
      encendido: true,
      urlWeb: 'http://127.0.0.1:8027/',
    });
    const m = estadoCaptador(CAPTADORES.mailpit, {
      instalado: true,
      estado: 'apagado',
      elegido: true,
      puertoSmtp: 1025,
      ruta: 'abc',
    });
    expect(m).toMatchObject({
      avisoMantenimiento: false,
      encendido: false,
      urlWeb: 'http://127.0.0.1:8025/abc/',
    });
  });
});
