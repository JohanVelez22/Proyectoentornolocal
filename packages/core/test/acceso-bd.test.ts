import { existsSync, mkdirSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AccesoBd,
  MAX_PENDIENTES,
  TTL_TOKEN_MS,
  type CredencialesAcceso,
} from '../src/herramientas/accesoBd';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const CENTINELA = 'centinela-secreta-d';

const creds = (extra: Partial<CredencialesAcceso> = {}): CredencialesAcceso => ({
  motor: 'mysql',
  host: '127.0.0.1',
  puerto: 3307,
  usuario: 'wolf_u_tienda',
  clave: CENTINELA,
  ...extra,
});

async function crear(): Promise<{ acceso: AccesoBd; rutas: Rutas; reloj: { t: number } }> {
  const base = await carpetaTemporal('pel-acceso-bd-');
  const rutas = new Rutas(base);
  const reloj = { t: 1_000_000 };
  const acceso = new AccesoBd({
    rutas,
    puertoHerramienta: (h) => (h === 'adminer' ? 8090 : 8091),
    ahora: () => reloj.t,
  });
  return { acceso, rutas, reloj };
}

const emitir = (
  a: AccesoBd,
  o: Partial<{ herramienta: 'adminer' | 'phpmyadmin'; sitioId: string; base: string }> = {},
): Promise<{ url: string }> =>
  a.emitir({
    herramienta: o.herramienta ?? 'phpmyadmin',
    sitioId: o.sitioId ?? 'tienda',
    instancia: 'mysql@8.4',
    base: o.base ?? 'tienda',
    credenciales: creds(),
  });

const tokenDe = (url: string): string => new URL(url).searchParams.get('wolfcore_token') ?? '';

describe('AccesoBd: token de un solo uso', () => {
  it('la URL solo lleva el token: ni la clave ni el usuario', async () => {
    const { acceso } = await crear();
    const { url } = await emitir(acceso);
    expect(url).toMatch(
      /^http:\/\/127\.0\.0\.1:8091\/wolfcore-signon\.php\?wolfcore_token=[\w-]{43}$/,
    );
    expect(url).not.toContain(CENTINELA);
    expect(url).not.toContain('wolf_u_tienda');
    expect(url).not.toContain('tienda');
    expect(decodeURIComponent(url)).not.toContain(CENTINELA);
  });

  it('Adminer entra por su raíz y phpMyAdmin por el script de entrada', async () => {
    const { acceso } = await crear();
    expect((await emitir(acceso, { herramienta: 'adminer' })).url).toMatch(
      /^http:\/\/127\.0\.0\.1:8090\/\?wolfcore_token=[\w-]{43}$/,
    );
  });

  it('el token es de 32 bytes aleatorios en base64url y no se repite', async () => {
    const { acceso } = await crear();
    const vistos = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const t = tokenDe((await emitir(acceso)).url);
      expect(Buffer.from(t, 'base64url')).toHaveLength(32);
      vistos.add(t);
    }
    expect(vistos.size).toBe(4);
  });

  it('un token sirve una sola vez y entrega los datos de su base', async () => {
    const { acceso } = await crear();
    const t = tokenDe((await emitir(acceso, { sitioId: 'a', base: 'base_a' })).url);
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toEqual({
      ...creds(),
      sitioId: 'a',
      base: 'base_a',
      instancia: 'mysql@8.4',
    });
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
  });

  it('vence a los 60 s (reloj falso)', async () => {
    const { acceso, reloj } = await crear();
    const t = tokenDe((await emitir(acceso)).url);
    reloj.t += TTL_TOKEN_MS - 1;
    const vivo = tokenDe((await emitir(acceso)).url);
    reloj.t += 1;
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
    // El segundo, emitido un milisegundo después, todavía sirve.
    expect(acceso.canjear(vivo, acceso.secretoDeProceso(), 'phpmyadmin')).not.toBeNull();
  });

  it('un token vencido ya no sirve aunque se pida más tarde con el secreto correcto', async () => {
    const { acceso, reloj } = await crear();
    const t = tokenDe((await emitir(acceso)).url);
    reloj.t += TTL_TOKEN_MS * 10;
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
  });

  it('canje sin el secreto de proceso (o con otro) devuelve null y no gasta el token', async () => {
    const { acceso } = await crear();
    const t = tokenDe((await emitir(acceso)).url);
    expect(acceso.canjear(t, '', 'phpmyadmin')).toBeNull();
    expect(acceso.canjear(t, 'otro-secreto', 'phpmyadmin')).toBeNull();
    expect(acceso.canjear(t, acceso.secretoDeProceso().slice(0, -1), 'phpmyadmin')).toBeNull();
    // El token sigue vivo: quien no tiene el secreto no puede quemarlo.
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).not.toBeNull();
  });

  it('un token de una herramienta no sirve en la otra, y el intento lo invalida', async () => {
    const { acceso } = await crear();
    const t = tokenDe((await emitir(acceso, { herramienta: 'phpmyadmin' })).url);
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'adminer')).toBeNull();
    expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
  });

  it('un token inventado o con forma rara no sirve', async () => {
    const { acceso } = await crear();
    for (const t of ['', 'x', 'A'.repeat(43), '../../etc', 'a'.repeat(5000)]) {
      expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
    }
  });

  it('con más de 5 pendientes se invalida el más viejo', async () => {
    const { acceso } = await crear();
    expect(MAX_PENDIENTES).toBe(5);
    const tokens: string[] = [];
    for (let i = 0; i < MAX_PENDIENTES + 1; i++) tokens.push(tokenDe((await emitir(acceso)).url));
    expect(acceso.pendientes()).toBe(5);
    expect(acceso.canjear(tokens[0]!, acceso.secretoDeProceso(), 'phpmyadmin')).toBeNull();
    for (const t of tokens.slice(1)) {
      expect(acceso.canjear(t, acceso.secretoDeProceso(), 'phpmyadmin')).not.toBeNull();
    }
  });

  it('rechaza un puerto o una base que no son datos válidos', async () => {
    const { acceso } = await crear();
    await expect(
      acceso.emitir({
        herramienta: 'adminer',
        sitioId: 's',
        instancia: 'mysql',
        base: 'b',
        credenciales: creds({ puerto: 0 }),
      }),
    ).rejects.toThrow();
    await expect(
      acceso.emitir({
        herramienta: 'adminer',
        sitioId: 's',
        instancia: 'mysql',
        base: '',
        credenciales: creds(),
      }),
    ).rejects.toThrow();
  });
});

