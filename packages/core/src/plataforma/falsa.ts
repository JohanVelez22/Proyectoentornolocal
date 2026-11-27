import { equipoDesconocido, type InfoEquipo } from '../equipo/tipos';
import { ErrorWolf } from '../errores';
import {
  DETALLE_ALMACEN_INSEGURO,
  reglaRestaurable,
  sha256Hex,
  type ReglaExportada,
  type ReglaPorQuitar,
  type ReglaPorRestaurar,
  type RegistroProtegido,
} from './firewallCambiosWin';
import { PROGRAMAS_VIGILADOS, type PerfilRed, type ReglasEntrada } from './firewallWin';
import { resolverReal } from './rutaReal';
import { desinstalarEnCarpeta } from './rustupRegistro';
import { chmod, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LanzadorOculto } from './lanzarOculto';
import { descendientesDeHijos } from './procesosWin';
import type {
  AccesoPathUsuario,
  ComandoManual,
  EditorDisponible,
  EstadoAntivirus,
  EstadoCaptura,
  ConexionActiva,
  EstadoCierre,
  IdentidadUsuario,
  ProcesoUsuario,
  NavegadorLimpieza,
  RutasCategoriaLimpieza,
  IdCatalogo,
  IdTerminal,
  InstalacionAjena,
  OpcionesAbrirTerminal,
  PerfilFirefoxSistema,
  PlataformaCompleta,
  RangoPuertos,
  ResultadoEscritura,
  ServicioSistema,
  TerminalDisponible,
  UnidadDisco,
} from './tipos';

export interface OpcionesPlataformaFalsa {
  carpetaDatos?: string;
  carpetaInicio?: string;
  /** Archivo hosts (por defecto, uno que nadie usa: escribir en él falla). */
  rutaHosts?: string;
  idCatalogo?: IdCatalogo;
  /** Sufijo de los ejecutables (por defecto `.exe`, como en Windows). */
  sufijoEjecutable?: string;
}

/** Terminales que la plataforma falsa dice tener (las pruebas pueden cambiarlas). */
export const TERMINALES_FALSAS: TerminalDisponible[] = [
  { id: 'powershell', nombre: 'Windows PowerShell', ruta: 'C:/Windows/powershell.exe' },
  { id: 'cmd', nombre: 'Símbolo del sistema (cmd)', ruta: 'C:/Windows/cmd.exe' },
];

/** Editores que la plataforma falsa dice tener (las pruebas pueden cambiarlos). */
export const EDITORES_FALSOS: EditorDisponible[] = [
  { id: 'vscode', nombre: 'Visual Studio Code', ruta: 'C:/Falso/Code.exe' },
  { id: 'sublime', nombre: 'Sublime Text', ruta: 'C:/Falso/sublime_text.exe' },
];

/**
 * Plataforma para pruebas: todo en memoria y registrado en campos públicos. Nunca toca el
 * sistema real (ni el hosts, ni el almacén de certificados, ni el PATH ni las variables del
 * usuario, ni abre ventanas). Lo único que escribe en disco es el respaldo del PATH y el hosts,
 * y solo en las rutas que le pasa la prueba.
 */
