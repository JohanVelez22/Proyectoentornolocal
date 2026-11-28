import { ErrorWolf } from '../errores';

/**
 * pgvector en varias bases de PostgreSQL (D54b). La extensión es por base: cada base tiene las
 * suyas. Este módulo solo orquesta; las sentencias SQL las ejecuta `ClientePostgres` (que cita los
 * identificadores y nunca interpola un nombre de base). Se prueba con un puerto falso.
 */
export interface PuertoVector {
  /** Bases del usuario (sin `postgres` ni plantillas). */
  listarBases(): Promise<string[]>;
  /** ¿El servidor trae la extensión (pgvector compilada e instalada)? */
  servidorTieneVector(): Promise<boolean>;
  /** ¿La extensión está creada en esa base (también `template1`)? */
  vectorActivo(base: string): Promise<boolean>;
  activar(base: string): Promise<void>;
  /** `DROP EXTENSION` sin CASCADE: si hay columnas que la usan, falla y no se borra nada. */
  quitar(base: string): Promise<void>;
  /** ¿Es la base de un sitio con `datosReales`? (ante la duda, true). */
  esDatosReales(base: string): Promise<boolean>;
}

export type MotivoVector =
  'sin-pgvector' | 'no-existe' | 'permiso' | 'conexion' | 'en-uso' | 'otro';

export interface ResultadoBaseVector {
  base: string;
  estado: 'activada' | 'quitada' | 'ya-estaba' | 'error' | 'requiere-aviso';
  motivo?: MotivoVector;
}

export interface EstadoVectorBases {
  servidorTiene: boolean;
  bases: { base: string; activo: boolean; datosReales: boolean }[];
  /** La extensión está en `template1`: las bases nuevas nacen con ella. */
  plantilla: boolean;
}

const TOPE_BASES = 200;

/** Clasifica un error de `ClientePostgres` (sus mensajes ya vienen sin SQL ni claves). */
export function motivoDeError(e: unknown): MotivoVector {
  const m = e instanceof Error ? e.message : '';
  if (/pgvector no está instalado/.test(m)) return 'sin-pgvector';
  if (/\(3D000\)/.test(m)) return 'no-existe';
  if (/\((42501|28000|28P01)\)/.test(m)) return 'permiso';
  if (/\(55006\)/.test(m)) return 'en-uso';
  if (/\((08\w+|ECONNREFUSED|ECONNRESET)\)/.test(m)) return 'conexion';
  return 'otro';
}

function exigirConfirmado(confirmado: unknown): void {
  if (confirmado !== true) {
    throw new ErrorWolf(
      'bd.vector_confirmacion',
      'Confirme la operación para continuar: pgvector se activa o se quita en cada base.',
    );
  }
}

async function exigirServidor(p: PuertoVector): Promise<void> {
  if (!(await p.servidorTieneVector())) {
    throw new ErrorWolf(
      'bd.vector_no_instalado',
      'pgvector no está instalado: use "Instalar pgvector" en Bases de datos.',
    );
  }
}

/** Qué bases tienen ya la extensión, cuáles son de datos reales y si `template1` la lleva. */
export async function estadoVectorBases(p: PuertoVector): Promise<EstadoVectorBases> {
  const servidorTiene = await p.servidorTieneVector();
  const nombres = (await p.listarBases()).slice(0, TOPE_BASES);
  const bases: EstadoVectorBases['bases'] = [];
  for (const base of nombres) {
    const activo = await p.vectorActivo(base).catch(() => false);
    const datosReales = await p.esDatosReales(base).catch(() => true);
    bases.push({ base, activo, datosReales });
  }
  const plantilla = servidorTiene ? await p.vectorActivo('template1').catch(() => false) : false;
  return { servidorTiene, bases, plantilla };
}

/**
 * `CREATE EXTENSION IF NOT EXISTS vector` en cada base elegida. Un informe por base: una que
 * falle no detiene a las demás. Las de datos reales no se tocan sin su aviso adicional
 * (`datosRealesConfirmadas` lista las que el usuario aceptó expresamente).
 */
export async function activarVectorEnBases(
  p: PuertoVector,
  o: { bases: readonly string[]; confirmado: boolean; datosRealesConfirmadas?: readonly string[] },
): Promise<ResultadoBaseVector[]> {
  exigirConfirmado(o.confirmado);
  const pedidas = [...new Set(o.bases)];
  if (pedidas.length === 0) throw new Error('Elija al menos una base.');
  if (pedidas.length > TOPE_BASES) throw new Error('Demasiadas bases en una sola operación.');
  await exigirServidor(p);
  const existentes = new Set(await p.listarBases());
  const aceptadas = new Set(o.datosRealesConfirmadas ?? []);
  const informe: ResultadoBaseVector[] = [];
  for (const base of pedidas) {
    // Solo bases del catálogo: nunca plantillas ni nombres inventados.
    if (!existentes.has(base)) {
      informe.push({ base, estado: 'error', motivo: 'no-existe' });
      continue;
    }
    try {
      if (!aceptadas.has(base) && (await p.esDatosReales(base).catch(() => true))) {
        informe.push({ base, estado: 'requiere-aviso' });
        continue;
      }
      if (await p.vectorActivo(base)) {
        informe.push({ base, estado: 'ya-estaba' });
        continue;
      }
      await p.activar(base);
      informe.push({ base, estado: 'activada' });
    } catch (e) {
      informe.push({ base, estado: 'error', motivo: motivoDeError(e) });
    }
  }
  return informe;
}

/** Crea la extensión en `template1`: las bases que se creen después la tendrán; las demás no cambian. */
export async function activarVectorEnPlantilla(
  p: PuertoVector,
  o: { confirmado: boolean },
): Promise<ResultadoBaseVector> {
  exigirConfirmado(o.confirmado);
  await exigirServidor(p);
  try {
    if (await p.vectorActivo('template1')) return { base: 'template1', estado: 'ya-estaba' };
    await p.activar('template1');
    return { base: 'template1', estado: 'activada' };
  } catch (e) {
    return { base: 'template1', estado: 'error', motivo: motivoDeError(e) };
  }
}

/** Quita la extensión de `template1` (las bases ya creadas no cambian). */
export async function quitarVectorDePlantilla(
  p: PuertoVector,
  o: { confirmado: boolean },
): Promise<ResultadoBaseVector> {
  exigirConfirmado(o.confirmado);
  try {
    if (!(await p.vectorActivo('template1'))) return { base: 'template1', estado: 'ya-estaba' };
    await p.quitar('template1');
    return { base: 'template1', estado: 'quitada' };
  } catch (e) {
    return { base: 'template1', estado: 'error', motivo: motivoDeError(e) };
  }
}
