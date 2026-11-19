import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ApiEntorno,
  EventosNucleo,
  MuestraSistema,
  PuertoEnUso,
  SolicitudConfirmacion,
} from '../src/shared/api';
import { useConfirmacionesMcp } from '../src/renderer/stores/mcp';
import { useMetricas } from '../src/renderer/stores/metricas';
import { useRegistros } from '../src/renderer/stores/registros';
import {
  agregarMuestra,
  calcularAlertas,
  crearMuestreo,
  formatoDuracion,
  servicioDeProceso,
  trazoSerie,
  type DocumentoVisible,
} from '../src/renderer/utilidades/metricas';
import {
  agruparFuentes,
  BuferLineas,
  etiquetaFuente,
  filtrarLineas,
  fuenteDeProceso,
  nivelDeLinea,
} from '../src/renderer/utilidades/registros';

type Oyente = (dato: unknown) => void;

/** `document` falso: se oculta y se muestra a mano. */
function documentoFalso(oculto = false) {
  const oyentes = new Set<() => void>();
  const doc = {
    hidden: oculto,
    addEventListener: vi.fn((_: 'visibilitychange', fn: () => void) => void oyentes.add(fn)),
    removeEventListener: vi.fn((_: 'visibilitychange', fn: () => void) => void oyentes.delete(fn)),
  };
  const cambiar = (o: boolean): void => {
    doc.hidden = o;
    for (const fn of [...oyentes]) fn();
  };
  return { doc: doc as DocumentoVisible & typeof doc, cambiar, oyentes };
}

function apiFalsa() {
  const oyentes = new Map<string, Set<Oyente>>();
  const api = {
    metricas: {
      iniciar: vi.fn(async () => undefined),
      pausar: vi.fn(async () => undefined),
      ultimos: vi.fn(async (): Promise<MuestraSistema[]> => []),
    },
    herramientas: { puertos: vi.fn(async (): Promise<PuertoEnUso[]> => []) },
    registros: {
      fuentes: vi.fn(async () => [{ id: 'nginx', nombre: 'Nginx', grupo: 'nginx' }]),
      seguir: vi.fn(async () => undefined),
      dejar: vi.fn(async () => undefined),
      leerFinal: vi.fn(async (id: string) => [`${id} vieja 1`, `${id} vieja 2`]),
      abrirCarpeta: vi.fn(async () => undefined),
    },
    mcp: { responderConfirmacion: vi.fn(async () => true) },
    on: vi.fn((nombre: string, fn: Oyente) => {
      const set = oyentes.get(nombre) ?? new Set<Oyente>();
      set.add(fn);
      oyentes.set(nombre, set);
      return () => void set.delete(fn);
    }),
  };
  const emitir = <K extends keyof EventosNucleo>(nombre: K, dato: EventosNucleo[K]): void => {
    for (const fn of oyentes.get(nombre) ?? []) fn(dato);
  };
  const cuantos = (nombre: string): number => oyentes.get(nombre)?.size ?? 0;
  return { api, emitir, cuantos };
}

const muestra = (marca: number, extra: Partial<MuestraSistema> = {}): MuestraSistema => ({
  marca,
  cpu: 10,
  ramUsada: 4,
  ramTotal: 16,
  discoDatos: { usado: 1, libre: 1 },
  red: { rxBps: 0, txBps: 0 },
  procesos: [],
  ...extra,
});

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe('búfer circular de registros', () => {
  it('guarda en orden y descarta las más viejas al pasar la capacidad', () => {
    const b = new BuferLineas(5);
    b.agregar(['1', '2', '3']);
    expect(b.lista()).toEqual(['1', '2', '3']);
    b.agregar(['4', '5', '6', '7']);
    expect(b.lista()).toEqual(['3', '4', '5', '6', '7']);
    expect(b.tamano).toBe(5);
    expect(b.descartadas).toBe(2);
    b.agregar(['8']);
    expect(b.lista()).toEqual(['4', '5', '6', '7', '8']);
  });

  it('un lote más grande que el búfer deja solo sus últimas líneas', () => {
    const b = new BuferLineas(3);
    b.agregar(['a']);
    b.agregar(['1', '2', '3', '4', '5']);
    expect(b.lista()).toEqual(['3', '4', '5']);
    expect(b.descartadas).toBe(3);
  });

  it('por defecto guarda 5000 líneas', () => {
    const b = new BuferLineas();
    b.agregar(Array.from({ length: 6200 }, (_, i) => `l${i}`));
    const l = b.lista();
    expect(l).toHaveLength(5000);
    expect(l[0]).toBe('l1200');
    expect(l[4999]).toBe('l6199');
  });

  it('vaciar deja el búfer como nuevo', () => {
    const b = new BuferLineas(2);
    b.agregar(['1', '2', '3']);
    b.vaciar();
    expect(b.lista()).toEqual([]);
    expect(b.descartadas).toBe(0);
  });
});

