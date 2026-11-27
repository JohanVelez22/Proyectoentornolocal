import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FUENTE_LANZADOR,
  VERSION_LANZADOR,
  MENSAJES_SIN_APP,
  asegurarLanzadorExe,
  clienteCliInstalado,
  contenidoRuntime,
  contenidoWolfCmd,
  contenidoWolfSh,
  instalarClienteCli,
  quitarClienteCli,
} from '../src/herramientas/clienteCli';
import { rutaCsc } from '../src/plataforma/lanzadorWin';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const EXE = 'C:\\Apps\\WolfCore Dev\\WolfCore Dev.exe';

describe('wolf.cmd: ninguna orden sin ruta absoluta (C1)', () => {
  /** Órdenes internas de cmd (no se buscan en la carpeta actual ni en el PATH). */
  const INTERNAS = new Set(['@echo', 'rem', 'setlocal', 'set', 'if', 'for', 'exit', 'echo', ')']);

  const variantes = [
    contenidoWolfCmd({ exe: EXE }),
    contenidoWolfCmd({ exe: 'C:\\Users\\José\\app.exe' }),
    contenidoWolfCmd({ exe: 'C:\\e\\electron.exe', carpetaApp: 'C:\\repo\\apps\\desktop' }),
  ];

  it('solo órdenes internas o programas entre comillas con ruta completa', () => {
    for (const t of variantes) {
      for (const linea of t.split('\r\n').filter((l) => l.trim() !== '')) {
        const l = linea.trim();
        const primera = l.split(/\s+/)[0]!.toLowerCase();
        const ok = INTERNAS.has(primera) || /^"([A-Za-z]:\\|%SystemRoot%\\)/.test(l);
        expect(ok, `línea sin ruta absoluta: ${linea}`).toBe(true);
      }
    }
  });

  it('todo chcp lleva la ruta de System32 (un chcp.bat de la carpeta actual no se ejecuta)', () => {
    const t = variantes[1]!;
    const llamadas = t.match(/chcp/gi) ?? [];
    expect(llamadas.length).toBeGreaterThan(0);
    const absolutas = t.match(/"%SystemRoot%\\System32\\chcp\.com"/g) ?? [];
    expect(absolutas).toHaveLength(llamadas.length);
    // ni siquiera dentro del `for /f` ('chcp')
    expect(t).not.toMatch(/\('chcp'\)/);
  });

  it('el programa que corre lleva ruta completa y el cmd no usa PATH', () => {
    for (const t of variantes) {
      expect(t).toMatch(/^"[A-Za-z]:\\.*" "%~dp0wolf\.cjs" %\*$/m);
    }
  });

  it('vacía WOLFCORE_APP_DIR empaquetada y la fija en dev (M)', () => {
    expect(variantes[0]).toContain('set "WOLFCORE_APP_DIR="');
    expect(variantes[2]).toContain('set "WOLFCORE_APP_DIR=C:\\repo\\apps\\desktop"');
  });

  it('si el programa no existe, un mensaje claro en los cuatro idiomas y código 3 (M)', () => {
    const t = variantes[0]!;
    expect(t).toContain(`if not exist "${EXE}" (`);
    expect(t).toContain('exit /b 3');
    for (const m of MENSAJES_SIN_APP) expect(m).toMatch(/^[\x20-\x7e]+$/);
    expect(t).toContain('WolfCore Dev was not found');
    expect(t).toContain('no se encuentra WolfCore Dev');
  });
});

describe('lanzador wolf.exe (I2)', () => {
  it('no pasa por cmd.exe ni por shell: CreateProcess directo con los argumentos entre comillas', () => {
    expect(FUENTE_LANZADOR).toContain('UseShellExecute = false');
    expect(FUENTE_LANZADOR).not.toMatch(/cmd\.exe|ShellExecute = true/i);
    expect(FUENTE_LANZADOR).toContain('Quote(');
    // El lanzador solo lee su carpeta: ninguna ruta sale de los argumentos
    expect(FUENTE_LANZADOR).toContain('wolf.runtime');
    // La carpeta de la app viaja en WOLFCORE_APP_DIR, nunca como primer argumento
    expect(FUENTE_LANZADOR).not.toMatch(/sb\.Append\(Quote\(app\)\)/);
    expect(FUENTE_LANZADOR).toContain('Console.CancelKeyPress += (s, e) => e.Cancel = true;');
    expect(FUENTE_LANZADOR).toContain('p.WaitForExit()');
    expect(FUENTE_LANZADOR).toContain('Path.IsPathRooted(exe)');
    expect(FUENTE_LANZADOR).toContain('Environment' + 'Variables.Remove("WOLFCORE_APP_DIR")');
  });
});

