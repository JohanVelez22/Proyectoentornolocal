import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Ejecutor } from '../plataforma/tipos';
import { ejecutorPorDefecto } from '../plataforma/win';
import type { Rutas } from '../rutas';

const CLAVE = 'HKCU\\Environment';
export const AVISO_TERMINAL_NUEVA = 'Abra una terminal nueva para ver el cambio.';

export interface DepsPathUsuario {
  rutas: Rutas;
  exec?: Ejecutor;
}

const normalizar = (e: string): string =>
  e.trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();

/**
 * PATH del USUARIO (HKCU\Environment\Path). Se lee y escribe el valor tal cual, con los
 * %VARIABLES% sin expandir. No se difunde WM_SETTINGCHANGE: las terminales nuevas lo leen al
 * abrirse y las ya abiertas no cambian; por eso se avisa al usuario.
 */
export class PathUsuario {
  private readonly exec: Ejecutor;
  constructor(private readonly d: DepsPathUsuario) {
    this.exec = d.exec ?? ejecutorPorDefecto;
  }

  private entrada(): string {
    return this.d.rutas.herramientas('bin');
  }

  private tipo = 'REG_EXPAND_SZ';

  /** Valor actual ('' si el usuario no tiene Path); falla si no se puede leer con seguridad. */
  private async leer(): Promise<string> {
    this.tipo = 'REG_EXPAND_SZ';
    const r = await this.exec('reg', ['query', CLAVE, '/v', 'Path'], { timeoutMs: 15_000 });
    if (r.codigo === 0) {
      const m = /^\s*Path\s+(REG_\w+)\s*(.*?)\s*$/im.exec(r.stdout);
      if (m) {
        this.tipo = m[1] ?? 'REG_EXPAND_SZ';
        return m[2] ?? '';
      }
      throw new Error('No se pudo interpretar el PATH del usuario. No se cambió nada.');
    }
    // Sin valor Path: solo es seguro tratarlo como vacío si la clave sí se puede leer.
    const clave = await this.exec('reg', ['query', CLAVE], { timeoutMs: 15_000 });
    if (clave.codigo === 0 && !/^\s*Path\s+REG_/im.test(clave.stdout)) return '';
    throw new Error('No se pudo leer el PATH del usuario. No se cambió nada.');
  }

  private async escribir(valor: string, anterior: string): Promise<void> {
    const respaldo = path.join(this.d.rutas.base, 'etc', 'path-usuario.respaldo.txt');
    await mkdir(path.dirname(respaldo), { recursive: true });
    // Se conserva el ORIGINAL: el respaldo no se pisa en cambios posteriores.
    await writeFile(respaldo, anterior, { encoding: 'utf8', flag: 'wx' }).catch((e: unknown) => {
      if ((e as { code?: string }).code !== 'EEXIST') throw e;
    });
    // REG_SZ se respeta salvo que el valor lleve %VARS%; si no, REG_EXPAND_SZ.
    const tipo = this.tipo === 'REG_SZ' && !valor.includes('%') ? 'REG_SZ' : 'REG_EXPAND_SZ';
    const r = await this.exec('reg', ['add', CLAVE, '/v', 'Path', '/t', tipo, '/d', valor, '/f'], {
      timeoutMs: 15_000,
    });
    if (r.codigo !== 0) {
      throw new Error(`No se pudo guardar el PATH del usuario. ${r.stderr.trim()}`.trim());
    }
  }

  private partes(valor: string): string[] {
    return valor.split(';').filter((p) => p.trim() !== '');
  }

  async estado(): Promise<boolean> {
    const mia = normalizar(this.entrada());
    return this.partes(await this.leer()).some((p) => normalizar(p) === mia);
  }

  async agregar(): Promise<{ aviso: string }> {
    const actual = await this.leer();
    const partes = this.partes(actual);
    if (!partes.some((p) => normalizar(p) === normalizar(this.entrada()))) {
      await this.escribir([...partes, this.entrada()].join(';'), actual);
    }
    return { aviso: AVISO_TERMINAL_NUEVA };
  }

  async quitar(): Promise<{ aviso: string }> {
    const actual = await this.leer();
    const partes = this.partes(actual);
    const resto = partes.filter((p) => normalizar(p) !== normalizar(this.entrada()));
    if (resto.length !== partes.length) await this.escribir(resto.join(';'), actual);
    return { aviso: AVISO_TERMINAL_NUEVA };
  }
}
