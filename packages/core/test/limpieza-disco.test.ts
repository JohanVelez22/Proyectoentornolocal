import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';
import {
  nombresPerfilesFirefox,
  interpretarAnclas,
  lecturaReal,
  rutasLimpiezaWindows,
  validarTemp,
} from '../src/plataforma/limpiezaWin';
import type { CategoriaLimpieza, RutasCategoriaLimpieza } from '../src/plataforma/tipos';
import {
  CATEGORIAS_LIMPIEZA,
  LimpiezaDisco,
  type DepsLimpiezaDisco,
} from '../src/sistema/limpiezaDisco';
import { carpetaTemporal } from './temporales';

const HORA = 3_600_000;
const DIA = 24 * HORA;
/**
 * Hora de referencia de las pruebas, un año por delante: en TEMP la edad cuenta también la fecha
 * de creación y la de cambio (que `utimes` deja en "ahora"), así que con esta referencia esas
 * fechas reales quedan viejas y manda la fecha de modificación que pone `archivo`.
 */
const T0 = Date.now() + 365 * DIA;

/** Crea un archivo con `bytes` bytes y una antigüedad (horas) dada respecto a `T0`. */
function archivo(ruta: string, bytes: number, horas = 100): string {
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, Buffer.alloc(bytes, 7));
  const t = new Date(T0 - horas * HORA);
  utimesSync(ruta, t, t);
  return ruta;
}

const existe = (r: string): boolean => existsSync(r);

/**
 * Árbol temporal que imita las rutas. NADA toca el TEMP, los navegadores, Prefetch ni la carpeta
 * de WolfCore Dev reales: todo vive dentro de `raiz` y la plataforma falsa devuelve esas rutas.
 */
async function escenario(extra: Partial<DepsLimpiezaDisco> = {}) {
  const raiz = await carpetaTemporal('pel-limpieza-');
  const p = (...t: string[]): string => path.join(raiz, ...t);
  const datos = p('WolfCoreDev');
  const proyecto = p('Proyectos', 'miapp');
  const rutas = {
    temp: p('usuario', 'Temp'),
    chrome: p('usuario', 'Chrome', 'User Data'),
    prefetch: p('Windows', 'Prefetch'),
    datos,
    proyecto,
    // Centinelas: la carpeta padre de TEMP y las ajenas.
    padre: p('usuario', 'centinela-padre.txt'),
  };
  const f = {
    tempViejo: archivo(p('usuario', 'Temp', 'viejo.tmp'), 100, 48),
    tempSub: archivo(p('usuario', 'Temp', 'sub', 'hondo', 'viejo2.tmp'), 200, 72),
    tempNuevo: archivo(p('usuario', 'Temp', 'nuevo.tmp'), 50, 1),
    chromeCache: archivo(path.join(rutas.chrome, 'Default', 'Cache', 'Cache_Data', 'a.bin'), 1000),
    chromeCodigo: archivo(path.join(rutas.chrome, 'Default', 'Code Cache', 'js', 'b.bin'), 500),
    chromeGpu: archivo(path.join(rutas.chrome, 'Default', 'GPUCache', 'c.bin'), 300),
    chromeP1: archivo(path.join(rutas.chrome, 'Profile 1', 'Cache', 'd.bin'), 700),
    cookies: archivo(path.join(rutas.chrome, 'Default', 'Cookies'), 10),
    login: archivo(path.join(rutas.chrome, 'Default', 'Login Data'), 10),
    historial: archivo(path.join(rutas.chrome, 'Default', 'History'), 10),
    storage: archivo(path.join(rutas.chrome, 'Default', 'Local Storage', 'leveldb', 'x'), 10),
    pf: archivo(path.join(rutas.prefetch, 'APP.EXE-AAAA.pf'), 400),
    pfOtro: archivo(path.join(rutas.prefetch, 'Layout.ini'), 20),
    zip: archivo(path.join(datos, 'tmp', 'paquete.zip'), 5000, 5),
    zipNuevo: archivo(path.join(datos, 'tmp', 'bajando.zip'), 5000, 0.1),
    zipDentro: archivo(path.join(datos, 'tmp', 'trabajo', 'x.zip'), 5000, 90),
    sesion: archivo(path.join(datos, 'tmp', 'phpmyadmin', 'sesiones', 's1'), 10, 90),
    logViejo: archivo(path.join(datos, 'logs', 'sitios', 'viejo.log'), 800, 31 * 24),
    logReciente: archivo(path.join(datos, 'logs', 'sitios', 'reciente.log'), 100, 24),
    datosCentinela: archivo(path.join(datos, 'data', 'mysql', '8.0', 'ibdata1'), 10, 9999),
    respaldo: archivo(path.join(datos, 'respaldos', 'auditoria', 'viejo.sql'), 10, 9999),
    proyectoArchivo: archivo(path.join(proyecto, 'index.php'), 10, 9999),
    padre: archivo(rutas.padre, 10, 9999),
  };
  const falsa = new PlataformaFalsa();
  const limpieza: RutasCategoriaLimpieza[] = [
    { categoria: 'temp', rutas: [rutas.temp], requiereAdmin: false },
    {
      categoria: 'cache-chrome',
      rutas: [
        path.join(rutas.chrome, 'Default', 'Cache'),
        path.join(rutas.chrome, 'Default', 'Code Cache'),
        path.join(rutas.chrome, 'Default', 'GPUCache'),
        path.join(rutas.chrome, 'Profile 1', 'Cache'),
      ],
      requiereAdmin: false,
      navegador: 'chrome',
    },
    { categoria: 'wolfcore-descargas', rutas: [path.join(datos, 'tmp')], requiereAdmin: false },
    { categoria: 'wolfcore-registros', rutas: [path.join(datos, 'logs')], requiereAdmin: false },
    { categoria: 'prefetch', rutas: [rutas.prefetch], requiereAdmin: true },
  ];
  falsa.limpieza = limpieza;
  falsa.papeleraDestino = p('papelera-falsa');
  const l = new LimpiezaDisco({
    plataforma: falsa,
    carpetaDatos: () => datos,
    rutasVetadas: async () => [
      path.join(datos, 'data'),
      path.join(datos, 'respaldos'),
      path.join(datos, 'run'),
      proyecto,
    ],
    carpetaRegistro: () => path.join(datos, 'logs', 'limpieza'),
    ahora: () => T0,
    ...extra,
  });
  return { raiz, p, rutas, f, falsa, l, limpieza, datos };
}

const codigo = async (promesa: Promise<unknown>): Promise<string | null> => {
  try {
    await promesa;
    return null;
  } catch (e) {
    return e instanceof ErrorWolf ? e.codigo : `otro: ${String(e)}`;
  }
};

