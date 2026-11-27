import type { CodigoError } from '../../errores';
import type { RangoPuertos } from '../../plataforma/tipos';
import type {
  DepsDoctor,
  Evidencia,
  HallazgoInterno,
  Reparacion,
  ResultadoReparacion,
} from '../tipos';
import {
  enRango,
  fallo,
  pidsPropios,
  puertoAlternativo,
  puertosDeServicios,
  segunEscritura,
  sigueOcupado,
  YA_RESUELTO,
  type PuertoServicio,
} from './comun';

/** Servicio de Windows de IIS (World Wide Web Publishing). */
const SERVICIO_IIS = 'W3SVC';

type Ocupante = 'flyenv' | 'xampp' | 'skype' | 'iis' | 'http_sys' | 'otro';

const PROGRAMA: Record<Ocupante, string> = {
  flyenv: 'FlyEnv',
  xampp: 'XAMPP',
  skype: 'Skype',
  iis: 'IIS',
  http_sys: 'http.sys',
  otro: '',
};

/** Reconoce al dueño por el nombre del proceso o la ruta de su ejecutable. */
function reconocer(dueno: { pid: number; nombre: string }, ejecutable: string, iis: boolean) {
  const texto = `${dueno.nombre} ${ejecutable}`;
  if (/flyenv|phpwebstudy/i.test(texto)) return 'flyenv';
  if (/xampp/i.test(texto)) return 'xampp';
  if (/skype/i.test(texto)) return 'skype';
  // El puerto de http.sys (driver del sistema) figura a nombre del proceso System (PID 4).
  if (dueno.pid === 4 || /^system$/i.test(dueno.nombre)) return iis ? 'iis' : 'http_sys';
  return 'otro';
}

/** Hallazgo + reparación "cambiar el puerto propio" (o solo informa si no se puede). */
async function conCambioDePuerto(
  d: DepsDoctor,
  base: Omit<HallazgoInterno, 'reparacion' | 'aplicar'>,
  ps: PuertoServicio,
  o: {
    rangos: RangoPuertos[];
    evitar: number[];
    comandoManual?: string;
    /** ¿Ya no hace falta? (se consulta justo antes de actuar). */
    resuelto: () => Promise<boolean>;
  },
): Promise<HallazgoInterno> {
  const comando = o.comandoManual === undefined ? {} : { comandoManual: o.comandoManual };
  if (!d.puertoCambiable(ps.servicio)) {
    return {
      ...base,
      reparacion: {
        id: 'cambiar-puerto',
        codigo: 'doctor.reparaciones.puerto_manual',
        requiereAdmin: false,
        soloInforma: true,
        ...comando,
      },
    };
  }
  const alternativo = await puertoAlternativo(d, ps.puerto, o);
  const h: HallazgoInterno = {
    ...base,
    datos: { ...base.datos, ...(alternativo === null ? {} : { alternativo }) },
    reparacion: {
      id: 'cambiar-puerto',
      codigo: 'doctor.reparaciones.cambiar_puerto',
      requiereAdmin: false,
      soloInforma: alternativo === null,
      ...comando,
    },
  };
  if (alternativo === null) return h;
  h.aplicar = async (): Promise<ResultadoReparacion> => {
    try {
      if (await o.resuelto()) return YA_RESUELTO;
      // Si el elegido se ocupó mientras tanto, se busca otro.
      const p = (await d.probarPuerto(alternativo))
        ? alternativo
        : await puertoAlternativo(d, ps.puerto, o);
      if (p === null) return { ok: false, codigo: 'doctor.sin_puerto_libre' };
      await d.cambiarPuerto(ps.servicio, p);
      return { ok: true };
    } catch (e) {
      return fallo(e);
    }
  };
  return h;
}

