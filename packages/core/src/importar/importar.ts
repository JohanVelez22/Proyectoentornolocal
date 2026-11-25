import path from 'node:path';
import { motorDe, type ObjetivoBd } from '../bd/basesDeDatos';
import {
  ErrorTrasReemplazo,
  type OpcionesImportarAjeno,
  type OrigenImportar,
  type ResultadoRestaurar,
} from '../bd/respaldos';
import { ErrorWolf, esErrorWolf, type CodigoError } from '../errores';
import { DOMINIO_VALIDO } from '../hosts/bloque';
import {
  detectarProyecto,
  phpPorDefecto,
  sugerirDominio,
  type Deteccion,
} from '../proyectos/detectar';
import { SitioSchema, TIPOS_CON_PHP, type Sitio, type TipoSitio } from '../tipos';
import { estaDentro, realOResuelta, type ProblemaImportar } from './comun';
import { detectarConProblemas, type CandidatoImportar, type ProgramaAjeno } from './detectar';

/** Un sitio de la vista previa: lo que se detectó y lo que pasaría al importarlo. */
export interface FilaImportar extends CandidatoImportar {
  /** La carpeta ya es un sitio de WolfCore Dev. */
  yaVinculado: boolean;
  /** Dominio con el que quedaría (el del programa de origen o uno propuesto). */
  dominioFinal: string;
  /** El dominio (el de origen) ya lo tiene otro sitio. */
  dominioEnUso: boolean;
  /** Rama de PHP instalada que se usaría; null si no hay ninguna (o el sitio no usa PHP). */
  phpFinal: string | null;
  /** La base ya existe en la instancia elegida (null: sin instancia o sin base). */
  baseExiste: boolean | null;
}

export interface VistaPreviaImportar {
  programas: ProgramaAjeno[];
  filas: FilaImportar[];
  problemas: ProblemaImportar[];
}

export interface OrigenBdImportar {
  host: '127.0.0.1';
  puerto: number;
  usuario: string;
  /** Solo en memoria durante la llamada: no se guarda, no se registra y no sale en ningún resultado. */
  clave: string;
}

export interface OpcionesImportar {
  origenBd?: OrigenBdImportar;
  /** Servidor local donde se restauran las bases (el motor predeterminado o una instancia). */
  instancia?: ObjetivoBd;
  /** Nombres de bases existentes que el usuario confirmó reemplazar (hace copia antes). */
  reemplazar?: string[];
}

export interface ResultadoImportar {
  sitios: {
    id: string;
    ok: boolean;
    codigo?: CodigoError;
    php?: string | null;
    phpDistinto?: boolean;
  }[];
  bases: { nombre: string; ok: boolean; codigo?: CodigoError; respaldoPrevio: string | null }[];
  /** Nginx y el archivo hosts quedaron al día con los sitios nuevos; null si no se importó ninguno. */
  aplicado: boolean | null;
}

export interface DepsImportar {
  instalaciones: () => Promise<{ programa: ProgramaAjeno; raiz: string }[]>;
  /** Carpetas que nunca se vinculan: la de datos de WolfCore Dev. */
  prohibidas: readonly string[];
  sitios: () => Promise<Sitio[]>;
  /** Crea el sitio sin aplicar Nginx ni hosts: se aplican una sola vez al final (`aplicar`). */
  guardarSitio: (datos: Omit<Sitio, 'id'>) => Promise<{ sitio: Sitio }>;
  /** Aplica Nginx y hosts con los sitios nuevos; true si todo quedó al día. */
  aplicar?: () => Promise<boolean>;
  phpInstaladas: () => Promise<string[]>;
  basesDe: (objetivo: ObjetivoBd) => Promise<string[]>;
  importarBase: (
    objetivo: ObjetivoBd,
    origen: OrigenImportar,
    destino: string,
    opciones: OpcionesImportarAjeno,
  ) => Promise<ResultadoRestaurar>;
  /** Detección de un proyecto (por defecto la real; las pruebas la acotan). */
  detectar?: (carpeta: string) => Promise<Deteccion>;
}

