import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { nombresPerfilesFirefox, rutasLimpiezaWindows } from '../src/plataforma/limpiezaWin';
import type { CategoriaLimpieza, RutasCategoriaLimpieza } from '../src/plataforma/tipos';
import {
  CATEGORIAS_LIMPIEZA,
  LimpiezaDisco,
  type DepsLimpiezaDisco,
} from '../src/sistema/limpiezaDisco';
import { carpetaTemporal } from './temporales';

const HORA = 3_600_000;
const DIA = 24 * HORA;

/** Crea un archivo con `bytes` bytes y una antigüedad (horas) dada. */
function archivo(ruta: string, bytes: number, horas = 100): string {
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, Buffer.alloc(bytes, 7));
  const t = new Date(Date.now() - horas * HORA);
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
    let ahora = Date.now();
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
    let ahora = Date.now();
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
      const t = new Date(Date.now() - 100 * HORA);
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
      const r = await rutasLimpiezaWindows(
        {
          LOCALAPPDATA: local,
          APPDATA: roaming,
          TEMP: path.join(raiz, 'Temp'),
          SystemRoot: path.join(raiz, 'Win'),
        },
        datos,
      );
      const de = (c: CategoriaLimpieza): string[] => r.find((x) => x.categoria === c)!.rutas;
      const chrome = de('cache-chrome').map((x) => path.relative(ud, x).replace(/\\/g, '/'));
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
      expect(r.find((x) => x.categoria === 'cache-edge')!.navegador).toBe('edge');
      // Nunca data ni respaldos.
      expect(r.flatMap((x) => x.rutas).some((x) => /respaldos|[\\/]data([\\/]|$)/i.test(x))).toBe(
        false,
      );
    },
  );
});
