import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import yauzl from 'yauzl';
import yazl from 'yazl';
import { Almacen } from '../src/almacen';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { Plantillas } from '../src/proyectos/plantillas';
import { GestorEnv } from '../src/proyectos/env/gestor';
import { cifrarConFrase, descifrarConFrase, PARAMETROS_CIFRADO } from '../src/perfiles/cifrado';
import { exportarPerfil } from '../src/perfiles/exportar';
import { Perfiles } from '../src/perfiles/importar';
import {
  EXCLUSIONES_PERFIL,
  rutaPermitidaEnPerfil,
  sitioImportado,
} from '../src/perfiles/manifiesto';
import { reasignarRutas } from '../src/perfiles/reasignar';
import type { DepsPerfiles, OpcionesImportarPerfil } from '../src/perfiles/tipos';
import { Rutas, validarCarpetaDatos } from '../src/rutas';
import { ConfigSchema, SitioSchema, type Config, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const CENTINELA = 'centinela-secreta-d';
const FRASE = 'frase larga de prueba 123';
const CA_CRT = '-----BEGIN CERTIFICATE-----\nMIIBcaFalsa\n-----END CERTIFICATE-----\n';
const CA_KEY = `-----BEGIN RSA PRIVATE KEY-----\n${CENTINELA}-ca\n-----END RSA PRIVATE KEY-----\n`;

let dir: string;
let origen: Rutas;
let destino: Rutas;
let proyectos: string;

/* ───────────── Ayudas ───────────── */

async function escribir(ruta: string, contenido: string | Buffer): Promise<void> {
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, contenido);
}

const sha = (t: string | Buffer): string => createHash('sha256').update(t).digest('hex');

/** Todas las entradas de un ZIP (y de los ZIP que lleva dentro) con su contenido. */
async function entradasZip(fuente: string | Buffer): Promise<Map<string, Buffer>> {
  const zip = await new Promise<yauzl.ZipFile>((res, rej) => {
    const cb = (e: Error | null, z?: yauzl.ZipFile): void => (e || !z ? rej(e) : res(z));
    if (typeof fuente === 'string') yauzl.open(fuente, { lazyEntries: true }, cb);
    else yauzl.fromBuffer(fuente, { lazyEntries: true }, cb);
  });
  const salida = new Map<string, Buffer>();
  await new Promise<void>((res, rej) => {
    zip.on('end', res);
    zip.on('error', rej);
    zip.on('entry', (e: yauzl.Entry) => {
      zip.openReadStream(e, (err, s) => {
        if (err || !s) return rej(err);
        const partes: Buffer[] = [];
        s.on('data', (p: Buffer) => partes.push(p));
        s.on('end', () => {
          salida.set(e.fileName, Buffer.concat(partes));
          zip.readEntry();
        });
      });
    });
    zip.readEntry();
  });
  for (const [n, b] of [...salida]) {
    if (n.endsWith('.zip')) {
      for (const [m, c] of await entradasZip(b)) salida.set(`${n}!${m}`, c);
    }
  }
  return salida;
}

/** ¿Aparece la centinela en el archivo (crudo) o en cualquier entrada descomprimida? */
async function contieneCentinela(archivo: string): Promise<string[]> {
  const hallados: string[] = [];
  if ((await readFile(archivo)).includes(CENTINELA)) hallados.push('(crudo)');
  for (const [n, b] of await entradasZip(archivo)) {
    if (b.includes(CENTINELA) || b.toString('latin1').includes(CENTINELA)) hallados.push(n);
  }
  return hallados;
}

/** Todos los archivos de una carpeta (rutas relativas con `/`). */
async function arbol(raiz: string): Promise<string[]> {
  const res: string[] = [];
  const andar = async (d: string): Promise<void> => {
    for (const h of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      const r = path.join(d, h.name);
      if (h.isDirectory()) await andar(r);
      else res.push(path.relative(raiz, r).replace(/\\/g, '/'));
    }
  };
  await andar(raiz);
  return res.sort();
}

function plantillaJson(id: string): string {
  return JSON.stringify(
    {
      id,
      nombre: 'Base Laravel',
      creada: '2026-11-20T10:00:00.000Z',
      tipo: 'laravel',
      receta: [],
      php: '8.4',
      phpIni: {},
      extensiones: [],
      runtimes: {},
      reglasNginx: null,
      motorBase: null,
      generador: 'laravel',
      moduloAsgi: null,
      conArchivos: false,
      archivoEsquema: null,
      sha256: { archivos: null, esquema: null },
    },
    null,
    2,
  );
}

const versionCatalogo = (
  servicio: string,
  version: string,
  huella: 'fuerte' | 'debil' | 'ninguna',
): VersionDisponible =>
  ({
    servicio,
    version,
    url: `https://ejemplo.invalid/${servicio}-${version}.zip`,
    sha256: huella === 'fuerte' ? 'a'.repeat(64) : null,
    formato: 'zip',
    huella:
      huella === 'fuerte'
        ? { algoritmo: 'sha256', valor: 'a'.repeat(64) }
        : huella === 'debil'
          ? { algoritmo: 'md5', valor: 'b'.repeat(32) }
          : null,
  }) as VersionDisponible;

interface Registro {
  instaladas: string[];
  restauradas: { instancia: string; base: string; archivos: unknown; existe: boolean }[];
  instantaneas: string[];
  usuarios: { instancia: string; base: string; usuario: string; clave: string }[];
  claves: { sitio: string; clave: string }[];
  orden: string[];
  certificados: number;
}

