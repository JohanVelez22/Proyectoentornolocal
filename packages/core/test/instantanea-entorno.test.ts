import { existsSync, symlinkSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Almacen } from '../src/almacen';
import {
  listarInstantaneasEntorno,
  MAX_INSTANTANEAS_ENTORNO,
  tomarInstantaneaEntorno,
  type DepsInstantaneaEntorno,
} from '../src/perfiles/instantaneaEntorno';
import { Rutas } from '../src/rutas';
import { ConfigSchema, SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const CENTINELA = 'centinela-secreta-d';

let dir: string;
let rutas: Rutas;
let restringidas: string[];

async function escribir(ruta: string, contenido: string): Promise<void> {
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, contenido);
}

/** Todos los archivos de una carpeta, relativos y con `/`. */
async function arbol(raiz: string): Promise<string[]> {
  const salida: string[] = [];
  const recorrer = async (d: string): Promise<void> => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      const ruta = path.join(d, e.name);
      if (e.isDirectory()) await recorrer(ruta);
      else salida.push(path.relative(raiz, ruta).replace(/\\/g, '/'));
    }
  };
  await recorrer(raiz);
  return salida.sort();
}

function deps(extra: Partial<DepsInstantaneaEntorno> = {}): DepsInstantaneaEntorno {
  const almacen = new Almacen(rutas);
  return {
    rutas,
    leerConfig: () => almacen.leer(),
    restringir: async (ruta) => {
      restringidas.push(ruta);
      return true;
    },
    ...extra,
  };
}

/** Una carpeta de datos con la configuración, Nginx, php.ini y todo lo que nunca debe copiarse. */
async function prepararDatos(): Promise<void> {
  const cfg = ConfigSchema.parse({
    sitios: [
      SitioSchema.parse({
        id: 'tienda',
        nombre: 'Tienda',
        dominio: 'tienda.test',
        carpeta: path.join(dir, 'proyectos', 'tienda'),
        tipo: 'laravel',
        php: '8.4',
        reglasExtra: `proxy_set_header Authorization ${CENTINELA}-1;\nfastcgi_param APP_ENV local;`,
        procesos: [
          {
            id: 'cola',
            nombre: 'Cola',
            comando: ['php', 'artisan', 'queue:work', '--token', `${CENTINELA}-2`],
            cwd: 'raiz',
            autoIniciar: true,
            reiniciar: false,
            puerto: null,
            proxy: false,
          },
        ],
        lan: { activo: true, puerto: 8443, https: true },
        nota: `password: ${CENTINELA}-3`,
      }),
    ],
  });
  await escribir(rutas.config(), JSON.stringify({ ...cfg, apiKey: CENTINELA }));
  await escribir(
    rutas.nginxConf(),
    `worker_processes 1;\nproxy_set_header X-Api-Key "${CENTINELA}-4";\n`,
  );
  await escribir(rutas.vhost('tienda'), 'server { server_name tienda.test; }\n');
  await escribir(
    rutas.phpIni('8.4'),
    [
      'memory_limit = 512M',
      `mysqli.default_pw = ${CENTINELA}-5`,
      `OPCACHE.LICENSE_KEY = "${CENTINELA}-6"`,
      `soap.wsdl_cache_dir = http://x/?AUTH=${CENTINELA}-7&a=1`,
      `session.save_path = "x?password=${CENTINELA}-8"`,
      'extension_dir = "ext"',
      '',
    ].join('\n'),
  );
  const nunca: Record<string, string> = {
    'etc/secretos/ia_openai.bin': CENTINELA,
    'etc/secretos/bd_tienda.bin': CENTINELA,
    'etc/github.token': CENTINELA,
    'etc/credenciales.json': CENTINELA,
    'etc/respaldos/env/env-tienda.respaldo': `DB_PASSWORD=${CENTINELA}`,
    'etc/acceso-bd/secreto': CENTINELA,
    'etc/cloudflared/cert.pem': CENTINELA,
    'etc/cloudflared/tienda.yml': CENTINELA,
    'etc/instantaneas-huellas.json': CENTINELA,
    'etc/plantillas-propias.json': CENTINELA,
    'etc/venvs-propios.json': CENTINELA,
    'etc/nginx/extras/lan-tienda.conf': CENTINELA,
    'etc/nginx/extras/tunel-tienda.conf': CENTINELA,
    'instantaneas/mysql@8.4/tienda/x.sql': CENTINELA,
    'papelera/mysql@8.4/tienda/x.sql': CENTINELA,
    'respaldos/auditoria/x.json': CENTINELA,
    'respaldos/pre-perfil-2026/config.json': CENTINELA,
    'tmp/phpmyadmin/sesiones/sess_x': CENTINELA,
    'run/cli.json': CENTINELA,
    'run/estado.json': CENTINELA,
    'ca/ca.key': CENTINELA,
    'certs/tienda.key': CENTINELA,
    'data/mysql/8.4/ibdata1': CENTINELA,
    'etc/php/8.4/otro.txt': CENTINELA,
    'etc/nginx/sites/no-es-conf.txt': CENTINELA,
  };
  for (const [rel, c] of Object.entries(nunca)) await escribir(path.join(dir, rel), c);
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-instantanea-entorno-');
  rutas = new Rutas(path.join(dir, 'datos'));
  restringidas = [];
});

