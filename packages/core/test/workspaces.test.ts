import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  claveElemento,
  Workspaces,
  type PuertoWorkspaces,
  type ResultadoWorkspace,
} from '../src/workspaces/workspaces';
import { ConfigSchema, type Config, type ElementoWorkspace, type Workspace } from '../src/tipos';

const pg: ElementoWorkspace = { tipo: 'instancia', id: 'postgresql@17' };
const redis: ElementoWorkspace = { tipo: 'instancia', id: 'redis@actual' };
const ollama: ElementoWorkspace = { tipo: 'servicio', id: 'ollama' };
const nginx: ElementoWorkspace = { tipo: 'servicio', id: 'nginx' };
const php: ElementoWorkspace = { tipo: 'servicio', id: 'php' };
const mailpit: ElementoWorkspace = { tipo: 'servicio', id: 'mailpit' };
const smtp4dev: ElementoWorkspace = { tipo: 'servicio', id: 'smtp4dev' };
const uvicorn: ElementoWorkspace = { tipo: 'proceso', sitioId: 'bot', procesoId: 'uvicorn' };

const k = claveElemento;

/** Puerto falso: registra el orden de las operaciones y deja fallar elementos concretos. */
class PuertoFalso implements PuertoWorkspaces {
  encendidos = new Set<string>();
  inexistentes = new Set<string>();
  falla = new Map<string, Error>();
  /** Grupo exclusivo: los captadores. */
  grupo = new Set([k(mailpit), k(smtp4dev)]);
  orden: string[] = [];

  async existe(e: ElementoWorkspace): Promise<boolean> {
    return !this.inexistentes.has(k(e));
  }
  async encendido(e: ElementoWorkspace): Promise<boolean> {
    return this.encendidos.has(k(e));
  }
  async encendidosExclusivos(e: ElementoWorkspace): Promise<ElementoWorkspace[]> {
    if (!this.grupo.has(k(e))) return [];
    return [mailpit, smtp4dev].filter((o) => k(o) !== k(e) && this.encendidos.has(k(o)));
  }
  async iniciar(e: ElementoWorkspace): Promise<void> {
    this.orden.push(`+${k(e)}`);
    const f = this.falla.get(k(e));
    if (f) throw f;
    if (this.grupo.has(k(e))) {
      for (const o of this.grupo) this.encendidos.delete(o);
    }
    this.encendidos.add(k(e));
  }
  async detener(e: ElementoWorkspace): Promise<void> {
    this.orden.push(`-${k(e)}`);
    const f = this.falla.get(k(e));
    if (f) throw f;
    this.encendidos.delete(k(e));
  }
}

let cfg: Config;
let puerto: PuertoFalso;
let ws: Workspaces;
let avisos: unknown[];

const w = (id: string, elementos: ElementoWorkspace[]): Workspace => ({
  id,
  nombre: `Nombre ${id}`,
  elementos,
});

beforeEach(() => {
  cfg = ConfigSchema.parse({});
  puerto = new PuertoFalso();
  avisos = [];
  ws = new Workspaces({
    leerConfig: async () => structuredClone(cfg),
    modificarConfig: async (fn) => {
      fn(cfg);
    },
    puerto,
    avisar: (a) => avisos.push(a),
  });
});

const por = (r: ResultadoWorkspace[], e: ElementoWorkspace): ResultadoWorkspace =>
  r.find((x) => x.elemento === k(e))!;

describe('workspaces: guardar y listar', () => {
  it('guarda, lista y borra', async () => {
    await ws.guardar(w('bot-fastapi', [pg, redis, ollama, uvicorn]));
    expect((await ws.lista()).map((x) => x.id)).toEqual(['bot-fastapi']);
    await ws.guardar({ ...w('bot-fastapi', [pg]), nombre: 'Bot FastAPI' });
    const lista = await ws.lista();
    expect(lista).toHaveLength(1);
    expect(lista[0]!.nombre).toBe('Bot FastAPI');
    await ws.borrar('bot-fastapi');
    expect(await ws.lista()).toEqual([]);
  });

  it('rechaza un workspace con un campo ejecutable de más', async () => {
    const malo = {
      id: 'x',
      nombre: 'X',
      elementos: [{ tipo: 'proceso', sitioId: 'a', procesoId: 'b', comando: ['rm', '-rf', '/'] }],
    };
    await expect(ws.guardar(malo as unknown as Workspace)).rejects.toMatchObject({
      codigo: 'workspaces.invalido',
    });
    await expect(
      ws.guardar({ id: 'X MAYUS', nombre: 'a', elementos: [] } as Workspace),
    ).rejects.toMatchObject({ codigo: 'workspaces.invalido' });
  });

  it('quita elementos repetidos', async () => {
    await ws.guardar(w('a', [pg, pg, redis]));
    expect((await ws.lista())[0]!.elementos).toEqual([pg, redis]);
  });

  it('no admite dos captadores de correo (grupo exclusivo)', async () => {
    await expect(ws.guardar(w('a', [mailpit, smtp4dev]))).rejects.toMatchObject({
      codigo: 'workspaces.captadores_exclusivos',
    });
    await ws.guardar(w('a', [mailpit]));
  });

  it('un config con un workspace mal formado lo descarta sin invalidar el resto', () => {
    const c = ConfigSchema.parse({
      workspaces: [w('bueno', [pg]), { id: 'malo', nombre: '', elementos: 3 }, w('bueno', [])],
    });
    expect(c.workspaces.map((x) => x.id)).toEqual(['bueno']);
  });
});

