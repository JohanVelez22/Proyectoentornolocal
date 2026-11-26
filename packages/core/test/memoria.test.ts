import { mkdirSync, readFileSync, realpathSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Nucleo } from '../src/nucleo';
import { carpetaTemporal } from './temporales';
import { Metricas } from '../src/monitor/metricas';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { completarPlataforma } from '../src/plataforma/index';
import { interpretarNetstatEstablecidas } from '../src/plataforma/netstat';
import {
  interpretarProcesosUsuario,
  ProcesosUsuarioWindows,
  scriptCerrarVentana,
  scriptProcesosUsuario,
} from '../src/plataforma/procesosUsuarioWin';
import type { Ejecutor, PlataformaCompleta, ProcesoUsuario } from '../src/plataforma/tipos';
import { ServicioPhp } from '../src/servicios/php';
import {
  MAX_ACCIONES_MEMORIA,
  motivoProtegido,
  OptimizadorMemoria,
  type CacheApp,
  type DepsMemoria,
  type PlanMemoria,
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
    proc({ pid: 234, nombre: 'elevado.exe', elevado: true }),
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
    // Sin esperar de verdad los 3 s del cierre.
    esperar: async () => undefined,
    ...extra,
  };
}

const cache = (
  id: string,
  bytes: number,
  vaciadas: string[],
  unidad: 'ram' | 'disco' = 'ram',
): CacheApp => ({
  id,
  etiqueta: id,
  unidad,
  estimar: async () => bytes,
  vaciar: async () => {
    vaciadas.push(id);
    return bytes;
  },
});

/** Plan y aplicación en un paso, con el id del plan. */
const aplicar = (o: OptimizadorMemoria, plan: PlanMemoria, ids: string[]) =>
  o.aplicarMemoria(plan.id, ids, true);

