import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import { catalogo, type VersionDisponible } from '../src/catalogo/catalogo';
import type { FuenteVersiones } from '../src/catalogo/fuentes/tipos';
import { CatalogoVivo, listaFija, TTL_CATALOGO_MS, validarIndice } from '../src/catalogo/vivo';
import { Rutas } from '../src/rutas';
import { fetchFalso, fixture, HOY, rutasOficiales, type Ruta } from './catalogo-falso';
import { carpetaTemporal } from './temporales';

let rutas: Rutas;
let ahora: Date;
const plat = { idCatalogo: () => 'win-x64' as const };

beforeEach(async () => {
  rutas = new Rutas(await carpetaTemporal('pel-vivo-'));
  await rutas.asegurar();
  ahora = HOY;
});

function catalogoCon(rutasHttp: Record<string, Ruta>, sinRed = false) {
  const ff = fetchFalso(rutasHttp, sinRed);
  const c = new CatalogoVivo(rutas, plat, ff.f, { ahora: () => ahora });
  return { c, ff };
}

const buena = (o: Partial<VersionDisponible> = {}): VersionDisponible => ({
  servicio: 'mailpit',
  version: '1.34.0',
  rama: '1.34',
  url: 'https://github.com/axllent/mailpit/releases/download/v1.34.0/mailpit-windows-amd64.zip',
  sha256: 'a'.repeat(64),
  huella: { algoritmo: 'sha256', valor: 'a'.repeat(64) },
  formato: 'zip',
  ejecutable: 'mailpit.exe',
  soporte: 'actual',
  finSoporte: null,
  origen: 'vivo',
  ...o,
});

describe('validarIndice', () => {
  it('acepta un índice correcto', () => {
    expect(validarIndice('mailpit', [buena()])).toHaveLength(1);
  });

  it('una sola entrada mala descarta el índice entero (Review Focus 6)', () => {
    const malas: Partial<VersionDisponible>[] = [
      { url: 'https://evil.example/mailpit.zip' },
      { url: 'http://github.com/axllent/mailpit/x.zip' },
      { sha256: null, huella: { algoritmo: 'sha256', valor: 'a'.repeat(63) } },
      { sha256: 'a'.repeat(63), huella: { algoritmo: 'sha256', valor: 'a'.repeat(63) } },
      { sha256: null, huella: { algoritmo: 'sha512', valor: 'A'.repeat(128) } },
      { sha256: 'b'.repeat(64) },
      { version: '../1.34.0' },
      { version: '1.34..0' },
      { rama: '1.34/..' },
      { ejecutable: '../../Windows/x.exe' },
      { ejecutable: 'C:\\x.exe' },
      { subcarpeta: '..' },
      { servicio: 'nginx' },
      { formato: 'tar' as 'zip' },
      { soporte: 'eterno' as 'lts' },
    ];
    for (const m of malas) {
      expect(() => validarIndice('mailpit', [buena(), buena(m)]), JSON.stringify(m)).toThrow(
        expect.objectContaining({ codigo: 'catalogo.indice_invalido' }),
      );
    }
    expect(() =>
      validarIndice('mailpit', [{ ...buena(), extra: 'x' } as unknown as VersionDisponible]),
    ).toThrow();
    expect(() => validarIndice('mailpit', 'no es una lista')).toThrow();
  });
});

