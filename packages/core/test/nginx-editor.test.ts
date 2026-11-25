import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Almacen } from '../src/almacen';
import { Eventos, type EventosNucleo } from '../src/eventos';
import {
  analizarNginx,
  EditorVhost,
  MAX_VERSIONES_VHOST,
  revisarVhost,
  type ContextoVhost,
} from '../src/nginx/editor';
import { generarVhost } from '../src/nginx/plantillas';
import { SNIPPETS_NGINX } from '../src/nginx/snippets';
import { Rutas } from '../src/rutas';
import { GestorSitios } from '../src/sitios/sitios';
import type { Sitio } from '../src/tipos';

let base: string;
let rutas: Rutas;
let carpeta: string;

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-vhost-'));
  rutas = new Rutas(base);
  carpeta = path.join(base, 'proyectos', 'blog');
  mkdirSync(path.join(carpeta, 'public'), { recursive: true });
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

const ctx = (): ContextoVhost => ({
  carpeta,
  dominios: ['blog.test', 'www.blog.test'],
  puertoHttp: 80,
  puertoHttps: 443,
  logs: [rutas.logs('sitios', 'blog.access.log'), rutas.logs('sitios', 'blog.error.log')],
  certificados: [rutas.certCrt('blog'), rutas.certKey('blog')],
  // Adminer, Mailpit web, MySQL, MCP, PHP 8.4 de la rama y un pool de otro sitio.
  puertosInternos: [8090, 8025, 3306, 7790, 9840, 9841, 11434, 19000],
  upstreamsPropios: ['php84', 'phpsitio_blog'],
});

const barras = (r: string): string => r.replace(/\\/g, '/');

describe('analizarNginx', () => {
  it('cuenta las llaves como Nginx: comentarios, comillas, ${var} y \\}', () => {
    const arbol = analizarNginx(
      [
        '# } comentario con llave',
        'location /a { return 200 "x } y"; }',
        "add_header X-A '{';",
        'set $b ${host}x;',
        'rewrite ^/c\\}$ /d;',
        'if ($http_x = "https") { return 204; }',
      ].join('\n'),
    );
    expect(arbol.map((d) => d.nombre)).toEqual(['location', 'add_header', 'set', 'rewrite', 'if']);
    expect(arbol[0]!.hijos![0]!.args).toEqual(['200', 'x } y']);
    expect(arbol[2]!.args).toEqual(['$b', '${host}x']);
    expect(arbol[4]!.linea).toBe(6);
  });

  it('traduce \\t \\n \\r también fuera de comillas, como Nginx', () => {
    const [d] = analizarNginx('add_header X a\\tb\\nc\\rd\\"e;');
    expect(d!.args).toEqual(['X', 'a\tb\nc\rd"e']);
  });

  it('el detalle de la sintaxis rota es un código (se traduce en la interfaz)', () => {
    expect(() => analizarNginx('add_header X "abc;')).toThrowError(
      expect.objectContaining({ datos: { linea: 1, detalle: 'sintaxis.comillas_sin_cerrar' } }),
    );
    expect(() => analizarNginx('gzip on;\n}')).toThrowError(
      expect.objectContaining({ datos: { linea: 2, detalle: 'sintaxis.sobra_llave' } }),
    );
  });

  it.each([
    ['sobra una llave (cerraría el server del sitio)', 'gzip on;\n}\nserver { listen 80; }'],
    ['falta una llave', 'location / {\n  return 200;'],
    ['falta un punto y coma', 'gzip on'],
    ['comillas sin cerrar', 'add_header X "abc;'],
    ['";" sin directiva', ';'],
  ])('rechaza la sintaxis rota: %s', (_n, texto) => {
    expect(() => analizarNginx(texto)).toThrowError(
      expect.objectContaining({ codigo: 'nginx.sintaxis' }),
    );
  });
});