describe('filtros de registros', () => {
  const lineas = [
    '2026/11/18 10:00:00 [error] 123#0: connect() failed',
    '[2026-11-18 10:00:01] local.ERROR: SQLSTATE[HY000]',
    'PHP Warning:  Undefined variable $x',
    '[2026-11-18 10:00:02] local.INFO: usuario entró',
    '127.0.0.1 - - "GET / HTTP/1.1" 200',
    'stderr sin nivel',
  ];

  it('reconoce el nivel de Nginx, Laravel y PHP', () => {
    expect(lineas.map(nivelDeLinea)).toEqual(['error', 'error', 'warning', 'info', null, null]);
  });

  it('con todos los niveles y sin texto devuelve todo (también lo que no tiene nivel)', () => {
    expect(filtrarLineas(lineas, { texto: '', niveles: ['error', 'warning', 'info'] })).toEqual(
      lineas,
    );
    expect(filtrarLineas(lineas, { texto: '  ', niveles: [] })).toEqual(lineas);
  });

  it('filtra por nivel', () => {
    expect(filtrarLineas(lineas, { texto: '', niveles: ['error'] })).toEqual(lineas.slice(0, 2));
    expect(filtrarLineas(lineas, { texto: '', niveles: ['warning', 'info'] })).toEqual([
      lineas[2],
      lineas[3],
    ]);
  });

  it('filtra por texto sin distinguir mayúsculas y combina con el nivel', () => {
    expect(filtrarLineas(lineas, { texto: 'sqlstate', niveles: [] })).toEqual([lineas[1]]);
    expect(filtrarLineas(lineas, { texto: 'local', niveles: ['info'] })).toEqual([lineas[3]]);
  });
});

describe('fuentes de registro', () => {
  const sitio = {
    nombre: 'Tienda',
    dominio: 'tienda.test',
    procesos: [{ id: 'vite', nombre: 'Vite' }],
  } as never;
  const porId = (id: string) => (id === 's1' ? sitio : undefined);

  it('arma las etiquetas por grupo e id y agrupa en orden', () => {
    const fuentes = [
      { id: 'proy-s1-vite', nombre: 'x', grupo: 'proyecto' as const, sitioId: 's1' },
      { id: 'sitio:s1:error', nombre: 'x', grupo: 'sitio' as const, sitioId: 's1' },
      { id: 'nginx:error', nombre: 'x', grupo: 'nginx' as const },
      { id: 'php:8.4', nombre: 'x', grupo: 'php' as const },
      { id: 'tunel:s1:salida', nombre: 'x', grupo: 'tunel' as const, sitioId: 's1' },
    ];
    expect(etiquetaFuente(fuentes[0]!, porId)).toBe('Tienda: Vite');
    expect(etiquetaFuente(fuentes[1]!, porId)).toBe('tienda.test (errores)');
    const grupos = agruparFuentes(fuentes, porId);
    expect(grupos.map((g) => g.key)).toEqual(['nginx', 'php', 'sitio', 'proyecto', 'tunel']);
    expect(grupos[4]!.children[0]!.label).toBe('Túnel de Tienda (salida)');
  });

  it('lleva un proceso del supervisor a su fuente', () => {
    expect(fuenteDeProceso('nginx')).toBe('nginx');
    expect(fuenteDeProceso('php-8.4-1')).toBe('php:8.4');
    expect(fuenteDeProceso('proy-s1-vite')).toBe('proy-s1-vite');
    expect(fuenteDeProceso('mysql')).toBe('servicio:mysql');
    expect(servicioDeProceso('php-8.4-1')).toBe('php-8.4');
  });
});