function deps(rutas: Rutas, extra: Partial<DepsPerfiles> = {}): DepsPerfiles & { reg: Registro } {
  const reg: Registro = {
    instaladas: [],
    restauradas: [],
    instantaneas: [],
    usuarios: [],
    claves: [],
    orden: [],
    certificados: 0,
  };
  const almacen = new Almacen(rutas);
  const plantillas = new Plantillas({
    rutas,
    sitio: async () => {
      throw new Error('no se usa');
    },
    receta: async () => [],
    respaldar: async () => {
      throw new Error('no se usa');
    },
  });
  const env = new GestorEnv({
    sitio: async (id) => (await almacen.leer()).sitios.find((s) => s.id === id),
    carpetaRespaldos: () => rutas.respaldosEnv(),
    versionado: async () => false,
    puertos: async () => ({ correo: null, redis: null }),
  });
  const catalogo = new Map<string, VersionDisponible>([
    ['php@8.4.3', versionCatalogo('php', '8.4.3', 'fuerte')],
    ['mysql@8.4.3', versionCatalogo('mysql', '8.4.3', 'fuerte')],
    ['mailpit@1.20.0', versionCatalogo('mailpit', '1.20.0', 'debil')],
  ]);
  const instaladas = new Set<string>();
  const d: DepsPerfiles & { reg: Registro } = {
    reg,
    rutas,
    leerConfig: () => almacen.leer(),
    guardarConfig: (c) => almacen.guardar(c),
    plantillas,
    versionesInstaladas: async () => [
      { servicio: 'php', version: '8.4.3', huella: `sha256:${'a'.repeat(64)}` },
      { servicio: 'mysql', version: '8.4.3', huella: null },
      { servicio: 'mailpit', version: '1.20.0', huella: null },
      { servicio: 'redis', version: '0.0.1-retirada', huella: null },
    ],
    buscarVersion: async (s, v) => catalogo.get(`${s}@${v}`) ?? null,
    versionInstalada: async (s, v) => instaladas.has(`${s}@${v}`),
    instalarVersion: async (v) => {
      reg.instaladas.push(`${v.servicio}@${v.version}`);
      instaladas.add(`${v.servicio}@${v.version}`);
    },
    puertoLibre: async () => true,
    basesParaExportar: async () => [{ instancia: 'mysql@8.4', base: 'tienda' }],
    volcarBase: async (_i, base, carpeta) => {
      await mkdir(carpeta, { recursive: true });
      await writeFile(path.join(carpeta, 'esquema.sql'), `CREATE TABLE ${base}_t (id int);\n`);
      await writeFile(path.join(carpeta, 'datos.sql'), `INSERT INTO ${base}_t VALUES (1);\n`);
      return { esquema: path.join(carpeta, 'esquema.sql'), datos: path.join(carpeta, 'datos.sql') };
    },
    prepararInstancia: async (i) => void reg.orden.push(`preparar:${i}`),
    basesDe: async () => [],
    instantaneaPrevia: async (i, b) => {
      reg.orden.push(`instantanea:${i}/${b}`);
      reg.instantaneas.push(`${i}/${b}`);
    },
    restaurarBase: async (instancia, archivos, base, o) => {
      reg.orden.push(`restaurar:${instancia}/${base}`);
      reg.restauradas.push({ instancia, base, archivos, existe: o.existe });
    },
    crearUsuarioBd: async (instancia, base, usuario, clave) => {
      reg.orden.push(`usuario:${usuario}`);
      reg.usuarios.push({ instancia, base, usuario, clave });
    },
    guardarClaveBd: async (sitio, clave) => {
      reg.orden.push(`clave:${sitio}`);
      reg.claves.push({ sitio, clave });
    },
    ponerUsuarioEnv: async (sitioId, usuario, clave, puerto) => {
      reg.orden.push(`env:${sitioId}`);
      const r = await env.ponerUsuarioBd(sitioId, usuario, clave);
      if (puerto !== null)
        await env.guardar(sitioId, { cambios: { DB_PORT: String(puerto) } }, true);
      return { copia: r.copia };
    },
    regenerarCertificados: async () => void reg.certificados++,
    sistema: 'prueba',
    idCatalogo: 'prueba-x64',
    ...extra,
  };
  return d;
}

/** Equipo de origen con secretos de prueba en todos los lugares donde viven secretos. */
async function prepararOrigen(): Promise<void> {
  const b = origen.base;
  const sitio = (x: Partial<Sitio>): Sitio =>
    SitioSchema.parse({
      nombre: 'Tienda',
      tipo: 'laravel',
      php: '8.4',
      ...x,
    });
  const cfg: Config = ConfigSchema.parse({
    mcp: { activo: true, puerto: 7790 },
    ftp: { redLocal: true },
    sitios: [
      sitio({
        id: 'tienda',
        dominio: 'tienda.test',
        carpeta: 'C:\\Users\\viejo\\proyectos\\tienda',
        https: true,
        confiado: true,
        recetaConfiada: 'a'.repeat(64),
        reglasExtra: `location /x { return 200 "password=${CENTINELA}"; }`,
        phpIni: { memory_limit: '512M', 'mysqli.default_pw': CENTINELA },
        procesos: [
          {
            id: 'cola',
            nombre: 'Cola',
            comando: ['php', 'artisan', 'queue:work', `--password=${CENTINELA}`],
            cwd: 'raiz',
            autoIniciar: true,
            reiniciar: false,
            puerto: null,
            proxy: false,
          },
        ],
        git: { remoto: `https://usuario:${CENTINELA}@github.com/x/tienda.git`, rama: 'main' },
        nota: `API_TOKEN=${CENTINELA}`,
        lan: { activo: true, puerto: 8443, https: true },
        tunel: { proveedor: 'cloudflare-nombre', nombre: 'tienda', dominio: 'tienda.ejemplo.com' },
        ftp: { activo: true, usuario: 'tienda', soloLectura: false },
      }),
      sitio({ id: 'blog', dominio: 'blog.test', carpeta: 'C:\\Users\\viejo\\proyectos\\blog' }),
    ],
  });
  cfg.servicios.datos.mysql.instancias = {
    '8.4': { version: '8.4.3', puerto: 3306, autoIniciar: true },
  };
  cfg.servicios.datos.mysql.predeterminada = '8.4';
  // config.json con un campo que no es del esquema y un nombre de secreto.
  await escribir(origen.config(), JSON.stringify({ ...cfg, apiKey: CENTINELA }, null, 2));
  // Secretos y estado de este equipo (nada de esto puede viajar).
  const secretos: Record<string, string> = {
    'etc/secretos/ia_openai.bin': CENTINELA,
    'etc/secretos/bd_tienda.bin': CENTINELA,
    'etc/secretos/tunel_ngrok.bin': CENTINELA,
    'etc/github.token': CENTINELA,
    'etc/credenciales.json': JSON.stringify({ mcp: { usuario: 'mcp', clave: CENTINELA } }),
    'etc/respaldos/env/env-tienda-20261120-100000-000-abcdef.respaldo': `DB_PASSWORD=${CENTINELA}`,
    'etc/acceso-bd/secreto': CENTINELA,
    'etc/cloudflared/cert.pem': CENTINELA,
    'etc/cloudflared/tienda.yml': `tunnel: ${CENTINELA}`,
    'etc/instantaneas-huellas.json': JSON.stringify({ x: CENTINELA }),
    'etc/venvs-propios.json': JSON.stringify({ x: CENTINELA }),
    'etc/plantillas-propias.json': JSON.stringify({ x: CENTINELA }),
    'etc/nginx/extras/lan-tienda.conf': CENTINELA,
    'etc/nginx/extras/tunel-tienda.conf': CENTINELA,
    'instantaneas/mysql@8.4/tienda/20261120.sql': CENTINELA,
    'papelera/mysql@8.4/tienda/x.sql': CENTINELA,
    'respaldos/auditoria/x.json': CENTINELA,
    'tmp/phpmyadmin/sesiones/sess_x': CENTINELA,
    'run/cloudflared/x.json': CENTINELA,
    'run/cloudflared-login/.cloudflared/cert.pem': CENTINELA,
    'run/cli.json': CENTINELA,
    'run/estado.json': CENTINELA,
    'certs/tienda.key': `-----BEGIN PRIVATE KEY-----\n${CENTINELA}\n-----END PRIVATE KEY-----\n`,
    'certs/tienda.crt': CA_CRT,
    'data/mysql/8.4/ibdata1': CENTINELA,
  };
  for (const [rel, c] of Object.entries(secretos)) await escribir(path.join(b, rel), c);
  await escribir(origen.caCrt(), CA_CRT);
  await escribir(origen.caKey(), CA_KEY);
  // Una plantilla propia (registrada en el origen).
  const texto = plantillaJson('base-laravel-abc123');
  await escribir(path.join(origen.plantillas(), 'base-laravel-abc123', 'plantilla.json'), texto);
  await escribir(
    origen.plantillasPropias(),
    JSON.stringify({ 'base-laravel-abc123': sha(texto), x: CENTINELA }),
  );
}

