import { nombreUpstream } from './plantillas';

export function puertosPhp(version: string, trabajadores: number): number[] {
  const [mayor, menor] = version.split('.').map(Number);
  const base = 9000 + (mayor ?? 0) * 100 + (menor ?? 0) * 10;
  return Array.from({ length: trabajadores }, (_, i) => base + i);
}

const PAGINA_404 =
  '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sitio no encontrado</title>' +
  '<body style="font-family:system-ui,sans-serif;margin:3em;color:#333">' +
  '<h1>Sitio no encontrado en WolfCore Dev</h1>' +
  '<p>Ningún sitio de WolfCore Dev responde a este nombre. Revise la dirección o el dominio del sitio.</p>' +
  '</body></html>';

/** Puerto del vhost interno de Adminer (solo 127.0.0.1). */
export const PUERTO_ADMINER = 8090;

/** Puerto del vhost interno de phpMyAdmin (solo 127.0.0.1). */
export const PUERTO_PHPMYADMIN = 8091;

const limpiar = (ruta: string): string => ruta.replace(/\\/g, '/').replace(/\/+$/, '');

/** Solo index.php (y estáticos); lo demás, 404. Escucha únicamente en 127.0.0.1. */
function bloqueAdminer(a: { raiz: string; puertos: number[] }): string[] {
  const raiz = limpiar(a.raiz);
  const php = [
    '            fastcgi_pass adminer_php;',
    '            include fastcgi_params;',
    `            fastcgi_param SCRIPT_FILENAME "${raiz}/index.php";`,
    '            fastcgi_param SCRIPT_NAME /index.php;',
  ];
  return [
    '    upstream adminer_php {',
    ...a.puertos.map((p) => `        server 127.0.0.1:${p};`),
    '    }',
    '    server {',
    `        listen 127.0.0.1:${PUERTO_ADMINER};`,
    '        server_name 127.0.0.1 localhost;',
    // La URL de entrada lleva un token: no queda en ningún registro de acceso.
    '        access_log off;',
    `        root "${raiz}";`,
    '        index index.php;',
    '        location = / {',
    ...php,
    '        }',
    '        location = /index.php {',
    ...php,
    '        }',
    '        location ~* \\.(css|js|png|gif|ico|svg|woff2?)$ { try_files $uri =404; }',
    '        location / {',
    '            return 404;',
    '        }',
    '    }',
  ];
}

/**
 * phpMyAdmin: solo `index.php`, `url.php`, `js/messages.php` y el script de entrada ejecutan PHP; los
 * estáticos salen únicamente de `js/` y `themes/`. Nada más se sirve (ni `setup/`, `libraries/`,
 * `vendor/`, `config.inc.php`). Escucha únicamente en 127.0.0.1 y no registra los accesos.
 */
function bloquePhpMyAdmin(a: { raiz: string; puertos: number[] }): string[] {
  const raiz = limpiar(a.raiz);
  const php = (archivo: string): string[] => [
    '            fastcgi_pass pma_php;',
    '            include fastcgi_params;',
    `            fastcgi_param SCRIPT_FILENAME "${raiz}/${archivo}";`,
    `            fastcgi_param SCRIPT_NAME /${archivo};`,
    // Sin avisos de PHP en la salida: un aviso rompería las respuestas JSON de phpMyAdmin.
    '            fastcgi_param PHP_VALUE "display_errors=Off\\nerror_reporting=8191";',
  ];
  const exacta = (ruta: string, archivo: string): string[] => [
    `        location = ${ruta} {`,
    ...php(archivo),
    '        }',
  ];
  return [
    '    upstream pma_php {',
    ...a.puertos.map((p) => `        server 127.0.0.1:${p};`),
    '    }',
    '    server {',
    `        listen 127.0.0.1:${PUERTO_PHPMYADMIN};`,
    '        server_name 127.0.0.1 localhost;',
    '        access_log off;',
    `        root "${raiz}";`,
    '        index index.php;',
    ...exacta('/', 'index.php'),
    ...exacta('/index.php', 'index.php'),
    ...exacta('/url.php', 'url.php'),
    ...exacta('/js/messages.php', 'js/messages.php'),
    ...exacta('/wolfcore-signon.php', 'wolfcore-signon.php'),
    '        location = /favicon.ico { try_files $uri =404; }',
    '        location ~* ^/(js|themes)/.+\\.(css|js|map|png|gif|jpe?g|ico|svg|woff2?|ttf|eot)$ { try_files $uri =404; }',
    '        location / {',
    '            return 404;',
    '        }',
    '    }',
  ];
}

