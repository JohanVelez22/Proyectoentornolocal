import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Adminer, urlAdminer } from '../src/herramientas/adminer';
import { Composer } from '../src/herramientas/composer';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Terminal } from '../src/herramientas/terminal';
import { generarNginxPrincipal } from '../src/nginx/principal';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';

let base: string;
let rutas: Rutas;
beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-herr-'));
  rutas = new Rutas(base);
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

const marcar = (servicio: string, version: string, archivo: string): void => {
  const d = rutas.bin(servicio, version);
  mkdirSync(d, { recursive: true });
  writeFileSync(path.join(d, archivo), 'x');
};

describe('Composer', () => {
  const crear = (cfg: object = {}, exec?: Ejecutor): Composer =>
    new Composer({
      rutas,
      plataforma: { ejecutable: (n) => `${n}.exe` },
      instalador: {
        instalar: async () => undefined,
        instalados: async (s) =>
          s === 'php' ? ['8.2', '8.4'] : s === 'composer' ? ['2.11.2'] : [],
      },
      exec: exec ?? (async () => ({ codigo: 0, stdout: '', stderr: '' })),
      leerConfig: async () => ConfigSchema.parse(cfg),
    });

  it('escribe los shims con el contenido exacto', async () => {
    await crear().crearShims('8.4');
    const php = path.join(rutas.bin('php', '8.4'), 'php.exe');
    const phar = path.join(rutas.bin('composer', '2.11.2'), 'composer.phar');
    const dir = path.join(base, 'tools', 'bin');
    expect(readFileSync(path.join(dir, 'php.cmd'), 'utf8')).toBe(`@"${php}" %*\r\n`);
    expect(readFileSync(path.join(dir, 'composer.cmd'), 'utf8')).toBe(`@"${php}" "${phar}" %*\r\n`);
  });

  it('rechaza una versión de PHP que escaparía de bin/php', async () => {
    await expect(crear().crearShims('..\\x')).rejects.toThrow(/no válida/);
  });

  it('PHP por defecto: el configurado si está instalado, si no el más reciente', async () => {
    expect(await crear().phpPorDefecto()).toBe('8.4');
    expect(await crear({ herramientas: { phpPorDefecto: '8.2' } }).phpPorDefecto()).toBe('8.2');
    expect(await crear({ herramientas: { phpPorDefecto: '7.4' } }).phpPorDefecto()).toBe('8.4');
  });

  it('versión: ejecuta php composer.phar --version', async () => {
    let llamada: { cmd: string; args: string[] } | null = null;
    const c = crear({}, async (cmd, args) => {
      llamada = { cmd, args };
      return { codigo: 0, stdout: 'Composer version 2.11.2 2026-01-01 10:00:00\n', stderr: '' };
    });
    expect(await c.version()).toBe('2.11.2');
    expect(llamada!.cmd).toBe(path.join(rutas.bin('php', '8.4'), 'php.exe'));
    expect(llamada!.args).toEqual([
      path.join(rutas.bin('composer', '2.11.2'), 'composer.phar'),
      '--version',
    ]);
  });

  it('versión: null si falla', async () => {
    const c = crear({}, async () => ({ codigo: 1, stdout: '', stderr: 'x' }));
    expect(await c.version()).toBeNull();
  });

  it('actualizar usa self-update', async () => {
    let args: string[] = [];
    const c = crear({}, async (_c, a) => {
      args = a;
      return { codigo: 0, stdout: 'ok', stderr: '' };
    });
    await c.actualizar();
    expect(args.slice(-1)).toEqual(['self-update']);
  });
});

