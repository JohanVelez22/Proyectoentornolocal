import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { generarCA } from '../src/https/ca';
import {
  ConfianzaCa,
  conBloqueFirefox,
  firefoxConfiaEnRaices,
  PREF_FIREFOX,
} from '../src/https/confianza';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

/** PEM con LF y sin espacios a los lados (forge escribe CRLF). */
const n = (t: string): string => t.replace(/\r\n/g, '\n').trim();
/** Bloques PEM de un texto. */
const bloques = (t: string): string[] =>
  t.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];

let base: string;
let rutas: Rutas;
let plat: PlataformaFalsa;
let raizAjena: string;
let ca: string;

const crearCa = async (): Promise<string> => {
  const par = generarCA();
  await mkdir(path.dirname(rutas.caCrt()), { recursive: true });
  await writeFile(rutas.caCrt(), par.certPem, 'utf8');
  await writeFile(rutas.caKey(), par.keyPem, 'utf8');
  return par.certPem;
};

const confianza = (entorno: Record<string, string | undefined> = {}): ConfianzaCa =>
  new ConfianzaCa({
    rutas,
    plataforma: plat,
    carpetaRespaldos: path.join(base, 'etc', 'respaldos'),
    entorno,
  });

/** Proyecto con .venv y (si `certifi`) el cacert.pem de certifi en el diseño de Windows. */
const proyecto = async (o: { venv?: boolean; certifi?: string } = {}): Promise<string> => {
  const dir = path.join(base, 'proyecto');
  await mkdir(dir, { recursive: true });
  if (o.venv) {
    await mkdir(path.join(dir, '.venv'), { recursive: true });
    await writeFile(path.join(dir, '.venv', 'pyvenv.cfg'), 'home = x\n');
  }
  if (o.certifi !== undefined) {
    const c = path.join(dir, '.venv', 'Lib', 'site-packages', 'certifi');
    await mkdir(c, { recursive: true });
    await writeFile(path.join(c, 'cacert.pem'), o.certifi);
  }
  return dir;
};

beforeEach(async () => {
  base = await carpetaTemporal('pel-confianza-');
  rutas = new Rutas(base);
  plat = new PlataformaFalsa({ carpetaDatos: base, carpetaInicio: base });
  raizAjena = generarCA().certPem;
  plat.raices = raizAjena;
});

describe('ConfianzaCa: bundle de Python', () => {
  it('certifi del venv + la CA, nunca solo la CA', async () => {
    ca = await crearCa();
    const certifi = generarCA().certPem;
    const dir = await proyecto({ venv: true, certifi });
    const archivo = await confianza().bundlePython(path.join(dir, '.venv'));
    const texto = await readFile(archivo, 'utf8');
    const b = bloques(texto);
    expect(b).toHaveLength(2);
    expect(texto).toContain(n(certifi));
    expect(texto).toContain(n(ca));
    expect(plat.raicesLeidas).toBe(0);
    expect(path.dirname(archivo)).toBe(path.join(base, 'etc', 'ca'));
  });

  it('sin certifi usa las raíces exportadas por la plataforma (y las reusa mientras la CA no cambie)', async () => {
    ca = await crearCa();
    const c = confianza();
    const archivo = await c.bundlePython(null);
    expect(path.basename(archivo)).toBe('python-bundle.pem');
    const texto = await readFile(archivo, 'utf8');
    expect(texto).toContain(n(raizAjena));
    expect(texto).toContain(n(ca));
    await c.bundlePython(null);
    expect(plat.raicesLeidas).toBe(1);
    // Cambia la CA: se regenera.
    const nueva = await crearCa();
    await c.bundlePython(null);
    expect(plat.raicesLeidas).toBe(2);
    expect(await readFile(archivo, 'utf8')).toContain(n(nueva));
    expect(await readFile(archivo, 'utf8')).not.toContain(n(ca));
  });

  it('sin raíces (ni certifi ni del sistema) falla: nunca un bundle con solo la CA', async () => {
    ca = await crearCa();
    plat.raices = '';
    await expect(confianza().bundlePython(null)).rejects.toMatchObject({
      codigo: 'confianza.sin_raices',
    });
    // Un certifi que solo trae nuestra CA tampoco cuenta como raíces.
    const dir = await proyecto({ venv: true, certifi: ca });
    await expect(confianza().bundlePython(path.join(dir, '.venv'))).rejects.toMatchObject({
      codigo: 'confianza.sin_raices',
    });
  });

  it('se regenera si cambia la CA (certifi)', async () => {
    ca = await crearCa();
    const dir = await proyecto({ venv: true, certifi: generarCA().certPem });
    const c = confianza();
    const a = await c.bundlePython(path.join(dir, '.venv'));
    const nueva = await crearCa();
    const b = await c.bundlePython(path.join(dir, '.venv'));
    expect(b).toBe(a);
    expect(await readFile(b, 'utf8')).toContain(n(nueva));
  });
});

