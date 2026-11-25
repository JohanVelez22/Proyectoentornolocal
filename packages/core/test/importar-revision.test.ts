import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Respaldos } from '../src/bd/respaldos';
import {
  decodificarTextoAjeno,
  esRutaProtegida,
  leerConfigAjena,
  validarCarpetaAjena,
  contexto,
} from '../src/importar/comun';
import { detectarImportables } from '../src/importar/detectar';
import { Rutas } from '../src/rutas';
import { copiarFixture } from './importar-ayuda';
import { carpetaTemporal } from './temporales';

async function conVhost(
  nombre: string,
  documentRoot: (raiz: string) => string,
  archivos: Record<string, string>,
): Promise<{ raiz: string; l: Awaited<ReturnType<typeof detectarImportables>> }> {
  const raiz = await copiarFixture('laragon');
  for (const [rel, txt] of Object.entries(archivos)) {
    await mkdir(path.dirname(path.join(raiz, rel)), { recursive: true });
    await writeFile(path.join(raiz, rel), txt);
  }
  await writeFile(
    path.join(raiz, 'etc', 'apache2', 'sites-enabled', `auto.${nombre}.test.conf`),
    `<VirtualHost *:80>\n  ServerName ${nombre}.test\n  DocumentRoot "${documentRoot(raiz).replace(/\\/g, '/')}"\n</VirtualHost>\n`,
  );
  return { raiz, l: await detectarImportables(raiz, 'laragon') };
}

describe('DocumentRoot: solo se sube a la carpeta padre si WolfCore Dev vuelve a añadir public', () => {
  it('Laravel (public) sube a la raíz del proyecto', async () => {
    const { raiz, l } = await conVhost('lara', (r) => path.join(r, 'www', 'lara', 'public'), {
      'www/lara/artisan': '#!php\n',
      'www/lara/public/index.php': '<?php\n',
    });
    expect(l.find((c) => c.dominio === 'lara.test')!.carpeta).toBe(
      await (await import('node:fs/promises')).realpath(path.join(raiz, 'www', 'lara')),
    );
  });

  it('Symfony conserva su DocumentRoot (public), porque el sitio no lo añade solo', async () => {
    const { raiz, l } = await conVhost('sf', (r) => path.join(r, 'www', 'sf', 'public'), {
      'www/sf/composer.json': '{"require":{"symfony/framework-bundle":"^7"}}\n',
      'www/sf/bin/console': '#!php\n',
      'www/sf/symfony.lock': '{}\n',
      'www/sf/public/index.php': '<?php\n',
    });
    const c = l.find((x) => x.dominio === 'sf.test')!;
    expect(path.basename(c.carpeta)).toBe('public');
    expect(path.basename(path.dirname(c.carpeta))).toBe('sf');
    expect(raiz).toBeTruthy();
  });

  it('Drupal (web) y un proyecto con composer.json conservan su DocumentRoot', async () => {
    const { l } = await conVhost('dru', (r) => path.join(r, 'www', 'dru', 'web'), {
      'www/dru/composer.json': '{"require":{"drupal/core-recommended":"^10"}}\n',
      'www/dru/web/index.php': '<?php\n',
      'www/dru/web/core/lib.php': '<?php\n',
    });
    const c = l.find((x) => x.dominio === 'dru.test')!;
    expect(path.basename(c.carpeta)).toBe('web');
  });
});

describe('carpetas protegidas del perfil y del sistema', () => {
  it('ocultas del perfil, el perfil de macOS y Linux y las carpetas del sistema', () => {
    for (const p of [
      'C:/Users/ana/.ssh',
      'C:\\Users\\ana\\.aws\\credentials',
      'C:/Users/ana/.config/x',
      '/Users/ana',
      '/Users/ana/.gnupg',
      '/home/ana',
      '/home/ana/.kube',
      '/System/Library',
      '/Library/Preferences',
      '/private/etc',
      '/var/log',
      '/Applications/X.app',
    ]) {
      expect(esRutaProtegida(p), p).toBe(true);
    }
    for (const p of ['C:/Users/ana/Herd/x', '/Users/ana/Sites/x', '/home/ana/proyectos/x']) {
      expect(esRutaProtegida(p), p).toBe(false);
    }
  });
});

describe('XAMPP: SRVROOT es <instalación>/apache', () => {
  it('un DocumentRoot con ${SRVROOT} sale de la carpeta apache', async () => {
    const raiz = await copiarFixture('xampp');
    const archivo = path.join(raiz, 'apache', 'conf', 'extra', 'httpd-vhosts.conf');
    await writeFile(
      archivo,
      `${await readFile(archivo, 'utf8')}\n<VirtualHost *:80>\n  ServerName viaserver.local\n  DocumentRoot "\${SRVROOT}/../htdocs/otro"\n</VirtualHost>\n`,
    );
    const l = await detectarImportables(raiz, 'xampp');
    const c = l.find((x) => x.dominio === 'viaserver.local');
    expect(c?.nombre).toBe('otro');
  });
});

describe('UTF-16 BE de largo impar', () => {
  it('da un error controlado, no una excepción del sistema', async () => {
    expect(decodificarTextoAjeno(Buffer.from([0xfe, 0xff, 0x00, 0x41, 0x00]))).toBeNull();
    expect(
      decodificarTextoAjeno(Buffer.from([0x00, 0x41, 0x00, 0x42, 0x00, 0x43, 0x00])),
    ).toBeNull();
    const d = await carpetaTemporal('pel-imp-');
    await writeFile(path.join(d, 'x.conf'), Buffer.from([0xfe, 0xff, 0x00, 0x41, 0x00]));
    await expect(leerConfigAjena(path.join(d, 'x.conf'), d)).rejects.toMatchObject({
      codigo: 'importar.archivo_ilegible',
    });
  });
});

describe('rutas locales', () => {
  it('una ruta UNC o de dispositivo se rechaza sin tocar el disco', async () => {
    const d = await carpetaTemporal('pel-imp-');
    const ctx = contexto(d, 'xampp');
    for (const mala of ['//servidor/recurso/x', '\\\\servidor\\recurso\\x', '\\\\?\\UNC\\s\\x']) {
      expect(await validarCarpetaAjena(ctx, mala, 'x.conf')).toBeNull();
    }
    expect(ctx.problemas.every((p) => p.codigo === 'importar.ruta_fuera')).toBe(true);
    expect(ctx.problemas).toHaveLength(3);
  });
});

describe('temporales de una importación interrumpida', () => {
  it('se borran al arrancar y solo los de importar-ajeno', async () => {
    const dir = await carpetaTemporal('pel-resp-');
    const rutas = new Rutas(path.join(dir, 'base'));
    await mkdir(path.join(rutas.tmp(), 'importar-ajeno-aaa'), { recursive: true });
    await mkdir(path.join(rutas.tmp(), 'otra-cosa'), { recursive: true });
    const r = new Respaldos({
      bd: {} as never,
      servicios: { estados: async () => [] },
      rutas,
      exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
      plataforma: { carpetaDocumentos: async () => dir },
    });
    expect(await r.limpiarTemporalesAjenos()).toBe(1);
    expect(await readdir(rutas.tmp())).toEqual(['otra-cosa']);
  });
});
