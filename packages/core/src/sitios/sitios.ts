import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import type { GestorHttps } from '../https/certificados';
import type { GestorHosts } from '../hosts/hosts';
import { revisarVhost, type ContextoVhost, type ModoVhost } from '../nginx/editor';
import { generarVhost, nombreUpstream } from '../nginx/plantillas';
import { nombreUpstreamSitio } from '../php/poolSitio';
import { puertosPhp } from '../nginx/principal';
import type { Rutas } from '../rutas';
import type { ServicioNginx, UpstreamPhp } from '../servicios/nginx';
import { SitioSchema, TIPOS_CON_PHP, TIPOS_PROXY, type Config, type Sitio } from '../tipos';

export type ResultadoAplicar = {
  nginx: { ok: boolean; salida: string };
  hosts: { ok: boolean; motivo?: string; comandoManual?: string };
  /**
   * Sitios con HTTPS pedido cuyo vhost salió solo en HTTP (puerto ocupado o sin autoridad de
   * certificados) o cuyo dominio quedó pendiente en hosts (UAC cancelado o sin respuesta).
   */
  httpsPendiente: string[];
};

/** Lo que dejó `alinearVhosts`: `deshacer` restaura los archivos que cambió (true si restauró alguno). */
export interface AlineadoVhosts {
  deshacer(): Promise<boolean>;
}

export interface DepsSitios {
  almacen: Pick<Almacen, 'leer' | 'guardar'>;
  rutas: Rutas;
  nginx: Pick<ServicioNginx, 'validar' | 'recargar'> &
    Partial<Pick<ServicioNginx, 'probarConVhost'>>;
  estadoNginx: () => 'apagado' | 'iniciando' | 'encendido' | 'error';
  hosts: Pick<GestorHosts, 'sincronizar'>;
  instalador: Pick<Instalador, 'instalado' | 'instalados'>;
  eventos: Pick<Eventos<EventosNucleo>, 'emit'>;
  /** Sin esto, ningún sitio sale con HTTPS. */
  https?: Pick<GestorHttps, 'caCreada' | 'puertoUsable' | 'asegurarCertificado'> &
    Partial<Pick<GestorHttps, 'ocupantePuerto'>>;
  /** Reglas propias o vhost manual guardados que ya no pasan la revisión (se descartan). */
  avisarVhost?: (a: { sitio: string; modo: ModoVhost; motivo: string }) => void;
  /** Sitios que tenían HTTPS en su vhost y lo pierden al aplicar (el aviso nunca debe faltar). */
  avisarHttpsQuitado?: (a: { sitios: string[]; puerto: number; ocupadoPor: string }) => void;
  /** Puertos de los servicios internos que un vhost no puede usar de destino (sin los del sitio). */
  puertosInternos?: (cfg: Config, sitioId: string) => number[] | Promise<number[]>;
}

const mensaje = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export interface AjustesServicios {
  puerto: number;
  trabajadores: number;
}

export function validarAjustes(a: AjustesServicios): void {
  if (!Number.isInteger(a.puerto) || a.puerto < 1 || a.puerto > 65535) {
    throw new Error('El puerto de Nginx debe ser un número entre 1 y 65535');
  }
  if (!Number.isInteger(a.trabajadores) || a.trabajadores < 1 || a.trabajadores > 8) {
    throw new Error('Los trabajadores de PHP deben ser entre 1 y 8');
  }
}

