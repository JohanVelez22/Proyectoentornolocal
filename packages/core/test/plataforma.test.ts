import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Terminal } from '../src/herramientas/terminal';
import { Metricas } from '../src/monitor/metricas';
import {
  completarPlataforma,
  interpretarDescendientes,
  interpretarProfilesIni,
  interpretarRangosReservados,
  interpretarServiciosSistema,
  PlataformaFalsa,
  PlataformaWindows,
  type Ejecutor,
  type Plataforma,
} from '../src/plataforma/index';
import { Rutas, rutaBasePorDefecto } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const b64 = (t: string): string => Buffer.from(t, 'utf16le').toString('base64');
/** Script de PowerShell de una llamada con -EncodedCommand (o el de -Command). */
const script = (args: string[]): string => {
  const i = args.indexOf('-EncodedCommand');
  if (i >= 0) return Buffer.from(args[i + 1]!, 'base64').toString('utf16le');
  return args[args.indexOf('-Command') + 1] ?? '';
};

describe('rutaBasePorDefecto (sin cambios tras la migración)', () => {
  it('es la misma en los tres sistemas', () => {
    expect(rutaBasePorDefecto({ LOCALAPPDATA: 'C:\\U\\AppData\\Local' }, 'win32')).toBe(
      'C:\\U\\AppData\\Local\\WolfCoreDev',
    );
    expect(rutaBasePorDefecto({ USERPROFILE: 'C:\\U' }, 'win32')).toBe(
      'C:\\U\\AppData\\Local\\WolfCoreDev',
    );
    expect(rutaBasePorDefecto({}, 'darwin')).toMatch(
      /\/Library\/Application Support\/WolfCoreDev$/,
    );
    expect(rutaBasePorDefecto({ XDG_DATA_HOME: '/x/datos' }, 'linux')).toBe('/x/datos/WolfCoreDev');
    expect(rutaBasePorDefecto({}, 'linux')).toMatch(/\/\.local\/share\/WolfCoreDev$/);
  });

  it('PlataformaWindows.carpetaDatos es la ruta de Windows de siempre', () => {
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: { LOCALAPPDATA: 'D:\\L', USERPROFILE: 'D:\\Casa' },
    });
    expect(p.carpetaDatos()).toBe('D:\\L\\WolfCoreDev');
    expect(p.carpetaInicio()).toBe('D:\\Casa');
  });
});

describe('PlataformaWindows: nombres e identificador de catálogo', () => {
  it('agrega .exe una sola vez', () => {
    const p = new PlataformaWindows();
    expect(p.nombreEjecutable('php')).toBe('php.exe');
    expect(p.nombreEjecutable('bin/mysqld')).toBe('bin/mysqld.exe');
    expect(p.nombreEjecutable('Code.EXE')).toBe('Code.EXE');
  });

  it('idCatalogo según la arquitectura', () => {
    expect(new PlataformaWindows(undefined, undefined, { arquitectura: 'x64' }).idCatalogo()).toBe(
      'win-x64',
    );
    expect(
      new PlataformaWindows(undefined, undefined, { arquitectura: 'arm64' }).idCatalogo(),
    ).toBe('win-arm64');
  });

  it('buscarEjecutable: PATH primero, luego las rutas extra', async () => {
    const existen = new Set(['C:\\B\\gh.exe', 'C:\\Extra\\git.exe']);
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: { Path: 'C:\\A;"C:\\B"; ;' },
      existeRuta: (r) => existen.has(r),
    });
    expect(await p.buscarEjecutable('gh')).toBe('C:\\B\\gh.exe');
    expect(await p.buscarEjecutable('git', ['C:\\Extra'])).toBe('C:\\Extra\\git.exe');
    expect(await p.buscarEjecutable('nada')).toBeNull();
  });
});

