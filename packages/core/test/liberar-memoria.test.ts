import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { completarPlataforma } from '../src/plataforma/index';
import { SALIDA_COPIA, scriptElevar, codificarComando } from '../src/plataforma/hostsAdmin';
import {
  interpretarMemoriaSistema,
  interpretarVaciado,
  SALIDA_PURGA,
  SCRIPT_MEMORIA_SISTEMA,
  scriptPurgarListaEspera,
  scriptVaciarWorkingSets,
} from '../src/plataforma/memoriaWin';
import type { PlataformaCompleta, ProcesoUsuario } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';
import {
  LiberadorMemoria,
  NIVELES_MEMORIA,
  type DepsLiberarMemoria,
} from '../src/sistema/liberarMemoria';
import { carpetaTemporal } from './temporales';
import { analizarPowerShell, hayPowerShell } from './soporte/parserPowerShell';

const MB = 1024 * 1024;
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

/** Quita comentarios de bloque y de línea (los comentarios pueden hablar de lo que no se hace). */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');

const proc = (p: Partial<ProcesoUsuario> & { pid: number; nombre: string }): ProcesoUsuario => ({
  ruta: `C:\\Users\\yo\\AppData\\Local\\${p.nombre}`,
  inicio: `${p.pid}0000`,
  memoria: 500 * MB,
  ventana: true,
  sesion: 1,
  usuario: 'S-1-5-21-yo',
  ...p,
});

/** Máquina con de todo: protegidos, ajenos, WolfCore Dev, FlyEnv y programas normales. */
function escenario(): PlataformaFalsa {
  const falsa = new PlataformaFalsa();
  falsa.prohibirMatar = true;
  falsa.procesosUsuario = [
    proc({ pid: 100, nombre: 'chrome.exe', memoria: 900 * MB }),
    proc({ pid: 101, nombre: 'Code.exe', memoria: 600 * MB }),
    proc({ pid: 102, nombre: 'pequeno.exe', memoria: 10 * MB }),
    proc({ pid: 103, nombre: 'sinventana.exe', ventana: false, memoria: 700 * MB }),
    proc({ pid: 200, nombre: 'svchost.exe', ruta: 'C:\\Windows\\System32\\svchost.exe' }),
    proc({ pid: 201, nombre: 'explorer.exe', ruta: 'C:\\Windows\\explorer.exe' }),
    proc({ pid: 202, nombre: 'dwm.exe', ruta: 'C:\\Windows\\System32\\dwm.exe' }),
    proc({
      pid: 205,
      nombre: 'MsMpEng.exe',
      ruta: 'C:\\Program Files\\Windows Defender\\MsMpEng.exe',
    }),
    // Por nombre: un «explorer.exe» fuera de Windows tampoco se toca (barrera adicional).
    proc({ pid: 206, nombre: 'explorer.exe', ruta: 'C:\\Users\\yo\\Descargas\\explorer.exe' }),
    proc({ pid: 210, nombre: 'FlyEnv.exe', ruta: 'C:\\Users\\yo\\FlyEnv\\FlyEnv.exe' }),
    proc({ pid: 211, nombre: 'nginx.exe', ruta: 'D:\\PhpWebStudy\\nginx.exe' }),
    proc({ pid: 220, nombre: 'WolfCore Dev.exe', ruta: 'C:\\Apps\\WolfCore\\WolfCore Dev.exe' }),
    proc({ pid: 221, nombre: 'hijo.exe', ruta: 'C:\\Apps\\hijo.exe' }),
    proc({
      pid: 222,
      nombre: 'mysqld.exe',
      ruta: 'C:\\Users\\yo\\AppData\\Local\\WolfCoreDev\\bin\\mysql\\mysqld.exe',
    }),
    proc({ pid: 230, nombre: 'ajeno.exe', usuario: 'S-1-5-21-otro' }),
    proc({ pid: 231, nombre: 'otra-sesion.exe', sesion: 0 }),
    proc({ pid: 232, nombre: 'servicio.exe', servicio: true }),
    proc({ pid: 233, nombre: 'sinruta.exe', ruta: null }),
    proc({ pid: 234, nombre: 'elevado.exe', elevado: true }),
  ];
  // WolfCore Dev (220) tiene un hijo (221) que ningún nombre delata; 222 lo supervisa.
  falsa.hijos.set(220, [221]);
  return falsa;
}