async function exportar(
  extra: Partial<Parameters<typeof exportarPerfil>[1]> = {},
  d = deps(origen),
): Promise<string> {
  const archivo = path.join(dir, 'salida', 'equipo.wolfperfil');
  await exportarPerfil(d, {
    destino: archivo,
    bases: true,
    certificados: false,
    ca: null,
    ...extra,
  });
  return archivo;
}

/** Perfil armado a mano (para simular uno manipulado). */
async function perfilManual(
  entradas: Record<string, string | Buffer>,
  manifiesto: Record<string, unknown> | null = {},
  declarar: string[] = [],
): Promise<string> {
  const archivo = path.join(dir, `manual-${Math.random().toString(16).slice(2)}.wolfperfil`);
  const zip = new yazl.ZipFile();
  const archivos: Record<string, string> = {};
  for (const r of declarar) archivos[r] = sha(entradas[r]!);
  if (manifiesto) {
    const m = {
      formato: 'wolfcore-perfil',
      version: 1,
      creado: '2026-11-25T00:00:00.000Z',
      origen: { sistema: 'prueba', idCatalogo: 'x' },
      config: {},
      sitios: [],
      versiones: [],
      instancias: [],
      plantillas: [],
      workspaces: [],
      tareas: [],
      incluye: { bases: false, certificados: false, ca: false },
      bases: [],
      archivos,
      ...manifiesto,
    };
    zip.addBuffer(Buffer.from(JSON.stringify(m)), 'manifiesto.json');
  }
  // yazl no deja escribir rutas peligrosas: se escriben con un nombre del mismo largo y se cambia
  // después en los bytes del ZIP (el CRC es del contenido, no del nombre).
  const cambios: [string, string][] = [];
  for (const [n, c] of Object.entries(entradas)) {
    const seguro = n
      .replace(/^\//, 'a')
      .replace(/^([A-Za-z]):/, '$1$1')
      .split('/')
      .map((t) => (t === '..' ? 'aa' : t))
      .join('/');
    if (seguro !== n) cambios.push([seguro, n]);
    zip.addBuffer(Buffer.from(c), seguro);
  }
  zip.end();
  await pipeline(zip.outputStream, createWriteStream(archivo));
  if (cambios.length > 0) {
    let b = await readFile(archivo);
    for (const [de, a] of cambios) {
      const partes: Buffer[] = [];
      let i = 0;
      for (let j = b.indexOf(de); j !== -1; j = b.indexOf(de, i)) {
        partes.push(b.subarray(i, j), Buffer.from(a));
        i = j + de.length;
      }
      partes.push(b.subarray(i));
      b = Buffer.concat(partes);
    }
    await writeFile(archivo, b);
  }
  return archivo;
}

async function importar(
  archivo: string,
  d: DepsPerfiles,
  o: Partial<OpcionesImportarPerfil> = {},
): ReturnType<Perfiles['importar']> {
  const p = new Perfiles(d);
  const vista = await p.vistaPrevia(archivo, { rutas: o.rutas ?? {}, prefijos: o.prefijos ?? [] });
  return p.importar(archivo, {
    rutas: {},
    huella: vista.huella,
    confirmado: true,
    ...o,
  });
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-perfiles-');
  origen = new Rutas(path.join(dir, 'origen'));
  destino = new Rutas(path.join(dir, 'destino'));
  proyectos = path.join(dir, 'proyectos');
  await mkdir(path.join(proyectos, 'tienda'), { recursive: true });
  await prepararOrigen();
});

/* ───────────── Exportar ───────────── */

