import path from 'node:path';
import { z } from 'zod';
import {
  ProcesoProyectoSchema,
  TIPOS_PROXY,
  TIPOS_SITIO,
  type ProcesoProyecto,
  type TipoSitio,
} from '../../tipos';
import { existe } from '../archivos';
import type { ImplementacionPaso } from '../pasos';
import { MARCADOR_PUERTO, sanear } from '../recetas';
import { argsDe, comprobarSenal, texto, type DepsPasos } from './comun';

/** El python del .venv escrito relativo en la receta (`.venv\Scripts\python.exe`). */
const PYTHON_VENV_RELATIVO = /^\.venv[\\/]Scripts[\\/]python(\.exe)?$/i;
const MODULO_UVICORN = 'app:app';

/**
 * Ajusta el comando de un proceso a la carpeta: el python relativo del .venv pasa a ruta
 * absoluta y, en uvicorn, `app:app` se cambia por `main:app` si solo hay main.py.
 */
async function ajustarComando(
  comando: string[],
  carpeta: string,
  linea: (t: string) => void,
): Promise<string[]> {
  const c = [...comando];
  if (PYTHON_VENV_RELATIVO.test(c[0]!)) c[0] = path.join(carpeta, '.venv', 'Scripts', 'python.exe');
  const i = c.indexOf(MODULO_UVICORN);
  if (i >= 0 && c.includes('uvicorn') && !(await existe(path.join(carpeta, 'app.py')))) {
    if (await existe(path.join(carpeta, 'main.py'))) {
      c[i] = 'main:app';
    } else {
      linea(
        'Aviso: no se encontró app.py ni main.py; revise el módulo de uvicorn (app:app) en los procesos del proyecto.',
      );
    }
  }
  return c;
}

const lleva = (comando: string[]): boolean => comando.some((x) => x.includes(MARCADOR_PUERTO));

/**
 * Guarda el sitio con `Nucleo.guardarSitio`: tipo, PHP, dominio y HTTPS de los argumentos, y los
 * procesos de `args.procesos` (uvicorn, vite…) con su `{puerto}` reemplazado por uno libre. Un
 * proceso que ya existía con ese id conserva su puerto si sigue libre.
 */
export function pasoSitioCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const actual = (await d.leerSitio?.(ctx.sitio.id)) ?? ctx.sitio;
    const nuevos = z.array(ProcesoProyectoSchema).safeParse(args.procesos ?? []);
    if (!nuevos.success) {
      throw new Error(
        `Los procesos del paso no son válidos: ${nuevos.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    const procesos: ProcesoProyecto[] = actual.procesos.map((p) => ({ ...p }));
    // Los puertos que ya usan los procesos que no se tocan quedan reservados.
    const idsNuevos = new Set(nuevos.data.map((p) => p.id));
    const reservados = procesos
      .filter((p) => !idsNuevos.has(p.id) && p.puerto !== null)
      .map((p) => p.puerto!);
    for (const p of nuevos.data) {
      let comando = await ajustarComando(p.comando, ctx.carpeta, ctx.linea);
      let puerto = p.puerto;
      if (lleva(comando)) {
        const previo = actual.procesos.find((x) => x.id === p.id)?.puerto ?? null;
        puerto = await d.puertoLibre({ reservados: [...reservados], preferido: previo });
        const valor = String(puerto);
        comando = comando.map((x) => x.split(MARCADOR_PUERTO).join(valor));
        ctx.linea(`El proceso ${p.nombre || p.id} usará el puerto ${valor}.`);
      }
      if (puerto !== null) reservados.push(puerto);
      const listo: ProcesoProyecto = { ...p, nombre: p.nombre || p.id, comando, puerto };
      const i = procesos.findIndex((x) => x.id === p.id);
      if (i >= 0) procesos[i] = listo;
      else procesos.push(listo);
    }

    const tipo: TipoSitio =
      typeof args.tipo === 'string' && (TIPOS_SITIO as readonly string[]).includes(args.tipo)
        ? (args.tipo as TipoSitio)
        : actual.tipo;
    const conPuerto = procesos.find((p) => p.puerto !== null);
    const { id, ...resto } = actual;
    const datos = {
      ...resto,
      tipo,
      php: texto(args.php) ?? actual.php,
      dominio: texto(args.dominio) ?? actual.dominio,
      https: typeof args.https === 'boolean' ? args.https : actual.https,
      procesos,
      puertoProxy: TIPOS_PROXY.includes(tipo) && conPuerto ? conPuerto.puerto : actual.puertoProxy,
    };
    comprobarSenal(ctx);
    await d.guardarSitio(datos, id);
    ctx.linea(sanear(`Sitio guardado: ${datos.https ? 'https' : 'http'}://${datos.dominio}`));
  };
}
