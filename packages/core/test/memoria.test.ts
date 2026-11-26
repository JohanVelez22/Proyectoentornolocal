import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Nucleo } from '../src/nucleo';
import { carpetaTemporal } from './temporales';
import { Metricas } from '../src/monitor/metricas';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  interpretarProcesosUsuario,
  ProcesosUsuarioWindows,
  scriptCerrarVentana,
} from '../src/plataforma/procesosUsuarioWin';
import type { Ejecutor, ProcesoUsuario } from '../src/plataforma/tipos';
import { ServicioPhp } from '../src/servicios/php';
import {
  motivoProtegido,
  OptimizadorMemoria,
  type CacheApp,
  type DepsMemoria,
  type PoolReducible,
  type ServicioPropio,
} from '../src/sistema/memoria';

const MB = 1024 * 1024;

/** Quita comentarios de bloque y de línea (los comentarios pueden hablar de lo que no se hace). */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

const proc = (p: Partial<ProcesoUsuario> & { pid: number; nombre: string }): ProcesoUsuario => ({
  ruta: `C:\\Users\\yo\\AppData\\Local\\${p.nombre}`,
  inicio: `inicio-${p.pid}`,
  memoria: 500 * MB,
  ventana: true,
  sesion: 1,
  usuario: 'S-1-5-21-yo',
  ...p,
});

/** Máquina con de todo: protegidos, ajenos, WolfCore Dev, FlyEnv y un navegador. */
function escenario() {
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
    proc({ pid: 203, nombre: 'csrss.exe', ruta: 'C:\\Windows\\System32\\csrss.exe' }),
    proc({ pid: 204, nombre: 'winlogon.exe', ruta: 'C:\\Windows\\System32\\winlogon.exe' }),
    proc({
      pid: 205,
      nombre: 'MsMpEng.exe',
      ruta: 'C:\\Program Files\\Windows Defender\\MsMpEng.exe',
    }),
    proc({ pid: 206, nombre: 'raro.exe', ruta: 'C:\\Windows\\raro.exe' }),
    proc({ pid: 210, nombre: 'FlyEnv.exe', ruta: 'C:\\Users\\yo\\FlyEnv\\FlyEnv.exe' }),
    proc({ pid: 211, nombre: 'nginx.exe', ruta: 'D:\\PhpWebStudy\\nginx.exe' }),
    proc({ pid: 212, nombre: 'otra.exe', ruta: 'C:\\Apps\\FLYENV\\otra.exe' }),
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
  ];
  // WolfCore Dev (220) tiene un hijo (221) que ningún nombre delata.
  falsa.hijos.set(220, [221]);
  return falsa;
}

function depsBase(falsa: PlataformaFalsa, extra: Partial<DepsMemoria> = {}): DepsMemoria {
  return {
    plataforma: falsa,
    rutasPropias: () => ['C:\\Users\\yo\\AppData\\Local\\WolfCoreDev', 'C:\\Apps\\WolfCore'],
    pidApp: 220,
    pidsSupervisados: () => [],
    caches: () => [],
    pools: async () => [],
    reducirPool: async () => 0,
    servicios: async () => [],
    detenerServicio: async () => undefined,
    ...extra,
  };
}

const cache = (id: string, bytes: number, vaciadas: string[]): CacheApp => ({
  id,
  etiqueta: id,
  estimar: async () => bytes,
  vaciar: async () => {
    vaciadas.push(id);
    return bytes;
  },
});

