import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { guardarImagen, PlataformaFalsa } from '@pel/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CADUCIDAD_PENDIENTE_MS,
  conPlazo,
  CSP_CAPTURA,
  denegarPermisos,
  destinoConExtension,
  nombreSugerido,
  opcionesVentanaCaptura,
  PARTICION_CAPTURA,
  PLAZO_CARGA_VENTANA_MS,
  PLAZO_FUENTES_MS,
  registrarIpcCaptura,
  ServicioCaptura,
  validarImagenCaptura,
  vigilarVentana,
  type DepsCaptura,
  type VentanaCaptura,
  type VentanaVigilable,
} from '../src/main/captura';
import { CANALES_CAPTURA } from '../src/shared/captura';

// Servicio de captura (main/captura.ts): sin Electron, con una Plataforma falsa y una imagen fija.
// La pantalla real nunca se captura en las pruebas.

/** PNG real de 1×1 (la imagen fija de las pruebas). */
const PNG_1X1 = new Uint8Array(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  ),
);

/** Cabecera PNG que declara un tamaño (sin datos: el núcleo solo lee la cabecera). */
function pngDeclarado(ancho: number, alto: number): Uint8Array {
  const b = new Uint8Array(PNG_1X1);
  const v = new DataView(b.buffer);
  v.setUint32(16, ancho);
  v.setUint32(20, alto);
  return b;
}

const carpetas: string[] = [];
afterEach(() => {
  for (const c of carpetas.splice(0)) rmSync(c, { recursive: true, force: true });
});
function carpetaTemporal(): string {
  const c = mkdtempSync(join(tmpdir(), 'wolf-captura-prueba-'));
  carpetas.push(c);
  return c;
}

interface Prueba {
  servicio: ServicioCaptura;
  plataforma: PlataformaFalsa;
  registrados: Map<string, () => void>;
  ventanas: { cerrada: boolean; alCerrar: (() => void)[]; emisor: { mainFrame: object } }[];
  avisos: string[];
  eventos: string[];
}

function armar(sobre: Partial<DepsCaptura> = {}, ocupados: string[] = []): Prueba {
  const plataforma = new PlataformaFalsa();
  const registrados = new Map<string, () => void>();
  const ventanas: Prueba['ventanas'] = [];
  const avisos: string[] = [];
  const eventos: string[] = [];
  const deps: DepsCaptura = {
    atajos: {
      register: (a, fn) => {
        if (ocupados.includes(a)) return false;
        registrados.set(a, fn);
        return true;
      },
      unregister: (a) => void registrados.delete(a),
      isRegistered: (a) => registrados.has(a),
    },
    estado: () => plataforma.capturaDisponible(),
    fuentes: async (modo) => ({
      pantalla: modo === 'ventana' ? null : { png: PNG_1X1, ancho: 1, alto: 1 },
      ventanas:
        modo === 'ventana'
          ? [{ id: 'window:1', nombre: 'Editor', png: PNG_1X1, ancho: 1, alto: 1 }]
          : [],
    }),
    capturarVentana: async () => ({ png: PNG_1X1, ancho: 1, alto: 1 }),
    ocultarPropias: async () => {
      eventos.push('ocultar');
      return () => void eventos.push('restaurar');
    },
    crearVentana: () => {
      const v = { cerrada: false, alCerrar: [] as (() => void)[], emisor: { mainFrame: {} } };
      ventanas.push(v);
      eventos.push('ventana');
      const w: VentanaCaptura = {
        esDe: (e) => e === v.emisor,
        cerrar: () => {
          v.cerrada = true;
          v.alCerrar.forEach((f) => f());
        },
        alCerrar: (f) => void v.alCerrar.push(f),
      };
      return w;
    },
    copiarImagen: async () => undefined,
    pedirDestino: async () => null,
    guardarImagen: async (d, b) => ({ archivo: d, bytes: b.byteLength }),
    alConversor: () => void eventos.push('conversor'),
    explicarPermiso: async () => void eventos.push('explicar'),
    avisarAtajoOcupado: (a) => void avisos.push(a),
    config: async () => ({ atajo: null, formato: 'png' }),
    idioma: () => 'es',
    ...sobre,
  };
  return {
    servicio: new ServicioCaptura(deps),
    plataforma,
    registrados,
    ventanas,
    avisos,
    eventos,
  };
}

