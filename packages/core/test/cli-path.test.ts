import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { contenidoWolfCmd } from '../src/herramientas/clienteCli';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

const nucleos: Nucleo[] = [];
afterEach(async () => {
  for (const n of nucleos.splice(0))
    await n.cerrar({ detenerServicios: false }).catch(() => undefined);
});

const PATH_INICIAL = ['C:\\Windows', 'C:\\Herramientas'];

/** Un núcleo con plataforma falsa: el PATH, el hosts y los certificados reales no se tocan nunca. */
async function crear(o: { aislado?: boolean; cliente?: boolean } = {}) {
  const dir = await carpetaTemporal('pel-cli-path-');
  const base = path.join(dir, 'datos');
  await mkdir(base, { recursive: true });
  const script = path.join(dir, 'wolf.cjs');
  await writeFile(script, 'console.log("wolf");\n');
  const plat = new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir });
  plat.path = [...PATH_INICIAL];
  const n = await Nucleo.crear({
    base,
    plataforma: plat,
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
    retrasoNovedadesMs: 60_000,
    ...(o.aislado ? { aislado: true } : {}),
    servidorCli: {
      version: '0.0.1',
      ...(o.cliente === false
        ? {}
        : { cliente: { exe: 'C:\\Apps\\WolfCore Dev\\WolfCore Dev.exe', script } }),
    },
  });
  nucleos.push(n);
  return { n, plat, base, dir };
}

describe('wolf en el PATH (D32)', () => {
  it('agregar: copia el cliente, agrega bin/cli al PATH con copia del original y enciende cli.activo', async () => {
    const { n, plat, base } = await crear();
    expect((await n.estadoCliPath()).enPath).toBe(false);
    expect((await n.estadoCli()).ajuste).toBe(false);
    await n.cambiarCliPath(true);
    const carpeta = path.join(base, 'bin', 'cli');
    expect(plat.path).toEqual([...PATH_INICIAL, carpeta]);
    expect((await readdir(carpeta)).sort()).toEqual(['wolf.cjs', 'wolf.cmd']);
    expect(await readFile(path.join(carpeta, 'wolf.cmd'), 'utf8')).toContain('WolfCore Dev.exe');
    // Copia del PATH original (como la de php y composer)
    expect(await readFile(path.join(base, 'etc', 'path-usuario.respaldo.txt'), 'utf8')).toBe(
      PATH_INICIAL.join(';'),
    );
    expect(await n.estadoCliPath()).toMatchObject({
      enPath: true,
      instalado: true,
      activo: true,
      ajuste: true,
    });
    // El servidor está vivo y su archivo existe
    expect((await stat(path.join(base, 'run', 'cli.json'))).isFile()).toBe(true);
  });

  it('agregar dos veces no duplica la entrada', async () => {
    const { n, plat, base } = await crear();
    await n.cambiarCliPath(true);
    await n.cambiarCliPath(true);
    expect(plat.path.filter((p) => p === path.join(base, 'bin', 'cli'))).toHaveLength(1);
  });

  it('no toca la entrada de PHP (tools/bin) ni las ajenas', async () => {
    const { n, plat, base } = await crear();
    const php = path.join(base, 'tools', 'bin');
    plat.path.push(php);
    await n.cambiarCliPath(true);
    expect(plat.path).toContain(php);
    await n.cambiarCliPath(false);
    expect(plat.path).toEqual([...PATH_INICIAL, php]);
  });

  it('quitar: saca la entrada, apaga cli.activo, borra cli.json y el cliente', async () => {
    const { n, plat, base } = await crear();
    await n.cambiarCliPath(true);
    await n.cambiarCliPath(false);
    expect(plat.path).toEqual(PATH_INICIAL);
    expect(await n.estadoCli()).toEqual({ activo: false, ajuste: false });
    await expect(stat(path.join(base, 'run', 'cli.json'))).rejects.toThrow();
    await expect(stat(path.join(base, 'bin', 'cli'))).rejects.toThrow();
  });

  it('en modo aislado (WOLFCORE_DATOS) no toca el PATH ni enciende la CLI', async () => {
    const { n, plat } = await crear({ aislado: true });
    await expect(n.cambiarCliPath(true)).rejects.toMatchObject({ codigo: 'cli.path_aislado' });
    await expect(n.cambiarCliPath(false)).rejects.toMatchObject({ codigo: 'cli.path_aislado' });
    expect(plat.path).toEqual(PATH_INICIAL);
    expect((await n.estadoCli()).ajuste).toBe(false);
    expect((await n.estadoCliPath()).aislado).toBe(true);
  });

  it('sin cliente compilado falla con cli.sin_cliente y no cambia nada', async () => {
    const { n, plat } = await crear({ cliente: false });
    await expect(n.cambiarCliPath(true)).rejects.toMatchObject({ codigo: 'cli.sin_cliente' });
    expect(plat.path).toEqual(PATH_INICIAL);
    expect((await n.estadoCli()).ajuste).toBe(false);
  });

  it('si el PATH no se puede escribir, deshace: CLI apagada y sin cliente copiado', async () => {
    const { n, plat, base } = await crear();
    const fallido = new PathUsuario({
      rutas: n.rutas,
      entrada: path.join(base, 'bin', 'cli'),
      acceso: {
        leer: async () => [...plat.path],
        escribir: async () => {
          throw new Error('sin permiso');
        },
      },
    });
    (n as unknown as { pathCli: PathUsuario }).pathCli = fallido;
    await expect(n.cambiarCliPath(true)).rejects.toThrow('sin permiso');
    expect((await n.estadoCli()).ajuste).toBe(false);
    await expect(stat(path.join(base, 'bin', 'cli'))).rejects.toThrow();
    expect(plat.path).toEqual(PATH_INICIAL);
  });

  it('quitar con el PATH ilegible no apaga la CLI', async () => {
    const { n } = await crear();
    await n.cambiarCliPath(true);
    (n.pathCli as unknown as { quitar: () => Promise<never> }).quitar = async () => {
      throw new Error('registro ilegible');
    };
    await expect(n.cambiarCliPath(false)).rejects.toThrow('registro ilegible');
    expect((await n.estadoCli()).ajuste).toBe(true);
  });
});

