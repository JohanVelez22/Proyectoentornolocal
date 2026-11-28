import { mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { MiRed, type MedidorVelocidad } from '../src/miRed/servicio';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { AdaptadorRed, CarpetaCompartida } from '../src/plataforma/redWin';
import { carpetaTemporal } from './temporales';

const rechaza = async (p: Promise<unknown>, codigo: string): Promise<void> => {
  await expect(p).rejects.toMatchObject({ codigo });
};

const WIFI: AdaptadorRed = {
  indice: 12,
  nombre: 'Wi-Fi',
  ip: '192.168.1.20',
  prefijo: 24,
  predeterminado: true,
  perfil: 'privado',
};

function crear(
  opciones: { adaptadores?: AdaptadorRed[] | null; nombres?: Record<string, string> } = {},
) {
  const falsa = new PlataformaFalsa();
  falsa.adaptadoresFalsos = opciones.adaptadores === undefined ? [WIFI] : opciones.adaptadores;
  falsa.vecinosFalsos = [
    { ip: '192.168.1.1', mac: 'b8:27:eb:12:34:56', estado: 'Reachable', indice: 12 },
    { ip: '192.168.1.40', mac: 'da:a1:19:00:00:01', estado: 'Stale', indice: 12 },
  ];
  const progreso: { hechos: number; total: number }[] = [];
  const fases: string[] = [];
  const servicio = new MiRed({
    plataforma: falsa,
    alEscaneo: (p) => progreso.push(p),
    alVelocidad: (p) => fases.push(p.fase),
    nombreInverso: async (ip) => opciones.nombres?.[ip] ?? null,
  });
  return { falsa, servicio, progreso, fases };
}

describe('Mi red: lectura pasiva (D53)', () => {
  it('lista adaptadores y la tabla ARP sin enviar ningún paquete', async () => {
    const { falsa, servicio } = crear();
    const l = await servicio.lectura();
    expect(falsa.pingsPedidos).toEqual([]);
    expect(l.adaptadores).toEqual([{ ...WIFI, escaneable: true, motivo: null }]);
    expect(l.escaneo).toEqual({
      permitido: true,
      motivo: null,
      red: '192.168.1.0/24',
      equipos: 253,
    });
    expect(l.equipos.map((e) => [e.ip, e.fabricante, e.nombre, e.ms])).toEqual([
      ['192.168.1.1', 'Raspberry Pi', null, null],
      ['192.168.1.40', null, null, null],
    ]);
  });

  it('en una red pública el escaneo no está permitido y lo dice', async () => {
    const { servicio } = crear({ adaptadores: [{ ...WIFI, perfil: 'publico' }] });
    const l = await servicio.lectura();
    expect(l.escaneo).toMatchObject({ permitido: false, motivo: 'publica', red: null });
    expect(l.adaptadores[0]).toMatchObject({ escaneable: false, motivo: 'publica' });
  });

  it('sin perfil legible, adaptador no predeterminado o IP pública, tampoco', async () => {
    expect(
      (await crear({ adaptadores: [{ ...WIFI, perfil: null }] }).servicio.lectura()).escaneo.motivo,
    ).toBe('perfil_desconocido');
    expect(
      (await crear({ adaptadores: [{ ...WIFI, predeterminado: false }] }).servicio.lectura())
        .escaneo.motivo,
    ).toBe('sin_adaptador');
    expect(
      (await crear({ adaptadores: [{ ...WIFI, ip: '8.8.8.8' }] }).servicio.lectura()).escaneo
        .motivo,
    ).toBe('no_privada');
  });

  it('si la red activa es una VPN o un túnel, no se explora ni se actúa sobre equipos', async () => {
    const t = crear({ adaptadores: [{ ...WIFI, tunel: true }] });
    const l = await t.servicio.lectura();
    expect(l.escaneo).toMatchObject({ permitido: false, motivo: 'tunel', red: null });
    await rechaza(t.servicio.escanear(true), 'red.rango_no_permitido');
    await rechaza(t.servicio.ping('192.168.1.1'), 'red.rango_no_permitido');
    expect(t.falsa.pingsPedidos).toEqual([]);
  });

  it('si ni los adaptadores ni la tabla se pueden leer, es un error del catálogo', async () => {
    const { falsa, servicio } = crear();
    falsa.adaptadoresFalsos = null;
    falsa.vecinosFalsos = null;
    await rechaza(servicio.lectura(), 'red.lectura_fallo');
  });
});

describe('Mi red: escaneo activo (D53)', () => {
  it('exige la confirmación y no hace ping sin ella', async () => {
    const { falsa, servicio } = crear();
    for (const c of [false, undefined, 'true', 1, null])
      await rechaza(servicio.escanear(c), 'red.sin_confirmar');
    expect(falsa.pingsPedidos).toEqual([]);
  });

  it('explora SOLO el /24 de la red activa, de a 32 como máximo, y devuelve equipos con nombre y fabricante', async () => {
    const { falsa, servicio, progreso } = crear({
      nombres: { '192.168.1.1': 'router.lan', '192.168.1.77': 'portatil' },
    });
    falsa.retardoPingMs = 1;
    falsa.respuestasPing.set('192.168.1.1', 2);
    falsa.respuestasPing.set('192.168.1.77', 9);
    const r = await servicio.escanear(true);
    expect(r).toMatchObject({
      cancelado: false,
      revisados: 253,
      total: 253,
      red: '192.168.1.0/24',
    });
    expect(falsa.pingsPedidos).toHaveLength(253);
    expect(falsa.pingsPedidos.every((p) => p.intentos === 1 && p.ip.startsWith('192.168.1.'))).toBe(
      true,
    );
    expect(falsa.pingsPedidos.some((p) => p.ip === '192.168.1.20')).toBe(false);
    expect(falsa.maxPingsActivos).toBeLessThanOrEqual(32);
    expect(progreso.at(-1)).toEqual({ hechos: 253, total: 253 });
    expect(r.equipos.map((e) => [e.ip, e.nombre, e.fabricante, e.ms])).toEqual([
      ['192.168.1.1', 'router.lan', 'Raspberry Pi', 2],
      ['192.168.1.40', null, null, null],
      ['192.168.1.77', 'portatil', null, 9],
    ]);
  });

  it('una red /16 se recorta al /24 del equipo: nunca se hace ping fuera de él', async () => {
    const { falsa, servicio } = crear({
      adaptadores: [{ ...WIFI, ip: '10.20.30.40', prefijo: 8 }],
    });
    const r = await servicio.escanear(true);
    expect(r.red).toBe('10.20.30.0/24');
    expect(falsa.pingsPedidos.every((p) => p.ip.startsWith('10.20.30.'))).toBe(true);
  });

  it('en una red pública, sin perfil, sin adaptador activo o con IP pública NO hace ningún ping', async () => {
    const casos: [Partial<AdaptadorRed>, string][] = [
      [{ perfil: 'publico' }, 'red.red_publica'],
      [{ perfil: null }, 'red.perfil_desconocido'],
      [{ predeterminado: false }, 'red.sin_adaptador'],
      [{ ip: '8.8.8.8' }, 'red.rango_no_permitido'],
      [{ ip: '100.64.0.5' }, 'red.rango_no_permitido'],
      [{ ip: '169.254.9.9' }, 'red.rango_no_permitido'],
    ];
    for (const [cambio, codigo] of casos) {
      const { falsa, servicio } = crear({ adaptadores: [{ ...WIFI, ...cambio }] });
      await rechaza(servicio.escanear(true), codigo);
      expect(falsa.pingsPedidos, codigo).toEqual([]);
    }
    const { falsa, servicio } = crear({ adaptadores: null });
    await rechaza(servicio.escanear(true), 'red.lectura_fallo');
    expect(falsa.pingsPedidos).toEqual([]);
  });

  it('un segundo escaneo mientras hay uno en curso es «ocupado», y cancelar lo detiene', async () => {
    const { falsa, servicio } = crear();
    falsa.retardoPingMs = 20;
    const primero = servicio.escanear(true);
    // Deja que el primero llegue a hacer pings.
    await new Promise((r) => setTimeout(r, 60));
    await rechaza(servicio.escanear(true), 'red.ocupado');
    expect(servicio.cancelarEscaneo()).toBe(true);
    const r = await primero;
    expect(r.cancelado).toBe(true);
    expect(r.revisados).toBeLessThan(253);
    expect(servicio.cancelarEscaneo()).toBe(false);
    // Terminado: se puede volver a pedir.
    falsa.retardoPingMs = 0;
    expect((await servicio.escanear(true)).cancelado).toBe(false);
  });
});

describe('Mi red: acciones por equipo (D53)', () => {
  async function conLista() {
    const t = crear();
    await t.servicio.lectura();
    return t;
  }

  it('ping: 4 intentos por defecto con resultado, tope de 10 y solo equipos de la lista', async () => {
    const { falsa, servicio } = await conLista();
    falsa.respuestasPing.set('192.168.1.1', 5);
    expect(await servicio.ping('192.168.1.1')).toEqual({
      ip: '192.168.1.1',
      enviados: 4,
      recibidos: 4,
      perdidos: 0,
      minMs: 5,
      maxMs: 5,
      mediaMs: 5,
      cancelado: false,
    });
    expect(falsa.pingsPedidos.at(-1)).toEqual({ ip: '192.168.1.1', intentos: 4 });
    expect((await servicio.ping('192.168.1.1', 10)).enviados).toBe(10);
    for (const n of [11, 0, -1, 1.5, '4', null, NaN]) {
      await rechaza(servicio.ping('192.168.1.1', n), 'red.equipo_no_valido');
    }
    // Sin respuesta: perdidos y sin estadísticas.
    expect(await servicio.ping('192.168.1.40')).toMatchObject({
      recibidos: 0,
      perdidos: 4,
      mediaMs: null,
    });
    const antes = falsa.pingsPedidos.length;
    await rechaza(servicio.ping('192.168.1.99'), 'red.equipo_desconocido');
    await rechaza(servicio.ping('8.8.8.8'), 'red.equipo_no_valido');
    await rechaza(servicio.ping('equipo-sala'), 'red.equipo_no_valido');
    await rechaza(servicio.ping('192.168.1.1; calc'), 'red.equipo_no_valido');
    expect(falsa.pingsPedidos).toHaveLength(antes);
  });

  it('ver carpetas: solo de equipos de la lista; los administrativos no se listan', async () => {
    const { falsa, servicio } = await conLista();
    falsa.recursosFalsos.set('192.168.1.1', {
      ok: true,
      recursos: [
        { nombre: 'Docs', tipo: 'Disk', comentario: '' },
        { nombre: 'C$', tipo: 'Disk', comentario: 'Default share' },
        { nombre: '..', tipo: 'Disk', comentario: '' },
        { nombre: 'a/b', tipo: 'Disk', comentario: '' },
      ],
    });
    expect(await servicio.carpetasDeEquipo('192.168.1.1')).toEqual({
      ok: true,
      recursos: [{ nombre: 'Docs', tipo: 'Disk', comentario: '' }],
    });
    expect(await servicio.carpetasDeEquipo('192.168.1.40')).toEqual({
      ok: false,
      motivo: 'inaccesible',
    });
    await rechaza(servicio.carpetasDeEquipo('192.168.1.99'), 'red.equipo_desconocido');
    await rechaza(servicio.carpetasDeEquipo('1.1.1.1'), 'red.equipo_no_valido');
    expect(falsa.recursosPedidos).toEqual(['192.168.1.1', '192.168.1.40']);
  });

  it('la ruta para abrir solo sale de un recurso que ese equipo listó', async () => {
    const { falsa, servicio } = await conLista();
    falsa.recursosFalsos.set('192.168.1.1', {
      ok: true,
      recursos: [{ nombre: 'Música 2024', tipo: 'Disk', comentario: '' }],
    });
    // Antes de listar no hay nada que abrir.
    await rechaza(servicio.rutaRecurso('192.168.1.1', 'Música 2024'), 'red.recurso_no_valido');
    await servicio.carpetasDeEquipo('192.168.1.1');
    expect(await servicio.rutaRecurso('192.168.1.1', 'Música 2024')).toBe(
      '\\\\192.168.1.1\\Música 2024',
    );
    for (const [ip, recurso, codigo] of [
      ['192.168.1.1', 'Otro', 'red.recurso_no_valido'],
      ['192.168.1.1', 'C$', 'red.recurso_no_valido'],
      ['192.168.1.1', '..\\x', 'red.recurso_no_valido'],
      ['192.168.1.1', 5, 'red.recurso_no_valido'],
      ['192.168.1.40', 'Música 2024', 'red.recurso_no_valido'],
      ['192.168.1.99', 'Música 2024', 'red.equipo_desconocido'],
      ['8.8.8.8', 'Música 2024', 'red.equipo_no_valido'],
    ] as const) {
      await rechaza(servicio.rutaRecurso(ip, recurso), codigo);
    }
  });
});

describe('Mi red: acciones por equipo y la red activa (D53)', () => {
  const OTRA_SUBRED = '10.0.0.5';

  async function conLista() {
    const t = crear();
    t.falsa.vecinosFalsos = [
      ...(t.falsa.vecinosFalsos ?? []),
      { ip: OTRA_SUBRED, mac: 'b8:27:eb:00:00:09', estado: 'Reachable', indice: 5 },
    ];
    t.falsa.recursosFalsos.set('192.168.1.1', {
      ok: true,
      recursos: [{ nombre: 'Docs', tipo: 'Disk', comentario: '' }],
    });
    await t.servicio.lectura();
    await t.servicio.carpetasDeEquipo('192.168.1.1');
    t.falsa.recursosPedidos.length = 0;
    t.falsa.pingsPedidos.length = 0;
    return t;
  }

  it('en una red pública (o que pasó a serlo tras la lectura) no se hace ping, ni net view ni se abre nada', async () => {
    const { falsa, servicio } = await conLista();
    falsa.adaptadoresFalsos = [{ ...WIFI, perfil: 'publico' }];
    await rechaza(servicio.ping('192.168.1.1'), 'red.red_publica');
    await rechaza(servicio.carpetasDeEquipo('192.168.1.1'), 'red.red_publica');
    await rechaza(servicio.rutaRecurso('192.168.1.1', 'Docs'), 'red.red_publica');
    expect(falsa.pingsPedidos).toEqual([]);
    expect(falsa.recursosPedidos).toEqual([]);
  });

  it('con perfil desconocido, sin adaptador activo o sin poder leerlos, tampoco', async () => {
    const { falsa, servicio } = await conLista();
    falsa.adaptadoresFalsos = [{ ...WIFI, perfil: null }];
    await rechaza(servicio.ping('192.168.1.1'), 'red.perfil_desconocido');
    falsa.adaptadoresFalsos = [{ ...WIFI, predeterminado: false }];
    await rechaza(servicio.carpetasDeEquipo('192.168.1.1'), 'red.sin_adaptador');
    falsa.adaptadoresFalsos = null;
    await rechaza(servicio.rutaRecurso('192.168.1.1', 'Docs'), 'red.lectura_fallo');
    expect(falsa.pingsPedidos).toEqual([]);
    expect(falsa.recursosPedidos).toEqual([]);
  });

  it('un equipo de otra subred (aunque esté en la tabla ARP) o de otro adaptador se rechaza', async () => {
    const { falsa, servicio } = await conLista();
    await rechaza(servicio.ping(OTRA_SUBRED), 'red.rango_no_permitido');
    await rechaza(servicio.carpetasDeEquipo(OTRA_SUBRED), 'red.rango_no_permitido');
    await rechaza(servicio.rutaRecurso(OTRA_SUBRED, 'Docs'), 'red.rango_no_permitido');
    // Otro adaptador privado que NO es el activo: su red tampoco.
    falsa.adaptadoresFalsos = [
      WIFI,
      {
        ...WIFI,
        indice: 7,
        nombre: 'Ethernet',
        ip: '10.0.0.7',
        prefijo: 24,
        predeterminado: false,
      },
    ];
    await rechaza(servicio.ping(OTRA_SUBRED), 'red.rango_no_permitido');
    expect(falsa.pingsPedidos).toEqual([]);
    expect(falsa.recursosPedidos).toEqual([]);
    // Y el de la red activa sigue funcionando.
    expect((await servicio.ping('192.168.1.1')).enviados).toBe(4);
  });

  it('tras una nueva lectura o un escaneo, una IP antigua ya no está «conocida»', async () => {
    const { falsa, servicio } = await conLista();
    falsa.vecinosFalsos = [
      { ip: '192.168.1.40', mac: 'da:a1:19:00:00:01', estado: 'Stale', indice: 12 },
    ];
    await servicio.lectura();
    await rechaza(servicio.ping('192.168.1.1'), 'red.equipo_desconocido');
    // Los recursos listados de la lectura anterior tampoco se pueden abrir.
    await rechaza(servicio.rutaRecurso('192.168.1.1', 'Docs'), 'red.equipo_desconocido');
    expect((await servicio.ping('192.168.1.40')).enviados).toBe(4);
    await servicio.carpetasDeEquipo('192.168.1.40');
    // Un escaneo rehace la lista: la IP que ya no sale deja de valer.
    falsa.vecinosFalsos = [];
    await servicio.escanear(true);
    await rechaza(servicio.ping('192.168.1.40'), 'red.equipo_desconocido');
    await rechaza(servicio.rutaRecurso('192.168.1.40', 'Docs'), 'red.equipo_desconocido');
  });
});

const RUTA_FOTOS = 'C:' + String.fromCharCode(92) + 'Fotos';

describe('Mi red: dejar de compartir (D53)', () => {
  const carpeta = (nombre: string, extra: Partial<CarpetaCompartida> = {}): CarpetaCompartida => ({
    nombre,
    ruta: `C:\\${nombre}`,
    descripcion: '',
    tipo: 'carpeta',
    administrativa: false,
    oculta: false,
    usuarios: 0,
    ...extra,
  });

  function conCarpetas() {
    const t = crear();
    t.falsa.carpetasCompartidasFalsas = [
      carpeta('Fotos'),
      carpeta('C$', { administrativa: true, oculta: true }),
      carpeta('ADMIN$', { administrativa: true, oculta: true }),
      carpeta('IPC$', { administrativa: true, oculta: true, tipo: 'otro' }),
      carpeta('Impresora', { tipo: 'impresora', administrativa: true }),
    ];
    return t;
  }

  it('lista las carpetas con las administrativas marcadas', async () => {
    const { servicio } = conCarpetas();
    const l = await servicio.carpetas();
    expect(l.filter((c) => c.administrativa).map((c) => c.nombre)).toEqual([
      'C$',
      'ADMIN$',
      'IPC$',
      'Impresora',
    ]);
  });

  it('sin confirmación firme no se llama a la elevación', async () => {
    const { falsa, servicio } = conCarpetas();
    for (const c of [false, undefined, 'true', 1, null]) {
      await rechaza(servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, c), 'red.sin_confirmar');
    }
    expect(falsa.dejarDeCompartirLlamadas).toBe(0);
    expect(falsa.carpetasQuitadas).toEqual([]);
  });

  it('las administrativas, las inventadas y las de nombre raro se rechazan sin abrir ningún UAC', async () => {
    const { falsa, servicio } = conCarpetas();
    for (const n of [
      'C$',
      'ADMIN$',
      'IPC$',
      'Impresora',
      'NoExiste',
      '',
      '..',
      "x'; calc; '",
      'a/b',
      'fotos',
      7,
      null,
    ]) {
      await rechaza(servicio.dejarDeCompartir(n, RUTA_FOTOS, true), 'red.carpeta_no_valida');
    }
    expect(falsa.dejarDeCompartirLlamadas).toBe(0);
  });

  it('confirmada: abre UN UAC, comprueba que ya no está y devuelve la lista nueva', async () => {
    const { falsa, servicio } = conCarpetas();
    const r = await servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true);
    expect(r.estado).toBe('quitada');
    expect(r.carpetas.map((c) => c.nombre)).not.toContain('Fotos');
    expect(falsa.dejarDeCompartirLlamadas).toBe(1);
    expect(falsa.carpetasQuitadas).toEqual(['Fotos']);
  });

  it('UAC cancelado o plazo vencido: se informa, no es un error y no se quita nada', async () => {
    const { falsa, servicio } = conCarpetas();
    falsa.uacCancelado = true;
    const c = await servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true);
    expect(c.estado).toBe('cancelado');
    expect(c.carpetas.map((x) => x.nombre)).toContain('Fotos');
    falsa.uacCancelado = false;
    falsa.resultadoDejarDeCompartir = { ok: false, motivo: 'tiempo' };
    const t = await servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true);
    expect(t.estado).toBe('tiempo');
    expect(falsa.carpetasQuitadas).toEqual([]);
  });

  it('un fallo, o que siga compartida tras el «ok», es un error del catálogo', async () => {
    const { falsa, servicio } = conCarpetas();
    falsa.resultadoDejarDeCompartir = { ok: false, motivo: 'error', detalle: 'código 43' };
    await rechaza(servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true), 'red.quitar_fallo');
    falsa.resultadoDejarDeCompartir = { ok: true };
    await rechaza(servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true), 'red.quitar_fallo');
  });

  it('no se piden dos elevaciones a la vez', async () => {
    const { falsa, servicio } = conCarpetas();
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    const original = falsa.dejarDeCompartir.bind(falsa);
    falsa.dejarDeCompartir = async (n, r) => {
      await puerta;
      return original(n, r);
    };
    const primera = servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true);
    await new Promise((r) => setTimeout(r, 10));
    await rechaza(servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true), 'red.ocupado');
    soltar();
    expect((await primera).estado).toBe('quitada');
  });

  it('solo quita la carpeta que vio la persona: otra ruta o sin ruta no abre el UAC', async () => {
    const { falsa, servicio } = conCarpetas();
    for (const ruta of ['D:\\Otra', '', undefined, 5, null]) {
      await rechaza(servicio.dejarDeCompartir('Fotos', ruta, true), 'red.carpeta_no_valida');
    }
    expect(falsa.dejarDeCompartirLlamadas).toBe(0);
    await servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true);
    // A la plataforma van el nombre y la ruta de la lista, para que el script elevado compruebe las dos.
    expect(falsa.quitarPedidos).toEqual([{ nombre: 'Fotos', ruta: RUTA_FOTOS }]);
  });

  it('si la lista no se puede leer, no se abre el UAC', async () => {
    const { falsa, servicio } = conCarpetas();
    falsa.carpetasCompartidasFalsas = null;
    await rechaza(servicio.dejarDeCompartir('Fotos', RUTA_FOTOS, true), 'red.lectura_fallo');
    expect(falsa.dejarDeCompartirLlamadas).toBe(0);
  });
});

