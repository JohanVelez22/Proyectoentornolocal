import { mkdir, open, readFile, rename, symlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  decodificarTextoAjeno,
  esRutaLocalAbsoluta,
  esRutaProtegida,
  leerConfigAjena,
  MAX_ARCHIVOS_VHOSTS,
  MAX_BYTES_CONFIG,
} from '../src/importar/comun';
import {
  detectarConProblemas,
  detectarImportables,
  type CandidatoImportar,
} from '../src/importar/detectar';
import { leerVhostsApache, leerVhostsNginx } from '../src/importar/vhostsApache';
import { carpetaTemporal } from './temporales';
import { copiarFixture, hashArbol } from './importar-ayuda';

const porNombre = (l: CandidatoImportar[], n: string): CandidatoImportar => {
  const c = l.find((x) => x.nombre === n);
  if (!c) throw new Error(`falta el candidato ${n}: ${l.map((x) => x.nombre).join(', ')}`);
  return c;
};

describe('detectarImportables: Laragon', () => {
  it('dos vhosts (Nginx y Apache) dan dos sitios con dominio, PHP y base; la carpeta sin vhost también aparece', async () => {
    const raiz = await copiarFixture('laragon');
    const r = await detectarConProblemas(raiz, 'laragon');
    const tienda = porNombre(r.candidatos, 'tienda');
    // El vhost apunta a tienda/public: el sitio es la raíz del proyecto.
    expect(path.basename(tienda.carpeta)).toBe('tienda');
    expect(tienda).toMatchObject({
      programa: 'laragon',
      dominio: 'tienda.test',
      php: '8.2.20',
      base: { motor: 'mysql', nombre: 'tienda_db' },
    });
    const blog = porNombre(r.candidatos, 'blog');
    expect(blog).toMatchObject({ dominio: 'blog.test', base: { nombre: 'blog_wp' } });
    const solo = porNombre(r.candidatos, 'solo');
    expect(solo.dominio).toBeNull();
    expect(solo.avisos).toContain('sin_vhost');
    expect(r.candidatos).toHaveLength(3);
    expect(r.problemas).toEqual([]);
    // El id sale de la carpeta y no lleva rutas.
    expect(tienda.id).toMatch(/^laragon-[0-9a-f]{12}$/);
    expect(new Set(r.candidatos.map((c) => c.id)).size).toBe(3);
  });

  it('sin laragon.ini usa el PHP más nuevo de bin/php', async () => {
    const raiz = await copiarFixture('laragon');
    await rename(path.join(raiz, 'usr', 'laragon.ini'), path.join(raiz, 'laragon.ini.bak'));
    const l = await detectarImportables(raiz, 'laragon');
    expect(porNombre(l, 'tienda').php).toBe('8.3.1');
  });

  it('una raíz que no existe da una lista vacía', async () => {
    expect(
      await detectarImportables(path.join(await carpetaTemporal('pel-imp-'), 'x'), 'laragon'),
    ).toEqual([]);
  });

  it('detectar no modifica nada de la instalación', async () => {
    const raiz = await copiarFixture('laragon');
    const antes = await hashArbol(raiz);
    await detectarConProblemas(raiz, 'laragon');
    expect(await hashArbol(raiz)).toBe(antes);
  });
});

describe.skipIf(process.platform !== 'win32')('rutas con nombres cortos (8.3) de Windows', () => {
  async function conNombreCorto(
    programa: 'laragon' | 'xampp',
  ): Promise<{ corto: string; largo: string } | null> {
    const base = await carpetaTemporal('pel-nombre-bastante-largo-');
    const largo = await copiarFixture(programa, path.join(base, programa));
    try {
      const corto = execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${largo}').ShortPath`,
        ],
        { encoding: 'utf8', windowsHide: true },
      ).trim();
      // El volumen puede no crear nombres cortos: entonces no hay nada que comprobar.
      return corto.toLowerCase() === largo.toLowerCase() ? null : { corto, largo };
    } catch {
      return null;
    }
  }

  it('Laragon: una raíz con nombre corto detecta lo mismo que con el largo (como el %TEMP% del CI)', async () => {
    const r = await conNombreCorto('laragon');
    if (!r) return;
    const l = await detectarImportables(r.corto, 'laragon');
    expect(porNombre(l, 'tienda').dominio).toBe('tienda.test');
    expect(l.map((c) => c.nombre).sort()).toEqual(['blog', 'solo', 'tienda']);
  });

  it('XAMPP: el vhost de localhost (htdocs entera) no es un sitio aunque se escriba con otro nombre', async () => {
    const r = await conNombreCorto('xampp');
    if (!r) return;
    const l = await detectarImportables(r.corto, 'xampp');
    expect(l.map((c) => c.nombre)).not.toContain('htdocs');
    expect(porNombre(l, 'miapp').dominio).toBe('miapp.local');
  });
});

