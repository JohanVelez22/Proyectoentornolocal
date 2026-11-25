import * as crypto from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { hash as bcryptHash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaClaves } from '../src/bd/auditoriaClaves';
import { auditar, type DepsAuditar } from '../src/bd/auditoriaClaves/auditar';
import { CONTRASENAS_COMUNES } from '../src/bd/auditoriaClaves/comunes';
import { baseDeDatosReales, baseDeSitio } from '../src/bd/auditoriaClaves/datosReales';
import {
  barajar,
  coincide,
  coincideAlguna,
  formatoDe,
  hashearNueva,
  tipoNoRevisable,
} from '../src/bd/auditoriaClaves/hashes';
import { crearPool } from '../src/bd/auditoriaClaves/poolBcrypt';
import { TablasSql, type ConsultaSql } from '../src/bd/auditoriaClaves/tablas';
import { BasesDeDatos } from '../src/bd/basesDeDatos';
import { CerrojoBases } from '../src/bd/cerrojoBases';
import { ErrorWolf } from '../src/errores';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const md5 = (s: string): string => crypto.createHash('md5').update(s).digest('hex');
const sha1 = (s: string): string => crypto.createHash('sha1').update(s).digest('hex');
const tieneArgon2 = typeof (crypto as unknown as { argon2?: unknown }).argon2 === 'function';
const NUEVA = 'Nueva-Clave-Centinela-d20!';

/** Hash bcrypt de costo 4 (rápido en pruebas; el algoritmo es el mismo). */
const bc = (clave: string, costo = 4): Promise<string> => bcryptHash(clave, costo);

function django(clave: string, iteraciones = 1000, sal = 'sal1234abcde'): string {
  const k = crypto.pbkdf2Sync(clave, sal, iteraciones, 32, 'sha256').toString('base64');
  return `pbkdf2_sha256$${iteraciones}$${sal}$${k}`;
}

async function codigo(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErrorWolf) return e.codigo;
    throw e;
  }
  return 'sin error';
}

// ---------------------------------------------------------------------------------------------
// Formatos de hash
// ---------------------------------------------------------------------------------------------

describe('hashes: formatoDe y coincide', () => {
  it('reconoce cada formato por su forma', async () => {
    expect(formatoDe(await bc('x'))).toBe('bcrypt');
    expect(formatoDe((await bc('x')).replace('$2b$', '$2y$'))).toBe('bcrypt');
    expect(formatoDe(django('x'))).toBe('django-pbkdf2');
    expect(formatoDe(md5('x'))).toBe('md5');
    expect(formatoDe(sha1('x').toUpperCase())).toBe('sha1');
    expect(formatoDe('')).toBe('desconocido');
    expect(formatoDe('$1$abc$defghijklmnopqrstuvwx')).toBe('desconocido');
    expect(formatoDe('texto-cualquiera')).toBe('desconocido');
    expect(formatoDe('a'.repeat(5000))).toBe('desconocido');
  });

  it('$2x$ no se trata como bcrypt', async () => {
    const h = await bc('x');
    expect(formatoDe(h.replace('$2b$', '$2x$'))).toBe('desconocido');
    expect(await coincide(h.replace('$2b$', '$2x$'), 'x')).toBe(false);
    expect(tipoNoRevisable(h.replace('$2b$', '$2x$'))).toBe('bcrypt_otro');
  });

  it('bcrypt con un costo fuera de rango o PBKDF2 con demasiadas iteraciones no se revisan', async () => {
    const alto = (await bc('x')).replace('$04$', '$31$');
    expect(formatoDe(alto)).toBe('desconocido');
    expect(formatoDe(django('x', 10, 'abc').replace('$10$', '$99999999$'))).toBe('desconocido');
  });

  it('PBKDF2: una derivada de más de 64 bytes no se acepta', () => {
    const largo = crypto.pbkdf2Sync('x', 'sal', 10, 65, 'sha256').toString('base64');
    expect(formatoDe(`pbkdf2_sha256$10$sal$${largo}`)).toBe('desconocido');
    const ok = crypto.pbkdf2Sync('x', 'sal', 10, 64, 'sha256').toString('base64');
    expect(formatoDe(`pbkdf2_sha256$10$sal$${ok}`)).toBe('django-pbkdf2');
  });

  it('argon2 solo se reconoce si node:crypto lo ofrece', () => {
    const phc = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$' + 'A'.repeat(43);
    expect(formatoDe(phc)).toBe(tieneArgon2 ? 'argon2' : 'desconocido');
    expect(formatoDe(phc.replace('m=65536', 'm=999999999'))).toBe('desconocido');
  });

  it('coincide con la clave correcta y no con otra', async () => {
    for (const h of [await bc('hunter2'), django('hunter2'), md5('hunter2'), sha1('hunter2')]) {
      expect(await coincide(h, 'hunter2')).toBe(true);
      expect(await coincide(h, 'hunter3')).toBe(false);
    }
    expect(await coincide(md5('hunter2').toUpperCase(), 'hunter2')).toBe(true);
    expect(await coincide('no-es-un-hash', 'x')).toBe(false);
  });

  it('phpass (WordPress): vector conocido, y se reproduce con la sal nueva', async () => {
    const wp = '$P$9IQRaTwmfeRo7ud9Fh4E2PdI0S3r.L0';
    expect(formatoDe(wp)).toBe('phpass');
    expect(await coincide(wp, 'test12345')).toBe(true);
    expect(await coincide(wp, 'test12346')).toBe(false);
    const n = await hashearNueva(wp, NUEVA);
    expect(n.formato).toBe('phpass');
    expect(n.hash.startsWith('$P$9')).toBe(true);
    expect(n.hash).not.toBe(wp);
    expect(await coincide(n.hash, NUEVA)).toBe(true);
    // Un costo de 2^20 vueltas no se acepta.
    expect(formatoDe('$P$' + 'I' + wp.slice(4))).toBe('desconocido');
  });

  it.skipIf(!tieneArgon2)('argon2: coincide y se reproduce con los mismos parámetros', async () => {
    const f = (
      crypto as unknown as {
        argon2: (
          a: string,
          p: Record<string, unknown>,
          cb: (e: Error | null, k: Buffer) => void,
        ) => void;
      }
    ).argon2;
    const sal = Buffer.from('0123456789abcdef');
    const k = await new Promise<Buffer>((ok, mal) =>
      f(
        'argon2id',
        {
          message: Buffer.from('hunter2'),
          nonce: sal,
          parallelism: 1,
          tagLength: 32,
          memory: 64,
          passes: 2,
        },
        (e, r) => (e ? mal(e) : ok(r)),
      ),
    );
    const b64 = (b: Buffer): string => b.toString('base64').replace(/=+$/, '');
    const phc = `$argon2id$v=19$m=64,t=2,p=1$${b64(sal)}$${b64(k)}`;
    expect(formatoDe(phc)).toBe('argon2');
    expect(await coincide(phc, 'hunter2')).toBe(true);
    expect(await coincide(phc, 'otra')).toBe(false);
    const nuevo = await hashearNueva(phc, NUEVA);
    expect(nuevo.formato).toBe('argon2');
    expect(nuevo.hash).toContain('m=64,t=2,p=1');
    expect(await coincide(nuevo.hash, NUEVA)).toBe(true);
  });
});

