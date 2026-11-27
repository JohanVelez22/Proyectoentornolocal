import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClienteMysql } from '../src/bd/clienteMysql';
import { nombreDuenoMysql } from '../src/bd/sqlPermitido';
import { realOResuelta } from '../src/importar/comun';
import { esVenvPropio, registrarVenvPropio } from '../src/proyectos/pasos/python';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

async function cliente(
  falla: RegExp | null = null,
): Promise<{ c: ClienteMysql; sql: { sql: string; params?: unknown[] }[] }> {
  const sql: { sql: string; params?: unknown[] }[] = [];
  const c = new ClienteMysql((async () => ({
    query: async (s: string, params?: unknown[]) => {
      sql.push({ sql: s, ...(params ? { params } : {}) });
      if (falla?.test(s)) throw new Error('ER_PARSE_ERROR');
      return [[]];
    },
    end: async () => undefined,
  })) as never);
  await c.conectar({ host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: 'x' });
  return { c, sql };
}

describe('cuenta wolf_dueno_*', () => {
  it('se bloquea aunque ya existiera, con permisos solo sobre la base', async () => {
    const { c, sql } = await cliente();
    const u = await c.crearDuenoObjetos('mi_tienda');
    expect(u).toBe(nombreDuenoMysql('mi_tienda'));
    const t = sql.map((x) => x.sql);
    expect(t[0]).toMatch(/^CREATE USER IF NOT EXISTS \?@'localhost' ACCOUNT LOCK/);
    expect(t).toContain("ALTER USER ?@'localhost' ACCOUNT LOCK");
    expect(t.at(-1)).toMatch(/^GRANT ALL PRIVILEGES ON `mi\\_tienda`\.\* TO/);
  });

  it('sin ACCOUNT LOCK: la clave pasa a una al azar aunque la cuenta ya existiera', async () => {
    const { c, sql } = await cliente(/ACCOUNT LOCK/);
    await c.crearDuenoObjetos('tienda');
    const alter = sql.filter((x) => /^ALTER USER .* IDENTIFIED BY/.test(x.sql));
    expect(alter).toHaveLength(1);
    expect(String(alter[0]!.params![1])).toMatch(/^[0-9a-f]{48}$/);
  });

  it('al borrar la base se borra su cuenta', async () => {
    const { c, sql } = await cliente();
    await c.borrarBase('tienda');
    await c.borrarDuenoObjetos('tienda');
    expect(sql.map((x) => x.sql)).toEqual([
      'DROP DATABASE `tienda`',
      "DROP USER IF EXISTS ?@'localhost'",
    ]);
    expect(sql[1]!.params).toEqual([nombreDuenoMysql('tienda')]);
  });
});

describe('rutas de red', () => {
  it('realOResuelta no consulta una ruta UNC', async () => {
    for (const unc of ['\\\\host\\share\\www', '//host/share/www']) {
      expect(await realOResuelta(unc)).toBe(path.resolve(unc));
    }
  });
});

describe('venvs-propios.json', () => {
  it('muchas altas a la vez no se pisan y el archivo siempre es JSON válido, sin temporales', async () => {
    const d = await carpetaTemporal('pel-venv-');
    const rutas = new Rutas(path.join(d, 'base'));
    const carpetas = Array.from({ length: 25 }, (_v, i) => path.join(d, `p${i}`));
    await Promise.all(carpetas.map((c) => registrarVenvPropio({ rutas }, c)));
    for (const c of carpetas) expect(await esVenvPropio({ rutas }, c), c).toBe(true);
    const archivo = path.join(rutas.base, 'etc', 'venvs-propios.json');
    expect((JSON.parse(await readFile(archivo, 'utf8')) as string[]).length).toBe(25);
    expect(await readdir(path.dirname(archivo))).toEqual(['venvs-propios.json']);
  });

  it('las mayúsculas solo se ignoran donde el sistema de archivos las ignora', async () => {
    const d = await carpetaTemporal('pel-venv-');
    const rutas = new Rutas(path.join(d, 'base'));
    await registrarVenvPropio({ rutas }, path.join(d, 'Proyecto'));
    expect(await esVenvPropio({ rutas }, path.join(d, 'proyecto'))).toBe(path.sep === '\\');
  });
});
