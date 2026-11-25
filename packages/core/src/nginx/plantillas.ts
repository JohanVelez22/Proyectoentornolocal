import { necesitaPoolPropio, nombreUpstreamSitio } from '../php/poolSitio';
import { puertoDelProxy, raizDeSitio, TIPOS_CON_PHP, type Sitio } from '../tipos';

export interface OpcionesVhost {
  puertoNginx: number;
  rutasLogs: { acceso: string; error: string };
  /** Solo si el HTTPS es usable (CA creada, puerto libre o propio, certificado emitido). */
  https?: { puerto: number; crt: string; key: string };
}

/**
 * Redirige a HTTPS salvo en los túneles: Cloudflare entra por HTTP con Cf-Connecting-Ip (y
 * X-Forwarded-Proto https) y redirigirlo crearía un bucle.
 */
function redireccion(puertoHttps: number): string {
  const destino = puertoHttps === 443 ? '$host' : `$host:${puertoHttps}`;
  return (
    'set $pel_redir 1; if ($http_cf_connecting_ip) { set $pel_redir 0; } ' +
    'if ($http_x_forwarded_proto = "https") { set $pel_redir 0; } ' +
    `if ($pel_redir) { return 301 https://${destino}$request_uri; }`
  );
}

export function nombreUpstream(version: string): string {
  return `php${version.replace('.', '')}`;
}

const barras = (ruta: string): string => ruta.replace(/\\/g, '/');

/** Niega archivos y carpetas ocultos (.env, .git…) salvo .well-known. */
const OCULTOS = 'location ~* /\\.(?!well-known) { deny all; }';

function bloqueFastcgi(up: string): string[] {
  return [
    `    fastcgi_pass ${up};`,
    '    include fastcgi_params;',
    '    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
  ];
}

function bloqueIndexPhp(up: string): string[] {
  return ['location = /index.php {', ...bloqueFastcgi(up), '}'];
}

function bloqueLaravel(up: string): string[] {
  return [
    'index index.php index.html;',
    'location / { try_files $uri $uri/ /index.php?$query_string; }',
    ...bloqueIndexPhp(up),
    'location ~* \\.php$ { return 404; }',
    OCULTOS,
  ];
}

function bloqueCi3(up: string): string[] {
  return [
    'index index.php index.html;',
    ...['application', 'system', 'sql', 'docs', 'tests'].map(
      (d) => `location ^~ /${d}/ { deny all; }`,
    ),
    'location ~* /\\. { deny all; }',
    'location ~* \\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }',
    'location ~* (^|/)(composer|package)(-lock)?\\.json$ { deny all; }',
    'location ^~ /vendor/ {',
    '    location ~* /\\. { deny all; }',
    '    location ~* \\.(php\\d?|phtml|phar|phps)$ { deny all; }',
    '    location ~* \\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }',
    '    location ~* (^|/)(composer|package)(-lock)?\\.json$ { deny all; }',
    '    try_files $uri =404;',
    '}',
    'location / { try_files $uri $uri/ /index.php$is_args$query_string; }',
    ...bloqueIndexPhp(up),
    'location ~* \\.php$ { return 404; }',
  ];
}

/** Extensiones que nunca se sirven (respaldos, registros, configuración). */
const SENSIBLES =
  'location ~* \\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }';

/** CodeIgniter 4: raíz en public/ (app/ y writable/ quedan fuera), index.php como único PHP. */
function bloqueCi4(up: string): string[] {
  return [
    'index index.php index.html;',
    'location / { try_files $uri $uri/ /index.php$is_args$query_string; }',
    ...bloqueIndexPhp(up),
    OCULTOS,
    SENSIBLES,
    'location ~* \\.php$ { return 404; }',
  ];
}

/**
 * WordPress ejecuta muchos .php (wp-admin, wp-login…), así que se permite PHP en general salvo
 * wp-config.php, xmlrpc.php y cualquier PHP dentro de uploads.
 */