describe('workspaces: iniciar', () => {
  it('enciende datos, luego servicios web (PHP y Nginx) y al final los procesos', async () => {
    await ws.guardar(w('a', [uvicorn, nginx, ollama, php, pg, redis]));
    const r = await ws.iniciar('a');
    expect(puerto.orden).toEqual([
      `+${k(ollama)}`,
      `+${k(pg)}`,
      `+${k(redis)}`,
      `+${k(php)}`,
      `+${k(nginx)}`,
      `+${k(uvicorn)}`,
    ]);
    expect(r.every((x) => x.ok && x.encendido)).toBe(true);
    expect(await ws.estado('a')).toBe('encendido');
  });

  it('un fallo no corta el resto y dice qué quedó encendido y qué no', async () => {
    puerto.falla.set(k(redis), new Error('puerto 6379 ocupado'));
    await ws.guardar(w('a', [pg, redis, ollama, uvicorn]));
    const r = await ws.iniciar('a');
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: true });
    expect(por(r, ollama)).toMatchObject({ ok: true, encendido: true });
    expect(por(r, uvicorn)).toMatchObject({ ok: true, encendido: true });
    expect(por(r, redis)).toMatchObject({
      ok: false,
      encendido: false,
      codigo: 'workspaces.elemento_fallo',
    });
    expect(por(r, redis).detalle).toContain('6379');
    expect(await ws.estado('a')).toBe('parcial');
    // El fallo también se publica como aviso (desde la bandeja no hay otra forma de verlo).
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ codigo: 'avisos.workspace_fallos' });
  });

  it('conserva el código de un ErrorWolf (p. ej. un proceso sin confianza)', async () => {
    puerto.falla.set(
      k(uvicorn),
      new ErrorWolf('proyectos.no_confiado', 'Marque "Confío en este repositorio"'),
    );
    await ws.guardar(w('a', [pg, uvicorn]));
    const r = await ws.iniciar('a');
    expect(por(r, uvicorn)).toMatchObject({
      ok: false,
      encendido: false,
      codigo: 'proyectos.no_confiado',
    });
    expect(por(r, pg).ok).toBe(true);
  });

  it('un elemento que ya no existe se ignora con aviso, no es un error', async () => {
    puerto.inexistentes.add(k(pg));
    await ws.guardar(w('a', [pg, redis]));
    const r = await ws.iniciar('a');
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: false, aviso: 'no_existe' });
    expect(puerto.orden).toEqual([`+${k(redis)}`]);
    expect(avisos).toEqual([]);
    expect(await ws.estado('a')).toBe('encendido');
  });

  it('lo que ya está encendido no se vuelve a arrancar', async () => {
    puerto.encendidos.add(k(pg));
    await ws.guardar(w('a', [pg, redis]));
    const r = await ws.iniciar('a');
    expect(puerto.orden).toEqual([`+${k(redis)}`]);
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: true, aviso: 'ya_encendido' });
  });

  it('un workspace inexistente falla con código', async () => {
    await expect(ws.iniciar('nada')).rejects.toMatchObject({ codigo: 'workspaces.no_existe' });
  });

  it('respeta el grupo exclusivo: reemplaza el captador que nadie usa y lo informa', async () => {
    puerto.encendidos.add(k(smtp4dev));
    await ws.guardar(w('a', [mailpit]));
    const r = await ws.iniciar('a');
    expect(por(r, mailpit)).toMatchObject({ ok: true, encendido: true });
    expect(por(r, mailpit).aviso).toBe(`reemplaza:${k(smtp4dev)}`);
    expect(puerto.encendidos.has(k(smtp4dev))).toBe(false);
  });

  it('no apaga un captador que usa otro workspace encendido', async () => {
    await ws.guardar(w('a', [smtp4dev]));
    await ws.guardar(w('b', [mailpit]));
    await ws.iniciar('a');
    const r = await ws.iniciar('b');
    expect(por(r, mailpit)).toMatchObject({
      ok: false,
      encendido: false,
      codigo: 'workspaces.captadores_exclusivos',
    });
    expect(puerto.encendidos.has(k(smtp4dev))).toBe(true);
  });

  it('dos inicios seguidos del mismo workspace no se pisan', async () => {
    await ws.guardar(w('a', [pg, redis]));
    await Promise.all([ws.iniciar('a'), ws.iniciar('a')]);
    expect(puerto.orden.filter((o) => o === `+${k(pg)}`)).toHaveLength(1);
  });
});

