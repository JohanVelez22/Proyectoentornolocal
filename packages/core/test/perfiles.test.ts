import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readFileSync, symlinkSync } from 'node:fs';
import { mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import yauzl from 'yauzl';
import yazl from 'yazl';
import { Almacen } from '../src/almacen';
import { ErrorWolf } from '../src/errores';
import { errorUsuarioEnUso } from '../src/bd/clienteMysql';
import {
  derRestricciones,
  generarCA,
  huellaSha1,
  huellaSha256,
  type ParCertificado,
} from '../src/https/ca';
import { generateKeyPairSync } from 'node:crypto';
import forge from 'node-forge';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { Plantillas } from '../src/proyectos/plantillas';
import { GestorEnv } from '../src/proyectos/env/gestor';
import {
  cifrarConFrase,
  descifrarConFrase,
  LlaveFrase,
  PARAMETROS_CIFRADO,
} from '../src/perfiles/cifrado';
import { exportarPerfil } from '../src/perfiles/exportar';
import {
  estadoCaVista,
  MAX_INSTALAR_POR_PERFIL,
  Perfiles,
  tamanoLegible,
} from '../src/perfiles/importar';
import {
  EXCLUSIONES_PERFIL,
  rutaPermitidaEnPerfil,
  sitioImportado,
} from '../src/perfiles/manifiesto';
import { reasignarRutas } from '../src/perfiles/reasignar';
import { enmascararComando, enmascararNginx } from '../src/perfiles/secretos';
import { enmascararSecretos } from '../src/patronesSecretos';
import type { DepsPerfiles, OpcionesImportarPerfil } from '../src/perfiles/tipos';
import { Rutas, validarCarpetaDatos } from '../src/rutas';
import { ConfigSchema, SitioSchema, type Config, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

// scrypt (N = 2^17) es caro a propósito: con las pruebas en paralelo, más margen.
vi.setConfig({ testTimeout: 60_000 });

const CENTINELA = 'centinela-secreta-d';
const FRASE = 'frase larga de prueba 123';
/** CA de verdad (con las restricciones de WolfCore Dev): la vista previa lee su certificado. */
const CA = generarCA();
const CA_CRT = CA.certPem;
const CA_KEY = CA.keyPem;

/** CA de prueba armada a mano: sin restricciones de nombre (como las anteriores a D26) u otras. */
function caPrueba(restricciones: 'ninguna' | 'ajenas' | 'nuestras-no-criticas'): ParCertificado {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privada = forge.pki.privateKeyFromPem(
    privateKey.export({ type: 'pkcs1', format: 'pem' }) as string,
  ) as forge.pki.rsa.PrivateKey;
  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.setRsaPublicKey(privada.n, privada.e);
  cert.serialNumber = '4a01';
  cert.validity.notBefore = new Date(Date.now() - 86_400_000);
  cert.validity.notAfter = new Date(Date.now() + 365 * 86_400_000);
  const sujeto = [{ name: 'commonName', value: 'CA de otro equipo' }];
  cert.setSubject(sujeto);
  cert.setIssuer(sujeto);
  const ext: object[] = [{ name: 'basicConstraints', cA: true, critical: true }];
  if (restricciones === 'ajenas') {
    const A = forge.asn1;
    const solo = A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, [
      A.create(A.Class.CONTEXT_SPECIFIC, 0, true, [
        A.create(A.Class.UNIVERSAL, A.Type.SEQUENCE, true, [
          A.create(A.Class.CONTEXT_SPECIFIC, 2, false, 'com'),
        ]),
      ]),
    ]);
    ext.push({ id: '2.5.29.30', critical: true, value: A.toDer(solo).getBytes() });
  } else if (restricciones === 'nuestras-no-criticas') {
    ext.push({ id: '2.5.29.30', critical: false, value: derRestricciones() });
  }
  cert.setExtensions(ext);
  cert.sign(privada, forge.md.sha256.create());
  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(privada),
  };
}

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
  restauradas: {
    instancia: string;
    base: string;
    archivos: unknown;
    existe: boolean;
    textos: string[];
  }[];
  instantaneas: string[];
  usuarios: {
    instancia: string;
    base: string;
    usuario: string;
    clave: string;
    cambiarClave: boolean;
  }[];
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
      reg.restauradas.push({
        instancia,
        base,
        archivos,
        existe: o.existe,
        textos: Object.values(archivos).map((f: string) => readFileSync(f, 'utf8')),
      });
    },
    crearUsuarioBd: async (instancia, base, usuario, clave, o) => {
      reg.orden.push(`usuario:${usuario}`);
      reg.usuarios.push({ instancia, base, usuario, clave, cambiarClave: o.cambiarClave });
    },
    claveCompartida: async () => null,
    guardarClaveBd: async (sitio, clave) => {
      reg.orden.push(`clave:${sitio}`);
      reg.claves.push({ sitio, clave });
    },
    ponerUsuarioEnv: async (sitioId, usuario, clave, puerto, antes) => {
      reg.orden.push(`env:${sitioId}`);
      const r = await env.ponerUsuarioBd(sitioId, usuario, clave, { antes });
      if (puerto !== null)
        await env.guardar(sitioId, { cambios: { DB_PORT: String(puerto) } }, true);
      return { copia: r.copia };
    },
    regenerarCertificados: async () => void reg.certificados++,
    instantaneaEntorno: async () => '',
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
    correo: {
      proveedores: [
        {
          id: 'gmail',
          nombre: 'Gmail',
          host: 'smtp.gmail.com',
          puerto: 465,
          seguridad: 'tls',
          usuario: `${CENTINELA}@gmail.com`,
        },
        {
          id: 'resend',
          nombre: 'Resend',
          host: 'smtp.resend.com',
          puerto: 465,
          seguridad: 'tls',
          usuario: 'resend',
        },
      ],
    },
    ftp: { redLocal: true },
    sitios: [
      sitio({
        id: 'tienda',
        dominio: 'tienda.test',
        carpeta: 'C:\\Users\\viejo\\proyectos\\tienda',
        https: true,
        confiado: true,
        recetaConfiada: 'a'.repeat(64),
        // Secretos sin forma reconocible: el valor de directivas con nombre de secreto.
        reglasExtra: [
          `location /x { return 200 "password=${CENTINELA}"; }`,
          `fastcgi_param DB_PASSWORD ${CENTINELA}-1;`,
          `proxy_set_header X-Api-Key "${CENTINELA}-2";`,
          `proxy_set_header Authorization ${CENTINELA}-3;`,
          `set $stripe_secret ${CENTINELA}-4;`,
          `env MAIL_PASSWORD=${CENTINELA}-5;`,
          'fastcgi_param APP_ENV local;',
        ].join(String.fromCharCode(10)),
        phpIni: { memory_limit: '512M', 'mysqli.default_pw': CENTINELA },
        procesos: [
          {
            id: 'cola',
            nombre: 'Cola',
            comando: [
              'php',
              'artisan',
              'queue:work',
              `--password=${CENTINELA}`,
              '--token',
              `${CENTINELA}-6`,
              `--api-key=${CENTINELA}-7`,
              '-p3000',
            ],
            cwd: 'raiz',
            autoIniciar: true,
            reiniciar: false,
            puerto: null,
            proxy: false,
          },
        ],
        // D29: una tarea ya confirmada en el origen; no debe viajar (comando de otro equipo).
        tareas: [
          {
            id: 'schedule',
            nombre: 'Schedule',
            cron: '* * * * *',
            comando: ['php', 'artisan', 'schedule:run', `--token=${CENTINELA}-9`],
            activa: true,
            confirmada: 'c'.repeat(64),
            tiempoMaxS: 300,
            origen: 'usuario',
          },
        ],
        git: { remoto: `https://usuario:${CENTINELA}@github.com/x/tienda.git`, rama: 'main' },
        nota: `password: ${CENTINELA}-8`,
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
    ca: false,
    frase: FRASE,
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
    frase: FRASE,
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
    const archivo = await exportar({ ca: true, certificados: true });
    expect(await contieneCentinela(archivo)).toEqual([]);
  });

  it('solo lleva rutas de la lista blanca: nada de etc/, run/, tmp/, instantaneas/, papelera/ ni respaldos/', async () => {
    const archivo = await exportar({ ca: true, certificados: true });
    const nombres = [...(await entradasZip(archivo)).keys()].filter((n) => !n.includes('!'));
    expect(nombres.sort()).toEqual([
      'bases/mysql@8.4/tienda/datos.sql.cifrado',
      'bases/mysql@8.4/tienda/esquema.sql.cifrado',
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
    // Lo que no es secreto sigue igual (un puerto pegado, una variable cualquiera).
    expect(tienda.procesos[0].comando).toEqual([
      'php',
      'artisan',
      'queue:work',
      '--password=***',
      '--token',
      '***',
      '--api-key=***',
      '-p3000',
    ]);
    expect(tienda.reglasExtra).toContain('fastcgi_param APP_ENV local;');
    expect(tienda.reglasExtra).toContain('fastcgi_param DB_PASSWORD "***";');
    expect(tienda.nota).toBe('');
    // El usuario SMTP no viaja (salvo el fijo de un proveedor conocido).
    expect(m.config.correo.proveedores).toEqual([
      { id: 'gmail', nombre: 'Gmail', host: 'smtp.gmail.com', puerto: 465, seguridad: 'tls' },
      {
        id: 'resend',
        nombre: 'Resend',
        host: 'smtp.resend.com',
        puerto: 465,
        seguridad: 'tls',
        usuario: 'resend',
      },
    ]);
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
    await expect(exportar({ ca: true, frase: 'corta' })).rejects.toMatchObject({
      codigo: 'perfiles.frase_debil',
    });
  });

  it('el destino debe ser un .wolfperfil absoluto', async () => {
    await expect(
      exportarPerfil(deps(origen), {
        destino: 'perfil.zip',
        bases: false,
        certificados: false,
        ca: false,
        frase: FRASE,
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
      ca: false,
      frase: FRASE,
    });
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]!.codigo).toBe('base_no_incluida');
    expect(JSON.stringify(r.avisos)).not.toContain(CENTINELA);
    expect([...(await entradasZip(archivo)).keys()].some((n) => n.startsWith('bases/'))).toBe(
      false,
    );
  });
});