function bloqueWordpress(up: string): string[] {
  return [
    'index index.php index.html;',
    'location = /wp-config.php { deny all; }',
    'location = /xmlrpc.php { deny all; }',
    OCULTOS,
    'location ~* ^/wp-content/uploads/.*\\.(php\\d?|phtml|phar|phps)$ { deny all; }',
    'location ~* \\.(sql|log|ini|sh|bak|old|dist|dump|backup)$ { deny all; }',
    'location / { try_files $uri $uri/ /index.php?$args; }',
    'location ~* \\.php$ {',
    '    try_files $uri =404;',
    ...bloqueFastcgi(up),
    '}',
  ];
}

function bloqueProxy(puerto: number): string[] {
  return [
    'location / {',
    `    proxy_pass http://127.0.0.1:${puerto};`,
    '    proxy_http_version 1.1;',
    '    proxy_set_header Upgrade $http_upgrade;',
    '    proxy_set_header Connection "upgrade";',
    '    proxy_set_header Host $host;',
    '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '    proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;',
    '}',
  ];
}

export function generarVhost(s: Sitio, o: OpcionesVhost): string {
  const necesitaPhp = TIPOS_CON_PHP.includes(s.tipo) && s.tipo !== 'personalizado';
  if (necesitaPhp && !s.php) throw new Error(`El sitio ${s.dominio} necesita una versión de PHP`);
  // Con ajustes propios o Xdebug, el sitio va a su propio pool; si no, al de la rama.
  const up = !s.php
    ? ''
    : necesitaPoolPropio(s)
      ? nombreUpstreamSitio(s.id)
      : nombreUpstream(s.php);

  let cuerpo: string[];
  switch (s.tipo) {
    case 'laravel':
      cuerpo = bloqueLaravel(up);
      break;
    case 'codeigniter3':
      cuerpo = bloqueCi3(up);
      break;
    case 'codeigniter4':
      cuerpo = bloqueCi4(up);
      break;
    case 'wordpress':
      cuerpo = bloqueWordpress(up);
      break;
    case 'estatico':
      cuerpo = ['index index.html;', 'location / { try_files $uri $uri/ =404; }', OCULTOS];
      break;
    case 'proxy':
      if (s.puertoProxy === null)
        throw new Error(`El sitio ${s.dominio} necesita un puerto de proxy`);
      cuerpo = bloqueProxy(s.puertoProxy);
      break;
    case 'fastapi':
    case 'node': {
      const puerto = puertoDelProxy(s);
      if (puerto === null) {
        throw new Error(
          `El sitio ${s.dominio} necesita un puerto de proxy o un proceso con puerto`,
        );
      }
      cuerpo = bloqueProxy(puerto);
      break;
    }
    case 'personalizado':
      cuerpo = [OCULTOS, ...(s.php ? ['location ~* \\.php$ {', ...bloqueFastcgi(up), '}'] : [])];
      break;
  }

  const hosts = [`server_name ${[s.dominio, ...s.alias].join(' ')};`];
  const resto = [
    'charset utf-8;',
    `root "${barras(raizDeSitio(s))}";`,
    `access_log "${barras(o.rutasLogs.acceso)}";`,
    `error_log "${barras(o.rutasLogs.error)}";`,
  ];
  const extra = s.reglasExtra.trim() ? s.reglasExtra.replace(/\r\n/g, '\n').trim().split('\n') : [];
  const servidor = (escuchas: string[], previo: string[] = []): string =>
    [
      'server {',
      ...[...escuchas, ...hosts, ...resto, ...previo, ...extra, ...cuerpo].map((l) => `    ${l}`),
      '}',
    ].join('\n') + '\n';

  const http = [`listen 127.0.0.1:${o.puertoNginx};`];
  const https = o.https && s.https ? o.https : null;
  if (!https) return servidor(http);
  const ssl = [
    `listen 127.0.0.1:${https.puerto} ssl;`,
    'http2 on;',
    `ssl_certificate "${barras(https.crt)}";`,
    `ssl_certificate_key "${barras(https.key)}";`,
  ];
  if (!s.redirigirHttps) return servidor([...http, ...ssl]);
  // Dos servidores: el HTTP redirige (salvo túnel) y el HTTPS nunca, para no crear un bucle.
  return servidor(http, [redireccion(https.puerto)]) + '\n' + servidor(ssl);
}