describe('exportarPerfil: nunca lleva secretos ni estado de este equipo', () => {
  it('la centinela no aparece en ningún lugar del ZIP (crudo, entradas y ZIP internos)', async () => {
    const archivo = await exportar({ ca: { frase: FRASE }, certificados: true });
    expect(await contieneCentinela(archivo)).toEqual([]);
  });

  it('solo lleva rutas de la lista blanca: nada de etc/, run/, tmp/, instantaneas/, papelera/ ni respaldos/', async () => {
    const archivo = await exportar({ ca: { frase: FRASE }, certificados: true });
    const nombres = [...(await entradasZip(archivo)).keys()].filter((n) => !n.includes('!'));
    expect(nombres.sort()).toEqual([
      'bases/mysql@8.4/tienda/datos.sql',
      'bases/mysql@8.4/tienda/esquema.sql',
      'ca.cifrada',
      'manifiesto.json',
      'plantillas/base-laravel-abc123/plantilla.json',
    ]);
    for (const n of nombres) {
      for (const x of EXCLUSIONES_PERFIL) expect(n.startsWith(x)).toBe(false);
    }
  });

  it('los sitios viajan sin red local, FTP, túnel con nombre ni confianza', async () => {
    const archivo = await exportar();
    const m = JSON.parse((await entradasZip(archivo)).get('manifiesto.json')!.toString('utf8'));
    const tienda = m.sitios.find((s: Sitio) => s.id === 'tienda');
    expect(tienda.lan).toBeUndefined();
    expect(tienda.ftp).toBeUndefined();
    expect(tienda.tunel).toBeUndefined();
    expect(tienda.confiado).toBe(false);
    expect(tienda.recetaConfiada).toBeNull();
    expect(tienda.phpIni).toEqual({ memory_limit: '512M' });
    expect(m.config.sitios).toBeUndefined();
    expect(m.config.apiKey).toBeUndefined();
    expect(m.instancias).toEqual([{ id: 'mysql@8.4', version: '8.4.3', puerto: 3306 }]);
    expect(m.plantillas).toEqual(['base-laravel-abc123']);
  });

  it('sin frase la CA no se incluye; los certificados sin la CA se rechazan', async () => {
    const archivo = await exportar();
    const e = await entradasZip(archivo);
    expect(e.has('ca.cifrada')).toBe(false);
    expect(JSON.parse(e.get('manifiesto.json')!.toString()).incluye.ca).toBe(false);
    await expect(exportar({ certificados: true })).rejects.toMatchObject({
      codigo: 'perfiles.certificados_sin_ca',
    });
  });

  it('una frase corta no sirve para cifrar la CA', async () => {
    await expect(exportar({ ca: { frase: 'corta' } })).rejects.toMatchObject({
      codigo: 'perfiles.frase_debil',
    });
  });

  it('el destino debe ser un .wolfperfil absoluto', async () => {
    await expect(
      exportarPerfil(deps(origen), {
        destino: 'perfil.zip',
        bases: false,
        certificados: false,
        ca: null,
      }),
    ).rejects.toMatchObject({ codigo: 'perfiles.destino_invalido' });
  });

  it('una base que no se puede volcar se avisa y el resto sigue', async () => {
    const d = deps(origen, {
      volcarBase: async () => {
        throw new Error(`fallo con password=${CENTINELA}`);
      },
    });
    const archivo = path.join(dir, 'b.wolfperfil');
    const r = await exportarPerfil(d, {
      destino: archivo,
      bases: true,
      certificados: false,
      ca: null,
    });
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).not.toContain(CENTINELA);
    expect([...(await entradasZip(archivo)).keys()].some((n) => n.startsWith('bases/'))).toBe(
      false,
    );
  });
});

/* ───────────── Cifrado de la CA ───────────── */

describe('CA cifrada (scrypt + AES-256-GCM)', () => {
  it('no contiene el PEM en claro y se recupera con la frase', async () => {
    const archivo = await exportar({ ca: { frase: FRASE }, certificados: true });
    const cifrada = (await entradasZip(archivo)).get('ca.cifrada')!;
    expect(cifrada.toString('utf8')).not.toContain('PRIVATE KEY');
    expect(cifrada.toString('utf8')).not.toContain('BEGIN CERTIFICATE');
    const cab = JSON.parse(cifrada.toString('utf8')).cabecera;
    expect(cab.kdf).toMatchObject({ nombre: 'scrypt', N: 2 ** 17, r: 8, p: 1 });
    expect(cab.cifra.nombre).toBe('aes-256-gcm');
    const plano = JSON.parse((await descifrarConFrase(cifrada, FRASE)).toString('utf8'));
    expect(plano.ca).toEqual({ crt: CA_CRT, key: CA_KEY });
    expect(Object.keys(plano.certificados)).toEqual(['tienda']);
  });

  it('frase mala → perfiles.frase_incorrecta; parámetros cambiados → no se descifra', async () => {
    const c = await cifrarConFrase(Buffer.from('hola'), FRASE);
    await expect(descifrarConFrase(c, 'otra frase cualquiera')).rejects.toMatchObject({
      codigo: 'perfiles.frase_incorrecta',
    });
    const j = JSON.parse(c.toString('utf8'));
    j.cabecera.kdf.N = 2 ** 16;
    await expect(descifrarConFrase(Buffer.from(JSON.stringify(j)), FRASE)).rejects.toMatchObject({
      codigo: 'perfiles.frase_incorrecta',
    });
    j.cabecera.kdf.N = 2 ** 30;
    await expect(descifrarConFrase(Buffer.from(JSON.stringify(j)), FRASE)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
    expect(PARAMETROS_CIFRADO.N).toBe(2 ** 17);
  });

  it('al importar, la CA solo se escribe con la frase correcta; mala → nada escrito', async () => {
    const archivo = await exportar({ ca: { frase: FRASE }, certificados: true });
    const d = deps(destino);
    const p = new Perfiles(d);
    const vista = await p.vistaPrevia(archivo, { rutas: {} });
    await expect(
      p.importar(archivo, {
        rutas: {},
        frase: 'frase equivocada!!',
        huella: vista.huella,
        confirmado: true,
      }),
    ).rejects.toMatchObject({ codigo: 'perfiles.frase_incorrecta' });
    expect(existsSync(destino.config())).toBe(false);
    expect(existsSync(destino.caKey())).toBe(false);
    const r = await p.importar(archivo, {
      rutas: {},
      frase: FRASE,
      huella: vista.huella,
      confirmado: true,
    });
    expect(r.ca).toBe('importada');
    expect(await readFile(destino.caKey(), 'utf8')).toBe(CA_KEY);
    expect(existsSync(destino.certKey('tienda'))).toBe(true);
  });

  it('sin frase: CA nueva y certificados regenerados', async () => {
    const archivo = await exportar({ ca: { frase: FRASE } });
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.ca).toBe('nueva');
    expect(existsSync(destino.caKey())).toBe(false);
    expect(d.reg.certificados).toBe(1);
    expect(r.avisos.join(' ')).toMatch(/frase/);
  });
});

/* ───────────── ZIP manipulado ───────────── */

