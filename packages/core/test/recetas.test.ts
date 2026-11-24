import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Eventos, type EventosNucleo, type ProgresoReceta } from '../src/eventos';
import type { PasoReceta } from '../src/proyectos/config';
import type { Deteccion } from '../src/proyectos/detectar';
import { RegistroPasos, type ContextoPaso } from '../src/proyectos/pasos';
import {
  EjecutorRecetas,
  GRACIA_CANCELACION_MS,
  MAX_BYTES_LINEA,
  MENSAJE_NO_CONFIADO,
  recetaEfectiva,
  recetaPorDefecto,
  sanear,
} from '../src/proyectos/recetas';
import { Rutas } from '../src/rutas';
import type { Sitio } from '../src/tipos';

const sitio = (o: Partial<Sitio> = {}): Sitio => ({
  id: 'tienda-test',
  nombre: 'Tienda',
  dominio: 'tienda.test',
  alias: [],
  carpeta: 'C:/Proyectos/Tienda',
  tipo: 'laravel',
  php: '8.4',
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  https: false,
  redirigirHttps: false,
  confiado: true,
  git: null,
  procesos: [],
  runtimes: {},
  nota: '',
  ...o,
});

const RECETA: PasoReceta[] = [
  { id: 'uno', tipo: 'comando', titulo: 'Uno', args: { n: 1 } },
  { id: 'dos', tipo: 'comando', titulo: 'Dos', args: { n: 2 } },
  { id: 'tres', tipo: 'comando', titulo: 'Tres', args: { n: 3 } },
];

interface Promesa {
  promesa: Promise<void>;
  resolver: () => void;
}
function diferida(): Promesa {
  let resolver!: () => void;
  const promesa = new Promise<void>((r) => (resolver = r));
  return { promesa, resolver };
}

/** Un registro con un paso 'comando' falso: anota el orden y falla o espera según `fallos`/`esperas`. */
function pasosFalsos() {
  const orden: string[] = [];
  const fallos = new Map<string, number>(); // id → cuántas veces más falla
  const esperas = new Map<string, Promise<void>>();
  /** Pasos que no hacen caso a la señal de cancelación. */
  const sordos = new Set<string>();
  const contextos: ContextoPaso[] = [];
  const registro = new RegistroPasos();
  registro.registrar('comando', async (ctx) => {
    contextos.push(ctx);
    orden.push(ctx.paso.id);
    ctx.linea(`inicio ${ctx.paso.id}`);
    const espera = esperas.get(ctx.paso.id);
    if (espera) {
      await new Promise<void>((resolve, reject) => {
        void espera.then(resolve);
        if (!sordos.has(ctx.paso.id)) {
          ctx.senal.addEventListener('abort', () => reject(new Error('abortado')));
        }
      });
    }
    const f = fallos.get(ctx.paso.id) ?? 0;
    if (f > 0) {
      fallos.set(ctx.paso.id, f - 1);
      throw new Error(`falló ${ctx.paso.id}`);
    }
    ctx.linea(`fin ${ctx.paso.id}`);
  });
  return { orden, fallos, esperas, sordos, contextos, registro };
}

async function montar(
  o: { sitio?: Sitio; receta?: PasoReceta[]; base?: string; gracia?: number } = {},
) {
  const base = o.base ?? (await carpetaTemporal('pel-receta-'));
  const rutas = new Rutas(base);
  const eventos = new Eventos<EventosNucleo>();
  const progreso: ProgresoReceta[] = [];
  eventos.on('receta:progreso', (p) => progreso.push(p));
  const terminadas: EventosNucleo['receta:terminada'][] = [];
  eventos.on('receta:terminada', (t) => terminadas.push(t));
  const falsos = pasosFalsos();
  const s = o.sitio ?? sitio();
  const ejecutor = new EjecutorRecetas({
    rutas,
    eventos,
    pasos: falsos.registro,
    sitio: (id) => (id === s.id ? s : undefined),
    receta: () => Promise.resolve(o.receta ?? RECETA),
    graciaCancelacionMs: o.gracia,
  });
  return { base, rutas, eventos, progreso, terminadas, ejecutor, ...falsos, s };
}

const estadosDe = (e: { pasos: { id: string; estado: string }[] }) =>
  Object.fromEntries(e.pasos.map((p) => [p.id, p.estado]));