describe('limpieza de disco: análisis', () => {
  it('suma archivos y bytes por categoría y por carpeta, y solo cuenta lo que se borraría', async () => {
    const { l, rutas } = await escenario();
    const r = await l.analizar([
      'temp',
      'cache-chrome',
      'wolfcore-descargas',
      'wolfcore-registros',
    ]);
    const temp = r.find((x) => x.categoria === 'temp')!;
    // El archivo de 1 h (nuevo.tmp) no cuenta.
    expect(temp.archivos).toBe(2);
    expect(temp.bytes).toBe(300);
    expect(temp.carpetas).toHaveLength(1);
    expect(temp.carpetas[0]!.bytes).toBe(300);
    const chrome = r.find((x) => x.categoria === 'cache-chrome')!;
    expect(chrome.archivos).toBe(4);
    expect(chrome.bytes).toBe(1000 + 500 + 300 + 700);
    expect(chrome.carpetas).toHaveLength(4);
    // Descargas: solo el zip suelto y viejo (no el de hace 6 min, ni la carpeta de trabajo).
    const desc = r.find((x) => x.categoria === 'wolfcore-descargas')!;
    expect([desc.archivos, desc.bytes]).toEqual([1, 5000]);
    // Registros: solo el de más de 30 días.
    const reg = r.find((x) => x.categoria === 'wolfcore-registros')!;
    expect([reg.archivos, reg.bytes]).toEqual([1, 800]);
    expect(temp.carpetas[0]!.ruta.toLowerCase()).toContain(path.basename(rutas.temp).toLowerCase());
  });

  it('solo vienen marcadas las cachés claramente regenerables', async () => {
    const { l } = await escenario();
    const r = await l.analizar();
    const marcada = Object.fromEntries(r.map((x) => [x.categoria, x.marcada]));
    expect(marcada).toMatchObject({
      temp: true,
      'cache-chrome': true,
      'cache-edge': true,
      'cache-brave': true,
      'cache-firefox': true,
      'wolfcore-descargas': false,
      'wolfcore-registros': false,
      prefetch: false,
    });
    expect(r.map((x) => x.categoria)).toEqual([...CATEGORIAS_LIMPIEZA]);
    const borrado = Object.fromEntries(r.map((x) => [x.categoria, x.borrado]));
    expect(borrado.temp).toBe('definitivo');
    expect(borrado['cache-chrome']).toBe('definitivo');
    expect(borrado['wolfcore-registros']).toBe('papelera');
    expect(borrado['wolfcore-descargas']).toBe('papelera');
  });

  it('no sigue un enlace de TEMP que apunta a una carpeta con un centinela', async (ctx) => {
    const { l, rutas, p, f } = await escenario();
    const objetivo = p('objetivo-del-enlace');
    const centinela = archivo(path.join(objetivo, 'centinela.txt'), 4000, 9999);
    try {
      symlinkSync(objetivo, path.join(rutas.temp, 'enlace'), 'junction');
    } catch {
      ctx.skip();
      return;
    }
    const [temp] = await l.analizar(['temp']);
    expect(temp!.archivos).toBe(2);
    expect(temp!.bytes).toBe(300);
    const r = await l.limpiar(['temp'], true);
    expect(r.categorias[0]!.motivos.enlace).toBeGreaterThanOrEqual(1);
    expect(existe(centinela)).toBe(true);
    expect(existe(f.tempViejo)).toBe(false);
  });

  it('nunca lista ni cuenta respaldos ni datos', async () => {
    const { l, datos } = await escenario();
    const r = await l.analizar();
    const todas = r.flatMap((x) => x.carpetas.map((c) => c.ruta.toLowerCase()));
    expect(todas.some((t) => t.includes('respaldos'))).toBe(false);
    expect(todas.some((t) => t.includes(`${path.sep}data${path.sep}`.toLowerCase()))).toBe(false);
    expect(todas.every((t) => !t.startsWith(path.join(datos, 'data').toLowerCase()))).toBe(true);
  });

  it('prefetch viene desmarcado y sin administrador queda bloqueado', async () => {
    const { l, falsa } = await escenario();
    let [pf] = await l.analizar(['prefetch']);
    expect(pf!.marcada).toBe(false);
    expect(pf!.bloqueada).toBe('requiere-admin');
    // Solo los .pf cuentan.
    expect([pf!.archivos, pf!.bytes]).toEqual([1, 400]);
    falsa.administrador = true;
    [pf] = await l.analizar(['prefetch']);
    expect(pf!.bloqueada).toBeNull();
  });

  it('una categoría que no existe es un error del catálogo', async () => {
    const { l } = await escenario();
    expect(await codigo(l.analizar(['todo']))).toBe('disco.categoria_invalida');
  });
});

