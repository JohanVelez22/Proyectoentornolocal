import type { PerfilRed, ReglasEntrada } from './firewallWin';
import { desinstalarEnCarpeta } from './rustupRegistro';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LanzadorOculto } from './lanzarOculto';
import { descendientesDeHijos } from './procesosWin';
import type {
  AccesoPathUsuario,
  ComandoManual,
  EditorDisponible,
  EstadoAntivirus,
  EstadoCaptura,
  IdentidadUsuario,
  ProcesoUsuario,
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

  async procesosDelUsuario(): Promise<ProcesoUsuario[]> {
    return this.procesosUsuario.map((p) => ({ ...p }));
  }

  async cerrarVentanaPrincipal(pid: number): Promise<boolean> {
    const p = this.procesosUsuario.find((x) => x.pid === pid);
    if (!p || !p.ventana) return false;
    this.cierresPedidos.push(pid);
    return true;
  }

  async identidadActual(): Promise<IdentidadUsuario> {
    return { ...this.identidad };
  }

  rutasProtegidas(): string[] {
    return [...this.carpetasProtegidas];
  }

  async reglasEntradaPermitidas(): Promise<ReglasEntrada> {
    return { ok: this.reglasEntrada.ok, reglas: this.reglasEntrada.reglas.map((r) => ({ ...r })) };
  }

  async tailscale(): Promise<{ ruta: string | null; sesion: boolean }> {
    return { ...this.tailscaleEstado };
  }

  comandoManual(c: ComandoManual): string {
    return `comando-manual:${JSON.stringify(c)}`;
  }
}