describe('instantánea del entorno', () => {
  it('copia la configuración, Nginx y php.ini a respaldos/entorno/<fecha>-<motivo>', async () => {
    await prepararDatos();
    const carpeta = await tomarInstantaneaEntorno(
      deps({ reloj: () => new Date(2026, 10, 24, 18, 5, 9) }),
      'actualizar',
    );
    expect(carpeta).toBe(
      path.join(rutas.base, 'respaldos', 'entorno', '20261124-180509-actualizar'),
    );
    expect(await arbol(carpeta)).toEqual([
      'config.json',
      'nginx/nginx.conf',
      'nginx/sites/tienda.conf',
      'php/8.4/php.ini',
    ]);
    const cfg = JSON.parse(await readFile(path.join(carpeta, 'config.json'), 'utf8')) as {
      sitios: { id: string }[];
    };
    expect(cfg.sitios.map((s) => s.id)).toEqual(['tienda']);
    expect(await readFile(path.join(carpeta, 'nginx', 'sites', 'tienda.conf'), 'utf8')).toContain(
      'server_name tienda.test',
    );
    expect(await readFile(path.join(carpeta, 'php', '8.4', 'php.ini'), 'utf8')).toContain(
      'memory_limit = 512M',
    );
  });

  it('nada de los bloqueantes de D26 ni ningún secreto: la centinela no aparece en ningún archivo', async () => {
    await prepararDatos();
    const carpeta = await tomarInstantaneaEntorno(deps(), 'manual');
    const rels = await arbol(carpeta);
    // Solo rutas de la lista blanca de la instantánea.
    for (const rel of rels) {
      expect(rel, rel).toMatch(
        /^(?:config\.json|nginx\/nginx\.conf|nginx\/sites\/[A-Za-z0-9._-]+\.conf|php\/\d+\.\d+\/php\.ini)$/,
      );
    }
    for (const rel of rels) {
      const t = await readFile(path.join(carpeta, rel), 'utf8');
      expect(
        t.split('\n').filter((l) => l.includes(CENTINELA)),
        rel,
      ).toEqual([]);
    }
    // Lo que no es secreto de las reglas sigue ahí.
    const cfg = await readFile(path.join(carpeta, 'config.json'), 'utf8');
    expect(cfg).toContain('APP_ENV');
    // Para volver atrás de verdad: completa y válida, con lo que no es secreto (red local incluida).
    expect(cfg).toContain('8443');
    expect(() => ConfigSchema.parse(JSON.parse(cfg))).not.toThrow();
    expect(await readFile(path.join(carpeta, 'php', '8.4', 'php.ini'), 'utf8')).toContain(
      'extension_dir = "ext"',
    );
    // Los archivos originales no se tocaron.
    expect(await readFile(rutas.config(), 'utf8')).toContain(CENTINELA);
  });

  it('la recién tomada nunca se borra, aunque el reloj haya retrocedido', async () => {
    await prepararDatos();
    for (let i = 0; i < 3; i++) {
      await tomarInstantaneaEntorno(
        deps({ reloj: () => new Date(2026, 10, 24, 10, 0, 10 + i), maximo: 3 }),
        'actualizar',
      );
    }
    const vieja = await tomarInstantaneaEntorno(
      deps({ reloj: () => new Date(2026, 0, 1, 0, 0, 0), maximo: 3 }),
      'manual',
    );
    expect(existsSync(vieja)).toBe(true);
    expect(await listarInstantaneasEntorno(deps())).toHaveLength(3);
  });

  it('una carpeta etc/nginx/sites o etc/php que es un enlace no se recorre', async () => {
    await prepararDatos();
    const fuera = path.join(dir, 'fuera');
    await escribir(path.join(fuera, 'x.conf'), CENTINELA);
    await escribir(path.join(fuera, '8.4', 'php.ini'), CENTINELA);
    const sites = path.dirname(rutas.vhost('x'));
    const php = path.dirname(path.dirname(rutas.phpIni('8.4')));
    await rm(sites, { recursive: true });
    await rm(php, { recursive: true });
    try {
      symlinkSync(fuera, sites, 'junction');
      symlinkSync(fuera, php, 'junction');
    } catch {
      return;
    }
    const carpeta = await tomarInstantaneaEntorno(deps(), 'manual');
    expect(await arbol(carpeta)).toEqual(['config.json', 'nginx/nginx.conf']);
  });

  it('se restringe al usuario antes de escribir nada', async () => {
    await prepararDatos();
    const carpeta = await tomarInstantaneaEntorno(deps(), 'manual');
    expect(restringidas).toContain(path.join(rutas.base, 'respaldos', 'entorno'));
    expect(restringidas).toContain(carpeta);
  });

  it('si no se puede restringir, la copia se hace igual (no lleva secretos)', async () => {
    await prepararDatos();
    const carpeta = await tomarInstantaneaEntorno(
      deps({ restringir: async () => false }),
      'manual',
    );
    expect(existsSync(path.join(carpeta, 'config.json'))).toBe(true);
  });

  it('sin nada que copiar no crea carpeta y devuelve cadena vacía', async () => {
    const r = await tomarInstantaneaEntorno(deps(), 'actualizar');
    expect(r).toBe('');
    expect(existsSync(path.join(rutas.base, 'respaldos', 'entorno'))).toBe(false);
  });

  it('solo conserva las 10 últimas y nunca toca otras carpetas de respaldos/', async () => {
    await prepararDatos();
    const raiz = path.join(rutas.base, 'respaldos', 'entorno');
    const ajena = path.join(rutas.base, 'respaldos', 'pre-perfil-2026-01-01', 'config.json');
    await escribir(ajena, 'no tocar');
    await escribir(path.join(raiz, 'mis-notas', 'a.txt'), 'no tocar');
    expect(MAX_INSTANTANEAS_ENTORNO).toBe(10);
    for (let i = 0; i < 13; i++) {
      await tomarInstantaneaEntorno(
        deps({ reloj: () => new Date(2026, 10, 24, 10, 0, i) }),
        i % 2 === 0 ? 'actualizar' : 'manual',
      );
    }
    const lista = await listarInstantaneasEntorno(deps());
    expect(lista).toHaveLength(10);
    // Quedan las más nuevas (segundos 3 a 12), de la más nueva a la más vieja.
    expect(lista[0]!.nombre).toBe('20261124-100012-actualizar');
    expect(lista.at(-1)!.nombre).toBe('20261124-100003-manual');
    expect((await readdir(raiz)).sort()).toEqual(
      [...lista.map((x) => x.nombre), 'mis-notas'].sort(),
    );
    expect(await readFile(ajena, 'utf8')).toBe('no tocar');
    expect(await readFile(path.join(raiz, 'mis-notas', 'a.txt'), 'utf8')).toBe('no tocar');
  });

  it('dos en el mismo segundo no se pisan', async () => {
    await prepararDatos();
    const reloj = () => new Date(2026, 10, 24, 10, 0, 0);
    const a = await tomarInstantaneaEntorno(deps({ reloj }), 'manual');
    const b = await tomarInstantaneaEntorno(deps({ reloj }), 'manual');
    expect(a).not.toBe(b);
    expect(await listarInstantaneasEntorno(deps())).toHaveLength(2);
  });

  it('lista motivo y fecha de cada una', async () => {
    await prepararDatos();
    await tomarInstantaneaEntorno(
      deps({ reloj: () => new Date(2026, 10, 24, 8, 30, 0) }),
      'importar-perfil',
    );
    const [x] = await listarInstantaneasEntorno(deps());
    expect(x).toMatchObject({
      motivo: 'importar-perfil',
      creado: new Date(2026, 10, 24, 8, 30, 0).toISOString(),
    });
  });

  it('no sigue enlaces: un enlace dentro de sites/ no copia lo que hay fuera', async () => {
    await prepararDatos();
    const fuera = path.join(dir, 'fuera.conf');
    await escribir(fuera, CENTINELA);
    try {
      symlinkSync(fuera, path.join(path.dirname(rutas.vhost('x')), 'enlace.conf'));
    } catch {
      return; // sin permiso para crear enlaces (Windows sin modo desarrollador)
    }
    const carpeta = await tomarInstantaneaEntorno(deps(), 'manual');
    expect(await arbol(carpeta)).not.toContain('nginx/sites/enlace.conf');
  });

  it('si algo falla lanza perfiles.instantanea_fallo y no deja una carpeta a medias', async () => {
    await prepararDatos();
    await expect(
      tomarInstantaneaEntorno(
        deps({
          leerConfig: async () => {
            throw new Error('disco ilegible');
          },
        }),
        'actualizar',
      ),
    ).rejects.toMatchObject({ codigo: 'perfiles.instantanea_fallo' });
    const raiz = path.join(rutas.base, 'respaldos', 'entorno');
    expect(existsSync(raiz) ? await readdir(raiz) : []).toEqual([]);
  });

  it('un motivo que no es de la lista se rechaza', async () => {
    await prepararDatos();
    await expect(tomarInstantaneaEntorno(deps(), '../x' as 'manual')).rejects.toMatchObject({
      codigo: 'perfiles.instantanea_fallo',
    });
  });

  it('un archivo enorme (más de 4 MiB) se salta y el resto se copia', async () => {
    await prepararDatos();
    await escribir(rutas.vhost('grande'), 'x'.repeat(4 * 1024 * 1024 + 1));
    const carpeta = await tomarInstantaneaEntorno(deps(), 'manual');
    const rels = await arbol(carpeta);
    expect(rels).not.toContain('nginx/sites/grande.conf');
    expect(rels).toContain('nginx/sites/tienda.conf');
    expect((await stat(carpeta)).isDirectory()).toBe(true);
  });
});