describe('optimizador de RAM: lista protegida', () => {
  it('en profundo, ningún plan contiene protegidos, ajenos, FlyEnv ni WolfCore Dev', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    const pids = plan.acciones.filter((a) => a.tipo === 'cerrar-programa').map((a) => a.id);
    expect(pids.sort()).toEqual(['cerrar-programa:100', 'cerrar-programa:101']);
    for (const prohibido of [
      200, 201, 202, 203, 204, 205, 206, 210, 211, 212, 220, 221, 222, 230, 231, 232, 233,
    ]) {
      expect(pids, `pid ${prohibido}`).not.toContain(`cerrar-programa:${prohibido}`);
    }
  });

  it('motivoProtegido explica cada caso y deja pasar un programa corriente', () => {
    const ctx = {
      usuario: 'S-1-5-21-yo',
      sesion: 1,
      rutasSistema: ['C:\\Windows', 'C:\\Program Files\\Windows Defender'],
      rutasPropias: ['C:\\Users\\yo\\AppData\\Local\\WolfCoreDev'],
      pidsPropios: new Set([221]),
    };
    expect(motivoProtegido(proc({ pid: 100, nombre: 'chrome.exe' }), ctx)).toBeNull();
    expect(motivoProtegido(proc({ pid: 221, nombre: 'x.exe' }), ctx)).toBe('wolfcore');
    expect(motivoProtegido(proc({ pid: 230, nombre: 'x.exe', usuario: 'otro' }), ctx)).toBe(
      'otro-usuario',
    );
    expect(motivoProtegido(proc({ pid: 231, nombre: 'x.exe', sesion: 0 }), ctx)).toBe(
      'otra-sesion',
    );
    expect(motivoProtegido(proc({ pid: 232, nombre: 'x.exe', servicio: true }), ctx)).toBe(
      'servicio',
    );
    expect(motivoProtegido(proc({ pid: 233, nombre: 'x.exe', ruta: null }), ctx)).toBe('sin-ruta');
    expect(motivoProtegido(proc({ pid: 4, nombre: 'System' }), ctx)).toBe('sistema');
    // El nombre manda aunque la ruta sea de otro sitio, con o sin extensión y en cualquier caja.
    expect(motivoProtegido(proc({ pid: 300, nombre: 'SvcHost', ruta: 'D:\\x\\a.exe' }), ctx)).toBe(
      'sistema',
    );
    // Una ruta bajo la carpeta del sistema, aunque se parezca a otra (C:\WindowsApps no lo es).
    expect(
      motivoProtegido(proc({ pid: 301, nombre: 'a.exe', ruta: 'C:\\Windows\\a.exe' }), ctx),
    ).toBe('sistema');
    expect(
      motivoProtegido(proc({ pid: 302, nombre: 'a.exe', ruta: 'C:\\WindowsApps\\a.exe' }), ctx),
    ).toBeNull();
    expect(
      motivoProtegido(proc({ pid: 303, nombre: 'a.exe', ruta: 'C:\\x\\phpwebstudy\\a.exe' }), ctx),
    ).toBe('protegido');
  });

  it('un hijo de WolfCore Dev que no se llama como él se protege por el árbol de procesos', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.push(
      proc({ pid: 240, nombre: 'electron-helper.exe', ruta: 'D:\\otra\\h.exe' }),
    );
    falsa.hijos.set(220, [221, 240]);
    const plan = await new OptimizadorMemoria(depsBase(falsa)).planMemoria('profundo');
    expect(plan.acciones.map((a) => a.id)).not.toContain('cerrar-programa:240');
  });

  it('los procesos supervisados por WolfCore Dev (y sus hijos) también se protegen', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.push(proc({ pid: 250, nombre: 'uvicorn.exe', ruta: 'D:\\venv\\u.exe' }));
    const plan = await new OptimizadorMemoria(
      depsBase(falsa, { pidsSupervisados: () => [250] }),
    ).planMemoria('profundo');
    expect(plan.acciones.map((a) => a.id)).not.toContain('cerrar-programa:250');
  });
});

