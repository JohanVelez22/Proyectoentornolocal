import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Lanzador } from '../src/plataforma/tipos';
import { ProcesosProyecto } from '../src/proyectos/procesos';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

async function armar(o: { sinLanzar?: boolean } = {}) {
  const base = await carpetaTemporal('pel-una-vez-base-');
  const carpeta = await carpetaTemporal('pel-una-vez-proy-');
  const rutas = new Rutas(base);
  const sitio: Sitio = SitioSchema.parse({
    id: 'demo',
    nombre: 'Demo',
    dominio: 'demo.test',
    carpeta,
    tipo: 'laravel',
  });
  const lanzar = vi.fn<Lanzador>(async () => ({ codigo: 0 }));
  const phpExe = join(base, 'bin', 'php', '8.4', 'php.exe');
  const phpIni = join(base, 'etc', 'php', '8.4', 'php.ini');
  const procesos = new ProcesosProyecto({
    rutas,
    supervisor: { alTerminar: () => undefined } as never,
    leerSitios: async () => [sitio],
    entorno: { Path: 'C:\\Windows\\system32', OTRA: 'secreto-del-usuario' },
    runtimes: {
      paraProyecto: async () => ({ node: '22.1.0', avisos: [] }),
      carpetasPath: (v) => (v.node ? [rutas.bin('node', v.node)] : []),
      rutaBin: (tipo, version) => rutas.bin(tipo, version),
    },
    php: async () => ({ exe: phpExe, ini: phpIni }),
    ...(o.sinLanzar ? {} : { lanzar }),
  });
  return { sitio, procesos, lanzar, rutas, carpeta, phpExe, phpIni };
}

const senal = (): { senal: AbortSignal; alLinea: (l: string) => void } => ({
  senal: new AbortController().signal,
  alLinea: () => undefined,
});

describe('ProcesosProyecto.ejecutarUnaVez (tareas programadas)', () => {
  it('lanza el php del sitio sin shell, en la carpeta del sitio y con la señal dada', async () => {
    const a = await armar();
    const o = senal();
    const r = await a.procesos.ejecutarUnaVez(a.sitio, ['php', 'artisan', 'schedule:run'], o);
    expect(r).toEqual({ codigo: 0 });
    const [cmd, args, opts] = a.lanzar.mock.calls[0]!;
    expect(cmd).toBe(a.phpExe);
    expect(args).toEqual(['-c', a.phpIni, 'artisan', 'schedule:run']);
    expect(opts?.cwd).toBe(a.carpeta);
    expect(opts?.senal).toBe(o.senal);
    // Solo las variables que cambian: nada del entorno del usuario se copia ni se registra.
    expect(opts?.env).toBeDefined();
    expect(Object.keys(opts!.env!)).not.toContain('OTRA');
    expect(opts!.env!.Path).toContain(a.rutas.bin('node', '22.1.0'));
  });

  it('npm run va por el node del proyecto con su npm-cli.js', async () => {
    const a = await armar();
    await a.procesos.ejecutarUnaVez(a.sitio, ['npm', 'run', 'cron'], senal());
    const [cmd, args] = a.lanzar.mock.calls[0]!;
    expect(cmd).toBe(join(a.rutas.bin('node', '22.1.0'), 'node.exe'));
    expect(args?.[0]).toMatch(/npm-cli\.js$/);
    expect(args?.slice(1)).toEqual(['run', 'cron']);
  });

  it('las salidas del proceso llegan a alLinea', async () => {
    const a = await armar();
    a.lanzar.mockImplementationOnce(async (_c, _a, opts) => {
      opts?.alLinea?.('hola', 'stdout');
      return { codigo: 3 };
    });
    const lineas: string[] = [];
    const r = await a.procesos.ejecutarUnaVez(a.sitio, ['php', 'spark', 'x'], {
      senal: new AbortController().signal,
      alLinea: (l) => lineas.push(l),
    });
    expect(r.codigo).toBe(3);
    expect(lineas).toEqual(['hola']);
  });

  it('rechaza lo que no está en la lista cerrada antes de lanzar nada', async () => {
    const a = await armar();
    for (const c of [
      ['curl', 'https://ejemplo.test'],
      ['npx', 'cowsay'],
      ['php', '-r', 'echo 1;'],
      ['deploy.cmd'],
      ['C:\\Windows\\System32\\cmd.exe', '/c', 'dir'],
      ['powershell', '-File', 'x.ps1'],
    ]) {
      await expect(
        a.procesos.ejecutarUnaVez(a.sitio, c, senal()),
        c.join(' '),
      ).rejects.toMatchObject({ codigo: 'tareas.comando_invalido' });
    }
    expect(a.lanzar).not.toHaveBeenCalled();
  });

  it('falla claro si la carpeta del sitio no existe o no hay lanzador', async () => {
    const a = await armar();
    await expect(
      a.procesos.ejecutarUnaVez(
        { ...a.sitio, carpeta: join(a.carpeta, 'no-existe') },
        ['php', 'x.php'],
        senal(),
      ),
    ).rejects.toThrow(/no existe/);
    const b = await armar({ sinLanzar: true });
    await expect(b.procesos.ejecutarUnaVez(b.sitio, ['php', 'x.php'], senal())).rejects.toThrow();
  });
});
