import { describe, expect, it, vi } from 'vitest';
import { fuenteMariadb } from '../src/catalogo/fuentes/mariadb';
import {
  fuenteMongodb,
  FULL_JSON_MONGODB,
  versionesDeFullJson,
} from '../src/catalogo/fuentes/mongodb';
import {
  fuenteMysql,
  MAX_SONDEOS_MYSQL,
  md5DePaginaMysql,
  PAGINA_MYSQL,
} from '../src/catalogo/fuentes/mysql';
import { DESCARGAS_NGINX, fuenteNginx, versionesDeNginx } from '../src/catalogo/fuentes/nginx';
import { fuentePostgresql, VERSIONS_POSTGRESQL } from '../src/catalogo/fuentes/postgresql';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { catalogo } from '../src/catalogo/catalogo';
import { CatalogoVivo, validarIndice } from '../src/catalogo/vivo';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';
import { fetchFalso, fixture, HOY, rutasBd, type Ruta } from './catalogo-falso';

// En el CI de Windows el disco y el antivirus multiplican por ~20 el costo de crear carpetas y
// archivos temporales; ninguna prueba espera de verdad, así que el plazo de 5 s se queda corto.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const ctx = (
  rutas: Record<string, Ruta> = rutasBd(),
  previas?: VersionDisponible[],
): ContextoFuente & { pedidas: string[]; inits: (RequestInit | undefined)[] } => {
  const ff = fetchFalso(rutas);
  return {
    f: ff.f,
    idCatalogo: 'win-x64',
    ahora: HOY,
    pedidas: ff.pedidas,
    inits: ff.inits,
    ...(previas ? { previas } : {}),
  };
};

const mysqlZip = (v: string): string =>
  `https://cdn.mysql.com/Downloads/MySQL-${v.split('.').slice(0, 2).join('.')}/mysql-${v}-winx64.zip`;

