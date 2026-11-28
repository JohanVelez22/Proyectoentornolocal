import { limiteTemperatura, UMBRALES_DISCO } from '../../discos/veredicto';
import type { DiscoSalud } from '../../discos/tipos';
import type { DepsDoctor, Evidencia, HallazgoInterno } from '../tipos';

/** Qué vio el Doctor de cada motivo del veredicto (solo números y estados, nunca series). */
function evidenciaMotivos(d: DiscoSalud): Evidencia[] {
  const c = d.contadores;
  const res: Evidencia[] = [];
  for (const m of d.motivos) {
    switch (m) {
      case 'estado_warning':
      case 'estado_unhealthy':
        res.push({
          codigo: 'disco_estado',
          datos: { estado: m === 'estado_warning' ? 'Warning' : 'Unhealthy' },
        });
        break;
      case 'estado_operacional':
        res.push({ codigo: 'disco_operacional', datos: { estado: d.operacional.join(', ') } });
        break;
      case 'errores_sin_corregir':
        res.push({
          codigo: 'disco_errores',
          datos: {
            lectura: c?.erroresLecturaNoCorregidos ?? 0,
            escritura: c?.erroresEscrituraNoCorregidos ?? 0,
          },
        });
        break;
      case 'prediccion_fallo':
        res.push({ codigo: 'disco_prediccion', datos: {} });
        break;
      case 'desgaste':
        res.push({
          codigo: 'disco_desgaste',
          datos: { desgaste: c?.desgastePct ?? 0, umbral: UMBRALES_DISCO.desgasteAtencion },
        });
        break;
      case 'temperatura':
        res.push({
          codigo: 'disco_temperatura',
          datos: {
            temperatura: c?.temperaturaC ?? 0,
            limite: limiteTemperatura(d)?.valor ?? 0,
          },
        });
        break;
      case 'errores_corregidos_suben':
        res.push({
          codigo: 'disco_corregidos',
          datos: { cantidad: c?.erroresLecturaCorregidos ?? 0 },
        });
        break;
    }
  }
  return res;
}

/**
 * Salud de los discos (D57): un hallazgo por cada disco en «Atención» (aviso) o «Crítico»
 * (error). Solo informa: WolfCore Dev no toca ningún disco. Sin permisos de administrador y sin
 * lanzar UAC; lo que no se pueda leer no es un hallazgo.
 */
export async function revisarDiscos(d: DepsDoctor): Promise<HallazgoInterno[]> {
  if (!d.discos) return [];
  const r = await d.discos.leer().catch(() => null);
  if (!r) return [];
  const res: HallazgoInterno[] = [];
  for (const disco of r.discos) {
    if (disco.veredicto !== 'atencion' && disco.veredicto !== 'critico') continue;
    const critico = disco.veredicto === 'critico';
    const modelo = disco.modelo ?? `#${disco.numero}`;
    res.push({
      id: `discos:${disco.numero}`,
      revision: 'discos',
      gravedad: critico ? 'error' : 'aviso',
      codigo: critico ? 'doctor.disco_critico' : 'doctor.disco_atencion',
      datos: { modelo },
      evidencia: {
        codigo: 'disco_modelo',
        datos: { modelo, numero: disco.numero },
        lineas: evidenciaMotivos(disco),
      },
    });
  }
  return res;
}