describe('perfil manipulado: se rechaza entero y no se escribe nada', () => {
  const casos: [string, Record<string, string>][] = [
    ['zip-slip con ../', { '../fuera.txt': 'x' }],
    ['zip-slip dentro de una ruta', { 'plantillas/../../fuera.txt': 'x' }],
    ['ruta absoluta', { '/etc/passwd': 'x' }],
    ['unidad de Windows', { 'C:/Windows/x.txt': 'x' }],
    ['flujo alterno', { 'manifiesto.json:oculto': 'x' }],
    ['nombre reservado', { 'plantillas/con/plantilla.json': 'x' }],
    ['tramo que termina en punto', { 'bases/mysql@8.4/x./datos.sql': 'x' }],
  ];
  for (const [nombre, entradas] of casos) {
    it(nombre, async () => {
      const archivo = await perfilManual(entradas);
      await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
        codigo: 'perfiles.danado',
      });
      expect(existsSync(destino.config())).toBe(false);
      expect(existsSync(path.join(dir, 'fuera.txt'))).toBe(false);
    });
  }

  it('huella que no coincide → dañado', async () => {
    const texto = plantillaJson('otra-abc123');
    const archivo = await perfilManual(
      { 'plantillas/otra-abc123/plantilla.json': texto },
      {
        plantillas: ['otra-abc123'],
        archivos: { 'plantillas/otra-abc123/plantilla.json': 'c'.repeat(64) },
      },
    );
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
  });

  it('archivo declarado que falta → dañado; sin manifiesto → dañado', async () => {
    const a = await perfilManual({}, { archivos: { 'ca.cifrada': 'c'.repeat(64) } });
    await expect(new Perfiles(deps(destino)).vistaPrevia(a)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
    const b = await perfilManual({ 'ca.cifrada': 'x' }, null);
    await expect(new Perfiles(deps(destino)).vistaPrevia(b)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
  });

  it('un archivo fuera de la lista blanca declarado en el manifiesto → dañado', async () => {
    const archivo = await perfilManual({ 'etc/instantaneas-huellas.json': '{}' }, {}, [
      'etc/instantaneas-huellas.json',
    ]);
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
  });

  it('versión futura del manifiesto → perfiles.version_no_soportada', async () => {
    const archivo = await perfilManual({}, { version: 2 });
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.version_no_soportada',
    });
  });

  it('topes: demasiadas entradas y un archivo más grande que el tope', async () => {
    const muchas = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`otra/${i}.txt`, 'x']));
    const a = await perfilManual(muchas);
    await expect(
      new Perfiles(deps(destino, { limites: { maxEntradas: 10 } })).vistaPrevia(a),
    ).rejects.toMatchObject({ codigo: 'perfiles.danado' });
    const grande = 'x'.repeat(5000);
    const b = await perfilManual({ 'ca.cifrada': grande }, {}, ['ca.cifrada']);
    await expect(
      new Perfiles(deps(destino, { limites: { maxBytesCa: 1000 } })).vistaPrevia(b),
    ).rejects.toMatchObject({ codigo: 'perfiles.demasiado_grande' });
  });

  it('lo que no es de un perfil (etc/, instantaneas/, run/…) se ignora y nunca se escribe', async () => {
    const ajenas: Record<string, string> = {};
    for (const x of EXCLUSIONES_PERFIL) {
      ajenas[x.endsWith('/') ? `${x}intruso.txt` : x] = CENTINELA;
    }
    ajenas['etc/nginx/extras/lan-tienda.conf'] = CENTINELA;
    ajenas['etc/nginx/extras/tunel-tienda.conf'] = CENTINELA;
    const archivo = await perfilManual(ajenas);
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.ignoradas).toBe(Object.keys(ajenas).length);
    await importar(archivo, d);
    const escrito = await arbol(destino.base);
    expect(escrito).toEqual(['config.json']);
    expect(JSON.stringify(await readFile(destino.config(), 'utf8'))).not.toContain(CENTINELA);
  });

  it('la lista blanca no admite ninguna de las exclusiones', () => {
    for (const x of EXCLUSIONES_PERFIL) {
      expect(rutaPermitidaEnPerfil(x)).toBe(false);
      expect(rutaPermitidaEnPerfil(`${x}a`)).toBe(false);
      expect(rutaPermitidaEnPerfil(`${x}plantilla.json`)).toBe(false);
    }
    expect(rutaPermitidaEnPerfil('instantaneas/mysql@8.4/tienda/esquema.sql')).toBe(false);
    expect(rutaPermitidaEnPerfil('bases/mysql@8.4/tienda/esquema.sql')).toBe(true);
  });
});

/* ───────────── Importar ───────────── */

describe('importarPerfil: todo lo que llega es importado', () => {
  it('plantillas quedan importadas aunque el destino tuviera la misma registrada como propia', async () => {
    const archivo = await exportar();
    const texto = plantillaJson('base-laravel-abc123');
    await escribir(path.join(destino.plantillas(), 'base-laravel-abc123', 'plantilla.json'), texto);
    await escribir(
      destino.plantillasPropias(),
      JSON.stringify({ 'base-laravel-abc123': sha(texto) }),
    );
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.plantillas).toEqual([
      { id: 'base-laravel-abc123', estado: 'importado', motivo: null },
    ]);
    expect((await d.plantillas.cargar('base-laravel-abc123')).origen).toBe('importada');
    const registro = JSON.parse(await readFile(destino.plantillasPropias(), 'utf8'));
    expect(registro['base-laravel-abc123']).toBeUndefined();
    // La propia que había quedó copiada antes.
    expect(
      existsSync(path.join(r.respaldo!, 'plantillas', 'base-laravel-abc123', 'plantilla.json')),
    ).toBe(true);
  });

  it('una plantilla dañada del perfil no se queda y la que había vuelve de su copia', async () => {
    const vieja = plantillaJson('base-x1');
    await escribir(path.join(destino.plantillas(), 'base-x1', 'plantilla.json'), vieja);
    const mala = plantillaJson('otro-id-distinto');
    const archivo = await perfilManual(
      { 'plantillas/base-x1/plantilla.json': mala },
      { plantillas: ['base-x1'] },
      ['plantillas/base-x1/plantilla.json'],
    );
    const r = await importar(archivo, deps(destino));
    expect(r.plantillas).toEqual([{ id: 'base-x1', estado: 'error', motivo: 'plantillas.danada' }]);
    expect(
      await readFile(path.join(destino.plantillas(), 'base-x1', 'plantilla.json'), 'utf8'),
    ).toBe(vieja);
  });

  it('sin el registro en el destino, la plantilla importada nunca se registra como propia', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    await importar(archivo, d);
    expect(existsSync(destino.plantillasPropias())).toBe(false);
    expect((await d.plantillas.cargar('base-laravel-abc123')).origen).toBe('importada');
  });

  it('sitios sin confiar, sin red local ni túnel con nombre, procesos que no arrancan solos y Nginx propio fuera', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    const cfg = await d.leerConfig();
    const tienda = cfg.sitios.find((s) => s.id === 'tienda')!;
    expect(tienda.confiado).toBe(false);
    expect(tienda.recetaConfiada).toBeNull();
    expect(tienda.lan).toBeUndefined();
    expect(tienda.tunel).toBeUndefined();
    expect(tienda.ftp).toBeUndefined();
    expect(tienda.procesos.every((p) => !p.autoIniciar)).toBe(true);
    expect(tienda.vhostDesactivado).toBe('reglas');
    expect(cfg.mcp.activo).toBe(false);
    expect(cfg.ftp.redLocal).toBe(false);
  });

  it('un perfil que trae lan y túnel con nombre (manipulado) tampoco los importa', () => {
    const r = sitioImportado({
      id: 'x',
      nombre: 'X',
      dominio: 'x.test',
      carpeta: '/proyectos/x',
      tipo: 'estatico',
      confiado: true,
      lan: { activo: true, puerto: 9000, https: false },
      tunel: { proveedor: 'cloudflare-nombre', nombre: 'x', dominio: 'x.ejemplo.com' },
      phpIni: { auto_prepend_file: 'C:/malo.php' },
      vhostManual: 'server { root C:/; }',
    });
    expect(r.sitio!.lan).toBeUndefined();
    expect(r.sitio!.tunel).toBeUndefined();
    expect(r.sitio!.confiado).toBe(false);
    expect(r.sitio!.phpIni).toEqual({});
    expect(r.sitio!.vhostDesactivado).toBe('manual');
    expect(r.motivos).toEqual(
      expect.arrayContaining(['tunel_con_nombre', 'php_ini', 'nginx_desactivado']),
    );
    expect(
      sitioImportado({ id: 'y', nombre: 'Y', dominio: 'y.com', carpeta: '/y', tipo: 'estatico' })
        .sitio,
    ).toBeNull();
  });

  it('la centinela no llega a la carpeta de datos del destino', async () => {
    const archivo = await exportar({ ca: { frase: FRASE }, certificados: true });
    await importar(archivo, deps(destino), {
      frase: FRASE,
      rutas: { tienda: path.join(proyectos, 'tienda') },
    });
    for (const rel of await arbol(destino.base)) {
      const c = await readFile(path.join(destino.base, rel));
      // La única excepción es la CA que el usuario eligió traer, cifrada con su frase.
      if (rel === 'ca/wolfcore-dev-ca.key' || rel.startsWith('certs/')) continue;
      expect({ rel, tiene: c.includes(CENTINELA) }).toEqual({ rel, tiene: false });
    }
  });
});