describe('wolf (script sh para Git Bash) (I3)', () => {
  it('termina cada línea con LF (nunca CRLF), lleva shebang y pasa "$@" sin reinterpretar', () => {
    const t = contenidoWolfSh({ exe: EXE });
    expect(t).not.toContain('\r');
    expect(t.startsWith('#!/bin/sh\n')).toBe(true);
    expect(t).toContain(
      `ELECTRON_RUN_AS_NODE=1 exec 'C:\\Apps\\WolfCore Dev\\WolfCore Dev.exe' "$(dirname -- "$0")/wolf.cjs" "$@"`,
    );
    expect(t).toContain('unset WOLFCORE_APP_DIR');
  });

  it('una comilla simple en la ruta se escapa y no rompe el script', () => {
    const t = contenidoWolfSh({ exe: "C:\\O'Brien\\app.exe" });
    expect(t).toContain("'C:\\O'\\''Brien\\app.exe'");
  });

  it('rechaza saltos de línea y comillas dobles en la ruta', () => {
    expect(() => contenidoWolfSh({ exe: 'C:\\a\nb.exe' })).toThrow();
    expect(() => contenidoWolfSh({ exe: 'C:\\a"b.exe' })).toThrow();
  });

  it('en dev exporta la carpeta de la app', () => {
    expect(contenidoWolfSh({ exe: EXE, carpetaApp: 'C:\\repo\\desktop' })).toContain(
      "WOLFCORE_APP_DIR='C:\\repo\\desktop'; export WOLFCORE_APP_DIR",
    );
  });
});

