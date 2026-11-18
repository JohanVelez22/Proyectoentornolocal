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

const limpiar = (ruta: string): string => ruta.replace(/\\/g, '/').replace(/\/+$/, '');

export function generarNginxPrincipal(o: {
  prefijo: string;
  sitesDir: string;
  phpUpstreams: { version: string; puertos: number[] }[];
  logsDir: string;
  /** Puerto de escucha: el servidor por defecto atiende los Host desconocidos. */
  puerto: number;
}): string {
  const prefijo = limpiar(o.prefijo);
  const logs = limpiar(o.logsDir);
  const upstreams = o.phpUpstreams.flatMap((u) => [
    `    upstream ${nombreUpstream(u.version)} {`,
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
      '        server_name _;',
      '        charset utf-8;',
      '        default_type text/html;',
      `        return 404 '${PAGINA_404}';`,
      '    }',
      `    include "${limpiar(o.sitesDir)}/*.conf";`,
      '}',
    ].join('\n') + '\n'
  );
}