function liberador(falsa: PlataformaFalsa, extra: Partial<DepsLiberarMemoria> = {}) {
  return new LiberadorMemoria({
    plataforma: falsa,
    rutasPropias: () => ['C:\\Users\\yo\\AppData\\Local\\WolfCoreDev', 'C:\\Apps\\WolfCore'],
    pidApp: 220,
    pidsSupervisados: () => [222],
    esperar: async () => undefined,
    ...extra,
  });
}

const PROPIOS = [220, 221, 222];
const DEL_USUARIO = [100, 101, 103];
const pidsDe = (l: { pid: number }[]): number[] => l.map((x) => x.pid).sort((a, b) => a - b);

describe('liberar memoria: estimación (D54b)', () => {
  it('Liviano suma lo de WolfCore y sus servicios; Moderado añade lo del usuario; Profundo la lista de espera', async () => {
    const falsa = escenario();
    const e = await liberador(falsa).estimar();
    expect(e.niveles.liviano).toEqual({
      bytes: 1500 * MB,
      tipo: 'hasta',
      procesos: 3,
      requiereAdmin: false,
    });
    // chrome 900 + Code 600 + sinventana 700 (el pequeño de 10 MB no cuenta).
    expect(e.niveles.moderado).toEqual({
      bytes: 1500 * MB + 2200 * MB,
      tipo: 'hasta',
      procesos: 6,
      requiereAdmin: false,
    });
    // Profundo: los procesos como Moderado; la lista de espera va aparte (dos cifras).
    expect(e.niveles.profundo).toEqual({
      bytes: 1500 * MB + 2200 * MB,
      tipo: 'hasta',
      procesos: 6,
      requiereAdmin: true,
    });
    expect(e.listaEspera).toBe(6 * 1024 * MB);
    expect(e.sistema?.disponible).toBe(8 * 1024 * MB);
  });

  it('si no se puede medir la lista de espera, esa cifra es null y las de los procesos se calculan', async () => {
    const falsa = escenario();
    falsa.memoria = {
      total: 16 * 1024 * MB,
      disponible: 8 * 1024 * MB,
      libre: null,
      listaEspera: null,
    };
    const e = await liberador(falsa).estimar();
    expect(e.listaEspera).toBeNull();
    expect(e.niveles.profundo.bytes).toBe(3700 * MB);
    expect(e.niveles.liviano.bytes).toBe(1500 * MB);
    expect(e.niveles.moderado.bytes).not.toBeNull();
  });

  it('sin memoria del sistema ni lista de procesos no se inventa nada', async () => {
    const falsa = escenario();
    falsa.memoria = null;
    falsa.fallaListado = true;
    const e = await liberador(falsa).estimar();
    expect(e.sistema).toBeNull();
    expect(e.niveles.liviano.bytes).toBeNull();
    expect(e.niveles.moderado.bytes).toBeNull();
    expect(e.niveles.profundo.bytes).toBeNull();
  });

  it('solo lee: no vacía ni purga nada', async () => {
    const falsa = escenario();
    await liberador(falsa).estimar();
    expect(falsa.vaciados).toEqual([]);
    expect(falsa.purgas).toBe(0);
  });
});

