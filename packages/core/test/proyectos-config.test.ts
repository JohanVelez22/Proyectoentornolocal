import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { generarVhost } from '../src/nginx/plantillas';
import {
  ConfigProyectoSchema,
  escribirConfigProyecto,
  leerConfigProyecto,
  motorBdDe,
  type ConfigProyecto,
} from '../src/proyectos/config';
import { detectarProyecto } from '../src/proyectos/detectar';
import { ConfigSchema, raizDeSitio, SitioSchema, type Sitio } from '../src/tipos';

async function proyecto(nombre: string, archivos: Record<string, string>): Promise<string> {
  const base = await carpetaTemporal('pel-proy2-');
  const dir = join(base, nombre);
  await mkdir(dir, { recursive: true });
  for (const [ruta, texto] of Object.entries(archivos)) {
    const destino = join(dir, ruta);
    await mkdir(join(destino, '..'), { recursive: true });
    if (ruta.endsWith('/')) await mkdir(destino, { recursive: true });
    else await writeFile(destino, texto);
  }
  return dir;
}

describe('detectarProyecto (ampliada)', () => {
  it('laravel con servicios del .env.example, scripts npm y node de .nvmrc', async () => {
    const d = await proyecto('Mi Tienda', {
      artisan: '',
      'composer.json': JSON.stringify({ require: { php: '^8.3' } }),
      'package.json': JSON.stringify({
        scripts: { dev: 'vite', build: 'vite build' },
        devDependencies: { vite: '^6' },
      }),
      '.nvmrc': '22\n',
      '.env.example': [
        'APP_URL=http://localhost',
        'DB_CONNECTION=pgsql',
        'CACHE_STORE=redis',
        'REDIS_HOST=127.0.0.1',
        'MAIL_MAILER=smtp',
        'MAIL_HOST=127.0.0.1',
      ].join('\n'),
    });
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'laravel',
      php: '8.3',
      node: '22',
      python: null,
      servicios: ['postgresql', 'redis', 'mailpit'],
      pgvector: false,
      tieneComposer: true,
      tienePackageJson: true,
      scriptsNpm: ['dev', 'build'],
      tieneRequirements: false,
      tienePyproject: false,
      dominioSugerido: 'mi-tienda.test',
      urlBaseVar: 'APP_URL',
    });
  });

  it('laravel 11 por defecto (sqlite, caché en base, correo a log) no pide servicios', async () => {
    const d = await proyecto('l11', {
      artisan: '',
      '.env.example': [
        'DB_CONNECTION=sqlite',
        'SESSION_DRIVER=database',
        'CACHE_STORE=database',
        'QUEUE_CONNECTION=database',
        'REDIS_HOST=127.0.0.1',
        'MAIL_MAILER=log',
        'MAIL_HOST=127.0.0.1',
      ].join('\n'),
    });
    expect((await detectarProyecto(d)).servicios).toEqual([]);
  });

  it('codeigniter 4 (spark + app/Config) con su driver de base', async () => {
    const d = await proyecto('ci4', {
      spark: '',
      'app/Config/App.php': '<?php',
      'composer.json': JSON.stringify({ require: { php: '^8.1' } }),
      env: '# database.default.DBDriver = MySQLi\n',
      '.env': 'database.default.DBDriver = MySQLi\n',
    });
    const r = await detectarProyecto(d);
    expect(r.tipo).toBe('codeigniter4');
    expect(r.php).toBe('8.1');
    expect(r.servicios).toEqual(['mysql']);
    expect(r.tieneComposer).toBe(true);
  });

  it('codeigniter 3 sigue detectándose', async () => {
    const d = await proyecto('ci3', {
      'application/': '',
      'system/core/CodeIgniter.php': '',
      '.env': 'APP_BASE_URL=http://x.test/\n',
    });
    const r = await detectarProyecto(d);
    expect(r.tipo).toBe('codeigniter3');
    expect(r.urlBaseVar).toBe('APP_BASE_URL');
  });

  it('wordpress por wp-config-sample.php o por wp-includes/', async () => {
    const a = await proyecto('blog', { 'wp-config-sample.php': '<?php', 'index.php': '' });
    expect((await detectarProyecto(a)).tipo).toBe('wordpress');
    const b = await proyecto('blog2', { 'wp-includes/version.php': '<?php', 'index.php': '' });
    expect((await detectarProyecto(b)).tipo).toBe('wordpress');
  });

  it('fastapi por requirements.txt, con python y pgvector', async () => {
    const d = await proyecto('API Rápida', {
      'requirements.txt': 'fastapi==0.115\nuvicorn[standard]\npgvector\npsycopg[binary]\n',
      '.python-version': '3.12\n',
      '.env.example': 'DATABASE_URL=postgresql+psycopg://u:p@localhost/db\n',
      'app/main.py': 'from fastapi import FastAPI\napp = FastAPI()\n',
    });
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'fastapi',
      php: null,
      node: null,
      python: '3.12',
      servicios: ['postgresql'],
      pgvector: true,
      tieneComposer: false,
      tienePackageJson: false,
      scriptsNpm: [],
      tieneRequirements: true,
      tienePyproject: false,
      dominioSugerido: 'api-rapida.test',
      urlBaseVar: null,
    });
  });

  it('fastapi por pyproject con requires-python', async () => {
    const d = await proyecto('svc', {
      'pyproject.toml':
        '[project]\nname = "svc"\nrequires-python = ">=3.12"\ndependencies = ["FastAPI>=0.110"]\n',
    });
    const r = await detectarProyecto(d);
    expect(r.tipo).toBe('fastapi');
    expect(r.python).toBe('>=3.12');
    expect(r.tienePyproject).toBe(true);
    expect(r.pgvector).toBe(false);
    expect(r.servicios).toEqual([]);
  });

  it('python sin fastapi no es fastapi', async () => {
    const d = await proyecto('script', { 'requirements.txt': 'requests\n' });
    expect((await detectarProyecto(d)).tipo).toBe('estatico');
  });

  it('node: vite/next/nuxt sin PHP, con engines.node', async () => {
    for (const dep of ['vite', 'next', 'nuxt']) {
      const d = await proyecto(`front-${dep}`, {
        'package.json': JSON.stringify({
          engines: { node: '>=20' },
          scripts: { dev: dep },
          dependencies: { [dep]: '1' },
        }),
      });
      const r = await detectarProyecto(d);
      expect(r.tipo).toBe('node');
      expect(r.node).toBe('>=20');
      expect(r.scriptsNpm).toEqual(['dev']);
    }
    const conPhp = await proyecto('mixto', {
      'package.json': JSON.stringify({ devDependencies: { vite: '1' } }),
      'index.php': '',
    });
    expect((await detectarProyecto(conPhp)).tipo).toBe('personalizado');
  });

  it('pgvector en una migración SQL o de Laravel, sin mirar vendor ni node_modules', async () => {
    const sql = await proyecto('sql', {
      artisan: '',
      'database/esquema.sql': 'create extension if not exists vector;\n',
    });
    expect((await detectarProyecto(sql)).pgvector).toBe(true);
    const lv = await proyecto('lv', {
      artisan: '',
      '.env.example': 'DB_CONNECTION=mysql\n',
      'database/migrations/x.php': "$table->vector('embedding', 1536);",
    });
    const r = await detectarProyecto(lv);
    expect(r.pgvector).toBe(true);
    expect(r.servicios).toEqual(['mysql']); // no se cambia el motor elegido por el proyecto
    const ignorado = await proyecto('ign', {
      artisan: '',
      'vendor/x/pgvector.php': 'pgvector',
      'node_modules/y/index.js': 'pgvector',
      '.git/HEAD': 'pgvector',
    });
    expect((await detectarProyecto(ignorado)).pgvector).toBe(false);
  });

  it('pgvector solo, sin base declarada, sugiere postgresql', async () => {
    const d = await proyecto('pg', {
      'requirements.txt': 'fastapi\n',
      'db.py': 'from pgvector.psycopg import register_vector\n',
    });
    const r = await detectarProyecto(d);
    expect(r.pgvector).toBe(true);
    expect(r.servicios).toEqual(['postgresql']);
  });

  it('pgvector: no mira compilados (dist, build, .next, public/build…) ni más allá de 6 niveles', async () => {
    const d = await proyecto('compilado', {
      'requirements.txt': 'fastapi\n',
      'dist/app.js': 'const e = "vector(1536)";',
      'build/x.sql': 'embedding vector(1536)',
      '.next/server/a.js': 'pgvector',
      '.nuxt/b.js': 'pgvector',
      'coverage/c.json': '"pgvector"',
      'public/build/assets/d.js': 'pgvector',
      'a/b/c/d/e/f/g/profundo.sql': 'CREATE EXTENSION vector;',
    });
    expect((await detectarProyecto(d)).pgvector).toBe(false);
    const seis = await proyecto('seis', {
      'requirements.txt': 'fastapi\n',
      'a/b/c/d/e/f/ok.sql': 'CREATE EXTENSION vector;',
    });
    expect((await detectarProyecto(seis)).pgvector).toBe(true);
    const publico = await proyecto('publico', {
      'requirements.txt': 'fastapi\n',
      'public/js/x.js': 'import pgvector from "pgvector"',
    });
    expect((await detectarProyecto(publico)).pgvector).toBe(true);
  });

  it('archivos grandes (> 1 MB) no se leen', async () => {
    const d = await proyecto('grande', {
      'requirements.txt': 'fastapi\n',
      'datos.sql': 'x'.repeat(1024 * 1024 + 10) + '\nCREATE EXTENSION vector;\n',
    });
    expect((await detectarProyecto(d)).pgvector).toBe(false);
  });

  it('estático y personalizado', async () => {
    expect((await detectarProyecto(await proyecto('web', { 'index.html': '' }))).tipo).toBe(
      'estatico',
    );
    expect((await detectarProyecto(await proyecto('php', { 'index.php': '' }))).tipo).toBe(
      'personalizado',
    );
  });
});