describe('importarPerfil sobre una carpeta con datos: vista previa, confirmación y copia', () => {
  async function destinoConDatos(): Promise<void> {
    const cfg = ConfigSchema.parse({
      sitios: [
        SitioSchema.parse({
          id: 'tienda',
          nombre: 'Tienda vieja',
          dominio: 'tienda.test',
          carpeta: path.join(proyectos, 'tienda'),
          tipo: 'estatico',
        }),
        SitioSchema.parse({
          id: 'propio',
          nombre: 'Propio',
          dominio: 'propio.test',
          carpeta: path.join(proyectos, 'tienda'),
          tipo: 'estatico',
        }),
      ],
    });
    cfg.servicios.datos.mysql.instancias = {
      '8.4': { version: '8.4.3', puerto: 3310, autoIniciar: false },
    };
    await escribir(destino.config(), JSON.stringify(cfg));
    await escribir(
      path.join(destino.base, 'data', 'mysql', '8.4', 'centinela.txt'),
      'datos reales',
    );
    await escribir(path.join(proyectos, 'tienda', 'centinela.txt'), 'proyecto real');
  }

  it('la vista previa dice qué se reemplaza; sin confirmar o con otra vista previa no se toca nada', async () => {
    await destinoConDatos();
    const archivo = await exportar();
    const d = deps(destino, { basesDe: async () => ['tienda'] });
    const p = new Perfiles(d);
    const vista = await p.vistaPrevia(archivo, { rutas: {} });
    expect(vista.carpetaConDatos).toBe(true);
    expect(vista.reemplaza).toEqual(
      expect.arrayContaining(['config.json', 'sitio:tienda', 'base:mysql@8.4/tienda']),
    );
    const antes = await readFile(destino.config(), 'utf8');
    await expect(
      p.importar(archivo, {
        rutas: {},
        huella: vista.huella,
        confirmado: false as unknown as true,
      }),
    ).rejects.toMatchObject({ codigo: 'perfiles.sin_confirmar' });
    await expect(
      p.importar(archivo, { rutas: {}, huella: 'f'.repeat(64), confirmado: true }),
    ).rejects.toMatchObject({ codigo: 'perfiles.vista_previa_vieja' });
    expect(await readFile(destino.config(), 'utf8')).toBe(antes);
  });

  it('copia lo reemplazado, conserva lo propio y nunca borra data/ ni el proyecto', async () => {
    await destinoConDatos();
    const archivo = await exportar();
    const d = deps(destino, { basesDe: async () => ['tienda'] });
    const antes = await readFile(destino.config(), 'utf8');
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.respaldo).toMatch(/respaldos[\\/]pre-perfil-/);
    expect(await readFile(path.join(r.respaldo!, 'config.json'), 'utf8')).toBe(antes);
    expect(
      await readFile(path.join(destino.base, 'data', 'mysql', '8.4', 'centinela.txt'), 'utf8'),
    ).toBe('datos reales');
    expect(await readFile(path.join(proyectos, 'tienda', 'centinela.txt'), 'utf8')).toBe(
      'proyecto real',
    );
    const cfg = await d.leerConfig();
    // El sitio propio que no venía en el perfil sigue; la instancia existente conserva su puerto.
    expect(cfg.sitios.map((s) => s.id).sort()).toEqual(['blog', 'propio', 'tienda']);
    expect(cfg.servicios.datos.mysql.instancias!['8.4']!.puerto).toBe(3310);
    expect(r.instancias).toEqual([
      { id: 'mysql@8.4', estado: 'existente', puerto: 3310, puertoOriginal: 3306 },
    ]);
    // La base existente: instantánea antes de restaurar.
    expect(d.reg.orden.filter((x) => /^(instantanea|restaurar)/.test(x))).toEqual([
      'instantanea:mysql@8.4/tienda',
      'restaurar:mysql@8.4/tienda',
    ]);
    expect(d.reg.restauradas[0]!.existe).toBe(true);
  });

  it('sin instantánea previa la base existente no se reemplaza y el resto sigue', async () => {
    await destinoConDatos();
    const archivo = await exportar();
    const d = deps(destino, {
      basesDe: async () => ['tienda'],
      instantaneaPrevia: async () => {
        throw new Error('disco lleno');
      },
    });
    const r = await importar(archivo, d);
    expect(r.bases).toEqual([
      {
        instancia: 'mysql@8.4',
        base: 'tienda',
        estado: 'error',
        motivo: 'sin_copia_previa: disco lleno',
      },
    ]);
    expect(d.reg.restauradas).toEqual([]);
    expect(r.plantillas[0]!.estado).toBe('importado');
  });
});

