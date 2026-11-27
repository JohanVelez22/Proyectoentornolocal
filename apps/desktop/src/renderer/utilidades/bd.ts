import type {
  EstadoServicio,
  FormatoRespaldo,
  MotorBd,
  MotorSql,
  OpcionesRestaurar,
} from '../../shared/api';

/** Motores con pestaña en Bases de datos, en el orden en que se muestran. */
export const MOTORES: readonly MotorBd[] = ['mysql', 'mariadb', 'postgresql', 'mongodb'];

export function esMotorSql(m: MotorBd): m is MotorSql {
  return m !== 'mongodb';
}

/** Usuario administrador de cada motor (Adminer lo recibe; la clave nunca va en la URL). */
export const USUARIO_ADMIN: Record<MotorSql, string> = {
  mysql: 'root',
  mariadb: 'root',
  postgresql: 'postgres',
};

/** Puerto estándar: si otro programa (FlyEnv) lo ocupa, suele ser el servidor de origen. */
export const PUERTO_ESTANDAR: Record<MotorSql, number> = {
  mysql: 3306,
  mariadb: 3306,
  postgresql: 5432,
};

/**
 * Las mismas reglas que valida el núcleo (`NOMBRE_BD_MYSQL`, `NOMBRE_BD_PG`, `NOMBRE_BD_MONGO`).
 * Se copian para no cargar el núcleo (Node) en la ventana.
 */
export const REGLA_NOMBRE: Record<MotorBd, RegExp> = {
  mysql: /^[A-Za-z0-9_]{1,64}$/,
  mariadb: /^[A-Za-z0-9_]{1,64}$/,
  postgresql: /^[a-z_][a-z0-9_]{0,62}$/,
  mongodb: /^[A-Za-z0-9_-]{1,63}$/,
};

const LARGO_MAXIMO: Record<MotorBd, number> = {
  mysql: 64,
  mariadb: 64,
  postgresql: 63,
  mongodb: 63,
};

export type ProblemaNombre = 'vacio' | 'largo' | 'caracteres' | 'inicio';

/** null si el nombre sirve para ese motor; si no, el motivo (el texto está en es.ts). */
export function problemaNombre(motor: MotorBd, nombre: string): ProblemaNombre | null {
  if (!nombre) return 'vacio';
  if (REGLA_NOMBRE[motor].test(nombre)) return null;
  if (nombre.length > LARGO_MAXIMO[motor]) return 'largo';
  if (motor === 'postgresql' && /^[0-9]/.test(nombre) && /^[a-z0-9_]+$/.test(nombre)) {
    return 'inicio';
  }
  return 'caracteres';
}

/** Extensiones de respaldo que se quitan del nombre (también dobles: `.sql.gz`, `.tar.gz`). */
const EXTENSIONES = /(\.(sql|dump|backup|bak|pgdump|psql|gz|zip|rar|7z|tar|tgz|bz2|xz))+$/i;

/**
 * Nombre de base sugerido a partir del archivo de respaldo:
 * `C:\…\Backup-08-10-2026.sql` → `backup_08_10_2026`. Siempre cumple la regla del motor.
 */
export function nombreDesdeArchivo(ruta: string, motor: MotorBd): string {
  const archivo = ruta.split(/[\\/]/).pop() ?? '';
  let n = archivo
    .replace(EXTENSIONES, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!n) n = 'restaurada';
  if (motor === 'postgresql' && /^[0-9]/.test(n)) n = `bd_${n}`;
  return n.slice(0, LARGO_MAXIMO[motor]).replace(/_+$/, '') || 'restaurada';
}

/**
 * Opciones para restaurar o importar. Si la base destino ya tiene tablas, solo se sigue con la
 * confirmación explícita (el usuario escribió el nombre de la base); si no, devuelve null y la
 * interfaz debe pedirla. Sin tablas nunca se envía `confirmarSobrescribir`.
 */
export function opcionesRestaurar(
  tieneTablas: boolean,
  confirmado: boolean,
): OpcionesRestaurar | null {
  if (!tieneTablas) return {};
  return confirmado ? { confirmarSobrescribir: true } : null;
}

/** La confirmación escrita coincide exactamente con el nombre de la base. */
export function confirmacionValida(base: string, escrito: string): boolean {
  return base !== '' && escrito === base;
}

/** pg_dump personalizado solo se restaura en PostgreSQL (el resto lo decide el núcleo). */
export function formatoIncompatible(formato: FormatoRespaldo | null, motor: MotorSql): boolean {
  return formato === 'pgdump' && motor !== 'postgresql';
}

/** Tamaño legible (base 1024, coma decimal). */
export function formatearTamano(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < unidades.length - 1) {
    v /= 1024;
    i++;
  }
  const texto = i === 0 || v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace('.', ',');
  return `${texto} ${unidades[i]}`;
}

/** Carpeta de una ruta de Windows (para "Abrir carpeta" del respaldo previo). */
export function carpetaDe(ruta: string): string {
  const i = Math.max(ruta.lastIndexOf('\\'), ruta.lastIndexOf('/'));
  return i > 0 ? ruta.slice(0, i) : ruta;
}

/** Error de "falló después de reemplazar la base": el mensaje nombra la copia de seguridad. */
export function esErrorTrasReemplazo(e: unknown): boolean {
  return (e as { codigo?: unknown } | null)?.codigo === 'tras-reemplazo';
}

/** Ruta del respaldo previo dentro del mensaje de `ErrorTrasReemplazo`, si se puede leer. */
export function respaldoEnMensaje(mensaje: string): string | null {
  const m = /copia de seguridad está en (.+?)\. Puede restaurarla/.exec(mensaje);
  return m ? m[1]! : null;
}

export interface OrigenSugerido {
  host: string;
  puerto: number | null;
  usuario: string;
}

/**
 * Datos para "Importar desde otro servidor": 127.0.0.1 y el puerto del MySQL/PostgreSQL externo
 * (por ejemplo, el de FlyEnv) cuando se detecta. Se detecta si hay un servicio externo en el
 * puerto estándar, o si el propio usa otro puerto (el estándar suele estar ocupado por FlyEnv).
 */
export function origenSugerido(motor: MotorSql, estados: EstadoServicio[]): OrigenSugerido {
  const usuario = USUARIO_ADMIN[motor];
  const host = '127.0.0.1';
  const idExterno = motor === 'postgresql' ? 'postgresql' : 'mysql';
  const externo = estados.find((s) => s.id === idExterno && s.estado === 'externo');
  if (externo?.puertos[0]) return { host, puerto: externo.puertos[0], usuario };
  // MariaDB usa 3307 por diseño: que no esté en 3306 no indica que haya otro servidor.
  if (motor === 'mariadb') return { host, puerto: null, usuario };
  const propio = estados.find((s) => s.id === motor && s.estado !== 'externo');
  const estandar = PUERTO_ESTANDAR[motor];
  const ocupado = /lo usa .+ Use el puerto \d+/.test(propio?.mensaje ?? '');
  if (propio?.puertos[0] !== undefined && (propio.puertos[0] !== estandar || ocupado)) {
    return { host, puerto: estandar, usuario };
  }
  return { host, puerto: null, usuario };
}

/** Agrega líneas a un registro y conserva solo las últimas `limite`. */
export function recortarLineas<T>(lineas: T[], nuevas: T[], limite: number): T[] {
  const todas = lineas.concat(nuevas);
  return todas.length > limite ? todas.slice(todas.length - limite) : todas;
}
