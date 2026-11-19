import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import type {
  ApiEntorno,
  Deteccion,
  EstadoReceta,
  EventosNucleo,
  RepoGithub,
  ResultadoReceta,
  Sitio,
  SugerenciaProyecto,
} from '../src/shared/api';
import { useProyectos } from '../src/renderer/stores/proyectos';
import { useSitios } from '../src/renderer/stores/sitios';
import {
  alternarPaso,
  aplicarDeteccion,
  aplicarProgreso,
  avanceReceta,
  claveRemoto,
  claveRuta,
  conexionGithub,
  conProceso,
  conRestaurar,
  datosSitioInicial,
  destinoPorDefecto,
  deteccionEditable,
  errorProceso,
  etiquetaPaso,
  idProceso,
  marcarClonados,
  moverPaso,
  necesitaPuertoProxy,
  resumenReinstalar,
  nombreDeUrl,
  partirComando,
  pasoConError,
  pasosAsistente,
  pasosSugeridos,
  porcentajeGit,
  procesoVacio,
  recetaElegida,
  recetaVacia,
  remotoDe,
  requiereReinicio,
  sinRestaurar,
  sugerenciasVisibles,
  unirComando,
  urlGitValida,
  urlParaClonar,
  urlWebRemoto,
} from '../src/renderer/utilidades/proyectos';
import { datosParaDuplicar } from '../src/renderer/utilidades/sitios';

const sitio = (o: Partial<Sitio> = {}): Sitio => ({
  id: 'wolf',
  nombre: 'WolfCore',
  dominio: 'wolfcore.test',
  alias: [],
  carpeta: 'C:\\Proyectos\\WolfCore',
  tipo: 'laravel',
  php: '8.4',
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: 'APP_URL',
  datosReales: false,
  https: true,
  redirigirHttps: false,
  confiado: true,
  git: null,
  procesos: [],
  runtimes: {},
  nota: '',
  ...o,
});

const repo = (o: Partial<RepoGithub> = {}): RepoGithub => ({
  nombre: 'Rents',
  completo: 'johan/Rents',
  privado: true,
  descripcion: 'Alquileres',
  actualizado: '2026-11-01T00:00:00Z',
  url: 'https://github.com/johan/Rents',
  ...o,
});

const deteccion = (o: Partial<Deteccion> = {}): Deteccion => ({
  tipo: 'laravel',
  php: '8.3',
  node: '22',
  python: null,
  servicios: ['mysql', 'redis'],
  pgvector: false,
  tieneComposer: true,
  tienePackageJson: true,
  scriptsNpm: ['dev', 'build'],
  tieneRequirements: false,
  tienePyproject: false,
  dominioSugerido: 'rents.test',
  urlBaseVar: 'APP_URL',
  ...o,
});

const estadoReceta = (): EstadoReceta => ({
  sitioId: 'wolf',
  estado: 'inactiva',
  actualizado: null,
  pasos: [
    { id: 'composer-install', tipo: 'composer-install', titulo: 'x', estado: 'pendiente', log: [] },
    { id: 'migrar', tipo: 'migrar', titulo: 'x', estado: 'pendiente', log: [] },
    {
      id: 'sitio-crear',
      tipo: 'sitio-crear',
      titulo: 'x',
      args: { dominio: 'wolfcore.test' },
      estado: 'pendiente',
      log: [],
    },
  ],
});

/* ───────────── Rutas, remotos y "ya clonado" ───────────── */

