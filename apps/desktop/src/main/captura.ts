import {
  dimensionesImagen,
  ErrorWolf,
  esAtajoCaptura,
  LIMITES_IMAGEN,
  type CapturaConfig,
  type EstadoCaptura,
  type FormatoCaptura,
  type IdiomaUi,
} from '@pel/core';
import {
  CANALES_CAPTURA,
  type DatosCaptura,
  type EstadoCapturaUi,
  type ImagenCaptura,
  type ImagenPendiente,
  type ModoCaptura,
  type ResultadoAtajo,
  type ResultadoIniciarCaptura,
  type VentanaCapturable,
} from '../shared/captura';

/**
 * Captura de pantalla (D35), 100 % local: la imagen vive en la memoria de este proceso y de la
 * ventana de captura; no se escribe ningún archivo salvo el que el usuario guarda con "Guardar
 * como" (por `abrirNuevo`, sin pisar nada). Todo lo de Electron entra por `DepsCaptura`, así que
 * las pruebas usan una Plataforma falsa con una imagen fija y no tocan la pantalla ni el teclado.
 */

/** CSP de la ventana de captura: solo lo propio, ningún origen remoto. */
export const CSP_CAPTURA =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

export interface OpcionesVentanaCaptura {
  preload: string;
  /** Zona de la pantalla activa (coordenadas del escritorio). */
  zona: { x: number; y: number; width: number; height: number };
}

/**
 * Opciones de la ventana de captura: sin marco, a pantalla completa de la pantalla activa, sin
 * Node y aislada. Es una función pura para poder revisarla en una prueba.
 */
