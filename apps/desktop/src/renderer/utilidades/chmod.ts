/**
 * Calculadora de permisos de `chmod` (D55): lógica pura, sin ejecutar nada. Convierte entre las
 * casillas r/w/x de propietario, grupo y otros, el octal (755, o 4755 con bits especiales) y el
 * simbólico de `ls -l` (rwxr-xr-x). Solo sirve para servidores Linux y macOS: en Windows no aplica.
 */

export type Clase = 'propietario' | 'grupo' | 'otros';
export type Bit = 'r' | 'w' | 'x';
export type Especial = 'setuid' | 'setgid' | 'sticky';

export interface TernaPermisos {
  r: boolean;
  w: boolean;
  x: boolean;
}

export interface PermisosChmod {
  propietario: TernaPermisos;
  grupo: TernaPermisos;
  otros: TernaPermisos;
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
}

const CLASES: readonly Clase[] = ['propietario', 'grupo', 'otros'];

const terna = (r = false, w = false, x = false): TernaPermisos => ({ r, w, x });

export const permisosVacios = (): PermisosChmod => ({
  propietario: terna(),
  grupo: terna(),
  otros: terna(),
  setuid: false,
  setgid: false,
  sticky: false,
});

const ternaDeDigito = (d: number): TernaPermisos =>
  terna((d & 4) !== 0, (d & 2) !== 0, (d & 1) !== 0);
const digitoDeTerna = (t: TernaPermisos): number => (t.r ? 4 : 0) + (t.w ? 2 : 0) + (t.x ? 1 : 0);

/** `755`, `0644` o `4755`; null si no es octal de 3 o 4 dígitos (0-7). */
export function desdeOctal(texto: string): PermisosChmod | null {
  const t = texto.trim();
  if (!/^[0-7]{3,4}$/.test(t)) return null;
  const d = t.padStart(4, '0');
  const especial = Number(d[0]);
  return {
    propietario: ternaDeDigito(Number(d[1])),
    grupo: ternaDeDigito(Number(d[2])),
    otros: ternaDeDigito(Number(d[3])),
    setuid: (especial & 4) !== 0,
    setgid: (especial & 2) !== 0,
    sticky: (especial & 1) !== 0,
  };
}

/** Octal de 3 dígitos; con algún bit especial, de 4 (`4755`). */
export function aOctal(p: PermisosChmod): string {
  const especial = (p.setuid ? 4 : 0) + (p.setgid ? 2 : 0) + (p.sticky ? 1 : 0);
  const base = `${digitoDeTerna(p.propietario)}${digitoDeTerna(p.grupo)}${digitoDeTerna(p.otros)}`;
  return especial ? `${especial}${base}` : base;
}

/** `rwxr-xr-x`; setuid/setgid como `s` (o `S` sin ejecución) y sticky como `t` (o `T`). */
export function aSimbolico(p: PermisosChmod): string {
  const parte = (t: TernaPermisos, especial: boolean, letra: 's' | 't'): string => {
    const x = t.x ? (especial ? letra : 'x') : especial ? letra.toUpperCase() : '-';
    return `${t.r ? 'r' : '-'}${t.w ? 'w' : '-'}${x}`;
  };
  return (
    parte(p.propietario, p.setuid, 's') +
    parte(p.grupo, p.setgid, 's') +
    parte(p.otros, p.sticky, 't')
  );
}

/**
 * Lee `rwxr-xr-x` (9 caracteres) o la forma de `ls -l` con el tipo delante (`-rw-r--r--`,
 * `drwxr-xr-x`). Null si no es válida.
 */
export function desdeSimbolico(texto: string): PermisosChmod | null {
  let t = texto.trim();
  if (t.length === 10 && /^[-dlbcps]/.test(t)) t = t.slice(1);
  if (!/^([r-][w-][xsS-])([r-][w-][xsS-])([r-][w-][xtT-])$/.test(t)) return null;
  const leer = (s: string): { t: TernaPermisos; especial: boolean } => {
    const c = s[2]!;
    return {
      t: terna(s[0] === 'r', s[1] === 'w', c === 'x' || c === 's' || c === 't'),
      especial: c === 's' || c === 'S' || c === 't' || c === 'T',
    };
  };
  const u = leer(t.slice(0, 3));
  const g = leer(t.slice(3, 6));
  const o = leer(t.slice(6, 9));
  return {
    propietario: u.t,
    grupo: g.t,
    otros: o.t,
    setuid: u.especial,
    setgid: g.especial,
    sticky: o.especial,
  };
}

/** Copia con una casilla cambiada (no muta el original). */
export function alternarPermiso(p: PermisosChmod, clase: Clase, bit: Bit): PermisosChmod;
export function alternarPermiso(p: PermisosChmod, clase: 'especial', bit: Especial): PermisosChmod;
export function alternarPermiso(
  p: PermisosChmod,
  clase: Clase | 'especial',
  bit: Bit | Especial,
): PermisosChmod {
  const copia: PermisosChmod = {
    ...p,
    propietario: { ...p.propietario },
    grupo: { ...p.grupo },
    otros: { ...p.otros },
  };
  if (clase === 'especial') {
    const b = bit as Especial;
    copia[b] = !copia[b];
  } else if (CLASES.includes(clase)) {
    const b = bit as Bit;
    copia[clase][b] = !copia[clase][b];
  }
  return copia;
}

/** Ejemplo para copiar: `chmod 755 archivo`. El nombre se cita si lleva algo que el intérprete lea. */
export function comandoChmod(p: PermisosChmod, archivo = 'archivo'): string {
  const nombre = archivo.trim() || 'archivo';
  const seguro = /^[A-Za-z0-9._/@%+=:,-]+$/.test(nombre)
    ? nombre
    : `'${nombre.replace(/'/g, `'\\''`)}'`;
  return `chmod ${aOctal(p)} ${seguro}`;
}
