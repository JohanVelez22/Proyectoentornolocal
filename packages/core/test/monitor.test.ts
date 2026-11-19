import { appendFile, mkdir, open, rename, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { interpretarMuestraWindows, muestraSistemaWindows } from '../src/plataforma/win';
import type { Ejecutor, MuestraPlataforma } from '../src/plataforma/tipos';
import { Metricas, type DepsMetricas } from '../src/monitor/metricas';
import { agruparLlamadas, decodificarLinea, Registros } from '../src/monitor/registros';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/* ───────────── Salida de PowerShell ───────────── */

describe('interpretarMuestraWindows', () => {
  it('lee procesos y adaptadores cuando vienen como arreglos', () => {
    const json = JSON.stringify({
      p: [
        { IDProcess: 1204, PercentProcessorTime: 50, WorkingSetPrivate: 1048576, ElapsedTime: 120 },
        { IDProcess: 88, PercentProcessorTime: 0, WorkingSetPrivate: 2048, ElapsedTime: 5 },
      ],
      n: [
        { Name: 'Ethernet', ReceivedBytes: 1000, SentBytes: 500 },
        { Name: 'Wi-Fi', ReceivedBytes: 10, SentBytes: 20 },
      ],
    });
    expect(interpretarMuestraWindows(json)).toEqual({
      procesos: [
        { pid: 1204, cpu: 50, ramBytes: 1048576, uptimeS: 120 },
        { pid: 88, cpu: 0, ramBytes: 2048, uptimeS: 5 },
      ],
      red: { rx: 1010, tx: 520 },
    });
  });

  it('acepta un solo objeto en lugar de un arreglo (ConvertTo-Json lo desenvuelve)', () => {
    const json = JSON.stringify({
      p: { IDProcess: 7, PercentProcessorTime: 12, WorkingSet: 4096, ElapsedTime: 9 },
      n: { Name: 'Ethernet', ReceivedBytes: 3, SentBytes: 4 },
    });
    expect(interpretarMuestraWindows(json)).toEqual({
      procesos: [{ pid: 7, cpu: 12, ramBytes: 4096, uptimeS: 9 }],
      red: { rx: 3, tx: 4 },
    });
  });

  it('salida vacía, nula o inválida: sin procesos ni red (no lanza)', () => {
    const vacia: MuestraPlataforma = { procesos: [], red: null };
    expect(interpretarMuestraWindows('')).toEqual(vacia);
    expect(interpretarMuestraWindows('   \r\n')).toEqual(vacia);
    expect(interpretarMuestraWindows('{"p":null,"n":null}')).toEqual(vacia);
    expect(interpretarMuestraWindows('{"p":[],"n":[]}')).toEqual(vacia);
    expect(interpretarMuestraWindows('no es json')).toEqual(vacia);
    expect(interpretarMuestraWindows('[1,2]')).toEqual(vacia);
  });

  it('adaptadores con nombres localizados o sin contadores; texto antes del JSON', () => {
    const json =
      'ADVERTENCIA: algo\r\n' +
      JSON.stringify({
        p: [{ IDProcess: 'x' }, { IDProcess: 40, PercentProcessorTime: null }],
        n: [
          { Name: 'Conexión de área local ñ', ReceivedBytes: 100, SentBytes: 1 },
          { Name: 'Adaptador sin datos' },
        ],
      });
    expect(interpretarMuestraWindows(json)).toEqual({
      procesos: [{ pid: 40, cpu: 0, ramBytes: 0, uptimeS: 0 }],
      red: { rx: 100, tx: 1 },
    });
  });

  it('sin adaptadores con contadores la red queda en null', () => {
    expect(interpretarMuestraWindows('{"p":[],"n":[{"Name":"x"}]}').red).toBeNull();
  });
});

describe('muestraSistemaWindows', () => {
  function decodificar(args: string[]): string {
    const i = args.indexOf('-EncodedCommand');
    return Buffer.from(args[i + 1]!, 'base64').toString('utf16le');
  }

  it('un solo PowerShell oculto, filtrado por los PIDs pedidos y con JSON compacto', async () => {
    const llamadas: { cmd: string; args: string[] }[] = [];
    const ejecutar: Ejecutor = async (cmd, args) => {
      llamadas.push({ cmd, args });
      return { codigo: 0, stdout: '{"p":[],"n":[]}', stderr: '' };
    };
    await muestraSistemaWindows(ejecutar, [12, 40, 12]);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]!.cmd.toLowerCase()).toContain('powershell');
    expect(llamadas[0]!.args).toEqual(expect.arrayContaining(['-NoProfile', '-NonInteractive']));
    const script = decodificar(llamadas[0]!.args);
    expect(script).toContain('Win32_PerfFormattedData_PerfProc_Process');
    expect(script).toContain('IDProcess=12 OR IDProcess=40');
    expect(script).toContain('Get-NetAdapterStatistics');
    expect(script).toContain('ConvertTo-Json -Compress');
    expect(script).toContain('Get-NetAdapter -Physical');
  });

  it('sin PIDs no consulta procesos (solo la red)', async () => {
    let script = '';
    await muestraSistemaWindows(async (_c, args) => {
      script = decodificar(args);
      return { codigo: 0, stdout: '', stderr: '' };
    }, []);
    expect(script).not.toContain('Win32_PerfFormattedData_PerfProc_Process');
    expect(script).toContain('Get-NetAdapterStatistics');
  });

  it('descarta PIDs que no son enteros positivos', async () => {
    let script = '';
    await muestraSistemaWindows(
      async (_c, args) => {
        script = decodificar(args);
        return { codigo: 0, stdout: '', stderr: '' };
      },
      [Number.NaN, -4, 1.5, 8],
    );
    expect(script).toContain('IDProcess=8"');
  });

  it('si PowerShell falla o lanza, devuelve una muestra vacía', async () => {
    expect(
      await muestraSistemaWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }), [4]),
    ).toEqual({ procesos: [], red: null });
    expect(
      await muestraSistemaWindows(async () => {
        throw new Error('sin powershell');
      }, [4]),
    ).toEqual({ procesos: [], red: null });
  });
});

