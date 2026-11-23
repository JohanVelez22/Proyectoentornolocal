import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { generarCA } from '../src/https/ca';
import {
  ConfianzaCa,
  conBloqueFirefox,
  firefoxConfiaEnRaices,
  PREF_FIREFOX,
  renombrarConReintentos,
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

  it('nuestra CA se reconoce por la huella del DER, no por el texto PEM', async () => {
    ca = await crearCa();
    // Mismo certificado con otro corte de líneas (76 columnas) y CRLF.
    const cuerpo = n(ca)
      .replace(/-----(BEGIN|END) CERTIFICATE-----/g, '')
      .replace(/\s+/g, '');
    const recortada = `-----BEGIN CERTIFICATE-----\r\n${cuerpo.match(/.{1,76}/g)!.join('\r\n')}\r\n-----END CERTIFICATE-----\r\n`;
    const solo = await proyecto({ venv: true, certifi: recortada });
    await expect(confianza().bundlePython(path.join(solo, '.venv'))).rejects.toMatchObject({
      codigo: 'confianza.sin_raices',
    });
    await writeFile(
      path.join(solo, '.venv', 'Lib', 'site-packages', 'certifi', 'cacert.pem'),
      recortada + raizAjena,
    );
    const texto = await readFile(await confianza().bundlePython(path.join(solo, '.venv')), 'utf8');
    expect(bloques(texto)).toHaveLength(2);
  });

  it('el bundle del sistema se renueva a los 7 días aunque la CA no cambie', async () => {
    ca = await crearCa();
    let ahora = new Date('2026-11-01T00:00:00Z');
    const c = new ConfianzaCa({
      rutas,
      plataforma: plat,
      carpetaRespaldos: path.join(base, 'etc', 'respaldos'),
      entorno: {},
      ahora: () => ahora,
    });
    await c.bundlePython(null);
    ahora = new Date('2026-11-07T00:00:00Z');
    await c.bundlePython(null);
    expect(plat.raicesLeidas).toBe(1);
    ahora = new Date('2026-11-08T12:00:00Z');
    await c.bundlePython(null);
    expect(plat.raicesLeidas).toBe(2);
  });

  it('dos escrituras simultáneas del mismo bundle no chocan (temporal con sufijo aleatorio)', async () => {
    ca = await crearCa();
    const [a, b] = await Promise.all([
      confianza().bundlePython(null),
      confianza().bundlePython(null),
    ]);
    expect(a).toBe(b);
    expect((await readdir(path.dirname(a))).filter((x) => x.endsWith('.tmp'))).toEqual([]);
  });

  it('muchas escrituras simultáneas con lectores a la vez: ninguna falla ni deja temporales', async () => {
    ca = await crearCa();
    const destino = await confianza().bundlePython(null);
    // Bajo carga, en Windows un `rename` sobre un destino que otro está leyendo o reemplazando
    // falla con EPERM/EACCES/EBUSY: aquí se fuerza ese cruce con escritores y lectores a la vez
    // (los lectores son como Python u otro proceso: abren el bundle cada pocos milisegundos).
    // Con la fecha 8 días adelante el bundle del sistema está vencido: cada llamada lo reescribe.
    const futuro = (): Date => new Date(Date.now() + 8 * 24 * 3600 * 1000);
    let leyendo = true;
    const lectores = Array.from({ length: 4 }, async () => {
      while (leyendo) {
        await readFile(destino, 'utf8').catch(() => '');
        await new Promise((r) => setTimeout(r, 2));
      }
    });
    const escritores = Array.from({ length: 24 }, () =>
      new ConfianzaCa({
        rutas,
        plataforma: plat,
        carpetaRespaldos: path.join(base, 'etc', 'respaldos'),
        entorno: {},
        ahora: futuro,
      }).bundlePython(null),
    );
    const r = await Promise.allSettled(escritores);
    leyendo = false;
    await Promise.all(lectores);
    expect(r.filter((x) => x.status === 'rejected')).toEqual([]);
    expect((await readdir(path.dirname(destino))).filter((x) => x.endsWith('.tmp'))).toEqual([]);
    expect(bloques(await readFile(destino, 'utf8'))).toHaveLength(2);
    // Plazo amplio: en Windows, con lectores a la vez, cada escritor puede esperar a que se libere.
  }, 60_000);

  it('renombrarConReintentos: reintenta EPERM/EACCES/EBUSY; otro error o el último, tal cual', async () => {
    const err = (code: string): NodeJS.ErrnoException => Object.assign(new Error(code), { code });
    let n = 0;
    await renombrarConReintentos('a', 'b', async () => {
      n++;
      if (n < 3) throw err(n === 1 ? 'EPERM' : 'EBUSY');
    });
    expect(n).toBe(3);
    n = 0;
    await expect(
      renombrarConReintentos('a', 'b', async () => {
        n++;
        throw err('ENOENT');
      }),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    expect(n).toBe(1);
    n = 0;
    await expect(
      renombrarConReintentos(
        'a',
        'b',
        async () => {
          n++;
          throw err('EACCES');
        },
        3,
      ),
    ).rejects.toMatchObject({ code: 'EACCES' });
    expect(n).toBe(3);
  });

  it('renombrarConReintentos: aguanta un bloqueo largo (≈ segundos) con espera creciente y tope', async () => {
    const err = (code: string): NodeJS.ErrnoException => Object.assign(new Error(code), { code });
    let n = 0;
    const esperas: number[] = [];
    await renombrarConReintentos(
      'a',
      'b',
      async () => {
        n++;
        if (n <= 20) throw err('EPERM');
      },
      undefined,
      async (ms) => {
        esperas.push(ms);
      },
    );
    expect(n).toBe(21);
    // Espera creciente con tope: ninguna pasa de 250 ms y en total cubre varios segundos.
    expect(Math.max(...esperas)).toBeLessThanOrEqual(250);
    expect(esperas.reduce((a, b) => a + b, 0)).toBeGreaterThan(2000);
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

  it('sin CA, o con una variable ajena en el registro del usuario, no toca nada', async () => {
    await expect(confianza().nodeGlobal(true)).rejects.toMatchObject({
      codigo: 'confianza.sin_ca',
    });
    ca = await crearCa();
    // La variable ajena está en el registro aunque este proceso no la heredó.
    plat.variables.set('NODE_EXTRA_CA_CERTS', 'C:\\corp\\ca.pem');
    await expect(confianza({}).nodeGlobal(true)).rejects.toMatchObject({
      codigo: 'confianza.node_variable_ajena',
    });
    expect(plat.variables.get('NODE_EXTRA_CA_CERTS')).toBe('C:\\corp\\ca.pem');
    const e = await confianza({}).estado();
    expect(e.node).toMatchObject({ global: false, ajena: true });
  });

  it('activar con la variable ya igual a la CA vale (no es ajena)', async () => {
    ca = await crearCa();
    plat.variables.set('NODE_EXTRA_CA_CERTS', rutas.caCrt());
    expect((await confianza().nodeGlobal(true)).node.global).toBe(true);
  });

  it('desactivar sin haberla fijado nosotros no borra la del usuario', async () => {
    plat.variables.set('NODE_EXTRA_CA_CERTS', 'C:\\corp\\ca.pem');
    await confianza().nodeGlobal(false);
    expect(plat.variables.get('NODE_EXTRA_CA_CERTS')).toBe('C:\\corp\\ca.pem');
  });

  it('si el usuario la cambió después de activar, desactivar no la borra y avisa', async () => {
    ca = await crearCa();
    await confianza().nodeGlobal(true);
    plat.variables.set('NODE_EXTRA_CA_CERTS', 'C:\\corp\\otra.pem');
    const r = await confianza().nodeGlobal(false);
    expect(plat.variables.get('NODE_EXTRA_CA_CERTS')).toBe('C:\\corp\\otra.pem');
    expect(r.aviso).toBe('confianza.node_variable_cambiada');
    expect(r.node.global).toBe(false);
    // Tampoco cuenta como "nuestra" para el estado (se decide por el registro, no por la marca).
    expect((await confianza().estado()).node).toMatchObject({ global: false, ajena: true });
  });

  it('el estado se lee del registro: borrada a mano, deja de figurar como activa', async () => {
    ca = await crearCa();
    await confianza().nodeGlobal(true);
    plat.variables.delete('NODE_EXTRA_CA_CERTS');
    expect((await confianza().estado()).node.global).toBe(false);
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
      { perfil: 'a.default', activo: false, abierto: true, fuera: false },
      { perfil: 'b.trabajo', activo: true, abierto: false, fuera: false },
    ]);
    void b;
  });

  it('Firefox abierto justo antes de reemplazar user.js: no se reemplaza', async () => {
    const [a] = await perfiles();
    let consultas = 0;
    plat.firefoxEnUso = async (p: string) => p === a && ++consultas > 1;
    const r = await confianza().firefoxActivar(true);
    expect(r[0]).toEqual({ perfil: 'a.default', ok: false, codigo: 'firefox.abierto' });
    expect(await readFile(path.join(a!, 'user.js'), 'utf8')).toBe(AJENO);
    expect((await readdir(a!)).filter((x) => x.endsWith('.tmp'))).toEqual([]);
  });

  it('Firefox 120+ ya confía por defecto, o por prefs.js (solo lectura): sin falso negativo', async () => {
    const [a, b] = await perfiles();
    await writeFile(
      path.join(a!, 'compatibility.ini'),
      '[Compatibility]\r\nLastVersion=128.0.3_20240801000000/20240801000000\r\n',
    );
    await writeFile(
      path.join(b!, 'prefs.js'),
      'user_pref("security.enterprise_roots.enabled", true);\n',
    );
    const lista = await confianza().firefox();
    expect(lista.map((p) => p.activo)).toEqual([true, true]);
    expect(await readFile(path.join(b!, 'prefs.js'), 'utf8')).toBe(
      'user_pref("security.enterprise_roots.enabled", true);\n',
    );
    // Versión vieja sin nada explícito: no confía. Un false explícito en user.js gana.
    await writeFile(path.join(a!, 'compatibility.ini'), 'LastVersion=115.9.0_2024/2024\n');
    expect((await confianza().firefox())[0]!.activo).toBe(false);
    await writeFile(
      path.join(b!, 'user.js'),
      'user_pref("security.enterprise_roots.enabled", false);\n',
    );
    expect((await confianza().firefox())[1]!.activo).toBe(false);
  });

  it('un perfil fuera de la carpeta de Firefox se muestra como tal y no se toca sin confirmación aparte', async () => {
    const [a, b] = await perfiles();
    plat.firefoxFuera.add(b!);
    expect((await confianza().firefox()).map((p) => p.fuera)).toEqual([false, true]);
    const r = await confianza().firefoxActivar(true);
    expect(r[1]).toEqual({ perfil: 'b.trabajo', ok: false, codigo: 'firefox.fuera' });
    expect((await readdir(b!)).includes('user.js')).toBe(false);
    const r2 = await confianza().firefoxActivar(true, { incluirFuera: true });
    expect(r2[1]).toEqual({ perfil: 'b.trabajo', ok: true });
    expect(await readFile(path.join(b!, 'user.js'), 'utf8')).toContain(PREF_FIREFOX);
    void a;
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
