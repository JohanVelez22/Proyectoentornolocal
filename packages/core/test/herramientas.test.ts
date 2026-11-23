import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Adminer, urlAdminer } from '../src/herramientas/adminer';
import { Composer } from '../src/herramientas/composer';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Terminal } from '../src/herramientas/terminal';
import { decodificarComando, powershellDelSistema } from '../src/plataforma/terminalWin';

/** Sin SystemRoot en el entorno de la prueba: el PowerShell de C:\Windows, nunca por el PATH. */
const PS_SISTEMA = powershellDelSistema({});
import { generarNginxPrincipal } from '../src/nginx/principal';
import type { Ejecutor } from '../src/plataforma/tipos';
import { ejecutorPorDefecto } from '../src/plataforma/win';
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
      asegurarPhpIni: async (r) => rutas.phpIni(r),
    });

  it('escribe los shims con el contenido exacto (rutas relativas al shim)', async () => {
    await crear().crearShims('8.4');
    const php = '%~dp0..\\..\\bin\\php\\8.4\\php.exe';
    const ini = '%~dp0..\\..\\etc\\php\\8.4\\php.ini';
    const phar = '%~dp0..\\..\\bin\\composer\\2.11.2\\composer.phar';
    const dir = path.join(base, 'tools', 'bin');
    const cuerpo = (extra: string): string =>
      [
        '@echo off',
        'if defined WOLFCORE_PHP goto sitio',
        `"${php}" -c "${ini}"${extra} %*`,
        'exit /b %ERRORLEVEL%',
        ':sitio',
        `"%WOLFCORE_PHP%" -c "%WOLFCORE_PHPINI%"${extra} %*`,
        'exit /b %ERRORLEVEL%',
        '',
      ].join('\r\n');
    expect(readFileSync(path.join(dir, 'php.cmd'), 'utf8')).toBe(cuerpo(''));
    expect(readFileSync(path.join(dir, 'composer.cmd'), 'utf8')).toBe(cuerpo(` "${phar}"`));
  });

  it('con una base con tildes y ñ, el shim no lleva ningún carácter no ASCII', async () => {
    rutas = new Rutas(path.join(base, 'Usuarios', 'José Peña', 'WolfCore Dev'));
    await crear().crearShims('8.4');
    for (const f of ['php.cmd', 'composer.cmd']) {
      const t = readFileSync(rutas.herramientas('bin', f), 'utf8');
      expect(t).not.toMatch(/[^\x20-\x7e\r\n]/);
      expect(t).toContain(
        '"%~dp0..\\..\\bin\\php\\8.4\\php.exe" -c "%~dp0..\\..\\etc\\php\\8.4\\php.ini"',
      );
    }
  });

  it('relativaAlShim: otra unidad cae en la absoluta (con % duplicado)', async () => {
    const { relativaAlShim } = await import('../src/herramientas/composer');
    expect(relativaAlShim('C:\\b\\tools\\bin', 'D:\\x%y\\php.exe')).toBe('D:\\x%%y\\php.exe');
    expect(relativaAlShim('C:\\b\\tools\\bin', 'C:\\b\\bin\\php\\8.4\\php.exe')).toBe(
      '%~dp0..\\..\\bin\\php\\8.4\\php.exe',
    );
  });

  it.skipIf(process.platform !== 'win32')(
    'real: cmd.exe resuelve %~dp0 en una base con tildes (php.exe falso = node -c)',
    async () => {
      rutas = new Rutas(path.join(base, 'José Peña ñ'));
      await crear().crearShims('8.4');
      // php.exe falso: node.exe. `node -c <archivo>` lo abre para revisar su sintaxis; con un
      // .ini se queja nombrando la ruta completa: así se ve que llegó entera, con tildes y ñ.
      mkdirSync(rutas.bin('php', '8.4'), { recursive: true });
      const exe = path.join(rutas.bin('php', '8.4'), 'php.exe');
      try {
        linkSync(process.execPath, exe);
      } catch {
        copyFileSync(process.execPath, exe);
      }
      mkdirSync(path.dirname(rutas.phpIni('8.4')), { recursive: true });
      writeFileSync(rutas.phpIni('8.4'), '; php.ini de prueba\n');
      const env = { ...process.env };
      delete env.WOLFCORE_PHP;
      delete env.WOLFCORE_PHPINI;
      const r = spawnSync('cmd.exe', ['/d', '/c', rutas.herramientas('bin', 'php.cmd')], {
        encoding: 'utf8',
        windowsHide: true,
        env,
        timeout: 30_000,
      });
      const salida = `${r.stdout}${r.stderr}`;
      expect(salida).not.toMatch(
        /no se reconoce|not recognized|no puede encontrar|cannot find the path/i,
      );
      expect(salida).toContain(rutas.phpIni('8.4'));
    },
    60_000,
  );

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
      '-c',
      rutas.phpIni('8.4'),
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
    expect(args.slice(0, 2)).toEqual(['-c', rutas.phpIni('8.4')]);
  });
});

