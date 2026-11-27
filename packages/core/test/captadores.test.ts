import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ejecutor, Plataforma } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import {
  CAPTADORES,
  CAPTADORES_DESCARTADOS,
  IDS_CAPTADOR,
  captadorElegido,
  puertoSmtpElegido,
  defServicioCaptador,
  type IdCaptador,
} from '../src/servicios/correo/captadores';
import { defMailpit } from '../src/servicios/mailpit';
import { Servicios } from '../src/servicios/servicios';
import type { CtxServicio } from '../src/servicios/definicion';
import { ConfigSchema, IDS_SERVICIO_DATOS, PUERTOS_POR_DEFECTO, type Config } from '../src/tipos';
import { PLANTILLAS_ENV } from '../src/proyectos/env/plantillas';
import { catalogo, EJECUTABLE_POR_SERVICIO } from '../src/catalogo/catalogo';
import { nombreEjecutable } from '../src/plataforma/sistema';

let base: string;
const exec: Ejecutor = async () => ({ codigo: 0, stdout: '', stderr: '' });

const ctx = (id: IdCaptador, puerto: number): CtxServicio => {
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
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-capt-'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('captadores de correo (D21)', () => {
  it('los captadores admitidos y los descartados con su motivo', () => {
    expect(IDS_CAPTADOR).toEqual(['mailpit', 'smtp4dev', 'inbucket', 'papercut']);
    const ids = CAPTADORES_DESCARTADOS.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['mailhog', 'maildev', 'mailcatcher']));
    for (const d of CAPTADORES_DESCARTADOS) {
      expect(d.motivo.length).toBeGreaterThan(20);
      expect(d.fuente).toMatch(/^https:\/\//);
    }
    // Un descartado nunca es un id de captador ni de servicio.
    for (const id of ids) {
      expect(IDS_CAPTADOR as readonly string[]).not.toContain(id);
      expect(IDS_SERVICIO_DATOS as readonly string[]).not.toContain(id);
    }
  });

  it('cada captador es un servicio con puertos propios y binario en el catálogo', () => {
    const smtp = new Set<number>();
    const web = new Set<number>();
    for (const id of IDS_CAPTADOR) {
      const c = CAPTADORES[id];
      expect(c.id).toBe(id);
      expect(IDS_SERVICIO_DATOS as readonly string[]).toContain(id);
      expect(PUERTOS_POR_DEFECTO[id]).toBe(c.puertoSmtp);
      smtp.add(c.puertoSmtp);
      web.add(c.puertoWeb);
      expect(EJECUTABLE_POR_SERVICIO[id]).toBeTruthy();
      // Toda entrada de la lista fija lleva huella fuerte.
      const lista = catalogo[id] as { url: string; sha256?: string; sha512?: string }[];
      expect(lista.length).toBeGreaterThan(0);
      for (const e of lista) {
        expect(e.url).toMatch(/^https:\/\/github\.com\//);
        expect(e.sha256 ?? e.sha512).toMatch(/^[0-9a-f]{64,128}$/);
      }
    }
    // Comparten el puerto SMTP (uno a la vez); las webs, no.
    expect([...smtp]).toEqual([1025]);
    expect(web.size).toBe(IDS_CAPTADOR.length);
  });

  it('solo MailHog trae aviso de mantenimiento y ninguno lo tiene hoy entre los admitidos', () => {
    for (const id of IDS_CAPTADOR) expect(CAPTADORES[id].avisoMantenimiento).toBe(false);
    expect(CAPTADORES.mailpit.opcional).toBe(false);
    expect(CAPTADORES.smtp4dev.opcional).toBe(false);
    expect(CAPTADORES.inbucket.opcional).toBe(true);
    expect(CAPTADORES.papercut.opcional).toBe(true);
  });

  it('args y entorno fijan 127.0.0.1 en SMTP y web; ninguno abre 0.0.0.0 ni la red local', async () => {
    for (const id of IDS_CAPTADOR) {
      const c = CAPTADORES[id];
      const smtp = c.puertoSmtp + 100;
      const web = c.puertoWeb;
      const p = await defServicioCaptador(id).proceso(ctx(id, smtp));
      const todo = [...p.args, ...Object.entries(p.env ?? {}).map(([k, v]) => `${k}=${v}`)].join(
        '\n',
      );
      // Ambos puertos aparecen y la única dirección que se nombra es 127.0.0.1.
      expect(todo, id).toContain('127.0.0.1');
      expect(todo.includes(String(smtp)), id).toBe(true);
      // `AllowedHosts` lista los Host permitidos (con localhost): no es una dirección de escucha.
      const escucha = todo.replace(/^AllowedHosts=.*$/m, '');
      expect(escucha, id).not.toMatch(/0\.0\.0\.0|\*:|\+:|\[::\]|:::|localhost|Any\b/i);
      expect(
        c.args({ smtp, web, datos: path.join(base, 'd'), ruta: 'abc' }).join(' '),
      ).not.toContain('0.0.0.0');
      expect(todo.includes(String(web)), id).toBe(true);
      expect(p.puerto).toBe(web);
    }
  });

  it('smtp4dev: sin conexiones remotas, sin IMAP ni POP3 y con Host acotado', async () => {
    const p = await defServicioCaptador('smtp4dev').proceso(ctx('smtp4dev', 1026));
    expect(p.args).toEqual(
      expect.arrayContaining([
        '--smtpport=1026',
        '--bindaddress=127.0.0.1',
        '--allowremoteconnections-',
        '--urls=http://127.0.0.1:8026',
        '--imapport=',
        '--pop3port=',
        '--nousersettings',
        '--locksettings',
      ]),
    );
    expect(p.env?.AllowedHosts).toBe('127.0.0.1;localhost');
  });

  it('Papercut: IP y web locales, Host acotado y datos en la carpeta propia', async () => {
    const c = ctx('papercut', 2525);
    const p = await defServicioCaptador('papercut').proceso(c);
    expect(p.env).toMatchObject({
      SmtpServer__IP: '127.0.0.1',
      SmtpServer__Port: '2525',
      Urls: 'http://127.0.0.1:8028',
      AllowedHosts: '127.0.0.1;localhost',
    });
    expect(p.env?.SmtpServer__MessagePath?.startsWith(c.datos)).toBe(true);
  });

  it('Inbucket: SMTP, web y POP3 locales y almacenamiento en archivos con ruta relativa', async () => {
    const c = ctx('inbucket', 2500);
    const p = await defServicioCaptador('inbucket').proceso(c);
    expect(p.env).toMatchObject({
      INBUCKET_SMTP_ADDR: '127.0.0.1:2500',
      INBUCKET_WEB_ADDR: '127.0.0.1:8027',
      INBUCKET_POP3_ADDR: '127.0.0.1:11100',
      INBUCKET_STORAGE_TYPE: 'file',
    });
    // La ruta absoluta de Windows ("C:\…") rompe el formato clave:valor de la opción.
    expect(p.env?.INBUCKET_STORAGE_PARAMS).toBe('path:mail');
    expect(p.cwd).toBe(c.datos);
    // Retención y tope fijos, sin script Lua heredado y sin ruta base (no oculta nada).
    expect(p.env).toMatchObject({
      INBUCKET_STORAGE_RETENTIONPERIOD: '72h',
      INBUCKET_STORAGE_MAILBOXMSGCAP: '200',
      INBUCKET_LUA_PATH: '',
    });
    expect(p.env).not.toHaveProperty('INBUCKET_WEB_BASEPATH');
  });

  it('Mailpit conserva su configuración de siempre', async () => {
    const c = ctx('mailpit', 1025);
    const p = await defMailpit().proceso(c);
    expect(p.args.slice(0, 4)).toEqual(['--smtp', '127.0.0.1:1025', '--listen', '127.0.0.1:8025']);
    expect(p.comando).toBe(path.join(c.bin, nombreEjecutable('mailpit')));
  });

  it('el captador elegido sale de la configuración y su puerto SMTP, de la del servicio', () => {
    const cfg = ConfigSchema.parse({});
    expect(captadorElegido(cfg)).toBe('mailpit');
    const otra = ConfigSchema.parse({
      correo: { captador: 'smtp4dev' },
      servicios: { datos: { smtp4dev: { puerto: 1999 } } },
    });
    expect(captadorElegido(otra)).toBe('smtp4dev');
    expect(otra.servicios.datos.smtp4dev.puerto).toBe(1999);
    // Un valor raro o un captador descartado vuelve a Mailpit.
    for (const malo of ['mailhog', 'maildev', 42, null]) {
      expect(captadorElegido(ConfigSchema.parse({ correo: { captador: malo } }))).toBe('mailpit');
    }
  });
});

