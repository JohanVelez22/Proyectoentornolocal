import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntradaAviso } from '../src/avisos/avisos';
import { ErrorWolf } from '../src/errores';
import { Rutas } from '../src/rutas';
import { huellaTarea } from '../src/tareas/comando';
import { Programador, type DepsProgramador } from '../src/tareas/programador';
import { SitioSchema, TareaSitioSchema, type Sitio, type TareaSitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const HUELLA_RECETA = 'a'.repeat(64);
const COMANDO = ['php', 'artisan', 'schedule:run'];

const tarea = (o: Partial<TareaSitio> = {}): TareaSitio =>
  TareaSitioSchema.parse({
    id: 'sched',
    nombre: 'Schedule',
    cron: '* * * * *',
    comando: COMANDO,
    activa: true,
    confirmada: huellaTarea(o.comando ?? COMANDO),
    ...o,
  });

const sitio = (o: Partial<Sitio> = {}, t: TareaSitio[] = [tarea()]): Sitio =>
  SitioSchema.parse({
    id: 'tienda',
    nombre: 'Tienda',
    dominio: 'tienda.test',
    carpeta: 'C:\\sitios\\tienda',
    tipo: 'laravel',
    confiado: true,
    recetaConfiada: HUELLA_RECETA,
    tareas: t,
    ...o,
  });

const minuto = (n: number): Date => new Date(Date.UTC(2026, 4, 10, 10, n, 5));

interface Armado {
  p: Programador;
  sitios: { actual: Sitio[] };
  ejecutar: ReturnType<typeof vi.fn>;
  avisos: EntradaAviso[];
  deps: DepsProgramador;
  rutas: Rutas;
  huella: { valor: string | null };
  existe: { valor: boolean };
}

async function armar(
  opciones: {
    sitios?: Sitio[];
    aislado?: boolean;
    ejecutar?: (...a: Parameters<DepsProgramador['ejecutar']>) => Promise<{ codigo: number }>;
  } = {},
): Promise<Armado> {
  const dir = await carpetaTemporal('pel-tareas-');
  const rutas = new Rutas(dir);
  const sitios = { actual: opciones.sitios ?? [sitio()] };
  const huella = { valor: HUELLA_RECETA as string | null };
  const existe = { valor: true };
  const avisos: EntradaAviso[] = [];
  const ejecutar = vi.fn(opciones.ejecutar ?? (async () => ({ codigo: 0 })));
  const deps: DepsProgramador = {
    rutas,
    leerSitios: async () => sitios.actual,
    huellaReceta: async () => huella.valor,
    existeCarpeta: async () => existe.valor,
    ejecutar: ejecutar as DepsProgramador['ejecutar'],
    avisar: (a) => avisos.push(a),
    aislado: () => opciones.aislado === true,
    zona: 'UTC',
  };
  return { p: new Programador(deps), sitios, ejecutar, avisos, deps, rutas, huella, existe };
}

/** Arranca el reloj en el minuto 0 y deja al planificador listo para el minuto 1. */
async function listo(a: Armado): Promise<void> {
  await a.p.tick(minuto(0));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Programador: lo que ejecuta', () => {
  it('ejecuta la tarea que toca con el comando confirmado y anota el historial', async () => {
    const a = await armar();
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
    const [sitioArg, comando, o] = a.ejecutar.mock.calls[0]!;
    expect((sitioArg as Sitio).id).toBe('tienda');
    expect(comando).toEqual(COMANDO);
    expect((o as { senal: AbortSignal }).senal).toBeInstanceOf(AbortSignal);
    const h = await a.p.historialDe('tienda', 'sched');
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ estado: 'ok', codigo: 0, origen: 'programada' });
  });

  it('una tarea pausada no corre sola, pero se puede ejecutar a mano', async () => {
    const a = await armar({ sitios: [sitio({}, [tarea({ activa: false })])] });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).not.toHaveBeenCalled();
    const e = await a.p.ejecutarAhora('tienda', 'sched');
    expect(e).toMatchObject({ estado: 'ok', origen: 'manual' });
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('respeta el cron: no corre fuera de su hora', async () => {
    const a = await armar({ sitios: [sitio({}, [tarea({ cron: '30 3 * * *' })])] });
    await listo(a);
    await a.p.tick(minuto(1));
    await a.p.tick(minuto(2));
    expect(a.ejecutar).not.toHaveBeenCalled();
    await a.p.tick(new Date(Date.UTC(2026, 4, 11, 3, 29, 59)));
    expect(a.ejecutar).not.toHaveBeenCalled();
    await a.p.tick(new Date(Date.UTC(2026, 4, 11, 3, 30, 1)));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('un equipo que estuvo dormido no recupera lo perdido: se anota como omitida', async () => {
    const a = await armar();
    await listo(a);
    await a.p.tick(new Date(Date.UTC(2026, 4, 10, 12, 0, 0)));
    expect(a.ejecutar).not.toHaveBeenCalled();
    const h = await a.p.historialDe('tienda', 'sched');
    expect(h[0]).toMatchObject({ estado: 'omitida', motivo: 'retraso' });
  });

  it('un fallo (código distinto de 0) avisa y queda en el historial', async () => {
    const a = await armar({ ejecutar: async () => ({ codigo: 2 }) });
    await listo(a);
    await a.p.tick(minuto(1));
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({
      estado: 'fallo',
      codigo: 2,
    });
    expect(a.avisos).toHaveLength(1);
    expect(a.avisos[0]).toMatchObject({
      nivel: 'error',
      tipo: 'proceso-error',
      codigo: 'avisos.tarea_fallo',
    });
    // El aviso no lleva la salida ni el comando: solo el nombre y el dominio.
    expect(JSON.stringify(a.avisos[0])).not.toContain('schedule:run');
  });

  it('si el programa no se puede lanzar también es un fallo con aviso', async () => {
    const a = await armar({
      ejecutar: async () => {
        throw new Error('No hay PHP instalado');
      },
    });
    await listo(a);
    await a.p.tick(minuto(1));
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({
      estado: 'fallo',
      motivo: 'error',
    });
    expect(a.avisos[0]?.codigo).toBe('avisos.tarea_fallo');
    const log = (await a.p.leerLog('tienda', 'sched')).join('\n');
    expect(log).toContain('No hay PHP instalado');
  });

  it('un éxito no avisa', async () => {
    const a = await armar();
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.avisos).toHaveLength(0);
  });
});