describe('fixtures de consultas de Windows', () => {
  it('interpretarRangosReservados (netsh en inglés y en español)', () => {
    const ingles = [
      '',
      'Protocol tcp Port Exclusion Ranges',
      '',
      'Start Port    End Port',
      '----------    --------',
      '      1080        1179',
      '     50000       50059     *',
      '',
      '* - Administered port exclusions.',
      '',
    ].join('\r\n');
    expect(interpretarRangosReservados(ingles)).toEqual([
      { desde: 1080, hasta: 1179 },
      { desde: 50000, hasta: 50059 },
    ]);
    const espanol = [
      'Intervalos de exclusión de puertos de protocolo tcp',
      '',
      'Puerto de inicio    Puerto final',
      '----------    --------',
      '      5357        5357',
      '     65536       70000',
      '      9000        8000',
      '* - Exclusiones de puertos administrados.',
    ].join('\n');
    // Se descartan los rangos imposibles (fuera de 1–65535 o invertidos).
    expect(interpretarRangosReservados(espanol)).toEqual([{ desde: 5357, hasta: 5357 }]);
    expect(interpretarRangosReservados('')).toEqual([]);
  });

  it('interpretarDescendientes: hijos y nietos en una sola tabla de Win32_Process', () => {
    const tabla = [
      '4|0|133000000000000000|System',
      '100|4|133000000000000001|wolfcore.exe',
      '200|100|133000000000000002|python.exe',
      '300|200|133000000000000003|python.exe',
      '301|200||conhost.exe',
      '400|999|133000000000000004|ajeno.exe',
      '500|500|133000000000000005|raro.exe',
      'basura',
    ].join('\r\n');
    const d = interpretarDescendientes(tabla, [200, 400, 777]);
    expect(d.get(200)?.sort()).toEqual([300, 301]);
    expect(d.get(400)).toEqual([]);
    expect(d.get(777)).toEqual([]);
    expect(interpretarDescendientes(tabla, [100]).get(100)?.sort()).toEqual([200, 300, 301]);
    // Un proceso que se declara padre de sí mismo no entra en un ciclo.
    expect(interpretarDescendientes(tabla, [500]).get(500)).toEqual([]);
  });

  it('interpretarServiciosSistema', () => {
    const salida = 'W3SVC|Running\r\nSpooler|Stopped\r\nRaro|StartPending\r\n';
    expect(interpretarServiciosSistema(salida, ['W3SVC', 'Spooler', 'Raro', 'NoExiste'])).toEqual([
      { nombre: 'W3SVC', estado: 'corriendo' },
      { nombre: 'Spooler', estado: 'detenido' },
      { nombre: 'Raro', estado: 'otro' },
      { nombre: 'NoExiste', estado: 'no-existe' },
    ]);
  });

  it('interpretarProfilesIni: rutas relativas y absolutas', () => {
    const ini = [
      '[Install4F96D1932A9F858E]',
      'Default=Profiles/abc.default-release',
      '',
      '[Profile1]',
      'Name=default',
      'IsRelative=1',
      'Path=Profiles/xyz.default',
      '',
      '[Profile0]',
      'Name=default-release',
      'IsRelative=0',
      'Path=D:\\Perfiles\\ff',
      '',
      '[General]',
      'StartWithLastProfile=1',
    ].join('\r\n');
    expect(interpretarProfilesIni(ini, 'C:\\R\\Mozilla\\Firefox')).toEqual([
      { ruta: 'C:\\R\\Mozilla\\Firefox\\Profiles\\xyz.default', fuera: false },
      { ruta: 'D:\\Perfiles\\ff', fuera: true },
    ]);
  });

  it('interpretarProfilesIni: rechaza "..", rutas de red y absolutas que no son de una unidad local', () => {
    const perfil = (relativa: boolean, ruta: string): string =>
      `[Profile0]\r\nIsRelative=${relativa ? 1 : 0}\r\nPath=${ruta}\r\n`;
    const base = 'C:\\R\\Mozilla\\Firefox';
    for (const malo of [
      perfil(true, 'Profiles/../../../Windows'),
      perfil(true, '..\\otro'),
      perfil(false, 'C:\\Perfiles\\..\\Windows'),
      perfil(false, '\\\\servidor\\compartido\\ff'),
      perfil(false, '\\\\?\\UNC\\servidor\\ff'),
      perfil(false, '\\\\.\\C:\\ff'),
      perfil(false, '\\\\?\\C:\\ff'),
      perfil(false, '/home/ana/ff'),
      perfil(false, 'Perfiles\\ff'),
      perfil(true, 'C:\\absoluta'),
    ]) {
      expect(interpretarProfilesIni(malo, base), malo).toEqual([]);
    }
    // Una absoluta dentro de la carpeta de Firefox no cuenta como fuera.
    expect(
      interpretarProfilesIni(perfil(false, 'C:\\R\\Mozilla\\Firefox\\Profiles\\x'), base),
    ).toEqual([{ ruta: 'C:\\R\\Mozilla\\Firefox\\Profiles\\x', fuera: false }]);
  });

  it('leerVariableUsuario lee HKCU\\Environment (sin expandir) y decodifica Base64', async () => {
    const scripts: string[] = [];
    let salida = Buffer.from('C:\\José\\ca.crt', 'utf16le').toString('base64');
    const p = new PlataformaWindows(async (_c, args) => {
      scripts.push(script(args));
      return { codigo: 0, stdout: `${salida}\r\n`, stderr: '' };
    });
    expect(await p.leerVariableUsuario('NODE_EXTRA_CA_CERTS')).toBe('C:\\José\\ca.crt');
    expect(scripts[0]).toContain("OpenSubKey('Environment')");
    expect(scripts[0]).toContain('DoNotExpandEnvironmentNames');
    salida = '';
    expect(await p.leerVariableUsuario('NODE_EXTRA_CA_CERTS')).toBeNull();
    await expect(p.leerVariableUsuario('A B')).rejects.toThrow(/no válido/);
    await expect(
      new PlataformaWindows(async () => ({
        codigo: 1,
        stdout: '',
        stderr: 'x',
      })).leerVariableUsuario('X'),
    ).rejects.toThrow();
  });
});

