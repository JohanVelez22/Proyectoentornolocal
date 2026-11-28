import type { EstadoServicio, MuestraSistema, PuertoEnUso } from '../../shared/api';
import { formatearNumero, textos } from '../i18n';

/** Muestras en 5 minutos a una cada 3 s. */
export const MUESTRAS_VENTANA = 100;
/** RAM usada (fracción) a partir de la cual se avisa. */
export const UMBRAL_RAM_ALTA = 0.9;

/** Lo mínimo de `document` que necesita el muestreo (en las pruebas, uno falso). */
export interface DocumentoVisible {
  readonly hidden: boolean;
  addEventListener(tipo: 'visibilitychange', fn: () => void): void;
  removeEventListener(tipo: 'visibilitychange', fn: () => void): void;
}

export interface ControlMuestreo {
  /** Al entrar en la pantalla: muestrea si la ventana está visible. */
  entrar(): void;
  /** Al salir de la pantalla: pausa y deja de mirar la visibilidad. */
  salir(): void;
  readonly activo: boolean;
}

/**
 * Pide muestras solo mientras la pantalla está abierta y la ventana visible: al ocultarse pausa
 * y al volver reanuda. Las llamadas repetidas no se reenvían (solo los cambios).
 */
export function crearMuestreo(d: {
  iniciar: () => Promise<void>;
  pausar: () => Promise<void>;
  documento: DocumentoVisible;
  alError?: (e: unknown) => void;
}): ControlMuestreo {
  let enPantalla = false;
  let corriendo = false;
  const fallo = (e: unknown): void => d.alError?.(e);

  const aplicar = (): void => {
    const debe = enPantalla && !d.documento.hidden;
    if (debe === corriendo) return;
    corriendo = debe;
    void (debe ? d.iniciar() : d.pausar()).catch(fallo);
  };

  return {
    entrar() {
      if (enPantalla) return;
      enPantalla = true;
      d.documento.addEventListener('visibilitychange', aplicar);
      aplicar();
    },
    salir() {
      if (!enPantalla) return;
      enPantalla = false;
      d.documento.removeEventListener('visibilitychange', aplicar);
      aplicar();
    },
    get activo() {
      return corriendo;
    },
  };
}

/** Agrega una muestra a la serie y deja solo las de la ventana de 5 minutos. */
export function agregarMuestra(
  serie: readonly MuestraSistema[],
  m: MuestraSistema,
  max = MUESTRAS_VENTANA,
): MuestraSistema[] {
  if (serie.length && serie[serie.length - 1]!.marca >= m.marca) return [...serie];
  const nueva = [...serie, m];
  return nueva.length > max ? nueva.slice(nueva.length - max) : nueva;
}

/**
 * Trazo SVG de una serie en un lienzo `ancho`×`alto`. La serie se alinea a la derecha sobre
 * `ranuras` posiciones (las que faltan quedan vacías a la izquierda). Devuelve la línea y el área.
 */
export function trazoSerie(
  valores: readonly number[],
  opciones: { ancho: number; alto: number; max: number; ranuras?: number },
): { linea: string; area: string } {
  const { ancho, alto } = opciones;
  const ranuras = Math.max(2, opciones.ranuras ?? MUESTRAS_VENTANA);
  const max = opciones.max > 0 ? opciones.max : 1;
  const vals = valores.slice(-ranuras);
  if (!vals.length) return { linea: '', area: '' };
  const paso = ancho / (ranuras - 1);
  const desde = ranuras - vals.length;
  const r = (n: number): number => Math.round(n * 100) / 100;
  const puntos = vals.map((v, i) => {
    const x = r((desde + i) * paso);
    const acotado = Math.min(max, Math.max(0, Number.isFinite(v) ? v : 0));
    const y = r(alto - (acotado / max) * alto);
    return [x, y] as const;
  });
  if (puntos.length === 1) puntos.unshift([r(Math.max(0, puntos[0]![0] - paso)), puntos[0]![1]]);
  const linea = puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const area = `${linea} L${puntos[puntos.length - 1]![0]} ${alto} L${puntos[0]![0]} ${alto} Z`;
  return { linea, area };
}

