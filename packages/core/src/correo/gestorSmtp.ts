import { ErrorWolf } from '../errores';
import type { Config } from '../tipos';
import {
  probarEnvio as probarEnvioReal,
  type OpcionesProbarEnvio,
  type ResultadoEnvio,
} from './probarEnvio';
import { bloqueEnvSmtp, hostEsLocal, ProveedorSmtpSchema, type ProveedorSmtp } from './proveedores';

/** Un envío de prueba por proveedor cada 15 s y, entre todos, 10 por hora. */
export const INTERVALO_PRUEBA_MS = 15_000;
export const MAX_PRUEBAS_POR_HORA = 10;
const HORA_MS = 3_600_000;

export interface DepsGestorSmtp {
  leerConfig(): Promise<Config>;
  modificarConfig(fn: (c: Config) => void): Promise<void>;
  /** Reloj en ms (pruebas). */
  ahora?: () => number;
  /** Envío real (pruebas: uno falso o con opciones propias). */
  enviar?: (
    p: ProveedorSmtp,
    clave: string,
    para: string,
    o?: OpcionesProbarEnvio,
  ) => Promise<ResultadoEnvio>;
  opcionesEnvio?: OpcionesProbarEnvio;
}

/**
 * Proveedores SMTP remotos: su configuración NO secreta (`config.json` → `correo.proveedores`) y
 * la prueba de envío. La clave nunca pasa por aquí salvo como argumento de `probar` y de
 * `bloqueEnv`, y no se guarda ni se registra.
 */
export class GestorSmtp {
  private enCurso = false;
  private readonly ultimo = new Map<string, number>();
  private envios: number[] = [];

  constructor(private readonly d: DepsGestorSmtp) {}

  private ahora(): number {
    return (this.d.ahora ?? Date.now)();
  }

  async proveedores(): Promise<ProveedorSmtp[]> {
    return (await this.d.leerConfig()).correo.proveedores;
  }

  async proveedor(id: string): Promise<ProveedorSmtp> {
    const p = (await this.proveedores()).find((x) => x.id === id);
    if (!p)
      throw new ErrorWolf('correo.proveedor_no_existe', 'El proveedor de correo ya no existe.');
    return p;
  }

  /**
   * Crea o actualiza un proveedor. Un host que por su forma es de este equipo o de la red local
   * (IP privada, `localhost`, `.local`…) exige `confirmarRedLocal`; si no, nunca se guarda. Si ya
   * tenía clave y cambia el host, el puerto o el usuario, exige `confirmarCambio` (la clave
   * guardada se mandaría a otro destino).
   */
  async guardar(
    datos: unknown,
    o: { confirmarRedLocal?: true; tieneClave?: boolean; confirmarCambio?: true } = {},
  ): Promise<ProveedorSmtp[]> {
    const r = ProveedorSmtpSchema.safeParse(datos);
    if (!r.success) {
      throw new ErrorWolf('correo.proveedor_invalido', 'Los datos del proveedor no son válidos.');
    }
    const nuevo: ProveedorSmtp = { ...r.data };
    delete nuevo.redLocal;
    // `redLocal` solo lo da la confirmación de esta llamada, nunca el dato que llega.
    if (o.confirmarRedLocal === true) nuevo.redLocal = true;
    else if (hostEsLocal(nuevo.host)) {
      throw new ErrorWolf(
        'correo.host_local',
        'El servidor SMTP apunta a este equipo o a la red local: confírmelo para usarlo.',
      );
    }
    const previo = (await this.proveedores()).find((x) => x.id === nuevo.id);
    if (
      previo &&
      o.tieneClave === true &&
      (previo.host !== nuevo.host ||
        previo.puerto !== nuevo.puerto ||
        previo.usuario !== nuevo.usuario) &&
      o.confirmarCambio !== true
    ) {
      throw new ErrorWolf(
        'correo.cambia_con_clave',
        'El proveedor tiene una clave guardada: confirme que quiere enviarla al nuevo servidor.',
      );
    }
    await this.d.modificarConfig((c) => {
      const lista = c.correo.proveedores.filter((x) => x.id !== nuevo.id);
      const i = c.correo.proveedores.findIndex((x) => x.id === nuevo.id);
      lista.splice(i < 0 ? lista.length : i, 0, nuevo);
      c.correo.proveedores = lista;
    });
    return this.proveedores();
  }

  /** Quita el proveedor y lo desvincula de los proyectos que lo usaban (vuelven al captador). */
  async borrar(id: string): Promise<void> {
    await this.proveedor(id);
    await this.d.modificarConfig((c) => {
      c.correo.proveedores = c.correo.proveedores.filter((x) => x.id !== id);
      for (const s of c.sitios) {
        if (s.correo?.modo === 'smtp' && s.correo.proveedor === id) delete s.correo;
      }
    });
  }

  /**
   * Un correo de prueba. Una prueba a la vez, una cada 15 s por proveedor y 10 por hora en total
   * (cuenta también los intentos fallidos, para no encadenar claves malas contra el proveedor).
   */
  async probar(id: string, clave: string, para: string): Promise<ResultadoEnvio> {
    const p = await this.proveedor(id);
    if (this.enCurso) {
      throw new ErrorWolf('correo.ocupado', 'Ya hay una prueba de envío en curso.');
    }
    const t = this.ahora();
    this.envios = this.envios.filter((x) => t - x < HORA_MS);
    const previo = this.ultimo.get(id);
    if (previo !== undefined && t - previo < INTERVALO_PRUEBA_MS) {
      throw new ErrorWolf('correo.limite', 'Espere unos segundos antes de otra prueba.', {
        segundos: Math.ceil((INTERVALO_PRUEBA_MS - (t - previo)) / 1000),
      });
    }
    if (this.envios.length >= MAX_PRUEBAS_POR_HORA) {
      throw new ErrorWolf('correo.limite', 'Se alcanzó el máximo de pruebas por hora.', {
        segundos: Math.ceil((HORA_MS - (t - this.envios[0]!)) / 1000),
      });
    }
    this.enCurso = true;
    try {
      const enviar = this.d.enviar ?? probarEnvioReal;
      const r = await enviar(p, clave, para, this.d.opcionesEnvio);
      // Se cuenta después de validar y resolver (los errores de forma no gastan el cupo).
      this.ultimo.set(id, t);
      this.envios.push(t);
      return r;
    } finally {
      this.enCurso = false;
    }
  }

  /** Variables `MAIL_*` del proveedor; `MAIL_PASSWORD` solo con la clave (tras confirmar). */
  async bloqueEnv(id: string, clave: string | null): Promise<Record<string, string>> {
    return bloqueEnvSmtp(await this.proveedor(id), clave);
  }

  /** Fija a dónde envía correo un proyecto. */
  async usarEnSitio(
    sitioId: string,
    modo: { modo: 'captador' } | { modo: 'smtp'; proveedor: string },
  ): Promise<void> {
    if (modo.modo === 'smtp') await this.proveedor(modo.proveedor);
    await this.d.modificarConfig((c) => {
      const s = c.sitios.find((x) => x.id === sitioId);
      if (!s) throw new ErrorWolf('proyectos.no_existe', `No existe el proyecto ${sitioId}`);
      if (modo.modo === 'smtp') s.correo = { modo: 'smtp', proveedor: modo.proveedor };
      else delete s.correo;
    });
  }
}
