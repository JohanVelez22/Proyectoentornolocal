import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rename } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  catalogo,
  CatalogoSchema,
  ExtensionPhpSchema,
  type ExtensionPhpCatalogo,
} from '../src/catalogo/catalogo';
import {
  cambiarExtension,
  ExtensionesPhp,
  extensionesActivas,
  limpiarDllApartadas,
  varianteDeInfo,
  type DepsExtensionesPhp,
} from '../src/php/extensiones';
import { IniPhp } from '../src/php/ini';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const INFO_NTS = [
  'phpinfo()',
  'PHP Version => 8.4.13',
  'System => Windows NT EQUIPO 10.0 build 26300 (Windows 11) AMD64',
  'Build date => Oct  1 2026 10:00:00',
  'Compiler => Visual C++ 2022',
  'Architecture => x64',
  'Thread Safety => disabled',
].join('\r\n');
const INFO_TS_2019 = INFO_NTS.replace('Visual C++ 2022', 'Visual C++ 2019').replace(
  'Thread Safety => disabled',
  'Thread Safety => enabled',
);

const SALIDA_OK = 'PHP 8.4.13 (cli) (NTS Visual C++ 2022 x64)\nCopyright (c) The PHP Group\n';

describe('líneas de extensión en el ini', () => {
  const TEXTO = [
    'extension=curl',
    ';extension=gd',
    'extension=php_mbstring.dll',
    'extension="C:/x/ext/php_intl.dll"',
    '  ;  extension = sodium',
    'zend_extension=opcache',
    ';zend_extension=xdebug',
    '',
    '[Date]',
  ].join('\n');

  it('reconoce las formas habituales (nombre, php_x.dll, ruta entre comillas, zend_extension)', () => {
    expect([...extensionesActivas(TEXTO).entries()].sort()).toEqual(
      [
        ['curl', 'extension'],
        ['mbstring', 'extension'],
        ['intl', 'extension'],
        ['opcache', 'zend_extension'],
      ].sort(),
    );
  });

  it('activar descomenta la línea existente; desactivar comenta todas; si falta, la agrega', () => {
    const conGd = cambiarExtension(TEXTO, 'gd', true, false);
    expect(conGd.split('\n')[1]).toBe('extension=gd');
    const sinCurl = cambiarExtension(TEXTO, 'curl', false, false);
    expect(sinCurl.split('\n')[0]).toBe(';extension=curl');
    const conXdebug = cambiarExtension(TEXTO, 'xdebug', true, true);
    expect(conXdebug.split('\n')[6]).toBe('zend_extension=xdebug');
    const conSodium = cambiarExtension(TEXTO, 'sodium', true, false);
    expect(extensionesActivas(conSodium).has('sodium')).toBe(true);
    const conZip = cambiarExtension(TEXTO, 'zip', true, false);
    expect(conZip.split('\n')).toContain('extension=zip');
    // Agregada junto a las demás extensiones, no al final del archivo.
    expect(conZip.split('\n').indexOf('extension=zip')).toBe(7);
    expect(conZip.split('\n').at(-1)).toBe('[Date]');
    expect(cambiarExtension(TEXTO, 'curl', true, false)).toBe(TEXTO);
    expect(cambiarExtension(TEXTO, 'gd', false, false)).toBe(TEXTO);
  });
});

describe('variante de la compilación', () => {
  it('sale de php -i: NTS/TS, VS16/VS17 y arquitectura', () => {
    expect(varianteDeInfo(INFO_NTS)).toBe('nts-vs17-x64');
    expect(varianteDeInfo(INFO_TS_2019)).toBe('ts-vs16-x64');
    expect(varianteDeInfo('PHP Version => 8.4')).toBeNull();
    expect(varianteDeInfo(INFO_NTS.replace('x64', 'x86'))).toBeNull();
  });
});

