import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf } from '../src/errores';
import type { ConfigProyecto } from '../src/proyectos/config';
import { huellaTarea } from '../src/tareas/comando';
import { GestorTareas } from '../src/tareas/gestor';
import type { Programador } from '../src/tareas/programador';
import { ConfigSchema, SitioSchema, type Config } from '../src/tipos';

const COMANDO = ['php', 'artisan', 'schedule:run'];

function armar(yml: Partial<ConfigProyecto> | null = null) {
  let cfg: Config = ConfigSchema.parse({
    sitios: [
      SitioSchema.parse({
        id: 'tienda',
        nombre: 'Tienda',
        dominio: 'tienda.test',
        carpeta: 'C:\\sitios\\tienda',
        tipo: 'laravel',
        confiado: true,
      }),
    ],
  });
  let archivoYml: ConfigProyecto | null = yml
    ? ({
        version: 1,
        tipo: null,
        dominio: null,
        php: null,
        node: null,
        python: null,
        servicios: [],
        env: {},
        receta: [],
        procesos: [],
        tareas: [],
        ...yml,
      } as ConfigProyecto)
    : null;
  const olvidar = vi.fn(async () => undefined);
  const g = new GestorTareas({
    leerSitios: async () => cfg.sitios,
    modificarConfig: async (fn) => {
      // Como el almacén: se trabaja sobre una copia y solo se guarda si no lanzó.
      const copia = structuredClone(cfg);
      fn(copia);
      cfg = copia;
    },
    programador: { olvidar, historialDe: async () => [] } as unknown as Programador,
    leerYml: async () => archivoYml,
    escribirYml: async (_c, c) => {
      archivoYml = c;
    },
  });
  return {
    g,
    olvidar,
    tareas: () => cfg.sitios[0]!.tareas ?? [],
    yml: () => archivoYml,
    ponerTarea: (t: unknown) => {
      cfg.sitios[0]!.tareas = [...(cfg.sitios[0]!.tareas ?? []), t as never];
    },
  };
}

const entrada = (o: Record<string, unknown> = {}) => ({
  nombre: 'Schedule',
  cron: '*/5 * * * *',
  comando: COMANDO,
  activa: true,
  ...o,
});

describe('GestorTareas: guardar', () => {
  let a: ReturnType<typeof armar>;
  beforeEach(() => {
    a = armar();
  });

  it('crea la tarea ya confirmada con la huella de su comando', async () => {
    const t = await a.g.guardar('tienda', entrada());
    expect(t).toMatchObject({
      nombre: 'Schedule',
      cron: '*/5 * * * *',
      comando: COMANDO,
      activa: true,
      confirmada: huellaTarea(COMANDO),
      origen: 'usuario',
      tiempoMaxS: 300,
    });
    expect(t.id).toMatch(/^t_[0-9a-f]{8}$/);
    expect(a.tareas()).toHaveLength(1);
  });

  it('editar el comando vuelve a confirmar el nuevo, no el viejo', async () => {
    const t = await a.g.guardar('tienda', entrada());
    const nueva = await a.g.guardar(
      'tienda',
      entrada({ id: t.id, comando: ['php', 'artisan', 'queue:work', '--stop-when-empty'] }),
    );
    expect(nueva.id).toBe(t.id);
    expect(nueva.confirmada).toBe(huellaTarea(nueva.comando));
    expect(nueva.confirmada).not.toBe(t.confirmada);
    expect(a.tareas()).toHaveLength(1);
  });

  it('valida el cron, el comando y los campos de más con su código', async () => {
    const cod = async (e: unknown): Promise<string> => {
      try {
        await a.g.guardar('tienda', e);
      } catch (x) {
        return (x as ErrorWolf).codigo;
      }
      return 'sin error';
    };
    expect(await cod(entrada({ cron: '* * * *' }))).toBe('tareas.cron_invalida');
    expect(await cod(entrada({ cron: '*/0 * * * *' }))).toBe('tareas.cron_invalida');
    expect(await cod(entrada({ comando: ['curl', 'x'] }))).toBe('tareas.comando_invalido');
    expect(await cod(entrada({ comando: ['php', '-r', 'system("x");'] }))).toBe(
      'tareas.comando_invalido',
    );
    expect(await cod(entrada({ comando: [] }))).toBe('tareas.invalida');
    expect(await cod(entrada({ confirmada: 'a'.repeat(64) }))).toBe('tareas.invalida');
    expect(await cod(entrada({ nombre: '' }))).toBe('tareas.invalida');
    expect(await cod(entrada({ id: '../x' }))).toBe('tareas.invalida');
    expect(await cod(entrada({ tiempoMaxS: 1 }))).toBe('tareas.invalida');
    expect(await cod(entrada({ tiempoMaxS: 99999 }))).toBe('tareas.invalida');
    expect(await cod(null)).toBe('tareas.invalida');
    expect(a.tareas()).toHaveLength(0);
  });

  it('un sitio que no existe o una tarea que no existe dan su error', async () => {
    await expect(a.g.guardar('nada', entrada())).rejects.toMatchObject({
      codigo: 'proyectos.no_existe',
    });
    await expect(a.g.guardar('tienda', entrada({ id: 'fantasma' }))).rejects.toMatchObject({
      codigo: 'tareas.no_existe',
    });
  });

  it('tiene un tope de tareas por sitio', async () => {
    for (let i = 0; i < 50; i++) await a.g.guardar('tienda', entrada({ nombre: `t${i}` }));
    await expect(a.g.guardar('tienda', entrada())).rejects.toMatchObject({
      codigo: 'tareas.demasiadas',
    });
  });
});