describe('detectarImportables: XAMPP', () => {
  async function xamppUtf16(orden: 'le' | 'be' | 'le-sin-bom'): Promise<string> {
    const raiz = await copiarFixture('xampp');
    const archivo = path.join(raiz, 'apache', 'conf', 'extra', 'httpd-vhosts.conf');
    const texto = await readFile(archivo, 'utf8');
    const le = Buffer.from(texto, 'utf16le');
    const salida =
      orden === 'le'
        ? Buffer.concat([Buffer.from([0xff, 0xfe]), le])
        : orden === 'be'
          ? Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(le).swap16()])
          : le;
    await writeFile(archivo, salida);
    return raiz;
  }

  it('httpd-vhosts.conf en UTF-16 con BOM (LE y BE) y sin BOM se lee igual', async () => {
    for (const orden of ['le', 'be', 'le-sin-bom'] as const) {
      const raiz = await xamppUtf16(orden);
      const l = await detectarImportables(raiz, 'xampp');
      const miapp = porNombre(l, 'miapp');
      expect(miapp, orden).toMatchObject({
        programa: 'xampp',
        dominio: 'miapp.local',
        php: '8.2.12',
        base: { motor: 'mariadb', nombre: 'miapp_ci' },
      });
    }
  });

  it('UTF-8 con BOM también', async () => {
    const raiz = await copiarFixture('xampp');
    const archivo = path.join(raiz, 'apache', 'conf', 'extra', 'httpd-vhosts.conf');
    await writeFile(
      archivo,
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), await readFile(archivo)]),
    );
    expect(porNombre(await detectarImportables(raiz, 'xampp'), 'miapp').dominio).toBe(
      'miapp.local',
    );
  });

  it('un DocumentRoot fuera (C:\\Windows, un recurso de red o una carpeta que no existe) se descarta con su código', async () => {
    const raiz = await copiarFixture('xampp');
    const r = await detectarConProblemas(raiz, 'xampp');
    const nombres = r.candidatos.map((c) => c.nombre);
    expect(nombres).not.toContain('System32');
    expect(nombres).not.toContain('web');
    expect(nombres).not.toContain('no-existe');
    const codigos = r.problemas.map((p) => p.codigo);
    expect(codigos.filter((c) => c === 'importar.ruta_fuera')).toHaveLength(2);
    expect(codigos).toContain('importar.carpeta_invalida');
    // Los problemas nombran el archivo, relativo a la instalación, y nunca su contenido.
    for (const p of r.problemas) expect(path.isAbsolute(p.donde)).toBe(false);
    // `localhost` (la carpeta htdocs entera) no es un sitio; las carpetas sin vhost sí.
    expect(nombres).not.toContain('htdocs');
    expect(porNombre(r.candidatos, 'otro').avisos).toContain('sin_vhost');
  });

  it('un archivo de configuración de 50 MB no se lee entero: error con código y el resto sigue', async () => {
    const raiz = await copiarFixture('xampp');
    const grande = path.join(raiz, 'apache', 'conf', 'sites-enabled', 'enorme.conf');
    await mkdir(path.dirname(grande), { recursive: true });
    const f = await open(grande, 'w');
    await f.truncate(50 * 1024 * 1024);
    await f.close();
    const inicio = Date.now();
    const r = await detectarConProblemas(raiz, 'xampp');
    expect(Date.now() - inicio).toBeLessThan(5000);
    expect(r.problemas).toContainEqual({
      codigo: 'importar.archivo_grande',
      donde: path.join('apache', 'conf', 'sites-enabled', 'enorme.conf'),
    });
    expect(porNombre(r.candidatos, 'miapp').dominio).toBe('miapp.local');
  });

  it('un archivo binario o con tuberías raras se descarta sin colgarse', async () => {
    const raiz = await copiarFixture('xampp');
    const dir = path.join(raiz, 'apache', 'conf', 'sites-enabled');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'binario.conf'),
      Buffer.from([0x00, 0x01, 0x02, 0xff, 0x00, 0x00, 0x7f, 0x00]),
    );
    await mkdir(path.join(dir, 'carpeta.conf'));
    const r = await detectarConProblemas(raiz, 'xampp');
    expect(r.problemas.map((p) => p.codigo)).toContain('importar.archivo_ilegible');
    expect(porNombre(r.candidatos, 'miapp').dominio).toBe('miapp.local');
  });

  it('más archivos de vhosts que el tope: se leen los primeros y se avisa', async () => {
    const raiz = await copiarFixture('xampp');
    const dir = path.join(raiz, 'apache', 'conf', 'sites-enabled');
    await mkdir(dir, { recursive: true });
    for (let i = 0; i < MAX_ARCHIVOS_VHOSTS + 20; i++) {
      await writeFile(path.join(dir, `v${String(i).padStart(4, '0')}.conf`), '# nada\n');
    }
    const r = await detectarConProblemas(raiz, 'xampp');
    expect(r.problemas.map((p) => p.codigo)).toContain('importar.demasiados');
  });

  it('un .env de 2 MB en un proyecto no se lee: la base queda sin detectar y se avisa', async () => {
    const raiz = await copiarFixture('xampp');
    await writeFile(
      path.join(raiz, 'htdocs', 'miapp', '.env'),
      `DB_DATABASE=${'x'.repeat(2 * 1024 * 1024)}\n`,
    );
    const r = await detectarConProblemas(raiz, 'xampp');
    expect(r.problemas.map((p) => p.codigo)).toContain('importar.archivo_grande');
    expect(porNombre(r.candidatos, 'miapp').base).not.toBeNull(); // sigue la de database.php
  });
});