export class PlataformaFalsa implements PlataformaCompleta {
  /** PATH del usuario. */
  path: string[] = [];
  /** Variables de entorno persistentes del usuario. */
  readonly variables = new Map<string, string>();
  /** Terminales pedidas. */
  readonly terminales: {
    cwd: string;
    env?: Record<string, string | undefined>;
    comando?: string[];
    terminal?: IdTerminal | null;
  }[] = [];
  /** Ejecutables que `buscarEjecutable` encuentra (nombre → ruta). */
  readonly ejecutables = new Map<string, string>();
  /** Hijos directos de cada PID (`descendientes` los recorre). */
  readonly hijos = new Map<number, number[]>();
  /** Procesos vivos (PID → ejecutable). */
  readonly procesos = new Map<number, string>();
  /** Ruta completa del ejecutable de cada PID (`rutaProceso`). */
  readonly rutasProceso = new Map<number, string>();
  /** Dueños de puertos. */
  readonly puertos = new Map<number, { pid: number; nombre: string }>();
  /** Huellas de certificados instalados. */
  readonly certificados = new Set<string>();
  readonly urlsAbiertas: string[] = [];
  readonly matados: number[] = [];
  rangos: RangoPuertos[] = [];
  servicios = new Map<string, ServicioSistema['estado']>();
  vcRedist = true;
  /** Lo que devuelve `enlazadorMsvc`. */
  enlazador = true;
  /** `UninstallString` de la entrada de rustup en el registro falso (null: no hay). */
  entradaRustup: string | null = null;
  /** Veces que se pidió instalar el VC++. */
  vcRedistInstalaciones = 0;
  /** Servicios del sistema detenidos con elevación. */
  readonly serviciosDetenidos: string[] = [];
  /** Veces que se quitó el solo lectura del hosts (lo quita de verdad en `rutaHosts`). */
  soloLecturaQuitado = 0;
  /** Lo que devuelve `antivirus` (null: sin antivirus o ilegible). */
  antivirusEstado: EstadoAntivirus | null = null;
  /** Instalaciones de Laragon, XAMPP y Herd que dice haber (`instalacionesAjenas`). */
  instalaciones: InstalacionAjena[] = [];
  /** Perfil de red por IP (`perfilRedDe`); sin entrada, null. */
  perfiles = new Map<string, PerfilRed>();
  /** Lo que devuelve `reglasEntradaPermitidas`. */
  reglasEntrada: ReglasEntrada = { ok: true, reglas: [] };
  /** Reglas que existen pero no salen en `reglasEntrada` (p. ej. una que pasó a Block). */
  reglasFirewallExtra: ReglaExportada[] = [];
  /** Datos de la regla completa por `Name` (lo que no se indique, valores de una regla de entrada Allow). */
  readonly reglasFirewallDetalle = new Map<string, Partial<ReglaExportada>>();
  /** Simula el UAC: true = el usuario contesta que no. */
  uacCancelado = false;
  /** Reglas que el "script elevado" no consigue borrar (error de Windows). */
  readonly firewallNoBorrables = new Set<string>();
  /** Lo que ocurre mientras el usuario contesta el UAC (cambios entre la lista y el borrado). */
  alElevarFirewall: (() => void) | null = null;
  /** Pedidos de quitar y de restaurar reglas que llegaron a elevarse. */
  readonly pedidosQuitarReglas: ReglaPorQuitar[][] = [];
  readonly pedidosRestaurarReglas: ReglaPorRestaurar[][] = [];
  /** `exportarReglasFirewall` devuelve null (no se pudo leer). */
  exportarFirewallFalla = false;
  /** Lo que devuelve `tailscale` (por defecto, no instalado). */
  tailscaleEstado: { ruta: string | null; sesion: boolean } = { ruta: null, sesion: false };
  /** Archivos que se pidió restringir al usuario. */
  readonly restringidos: string[] = [];
  readonly restringidasCarpetas: string[] = [];
  firefox: string[] = [];
  /** Perfiles (rutas de `firefox`) fuera de la carpeta de Firefox. */
  readonly firefoxFuera = new Set<string>();
  /** Perfiles de Firefox abiertos (`firefoxEnUso`). */
  readonly firefoxAbiertos = new Set<string>();
  /** Raíces del sistema en PEM ('' = no hay; `raicesSistema` lanza). */
  raices = '';
  /** Veces que se leyeron las raíces del sistema. */
  raicesLeidas = 0;
  documentos = '/documentos';
  /** Prefijos de `npm install -g` del usuario. */
  npmGlobal: string[] = [];
  /** Carpetas conocidas de Docker y Podman (`carpetasContenedores`). */
  contenedores: Record<'docker' | 'podman', string[]> = { docker: [], podman: [] };

