import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { GestorIa, TEXTO_PRUEBA_IA } from '../src/ia/gestorIa';
import { MAX_TOKENS_PRUEBA } from '../src/ia/proveedores';
import { ConfigSchema, type Config } from '../src/tipos';

// Clave claramente falsa: nunca debe aparecer en resultados ni errores que no la necesiten.
const CENTINELA = 'sk-falso-CENTINELA-gestor-0000000000abcd';

const temporales: string[] = [];
const temporal = (): string => {
  const d = mkdtempSync(path.join(os.tmpdir(), 'pel-ia-gestor-'));
  temporales.push(d);
  return d;
};
afterEach(() => {
  for (const d of temporales.splice(0)) rmSync(d, { recursive: true, force: true });
});

function montar(o: { versionado?: boolean | null; fetch?: ReturnType<typeof vi.fn> } = {}) {
  const proyecto = temporal();
  const respaldos = path.join(temporal(), 'respaldos-env');
  let config: Config = ConfigSchema.parse({
    sitios: [
      {
        id: 'tienda',
        nombre: 'Tienda',
        carpeta: proyecto,
        tipo: 'laravel',
        dominio: 'tienda.test',
      },
    ],
  });
  const versionado = vi.fn(async () => (o.versionado === undefined ? false : o.versionado));
  const fetchImpl =
    o.fetch ??
    vi.fn(async (url: string) => {
      if (url.endsWith('/models')) {
        return new Response(JSON.stringify({ data: [{ id: 'gpt-b' }, { id: 'gpt-a' }] }), {
          status: 200,
        });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok' } }],
          usage: { prompt_tokens: 9, completion_tokens: 1 },
        }),
        { status: 200 },
      );
    });
  const gestor = new GestorIa({
    leerConfig: async () => config,
    modificarConfig: async (fn) => {
      const copia = structuredClone(config);
      fn(copia);
      config = ConfigSchema.parse(copia);
    },
    versionado,
    carpetaRespaldos: () => respaldos,
    fetch: fetchImpl as never,
    ahora: (() => {
      let t = 0;
      return () => (t += 25);
    })(),
  });
  return { gestor, proyecto, respaldos, versionado, fetchImpl, leer: () => config };
}

const OPENAI = {
  id: 'openai',
  tipo: 'openai',
  nombre: 'OpenAI',
  urlBase: null,
  modelo: 'gpt-a',
} as const;

describe('GestorIa: proveedores en config.json', () => {
  it('guarda, actualiza y borra proveedores sin campos de más', async () => {
    const { gestor, leer } = montar();
    await gestor.guardarProveedor({ ...OPENAI, clave: CENTINELA } as never, { tieneClave: false });
    expect(await gestor.proveedores()).toEqual([OPENAI]);
    expect(JSON.stringify(leer())).not.toContain(CENTINELA);
    await gestor.guardarProveedor({ ...OPENAI, nombre: 'OpenAI personal' }, { tieneClave: false });
    expect((await gestor.proveedores())[0]?.nombre).toBe('OpenAI personal');
    await gestor.borrarProveedor('openai');
    expect(await gestor.proveedores()).toEqual([]);
  });

  it('un proveedor no válido falla con ia.proveedor_invalido', async () => {
    const { gestor } = montar();
    await expect(
      gestor.guardarProveedor(
        { ...OPENAI, urlBase: 'http://otro.example/v1' },
        { tieneClave: false },
      ),
    ).rejects.toMatchObject({ codigo: 'ia.proveedor_invalido' });
    await expect(
      gestor.guardarProveedor({ ...OPENAI, id: 'Mal Id' }, { tieneClave: false }),
    ).rejects.toMatchObject({ codigo: 'ia.proveedor_invalido' });
  });

  it('cambiar la URL de un proveedor con clave guardada exige confirmación aparte', async () => {
    const { gestor } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: false });
    const nuevo = { ...OPENAI, tipo: 'compatible' as const, urlBase: 'https://otro.example/v1' };
    await expect(gestor.guardarProveedor(nuevo, { tieneClave: true })).rejects.toMatchObject({
      codigo: 'ia.url_cambia_con_clave',
    });
    expect((await gestor.proveedores())[0]?.urlBase).toBeNull();
    // Sin clave guardada no hace falta; con la confirmación, tampoco.
    await gestor.guardarProveedor(nuevo, { tieneClave: true, confirmarCambioUrl: true });
    expect((await gestor.proveedores())[0]?.urlBase).toBe('https://otro.example/v1');
    // La misma URL efectiva escrita a mano no cuenta como cambio.
    await gestor.guardarProveedor(
      { ...nuevo, urlBase: 'https://otro.example/v1/' },
      { tieneClave: true },
    );
  });

  it('borrar o usar un proveedor que no existe da ia.proveedor_no_existe', async () => {
    const { gestor } = montar();
    await expect(gestor.borrarProveedor('nada')).rejects.toMatchObject({
      codigo: 'ia.proveedor_no_existe',
    });
    await expect(gestor.probarConexion('nada', null)).rejects.toMatchObject({
      codigo: 'ia.proveedor_no_existe',
    });
  });
});