describe('liberar memoria: qué procesos entran en cada nivel', () => {
  it('Liviano: solo el árbol de WolfCore y lo que supervisa', async () => {
    const falsa = escenario();
    await liberador(falsa).liberar('liviano', true);
    expect(pidsDe(falsa.vaciados[0]!)).toEqual(PROPIOS);
  });

  it('Moderado: además los del usuario no críticos; nunca sistema, protegidos, ajenos ni elevados', async () => {
    const falsa = escenario();
    await liberador(falsa).liberar('moderado', true);
    expect(pidsDe(falsa.vaciados[0]!)).toEqual([...DEL_USUARIO, ...PROPIOS]);
    // Cada objetivo lleva la hora de inicio que se vio (la plataforma la vuelve a comprobar).
    expect(falsa.vaciados[0]!.find((o) => o.pid === 100)?.inicio).toBe('1000000');
  });

  it('se elige por PID y propietario: otro usuario u otra sesión no entran aunque el nombre sea normal', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.push(
      proc({ pid: 300, nombre: 'notepad.exe', usuario: 'S-1-5-21-otro' }),
      proc({ pid: 301, nombre: 'notepad.exe', sesion: 2 }),
    );
    await liberador(falsa).liberar('moderado', true);
    const pids = pidsDe(falsa.vaciados[0]!);
    expect(pids).not.toContain(300);
    expect(pids).not.toContain(301);
  });

  it('los procesos protegidos nunca se piden ni con un propietario correcto', async () => {
    const falsa = escenario();
    await liberador(falsa).liberar('profundo', true);
    const pedidos = pidsDe(falsa.vaciados[0]!);
    for (const protegido of [200, 201, 202, 205, 206, 210, 211, 230, 231, 232, 233, 234, 102]) {
      expect(pedidos).not.toContain(protegido);
    }
  });

  it('no existe forma de cerrar ni matar: nada se cierra y no se mata nada', async () => {
    const falsa = escenario();
    await liberador(falsa).liberar('profundo', true);
    expect(falsa.matados).toEqual([]);
    // Ni siquiera existe la capacidad de pedir el cierre de una ventana.
    expect('cerrarVentanaPrincipal' in falsa).toBe(false);
  });

  it('si un proceso cambió entre elegirlo y actuar (otra hora de inicio), la plataforma lo salta', async () => {
    const falsa = escenario();
    const real = falsa.vaciarWorkingSets.bind(falsa);
    const envuelta = Object.create(falsa) as PlataformaFalsa;
    envuelta.vaciarWorkingSets = async (objetivos) => {
      // Entre la selección y el vaciado, el PID 100 lo heredó otro programa.
      falsa.procesosUsuario.find((p) => p.pid === 100)!.inicio = 'otro-inicio';
      return real(objetivos);
    };
    const r = await liberador(envuelta).liberar('moderado', true);
    expect(r.procesosSaltados).toBe(1);
    expect(r.procesosVaciados).toBe(5);
    expect(falsa.procesosUsuario.find((p) => p.pid === 100)?.memoria).toBe(900 * MB);
  });

  it('un elevado que se coló en la lista se salta sin contarse como vaciado', async () => {
    const falsa = escenario();
    const mal = falsa.procesosUsuario.find((p) => p.pid === 101)!;
    // Windows no dejó abrirlo aunque la lista no lo marcara como elevado.
    const real = falsa.vaciarWorkingSets.bind(falsa);
    const envuelta = Object.create(falsa) as PlataformaFalsa;
    envuelta.vaciarWorkingSets = async (o) => {
      mal.elevado = true;
      return real(o);
    };
    const r = await liberador(envuelta).liberar('moderado', true);
    expect(r.procesosSaltados).toBe(1);
  });
});

