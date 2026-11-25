import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import forge from 'node-forge';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Almacen } from '../src/almacen';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { emitirCertificado, generarCA, huellaSha1 } from '../src/https/ca';
import { GestorHttps } from '../src/https/certificados';
import { PlataformaWindows } from '../src/plataforma/win';
import { Rutas } from '../src/rutas';
import { GestorSitios } from '../src/sitios/sitios';
import { ConfigSchema, type Sitio } from '../src/tipos';

let base: string;
let rutas: Rutas;
let instalados: string[];
let quitados: string[];
let duenos: Map<number, { pid: number; nombre: string }>;
let resultadoInstalar: { ok: true } | { ok: false; motivo: 'cancelado'; detalle?: string };
let pidNginx: number | null;
let hijosNginx: Map<number, number[]>;

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-https-'));
  rutas = new Rutas(base);
  instalados = [];
  quitados = [];
  duenos = new Map();
  resultadoInstalar = { ok: true };
  pidNginx = null;
  hijosNginx = new Map();
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

// Plataforma falsa: nunca toca el almacén de certificados real.
function gestorHttps(ahora?: () => Date): GestorHttps {
  return new GestorHttps({
    rutas,
    pidNginx: () => pidNginx,
    ...(ahora ? { ahora } : {}),
    plataforma: {
      instalarCertificadoUsuario: async (ruta) => {
        instalados.push(ruta);
        return resultadoInstalar;
      },
      quitarCertificadoUsuario: async (h) => {
        quitados.push(h);
        return { ok: true };
      },
      certificadoInstalado: async () => instalados.length > 0 && quitados.length === 0,
      duenosDePuertos: async () => duenos,
      descendientes: async (pids) => new Map(pids.map((p) => [p, hijosNginx.get(p) ?? []])),
    },
  });
}

describe('CA y certificados', () => {
  it('la CA es RSA 3072, dura 10 años y es autoridad con keyCertSign/cRLSign', () => {
    const ca = generarCA();
    const c = forge.pki.certificateFromPem(ca.certPem);
    expect(c.subject.getField('CN').value).toBe('WolfCore Dev CA');
    expect((c.publicKey as forge.pki.rsa.PublicKey).n.bitLength()).toBe(3072);
    const dias = (c.validity.notAfter.getTime() - c.validity.notBefore.getTime()) / 86_400_000;
    expect(dias).toBeGreaterThan(3649);
    const bc = c.getExtension('basicConstraints') as { cA: boolean; pathLenConstraint?: number };
    expect(bc.cA).toBe(true);
    expect(bc.pathLenConstraint).toBe(0);
    const ku = c.getExtension('keyUsage') as { keyCertSign: boolean; cRLSign: boolean };
    expect(ku.keyCertSign).toBe(true);
    expect(ku.cRLSign).toBe(true);
  });

  it('el certificado emitido verifica contra la CA, tiene los SAN y vence en 825 días', () => {
    const ca = generarCA();
    const { certPem, keyPem } = emitirCertificado(ca, ['a.test', 'b.a.test']);
    const caCert = forge.pki.certificateFromPem(ca.certPem);
    const c = forge.pki.certificateFromPem(certPem);
    expect(caCert.verify(c)).toBe(true);
    const san = c.getExtension('subjectAltName') as { altNames: { type: number; value: string }[] };
    expect(san.altNames.map((a) => [a.type, a.value])).toEqual([
      [2, 'a.test'],
      [2, 'b.a.test'],
    ]);
    const eku = c.getExtension('extKeyUsage') as { serverAuth: boolean };
    expect(eku.serverAuth).toBe(true);
    const dias = (c.validity.notAfter.getTime() - Date.now()) / 86_400_000;
    expect(dias).toBeGreaterThan(824);
    expect(dias).toBeLessThanOrEqual(825.01);
    expect((c.publicKey as forge.pki.rsa.PublicKey).n.bitLength()).toBe(2048);
    expect(keyPem).toContain('PRIVATE KEY');
    expect(c.serialNumber).toMatch(/^[0-9a-f]{32}$/);
  });

  it('la huella es el SHA-1 en mayúsculas del DER', () => {
    expect(huellaSha1(generarCA().certPem)).toMatch(/^[0-9A-F]{40}$/);
  });
});