describe('Mi red: prueba de velocidad (D53)', () => {
  const RESULTADO = {
    latenciaMs: 12,
    bajadaMbps: 95.5,
    subidaMbps: 20.1,
    bytesBajados: 25_000_000,
    bytesSubidos: 10_000_000,
    cancelada: false,
    incompleta: false,
  };

  it('exige la confirmación y no mide nada sin ella', async () => {
    let llamadas = 0;
    const falsa = new PlataformaFalsa();
    const s = new MiRed({ plataforma: falsa, medidor: async () => (llamadas++, RESULTADO) });
    await rechaza(s.medirVelocidad(undefined), 'red.sin_confirmar');
    await rechaza(s.medirVelocidad('true'), 'red.sin_confirmar');
    expect(llamadas).toBe(0);
  });

  it('mide con el medidor, avisa las fases y devuelve el plan de datos', async () => {
    const { falsa, fases } = crear();
    const s = new MiRed({
      plataforma: falsa,
      alVelocidad: (p) => fases.push(p.fase),
      medidor: async (o) => {
        o.alFase?.('latencia');
        o.alFase?.('bajada');
        o.alFase?.('subida');
        // Nunca se le pasa otra base: solo el medidor real usa la oficial.
        expect(o.base).toBeUndefined();
        return RESULTADO;
      },
    });
    const r = await s.medirVelocidad(true);
    expect(r).toMatchObject({ ...RESULTADO, plan: { bajadaMb: 25, subidaMb: 10 } });
    expect(fases).toEqual(['latencia', 'bajada', 'subida']);
  });

  it('un fallo del servidor es un error del catálogo; cancelar corta la medición; una a la vez', async () => {
    const falsa = new PlataformaFalsa();
    const roto = new MiRed({
      plataforma: falsa,
      medidor: async () => Promise.reject(new Error('503')),
    });
    await rechaza(roto.medirVelocidad(true), 'red.velocidad_fallo');

    let senal!: AbortSignal;
    let entro!: () => void;
    const dentro = new Promise<void>((r) => (entro = r));
    const lento: MedidorVelocidad = (o) =>
      new Promise((resolver) => {
        senal = o.senal!;
        entro();
        o.senal!.addEventListener('abort', () =>
          resolver({ ...RESULTADO, bajadaMbps: null, cancelada: true }),
        );
      });
    const s = new MiRed({ plataforma: falsa, medidor: lento });
    const medicion = s.medirVelocidad(true);
    await dentro;
    await rechaza(s.medirVelocidad(true), 'red.ocupado');
    expect(s.cancelarVelocidad()).toBe(true);
    expect(senal.aborted).toBe(true);
    expect((await medicion).cancelada).toBe(true);
    expect(s.cancelarVelocidad()).toBe(false);
  });
});