describe('PlataformaWindows con un ejecutor falso', () => {
  it('rangosReservados usa netsh por ruta absoluta y lo interpreta', async () => {
    const llamadas: { cmd: string; args: string[] }[] = [];
    const exec: Ejecutor = async (cmd, args) => {
      llamadas.push({ cmd, args });
      return { codigo: 0, stdout: '  1080   1179\r\n', stderr: '' };
    };
    const p = new PlataformaWindows(exec, undefined, { entorno: { SystemRoot: 'C:\\W' } });
    expect(await p.rangosReservados('tcp')).toEqual([{ desde: 1080, hasta: 1179 }]);
    expect(llamadas[0]).toEqual({
      cmd: 'C:\\W\\System32\\netsh.exe',
      args: ['interface', 'ipv4', 'show', 'excludedportrange', 'protocol=tcp'],
    });
  });

  it('serviciosSistema rechaza nombres raros sin ejecutar nada', async () => {
    let llamadas = 0;
    const p = new PlataformaWindows(async () => {
      llamadas++;
      return { codigo: 0, stdout: '', stderr: '' };
    });
    await expect(p.serviciosSistema(["x'; rm"])).rejects.toThrow(/no válido/);
    expect(await p.serviciosSistema([])).toEqual([]);
    expect(llamadas).toBe(0);
  });

  it('vcRedistInstalado lee el valor Installed del registro', async () => {
    const respuesta = { stdout: '1' };
    const p = new PlataformaWindows(async (_c, args) => {
      expect(script(args)).toContain('VC\\Runtimes\\x64');
      return { codigo: 0, stdout: respuesta.stdout, stderr: '' };
    });
    expect(await p.vcRedistInstalado()).toBe(true);
    respuesta.stdout = '';
    expect(await p.vcRedistInstalado()).toBe(false);
  });

  it('variableUsuario escribe y borra en HKCU\\Environment con el valor en Base64', async () => {
    const scripts: { s: string; entrada?: string }[] = [];
    const p = new PlataformaWindows(async (_c, args, o) => {
      scripts.push({
        s: script(args),
        ...(o?.entrada !== undefined ? { entrada: o.entrada } : {}),
      });
      return { codigo: 0, stdout: '', stderr: '' };
    });
    expect(await p.variableUsuario('NODE_EXTRA_CA_CERTS', 'C:\\José\\ca.crt')).toEqual({
      ok: true,
    });
    expect(scripts[0]!.s).toContain("SetValue('NODE_EXTRA_CA_CERTS'");
    expect(scripts[0]!.entrada).toBe(b64('C:\\José\\ca.crt'));
    expect(await p.variableUsuario('NODE_EXTRA_CA_CERTS', null)).toEqual({ ok: true });
    expect(scripts[1]!.s).toContain("DeleteValue('NODE_EXTRA_CA_CERTS'");
    expect(await p.variableUsuario('Path', 'x')).toMatchObject({ ok: false, motivo: 'error' });
    expect(await p.variableUsuario('A B', 'x')).toMatchObject({ ok: false, motivo: 'error' });
    expect(scripts).toHaveLength(2);
  });

  // Rutas de Windows sobre el disco real: solo tiene sentido en Windows.
  it.skipIf(process.platform !== 'win32')(
    'perfilesFirefox lee profiles.ini de %APPDATA% (vacío si no hay Firefox)',
    async () => {
      const appdata = await carpetaTemporal('pel-ff-');
      const p = new PlataformaWindows(undefined, undefined, { entorno: { APPDATA: appdata } });
      expect(await p.perfilesFirefox()).toEqual([]);
      const dir = path.join(appdata, 'Mozilla', 'Firefox');
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, 'profiles.ini'),
        '[Profile0]\r\nIsRelative=1\r\nPath=Profiles/a.default\r\n',
      );
      expect(await p.perfilesFirefox()).toEqual([
        { ruta: path.win32.join(dir, 'Profiles', 'a.default'), fuera: false },
      ]);
    },
  );

  it('abrirTerminal: PowerShell en una consola nueva; wt solo elegido y sin variables', async () => {
    const llamadas: { cmd: string; args: string[]; env: NodeJS.ProcessEnv; gui: boolean }[] = [];
    const wt = 'C:\\L\\Microsoft\\WindowsApps\\wt.exe';
    const ps = 'C:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    let hayWt = true;
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: { LOCALAPPDATA: 'C:\\L', SystemRoot: 'C:\\W', Path: 'C:\\W' },
      existeRuta: (r) => (r === wt ? hayWt : r === ps),
      lanzarSeparado: async (cmd, args, o) => {
        llamadas.push({ cmd, args, env: o.env, gui: false });
      },
      lanzarGui: async (cmd, args, o) => {
        llamadas.push({ cmd, args, env: o.env, gui: true });
      },
    });
    const base = { LOCALAPPDATA: 'C:\\L', SystemRoot: 'C:\\W', Path: 'C:\\W' };
    // Sin terminal elegida: PowerShell (consola nueva), aunque esté Windows Terminal.
    await p.abrirTerminal('C:\\P', { comando: ['claude', '--help'] });
    expect(llamadas[0]).toMatchObject({ cmd: ps, gui: false, env: base });
    expect(llamadas[0]!.args.slice(0, 2)).toEqual(['-NoExit', '-EncodedCommand']);
    expect(script(llamadas[0]!.args)).toBe("Set-Location -LiteralPath 'C:\\P'; & 'claude' --help");
    // Windows Terminal elegido y sin variables propias: wt (programa con ventana propia).
    await p.abrirTerminal('C:\\P', { comando: ['claude', '--help'], terminal: 'windows-terminal' });
    expect(llamadas[1]).toEqual({
      cmd: wt,
      args: ['-w', 'new', '-d', '.', 'claude', '--help'],
      env: base,
      gui: true,
    });
    // Con variables (clave, token, PATH del proyecto): nunca por wt, porque puede atenderlo un
    // proceso de Windows Terminal ya abierto que no hereda este entorno. PowerShell sí.
    await p.abrirTerminal('C:\\P', {
      env: { CLAVE: 'x' },
      comando: ['claude', '--help'],
      terminal: 'windows-terminal',
    });
    expect(llamadas[2]).toMatchObject({ cmd: ps, gui: false, env: { ...base, CLAVE: 'x' } });
    expect(llamadas.filter((l) => l.cmd === wt && l.env.CLAVE !== undefined)).toEqual([]);
    // Un env vacío (o solo con undefined) no cuenta como variables propias.
    await p.abrirTerminal('C:\\P', { env: { NADA: undefined }, terminal: 'windows-terminal' });
    expect(llamadas[3]!.cmd).toBe(wt);
    llamadas.length = 0;
    await p.abrirTerminal('C:\\P’s', { comando: ['C:\\A B\\claude.cmd', 'x;y'] });
    expect(llamadas[0]!.cmd).toBe(ps);
    expect(script(llamadas[0]!.args)).toBe(
      "Set-Location -LiteralPath 'C:\\P’’s'; & 'C:\\A B\\claude.cmd' 'x;y'",
    );
    // Una terminal elegida que no está instalada: error claro, nada lanzado.
    hayWt = false;
    llamadas.length = 0;
    await expect(p.abrirTerminal('C:\\P', { terminal: 'windows-terminal' })).rejects.toMatchObject({
      codigo: 'terminal.no_instalada',
      datos: { nombre: 'Windows Terminal' },
    });
    expect(llamadas).toEqual([]);
  });

  it('abrirTerminal: cmd, Git Bash y pwsh elegidos', async () => {
    const llamadas: { cmd: string; args: string[]; cwd: string }[] = [];
    const e = {
      SystemRoot: 'C:\\W',
      ProgramFiles: 'C:\\PF',
      LOCALAPPDATA: 'C:\\L',
    };
    const instaladas = new Set([
      'C:\\W\\System32\\cmd.exe',
      'C:\\PF\\Git\\git-bash.exe',
      'C:\\PF\\PowerShell\\7\\pwsh.exe',
      'C:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    ]);
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: e,
      existeRuta: (r) => instaladas.has(r),
      lanzarSeparado: async (cmd, args, o) => {
        llamadas.push({ cmd, args, cwd: o.cwd });
      },
    });
    const dir = 'C:\\Proyectos\\WolfCore System';
    await p.abrirTerminal(dir, { terminal: 'cmd', env: { A: '1' } });
    await p.abrirTerminal(dir, { terminal: 'git-bash', env: { A: '1' } });
    await p.abrirTerminal(dir, { terminal: 'pwsh', env: { A: '1' } });
    // cmd y Git Bash no ejecutan comandos: con comando, PowerShell.
    await p.abrirTerminal(dir, { terminal: 'cmd', comando: ['claude'] });
    expect(llamadas.map((l) => [l.cmd, l.args.slice(0, 2), l.cwd])).toEqual([
      ['C:\\W\\System32\\cmd.exe', ['/K'], dir],
      ['C:\\PF\\Git\\git-bash.exe', [`--cd=${dir}`], dir],
      ['C:\\PF\\PowerShell\\7\\pwsh.exe', ['-NoExit', '-EncodedCommand'], dir],
      [
        'C:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        ['-NoExit', '-EncodedCommand'],
        dir,
      ],
    ]);
    expect(script(llamadas[2]!.args)).toBe(`Set-Location -LiteralPath '${dir}'`);
  });

  it('terminalesInstaladas: detecta por archivo (también el alias wt.exe de la Tienda)', async () => {
    const e = {
      SystemRoot: 'C:\\W',
      ProgramFiles: 'C:\\PF',
      'ProgramFiles(x86)': 'C:\\PF86',
      LOCALAPPDATA: 'C:\\L',
    };
    const instaladas = new Set([
      'C:\\L\\Microsoft\\WindowsApps\\wt.exe',
      'C:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      'C:\\L\\Microsoft\\WindowsApps\\pwsh.exe',
      'C:\\W\\System32\\cmd.exe',
      'C:\\PF86\\Git\\git-bash.exe',
    ]);
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: e,
      existeRuta: (r) => instaladas.has(r),
    });
    expect(await p.terminalesInstaladas()).toEqual([
      {
        id: 'windows-terminal',
        nombre: 'Windows Terminal',
        ruta: 'C:\\L\\Microsoft\\WindowsApps\\wt.exe',
      },
      {
        id: 'powershell',
        nombre: 'Windows PowerShell',
        ruta: 'C:\\W\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      },
      { id: 'pwsh', nombre: 'PowerShell 7', ruta: 'C:\\L\\Microsoft\\WindowsApps\\pwsh.exe' },
      { id: 'cmd', nombre: 'Símbolo del sistema (cmd)', ruta: 'C:\\W\\System32\\cmd.exe' },
      { id: 'git-bash', nombre: 'Git Bash', ruta: 'C:\\PF86\\Git\\git-bash.exe' },
    ]);
    instaladas.clear();
    expect(await p.terminalesInstaladas()).toEqual([]);
  });
});