describe('liberar memoria: confirmación y Profundo', () => {
  it('Profundo sin confirmar (ni false, ni «true», ni 1) no lanza nada: ni vacía ni pide el UAC', async () => {
    for (const valor of [undefined, false, 'true', 1, null]) {
      const falsa = escenario();
      await expect(liberador(falsa).liberar('profundo', valor)).rejects.toMatchObject({
        codigo: 'memoria.sin_confirmar',
      });
      expect(falsa.vaciados).toEqual([]);
      expect(falsa.purgas).toBe(0);
    }
  });

  it('Profundo confirmado vacía primero los procesos y después la lista de espera (con UAC)', async () => {
    const falsa = escenario();
    const orden: string[] = [];
    const vaciar = falsa.vaciarWorkingSets.bind(falsa);
    const purgar = falsa.purgarListaEspera.bind(falsa);
    const envuelta = Object.create(falsa) as PlataformaFalsa;
    envuelta.vaciarWorkingSets = async (o) => (orden.push('vaciar'), vaciar(o));
    envuelta.purgarListaEspera = async () => (orden.push('purgar'), purgar());
    const r = await liberador(envuelta).liberar('profundo', true);
    expect(orden).toEqual(['vaciar', 'purgar']);
    expect(r.purga).toBe('hecha');
    expect(r.detallePurga).toBeNull();
  });

  it('Liviano y Moderado jamás piden administrador', async () => {
    for (const nivel of ['liviano', 'moderado'] as const) {
      const falsa = escenario();
      const r = await liberador(falsa).liberar(nivel, true);
      expect(falsa.purgas).toBe(0);
      expect(r.purga).toBe('no-aplica');
    }
  });

  it('un UAC cancelado, vencido o fallido se cuenta tal cual y lo vaciado antes se conserva', async () => {
    const casos = [
      [{ ok: false, motivo: 'cancelado' }, 'cancelada'],
      [{ ok: false, motivo: 'tiempo' }, 'tiempo'],
      [{ ok: false, motivo: 'denegado', detalle: 'x' }, 'error'],
      [{ ok: false, motivo: 'error', detalle: 'fallo' }, 'error'],
      // Menor 3: la lista de espera se vació y la caché no, con su propio estado.
      [{ ok: false, motivo: 'sin-cache', detalle: 'caché' }, 'sin-cache'],
    ] as const;
    for (const [res, esperado] of casos) {
      const falsa = escenario();
      falsa.resultadoPurga = res;
      const r = await liberador(falsa).liberar('profundo', true);
      expect(r.purga).toBe(esperado);
      expect(r.procesosVaciados).toBe(6);
    }
  });

  it('un nivel que no existe se rechaza con un error del catálogo', async () => {
    const falsa = escenario();
    const e = await liberador(falsa)
      .liberar('extremo' as never, true)
      .catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorWolf);
    expect(e).toMatchObject({ codigo: 'memoria.modo_invalido' });
    expect(NIVELES_MEMORIA).toEqual(['liviano', 'moderado', 'profundo']);
  });

  it('dos liberaciones seguidas no se mezclan: una a la vez', async () => {
    const falsa = escenario();
    const eventos: string[] = [];
    const vaciar = falsa.vaciarWorkingSets.bind(falsa);
    const envuelta = Object.create(falsa) as PlataformaFalsa;
    envuelta.vaciarWorkingSets = async (o) => {
      eventos.push('ini');
      await new Promise((r) => setTimeout(r, 10));
      const res = await vaciar(o);
      eventos.push('fin');
      return res;
    };
    const l = liberador(envuelta);
    await Promise.all([l.liberar('liviano', true), l.liberar('liviano', true)]);
    expect(eventos).toEqual(['ini', 'fin', 'ini', 'fin']);
  });
});

describe('liberar memoria: lo liberado de verdad', () => {
  it('es la diferencia medida de la memoria disponible, antes y después', async () => {
    const falsa = escenario();
    const antes = (await falsa.memoriaDelSistema())!;
    const r = await liberador(falsa).liberar('moderado', true);
    expect(r.antes?.disponible).toBe(antes.disponible);
    // El falso devuelve el 90 % de cada conjunto de trabajo vaciado: 6 procesos × 500/900/600/700 MB.
    const vaciado = (1500 * MB + 2200 * MB) * 0.9;
    expect(r.recortado).toBeCloseTo(vaciado, -3);
    expect(r.despues!.disponible - r.antes!.disponible).toBeCloseTo(vaciado, -3);
    expect(r.aumentoDisponible).toBe(r.despues!.disponible - r.antes!.disponible);
  });

  it('si la memoria baja (otro programa pidió más), lo liberado es 0 y no un número negativo', async () => {
    const falsa = escenario();
    const envuelta = Object.create(falsa) as PlataformaFalsa;
    const medir = falsa.memoriaDelSistema.bind(falsa);
    let n = 0;
    envuelta.memoriaDelSistema = async () => {
      const m = (await medir())!;
      return n++ === 0 ? m : { ...m, disponible: m.disponible - 5 * 1024 * MB };
    };
    const r = await liberador(envuelta).liberar('liviano', true);
    expect(r.aumentoDisponible).toBe(0);
  });

  it('si no se puede medir, aumentoDisponible es null («No disponible»), nunca una cifra inventada', async () => {
    const falsa = escenario();
    falsa.memoria = null;
    const r = await liberador(falsa).liberar('liviano', true);
    expect(r.antes).toBeNull();
    expect(r.despues).toBeNull();
    expect(r.aumentoDisponible).toBeNull();
  });

  it('Profundo pasa la lista de espera a memoria libre', async () => {
    const falsa = escenario();
    const r = await liberador(falsa).liberar('profundo', true);
    expect(r.despues!.listaEspera).toBe(0);
    expect(r.despues!.libre!).toBeGreaterThan(r.antes!.libre!);
  });

  it('espera antes de volver a medir', async () => {
    const falsa = escenario();
    const esperas: number[] = [];
    await liberador(falsa, {
      esperar: async (ms) => void esperas.push(ms),
      esperaMedirMs: 777,
    }).liberar('liviano', true);
    expect(esperas).toEqual([777]);
  });
});

