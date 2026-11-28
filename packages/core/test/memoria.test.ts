import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Metricas } from '../src/monitor/metricas';
import { interpretarNetstatEstablecidas } from '../src/plataforma/netstat';
import {
  interpretarProcesosUsuario,
  ProcesosUsuarioWindows,
  scriptCerrarVentana,
  scriptProcesosUsuario,
} from '../src/plataforma/procesosUsuarioWin';
import type { Ejecutor } from '../src/plataforma/tipos';
import { ServicioPhp } from '../src/servicios/php';

describe('Metricas: inactividad observada', () => {
  it('cuenta desde que se observa y un hueco largo entre muestras la borra', async () => {
    const eventos = new Eventos<EventosNucleo>();
    let ahora = 1_000_000;
    let cpu = 0;
    const m = new Metricas({
      eventos,
      supervisor: { ids: () => ['php-8.4-0'], pid: () => 10 },
      consultar: async () => ({
        procesos: [{ pid: 10, cpu, ramBytes: 5, uptimeS: 1 }],
        red: null,
      }),
      rutaDatos: 'C:\\datos',
      ahora: () => ahora,
      intervaloMs: 3000,
      sistema: {
        cpus: () => [{ times: { user: 1, nice: 0, sys: 1, idle: 1, irq: 0 } }],
        totalmem: () => 100,
        freemem: () => 50,
        statfs: async () => ({ bsize: 1, blocks: 1, bfree: 1, bavail: 1 }),
      },
    });
    expect(m.inactividadMs('php-8.4-0')).toBeNull();
    await m.muestrear();
    ahora += 3000;
    await m.muestrear();
    ahora += 3000;
    expect(m.inactividadMs('php-8.4-0')).toBe(6000);
    expect(m.observadoMs('php-8.4-0')).toBe(6000);
    // Con actividad el contador vuelve a cero.
    cpu = 50;
    await m.muestrear();
    expect(m.inactividadMs('php-8.4-0')).toBe(0);
    // Un hueco largo (el muestreo estuvo pausado): no se sabe qué pasó, se empieza de nuevo.
    cpu = 0;
    ahora += 60 * 60_000;
    await m.muestrear();
    expect(m.observadoMs('php-8.4-0')).toBe(0);
  });
});

describe('ServicioPhp.reducirAUno', () => {
  function php(encendidos: string[]) {
    const estados = new Map<string, string>(encendidos.map((id) => [id, 'encendido']));
    const detenidos: string[] = [];
    const sup = {
      estado: (id: string) => estados.get(id) ?? 'apagado',
      detener: async (id: string) => {
        detenidos.push(id);
        estados.set(id, 'apagado');
      },
    };
    const servicio = new ServicioPhp(
      {} as never,
      {} as never,
      sup as never,
      {} as never,
      (async () => ({})) as never,
    );
    return { servicio, detenidos };
  }

  it('deja encendido el primer trabajador encendido y detiene los demás por su id', async () => {
    const { servicio, detenidos } = php(['php-8.4-0', 'php-8.4-1', 'php-8.4-2', 'php-8.3-0']);
    expect(servicio.trabajadoresEncendidos('8.4')).toEqual([0, 1, 2]);
    expect(await servicio.reducirAUno('8.4')).toBe(2);
    expect(detenidos).toEqual(['php-8.4-1', 'php-8.4-2']);
    expect(await servicio.reducirAUno('8.4')).toBe(0);
    expect(servicio.trabajadoresEncendidos('8.3')).toEqual([0]);
  });

  it('si los encendidos son [1, 2] conserva el 1 (no el índice 0, que está apagado)', async () => {
    const { servicio, detenidos } = php(['php-8.4-1', 'php-8.4-2']);
    expect(servicio.trabajadoresEncendidos('8.4')).toEqual([1, 2]);
    expect(await servicio.reducirAUno('8.4')).toBe(1);
    expect(detenidos).toEqual(['php-8.4-2']);
    expect(servicio.trabajadoresEncendidos('8.4')).toEqual([1]);
  });
});

