/**
 * Fragmentos listos para las reglas propias de un sitio (van dentro de su bloque `server`). La
 * interfaz los inserta como texto: el usuario los ve y los puede cambiar antes de aplicar, y pasan
 * por la misma revisión y `nginx -t` que cualquier regla. `titulo` es una clave de i18n.
 */
export interface SnippetNginx {
  id: string;
  /** Clave de i18n (`nginxEditor.snippets.<id>`). */
  titulo: string;
  texto: string;
}

const s = (id: string, lineas: string[]): SnippetNginx => ({
  id,
  titulo: `nginxEditor.snippets.${id}`,
  texto: lineas.join('\n'),
});

export const SNIPPETS_NGINX: readonly SnippetNginx[] = [
  s('cors', [
    '# CORS: permite peticiones desde otro origen (cambie * por el origen exacto si usa cookies)',
    'add_header Access-Control-Allow-Origin "*" always;',
    'add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;',
    'add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;',
    'if ($request_method = OPTIONS) { return 204; }',
  ]),
  s('cache-estaticos', [
    '# Caché del navegador para archivos estáticos (sitios PHP o estáticos)',
    'location ~* \\.(css|js|mjs|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf)$ {',
    '    expires 30d;',
    '    add_header Cache-Control "public";',
    '    access_log off;',
    '    try_files $uri =404;',
    '}',
  ]),
  s('limite-subida', [
    '# Tamaño máximo de una subida (por defecto 64m)',
    'client_max_body_size 256m;',
  ]),
  s('spa', [
    '# Aplicación de una sola página: las rutas desconocidas cargan index.html',
    'error_page 404 = /index.html;',
  ]),
  s('cabeceras-seguridad', [
    '# Cabeceras de seguridad básicas',
    'add_header X-Frame-Options "SAMEORIGIN" always;',
    'add_header X-Content-Type-Options "nosniff" always;',
    'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
  ]),
  s('websocket', [
    '# WebSocket hacia un servidor local (Reverb, Soketi, Socket.IO…): ajuste la ruta y el puerto',
    'location /ws/ {',
    '    proxy_pass http://127.0.0.1:6001;',
    '    proxy_http_version 1.1;',
    '    proxy_set_header Upgrade $http_upgrade;',
    '    proxy_set_header Connection "upgrade";',
    '    proxy_set_header Host $host;',
    '    proxy_read_timeout 3600s;',
    '}',
  ]),
  s('gzip', [
    '# Compresión gzip de las respuestas de texto',
    'gzip on;',
    'gzip_vary on;',
    'gzip_min_length 1024;',
    'gzip_types text/plain text/css application/javascript application/json image/svg+xml;',
  ]),
  s('ocultos', [
    '# Niega archivos y carpetas ocultos (.env, .git…) salvo .well-known',
    'location ~ /\\.(?!well-known) { deny all; }',
  ]),
];
