import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { Lanzador } from '../src/plataforma/tipos';
import { huellaTarea } from '../src/tareas/comando';
import { ConfigSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

const COMANDO = ['php', 'artisan', 'schedule:run'];

async function crear(
  o: { aislado?: boolean; confiado?: boolean } = {},
): Promise<{ n: Nucleo; carpeta: string; lanzar: ReturnType<typeof vi.fn> }> {
  const dir = await carpetaTemporal('pel-tareas-nuc-');
  const base = path.join(dir, 'datos');
  const carpeta = path.join(dir, 'tienda');
  await mkdir(base, { recursive: true });
  await mkdir(carpeta, { recursive: true });
  const cfg = ConfigSchema.parse({
    sitios: [
      SitioSchema.parse({
        id: 'tienda',
        nombre: 'Tienda',
        dominio: 'tienda.test',
        carpeta,
        tipo: 'estatico',
      }),
    ],
  });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(cfg, null, 2));
  const lanzar = vi.fn<Lanzador>(async () => ({ codigo: 0 }));
  nucleo = await Nucleo.crear({
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
    lanzar,
    ...(o.aislado ? { aislado: true } : {}),
  });
  if (o.confiado !== false) await nucleo.confiarReceta('tienda');
  return { n: nucleo, carpeta, lanzar };
}

const entrada = (o: Record<string, unknown> = {}) => ({
  nombre: 'Schedule',
  cron: '* * * * *',
  comando: COMANDO,
  activa: true,
  ...o,
});