describe('PlataformaFalsa', () => {
  it('cumple la interfaz completa y registra lo que se le pide', async () => {
    const f = new PlataformaFalsa({ carpetaDatos: '/datos', carpetaInicio: '/casa' });
    expect(f.carpetaDatos()).toBe('/datos');
    expect(f.carpetaInicio()).toBe('/casa');
    expect(f.idCatalogo()).toBe('win-x64');
    expect(f.nombreEjecutable('php')).toBe('php.exe');
    f.ejecutables.set('git', '/bin/git');
    expect(await f.buscarEjecutable('git')).toBe('/bin/git');
    expect(await f.buscarEjecutable('nada')).toBeNull();
    expect(await f.variableUsuario('X', '1')).toEqual({ ok: true });
    expect(f.variables.get('X')).toBe('1');
    await f.variableUsuario('X', null);
    expect(f.variables.has('X')).toBe(false);
    f.hijos.set(10, [11, 12]);
    expect(await f.descendientes([10, 20])).toEqual(
      new Map([
        [10, [11, 12]],
        [20, []],
      ]),
    );
    expect(f.lanzadorOculto('/tmp')).toBeNull();
  });

  it('completarPlataforma conserva la parcial (y sus cambios) y completa lo que falta', async () => {
    const parcial = { procesoVivo: async () => ({ vivo: true }) } as unknown as Plataforma;
    const respaldo = new PlataformaFalsa({ carpetaDatos: '/r' });
    const c = completarPlataforma(parcial, respaldo);
    expect(await c.procesoVivo(1)).toEqual({ vivo: true });
    parcial.procesoVivo = async () => ({ vivo: false });
    expect(await c.procesoVivo(1)).toEqual({ vivo: false });
    expect(c.carpetaDatos()).toBe('/r');
    const completa = new PlataformaFalsa();
    expect(completarPlataforma(completa, respaldo)).toBe(completa);
  });
});