describe('Programador: sin solapar', () => {
  it('si la tarea sigue corriendo, la siguiente se salta y se anota', async () => {
    let soltar!: () => void;
    let llamadas = 0;
    const a = await armar({
      // Solo la primera queda colgada; las siguientes terminan enseguida.
      ejecutar: () =>
        ++llamadas > 1
          ? Promise.resolve({ codigo: 0 })
          : new Promise((r) => {
              soltar = () => r({ codigo: 0 });
            }),
    });
    await listo(a);
    const primera = a.p.tick(minuto(1));
    // Dejar que la primera llegue a `ejecutar`.
    await vi.waitFor(() => expect(a.ejecutar).toHaveBeenCalledTimes(1));
    await a.p.tick(minuto(2));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({
      estado: 'omitida',
      motivo: 'solapada',
    });
    // Tampoco a mano.
    await expect(a.p.ejecutarAhora('tienda', 'sched')).rejects.toMatchObject({
      codigo: 'tareas.en_curso',
    });
    soltar();
    await primera;
    // Terminada, vuelve a correr.
    await a.p.tick(minuto(3));
    expect(a.ejecutar).toHaveBeenCalledTimes(2);
  });

  it('dos tareas distintas del mismo sitio sí corren a la vez', async () => {
    const a = await armar({
      sitios: [sitio({}, [tarea({ id: 'uno' }), tarea({ id: 'dos' })])],
    });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).toHaveBeenCalledTimes(2);
  });
});