describe('GestorIa: pruebas', () => {
  it('probarConexion solo lista modelos y mide la latencia', async () => {
    const { gestor, fetchImpl } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    const r = await gestor.probarConexion('openai', CENTINELA);
    expect(r).toMatchObject({ ok: true, latenciaMs: 25 });
    expect(r.modelos.map((m) => m.id)).toEqual(['gpt-a', 'gpt-b']);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0]![1]).toMatchObject({ method: 'GET' });
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
  });

  it('probarMensaje exige confirmación, usa el texto fijo y el tope de 16 tokens', async () => {
    const { gestor, fetchImpl } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    await expect(
      gestor.probarMensaje('openai', CENTINELA, 'gpt-a', false as never),
    ).rejects.toMatchObject({ codigo: 'ia.mensaje_sin_confirmar' });
    expect(fetchImpl).not.toHaveBeenCalled();
    const r = await gestor.probarMensaje('openai', CENTINELA, 'gpt-a', true);
    expect(r).toMatchObject({ texto: 'ok', latenciaMs: 25, tokens: { entrada: 9, salida: 1 } });
    const cuerpo = JSON.parse(String(fetchImpl.mock.calls[0]![1].body)) as Record<string, unknown>;
    expect(cuerpo).toMatchObject({
      model: 'gpt-a',
      messages: [{ role: 'user', content: TEXTO_PRUEBA_IA }],
      max_completion_tokens: MAX_TOKENS_PRUEBA,
    });
  });
});

