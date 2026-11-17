import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Almacen } from '../almacen';
import type { Instalador } from '../catalogo/instalador';
import type { Eventos, EventosNucleo } from '../eventos';
import type { Supervisor } from '../procesos/supervisor';
import type { Rutas } from '../rutas';
import type { GestorSitios } from '../sitios/sitios';
import type { UrlBase } from '../sitios/urlbase';
import type { EstadoTunel, Sitio } from '../tipos';
import { extraerUrlTunel } from './url';

export interface DepsTuneles {
  supervisor: Pick<Supervisor, 'iniciar' | 'detener' | 'estado' | 'pid' | 'alSalir'>;
  sitios: Pick<GestorSitios, 'listar'>;
  almacen: Pick<Almacen, 'leer'>;
  instalador: Pick<Instalador, 'instalados'>;
  rutas: Rutas;
  urlBase: Pick<UrlBase, 'aplicar' | 'restaurar'>;
  eventos: Eventos<EventosNucleo>;
  opts?: { esperaMs?: number; intervaloMs?: number };
}

interface RegistroTunel {
  sitioId: string;
  url: string;
  pid: number;
}

const PREFIJO = 'tunel-';
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
  private readonly esperaMs: number;
  private readonly intervaloMs: number;

  constructor(private readonly d: DepsTuneles) {
    this.esperaMs = d.opts?.esperaMs ?? 30_000;
    this.intervaloMs = d.opts?.intervaloMs ?? 500;
    d.supervisor.alSalir((id) => {
      void this.alSalirProceso(id);
    });
  }

  estados(): EstadoTunel[] {
    return [...this.mapa.values()].map((e) => ({ ...e }));
  }

  abrir(sitioId: string): Promise<EstadoTunel> {
    const actual = this.mapa.get(sitioId);
    if (actual && actual.estado === 'activo') return Promise.resolve({ ...actual });
    const enCurso = this.abriendo.get(sitioId);
    if (enCurso) return enCurso;
    const p = this.abrirInterno(sitioId).finally(() => this.abriendo.delete(sitioId));
    this.abriendo.set(sitioId, p);
    return p;
  }

  async cerrar(sitioId: string): Promise<void> {
    const id = PREFIJO + sitioId;
    this.cerrando.add(sitioId);
    try {
      await this.d.supervisor.detener(id);
      const sitio = await this.buscar(sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
      this.mapa.delete(sitioId);
      this.quitarRegistro(sitioId);
      this.d.eventos.emit('tunel:estado', { sitioId, estado: 'apagado', url: null });
    } finally {
      this.cerrando.delete(sitioId);
    }
  }

  async renovar(sitioId: string): Promise<EstadoTunel> {
    await this.cerrar(sitioId);
    return this.abrir(sitioId);
  }

  /** Recupera los túneles que siguen vivos tras reiniciar la app (llamar tras supervisor.readoptar). */
  async restaurar(): Promise<void> {
    const registros = this.leerRegistros();
    const vivos: RegistroTunel[] = [];
    for (const r of registros) {
      const id = PREFIJO + r.sitioId;
      if (this.d.supervisor.estado(id) !== 'apagado' && this.d.supervisor.pid(id) === r.pid) {
        vivos.push(r);
        this.fijar({ sitioId: r.sitioId, estado: 'activo', url: r.url });
        continue;
      }
      const sitio = await this.buscar(r.sitioId);
      if (sitio) await this.restaurarUrlBase(sitio);
    }
    this.escribirRegistros(vivos);
  }

  private async abrirInterno(sitioId: string): Promise<EstadoTunel> {
    const sitio = await this.buscar(sitioId);
    if (!sitio) throw new Error('Sitio no encontrado');
    const versiones = await this.d.instalador.instalados('cloudflared');
    const version = [...versiones].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    )[0];
    if (!version) throw new Error('cloudflared no está instalado. Instálelo desde Servicios.');
    const puerto = (await this.d.almacen.leer()).servicios.nginx.puerto;

    const id = PREFIJO + sitioId;
    const logCloudflared = this.d.rutas.logs('tuneles', `${id}.log`);
    const logSalida = this.d.rutas.logs('tuneles', `${id}.salida.log`);
    // Evita leer una URL de una ejecución anterior.
    rmSync(logCloudflared, { force: true });
    rmSync(logSalida, { force: true });
    mkdirSync(path.dirname(logCloudflared), { recursive: true });

    this.fijar({ sitioId, estado: 'iniciando', url: null });
    try {
      await this.d.supervisor.iniciar({
        id,
        comando: path.join(this.d.rutas.bin('cloudflared', version), 'cloudflared.exe'),
        args: [
          'tunnel',
          '--no-autoupdate',
          '--url',
          `http://127.0.0.1:${puerto}`,
          '--http-host-header',
          sitio.dominio,
          '--logfile',
          logCloudflared,
        ],
        log: logSalida,
        reiniciar: false,
      });
    } catch (e) {
      this.fijar({
        sitioId,
        estado: 'error',
        url: null,
        mensaje: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }

    const limite = Date.now() + this.esperaMs;
    for (;;) {
      const url = extraerUrlTunel(leerTexto(logCloudflared) + '\n' + leerTexto(logSalida));
      if (url) return this.alEncontrarUrl(sitio, url);
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
    const seg = Math.round(this.esperaMs / 1000);
    return this.fijar({
      sitioId,
      estado: 'error',
      url: null,
      mensaje: `No apareció la URL del túnel en ${seg} s. Revise el log del túnel y que Nginx esté encendido.`,
    });
  }

  private async alEncontrarUrl(sitio: Sitio, url: string): Promise<EstadoTunel> {
    const sitioId = sitio.id;
    const pid = this.d.supervisor.pid(PREFIJO + sitioId);
    if (pid !== null) this.agregarRegistro({ sitioId, url, pid });
    let mensaje: string | undefined;
    if (sitio.urlBaseVar) {
      try {
        mensaje = (await this.d.urlBase.aplicar(sitio, `${url}/`)) ?? undefined;
      } catch (e) {
        mensaje = `No se pudo cambiar la URL base: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
    // Si el proceso murió o se cerró durante la aplicación, no se pisa ese estado.
    const actual = this.mapa.get(sitioId);
    if (!actual || actual.estado !== 'iniciando')
      return actual ? { ...actual } : this.apagado(sitioId);
    return this.fijar({ sitioId, estado: 'activo', url, ...(mensaje ? { mensaje } : {}) });
  }

  private async alSalirProceso(id: string): Promise<void> {
    if (!id.startsWith(PREFIJO)) return;
    const sitioId = id.slice(PREFIJO.length);
    if (this.cerrando.has(sitioId)) return;
    const actual = this.mapa.get(sitioId);
    if (!actual || actual.estado === 'apagado' || actual.estado === 'error') return;
    this.fijar({ sitioId, estado: 'error', url: actual.url, mensaje: MSG_CERRADO });
    this.quitarRegistro(sitioId);
    const sitio = await this.buscar(sitioId);
    if (sitio) await this.restaurarUrlBase(sitio);
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
