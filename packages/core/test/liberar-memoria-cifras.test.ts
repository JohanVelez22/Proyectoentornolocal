import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { codificarComando } from '../src/plataforma/hostsAdmin';
import { interpretarEstadoPantalla, SCRIPT_ESTADO_PANTALLA } from '../src/plataforma/memoriaWin';
import {
  interpretarProcesosUsuario,
  scriptProcesosUsuario,
} from '../src/plataforma/procesosUsuarioWin';
import type { ProcesoUsuario } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';
import { LiberadorMemoria } from '../src/sistema/liberarMemoria';
import { analizarPowerShell, hayPowerShell } from './soporte/parserPowerShell';

const MB = 1024 * 1024;

const proc = (p: Partial<ProcesoUsuario> & { pid: number; nombre: string }): ProcesoUsuario => ({
  ruta: `C:\\Users\\yo\\AppData\\Local\\${p.nombre}`,
  inicio: `${p.pid}0000`,
  memoria: 500 * MB,
  ventana: true,
  sesion: 1,
  usuario: 'S-1-5-21-yo',
  ...p,
});

function escenario(procesos: ProcesoUsuario[]): PlataformaFalsa {
  const falsa = new PlataformaFalsa();
  falsa.prohibirMatar = true;
  falsa.procesosUsuario = procesos;
  return falsa;
}

const liberador = (falsa: PlataformaFalsa) =>
  new LiberadorMemoria({
    plataforma: falsa,
    rutasPropias: () => ['C:\\Apps\\WolfCore'],
    pidApp: 220,
    pidsSupervisados: () => [],
    esperar: async () => undefined,
  });

describe('I1: las cifras de la estimación (privada o «hasta ≈») y de Profundo', () => {
  const lista = (privadas: (number | null | undefined)[]): ProcesoUsuario[] => [
    proc({
      pid: 220,
      nombre: 'WolfCore Dev.exe',
      ruta: 'C:\\Apps\\WolfCore\\WolfCore Dev.exe',
      memoria: 300 * MB,
      memoriaPrivada: privadas[0],
    }),
    proc({ pid: 100, nombre: 'chrome.exe', memoria: 900 * MB, memoriaPrivada: privadas[1] }),
    proc({ pid: 101, nombre: 'Code.exe', memoria: 600 * MB, memoriaPrivada: privadas[2] }),
  ];

  it('con el conjunto de trabajo privado de todos los procesos, es una estimación (privada)', async () => {
    const e = await liberador(escenario(lista([200 * MB, 400 * MB, 250 * MB]))).estimar();
    expect(e.niveles.liviano).toMatchObject({ bytes: 200 * MB, tipo: 'privada', procesos: 1 });
    expect(e.niveles.moderado).toMatchObject({ bytes: 850 * MB, tipo: 'privada', procesos: 3 });
  });

  it('si no se pudo leer el privado de alguno, es un tope: «hasta ≈» con el total', async () => {
    const e = await liberador(escenario(lista([200 * MB, null, 250 * MB]))).estimar();
    expect(e.niveles.liviano).toMatchObject({ bytes: 200 * MB, tipo: 'privada' });
    expect(e.niveles.moderado).toMatchObject({ bytes: 1800 * MB, tipo: 'hasta' });
    const sin = await liberador(escenario(lista([undefined, undefined, undefined]))).estimar();
    expect(sin.niveles.moderado).toMatchObject({ bytes: 1800 * MB, tipo: 'hasta' });
  });

  it('Profundo da dos cifras: la de los procesos y la lista de espera, que pasa a memoria libre', async () => {
    const falsa = escenario(lista([200 * MB, 400 * MB, 250 * MB]));
    const e = await liberador(falsa).estimar();
    expect(e.niveles.profundo).toMatchObject({
      bytes: 850 * MB,
      tipo: 'privada',
      requiereAdmin: true,
    });
    expect(e.listaEspera).toBe(6 * 1024 * MB);
  });

  it('el resultado mide el aumento de la memoria disponible Y el de la libre', async () => {
    const falsa = escenario(lista([200 * MB, 400 * MB, 250 * MB]));
    const antes = (await falsa.memoriaDelSistema())!;
    const r = await liberador(falsa).liberar('profundo', true);
    expect(r.aumentoDisponible).toBe(r.despues!.disponible - antes.disponible);
    // La purga pasa la lista de espera (6 GB) a libre.
    expect(r.aumentoLibre).toBe(r.despues!.libre! - antes.libre!);
    expect(r.aumentoLibre!).toBeGreaterThanOrEqual(6 * 1024 * MB);
    expect(r.antes!.listaEspera).toBe(6 * 1024 * MB);
  });

  it('sin lectura de la memoria libre, su aumento es null y no se inventa', async () => {
    const falsa = escenario(lista([200 * MB, 400 * MB, 250 * MB]));
    falsa.memoria = {
      total: 16 * 1024 * MB,
      disponible: 8 * 1024 * MB,
      libre: null,
      listaEspera: null,
    };
    const r = await liberador(falsa).liberar('liviano', true);
    expect(r.aumentoLibre).toBeNull();
    expect(r.aumentoDisponible).not.toBeNull();
  });
});