describe('hashes: hashearNueva (mismo formato y costo)', () => {
  it('bcrypt: mismo costo y mismo prefijo', async () => {
    const viejo = (await bc('a', 5)).replace('$2b$', '$2y$');
    const n = await hashearNueva(viejo, NUEVA);
    expect(n.formato).toBe('bcrypt');
    expect(n.cambiaFormato).toBe(false);
    expect(n.hash.startsWith('$2y$05$')).toBe(true);
    expect(await coincide(n.hash, NUEVA)).toBe(true);
  });

  it('PBKDF2 de Django: mismas iteraciones y digest, sal nueva de 22 caracteres', async () => {
    const viejo = django('a', 1234);
    const n = await hashearNueva(viejo, NUEVA);
    expect(n.hash.startsWith('pbkdf2_sha256$1234$')).toBe(true);
    const sal = n.hash.split('$')[2]!;
    expect(sal).toMatch(/^[A-Za-z0-9]{22}$/);
    expect(await coincide(n.hash, NUEVA)).toBe(true);
  });

  it('md5 y sha1 conservan su formato por omisión (y las mayúsculas del hex)', async () => {
    const a = await hashearNueva(md5('a'), NUEVA);
    expect(a).toMatchObject({ formato: 'md5', cambiaFormato: false, hash: md5(NUEVA) });
    const b = await hashearNueva(sha1('a').toUpperCase(), NUEVA);
    expect(b.hash).toBe(sha1(NUEVA).toUpperCase());
  });

  it('md5 pasa a bcrypt solo si se pide', async () => {
    const a = await hashearNueva(md5('a'), NUEVA, { aBcrypt: true });
    expect(a).toMatchObject({ formato: 'bcrypt', cambiaFormato: true });
    expect(await coincide(a.hash, NUEVA)).toBe(true);
  });

  it('formato desconocido o clave de más de 72 bytes: error con código', async () => {
    expect(await codigo(hashearNueva('desconocido', NUEVA))).toBe('auditoria.formato_no_soportado');
    expect(await codigo(hashearNueva(await bc('a'), 'x'.repeat(73)))).toBe('auditoria.clave_larga');
  });
});

describe('barajar (I2) y la lista de contraseñas comunes', () => {
  it('tiene 200 entradas distintas', () => {
    expect(CONTRASENAS_COMUNES).toHaveLength(200);
    expect(new Set(CONTRASENAS_COMUNES).size).toBe(200);
  });

  it('barajar conserva los elementos y el orden no es fijo', () => {
    const a = barajar(CONTRASENAS_COMUNES);
    const b = barajar(CONTRASENAS_COMUNES);
    expect([...a].sort()).toEqual([...CONTRASENAS_COMUNES].sort());
    expect(a).not.toEqual(b);
    expect(a).not.toEqual([...CONTRASENAS_COMUNES]);
  });

  it('auditar entrega a cada hash una lista mezclada distinta', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const vistas: (readonly string[])[] = [];
    const dep: DepsAuditar = {
      abrir: async () => f.consulta,
      coincide: async (_h, claves) => {
        vistas.push(claves);
        return false;
      },
    };
    await auditar(dep, OPC);
    expect(vistas.length).toBeGreaterThan(2);
    expect(vistas.every((v) => v.length === 200)).toBe(true);
    expect(new Set(vistas.map((v) => v.join('|'))).size).toBe(vistas.length);
  });
});

describe('poolBcrypt (hilos de trabajo)', () => {
  it('compara fuera del hilo principal y solo devuelve sí o no', async () => {
    const pool = await crearPool(2);
    expect(pool).not.toBeNull();
    try {
      const h = await bc('letmein');
      expect(await pool!.comparar(h, ['uno', 'letmein', 'tres'])).toBe(true);
      expect(await pool!.comparar(h, ['uno', 'dos'])).toBe(false);
      const todos = await Promise.all(
        Array.from({ length: 6 }, (_v, i) => pool!.comparar(h, i % 2 ? ['letmein'] : ['no'])),
      );
      expect(todos).toEqual([false, true, false, true, false, true]);
    } finally {
      await pool!.cerrar();
    }
  });

  it('cerrar rechaza lo pendiente y lo nuevo', async () => {
    const pool = (await crearPool(1))!;
    const h = await bc('x', 10);
    const pendiente = codigo(pool.comparar(h, CONTRASENAS_COMUNES));
    await pool.cerrar();
    expect(await pendiente).toBe('auditoria.cancelada');
    expect(await codigo(pool.comparar(h, ['x']))).toBe('auditoria.cancelada');
  });

  it('coincideAlguna usa el pool para bcrypt', async () => {
    const pool = (await crearPool(1))!;
    try {
      const h = await bc('letmein');
      expect(await coincideAlguna(h, ['a', 'letmein'], { pool })).toBe(true);
      expect(await coincideAlguna(h, ['a', 'b'], { pool })).toBe(false);
    } finally {
      await pool.cerrar();
    }
  });
});

describe('tipoNoRevisable', () => {
  it('nombra el tipo sin devolver el hash', () => {
    expect(tipoNoRevisable(null)).toBe('vacio');
    expect(tipoNoRevisable('')).toBe('vacio');
    expect(tipoNoRevisable('$1$abc$def')).toBe('md5crypt');
    expect(tipoNoRevisable('$6$abc$def')).toBe('sha512crypt');
    expect(tipoNoRevisable('{SHA}abc')).toBe('ldap');
    expect(tipoNoRevisable('cualquier cosa')).toBe('otro');
  });
});

// ---------------------------------------------------------------------------------------------
// Base falsa (en memoria) para auditar y restablecer
// ---------------------------------------------------------------------------------------------

interface TablaFalsa {
  columnas: string[];
  filas: Record<string, unknown>[];
  largos?: Record<string, number>;
  pk?: string[];
}

interface Falsa {
  consulta: ConsultaSql;
  /** SQL recibido (con sus parámetros), en orden. */
  sql: { sql: string; params: unknown[] }[];
  tablas: Map<string, TablaFalsa>;
  cerrada: boolean;
  /** Filas que dice haber bloqueado el `SELECT … FOR UPDATE` (carrera simulada). */
  bloqueo: number | null;
  /** El UPDATE no cambia nada (el servidor recortó o ignoró el valor). */
  ignoraUpdate: boolean;
  /** La tabla tiene seguridad por filas activa (PostgreSQL). */
  rls: boolean;
  /** Cambia el hash de la fila justo antes del bloqueo (otro proceso escribió). */
  cambiaAntes: (() => void) | null;
}