describe('limpieza de disco: limpiar', () => {
  it('sin confirmado falla y no borra nada', async () => {
    const { l, f } = await escenario();
    await l.analizar(['temp']);
    expect(await codigo(l.limpiar(['temp'], undefined as unknown as true))).toBe(
      'disco.sin_confirmar',
    );
    expect(await codigo(l.limpiar(['temp'], false as unknown as true))).toBe('disco.sin_confirmar');
    expect(existe(f.tempViejo)).toBe(true);
  });

  it('exige un análisis reciente de cada categoría', async () => {
    const { l, f } = await escenario();
    expect(await codigo(l.limpiar(['temp'], true))).toBe('disco.sin_analisis');
    expect(existe(f.tempViejo)).toBe(true);
    let ahora = T0;
    const e = await escenario({ ahora: () => ahora });
    await e.l.analizar(['temp']);
    ahora += 31 * 60_000;
    expect(await codigo(e.l.limpiar(['temp'], true))).toBe('disco.sin_analisis');
  });

  it('TEMP: borra lo de más de 24 h, deja el archivo de 1 h, el padre y las carpetas vacías sobran', async () => {
    const { l, f, rutas } = await escenario();
    await l.analizar(['temp']);
    const r = await l.limpiar(['temp'], true);
    expect(r.liberados).toBe(300);
    expect(r.archivos).toBe(2);
    expect(existe(f.tempViejo)).toBe(false);
    expect(existe(f.tempSub)).toBe(false);
    expect(existe(f.tempNuevo)).toBe(true);
    // La carpeta que quedó vacía se quita; la raíz no.
    expect(existe(path.join(rutas.temp, 'sub'))).toBe(false);
    expect(existe(rutas.temp)).toBe(true);
    // Centinela en la carpeta padre de TEMP: intacto.
    expect(existe(f.padre)).toBe(true);
    expect(existe(f.datosCentinela)).toBe(true);
    expect(existe(f.respaldo)).toBe(true);
    expect(existe(f.proyectoArchivo)).toBe(true);
  });

  it('con el navegador abierto su caché queda bloqueada y no se borra', async () => {
    const { l, f, falsa } = await escenario();
    falsa.navegadoresAbiertosFalsos = ['chrome'];
    const [c] = await l.analizar(['cache-chrome']);
    expect(c!.bloqueada).toBe('navegador-abierto');
    const r = await l.limpiar(['cache-chrome'], true);
    expect(r.categorias[0]!.bloqueada).toBe('navegador-abierto');
    expect(r.archivos).toBe(0);
    for (const x of [f.chromeCache, f.chromeCodigo, f.chromeGpu, f.chromeP1]) {
      expect(existe(x)).toBe(true);
    }
  });

  it('si el navegador se abre entre el análisis y la limpieza, se vuelve a comprobar', async () => {
    const { l, f, falsa } = await escenario();
    await l.analizar(['cache-chrome']);
    falsa.navegadoresAbiertosFalsos = ['chrome'];
    const r = await l.limpiar(['cache-chrome'], true);
    expect(r.categorias[0]!.bloqueada).toBe('navegador-abierto');
    expect(existe(f.chromeCache)).toBe(true);
  });

  it('si no se puede saber qué navegadores hay abiertos, se trata como abierto', async () => {
    const { l, f, falsa } = await escenario();
    falsa.navegadoresAbiertosFalsos = null;
    const [c] = await l.analizar(['cache-chrome']);
    expect(c!.bloqueada).toBe('navegador-abierto');
    await l.limpiar(['cache-chrome'], true);
    expect(existe(f.chromeCache)).toBe(true);
  });

  it('con el navegador cerrado borra solo las cachés: Cookies, Login Data e Historial quedan', async () => {
    const { l, f } = await escenario();
    await l.analizar(['cache-chrome']);
    const r = await l.limpiar(['cache-chrome'], true);
    expect(r.liberados).toBe(2500);
    for (const x of [f.chromeCache, f.chromeCodigo, f.chromeGpu, f.chromeP1]) {
      expect(existe(x)).toBe(false);
    }
    for (const x of [f.cookies, f.login, f.historial, f.storage]) expect(existe(x)).toBe(true);
    // La carpeta de caché en sí (la raíz) se conserva.
    expect(existe(path.join(f.cookies, '..', 'Cache'))).toBe(true);
  });

  it('una ruta de navegador que no es una carpeta de caché aborta la categoría', async () => {
    const { l, f, falsa, rutas } = await escenario();
    falsa.limpieza = falsa.limpieza.map((c) =>
      c.categoria === 'cache-chrome' ? { ...c, rutas: [path.join(rutas.chrome, 'Default')] } : c,
    );
    const [c] = await l.analizar(['cache-chrome']);
    expect(c!.bloqueada).toBe('ruta-vetada');
    await l.analizar(['temp']);
    expect(await codigo(l.limpiar(['cache-chrome'], true))).toBe('disco.sin_analisis');
    expect(existe(f.cookies)).toBe(true);
  });

  it('Prefetch solo con administrador y solo los .pf', async () => {
    const { l, f, falsa } = await escenario();
    await l.analizar(['prefetch']);
    let r = await l.limpiar(['prefetch'], true);
    expect(r.categorias[0]!.bloqueada).toBe('requiere-admin');
    expect(existe(f.pf)).toBe(true);
    falsa.administrador = true;
    await l.analizar(['prefetch']);
    r = await l.limpiar(['prefetch'], true);
    expect(r.archivos).toBe(1);
    expect(existe(f.pf)).toBe(false);
    expect(existe(f.pfOtro)).toBe(true);
  });

  it('registros y descargas de WolfCore van a la papelera; lo reciente y lo ajeno queda', async () => {
    const { l, f, falsa } = await escenario();
    await l.analizar(['wolfcore-descargas', 'wolfcore-registros']);
    const r = await l.limpiar(['wolfcore-descargas', 'wolfcore-registros'], true);
    expect(falsa.enPapelera.map((x) => path.basename(x)).sort()).toEqual([
      'paquete.zip',
      'viejo.log',
    ]);
    expect(r.enPapelera).toBe(5800);
    expect(existe(f.zip)).toBe(false);
    expect(existe(f.logViejo)).toBe(false);
    expect(existe(f.logReciente)).toBe(true);
    expect(existe(f.zipNuevo)).toBe(true);
    expect(existe(f.zipDentro)).toBe(true);
    expect(existe(f.sesion)).toBe(true);
    // Las carpetas de registros (sitios) no se quitan aunque queden vacías.
    expect(existe(path.dirname(f.logViejo))).toBe(true);
    expect(existe(f.datosCentinela)).toBe(true);
    expect(existe(f.respaldo)).toBe(true);
  });

  it('sin papelera disponible no se borra nada de lo que va a la papelera', async () => {
    const { l, f, falsa } = await escenario();
    falsa.papeleraDisponible = false;
    await l.analizar(['wolfcore-registros']);
    const r = await l.limpiar(['wolfcore-registros'], true);
    expect(r.categorias[0]!.motivos['sin-papelera']).toBe(1);
    expect(existe(f.logViejo)).toBe(true);
  });

  it('un .env, algo de FlyEnv o PhpWebStudy dentro de TEMP no se toca', async () => {
    const { l, rutas, p } = await escenario();
    const env = archivo(path.join(rutas.temp, '.env'), 5, 500);
    const env2 = archivo(path.join(rutas.temp, 'app', '.env.local'), 5, 500);
    const fly = archivo(path.join(rutas.temp, 'FlyEnv', 'cache.tmp'), 5, 500);
    const pws = archivo(path.join(rutas.temp, 'x', 'PhpWebStudy-1', 'a.tmp'), 5, 500);
    void p;
    const [t] = await l.analizar(['temp']);
    expect(t!.archivos).toBe(2);
    const r = await l.limpiar(['temp'], true);
    expect(r.categorias[0]!.motivos.protegido).toBeGreaterThanOrEqual(3);
    for (const x of [env, env2, fly, pws]) expect(existe(x)).toBe(true);
  });

  it('si una raíz contiene una carpeta de datos, proyectos o respaldos, la categoría se aborta', async () => {
    const e = await escenario();
    // Error de configuración: "registros" apunta a toda la carpeta de WolfCore Dev.
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'wolfcore-registros' ? { ...c, rutas: [e.datos] } : c,
    );
    const [r] = await e.l.analizar(['wolfcore-registros']);
    expect(r!.bloqueada).toBe('ruta-vetada');
    expect(r!.archivos).toBe(0);
    expect(existe(e.f.datosCentinela)).toBe(true);
    expect(existe(e.f.respaldo)).toBe(true);
  });

  it('abortar una categoría vetada no borra nada de las demás de esa ejecución', async () => {
    const e = await escenario();
    await e.l.analizar(['temp']);
    // TEMP contiene el proyecto de un sitio registrado.
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'temp' ? { ...c, rutas: [e.p('Proyectos')] } : c,
    );
    expect(await codigo(e.l.limpiar(['temp'], true))).toBe('disco.ruta_vetada');
    expect(existe(e.f.proyectoArchivo)).toBe(true);
    expect(existe(e.f.tempViejo)).toBe(true);
  });

  it('un sitio registrado dentro de TEMP, una carpeta con FlyEnv o C:/Proyectos vetan la categoría', async () => {
    const e = await escenario();
    const dentro = archivo(path.join(e.rutas.temp, 'sitio', 'index.php'), 5, 500);
    const l = new LimpiezaDisco({
      plataforma: e.falsa,
      carpetaDatos: () => e.datos,
      rutasVetadas: async () => [path.join(e.rutas.temp, 'sitio')],
      carpetaRegistro: () => path.join(e.datos, 'logs', 'limpieza'),
    });
    const [t] = await l.analizar(['temp']);
    expect(t!.bloqueada).toBe('ruta-vetada');
    await expect(l.limpiar(['temp'], true)).rejects.toBeInstanceOf(ErrorWolf);
    expect(existe(dentro)).toBe(true);
    expect(existe(e.f.tempViejo)).toBe(true);
    // Una raíz con FlyEnv en la ruta tampoco se limpia.
    const flyRaiz = e.p('usuario', 'FlyEnv-cache');
    const antiguo = archivo(path.join(flyRaiz, 'viejo.tmp'), 5, 500);
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'temp' ? { ...c, rutas: [flyRaiz] } : c,
    );
    const [f2] = await e.l.analizar(['temp']);
    expect(f2!.bloqueada).toBe('ruta-vetada');
    expect(existe(antiguo)).toBe(true);
  });

  it('el tope de archivos corta la ejecución', async () => {
    const { l, f } = await escenario({ topeArchivos: 1 });
    await l.analizar(['temp']);
    const r = await l.limpiar(['temp'], true);
    expect(r.archivos).toBe(1);
    expect(r.truncado).toBe(true);
    expect([f.tempViejo, f.tempSub].filter(existe)).toHaveLength(1);
  });

  it('se puede cancelar y no queda nada a medias ni tocado de lo que sigue', async () => {
    const { l, f, falsa } = await escenario();
    falsa.limpieza = [
      ...falsa.limpieza.filter((c) => c.categoria === 'prefetch'),
      ...falsa.limpieza.filter((c) => c.categoria === 'temp'),
    ];
    await l.analizar(['prefetch', 'temp']);
    falsa.esAdministrador = async () => {
      l.cancelar();
      return true;
    };
    const r = await l.limpiar(['prefetch', 'temp'], true);
    expect(r.cancelado).toBe(true);
    expect(existe(f.tempViejo)).toBe(true);
    expect(existe(f.pf)).toBe(true);
  });

  it('un archivo en uso (EBUSY o EPERM) se salta y se cuenta; el resto se borra', async () => {
    const { l, f } = await escenario({
      borrar: async (ruta) => {
        if (ruta.endsWith('viejo.tmp')) throw Object.assign(new Error('x'), { code: 'EBUSY' });
        if (ruta.endsWith('viejo2.tmp')) throw Object.assign(new Error('x'), { code: 'EPERM' });
        await rm(ruta);
      },
    });
    await l.analizar(['temp']);
    const r = await l.limpiar(['temp'], true);
    expect(r.saltados).toBe(2);
    expect(r.archivos).toBe(0);
    expect(r.categorias[0]!.motivos['en-uso']).toBe(2);
    expect(existe(f.tempViejo)).toBe(true);
    expect(existe(f.tempSub)).toBe(true);
  });

  it('deja un registro sin secretos con las rutas borradas', async () => {
    const { l, datos, f, rutas } = await escenario();
    // El registro lleva rutas canónicas (en Windows, sin nombres cortos; en macOS, /private/var).
    const viejo = realpathSync.native(f.tempViejo);
    const nuevo = realpathSync.native(f.tempNuevo);
    await l.analizar(['temp', 'wolfcore-registros']);
    const r = await l.limpiar(['temp', 'wolfcore-registros'], true);
    expect(path.dirname(r.registro)).toBe(path.join(datos, 'logs', 'limpieza'));
    const txt = readFileSync(r.registro, 'utf8');
    expect(txt).toContain('temp: 2 archivos');
    expect(txt).toContain(viejo);
    expect(txt).toContain('Bytes: 1100');
    expect(txt).not.toContain(nuevo);
    expect(txt).not.toContain(rutas.padre);
    expect(existe(r.registro)).toBe(true);
    expect(readdirSync(path.join(datos, 'logs', 'limpieza'))).toHaveLength(1);
  });

  it('el registro de la ejecución en curso nunca se lista para borrar (aunque sea "viejo")', async () => {
    let ahora = T0;
    const e = await escenario({ ahora: () => ahora });
    await e.l.analizar(['wolfcore-registros']);
    const r1 = await e.l.limpiar(['wolfcore-registros'], true);
    // 40 días después, el primer registro ya es "viejo": se va a la papelera, el nuevo no.
    ahora += 40 * DIA;
    const t = new Date(ahora - 40 * DIA);
    utimesSync(r1.registro, t, t);
    await e.l.analizar(['wolfcore-registros']);
    const r2 = await e.l.limpiar(['wolfcore-registros'], true);
    expect(r2.registro).not.toBe(r1.registro);
    expect(existe(r2.registro)).toBe(true);
    expect(e.falsa.enPapelera.some((x) => path.basename(x) === path.basename(r2.registro))).toBe(
      false,
    );
  });

  it('el registro se limita a 5000 rutas y después solo cuenta el total', async () => {
    const { l, rutas, datos } = await escenario();
    for (let i = 0; i < 5010; i++) {
      const r = path.join(rutas.temp, 'masa', `a${i}.tmp`);
      mkdirSync(path.dirname(r), { recursive: true });
      writeFileSync(r, 'x');
      const t = new Date(T0 - 100 * HORA);
      utimesSync(r, t, t);
    }
    await l.analizar(['temp']);
    const r = await l.limpiar(['temp'], true);
    expect(r.archivos).toBe(5012);
    const txt = readFileSync(r.registro, 'utf8');
    expect(txt).toContain('y 12 mas (solo el total)');
    expect(txt.split('\n').filter((x) => x.includes('.tmp')).length).toBe(5000);
    void datos;
  });

  it('no deja correr dos a la vez', async () => {
    const { l, falsa } = await escenario();
    let soltar: () => void = () => undefined;
    falsa.esAdministrador = () =>
      new Promise<boolean>((r) => {
        soltar = () => r(true);
      });
    const a = l.analizar(['prefetch']);
    await new Promise((r) => setTimeout(r, 20));
    expect(await codigo(l.analizar(['temp']))).toBe('disco.ocupada');
    soltar();
    await a;
  });
});