describe('muestreo según la visibilidad', () => {
  it('empieza al entrar, pausa al ocultarse, reanuda al volver y pausa al salir', async () => {
    const { doc, cambiar, oyentes } = documentoFalso();
    const iniciar = vi.fn(async () => undefined);
    const pausar = vi.fn(async () => undefined);
    const c = crearMuestreo({ iniciar, pausar, documento: doc });

    c.entrar();
    expect(iniciar).toHaveBeenCalledTimes(1);
    expect(c.activo).toBe(true);

    cambiar(true);
    expect(pausar).toHaveBeenCalledTimes(1);
    expect(c.activo).toBe(false);
    cambiar(true); // sin cambio: no se repite
    expect(pausar).toHaveBeenCalledTimes(1);

    cambiar(false);
    expect(iniciar).toHaveBeenCalledTimes(2);

    c.salir();
    expect(pausar).toHaveBeenCalledTimes(2);
    expect(oyentes.size).toBe(0);
    cambiar(true);
    cambiar(false);
    expect(iniciar).toHaveBeenCalledTimes(2);
  });

  it('si se entra con la ventana oculta no muestrea hasta que se vea', () => {
    const { doc, cambiar } = documentoFalso(true);
    const iniciar = vi.fn(async () => undefined);
    const pausar = vi.fn(async () => undefined);
    const c = crearMuestreo({ iniciar, pausar, documento: doc });
    c.entrar();
    expect(iniciar).not.toHaveBeenCalled();
    cambiar(false);
    expect(iniciar).toHaveBeenCalledTimes(1);
    c.salir();
    expect(pausar).toHaveBeenCalledTimes(1);
  });

  it('un fallo al pedir el muestreo no se pierde en el aire', async () => {
    const { doc } = documentoFalso();
    const alError = vi.fn();
    const c = crearMuestreo({
      iniciar: () => Promise.reject(new Error('x')),
      pausar: async () => undefined,
      documento: doc,
      alError,
    });
    c.entrar();
    await esperar();
    expect(alError).toHaveBeenCalled();
  });
});

describe('series y alertas del panel', () => {
  it('guarda como mucho 100 muestras y descarta las repetidas o viejas', () => {
    let s: MuestraSistema[] = [];
    for (let i = 1; i <= 120; i++) s = agregarMuestra(s, muestra(i));
    expect(s).toHaveLength(100);
    expect(s[0]!.marca).toBe(21);
    expect(agregarMuestra(s, muestra(50))).toHaveLength(100);
  });

  it('el trazo se alinea a la derecha y respeta el máximo', () => {
    const { linea, area } = trazoSerie([0, 100, 200], {
      ancho: 100,
      alto: 10,
      max: 100,
      ranuras: 3,
    });
    expect(linea).toBe('M0 10 L50 0 L100 0');
    expect(area.endsWith('Z')).toBe(true);
    expect(trazoSerie([], { ancho: 100, alto: 10, max: 1 }).linea).toBe('');
    expect(trazoSerie([5], { ancho: 100, alto: 10, max: 10, ranuras: 3 }).linea).toBe(
      'M50 5 L100 5',
    );
  });

  it('avisa puerto en conflicto, RAM alta y php-cgi huérfano', () => {
    const p = (puerto: number, nombre: string, pid: number, propio = false): PuertoEnUso => ({
      puerto,
      nombre,
      pid,
      propio,
      protocolo: 'TCP',
      direcciones: ['0.0.0.0'],
      creado: '1',
    });
    const alertas = calcularAlertas({
      muestra: muestra(1, { ramUsada: 15, ramTotal: 16 }),
      puertos: [
        p(80, 'httpd.exe', 10),
        p(9840, 'php-cgi.exe', 20),
        p(3306, 'mysqld.exe', 30, true),
      ],
      servicios: [
        { id: 'nginx', nombre: 'Nginx', estado: 'apagado', puertos: [80] },
        { id: 'mysql', nombre: 'MySQL', estado: 'encendido', puertos: [3306] },
      ],
    });
    expect(alertas.map((a) => a.tipo)).toEqual(['conflicto', 'ramAlta', 'huerfano']);
    expect(alertas[0]!.proceso).toEqual({ pid: 10, nombre: 'httpd.exe', creado: '1' });
    expect(alertas[2]!.proceso?.pid).toBe(20);
  });

  it('formatea el tiempo encendido', () => {
    expect(formatoDuracion(42)).toBe('42 s');
    expect(formatoDuracion(3 * 3600 + 5 * 60)).toBe('3 h 5 min');
    expect(formatoDuracion(2 * 86400 + 4 * 3600)).toBe('2 d 4 h');
  });
});