describe('optimizador de RAM: lista protegida', () => {
  it('en profundo, ningún plan contiene protegidos, ajenos, elevados, FlyEnv ni WolfCore Dev', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    const pids = plan.acciones.filter((a) => a.tipo === 'cerrar-programa').map((a) => a.id);
    expect(pids.sort()).toEqual(['cerrar-programa:100', 'cerrar-programa:101']);
    for (const prohibido of [
      200, 201, 202, 203, 204, 205, 206, 210, 211, 212, 220, 221, 222, 230, 231, 232, 233, 234,
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
      pidsFlyEnv: new Set([777]),
    };
    expect(motivoProtegido(proc({ pid: 100, nombre: 'chrome.exe' }), ctx)).toBeNull();
    expect(motivoProtegido(proc({ pid: 221, nombre: 'x.exe' }), ctx)).toBe('wolfcore');
    expect(motivoProtegido(proc({ pid: 777, nombre: 'x.exe' }), ctx)).toBe('protegido');
    expect(motivoProtegido(proc({ pid: 230, nombre: 'x.exe', usuario: 'otro' }), ctx)).toBe(
      'otro-usuario',
    );
    expect(motivoProtegido(proc({ pid: 231, nombre: 'x.exe', sesion: 0 }), ctx)).toBe(
      'otra-sesion',
    );
    expect(motivoProtegido(proc({ pid: 232, nombre: 'x.exe', servicio: true }), ctx)).toBe(
      'servicio',
    );
    expect(motivoProtegido(proc({ pid: 234, nombre: 'x.exe', elevado: true }), ctx)).toBe(
      'elevado',
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

  it('los prefijos de ruta larga (\\\\?\\ y \\??\\) no esconden una carpeta protegida', () => {
    const ctx = {
      usuario: 'S-1-5-21-yo',
      sesion: 1,
      rutasSistema: ['C:\\Windows'],
      rutasPropias: ['C:\\Users\\yo\\AppData\\Local\\WolfCoreDev'],
      pidsPropios: new Set<number>(),
    };
    for (const ruta of [
      '\\\\?\\C:\\Windows\\a.exe',
      '\\??\\C:\\Windows\\a.exe',
      '\\\\?\\c:\\WINDOWS\\Sub\\a.exe',
    ]) {
      expect(motivoProtegido(proc({ pid: 310, nombre: 'a.exe', ruta }), ctx), ruta).toBe('sistema');
    }
    expect(
      motivoProtegido(
        proc({
          pid: 311,
          nombre: 'a.exe',
          ruta: '\\\\?\\C:\\Users\\yo\\AppData\\Local\\WolfCoreDev\\a.exe',
        }),
        ctx,
      ),
    ).toBe('wolfcore');
  });

  it('una carpeta propia que es un enlace (o unión) se protege también por su ruta real', async () => {
    const base = await carpetaTemporal('pel-mem-real-');
    const real = path.join(base, 'real');
    const enlace = path.join(base, 'enlace');
    mkdirSync(real);
    try {
      symlinkSync(real, enlace, 'junction');
    } catch {
      return; // sin permiso para crear enlaces en este equipo: no hay nada que probar
    }
    const falsa = escenario();
    falsa.procesosUsuario.push(
      proc({
        pid: 400,
        nombre: 'viaje.exe',
        // El programa vive en la carpeta real (la que resuelve el enlace), con su nombre canónico.
        ruta: path.join(realpathSync.native(real), 'viaje.exe'),
      }),
    );
    const plan = await new OptimizadorMemoria(
      depsBase(falsa, { rutasPropias: () => [enlace] }),
    ).planMemoria('profundo');
    expect(plan.acciones.map((a) => a.id)).not.toContain('cerrar-programa:400');
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

  it('FlyEnv y PhpWebStudy protegen todo su árbol de procesos, no solo lo que se llama como ellos', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.push(
      proc({ pid: 260, nombre: 'mariadbd.exe', ruta: 'D:\\datos\\bin\\mariadbd.exe' }),
      proc({ pid: 261, nombre: 'nieto.exe', ruta: 'D:\\datos\\bin\\nieto.exe' }),
    );
    // 211 es de PhpWebStudy (por su ruta) y 210 de FlyEnv (por su nombre): sus hijos y nietos también.
    falsa.hijos.set(210, [260]);
    falsa.hijos.set(260, [261]);
    const plan = await new OptimizadorMemoria(depsBase(falsa)).planMemoria('profundo');
    const ids = plan.acciones.map((a) => a.id);
    expect(ids).not.toContain('cerrar-programa:260');
    expect(ids).not.toContain('cerrar-programa:261');
    expect(ids).toContain('cerrar-programa:100');
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

  it('un programa sin hora de inicio legible no se propone (no se podría reconocer)', async () => {
    const falsa = escenario();
    falsa.procesosUsuario.find((p) => p.pid === 100)!.inicio = null;
    const plan = await new OptimizadorMemoria(depsBase(falsa)).planMemoria('profundo');
    expect(plan.acciones.map((a) => a.id)).not.toContain('cerrar-programa:100');
  });

  it('liviano solo vacía cachés: no lee procesos, no detiene ni cierra nada', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const detenidos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        caches: () => [cache('sesion', 30 * MB, vaciadas), cache('otra', 1 * MB, vaciadas)],
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
    const r = await aplicar(
      o,
      plan,
      plan.acciones.map((a) => a.id),
    );
    expect(vaciadas.sort()).toEqual(['otra', 'sesion']);
    expect(r.liberado).toBe(31 * MB);
    expect(detenidos).toEqual([]);
    expect(falsa.cierresPedidos).toEqual([]);
    expect(falsa.listados).toBe(0);
  });

  it('la caché HTTP (disco) no cuenta como RAM: se muestra y se informa aparte', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        caches: () => [cache('sesion', 30 * MB, vaciadas, 'disco'), cache('ram', 2 * MB, vaciadas)],
      }),
    );
    const plan = await o.planMemoria('liviano');
    expect(plan.acciones.map((a) => [a.id, a.unidad])).toEqual([
      ['cache-app:sesion', 'disco'],
      ['cache-app:ram', 'ram'],
    ]);
    expect(plan.estimado).toBe(2 * MB);
    expect(plan.estimadoDisco).toBe(30 * MB);
    const r = await aplicar(
      o,
      plan,
      plan.acciones.map((a) => a.id),
    );
    expect(r.liberado).toBe(2 * MB);
    expect(r.liberadoDisco).toBe(30 * MB);
  });

  it('moderado propone reducir el pool y detener lo propio inactivo, y los servicios salen desmarcados', async () => {
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
    expect(plan.acciones.map((a) => a.marcada)).toEqual([true, false]);
    // postgresql y 8.3 no llevan el tiempo; mailpit apenas se observa: no se afirma nada.
    expect(plan.sinDatosActividad).toBe(true);
    await aplicar(o, plan, ['reducir-pool:8.4', 'detener-inactivo:mysql']);
    expect(hechos).toEqual(['pool:8.4', 'detener:mysql']);
  });

  it('un servicio con conexiones establecidas a su puerto no se propone, y sin poder saberlo tampoco', async () => {
    const falsa = escenario();
    const deps = depsBase(falsa, {
      servicios: async () => [
        servicio('mysql', 200 * MB, 40, { puertos: [3306] }),
        servicio('redis', 50 * MB, 40, { puertos: [6379], pid: 77 }),
      ],
    });
    // Un cliente conectado a mysql: ese lado local es el servidor; el otro, el cliente.
    falsa.conexiones = [{ puertoLocal: 3306, puertoRemoto: 51000, pid: 5 }];
    const plan = await new OptimizadorMemoria(deps).planMemoria('moderado');
    expect(plan.acciones.map((a) => a.id)).toEqual(['detener-inactivo:redis']);
    // La conexión vista desde el cliente (puerto remoto = el del servicio) también cuenta.
    falsa.conexiones = [{ puertoLocal: 51000, puertoRemoto: 6379, pid: 9 }];
    const plan2 = await new OptimizadorMemoria(deps).planMemoria('moderado');
    expect(plan2.acciones.map((a) => a.id)).toEqual(['detener-inactivo:mysql']);
    // Sin poder leer las conexiones no se propone detener nada.
    falsa.fallaConexiones = true;
    const plan3 = await new OptimizadorMemoria(deps).planMemoria('moderado');
    expect(plan3.acciones).toEqual([]);
    expect(plan3.sinDatosActividad).toBe(true);
  });

  it('sin puertos conocidos, las conexiones se buscan por el PID del servicio; sin ninguno de los dos, no se propone', async () => {
    const falsa = escenario();
    falsa.conexiones = [{ puertoLocal: 40000, puertoRemoto: 40001, pid: 77 }];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        servicios: async () => [
          servicio('trabajador', 10 * MB, 40, { puertos: [], pid: 77 }),
          servicio('otro', 10 * MB, 40, { puertos: [], pid: 78 }),
          servicio('ciego', 10 * MB, 40, { puertos: [], pid: null }),
        ],
      }),
    );
    const plan = await o.planMemoria('moderado');
    expect(plan.acciones.map((a) => a.id)).toEqual(['detener-inactivo:otro']);
    expect(plan.sinDatosActividad).toBe(true);
  });

  it('con puertos conocidos, una conexión del PID del servicio por otro puerto también cuenta como uso (M3)', async () => {
    const falsa = escenario();
    falsa.conexiones = [{ puertoLocal: 41000, puertoRemoto: 41001, pid: 1000 }];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        servicios: async () => [
          servicio('mysql', 200 * MB, 40, { puertos: [3306], pid: 1000 }),
          servicio('redis', 50 * MB, 40, { puertos: [6379], pid: 1001 }),
        ],
      }),
    );
    const plan = await o.planMemoria('moderado');
    expect(plan.acciones.map((a) => a.id)).toEqual(['detener-inactivo:redis']);
  });

  it('al aplicar se vuelve a mirar si hay conexiones: ocupado se salta, y sin poder leerlas también', async () => {
    const falsa = escenario();
    const detenidos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        servicios: async () => [servicio('mysql', 200 * MB, 40, { puertos: [3306] })],
        detenerServicio: async (id) => {
          detenidos.push(id);
        },
      }),
    );
    let plan = await o.planMemoria('moderado');
    falsa.conexiones = [{ puertoLocal: 3306, puertoRemoto: 52000, pid: 5 }];
    let r = await aplicar(o, plan, ['detener-inactivo:mysql']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'ocupado' });
    falsa.conexiones = [];
    plan = await o.planMemoria('moderado');
    falsa.fallaConexiones = true;
    r = await aplicar(o, plan, ['detener-inactivo:mysql']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'ocupado' });
    expect(detenidos).toEqual([]);
    falsa.fallaConexiones = false;
    plan = await o.planMemoria('moderado');
    r = await aplicar(o, plan, ['detener-inactivo:mysql']);
    expect(r.resultados[0]).toMatchObject({ estado: 'hecho' });
    expect(detenidos).toEqual(['mysql']);
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
    const r = await aplicar(
      o,
      plan,
      plan.acciones.map((a) => a.id),
    );
    expect(detenidos).toEqual([]);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
  });

  it('reducir-pool vuelve a leer los pools al aplicar y exige la inactividad otra vez', async () => {
    const falsa = escenario();
    let actual: PoolReducible[] = [pool('8.4', 60 * MB)];
    const reducidos: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        pools: async () => actual,
        reducirPool: async (v) => {
          reducidos.push(v);
          return 3;
        },
      }),
    );
    // Hubo actividad entre el plan y la aplicación.
    let plan = await o.planMemoria('moderado');
    actual = [pool('8.4', 60 * MB, { inactivoMs: 30_000 })];
    let r = await aplicar(o, plan, ['reducir-pool:8.4']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    // Ya no tiene varios trabajadores.
    actual = [pool('8.4', 60 * MB)];
    plan = await o.planMemoria('moderado');
    actual = [pool('8.4', 0, { trabajadores: 1 })];
    r = await aplicar(o, plan, ['reducir-pool:8.4']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'ya_apagado' });
    // Sin la lectura de actividad (null) tampoco.
    actual = [pool('8.4', 60 * MB)];
    plan = await o.planMemoria('moderado');
    actual = [pool('8.4', 60 * MB, { inactivoMs: null })];
    r = await aplicar(o, plan, ['reducir-pool:8.4']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
    expect(reducidos).toEqual([]);
    // Todo en regla: se reduce.
    actual = [pool('8.4', 60 * MB)];
    plan = await o.planMemoria('moderado');
    r = await aplicar(o, plan, ['reducir-pool:8.4']);
    expect(r.resultados[0]).toMatchObject({ estado: 'hecho', liberado: 60 * MB });
    expect(reducidos).toEqual(['8.4']);
  });

  it('las cachés se aplican al final, después de pools, servicios y programas', async () => {
    const falsa = escenario();
    const orden: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        caches: () => [cache('sesion', MB, orden)],
        pools: async () => [pool('8.4', 60 * MB)],
        reducirPool: async () => {
          orden.push('pool');
          return 1;
        },
        servicios: async () => [servicio('mysql', 200 * MB, 40)],
        detenerServicio: async () => {
          orden.push('detener');
        },
      }),
    );
    const plan = await o.planMemoria('profundo');
    const ids = [
      'cache-app:sesion',
      'cerrar-programa:100',
      'detener-inactivo:mysql',
      'reducir-pool:8.4',
    ];
    const r = await aplicar(o, plan, ids);
    expect(orden).toEqual(['pool', 'detener', 'sesion']);
    expect(falsa.cierresPedidos).toEqual([100]);
    // Los resultados salen en el orden pedido, aunque se hayan aplicado en otro.
    expect(r.resultados.map((x) => x.id)).toEqual(ids);
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
      await expect(o.aplicarMemoria(plan.id, ids, malo as never)).rejects.toMatchObject({
        codigo: 'memoria.sin_confirmar',
      });
    }
    expect(vaciadas).toEqual([]);
    await expect(o.planMemoria('extremo' as never)).rejects.toMatchObject({
      codigo: 'memoria.modo_invalido',
    });
  });

  it('solo se aplica lo que estaba en el plan: un id inventado se salta y tiene tipo desconocido', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan0 = await o.planMemoria('profundo');
    const r = await aplicar(o, plan0, ['cerrar-programa:200', 'cerrar-programa:9999', 'basura']);
    expect(r.resultados.map((x) => x.motivo)).toEqual(['no_en_plan', 'no_en_plan', 'no_en_plan']);
    // Un id que no es de ningún tipo conocido no se hace pasar por "cerrar-programa".
    expect(r.resultados.map((x) => x.tipo)).toEqual([
      'cerrar-programa',
      'cerrar-programa',
      'desconocido',
    ]);
    expect(falsa.cierresPedidos).toEqual([]);
    // Lo ya aplicado tampoco se repite sin un plan nuevo.
    const plan = await o.planMemoria('profundo');
    await aplicar(o, plan, ['cerrar-programa:100']);
    const otra = await aplicar(o, plan, ['cerrar-programa:100']);
    expect(otra.resultados[0]!.motivo).toBe('no_en_plan');
    expect(falsa.cierresPedidos).toEqual([100]);
    expect(plan.acciones.length).toBeGreaterThan(0);
  });
});