describe('AccesoBd: servidor de canje en 127.0.0.1', () => {
  it('escribe el secreto y el puerto restringidos al usuario y se limpia al detener', async () => {
    const { acceso, rutas } = await crear();
    await acceso.iniciar();
    try {
      const dir = rutas.accesoBd();
      const secreto = readFileSync(path.join(dir, 'secreto'), 'utf8').trim();
      expect(secreto).toBe(acceso.secretoDeProceso());
      expect(secreto).toMatch(/^[0-9a-f]{64}$/);
      const puerto = Number(readFileSync(path.join(dir, 'puerto'), 'utf8').trim());
      expect(puerto).toBeGreaterThan(1023);
      if (process.platform !== 'win32') {
        expect(statSync(path.join(dir, 'secreto')).mode & 0o077).toBe(0);
        expect(statSync(dir).mode & 0o077).toBe(0);
      }
    } finally {
      await acceso.detener();
    }
    expect(() => readFileSync(path.join(rutas.accesoBd(), 'secreto'))).toThrow();
  });

  it('canjea por HTTP con el secreto, una sola vez, y sin él responde 403', async () => {
    const { acceso, rutas } = await crear();
    await acceso.iniciar();
    try {
      const dir = rutas.accesoBd();
      const secreto = readFileSync(path.join(dir, 'secreto'), 'utf8').trim();
      const puerto = Number(readFileSync(path.join(dir, 'puerto'), 'utf8').trim());
      const t = tokenDe((await emitir(acceso)).url);
      const pedir = (cabeceras: Record<string, string>, cuerpo: unknown, metodo = 'POST') =>
        fetch(`http://127.0.0.1:${puerto}/canjear`, {
          method: metodo,
          headers: { 'content-type': 'application/json', ...cabeceras },
          ...(metodo === 'POST' ? { body: JSON.stringify(cuerpo) } : {}),
        });
      const cuerpo = { token: t, herramienta: 'phpmyadmin' };
      expect((await pedir({}, cuerpo)).status).toBe(403);
      expect((await pedir({ 'x-wolfcore-secreto': 'mal' }, cuerpo)).status).toBe(403);
      expect((await pedir({ 'x-wolfcore-secreto': secreto }, cuerpo, 'GET')).status).toBe(405);
      const ok = await pedir({ 'x-wolfcore-secreto': secreto }, cuerpo);
      expect(ok.status).toBe(200);
      expect(ok.headers.get('cache-control')).toBe('no-store');
      expect(await ok.json()).toMatchObject({ usuario: 'wolf_u_tienda', clave: CENTINELA });
      expect((await pedir({ 'x-wolfcore-secreto': secreto }, cuerpo)).status).toBe(403);
      // Cuerpo que no es JSON o demasiado grande: 400/413, nunca un cuelgue.
      // (0 = el servidor cortó la conexión sin esperar el resto del cuerpo).
      const raro = await fetch(`http://127.0.0.1:${puerto}/canjear`, {
        method: 'POST',
        headers: { 'x-wolfcore-secreto': secreto },
        body: 'x'.repeat(100_000),
      }).then(
        (r) => r.status,
        () => 0,
      );
      expect([0, 400, 413]).toContain(raro);
      const noJson = await pedir({ 'x-wolfcore-secreto': secreto }, '{no');
      expect([400, 403]).toContain(noJson.status);
    } finally {
      await acceso.detener();
    }
  });
});