describe('atajo global', () => {
  it('no se registra nada hasta que el usuario lo activa', () => {
    const p = armar();
    expect(p.registrados.size).toBe(0);
  });

  it('activarlo lo registra y null lo quita', () => {
    const p = armar();
    expect(p.servicio.registrarAtajo('Ctrl+Alt+Shift+S')).toEqual({ ok: true });
    expect([...p.registrados.keys()]).toEqual(['Ctrl+Alt+Shift+S']);
    expect(p.servicio.registrarAtajo(null)).toEqual({ ok: true });
    expect(p.registrados.size).toBe(0);
  });

  it('si choca con otro programa avisa y no lo pisa', async () => {
    const p = armar({}, ['Ctrl+Alt+Shift+S']);
    expect(p.servicio.registrarAtajo('Ctrl+Alt+Shift+S', true)).toEqual({
      ok: false,
      codigo: 'captura.atajo_ocupado',
    });
    expect(p.registrados.size).toBe(0);
    expect(p.avisos).toEqual(['Ctrl+Alt+Shift+S']);
    const ui = await p.servicio.estadoUi();
    expect(ui.atajoOcupado).toBe(true);
    expect(ui.atajoActivo).toBe(false);
  });

  it('un cambio que choca deja el atajo anterior funcionando y sin aviso nativo', async () => {
    const p = armar({}, ['Ctrl+Shift+F9']);
    p.servicio.registrarAtajo('Ctrl+Alt+Shift+S');
    expect(p.servicio.registrarAtajo('Ctrl+Shift+F9').codigo).toBe('captura.atajo_ocupado');
    expect([...p.registrados.keys()]).toEqual(['Ctrl+Alt+Shift+S']);
    expect(p.avisos).toEqual([]);
    const ui = await p.servicio.estadoUi();
    expect(ui.atajoActivo).toBe(true);
    expect(ui.atajoOcupado).toBe(false);
  });

  it('cambiar a otro atajo libre suelta el anterior', () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Alt+Shift+S');
    p.servicio.registrarAtajo('Ctrl+Shift+F9');
    expect([...p.registrados.keys()]).toEqual(['Ctrl+Shift+F9']);
  });

  it('un atajo con forma rara ni llega al sistema', () => {
    const p = armar();
    expect(() => p.servicio.registrarAtajo('Ctrl+Shift+Intro')).toThrow(/no es válido/);
    expect(p.registrados.size).toBe(0);
  });

  it('un atajo poco seguro se rechaza en el núcleo con captura.atajo_no_permitido y no llega al sistema', () => {
    const p = armar();
    for (const malo of ['Ctrl+Shift+S', 'Ctrl+C', 'Alt+F4', 'Alt+F9', 'Shift+F9', 'Ctrl+Alt+Q']) {
      expect(() => p.servicio.registrarAtajo(malo), malo).toThrow(
        expect.objectContaining({ codigo: 'captura.atajo_no_permitido' }),
      );
    }
    expect(p.registrados.size).toBe(0);
    expect(p.servicio.registrarAtajo('Ctrl+Alt+Shift+S')).toEqual({ ok: true });
  });

  it('liberar suelta el atajo', () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Alt+Shift+S');
    p.servicio.liberar();
    expect(p.registrados.size).toBe(0);
  });

  it('al pulsarlo abre la captura de región', async () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Alt+Shift+S');
    p.registrados.get('Ctrl+Alt+Shift+S')!();
    await vi.waitFor(() => expect(p.ventanas.length).toBe(1));
    expect(p.servicio.datosSesion()?.modo).toBe('region');
  });

  it('si lanzar la captura con el atajo falla, el error queda en el registro y no sin atender', async () => {
    const errores: unknown[] = [];
    const p = armar({
      estado: () => Promise.reject(new Error('sin estado')),
      registrarError: (e) => void errores.push(e),
    });
    p.servicio.registrarAtajo('Ctrl+Alt+Shift+S');
    p.registrados.get('Ctrl+Alt+Shift+S')!();
    await vi.waitFor(() => expect(errores.length).toBe(1));
    expect(errores[0]).toMatchObject({ message: 'sin estado' });
    // Y no quedó bloqueada: la siguiente captura sí puede empezar.
    expect(await armar().servicio.iniciar('region')).toEqual({ ok: true });
  });
});

