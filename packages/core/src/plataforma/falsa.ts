import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { LanzadorOculto } from './lanzarOculto';
import { descendientesDeHijos } from './procesosWin';
import type {
  AccesoPathUsuario,
  IdCatalogo,
  OpcionesAbrirTerminal,
  PlataformaCompleta,
  RangoPuertos,
  ResultadoEscritura,
  ServicioSistema,
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
  }[] = [];
  /** Ejecutables que `buscarEjecutable` encuentra (nombre → ruta). */
  readonly ejecutables = new Map<string, string>();
  /** Hijos directos de cada PID (`descendientes` los recorre). */
  readonly hijos = new Map<number, number[]>();
  /** Procesos vivos (PID → ejecutable). */
  readonly procesos = new Map<number, string>();
  /** Dueños de puertos. */
  readonly puertos = new Map<number, { pid: number; nombre: string }>();
  /** Huellas de certificados instalados. */
  readonly certificados = new Set<string>();
  readonly urlsAbiertas: string[] = [];
  readonly matados: number[] = [];
  rangos: RangoPuertos[] = [];
  servicios = new Map<string, ServicioSistema['estado']>();
  vcRedist = true;
  firefox: string[] = [];
  documentos = '/documentos';

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

  async matarArbol(pid: number): Promise<void> {
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

  async variableUsuario(nombre: string, valor: string | null): Promise<ResultadoEscritura> {
    if (valor === null) this.variables.delete(nombre);
    else this.variables.set(nombre, valor);
    return { ok: true };
  }

  async abrirTerminal(cwd: string, o: OpcionesAbrirTerminal = {}): Promise<void> {
    this.terminales.push({ cwd, ...o });
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

  async vcRedistInstalado(): Promise<boolean> {
    return this.vcRedist;
  }

  async perfilesFirefox(): Promise<string[]> {
    return [...this.firefox];
  }
}
