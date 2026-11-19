/**
 * "Entorno del sistema" de Herramientas: PATH, versiones de las herramientas que maneja WolfCore
 * Dev y variables de entorno con los valores secretos enmascarados (nunca salen a la interfaz).
 */

export interface VersionHerramienta {
  nombre: string;
  /** Vacío si no está instalada. */
  versiones: string[];
  /** No respondió a tiempo o falló al consultar. */
  sinRespuesta?: boolean;
}

export interface VariableEntorno {
  nombre: string;
  valor: string;
  enmascarada: boolean;
}

export interface EntornoSistema {
  /** Carpetas del PATH, en orden y sin vacías. */
  path: string[];
  herramientas: VersionHerramienta[];
  variables: VariableEntorno[];
}

export interface ConsultaHerramienta {
  nombre: string;
  leer: () => Promise<string[]>;
}

export const MASCARA = '••••••••';
/** Tope por valor: algunas variables (p. ej. PSModulePath) son muy largas. */
export const MAX_VALOR_VARIABLE = 4000;
export const PLAZO_VERSION_MS = 5000;

const SECRETO = /TOKEN|KEY|SECRET|PASSWORD|PASS|PWD|CREDENTIAL|AUTH|COOKIE|SESSION|PRIVATE/i;

/** El nombre parece de un secreto (token, clave, contraseña, sesión…). */
export function esNombreSecreto(nombre: string): boolean {
  return SECRETO.test(nombre);
}

/** La clave de PATH tal como viene (en Windows suele ser `Path`). */
function clavePath(env: Record<string, string | undefined>): string | undefined {
  return Object.keys(env).find((k) => k.toUpperCase() === 'PATH');
}

export function carpetasPath(env: Record<string, string | undefined>, separador = ';'): string[] {
  const clave = clavePath(env);
  const valor = clave ? (env[clave] ?? '') : '';
  return valor
    .split(separador)
    .map((d) => d.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

export function variablesEnmascaradas(env: Record<string, string | undefined>): VariableEntorno[] {
  return Object.entries(env)
    .filter((e): e is [string, string] => typeof e[1] === 'string')
    .map(([nombre, valor]) => {
      const enmascarada = esNombreSecreto(nombre);
      const v = enmascarada
        ? MASCARA
        : valor.length > MAX_VALOR_VARIABLE
          ? `${valor.slice(0, MAX_VALOR_VARIABLE)}…`
          : valor;
      return { nombre, valor: v, enmascarada };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'en', { sensitivity: 'base' }));
}

/** Cada consulta en paralelo y con plazo: una herramienta lenta no frena al resto. */
export async function entornoSistema(o: {
  env: Record<string, string | undefined>;
  herramientas: ConsultaHerramienta[];
  plazoMs?: number;
  separador?: string;
}): Promise<EntornoSistema> {
  const plazo = o.plazoMs ?? PLAZO_VERSION_MS;
  const herramientas = await Promise.all(
    o.herramientas.map(async ({ nombre, leer }): Promise<VersionHerramienta> => {
      let reloj: ReturnType<typeof setTimeout> | undefined;
      try {
        const versiones = await Promise.race([
          leer(),
          new Promise<null>((r) => {
            reloj = setTimeout(() => r(null), plazo);
          }),
        ]);
        return versiones === null
          ? { nombre, versiones: [], sinRespuesta: true }
          : { nombre, versiones };
      } catch {
        return { nombre, versiones: [], sinRespuesta: true };
      } finally {
        clearTimeout(reloj);
      }
    }),
  );
  return {
    path: carpetasPath(o.env, o.separador),
    herramientas,
    variables: variablesEnmascaradas(o.env),
  };
}
