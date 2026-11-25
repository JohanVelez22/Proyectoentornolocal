import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yazl from 'yazl';
import { ErrorWolf } from '../errores';
import { huellaSha256 } from '../https/ca';
import { enmascararSecretos } from '../patronesSecretos';
import { idSitioSeguro } from '../tuneles/proveedor';
import { cifrarConFrase, LlaveFrase, validarFrase } from './cifrado';
import {
  configParaPerfil,
  EXTENSION_PERFIL,
  rutaPermitidaEnPerfil,
  sitioParaPerfil,
  VERSION_PERFIL,
  type ManifiestoPerfil,
} from './manifiesto';
import type {
  AvisoPerfil,
  DepsPerfiles,
  OpcionesExportarPerfil,
  ResultadoExportarPerfil,
} from './tipos';

export async function sha256Archivo(archivo: string): Promise<string> {
  const h = createHash('sha256');
  await pipeline(createReadStream(archivo), h);
  return h.digest('hex');
}

const ARCHIVOS_PLANTILLA = ['plantilla.json', 'archivos.zip', 'esquema.sql', 'esquema.dump'];

/** Lee un archivo normal (nunca un enlace); null si no existe o no lo es. */
async function leerNormal(ruta: string): Promise<Buffer | null> {
  const info = await lstat(ruta).catch(() => null);
  if (!info?.isFile()) return null;
  return readFile(ruta);
}

/**
 * Exporta el entorno a un `.wolfperfil`. Se arma con lo que está en la lista blanca y nada más:
 * `manifiesto.json` (configuración y sitios sin secretos, versiones con su huella, instancias con
 * su puerto, plantillas), las plantillas válidas, los volcados de las bases (opcional) y la CA y
 * los certificados **solo cifrados** con la frase del usuario (opcional). Nunca lee `etc/`, `run/`,
 * `tmp/`, `instantaneas/`, `papelera/` ni `respaldos/`. Se escribe en un temporal junto al destino
 * y se renombra al final: o queda entero o no queda.
 */
