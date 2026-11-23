import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rutas } from '../rutas';
import { wolfdumpPy } from './wolfdump.py';

/** Rutas de la captura de dumps dentro de la carpeta de datos. */
export function rutasDepuracion(rutas: Rutas): {
  /** Script de `auto_prepend_file` (lo cargan solo los pools de sitios con la captura activa). */
  prepend: string;
  /** Carpeta que va en el PYTHONPATH de los procesos de los sitios con la captura activa. */
  carpetaPython: string;
  python: string;
  /** Puerto y token de la sesión (solo mientras el receptor escucha). */
  receptor: string;
} {
  const carpetaPython = path.join(rutas.base, 'etc', 'python');
  return {
    prepend: path.join(rutas.base, 'etc', 'php', 'wolfcore-prepend.php'),
    carpetaPython,
    python: path.join(carpetaPython, 'wolfdump.py'),
    receptor: path.join(rutas.base, 'run', 'depuracion.json'),
  };
}

/** Cadena PHP entre comillas simples (solo `\` y `'` se escapan). */
const cadenaPhp = (t: string): string => `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Script de `auto_prepend_file` de la captura de `dump()`/`dd()`/`wd()`.
 *
 * - El puerto y el token NO van en el script: se leen de `rutaReceptor` solo al volcar (el
 *   archivo cambia en cada sesión y OPcache no guarda un token viejo). Nunca se imprimen.
 * - Define `wd()` (solo envía), y `dump()`/`dd()` si no existen: como corre antes que Composer, el
 *   `dump()` de symfony/var-dumper (que también pregunta `function_exists`) no se define y el
 *   nuestro envía y después muestra con `VarDumper::dump` (el manejador de Laravel o el de
 *   Symfony, igual que antes). Sin VarDumper (CodeIgniter 3) muestra con `print_r`.
 * - Enviar tiene un plazo de 200 ms; si el receptor no está, no hace nada visible: sin avisos, sin
 *   excepciones, sin salida. `dd()` sigue deteniendo con `exit(1)`.
 * - Un `auto_prepend_file` anterior del sitio o de la rama queda en `wolfcore.prepend_previo` y
 *   se carga al final, en el ámbito global, como antes.
 */
export function prependPhp(o: { rutaReceptor: string }): string {
  return PLANTILLA_PHP.replace('__RECEPTOR__', () => cadenaPhp(o.rutaReceptor));
}

const PLANTILLA_PHP = String.raw`<?php
// WolfCore Dev: captura de dump(), dd() y wd() hacia la pantalla "Depuración".
// Archivo generado por WolfCore Dev (se reescribe al iniciar): no lo edite.
if (!class_exists('WolfCoreDump', false)) {
    final class WolfCoreDump
    {
        const RECEPTOR = __RECEPTOR__;
        const MAX_TEXTO = 262144;
        const MAX_CUERPO = 1000000;
        const PLAZO = 0.2;

        /** Envía los valores al receptor; nunca lanza ni muestra nada. */
        public static function capturar(
            #[\SensitiveParameter]
            array $valores
        ) {
            set_error_handler(function () { return true; });
            try {
                if (self::receptor() === null) {
                    return;
                }
                $origen = self::origen();
                $partes = array();
                foreach ($valores as $k => $v) {
                    $partes[] = (is_string($k) ? $k . ': ' : '') . self::texto($v);
                }
                self::enviar(array(
                    'origen' => 'php',
                    'sitio' => self::sitio(),
                    'archivo' => $origen[0],
                    'linea' => $origen[1],
                    'url' => self::url(),
                    'texto' => self::recortar(implode("\n", $partes)),
                ));
            } catch (\Throwable $e) {
            } finally {
                restore_error_handler();
            }
        }

        /** Muestra el valor en la página como lo haría el proyecto. */
        public static function mostrar($v)
        {
            if (self::hayVarDumper()) {
                \Symfony\Component\VarDumper\VarDumper::dump($v);
                return;
            }
            $t = is_array($v) || is_object($v) ? print_r($v, true) : var_export($v, true);
            if (PHP_SAPI === 'cli' || PHP_SAPI === 'phpdbg') {
                echo $t, "\n";
            } else {
                echo '<pre>', htmlspecialchars($t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), '</pre>';
            }
        }

        /**
         * ¿Hay VarDumper? Sin cargar clases a ciegas: un autoloader propio que hace require de
         * una clase que no existe tumbaría la página. Solo se pregunta a Composer.
         */
        public static function hayVarDumper()
        {
            $clase = 'Symfony\Component\VarDumper\VarDumper';
            if (class_exists($clase, false)) {
                return true;
            }
            foreach ((array) spl_autoload_functions() as $f) {
                if (is_array($f) && is_object($f[0]) && $f[0] instanceof \Composer\Autoload\ClassLoader) {
                    if ($f[0]->findFile($clase)) {
                        return class_exists($clase);
                    }
                }
            }
            return false;
        }

        /** ¿$previo es otro archivo que $propio? (rutas reales; en Windows sin mayúsculas) */
        public static function esOtroArchivo($previo, $propio)
        {
            $a = @realpath($previo);
            $b = @realpath($propio);
            $a = str_replace('\\', '/', $a === false ? $previo : $a);
            $b = str_replace('\\', '/', $b === false ? $propio : $b);
            if (DIRECTORY_SEPARATOR === '\\') {
                $a = strtolower($a);
                $b = strtolower($b);
            }
            return $a !== $b;
        }

        private static function receptor()
        {
            $j = @file_get_contents(self::RECEPTOR);
            if (!is_string($j) || strlen($j) > 4096) {
                return null;
            }
            $c = json_decode($j, true);
            if (!is_array($c) || !isset($c['puerto'], $c['token'])
                || !is_int($c['puerto']) || !is_string($c['token'])
                || !preg_match('/^[0-9a-f]{64}$/', $c['token'])) {
                return null;
            }
            return $c;
        }

        private static function origen()
        {
            $propio = str_replace('\\', '/', __FILE__);
            $primero = null;
            foreach (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 40) as $f) {
                if (!isset($f['file'])) {
                    continue;
                }
                $a = str_replace('\\', '/', $f['file']);
                if ($a === $propio) {
                    continue;
                }
                if ($primero === null) {
                    $primero = $f;
                }
                if (strpos($a, '/vendor/') === false) {
                    return array($f['file'], isset($f['line']) ? (int) $f['line'] : null);
                }
            }
            return $primero === null
                ? array(null, null)
                : array($primero['file'], isset($primero['line']) ? (int) $primero['line'] : null);
        }

        private static function sitio()
        {
            $s = get_cfg_var('wolfcore.sitio');
            return is_string($s) && $s !== '' ? $s : null;
        }

        private static function url()
        {
            if (!isset($_SERVER['REQUEST_URI']) || !is_string($_SERVER['REQUEST_URI'])) {
                return null;
            }
            $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
            $host = isset($_SERVER['HTTP_HOST']) && is_string($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
            return substr(($https ? 'https://' : 'http://') . $host . $_SERVER['REQUEST_URI'], 0, 2048);
        }

        private static function texto($v)
        {
            if (self::hayVarDumper()
                && class_exists('Symfony\Component\VarDumper\Cloner\VarCloner')
                && class_exists('Symfony\Component\VarDumper\Dumper\CliDumper')) {
                $cloner = new \Symfony\Component\VarDumper\Cloner\VarCloner();
                $cloner->setMaxItems(2500);
                $cloner->setMaxString(self::MAX_TEXTO);
                $dumper = new \Symfony\Component\VarDumper\Dumper\CliDumper();
                $dumper->setColors(false);
                $t = $dumper->dump($cloner->cloneVar($v), true);
                if (is_string($t)) {
                    return rtrim($t, "\n");
                }
            }
            if (!is_array($v) && !is_object($v)) {
                return var_export($v, true);
            }
            // print_r por partes: nunca más de MAX_TEXTO en memoria.
            $texto = '';
            ob_start(function ($b) use (&$texto) {
                if (strlen($texto) < WolfCoreDump::MAX_TEXTO) {
                    $texto .= substr($b, 0, WolfCoreDump::MAX_TEXTO - strlen($texto));
                }
                return '';
            }, 8192);
            print_r($v);
            ob_end_clean();
            return $texto;
        }

        private static function recortar($t)
        {
            return strlen($t) > self::MAX_TEXTO ? substr($t, 0, self::MAX_TEXTO) . "\n…" : $t;
        }

        /**
         * El token se lee aquí dentro y nunca pasa como argumento de una función del script: una
         * traza con argumentos (Xdebug develop, zend.exception_ignore_args=Off) no lo puede
         * mostrar. Los parámetros llevan el atributo SensitiveParameter (PHP 8.2+; en PHP 7 la línea del
         * atributo es un comentario). Todo aviso lo traga el manejador de capturar().
         */
        private static function enviar(
            #[\SensitiveParameter]
            array $datos
        ) {
            $json = json_encode(
                $datos,
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR
            );
            if (!is_string($json) || strlen($json) > self::MAX_CUERPO) {
                return;
            }
            $c = self::receptor();
            if ($c === null) {
                return;
            }
            $puerto = $c['puerto'];
            $peticion = "POST /dump HTTP/1.1\r\nHost: 127.0.0.1:" . $puerto
                . "\r\nAuthorization: Bearer " . $c['token']
                . "\r\nContent-Type: application/json\r\nContent-Length: " . strlen($json)
                . "\r\nConnection: close\r\n\r\n" . $json;
            $c = null;
            $s = @stream_socket_client('tcp://127.0.0.1:' . $puerto, $en, $es, self::PLAZO);
            if (!$s) {
                return;
            }
            stream_set_timeout($s, 0, (int) (self::PLAZO * 1000000));
            @fwrite($s, $peticion);
            $peticion = null;
            @fgets($s, 128);
            @fclose($s);
        }
    }
}

