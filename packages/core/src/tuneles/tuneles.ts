import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { ErrorWolf } from '../errores';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import { ErrorDetenidoAlIniciar, type Supervisor } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import type { GestorSitios } from '../sitios/sitios';
import type { UrlBase } from '../sitios/urlbase';
import type { Config, EstadoTunel, Sitio } from '../tipos';
import { nombreEjecutable } from '../plataforma/sistema';
import type { Ejecutor, Lanzador, PlataformaCompleta } from '../plataforma/tipos';
import { enmascararSecretos } from '../patronesSecretos';
import { CloudflareNombre, detalleSeguro } from './cloudflareNombre';
import { CloudflareRapido } from './cloudflareRapido';
import {
  proveedorDeSitio,
  type IdProveedorTunel,
  type ProveedorTunel,
  type SecretosTunel,
  type TunelSitio,
} from './proveedor';

export interface DepsTuneles {
  supervisor: Pick<Supervisor, 'iniciar' | 'detener' | 'estado' | 'pid' | 'alSalir' | 'ids'>;
  sitios: Pick<GestorSitios, 'listar'>;
  almacen: Pick<Almacen, 'leer'>;
  instalador: Pick<Instalador, 'instalados'>;
  rutas: Rutas;
  urlBase: Pick<UrlBase, 'aplicar' | 'restaurar' | 'restaurarPorId'>;
  eventos: Eventos<EventosNucleo>;
  opts?: { esperaMs?: number; intervaloMs?: number };
  /** Para el túnel con nombre (cuenta y credenciales); sin ellos solo hay Cloudflare rápido. */
  plataforma?: Pick<PlataformaCompleta, 'restringirAlUsuario'>;
  ejecutor?: Ejecutor;
  /** Para `tunnel login` en streaming (URL de autorización en vivo y cancelar). */
  lanzar?: Lanzador;
  /** El almacén de secretos del proceso principal (puede fijarse después del arranque). */
  secretos?: () => SecretosTunel | null;
  /** Guarda el proveedor elegido de un sitio (sin tocar nada más del sitio). */
  guardarTunel?: (sitioId: string, tunel: TunelSitio | null) => Promise<void>;
}

interface RegistroTunel {
  sitioId: string;
  url: string;
  pid: number;
}

const PREFIJO = 'tunel-';

/** Cómo se pidió abrir: `confirmado` solo si el usuario confirmó publicar (interfaz o MCP). */
export interface OpcionesAbrirTunel {
  confirmado?: boolean;
}
const MSG_CERRADO = 'El túnel se cerró. Use Renovar.';

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function leerTexto(archivo: string): string {
  try {
    return readFileSync(archivo, 'utf8');
  } catch {
    return '';
  }
}

export class Tuneles {
  private readonly mapa = new Map<string, EstadoTunel>();
  private readonly cerrando = new Set<string>();
  private readonly abriendo = new Map<string, Promise<EstadoTunel>>();
  /** Se incrementa en cada cerrar() para invalidar aperturas en curso. */
  private readonly generacion = new Map<string, number>();
  /** Cierres en curso: un abrir() del mismo sitio espera a que terminen. */
  private readonly cierres = new Map<string, Promise<void>>();
  /** Se incrementa en cada lanzamiento para no matar el proceso de una apertura más nueva. */
  private readonly lanzamientos = new Map<string, number>();
  private readonly esperaMs: number;
  private readonly intervaloMs: number;
  private readonly proveedores = new Map<IdProveedorTunel, ProveedorTunel>();
  /** Valores secretos de cada túnel abierto (solo en memoria): se tapan en logs y errores. */
  private readonly secretosVivos = new Map<string, string[]>();
  /** Cuenta y túneles de Cloudflare con nombre (solo si hay plataforma y ejecutor). */
  readonly cloudflareNombre: CloudflareNombre | null;

  private secretos: (() => SecretosTunel | null) | undefined;

