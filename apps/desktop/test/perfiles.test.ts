import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import {
  RutasElegidas,
  validarExportarPerfil,
  validarImportarPerfil,
  validarVistaPreviaPerfil,
} from '../src/main/validacion';
import { RUTAS_IPC, type VistaPreviaPerfil } from '../src/shared/api';
import {
  bloqueosImportar,
  estadoVersion,
  filaReemplaza,
  fraseNecesaria,
  rellenar,
  tamanoLegible,
  huellaEnGrupos,
  lineasConfigQuitada,
  MIN_FRASE,
  ofreceCa,
  opcionesImportar,
  prefijoDesdeElegida,
  puedeConfirmarRevision,
  problemaExportar,
  puedeImportar,
  resumenImportacion,
  sitiosSinCarpeta,
  type EstadoImportar,
} from '../src/renderer/utilidades/perfiles';

const HUELLA = 'ab'.repeat(32);
const FRASE = 'frase-larga-de-prueba-9';

function vista(o: Partial<VistaPreviaPerfil> = {}): VistaPreviaPerfil {
  return {
    creado: '2026-11-25T10:00:00.000Z',
    origen: { sistema: 'win', idCatalogo: 'win-x64' },
    incluye: { bases: false, certificados: false, ca: false },
    sitios: [],
    versiones: [],
    instancias: [],
    bases: [],
    plantillas: [],
    workspaces: [],
    workspacesInvalidos: 0,
    reemplaza: [],
    puertosOcupados: [],
    ignoradas: 0,
    carpetaConDatos: false,
    descargas: 0,
    requiereFrase: false,
    configQuitada: [],
    ca: null,
    huella: 'f'.repeat(64),
    ...o,
  };
}

const caVista = (o: Partial<NonNullable<VistaPreviaPerfil['ca']>> = {}) => ({
  huella: HUELLA,
  reemplazaLocal: false,
  restringida: true,
  restriccionesAjenas: false,
  ...o,
});

function estado(o: Partial<EstadoImportar> = {}): EstadoImportar {
  return {
    vista: vista(),
    rutas: {},
    prefijos: [],
    comoPendiente: {},
    frase: '',
    importarCa: false,
    reemplazarCa: false,
    aceptarSinRestricciones: false,
    omitirBases: false,
    envProyectos: [],
    ...o,
  };
}

const sitio = (id: string, existe: boolean, omitido: string | null = null) => ({
  id,
  nombre: id,
  carpeta: `C:\\Users\\viejo\\proyectos\\${id}`,
  existe,
  omitido,
});