describe('instalar, quitar e instalado', () => {
  async function origen() {
    const dir = await carpetaTemporal('pel-cli-inst-');
    const script = path.join(dir, 'wolf.cjs');
    await writeFile(script, 'console.log(1)\n');
    return { rutas: new Rutas(path.join(dir, 'datos')), script, dir };
  }

  it('escribe wolf.cjs, wolf.cmd, wolf (LF) y wolf.runtime; quitar los borra todos; instalado los exige', async () => {
    const { rutas, script } = await origen();
    expect(await clienteCliInstalado(rutas)).toBe(false);
    const r = await instalarClienteCli(rutas, { exe: EXE, script });
    expect(r.exe).toBe(false);
    const carpeta = rutas.cliCliente();
    expect((await readdir(carpeta)).sort()).toEqual([
      'wolf',
      'wolf.cjs',
      'wolf.cmd',
      'wolf.runtime',
    ]);
    expect(await readFile(path.join(carpeta, 'wolf'), 'utf8')).not.toContain('\r');
    expect(await readFile(path.join(carpeta, 'wolf.runtime'), 'utf8')).toBe(`${EXE}\n\n`);
    expect(await clienteCliInstalado(rutas)).toBe(true);
    // Si falta el script sh, ya no está instalado completo (se repara al reinstalar)
    await (await import('node:fs/promises')).rm(path.join(carpeta, 'wolf'));
    expect(await clienteCliInstalado(rutas)).toBe(false);
    await instalarClienteCli(rutas, { exe: EXE, script });
    expect(await clienteCliInstalado(rutas)).toBe(true);
    await quitarClienteCli(rutas);
    await expect(stat(carpeta)).rejects.toThrow();
  });

  it('quitar no toca un archivo ajeno que el usuario dejó en la carpeta', async () => {
    const { rutas, script } = await origen();
    await instalarClienteCli(rutas, { exe: EXE, script });
    await writeFile(path.join(rutas.cliCliente(), 'mio.txt'), 'x');
    await quitarClienteCli(rutas);
    expect(await readdir(rutas.cliCliente())).toEqual(['mio.txt']);
  });

  it('contenidoRuntime lleva la ruta y, en dev, la carpeta', () => {
    expect(contenidoRuntime({ exe: EXE, carpetaApp: 'C:\\r' })).toBe(`${EXE}\nC:\\r\n`);
  });

  it('asegurarLanzadorExe compila con el csc dado y no repite si la versión es la misma', async () => {
    const dir = await carpetaTemporal('pel-cli-csc-');
    const llamadas: string[][] = [];
    const ejecutar = (async (_c: string, args: string[]) => {
      llamadas.push(args);
      const salida = args.find((a) => a.startsWith('/out:'));
      if (salida) await writeFile(salida.slice(5), 'MZ');
      return { codigo: 0, stdout: '', stderr: '' };
    }) as never;
    expect(await asegurarLanzadorExe(dir, { ejecutar, csc: 'C:\\csc.exe' })).toBe('ok');
    // compilar (1) y la prueba inocua con plazo corto (1)
    expect(llamadas).toHaveLength(2);
    expect(llamadas[1]).toEqual(['--help']);
    expect(await readFile(path.join(dir, 'wolf.exe'), 'utf8')).toBe('MZ');
    expect(await asegurarLanzadorExe(dir, { ejecutar, csc: 'C:\\csc.exe' })).toBe('ok');
    expect(llamadas).toHaveLength(2);
    // la versión es el hash de la fuente
    expect(await readFile(path.join(dir, 'wolf.exe.version'), 'utf8')).toBe(VERSION_LANZADOR);
  });

  it('la versión del lanzador es el hash de su fuente (sin marca manual)', async () => {
    const { createHash } = await import('node:crypto');
    expect(VERSION_LANZADOR).toBe(
      createHash('sha256').update(FUENTE_LANZADOR).digest('hex').slice(0, 16),
    );
  });

  it('si el .exe compilado no pasa la prueba (ASR, AppLocker, antivirus), se borra y queda el .cmd', async () => {
    const dir = await carpetaTemporal('pel-cli-csc3-');
    const ejecutar = (async (cmd: string, args: string[]) => {
      const salida = args.find((a) => a.startsWith('/out:'));
      if (salida) {
        await writeFile(salida.slice(5), 'MZ');
        return { codigo: 0, stdout: '', stderr: '' };
      }
      return { codigo: 1, stdout: '', stderr: 'bloqueado por la directiva' };
    }) as never;
    expect(await asegurarLanzadorExe(dir, { ejecutar, csc: 'C:\\csc.exe' })).toBe('bloqueado');
    await expect(stat(path.join(dir, 'wolf.exe'))).rejects.toThrow();
    await expect(stat(path.join(dir, 'wolf.exe.version'))).rejects.toThrow();
    // y un ejecutor que lanza (plazo vencido) también lo descarta
    const cuelga = (async (cmd: string, args: string[]) => {
      const salida = args.find((a) => a.startsWith('/out:'));
      if (salida) {
        await writeFile(salida.slice(5), 'MZ');
        return { codigo: 0, stdout: '', stderr: '' };
      }
      throw new Error('plazo vencido');
    }) as never;
    expect(await asegurarLanzadorExe(dir, { ejecutar: cuelga, csc: 'C:\\csc.exe' })).toBe(
      'bloqueado',
    );
    await expect(stat(path.join(dir, 'wolf.exe'))).rejects.toThrow();
  });

  it('sin csc o con un compilador que falla: false y queda el .cmd', async () => {
    const dir = await carpetaTemporal('pel-cli-csc2-');
    const ejecutar = (async () => ({ codigo: 1, stdout: '', stderr: 'x' })) as never;
    expect(await asegurarLanzadorExe(dir, { ejecutar, csc: null })).toBe('sin-csc');
    expect(await asegurarLanzadorExe(dir, { ejecutar, csc: 'C:\\csc.exe' })).toBe('fallo');
  });
});