describe('importarPerfil en otro equipo: se reasigna, se marca y se sigue', () => {
  it('sitio cuya carpeta no existe queda pendiente y el resto se importa', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.sitios.find((s) => s.id === 'tienda')!.estado).toBe('importado');
    const blog = r.sitios.find((s) => s.id === 'blog')!;
    expect(blog.estado).toBe('pendiente');
    expect(blog.motivos).toContain('carpeta_no_existe');
    const cfg = await d.leerConfig();
    expect(cfg.sitios.find((s) => s.id === 'blog')!.pendiente).toBe('carpeta');
    expect(cfg.sitios.find((s) => s.id === 'tienda')!.pendiente).toBeUndefined();
  });

  it('rutas de otro usuario se reasignan por prefijo', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    await mkdir(path.join(proyectos, 'blog'), { recursive: true });
    const r = await importar(archivo, d, {
      prefijos: [{ viejo: 'C:\\Users\\viejo\\proyectos', nuevo: proyectos }],
    });
    expect(r.sitios.find((s) => s.id === 'blog')).toMatchObject({
      estado: 'importado',
      carpeta: path.join(proyectos, 'blog'),
    });
  });

  it('una ruta del perfil que es del sistema no se importa (salvo que el usuario la elija)', async () => {
    const archivo = await perfilManual(
      {},
      {
        sitios: [
          {
            id: 'malo',
            nombre: 'M',
            dominio: 'malo.test',
            carpeta: 'C:\\Windows\\System32',
            tipo: 'estatico',
          },
          { id: 'malo2', nombre: 'M', dominio: 'malo2.test', carpeta: '/etc', tipo: 'estatico' },
        ],
      },
    );
    const r = await importar(archivo, deps(destino));
    expect(r.sitios.map((s) => [s.id, s.estado, s.motivos[0]])).toEqual([
      ['malo', 'omitido', 'ruta_protegida'],
      ['malo2', 'omitido', 'ruta_protegida'],
    ]);
  });

  it('versión sin huella fuerte queda pendiente; fuera del catálogo, pendiente; con huella, se instala', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.versiones.find((v) => v.servicio === 'mailpit')).toMatchObject({
      disponible: true,
      huella: 'debil',
    });
    const r = await importar(archivo, d);
    expect(r.versiones).toEqual(
      expect.arrayContaining([
        { servicio: 'php', version: '8.4.3', estado: 'instalada', motivo: null },
        { servicio: 'mysql', version: '8.4.3', estado: 'instalada', motivo: null },
        { servicio: 'mailpit', version: '1.20.0', estado: 'pendiente', motivo: 'huella_debil' },
        {
          servicio: 'redis',
          version: '0.0.1-retirada',
          estado: 'pendiente',
          motivo: 'no_disponible',
        },
      ]),
    );
    expect(d.reg.instaladas.sort()).toEqual(['mysql@8.4.3', 'php@8.4.3']);
  });

  it('las bases de una versión pendiente quedan pendientes (no se restaura nada)', async () => {
    const archivo = await exportar();
    const d = deps(destino, { buscarVersion: async () => null });
    const r = await importar(archivo, d);
    expect(r.bases).toEqual([
      { instancia: 'mysql@8.4', base: 'tienda', estado: 'pendiente', motivo: 'version_pendiente' },
    ]);
    expect(d.reg.restauradas).toEqual([]);
  });

  it('puerto ocupado: la instancia se reasigna a uno libre y se informa', async () => {
    const archivo = await exportar();
    const d = deps(destino, { puertoLibre: async (p) => p !== 3306 });
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.puertosOcupados).toEqual([3306]);
    expect(vista.instancias).toEqual([
      { id: 'mysql@8.4', puerto: 3306, puertoNuevo: 3307, existente: false },
    ]);
    const r = await importar(archivo, d);
    expect(r.instancias).toEqual([
      { id: 'mysql@8.4', estado: 'puerto_reasignado', puerto: 3307, puertoOriginal: 3306 },
    ]);
    const cfg = await d.leerConfig();
    expect(cfg.servicios.datos.mysql.instancias!['8.4']).toEqual({
      version: '8.4.3',
      puerto: 3307,
      autoIniciar: false,
    });
  });

  it('bases restauradas por el camino acotado, instancia preparada antes', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.bases).toEqual([
      { instancia: 'mysql@8.4', base: 'tienda', estado: 'importado', motivo: null },
    ]);
    expect(d.reg.orden.filter((x) => /^(preparar|restaurar)/.test(x))).toEqual([
      'preparar:mysql@8.4',
      'restaurar:mysql@8.4/tienda',
    ]);
    expect(d.reg.restauradas[0]!.existe).toBe(false);
    expect(Object.keys(d.reg.restauradas[0]!.archivos as object).sort()).toEqual([
      'datos',
      'esquema',
    ]);
    expect(d.reg.instantaneas).toEqual([]);
    // instantaneas/ y papelera/ no se crean ni se tocan.
    expect(existsSync(path.join(destino.base, 'instantaneas'))).toBe(false);
    expect(existsSync(path.join(destino.base, 'papelera'))).toBe(false);
    expect(existsSync(path.join(destino.base, 'etc', 'instantaneas-huellas.json'))).toBe(false);
  });

  it('una instancia que no enciende deja su base pendiente y no corta lo demás', async () => {
    const archivo = await exportar();
    const d = deps(destino, {
      prepararInstancia: async () => {
        throw new Error('no arranca');
      },
    });
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.bases[0]).toMatchObject({ estado: 'pendiente' });
    expect(r.sitios.find((s) => s.id === 'tienda')!.estado).toBe('importado');
  });
});