describe('EjecutorRecetas', () => {
  it('ejecuta los pasos en orden, uno a la vez, y emite el progreso con las líneas', async () => {
    const m = await montar();
    const r = await m.ejecutor.ejecutar(m.s.id, {});
    expect(r.estado).toBe('lista');
    expect(m.orden).toEqual(['uno', 'dos', 'tres']);
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      uno: 'listo',
      dos: 'listo',
      tres: 'listo',
    });
    const deUno = m.progreso.filter((p) => p.pasoId === 'uno');
    expect(deUno.map((p) => [p.estado, p.linea])).toEqual([
      ['pendiente', undefined],
      ['corriendo', undefined],
      ['corriendo', 'inicio uno'],
      ['corriendo', 'fin uno'],
      ['listo', undefined],
    ]);
    expect(m.progreso.every((p) => p.sitioId === m.s.id)).toBe(true);
    // El paso recibe su definición, el sitio y la carpeta del proyecto.
    expect(m.contextos[1]!.paso.args).toEqual({ n: 2 });
    expect(m.contextos[1]!.carpeta).toBe(m.s.carpeta);
    expect(m.contextos[1]!.sitio.id).toBe(m.s.id);
    // El registro del paso queda en el estado.
    expect(m.ejecutor.estado(m.s.id).pasos[0]!.log).toEqual(['inicio uno', 'fin uno']);
  });

  it('se detiene en el primer error y deja los siguientes pendientes', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    const r = await m.ejecutor.ejecutar(m.s.id, {});
    expect(r).toMatchObject({ estado: 'error', pasoId: 'dos', mensaje: 'falló dos' });
    expect(m.orden).toEqual(['uno', 'dos']);
    const e = m.ejecutor.estado(m.s.id);
    expect(e.estado).toBe('error');
    expect(estadosDe(e)).toEqual({ uno: 'listo', dos: 'error', tres: 'pendiente' });
    expect(e.pasos[1]!.mensaje).toBe('falló dos');
    expect(m.progreso.at(-1)).toEqual({
      sitioId: m.s.id,
      pasoId: 'dos',
      estado: 'error',
      linea: 'falló dos',
    });
  });

  it('reintenta solo el paso que falló con soloPaso', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    m.orden.length = 0;
    const r = await m.ejecutor.ejecutar(m.s.id, { soloPaso: 'dos' });
    expect(m.orden).toEqual(['dos']);
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      uno: 'listo',
      dos: 'listo',
      tres: 'pendiente',
    });
    expect(r.estado).toBe('incompleta');
    // Y luego sigue desde el siguiente.
    const r2 = await m.ejecutor.ejecutar(m.s.id, { desde: 'tres' });
    expect(m.orden).toEqual(['dos', 'tres']);
    expect(r2.estado).toBe('lista');
  });

  it('desde: reintenta el paso fallido y sigue con el resto', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    m.orden.length = 0;
    const r = await m.ejecutor.ejecutar(m.s.id, { desde: 'dos' });
    expect(m.orden).toEqual(['dos', 'tres']);
    expect(r.estado).toBe('lista');
  });

  it('omitir marca el paso como omitido y sigue desde el siguiente', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    m.orden.length = 0;
    const r = await m.ejecutor.omitir(m.s.id, 'dos');
    expect(m.orden).toEqual(['tres']);
    expect(r.estado).toBe('lista');
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      uno: 'listo',
      dos: 'omitido',
      tres: 'listo',
    });
    expect(m.progreso).toContainEqual({ sitioId: m.s.id, pasoId: 'dos', estado: 'omitido' });
  });

  it('desde marca como omitidos los pasos anteriores que no estaban listos', async () => {
    const m = await montar();
    m.fallos.set('uno', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    m.orden.length = 0;
    await m.ejecutor.ejecutar(m.s.id, { desde: 'tres' });
    expect(m.orden).toEqual(['tres']);
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      uno: 'omitido',
      dos: 'omitido',
      tres: 'listo',
    });
  });

  it('omitir el último paso termina la receta sin ejecutar nada', async () => {
    const m = await montar();
    m.fallos.set('tres', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    m.orden.length = 0;
    const r = await m.ejecutor.omitir(m.s.id, 'tres');
    expect(m.orden).toEqual([]);
    expect(r.estado).toBe('lista');
    expect(estadosDe(m.ejecutor.estado(m.s.id)).tres).toBe('omitido');
  });

  it('exige que el repositorio sea de confianza', async () => {
    const m = await montar({ sitio: sitio({ confiado: false }) });
    await expect(m.ejecutor.ejecutar(m.s.id, {})).rejects.toThrow(
      'Marque "Confío en este repositorio" para ejecutar la receta',
    );
    expect(MENSAJE_NO_CONFIADO).toBe('Marque "Confío en este repositorio" para ejecutar la receta');
    expect(m.orden).toEqual([]);
    await expect(m.ejecutor.omitir(m.s.id, 'uno')).rejects.toThrow(MENSAJE_NO_CONFIADO);
  });

  it('falla en claro si el proyecto no existe o el paso no está en la receta', async () => {
    const m = await montar();
    await expect(m.ejecutor.ejecutar('otro', {})).rejects.toThrow('No existe el proyecto "otro"');
    await expect(m.ejecutor.ejecutar(m.s.id, { soloPaso: 'nada' })).rejects.toThrow(
      'El paso "nada" no está en la receta',
    );
    await expect(m.ejecutor.ejecutar(m.s.id, { desde: 'uno', soloPaso: 'dos' })).rejects.toThrow(
      'Use "desde" o "soloPaso", no ambos',
    );
  });

  it('un tipo de paso sin implementación termina en error', async () => {
    const m = await montar({ receta: [{ id: 'x', tipo: 'migrar', titulo: 'Migrar' }] });
    const r = await m.ejecutor.ejecutar(m.s.id, {});
    expect(r).toMatchObject({ estado: 'error', pasoId: 'x' });
    expect(r.mensaje).toContain('migrar');
  });

  it('solo permite una receta por proyecto a la vez', async () => {
    const m = await montar();
    const espera = diferida();
    m.esperas.set('uno', espera.promesa);
    const primera = m.ejecutor.ejecutar(m.s.id, {});
    await expect(m.ejecutor.ejecutar(m.s.id, {})).rejects.toThrow(
      'Ya hay una receta en curso para este proyecto',
    );
    await expect(m.ejecutor.omitir(m.s.id, 'uno')).rejects.toThrow(
      'Ya hay una receta en curso para este proyecto',
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(m.ejecutor.estado(m.s.id).estado).toBe('corriendo');
    espera.resolver();
    expect((await primera).estado).toBe('lista');
    expect(m.orden).toEqual(['uno', 'dos', 'tres']);
    // Terminada, se puede volver a ejecutar.
    expect((await m.ejecutor.ejecutar(m.s.id, {})).estado).toBe('lista');
  });

  it('proyectos distintos corren a la vez', async () => {
    const base = await carpetaTemporal('pel-receta-');
    const rutas = new Rutas(base);
    const eventos = new Eventos<EventosNucleo>();
    const falsos = pasosFalsos();
    const espera = diferida();
    falsos.esperas.set('uno', espera.promesa);
    const sitios = [sitio({ id: 'a' }), sitio({ id: 'b' })];
    const ejecutor = new EjecutorRecetas({
      rutas,
      eventos,
      pasos: falsos.registro,
      sitio: (id) => sitios.find((s) => s.id === id),
      receta: () => Promise.resolve(RECETA),
    });
    const a = ejecutor.ejecutar('a', {});
    const b = ejecutor.ejecutar('b', {});
    await new Promise((r) => setTimeout(r, 10));
    expect(ejecutor.estado('a').estado).toBe('corriendo');
    expect(ejecutor.estado('b').estado).toBe('corriendo');
    espera.resolver();
    expect((await a).estado).toBe('lista');
    expect((await b).estado).toBe('lista');
  });

  it('avisa al terminar con exito y con fallo; cancelar y un reintento parcial no avisan', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    expect(m.terminadas).toEqual([{ sitioId: m.s.id, estado: 'error' }]);
    // Reintentar solo el paso que fallo deja pasos pendientes: no esta terminada.
    await m.ejecutor.ejecutar(m.s.id, { soloPaso: 'dos' });
    expect(m.terminadas).toHaveLength(1);
    expect((await m.ejecutor.ejecutar(m.s.id, { desde: 'tres' })).estado).toBe('lista');
    expect(m.terminadas.at(-1)).toEqual({ sitioId: m.s.id, estado: 'lista' });
    const antes = m.terminadas.length;
    m.esperas.set('dos', new Promise<void>(() => undefined));
    const corriendo = m.ejecutor.ejecutar(m.s.id, {});
    await new Promise((r) => setTimeout(r, 10));
    m.ejecutor.cancelar(m.s.id);
    expect((await corriendo).estado).toBe('cancelada');
    expect(m.terminadas).toHaveLength(antes);
  });

  it('una receta que no se puede ejecutar (sin confianza) no avisa', async () => {
    const m = await montar({ sitio: sitio({ confiado: false }) });
    await expect(m.ejecutor.ejecutar(m.s.id, {})).rejects.toThrow();
    expect(m.terminadas).toEqual([]);
  });

  it('cancelar aborta el paso en curso y no ejecuta los siguientes', async () => {
    const m = await montar();
    m.esperas.set('dos', new Promise<void>(() => undefined)); // nunca termina solo
    const corriendo = m.ejecutor.ejecutar(m.s.id, {});
    await new Promise((r) => setTimeout(r, 10));
    expect(m.ejecutor.cancelar(m.s.id)).toBe(true);
    const r = await corriendo;
    expect(r.estado).toBe('cancelada');
    expect(m.orden).toEqual(['uno', 'dos']);
    expect(m.contextos[1]!.senal.aborted).toBe(true);
    const e = m.ejecutor.estado(m.s.id);
    expect(e.estado).toBe('cancelada');
    expect(estadosDe(e)).toEqual({ uno: 'listo', dos: 'pendiente', tres: 'pendiente' });
    expect(m.ejecutor.cancelar(m.s.id)).toBe(false);
    // Tras cancelar se puede seguir desde el paso cancelado.
    m.esperas.delete('dos');
    expect((await m.ejecutor.ejecutar(m.s.id, { desde: 'dos' })).estado).toBe('lista');
  });

  it('persiste el estado en run/receta-<id>.json y lo recupera tras reiniciar', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    const archivo = join(m.base, 'run', `receta-${m.s.id}.json`);
    const guardado = JSON.parse(await readFile(archivo, 'utf8')) as { estado: string };
    expect(guardado.estado).toBe('error');
    // No quedan temporales de la escritura atómica.
    expect((await readdir(join(m.base, 'run'))).filter((n) => n.endsWith('.tmp'))).toEqual([]);

    // "Reinicio": otro ejecutor sobre la misma carpeta de datos.
    const m2 = await montar({ base: m.base });
    const e = m2.ejecutor.estado(m.s.id);
    expect(e.estado).toBe('error');
    expect(estadosDe(e)).toEqual({ uno: 'listo', dos: 'error', tres: 'pendiente' });
    expect(e.pasos[1]!.mensaje).toBe('falló dos');
    expect(e.pasos[0]!.log).toEqual(['inicio uno', 'fin uno']);
    // Y se puede reintentar desde ahí con la receta guardada.
    const r = await m2.ejecutor.ejecutar(m.s.id, { desde: 'dos' });
    expect(r.estado).toBe('lista');
    expect(m2.orden).toEqual(['dos', 'tres']);
  });

  it('una receta que quedó corriendo al cerrar se muestra como interrumpida', async () => {
    const base = await carpetaTemporal('pel-receta-');
    await mkdir(join(base, 'run'), { recursive: true });
    await writeFile(
      join(base, 'run', 'receta-tienda-test.json'),
      JSON.stringify({
        sitioId: 'tienda-test',
        estado: 'corriendo',
        actualizado: new Date().toISOString(),
        pasos: [
          { ...RECETA[0], estado: 'listo', log: [] },
          { ...RECETA[1], estado: 'corriendo', log: ['a medias'] },
          { ...RECETA[2], estado: 'pendiente', log: [] },
        ],
      }),
    );
    const m = await montar({ base });
    const e = m.ejecutor.estado('tienda-test');
    expect(e.estado).toBe('error');
    expect(estadosDe(e)).toEqual({ uno: 'listo', dos: 'error', tres: 'pendiente' });
    expect(e.pasos[1]!.mensaje).toBe('Se interrumpió al cerrar el programa');
  });

  it('un archivo de estado dañado se trata como si no hubiera estado', async () => {
    const base = await carpetaTemporal('pel-receta-');
    await mkdir(join(base, 'run'), { recursive: true });
    await writeFile(join(base, 'run', 'receta-tienda-test.json'), '{ esto no es json');
    await writeFile(join(base, 'run', 'receta-otro.json'), JSON.stringify({ estado: 42 }));
    const m = await montar({ base });
    expect(m.ejecutor.estado('tienda-test')).toEqual({
      sitioId: 'tienda-test',
      estado: 'inactiva',
      pasos: [],
      actualizado: null,
    });
    expect(m.ejecutor.estado('otro').estado).toBe('inactiva');
    // Y la receta corre normalmente, reemplazándolo.
    expect((await m.ejecutor.ejecutar('tienda-test', {})).estado).toBe('lista');
    const guardado = JSON.parse(
      await readFile(join(base, 'run', 'receta-tienda-test.json'), 'utf8'),
    ) as { estado: string };
    expect(guardado.estado).toBe('lista');
  });

  it('el estado de un proyecto sin receta ejecutada es inactiva', async () => {
    const m = await montar();
    expect(m.ejecutor.estado(m.s.id).estado).toBe('inactiva');
  });

  it('cancelar no se cuelga si el paso no hace caso a la señal', async () => {
    const m = await montar({ gracia: 30 });
    const tarde = diferida();
    m.esperas.set('dos', tarde.promesa);
    m.sordos.add('dos');
    const corriendo = m.ejecutor.ejecutar(m.s.id, {});
    await new Promise((r) => setTimeout(r, 10));
    expect(m.ejecutor.cancelar(m.s.id)).toBe(true);
    const r = await corriendo;
    expect(r.estado).toBe('cancelada');
    const e = m.ejecutor.estado(m.s.id);
    expect(e.estado).toBe('cancelada');
    expect(estadosDe(e)).toEqual({ uno: 'listo', dos: 'error', tres: 'pendiente' });
    expect(e.pasos[1]!.mensaje).toBe('Cancelado: el paso no respondió');
    expect(m.progreso.at(-1)).toEqual({
      sitioId: m.s.id,
      pasoId: 'dos',
      estado: 'error',
      linea: 'Cancelado: el paso no respondió',
    });
    const guardado = JSON.parse(
      await readFile(join(m.base, 'run', `receta-${m.s.id}.json`), 'utf8'),
    ) as { estado: string };
    expect(guardado.estado).toBe('cancelada');
    // La reserva quedó libre aunque el paso siga vivo.
    expect(m.ejecutor.cancelar(m.s.id)).toBe(false);
    const n = m.progreso.length;
    // Si el paso colgado termina después, su resultado se ignora.
    tarde.resolver();
    await new Promise((r) => setTimeout(r, 10));
    expect(m.progreso.length).toBe(n);
    expect(estadosDe(m.ejecutor.estado(m.s.id)).dos).toBe('error');
    m.esperas.delete('dos');
    m.sordos.delete('dos');
    expect((await m.ejecutor.ejecutar(m.s.id, { desde: 'dos' })).estado).toBe('lista');
  });

  it('el plazo de gracia por defecto es de 10 s', () => {
    expect(GRACIA_CANCELACION_MS).toBe(10_000);
  });

  it('soloPaso que deja otro paso en error devuelve ese paso y su mensaje', async () => {
    const m = await montar();
    m.fallos.set('dos', 1);
    await m.ejecutor.ejecutar(m.s.id, {});
    const r = await m.ejecutor.ejecutar(m.s.id, { soloPaso: 'tres' });
    expect(r).toEqual({ estado: 'error', pasoId: 'dos', mensaje: 'falló dos' });
  });

  it('enmascara secretos y trunca las líneas antes de emitir y guardar', async () => {
    const base = await carpetaTemporal('pel-receta-');
    const eventos = new Eventos<EventosNucleo>();
    const progreso: ProgresoReceta[] = [];
    eventos.on('receta:progreso', (p) => progreso.push(p));
    const larga = 'x'.repeat(10_000);
    const registro = new RegistroPasos({
      comando: (ctx) => {
        ctx.linea('clonando https://yo:Sup3rClave@github.com/a/b.git');
        ctx.linea('mysql -uroot -pSecreto123 tienda');
        ctx.linea(larga);
        return Promise.reject(new Error('DB_PASSWORD=Secreto123 token ghp_abcdefghij1234567890'));
      },
    });
    const ejecutor = new EjecutorRecetas({
      rutas: new Rutas(base),
      eventos,
      pasos: registro,
      sitio: () => sitio(),
      receta: () => Promise.resolve([RECETA[0]!]),
    });
    const r = await ejecutor.ejecutar('tienda-test', {});
    expect(r.mensaje).toBe('DB_PASSWORD=*** token ghp_***');
    const lineas = progreso.flatMap((p) => (p.linea === undefined ? [] : [p.linea]));
    expect(lineas[0]).toBe('clonando https://***@github.com/a/b.git');
    expect(lineas[1]).toBe('mysql -uroot -p*** tienda');
    expect(lineas[2]).toBe('x'.repeat(MAX_BYTES_LINEA) + '…');
    const guardado = await readFile(join(base, 'run', 'receta-tienda-test.json'), 'utf8');
    for (const secreto of ['Sup3rClave', 'Secreto123', 'ghp_abcdefghij']) {
      expect(guardado).not.toContain(secreto);
      expect(JSON.stringify(progreso)).not.toContain(secreto);
    }
  });

  it('una corrida suelta (traer cambios) no reemplaza la receta guardada ni su estado', async () => {
    const m = await montar();
    await m.ejecutor.ejecutar(m.s.id, {});
    const antes = m.ejecutor.estado(m.s.id);
    const archivo = await readFile(m.rutas.receta(m.s.id), 'utf8');
    m.orden.length = 0;
    m.progreso.length = 0;
    const suelta: PasoReceta[] = [{ id: 'dos', tipo: 'comando', titulo: '', args: { n: 9 } }];
    const r = await m.ejecutor.ejecutar(m.s.id, { receta: suelta, suelta: true });
    expect(r.estado).toBe('lista');
    expect(m.orden).toEqual(['dos']);
    expect(m.contextos.at(-1)!.paso.args).toEqual({ n: 9 });
    // Los eventos de la corrida suelta van marcados; el estado y el archivo no cambian.
    expect(m.progreso.length).toBeGreaterThan(0);
    expect(m.progreso.every((p) => p.suelta === true)).toBe(true);
    expect(m.ejecutor.estado(m.s.id)).toEqual(antes);
    expect(await readFile(m.rutas.receta(m.s.id), 'utf8')).toBe(archivo);
    // Reintentar sigue usando la receta guardada completa.
    m.orden.length = 0;
    await m.ejecutor.ejecutar(m.s.id, { desde: 'uno' });
    expect(m.orden).toEqual(['uno', 'dos', 'tres']);
  });

  it('una corrida suelta exige su receta y no se combina con desde/soloPaso', async () => {
    const m = await montar();
    await expect(m.ejecutor.ejecutar(m.s.id, { suelta: true })).rejects.toThrow(/receta/);
    await expect(
      m.ejecutor.ejecutar(m.s.id, { suelta: true, receta: RECETA, desde: 'uno' }),
    ).rejects.toThrow();
  });

  it('"guardada" repite la receta guardada sin args de interfaz y sin restaurar respaldos', async () => {
    const receta: PasoReceta[] = [
      { id: 'uno', tipo: 'comando', titulo: '', args: { n: 1, sobrescribir: true } },
      {
        id: 'bd-restaurar',
        tipo: 'bd-restaurar',
        titulo: '',
        args: { archivo: 'C:/r/x.sql', confirmarSobrescribir: true },
      },
      { id: 'tres', tipo: 'comando', titulo: '', args: { n: 3, semilla: true } },
    ];
    const m = await montar({ receta: RECETA });
    const restaurados: unknown[] = [];
    m.registro.registrar('bd-restaurar', (ctx) => {
      restaurados.push(ctx.paso.args);
      return Promise.resolve();
    });
    await m.ejecutor.ejecutar(m.s.id, { receta });
    expect(restaurados).toHaveLength(1);
    m.orden.length = 0;
    const r = await m.ejecutor.ejecutar(m.s.id, { guardada: true });
    expect(r.estado).toBe('lista');
    expect(m.orden).toEqual(['uno', 'tres']);
    expect(restaurados).toHaveLength(1);
    expect(m.contextos.at(-2)!.paso.args).toEqual({ n: 1 });
    // Los datos de prueba (--seed) no se vuelven a cargar al reinstalar.
    expect(m.contextos.at(-1)!.paso.args).toEqual({ n: 3 });
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      uno: 'listo',
      'bd-restaurar': 'omitido',
      tres: 'listo',
    });
  });

  it('las marcas que deja un paso quedan en su estado, también tras recargar', async () => {
    const receta: PasoReceta[] = [
      { id: 'bd-crear', tipo: 'bd-crear', titulo: '' },
      { id: 'dos', tipo: 'comando', titulo: '' },
    ];
    const m = await montar({ receta });
    m.registro.registrar('bd-crear', (ctx) => {
      ctx.marcar?.('base-creada');
      ctx.marcar?.('base-creada');
      return Promise.resolve();
    });
    await m.ejecutor.ejecutar(m.s.id, {});
    const e = m.ejecutor.estado(m.s.id);
    expect(e.pasos[0]!.marcas).toEqual(['base-creada']);
    expect(e.pasos[1]!.marcas).toEqual([]);
    const otro = await montar({ base: m.base, receta });
    expect(otro.ejecutor.estado(m.s.id).pasos[0]!.marcas).toEqual(['base-creada']);
    // Un paso que se repite empieza sin marcas viejas.
    await m.ejecutor.ejecutar(m.s.id, { soloPaso: 'dos' });
    expect(m.ejecutor.estado(m.s.id).pasos[0]!.marcas).toEqual(['base-creada']);
  });

  it('un paso reintentado recibe sus marcas anteriores en ctx.marcas', async () => {
    const receta: PasoReceta[] = [{ id: 'bd-crear', tipo: 'bd-crear', titulo: '' }];
    const m = await montar({ receta });
    const vistas: (readonly string[] | undefined)[] = [];
    let falla = true;
    m.registro.registrar('bd-crear', (ctx) => {
      vistas.push([...(ctx.marcas ?? [])]);
      ctx.marcar?.('base-creada');
      if (falla) return Promise.reject(new Error('corte'));
      return Promise.resolve();
    });
    await m.ejecutor.ejecutar(m.s.id, {});
    falla = false;
    await m.ejecutor.ejecutar(m.s.id, { soloPaso: 'bd-crear' });
    expect(vistas).toEqual([[], ['base-creada']]);
    expect(m.ejecutor.estado(m.s.id).pasos[0]!.marcas).toEqual(['base-creada']);
  });

  it('la base de un proyecto nuevo (nueva: true) no se puede omitir', async () => {
    const receta: PasoReceta[] = [
      { id: 'bd-crear', tipo: 'bd-crear', titulo: '', args: { nueva: true } },
      { id: 'dos', tipo: 'comando', titulo: '' },
    ];
    const m = await montar({ receta });
    m.registro.registrar('bd-crear', () => Promise.reject(new Error('sin motor')));
    await m.ejecutor.ejecutar(m.s.id, {});
    await expect(m.ejecutor.omitir(m.s.id, 'bd-crear')).rejects.toMatchObject({
      codigo: 'proyectos.paso_base_no_omitible',
    });
    // Un bd-crear normal (sin nueva) sí se omite.
    const n = await montar({ receta: [{ id: 'bd-crear', tipo: 'bd-crear', titulo: '' }] });
    n.registro.registrar('bd-crear', () => Promise.reject(new Error('sin motor')));
    await n.ejecutor.ejecutar(n.s.id, {});
    await expect(n.ejecutor.omitir(n.s.id, 'bd-crear')).resolves.toBeDefined();
  });

  it('"guardada" (Reinstalar) no repite los pasos que crean el proyecto', async () => {
    const receta: PasoReceta[] = [
      { id: 'crear-desde-composer', tipo: 'crear-desde-composer', titulo: '' },
      { id: 'config-bd-crear', tipo: 'config-bd-crear', titulo: '' },
      { id: 'dos', tipo: 'comando', titulo: '' },
    ];
    const m = await montar({ receta });
    const corridos: string[] = [];
    for (const t of ['crear-desde-composer', 'config-bd-crear'] as const) {
      m.registro.registrar(t, () => {
        corridos.push(t);
        return Promise.resolve();
      });
    }
    await m.ejecutor.ejecutar(m.s.id, { receta });
    expect(corridos).toHaveLength(2);
    await m.ejecutor.ejecutar(m.s.id, { guardada: true });
    expect(corridos).toHaveLength(2);
    expect(estadosDe(m.ejecutor.estado(m.s.id))).toEqual({
      'crear-desde-composer': 'omitido',
      'config-bd-crear': 'omitido',
      dos: 'listo',
    });
  });

  it('"guardada" sin receta guardada usa la del proyecto', async () => {
    const m = await montar();
    await m.ejecutor.ejecutar(m.s.id, { guardada: true });
    expect(m.orden).toEqual(['uno', 'dos', 'tres']);
  });

  it('el paso sitio-crear no se puede omitir', async () => {
    const receta: PasoReceta[] = [
      { id: 'uno', tipo: 'comando', titulo: '' },
      { id: 'sitio-crear', tipo: 'sitio-crear', titulo: '' },
    ];
    const m = await montar({ receta });
    m.registro.registrar('sitio-crear', () => Promise.reject(new Error('sin puerto')));
    await m.ejecutor.ejecutar(m.s.id, {});
    await expect(m.ejecutor.omitir(m.s.id, 'sitio-crear')).rejects.toThrow(/no se puede omitir/);
    expect(m.ejecutor.estado(m.s.id).pasos[1]!.estado).toBe('error');
  });

  it('rechaza ids de sitio que no sirven como nombre de archivo', async () => {
    const m = await montar();
    expect(() => m.rutas.receta('../fuera')).toThrow();
    expect(m.rutas.receta('tienda-test')).toBe(join(m.base, 'run', 'receta-tienda-test.json'));
  });
});