describe('Programador: tiempo máximo y cierre', () => {
  it('pasado el tiempo máximo aborta la señal de su propio proceso y lo anota', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let senal!: AbortSignal;
    const a = await armar({
      sitios: [sitio({}, [tarea({ tiempoMaxS: 5 })])],
      ejecutar: (_s, _c, o) =>
        new Promise((resolve) => {
          senal = o.senal;
          // Como el lanzador real: al abortar, mata el árbol y el proceso sale con un código.
          o.senal.addEventListener('abort', () => resolve({ codigo: 1 }));
        }),
    });
    await listo(a);
    const corriendo = a.p.tick(minuto(1));
    await vi.waitFor(() => expect(a.ejecutar).toHaveBeenCalledTimes(1));
    expect(senal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(4_900);
    expect(senal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(senal.aborted).toBe(true);
    await corriendo;
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({ estado: 'tiempo' });
    expect(a.avisos[0]?.codigo).toBe('avisos.tarea_fallo');
    expect((await a.p.leerLog('tienda', 'sched')).join('\n')).toContain('tiempo máximo');
  });

  it('detener() aborta lo que corre y espera a que termine', async () => {
    let senal!: AbortSignal;
    const a = await armar({
      ejecutar: (_s, _c, o) =>
        new Promise((resolve) => {
          senal = o.senal;
          o.senal.addEventListener('abort', () => resolve({ codigo: 1 }));
        }),
    });
    a.p.iniciar();
    await a.p.tick(minuto(0));
    const corriendo = a.p.tick(minuto(1));
    await vi.waitFor(() => expect(a.ejecutar).toHaveBeenCalledTimes(1));
    await a.p.detener();
    expect(senal.aborted).toBe(true);
    await corriendo;
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({ estado: 'cancelada' });
    // Cerrada la app, no avisa de un fallo.
    expect(a.avisos).toHaveLength(0);
    // Y detenido, un tick más no lanza nada.
    await a.p.tick(minuto(2));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });
});

describe('Programador: solo en sitios confiados y con el comando confirmado', () => {
  const caso = async (
    cambio: (a: Armado) => void,
    esperado: string,
    sitios?: Sitio[],
  ): Promise<void> => {
    const a = await armar(sitios ? { sitios } : {});
    cambio(a);
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).not.toHaveBeenCalled();
    const h = await a.p.historialDe('tienda', 'sched');
    expect(h[0]).toMatchObject({ estado: 'bloqueada', motivo: esperado });
    expect(a.avisos[0]).toMatchObject({ codigo: 'avisos.tarea_bloqueada', nivel: 'aviso' });
    // Una vez por motivo: el minuto siguiente no repite historial ni aviso.
    await a.p.tick(minuto(2));
    expect(await a.p.historialDe('tienda', 'sched')).toHaveLength(1);
    expect(a.avisos).toHaveLength(1);
    // A mano falla con el error de ese motivo.
    await expect(a.p.ejecutarAhora('tienda', 'sched')).rejects.toBeInstanceOf(ErrorWolf);
    expect(a.ejecutar).not.toHaveBeenCalled();
  };

  it('sitio no confiado', () => caso(() => undefined, 'no_confiado', [sitio({ confiado: false })]));

  it('sitio importado de un perfil con carpeta pendiente', () =>
    caso(() => undefined, 'no_confiado', [sitio({ pendiente: 'carpeta' })]));

  it('la huella de la receta cambió desde que se confió', () =>
    caso((a) => (a.huella.valor = 'b'.repeat(64)), 'receta_cambio'));

  it('no se puede leer la receta (wolfcore.yml roto): no se ejecuta', () =>
    caso((a) => (a.huella.valor = null), 'receta_cambio'));

  it('confiado sin huella guardada: no hay con qué comparar y no se ejecuta', () =>
    caso(() => undefined, 'receta_cambio', [sitio({ recetaConfiada: null })]));

  it('tarea sin confirmar (llegó de wolfcore.yml o de un config editado a mano)', () =>
    caso(() => undefined, 'sin_confirmar', [sitio({}, [tarea({ confirmada: null })])]));

  it('el comando cambió después de la confirmación', () =>
    caso(() => undefined, 'sin_confirmar', [
      sitio({}, [{ ...tarea(), comando: ['php', 'artisan', 'migrate:fresh', '--force'] }]),
    ]));

  it('programa fuera de la lista cerrada, aunque esté confirmado', () => {
    const comando = ['curl', 'https://ejemplo.test/x.sh'];
    return caso(() => undefined, 'comando_invalido', [sitio({}, [tarea({ comando })])]);
  });

  it('la carpeta del sitio ya no existe', () => caso((a) => (a.existe.valor = false), 'carpeta'));

  it('al volver a cumplirse todo, corre y el bloqueo se olvida', async () => {
    const a = await armar({ sitios: [sitio({ confiado: false })] });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).not.toHaveBeenCalled();
    a.sitios.actual = [sitio()];
    await a.p.tick(minuto(2));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('expresión cron inválida en el config: no se ejecuta', async () => {
    const a = await armar({ sitios: [sitio({}, [tarea({ cron: '99 * * * *' })])] });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).not.toHaveBeenCalled();
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({
      estado: 'bloqueada',
      motivo: 'cron_invalida',
    });
  });
});