describe('optimizador de RAM: el plan tiene id, caduca y respeta los topes', () => {
  it('un id de plan que no es el último, o ninguno, falla con memoria.plan_caducado', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, { caches: () => [cache('sesion', MB, vaciadas)] }),
    );
    await expect(o.aplicarMemoria('nada', ['cache-app:sesion'], true)).rejects.toMatchObject({
      codigo: 'memoria.plan_caducado',
    });
    const viejo = await o.planMemoria('liviano');
    const nuevo = await o.planMemoria('liviano');
    expect(nuevo.id).not.toBe(viejo.id);
    await expect(aplicar(o, viejo, ['cache-app:sesion'])).rejects.toMatchObject({
      codigo: 'memoria.plan_caducado',
    });
    expect(vaciadas).toEqual([]);
    await aplicar(o, nuevo, ['cache-app:sesion']);
    expect(vaciadas).toEqual(['sesion']);
  });

  it('a los 5 minutos el plan caduca; antes, no', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    let ahora = 1_000_000;
    const o = new OptimizadorMemoria(
      depsBase(falsa, { caches: () => [cache('sesion', MB, vaciadas)], ahora: () => ahora }),
    );
    let plan = await o.planMemoria('liviano');
    ahora += 5 * 60_000;
    await aplicar(o, plan, ['cache-app:sesion']);
    expect(vaciadas).toEqual(['sesion']);
    plan = await o.planMemoria('liviano');
    ahora += 5 * 60_000 + 1;
    await expect(aplicar(o, plan, ['cache-app:sesion'])).rejects.toMatchObject({
      codigo: 'memoria.plan_caducado',
    });
    expect(vaciadas).toEqual(['sesion']);
  });

  it('las acciones aplicadas se borran del plan capturado, no del plan nuevo que se pidió entretanto', async () => {
    const falsa = escenario();
    let soltar: () => void = () => undefined;
    const puerta = new Promise<void>((r) => {
      soltar = r;
    });
    const vaciadas: string[] = [];
    const lenta: CacheApp = {
      id: 'sesion',
      etiqueta: 'sesion',
      estimar: async () => MB,
      vaciar: async () => {
        await puerta;
        vaciadas.push('sesion');
        return MB;
      },
    };
    const o = new OptimizadorMemoria(depsBase(falsa, { caches: () => [lenta] }));
    const p1 = await o.planMemoria('liviano');
    const enCurso = aplicar(o, p1, ['cache-app:sesion']);
    const p2 = await o.planMemoria('liviano');
    soltar();
    await enCurso;
    // El plan 2 sigue entero: lo que terminó el plan 1 no le quitó su acción.
    const r = await aplicar(o, p2, ['cache-app:sesion']);
    expect(r.resultados[0]).toMatchObject({ estado: 'hecho' });
    expect(vaciadas).toEqual(['sesion', 'sesion']);
  });

  it('el plan tiene como mucho 60 acciones, de ids de como mucho 100 caracteres', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const muchas = Array.from({ length: 80 }, (_, i) => cache(`c${i}`, MB, vaciadas));
    const largo = cache('x'.repeat(120), MB, vaciadas);
    const o = new OptimizadorMemoria(depsBase(falsa, { caches: () => [largo, ...muchas] }));
    const plan = await o.planMemoria('liviano');
    expect(plan.acciones).toHaveLength(MAX_ACCIONES_MEMORIA);
    expect(plan.acciones.every((a) => a.id.length <= 100)).toBe(true);
    expect(plan.acciones.map((a) => a.id)).not.toContain(`cache-app:${'x'.repeat(120)}`);
  });

  it('si no se puede leer la lista de programas, el plan lo dice (y no inventa una vacía)', async () => {
    const falsa = escenario();
    falsa.fallaListado = true;
    const plan = await new OptimizadorMemoria(depsBase(falsa)).planMemoria('profundo');
    expect(plan.listadoFallido).toBe(true);
    expect(plan.acciones).toEqual([]);
    falsa.fallaListado = false;
    const ok = await new OptimizadorMemoria(depsBase(falsa)).planMemoria('profundo');
    expect(ok.listadoFallido).toBe(false);
  });
});