/* ───────────── Cifrado de la CA ───────────── */

describe('CA cifrada (scrypt + AES-256-GCM)', () => {
  it('no contiene el PEM en claro y se recupera con la frase', async () => {
    const archivo = await exportar({ ca: true, certificados: true });
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
    for (const n of [2 ** 30, 2 ** 19]) {
      j.cabecera.kdf.N = n;
      await expect(descifrarConFrase(Buffer.from(JSON.stringify(j)), FRASE)).rejects.toMatchObject({
        codigo: 'perfiles.danado',
      });
    }
    expect(PARAMETROS_CIFRADO.N).toBe(2 ** 17);
  });

  it('archivos grandes en flujo: se recuperan con la frase; con otra o cambiados, nada queda escrito', async () => {
    const claro = path.join(dir, 'claro.sql');
    const datos = Buffer.alloc(3 * 1024 * 1024 + 7, 'INSERT INTO t VALUES (1);');
    await writeFile(claro, datos);
    const cifrado = path.join(dir, 'claro.sql.cifrado');
    const llave = new LlaveFrase(FRASE);
    await llave.cifrarArchivo(claro, cifrado);
    expect((await readFile(cifrado)).includes(Buffer.from('INSERT INTO'))).toBe(false);
    const vuelta = path.join(dir, 'vuelta.sql');
    await new LlaveFrase(FRASE).descifrarArchivo(cifrado, vuelta, 10 * 1024 * 1024);
    expect((await readFile(vuelta)).equals(datos)).toBe(true);
    const mala = path.join(dir, 'mala.sql');
    await expect(
      new LlaveFrase('otra frase cualquiera').descifrarArchivo(cifrado, mala, 10 * 1024 * 1024),
    ).rejects.toMatchObject({ codigo: 'perfiles.frase_incorrecta' });
    expect(existsSync(mala)).toBe(false);
    const b = await readFile(cifrado);
    b[b.length - 100]! ^= 1;
    await writeFile(cifrado, b);
    await expect(
      new LlaveFrase(FRASE).descifrarArchivo(cifrado, mala, 10 * 1024 * 1024),
    ).rejects.toMatchObject({ codigo: 'perfiles.frase_incorrecta' });
    expect(existsSync(mala)).toBe(false);
    // Un tope menor que el contenido corta (sin dejar el archivo).
    await llave.cifrarArchivo(claro, path.join(dir, 'otro.cifrado'));
    await expect(
      new LlaveFrase(FRASE).descifrarArchivo(path.join(dir, 'otro.cifrado'), mala, 1024),
    ).rejects.toMatchObject({ codigo: 'perfiles.danado' });
    expect(existsSync(mala)).toBe(false);
  });

  it('una sola sal por perfil: un volcado con otra sal se rechaza', async () => {
    const claro = path.join(dir, 'x.sql');
    await writeFile(claro, 'INSERT INTO t VALUES (1);');
    await new LlaveFrase(FRASE).cifrarArchivo(claro, path.join(dir, 'a.cifrado'));
    await new LlaveFrase(FRASE).cifrarArchivo(claro, path.join(dir, 'b.cifrado'));
    const llave = new LlaveFrase(FRASE);
    await llave.descifrarArchivo(path.join(dir, 'a.cifrado'), path.join(dir, 'a.sql'), 1024);
    await expect(
      llave.descifrarArchivo(path.join(dir, 'b.cifrado'), path.join(dir, 'b.sql'), 1024),
    ).rejects.toMatchObject({ codigo: 'perfiles.danado' });
    expect(existsSync(path.join(dir, 'b.sql'))).toBe(false);
  });

  it('al importar, la CA solo se escribe con la frase correcta; mala → nada escrito', async () => {
    const archivo = await exportar({ ca: true, certificados: true });
    const d = deps(destino);
    const p = new Perfiles(d);
    const vista = await p.vistaPrevia(archivo, { rutas: {} });
    await expect(
      p.importar(archivo, {
        rutas: {},
        frase: 'frase equivocada!!',
        importarCa: true,
        huella: vista.huella,
        confirmado: true,
      }),
    ).rejects.toMatchObject({ codigo: 'perfiles.frase_incorrecta' });
    expect(existsSync(destino.config())).toBe(false);
    expect(existsSync(destino.caKey())).toBe(false);
    const r = await p.importar(archivo, {
      rutas: {},
      frase: FRASE,
      importarCa: true,
      huella: vista.huella,
      confirmado: true,
    });
    expect(r.ca).toBe('importada');
    expect(await readFile(destino.caKey(), 'utf8')).toBe(CA_KEY);
    expect(existsSync(destino.certKey('tienda'))).toBe(true);
  });

  it('la vista previa muestra la huella de la CA ajena; reemplazar la local exige confirmarlo aparte', async () => {
    const archivo = await exportar({ ca: true });
    await escribir(destino.caCrt(), 'CA local');
    await escribir(destino.caKey(), 'clave local');
    const d = deps(destino);
    const p = new Perfiles(d);
    const vista = await p.vistaPrevia(archivo);
    expect(vista.ca).toEqual({
      huella: huellaSha256(CA_CRT),
      reemplazaLocal: true,
      restringida: true,
      restriccionesAjenas: false,
    });
    await expect(
      p.importar(archivo, {
        rutas: {},
        frase: FRASE,
        importarCa: true,
        huella: vista.huella,
        confirmado: true,
      }),
    ).rejects.toMatchObject({ codigo: 'perfiles.confirmar_reemplazar_ca' });
    expect(existsSync(destino.config())).toBe(false);
    expect(await readFile(destino.caKey(), 'utf8')).toBe('clave local');
    const r = await p.importar(archivo, {
      rutas: {},
      frase: FRASE,
      importarCa: true,
      reemplazarCa: true,
      huella: vista.huella,
      confirmado: true,
    });
    expect(r.ca).toBe('importada');
    expect(JSON.stringify(r.avisos)).not.toMatch(/instal/i);
    // La clave vieja no queda en claro: va cifrada con la frase.
    expect(existsSync(path.join(r.respaldo!, 'ca', 'wolfcore-dev-ca.key'))).toBe(false);
    const claves = JSON.parse(
      (
        await descifrarConFrase(
          await readFile(path.join(r.respaldo!, 'ca', 'claves.cifrado')),
          FRASE,
        )
      ).toString('utf8'),
    ) as Record<string, string>;
    expect(Buffer.from(claves['wolfcore-dev-ca.key']!, 'base64').toString()).toBe('clave local');
  });

  it('una CA cifrada que no coincide con la huella del manifiesto → dañado', async () => {
    const otra = await cifrarConFrase(
      Buffer.from(
        JSON.stringify({
          ca: { crt: generarCA().certPem, key: CA_KEY },
          certificados: {},
        }),
      ),
      FRASE,
    );
    const archivo = await perfilManual(
      { 'ca.cifrada': otra },
      {
        incluye: { bases: false, certificados: false, ca: true },
        ca: { huella: huellaSha256(CA_CRT), certificado: CA_CRT },
      },
      ['ca.cifrada'],
    );
    await expect(
      importar(archivo, deps(destino), { frase: FRASE, importarCa: true }),
    ).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
    expect(existsSync(destino.caKey())).toBe(false);
  });

  /** Exporta un perfil cuya CA (la del origen) es `par`. */
  async function conCa(par: ParCertificado): Promise<string> {
    await escribir(origen.caCrt(), par.certPem);
    await escribir(origen.caKey(), par.keyPem);
    return exportar({ ca: true, bases: false });
  }

  it('CA sin restricciones (anterior a D26): solo con la confirmación aparte', async () => {
    const vieja = caPrueba('ninguna');
    const archivo = await conCa(vieja);
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.ca).toMatchObject({ restringida: false, restriccionesAjenas: false });
    await expect(importar(archivo, d, { importarCa: true })).rejects.toMatchObject({
      codigo: 'perfiles.ca_sin_restricciones',
    });
    expect(existsSync(destino.config())).toBe(false);
    expect(existsSync(destino.caKey())).toBe(false);
    const r = await importar(archivo, d, { importarCa: true, aceptarCaSinRestricciones: true });
    expect(r.ca).toBe('importada');
    expect(await readFile(destino.caCrt(), 'utf8')).toBe(vieja.certPem);
  });

  it('CA con restricciones que no son las nuestras (o sin marcar críticas): nunca', async () => {
    for (const tipo of ['ajenas', 'nuestras-no-criticas'] as const) {
      const archivo = await conCa(caPrueba(tipo));
      const d = deps(new Rutas(path.join(dir, `destino-${tipo}`)));
      const vista = await new Perfiles(d).vistaPrevia(archivo);
      expect(vista.ca).toMatchObject({ restringida: false, restriccionesAjenas: true });
      await expect(
        importar(archivo, d, { importarCa: true, aceptarCaSinRestricciones: true }),
      ).rejects.toMatchObject({ codigo: 'perfiles.ca_restricciones_ajenas' });
    }
  });

  it('el certificado de la CA del manifiesto debe ser el de su huella', async () => {
    const archivo = await perfilManual(
      {},
      {
        incluye: { bases: false, certificados: false, ca: true },
        ca: { huella: huellaSha256(CA_CRT), certificado: caPrueba('ninguna').certPem },
      },
    );
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
  });

  it('la CA no se importa si no se pide (aunque se dé la frase): CA nueva y certificados regenerados', async () => {
    const archivo = await exportar({ ca: true });
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.ca).toBe('nueva');
    expect(existsSync(destino.caKey())).toBe(false);
    expect(d.reg.certificados).toBe(1);
    expect(r.avisos).toEqual([{ codigo: 'ca_no_importada' }]);
  });

  it('bases cifradas: sin frase se pide (o se omiten); con frase mala no se toca nada', async () => {
    const archivo = await exportar();
    // Los volcados no van en claro dentro del ZIP.
    const e = await entradasZip(archivo);
    expect(e.get('bases/mysql@8.4/tienda/datos.sql.cifrado')!.toString()).not.toContain('INSERT');
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.requiereFrase).toBe(true);
    await expect(importar(archivo, d, { frase: undefined })).rejects.toMatchObject({
      codigo: 'perfiles.frase_requerida',
    });
    await expect(importar(archivo, d, { frase: 'otra frase distinta' })).rejects.toMatchObject({
      codigo: 'perfiles.frase_incorrecta',
    });
    expect(existsSync(destino.config())).toBe(false);
    const sin = await importar(archivo, d, { frase: undefined, omitirBases: true });
    expect(sin.bases).toEqual([
      { instancia: 'mysql@8.4', base: 'tienda', estado: 'omitido', motivo: 'bases_omitidas' },
    ]);
    expect(d.reg.restauradas).toEqual([]);
  });

  it('las bases solo se exportan con una frase', async () => {
    await expect(exportar({ frase: null })).rejects.toMatchObject({
      codigo: 'perfiles.frase_debil',
    });
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

  it('un volcado de PostgreSQL bajo una instancia de MySQL (o al revés) → dañado', async () => {
    for (const rel of [
      'bases/mysql@8.4/tienda/volcado.dump.cifrado',
      'bases/postgresql@17/tienda/esquema.sql.cifrado',
    ]) {
      const archivo = await perfilManual({ [rel]: 'x' }, {}, [rel]);
      await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
        codigo: 'perfiles.danado',
      });
    }
  });

  it('versión futura del manifiesto → perfiles.version_no_soportada', async () => {
    const archivo = await perfilManual({}, { version: 2 });
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.version_no_soportada',
    });
  });

  it('ZIP inflado: una entrada que se descomprime mucho más de lo que ocupa → dañado', async () => {
    const rel = 'bases/mysql@8.4/tienda/datos.sql.cifrado';
    const bomba = Buffer.alloc(8 * 1024 * 1024);
    const archivo = await perfilManual({ [rel]: bomba }, {}, [rel]);
    expect((await stat(archivo)).size).toBeLessThan(200 * 1024);
    await expect(new Perfiles(deps(destino)).vistaPrevia(archivo)).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
  });

  it('la vista previa no escribe nada en disco (lee el manifiesto y verifica en flujo)', async () => {
    const archivo = await exportar({ ca: true, certificados: true });
    await new Perfiles(deps(destino)).vistaPrevia(archivo);
    expect(await arbol(destino.base)).toEqual([]);
    expect(existsSync(destino.tmp())).toBe(false);
  });

  it('sin espacio libre para extraer, no se importa nada', async () => {
    const archivo = await exportar();
    const d = deps(destino, { espacioLibre: async () => 1024 });
    await expect(importar(archivo, d)).rejects.toMatchObject({
      codigo: 'perfiles.sin_espacio',
      datos: { libres: '1 MB' },
    });
    expect(existsSync(destino.config())).toBe(false);
  });

  it('el tamaño máximo se dice en una unidad legible', async () => {
    const archivo = await exportar();
    await expect(
      new Perfiles(deps(destino, { limites: { maxBytesPerfil: 10 } })).vistaPrevia(archivo),
    ).rejects.toMatchObject({ codigo: 'perfiles.demasiado_grande', datos: { maximo: '1 MB' } });
    expect(tamanoLegible(64 * 1024 * 1024 * 1024)).toBe('64 GB');
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
    expect(rutaPermitidaEnPerfil('bases/mysql@8.4/tienda/esquema.sql.cifrado')).toBe(true);
    expect(rutaPermitidaEnPerfil('bases/postgresql@17/tienda/volcado.dump.cifrado')).toBe(true);
    // Cada motor con su formato, y nunca en claro.
    expect(rutaPermitidaEnPerfil('bases/mysql@8.4/tienda/esquema.sql')).toBe(false);
    expect(rutaPermitidaEnPerfil('bases/mysql@8.4/tienda/volcado.dump.cifrado')).toBe(false);
    expect(rutaPermitidaEnPerfil('bases/postgresql@17/tienda/datos.sql.cifrado')).toBe(false);
    expect(rutaPermitidaEnPerfil('bases/mongodb@7/tienda/volcado.dump.cifrado')).toBe(false);
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
    expect(r.plantillas).toEqual([
      { id: 'base-x1', estado: 'error', motivo: 'plantillas.danada', detalle: expect.any(String) },
    ]);
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
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    const cfg = await d.leerConfig();
    const tienda = cfg.sitios.find((s) => s.id === 'tienda')!;
    expect(tienda.confiado).toBe(false);
    expect(tienda.recetaConfiada).toBeNull();
    expect(tienda.lan).toBeUndefined();
    expect(tienda.tunel).toBeUndefined();
    expect(tienda.ftp).toBeUndefined();
    // Los comandos son de otro equipo: no se importan, y el resultado lo dice.
    expect(tienda.procesos).toEqual([]);
    expect(tienda.origen).toBe('perfil');
    expect(r.sitios.find((s) => s.id === 'tienda')!.motivos).toContain('procesos_quitados');
    // D29: las tareas programadas tampoco llegan (ni activas ni desactivadas; ya no se exportan):
    // el usuario las vuelve a crear, o las adopta desde el wolfcore.yml del proyecto.
    expect(tienda.tareas ?? []).toEqual([]);
    expect(tienda.vhostDesactivado).toBe('reglas');
    expect(cfg.mcp.activo).toBe(false);
    expect(cfg.ftp.redLocal).toBe(false);
  });

  it('un perfil manipulado que trae tareas confirmadas y activas no las importa', () => {
    const r = sitioImportado({
      id: 'x',
      nombre: 'X',
      dominio: 'x.test',
      carpeta: '/proyectos/x',
      tipo: 'estatico',
      tareas: [
        {
          id: 'mala',
          nombre: 'Mala',
          cron: '* * * * *',
          comando: ['php', 'job.php'],
          activa: true,
          confirmada: 'd'.repeat(64),
        },
      ],
    });
    expect(r.sitio!.tareas ?? []).toEqual([]);
    expect(r.motivos).toContain('tareas_quitadas');
  });

  it('un manifiesto que trae tareas se rechaza (las tareas no viajan)', async () => {
    const { ManifiestoPerfilSchema } = await import('../src/perfiles/manifiesto');
    const r = ManifiestoPerfilSchema.shape.tareas.safeParse([{ id: 'x' }]);
    expect(r.success).toBe(false);
    expect(ManifiestoPerfilSchema.shape.tareas.safeParse([]).success).toBe(true);
  });

  it('el perfil exportado no lleva las tareas ni sus comandos', async () => {
    const archivo = await exportar();
    const bruto = (await readFile(archivo)).toString('latin1');
    expect(bruto).not.toContain('schedule:run');
    const { sitioParaPerfil } = await import('../src/perfiles/manifiesto');
    const tienda = (await deps(origen).leerConfig()).sitios.find((x) => x.id === 'tienda')!;
    expect(tienda.tareas).toHaveLength(1);
    expect(sitioParaPerfil(tienda).tareas ?? []).toEqual([]);
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
    const archivo = await exportar({ ca: true, certificados: true });
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
        motivo: 'sin_copia_previa',
        detalle: 'disco lleno',
      },
    ]);
    expect(d.reg.restauradas).toEqual([]);
    expect(r.plantillas[0]!.estado).toBe('importado');
  });
});

