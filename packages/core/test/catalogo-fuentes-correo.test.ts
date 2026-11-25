import { describe, expect, it } from 'vitest';
import { catalogo } from '../src/catalogo/catalogo';
import {
  fuenteGithub,
  fuenteInbucket,
  fuentePapercut,
  fuenteSmtp4dev,
} from '../src/catalogo/fuentes/github';
import { IndiceMalformado, type ContextoFuente } from '../src/catalogo/fuentes/tipos';
import { huellaFuerte } from '../src/catalogo/huellas';
import { FUENTES_VERSIONES } from '../src/catalogo/vivo';
import { CAPTADORES_DESCARTADOS } from '../src/servicios/correo/captadores';
import { fetchFalso, fixture, HOY, type Ruta } from './catalogo-falso';

const URL_SMTP4DEV = 'https://api.github.com/repos/rnwood/smtp4dev/releases/latest';
const URL_INBUCKET = 'https://api.github.com/repos/inbucket/inbucket/releases?per_page=10';
const URL_PAPERCUT =
  'https://api.github.com/repos/ChangemakerStudios/Papercut-SMTP/releases?per_page=10';

const ctx = (rutas: Record<string, Ruta>): ContextoFuente & { pedidas: string[] } => {
  const ff = fetchFalso(rutas);
  return { f: ff.f, idCatalogo: 'win-x64', ahora: HOY, pedidas: ff.pedidas };
};
const rutas = (): Record<string, Ruta> => ({
  [URL_SMTP4DEV]: fixture('github-smtp4dev-latest.json'),
  [URL_INBUCKET]: fixture('github-inbucket.json'),
  [URL_PAPERCUT]: fixture('github-papercut.json'),
});

describe('fuentes de los captadores de correo (D21)', () => {
  it('smtp4dev: lee solo la última estable y trae huella SHA-256 del digest', async () => {
    const c = ctx(rutas());
    const v = await fuenteSmtp4dev.listar(c);
    expect(c.pedidas).toEqual([URL_SMTP4DEV]);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      servicio: 'smtp4dev',
      version: '3.16.1',
      url: 'https://github.com/rnwood/smtp4dev/releases/download/3.16.1/Rnwood.Smtp4dev-win-x64-3.16.1.zip',
      huella: {
        algoritmo: 'sha256',
        valor: '0c69374d909ab7b61312f8c4edce4da46474d6dd4f25e289fe1d61643e62a3a1',
      },
      ejecutable: 'Rnwood.Smtp4dev.exe',
      soporte: 'actual',
    });
    expect(huellaFuerte(v[0]!.huella ?? null)).toBe(true);
  });

  it('smtp4dev: si "latest" fuera una prerelease, el índice se descarta', async () => {
    const r = JSON.parse(fixture('github-smtp4dev-latest.json')) as Record<string, unknown>;
    r.prerelease = true;
    const c = ctx({ [URL_SMTP4DEV]: JSON.stringify(r) });
    await expect(fuenteSmtp4dev.listar(c)).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('Inbucket: zip de Windows con su subcarpeta y huella del digest', async () => {
    const v = await fuenteInbucket.listar(ctx(rutas()));
    expect(v[0]).toMatchObject({
      servicio: 'inbucket',
      version: '3.2.0',
      url: 'https://github.com/inbucket/inbucket/releases/download/v3.2.0/inbucket_3.2.0_windows_amd64.zip',
      subcarpeta: 'inbucket_3.2.0_windows_amd64',
      ejecutable: 'inbucket.exe',
      huella: {
        algoritmo: 'sha256',
        valor: 'ad307e52863e9281098d4340adcb8dc677c114fbe9a3351b5cdce348792c31b3',
      },
    });
  });

  it('Papercut: el zip del servicio (no el instalador) con huella del digest', async () => {
    const v = await fuentePapercut.listar(ctx(rutas()));
    expect(v[0]).toMatchObject({
      servicio: 'papercut',
      version: '8.1.0',
      url: 'https://github.com/ChangemakerStudios/Papercut-SMTP/releases/download/8.1.0/Papercut.Smtp.Service.8.1.0-win-x64.zip',
      ejecutable: 'Papercut.Service.exe',
      huella: {
        algoritmo: 'sha256',
        valor: 'a0735593b52ac9886991bb8f3f4b1a0eafae5ca65681808ae0fcabe76e9cb29f',
      },
    });
    for (const f of v) expect(f.url).not.toMatch(/Setup\.exe$/);
  });

  it('un asset de otro repositorio descarta el índice entero', async () => {
    const r = JSON.parse(fixture('github-inbucket.json')) as {
      assets: { browser_download_url: string }[];
    }[];
    r[0]!.assets[0]!.browser_download_url =
      'https://github.com/otro/inbucket/releases/download/v3.2.0/inbucket_3.2.0_windows_amd64.zip';
    const c = ctx({ [URL_INBUCKET]: JSON.stringify(r) });
    await expect(fuenteInbucket.listar(c)).rejects.toBeInstanceOf(IndiceMalformado);
  });

  it('MailHog sin digest ni sumas: la fuente lo dejaría sin huella, por eso no entra', async () => {
    // Con el índice real de MailHog (digest nulo y sin archivo de sumas) una fuente genérica
    // ofrecería la versión "sin huella": el catálogo la rechaza al instalar sin confirmación
    // explícita, y D21 exige huella fuerte, así que el captador queda fuera.
    const fuente = fuenteGithub({
      servicio: 'mailpit',
      dueno: 'mailhog',
      repo: 'MailHog',
      asset: () => 'MailHog_windows_amd64.exe',
      formato: 'exe',
      ejecutable: 'MailHog.exe',
    });
    const c = ctx({
      'https://api.github.com/repos/mailhog/MailHog/releases?per_page=10':
        fixture('github-mailhog.json'),
    });
    const v = await fuente.listar(c);
    expect(v[0]!.huella ?? null).toBeNull();
    expect(CAPTADORES_DESCARTADOS.map((d) => d.id)).toContain('mailhog');
  });

  it('las fuentes están registradas y la lista fija trae huella fuerte', () => {
    for (const id of ['smtp4dev', 'inbucket', 'papercut'] as const) {
      expect(FUENTES_VERSIONES[id]?.servicio).toBe(id);
      expect(FUENTES_VERSIONES[id]?.hostsIndice).toEqual(['api.github.com']);
      for (const e of catalogo[id]) expect(e.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