describe('optimizador de RAM: se comprueba justo antes de actuar', () => {
  async function planYMuta(mutar: (f: PlataformaFalsa) => void) {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    mutar(falsa);
    const r = await aplicar(o, plan, ['cerrar-programa:100']);
    return { falsa, resultado: r.resultados[0]!, r };
  }

  it('sin cambios, pide un cierre amable por PID con su inicio y su ruta, y nada más', async () => {
    const { falsa, resultado } = await planYMuta(() => undefined);
    // Pedido, no cerrado: el programa sigue abierto, así que no suma nada.
    expect(resultado).toMatchObject({ estado: 'pedido', motivo: null, liberado: 0 });
    expect(falsa.cierresPedidos).toEqual([100]);
    expect(falsa.cierresIntentados).toEqual([
      { pid: 100, inicio: 'inicio-100', ruta: 'C:\\Users\\yo\\AppData\\Local\\chrome.exe' },
    ]);
    expect(falsa.matados).toEqual([]);
  });

  it('si a los 3 s el programa ya no está, se cuenta su memoria; si sigue, queda esperando al usuario', async () => {
    const falsa = escenario();
    falsa.cierranAlPedir.add(100);
    const esperas: number[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        esperar: async (ms) => {
          esperas.push(ms);
        },
      }),
    );
    const plan = await o.planMemoria('profundo');
    const r = await aplicar(o, plan, ['cerrar-programa:100', 'cerrar-programa:101']);
    expect(esperas).toEqual([3000]);
    expect(r.resultados[0]).toMatchObject({ estado: 'hecho', liberado: 900 * MB });
    expect(r.resultados[1]).toMatchObject({ estado: 'pedido', liberado: 0 });
    expect(r.liberado).toBe(900 * MB);
  });

  it('si no se puede volver a leer la lista, no se afirma que se cerró', async () => {
    const falsa = escenario();
    falsa.cierranAlPedir.add(100);
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        esperar: async () => {
          falsa.fallaListado = true;
        },
      }),
    );
    // La lectura del contexto ya ocurrió antes de la espera.
    const plan = await o.planMemoria('profundo');
    const r = await aplicar(o, plan, ['cerrar-programa:100']);
    expect(r.resultados[0]).toMatchObject({ estado: 'pedido', liberado: 0 });
  });

  it('si no aparece en la relectura pero la consulta puntual dice que sigue (misma hora), no se afirma que cerró (M2)', async () => {
    const falsa = escenario();
    const original = falsa.procesosUsuario.map((p) => ({ ...p }));
    const o = new OptimizadorMemoria(
      depsBase(falsa, {
        esperar: async () => {
          // Lista parcial: sin el 100, que en realidad sigue vivo.
          falsa.procesosUsuario = original.filter((p) => p.pid !== 100);
          falsa.inicioDeProceso = async () => 'inicio-100';
        },
      }),
    );
    const plan = await o.planMemoria('profundo');
    const r = await aplicar(o, plan, ['cerrar-programa:100']);
    expect(r.resultados[0]).toMatchObject({ estado: 'pedido', liberado: 0 });
  });

  it('si la consulta puntual dice que no existe, o falla, se afirma (o no) que cerró (M2)', async () => {
    const falsa = escenario();
    falsa.cierranAlPedir.add(100);
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    const r = await aplicar(o, plan, ['cerrar-programa:100']);
    expect(r.resultados[0]).toMatchObject({ estado: 'hecho', liberado: 900 * MB });
    expect(falsa.consultasPid).toEqual([100]);

    const falsa2 = escenario();
    falsa2.cierranAlPedir.add(100);
    falsa2.fallaConsultaPid = true;
    const o2 = new OptimizadorMemoria(depsBase(falsa2));
    const plan2 = await o2.planMemoria('profundo');
    const r2 = await aplicar(o2, plan2, ['cerrar-programa:100']);
    expect(r2.resultados[0]).toMatchObject({ estado: 'pedido', liberado: 0 });
  });

  it('si falla el árbol de procesos, el plan marca listadoFallido y al aplicar se salta por protegido (I3)', async () => {
    const falsa = escenario();
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    expect(plan.acciones.some((a) => a.tipo === 'cerrar-programa')).toBe(true);
    const original = falsa.descendientes.bind(falsa);
    falsa.descendientes = async () => {
      throw new Error('sin árbol');
    };
    const r = await aplicar(o, plan, ['cerrar-programa:100']);
    expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'protegido' });
    expect(falsa.cierresIntentados).toEqual([]);

    const o2 = new OptimizadorMemoria(depsBase(falsa));
    const plan2 = await o2.planMemoria('profundo');
    expect(plan2.listadoFallido).toBe(true);
    expect(plan2.acciones.filter((a) => a.tipo === 'cerrar-programa')).toEqual([]);
    falsa.descendientes = original;
  });

  it('un plan que dejó de ser el último mientras esperaba su turno en la cola caduca (M1)', async () => {
    const falsa = escenario();
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    const vaciadas: string[] = [];
    const lenta: CacheApp = {
      ...cache('lenta', MB, vaciadas),
      vaciar: async () => {
        await puerta;
        vaciadas.push('lenta');
        return MB;
      },
    };
    const o = new OptimizadorMemoria(
      depsBase(falsa, { caches: () => [lenta, cache('otra', MB, vaciadas)] }),
    );
    const plan = await o.planMemoria('liviano');
    const p1 = o.aplicarMemoria(plan.id, ['cache-app:lenta'], true);
    const p2 = o.aplicarMemoria(plan.id, ['cache-app:otra'], true).catch((e: unknown) => e);
    await o.planMemoria('liviano');
    soltar();
    await p1;
    expect(await p2).toMatchObject({ codigo: 'memoria.plan_caducado' });
    expect(vaciadas).toEqual(['lenta']);
  });

  it('un programa elevado (o con permisos que no permiten el cierre) se informa como no_se_pudo', async () => {
    const { resultado } = await (async () => {
      const falsa = escenario();
      falsa.resultadoCierre = 'no-se-pudo';
      const o = new OptimizadorMemoria(depsBase(falsa));
      const plan = await o.planMemoria('profundo');
      const r = await aplicar(o, plan, ['cerrar-programa:100']);
      return { resultado: r.resultados[0]! };
    })();
    expect(resultado).toMatchObject({ estado: 'saltado', motivo: 'no_se_pudo', liberado: 0 });
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

  it('si ahora es de otro usuario, otra sesión o un servicio, la comprobación de la plataforma lo salta', async () => {
    for (const mutar of [
      (p: ProcesoUsuario) => void (p.usuario = 'S-1-5-21-otro'),
      (p: ProcesoUsuario) => void (p.sesion = 0),
      (p: ProcesoUsuario) => void (p.servicio = true),
    ]) {
      const falsa = escenario();
      const o = new OptimizadorMemoria(depsBase(falsa));
      const plan = await o.planMemoria('profundo');
      mutar(falsa.procesosUsuario.find((p) => p.pid === 100)!);
      const r = await aplicar(o, plan, ['cerrar-programa:100']);
      expect(r.resultados[0]).toMatchObject({ estado: 'saltado', motivo: 'cambio' });
      expect(falsa.cierresPedidos).toEqual([]);
    }
  });

  it('si entre el plan y la aplicación pasa a ser hijo de WolfCore Dev o de FlyEnv, se salta por protegido', async () => {
    for (const raiz of [220, 210]) {
      const falsa = escenario();
      const o = new OptimizadorMemoria(depsBase(falsa));
      const plan = await o.planMemoria('profundo');
      falsa.hijos.set(raiz, [100]);
      const r = await aplicar(o, plan, ['cerrar-programa:100']);
      expect(r.resultados[0], `raíz ${raiz}`).toMatchObject({
        estado: 'saltado',
        motivo: 'protegido',
      });
      expect(falsa.cierresIntentados).toEqual([]);
    }
  });

  it('el contexto se lee una sola vez por aplicación, y cada programa se verifica solo con el cierre', async () => {
    const falsa = escenario();
    let identidades = 0;
    const idOriginal = falsa.identidadActual.bind(falsa);
    falsa.identidadActual = async () => {
      identidades++;
      return idOriginal();
    };
    let descendientes = 0;
    const descOriginal = falsa.descendientes.bind(falsa);
    falsa.descendientes = async (pids) => {
      descendientes++;
      return descOriginal(pids);
    };
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    identidades = 0;
    descendientes = 0;
    falsa.listados = 0;
    await aplicar(o, plan, ['cerrar-programa:100', 'cerrar-programa:101']);
    expect(identidades).toBe(1);
    expect(descendientes).toBe(1);
    // Una lectura para el contexto y otra, a los 3 s, para ver si cerraron: no una por programa.
    expect(falsa.listados).toBe(2);
    expect(falsa.cierresIntentados.map((c) => c.pid)).toEqual([100, 101]);
  });

  it('una aplicación sin programas no lee la lista de procesos', async () => {
    const falsa = escenario();
    const vaciadas: string[] = [];
    const o = new OptimizadorMemoria(
      depsBase(falsa, { caches: () => [cache('sesion', MB, vaciadas)] }),
    );
    const plan = await o.planMemoria('liviano');
    await aplicar(o, plan, ['cache-app:sesion']);
    expect(falsa.listados).toBe(0);
  });

  it('nunca se llama a "matar": la falsa falla la prueba si ocurre', async () => {
    const falsa = escenario();
    expect(falsa.prohibirMatar).toBe(true);
    await expect(falsa.matarArbol(100)).rejects.toThrow(/PROHIBIDO/);
    const o = new OptimizadorMemoria(depsBase(falsa));
    const plan = await o.planMemoria('profundo');
    await aplicar(
      o,
      plan,
      plan.acciones.map((a) => a.id),
    );
    const plan2 = await o.planMemoria('profundo');
    await aplicar(
      o,
      plan2,
      plan2.acciones.filter((a) => a.tipo === 'cerrar-programa').map((a) => a.id),
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
    puertos: [3306],
    pid: 1000,
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
      `100|1|133000000000000000|943718400|1|0|0|${b64('chrome.exe')}|${b64('C:\\Program Files\\Google\\chrome.exe')}`,
      `101|1||1024|0|1|0|${b64('serv.exe')}|`,
      `104|1|5|10|1|0|1|${b64('alto.exe')}|${b64('C:\\alto.exe')}`,
      'basura',
      `abc|1|1|1|1|1|0|${b64('x')}|${b64('C:\\x')}`,
      `102|1|5|10|1|0|0|***|${b64('C:\\x')}`,
      `103|1|5|10|1|0|0|${b64('rel.exe')}|${b64('relativa\\rel.exe')}`,
      // Con el formato anterior (sin la columna de elevado) no se acepta.
      `105|1|5|10|1|0|${b64('viejo.exe')}|${b64('C:\\viejo.exe')}`,
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
          `100|2|11|1000|1|0|0|${b64('a.exe')}|${b64('C:\\a.exe')}`,
          `101|0|11|1000|1|0|0|${b64('b.exe')}|${b64('C:\\b.exe')}`,
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

describe('fuera de Windows: respaldo neutro de las capacidades del optimizador', () => {
  it('lista vacía, cierre que no se pudo e identidad con un ErrorWolf del catálogo', async () => {
    // Una plataforma parcial (como las de prueba) en Linux: lo que falta no se pide a PowerShell.
    const llamadas: string[] = [];
    const respaldoWindows = new Proxy({} as PlataformaCompleta, {
      get: (_o, k) => {
        llamadas.push(String(k));
        return () => {
          throw new Error('no debe llamarse');
        };
      },
    });
    const parcial = { rutaHosts: () => 'x' } as never;
    const p = completarPlataforma(parcial, respaldoWindows, 'linux');
    expect(await p.procesosDelUsuario()).toEqual([]);
    expect(await p.cerrarVentanaPrincipal(10, '1', 'C:\\a.exe')).toBe('no-se-pudo');
    expect(p.rutasProtegidas()).toEqual([]);
    const e = await p.identidadActual().catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorWolf);
    expect(e).toMatchObject({ codigo: 'memoria.no_disponible' });
    await expect(p.conexionesActivas()).rejects.toBeInstanceOf(ErrorWolf);
    expect(llamadas).toEqual([]);
  });

  it('en Windows sigue usando la implementación de Windows', async () => {
    const respaldo = {
      procesosDelUsuario: async () => [{ pid: 1 }],
    } as unknown as PlataformaCompleta;
    const p = completarPlataforma({ rutaHosts: () => 'x' } as never, respaldo, 'win32');
    expect(await p.procesosDelUsuario()).toEqual([{ pid: 1 }]);
  });
});

describe('guardia: el optimizador no tiene cómo matar', () => {
  const PROHIBIDO =
    /taskkill|Stop-Process|TerminateProcess|matarArbol|process\.kill|\.Kill\(|\bkill\(/i;
  for (const rel of [
    'sistema/memoria.ts',
    'plataforma/procesosUsuarioWin.ts',
    'plataforma/respaldoMemoria.ts',
  ]) {
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
  it('liviano vacía la caché que registra la app (la de métricas ya no se ofrece); profundo no lista lo protegido', async () => {
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
      expect(plan.acciones.map((a) => a.id)).toEqual(['cache-app:sesion']);
      await expect(
        n.aplicarMemoria(plan.id, ['cache-app:sesion'], undefined as never),
      ).rejects.toMatchObject({
        codigo: 'memoria.sin_confirmar',
      });
      expect(vaciadas).toEqual([]);
      const r = await n.aplicarMemoria(plan.id, ['cache-app:sesion'], true);
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
      // Un plan viejo ya no vale.
      await expect(n.aplicarMemoria(plan.id, ['cache-app:sesion'], true)).rejects.toMatchObject({
        codigo: 'memoria.plan_caducado',
      });
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
  });
});
