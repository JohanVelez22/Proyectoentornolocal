import * as crypto from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { hash as bcryptHash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaClaves } from '../src/bd/auditoriaClaves';
import { auditar, type DepsAuditar } from '../src/bd/auditoriaClaves/auditar';
import { CONTRASENAS_COMUNES } from '../src/bd/auditoriaClaves/comunes';
import { coincide, formatoDe, hashearNueva } from '../src/bd/auditoriaClaves/hashes';
import type { ConsultaSql } from '../src/bd/auditoriaClaves/tablas';
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

  it('bcrypt con un costo fuera de rango o PBKDF2 con demasiadas iteraciones no se revisan', async () => {
    const alto = (await bc('x')).replace('$04$', '$31$');
    expect(formatoDe(alto)).toBe('desconocido');
    expect(formatoDe(django('x', 10, 'abc').replace('$10$', '$99999999$'))).toBe('desconocido');
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
    expect(await coincide('no-es-un-hash', 'x')).toBe(false);
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

  it('PBKDF2 de Django: mismas iteraciones y digest, sal nueva', async () => {
    const viejo = django('a', 1234);
    const n = await hashearNueva(viejo, NUEVA);
    expect(n.hash.startsWith('pbkdf2_sha256$1234$')).toBe(true);
    expect(n.hash.split('$')[2]).not.toBe('sal1234abcde');
    expect(await coincide(n.hash, NUEVA)).toBe(true);
  });

  it('md5 y sha1 pasan a bcrypt con aviso, o se mantienen si se pide', async () => {
    const a = await hashearNueva(md5('a'), NUEVA);
    expect(a).toMatchObject({ formato: 'bcrypt', cambiaFormato: true });
    expect(await coincide(a.hash, NUEVA)).toBe(true);
    const b = await hashearNueva(sha1('a'), NUEVA, { mantenerFormato: true });
    expect(b).toMatchObject({ formato: 'sha1', cambiaFormato: false });
    expect(b.hash).toBe(sha1(NUEVA));
  });

  it('formato desconocido o clave de más de 72 bytes: error con código', async () => {
    expect(await codigo(hashearNueva('desconocido', NUEVA))).toBe('auditoria.formato_no_soportado');
    expect(await codigo(hashearNueva(await bc('a'), 'x'.repeat(73)))).toBe('auditoria.clave_larga');
  });
});

describe('la lista de contraseñas comunes', () => {
  it('tiene 200 entradas distintas', () => {
    expect(CONTRASENAS_COMUNES).toHaveLength(200);
    expect(new Set(CONTRASENAS_COMUNES).size).toBe(200);
  });
});

// ---------------------------------------------------------------------------------------------
// Base falsa (MySQL en memoria) para auditar y restablecer
// ---------------------------------------------------------------------------------------------

interface TablaFalsa {
  columnas: string[];
  filas: Record<string, unknown>[];
}

interface Falsa {
  consulta: ConsultaSql;
  /** SQL recibido (con sus parámetros), en orden. */
  sql: { sql: string; params: unknown[] }[];
  tablas: Map<string, TablaFalsa>;
  cerrada: boolean;
  /** Filas que dice haber bloqueado el `SELECT … FOR UPDATE` (carrera simulada). */
  bloqueo: number | null;
}

