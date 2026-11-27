/**
 * Ayudas de las tareas programadas (D29): atajos de horario que arman una expresión cron y
 * viceversa, y el paso entre el comando como lista de argumentos y el texto que escribe el usuario.
 * El núcleo valida todo (cron, comando y lista cerrada de programas); esto solo ayuda a escribirlo.
 */

export type PresetCron =
  | { tipo: 'cadaMinuto' }
  | { tipo: 'cadaN'; minutos: 5 | 10 | 15 | 30 }
  | { tipo: 'cadaHora' }
  | { tipo: 'diaria'; hora: number; minuto: number }
  | { tipo: 'laborables'; hora: number; minuto: number }
  | { tipo: 'personalizada'; expr: string };

export type TipoPreset = PresetCron['tipo'];

/** Qué hace el diálogo de una tarea: crearla, editarla, adoptar una de wolfcore.yml o confirmar una sin confirmar. */
export type ModoTarea = 'nueva' | 'editar' | 'adoptar' | 'confirmar';

export const TIPOS_PRESET: readonly TipoPreset[] = [
  'cadaMinuto',
  'cadaN',
  'cadaHora',
  'diaria',
  'laborables',
  'personalizada',
];

/** Expresión cron de un atajo. Una hora fuera de rango se acota. */
export function cronDePreset(p: PresetCron): string {
  const acotar = (n: number, max: number): number =>
    Number.isFinite(n) ? Math.min(max, Math.max(0, Math.trunc(n))) : 0;
  switch (p.tipo) {
    case 'cadaMinuto':
      return '* * * * *';
    case 'cadaN':
      return `*/${p.minutos} * * * *`;
    case 'cadaHora':
      return '0 * * * *';
    case 'diaria':
      return `${acotar(p.minuto, 59)} ${acotar(p.hora, 23)} * * *`;
    case 'laborables':
      return `${acotar(p.minuto, 59)} ${acotar(p.hora, 23)} * * 1-5`;
    case 'personalizada':
      return p.expr.trim();
  }
}

const ENTERO = /^\d{1,2}$/;

/** El atajo que produce esa expresión; si no es de ninguno, la expresión queda como personalizada. */
export function presetDeCron(expr: string): PresetCron {
  const e = expr.trim().replace(/\s+/g, ' ');
  if (e === '* * * * *') return { tipo: 'cadaMinuto' };
  if (e === '0 * * * *') return { tipo: 'cadaHora' };
  const cada = /^\*\/(5|10|15|30) \* \* \* \*$/.exec(e);
  if (cada) return { tipo: 'cadaN', minutos: Number(cada[1]) as 5 | 10 | 15 | 30 };
  const f = e.split(' ');
  if (f.length === 5 && ENTERO.test(f[0]!) && ENTERO.test(f[1]!) && f[2] === '*' && f[3] === '*') {
    const minuto = Number(f[0]);
    const hora = Number(f[1]);
    if (minuto <= 59 && hora <= 23) {
      if (f[4] === '*') return { tipo: 'diaria', hora, minuto };
      if (f[4] === '1-5') return { tipo: 'laborables', hora, minuto };
    }
  }
  return { tipo: 'personalizada', expr: e };
}

/** `03:05` de una hora y un minuto. */
export function textoHora(hora: number, minuto: number): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

/** `{hora, minuto}` de un texto `H:MM` o `HH:MM`; null si no es una hora. */
export function analizarHora(t: string): { hora: number; minuto: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const hora = Number(m[1]);
  const minuto = Number(m[2]);
  return hora <= 23 && minuto <= 59 ? { hora, minuto } : null;
}

/**
 * El comando como lo escribe el usuario: los argumentos con espacios o comillas van entre comillas
 * dobles (o simples si el argumento lleva dobles). Un argumento con las dos clases de comillas no
 * se puede escribir así: ver `comandoSeRepresenta`.
 */
export function comandoATexto(comando: readonly string[]): string {
  return comando
    .map((a) => {
      if (a !== '' && !/[\s"']/.test(a)) return a;
      if (!a.includes('"')) return `"${a}"`;
      if (!a.includes("'")) return `'${a}'`;
      return a;
    })
    .join(' ');
}

/** ¿El texto de `comandoATexto` vuelve a dar exactamente los mismos argumentos? */
export function comandoSeRepresenta(comando: readonly string[]): boolean {
  const v = textoAComando(comandoATexto(comando));
  return v !== null && v.length === comando.length && v.every((a, i) => a === comando[i]);
}

/**
 * Parte el texto en argumentos, como lo haría una lista (sin shell): separa por espacios y respeta
 * comillas dobles o simples para los argumentos con espacios. No hay escapes: la barra invertida
 * es un carácter más (rutas de Windows). null si una comilla queda sin cerrar.
 */
export function textoAComando(texto: string): string[] | null {
  const args: string[] = [];
  let actual = '';
  let hay = false;
  let comilla: '"' | "'" | null = null;
  for (const c of texto) {
    if (comilla) {
      if (c === comilla) comilla = null;
      else actual += c;
    } else if (c === '"' || c === "'") {
      comilla = c;
      hay = true;
    } else if (/\s/.test(c)) {
      if (hay || actual !== '') args.push(actual);
      actual = '';
      hay = false;
    } else {
      actual += c;
    }
  }
  if (comilla) return null;
  if (hay || actual !== '') args.push(actual);
  return args;
}

/** Clave de color de un estado de ejecución para la interfaz. */
export function tipoEstadoEjecucion(estado: string): 'success' | 'error' | 'warning' | 'default' {
  switch (estado) {
    case 'ok':
      return 'success';
    case 'fallo':
    case 'tiempo':
      return 'error';
    case 'bloqueada':
    case 'omitida':
    case 'cancelada':
      return 'warning';
    default:
      return 'default';
  }
}

/** Duración corta (`850 ms`, `12 s`, `3 min`). */
export function duracionCorta(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 90_000) return `${Math.round(ms / 1000)} s`;
  return `${Math.round(ms / 60_000)} min`;
}
