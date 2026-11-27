import { ErrorWolf } from '../errores';

/** Lo que el preparador necesita del resto del núcleo (en las pruebas, un reloj y servicios falsos). */
export interface DepsPrepararInstancia {
  /** Estado de la instancia, o undefined si ya no está en la lista. */
  estadoDe(id: string): Promise<{ estado: string } | undefined>;
  iniciar(id: string): Promise<void>;
  /** Avisa de que se sigue esperando (la importación lo traduce en progreso). */
  progreso?: () => void;
  ahora?: () => number;
  dormir?: (ms: number) => Promise<void>;
  /** Cuánto se espera a que una instancia encienda (90 s por omisión). */
  limiteMs?: number;
}

const LIMITE_MS = 90_000;
const SONDEO_MS = 500;
/** Cada cuánto se avisa de progreso mientras se espera. */
const PROGRESO_MS = 2_000;

/**
 * Prepara las instancias que una importación necesita encendidas. Recuerda por instancia el
 * resultado de la primera espera, sea éxito o fallo, mientras viva el preparador (una
 * importación): con 15 bases de una instancia que nunca enciende se espera una sola vez, no
 * 15 × 90 s. Corta enseguida si la instancia desaparece de la lista o pasa a `apagado` tras
 * haberse visto `iniciando`.
 */
export function crearPreparadorInstancias(d: DepsPrepararInstancia): (id: string) => Promise<void> {
  const ahora = d.ahora ?? Date.now;
  const dormir = d.dormir ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const limite = d.limiteMs ?? LIMITE_MS;
  const recordado = new Map<string, Promise<void>>();

  const noEncendio = (id: string): ErrorWolf =>
    new ErrorWolf('servicios.no_encendio', 'La instancia no llegó a encenderse.', { nombre: id });

  const esperar = async (id: string): Promise<void> => {
    const inicial = await d.estadoDe(id);
    if (!inicial) throw new ErrorWolf('servicios.desconocido', 'La instancia no existe.', { id });
    if (inicial.estado === 'encendido') return;
    await d.iniciar(id);
    // `iniciar` vuelve con el proceso lanzado, antes de que la sonda lo dé por encendido: sin
    // esperar, la primera consulta de bases decía «encienda la instancia» (D39).
    const fin = ahora() + limite;
    let visto = inicial.estado === 'iniciando';
    let ultimoAviso = ahora();
    for (;;) {
      const actual = await d.estadoDe(id);
      if (actual?.estado === 'encendido') return;
      if (!actual || actual.estado === 'error') throw noEncendio(id);
      if (actual.estado === 'iniciando') visto = true;
      else if (visto) throw noEncendio(id); // pasó a apagado tras arrancar: no va a encender
      if (ahora() > fin) throw noEncendio(id);
      if (ahora() - ultimoAviso >= PROGRESO_MS) {
        ultimoAviso = ahora();
        d.progreso?.();
      }
      await dormir(SONDEO_MS);
    }
  };

  return (id) => {
    let p = recordado.get(id);
    if (!p) {
      p = esperar(id);
      recordado.set(id, p);
    }
    return p;
  };
}
