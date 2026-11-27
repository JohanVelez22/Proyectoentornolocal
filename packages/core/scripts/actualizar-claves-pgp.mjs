#!/usr/bin/env node
/* global process, console, fetch, Buffer */
/**
 * Actualiza los anillos PGP fijados en la app (`src/catalogo/claves/<fuente>.asc`, D10).
 *
 *   node packages/core/scripts/actualizar-claves-pgp.mjs            # solo muestra el diff
 *   node packages/core/scripts/actualizar-claves-pgp.mjs --escribir # además escribe los archivos
 *
 * Baja las claves solo de las fuentes oficiales:
 * - Node: `github.com/nodejs/release-keys` (`keys.list` y `keys/<huella>.asc`);
 * - Composer: la huella que nombra el flujo de publicación oficial de `composer/composer`
 *   (`.github/workflows/release.yml`, secreto `GPG_KEY_<huella>`) y la clave de
 *   `keys.openpgp.org` con esa huella (correo verificado `contact@packagist.com`);
 * - phpMyAdmin: la huella del release manager que publica `docs.phpmyadmin.net` (capítulo
 *   "Verifying phpMyAdmin releases"); la clave debe estar en `files.phpmyadmin.net/phpmyadmin.keyring`
 *   con esa huella y el archivo fijado la conserva (solo esa clave, no todo el llavero);
 * - Nginx: `nginx.org/en/pgp_keys.html` → `nginx.org/keys/<nombre>.key` (salvo
 *   `nginx_signing.key`, que firma paquetes y repositorios, no las descargas; y salvo las claves
 *   ya vencidas).
 *
 * Muestra, por fuente, las claves primarias que entran, salen o cambian de vencimiento, con su
 * huella completa, para revisarlas a mano antes de confirmar. Nunca se ejecuta desde la app.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CLAVES = path.join(AQUI, '..', 'src', 'catalogo', 'claves');
const escribir = process.argv.includes('--escribir');

const { module: anillos } = await runnerImport(
  path.join(AQUI, '..', 'src', 'catalogo', 'pgp', 'anillos.ts'),
);
const { module: paquetes } = await runnerImport(
  path.join(AQUI, '..', 'src', 'catalogo', 'pgp', 'paquetes.ts'),
);
const { module: comun } = await runnerImport(path.join(AQUI, '..', 'src', 'catalogo', 'comun.ts'));
const { module: cotas } = await runnerImport(
  path.join(AQUI, '..', 'src', 'catalogo', 'pgp', 'cotas.ts'),
);

const HUELLA = /^[0-9A-F]{40}$/;

async function bajar(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'WolfCoreDev-claves' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

const ahoraS = Math.floor(Date.now() / 1000);
const todas = (texto) => (texto ? anillos.leerAnillo(Buffer.from(texto, 'latin1')) : []);
const primarias = (texto) => todas(texto).filter((c) => c.huella === c.huellaPrimaria);
/** Paquetes de clave primaria (etiqueta 6) de un texto, soportados o no. */
const paquetesPrimarios = (texto) =>
  paquetes.leerPaquetes(Buffer.from(texto, 'latin1')).filter((p) => p.tag === 6).length;

async function node() {
  const base = 'https://raw.githubusercontent.com/nodejs/release-keys/HEAD/';
  const lista = (await bajar(`${base}keys.list`))
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const h of lista) if (!HUELLA.test(h)) throw new Error(`keys.list con una línea rara: ${h}`);
  const partes = [];
  for (const h of [...lista].sort()) {
    const texto = await bajar(`${base}keys/${h}.asc`);
    // Cada archivo trae exactamente una clave primaria: la que su nombre dice.
    if (!/BEGIN PGP PUBLIC KEY BLOCK/.test(texto) || paquetesPrimarios(texto) !== 1) {
      throw new Error(`keys/${h}.asc no trae exactamente una clave primaria`);
    }
    const p = primarias(texto);
    if (p.length > 0 && p[0].huella !== h) {
      throw new Error(`keys/${h}.asc trae otra clave (${p[0].huella})`);
    }
    partes.push(texto.endsWith('\n') ? texto : `${texto}\n`);
  }
  return partes.join('\n') + '\n';
}

async function composer() {
  const flujo = await bajar(
    'https://raw.githubusercontent.com/composer/composer/HEAD/.github/workflows/release.yml',
  );
  const huellas = [...new Set([...flujo.matchAll(/GPG_KEY_([0-9A-F]{40})/g)].map((m) => m[1]))];
  if (huellas.length !== 1) throw new Error(`release.yml nombra ${huellas.length} claves`);
  const h = huellas[0];
  const texto = await bajar(`https://keys.openpgp.org/vks/v1/by-fingerprint/${h}`);
  if (!primarias(texto).some((c) => c.huella === h)) {
    throw new Error(`keys.openpgp.org no devolvió la clave ${h}`);
  }
  return texto.endsWith('\n') ? texto : `${texto}\n`;
}

