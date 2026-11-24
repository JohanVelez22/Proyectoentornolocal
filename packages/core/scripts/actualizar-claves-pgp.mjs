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

const fecha = (s) => (s === null ? 'no vence' : new Date(s * 1000).toISOString().slice(0, 10));
const describir = (c) => {
  const tipo = c.algoritmo === 22 ? 'Ed25519' : `RSA ${c.material.n.length * 8}`;
  const sub = c.huella === c.huellaPrimaria ? '' : `subclave de ${c.huellaPrimaria.slice(-16)}  `;
  const uso = c.firma ? 'firma' : 'no firma';
  const estado = c.revocada ? '  REVOCADA' : '';
  const quien = c.huella === c.huellaPrimaria ? `  ${c.usuarios[0] ?? ''}` : '';
  return `${c.huella}  ${sub}${tipo}  ${uso}  vence ${fecha(c.expiracion)}${estado}${quien}`;
};

let cambios = 0;
for (const [fuente, obtener] of [
  ['node', node],
  ['composer', composer],
  ['nginx', nginx],
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
  if (escribir) {
    await writeFile(archivo, nuevo);
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