describe('optimizador de RAM: modos', () => {
  it('cerrar-programa sale desmarcado y solo existe en profundo', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const profundo = await o.planMemoria('profundo');
    const cerrar = profundo.acciones.filter((a) => a.tipo === 'cerrar-programa');
    expect(cerrar.length).toBeGreaterThan(0);
    expect(cerrar.every((a) => a.marcada === false)).toBe(true);
    for (const modo of ['liviano', 'moderado'] as const) {
      const p = await o.planMemoria(modo);
      expect(
        p.acciones.some((a) => a.tipo === 'cerrar-programa'),
        modo,
      ).toBe(false);
    }
  });

  it('liviano solo vacía cachés: no lee procesos, no detiene ni cierra nada', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    let leidos = 0;
    const original = falsa.procesosDelUsuario.bind(falsa);
    falsa.procesosDelUsuario = async () => {
      leidos++;
      return original();
    };
    const detenidos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        caches: () => [cache('sesion', 30 * MB, vaciadas), cache('nucleo', 1 * MB, vaciadas)],
        pools: async () => [pool('8.4', 60 * MB)],
        reducirPool: async (v) => {
          detenidos.push(`pool:${v}`);
          return 1;
        },
        servicios: async () => [servicio('mysql', 200 * MB, 40)],
        detenerServicio: async (id) => {
          detenidos.push(id);
        },
      }),
    );
    const plan = await o.planMemoria('liviano');
    expect(plan.acciones.map((a) => a.tipo)).toEqual(['cache-app', 'cache-app']);
    expect(plan.acciones.every((a) => a.marcada)).toBe(true);
    expect(plan.estimado).toBe(31 * MB);
    const r = await o.aplicarMemoria(
      plan.acciones.map((a) => a.id),
      true,
    );
    expect(vaciadas.sort()).toEqual(['nucleo', 'sesion']);
    expect(r.liberado).toBe(31 * MB);
    expect(detenidos).toEqual([]);
    expect(falsa.cierresPedidos).toEqual([]);
    expect(leidos).toBe(0);
  });

  it('moderado propone reducir el pool y detener lo propio que lleva inactivo el tiempo debido', async () => {
    const falsa = escenario();
    const hechos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        pools: async () => [pool('8.4', 60 * MB), pool('8.3', 50 * MB, { inactivoMs: 2 * 60_000 })],
        reducirPool: async (v) => {
          hechos.push(`pool:${v}`);
          return 3;
        },
        servicios: async () => [
          servicio('mysql', 200 * MB, 40),
          servicio('postgresql', 100 * MB, 5),
          servicio('mailpit', 20 * MB, 40, { observadoMs: 3 * 60_000 }),
        ],
        detenerServicio: async (id) => {
          hechos.push(`detener:${id}`);
        },
      }),
    );
    const plan = await o.planMemoria('moderado');
    expect(plan.acciones.map((a) => a.id)).toEqual(['reducir-pool:8.4', 'detener-inactivo:mysql']);
    // postgresql y 8.3 no llevan el tiempo; mailpit apenas se observa: no se afirma nada.
    expect(plan.sinDatosActividad).toBe(true);
    await o.aplicarMemoria(['reducir-pool:8.4', 'detener-inactivo:mysql'], true);
    expect(hechos).toEqual(['pool:8.4', 'detener:mysql']);
  });

  it('un servicio que volvió a tener actividad entre el plan y la aplicación no se detiene', async () => {
    const falsa = escenario();
    let inactivo = 40;
    const detenidos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        servicios: async () => [servicio('mysql', 200 * MB, inactivo)],
        detenerServicio: async (id) => {
          detenidos.push(id);
        },
      }),
    );
    const plan = await o.planMemoria('moderado');
    inactivo = 1;
    const r = await o.aplicarMemoria(
      plan.acciones.map((a) => a.id),
      true,
    );
    expect(detenidos).toEqual([]);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
  });

  it('sin `confirmado === true` falla y no toca nada', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, { caches: () => [cache('sesion', MB, vaciadas)] }),
    );
    const plan = await o.planMemoria('liviano');
    const ids = plan.acciones.map((a) => a.id);
    for (const malo of [undefined, false, 'true', 1, null]) {
      await expect(o.aplicarMemoria(ids, malo as never)).rejects.toMatchObject({
        codigo: 'memoria.sin_confirmar',
      });
    }
    expect(vaciadas).toEqual([]);
    await expect(o.planMemoria('extremo' as never)).rejects.toMatchObject({
      codigo: 'memoria.modo_invalido',
    });
  });

  it('solo se aplica lo que estaba en el último plan: un id inventado se salta', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    await o.planMemoria('profundo');
    const r = await o.aplicarMemoria(
      ['cerrar-programa:200', 'cerrar-programa:9999', 'basura'],
      true,
    );
    expect(r.resultados.map((x) => x.motivo)).toEqual(['no_en_plan', 'no_en_plan', 'no_en_plan']);
    expect(falsa.cierresPedidos).toEqual([]);
    // Lo ya aplicado tampoco se repite sin un plan nuevo.
    const plan = await o.planMemoria('profundo');
    await o.aplicarMemoria(['cerrar-programa:100'], true);
    const otra = await o.aplicarMemoria(['cerrar-programa:100'], true);
    expect(otra.resultados[0]!.motivo).toBe('no_en_plan');
    expect(falsa.cierresPedidos).toEqual([100]);
    expect(plan.acciones.length).toBeGreaterThan(0);
  });
});

