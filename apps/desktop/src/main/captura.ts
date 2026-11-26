import {
  dimensionesImagen,
  ErrorWolf,
  LIMITES_IMAGEN,
  motivoAtajoCaptura,
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
    partition: string;
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
      partition: PARTICION_CAPTURA,
    },
  };
}

/**
 * Sesión propia de la ventana de captura. Sin el prefijo `persist:` vive solo en memoria: no deja
 * cookies, caché ni almacenamiento en disco, y sus permisos se pueden cerrar sin tocar los de la app.
 */
export const PARTICION_CAPTURA = 'wolf-captura';

/** Plazo para obtener las fuentes de `desktopCapturer` (pantalla o ventanas). */
export const PLAZO_FUENTES_MS = 10_000;
/** Plazo desde que se pide cargar la ventana de captura hasta `ready-to-show`. */
export const PLAZO_CARGA_VENTANA_MS = 10_000;
/** Lo que espera en memoria una captura enviada al conversor antes de olvidarse. */
export const CADUCIDAD_PENDIENTE_MS = 2 * 60_000;

/** Lo que se usa de una sesión de Electron para cerrarle los permisos. */
export interface SesionPermisos {
  setPermissionRequestHandler(
    fn: (webContents: unknown, permiso: string, devolver: (concedido: boolean) => void) => void,
  ): void;
  setPermissionCheckHandler(fn: () => boolean): void;
}

/** La ventana de captura no necesita ningún permiso (cámara, ubicación, notificaciones...). */
export function denegarPermisos(sesion: SesionPermisos): void {
  sesion.setPermissionRequestHandler((_wc, _permiso, devolver) => devolver(false));
  sesion.setPermissionCheckHandler(() => false);
}

/** Lo que `vigilarVentana` necesita de la ventana nativa (en las pruebas, un doble). */
export interface VentanaVigilable {
  /** Se dispara una vez cuando la página está lista para mostrarse (`ready-to-show`). */
  alListaParaMostrar(fn: () => void): void;
  /**
   * La carga falló (`did-fail-load` de la página principal), el proceso de la página murió
   * (`render-process-gone`) o dejó de responder (`unresponsive`).
   */
  alFallar(fn: () => void): void;
  /** La ventana ya se cerró o se destruyó. */
  alCerrar(fn: () => void): void;
  destruir(): void;
}

/**
 * Una ventana de captura que no carga, que muere o que se cuelga no puede quedar flotando sobre
 * todo el escritorio: se destruye (su cierre libera el estado del servicio). También se destruye
 * si no está lista para mostrarse en `plazoMs`.
 */
export function vigilarVentana(
  v: VentanaVigilable,
  plazoMs: number = PLAZO_CARGA_VENTANA_MS,
): void {
  let cerrada = false;
  const destruir = (): void => {
    if (cerrada) return;
    cerrada = true;
    clearTimeout(temporizador);
    v.destruir();
  };
  const temporizador = setTimeout(destruir, plazoMs);
  v.alListaParaMostrar(() => clearTimeout(temporizador));
  v.alFallar(destruir);
  v.alCerrar(() => {
    cerrada = true;
    clearTimeout(temporizador);
  });
}

/** Rechaza con `captura.no_disponible` si `p` no termina en `ms`. */
export function conPlazo<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const t = setTimeout(
      () => rechazar(new ErrorWolf('captura.no_disponible', 'La captura tardó demasiado.')),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolver(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        rechazar(e);
      },
    );
  });
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
  /**
   * Pantalla bajo el cursor (región y pantalla) o, en modo ventana, solo la lista de ventanas con
   * miniaturas pequeñas; con las propias ya ocultas.
   */
  fuentes(modo: ModoCaptura): Promise<FuentesCaptura>;
  /** La ventana elegida a tamaño real (id de la lista ya ofrecida), o null si ya no está. */
  capturarVentana(id: string): Promise<ImagenCaptura | null>;
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

/**
 * La extensión del archivo debe coincidir con el formato de los bytes: si falta o es otra, se añade
 * la correcta (`foto.txt` → `foto.txt.png`) en vez de guardar un PNG con nombre de otro tipo.
 */
