import { describe, expect, it, vi } from 'vitest';
import { completarPlataforma } from '../src/plataforma';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { SALIDA_COPIA } from '../src/plataforma/hostsAdmin';
import { RESPALDO_MEMORIA_NEUTRO } from '../src/plataforma/respaldoMemoria';
import { SALIDA_QUITAR_CARPETA } from '../src/plataforma/redWin';
import type { Ejecutor } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';

/** D53: la plataforma de Windows con un ejecutor falso: ninguna prueba toca la red ni eleva nada. */
const ENTORNO = { SystemRoot: 'C:\\Windows' } as NodeJS.ProcessEnv;
const RUTA = 'D:/Datos/Fotos';
const POWERSHELL = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

const scriptDe = (args: string[]): string => {
  const b64 = /-EncodedCommand ([A-Za-z0-9+/=]+)/.exec(args.join(' '))?.[1] ?? '';
  return Buffer.from(b64, 'base64').toString('utf16le');
};
const b64 = (v: unknown): string => Buffer.from(JSON.stringify(v), 'utf8').toString('base64');

interface Llamada {
  cmd: string;
  args: string[];
  senal?: AbortSignal;
}

function crear(
  respuesta: (
    c: Llamada,
  ) =>
    | { codigo: number; stdout?: string; stderr?: string }
    | Promise<{ codigo: number; stdout?: string; stderr?: string }>,
) {
  const llamadas: Llamada[] = [];
  const ejecutor: Ejecutor = async (cmd, args, o) => {
    const c: Llamada = { cmd, args, ...(o?.senal ? { senal: o.senal } : {}) };
    llamadas.push(c);
    const r = await respuesta(c);
    return { codigo: r.codigo, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  return { p: new PlataformaWindows(ejecutor, undefined, { entorno: ENTORNO }), llamadas };
}

describe('lecturas de red en Windows (D53)', () => {
  it('PowerShell por su ruta absoluta de System32 con -EncodedCommand, y solo lectura', async () => {
    const { p, llamadas } = crear(() => ({
      codigo: 0,
      stdout: b64([{ n: 'Docs', r: 'C:\\Docs', d: '', t: 'FileSystemDirectory', s: false, u: 0 }]),
    }));
    expect(await p.carpetasCompartidas()).toHaveLength(1);
    await p.adaptadoresRed();
    await p.vecinosRed();
    expect(llamadas).toHaveLength(3);
    for (const l of llamadas) {
      expect(l.cmd).toBe(POWERSHELL);
      expect(l.args).toContain('-EncodedCommand');
      expect(scriptDe(l.args)).not.toMatch(
        /\b(Remove|Set|New|Add|Disable|Enable|Start|Stop|Invoke)-/,
      );
    }
    expect(scriptDe(llamadas[0]!.args)).toContain('Get-SmbShare');
    expect(scriptDe(llamadas[1]!.args)).toContain('Get-NetIPAddress');
    expect(scriptDe(llamadas[1]!.args)).toContain('Get-NetConnectionProfile');
    expect(scriptDe(llamadas[1]!.args)).toContain('Get-NetAdapter');
    expect(scriptDe(llamadas[2]!.args)).toContain('Get-NetNeighbor');
  });

  it('un fallo de PowerShell da null, nunca una excepción', async () => {
    const { p } = crear(() => ({ codigo: 1, stderr: 'acceso denegado' }));
    expect(await p.carpetasCompartidas()).toBeNull();
    expect(await p.adaptadoresRed()).toBeNull();
    expect(await p.vecinosRed()).toBeNull();
    const roto = new PlataformaWindows(
      async () => {
        throw new Error('boom');
      },
      undefined,
      { entorno: ENTORNO },
    );
    expect(await roto.vecinosRed()).toBeNull();
  });
});

describe('ping y net view en Windows (D53)', () => {
  it('ping.exe por ruta absoluta, sin shell, con -4, un tope de paquetes y la señal', async () => {
    const { p, llamadas } = crear(() => ({
      codigo: 0,
      stdout:
        'Reply from 192.168.1.5: bytes=32 time=2ms TTL=64\nReply from 192.168.1.5: bytes=32 time=4ms TTL=64',
    }));
    const ctl = new AbortController();
    const r = await p.pingEquipo('192.168.1.5', { intentos: 2, plazoMs: 800, senal: ctl.signal });
    expect(r).toMatchObject({ enviados: 2, recibidos: 2, tiemposMs: [2, 4], cancelado: false });
    expect(llamadas[0]).toMatchObject({
      cmd: 'C:\\Windows\\System32\\ping.exe',
      args: ['-4', '-n', '2', '-w', '800', '192.168.1.5'],
    });
    expect(llamadas[0]!.senal).toBe(ctl.signal);
  });

  it('rechaza IP públicas, nombres y más de 10 paquetes SIN ejecutar nada', async () => {
    const { p, llamadas } = crear(() => ({ codigo: 0 }));
    const base = { intentos: 4, plazoMs: 800 };
    await expect(p.pingEquipo('8.8.8.8', base)).rejects.toMatchObject({
      codigo: 'red.equipo_no_valido',
    });
    await expect(p.pingEquipo('pc-sala', base)).rejects.toMatchObject({
      codigo: 'red.equipo_no_valido',
    });
    await expect(p.pingEquipo('192.168.1.5 -t', base)).rejects.toMatchObject({
      codigo: 'red.equipo_no_valido',
    });
    await expect(p.pingEquipo('192.168.1.5', { ...base, intentos: 11 })).rejects.toMatchObject({
      codigo: 'red.equipo_no_valido',
    });
    await expect(p.pingEquipo('192.168.1.5', { ...base, intentos: 0 })).rejects.toMatchObject({
      codigo: 'red.equipo_no_valido',
    });
    expect(llamadas).toHaveLength(0);
  });

  it('cancelar el ping devuelve cancelado', async () => {
    const ctl = new AbortController();
    const { p } = crear(() => {
      ctl.abort();
      return { codigo: 1 };
    });
    const r = await p.pingEquipo('192.168.1.5', { intentos: 4, plazoMs: 800, senal: ctl.signal });
    expect(r.cancelado).toBe(true);
    const antes = new AbortController();
    antes.abort();
    const { p: p2, llamadas } = crear(() => ({ codigo: 0 }));
    expect(
      (await p2.pingEquipo('10.0.0.2', { intentos: 4, plazoMs: 800, senal: antes.signal }))
        .cancelado,
    ).toBe(true);
    expect(llamadas).toHaveLength(0);
  });

  it('net.exe view por ruta absoluta con la UNC de la IP, y valida la IP antes', async () => {
    const salida = [
      'Shared resources at \\\\192.168.1.5',
      '',
      'Share name  Type  Used as  Comment',
      '-------------------------------------------------------------------------------',
      'Docs        Disk',
      'The command completed successfully.',
    ].join('\r\n');
    const { p, llamadas } = crear(() => ({ codigo: 0, stdout: salida }));
    expect(await p.recursosDeEquipo('192.168.1.5')).toEqual({
      ok: true,
      recursos: [{ nombre: 'Docs', tipo: 'Disk', comentario: '' }],
    });
    expect(llamadas[0]).toMatchObject({
      cmd: 'C:\\Windows\\System32\\net.exe',
      args: ['view', '\\\\192.168.1.5'],
    });
    for (const mala of ['8.8.8.8', 'servidor', '192.168.1.5\\C$', '192.168.1.5 /all', '']) {
      await expect(p.recursosDeEquipo(mala), mala).rejects.toMatchObject({
        codigo: 'red.equipo_no_valido',
      });
    }
    expect(llamadas).toHaveLength(1);
  });

  it('net view fallido da el motivo, sin excepciones', async () => {
    const { p } = crear(() => ({ codigo: 2, stdout: 'Error de sistema 5.\r\nAcceso denegado.' }));
    expect(await p.recursosDeEquipo('192.168.1.5')).toEqual({ ok: false, motivo: 'denegado' });
    const caido = new PlataformaWindows(
      async () => {
        throw new Error('x');
      },
      undefined,
      { entorno: ENTORNO },
    );
    expect(await caido.recursosDeEquipo('10.0.0.3')).toEqual({ ok: false, motivo: 'error' });
  });
});

describe('dejar de compartir con elevación (D53)', () => {
  it('el PowerShell exterior va por ruta absoluta; el script elevado trae plazo, nombre citado y revalida la carpeta', async () => {
    let args: string[] = [];
    let cmd = '';
    const { p } = crear((c) => {
      cmd = c.cmd;
      args = c.args;
      return { codigo: 0 };
    });
    const antes = Date.now();
    expect(await p.dejarDeCompartir('Fotos', RUTA)).toEqual({ ok: true });
    expect(cmd).toBe(POWERSHELL);
    // El exterior pide el UAC (runas) y lleva el script elevado en Base64.
    const exterior = args.join(' ');
    expect(exterior).toContain('runas');
    const interno = Buffer.from(
      /-EncodedCommand ([A-Za-z0-9+/=]+)/.exec(exterior)![1]!,
      'base64',
    ).toString('utf16le');
    expect(interno).toContain("Remove-SmbShare -Name 'Fotos' -Force");
    // La carpeta que vio la persona: la misma ruta, no solo el nombre.
    expect(interno).toContain("[string]$s.Path -ne 'D:/Datos/Fotos'");
    expect(interno).toContain('@($s).Count -ne 1');
    expect(interno).toContain('$s.Special');
    const limite = Number(/ToUnixTimeMilliseconds\(\) -gt (\d+)/.exec(interno)?.[1]);
    expect(limite).toBeGreaterThan(antes);
    expect(limite).toBeLessThanOrEqual(antes + 90_000);
  });

  it('rechaza administrativas e inválidas ANTES de abrir ningún UAC', async () => {
    const { p, llamadas } = crear(() => ({ codigo: 0 }));
    for (const mala of ['C$', 'ADMIN$', 'IPC$', 'print$', '', 'a/b', '..', "x'; calc; '", 'a\nb']) {
      await expect(p.dejarDeCompartir(mala, RUTA), mala).rejects.toMatchObject({
        codigo: 'red.recurso_no_valido',
      });
    }
    expect(llamadas).toHaveLength(0);
  });

  it('una ruta vacía, con control o demasiado larga se rechaza antes de abrir ningún UAC', async () => {
    const { p, llamadas } = crear(() => ({ codigo: 0 }));
    for (const mala of ['', 'D:/a' + String.fromCharCode(10) + 'b', 'x'.repeat(1001)]) {
      await expect(p.dejarDeCompartir('Fotos', mala)).rejects.toMatchObject({
        codigo: 'red.carpeta_no_valida',
      });
    }
    expect(llamadas).toHaveLength(0);
  });

  it('si el script elevado ve otra carpeta (44) no se quita y es un error; si vence el plazo exterior, es plazo', async () => {
    const r = await crear(() => ({ codigo: SALIDA_QUITAR_CARPETA.cambio })).p.dejarDeCompartir(
      'Fotos',
      RUTA,
    );
    expect(r).toMatchObject({
      ok: false,
      motivo: 'error',
      detalle: 'la carpeta compartida cambió',
    });
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const { p } = crear(() => {
        // Se corta el proceso por el plazo exterior (90 s): sin código propio.
        vi.setSystemTime(Date.now() + 90_000);
        return { codigo: 1, stderr: 'Command failed' };
      });
      expect(await p.dejarDeCompartir('Fotos', RUTA)).toEqual({ ok: false, motivo: 'tiempo' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancelar el UAC, vencer el plazo, no permitida, ya no existe y fallo', async () => {
    const con = (codigo: number) => crear(() => ({ codigo })).p.dejarDeCompartir('Fotos', RUTA);
    expect(await con(SALIDA_COPIA.cancelado)).toEqual({ ok: false, motivo: 'cancelado' });
    expect(await con(SALIDA_QUITAR_CARPETA.vencido)).toEqual({ ok: false, motivo: 'tiempo' });
    expect(await con(SALIDA_QUITAR_CARPETA.noExiste)).toEqual({ ok: true });
    expect(await con(SALIDA_QUITAR_CARPETA.noPermitida)).toMatchObject({
      ok: false,
      motivo: 'denegado',
    });
    expect(await con(SALIDA_QUITAR_CARPETA.fallo)).toMatchObject({ ok: false, motivo: 'error' });
  });

  it('cerrar la app mientras el UAC espera corta el proceso (nada colgado) y avisa de plazo', async () => {
    let enMarcha!: () => void;
    const arrancada = new Promise<void>((r) => (enMarcha = r));
    const ejecutor: Ejecutor = (_c, _a, o) =>
      new Promise((resolve) => {
        o?.senal?.addEventListener('abort', () =>
          resolve({ codigo: 1, stdout: '', stderr: 'abortado' }),
        );
        enMarcha();
      });
    const p = new PlataformaWindows(ejecutor, undefined, { entorno: ENTORNO });
    const quitar = p.dejarDeCompartir('Fotos', RUTA);
    await arrancada;
    p.cancelarEscriturasAdmin();
    expect(await quitar).toEqual({ ok: false, motivo: 'tiempo' });
  });

  it('con el UAC ya cancelado por cerrar la app, no se abre otro', async () => {
    let llamadas = 0;
    const p = new PlataformaWindows(
      async () => {
        llamadas++;
        return { codigo: 0, stdout: '', stderr: '' };
      },
      undefined,
      { entorno: ENTORNO },
    );
    const quitar = p.dejarDeCompartir('Fotos', RUTA);
    p.cancelarEscriturasAdmin();
    expect(await quitar).toEqual({ ok: false, motivo: 'tiempo' });
    expect(llamadas).toBe(0);
  });
});

describe('plataforma falsa y respaldo neutro (D53)', () => {
  it('fuera de Windows el respaldo neutro no lee la red ni cambia nada', async () => {
    const parcial = new PlataformaFalsa();
    const completa = completarPlataforma(
      Object.create(null, {}) as never,
      new PlataformaFalsa() as never,
      'linux',
    );
    expect(await completa.carpetasCompartidas()).toBeNull();
    expect(await completa.adaptadoresRed()).toBeNull();
    expect(await completa.vecinosRed()).toBeNull();
    expect(await completa.dejarDeCompartir('Fotos', RUTA)).toMatchObject({
      ok: false,
      motivo: 'error',
    });
    expect(await completa.recursosDeEquipo('10.0.0.1')).toEqual({ ok: false, motivo: 'error' });
    expect(await completa.pingEquipo('10.0.0.1', { intentos: 4, plazoMs: 800 })).toMatchObject({
      recibidos: 0,
    });
    expect(Object.keys(RESPALDO_MEMORIA_NEUTRO)).toContain('carpetasCompartidas');
    expect(parcial).toBeDefined();
  });

  it('la falsa respeta las mismas validaciones y simula el UAC', async () => {
    const f = new PlataformaFalsa();
    f.carpetasCompartidasFalsas = [
      {
        nombre: 'Fotos',
        ruta: RUTA,
        descripcion: '',
        tipo: 'carpeta',
        administrativa: false,
        oculta: false,
        usuarios: 0,
      },
    ];
    await expect(f.dejarDeCompartir('C$', RUTA)).rejects.toBeDefined();
    await expect(f.pingEquipo('8.8.8.8', { intentos: 4, plazoMs: 800 })).rejects.toBeDefined();
    f.uacCancelado = true;
    expect(await f.dejarDeCompartir('Fotos', RUTA)).toEqual({ ok: false, motivo: 'cancelado' });
    expect(f.carpetasQuitadas).toEqual([]);
    f.uacCancelado = false;
    expect(await f.dejarDeCompartir('Fotos', RUTA)).toEqual({ ok: true });
    expect(f.carpetasQuitadas).toEqual(['Fotos']);
    expect(await f.carpetasCompartidas()).toEqual([]);
  });

  it('la falsa no quita una carpeta que ya está en otra ruta (como el script elevado)', async () => {
    const f = new PlataformaFalsa();
    f.carpetasCompartidasFalsas = [
      {
        nombre: 'Fotos',
        ruta: 'E:/Otra',
        descripcion: '',
        tipo: 'carpeta',
        administrativa: false,
        oculta: false,
        usuarios: 0,
      },
    ];
    expect(await f.dejarDeCompartir('Fotos', RUTA)).toMatchObject({ ok: false, motivo: 'error' });
    expect(f.carpetasQuitadas).toEqual([]);
  });
});
