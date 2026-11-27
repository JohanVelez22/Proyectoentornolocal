#!/usr/bin/env node
/**
 * Lista, por idioma, lo que le falta a cada traducción respecto del inglés (`en`):
 *   - claves (rutas con puntos) que existen en `en` y no en el idioma;
 *   - claves que sobran (están en el idioma y no en `en`);
 *   - placeholders `{x}` de un texto que no coinciden con los del inglés;
 *   - funciones cuyos parámetros no coinciden (nombres o cantidad) y arreglos de otro largo;
 *   - traducciones desactualizadas: claves que el idioma tiene pero cuyo texto en español (`es`)
 *     cambió desde el commit de partida de los idiomas (`--desde`, por omisión 5f98211, cuando se completaron los 12 idiomas sobre el es actual);
 *   - lo mismo para los textos del proceso principal (`main/textos.ts`) y los avisos
 *     (`shared/textosAvisos.ts`): códigos que faltan.
 *
 * Uso (desde la raíz del repositorio):
 *   node scripts/i18n-faltantes.mjs                      resumen por idioma en pantalla
 *   node scripts/i18n-faltantes.mjs --salida ruta.json   además guarda el detalle completo
 *   node scripts/i18n-faltantes.mjs --idioma de,ja       solo esos idiomas
 *   node scripts/i18n-faltantes.mjs --desde <commit>     commit de partida para «desactualizadas»
 *   node scripts/i18n-faltantes.mjs --json               el detalle completo por la salida estándar
 *
 * Lee los diccionarios tal como se escribieron (sin el respaldo en inglés), así que el resultado
 * es lo que de verdad falta traducir. es, en, pt y fr deben dar 0; los demás pueden ir
 * incompletos y la app muestra en inglés lo que falte (ver `completar` en `i18n/index.ts`).
 * Usa `jiti` (ya instalado como dependencia de las herramientas) para leer los .ts sin compilar.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/* global process, console */
import { createJiti } from 'jiti';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESKTOP = join(RAIZ, 'apps/desktop/src');

// `@pel/core` carga módulos de Node: aquí solo hacen falta sus constantes de la interfaz.
const jiti = createJiti(import.meta.url, {
  alias: { '@pel/core': join(RAIZ, 'packages/core/src/constantesUi.ts') },
  moduleCache: false,
});

const args = process.argv.slice(2);
const valor = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const salida = valor('--salida');
const soloJson = args.includes('--json');
const desde = valor('--desde') ?? '5f98211';
const filtro = valor('--idioma')
  ?.split(',')
  .map((x) => x.trim());

const { IDIOMAS_UI } = await jiti.import(join(RAIZ, 'packages/core/src/constantesUi.ts'));
const BASE = ['es', 'en', 'pt', 'fr'];
const idiomas = IDIOMAS_UI.filter((i) => i !== 'en' && (!filtro || filtro.includes(i)));

const esNodo = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Igual que `fusionar` de `i18n/index.ts`: lo de `extra` pisa a `base` hoja a hoja. */
function fusionar(base, extra) {
  const res = { ...(esNodo(base) ? base : {}) };
  for (const [k, v] of Object.entries(esNodo(extra) ? extra : {})) {
    res[k] = esNodo(v) && esNodo(res[k]) ? fusionar(res[k], v) : v;
  }
  return res;
}

/** Diccionario tal como lo usa la app: el principal más su `extra/<idioma>.ts`, si existe. */
const cargar = async (i) => {
  const base = (await jiti.import(join(DESKTOP, `renderer/i18n/${i}.ts`)))[i];
  if (BASE.includes(i)) return base;
  try {
    const extra = (await jiti.import(join(DESKTOP, `renderer/i18n/extra/${i}.ts`)))[`${i}Extra`];
    return fusionar(base, extra);
  } catch {
    return base;
  }
};
const en = await cargar('en');

/** Parámetros de una función: `(a, b: x) =>` ya sin tipos (jiti los quita). */
function parametros(f) {
  const t = Function.prototype.toString.call(f);
  const m =
    t.match(/^(?:async\s*)?(?:function\s*\w*\s*)?\(([^)]*)\)/) ??
    t.match(/^(?:async\s*)?(\w+)\s*=>/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((p) => p.trim().replace(/\s*=.*$/, ''))
    .filter(Boolean);
}