describe('GestorHttps', () => {
  it('estado: sin CA no está creada ni instalada', async () => {
    expect(await gestorHttps().estado()).toEqual({ caCreada: false, caInstalada: false });
  });

  it('instalarCA crea la CA y llama a la plataforma con la ruta del .crt', async () => {
    const g = gestorHttps();
    expect(await g.instalarCA()).toEqual({ ok: true });
    expect(instalados).toEqual([path.join(base, 'ca', 'wolfcore-dev-ca.crt')]);
    expect(existsSync(path.join(base, 'ca', 'wolfcore-dev-ca.key'))).toBe(true);
    expect(await g.estado()).toEqual({ caCreada: true, caInstalada: true });
  });

  it('instalarCA cancelada devuelve motivo cancelado con mensaje en español', async () => {
    resultadoInstalar = { ok: false, motivo: 'cancelado' };
    const r = await gestorHttps().instalarCA();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe('cancelado');
      expect(r.mensaje).toMatch(/cancel/i);
    }
  });

  it('quitarCA usa la huella de la CA', async () => {
    const g = gestorHttps();
    await g.instalarCA();
    const huella = huellaSha1(readFileSync(path.join(base, 'ca', 'wolfcore-dev-ca.crt'), 'utf8'));
    expect(await g.quitarCA()).toEqual({ ok: true });
    expect(quitados).toEqual([huella]);
  });

  it('asegurarCertificado crea, reutiliza y regenera si cambian los dominios', async () => {
    const g = gestorHttps();
    await g.instalarCA();
    const a = await g.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: [] });
    expect(a.crt).toBe(path.join(base, 'certs', 'a.crt'));
    expect(a.key).toBe(path.join(base, 'certs', 'a.key'));
    const antes = readFileSync(a.crt, 'utf8');
    await g.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: [] });
    expect(readFileSync(a.crt, 'utf8')).toBe(antes);
    await g.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: ['x.test'] });
    const c = forge.pki.certificateFromPem(readFileSync(a.crt, 'utf8'));
    const san = c.getExtension('subjectAltName') as { altNames: { value: string }[] };
    expect(san.altNames.map((n) => n.value)).toEqual(['a.test', 'x.test']);
  });

  it('asegurarCertificado regenera si faltan menos de 30 días', async () => {
    await gestorHttps().instalarCA();
    const g = gestorHttps();
    const a = await g.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: [] });
    const antes = readFileSync(a.crt, 'utf8');
    const futuro = gestorHttps(() => new Date(Date.now() + 800 * 86_400_000));
    await futuro.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: [] });
    expect(readFileSync(a.crt, 'utf8')).not.toBe(antes);
  });

  it('ocupantePuerto: null si está libre o es nuestro nginx; si no, nombre y PID', async () => {
    const g = gestorHttps();
    expect(await g.ocupantePuerto(443)).toBeNull();
    duenos.set(443, { pid: 10, nombre: 'nginx.exe' });
    expect(await g.ocupantePuerto(443)).toEqual({ pid: 10, nombre: 'nginx.exe' });
    pidNginx = 10;
    expect(await g.ocupantePuerto(443)).toBeNull();
  });

  it('ocupantePuerto: el worker de nuestro nginx (hijo del maestro) también es nuestro', async () => {
    // Windows: netstat muestra el 443 a nombre del worker, no del maestro que vigila el supervisor.
    const g = gestorHttps();
    pidNginx = 10;
    duenos.set(443, { pid: 11, nombre: 'nginx.exe' });
    expect(await g.ocupantePuerto(443)).toEqual({ pid: 11, nombre: 'nginx.exe' });
    hijosNginx.set(10, [11]);
    expect(await g.ocupantePuerto(443)).toBeNull();
    expect(await g.puertoUsable(443)).toBe(true);
    // Un nginx ajeno (p. ej. el de FlyEnv) sigue contando como ocupado.
    duenos.set(443, { pid: 99, nombre: 'nginx.exe' });
    expect(await g.puertoUsable(443)).toBe(false);
  });

  it('puertoUsable: libre y propio sí; ocupado por otro no', async () => {
    const g = gestorHttps();
    expect(await g.puertoUsable(443)).toBe(true);
    duenos.set(443, { pid: 10, nombre: 'FlyEnv.exe' });
    expect(await g.puertoUsable(443)).toBe(false);
    pidNginx = 10;
    expect(await g.puertoUsable(443)).toBe(true);
  });
});