describe('PathUsuario y Terminal con PlataformaFalsa', () => {
  let base: string;
  let rutas: Rutas;
  beforeEach(async () => {
    base = await carpetaTemporal('pel-plat-');
    rutas = new Rutas(base);
  });

  it('PathUsuario agrega y quita tools/bin sin tocar las entradas ajenas', async () => {
    const f = new PlataformaFalsa();
    f.path = ['C:\\Ajena', 'C:\\Otra'];
    const respaldo = path.join(base, 'etc', 'path-usuario.respaldo.txt');
    const p = new PathUsuario({ rutas, acceso: f.pathUsuario({ respaldo }) });
    expect(await p.estado()).toBe(false);
    await p.agregar();
    expect(f.path).toEqual(['C:\\Ajena', 'C:\\Otra', rutas.herramientas('bin')]);
    expect(await p.estado()).toBe(true);
    await p.agregar();
    expect(f.path).toHaveLength(3);
    await p.quitar();
    expect(f.path).toEqual(['C:\\Ajena', 'C:\\Otra']);
    expect(readFileSync(respaldo, 'utf8')).toBe('C:\\Ajena;C:\\Otra');
  });

  it('Terminal pide a la plataforma una terminal en la carpeta con el PATH del sitio', async () => {
    const f = new PlataformaFalsa();
    const carpeta = await carpetaTemporal('pel-sitio-');
    const t = new Terminal({ rutas, entorno: { Path: 'C:\\W' }, plataforma: f });
    await t.abrir({ carpeta, php: null });
    expect(f.terminales).toHaveLength(1);
    expect(f.terminales[0]!.cwd).toBe(carpeta);
    expect(f.terminales[0]!.env?.Path).toBe(`${rutas.herramientas('bin')};C:\\W`);
  });

  it('Terminal agrega las variables de confianza de la CA del sitio', async () => {
    const f = new PlataformaFalsa();
    const carpeta = await carpetaTemporal('pel-sitio-');
    const t = new Terminal({
      rutas,
      entorno: { Path: 'C:\\W' },
      plataforma: f,
      confianza: { envProyecto: async () => ({ NODE_EXTRA_CA_CERTS: 'ca.crt' }) },
    });
    await t.abrir({ carpeta, php: null });
    expect(f.terminales[0]!.env?.NODE_EXTRA_CA_CERTS).toBe('ca.crt');
  });
});