describe('ConfianzaCa: entorno de los procesos de proyecto', () => {
  it('sin CA no agrega nada', async () => {
    const dir = await proyecto({ venv: true });
    expect(await confianza().envProyecto({ carpeta: dir })).toEqual({});
  });

  it('NODE_EXTRA_CA_CERTS siempre; con venv, REQUESTS_CA_BUNDLE y SSL_CERT_FILE al bundle', async () => {
    ca = await crearCa();
    const sinVenv = await confianza().envProyecto({ carpeta: await proyecto() });
    expect(sinVenv).toEqual({ NODE_EXTRA_CA_CERTS: rutas.caCrt() });
    const dir = await proyecto({ venv: true, certifi: generarCA().certPem });
    const env = await confianza().envProyecto({ carpeta: dir });
    expect(env.NODE_EXTRA_CA_CERTS).toBe(rutas.caCrt());
    expect(env.REQUESTS_CA_BUNDLE).toBeTruthy();
    expect(env.SSL_CERT_FILE).toBe(env.REQUESTS_CA_BUNDLE);
    expect(bloques(await readFile(env.REQUESTS_CA_BUNDLE!, 'utf8'))).toHaveLength(2);
  });

  it('el venv puede estar en la carpeta de trabajo del proceso', async () => {
    ca = await crearCa();
    const dir = await proyecto();
    const admin = path.join(dir, 'admin');
    await mkdir(path.join(admin, '.venv'), { recursive: true });
    await writeFile(path.join(admin, '.venv', 'pyvenv.cfg'), 'home = x\n');
    const env = await confianza().envProyecto({ carpeta: dir }, { carpetaVenv: admin });
    expect(env.SSL_CERT_FILE).toBeTruthy();
  });

  it('no pisa variables que el usuario ya fijó (otra CA corporativa)', async () => {
    ca = await crearCa();
    const dir = await proyecto({ venv: true, certifi: generarCA().certPem });
    const env = await confianza({
      NODE_EXTRA_CA_CERTS: 'C:\\corp\\ca.pem',
      SSL_CERT_FILE: 'C:\\corp\\bundle.pem',
    }).envProyecto({ carpeta: dir });
    expect(env.NODE_EXTRA_CA_CERTS).toBeUndefined();
    expect(env.SSL_CERT_FILE).toBeUndefined();
    expect(env.REQUESTS_CA_BUNDLE).toBeTruthy();
  });

  it('si el bundle no se puede armar, igual da Node (sin variables de Python)', async () => {
    ca = await crearCa();
    plat.raices = '';
    const dir = await proyecto({ venv: true });
    expect(await confianza().envProyecto({ carpeta: dir })).toEqual({
      NODE_EXTRA_CA_CERTS: rutas.caCrt(),
    });
  });
});

describe('ConfianzaCa: Node como variable del usuario', () => {
  it('activar fija NODE_EXTRA_CA_CERTS; desactivar la quita y lo recuerda entre instancias', async () => {
    ca = await crearCa();
    expect((await confianza().nodeGlobal(true)).node.global).toBe(true);
    expect(plat.variables.get('NODE_EXTRA_CA_CERTS')).toBe(rutas.caCrt());
    expect((await confianza().estado()).node.global).toBe(true);
    expect((await confianza().nodeGlobal(false)).node.global).toBe(false);
    expect(plat.variables.has('NODE_EXTRA_CA_CERTS')).toBe(false);
  });

  it('sin CA, o con una variable ajena ya fijada, no toca nada', async () => {
    await expect(confianza().nodeGlobal(true)).rejects.toMatchObject({
      codigo: 'confianza.sin_ca',
    });
    ca = await crearCa();
    await expect(
      confianza({ NODE_EXTRA_CA_CERTS: 'C:\\corp\\ca.pem' }).nodeGlobal(true),
    ).rejects.toMatchObject({ codigo: 'confianza.node_variable_ajena' });
    expect(plat.variables.size).toBe(0);
  });

  it('desactivar sin haberla fijado nosotros no borra la del usuario', async () => {
    plat.variables.set('NODE_EXTRA_CA_CERTS', 'C:\\corp\\ca.pem');
    await confianza().nodeGlobal(false);
    expect(plat.variables.get('NODE_EXTRA_CA_CERTS')).toBe('C:\\corp\\ca.pem');
  });
});