describe('catálogo de extensiones de terceros', () => {
  it('las entradas del catálogo son de host permitido, con SHA-256 y NTS para cada rama', () => {
    expect(catalogo.extensionesPhp.length).toBeGreaterThan(0);
    for (const e of catalogo.extensionesPhp) {
      expect(new URL(e.url).protocol).toBe('https:');
      expect(e.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
    for (const rama of ['8.1', '8.2', '8.3', '8.4', '8.5']) {
      expect(
        catalogo.extensionesPhp.some(
          (e) => e.nombre === 'xdebug' && e.rama === rama && e.variante.startsWith('nts-'),
        ),
        rama,
      ).toBe(true);
    }
  });

  it('rechaza hosts no permitidos, huellas que no son SHA-256 y nombres raros', () => {
    const e = catalogo.extensionesPhp[0]!;
    expect(ExtensionPhpSchema.safeParse(e).success).toBe(true);
    for (const malo of [
      { ...e, url: 'https://evil.example/php_xdebug.dll' },
      { ...e, url: 'http://xdebug.org/files/php_xdebug.dll' },
      { ...e, sha256: 'abc' },
      { ...e, nombre: '../xdebug' },
      { ...e, variante: 'nts-vs15-x86' },
      { ...e, formato: 'zip', archivo: '../php_x.dll' },
    ]) {
      expect(ExtensionPhpSchema.safeParse(malo).success, JSON.stringify(malo)).toBe(false);
    }
    expect(
      CatalogoSchema.safeParse({ ...catalogo, extensionesPhp: [{ ...e, sha256: '' }] }).success,
    ).toBe(false);
  });
});

describe('ExtensionesPhp', () => {
  let rutas: Rutas;
  let ext: string;
  let ini: string;
  let llamadas: string[][];
  let info: string;
  let fetches: string[];
  let respuestas: Map<string, Response>;
  const DLL = Buffer.from('MZ dll de xdebug falsa');
  const HASH = createHash('sha256').update(DLL).digest('hex');

  const exec: Ejecutor = async (_cmd, args) => {
    llamadas.push(args);
    if (args.includes('-i')) return { codigo: 0, stdout: info, stderr: '' };
    return { codigo: 0, stdout: SALIDA_OK, stderr: '' };
  };

  const entrada = (o: Partial<ExtensionPhpCatalogo>): ExtensionPhpCatalogo => ({
    nombre: 'xdebug',
    version: '3.5.3',
    rama: '8.4',
    variante: 'nts-vs17-x64',
    url: 'https://xdebug.org/files/php_xdebug-3.5.3-8.4-nts-vs17-x86_64.dll',
    sha256: HASH,
    formato: 'archivo',
    zend: true,
    ...o,
  });

  let encendida: boolean;
  let sanos: boolean[];
  let reinicios: number;

  const crear = (cat: ExtensionPhpCatalogo[] = [], extra: Partial<DepsExtensionesPhp> = {}) => {
    const iniPhp = new IniPhp({
      rutas,
      exec,
      phpCli: (r) => path.join(rutas.bin('php', r), 'php'),
      ramasInstaladas: async () => ['8.4'],
      asegurarIni: async (r) => rutas.phpIni(r),
      encendida: () => encendida,
      reiniciar: async () => {
        reinicios++;
      },
      sano: async () => sanos.shift() ?? true,
    });
    return new ExtensionesPhp({
      rutas,
      ini: iniPhp,
      exec,
      phpCli: (r) => path.join(rutas.bin('php', r), 'php'),
      catalogo: cat,
      fetch: async (u) => {
        fetches.push(String(u));
        return respuestas.get(String(u)) ?? new Response('no', { status: 404 });
      },
      ...extra,
    });
  };

  beforeEach(async () => {
    rutas = new Rutas(await carpetaTemporal('pel-ext-'));
    ext = path.join(rutas.bin('php', '8.4'), 'ext');
    mkdirSync(ext, { recursive: true });
    for (const n of ['curl', 'gd', 'intl', 'opcache'])
      writeFileSync(path.join(ext, `php_${n}.dll`), '');
    writeFileSync(path.join(ext, 'libcrypto.dll'), '');
    ini = rutas.phpIni('8.4');
    mkdirSync(path.dirname(ini), { recursive: true });
    writeFileSync(
      ini,
      'extension=curl\n;extension=gd\nextension=mbstring\nzend_extension=opcache\n',
    );
    llamadas = [];
    encendida = false;
    sanos = [];
    reinicios = 0;
    info = INFO_NTS;
    fetches = [];
    respuestas = new Map();
  });

  it('lista las del ext/ con su estado, las que faltan y las del catálogo', async () => {
    const lista = await crear([entrada({}), entrada({ rama: '8.3' })]).listar('8.4');
    expect(lista).toEqual([
      { nombre: 'curl', activa: true, archivo: 'php_curl.dll', origen: 'incluida' },
      { nombre: 'gd', activa: false, archivo: 'php_gd.dll', origen: 'incluida' },
      { nombre: 'intl', activa: false, archivo: 'php_intl.dll', origen: 'incluida' },
      { nombre: 'mbstring', activa: true, archivo: null, origen: 'incluida' },
      { nombre: 'opcache', activa: true, archivo: 'php_opcache.dll', origen: 'incluida' },
      { nombre: 'xdebug', activa: false, archivo: null, origen: 'catalogo' },
    ]);
  });

  it('activar y desactivar editan el ini con prueba y copia; no activa lo que no está en ext/', async () => {
    const x = crear();
    await x.activar('8.4', 'gd', true);
    expect(readFileSync(ini, 'utf8')).toContain('\nextension=gd\n');
    await x.activar('8.4', 'curl', false);
    expect(readFileSync(ini, 'utf8')).toContain(';extension=curl');
    expect(llamadas.filter((a) => a.includes('-v'))).toHaveLength(2);
    // mbstring falta en ext/: se puede desactivar, no activar otra cosa que falte.
    await x.activar('8.4', 'mbstring', false);
    await expect(x.activar('8.4', 'redis', true)).rejects.toMatchObject({
      codigo: 'php.extension_no_existe',
    });
    for (const malo of ['../gd', 'GD;x', '', 'a'.repeat(65)]) {
      await expect(x.activar('8.4', malo, true)).rejects.toMatchObject({
        codigo: 'php.argumento_invalido',
      });
    }
  });

  it('instalar elige la variante de la compilación (php -n -i), verifica la huella y activa', async () => {
    const nts = entrada({});
    const ts = entrada({
      variante: 'ts-vs17-x64',
      url: 'https://xdebug.org/files/php_xdebug-3.5.3-8.4-ts-vs17-x86_64.dll',
    });
    respuestas.set(nts.url, new Response(DLL));
    await crear([ts, nts]).instalar('8.4', 'xdebug');
    expect(fetches).toEqual([nts.url]);
    expect(readFileSync(path.join(ext, 'php_xdebug.dll'))).toEqual(DLL);
    expect(readFileSync(ini, 'utf8')).toContain('zend_extension=xdebug');
    const i = llamadas.find((a) => a.includes('-i'))!;
    expect(i).toContain('-n');

    // TS: elige la otra entrada.
    info = INFO_TS_2019;
    await expect(crear([ts, nts]).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.sin_variante',
      datos: { nombre: 'xdebug', variante: 'ts-vs16-x64' },
    });
  });

  it('instalarArchivo pone la DLL del catálogo sin activarla en el ini de la rama (Xdebug por sitio)', async () => {
    const e = entrada({});
    respuestas.set(e.url, new Response(DLL));
    const antes = readFileSync(ini);
    const r = await crear([e]).instalarArchivo('8.4', 'xdebug');
    expect(r).toEqual({ cambiada: true });
    expect(readFileSync(path.join(ext, 'php_xdebug.dll'))).toEqual(DLL);
    expect(readFileSync(ini).equals(antes)).toBe(true);
    expect(llamadas.filter((a) => a.includes('-v'))).toEqual([]);
    // Igual que la que hay: nada que cambiar.
    respuestas.set(e.url, new Response(DLL));
    expect(await crear([e]).instalarArchivo('8.4', 'xdebug')).toEqual({ cambiada: false });
  });

  it('una huella distinta no deja nada instalado', async () => {
    const e = entrada({ sha256: 'f'.repeat(64) });
    respuestas.set(e.url, new Response(DLL));
    await expect(crear([e]).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.huella_distinta',
    });
    expect(existsSync(path.join(ext, 'php_xdebug.dll'))).toBe(false);
    expect(readFileSync(ini, 'utf8')).not.toContain('xdebug');
  });

  it('una redirección fuera de los hosts permitidos se corta', async () => {
    const e = entrada({});
    respuestas.set(
      e.url,
      new Response(null, { status: 302, headers: { location: 'https://evil.example/x.dll' } }),
    );
    await expect(crear([e]).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.descarga_fallida',
    });
    expect(fetches).toEqual([e.url]);
    expect(existsSync(path.join(ext, 'php_xdebug.dll'))).toBe(false);
  });

  it('las redirecciones solo siguen dentro del host de la entrada', async () => {
    const e = entrada({});
    // github.com está en HOSTS_PERMITIDOS, pero no es el host de esta entrada.
    respuestas.set(
      e.url,
      new Response(null, { status: 302, headers: { location: 'https://github.com/x/x.dll' } }),
    );
    await expect(crear([e]).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.descarga_fallida',
    });
    expect(fetches).toEqual([e.url]);

    fetches = [];
    respuestas.set(
      e.url,
      new Response(null, { status: 301, headers: { location: '/files/espejo/php_xdebug.dll' } }),
    );
    respuestas.set('https://xdebug.org/files/espejo/php_xdebug.dll', new Response(DLL));
    await crear([e]).instalar('8.4', 'xdebug');
    expect(fetches).toEqual([e.url, 'https://xdebug.org/files/espejo/php_xdebug.dll']);
    expect(readFileSync(path.join(ext, 'php_xdebug.dll'))).toEqual(DLL);
  });

  it('actualizar una DLL ya cargada: reinicia el pool y, si no queda sano, vuelve a la anterior', async () => {
    const vieja = Buffer.from('MZ xdebug vieja');
    const dll = path.join(ext, 'php_xdebug.dll');
    writeFileSync(dll, vieja);
    writeFileSync(ini, 'zend_extension=xdebug\n');
    encendida = true;
    sanos = [false, true];
    const e = entrada({});
    respuestas.set(e.url, new Response(DLL));
    await expect(crear([e]).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.no_arranco',
    });
    expect(readFileSync(dll)).toEqual(vieja);
    expect(reinicios).toBe(2);
    // La DLL nueva se probó con php -v antes de reiniciar el pool.
    expect(llamadas.some((a) => a.includes('-v'))).toBe(true);
    expect(readdirSync(ext).filter((n) => n.startsWith('php_xdebug.dll.'))).toEqual([]);

    // Sana: queda la nueva y no hay restos.
    reinicios = 0;
    respuestas.set(e.url, new Response(DLL));
    await crear([e]).instalar('8.4', 'xdebug');
    expect(readFileSync(dll)).toEqual(DLL);
    expect(reinicios).toBe(1);
  });

  it('activar una extensión en un ini cp1252 no corrompe el resto del archivo', async () => {
    const bytes = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\n;extension=gd\n', 'latin1'),
    ]);
    writeFileSync(ini, bytes);
    await crear().activar('8.4', 'gd', true);
    expect(
      readFileSync(ini).equals(
        Buffer.from(bytes.toString('latin1').replace(';extension=gd', 'extension=gd'), 'latin1'),
      ),
    ).toBe(true);
  });

  it('una DLL en uso que no se puede apartar → php.extension_en_uso y la anterior intacta', async () => {
    const vieja = Buffer.from('MZ xdebug vieja');
    const dll = path.join(ext, 'php_xdebug.dll');
    writeFileSync(dll, vieja);
    writeFileSync(ini, 'zend_extension=xdebug\n');
    const e = entrada({});
    respuestas.set(e.url, new Response(DLL));
    const renombrar = async (de: string, a: string) => {
      if (de === dll)
        throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' });
      await rename(de, a);
    };
    await expect(crear([e], { renombrar }).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.extension_en_uso',
      datos: { nombre: 'xdebug', rama: '8.4' },
    });
    expect(readFileSync(dll)).toEqual(vieja);
    expect(readdirSync(ext).filter((n) => n.startsWith('php_xdebug.dll.'))).toEqual([]);
  });

  it('si la DLL no se puede poner ni devolver, el error dice que ext/ quedó sin ella', async () => {
    const vieja = Buffer.from('MZ xdebug vieja');
    const dll = path.join(ext, 'php_xdebug.dll');
    writeFileSync(dll, vieja);
    writeFileSync(ini, 'zend_extension=xdebug\n');
    const e = entrada({});
    respuestas.set(e.url, new Response(DLL));
    const renombrar = async (de: string, a: string) => {
      if (a === dll) throw Object.assign(new Error('EBUSY: resource busy'), { code: 'EBUSY' });
      await rename(de, a);
    };
    await expect(crear([e], { renombrar }).instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.extension_sin_dll',
      datos: { nombre: 'xdebug', rama: '8.4' },
    });
    // La anterior sigue apartada (no se borró) y al arrancar la rama vuelve a su lugar.
    expect(existsSync(dll)).toBe(false);
    await limpiarDllApartadas(ext);
    expect(readFileSync(dll)).toEqual(vieja);
  });

  it('una DLL nueva que no pasa la prueba al activarla no queda en ext/', async () => {
    const e = entrada({});
    respuestas.set(e.url, new Response(DLL));
    const x = crear([e]);
    const exec2: Ejecutor = async (_c, args) =>
      args.includes('-i')
        ? { codigo: 0, stdout: info, stderr: '' }
        : { codigo: 0, stdout: SALIDA_OK, stderr: "PHP Warning:  Failed loading 'xdebug'" };
    // Mismo gestor con un php que rechaza la DLL.
    const conFallo = new ExtensionesPhp({
      ...(x as unknown as { d: ConstructorParameters<typeof ExtensionesPhp>[0] }).d,
      exec: exec2,
      ini: new IniPhp({
        rutas,
        exec: exec2,
        phpCli: (r) => path.join(rutas.bin('php', r), 'php'),
        ramasInstaladas: async () => ['8.4'],
        asegurarIni: async (r) => rutas.phpIni(r),
        encendida: () => false,
        reiniciar: async () => undefined,
        sano: async () => true,
      }),
    });
    await expect(conFallo.instalar('8.4', 'xdebug')).rejects.toMatchObject({
      codigo: 'php.ini_invalido',
    });
    expect(existsSync(path.join(ext, 'php_xdebug.dll'))).toBe(false);
  });

  it('solo instala lo que está en el catálogo para esa rama', async () => {
    await expect(crear([entrada({ rama: '8.3' })]).instalar('8.4', 'xdebug')).rejects.toMatchObject(
      {
        codigo: 'php.extension_no_catalogo',
      },
    );
    await expect(crear([entrada({})]).instalar('8.4', 'redis')).rejects.toMatchObject({
      codigo: 'php.extension_no_catalogo',
    });
    expect(fetches).toEqual([]);
  });
});
