import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import {
  CODIGO_RESTRINGIDO,
  LanzadorNoDisponible,
  citarArgumento,
  crearLanzadorOculto,
  literalPowerShell,
  scriptLanzamiento,
} from '../src/plataforma/lanzarOculto';
import type { Plataforma } from '../src/plataforma/tipos';
import { Supervisor } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';

describe('citarArgumento (reglas de CommandLineToArgvW)', () => {
  it.each([
    ['simple', 'simple'],
    ['', '""'],
    ['C:\\Program Files\\x', '"C:\\Program Files\\x"'],
    ['C:\\ruta con espacio\\', '"C:\\ruta con espacio\\\\"'],
    ['dice "hola"', '"dice \\"hola\\""'],
    ['a\\"b', '"a\\\\\\"b"'],
    ['--defaults-file=C:\\a\\my.ini', '--defaults-file=C:\\a\\my.ini'],
  ])('%s', (entrada, esperado) => {
    expect(citarArgumento(entrada)).toBe(esperado);
  });
});

describe('scriptLanzamiento', () => {
  it('arranca con Process.Start, sale con el PID y duplica las comillas simples', () => {
    const s = scriptLanzamiento({
      comando: "C:\\Users\\O'Neil\\bin\\postgres.exe",
      args: ['-D', 'C:\\datos con espacio', '-p', '5432'],
      cwd: 'C:\\bin',
    });
    expect(s).toContain(
      "::new('C:\\Users\\O''Neil\\bin\\postgres.exe', '-D \"C:\\datos con espacio\" -p 5432')",
    );
    expect(s).toContain("$i.WorkingDirectory = 'C:\\bin'");
    expect(s).toContain('$i.UseShellExecute = $false');
    expect(s).toContain('exit $p.Id');
  });
});

class HijoFalso extends EventEmitter {
  pid = 4242;
  matado = false;
  kill(): boolean {
    this.matado = true;
    return true;
  }
}

describe('comillas tipográficas en PowerShell', () => {
  it('duplica también ‘ ’ ‚ ‛ (PowerShell las toma como comilla simple)', () => {
    expect(literalPowerShell("Johan’s ‘x’ ‚y‛ z'")).toBe("'Johan’’s ‘‘x’’ ‚‚y‛‛ z'''");
  });

  it('en comando, argumentos y carpeta de trabajo', () => {
    const s = scriptLanzamiento({
      comando: 'C:\\Users\\Johan’s\\bin\\postgres.exe',
      args: ['-D', 'C:\\Users\\‘Ana’\\datos'],
      cwd: 'C:\\Users\\Johan’s\\bin',
    });
    expect(s).toContain(
      "::new('C:\\Users\\Johan’’s\\bin\\postgres.exe', '-D C:\\Users\\‘‘Ana’’\\datos')",
    );
    expect(s).toContain("$i.WorkingDirectory = 'C:\\Users\\Johan’’s\\bin'");
  });
});

const carpetas: string[] = [];
afterAll(() => {
  for (const c of carpetas) rmSync(c, { recursive: true, force: true });
});

interface Escenario {
  codigo?: number | null;
  /** No sale nunca (cuelgue) tras escribir este PID en el archivo. */
  colgadoConPid?: number;
  errorSpawn?: Error;
  vivo?: { vivo: boolean; ejecutable?: string };
}

function armar(e: Escenario) {
  const llamadas: { cmd: string; args: string[]; opts: Record<string, unknown> }[] = [];
  const matados: number[] = [];
  let hijo!: HijoFalso;
  const carpetaTmp = mkdtempSync(path.join(os.tmpdir(), 'pel-lanzar-'));
  carpetas.push(carpetaTmp);
  const spawnFalso = ((cmd: string, args: string[], opts: Record<string, unknown>) => {
    llamadas.push({ cmd, args, opts });
    hijo = new HijoFalso();
    const script = Buffer.from(args[args.indexOf('-EncodedCommand') + 1]!, 'base64').toString(
      'utf16le',
    );
    if (e.errorSpawn) setTimeout(() => hijo.emit('error', e.errorSpawn), 0);
    else if (e.colgadoConPid !== undefined) {
      const archivo = /WriteAllText\('([^']+)'/.exec(script)![1]!;
      writeFileSync(archivo, String(e.colgadoConPid));
    } else setTimeout(() => hijo.emit('exit', e.codigo ?? null), 0);
    return hijo;
  }) as never;
  const lanzar = crearLanzadorOculto({
    spawn: spawnFalso,
    procesoVivo: async () => e.vivo ?? { vivo: true, ejecutable: 'mysqld.exe' },
    matarArbol: async (pid) => {
      matados.push(pid);
    },
    carpetaTmp,
    limiteMs: 50,
  });
  return { lanzar, llamadas, matados, carpetaTmp, hijo: () => hijo };
}