describe('aplicar con HTTPS', () => {
  const carpeta = () => path.join(base, 'sitio');
  function montar(): { g: GestorSitios; https: GestorHttps } {
    mkdirSync(carpeta(), { recursive: true });
    const https = gestorHttps();
    const g = new GestorSitios({
      almacen: new Almacen(rutas),
      rutas,
      nginx: {
        validar: async () => ({ ok: true, salida: 'ok' }),
        recargar: async () => undefined,
      },
      estadoNginx: () => 'apagado',
      hosts: { sincronizar: async () => ({ ok: true }) },
      instalador: { instalado: async () => true, instalados: async () => ['1.28.0'] },
      eventos: new Eventos<EventosNucleo>(),
      https,
    });
    return { g, https };
  }
  const nuevo = (extra: Partial<Omit<Sitio, 'id'>>): Omit<Sitio, 'id'> => ({
    nombre: 'A',
    dominio: 'a.test',
    alias: [],
    carpeta: carpeta(),
    tipo: 'estatico',
    php: null,
    puertoProxy: null,
    reglasExtra: '',
    urlBaseVar: null,
    datosReales: false,
    nota: '',
    https: true,
    redirigirHttps: false,
    confiado: false,
    git: null,
    procesos: [],
    runtimes: {},
    ...extra,
  });
  const vhost = () => readFileSync(rutas.vhost('a'), 'utf8');

  it('la configuración antigua sigue siendo válida (https por defecto)', () => {
    const c = ConfigSchema.parse({
      version: 1,
      sitios: [{ id: 'a', nombre: 'A', dominio: 'a.test', carpeta: 'C:\\a', tipo: 'estatico' }],
    });
    expect(c.sitios[0]!.https).toBe(false);
    expect(c.sitios[0]!.redirigirHttps).toBe(false);
    expect(c.https.puerto).toBe(443);
  });

  it('con CA y puerto libre agrega ssl al vhost', async () => {
    const { g, https } = montar();
    await https.instalarCA();
    await g.crear(nuevo({}));
    const r = await g.aplicar();
    expect(r.httpsPendiente).toEqual([]);
    expect(vhost()).toContain('listen 127.0.0.1:443 ssl;');
    expect(vhost()).toContain('http2 on;');
    expect(vhost()).toContain(
      `ssl_certificate "${path.join(base, 'certs', 'a.crt').replace(/\\/g, '/')}";`,
    );
  });

  it('con el 443 ocupado no hay ssl y el sitio queda en httpsPendiente (HTTP sigue)', async () => {
    const { g, https } = montar();
    await https.instalarCA();
    duenos.set(443, { pid: 99, nombre: 'FlyEnv.exe' });
    await g.crear(nuevo({ redirigirHttps: true }));
    const r = await g.aplicar();
    expect(r.httpsPendiente).toEqual(['a']);
    expect(vhost()).not.toContain('ssl');
    expect(vhost()).not.toContain('pel_redir');
    expect(vhost()).toContain('listen 127.0.0.1:80;');
  });

  it('sin CA el sitio queda pendiente', async () => {
    const { g } = montar();
    await g.crear(nuevo({}));
    expect((await g.aplicar()).httpsPendiente).toEqual(['a']);
  });

  it('un sitio sin https nunca queda pendiente', async () => {
    const { g } = montar();
    await g.crear(nuevo({ https: false }));
    expect((await g.aplicar()).httpsPendiente).toEqual([]);
  });
});