describe('Mi red en el núcleo (D53)', () => {
  let nucleo: Nucleo | null = null;
  afterEach(async () => {
    await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
    nucleo = null;
  });

  it('el núcleo la conecta con la plataforma, emite el avance y la corta al cerrar', async () => {
    const raiz = realpathSync.native(await carpetaTemporal('pel-d53-nucleo-'));
    const base = path.join(raiz, 'datos');
    mkdirSync(base, { recursive: true });
    const falsa = new PlataformaFalsa({ carpetaDatos: base });
    falsa.adaptadoresFalsos = [{ ...WIFI, prefijo: 28, ip: '192.168.1.5' }];
    falsa.vecinosFalsos = [];
    nucleo = await Nucleo.crear({
      barrerHuerfanos: false,
      base,
      aislado: true,
      plataforma: falsa,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      miRed: { nombreInverso: async () => null },
    });
    const avances: number[] = [];
    nucleo.eventos.on('red:escaneo', (p) => avances.push(p.hechos));
    expect((await nucleo.miRed.lectura()).escaneo.red).toBe('192.168.1.0/28');
    const r = await nucleo.miRed.escanear(true);
    expect(r.total).toBe(13);
    expect(avances.at(-1)).toBe(13);
    expect(nucleo.miRed).toBe(nucleo.miRed);
  });
});
