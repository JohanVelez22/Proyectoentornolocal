import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { guardarImagen, PlataformaFalsa } from '@pel/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CSP_CAPTURA,
  nombreSugerido,
  opcionesVentanaCaptura,
  registrarIpcCaptura,
  ServicioCaptura,
  validarImagenCaptura,
  type DepsCaptura,
  type VentanaCaptura,
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
  ventanas: { cerrada: boolean; alCerrar: (() => void)[]; emisor: object }[];
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
    ocultarPropias: async () => {
      eventos.push('ocultar');
      return () => void eventos.push('restaurar');
    },
    crearVentana: () => {
      const v = { cerrada: false, alCerrar: [] as (() => void)[], emisor: {} };
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
    expect(p.servicio.registrarAtajo('Ctrl+Shift+S')).toEqual({ ok: true });
    expect([...p.registrados.keys()]).toEqual(['Ctrl+Shift+S']);
    expect(p.servicio.registrarAtajo(null)).toEqual({ ok: true });
    expect(p.registrados.size).toBe(0);
  });

  it('si choca con otro programa avisa y no lo pisa', async () => {
    const p = armar({}, ['Ctrl+Shift+S']);
    expect(p.servicio.registrarAtajo('Ctrl+Shift+S', true)).toEqual({
      ok: false,
      codigo: 'captura.atajo_ocupado',
    });
    expect(p.registrados.size).toBe(0);
    expect(p.avisos).toEqual(['Ctrl+Shift+S']);
    const ui = await p.servicio.estadoUi();
    expect(ui.atajoOcupado).toBe(true);
    expect(ui.atajoActivo).toBe(false);
  });

  it('un cambio que choca deja el atajo anterior funcionando y sin aviso nativo', async () => {
    const p = armar({}, ['Alt+F9']);
    p.servicio.registrarAtajo('Ctrl+Shift+S');
    expect(p.servicio.registrarAtajo('Alt+F9').codigo).toBe('captura.atajo_ocupado');
    expect([...p.registrados.keys()]).toEqual(['Ctrl+Shift+S']);
    expect(p.avisos).toEqual([]);
    const ui = await p.servicio.estadoUi();
    expect(ui.atajoActivo).toBe(true);
    expect(ui.atajoOcupado).toBe(false);
  });

  it('cambiar a otro atajo libre suelta el anterior', () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Shift+S');
    p.servicio.registrarAtajo('Alt+F9');
    expect([...p.registrados.keys()]).toEqual(['Alt+F9']);
  });

  it('un atajo con forma rara ni llega al sistema', () => {
    const p = armar();
    expect(() => p.servicio.registrarAtajo('Ctrl+Shift+Intro')).toThrow(/no es válido/);
    expect(p.registrados.size).toBe(0);
  });

  it('liberar suelta el atajo', () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Shift+S');
    p.servicio.liberar();
    expect(p.registrados.size).toBe(0);
  });

  it('al pulsarlo abre la captura de región', async () => {
    const p = armar();
    p.servicio.registrarAtajo('Ctrl+Shift+S');
    p.registrados.get('Ctrl+Shift+S')!();
    await vi.waitFor(() => expect(p.ventanas.length).toBe(1));
    expect(p.servicio.datosSesion()?.modo).toBe('region');
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
  function canales(p: Prueba): Map<string, (e: unknown, ...a: unknown[]) => unknown> {
    const m = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    registrarIpcCaptura({ handle: (c, f) => void m.set(c, f) }, p.servicio);
    return m;
  }

  it('registra exactamente sus cinco canales', () => {
    const c = canales(armar());
    expect([...c.keys()].sort()).toEqual(Object.values(CANALES_CAPTURA).sort());
  });

  it('solo responden a la página de la ventana de captura', async () => {
    const p = armar();
    const c = canales(p);
    // Sin ventana abierta, nadie puede usarlos.
    expect(() => c.get(CANALES_CAPTURA.datos)!({ sender: {} })).toThrow(/Origen no permitido/);
    await p.servicio.iniciar('region');
    const propia = { sender: p.ventanas[0]!.emisor };
    expect(c.get(CANALES_CAPTURA.datos)!(propia)).toMatchObject({ modo: 'region' });
    // Ni la ventana principal ni otra página.
    for (const [canal, fn] of c) {
      expect(() => fn({ sender: {} }, PNG_1X1, 'png'), canal).toThrow(/Origen no permitido/);
      expect(() => fn(null), canal).toThrow(/Origen no permitido/);
    }
  });

  it('cerrar desde la ventana la cierra', async () => {
    const p = armar();
    const c = canales(p);
    await p.servicio.iniciar('region');
    c.get(CANALES_CAPTURA.cerrar)!({ sender: p.ventanas[0]!.emisor });
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

  it('el puente de la ventana solo expone sus cinco funciones, por sus canales', () => {
    const src = readFileSync(join(RAIZ, 'preload/captura.ts'), 'utf8');
    expect(src).toContain("exposeInMainWorld('captura'");
    expect(src.match(/ipcRenderer\.invoke\(/g)).toHaveLength(5);
    expect(src).not.toMatch(/ipcRenderer\.(send|on|sendSync)\(/);
    expect(src).not.toMatch(/require\(|process\./);
  });

  it('la ventana no sale en capturas ajenas y no navega ni abre otras', () => {
    const src = readFileSync(join(RAIZ, 'main/capturaElectron.ts'), 'utf8');
    expect(src).toContain('setContentProtection(true)');
    expect(src).toContain("setWindowOpenHandler(() => ({ action: 'deny' }))");
    expect(src).toContain("on('will-navigate'");
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