const comparar = (a: string, b: string): number => {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

/** Ramas de PHP usadas por los sitios (sin proxy ni estáticos), únicas y ordenadas. */
export function ramasEnUso(sitios: Sitio[]): string[] {
  const set = new Set<string>();
  for (const s of sitios) {
    if (TIPOS_CON_PHP.includes(s.tipo) && s.php) set.add(s.php);
  }
  return [...set].sort(comparar);
}

/** Upstreams para nginx.conf: solo ramas en uso e instaladas. */
export function upstreamsPara(
  sitios: Sitio[],
  trabajadores: number,
  instaladas: string[],
): UpstreamPhp[] {
  return ramasEnUso(sitios)
    .filter((v) => instaladas.includes(v))
    .map((version) => ({ version, puertos: puertosPhp(version, trabajadores) }));
}

const slug = (dominio: string): string =>
  dominio
    .replace(/\.test$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sitio';

const limpiarDominios = <T extends { dominio: string; alias: string[] }>(s: T): T => ({
  ...s,
  dominio: s.dominio.trim().toLowerCase(),
  alias: s.alias.map((a) => a.trim().toLowerCase()),
});

export class GestorSitios {
  private cola: Promise<unknown> = Promise.resolve();
  /** Recargas de Nginx que salieron bien en el aplicar en curso. */
  private recargasOk = 0;

  constructor(private readonly d: DepsSitios) {}

  /** Ejecuta las operaciones una a la vez, en orden de llegada. */
  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  async listar(): Promise<Sitio[]> {
    return (await this.d.almacen.leer()).sitios;
  }

  private async validar(datos: Omit<Sitio, 'id'>, otros: Sitio[], previo?: Sitio): Promise<void> {
    if (!datos.dominio.endsWith('.test') || datos.dominio === '.test') {
      throw new Error('El dominio debe terminar en .test');
    }
    if (datos.alias.some((a) => !a.endsWith('.test') || a === '.test')) {
      throw new Error('El dominio debe terminar en .test');
    }
    for (const d of [datos.dominio, ...datos.alias]) {
      if (!DOMINIO_VALIDO.test(d)) {
        throw new Error(
          `Dominio inválido: ${d}. Use solo letras, números, guiones y puntos (sin tildes ni espacios).`,
        );
      }
    }
    if (datos.alias.includes(datos.dominio)) {
      throw new Error(`El alias ${datos.dominio} es igual al dominio del sitio`);
    }
    const repetido = datos.alias.find((a, i) => datos.alias.indexOf(a) !== i);
    if (repetido) throw new Error(`El alias ${repetido} está repetido`);
    for (const p of [datos.dominio, ...datos.alias]) {
      if (otros.some((o) => o.dominio === p || o.alias.includes(p))) {
        throw new Error(`Ya existe un sitio con el dominio ${p}`);
      }
    }
    const repetidoProc = datos.procesos.find(
      (p, i) => datos.procesos.findIndex((q) => q.id === p.id) !== i,
    );
    if (repetidoProc) throw new Error(`El proceso ${repetidoProc.id} está repetido`);
    const marcados = datos.procesos.filter((p) => p.proxy);
    if (marcados.length > 1) {
      throw new Error('Solo un proceso puede ser el destino del proxy');
    }
    if (marcados[0] && marcados[0].puerto === null) {
      throw new Error(`El proceso ${marcados[0].id} es el destino del proxy y necesita un puerto`);
    }
    if (datos.tipo === 'proxy') {
      if (datos.puertoProxy === null) throw new Error('Un sitio proxy necesita un puerto');
      return;
    }
    if (
      TIPOS_PROXY.includes(datos.tipo) &&
      datos.puertoProxy === null &&
      !datos.procesos.some((p) => p.puerto !== null)
    ) {
      throw new Error(
        'Un sitio FastAPI o Node necesita un puerto de proxy o un proceso con puerto',
      );
    }
    const cambioTipo = !previo || previo.tipo !== datos.tipo;
    const usaPhp = TIPOS_CON_PHP.includes(datos.tipo);
    if (usaPhp && !datos.php) throw new Error('Seleccione una versión de PHP para este sitio');
    if (
      usaPhp &&
      datos.php &&
      (cambioTipo || previo.php !== datos.php) &&
      !(await this.d.instalador.instalado('php', datos.php))
    ) {
      throw new Error(`PHP ${datos.php} no está instalado. Instálelo desde Servicios.`);
    }
    if ((cambioTipo || previo.carpeta !== datos.carpeta) && !existsSync(datos.carpeta)) {
      throw new Error(`La carpeta no existe: ${datos.carpeta}`);
    }
  }

  crear(datos: Omit<Sitio, 'id'>): Promise<Sitio> {
    return this.serializar(() => this.crearSinCola(datos));
  }

  private async crearSinCola(datos: Omit<Sitio, 'id'>): Promise<Sitio> {
    const cfg = await this.d.almacen.leer();
    const limpio = limpiarDominios(SitioSchema.omit({ id: true }).parse(datos));
    await this.validar(limpio, cfg.sitios);
    const usados = new Set(cfg.sitios.map((s) => s.id));
    const raiz = slug(limpio.dominio);
    let id = raiz;
    for (let n = 2; usados.has(id); n++) id = `${raiz}-${n}`;
    const sitio = SitioSchema.parse({ ...limpio, id });
    cfg.sitios.push(sitio);
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return sitio;
  }

  editar(id: string, cambios: Partial<Sitio>): Promise<Sitio> {
    return this.serializar(() => this.editarSinCola(id, cambios));
  }

  private async editarSinCola(id: string, cambios: Partial<Sitio>): Promise<Sitio> {
    const cfg = await this.d.almacen.leer();
    const i = cfg.sitios.findIndex((s) => s.id === id);
    if (i < 0) throw new Error(`No existe el sitio ${id}`);
    const nuevo = limpiarDominios(SitioSchema.parse({ ...cfg.sitios[i], ...cambios, id }));
    await this.validar(
      nuevo,
      cfg.sitios.filter((s) => s.id !== id),
      cfg.sitios[i],
    );
    cfg.sitios[i] = nuevo;
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
    return nuevo;
  }

  /** Ejecuta `fn` en la cola de escrituras de configuración (p. ej. etc/credenciales.json). */
  enCola<T>(fn: () => Promise<T>): Promise<T> {
    return this.serializar(fn);
  }

  /** Lee, modifica y guarda la configuración en la misma cola que los sitios. */
  modificarConfig(fn: (c: Config) => void): Promise<void> {
    return this.serializar(async () => {
      const cfg = await this.d.almacen.leer();
      fn(cfg);
      await this.d.almacen.guardar(cfg);
    });
  }

  /**
   * Guarda solo el puerto de Nginx y los trabajadores de PHP (en la cola, para no pisar un
   * sitio que se esté guardando a la vez). No aplica: el llamador decide cómo.
   */
  guardarAjustes(a: AjustesServicios): Promise<void> {
    return this.serializar(async () => {
      validarAjustes(a);
      const cfg = await this.d.almacen.leer();
      cfg.servicios.nginx.puerto = a.puerto;
      cfg.servicios.php.trabajadores = a.trabajadores;
      await this.d.almacen.guardar(cfg);
    });
  }

  /** Quita el sitio de la configuración. Nunca toca la carpeta del proyecto. */
  borrar(id: string): Promise<void> {
    return this.serializar(() => this.borrarSinCola(id));
  }

  private async borrarSinCola(id: string): Promise<void> {
    const cfg = await this.d.almacen.leer();
    cfg.sitios = cfg.sitios.filter((s) => s.id !== id);
    await this.d.almacen.guardar(cfg);
    this.d.eventos.emit('sitio:cambio', cfg.sitios);
  }

  private async instantanea(dir: string): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    for (const n of await readdir(dir)) {
      if (n.endsWith('.conf')) mapa.set(n, await readFile(path.join(dir, n), 'utf8'));
    }
    return mapa;
  }

  private async restaurar(dir: string, previo: Map<string, string>): Promise<void> {
    for (const n of await readdir(dir)) {
      if (n.endsWith('.conf') && !previo.has(n)) await rm(path.join(dir, n), { force: true });
    }
    for (const [n, c] of previo) await writeFile(path.join(dir, n), c, 'utf8');
  }

  /**
   * Genera los vhosts y recarga/valida Nginx en la cola; el archivo hosts se sincroniza FUERA de
   * la cola: un UAC abierto (hasta su plazo) no frena otros guardados (sitios, credenciales, FTP).
   */
  async aplicar(
    o: {
      /** Corre tras aplicar Nginx y ANTES de hosts (p. ej. volver a encender Nginx). */
      trasNginx?: (nginx: ResultadoAplicar['nginx']) => Promise<ResultadoAplicar['nginx']>;
    } = {},
  ): Promise<ResultadoAplicar> {
    const aplicado = await this.serializar(() => this.aplicarSinCola());
    const { httpsPendiente, sitios } = aplicado;
    // Los sitios ya están aplicados: la interfaz se entera sin esperar al UAC.
    this.d.eventos.emit('sitio:cambio', sitios);
    // Lo que no debe esperar a un UAC (encender Nginx) va antes de hosts.
    const nginx = o.trasNginx ? await o.trasNginx(aplicado.nginx) : aplicado.nginx;
    // Los hosts se sincronizan aunque nginx falle: una entrada sin vhost es inofensiva
    // y evita pedir otra vez permiso de administrador (UAC) más adelante.
    const dominios = [...new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]))].sort();
    let r: Awaited<ReturnType<DepsSitios['hosts']['sincronizar']>>;
    try {
      r = await this.d.hosts.sincronizar(dominios);
    } catch (e) {
      console.error('No se pudo sincronizar el archivo hosts:', e instanceof Error ? e.message : e);
      r = { ok: false, motivo: 'error', comandoManual: '' };
    }
    const hosts = r.ok
      ? { ok: true }
      : { ok: false, motivo: r.motivo, comandoManual: r.comandoManual };
    if (!r.ok && r.pendientes?.length) {
      const pendientes = new Set(r.pendientes);
      for (const s of sitios) {
        if (
          s.https &&
          !httpsPendiente.includes(s.id) &&
          [s.dominio, ...s.alias].some((d) => pendientes.has(d))
        ) {
          httpsPendiente.push(s.id);
        }
      }
    }
    return { nginx, hosts, httpsPendiente };
  }

  /**
   * Deja los vhosts de los sitios con la plantilla actual (D40): una versión nueva puede cambiar
   * el `listen` (ahora con 127.0.0.1) y Nginx da prioridad al `listen` con dirección, así que un
   * vhost antiguo sin ella queda tapado por el servidor por defecto. Solo escribe los archivos que
   * difieren (con lo ya al día no toca nada), y no recarga Nginx ni toca el archivo hosts. Respeta
   * las reglas propias y el vhost manual válidos; un manual que ya no pasa la revisión (p. ej. un
   * `listen` sin dirección) se descarta con aviso, como al aplicar.
   */
  alinearVhosts(): Promise<AlineadoVhosts> {
    return this.serializar(() => this.alinearVhostsSinCola());
  }

  private async alinearVhostsSinCola(): Promise<AlineadoVhosts> {
    const cambiados = new Map<string, string>();
    const alineado: AlineadoVhosts = {
      deshacer: () =>
        this.serializar(async () => {
          for (const [ruta, antes] of cambiados) await writeFile(ruta, antes, 'utf8');
          const hubo = cambiados.size > 0;
          cambiados.clear();
          return hubo;
        }),
    };
    const cfg = await this.d.almacen.leer();
    if (cfg.sitios.length === 0) return alineado;
    const dir = path.dirname(this.d.rutas.vhost('x'));
    const existentes = await readdir(dir).catch(() => [] as string[]);
    // Sin carpeta de vhosts no hay nada antiguo que poner al día: lo crea el primer aplicar.
    if (existentes.length === 0) return alineado;
    const httpsUsable = await this.httpsUsable(cfg);
    const pierdeHttps: string[] = [];
    for (const s of cfg.sitios) {
      const ruta = this.d.rutas.vhost(s.id);
      const actual = await readFile(ruta, 'utf8').catch(() => null);
      // Sin archivo todavía: lo escribe aplicar, no esto.
      if (actual === null) continue;
      const v = await this.vhostCon(s, cfg, httpsUsable);
      if (this.pierdeHttps(actual, v)) pierdeHttps.push(s.id);
      if (v.contenido !== actual) {
        cambiados.set(ruta, actual);
        await writeFile(ruta, v.contenido, 'utf8');
      }
    }
    await this.avisarPerdidaHttps(cfg, pierdeHttps);
    return alineado;
  }

  /**
   * ¿Este vhost deja sin HTTPS a un sitio que lo tenía? Solo si el archivo actual escuchaba con
   * `ssl`, el nuevo ya no lo hace por culpa del HTTPS pendiente y no es un vhost manual (lo
   * escribió el usuario: lo que lleve es suyo y repetir el aviso en cada aplicar no sirve).
   */
  private pierdeHttps(
    actual: string | null,
    v: { contenido: string; modo: ModoVhost | null; httpsPendiente: boolean },
  ): boolean {
    const ssl = /^\s*listen\s[^;]*\bssl\b/m;
    return (
      v.httpsPendiente && v.modo !== 'manual' && ssl.test(actual ?? '') && !ssl.test(v.contenido)
    );
  }

  /**
   * Avisa de que el puerto HTTPS lo ocupa otro programa, solo si de verdad es así: con la CA sin
   * crear o sin un dueño ajeno conocido el motivo es otro y no se culpa al puerto.
   */
  private async avisarPerdidaHttps(cfg: Config, sitios: string[]): Promise<void> {
    if (sitios.length === 0 || !this.d.https?.caCreada()) return;
    const ocupante = await this.d.https.ocupantePuerto?.(cfg.https.puerto).catch(() => null);
    if (!ocupante) return;
    this.d.avisarHttpsQuitado?.({
      sitios,
      puerto: cfg.https.puerto,
      ocupadoPor: ocupante.nombre,
    });
  }

  private async httpsUsable(cfg: Config): Promise<boolean> {
    return (
      !!this.d.https &&
      this.d.https.caCreada() &&
      (await this.d.https.puertoUsable(cfg.https.puerto))
    );
  }

  /**
   * Vhost generado del sitio (con sus reglas propias, sin el manual) y lo que el sitio puede
   * tocar desde el editor (carpeta, dominios, puertos, registros y certificado).
   */
  async vhostDe(
    s: Sitio,
    cfg: Config,
    httpsUsable?: boolean,
  ): Promise<{ generado: string; contexto: ContextoVhost; httpsPendiente: boolean }> {
    const usable = httpsUsable ?? (await this.httpsUsable(cfg));
    let https: { puerto: number; crt: string; key: string } | undefined;
    let httpsPendiente = false;
    if (s.https) {
      if (usable && this.d.https) {
        https = { puerto: cfg.https.puerto, ...(await this.d.https.asegurarCertificado(s)) };
      } else {
        httpsPendiente = true;
      }
    }
    const logs = {
      acceso: this.d.rutas.logs('sitios', `${s.id}.access.log`),
      error: this.d.rutas.logs('sitios', `${s.id}.error.log`),
    };
    const generado = generarVhost(s, {
      ...(https ? { https } : {}),
      puertoNginx: cfg.servicios.nginx.puerto,
      rutasLogs: logs,
    });
    const contexto: ContextoVhost = {
      carpeta: s.carpeta,
      dominios: [s.dominio, ...s.alias],
      puertoHttp: cfg.servicios.nginx.puerto,
      puertoHttps: cfg.https.puerto,
      puertosInternos: (await this.d.puertosInternos?.(cfg, s.id)) ?? [],
      upstreamsPropios: [...(s.php ? [nombreUpstream(s.php)] : []), nombreUpstreamSitio(s.id)],
      logs: [logs.acceso, logs.error],
      certificados: [
        this.d.rutas.certCrt(s.id),
        this.d.rutas.certKey(s.id),
        ...(https ? [https.crt, https.key] : []),
      ],
    };
    return { generado, contexto, httpsPendiente };
  }

  /**
   * Lo que se escribe para el sitio: su vhost manual o el generado con sus reglas. Las reglas o
   * el manual guardados se revisan otra vez (la carpeta, los dominios o los puertos pudieron
   * cambiar): lo que ya no pasa se descarta y se avisa, sin tumbar a los demás sitios.
   */
  private async vhostCon(
    s: Sitio,
    cfg: Config,
    httpsUsable: boolean,
  ): Promise<{
    contenido: string;
    /** El generado sin reglas propias ni manual (para probar sin lo del usuario). */
    plano: string;
    /** Qué del usuario lleva `contenido` (null: nada). */
    modo: ModoVhost | null;
    httpsPendiente: boolean;
  }> {
    const plano = await this.vhostDe({ ...s, reglasExtra: '' }, cfg, httpsUsable);
    // Desactivado por nginx -t: fuera del vhost, sin volver a probar ni avisar.
    if (s.vhostDesactivado) {
      return {
        contenido: plano.generado,
        plano: plano.generado,
        modo: null,
        httpsPendiente: plano.httpsPendiente,
      };
    }
    let v = s.reglasExtra.trim() ? await this.vhostDe(s, cfg, httpsUsable) : plano;
    let modo: ModoVhost | null = s.reglasExtra.trim() ? 'reglas' : null;
    if (modo) {
      try {
        revisarVhost(s.reglasExtra, 'reglas', v.contexto);
      } catch (e) {
        this.d.avisarVhost?.({ sitio: s.id, modo: 'reglas', motivo: mensaje(e) });
        v = plano;
        modo = null;
      }
    }
    const base = { plano: plano.generado, httpsPendiente: v.httpsPendiente };
    if (s.vhostManual) {
      try {
        revisarVhost(s.vhostManual, 'manual', v.contexto);
        return { ...base, contenido: s.vhostManual, modo: 'manual' };
      } catch (e) {
        this.d.avisarVhost?.({ sitio: s.id, modo: 'manual', motivo: mensaje(e) });
      }
    }
    return { ...base, contenido: v.generado, modo };
  }

  /** Recarga (si está encendido) o valida Nginx con lo que hay escrito. */
  private async probarNginx(): Promise<ResultadoAplicar['nginx']> {
    if ((await this.d.instalador.instalados('nginx')).length === 0) {
      return {
        ok: true,
        salida: 'Nginx no está instalado; la configuración se validará al iniciarlo.',
      };
    }
    if (this.d.estadoNginx() === 'encendido') {
      try {
        await this.d.nginx.recargar();
        this.recargasOk++;
        return { ok: true, salida: 'Nginx recargado.' };
      } catch (e) {
        return { ok: false, salida: mensaje(e) };
      }
    }
    return this.d.nginx.validar();
  }

  /**
   * Nginx rechazó la configuración y hay sitios con reglas propias o vhost manual: se prueba sin
   * ellos. Si así pasa, cada uno vuelve si su `nginx -t` (con los demás sin lo suyo) pasa; los que
   * no, quedan fuera con aviso y los demás sitios se aplican. Si sin ellos tampoco pasa, el fallo
   * es otro: devuelve null (y no avisa nada).
   */
  private async sinLoDelUsuario(
    personalizados: { s: Sitio; contenido: string; plano: string; modo: ModoVhost }[],
  ): Promise<ResultadoAplicar['nginx'] | null> {
    const escribir = async (s: Sitio, t: string): Promise<void> =>
      writeFile(this.d.rutas.vhost(s.id), t, 'utf8');
    for (const p of personalizados) await escribir(p.s, p.plano);
    if (!(await this.probarNginx()).ok) return null;
    const vuelven: typeof personalizados = [];
    const fuera: typeof personalizados = [];
    for (const p of personalizados) {
      const prueba = this.d.nginx.probarConVhost
        ? await this.d.nginx.probarConVhost(p.s.id, p.contenido).catch((e: unknown) => ({
            ok: false,
            salida: mensaje(e),
          }))
        : { ok: false, salida: '' };
      (prueba.ok ? vuelven : fuera).push(p);
    }
    let r: ResultadoAplicar['nginx'] = { ok: true, salida: 'Nginx recargado.' };
    if (vuelven.length > 0) {
      for (const p of vuelven) await escribir(p.s, p.contenido);
      r = await this.probarNginx();
      if (!r.ok) {
        // Juntos no pasan: quedan todos fuera.
        for (const p of vuelven) await escribir(p.s, p.plano);
        fuera.push(...vuelven.splice(0));
        r = await this.probarNginx();
        if (!r.ok) return null;
      }
    }
    for (const p of fuera) {
      // Se marca en la configuración (la guarda aplicarSinCola) para no repetirlo en cada aplicar.
      p.s.vhostDesactivado = p.modo;
      this.d.avisarVhost?.({
        sitio: p.s.id,
        modo: p.modo,
        motivo: 'Nginx no acepta lo que escribió el usuario para este sitio.',
      });
    }
    return r;
  }

  private async aplicarSinCola(): Promise<{
    nginx: ResultadoAplicar['nginx'];
    httpsPendiente: string[];
    sitios: Sitio[];
  }> {
    const cfg = await this.d.almacen.leer();
    const dir = path.dirname(this.d.rutas.vhost('x'));
    await mkdir(dir, { recursive: true });
    await mkdir(this.d.rutas.logs('sitios'), { recursive: true });
    const previo = await this.instantanea(dir);
    this.recargasOk = 0;

    let nginx: { ok: boolean; salida: string };
    const httpsPendiente: string[] = [];
    const pierdeHttps: string[] = [];
    try {
      const httpsUsable = await this.httpsUsable(cfg);
      const vigentes = new Set(cfg.sitios.map((s) => `${s.id}.conf`));
      for (const n of previo.keys()) {
        if (!vigentes.has(n)) await rm(path.join(dir, n), { force: true });
      }
      const personalizados: { s: Sitio; contenido: string; plano: string; modo: ModoVhost }[] = [];
      for (const s of cfg.sitios) {
        const v = await this.vhostCon(s, cfg, httpsUsable);
        if (v.httpsPendiente) httpsPendiente.push(s.id);
        if (this.pierdeHttps(previo.get(`${s.id}.conf`) ?? null, v)) pierdeHttps.push(s.id);
        if (v.modo)
          personalizados.push({ s, contenido: v.contenido, plano: v.plano, modo: v.modo });
        await writeFile(this.d.rutas.vhost(s.id), v.contenido, 'utf8');
      }

      nginx = await this.probarNginx();
      if (!nginx.ok && personalizados.length > 0) {
        const sinEllos = await this.sinLoDelUsuario(personalizados);
        if (sinEllos) {
          nginx = sinEllos;
          await this.d.almacen.guardar(cfg);
        } else {
          // No era por ellos: nada queda marcado.
          for (const p of personalizados) delete p.s.vhostDesactivado;
        }
      }
    } catch (e) {
      nginx = {
        ok: false,
        salida: `No se pudo aplicar la configuración de los sitios: ${e instanceof Error ? e.message : String(e)}`,
      };
    }

    if (!nginx.ok) {
      try {
        await this.restaurar(dir, previo);
      } catch (e) {
        nginx = {
          ok: false,
          salida: `${nginx.salida}
No se pudo restaurar la configuración anterior: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
      // Durante la prueba Nginx llegó a recargar algo que ya no está: vuelve a lo anterior.
      if (this.recargasOk > 0 && this.d.estadoNginx() === 'encendido') {
        try {
          await this.d.nginx.recargar();
          nginx = {
            ok: false,
            salida: `${nginx.salida}\nSe recargó Nginx con la configuración anterior.`,
          };
        } catch (e) {
          nginx = {
            ok: false,
            salida: `${nginx.salida}\nNo se pudo recargar la configuración anterior: ${mensaje(e)}`,
          };
        }
      }
    }

    if (nginx.ok) await this.avisarPerdidaHttps(cfg, pierdeHttps);

    return { nginx, httpsPendiente, sitios: cfg.sitios };
  }
}
