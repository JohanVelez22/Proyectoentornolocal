import { nombreEjecutable } from '../../plataforma/sistema';
import type { VersionDisponible } from '../catalogo';
import { compararVersionesDesc } from '../comun';
import { IndiceMalformado, leerIndice, ramaMayorMenor, type FuenteVersiones } from './tipos';

/**
 * Archivo oficial de descargas de ngrok v3 (canal estable). La FAQ de ngrok lo cita como el lugar
 * donde se publica el SHA-256 de cada versión: «The release archive publishes a SHA256 hash for
 * every release» (https://ngrok.com/docs/faq/). Es un HTML de unos 2,6 MB: cada versión lleva un
 * enlace `bin.equinox.io/a/<id>/ngrok-v3-<versión>-windows-amd64.zip` y, a continuación, un
 * `<input readonly value="<sha256>">`. No hay un índice JSON ni un archivo de sumas.
 */
export const INDICE_NGROK = 'https://dl.equinox.io/ngrok/ngrok-v3/stable/archive';
/** Versiones que se ofrecen (las más nuevas del canal estable). */
const MAX_VERSIONES = 5;
/** El archivo pesa ~2,6 MB: se admite el doble. */
const MAX_BYTES = 5 * 1024 * 1024;

/** `https://bin.equinox.io/a/<id>/ngrok-v3-3.39.13-windows-amd64.zip`, la versión sale del nombre. */
const ENLACE =
  /href="(https:\/\/bin\.equinox\.io\/a\/[A-Za-z0-9]{1,40}\/ngrok-v3-(\d{1,3}\.\d{1,3}\.\d{1,3})-windows-amd64\.zip)"[^]{0,800}?<input[^>]*\bvalue="([0-9a-f]{64})"/g;

/** Lo que dice el archivo para Windows x64: versión, URL y SHA-256, de la más nueva a la más vieja. */
export function interpretarArchivoNgrok(html: string): VersionDisponible[] {
  const vistas = new Map<string, VersionDisponible>();
  for (const m of html.matchAll(ENLACE)) {
    const [, url, version, suma] = m as unknown as [string, string, string, string];
    const previa = vistas.get(version);
    if (previa) {
      // La misma versión no puede traer dos sumas distintas: delata un archivo manipulado.
      if (previa.sha256 !== suma) throw new IndiceMalformado(`ngrok ${version} con dos sumas`);
      continue;
    }
    vistas.set(version, {
      servicio: 'ngrok',
      version,
      ...(ramaMayorMenor(version) ? { rama: ramaMayorMenor(version)! } : {}),
      url,
      sha256: suma,
      huella: { algoritmo: 'sha256', valor: suma },
      formato: 'zip',
      ejecutable: nombreEjecutable('ngrok'),
      soporte: 'actual',
      finSoporte: null,
      origen: 'vivo',
    });
  }
  if (vistas.size === 0) throw new IndiceMalformado('El archivo de ngrok no trae ninguna versión');
  return [...vistas.values()]
    .sort((a, b) => compararVersionesDesc(a.version, b.version))
    .slice(0, MAX_VERSIONES);
}

/** ngrok: versión estable, descarga oficial de Equinox y el SHA-256 de su archivo de descargas. */
export const fuenteNgrok: FuenteVersiones = {
  servicio: 'ngrok',
  hostsIndice: ['dl.equinox.io'],
  async listar(ctx) {
    if (ctx.idCatalogo !== 'win-x64') return [];
    return interpretarArchivoNgrok(await leerIndice(ctx, INDICE_NGROK, { maxBytes: MAX_BYTES }));
  },
};