describe('limpieza de disco: rutas de Windows', () => {
  it('nombresPerfilesFirefox lee Path= de profiles.ini', () => {
    const ini =
      '[Profile0]\nName=a\nIsRelative=1\nPath=Profiles/abc.default\n\n[Profile1]\nPath=C:\\x\\y.dev\n[General]\n';
    expect(nombresPerfilesFirefox(ini)).toEqual(['abc.default', 'y.dev']);
  });

  it.skipIf(process.platform !== 'win32')(
    'solo devuelve Cache, Code Cache, GPUCache y cache2 de Default, Profile N y de Firefox',
    async () => {
      const raiz = await carpetaTemporal('pel-limpieza-win-');
      const local = path.join(raiz, 'Local');
      const roaming = path.join(raiz, 'Roaming');
      const ud = path.join(local, 'Google', 'Chrome', 'User Data');
      for (const perfil of [
        'Default',
        'Profile 2',
        'Guest Profile',
        'System Profile',
        'Profiledos',
      ]) {
        for (const c of ['Cache', 'Code Cache', 'GPUCache', 'Cookies', 'IndexedDB', 'Sessions']) {
          mkdirSync(path.join(ud, perfil, c), { recursive: true });
        }
      }
      mkdirSync(path.join(local, 'Mozilla', 'Firefox', 'Profiles', 'aaa.default', 'cache2'), {
        recursive: true,
      });
      mkdirSync(path.join(local, 'Mozilla', 'Firefox', 'Profiles', 'aaa.default', 'storage'), {
        recursive: true,
      });
      mkdirSync(path.join(roaming, 'Mozilla', 'Firefox'), { recursive: true });
      writeFileSync(
        path.join(roaming, 'Mozilla', 'Firefox', 'profiles.ini'),
        '[Profile0]\nIsRelative=1\nPath=Profiles/bbb.dev\n',
      );
      mkdirSync(path.join(local, 'Mozilla', 'Firefox', 'Profiles', 'bbb.dev', 'cache2'), {
        recursive: true,
      });
      const datos = path.join(raiz, 'WolfCoreDev');
      const r = await rutasLimpiezaWindows({ TEMP: path.join(raiz, 'Temp') }, datos, lecturaReal, {
        perfil: raiz,
        local,
        roaming,
        windows: path.join(raiz, 'Win'),
        conocidas: [],
      });
      // Las rutas salen de las anclas reales (sin nombres cortos 8.3).
      const udReal = path.join(realpathSync.native(local), 'Google', 'Chrome', 'User Data');
      const de = (c: CategoriaLimpieza): string[] => r.find((x) => x.categoria === c)!.rutas;
      const chrome = de('cache-chrome').map((x) => path.relative(udReal, x).replace(/\\/g, '/'));
      expect(chrome.sort()).toEqual(
        [
          'Default/Cache',
          'Default/Code Cache',
          'Default/GPUCache',
          'Profile 2/Cache',
          'Profile 2/Code Cache',
          'Profile 2/GPUCache',
        ].sort(),
      );
      const ff = de('cache-firefox')
        .map((x) => path.basename(path.dirname(x)))
        .sort();
      expect(ff).toEqual(['aaa.default', 'bbb.dev']);
      expect(de('cache-firefox').every((x) => path.basename(x) === 'cache2')).toBe(true);
      expect(de('wolfcore-descargas')).toEqual([path.join(datos, 'tmp')]);
      expect(de('wolfcore-registros')).toEqual([path.join(datos, 'logs')]);
      expect(r.find((x) => x.categoria === 'prefetch')!.requiereAdmin).toBe(true);
      expect(de('cache-chrome').length).toBeGreaterThan(0);
      expect(r.find((x) => x.categoria === 'cache-chrome')!.anclas).toEqual([
        realpathSync.native(local),
      ]);
      expect(r.find((x) => x.categoria === 'cache-edge')!.navegador).toBe('edge');
      // Nunca data ni respaldos.
      expect(r.flatMap((x) => x.rutas).some((x) => /respaldos|[\\/]data([\\/]|$)/i.test(x))).toBe(
        false,
      );
    },
  );
});