describe('GestorIa: bloque .env por proyecto', () => {
  it('previsualiza enmascarado con el estado de .gitignore y de git', async () => {
    const { gestor, proyecto } = montar({ versionado: null });
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    writeFileSync(path.join(proyecto, '.gitignore'), 'node_modules\n');
    const p = await gestor.previsualizarEnv('tienda', 'openai', CENTINELA);
    expect(p.bloque).toContain('OPENAI_API_KEY=****abcd');
    expect(p.bloque).toContain('AI_MODEL=gpt-a');
    expect(p.bloque).not.toContain(CENTINELA);
    expect(p.gitignore).toEqual({ existe: true, ignoraEnv: false, envVersionado: null });
    expect(p.existeEnv).toBe(false);
  });

  it('un sitio que no existe da proyectos.no_existe', async () => {
    const { gestor } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    await expect(gestor.previsualizarEnv('otro', 'openai', CENTINELA)).rejects.toMatchObject({
      codigo: 'proyectos.no_existe',
    });
  });

  it('escribe el bloque con la clave, agrega .env al .gitignore y deja la copia fuera', async () => {
    const { gestor, proyecto, respaldos } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    writeFileSync(path.join(proyecto, '.env'), 'APP_NAME=Tienda\n');
    const r = await gestor.escribirEnv('tienda', 'openai', CENTINELA, {
      confirmado: true,
      agregarGitignore: true,
    });
    expect(r).toEqual({ respaldo: true, conflictos: [], gitignoreAgregado: true });
    const env = readFileSync(path.join(proyecto, '.env'), 'utf8');
    expect(env).toContain(`OPENAI_API_KEY=${CENTINELA}`);
    expect(env).toContain('APP_NAME=Tienda');
    expect(readFileSync(path.join(proyecto, '.gitignore'), 'utf8')).toContain('.env');
    expect(readdirSync(respaldos).some((n) => n.startsWith('env-tienda-'))).toBe(true);
    expect(readdirSync(proyecto).sort()).toEqual(['.env', '.gitignore']);
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
  });

  it('sin confirmado no toca nada', async () => {
    const { gestor, proyecto } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    await expect(
      gestor.escribirEnv('tienda', 'openai', CENTINELA, {
        confirmado: false as never,
        agregarGitignore: true,
      }),
    ).rejects.toMatchObject({ codigo: 'ia.env_sin_confirmar' });
    expect(existsSync(path.join(proyecto, '.env'))).toBe(false);
    expect(existsSync(path.join(proyecto, '.gitignore'))).toBe(false);
  });

  it('con el .env ya versionado exige aceptarVersionado', async () => {
    const { gestor, proyecto } = montar({ versionado: true });
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    await expect(
      gestor.escribirEnv('tienda', 'openai', CENTINELA, {
        confirmado: true,
        agregarGitignore: false,
      }),
    ).rejects.toMatchObject({ codigo: 'ia.env_versionado' });
    expect(existsSync(path.join(proyecto, '.env'))).toBe(false);
    await gestor.escribirEnv('tienda', 'openai', CENTINELA, {
      confirmado: true,
      agregarGitignore: false,
      aceptarVersionado: true,
    });
    expect(readFileSync(path.join(proyecto, '.env'), 'utf8')).toContain(CENTINELA);
  });

  it('si no se sabe si git sigue el .env (null) también exige aceptarVersionado', async () => {
    const { gestor, proyecto } = montar({ versionado: null });
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    await expect(
      gestor.escribirEnv('tienda', 'openai', CENTINELA, {
        confirmado: true,
        agregarGitignore: true,
      }),
    ).rejects.toMatchObject({ codigo: 'ia.env_versionado_desconocido' });
    expect(existsSync(path.join(proyecto, '.env'))).toBe(false);
    expect(existsSync(path.join(proyecto, '.gitignore'))).toBe(false);
    await gestor.escribirEnv('tienda', 'openai', CENTINELA, {
      confirmado: true,
      agregarGitignore: false,
      aceptarVersionado: true,
    });
    expect(existsSync(path.join(proyecto, '.env'))).toBe(true);
  });

  it('un conflicto llega con los nombres y se resuelve con reemplazarAjenas', async () => {
    const { gestor, proyecto } = montar();
    await gestor.guardarProveedor(OPENAI, { tieneClave: true });
    writeFileSync(path.join(proyecto, '.env'), 'OPENAI_API_KEY=otra-clave-del-usuario\n');
    const e = await gestor
      .escribirEnv('tienda', 'openai', CENTINELA, { confirmado: true, agregarGitignore: false })
      .catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorWolf);
    expect(e).toMatchObject({ codigo: 'ia.env_conflicto', datos: { claves: 'OPENAI_API_KEY' } });
    expect(JSON.stringify(e)).not.toContain(CENTINELA);
    const r = await gestor.escribirEnv('tienda', 'openai', CENTINELA, {
      confirmado: true,
      agregarGitignore: false,
      reemplazarAjenas: true,
    });
    expect(r.conflictos).toEqual(['OPENAI_API_KEY']);
  });
});

describe('GestorIa: copias del .env con una clave', () => {
  it('encuentra los sitios cuyas copias tienen la clave y las borra con limpiarRespaldosEnv', async () => {
    const { gestor, respaldos } = montar();
    mkdirSync(respaldos, { recursive: true });
    const nombre = (sitio: string, n: number): string =>
      `env-${sitio}-20261119-10000${n}-000-a1b2c${n}.respaldo`;
    writeFileSync(path.join(respaldos, nombre('tienda', 1)), `OPENAI_API_KEY=${CENTINELA}\n`);
    writeFileSync(path.join(respaldos, nombre('tienda', 2)), 'APP_NAME=Tienda\n');
    writeFileSync(path.join(respaldos, nombre('blog', 3)), 'APP_NAME=Blog\n');
    writeFileSync(path.join(respaldos, 'gitignore-20261119-100004-000-a1b2c4.respaldo'), '.env\n');
    expect(await gestor.sitiosConRespaldosDeClave(CENTINELA)).toEqual(['tienda']);
    expect(await gestor.limpiarRespaldosDeClave(CENTINELA)).toEqual({ sitios: 1 });
    // Se borran todas las copias de ese sitio; las de otros sitios y del .gitignore quedan.
    expect(readdirSync(respaldos).sort()).toEqual([
      nombre('blog', 3),
      'gitignore-20261119-100004-000-a1b2c4.respaldo',
    ]);
    expect(await gestor.sitiosConRespaldosDeClave(null)).toEqual([]);
  });
});