/**
 * El lanzador de verdad: se compila con el csc de .NET Framework y se prueba con node como "app"
 * (el cliente es un script que imprime sus argumentos). Es lo que demuestra que `&`, `|`, `^`, `%` y
 * las comillas llegan literales, sin cmd.exe de por medio.
 */
describe.skipIf(process.platform !== 'win32' || rutaCsc() === null)(
  'wolf.exe real (Windows)',
  () => {
    it('los argumentos llegan intactos y ninguno ejecuta nada', async () => {
      const dir = await carpetaTemporal('pel-cli-exe-');
      const { ejecutorPorDefecto } = await import('../src/plataforma/win');
      const { rutas, script } = await (async () => {
        const s = path.join(dir, 'eco.js');
        await writeFile(s, 'console.log(JSON.stringify(process.argv.slice(2)));\n');
        return { rutas: new Rutas(path.join(dir, 'datos')), script: s };
      })();
      const r = await instalarClienteCli(
        rutas,
        { exe: process.execPath, script },
        { ejecutar: ejecutorPorDefecto, csc: rutaCsc() },
      );
      expect(r.exe).toBe(true);
      const lanzador = path.join(rutas.cliCliente(), 'wolf.exe');
      const marca = path.join(dir, 'MARCA.txt');
      const args = [
        'R&D',
        'a^b',
        'a|b',
        'x>y',
        `&echo hola>${marca}`,
        '%PATH%',
        'con espacio',
        'dos "comillas"',
        'termina\\',
        'termina con espacio\\ ',
        '',
        "o'k",
      ];
      const p = spawnSync(lanzador, args, { encoding: 'utf8', windowsHide: true });
      expect(p.status).toBe(0);
      // `wolf.cjs` se llama como el eco: el lanzador pasa el cliente de su carpeta (aquí, el eco copiado)
      expect(JSON.parse(p.stdout.trim())).toEqual(args);
      await expect(stat(marca)).rejects.toThrow();
    }, 90_000);

    it('con carpetaApp (dev) el eco recibe exactamente los args y la carpeta va en WOLFCORE_APP_DIR', async () => {
      const dir = await carpetaTemporal('pel-cli-exe3-');
      const { ejecutorPorDefecto } = await import('../src/plataforma/win');
      const s = path.join(dir, 'eco.js');
      await writeFile(
        s,
        'console.log(JSON.stringify({ args: process.argv.slice(2), app: process.env.WOLFCORE_APP_DIR ?? null, nodo: process.env.ELECTRON_RUN_AS_NODE }));\n',
      );
      const rutas = new Rutas(path.join(dir, 'datos'));
      const carpetaApp = path.join(dir, 'app dev');
      const inst = await instalarClienteCli(
        rutas,
        { exe: process.execPath, script: s, carpetaApp },
        { ejecutar: ejecutorPorDefecto, csc: rutaCsc() },
      );
      expect(inst).toEqual({ exe: true, bloqueado: false });
      const args = ['status', '--json', 'R&D', 'con espacio'];
      const p = spawnSync(path.join(rutas.cliCliente(), 'wolf.exe'), args, {
        encoding: 'utf8',
        windowsHide: true,
      });
      expect(p.status).toBe(0);
      expect(JSON.parse(p.stdout.trim())).toEqual({ args, app: carpetaApp, nodo: '1' });
    }, 90_000);

    it('una ruta de la app que no es absoluta se trata como app inexistente (código 3)', async () => {
      const dir = await carpetaTemporal('pel-cli-exe4-');
      const { ejecutorPorDefecto } = await import('../src/plataforma/win');
      const s = path.join(dir, 'eco.js');
      await writeFile(s, 'console.log(1)\n');
      const rutas = new Rutas(path.join(dir, 'datos'));
      const inst = await instalarClienteCli(
        rutas,
        { exe: process.execPath, script: s },
        { ejecutar: ejecutorPorDefecto, csc: rutaCsc() },
      );
      expect(inst.exe).toBe(true);
      await writeFile(path.join(rutas.cliCliente(), 'wolf.runtime'), 'node.exe\n\n');
      const p = spawnSync(path.join(rutas.cliCliente(), 'wolf.exe'), [], {
        encoding: 'utf8',
        windowsHide: true,
      });
      expect(p.status).toBe(3);
    }, 90_000);

    it('con la app inexistente: mensaje claro y código 3', async () => {
      const dir = await carpetaTemporal('pel-cli-exe2-');
      const { ejecutorPorDefecto } = await import('../src/plataforma/win');
      const s = path.join(dir, 'eco.js');
      await writeFile(s, 'console.log(1)\n');
      const rutas = new Rutas(path.join(dir, 'datos'));
      // Se instala con una app válida (la prueba inocua la exige) y después la app desaparece
      await instalarClienteCli(
        rutas,
        { exe: process.execPath, script: s },
        { ejecutar: ejecutorPorDefecto, csc: rutaCsc() },
      );
      await writeFile(
        path.join(rutas.cliCliente(), 'wolf.runtime'),
        `${path.join(dir, 'no-existe.exe')}\n\n`,
      );
      const p = spawnSync(path.join(rutas.cliCliente(), 'wolf.exe'), [], {
        encoding: 'utf8',
        windowsHide: true,
      });
      expect(p.status).toBe(3);
      expect(p.stderr).toContain('WolfCore Dev was not found');
    }, 90_000);
  },
);