describe('iniciar la captura', () => {
  it('oculta las ventanas propias, captura y las vuelve a mostrar antes de abrir la ventana', async () => {
    const p = armar();
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
    expect(p.eventos).toEqual(['ocultar', 'restaurar', 'ventana']);
    const d = p.servicio.datosSesion()!;
    expect(d).toMatchObject({ modo: 'region', formato: 'png', idioma: 'es' });
    expect(d.pantalla?.png).toBe(PNG_1X1);
  });

  it('el modo ventana entrega las ventanas y no la pantalla', async () => {
    const p = armar();
    await p.servicio.iniciar('ventana');
    const d = p.servicio.datosSesion()!;
    expect(d.pantalla).toBeNull();
    expect(d.ventanas.map((v) => v.nombre)).toEqual(['Editor']);
  });

  it('el modo ventana sin ventanas abre la ventana de captura (que muestra sinVentanas), no no_disponible', async () => {
    const p = armar({ fuentes: async () => ({ pantalla: null, ventanas: [] }) });
    expect(await p.servicio.iniciar('ventana')).toEqual({ ok: true });
    expect(p.servicio.datosSesion()).toMatchObject({
      modo: 'ventana',
      ventanas: [],
      pantalla: null,
    });
    expect(p.ventanas.length).toBe(1);
  });

  it('el modo ventana nunca manda la pantalla entera aunque la fuente la traiga', async () => {
    const p = armar({
      fuentes: async () => ({
        pantalla: { png: PNG_1X1, ancho: 1, alto: 1 },
        ventanas: [{ id: 'window:1', nombre: 'A', png: PNG_1X1, ancho: 1, alto: 1 }],
      }),
    });
    await p.servicio.iniciar('ventana');
    expect(p.servicio.datosSesion()!.pantalla).toBeNull();
  });

  it('solo una captura a la vez, y al cerrar se puede otra', async () => {
    const p = armar();
    await p.servicio.iniciar('pantalla');
    expect(await p.servicio.iniciar('region')).toEqual({ ok: false, codigo: 'captura.ocupada' });
    p.servicio.cerrar();
    expect(p.ventanas[0]!.cerrada).toBe(true);
    expect(p.servicio.datosSesion()).toBeNull();
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
  });

  it('sin captura disponible no abre nada ni oculta ventanas', async () => {
    const p = armar();
    p.plataforma.estadoCaptura = { disponible: false, permiso: 'no_aplica' };
    expect(await p.servicio.iniciar('region')).toEqual({
      ok: false,
      codigo: 'captura.no_disponible',
    });
    expect(p.eventos).toEqual([]);
  });

  it('sin permiso del sistema lo explica y no captura (macOS)', async () => {
    const p = armar();
    p.plataforma.estadoCaptura = { disponible: true, permiso: 'denegado' };
    expect(await p.servicio.iniciar('region')).toEqual({
      ok: false,
      codigo: 'captura.permiso_denegado',
    });
    expect(p.eventos).toEqual(['explicar']);
  });

  it('el permiso que conoce el proceso principal manda sobre el de la Plataforma', async () => {
    const p = armar({ permisoSistema: () => 'denegado' });
    expect((await p.servicio.iniciar('region')).codigo).toBe('captura.permiso_denegado');
  });

  it('con el permiso pendiente, una captura vacía explica el permiso en vez de abrir una ventana negra', async () => {
    const p = armar({ fuentes: async () => ({ pantalla: null, ventanas: [] }) });
    p.plataforma.estadoCaptura = { disponible: true, permiso: 'pendiente' };
    expect((await p.servicio.iniciar('region')).codigo).toBe('captura.permiso_denegado');
    expect(p.eventos).toEqual(['ocultar', 'restaurar', 'explicar']);
    expect(p.ventanas.length).toBe(0);
  });

  it('si capturar falla, las ventanas propias vuelven a mostrarse', async () => {
    const p = armar({
      fuentes: async () => {
        throw new Error('fallo del sistema');
      },
      registrarError: () => undefined,
    });
    expect((await p.servicio.iniciar('region')).codigo).toBe('captura.no_disponible');
    expect(p.eventos).toEqual(['ocultar', 'restaurar']);
    expect(p.servicio.datosSesion()).toBeNull();
  });

  it('si crear la ventana falla no queda nada: ni datos, ni ventana, ni captura en curso', async () => {
    let falla = true;
    let crear: () => VentanaCaptura = () => {
      throw new Error('no se pudo crear');
    };
    const p = armar({ crearVentana: () => crear() });
    crear = () => {
      if (falla) throw new Error('no se pudo crear');
      return {
        esDe: () => false,
        cerrar: () => undefined,
        alCerrar: () => undefined,
      };
    };
    await expect(p.servicio.iniciar('region')).rejects.toThrow('no se pudo crear');
    expect(p.servicio.datosSesion()).toBeNull();
    expect(p.servicio.esVentana({})).toBe(false);
    falla = false;
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
  });

  it('la ventana de captura se crea después de capturar: no sale en su propia imagen', async () => {
    const p = armar();
    await p.servicio.iniciar('region');
    expect(p.eventos.indexOf('ventana')).toBeGreaterThan(p.eventos.indexOf('restaurar'));
  });
});