describe('liberar memoria: Windows (ejecutor falso, nada real)', () => {
  const scriptDe = (args: string[]): string => {
    const b64 = /-EncodedCommand ([A-Za-z0-9+/=]+)/.exec(args.join(' '))?.[1] ?? '';
    return Buffer.from(b64, 'base64').toString('utf16le');
  };
  const exeSistema = /system32[\\/]windowspowershell[\\/]v1\.0[\\/]powershell\.exe$/i;

  it('memoriaDelSistema usa la PowerShell de System32 con -EncodedCommand y no eleva', async () => {
    const llamadas: { cmd: string; args: string[] }[] = [];
    const p = new PlataformaWindows(
      async (cmd, args) => {
        llamadas.push({ cmd, args });
        return { codigo: 0, stdout: '1000|400|100|300\n', stderr: '' };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    expect(await p.memoriaDelSistema()).toEqual({
      total: 1000,
      disponible: 400,
      libre: 100,
      listaEspera: 300,
    });
    expect(llamadas[0]!.cmd).toMatch(exeSistema);
    expect(llamadas[0]!.args).toContain('-EncodedCommand');
    expect(scriptDe(llamadas[0]!.args)).toBe(SCRIPT_MEMORIA_SISTEMA);
  });

  it('memoriaDelSistema da null si falla o la salida no cuadra', async () => {
    const fallo = new PlataformaWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }));
    expect(await fallo.memoriaDelSistema()).toBeNull();
    const basura = new PlataformaWindows(async () => ({ codigo: 0, stdout: 'hola', stderr: '' }));
    expect(await basura.memoriaDelSistema()).toBeNull();
  });

  it('vaciarWorkingSets corre el script sin elevar y solo acepta las líneas de los PIDs pedidos', async () => {
    const llamadas: string[][] = [];
    const p = new PlataformaWindows(
      async (_c, args) => {
        llamadas.push(args);
        return {
          codigo: 0,
          stdout: '100|VACIADO|900|90\n999|VACIADO|1|1\n101|CAMBIO|0|0\nbasura\n',
          stderr: '',
        };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    const r = await p.vaciarWorkingSets([
      { pid: 100, inicio: '123' },
      { pid: 101, inicio: '456' },
    ]);
    expect(r).toEqual([
      { pid: 100, estado: 'vaciado', antes: 900, despues: 90 },
      { pid: 101, estado: 'cambio', antes: 0, despues: 0 },
    ]);
    expect(llamadas[0]).not.toContain('-Command');
    expect(await p.vaciarWorkingSets([])).toEqual([]);
    expect(llamadas).toHaveLength(1);
  });

  it('si el vaciado se corta a medias, devuelve lo ya hecho; si no hizo nada, falla con el catálogo', async () => {
    const corte = new PlataformaWindows(
      async () => ({
        codigo: 1,
        stdout: '100|VACIADO|900|90\n',
        stderr: 'timeout',
      }),
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    const objetivos = [
      { pid: 100, inicio: '1' },
      { pid: 101, inicio: '2' },
    ];
    expect(await corte.vaciarWorkingSets(objetivos)).toEqual([
      { pid: 100, estado: 'vaciado', antes: 900, despues: 90 },
    ]);
    const nada = new PlataformaWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }));
    await expect(nada.vaciarWorkingSets(objetivos)).rejects.toMatchObject({
      codigo: 'memoria.no_disponible',
    });
  });

  it('purgarListaEspera eleva con el patrón común (-Command exterior con runas, plazo) y no escribe nada en %TEMP%', async () => {
    const dir = await carpetaTemporal('pel-mem-');
    const llamadas: { cmd: string; args: string[]; timeoutMs?: number }[] = [];
    const p = new PlataformaWindows(
      async (cmd, args, o) => {
        llamadas.push({ cmd, args, timeoutMs: o?.timeoutMs });
        return { codigo: 0, stdout: '', stderr: '' };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' }, carpetaTemporal: dir },
    );
    expect(await p.purgarListaEspera()).toEqual({ ok: true });
    const l = llamadas[0]!;
    expect(l.cmd).toMatch(exeSistema);
    expect(l.args[0]).toBe('-NoProfile');
    expect(l.args[1]).toBe('-Command');
    const externo = l.args[2]!;
    expect(externo).toContain("$i.Verb = 'runas'");
    // El comando elevado va codificado dentro del exterior.
    expect(externo).toContain(codificarComando(scriptPurgarListaEspera()));
    expect(l.timeoutMs).toBeGreaterThan(0);
    // Ninguna salida (ni entrada) en la carpeta temporal.
    expect(await readdir(dir)).toEqual([]);
  });

  it('cada salida del script elevado tiene su motivo', async () => {
    const con = (codigo: number) =>
      new PlataformaWindows(async () => ({ codigo, stdout: '', stderr: '' }), undefined, {
        entorno: { SystemRoot: 'C:\\Windows' },
      }).purgarListaEspera();
    expect(await con(SALIDA_COPIA.cancelado)).toEqual({ ok: false, motivo: 'cancelado' });
    expect(await con(SALIDA_PURGA.privilegio)).toMatchObject({ ok: false, motivo: 'denegado' });
    expect(await con(SALIDA_PURGA.listaEspera)).toMatchObject({ ok: false, motivo: 'error' });
    expect(await con(SALIDA_PURGA.cacheArchivos)).toMatchObject({
      ok: false,
      motivo: 'sin-cache',
      detalle: expect.stringContaining('caché de archivos'),
    });
  });

  it('el Profundo del núcleo con Windows falso no elevó nada hasta confirmar', async () => {
    const llamadas: string[] = [];
    const p = new PlataformaWindows(
      async (_c, args) => {
        llamadas.push(scriptDe(args) || args.join(' '));
        return { codigo: 0, stdout: '', stderr: '' };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    const l = new LiberadorMemoria({
      plataforma: p as unknown as DepsLiberarMemoria['plataforma'],
      rutasPropias: () => [],
      pidApp: 1,
      pidsSupervisados: () => [],
      esperar: async () => undefined,
    });
    await expect(l.liberar('profundo', false)).rejects.toMatchObject({
      codigo: 'memoria.sin_confirmar',
    });
    expect(llamadas).toEqual([]);
  });
});

describe('liberar memoria: intérpretes', () => {
  it('interpretarMemoriaSistema acepta lo coherente y rechaza lo demás', () => {
    expect(interpretarMemoriaSistema('100|40|10|20')).toEqual({
      total: 100,
      disponible: 40,
      libre: 10,
      listaEspera: 20,
    });
    // Sin contador de rendimiento: libre y lista de espera quedan null.
    expect(interpretarMemoriaSistema('100|40||')).toEqual({
      total: 100,
      disponible: 40,
      libre: null,
      listaEspera: null,
    });
    for (const mal of ['', 'a|b|c|d', '0|0|0|0', '100|200|0|0', '100|40|10', '-1|5||']) {
      expect(interpretarMemoriaSistema(mal)).toBeNull();
    }
    // Un campo opcional absurdo (más que el total) se descarta, no se inventa.
    expect(interpretarMemoriaSistema('100|40|500|20')?.libre).toBeNull();
  });

  it('interpretarVaciado ignora PIDs no pedidos, repetidos y líneas con otro formato', () => {
    const r = interpretarVaciado(
      '5|VACIADO|10|1\n5|CAMBIO|0|0\n6|RARO|1|1\n7|NO_SE_PUDO|4|4\n8|VACIADO|1|1',
      [
        { pid: 5, inicio: '1' },
        { pid: 6, inicio: '1' },
        { pid: 7, inicio: '1' },
      ],
    );
    expect(r).toEqual([
      { pid: 5, estado: 'vaciado', antes: 10, despues: 1 },
      { pid: 7, estado: 'no-se-pudo', antes: 4, despues: 4 },
    ]);
  });
});

describe('liberar memoria: los scripts (analizados con el parser, sin ejecutarlos)', () => {
  const objetivos = [
    { pid: 100, inicio: '133000000000000000' },
    { pid: 101, inicio: '133000000000000001' },
  ];

  it('rechazan PIDs y horas que no son números', () => {
    expect(() => scriptVaciarWorkingSets([{ pid: 4, inicio: '1' }])).toThrow();
    expect(() => scriptVaciarWorkingSets([{ pid: 10, inicio: "1'; calc" }])).toThrow();
    expect(() => scriptVaciarWorkingSets([{ pid: 1.5, inicio: '1' }])).toThrow();
  });

  it.skipIf(!hayPowerShell())('los tres scripts son PowerShell válido', () => {
    const [vaciar, sistema, purga] = analizarPowerShell([
      scriptVaciarWorkingSets(objetivos),
      SCRIPT_MEMORIA_SISTEMA,
      scriptPurgarListaEspera(),
    ]);
    expect(vaciar!.errores).toEqual([]);
    expect(sistema!.errores).toEqual([]);
    expect(purga!.errores).toEqual([]);
  });

  it.skipIf(!hayPowerShell())(
    'ninguno cierra o termina procesos, ni escribe archivos o el registro',
    () => {
      const prohibidos =
        /^(stop-process|taskkill|kill|remove-item|set-content|add-content|out-file|new-item|set-itemproperty|new-itemproperty|invoke-expression|iex|start-process|invoke-webrequest|invoke-restmethod)$/i;
      const todos = analizarPowerShell([
        scriptVaciarWorkingSets(objetivos),
        SCRIPT_MEMORIA_SISTEMA,
        scriptPurgarListaEspera(),
      ]);
      for (const a of todos) {
        expect(a.comandos.filter((c) => prohibidos.test(c))).toEqual([]);
      }
    },
  );

  it('el de purga no recibe nada del usuario y no devuelve datos (solo su código de salida)', () => {
    const s = scriptPurgarListaEspera();
    expect(s).not.toMatch(/Out-File|Set-Content|\[IO\.File\]|%TEMP%|\$env:TEMP|HKLM|WriteLine/i);
    // Tamaño fijo: el mismo comando siempre.
    expect(scriptPurgarListaEspera()).toBe(s);
    // Privilegios por número (RtlAdjustPrivilege): 5 = cuota, 13 = perfil de un solo proceso.
    expect(s).toContain('RtlAdjustPrivilege');
    expect(s).toContain('Activar-Privilegio 13');
    expect(s).not.toMatch(/Add-Type|OpenProcessToken|AdjustTokenPrivileges|LookupPrivilegeValue/);
    // El comando elevado, ya envuelto, cabe holgado en una línea de comandos.
    expect(scriptElevar(codificarComando(s)).length).toBeLessThan(12_000);
  });

  it('el de vaciado comprueba sesión, dueño, hora de inicio y servicio por cada PID, y usa EmptyWorkingSet', () => {
    const s = scriptVaciarWorkingSets(objetivos);
    expect(s).toContain('$ses');
    expect(s).toContain('GetOwnerSid');
    expect(s).toContain('CreationDate');
    expect(s).toContain('Win32_Service');
    expect(s).toContain('EmptyWorkingSet');
  });

  it('la purga vacía primero la caché de archivos y después la lista de espera (Menor 4)', () => {
    const s = scriptPurgarListaEspera();
    expect(s.indexOf('SetSystemFileCacheSize(')).toBeGreaterThan(0);
    expect(s.indexOf('SetSystemFileCacheSize(')).toBeLessThan(
      s.indexOf('NtSetSystemInformation(80'),
    );
    // Si falla la caché se sigue con la lista y se sale con su propio código al final.
    expect(s.indexOf('NtSetSystemInformation(80')).toBeLessThan(
      s.indexOf(`exit ${SALIDA_PURGA.cacheArchivos}`),
    );
  });

  it('el vaciado lee Win32_Process y Win32_Service una sola vez, antes del bucle (Menor 2)', () => {
    const s = scriptVaciarWorkingSets(objetivos);
    expect(s.match(/Get-CimInstance Win32_Process/g)).toHaveLength(1);
    expect(s.match(/Get-CimInstance Win32_Service/g)).toHaveLength(1);
    const bucle = s.indexOf('foreach ($x in $objetivos)');
    expect(s.indexOf('Get-CimInstance Win32_Process')).toBeLessThan(bucle);
    expect(s.indexOf('Get-CimInstance Win32_Service')).toBeLessThan(bucle);
    // Plazo propio: al vencer deja de vaciar y sale bien (lo ya impreso es lo hecho).
    expect(s).toContain('$reloj.ElapsedMilliseconds -gt 90000) { break }');
    expect(() => scriptVaciarWorkingSets(objetivos, 5)).toThrow();
  });

  it('el vaciado abre el handle y compara la hora de creación en ESE handle antes de vaciar (Menor 1)', () => {
    const s = scriptVaciarWorkingSets(objetivos);
    const abrir = s.indexOf('$Ws::OpenProcess(');
    const tiempos = s.indexOf('$Ws::GetProcessTimes($h');
    const vaciar = s.indexOf('$Ws::EmptyWorkingSet($h)');
    expect(abrir).toBeGreaterThan(0);
    expect(abrir).toBeLessThan(tiempos);
    expect(tiempos).toBeLessThan(vaciar);
    // El handle se cierra siempre.
    expect(s).toContain('finally { if ($h -ne [IntPtr]::Zero) { $null = $Ws::CloseHandle($h) } }');
  });
});

describe.skipIf(process.platform !== 'win32' || !hayPowerShell())(
  'liberar memoria: el script de vaciado con PowerShell real (sin vaciar nada)',
  () => {
    it('un PID que no existe sale como CAMBIO y el tipo en memoria se crea sin errores', () => {
      const r = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-EncodedCommand',
          codificarComando(
            scriptVaciarWorkingSets([{ pid: 4_000_000, inicio: '133000000000000000' }]),
          ),
        ],
        { encoding: 'utf8', windowsHide: true, timeout: 120_000 },
      );
      expect(r.status).toBe(0);
      expect(r.stdout.trim()).toBe('4000000|CAMBIO|0|0');
    });
  },
);