describe('wolfcore.yml', () => {
  const completa: ConfigProyecto = ConfigProyectoSchema.parse({
    version: 1,
    tipo: 'laravel',
    dominio: 'tienda.test',
    php: '8.10',
    node: '22',
    python: null,
    servicios: ['mysql', 'redis'],
    env: { MAIL_FROM_ADDRESS: 'hola@tienda.test', APP_NAME: 'Mi Tienda: "ñ"' },
    receta: [
      { id: 'composer', tipo: 'composer-install', titulo: 'Instalar dependencias de PHP' },
      {
        id: 'restaurar',
        tipo: 'bd-restaurar',
        titulo: 'Restaurar respaldo',
        opcional: true,
        args: { archivo: 'C:\\Respaldos\\tienda.sql' },
      },
    ],
    procesos: [
      {
        id: 'vite',
        nombre: 'Vite',
        comando: ['npm', 'run', 'dev'],
        autoIniciar: true,
        reiniciar: true,
        puerto: 5173,
      },
    ],
  });

  it('sin archivo devuelve null', async () => {
    expect(await leerConfigProyecto(await proyecto('vacio', {}))).toBeNull();
  });

  it('ida y vuelta, con cabecera en español y versiones como texto', async () => {
    const d = await proyecto('ida', {});
    await escribirConfigProyecto(d, completa);
    const texto = await readFile(join(d, 'wolfcore.yml'), 'utf8');
    expect(texto.startsWith('# ')).toBe(true);
    expect(texto).toContain('Confío en este repositorio');
    expect(texto).toMatch(/^php: "8\.10"$/m);
    expect(await leerConfigProyecto(d)).toEqual(completa);
    expect(completa.procesos[0]!.cwd).toBe('raiz');
  });

  it('acepta versiones escritas como números sin perder ceros', async () => {
    const d = await proyecto('num', {
      'wolfcore.yml': 'version: 1\nphp: 8.10\nnode: 22\npython: 3.12\nenv:\n  PUERTO: 8000\n',
    });
    const c = await leerConfigProyecto(d);
    expect(c).toMatchObject({ php: '8.10', node: '22', python: '3.12', env: { PUERTO: '8000' } });
    expect(c!.receta).toEqual([]);
    expect(c!.tipo).toBeNull();
  });

  it('archivo vacío da los valores por defecto', async () => {
    const d = await proyecto('v', { 'wolfcore.yml': '# solo un comentario\n' });
    expect(await leerConfigProyecto(d)).toEqual(ConfigProyectoSchema.parse({}));
  });

  it('conserva claves desconocidas y comentarios al reescribir', async () => {
    const d = await proyecto('extra', {
      'wolfcore.yml':
        '# Mi comentario\nversion: 1\nphp: "8.3"\nequipo:\n  dueño: Ana # nota\nnode: "20"\n',
    });
    const c = await leerConfigProyecto(d);
    expect(c).not.toHaveProperty('equipo');
    await escribirConfigProyecto(d, { ...c!, php: '8.4' });
    const texto = await readFile(join(d, 'wolfcore.yml'), 'utf8');
    expect(texto).toContain('# Mi comentario');
    expect(texto).toContain('dueño: Ana # nota');
    expect(texto).toMatch(/^php: "8\.4"$/m);
    expect((await leerConfigProyecto(d))!.php).toBe('8.4');
  });

  it('errores claros en español', async () => {
    const roto = await proyecto('roto', { 'wolfcore.yml': 'php: [8.3\n' });
    await expect(leerConfigProyecto(roto)).rejects.toThrow(/wolfcore\.yml no es válido/);
    const paso = await proyecto('paso', {
      'wolfcore.yml': 'receta:\n  - id: x\n    tipo: borrar-todo\n    titulo: X\n',
    });
    await expect(leerConfigProyecto(paso)).rejects.toThrow(/wolfcore\.yml no es válido.*receta/);
    const version = await proyecto('ver', { 'wolfcore.yml': 'version: 2\n' });
    await expect(leerConfigProyecto(version)).rejects.toThrow(/wolfcore\.yml no es válido/);
    const lista = await proyecto('lista', { 'wolfcore.yml': '- a\n- b\n' });
    await expect(leerConfigProyecto(lista)).rejects.toThrow(/wolfcore\.yml no es válido/);
    const dup = await proyecto('dup', {
      'wolfcore.yml':
        'receta:\n  - {id: a, tipo: migrar, titulo: A}\n  - {id: a, tipo: npm-ci, titulo: B}\n',
    });
    await expect(leerConfigProyecto(dup)).rejects.toThrow(/repetido/);
  });

  it('no reemplaza un wolfcore.yml existente que no se puede leer', async () => {
    const original = 'php: [8.3\n# a mano\n';
    const d = await proyecto('roto2', { 'wolfcore.yml': original });
    await expect(escribirConfigProyecto(d, completa)).rejects.toThrow(/wolfcore\.yml no es válido/);
    expect(await readFile(join(d, 'wolfcore.yml'), 'utf8')).toBe(original);
    const lista = await proyecto('lista2', { 'wolfcore.yml': '- a\n' });
    await expect(escribirConfigProyecto(lista, completa)).rejects.toThrow(/mapa de claves/);
    expect(await readFile(join(lista, 'wolfcore.yml'), 'utf8')).toBe('- a\n');
  });

  it('archivo de más de 1 MB: error en español, al leer y al escribir', async () => {
    const d = await proyecto('enorme', {
      'wolfcore.yml': `php: "8.3"\n# ${'x'.repeat(1024 * 1024)}\n`,
    });
    await expect(leerConfigProyecto(d)).rejects.toThrow(
      'wolfcore.yml no es válido: el archivo pesa más de 1 MB',
    );
    await expect(escribirConfigProyecto(d, completa)).rejects.toThrow(/pesa más de 1 MB/);
  });

  it('conserva CRLF al reescribir y LF si el original era LF', async () => {
    const d = await proyecto('crlf', { 'wolfcore.yml': '# mío\r\nversion: 1\r\nphp: "8.3"\r\n' });
    await escribirConfigProyecto(d, { ...(await leerConfigProyecto(d))!, php: '8.4' });
    const texto = await readFile(join(d, 'wolfcore.yml'), 'utf8');
    expect(texto).toContain('# mío\r\nversion: 1\r\n');
    expect(texto.replace(/\r\n/g, '')).not.toContain('\n');
    expect((await leerConfigProyecto(d))!.php).toBe('8.4');
    const lf = await proyecto('lf', { 'wolfcore.yml': 'php: "8.3"\n' });
    await escribirConfigProyecto(lf, completa);
    expect(await readFile(join(lf, 'wolfcore.yml'), 'utf8')).not.toContain('\r');
  });

  it('acepta BOM al inicio', async () => {
    const d = await proyecto('bom', { 'wolfcore.yml': '﻿version: 1\nphp: "8.2"\n' });
    expect((await leerConfigProyecto(d))!.php).toBe('8.2');
  });

  it('etiqueta desconocida (!!js/function): error, no se ejecuta nada', async () => {
    const d = await proyecto('tag', {
      'wolfcore.yml': 'php: !!js/function "function () { globalThis.__pwn = 1; }"\n',
    });
    await expect(leerConfigProyecto(d)).rejects.toThrow(/wolfcore\.yml no es válido/);
    expect((globalThis as { __pwn?: number }).__pwn).toBeUndefined();
  });

  it('exceso de alias (bomba de alias): error', async () => {
    let texto = 'a0: &a0 [x, x, x, x, x, x, x, x, x, x]\n';
    for (let i = 1; i < 8; i++) {
      texto += `a${i}: &a${i} [${Array(10)
        .fill(`*a${i - 1}`)
        .join(', ')}]\n`;
    }
    const d = await proyecto('alias', { 'wolfcore.yml': texto });
    await expect(leerConfigProyecto(d)).rejects.toThrow(/wolfcore\.yml no es válido.*alias/i);
  });

  it('motorBdDe: el primer motor de base de datos', () => {
    expect(motorBdDe(['redis', 'postgresql', 'mysql'])).toBe('postgresql');
    expect(motorBdDe(['redis', 'mailpit'])).toBeNull();
  });
});