describe('detectarImportables: Herd', () => {
  it('lee los paths de config.json, deduce el dominio de la carpeta y el PHP aislado', async () => {
    const raiz = await copiarFixture('herd');
    const r = await detectarConProblemas(raiz, 'herd');
    const api = porNombre(r.candidatos, 'api');
    expect(api).toMatchObject({ programa: 'herd', dominio: 'api.test', php: '8.2' });
    // La base es PostgreSQL: no se importa desde otros programas.
    expect(api.base).toBeNull();
    expect(api.avisos).toContain('motor_no_soportado');
    const web = porNombre(r.candidatos, 'web');
    expect(web).toMatchObject({ dominio: 'web.test', php: '8.3', base: { nombre: 'web_db' } });
    // Un nombre que no sirve de dominio no inventa uno.
    const raro = porNombre(r.candidatos, 'Mi Sitio Raro');
    expect(raro.dominio).toBeNull();
    expect(raro.avisos).toContain('dominio_invalido');
    // `C:/Users` (el perfil entero) y una ruta relativa no son carpetas de sitios.
    expect(r.problemas.map((p) => p.codigo)).toContain('importar.ruta_fuera');
    expect(r.candidatos).toHaveLength(3);
  });

  it('la carpeta de sitios sola (~/Herd) también se detecta', async () => {
    const raiz = await copiarFixture('herd');
    const l = await detectarImportables(path.join(raiz, 'sitios'), 'herd');
    expect(l.map((c) => c.nombre).sort()).toEqual(['Mi Sitio Raro', 'api', 'web']);
  });

  it('la carpeta de configuración sin config.json no lista sus propias carpetas como sitios', async () => {
    const base = await carpetaTemporal('pel-imp-');
    const raiz = path.join(base, '.config', 'herd');
    await mkdir(path.join(raiz, 'bin'), { recursive: true });
    expect(await detectarImportables(raiz, 'herd')).toEqual([]);
  });
});

