import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { InstaladorPgvector } from '../src/bd/pgvector';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { ProgresoInstalacion } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const VSWHERE = 'C:\\PF86\\Microsoft Visual Studio\\Installer\\vswhere.exe';
const VS = 'C:\\Program Files (x86)\\VS 2022 BT';
const WINGET = 'C:\\L\\Microsoft\\WindowsApps\\winget.exe';
const VCVARS = `${VS}\\VC\\Auxiliary\\Build\\vcvars64.bat`;

describe('InstaladorPgvector', () => {
  let base: string;
  let rutas: Rutas;
  let eventos: Eventos<EventosNucleo>;
  let progreso: ProgresoInstalacion[];
  let llamadas: { cmd: string; args: string[]; cwd?: string; bat?: string }[];
  let vswhereSalida: string;
  let pgVersion: string | null;
  let instalados: string[];
  let lineas: string[];
  let codigo: number;
  let wingetAusente: boolean;
  let orden: string[];
  let pgCorriendo: boolean;
  let pgFalla: boolean;
  let scripts: string[];
  let espera: Promise<void> | null;
  let reloj: number;
  let codigoWinget: number;

  const exec: Ejecutor = async (cmd, args) => {
    llamadas.push({ cmd, args });
    return { codigo: 0, stdout: vswhereSalida, stderr: '' };
  };
  const lanzar: Lanzador = async (cmd, args, opts) => {
    if (cmd === WINGET && wingetAusente) {
      throw Object.assign(new Error('spawn winget ENOENT'), { code: 'ENOENT' });
    }
    const ultimo = args.at(-1) ?? '';
    if (cmd === WINGET) {
      llamadas.push({ cmd, args });
      for (const l of lineas) opts?.alLinea?.(l, 'stdout');
      return { codigo: codigoWinget };
    }
    scripts.push(ultimo);
    orden.push('compilar');
    if (espera) await espera;
    const bat = ultimo.endsWith('.cmd') ? await readFile(ultimo, 'utf8') : undefined;
    llamadas.push({ cmd, args, cwd: opts?.cwd, bat });
    for (const l of lineas) opts?.alLinea?.(l, 'stdout');
    return { codigo };
  };

  const crear = (existe?: (p: string) => boolean): InstaladorPgvector =>
    new InstaladorPgvector({
      rutas,
      eventos,
      exec,
      lanzar,
      instalador: {
        instalar: async (v) => {
          instalados.push(v.servicio);
          await mkdir(rutas.bin('pgvector-src', v.version), { recursive: true });
        },
      },
      versionPostgres: async () => pgVersion,
      entorno: { LOCALAPPDATA: 'C:\\L' },
      existe:
        existe ??
        ((p) => p === VSWHERE || p === VCVARS || (p === WINGET && !wingetAusente) || existsSync(p)),
      programFilesX86: 'C:\\PF86',
      detenerPostgres: async () => {
        orden.push('detener');
        return pgCorriendo;
      },
      iniciarPostgres: async () => {
        orden.push('iniciar');
        if (pgFalla) throw new Error('no arranca');
      },
      ahora: () => (reloj += 200),
    });

  beforeEach(async () => {
    base = await carpetaTemporal('pel-pgv-');
    rutas = new Rutas(base);
    eventos = new Eventos();
    progreso = [];
    eventos.on('instalacion:progreso', (p) => progreso.push(p));
    llamadas = [];
    vswhereSalida = `${VS}\r\n`;
    pgVersion = '17.5';
    instalados = [];
    lineas = ['cl vector.c', 'link vector.dll'];
    codigo = 0;
    wingetAusente = false;
    orden = [];
    pgCorriendo = false;
    pgFalla = false;
    scripts = [];
    espera = null;
    reloj = 0;
    codigoWinget = 0;
  });

  it('busca las Build Tools con vswhere y los parámetros exactos', async () => {
    const r = await crear().estado();
    expect(r.buildTools).toBe(true);
    expect(llamadas[0]).toMatchObject({
      cmd: VSWHERE,
      args: [
        '-latest',
        '-products',
        '*',
        '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property',
        'installationPath',
      ],
    });
  });

  it('sin vswhere o sin resultado no hay Build Tools', async () => {
    vswhereSalida = '';
    expect((await crear().estado()).buildTools).toBe(false);
    vswhereSalida = `${VS}\r\n`;
    expect((await crear(() => false).estado()).buildTools).toBe(false);
  });

  it('instalado y versión salen de vector.control del PostgreSQL activo', async () => {
    expect(await crear().estado()).toMatchObject({ instalado: false, version: null });
    const ext = path.join(rutas.bin('postgresql', '17.5'), 'pgsql', 'share', 'extension');
    await mkdir(ext, { recursive: true });
    await writeFile(path.join(ext, 'vector.control'), "comment = 'x'\ndefault_version = '0.8.7'\n");
    expect(await crear().estado()).toMatchObject({ instalado: true, version: '0.8.7' });
  });

  it('sin PostgreSQL, estado no falla', async () => {
    pgVersion = null;
    expect(await crear().estado()).toMatchObject({ instalado: false, version: null });
  });

  it('winget ausente', async () => {
    wingetAusente = true;
    expect(await crear().instalarBuildTools()).toEqual({ ok: false, motivo: 'winget-ausente' });
    // Nunca se lanza «winget» por su nombre: sin el alias de WindowsApps solo se avisa.
    expect(llamadas.some((l) => l.cmd.toLowerCase().startsWith('winget'))).toBe(false);
  });

  it('instala las Build Tools con winget y transmite las líneas', async () => {
    lineas = ['Descargando'];
    const r = await crear().instalarBuildTools();
    expect(r).toEqual({ ok: true });
    const w = llamadas.find((l) => l.cmd === WINGET)!;
    expect(w.args).toEqual([
      'install',
      '--id',
      'Microsoft.VisualStudio.2022.BuildTools',
      '-e',
      '--accept-package-agreements',
      '--accept-source-agreements',
      '--override',
      '--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended',
    ]);
    expect(progreso.some((p) => p.servicio === 'buildtools' && p.mensaje === 'Descargando')).toBe(
      true,
    );
    expect(progreso.some((p) => p.servicio === 'pgvector')).toBe(false);
  });

  it('winget con código distinto de 0 explica la cancelación', async () => {
    codigoWinget = 1223;
    vswhereSalida = '';
    const r = await crear().instalarBuildTools();
    expect(r).toMatchObject({ ok: false, motivo: 'fallo' });
    expect('detalle' in r && r.detalle).toBe(
      'Windows no concedió permiso de administrador o la instalación se canceló.',
    );
  });

  it('compila con la línea exacta, cwd en el código y progreso por línea', async () => {
    const r = await crear().compilarEInstalar();
    expect(r.version).toBe('0.8.7');
    expect(instalados).toEqual(['pgvector-src']);
    const c = llamadas.find((l) => l.cmd.toLowerCase().includes('cmd'))!;
    expect(c.args.slice(0, 2)).toEqual(['/d', '/c']);
    expect(c.cwd).toBe(rutas.bin('pgvector-src', '0.8.7'));
    const pg = path.join(rutas.bin('postgresql', '17.5'), 'pgsql');
    expect(c.bat!.split(/\r?\n/).filter(Boolean)).toEqual([
      '@chcp 65001 >nul',
      '@echo off',
      `call "${VCVARS}" || exit /b 1`,
      `set "PGROOT=${pg}"`,
      'nmake /F Makefile.win || exit /b 1',
      'echo WOLFCORE-INSTALAR-PGVECTOR',
      'nmake /F Makefile.win install || exit /b 1',
    ]);
    expect(progreso.filter((p) => p.mensaje === 'link vector.dll')).toHaveLength(1);
    expect(progreso.at(-1)).toMatchObject({ servicio: 'pgvector', fase: 'listo' });
  });

  it('sin PostgreSQL o sin Build Tools da errores claros y no compila', async () => {
    pgVersion = null;
    await expect(crear().compilarEInstalar()).rejects.toThrow('PostgreSQL no está instalado');
    pgVersion = '17.5';
    vswhereSalida = '';
    await expect(crear().compilarEInstalar()).rejects.toThrow(
      'Instale primero las herramientas de compilación',
    );
    expect(llamadas.some((l) => l.cmd.toLowerCase().includes('cmd'))).toBe(false);
  });

  it('si nmake falla, explica sin trazas', async () => {
    codigo = 2;
    await expect(crear().compilarEInstalar()).rejects.toThrow(/No se pudo compilar pgvector/);
    expect(progreso.at(-1)).toMatchObject({ fase: 'error' });
  });

  it('un código de winget distinto de 0 es éxito si las herramientas ya están', async () => {
    codigoWinget = -1978335189;
    expect(await crear().instalarBuildTools()).toEqual({ ok: true });
    codigoWinget = 3010;
    vswhereSalida = '';
    expect(await crear().instalarBuildTools()).toEqual({ ok: true });
  });

  it('chcp 65001 precede a la primera ruta con acentos', async () => {
    const dir = await carpetaTemporal('pel-José-');
    rutas = new Rutas(dir);
    await crear().compilarEInstalar();
    const bat = llamadas.find((l) => l.bat)!.bat!;
    expect(bat.indexOf('chcp 65001')).toBeGreaterThanOrEqual(0);
    expect(bat.indexOf('chcp 65001')).toBeLessThan(bat.indexOf('call "'));
    expect(bat).toContain('José');
  });

  it('PostgreSQL en marcha: detiene, instala y vuelve a iniciar', async () => {
    pgCorriendo = true;
    await crear().compilarEInstalar();
    expect(orden).toEqual(['detener', 'compilar', 'iniciar']);
  });

  it('PostgreSQL detenido no se inicia', async () => {
    await crear().compilarEInstalar();
    expect(orden).toEqual(['detener', 'compilar']);
  });

  it('si falla la copia, reinicia PostgreSQL y explica', async () => {
    pgCorriendo = true;
    codigo = 2;
    lineas = ['link vector.dll', 'WOLFCORE-INSTALAR-PGVECTOR', 'Acceso denegado'];
    await expect(crear().compilarEInstalar()).rejects.toThrow(
      'No se pudo copiar pgvector a la carpeta de PostgreSQL (puede faltar permiso o un archivo seguir en uso). PostgreSQL se volvió a encender; inténtelo de nuevo.',
    );
    expect(orden).toEqual(['detener', 'compilar', 'iniciar']);
  });

  it('copia fallida con PostgreSQL parado no habla de reinicio', async () => {
    codigo = 2;
    lineas = ['WOLFCORE-INSTALAR-PGVECTOR'];
    await expect(crear().compilarEInstalar()).rejects.toThrow(
      'No se pudo copiar pgvector a la carpeta de PostgreSQL (puede faltar permiso de escritura).',
    );
    expect(orden).toEqual(['detener', 'compilar']);
  });

  it('informa a la vez el fallo principal y el del reinicio', async () => {
    pgCorriendo = true;
    pgFalla = true;
    codigo = 2;
    lineas = ['WOLFCORE-INSTALAR-PGVECTOR'];
    const e = await crear()
      .compilarEInstalar()
      .catch((x: Error) => x);
    expect((e as Error).message).toContain('No se pudo copiar pgvector');
    expect((e as Error).message).not.toContain('se volvió a encender');
    expect((e as Error).message).toContain(
      'Además, PostgreSQL no pudo volver a iniciar: no arranca. Enciéndalo desde Servicios.',
    );
    pgFalla = true;
    const f = await crear()
      .compilarEInstalar()
      .catch((x: Error) => x);
    expect((f as Error).message).toContain('No se pudo copiar');
    codigo = 0;
    const g = await crear()
      .compilarEInstalar()
      .catch((x: Error) => x);
    expect((g as Error).message).toContain('pgvector se instaló. Además');
  });

  it('si falla la compilación también reinicia PostgreSQL', async () => {
    pgCorriendo = true;
    codigo = 2;
    await expect(crear().compilarEInstalar()).rejects.toThrow(/No se pudo compilar/);
    expect(orden.at(-1)).toBe('iniciar');
  });

  it('descarta líneas de relleno y limita el ritmo', async () => {
    lineas = ['|', '/ -', 'cl vector.c', 'cl otro.c'];
    await crear().compilarEInstalar();
    const msgs = progreso.map((p) => p.mensaje);
    expect(msgs).not.toContain('|');
    expect(msgs).not.toContain('/ -');
    expect(msgs).toContain('cl vector.c');
    // el reloj de la prueba avanza 200 ms por consulta: nada se pierde por ritmo
    const rapido = new InstaladorPgvector({
      rutas,
      eventos,
      exec,
      lanzar,
      instalador: {
        instalar: async (v) => {
          await mkdir(rutas.bin('pgvector-src', v.version), { recursive: true });
        },
      },
      versionPostgres: async () => pgVersion,
      existe: (p) => p === VSWHERE || p === VCVARS || existsSync(p),
      programFilesX86: 'C:\\PF86',
      detenerPostgres: async () => false,
      iniciarPostgres: async () => undefined,
      ahora: () => 1000,
    });
    progreso.length = 0;
    await rapido.compilarEInstalar();
    expect(progreso.filter((p) => p.fase === 'compilando' && p.porcentaje === 50)).toHaveLength(1);
  });

  it('compila desde una extracción limpia y borra el script temporal', async () => {
    const dir = rutas.bin('pgvector-src', '0.8.7');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'viejo.obj'), 'x');
    await crear().compilarEInstalar();
    expect(existsSync(path.join(dir, 'viejo.obj'))).toBe(false);
    expect(existsSync(scripts[0]!)).toBe(false);
  });

  it('rechaza una segunda instalación simultánea', async () => {
    let soltar!: () => void;
    espera = new Promise((res) => (soltar = res));
    const i = crear();
    const primera = i.compilarEInstalar();
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    await expect(i.compilarEInstalar()).rejects.toThrow(
      'Ya hay una instalación de pgvector en curso',
    );
    soltar();
    await primera;
    await expect(i.compilarEInstalar()).resolves.toBeDefined();
  });
});