export function generarNginxPrincipal(o: {
  prefijo: string;
  sitesDir: string;
  phpUpstreams: { version: string; puertos: number[]; nombre?: string }[];
  logsDir: string;
  /** Puerto de escucha: el servidor por defecto atiende los Host desconocidos. */
  puerto: number;
  /** También escucha por HTTPS con el certificado de localhost (solo si el HTTPS es usable). */
  https?: { puerto: number; crt: string; key: string };
  /** Vhost interno de Adminer: carpeta con index.php y puertos del PHP que lo atiende. */
  adminer?: { raiz: string; puertos: number[] };
  /** Vhost interno de phpMyAdmin: carpeta instalada y puertos del PHP que lo atiende. */
  phpmyadmin?: { raiz: string; puertos: number[] };
}): string {
  const prefijo = limpiar(o.prefijo);
  const logs = limpiar(o.logsDir);
  const upstreams = o.phpUpstreams.flatMap((u) => [
    `    upstream ${u.nombre ?? nombreUpstream(u.version)} {`,
    ...u.puertos.map((p) => `        server 127.0.0.1:${p};`),
    '    }',
  ]);
  return (
    [
      'worker_processes 1;',
      `error_log "${logs}/nginx-error.log";`,
      `pid "${logs}/nginx.pid";`,
      '',
      'events {',
      '    worker_connections 1024;',
      '}',
      '',
      'http {',
      '    include mime.types;',
      '    default_type application/octet-stream;',
      '    sendfile on;',
      '    keepalive_timeout 65;',
      '    client_max_body_size 64m;',
      // Con el valor por defecto (32 en muchos equipos) un dominio de ~22 letras o más, como
      // wolfcore-diamantes.test, hace fallar `nginx -t` (could not build server_names_hash).
      '    server_names_hash_bucket_size 128;',
      `    client_body_temp_path "${prefijo}/temp/client_body";`,
      `    proxy_temp_path "${prefijo}/temp/proxy";`,
      `    fastcgi_temp_path "${prefijo}/temp/fastcgi";`,
      `    uwsgi_temp_path "${prefijo}/temp/uwsgi";`,
      `    scgi_temp_path "${prefijo}/temp/scgi";`,
      ...upstreams,
      // Host desconocido (un túnel mal dirigido o un dominio mal escrito): 404 propio en vez
      // de servir el primer sitio que encuentre nginx.
      '    server {',
      `        listen ${o.puerto} default_server;`,
      ...(o.https
        ? [
            `        listen ${o.https.puerto} ssl default_server;`,
            `        ssl_certificate "${limpiar(o.https.crt)}";`,
            `        ssl_certificate_key "${limpiar(o.https.key)}";`,
          ]
        : []),
      '        server_name _;',
      '        charset utf-8;',
      '        default_type text/html;',
      `        return 404 '${PAGINA_404}';`,
      '    }',
      ...(o.adminer ? bloqueAdminer(o.adminer) : []),
      ...(o.phpmyadmin ? bloquePhpMyAdmin(o.phpmyadmin) : []),
      `    include "${limpiar(o.sitesDir)}/*.conf";`,
      '}',
    ].join('\n') + '\n'
  );
}
