import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { nombreEjecutable } from '../src/plataforma/sistema';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';
import { zip } from './zip-prueba';

let nucleo: Nucleo | null = null;
let plataforma: PlataformaFalsa;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: false }).catch(() => undefined);
  nucleo = null;
});

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

function fetchDe(cuerpo: Buffer): typeof fetch {
  return (async () => new Response(new Uint8Array(cuerpo))) as unknown as typeof fetch;
}

async function crear(
  fetchFn: typeof fetch = (async () => new Response('{}')) as typeof fetch,
  aislado = false,
): Promise<{ n: Nucleo; base: string }> {
  const dir = await carpetaTemporal('pel-inst-entorno-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  await writeFile(path.join(base, 'config.json'), JSON.stringify(ConfigSchema.parse({}), null, 2));
  plataforma = new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir });
  nucleo = await Nucleo.crear({
    base,
    plataforma,
    sonda: async () => false,
    fetch: fetchFn,
    retrasoNovedadesMs: 60_000,
    ...(aislado ? { aislado: true } : {}),
  });
  return { n: nucleo, base };
}

const entorno = (base: string): string => path.join(base, 'respaldos', 'entorno');

describe('Nucleo: instantánea del entorno (D27)', () => {
  it('aislado refleja WOLFCORE_DATOS', async () => {
    expect((await crear()).n.aislado).toBe(false);
    await nucleo?.cerrar({ detenerServicios: false });
    expect((await crear(undefined, true)).n.aislado).toBe(true);
  });

  it('la manual crea la carpeta, restringida al usuario, y aparece en la lista', async () => {
    const { n, base } = await crear();
    const carpeta = await n.instantaneaEntorno('manual');
    expect(carpeta.startsWith(entorno(base))).toBe(true);
    expect(existsSync(path.join(carpeta, 'config.json'))).toBe(true);
    expect(plataforma.restringidos).toContain(carpeta);
    expect(await n.instantaneasEntorno()).toMatchObject([{ motivo: 'manual' }]);
  });

  it('cambiar la versión de Nginx toma la instantánea antes del cambio; la misma, no', async () => {
    const { n, base } = await crear();
    for (const v of ['1.30.6', '1.30.8']) {
      const dir = path.join(base, 'bin', 'nginx', v);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, nombreEjecutable('nginx')), '');
    }
    const activa = await n.servicios.nginx.versionActiva();
    const otra = activa === '1.30.8' ? '1.30.6' : '1.30.8';
    await n.predeterminarVersion('nginx', activa!);
    expect(await n.instantaneasEntorno()).toEqual([]);
    await n.predeterminarVersion('nginx', otra);
    const lista = await n.instantaneasEntorno();
    expect(lista).toMatchObject([{ motivo: 'actualizar' }]);
    // La copia es de antes del cambio.
    const copia = JSON.parse(
      await readFile(path.join(entorno(base), lista[0]!.nombre, 'config.json'), 'utf8'),
    ) as { servicios: { nginx: { version?: string } } };
    expect(copia.servicios.nginx.version ?? null).not.toBe(otra);
  });

  it('reemplazar PHP por un parche nuevo toma la instantánea antes de tocar bin/', async () => {
    const z1 = zip({ 'php-cgi.exe': 'v1' });
    const z2 = zip({ 'php-cgi.exe': 'v2' });
    const v = (z: Buffer, version: string): VersionDisponible => ({
      servicio: 'php',
      version,
      rama: '8.4',
      url: 'https://windows.php.net/downloads/releases/php.zip',
      sha256: sha(z),
      formato: 'zip',
    });
    const { n, base } = await crear(fetchDe(z1));
    await n.instalador.instalar(v(z1, '8.4.26'));
    expect(await n.instantaneasEntorno()).toEqual([]);
    nucleo = await reabrir(n, fetchDe(z2));
    await nucleo.instalador.instalar(v(z2, '8.4.27-1'));
    expect(await nucleo.instantaneasEntorno()).toMatchObject([{ motivo: 'actualizar' }]);
    expect(await readFile(path.join(base, 'bin', 'php', '8.4', 'php-cgi.exe'), 'utf8')).toBe('v2');
  });

  it('si no se puede tomar la instantánea, PHP no se reemplaza', async () => {
    const z1 = zip({ 'php-cgi.exe': 'v1' });
    const z2 = zip({ 'php-cgi.exe': 'v2' });
    const v = (z: Buffer, version: string): VersionDisponible => ({
      servicio: 'php',
      version,
      rama: '8.4',
      url: 'https://windows.php.net/downloads/releases/php.zip',
      sha256: sha(z),
      formato: 'zip',
    });
    const { n, base } = await crear(fetchDe(z1));
    await n.instalador.instalar(v(z1, '8.4.26'));
    nucleo = await reabrir(n, fetchDe(z2));
    // Un archivo donde debería ir la carpeta: no se puede crear respaldos/entorno.
    await mkdir(path.join(base, 'respaldos'), { recursive: true });
    await writeFile(entorno(base), 'estorbo');
    await expect(nucleo.instalador.instalar(v(z2, '8.4.27-1'))).rejects.toMatchObject({
      codigo: 'perfiles.instantanea_fallo',
    });
    expect(await readFile(path.join(base, 'bin', 'php', '8.4', 'php-cgi.exe'), 'utf8')).toBe('v1');
  });

  it('importar un perfil toma una sola instantánea, la de la importación', async () => {
    const { n, base } = await crear();
    const destino = path.join(path.dirname(base), 'entorno.wolfperfil');
    await n.exportarPerfil({
      destino,
      bases: false,
      certificados: false,
      ca: false,
      frase: null,
    });
    const vista = await n.vistaPreviaImportarPerfil(destino, { rutas: {} });
    await n.importarPerfil(destino, {
      rutas: {},
      huella: vista.huella,
      confirmado: true,
      guardarClave: async () => undefined,
    });
    expect(await n.instantaneasEntorno()).toMatchObject([{ motivo: 'importar-perfil' }]);
  }, 30_000);
});

/** Cierra el núcleo y abre otro sobre la misma carpeta con otra descarga falsa. */
async function reabrir(n: Nucleo, fetchFn: typeof fetch): Promise<Nucleo> {
  const base = n.rutas.base;
  await n.cerrar({ detenerServicios: false });
  return Nucleo.crear({
    base,
    plataforma,
    sonda: async () => false,
    fetch: fetchFn,
    retrasoNovedadesMs: 60_000,
  });
}