/* ───────────── Métricas ───────────── */

function cpusFalsos(n: number, ocupado: number, libre: number) {
  return Array.from({ length: n }, () => ({
    model: 'x',
    speed: 1,
    times: { user: ocupado, nice: 0, sys: 0, idle: libre, irq: 0 },
  }));
}

describe('Metricas', () => {
  let eventos: Eventos<EventosNucleo>;
  let ahora: number;
  let consultas: number[][];
  let respuesta: MuestraPlataforma | Error;
  let cpus: ReturnType<typeof cpusFalsos>;
  let pids: Record<string, number | null>;

  function crear(extra: Partial<DepsMetricas> = {}): Metricas {
    return new Metricas({
      eventos,
      supervisor: { ids: () => Object.keys(pids), pid: (id) => pids[id] ?? null },
      consultar: async (p) => {
        consultas.push(p);
        if (respuesta instanceof Error) throw respuesta;
        return respuesta;
      },
      rutaDatos: 'C:\\datos',
      sistema: {
        cpus: () => cpus,
        totalmem: () => 1000,
        freemem: () => 250,
        statfs: async () => ({ bsize: 10, blocks: 100, bfree: 40, bavail: 30 }),
      },
      ahora: () => ahora,
      ...extra,
    });
  }

  beforeEach(() => {
    eventos = new Eventos<EventosNucleo>();
    ahora = 1_000_000;
    consultas = [];
    respuesta = { procesos: [], red: null };
    cpus = cpusFalsos(8, 100, 300);
    pids = {};
  });
  afterEach(() => vi.useRealTimers());

  it('valores del sistema desde os y statfs', async () => {
    const m = await crear().muestrear();
    expect(m.ramTotal).toBe(1000);
    expect(m.ramUsada).toBe(750);
    expect(m.discoDatos).toEqual({ usado: 600, libre: 300 });
    expect(m.cpu).toBeCloseTo(25);
    expect(m.marca).toBe(ahora);
  });

  it('CPU del sistema por diferencia entre muestras', async () => {
    const met = crear();
    await met.muestrear();
    cpus = cpusFalsos(8, 100 + 90, 300 + 10);
    expect((await met.muestrear()).cpu).toBeCloseTo(90);
  });

  it('CPU por proceso normalizada por núcleos lógicos y solo PIDs conocidos', async () => {
    pids = { nginx: 100, 'proy-tienda-vite': 200, apagado: null };
    respuesta = {
      procesos: [
        { pid: 100, cpu: 400, ramBytes: 10, uptimeS: 3 },
        { pid: 200, cpu: 80, ramBytes: 20, uptimeS: 4 },
        { pid: 999, cpu: 90, ramBytes: 30, uptimeS: 5 },
      ],
      red: null,
    };
    const m = await crear().muestrear();
    expect(consultas).toEqual([[100, 200]]);
    expect(m.procesos).toEqual([
      { id: 'nginx', pid: 100, cpu: 50, ramBytes: 10, uptimeS: 3 },
      {
        id: 'proy-tienda-vite',
        pid: 200,
        cpu: 10,
        ramBytes: 20,
        uptimeS: 4,
        sitioId: 'tienda',
        procesoId: 'vite',
      },
    ]);
  });

  it('el CPU por proceso no pasa de 100', async () => {
    pids = { a: 4 };
    respuesta = { procesos: [{ pid: 4, cpu: 5000, ramBytes: 1, uptimeS: 1 }], red: null };
    expect((await crear().muestrear()).procesos[0]!.cpu).toBe(100);
  });

  it('si PowerShell falla la muestra sale igual con los valores de os', async () => {
    pids = { a: 4 };
    respuesta = new Error('roto');
    const m = await crear().muestrear();
    expect(m.ramTotal).toBe(1000);
    expect(m.procesos).toEqual([]);
    expect(m.red).toEqual({ rxBps: 0, txBps: 0 });
  });

  it('red en bytes por segundo; un contador que baja da 0', async () => {
    const met = crear();
    respuesta = { procesos: [], red: { rx: 1000, tx: 100 } };
    expect((await met.muestrear()).red).toEqual({ rxBps: 0, txBps: 0 });
    ahora += 3000;
    respuesta = { procesos: [], red: { rx: 4000, tx: 700 } };
    expect((await met.muestrear()).red).toEqual({ rxBps: 1000, txBps: 200 });
    ahora += 3000;
    respuesta = { procesos: [], red: { rx: 10, tx: 10 } };
    expect((await met.muestrear()).red).toEqual({ rxBps: 0, txBps: 0 });
  });

  it('statfs que falla deja el disco en 0', async () => {
    const m = await crear({
      sistema: {
        cpus: () => cpus,
        totalmem: () => 1,
        freemem: () => 1,
        statfs: async () => {
          throw new Error('x');
        },
      },
    }).muestrear();
    expect(m.discoDatos).toEqual({ usado: 0, libre: 0 });
  });

  it('iniciar muestrea cada 3 s, emite el evento y pausar lo detiene', async () => {
    vi.useFakeTimers();
    const met = crear();
    const vistas: number[] = [];
    eventos.on('metricas:muestra', (m) => vistas.push(m.marca));
    met.iniciar();
    met.iniciar(); // idempotente
    await vi.advanceTimersByTimeAsync(10);
    expect(consultas).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(consultas).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(consultas).toHaveLength(3);
    expect(vistas).toHaveLength(3);
    met.pausar();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(consultas).toHaveLength(3);
  });

  it('nunca se solapan dos muestras: si una sigue en curso se salta el tic', async () => {
    vi.useFakeTimers();
    let soltar: () => void = () => undefined;
    let llamadas = 0;
    const met = crear({
      consultar: () => {
        llamadas++;
        return new Promise<MuestraPlataforma>((r) => {
          soltar = () => r({ procesos: [], red: null });
        });
      },
    });
    met.iniciar();
    await vi.advanceTimersByTimeAsync(9000);
    expect(llamadas).toBe(1);
    soltar();
    await vi.advanceTimersByTimeAsync(3000);
    expect(llamadas).toBe(2);
    met.pausar();
    soltar();
  });

  it('ultimos(min) devuelve solo la ventana pedida y el búfer guarda 5 minutos', async () => {
    const met = crear();
    for (let i = 0; i < 150; i++) {
      await met.muestrear();
      ahora += 3000;
    }
    // 150 muestras × 3 s = 7,5 min: solo quedan las de los últimos 5 minutos.
    const todas = met.ultimos();
    expect(todas.length).toBeLessThanOrEqual(101);
    expect(todas.length).toBeGreaterThanOrEqual(99);
    expect(todas.every((m) => m.marca >= ahora - 5 * 60_000)).toBe(true);
    const una = met.ultimos(1);
    expect(una.length).toBeGreaterThanOrEqual(19);
    expect(una.length).toBeLessThanOrEqual(21);
    expect(met.ultimos(60).length).toBe(todas.length);
    expect(met.ultimos(Number.NaN).length).toBe(todas.length);
    expect(met.ultimos(Number.POSITIVE_INFINITY).length).toBe(todas.length);
  });

  it('una muestra en curso al pausar no se emite ni se guarda', async () => {
    vi.useFakeTimers();
    let soltar: () => void = () => undefined;
    const met = crear({
      consultar: () =>
        new Promise<MuestraPlataforma>((r) => {
          soltar = () => r({ procesos: [], red: null });
        }),
    });
    const vistas: number[] = [];
    eventos.on('metricas:muestra', (m) => vistas.push(m.marca));
    met.iniciar();
    await vi.advanceTimersByTimeAsync(10);
    met.pausar();
    soltar();
    await vi.advanceTimersByTimeAsync(10);
    expect(vistas).toEqual([]);
    expect(met.ultimos()).toEqual([]);
  });
});