  constructor(private readonly d: DepsTuneles) {
    this.secretos = d.secretos;
    this.esperaMs = d.opts?.esperaMs ?? 30_000;
    this.intervaloMs = d.opts?.intervaloMs ?? 500;
    this.proveedores.set('cloudflare-rapido', new CloudflareRapido());
    this.cloudflareNombre =
      d.plataforma && d.ejecutor
        ? new CloudflareNombre({
            rutas: d.rutas,
            plataforma: d.plataforma,
            ejecutor: d.ejecutor,
            ...(d.lanzar ? { lanzar: d.lanzar } : {}),
            alAutorizacion: (url) => d.eventos.emit('tunel:autorizacion', { url }),
            ejecutable: () => this.rutaCloudflared(),
            secretos: () => this.secretos?.() ?? null,
          })
        : null;
    if (this.cloudflareNombre) this.proveedores.set('cloudflare-nombre', this.cloudflareNombre);
    d.supervisor.alSalir((id) => {
      void this.alSalirProceso(id);
    });
  }

  /** El proceso principal entrega su almacén de secretos cuando lo tiene (nunca va al renderer). */
  fijarSecretos(fn: () => SecretosTunel | null): void {
    this.secretos = fn;
  }

  estados(): EstadoTunel[] {
    return [...this.mapa.values()].map((e) => ({ ...e }));
  }

  /**
   * Abre el túnel de un sitio. Un sitio con datos reales solo se publica con `confirmado` (el
   * usuario lo confirmó en la ventana): si no, `tuneles.confirmacion_requerida`.
   */
  abrir(sitioId: string, o: OpcionesAbrirTunel = {}): Promise<EstadoTunel> {
    const cierre = this.cierres.get(sitioId);
    if (cierre) return cierre.then(() => this.abrir(sitioId, o));
    const actual = this.mapa.get(sitioId);
    if (actual && actual.estado === 'activo') return Promise.resolve({ ...actual });
    const enCurso = this.abriendo.get(sitioId);
    if (enCurso) return enCurso;
    const p: Promise<EstadoTunel> = this.abrirInterno(sitioId, o).finally(() => {
      if (this.abriendo.get(sitioId) === p) this.abriendo.delete(sitioId);
    });
    this.abriendo.set(sitioId, p);
    return p;
  }

  cerrar(sitioId: string): Promise<void> {
    this.generacion.set(sitioId, this.gen(sitioId) + 1);
    this.abriendo.delete(sitioId);
    const previo = this.cierres.get(sitioId) ?? Promise.resolve();
    const p: Promise<void> = previo
      .catch(() => undefined)
      .then(() => this.cerrarInterno(sitioId))
      .finally(() => {
        if (this.cierres.get(sitioId) === p) this.cierres.delete(sitioId);
      });
    this.cierres.set(sitioId, p);
    return p;
  }

  private gen(sitioId: string): number {
    return this.generacion.get(sitioId) ?? 0;
  }