const DEF = {
  comando: 'C:\\bin\\mysqld.exe',
  args: ['--console'],
  cwd: 'C:\\bin',
  env: { A: '1' },
};

describe('crearLanzadorOculto', () => {
  it('usa PowerShell sin detached, con windowsHide y la salida al log; el código es el PID', async () => {
    const x = armar({ codigo: 12345 * 4 });
    expect(await x.lanzar(DEF, 7)).toBe(49380);
    const [l] = x.llamadas;
    expect(l!.cmd.toLowerCase()).toMatch(/windowspowershell\\v1\.0\\powershell\.exe$/);
    expect(l!.opts.windowsHide).toBe(true);
    expect(l!.opts.detached).toBeUndefined();
    expect(l!.opts.stdio).toEqual(['ignore', 7, 7]);
    expect((l!.opts.env as Record<string, string>).A).toBe('1');
    const script = Buffer.from(l!.args[l!.args.indexOf('-EncodedCommand') + 1]!, 'base64').toString(
      'utf16le',
    );
    expect(script).toContain("::new('C:\\bin\\mysqld.exe', '--console')");
    expect(script).toContain("LanguageMode -ne 'FullLanguage'");
    // El archivo temporal del PID se borra siempre.
    expect(readdirSync(x.carpetaTmp)).toEqual([]);
  });

  it.each([0, 1, 3, 6, -4, 2 ** 31, null])('el código %s no es un PID: fallo', async (codigo) => {
    await expect(armar({ codigo }).lanzar(DEF, 1)).rejects.toThrow(/no se pudo lanzar/);
  });

  it('un PID que no es el ejecutable lanzado es un fallo', async () => {
    const x = armar({ codigo: 400, vivo: { vivo: true, ejecutable: 'chrome.exe' } });
    await expect(x.lanzar(DEF, 1)).rejects.toThrow(/no es el servicio/);
    expect(x.matados).toEqual([]);
    const muerto = armar({ codigo: 400, vivo: { vivo: false } });
    await expect(muerto.lanzar(DEF, 1)).rejects.toThrow(/terminó nada más arrancar/);
  });

  it('si el lanzador se cuelga, mata el PID que dejó en el archivo y lo borra', async () => {
    const x = armar({ colgadoConPid: 1236 });
    await expect(x.lanzar(DEF, 1)).rejects.toThrow(/no respondió a tiempo/);
    expect(x.matados).toEqual([1236]);
    expect(x.hijo().matado).toBe(true);
    expect(readdirSync(x.carpetaTmp)).toEqual([]);
  });

  it('PowerShell restringido o ausente: LanzadorNoDisponible', async () => {
    await expect(armar({ codigo: CODIGO_RESTRINGIDO }).lanzar(DEF, 1)).rejects.toBeInstanceOf(
      LanzadorNoDisponible,
    );
    const enoent = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
    await expect(armar({ errorSpawn: enoent }).lanzar(DEF, 1)).rejects.toBeInstanceOf(
      LanzadorNoDisponible,
    );
  });
});

