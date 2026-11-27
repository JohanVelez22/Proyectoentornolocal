import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { catalogo, type VersionDisponible } from '../src/catalogo/catalogo';
import { HOSTS_PERMITIDOS, urlOficial } from '../src/catalogo/comun';
import { fuenteFirmaDe } from '../src/catalogo/huellas';
import { anillo } from '../src/catalogo/pgp/anillos';
import { cotaFirma } from '../src/catalogo/pgp/cotas';
import { iniciarVerificacion, verificarFirmaSeparada } from '../src/catalogo/pgp/verificar';
import { Adminer } from '../src/herramientas/adminer';
import { phpAdminerLogin } from '../src/herramientas/php/adminer-login.php';
import { phpSignon } from '../src/herramientas/php/wolfcore-signon.php';
import {
  extensionActiva,
  generarConfigPma,
  PhpMyAdmin,
  type DepsPhpMyAdmin,
  type ServidorPma,
} from '../src/herramientas/phpmyadmin';
import { generarNginxPrincipal } from '../src/nginx/principal';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CENTINELA = 'centinela-secreta-d';
const SERVIDORES: ServidorPma[] = [
  { puerto: 3306, nombre: 'MySQL 8.4' },
  { puerto: 3307, nombre: "MariaDB 11.4 (trabajo 'a')" },
];

