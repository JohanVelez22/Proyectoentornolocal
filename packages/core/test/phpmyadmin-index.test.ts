/**
 * Prueba real de `index.php` de phpMyAdmin con un `php-cgi` de verdad. Necesita dos carpetas:
 * `PEL_PHP_DIR` (con `php-cgi` y su `ext/`) y `PEL_PMA_DIR` (phpMyAdmin descomprimido, la carpeta que
 * trae `index.php`); sin alguna de las dos se salta. No lanza servidores: es una corrida de php-cgi.
 *
 * Comprueba lo que hace que phpMyAdmin arranque: con `mysqli` y `mbstring` activas responde (manda
 * a `wolfcore-signon.php`, su pantalla de entrada) y sin `mysqli` se queja de la extensión.
 */
import { execFile } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { PhpMyAdmin } from '../src/herramientas/phpmyadmin';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const DIR_PHP = process.env.PEL_PHP_DIR;
const DIR_PMA = process.env.PEL_PMA_DIR;
const cgi = DIR_PHP
  ? path.join(DIR_PHP, process.platform === 'win32' ? 'php-cgi.exe' : 'php-cgi')
  : null;
const hay =
  cgi !== null && existsSync(cgi) && !!DIR_PMA && existsSync(path.join(DIR_PMA, 'index.php'));

function pedir(ini: string, script: string, consulta: string): Promise<string> {
  return new Promise((resolver) => {
    execFile(
      cgi!,
      ['-c', ini],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 60_000,
        maxBuffer: 20_000_000,
        cwd: path.dirname(script),
        env: {
          ...process.env,
          REDIRECT_STATUS: '1',
          REQUEST_METHOD: 'GET',
          SCRIPT_FILENAME: script,
          SCRIPT_NAME: '/index.php',
          REQUEST_URI: `/index.php?${consulta}`,
          HTTP_HOST: '127.0.0.1:8091',
          SERVER_NAME: '127.0.0.1',
          SERVER_PORT: '8091',
          QUERY_STRING: consulta,
          GATEWAY_INTERFACE: 'CGI/1.1',
        },
      },
      (_e, salida) => resolver(salida),
    );
  });
}

describe.skipIf(!hay)('index.php de phpMyAdmin con php-cgi real', () => {
  it('arranca con mysqli y mbstring activas y se queja de mysqli si falta', async () => {
    const base = await carpetaTemporal('pel-pma-index-');
    const rutas = new Rutas(base);
    const raiz = rutas.bin('phpmyadmin', '5.2.3');
    mkdirSync(path.dirname(raiz), { recursive: true });
    cpSync(DIR_PMA!, raiz, { recursive: true });
    const pma = new PhpMyAdmin({
      rutas,
      instalador: {
        instalar: async () => undefined,
        instalados: async (s) => (s === 'php' ? ['8.2'] : ['5.2.3']),
      },
      leerConfig: async () => ConfigSchema.parse({}),
      phpEncendido: () => true,
      servidores: async () => [{ puerto: 3307, nombre: 'MySQL 8.4' }],
    });
    await pma.preparar();
    const ext = path.join(DIR_PHP!, 'ext').replace(/\\/g, '/');
    const ini = (exts: string[]): string => {
      const f = path.join(base, `php-${exts.length}.ini`);
      writeFileSync(
        f,
        [`extension_dir="${ext}"`, ...exts.map((e) => `extension=${e}`), 'display_errors=On'].join(
          '\n',
        ),
      );
      return f;
    };
    const script = path.join(raiz, 'index.php');
    const con = await pedir(ini(['mysqli', 'mbstring', 'openssl', 'curl']), script, 'route=/');
    // phpMyAdmin responde y, al no haber sesión, manda a la pantalla de entrada propia.
    expect(con).toMatch(/^Location: wolfcore-signon\.php$/m);
    expect(con).not.toMatch(/mysqli/i);
    const sin = await pedir(ini(['mbstring', 'openssl']), script, 'route=/');
    expect(sin).toMatch(/mysqli/i);
  });
});
