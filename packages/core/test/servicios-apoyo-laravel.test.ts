import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listarVersiones, type VersionDisponible } from '../src/catalogo/catalogo';
import { CatalogoVivo, listaFija } from '../src/catalogo/vivo';
import { fuenteMeilisearch } from '../src/catalogo/fuentes/github';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { FUENTES_VERSIONES } from '../src/catalogo/vivo';
import { ArchivoCredencialesSchema, ConfigSchema } from '../src/tipos';
import { entornoDelHijo } from '../src/procesos/entorno';
import { Rutas } from '../src/rutas';
import { DEFINICIONES } from '../src/servicios/datos';
import type { CtxServicio } from '../src/servicios/definicion';
import { argsMeilisearch, defMeilisearch } from '../src/servicios/meilisearch';
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
const ctxFuente = (rutas: Record<string, Ruta>): ContextoFuente => ({
  f: fetchFalso(rutas).f,
  idCatalogo: 'win-x64',
  ahora: HOY,
});

describe('fuente de Meilisearch', () => {
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
    for (const s of ['meilisearch'] as const) {
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

  it('I3: no hereda las variables MEILI_* de la sesión del usuario', async () => {
    const def = defMeilisearch();
    const c = ctx('meilisearch', '1.58.0', 7700, (v) => def.claveDatos!(v));
    const p = await def.proceso(c);
    const hijo = entornoDelHijo(
      {
        PATH: 'x',
        MEILI_IMPORT_DUMP: 'C:/algo.dump',
        MEILI_HTTP_ADDR: '0.0.0.0:7700',
        meili_env: 'development',
        MEILI_MASTER_KEY: 'OTRA-CLAVE-FALSA',
      },
      p,
    );
    expect(hijo['PATH']).toBe('x');
    expect(hijo['MEILI_IMPORT_DUMP']).toBeUndefined();
    expect(hijo['MEILI_HTTP_ADDR']).toBeUndefined();
    expect(hijo['meili_env']).toBeUndefined();
    // La clave del proceso es la propia, no la heredada.
    expect(hijo['MEILI_MASTER_KEY']).toBe(CLAVE_FALSA);
    expect(hijo['MEILI_NO_ANALYTICS']).toBe('true');
  });
});

describe('registro', () => {
  it('Meilisearch está registrado y admite instancias', () => {
    const ids = DEFINICIONES.map((d) => d.id);
    expect(ids).toContain('meilisearch');
    expect(esIdInstancia('meilisearch@1.58')).toBe(true);
    // MinIO ya no es un servicio: su id de instancia no es válido.
    expect(esIdInstancia('minio@actual')).toBe(false);
  });
});

describe('config guardada con MinIO (retirado del catálogo)', () => {
  it('se ignora sin romper la configuración', () => {
    const cfg = ConfigSchema.parse({
      servicios: {
        datos: {
          mysql: { version: '8.4.1', puerto: 3306, autoIniciar: true },
          minio: {
            version: '2025.09.07T16-13-09Z',
            puerto: 19000,
            autoIniciar: true,
            instancias: { actual: { version: '2025.09.07T16-13-09Z', puerto: 19000 } },
          },
        },
      },
    });
    expect(Object.keys(cfg.servicios.datos)).not.toContain('minio');
    expect(cfg.servicios.datos.mysql).toMatchObject({ version: '8.4.1', autoIniciar: true });
  });

  it('las credenciales viejas de MinIO no invalidan etc/credenciales.json', () => {
    const r = ArchivoCredencialesSchema.parse({
      mysql: { usuario: 'root', clave: 'CLAVE-DE-PRUEBA-FALSA-0000' },
      minio: { usuario: 'minio', clave: 'CLAVE-DE-PRUEBA-FALSA-0000' },
      'minio@actual': { usuario: 'minio', clave: 'CLAVE-DE-PRUEBA-FALSA-0000' },
    });
    expect(r.mysql?.usuario).toBe('root');
    // Se conservan tal cual (el archivo no se pierde) pero nadie las usa.
    expect(Object.keys(r)).toContain('minio');
  });
});

describe('M2: la huella en vivo debe coincidir con la fijada', () => {
  const fijaMeili = (): VersionDisponible => listaFija('meilisearch')[0]!;
  const enVivo = (valor: string): VersionDisponible => ({
    ...fijaMeili(),
    huella: { algoritmo: 'sha256', valor },
    sha256: valor,
    origen: 'vivo',
  });
  const catalogoCon = async (v: VersionDisponible) => {
    const rutas = new Rutas(base);
    await rutas.asegurar();
    return new CatalogoVivo(rutas, { idCatalogo: () => 'win-x64' }, fetch, {
      ahora: () => HOY,
      fuentes: {
        meilisearch: {
          servicio: 'meilisearch',
          hostsIndice: ['api.github.com'],
          listar: async () => [v],
        },
      },
    });
  };

  it('con la misma huella, el índice en vivo vale', async () => {
    const c = await catalogoCon(enVivo(fijaMeili().sha256!));
    expect((await c.listar('meilisearch')).origen).toBe('vivo');
  });

  it('con otra huella para la misma versión y URL, se usa la lista fija y no la nueva', async () => {
    const c = await catalogoCon(enVivo('f'.repeat(64)));
    const r = await c.listar('meilisearch');
    expect(r.origen).toBe('fija');
    expect(r.versiones.map((v) => v.sha256)).toEqual([fijaMeili().sha256]);
    expect((await c.buscar('meilisearch', fijaMeili().version))?.sha256).toBe(fijaMeili().sha256);
  });
});
