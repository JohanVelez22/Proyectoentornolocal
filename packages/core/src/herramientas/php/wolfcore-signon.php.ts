/** Cadena PHP entre comillas simples (solo `\` y `'` se escapan). */
export const cadenaPhp = (t: string): string =>
  `'${t.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * Función PHP `wolfcore_canjear($token)`: canjea el token contra el servidor del núcleo (solo
 * 127.0.0.1) con el secreto de proceso que está en `etc/acceso-bd/secreto`. Devuelve los datos de
 * acceso o null. Compatible con PHP 7.2 en adelante (sin tipos de retorno nuevos ni `str_*`).
 */
export function phpCanje(dirAcceso: string, herramienta: 'adminer' | 'phpmyadmin'): string {
  return `
function wolfcore_canjear($token) {
    $dir = ${cadenaPhp(dirAcceso)};
    $secreto = @file_get_contents($dir . '/secreto');
    $puerto = (int) trim((string) @file_get_contents($dir . '/puerto'));
    if (!is_string($secreto) || trim($secreto) === '' || $puerto < 1024 || $puerto > 65535) {
        return null;
    }
    $contexto = stream_context_create(array('http' => array(
        'method' => 'POST',
        'header' => "Content-Type: application/json\\r\\nX-Wolfcore-Secreto: " . trim($secreto) . "\\r\\nConnection: close\\r\\n",
        'content' => json_encode(array('token' => $token, 'herramienta' => ${cadenaPhp(herramienta)})),
        'timeout' => 5,
        'ignore_errors' => true,
        'follow_location' => 0,
    )));
    $respuesta = @file_get_contents('http://127.0.0.1:' . $puerto . '/canjear', false, $contexto);
    $codigo = isset($http_response_header[0]) ? (int) substr($http_response_header[0], 9, 3) : 0;
    if (!is_string($respuesta) || $codigo !== 200) {
        return null;
    }
    $d = json_decode($respuesta, true);
    if (!is_array($d) || !isset($d['usuario'], $d['clave'], $d['puerto'], $d['base'], $d['motor'], $d['host'])
        || !is_string($d['usuario']) || !is_string($d['clave']) || !is_int($d['puerto'])
        || !is_string($d['base']) || !is_string($d['motor']) || $d['host'] !== '127.0.0.1') {
        return null;
    }
    return $d;
}
`;
}

/** Aviso cuando el enlace no vale (en los cuatro idiomas de la app). */
const AVISO_ENLACE = `
function wolfcore_fin($codigo) {
    http_response_code($codigo);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html><head><meta charset="utf-8"><title>WolfCore Dev</title></head>'
        . '<body style="font-family:system-ui,sans-serif;margin:3em;color:#333">'
        . '<h1>WolfCore Dev</h1>'
        . '<p>Este enlace caducó o ya se usó. Ábrelo de nuevo desde WolfCore Dev.</p>'
        . '<p>This link expired or was already used. Open it again from WolfCore Dev.</p>'
        . '<p>Este link expirou ou já foi usado. Abra-o de novo no WolfCore Dev.</p>'
        . '<p>Ce lien a expiré ou a déjà été utilisé. Rouvrez-le depuis WolfCore Dev.</p>'
        . '</body></html>';
    exit;
}
`;

/**
 * `wolfcore-signon.php` de phpMyAdmin (`auth_type = signon`): canjea el token de la URL, abre la
 * sesión de entrada con el usuario de la base y redirige a la base **sin** el token. La clave no
 * se escribe en ninguna salida ni en la URL; solo queda en la sesión de PHP (carpeta propia).
 * Con un token que no vale, muestra el aviso y no abre nada.
 */
export function phpSignon(o: { dirAcceso: string; sesiones: string }): string {
  return `<?php
// WolfCore Dev: entrada de phpMyAdmin con un token de un solo uso. Archivo generado: no lo edite.
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
${AVISO_ENLACE}${phpCanje(o.dirAcceso, 'phpmyadmin')}
function wolfcore_servidor($puerto) {
    $cfg = array();
    $i = 0;
    include __DIR__ . '/config.inc.php';
    foreach ($cfg['Servers'] as $n => $s) {
        if (isset($s['port']) && (int) $s['port'] === (int) $puerto) {
            return (int) $n;
        }
    }
    return 0;
}

$token = isset($_GET['wolfcore_token']) ? $_GET['wolfcore_token'] : '';
if (!is_string($token) || !preg_match('/^[A-Za-z0-9_-]{43}$/', $token)) {
    wolfcore_fin(403);
}
$datos = wolfcore_canjear($token);
if ($datos === null) {
    wolfcore_fin(403);
}
$servidor = wolfcore_servidor($datos['puerto']);
if ($servidor < 1 || ($datos['motor'] !== 'mysql' && $datos['motor'] !== 'mariadb')) {
    wolfcore_fin(403);
}
@mkdir(${cadenaPhp(o.sesiones)}, 0700, true);
session_save_path(${cadenaPhp(o.sesiones)});
session_name('WolfCoreSignon');
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(array('lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax'));
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', false, true);
}
session_start();
session_regenerate_id(true);
$_SESSION['PMA_single_signon_user'] = $datos['usuario'];
$_SESSION['PMA_single_signon_password'] = $datos['clave'];
$_SESSION['PMA_single_signon_host'] = '127.0.0.1';
$_SESSION['PMA_single_signon_port'] = (int) $datos['puerto'];
$base = $datos['base'];
unset($datos);
session_write_close();
header('Location: index.php?route=/database/structure&server=' . $servidor . '&db=' . rawurlencode($base), true, 303);
exit;
`;
}
