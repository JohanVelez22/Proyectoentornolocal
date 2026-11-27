import { ErrorWolf } from '../errores';

/**
 * Intérprete cron propio y pequeño (D29): 5 campos (minuto, hora, día del mes, mes, día de la
 * semana) con `*`, listas, rangos, pasos (asterisco con barra y paso, o rango con barra y paso) y nombres de mes y día en inglés. No hay
 * segundos: el intervalo mínimo es de un minuto. Sin expresiones regulares con repeticiones
 * anidadas: se parte el texto por separadores y cada trozo se comprueba con comparaciones simples,
 * así que ninguna entrada puede colgar el intérprete (sin ReDoS), y el tamaño se acota antes de
 * mirar nada.
 */

/** Largo máximo de la expresión y de elementos de una lista (acota el trabajo de `interpretarCron`). */
export const MAX_CARACTERES_CRON = 100;
const MAX_ELEMENTOS_CAMPO = 80;

const MESES = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;
const DIAS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export interface Cron {
  /** Expresión normalizada (campos separados por un espacio). */
  expresion: string;
  minutos: ReadonlySet<number>;
  horas: ReadonlySet<number>;
  diasMes: ReadonlySet<number>;
  meses: ReadonlySet<number>;
  /** 0 = domingo … 6 = sábado (el 7 se toma como 0). */
  diasSemana: ReadonlySet<number>;
  /** El campo empieza por `*`: no restringe (o restringe con un paso). */
  horaComodin: boolean;
  diaMesComodin: boolean;
  diaSemanaComodin: boolean;
}

const invalida = (detalle: string): ErrorWolf =>
  new ErrorWolf('tareas.cron_invalida', `La expresión cron no es válida: ${detalle}`, { detalle });

interface Campo {
  nombre: string;
  min: number;
  max: number;
  nombres?: readonly string[];
  /** Valor del primer nombre (enero = 1, domingo = 0). */
  baseNombres?: number;
}

const CAMPOS: readonly Campo[] = [
  { nombre: 'minuto', min: 0, max: 59 },
  { nombre: 'hora', min: 0, max: 23 },
  { nombre: 'día del mes', min: 1, max: 31 },
  { nombre: 'mes', min: 1, max: 12, nombres: MESES, baseNombres: 1 },
  { nombre: 'día de la semana', min: 0, max: 7, nombres: DIAS, baseNombres: 0 },
];

const esDigitos = (t: string): boolean => {
  if (t.length === 0 || t.length > 3) return false;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
};

function valor(t: string, c: Campo): number {
  let n: number;
  if (esDigitos(t)) n = Number(t);
  else if (c.nombres && t.length === 3) {
    const i = c.nombres.indexOf(t.toLowerCase());
    if (i < 0) throw invalida(`${c.nombre}: "${t.slice(0, 20)}"`);
    n = i + (c.baseNombres ?? 0);
  } else throw invalida(`${c.nombre}: "${t.slice(0, 20)}"`);
  if (n < c.min || n > c.max) throw invalida(`${c.nombre} fuera de rango (${c.min}-${c.max})`);
  return n;
}

function campo(texto: string, c: Campo): Set<number> {
  const res = new Set<number>();
  const elementos = texto.split(',');
  if (elementos.length > MAX_ELEMENTOS_CAMPO) throw invalida(`${c.nombre}: demasiados elementos`);
  for (const el of elementos) {
    if (el === '') throw invalida(`${c.nombre}: elemento vacío`);
    const partes = el.split('/');
    if (partes.length > 2) throw invalida(`${c.nombre}: paso no válido`);
    const rango = partes[0]!;
    let paso = 1;
    if (partes.length === 2) {
      if (!esDigitos(partes[1]!)) throw invalida(`${c.nombre}: paso no válido`);
      paso = Number(partes[1]);
      if (paso < 1) throw invalida(`${c.nombre}: el paso debe ser 1 o más`);
    }
    let desde: number;
    let hasta: number;
    if (rango === '*') {
      desde = c.min;
      hasta = c.nombre === 'día de la semana' ? 6 : c.max;
    } else {
      const extremos = rango.split('-');
      if (extremos.length > 2) throw invalida(`${c.nombre}: rango no válido`);
      desde = valor(extremos[0]!, c);
      if (extremos.length === 2) {
        hasta = valor(extremos[1]!, c);
        if (hasta < desde) throw invalida(`${c.nombre}: rango al revés`);
      } else {
        // "5" es el valor solo; "5/10" no existe (ambiguo entre cron y Vixie).
        if (partes.length === 2) throw invalida(`${c.nombre}: use un rango con el paso (a-b/n)`);
        hasta = desde;
      }
    }
    for (let v = desde; v <= hasta; v += paso)
      res.add(c.nombre === 'día de la semana' && v === 7 ? 0 : v);
  }
  if (res.size === 0) throw invalida(`${c.nombre}: sin valores`);
  return res;
}

