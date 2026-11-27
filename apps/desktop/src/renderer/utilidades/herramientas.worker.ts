/**
 * Worker de Herramientas: aquí corre lo que puede bloquear (regex con retroceso catastrófico,
 * MD5 de archivos grandes). Quien lo crea lo termina al recibir la respuesta o al vencer el plazo.
 */
import { buscarCoincidencias, md5 } from './herramientasTrabajo';

type Mensaje =
  | { tipo: 'regex'; patron: string; banderas: string; texto: string }
  | { tipo: 'md5'; datos: ArrayBuffer };

self.onmessage = (e: MessageEvent<Mensaje>) => {
  const m = e.data;
  try {
    if (m.tipo === 'regex') {
      self.postMessage({ resultado: buscarCoincidencias(m.patron, m.banderas, m.texto) });
    } else {
      self.postMessage({ resultado: md5(new Uint8Array(m.datos)) });
    }
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