describe('Firefox: user.js', () => {
  const AJENO = [
    '// mis preferencias',
    'user_pref("browser.startup.homepage", "https://ejemplo.org");',
    'user_pref("privacy.resistFingerprinting", true);',
    '',
  ].join('\r\n');

  it('ida y vuelta: agrega el bloque marcado y lo quita conservando las preferencias ajenas', () => {
    const con = conBloqueFirefox(AJENO, true);
    expect(con).toContain(PREF_FIREFOX);
    expect(con.startsWith(AJENO.trimEnd())).toBe(true);
    expect(firefoxConfiaEnRaices(con)).toBe(true);
    expect(conBloqueFirefox(con, true)).toBe(con);
    expect(conBloqueFirefox(con, false)).toBe(AJENO);
    expect(firefoxConfiaEnRaices(AJENO)).toBe(false);
    // Respeta el fin de línea del archivo.
    expect(con.includes('\n') && !/[^\r]\n/.test(con)).toBe(true);
  });

  it('la preferencia puesta por el usuario cuenta (la última gana)', () => {
    expect(firefoxConfiaEnRaices('user_pref("security.enterprise_roots.enabled", true);\n')).toBe(
      true,
    );
    expect(
      firefoxConfiaEnRaices(
        'user_pref("security.enterprise_roots.enabled", true);\nuser_pref("security.enterprise_roots.enabled", false);\n',
      ),
    ).toBe(false);
  });

  const perfiles = async (): Promise<string[]> => {
    const a = path.join(base, 'firefox', 'a.default');
    const b = path.join(base, 'firefox', 'b.trabajo');
    await mkdir(a, { recursive: true });
    await mkdir(b, { recursive: true });
    await writeFile(path.join(a, 'user.js'), AJENO);
    await writeFile(path.join(a, 'prefs.js'), 'user_pref("x", 1);\n');
    plat.firefox = [a, b];
    return [a, b];
  };

  it('activar: copia previa del user.js, bloque en cada perfil y prefs.js intacto', async () => {
    const [a, b] = await perfiles();
    const r = await confianza().firefoxActivar(true);
    expect(r).toEqual([
      { perfil: 'a.default', ok: true },
      { perfil: 'b.trabajo', ok: true },
    ]);
    expect(await readFile(path.join(a!, 'user.js'), 'utf8')).toContain(PREF_FIREFOX);
    expect(await readFile(path.join(b!, 'user.js'), 'utf8')).toContain(PREF_FIREFOX);
    expect(await readFile(path.join(a!, 'prefs.js'), 'utf8')).toBe('user_pref("x", 1);\n');
    const copias = await readdir(path.join(base, 'etc', 'respaldos'));
    const copia = copias.find((n) => n.startsWith('firefox-user-js-a.default-'));
    expect(copia).toBeTruthy();
    expect(await readFile(path.join(base, 'etc', 'respaldos', copia!), 'utf8')).toBe(AJENO);
    expect((await confianza().firefox()).every((p) => p.activo)).toBe(true);
    // Desactivar devuelve el user.js ajeno tal cual; el que solo tenía nuestro bloque se va.
    await confianza().firefoxActivar(false);
    expect(await readFile(path.join(a!, 'user.js'), 'utf8')).toBe(AJENO);
    expect((await readdir(b!)).includes('user.js')).toBe(false);
  });

  it('Firefox abierto: ese perfil se salta con firefox.abierto y no se toca', async () => {
    const [a, b] = await perfiles();
    plat.firefoxAbiertos.add(a!);
    const r = await confianza().firefoxActivar(true);
    expect(r).toEqual([
      { perfil: 'a.default', ok: false, codigo: 'firefox.abierto' },
      { perfil: 'b.trabajo', ok: true },
    ]);
    expect(await readFile(path.join(a!, 'user.js'), 'utf8')).toBe(AJENO);
    const lista = await confianza().firefox();
    expect(lista).toEqual([
      { perfil: 'a.default', activo: false, abierto: true },
      { perfil: 'b.trabajo', activo: true, abierto: false },
    ]);
    void b;
  });

  it('estado: CA, Node, Python y perfiles (solo el nombre de la carpeta, nunca la ruta)', async () => {
    await perfiles();
    ca = await crearCa();
    const e = await confianza().estado();
    expect(e).toMatchObject({
      caCreada: true,
      node: { proyectos: true, global: false, ajena: false },
      python: { proyectos: true },
    });
    expect(JSON.stringify(e.firefox)).not.toContain(base);
  });
});