/* ───────────── Receta por defecto ───────────── */

const det = (o: Partial<Deteccion> = {}): Deteccion => ({
  tipo: 'laravel',
  php: '8.3',
  node: null,
  python: null,
  servicios: ['mysql'],
  pgvector: false,
  tieneComposer: true,
  tienePackageJson: true,
  scriptsNpm: ['dev', 'build'],
  tieneRequirements: false,
  tienePyproject: false,
  dominioSugerido: 'tienda.test',
  urlBaseVar: 'APP_URL',
  ...o,
});

const tipos = (r: PasoReceta[]) => r.map((p) => p.tipo);

describe('recetaPorDefecto', () => {
  it('Laravel: composer, .env, key, bd, migrar, storage, npm y sitio con https', () => {
    const r = recetaPorDefecto(det());
    expect(tipos(r)).toEqual([
      'composer-install',
      'env-crear',
      'key-generate',
      'bd-crear',
      'migrar',
      'storage-link',
      'npm-ci',
      'npm-build',
      'sitio-crear',
    ]);
    expect(r.at(-1)!.args).toMatchObject({
      tipo: 'laravel',
      dominio: 'tienda.test',
      php: '8.3',
      https: true,
    });
    expect(r.find((p) => p.tipo === 'bd-crear')!.args).toMatchObject({ motor: 'mysql' });
    expect(new Set(r.map((p) => p.id)).size).toBe(r.length);
    expect(r.every((p) => p.titulo.length > 0)).toBe(true);
  });

  it('Laravel sin package.json ni script build omite npm', () => {
    expect(tipos(recetaPorDefecto(det({ tienePackageJson: false, scriptsNpm: [] })))).not.toContain(
      'npm-ci',
    );
    const sinBuild = tipos(recetaPorDefecto(det({ scriptsNpm: ['dev'] })));
    expect(sinBuild).toContain('npm-ci');
    expect(sinBuild).not.toContain('npm-build');
  });

  it('CodeIgniter 3: composer si existe, .env, bd y sitio (restaurar lo agrega el asistente)', () => {
    const r = recetaPorDefecto(det({ tipo: 'codeigniter3', php: null, tienePackageJson: false }));
    expect(tipos(r)).toEqual(['composer-install', 'env-crear', 'bd-crear', 'sitio-crear']);
    const sinComposer = recetaPorDefecto(
      det({ tipo: 'codeigniter3', tieneComposer: false, tienePackageJson: false }),
    );
    expect(tipos(sinComposer)[0]).toBe('env-crear');
  });

  it('CodeIgniter 4: como CI3 más migrar con php spark migrate', () => {
    const r = recetaPorDefecto(det({ tipo: 'codeigniter4', tienePackageJson: false }));
    expect(tipos(r)).toEqual([
      'composer-install',
      'env-crear',
      'bd-crear',
      'migrar',
      'sitio-crear',
    ]);
    // El paso migrar decide spark/artisan por el tipo: la receta no lleva comando.
    expect(r.find((p) => p.tipo === 'migrar')!.args?.comando).toBeUndefined();
  });

  it('FastAPI: venv, pip, .env, bd, pgvector si se detecta y sitio proxy con uvicorn', () => {
    const d = det({
      tipo: 'fastapi',
      php: null,
      servicios: ['postgresql'],
      pgvector: true,
      tieneComposer: false,
      tienePackageJson: false,
      scriptsNpm: [],
      tieneRequirements: true,
      urlBaseVar: null,
    });
    const r = recetaPorDefecto(d);
    expect(tipos(r)).toEqual([
      'python-venv',
      'pip-install',
      'env-crear',
      'bd-crear',
      'pgvector-activar',
      'sitio-crear',
    ]);
    const sitioCrear = r.at(-1)!.args as {
      tipo: string;
      https: boolean;
      procesos: { id: string; comando: string[]; autoIniciar: boolean }[];
    };
    expect(sitioCrear.tipo).toBe('fastapi');
    expect(sitioCrear.https).toBe(true);
    expect(sitioCrear.procesos).toHaveLength(1);
    expect(sitioCrear.procesos[0]!.id).toBe('uvicorn');
    expect(sitioCrear.procesos[0]!.comando).toContain('uvicorn');
    expect(sitioCrear.procesos[0]!.comando).toContain('{puerto}');
    expect(tipos(recetaPorDefecto({ ...d, pgvector: false }))).not.toContain('pgvector-activar');
  });

  it('ninguna receta por defecto restaura un respaldo', () => {
    for (const tipo of ['laravel', 'codeigniter3', 'codeigniter4', 'fastapi'] as const) {
      expect(tipos(recetaPorDefecto(det({ tipo })))).not.toContain('bd-restaurar');
    }
  });

  it('sin base de datos detectada no agrega bd-crear', () => {
    expect(tipos(recetaPorDefecto(det({ servicios: [] })))).not.toContain('bd-crear');
  });

  it('Node y estático: dependencias si las hay y el sitio', () => {
    expect(tipos(recetaPorDefecto(det({ tipo: 'node', php: null, tieneComposer: false })))).toEqual(
      ['npm-ci', 'npm-build', 'sitio-crear'],
    );
    expect(
      tipos(
        recetaPorDefecto(
          det({
            tipo: 'estatico',
            php: null,
            tieneComposer: false,
            tienePackageJson: false,
            scriptsNpm: [],
            servicios: [],
          }),
        ),
      ),
    ).toEqual(['sitio-crear']);
  });
});

