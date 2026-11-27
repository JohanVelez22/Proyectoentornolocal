import { enmascararSecretos, NOMBRE_VARIABLE_SECRETA } from '../patronesSecretos';

/**
 * Secretos que no tienen una forma reconocible por sí mismos y que un perfil nunca debe llevar:
 * el valor de una directiva de Nginx cuyo nombre es de secreto y el argumento que sigue a una
 * bandera como `--token`. Lo que sí tiene forma (`password=…`, tokens conocidos, credenciales en
 * URLs) lo enmascara además `enmascararSecretos`.
 */

const ENMASCARADO = '***';

/** Directivas de Nginx que fijan una variable o una cabecera: `nombre valor;`. */
const DIRECTIVA =
  /^([ \t]*(?:fastcgi_param|uwsgi_param|scgi_param|proxy_set_header|grpc_set_header|add_header|more_set_headers|set|env)[ \t]+)("[^"\n]*"|'[^'\n]*'|[^\s;]+)([ \t]*)([^;\n]*)(;?)/gm;

/** Cabeceras con credenciales aunque su nombre no diga "token" ni "secret". */
const CABECERA_SECRETA = /authorization|cookie|api[-_]?key|auth[-_]?token/i;

function nombreSecreto(nombre: string): boolean {
  const n = nombre.replace(/^["']|["']$/g, '').replace(/^\$/, '');
  return NOMBRE_VARIABLE_SECRETA.test(n) || CABECERA_SECRETA.test(n);
}

/** Reglas de Nginx (o un vhost) sin el valor de las directivas con nombre de secreto. */
export function enmascararNginx(texto: string): string {
  const sin = texto.replace(
    DIRECTIVA,
    (todo, inicio: string, nombre: string, espacio: string, valor: string, fin: string) => {
      // `env NOMBRE=valor;`
      const igual = nombre.indexOf('=');
      if (igual > 0 && valor.trim() === '') {
        return nombreSecreto(nombre.slice(0, igual))
          ? `${inicio}${nombre.slice(0, igual + 1)}${ENMASCARADO}${fin}`
          : todo;
      }
      if (valor.trim() === '' || !nombreSecreto(nombre)) return todo;
      return `${inicio}${nombre}${espacio}"${ENMASCARADO}"${fin}`;
    },
  );
  return enmascararSecretos(sin);
}

/** Banderas cuyo valor es un secreto: `--token`, `--api-key`, `--db-password`, `-k`… no. */
const BANDERA_SECRETA =
  /^--?(?:[a-z0-9]+[-_])*(?:token|key|apikey|password|passwd|pass|pwd|secret|auth|credentials?)$/i;

/** Puerto pegado (`-p3000`): no es la clave de mysql (`-pclave`). */
const PUERTO_PEGADO = /^-p\d{1,5}$/;

/** Argumentos de un comando sin los valores de las banderas de secreto. */
export function enmascararComando(args: readonly string[]): string[] {
  const salida: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const conValor = /^(--?[A-Za-z0-9_-]+)=/.exec(a);
    if (conValor && BANDERA_SECRETA.test(conValor[1]!)) {
      salida.push(`${conValor[1]}=${ENMASCARADO}`);
    } else if (BANDERA_SECRETA.test(a) && i + 1 < args.length) {
      salida.push(a, ENMASCARADO);
      i++;
    } else if (PUERTO_PEGADO.test(a)) {
      salida.push(a);
    } else {
      salida.push(enmascararSecretos(a));
    }
  }
  return salida;
}

/** Claves de php.ini con valor secreto aunque no lo diga `NOMBRE_VARIABLE_SECRETA` (`mysqli.default_pw`, licencias…). */
const CLAVE_INI_SECRETA = /_pw$|license|licence|auth/i;

/** Parámetros de URL con credenciales (`?auth=…`, `&password=…`). */
const PARAMETRO_SECRETO = /([?&](?:auth|password)=)[^\s&"'#;]+/gi;

/**
 * php.ini sin valores secretos, línea por línea: tapa el valor de las claves con nombre de secreto
 * (`NOMBRE_VARIABLE_SECRETA`, `_pw`, `license`, `auth`, sin distinguir mayúsculas), los parámetros
 * `?auth=` / `&password=` de cualquier valor y lo que tenga forma de secreto.
 */
export function enmascararPhpIni(texto: string): string {
  const lineas = texto.split(/(\r?\n)/);
  return lineas
    .map((l) => {
      const m = /^(\s*[A-Za-z0-9_.\-[\]]+\s*=\s*)(.*)$/.exec(l);
      if (!m) return enmascararSecretos(l.replace(PARAMETRO_SECRETO, `$1${ENMASCARADO}`));
      const clave = m[1]!.split('=')[0]!.trim();
      if (
        m[2]!.trim() !== '' &&
        (NOMBRE_VARIABLE_SECRETA.test(clave) || CLAVE_INI_SECRETA.test(clave))
      ) {
        return `${m[1]}"${ENMASCARADO}"`;
      }
      return enmascararSecretos(m[1] + m[2]!.replace(PARAMETRO_SECRETO, `$1${ENMASCARADO}`));
    })
    .join('');
}