describe('revisarVhost: reglas propias', () => {
  it('todos los snippets pasan sin avisos', () => {
    expect(SNIPPETS_NGINX.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        'cors',
        'cache-estaticos',
        'limite-subida',
        'spa',
        'cabeceras-seguridad',
        'websocket',
      ]),
    );
    for (const s of SNIPPETS_NGINX) {
      expect(s.titulo).toBe(`nginxEditor.snippets.${s.id}`);
      expect(revisarVhost(s.texto, 'reglas', ctx()).avisos).toEqual([]);
    }
  });

  it.each([
    ['load_module', 'load_module modules/x.so;', 'nginx.directiva_prohibida'],
    ['include de una ruta', 'include C:/Windows/win.ini;', 'nginx.directiva_prohibida'],
    ['include con comodín', 'include ../sites/*.conf;', 'nginx.directiva_prohibida'],
    ['root fuera del proyecto', 'location /x { root C:/; }', 'nginx.ruta_fuera'],
    ['root con variable', 'location /x { root $document_root/..; }', 'nginx.ruta_fuera'],
    ['alias relativo', 'location /x { alias ../../; }', 'nginx.ruta_fuera'],
    ['alias que escapa con ..', 'location /x { alias "CARPETA/../../"; }', 'nginx.ruta_fuera'],
    [
      'access_log a otro archivo',
      'access_log C:/Users/x/AppData/Roaming/evil.bat;',
      'nginx.ruta_fuera',
    ],
    ['error_log a otro archivo', 'error_log ../x.log;', 'nginx.ruta_fuera'],
    ['certificado ajeno', 'ssl_certificate C:/otro/cert.pem;', 'nginx.ruta_fuera'],
    ['listen', 'listen 8080;', 'nginx.directiva_prohibida'],
    ['server_name (robaría otro dominio)', 'server_name otro.test;', 'nginx.directiva_prohibida'],
    ['server anidado', 'server { listen 80; }', 'nginx.directiva_prohibida'],
    ['njs', 'js_import x.js;', 'nginx.directiva_prohibida'],
    ['perl', 'perl_modules x;', 'nginx.directiva_prohibida'],
    ['lua', 'content_by_lua_block { }', 'nginx.directiva_prohibida'],
    ['temporales', 'client_body_temp_path C:/x;', 'nginx.directiva_prohibida'],
    ['WebDAV', 'location /u { dav_methods PUT DELETE; }', 'nginx.directiva_prohibida'],
    ['proxy_store', 'location /p { proxy_store on; }', 'nginx.directiva_prohibida'],
    ['caché en disco', 'proxy_cache_path C:/c keys_zone=z:1m;', 'nginx.directiva_prohibida'],
    ['upstream', 'upstream x { server 1.2.3.4; }', 'nginx.directiva_prohibida'],
    [
      'SCRIPT_FILENAME fuera del sitio (ejecutaría otro PHP del disco)',
      'location ~ \\.php$ { fastcgi_pass php84; fastcgi_param SCRIPT_FILENAME C:/datos/adminer/index.php; }',
      'nginx.ruta_fuera',
    ],
    [
      'SCRIPT_FILENAME con una variable cualquiera',
      'fastcgi_param SCRIPT_FILENAME $arg_f;',
      'nginx.ruta_fuera',
    ],
    ['PHP_VALUE', 'fastcgi_param PHP_VALUE "auto_prepend_file=x";', 'nginx.directiva_prohibida'],
    ['socket unix', 'location /s { proxy_pass http://unix:/tmp/x.sock:; }', 'nginx.ruta_fuera'],
    [
      'SCRIPT_FILENAME que sale de la raíz con ..',
      'fastcgi_param SCRIPT_FILENAME $document_root/../../datos/adminer/index.php;',
      'nginx.ruta_fuera',
    ],
    [
      'SCRIPT_FILENAME con otra variable tras la raíz',
      'fastcgi_param SCRIPT_FILENAME $realpath_root$arg_f;',
      'nginx.ruta_fuera',
    ],
    [
      'SCRIPT_FILENAME literal (aunque esté en el proyecto)',
      'fastcgi_param SCRIPT_FILENAME CARPETA/public/index.php;',
      'nginx.ruta_fuera',
    ],
    [
      'Adminer por su puerto',
      'location /a { proxy_pass http://127.0.0.1:8090; }',
      'nginx.destino_interno',
    ],
    ['Mailpit web', 'location /m { proxy_pass http://localhost:8025/; }', 'nginx.destino_interno'],
    ['MySQL', 'location /d { proxy_pass http://[::1]:3306; }', 'nginx.destino_interno'],
    ['el MCP', 'location /mcp { proxy_pass http://127.0.0.1:7790/mcp; }', 'nginx.destino_interno'],
    [
      'el PHP de la rama por puerto',
      'location /p { fastcgi_pass 127.0.0.1:9840; }',
      'nginx.destino_interno',
    ],
    [
      'el pool de otro sitio',
      'location /p { fastcgi_pass phpsitio_tienda; }',
      'nginx.destino_interno',
    ],
    ['el PHP de otra rama', 'location /p { fastcgi_pass php83; }', 'nginx.destino_interno'],
    ['el PHP de Adminer', 'location /p { fastcgi_pass adminer_php; }', 'nginx.destino_interno'],
    [
      'un puerto interno en 0.0.0.0',
      'location /p { proxy_pass http://0.0.0.0:3306; }',
      'nginx.destino_interno',
    ],
    [
      'un puerto con variable',
      'location /p { proxy_pass http://127.0.0.1:$arg_p; }',
      'nginx.destino_interno',
    ],
    [
      'proxy_ssl_certificate_key',
      'proxy_ssl_certificate_key C:/x.key;',
      'nginx.directiva_prohibida',
    ],
    [
      'proxy_ssl_trusted_certificate',
      'proxy_ssl_trusted_certificate C:/x;',
      'nginx.directiva_prohibida',
    ],
    ['proxy_ssl_password_file', 'proxy_ssl_password_file C:/x;', 'nginx.directiva_prohibida'],
    ['proxy_ssl_crl', 'proxy_ssl_crl C:/x;', 'nginx.directiva_prohibida'],
    ['grpc_ssl_*', 'grpc_ssl_certificate C:/x;', 'nginx.directiva_prohibida'],
    ['uwsgi_ssl_*', 'uwsgi_ssl_trusted_certificate C:/x;', 'nginx.directiva_prohibida'],
    ['ssl_conf_command', 'ssl_conf_command Options KTLS;', 'nginx.directiva_prohibida'],
    // Nombres que resuelven a este equipo: el puerto interno basta para prohibirlo.
    [
      'otro .test (apunta a 127.0.0.1)',
      'location /a { proxy_pass http://otro.test:8090; }',
      'nginx.destino_interno',
    ],
    ['127.1', 'location /a { proxy_pass http://127.1:8090; }', 'nginx.destino_interno'],
    [
      'IP en decimal',
      'location /a { proxy_pass http://2130706433:11434; }',
      'nginx.destino_interno',
    ],
    ['lvh.me', 'location /a { proxy_pass http://lvh.me:3306; }', 'nginx.destino_interno'],
    [
      'IP en hexadecimal',
      'location /a { proxy_pass http://0x7f000001:8025/; }',
      'nginx.destino_interno',
    ],
    // Rutas internas con ".." o con variables de la petición (salen de la raíz).
    ['rewrite a /../', 'rewrite ^/x$ /../secreto.txt last;', 'nginx.ruta_fuera'],
    ['rewrite con $arg_', 'rewrite ^/x$ /$arg_f last;', 'nginx.ruta_fuera'],
    ['rewrite con $request_uri interno', 'rewrite ^ /p$request_uri last;', 'nginx.ruta_fuera'],
    ['try_files con ..', 'location /x { try_files /../secreto.txt =404; }', 'nginx.ruta_fuera'],
    ['try_files con $http_', 'location /x { try_files /$http_x_f =404; }', 'nginx.ruta_fuera'],
    ['return con ..', 'return 302 /../x;', 'nginx.ruta_fuera'],
    ['error_page con ..', 'error_page 404 /../x.html;', 'nginx.ruta_fuera'],
    ['index con ..', 'index ../../secreto.txt;', 'nginx.ruta_fuera'],
  ])('prohíbe %s', (_n, texto, codigo) => {
    const t = texto.replace('CARPETA', barras(carpeta));
    expect(() => revisarVhost(t, 'reglas', ctx())).toThrowError(
      expect.objectContaining({ codigo }),
    );
  });

  it('permite root/alias dentro del proyecto, include estándar y access_log off', () => {
    const texto = [
      `location /docs/ { alias "${barras(path.join(carpeta, 'docs'))}/"; }`,
      `location /p { root ${barras(path.join(carpeta, 'public'))}; }`,
      'location ~ \\.php$ { include fastcgi_params; fastcgi_pass php84; fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; }',
      `fastcgi_param DOCUMENT_ROOT "${barras(path.join(carpeta, 'public'))}";`,
      'fastcgi_param APP_ENV local;',
      'location ~ ^/api/ { fastcgi_pass phpsitio_blog; fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; fastcgi_param PATH_TRANSLATED $document_root$fastcgi_path_info; }',
      'location /ws/ { proxy_pass http://127.0.0.1:6001; }',
      'location /l { try_files $uri $uri/ /index.php?$query_string; }',
      'rewrite ^/viejo/(.*)$ /index.php?/$1 last;',
      'rewrite ^/fuera$ https://$host$request_uri? permanent;',
      'return 301 https://$host$request_uri;',
      'error_page 404 /404.html;',
      'error_page 500 @error;',
      'index index.php index.html;',
      'access_log off;',
      `error_log "${barras(rutas.logs('sitios', 'blog.error.log'))}";`,
    ].join('\n');
    expect(revisarVhost(texto, 'reglas', ctx()).avisos).toEqual([]);
  });

  it.skipIf(process.platform !== 'win32')(
    'en Windows root/alias llevan unidad (una ruta /x depende de la unidad de Nginx)',
    () => {
      const sinUnidad = barras(carpeta).replace(/^[A-Za-z]:/, '');
      expect(() =>
        revisarVhost(`location /x { root ${sinUnidad}; }`, 'reglas', ctx()),
      ).toThrowError(expect.objectContaining({ codigo: 'nginx.ruta_fuera' }));
    },
  );

  it('un proxy_pass a otro equipo solo se avisa (local y upstreams propios no)', () => {
    const r = revisarVhost(
      [
        'location /a { proxy_pass http://127.0.0.1:3000; }',
        'location /b { proxy_pass http://localhost:5173/; }',
        'location /c { fastcgi_pass phpsitio_blog; }',
        'location /d { proxy_pass https://api.ejemplo.com/v1; }',
        'location /e { proxy_pass http://api.ejemplo.com$request_uri; }',
      ].join('\n'),
      'reglas',
      ctx(),
    );
    expect(r.avisos).toEqual([
      expect.objectContaining({
        codigo: 'nginx.aviso_destino_externo',
        destino: 'https://api.ejemplo.com/v1',
        linea: 4,
      }),
      expect.objectContaining({ destino: 'http://api.ejemplo.com$request_uri', linea: 5 }),
    ]);
  });
});