describe('Menor 10: los procesos elevados sin ventana tampoco entran', () => {
  it('un proceso marcado como elevado queda fuera aunque no tenga ventana', async () => {
    const falsa = escenario([
      proc({ pid: 220, nombre: 'WolfCore Dev.exe', ruta: 'C:\\Apps\\WolfCore\\WolfCore Dev.exe' }),
      proc({
        pid: 100,
        nombre: 'servicio-elevado.exe',
        ventana: false,
        elevado: true,
        memoria: 900 * MB,
      }),
      proc({ pid: 101, nombre: 'normal.exe', ventana: false, memoria: 700 * MB }),
    ]);
    const e = await liberador(falsa).estimar();
    expect(e.niveles.moderado.bytes).toBe(1200 * MB);
    expect(e.niveles.moderado.procesos).toBe(2);
  });

  it('el script marca `elevado` para TODOS los procesos (con o sin ventana) y lee el privado', () => {
    const s = scriptProcesosUsuario(1);
    expect(s).not.toContain('if ($v -eq 1) { try');
    expect(s).toContain('Win32_PerfRawData_PerfProc_Process');
    expect(s).toContain('WorkingSetPrivate');
    expect(s).toContain('.Handle');
  });

  it.skipIf(!hayPowerShell())('el script de procesos es PowerShell válido', () => {
    const [a] = analizarPowerShell([scriptProcesosUsuario(1)]);
    expect(a!.errores).toEqual([]);
  });

  it('el intérprete lee la columna del privado (vacía = null)', () => {
    const b = (t: string): string => Buffer.from(t, 'utf8').toString('base64');
    const l = interpretarProcesosUsuario(
      [
        `100|1|5|900|400|1|0|0|${b('a.exe')}|${b('C:\\a.exe')}`,
        `101|1|5|900||0|0|1|${b('b.exe')}|${b('C:\\b.exe')}`,
      ].join('\n'),
    );
    expect(l[0]).toMatchObject({ memoria: 900, memoriaPrivada: 400, elevado: false });
    expect(l[1]).toMatchObject({ memoriaPrivada: null, elevado: true, ventana: false });
  });
});

describe('I2: aviso de juego o pantalla completa (SHQueryUserNotificationState)', () => {
  it('la estimación trae el estado de la pantalla (plataforma falsa)', async () => {
    for (const estado of ['libre', 'pantalla-completa', 'ocupado', 'presentacion', null] as const) {
      const falsa = escenario([]);
      falsa.pantalla = estado;
      expect((await liberador(falsa).estimar()).pantalla).toBe(estado);
    }
  });

  it('si la lectura falla, es null (no se avisa de lo que no se sabe) y el resto se calcula', async () => {
    const falsa = escenario([]);
    falsa.estadoPantalla = async () => {
      throw new Error('x');
    };
    const e = await liberador(falsa).estimar();
    expect(e.pantalla).toBeNull();
    expect(e.sistema).not.toBeNull();
  });

  it('QUNS_BUSY, QUNS_RUNNING_D3D_FULL_SCREEN y QUNS_PRESENTATION_MODE avisan; el resto no', () => {
    const v = (n: number) => interpretarEstadoPantalla(`PANTALLA|${n}\r\n`);
    expect(v(2)).toBe('ocupado');
    expect(v(3)).toBe('pantalla-completa');
    expect(v(4)).toBe('presentacion');
    for (const n of [1, 5, 6, 7]) expect(v(n)).toBe('libre');
    for (const raro of ['', 'PANTALLA|0', 'PANTALLA|8', 'PANTALLA|x', 'otra|3', '3']) {
      expect(interpretarEstadoPantalla(raro)).toBeNull();
    }
  });

  it('Windows: lee con la PowerShell de System32, sin elevar; da null si falla', async () => {
    const llamadas: string[][] = [];
    const bien = new PlataformaWindows(
      async (_c, args) => {
        llamadas.push(args);
        return { codigo: 0, stdout: 'PANTALLA|3\n', stderr: '' };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    expect(await bien.estadoPantalla()).toBe('pantalla-completa');
    expect(llamadas[0]).toContain('-EncodedCommand');
    expect(llamadas[0]).not.toContain('-Command');
    const mal = new PlataformaWindows(async () => ({ codigo: 1, stdout: '', stderr: 'x' }));
    expect(await mal.estadoPantalla()).toBeNull();
  });

  it.skipIf(!hayPowerShell())('el script es PowerShell válido y sin Add-Type', () => {
    const [a] = analizarPowerShell([SCRIPT_ESTADO_PANTALLA]);
    expect(a!.errores).toEqual([]);
    expect(SCRIPT_ESTADO_PANTALLA).not.toMatch(/Add-Type/);
    expect(SCRIPT_ESTADO_PANTALLA).toContain('SHQueryUserNotificationState');
  });

  it.skipIf(process.platform !== 'win32' || !hayPowerShell())(
    'con PowerShell real (solo lee): contesta un estado conocido',
    () => {
      const r = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-EncodedCommand',
          codificarComando(SCRIPT_ESTADO_PANTALLA),
        ],
        { encoding: 'utf8', windowsHide: true, timeout: 60_000 },
      );
      expect(r.status).toBe(0);
      expect(interpretarEstadoPantalla(r.stdout)).not.toBeNull();
    },
  );
});
