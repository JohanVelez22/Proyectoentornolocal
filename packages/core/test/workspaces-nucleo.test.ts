import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { ConfigSchema, ProcesoProyectoSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

async function crear(config: unknown): Promise<Nucleo> {
  const dir = await carpetaTemporal('pel-workspaces-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(config, null, 2));
  nucleo = await Nucleo.crear({
    barrerHuerfanos: false,
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
  });
  return nucleo;
}

describe('Nucleo: workspaces de arranque (D28)', () => {
  it('un proceso de un sitio importado de un perfil no arranca sin confianza, y el resto se informa', async () => {
    const dir = await carpetaTemporal('pel-workspaces-proy-');
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'bot',
          nombre: 'Bot',
          dominio: 'bot.test',
          carpeta: dir,
          tipo: 'fastapi',
          origen: 'perfil',
          procesos: [ProcesoProyectoSchema.parse({ id: 'uvicorn', comando: ['uvicorn', 'a:a'] })],
        }),
      ],
    });
    const n = await crear(cfg);
    await n.workspaces.guardar({
      id: 'bot-fastapi',
      nombre: 'Bot FastAPI',
      elementos: [
        { tipo: 'instancia', id: 'postgresql@17' },
        { tipo: 'servicio', id: 'ollama' },
        { tipo: 'proceso', sitioId: 'bot', procesoId: 'uvicorn' },
        { tipo: 'proceso', sitioId: 'borrado', procesoId: 'x' },
      ],
    });
    const r = await n.workspaces.iniciar('bot-fastapi');
    const por = (k: string) => r.find((x) => x.elemento === k)!;
    // Sin nada instalado: los datos que no existen se ignoran con aviso, no son un error.
    expect(por('instancia:postgresql@17')).toMatchObject({ ok: true, aviso: 'no_existe' });
    expect(por('servicio:ollama')).toMatchObject({ ok: true, aviso: 'no_existe' });
    expect(por('proceso:borrado/x')).toMatchObject({ ok: true, aviso: 'no_existe' });
    // El sitio del perfil no confiado: no arranca y lo dice.
    expect(por('proceso:bot/uvicorn')).toMatchObject({
      ok: false,
      encendido: false,
      codigo: 'proyectos.no_confiado',
    });
    expect((await n.procesos.estados('bot'))[0]!.estado).toBe('apagado');
    // Nunca abre túneles ni comparte en la red local.
    expect(n.tuneles.estados()).toEqual([]);
    expect(await n.workspaces.estado('bot-fastapi')).toBe('apagado');
    // Falló algo: queda un aviso.
    expect(n.avisos.lista().some((a) => a.codigo === 'avisos.workspace_fallos')).toBe(true);
  });

  it('guarda en config.json y sobrevive a releerlo', async () => {
    const n = await crear(ConfigSchema.parse({}));
    await n.workspaces.guardar({
      id: 'a',
      nombre: 'A',
      elementos: [{ tipo: 'servicio', id: 'nginx' }],
    });
    expect((await n.config.leer()).workspaces).toEqual([
      { id: 'a', nombre: 'A', elementos: [{ tipo: 'servicio', id: 'nginx' }] },
    ]);
    await n.workspaces.borrar('a');
    expect((await n.config.leer()).workspaces).toEqual([]);
  });
});
