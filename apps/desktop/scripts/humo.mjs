// Prueba de humo: arranca la app ya construida (empaquetada con `electron-builder --dir`, o `out/`
// con `--out`), con una carpeta de datos nueva y aislada, y recorre las vistas principales.
// Falla si la ventana queda en blanco, si el Marco no monta, si una vista queda vacía o si hay
// errores o avisos en la consola (también los de CSP).
//
//   node scripts/humo.mjs [--salida <carpeta de electron-builder>] [--out]
//
// En Linux se lanza sin sandbox de Chromium (el CI no instala chrome-sandbox con SUID) y debe correr
// bajo xvfb-run.
import { _electron as electron } from 'playwright-core';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(AQUI, '..');
const args = process.argv.slice(2);
const opcion = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const usarOut = args.includes('--out');
const salida = path.resolve(opcion('--salida') ?? path.join(DESKTOP, 'release'));

const VISTAS = [
  ['Panel / Inicio', '#/'],
  ['Servicios', '#/servicios'],
  ['Versiones', '#/servicios/versiones/node'],
  ['Sitios / Proyectos', '#/proyectos'],
  ['Bases de datos', '#/bases-de-datos'],
  ['Herramientas', '#/herramientas'],
  ['Ajustes', '#/ajustes'],
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
const env = { ...process.env, WOLFCORE_DATOS: datos };
delete env.ELECTRON_RENDERER_URL;
delete env.ELECTRON_RUN_AS_NODE;
const comunes = process.platform === 'linux' ? ['--no-sandbox', '--disable-gpu'] : [];

const fallos = [];
const falla = (m) => {
  fallos.push(m);
  console.error(`FALLO: ${m}`);
};
const registro = (m) => console.log(m);

let app;
try {
  if (usarOut) {
    registro(`Arrancando out/ con Electron (datos aislados en ${datos})`);
    app = await electron.launch({
      args: [...comunes, '.'],
      cwd: DESKTOP,
      env,
      executablePath: (await import('electron')).default,
    });
  } else {
    const exe = buscarEjecutable();
    registro(`Arrancando ${exe} (datos aislados en ${datos})`);
    app = await electron.launch({ executablePath: exe, args: comunes, env });
  }

  const consola = [];
  const alerta = (tipo, texto) => consola.push(`${tipo}: ${texto}`.slice(0, 500));
  app.context().on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') alerta(m.type(), m.text());
  });
  app.context().on('weberror', (e) => alerta('excepción', String(e.error())));

  const ventana = await app.firstWindow({ timeout: 60_000 });
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
  await ventana.waitForTimeout(500);

  if (consola.length > 0) {
    for (const c of new Set(consola)) falla(`consola de la ventana -> ${c}`);
  } else registro('ok   consola sin errores ni avisos');
} catch (e) {
  if (!fallos.length || !/sin Marco/.test(String(e)))
    falla(`excepción en la prueba: ${e?.stack ?? e}`);
} finally {
  if (app) {
    const proc = app.process();
    await Promise.race([
      app.evaluate(({ app: a }) => a.exit(0)).catch(() => undefined),
      new Promise((r) => setTimeout(r, 15_000)),
    ]);
    // Solo por su propio PID.
    if (proc.exitCode === null && proc.pid) {
      try {
        process.kill(proc.pid);
      } catch {
        /* ya salió */
      }
    }
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
