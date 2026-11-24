/**
 * Prueba real de "Nuevo proyecto" en Windows (`npm run test:win`): instala PHP 8.4 y Composer desde
 * el catálogo y crea un proyecto Symfony con `webapp` sin base de datos. Comprueba que Flex aplicó
 * sus recetas (con `--no-scripts` el proyecto salía sin aplicación): `public/index.php`,
 * `src/Kernel.php`, `config/`, `bin/console` y `.env`.
 *
 * Se salta sin Windows o sin red (Packagist y los sitios de descarga). Todo va a una carpeta
 * temporal: nunca toca el hosts, el almacén de certificados, el PATH ni la carpeta de datos real.
 * Las cachés de Composer van a la carpeta de caché de las pruebas.
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Nucleo } from '../../src/nucleo';
import {
  CARPETA_CACHE,
  esperar,
  esWindows,
  fetchConCache,
  limpiarBase,
  plataformaSegura,
} from './comun';

const MIN = 60_000;
const RAMA_PHP = '8.4';

const hayRed = await Promise.race([
  fetch('https://repo.packagist.org/packages.json', { method: 'HEAD' }).then(
    (r) => r.ok,
    () => false,
  ),
  new Promise<boolean>((r) => setTimeout(() => r(false), 5000)),
]);

const base = path.join(os.tmpdir(), `pel-nuevo-${randomBytes(4).toString('hex')}`);
// Fuera de la carpeta de datos: Nuevo proyecto no acepta carpetas dentro de ella.
const proyectos = `${base}-proyectos`;
const documentos = path.join(base, 'Documentos');
const hostsCopia = path.join(base, 'hosts-copia');
const log = (...a: unknown[]): void => console.log('[proyecto-nuevo]', ...a);

const ENV_PRUEBA: Record<string, string> = {
  COMPOSER_HOME: path.join(CARPETA_CACHE, 'composer-home'),
  COMPOSER_CACHE_DIR: path.join(CARPETA_CACHE, 'composer-cache'),
  COMPOSER_NO_INTERACTION: '1',
};
const envPrevio: Record<string, string | undefined> = {};
let nucleo: Nucleo | null = null;

describe.skipIf(!esWindows || !hayRed)('Nuevo proyecto con Composer real', () => {
  beforeAll(async () => {
    for (const [k, v] of Object.entries(ENV_PRUEBA)) {
      envPrevio[k] = process.env[k];
      process.env[k] = v;
      mkdirSync(v, { recursive: true });
    }
    for (const d of [proyectos, documentos]) mkdirSync(d, { recursive: true });
    writeFileSync(hostsCopia, '127.0.0.1 localhost\r\n');
    nucleo = await Nucleo.crear({
      base,
      plataforma: plataformaSegura(hostsCopia, documentos),
      fetch: fetchConCache(log),
    });
  }, 5 * MIN);

  afterAll(async () => {
    if (nucleo) await nucleo.cerrar({ detenerServicios: true }).catch(() => undefined);
    if (esWindows && process.env.PEL_INT_CONSERVAR !== '1') {
      limpiarBase(base, log);
      rmSync(proyectos, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
    }
    for (const [k, v] of Object.entries(envPrevio)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }, 5 * MIN);

  it(
    'Symfony con webapp queda con aplicación: public/index.php, Kernel, config y bin/console',
    async () => {
      const x = nucleo!;
      const php = (await x.listarVersiones('php')).find((v) => v.rama === RAMA_PHP);
      expect(php, `releases.json no trae PHP ${RAMA_PHP}`).toBeDefined();
      await x.instalador.instalar(php!);
      await x.instalarComposer();

      const carpeta = path.join(proyectos, 'sf-demo');
      const r = await x.crearProyecto({
        tipo: 'symfony',
        nombre: 'sf-demo',
        carpeta,
        php: RAMA_PHP,
        base: null,
        opciones: { symfonyWebapp: true },
      });
      log('receta:', JSON.stringify(r.receta));
      expect(r.receta.estado).toBe('lista');
      for (const f of [
        'public/index.php',
        'src/Kernel.php',
        'config/services.yaml',
        'bin/console',
        '.env',
        'vendor/autoload.php',
      ]) {
        expect(existsSync(path.join(carpeta, f)), f).toBe(true);
      }
      // `symfony/webapp-pack` es un pack: Flex lo desempaqueta en sus paquetes (Twig, Doctrine…).
      const compuesto = readFileSync(path.join(carpeta, 'composer.json'), 'utf8');
      expect(/webapp-pack|twig-bundle|doctrine-bundle/.test(compuesto)).toBe(true);
    },
    30 * MIN,
  );

  it(
    'Symfony cortado con el lock escrito y sin vendor se reanuda y queda con aplicación',
    async () => {
      const x = nucleo!;
      const carpeta = path.join(proyectos, 'sf-corte');
      const creacion = x.crearProyecto({
        tipo: 'symfony',
        nombre: 'sf-corte',
        carpeta,
        php: RAMA_PHP,
        base: null,
        opciones: {},
      });
      // Se corta Composer en cuanto escribe el lock: `install` solo no aplicaría las recetas de Flex.
      await esperar(
        'composer.lock',
        async () => (existsSync(path.join(carpeta, 'composer.lock')) ? true : null),
        10 * MIN,
        100,
      );
      expect(x.cancelarReceta('sf-corte')).toBe(true);
      const cortada = await creacion;
      log('receta cortada:', JSON.stringify(cortada.receta));
      expect(cortada.receta.estado).not.toBe('lista');

      const r = await x.ejecutarReceta('sf-corte', { desde: 'crear-desde-composer' });
      log('receta reanudada:', JSON.stringify(r));
      for (const p of x.estadoReceta('sf-corte').pasos) {
        log(p.id, p.estado, p.mensaje ?? '', p.log.slice(-25).join(String.fromCharCode(10)));
      }
      expect(r.estado).toBe('lista');
      for (const f of [
        'public/index.php',
        'src/Kernel.php',
        'bin/console',
        'vendor/autoload.php',
      ]) {
        expect(existsSync(path.join(carpeta, f)), f).toBe(true);
      }
    },
    30 * MIN,
  );
});