describe('wolf.cmd', () => {
  it('corre el cliente con ELECTRON_RUN_AS_NODE solo en este proceso', () => {
    const t = contenidoWolfCmd({ exe: 'C:\\Apps\\WolfCore Dev\\WolfCore Dev.exe' });
    expect(t).toContain('setlocal DisableDelayedExpansion');
    expect(t).toContain('set "ELECTRON_RUN_AS_NODE=1"');
    expect(t).toContain('"C:\\Apps\\WolfCore Dev\\WolfCore Dev.exe" "%~dp0wolf.cjs" %*');
    expect(t).toContain('exit /b %ERRORLEVEL%');
    // El set va después de setlocal (si no, se quedaría en la terminal del usuario)
    expect(t.indexOf('setlocal')).toBeLessThan(t.indexOf('ELECTRON_RUN_AS_NODE'));
    expect(t).not.toContain('chcp');
    expect(t).toContain('\r\n');
  });

  it('escapa % y rechaza comillas y saltos de línea en la ruta', () => {
    expect(contenidoWolfCmd({ exe: 'C:\\100%\\app.exe' })).toContain('"C:\\100%%\\app.exe"');
    expect(() => contenidoWolfCmd({ exe: 'C:\\a"b.exe' })).toThrow();
    expect(() => contenidoWolfCmd({ exe: 'C:\\a\nb.exe' })).toThrow();
  });

  it('con letras fuera de ASCII usa UTF-8 y devuelve la página de códigos', () => {
    const t = contenidoWolfCmd({ exe: 'C:\\Users\\José\\app.exe' });
    expect(t).toContain('chcp 65001 >nul');
    expect(t).toContain('chcp %WOLF_CP% >nul');
    expect(t).toContain('exit /b %WOLF_RC%');
  });

  it('en dev lleva la carpeta de la app para --abrir', () => {
    expect(
      contenidoWolfCmd({ exe: 'C:\\e\\electron.exe', carpetaApp: 'C:\\repo\\apps\\desktop' }),
    ).toContain('set "WOLFCORE_APP_DIR=C:\\repo\\apps\\desktop"');
  });
});