export async function exportarPerfil(
  d: DepsPerfiles,
  o: OpcionesExportarPerfil,
): Promise<ResultadoExportarPerfil> {
  if (
    typeof o?.destino !== 'string' ||
    !path.isAbsolute(o.destino) ||
    !o.destino.toLowerCase().endsWith(EXTENSION_PERFIL)
  ) {
    throw new ErrorWolf(
      'perfiles.destino_invalido',
      `Elija dónde guardar el perfil (un archivo ${EXTENSION_PERFIL}).`,
    );
  }
  // La CA y las bases (datos de clientes) solo viajan cifradas con una frase del usuario.
  const frase = o.ca || o.bases ? validarFrase(o.frase) : null;
  if (o.certificados && !o.ca) {
    throw new ErrorWolf(
      'perfiles.certificados_sin_ca',
      'Los certificados de los sitios solo viajan junto con la CA cifrada.',
    );
  }
  const avisos: AvisoPerfil[] = [];
  const cfg = await d.leerConfig();
  const tmp = d.rutas.tmp();
  await mkdir(tmp, { recursive: true });
  const stage = path.join(tmp, `perfil-${randomBytes(6).toString('hex')}`);
  await mkdir(stage);
  const archivos: Record<string, string> = {};
  const poner = async (rel: string, origen: string): Promise<void> => {
    if (!rutaPermitidaEnPerfil(rel)) throw new Error(`Ruta no permitida en el perfil: ${rel}`);
    const destino = path.join(stage, ...rel.split('/'));
    await mkdir(path.dirname(destino), { recursive: true });
    await copyFile(origen, destino);
    archivos[rel] = await sha256Archivo(destino);
  };
  const llave = frase ? new LlaveFrase(frase) : null;
  /** Como `poner`, pero cifrado en flujo con la frase (nunca queda una copia en claro). */
  const ponerCifrado = async (rel: string, origen: string): Promise<void> => {
    if (!rutaPermitidaEnPerfil(rel) || !llave) throw new Error(`Ruta no permitida: ${rel}`);
    const destino = path.join(stage, ...rel.split('/'));
    await mkdir(path.dirname(destino), { recursive: true });
    await llave.cifrarArchivo(origen, destino);
    archivos[rel] = await sha256Archivo(destino);
  };
  try {
    // Plantillas válidas (las dañadas no viajan). Nunca el registro de propias.
    const plantillas: string[] = [];
    for (const p of await d.plantillas.lista()) {
      const dir = path.join(d.rutas.plantillas(), p.id);
      let alguna = false;
      for (const n of ARCHIVOS_PLANTILLA) {
        const ruta = path.join(dir, n);
        const info = await lstat(ruta).catch(() => null);
        if (!info?.isFile()) continue;
        await poner(`plantillas/${p.id}/${n}`, ruta);
        alguna = true;
      }
      if (alguna) plantillas.push(p.id);
    }

    // Bases (opcional): volcados lógicos de las instancias encendidas.
    const bases: ManifiestoPerfil['bases'] = [];
    if (o.bases) {
      for (const b of await d.basesParaExportar()) {
        const carpeta = path.join(stage, 'trabajo', `${bases.length}`);
        try {
          const v = await d.volcarBase(b.instancia, b.base, carpeta);
          const raiz = `bases/${b.instancia}/${b.base}`;
          const pg = b.instancia.startsWith('postgresql@');
          // Cada motor con su formato: un volcado de otra forma no se incluye.
          if ('volcado' in v && pg) await ponerCifrado(`${raiz}/volcado.dump.cifrado`, v.volcado);
          else if ('esquema' in v && !pg) {
            await ponerCifrado(`${raiz}/esquema.sql.cifrado`, v.esquema);
            await ponerCifrado(`${raiz}/datos.sql.cifrado`, v.datos);
          } else throw new Error('formato de volcado inesperado');
          bases.push({ instancia: b.instancia, base: b.base });
        } catch (e) {
          avisos.push({
            codigo: 'base_no_incluida',
            datos: {
              base: b.base,
              instancia: b.instancia,
              detalle: enmascararSecretos(e instanceof Error ? e.message : String(e)).slice(0, 200),
            },
          });
        } finally {
          await rm(carpeta, { recursive: true, force: true }).catch(() => undefined);
        }
      }
    }

    // CA y certificados: solo cifrados con la frase del usuario.
    let conCa = false;
    let huellaCa: string | null = null;
    let certCa: string | null = null;
    let conCertificados = false;
    if (frase && o.ca) {
      const crt = await leerNormal(d.rutas.caCrt());
      const key = await leerNormal(d.rutas.caKey());
      if (!crt || !key) {
        avisos.push({ codigo: 'sin_ca' });
      } else {
        const certificados: Record<string, { crt: string; key: string }> = {};
        if (o.certificados) {
          for (const s of cfg.sitios) {
            if (!s.https || !idSitioSeguro(s.id)) continue;
            const c = await leerNormal(d.rutas.certCrt(s.id));
            const k = await leerNormal(d.rutas.certKey(s.id));
            if (c && k) certificados[s.id] = { crt: c.toString('utf8'), key: k.toString('utf8') };
          }
          conCertificados = true;
        }
        const contenido = Buffer.from(
          JSON.stringify({
            ca: { crt: crt.toString('utf8'), key: key.toString('utf8') },
            certificados,
          }),
          'utf8',
        );
        const cifrado = await cifrarConFrase(contenido, frase);
        contenido.fill(0);
        const tmpCa = path.join(stage, 'trabajo-ca');
        await writeFile(tmpCa, cifrado);
        await poner('ca.cifrada', tmpCa);
        await rm(tmpCa, { force: true });
        conCa = true;
        huellaCa = huellaSha256(crt.toString('utf8'));
        certCa = crt.toString('utf8');
      }
    }

    const instancias: ManifiestoPerfil['instancias'] = [];
    for (const [servicio, datos] of Object.entries(cfg.servicios.datos)) {
      for (const [clave, i] of Object.entries(datos.instancias ?? {})) {
        instancias.push({ id: `${servicio}@${clave}`, version: i.version, puerto: i.puerto });
      }
    }
    const manifiesto: ManifiestoPerfil = {
      formato: 'wolfcore-perfil',
      version: VERSION_PERFIL,
      creado: (d.reloj?.() ?? new Date()).toISOString(),
      origen: { sistema: d.sistema.slice(0, 20), idCatalogo: d.idCatalogo.slice(0, 80) },
      config: configParaPerfil(cfg),
      sitios: cfg.sitios.map(sitioParaPerfil),
      versiones: (await d.versionesInstaladas()).map((v) => ({
        servicio: v.servicio,
        version: v.version,
        huella: v.huella,
      })),
      instancias,
      plantillas,
      workspaces: [],
      tareas: [],
      incluye: { bases: bases.length > 0, certificados: conCertificados, ca: conCa },
      ca: huellaCa && certCa ? { huella: huellaCa, certificado: certCa } : null,
      bases,
      archivos,
    };

    const zip = new yazl.ZipFile();
    zip.addBuffer(Buffer.from(JSON.stringify(manifiesto, null, 2), 'utf8'), 'manifiesto.json');
    for (const rel of Object.keys(archivos).sort()) {
      zip.addFile(path.join(stage, ...rel.split('/')), rel);
    }
    zip.end();
    await mkdir(path.dirname(o.destino), { recursive: true });
    const parcial = `${o.destino}.${randomBytes(4).toString('hex')}.parcial`;
    try {
      await pipeline(zip.outputStream, createWriteStream(parcial));
      await rename(parcial, o.destino);
    } catch (e) {
      await rm(parcial, { force: true }).catch(() => undefined);
      throw e;
    }
    return { archivo: o.destino, bytes: (await stat(o.destino)).size, avisos };
  } finally {
    llave?.olvidar();
    await rm(stage, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(
      () => undefined,
    );
  }
}