describe('bloque MAIL_* del proyecto', () => {
  it('apunta al puerto SMTP del captador elegido', () => {
    const cfg = ConfigSchema.parse({
      correo: { captador: 'inbucket', puertoSmtp: 2599 },
    });
    expect(puertoSmtpElegido(cfg)).toBe(2599);
    const bloque = PLANTILLAS_ENV.correo({
      tipo: 'laravel',
      base: null,
      correo: puertoSmtpElegido(cfg),
      redis: null,
    });
    expect(bloque).toMatchObject({ MAIL_HOST: '127.0.0.1', MAIL_PORT: '2599' });
    expect(bloque.MAIL_PASSWORD).toBe('');
  });
});

describe('uno encendido a la vez', () => {
  let iniciados: DefProceso[];
  let detenidos: string[];
  let estados: Map<string, EstadoProceso>;
  let cfg: Config;

  const servicios = (): Servicios => {
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
      instalador: {
        instalados: async () => ['1.0.0'],
        instalado: async () => true,
      } as never,
      leerConfig: async () => cfg,
      modificarConfig: async (fn) => fn(cfg),
      definiciones: [
        defMailpit(),
        ...IDS_CAPTADOR.filter((i) => i !== 'mailpit').map((i) => defServicioCaptador(i)),
      ],
      sonda: async () => false,
    });
  };

  beforeEach(() => {
    iniciados = [];
    detenidos = [];
    estados = new Map();
    cfg = ConfigSchema.parse({});
  });

  it('encender smtp4dev con Mailpit encendido detiene Mailpit', async () => {
    const s = servicios();
    await s.datos.iniciar('mailpit');
    expect(estados.get('mailpit')).toBe('encendido');
    await s.datos.iniciar('smtp4dev');
    expect(detenidos).toEqual(['mailpit']);
    expect(estados.get('mailpit')).toBeUndefined();
    expect(estados.get('smtp4dev')).toBe('encendido');
  });

  it('con otro captador ya encendido, encender el mismo no detiene nada', async () => {
    const s = servicios();
    await s.datos.iniciar('inbucket');
    await s.datos.iniciar('inbucket');
    expect(detenidos).toEqual([]);
    expect(iniciados).toHaveLength(1);
  });

  it('encender un captador lo deja como el elegido de los proyectos', async () => {
    const s = servicios();
    await s.datos.iniciar('papercut');
    expect(cfg.correo.captador).toBe('papercut');
    await s.datos.iniciar('mailpit');
    expect(cfg.correo.captador).toBe('mailpit');
  });

  it('un servicio que no es captador no detiene a los captadores', async () => {
    const s = servicios();
    await s.datos.iniciar('papercut');
    expect(Object.keys(CAPTADORES)).toContain('papercut');
    expect(detenidos).toEqual([]);
    expect(estados.get('papercut')).toBe('encendido');
  });
});
