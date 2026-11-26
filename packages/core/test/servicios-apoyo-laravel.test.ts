import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listarVersiones } from '../src/catalogo/catalogo';
import { fuenteMeilisearch, fuenteMinio } from '../src/catalogo/fuentes/github';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { FUENTES_VERSIONES } from '../src/catalogo/vivo';
import { Rutas } from '../src/rutas';
import { DEFINICIONES } from '../src/servicios/datos';
import type { CtxServicio } from '../src/servicios/definicion';
import { argsMeilisearch, defMeilisearch } from '../src/servicios/meilisearch';
import { argsMinio, defMinio, PUERTO_CONSOLA_MINIO } from '../src/servicios/minio';
import { esIdInstancia } from '../src/servicios/instancias';
import { fetchFalso, HOY, type Ruta } from './catalogo-falso';

// Claves obviamente falsas: nada real en un repositorio público.
const CLAVE_FALSA = 'CLAVE-DE-PRUEBA-FALSA-0000';
const USUARIO_FALSO = 'usuario-de-prueba';

let base: string;
beforeEach(() => {
  base = mkdtempSync(path.join(tmpdir(), 'pel-apoyo-'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

const ctx = (
  id: string,
  version: string,
  puerto: number,
  clave: (v: string) => string,
): CtxServicio => {
  const rutas = new Rutas(base);
  return {
    rutas,
    bin: rutas.bin(id, version),
    datos: rutas.datos(id, version, clave),
    puerto,
    version,
    credenciales: { usuario: USUARIO_FALSO, clave: CLAVE_FALSA },
    exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
  };
};

const sha = (c: string): string => `sha256:${c.repeat(64)}`;
const asset = (repo: string, tag: string, name: string, c: string) => ({
  name,
  browser_download_url: `https://github.com/${repo}/releases/download/${tag}/${name}`,
  digest: sha(c),
});

const URL_MEILI = 'https://api.github.com/repos/meilisearch/meilisearch/releases?per_page=10';
const URL_MINIO = 'https://api.github.com/repos/minio/minio/releases?per_page=10';
const ctxFuente = (rutas: Record<string, Ruta>): ContextoFuente => ({
  f: fetchFalso(rutas).f,
  idCatalogo: 'win-x64',
  ahora: HOY,
});

describe('fuentes de Meilisearch y MinIO', () => {
  it('Meilisearch: el binario de la release con la huella del digest', async () => {
    const tag = 'v1.58.0';
    const r = [
      {
        tag_name: tag,
        draft: false,
        prerelease: false,
        assets: [
          asset('meilisearch/meilisearch', tag, 'meilisearch-windows-amd64.exe', 'a'),
          asset('meilisearch/meilisearch', tag, 'meilisearch-enterprise-windows-amd64.exe', 'b'),
        ],
      },
    ];
    const v = await fuenteMeilisearch.listar(ctxFuente({ [URL_MEILI]: JSON.stringify(r) }));
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      servicio: 'meilisearch',
      version: '1.58.0',
      formato: 'exe',
      huella: { algoritmo: 'sha256', valor: 'a'.repeat(64) },
    });
  });

  it('MinIO: salta la release sin binario y convierte la etiqueta en versión', async () => {
    const nueva = 'RELEASE.2025-10-15T17-29-55Z';
    const vieja = 'RELEASE.2025-09-07T16-13-09Z';
    const r = [
      { tag_name: nueva, draft: false, prerelease: false, assets: [] },
      {
        tag_name: vieja,
        draft: false,
        prerelease: false,
        assets: [asset('minio/minio', vieja, `minio.windows-amd64.${vieja}.exe`, 'c')],
      },
    ];
    const v = await fuenteMinio.listar(ctxFuente({ [URL_MINIO]: JSON.stringify(r) }));
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      servicio: 'minio',
      version: '2025.09.07T16-13-09Z',
      url: `https://github.com/minio/minio/releases/download/${vieja}/minio.windows-amd64.${vieja}.exe`,
      huella: { algoritmo: 'sha256', valor: 'c'.repeat(64) },
    });
  });

  it('un asset fuera del repositorio esperado descarta el índice', async () => {
    const malo = {
      name: 'meilisearch-windows-amd64.exe',
      browser_download_url: 'https://github.com/otro/repo/releases/download/v1.58.0/x.exe',
      digest: sha('a'),
    };
    const r = [{ tag_name: 'v1.58.0', draft: false, prerelease: false, assets: [malo] }];
    await expect(
      fuenteMeilisearch.listar(ctxFuente({ [URL_MEILI]: JSON.stringify(r) })),
    ).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('están registradas en el catálogo en vivo y en la lista fija con huella SHA-256', async () => {
    expect(FUENTES_VERSIONES.meilisearch).toBe(fuenteMeilisearch);
    expect(FUENTES_VERSIONES.minio).toBe(fuenteMinio);
    for (const s of ['meilisearch', 'minio'] as const) {
      const lista = await listarVersiones(s);
      expect(lista).toHaveLength(1);
      expect(lista[0]!.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(lista[0]!.url.startsWith('https://github.com/')).toBe(true);
    }
  });
});

describe('Meilisearch: arranque', () => {
  it('escucha solo en 127.0.0.1 y la master key va por entorno secreto, no por args ni env', async () => {
    const def = defMeilisearch();
    const c = ctx('meilisearch', '1.58.0', 7700, (v) => def.claveDatos!(v));
    await def.inicializar(c);
    const p = await def.proceso(c);
    expect(p.args[p.args.indexOf('--http-addr') + 1]).toBe('127.0.0.1:7700');
    expect(p.args[p.args.indexOf('--env') + 1]).toBe('production');
    expect(p.envSecreto).toEqual({ MEILI_MASTER_KEY: CLAVE_FALSA });
    expect(JSON.stringify({ args: p.args, env: p.env })).not.toContain(CLAVE_FALSA);
    expect(argsMeilisearch(c.datos, 7701)).toContain('127.0.0.1:7701');
    expect(def.claveDatos!('1.58.0')).toBe('1.58');
  });
});

describe('MinIO: arranque', () => {
  it('API y consola solo en 127.0.0.1; usuario y clave por entorno secreto', async () => {
    const def = defMinio();
    const c = ctx('minio', '2025.09.07T16-13-09Z', 19000, () => 'actual');
    await def.inicializar(c);
    const p = await def.proceso(c);
    expect(p.args[p.args.indexOf('--address') + 1]).toBe('127.0.0.1:19000');
    expect(p.args[p.args.indexOf('--console-address') + 1]).toBe(
      `127.0.0.1:${PUERTO_CONSOLA_MINIO}`,
    );
    // Nada de ":19001" sin host (escucharía en todas las interfaces).
    for (const a of p.args) expect(/^:\d+$/.test(a)).toBe(false);
    expect(p.envSecreto).toEqual({
      MINIO_ROOT_USER: USUARIO_FALSO,
      MINIO_ROOT_PASSWORD: CLAVE_FALSA,
    });
    const visible = JSON.stringify({ args: p.args, env: p.env });
    expect(visible).not.toContain(CLAVE_FALSA);
    expect(visible).not.toContain(USUARIO_FALSO);
    expect(def.puertosExtra).toEqual([PUERTO_CONSOLA_MINIO]);
    expect(argsMinio(c.datos, 19050)).toContain('127.0.0.1:19050');
  });

  it('los puertos quedan fuera del rango de PHP (9000-9999)', () => {
    expect(defMinio().puertoPorDefecto).toBeGreaterThan(9999);
    expect(PUERTO_CONSOLA_MINIO).toBeGreaterThan(9999);
  });
});

describe('registro', () => {
  it('ambos servicios están registrados y admiten instancias', () => {
    const ids = DEFINICIONES.map((d) => d.id);
    expect(ids).toContain('meilisearch');
    expect(ids).toContain('minio');
    expect(esIdInstancia('meilisearch@1.58')).toBe(true);
    expect(esIdInstancia('minio@actual')).toBe(true);
  });
});