describe('MySQL (sondeo en el CDN)', () => {
  it('sondea con HEAD desde el último parche conocido hasta el primer 404', async () => {
    const c = ctx();
    const v = await fuenteMysql.listar(c);
    expect(v.map((x) => x.version)).toEqual([
      '8.4.15',
      '8.4.14',
      '8.4.13',
      '8.0.46',
      '8.0.45',
      '8.0.44',
    ]);
    // Cada sondeo es un HEAD.
    const sondeos = c.pedidas
      .map((u, i) => ({ u, m: c.inits[i]?.method }))
      .filter((x) => x.u.startsWith('https://cdn.mysql.com/'));
    expect(sondeos.every((x) => x.m === 'HEAD')).toBe(true);
    expect(sondeos.map((x) => x.u)).toContain(mysqlZip('8.4.16'));
    expect(sondeos.map((x) => x.u)).not.toContain(mysqlZip('8.4.17'));
    expect(v[0]).toMatchObject({
      servicio: 'mysql',
      rama: '8.4',
      url: mysqlZip('8.4.15'),
      subcarpeta: 'mysql-8.4.15-winx64',
      ejecutable: 'bin/mysqld.exe',
      soporte: 'lts',
      finSoporte: '2032-04-30',
      huella: null,
    });
    // 8.0 terminó su soporte en abril de 2026.
    expect(v.find((x) => x.version === '8.0.46')?.soporte).toBe('fin');
    expect(() => validarIndice('mysql', v)).not.toThrow();
  });

  it(`no pasa de ${MAX_SONDEOS_MYSQL} sondeos por rama aunque todo responda 200`, async () => {
    const pedidas: string[] = [];
    const f = (async (u: string | URL) => {
      pedidas.push(String(u));
      return new Response(null, { status: String(u).includes('MySQL-8.0') ? 200 : 404 });
    }) as unknown as typeof fetch;
    const v = await fuenteMysql.listar({ f, idCatalogo: 'win-x64', ahora: HOY });
    expect(v.filter((x) => x.rama === '8.0')).toHaveLength(MAX_SONDEOS_MYSQL);
    expect(pedidas.filter((u) => u.includes('MySQL-8.0'))).toHaveLength(MAX_SONDEOS_MYSQL);
  });

  it('página de "Technical Difficulties" (403 o 200) → huella null', async () => {
    for (const estado of [403, 200]) {
      const rutas = rutasBd();
      rutas[PAGINA_MYSQL] = { estado, cuerpo: fixture('mysql-dificultades.html') };
      const v = await fuenteMysql.listar(ctx(rutas));
      expect(v.every((x) => x.huella === null)).toBe(true);
    }
  });

  it('página que responde con la forma esperada → MD5 (débil) de esa versión', async () => {
    const md5 = '0123456789abcdef0123456789abcdef';
    const pagina = `<table><tr><td class="col1"><div>Windows (x86, 64-bit), ZIP Archive</div><div class="sub-text">(mysql-8.4.15-winx64.zip)</div></td><td class="col3">8.4.15</td><td class="col4">265.7M</td><td class="col5"><a class="button03" href="/downloads/file/?id=1">Download</a></td></tr><tr><td class="md5 col1" colspan="5">MD5: <code class="md5">${md5}</code> | <a href="/downloads/gpg/?file=mysql-8.4.15-winx64.zip&amp;p=43">Signature</a></td></tr></table>`;
    const rutas = rutasBd();
    rutas[PAGINA_MYSQL] = pagina;
    const v = await fuenteMysql.listar(ctx(rutas));
    expect(v[0]?.huella).toEqual({ algoritmo: 'md5', valor: md5 });
    expect(v[0]?.sha256).toBeNull();
    expect(v.find((x) => x.version === '8.4.14')?.huella).toBeNull();
    expect(() => validarIndice('mysql', v)).not.toThrow();
    // Dos MD5 distintos para el mismo archivo: no se toma ninguno.
    expect(md5DePaginaMysql(pagina + pagina.replace(md5, 'f'.repeat(32)), '8.4.15')).toBeNull();
    expect(md5DePaginaMysql('MD5: <code class="md5">' + md5 + '</code>', '8.4.15')).toBeNull();
  });

  it('con la caché, sondea desde la última vista y conserva las anteriores sin pedirlas', async () => {
    const previa = (version: string): VersionDisponible => ({
      servicio: 'mysql',
      version,
      rama: '8.4',
      url: mysqlZip(version),
      sha256: null,
      huella: null,
      formato: 'zip',
      origen: 'cache',
    });
    const c = ctx(rutasBd(), [previa('8.4.14'), previa('8.4.15')]);
    const v = await fuenteMysql.listar(c);
    expect(v.filter((x) => x.rama === '8.4').map((x) => x.version)).toEqual(['8.4.15', '8.4.14']);
    expect(c.pedidas).not.toContain(mysqlZip('8.4.14'));
    expect(c.pedidas).toContain(mysqlZip('8.4.16'));
  });

  it('un sondeo que falla con 5xx hace fallar el índice (no es "no existe")', async () => {
    const rutas = rutasBd();
    rutas[mysqlZip('8.4.14')] = { estado: 503 };
    await expect(fuenteMysql.listar(ctx(rutas))).rejects.toThrow(/503/);
  });
});

