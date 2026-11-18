import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { InstaladorPgvector } from '../src/bd/pgvector';
import type { Ejecutor, Lanzador } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import type { ProgresoInstalacion } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const VSWHERE = 'C:\\PF86\\Microsoft Visual Studio\\Installer\\vswhere.exe';
const VS = 'C:\\Program Files (x86)\\VS 2022 BT';
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

  const exec: Ejecutor = async (cmd, args) => {
    llamadas.push({ cmd, args });
    return { codigo: 0, stdout: vswhereSalida, stderr: '' };
  };
  const lanzar: Lanzador = async (cmd, args, opts) => {
    if (cmd === 'winget' && wingetAusente) {
      throw Object.assign(new Error('spawn winget ENOENT'), { code: 'ENOENT' });
    }
    const ultimo = args.at(-1) ?? '';
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
      existe: existe ?? ((p) => p === VSWHERE || p === VCVARS || existsSync(p)),
      programFilesX86: 'C:\\PF86',
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
  });

  it('instala las Build Tools con winget y transmite las líneas', async () => {
    lineas = ['Descargando'];
    const r = await crear().instalarBuildTools();
    expect(r).toEqual({ ok: true });
    const w = llamadas.find((l) => l.cmd === 'winget')!;
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
    expect(progreso.some((p) => p.servicio === 'pgvector' && p.mensaje === 'Descargando')).toBe(
      true,
    );
  });

  it('winget con código distinto de 0 explica la cancelación', async () => {
    codigo = 1223;
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
      '@echo off',
      `call "${VCVARS}" || exit /b 1`,
      `set "PGROOT=${pg}"`,
      'nmake /F Makefile.win || exit /b 1',
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
});