/** Días que tiene cada mes en el mejor caso (febrero = 29: año bisiesto). */
const DIAS_MAXIMOS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Analiza la expresión. Lanza `ErrorWolf` `tareas.cron_invalida` si no es de 5 campos, si algo
 * está fuera de rango o si nunca ocurriría (30 de febrero).
 */
export function interpretarCron(expr: string): Cron {
  if (typeof expr !== 'string') throw invalida('debe ser texto');
  if (expr.length > MAX_CARACTERES_CRON) {
    throw invalida(`más de ${MAX_CARACTERES_CRON} caracteres`);
  }
  // Solo espacios y tabuladores como separador: un salto de línea no es un campo.
  const campos = expr.split(/[ \t]+/).filter((t) => t !== '');
  if (campos.length !== 5) throw invalida('debe tener 5 campos (minuto hora día mes día-semana)');
  const [mi, ho, dm, me, ds] = campos as [string, string, string, string, string];
  const c: Cron = {
    expresion: campos.join(' '),
    minutos: campo(mi, CAMPOS[0]!),
    horas: campo(ho, CAMPOS[1]!),
    diasMes: campo(dm, CAMPOS[2]!),
    meses: campo(me, CAMPOS[3]!),
    diasSemana: campo(ds, CAMPOS[4]!),
    horaComodin: ho.startsWith('*'),
    diaMesComodin: dm.startsWith('*'),
    diaSemanaComodin: ds.startsWith('*'),
  };
  // Día del mes fijo y día de la semana libre: debe existir algún mes con ese día (no 30 de feb).
  if (!c.diaMesComodin && c.diaSemanaComodin) {
    const posible = [...c.meses].some((m) => [...c.diasMes].some((d) => d <= DIAS_MAXIMOS[m - 1]!));
    if (!posible) throw invalida('ese día no existe en ese mes');
  }
  return c;
}

/* ───────────── Cálculo del próximo instante (con zona horaria) ───────────── */

interface Pared {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  /** 0 = domingo. */
  dow: number;
}

const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateador(zona: string): Intl.DateTimeFormat {
  let f = formateadores.get(zona);
  if (f) return f;
  try {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    });
  } catch {
    // Zona que no existe: UTC (nunca debe romper el planificador).
    f = formateadores.get('UTC') ?? formateador('UTC');
  }
  formateadores.set(zona, f);
  return f;
}

function pared(t: number, zona: string): Pared {
  const r: Pared = { y: 0, mo: 0, d: 0, h: 0, mi: 0, dow: 0 };
  for (const p of formateador(zona).formatToParts(t)) {
    switch (p.type) {
      case 'year':
        r.y = Number(p.value);
        break;
      case 'month':
        r.mo = Number(p.value);
        break;
      case 'day':
        r.d = Number(p.value);
        break;
      case 'hour':
        r.h = Number(p.value) % 24;
        break;
      case 'minute':
        r.mi = Number(p.value);
        break;
      case 'weekday':
        r.dow = DOW[p.value] ?? 0;
        break;
    }
  }
  return r;
}

const comoUtc = (p: Pick<Pared, 'y' | 'mo' | 'd' | 'h' | 'mi'>): number =>
  Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);

const compensacion = (t: number, zona: string): number => comoUtc(pared(t, zona)) - t;