describe('revisarVhost: vhost completo (modo avanzado)', () => {
  const sitio = (extra: Partial<Sitio> = {}): Sitio =>
    ({
      id: 'blog',
      nombre: 'blog',
      dominio: 'blog.test',
      alias: ['www.blog.test'],
      carpeta,
      tipo: 'laravel',
      php: '8.4',
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      nota: '',
      https: true,
      redirigirHttps: true,
      confiado: false,
      git: null,
      procesos: [],
      runtimes: {},
      ...extra,
    }) as Sitio;
  const generado = (): string =>
    generarVhost(sitio(), {
      puertoNginx: 80,
      rutasLogs: { acceso: ctx().logs[0]!, error: ctx().logs[1]! },
      https: { puerto: 443, crt: rutas.certCrt('blog'), key: rutas.certKey('blog') },
    });

  it('el vhost generado (con HTTPS y redirección) es un buen punto de partida', () => {
    const g = generado();
    expect(revisarVhost(g, 'manual', ctx()).avisos).toEqual([]);
    expect(
      revisarVhost(g.replace('listen 127.0.0.1:80;', 'listen [::1]:80;'), 'manual', ctx()).avisos,
    ).toEqual([]);
    expect(
      revisarVhost(
        g.replace('listen 127.0.0.1:443 ssl;', 'listen 127.0.0.1:443 ssl http2;'),
        'manual',
        ctx(),
      ).avisos,
    ).toEqual([]);
  });

  it.each([
    [
      'un dominio ajeno',
      (g: string) => g.replace('server_name blog.test', 'server_name otro.test'),
      'nginx.dominio_ajeno',
    ],
    [
      'otro puerto',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 127.0.0.1:8081;'),
      'nginx.puerto_ajeno',
    ],
    [
      'default_server',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 127.0.0.1:80 default_server;'),
      'nginx.directiva_prohibida',
    ],
    [
      'algo fuera de server',
      (g: string) => `upstream x { server 10.0.0.1; }\n${g}`,
      'nginx.fuera_de_server',
    ],
    ['sin server', () => 'gzip on;', 'nginx.fuera_de_server'],
    [
      'listen sin dirección (escucharía en toda la red)',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 80;'),
      'nginx.puerto_ajeno',
    ],
    [
      '*:puerto (toda la red)',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen *:80;'),
      'nginx.puerto_ajeno',
    ],
    [
      '0.0.0.0 (toda la red)',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 0.0.0.0:80;'),
      'nginx.puerto_ajeno',
    ],
    [
      'IPv6 [::] (toda la red)',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen [::]:80;'),
      'nginx.puerto_ajeno',
    ],
    [
      'una IP de la red local',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 192.168.1.50:80;'),
      'nginx.puerto_ajeno',
    ],
    [
      'ssl en el puerto HTTP (pasaría el 80 a TLS para todos)',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 127.0.0.1:80 ssl;'),
      'nginx.directiva_prohibida',
    ],
    [
      'http2 en el puerto HTTP',
      (g: string) => g.replace('listen 127.0.0.1:80;', 'listen 127.0.0.1:80 http2;'),
      'nginx.directiva_prohibida',
    ],
    [
      'el puerto HTTPS sin ssl (lo pasaría a texto plano)',
      (g: string) => g.replace('listen 127.0.0.1:443 ssl;', 'listen 127.0.0.1:443;'),
      'nginx.directiva_prohibida',
    ],
  ])('rechaza %s', (_n, cambiar, codigo) => {
    expect(() => revisarVhost(cambiar(generado()), 'manual', ctx())).toThrowError(
      expect.objectContaining({ codigo }),
    );
  });
});