/* ───────────── Registros ───────────── */

function sitio(p: Partial<Sitio> & { id: string }): Sitio {
  return SitioSchema.parse({
    nombre: p.id,
    dominio: `${p.id}.test`,
    carpeta: 'C:\\no-existe',
    tipo: 'estatico',
    ...p,
  });
}

describe('Registros', () => {
  let base: string;
  let rutas: Rutas;
  let eventos: Eventos<EventosNucleo>;
  let sitios: Sitio[];
  let registros: Registros;
  let recibidas: { id: string; lineas: string[] }[];

  const lineasDe = (id: string): string[] =>
    recibidas.filter((r) => r.id === id).flatMap((r) => r.lineas);

  beforeEach(async () => {
    base = await carpetaTemporal('pel-reg-');
    rutas = new Rutas(base);
    await rutas.asegurar();
    eventos = new Eventos<EventosNucleo>();
    sitios = [];
    recibidas = [];
    eventos.on('registro:lineas', (r) => recibidas.push(r));
    registros = new Registros({
      rutas,
      eventos,
      leerSitios: async () => sitios,
      rutaLogProceso: (s, p) => rutas.logs('proyectos', `${s}-${p}.log`),
      intervaloMs: 25,
    });
  });
  afterEach(() => registros.cerrar());

  describe('fuentes', () => {
    it('nginx, PHP, servicios, túneles, procesos y laravel.log por sitio', async () => {
      await writeFile(rutas.logs('nginx.log'), '');
      await writeFile(rutas.logs('nginx-error.log'), '');
      await writeFile(rutas.logs('php-8.4.log'), '');
      await writeFile(rutas.logs('postgresql.log'), '');
      await writeFile(rutas.logs('mysql-8.4.log'), '');
      await writeFile(rutas.logs('no-es-log.txt'), '');
      await writeFile(rutas.logs('tuneles', 'tunel-tienda.log'), '');
      await writeFile(rutas.logs('tuneles', 'tunel-tienda.salida.log'), '');
      const carpeta = join(base, 'Mi Tienda');
      sitios = [
        sitio({
          id: 'tienda',
          tipo: 'laravel',
          carpeta,
          procesos: [{ id: 'vite', comando: ['npm', 'run', 'dev'] } as never],
        }),
        sitio({ id: 'blog', tipo: 'estatico' }),
      ];
      const f = await registros.fuentes();
      const porId = new Map(f.map((x) => [x.id, x]));
      expect([...porId.keys()].sort()).toEqual(
        [
          'nginx',
          'nginx:error',
          'php:8.4',
          'servicio:postgresql',
          'servicio:mysql-8.4',
          'tunel:tienda',
          'tunel:tienda:salida',
          'sitio:tienda:acceso',
          'sitio:tienda:error',
          'sitio:blog:acceso',
          'sitio:blog:error',
          'proy-tienda-vite',
          'laravel:tienda',
        ].sort(),
      );
      expect(porId.get('sitio:tienda:acceso')!.ruta).toBe(
        rutas.logs('sitios', 'tienda.access.log'),
      );
      expect(porId.get('sitio:blog:error')!.ruta).toBe(rutas.logs('sitios', 'blog.error.log'));
      expect(porId.get('proy-tienda-vite')!.ruta).toBe(rutas.logs('proyectos', 'tienda-vite.log'));
      expect(porId.get('laravel:tienda')!.ruta).toBe(
        join(carpeta, 'storage', 'logs', 'laravel.log'),
      );
      expect(porId.get('tunel:tienda')!.grupo).toBe('tunel');
      expect(porId.get('php:8.4')!.grupo).toBe('php');
      expect(porId.get('laravel:tienda')!.sitioId).toBe('tienda');
    });

    it('laravel.log que por un enlace sale de la carpeta del sitio no se lista', async () => {
      const fuera = join(base, 'fuera');
      await mkdir(fuera, { recursive: true });
      await writeFile(join(fuera, 'laravel.log'), 'secreto\n');
      const carpeta = join(base, 'proyecto');
      await mkdir(join(carpeta, 'storage'), { recursive: true });
      await symlink(fuera, join(carpeta, 'storage', 'logs'), 'junction');
      const buena = join(base, 'buena');
      await mkdir(join(buena, 'storage', 'logs'), { recursive: true });
      sitios = [
        sitio({ id: 'malo', tipo: 'laravel', carpeta }),
        sitio({ id: 'bueno', tipo: 'laravel', carpeta: buena }),
      ];
      const ids = (await registros.fuentes()).map((f) => f.id);
      expect(ids).not.toContain('laravel:malo');
      expect(ids).toContain('laravel:bueno');
      await expect(registros.leerFinal('laravel:malo')).rejects.toThrow(/no existe/i);
    });

    it('sin carpeta de logs devuelve solo las fuentes de los sitios', async () => {
      const r = new Registros({
        rutas: new Rutas(join(base, 'no-existe')),
        eventos,
        leerSitios: async () => [sitio({ id: 'a' })],
        rutaLogProceso: () => 'x',
      });
      expect((await r.fuentes()).map((f) => f.id).sort()).toEqual([
        'sitio:a:acceso',
        'sitio:a:error',
      ]);
    });
  });

  describe('seguir', () => {
    let ruta: string;
    const ID = 'servicio:redis';

    beforeEach(async () => {
      ruta = rutas.logs('redis.log');
      await writeFile(ruta, 'vieja 1\nvieja 2\n');
    });

    it('id desconocido: error en español', async () => {
      await expect(registros.seguir('nada')).rejects.toThrow(/no existe/i);
      await expect(registros.leerFinal('../../etc')).rejects.toThrow(/no existe/i);
    });

    it('emite solo lo anexado, con las líneas partidas guardadas hasta el salto', async () => {
      const dejar = await registros.seguir(ID);
      await appendFile(ruta, 'uno\r\ndos\ntr');
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['uno', 'dos']));
      await appendFile(ruta, 'es\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['uno', 'dos', 'tres']));
      dejar();
    });

    it('UTF-8 seguro aunque un carácter quede partido entre dos lecturas', async () => {
      const dejar = await registros.seguir(ID);
      const n = Buffer.from('año ñ\n', 'utf8');
      await appendFile(ruta, n.subarray(0, 2)); // "a" + primer byte de "ñ"
      await new Promise((r) => setTimeout(r, 80));
      await appendFile(ruta, n.subarray(2));
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['año ñ']));
      dejar();
    });

    it('truncado: si el archivo se achica vuelve a leer desde el principio', async () => {
      const dejar = await registros.seguir(ID);
      await writeFile(ruta, 'n\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['n']));
      dejar();
    });

    it('rotación: archivo reemplazado por otro se reabre desde el principio', async () => {
      const dejar = await registros.seguir(ID);
      await rename(ruta, ruta + '.1');
      await writeFile(ruta, 'nuevo uno, mucho más largo que el original de antes\nnuevo 2\n');
      await vi.waitFor(() =>
        expect(lineasDe(ID)).toEqual([
          'nuevo uno, mucho más largo que el original de antes',
          'nuevo 2',
        ]),
      );
      await appendFile(ruta, 'nuevo 3\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toHaveLength(3));
      dejar();
    });

    it('un archivo que aún no existe se sigue cuando aparece', async () => {
      const dejar = await registros.seguir('nginx-x').catch(() => null);
      expect(dejar).toBeNull();
      sitios = [sitio({ id: 'tienda' })];
      const dejar2 = await registros.seguir('sitio:tienda:error');
      await writeFile(rutas.logs('sitios', 'tienda.error.log'), 'primera\n');
      await vi.waitFor(() => expect(lineasDe('sitio:tienda:error')).toEqual(['primera']));
      dejar2();
    });

    it('sanea las líneas (los logs pueden traer secretos)', async () => {
      const dejar = await registros.seguir(ID);
      await appendFile(ruta, 'DB_PASSWORD=supersecreta\nmysql://root:clave@localhost/x\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toHaveLength(2));
      expect(lineasDe(ID).join('\n')).not.toMatch(/supersecreta|clave/);
      dejar();
    });

    it('limita el lote por evento', async () => {
      const dejar = await registros.seguir(ID);
      const muchas = Array.from({ length: 1200 }, (_, i) => `l${i}`).join('\n') + '\n';
      await appendFile(ruta, muchas);
      await vi.waitFor(() => expect(lineasDe(ID)).toHaveLength(1200));
      expect(recibidas.every((r) => r.lineas.length <= 500)).toBe(true);
      expect(lineasDe(ID)[1199]).toBe('l1199');
      dejar();
    });

    it('varios seguidores del mismo id comparten el seguimiento; dejar es idempotente', async () => {
      const a = await registros.seguir(ID);
      const b = await registros.seguir(ID);
      await appendFile(ruta, 'x\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['x']));
      a();
      a();
      await appendFile(ruta, 'y\n');
      await vi.waitFor(() => expect(lineasDe(ID)).toEqual(['x', 'y']));
      b();
      await appendFile(ruta, 'z\n');
      await new Promise((r) => setTimeout(r, 150));
      expect(lineasDe(ID)).toEqual(['x', 'y']);
    });
  });

  describe('seguir (casos límite)', () => {
    it('una línea de más de 64 KB se emite en partes sin partir un carácter UTF-8', async () => {
      const ruta = rutas.logs('redis.log');
      await writeFile(ruta, '');
      const dejar = await registros.seguir('servicio:redis');
      // 'a' + 'ñ'×70000 (140 KB): el corte a los 128 KB cae a mitad de una 'ñ'.
      await appendFile(ruta, 'a' + 'ñ'.repeat(70_000) + '\nfin\n');
      await vi.waitFor(() => expect(lineasDe('servicio:redis').at(-1)).toBe('fin'));
      const lineas = lineasDe('servicio:redis');
      expect(lineas.length).toBeGreaterThanOrEqual(3);
      expect(lineas.join('')).not.toContain('\uFFFD');
      dejar();
    });

    it('un error al abrir que se repite se registra una sola vez', async () => {
      const ruta = rutas.logs('redis.log');
      await writeFile(ruta, '');
      let fallar = false;
      const errores = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const r = new Registros({
        rutas,
        eventos,
        leerSitios: async () => [],
        rutaLogProceso: () => 'x',
        intervaloMs: 10,
        abrir: (async (p: string, f: string) => {
          if (fallar) throw Object.assign(new Error('ocupado'), { code: 'EBUSY' });
          return open(p, f);
        }) as never,
      });
      try {
        const dejar = await r.seguir('servicio:redis');
        fallar = true;
        await new Promise((res) => setTimeout(res, 150));
        expect(errores).toHaveBeenCalledTimes(1);
        fallar = false;
        await appendFile(ruta, 'ok\n');
        await vi.waitFor(() => expect(lineasDe('servicio:redis')).toEqual(['ok']));
        fallar = true;
        await new Promise((res) => setTimeout(res, 100));
        expect(errores).toHaveBeenCalledTimes(2);
        dejar();
      } finally {
        r.cerrar();
        errores.mockRestore();
      }
    });

    it('tras cerrar, seguir (posterior o pendiente) no crea colas', async () => {
      const ruta = rutas.logs('redis.log');
      await writeFile(ruta, '');
      const pendiente = registros.seguir('servicio:redis');
      registros.cerrar();
      await expect(pendiente).rejects.toThrow(/cerrado/i);
      await expect(registros.seguir('servicio:redis')).rejects.toThrow(/cerrado/i);
      await appendFile(ruta, 'x\n');
      await new Promise((res) => setTimeout(res, 120));
      expect(recibidas).toEqual([]);
    });
  });

  describe('leerFinal', () => {
    it('una línea en cp1252 (Python sin UTF-8) se lee sin caracteres rotos (QA 6)', async () => {
      const ruta = rutas.logs('redis.log');
      await mkdir(rutas.logs(), { recursive: true });
      await writeFile(
        ruta,
        Buffer.concat([
          Buffer.from('Aplicando migraci', 'latin1'),
          Buffer.from([0xf3]),
          Buffer.from('n\nñandú utf8\n', 'utf8'),
        ]),
      );
      expect(await registros.leerFinal('servicio:redis')).toEqual([
        'Aplicando migración',
        'ñandú utf8',
      ]);
      expect(decodificarLinea(Buffer.from([0x63, 0x61, 0x66, 0xe9]))).toBe('café');
    });

    it('las últimas N líneas, saneadas', async () => {
      const ruta = rutas.logs('redis.log');
      await writeFile(ruta, 'a\nb\npassword=xyz\nd');
      expect(await registros.leerFinal('servicio:redis', 2)).toEqual(['password=***', 'd']);
      expect(await registros.leerFinal('servicio:redis')).toEqual(['a', 'b', 'password=***', 'd']);
    });

    it('archivo grande: solo lee el final', async () => {
      const ruta = rutas.logs('redis.log');
      await mkdir(rutas.logs(), { recursive: true });
      const linea = 'x'.repeat(99) + '\n';
      await writeFile(ruta, linea.repeat(60_000) + 'ñandú final\n'); // ~6 MB
      const r = await registros.leerFinal('servicio:redis', 3);
      expect(r).toEqual(['x'.repeat(99), 'x'.repeat(99), 'ñandú final']);
      const muchas = await registros.leerFinal('servicio:redis', 100_000);
      expect(muchas.length).toBeLessThanOrEqual(5000);
      expect(muchas.at(-1)).toBe('ñandú final');
    });

    it('archivo inexistente: sin líneas', async () => {
      sitios = [sitio({ id: 'a' })];
      expect(await registros.leerFinal('sitio:a:acceso')).toEqual([]);
    });
  });
});

describe('agruparLlamadas (avisos de fs.watch)', () => {
  afterEach(() => vi.useRealTimers());

  it('una ráfaga de avisos se convierte en una sola llamada tras la espera', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const g = agruparLlamadas(fn, 100);
    for (let i = 0; i < 50; i++) g.llamar();
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    g.llamar();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('un flujo continuo de avisos no la posterga para siempre', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const g = agruparLlamadas(fn, 100);
    for (let i = 0; i < 30; i++) {
      g.llamar();
      vi.advanceTimersByTime(20);
    }
    // 600 ms de avisos cada 20 ms: se revisa al menos cada 100 ms.
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(fn.mock.calls.length).toBeLessThanOrEqual(7);
  });

  it('cancelar descarta el aviso pendiente', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const g = agruparLlamadas(fn, 100);
    g.llamar();
    g.cancelar();
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
  });
});