describe('copia previa de la CA (revisión D27)', () => {
  const VIEJA = generarCA();
  const CLAVE_SUELTA =
    '-----BEGIN PRIVATE KEY-----\nclave-suelta-centinela\n-----END PRIVATE KEY-----\n';

  async function importarConCaLocal(extra: Partial<DepsPerfiles> = {}) {
    await escribir(destino.caCrt(), VIEJA.certPem);
    await escribir(destino.caKey(), VIEJA.keyPem);
    await escribir(destino.certKey('otro'), CLAVE_SUELTA);
    await escribir(destino.certCrt('otro'), 'crt publico');
    const archivo = await exportar({ ca: true });
    const d = deps(destino, extra);
    const r = await importar(archivo, d, { importarCa: true, reemplazarCa: true });
    return { r, d };
  }

  it('las claves privadas de la CA vieja no quedan en claro y se recuperan con la frase', async () => {
    const restringidas: string[] = [];
    const { r } = await importarConCaLocal({
      restringir: async (ruta) => {
        restringidas.push(ruta);
        return true;
      },
    });
    expect(r.ca).toBe('importada');
    const todos = await arbol(r.respaldo!);
    for (const rel of todos) {
      const t = (await readFile(path.join(r.respaldo!, rel))).toString('latin1');
      expect(t, rel).not.toContain('PRIVATE KEY');
      expect(t, rel).not.toContain('clave-suelta-centinela');
    }
    expect(todos.some((x) => /\.(key|pem)$/i.test(x))).toBe(false);
    // Lo público sí.
    expect(await readFile(path.join(r.respaldo!, 'ca', 'wolfcore-dev-ca.crt'), 'utf8')).toBe(
      VIEJA.certPem,
    );
    const cif = await readFile(path.join(r.respaldo!, 'ca', 'claves.cifrado'));
    const claves = JSON.parse((await descifrarConFrase(cif, FRASE)).toString('utf8')) as Record<
      string,
      string
    >;
    expect(Buffer.from(Object.values(claves)[0]!, 'base64').toString()).toContain('PRIVATE KEY');
    const certs = await readFile(path.join(r.respaldo!, 'certs', 'claves.cifrado'));
    expect((await descifrarConFrase(certs, FRASE)).toString('utf8')).toContain(
      Buffer.from(CLAVE_SUELTA).toString('base64'),
    );
    // La carpeta se restringió antes del primer archivo.
    expect(restringidas).toContain(r.respaldo);
  });

  it('avisa de la CA anterior (con su huella SHA-1) salvo en la carpeta de prueba', async () => {
    const { r } = await importarConCaLocal();
    expect(r.avisos).toContainEqual({
      codigo: 'ca_reemplazada',
      datos: { huella: huellaSha1(VIEJA.certPem) },
    });
    // Un entorno nuevo en otra carpeta, aislado: nada que ofrecer.
    destino = new Rutas(path.join(dir, 'destino2'));
    const { r: r2 } = await importarConCaLocal({ aislado: true });
    expect(r2.avisos.some((a) => a.codigo === 'ca_reemplazada')).toBe(false);
  });

  it('las copias pre-perfil de más de 30 días se borran; las recientes y lo demás, no', async () => {
    const respaldos = path.join(destino.base, 'respaldos');
    await escribir(path.join(respaldos, 'pre-perfil-2020-01-01T00-00-00-000Z', 'config.json'), 'x');
    await escribir(path.join(respaldos, 'pre-perfil-2026-11-20T00-00-00-000Z', 'config.json'), 'x');
    await escribir(path.join(respaldos, 'auditoria', 'a.json'), 'x');
    await escribir(path.join(respaldos, 'entorno', 'otra', 'a.txt'), 'x');
    await escribir(destino.config(), JSON.stringify(ConfigSchema.parse({ sitios: [] })));
    const archivo = await exportar();
    const reloj = () => new Date('2026-11-25T10:00:00Z');
    const r = await importar(archivo, deps(destino, { reloj }));
    expect(r.respaldo).not.toBeNull();
    expect((await readdir(respaldos)).sort()).toEqual([
      'auditoria',
      'entorno',
      'pre-perfil-2026-11-20T00-00-00-000Z',
      'pre-perfil-2026-11-25T10-00-00-000Z',
    ]);
  });

  it('avisa de cada fase de la importación, en orden y sin datos del perfil', async () => {
    const archivo = await exportar();
    const vistas: { fase: string; paso: number; de: number }[] = [];
    await importar(archivo, deps(destino, { progreso: (p) => void vistas.push(p) }));
    expect(vistas.map((x) => x.fase)).toEqual([
      'copia',
      'versiones',
      'configuracion',
      'plantillas',
      'ca',
      'bases',
      'env',
    ]);
    expect(vistas.map((x) => x.paso)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(vistas.map((x) => x.de))).toEqual(new Set([7]));
    expect(JSON.stringify(vistas)).not.toContain(CENTINELA);
  });

  it('una CA que no se puede leer cuenta como de restricciones ajenas', () => {
    expect(estadoCaVista('no es un certificado')).toEqual({
      restringida: false,
      restriccionesAjenas: true,
    });
    expect(estadoCaVista(CA_CRT)).toEqual({ restringida: true, restriccionesAjenas: false });
  });
});

