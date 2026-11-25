import { phpCanje } from './wolfcore-signon.php';

/**
 * `index.php` de Adminer: envuelve a `adminer.php` (el archivo oficial, intacto). Con un token
 * válido en la URL lo canjea en el servidor del núcleo, simula el envío del formulario de inicio de
 * sesión con esas credenciales (la clave nunca viaja por la URL) y deja que Adminer abra la sesión
 * y redirija a la base. Un plugin propio salta solo el chequeo CSRF de ese envío (no hay formulario
 * que lo lleve). Sin token, o si no vale, Adminer muestra su pantalla de inicio normal.
 */
export function phpAdminerLogin(o: { dirAcceso: string }): string {
  return `<?php
// WolfCore Dev: entrada de Adminer con un token de un solo uso. Archivo generado: no lo edite.
${phpCanje(o.dirAcceso, 'adminer')}
$wolfcoreAcceso = null;
if (isset($_GET['wolfcore_token'])) {
    $token = $_GET['wolfcore_token'];
    unset($_GET['wolfcore_token']);
    if (is_string($token) && preg_match('/^[A-Za-z0-9_-]{43}$/', $token) && empty($_POST)) {
        $wolfcoreAcceso = wolfcore_canjear($token);
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
        }
    }
    return new \\Adminer\\Plugins(array(new WolfCoreAcceso()));
}

require __DIR__ . '/adminer.php';
`;
}