describe('rutas y remotos', () => {
  it('compara rutas de Windows sin distinguir mayúsculas ni barra final', () => {
    expect(claveRuta('C:/Proyectos/Rents/')).toBe('c:\\proyectos\\rents');
    expect(claveRuta('c:\\PROYECTOS\\rents')).toBe(claveRuta('C:\\Proyectos\\Rents\\'));
  });

  it('normaliza remotos https, scp y owner/name', () => {
    const k = 'github.com/johan/rents';
    expect(claveRemoto('https://github.com/Johan/Rents.git')).toBe(k);
    expect(claveRemoto('https://usuario@github.com/johan/rents/')).toBe(k);
    expect(claveRemoto('git@github.com:johan/Rents.git')).toBe(k);
    expect(claveRemoto('johan/rents')).toBe(k);
  });

  it('arma la URL web del remoto sin credenciales', () => {
    expect(urlWebRemoto('git@github.com:johan/rents.git')).toBe('https://github.com/johan/rents');
    expect(urlWebRemoto('https://x:clave@github.com/johan/rents')).toBe(
      'https://github.com/johan/rents',
    );
    expect(urlWebRemoto(null)).toBeNull();
  });

  it('destino por defecto en C:\\Proyectos o en la carpeta vigilada', () => {
    expect(destinoPorDefecto('Rents')).toBe('C:\\Proyectos\\Rents');
    expect(destinoPorDefecto('Rents', 'D:\\Trabajo\\')).toBe('D:\\Trabajo\\Rents');
    expect(nombreDeUrl('https://github.com/johan/mi-repo.git')).toBe('mi-repo');
    expect(nombreDeUrl('git@github.com:johan/otro.git')).toBe('otro');
  });

  it('valida URLs de Git en el cliente', () => {
    expect(urlGitValida('https://github.com/johan/rents.git')).toBe(true);
    expect(urlGitValida('git@gitlab.com:johan/rents.git')).toBe(true);
    expect(urlGitValida('johan/rents')).toBe(true);
    expect(urlGitValida('-c core.x=y')).toBe(false);
    expect(urlGitValida('file:///C:/x')).toBe(false);
    expect(urlGitValida('http://github.com/x/y')).toBe(false);
    expect(remotoDe('johan/rents')).toBe('https://github.com/johan/rents');
    expect(remotoDe('git@github.com:johan/rents.git')).toBe('git@github.com:johan/rents.git');
  });

  it('marca "ya clonado" por remoto o por carpeta (sin distinguir mayúsculas)', () => {
    const repos = [
      repo(),
      repo({ nombre: 'Coffe', completo: 'johan/Coffe', url: 'https://github.com/johan/Coffe' }),
      repo({ nombre: 'Dollar', completo: 'org/Dollar', url: 'https://github.com/org/Dollar' }),
    ];
    const sitios = [
      sitio({
        carpeta: 'D:\\otro\\rents',
        git: { remoto: 'git@github.com:JOHAN/rents.git', rama: null },
      }),
      sitio({ carpeta: 'c:\\proyectos\\COFFE\\', git: null }),
    ];
    expect(marcarClonados(repos, sitios).map((r) => r.yaClonado)).toEqual([true, true, false]);
    // Con otra carpeta de proyectos, Coffe ya no coincide por ruta.
    expect(marcarClonados(repos, sitios, 'D:\\Trabajo').map((r) => r.yaClonado)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('clona owner/name con gh y la URL https con token', () => {
    expect(urlParaClonar(repo(), true)).toBe('johan/Rents');
    expect(urlParaClonar(repo(), false)).toBe('https://github.com/johan/Rents');
  });

  it('lee el porcentaje del progreso de git', () => {
    expect(porcentajeGit('Receiving objects:  45% (450/1000)')).toBe(45);
    expect(porcentajeGit('Cloning into …')).toBeNull();
  });

  it('estado de la conexión con GitHub', () => {
    expect(conexionGithub({ ghSesion: true, hayToken: true })).toBe('gh');
    expect(conexionGithub({ ghSesion: false, hayToken: true })).toBe('token');
    expect(conexionGithub({ ghSesion: false, hayToken: false })).toBe('ninguna');
  });
});

/* ───────────── Sugerencias ───────────── */

describe('sugerencias de la carpeta vigilada', () => {
  const sug = (carpeta: string): SugerenciaProyecto => ({ carpeta, deteccion: deteccion() });

  it('oculta las ya montadas, las descartadas y las repetidas (rutas sin mayúsculas)', () => {
    const lista = [
      sug('C:\\Proyectos\\Rents'),
      sug('C:\\Proyectos\\Coffe'),
      sug('C:\\Proyectos\\Dollar'),
      sug('c:\\proyectos\\dollar\\'),
    ];
    const visibles = sugerenciasVisibles(
      lista,
      [sitio({ carpeta: 'c:/proyectos/rents' })],
      new Set([claveRuta('C:\\PROYECTOS\\Coffe')]),
    );
    expect(visibles.map((s) => s.carpeta)).toEqual(['C:\\Proyectos\\Dollar']);
  });
});

/* ───────────── Receta: estados ───────────── */

describe('estados de la receta', () => {
  it('un paso pasa por pendiente → en curso (con registro) → listo', () => {
    let e = estadoReceta();
    e = aplicarProgreso(e, {
      sitioId: 'wolf',
      pasoId: 'composer-install',
      estado: 'corriendo',
    }).estado;
    expect(e.estado).toBe('corriendo');
    e = aplicarProgreso(e, {
      sitioId: 'wolf',
      pasoId: 'composer-install',
      estado: 'corriendo',
      linea: 'Installing…',
    }).estado;
    expect(e.pasos[0]!.log).toEqual(['Installing…']);
    e = aplicarProgreso(e, { sitioId: 'wolf', pasoId: 'composer-install', estado: 'listo' }).estado;
    expect(e.pasos[0]!.estado).toBe('listo');
    expect(e.pasos[0]!.log).toEqual(['Installing…']);
    expect(avanceReceta(e)).toBe(33);
  });

  it('un error guarda el mensaje y queda como paso con error', () => {
    let e = estadoReceta();
    e = aplicarProgreso(e, { sitioId: 'wolf', pasoId: 'migrar', estado: 'corriendo' }).estado;
    e = aplicarProgreso(e, {
      sitioId: 'wolf',
      pasoId: 'migrar',
      estado: 'error',
      linea: 'SQLSTATE: sin conexión',
    }).estado;
    expect(pasoConError(e)?.id).toBe('migrar');
    expect(e.pasos[1]!.mensaje).toBe('SQLSTATE: sin conexión');
    expect(e.pasos[1]!.log).toEqual(['SQLSTATE: sin conexión']);
  });

  it('al reintentar, el paso vuelve a pendiente y su registro se limpia', () => {
    let e = estadoReceta();
    e.pasos[1] = { ...e.pasos[1]!, estado: 'error', mensaje: 'falló', log: ['a', 'falló'] };
    e = aplicarProgreso(e, { sitioId: 'wolf', pasoId: 'migrar', estado: 'pendiente' }).estado;
    expect(e.pasos[1]).toMatchObject({ estado: 'pendiente', log: [] });
    expect(e.pasos[1]!.mensaje).toBeUndefined();
  });

  it('al cancelar un paso en curso vuelve a pendiente sin perder su registro', () => {
    let e = estadoReceta();
    e.pasos[0] = { ...e.pasos[0]!, estado: 'corriendo', log: ['a medias'] };
    e = aplicarProgreso(e, {
      sitioId: 'wolf',
      pasoId: 'composer-install',
      estado: 'pendiente',
    }).estado;
    expect(e.pasos[0]).toMatchObject({ estado: 'pendiente', log: ['a medias'] });
  });

  it('omitido cuenta como avance', () => {
    let e = estadoReceta();
    e = aplicarProgreso(e, { sitioId: 'wolf', pasoId: 'migrar', estado: 'omitido' }).estado;
    expect(e.pasos[1]!.estado).toBe('omitido');
    expect(avanceReceta(e)).toBe(33);
  });

  it('un paso desconocido pide el estado completo', () => {
    const r = aplicarProgreso(recetaVacia('wolf'), {
      sitioId: 'wolf',
      pasoId: 'npm-ci',
      estado: 'pendiente',
    });
    expect(r.desconocido).toBe(true);
  });

  it('títulos traducidos por tipo, no los del wolfcore.yml', () => {
    expect(etiquetaPaso({ tipo: 'composer-install' })).toBe(
      'Instalar dependencias de PHP (composer install)',
    );
    expect(etiquetaPaso({ tipo: 'sitio-crear', args: { dominio: 'rents.test' } })).toBe(
      'Crear el sitio rents.test',
    );
    expect(etiquetaPaso({ tipo: 'bd-restaurar', args: { archivo: 'C:\\r\\rents.sql' } })).toBe(
      'Restaurar el respaldo rents.sql',
    );
    expect(etiquetaPaso({ tipo: 'comando', args: { comando: ['php', 'artisan', 'x y'] } })).toBe(
      'Ejecutar: php artisan "x y"',
    );
  });
});

/* ───────────── Asistente ───────────── */

describe('asistente de receta', () => {
  const receta = [
    { id: 'composer-install', tipo: 'composer-install' as const, titulo: '' },
    { id: 'bd-crear', tipo: 'bd-crear' as const, titulo: '', args: { motor: 'mysql' } },
    { id: 'migrar', tipo: 'migrar' as const, titulo: '' },
    { id: 'sitio-crear', tipo: 'sitio-crear' as const, titulo: '', args: { dominio: 'a.test' } },
  ];

  it('bd-restaurar va después de bd-crear con el archivo elegido y es opcional', () => {
    const pasos = conRestaurar(pasosAsistente(receta), 'C:\\r\\x.sql', true);
    expect(pasos.map((p) => p.paso.id)).toEqual([
      'composer-install',
      'bd-crear',
      'bd-restaurar',
      'migrar',
      'sitio-crear',
    ]);
    expect(pasos[2]!.paso).toMatchObject({
      opcional: true,
      args: { archivo: 'C:\\r\\x.sql', confirmarSobrescribir: true },
    });
    // Elegir otro archivo lo reemplaza; quitarlo lo saca.
    expect(
      conRestaurar(pasos, 'C:\\r\\y.sql').filter((p) => p.paso.tipo === 'bd-restaurar'),
    ).toHaveLength(1);
    expect(sinRestaurar(pasos).map((p) => p.paso.id)).not.toContain('bd-restaurar');
  });

  it('funciona con pasos reactivos (Proxy de Vue), sin structuredClone', () => {
    const pasos = reactive(pasosAsistente(receta));
    const d = deteccionEditable(deteccion());
    expect(() => aplicarDeteccion(pasos, d)).not.toThrow();
    const guardada = reactive([{ ...receta[2]!, estado: 'listo', log: ['x'] }]);
    const r = pasosSugeridos(
      {
        actualizado: true,
        cambios: {
          composerLock: false,
          packageLock: false,
          migraciones: ['m'],
          requirements: false,
        },
      },
      guardada,
    );
    expect(r).toEqual([{ id: 'migrar', tipo: 'migrar', titulo: '' }]);
  });

  it('solo se mueven los opcionales; sitio-crear no se puede desactivar', () => {
    const ids = (x: { paso: { id: string } }[]) => x.map((p) => p.paso.id);
    const conCmd = [
      ...pasosAsistente(receta.slice(0, 3)),
      { activo: true, paso: { id: 'extra', tipo: 'comando' as const, titulo: '', opcional: true } },
      ...pasosAsistente(receta.slice(3)),
    ];
    let pasos = conRestaurar(conCmd, 'C:\\r\\x.sql');
    expect(ids(pasos)).toEqual([
      'composer-install',
      'bd-crear',
      'bd-restaurar',
      'migrar',
      'extra',
      'sitio-crear',
    ]);
    // bd-restaurar queda entre bd-crear y migrar: no sube ni baja más allá.
    expect(ids(moverPaso(pasos, 2, -1))).toEqual(ids(pasos));
    expect(ids(moverPaso(pasos, 2, 1))).toEqual(ids(pasos));
    // Un opcional se mueve, pero nunca después de sitio-crear.
    expect(ids(moverPaso(pasos, 4, 1))).toEqual(ids(pasos));
    pasos = moverPaso(pasos, 4, -1);
    expect(ids(pasos).slice(3, 5)).toEqual(['extra', 'migrar']);
    // Los obligatorios no se mueven.
    expect(ids(moverPaso(pasos, 0, 1))).toEqual(ids(pasos));
    const apagados = pasos.map((p) => ({ ...p, activo: false }));
    expect(recetaElegida(apagados).map((p) => p.id)).toEqual(['sitio-crear']);
  });

  it('lleva la detección editada a sitio-crear y al motor de la base', () => {
    const d = { ...deteccionEditable(deteccion()), tipo: 'laravel' as const, dominio: 'otro.test' };
    d.servicios = ['postgresql'];
    const pasos = aplicarDeteccion(conRestaurar(pasosAsistente(receta), 'C:\\r\\x.sql'), d);
    expect(pasos.find((p) => p.paso.id === 'sitio-crear')!.paso.args).toMatchObject({
      tipo: 'laravel',
      dominio: 'otro.test',
      php: '8.3',
    });
    expect(pasos.find((p) => p.paso.id === 'bd-crear')!.paso.args).toMatchObject({
      motor: 'postgresql',
    });
    d.servicios = ['redis'];
    expect(aplicarDeteccion(pasosAsistente(receta), d).map((p) => p.paso.id)).toEqual([
      'composer-install',
      'migrar',
      'sitio-crear',
    ]);
  });

  it('desactivar bd-crear desactiva bd-restaurar (y este no se activa sin aquel)', () => {
    let pasos = conRestaurar(pasosAsistente(receta), 'C:\\r\\x.sql');
    pasos = alternarPaso(pasos, 1, false);
    expect(pasos.map((p) => [p.paso.id, p.activo]).slice(1, 3)).toEqual([
      ['bd-crear', false],
      ['bd-restaurar', false],
    ]);
    expect(alternarPaso(pasos, 2, true)[2]!.activo).toBe(false);
    pasos = alternarPaso(pasos, 1, true);
    expect(alternarPaso(pasos, 2, true)[2]!.activo).toBe(true);
    // sitio-crear no se desactiva.
    expect(alternarPaso(pasos, 4, false)[4]!.activo).toBe(true);
  });

  it('pide puerto solo si un tipo proxy no trae un proceso con puerto en sitio-crear', () => {
    const conUvicorn = pasosAsistente([
      {
        id: 'sitio-crear',
        tipo: 'sitio-crear',
        titulo: '',
        args: { procesos: [{ id: 'uvicorn', comando: ['uvicorn', '--port', '{puerto}'] }] },
      },
    ]);
    expect(necesitaPuertoProxy('fastapi', conUvicorn)).toBe(false);
    expect(necesitaPuertoProxy('node', pasosAsistente(receta))).toBe(true);
    expect(necesitaPuertoProxy('proxy', conUvicorn)).toBe(true);
    expect(necesitaPuertoProxy('laravel', pasosAsistente(receta))).toBe(false);
  });

  it('el sitio se crea confiado con su tipo real (también FastAPI y Node)', () => {
    const d = deteccionEditable(deteccion());
    const datos = datosSitioInicial('C:\\Proyectos\\Rents', d, 'https://github.com/johan/rents');
    expect(datos).toMatchObject({
      nombre: 'Rents',
      dominio: 'rents.test',
      tipo: 'laravel',
      php: '8.3',
      confiado: true,
      git: { remoto: 'https://github.com/johan/rents', rama: null },
      runtimes: {},
    });
    const api = datosSitioInicial(
      'C:\\Proyectos\\Bot',
      { ...deteccionEditable(deteccion({ tipo: 'fastapi' })), python: '3.12.10' },
      null,
    );
    expect(api).toMatchObject({ tipo: 'fastapi', php: null, runtimes: { python: '3.12.10' } });
    const vite = datosSitioInicial(
      'C:\\Proyectos\\Web',
      { ...deteccionEditable(deteccion({ tipo: 'node' })), puertoProxy: 5173 },
      null,
    );
    expect(vite).toMatchObject({ tipo: 'node', puertoProxy: 5173 });
  });
});

/* ───────────── Traer cambios ───────────── */

describe('pasos sugeridos tras traer cambios', () => {
  it('composer, npm y migrar según lo que cambió, con los args de la receta guardada', () => {
    const guardada = [
      { id: 'migrar', tipo: 'migrar' as const, titulo: '', args: { semilla: true } },
      { id: 'npm-ci', tipo: 'npm-ci' as const, titulo: '' },
    ];
    const r = pasosSugeridos(
      {
        actualizado: true,
        cambios: {
          composerLock: true,
          packageLock: true,
          migraciones: ['2026_x.php'],
          requirements: false,
        },
      },
      guardada,
    );
    expect(r.map((p) => p.id)).toEqual(['composer-install', 'npm-ci', 'migrar']);
    // Migrar tras traer cambios no repite --seed (duplicaría los datos de prueba).
    expect(r[2]!.args).toBeUndefined();
  });
});

/* ───────────── Procesos ───────────── */

describe('diálogo de reinstalar', () => {
  it('lista la receta guardada y avisa si la del proyecto cambió desde "Confío…"', () => {
    const pasos = estadoReceta().pasos;
    const sin = resumenReinstalar(pasos, false);
    expect(sin.aviso).toBeNull();
    expect(sin.pasos).toEqual([
      'Instalar dependencias de PHP (composer install)',
      'Migrar la base de datos',
      'Crear el sitio wolfcore.test',
    ]);
    const restaurar = { id: 'bd-restaurar', tipo: 'bd-restaurar' as const, titulo: '' };
    const con = resumenReinstalar([...pasos, restaurar], true);
    expect(con.aviso).toMatch(/cambió/);
    expect(con.pasos.at(-1)).toMatch(/no se vuelve a restaurar/);
  });
});

describe('procesos del proyecto', () => {
  it('parte y une comandos con comillas', () => {
    expect(partirComando('npm run dev -- --host "mi host"')).toEqual([
      'npm',
      'run',
      'dev',
      '--',
      '--host',
      'mi host',
    ]);
    expect(unirComando(['php', 'artisan', 'queue:work', 'a b'])).toBe(
      'php artisan queue:work "a b"',
    );
    expect(partirComando(unirComando(['x', 'a "b" c']))).toEqual(['x', 'a "b" c']);
  });

  it('ids sin guiones ni repetidos', () => {
    expect(idProceso('Vite dev', [])).toBe('vite_dev');
    expect(idProceso('Vite dev', ['vite_dev'])).toBe('vite_dev_2');
    expect(idProceso('---', [])).toBe('proceso');
  });

  it('avisa reinicio solo si cambian comando, carpeta o puerto', () => {
    const a = { ...procesoVacio(), comando: ['npm', 'run', 'dev'], puerto: 5173 };
    expect(requiereReinicio(a, { ...a })).toBe(false);
    expect(requiereReinicio(a, { ...a, puerto: 5174 })).toBe(true);
    expect(requiereReinicio(a, { ...a, comando: ['npm', 'run', 'serve'] })).toBe(true);
    expect(requiereReinicio(a, { ...a, cwd: 'frontend' })).toBe(true);
  });

  it('solo un proceso es destino del proxy', () => {
    const uv = { ...procesoVacio(), id: 'uvicorn', comando: ['uv'], puerto: 8000, proxy: true };
    const vite = { ...procesoVacio(), id: 'vite', comando: ['npm'], puerto: 5173, proxy: true };
    const lista = conProceso([uv], vite);
    expect(lista.map((p) => [p.id, p.proxy])).toEqual([
      ['uvicorn', false],
      ['vite', true],
    ]);
  });

  it('valida el formulario de proceso', () => {
    const p = { ...procesoVacio(), id: 'x', comando: ['npm'] };
    expect(errorProceso({ ...p, comando: [] }, [])).toMatch(/comando/i);
    expect(errorProceso({ ...p, proxy: true }, [])).toMatch(/puerto/i);
    expect(errorProceso({ ...p, cwd: '..\\otro' }, [])).toMatch(/subcarpeta/i);
    expect(errorProceso({ ...p, cwd: 'C:\\x' }, [])).toMatch(/subcarpeta/i);
    expect(errorProceso({ ...p, cwd: 'frontend' }, [])).toBeNull();
  });
});

describe('duplicar un proyecto', () => {
  it('no hereda "Confío…", la huella ni los procesos', () => {
    const original = sitio({
      confiado: true,
      recetaConfiada: 'abc',
      procesos: [{ ...procesoVacio(), id: 'vite', comando: ['npm'], puerto: 5173 }],
    });
    const copia = datosParaDuplicar(original, [original]);
    expect(copia.confiado).toBe(false);
    expect(copia.procesos).toEqual([]);
    expect(copia).not.toHaveProperty('recetaConfiada');
  });
});

/* ───────────── Store ───────────── */

type Oyente = (dato: unknown) => void;

function apiFalsa() {
  const oyentes = new Map<string, Set<Oyente>>();
  let fin: (r: ResultadoReceta) => void = () => undefined;
  const api = {
    proyectos: {
      estadoReceta: vi.fn(async (): Promise<EstadoReceta> => estadoReceta()),
      ejecutarReceta: vi.fn(
        () =>
          new Promise<ResultadoReceta>((res) => {
            fin = res;
          }),
      ),
      omitirPaso: vi.fn(async (): Promise<ResultadoReceta> => ({ estado: 'lista' })),
      crearSitio: vi.fn(),
      confiar: vi.fn(),
      cancelarReceta: vi.fn(async () => true),
    },
    git: {
      disponible: vi.fn(async () => ({
        git: 'C:\\git.exe',
        gh: null,
        ghSesion: false,
      })),
    },
    github: {
      hayToken: vi.fn(async () => true),
      repos: vi.fn(async (): Promise<RepoGithub[]> => [repo()]),
    },
    vigilar: {
      sugerencias: vi.fn(async (): Promise<SugerenciaProyecto[]> => []),
      cambiarCarpeta: vi.fn(async () => undefined),
    },
    on: vi.fn((nombre: string, fn: Oyente) => {
      const set = oyentes.get(nombre) ?? new Set<Oyente>();
      set.add(fn);
      oyentes.set(nombre, set);
      return () => void set.delete(fn);
    }),
  };
  const emitir = <K extends keyof EventosNucleo>(nombre: K, dato: EventosNucleo[K]): void => {
    for (const fn of oyentes.get(nombre) ?? []) fn(dato);
  };
  return { api, emitir, terminar: (r: ResultadoReceta) => fin(r) };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe('store de proyectos', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ejecuta con la receta del asistente y sigue el progreso por eventos', async () => {
    const p = useProyectos();
    p.iniciar();
    const receta = [{ id: 'migrar', tipo: 'migrar' as const, titulo: '' }];
    const corrida = p.ejecutar('wolf', { receta });
    expect(p.receta('wolf').estado).toBe('corriendo');
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenCalledWith('wolf', { receta });

    // El primer evento trae un paso que el store no conocía: pide el estado completo.
    falsa.emitir('receta:progreso', { sitioId: 'wolf', pasoId: 'migrar', estado: 'pendiente' });
    await esperar();
    expect(falsa.api.proyectos.estadoReceta).toHaveBeenCalledTimes(1);
    expect(p.receta('wolf').pasos).toHaveLength(3);

    falsa.emitir('receta:progreso', {
      sitioId: 'wolf',
      pasoId: 'migrar',
      estado: 'error',
      linea: 'sin base',
    });
    expect(pasoConError(p.receta('wolf'))?.mensaje).toBe('sin base');

    falsa.api.proyectos.estadoReceta.mockResolvedValueOnce({
      ...estadoReceta(),
      estado: 'error',
    });
    falsa.terminar({ estado: 'error', pasoId: 'migrar', mensaje: 'sin base' });
    await expect(corrida).resolves.toEqual({
      estado: 'error',
      pasoId: 'migrar',
      mensaje: 'sin base',
    });
    expect(p.receta('wolf').estado).toBe('error');
  });

  it('Reintentar sigue desde el paso con la receta guardada; Omitir usa omitirPaso', async () => {
    const p = useProyectos();
    const r = p.reintentar('wolf', 'migrar');
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenCalledWith('wolf', { desde: 'migrar' });
    falsa.terminar({ estado: 'lista' });
    await r;

    await p.omitir('wolf', 'migrar');
    expect(falsa.api.proyectos.omitirPaso).toHaveBeenCalledWith('wolf', 'migrar');

    const s = p.correrPaso('wolf', 'npm-ci');
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenLastCalledWith('wolf', {
      soloPaso: 'npm-ci',
    });
    falsa.terminar({ estado: 'incompleta' });
    await s;

    await p.cancelar('wolf');
    expect(falsa.api.proyectos.cancelarReceta).toHaveBeenCalledWith('wolf');
  });

  it('Reinstalar repite la receta guardada ("guardada")', async () => {
    const p = useProyectos();
    const r = p.reinstalar('wolf');
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenCalledWith('wolf', { guardada: true });
    falsa.terminar({ estado: 'lista' });
    await r;
  });

  it('una corrida suelta lleva su propio estado y no toca la receta guardada', async () => {
    const p = useProyectos();
    p.iniciar();
    await p.cargarReceta('wolf');
    const antes = JSON.stringify(p.receta('wolf'));
    const receta = [{ id: 'npm-ci', tipo: 'npm-ci' as const, titulo: '' }];
    const corrida = p.ejecutarSuelta('wolf', receta);
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenCalledWith('wolf', {
      receta,
      suelta: true,
    });
    expect(p.suelta('wolf')?.pasos.map((x) => [x.id, x.estado])).toEqual([['npm-ci', 'pendiente']]);
    falsa.emitir('receta:progreso', {
      sitioId: 'wolf',
      pasoId: 'npm-ci',
      estado: 'corriendo',
      linea: 'added 12 packages',
      suelta: true,
    });
    expect(p.suelta('wolf')?.pasos[0]).toMatchObject({
      estado: 'corriendo',
      log: ['added 12 packages'],
    });
    expect(JSON.stringify(p.receta('wolf'))).toBe(antes);
    expect(falsa.api.proyectos.estadoReceta).toHaveBeenCalledTimes(1);
    falsa.terminar({ estado: 'lista' });
    await corrida;
    expect(p.suelta('wolf')?.estado).toBe('lista');
  });

  it('los pasos sugeridos tras traer cambios no repiten --seed en la corrida suelta', async () => {
    const p = useProyectos();
    const guardada = [
      { id: 'migrar', tipo: 'migrar' as const, titulo: '', args: { semilla: true } },
    ];
    const receta = pasosSugeridos(
      {
        actualizado: true,
        cambios: {
          composerLock: false,
          packageLock: false,
          migraciones: ['m'],
          requirements: false,
        },
      },
      guardada,
    );
    const corrida = p.ejecutarSuelta('wolf', receta);
    expect(falsa.api.proyectos.ejecutarReceta).toHaveBeenCalledWith('wolf', {
      receta: [{ id: 'migrar', tipo: 'migrar', titulo: '' }],
      suelta: true,
    });
    falsa.terminar({ estado: 'lista' });
    await corrida;
  });

  it('progreso del clon por destino (sin distinguir mayúsculas)', () => {
    const p = useProyectos();
    p.iniciar();
    falsa.emitir('git:progreso', { destino: 'C:\\Proyectos\\Rents', linea: 'Cloning…' });
    expect(p.lineasClon('c:\\proyectos\\rents')).toEqual(['Cloning…']);
    p.olvidarClon('C:\\PROYECTOS\\RENTS');
    expect(p.lineasClon('C:\\Proyectos\\Rents')).toEqual([]);
  });

  it('conexión con token y repos marcados como ya clonados', async () => {
    const p = useProyectos();
    useSitios().hidratar([sitio({ carpeta: 'c:\\PROYECTOS\\rents', git: null })]);
    await p.cargarConexion();
    expect(p.conexion).toBe('token');
    await p.cargarRepos('ren');
    expect(falsa.api.github.repos).toHaveBeenCalledWith({ buscar: 'ren', pagina: 1 });
    expect(p.reposMarcados.map((r) => r.yaClonado)).toEqual([true]);
    expect(p.hayMasRepos).toBe(false);
  });

  it('sugerencias: llegan por evento, se descartan y se ocultan si ya son proyecto', async () => {
    const p = useProyectos();
    p.iniciar();
    falsa.emitir('proyectos:sugerencias', [
      { carpeta: 'C:\\Proyectos\\Rents', deteccion: deteccion() },
      { carpeta: 'C:\\Proyectos\\Coffe', deteccion: deteccion() },
      { carpeta: 'C:\\Proyectos\\Bot', deteccion: deteccion({ tipo: 'fastapi' }) },
    ]);
    expect(p.sugerenciasPendientes).toHaveLength(3);
    p.descartar('c:\\proyectos\\coffe');
    useSitios().aplicar([sitio({ carpeta: 'C:\\PROYECTOS\\RENTS\\' })]);
    expect(p.sugerenciasPendientes.map((s) => s.carpeta)).toEqual(['C:\\Proyectos\\Bot']);

    await p.cambiarCarpetaVigilada(null);
    expect(falsa.api.vigilar.cambiarCarpeta).toHaveBeenCalledWith(null);
    expect(p.sugerenciasPendientes).toEqual([]);
  });
});