describe('phpMyAdmin: fuente oficial, huella y firma', () => {
  const v = catalogo.phpmyadmin[0]!;

  it('viene de files.phpmyadmin.net por https con una huella SHA-256 fuerte', () => {
    expect(v.url).toBe(
      `https://files.phpmyadmin.net/phpMyAdmin/${v.version}/phpMyAdmin-${v.version}-all-languages.zip`,
    );
    expect(urlOficial(v.url)).toBe(true);
    expect(HOSTS_PERMITIDOS).toContain('files.phpmyadmin.net');
    // Sin comodines ni subdominios: otro host del mismo dominio no se permite.
    expect(urlOficial('https://www.phpmyadmin.net/x.zip')).toBe(false);
    expect(urlOficial('http://files.phpmyadmin.net/x.zip')).toBe(false);
    expect(v.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(v.formato).toBe('zip');
    expect(v.subcarpeta).toBe(`phpMyAdmin-${v.version}-all-languages`);
  });

  it('instalar le pasa al instalador la entrada del catálogo con su huella publicada', async () => {
    const { pma, instaladas } = await crear();
    await pma.instalar();
    expect(instaladas).toHaveLength(1);
    expect(instaladas[0]).toMatchObject({
      servicio: 'phpmyadmin',
      sha256: v.sha256,
      url: v.url,
      formato: 'zip',
    });
    expect(instaladas[0]!.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('si el instalador rechaza la descarga (huella o firma), no se escribe nada', async () => {
    const { pma, rutas } = await crear({ falla: true, instalada: false });
    await expect(pma.instalar()).rejects.toThrow('huella');
    expect(existsSync(rutas.bin('phpmyadmin', v.version))).toBe(false);
  });

  it('su firma PGP se verifica con el anillo fijado de Isaac Bennetch', () => {
    expect(fuenteFirmaDe({ servicio: 'phpmyadmin', version: v.version })).toBe('phpmyadmin');
    const claves = anillo('phpmyadmin');
    const primaria = claves.find((c) => c.huella === c.huellaPrimaria)!;
    expect(primaria.huella).toBe('3D06A59ECE730EB71B511C17CE752F178259BD92');
    expect(primaria.firma).toBe(true);
    expect(primaria.revocada).toBe(false);
    expect(primaria.usuarios.join(' ')).toContain('Isaac Bennetch');
    const asc = readFileSync(
      path.join(AQUI, 'fixtures', 'pgp', `phpMyAdmin-${v.version}-all-languages.zip.asc`),
    );
    const ahora = new Date('2026-11-25T12:00:00Z');
    // El zip no está en el repo: la firma se reconoce (emisor en el anillo) y falla por los datos.
    expect(
      verificarFirmaSeparada({ datos: Buffer.from('otro zip'), firma: asc, anillo: claves, ahora }),
    ).toMatchObject({ ok: false, codigo: 'catalogo.firma_invalida' });
    expect(
      verificarFirmaSeparada({
        datos: Buffer.from('otro zip'),
        firma: asc,
        anillo: anillo('composer'),
        ahora,
      }),
    ).toMatchObject({ ok: false, codigo: 'catalogo.clave_desconocida' });
    // La verificación en curso arranca (no hay fallo previo) y la cota de fecha está definida.
    const cota = cotaFirma('phpmyadmin', { version: v.version });
    expect(cota).toEqual({ ok: true });
    const enCurso = iniciarVerificacion({ firma: asc, anillo: claves, ahora });
    expect('actualizar' in enCurso).toBe(true);
    // Una versión posterior a la fijada exige una firma posterior a la fecha de los anillos.
    expect(cotaFirma('phpmyadmin', { version: '5.2.4' })).toMatchObject({ ok: true });
    expect(cotaFirma('phpmyadmin', { version: '5.2.4' })).toHaveProperty('noAntesDe');
  });
});

describe('phpMyAdmin: config.inc.php y carpeta', () => {
  it('config con AllowArbitraryServer = false y solo los puertos de las instancias', () => {
    const c = generarConfigPma({
      blowfish: 'a'.repeat(32),
      servidores: SERVIDORES,
      tmp: 'C:\\W\\tmp\\phpmyadmin',
      sesiones: 'C:\\W\\tmp\\phpmyadmin\\sesiones',
    });
    // Directiva global (la de verdad de phpMyAdmin), nunca activa.
    expect(c.match(/^\$cfg\['AllowArbitraryServer'\] = false;$/gm)).toHaveLength(1);
    expect(c).not.toMatch(/AllowArbitraryServer'\] = true/);
    expect(c).toContain("$cfg['ZeroConf'] = false;");
    // Sin avisos de PHP nuevos en pantalla (phpMyAdmin 5.2 con PHP 8.4 o más).
    expect(c).toContain('error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);');
    expect(c).toContain("ini_set('display_errors', '0');");
    expect(c.match(/'httponly' => true, 'samesite' => 'Strict'\)/g)).toHaveLength(2);
    expect(c.match(/\['LogoutURL'\] = 'wolfcore-signon\.php';/g)).toHaveLength(2);
    expect([...c.matchAll(/\['port'\] = (\d+);/g)].map((m) => Number(m[1]))).toEqual([3306, 3307]);
    expect([...c.matchAll(/\['host'\] = '([^']+)'/g)].map((m) => m[1])).toEqual([
      '127.0.0.1',
      '127.0.0.1',
    ]);
    expect(c.match(/\['auth_type'\] = 'signon';/g)).toHaveLength(2);
    expect(c).toContain("$cfg['TempDir'] = 'C:\\\\W\\\\tmp\\\\phpmyadmin';");
    // El nombre con comilla no rompe la cadena PHP.
    expect(c).toContain("'MariaDB 11.4 (trabajo \\'a\\')'");
    expect(c).toContain("$cfg['VersionCheck'] = false;");
    expect(c).not.toMatch(/\['password'\]|\['user'\]/);
  });

  it('sin instancias, un servidor marcador con un puerto que no existe (nunca el predeterminado)', () => {
    const c = generarConfigPma({
      blowfish: 'a'.repeat(32),
      servidores: [],
      tmp: 't',
      sesiones: 's',
    });
    expect([...c.matchAll(/\['port'\] = (\d+);/g)].map((m) => Number(m[1]))).toEqual([1]);
    expect(c).toContain("['auth_type'] = 'signon';");
  });

  async function preparada() {
    const o = await crear();
    await o.pma.preparar();
    const raiz = o.rutas.bin('phpmyadmin', catalogo.phpmyadmin[0]!.version);
    return { ...o, raiz, config: () => readFileSync(path.join(raiz, 'config.inc.php'), 'utf8') };
  }

  it('el blowfish_secret es aleatorio, de 32 caracteres, y se conserva al rehacer el archivo', async () => {
    const a = await preparada();
    const b = await preparada();
    const secreto = (t: string): string => /blowfish_secret'\] = '([0-9a-f]{32})';/.exec(t)![1]!;
    expect(secreto(a.config())).not.toBe(secreto(b.config()));
    const antes = secreto(a.config());
    await a.pma.preparar();
    expect(secreto(a.config())).toBe(antes);
  });

  it('una instancia nueva aparece al rehacer el archivo; no se escribe si no cambió nada', async () => {
    const o = await preparada();
    o.servidores.push({ puerto: 3308, nombre: 'MySQL 9.0' });
    await o.pma.preparar();
    expect(o.config()).toContain("['port'] = 3308;");
  });

  it('no expone setup/ (se borra) y deja el script de entrada', async () => {
    const o = await crear();
    const raiz = o.rutas.bin('phpmyadmin', catalogo.phpmyadmin[0]!.version);
    mkdirSync(path.join(raiz, 'setup'), { recursive: true });
    writeFileSync(path.join(raiz, 'setup', 'index.php'), '<?php');
    await o.pma.preparar();
    expect(existsSync(path.join(raiz, 'setup'))).toBe(false);
    expect(existsSync(path.join(raiz, 'wolfcore-signon.php'))).toBe(true);
    expect(existsSync(path.join(raiz, 'index.php'))).toBe(true);
  });

  it('elige la rama encendida más nueva dentro de >=7.2 <8.4 y avisa si solo hay una fuera de rango', async () => {
    expect(catalogo.phpmyadmin[0]!.php).toEqual({ min: '7.2', maxExclusivo: '8.4' });
    const ini = {
      '8.2': iniCon('mysqli', 'mbstring'),
      '8.4': iniCon('mysqli', 'mbstring'),
      '8.5': iniCon('mysqli', 'mbstring'),
    };
    const dentro = await crear({
      ramas: ['8.2', '8.4', '8.5'],
      encendidos: ['8.2', '8.4', '8.5'],
      ini,
    });
    expect(await dentro.pma.disponibilidad()).toEqual({ disponible: true, rama: '8.2' });
    expect(await dentro.pma.configNginx()).toMatchObject({ puertos: [9820, 9821] });
    // Solo hay una fuera de rango: se usa la más nueva, con aviso.
    const fuera = await crear({ ramas: ['8.4', '8.5'], encendidos: ['8.4', '8.5'], ini });
    expect(await fuera.pma.disponibilidad()).toEqual({
      disponible: true,
      rama: '8.5',
      aviso: 'php_fuera_de_rango',
    });
    // Apagado: el vhost usa la rama instalada más nueva dentro de rango.
    const apagado = await crear({ ramas: ['8.2', '8.4'], encendidos: [] });
    expect(await apagado.pma.configNginx()).toMatchObject({ puertos: [9820, 9821] });
  });

  it('disponibilidad pide mysqli y mbstring activas en el php.ini de la rama elegida', async () => {
    const sin = await crear({
      ramas: ['8.2'],
      encendidos: ['8.2'],
      ini: { '8.2': iniCon('mbstring') },
    });
    expect(await sin.pma.disponibilidad()).toMatchObject({
      disponible: false,
      causa: 'sin_extension',
      falta: ['mysqli'],
      rama: '8.2',
    });
    const ambas = await crear({ ramas: ['8.2'], encendidos: ['8.2'], ini: { '8.2': iniCon() } });
    expect(await ambas.pma.disponibilidad()).toMatchObject({ falta: ['mysqli', 'mbstring'] });
    // Con comentario al final, comillas o el nombre php_mysqli.dll también cuenta como activa.
    expect(extensionActiva('extension="php_mysqli.dll" ; mysql', 'mysqli')).toBe(true);
    expect(extensionActiva(';extension=mysqli', 'mysqli')).toBe(false);
    const ok = await crear({
      ramas: ['8.2'],
      encendidos: ['8.2'],
      ini: { '8.2': iniCon('mysqli', 'mbstring') },
    });
    expect(await ok.pma.disponibilidad()).toEqual({ disponible: true, rama: '8.2' });
  });

  it('sin instancias de MySQL o MariaDB no se sirve el vhost', async () => {
    const o = await crear({ sinServidores: true, encendidos: ['8.2'] });
    expect(await o.pma.configNginx()).toBeNull();
  });

  it('preparar deja la carpeta de sesiones solo para el usuario y escribe de forma atómica', async () => {
    const o = await crear();
    await o.pma.preparar();
    expect(o.restringidos).toContain(o.rutas.sesionesPma());
    const raiz = o.rutas.bin('phpmyadmin', catalogo.phpmyadmin[0]!.version);
    // Ningún temporal de la escritura atómica queda en la carpeta.
    expect(readdirSync(raiz).filter((n) => n.includes('.pel-tmp-'))).toEqual([]);
  });

  it('disponibilidad y configNginx: sin instalar, sin PHP y con PHP', async () => {
    expect(await (await crear({ instalada: false })).pma.disponibilidad()).toEqual({
      disponible: false,
      motivo: 'Instale phpMyAdmin para usarlo',
      causa: 'sin_instalar',
    });
    expect(await (await crear({ instalada: false })).pma.configNginx()).toBeNull();
    expect(await (await crear()).pma.disponibilidad()).toEqual({
      disponible: false,
      motivo: 'Encienda PHP para usar phpMyAdmin',
      causa: 'sin_php',
    });
    const o = await crear({ encendidos: ['8.2'] });
    expect(await o.pma.disponibilidad()).toEqual({ disponible: true, rama: '8.2' });
    expect(await o.pma.configNginx()).toEqual({
      raiz: o.rutas.bin('phpmyadmin', catalogo.phpmyadmin[0]!.version),
      puertos: [9820, 9821],
    });
  });
});

describe('nginx de phpMyAdmin y de Adminer', () => {
  const principal = (extra: object = {}): string =>
    generarNginxPrincipal({
      prefijo: 'C:/n',
      sitesDir: 'C:/s',
      phpUpstreams: [],
      logsDir: 'C:/l',
      puerto: 80,
      ...extra,
    });

  it('sin phpMyAdmin no hay vhost', () => {
    expect(principal()).not.toContain('8091');
  });

  it('escucha solo en 127.0.0.1, ejecuta solo los PHP necesarios y no sirve setup ni libraries', () => {
    const conf = principal({
      phpmyadmin: { raiz: 'C:\\W\\bin\\phpmyadmin\\5.2.3', puertos: [9820] },
    });
    expect(conf).toContain('listen 127.0.0.1:8091;');
    expect(conf).not.toMatch(/listen 8091/);
    expect(conf).not.toMatch(/listen \[::\]/);
    expect(conf).toContain('root "C:/W/bin/phpmyadmin/5.2.3";');
    const bloque = conf.slice(conf.indexOf('upstream pma_php'));
    // Los únicos PHP que se ejecutan, con ubicación exacta.
    expect([...bloque.matchAll(/location = (\S+) \{/g)].map((m) => m[1])).toEqual([
      '/',
      '/index.php',
      '/url.php',
      '/js/messages.php',
      '/wolfcore-signon.php',
      '/favicon.ico',
    ]);
    expect(bloque).not.toMatch(/location ~[^\n]*php/);
    expect(bloque).not.toContain('setup');
    expect(bloque).not.toContain('libraries');
    expect(bloque).toContain('access_log off;');
    expect(bloque).toMatch(/location \/ \{\s*return 404;/);
    // PHP_VALUE ya no se usa: la configuración va en config.inc.php.
    expect(bloque).not.toContain('PHP_VALUE');
  });

  it.each([
    ['phpmyadmin', 8091],
    ['adminer', 8090],
  ] as const)(
    'el vhost de %s solo atiende Host 127.0.0.1 o localhost con su puerto (421 si no)',
    (cual, puerto) => {
      const conf = principal({ [cual]: { raiz: 'C:/W/x', puertos: [9820] } });
      const bloque = conf.slice(conf.indexOf(`listen 127.0.0.1:${puerto};`));
      expect(bloque).toContain(
        `if ($http_host !~* "^(127\\.0\\.0\\.1|localhost):${puerto}$") { return 421; }`,
      );
      // La guardia va antes de cualquier ubicación que ejecute PHP.
      expect(bloque.indexOf('return 421')).toBeLessThan(bloque.indexOf('location'));
      expect(bloque).toContain('error_log "C:/l/nginx-error.log" crit;');
      expect(bloque).toContain('access_log off;');
    },
  );

  it('el vhost de Adminer tampoco registra accesos (la URL lleva el token)', () => {
    const conf = principal({ adminer: { raiz: 'C:/W/tools/adminer', puertos: [9840] } });
    expect(conf).toMatch(/listen 127\.0\.0\.1:8090;[\s\S]*access_log off;/);
  });
});

describe('scripts PHP de entrada', () => {
  const dir = "C:\\Users\\O'Brien\\WolfCoreDev\\etc\\acceso-bd";

  it('signon: valida la forma del token, canjea en 127.0.0.1 y no escribe la clave', () => {
    const php = phpSignon({ dirAcceso: dir, sesiones: 'C:\\W\\tmp\\phpmyadmin\\sesiones' });
    expect(php).toContain('wolfcore_canjear($token)');
    expect(php).toContain("preg_match('/^[A-Za-z0-9_-]{43}$/', $token)");
    expect(php).toContain("'http://127.0.0.1:' . $puerto . '/canjear'");
    expect(php).toContain('X-Wolfcore-Secreto');
    // La ruta con comilla va escapada en una cadena PHP.
    expect(php).toContain("'C:\\\\Users\\\\O\\'Brien\\\\WolfCoreDev\\\\etc\\\\acceso-bd'");
    // La clave solo se asigna a la sesión de entrada: nunca a una salida ni a la URL.
    const usos = php.split('\n').filter((l) => l.includes("['clave']"));
    expect(
      usos.filter(
        (l) =>
          !l.includes('PMA_single_signon_password') &&
          !l.includes('is_string') &&
          !l.includes('isset('),
      ),
    ).toEqual([]);
    expect(php).not.toMatch(/echo[^;]*\$datos|header\([^)]*clave/);
    // La redirección lleva el servidor y la base, no el token ni la clave.
    expect(php).toContain("'Location: index.php?route=/database/structure&server='");
    expect(php).not.toMatch(/Location:[^;]*token/);
    expect(php).toContain("session_name('WolfCoreSignon')");
    expect(php).toContain("'samesite' => 'Strict'");
    // Limpieza de sesiones vencidas en cada petición.
    expect(php).toContain("ini_set('session.gc_probability', '1');");
    expect(php).toContain("ini_set('session.gc_divisor', '1');");
  });

  it('adminer: envoltorio con plugin que salta solo el CSRF del envío propio', () => {
    const php = phpAdminerLogin({ dirAcceso: dir, puertos: [3307, 3306, 3306] });
    expect(php).toContain('WolfCore Dev: entrada de Adminer');
    // Solo 127.0.0.1 y los puertos de las instancias; login() y credentials() lo imponen.
    expect(php).toContain('$wolfcorePuertos = array(3306, 3307);');
    expect(php).toContain('function login($login, $password)');
    expect(php).toContain('function credentials()');
    expect(php).toContain("if (!is_file(__DIR__ . '/adminer.php'))");
    expect(php).toContain('function adminer_object()');
    expect(php).toContain('extends \\Adminer\\Plugin');
    expect(php).toContain("require __DIR__ . '/adminer.php';");
    expect(php).toContain("$_POST['auth'] = array(");
    // Un envío real (con $_POST) nunca se toma por un token.
    expect(php).toContain('&& empty($_POST)');
    expect(php).toContain("unset($_GET['wolfcore_token']);");
    expect(php).not.toMatch(/Location:/);
  });

  const php = process.env.PEL_PHP_DIR
    ? path.join(process.env.PEL_PHP_DIR, process.platform === 'win32' ? 'php.exe' : 'php')
    : null;
  it.skipIf(php === null || !existsSync(php))('php -l acepta los dos scripts', async () => {
    const carpeta = await carpetaTemporal('pel-pma-lint-');
    for (const [n, codigo] of [
      ['signon.php', phpSignon({ dirAcceso: dir, sesiones: carpeta })],
      ['adminer.php', phpAdminerLogin({ dirAcceso: dir, puertos: [3306] })],
    ] as const) {
      const f = path.join(carpeta, n);
      writeFileSync(f, codigo);
      const r = spawnSync(php!, ['-l', f], { encoding: 'utf8', windowsHide: true });
      expect(r.stdout + r.stderr).toContain('No syntax errors');
    }
  });
});

describe('Adminer: envoltorio de entrada', () => {
  async function conAdminer() {
    const base = await carpetaTemporal('pel-adm-');
    const rutas = new Rutas(base);
    const adminer = new Adminer({
      rutas,
      instalador: { instalar: async () => undefined, instalados: async () => ['6.3.0'] },
      leerConfig: async () => ConfigSchema.parse({}),
      phpEncendido: () => false,
      puertosPermitidos: async () => [3306, 5432],
    });
    return { rutas, adminer };
  }

  it('una instalación anterior (index.php = Adminer oficial) pasa a adminer.php intacta', async () => {
    const { rutas, adminer } = await conAdminer();
    mkdirSync(rutas.herramientas('adminer'), { recursive: true });
    const oficial = '<?php /* Adminer oficial */ echo 1;';
    writeFileSync(rutas.herramientas('adminer', 'index.php'), oficial);
    await adminer.preparar();
    expect(readFileSync(rutas.herramientas('adminer', 'adminer.php'), 'utf8')).toBe(oficial);
    expect(readFileSync(rutas.herramientas('adminer', 'index.php'), 'utf8')).toContain(
      'WolfCore Dev: entrada de Adminer',
    );
    // Idempotente: otra vez no pisa adminer.php con el envoltorio.
    await adminer.preparar();
    expect(readFileSync(rutas.herramientas('adminer', 'adminer.php'), 'utf8')).toBe(oficial);
  });

  it('el envoltorio solo permite los puertos de las instancias y se rehace con disponibilidad()', async () => {
    const { rutas, adminer } = await conAdminer();
    mkdirSync(rutas.herramientas('adminer'), { recursive: true });
    writeFileSync(rutas.herramientas('adminer', 'index.php'), '<?php');
    await adminer.disponibilidad();
    expect(readFileSync(rutas.herramientas('adminer', 'index.php'), 'utf8')).toContain(
      '$wolfcorePuertos = array(3306, 5432);',
    );
  });

  it('sin Adminer instalado no escribe nada', async () => {
    const { rutas, adminer } = await conAdminer();
    await adminer.preparar();
    expect(existsSync(rutas.herramientas('adminer', 'index.php'))).toBe(false);
  });
});

/** php.ini mínimo de una rama: las extensiones que se le piden activas. */
const iniCon = (...exts: string[]): string =>
  ['[PHP]', ';extension=mysqli', ...exts.map((e) => `extension=${e}`)].join('\r\n');

async function crear(
  o: {
    instalada?: boolean;
    encendidos?: string[];
    falla?: boolean;
    ramas?: string[];
    /** php.ini por rama (sin esta clave, la rama no tiene ini todavía). */
    ini?: Record<string, string>;
    sinServidores?: boolean;
  } = {},
): Promise<{
  pma: PhpMyAdmin;
  rutas: Rutas;
  instaladas: VersionDisponible[];
  servidores: ServidorPma[];
  restringidos: string[];
}> {
  const base = await carpetaTemporal('pel-pma-');
  const rutas = new Rutas(base);
  const v = catalogo.phpmyadmin[0]!;
  const instaladas: VersionDisponible[] = [];
  const servidores = o.sinServidores ? [] : [...SERVIDORES];
  const restringidos: string[] = [];
  for (const [rama, ini] of Object.entries(o.ini ?? {})) {
    mkdirSync(path.dirname(rutas.phpIni(rama)), { recursive: true });
    writeFileSync(rutas.phpIni(rama), ini);
  }
  const poner = (): void => {
    const raiz = rutas.bin('phpmyadmin', v.version);
    mkdirSync(raiz, { recursive: true });
    writeFileSync(path.join(raiz, 'index.php'), '<?php');
  };
  if (o.instalada !== false) poner();
  const deps: DepsPhpMyAdmin = {
    rutas,
    instalador: {
      instalar: async (x) => {
        instaladas.push(x);
        if (o.falla) throw new Error('La huella de la descarga no coincide');
        poner();
      },
      instalados: async (s) =>
        s === 'php'
          ? (o.ramas ?? ['8.2', '8.4'])
          : s === 'phpmyadmin' && existsSync(rutas.bin('phpmyadmin', v.version))
            ? [v.version]
            : [],
    },
    leerConfig: async () => ConfigSchema.parse({}),
    phpEncendido: (r) => (o.encendidos ?? []).includes(r),
    servidores: async () => servidores,
    restringir: async (ruta) => {
      restringidos.push(ruta);
      return true;
    },
  };
  void CENTINELA;
  return { pma: new PhpMyAdmin(deps), rutas, instaladas, servidores, restringidos };
}
