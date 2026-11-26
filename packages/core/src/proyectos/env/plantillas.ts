import type { TipoSitio } from '../../tipos';

export type BloqueEnv = 'bd' | 'correo' | 'ia' | 'redis' | 'meilisearch';
export const BLOQUES_ENV: readonly BloqueEnv[] = ['bd', 'correo', 'ia', 'redis', 'meilisearch'];

/**
 * Lo que saben las plantillas del proyecto y del equipo. Solo el bloque de Meilisearch lleva un
 * secreto (su master key): lo pone el núcleo, nunca el renderer, y la vista previa lo enmascara.
 */
export interface ContextoPlantillaEnv {
  tipo: TipoSitio;
  /** Base del `.env` actual (sin clave) o, si no hay, valores por defecto. */
  base: {
    motor: 'mysql' | 'mariadb' | 'postgresql';
    nombre: string;
    usuario: string;
    puerto: number;
  } | null;
  /** Puerto SMTP del captador de correo elegido (D21). */
  correo: number | null;
  redis: number | null;
  /** Puerto y master key de Meilisearch (null si no está instalado). */
  meilisearch?: { puerto: number; clave: string } | null;
}

/**
 * Bloques de variables listos para agregar al `.env`. No traen claves: las contraseñas y tokens
 * quedan vacíos para que el usuario las escriba (o las ponga "Usar usuario propio"). La única
 * excepción es `meilisearch`, cuya master key es de este equipo y llega enmascarada en la vista previa.
 */
export const PLANTILLAS_ENV: Record<
  BloqueEnv,
  (c: ContextoPlantillaEnv) => Record<string, string>
> = {
  bd: (c) => {
    const motor = c.base?.motor ?? 'mysql';
    return {
      DB_CONNECTION: motor === 'postgresql' ? 'pgsql' : motor,
      DB_HOST: '127.0.0.1',
      DB_PORT: String(c.base?.puerto ?? (motor === 'postgresql' ? 5432 : 3306)),
      DB_DATABASE: c.base?.nombre ?? 'mi_base',
      DB_USERNAME: c.base?.usuario ?? '',
      DB_PASSWORD: '',
    };
  },
  correo: (c) => ({
    MAIL_MAILER: 'smtp',
    MAIL_HOST: '127.0.0.1',
    MAIL_PORT: String(c.correo ?? 1025),
    MAIL_USERNAME: '',
    MAIL_PASSWORD: '',
    MAIL_FROM_ADDRESS: 'hola@ejemplo.test',
  }),
  ia: () => ({
    OPENAI_API_KEY: '',
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    AI_MODEL: '',
  }),
  redis: (c) => ({
    REDIS_CLIENT: 'phpredis',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: String(c.redis ?? 6379),
    REDIS_PASSWORD: 'null',
  }),
  meilisearch: (c) => ({
    SCOUT_DRIVER: 'meilisearch',
    MEILISEARCH_HOST: `http://127.0.0.1:${c.meilisearch?.puerto ?? 7700}`,
    MEILISEARCH_KEY: c.meilisearch?.clave ?? '',
  }),
};