const marcas = (t) => [...String(t).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Hojas de un diccionario: ruta con puntos → valor. */
function hojas(o, pre = '', r = {}) {
  for (const [k, v] of Object.entries(o)) {
    const ruta = pre ? `${pre}.${k}` : k;
    if (esNodo(v)) hojas(v, ruta, r);
    else r[ruta] = v;
  }
  return r;
}

const hojasEn = hojas(en);

/** `es` tal como estaba en `desde` (para saber qué textos cambiaron); null si no se puede leer. */
async function esAntiguo() {
  try {
    const src = execFileSync('git', ['show', `${desde}:apps/desktop/src/renderer/i18n/es.ts`], {
      cwd: RAIZ,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const dir = mkdtempSync(join(tmpdir(), 'i18n-es-'));
    const archivo = join(dir, 'es.ts');
    writeFileSync(archivo, src, 'utf8');
    return hojas((await jiti.import(archivo)).es);
  } catch {
    return null;
  }
}
const hojasEsAntiguas = await esAntiguo();
const hojasEs = hojas(await cargar('es'));
const huella = (v) =>
  typeof v === 'function' ? Function.prototype.toString.call(v) : JSON.stringify(v);

function comparar(dic, id) {
  const h = hojas(dic);
  const faltan = [];
  const sobran = [];
  const placeholders = [];
  const funciones = [];
  const arreglos = [];
  for (const [ruta, vEn] of Object.entries(hojasEn)) {
    if (!(ruta in h)) {
      faltan.push(ruta);
      continue;
    }
    const v = h[ruta];
    if (typeof vEn === 'function') {
      if (typeof v !== 'function') funciones.push({ ruta, en: parametros(vEn), idioma: typeof v });
      else {
        const a = parametros(vEn);
        const b = parametros(v);
        if (a.join() !== b.join()) funciones.push({ ruta, en: a, idioma: b });
      }
    } else if (Array.isArray(vEn)) {
      if (!Array.isArray(v) || v.length !== vEn.length) {
        arreglos.push({ ruta, en: vEn.length, idioma: Array.isArray(v) ? v.length : typeof v });
      }
    } else if (typeof vEn === 'string') {
      if (typeof v !== 'string') funciones.push({ ruta, en: 'string', idioma: typeof v });
      else if (marcas(vEn).join() !== marcas(v).join()) {
        placeholders.push({ ruta, en: marcas(vEn), idioma: marcas(v) });
      }
    }
  }
  for (const ruta of Object.keys(h)) if (!(ruta in hojasEn)) sobran.push(ruta);
  // El texto en español cambió desde la base: la traducción existe pero cuenta otra cosa.
  const desactualizadas =
    hojasEsAntiguas && !BASE.includes(id)
      ? Object.keys(h).filter(
          (ruta) =>
            ruta in hojasEs &&
            ruta in hojasEsAntiguas &&
            huella(hojasEs[ruta]) !== huella(hojasEsAntiguas[ruta]),
        )
      : [];
  return { faltan, sobran, placeholders, funciones, arreglos, desactualizadas };
}

const textosMainMod = await jiti.import(join(DESKTOP, 'main/textos.ts'));
const avisosMod = await jiti.import(join(DESKTOP, 'shared/textosAvisos.ts'));

const resultado = {
  generado: new Date().toISOString(),
  base: 'en',
  totalClavesEn: Object.keys(hojasEn).length,
  desde: hojasEsAntiguas ? desde : null,
  idiomas: {},
  resumen: {},
};

for (const i of idiomas) {
  const c = comparar(await cargar(i), i);
  const mainFaltan = textosMainMod.clavesSinTraducirMain(i);
  const avisosPropios = new Set(avisosMod.CODIGOS_AVISO_POR_IDIOMA[i]);
  const avisosFaltan = avisosMod.CODIGOS_AVISO.filter((k) => !avisosPropios.has(k));
  resultado.idiomas[i] = {
    base: BASE.includes(i),
    renderer: c,
    main: { faltan: mainFaltan },
    avisos: { faltan: avisosFaltan },
  };
  resultado.resumen[i] = {
    faltan: c.faltan.length,
    sobran: c.sobran.length,
    placeholders: c.placeholders.length,
    funciones: c.funciones.length,
    arreglos: c.arreglos.length,
    desactualizadas: c.desactualizadas.length,
    mainFaltan: mainFaltan.length,
    avisosFaltan: avisosFaltan.length,
    porcentajeCompleto: Number((100 * (1 - c.faltan.length / resultado.totalClavesEn)).toFixed(1)),
  };
}

if (salida) {
  mkdirSync(dirname(resolve(salida)), { recursive: true });
  writeFileSync(resolve(salida), JSON.stringify(resultado, null, 2) + '\n', 'utf8');
}

if (soloJson) {
  process.stdout.write(JSON.stringify(resultado, null, 2) + '\n');
} else {
  console.log(`Claves de en (renderer): ${resultado.totalClavesEn}`);
  console.log('idioma  faltan  sobran  {x}  func  arr  desact  main  avisos  completo');
  for (const [i, r] of Object.entries(resultado.resumen)) {
    console.log(
      `${i.padEnd(6)}  ${String(r.faltan).padStart(6)}  ${String(r.sobran).padStart(6)}  ${String(r.placeholders).padStart(3)}  ${String(r.funciones).padStart(4)}  ${String(r.arreglos).padStart(3)}  ${String(r.desactualizadas).padStart(6)}  ${String(r.mainFaltan).padStart(4)}  ${String(r.avisosFaltan).padStart(6)}  ${r.porcentajeCompleto}%`,
    );
  }
  if (salida) console.log(`Detalle guardado en ${resolve(salida)}`);
}