describe('optimizador de RAM: se vuelve a comprobar justo antes de actuar', () => {
  async function planYMuta(mutar: (f: PlataformaFalsa) => void) {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    await o.planMemoria('profundo');
    mutar(falsa);
    const r = await o.aplicarMemoria(['cerrar-programa:100'], true);
    return { falsa, resultado: r.resultados[0]! };
  }

  it('sin cambios, pide un cierre amable por PID y nada más', async () => {
    const { falsa, resultado } = await planYMuta(() => undefined);
    expect(resultado).toMatchObject({ estado: 'hecho', motivo: null });
    expect(falsa.cierresPedidos).toEqual([100]);
    expect(falsa.matados).toEqual([]);
  });

  it('un pid reutilizado por otro programa (otra ruta) se salta', async () => {
    const { falsa, resultado } = await planYMuta((f) => {
      f.procesosUsuario.find((p) => p.pid === 100)!.ruta = 'C:\\Otro\\programa.exe';
    });
    expect(resultado).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    expect(falsa.cierresPedidos).toEqual([]);
  });

  it('mismo programa pero con otra hora de inicio (pid reutilizado) se salta', async () => {
    const { falsa, resultado } = await planYMuta((f) => {
      f.procesosUsuario.find((p) => p.pid === 100)!.inicio = 'otra-hora';
    });
    expect(resultado).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    expect(falsa.cierresPedidos).toEqual([]);
  });

  it('un proceso que ya no existe se salta', async () => {
    const { falsa, resultado } = await planYMuta((f) => {
      f.procesosUsuario = f.procesosUsuario.filter((p) => p.pid !== 100);
    });
    expect(resultado).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    expect(falsa.cierresPedidos).toEqual([]);
  });

  it('si ahora resulta protegido (otro usuario, bajo Windows, ruta de FlyEnv), se salta', async () => {
    for (const mutar of [
      (p: ProcesoUsuario) => void (p.usuario = 'S-1-5-21-otro'),
      (p: ProcesoUsuario) => void (p.sesion = 0),
      (p: ProcesoUsuario) => void (p.servicio = true),
    ]) {
      const falsa = escenario();
      const o = new OptimizadorMemoria(depsBase(falsa));
      await o.planMemoria('profundo');
      mutar(falsa.procesosUsuario.find((p) => p.pid === 100)!);
      const r = await o.aplicarMemoria(['cerrar-programa:100'], true);
      expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'protegido' });
      expect(falsa.cierresPedidos).toEqual([]);
    }
  });

  it('sin hora de inicio legible no se puede asegurar que sea el mismo: se salta', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.find((p) => p.pid === 100)!.inicio = null;
    const o = new OptimizadorMemoria(depsBase(falsa));
    await o.planMemoria('profundo');
    const r = await o.aplicarMemoria(['cerrar-programa:100'], true);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    expect(falsa.cierresPedidos).toEqual([]);
  });

  it('nunca se llama a "matar": la falsa falla la prueba si ocurre', async () => {
    const falsa = escenario();
    expect(falsa.prohibirMatar).toBe(true);
    await expect(falsa.matarArbol(100)).rejects.toThrow(/PROHIBIDO/);
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    await o.aplicarMemoria(
      plan.acciones.map((a) => a.id),
      true,
    );
    await o.aplicarMemoria(
      plan.acciones.filter((a) => a.tipo === 'cerrar-programa').map((a) => a.id),
      true,
    );
    expect(falsa.matados).toEqual([]);
  });
});

function pool(version: string, memoria: number, o: Partial<PoolReducible> = {}): PoolReducible {
  return {
    version,
    trabajadores: 4,
    memoria,
    inactivoMs: 30 * 60_000,
    observadoMs: 30 * 60_000,
    ...o,
  };
}