/** Crea una unión (en Windows; en el resto, un enlace simbólico). false si no se puede. */
function union(objetivo: string, enlace: string): boolean {
  try {
    mkdirSync(path.dirname(enlace), { recursive: true });
    symlinkSync(objetivo, enlace, 'junction');
    return true;
  } catch {
    return false;
  }
}

/** Ruta real en minúsculas y con `/`, para buscar un centinela en lo que devuelve `analizar`. */
const forma = (r: string): string => realpathSync.native(r).replace(/\\/g, '/').toLowerCase();

describe('limpieza de disco: raíces enlazadas (revisión de D37)', () => {
  it('una carpeta Cache que es una unión a otra carpeta se rechaza: el centinela ni se lista ni se borra', async (ctx) => {
    const e = await escenario();
    const documentos = e.p('usuario', 'Documentos');
    const centinela = archivo(path.join(documentos, 'tesis.docx'), 777, 9999);
    const cache = path.join(e.rutas.chrome, 'Profile 2', 'Cache');
    if (!union(documentos, cache)) return ctx.skip();
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'cache-chrome' ? { ...c, rutas: [...c.rutas, cache] } : c,
    );
    const [c] = await e.l.analizar(['cache-chrome']);
    expect(c!.archivos).toBe(4);
    expect(c!.bytes).toBe(2500);
    expect(c!.carpetas.map((x) => x.ruta.replace(/\\/g, '/').toLowerCase())).not.toContain(
      forma(documentos),
    );
    expect(c!.carpetas).toHaveLength(4);
    const r = await e.l.limpiar(['cache-chrome'], true);
    expect(r.categorias[0]!.motivos.enlace).toBeGreaterThanOrEqual(1);
    expect(existe(centinela)).toBe(true);
    expect(existe(e.f.chromeCache)).toBe(false);
  });

  it('un perfil que es una unión (su Cache es real pero está en otro sitio) también se rechaza', async (ctx) => {
    const e = await escenario();
    const ajena = e.p('usuario', 'Documentos');
    const centinela = archivo(path.join(ajena, 'Cache', 'foto.jpg'), 900, 9999);
    const perfil = path.join(e.rutas.chrome, 'Profile 3');
    if (!union(ajena, perfil)) return ctx.skip();
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'cache-chrome'
        ? { ...c, rutas: [...c.rutas, path.join(perfil, 'Cache')] }
        : c,
    );
    const [c] = await e.l.analizar(['cache-chrome']);
    expect(c!.archivos).toBe(4);
    await e.l.limpiar(['cache-chrome'], true);
    expect(existe(centinela)).toBe(true);
  });

  it('una raíz de TEMP que es una unión se rechaza: el centinela queda y no aparece en el análisis', async (ctx) => {
    const e = await escenario();
    const destino = e.p('usuario', 'Documents');
    const centinela = archivo(path.join(destino, 'contrato.pdf'), 1234, 9999);
    const temp = e.p('usuario', 'TempEnlazado', 'Temp');
    if (!union(destino, temp)) return ctx.skip();
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'temp' ? { ...c, rutas: [temp] } : c,
    );
    const [t] = await e.l.analizar(['temp']);
    expect([t!.archivos, t!.bytes, t!.carpetas.length]).toEqual([0, 0, 0]);
    const r = await e.l.limpiar(['temp'], true);
    expect(r.archivos).toBe(0);
    expect(r.categorias[0]!.motivos.enlace).toBe(1);
    expect(existe(centinela)).toBe(true);
  });

  it('una subcarpeta cambiada por una unión entre el recorrido y el borrado no se sigue', async (ctx) => {
    const centinelas = await carpetaTemporal('pel-limpieza-centinela-');
    const centinela = archivo(path.join(centinelas, 'hondo', 'viejo2.tmp'), 200, 9999);
    const prueba = `${centinelas}-prueba`;
    if (!union(centinelas, prueba)) return ctx.skip();
    rmSync(prueba);
    let cambiada = false;
    const e = await escenario({
      antesDeBorrar: (ruta) => {
        if (cambiada || !ruta.endsWith('viejo2.tmp')) return;
        cambiada = true;
        const sub = path.join(e.rutas.temp, 'sub');
        renameSync(sub, path.join(e.rutas.temp, 'sub-movida'));
        symlinkSync(centinelas, sub, 'junction');
      },
    });
    await e.l.analizar(['temp']);
    const r = await e.l.limpiar(['temp'], true);
    expect(cambiada).toBe(true);
    expect(existe(centinela)).toBe(true);
    expect(r.categorias[0]!.motivos.enlace).toBeGreaterThanOrEqual(1);
    // Lo que había de verdad (ya movido) no estaba en su sitio: tampoco se tocó.
    expect(existe(path.join(e.rutas.temp, 'sub-movida', 'hondo', 'viejo2.tmp'))).toBe(true);
    expect(existe(e.f.tempViejo)).toBe(false);
  });
});

