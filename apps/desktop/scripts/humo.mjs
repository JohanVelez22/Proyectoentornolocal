// Prueba de humo: arranca la app ya construida (empaquetada con `electron-builder --dir`, o `out/`
// con `--out`), con una carpeta de datos nueva y aislada, y recorre las vistas principales.
// Falla si la ventana queda en blanco, si el Marco no monta, si una vista queda vacía o si hay
// errores o avisos en la consola (también los de CSP).
//
//   node scripts/humo.mjs [--salida <carpeta de electron-builder>] [--out]
//
// Solo en Windows: el núcleo todavía no tiene plataforma para macOS ni Linux (`crearPlataforma`
// lanza "Plataforma aún no soportada (fase 4)", la app muestra un error y se cierra), así que ahí
// no hay ventana que recorrer. El CI empaqueta en los tres sistemas y corre esta prueba en Windows.
// Cuando haya plataforma para ellos, basta quitar el aviso de abajo (en Linux hace falta xvfb-run y
// `--no-sandbox`, ya previstos).
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(AQUI, '..');
const args = process.argv.slice(2);
const opcion = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const usarOut = args.includes('--out');

if (process.platform !== 'win32' && !args.includes('--forzar')) {
  console.error(
    'La prueba de humo solo corre en Windows (el núcleo aún no soporta otras plataformas). Use --forzar para intentarlo.',
  );
  process.exit(2);
}
const salida = path.resolve(opcion('--salida') ?? path.join(DESKTOP, 'release'));

const VISTAS = [
  ['Panel / Inicio', '#/'],
  ['Servicios', '#/servicios'],
  ['Versiones', '#/servicios/versiones/node'],
  ['Sitios / Proyectos', '#/proyectos'],
  ['Bases de datos', '#/bases-de-datos'],
  ['Herramientas', '#/herramientas'],
  // D38a: PHP dentro de Servicios y Agentes dentro de IA (con su pestaña).
  ['Servicios / PHP', '#/servicios/php'],
  ['IA / Agentes', '#/ia/agentes'],
  ['IA / Nube', '#/ia/nube'],
  ['IA / Modelos locales', '#/ia/local'],
  ['Ajustes', '#/ajustes'],
];

/** Rutas viejas que ya no son pantalla: tienen que terminar en su pestaña nueva. */
const REDIRECCIONES = [
  ['#/php', '#/servicios/php'],
  ['#/agentes', '#/ia/agentes'],
  ['#/ia-local', '#/ia/local'],
  ['#/sitios', '#/proyectos'],
];

/** El ejecutable de la app empaquetada dentro de la carpeta de salida de electron-builder. */
function buscarEjecutable() {
  if (!existsSync(salida)) throw new Error(`No existe ${salida}: falta electron-builder --dir.`);
  const hijos = readdirSync(salida).map((n) => path.join(salida, n));
  if (process.platform === 'win32') {
    const dir = hijos.find((h) => h.endsWith('win-unpacked'));
    const exe = dir && readdirSync(dir).find((n) => /^WolfCore Dev\.exe$/i.test(n));
    if (dir && exe) return path.join(dir, exe);
  } else if (process.platform === 'darwin') {
    for (const d of hijos.filter(
      (h) => statSync(h).isDirectory() && /^mac/.test(path.basename(h)),
    )) {
      const app = readdirSync(d).find((n) => n.endsWith('.app'));
      if (app) return path.join(d, app, 'Contents', 'MacOS', path.basename(app, '.app'));
    }
  } else {
    const dir = hijos.find((h) => h.endsWith('linux-unpacked'));
    if (dir) {
      const mayor = readdirSync(dir)
        .map((n) => path.join(dir, n))
        .filter((f) => statSync(f).isFile() && !path.extname(f))
        .sort((a, b) => statSync(b).size - statSync(a).size)[0];
      if (mayor) return mayor;
    }
  }
  throw new Error(`No se encontró el ejecutable empaquetado en ${salida}.`);
}

const datos = mkdtempSync(path.join(tmpdir(), 'wolfcore-humo-'));
const env = { ...process.env, WOLFCORE_DATOS: datos, ELECTRON_ENABLE_LOGGING: '1' };
delete env.ELECTRON_RENDERER_URL;
delete env.ELECTRON_RUN_AS_NODE;
const comunes = process.platform === 'linux' ? ['--no-sandbox', '--disable-gpu'] : [];

const fallos = [];
const falla = (m) => {
  fallos.push(m);
  console.error(`FALLO: ${m}`);
};
const registro = (m) => console.log(m);