describe('recetaEfectiva', () => {
  it('usa la receta de wolfcore.yml si la tiene', async () => {
    const dir = await carpetaTemporal('pel-receta-yml-');
    await writeFile(
      join(dir, 'wolfcore.yml'),
      ['receta:', '  - id: solo', '    tipo: comando', '    titulo: Solo uno', ''].join('\n'),
    );
    const r = await recetaEfectiva(dir, det());
    expect(r).toEqual([{ id: 'solo', tipo: 'comando', titulo: 'Solo uno' }]);
  });

  it('sin wolfcore.yml, o con receta vacía, usa la receta por defecto', async () => {
    const dir = await carpetaTemporal('pel-receta-yml-');
    expect(await recetaEfectiva(dir, det())).toEqual(recetaPorDefecto(det()));
    await writeFile(join(dir, 'wolfcore.yml'), 'php: "8.4"\n');
    expect(await recetaEfectiva(dir, det())).toEqual(recetaPorDefecto(det()));
  });

  it('un wolfcore.yml no válido da error en claro', async () => {
    const dir = await carpetaTemporal('pel-receta-yml-');
    await writeFile(join(dir, 'wolfcore.yml'), 'receta: [ {id: a, tipo: nada, titulo: x} ]\n');
    await expect(recetaEfectiva(dir, det())).rejects.toThrow('wolfcore.yml no es válido');
  });
});