describe('salida de la captura', () => {
  it('guardar sin elegir destino no escribe nada', async () => {
    const guardar = vi.fn();
    const p = armar({ guardarImagen: guardar });
    await p.servicio.iniciar('pantalla');
    expect(await p.servicio.guardar(PNG_1X1, 'png')).toBeNull();
    expect(guardar).not.toHaveBeenCalled();
  });

  it('guardar pasa por abrirNuevo: nunca pisa un archivo existente', async () => {
    const dir = carpetaTemporal();
    const existente = join(dir, 'foto.png');
    writeFileSync(existente, 'no tocar');
    const p = armar({
      pedirDestino: async () => existente,
      guardarImagen: (d, b) => guardarImagen(d, b),
    });
    await p.servicio.iniciar('pantalla');
    const r = await p.servicio.guardar(PNG_1X1, 'png');
    expect(r?.archivo).toBe(join(dir, 'foto (1).png'));
    expect(readFileSync(existente, 'utf8')).toBe('no tocar');
    expect(readFileSync(join(dir, 'foto (1).png'))).toEqual(Buffer.from(PNG_1X1));
    expect(readdirSync(dir).sort()).toEqual(['foto (1).png', 'foto.png']);
  });

  it('si el destino no trae extensión se le pone la del formato', async () => {
    const guardar = vi.fn(async (d: string, b: Uint8Array) => ({
      archivo: d,
      bytes: b.byteLength,
    }));
    const p = armar({ pedirDestino: async () => 'C:/Capturas/mia', guardarImagen: guardar });
    await p.servicio.iniciar('pantalla');
    await p.servicio.guardar(PNG_1X1, 'png');
    expect(guardar.mock.calls[0]![0]).toBe('C:/Capturas/mia.png');
  });

  it('si la extensión no coincide con el formato se añade la correcta', () => {
    const casos: [string, 'png' | 'jpg', string][] = [
      ['C:/c/mia.txt', 'png', 'C:/c/mia.txt.png'],
      ['C:/c/mia.jpg', 'png', 'C:/c/mia.jpg.png'],
      ['C:/c/mia.PNG', 'png', 'C:/c/mia.PNG'],
      ['C:/c/mia.png', 'jpg', 'C:/c/mia.png.jpg'],
      ['C:/c/mia.jpeg', 'jpg', 'C:/c/mia.jpeg'],
      ['C:/c/mia.JPG', 'jpg', 'C:/c/mia.JPG'],
      ['C:/c/mia', 'jpg', 'C:/c/mia.jpg'],
      ['C:/c/mia.', 'png', 'C:/c/mia..png'],
    ];
    for (const [entrada, formato, esperado] of casos) {
      expect(destinoConExtension(entrada, formato), entrada).toBe(esperado);
    }
  });

  it('guardar exige una ventana abierta y un formato válido', async () => {
    const p = armar();
    await expect(p.servicio.guardar(PNG_1X1, 'png')).rejects.toMatchObject({
      codigo: 'captura.imagen_invalida',
    });
    await p.servicio.iniciar('pantalla');
    await expect(p.servicio.guardar(PNG_1X1, 'bmp')).rejects.toMatchObject({
      codigo: 'captura.imagen_invalida',
    });
  });

  it('el nombre sugerido lleva fecha y formato', () => {
    expect(nombreSugerido(new Date(2026, 10, 26, 14, 5, 9), 'jpg')).toBe(
      'captura-20261126-140509.jpg',
    );
  });

  it('copiar entrega el PNG al portapapeles y rechaza lo que no es una imagen', async () => {
    const copiar = vi.fn(async () => undefined);
    const p = armar({ copiarImagen: copiar });
    await p.servicio.iniciar('pantalla');
    await p.servicio.copiar(PNG_1X1);
    expect(copiar).toHaveBeenCalledWith(PNG_1X1);
    await expect(p.servicio.copiar(new Uint8Array([1, 2, 3]))).rejects.toMatchObject({
      codigo: 'captura.imagen_invalida',
    });
    await expect(p.servicio.copiar('texto')).rejects.toMatchObject({
      codigo: 'captura.imagen_invalida',
    });
  });

  it('enviar al conversor deja la imagen en memoria, avisa, cierra y se entrega una sola vez', async () => {
    const p = armar();
    await p.servicio.iniciar('pantalla');
    p.servicio.alConversor(PNG_1X1);
    expect(p.eventos).toContain('conversor');
    expect(p.ventanas[0]!.cerrada).toBe(true);
    const x = p.servicio.tomarPendiente();
    expect(x).toMatchObject({ ancho: 1, alto: 1 });
    expect(x?.bytes).toEqual(PNG_1X1);
    expect(p.servicio.tomarPendiente()).toBeNull();
  });

  it('al liberar se descarta lo pendiente', async () => {
    const p = armar();
    await p.servicio.iniciar('pantalla');
    p.servicio.alConversor(PNG_1X1);
    p.servicio.liberar();
    expect(p.servicio.tomarPendiente()).toBeNull();
  });

  it('no escribe ningún archivo por su cuenta: ni al capturar ni al enviar al conversor', async () => {
    const antes = new Set(readdirSync(tmpdir()));
    const p = armar();
    await p.servicio.iniciar('region');
    p.servicio.alConversor(PNG_1X1);
    p.servicio.tomarPendiente();
    const nuevos = readdirSync(tmpdir()).filter((n) => !antes.has(n) && /captura|wolf/i.test(n));
    expect(nuevos).toEqual([]);
  });
});