async function nginx() {
  const pagina = await bajar('https://nginx.org/en/pgp_keys.html');
  const nombres = [
    ...new Set([...pagina.matchAll(/href="\/keys\/([a-z0-9_]+)\.key"/g)].map((m) => m[1])),
  ]
    .filter((n) => n !== 'nginx_signing')
    .sort();
  if (nombres.length === 0) throw new Error('pgp_keys.html no lista claves');
  const partes = [];
  for (const n of nombres) {
    const texto = await bajar(`https://nginx.org/keys/${n}.key`);
    const p = primarias(texto);
    if (p.length === 0) {
      console.log(`  nginx: ${n}.key omitida (algoritmo no soportado)`);
      continue;
    }
    if (p.every((c) => c.expiracion !== null && c.expiracion <= ahoraS)) {
      console.log(`  nginx: ${n}.key omitida (vencida)`);
      continue;
    }
    partes.push(texto.endsWith('\n') ? texto : `${texto}\n`);
  }
  return partes.join('\n') + '\n';
}

/** Huella del release manager de phpMyAdmin (Isaac Bennetch), según docs.phpmyadmin.net. */
const HUELLA_PHPMYADMIN = '3D06A59ECE730EB71B511C17CE752F178259BD92';

async function phpmyadmin() {
  const docs = await bajar('https://docs.phpmyadmin.net/en/latest/setup.html');
  const legible = HUELLA_PHPMYADMIN.match(/.{4}/g).join(' ');
  if (!docs.replace(/\s+/g, ' ').includes(legible)) {
    throw new Error('docs.phpmyadmin.net ya no publica la huella fijada del release manager');
  }
  const llavero = await bajar('https://files.phpmyadmin.net/phpmyadmin.keyring');
  const clave = primarias(llavero).find((c) => c.huella === HUELLA_PHPMYADMIN);
  if (!clave) throw new Error('phpmyadmin.keyring no trae la clave del release manager');
  if (clave.revocada) throw new Error('La clave del release manager de phpMyAdmin está revocada');
  const actual = await readFile(path.join(CLAVES, 'phpmyadmin.asc'), 'utf8');
  const fijada = primarias(actual).find((c) => c.huella === HUELLA_PHPMYADMIN);
  if (!fijada) throw new Error('El archivo fijado no trae la clave del release manager');
  // El archivo fijado solo cambia a mano (extraer la clave del llavero con gpg --export-options
  // export-minimal): aquí se avisa si el vencimiento del llavero ya no coincide.
  if (fijada.expiracion !== clave.expiracion) {
    console.log('  phpmyadmin: el vencimiento del llavero cambió; vuelva a exportar la clave');
  }
  return actual;
}

const fecha = (s) => (s === null ? 'no vence' : new Date(s * 1000).toISOString().slice(0, 10));
const describir = (c) => {
  const tipo = c.algoritmo === 22 ? 'Ed25519' : `RSA ${c.material.n.length * 8}`;
  const sub = c.huella === c.huellaPrimaria ? '' : `subclave de ${c.huellaPrimaria.slice(-16)}  `;
  const uso = c.firma ? 'firma' : 'no firma';
  const estado = c.revocada ? '  REVOCADA' : '';
  const quien = c.huella === c.huellaPrimaria ? `  ${c.usuarios[0] ?? ''}` : '';
  return `${c.huella}  ${sub}${tipo}  ${uso}  vence ${fecha(c.expiracion)}${estado}${quien}`;
};

/** La versión más nueva de cada rama entre `versiones` (rama según la fuente). */
function masNuevas(fuente, versiones) {
  const res = {};
  for (const v of versiones) {
    const rama = cotas.ramaDeFirma(fuente, v);
    if (rama === null) continue;
    if (!(rama in res) || comun.compararVersionesDesc(v, res[rama]) < 0) res[rama] = v;
  }
  return Object.fromEntries(
    Object.entries(res).sort(([a], [b]) => comun.compararVersionesDesc(a, b)),
  );
}

/**
 * FECHA_ANILLO y la versión más nueva por rama de cada fuente (D10): Node de `index.json`,
 * Nginx del listado `nginx.org/download/` (zip) y Composer de `getcomposer.org/download/`.
 */