function baseFalsa(motor: ConsultaSql['motor'], tablas: Record<string, TablaFalsa>): Falsa {
  const f: Falsa = {
    consulta: undefined as unknown as ConsultaSql,
    sql: [],
    tablas: new Map(Object.entries(tablas)),
    cerrada: false,
    bloqueo: null,
  };
  const citado = (s: string): string => s.replace(/[`"]/g, '');
  f.consulta = {
    motor,
    async consultar(sql, params = []) {
      f.sql.push({ sql, params });
      if (sql.includes('information_schema.tables')) {
        const t = f.tablas.has(String(params[1])) ? String(params[1]) : null;
        return t ? [{ t }] : [];
      }
      if (sql.includes('information_schema.columns')) {
        return (f.tablas.get(String(params[1]))?.columnas ?? []).map((c) => ({ c }));
      }
      const tabla = (): TablaFalsa => {
        const m = /FROM (\S+)\.(\S+)/.exec(sql)!;
        return f.tablas.get(citado(m[2]!))!;
      };
      const col = (): string => citado(/WHERE (\S+) =/.exec(sql)![1]!);
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
      if (sql.includes('FOR UPDATE')) {
        const n = tabla().filas.filter((r) => r[col()] === params[0]).length;
        return Array.from({ length: f.bloqueo ?? Math.min(n, 3) }, () => ({ n: 1 }));
      }
      if (sql.startsWith('UPDATE')) {
        const m = /UPDATE \S+\.(\S+) SET (\S+) = \S+ WHERE (\S+) =/.exec(sql)!;
        const t = f.tablas.get(citado(m[1]!))!;
        const fila = t.filas.find((r) => r[citado(m[3]!)] === params[1])!;
        fila[citado(m[2]!)] = params[0];
        return motor === 'postgresql' ? [{ n: 1 }] : [];
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
function montar(f: Falsa, extra: { tomarFalla?: boolean } = {}) {
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
    reloj: () => new Date('2026-11-25T10:30:00Z'),
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
    expect(r.truncado).toBe(false);
    expect(f.cerrada).toBe(true);
  });

  it('el resultado no contiene ninguna de las 200 contraseñas ni dice cuál coincidió', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const r = await svc.auditar(OPC);
    for (const d of r.debiles) expect(Object.keys(d).sort()).toEqual(['motivo', 'usuario']);
    expect(Object.keys(r).sort()).toEqual(['debiles', 'noRevisables', 'revisadas', 'truncado']);
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

  it('PostgreSQL: identificadores entre comillas dobles y parámetros $n', async () => {
    const f = baseFalsa('postgresql', await tablaUsuarios());
    const { svc } = montar(f);
    await svc.auditar({ ...OPC, instancia: 'postgresql' as never });
    const lectura = f.sql.find((q) => / AS u, /.test(q.sql))!;
    expect(lectura.sql).toContain('"public"."usuarios"');
    expect(lectura.sql).toContain('"email" AS u');
    const cat = f.sql.find((q) => q.sql.includes('information_schema.tables'))!;
    expect(cat.sql).toContain('$1');
    expect(cat.params).toEqual(['public', 'usuarios']);
  });

  it('tope de filas: marca truncado y revisa solo hasta el tope', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const dep: DepsAuditar = {
      abrir: async () => f.consulta,
      maxFilas: 2,
    };
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
    expect(r.revisadas).toBe(0);
  });

  it('se puede cancelar', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const c = new AbortController();
    c.abort();
    expect(await codigo(svc.auditar(OPC, c.signal))).toBe('auditoria.cancelada');
    expect(f.cerrada).toBe(true);
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

    const copia = JSON.parse(readFileSync(r.copiaFila, 'utf8')) as {
      usuario: string;
      fila: { clave: string };
    };
    expect(copia.usuario).toBe('ana@x.test');
    expect(copia.fila.clave).toBe(antes);

    const nuevo = String(f.tablas.get('usuarios')!.filas[0]!['clave']);
    expect(nuevo).not.toBe(antes);
    expect(nuevo.startsWith('$2b$04$')).toBe(true);
    expect(await coincide(nuevo, NUEVA)).toBe(true);
    expect(f.cerrada).toBe(true);
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

  it('solo escribe con un UPDATE parametrizado de una fila (valores como parámetros)', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    await svc.restablecer({ ...U, claveNueva: NUEVA, confirmado: true });
    const upd = f.sql.filter((q) => q.sql.startsWith('UPDATE'));
    expect(upd).toHaveLength(1);
    expect(upd[0]!.sql).toBe(
      'UPDATE `tienda`.`usuarios` SET `clave` = ? WHERE `email` = ? LIMIT 1',
    );
    expect(upd[0]!.params[1]).toBe('ana@x.test');
    const ordenes = f.sql.map((q) => q.sql.split(' ')[0]);
    expect(ordenes).toContain('START');
    expect(ordenes.at(-1)).toBe('COMMIT');
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

  it('usuario inexistente: error y sin escribir', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden } = montar(f);
    expect(
      await codigo(
        svc.restablecer({ ...U, usuario: 'nadie@x.test', claveNueva: NUEVA, confirmado: true }),
      ),
    ).toBe('auditoria.usuario_no_encontrado');
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

  it('md5: pasa a bcrypt por omisión y se mantiene si se pide', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc } = montar(f);
    const luis = { ...U, usuario: 'luis@x.test' };
    const prev = await svc.vistaPreviaRestablecer(luis);
    expect(prev).toMatchObject({ formato: 'md5', formatoNuevo: 'bcrypt', cambiaFormato: true });
    await svc.restablecer({ ...luis, claveNueva: NUEVA, confirmado: true, mantenerFormato: true });
    expect(f.tablas.get('usuarios')!.filas[1]!['clave']).toBe(md5(NUEVA));
  });

  it('vista previa: sentencia con ? y sin valores, y no escribe', async () => {
    const f = baseFalsa('mysql', await tablaUsuarios());
    const { svc, orden, abiertas } = montar(f);
    const v = await svc.vistaPreviaRestablecer(U);
    expect(v.sentencia).toBe('UPDATE `tienda`.`usuarios` SET `clave` = ? WHERE `email` = ?');
    expect(v.formato).toBe('bcrypt');
    expect(v.cambiaFormato).toBe(false);
    expect(JSON.stringify(v)).not.toContain('$2b$');
    expect(orden).toEqual([]);
    expect(abiertas).toEqual(['lectura']);
    expect(f.sql.some((q) => q.sql.startsWith('UPDATE'))).toBe(false);
  });

  it('PostgreSQL: RETURNING para contar la fila y $n en los valores', async () => {
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
      'UPDATE "public"."usuarios" SET "clave" = $1 WHERE "email" = $2 RETURNING 1 AS n',
    );
    expect(f.sql[f.sql.findIndex((q) => q.sql === 'BEGIN')]).toBeDefined();
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
    }
  });

  it('PostgreSQL: administrador con la sesión en solo lectura para auditar, y escritura sin ese ajuste', async () => {
    for (const modo of ['lectura', 'escritura'] as const) {
      const sql: string[] = [];
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
            return {
              async query(s: string) {
                sql.push(s);
                return { rows: [] };
              },
              async end() {},
            };
          },
        },
      });
      const q = await bd.abrirConsulta('postgresql', 'tienda', modo, 5000);
      await q.cerrar();
      expect(sql.includes('SET default_transaction_read_only = on')).toBe(modo === 'lectura');
      expect(sql.some((x) => x.startsWith('SET statement_timeout = 5000'))).toBe(true);
    }
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
