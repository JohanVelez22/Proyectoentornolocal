import { writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Nucleo } from '../src/nucleo';
import type { Plataforma } from '../src/plataforma/tipos';
import { carpetaTemporal } from './temporales';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

/** Claves de prueba obviamente falsas: la del usuario propio y la del administrador del servidor. */
const CLAVE_PROPIA = 'centinela-secreta-d';
const CLAVE_ADMIN = 'admin-prueba-falsa-0000';

describe('Nucleo.abrirBaseProyecto (D18)', () => {
  let base: string;
  let proyectos: string;
  let hosts: string;
  let nucleos: Nucleo[];

  const plataforma = (): Plataforma => ({
    rutaHosts: () => hosts,
    escribirComoAdmin: async (destino, contenido) => {
      writeFileSync(destino, contenido);
      return { ok: true };
    },
    quienUsaPuerto: async () => null,
    duenosDePuertos: async () => new Map(),
    instalarCertificadoUsuario: async () => ({ ok: true as const }),
    quitarCertificadoUsuario: async () => ({ ok: true as const }),
    certificadoInstalado: async () => false,
    procesoVivo: async () => ({ vivo: false }),
    matarArbol: async () => undefined,
    abrirUrl: async () => undefined,
    ejecutable: (n) => `${n}.exe`,
    carpetaDocumentos: async () => hosts,
  });

  beforeEach(async () => {
    base = await carpetaTemporal('pel-acceso-nucleo-');
    proyectos = await carpetaTemporal('pel-acceso-proy-');
    hosts = path.join(base, 'hosts');
    writeFileSync(hosts, '127.0.0.1 localhost\r\n');
    nucleos = [];
  });
  afterEach(async () => {
    for (const n of nucleos) await n.cerrar({ detenerServicios: false });
  });

  /** Un núcleo con Adminer y phpMyAdmin "listos" y un servidor de datos falso en el 3307. */
  const crear = async (): Promise<Nucleo> => {
    const n = await Nucleo.crear({
      barrerHuerfanos: false,
      base: path.join(base, 'datos'),
      plataforma: plataforma(),
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      lanzar: async () => {
        throw new Error('el estático no lanza procesos');
      },
    });
    nucleos.push(n);
    const disp = { disponible: true as const, rama: '8.4' };
    n.adminer.disponibilidad = async () => disp;
    n.phpmyadmin.disponibilidad = async () => disp;
    n.adminer.preparar = async () => undefined;
    n.phpmyadmin.preparar = async () => undefined;
    (n.bd as unknown as { conexion: unknown }).conexion = async () => ({
      host: '127.0.0.1',
      puerto: 3307,
      usuario: 'root',
      clave: CLAVE_ADMIN,
    });
    return n;
  };

  const proyecto = async (n: Nucleo, env: string): Promise<string> => {
    const carpeta = path.join(proyectos, 'tienda');
    const r = await n.crearProyecto({
      tipo: 'estatico',
      nombre: 'tienda',
      carpeta,
      base: null,
      opciones: {},
    });
    await writeFile(path.join(carpeta, '.env'), env);
    return r.sitio.id;
  };

  const ENV_PROPIO =
    'DB_CONNECTION=mysql\nDB_DATABASE=tienda\nDB_USERNAME=wolf_u_tienda\nDB_PASSWORD=x\n';
  const ENV_ROOT = 'DB_CONNECTION=mysql\nDB_DATABASE=tienda\nDB_USERNAME=root\nDB_PASSWORD=\n';

  const canjear = (n: Nucleo, url: string, h: 'adminer' | 'phpmyadmin') =>
    n.accesoBd.canjear(
      new URL(url).searchParams.get('wolfcore_token') ?? '',
      n.accesoBd.secretoDeProceso(),
      h,
    );

  it('con usuario propio y su clave guardada entra como wolf_u_* y la URL solo lleva el token', async () => {
    const n = await crear();
    const id = await proyecto(n, ENV_PROPIO);
    n.fijarProveedorClaveBd(async (s) => (s === id ? CLAVE_PROPIA : null));
    const r = await n.abrirBaseProyecto(id, 'phpmyadmin');
    expect(r).toMatchObject({ usuario: 'wolf_u_tienda', propio: true });
    expect(r.url).toMatch(
      /^http:\/\/127\.0\.0\.1:8091\/wolfcore-signon\.php\?wolfcore_token=[\w-]{43}$/,
    );
    // Ni la clave propia ni la del administrador viajan en la URL ni en lo que ve la interfaz.
    const visible = JSON.stringify(r);
    expect(visible).not.toContain(CLAVE_PROPIA);
    expect(visible).not.toContain(CLAVE_ADMIN);
    expect(canjear(n, r.url, 'phpmyadmin')).toMatchObject({
      usuario: 'wolf_u_tienda',
      clave: CLAVE_PROPIA,
      puerto: 3307,
      base: 'tienda',
      sitioId: id,
    });
    expect(canjear(n, r.url, 'phpmyadmin')).toBeNull();
  });

  it('Adminer usa su raíz y el mismo token de un solo uso', async () => {
    const n = await crear();
    const id = await proyecto(n, ENV_PROPIO);
    n.fijarProveedorClaveBd(async () => CLAVE_PROPIA);
    const r = await n.abrirBaseProyecto(id, 'adminer');
    expect(r.url).toMatch(/^http:\/\/127\.0\.0\.1:8090\/\?wolfcore_token=[\w-]{43}$/);
    expect(canjear(n, r.url, 'phpmyadmin')).toBeNull();
  });

  it('si el proyecto usa root, entra con el administrador y lo dice (propio: false)', async () => {
    const n = await crear();
    const id = await proyecto(n, ENV_ROOT);
    n.fijarProveedorClaveBd(async () => CLAVE_PROPIA);
    const r = await n.abrirBaseProyecto(id, 'adminer');
    expect(r).toMatchObject({ usuario: 'root', propio: false, motivo: 'sin_usuario_propio' });
    expect(canjear(n, r.url, 'adminer')).toMatchObject({ usuario: 'root', clave: CLAVE_ADMIN });
  });

  it('un wolf_u_* sin clave guardada tampoco se usa: cae al administrador', async () => {
    const n = await crear();
    const id = await proyecto(n, ENV_PROPIO);
    n.fijarProveedorClaveBd(async () => null);
    const r = await n.abrirBaseProyecto(id, 'phpmyadmin');
    expect(r).toMatchObject({ usuario: 'root', propio: false, motivo: 'sin_clave' });
  });

  it('errores con código: sin base, servidor remoto, PostgreSQL en phpMyAdmin y herramienta no lista', async () => {
    const n = await crear();
    const sinBase = await proyecto(n, 'APP_NAME=x\n');
    await expect(n.abrirBaseProyecto(sinBase, 'adminer')).rejects.toMatchObject({
      codigo: 'acceso_bd.sin_base',
    });
    await writeFile(
      path.join(proyectos, 'tienda', '.env'),
      'DB_CONNECTION=mysql\nDB_HOST=db.ejemplo.com\nDB_DATABASE=tienda\nDB_USERNAME=app\n',
    );
    await expect(n.abrirBaseProyecto(sinBase, 'adminer')).rejects.toMatchObject({
      codigo: 'acceso_bd.servidor_no_resuelto',
    });
    await writeFile(
      path.join(proyectos, 'tienda', '.env'),
      'DB_CONNECTION=pgsql\nDB_DATABASE=tienda\nDB_USERNAME=app\n',
    );
    await expect(n.abrirBaseProyecto(sinBase, 'phpmyadmin')).rejects.toMatchObject({
      codigo: 'acceso_bd.motor_no_soportado',
    });
    await writeFile(path.join(proyectos, 'tienda', '.env'), ENV_ROOT);
    n.phpmyadmin.disponibilidad = async () => ({
      disponible: false,
      motivo: 'Instale phpMyAdmin para usarlo',
      causa: 'sin_instalar' as const,
    });
    await expect(n.abrirBaseProyecto(sinBase, 'phpmyadmin')).rejects.toMatchObject({
      codigo: 'acceso_bd.no_listo',
      message: 'Instale phpMyAdmin para usarlo',
    });
  });
});
