import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { detectarProyecto, phpPorDefecto, sugerirDominio } from '../src/proyectos/detectar';
import { recetaPorDefecto } from '../src/proyectos/recetas';

async function proyecto(nombre: string, archivos: Record<string, string>): Promise<string> {
  const dir = join(await carpetaTemporal('pel-detqa-'), nombre);
  await mkdir(dir, { recursive: true });
  for (const [rel, contenido] of Object.entries(archivos)) {
    await mkdir(dirname(join(dir, rel)), { recursive: true });
    await writeFile(join(dir, rel), contenido);
  }
  return dir;
}

const FASTAPI_MAIN = 'from fastapi import FastAPI\n\napp = FastAPI(title="Bot")\n';

describe('detección FastAPI en subcarpeta y módulo ASGI (QA 2)', () => {
  it('FastAPI en admin/ con app/main.py: tipo fastapi, módulo app.main:app y cwd admin', async () => {
    const d = await proyecto('Asistente IA Wpp', {
      'README.md': '# bot',
      'admin/requirements.txt': 'fastapi==0.115\nuvicorn\n',
      'admin/app/__init__.py': '',
      'admin/app/main.py': FASTAPI_MAIN,
      'admin/.env.example': 'DATABASE_URL=postgresql+psycopg://u:p@localhost:5432/bot\n',
    });
    const det = await detectarProyecto(d, { pgvector: false });
    expect(det.tipo).toBe('fastapi');
    expect(det.subcarpeta).toBe('admin');
    expect(det.moduloAsgi).toBe('app.main:app');
    expect(det.tieneRequirements).toBe(true);
    expect(det.servicios).toContain('postgresql');
    expect(det.dominioSugerido).toBe('asistente-ia-wpp.test');

    const receta = recetaPorDefecto(det);
    const sitio = receta.find((p) => p.tipo === 'sitio-crear')!.args as {
      procesos: { comando: string[]; cwd: string }[];
    };
    expect(sitio.procesos[0]!.comando).toContain('app.main:app');
    expect(sitio.procesos[0]!.cwd).toBe('admin');
    // Los pasos de Python trabajan en la subcarpeta.
    for (const t of ['python-venv', 'pip-install', 'env-crear']) {
      expect(receta.find((p) => p.tipo === t)!.args?.carpeta).toBe('admin');
    }
  });

  it('elegir directamente admin/ da app.main:app y el dominio del repositorio', async () => {
    const d = await proyecto('Asistente IA Wpp', {
      'admin/requirements.txt': 'fastapi\n',
      'admin/app/main.py': FASTAPI_MAIN,
    });
    const det = await detectarProyecto(join(d, 'admin'), { pgvector: false });
    expect(det.tipo).toBe('fastapi');
    expect(det.subcarpeta).toBeNull();
    expect(det.moduloAsgi).toBe('app.main:app');
    expect(det.dominioSugerido).toBe('asistente-ia-wpp.test');
  });

  it('encuentra main.py, app.py y el nombre de la variable', async () => {
    const a = await proyecto('a', { 'requirements.txt': 'fastapi', 'main.py': FASTAPI_MAIN });
    expect((await detectarProyecto(a, { pgvector: false })).moduloAsgi).toBe('main:app');
    const b = await proyecto('b', {
      'pyproject.toml': 'dependencies = ["fastapi"]',
      'app.py': 'import fastapi\napi: fastapi.FastAPI = fastapi.FastAPI()\n',
    });
    expect((await detectarProyecto(b, { pgvector: false })).moduloAsgi).toBe('app:api');
    const c = await proyecto('c', { 'requirements.txt': 'fastapi' });
    expect((await detectarProyecto(c, { pgvector: false })).moduloAsgi).toBeNull();
  });

  it('sugerirDominio salta carpetas genéricas (admin, api, backend…)', () => {
    expect(sugerirDominio('C:\\Proyectos\\Mi Bot\\admin')).toBe('mi-bot.test');
    expect(sugerirDominio('/p/tienda/backend/')).toBe('tienda.test');
    expect(sugerirDominio('/p/tienda')).toBe('tienda.test');
  });
});

const CI3 = {
  'application/config/config.php': '<?php',
  'system/core/CodeIgniter.php': '<?php',
};

describe('CodeIgniter 3 con PostgreSQL (QA 4)', () => {
  it('lee dbdriver postgre de database.php', async () => {
    const d = await proyecto('dollar', {
      ...CI3,
      'application/config/database.php':
        "<?php\n$db['default'] = array(\n  'hostname' => getenv('DB_HOST'),\n  'dbdriver' => 'postgre',\n);\n",
      '.env': 'DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=wolfcore_dollar\nDB_USER=x\nDB_PASS=y\n',
    });
    const det = await detectarProyecto(d, { pgvector: false });
    expect(det.tipo).toBe('codeigniter3');
    expect(det.servicios[0]).toBe('postgresql');
  });

  it('sin database.php legible, el puerto 5432 o un DB_DRIVER del .env deciden', async () => {
    const a = await proyecto('a', {
      ...CI3,
      '.env': 'DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=x\n',
    });
    expect((await detectarProyecto(a, { pgvector: false })).servicios[0]).toBe('postgresql');
    const b = await proyecto('b', { ...CI3, '.env': 'DB_DRIVER=mysqli\nDB_NAME=x\n' });
    expect((await detectarProyecto(b, { pgvector: false })).servicios[0]).toBe('mysql');
    const c = await proyecto('c', {
      ...CI3,
      'application/config/database.php':
        "<?php $db['default']['dbdriver'] = getenv('DB_DRIVER') ?: 'mysqli';",
    });
    expect((await detectarProyecto(c, { pgvector: false })).servicios[0]).toBe('mysql');
  });

  it('PHP de config.platform.php o .php-version; el mínimo >=5.3.7 no cuenta', async () => {
    const a = await proyecto('a', {
      ...CI3,
      'composer.json': JSON.stringify({
        require: { php: '>=5.3.7' },
        config: { platform: { php: '8.3.0' } },
      }),
    });
    expect((await detectarProyecto(a, { pgvector: false })).php).toBe('8.3');
    const b = await proyecto('b', { ...CI3, '.php-version': '8.2\n' });
    expect((await detectarProyecto(b, { pgvector: false })).php).toBe('8.2');
    const c = await proyecto('c', { ...CI3, 'composer.json': '{"require":{"php":">=5.3.7"}}' });
    expect((await detectarProyecto(c, { pgvector: false })).php).toBeNull();
  });

  it('phpPorDefecto: la 8.x más nueva instalada si no hay pista', () => {
    expect(phpPorDefecto('codeigniter3', null, ['7.4', '8.3', '8.4'])).toBe('8.4');
    expect(phpPorDefecto('codeigniter3', null, ['7.4'])).toBeNull();
    expect(phpPorDefecto('codeigniter3', '8.3', ['8.4'])).toBe('8.3');
    expect(phpPorDefecto('fastapi', null, ['8.4'])).toBeNull();
    expect(phpPorDefecto('laravel', null, ['8.10', '8.4'])).toBe('8.10');
  });
});