describe('Terminal', () => {
  const armar = (conWt: boolean) => {
    const llamadas: { cmd: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv }[] = [];
    const carpeta = path.join(base, 'Mi Sitio ñ');
    mkdirSync(carpeta, { recursive: true });
    mkdirSync(rutas.bin('php', '8.4'), { recursive: true });
    const wt = path.join('C:\\Users\\u\\AppData\\Local', 'Microsoft', 'WindowsApps', 'wt.exe');
    const t = new Terminal({
      rutas,
      entorno: { Path: 'C:\\Windows', LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' },
      existe: (p) => (p === wt ? conWt : existsSync(p)),
      lanzar: async (cmd, args, o) => {
        llamadas.push({ cmd, args, ...o });
      },
    });
    return { t, llamadas, carpeta, wt };
  };

  it('con wt.exe: wt -d <carpeta> y PATH con php, tools/bin y el actual', async () => {
    const { t, llamadas, carpeta, wt } = armar(true);
    await t.abrir({ carpeta, php: '8.4' });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.cmd).toBe(wt);
    expect(llamadas[0]!.args).toEqual(['-d', carpeta]);
    expect(llamadas[0]!.cwd).toBe(carpeta);
    expect(llamadas[0]!.env.Path).toBe(
      [rutas.bin('php', '8.4'), path.join(base, 'tools', 'bin'), 'C:\\Windows'].join(';'),
    );
    expect(Object.keys(llamadas[0]!.env).filter((k) => /^path$/i.test(k))).toEqual(['Path']);
  });

  it('sin wt.exe: PowerShell con la ruta entre comillas simples escapadas', async () => {
    const { t, llamadas } = armar(false);
    const rara = path.join(base, "O'Brien");
    mkdirSync(rara);
    await t.abrir({ carpeta: rara, php: null });
    expect(llamadas[0]!.cmd).toBe('powershell.exe');
    expect(llamadas[0]!.args).toEqual([
      '-NoExit',
      '-Command',
      `Set-Location -LiteralPath '${rara.replace(/'/g, "''")}'`,
    ]);
    expect(llamadas[0]!.env.Path!.startsWith(path.join(base, 'tools', 'bin'))).toBe(true);
  });

  it('carpeta inexistente: error claro y no lanza nada', async () => {
    const { t, llamadas } = armar(true);
    await expect(t.abrir({ carpeta: path.join(base, 'nada'), php: null })).rejects.toThrow(
      /no existe/,
    );
    expect(llamadas).toHaveLength(0);
  });
});

describe('PathUsuario', () => {
  const entrada = (): string => path.join(base, 'tools', 'bin');
  /** Registro falso: guarda el valor y el tipo. */
  const fake = (inicial: string | null, tipo = 'REG_EXPAND_SZ') => {
    const reg = { valor: inicial, tipo, escrituras: 0 };
    const exec: Ejecutor = async (cmd, args) => {
      expect(cmd).toBe('reg');
      if (args[0] === 'query') {
        if (args.includes('/v')) {
          if (reg.valor === null) return { codigo: 1, stdout: '', stderr: 'no hay' };
          return {
            codigo: 0,
            stdout: `\r\nHKEY_CURRENT_USER\\Environment\r\n    Path    ${reg.tipo}    ${reg.valor}\r\n\r\n`,
            stderr: '',
          };
        }
        return {
          codigo: 0,
          stdout: 'HKEY_CURRENT_USER\\Environment\r\n    TEMP    REG_SZ    x\r\n',
          stderr: '',
        };
      }
      expect(args.slice(0, 7)).toEqual([
        'add',
        'HKCU\\Environment',
        '/v',
        'Path',
        '/t',
        'REG_EXPAND_SZ',
        '/d',
      ]);
      expect(args[8]).toBe('/f');
      reg.valor = args[7]!;
      reg.tipo = 'REG_EXPAND_SZ';
      reg.escrituras++;
      return { codigo: 0, stdout: '', stderr: '' };
    };
    return { reg, p: new PathUsuario({ rutas, exec }) };
  };

  it('agrega al final conservando %VARS% y el resto', async () => {
    const { reg, p } = fake('%USERPROFILE%\\bin;C:\\Otro');
    const r = await p.agregar();
    expect(reg.valor).toBe(`%USERPROFILE%\\bin;C:\\Otro;${entrada()}`);
    expect(r.aviso).toMatch(/terminal nueva/);
    expect(await p.estado()).toBe(true);
  });

  it('no duplica (ni con otra mayúscula o barra final)', async () => {
    const { reg, p } = fake(`C:\\A;${entrada().toUpperCase()}\\`);
    await p.agregar();
    expect(reg.escrituras).toBe(0);
  });

  it('quita solo nuestra entrada', async () => {
    const { reg, p } = fake(`C:\\A;${entrada()};%JAVA_HOME%\\bin`);
    await p.quitar();
    expect(reg.valor).toBe('C:\\A;%JAVA_HOME%\\bin');
    expect(await p.estado()).toBe(false);
  });

  it('quitar sin nuestra entrada no escribe', async () => {
    const { reg, p } = fake('C:\\A');
    await p.quitar();
    expect(reg.escrituras).toBe(0);
  });

  it('sin valor Path y con la clave legible, lo crea', async () => {
    const { reg, p } = fake(null);
    await p.agregar();
    expect(reg.valor).toBe(entrada());
  });

  it('si no puede leer la clave, no escribe', async () => {
    const reg = { escrituras: 0 };
    const p = new PathUsuario({
      rutas,
      exec: async (_c, args) => {
        if (args[0] === 'add') reg.escrituras++;
        return { codigo: 1, stdout: '', stderr: 'error' };
      },
    });
    await expect(p.agregar()).rejects.toThrow();
    expect(reg.escrituras).toBe(0);
  });

  it('guarda un respaldo del valor anterior antes de escribir', async () => {
    const { p } = fake('C:\\A;%X%');
    await p.agregar();
    expect(readFileSync(path.join(base, 'etc', 'path-usuario.respaldo.txt'), 'utf8')).toBe(
      'C:\\A;%X%',
    );
  });
});

