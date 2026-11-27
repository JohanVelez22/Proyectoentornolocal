import { phpCanje } from './wolfcore-signon.php';

/**
 * `index.php` de Adminer: envuelve a `adminer.php` (el archivo oficial, intacto). Con un token
 * válido en la URL lo canjea en el servidor del núcleo, simula el envío del formulario de inicio de
 * sesión con esas credenciales (la clave nunca viaja por la URL) y deja que Adminer abra la sesión
 * y redirija a la base. Un plugin propio salta solo el chequeo CSRF de ese envío (no hay formulario
 * que lo lleve). Sin token, o si no vale, Adminer muestra su pantalla de inicio normal.
 *
 * El plugin también limita a qué servidor se conecta Adminer: solo `127.0.0.1` y los puertos de las
 * instancias de WolfCore Dev (`puertos`), tanto en el envío propio como en el formulario normal.
 * Así el vhost interno no sirve de puente a servidores de la red.
 */
export function phpAdminerLogin(o: { dirAcceso: string; puertos: readonly number[] }): string {
  const puertos = [...new Set(o.puertos.filter((p) => Number.isInteger(p) && p > 0 && p < 65536))]
    .sort((a, b) => a - b)
    .join(', ');
  return `<?php
// WolfCore Dev: entrada de Adminer con un token de un solo uso. Archivo generado: no lo edite.
if (!is_file(__DIR__ . '/adminer.php')) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html><head><meta charset="utf-8"><title>WolfCore Dev</title></head>'
        . '<body style="font-family:system-ui,sans-serif;margin:3em;color:#333"><h1>WolfCore Dev</h1>'
        . '<p>Falta Adminer: instálalo de nuevo desde Servicios en WolfCore Dev.</p>'
        . '<p>Adminer is missing: install it again from Services in WolfCore Dev.</p>'
        . '<p>O Adminer não foi encontrado: instale-o de novo em Serviços no WolfCore Dev.</p>'
        . '<p>Adminer est introuvable : réinstallez-le depuis Services dans WolfCore Dev.</p>'
        . '</body></html>';
    exit;
}
$wolfcorePuertos = array(${puertos});

function wolfcore_servidor_permitido($servidor) {
    return is_string($servidor)
        && preg_match('/^127\\.0\\.0\\.1:([0-9]{1,5})$/', $servidor, $m) === 1
        && in_array((int) $m[1], $GLOBALS['wolfcorePuertos'], true);
}
${phpCanje(o.dirAcceso, 'adminer')}
$wolfcoreAcceso = null;
if (isset($_GET['wolfcore_token'])) {
    $token = $_GET['wolfcore_token'];
    unset($_GET['wolfcore_token']);
    if (is_string($token) && preg_match('/^[A-Za-z0-9_-]{43}$/', $token) && empty($_POST)) {
        $wolfcoreAcceso = wolfcore_canjear($token);
    }
    if ($wolfcoreAcceso !== null && !wolfcore_servidor_permitido('127.0.0.1:' . (int) $wolfcoreAcceso['puerto'])) {
        $wolfcoreAcceso = null;
    }
    if ($wolfcoreAcceso !== null) {
        $controlador = $wolfcoreAcceso['motor'] === 'postgresql' ? 'pgsql' : 'server';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['auth'] = array(
            'driver' => $controlador,
            'server' => '127.0.0.1:' . (int) $wolfcoreAcceso['puerto'],
            'username' => $wolfcoreAcceso['usuario'],
            'password' => $wolfcoreAcceso['clave'],
            'db' => $wolfcoreAcceso['base'],
            'permanent' => '',
        );
        $wolfcoreAcceso = true;
    }
}

function adminer_object() {
    if (!class_exists('WolfCoreAcceso', false)) {
        class WolfCoreAcceso extends \\Adminer\\Plugin {
            // El envío lo armó este script, no un formulario: no hay token CSRF que comprobar.
            function verifyLoginToken() {
                return $GLOBALS['wolfcoreAcceso'] === true ? false : null;
            }
            // Solo los servidores de WolfCore Dev; cualquier otro se rechaza antes de conectar.
            function login($login, $password) {
                return wolfcore_servidor_permitido(\\Adminer\\SERVER) ? null : 'WolfCore Dev: servidor no permitido.';
            }
            function credentials() {
                return wolfcore_servidor_permitido(\\Adminer\\SERVER) ? null : array('127.0.0.1:1', '', null);
            }
        }
    }
    return new \\Adminer\\Plugins(array(new WolfCoreAcceso()));
}

require __DIR__ . '/adminer.php';
`;
}