describe('entradas no confiables', () => {
  it('una unión o un enlace dentro de la instalación que sale a una carpeta prohibida no se vincula', async () => {
    const raiz = await copiarFixture('laragon');
    const protegida = await carpetaTemporal('pel-datos-');
    await writeFile(path.join(protegida, 'secreto.txt'), 'x');
    try {
      await symlink(protegida, path.join(raiz, 'www', 'enlace'), 'junction');
    } catch {
      return; // sin permisos para crear enlaces en este equipo
    }
    const r = await detectarConProblemas(raiz, 'laragon', [protegida]);
    expect(r.candidatos.map((c) => c.nombre)).not.toContain('enlace');
    expect(r.problemas).toContainEqual({
      codigo: 'importar.ruta_fuera',
      donde: path.join('www', 'enlace'),
    });
    // Un enlace a otra carpeta de la misma instalación se resuelve y no duplica el sitio.
    await symlink(path.join(raiz, 'www', 'solo'), path.join(raiz, 'www', 'alias'), 'junction');
    const r2 = await detectarConProblemas(raiz, 'laragon');
    expect(r2.candidatos.filter((c) => c.nombre === 'solo')).toHaveLength(1);
    expect(r2.candidatos.map((c) => c.nombre)).not.toContain('alias');
  });

  it('un archivo de configuración que es un enlace a otro lado se rechaza', async () => {
    const raiz = await copiarFixture('xampp');
    const fuera = path.join(await carpetaTemporal('pel-fuera-'), 'otro.conf');
    await writeFile(
      fuera,
      '<VirtualHost *:80>\nServerName robado.local\nDocumentRoot "/x"\n</VirtualHost>\n',
    );
    const dir = path.join(raiz, 'apache', 'conf', 'sites-enabled');
    await mkdir(dir, { recursive: true });
    try {
      await symlink(fuera, path.join(dir, 'enlace.conf'), 'file');
    } catch {
      return;
    }
    const r = await detectarConProblemas(raiz, 'xampp');
    expect(r.problemas).toContainEqual({
      codigo: 'importar.ruta_fuera',
      donde: path.join('apache', 'conf', 'sites-enabled', 'enlace.conf'),
    });
    expect(r.candidatos.map((c) => c.dominio)).not.toContain('robado.local');
  });

  it('la clave de la base de un proyecto nunca sale en los candidatos ni en los problemas', async () => {
    const raiz = await copiarFixture('laragon');
    const r = await detectarConProblemas(raiz, 'laragon');
    expect(JSON.stringify(r)).not.toContain('clave-secreta-fixture');
  });

  it('un proyecto con base remota o de otro motor no propone importarla', async () => {
    const raiz = await copiarFixture('laragon');
    await writeFile(
      path.join(raiz, 'www', 'tienda', '.env'),
      'DB_CONNECTION=mysql\nDB_HOST=db.ejemplo.com\nDB_DATABASE=remota\n',
    );
    await writeFile(
      path.join(raiz, 'www', 'solo', '.env'),
      'DB_CONNECTION=mysql\nDB_DATABASE=bad;name\n',
    );
    const l = await detectarImportables(raiz, 'laragon');
    expect(porNombre(l, 'tienda')).toMatchObject({ base: null });
    expect(porNombre(l, 'tienda').avisos).toContain('base_no_local');
    expect(porNombre(l, 'solo').avisos).toContain('base_nombre_invalido');
  });
});

describe('leerConfigAjena y decodificarTextoAjeno', () => {
  it('rechaza lo que pesa más del tope sin leerlo y lo que crece mientras se lee', async () => {
    const d = await carpetaTemporal('pel-imp-');
    const grande = path.join(d, 'g.conf');
    const f = await open(grande, 'w');
    await f.truncate(MAX_BYTES_CONFIG + 1);
    await f.close();
    await expect(leerConfigAjena(grande, d)).rejects.toMatchObject({
      codigo: 'importar.archivo_grande',
    });
    const justo = path.join(d, 'j.conf');
    await writeFile(justo, 'a'.repeat(MAX_BYTES_CONFIG));
    expect((await leerConfigAjena(justo, d))!.length).toBe(MAX_BYTES_CONFIG);
    expect(await leerConfigAjena(path.join(d, 'no-existe'), d)).toBeNull();
  });

  it('rechaza una carpeta y un binario con su código', async () => {
    const d = await carpetaTemporal('pel-imp-');
    await mkdir(path.join(d, 'c'));
    await expect(leerConfigAjena(path.join(d, 'c'), d)).rejects.toBeInstanceOf(ErrorWolf);
    await writeFile(path.join(d, 'b.conf'), Buffer.from([1, 0, 2, 0, 0, 0, 255, 254]));
    await expect(leerConfigAjena(path.join(d, 'b.conf'), d)).rejects.toMatchObject({
      codigo: 'importar.archivo_ilegible',
    });
  });

  it('decodifica UTF-8, UTF-8 con BOM, UTF-16 con y sin BOM; lo binario da null', () => {
    const t = 'ServerName año.test\n';
    expect(decodificarTextoAjeno(Buffer.from(t))).toBe(t);
    expect(
      decodificarTextoAjeno(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(t)])),
    ).toBe(t);
    const le = Buffer.from(t, 'utf16le');
    expect(decodificarTextoAjeno(Buffer.concat([Buffer.from([0xff, 0xfe]), le]))).toBe(t);
    expect(
      decodificarTextoAjeno(Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(le).swap16()])),
    ).toBe(t);
    expect(decodificarTextoAjeno(le)).toBe(t);
    expect(decodificarTextoAjeno(Buffer.from(le).swap16())).toBe(t);
    expect(decodificarTextoAjeno(Buffer.from([0, 0, 0, 0, 0x41, 0, 0, 0]))).toBeNull();
  });
});