describe('Programador: carpeta de datos aislada (WOLFCORE_DATOS)', () => {
  it('no ejecuta nada, programado ni a mano, hasta que el usuario lo permite', async () => {
    const a = await armar({ aislado: true });
    expect(a.p.estado()).toMatchObject({ aislado: true, permitido: false });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).not.toHaveBeenCalled();
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({
      estado: 'bloqueada',
      motivo: 'aislado',
    });
    await expect(a.p.ejecutarAhora('tienda', 'sched')).rejects.toMatchObject({
      codigo: 'tareas.aislado',
    });
    a.p.permitirAislado();
    expect(a.p.estado().permitido).toBe(true);
    await a.p.tick(minuto(2));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });

  it('sin aislar, el permiso no hace falta', async () => {
    const a = await armar();
    expect(a.p.estado()).toMatchObject({ aislado: false, permitido: false });
    await listo(a);
    await a.p.tick(minuto(1));
    expect(a.ejecutar).toHaveBeenCalledTimes(1);
  });
});

describe('Programador: historial y registro', () => {
  it('conserva solo las 50 últimas ejecuciones y sobrevive a un reinicio', async () => {
    const a = await armar();
    await listo(a);
    for (let i = 1; i <= 55; i++) await a.p.tick(minuto(i % 60 === 0 ? 59 : i % 60));
    const h = await a.p.historialDe('tienda', 'sched');
    expect(h.length).toBeLessThanOrEqual(50);
    expect(h.length).toBeGreaterThan(40);
    const otro = new Programador(a.deps);
    expect(await otro.historialDe('tienda', 'sched')).toEqual(h);
  });

  it('con más de 50 ejecuciones, el historial se queda en 50', async () => {
    const a = await armar();
    const base = Date.UTC(2026, 4, 10, 0, 0, 5);
    await a.p.tick(new Date(base));
    for (let i = 1; i <= 60; i++) await a.p.tick(new Date(base + i * 60_000));
    expect(await a.p.historialDe('tienda', 'sched')).toHaveLength(50);
  });

  it('la salida pasa por el enmascarado de secretos y lleva tope', async () => {
    const a = await armar({
      ejecutar: async (_s, _c, o) => {
        o.alLinea('conectando con password=centinela-secreta-d');
        o.alLinea('Authorization: Bearer centinela-secreta-d');
        o.alLinea('DB_URL=mysql://root:centinela-secreta-d@localhost/x');
        for (let i = 0; i < 40_000; i++) o.alLinea(`línea de relleno número ${i} xxxxxxxxxxxxxxxx`);
        return { codigo: 0 };
      },
    });
    await listo(a);
    await a.p.tick(minuto(1));
    const bruto = await readFile(a.rutas.logTarea('tienda', 'sched'), 'utf8');
    expect(bruto).not.toContain('centinela-secreta-d');
    expect(bruto).toContain('password=***');
    expect(bruto).toContain('salida recortada');
    expect(bruto.length).toBeLessThan(300 * 1024);
  });

  it('el comando del encabezado del registro también se enmascara', async () => {
    const a = await armar({
      sitios: [
        sitio({}, [tarea({ comando: ['php', 'job.php', '--token', 'centinela-secreta-d'] })]),
      ],
    });
    await listo(a);
    await a.p.tick(minuto(1));
    const bruto = await readFile(a.rutas.logTarea('tienda', 'sched'), 'utf8');
    expect(bruto).not.toContain('centinela-secreta-d');
  });

  it('el registro rota al pasar de 1 MB', async () => {
    const a = await armar({
      ejecutar: async (_s, _c, o) => {
        for (let i = 0; i < 4000; i++) o.alLinea('x'.repeat(200));
        return { codigo: 0 };
      },
    });
    await listo(a);
    for (let i = 1; i <= 8; i++) await a.p.tick(minuto(i));
    const ruta = a.rutas.logTarea('tienda', 'sched');
    const rotado = await readFile(`${ruta}.1`, 'utf8');
    expect(rotado.length).toBeGreaterThan(0);
    expect(path.basename(ruta)).toBe('tienda-sched.log');
  });

  it('olvidar() borra el historial de la tarea', async () => {
    const a = await armar();
    await listo(a);
    await a.p.tick(minuto(1));
    await a.p.olvidar('tienda', 'sched');
    expect(await a.p.historialDe('tienda', 'sched')).toEqual([]);
  });
});