describe('modelo de Sitio y retrocompatibilidad', () => {
  it('un config.json viejo carga con los valores por defecto nuevos', () => {
    const viejo = {
      version: 1,
      sitios: [
        {
          id: 'tienda',
          nombre: 'Tienda',
          dominio: 'tienda.test',
          carpeta: 'C:\\Proyectos\\tienda',
          tipo: 'laravel',
          php: '8.4',
        },
      ],
    };
    const s = ConfigSchema.parse(viejo).sitios[0]!;
    expect(s).toMatchObject({
      confiado: false,
      git: null,
      procesos: [],
      runtimes: {},
      alias: [],
      https: false,
    });
  });

  it('acepta los tipos y campos nuevos', () => {
    const s = SitioSchema.parse({
      id: 'api',
      nombre: 'API',
      dominio: 'api.test',
      carpeta: 'C:\\P\\api',
      tipo: 'fastapi',
      confiado: true,
      git: { remoto: 'https://github.com/a/b.git', rama: 'main' },
      runtimes: { python: '3.12' },
      procesos: [
        { id: 'uvicorn', nombre: 'Uvicorn', comando: ['uvicorn', 'app:app'], puerto: 8001 },
      ],
    });
    expect(s.procesos[0]).toEqual({
      id: 'uvicorn',
      nombre: 'Uvicorn',
      comando: ['uvicorn', 'app:app'],
      cwd: 'raiz',
      autoIniciar: false,
      reiniciar: false,
      puerto: 8001,
    });
  });

  it('CI4 sirve desde public/ como Laravel', () => {
    const s = SitioSchema.parse({
      id: 'c',
      nombre: 'C',
      dominio: 'c.test',
      carpeta: 'C:/P/c/',
      tipo: 'codeigniter4',
    });
    expect(raizDeSitio(s)).toBe('C:/P/c/public');
    expect(raizDeSitio({ ...s, tipo: 'wordpress' })).toBe('C:/P/c/');
  });
});