describe('perfiles (D27): utilidades del asistente', () => {
  it('no deja confirmar con sitios sin carpeta salvo que se marquen "importar igual como pendiente"', () => {
    const v = vista({ sitios: [sitio('tienda', false), sitio('blog', true)] });
    expect(sitiosSinCarpeta(v, {}).map((s) => s.id)).toEqual(['tienda']);
    expect(bloqueosImportar(estado({ vista: v }))).toContain('sitios_sin_carpeta');
    expect(puedeImportar(estado({ vista: v }))).toBe(false);
    // Marcado como pendiente: se puede.
    const e = estado({ vista: v, comoPendiente: { tienda: true } });
    expect(bloqueosImportar(e)).toEqual([]);
    expect(puedeImportar(e)).toBe(true);
    // Con carpeta elegida (la vista previa ya la ve) tampoco bloquea.
    const resuelta = vista({ sitios: [sitio('tienda', true), sitio('blog', true)] });
    expect(puedeImportar(estado({ vista: resuelta }))).toBe(true);
  });

  it('un sitio omitido (ruta protegida, dominio en uso) no bloquea ni se pide su carpeta', () => {
    const v = vista({ sitios: [sitio('x', false, 'ruta_protegida')] });
    expect(sitiosSinCarpeta(v, {})).toEqual([]);
    expect(puedeImportar(estado({ vista: v }))).toBe(true);
  });

  it('la carpeta elegida en esta pasada cuenta como resuelta aunque la vista previa aún no se recalcule', () => {
    const v = vista({ sitios: [sitio('tienda', false)] });
    expect(sitiosSinCarpeta(v, { tienda: 'D:\\dev\\tienda' })).toEqual([]);
  });

  it('la CA solo se ofrece si es del perfil y no lleva restricciones ajenas', () => {
    expect(ofreceCa(vista())).toBe(false);
    expect(ofreceCa(vista({ ca: caVista() }))).toBe(true);
    expect(ofreceCa(vista({ ca: caVista({ restringida: false }) }))).toBe(true);
    expect(
      ofreceCa(vista({ ca: caVista({ restringida: false, restriccionesAjenas: true }) })),
    ).toBe(false);
  });

  it('CA sin restricciones: exige su casilla aparte; ajena: nunca, aunque se fuerce', () => {
    const sin = vista({ ca: caVista({ restringida: false }), requiereFrase: true });
    const base = { vista: sin, importarCa: true, frase: FRASE };
    expect(bloqueosImportar(estado(base))).toContain('ca_sin_restricciones');
    expect(puedeImportar(estado({ ...base, aceptarSinRestricciones: true }))).toBe(true);
    // Sin pedir importarla, la casilla no hace falta.
    expect(puedeImportar(estado({ vista: sin }))).toBe(true);
    const ajena = vista({
      ca: caVista({ restringida: false, restriccionesAjenas: true }),
      requiereFrase: true,
    });
    const e = estado({
      vista: ajena,
      importarCa: true,
      aceptarSinRestricciones: true,
      frase: FRASE,
    });
    expect(bloqueosImportar(e)).toContain('ca_ajena');
    expect(puedeImportar(e)).toBe(false);
    expect(opcionesImportar(e).importarCa).toBeUndefined();
  });

  it('reemplazar la CA de este equipo exige su propia confirmación', () => {
    const v = vista({ ca: caVista({ reemplazaLocal: true }), requiereFrase: true });
    const e = estado({ vista: v, importarCa: true, frase: FRASE });
    expect(bloqueosImportar(e)).toContain('reemplazar_ca');
    expect(puedeImportar({ ...e, reemplazarCa: true })).toBe(true);
    expect(opcionesImportar({ ...e, reemplazarCa: true })).toMatchObject({
      importarCa: true,
      reemplazarCa: true,
    });
  });

  it('la frase solo hace falta con bases (sin omitirlas) o para importar la CA', () => {
    const conBases = vista({
      bases: [{ instancia: 'mysql@8.4', base: 'tienda' }],
      requiereFrase: true,
    });
    expect(fraseNecesaria(estado({ vista: conBases }))).toBe(true);
    expect(bloqueosImportar(estado({ vista: conBases }))).toContain('frase_requerida');
    expect(puedeImportar(estado({ vista: conBases, frase: FRASE }))).toBe(true);
    expect(puedeImportar(estado({ vista: conBases, omitirBases: true }))).toBe(true);
    const soloCa = vista({ ca: caVista(), requiereFrase: true });
    expect(fraseNecesaria(estado({ vista: soloCa }))).toBe(false);
    expect(fraseNecesaria(estado({ vista: soloCa, importarCa: true }))).toBe(true);
    expect(fraseNecesaria(estado({ vista: vista() }))).toBe(false);
  });

  it('las opciones llevan la frase solo si hace falta y solo las confirmaciones que corresponden', () => {
    const v = vista({
      bases: [{ instancia: 'mysql@8.4', base: 'tienda' }],
      requiereFrase: true,
      ca: caVista(),
      sitios: [sitio('tienda', true)],
      huella: 'c'.repeat(64),
    });
    // Sin la CA y sin bases: ni frase ni banderas.
    const sinTodo = opcionesImportar(estado({ vista: v, omitirBases: true, frase: FRASE }));
    expect(sinTodo).toEqual({
      rutas: {},
      huella: 'c'.repeat(64),
      confirmado: true,
      omitirBases: true,
    });
    const conTodo = opcionesImportar(
      estado({
        vista: v,
        frase: FRASE,
        importarCa: true,
        reemplazarCa: true,
        aceptarSinRestricciones: true,
        rutas: { tienda: 'D:\\dev\\tienda' },
        prefijos: [{ viejo: 'C:\\Users\\viejo', nuevo: 'D:\\dev' }],
        envProyectos: ['tienda'],
      }),
    );
    // La CA está restringida y es la local: no se mandan confirmaciones que no corresponden.
    expect(conTodo).toEqual({
      rutas: { tienda: 'D:\\dev\\tienda' },
      prefijos: [{ viejo: 'C:\\Users\\viejo', nuevo: 'D:\\dev' }],
      frase: FRASE,
      importarCa: true,
      envProyectos: ['tienda'],
      huella: 'c'.repeat(64),
      confirmado: true,
    });
  });

  it('no se confirma la revisión mientras haya un error al recalcular la vista previa', () => {
    const base = { cargando: false, hayVista: true, errorVista: null };
    expect(puedeConfirmarRevision(base)).toBe(true);
    expect(puedeConfirmarRevision({ ...base, errorVista: 'falló' })).toBe(false);
    expect(puedeConfirmarRevision({ ...base, cargando: true })).toBe(false);
    expect(puedeConfirmarRevision({ ...base, hayVista: false })).toBe(false);
  });

  it('exportar: frase de al menos 10 caracteres, repetida igual, y certificados solo con la CA', () => {
    const base = { bases: false, certificados: false, ca: false, frase: '', fraseRepetida: '' };
    expect(problemaExportar(base)).toBeNull();
    expect(problemaExportar({ ...base, ca: true })).toBe('frase_corta');
    expect(problemaExportar({ ...base, bases: true, frase: 'corta', fraseRepetida: 'corta' })).toBe(
      'frase_corta',
    );
    expect(MIN_FRASE).toBe(10);
    expect(problemaExportar({ ...base, ca: true, frase: FRASE, fraseRepetida: FRASE + 'x' })).toBe(
      'frase_distinta',
    );
    expect(problemaExportar({ ...base, ca: true, frase: FRASE, fraseRepetida: FRASE })).toBeNull();
    expect(problemaExportar({ ...base, certificados: true })).toBe('certificados_sin_ca');
  });

  it('la huella de la CA se muestra en grupos legibles y en mayúsculas', () => {
    expect(huellaEnGrupos(HUELLA)).toBe(Array(16).fill('ABAB').join(' '));
    expect(huellaEnGrupos('')).toBe('');
  });

  it('el prefijo se deduce de la carpeta que el usuario eligió para un sitio', () => {
    expect(
      prefijoDesdeElegida('C:\\Users\\viejo\\proyectos\\tienda', 'D:\\dev\\proyectos\\tienda'),
    ).toEqual({
      viejo: 'C:\\Users\\viejo',
      nuevo: 'D:\\dev',
    });
    expect(prefijoDesdeElegida('C:\\a\\tienda', 'D:\\x\\otra')).toBeNull();
    expect(prefijoDesdeElegida('/home/viejo/web/tienda', '/srv/web/tienda')).toEqual({
      viejo: '/home/viejo',
      nuevo: '/srv',
    });
    expect(prefijoDesdeElegida('C:\\tienda', 'C:\\tienda')).toBeNull();
  });

  it('lo quitado de la configuración se separa en tipo e id', () => {
    expect(
      lineasConfigQuitada(['ia:openai', 'smtp:gmail', 'puerto:nginx.puerto', 'carpeta_vigilada']),
    ).toEqual([
      { tipo: 'ia', id: 'openai' },
      { tipo: 'smtp', id: 'gmail' },
      { tipo: 'puerto', id: 'nginx.puerto' },
      { tipo: 'carpeta_vigilada', id: '' },
    ]);
  });

  it('el resumen cuenta lo importado, lo pendiente, lo omitido y lo que falló', () => {
    const r = resumenImportacion({
      respaldo: null,
      sitios: [
        { id: 'a', estado: 'importado', carpeta: 'x', motivos: [] },
        { id: 'b', estado: 'pendiente', carpeta: 'x', motivos: ['carpeta_no_existe'] },
        { id: 'c', estado: 'omitido', carpeta: 'x', motivos: ['ruta_protegida'] },
      ],
      versiones: [
        { servicio: 'php', version: '8.4.3', estado: 'instalada', motivo: null },
        { servicio: 'mailpit', version: '1.20.0', estado: 'pendiente', motivo: 'huella_debil' },
      ],
      instancias: [],
      bases: [
        { instancia: 'mysql@8.4', base: 'a', estado: 'error', motivo: 'sin_copia_previa' },
        { instancia: 'mysql@8.4', base: 'b', estado: 'importado', motivo: null },
      ],
      plantillas: [],
      workspaces: [],
      workspacesInvalidos: 0,
      env: [],
      ca: 'sin_cambios',
      avisos: [],
    });
    expect(r).toEqual({ importados: 3, pendientes: 2, omitidos: 1, errores: 1 });
  });
});