describe('PlataformaWindows: certutil', () => {
  const con = (codigo: number, stdout = '', stderr = '') => {
    const llamadas: string[][] = [];
    const p = new PlataformaWindows(async (_c, args) => {
      llamadas.push(args);
      return { codigo, stdout, stderr };
    });
    return { p, llamadas };
  };

  it('addstore ok', async () => {
    const { p, llamadas } = con(0);
    expect(await p.instalarCertificadoUsuario('C:/ca.crt')).toEqual({ ok: true });
    expect(llamadas[0]).toEqual(['-user', '-addstore', 'Root', 'C:/ca.crt']);
  });
  it('cancelar (0x800704C7) es cancelado, por código o por texto', async () => {
    const a = await con(-2147023673).p.instalarCertificadoUsuario('x');
    expect(a).toMatchObject({ ok: false, motivo: 'cancelado' });
    const b = await con(
      1,
      'CertUtil: -addstore: 0x800704c7 (WIN32: 1223)',
    ).p.instalarCertificadoUsuario('x');
    expect(b).toMatchObject({ ok: false, motivo: 'cancelado' });
  });
  it('otro fallo es error con detalle, no cancelado', async () => {
    const r = await con(1, 'acceso denegado').p.instalarCertificadoUsuario('x');
    expect(r).toEqual({ ok: false, motivo: 'error', detalle: 'acceso denegado' });
  });
  it('delstore: no encontrado cuenta como hecho', async () => {
    const h = 'A'.repeat(40);
    expect(await con(-2146885628).p.quitarCertificadoUsuario(h)).toEqual({ ok: true });
    expect(await con(1, '0x80092004').p.quitarCertificadoUsuario(h)).toEqual({ ok: true });
    expect(await con(5, 'boom').p.quitarCertificadoUsuario(h)).toMatchObject({
      ok: false,
      motivo: 'error',
    });
  });
  it('addstore con "no encontrado" sigue siendo error', async () => {
    expect(await con(-2146885628).p.instalarCertificadoUsuario('x')).toMatchObject({
      motivo: 'error',
    });
  });
  it('certificadoInstalado usa -store con la huella', async () => {
    const { p, llamadas } = con(0);
    expect(await p.certificadoInstalado('B'.repeat(40))).toBe(true);
    expect(llamadas[0]).toEqual(['-user', '-store', 'Root', 'B'.repeat(40)]);
    expect(await con(1).p.certificadoInstalado('B'.repeat(40))).toBe(false);
  });
});

describe('GestorHttps.regenerarCA (Doctor)', () => {
  /** Estado de los archivos: CA y certificados tal cual. */
  const foto = (): Record<string, string> => {
    const r: Record<string, string> = {
      crt: readFileSync(rutas.caCrt(), 'utf8'),
      key: readFileSync(rutas.caKey(), 'utf8'),
    };
    for (const n of readdirSync(path.dirname(rutas.certCrt('x')))) {
      r[n] = readFileSync(path.join(path.dirname(rutas.certCrt('x')), n), 'utf8');
    }
    return r;
  };
  const preparar = async () => {
    const g = gestorHttps();
    await g.instalarCA();
    await g.asegurarCertificado({ id: 's1', dominio: 'a.test', alias: [] });
    instalados = [];
    return { g, antes: foto(), huellaVieja: huellaSha1(readFileSync(rutas.caCrt(), 'utf8')) };
  };
  const respaldo = () => path.join(base, 'respaldos');
  const sinTemporales = () =>
    expect(readdirSync(path.dirname(rutas.caCrt())).filter((n) => n.startsWith('.'))).toEqual([]);

  it('confía primero la nueva; luego reemplaza, aplica (certs nuevos) y quita la vieja', async () => {
    const { g, antes, huellaVieja } = await preparar();
    let vistaAlAplicar = '';
    const r = await g.regenerarCA(respaldo(), async () => {
      // nginx: los certificados se vuelven a emitir con la CA nueva
      vistaAlAplicar = readFileSync(rutas.caCrt(), 'utf8');
      await g.asegurarCertificado({ id: 's1', dominio: 'a.test', alias: [] });
      return true;
    });
    expect(r).toEqual({ ok: true });
    expect(instalados).toHaveLength(1);
    expect(quitados).toEqual([huellaVieja]);
    const nueva = readFileSync(rutas.caCrt(), 'utf8');
    expect(nueva).not.toBe(antes['crt']);
    expect(vistaAlAplicar).toBe(nueva);
    const cert = forge.pki.certificateFromPem(readFileSync(rutas.certCrt('s1'), 'utf8'));
    expect(forge.pki.certificateFromPem(nueva).verify(cert)).toBe(true);
    const [copia] = readdirSync(respaldo());
    expect(readFileSync(path.join(respaldo(), copia!, 'ca', 'wolfcore-dev-ca.key'), 'utf8')).toBe(
      antes['key'],
    );
    expect(existsSync(path.join(respaldo(), copia!, 'certs', 's1.crt'))).toBe(true);
    sinTemporales();
  });

  it('confiar la nueva cancelado: CA vieja confiada, archivos y certificados intactos', async () => {
    const { g, antes } = await preparar();
    resultadoInstalar = { ok: false, motivo: 'cancelado' };
    let aplicado = false;
    const r = await g.regenerarCA(respaldo(), async () => {
      aplicado = true;
      return true;
    });
    expect(r).toMatchObject({ ok: false, motivo: 'cancelado' });
    expect(quitados).toEqual([]);
    expect(aplicado).toBe(false);
    expect(foto()).toEqual(antes);
    sinTemporales();
  });

  it('fallo al aplicar (nginx): vuelve atrás archivos y certificados y quita la nueva del almacén', async () => {
    const { g, antes, huellaVieja } = await preparar();
    let intentos = 0;
    const r = await g.regenerarCA(respaldo(), async () => {
      intentos++;
      if (intentos === 1) {
        await g.asegurarCertificado({ id: 's1', dominio: 'a.test', alias: [] });
        return false;
      }
      return true;
    });
    expect(r).toMatchObject({ ok: false, motivo: 'error' });
    expect(foto()).toEqual(antes);
    expect(quitados).toHaveLength(1);
    expect(quitados[0]).not.toBe(huellaVieja);
    expect(intentos).toBe(2);
    sinTemporales();
  });

  it('si no se puede quitar la vieja del almacén, queda la nueva y solo se avisa', async () => {
    const { antes } = await preparar();
    const g = new GestorHttps({
      rutas,
      plataforma: {
        instalarCertificadoUsuario: async () => ({ ok: true }),
        quitarCertificadoUsuario: async () => ({ ok: false, motivo: 'cancelado' }),
        certificadoInstalado: async () => true,
        duenosDePuertos: async () => new Map(),
        descendientes: async () => new Map(),
      },
    });
    const r = await g.regenerarCA(respaldo(), async () => true);
    expect(r).toEqual({ ok: true, avisoCaVieja: true });
    expect(readFileSync(rutas.caCrt(), 'utf8')).not.toBe(antes['crt']);
  });
});