describe('Terminal', () => {
  const armar = (conWt: boolean) => {
    const llamadas: { cmd: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv }[] = [];
    const carpeta = path.join(base, 'Mi Sitio ñ');
    mkdirSync(carpeta, { recursive: true });
    mkdirSync(rutas.bin('php', '8.4'), { recursive: true });
    const wt = path.win32.join(
      'C:\\Users\\u\\AppData\\Local',
      'Microsoft',
      'WindowsApps',
      'wt.exe',
    );
    const t = new Terminal({
      rutas,
      entorno: { Path: 'C:\\Windows', LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' },
      existe: (p) => (p === wt ? conWt : existsSync(p)),
      asegurarPhpIni: async (r) => rutas.phpIni(r),
      phpPorDefecto: async () => '8.2',
      lanzar: async (cmd, args, o) => {
        llamadas.push({ cmd, args, ...o });
      },
    });
    return { t, llamadas, carpeta, wt };
  };

  it('con wt.exe y sin terminal elegida: PowerShell; PATH con php, tools/bin y el actual', async () => {
    const { t, llamadas, carpeta, wt } = armar(true);
    await t.abrir({ carpeta, php: '8.4' });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.cmd).not.toBe(wt);
    expect(llamadas[0]!.cmd).toBe(PS_SISTEMA);
    expect(llamadas[0]!.cwd).toBe(carpeta);
    expect(llamadas[0]!.env.Path).toBe(
      [rutas.bin('php', '8.4'), path.join(base, 'tools', 'bin'), 'C:\\Windows'].join(';'),
    );
    expect(llamadas[0]!.env.WOLFCORE_PHP).toBe(path.join(rutas.bin('php', '8.4'), 'php.exe'));
    expect(llamadas[0]!.env.WOLFCORE_PHPINI).toBe(rutas.phpIni('8.4'));
    expect(llamadas[0]!.env.PHPRC).toBe(path.dirname(rutas.phpIni('8.4')));
    expect(Object.keys(llamadas[0]!.env).filter((k) => /^path$/i.test(k))).toEqual(['Path']);
  });

  it('sin wt.exe: PowerShell con la ruta entre comillas simples escapadas', async () => {
    const { t, llamadas } = armar(false);
    const rara = path.join(base, "O'Brien");
    mkdirSync(rara);
    await t.abrir({ carpeta: rara, php: null });
    expect(llamadas[0]!.cmd).toBe(PS_SISTEMA);
    expect(llamadas[0]!.args.slice(0, 2)).toEqual(['-NoExit', '-EncodedCommand']);
    expect(decodificarComando(llamadas[0]!.args[2]!)).toBe(
      `Set-Location -LiteralPath '${rara.replace(/'/g, "''")}'`,
    );
    expect(llamadas[0]!.env.Path!.startsWith(path.join(base, 'tools', 'bin'))).toBe(true);
    // sin PHP propio: el php.ini y el PHP por defecto
    expect(llamadas[0]!.env.WOLFCORE_PHP).toBe(path.join(rutas.bin('php', '8.2'), 'php.exe'));
    expect(llamadas[0]!.env.WOLFCORE_PHPINI).toBe(rutas.phpIni('8.2'));
  });

  it('con wt.exe: una carpeta con `;` va entre comillas a PowerShell', async () => {
    const { t, llamadas } = armar(true);
    const rara = path.join(base, 'a;b ñ');
    mkdirSync(rara);
    await t.abrir({ carpeta: rara, php: null });
    expect(llamadas[0]!.cmd).toBe(PS_SISTEMA);
    expect(decodificarComando(llamadas[0]!.args[2]!)).toBe(`Set-Location -LiteralPath '${rara}'`);
    expect(llamadas[0]!.cwd).toBe(rara);
  });

  it('sin wt.exe: la comilla tipográfica también se duplica', async () => {
    const { t, llamadas } = armar(false);
    const rara = path.join(base, 'O’Brien');
    mkdirSync(rara);
    await t.abrir({ carpeta: rara, php: null });
    expect(decodificarComando(llamadas[0]!.args[2]!)).toBe(
      `Set-Location -LiteralPath '${rara.replace('’', '’’')}'`,
    );
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
  const b64 = (t: string): string => Buffer.from(t, 'utf16le').toString('base64');
  /** Script que recibe PowerShell por -EncodedCommand. */
  const script = (args: string[]): string =>
    Buffer.from(args[args.indexOf('-EncodedCommand') + 1]!, 'base64').toString('utf16le');
  /** Registro falso detrás de PowerShell: guarda el valor y el tipo (String / ExpandString). */
  const fake = (inicial: string | null, tipo = 'ExpandString') => {
    const reg = { valor: inicial, tipo, escrituras: 0, tipoEscrito: '', lecturas: 0 };
    const exec: Ejecutor = async (cmd, args, opts) => {
      expect(cmd).toBe('powershell');
      const s = script(args);
      expect(s).toContain("'Environment'");
      if (s.includes('SetValue')) {
        const m = /RegistryValueKind\]::(\w+)/.exec(s);
        reg.tipoEscrito = m![1]!;
        reg.tipo = m![1]!;
        reg.valor = Buffer.from(opts!.entrada!, 'base64').toString('utf16le');
        reg.escrituras++;
        return { codigo: 0, stdout: '', stderr: '' };
      }
      expect(s).toContain('DoNotExpandEnvironmentNames');
      reg.lecturas++;
      if (reg.valor === null) return { codigo: 0, stdout: 'SIN', stderr: '' };
      return { codigo: 0, stdout: `OK ${reg.tipo} ${b64(reg.valor)}\r\n`, stderr: '' };
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

  it('rutas con tildes, ñ y comilla tipográfica llegan intactas (y al respaldo)', async () => {
    const original = 'C:\\Users\\José Peña\\bin;C:\\Users\\O’Brien\\x;%X%';
    const { reg, p } = fake(original);
    await p.agregar();
    expect(reg.valor).toBe(`${original};${entrada()}`);
    expect(readFileSync(path.join(base, 'etc', 'path-usuario.respaldo.txt'), 'utf8')).toBe(
      original,
    );
    await p.quitar();
    expect(reg.valor).toBe(original);
  });

  it('se niega a escribir si lo leído trae U+FFFD (lectura dañada)', async () => {
    const { reg, p } = fake('C:\\Users\\Jos\uFFFD\\bin');
    await expect(p.agregar()).rejects.toThrow(/No se cambió nada/);
    expect(reg.escrituras).toBe(0);
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

  it('valor Path vacío: se lee como vacío', async () => {
    const { reg, p } = fake('');
    expect(await p.estado()).toBe(false);
    await p.agregar();
    expect(reg.valor).toBe(entrada());
  });

  it('si no puede leer la clave, no escribe', async () => {
    const reg = { escrituras: 0 };
    const p = new PathUsuario({
      rutas,
      exec: async (_c, args) => {
        if (script(args).includes('SetValue')) reg.escrituras++;
        return { codigo: 3, stdout: '', stderr: 'error' };
      },
    });
    await expect(p.agregar()).rejects.toThrow();
    expect(reg.escrituras).toBe(0);
  });

  it('salida irreconocible (otro tipo de valor): no escribe', async () => {
    const reg = { escrituras: 0 };
    const p = new PathUsuario({
      rutas,
      exec: async (_c, args) => {
        if (script(args).includes('SetValue')) reg.escrituras++;
        return { codigo: 0, stdout: 'OK MultiString QQA=', stderr: '' };
      },
    });
    await expect(p.agregar()).rejects.toThrow(/No se cambió nada/);
    expect(reg.escrituras).toBe(0);
  });

  it('conserva REG_SZ si el valor ya lo era', async () => {
    const { reg, p } = fake('C:\\A', 'String');
    await p.agregar();
    expect(reg.tipoEscrito).toBe('String');
  });

  it('REG_SZ con %VARS% pasa a REG_EXPAND_SZ', async () => {
    const { reg, p } = fake('%X%\\bin', 'String');
    await p.agregar();
    expect(reg.tipoEscrito).toBe('ExpandString');
  });

  it('el respaldo conserva el ORIGINAL en cambios posteriores', async () => {
    const { p } = fake('C:\\A');
    await p.agregar();
    await p.quitar();
    await p.agregar();
    expect(readFileSync(path.join(base, 'etc', 'path-usuario.respaldo.txt'), 'utf8')).toBe('C:\\A');
  });

  it('guarda un respaldo del valor anterior antes de escribir', async () => {
    const { p } = fake('C:\\A;%X%');
    await p.agregar();
    expect(readFileSync(path.join(base, 'etc', 'path-usuario.respaldo.txt'), 'utf8')).toBe(
      'C:\\A;%X%',
    );
  });

  it('si al releer no quedó lo escrito, falla con un aviso', async () => {
    let escrito = false;
    const p = new PathUsuario({
      rutas,
      exec: async (_c, args) => {
        if (script(args).includes('SetValue')) {
          escrito = true;
          return { codigo: 0, stdout: '', stderr: '' };
        }
        return {
          codigo: 0,
          stdout: `OK ExpandString ${b64(escrito ? 'otra' : 'C:\\A')}`,
          stderr: '',
        };
      },
    });
    await expect(p.agregar()).rejects.toThrow(/no quedó como se esperaba/);
  });

  describe.skipIf(process.platform !== 'win32')('registro real (solo Windows)', () => {
    const SUB = 'Software\\WolfCoreDevTest';
    const borrarClave = async (): Promise<void> => {
      await ejecutorPorDefecto('reg', ['delete', `HKCU\\${SUB}`, '/f'], { timeoutMs: 15_000 });
    };
    afterEach(borrarClave);

    it('escribe y relee byte a byte en una clave temporal de HKCU', async () => {
      await borrarClave();
      const p = new PathUsuario({ rutas, subclave: SUB });
      // Sin la clave no se escribe nada (Environment siempre existe).
      await expect(p.agregar()).rejects.toThrow(/No se cambió nada/);
      await ejecutorPorDefecto('reg', ['add', `HKCU\\${SUB}`, '/f'], { timeoutMs: 15_000 });
      expect((await p.leer()).valor).toBe('');
      await p.agregar();
      expect(await p.leer()).toEqual({ valor: entrada(), tipo: 'ExpandString' });
      // Se siembra un valor con tildes, ñ, comilla tipográfica y %VARS% (tipo REG_SZ).
      const conTildes = 'C:\\Users\\José Peña\\bin;C:\\O’Brien;C:\\Ünïcødé ✓';
      await ejecutorPorDefecto(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `[Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('${SUB}').SetValue('Path', [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${b64(conTildes)}')), 'String')`,
        ],
        { timeoutMs: 30_000 },
      );
      expect(await p.leer()).toEqual({ valor: conTildes, tipo: 'String' });
      await p.agregar();
      expect(await p.leer()).toEqual({ valor: `${conTildes};${entrada()}`, tipo: 'String' });
      await p.quitar();
      expect(await p.leer()).toEqual({ valor: conTildes, tipo: 'String' });
    }, 90_000);
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
