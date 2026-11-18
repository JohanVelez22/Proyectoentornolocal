import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { detectarSitio as detectarProyecto } from '../src/sitios/detectar';

async function carpeta(nombre: string): Promise<string> {
  const base = await carpetaTemporal('pel-det-');
  const dir = join(base, nombre);
  await mkdir(dir, { recursive: true });
  return dir;
}

describe('detectarProyecto', () => {
  it('detecta laravel con la versión de PHP', async () => {
    const d = await carpeta('WolfCore System');
    await writeFile(join(d, 'artisan'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '^8.4.1' } }));
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'laravel',
      php: '8.4',
      sugerenciaDominio: 'wolfcore-system.test',
      urlBaseVar: 'APP_URL',
    });
  });

  it('laravel con ^8.3 da 8.3', async () => {
    const d = await carpeta('api');
    await writeFile(join(d, 'artisan'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '^8.3' } }));
    expect((await detectarProyecto(d)).php).toBe('8.3');
  });

  it('detecta codeigniter3 con APP_BASE_URL en .env', async () => {
    const d = await carpeta('Gestión Ñandú');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    await writeFile(join(d, '.env'), 'APP_BASE_URL=http://x.test/\n');
    const r = await detectarProyecto(d);
    expect(r.tipo).toBe('codeigniter3');
    expect(r.urlBaseVar).toBe('APP_BASE_URL');
    expect(r.sugerenciaDominio).toBe('gestion-nandu.test');
  });

  it('codeigniter3 sin la variable da null', async () => {
    const d = await carpeta('ci');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    expect((await detectarProyecto(d)).urlBaseVar).toBeNull();
  });

  it('codeigniter3 no deriva php de composer.json', async () => {
    const d = await carpeta('ci-composer');
    await mkdir(join(d, 'application'));
    await mkdir(join(d, 'system/core'), { recursive: true });
    await writeFile(join(d, 'system/core/CodeIgniter.php'), '');
    await writeFile(join(d, 'composer.json'), JSON.stringify({ require: { php: '>=5.3.7' } }));
    expect((await detectarProyecto(d)).php).toBeNull();
  });

  it('detecta estático y personalizado', async () => {
    const d = await carpeta('Sitio Web');
    await writeFile(join(d, 'index.html'), '');
    expect(await detectarProyecto(d)).toEqual({
      tipo: 'estatico',
      php: null,
      sugerenciaDominio: 'sitio-web.test',
      urlBaseVar: null,
    });
    const p = await carpeta('legacy');
    await writeFile(join(p, 'index.php'), '');
    expect((await detectarProyecto(p)).tipo).toBe('personalizado');
  });
});
