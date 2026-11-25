import { revisarAntivirus } from './revisiones/antivirus';
import { revisarFirewall } from './revisiones/firewall';
import { revisarCa, revisarCertificados, revisarConfianza } from './revisiones/ca';
import { revisarEnlazadorMsvc } from './revisiones/enlazador';
import { revisarHosts } from './revisiones/hosts';
import { revisarPath } from './revisiones/path';
import { revisarPuertos, revisarRangosReservados } from './revisiones/puertos';
import { revisarServicios } from './revisiones/servicios';
import { revisarVcRedist } from './revisiones/vcredist';
import {
  IDS_REVISION,
  type DepsDoctor,
  type Hallazgo,
  type HallazgoInterno,
  type IdRevision,
  type Revision,
  type ResultadoReparacion,
} from './tipos';

export * from './tipos';

const REVISIONES: Record<IdRevision, Revision> = {
  puertos: revisarPuertos,
  'rangos-reservados': revisarRangosReservados,
  ca: revisarCa,
  certificados: revisarCertificados,
  confianza: revisarConfianza,
  hosts: revisarHosts,
  path: revisarPath,
  vcredist: revisarVcRedist,
  'enlazador-msvc': revisarEnlazadorMsvc,
  antivirus: revisarAntivirus,
  firewall: revisarFirewall,
  servicios: revisarServicios,
};

/** Copia pública del hallazgo: sin la función de reparación (viaja por IPC tal cual). */
function publico(h: HallazgoInterno): Hallazgo {
  const { aplicar, aplicarAlternativa, ...resto } = h;
  void aplicar;
  void aplicarAlternativa;
  return resto;
}

/**
 * Doctor: revisa el entorno (puertos, rangos reservados, CA y certificados, hosts, PATH, VC++,
 * antivirus y servicios) y ofrece reparaciones guiadas. Ninguna reparación corre sin
 * `confirmacion: true`; las que solo informan nunca hacen nada (muestran `comandoManual`).
 * Nunca actúa sobre programas ajenos (FlyEnv, XAMPP…): mueve el puerto propio.
 */
export class Doctor {
  private hallazgos: HallazgoInterno[] = [];
  /** Revisiones en curso: una a la vez por área. */
  private readonly enCurso = new Map<IdRevision, Promise<HallazgoInterno[]>>();
  /** Reparaciones en curso por hallazgo: un segundo pedido espera a la primera. */
  private readonly reparando = new Map<string, Promise<ResultadoReparacion>>();

  constructor(private readonly d: DepsDoctor) {}

  private async correr(id: IdRevision): Promise<HallazgoInterno[]> {
    const previa = this.enCurso.get(id);
    if (previa) return previa;
    const p = REVISIONES[id](this.d).catch((e: unknown): HallazgoInterno[] => [
      {
        id: `${id}:fallo`,
        revision: id,
        gravedad: 'info',
        codigo: 'doctor.revision_fallida',
        datos: { revision: id },
        evidencia: e instanceof Error ? e.message : String(e),
      },
    ]);
    this.enCurso.set(id, p);
    try {
      return await p;
    } finally {
      this.enCurso.delete(id);
    }
  }

  /** Reemplaza en `ultimo()` los hallazgos de esas áreas, conservando el orden de las áreas. */
  private guardar(ids: readonly IdRevision[], nuevos: HallazgoInterno[]): void {
    const otros = this.hallazgos.filter((h) => !ids.includes(h.revision));
    const todos = [...otros, ...nuevos];
    this.hallazgos = IDS_REVISION.flatMap((r) => todos.filter((h) => h.revision === r));
  }

  /** Corre las revisiones pedidas (todas por defecto) y devuelve sus hallazgos. */
  async revisar(ids?: IdRevision[]): Promise<Hallazgo[]> {
    const lista = ids?.length ? [...new Set(ids)] : [...IDS_REVISION];
    for (const id of lista) {
      if (!IDS_REVISION.includes(id)) throw new Error(`Revisión desconocida: ${String(id)}`);
    }
    const nuevos = (await Promise.all(lista.map((id) => this.correr(id)))).flat();
    this.guardar(lista, nuevos);
    const errores = nuevos.filter((h) => h.gravedad === 'error').length;
    if (errores > 0) {
      this.d.avisos?.publicar({
        nivel: 'error',
        tipo: 'doctor',
        codigo: 'doctor.hallazgos',
        datos: { fuente: 'doctor', errores },
        accion: { ruta: 'doctor' },
      });
    }
    return nuevos.map(publico);
  }

  /** Último resultado conocido de cada área. */
  ultimo(): Hallazgo[] {
    return this.hallazgos.map(publico);
  }

  /**
   * Aplica la reparación del hallazgo. Exige `confirmacion === true` (el usuario vio qué se
   * hará). `reparacionId` elige la alternativa (`hallazgo.alternativa.id`); por defecto, la
   * principal. Un segundo pedido mientras la primera corre no la aplica otra vez. Tras una
   * reparación correcta se vuelve a revisar esa área.
   */
  async reparar(
    hallazgoId: string,
    confirmacion: true,
    reparacionId?: string,
  ): Promise<ResultadoReparacion> {
    if (confirmacion !== true) return { ok: false, codigo: 'doctor.confirmacion_requerida' };
    const previa = this.reparando.get(hallazgoId);
    if (previa) return previa;
    const h = this.hallazgos.find((x) => x.id === hallazgoId);
    if (!h) return { ok: false, codigo: 'doctor.hallazgo_desconocido' };
    const principal = reparacionId === undefined || reparacionId === h.reparacion?.id;
    const rep = principal ? h.reparacion : h.alternativa;
    const aplicar = principal ? h.aplicar : h.aplicarAlternativa;
    if (!rep || rep.soloInforma || !aplicar || (!principal && rep.id !== reparacionId)) {
      return { ok: false, codigo: 'doctor.solo_informa' };
    }
    const p = (async (): Promise<ResultadoReparacion> => {
      const r = await aplicar();
      if (r.ok) this.guardar([h.revision], await this.correr(h.revision));
      return r;
    })();
    this.reparando.set(hallazgoId, p);
    try {
      return await p;
    } finally {
      this.reparando.delete(hallazgoId);
    }
  }
}
