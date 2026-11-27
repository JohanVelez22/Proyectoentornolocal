import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { respaldoPathUsuario } from '../../herramientas/pathUsuario';
import { Rutas } from '../../rutas';
import type { DepsDoctor, HallazgoInterno } from '../tipos';
import { copiaConFecha, fallo } from './comun';

/** `%VAR%` expandidas (el PATH del usuario se guarda sin expandir). */
const expandir = (e: string, entorno: Record<string, string | undefined>): string =>
  e.replace(/%([^%]+)%/g, (todo, n: string) => {
    const k = Object.keys(entorno).find((x) => x.toLowerCase() === n.toLowerCase());
    return k === undefined ? todo : (entorno[k] ?? todo);
  });

/** Forma comparable de una carpeta: sin comillas ni separador final, `/` y en minúsculas. */
const comparable = (e: string): string =>
  e.trim().replace(/^"|"$/g, '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

/** Programas (nombre sin extensión, en minúsculas) que hay en una carpeta. */
async function programas(carpeta: string): Promise<Set<string>> {
  try {
    return new Set(
      (await readdir(carpeta, { withFileTypes: true }))
        .filter((f) => f.isFile())
        .map((f) => path.parse(f.name).name.toLowerCase()),
    );
  } catch {
    return new Set();
  }
}

const origen = (carpeta: string): string =>
  /flyenv|phpwebstudy/i.test(carpeta)
    ? 'FlyEnv'
    : /xampp/i.test(carpeta)
      ? 'XAMPP'
      : /laragon/i.test(carpeta)
        ? 'Laragon'
        : /wamp/i.test(carpeta)
          ? 'WampServer'
          : 'otro';

/**
 * PATH del usuario: entradas propias repetidas (se quitan con copia) y carpetas ajenas con los
 * mismos programas delante de las propias (FlyEnv, XAMPP…: solo se informa).
 */
export async function revisarPath(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const entorno = d.entorno ?? process.env;
  const raiz = comparable(d.carpetaDatos);
  const entradas = await d.plataforma.pathUsuario().leer();
  const info = entradas.map((e) => {
    const real = expandir(e, entorno);
    const c = comparable(real);
    return { e, real, c, propia: c === raiz || c.startsWith(raiz + '/') };
  });
  const res: HallazgoInterno[] = [];

  const vistas = new Set<string>();
  const repetidas: string[] = [];
  for (const x of info) {
    if (!x.propia) continue;
    if (vistas.has(x.c)) repetidas.push(x.e);
    vistas.add(x.c);
  }
  if (repetidas.length > 0) {
    res.push({
      id: 'path:duplicados',
      revision: 'path',
      gravedad: 'aviso',
      codigo: 'doctor.path_duplicados',
      datos: { cantidad: repetidas.length },
      evidencia: { codigo: 'path_repetidas', datos: { entradas: repetidas.join(' ; ') } },
      reparacion: {
        id: 'path-quitar-duplicados',
        codigo: 'doctor.reparaciones.path_duplicados',
        requiereAdmin: false,
        soloInforma: false,
      },
      aplicar: async () => {
        try {
          const acceso = d.plataforma.pathUsuario({
            respaldo: d.respaldoPath ?? respaldoPathUsuario(new Rutas(d.carpetaDatos)),
          });
          // Se relee: entre la revisión y la reparación el PATH pudo cambiar.
          const actuales = await acceso.leer();
          const vistas2 = new Set<string>();
          const nuevas = actuales.filter((e) => {
            const c = comparable(expandir(e, entorno));
            if (!(c === raiz || c.startsWith(raiz + '/'))) return true; // ajenas: intactas
            if (vistas2.has(c)) return false;
            vistas2.add(c);
            return true;
          });
          if (nuevas.length === actuales.length) return { ok: true };
          await copiaConFecha(d, 'path-usuario', actuales.join('\n'));
          await acceso.escribir(nuevas);
          return { ok: true };
        } catch (e) {
          return fallo(e);
        }
      },
    });
  }

  const primeraPropia = info.findIndex((x) => x.propia);
  if (primeraPropia > 0) {
    const nuestros = new Set<string>();
    for (const x of info) if (x.propia) for (const p of await programas(x.real)) nuestros.add(p);
    for (const [i, x] of info.slice(0, primeraPropia).entries()) {
      for (const p of await programas(x.real)) {
        if (!nuestros.has(p)) continue;
        res.push({
          id: `path:delante:${i}:${p}`,
          revision: 'path',
          gravedad: 'aviso',
          codigo: 'doctor.path_ajeno_delante',
          datos: { programa: p, origen: origen(x.real) },
          evidencia: { codigo: 'path_delante', datos: { entrada: x.e, programa: p } },
          reparacion: {
            id: 'path-ajeno',
            codigo: 'doctor.reparaciones.path_ajeno',
            requiereAdmin: false,
            soloInforma: true,
          },
        });
      }
    }
  }
  return res;
}
