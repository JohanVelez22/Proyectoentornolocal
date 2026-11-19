import { DIAS_AVISO_VENCIMIENTO } from '../../avisos/avisos';
import type { DepsDoctor, HallazgoInterno, ResultadoReparacion } from '../tipos';
import { fallo } from './comun';

const intentar =
  (fn: () => Promise<ResultadoReparacion>) => async (): Promise<ResultadoReparacion> => {
    try {
      return await fn();
    } catch (e) {
      return fallo(e);
    }
  };

/** Vencimiento de la CA de WolfCore Dev (regenerarla obliga a volver a confiarla). */
export async function revisarCa(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const ca = (await d.https.vencimientos()).find((v) => v.id === 'ca');
  if (!ca || ca.dias > DIAS_AVISO_VENCIMIENTO) return [];
  const vencida = ca.dias < 0;
  return [
    {
      id: 'ca:vencimiento',
      revision: 'ca',
      gravedad: vencida ? 'error' : 'aviso',
      codigo: vencida ? 'doctor.ca_vencida' : 'doctor.ca_por_vencer',
      datos: vencida ? {} : { dias: ca.dias },
      evidencia: vencida ? `La CA venció hace ${-ca.dias} días` : `La CA vence en ${ca.dias} días`,
      reparacion: {
        id: 'regenerar-ca',
        codigo: 'doctor.reparaciones.regenerar_ca',
        requiereAdmin: false,
        soloInforma: false,
      },
      aplicar: intentar(() => d.https.regenerarCA()),
    },
  ];
}

/** Certificados de los sitios por vencer o vencidos. */
export async function revisarCertificados(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const res: HallazgoInterno[] = [];
  for (const v of await d.https.vencimientos()) {
    if (v.id === 'ca' || v.dias > DIAS_AVISO_VENCIMIENTO) continue;
    const vencido = v.dias < 0;
    const dominio = v.nombre ?? v.id;
    res.push({
      id: `certificados:${v.id}`,
      revision: 'certificados',
      gravedad: vencido ? 'error' : 'aviso',
      codigo: vencido ? 'doctor.certificado_vencido' : 'doctor.certificado_por_vencer',
      datos: vencido ? { dominio } : { dominio, dias: v.dias },
      evidencia: vencido
        ? `El certificado de ${dominio} venció hace ${-v.dias} días`
        : `El certificado de ${dominio} vence en ${v.dias} días`,
      reparacion: {
        id: 'regenerar-certificados',
        codigo: 'doctor.reparaciones.regenerar_certificados',
        requiereAdmin: false,
        soloInforma: false,
      },
      aplicar: intentar(() => d.https.regenerarCertificados()),
    });
  }
  return res;
}

/**
 * Perfiles de Firefox que no confían en las raíces del sistema (y por eso no en la CA). Solo si
 * la CA existe; la reparación agrega el bloque marcado en `user.js` de cada perfil cerrado.
 */
export async function revisarConfianza(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const c = d.confianza;
  if (!c || !c.caCreada()) return [];
  const faltan = (await c.firefox()).filter((p) => !p.activo);
  if (faltan.length === 0) return [];
  return [
    {
      id: 'confianza:firefox',
      revision: 'confianza',
      gravedad: 'aviso',
      codigo: 'doctor.firefox_sin_confianza',
      datos: { cantidad: faltan.length },
      evidencia: `Perfiles de Firefox sin la confianza: ${faltan
        .map((p) =>
          p.fuera
            ? `${p.perfil} (fuera de la carpeta de Firefox)`
            : p.abierto
              ? `${p.perfil} (abierto)`
              : p.perfil,
        )
        .join(', ')}`,
      reparacion: {
        id: 'firefox-confianza',
        codigo: 'doctor.reparaciones.firefox_confianza',
        requiereAdmin: false,
        soloInforma: false,
      },
      aplicar: intentar(async () => {
        const r = await c.firefoxActivar(true);
        if (r.some((x) => x.codigo === 'firefox.abierto')) {
          return { ok: false, codigo: 'firefox.abierto' };
        }
        if (r.some((x) => x.codigo === 'firefox.fuera')) {
          return { ok: false, codigo: 'firefox.fuera' };
        }
        return r.every((x) => x.ok)
          ? { ok: true }
          : { ok: false, codigo: 'doctor.reparacion_fallida' };
      }),
    },
  ];
}