/** Puertos propios ocupados por otro programa (IIS/http.sys, FlyEnv, XAMPP, Skype…). */
export async function revisarPuertos(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const propios = await puertosDeServicios(d);
  if (propios.length === 0) return [];
  const duenos = await d.plataforma.duenosDePuertos(propios.map((p) => p.puerto));
  if (duenos.size === 0) return [];
  const nuestros = await pidsPropios(d);
  let rangos: RangoPuertos[] = [];
  try {
    rangos = await d.plataforma.rangosReservados('tcp');
  } catch {
    rangos = [];
  }
  const ocupados = [...duenos.keys(), ...propios.map((p) => p.puerto)];
  let iis: boolean | null = null;
  const res: HallazgoInterno[] = [];
  for (const ps of propios) {
    const dueno = duenos.get(ps.puerto);
    if (!dueno || nuestros.has(dueno.pid)) continue;
    const ejecutable = (await d.plataforma.procesoVivo(dueno.pid)).ejecutable ?? '';
    if (iis === null && (dueno.pid === 4 || /^system$/i.test(dueno.nombre))) {
      const [w3] = await d.plataforma.serviciosSistema([SERVICIO_IIS]);
      iis = w3?.estado === 'corriendo';
    }
    const quien = reconocer(dueno, ejecutable, iis === true);
    const base = {
      id: `puertos:${ps.puerto}`,
      revision: 'puertos' as const,
      gravedad: 'error' as const,
      codigo: `doctor.puerto_${quien === 'otro' ? 'ocupado' : quien}` as CodigoError,
      datos: {
        puerto: ps.puerto,
        servicio: ps.servicio,
        ...(quien === 'otro' ? { proceso: dueno.nombre } : { programa: PROGRAMA[quien] }),
      },
      evidencia: {
        codigo: (ejecutable ? 'puerto_dueno_exe' : 'puerto_dueno') as Evidencia['codigo'],
        datos: {
          puerto: ps.puerto,
          proceso: dueno.nombre,
          pid: dueno.pid,
          ...(ejecutable ? { ejecutable } : {}),
        },
      },
    };
    const resuelto = async (): Promise<boolean> => !(await sigueOcupado(d, ps.puerto));
    if (quien === 'iis') {
      // Detener IIS o, como alternativa, mover el puerto propio.
      const mover = await conCambioDePuerto(d, base, ps, { rangos, evitar: ocupados, resuelto });
      const reparacion: Reparacion = {
        id: 'detener-w3svc',
        codigo: 'doctor.reparaciones.detener_iis',
        requiereAdmin: true,
        soloInforma: false,
        comandoManual: d.plataforma.comandoManual({
          tipo: 'detener-servicio',
          nombre: SERVICIO_IIS,
        }),
      };
      res.push({
        ...base,
        datos: mover.datos,
        reparacion,
        ...(mover.aplicar && mover.reparacion
          ? { alternativa: mover.reparacion, aplicarAlternativa: mover.aplicar }
          : {}),
        aplicar: async () => {
          try {
            if (await resuelto()) return YA_RESUELTO;
            return segunEscritura(await d.plataforma.detenerServicioSistema(SERVICIO_IIS));
          } catch (e) {
            return fallo(e);
          }
        },
      });
      continue;
    }
    // FlyEnv, XAMPP, Skype y los demás nunca se tocan: se mueve el puerto propio.
    res.push(await conCambioDePuerto(d, base, ps, { rangos, evitar: ocupados, resuelto }));
  }
  return res;
}

/** Puertos propios dentro de un rango reservado por Hyper-V, WSL o Docker. */
export async function revisarRangosReservados(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const propios = await puertosDeServicios(d);
  if (propios.length === 0) return [];
  const rangos = await d.plataforma.rangosReservados('tcp');
  const res: HallazgoInterno[] = [];
  const comandoManual = d.plataforma.comandoManual({ tipo: 'liberar-rangos' });
  for (const ps of propios) {
    const r = enRango(ps.puerto, rangos);
    if (!r) continue;
    res.push(
      await conCambioDePuerto(
        d,
        {
          id: `rangos-reservados:${ps.puerto}`,
          revision: 'rangos-reservados',
          gravedad: 'error',
          codigo: 'doctor.puerto_reservado',
          datos: { puerto: ps.puerto, servicio: ps.servicio, desde: r.desde, hasta: r.hasta },
          evidencia: {
            codigo: 'rango_reservado',
            datos: { desde: r.desde, hasta: r.hasta, puerto: ps.puerto },
          },
        },
        ps,
        {
          rangos,
          evitar: propios.map((p) => p.puerto),
          comandoManual,
          resuelto: async () =>
            !enRango(ps.puerto, await d.plataforma.rangosReservados('tcp').catch(() => rangos)),
        },
      ),
    );
  }
  return res;
}