function servicio(
  id: string,
  memoria: number,
  minutosInactivo: number,
  o: Partial<ServicioPropio> = {},
): ServicioPropio {
  return {
    id,
    nombre: id,
    memoria,
    inactivoMs: minutosInactivo * 60_000,
    observadoMs: 60 * 60_000,
    ...o,
  };
}

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
    // Las muestras guardadas se pueden vaciar.
    expect(m.tamanoCache()).toBeGreaterThan(0);
    m.vaciarCache();
    expect(m.tamanoCache()).toBe(0);
  });
});

describe('ServicioPhp.reducirAUno', () => {
  it('deja encendido el trabajador 0 y detiene los demás por su id', async () => {
    const estados = new Map<string, string>([
      ['php-8.4-0', 'encendido'],
      ['php-8.4-1', 'encendido'],
      ['php-8.4-2', 'encendido'],
      ['php-8.4-3', 'apagado'],
      ['php-8.3-0', 'encendido'],
    ]);
    const detenidos: string[] = [];
    const sup = {
      estado: (id: string) => estados.get(id) ?? 'apagado',
      detener: async (id: string) => {
        detenidos.push(id);
        estados.set(id, 'apagado');
      },
    };
    const php = new ServicioPhp(
      {} as never,
      {} as never,
      sup as never,
      {} as never,
      (async () => ({})) as never,
    );
    expect(php.trabajadoresEncendidos('8.4')).toEqual([0, 1, 2]);
    expect(await php.reducirAUno('8.4')).toBe(2);
    expect(detenidos).toEqual(['php-8.4-1', 'php-8.4-2']);
    expect(await php.reducirAUno('8.4')).toBe(0);
    expect(php.trabajadoresEncendidos('8.3')).toEqual([0]);
  });
});