  constructor(private readonly o: OpcionesPlataformaFalsa = {}) {}

  rutaHosts(): string {
    return this.o.rutaHosts ?? path.join(this.carpetaDatos(), 'hosts-falso');
  }

  async escribirComoAdmin(destino: string, contenido: string): Promise<ResultadoEscritura> {
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, contenido, 'utf8');
    return { ok: true };
  }

  async quienUsaPuerto(puerto: number): Promise<{ pid: number; nombre: string } | null> {
    return this.puertos.get(puerto) ?? null;
  }

  async duenosDePuertos(puertos: number[]): Promise<Map<number, { pid: number; nombre: string }>> {
    const res = new Map<number, { pid: number; nombre: string }>();
    for (const p of puertos) {
      const d = this.puertos.get(p);
      if (d) res.set(p, d);
    }
    return res;
  }

  async instalarCertificadoUsuario(): Promise<ResultadoEscritura> {
    return { ok: true };
  }

  async quitarCertificadoUsuario(huella: string): Promise<ResultadoEscritura> {
    this.certificados.delete(huella);
    return { ok: true };
  }

  async certificadoInstalado(huella: string): Promise<boolean> {
    return this.certificados.has(huella);
  }

  async procesoVivo(pid: number): Promise<{ vivo: boolean; ejecutable?: string }> {
    const e = this.procesos.get(pid);
    return e === undefined ? { vivo: false } : { vivo: true, ejecutable: e };
  }

  async rutaProceso(pid: number): Promise<string | null> {
    return this.procesos.has(pid) ? (this.rutasProceso.get(pid) ?? null) : null;
  }

  /** Si es true, `matarArbol` falla la prueba: el optimizador de RAM nunca debe matar. */
  prohibirMatar = false;

  async matarArbol(pid: number): Promise<void> {
    if (this.prohibirMatar) throw new Error(`PROHIBIDO matar procesos (pid ${pid})`);
    this.matados.push(pid);
    this.procesos.delete(pid);
  }

  async abrirUrl(url: string): Promise<void> {
    this.urlsAbiertas.push(url);
  }

  ejecutable(nombre: 'nginx' | 'php-cgi' | 'php' | 'cloudflared'): string {
    return this.nombreEjecutable(nombre);
  }

  async carpetaDocumentos(): Promise<string> {
    return this.documentos;
  }

  carpetaDatos(): string {
    return this.o.carpetaDatos ?? '/datos-falsos/WolfCoreDev';
  }

  /** Lo que devuelve `carpetasDelSistema` (la prueba pone aquí las suyas). */
  carpetasSistema: string[] = [];

  /** Lo que devuelve `carpetasPerfil` (la prueba pone aquí las suyas). */
  carpetasDePerfil: string[] = [];

  carpetasPerfil(): string[] {
    return [...this.carpetasDePerfil];
  }

  carpetasDelSistema(): string[] {
    return [...this.carpetasSistema];
  }

  carpetaInicio(): string {
    return this.o.carpetaInicio ?? '/inicio-falso';
  }

  idCatalogo(): IdCatalogo {
    return this.o.idCatalogo ?? 'win-x64';
  }

  nombreEjecutable(base: string): string {
    const sufijo = this.o.sufijoEjecutable ?? '.exe';
    return sufijo && base.toLowerCase().endsWith(sufijo) ? base : base + sufijo;
  }

  carpetasNpmGlobal(): string[] {
    return [...this.npmGlobal];
  }

  async carpetasContenedores(motor: 'docker' | 'podman'): Promise<string[]> {
    return [...this.contenedores[motor]];
  }

  async buscarEjecutable(nombre: string): Promise<string | null> {
    return this.ejecutables.get(nombre) ?? null;
  }

  pathUsuario(o: { respaldo?: string } = {}): AccesoPathUsuario {
    return {
      leer: async () => [...this.path],
      escribir: async (entradas) => {
        if (o.respaldo) {
          await mkdir(path.dirname(o.respaldo), { recursive: true });
          await writeFile(o.respaldo, this.path.join(';'), { encoding: 'utf8', flag: 'wx' }).catch(
            (e: unknown) => {
              if ((e as { code?: string }).code !== 'EEXIST') throw e;
            },
          );
        }
        this.path = [...entradas];
      },
    };
  }

  async leerVariableUsuario(nombre: string): Promise<string | null> {
    return this.variables.get(nombre) ?? null;
  }

  async variableUsuario(nombre: string, valor: string | null): Promise<ResultadoEscritura> {
    if (valor === null) this.variables.delete(nombre);
    else this.variables.set(nombre, valor);
    return { ok: true };
  }

  async abrirTerminal(cwd: string, o: OpcionesAbrirTerminal = {}): Promise<void> {
    this.terminales.push({ cwd, ...o });
  }

  /** Terminales instaladas (cambiables en la prueba). */
  instaladas: TerminalDisponible[] = [...TERMINALES_FALSAS];

  async terminalesInstaladas(): Promise<TerminalDisponible[]> {
    return [...this.instaladas];
  }

  /** Editores instalados (cambiables en la prueba). */
  editores: EditorDisponible[] = [...EDITORES_FALSOS];

  async editoresInstalados(): Promise<EditorDisponible[]> {
    return [...this.editores];
  }

  /** Sin lanzador oculto: los procesos se lanzan con el `spawn` (falso) de la prueba. */
  lanzadorOculto(carpetaTmp?: string): LanzadorOculto | null {
    void carpetaTmp;
    return null;
  }

  async descendientes(pids: number[]): Promise<Map<number, number[]>> {
    return descendientesDeHijos(this.hijos, pids);
  }

  async rangosReservados(): Promise<RangoPuertos[]> {
    return [...this.rangos];
  }

  async serviciosSistema(nombres: string[]): Promise<ServicioSistema[]> {
    return nombres.map((nombre) => ({ nombre, estado: this.servicios.get(nombre) ?? 'no-existe' }));
  }

  async limpiarEntradaRustup(carpetaDatos: string): Promise<'ausente' | 'quitada' | 'ajena'> {
    if (this.entradaRustup === null) return 'ausente';
    if (!desinstalarEnCarpeta(this.entradaRustup, carpetaDatos)) return 'ajena';
    this.entradaRustup = null;
    return 'quitada';
  }

  async enlazadorMsvc(): Promise<boolean> {
    return this.enlazador;
  }

  async vcRedistInstalado(): Promise<boolean> {
    return this.vcRedist;
  }

  async perfilesFirefox(): Promise<PerfilFirefoxSistema[]> {
    return this.firefox.map((ruta) => ({ ruta, fuera: this.firefoxFuera.has(ruta) }));
  }

  async firefoxEnUso(perfil: string): Promise<boolean> {
    return this.firefoxAbiertos.has(perfil);
  }

  async raicesSistema(): Promise<string> {
    this.raicesLeidas++;
    if (!this.raices) throw new Error('Sin raíces del sistema (falsa)');
    return this.raices;
  }

  async detenerServicioSistema(nombre: string): Promise<ResultadoEscritura> {
    this.serviciosDetenidos.push(nombre);
    if (this.servicios.has(nombre)) this.servicios.set(nombre, 'detenido');
    return { ok: true };
  }

  async quitarSoloLecturaHosts(): Promise<ResultadoEscritura> {
    this.soloLecturaQuitado++;
    await chmod(this.rutaHosts(), 0o666);
    return { ok: true };
  }

  async instalarVcRedist(): Promise<ResultadoEscritura> {
    this.vcRedistInstalaciones++;
    this.vcRedist = true;
    return { ok: true };
  }

  async antivirus(): Promise<EstadoAntivirus | null> {
    return this.antivirusEstado;
  }

  /** Pruebas: false simula una carpeta cuyo dueño es otro usuario. */
  duenoPropio = true;
  readonly duenosComprobados: string[] = [];
  async duenoEsUsuario(ruta: string): Promise<boolean> {
    this.duenosComprobados.push(ruta);
    return this.duenoPropio;
  }

  async restringirAlUsuario(ruta: string, o: { carpeta?: boolean } = {}): Promise<boolean> {
    this.restringidos.push(ruta);
    if (o.carpeta) this.restringidasCarpetas.push(ruta);
    return true;
  }

  async instalacionesAjenas(): Promise<InstalacionAjena[]> {
    return this.instalaciones.map((i) => ({ ...i }));
  }

  async perfilRedDe(ip: string): Promise<PerfilRed | null> {
    return this.perfiles.get(ip) ?? null;
  }

  /** Lo que devuelve libreOffice (por defecto, no instalado). */
  libreOfficeRuta: string | null = null;

  async libreOffice(): Promise<string | null> {
    return this.libreOfficeRuta;
  }

  /** Lo que devuelve capturaDisponible (por defecto, disponible sin permiso que pedir). */
  estadoCaptura: EstadoCaptura = { disponible: true, permiso: 'no_aplica' };

  async capturaDisponible(): Promise<EstadoCaptura> {
    return { ...this.estadoCaptura };
  }

  /** Procesos que ve `procesosDelUsuario` (D36); la prueba los pone y los cambia. */
  procesosUsuario: ProcesoUsuario[] = [];
  identidad: IdentidadUsuario = { usuario: 'S-1-5-21-yo', sesion: 1 };
  carpetasProtegidas: string[] = [
    String.raw`C:\Windows`,
    String.raw`C:\Program Files\Windows Defender`,
  ];
  /** PIDs a los que se pidió cerrar la ventana (nunca se mata nada). */
  readonly cierresPedidos: number[] = [];

  /** Qué contesta `cerrarVentanaPrincipal` cuando el proceso es el esperado (para simular UIPI). */
  resultadoCierre: EstadoCierre = 'cerrado-pedido';
  /** Los PIDs que, tras pedirles el cierre, desaparecen (el usuario no cancela). */
  cierranAlPedir = new Set<number>();
  /** Si es true, `procesosDelUsuario` falla (listado fallido). */
  fallaListado = false;
  /** Veces que se leyó la lista de procesos. */
  listados = 0;
  /** Conexiones TCP en curso que ve `conexionesActivas`; `fallaConexiones` simula no poder leerlas. */
  conexiones: ConexionActiva[] = [];
  fallaConexiones = false;
  /** Veces que se pidió cerrar (con lo que se comprobó), aunque se saltara. */
  readonly cierresIntentados: { pid: number; inicio: string; ruta: string }[] = [];

  async procesosDelUsuario(): Promise<ProcesoUsuario[]> {
    this.listados++;
    if (this.fallaListado) throw new ErrorWolf('memoria.no_disponible', 'listado fallido');
    return this.procesosUsuario.map((p) => ({ ...p }));
  }

  /** Imita al script real: comprueba pid, dueño, sesión, inicio, ruta y servicio antes de cerrar. */
  async cerrarVentanaPrincipal(pid: number, inicio: string, ruta: string): Promise<EstadoCierre> {
    this.cierresIntentados.push({ pid, inicio, ruta });
    const p = this.procesosUsuario.find((x) => x.pid === pid);
    if (
      !p ||
      p.usuario !== this.identidad.usuario ||
      p.sesion !== this.identidad.sesion ||
      p.servicio === true ||
      p.inicio !== inicio ||
      (p.ruta ?? '').toLowerCase() !== ruta.toLowerCase()
    ) {
      return 'cambio';
    }
    if (!p.ventana) return 'sin-ventana';
    if (p.elevado === true) return 'no-se-pudo';
    if (this.resultadoCierre === 'cerrado-pedido') {
      this.cierresPedidos.push(pid);
      if (this.cierranAlPedir.has(pid)) {
        this.procesosUsuario = this.procesosUsuario.filter((x) => x.pid !== pid);
      }
    }
    return this.resultadoCierre;
  }

  /** Consultas puntuales por PID (M2); `fallaConsultaPid` simula no poder consultar. */
  readonly consultasPid: number[] = [];
  fallaConsultaPid = false;

  async inicioDeProceso(pid: number): Promise<string | null> {
    this.consultasPid.push(pid);
    if (this.fallaConsultaPid) throw new ErrorWolf('memoria.no_disponible', 'consulta fallida');
    return this.procesosUsuario.find((x) => x.pid === pid)?.inicio ?? null;
  }

  /** En la falsa, un `inicio` numérico son milisegundos desde 1970; otro texto es «muy antiguo». */
  inicioAnteriorA(inicio: string, instanteMs: number): boolean {
    return /^\d+$/.test(inicio) ? Number(inicio) < instanteMs : true;
  }

  async conexionesActivas(): Promise<ConexionActiva[]> {
    if (this.fallaConexiones) throw new ErrorWolf('memoria.no_disponible', 'sin conexiones');
    return this.conexiones.map((c) => ({ ...c }));
  }

  async identidadActual(): Promise<IdentidadUsuario> {
    return { ...this.identidad };
  }

  rutasProtegidas(): string[] {
    return [...this.carpetasProtegidas];
  }

  // ---- Limpieza de disco (D37): todo apunta a un árbol temporal que pone la prueba ----

  /** Lo que devuelve `rutasLimpieza` (la prueba lo llena con rutas de su carpeta temporal). */
  limpieza: RutasCategoriaLimpieza[] = [];
  /** Navegadores "abiertos"; null = no se puede saber (la lectura falla). */
  navegadoresAbiertosFalsos: NavegadorLimpieza[] | null = [];
  administrador = false;
  /** Papelera falsa: si es true, `aPapelera` registra y MUEVE el archivo a `papeleraDestino`. */
  papeleraDisponible = true;
  readonly enPapelera: string[] = [];
  /** Carpeta que recibe lo "enviado a la papelera" (si no, solo se registra y se deja donde está). */
  papeleraDestino: string | null = null;

  async rutasLimpieza(): Promise<RutasCategoriaLimpieza[]> {
    return this.limpieza.map((c) => ({ ...c, rutas: [...c.rutas] }));
  }

  async navegadoresAbiertos(): Promise<NavegadorLimpieza[]> {
    if (this.navegadoresAbiertosFalsos === null) throw new Error('no se pudo leer');
    return [...this.navegadoresAbiertosFalsos];
  }

  async esAdministrador(): Promise<boolean> {
    return this.administrador;
  }

  /** Lo que devuelve `unidadesLocales` (la prueba pone aquí sus unidades). */
  unidades: UnidadDisco[] = [];

  async unidadesLocales(): Promise<UnidadDisco[]> {
    return this.unidades.map((u) => ({ ...u }));
  }

  /** Lo que devuelve `infoEquipo` (la prueba pone aquí el equipo). */
  equipo: InfoEquipo = equipoDesconocido();

  async infoEquipo(): Promise<InfoEquipo> {
    return structuredClone(this.equipo);
  }

  async aPapelera(ruta: string): Promise<boolean> {
    if (!this.papeleraDisponible) return false;
    this.enPapelera.push(ruta);
    if (this.papeleraDestino !== null) {
      await mkdir(this.papeleraDestino, { recursive: true });
      await rename(
        ruta,
        path.join(this.papeleraDestino, `${this.enPapelera.length}-${path.basename(ruta)}`),
      );
    }
    return true;
  }

  registrarPapelera(): void {
    // La falsa no usa la de la app: `aPapelera` ya registra lo enviado.
  }

  async reglasEntradaPermitidas(): Promise<ReglasEntrada> {
    return { ok: this.reglasEntrada.ok, reglas: this.reglasEntrada.reglas.map((r) => ({ ...r })) };
  }

  private reglasFirewallCompletas(): ReglaExportada[] {
    const deLista = this.reglasEntrada.reglas.map((r): ReglaExportada => ({
      nombre: r.nombre,
      nombreVisible: r.nombreVisible,
      descripcion: '',
      habilitada: true,
      perfil: r.perfil,
      direccion: 'Inbound',
      accion: 'Allow',
      programa: r.programa,
      protocolo: r.protocolo ?? 'Any',
      puertoLocal: r.puertoLocal ? r.puertoLocal.split(',') : ['Any'],
      puertoRemoto: ['Any'],
      direccionLocal: ['Any'],
      direccionRemota: r.direccionRemota ? r.direccionRemota.split(',') : ['Any'],
      ...this.reglasFirewallDetalle.get(r.nombre),
    }));
    return [...deLista, ...this.reglasFirewallExtra.map((r) => ({ ...r }))];
  }

  /** Lecturas de `exportarReglasFirewall` hechas; con `exportarFallaTras`, las siguientes dan null. */
  exportaciones = 0;
  exportarFallaTras: number | null = null;

  async exportarReglasFirewall(nombres: string[]): Promise<ReglaExportada[] | null> {
    this.exportaciones++;
    if (this.exportarFirewallFalla) return null;
    if (this.exportarFallaTras !== null && this.exportaciones > this.exportarFallaTras) return null;
    const pedidas = new Set(nombres);
    return this.reglasFirewallCompletas().filter((r) => pedidas.has(r.nombre));
  }

  private rutaFirewall = (p: string): string =>
    p.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();

  /** Como el script elevado: el programa, con uniones resueltas, sigue bajo la raíz. */
  private async bajoRaiz(programa: string, raiz: string): Promise<boolean> {
    const [p, r] = await Promise.all([resolverReal(programa), resolverReal(raiz)]);
    return p !== null && r !== null && this.rutaFirewall(p).startsWith(`${this.rutaFirewall(r)}/`);
  }

  /** Como `Test-ProgramaPropio` del script: `.exe` vigilado, bajo la raíz y, en pruebas, `pel-*` bajo TEMP. */
  private async programaPropio(
    programa: string,
    r: { raiz: string; tipo: 'propia' | 'prueba'; temporal: string },
  ): Promise<boolean> {
    if (!(await this.bajoRaiz(programa, r.raiz))) return false;
    const m = /([^/\\]+)\.exe$/i.exec(programa);
    if (!m || !(PROGRAMAS_VIGILADOS as readonly string[]).includes(m[1]!.toLowerCase())) {
      return false;
    }
    if (r.tipo === 'propia') return true;
    const [ra, t] = await Promise.all([resolverReal(r.raiz), resolverReal(r.temporal)]);
    if (ra === null || t === null) return false;
    const raiz = this.rutaFirewall(ra);
    if (!raiz.startsWith(`${this.rutaFirewall(t)}/`)) return false;
    const partes = raiz.split('/');
    const hoja = partes.at(-1) ?? '';
    return (
      /^(pel-int-|pel-etapa-|pel-vhost-real-)/.test(hoja) ||
      (partes.at(-2) === 'scratchpad' && hoja.startsWith('ngx'))
    );
  }

  /** Registro simulado (`HKLM\SOFTWARE\WolfCoreDev\Cortafuegos`): un valor por id con el JSON de la regla; su huella es la de ese texto. */
  readonly almacenProtegido = new Map<string, { texto: string; regla: ReglaExportada }>();
  /** Simula una clave del registro que no es de fiar (dueño o DACL distintos). */
  almacenInseguro = false;
  /** Reglas cuya copia protegida no se puede escribir (el script no las borra). */
  readonly firewallNoGuardables = new Set<string>();
  /** Pruebas: lo que devuelve `leerAlmacenFirewall` (null = no se pudo leer). */
  almacenIlegible = false;

  async quitarReglasFirewall(reglas: ReglaPorQuitar[]): Promise<ResultadoEscritura> {
    this.pedidosQuitarReglas.push(reglas.map((r) => ({ ...r })));
    if (this.uacCancelado) return { ok: false, motivo: 'cancelado' };
    this.alElevarFirewall?.();
    if (this.almacenInseguro) {
      return { ok: false, motivo: 'error', detalle: DETALLE_ALMACEN_INSEGURO };
    }
    // Igual que el script elevado: vuelve a mirar cada regla y salta la que ya no cuadra.
    for (const r of reglas) {
      const actual = this.reglasFirewallCompletas().find((x) => x.nombre === r.nombre);
      if (
        !actual ||
        actual.direccion.toLowerCase() !== 'inbound' ||
        actual.accion.toLowerCase() !== 'allow' ||
        this.rutaFirewall(actual.programa) !== this.rutaFirewall(r.programa) ||
        !(await this.programaPropio(actual.programa, r)) ||
        this.firewallNoGuardables.has(r.nombre) ||
        this.firewallNoBorrables.has(r.nombre)
      ) {
        continue;
      }
      // Primero la copia protegida, luego el borrado.
      this.almacenProtegido.set(r.id, { texto: JSON.stringify(actual), regla: { ...actual } });
      this.reglasEntrada = {
        ...this.reglasEntrada,
        reglas: this.reglasEntrada.reglas.filter((x) => x.nombre !== r.nombre),
      };
      this.reglasFirewallExtra = this.reglasFirewallExtra.filter((x) => x.nombre !== r.nombre);
    }
    return { ok: true };
  }

  async leerAlmacenFirewall(): Promise<RegistroProtegido[] | null> {
    if (this.almacenIlegible) return null;
    return [...this.almacenProtegido].map(([id, v]) => ({
      id,
      sha256: sha256Hex(v.texto),
      regla: { ...v.regla },
    }));
  }

  async restaurarReglasFirewall(reglas: ReglaPorRestaurar[]): Promise<ResultadoEscritura> {
    this.pedidosRestaurarReglas.push(reglas.map((r) => ({ ...r })));
    if (this.uacCancelado) return { ok: false, motivo: 'cancelado' };
    this.alElevarFirewall?.();
    if (this.almacenInseguro) {
      return { ok: false, motivo: 'error', detalle: DETALLE_ALMACEN_INSEGURO };
    }
    for (const r of reglas) {
      // Solo de la carpeta protegida, por id, y solo si la huella es la que se mostró.
      const guardada = this.almacenProtegido.get(r.id);
      if (!guardada || sha256Hex(guardada.texto) !== r.sha256) continue;
      const regla = guardada.regla;
      if (!reglaRestaurable(regla)) continue;
      if (this.reglasFirewallCompletas().some((x) => x.nombre === regla.nombre)) continue;
      if (!(await this.programaPropio(regla.programa, r))) continue;
      this.reglasEntrada = {
        ...this.reglasEntrada,
        reglas: [
          ...this.reglasEntrada.reglas,
          {
            nombre: regla.nombre,
            nombreVisible: regla.nombreVisible,
            perfil: regla.perfil,
            programa: regla.programa,
          },
        ],
      };
      this.reglasFirewallDetalle.set(regla.nombre, { ...regla });
      // Recreada: su copia protegida ya no hace falta.
      this.almacenProtegido.delete(r.id);
    }
    return { ok: true };
  }

  async tailscale(): Promise<{ ruta: string | null; sesion: boolean }> {
    return { ...this.tailscaleEstado };
  }

  comandoManual(c: ComandoManual): string {
    return `comando-manual:${JSON.stringify(c)}`;
  }
}