export function formatoBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  const unidades = textos.unidades.bytes;
  let v = n;
  let u = 0;
  while (v >= 1024 && u < unidades.length - 1) {
    v /= 1024;
    u++;
  }
  const dec = u === 0 || v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${formatearNumero(v, { maximumFractionDigits: dec, minimumFractionDigits: 0 })} ${unidades[u]}`;
}

export function formatoBps(n: number): string {
  return `${formatoBytes(n)}${textos.unidades.porSegundo}`;
}

export function formatoPorcentaje(n: number): string {
  if (!Number.isFinite(n)) return '—';
  // Intl con `style: 'percent'` pone el signo y el espacio como los usa cada idioma
  // («41%» en inglés, «41 %» en español y alemán, «%41» en turco).
  return formatearNumero(n / 100, {
    style: 'percent',
    maximumFractionDigits: n < 10 ? 1 : 0,
  });
}

/** Tiempo encendido: "45 s", "12 min", "3 h 5 min", "2 d 4 h". */
export function formatoDuracion(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '—';
  const s = Math.floor(segundos);
  const u = textos.unidades;
  if (s < 60) return `${s} ${u.segundos}`;
  const min = Math.floor(s / 60);
  if (min < 60) return `${min} ${u.minutos}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ${u.horas} ${min % 60} ${u.minutos}`;
  return `${Math.floor(h / 24)} ${u.dias} ${h % 24} ${u.horas}`;
}

/** Servicio al que pertenece un proceso del supervisor ('php-8.4-0' → 'php-8.4'). */
export function servicioDeProceso(idSupervisor: string): string {
  const php = /^(php-\d+\.\d+)-\d+$/.exec(idSupervisor);
  return php ? php[1]! : idSupervisor;
}

export type TipoAlerta = 'conflicto' | 'ramAlta' | 'huerfano';

export interface AlertaPanel {
  clave: string;
  tipo: TipoAlerta;
  texto: string;
  /** Proceso ajeno que se puede finalizar (con confirmación). */
  proceso?: { pid: number; nombre: string; creado: string | null };
}

const ta = textos.panel.alertas;
const esPhpCgi = (nombre: string): boolean => /^php-cgi(\.exe)?$/i.test(nombre);

/**
 * Alertas del panel:
 * - un puerto de un servicio que no está encendido lo usa un programa ajeno;
 * - la RAM del equipo pasa del umbral;
 * - php-cgi que no es de WolfCore Dev escucha en un puerto (huérfano de una sesión anterior).
 */
export function calcularAlertas(d: {
  muestra: MuestraSistema | null;
  puertos: readonly PuertoEnUso[];
  servicios: readonly Pick<EstadoServicio, 'id' | 'nombre' | 'estado' | 'puertos'>[];
}): AlertaPanel[] {
  const alertas: AlertaPanel[] = [];
  const vistos = new Set<number>();
  const ajenoEn = new Map<number, PuertoEnUso>();
  for (const p of d.puertos) if (!p.propio && !ajenoEn.has(p.puerto)) ajenoEn.set(p.puerto, p);

  for (const s of d.servicios) {
    if (s.estado === 'encendido' || s.estado === 'externo') continue;
    for (const puerto of s.puertos) {
      const ajeno = ajenoEn.get(puerto);
      if (!ajeno || esPhpCgi(ajeno.nombre)) continue;
      vistos.add(ajeno.pid);
      alertas.push({
        clave: `conflicto-${s.id}-${puerto}`,
        tipo: 'conflicto',
        texto: ta.conflicto(s.nombre, puerto, ajeno.nombre, ajeno.pid),
        proceso: { pid: ajeno.pid, nombre: ajeno.nombre, creado: ajeno.creado },
      });
    }
  }

  const m = d.muestra;
  if (m && m.ramTotal > 0 && m.ramUsada / m.ramTotal >= UMBRAL_RAM_ALTA) {
    alertas.push({
      clave: 'ram-alta',
      tipo: 'ramAlta',
      texto: ta.ramAlta(Math.round((m.ramUsada / m.ramTotal) * 100)),
    });
  }

  const huerfanos = new Map<number, PuertoEnUso[]>();
  for (const p of d.puertos) {
    if (p.propio || !esPhpCgi(p.nombre) || vistos.has(p.pid)) continue;
    huerfanos.set(p.pid, [...(huerfanos.get(p.pid) ?? []), p]);
  }
  for (const [pid, ps] of huerfanos) {
    const p = ps[0]!;
    alertas.push({
      clave: `huerfano-${pid}`,
      tipo: 'huerfano',
      texto: ta.huerfano(
        pid,
        ps.map((x) => x.puerto),
      ),
      proceso: { pid, nombre: p.nombre, creado: p.creado },
    });
  }
  return alertas;
}