describe('sanear', () => {
  it('enmascara credenciales, contraseñas y tokens', () => {
    expect(sanear('git clone https://usuario:clave@host/x')).toBe('git clone https://***@host/x');
    expect(sanear('postgresql://u:p@127.0.0.1:5432/db')).toBe('postgresql://***@127.0.0.1:5432/db');
    expect(sanear('password=abc otra')).toBe('password=*** otra');
    expect(sanear('PASSWORD="a b c"')).toBe('PASSWORD=***');
    expect(sanear('mysqldump --password=abc base')).toBe('mysqldump --password=*** base');
    expect(sanear('mysql -h 127.0.0.1 -pclave')).toBe('mysql -h 127.0.0.1 -p***');
    expect(sanear('token gho_ABCDEFGHIJ1234567890 fin')).toBe('token gho_*** fin');
    expect(sanear('github_pat_11ABCDEFG_abcdefghijklmnop')).toBe('github_pat_***');
  });

  it('no toca texto normal', () => {
    for (const t of ['npm ci', 'php artisan migrate --force', 'https://github.com/a/b', '-p 80']) {
      expect(sanear(t)).toBe(t);
    }
  });

  it('trunca a 4 KB con "…"', () => {
    expect(MAX_BYTES_LINEA).toBe(4096);
    expect(sanear('a'.repeat(5000))).toBe('a'.repeat(4096) + '…');
    expect(sanear('a'.repeat(4096))).toBe('a'.repeat(4096));
  });
});

describe('args.carpeta de un paso (QA 2)', () => {
  it('el paso corre en la subcarpeta; fuera del proyecto falla', async () => {
    const m = await montar({
      receta: [
        { id: 'uno', tipo: 'comando', titulo: 'Uno', args: { carpeta: 'admin' } },
        { id: 'dos', tipo: 'comando', titulo: 'Dos', args: { carpeta: '../fuera' } },
      ],
    });
    const r = await m.ejecutor.ejecutar(m.s.id, {});
    expect(m.contextos[0]!.carpeta).toBe(join(m.s.carpeta, 'admin'));
    expect(r.estado).toBe('error');
    expect(m.ejecutor.estado(m.s.id).pasos[1]!.estado).toBe('error');
    expect(m.contextos).toHaveLength(1);
  });
});
