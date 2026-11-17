import { raizDeSitio, type Sitio } from '../tipos';

export interface OpcionesVhost {
  puertoNginx: number;
  rutasLogs: { acceso: string; error: string };
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
  const necesitaPhp = s.tipo === 'laravel' || s.tipo === 'codeigniter3';
  if (necesitaPhp && !s.php) throw new Error(`El sitio ${s.dominio} necesita una versión de PHP`);
  const up = s.php ? nombreUpstream(s.php) : '';

  let cuerpo: string[];
  switch (s.tipo) {
    case 'laravel':
      cuerpo = bloqueLaravel(up);
      break;
    case 'codeigniter3':
      cuerpo = bloqueCi3(up);
      break;
    case 'estatico':
      cuerpo = ['index index.html;', 'location / { try_files $uri $uri/ =404; }', OCULTOS];
      break;
    case 'proxy':
      if (s.puertoProxy === null)
        throw new Error(`El sitio ${s.dominio} necesita un puerto de proxy`);
      cuerpo = bloqueProxy(s.puertoProxy);
      break;
    case 'personalizado':
      cuerpo = [OCULTOS, ...(s.php ? ['location ~* \\.php$ {', ...bloqueFastcgi(up), '}'] : [])];
      break;
  }

  const cabecera = [
    `listen ${o.puertoNginx};`,
    `server_name ${[s.dominio, ...s.alias].join(' ')};`,
    'charset utf-8;',
    `root "${barras(raizDeSitio(s))}";`,
    `access_log "${barras(o.rutasLogs.acceso)}";`,
    `error_log "${barras(o.rutasLogs.error)}";`,
  ];
  const extra = s.reglasExtra.trim() ? s.reglasExtra.replace(/\r\n/g, '\n').trim().split('\n') : [];
  const interior = [...cabecera, ...extra, ...cuerpo].map((l) => `    ${l}`);
  return ['server {', ...interior, '}'].join('\n') + '\n';
}