describe('Adminer', () => {
  const principal = (adminer?: { raiz: string; puertos: number[] }): string =>
    generarNginxPrincipal({
      prefijo: 'C:/n',
      sitesDir: 'C:/s',
      phpUpstreams: [],
      logsDir: 'C:/l',
      puerto: 80,
      ...(adminer ? { adminer } : {}),
    });

  it('sin Adminer no hay vhost interno', () => {
    expect(principal()).not.toContain('8090');
  });

  it('el vhost escucha solo en 127.0.0.1 y limita lo que sirve', () => {
    const conf = principal({ raiz: 'C:\\W\\tools\\adminer', puertos: [9840, 9841] });
    expect(conf).toContain('listen 127.0.0.1:8090;');
    expect(conf).not.toMatch(/listen 8090/);
    expect(conf).not.toMatch(/listen \[::\]/);
    expect(conf).toContain('root "C:/W/tools/adminer";');
    expect(conf).toContain('server 127.0.0.1:9840;');
    expect(conf).toContain('fastcgi_pass adminer_php;');
    expect(conf).toContain('location = / {');
    expect(conf).toContain('location = /index.php {');
    expect(conf).toMatch(/location \/ \{\s*return 404;/);
  });

  const crear = (opts: { encendidos?: string[]; adminer?: boolean } = {}): Adminer => {
    if (opts.adminer !== false) {
      mkdirSync(rutas.herramientas('adminer'), { recursive: true });
      writeFileSync(rutas.herramientas('adminer', 'index.php'), '<?php');
    }
    return new Adminer({
      rutas,
      instalador: {
        instalar: async () => undefined,
        instalados: async (s) => (s === 'php' ? ['8.2', '8.4'] : ['6.3.0']),
      },
      leerConfig: async () => ConfigSchema.parse({}),
      phpEncendido: (v) => (opts.encendidos ?? []).includes(v),
    });
  };

  it('sin PHP encendido: no disponible con el motivo en español', async () => {
    expect(await crear().disponibilidad()).toEqual({
      disponible: false,
      motivo: 'Encienda PHP para usar Adminer',
    });
  });

  it('usa el PHP más reciente que esté encendido', async () => {
    expect(await crear({ encendidos: ['8.2'] }).disponibilidad()).toEqual({
      disponible: true,
      rama: '8.2',
    });
    expect(await crear({ encendidos: ['8.2', '8.4'] }).disponibilidad()).toEqual({
      disponible: true,
      rama: '8.4',
    });
  });

  it('configNginx: null si no está instalado; si no, raíz y puertos del PHP', async () => {
    expect(await crear({ adminer: false }).configNginx()).toBeNull();
    const c = await crear({ encendidos: ['8.2'] }).configNginx();
    expect(c).toEqual({ raiz: rutas.herramientas('adminer'), puertos: [9820, 9821] });
  });

  it('urlPara no incluye clave y descarta motores sin soporte', () => {
    expect(urlAdminer('postgresql', 'postgres', 5432)).toBe(
      'http://127.0.0.1:8090/?pgsql=127.0.0.1:5432&username=postgres',
    );
    expect(urlAdminer('mysql', 'root', 3306)).toBe(
      'http://127.0.0.1:8090/?server=127.0.0.1:3306&username=root',
    );
    expect(urlAdminer('mariadb', 'a b', 3307)).toBe(
      'http://127.0.0.1:8090/?server=127.0.0.1:3307&username=a%20b',
    );
    expect(urlAdminer('mongodb', 'x', 27017)).toBeNull();
    expect(urlAdminer('redis', 'x', 6379)).toBeNull();
    expect(urlAdminer('mysql', 'root', 3306)).not.toMatch(/pass|clave|password/i);
  });

  it('instalar copia adminer.php a tools/adminer/index.php', async () => {
    const a = new Adminer({
      rutas,
      instalador: {
        instalar: async () => {
          marcar('adminer', '6.3.0', 'adminer.php');
        },
        instalados: async () => ['6.3.0'],
      },
      leerConfig: async () => ConfigSchema.parse({}),
      phpEncendido: () => false,
    });
    await a.instalar();
    expect(readFileSync(rutas.herramientas('adminer', 'index.php'), 'utf8')).toBe('x');
    expect(a.instalado()).toBe(true);
  });
});