describe('MariaDB (REST)', () => {
  it('ramas con estado y soporte; la última de cada rama contrastada con sha256sums.txt', async () => {
    const c = ctx();
    const v = await fuenteMariadb.listar(c);
    const de = (x: string): VersionDisponible | undefined => v.find((y) => y.version === x);
    expect(de('11.4.14')).toMatchObject({
      rama: '11.4',
      url: 'https://archive.mariadb.org/mariadb-11.4.14/winx64-packages/mariadb-11.4.14-winx64.zip',
      sha256: '9d9b410eb7b65f6616f29d933d76ee90cf7af4ba179a2d437e0f09f5bf6650df',
      huella: {
        algoritmo: 'sha256',
        valor: '9d9b410eb7b65f6616f29d933d76ee90cf7af4ba179a2d437e0f09f5bf6650df',
      },
      subcarpeta: 'mariadb-11.4.14-winx64',
      ejecutable: 'bin/mariadbd.exe',
      soporte: 'lts',
      finSoporte: '2029-05-29',
    });
    // Las anteriores de la rama se contrastan al instalar.
    expect(de('11.4.13')).toMatchObject({ huella: null, huellaDiferida: true });
    expect(de('12.3.4')?.soporte).toBe('lts');
    expect(de('13.1.1')?.soporte).toBe('preview');
    expect(c.pedidas).toContain(
      'https://archive.mariadb.org/mariadb-11.4.14/winx64-packages/sha256sums.txt',
    );
    expect(c.pedidas).not.toContain(
      'https://archive.mariadb.org/mariadb-11.4.13/winx64-packages/sha256sums.txt',
    );
    expect(() => validarIndice('mariadb', v)).not.toThrow();
  });

  it('si la suma de la REST no coincide con sha256sums.txt, el índice se descarta', async () => {
    const rutas = rutasBd();
    rutas['https://archive.mariadb.org/mariadb-11.4.14/winx64-packages/sha256sums.txt'] =
      `${'a'.repeat(64)}  ./mariadb-11.4.14-winx64.zip\n`;
    await expect(fuenteMariadb.listar(ctx(rutas))).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('completar: contrasta una versión anterior al instalar; sin coincidencia lanza', async () => {
    const v = (await fuenteMariadb.listar(ctx())).find((x) => x.version === '11.4.13')!;
    const suma = 'd62986d433eeebfde218560b276103831604a61e929e87f1a17f5aebd80257e2';
    const rutas = rutasBd();
    rutas['https://archive.mariadb.org/mariadb-11.4.13/winx64-packages/sha256sums.txt'] =
      `${suma}  ./mariadb-11.4.13-winx64.zip\n`;
    expect(await fuenteMariadb.completar!(v, ctx(rutas))).toEqual({
      algoritmo: 'sha256',
      valor: suma,
    });
    rutas['https://archive.mariadb.org/mariadb-11.4.13/winx64-packages/sha256sums.txt'] =
      `${'b'.repeat(64)}  ./mariadb-11.4.13-winx64.zip\n`;
    await expect(fuenteMariadb.completar!(v, ctx(rutas))).rejects.toBeInstanceOf(IndiceMalformado);
  });
});

describe('PostgreSQL (versions.json + EDB)', () => {
  it('ramas con soporte y dos sin soporte; sufijo de EDB sondeado con HEAD', async () => {
    const c = ctx();
    const v = await fuentePostgresql.listar(c);
    expect(v.map((x) => `${x.version}:${x.soporte}`)).toEqual([
      '19.0:actual',
      '18.7:actual',
      '17.12:actual',
      '16.16:actual',
      '15.20:actual',
      '14.25:fin',
    ]);
    // 13.23 no tiene binarios de EDB: no se ofrece.
    expect(c.pedidas).toContain(
      'https://get.enterprisedb.com/postgresql/postgresql-13.23-1-windows-x64-binaries.zip',
    );
    // 17.12: la lista fija usa "-1" (con su SHA-256) aunque exista "-2".
    expect(v.find((x) => x.version === '17.12')?.url).toBe(catalogo.postgresql[0]!.url);
    // 18.7 tiene "-1" y "-2": se usa la compilación más nueva.
    expect(v.find((x) => x.version === '18.7')).toMatchObject({
      rama: '18',
      url: 'https://get.enterprisedb.com/postgresql/postgresql-18.7-2-windows-x64-binaries.zip',
      huella: null,
      sha256: null,
      ejecutable: 'pgsql/bin/postgres.exe',
      finSoporte: '2030-11-14',
    });
    expect(() => validarIndice('postgresql', v)).not.toThrow();
  });

  it('versions.json con forma rara descarta el índice', async () => {
    const rutas = rutasBd();
    rutas[VERSIONS_POSTGRESQL] = JSON.stringify({ versiones: [] });
    await expect(fuentePostgresql.listar(ctx(rutas))).rejects.toBeInstanceOf(IndiceMalformado);
  });
});

describe('MongoDB (full.json en flujo)', () => {
  it('solo Windows x86_64 de la comunidad en fastdl, con archive.sha256', async () => {
    const v = await fuenteMongodb.listar(ctx());
    expect(v.map((x) => `${x.version}:${x.soporte}`)).toEqual([
      '9.0.8:actual',
      '9.0.7:actual',
      '9.0.4:actual',
      '9.0.2:actual',
      '9.0.0-rc0:preview',
      '8.3.17:actual',
      '8.3.16:actual',
      '8.3.13:actual',
      '8.1.3:preview',
      '8.0.38:actual',
      '6.0.30:actual',
    ]);
    expect(v.every((x) => x.url.startsWith('https://fastdl.mongodb.org/windows/'))).toBe(true);
    const fija = catalogo.mongodb[0]!;
    expect(v.find((x) => x.version === fija.version)).toMatchObject({
      url: fija.url,
      sha256: fija.sha256,
      huella: { algoritmo: 'sha256', valor: fija.sha256 },
      subcarpeta: fija.subcarpeta,
      ejecutable: 'bin/mongod.exe',
      rama: '8.0',
    });
    expect(() => validarIndice('mongodb', v)).not.toThrow();
  });

  it('el lector en flujo da lo mismo con trozos pequeños (cadenas y escapes partidos)', async () => {
    const texto = fixture('mongodb-full.json');
    const bytes = Buffer.from(texto, 'utf8');
    const enTrozos = (n: number): Response =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(c) {
            for (let i = 0; i < bytes.length; i += n) c.enqueue(bytes.subarray(i, i + n));
            c.close();
          },
        }),
      );
    const entero = await versionesDeFullJson(new Response(texto));
    expect(await versionesDeFullJson(enTrozos(7))).toEqual(entero);
    expect(await versionesDeFullJson(enTrozos(1))).toEqual(entero);
    expect(entero.length).toBe(11);
  });

  it('un full.json más grande que el tope se corta (anunciado o no)', async () => {
    const texto = fixture('mongodb-full.json');
    await expect(versionesDeFullJson(new Response(texto), 1000)).rejects.toMatchObject({
      codigo: 'catalogo.respuesta_grande',
    });
    const anunciado = new Response('{}', { headers: { 'content-length': String(10 ** 9) } });
    await expect(versionesDeFullJson(anunciado)).rejects.toMatchObject({
      codigo: 'catalogo.respuesta_grande',
    });
  });

  it('full.json cortado a la mitad o sin "versions" descarta el índice', async () => {
    const texto = fixture('mongodb-full.json');
    await expect(
      versionesDeFullJson(new Response(texto.slice(0, texto.length / 2))),
    ).rejects.toBeInstanceOf(IndiceMalformado);
    await expect(versionesDeFullJson(new Response('{"otra": []}'))).rejects.toBeInstanceOf(
      IndiceMalformado,
    );
  });

  it('una descarga de Windows fuera de fastdl no se toma', async () => {
    const full = JSON.parse(fixture('mongodb-full.json')) as {
      versions: { downloads: { target?: string; archive?: { url: string } }[] }[];
    };
    for (const d of full.versions[0]!.downloads) {
      if (d.target === 'windows' && d.archive) d.archive.url = 'https://evil.example/m.zip';
    }
    const rutas = rutasBd();
    rutas[FULL_JSON_MONGODB] = JSON.stringify(full);
    const v = await fuenteMongodb.listar(ctx(rutas));
    expect(v.map((x) => x.version)).not.toContain('9.0.8');
  });
});