describe('rutas', () => {
  it('rutas locales absolutas: nunca UNC, dispositivos, flujos alternos ni relativas', () => {
    for (const ok of ['C:/laragon/www/x', 'D:\\sitios\\x', '/home/u/x']) {
      expect(esRutaLocalAbsoluta(ok), ok).toBe(true);
    }
    for (const mal of [
      '',
      'relativa/x',
      '//servidor/recurso',
      '\\\\servidor\\recurso',
      '\\\\?\\C:\\x',
      '\\\\.\\PhysicalDrive0',
      'C:x',
      'C:/x:flujo',
      'C:/x\u0000y',
    ]) {
      expect(esRutaLocalAbsoluta(mal), mal).toBe(false);
    }
  });

  it('carpetas protegidas', () => {
    for (const p of [
      'C:/Windows',
      'c:\\windows\\system32',
      'C:\\Program Files\\x',
      'C:\\Program Files (x86)',
      'C:\\ProgramData\\x',
      'C:/',
      'D:\\',
      'C:/Users',
      'C:/Users/ana',
      'C:/Users/ana/AppData/Roaming/x',
      '/etc/nginx',
      '/usr/share',
      '/',
      '/algo',
    ]) {
      expect(esRutaProtegida(p), p).toBe(true);
    }
    for (const p of [
      'C:/laragon/www/x',
      'C:/Users/ana/Herd/x',
      'D:/sitios',
      '/home/ana/sitios/x',
    ]) {
      expect(esRutaProtegida(p), p).toBe(false);
    }
  });
});

describe('vhosts de Apache y Nginx', () => {
  it('Apache: comentarios, continuaciones, Define, comillas y alias con comodín', () => {
    const v = leerVhostsApache(
      [
        '# <VirtualHost *:80> comentado',
        'Define RAIZ "C:/xampp"',
        '<VirtualHost *:80>',
        '  ServerName   Mi.Test:80',
        '  ServerAlias *.mi.test www.mi.test \\',
        '     otro.mi.test',
        '  DocumentRoot ${RAIZ}/htdocs/mi',
        '  DocumentRoot "C:/segundo"',
        '</VirtualHost>',
        '<VirtualHost *:80>',
        '  DocumentRoot "${NO_DEFINIDA}/x"',
        '</VirtualHost>',
      ].join('\n'),
    );
    expect(v).toHaveLength(2);
    expect(v[0]).toEqual({
      nombre: 'Mi.Test:80',
      alias: ['www.mi.test', 'otro.mi.test'],
      documentRoot: 'C:/xampp/htdocs/mi',
    });
    expect(v[1]!.documentRoot).toBe('${NO_DEFINIDA}/x');
  });

  it('Nginx: solo el nivel del server, no los location', () => {
    const v = leerVhostsNginx(
      [
        'server {',
        '  server_name a.test b.test;',
        '  root "C:/www/a/public";',
        '  location / { root /otra; }',
        '  location /x {',
        '    root /tercera;',
        '  }',
        '}',
        'server { server_name solo.test; }',
      ].join('\n'),
    );
    expect(v[0]).toEqual({ nombre: 'a.test', alias: ['b.test'], documentRoot: 'C:/www/a/public' });
  });

  it('una entrada enorme de líneas no se cuelga ni crece sin tope', () => {
    const t = '<VirtualHost *:80>\nServerName a.test\n</VirtualHost>\n'.repeat(5000);
    expect(leerVhostsApache(t).length).toBeLessThanOrEqual(1000);
    expect(leerVhostsNginx('server {\n'.repeat(100000)).length).toBeLessThanOrEqual(1000);
  });
});
