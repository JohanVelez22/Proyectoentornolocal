import type { PasoReceta } from '../config';
import {
  argsPermitidos,
  generadorPorTipo,
  PASOS_PERMITIDOS_PLANTILLA,
  type Plantilla,
} from '../plantillas';
import { procesoUvicorn } from '../recetas';
import { generadorCodeigniter3, generadorCodeigniter4 } from './codeigniter';
import { generadorEstatico } from './estatico';
import { generadorFastapi } from './fastapi';
import { generadorLaravel } from './laravel';
import { generadorSymfony } from './symfony';
import { generadorWordpress } from './wordpress';
import {
  argsBase,
  dominioDe,
  motorDelPedido,
  paso,
  pasoSitio,
  type Generador,
  type PedidoProyecto,
  type TipoGenerador,
} from './comun';

/** Pasos que ejecutan el código del proyecto (artisan, `npm run`): no se corren en una importada. */
const PASOS_QUE_CORREN_CODIGO = ['key-generate', 'migrar', 'storage-link', 'npm-build'];

/** ¿El paso de la plantilla se vuelve a correr? Lista cerrada; una importada, sin código ajeno. */
export function pasoSeRepite(pl: Pick<Plantilla, 'origen'>, x: Pick<PasoReceta, 'tipo'>): boolean {
  if (!PASOS_PERMITIDOS_PLANTILLA.includes(x.tipo)) return false;
  return !(pl.origen === 'importada' && PASOS_QUE_CORREN_CODIGO.includes(x.tipo));
}

/** Pasos de la plantilla que NO se vuelven a correr (una plantilla manipulada no ejecuta comandos). */
export function pasosOmitidosDePlantilla(pl: Pick<Plantilla, 'receta' | 'origen'>): PasoReceta[] {
  return pl.receta.filter((x) => !pasoSeRepite(pl, x));
}

/** Generador base de cada tipo de sitio (para una plantilla sin archivos). */
const BASE_DEL_TIPO: Record<TipoGenerador, Generador> = {
  laravel: generadorLaravel,
  codeigniter3: generadorCodeigniter3,
  codeigniter4: generadorCodeigniter4,
  symfony: generadorSymfony,
  fastapi: generadorFastapi,
  wordpress: generadorWordpress,
  estatico: generadorEstatico,
};

/** Generador base de una plantilla (para crearla sin archivos); null si su tipo no tiene uno. */
export function generadorBaseDe(
  pl: Pick<Plantilla, 'tipo' | 'generador'>,
): { id: TipoGenerador; gen: Generador } | null {
  const id = pl.generador ?? generadorPorTipo(pl.tipo);
  return id ? { id, gen: BASE_DEL_TIPO[id] } : null;
}

/**
 * Generador de un proyecto nuevo desde una plantilla propia: copia sus archivos, crea la base
 * (nueva, nunca una existente), repite los pasos permitidos de su receta, restaura el esquema sin
 * datos y crea el sitio. Comparte con los demás generadores el motor de recetas y todas las
 * validaciones de `crearProyecto` (carpeta vacía, base nueva, nombre, dominio).
 */
