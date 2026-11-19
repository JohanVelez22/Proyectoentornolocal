import path from 'node:path';
import { z } from 'zod';
import {
  procesoDelProxy,
  ProcesoProyectoSchema,
  TIPOS_PROXY,
  TIPOS_SITIO,
  type ProcesoProyecto,
  type Sitio,
  type TipoSitio,
} from '../../tipos';
import { existe } from '../archivos';
import type { ImplementacionPaso } from '../pasos';
import { moduloAsgi } from '../detectar';
import { carpetaDelPaso, MARCADOR_PUERTO, sanear } from '../recetas';
import { argsDe, comprobarSenal, texto, type DepsPasos } from './comun';
import { nombreEjecutable } from '../../plataforma/sistema';

/** El python del .venv escrito relativo en la receta (`.venv\Scripts\python.exe`). */
const PYTHON_VENV_RELATIVO = /^\.venv[\\/]Scripts[\\/]python(\.exe)?$/i;
const MODULO_UVICORN = 'app:app';

/**
 * Ajusta el comando de un proceso a su carpeta de trabajo (la del proyecto o su `cwd`): el
 * python relativo del .venv pasa a ruta absoluta y, en uvicorn, `app:app` se cambia por el
 * módulo ASGI que se encuentre (`main:app`, `app.main:app`…) si no hay app.py.
 */
async function ajustarComando(
  comando: string[],
  raiz: string,
  cwd: string,
  linea: (t: string) => void,
): Promise<string[]> {
  const carpeta = carpetaDelPaso(raiz, cwd);
  const c = [...comando];
  if (PYTHON_VENV_RELATIVO.test(c[0]!))
    c[0] = path.join(carpeta, '.venv', 'Scripts', nombreEjecutable('python'));
  const i = c.indexOf(MODULO_UVICORN);
  if (i >= 0 && c.includes('uvicorn') && !(await existe(path.join(carpeta, 'app.py')))) {
    const modulo = await moduloAsgi(carpeta);
    if (modulo) {
      c[i] = modulo;
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
 * Procesos de `args.procesos` (uvicorn, vite…) listos para guardar: el python relativo del .venv
 * en ruta absoluta y `{puerto}` cambiado por un puerto libre. Un proceso que ya existía con ese id
 * conserva su puerto si sigue libre; los demás procesos del sitio se mantienen.
 */
export async function prepararProcesos(
  d: Pick<DepsPasos, 'puertoLibre'>,
  crudos: unknown,
  actuales: readonly ProcesoProyecto[],
  carpeta: string,
  linea: (t: string) => void,
  sitioId?: string,
): Promise<ProcesoProyecto[]> {
  const nuevos = z.array(ProcesoProyectoSchema).safeParse(crudos ?? []);
  if (!nuevos.success) {
    throw new Error(
      `Los procesos del paso no son válidos: ${nuevos.error.issues.map((i) => i.message).join('; ')}`,
    );
  }
  const procesos: ProcesoProyecto[] = actuales.map((p) => ({ ...p }));
  // Los puertos que ya usan los procesos que no se tocan quedan reservados.
  const idsNuevos = new Set(nuevos.data.map((p) => p.id));
  const reservados = procesos
    .filter((p) => !idsNuevos.has(p.id) && p.puerto !== null)
    .map((p) => p.puerto!);
  for (const p of nuevos.data) {
    let comando = await ajustarComando(p.comando, carpeta, p.cwd, linea);
    let puerto = p.puerto;
    if (lleva(comando)) {
      const previo = actuales.find((x) => x.id === p.id)?.puerto ?? null;
      puerto = await d.puertoLibre({
        reservados: [...reservados],
        preferido: previo,
        ...(sitioId ? { sitioId } : {}),
      });
      const valor = String(puerto);
      comando = comando.map((x) => x.split(MARCADOR_PUERTO).join(valor));
      linea(`El proceso ${p.nombre || p.id} usará el puerto ${valor}.`);
    }
    if (puerto !== null) reservados.push(puerto);
    const listo: ProcesoProyecto = { ...p, nombre: p.nombre || p.id, comando, puerto };
    const i = procesos.findIndex((x) => x.id === p.id);
    if (i >= 0) procesos[i] = listo;
    else procesos.push(listo);
  }
  return procesos;
}

/** Puerto del proxy de un sitio FastAPI/Node: el del proceso destino, si hay. */
export function puertoProxyCon(
  tipo: TipoSitio,
  procesos: readonly ProcesoProyecto[],
  actual: number | null,
): number | null {
  const conPuerto = procesoDelProxy(procesos);
  return TIPOS_PROXY.includes(tipo) && conPuerto ? conPuerto.puerto : actual;
}

/**
 * Datos de un sitio nuevo con lo que trae el paso `sitio-crear` (tipo, PHP, dominio, HTTPS y sus
 * procesos con puerto). Solo se usa al crear el sitio: en uno que ya existe esos datos son del
 * usuario y el paso no los pisa.
 */
export async function datosAlCrear(
  d: Pick<DepsPasos, 'puertoLibre'>,
  datos: Omit<Sitio, 'id'>,
  args: Record<string, unknown>,
  linea: (t: string) => void = () => undefined,
): Promise<Omit<Sitio, 'id'>> {
  const tipo: TipoSitio =
    typeof args.tipo === 'string' && (TIPOS_SITIO as readonly string[]).includes(args.tipo)
      ? (args.tipo as TipoSitio)
      : datos.tipo;
  const procesos = await prepararProcesos(d, args.procesos, datos.procesos, datos.carpeta, linea);
  return {
    ...datos,
    tipo,
    php: texto(args.php) ?? datos.php,
    dominio: texto(args.dominio) ?? datos.dominio,
    https: typeof args.https === 'boolean' ? args.https : datos.https,
    procesos,
    puertoProxy: puertoProxyCon(tipo, procesos, datos.puertoProxy),
  };
}

/**
 * Completa el sitio del proyecto con `Nucleo.guardarSitio`: agrega los procesos de
 * `args.procesos` (con `{puerto}` cambiado por uno libre) y el puerto del proxy. El tipo, el PHP,
 * el dominio y HTTPS del sitio no se tocan: se fijan al crearlo (`datosAlCrear`) y después los
 * cambia el usuario; una re-ejecución de la receta no los pisa.
 */
export function pasoSitioCrear(d: DepsPasos): ImplementacionPaso {
  return async (ctx) => {
    comprobarSenal(ctx);
    const args = argsDe(ctx);
    const actual = (await d.leerSitio?.(ctx.sitio.id)) ?? ctx.sitio;
    const procesos = await prepararProcesos(
      d,
      args.procesos,
      actual.procesos,
      ctx.carpeta,
      ctx.linea,
      ctx.sitio.id,
    );
    const { id, ...resto } = actual;
    const datos = {
      ...resto,
      procesos,
      puertoProxy: puertoProxyCon(actual.tipo, procesos, actual.puertoProxy),
    };
    comprobarSenal(ctx);
    await d.guardarSitio(datos, id);
    ctx.linea(sanear(`Sitio guardado: ${datos.https ? 'https' : 'http'}://${datos.dominio}`));
  };
}