describe('perfiles (D27): textos de la vista previa', () => {
  it('interpreta lo que se reemplaza', () => {
    expect(filaReemplaza('config.json')).toEqual({ tipo: 'config' });
    expect(filaReemplaza('ca')).toEqual({ tipo: 'ca' });
    expect(filaReemplaza('sitio:tienda')).toEqual({ tipo: 'sitio', id: 'tienda' });
    expect(filaReemplaza('plantilla:base-laravel-abc')).toEqual({
      tipo: 'plantilla',
      id: 'base-laravel-abc',
    });
    expect(filaReemplaza('base:mysql@8.4/tienda')).toEqual({
      tipo: 'base',
      instancia: 'mysql@8.4',
      base: 'tienda',
    });
    for (const raro of ['', 'base:sin-barra', 'base:/x', 'sitio:', 'otra:cosa']) {
      expect(filaReemplaza(raro), raro).toBeNull();
    }
  });

  it('una versión se instala sola solo con huella fuerte o firma; el resto queda pendiente', () => {
    const v = (o: Partial<Parameters<typeof estadoVersion>[0]>) =>
      estadoVersion({ instalada: false, disponible: true, huella: 'fuerte', ...o });
    expect(v({ instalada: true })).toBe('instalada');
    expect(v({})).toBe('descargar');
    expect(v({ huella: 'firmada' })).toBe('descargar');
    expect(v({ huella: 'debil' })).toBe('pendienteDebil');
    expect(v({ huella: 'ninguna' })).toBe('pendienteDebil');
    expect(v({ disponible: false })).toBe('pendienteFuera');
  });

  it('tamaños y parámetros', () => {
    expect(tamanoLegible(512 * 1024)).toBe('0.5 MB');
    expect(tamanoLegible(40 * 1024 * 1024)).toBe('40 MB');
    expect(tamanoLegible(3 * 1024 * 1024 * 1024)).toBe('3.0 GB');
    expect(rellenar('base {base} ({instancia})', { base: 'a' })).toBe('base a ({instancia})');
  });
});