describe('limpieza de disco: TEMP validado (revisión de D37)', () => {
  // Rutas de Windows simuladas: `canonica` devuelve la misma ruta (o null si "no existe").
  const lec = (ausentes: string[] = []) => ({
    canonica: async (r: string) => (ausentes.includes(r) ? null : r),
  });
  const ctx = {
    perfil: 'C:\\Users\\ana',
    local: 'C:\\Users\\ana\\AppData\\Local',
    windows: 'C:\\Windows',
    conocidas: [
      'C:\\Users\\ana\\Documents',
      'C:\\Users\\ana\\Desktop',
      'D:\\MisDocumentos',
      'C:\\Users\\ana\\OneDrive - Empresa',
    ],
  };
  const estado = async (temp: string, c = ctx, ausentes: string[] = []): Promise<string> =>
    (await validarTemp(temp, c, lec(ausentes))).estado;

  it('rechaza TEMP en Documents, en una raíz de unidad, en UNC, en el perfil o un ancestro', async () => {
    for (const temp of [
      'C:\\Users\\ana\\Documents\\Temp',
      'C:\\Users\\ana\\Documentos\\Temp',
      'C:\\Users\\ana\\Desktop\\Tmp',
      'C:\\Users\\ana\\OneDrive - Empresa\\Temp',
      'C:\\Users\\ana\\source\\repos\\tmp',
      'D:\\MisDocumentos\\Temp',
      'D:\\',
      'D:',
      '\\\\servidor\\recurso\\Temp',
      '\\\\localhost\\C$\\Users\\ana\\AppData\\Local\\Temp',
      '\\\\?\\UNC\\servidor\\recurso\\Temp',
      'C:\\Users\\ana',
      'C:\\Users',
      'C:\\Users\\ana\\AppData\\Local\\Programas',
      'D:\\Sistema\\Temp',
      'Temp',
    ]) {
      expect(await estado(temp), temp).toBe('invalido');
    }
  });

  it('con el perfil vacío o una raíz de unidad como perfil no vale nada', async () => {
    const temp = 'C:\\Users\\ana\\AppData\\Local\\Temp';
    expect(await estado(temp, { ...ctx, perfil: '' })).toBe('invalido');
    expect(await estado(temp, { ...ctx, perfil: 'C:\\' })).toBe('invalido');
    expect(await estado(temp, { ...ctx, local: '' })).toBe('invalido');
  });

  it('una carpeta conocida movida dentro de LocalAppData también se rechaza', async () => {
    const temp = 'C:\\Users\\ana\\AppData\\Local\\Temp';
    expect(await estado(temp, { ...ctx, conocidas: [temp] })).toBe('invalido');
  });

  it('acepta <LocalAppData>\\Temp, su subcarpeta numérica y <Windows>\\Temp', async () => {
    expect(await estado('C:\\Users\\ana\\AppData\\Local\\Temp')).toBe('valido');
    expect(await estado('C:\\Users\\ana\\AppData\\Local\\Temp\\2')).toBe('valido');
    expect(await estado('\\\\?\\C:\\Users\\ana\\AppData\\Local\\Temp')).toBe('valido');
    expect(await estado('C:\\Windows\\Temp')).toBe('valido');
    expect(await estado('C:\\Windows\\Temp\\2')).toBe('invalido');
    const t = 'C:\\Users\\ana\\AppData\\Local\\Temp';
    expect(await estado(t, ctx, [t])).toBe('ausente');
    // Devuelve la ruta real (la que se limpia), no la del entorno.
    const r = await validarTemp('C:\\Users\\ANA~1\\AppData\\Local\\Temp', ctx, {
      canonica: async () => 'C:\\Users\\ana\\AppData\\Local\\Temp',
    });
    expect(r).toEqual({ estado: 'valido', real: 'C:\\Users\\ana\\AppData\\Local\\Temp' });
  });

  it('interpretarAnclas solo acepta rutas absolutas con unidad', () => {
    const json = JSON.stringify({
      local: 'C:\\Users\\ana\\AppData\\Local',
      roaming: 'C:\\Users\\ana\\AppData\\Roaming',
      windows: 'C:\\WINDOWS',
      conocidas: ['C:\\Users\\ana\\Documents', '', 'relativa', 'D:\\Docs'],
    });
    expect(interpretarAnclas(json, 'C:\\Users\\ana')).toEqual({
      perfil: 'C:\\Users\\ana',
      local: 'C:\\Users\\ana\\AppData\\Local',
      roaming: 'C:\\Users\\ana\\AppData\\Roaming',
      windows: 'C:\\WINDOWS',
      conocidas: ['C:\\Users\\ana\\Documents', 'D:\\Docs'],
    });
    expect(interpretarAnclas(json, '')).toBeNull();
    expect(interpretarAnclas(json, 'C:\\')).toBeNull();
    expect(interpretarAnclas('no es json', 'C:\\Users\\ana')).toBeNull();
    expect(interpretarAnclas(JSON.stringify({ local: 'x', windows: 'C:\\W' }), 'C:\\U')).toBeNull();
  });

  it('rutasLimpiezaWindows no se fía del entorno: las anclas mandan', async () => {
    const lectura = {
      subcarpetas: async () => [],
      existeCarpeta: async () => false,
      leerTexto: async () => null,
      canonica: async (r: string) => r,
    };
    const anclas = {
      perfil: 'C:\\Users\\ana',
      local: 'C:\\Users\\ana\\AppData\\Local',
      roaming: 'C:\\Users\\ana\\AppData\\Roaming',
      windows: 'D:\\Win',
      conocidas: ['C:\\Users\\ana\\Documents'],
    };
    const de = (r: RutasCategoriaLimpieza[], c: CategoriaLimpieza) =>
      r.find((x) => x.categoria === c);
    // USERPROFILE vacío o C:\ y LOCALAPPDATA apuntando a Documentos: no cambian nada.
    let r = await rutasLimpiezaWindows(
      {
        USERPROFILE: '',
        LOCALAPPDATA: 'C:\\Users\\ana\\Documents',
        TEMP: 'C:\\Users\\ana\\Documents\\Temp',
        SystemRoot: 'E:\\Falso',
      },
      'C:\\datos',
      lectura,
      anclas,
    );
    expect(de(r, 'temp')!.bloqueo).toBe('temp-no-seguro');
    expect(de(r, 'temp')!.rutas).toEqual([]);
    // Prefetch sale de la carpeta de Windows real, no de %SystemRoot%.
    expect(de(r, 'prefetch')!.rutas).toEqual(['D:\\Win\\Prefetch']);
    expect(de(r, 'prefetch')!.anclas).toEqual(['D:\\Win']);
    expect(de(r, 'cache-chrome')!.anclas).toEqual(['C:\\Users\\ana\\AppData\\Local']);
    r = await rutasLimpiezaWindows(
      { USERPROFILE: 'C:\\', TEMP: 'C:\\Users\\ana\\AppData\\Local\\Temp' },
      'C:\\datos',
      lectura,
      anclas,
    );
    expect(de(r, 'temp')).toEqual({
      categoria: 'temp',
      rutas: ['C:\\Users\\ana\\AppData\\Local\\Temp'],
      requiereAdmin: false,
      anclas: ['C:\\Users\\ana\\AppData\\Local', 'D:\\Win'],
    });
    // Sin anclas (no se pudieron leer) o con el perfil vacío o en una raíz de unidad: TEMP
    // bloqueado, sin cachés de navegador y Prefetch sin rutas.
    for (const a of [null, { ...anclas, perfil: '' }, { ...anclas, perfil: 'C:\\' }]) {
      r = await rutasLimpiezaWindows(
        { TEMP: 'C:\\Users\\ana\\AppData\\Local\\Temp' },
        'C:\\datos',
        lectura,
        a,
      );
      expect(de(r, 'temp')!.bloqueo).toBe('temp-no-seguro');
      expect(r.some((x) => x.categoria.startsWith('cache-'))).toBe(false);
      if (a === null) expect(de(r, 'prefetch')!.rutas).toEqual([]);
    }
    // LocalAppData fuera del perfil: tampoco.
    r = await rutasLimpiezaWindows({ TEMP: 'D:\\Local\\Temp' }, 'C:\\datos', lectura, {
      ...anclas,
      local: 'D:\\Local',
    });
    expect(r.some((x) => x.categoria === 'cache-chrome')).toBe(false);
    expect(de(r, 'temp')!.bloqueo).toBe('temp-no-seguro');
  });

  it('una categoría que la plataforma marca como TEMP no seguro queda bloqueada y no se borra nada', async () => {
    const e = await escenario();
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'temp' ? { ...c, rutas: [], bloqueo: 'temp-no-seguro' as const } : c,
    );
    const [t] = await e.l.analizar(['temp']);
    expect(t!.bloqueada).toBe('temp-no-seguro');
    const r = await e.l.limpiar(['temp'], true);
    expect(r.categorias[0]!.bloqueada).toBe('temp-no-seguro');
    expect(existe(e.f.tempViejo)).toBe(true);
  });

  it('Proyectos está vetado en cualquier unidad y en rutas UNC, igual que una raíz de unidad', async () => {
    const e = await escenario();
    for (const raiz of [
      'D:\\Proyectos\\app\\tmp',
      'E:\\',
      '\\\\localhost\\C$\\Proyectos',
      '\\\\servidor\\recurso\\Proyectos\\web',
    ]) {
      e.falsa.limpieza = e.falsa.limpieza.map((c) =>
        c.categoria === 'temp' ? { ...c, rutas: [raiz] } : c,
      );
      const [t] = await e.l.analizar(['temp']);
      expect(t!.bloqueada, raiz).toBe('ruta-vetada');
    }
  });
});