describe('AccesoBd: secreto y sesiones de entrada', () => {
  async function conSesiones(restringidos: string[] = []) {
    const base = await carpetaTemporal('pel-acceso-ses-');
    const rutas = new Rutas(base);
    const reloj = { t: Date.now() };
    const acceso = new AccesoBd({
      rutas,
      puertoHerramienta: () => 8091,
      ahora: () => reloj.t,
      restringir: async (ruta) => {
        // Cuando se restringe el archivo del secreto todavía no lleva el secreto.
        const f = path.join(rutas.accesoBd(), 'secreto');
        restringidos.push(
          ruta === f && existsSync(f) ? `${ruta}|${readFileSync(f, 'utf8')}` : ruta,
        );
        return true;
      },
    });
    const dir = rutas.sesionesPma();
    mkdirSync(dir, { recursive: true });
    const sesion = (n: string, edadMs = 0): string => {
      const f = path.join(dir, n);
      writeFileSync(f, 'PMA_single_signon_password|s:19:"centinela-secreta-d";');
      const t = (reloj.t - edadMs) / 1000;
      utimesSync(f, t, t);
      return f;
    };
    return { rutas, acceso, reloj, sesion };
  }

  it('restringe la carpeta y el archivo del secreto al usuario antes de escribir el secreto', async () => {
    const restringidos: string[] = [];
    const { rutas, acceso } = await conSesiones(restringidos);
    await acceso.iniciar();
    await acceso.detener();
    const dir = rutas.accesoBd();
    const secreto = path.join(dir, 'secreto');
    expect(restringidos[0]).toBe(dir);
    // El archivo se restringe vacío: el secreto no se escribió todavía.
    expect(restringidos[1]).toBe(`${secreto}|`);
  });

  it('borra los sess_* al iniciar y al detener, y nada más', async () => {
    const { rutas, acceso, sesion } = await conSesiones();
    const otro = path.join(rutas.sesionesPma(), 'otra-cosa.txt');
    writeFileSync(otro, 'x');
    const a = sesion('sess_abc123');
    await acceso.iniciar();
    expect(existsSync(a)).toBe(false);
    const b = sesion('sess_def456');
    await acceso.detener();
    expect(existsSync(b)).toBe(false);
    expect(existsSync(otro)).toBe(true);
  });

  it('en cada emisión borra las sesiones de más de 8 h y conserva las recientes', async () => {
    const { acceso, sesion } = await conSesiones();
    await acceso.iniciar();
    const vieja = sesion('sess_vieja', 8 * 60 * 60 * 1000 + 60_000);
    const reciente = sesion('sess_reciente', 60 * 60 * 1000);
    await acceso.emitir({
      herramienta: 'phpmyadmin',
      sitioId: 's',
      instancia: 'mysql',
      base: 'b',
      credenciales: creds(),
    });
    try {
      expect(existsSync(vieja)).toBe(false);
      expect(existsSync(reciente)).toBe(true);
    } finally {
      await acceso.detener();
    }
  });
});