describe('perfiles (D27): validación en el proceso principal', () => {
  const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-perfiles-ipc-'));
  afterEach(() => undefined);
  const guardado = path.join(carpeta, 'entorno.wolfperfil');
  const leido = path.join(carpeta, 'otro.wolfperfil');
  writeFileSync(leido, 'x');

  it('exportar: el destino solo sale de un diálogo de "guardar"', () => {
    const e = new RutasElegidas();
    const o = { destino: guardado, bases: false, certificados: false, ca: false, frase: null };
    expect(() => validarExportarPerfil(o, e)).toThrow(/diálogo/);
    e.registrar(guardado, 'abrir');
    expect(() => validarExportarPerfil(o, e)).toThrow(/diálogo/);
    e.registrar(guardado, 'guardar');
    expect(validarExportarPerfil(o, e)).toEqual(o);
  });

  it('exportar: booleanos de verdad, frase como texto o null y nada de campos de más', () => {
    const e = new RutasElegidas();
    e.registrar(guardado, 'guardar');
    const ok = { destino: guardado, bases: true, certificados: false, ca: false, frase: FRASE };
    expect(validarExportarPerfil(ok, e).frase).toBe(FRASE);
    for (const malo of [
      { ...ok, bases: 'si' },
      { ...ok, frase: 42 },
      { ...ok, frase: 'x'.repeat(1025) },
      { ...ok, extra: true },
      { ...ok, frase: 'con\ncontrol' },
    ]) {
      expect(() => validarExportarPerfil(malo, e)).toThrow();
    }
  });

  it('un error de validación nunca repite la frase', () => {
    const e = new RutasElegidas();
    e.registrar(guardado, 'guardar');
    try {
      validarExportarPerfil(
        { destino: guardado, bases: 'no', certificados: false, ca: false, frase: FRASE },
        e,
      );
    } catch (x) {
      expect(String((x as Error).message)).not.toContain(FRASE);
    }
  });

  it('vista previa: el archivo y las carpetas salen de diálogos', () => {
    const e = new RutasElegidas();
    expect(() => validarVistaPreviaPerfil(leido, { rutas: {} }, e)).toThrow(/diálogo/);
    e.registrar(leido);
    expect(validarVistaPreviaPerfil(leido, { rutas: {} }, e)).toEqual({
      archivo: leido,
      rutas: {},
      prefijos: [],
    });
    expect(() => validarVistaPreviaPerfil(leido, { rutas: { tienda: 'D:\\libre' } }, e)).toThrow(
      /diálogo/,
    );
    e.registrar(carpeta);
    expect(
      validarVistaPreviaPerfil(
        leido,
        {
          rutas: { tienda: carpeta },
          prefijos: [{ viejo: 'C:\\Users\\viejo', nuevo: carpeta }],
        },
        e,
      ),
    ).toEqual({
      archivo: leido,
      rutas: { tienda: carpeta },
      prefijos: [{ viejo: 'C:\\Users\\viejo', nuevo: carpeta }],
    });
    expect(() =>
      validarVistaPreviaPerfil(
        leido,
        { rutas: {}, prefijos: [{ viejo: 'C:\\x', nuevo: 'D:\\libre' }] },
        e,
      ),
    ).toThrow(/diálogo/);
  });

  it('vista previa: ids y topes razonables', () => {
    const e = new RutasElegidas();
    e.registrar(leido);
    e.registrar(carpeta);
    expect(() => validarVistaPreviaPerfil(leido, { rutas: { '': carpeta } }, e)).toThrow();
    const muchas = Object.fromEntries(Array.from({ length: 2001 }, (_, i) => [`s${i}`, carpeta]));
    expect(() => validarVistaPreviaPerfil(leido, { rutas: muchas }, e)).toThrow();
    const prefijos = Array.from({ length: 51 }, () => ({ viejo: 'C:\\x', nuevo: carpeta }));
    expect(() => validarVistaPreviaPerfil(leido, { rutas: {}, prefijos }, e)).toThrow();
  });

  it('importar: confirmado y huella obligatorios; las banderas solo en true', () => {
    const e = new RutasElegidas();
    e.registrar(leido);
    const ok = { rutas: {}, huella: HUELLA, confirmado: true };
    expect(validarImportarPerfil(leido, ok, e)).toMatchObject({
      archivo: leido,
      opciones: { huella: HUELLA, confirmado: true },
    });
    for (const malo of [
      { ...ok, confirmado: false },
      { rutas: {}, huella: HUELLA },
      { ...ok, huella: 'no-es-hex' },
      { ...ok, importarCa: false },
      { ...ok, reemplazarCa: 'si' },
      { ...ok, frase: '' },
      { ...ok, envProyectos: 'tienda' },
      { ...ok, guardarClave: () => undefined },
    ]) {
      expect(() => validarImportarPerfil(leido, malo, e)).toThrow();
    }
    const todo = validarImportarPerfil(
      leido,
      {
        ...ok,
        frase: FRASE,
        importarCa: true,
        reemplazarCa: true,
        aceptarCaSinRestricciones: true,
        omitirBases: true,
        envProyectos: ['tienda'],
      },
      e,
    );
    expect(todo.opciones).toMatchObject({
      frase: FRASE,
      importarCa: true,
      reemplazarCa: true,
      aceptarCaSinRestricciones: true,
      omitirBases: true,
      envProyectos: ['tienda'],
    });
  });

  it('cleanup', () => {
    rmSync(carpeta, { recursive: true, force: true });
  });
});

