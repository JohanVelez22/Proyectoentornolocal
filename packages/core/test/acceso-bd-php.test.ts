/**
 * Prueba real de los scripts PHP de entrada (phpMyAdmin y Adminer) con un `php-cgi` de verdad y el
 * servidor de canje de `AccesoBd`. PHP sale de `PEL_PHP_DIR` (carpeta con `php-cgi`); sin él se
 * salta. No lanza servidores web: cada petición es una corrida de php-cgi con las variables CGI.
 * No hace falta ningún servidor de bases de datos: se comprueba la entrada, no la conexión.
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccesoBd } from '../src/herramientas/accesoBd';
import { phpAdminerLogin } from '../src/herramientas/php/adminer-login.php';
import { PhpMyAdmin } from '../src/herramientas/phpmyadmin';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

const CENTINELA = 'centinela-secreta-d';
const DIR_PHP = process.env.PEL_PHP_DIR;
const cgi = DIR_PHP
  ? path.join(DIR_PHP, process.platform === 'win32' ? 'php-cgi.exe' : 'php-cgi')
  : null;
const hayPhp = cgi !== null && existsSync(cgi);

/**
 * Una petición GET a un script con php-cgi: cabeceras y cuerpo de la respuesta. Asíncrona: el
 * servidor de canje vive en este mismo proceso y tiene que poder contestar mientras PHP espera.
 */
async function pedir(
  script: string,
  consulta: string,
  extra: Record<string, string> = {},
): Promise<{ estado: number; cabeceras: string; cuerpo: string }> {
  const stdout = await new Promise<string>((resolver) => {
    execFile(
      cgi!,
      ['-d', 'display_errors=Off'],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 20_000,
        env: {
          ...process.env,
          REDIRECT_STATUS: '1',
          REQUEST_METHOD: 'GET',
          SCRIPT_FILENAME: script,
          SCRIPT_NAME: `/${path.basename(script)}`,
          QUERY_STRING: consulta,
          GATEWAY_INTERFACE: 'CGI/1.1',
          ...extra,
        },
      },
      (_e, salida) => resolver(salida),
    );
  });
  const [cabeceras = '', ...resto] = stdout.split(/\r?\n\r?\n/);
  const estado = Number(/^Status: (\d{3})/m.exec(cabeceras)?.[1] ?? 200);
  return { estado, cabeceras, cuerpo: resto.join('\n\n') };
}