/** Si no se puede conectar: qué responde el puerto de depuración y cómo está el proceso. */
async function diagnosticar(puerto) {
  for (const ruta of ['json/version', 'json/list']) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/${ruta}`, {
        signal: AbortSignal.timeout(8000),
      });
      console.error(`diagnóstico ${ruta}: ${r.status} ${(await r.text()).slice(0, 600)}`);
    } catch (e) {
      console.error(`diagnóstico ${ruta}: ${e}`);
    }
  }
}

let proc = null;
let browser = null;
const salidaApp = [];
try {
  const puerto = String(9400 + Math.floor(Math.random() * 400));
  let exe;
  let argsApp;
  let cwd = DESKTOP;
  if (usarOut) {
    registro(`Arrancando out/ con Electron (datos aislados en ${datos})`);
    exe = (await import('electron')).default;
    argsApp = [...comunes, `--remote-debugging-port=${puerto}`, '.'];
  } else {
    exe = buscarEjecutable();
    registro(`Arrancando ${exe} (datos aislados en ${datos})`);
    argsApp = [...comunes, `--remote-debugging-port=${puerto}`];
    cwd = path.dirname(exe);
  }
  // Se arranca la app a mano y se conecta por CDP: `_electron.launch` espera al inspector de Node y
  // en macOS y Linux se quedaba esperando aunque la app estuviera arriba.
  proc = spawn(exe, argsApp, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const guardar = (t) => salidaApp.push(String(t));
  proc.stdout.on('data', guardar);
  proc.stderr.on('data', guardar);
  proc.on('exit', (c, sg) => salidaApp.push(`[proceso terminó: código ${c}, señal ${sg}]`));

  let ws = null;
  for (let i = 0; i < 240 && !ws; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const m = /DevTools listening on (ws:\/\/\S+)/.exec(salidaApp.join(''));
    if (m) ws = m[1];
    if (proc.exitCode !== null)
      throw new Error('La app terminó antes de abrir el puerto de depuración.');
  }
  if (!ws) throw new Error('La app no abrió el puerto de depuración en 120 s.');
  try {
    browser = await chromium.connectOverCDP(ws, { timeout: 60_000 });
  } catch (e) {
    await diagnosticar(puerto);
    throw e;
  }
  const contexto = browser.contexts()[0];
  const consola = [];
  const alerta = (tipo, texto) => consola.push(`${tipo}: ${texto}`.slice(0, 500));
  contexto.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') alerta(m.type(), m.text());
  });
  let ventana = contexto.pages().find((p) => !p.url().startsWith('devtools:'));
  for (let i = 0; i < 240 && !ventana; i++) {
    await new Promise((r) => setTimeout(r, 500));
    ventana = contexto.pages().find((p) => !p.url().startsWith('devtools:'));
  }
  if (!ventana) throw new Error('La app no abrió ninguna ventana en 120 s.');
  ventana.on('pageerror', (e) => alerta('excepción', String(e)));
  // Se recarga con los oyentes puestos: nada de lo que pase al cargar se escapa.
  await ventana.reload();

  try {
    await ventana.waitForSelector('.marco .contenido-interno', { timeout: 60_000 });
  } catch {
    const cuerpo = await ventana.evaluate(() => document.body.innerText.length).catch(() => -1);
    falla(`El Marco no montó (la ventana está en blanco; texto del cuerpo: ${cuerpo}).`);
    throw new Error('sin Marco');
  }
  const api = await ventana.evaluate(() => typeof window.entorno === 'object');
  if (!api) falla('El puente del preload (window.entorno) no existe.');
  // Primer uso: sin el asistente encima.
  await ventana
    .evaluate(() => window.entorno.preferencias.guardar({ asistenteVisto: true }))
    .catch(() => undefined);
  // El recorrido de bienvenida puede haberse abierto antes de marcarlo como visto: Esc lo cierra.
  if (await ventana.$('[data-recorrido]')) await ventana.keyboard.press('Escape');
  await ventana.waitForTimeout(800);

  for (const [nombre, hash] of VISTAS) {
    await ventana.evaluate((h) => {
      location.hash = h;
    }, hash);
    let largo = 0;
    for (let i = 0; i < 60; i++) {
      await ventana.waitForTimeout(250);
      largo = await ventana.evaluate(() => {
        const c = document.querySelector('.contenido-interno');
        return c ? c.innerText.trim().length : 0;
      });
      if (largo > 40) break;
    }
    const medidas = await ventana.evaluate(() => {
      const c = document.querySelector('.contenido-interno');
      const r = c?.getBoundingClientRect();
      return { alto: r ? Math.round(r.height) : 0, ancho: r ? Math.round(r.width) : 0 };
    });
    const ruta = await ventana.evaluate(() => location.hash);
    if (largo <= 40) falla(`La vista "${nombre}" (${hash}) está vacía (texto: ${largo}).`);
    else if (medidas.alto < 100 || medidas.ancho < 300) {
      falla(`La vista "${nombre}" tiene un tamaño absurdo (${medidas.ancho}x${medidas.alto}).`);
    } else
      registro(`ok   ${nombre} (${ruta}): ${largo} caracteres, ${medidas.ancho}x${medidas.alto}`);
  }
  // D38a: la barra lateral tiene 11 entradas más Ajustes (Contenedores queda oculto por defecto).
  const entradas = await ventana.evaluate(() => document.querySelectorAll('.n-menu-item').length);
  if (entradas !== 12) falla(`La barra lateral tiene ${entradas} entradas (se esperaban 12).`);
  else registro('ok   barra lateral: 11 entradas y Ajustes');
  for (const [viejo, nuevo] of REDIRECCIONES) {
    await ventana.evaluate((h) => {
      location.hash = h;
    }, viejo);
    await ventana.waitForTimeout(600);
    const llego = await ventana.evaluate(() => location.hash.split('?')[0]);
    if (llego !== nuevo)
      falla(`La ruta vieja ${viejo} terminó en ${llego} (se esperaba ${nuevo}).`);
    else registro(`ok   redirección ${viejo} -> ${llego}`);
  }
  // Editor de código (D43): se abre la herramienta para que CodeMirror monte y meta sus estilos con
  // la CSP real de la ventana; cualquier aviso de CSP o error de consola hace fallar la prueba.
  await ventana.evaluate(() => {
    location.hash = '#/herramientas';
  });
  // Diff de carpetas (D44): está en la pestaña «Carpetas» de la tarjeta Comparar (D38a); solo se
  // abre la herramienta y la consola tiene que seguir limpia.
  try {
    await ventana.waitForSelector('[data-herramienta="comparar"]', { timeout: 30_000 });
    await ventana.evaluate(() => document.querySelector('[data-herramienta="comparar"]')?.click());
    await ventana.waitForSelector('.n-drawer .n-tabs-tab[data-name="diffCarpetas"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() =>
      document.querySelector('.n-drawer .n-tabs-tab[data-name="diffCarpetas"]')?.click(),
    );
    await ventana.waitForSelector('.n-drawer .herr', { state: 'attached', timeout: 30_000 });
    registro('ok   Diff de carpetas: la herramienta abrió');
  } catch (e) {
    falla(`El diff de carpetas no abrió: ${e}`);
  }
  try {
    await ventana.waitForSelector('[data-herramienta="editor"]', { timeout: 30_000 });
    // Clic por DOM: un diálogo del primer uso puede cubrir la tarjeta y no importa para esta prueba.
    await ventana.evaluate(() => document.querySelector('[data-herramienta="editor"]')?.click());
    await ventana.waitForSelector('.cm-editor .cm-content', { state: 'attached', timeout: 30_000 });
    const rol = await ventana.getAttribute('.cm-content', 'role');
    registro(`ok   Editor de código: CodeMirror montó (role=${rol})`);
  } catch (e) {
    falla(`El editor de código no montó: ${e}`);
  }
  await ventana.waitForTimeout(500);

  if (consola.length > 0) {
    for (const c of new Set(consola)) falla(`consola de la ventana -> ${c}`);
  } else registro('ok   consola sin errores ni avisos');
} catch (e) {
  if (!fallos.length || !/sin Marco/.test(String(e)))
    falla(`excepción en la prueba: ${e?.stack ?? e}`);
} finally {
  if (browser) await browser.close().catch(() => undefined);
  // Solo por su propio PID.
  if (proc && proc.exitCode === null && proc.pid) {
    try {
      process.kill(proc.pid);
    } catch {
      /* ya salió */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (fallos.length > 0 && salidaApp.length > 0) {
    console.error('--- salida de la app (últimas líneas) ---');
    console.error(
      salidaApp.join('').split(String.fromCharCode(10)).slice(-40).join(String.fromCharCode(10)),
    );
  }
  try {
    rmSync(datos, { recursive: true, force: true });
  } catch {
    /* un archivo aún abierto en Windows: es una carpeta temporal */
  }
}

if (fallos.length > 0) {
  console.error(`\nPrueba de humo FALLIDA (${fallos.length}).`);
  process.exit(1);
}
console.log('\nPrueba de humo correcta.');
process.exit(0);