describe('perfiles (D27): rutas IPC', () => {
  const rutas = [
    'perfiles.entorno',
    'perfiles.exportar',
    'perfiles.vistaPrevia',
    'perfiles.importar',
    'perfiles.instantaneas',
    'perfiles.quitarCaAnterior',
    'perfiles.instantanea',
  ] as const;

  it('están en la lista blanca', () => {
    for (const r of rutas) expect(RUTAS_IPC).toContain(r);
  });

  function montar() {
    const canales = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    const ipcMain: IpcMainLike = {
      handle: (canal, fn) => void canales.set(canal, fn as never),
    };
    const nucleo = {
      eventos: { on: () => () => undefined },
      aislado: true,
      rutas: { base: 'C:\\prueba\\datos' },
      exportarPerfil: vi.fn(async (o: { destino: string }) => ({
        archivo: o.destino,
        bytes: 10,
        avisos: [],
      })),
      vistaPreviaImportarPerfil: vi.fn(async () => vista()),
      importarPerfil: vi.fn(
        async (
          _archivo: string,
          o: { guardarClave: (sitio: string, clave: string) => Promise<void> },
        ) => {
          await o.guardarClave('tienda', 'clave-nueva-de-prueba');
          return { sitios: [] };
        },
      ),
      instantaneaEntorno: vi.fn(async () =>
        path.join('C:\\prueba', 'respaldos', 'entorno', 'x-manual'),
      ),
      instantaneasEntorno: vi.fn(async () => []),
    };
    const guardados: [string, string][] = [];
    const secretos = {
      guardar: vi.fn(async (id: string, v: string) => void guardados.push([id, v])),
    } as unknown as NonNullable<Parameters<typeof registrarIpc>[6]>['secretos'];
    const elegidas = new RutasElegidas();
    const sistema = {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    };
    const ventana: VentanaLike = {
      isDestroyed: () => false,
      webContents: { send: () => undefined },
    };
    registrarIpc(nucleo as unknown as NucleoIpc, ipcMain, ventana, sistema, () => true, elegidas, {
      secretos,
    });
    const llamar = (ruta: string, ...a: unknown[]) => canales.get(`entorno:${ruta}`)!({}, ...a);
    return { nucleo, llamar, elegidas, guardados };
  }

  it('entorno dice si es la carpeta de prueba y cuál', async () => {
    const { llamar } = montar();
    expect(await llamar('perfiles.entorno')).toEqual({
      ok: true,
      valor: { aislado: true, carpeta: 'C:\\prueba\\datos' },
    });
  });

  it('exportar rechaza una ruta libre y no llama al núcleo', async () => {
    const { llamar, nucleo } = montar();
    const r = await llamar('perfiles.exportar', {
      destino: 'C:\\libre\\x.wolfperfil',
      bases: false,
      certificados: false,
      ca: false,
      frase: null,
    });
    expect(r).toMatchObject({ ok: false });
    expect(nucleo.exportarPerfil).not.toHaveBeenCalled();
  });

  it('exportar con el destino de un diálogo pasa las opciones tal cual', async () => {
    const { llamar, nucleo, elegidas } = montar();
    const destino = path.join(os.tmpdir(), 'entorno.wolfperfil');
    elegidas.registrar(destino, 'guardar');
    const r = (await llamar('perfiles.exportar', {
      destino,
      bases: true,
      certificados: false,
      ca: true,
      frase: FRASE,
    })) as { ok: boolean; valor: { archivo: string } };
    expect(r.ok).toBe(true);
    expect(nucleo.exportarPerfil).toHaveBeenCalledWith({
      destino: path.resolve(destino),
      bases: true,
      certificados: false,
      ca: true,
      frase: FRASE,
    });
  });

  it('un error del núcleo nunca devuelve la frase', async () => {
    const { llamar, nucleo, elegidas } = montar();
    const destino = path.join(os.tmpdir(), 'entorno.wolfperfil');
    elegidas.registrar(destino, 'guardar');
    nucleo.exportarPerfil.mockRejectedValueOnce(new Error(`falló con ${FRASE} dentro`));
    const r = await llamar('perfiles.exportar', {
      destino,
      bases: true,
      certificados: false,
      ca: false,
      frase: FRASE,
    });
    expect(JSON.stringify(r)).not.toContain(FRASE);
    expect(r).toMatchObject({ ok: false });
  });

  it('importar guarda las claves nuevas en el almacén (bd:<sitio>) y no las devuelve', async () => {
    const { llamar, nucleo, elegidas, guardados } = montar();
    const dir = mkdtempSync(path.join(os.tmpdir(), 'pel-perfiles-imp-'));
    try {
      const archivo = path.join(dir, 'p.wolfperfil');
      writeFileSync(archivo, 'x');
      elegidas.registrar(archivo);
      const r = await llamar('perfiles.importar', archivo, {
        rutas: {},
        huella: HUELLA,
        confirmado: true,
        frase: FRASE,
      });
      expect(r).toEqual({ ok: true, valor: { sitios: [] } });
      expect(guardados).toEqual([['bd:tienda', 'clave-nueva-de-prueba']]);
      expect(JSON.stringify(r)).not.toContain('clave-nueva-de-prueba');
      const [a, o] = nucleo.importarPerfil.mock.calls[0] as unknown as [string, { frase: string }];
      expect(a).toBe(archivo);
      expect(o.frase).toBe(FRASE);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('importar con un archivo que no salió de un diálogo no llama al núcleo', async () => {
    const { llamar, nucleo } = montar();
    const r = await llamar('perfiles.importar', 'C:\\libre\\p.wolfperfil', {
      rutas: {},
      huella: HUELLA,
      confirmado: true,
    });
    expect(r).toMatchObject({ ok: false });
    expect(nucleo.importarPerfil).not.toHaveBeenCalled();
  });

  it('la instantánea manual la toma el núcleo con el motivo "manual"', async () => {
    const { llamar, nucleo } = montar();
    await llamar('perfiles.instantanea');
    expect(nucleo.instantaneaEntorno).toHaveBeenCalledWith('manual');
  });
});