describe('Nginx (página de descargas)', () => {
  it('mainline, stable y legacy → actual, lts y fin; sin huella', async () => {
    const v = await fuenteNginx.listar(ctx());
    expect(v[0]).toMatchObject({
      version: '1.31.10',
      rama: '1.31',
      url: 'https://nginx.org/download/nginx-1.31.10.zip',
      soporte: 'actual',
      huella: null,
      subcarpeta: 'nginx-1.31.10',
      ejecutable: 'nginx.exe',
    });
    expect(v.find((x) => x.version === '1.30.8')?.soporte).toBe('lts');
    expect(v.find((x) => x.version === '1.28.3')?.soporte).toBe('fin');
    expect(v.find((x) => x.version === '1.12.2')?.soporte).toBe('fin');
    expect(() => validarIndice('nginx', v)).not.toThrow();
  });

  it('una página sin mainline o stable descarta el índice', () => {
    const html = fixture('nginx-download.html').replace('Mainline version', 'Otra cosa');
    expect(() => versionesDeNginx(html)).toThrow(IndiceMalformado);
    const rutas = rutasBd();
    rutas[DESCARGAS_NGINX] = '<html>mantenimiento</html>';
    return expect(fuenteNginx.listar(ctx(rutas))).rejects.toBeInstanceOf(IndiceMalformado);
  });
});