describe('Supervisor con lanzador oculto', () => {
  let base: string;
  beforeEach(() => {
    base = mkdtempSync(path.join(os.tmpdir(), 'pel-oculto-'));
    mkdirSync(path.join(base, 'run'), { recursive: true });
  });
  afterEach(() => rmSync(base, { recursive: true, force: true }));

  it('sigue el PID real del servidor y detecta su muerte por sondeo', async () => {
    const vivos = new Set<number>();
    const matados: number[] = [];
    const plataforma = {
      procesoVivo: async (pid: number) =>
        vivos.has(pid) ? { vivo: true, ejecutable: 'postgres.exe' } : { vivo: false },
      matarArbol: async (pid: number) => {
        matados.push(pid);
        vivos.delete(pid);
      },
    } as unknown as Plataforma;
    const lanzados: string[] = [];
    const sup = new Supervisor(new Rutas(base), plataforma, new Eventos<EventosNucleo>(), {
      intervaloMs: 20,
      sonda: async () => true,
      lanzarOculto: async (def) => {
        lanzados.push(def.comando);
        vivos.add(8000);
        return 8000;
      },
    });
    await sup.iniciar({
      id: 'postgresql',
      comando: 'C:\\bin\\postgres.exe',
      args: [],
      puerto: 5432,
      log: path.join(base, 'logs', 'pg.log'),
      reiniciar: false,
    });
    expect(lanzados).toEqual(['C:\\bin\\postgres.exe']);
    expect(sup.pid('postgresql')).toBe(8000);
    await new Promise((r) => setTimeout(r, 80));
    expect(sup.estado('postgresql')).toBe('encendido');
    vivos.delete(8000);
    await new Promise((r) => setTimeout(r, 80));
    expect(sup.estado('postgresql')).toBe('error');
    expect(sup.pid('postgresql')).toBeNull();
    await sup.cerrar();
  });

  it('si el lanzador falla, iniciar rechaza y el servicio queda en error', async () => {
    const sup = new Supervisor(
      new Rutas(base),
      { procesoVivo: async () => ({ vivo: false }), matarArbol: async () => undefined } as never,
      new Eventos<EventosNucleo>(),
      {
        sonda: async () => false,
        lanzarOculto: async () => {
          throw new Error('el ejecutable no se pudo lanzar');
        },
      },
    );
    await expect(
      sup.iniciar({
        id: 'redis',
        comando: 'C:\\no\\existe.exe',
        args: [],
        log: path.join(base, 'logs', 'redis.log'),
        reiniciar: false,
      }),
    ).rejects.toThrow(/no se pudo lanzar/);
    expect(sup.estado('redis')).toBe('error');
    await sup.cerrar();
  });

  it('PID reutilizado por otro programa: cuenta como muerto y nunca se mata', async () => {
    const nombres = new Map<number, string>([[8000, 'postgres.exe']]);
    const matados: number[] = [];
    const plataforma = {
      procesoVivo: async (pid: number) =>
        nombres.has(pid) ? { vivo: true, ejecutable: nombres.get(pid) } : { vivo: false },
      matarArbol: async (pid: number) => {
        matados.push(pid);
      },
    } as unknown as Plataforma;
    const sup = new Supervisor(new Rutas(base), plataforma, new Eventos<EventosNucleo>(), {
      intervaloMs: 20,
      sonda: async () => true,
      lanzarOculto: async () => 8000,
    });
    const def = {
      id: 'postgresql',
      comando: 'C:\\bin\\postgres.exe',
      args: [],
      puerto: 5432,
      log: path.join(base, 'logs', 'pg.log'),
      reiniciar: false,
    };
    await sup.iniciar(def);
    await new Promise((r) => setTimeout(r, 60));
    expect(sup.estado('postgresql')).toBe('encendido');
    nombres.set(8000, 'chrome.exe');
    await new Promise((r) => setTimeout(r, 60));
    expect(sup.estado('postgresql')).toBe('error');
    expect(sup.pid('postgresql')).toBeNull();
    expect(matados).toEqual([]);
    await sup.cerrar();

    // detener tampoco mata un PID que ya es de otro ejecutable.
    nombres.set(8000, 'postgres.exe');
    const sup2 = new Supervisor(new Rutas(base), plataforma, new Eventos<EventosNucleo>(), {
      intervaloMs: 60_000,
      sonda: async () => true,
      lanzarOculto: async () => 8000,
    });
    await sup2.iniciar(def);
    nombres.set(8000, 'chrome.exe');
    await sup2.detener('postgresql');
    expect(matados).toEqual([]);
    await sup2.cerrar();
  });

  it('sin PowerShell utilizable usa el spawn clásico y avisa una sola vez', async () => {
    const avisos: string[] = [];
    const original = console.warn;
    console.warn = (m: string) => avisos.push(m);
    try {
      const lanzados: string[] = [];
      const spawnFalso = ((cmd: string) => {
        lanzados.push(cmd);
        const h = new HijoFalso();
        h.pid = 4000 + lanzados.length * 4;
        return h;
      }) as never;
      let intentos = 0;
      const sup = new Supervisor(
        new Rutas(base),
        {
          procesoVivo: async () => ({ vivo: true }),
          matarArbol: async () => undefined,
        } as unknown as Plataforma,
        new Eventos<EventosNucleo>(),
        {
          spawn: spawnFalso,
          sonda: async () => true,
          lanzarOculto: async () => {
            intentos++;
            throw new LanzadorNoDisponible('PowerShell está restringido en este equipo');
          },
        },
      );
      const def = (id: string) => ({
        id,
        comando: `C:\\bin\\${id}.exe`,
        args: [],
        log: path.join(base, 'logs', `${id}.log`),
        reiniciar: false,
      });
      await sup.iniciar(def('redis'));
      await sup.iniciar(def('mongod'));
      expect(intentos).toBe(1);
      expect(lanzados).toEqual(['C:\\bin\\redis.exe', 'C:\\bin\\mongod.exe']);
      expect(sup.pid('redis')).toBe(4004);
      expect(avisos).toHaveLength(1);
      expect(avisos[0]).toMatch(/pueden aparecer ventanas/);
      await sup.cerrar();
    } finally {
      console.warn = original;
    }
  });
});