describe('workspaces: detener', () => {
  it('apaga al revés: procesos, Nginx y PHP, y al final los datos', async () => {
    await ws.guardar(w('a', [pg, ollama, php, nginx, uvicorn]));
    await ws.iniciar('a');
    puerto.orden = [];
    const r = await ws.detener('a');
    expect(puerto.orden).toEqual([
      `-${k(uvicorn)}`,
      `-${k(nginx)}`,
      `-${k(php)}`,
      `-${k(ollama)}`,
      `-${k(pg)}`,
    ]);
    expect(r.every((x) => x.ok && !x.encendido)).toBe(true);
    expect(await ws.estado('a')).toBe('apagado');
  });

  it('un fallo al apagar sigue con los demás y dice qué sigue encendido', async () => {
    await ws.guardar(w('a', [pg, redis, uvicorn]));
    await ws.iniciar('a');
    puerto.falla.set(k(pg), new Error('no responde al cierre'));
    const r = await ws.detener('a');
    expect(por(r, pg)).toMatchObject({ ok: false, encendido: true });
    expect(por(r, redis)).toMatchObject({ ok: true, encendido: false });
    expect(por(r, uvicorn)).toMatchObject({ ok: true, encendido: false });
    expect(await ws.estado('a')).toBe('parcial');
  });

  it('no apaga lo que otro workspace encendido usa', async () => {
    await ws.guardar(w('a', [pg, redis]));
    await ws.guardar(w('b', [pg, ollama]));
    await ws.iniciar('a');
    await ws.iniciar('b');
    const r = await ws.detener('a');
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: true, aviso: 'compartido' });
    expect(por(r, redis)).toMatchObject({ ok: true, encendido: false });
    expect(puerto.encendidos.has(k(pg))).toBe(true);
    expect(await ws.estado('b')).toBe('encendido');
  });

  it('si el otro workspace no está encendido del todo, lo compartido sí se apaga', async () => {
    await ws.guardar(w('a', [pg, redis]));
    await ws.guardar(w('b', [pg, ollama]));
    await ws.iniciar('a');
    expect(await ws.estado('b')).toBe('parcial');
    const r = await ws.detener('a');
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: false });
  });

  it('lo que ya estaba apagado se informa y no se toca', async () => {
    await ws.guardar(w('a', [pg]));
    const r = await ws.detener('a');
    expect(puerto.orden).toEqual([]);
    expect(por(r, pg)).toMatchObject({ ok: true, encendido: false, aviso: 'ya_apagado' });
  });
});

describe('workspaces: estado', () => {
  it('apagado, parcial y encendido; vacío o con todo inexistente es apagado', async () => {
    await ws.guardar(w('a', [pg, redis]));
    expect(await ws.estado('a')).toBe('apagado');
    puerto.encendidos.add(k(pg));
    expect(await ws.estado('a')).toBe('parcial');
    puerto.encendidos.add(k(redis));
    expect(await ws.estado('a')).toBe('encendido');
    await ws.guardar(w('vacio', []));
    expect(await ws.estado('vacio')).toBe('apagado');
    puerto.inexistentes.add(k(pg));
    puerto.encendidos.delete(k(redis));
    expect(await ws.estado('a')).toBe('apagado');
  });

  it('estados devuelve el de cada workspace', async () => {
    await ws.guardar(w('a', [pg]));
    await ws.guardar(w('b', [redis]));
    puerto.encendidos.add(k(pg));
    expect(await ws.estados()).toEqual({ a: 'encendido', b: 'apagado' });
  });
});