describe('Programador: vista', () => {
  it('da la próxima ejecución, el bloqueo y la última ejecución', async () => {
    const a = await armar({
      sitios: [sitio({}, [tarea(), tarea({ id: 'pausa', activa: false, confirmada: null })])],
    });
    a.deps.ahora = () => new Date(Date.UTC(2026, 4, 10, 10, 0, 30));
    const v = await a.p.vista('tienda');
    expect(v).toHaveLength(2);
    expect(v[0]).toMatchObject({
      huella: huellaTarea(COMANDO),
      proxima: '2026-05-10T10:01:00.000Z',
      bloqueo: null,
      enCurso: false,
      ultima: null,
    });
    expect(v[1]).toMatchObject({ proxima: null, bloqueo: 'sin_confirmar' });
  });
});

describe('Programador: temporizador', () => {
  it('iniciar() es idempotente y detener() lo apaga', async () => {
    vi.useFakeTimers();
    const a = await armar();
    a.p.iniciar();
    a.p.iniciar();
    expect(a.p.estado().corriendo).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    await a.p.detener();
    expect(a.p.estado().corriendo).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Programador: revisión de D29', () => {
  it('una tarea larga no congela al planificador: las demás siguen y la larga anota solapada', async () => {
    const esperaReal = globalThis.setTimeout;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(Date.UTC(2026, 4, 10, 10, 0, 5)));
    const larga = tarea({
      id: 'larga',
      comando: ['php', 'larga.php'],
      confirmada: huellaTarea(['php', 'larga.php']),
    });
    const corta = tarea({
      id: 'corta',
      comando: ['php', 'corta.php'],
      confirmada: huellaTarea(['php', 'corta.php']),
    });
    const a = await armar({
      sitios: [sitio({}, [larga, corta])],
      ejecutar: (_s, c, o) =>
        c[1] === 'larga.php'
          ? new Promise((r) => o.senal.addEventListener('abort', () => r({ codigo: 1 })))
          : Promise.resolve({ codigo: 0 }),
    });
    delete a.deps.ahora;
    a.p.iniciar();
    // La E/S es real: se espera con el temporizador real (el simulado solo mueve los minutos).
    const dejar = async (cond: () => boolean | Promise<boolean>): Promise<void> => {
      for (let i = 0; i < 1200 && !(await cond()); i++) await new Promise((r) => esperaReal(r, 5));
    };
    // Terminada del todo: anotada en el historial y fuera de las ejecuciones en curso.
    const terminadas = async (): Promise<number> => {
      const enCurso = (await a.p.vista('tienda')).find((v) => v.tarea.id === 'corta')?.enCurso;
      if (enCurso) return 0;
      return (await a.p.historialDe('tienda', 'corta')).filter((e) => e.estado === 'ok').length;
    };
    const cortas = (): number =>
      a.ejecutar.mock.calls.filter((c) => c[1][1] === 'corta.php').length;
    await vi.advanceTimersByTimeAsync(60_000);
    await dejar(async () => (await terminadas()) >= 1);
    expect(cortas()).toBe(1);
    // Pasan más de 2 minutos con la larga aún corriendo: la corta sigue corriendo cada minuto.
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(60_000);
      await dejar(async () => (await terminadas()) >= i + 2);
    }
    expect(cortas()).toBe(4);
    const h = await a.p.historialDe('tienda', 'larga');
    expect(h.filter((e) => e.motivo === 'solapada').length).toBeGreaterThanOrEqual(2);
    await a.p.detener();
  });

  it('detener() no se queda esperando a un proceso que ignora la señal (tope)', async () => {
    const a = await armar({ ejecutar: () => new Promise(() => undefined) });
    a.deps.topeDetenerMs = 100;
    await listo(a);
    void a.p.tick(minuto(1));
    await vi.waitFor(() => expect(a.ejecutar).toHaveBeenCalledTimes(1));
    const t0 = Date.now();
    await a.p.detener();
    expect(Date.now() - t0).toBeLessThan(3000);
  });

  it('con el planificador deteniéndose no se ejecuta a mano', async () => {
    const a = await armar();
    await a.p.detener();
    await expect(a.p.ejecutarAhora('tienda', 'sched')).rejects.toBeInstanceOf(ErrorWolf);
    expect(a.ejecutar).not.toHaveBeenCalled();
  });

  it('una carpeta que no existe da tareas.carpeta al ejecutar a mano', async () => {
    const a = await armar();
    a.existe.valor = false;
    await expect(a.p.ejecutarAhora('tienda', 'sched')).rejects.toMatchObject({
      codigo: 'tareas.carpeta',
    });
  });

  it('abortarSitio aborta solo las ejecuciones de ese sitio', async () => {
    let senal!: AbortSignal;
    const a = await armar({
      ejecutar: (_s, _c, o) =>
        new Promise((r) => {
          senal = o.senal;
          o.senal.addEventListener('abort', () => r({ codigo: 1 }));
        }),
    });
    await listo(a);
    const corriendo = a.p.tick(minuto(1));
    await vi.waitFor(() => expect(a.ejecutar).toHaveBeenCalledTimes(1));
    a.p.abortarSitio('otro');
    expect(senal.aborted).toBe(false);
    a.p.abortarSitio('tienda');
    expect(senal.aborted).toBe(true);
    await corriendo;
    expect((await a.p.historialDe('tienda', 'sched'))[0]).toMatchObject({ estado: 'cancelada' });
  });

  it('el tope de salida cuenta bytes reales (UTF-8 de varios bytes)', async () => {
    const a = await armar({
      ejecutar: async (_s, _c, o) => {
        for (let i = 0; i < 5000; i++) o.alLinea('ñ'.repeat(200));
        return { codigo: 0 };
      },
    });
    await listo(a);
    await a.p.tick(minuto(1));
    const bruto = await readFile(a.rutas.logTarea('tienda', 'sched'));
    expect(bruto.length).toBeLessThan(300 * 1024);
  });

  it('olvidar borra el .log y el .1; purgarHuerfanos quita lo de sitios y tareas que ya no existen', async () => {
    const { writeFile, mkdir, access } = await import('node:fs/promises');
    const a = await armar();
    await listo(a);
    await a.p.tick(minuto(1));
    const ruta = a.rutas.logTarea('tienda', 'sched');
    await writeFile(`${ruta}.1`, 'viejo');
    const existe = async (f: string): Promise<boolean> =>
      access(f).then(
        () => true,
        () => false,
      );
    await mkdir(path.dirname(ruta), { recursive: true });
    await writeFile(a.rutas.logTarea('borrado', 'otra'), 'x');
    await writeFile(`${a.rutas.logTarea('borrado', 'otra')}.1`, 'x');
    await writeFile(path.join(path.dirname(ruta), 'notas.txt'), 'x');
    await a.p.purgarHuerfanos();
    expect(await existe(a.rutas.logTarea('borrado', 'otra'))).toBe(false);
    expect(await existe(`${a.rutas.logTarea('borrado', 'otra')}.1`)).toBe(false);
    expect(await existe(path.join(path.dirname(ruta), 'notas.txt'))).toBe(true);
    expect(await existe(ruta)).toBe(true);
    await a.p.olvidar('tienda', 'sched');
    expect(await existe(ruta)).toBe(false);
    expect(await existe(`${ruta}.1`)).toBe(false);
  });
});