describe('Metricas: suma de los descendientes', () => {
  it('la CPU y la RAM de los hijos se suman al proceso supervisado', async () => {
    const eventos = new Eventos<EventosNucleo>();
    const pedidos: number[][] = [];
    const m = new Metricas({
      eventos,
      supervisor: {
        ids: () => ['proy-bot-uvicorn', 'nginx'],
        pid: (id) => (id === 'nginx' ? 50 : 10),
      },
      descendientes: async () =>
        new Map([
          [10, [11, 12, 50]],
          [50, []],
        ]),
      consultar: async (pids) => {
        pedidos.push([...pids].sort((a, b) => a - b));
        return {
          procesos: [
            { pid: 10, cpu: 10, ramBytes: 100, uptimeS: 60 },
            { pid: 11, cpu: 30, ramBytes: 1000, uptimeS: 59 },
            { pid: 12, cpu: 20, ramBytes: 500, uptimeS: 58 },
            { pid: 50, cpu: 40, ramBytes: 7, uptimeS: 5 },
          ],
          red: null,
        };
      },
      rutaDatos: process.cwd(),
      sistema: {
        cpus: () => [{ times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }],
        totalmem: () => 1000,
        freemem: () => 500,
        statfs: async () => ({ bsize: 1, blocks: 1, bfree: 1, bavail: 1 }),
      },
    });
    const muestra = await m.muestrear();
    expect(pedidos[0]).toEqual([10, 11, 12, 50]);
    const uvicorn = muestra.procesos.find((p) => p.id === 'proy-bot-uvicorn')!;
    // 50 es otro proceso supervisado: no se suma al primero.
    expect(uvicorn).toMatchObject({ pid: 10, cpu: 60, ramBytes: 1600, uptimeS: 60 });
    expect(muestra.procesos.find((p) => p.id === 'nginx')).toMatchObject({ cpu: 40, ramBytes: 7 });
  });

  it('si no se pueden leer los descendientes, la muestra sale igual sin ellos', async () => {
    const m = new Metricas({
      eventos: new Eventos<EventosNucleo>(),
      supervisor: { ids: () => ['nginx'], pid: () => 10 },
      descendientes: async () => {
        throw new Error('sin PowerShell');
      },
      consultar: async () => ({
        procesos: [{ pid: 10, cpu: 5, ramBytes: 9, uptimeS: 1 }],
        red: null,
      }),
      rutaDatos: process.cwd(),
      sistema: {
        cpus: () => [{ times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }],
        totalmem: () => 1,
        freemem: () => 1,
        statfs: async () => ({ bsize: 1, blocks: 1, bfree: 1, bavail: 1 }),
      },
    });
    expect((await m.muestrear()).procesos[0]).toMatchObject({ cpu: 5, ramBytes: 9 });
  });
});
