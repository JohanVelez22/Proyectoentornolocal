/**
 * Lector de vhosts de Apache (`httpd-vhosts.conf`, `sites-enabled/*.conf`) y de Nginx (`server {}`)
 * para importar. Es un lector de texto acotado, no un intérprete: no sigue `Include`, no ejecuta
 * nada y se detiene ante un archivo absurdo (líneas y bloques con tope).
 */

export interface VhostLeido {
  /** Primer `ServerName`/`server_name` válido, sin puerto; null si no hay. */
  nombre: string | null;
  alias: string[];
  /** `DocumentRoot` / `root`, tal cual (ya sin comillas y con las variables conocidas resueltas). */
  documentRoot: string | null;
}

const MAX_LINEAS = 50_000;
const MAX_VHOSTS = 1_000;

const sinComillas = (v: string): string => {
  const t = v.trim();
  const q = t[0];
  if ((q === '"' || q === "'") && t.length >= 2) {
    const fin = t.indexOf(q, 1);
    return fin > 0 ? t.slice(1, fin) : t.slice(1);
  }
  return t.split(/\s+/)[0] ?? '';
};

/** Une las líneas que terminan en `\` y quita los comentarios de línea completa. */
function lineas(texto: string): string[] {
  const salida: string[] = [];
  let acumulada = '';
  for (const cruda of texto.split(/\r?\n/, MAX_LINEAS)) {
    const l = cruda.trim();
    if (acumulada === '' && (l === '' || l.startsWith('#'))) continue;
    if (l.endsWith('\\')) {
      acumulada += `${l.slice(0, -1)} `;
      continue;
    }
    salida.push(acumulada + l);
    acumulada = '';
  }
  if (acumulada !== '') salida.push(acumulada);
  return salida;
}

/** Variables `Define X "valor"` del archivo más las que da quien llama (`SRVROOT`). */
function variables(ls: string[], extra: Record<string, string>): Record<string, string> {
  const v: Record<string, string> = { ...extra };
  for (const l of ls) {
    const m = /^Define\s+([A-Za-z_][\w.]*)\s+(.+)$/i.exec(l);
    if (m) v[m[1]!] = sinComillas(m[2]!);
  }
  return v;
}

function expandir(valor: string, vars: Record<string, string>): string {
  return valor.replace(/\$\{([A-Za-z_][\w.]*)\}/g, (_m, n: string) => vars[n] ?? `\${${n}}`);
}

const ES_NOMBRE = /^[A-Za-z0-9*._-]+(?::\d+)?$/;

/** Vhosts de Apache: bloques `<VirtualHost>`. */
export function leerVhostsApache(texto: string, extra: Record<string, string> = {}): VhostLeido[] {
  const ls = lineas(texto);
  const vars = variables(ls, extra);
  const vhosts: VhostLeido[] = [];
  let actual: VhostLeido | null = null;
  for (const l of ls) {
    if (/^<VirtualHost\b/i.test(l)) {
      actual = { nombre: null, alias: [], documentRoot: null };
      continue;
    }
    if (/^<\/VirtualHost>/i.test(l)) {
      if (actual && vhosts.length < MAX_VHOSTS) vhosts.push(actual);
      actual = null;
      continue;
    }
    if (!actual) continue;
    const dir = /^(\w+)\s+(.+)$/.exec(l);
    if (!dir) continue;
    const nombre = dir[1]!.toLowerCase();
    if (nombre === 'servername' && actual.nombre === null) {
      const n = sinComillas(dir[2]!);
      if (ES_NOMBRE.test(n)) actual.nombre = n;
    } else if (nombre === 'serveralias') {
      for (const a of dir[2]!.split(/\s+/))
        if (ES_NOMBRE.test(a) && !a.includes('*')) actual.alias.push(a);
    } else if (nombre === 'documentroot' && actual.documentRoot === null) {
      actual.documentRoot = expandir(sinComillas(dir[2]!), vars);
    }
  }
  return vhosts;
}

/** Vhosts de Nginx: bloques `server { … }` (nivel uno de llaves; los `location` no cuentan). */
export function leerVhostsNginx(texto: string): VhostLeido[] {
  const ls = lineas(texto);
  const vhosts: VhostLeido[] = [];
  let actual: VhostLeido | null = null;
  let nivel = 0;
  for (const cruda of ls) {
    const l = cruda.replace(/\s+#.*$/, '');
    if (nivel === 0 && /^server\s*\{/.test(l)) {
      actual = { nombre: null, alias: [], documentRoot: null };
      nivel = 1;
      const resto = l.replace(/^server\s*\{/, '');
      nivel += (resto.match(/\{/g) ?? []).length - (resto.match(/\}/g) ?? []).length;
      continue;
    }
    if (!actual) continue;
    if (nivel === 1) {
      const sn = /^server_name\s+([^;]+);/.exec(l);
      if (sn && actual.nombre === null) {
        const nombres = sn[1]!.trim().split(/\s+/);
        for (const n of nombres) {
          if (!ES_NOMBRE.test(n) || n.includes('*')) continue;
          if (actual.nombre === null) actual.nombre = n;
          else actual.alias.push(n);
        }
      }
      const root = /^root\s+([^;]+);/.exec(l);
      if (root && actual.documentRoot === null) actual.documentRoot = sinComillas(root[1]!);
    }
    nivel += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length;
    if (nivel <= 0) {
      if (vhosts.length < MAX_VHOSTS) vhosts.push(actual);
      actual = null;
      nivel = 0;
    }
  }
  return vhosts;
}
