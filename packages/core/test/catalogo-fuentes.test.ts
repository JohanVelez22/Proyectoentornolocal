import { describe, expect, it } from 'vitest';
import { fuenteComposer } from '../src/catalogo/fuentes/composer';
import { fuenteGithub, fuenteMailpit, fuenteRedis } from '../src/catalogo/fuentes/github';
import { fuenteNode } from '../src/catalogo/fuentes/node';
import { fuentePhp } from '../src/catalogo/fuentes/php';
import { fuentePython } from '../src/catalogo/fuentes/python';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { HOSTS_INDICE, HOSTS_PERMITIDOS, urlIndice, urlOficial } from '../src/catalogo/catalogo';
import { normalizarHuella, huellaFuerte } from '../src/catalogo/huellas';
import { leerAcotado } from '../src/catalogo/red';
import { fetchFalso, fixture, HOY, rutasOficiales, type Ruta } from './catalogo-falso';

const ctx = (
  rutas: Record<string, Ruta> = rutasOficiales(),
): ContextoFuente & {
  pedidas: string[];
} => {
  const ff = fetchFalso(rutas);
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};

describe('hosts y huellas', () => {
  it('listas explícitas: índices y descargas, sin comodines', () => {
    expect([...HOSTS_INDICE].sort()).toEqual(
      [
        'api.github.com',
        'api.nuget.org',
        'downloads.php.net',
        'getcomposer.org',
        'nodejs.org',
        'windows.php.net',
      ].sort(),
    );
    expect(HOSTS_PERMITIDOS).toContain('release-assets.githubusercontent.com');
    expect(HOSTS_PERMITIDOS).toContain('objects.githubusercontent.com');
    for (const h of [...HOSTS_INDICE, ...HOSTS_PERMITIDOS]) expect(h).not.toMatch(/[*?]/);
    expect(urlIndice('https://api.github.com/repos/a/b/releases')).toBe(true);
    expect(urlIndice('https://github.com/a/b')).toBe(false);
    expect(urlIndice('http://nodejs.org/dist/index.json')).toBe(false);
    expect(urlIndice('https://evil.api.github.com/x')).toBe(false);
    expect(urlOficial('https://x.githubusercontent.com/a')).toBe(false);
    expect(urlOficial('https://usuario:clave@github.com/a')).toBe(false);
    expect(urlOficial('https://github.com:8443/a')).toBe(false);
  });

  it('normalizarHuella: hex en minúsculas y SHA-512 en base64 (NuGet)', () => {
    expect(normalizarHuella('sha256', 'AB'.repeat(32))).toEqual({
      algoritmo: 'sha256',
      valor: 'ab'.repeat(32),
    });
    const b64 = Buffer.alloc(64, 7).toString('base64');
    expect(normalizarHuella('sha512', b64)).toEqual({
      algoritmo: 'sha512',
      valor: '07'.repeat(64),
    });
    expect(normalizarHuella('sha256', 'a'.repeat(63))).toBeNull();
    expect(normalizarHuella('sha512', Buffer.alloc(32).toString('base64'))).toBeNull();
    expect(huellaFuerte({ algoritmo: 'sha512', valor: '0'.repeat(128) })).toBe(true);
    expect(huellaFuerte({ algoritmo: 'md5', valor: '0'.repeat(32) })).toBe(false);
    expect(huellaFuerte(null)).toBe(false);
  });

  it('leerAcotado corta una respuesta grande (anunciada o no)', async () => {
    await expect(
      leerAcotado(new Response('x'.repeat(2000), { headers: { 'content-length': '2000' } }), 1000),
    ).rejects.toMatchObject({ codigo: 'catalogo.respuesta_grande' });
    const flujo = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < 10; i++) c.enqueue(new Uint8Array(200));
        c.close();
      },
    });
    await expect(leerAcotado(new Response(flujo), 1000)).rejects.toMatchObject({
      codigo: 'catalogo.respuesta_grande',
    });
    expect(await leerAcotado(new Response('hola'), 1000)).toBe('hola');
  });
});