function baseFalsa(motor: ConsultaSql['motor'], tablas: Record<string, TablaFalsa>): Falsa {
  const f: Falsa = {
    consulta: undefined as unknown as ConsultaSql,
    sql: [],
    tablas: new Map(Object.entries(tablas)),
    cerrada: false,
    bloqueo: null,
    ignoraUpdate: false,
    rls: false,
    cambiaAntes: null,
  };
  const citado = (s: string): string => s.replace(/[`"]/g, '');
  f.consulta = {
    motor,
    async consultar(sql, params = []) {
      f.sql.push({ sql, params });
      if (sql.includes('pg_catalog.pg_class')) return [{ rls: f.rls }];
      if (sql.includes('information_schema.schemata')) {
        return params[0] === 'public' || params[0] === 'ventas' ? [{ s: params[0] }] : [];
      }
      if (sql.includes('information_schema.tables')) {
        const t = f.tablas.has(String(params[1])) ? String(params[1]) : null;
        return t ? [{ t }] : [];
      }
      if (sql.includes('information_schema.columns')) {
        const t = f.tablas.get(String(params[1]));
        return (t?.columnas ?? []).map((c) => ({ c, l: t?.largos?.[c] ?? null }));
      }
      if (sql.includes('key_column_usage')) {
        return (f.tablas.get(String(params[1]))?.pk ?? []).map((c) => ({ c }));
      }
      const tabla = (): TablaFalsa => {
        const m = /FROM (\S+)\.(\S+)/.exec(sql)!;
        return f.tablas.get(citado(m[2]!))!;
      };
      const col = (): string => citado(/WHERE (\S+)/.exec(sql)![1]!);
      if (/^SELECT .* AS u, .* AS h FROM/.test(sql)) {
        const m = /SELECT (\S+) AS u, (\S+) AS h/.exec(sql)!;
        const n = Number(/LIMIT (\d+)/.exec(sql)![1]);
        return tabla()
          .filas.slice(0, n)
          .map((r) => ({ u: r[citado(m[1]!)], h: r[citado(m[2]!)] }));
      }
      if (sql.startsWith('SELECT * FROM')) {
        return tabla()
          .filas.filter((r) => r[col()] === params[0])
          .slice(0, 2);
      }
      if (/^SELECT \S+ AS h FROM/.test(sql)) {
        const ch = citado(/^SELECT (\S+) AS h/.exec(sql)![1]!);
        if (sql.includes('FOR UPDATE')) f.cambiaAntes?.();
        const filas = tabla().filas.filter((r) => r[col()] === params[0]);
        const n = sql.includes('FOR UPDATE') && f.bloqueo !== null ? f.bloqueo : filas.length;
        return Array.from({ length: Math.min(n, 3) }, (_v, i) => ({ h: filas[i]?.[ch] ?? 'x' }));
      }
      if (sql.startsWith('UPDATE')) {
        const m = /UPDATE \S+\.(\S+) SET (\S+) = \S+ WHERE (\S+)/.exec(sql)!;
        const t = f.tablas.get(citado(m[1]!))!;
        const fila = t.filas.find(
          (r) => r[citado(m[3]!)] === params[1] && r[citado(m[2]!)] === params[2],
        );
        if (fila && !f.ignoraUpdate) fila[citado(m[2]!)] = params[0];
        return motor === 'postgresql' && fila ? [{ n: 1 }] : [];
      }
      return [];
    },
    async cerrar() {
      f.cerrada = true;
    },
  };
  return f;
}

let dir: string;
let rutas: Rutas;

beforeEach(async () => {
  dir = await carpetaTemporal('pel-auditoria-');
  rutas = new Rutas(dir);
});

/** Ordena lo que pasa: instantánea, copia y escritura, para comprobar el orden. */
function montar(
  f: Falsa,
  extra: {
    tomarFalla?: boolean;
    reales?: boolean | 'error';
    restringir?: (r: string) => Promise<boolean>;
    reloj?: () => Date;
  } = {},
) {
  const orden: string[] = [];
  const original = f.consulta.consultar;
  f.consulta.consultar = async (sql, params) => {
    if (sql.startsWith('UPDATE')) {
      orden.push(`update:copia=${existsSync(rutas.respaldosAuditoria()) ? 'si' : 'no'}`);
    }
    return original(sql, params);
  };
  const abiertas: string[] = [];
  const deps = {
    rutas,
    abrir: async (_i: unknown, _b: string, modo: string) => {
      abiertas.push(modo);
      f.cerrada = false;
      return f.consulta;
    },
    instantaneas: {
      tomar: async (_i: unknown, base: string) => {
        orden.push(`instantanea:${base}`);
        if (extra.tomarFalla) throw new Error('mysqldump falló');
        return { id: '20261125-103000-abcdef' };
      },
    },
    cerrojo: new CerrojoBases(),
    esDatosReales: async () => {
      if (extra.reales === 'error') throw new Error('no se pudo leer');
      return extra.reales === true;
    },
    ...(extra.restringir ? { restringir: extra.restringir } : {}),
    reloj: extra.reloj ?? (() => new Date('2026-11-25T10:30:00Z')),
  };
  return { deps, orden, abiertas, svc: new AuditoriaClaves(deps) };
}

const OPC = {
  instancia: 'mysql' as const,
  base: 'tienda',
  tabla: 'usuarios',
  columnaUsuario: 'email',
  columnaHash: 'clave',
};

async function tablaUsuarios(): Promise<Record<string, TablaFalsa>> {
  return {
    usuarios: {
      columnas: ['id', 'email', 'clave'],
      pk: ['id'],
      filas: [
        { id: 1, email: 'ana@x.test', clave: await bc('password') },
        { id: 2, email: 'luis@x.test', clave: md5('Zq9!vN2#rT7@kL4$') },
        { id: 3, email: 'marta@x.test', clave: await bc('Zq9!vN2#rT7@kL4$') },
        { id: 4, email: 'pepe@x.test', clave: sha1('qwerty') },
        { id: 5, email: 'vacio@x.test', clave: null },
        { id: 6, email: 'raro@x.test', clave: 'no-es-un-hash' },
        { id: 7, email: 'dani@x.test', clave: django('letmein') },
      ],
    },
  };
}

describe('auditar', () => {
  it('marca comun y formato_debil, y deja pasar la cuenta fuerte', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const r = await svc.auditar(OPC);
    expect(r.debiles).toEqual([
      { usuario: 'ana@x.test', motivo: 'comun' },
      { usuario: 'luis@x.test', motivo: 'formato_debil' },
      { usuario: 'pepe@x.test', motivo: 'comun' },
      { usuario: 'dani@x.test', motivo: 'comun' },
    ]);
    expect(r.revisadas).toBe(5);
    expect(r.noRevisables).toBe(2);
    expect(r.tiposNoRevisables).toEqual(
      expect.arrayContaining([
        { tipo: 'vacio', cantidad: 1 },
        { tipo: 'otro', cantidad: 1 },
      ]),
    );
    expect(r.truncado).toBe(false);
    expect(f.cerrada).toBe(true);
  });

  it('el resultado no contiene ninguna de las 200 contraseñas ni dice cuál coincidió', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const r = await svc.auditar(OPC);
    for (const d of r.debiles) expect(Object.keys(d).sort()).toEqual(['motivo', 'usuario']);
    expect(Object.keys(r).sort()).toEqual([
      'debiles',
      'noRevisables',
      'revisadas',
      'rlsActiva',
      'tiposNoRevisables',
      'truncado',
    ]);
    const json = JSON.stringify(r);
    for (const c of CONTRASENAS_COMUNES) expect(json).not.toContain(`"${c}"`);
    expect(json).not.toContain('password');
    expect(json).not.toContain('letmein');
    expect(json).not.toContain('qwerty');
  });

  it('no escribe nada en los registros', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const espias = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => undefined),
    );
    await svc.auditar(OPC);
    for (const e of espias) expect(e).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('solo hace SELECT: lectura, sin transacciones ni escrituras', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, abiertas } = montar(f);
    await svc.auditar(OPC);
    expect(abiertas).toEqual(['lectura']);
    for (const q of f.sql) expect(q.sql.startsWith('SELECT')).toBe(true);
  });

  it('tabla o columna inexistente: error con código y sin leer las filas', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    expect(await codigo(svc.auditar({ ...OPC, tabla: 'nada' }))).toBe('auditoria.tabla_invalida');
    expect(await codigo(svc.auditar({ ...OPC, columnaHash: 'nada' }))).toBe(
      'auditoria.columna_invalida',
    );
    expect(await codigo(svc.auditar({ ...OPC, columnaUsuario: 'clave' }))).toBe(
      'auditoria.columna_invalida',
    );
    expect(f.sql.some((q) => / AS u, /.test(q.sql))).toBe(false);
    expect(f.cerrada).toBe(true);
  });

  it('inyección: un nombre con SQL no llega nunca al texto de la consulta', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const malo = 'usuarios`; DROP TABLE usuarios; -- ';
    expect(await codigo(svc.auditar({ ...OPC, tabla: malo }))).toBe('auditoria.tabla_invalida');
    expect(await codigo(svc.auditar({ ...OPC, columnaHash: `clave\` FROM x; --` }))).toBe(
      'auditoria.columna_invalida',
    );
    expect(await codigo(svc.auditar({ ...OPC, tabla: 'a\u0000b' }))).toBe(
      'auditoria.tabla_invalida',
    );
    expect(await codigo(svc.auditar({ ...OPC, tabla: 'x'.repeat(500) }))).toBe(
      'auditoria.tabla_invalida',
    );
    for (const q of f.sql) {
      expect(q.sql).not.toContain('DROP');
      expect(q.sql).not.toContain('--');
    }
  });

  it('rechaza las bases del sistema sin abrir ninguna conexión', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, abiertas } = montar(f);
    for (const base of ['mysql', 'sys', 'performance_schema', 'information_schema', 'MySQL']) {
      expect(await codigo(svc.auditar({ ...OPC, base }))).toBe('auditoria.base_sistema');
      expect(
        await codigo(
          svc.restablecer({ ...OPC, base, usuario: 'a', claveNueva: NUEVA, confirmado: true }),
        ),
      ).toBe('auditoria.base_sistema');
    }
    expect(
      await codigo(svc.auditar({ ...OPC, instancia: 'postgresql' as never, base: 'postgres' })),
    ).toBe('auditoria.base_sistema');
    expect(abiertas).toEqual([]);
  });

  it('PostgreSQL (I1): identificadores calificados, operador y tipo del catálogo', async () => {
    const f = baseFalsa('postgresql', await tablaUsuarios());
    const { svc } = montar(f);
    await svc.auditar({ ...OPC, instancia: 'postgresql' as never });
    const lectura = f.sql.find((q) => / AS u, /.test(q.sql))!;
    expect(lectura.sql).toContain('"public"."usuarios"');
    expect(lectura.sql).toContain('"email" AS u');
    const cat = f.sql.find((q) => q.sql.includes('information_schema.tables'))!;
    expect(cat.sql).toContain('$1::pg_catalog.text');
    expect(cat.sql).toContain('OPERATOR(pg_catalog.=)');
    expect(cat.params).toEqual(['public', 'usuarios']);
    // Ninguna comparación con `=` desnudo en las consultas al catálogo ni a la tabla.
    for (const q of f.sql.filter((x) => x.sql.includes(' WHERE '))) {
      expect(q.sql.replace(/OPERATOR\(pg_catalog\.=\)/g, '')).not.toMatch(/\s=\s/);
    }
  });

  it('PostgreSQL: esquema elegido, validado contra el catálogo', async () => {
    const tablas = await tablaUsuarios();
    const f = baseFalsa('postgresql', tablas);
    const { svc } = montar(f);
    await svc.auditar({ ...OPC, instancia: 'postgresql' as never, esquema: 'ventas' });
    expect(f.sql.find((q) => / AS u, /.test(q.sql))!.sql).toContain('"ventas"."usuarios"');
    for (const esquema of ['pg_catalog', 'information_schema', 'no_existe', '']) {
      expect(await codigo(svc.auditar({ ...OPC, instancia: 'postgresql' as never, esquema }))).toBe(
        'auditoria.esquema_invalido',
      );
    }
  });

  it('tope de filas: marca truncado y revisa solo hasta el tope', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const dep: DepsAuditar = { abrir: async () => f.consulta, maxFilas: 2 };
    const r = await auditar(dep, OPC);
    expect(r.truncado).toBe(true);
    expect(r.revisadas + r.noRevisables).toBeLessThanOrEqual(2);
    const lectura = f.sql.find((q) => / AS u, /.test(q.sql))!;
    expect(lectura.sql).toContain('LIMIT 3');
  });

  it('tope de tiempo: corta y marca truncado sin contar la cuenta a medias', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    let t = 0;
    const dep: DepsAuditar = {
      abrir: async () => f.consulta,
      plazoMs: 100,
      ahora: () => t,
      coincide: async () => {
        t += 40;
        return false;
      },
    };
    const r = await auditar(dep, OPC);
    expect(r.truncado).toBe(true);
    expect(r.revisadas).toBeLessThan(5);
  });

  it('revisa primero los formatos baratos y avisa del avance', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const formatos: string[] = [];
    const avances: { revisadas: number; total: number }[] = [];
    const dep: DepsAuditar = {
      abrir: async () => f.consulta,
      coincide: async (hash) => {
        formatos.push(formatoDe(hash));
        return false;
      },
    };
    await auditar(dep, OPC, undefined, (p) => avances.push(p));
    expect(formatos.indexOf('bcrypt')).toBeGreaterThan(formatos.indexOf('md5'));
    expect(formatos.indexOf('bcrypt')).toBeGreaterThan(formatos.indexOf('django-pbkdf2'));
    expect(avances[0]).toEqual({ revisadas: 0, total: 5 });
    expect(avances.at(-1)).toEqual({ revisadas: 5, total: 5 });
  });

  it('se puede cancelar', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const c = new AbortController();
    c.abort();
    expect(await codigo(svc.auditar(OPC, c.signal))).toBe('auditoria.cancelada');
    expect(f.cerrada).toBe(true);
  });

  it('una sola auditoría a la vez; progreso y cancelar llegan a la que corre', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    let soltar!: () => void;
    const espera = new Promise<void>((ok) => (soltar = ok));
    const { deps } = montar(f);
    const svc = new AuditoriaClaves({
      ...deps,
      coincide: async () => {
        await espera;
        return false;
      },
    });
    expect(svc.progreso()).toBeNull();
    expect(svc.cancelar()).toBe(false);
    const primera = svc.auditar(OPC);
    primera.catch(() => undefined);
    await vi.waitFor(() => expect(svc.progreso()?.total).toBe(5));
    expect(await codigo(svc.auditar(OPC))).toBe('auditoria.en_curso');
    expect(svc.cancelar()).toBe(true);
    soltar();
    expect(await codigo(primera)).toBe('auditoria.cancelada');
    expect(svc.progreso()).toBeNull();
    // Libre otra vez.
    const r = await new AuditoriaClaves({ ...deps, coincide: async () => false }).auditar(OPC);
    expect(r.revisadas).toBe(5);
  });
});