export function destinoConExtension(elegido: string, formato: FormatoCaptura): string {
  const ext = /\.([A-Za-z0-9]{1,5})$/.exec(elegido)?.[1]?.toLowerCase();
  const validas = formato === 'jpg' ? ['jpg', 'jpeg'] : ['png'];
  return ext !== undefined && validas.includes(ext) ? elegido : `${elegido}.${formato}`;
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
  private caducaPendiente: ReturnType<typeof setTimeout> | null = null;
  private capturandoVentana = false;

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
    const motivo = motivoAtajoCaptura(atajo);
    if (motivo === 'no_permitido') {
      throw new ErrorWolf(
        'captura.atajo_no_permitido',
        'Ese atajo no se permite: use Ctrl o Super con otro modificador y evite los atajos comunes.',
      );
    }
    if (motivo !== null) {
      throw new ErrorWolf('captura.atajo_invalido', 'El atajo de captura no es válido.');
    }
    if (atajo === this.registrado) return { ok: true };
    let ok = false;
    try {
      ok =
        !this.deps.atajos.isRegistered(atajo) &&
        this.deps.atajos.register(atajo, () => {
          void this.iniciar('region')
            .then((r) => {
              if (!r.ok && r.codigo === 'captura.no_disponible') {
                this.deps.registrarError?.(r.codigo);
              }
            })
            .catch((e: unknown) => this.deps.registrarError?.(e));
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
        fuentes = await conPlazo(this.deps.fuentes(modo), PLAZO_FUENTES_MS);
      } catch (e) {
        this.deps.registrarError?.(e);
        return { ok: false, codigo: 'captura.no_disponible' };
      } finally {
        restaurar();
      }
      // En modo ventana la lista vacía es un resultado válido ("no hay ventanas"): se abre la
      // ventana de captura y ella lo explica. En los demás modos sin imagen no hay nada que editar.
      const sinNada = modo === 'ventana' ? fuentes.ventanas.length === 0 : !fuentes.pantalla;
      if (sinNada && (modo !== 'ventana' || permiso === 'pendiente')) {
        // Sin imagen: en macOS sin permiso el sistema devuelve vacío en vez de un error.
        if (permiso === 'pendiente') {
          await this.deps.explicarPermiso();
          return { ok: false, codigo: 'captura.permiso_denegado' };
        }
        return { ok: false, codigo: 'captura.no_disponible' };
      }
      const cfg = await this.deps.config();
      const datos: DatosCaptura = {
        modo,
        formato: cfg.formato,
        idioma: this.deps.idioma(),
        // En modo ventana la pantalla entera no se envía: solo las miniaturas de la lista.
        pantalla: modo === 'ventana' ? null : fuentes.pantalla,
        ventanas: modo === 'ventana' ? fuentes.ventanas : [],
      };
      // Los datos se asignan solo cuando la ventana se creó: si `crearVentana` falla no queda nada.
      const v = this.deps.crearVentana();
      this.ventana = v;
      this.datos = datos;
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
    const destino = destinoConExtension(elegido, formato);
    const r = await this.deps.guardarImagen(destino, datos);
    return { archivo: r.archivo };
  }

  /** La imagen espera en memoria (no en disco) a que el conversor la pida con `tomarPendiente`. */
  alConversor(bytes: unknown): void {
    const datos = validarImagenCaptura(bytes);
    const d = dimensionesImagen(datos)!;
    this.soltarPendiente();
    this.pendiente = { bytes: datos, ancho: d.ancho, alto: d.alto };
    // Una captura que nadie recoge no se queda en memoria: caduca a los 2 minutos.
    this.caducaPendiente = setTimeout(() => this.soltarPendiente(), CADUCIDAD_PENDIENTE_MS);
    this.caducaPendiente.unref?.();
    this.deps.alConversor({ ancho: d.ancho, alto: d.alto });
    this.cerrar();
  }

  /** Entrega la imagen pendiente una sola vez. */
  tomarPendiente(): ImagenPendiente | null {
    const p = this.pendiente;
    this.soltarPendiente();
    return p;
  }

  private soltarPendiente(): void {
    if (this.caducaPendiente) clearTimeout(this.caducaPendiente);
    this.caducaPendiente = null;
    this.pendiente = null;
  }

  /**
   * Modo ventana: la ventana elegida a tamaño real. Solo vale un id de la lista ya ofrecida a esta
   * ventana de captura; el resto es un error, no una captura de lo que pida el renderer.
   */
  async capturarVentana(id: unknown): Promise<ImagenCaptura> {
    const d = this.datos;
    if (
      typeof id !== 'string' ||
      !this.ventana ||
      !d ||
      d.modo !== 'ventana' ||
      !d.ventanas.some((v) => v.id === id)
    ) {
      throw new ErrorWolf('captura.sin_imagen', 'Esa ventana no está en la lista.');
    }
    if (this.capturandoVentana) {
      throw new ErrorWolf('captura.sin_imagen', 'Ya se está capturando una ventana.');
    }
    this.capturandoVentana = true;
    const v = this.ventana;
    try {
      let img: ImagenCaptura | null;
      try {
        img = await conPlazo(this.deps.capturarVentana(id), PLAZO_FUENTES_MS);
      } catch (e) {
        this.deps.registrarError?.(e);
        throw new ErrorWolf('captura.no_disponible', 'No se pudo capturar la ventana.');
      }
      if (this.ventana !== v) throw new ErrorWolf('captura.sin_imagen', 'La captura se cerró.');
      if (!img) throw new ErrorWolf('captura.sin_imagen', 'Esa ventana ya no se puede capturar.');
      const png = validarImagenCaptura(img.png, 'png');
      const dim = dimensionesImagen(png)!;
      return { png, ancho: dim.ancho, alto: dim.alto };
    } finally {
      this.capturandoVentana = false;
    }
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
    this.soltarPendiente();
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
      const ev = e as { sender?: { mainFrame?: unknown }; senderFrame?: unknown } | null;
      const emisor = ev?.sender;
      // Debe ser la página de la ventana de captura y su marco principal (no un iframe).
      if (
        !servicio.esVentana(emisor) ||
        ev?.senderFrame === undefined ||
        ev.senderFrame !== emisor?.mainFrame
      ) {
        throw new Error('Origen no permitido');
      }
      return fn(...(a as A));
    };
  ipc.handle(
    CANALES_CAPTURA.datos,
    solo(() => servicio.datosSesion()),
  );
  ipc.handle(
    CANALES_CAPTURA.ventana,
    solo((id: unknown) => servicio.capturarVentana(id)),
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