describe('validarImagenCaptura', () => {
  it('acepta un PNG y comprueba el formato pedido', () => {
    expect(validarImagenCaptura(PNG_1X1)).toBe(PNG_1X1);
    expect(validarImagenCaptura(PNG_1X1, 'png')).toBe(PNG_1X1);
    expect(() => validarImagenCaptura(PNG_1X1, 'jpg')).toThrow(/no es válida/);
  });

  it('rechaza lo que no es una imagen, lo vacío, lo gigante y las bombas de descompresión', () => {
    for (const malo of [null, 'x', [1, 2], new Uint8Array(0), new Uint8Array([1, 2, 3, 4])]) {
      expect(() => validarImagenCaptura(malo)).toThrow(/no es válida/);
    }
    expect(() => validarImagenCaptura(pngDeclarado(50_000, 50_000))).toThrow(/no es válida/);
    expect(() => validarImagenCaptura(pngDeclarado(11_000, 11_000))).toThrow(/no es válida/);
  });
});

describe('canales de la ventana de captura', () => {
  /** Evento IPC de la página principal de la ventana de captura. */
  const deLaPagina = (p: Prueba): { sender: object; senderFrame: object } => ({
    sender: p.ventanas[0]!.emisor,
    senderFrame: p.ventanas[0]!.emisor.mainFrame,
  });

  function canales(p: Prueba): Map<string, (e: unknown, ...a: unknown[]) => unknown> {
    const m = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    registrarIpcCaptura({ handle: (c, f) => void m.set(c, f) }, p.servicio);
    return m;
  }

  it('registra exactamente sus seis canales', () => {
    const c = canales(armar());
    expect([...c.keys()].sort()).toEqual(Object.values(CANALES_CAPTURA).sort());
  });

  it('solo responden a la página de la ventana de captura', async () => {
    const p = armar();
    const c = canales(p);
    // Sin ventana abierta, nadie puede usarlos.
    expect(() => c.get(CANALES_CAPTURA.datos)!({ sender: {} })).toThrow(/Origen no permitido/);
    await p.servicio.iniciar('region');
    const propia = deLaPagina(p);
    expect(c.get(CANALES_CAPTURA.datos)!(propia)).toMatchObject({ modo: 'region' });
    // La misma página pero desde un iframe (otro marco) tampoco: hace falta el marco principal.
    expect(() => c.get(CANALES_CAPTURA.datos)!({ sender: propia.sender, senderFrame: {} })).toThrow(
      /Origen no permitido/,
    );
    expect(() => c.get(CANALES_CAPTURA.datos)!({ sender: propia.sender })).toThrow(
      /Origen no permitido/,
    );
    // Ni la ventana principal ni otra página.
    for (const [canal, fn] of c) {
      expect(() => fn({ sender: {} }, PNG_1X1, 'png'), canal).toThrow(/Origen no permitido/);
      expect(() => fn(null), canal).toThrow(/Origen no permitido/);
    }
  });

  it('el canal ventana captura solo un id de la lista ya ofrecida, y solo en modo ventana', async () => {
    const pedidas: string[] = [];
    const p = armar({
      capturarVentana: async (id) => {
        pedidas.push(id);
        return { png: PNG_1X1, ancho: 1, alto: 1 };
      },
    });
    const c = canales(p);
    await p.servicio.iniciar('ventana');
    const ev = deLaPagina(p);
    expect(await c.get(CANALES_CAPTURA.ventana)!(ev, 'window:1')).toMatchObject({
      ancho: 1,
      alto: 1,
    });
    expect(pedidas).toEqual(['window:1']);
    // Un id que no estaba en la lista, o que no es un texto, ni se pide al sistema.
    for (const malo of ['window:999', 'screen:0', '', 7, null, { id: 'window:1' }]) {
      await expect(c.get(CANALES_CAPTURA.ventana)!(ev, malo), String(malo)).rejects.toMatchObject({
        codigo: 'captura.sin_imagen',
      });
    }
    expect(pedidas).toEqual(['window:1']);
    // Otro emisor: ni siquiera con un id válido.
    expect(() => c.get(CANALES_CAPTURA.ventana)!({ sender: {} }, 'window:1')).toThrow(
      /Origen no permitido/,
    );
  });

  it('el canal ventana no sirve fuera del modo ventana', async () => {
    const p = armar();
    const c = canales(p);
    await p.servicio.iniciar('region');
    await expect(c.get(CANALES_CAPTURA.ventana)!(deLaPagina(p), 'window:1')).rejects.toMatchObject({
      codigo: 'captura.sin_imagen',
    });
  });

  it('si la ventana ya no se puede capturar da captura.sin_imagen; si el sistema falla, no_disponible', async () => {
    const errores: unknown[] = [];
    let modo: 'nada' | 'falla' = 'nada';
    const p = armar({
      capturarVentana: async () => {
        if (modo === 'falla') throw new Error('sistema');
        return null;
      },
      registrarError: (e) => void errores.push(e),
    });
    await p.servicio.iniciar('ventana');
    await expect(p.servicio.capturarVentana('window:1')).rejects.toMatchObject({
      codigo: 'captura.sin_imagen',
    });
    modo = 'falla';
    await expect(p.servicio.capturarVentana('window:1')).rejects.toMatchObject({
      codigo: 'captura.no_disponible',
    });
    expect(errores.length).toBe(1);
  });

  it('cerrar desde la ventana la cierra', async () => {
    const p = armar();
    const c = canales(p);
    await p.servicio.iniciar('region');
    c.get(CANALES_CAPTURA.cerrar)!(deLaPagina(p));
    expect(p.ventanas[0]!.cerrada).toBe(true);
  });
});