describe('restablecer', () => {
  const U = { ...OPC, usuario: 'ana@x.test' };

  it('instantánea, copia de la fila y luego escritura (en ese orden), con el mismo costo', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const antes = String(f.tablas.get('usuarios')!.filas[0]!['clave']);
    const { svc, orden, abiertas } = montar(f);
    const r = await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });

    expect(orden).toEqual(['instantanea:tienda', 'update:copia=si']);
    expect(abiertas).toEqual(['lectura', 'escritura']);
    expect(r.instantanea).toBe('20261125-103000-abcdef');
    expect(r.copiaFila.startsWith(rutas.respaldosAuditoria())).toBe(true);

    const nuevo = String(f.tablas.get('usuarios')!.filas[0]!['clave']);
    expect(nuevo).not.toBe(antes);
    expect(nuevo.startsWith('$2b$04$')).toBe(true);
    expect(await coincide(nuevo, NUEVA)).toBe(true);
    expect(f.cerrada).toBe(true);
  });

  it('la copia guarda solo la clave primaria, el usuario y el hash anterior', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    f.tablas.get('usuarios')!.filas[0]!['otro'] = 'dato-que-no-debe-copiarse';
    f.tablas.get('usuarios')!.columnas.push('otro');
    const antes = String(f.tablas.get('usuarios')!.filas[0]!['clave']);
    const { svc } = montar(f);
    const r = await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    const copia = JSON.parse(readFileSync(r.copiaFila, 'utf8')) as Record<string, unknown>;
    expect(copia).toMatchObject({
      usuario: 'ana@x.test',
      pk: { id: 1 },
      hashAnterior: antes,
      tabla: 'usuarios',
    });
    expect(Object.keys(copia)).not.toContain('fila');
    expect(JSON.stringify(copia)).not.toContain('dato-que-no-debe-copiarse');
  });

  it('retención: se borran las copias de más de 30 días y se conservan las recientes', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const carpeta = rutas.respaldosAuditoria();
    mkdirSync(carpeta, { recursive: true });
    writeFileSync(path.join(carpeta, '20261001-100000-aaaaaa.json'), '{}');
    writeFileSync(path.join(carpeta, '20261120-100000-bbbbbb.json'), '{}');
    writeFileSync(path.join(carpeta, 'otro-archivo.txt'), 'x');
    utimesSync(path.join(carpeta, 'otro-archivo.txt'), new Date(2020, 0, 1), new Date(2020, 0, 1));
    const { svc } = montar(f);
    await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    const nombres = readdirSync(carpeta);
    expect(nombres).not.toContain('20261001-100000-aaaaaa.json');
    expect(nombres).toContain('20261120-100000-bbbbbb.json');
    expect(nombres).toContain('otro-archivo.txt');
    expect(nombres).toHaveLength(3);
  });

  it('si no se puede limitar la copia al usuario, lo avisa', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f, { restringir: async () => false });
    expect(
      (await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true })).copiaRestringida,
    ).toBe(false);
    const g = baseFalsa('mysql', await tablaUsuarios());
    const { svc: s2 } = montar(g, { restringir: async () => true });
    expect(
      (await s2.restablecer({ ...U, claveNueva: NUEVA, confirmado: true })).copiaRestringida,
    ).toBe(true);
  });

  it('la clave nueva no aparece en el SQL, el resultado, la copia ni los registros', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const espias = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => undefined),
    );
    const r = await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    for (const e of espias) expect(e).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    for (const q of f.sql) {
      expect(q.sql).not.toContain(NUEVA);
      expect(q.params).not.toContain(NUEVA);
    }
    expect(JSON.stringify(r)).not.toContain(NUEVA);
    expect(readFileSync(r.copiaFila, 'utf8')).not.toContain(NUEVA);
  });

  it('solo escribe con un UPDATE parametrizado de una fila, condicionado al hash copiado', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const antes = String(f.tablas.get('usuarios')!.filas[0]!['clave']);
    const { svc } = montar(f);
    await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    const upd = f.sql.filter((q) => q.sql.startsWith('UPDATE'));
    expect(upd).toHaveLength(1);
    expect(upd[0]!.sql).toBe(
      'UPDATE `tienda`.`usuarios` SET `clave` = ? WHERE `email` = ? AND `clave` = ? LIMIT 1',
    );
    expect(upd[0]!.params[1]).toBe('ana@x.test');
    expect(upd[0]!.params[2]).toBe(antes);
    const ordenes = f.sql.map((q) => q.sql.split(' ')[0]);
    expect(ordenes).toContain('START');
    expect(ordenes.at(-1)).toBe('COMMIT');
    // Relee lo escrito antes de confirmar.
    const iUpd = f.sql.findIndex((q) => q.sql.startsWith('UPDATE'));
    expect(f.sql[iUpd + 1]!.sql).toMatch(/^SELECT .* AS h FROM .* LIMIT 2$/);
  });

  it('si el servidor no guardó lo esperado, ROLLBACK y error', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    f.ignoraUpdate = true;
    const { svc } = montar(f);
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.verificacion_fallo',
    );
    expect(f.sql.some((q) => q.sql === 'ROLLBACK')).toBe(true);
    expect(f.sql.some((q) => q.sql === 'COMMIT')).toBe(false);
  });

  it('si el hash cambió entre la lectura y el bloqueo, no escribe', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    f.cambiaAntes = () => {
      f.tablas.get('usuarios')!.filas[0]!['clave'] = md5('otro-proceso');
    };
    const { svc } = montar(f);
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.fila_cambio',
    );
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
    expect(f.sql.some((q) => q.sql === 'ROLLBACK')).toBe(true);
  });

  it('columna del hash demasiado corta (I6): error antes de la instantánea', async () => {
    const tablas = await tablaUsuarios();
    tablas.usuarios!.largos = { clave: 40 };
    const f = baseFalsa('mysql', tablas);
    const { svc, orden } = montar(f);
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.columna_corta',
    );
    expect(orden).toEqual([]);
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
    expect(existsSync(rutas.respaldosAuditoria())).toBe(false);
  });

  it('una columna que sí cabe no estorba', async () => {
    const tablas = await tablaUsuarios();
    tablas.usuarios!.largos = { clave: 60 };
    const f = baseFalsa('mysql', tablas);
    const { svc } = montar(f);
    await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
  });

  it('sin confirmado no hace nada', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden, abiertas } = montar(f);
    for (const confirmado of [false, undefined, 'si', 1]) {
      expect(
        await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: confirmado as never })),
      ).toBe('auditoria.sin_confirmar');
    }
    expect(orden).toEqual([]);
    expect(abiertas).toEqual([]);
    expect(f.sql).toEqual([]);
  });

  describe('datos reales (confirmación reforzada)', () => {
    it('sin la confirmación reforzada, el núcleo rechaza aunque lleve confirmado', async () => {
      const f = baseFalsa('mysql', await tablaUsuarios());
      const { svc, orden, abiertas } = montar(f, { reales: true });
      for (const reforzada of [undefined, false, 'si' as never, 1 as never]) {
        expect(
          await codigo(
            svc.restablecer({
              ...U,
              claveNueva: NUEVA,
              confirmado: true,
              confirmarDatosReales: reforzada,
            }),
          ),
        ).toBe('auditoria.datos_reales_sin_confirmar');
      }
      expect(orden).toEqual([]);
      expect(abiertas).toEqual([]);
      expect(f.sql).toEqual([]);
    });

    it('con la confirmación reforzada, procede', async () => {
      const f = baseFalsa('mysql', await tablaUsuarios());
      const { svc, orden } = montar(f, { reales: true });
      await svc.restablecer({
        ...U,
        claveNueva: NUEVA,
        confirmado: true,
        confirmarDatosReales: true,
      });
      expect(orden).toEqual(['instantanea:tienda', 'update:copia=si']);
    });

    it('si no se puede saber, se pide la confirmación (ante la duda, reforzada)', async () => {
      const f = baseFalsa('mysql', await tablaUsuarios());
      const { svc } = montar(f, { reales: 'error' });
      expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
        'auditoria.datos_reales_sin_confirmar',
      );
    });

    it('una base sin datos reales no pide más, y la vista previa lo indica', async () => {
      const f = baseFalsa('mysql', await tablaUsuarios());
      const { svc } = montar(f, { reales: false });
      expect((await svc.vistaPreviaRestablecer(U)).datosReales).toBe(false);
      const g = baseFalsa('mysql', await tablaUsuarios());
      const { svc: s2 } = montar(g, { reales: true });
      expect((await s2.vistaPreviaRestablecer(U)).datosReales).toBe(true);
    });

    it('baseDeDatosReales: compara el nombre de la base del sitio y la familia del motor', async () => {
      const sitios = [
        { carpeta: '/a', datosReales: true },
        { carpeta: '/b', datosReales: false },
        { carpeta: '/c', datosReales: true },
      ];
      const bases: Record<string, { base: string; motor: string } | null> = {
        '/a': { base: 'diamantes', motor: 'mysql' },
        '/b': { base: 'pruebas', motor: 'mysql' },
        '/c': { base: 'dollar', motor: 'postgresql' },
      };
      const d = { sitios: async () => sitios, baseDe: async (c: string) => bases[c] ?? null };
      expect(await baseDeDatosReales(d, 'mysql', 'Diamantes')).toBe(true);
      expect(await baseDeDatosReales(d, 'mariadb@11.4', 'diamantes')).toBe(true);
      expect(await baseDeDatosReales(d, 'postgresql', 'diamantes')).toBe(false);
      expect(await baseDeDatosReales(d, 'postgresql', 'dollar')).toBe(true);
      expect(await baseDeDatosReales(d, 'mysql', 'pruebas')).toBe(false);
      expect(await baseDeDatosReales(d, 'mysql', 'otra')).toBe(false);
      // Un sitio con datos reales cuyo .env no se puede leer: ante la duda, sí.
      const roto = {
        sitios: async () => sitios,
        baseDe: async () => {
          throw new Error('x');
        },
      };
      expect(await baseDeDatosReales(roto, 'mysql', 'otra')).toBe(true);
    });
  });

  it('usuario repetido (dos filas): no toma instantánea ni escribe', async () => {
    const tablas = await tablaUsuarios();
    tablas.usuarios!.filas.push({ id: 99, email: 'ana@x.test', clave: md5('otra') });
    const f = baseFalsa('mysql', tablas);
    const { svc, orden } = montar(f);
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.usuario_repetido',
    );
    expect(orden).toEqual([]);
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
  });

  it('usuario inexistente o inválido: error y sin escribir', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden } = montar(f);
    expect(
      await codigo(
        svc.restablecer({ ...U, usuario: 'nadie@x.test', claveNueva: NUEVA, confirmado: true }),
      ),
    ).toBe('auditoria.usuario_no_encontrado');
    expect(
      await codigo(
        svc.restablecer({ ...U, usuario: 'x'.repeat(300), claveNueva: NUEVA, confirmado: true }),
      ),
    ).toBe('auditoria.usuario_invalido');
    expect(orden).toEqual([]);
  });

  it('una carrera (aparece otra fila entre la lectura y la escritura): ROLLBACK y sin UPDATE', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    f.bloqueo = 2;
    const { svc } = montar(f);
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.usuario_repetido',
    );
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
    expect(f.sql.some((q) => q.sql === 'ROLLBACK')).toBe(true);
    expect(f.sql.some((q) => q.sql === 'COMMIT')).toBe(false);
  });

  it('si la instantánea falla, no copia ni escribe', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f, { tomarFalla: true });
    expect(await codigo(svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true }))).toBe(
      'auditoria.respaldo_previo_fallo',
    );
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
    expect(existsSync(rutas.respaldosAuditoria())).toBe(false);
  });

  it('hash de formato desconocido o clave inválida: error antes de la instantánea', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden } = montar(f);
    expect(
      await codigo(
        svc.restablecer({ ...U, usuario: 'raro@x.test', claveNueva: NUEVA, confirmado: true }),
      ),
    ).toBe('auditoria.formato_no_soportado');
    expect(await codigo(svc.restablecer({ ...U, claveNueva: '', confirmado: true }))).toBe(
      'auditoria.clave_invalida',
    );
    expect(
      await codigo(svc.restablecer({ ...U, claveNueva: 'x'.repeat(2000), confirmado: true })),
    ).toBe('auditoria.clave_invalida');
    expect(orden).toEqual([]);
  });

  it('md5 conserva su formato por omisión; pasar a bcrypt es explícito', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const luis = { ...U, usuario: 'luis@x.test' };
    const prev = await svc.vistaPreviaRestablecer(luis);
    expect(prev).toMatchObject({ formato: 'md5', formatoNuevo: 'md5', cambiaFormato: false });
    const prevB = await svc.vistaPreviaRestablecer(luis, true);
    expect(prevB).toMatchObject({ formatoNuevo: 'bcrypt', cambiaFormato: true });
    await svc.restablecer({ ...luis, claveNueva: NUEVA, confirmado: true });
    expect(f.tablas.get('usuarios')!.filas[1]!['clave']).toBe(md5(NUEVA));
    await svc.restablecer({ ...luis, claveNueva: NUEVA, confirmado: true, aBcrypt: true });
    expect(String(f.tablas.get('usuarios')!.filas[1]!['clave']).startsWith('$2b$10$')).toBe(true);
  });

  it('vista previa: sentencia con ? y sin valores, y no escribe', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden, abiertas } = montar(f);
    const v = await svc.vistaPreviaRestablecer(U);
    expect(v.sentencia).toBe(
      'UPDATE `tienda`.`usuarios` SET `clave` = ? WHERE `email` = ? AND `clave` = ?',
    );
    expect(v.formato).toBe('bcrypt');
    expect(v.cambiaFormato).toBe(false);
    expect(JSON.stringify(v)).not.toContain('$2b$');
    expect(orden).toEqual([]);
    expect(abiertas).toEqual(['lectura']);
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
  });

  it('PostgreSQL: RETURNING para contar la fila, $n y operadores calificados', async () => {
    const f = baseFalsa('postgresql', await tablaUsuarios());
    const { svc } = montar(f);
    await svc.restablecer({
      ...U,
      instancia: 'postgresql' as never,
      claveNueva: NUEVA,
      confirmado: true,
    });
    const upd = f.sql.find((q) => q.sql.startsWith('UPDATE'))!;
    expect(upd.sql).toBe(
      'UPDATE "public"."usuarios" SET "clave" = $1 WHERE "email" OPERATOR(pg_catalog.=) $2 ' +
        'AND "clave" OPERATOR(pg_catalog.=) $3 RETURNING 1 AS n',
    );
    expect(f.sql.some((q) => q.sql === 'BEGIN')).toBe(true);
  });

  it('la copia queda en respaldos/auditoria con un nombre con fecha', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const r = await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    const archivos = readdirSync(rutas.respaldosAuditoria());
    expect(archivos).toHaveLength(1);
    expect(archivos[0]).toMatch(/^20261125-103000-[0-9a-f]{6}\.json$/);
    expect(path.dirname(r.copiaFila)).toBe(rutas.respaldosAuditoria());
  });
});