describe('usuarios propios (wolf_u_): clave nueva y .env con copia previa', () => {
  const CLAVE_ORIGEN = 'clave-del-equipo-de-origen';

  async function envTienda(puerto = 3306): Promise<void> {
    await escribir(
      path.join(proyectos, 'tienda', '.env'),
      [
        'APP_NAME=Tienda',
        'DB_CONNECTION=mysql',
        'DB_HOST=127.0.0.1',
        `DB_PORT=${puerto}`,
        'DB_DATABASE=tienda',
        'DB_USERNAME=wolf_u_tienda',
        `DB_PASSWORD=${CLAVE_ORIGEN}`,
        '',
      ].join('\n'),
    );
  }

  it('el proyecto marcado recrea su usuario con una clave nueva y reescribe el .env (con copia)', async () => {
    await envTienda();
    const archivo = await exportar();
    const d = deps(destino);
    const r = await importar(archivo, d, {
      rutas: { tienda: path.join(proyectos, 'tienda') },
      envProyectos: ['tienda'],
    });
    expect(r.env).toEqual([
      { sitioId: 'tienda', estado: 'reescrito', motivo: null, copia: expect.any(String) },
    ]);
    const [u] = d.reg.usuarios;
    expect(u).toMatchObject({ instancia: 'mysql@8.4', base: 'tienda', usuario: 'wolf_u_tienda' });
    expect(u!.clave).not.toBe(CLAVE_ORIGEN);
    expect(u!.clave.length).toBeGreaterThanOrEqual(20);
    expect(d.reg.claves).toEqual([{ sitio: 'tienda', clave: u!.clave }]);
    // La clave se guarda antes de crear el usuario y escribir el .env.
    expect(d.reg.orden.filter((x) => /^(clave|usuario|env):/.test(x))).toEqual([
      'clave:tienda',
      'usuario:wolf_u_tienda',
      'env:tienda',
    ]);
    const env = await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8');
    expect(env).toContain(`DB_PASSWORD=${u!.clave}`);
    expect(env).not.toContain(CLAVE_ORIGEN);
    const copias = await readdir(destino.respaldosEnv());
    expect(copias).toHaveLength(1);
    expect(await readFile(path.join(destino.respaldosEnv(), copias[0]!), 'utf8')).toContain(
      CLAVE_ORIGEN,
    );
  });

  it('con el puerto de la instancia reasignado, el .env apunta al puerto nuevo', async () => {
    await envTienda();
    const archivo = await exportar();
    const d = deps(destino, { puertoLibre: async (p) => p !== 3306 });
    await importar(archivo, d, {
      rutas: { tienda: path.join(proyectos, 'tienda') },
      envProyectos: ['tienda'],
    });
    expect(await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8')).toContain(
      'DB_PORT=3307',
    );
  });

  it('un proyecto no marcado no se toca y queda informado', async () => {
    await envTienda();
    const archivo = await exportar();
    const antes = await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8');
    const d = deps(destino);
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.env).toEqual([{ sitioId: 'tienda', estado: 'sin_marcar', motivo: null, copia: null }]);
    expect(d.reg.usuarios).toEqual([]);
    expect(await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8')).toBe(antes);
  });
});

/* ───────────── Rutas ───────────── */

describe('reasignarRutas', () => {
  const s = (id: string, carpeta: string): Sitio =>
    SitioSchema.parse({ id, nombre: id, dominio: `${id}.test`, carpeta, tipo: 'estatico' });

  it('prefijo común (otra unidad, otro usuario), el más largo gana y el elegido manda', () => {
    const r = reasignarRutas(
      [
        s('a', 'C:\\Users\\viejo\\proyectos\\a'),
        s('b', 'c:\\users\\VIEJO\\otros\\b'),
        s('c', 'C:\\Users\\viejo\\proyectos\\c'),
        s('d', '/home/viejo/dev/d'),
        s('e', 'E:\\fuera\\e'),
      ],
      { c: 'F:\\elegida\\c' },
      [
        { viejo: 'C:\\Users\\viejo\\', nuevo: 'D:\\dev\\' },
        { viejo: 'C:\\Users\\viejo\\proyectos', nuevo: 'D:\\proyectos' },
        { viejo: '/home/viejo', nuevo: '/home/nuevo' },
      ],
    );
    expect(r.map((x) => x.carpeta)).toEqual([
      'D:\\proyectos\\a',
      'D:\\dev\\otros\\b',
      'F:\\elegida\\c',
      '/home/nuevo/dev/d',
      'E:\\fuera\\e',
    ]);
  });

  it('en POSIX distingue mayúsculas', () => {
    const r = reasignarRutas([s('a', '/Home/viejo/a')], {}, [
      { viejo: '/home/viejo', nuevo: '/x' },
    ]);
    expect(r[0]!.carpeta).toBe('/Home/viejo/a');
  });
});

describe('validarCarpetaDatos (WOLFCORE_DATOS)', () => {
  const REAL = 'C:\\Users\\yo\\AppData\\Local\\WolfCoreDev';

  it('acepta una carpeta absoluta que no es del sistema ni la real', () => {
    expect(validarCarpetaDatos('D:\\pruebas\\wolf\\', REAL)).toBe('D:\\pruebas\\wolf');
    expect(validarCarpetaDatos('C:\\Users\\yo\\AppData\\Local\\WolfCoreDev-prueba', REAL)).toBe(
      'C:\\Users\\yo\\AppData\\Local\\WolfCoreDev-prueba',
    );
    expect(validarCarpetaDatos('/tmp/wolf-prueba', '/home/yo/.local/share/WolfCoreDev')).toBe(
      '/tmp/wolf-prueba',
    );
  });

  it('rechaza rutas relativas, de red, del sistema y la carpeta real', () => {
    for (const mala of [
      'datos',
      '.\\datos',
      '\\\\servidor\\datos',
      'C:',
      'C:\\',
      'C:\\Windows\\Temp\\x',
      'C:\\Program Files\\WolfCore',
      'C:\\ProgramData\\x',
      'C:\\Users',
      'C:\\Users\\yo',
      'D:\\x\\..\\..\\Windows',
      '/',
      '/etc/wolf',
      '/usr/local/wolf',
      '/home/yo',
      REAL,
      `${REAL}\\sub`,
      'c:\\users\\yo\\appdata\\local\\wolfcoredev\\',
      'C:\\Users\\yo\\AppData',
    ]) {
      expect(() => validarCarpetaDatos(mala, REAL), mala).toThrow(
        expect.objectContaining({ codigo: 'perfiles.carpeta_datos_invalida' }),
      );
    }
  });
});

it('el perfil exportado no depende del tamaño: bytes coinciden con el archivo', async () => {
  const archivo = path.join(dir, 'x.wolfperfil');
  const r = await exportarPerfil(deps(origen), {
    destino: archivo,
    bases: false,
    certificados: false,
    ca: null,
  });
  expect(r.bytes).toBe((await stat(archivo)).size);
});
