import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Nucleo, PlataformaFalsa, SitioSchema } from '@pel/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leerArchivoCliSeguro, type DepsLectura } from '../src/cli/archivoCli';
import { SALIDA, ejecutarCli, type DepsCli } from '../src/cli/cliente';

/** Cliente real contra el servidor de órdenes real del núcleo (plataforma falsa, sin túneles ni hosts). */
const nucleos: Nucleo[] = [];
const dirs: string[] = [];
afterEach(async () => {
  for (const n of nucleos.splice(0))
    await n.cerrar({ detenerServicios: false }).catch(() => undefined);
  for (const d of dirs.splice(0))
    await rm(d, { recursive: true, force: true }).catch(() => undefined);
});

async function montar(confirmar?: () => Promise<boolean>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pel-wolf-int-'));
  dirs.push(dir);
  const base = path.join(dir, 'datos');
  const sitio = path.join(dir, 'tienda');
  await mkdir(base, { recursive: true });
  await mkdir(sitio, { recursive: true });
  await writeFile(
    path.join(base, 'config.json'),
    JSON.stringify({
      cli: { activo: true },
      sitios: [
        SitioSchema.parse({
          id: 'tienda',
          nombre: 'Tienda',
          dominio: 'tienda.test',
          carpeta: sitio,
          tipo: 'estatico',
        }),
      ],
    }),
  );
  const n = await Nucleo.crear({
    barrerHuerfanos: false,
    base,
    plataforma: new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir }),
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
    aislado: true,
    servidorCli: { version: '9.9.9', ...(confirmar ? { confirmar } : {}) },
  });
  nucleos.push(n);
  const lectura: DepsLectura = {
    pidVivo: () => true,
    imagenDe: async () => 'wolf-prueba',
    imagenEsperada: 'wolf-prueba',
    aclEsDelUsuario: async () => true,
    plataforma: process.platform === 'win32' ? 'win32' : 'linux',
    uidActual: typeof process.getuid === 'function' ? process.getuid() : null,
  };
  const out: string[] = [];
  const err: string[] = [];
  const deps: DepsCli = {
    leerCliJson: () => leerArchivoCliSeguro(path.join(base, 'run', 'cli.json'), lectura),
    salida: { out: (t) => out.push(t), err: (t) => err.push(t) },
    idioma: () => 'es',
    cwd: sitio,
    tty: false,
    preguntar: async () => null,
    pausaMs: 1,
  };
  return { n, base, out, err, deps };
}

describe('wolf contra el servidor real de la app (D32)', () => {
  it('status --json: JSON válido con el sitio, sin el token del cli.json', async () => {
    const m = await montar();
    const token = (
      JSON.parse(await readFile(path.join(m.base, 'run', 'cli.json'), 'utf8')) as { token: string }
    ).token;
    expect(await ejecutarCli(['status', '--json'], m.deps)).toBe(SALIDA.BIEN);
    const texto = m.out.join('\n');
    const j = JSON.parse(texto) as { sitios: { dominio: string }[] };
    expect(j.sitios.map((s) => s.dominio)).toEqual(['tienda.test']);
    expect(texto).not.toContain(token);
  });

  it('el idioma de la app (cli.json) manda en los mensajes', async () => {
    const m = await montar();
    await m.n.sitios.modificarConfig((c) => {
      c.ui.idioma = 'en';
    });
    // El idioma se escribe en cli.json al arrancar: se reinicia el servidor para releerlo.
    await m.n.activarCli(false);
    await m.n.activarCli(true);
    expect(await ejecutarCli(['secure', 'nada'], m.deps)).toBe(SALIDA.ERROR);
    expect(m.err.join('\n')).toContain('does not exist');
  });

  it('share --si sin ventana de la app que confirme: no se publica nada (código 1)', async () => {
    const confirmar = vi.fn(async () => false);
    const m = await montar(confirmar);
    expect(await ejecutarCli(['share', 'tienda', '--si'], m.deps)).toBe(SALIDA.ERROR);
    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(m.err.join('\n')).toContain('se rechazó o no estaba disponible');
  });

  it('logs de un sitio sin líneas todavía: lo dice y sale bien', async () => {
    const m = await montar();
    expect(await ejecutarCli(['logs', 'tienda'], m.deps)).toBe(SALIDA.BIEN);
    expect(m.out.join('\n')).toContain('sin líneas todavía');
  });

  it('un sitio que no existe: error con texto y código 1', async () => {
    const m = await montar();
    expect(await ejecutarCli(['logs', 'nada'], m.deps)).toBe(SALIDA.ERROR);
    expect(m.err.join('\n')).toContain('El sitio nada no existe.');
  });

  it('con la CLI apagada no hay cli.json: código 3', async () => {
    const m = await montar();
    await m.n.activarCli(false);
    expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
  });

  it('un cli.json cambiado a mano con otro pid no se usa', async () => {
    const m = await montar();
    const ruta = path.join(m.base, 'run', 'cli.json');
    const a = JSON.parse(await readFile(ruta, 'utf8')) as Record<string, unknown>;
    await writeFile(ruta, JSON.stringify({ ...a, pid: 999_999 }));
    m.deps.leerCliJson = () =>
      leerArchivoCliSeguro(ruta, {
        pidVivo: (pid) => pid === process.pid,
        imagenDe: async () => 'wolf-prueba',
        imagenEsperada: 'wolf-prueba',
        aclEsDelUsuario: async () => true,
        plataforma: 'win32',
      });
    expect(await ejecutarCli(['status'], m.deps)).toBe(SALIDA.APP_CERRADA);
  });
});