// ---------------------------------------------------------------------------------------------
// GestorSitios: contexto del sitio y reglas guardadas que tumban el nginx -t global
// ---------------------------------------------------------------------------------------------

describe('GestorSitios con reglas o vhost manual guardados', () => {
  const datosSitio = (dominio: string, c: string): Omit<Sitio, 'id'> => ({
    nombre: dominio,
    dominio,
    alias: [],
    carpeta: c,
    tipo: 'estatico',
    php: null,
    puertoProxy: null,
    reglasExtra: '',
    urlBaseVar: null,
    datosReales: false,
    https: false,
    redirigirHttps: false,
    confiado: false,
    git: null,
    procesos: [],
    runtimes: {},
    nota: '',
  });

  it('el contexto lleva los puertos internos y solo los upstreams del propio sitio', async () => {
    const g = new GestorSitios({
      almacen: new Almacen(rutas),
      rutas,
      nginx: { validar: async () => ({ ok: true, salida: '' }), recargar: async () => undefined },
      estadoNginx: () => 'apagado',
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador: { instalado: async () => true, instalados: async () => ['8.4'] },
      eventos: new Eventos<EventosNucleo>(),
      puertosInternos: (_cfg, id) => (id === 'blog' ? [8090, 3306] : []),
    });
    const s = await g.crear({ ...datosSitio('blog.test', carpeta), tipo: 'laravel', php: '8.4' });
    const { contexto } = await g.vhostDe(s, await new Almacen(rutas).leer());
    expect(contexto).toMatchObject({
      puertoHttp: 80,
      puertoHttps: 443,
      puertosInternos: [8090, 3306],
      upstreamsPropios: ['php84', 'phpsitio_blog'],
    });
  });

  it('si el nginx -t global falla por las reglas guardadas de un sitio, se aplican los demás sin ellas', async () => {
    const otra = path.join(base, 'proyectos', 'tienda');
    mkdirSync(otra, { recursive: true });
    const avisos: { sitio: string; modo: string }[] = [];
    const sitesDir = path.dirname(rutas.vhost('x'));
    const algunaRota = (): boolean =>
      readdirSync(sitesDir).some((n) =>
        readFileSync(path.join(sitesDir, n), 'utf8').includes('rota_global'),
      );
    const almacen = new Almacen(rutas);
    const g = new GestorSitios({
      almacen,
      rutas,
      nginx: {
        validar: async () =>
          algunaRota() ? { ok: false, salida: '[emerg] rota_global' } : { ok: true, salida: 'ok' },
        recargar: async () => undefined,
        probarConVhost: async (_id: string, contenido: string) =>
          contenido.includes('rota_global')
            ? { ok: false, salida: '[emerg] rota_global' }
            : { ok: true, salida: 'ok' },
      },
      estadoNginx: () => 'apagado',
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador: { instalado: async () => true, instalados: async () => ['1.30.6'] },
      eventos: new Eventos<EventosNucleo>(),
      avisarVhost: (a) => avisos.push({ sitio: a.sitio, modo: a.modo }),
    });
    await g.crear(datosSitio('blog.test', carpeta));
    await g.crear(datosSitio('tienda.test', otra));
    // Lo guardado pasa la revisión (directiva desconocida) pero Nginx la rechaza.
    await g.modificarConfig((c) => {
      c.sitios[0]!.reglasExtra = 'rota_global on;';
      c.sitios[1]!.reglasExtra = 'gzip on;';
    });
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(true);
    expect(readFileSync(rutas.vhost('blog'), 'utf8')).not.toContain('rota_global');
    expect(readFileSync(rutas.vhost('tienda'), 'utf8')).toContain('gzip on;');
    expect(avisos).toEqual([{ sitio: 'blog', modo: 'reglas' }]);
    // Queda desactivado hasta que el usuario lo edite: el siguiente aplicar no vuelve a probar
    // ni a avisar, y las reglas siguen guardadas.
    const guardado = (await almacen.leer()).sitios[0]!;
    expect(guardado).toMatchObject({ reglasExtra: 'rota_global on;', vhostDesactivado: 'reglas' });
    expect((await g.aplicar()).nginx.ok).toBe(true);
    expect(avisos).toHaveLength(1);
    expect(readFileSync(rutas.vhost('blog'), 'utf8')).not.toContain('rota_global');
  });

  it('si el fallo no es de lo guardado y hubo una recarga buena en la prueba, recarga otra vez lo anterior', async () => {
    const almacen = new Almacen(rutas);
    let recargas = 0;
    let fallar = false;
    const g = new GestorSitios({
      almacen,
      rutas,
      nginx: {
        validar: async () => ({ ok: true, salida: '' }),
        recargar: async () => {
          recargas++;
          // Falla con todo; sin lo del usuario pasa la recarga, pero junto con ello no.
          if (fallar && [1, 3, 4].includes(recargas)) throw new Error('[emerg] fallo');
        },
        probarConVhost: async () => ({ ok: true, salida: 'ok' }),
      },
      estadoNginx: () => 'encendido',
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador: { instalado: async () => true, instalados: async () => ['1.30.6'] },
      eventos: new Eventos<EventosNucleo>(),
    });
    await g.crear(datosSitio('blog.test', carpeta));
    await g.aplicar();
    const antes = readFileSync(rutas.vhost('blog'), 'utf8');
    await g.modificarConfig((c) => {
      c.sitios[0]!.reglasExtra = 'gzip on;';
    });
    recargas = 0;
    fallar = true;
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(false);
    expect(readFileSync(rutas.vhost('blog'), 'utf8')).toBe(antes);
    // 1: con todo (falla), 2: sin lo del usuario (pasa), 3: con lo del usuario (falla),
    // 4: sin nada otra vez (falla) → se restaura y se recarga lo anterior (5).
    expect(recargas).toBe(5);
    expect(r.nginx.salida).toContain('Se recargó Nginx con la configuración anterior');
  });
});