describe('reversión y marca de la app', () => {
  const nucleos: Nucleo[] = [];
  afterEach(async () => {
    for (const n of nucleos.splice(0))
      await n.cerrar({ detenerServicios: false }).catch(() => undefined);
  });

  async function crear() {
    const dir = await carpetaTemporal('pel-cli-rev-');
    const base = path.join(dir, 'datos');
    await mkdir(base, { recursive: true });
    const script = path.join(dir, 'wolf.cjs');
    await writeFile(script, 'x\n');
    const plat = new PlataformaFalsa({ carpetaDatos: dir, carpetaInicio: dir });
    plat.path = ['C:\\Windows'];
    const n = await Nucleo.crear({
      barrerHuerfanos: false,
      base,
      plataforma: plat,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      retrasoNovedadesMs: 60_000,
      servidorCli: { version: '1', cliente: { exe: EXE, script } },
    });
    nucleos.push(n);
    return { n, plat, base };
  }

  it('run/app.pid lleva el pid de la app mientras está abierta y se borra al cerrar', async () => {
    const { n, base } = await crear();
    const ruta = path.join(base, 'run', 'app.pid');
    expect(await readFile(ruta, 'utf8')).toBe(String(process.pid));
    await n.cerrar({ detenerServicios: false });
    await expect(stat(ruta)).rejects.toThrow();
  });

  it('si el PATH se escribió pero algo falla después, la reversión quita también la entrada', async () => {
    const { n, plat, base } = await crear();
    const entrada = path.join(base, 'bin', 'cli');
    let escrituras = 0;
    const acceso = {
      leer: async () => [...plat.path],
      escribir: async (e: string[]) => {
        escrituras++;
        plat.path = [...e];
        // La primera escritura deja la entrada y falla al comprobarla (como `escribir` real)
        if (escrituras === 1) throw new Error('no quedó como se esperaba');
      },
    };
    (n as unknown as { pathCli: PathUsuario }).pathCli = new PathUsuario({
      rutas: n.rutas,
      entrada,
      acceso,
    });
    await expect(n.cambiarCliPath(true)).rejects.toThrow('no quedó');
    expect(plat.path).toEqual(['C:\\Windows']);
    expect((await n.estadoCli()).ajuste).toBe(false);
  });

  it('"en el PATH sin cliente": estadoCliPath lo muestra y volver a agregar lo repara', async () => {
    const { n, plat, base } = await crear();
    await n.cambiarCliPath(true);
    await (await import('node:fs/promises')).rm(path.join(base, 'bin', 'cli', 'wolf.cmd'));
    expect(await n.estadoCliPath()).toMatchObject({ enPath: true, instalado: false });
    await n.cambiarCliPath(true);
    expect(await n.estadoCliPath()).toMatchObject({ enPath: true, instalado: true, activo: true });
    expect(plat.path.filter((p) => p === path.join(base, 'bin', 'cli'))).toHaveLength(1);
  });
});