describe('limpieza de disco: registro, edades y vetos (revisión de D37)', () => {
  /** Registro en memoria que falla en la escritura número `fallaEn` (1 = la cabecera). */
  function registroFalso(fallaEn: number | null) {
    const escrito: string[] = [];
    let n = 0;
    return {
      escrito,
      abrir: async (destino: string) => ({
        ruta: destino,
        escribir: async (t: string) => {
          n++;
          if (n === fallaEn) throw Object.assign(new Error('disco lleno'), { code: 'ENOSPC' });
          escrito.push(t);
        },
        cerrar: async () => undefined,
      }),
    };
  }

  function masa(temp: string, n: number): string[] {
    const res: string[] = [];
    for (let i = 0; i < n; i++) res.push(archivo(path.join(temp, 'masa', `m${i}.tmp`), 1, 100));
    return res;
  }

  /** Líneas de rutas `.tmp` escritas en el registro falso. */
  const rutasEscritas = (escrito: string[]): string[] =>
    escrito.flatMap((t) => t.split('\n')).filter((x) => x.endsWith('.tmp'));

  it('el registro se escribe por lotes, y cada lote antes de borrarlo', async () => {
    const reg = registroFalso(null);
    let antes = 0;
    const e = await escenario({
      abrirRegistro: reg.abrir,
      // Cuando se va a borrar un archivo, su ruta ya está en el registro.
      antesDeBorrar: (ruta) => {
        if (rutasEscritas(reg.escrito).includes(ruta)) antes++;
      },
    });
    masa(e.rutas.temp, 450);
    await e.l.analizar(['temp']);
    const r = await e.l.limpiar(['temp'], true);
    expect(r.registroFallido).toBe(false);
    expect(r.sinAnotar).toEqual([]);
    expect(antes).toBe(452);
    expect(reg.escrito[0]).toContain('Limpieza de disco');
    expect(reg.escrito[0]).not.toContain('.tmp');
    const lotes = reg.escrito.map((t) => t.split('\n').filter((x) => x.endsWith('.tmp')).length);
    expect(lotes.filter((n) => n === 200)).toHaveLength(2);
    expect(Math.max(...lotes)).toBe(200);
    expect(reg.escrito.join('')).toContain('temp: 452 archivos');
  });

  it('si el registro deja de escribirse, se para: solo se borró lo ya anotado', async () => {
    const reg = registroFalso(3);
    const e = await escenario({ abrirRegistro: reg.abrir });
    const archivos = masa(e.rutas.temp, 450);
    e.falsa.administrador = true;
    await e.l.analizar(['temp', 'prefetch']);
    const r = await e.l.limpiar(['temp', 'prefetch'], true);
    expect(r.registroFallido).toBe(true);
    // Todo lo borrado está en el registro; el lote que no se pudo escribir vuelve sin borrar.
    expect(r.archivos).toBe(rutasEscritas(reg.escrito).length);
    expect(r.archivos).toBeLessThanOrEqual(2);
    expect(r.sinAnotar.filter((x) => x.endsWith('.tmp')).length).toBeGreaterThan(0);
    for (const x of r.sinAnotar.filter((l) => l.endsWith('.tmp'))) expect(existe(x)).toBe(true);
    expect(archivos.filter(existe).length).toBeGreaterThanOrEqual(250);
    // Ni la categoría siguiente ni las carpetas vacías se tocan.
    expect(existe(e.f.pf)).toBe(true);
    expect(existe(path.join(e.rutas.temp, 'masa'))).toBe(true);
  });

  it('pasadas las 5000 rutas, un fallo del registro también se detecta y se para', async () => {
    let n = 0;
    const escrito: string[] = [];
    const e = await escenario({
      abrirRegistro: async (destino) => ({
        ruta: destino,
        escribir: async (t) => {
          // Falla la primera línea de cuenta (la de los lotes sin detalle).
          if (t.includes('rutas sin detalle') && n++ === 0) throw new Error('disco lleno');
          escrito.push(t);
        },
        cerrar: async () => undefined,
      }),
    });
    const archivos = masa(e.rutas.temp, 5600);
    await e.l.analizar(['temp']);
    const r = await e.l.limpiar(['temp'], true);
    expect(r.registroFallido).toBe(true);
    expect(r.archivos).toBe(rutasEscritas(escrito).length);
    expect(r.archivos).toBeLessThanOrEqual(5000);
    expect(r.archivos).toBeGreaterThan(4700);
    expect(archivos.filter(existe).length).toBeGreaterThanOrEqual(600);
  });

  it('las carpetas vacías que se quitan quedan en el registro', async () => {
    const e = await escenario();
    await e.l.analizar(['temp']);
    const r = await e.l.limpiar(['temp'], true);
    const txt = readFileSync(r.registro, 'utf8');
    expect(existe(path.join(e.rutas.temp, 'sub'))).toBe(false);
    const vacias = txt.split('\n').filter((l) => l.startsWith('carpeta vacia quitada: '));
    expect(vacias.map((l) => path.basename(l)).sort()).toEqual(['hondo', 'sub']);
  });

  it('si ni la cabecera del registro se escribe, no se borra nada', async () => {
    const reg = registroFalso(1);
    const e = await escenario({ abrirRegistro: reg.abrir });
    await e.l.analizar(['temp']);
    expect(await codigo(e.l.limpiar(['temp'], true))).toBe('disco.sin_registro');
    expect(existe(e.f.tempViejo)).toBe(true);
  });

  it('TEMP: un archivo con fecha de modificación antigua pero creado o cambiado hace poco no se borra', async () => {
    // Aquí "ahora" es la hora real: la creación y el cambio del archivo son de hace un instante.
    const e = await escenario({ ahora: () => Date.now() });
    const copiado = path.join(e.rutas.temp, 'extraido', 'setup.msi');
    mkdirSync(path.dirname(copiado), { recursive: true });
    writeFileSync(copiado, Buffer.alloc(64, 1));
    const viejo = new Date(Date.now() - 100 * DIA);
    utimesSync(copiado, viejo, viejo);
    const [t] = await e.l.analizar(['temp']);
    expect(t!.archivos).toBe(0);
    await e.l.limpiar(['temp'], true);
    expect(existe(copiado)).toBe(true);
  });

  it('variantes de .env (.envrc, .env-viejo, produccion.env) nunca se tocan', async () => {
    const e = await escenario();
    const envs = ['.envrc', '.env-viejo', 'produccion.env', 'APP.ENV'].map((n) =>
      archivo(path.join(e.rutas.temp, 'conf', n), 5, 500),
    );
    const [t] = await e.l.analizar(['temp']);
    expect(t!.archivos).toBe(2);
    const r = await e.l.limpiar(['temp'], true);
    expect(r.categorias[0]!.motivos.protegido).toBe(4);
    for (const x of envs) expect(existe(x)).toBe(true);
  });

  it('solo se borra lo que ya cumplía la edad a la hora del análisis', async () => {
    let ahora = T0;
    const e = await escenario({ ahora: () => ahora });
    // Con 23,9 h en el análisis no se borra, aunque al limpiar (20 min después) ya pase de 24 h.
    const casi = archivo(path.join(e.rutas.temp, 'casi.tmp'), 9, 23.9);
    await e.l.analizar(['temp']);
    ahora += 20 * 60_000;
    const r = await e.l.limpiar(['temp'], true);
    expect(r.archivos).toBe(2);
    expect(existe(casi)).toBe(true);
    expect(existe(e.f.tempNuevo)).toBe(true);
    expect(existe(e.f.tempViejo)).toBe(false);
  });

  it('una ruta vetada que aparece a mitad marca esa categoría y se sigue con las demás', async () => {
    let vetarSub = false;
    const e = await escenario();
    const l = new LimpiezaDisco({
      plataforma: e.falsa,
      carpetaDatos: () => e.datos,
      rutasVetadas: async () => (vetarSub ? [path.join(e.rutas.temp, 'sub', 'hondo')] : []),
      carpetaRegistro: () => path.join(e.datos, 'logs', 'limpieza'),
      ahora: () => T0,
    });
    await l.analizar(['prefetch', 'temp']);
    // Prefetch va primero: al comprobar el administrador, "se registra un sitio" dentro de TEMP.
    e.falsa.esAdministrador = async () => {
      vetarSub = true;
      return true;
    };
    const r = await l.limpiar(['prefetch', 'temp'], true);
    const [pf, temp] = r.categorias;
    expect(pf!.archivos).toBe(1);
    expect(existe(e.f.pf)).toBe(false);
    expect(temp!.bloqueada).toBe('ruta-vetada');
    expect(existe(e.f.tempSub)).toBe(true);
    expect(r.archivos).toBeGreaterThanOrEqual(1);
    expect(readFileSync(r.registro, 'utf8')).toContain('bloqueada: ruta-vetada');
  });

  it('los registros de limpieza de más de 90 días se purgan al abrir uno nuevo', async () => {
    const e = await escenario();
    const carpeta = path.join(e.datos, 'logs', 'limpieza');
    const viejo = archivo(path.join(carpeta, 'limpieza-viejo.log'), 10, 100 * 24);
    const reciente = archivo(path.join(carpeta, 'limpieza-reciente.log'), 10, 10 * 24);
    const ajeno = archivo(path.join(carpeta, 'otra-cosa.log'), 10, 100 * 24);
    await e.l.analizar(['temp']);
    const r = await e.l.limpiar(['temp'], true);
    expect(existe(viejo)).toBe(false);
    expect(existe(reciente)).toBe(true);
    expect(existe(ajeno)).toBe(true);
    expect(existe(r.registro)).toBe(true);
  });
});