describe('implementación de Windows: solo lee y cierra con amabilidad', () => {
  const b64 = (t: string): string => Buffer.from(t, 'utf8').toString('base64');
  const decodificar = (args: string[]): string =>
    Buffer.from(args[args.indexOf('-EncodedCommand') + 1] ?? '', 'base64').toString('utf16le');

  it('interpreta la salida y descarta líneas raras', () => {
    const salida = [
      `100|1|133000000000000000|943718400||1|0|0|${b64('chrome.exe')}|${b64('C:\\Program Files\\Google\\chrome.exe')}`,
      `101|1||1024||0|1|0|${b64('serv.exe')}|`,
      `104|1|5|10||1|0|1|${b64('alto.exe')}|${b64('C:\\alto.exe')}`,
      'basura',
      `abc|1|1|1||1|1|0|${b64('x')}|${b64('C:\\x')}`,
      `102|1|5|10||1|0|0|***|${b64('C:\\x')}`,
      `103|1|5|10||1|0|0|${b64('rel.exe')}|${b64('relativa\\rel.exe')}`,
      // Con el formato anterior (sin la columna del privado) no se acepta.
      `105|1|5|10||1|0|${b64('viejo.exe')}|${b64('C:\\viejo.exe')}`,
    ].join('\r\n');
    const l = interpretarProcesosUsuario(salida);
    expect(l.map((p) => p.pid)).toEqual([100, 101, 104, 103]);
    expect(l[0]).toMatchObject({
      nombre: 'chrome.exe',
      ruta: 'C:\\Program Files\\Google\\chrome.exe',
      inicio: '133000000000000000',
      memoria: 943718400,
      ventana: true,
      servicio: false,
      elevado: false,
    });
    expect(l[1]).toMatchObject({ ruta: null, inicio: null, ventana: false, servicio: true });
    // Los que este usuario no pudo abrir (elevados) llegan marcados.
    expect(l[2]).toMatchObject({ pid: 104, elevado: true });
    // Una ruta que no es absoluta no se acepta: el proceso queda sin ruta (y, por tanto, protegido).
    expect(l[3]!.ruta).toBeNull();
  });

  it('lista con PowerShell de System32 por ruta absoluta, filtrando en WMI por la sesión, y no cambia nada', async () => {
    const llamadas: { cmd: string; script: string }[] = [];
    const ejecutor: Ejecutor = async (cmd, args) => {
      const script = decodificar(args);
      llamadas.push({ cmd, script });
      if (script.includes('GetCurrent().User.Value') && !script.includes('Win32_Process')) {
        return { codigo: 0, stdout: 'S-1-5-21-1-2-3-1001|2\r\n', stderr: '' };
      }
      return {
        codigo: 0,
        stdout: [
          `100|2|11|1000||1|0|0|${b64('a.exe')}|${b64('C:\\a.exe')}`,
          `101|0|11|1000||1|0|0|${b64('b.exe')}|${b64('C:\\b.exe')}`,
        ].join('\n'),
        stderr: '',
      };
    };
    const env = { SystemRoot: 'C:\\Windows' };
    const w = new ProcesosUsuarioWindows(ejecutor, env);
    const l = await w.listar();
    expect(l).toEqual([
      expect.objectContaining({ pid: 100, sesion: 2, usuario: 'S-1-5-21-1-2-3-1001' }),
    ]);
    for (const c of llamadas) {
      expect(c.cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    }
    const script = llamadas.map((c) => c.script).join('\n');
    expect(script).toContain('Win32_Process');
    expect(script).toContain('-Filter "SessionId=2"');
    expect(script).not.toContain('Where-Object');
    expect(script).toContain('GetOwnerSid');
    expect(script).not.toMatch(/Stop-Process|taskkill|Terminate|\.Kill\(|Remove-|Set-/i);
  });

  it('el script de listado solo acepta una sesión entera', () => {
    expect(scriptProcesosUsuario(0)).toContain('SessionId=0');
    for (const malo of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => scriptProcesosUsuario(malo)).toThrow();
    }
  });

  it('si no se puede leer, falla con un error del catálogo (no una lista vacía que parezca cierta)', async () => {
    const w = new ProcesosUsuarioWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }), {});
    await expect(w.listar()).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    await expect(w.identidad()).rejects.toBeInstanceOf(ErrorWolf);
    const w2 = new ProcesosUsuarioWindows(async () => {
      throw new Error('sin powershell');
    }, {});
    await expect(w2.listar()).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    expect(await w2.cerrarVentana(5, '133000000000000000', 'C:\\a.exe')).toBe('no-se-pudo');
    await expect(w2.conexiones()).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
  });

  it('el script de cierre comprueba pid, hora de inicio y ruta antes de CloseMainWindow, en el mismo script', () => {
    const inicio = '133700000000000000';
    const ruta = 'C:\\Users\\yo\\Prográma ñ\\a.exe';
    const s = scriptCerrarVentana(4321, inicio, ruta);
    expect(s).toContain('-Id 4321');
    expect(s).toContain(`[int64]${inicio}`);
    expect(s).toContain(Buffer.from(ruta, 'utf8').toString('base64'));
    // Nada de la ruta va en claro dentro del script.
    expect(s).not.toContain('Prográma');
    const iClose = s.indexOf('CloseMainWindow()');
    expect(iClose).toBeGreaterThan(s.indexOf('CreationDate'));
    expect(iClose).toBeGreaterThan(s.indexOf('ExecutablePath'));
    expect(iClose).toBeGreaterThan(s.indexOf('StartTime'));
    for (const estado of ['CERRADO', 'CAMBIO', 'SIN_VENTANA', 'NO_SE_PUDO']) {
      expect(s).toContain(`'${estado}'`);
    }
    expect(s).not.toMatch(/-Name|Stop-Process|taskkill|Kill|Terminate/i);
    // Entradas que no son lo que dicen no llegan a formar un script.
    for (const [pid, i, r] of [
      [0, inicio, ruta],
      [-1, inicio, ruta],
      [1.5, inicio, ruta],
      [Number.NaN, inicio, ruta],
      [10, '', ruta],
      [10, '12abc', ruta],
      [10, '1; Stop-Process', ruta],
      [10, '0', ruta],
      [10, '99999999999999999999', ruta],
      [10, '9223372036854775808', ruta],
      [10, inicio, ''],
    ] as [number, string, string][]) {
      expect(() => scriptCerrarVentana(pid, i, r), `${pid} ${i} ${r}`).toThrow();
    }
  });

  it('cerrarVentana distingue cerrado-pedido, cambio, sin-ventana y no-se-pudo', async () => {
    const scripts: string[] = [];
    let salida = 'CERRADO';
    let codigo = 0;
    const w = new ProcesosUsuarioWindows(async (_c, args) => {
      scripts.push(decodificar(args));
      return { codigo, stdout: salida, stderr: '' };
    }, {});
    const llamar = () => w.cerrarVentana(4321, '133700000000000000', 'C:\\a.exe');
    expect(await llamar()).toBe('cerrado-pedido');
    salida = 'CAMBIO';
    expect(await llamar()).toBe('cambio');
    salida = 'SIN_VENTANA';
    expect(await llamar()).toBe('sin-ventana');
    salida = 'NO_SE_PUDO';
    expect(await llamar()).toBe('no-se-pudo');
    // Una salida rara o un código de error nunca se toman por un cierre.
    salida = 'SI';
    expect(await llamar()).toBe('no-se-pudo');
    salida = 'CERRADO';
    codigo = 1;
    expect(await llamar()).toBe('no-se-pudo');
    expect(scripts[0]).toContain('CloseMainWindow()');
    // Con datos que no valen, ni siquiera se ejecuta nada.
    const antes = scripts.length;
    for (const malo of [0, -1, 1.5, Number.NaN]) {
      expect(await w.cerrarVentana(malo, '133700000000000000', 'C:\\a.exe')).toBe('no-se-pudo');
    }
    expect(await w.cerrarVentana(5, 'no-es-numero', 'C:\\a.exe')).toBe('no-se-pudo');
    expect(scripts).toHaveLength(antes);
  });

  it('las conexiones se leen con NETSTAT de System32 y se ignoran las que se están cerrando', async () => {
    const llamadas: { cmd: string; args: string[] }[] = [];
    const w = new ProcesosUsuarioWindows(
      async (cmd, args) => {
        llamadas.push({ cmd, args });
        return {
          codigo: 0,
          stdout: [
            '  TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       1234',
            '  TCP    127.0.0.1:3306         127.0.0.1:51000        ESTABLISHED     1234',
            '  TCP    127.0.0.1:51000        127.0.0.1:3306         ESTABLECIDO     777',
            '  TCP    127.0.0.1:3306         127.0.0.1:51001        TIME_WAIT       0',
            '  TCP    127.0.0.1:3306         127.0.0.1:51002        CLOSE_WAIT      1234',
            '  TCP    [::1]:6379             [::1]:52000            ÉTABLI          555',
          ].join('\r\n'),
          stderr: '',
        };
      },
      { SystemRoot: 'C:\\Windows' },
    );
    expect(await w.conexiones()).toEqual([
      { puertoLocal: 3306, puertoRemoto: 51000, pid: 1234 },
      { puertoLocal: 51000, puertoRemoto: 3306, pid: 777 },
      { puertoLocal: 6379, puertoRemoto: 52000, pid: 555 },
    ]);
    expect(llamadas[0]!.cmd).toMatch(/System32.NETSTAT\.EXE$/i);
    expect(interpretarNetstatEstablecidas('basura\n  TCP  x  y')).toEqual([]);
  });

  it('netstat se llama con -ano y sin -p (que solo lista IPv4); con salida mixta ve IPv4 e IPv6 y descarta UDP (C1)', async () => {
    const llamadas: string[][] = [];
    const w = new ProcesosUsuarioWindows(
      async (_cmd, args) => {
        llamadas.push(args);
        return {
          codigo: 0,
          stdout: [
            '',
            'Conexiones activas',
            '  Proto  Dirección local        Dirección remota       Estado           PID',
            '  TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       1234',
            '  TCP    [::]:3306              [::]:0                 LISTENING       1234',
            '  TCP    127.0.0.1:51000        127.0.0.1:3306         ESTABLISHED     777',
            '  TCP    [::1]:52000            [::1]:3306             ESTABLISHED     888',
            '  UDP    0.0.0.0:5353           *:*                                    999',
            '  UDP    [::]:5353              *:*                                    999',
          ].join('\r\n'),
          stderr: '',
        };
      },
      { SystemRoot: 'C:\\Windows' },
    );
    const c = await w.conexiones();
    expect(llamadas).toEqual([['-ano']]);
    expect(c).toEqual([
      { puertoLocal: 51000, puertoRemoto: 3306, pid: 777 },
      { puertoLocal: 52000, puertoRemoto: 3306, pid: 888 },
    ]);
  });

  it('una salida parcial de netstat no se toma por completa (I1)', async () => {
    const parcial = [
      '  TCP    127.0.0.1:51000        127.0.0.1:3306         ESTABLISHED     777',
    ].join('\r\n');
    const conCodigo = new ProcesosUsuarioWindows(
      async () => ({ codigo: 1, stdout: parcial, stderr: 'fallo' }),
      {},
    );
    await expect(conCodigo.conexiones()).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    const sinFilas = new ProcesosUsuarioWindows(
      async () => ({ codigo: 0, stdout: 'Conexiones activas\r\n\r\n', stderr: '' }),
      {},
    );
    await expect(sinFilas.conexiones()).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    // Solo filas en LISTENING cuentan como una lectura válida (sin conexiones en curso).
    const soloEscucha = new ProcesosUsuarioWindows(
      async () => ({
        codigo: 0,
        stdout: '  TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       1234',
        stderr: '',
      }),
      {},
    );
    expect(await soloEscucha.conexiones()).toEqual([]);
  });

  it('"elevado" se detecta con Process.Handle (StartTime no falla con permisos limitados) en el listado y en el cierre (I2)', async () => {
    const listado = scriptProcesosUsuario(1);
    expect(listado).toContain('.Handle');
    expect(listado).not.toContain('.StartTime');
    const cierre = scriptCerrarVentana(4321, '133700000000000000', 'C:\\a.exe');
    const iHandle = cierre.indexOf('$p.Handle');
    expect(iHandle).toBeGreaterThan(-1);
    expect(iHandle).toBeLessThan(cierre.indexOf('CloseMainWindow()'));
    expect(cierre.slice(iHandle, iHandle + 80)).toContain("'NO_SE_PUDO'");
  });

  it('inicioDe devuelve la hora de inicio, null si no existe y falla si no se puede consultar', async () => {
    let salida = '133700000000000000';
    let codigo = 0;
    const w = new ProcesosUsuarioWindows(async () => ({ codigo, stdout: salida, stderr: '' }), {});
    expect(await w.inicioDe(10)).toBe('133700000000000000');
    salida = 'NO_EXISTE';
    expect(await w.inicioDe(10)).toBeNull();
    salida = 'raro';
    await expect(w.inicioDe(10)).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    salida = '1';
    codigo = 1;
    await expect(w.inicioDe(10)).rejects.toMatchObject({ codigo: 'memoria.no_disponible' });
    await expect(w.inicioDe(0)).rejects.toBeInstanceOf(ErrorWolf);
  });

  it('las carpetas protegidas incluyen Windows y Windows Defender', () => {
    const w = new ProcesosUsuarioWindows(async () => ({ codigo: 0, stdout: '', stderr: '' }), {
      SystemRoot: 'D:\\Win',
      ProgramFiles: 'D:\\PF',
    });
    const r = w.rutasProtegidas();
    expect(r).toContain('D:\\Win');
    expect(r).toContain('D:\\PF\\Windows Defender');
  });
});