describe('robustez de GestorHttps', () => {
  it('dos primeras llamadas concurrentes crean una sola CA', async () => {
    const g = gestorHttps();
    const [a, b] = await Promise.all([
      g.asegurarCertificado({ id: 'a', dominio: 'a.test', alias: [] }),
      g.asegurarCertificado({ id: 'b', dominio: 'b.test', alias: [] }),
    ]);
    const ca = forge.pki.certificateFromPem(readFileSync(rutas.caCrt(), 'utf8'));
    for (const x of [a, b]) {
      expect(ca.verify(forge.pki.certificateFromPem(readFileSync(x.crt, 'utf8')))).toBe(true);
    }
  });

  it('datosPrincipal devuelve null si no se puede emitir el certificado', async () => {
    const g = gestorHttps();
    await g.instalarCA();
    mkdirSync(path.join(base, 'certs'), { recursive: true });
    // Una carpeta ocupa el lugar del .crt: escribirlo falla.
    mkdirSync(rutas.certCrt('_localhost'));
    mkdirSync(rutas.certKey('_localhost'));
    expect(await g.datosPrincipal(443)).toBeNull();
  });

  it('los certificados de sitio llevan AuthorityKeyIdentifier y SubjectKeyIdentifier', () => {
    const ca = generarCA();
    const c = forge.pki.certificateFromPem(emitirCertificado(ca, ['a.test']).certPem);
    expect(c.getExtension('authorityKeyIdentifier')).toBeTruthy();
    expect(c.getExtension('subjectKeyIdentifier')).toBeTruthy();
    const caCert = forge.pki.certificateFromPem(ca.certPem);
    const aki = c.getExtension('authorityKeyIdentifier') as { value: string };
    const ski = caCert.getExtension('subjectKeyIdentifier') as { subjectKeyIdentifier: string };
    expect(forge.util.bytesToHex(aki.value).includes(ski.subjectKeyIdentifier)).toBe(true);
  });
});