describe('fuentes oficiales', () => {
  it('PHP: releases.json tras la redirección a downloads.php.net, 8.1+ NTS x64 con SHA-256', async () => {
    const c = ctx();
    const v = await fuentePhp.listar(c);
    // 8.6 solo trae VS18 y 7.4 es vieja: quedan fuera, como siempre.
    expect(v.map((x) => x.rama)).toEqual(['8.5', '8.4', '8.1']);
    const p84 = v.find((x) => x.rama === '8.4')!;
    expect(p84).toMatchObject({
      servicio: 'php',
      version: '8.4.28',
      url: 'https://windows.php.net/downloads/releases/php-8.4.28-nts-Win32-vs17-x64.zip',
      huella: { algoritmo: 'sha256' },
      formato: 'zip',
      soporte: 'actual',
      finSoporte: '2028-12-31',
      origen: 'vivo',
    });
    expect(p84.sha256).toBe(p84.huella?.valor);
    expect(v.find((x) => x.rama === '8.1')?.soporte).toBe('fin');
    expect(c.pedidas).toEqual([
      'https://windows.php.net/downloads/releases/releases.json',
      'https://downloads.php.net/~windows/releases/releases.json',
    ]);
  });

  it('un índice que redirige fuera de HOSTS_INDICE se corta antes de pedir el destino', async () => {
    const c = ctx({
      'https://windows.php.net/downloads/releases/releases.json': {
        ir: 'https://evil.example/releases.json',
      },
    });
    await expect(fuentePhp.listar(c)).rejects.toMatchObject({
      codigo: 'catalogo.redireccion_ajena',
    });
    expect(c.pedidas.some((u) => u.includes('evil.example'))).toBe(false);
  });

  it('Node: ramas, LTS, preview, fin y SHASUMS256 solo de la última de cada rama con soporte', async () => {
    const c = ctx();
    const v = await fuenteNode.listar(c);
    const de = (version: string) => v.find((x) => x.version === version)!;
    expect(de('24.22.3')).toMatchObject({
      rama: '24',
      soporte: 'lts',
      finSoporte: '2028-04-30',
      url: 'https://nodejs.org/dist/v24.22.3/node-v24.22.3-win-x64.zip',
      subcarpeta: 'node-v24.22.3-win-x64',
      ejecutable: 'node.exe',
      huella: { algoritmo: 'sha256' },
    });
    const linea = fixture('node-shasums-24.22.3.txt')
      .split('\n')
      .find((l) => l.endsWith('node-v24.22.3-win-x64.zip'))!;
    expect(de('24.22.3').huella?.valor).toBe(linea.split(/\s+/)[0]);
    expect(de('24.22.2')).toMatchObject({ huella: null, sha256: null, huellaDiferida: true });
    expect(de('25.9.0').soporte).toBe('fin');
    expect(de('20.20.2').soporte).toBe('fin');
    expect(de('27.0.0-alpha.0.1.1').soporte).toBe('preview');
    // Pidió las sumas de 26, 24 y 22 (no de 20, que terminó, ni de las viejas de cada rama).
    expect(c.pedidas.filter((u) => u.endsWith('SHASUMS256.txt')).sort()).toEqual([
      'https://nodejs.org/dist/v22.23.5/SHASUMS256.txt',
      'https://nodejs.org/dist/v24.22.3/SHASUMS256.txt',
      'https://nodejs.org/dist/v26.13.1/SHASUMS256.txt',
    ]);
    // La diferida se completa al instalar.
    expect(await fuenteNode.completar!(de('20.20.2'), c)).toMatchObject({ algoritmo: 'sha256' });
  });

  it('Python (NuGet): SHA-512 en base64 de la hoja del catálogo, pasado a hex', async () => {
    const c = ctx();
    const v = await fuentePython.listar(c);
    const de = (version: string) => v.find((x) => x.version === version)!;
    const hoja = JSON.parse(fixture('nuget-catalogo-3.13.1.json')) as { packageHash: string };
    expect(de('3.13.1')).toMatchObject({
      rama: '3.13',
      url: 'https://api.nuget.org/v3-flatcontainer/python/3.13.1/python.3.13.1.nupkg',
      subcarpeta: 'tools',
      ejecutable: 'python.exe',
      sha256: null,
      soporte: 'actual',
      finSoporte: '2029-10-31',
      huella: {
        algoritmo: 'sha512',
        valor: Buffer.from(hoja.packageHash, 'base64').toString('hex'),
      },
    });
    expect(de('3.13.1').huella?.valor).toMatch(/^[0-9a-f]{128}$/);
    expect(de('3.13.0').huellaDiferida).toBe(true);
    expect(de('3.9.13').soporte).toBe('fin');
    expect(de('3.15.0-a1').soporte).toBe('preview');
    expect(de('3.14.0-rc3').soporte).toBe('preview');
    expect(de('3.14.10').huella?.algoritmo).toBe('sha512');
  });

  it('Composer: estable, 2.2 LTS y 1.x terminada, cada una con su .sha256sum', async () => {
    const v = await fuenteComposer.listar(ctx());
    expect(v.map((x) => [x.version, x.rama, x.soporte])).toEqual([
      ['2.11.2', '2.11', 'actual'],
      ['2.2.32', '2.2', 'lts'],
      ['1.10.28', '1.10', 'fin'],
    ]);
    expect(v[0]).toMatchObject({
      url: 'https://getcomposer.org/download/2.11.2/composer.phar',
      formato: 'archivo',
      ejecutable: 'composer.phar',
      huella: {
        algoritmo: 'sha256',
        valor: 'dd158c0afd41d15fac89e1b4e47b5d42911fe316c3687cd5edac98319b25d028',
      },
    });
  });

  it('GitHub: huella del campo digest y asset del repositorio esperado', async () => {
    const m = await fuenteMailpit.listar(ctx());
    expect(m[0]).toMatchObject({
      servicio: 'mailpit',
      version: '1.34.0',
      rama: '1.34',
      url: 'https://github.com/axllent/mailpit/releases/download/v1.34.0/mailpit-windows-amd64.zip',
      huella: {
        algoritmo: 'sha256',
        valor: '8f080d41374bf22686606374a0a483c8563c1bf29ae078179792392ff8c911d7',
      },
      soporte: 'actual',
      ejecutable: 'mailpit.exe',
    });
    expect(m[1]?.soporte).toBe('fin');
    const r = await fuenteRedis.listar(ctx());
    expect(r[0]).toMatchObject({
      version: '8.10.3',
      subcarpeta: 'Redis-8.10.3-Windows-x64-msys2',
      sha256: 'af16df340525b431e9ec8dabfd625d5e7a233f82805b5418819904ea909c447f',
    });
  });

  it('GitHub: un asset de otro repositorio descarta el índice entero', async () => {
    const releases = JSON.parse(fixture('github-mailpit.json')) as {
      assets: { browser_download_url: string }[];
    }[];
    releases[1]!.assets[0]!.browser_download_url =
      'https://github.com/otro/mailpit/releases/download/v1.33.1/mailpit-windows-amd64.zip';
    const c = ctx({
      'https://api.github.com/repos/axllent/mailpit/releases?per_page=30': JSON.stringify(releases),
    });
    await expect(fuenteMailpit.listar(c)).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('GitHub: un asset que sale del repositorio con .. o %2e descarta el índice', async () => {
    const urls = [
      'https://github.com/axllent/mailpit/releases/download/../../../otro/mailpit/releases/download/v1/a.zip',
      'https://github.com/axllent/mailpit/releases/download/%2e%2e/%2E%2E/%2e%2e/otro/a.zip',
      'https://github.com/axllent/mailpit/releases/download/v1.33.1/..%2fa.zip',
      'http://github.com/axllent/mailpit/releases/download/v1.33.1/mailpit-windows-amd64.zip',
      'https://github.com.evil.example/axllent/mailpit/releases/download/v1/a.zip',
      'https://github.com:444/axllent/mailpit/releases/download/v1/a.zip',
    ];
    for (const url of urls) {
      const releases = JSON.parse(fixture('github-mailpit.json')) as {
        assets: { browser_download_url: string }[];
      }[];
      releases[1]!.assets[0]!.browser_download_url = url;
      const c = ctx({
        'https://api.github.com/repos/axllent/mailpit/releases?per_page=30':
          JSON.stringify(releases),
      });
      await expect(fuenteMailpit.listar(c), url).rejects.toBeInstanceOf(IndiceMalformado);
    }
  });

  it('GitHub sin digest: usa el archivo de sumas de la release (redirección a release-assets)', async () => {
    const hex = 'c'.repeat(64);
    const fuente = fuenteGithub({
      servicio: 'cloudflared',
      dueno: 'cloudflare',
      repo: 'cloudflared',
      asset: () => 'cloudflared-windows-amd64.exe',
      formato: 'exe',
      ejecutable: 'cloudflared.exe',
    });
    const base = 'https://github.com/cloudflare/cloudflared/releases/download/2026.11.2/';
    const c = ctx({
      'https://api.github.com/repos/cloudflare/cloudflared/releases?per_page=30': JSON.stringify([
        {
          tag_name: '2026.11.2',
          draft: false,
          prerelease: false,
          assets: [
            { name: 'cloudflared-windows-amd64.exe', browser_download_url: `${base}x.exe` },
            { name: 'checksums.txt', browser_download_url: `${base}checksums.txt` },
          ],
        },
      ]),
      [`${base}checksums.txt`]: { ir: 'https://release-assets.githubusercontent.com/sumas' },
      'https://release-assets.githubusercontent.com/sumas': `${hex}  cloudflared-windows-amd64.exe\n${'d'.repeat(64)}  otro.msi\n`,
    });
    const v = await fuente.listar(c);
    expect(v[0]?.huella).toEqual({ algoritmo: 'sha256', valor: hex });
  });

  it('GitHub sin digest: si el archivo de sumas publicado no responde, el índice falla (no "sin huella")', async () => {
    const fuente = fuenteGithub({
      servicio: 'cloudflared',
      dueno: 'cloudflare',
      repo: 'cloudflared',
      asset: () => 'cloudflared-windows-amd64.exe',
      formato: 'exe',
      ejecutable: 'cloudflared.exe',
    });
    const base = 'https://github.com/cloudflare/cloudflared/releases/download/2026.11.2/';
    const c = ctx({
      'https://api.github.com/repos/cloudflare/cloudflared/releases?per_page=30': JSON.stringify([
        {
          tag_name: '2026.11.2',
          draft: false,
          prerelease: false,
          assets: [
            { name: 'cloudflared-windows-amd64.exe', browser_download_url: `${base}x.exe` },
            { name: 'checksums.txt', browser_download_url: `${base}checksums.txt` },
          ],
        },
      ]),
      [`${base}checksums.txt`]: { estado: 503 },
    });
    await expect(fuente.listar(c)).rejects.toThrow();
  });

  it('otro sistema (Etapa E): sin versiones en vivo y sin consultas', async () => {
    const ff = fetchFalso(rutasOficiales());
    for (const f of [fuentePhp, fuenteNode, fuentePython, fuenteMailpit]) {
      expect(await f.listar({ f: ff.f, idCatalogo: 'linux-x64', ahora: HOY })).toEqual([]);
    }
    expect(ff.pedidas).toEqual([]);
  });
});
