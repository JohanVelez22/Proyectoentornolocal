import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Eventos, type EventosNucleo } from '../src/eventos';
import type { PasoReceta } from '../src/proyectos/config';
import { RegistroPasos } from '../src/proyectos/pasos';
import { registrarPasosReales, type DepsPasos } from '../src/proyectos/pasos/index';
import { EjecutorRecetas } from '../src/proyectos/recetas';
import { Rutas } from '../src/rutas';
import type { Sitio } from '../src/tipos';

/** Clave de prueba del usuario propio de la base: no debe salir de ningún sitio salvo el .env. */
const CENTINELA = 'centinela-secreta-d';
const ADMIN = 'clave-del-administrador-falsa';

/** Recorre una carpeta y devuelve los archivos (rutas relativas) que contienen el texto. */
async function conTexto(carpeta: string, texto: string): Promise<string[]> {
  const salida: string[] = [];
  const recorrer = async (dir: string): Promise<void> => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) await recorrer(ruta);
      else if ((await readFile(ruta, 'utf8').catch(() => '')).includes(texto)) {
        salida.push(path.relative(carpeta, ruta));
      }
    }
  };
  await recorrer(carpeta);
  return salida;
}

describe('la clave del usuario propio de la base solo queda en el .env del proyecto', () => {
  it('una receta real (bd-crear + env-crear) no la deja en el estado, el registro, los eventos ni los resultados', async () => {
    const datos = await carpetaTemporal('pel-centinela-datos-');
    const carpeta = await carpetaTemporal('pel-centinela-proy-');
    await writeFile(
      path.join(carpeta, '.env.example'),
      'APP_NAME=Laravel\nDB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=laravel\nDB_USERNAME=root\nDB_PASSWORD=\n',
    );
    const rutas = new Rutas(datos);
    const creadas: { nombre: string; opts: unknown }[] = [];
    const deps = {
      rutas,
      lanzar: async () => ({ codigo: 0 }),
      entorno: {},
      runtimes: {
        paraProyecto: async () => ({ avisos: [] }),
        carpetasPath: () => [],
        rutaBin: () => '',
      },
      php: async () => ({ exe: 'php', ini: 'php.ini' }),
      composerPhar: async () => null,
      bd: {
        conexion: async () => ({
          host: '127.0.0.1' as const,
          puerto: 3306,
          usuario: 'root',
          clave: ADMIN,
        }),
        listar: async () => [],
        crear: async (_o: unknown, nombre: string, opts: unknown) => {
          creadas.push({ nombre, opts });
          // Un servidor que repite la clave en su error: no debe llegar al registro.
          if (creadas.length > 1) throw new Error(`rechazó la clave ${CENTINELA}`);
          return { usuarioActualizado: false };
        },
        tieneTablas: async () => false,
        activarVector: async () => undefined,
      },
      restaurar: async () => ({ advertencias: [] }),
      mailpit: async () => null,
      guardarSitio: async () => undefined,
      puertoLibre: async () => 8000,
    } as unknown as DepsPasos;
    const sitio: Sitio = {
      id: 'tienda',
      nombre: 'Tienda',
      dominio: 'tienda.test',
      alias: [],
      carpeta,
      tipo: 'laravel',
      php: '8.4',
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      https: true,
      redirigirHttps: false,
      confiado: true,
      git: null,
      procesos: [],
      runtimes: {},
      nota: '',
    } as Sitio;
    const eventos = new Eventos<EventosNucleo>();
    const vistos: unknown[] = [];
    eventos.on('receta:progreso', (p) => vistos.push(p));
    eventos.on('receta:terminada', (p) => vistos.push(p));
    const ejecutor = new EjecutorRecetas({
      rutas,
      eventos,
      pasos: registrarPasosReales(new RegistroPasos(), deps),
      sitio: (id) => (id === sitio.id ? sitio : undefined),
    });
    const receta: PasoReceta[] = [
      {
        id: 'bd-crear',
        tipo: 'bd-crear',
        titulo: 'Crear la base',
        // Ni siquiera una clave puesta a mano en los argumentos se guarda.
        args: {
          motor: 'mysql',
          base: 'tienda',
          usuario: 'wolf_u_tienda',
          nueva: true,
          clave: 'x1',
        },
      },
      {
        id: 'env-crear',
        tipo: 'env-crear',
        titulo: 'Crear .env',
        args: { motor: 'mysql', base: 'tienda', usuario: 'wolf_u_tienda' },
      },
    ];
    const r = await ejecutor.ejecutar(sitio.id, { receta, secretos: { claveBd: CENTINELA } });
    expect(r.estado).toBe('lista');
    expect(creadas[0]).toMatchObject({
      nombre: 'tienda',
      opts: { usuario: 'wolf_u_tienda', clave: CENTINELA, nueva: true },
    });

    // El .env del proyecto sí la lleva (el código la lee de ahí), y no la del administrador.
    const env = await readFile(path.join(carpeta, '.env'), 'utf8');
    expect(env).toContain(`DB_PASSWORD=${CENTINELA}`);
    expect(env).toContain('DB_USERNAME=wolf_u_tienda');
    expect(env).not.toContain(ADMIN);

    // En ningún otro lado: ni el estado de la receta, ni los eventos, ni el resultado, ni la
    // carpeta de datos (run/, etc/…).
    expect(JSON.stringify(ejecutor.estado(sitio.id))).not.toContain(CENTINELA);
    expect(JSON.stringify(vistos)).not.toContain(CENTINELA);
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
    await mkdir(datos, { recursive: true });
    expect(await conTexto(datos, CENTINELA)).toEqual([]);

    // Un fallo del servidor que repite la clave tampoco la deja en el registro ni en los eventos.
    const mal = await ejecutor.ejecutar(sitio.id, {
      receta: [receta[0]!],
      secretos: { claveBd: CENTINELA },
    });
    expect(mal.estado).toBe('error');
    expect(JSON.stringify(mal)).not.toContain(CENTINELA);
    expect(JSON.stringify(ejecutor.estado(sitio.id))).not.toContain(CENTINELA);
    expect(JSON.stringify(vistos)).not.toContain(CENTINELA);
    expect(await conTexto(datos, CENTINELA)).toEqual([]);
  });
});
