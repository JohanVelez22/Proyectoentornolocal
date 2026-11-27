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
import { Buffer } from 'node:buffer';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import http from 'node:http';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
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
// Uso del disco (D51): una carpeta temporal con tamaños conocidos. El diálogo nativo no se puede
// manejar desde aquí: con la carpeta de datos aislada, el argumento `--wolfcore-humo` y esta carpeta
// (dentro de la temporal y con este prefijo), `WOLFCORE_HUMO_CARPETA` hace que «Elegir carpeta»
// devuelva esa (el proceso principal la registra y la valida igual que a una elegida).
const discoHumo = mkdtempSync(path.join(tmpdir(), 'wolfcore-humo-disco-'));
mkdirSync(path.join(discoHumo, 'sub'));
writeFileSync(path.join(discoHumo, 'a.bin'), Buffer.alloc(1000));
writeFileSync(path.join(discoHumo, 'sub', 'b.bin'), Buffer.alloc(2500));
writeFileSync(path.join(discoHumo, 'sub', 'c.txt'), Buffer.alloc(4096));
const TOTAL_DISCO_HUMO = 7596;
const env = {
  ...process.env,
  WOLFCORE_DATOS: datos,
  WOLFCORE_HUMO_CARPETA: discoHumo,
  ELECTRON_ENABLE_LOGGING: '1',
};
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
    argsApp = [...comunes, `--remote-debugging-port=${puerto}`, '--wolfcore-humo', '.'];
  } else {
    exe = buscarEjecutable();
    registro(`Arrancando ${exe} (datos aislados en ${datos})`);
    argsApp = [...comunes, `--remote-debugging-port=${puerto}`, '--wolfcore-humo'];
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
  // Cliente HTTP (D48): la tarjeta abre, y una petición real a un servidor local (127.0.0.1, puerto
  // aleatorio) vuelve con su resumen: comprueba el IPC, el proceso principal y la CSP.
  const servidorHttp = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ metodo: req.method, ruta: req.url }));
  });
  try {
    await new Promise((ok) => servidorHttp.listen(0, '127.0.0.1', ok));
    const puertoHttp = servidorHttp.address().port;
    await ventana.evaluate(() => {
      location.hash = '#/herramientas';
    });
    await ventana.waitForSelector('[data-herramienta="clienteHttp"]', { timeout: 30_000 });
    await ventana.evaluate(() =>
      document.querySelector('[data-herramienta="clienteHttp"]')?.click(),
    );
    await ventana.waitForSelector('[data-testid="http-url"] input', { timeout: 30_000 });
    await ventana.fill('[data-testid="http-url"] input', `http://127.0.0.1:${puertoHttp}/humo`);
    await ventana.press('[data-testid="http-url"] input', 'Control+Enter');
    await ventana.waitForSelector('[data-testid="http-resumen"]', { timeout: 30_000 });
    const cuerpo = await ventana.textContent('[data-testid="http-cuerpo"]');
    if (!cuerpo || !cuerpo.includes('/humo'))
      falla(`El cliente HTTP no mostró la respuesta: ${cuerpo}`);
    else registro('ok   Cliente HTTP: petición local enviada desde el proceso principal');
  } catch (e) {
    falla(`El cliente HTTP no funcionó: ${e}`);
  } finally {
    servidorHttp.closeAllConnections();
    servidorHttp.close();
  }
  // Guía HTTP (D49): «Probar» de un código arranca el servidor de ejemplo, abre el cliente con la
  // petición rellena (no se envía sola) y, al enviarla, vuelve el 404 de 127.0.0.1.
  try {
    await ventana.evaluate(() => {
      location.hash = '#/herramientas';
    });
    await ventana.waitForSelector('[data-herramienta="guias"]', { timeout: 30_000 });
    await ventana.evaluate(() => document.querySelector('[data-herramienta="guias"]')?.click());
    await ventana.waitForSelector('.n-drawer .n-tabs-tab[data-name="guiaHttp"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() =>
      document.querySelector('.n-drawer .n-tabs-tab[data-name="guiaHttp"]')?.click(),
    );
    await ventana.waitForSelector('[data-testid="probar-codigo-404"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() => {
      const b = document.querySelector('[data-testid="probar-codigo-404"]');
      b?.closest('details')?.setAttribute('open', '');
      b?.click();
    });
    await ventana.waitForSelector('[data-testid="http-url"] input', { timeout: 30_000 });
    const url = await ventana.inputValue('[data-testid="http-url"] input');
    if (!/^http:\/\/127\.0\.0\.1:\d+\/estado\/404$/.test(url))
      falla(`«Probar» no rellenó la URL del servidor de ejemplo: ${url}`);
    if ((await ventana.locator('[data-testid="http-resumen"]').count()) > 0)
      falla('«Probar» envió la petición sin que el usuario pulsara Enviar.');
    await ventana.press('[data-testid="http-url"] input', 'Control+Enter');
    await ventana.waitForSelector('[data-testid="http-resumen"]', { timeout: 30_000 });
    const resumen = await ventana.textContent('[data-testid="http-resumen"]');
    const cuerpo404 = await ventana.textContent('[data-testid="http-cuerpo"]');
    if (!/404/.test(`${resumen} ${cuerpo404}`))
      falla(`El ejemplo 404 no devolvió un 404: ${resumen} ${cuerpo404}`);
    else
      registro('ok   Guía HTTP: «Probar» 404 abrió el cliente y el servidor de ejemplo respondió');
  } catch (e) {
    falla(`La guía HTTP (Probar) no funcionó: ${e}`);
  }
  // Guía de Git (D50): abre la pestaña, entra al laboratorio y ejecuta init y status en la carpeta
  // de práctica propia de WolfCore (sin red, sin tocar ningún repositorio real).
  try {
    await ventana.keyboard.press('Escape');
    await ventana.waitForSelector('.n-drawer', { state: 'detached', timeout: 15_000 });
    await ventana.waitForSelector('[data-herramienta="guias"]', { timeout: 30_000 });
    await ventana.evaluate(() => document.querySelector('[data-herramienta="guias"]')?.click());
    await ventana.waitForSelector('.n-drawer .n-tabs-tab[data-name="guiaGit"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() =>
      document.querySelector('.n-drawer .n-tabs-tab[data-name="guiaGit"]')?.click(),
    );
    await ventana.waitForSelector('[data-testid="git-tema-configuracion"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() =>
      document.querySelector('[data-testid="git-modo-laboratorio"]')?.click(),
    );
    await ventana.waitForSelector('[data-testid="lab-status"], [data-testid="lab-sin-git"]', {
      state: 'attached',
      timeout: 60_000,
    });
    if ((await ventana.locator('[data-testid="lab-sin-git"]').count()) > 0) {
      registro(
        'ok   Guía de Git: sin git en este equipo, el laboratorio lo explica y no instala nada',
      );
    } else {
      await ventana.evaluate(() => document.querySelector('[data-testid="lab-init"]')?.click());
      await ventana.waitForFunction(
        () =>
          /git init/.test(document.querySelector('[data-testid="lab-salida"]')?.textContent ?? ''),
        undefined,
        { timeout: 60_000 },
      );
      // Tras mostrar la salida de init, la vista sigue ocupada refrescando el estado y sus botones
      // están desactivados: un clic en ese momento se pierde. Se espera a que status esté activo.
      await ventana.waitForFunction(
        () => {
          const b = document.querySelector('[data-testid="lab-status"]');
          return b !== null && !b.hasAttribute('disabled');
        },
        undefined,
        { timeout: 60_000 },
      );
      await ventana.evaluate(() => document.querySelector('[data-testid="lab-status"]')?.click());
      await ventana.waitForFunction(
        () =>
          /git status/.test(
            document.querySelector('[data-testid="lab-salida"]')?.textContent ?? '',
          ),
        undefined,
        { timeout: 60_000 },
      );
      const salida = await ventana.textContent('[data-testid="lab-salida"]');
      if (!/On branch main/.test(salida ?? ''))
        falla(`El laboratorio de Git no mostró «On branch main»: ${salida}`);
      else registro('ok   Guía de Git: el laboratorio ejecutó init y status en su carpeta propia');
    }
  } catch (e) {
    const vista = await ventana
      .evaluate(
        () =>
          `${document.querySelector('[data-testid="lab-salida"]')?.textContent ?? ''} | ${[...document.querySelectorAll('.n-message')].map((m) => m.textContent).join(' / ')}`,
      )
      .catch(() => '');
    falla(`La guía de Git (laboratorio) no funcionó: ${e} [${vista}]`);
  }
  // Uso del disco (D51): abre la tarjeta, analiza la carpeta temporal por la interfaz y comprueba
  // el total exacto con el mismo IPC (el recorrido corre en su utilityProcess).
  try {
    await ventana.keyboard.press('Escape');
    await ventana.waitForSelector('.n-drawer', { state: 'detached', timeout: 15_000 });
    await ventana.waitForSelector('[data-herramienta="usoDisco"]', { timeout: 30_000 });
    await ventana.evaluate(() => document.querySelector('[data-herramienta="usoDisco"]')?.click());
    await ventana.waitForSelector('[data-testid="disco-elegir"]', {
      state: 'attached',
      timeout: 30_000,
    });
    await ventana.evaluate(() => document.querySelector('[data-testid="disco-elegir"]')?.click());
    await ventana.waitForSelector('[data-testid="disco-resumen"]', {
      state: 'attached',
      timeout: 60_000,
    });
    const total = await ventana.evaluate(async () => {
      const carpeta = await window.entorno.sistema.elegirCarpeta();
      const r = await window.entorno.discoUso.analizar(carpeta);
      return r.total;
    });
    if (total !== TOTAL_DISCO_HUMO)
      falla(`Uso del disco: el total fue ${total} y debía ser ${TOTAL_DISCO_HUMO}`);
    else
      registro(`ok   Uso del disco: analizó una carpeta temporal (${total} bytes) en su proceso`);
  } catch (e) {
    falla(`Uso del disco no funcionó: ${e}`);
  }
  // Compartir carpeta o archivo (D52): solo abre la tarjeta y comprueba el estado vacío. NO elige
  // nada ni comparte: no se abre ningún túnel ni se publica nada.
  try {
    await ventana.keyboard.press('Escape');
    await ventana.waitForSelector('.n-drawer', { state: 'detached', timeout: 15_000 });
    await ventana.waitForSelector('[data-herramienta="compartir"]', { timeout: 30_000 });
    await ventana.evaluate(() => document.querySelector('[data-herramienta="compartir"]')?.click());
    await ventana.waitForSelector('[data-testid="compartir-elegir-carpeta"]', {
      state: 'attached',
      timeout: 30_000,
    });
    const vacio = await ventana.evaluate(
      () => document.querySelector('.compartir .estado-vacio') !== null,
    );
    const activa = await ventana.evaluate(
      () => document.querySelector('[data-testid="compartir-activa"]') !== null,
    );
    if (!vacio || activa) falla('Compartir: la tarjeta no mostró el estado vacío al abrirse');
    else registro('ok   Compartir carpeta o archivo: la tarjeta abre vacía (sin compartir nada)');
  } catch (e) {
    falla(`Compartir carpeta o archivo no funcionó: ${e}`);
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
    rmSync(discoHumo, { recursive: true, force: true });
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