// ---------------------------------------------------------------------------------------------
// EditorVhost con `nginx -t` falso y el GestorSitios real
// ---------------------------------------------------------------------------------------------

describe('EditorVhost', () => {
  let estado: 'apagado' | 'iniciando' | 'encendido' | 'error';
  let pruebaOk: boolean;
  let recargaOk: boolean[];
  /** Respuestas de sano() en orden; vacía = sano. */
  let sano: boolean[];
  let llamadas: string[];
  let probados: string[];
  let avisos: { sitio: string; modo: string }[];
  let gestor: GestorSitios;
  let almacen: Almacen;
  let n: number;

  const crearEditor = (): EditorVhost =>
    new EditorVhost({
      rutas,
      almacen,
      enCola: (fn) => gestor.enCola(fn),
      vhostDe: (s, cfg) => gestor.vhostDe(s, cfg),
      probar: async (_id, contenido) => {
        llamadas.push('probar');
        probados.push(contenido);
        return pruebaOk
          ? { ok: true, salida: 'syntax is ok' }
          : { ok: false, salida: 'nginx: [emerg] unknown directive "gzipp" in blog.conf:9' };
      },
      estadoNginx: () => estado,
      recargar: async () => {
        llamadas.push('recargar');
        if (recargaOk.shift() === false) throw new Error('nginx: [emerg] reload falló');
      },
      sano: async () => {
        llamadas.push('sano');
        return sano.shift() ?? true;
      },
      // Copias con fecha distinta y creciente aunque se apliquen en el mismo milisegundo.
      ahora: () => new Date(Date.UTC(2026, 10, 23, 12, 0, n++)),
    });

  beforeEach(async () => {
    estado = 'encendido';
    pruebaOk = true;
    recargaOk = [];
    sano = [];
    llamadas = [];
    probados = [];
    avisos = [];
    n = 0;
    almacen = new Almacen(rutas);
    gestor = new GestorSitios({
      almacen,
      rutas,
      nginx: {
        validar: async () => ({ ok: true, salida: 'ok' }),
        recargar: async () => undefined,
      },
      estadoNginx: () => 'apagado',
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador: { instalado: async () => true, instalados: async () => ['1.30.6'] },
      eventos: new Eventos<EventosNucleo>(),
      avisarVhost: (a) => avisos.push({ sitio: a.sitio, modo: a.modo }),
    });
    await gestor.crear({
      nombre: 'blog',
      dominio: 'blog.test',
      alias: [],
      carpeta,
      tipo: 'estatico',
      php: null,
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      https: false,
      redirigirHttps: false,
      confiado: false,
      git: null,
      procesos: [],
      runtimes: {},
      nota: '',
    });
    await gestor.aplicar();
  });

  const conf = (): string => readFileSync(rutas.vhost('blog'), 'utf8');
  const sitioGuardado = async (): Promise<Sitio> => (await almacen.leer()).sitios[0]!;

  it('vista: generado de solo lectura, reglas y manual', async () => {
    const v = await crearEditor().vista('blog');
    expect(v.generado).toBe(conf());
    expect(v).toMatchObject({ reglas: '', manual: null });
  });

  it('regla que nginx -t rechaza: el archivo anterior queda, la configuración igual y no se recarga', async () => {
    const antes = conf();
    pruebaOk = false;
    const r = await crearEditor().aplicar('blog', { reglas: 'gzipp on;' });
    expect(r).toEqual({ ok: false, salida: expect.stringContaining('unknown directive') });
    expect(conf()).toBe(antes);
    expect((await sitioGuardado()).reglasExtra).toBe('');
    expect(llamadas).toEqual(['probar']);
    // La prueba fue con el vhost completo que se habría escrito (con la regla dentro del server).
    expect(probados[0]).toContain('    gzipp on;');
    expect(await crearEditor().historial('blog')).toEqual([]);
  });

  it('regla válida: copia con fecha, escritura, recarga y salud', async () => {
    const antes = conf();
    const r = await crearEditor().aplicar('blog', { reglas: 'client_max_body_size 256m;' });
    expect(r).toMatchObject({ ok: true, avisos: [] });
    expect(conf()).toContain('    client_max_body_size 256m;');
    expect((await sitioGuardado()).reglasExtra).toBe('client_max_body_size 256m;');
    expect(llamadas).toEqual(['probar', 'recargar', 'sano']);
    const h = await crearEditor().historial('blog');
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ modo: 'reglas' });
    const copia = JSON.parse(
      readFileSync(path.join(base, 'etc', 'respaldos', 'vhost', 'blog', h[0]!.version), 'utf8'),
    );
    expect(copia).toMatchObject({ reglas: '', manual: null, contenido: antes });
    // Escritura atómica: no quedan temporales junto a los vhosts.
    expect(readdirSync(path.dirname(rutas.vhost('blog')))).toEqual(['blog.conf']);
  });

  it('con Nginx apagado prueba y escribe sin recargar', async () => {
    estado = 'apagado';
    const r = await crearEditor().aplicar('blog', { reglas: 'gzip on;' });
    expect(r.ok).toBe(true);
    expect(llamadas).toEqual(['probar']);
    expect(conf()).toContain('gzip on;');
  });

  it.each([
    ['la recarga falla', () => (recargaOk = [false, true])],
    ['Nginx deja de responder', () => (sano = [false])],
  ])('si %s, vuelve todo atrás solo y lo explica', async (_n, preparar) => {
    const antes = conf();
    preparar();
    const r = await crearEditor().aplicar('blog', { reglas: 'gzip on;' });
    expect(r).toEqual({ ok: false, salida: expect.stringContaining('versión anterior') });
    expect(conf()).toBe(antes);
    expect((await sitioGuardado()).reglasExtra).toBe('');
    expect(llamadas.filter((l) => l === 'recargar')).toHaveLength(2);
    // Tras volver atrás se comprueba otra vez que Nginx responda.
    expect(llamadas.at(-1)).toBe('sano');
  });

  it('si Nginx sigue caído después de volver atrás, lo dice con su propio código', async () => {
    const antes = conf();
    sano = [false, false];
    await expect(crearEditor().aplicar('blog', { reglas: 'gzip on;' })).rejects.toMatchObject({
      codigo: 'nginx.caido_tras_restaurar',
    });
    expect(conf()).toBe(antes);
    expect((await sitioGuardado()).reglasExtra).toBe('');
  });

  it('lo prohibido no llega a nginx -t ni toca nada', async () => {
    const antes = conf();
    await expect(
      crearEditor().aplicar('blog', { reglas: 'location / { root C:/; }' }),
    ).rejects.toMatchObject({ codigo: 'nginx.ruta_fuera' });
    await expect(
      crearEditor().aplicar('blog', {
        reglas: 'gzip on;\n}\nserver { listen 80; server_name otro.test; }\nserver {',
      }),
    ).rejects.toMatchObject({ codigo: 'nginx.sintaxis' });
    await expect(crearEditor().aplicar('blog', { reglas: 'a\u0000;' })).rejects.toMatchObject({
      codigo: 'nginx.texto_invalido',
    });
    await expect(
      crearEditor().aplicar('blog', { reglas: 'x'.repeat(70_000) }),
    ).rejects.toMatchObject({
      codigo: 'nginx.texto_invalido',
    });
    await expect(crearEditor().aplicar('nada', { reglas: '' })).rejects.toMatchObject({
      codigo: 'nginx.sitio_no_existe',
    });
    expect(llamadas).toEqual([]);
    expect(conf()).toBe(antes);
  });

  it('modo avanzado: el manual se escribe tal cual y guardar el sitio no lo regenera', async () => {
    const manual = (await crearEditor().vista('blog')).generado.replace(
      'charset utf-8;',
      'charset utf-8;\n    add_header X-Manual "1";',
    );
    const r = await crearEditor().aplicar('blog', { manual });
    expect(r.ok).toBe(true);
    expect(conf()).toBe(manual);
    expect((await sitioGuardado()).vhostManual).toBe(manual);
    // Guardar el sitio (otro campo) y aplicar: el manual sigue igual.
    await gestor.editar('blog', { nota: 'cambio' });
    await gestor.aplicar();
    expect(conf()).toBe(manual);
    expect((await crearEditor().historial('blog'))[0]).toMatchObject({ modo: 'reglas' });
    // Volver al generado.
    expect((await crearEditor().aplicar('blog', { manual: null })).ok).toBe(true);
    expect(conf()).not.toContain('X-Manual');
    expect((await crearEditor().historial('blog'))[0]).toMatchObject({ modo: 'manual' });
  });

  it('un manual guardado que ya no pasa la revisión se descarta y se avisa (los demás sitios siguen)', async () => {
    const manual = (await crearEditor().vista('blog')).generado;
    expect((await crearEditor().aplicar('blog', { manual })).ok).toBe(true);
    // Cambia el dominio del sitio: el manual tiene un server_name que ya no es suyo.
    await gestor.editar('blog', { dominio: 'nuevo.test' });
    await gestor.aplicar();
    expect(avisos).toEqual([{ sitio: 'blog', modo: 'manual' }]);
    expect(conf()).toContain('server_name nuevo.test;');
  });

  it('historial con tope de 10 y restaurar una versión', async () => {
    const editor = crearEditor();
    for (let i = 1; i <= MAX_VERSIONES_VHOST + 2; i++) {
      expect((await editor.aplicar('blog', { reglas: `# versión ${i}` })).ok).toBe(true);
    }
    const h = await editor.historial('blog');
    expect(h).toHaveLength(MAX_VERSIONES_VHOST);
    expect(readdirSync(path.join(base, 'etc', 'respaldos', 'vhost', 'blog')).length).toBe(
      MAX_VERSIONES_VHOST,
    );
    // La más nueva guarda el estado anterior al último cambio (versión 11).
    expect((await editor.restaurar('blog', h[0]!.version)).ok).toBe(true);
    expect((await sitioGuardado()).reglasExtra).toBe(`# versión ${MAX_VERSIONES_VHOST + 1}`);
    await expect(editor.restaurar('blog', '../../config.json')).rejects.toMatchObject({
      codigo: 'nginx.version_no_existe',
    });
  });

  it('lo desactivado por nginx -t se ve en la vista y vuelve al aplicarlo de nuevo', async () => {
    await gestor.modificarConfig((c) => {
      c.sitios[0]!.reglasExtra = 'gzip on;';
      c.sitios[0]!.vhostDesactivado = 'reglas';
    });
    await gestor.aplicar();
    expect(conf()).not.toContain('gzip on;');
    expect(await crearEditor().vista('blog')).toMatchObject({
      reglas: 'gzip on;',
      desactivado: 'reglas',
    });
    // Aplicar lo mismo cuenta como editarlo: se prueba y se reactiva.
    expect((await crearEditor().aplicar('blog', { reglas: 'gzip on;' })).ok).toBe(true);
    expect(llamadas).toContain('probar');
    expect(conf()).toContain('gzip on;');
    expect((await sitioGuardado()).vhostDesactivado ?? null).toBeNull();
  });

  it('sin cambios no prueba, no recarga ni guarda copia', async () => {
    const r = await crearEditor().aplicar('blog', { reglas: '' });
    expect(r).toMatchObject({ ok: true, respaldo: null });
    expect(llamadas).toEqual([]);
    expect(existsSync(path.join(base, 'etc', 'respaldos', 'vhost', 'blog'))).toBe(false);
  });

  it('avisa (sin impedir) un proxy_pass a otro equipo', async () => {
    const r = await crearEditor().aplicar('blog', {
      reglas: 'location /api/ { proxy_pass https://api.ejemplo.com/; }',
    });
    expect(r).toMatchObject({
      ok: true,
      avisos: [expect.objectContaining({ codigo: 'nginx.aviso_destino_externo' })],
    });
  });
});