export function generadorDePlantilla(pl: Plantilla): Generador {
  const g: Generador = {
    tipoSitio: pl.tipo,
    dominio: dominioDe,
    motorPorDefecto: () => pl.motorBase,
    pasos(p: PedidoProyecto): PasoReceta[] {
      const motor = motorDelPedido(p, pl.motorBase);
      const base = argsBase(p, motor);
      const conEsquema = p.base !== null && pl.archivoEsquema !== null;
      const pasoEsquema = (): PasoReceta =>
        paso('restaurar-esquema-plantilla', 'Crear las tablas de la plantilla (sin datos)', {
          ...base,
          plantilla: pl.id,
        });
      // Sin archivos: se parte del generador base del tipo (como un proyecto nuevo) y encima se
      // restaura el esquema; los ajustes (php.ini, Nginx) los aplica crearProyecto al terminar.
      const bas = pl.conArchivos ? null : generadorBaseDe(pl);
      if (bas) {
        const lista = bas.gen.pasos({ ...p, tipo: bas.id });
        const salida: PasoReceta[] = [];
        let puesto = false;
        for (const x of lista) {
          if (x.tipo === 'migrar' && conEsquema) continue;
          if (x.tipo === 'sitio-crear' && conEsquema && !puesto) {
            salida.push(pasoEsquema());
            puesto = true;
          }
          salida.push(x);
        }
        return salida;
      }
      const pasos: PasoReceta[] = [];
      if (pl.conArchivos) {
        pasos.push(
          paso('restaurar-plantilla-archivos', 'Copiar los archivos de la plantilla', {
            plantilla: pl.id,
          }),
        );
      }
      if (p.base) pasos.push(paso('bd-crear', 'Crear la base de datos', { ...base, nueva: true }));
      const importada = pl.origen === 'importada';
      for (const x of pl.receta) {
        if (!pasoSeRepite(pl, x)) continue;
        // El esquema ya trae la tabla de migraciones; sin base no hay qué migrar.
        if (x.tipo === 'migrar' && (conEsquema || !p.base)) continue;
        if (x.tipo === 'pgvector-activar' && !p.base) continue;
        // Solo los argumentos de la lista del tipo, y los de la base los pone siempre este generador.
        const args: Record<string, unknown> = argsPermitidos(x.tipo, x.args);
        if (
          importada &&
          (x.tipo === 'composer-install' || x.tipo === 'npm-ci' || x.tipo === 'pip-install')
        ) {
          args.sinScripts = true;
        }
        if (x.tipo === 'env-crear' || x.tipo === 'pgvector-activar') Object.assign(args, base);
        // Sin base, la sesión y la caché de Laravel van en archivos (no hay tablas).
        if (x.tipo === 'env-crear' && !p.base && pl.tipo === 'laravel') {
          args.valores = {
            ...(typeof args.valores === 'object' && args.valores ? args.valores : {}),
            SESSION_DRIVER: 'file',
            CACHE_STORE: 'file',
            QUEUE_CONNECTION: 'sync',
          };
        }
        pasos.push({
          id: x.id,
          tipo: x.tipo,
          titulo: x.titulo,
          ...(Object.keys(args).length > 0 ? { args } : {}),
          ...(x.opcional ? { opcional: true } : {}),
        });
      }
      // wp-config.php y database.php de CodeIgniter 3 no viajan en la plantilla (llevan la clave de
      // la base): se vuelven a crear con la conexión del proyecto nuevo.
      if (pl.conArchivos && pl.tipo === 'wordpress' && p.base) {
        pasos.push(paso('config-bd-crear', 'Crear wp-config.php', { ...base, marco: 'wordpress' }));
      }
      if (pl.conArchivos && pl.tipo === 'codeigniter3') {
        pasos.push(
          paso('config-bd-crear', p.base ? 'Configurar CodeIgniter 3' : 'Configurar base_url', {
            ...base,
            marco: 'codeigniter3',
            ...(p.base ? {} : { sinBd: true }),
          }),
        );
      }
      if (conEsquema) pasos.push(pasoEsquema());
      if (
        p.opciones.pgvector === true &&
        p.base &&
        !pasos.some((x) => x.tipo === 'pgvector-activar')
      ) {
        pasos.push(paso('pgvector-activar', 'Activar pgvector en la base', base));
      }
      pasos.push(
        pasoSitio(
          p,
          g,
          pl.tipo === 'fastapi'
            ? {
                procesos: [
                  {
                    ...procesoUvicorn({ moduloAsgi: pl.moduloAsgi ?? 'main:app' }),
                    // Una importada no arranca sus procesos sola.
                    autoIniciar: !importada,
                  },
                ],
              }
            : {},
        ),
      );
      return pasos;
    },
  };
  return g;
}