describe('GestorTareas: confirmar, activar y borrar', () => {
  it('confirma una tarea sin confirmar solo con la huella del comando que se vio', async () => {
    const a = armar();
    a.ponerTarea({
      id: 'manual',
      nombre: 'A mano',
      cron: '0 3 * * *',
      comando: COMANDO,
      activa: true,
      confirmada: null,
      tiempoMaxS: 300,
      origen: 'usuario',
    });
    await expect(
      a.g.confirmar('tienda', 'manual', huellaTarea(['php', 'otra.php'])),
    ).rejects.toMatchObject({
      codigo: 'tareas.invalida',
    });
    expect(a.tareas()[0]!.confirmada).toBeNull();
    const t = await a.g.confirmar('tienda', 'manual', huellaTarea(COMANDO));
    expect(t.confirmada).toBe(huellaTarea(COMANDO));
  });

  it('no confirma un comando que no pasa la lista cerrada', async () => {
    const a = armar();
    a.ponerTarea({
      id: 'mala',
      nombre: 'Mala',
      cron: '0 3 * * *',
      comando: ['powershell', '-c', 'x'],
      activa: true,
      confirmada: null,
      tiempoMaxS: 300,
      origen: 'usuario',
    });
    await expect(
      a.g.confirmar('tienda', 'mala', huellaTarea(['powershell', '-c', 'x'])),
    ).rejects.toMatchObject({ codigo: 'tareas.comando_invalido' });
  });

  it('pausar y reanudar no tocan la confirmación', async () => {
    const a = armar();
    const t = await a.g.guardar('tienda', entrada());
    const p = await a.g.activar('tienda', t.id, false);
    expect(p).toMatchObject({ activa: false, confirmada: t.confirmada });
    expect((await a.g.activar('tienda', t.id, true)).activa).toBe(true);
  });

  it('borrar quita la tarea y su historial', async () => {
    const a = armar();
    const t = await a.g.guardar('tienda', entrada());
    await a.g.borrar('tienda', t.id);
    expect(a.tareas()).toHaveLength(0);
    expect(a.olvidar).toHaveBeenCalledWith('tienda', t.id);
  });
});