// ---------------------------------------------------------------------------------------------
// BasesDeDatos.abrirConsulta: el usuario de menor poder que sea viable
// ---------------------------------------------------------------------------------------------

describe('BasesDeDatos.abrirConsulta', () => {
  const credenciales = { leer: async () => ({ usuario: 'root', clave: 'clave-root' }) };
  const servicios = {
    estados: async () =>
      [{ id: 'mysql', estado: 'encendido', puertos: [3306] }] as unknown as never,
  };

  it('MySQL: usuario temporal con solo SELECT (lectura) o SELECT y UPDATE (escritura) y lo borra', async () => {
    for (const [modo, permisos] of [
      ['lectura', 'SELECT'],
      ['escritura', 'SELECT, UPDATE'],
    ] as const) {
      const sql: { usuario: string; sql: string }[] = [];
      const bd = new BasesDeDatos({
        servicios,
        credenciales: credenciales as never,
        rutas,
        exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
        fabricas: {
          mysql: async (c) => ({
            async query(s: string) {
              sql.push({ usuario: c.usuario, sql: s });
              return [[]];
            },
            async end() {},
          }),
        },
      });
      const q = await bd.abrirConsulta('mysql', 'tienda', modo, 5000);
      await q.consultar('SELECT 1');
      await q.cerrar();
      const grant = sql.find((x) => x.sql.startsWith('GRANT'))!;
      expect(grant.sql).toContain(`GRANT ${permisos} ON`);
      expect(grant.sql).toContain('`tienda`.*');
      expect(grant.usuario).toBe('root');
      const consulta = sql.find((x) => x.sql === 'SELECT 1')!;
      expect(consulta.usuario).toMatch(/^wolf_tmp_/);
      expect(sql.some((x) => x.sql.startsWith('DROP USER'))).toBe(true);
      // I6: la sesión de escritura fuerza el modo estricto; la de lectura no necesita nada.
      expect(sql.some((x) => x.sql.includes('STRICT_ALL_TABLES'))).toBe(modo === 'escritura');
    }
  });

  describe('PostgreSQL: rol temporal limitado (C1)', () => {
    async function correr(modo: 'lectura' | 'escritura', cerrarAntes = false) {
      const log: { usuario: string; sql: string }[] = [];
      const bd = new BasesDeDatos({
        servicios: {
          estados: async () =>
            [{ id: 'postgresql', estado: 'encendido', puertos: [5432] }] as unknown as never,
        },
        credenciales: credenciales as never,
        rutas,
        exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
        fabricas: {
          postgres: async (c) => {
            expect(c.base).toBe('tienda');
            log.push({ usuario: c.usuario, sql: '<<conecta>>' });
            return {
              async query(s: string, p?: unknown[]) {
                log.push({ usuario: c.usuario, sql: s });
                if (s.includes('information_schema.schemata')) return { rows: [{ s: p?.[0] }] };
                if (s.includes('information_schema.tables')) return { rows: [{ t: 'usuarios' }] };
                if (s.includes('information_schema.columns')) {
                  return { rows: ['email', 'clave'].map((c2) => ({ c: c2, l: null })) };
                }
                return { rows: [] };
              },
              async end() {},
            };
          },
        },
      });
      const q = await bd.abrirConsulta('postgresql', 'tienda', modo, 5000);
      if (!cerrarAntes) {
        await new TablasSql(q, 'tienda').resolver('usuarios', 'email', 'clave');
        await q.consultar('SELECT 1 AS marca');
      }
      await q.cerrar();
      return log;
    }

    it('crea un rol sin privilegios, sin ser dueño de nada, y consulta con él', async () => {
      const log = await correr('escritura');
      const crear = log.find((x) => x.sql.startsWith('CREATE ROLE'))!;
      expect(crear.usuario).toBe('postgres');
      expect(crear.sql).toMatch(
        /"wolf_tmp_[0-9a-f]{16}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT/,
      );
      expect(crear.sql).toContain('NOREPLICATION NOBYPASSRLS');
      expect(crear.sql).toContain("PASSWORD 'SCRAM-SHA-256$");
      // Ni dueño de la base ni de la tabla, ni miembro de otros roles.
      for (const x of log) {
        expect(x.sql).not.toMatch(/OWNER|SUPERUSER(?<!NOSUPERUSER)|REASSIGN|GRANT "?pg_/);
        expect(x.sql).not.toMatch(/ALTER DATABASE/);
      }
      expect(crear.sql).not.toMatch(/(?<!NO)SUPERUSER/);
      const rol = /"(wolf_tmp_[0-9a-f]{16})"/.exec(crear.sql)![1]!;
      const concesiones = log.filter((x) => x.sql.startsWith('GRANT')).map((x) => x.sql);
      expect(concesiones).toEqual([
        `GRANT CONNECT ON DATABASE "tienda" TO "${rol}"`,
        `GRANT USAGE ON SCHEMA "public" TO "${rol}"`,
        `GRANT SELECT ON TABLE "public"."usuarios" TO "${rol}"`,
        `GRANT UPDATE ("clave") ON TABLE "public"."usuarios" TO "${rol}"`,
      ]);
      // Lo que consulta la tabla lo hace el rol, no el administrador.
      expect(log.find((x) => x.sql === 'SELECT 1 AS marca')!.usuario).toBe(rol);
    });

    it('solo lectura: sin UPDATE y con la sesión en solo lectura', async () => {
      const log = await correr('lectura');
      expect(log.some((x) => x.sql.startsWith('GRANT UPDATE'))).toBe(false);
      const rol = /"(wolf_tmp_[0-9a-f]{16})"/.exec(
        log.find((x) => x.sql.startsWith('CREATE ROLE'))!.sql,
      )![1]!;
      expect(
        log.some((x) => x.usuario === rol && x.sql === 'SET default_transaction_read_only = on'),
      ).toBe(true);
    });

    it('I1: cada conexión parte con search_path = pg_catalog, pg_temp', async () => {
      const log = await correr('escritura');
      const conexiones = log.filter((x) => x.sql === '<<conecta>>').length;
      const fijados = log.filter((x) => x.sql === 'SET search_path = pg_catalog, pg_temp').length;
      expect(conexiones).toBeGreaterThanOrEqual(3);
      expect(fijados).toBe(conexiones);
      // Y es lo primero que se ejecuta en cada una.
      for (let i = 0; i < log.length; i++) {
        if (log[i]!.sql === '<<conecta>>') {
          expect(log[i + 1]!.sql).toBe('SET search_path = pg_catalog, pg_temp');
        }
      }
    });

    it('al cerrar: REVOKE, luego DROP OWNED y DROP ROLE', async () => {
      const log = await correr('escritura');
      const sqls = log.map((x) => x.sql);
      const iRev = sqls.findIndex((s) => s.startsWith('REVOKE ALL ON TABLE'));
      const iOwned = sqls.findIndex((s) => s.startsWith('DROP OWNED BY'));
      const iRol = sqls.findIndex((s) => s.startsWith('DROP ROLE'));
      expect(iRev).toBeGreaterThan(sqls.findIndex((s) => s.startsWith('GRANT UPDATE')));
      expect(iOwned).toBeGreaterThan(iRev);
      expect(iRol).toBeGreaterThan(iOwned);
      expect(sqls.some((s) => s.startsWith('REVOKE ALL ON SCHEMA'))).toBe(true);
      expect(sqls.some((s) => s.startsWith('REVOKE ALL ON DATABASE'))).toBe(true);
      expect(log[iRol]!.usuario).toBe('postgres');
    });

    it('si no se llegó a validar la tabla, no se crea ningún rol', async () => {
      const log = await correr('lectura', true);
      expect(log.some((x) => x.sql.startsWith('CREATE ROLE'))).toBe(false);
    });
  });

  it('MongoDB no se audita; un nombre de base inválido se rechaza', async () => {
    const bd = new BasesDeDatos({
      servicios,
      credenciales: credenciales as never,
      rutas,
      exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
    });
    expect(await codigo(bd.abrirConsulta('mongodb', 'tienda', 'lectura', 1000))).toBe(
      'auditoria.motor_no_soportado',
    );
  });
});

// ---------------------------------------------------------------------------------------------
// Revisión final de D20
// ---------------------------------------------------------------------------------------------

describe('datos reales: de más, nunca de menos (A)', () => {
  const sitios = [{ carpeta: '', datosReales: true }];

  it('un sitio con datos reales que no da su base cuenta como datos reales', async () => {
    const d = { sitios: async () => sitios, baseDe: async () => null };
    expect(await baseDeDatosReales(d, 'mysql', 'cualquiera')).toBe(true);
    // Sin sitios con datos reales no se pide nada.
    expect(
      await baseDeDatosReales(
        { sitios: async () => [{ carpeta: 'x', datosReales: false }], baseDe: async () => null },
        'mysql',
        'otra',
      ),
    ).toBe(false);
  });

  it('baseDeSitio: .env inexistente, ilegible o sin usuario → null (y por tanto true)', async () => {
    const raiz = await carpetaTemporal('pel-sitio-');
    const sin = path.join(raiz, 'sin-env');
    mkdirSync(sin);
    expect(await baseDeSitio(sin)).toBeNull();

    const ilegible = path.join(raiz, 'ilegible');
    mkdirSync(path.join(ilegible, '.env'), { recursive: true }); // una carpeta: no se puede leer
    expect(await baseDeSitio(ilegible)).toBeNull();

    const sinUsuario = path.join(raiz, 'sin-usuario');
    mkdirSync(sinUsuario);
    writeFileSync(path.join(sinUsuario, '.env'), 'DB_CONNECTION=mysql\nDB_DATABASE=diamantes\n');
    expect(await baseDeSitio(sinUsuario)).toBeNull();

    for (const carpeta of [sin, ilegible, sinUsuario]) {
      const d = { sitios: async () => [{ carpeta, datosReales: true }], baseDe: baseDeSitio };
      expect(await baseDeDatosReales(d, 'mysql', 'diamantes')).toBe(true);
      expect(await baseDeDatosReales(d, 'mysql', 'otra')).toBe(true);
    }
  });

  it('baseDeSitio lee el .env y, en WordPress, DB_NAME de wp-config.php', async () => {
    const raiz = await carpetaTemporal('pel-sitio-');
    const laravel = path.join(raiz, 'laravel');
    mkdirSync(laravel);
    writeFileSync(
      path.join(laravel, '.env'),
      'DB_CONNECTION=mysql\nDB_DATABASE=diamantes\nDB_USERNAME=wolf_u_diamantes\n',
    );
    expect(await baseDeSitio(laravel)).toEqual({ base: 'diamantes', motor: 'mysql' });

    const wp = path.join(raiz, 'wp');
    mkdirSync(wp);
    writeFileSync(
      path.join(wp, 'wp-config.php'),
      "<?php\ndefine( 'DB_NAME', 'dollar_wp' );\ndefine('DB_USER', 'u');\n",
    );
    expect(await baseDeSitio(wp)).toEqual({ base: 'dollar_wp', motor: 'mysql' });

    const d = { sitios: async () => [{ carpeta: wp, datosReales: true }], baseDe: baseDeSitio };
    expect(await baseDeDatosReales(d, 'mariadb', 'DOLLAR_WP')).toBe(true);
    expect(await baseDeDatosReales(d, 'postgresql', 'dollar_wp')).toBe(false);
  });
});

describe('poolBcrypt: arranque comprobado y respaldo (B)', () => {
  /** Módulo bcrypt falso que se escribe en una carpeta temporal. */
  async function modulo(cuerpo: string): Promise<string> {
    const d = await carpetaTemporal('pel-modbc-');
    const ruta = path.join(d, 'bcrypt-falso.cjs');
    writeFileSync(ruta, cuerpo);
    return ruta;
  }
  const MORTAL =
    "exports.hashSync = () => 'h'; exports.compareSync = (c, h) => { if (c === 'x' && h === 'h') return true; process.exit(1); };";

  it('un módulo que falla al cargar en el hilo da null', async () => {
    const malo = await modulo("throw new Error('no carga');");
    expect(await crearPool(2, { modulo: malo, esperaMs: 3000 })).toBeNull();
    expect(await crearPool(1, { modulo: '/no/existe/bcrypt.cjs', esperaMs: 3000 })).toBeNull();
  });

  it('un hilo que carga pero falla la comparación de prueba no cuenta', async () => {
    const roto = await modulo('exports.hashSync = () => "h"; exports.compareSync = () => false;');
    expect(await crearPool(1, { modulo: roto, esperaMs: 3000 })).toBeNull();
  });

  it('si muere el último hilo, la tarea en curso y la cola se rechazan', async () => {
    const pool = (await crearPool(1, { modulo: await modulo(MORTAL), esperaMs: 3000 }))!;
    expect(pool).not.toBeNull();
    const resultados = await Promise.allSettled([
      pool.comparar('hash', ['a']),
      pool.comparar('hash', ['b']),
      pool.comparar('hash', ['c']),
    ]);
    expect(resultados.every((r) => r.status === 'rejected')).toBe(true);
    // Sin hilos vivos, lo nuevo se rechaza al instante.
    await expect(pool.comparar('hash', ['d'])).rejects.toThrow();
    await pool.cerrar();
  });

  it('coincideAlguna cae al hilo principal cuando el pool falla', async () => {
    const pool = (await crearPool(1, { modulo: await modulo(MORTAL), esperaMs: 3000 }))!;
    const h = await bc('letmein');
    expect(await coincideAlguna(h, ['uno', 'letmein'], { pool })).toBe(true);
    expect(await coincideAlguna(h, ['uno', 'dos'], { pool })).toBe(false);
    await pool.cerrar();
  });

  it('auditar termina con resultados aunque el pool no arranque o muera', async () => {
    const malo = await modulo("throw new Error('no carga');");
    const mortal = await modulo(MORTAL);
    for (const m of [malo, mortal]) {
      const f = baseFalsa('mysql', await tablaUsuarios());
      const { deps } = montar(f);
      const svc = new AuditoriaClaves({
        ...deps,
        crearPool: () => crearPool(1, { modulo: m, esperaMs: 3000 }),
      });
      const r = await svc.auditar(OPC);
      expect(r.revisadas).toBe(5);
      expect(r.truncado).toBe(false);
      expect(r.debiles.map((d) => d.usuario)).toEqual([
        'ana@x.test',
        'luis@x.test',
        'pepe@x.test',
        'dani@x.test',
      ]);
    }
  });
});

describe('seguridad por filas (RLS) en PostgreSQL', () => {
  const PG = { ...OPC, instancia: 'postgresql' as never };

  it('avisa cuando la tabla tiene RLS activa', async () => {
    const f = baseFalsa('postgresql', await tablaUsuarios());
    f.rls = true;
    const { svc } = montar(f);
    expect((await svc.auditar(PG)).rlsActiva).toBe(true);
    expect((await svc.vistaPreviaRestablecer({ ...PG, usuario: 'ana@x.test' })).rlsActiva).toBe(
      true,
    );
    const q = f.sql.find((x) => x.sql.includes('pg_catalog.pg_class'))!;
    expect(q.sql).toContain('relrowsecurity');
    expect(q.sql).toContain('OPERATOR(pg_catalog.=)');
  });

  it('sin RLS, o en MySQL, no avisa', async () => {
    const f = baseFalsa('postgresql', await tablaUsuarios());
    const { svc } = montar(f);
    expect((await svc.auditar(PG)).rlsActiva).toBe(false);
    const g = baseFalsa('mysql', await tablaUsuarios());
    const { svc: s2 } = montar(g);
    expect((await s2.auditar(OPC)).rlsActiva).toBe(false);
    expect(g.sql.some((x) => x.sql.includes('pg_class'))).toBe(false);
  });
});

describe('MySQL: sql_mode de la sesión de escritura', () => {
  /** Servidor falso que evalúa el SET SESSION sql_mode con un modo inicial dado. */
  async function modoFinal(inicial: string): Promise<string> {
    let modo = inicial;
    const bd = new BasesDeDatos({
      servicios: {
        estados: async () =>
          [{ id: 'mysql', estado: 'encendido', puertos: [3306] }] as unknown as never,
      },
      credenciales: { leer: async () => ({ usuario: 'root', clave: 'k' }) } as never,
      rutas,
      exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
      fabricas: {
        mysql: async () => ({
          async query(s: string) {
            const m = /^SET SESSION sql_mode = CONCAT_WS\(',', (.+), 'STRICT_ALL_TABLES'\)$/.exec(
              s,
            );
            if (m) {
              // CONCAT_WS salta los NULL, pero no las cadenas vacías.
              const previo =
                m[1] === '@@SESSION.sql_mode'
                  ? modo
                  : m[1] === "NULLIF(@@SESSION.sql_mode, '')"
                    ? modo || null
                    : 'desconocido';
              modo = [previo, 'STRICT_ALL_TABLES'].filter((p) => p !== null).join(',');
            }
            return [[]];
          },
          async end() {},
        }),
      },
    });
    const q = await bd.abrirConsulta('mysql', 'tienda', 'escritura', 5000);
    await q.cerrar();
    return modo;
  }

  it('con sql_mode vacío no deja una coma inicial', async () => {
    expect(await modoFinal('')).toBe('STRICT_ALL_TABLES');
  });

  it('con otros modos los conserva y añade el estricto', async () => {
    expect(await modoFinal('NO_ZERO_DATE,ONLY_FULL_GROUP_BY')).toBe(
      'NO_ZERO_DATE,ONLY_FULL_GROUP_BY,STRICT_ALL_TABLES',
    );
  });
});