  private async cerrarInterno(sitioId: string): Promise<void> {
    const id = PREFIJO + sitioId;
    this.cerrando.add(sitioId);
    try {
      await this.d.supervisor.detener(id);
      const sitio = await this.buscar(sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
      await this.limpiarProveedores(sitioId);
      this.mapa.delete(sitioId);
      this.quitarRegistro(sitioId);
      this.d.eventos.emit('tunel:estado', { sitioId, estado: 'apagado', url: null });
    } finally {
      this.cerrando.delete(sitioId);
    }
  }

  async renovar(sitioId: string, o: OpcionesAbrirTunel = {}): Promise<EstadoTunel> {
    // Se comprueba antes de cerrar: sin confirmación no se toca el túnel que hay.
    const sitio = await this.buscar(sitioId);
    if (sitio) this.exigirConfirmacion(sitio, o);
    await this.cerrar(sitioId);
    return this.abrir(sitioId, o);
  }

  /** Recupera los túneles que siguen vivos tras reiniciar la app (llamar tras supervisor.readoptar). */
  async restaurar(): Promise<void> {
    const registros = this.leerRegistros();
    const vivos: RegistroTunel[] = [];
    const muertos: RegistroTunel[] = [];
    for (const r of registros) {
      const id = PREFIJO + r.sitioId;
      if (this.d.supervisor.estado(id) !== 'apagado' && this.d.supervisor.pid(id) === r.pid) {
        vivos.push(r);
        this.fijar({ sitioId: r.sitioId, estado: 'activo', url: r.url });
      } else {
        muertos.push(r);
      }
    }
    // cloudflared readoptado sin registro vigente: nadie lo controla, se detiene.
    const vigentes = new Set(vivos.map((v) => PREFIJO + v.sitioId));
    for (const id of this.d.supervisor.ids()) {
      if (!id.startsWith(PREFIJO) || vigentes.has(id)) continue;
      const sitioId = id.slice(PREFIJO.length);
      this.cerrando.add(sitioId);
      try {
        await this.d.supervisor.detener(id);
      } catch (e) {
        console.error('No se pudo detener el túnel huérfano:', e);
      } finally {
        this.cerrando.delete(sitioId);
      }
    }
    for (const r of muertos) {
      const sitio = await this.buscar(r.sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
      await this.limpiarProveedores(r.sitioId);
    }
    this.escribirRegistros(vivos);
    await this.barrerHuerfanos(new Set(vivos.map((v) => v.sitioId)));
  }

  /**
   * Cierra todos los túneles (al apagar o con "Detener todo"): primero devuelve los .env
   * —lo más importante si el cierre se corta— y luego cierra los procesos en paralelo.
   * Devuelve los errores (no lanza).
   */
  async cerrarTodos(): Promise<unknown[]> {
    const ids = [...new Set([...this.estados().map((t) => t.sitioId), ...this.abriendo.keys()])];
    await Promise.allSettled(
      ids.map(async (id) => {
        const sitio = await this.buscar(id);
        if (sitio) await this.restaurarUrlBase(sitio);
        else await this.d.urlBase.restaurarPorId(id);
      }),
    );
    const r = await Promise.allSettled(ids.map((id) => this.cerrar(id)));
    return r.filter((x) => x.status === 'rejected').map((x) => x.reason);
  }

  /** Restaura todo run/urlbase-<id>.json cuyo sitio no tiene un túnel vivo. */
  private async barrerHuerfanos(vivos: Set<string>): Promise<void> {
    let archivos: string[] = [];
    try {
      archivos = readdirSync(path.join(this.d.rutas.base, 'run'));
    } catch {
      return;
    }
    for (const f of archivos) {
      const m = /^urlbase-(.+)\.json$/.exec(f);
      if (!m || vivos.has(m[1]!)) continue;
      const sitio = await this.buscar(m[1]!);
      if (sitio) {
        await this.restaurarUrlBase(sitio);
      } else {
        try {
          await this.d.urlBase.restaurarPorId(m[1]!);
        } catch (e) {
          console.error('No se pudo restaurar la URL base huérfana:', e);
        }
      }
    }
  }

  private exigirConfirmacion(sitio: Sitio, o: OpcionesAbrirTunel): void {
    if (sitio.datosReales && o.confirmado !== true) {
      throw new ErrorWolf(
        'tuneles.confirmacion_requerida',
        `${sitio.dominio} tiene datos reales: publicarlo exige confirmarlo en la ventana de WolfCore Dev.`,
        { dominio: sitio.dominio },
      );
    }
  }

  private async abrirInterno(sitioId: string, o: OpcionesAbrirTunel): Promise<EstadoTunel> {
    const gen = this.generacion.get(sitioId) ?? 0;
    const sitio = await this.buscar(sitioId);
    if (!sitio) throw new ErrorWolf('tuneles.sitio_no_encontrado', 'Sitio no encontrado');
    // Primero la confirmación (con cualquier proveedor): sin ella no se toca nada.
    this.exigirConfirmacion(sitio, o);
    const idProveedor = proveedorDeSitio(sitio);
    const proveedor = this.proveedores.get(idProveedor);
    if (!proveedor) {
      throw new ErrorWolf(
        'tuneles.proveedor_no_disponible',
        `El proveedor de túnel ${idProveedor} no está disponible.`,
        { proveedor: idProveedor },
      );
    }
    const disp = await proveedor.disponible(sitio);
    if (!disp.ok) {
      throw new ErrorWolf(
        (disp.codigo ?? 'tuneles.proveedor_no_disponible') as 'tuneles.proveedor_no_disponible',
        `El túnel (${idProveedor}) no está disponible: ${disp.codigo ?? 'sin motivo'}.`,
        { proveedor: idProveedor },
      );
    }
    const cloudflared = await this.rutaCloudflared();
    const puerto = (await this.d.almacen.leer()).servicios.nginx.puerto;

    const id = PREFIJO + sitioId;
    const logCloudflared = this.d.rutas.logs('tuneles', `${id}.log`);
    const logSalida = this.d.rutas.logs('tuneles', `${id}.salida.log`);
    if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
    this.fijar({ sitioId, estado: 'iniciando', url: null });
    try {
      // Evita leer una URL de una ejecución anterior.
      mkdirSync(path.dirname(logCloudflared), { recursive: true });
      rmSync(logCloudflared, { force: true });
      rmSync(logSalida, { force: true });
    } catch (e) {
      return this.fijar({
        sitioId,
        estado: 'error',
        url: null,
        mensaje: `No se pudo limpiar el log anterior del túnel: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
    const token = (this.lanzamientos.get(sitioId) ?? 0) + 1;
    this.lanzamientos.set(sitioId, token);
    try {
      const l = await proveedor.abrir(sitio, { cloudflared, puertoNginx: puerto, logCloudflared });
      if (l.secretos?.length) this.secretosVivos.set(sitioId, l.secretos);
      await this.d.supervisor.iniciar({
        id,
        comando: l.comando,
        args: l.args,
        ...(l.env ? { env: l.env } : {}),
        ...(l.envSecreto ? { envSecreto: l.envSecreto } : {}),
        // Un TUNNEL_TOKEN (o similar) global del usuario conectaría otro túnel distinto.
        quitarEntorno: ['TUNNEL_'],
        log: logSalida,
        reiniciar: false,
      });
    } catch (e) {
      const mensaje = this.sinSecretos(sitioId, e instanceof Error ? e.message : String(e));
      await this.limpiarProveedores(sitioId);
      // Cerrado a propósito mientras arrancaba: no es un error.
      if (e instanceof ErrorDetenidoAlIniciar || this.gen(sitioId) !== gen) {
        return this.apagado(sitioId);
      }
      this.fijar({ sitioId, estado: 'error', url: null, mensaje });
      throw e;
    }

    if (this.gen(sitioId) !== gen) {
      // Se cerró mientras se lanzaba: este proceso quedaría huérfano. Solo se detiene si
      // ninguna apertura más nueva lanzó otro proceso para el mismo túnel.
      if (this.lanzamientos.get(sitioId) === token) {
        this.cerrando.add(sitioId);
        try {
          await this.d.supervisor.detener(id);
        } catch (e) {
          console.error('No se pudo detener el túnel abandonado:', e);
        } finally {
          this.cerrando.delete(sitioId);
        }
      }
      return this.apagado(sitioId);
    }
    const limite = Date.now() + this.esperaMs;
    for (;;) {
      if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
      const url = proveedor.url(sitio, leerTexto(logCloudflared) + '\n' + leerTexto(logSalida));
      if (url) return this.alEncontrarUrl(sitio, url, gen);
      if (this.gen(sitioId) !== gen) return this.apagado(sitioId);
      const actual = this.mapa.get(sitioId);
      if (!actual || actual.estado !== 'iniciando')
        return actual ? { ...actual } : this.apagado(sitioId);
      if (Date.now() >= limite) break;
      await dormir(this.intervaloMs);
    }

    this.cerrando.add(sitioId);
    try {
      await this.d.supervisor.detener(id);
    } catch (e) {
      console.error('No se pudo cerrar el túnel sin URL:', e);
    } finally {
      this.cerrando.delete(sitioId);
    }
    await this.limpiarProveedores(sitioId);
    const seg = Math.round(this.esperaMs / 1000);
    return this.fijar({
      sitioId,
      estado: 'error',
      url: null,
      mensaje: `No apareció la URL del túnel en ${seg} s. Revise el log del túnel y que Nginx esté encendido.`,
    });
  }

  private async alEncontrarUrl(sitio: Sitio, url: string, gen: number): Promise<EstadoTunel> {
    if (this.gen(sitio.id) !== gen) return this.apagado(sitio.id);
    const sitioId = sitio.id;
    const pid = this.d.supervisor.pid(PREFIJO + sitioId);
    if (pid !== null) this.agregarRegistro({ sitioId, url, pid });
    let mensaje: string | undefined;
    if (this.mapa.get(sitioId)?.estado !== 'iniciando') return this.estadoActual(sitioId);
    if (sitio.urlBaseVar) {
      try {
        mensaje = (await this.d.urlBase.aplicar(sitio, `${url}/`)) ?? undefined;
      } catch (e) {
        mensaje = `No se pudo cambiar la URL base: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    // Si el proceso murió o se cerró durante la aplicación, no se pisa ese estado.
    const vigente = this.gen(sitioId) === gen;
    if (!vigente || this.mapa.get(sitioId)?.estado !== 'iniciando') {
      // Se cerró o murió mientras se aplicaba: se garantiza que el .env vuelva,
      // salvo que una apertura más nueva ya sea la dueña del túnel.
      const e = this.mapa.get(sitioId)?.estado;
      const hayNueva = !vigente && (e === 'iniciando' || e === 'activo');
      if (sitio.urlBaseVar && !hayNueva) await this.restaurarUrlBase(sitio);
      return this.estadoActual(sitioId);
    }
    return this.fijar({ sitioId, estado: 'activo', url, ...(mensaje ? { mensaje } : {}) });
  }

  private async alSalirProceso(id: string): Promise<void> {
    if (!id.startsWith(PREFIJO)) return;
    const sitioId = id.slice(PREFIJO.length);
    if (this.cerrando.has(sitioId)) return;
    const actual = this.mapa.get(sitioId);
    if (!actual || actual.estado === 'apagado' || actual.estado === 'error') return;
    this.fijar({ sitioId, estado: 'error', url: actual.url, mensaje: MSG_CERRADO });
    const sitio = await this.buscar(sitioId);
    if (sitio) await this.restaurarUrlBase(sitio);
    await this.limpiarProveedores(sitioId);
    this.quitarRegistro(sitioId);
  }

  /** Ruta de cloudflared: la versión predeterminada o, sin ella, la más nueva instalada. */
  private async rutaCloudflared(): Promise<string> {
    const versiones = await this.d.instalador.instalados('cloudflared');
    // Configuración de una versión anterior (o parcial): sin predeterminada, la más nueva.
    const cfg: Partial<Config> = await this.d.almacen.leer();
    const elegida = cfg.catalogo?.predeterminadas?.cloudflared;
    const version =
      elegida && versiones.includes(elegida)
        ? elegida
        : [...versiones].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    if (!version)
      throw new ErrorWolf(
        'tuneles.cloudflared_no_instalado',
        'cloudflared no está instalado. Instálelo desde Servicios.',
      );
    return path.join(this.d.rutas.bin('cloudflared', version), nombreEjecutable('cloudflared'));
  }

  /** Borra lo temporal de todos los proveedores (credenciales) y tapa los secretos de los logs. */
  private async limpiarProveedores(sitioId: string): Promise<void> {
    for (const p of this.proveedores.values()) {
      try {
        await p.cerrar(sitioId);
      } catch (e) {
        console.error('No se pudo limpiar lo temporal del túnel:', e);
      }
    }
    this.enmascararLogs(sitioId);
    this.secretosVivos.delete(sitioId);
  }

  private sinSecretos(sitioId: string, texto: string): string {
    return detalleSeguro(texto, this.secretosVivos.get(sitioId) ?? []);
  }

  /** Texto de un log del túnel sin secretos (patrones conocidos y los valores del propio túnel). */
  private limpiarTexto(sitioId: string, texto: string): string {
    let t = texto;
    for (const v of this.secretosVivos.get(sitioId) ?? []) {
      if (v.length >= 4) t = t.split(v).join('***');
    }
    return enmascararSecretos(t);
  }

  /** Reescribe los logs del túnel ya sin secretos (al cerrar o caer). */
  private enmascararLogs(sitioId: string): void {
    const id = PREFIJO + sitioId;
    for (const f of [
      this.d.rutas.logs('tuneles', `${id}.log`),
      this.d.rutas.logs('tuneles', `${id}.salida.log`),
    ]) {
      try {
        const t = readFileSync(f, 'utf8');
        const limpio = this.limpiarTexto(sitioId, t);
        if (limpio !== t) writeFileSync(f, limpio);
      } catch {
        // sin log
      }
    }
  }

  /** El log del túnel (cloudflared y su salida) sin secretos, para mostrarlo. */
  log(sitioId: string): string {
    const id = PREFIJO + sitioId;
    const t =
      leerTexto(this.d.rutas.logs('tuneles', `${id}.log`)) +
      leerTexto(this.d.rutas.logs('tuneles', `${id}.salida.log`));
    return this.limpiarTexto(sitioId, t);
  }

  /** Elige el proveedor de un sitio. Cierra el túnel abierto: cambia la URL y el `.env`. */
  async elegirProveedor(sitioId: string, tunel: TunelSitio | null): Promise<void> {
    if (!this.d.guardarTunel) throw new Error('No se puede guardar el proveedor de túnel.');
    if (!(await this.buscar(sitioId)))
      throw new ErrorWolf('tuneles.sitio_no_encontrado', 'Sitio no encontrado');
    if (tunel && !this.proveedores.has(tunel.proveedor)) {
      throw new ErrorWolf(
        'tuneles.proveedor_no_disponible',
        `El proveedor de túnel ${tunel.proveedor} no está disponible.`,
        { proveedor: tunel.proveedor },
      );
    }
    await this.cerrar(sitioId);
    await this.d.guardarTunel(sitioId, tunel);
  }

  /**
   * Cloudflare con nombre para un sitio: crea el túnel (si hace falta), enruta el dominio y lo
   * deja elegido. No lo abre: abrirlo sigue exigiendo la confirmación.
   */
  async configurarCloudflareNombre(
    sitioId: string,
    nombre: string,
    dominio: string,
  ): Promise<void> {
    const cf = this.cloudflareNombre;
    if (!cf) {
      throw new ErrorWolf(
        'tuneles.proveedor_no_disponible',
        'Cloudflare con nombre no está disponible.',
        { proveedor: 'cloudflare-nombre' },
      );
    }
    if (!(await this.buscar(sitioId)))
      throw new ErrorWolf('tuneles.sitio_no_encontrado', 'Sitio no encontrado');
    await cf.crearTunel(nombre);
    await cf.enrutar(nombre, dominio);
    await this.elegirProveedor(sitioId, { proveedor: 'cloudflare-nombre', nombre, dominio });
  }

  private async restaurarUrlBase(sitio: Sitio): Promise<void> {
    try {
      await this.d.urlBase.restaurar(sitio);
    } catch (e) {
      console.error('No se pudo restaurar la URL base:', e);
    }
  }

  private async buscar(sitioId: string): Promise<Sitio | undefined> {
    return (await this.d.sitios.listar()).find((s) => s.id === sitioId);
  }

  private estadoActual(sitioId: string): EstadoTunel {
    const a = this.mapa.get(sitioId);
    return a ? { ...a } : this.apagado(sitioId);
  }

  private apagado(sitioId: string): EstadoTunel {
    return { sitioId, estado: 'apagado', url: null };
  }

  private fijar(e: EstadoTunel): EstadoTunel {
    this.mapa.set(e.sitioId, e);
    this.d.eventos.emit('tunel:estado', { ...e });
    return { ...e };
  }

  private archivoRegistros(): string {
    return path.join(this.d.rutas.base, 'run', 'tuneles.json');
  }

  private leerRegistros(): RegistroTunel[] {
    try {
      const datos: unknown = JSON.parse(readFileSync(this.archivoRegistros(), 'utf8'));
      if (!Array.isArray(datos)) return [];
      return datos.filter(
        (r): r is RegistroTunel =>
          !!r &&
          typeof r.sitioId === 'string' &&
          typeof r.url === 'string' &&
          typeof r.pid === 'number',
      );
    } catch {
      return [];
    }
  }

  private escribirRegistros(registros: RegistroTunel[]): void {
    const destino = this.archivoRegistros();
    const tmp = `${destino}.tmp`;
    try {
      mkdirSync(path.dirname(destino), { recursive: true });
      writeFileSync(tmp, JSON.stringify(registros, null, 2));
      renameSync(tmp, destino);
    } catch (e) {
      console.error('No se pudo guardar tuneles.json:', e);
    }
  }

  private agregarRegistro(r: RegistroTunel): void {
    this.escribirRegistros([...this.leerRegistros().filter((x) => x.sitioId !== r.sitioId), r]);
  }

  private quitarRegistro(sitioId: string): void {
    this.escribirRegistros(this.leerRegistros().filter((x) => x.sitioId !== sitioId));
  }
}