describe('otro sistema (Etapa E)', () => {
  it('sin versiones en vivo y sin consultas', async () => {
    const ff = fetchFalso(rutasBd());
    for (const f of [fuenteMysql, fuenteMariadb, fuentePostgresql, fuenteMongodb, fuenteNginx]) {
      expect(await f.listar({ f: ff.f, idCatalogo: 'linux-x64', ahora: HOY })).toEqual([]);
    }
    expect(ff.pedidas).toEqual([]);
  });
});

describe('CatalogoVivo con las fuentes de bases de datos y Nginx', () => {
  const nuevo = async (): Promise<CatalogoVivo> => {
    const rutas = new Rutas(await carpetaTemporal('pel-bd-'));
    await rutas.asegurar();
    return new CatalogoVivo(rutas, { idCatalogo: () => 'win-x64' }, fetchFalso(rutasBd()).f, {
      ahora: () => HOY,
    });
  };

  it('MariaDB: previews (Preview/RC) ocultas sin `todas`', async () => {
    const c = await nuevo();
    const def = await c.listar('mariadb');
    expect(def.origen).toBe('vivo');
    expect(def.versiones.map((v) => v.rama)).not.toContain('13.1');
    const todas = await c.listar('mariadb', { todas: true });
    expect(todas.versiones.map((v) => v.version)).toContain('13.1.1');
  });

  it('Nginx y PostgreSQL: la versión de la lista fija conserva su SHA-256; las nuevas, sin huella', async () => {
    const c = await nuevo();
    const nginx = (await c.listar('nginx', { todas: true })).versiones;
    const fija = catalogo.nginx[0]!;
    expect(nginx.find((v) => v.version === fija.version)).toMatchObject({
      sha256: fija.sha256,
      origen: 'fija',
      rama: '1.30',
      soporte: 'lts',
    });
    expect(nginx.find((v) => v.version === '1.30.8')?.huella).toBeNull();
    const pg = (await c.listar('postgresql')).versiones;
    expect(pg.find((v) => v.version === '17.12')).toMatchObject({
      origen: 'vivo',
      sha256: catalogo.postgresql[0]!.sha256,
      rama: '17',
    });
    expect(pg.filter((v) => v.version === '17.12')).toHaveLength(1);
  });

  it('MySQL: 8.4.13 de la lista fija toma su SHA-256; MongoDB trae huella fuerte', async () => {
    const c = await nuevo();
    const my = (await c.listar('mysql')).versiones;
    expect(my.find((v) => v.version === '8.4.13')?.sha256).toBe(catalogo.mysql[0]!.sha256);
    expect(my.find((v) => v.version === '8.4.15')?.huella).toBeNull();
    const mongo = (await c.listar('mongodb')).versiones;
    expect(mongo.every((v) => v.huella?.algoritmo === 'sha256')).toBe(true);
  });
});