describe('limpieza de disco: anclas y papelera (re-revisión de D37)', () => {
  it('una unión por encima del padre (en User Data) se detecta desde el ancla: el centinela queda', async (ctx) => {
    const e = await escenario();
    const ancla = e.p('usuario');
    // Imita Default\Cache dentro de una carpeta ajena.
    const ajena = e.p('ajena');
    const centinela = archivo(path.join(ajena, 'Default', 'Cache', 'centinela.bin'), 321, 9999);
    const userData = path.join(ancla, 'Chrome2', 'User Data');
    if (!union(ajena, userData)) return ctx.skip();
    const enlazada = path.join(userData, 'Default', 'Cache');
    e.falsa.limpieza = e.falsa.limpieza.map((c) =>
      c.categoria === 'cache-chrome'
        ? {
            ...c,
            rutas: [...c.rutas, enlazada, path.join(ajena, 'Default', 'Cache')],
            anclas: [ancla],
          }
        : c,
    );
    const [c] = await e.l.analizar(['cache-chrome']);
    // Las 4 cachés de verdad siguen valiendo (también en macOS, con /var → /private/var encima).
    expect(c!.archivos).toBe(4);
    expect(c!.carpetas).toHaveLength(4);
    const r = await e.l.limpiar(['cache-chrome'], true);
    expect(r.archivos).toBe(4);
    // La enlazada y la que no cuelga del ancla se rechazan.
    expect(r.categorias[0]!.motivos.enlace).toBe(2);
    expect(existe(centinela)).toBe(true);
    expect(existe(e.f.chromeCache)).toBe(false);
  });

  it('con solo la raíz bajo la unión de User Data, el análisis no cuenta nada', async (ctx) => {
    const e = await escenario();
    const ajena = e.p('ajena');
    archivo(path.join(ajena, 'Default', 'Cache', 'centinela.bin'), 321, 9999);
    const userData = e.p('usuario', 'Chrome2', 'User Data');
    if (!union(ajena, userData)) return ctx.skip();
    e.falsa.limpieza = [
      {
        categoria: 'cache-chrome',
        rutas: [path.join(userData, 'Default', 'Cache')],
        requiereAdmin: false,
        navegador: 'chrome',
        anclas: [e.p('usuario')],
      },
    ];
    const [c] = await e.l.analizar(['cache-chrome']);
    expect(c!.archivos).toBe(0);
  });

  it('la papelera solo se usa en un disco fijo local (no en USB, red ni UNC)', async () => {
    const tipos: Record<string, number | null> = { C: 3, E: 2, Z: 4, X: null };
    const pedidas: string[] = [];
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: {},
      tipoUnidad: async (letra) => {
        pedidas.push(letra);
        return tipos[letra] ?? null;
      },
    });
    const enviadas: string[] = [];
    p.registrarPapelera(async (r) => {
      enviadas.push(r);
    });
    expect(await p.aPapelera('C:\\datos\\logs\\a.log')).toBe(true);
    expect(await p.aPapelera('E:\\datos\\logs\\b.log')).toBe(false);
    expect(await p.aPapelera('Z:\\datos\\logs\\c.log')).toBe(false);
    expect(await p.aPapelera('X:\\datos\\logs\\d.log')).toBe(false);
    expect(await p.aPapelera('\\\\servidor\\recurso\\e.log')).toBe(false);
    expect(enviadas).toEqual(['C:\\datos\\logs\\a.log']);
    expect(pedidas).toEqual(['C', 'E', 'Z', 'X']);
  });

  it('una categoría que la plataforma deja sin papelera lo cuenta como sin-papelera', async () => {
    const e = await escenario();
    e.falsa.papeleraDisponible = false;
    await e.l.analizar(['wolfcore-descargas']);
    const r = await e.l.limpiar(['wolfcore-descargas'], true);
    expect(r.categorias[0]!.motivos['sin-papelera']).toBe(1);
    expect(existe(e.f.zip)).toBe(true);
  });
});