describe('seguridad de la ventana de captura', () => {
  const RAIZ = join(__dirname, '..', 'src');

  it('sin Node, aislada, con sandbox y a pantalla completa sin marco', () => {
    const o = opcionesVentanaCaptura({
      preload: '/p/captura.cjs',
      zona: { x: 10, y: 20, width: 1920, height: 1080 },
    });
    expect(o.webPreferences).toMatchObject({
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: '/p/captura.cjs',
    });
    expect(o).toMatchObject({ x: 10, y: 20, width: 1920, height: 1080, frame: false });
    expect(o.skipTaskbar).toBe(true);
  });

  it('su CSP no admite orígenes remotos y la página lleva la misma', () => {
    for (const origen of ['http:', 'https:', 'ws:', 'wss:', '*', 'unsafe-eval', 'blob:']) {
      expect(CSP_CAPTURA, origen).not.toContain(origen);
    }
    expect(CSP_CAPTURA).toContain("default-src 'self'");
    expect(CSP_CAPTURA).toContain("connect-src 'self'");
    const html = readFileSync(join(RAIZ, 'renderer/captura/index.html'), 'utf8');
    expect(html).toContain(CSP_CAPTURA);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('el puente de la ventana solo expone sus seis funciones, por sus canales', () => {
    const src = readFileSync(join(RAIZ, 'preload/captura.ts'), 'utf8');
    expect(src).toContain("exposeInMainWorld('captura'");
    expect(src.match(/ipcRenderer\.invoke\(/g)).toHaveLength(6);
    expect(src).not.toMatch(/ipcRenderer\.(send|on|sendSync)\(/);
    expect(src).not.toMatch(/require\(|process\./);
  });

  it('la ventana no sale en capturas ajenas y no navega ni abre otras', () => {
    const src = readFileSync(join(RAIZ, 'main/capturaElectron.ts'), 'utf8');
    expect(src).toContain('setContentProtection(true)');
    expect(src).toContain("setWindowOpenHandler(() => ({ action: 'deny' }))");
    expect(src).toContain("on('will-navigate'");
    // Sin permisos y con sesión propia, y vigilada: no queda colgada.
    expect(src).toContain('denegarPermisos(v.webContents.session)');
    expect(src).toContain('vigilarVentana(');
    for (const ev of ["'did-fail-load'", "'render-process-gone'", "'unresponsive'"]) {
      expect(src, ev).toContain(ev);
    }
  });

  it('el modo ventana pide solo ventanas con miniaturas pequeñas y la real con otro getSources', () => {
    const src = readFileSync(join(RAIZ, 'main/capturaElectron.ts'), 'utf8');
    expect(src).toContain("types: ['window']");
    expect(src).not.toMatch(/types: \[[^\]]*'screen'[^\]]*'window'/);
    expect(src).toContain('MINIATURA_VENTANA = { width: 640, height: 400 }');
    expect(src.match(/desktopCapturer\.getSources\(/g)!.length).toBe(3);
  });

  it('la ventana de captura usa una partición propia en memoria (no persist:)', () => {
    const o = opcionesVentanaCaptura({
      preload: '/p/captura.cjs',
      zona: { x: 0, y: 0, width: 10, height: 10 },
    });
    expect(o.webPreferences.partition).toBe(PARTICION_CAPTURA);
    expect(PARTICION_CAPTURA.startsWith('persist:')).toBe(false);
  });

  it('denegarPermisos niega todo: peticiones y comprobaciones', () => {
    let pedir: ((wc: unknown, perm: string, cb: (ok: boolean) => void) => void) | null = null;
    let comprobar: (() => boolean) | null = null;
    denegarPermisos({
      setPermissionRequestHandler: (fn) => void (pedir = fn),
      setPermissionCheckHandler: (fn) => void (comprobar = fn),
    });
    for (const permiso of [
      'media',
      'geolocation',
      'notifications',
      'clipboard-read',
      'display-capture',
    ]) {
      const respuestas: boolean[] = [];
      pedir!({}, permiso, (ok) => respuestas.push(ok));
      expect(respuestas, permiso).toEqual([false]);
    }
    expect(comprobar!()).toBe(false);
  });

  it('el código de la captura no usa red, procesos ni escribe archivos', () => {
    const archivos = [
      'main/captura.ts',
      'main/capturaElectron.ts',
      'preload/captura.ts',
      'renderer/captura/Captura.vue',
      'renderer/captura/EditorCaptura.vue',
      'renderer/captura/herramientasDibujo.ts',
    ];
    for (const a of archivos) {
      const src = readFileSync(join(RAIZ, a), 'utf8');
      expect(src, a).not.toMatch(
        /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|node:(?:https?|net|dgram|tls)\b/,
      );
      expect(src, a).not.toMatch(
        /child_process|node:fs|writeFile|createWriteStream|tmpdir|localStorage/,
      );
      expect(src, a).not.toMatch(/https?:\/\/[a-z]/i);
    }
  });

  it('el atajo solo se registra al arrancar si hay uno guardado, y se libera al cerrar', () => {
    const src = readFileSync(join(RAIZ, 'main/index.ts'), 'utf8');
    expect(src).toContain('if (cfg.atajo) servicioCaptura.registrarAtajo(cfg.atajo, true)');
    expect(src.match(/captura\?\.liberar\(\)/g)!.length).toBeGreaterThanOrEqual(3);
    expect(existsSync(join(RAIZ, 'main/captura.ts'))).toBe(true);
  });
});

describe('la ventana de captura no se cuelga', () => {
  /** Ventana nativa falsa con los eventos que vigila el servicio. */
  function nativaFalsa() {
    const n = {
      destruida: 0,
      lista: [] as (() => void)[],
      fallos: [] as (() => void)[],
      cierres: [] as (() => void)[],
    };
    const vigilable: VentanaVigilable = {
      alListaParaMostrar: (fn) => void n.lista.push(fn),
      alFallar: (fn) => void n.fallos.push(fn),
      alCerrar: (fn) => void n.cierres.push(fn),
      destruir: () => {
        n.destruida++;
        // Destruir una ventana de Electron emite 'closed'.
        n.cierres.forEach((f) => f());
      },
    };
    return { n, vigilable };
  }

  /** Servicio cuya ventana de captura es una nativa falsa vigilada como en Electron. */
  function conNativa(sobre: Partial<DepsCaptura> = {}) {
    const nativa = nativaFalsa();
    const p = armar({
      crearVentana: () => {
        vigilarVentana(nativa.vigilable);
        return {
          esDe: () => true,
          cerrar: () => nativa.vigilable.destruir(),
          alCerrar: (fn) => nativa.vigilable.alCerrar(fn),
        };
      },
      ...sobre,
    });
    return { p, ...nativa };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('si la carga falla, la ventana se destruye y todo queda libre', async () => {
    const { p, n } = conNativa();
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
    expect(p.eventos).toEqual(['ocultar', 'restaurar']);
    n.fallos[0]!();
    expect(n.destruida).toBe(1);
    expect(p.servicio.datosSesion()).toBeNull();
    expect(p.servicio.esVentana({})).toBe(false);
    // `iniciando` y `ventana` libres: se puede capturar otra vez.
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
  });

  it('si el proceso muere o no responde después de mostrarse, también se destruye (una sola vez)', async () => {
    const { p, n } = conNativa();
    await p.servicio.iniciar('pantalla');
    n.lista[0]!();
    n.fallos[0]!();
    n.fallos[0]!();
    expect(n.destruida).toBe(1);
    expect(p.servicio.datosSesion()).toBeNull();
  });

  it('si no está lista en 10 s se destruye; si lo está, el plazo ya no la toca', async () => {
    vi.useFakeTimers();
    const colgada = conNativa();
    await colgada.p.servicio.iniciar('region');
    vi.advanceTimersByTime(PLAZO_CARGA_VENTANA_MS - 1);
    expect(colgada.n.destruida).toBe(0);
    vi.advanceTimersByTime(1);
    expect(colgada.n.destruida).toBe(1);
    expect(colgada.p.servicio.datosSesion()).toBeNull();

    const buena = conNativa();
    await buena.p.servicio.iniciar('region');
    buena.n.lista[0]!();
    vi.advanceTimersByTime(PLAZO_CARGA_VENTANA_MS * 3);
    expect(buena.n.destruida).toBe(0);
    expect(buena.p.servicio.datosSesion()).not.toBeNull();
  });

  it('cerrar la ventana a tiempo cancela el plazo', async () => {
    vi.useFakeTimers();
    const { p, n } = conNativa();
    await p.servicio.iniciar('region');
    p.servicio.cerrar();
    expect(n.destruida).toBe(1);
    vi.advanceTimersByTime(PLAZO_CARGA_VENTANA_MS * 2);
    expect(n.destruida).toBe(1);
  });

  it('getSources que nunca resuelve: a los 10 s da no_disponible y la ventana principal vuelve', async () => {
    vi.useFakeTimers();
    const errores: unknown[] = [];
    const p = armar({
      fuentes: () => new Promise(() => undefined),
      registrarError: (e) => void errores.push(e),
    });
    const r = p.servicio.iniciar('region');
    await vi.advanceTimersByTimeAsync(PLAZO_FUENTES_MS - 1);
    expect(p.eventos).toEqual(['ocultar']);
    await vi.advanceTimersByTimeAsync(1);
    expect(await r).toEqual({ ok: false, codigo: 'captura.no_disponible' });
    expect(p.eventos).toEqual(['ocultar', 'restaurar']);
    expect(errores.length).toBe(1);
    expect(p.ventanas.length).toBe(0);
    // `iniciando` y `ventana` quedaron libres.
    p.servicio['deps'].fuentes = async () => ({
      pantalla: { png: PNG_1X1, ancho: 1, alto: 1 },
      ventanas: [],
    });
    expect(await p.servicio.iniciar('region')).toEqual({ ok: true });
  });

  it('capturar la ventana elegida que nunca responde también da no_disponible a los 10 s', async () => {
    vi.useFakeTimers();
    const p = armar({
      capturarVentana: () => new Promise(() => undefined),
      registrarError: () => undefined,
    });
    await p.servicio.iniciar('ventana');
    const r = p.servicio.capturarVentana('window:1');
    const visto = expect(r).rejects.toMatchObject({ codigo: 'captura.no_disponible' });
    await vi.advanceTimersByTimeAsync(PLAZO_FUENTES_MS);
    await visto;
    // Y se puede volver a intentar.
    p.servicio['deps'].capturarVentana = async () => ({ png: PNG_1X1, ancho: 1, alto: 1 });
    await expect(p.servicio.capturarVentana('window:1')).resolves.toMatchObject({ ancho: 1 });
  });

  it('conPlazo deja pasar lo que llega a tiempo y lo que rechaza', async () => {
    await expect(conPlazo(Promise.resolve(7), 50)).resolves.toBe(7);
    await expect(conPlazo(Promise.reject(new Error('x')), 50)).rejects.toThrow('x');
  });
});

describe('captura pendiente del conversor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('caduca a los 2 minutos', async () => {
    vi.useFakeTimers();
    const p = armar();
    await p.servicio.iniciar('pantalla');
    p.servicio.alConversor(PNG_1X1);
    vi.advanceTimersByTime(CADUCIDAD_PENDIENTE_MS - 1);
    expect(p.servicio['pendiente']).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(p.servicio.tomarPendiente()).toBeNull();
  });

  it('recogerla a tiempo la entrega y cancela el plazo; otra captura reinicia el plazo', async () => {
    vi.useFakeTimers();
    const p = armar();
    await p.servicio.iniciar('pantalla');
    p.servicio.alConversor(PNG_1X1);
    vi.advanceTimersByTime(CADUCIDAD_PENDIENTE_MS - 10);
    await p.servicio.iniciar('pantalla');
    p.servicio.alConversor(PNG_1X1);
    vi.advanceTimersByTime(CADUCIDAD_PENDIENTE_MS - 10);
    expect(p.servicio.tomarPendiente()).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