describe('plantillas nuevas', () => {
  const sitio = (o: Partial<Sitio>): Sitio =>
    SitioSchema.parse({
      id: 'a',
      nombre: 'A',
      dominio: 'a.test',
      carpeta: 'C:\\Proyectos\\a',
      tipo: 'estatico',
      ...o,
    });
  const o = { puertoNginx: 80, rutasLogs: { acceso: 'C:\\L\\a.log', error: 'C:\\L\\e.log' } };

  it('codeigniter4: texto exacto', () => {
    expect(generarVhost(sitio({ tipo: 'codeigniter4', php: '8.3' }), o)).toBe(
      [
        'server {',
        '    listen 80;',
        '    server_name a.test;',
        '    charset utf-8;',
        '    root "C:/Proyectos/a/public";',
        '    access_log "C:/L/a.log";',
        '    error_log "C:/L/e.log";',
        '    index index.php index.html;',
        '    location / { try_files $uri $uri/ /index.php$is_args$query_string; }',
        '    location = /index.php {',
        '        fastcgi_pass php83;',
        '        include fastcgi_params;',
        '        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
        '    }',
        '    location ~* /\\.(?!well-known) { deny all; }',
        '    location ~* \\.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }',
        '    location ~* \\.php$ { return 404; }',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('wordpress: texto exacto', () => {
    expect(generarVhost(sitio({ tipo: 'wordpress', php: '8.2' }), o)).toBe(
      [
        'server {',
        '    listen 80;',
        '    server_name a.test;',
        '    charset utf-8;',
        '    root "C:/Proyectos/a";',
        '    access_log "C:/L/a.log";',
        '    error_log "C:/L/e.log";',
        '    index index.php index.html;',
        '    location = /wp-config.php { deny all; }',
        '    location = /xmlrpc.php { deny all; }',
        '    location ~* /\\.(?!well-known) { deny all; }',
        '    location ~* ^/wp-content/uploads/.*\\.(php\\d?|phtml|phar|phps)$ { deny all; }',
        '    location ~* \\.(sql|log|ini|sh|bak|old|dist|dump|backup)$ { deny all; }',
        '    location / { try_files $uri $uri/ /index.php?$args; }',
        '    location ~* \\.php$ {',
        '        try_files $uri =404;',
        '        fastcgi_pass php82;',
        '        include fastcgi_params;',
        '        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
        '    }',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('CI4 y WordPress exigen PHP', () => {
    for (const tipo of ['codeigniter4', 'wordpress'] as const) {
      expect(() => generarVhost(sitio({ tipo }), o)).toThrow(
        'El sitio a.test necesita una versión de PHP',
      );
    }
  });

  it('fastapi y node: proxy al puerto del sitio o al de su proceso', () => {
    const conPuerto = generarVhost(sitio({ tipo: 'fastapi', puertoProxy: 8001 }), o);
    expect(conPuerto).toContain('proxy_pass http://127.0.0.1:8001;');
    expect(conPuerto).toBe(generarVhost(sitio({ tipo: 'proxy', puertoProxy: 8001 }), o));
    const conProceso = generarVhost(
      sitio({
        tipo: 'node',
        procesos: [
          {
            id: 'cola',
            nombre: 'Cola',
            comando: ['x'],
            cwd: 'raiz',
            autoIniciar: false,
            reiniciar: false,
            puerto: null,
          },
          {
            id: 'vite',
            nombre: 'Vite',
            comando: ['npm', 'run', 'dev'],
            cwd: 'raiz',
            autoIniciar: true,
            reiniciar: false,
            puerto: 5173,
          },
        ],
      }),
      o,
    );
    expect(conProceso).toContain('proxy_pass http://127.0.0.1:5173;');
    expect(() => generarVhost(sitio({ tipo: 'node' }), o)).toThrow(
      'El sitio a.test necesita un puerto de proxy o un proceso con puerto',
    );
  });
});