export function opcionesVentanaCaptura(o: OpcionesVentanaCaptura): {
  x: number;
  y: number;
  width: number;
  height: number;
  show: boolean;
  frame: boolean;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  fullscreenable: boolean;
  skipTaskbar: boolean;
  alwaysOnTop: boolean;
  hasShadow: boolean;
  backgroundColor: string;
  title: string;
  webPreferences: {
    preload: string;
    contextIsolation: boolean;
    sandbox: boolean;
    nodeIntegration: boolean;
    webSecurity: boolean;
    allowRunningInsecureContent: boolean;
    spellcheck: boolean;
  };
} {
  return {
    ...o.zona,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: '#000000',
    title: 'WolfCore Dev',
    webPreferences: {
      preload: o.preload,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  };
}

/** Lo que el servicio necesita de la ventana de captura. */
export interface VentanaCaptura {
  /** ¿Este emisor IPC es la página de esta ventana? */
  esDe(emisor: unknown): boolean;
  cerrar(): void;
  alCerrar(fn: () => void): void;
}

export interface FuentesCaptura {
  pantalla: ImagenCaptura | null;
  ventanas: VentanaCapturable[];
}

export interface DepsCaptura {
  atajos: {
    register(atajo: string, fn: () => void): boolean;
    unregister(atajo: string): void;
    isRegistered(atajo: string): boolean;
  };
  /** `Plataforma.capturaDisponible()`. */
  estado(): Promise<EstadoCaptura>;
  /** Permiso real del sistema si el proceso principal lo conoce mejor (macOS). */
  permisoSistema?(): EstadoCaptura['permiso'] | null;
  /** Pantalla bajo el cursor y, según el modo, las ventanas; con las propias ya ocultas. */
  fuentes(modo: ModoCaptura): Promise<FuentesCaptura>;
  /** Oculta las ventanas de la app y devuelve cómo volver a mostrarlas. */
  ocultarPropias(): Promise<() => void>;
  /** Abre la ventana de captura (con protección de contenido: no sale en otras capturas). */
  crearVentana(): VentanaCaptura;
  copiarImagen(bytes: Uint8Array): Promise<void>;
  /** "Guardar como": la ruta elegida o null si se canceló. */
  pedirDestino(
    sugerido: string,
    formato: FormatoCaptura,
    ventana: VentanaCaptura,
  ): Promise<string | null>;
  /** `Nucleo.guardarImagen`: archivo nuevo vía `abrirNuevo`. */
  guardarImagen(destino: string, bytes: Uint8Array): Promise<{ archivo: string; bytes: number }>;
  /** Avisa a la ventana principal que hay una captura para el conversor y la trae al frente. */
  alConversor(info: { ancho: number; alto: number }): void;
  explicarPermiso(): Promise<void>;
  /** Aviso nativo de que el atajo pedido ya lo usa otro programa. */
  avisarAtajoOcupado(atajo: string): void;
  config(): Promise<CapturaConfig>;
  idioma(): IdiomaUi;
  ahora?(): Date;
  /** Para que los errores de fondo (atajo, fuentes) queden en el registro. */
  registrarError?(e: unknown): void;
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/** `captura-20261126-141500.png`. */
export function nombreSugerido(fecha: Date, formato: FormatoCaptura): string {
  const f =
    `${fecha.getFullYear()}${dosDigitos(fecha.getMonth() + 1)}${dosDigitos(fecha.getDate())}` +
    `-${dosDigitos(fecha.getHours())}${dosDigitos(fecha.getMinutes())}${dosDigitos(fecha.getSeconds())}`;
  return `captura-${f}.${formato}`;
}

const invalida = (): ErrorWolf =>
  new ErrorWolf('captura.imagen_invalida', 'La imagen de la captura no es válida.');

/**
 * Lo que manda la ventana de captura es una entrada no confiable: bytes con tope, de tipo PNG o
 * JPEG (por el contenido, no por lo que diga el nombre) y con dimensiones razonables.
 */
export function validarImagenCaptura(v: unknown, formato?: FormatoCaptura): Uint8Array {
  if (
    !(v instanceof Uint8Array) ||
    v.byteLength === 0 ||
    v.byteLength > LIMITES_IMAGEN.bytesSalida
  ) {
    throw invalida();
  }
  const d = dimensionesImagen(v);
  if (!d || (d.tipo !== 'png' && d.tipo !== 'jpeg')) throw invalida();
  if (formato !== undefined && d.tipo !== (formato === 'jpg' ? 'jpeg' : 'png')) throw invalida();
  if (
    d.ancho < 1 ||
    d.alto < 1 ||
    d.ancho > LIMITES_IMAGEN.ladoMax ||
    d.alto > LIMITES_IMAGEN.ladoMax ||
    d.ancho * d.alto > LIMITES_IMAGEN.pixelesMax
  ) {
    throw invalida();
  }
  return v;
}

export function esFormatoCaptura(v: unknown): v is FormatoCaptura {
  return v === 'png' || v === 'jpg';
}

export class ServicioCaptura {
  private registrado: string | null = null;
  private ocupado = false;
  private iniciando = false;
  private ventana: VentanaCaptura | null = null;
  private datos: DatosCaptura | null = null;
  private pendiente: ImagenPendiente | null = null;

  constructor(private readonly deps: DepsCaptura) {}

  /**
   * Registra (o quita, con null) el atajo global. Si otro programa ya lo usa no se pisa: devuelve
   * `captura.atajo_ocupado` y deja lo que había. Solo lo llama quien tiene el permiso del usuario
   * (la configuración que él activó). `avisar` (al arrancar, sin nadie mirando Ajustes) muestra
   * además un aviso nativo.
   */
  registrarAtajo(atajo: string | null, avisar = false): ResultadoAtajo {
    if (atajo === null) {
      if (this.registrado) this.deps.atajos.unregister(this.registrado);
      this.registrado = null;
      this.ocupado = false;
      return { ok: true };
    }
    if (!esAtajoCaptura(atajo)) {
      throw new ErrorWolf('captura.atajo_invalido', 'El atajo de captura no es válido.');
    }
    if (atajo === this.registrado) return { ok: true };
    let ok = false;
    try {
      ok =
        !this.deps.atajos.isRegistered(atajo) &&
        this.deps.atajos.register(atajo, () => {
          void this.iniciar('region').then((r) => {
            if (!r.ok && r.codigo === 'captura.no_disponible') this.deps.registrarError?.(r.codigo);
          });
        });
    } catch (e) {
      this.deps.registrarError?.(e);
    }
    if (!ok) {
      // Solo cuenta como "ocupado" si no quedó otro atajo funcionando.
      this.ocupado = this.registrado === null;
      if (avisar) this.deps.avisarAtajoOcupado(atajo);
      return { ok: false, codigo: 'captura.atajo_ocupado' };
    }
    if (this.registrado) this.deps.atajos.unregister(this.registrado);
    this.registrado = atajo;
    this.ocupado = false;
    return { ok: true };
  }

  /** Una captura a la vez: la ventana abierta o una en preparación la bloquean. */
  async iniciar(modo: ModoCaptura): Promise<ResultadoIniciarCaptura> {
    if (this.iniciando || this.ventana) return { ok: false, codigo: 'captura.ocupada' };
    this.iniciando = true;
    try {
      const estado = await this.deps.estado();
      if (!estado.disponible) return { ok: false, codigo: 'captura.no_disponible' };
      const permiso = this.deps.permisoSistema?.() ?? estado.permiso;
      if (permiso === 'denegado') {
        await this.deps.explicarPermiso();
        return { ok: false, codigo: 'captura.permiso_denegado' };
      }
      const restaurar = await this.deps.ocultarPropias();
      let fuentes: FuentesCaptura;
      try {
        fuentes = await this.deps.fuentes(modo);
      } catch (e) {
        this.deps.registrarError?.(e);
        return { ok: false, codigo: 'captura.no_disponible' };
      } finally {
        restaurar();
      }
      if (!fuentes.pantalla && fuentes.ventanas.length === 0) {
        // Sin imagen: en macOS sin permiso el sistema devuelve vacío en vez de un error.
        if (permiso === 'pendiente') {
          await this.deps.explicarPermiso();
          return { ok: false, codigo: 'captura.permiso_denegado' };
        }
        return { ok: false, codigo: 'captura.no_disponible' };
      }
      const cfg = await this.deps.config();
      this.datos = {
        modo,
        formato: cfg.formato,
        idioma: this.deps.idioma(),
        pantalla: fuentes.pantalla,
        ventanas: fuentes.ventanas,
      };
      const v = this.deps.crearVentana();
      this.ventana = v;
      v.alCerrar(() => {
        if (this.ventana === v) {
          this.ventana = null;
          this.datos = null;
        }
      });
      return { ok: true };
    } finally {
      this.iniciando = false;
    }
  }

  esVentana(emisor: unknown): boolean {
    return this.ventana !== null && this.ventana.esDe(emisor);
  }

  datosSesion(): DatosCaptura | null {
    return this.datos;
  }

  async copiar(bytes: unknown): Promise<void> {
    await this.deps.copiarImagen(validarImagenCaptura(bytes, 'png'));
  }

  /** "Guardar como" y archivo nuevo (nunca pisa uno existente). null si se canceló el diálogo. */
  async guardar(bytes: unknown, formato: unknown): Promise<{ archivo: string } | null> {
    if (!esFormatoCaptura(formato) || !this.ventana) throw invalida();
    const datos = validarImagenCaptura(bytes, formato);
    const sugerido = nombreSugerido(this.deps.ahora?.() ?? new Date(), formato);
    const elegido = await this.deps.pedirDestino(sugerido, formato, this.ventana);
    if (elegido === null) return null;
    const destino = /\.[A-Za-z0-9]{1,5}$/.test(elegido) ? elegido : `${elegido}.${formato}`;
    const r = await this.deps.guardarImagen(destino, datos);
    return { archivo: r.archivo };
  }

  /** La imagen espera en memoria (no en disco) a que el conversor la pida con `tomarPendiente`. */
  alConversor(bytes: unknown): void {
    const datos = validarImagenCaptura(bytes);
    const d = dimensionesImagen(datos)!;
    this.pendiente = { bytes: datos, ancho: d.ancho, alto: d.alto };
    this.deps.alConversor({ ancho: d.ancho, alto: d.alto });
    this.cerrar();
  }

  /** Entrega la imagen pendiente una sola vez. */
  tomarPendiente(): ImagenPendiente | null {
    const p = this.pendiente;
    this.pendiente = null;
    return p;
  }

  cerrar(): void {
    const v = this.ventana;
    this.ventana = null;
    this.datos = null;
    v?.cerrar();
  }

  async estadoUi(): Promise<EstadoCapturaUi> {
    return {
      config: await this.deps.config(),
      sistema: await this.deps.estado(),
      atajoActivo: this.registrado !== null,
      atajoOcupado: this.ocupado,
    };
  }

  /** Al cerrar la app: libera el atajo, cierra la ventana y suelta la memoria. */
  liberar(): void {
    if (this.registrado) {
      try {
        this.deps.atajos.unregister(this.registrado);
      } catch (e) {
        this.deps.registrarError?.(e);
      }
    }
    this.registrado = null;
    this.pendiente = null;
    this.cerrar();
  }
}

export interface IpcCapturaLike {
  handle(canal: string, fn: (evento: unknown, ...args: unknown[]) => unknown): void;
}

/**
 * Canales de la ventana de captura. Solo responden a la página de esa ventana (`esVentana`): ni la
 * ventana principal ni otra página pueden usarlos.
 */
export function registrarIpcCaptura(ipc: IpcCapturaLike, servicio: ServicioCaptura): void {
  const solo =
    <A extends unknown[], R>(fn: (...a: A) => R) =>
    (e: unknown, ...a: unknown[]): R => {
      const emisor = (e as { sender?: unknown } | null)?.sender;
      if (!servicio.esVentana(emisor)) throw new Error('Origen no permitido');
      return fn(...(a as A));
    };
  ipc.handle(
    CANALES_CAPTURA.datos,
    solo(() => servicio.datosSesion()),
  );
  ipc.handle(
    CANALES_CAPTURA.copiar,
    solo((bytes: unknown) => servicio.copiar(bytes)),
  );
  ipc.handle(
    CANALES_CAPTURA.guardar,
    solo((bytes: unknown, formato: unknown) => servicio.guardar(bytes, formato)),
  );
  ipc.handle(
    CANALES_CAPTURA.alConversor,
    solo((bytes: unknown) => servicio.alConversor(bytes)),
  );
  ipc.handle(
    CANALES_CAPTURA.cerrar,
    solo(() => servicio.cerrar()),
  );
}