/**
 * Primer instante cuya hora de pared es la pedida (los componentes pueden desbordarse: mes 13,
 * día 32…). Si esa hora no existe (salto de verano), el primer instante después del salto. Si se
 * repite (cambio de otoño), el primero de los dos.
 */
function instanteDePared(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  zona: string,
): number {
  const adivinado = Date.UTC(y, mo - 1, d, h, mi);
  const antes = compensacion(adivinado - 86_400_000, zona);
  const despues = compensacion(adivinado + 86_400_000, zona);
  const validos: number[] = [];
  for (const off of new Set([antes, despues])) {
    const t = adivinado - off;
    if (compensacion(t, zona) === off) validos.push(t);
  }
  if (validos.length > 0) return Math.min(...validos);
  // Hora inexistente: primer instante con la compensación nueva (búsqueda binaria por minuto).
  let lo = adivinado - Math.max(antes, despues);
  let hi = adivinado - Math.min(antes, despues);
  if (lo > hi) [lo, hi] = [hi, lo];
  const nueva = Math.max(antes, despues);
  while (hi - lo > 60_000) {
    const medio = Math.floor((lo + hi) / 2 / 60_000) * 60_000;
    if (compensacion(medio, zona) === nueva) hi = medio;
    else lo = medio;
  }
  return hi;
}

function diaCoincide(c: Cron, p: Pared): boolean {
  const dm = c.diasMes.has(p.d);
  const ds = c.diasSemana.has(p.dow);
  // Los dos restringidos: vale cualquiera de los dos (como cron de Vixie).
  if (!c.diaMesComodin && !c.diaSemanaComodin) return dm || ds;
  return dm && ds;
}

const MAX_ANIOS = 10;
const MAX_VUELTAS = 200_000;

/** Zona horaria del sistema (la de la app: los usuarios escriben horas locales). */
export const zonaLocal = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Próximo instante, estrictamente posterior a `desde`, en que la expresión se cumple en la hora
 * de pared de `zona` (por omisión la del sistema). Una hora que no existe ese día (salto de
 * verano) se salta; una que se repite (cambio de otoño) cuenta la primera vez, salvo que la hora
 * sea `*`, en cuyo caso cada instante cuenta. Lanza `tareas.cron_invalida` si no hay ninguno en
 * 10 años.
 */
export function siguiente(c: Cron, desde: Date, zona: string = zonaLocal()): Date {
  let t = Math.floor(desde.getTime() / 60_000) * 60_000 + 60_000;
  const limite = t + MAX_ANIOS * 366 * 86_400_000;
  // Salta a un instante posterior de la hora de pared pedida (nunca hacia atrás).
  const saltar = (y: number, mo: number, d: number, h: number, mi: number): number =>
    Math.max(t + 60_000, instanteDePared(y, mo, d, h, mi, zona));
  for (let i = 0; i < MAX_VUELTAS && t <= limite; i++) {
    const p = pared(t, zona);
    if (!c.meses.has(p.mo)) {
      t = saltar(p.y, p.mo + 1, 1, 0, 0);
    } else if (!diaCoincide(c, p)) {
      t = saltar(p.y, p.mo, p.d + 1, 0, 0);
    } else if (!c.horas.has(p.h)) {
      t = c.horaComodin ? t + 60_000 : saltar(p.y, p.mo, p.d, p.h + 1, 0);
    } else if (!c.minutos.has(p.mi)) {
      const m = [...c.minutos].filter((x) => x > p.mi).sort((a, b) => a - b)[0];
      t = c.horaComodin
        ? t + 60_000
        : m === undefined
          ? saltar(p.y, p.mo, p.d, p.h + 1, 0)
          : saltar(p.y, p.mo, p.d, p.h, m);
    } else if (!c.horaComodin && instanteDePared(p.y, p.mo, p.d, p.h, p.mi, zona) < t) {
      // Segunda vuelta de una hora repetida: una hora fija corre solo la primera.
      t += 60_000;
    } else {
      return new Date(t);
    }
  }
  throw invalida('no se cumple en los próximos 10 años');
}
