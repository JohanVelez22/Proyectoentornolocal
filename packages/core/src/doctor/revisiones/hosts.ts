import { readFile, stat } from 'node:fs/promises';
import {
  analizarHosts,
  decodificarHosts,
  diagnosticarBloques,
  normalizarDominios,
} from '../../hosts/bloque';
import type { DepsDoctor, HallazgoInterno, Reparacion, ResultadoReparacion } from '../tipos';
import { fallo, segunEscritura } from './comun';

const REESCRIBIR: Reparacion = {
  id: 'hosts-reescribir',
  codigo: 'doctor.reparaciones.hosts_reescribir',
  requiereAdmin: true,
  soloInforma: false,
};

/** Reescribe el bloque (con copia con fecha) por la cola de GestorHosts: un solo UAC a la vez. */
const reescribir = (d: DepsDoctor) => async (): Promise<ResultadoReparacion> => {
  try {
    const r = await d.hosts.reparar(await d.dominios(), { carpetaRespaldo: d.carpetaRespaldos });
    return segunEscritura(r, 'hosts.tiempo_agotado');
  } catch (e) {
    return fallo(e);
  }
};

/**
 * Archivo hosts: bloque de WolfCore Dev duplicado o sin cierre, UTF-16, solo lectura y dominios
 * `.test` que faltan en el bloque.
 */
export async function revisarHosts(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const ruta = d.plataforma.rutaHosts();
  let bytes: Buffer;
  try {
    bytes = await readFile(ruta);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'ENOENT') bytes = Buffer.alloc(0);
    else {
      return [
        {
          id: 'hosts:ilegible',
          revision: 'hosts',
          gravedad: 'error',
          codigo: 'doctor.hosts_ilegible',
          datos: {},
          evidencia: { codigo: 'hosts_ilegible', datos: { ruta, motivo: code ?? 'UNKNOWN' } },
        },
      ];
    }
  }
  const { texto, codificacion } = decodificarHosts(bytes);
  const { bloques, sinCierre } = diagnosticarBloques(texto);
  const res: HallazgoInterno[] = [];
  const conReescribir = (h: Omit<HallazgoInterno, 'reparacion' | 'aplicar'>): void => {
    res.push({ ...h, reparacion: REESCRIBIR, aplicar: reescribir(d) });
  };
  if (codificacion !== 'utf8') {
    conReescribir({
      id: 'hosts:utf16',
      revision: 'hosts',
      gravedad: 'error',
      codigo: 'doctor.hosts_utf16',
      datos: {},
      evidencia: {
        codigo: 'hosts_codificacion',
        datos: { ruta, codificacion: codificacion.toUpperCase() },
      },
    });
  }
  if (bloques > 1) {
    conReescribir({
      id: 'hosts:duplicado',
      revision: 'hosts',
      gravedad: 'aviso',
      codigo: 'doctor.hosts_bloque_duplicado',
      datos: { bloques },
      evidencia: { codigo: 'hosts_bloques', datos: { ruta, bloques } },
    });
  }
  if (sinCierre) {
    conReescribir({
      id: 'hosts:sin-cierre',
      revision: 'hosts',
      gravedad: 'error',
      codigo: 'doctor.hosts_bloque_sin_cierre',
      datos: {},
      evidencia: { codigo: 'hosts_sin_cierre', datos: { ruta } },
    });
  }
  const pedidos = normalizarDominios(await d.dominios());
  const { enBloque } = analizarHosts(texto);
  const faltan = pedidos.filter((x) => !enBloque.includes(x));
  // Con el bloque roto, faltar dominios es consecuencia: lo arregla la misma reescritura.
  if (faltan.length > 0 && res.length === 0) {
    conReescribir({
      id: 'hosts:faltantes',
      revision: 'hosts',
      gravedad: 'error',
      codigo: 'doctor.hosts_dominios_faltantes',
      datos: { cantidad: faltan.length },
      evidencia: {
        codigo: 'hosts_faltan',
        datos: { dominios: `${faltan.slice(0, 20).join(', ')}${faltan.length > 20 ? '…' : ''}` },
      },
    });
  }
  if (bytes.length > 0 && ((await stat(ruta)).mode & 0o200) === 0) {
    // Un antivirus que "protege hosts" suele marcarlo de solo lectura. WolfCore Dev igual puede
    // escribirlo (lo desbloquea y lo vuelve a bloquear); quitarlo es opcional y con permiso.
    res.push({
      id: 'hosts:solo-lectura',
      revision: 'hosts',
      gravedad: 'aviso',
      codigo: 'doctor.hosts_solo_lectura',
      datos: {},
      evidencia: { codigo: 'hosts_solo_lectura', datos: { ruta } },
      reparacion: {
        id: 'hosts-quitar-solo-lectura',
        codigo: 'doctor.reparaciones.hosts_solo_lectura',
        requiereAdmin: true,
        soloInforma: false,
        comandoManual: d.plataforma.comandoManual({ tipo: 'quitar-solo-lectura-hosts' }),
      },
      aplicar: async () => {
        try {
          return segunEscritura(
            await d.plataforma.quitarSoloLecturaHosts(),
            'hosts.tiempo_agotado',
          );
        } catch (e) {
          return fallo(e);
        }
      },
    });
  }
  return res;
}
