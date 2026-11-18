import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import {
  citarArgumento,
  crearLanzadorOculto,
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
  kill(): boolean {
    return true;
  }
}

describe('crearLanzadorOculto', () => {
  it('usa PowerShell sin detached, con windowsHide y la salida al log; el código es el PID', async () => {
    const llamadas: { cmd: string; args: string[]; opts: Record<string, unknown> }[] = [];
    let hijo!: HijoFalso;
    const spawnFalso = ((cmd: string, args: string[], opts: Record<string, unknown>) => {
      llamadas.push({ cmd, args, opts });
      hijo = new HijoFalso();
      setTimeout(() => hijo.emit('exit', 12345 * 4), 0);
      return hijo;
    }) as never;
    const lanzar = crearLanzadorOculto(spawnFalso);
    const pid = await lanzar(
      { comando: 'C:\\bin\\mysqld.exe', args: ['--console'], cwd: 'C:\\bin', env: { A: '1' } },
      7,
    );
    expect(pid).toBe(49380);
    const [l] = llamadas;
    expect(l!.cmd.toLowerCase()).toMatch(/windowspowershell\\v1\.0\\powershell\.exe$/);
    expect(l!.opts.windowsHide).toBe(true);
    expect(l!.opts.detached).toBeUndefined();
    expect(l!.opts.stdio).toEqual(['ignore', 7, 7]);
    expect((l!.opts.env as Record<string, string>).A).toBe('1');
    const i = l!.args.indexOf('-EncodedCommand');
    const script = Buffer.from(l!.args[i + 1]!, 'base64').toString('utf16le');
    expect(script).toContain("::new('C:\\bin\\mysqld.exe', '--console')");
  });

  it('un código que no es un PID (0–3 o no múltiplo de 4) es un fallo', async () => {
    for (const codigo of [0, 1, 6]) {
      const spawnFalso = (() => {
        const h = new HijoFalso();
        setTimeout(() => h.emit('exit', codigo), 0);
        return h;
      }) as never;
      await expect(
        crearLanzadorOculto(spawnFalso)({ comando: 'x.exe', args: [] }, 1),
      ).rejects.toThrow(/no se pudo lanzar/);
    }
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
});