const NOMBRE_PROGRAMA: Record<ProgramaAjeno, string> = {
  laragon: 'Laragon',
  xampp: 'XAMPP',
  herd: 'Herd',
};

const MAX_SELECCION = 200;
const RAMA = /^(\d+)\.(\d+)/;

/** Rama instalada que corresponde a la versión de origen (`8.2.20` → `8.2`), o null. */
function ramaInstalada(version: string | null, instaladas: readonly string[]): string | null {
  const m = version ? RAMA.exec(version) : null;
  const rama = m ? `${m[1]}.${m[2]}` : null;
  return rama !== null && instaladas.includes(rama) ? rama : null;
}

/** MySQL y MariaDB distinguen mayúsculas según el sistema: se comparan sin distinguirlas. */
const mismaBase = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

const mismaCarpeta = (a: string, b: string): boolean =>
  path.resolve(a).replace(/\\/g, '/').toLowerCase() ===
  path.resolve(b).replace(/\\/g, '/').toLowerCase();

function validarOrigen(o: OrigenBdImportar): void {
  const raro = (t: string): boolean => [...t].some((c) => c.charCodeAt(0) < 0x20);
  if (
    o.host !== '127.0.0.1' ||
    !Number.isInteger(o.puerto) ||
    o.puerto < 1 ||
    o.puerto > 65535 ||
    typeof o.usuario !== 'string' ||
    o.usuario === '' ||
    o.usuario.length > 64 ||
    raro(o.usuario) ||
    typeof o.clave !== 'string' ||
    o.clave.length > 256 ||
    raro(o.clave)
  ) {
    throw new ErrorWolf(
      'importar.origen_invalido',
      'Los datos del servidor de origen no son válidos.',
    );
  }
}

/**
 * Importa lo que el usuario tiene en Laragon, XAMPP o Herd:
 * - **Sitios**: se vinculan en su lugar (nunca se mueve, copia ni modifica una carpeta) y quedan
 *   sin "Confío en este repositorio": nada de lo que traen se ejecuta solo.
 * - **Bases**: se vuelcan del servidor de origen que enciende el usuario (nunca se arranca ni se
 *   detiene un programa ajeno) y se restauran con `Respaldos.importarAjeno` (estructura revisada,
 *   datos filtrados, usuario limitado, todo o nada). Una base que ya existe no se toca salvo que
 *   el usuario la confirme en `reemplazar` (con copia previa). Si el servidor de origen no
 *   responde, los sitios se importan igual y cada base lleva `importar.origen_apagado`.
 */
export class Importador {
  private enCurso = false;

  constructor(private readonly d: DepsImportar) {}

  private async detectarTodo(): Promise<{
    candidatos: CandidatoImportar[];
    problemas: ProblemaImportar[];
    programas: ProgramaAjeno[];
  }> {
    const candidatos: CandidatoImportar[] = [];
    const problemas: ProblemaImportar[] = [];
    const programas = new Set<ProgramaAjeno>();
    const vistos = new Set<string>();
    for (const inst of await this.d.instalaciones()) {
      // Una carpeta de la propia instalación de WolfCore Dev nunca se detecta como programa ajeno.
      const raizReal = await realOResuelta(inst.raiz);
      const prohibidas = await Promise.all(this.d.prohibidas.map(realOResuelta));
      if (prohibidas.some((p) => estaDentro(p, raizReal) || estaDentro(raizReal, p))) continue;
      const r = await detectarConProblemas(inst.raiz, inst.programa, this.d.prohibidas);
      programas.add(inst.programa);
      problemas.push(...r.problemas);
      for (const c of r.candidatos) {
        if (vistos.has(c.id)) continue;
        vistos.add(c.id);
        candidatos.push(c);
      }
    }
    return { candidatos, problemas, programas: [...programas] };
  }