describe('Costo de las consultas (menores de la Task 17)', () => {
  const nuevo = async (f: typeof fetch, reloj: () => Date) => {
    const rutas = new Rutas(await carpetaTemporal('pel-costo-'));
    await rutas.asegurar();
    return {
      rutas,
      c: new CatalogoVivo(rutas, { idCatalogo: () => 'win-x64' }, f, { ahora: reloj }),
    };
  };

  it('MongoDB: guarda ETag y Last-Modified, los manda al volver y un 304 renueva la fecha de la caché', async () => {
    let ahora = HOY;
    const cuerpos: (string | null)[] = [];
    const encabezados: Headers[] = [];
    const ff = fetchFalso({
      ...rutasBd(),
      [FULL_JSON_MONGODB]: () => {
        const h = new Headers(ff.inits.at(-1)?.headers);
        encabezados.push(h);
        if (h.get('if-none-match') === '"v1"') {
          cuerpos.push(null);
          return new Response(null, { status: 304 });
        }
        cuerpos.push('full');
        return new Response(fixture('mongodb-full.json'), {
          headers: { etag: '"v1"', 'last-modified': 'Mon, 23 Nov 2026 10:00:00 GMT' },
        });
      },
    });
    const { c } = await nuevo(ff.f, () => ahora);
    const a = await c.listar('mongodb');
    expect(a.origen).toBe('vivo');
    expect(encabezados[0]?.get('if-none-match')).toBeNull();
    // La caché de MongoDB dura 48 h: a las 30 h no se consulta.
    ahora = new Date(HOY.getTime() + 30 * 3600_000);
    expect((await c.listar('mongodb')).origen).toBe('cache');
    expect(cuerpos).toHaveLength(1);
    // Vencida: pide con los validadores; 304 → mismas versiones con la fecha renovada.
    ahora = new Date(HOY.getTime() + 49 * 3600_000);
    const b = await c.listar('mongodb');
    expect(encabezados[1]?.get('if-none-match')).toBe('"v1"');
    expect(encabezados[1]?.get('if-modified-since')).toBe('Mon, 23 Nov 2026 10:00:00 GMT');
    expect(cuerpos).toEqual(['full', null]);
    expect(b.origen).toBe('vivo');
    expect(b.fecha).toBe(ahora.toISOString());
    expect(b.versiones.map((v) => v.version)).toEqual(a.versiones.map((v) => v.version));
    // La fecha renovada vale: dentro de las 48 h siguientes, otra vez de la caché.
    ahora = new Date(ahora.getTime() + 47 * 3600_000);
    expect((await c.listar('mongodb')).origen).toBe('cache');
    expect(cuerpos).toHaveLength(2);
  });

  it('un 304 sin caché válida no deja el catálogo vacío (cae a la lista fija)', async () => {
    const ff = fetchFalso({ [FULL_JSON_MONGODB]: () => new Response(null, { status: 304 }) });
    const { c } = await nuevo(ff.f, () => HOY);
    const r = await c.listar('mongodb');
    expect(r.origen).toBe('fija');
  });

  it('MySQL: la página de descargas que no responde no se vuelve a pedir dentro del TTL', async () => {
    let ahora = HOY;
    const ff = fetchFalso(rutasBd());
    const { c } = await nuevo(ff.f, () => ahora);
    await c.listar('mysql', { refrescar: true });
    expect(ff.pedidas.filter((u) => u === PAGINA_MYSQL)).toHaveLength(1);
    ahora = new Date(HOY.getTime() + 3600_000);
    await c.listar('mysql', { refrescar: true });
    expect(ff.pedidas.filter((u) => u === PAGINA_MYSQL)).toHaveLength(1);
    // Pasado el TTL se vuelve a probar.
    ahora = new Date(HOY.getTime() + 7 * 3600_000);
    await c.listar('mysql', { refrescar: true });
    expect(ff.pedidas.filter((u) => u === PAGINA_MYSQL)).toHaveLength(2);
  });
});