describe.skipIf(!hayPhp)('scripts de entrada con php-cgi real', () => {
  const abiertos: AccesoBd[] = [];
  afterEach(async () => {
    for (const a of abiertos.splice(0)) await a.detener();
  });

  async function montar() {
    const base = await carpetaTemporal('pel-acceso-php-');
    const rutas = new Rutas(base);
    const acceso = new AccesoBd({ rutas, puertoHerramienta: () => 8091 });
    abiertos.push(acceso);
    await acceso.iniciar();
    return { base, rutas, acceso };
  }

  const emitir = async (acceso: AccesoBd, herramienta: 'adminer' | 'phpmyadmin') =>
    new URL(
      (
        await acceso.emitir({
          herramienta,
          sitioId: 'tienda',
          instancia: 'mysql@8.4',
          base: 'tienda_bd',
          credenciales: {
            motor: 'mysql',
            host: '127.0.0.1',
            puerto: 3307,
            usuario: 'wolf_u_tienda_bd',
            clave: CENTINELA,
          },
        })
      ).url,
    ).search.slice(1);

  it('phpMyAdmin: el token abre la sesión de entrada y redirige sin token ni clave; no se repite', async () => {
    const { rutas, acceso } = await montar();
    const pma = new PhpMyAdmin({
      rutas,
      instalador: {
        instalar: async () => undefined,
        instalados: async (s) => (s === 'phpmyadmin' ? ['5.2.3'] : ['8.4']),
      },
      leerConfig: async () => ConfigSchema.parse({}),
      phpEncendido: () => true,
      servidores: async () => [{ puerto: 3307, nombre: 'MySQL 8.4' }],
    });
    const raiz = rutas.bin('phpmyadmin', '5.2.3');
    await mkdir(raiz, { recursive: true });
    await writeFile(path.join(raiz, 'index.php'), '<?php');
    await pma.preparar();
    const script = path.join(raiz, 'wolfcore-signon.php');

    const consulta = await emitir(acceso, 'phpmyadmin');
    const r = await pedir(script, consulta);
    expect(r.estado).toBe(303);
    expect(r.cabeceras).toMatch(
      /^Location: index\.php\?route=\/database\/structure&server=1&db=tienda_bd$/m,
    );
    expect(r.cabeceras).toMatch(/^Set-Cookie: WolfCoreSignon=/m);
    expect(r.cabeceras).toMatch(/HttpOnly/i);
    expect(r.cabeceras).toMatch(/^Referrer-Policy: no-referrer$/m);
    // Ni la clave ni el token salen en la respuesta.
    expect(r.cabeceras + r.cuerpo).not.toContain(CENTINELA);
    expect(r.cabeceras + r.cuerpo).not.toContain(consulta.split('=')[1]!);
    // La sesión de entrada (en la carpeta propia) lleva el usuario y la clave para phpMyAdmin.
    const sesiones = path.join(rutas.tmp(), 'phpmyadmin', 'sesiones');
    const archivo = readdirSync(sesiones).find((n) => n.startsWith('sess_'))!;
    const sesion = readFileSync(path.join(sesiones, archivo), 'utf8');
    expect(sesion).toContain('PMA_single_signon_user');
    expect(sesion).toContain('wolf_u_tienda_bd');
    expect(sesion).toContain(CENTINELA);

    // El mismo token otra vez: aviso, sin redirección ni cookie.
    const otra = await pedir(script, consulta);
    expect(otra.estado).toBe(403);
    expect(otra.cabeceras).not.toMatch(/^Location:/m);
    expect(otra.cabeceras).not.toMatch(/^Set-Cookie:/m);
    // Sin token o con uno de forma rara: lo mismo.
    expect((await pedir(script, '')).estado).toBe(403);
    expect((await pedir(script, 'wolfcore_token=../../x')).estado).toBe(403);
  });

  it('Adminer: el envoltorio arma el inicio de sesión con las credenciales del token y limpia la URL', async () => {
    const { base, rutas, acceso } = await montar();
    const dir = path.join(base, 'adminer');
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'index.php'),
      phpAdminerLogin({ dirAcceso: rutas.accesoBd(), puertos: [3307] }),
    );
    // Un `adminer.php` mínimo que imita lo que usa el envoltorio: la clase de plugins, el hook y
    // la salida de lo que Adminer vería. (El Adminer oficial no está en el repo.)
    await writeFile(
      path.join(dir, 'adminer.php'),
      `<?php
namespace Adminer;
abstract class Plugin {}
class Plugins { var $p; function __construct($p) { $this->p = $p; } }
$i = \\adminer_object();
$p = $i->p[0];
echo json_encode(array(
  'post' => $_POST, 'get' => $_GET, 'metodo' => $_SERVER['REQUEST_METHOD'],
  'csrf' => $p->verifyLoginToken(),
));
`,
    );
    const consulta = await emitir(acceso, 'adminer');
    const r = await pedir(path.join(dir, 'index.php'), `${consulta}&db=otra`);
    const visto = JSON.parse(r.cuerpo) as {
      post: { auth: Record<string, string> };
      get: Record<string, string>;
      metodo: string;
      csrf: unknown;
    };
    expect(visto.metodo).toBe('POST');
    expect(visto.post.auth).toEqual({
      driver: 'server',
      server: '127.0.0.1:3307',
      username: 'wolf_u_tienda_bd',
      password: CENTINELA,
      db: 'tienda_bd',
      permanent: '',
    });
    expect(visto.get).toEqual({ db: 'otra' });
    expect(visto.csrf).toBe(false);

    // Token repetido o inventado: Adminer ve una petición normal (su pantalla de inicio).
    for (const q of [consulta, 'wolfcore_token=' + 'A'.repeat(43), 'wolfcore_token[]=x']) {
      const n = JSON.parse((await pedir(path.join(dir, 'index.php'), q)).cuerpo) as typeof visto;
      expect(n.metodo).toBe('GET');
      expect(n.post).toEqual([]);
      expect(n.csrf).toBeNull();
      expect(n.get).toEqual([]);
    }

    // Un token de un puerto que no es de ninguna instancia (lista del envoltorio: 3307) no entra.
    const ajeno = await acceso.emitir({
      herramienta: 'adminer',
      sitioId: 'tienda',
      instancia: 'mysql',
      base: 'b',
      credenciales: {
        motor: 'mysql',
        host: '127.0.0.1',
        puerto: 3399,
        usuario: 'u',
        clave: CENTINELA,
      },
    });
    const bloqueado = JSON.parse(
      (await pedir(path.join(dir, 'index.php'), new URL(ajeno.url).search.slice(1))).cuerpo,
    ) as typeof visto;
    expect(bloqueado.metodo).toBe('GET');
    expect(bloqueado.post).toEqual([]);

    // Sin adminer.php junto al envoltorio: aviso 503 en cuatro idiomas, nunca un error de PHP.
    const sin = path.join(base, 'sin-adminer');
    await mkdir(sin, { recursive: true });
    await writeFile(
      path.join(sin, 'index.php'),
      phpAdminerLogin({ dirAcceso: rutas.accesoBd(), puertos: [3307] }),
    );
    const falta = await pedir(path.join(sin, 'index.php'), '');
    expect(falta.estado).toBe(503);
    expect(falta.cuerpo).toContain('Adminer is missing');
  });
});
