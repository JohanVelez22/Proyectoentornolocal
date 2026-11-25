import { describe, expect, it } from 'vitest';
import { generarNginxPrincipal, puertosPhp } from '../src/nginx/principal';
import { generarVhost, nombreUpstream } from '../src/nginx/plantillas';
import type { Sitio } from '../src/tipos';

const sitio = (o: Partial<Sitio>): Sitio => ({
  id: 'a',
  nombre: 'A',
  dominio: 'a.test',
  alias: [],
  carpeta: 'C:\\Proyectos\\a',
  tipo: 'estatico',
  php: null,
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  nota: '',
  https: false,
  redirigirHttps: false,
  confiado: false,
  git: null,
  procesos: [],
  runtimes: {},
  ...o,
});
const o = { puertoNginx: 80, rutasLogs: { acceso: 'C:\\L\\a.log', error: 'C:\\L\\e.log' } };

describe('nombreUpstream / puertosPhp', () => {
  it('calcula nombres y puertos', () => {
    expect(nombreUpstream('8.4')).toBe('php84');
    expect(puertosPhp('8.4', 2)).toEqual([9840, 9841]);
    expect(puertosPhp('8.3', 2)).toEqual([9830, 9831]);
  });
});

describe('generarVhost', () => {
  it('estático y personalizado niegan archivos ocultos salvo .well-known', () => {
    const regla = 'location ~* /\\.(?!well-known) { deny all; }';
    expect(generarVhost(sitio({ tipo: 'estatico' }), o)).toContain(regla);
    expect(generarVhost(sitio({ tipo: 'personalizado', php: null }), o)).toContain(regla);
    expect(generarVhost(sitio({ tipo: 'personalizado', php: '8.4' }), o)).toContain(regla);
  });

  it('laravel', () => {
    const v = generarVhost(
      sitio({
        tipo: 'laravel',
        php: '8.4',
        alias: ['b.test'],
        carpeta: 'C:\\Proyectos\\WolfCore System',
      }),
      o,
    );
    for (const l of [
      'server_name a.test b.test;',
      'listen 80;',
      'charset utf-8;',
      'access_log "C:/L/a.log";',
      'error_log "C:/L/e.log";',
      'root "C:/Proyectos/WolfCore System/public";',
      'index index.php index.html;',
      'try_files $uri $uri/ /index.php?$query_string;',
      'location = /index.php {',
      'fastcgi_pass php84;',
      'include fastcgi_params;',
      'fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
      'location ~* \\.php$ { return 404; }',
      'location ~* /\\.(?!well-known) { deny all; }',
    ])
      expect(v).toContain(l);
  });

  it('ci3: bloques de denegación antes de location /, reglasExtra antes de todo', () => {
    const v = generarVhost(
      sitio({ tipo: 'codeigniter3', php: '8.3', reglasExtra: 'add_header X-Foo "1";' }),
      o,
    );
    expect(v).toContain('root "C:/Proyectos/a";');
    for (const d of ['application', 'system', 'sql', 'docs', 'tests'])
      expect(v).toContain(`location ^~ /${d}/ { deny all; }`);
    expect(v.indexOf('location ^~ /application/')).toBeLessThan(v.indexOf('location / {'));
    expect(v.indexOf('add_header X-Foo')).toBeLessThan(v.indexOf('location ^~ /application/'));
    expect(v).toContain('location ~* /\\. { deny all; }');
    expect(v).toContain(
      'location ~* \\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }',
    );
    expect(v).toContain('location ~* (^|/)(composer|package)(-lock)?\\.json$ { deny all; }');
    expect(v).toContain('location ^~ /vendor/ {');
    expect(v).toContain('try_files $uri $uri/ /index.php$is_args$query_string;');
    expect(v).toContain('fastcgi_pass php83;');
    expect(v).toContain('location ~* \\.php$ { return 404; }');
  });

  it('reglas regex sin distinguir mayúsculas y bloque vendor completo', () => {
    const ci = generarVhost(sitio({ tipo: 'codeigniter3', php: '8.3' }), o);
    const lv = generarVhost(sitio({ tipo: 'laravel', php: '8.3' }), o);
    expect(ci).toContain('location ~* \\.php$ { return 404; }');
    expect(lv).toContain('location ~* \\.php$ { return 404; }');
    expect(lv).toContain('location ~* /\\.(?!well-known) { deny all; }');
    expect(ci).toContain('location ~* /\\. { deny all; }');
    expect(ci).not.toMatch(/location ~ /);
    expect(lv).not.toMatch(/location ~ /);
    const vendor = ci.slice(ci.indexOf('location ^~ /vendor/ {'));
    const bloque = vendor.slice(0, vendor.indexOf('try_files $uri =404;'));
    expect(bloque).toContain('location ~* /\\. { deny all; }');
    expect(bloque).toContain('location ~* \\.(php\\d?|phtml|phar|phps)$ { deny all; }');
    expect(bloque).toContain('(composer|package)(-lock)?\\.json$ { deny all; }');
    expect(bloque).toContain('\\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$');
    const pers = generarVhost(sitio({ tipo: 'personalizado', php: '8.4' }), o);
    expect(pers).toContain('location ~* \\.php$ {');
  });

  it('proxy sin puerto lanza error', () => {
    expect(() => generarVhost(sitio({ tipo: 'proxy', dominio: 'p.test' }), o)).toThrow(
      'El sitio p.test necesita un puerto de proxy',
    );
  });

  it('estático', () => {
    const v = generarVhost(sitio({}), o);
    expect(v).toContain('root "C:/Proyectos/a";');
    expect(v).toContain('index index.html;');
    expect(v).toContain('try_files $uri $uri/ =404;');
  });

  it('proxy', () => {
    const v = generarVhost(sitio({ tipo: 'proxy', puertoProxy: 3000 }), o);
    expect(v).toContain('proxy_pass http://127.0.0.1:3000;');
    expect(v).toContain('proxy_http_version 1.1;');
    expect(v).toContain('proxy_set_header Upgrade $http_upgrade;');
    expect(v).toContain('proxy_set_header Connection "upgrade";');
    expect(v).toContain('proxy_set_header Host $host;');
    expect(v).toContain('proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    expect(v).toContain('proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;');
  });

  it('personalizado: reglasExtra y fastcgi genérico si hay PHP', () => {
    const v = generarVhost(sitio({ tipo: 'personalizado', php: '8.4', reglasExtra: '# mío' }), o);
    expect(v).toContain('root "C:/Proyectos/a";');
    expect(v).toContain('# mío');
    expect(v).toContain('location ~* \\.php$ {');
    expect(v).toContain('fastcgi_pass php84;');
    expect(generarVhost(sitio({ tipo: 'personalizado' }), o)).not.toContain('fastcgi');
  });

  it('lanza error si necesita PHP y no hay versión', () => {
    expect(() => generarVhost(sitio({ tipo: 'laravel', dominio: 'x.test' }), o)).toThrow(
      'El sitio x.test necesita una versión de PHP',
    );
  });
});

describe('generarNginxPrincipal', () => {
  it('servidor por defecto: 404 breve para un Host desconocido, antes de los sitios', () => {
    const c = generarNginxPrincipal({
      prefijo: 'C:/D/nginx',
      sitesDir: 'C:/D/sites',
      phpUpstreams: [],
      logsDir: 'C:/D/logs',
      puerto: 8089,
    });
    expect(c).toContain('listen 8089 default_server;');
    expect(c).toContain('server_name _;');
    expect(c).toMatch(/return 404 '[^']*Sitio no encontrado en WolfCore Dev[^']*';/);
    expect(c.indexOf('default_server')).toBeLessThan(c.indexOf('include "C:/D/sites/*.conf";'));
  });

  it('incluye los vhosts auxiliares (túneles, red local) aparte de los de los sitios', () => {
    const base = {
      prefijo: 'C:/D/nginx',
      sitesDir: 'C:/D/sites',
      phpUpstreams: [],
      logsDir: 'C:/D/logs',
      puerto: 8089,
    };
    const c = generarNginxPrincipal({ ...base, extrasDir: 'C:/D/extras' });
    expect(c).toContain('include "C:/D/extras/*.conf";');
    expect(c.indexOf('sites/*.conf')).toBeLessThan(c.indexOf('extras/*.conf'));
    expect(generarNginxPrincipal(base)).not.toContain('extras');
  });

  it('genera upstreams, include e ítems base', () => {
    const c = generarNginxPrincipal({
      puerto: 80,
      prefijo: 'C:\\Datos\\nginx',
      sitesDir: 'C:\\Datos\\etc\\nginx\\sites',
      phpUpstreams: [{ version: '8.3', puertos: [9830, 9831] }],
      logsDir: 'C:\\Datos\\logs',
    });
    expect(c).toContain('worker_processes 1;');
    expect(c).toContain('events {');
    expect(c).toContain('include mime.types;');
    expect(c).toContain('client_max_body_size 64m;');
    // Dominios largos (wolfcore-diamantes.test) no deben romper `nginx -t`.
    expect(c).toContain('server_names_hash_bucket_size 128;');
    expect(c).toContain('upstream php83 {');
    expect(c).toContain('server 127.0.0.1:9830;');
    expect(c).toContain('server 127.0.0.1:9831;');
    expect(c).toContain('include "C:/Datos/etc/nginx/sites/*.conf";');
    expect(c).toContain('error_log "C:/Datos/logs/nginx-error.log";');
    expect(c).toContain('pid "C:/Datos/logs/nginx.pid";');
    expect(c).toContain('client_body_temp_path "C:/Datos/nginx/temp/client_body";');
  });
});

describe('generarVhost con HTTPS', () => {
  const https = { puerto: 443, crt: 'C:\\C\\a.crt', key: 'C:\\C\\a.key' };
  const REDIR =
    'set $pel_redir 1; if ($http_cf_connecting_ip) { set $pel_redir 0; } if ($http_x_forwarded_proto = "https") { set $pel_redir 0; } if ($pel_redir) { return 301 https://$host$request_uri; }';

  it('sin opciones https no emite ssl aunque el sitio lo pida', () => {
    expect(generarVhost(sitio({ https: true }), o)).not.toContain('ssl');
  });

  it('con https agrega listen ssl, http2 y los certificados', () => {
    const v = generarVhost(sitio({ https: true }), { ...o, https });
    expect(v).toContain('listen 80;');
    expect(v).toContain('listen 443 ssl;');
    expect(v).toContain('http2 on;');
    expect(v).toContain('ssl_certificate "C:/C/a.crt";');
    expect(v).toContain('ssl_certificate_key "C:/C/a.key";');
    expect(v).not.toContain('pel_redir');
  });

  it('con redirección: el server HTTP redirige salvo túnel y el HTTPS no redirige nunca', () => {
    const v = generarVhost(sitio({ https: true, redirigirHttps: true }), { ...o, https });
    const [http, ssl] = v.split('\nserver {');
    expect(http).toContain(REDIR);
    expect(http).toContain('listen 80;');
    expect(http).not.toContain('ssl_certificate');
    expect(ssl).toContain('listen 443 ssl;');
    expect(ssl).not.toContain('pel_redir');
    // El túnel de Cloudflare llega por HTTP con estas cabeceras: nunca debe redirigir.
    expect(v.indexOf('$http_cf_connecting_ip')).toBeLessThan(v.indexOf('return 301'));
  });

  it('con un puerto distinto de 443 la redirección incluye el puerto', () => {
    const v = generarVhost(sitio({ https: true, redirigirHttps: true }), {
      ...o,
      https: { ...https, puerto: 8443 },
    });
    expect(v).toContain('return 301 https://$host:8443$request_uri;');
  });
});

describe('generarNginxPrincipal con HTTPS', () => {
  const principal = {
    prefijo: 'C:\\n',
    sitesDir: 'C:\\s',
    phpUpstreams: [],
    logsDir: 'C:\\l',
    puerto: 80,
  };
  it('escucha también en el puerto HTTPS con el certificado de localhost', () => {
    const c = generarNginxPrincipal({
      ...principal,
      https: { puerto: 443, crt: 'C:\\c\\l.crt', key: 'C:\\c\\l.key' },
    });
    expect(c).toContain('listen 443 ssl default_server;');
    expect(c).toContain('ssl_certificate "C:/c/l.crt";');
  });
  it('sin https no escucha en 443', () => {
    expect(generarNginxPrincipal(principal)).not.toContain('ssl');
  });
});