if (!function_exists('wd')) {
    /** Envía los valores a WolfCore Dev sin mostrar nada en la página. */
    function wd(...$valores)
    {
        WolfCoreDump::capturar($valores);
        return count($valores) === 1 ? reset($valores) : (count($valores) > 0 ? $valores : null);
    }
}

if (!function_exists('dump')) {
    function dump(...$valores)
    {
        WolfCoreDump::capturar($valores);
        foreach ($valores as $v) {
            WolfCoreDump::mostrar($v);
        }
        return count($valores) === 1 ? reset($valores) : (count($valores) > 0 ? $valores : null);
    }
}

if (!function_exists('dd')) {
    function dd(...$valores)
    {
        WolfCoreDump::capturar($valores);
        if (!in_array(PHP_SAPI, array('cli', 'phpdbg', 'embed'), true) && !headers_sent()) {
            header('HTTP/1.1 500 Internal Server Error');
        }
        foreach ($valores as $v) {
            WolfCoreDump::mostrar($v);
        }
        exit(1);
    }
}

// El prepend anterior (del sitio o de la rama), en el ámbito global. Nunca este mismo archivo
// (sería una recursión sin fin); require_once además evita cargarlo dos veces.
if (is_string(get_cfg_var('wolfcore.prepend_previo')) && get_cfg_var('wolfcore.prepend_previo') !== ''
    && WolfCoreDump::esOtroArchivo(get_cfg_var('wolfcore.prepend_previo'), __FILE__)) {
    require_once get_cfg_var('wolfcore.prepend_previo');
}
`;

/** Escribe `contenido` solo si cambió (temporal + rename, sin dejar el archivo a medias). */
async function escribirSiCambia(ruta: string, contenido: string): Promise<void> {
  const actual = await readFile(ruta, 'utf8').catch(() => null);
  if (actual === contenido) return;
  await mkdir(path.dirname(ruta), { recursive: true });
  const tmp = `${ruta}.${process.pid}.tmp`;
  await writeFile(tmp, contenido, 'utf8');
  await rename(tmp, ruta);
}

/**
 * Deja al día el prepend de PHP y `wolfdump.py` (sin el token). Se llama al arrancar y antes de
 * escribir el ini de un sitio con captura: un `auto_prepend_file` que falta tumbaría el sitio.
 */
export async function asegurarArchivosDepuracion(
  rutas: Rutas,
): Promise<ReturnType<typeof rutasDepuracion>> {
  const r = rutasDepuracion(rutas);
  await escribirSiCambia(r.prepend, prependPhp({ rutaReceptor: r.receptor }));
  await escribirSiCambia(r.python, wolfdumpPy({ rutaReceptor: r.receptor }));
  return r;
}