describe('Nucleo: tareas programadas (D29)', () => {
  it('guardar el sitio nunca cambia sus tareas ni acepta una confirmada de antemano', async () => {
    const { n } = await crear();
    const t = await n.tareas.guardar('tienda', entrada());
    const sitio = (await n.config.leer()).sitios[0]!;
    const { id: _id, ...datos } = sitio;
    void _id;
    // Intento de colar una tarea ya confirmada y borrar la existente.
    await n.guardarSitio(
      {
        ...datos,
        tareas: [
          {
            id: 'colada',
            nombre: 'Colada',
            cron: '* * * * *',
            comando: ['php', 'malo.php'],
            activa: true,
            confirmada: huellaTarea(['php', 'malo.php']),
            tiempoMaxS: 300,
            origen: 'usuario',
          },
        ],
      },
      'tienda',
    );
    const despues = (await n.config.leer()).sitios[0]!;
    expect(despues.tareas?.map((x) => x.id)).toEqual([t.id]);
    // Y sobrevive a un guardado sin tareas (el formulario del sitio no las lleva).
    await n.guardarSitio({ ...datos, tareas: [] }, 'tienda');
    expect((await n.config.leer()).sitios[0]!.tareas?.map((x) => x.id)).toEqual([t.id]);
  });

  it('en un sitio confiado ejecuta (si no hay PHP, falla con aviso y sin lanzar nada)', async () => {
    const { n, lanzar } = await crear();
    const t = await n.tareas.guardar('tienda', entrada());
    const e = await n.programador.ejecutarAhora('tienda', t.id);
    // Pasó todas las puertas; sin PHP instalado en la prueba el programa no se pudo lanzar.
    expect(e).toMatchObject({ estado: 'fallo', motivo: 'error', origen: 'manual' });
    expect(lanzar).not.toHaveBeenCalled();
    expect((await n.programador.leerLog('tienda', t.id)).join('\n')).toMatch(/PHP/);
    expect(n.avisos.lista().some((a) => a.codigo === 'avisos.tarea_fallo')).toBe(true);
    expect((await n.programador.historialDe('tienda', t.id))[0]).toMatchObject({ estado: 'fallo' });
  });

  it('en un sitio no confiado no se ejecuta', async () => {
    const { n } = await crear({ confiado: false });
    const t = await n.tareas.guardar('tienda', entrada());
    await expect(n.programador.ejecutarAhora('tienda', t.id)).rejects.toMatchObject({
      codigo: 'tareas.sitio_no_confiado',
    });
  });

  it('si la receta del repositorio cambia después de confiar, no se ejecuta', async () => {
    const { n, carpeta } = await crear();
    const t = await n.tareas.guardar('tienda', entrada());
    expect((await n.programador.vista('tienda'))[0]!.bloqueo).toBeNull();
    await writeFile(
      path.join(carpeta, 'wolfcore.yml'),
      [
        'version: 1',
        'receta:',
        '  - id: otra',
        '    tipo: comando',
        '    titulo: Otra',
        '    args:',
        '      comando: [php, artisan, algo]',
        '',
      ].join('\n'),
    );
    await expect(n.programador.ejecutarAhora('tienda', t.id)).rejects.toMatchObject({
      codigo: 'tareas.receta_cambio',
    });
    expect((await n.programador.vista('tienda'))[0]!.bloqueo).toBe('receta_cambio');
    // Volver a confiar toma la huella nueva y la tarea vuelve a poder correr.
    await n.confiarReceta('tienda');
    expect((await n.programador.vista('tienda'))[0]!.bloqueo).toBeNull();
  });

  it('una tarea que llegó a config.json sin confirmar no corre hasta que el usuario la confirma', async () => {
    const { n } = await crear();
    await n.sitios.modificarConfig((c) => {
      c.sitios[0]!.tareas = [
        {
          id: 'manual',
          nombre: 'A mano',
          cron: '* * * * *',
          comando: COMANDO,
          activa: true,
          confirmada: null,
          tiempoMaxS: 300,
          origen: 'usuario',
        },
      ];
    });
    await expect(n.programador.ejecutarAhora('tienda', 'manual')).rejects.toMatchObject({
      codigo: 'tareas.sin_confirmar',
    });
    await n.tareas.confirmar('tienda', 'manual', huellaTarea(COMANDO));
    expect((await n.programador.vista('tienda'))[0]!.bloqueo).toBeNull();
  });

  it('con WOLFCORE_DATOS no corre ninguna tarea hasta que el usuario lo permite', async () => {
    const { n } = await crear({ aislado: true });
    expect(n.programador.estado()).toMatchObject({ aislado: true, permitido: false });
    const t = await n.tareas.guardar('tienda', entrada());
    await expect(n.programador.ejecutarAhora('tienda', t.id)).rejects.toMatchObject({
      codigo: 'tareas.aislado',
    });
    n.programador.permitirAislado();
    const e = await n.programador.ejecutarAhora('tienda', t.id);
    expect(e.estado).toBe('fallo');
  });

  it('el planificador está en marcha con la app abierta y se detiene al cerrarla', async () => {
    const { n } = await crear();
    expect(n.programador.estado().corriendo).toBe(true);
    await n.cerrar({ detenerServicios: false });
    expect(n.programador.estado().corriendo).toBe(false);
    nucleo = null;
  });

  it('un error de la puerta es un ErrorWolf con código estable', async () => {
    const { n } = await crear();
    await expect(n.programador.ejecutarAhora('tienda', 'no-existe')).rejects.toBeInstanceOf(
      ErrorWolf,
    );
  });

  it('cambiar la carpeta o la confianza del sitio aborta sus ejecuciones; otra carpeta invalida lo confirmado', async () => {
    const { n } = await crear();
    const t = await n.tareas.guardar('tienda', entrada());
    const abortar = vi.spyOn(n.programador, 'abortarSitio');
    const { id: _id, ...datos } = (await n.config.leer()).sitios[0]!;
    void _id;
    // Mismo sitio sin cambios de carpeta ni de confianza: no aborta.
    await n.guardarSitio({ ...datos, nota: 'x' }, 'tienda');
    expect(abortar).not.toHaveBeenCalled();
    expect((await n.config.leer()).sitios[0]!.tareas![0]!.confirmada).toBe(t.confirmada);
    // Deja de ser de confianza: aborta.
    await n.guardarSitio({ ...datos, confiado: false }, 'tienda');
    expect(abortar).toHaveBeenCalledWith('tienda');
    // Otra carpeta: lo confirmado ya no vale.
    const otra = path.join(path.dirname(datos.carpeta), 'otra');
    await mkdir(otra, { recursive: true });
    abortar.mockClear();
    await n.guardarSitio({ ...datos, carpeta: otra, confiado: true }, 'tienda');
    expect(abortar).toHaveBeenCalledWith('tienda');
    const despues = (await n.config.leer()).sitios[0]!.tareas![0]!;
    expect(despues.confirmada).toBeNull();
    expect(despues.comando).toEqual(COMANDO);
  });

  it('borrar el sitio aborta lo que corre y purga su historial y registros', async () => {
    const { n } = await crear();
    const t = await n.tareas.guardar('tienda', entrada());
    await n.programador.ejecutarAhora('tienda', t.id);
    expect((await n.programador.historialDe('tienda', t.id)).length).toBeGreaterThan(0);
    const abortar = vi.spyOn(n.programador, 'abortarSitio');
    await n.borrarSitio('tienda');
    expect(abortar).toHaveBeenCalledWith('tienda');
    await vi.waitFor(async () =>
      expect(await n.programador.historialDe('tienda', t.id)).toEqual([]),
    );
  });
});
