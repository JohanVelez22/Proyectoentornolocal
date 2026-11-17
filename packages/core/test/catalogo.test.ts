import { describe, expect, it } from 'vitest';
import { listarVersiones, catalogo, CatalogoSchema } from '../src/catalogo/catalogo';

const releases = {
  '7.4': {
    version: '7.4.33',
    'nts-vc15-x64': { zip: { path: 'php-7.4.33-nts-Win32-vc15-x64.zip', sha256: 'aa' } },
  },
  '8.1': {
    version: '8.1.34',
    'ts-vs16-x64': { zip: { path: 'php-8.1.34-Win32-vs16-x64.zip', sha256: 'b0' } },
    'nts-vs16-x64': { zip: { path: 'php-8.1.34-nts-Win32-vs16-x64.zip', sha256: 'b1' } },
  },
  '8.3': {
    version: '8.3.36-1',
    'nts-vs16-x64': { zip: { path: 'php-8.3.36-1-nts-Win32-vs16-x64.zip', sha256: 'c3' } },
    'nts-vs17-x64': { zip: { path: 'php-8.3.36-1-nts-Win32-vs17-x64.zip', sha256: 'c4' } },
  },
  '8.4': {
    version: '8.4.27-1',
    'nts-vs17-x64': { zip: { path: 'php-8.4.27-1-nts-Win32-vs17-x64.zip', sha256: 'd4' } },
  },
};

const fetchFalso = ((url: string) => {
  expect(url).toBe('https://windows.php.net/downloads/releases/releases.json');
  return Promise.resolve(new Response(JSON.stringify(releases)));
}) as unknown as typeof fetch;

describe('catálogo', () => {
  it('nginx y cloudflared salen del catálogo validado', async () => {
    const n = await listarVersiones('nginx');
    expect(n[0]).toMatchObject({ servicio: 'nginx', formato: 'zip' });
    expect(n[0]?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(n[0]?.subcarpeta).toBe(`nginx-${n[0]?.version}`);
    const c = await listarVersiones('cloudflared');
    expect(c[0]).toMatchObject({ servicio: 'cloudflared', formato: 'exe' });
    expect(catalogo.cloudflared[0]?.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('php: 8.1+, prefiere vs17 y expone rama', async () => {
    const v = await listarVersiones('php', fetchFalso);
    expect(v.map((x) => x.rama)).toEqual(['8.4', '8.3', '8.1']);
    expect(v[0]).toEqual({
      servicio: 'php',
      version: '8.4.27-1',
      rama: '8.4',
      url: 'https://windows.php.net/downloads/releases/php-8.4.27-1-nts-Win32-vs17-x64.zip',
      sha256: 'd4',
      formato: 'zip',
    });
    expect(v[1]?.sha256).toBe('c4');
    expect(v[2]?.sha256).toBe('b1');
  });

  it('errores de red con mensaje en español', async () => {
    const f = (() => Promise.reject(new Error('sin red'))) as unknown as typeof fetch;
    await expect(listarVersiones('php', f)).rejects.toThrow(
      'No se pudo consultar las versiones de php: sin red',
    );
    const f2 = (() =>
      Promise.resolve(new Response('x', { status: 500 }))) as unknown as typeof fetch;
    await expect(listarVersiones('php', f2)).rejects.toThrow(
      /No se pudo consultar las versiones de php/,
    );
  });

  it('rechaza URLs http o de hosts no oficiales', () => {
    const e = { ...catalogo.nginx[0] };
    const prueba = (url: string) =>
      CatalogoSchema.safeParse({ nginx: [{ ...e, url }], cloudflared: [] }).success;
    expect(prueba('https://nginx.org/download/nginx-1.30.6.zip')).toBe(true);
    expect(prueba('http://nginx.org/download/nginx-1.30.6.zip')).toBe(false);
    expect(prueba('https://evil.example.com/nginx.zip')).toBe(false);
    expect(prueba('https://nginx.org.evil.com/nginx.zip')).toBe(false);
  });
});