describe('stores del panel, registros y MCP', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('métricas: entrar muestrea y escucha; ocultar pausa; salir suelta todo', async () => {
    vi.useFakeTimers();
    const { doc, cambiar } = documentoFalso();
    const m = useMetricas();
    m.entrar(doc);
    expect(falsa.api.metricas.iniciar).toHaveBeenCalledTimes(1);
    expect(falsa.api.herramientas.puertos).toHaveBeenCalledTimes(1);
    expect(falsa.cuantos('metricas:muestra')).toBe(1);
    expect(m.muestreando).toBe(true);

    falsa.emitir('metricas:muestra', muestra(5));
    expect(m.ultima?.marca).toBe(5);

    cambiar(true);
    expect(falsa.api.metricas.pausar).toHaveBeenCalledTimes(1);
    expect(m.muestreando).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(falsa.api.herramientas.puertos).toHaveBeenCalledTimes(1);

    cambiar(false);
    expect(falsa.api.metricas.iniciar).toHaveBeenCalledTimes(2);
    expect(falsa.api.herramientas.puertos).toHaveBeenCalledTimes(2);

    m.salir();
    expect(falsa.api.metricas.pausar).toHaveBeenCalledTimes(2);
    expect(falsa.cuantos('metricas:muestra')).toBe(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(falsa.api.herramientas.puertos).toHaveBeenCalledTimes(2);
  });

  it('registros: sigue la fuente, pausa sin perder líneas y deja de seguir al salir', async () => {
    const r = useRegistros();
    r.entrar();
    await r.elegir('nginx');
    expect(falsa.api.registros.leerFinal).toHaveBeenCalledWith('nginx', 5000);
    expect(falsa.api.registros.seguir).toHaveBeenCalledWith('nginx');
    expect(r.lineas).toEqual(['nginx vieja 1', 'nginx vieja 2']);

    falsa.emitir('registro:lineas', { id: 'nginx', lineas: ['nueva'] });
    falsa.emitir('registro:lineas', { id: 'otra', lineas: ['ajena'] });
    expect(r.lineas).toEqual(['nginx vieja 1', 'nginx vieja 2', 'nueva']);

    r.pausar();
    falsa.emitir('registro:lineas', { id: 'nginx', lineas: ['en pausa 1', 'en pausa 2'] });
    expect(r.lineas).toHaveLength(3);
    expect(r.nuevasEnPausa).toBe(2);
    r.reanudar();
    expect(r.lineas).toHaveLength(5);

    r.texto = 'pausa';
    expect(r.visibles).toEqual(['en pausa 1', 'en pausa 2']);

    await r.elegir('php:8.4');
    expect(falsa.api.registros.dejar).toHaveBeenCalledWith('nginx');
    expect(r.lineas).toEqual(['php:8.4 vieja 1', 'php:8.4 vieja 2']);

    await r.salir();
    expect(falsa.api.registros.dejar).toHaveBeenCalledWith('php:8.4');
    expect(falsa.cuantos('registro:lineas')).toBe(0);
    expect(r.actual).toBeNull();
  });

  it('registros: si se cambia de fuente mientras carga, la anterior no queda seguida', async () => {
    let soltarLectura: (v: string[]) => void = () => undefined;
    falsa.api.registros.leerFinal.mockImplementationOnce(
      () => new Promise<string[]>((res) => (soltarLectura = res)),
    );
    const r = useRegistros();
    r.entrar();
    const primera = r.elegir('nginx');
    await esperar();
    const segunda = r.elegir('php:8.4');
    soltarLectura(['tarde']);
    await Promise.all([primera, segunda]);
    expect(falsa.api.registros.seguir).not.toHaveBeenCalledWith('nginx');
    expect(r.actual).toBe('php:8.4');
    expect(r.lineas).not.toContain('tarde');
  });

  describe('cola de confirmaciones MCP', () => {
    const sol = (
      id: string,
      extra: Partial<SolicitudConfirmacion> = {},
    ): SolicitudConfirmacion => ({
      id,
      herramienta: 'restaurar_base',
      resumen: `Restaurar ${id}`,
      datos: { motor: 'mysql', base: 'tienda', sobrescribir: true },
      ...extra,
    });

    it('abre la primera solicitud y encola las demás sin repetir', () => {
      const mcp = useConfirmacionesMcp();
      mcp.iniciar();
      expect(mcp.actual).toBeNull();
      falsa.emitir('mcp:confirmar', sol('a'));
      falsa.emitir('mcp:confirmar', sol('b'));
      falsa.emitir('mcp:confirmar', sol('a'));
      expect(mcp.actual?.id).toBe('a');
      expect(mcp.total).toBe(2);
    });

    it('aprobar responde por el id visible y muestra la siguiente', async () => {
      const mcp = useConfirmacionesMcp();
      mcp.iniciar();
      falsa.emitir('mcp:confirmar', sol('a'));
      falsa.emitir('mcp:confirmar', sol('b'));
      await expect(mcp.responder(true)).resolves.toBe(true);
      expect(falsa.api.mcp.responderConfirmacion).toHaveBeenCalledWith('a', true);
      expect(mcp.actual?.id).toBe('b');
      await mcp.responder(false);
      expect(falsa.api.mcp.responderConfirmacion).toHaveBeenLastCalledWith('b', false);
      expect(mcp.actual).toBeNull();
    });

    it('se cierra con mcp:confirmacion-cerrada de ese id e ignora ids desconocidos', () => {
      const mcp = useConfirmacionesMcp();
      mcp.iniciar();
      falsa.emitir('mcp:confirmar', sol('a'));
      falsa.emitir('mcp:confirmar', sol('b'));
      falsa.emitir('mcp:confirmacion-cerrada', { id: 'zzz', motivo: 'vencida' });
      expect(mcp.total).toBe(2);
      falsa.emitir('mcp:confirmacion-cerrada', { id: 'a', motivo: 'vencida' });
      expect(mcp.actual?.id).toBe('b');
      falsa.emitir('mcp:confirmacion-cerrada', { id: 'b', motivo: 'cancelada' });
      expect(mcp.actual).toBeNull();
    });

    it('una respuesta tardía o un eco de una ya respondida no la vuelve a abrir', async () => {
      const mcp = useConfirmacionesMcp();
      mcp.iniciar();
      falsa.api.mcp.responderConfirmacion.mockResolvedValueOnce(false);
      falsa.emitir('mcp:confirmar', sol('a'));
      const r = mcp.responder(true);
      falsa.emitir('mcp:confirmar', sol('a'));
      expect(mcp.actual).toBeNull();
      await expect(r).resolves.toBe(false);
    });

    it('acepta listas largas de pasos (52) y deja de escuchar al detener', () => {
      const mcp = useConfirmacionesMcp();
      mcp.iniciar();
      const pasos = Array.from({ length: 52 }, (_, i) => `[comando] paso ${i}`);
      falsa.emitir('mcp:confirmar', sol('r', { herramienta: 'ejecutar_receta', datos: { pasos } }));
      expect(mcp.actual?.datos.pasos).toHaveLength(52);
      mcp.detener();
      expect(falsa.cuantos('mcp:confirmar')).toBe(0);
      expect(falsa.cuantos('mcp:confirmacion-cerrada')).toBe(0);
    });
  });
});