describe('CatalogoVivo', () => {
  it('vivo la primera vez; dentro de las 6 h sale de la caché sin consultar', async () => {
    const { c, ff } = catalogoCon(rutasOficiales());
    const a = await c.listar('mailpit');
    expect(a.origen).toBe('vivo');
    expect(a.fecha).toBe(HOY.toISOString());
    expect(a.versiones[0]).toMatchObject({ version: '1.34.0', origen: 'vivo' });
    expect(existsSync(rutas.cacheCatalogo('mailpit'))).toBe(true);
    const pedidas = ff.pedidas.length;
    ahora = new Date(HOY.getTime() + TTL_CATALOGO_MS - 1000);
    const b = await c.listar('mailpit');
    expect(b.origen).toBe('cache');
    expect(b.fecha).toBe(HOY.toISOString());
    expect(b.versiones[0]?.origen).toBe('cache');
    expect(ff.pedidas.length).toBe(pedidas);
  });

  it('con el TTL vencido consulta de nuevo; `refrescar` también', async () => {
    const { c, ff } = catalogoCon(rutasOficiales());
    await c.listar('mailpit');
    ahora = new Date(HOY.getTime() + TTL_CATALOGO_MS + 1000);
    expect((await c.listar('mailpit')).origen).toBe('vivo');
    expect((await c.listar('mailpit', { refrescar: true })).origen).toBe('vivo');
    expect(ff.pedidas.filter((u) => u.includes('api.github.com'))).toHaveLength(3);
  });

  it('sin red usa la caché aunque esté vencida; sin caché, la lista fija', async () => {
    await catalogoCon(rutasOficiales()).c.listar('mailpit');
    ahora = new Date(HOY.getTime() + 10 * TTL_CATALOGO_MS);
    const sinRed = catalogoCon({}, true).c;
    expect(await sinRed.listar('mailpit')).toMatchObject({
      origen: 'cache',
      fecha: HOY.toISOString(),
    });
    const fija = await sinRed.listar('redis');
    expect(fija.origen).toBe('fija');
    expect(fija.fecha).toBeNull();
    expect(fija.versiones[0]).toMatchObject({
      version: catalogo.redis[0]!.version,
      sha256: catalogo.redis[0]!.sha256,
      huella: { algoritmo: 'sha256', valor: catalogo.redis[0]!.sha256 },
      origen: 'fija',
    });
  });

  it('un índice manipulado (URL ajena, huella de 63, asset de otro repo) cae a la caché o a la lista fija', async () => {
    const releases = (): {
      assets: { browser_download_url: string; digest: string | null }[];
    }[] => JSON.parse(fixture('github-mailpit.json')) as never;
    const urlMailpit = 'https://api.github.com/repos/axllent/mailpit/releases?per_page=30';
    const manipulados: string[] = [];
    {
      const r = releases();
      r[0]!.assets[0]!.digest = `sha256:${'a'.repeat(63)}`;
      manipulados.push(JSON.stringify(r));
    }
    {
      const r = releases();
      r[1]!.assets[0]!.browser_download_url = 'https://evil.example/mailpit-windows-amd64.zip';
      manipulados.push(JSON.stringify(r));
    }
    {
      const r = releases();
      r[0]!.assets[0]!.browser_download_url =
        'https://github.com/evil/mailpit/releases/download/v1.34.0/mailpit-windows-amd64.zip';
      manipulados.push(JSON.stringify(r));
    }
    manipulados.push('{"no": "es una lista"}', 'esto no es JSON');
    for (const cuerpo of manipulados) {
      // Sin caché: lista fija.
      rutas = new Rutas(await carpetaTemporal('pel-vivo-'));
      const sinCache = await catalogoCon({ [urlMailpit]: cuerpo }).c.listar('mailpit');
      expect(sinCache.origen, cuerpo.slice(0, 60)).toBe('fija');
      expect(sinCache.versiones.map((v) => v.version)).toEqual(
        catalogo.mailpit.map((v) => v.version),
      );
      // Con caché (aunque vigente se pida refrescar): la caché, y no se pisa.
      await catalogoCon(rutasOficiales()).c.listar('mailpit');
      const antes = await readFile(rutas.cacheCatalogo('mailpit'), 'utf8');
      const conCache = await catalogoCon({ [urlMailpit]: cuerpo }).c.listar('mailpit', {
        refrescar: true,
      });
      expect(conCache.origen).toBe('cache');
      expect(await readFile(rutas.cacheCatalogo('mailpit'), 'utf8')).toBe(antes);
    }
  });

  it('una caché alterada en disco no se usa', async () => {
    await catalogoCon(rutasOficiales()).c.listar('mailpit');
    const archivo = rutas.cacheCatalogo('mailpit');
    const g = JSON.parse(await readFile(archivo, 'utf8')) as { versiones: { url: string }[] };
    g.versiones[0]!.url = 'https://evil.example/mailpit.zip';
    await writeFile(archivo, JSON.stringify(g));
    const r = await catalogoCon({}, true).c.listar('mailpit');
    expect(r.origen).toBe('fija');
  });

  it('filtra por rama y oculta previews y ramas sin soporte salvo con `todas`', async () => {
    const { c } = catalogoCon(rutasOficiales());
    const def = await c.listar('node');
    expect(def.versiones.map((v) => v.rama)).toEqual(['26', '26', '24', '24', '22', '22']);
    const todas = await c.listar('node', { todas: true });
    expect(todas.versiones.map((v) => v.version)).toContain('27.0.0-alpha.0.1.1');
    expect(todas.versiones.map((v) => v.version)).toContain('25.9.0');
    expect(todas.versiones.map((v) => v.version)).toContain('20.20.2');
    expect((await c.listar('node', { rama: '24' })).versiones.map((v) => v.version)).toEqual([
      '24.22.3',
      '24.22.2',
    ]);
    expect(await c.ramas('node')).toEqual([
      { rama: '27', soporte: 'preview', finSoporte: null },
      { rama: '26', soporte: 'lts', finSoporte: '2029-04-30' },
      { rama: '25', soporte: 'fin', finSoporte: null },
      { rama: '24', soporte: 'lts', finSoporte: '2028-04-30' },
      { rama: '22', soporte: 'lts', finSoporte: '2027-04-30' },
      { rama: '20', soporte: 'fin', finSoporte: '2026-04-30' },
    ]);
  });

  it('buscar: completa una huella diferida al instalar; una versión desconocida es null', async () => {
    const { c, ff } = catalogoCon(rutasOficiales());
    // 24.22.2 no tiene SHASUMS en los fixtures (404): no se cae a "confirmar sin huella", es un
    // error que se puede reintentar.
    await expect(c.buscar('node', '24.22.2')).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_disponible',
    });
    const w = await c.buscar('node', '20.20.2');
    expect(w?.huella?.algoritmo).toBe('sha256');
    expect(w?.huellaDiferida).toBeUndefined();
    expect(ff.pedidas).toContain('https://nodejs.org/dist/v20.20.2/SHASUMS256.txt');
    expect(await c.buscar('node', '99.0.0')).toBeNull();
    expect(await c.buscar('xyz' as 'node', '1.0.0')).toBeNull();
  });

  it('buscar: si la fuente responde pero no publica la huella de esa versión, queda sin huella', async () => {
    const rutasHttp = rutasOficiales();
    rutasHttp['https://nodejs.org/dist/v24.22.2/SHASUMS256.txt'] = `${'e'.repeat(64)}  otro.zip
`;
    const v = await catalogoCon(rutasHttp).c.buscar('node', '24.22.2');
    expect(v?.huella).toBeNull();
    expect(v?.huellaDiferida).toBeUndefined();
  });

  it('buscar: sin red al pedir la huella diferida (Node o NuGet) es un error, nunca "sin huella"', async () => {
    const { c } = catalogoCon(rutasOficiales());
    await c.listar('python', { todas: true });
    const fuentes = { ...rutasOficiales() };
    for (const k of Object.keys(fuentes)) if (k.includes('registration5')) delete fuentes[k];
    const { c: c2 } = catalogoCon(fuentes);
    // Se usa el índice en caché (el mismo directorio) y la hoja de NuGet no responde.
    const diferida = (await c2.listar('python', { todas: true })).versiones.find(
      (v) => v.huellaDiferida,
    );
    expect(diferida).toBeDefined();
    await expect(c2.buscar('python', diferida!.version)).rejects.toMatchObject({
      codigo: 'catalogo.huella_no_disponible',
    });
  });

  it('una versión en vivo sin huella que está en la lista fija con la misma URL toma su SHA-256', async () => {
    const fija = catalogo.node[0]!;
    const fuente: FuenteVersiones = {
      servicio: 'node',
      hostsIndice: ['nodejs.org'],
      listar: async () => [
        {
          servicio: 'node',
          version: fija.version,
          rama: fija.version.split('.')[0]!,
          url: fija.url,
          sha256: null,
          huella: null,
          huellaDiferida: true,
          formato: 'zip',
          subcarpeta: fija.subcarpeta!,
          ejecutable: fija.ejecutable,
          soporte: 'lts',
          origen: 'vivo',
        },
      ],
    };
    const c = new CatalogoVivo(rutas, plat, fetchFalso({}).f, {
      ahora: () => ahora,
      fuentes: { node: fuente },
    });
    const v = (await c.listar('node')).versiones[0]!;
    expect(v.huella).toEqual({ algoritmo: 'sha256', valor: fija.sha256 });
    expect(v.sha256).toBe(fija.sha256);
    expect(v.huellaDiferida).toBeUndefined();
  });

  it('servicios sin fuente en vivo salen de la lista fija; buscar también la usa', async () => {
    const { c, ff } = catalogoCon({});
    expect((await c.listar('nginx')).origen).toBe('fija');
    expect(await c.buscar('nginx', catalogo.nginx[0]!.version)).toMatchObject(
      listaFija('nginx')[0]!,
    );
    expect(ff.pedidas).toEqual([]);
  });

  it('dos consultas a la vez del mismo servicio comparten el pedido', async () => {
    const { c, ff } = catalogoCon(rutasOficiales());
    await Promise.all([c.listar('mailpit'), c.listar('mailpit'), c.buscar('mailpit', '1.34.0')]);
    expect(ff.pedidas.filter((u) => u.includes('api.github.com'))).toHaveLength(1);
  });
});
