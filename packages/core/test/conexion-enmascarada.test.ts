import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bloqueEnv, MASCARA_CLAVE, vistaConexion, type DatosConexion } from '../src/bd/env';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/** D38c: la clave del motor y la master key solo salen por las rutas «revelar», nunca en los datos. */
const CLAVE = 'clave-falsa-de-prueba-123';
const conexion: DatosConexion = { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: CLAVE };

describe('vista de datos de conexión', () => {
  it('quita la clave y dice si hay', () => {
    const v = vistaConexion(conexion);
    expect(v).toEqual({ host: '127.0.0.1', puerto: 3306, usuario: 'root', tieneClave: true });
    expect(JSON.stringify(v)).not.toContain(CLAVE);
    expect(vistaConexion({ ...conexion, clave: null, instancia: 'mysql@8.4' })).toEqual({
      host: '127.0.0.1',
      puerto: 3306,
      usuario: 'root',
      tieneClave: false,
      instancia: 'mysql@8.4',
    });
  });
});

describe('bloqueEnv enmascarado', () => {
  const casos = [
    ['laravel', 'DB_PASSWORD='],
    ['codeigniter4', 'database.default.password = '],
    ['codeigniter3', 'DB_PASSWORD='],
  ] as const;
  it.each(casos)('%s: la clave sale como máscara y lo demás igual', (tipo, prefijo) => {
    const real = bloqueEnv('mysql', 'tienda', tipo, conexion);
    const mascara = bloqueEnv('mysql', 'tienda', tipo, conexion, '', true);
    expect(real).toContain(CLAVE);
    expect(mascara).not.toContain(CLAVE);
    expect(mascara).toContain(`${prefijo}${MASCARA_CLAVE}`);
    expect(mascara.replace(MASCARA_CLAVE, 'X')).toBe(real.replace(CLAVE, 'X'));
  });
});

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

async function crear(): Promise<Nucleo> {
  const dir = await carpetaTemporal('pel-conexion-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  const bin = new Rutas(base).bin('meilisearch', '1.58.0');
  await mkdir(bin, { recursive: true });
  await writeFile(path.join(bin, 'meilisearch.exe'), 'falso');
  const cfg = ConfigSchema.parse({
    servicios: { datos: { meilisearch: { version: '1.58.0', puerto: 7702 } } },
  });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(cfg, null, 2));
  nucleo = await Nucleo.crear({
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
  });
  return nucleo;
}

describe('Nucleo: datos de conexión sin secreto y rutas «revelar»', () => {
  it('motor de base de datos: la vista no lleva la clave; revelarClaveBd sí', async () => {
    const n = await crear();
    vi.spyOn(n.bd, 'conexion').mockResolvedValue(conexion);
    const vista = await n.vistaConexionBd('mysql');
    expect(vista).toMatchObject({ puerto: 3306, usuario: 'root', tieneClave: true });
    expect(JSON.stringify(vista)).not.toContain(CLAVE);
    expect(await n.revelarClaveBd('mysql')).toBe(CLAVE);
    vi.spyOn(n.bd, 'conexion').mockResolvedValue({ ...conexion, clave: null });
    expect(await n.revelarClaveBd('mongodb')).toBeNull();
  });

  it('bloque .env: enmascarado por defecto, completo solo con revelar', async () => {
    const n = await crear();
    vi.spyOn(n.bd, 'conexion').mockResolvedValue(conexion);
    const normal = await n.bloqueEnvBd('mysql', 'tienda', 'laravel');
    expect(normal).not.toContain(CLAVE);
    expect(normal).toContain(`DB_PASSWORD=${MASCARA_CLAVE}`);
    const completo = await n.bloqueEnvBd('mysql', 'tienda', 'laravel', undefined, {
      revelar: true,
    });
    expect(completo).toContain(`DB_PASSWORD=${CLAVE}`);
  });

  it('Meilisearch: la vista no lleva la master key; revelarClaveServicio la da (la misma del almacén)', async () => {
    const n = await crear();
    const vista = await n.vistaConexionServicio('meilisearch');
    expect(vista).toMatchObject({ host: '127.0.0.1', puerto: 7702, tieneClave: true });
    expect(vista).not.toHaveProperty('clave');
    const clave = await n.revelarClaveServicio('meilisearch');
    expect(clave).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(JSON.stringify(vista)).not.toContain(clave!);
    expect((await n.credenciales('meilisearch'))?.clave).toBe(clave);
  });

  it('revelarClaveServicio solo sirve para Meilisearch', async () => {
    const n = await crear();
    await expect(n.revelarClaveServicio('redis' as never)).rejects.toThrow();
    await expect(n.revelarClaveServicio('redis@8' as never)).rejects.toMatchObject({
      codigo: 'servicios.desconocido',
    });
  });
});