  /** Lo que se puede importar y lo que pasaría con cada sitio (no escribe nada). */
  async vistaPrevia(instancia?: ObjetivoBd): Promise<VistaPreviaImportar> {
    const { candidatos, problemas, programas } = await this.detectarTodo();
    const sitios = await this.d.sitios();
    const instaladas = await this.d.phpInstaladas();
    const bases = instancia ? await this.d.basesDe(instancia).catch(() => null) : null;
    const usados = new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]));
    const filas: FilaImportar[] = [];
    for (const c of candidatos) {
      const sugerido = c.dominio ?? sugerirDominio(c.carpeta);
      filas.push({
        ...c,
        yaVinculado: sitios.some((s) => mismaCarpeta(s.carpeta, c.carpeta)),
        dominioFinal: c.dominio ?? dominioLibre(sugerido, usados),
        dominioEnUso: c.dominio !== null && usados.has(c.dominio),
        phpFinal:
          ramaInstalada(c.php, instaladas) ?? phpPorDefecto('personalizado', null, instaladas),
        baseExiste:
          c.base === null || bases === null
            ? null
            : bases.some((b) => mismaBase(b, c.base!.nombre)),
      });
    }
    return { programas, filas, problemas };
  }

  /** Importa los sitios elegidos (ids de `vistaPrevia`) y, si hay datos de origen, sus bases. */
  async importar(
    seleccion: readonly string[],
    o: OpcionesImportar = {},
  ): Promise<ResultadoImportar> {
    const ids = [...new Set(seleccion)];
    if (ids.length === 0 || ids.length > MAX_SELECCION || ids.some((i) => typeof i !== 'string')) {
      throw new ErrorWolf('importar.sin_seleccion', 'Elija al menos un sitio para importar.');
    }
    if (o.origenBd) {
      validarOrigen(o.origenBd);
      if (!o.instancia) {
        throw new ErrorWolf('importar.origen_invalido', 'Elija dónde importar las bases.');
      }
    }
    if (this.enCurso) {
      throw new ErrorWolf('importar.en_curso', 'Ya hay una importación en curso.');
    }
    this.enCurso = true;
    try {
      const { candidatos } = await this.detectarTodo();
      const resultado: ResultadoImportar = { sitios: [], bases: [], aplicado: null };
      const importados: CandidatoImportar[] = [];
      for (const id of ids) {
        const c = candidatos.find((x) => x.id === id);
        if (!c) {
          resultado.sitios.push({ id, ok: false, codigo: 'importar.candidato_desconocido' });
          continue;
        }
        const r = await this.importarSitio(c);
        resultado.sitios.push({ id, ...r });
        if (r.ok) importados.push(c);
      }
      if (importados.length > 0 && this.d.aplicar) {
        // Los sitios ya están guardados: si Nginx o hosts fallan, se informa y se sigue con las bases.
        resultado.aplicado = await this.d.aplicar().catch(() => false);
      }
      if (o.origenBd && o.instancia) {
        await this.importarBases(
          importados,
          o.origenBd,
          o.instancia,
          o.reemplazar ?? [],
          resultado,
        );
      }
      return resultado;
    } finally {
      this.enCurso = false;
    }
  }

  private async importarSitio(
    c: CandidatoImportar,
  ): Promise<{ ok: boolean; codigo?: CodigoError; php?: string | null; phpDistinto?: boolean }> {
    try {
      const sitios = await this.d.sitios();
      if (sitios.some((s) => mismaCarpeta(s.carpeta, c.carpeta))) {
        return { ok: false, codigo: 'importar.ya_vinculado' };
      }
      const usados = new Set(sitios.flatMap((s) => [s.dominio, ...s.alias]));
      let dominio = c.dominio;
      if (dominio !== null && usados.has(dominio)) {
        return { ok: false, codigo: 'importar.dominio_existe' };
      }
      dominio ??= dominioLibre(sugerirDominio(c.carpeta), usados);
      // Solo se lee la carpeta: el tipo, PHP y variable de URL salen de lo que ya hay en ella.
      const det = await (
        this.d.detectar ?? ((f: string) => detectarProyecto(f, { pgvector: false }))
      )(c.carpeta);
      const tipo: TipoSitio = det.tipo;
      let php: string | null = null;
      let phpDistinto = false;
      if (TIPOS_CON_PHP.includes(tipo)) {
        const instaladas = await this.d.phpInstaladas();
        php =
          ramaInstalada(c.php, instaladas) ??
          ramaInstalada(det.php, instaladas) ??
          phpPorDefecto(tipo, null, instaladas) ??
          instaladas.at(-1) ??
          null;
        if (php === null) return { ok: false, codigo: 'importar.sin_php' };
        phpDistinto =
          (c.php ?? det.php) !== null && ramaInstalada(c.php ?? det.php, instaladas) !== php;
      }
      const datos = SitioSchema.omit({ id: true }).parse({
        nombre: c.nombre,
        dominio,
        alias: [],
        carpeta: c.carpeta,
        tipo,
        php,
        puertoProxy: null,
        urlBaseVar: det.urlBaseVar,
        nota: `Importado desde ${NOMBRE_PROGRAMA[c.programa]}`,
        // Lo importado nunca se confía solo: ninguna receta de la carpeta se ejecuta.
        confiado: false,
        https: false,
      });
      if (!DOMINIO_VALIDO.test(dominio)) {
        return { ok: false, codigo: 'importar.sitio_fallo' };
      }
      await this.d.guardarSitio(datos);
      return { ok: true, php, phpDistinto };
    } catch (e) {
      return { ok: false, codigo: esErrorWolf(e) ? e.codigo : 'importar.sitio_fallo' };
    }
  }

  private async importarBases(
    importados: readonly CandidatoImportar[],
    origen: OrigenBdImportar,
    instancia: ObjetivoBd,
    reemplazar: readonly string[],
    resultado: ResultadoImportar,
  ): Promise<void> {
    const nombres = new Map<string, string>();
    for (const c of importados) {
      if (c.base) nombres.set(c.base.nombre.toLowerCase(), c.base.nombre);
    }
    if (nombres.size === 0) return;
    motorDe(instancia);
    let existentes: string[];
    try {
      existentes = await this.d.basesDe(instancia);
    } catch (e) {
      const codigo = esErrorWolf(e) ? e.codigo : 'importar.base_fallo';
      for (const n of nombres.values()) {
        resultado.bases.push({ nombre: n, ok: false, codigo, respaldoPrevio: null });
      }
      return;
    }
    let origenApagado = false;
    for (const nombre of nombres.values()) {
      if (origenApagado) {
        resultado.bases.push({
          nombre,
          ok: false,
          codigo: 'importar.origen_apagado',
          respaldoPrevio: null,
        });
        continue;
      }
      const existe = existentes.some((b) => mismaBase(b, nombre));
      if (existe && !reemplazar.some((r) => mismaBase(r, nombre))) {
        // Una base que ya existe no se toca sin la confirmación del usuario.
        resultado.bases.push({
          nombre,
          ok: false,
          codigo: 'importar.base_existe',
          respaldoPrevio: null,
        });
        continue;
      }
      try {
        const r = await this.d.importarBase(
          instancia,
          {
            host: origen.host,
            puerto: origen.puerto,
            usuario: origen.usuario,
            clave: origen.clave,
            base: nombre,
          },
          nombre,
          { confirmarSobrescribir: existe, baseNueva: !existe },
        );
        resultado.bases.push({ nombre, ok: true, respaldoPrevio: r.respaldoPrevio ?? null });
      } catch (e) {
        const codigo: CodigoError = esErrorWolf(e) ? e.codigo : 'importar.base_fallo';
        if (codigo === 'importar.origen_apagado') origenApagado = true;
        resultado.bases.push({
          nombre,
          ok: false,
          codigo: e instanceof ErrorTrasReemplazo ? 'importar.base_fallo' : codigo,
          respaldoPrevio: e instanceof ErrorTrasReemplazo ? e.respaldoPrevio : null,
        });
      }
    }
  }
}

/** `app.test` → `app.test`, o `app-2.test`, `app-3.test`… hasta uno que nadie use. */
function dominioLibre(base: string, usados: ReadonlySet<string>): string {
  if (!usados.has(base)) return base;
  const [nombre, ...resto] = base.split('.');
  for (let n = 2; n < 1000; n++) {
    const d = [`${nombre}-${n}`, ...resto].join('.');
    if (!usados.has(d)) return d;
  }
  return base;
}