describe('GestorTareas: wolfcore.yml', () => {
  const yml = {
    tareas: [
      { id: 'schedule', nombre: 'Schedule', cron: '* * * * *', comando: COMANDO },
      { id: 'mala', nombre: 'Mala', cron: '* * * * *', comando: ['bash', '-c', 'rm -rf /'] },
      { id: 'cron_mal', nombre: 'Cron mal', cron: '99 * * * *', comando: COMANDO },
    ],
  } as Partial<ConfigProyecto>;

  it('las propuestas solo se leen: nada se guarda ni se ejecuta', async () => {
    const a = armar(yml);
    const p = await a.g.propuestas('tienda');
    expect(p.map((x) => [x.id, x.estado, x.error])).toEqual([
      ['schedule', 'nueva', undefined],
      ['mala', 'nueva', 'tareas.comando_invalido'],
      ['cron_mal', 'nueva', 'tareas.cron_invalida'],
    ]);
    expect(p[0]!.huella).toBe(huellaTarea(COMANDO));
    expect(a.tareas()).toHaveLength(0);
  });

  it('adoptar exige la huella que vio el usuario', async () => {
    const a = armar(yml);
    await expect(a.g.adoptar('tienda', 'schedule', 'f'.repeat(64), true)).rejects.toMatchObject({
      codigo: 'tareas.invalida',
    });
    expect(a.tareas()).toHaveLength(0);
    const t = await a.g.adoptar('tienda', 'schedule', huellaTarea(COMANDO), false);
    expect(t).toMatchObject({
      id: 'schedule',
      origen: 'wolfcore.yml',
      activa: false,
      confirmada: huellaTarea(COMANDO),
    });
    expect((await a.g.propuestas('tienda'))[0]!.estado).toBe('adoptada');
  });

  it('no adopta una propuesta con comando o cron inválidos', async () => {
    const a = armar(yml);
    await expect(
      a.g.adoptar('tienda', 'mala', huellaTarea(['bash', '-c', 'rm -rf /']), true),
    ).rejects.toMatchObject({ codigo: 'tareas.comando_invalido' });
    await expect(
      a.g.adoptar('tienda', 'cron_mal', huellaTarea(COMANDO), true),
    ).rejects.toMatchObject({
      codigo: 'tareas.cron_invalida',
    });
    expect(a.tareas()).toHaveLength(0);
  });

  it('si wolfcore.yml cambia el comando después de adoptar, la tarea del sitio no cambia y se avisa', async () => {
    const a = armar(yml);
    await a.g.adoptar('tienda', 'schedule', huellaTarea(COMANDO), true);
    a.yml()!.tareas[0]!.comando = ['php', 'artisan', 'migrate:fresh', '--force'];
    // La tarea del sitio sigue con el comando que se confirmó.
    expect(a.tareas()[0]!.comando).toEqual(COMANDO);
    expect((await a.g.propuestas('tienda'))[0]!.estado).toBe('cambiada');
  });

  it('una tarea que ya no está en wolfcore.yml no se puede adoptar', async () => {
    const a = armar(yml);
    await expect(
      a.g.adoptar('tienda', 'fantasma', huellaTarea(COMANDO), true),
    ).rejects.toMatchObject({
      codigo: 'tareas.no_existe',
    });
  });

  it('a pedido, la tarea se escribe en wolfcore.yml sin perder lo demás', async () => {
    const a = armar(yml);
    const t = await a.g.guardar('tienda', entrada({ nombre: 'Mía' }));
    await a.g.aWolfcoreYml('tienda', t.id);
    const escrito = a.yml()!.tareas;
    expect(escrito).toHaveLength(4);
    expect(escrito.find((x) => x.id === t.id)).toEqual({
      id: t.id,
      nombre: 'Mía',
      cron: '*/5 * * * *',
      comando: COMANDO,
      tiempoMaxS: 300,
    });
    // Sin `confirmada` ni `activa`: el archivo solo propone.
    expect(JSON.stringify(escrito)).not.toContain('confirmada');
  });
});

describe('GestorTareas: vista previa del cron', () => {
  it('da las próximas ejecuciones en orden y rechaza lo inválido', () => {
    const { g } = armar();
    const p = g.proximas('*/15 * * * *', 3, new Date(Date.UTC(2026, 4, 10, 10, 0, 30)));
    expect(p).toHaveLength(3);
    expect(p.map((x) => new Date(x).getTime())).toEqual(
      [...p].map((x) => new Date(x).getTime()).sort((a, b) => a - b),
    );
    expect(() => g.proximas('nada')).toThrow(ErrorWolf);
  });
});

describe('esquema del sitio: lista de tareas tolerante', () => {
  const base = { id: 'x', nombre: 'X', dominio: 'x.test', carpeta: 'C:/x', tipo: 'estatico' };
  const buena = {
    id: 'uno',
    nombre: 'Uno',
    cron: '* * * * *',
    comando: COMANDO,
    activa: true,
    confirmada: huellaTarea(COMANDO),
  };

  it('una tarea mal formada, repetida o con campos de más se descarta sin romper el sitio', () => {
    const s = SitioSchema.parse({
      ...base,
      tareas: [
        buena,
        { ...buena, id: 'uno' },
        { ...buena, id: 'dos', extra: 1 },
        { ...buena, id: '../x' },
        { ...buena, id: 'tres', comando: [] },
        { ...buena, id: 'cuatro', confirmada: 'no-es-una-huella' },
        'basura',
        null,
      ],
    });
    expect(s.tareas?.map((t) => t.id)).toEqual(['uno']);
    expect(s.tareas?.[0]).toMatchObject({ tiempoMaxS: 300, origen: 'usuario' });
  });

  it('sin tareas queda ausente (los sitios de antes no cambian) y una lista rota no corrompe', () => {
    expect(SitioSchema.parse(base).tareas).toBeUndefined();
    expect(SitioSchema.parse({ ...base, tareas: 'roto' }).tareas).toEqual([]);
  });

  it('una tarea sin confirmar por defecto: nunca viene confirmada de la nada', () => {
    const { confirmada: _c, ...sinConfirmar } = buena;
    void _c;
    const s = SitioSchema.parse({ ...base, tareas: [sinConfirmar] });
    expect(s.tareas?.[0]?.confirmada).toBeNull();
  });
});