async function vigencia() {
  const indice = JSON.parse(await bajar('https://nodejs.org/dist/index.json'));
  const node = masNuevas(
    'node',
    indice.map((e) => String(e.version).replace(/^v/, '')).filter((v) => /^\d+\.\d+\.\d+/.test(v)),
  );
  const listado = await bajar('https://nginx.org/download/');
  const nginx = masNuevas('nginx', [
    ...new Set([...listado.matchAll(/nginx-(\d+\.\d+\.\d+)\.zip"/g)].map((m) => m[1])),
  ]);
  const pagina = await bajar('https://getcomposer.org/download/');
  const composer = masNuevas('composer', [
    ...new Set(
      [...pagina.matchAll(/\/download\/(\d+\.\d+\.\d+(?:-[\w.]+)?)\/composer\.phar"/g)].map(
        (m) => m[1],
      ),
    ),
  ]);
  if (Object.keys(node).length === 0 || Object.keys(nginx).length === 0) {
    throw new Error('No se pudieron leer las versiones publicadas');
  }
  if (Object.keys(composer).length === 0) throw new Error('getcomposer.org/download sin versiones');
  // phpMyAdmin: solo la línea 5.x (la que ofrece el catálogo) del índice oficial de versiones.
  const indicePma = JSON.parse(await bajar('https://www.phpmyadmin.net/home_page/version.json'));
  const phpmyadmin = masNuevas(
    'phpmyadmin',
    (indicePma.releases ?? []).map((e) => String(e.version)).filter((v) => /^5\.\d+\.\d+$/.test(v)),
  );
  if (Object.keys(phpmyadmin).length === 0) throw new Error('version.json de phpMyAdmin sin 5.x');
  return { node, composer, nginx, phpmyadmin };
}

let cambios = 0;
const archivosNuevos = [];
for (const [fuente, obtener] of [
  ['node', node],
  ['composer', composer],
  ['nginx', nginx],
  ['phpmyadmin', phpmyadmin],
]) {
  const archivo = path.join(CLAVES, `${fuente}.asc`);
  const actual = await readFile(archivo, 'utf8').catch(() => '');
  const nuevo = await obtener();
  // Primarias y subclaves (con su capacidad y vencimiento): todo lo que puede verificar firmas.
  const antes = new Map(todas(actual).map((c) => [c.huella, c]));
  const despues = new Map(todas(nuevo).map((c) => [c.huella, c]));
  const nPrim = [...despues.values()].filter((c) => c.huella === c.huellaPrimaria).length;
  console.log(`\n${fuente} (${nPrim} primarias y ${despues.size - nPrim} subclaves soportadas):`);
  for (const c of despues.values()) console.log(`  ${describir(c)}`);
  if (actual === nuevo) {
    console.log('  sin cambios');
    continue;
  }
  cambios++;
  for (const [h, c] of despues) {
    if (!antes.has(h)) console.log(`  + entra ${describir(c)}`);
    else {
      const a = antes.get(h);
      if (a.expiracion !== c.expiracion) {
        console.log(`  ~ vencimiento ${h}: ${fecha(a.expiracion)} → ${fecha(c.expiracion)}`);
      }
      if (a.firma !== c.firma || a.revocada !== c.revocada) {
        console.log(`  ~ cambia ${h}: antes ${describir(a)}`);
      }
    }
  }
  for (const [h, c] of antes) if (!despues.has(h)) console.log(`  - sale ${describir(c)}`);
  console.log('  (el contenido del archivo cambia)');
  archivosNuevos.push([archivo, nuevo]);
}

// Cota de fecha de las firmas: FECHA_ANILLO y la versión más nueva por rama.
const archivoVigencia = path.join(CLAVES, 'vigencia.json');
const vigenciaActual = JSON.parse(await readFile(archivoVigencia, 'utf8').catch(() => '{}'));
const versiones = await vigencia();
const { fecha: fechaActual, ...restoActual } = vigenciaActual;
console.log(`\nvigencia.json (FECHA_ANILLO ${fechaActual ?? 'sin fecha'}):`);
for (const f of ['node', 'composer', 'nginx', 'phpmyadmin']) {
  const antes = restoActual[f] ?? {};
  for (const [rama, v] of Object.entries(versiones[f])) {
    if (antes[rama] !== v) console.log(`  ~ ${f} ${rama}: ${antes[rama] ?? '(nueva)'} → ${v}`);
  }
}
if (cambios === 0 && JSON.stringify(restoActual) === JSON.stringify(versiones) && fechaActual) {
  console.log('  sin cambios');
} else {
  cambios++;
  const hoy = new Date().toISOString().slice(0, 10);
  archivosNuevos.push([
    archivoVigencia,
    `${JSON.stringify({ fecha: hoy, ...versiones }, null, 2)}\n`,
  ]);
  console.log(`  FECHA_ANILLO pasa a ${hoy}`);
}
if (escribir) {
  for (const [archivo, contenido] of archivosNuevos) {
    const previo = await readFile(archivo, 'utf8').catch(() => '');
    if (previo === contenido) continue;
    await writeFile(archivo, contenido);
    console.log(`  escrito ${path.relative(process.cwd(), archivo)}`);
  }
}
console.log(
  cambios === 0
    ? '\nSin cambios.'
    : escribir
      ? '\nAnillos actualizados: revise el diff y las huellas antes de confirmar.'
      : '\nHay cambios: vuelva a ejecutar con --escribir para guardarlos.',
);
