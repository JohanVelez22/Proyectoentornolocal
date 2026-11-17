import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TipoSitio } from '../tipos';

export interface ProyectoDetectado {
  tipo: TipoSitio;
  php: string | null;
  sugerenciaDominio: string;
  urlBaseVar: string | null;
}

async function existe(ruta: string): Promise<boolean> {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

async function leerTexto(ruta: string): Promise<string | null> {
  try {
    return await readFile(ruta, 'utf8');
  } catch {
    return null;
  }
}

function sugerirDominio(carpeta: string): string {
  const nombre =
    carpeta
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? '';
  const limpio = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${limpio || 'sitio'}.test`;
}

async function versionPhp(carpeta: string): Promise<string | null> {
  const texto = await leerTexto(join(carpeta, 'composer.json'));
  if (!texto) return null;
  try {
    const req = (JSON.parse(texto) as { require?: { php?: unknown } }).require?.php;
    const m = typeof req === 'string' ? /(\d+)\.(\d+)/.exec(req) : null;
    return m ? `${m[1]}.${m[2]}` : null;
  } catch {
    return null;
  }
}

export async function detectarProyecto(carpeta: string): Promise<ProyectoDetectado> {
  const sugerenciaDominio = sugerirDominio(carpeta);
  if (await existe(join(carpeta, 'artisan'))) {
    return {
      tipo: 'laravel',
      php: await versionPhp(carpeta),
      sugerenciaDominio,
      urlBaseVar: 'APP_URL',
    };
  }
  if (
    (await existe(join(carpeta, 'application'))) &&
    (await existe(join(carpeta, 'system', 'core', 'CodeIgniter.php')))
  ) {
    const env = await leerTexto(join(carpeta, '.env'));
    const tiene = env !== null && /^\s*APP_BASE_URL\s*=/m.test(env);
    return {
      tipo: 'codeigniter3',
      php: await versionPhp(carpeta),
      sugerenciaDominio,
      urlBaseVar: tiene ? 'APP_BASE_URL' : null,
    };
  }
  const tipo: TipoSitio = (await existe(join(carpeta, 'index.php'))) ? 'personalizado' : 'estatico';
  return { tipo, php: null, sugerenciaDominio, urlBaseVar: null };
}