describe('importarPerfil: instantánea del entorno antes de tocar nada (D27)', () => {
  it('se toma tras validar y antes de copiar lo reemplazado, con la configuración aún intacta', async () => {
    const cfg = ConfigSchema.parse({ sitios: [] });
    await escribir(destino.config(), JSON.stringify(cfg));
    const antes = await readFile(destino.config(), 'utf8');
    const archivo = await exportar();
    const vistos: { config: string; respaldos: boolean }[] = [];
    const d = deps(destino, {
      instantaneaEntorno: async () => {
        vistos.push({
          config: await readFile(destino.config(), 'utf8'),
          respaldos: existsSync(path.join(destino.base, 'respaldos')),
        });
        return 'x';
      },
    });
    await importar(archivo, d);
    expect(vistos).toEqual([{ config: antes, respaldos: false }]);
    expect(await readFile(destino.config(), 'utf8')).not.toBe(antes);
  });

  it('no se toma si la confirmación o la vista previa no valen', async () => {
    const archivo = await exportar();
    let llamadas = 0;
    const p = new Perfiles(
      deps(destino, {
        instantaneaEntorno: async () => {
          llamadas++;
          return '';
        },
      }),
    );
    await expect(
      p.importar(archivo, { rutas: {}, huella: 'f'.repeat(64), confirmado: true }),
    ).rejects.toMatchObject({ codigo: 'perfiles.vista_previa_vieja' });
    await expect(
      p.importar(archivo, { rutas: {}, huella: 'x', confirmado: false as unknown as true }),
    ).rejects.toMatchObject({ codigo: 'perfiles.sin_confirmar' });
    expect(llamadas).toBe(0);
  });

  it('si la instantánea falla no se importa nada', async () => {
    const cfg = ConfigSchema.parse({ sitios: [] });
    await escribir(destino.config(), JSON.stringify(cfg));
    const antes = await readFile(destino.config(), 'utf8');
    const archivo = await exportar();
    const d = deps(destino, {
      instantaneaEntorno: async () => {
        throw new ErrorWolf('perfiles.instantanea_fallo', 'no se pudo');
      },
    });
    await expect(importar(archivo, d)).rejects.toMatchObject({
      codigo: 'perfiles.instantanea_fallo',
    });
    expect(await readFile(destino.config(), 'utf8')).toBe(antes);
    expect(existsSync(path.join(destino.base, 'respaldos'))).toBe(false);
    expect(d.reg.instaladas).toEqual([]);
    expect(d.reg.restauradas).toEqual([]);
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
    // La carpeta temporal de las pruebas cuelga de AppData (Windows) o de /var (macOS), que son
    // protegidas: aquí se mide la reasignación (la protección tiene su propia prueba).
    const d = deps(destino, { rutaProtegida: () => false });
    await mkdir(path.join(proyectos, 'blog'), { recursive: true });
    const r = await importar(archivo, d, {
      prefijos: [{ viejo: 'C:\\Users\\viejo\\proyectos', nuevo: proyectos }],
    });
    expect(r.sitios.find((s) => s.id === 'blog')).toMatchObject({
      estado: 'importado',
      carpeta: path.join(proyectos, 'blog'),
    });
  });

  it('tras cambiar el prefijo la ruta tampoco puede ser del sistema, ni la carpeta de datos', async () => {
    const archivo = await exportar();
    const r = await importar(archivo, deps(destino), {
      prefijos: [{ viejo: 'C:\\Users\\viejo\\proyectos', nuevo: 'C:\\Windows' }],
    });
    expect(r.sitios.map((s) => [s.id, s.estado, s.motivos[0]])).toEqual([
      ['tienda', 'omitido', 'ruta_protegida'],
      ['blog', 'omitido', 'ruta_protegida'],
    ]);
    const r2 = await importar(archivo, deps(new Rutas(path.join(dir, 'd2'))), {
      rutas: { tienda: path.join(dir, 'd2', 'plantillas'), blog: path.join(dir, 'd2') },
    });
    expect(r2.sitios.map((s) => s.estado)).toEqual(['omitido', 'omitido']);
  });

  it('una unión hacia una carpeta del sistema se juzga por su ruta real', async () => {
    const archivo = await exportar();
    const dentro = path.join(dir, 'dentro');
    await mkdir(dentro, { recursive: true });
    symlinkSync(dentro, path.join(proyectos, 'union'), 'junction');
    const real = await realpath(dentro);
    const r = await importar(
      archivo,
      deps(destino, { rutaProtegida: (x) => x.toLowerCase() === real.toLowerCase() }),
      {
        prefijos: [
          { viejo: 'C:\\Users\\viejo\\proyectos\\tienda', nuevo: path.join(proyectos, 'union') },
        ],
      },
    );
    expect(r.sitios.find((s) => s.id === 'tienda')).toMatchObject({ estado: 'omitido' });
  });

  it('php.ini importado: solo los ajustes rápidos', () => {
    const r = sitioImportado({
      id: 'x',
      nombre: 'X',
      dominio: 'x.test',
      carpeta: '/proyectos/x',
      tipo: 'laravel',
      php: '8.4',
      phpIni: { memory_limit: '256M', 'session.gc_maxlifetime': '60', 'opcache.enable': '1' },
    });
    expect(r.sitio!.phpIni).toEqual({ memory_limit: '256M', 'opcache.enable': '1' });
    expect(r.motivos).toContain('php_ini');
  });

  it('una instancia que ya existe no exige que su versión venga en el perfil', async () => {
    const cfg = ConfigSchema.parse({});
    cfg.servicios.datos.mysql.instancias = {
      '8.4': { version: '8.4.1', puerto: 3310, autoIniciar: false },
    };
    await escribir(destino.config(), JSON.stringify(cfg));
    const archivo = await exportar();
    const d = deps(destino, {
      versionInstalada: async (s, v) => s === 'mysql' && v === '8.4.1',
      buscarVersion: async () => null,
    });
    const r = await importar(archivo, d);
    expect(r.bases).toEqual([
      { instancia: 'mysql@8.4', base: 'tienda', estado: 'importado', motivo: null },
    ]);
  });

  it('las descargas de una importación tienen un tope; la vista previa dice cuántas', async () => {
    const muchas = Array.from({ length: 9 }, (_, i) => ({
      servicio: 'php',
      version: `8.${i}.0`,
      huella: null,
    }));
    const archivo = await perfilManual({}, { versiones: muchas });
    const d = deps(destino, {
      buscarVersion: async (s, v) => versionCatalogo(s, v, 'fuerte'),
    });
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.descargas).toBe(MAX_INSTALAR_POR_PERFIL);
    const r = await importar(archivo, d);
    expect(d.reg.instaladas).toHaveLength(MAX_INSTALAR_POR_PERFIL);
    expect(r.versiones.filter((v) => v.motivo === 'tope_descargas')).toHaveLength(
      9 - MAX_INSTALAR_POR_PERFIL,
    );
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

  describe('PHP que ya no está en el catálogo (D40)', () => {
    const perfilPhp = (version: string) =>
      perfilManual({}, { versiones: [{ servicio: 'php', version, huella: null }] });
    const catalogoPhp = (extra: Partial<DepsPerfiles> = {}): Partial<DepsPerfiles> => {
      const filas = ['8.3.40-1', '8.3.38-1', '8.4.30-1'].map((v) =>
        versionCatalogo('php', v, 'fuerte'),
      );
      return {
        buscarVersion: async (s, v) =>
          filas.find((f) => f.servicio === s && f.version === v) ?? null,
        versionesDeRama: async (_s, rama) => filas.filter((f) => f.version.startsWith(`${rama}.`)),
        ramaInstalada: async () => false,
        ...extra,
      };
    };

    it('instala la última de la misma rama y lo avisa en el resultado', async () => {
      const archivo = await perfilPhp('8.3.36-1');
      const d = deps(destino, catalogoPhp());
      const vista = await new Perfiles(d).vistaPrevia(archivo);
      expect(vista.versiones[0]).toMatchObject({
        disponible: true,
        huella: 'fuerte',
        sustituta: '8.3.40-1',
      });
      expect(vista.descargas).toBe(1);
      const r = await importar(archivo, d);
      expect(d.reg.instaladas).toEqual(['php@8.3.40-1']);
      expect(r.versiones).toEqual([
        {
          servicio: 'php',
          version: '8.3.36-1',
          estado: 'instalada',
          motivo: 'version_sustituida',
          instaladaComo: '8.3.40-1',
        },
      ]);
    });

    it('no sustituye si la rama ya está instalada: no toca una instalación existente', async () => {
      const archivo = await perfilPhp('8.3.36-1');
      const d = deps(destino, catalogoPhp({ ramaInstalada: async () => true }));
      const r = await importar(archivo, d);
      expect(d.reg.instaladas).toEqual([]);
      expect(r.versiones[0]).toMatchObject({ estado: 'pendiente', motivo: 'no_disponible' });
    });

    it('no ofrece sustituta si el perfil ya trae otra versión de esa rama que sí está en el catálogo', async () => {
      const archivo = await perfilManual(
        {},
        {
          versiones: [
            { servicio: 'php', version: '8.3.36-1', huella: null },
            { servicio: 'php', version: '8.3.38-1', huella: null },
          ],
        },
      );
      const d = deps(destino, catalogoPhp());
      const vista = await new Perfiles(d).vistaPrevia(archivo);
      expect(vista.versiones.find((v) => v.version === '8.3.36-1')?.sustituta).toBeUndefined();
      await importar(archivo, d);
      expect(d.reg.instaladas).toEqual(['php@8.3.38-1']);
    });

    it('con varias fuera del catálogo de la misma rama, solo una lleva sustituta', async () => {
      const archivo = await perfilManual(
        {},
        {
          versiones: [
            { servicio: 'php', version: '8.3.36-1', huella: null },
            { servicio: 'php', version: '8.3.35-1', huella: null },
          ],
        },
      );
      const d = deps(destino, catalogoPhp());
      const vista = await new Perfiles(d).vistaPrevia(archivo);
      expect(vista.versiones.map((v) => v.sustituta)).toEqual(['8.3.40-1', undefined]);
      await importar(archivo, d);
      expect(d.reg.instaladas).toEqual(['php@8.3.40-1']);
    });

    it('no salta de rama ni sustituye si la última no tiene huella fuerte', async () => {
      const archivo = await perfilPhp('8.2.1-1');
      const d = deps(destino, catalogoPhp());
      const r = await importar(archivo, d);
      expect(d.reg.instaladas).toEqual([]);
      expect(r.versiones[0]).toMatchObject({ estado: 'pendiente', motivo: 'no_disponible' });

      const debil = versionCatalogo('php', '8.3.40-1', 'debil');
      const d2 = deps(
        destino,
        catalogoPhp({
          buscarVersion: async () => debil,
          versionesDeRama: async () => [debil],
        }),
      );
      const r2 = await importar(await perfilPhp('8.3.36-1'), d2);
      expect(d2.reg.instaladas).toEqual([]);
      expect(r2.versiones[0]).toMatchObject({ estado: 'pendiente', motivo: 'huella_debil' });
    });
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
    // Llegan descifrados (y la estructura y los datos por separado).
    expect(d.reg.restauradas[0]!.textos.join('')).toContain('CREATE TABLE tienda_t');
    expect(d.reg.restauradas[0]!.textos.join('')).toContain('INSERT INTO tienda_t');
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
    // Por el camino de D16: con el .env listo, primero la clave y luego el usuario.
    expect(d.reg.orden.filter((x) => /^(clave|usuario|env):/.test(x))).toEqual([
      'env:tienda',
      'clave:tienda',
      'usuario:wolf_u_tienda',
    ]);
    expect(u!.cambiarClave).toBe(true);
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

  /** El blog también usa la base `tienda` (comparte usuario con la tienda). */
  async function envBlog(): Promise<void> {
    await mkdir(path.join(proyectos, 'blog'), { recursive: true });
    await escribir(
      path.join(proyectos, 'blog', '.env'),
      [
        'DB_CONNECTION=mysql',
        'DB_PORT=3306',
        'DB_DATABASE=tienda',
        'DB_USERNAME=wolf_u_tienda',
        `DB_PASSWORD=${CLAVE_ORIGEN}`,
        '',
      ].join('\n'),
    );
  }
  const rutasAmbos = (): Record<string, string> => ({
    tienda: path.join(proyectos, 'tienda'),
    blog: path.join(proyectos, 'blog'),
  });

  it('una sola clave por base en la importación: el usuario se crea una vez y ambos .env la usan', async () => {
    await envTienda();
    await envBlog();
    const archivo = await exportar();
    const d = deps(destino);
    const r = await importar(archivo, d, { rutas: rutasAmbos(), envProyectos: ['tienda', 'blog'] });
    expect(r.env.map((e) => e.estado)).toEqual(['reescrito', 'reescrito']);
    expect(d.reg.usuarios).toHaveLength(1);
    const clave = d.reg.usuarios[0]!.clave;
    expect(d.reg.claves).toEqual([
      { sitio: 'tienda', clave },
      { sitio: 'blog', clave },
    ]);
    for (const p of ['tienda', 'blog']) {
      expect(await readFile(path.join(proyectos, p, '.env'), 'utf8')).toContain(
        `DB_PASSWORD=${clave}`,
      );
    }
  });

  it('si otro proyecto del equipo ya usa ese usuario, se reutiliza su clave y no se cambia', async () => {
    await envTienda();
    const archivo = await exportar();
    const pedidos: { usuario: string; excluir: string[] }[] = [];
    const d = deps(destino, {
      claveCompartida: async (usuario, excluir) => {
        pedidos.push({ usuario, excluir });
        return 'clave-del-proyecto-propio';
      },
    });
    await importar(archivo, d, {
      rutas: { tienda: path.join(proyectos, 'tienda') },
      envProyectos: ['tienda'],
    });
    expect(pedidos).toEqual([{ usuario: 'wolf_u_tienda', excluir: ['tienda', 'blog'] }]);
    expect(d.reg.usuarios).toEqual([
      expect.objectContaining({ clave: 'clave-del-proyecto-propio', cambiarClave: false }),
    ]);
    expect(await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8')).toContain(
      'DB_PASSWORD=clave-del-proyecto-propio',
    );
  });

  it('si crear el usuario falla (o el usuario está en uso sin clave), el .env no se toca', async () => {
    await envTienda();
    const archivo = await exportar();
    const antes = await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8');
    const d = deps(destino, {
      crearUsuarioBd: async () => {
        throw new Error('servidor caído');
      },
    });
    const r = await importar(archivo, d, {
      rutas: { tienda: path.join(proyectos, 'tienda') },
      envProyectos: ['tienda'],
    });
    expect(r.env[0]).toMatchObject({
      estado: 'error',
      motivo: 'error_inesperado',
      detalle: 'servidor caído',
    });
    expect(await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8')).toBe(antes);
    const e = deps(new Rutas(path.join(dir, 'destino3')), {
      claveCompartida: async (usuario) => {
        throw errorUsuarioEnUso(usuario);
      },
    });
    const r2 = await importar(archivo, e, {
      rutas: { tienda: path.join(proyectos, 'tienda') },
      envProyectos: ['tienda'],
    });
    expect(r2.env[0]).toMatchObject({ estado: 'error', motivo: 'bd.usuario_en_uso' });
    expect(await readFile(path.join(proyectos, 'tienda', '.env'), 'utf8')).toBe(antes);
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

describe('validarCarpetaDatos: ruta real y carpeta anterior', () => {
  it('rechaza la carpeta de antes del cambio de nombre y un enlace a la real', async () => {
    const real = path.join(dir, 'Local', 'WolfCoreDev');
    await mkdir(real, { recursive: true });
    expect(() =>
      validarCarpetaDatos(path.join(dir, 'Local', 'Proyectoentornolocal'), real),
    ).toThrow(expect.objectContaining({ codigo: 'perfiles.carpeta_datos_invalida' }));
    const enlace = path.join(dir, 'enlace');
    // Una unión en Windows (no pide permisos), un enlace simbólico en los demás.
    symlinkSync(real, enlace, 'junction');
    expect(() => validarCarpetaDatos(enlace, real)).toThrow(
      expect.objectContaining({ codigo: 'perfiles.carpeta_datos_invalida' }),
    );
    expect(() => validarCarpetaDatos(path.join(enlace, 'sub'), real)).toThrow(
      expect.objectContaining({ codigo: 'perfiles.carpeta_datos_invalida' }),
    );
    expect(validarCarpetaDatos(path.join(dir, 'prueba'), real)).toBe(path.join(dir, 'prueba'));
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
    ca: false,
    frase: FRASE,
  });
  expect(r.bytes).toBe((await stat(archivo)).size);
});

describe('configuración importada: fusión real con la del equipo', () => {
  const iaPropia = { id: 'mia', tipo: 'openai', nombre: 'Mía', urlBase: null, modelo: null };
  const iaMala = {
    id: 'mala',
    tipo: 'openai',
    nombre: 'Mala',
    urlBase: 'https://recolector.ejemplo.com/v1',
    modelo: null,
  };
  const smtpConocido = {
    id: 'resend',
    nombre: 'Resend',
    host: 'smtp.resend.com',
    puerto: 465,
    seguridad: 'tls',
    usuario: 'resend',
    redLocal: true,
  };
  const smtpMalo = {
    id: 'relay',
    nombre: 'Relé',
    host: 'smtp.recolector.ejemplo.com',
    puerto: 587,
    seguridad: 'starttls',
    usuario: 'yo',
  };

  it('con datos en el destino se conserva su configuración entera (IA, SMTP, puertos, servicios…)', async () => {
    const propia = ConfigSchema.parse({
      https: { puerto: 8443 },
      mcp: { puerto: 7800 },
      ftp: { puerto: 2200 },
      depuracion: { puerto: 9913 },
      correo: { puertoSmtp: 2525, proveedores: [smtpConocido] },
      ia: { proveedores: [iaPropia] },
      herramientas: { phpPorDefecto: '8.3' },
      catalogo: { silenciados: ['node'] },
      avisos: { nativas: false },
      proyectos: { carpetaVigilada: proyectos },
      servicios: { nginx: { puerto: 8080 }, php: { trabajadores: 4 } },
    });
    await escribir(destino.config(), JSON.stringify(propia));
    const archivo = await perfilManual(
      {},
      {
        config: {
          https: { puerto: 9443 },
          mcp: { puerto: 7900, activo: true },
          correo: { proveedores: [smtpMalo] },
          ia: { proveedores: [iaMala] },
          herramientas: { phpPorDefecto: '7.4' },
          servicios: { nginx: { puerto: 81 }, php: { trabajadores: 12 } },
          proyectos: { carpetaVigilada: String.raw`C:\Users\otro` },
        },
      },
    );
    const d = deps(destino);
    await importar(archivo, d);
    const cfg = await d.leerConfig();
    expect(cfg.https.puerto).toBe(8443);
    expect(cfg.mcp).toEqual({ activo: false, puerto: 7800 });
    expect(cfg.ftp.puerto).toBe(2200);
    expect(cfg.depuracion.puerto).toBe(9913);
    expect(cfg.correo.puertoSmtp).toBe(2525);
    expect(cfg.correo.proveedores.map((p) => p.id)).toEqual(['resend']);
    expect(cfg.ia.proveedores.map((p) => p.id)).toEqual(['mia']);
    expect(cfg.herramientas.phpPorDefecto).toBe('8.3');
    expect(cfg.catalogo.silenciados).toEqual(['node']);
    expect(cfg.avisos.nativas).toBe(false);
    expect(cfg.proyectos.carpetaVigilada).toBe(proyectos);
    expect(cfg.servicios.nginx.puerto).toBe(8080);
    expect(cfg.servicios.php.trabajadores).toBe(4);
  });

  it('carpeta limpia: sin IA con URL propia, sin SMTP desconocido ni redLocal, y se ve en la vista previa', async () => {
    const archivo = await perfilManual(
      {},
      {
        config: {
          correo: { proveedores: [smtpConocido, smtpMalo] },
          ia: { proveedores: [iaPropia, iaMala] },
          proyectos: { carpetaVigilada: String.raw`C:\Users\otro\proyectos` },
        },
      },
    );
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.configQuitada.sort()).toEqual(['carpeta_vigilada', 'ia:mala', 'smtp:relay']);
    await importar(archivo, d);
    const cfg = await d.leerConfig();
    expect(cfg.ia.proveedores.map((p) => p.id)).toEqual(['mia']);
    expect(cfg.correo.proveedores).toEqual([
      {
        id: 'resend',
        nombre: 'Resend',
        host: 'smtp.resend.com',
        puerto: 465,
        seguridad: 'tls',
        usuario: 'resend',
      },
    ]);
    expect(cfg.proyectos.carpetaVigilada).toBeNull();
  });

  it('carpeta limpia: puertos fuera de rango al valor por defecto, ocupados listados, trabajadores acotados', async () => {
    const archivo = await perfilManual(
      {},
      {
        config: {
          servicios: { nginx: { puerto: 22 }, php: { trabajadores: 500 } },
          https: { puerto: 444 },
          mcp: { puerto: 7791 },
        },
      },
    );
    const d = deps(destino, { puertoLibre: async (p) => p !== 7791 });
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.configQuitada.sort()).toEqual(['puerto:https', 'puerto:nginx']);
    expect(vista.puertosOcupados).toEqual([7791]);
    await importar(archivo, d);
    const cfg = await d.leerConfig();
    expect(cfg.servicios.nginx.puerto).toBe(80);
    expect(cfg.https.puerto).toBe(443);
    expect(cfg.servicios.php.trabajadores).toBe(2);
  });

  it('el esquema acota el puerto de Nginx y los trabajadores de PHP sin mandar el config a corrupto', () => {
    const c = ConfigSchema.parse({
      servicios: { nginx: { puerto: 70000 }, php: { trabajadores: 99 } },
    });
    expect(c.servicios.nginx.puerto).toBe(80);
    expect(c.servicios.php.trabajadores).toBe(2);
  });
});

describe('secretos sin forma reconocible', () => {
  it('el proveedor SMTP sin usuario no se importa y la vista previa lo dice', async () => {
    const archivo = await exportar();
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.configQuitada).toContain('smtp:gmail');
    await importar(archivo, d);
    expect((await d.leerConfig()).correo.proveedores.map((p) => p.id)).toEqual(['resend']);
  });

  it('un puerto pegado (-p3000) no se enmascara; la clave pegada de mysql sí', () => {
    expect(enmascararSecretos('vite -p3000 --host')).toBe('vite -p3000 --host');
    expect(enmascararSecretos('mysql -uroot -pclave tienda')).toBe('mysql -uroot -p*** tienda');
    expect(enmascararComando(['mysql', '-pclave', '-p8080'])).toEqual(['mysql', '-p***', '-p8080']);
  });

  it('enmascararNginx deja lo que no es secreto', () => {
    const t = ['add_header X-Frame-Options DENY;', 'set $raiz /var/www;'].join(
      String.fromCharCode(10),
    );
    expect(enmascararNginx(t)).toBe(t);
  });
});

describe('workspaces en el perfil (D28): solo referencias, nada ejecutable', () => {
  /** El origen con tres workspaces: uno con instancia y servicios, uno de solo procesos, uno vacío. */
  async function conWorkspaces(): Promise<void> {
    const cfg = JSON.parse(await readFile(origen.config(), 'utf8')) as Record<string, unknown>;
    cfg['workspaces'] = [
      {
        id: 'bot-fastapi',
        nombre: 'Bot FastAPI',
        elementos: [
          { tipo: 'instancia', id: 'mysql@8.4' },
          { tipo: 'instancia', id: 'postgresql@17' },
          { tipo: 'servicio', id: 'ollama' },
          { tipo: 'servicio', id: 'nginx' },
          { tipo: 'proceso', sitioId: 'tienda', procesoId: 'cola' },
        ],
      },
      {
        id: 'solo-procesos',
        nombre: 'Solo procesos',
        elementos: [{ tipo: 'proceso', sitioId: 'tienda', procesoId: 'cola' }],
      },
      { id: 'vacio', nombre: 'Vacío', elementos: [] },
    ];
    await escribir(origen.config(), JSON.stringify(cfg, null, 2));
  }

  const manifiestoDe = async (archivo: string) =>
    JSON.parse((await entradasZip(archivo)).get('manifiesto.json')!.toString('utf8')) as {
      config: Record<string, unknown>;
      workspaces: { id: string; elementos: { tipo: string }[] }[];
    };

  it('viajan en el manifiesto (no en config) sin procesos, y el que solo llevaba procesos no viaja', async () => {
    await conWorkspaces();
    const m = await manifiestoDe(await exportar());
    expect(m.config['workspaces']).toBeUndefined();
    expect(m.workspaces.map((w) => w.id)).toEqual(['bot-fastapi', 'vacio']);
    expect(m.workspaces[0]!.elementos.map((e) => e.tipo)).toEqual([
      'instancia',
      'instancia',
      'servicio',
      'servicio',
    ]);
    // Solo referencias: ningún comando, ruta ni variable del sitio llega al perfil.
    const texto = JSON.stringify(m.workspaces);
    expect(texto).not.toContain('queue:work');
    expect(texto).not.toContain(CENTINELA);
  });

  it('se importan validados contra lo que existe: sin la instancia que no hay, y sin arrancar nada', async () => {
    await conWorkspaces();
    const archivo = await exportar();
    const d = deps(destino);
    const vista = await new Perfiles(d).vistaPrevia(archivo);
    expect(vista.workspaces).toEqual([
      { id: 'bot-fastapi', nombre: 'Bot FastAPI', elementos: 4, existe: false },
      { id: 'vacio', nombre: 'Vacío', elementos: 0, existe: false },
    ]);
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.workspacesInvalidos).toBe(0);
    // mysql@8.4 viaja como instancia; postgresql@17 no está en el perfil: se descarta y se informa.
    expect(r.workspaces).toEqual([
      {
        id: 'bot-fastapi',
        nombre: 'Bot FastAPI',
        estado: 'importado',
        descartados: ['instancia:postgresql@17'],
      },
      { id: 'vacio', nombre: 'Vacío', estado: 'importado', descartados: [] },
    ]);
    const cfg = await d.leerConfig();
    expect(cfg.workspaces.find((w) => w.id === 'bot-fastapi')!.elementos).toEqual([
      { tipo: 'instancia', id: 'mysql@8.4' },
      { tipo: 'servicio', id: 'ollama' },
      { tipo: 'servicio', id: 'nginx' },
    ]);
  });

  it('un workspace propio con el mismo id no se toca', async () => {
    await conWorkspaces();
    const archivo = await exportar();
    const d = deps(destino);
    const propio = ConfigSchema.parse({
      workspaces: [
        { id: 'bot-fastapi', nombre: 'Mío', elementos: [{ tipo: 'servicio', id: 'ollama' }] },
      ],
    });
    await escribir(destino.config(), JSON.stringify(propio));
    const r = await importar(archivo, d, { rutas: { tienda: path.join(proyectos, 'tienda') } });
    expect(r.workspaces.find((w) => w.id === 'bot-fastapi')!.estado).toBe('existente');
    expect((await d.leerConfig()).workspaces.find((w) => w.id === 'bot-fastapi')).toMatchObject({
      nombre: 'Mío',
    });
  });

  it('un perfil manipulado: campos ejecutables, procesos y ids raros no entran', async () => {
    const archivo = await perfilManual(
      {},
      {
        workspaces: [
          {
            id: 'malo',
            nombre: 'Malo',
            elementos: [{ tipo: 'servicio', id: 'nginx' }],
            comando: ['calc.exe'],
          },
          { id: 'MAYUS raro', nombre: 'X', elementos: [] },
          {
            id: 'mixto',
            nombre: 'Mixto',
            elementos: [
              { tipo: 'servicio', id: 'ollama' },
              { tipo: 'servicio', id: 'ollama', comando: ['calc.exe'] },
              { tipo: 'proceso', sitioId: 'tienda', procesoId: 'cola' },
              { tipo: 'script', cuerpo: 'rm -rf /' },
            ],
          },
          { id: 'solo-captadores', nombre: 'Correo', elementos: [] },
        ],
      },
    );
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.workspacesInvalidos).toBe(2);
    expect(r.workspaces).toEqual([
      {
        id: 'mixto',
        nombre: 'Mixto',
        estado: 'importado',
        descartados: ['elemento_invalido', 'elemento_invalido', 'proceso:tienda/cola'],
      },
      { id: 'solo-captadores', nombre: 'Correo', estado: 'importado', descartados: [] },
    ]);
    const lista = (await d.leerConfig()).workspaces;
    expect(lista.map((w) => w.id)).toEqual(['mixto', 'solo-captadores']);
    expect(JSON.stringify(lista)).not.toContain('calc.exe');
  });

  it('con dos captadores de correo se queda con el primero (grupo exclusivo)', async () => {
    const archivo = await perfilManual(
      {},
      {
        workspaces: [
          {
            id: 'correo',
            nombre: 'Correo',
            elementos: [
              { tipo: 'servicio', id: 'mailpit' },
              { tipo: 'servicio', id: 'smtp4dev' },
            ],
          },
        ],
      },
    );
    const d = deps(destino);
    const r = await importar(archivo, d);
    expect(r.workspaces[0]!.descartados).toEqual(['servicio:smtp4dev']);
    expect((await d.leerConfig()).workspaces[0]!.elementos).toEqual([
      { tipo: 'servicio', id: 'mailpit' },
    ]);
  });
});