describe('implementación de Windows: solo lee y cierra con amabilidad', () => {
  const b64 = (t: string): string => Buffer.from(t, 'utf8').toString('base64');

  it('interpreta la salida y descarta líneas raras', () => {
    const salida = [
      `100|1|133000000000000000|943718400|1|0|${b64('chrome.exe')}|${b64('C:\\Program Files\\Google\\chrome.exe')}`,
      `101|1||1024|0|1|${b64('serv.exe')}|`,
      'basura',
      `abc|1|1|1|1|1|${b64('x')}|${b64('C:\\x')}`,
      `102|1|5|10|1|0|***|${b64('C:\\x')}`,
      `103|1|5|10|1|0|${b64('rel.exe')}|${b64('relativa\\rel.exe')}`,
    ].join('\r\n');
    const l = interpretarProcesosUsuario(salida);
    expect(l.map((p) => p.pid)).toEqual([100, 101, 103]);
    expect(l[0]).toMatchObject({
      nombre: 'chrome.exe',
      ruta: 'C:\\Program Files\\Google\\chrome.exe',
      inicio: '133000000000000000',
      memoria: 943718400,
      ventana: true,
      servicio: false,
    });
    expect(l[1]).toMatchObject({ ruta: null, inicio: null, ventana: false, servicio: true });
    // Una ruta que no es absoluta no se acepta: el proceso queda sin ruta (y, por tanto, protegido).
    expect(l[2]!.ruta).toBeNull();
  });

  it('lista con PowerShell de System32 por ruta absoluta, filtra por usuario y sesión y no cambia nada', async () => {
    const llamadas: { cmd: string; script: string }[] = [];
    const ejecutor: Ejecutor = async (cmd, args) => {
      const script = Buffer.from(
        args[args.indexOf('-EncodedCommand') + 1] ?? '',
        'base64',
      ).toString('utf16le');
      llamadas.push({ cmd, script });
      if (script.includes('GetCurrent().User.Value') && !script.includes('Win32_Process')) {
        return { codigo: 0, stdout: 'S-1-5-21-1-2-3-1001|2\r\n', stderr: '' };
      }
      return {
        codigo: 0,
        stdout: [
          `100|2|11|1000|1|0|${b64('a.exe')}|${b64('C:\\a.exe')}`,
          `101|0|11|1000|1|0|${b64('b.exe')}|${b64('C:\\b.exe')}`,
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
    expect(script).toContain('GetOwnerSid');
    expect(script).not.toMatch(/Stop-Process|taskkill|Terminate|\.Kill\(|Remove-|Set-/i);
  });

  it('si no se puede leer, la lista queda vacía (nunca se propone a ciegas)', async () => {
    const w = new ProcesosUsuarioWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }), {});
    expect(await w.listar()).toEqual([]);
    const w2 = new ProcesosUsuarioWindows(async () => {
      throw new Error('sin powershell');
    }, {});
    expect(await w2.listar()).toEqual([]);
    expect(await w2.cerrarVentana(5)).toBe(false);
  });

  it('cerrarVentana pide CloseMainWindow por PID (nunca por nombre) y rechaza PIDs raros', async () => {
    const scripts: string[] = [];
    const w = new ProcesosUsuarioWindows(async (_c, args) => {
      scripts.push(
        Buffer.from(args[args.indexOf('-EncodedCommand') + 1] ?? '', 'base64').toString('utf16le'),
      );
      return { codigo: 0, stdout: 'SI', stderr: '' };
    }, {});
    expect(await w.cerrarVentana(4321)).toBe(true);
    expect(scripts[0]).toContain('CloseMainWindow()');
    expect(scripts[0]).toContain('-Id 4321');
    expect(scripts[0]).not.toMatch(/-Name|Stop-Process|taskkill|Kill/i);
    for (const malo of [0, -1, 1.5, Number.NaN]) {
      expect(await w.cerrarVentana(malo)).toBe(false);
      expect(() => scriptCerrarVentana(malo)).toThrow();
    }
    expect(scripts).toHaveLength(1);
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

describe('guardia: el optimizador no tiene cómo matar', () => {
  const PROHIBIDO =
    /taskkill|Stop-Process|TerminateProcess|matarArbol|process\.kill|\.Kill\(|\bkill\(/i;
  for (const rel of ['sistema/memoria.ts', 'plataforma/procesosUsuarioWin.ts']) {
    it(`${rel} no contiene ninguna forma de terminar un proceso`, () => {
      const codigo = sinComentarios(readFileSync(path.join(SRC, rel), 'utf8'));
      expect(codigo).not.toMatch(PROHIBIDO);
    });
  }

  it('y en el código del núcleo que arma el optimizador tampoco se mata (solo se cierra amablemente)', () => {
    const codigo = sinComentarios(readFileSync(path.join(SRC, 'sistema/memoria.ts'), 'utf8'));
    expect(codigo).toContain('cerrarVentanaPrincipal');
  });
});

describe('Nucleo: optimizador de RAM', () => {
  it('liviano vacía la caché que registra la app y la del núcleo; profundo no lista lo protegido', async () => {
    const base = await carpetaTemporal('pel-mem-');
    const falsa = escenario();
    falsa.hijos.set(process.pid, [221]);
    // Su carpeta de datos real no es la temporal de la prueba: se quita el mysqld de ejemplo.
    falsa.procesosUsuario = falsa.procesosUsuario.filter((p) => p.pid !== 222);
    const n = await Nucleo.crear({
      base,
      plataforma: falsa,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      consultarMetricas: async () => ({ procesos: [], red: null }),
    });
    try {
      const vaciadas: string[] = [];
      n.registrarCacheApp(cache('sesion', 5 * MB, vaciadas));
      const plan = await n.planMemoria('liviano');
      expect(plan.acciones.map((a) => a.id)).toEqual(['cache-app:nucleo', 'cache-app:sesion']);
      await expect(
        n.aplicarMemoria(['cache-app:sesion'], undefined as never),
      ).rejects.toMatchObject({
        codigo: 'memoria.sin_confirmar',
      });
      expect(vaciadas).toEqual([]);
      const r = await n.aplicarMemoria(['cache-app:sesion'], true);
      expect(vaciadas).toEqual(['sesion']);
      expect(r.liberado).toBe(5 * MB);

      const profundo = await n.planMemoria('profundo');
      const cerrar = profundo.acciones.filter((a) => a.tipo === 'cerrar-programa');
      expect(cerrar.map((a) => a.id).sort()).toEqual([
        'cerrar-programa:100',
        'cerrar-programa:101',
      ]);
      expect(cerrar.every((a) => !a.marcada)).toBe(true);
      expect(falsa.matados).toEqual([]);
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });
});