describe('guardia: liberar memoria no tiene cómo matar un proceso', () => {
  const PROHIBIDO =
    /taskkill|Stop-Process|TerminateProcess|matarArbol|process\.kill|\.Kill\(|\bkill\(/i;
  for (const rel of [
    'sistema/memoria.ts',
    'sistema/liberarMemoria.ts',
    'plataforma/memoriaWin.ts',
    'plataforma/procesosUsuarioWin.ts',
    'plataforma/respaldoMemoria.ts',
  ]) {
    it(`${rel} no contiene ninguna forma de terminar un proceso`, async () => {
      const codigo = sinComentarios(await readFile(path.join(SRC, rel), 'utf8'));
      expect(codigo).not.toMatch(PROHIBIDO);
    });
  }

  it('el núcleo de la herramienta no usa process.platform', async () => {
    for (const rel of ['sistema/liberarMemoria.ts', 'sistema/memoria.ts']) {
      const codigo = sinComentarios(await readFile(path.join(SRC, rel), 'utf8'));
      expect(codigo).not.toMatch(/process\.platform/);
    }
  });
});

describe('fuera de Windows: respaldo neutro', () => {
  it('no mide, no vacía nada y no eleva; con un resultado del catálogo', async () => {
    const llamadas: string[] = [];
    const respaldoWindows = new Proxy({} as PlataformaCompleta, {
      get: (_o, k) => {
        llamadas.push(String(k));
        return () => {
          throw new Error('no debe llamarse');
        };
      },
    });
    const p = completarPlataforma({ rutaHosts: () => 'x' } as never, respaldoWindows, 'linux');
    expect(await p.memoriaDelSistema()).toBeNull();
    expect(await p.vaciarWorkingSets([{ pid: 10, inicio: '1' }])).toEqual([]);
    expect(await p.purgarListaEspera()).toMatchObject({ ok: false, motivo: 'error' });
    expect(llamadas).toEqual([]);
  });
});
