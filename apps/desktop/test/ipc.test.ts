import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import { PUERTO_ADMINER as PUERTO_ADMINER_NUCLEO } from '@pel/core';
import { CANAL_EVENTO, PUERTO_ADMINER, RUTAS_IPC } from '../src/shared/api';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function ipcFalso() {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = {
    handle: (canal, fn) => void canales.set(canal, fn as Manejador),
  };
  return { ipcMain, canales };
}

function nucleoFalso() {
  const oyentes = new Map<string, (d: unknown) => void>();
  const crudo = {
    eventos: {
      on: (nombre: string, fn: (d: unknown) => void) => {
        oyentes.set(nombre, fn);
        return () => oyentes.delete(nombre);
      },
    },
    sitios: { listar: vi.fn(async () => [{ id: 's1' }]), aplicar: vi.fn() },
    servicios: { estados: vi.fn(), iniciar: vi.fn(), detener: vi.fn() },
    tuneles: { abrir: vi.fn(), cerrar: vi.fn(), renovar: vi.fn(), estados: vi.fn() },
    instalador: { instalar: vi.fn(), instalados: vi.fn() },
    hosts: { sincronizar: vi.fn(async () => ({ ok: true })) },
    config: { leer: vi.fn() },
    estadoGeneral: vi.fn(),
    guardarAjustes: vi.fn(async () => ({ aplicar: {}, reiniciados: [], errores: [] })),
    detenerTodo: vi.fn(),
    guardarSitio: vi.fn(),
    borrarSitio: vi.fn(),
    detectarProyecto: vi.fn(),
    tomarAvisoInicio: vi.fn().mockReturnValueOnce('aviso').mockReturnValue(null),
    ...Object.fromEntries(
      [
        'cambiarPuertoServicio',
        'borrarDatosServicio',
        'autoIniciarServicio',
        'listarBases',
        'crearBase',
        'borrarBase',
        'conexionBd',
        'bloqueEnvBd',
        'bloqueEnvSitio',
        'carpetaRespaldos',
        'tieneTablas',
        'formatoRespaldo',
        'restaurarBase',
        'respaldarBase',
        'importarBase',
        'estadoPgvector',
        'instalarBuildTools',
        'compilarPgvector',
        'activarVector',
        'estadoHttps',
        'instalarCA',
        'quitarCA',
        'cambiarPuertoHttps',
        'versionComposer',
        'instalarComposer',
        'actualizarComposer',
        'cambiarPhpPorDefecto',
        'abrirTerminal',
        'estadoPathUsuario',
        'cambiarPathUsuario',
        'instalarAdminer',
        'disponibilidadAdminer',
        'urlAdminer',
        'activarFtp',
        'desactivarFtp',
        'regenerarClaveFtp',
        'ftpSoloLectura',
        'credencialesFtp',
        'ftpRedLocal',
        'modelosIa',
        'descargarModelo',
        'cancelarDescargaModelo',
        'borrarModelo',
        'probarModelo',
        'espacioIa',
        'bloqueEnvIa',
        'modelosSugeridos',
        'noLeidosCorreo',
      ].map((m) => [m, vi.fn(async () => undefined)]),
    ),
    listarVersiones: vi.fn(async (servicio: string) => [
      {
        servicio,
        version: '1.28.0',
        url: 'https://nginx.org/download/nginx-1.28.0.zip',
        sha256: 'a'.repeat(64),
        formato: 'zip',
      },
    ]),
  };
  return { nucleo: crudo as unknown as NucleoIpc, crudo, oyentes };
}

const sistema = {
  elegirCarpeta: vi.fn(),
  elegirArchivo: vi.fn(),
  abrirUrl: vi.fn(),
  abrirCarpeta: vi.fn(),
  copiar: vi.fn(),
  version: vi.fn(async () => '1.2.3'),
};

function ventanaFalsa(destruida = false) {
  const enviados: unknown[][] = [];
  const ventana: VentanaLike = {
    isDestroyed: () => destruida,
    webContents: { send: (...a: unknown[]) => void enviados.push(a) },
  };
  return { ventana, enviados };
}

describe('registrarIpc', () => {
  it('una llamada permitida devuelve {ok:true, valor}', async () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = await canales.get('entorno:sitios.listar')!({});
    expect(r).toEqual({ ok: true, valor: [{ id: 's1' }] });
  });

  it('un error del núcleo llega como {ok:false, error:{mensaje}} sin traza', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.sitios.listar.mockRejectedValueOnce(Object.assign(new Error('fallo'), { codigo: 'X' }));
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = await canales.get('entorno:sitios.listar')!({});
    expect(r).toEqual({ ok: false, error: { mensaje: 'fallo', codigo: 'X' } });
    expect(JSON.stringify(r)).not.toContain('stack');
  });

  it('un error síncrono también se serializa', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.estadoGeneral.mockImplementationOnce(() => {
      throw new Error('síncrono');
    });
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect(await canales.get('entorno:estadoGeneral')!({})).toEqual({
      ok: false,
      error: { mensaje: 'síncrono' },
    });
  });

  it('solo registra los canales de la lista blanca', () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect([...canales.keys()].sort()).toEqual(RUTAS_IPC.map((r) => `entorno:${r}`).sort());
    expect(canales.has('entorno:constructor')).toBe(false);
    expect(canales.has('entorno:sitios.crear')).toBe(false);
  });

  it('hosts.sincronizar usa todos los dominios de los sitios', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.sitios.listar.mockResolvedValueOnce([
      { dominio: 'a.test', alias: ['b.test'] },
      { dominio: 'c.test', alias: [] },
    ] as never);
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:hosts.sincronizar')!({});
    expect(crudo.hosts.sincronizar).toHaveBeenCalledWith(['a.test', 'b.test', 'c.test']);
  });

  it('pasa los argumentos al método del núcleo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:servicios.iniciar')!({}, 'nginx');
    expect(crudo.servicios.iniciar).toHaveBeenCalledWith('nginx');
  });

  it('reenvía los eventos del núcleo a la ventana', () => {
    const { ipcMain } = ipcFalso();
    const { nucleo, oyentes } = nucleoFalso();
    const { ventana, enviados } = ventanaFalsa();
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    oyentes.get('servicio:estado')!({ id: 'nginx' });
    expect(enviados).toEqual([
      [CANAL_EVENTO, { nombre: 'servicio:estado', dato: { id: 'nginx' } }],
    ]);
    expect([...oyentes.keys()].sort()).toEqual([
      'aviso:inicio',
      'bd:progreso',
      'hosts:estado',
      'ia:progreso',
      'instalacion:progreso',
      'servicio:estado',
      'sitio:cambio',
      'tunel:estado',
    ]);
  });

  it('no envía a una ventana destruida', () => {
    const { ipcMain } = ipcFalso();
    const { nucleo, oyentes } = nucleoFalso();
    const { ventana, enviados } = ventanaFalsa(true);
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    oyentes.get('tunel:estado')!({});
    expect(enviados).toEqual([]);
  });

  it('valida los argumentos en la frontera', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    for (const [ruta, args] of [
      ['servicios.iniciar', [42]],
      ['servicios.iniciar', ['']],
      ['sitios.guardar', ['no-objeto']],
      ['tuneles.abrir', [{}]],
      ['detectarProyecto', [null]],
      ['sistema.abrirUrl', ['file:///c:/a.exe']],
      ['sistema.abrirCarpeta', [123]],
    ] as [string, unknown[]][]) {
      const r = (await canales.get(`entorno:${ruta}`)!({}, ...args)) as { ok: boolean };
      expect(r.ok, ruta).toBe(false);
    }
    expect(crudo.servicios.iniciar).not.toHaveBeenCalled();
    expect(sistema.abrirUrl).not.toHaveBeenCalled();
    expect(sistema.abrirCarpeta).not.toHaveBeenCalled();
  });

  it('rechaza emisores que no son la ventana principal', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, (e) => e === 'bueno');
    expect(await canales.get('entorno:estadoGeneral')!('malo')).toEqual({
      ok: false,
      error: { mensaje: 'Origen no permitido' },
    });
    expect(crudo.estadoGeneral).not.toHaveBeenCalled();
    await canales.get('entorno:estadoGeneral')!('bueno');
    expect(crudo.estadoGeneral).toHaveBeenCalled();
  });

  it('ajustes.guardar pasa solo puerto y trabajadores validados a Nucleo.guardarAjustes', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = (await canales.get('entorno:ajustes.guardar')!(
      {},
      { puerto: 8080, trabajadores: 3, sitios: [], servicios: {} },
    )) as { ok: boolean };
    expect(r.ok).toBe(true);
    expect(crudo.guardarAjustes).toHaveBeenCalledWith({ puerto: 8080, trabajadores: 3 });
    for (const malo of [
      { puerto: 0, trabajadores: 2 },
      { puerto: 65536, trabajadores: 2 },
      { puerto: '80', trabajadores: 2 },
      { puerto: 80, trabajadores: 9 },
      { puerto: 80, trabajadores: 1.5 },
      null,
    ]) {
      const x = (await canales.get('entorno:ajustes.guardar')!({}, malo)) as { ok: boolean };
      expect(x.ok, JSON.stringify(malo)).toBe(false);
    }
    expect(crudo.guardarAjustes).toHaveBeenCalledTimes(1);
    expect(canales.has('entorno:config.guardar')).toBe(false);
  });

  it('instalador.instalar re-resuelve la versión en el catálogo e ignora url/sha del renderer', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const r = (await canales.get('entorno:instalador.instalar')!(
      {},
      { servicio: 'nginx', version: '1.28.0', url: 'https://malo.example/x.zip', sha256: 'b' },
    )) as { ok: boolean };
    expect(r.ok).toBe(true);
    expect(crudo.listarVersiones).toHaveBeenCalledWith('nginx');
    expect(crudo.instalador.instalar).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://nginx.org/download/nginx-1.28.0.zip',
        sha256: 'a'.repeat(64),
      }),
    );
    for (const malo of [
      { servicio: 'nginx', version: '9.9.9' },
      { servicio: 'composer', version: '1.28.0' },
      { servicio: 'nginx' },
      'nginx',
    ]) {
      const x = (await canales.get('entorno:instalador.instalar')!({}, malo)) as { ok: boolean };
      expect(x.ok, JSON.stringify(malo)).toBe(false);
    }
    expect(crudo.instalador.instalar).toHaveBeenCalledTimes(1);
  });

  it('instalador.instalados solo acepta servicios y herramientas del catálogo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (s: unknown) =>
      canales.get('entorno:instalador.instalados')!({}, s) as Promise<{ ok: boolean }>;
    for (const bueno of ['php', 'mysql', 'composer', 'adminer', 'pgvector-src']) {
      expect((await llamar(bueno)).ok, bueno).toBe(true);
    }
    for (const malo of ['..', '..\\..\\Windows', 'php/../..', 'cualquiera', '', 3, null]) {
      expect((await llamar(malo)).ok, String(malo)).toBe(false);
    }
    expect(crudo.instalador.instalados).toHaveBeenCalledTimes(5);
  });

  it('servicios.detenerTodo usa Nucleo.detenerTodo (cierra túneles primero)', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:servicios.detenerTodo')!({});
    expect(crudo.detenerTodo).toHaveBeenCalled();
  });
  it('registra exactamente la lista de rutas de la Etapa A', () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect([...canales.keys()].map((c) => c.slice('entorno:'.length)).sort()).toEqual(
      [
        'estadoGeneral',
        'carpetaDatos',
        'avisoInicio',
        'sitios.listar',
        'sitios.guardar',
        'sitios.borrar',
        'sitios.aplicar',
        'servicios.estados',
        'servicios.iniciar',
        'servicios.detener',
        'servicios.iniciarTodo',
        'servicios.detenerTodo',
        'servicios.cambiarPuerto',
        'servicios.borrarDatos',
        'servicios.autoIniciar',
        'bd.listar',
        'bd.crear',
        'bd.borrar',
        'bd.conexion',
        'bd.bloqueEnv',
        'bd.bloqueEnvSitio',
        'bd.carpetaRespaldos',
        'bd.tieneTablas',
        'bd.formato',
        'bd.restaurar',
        'bd.respaldar',
        'bd.importar',
        'pgvector.estado',
        'pgvector.instalarBuildTools',
        'pgvector.compilarEInstalar',
        'pgvector.activar',
        'https.estado',
        'https.instalarCA',
        'https.quitarCA',
        'https.cambiarPuerto',
        'composer.version',
        'composer.instalar',
        'composer.actualizar',
        'composer.cambiarPhpPorDefecto',
        'terminal.abrir',
        'path.estado',
        'path.cambiar',
        'adminer.instalar',
        'adminer.disponibilidad',
        'adminer.url',
        'ftp.activar',
        'ftp.desactivar',
        'ftp.regenerarClave',
        'ftp.soloLectura',
        'ftp.credenciales',
        'ftp.redLocal',
        'ia.modelos',
        'ia.descargar',
        'ia.cancelar',
        'ia.borrar',
        'ia.probar',
        'ia.espacioUsado',
        'ia.bloqueEnv',
        'ia.sugeridos',
        'mailpit.noLeidos',
        'instalador.listarVersiones',
        'instalador.instalar',
        'instalador.instalados',
        'tuneles.abrir',
        'tuneles.cerrar',
        'tuneles.renovar',
        'tuneles.estados',
        'hosts.sincronizar',
        'detectarProyecto',
        'config.leer',
        'ajustes.guardar',
        'sistema.elegirCarpeta',
        'sistema.elegirArchivo',
        'sistema.abrirUrl',
        'sistema.abrirCarpeta',
        'sistema.copiar',
        'sistema.version',
      ].sort(),
    );
  });

  it('rechaza argumentos inválidos en cada familia nueva sin llamar al núcleo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipc-'));
    try {
      for (const [ruta, args] of [
        ['servicios.cambiarPuerto', ['mysql', 80]],
        ['servicios.cambiarPuerto', ['nginx', 3308]],
        ['servicios.borrarDatos', ['../etc', 'x']],
        ['servicios.autoIniciar', ['ftp', true]],
        ['servicios.autoIniciar', ['mysql', 'true']],
        ['bd.listar', ['oracle']],
        ['bd.crear', ['postgresql', 'Mayusculas']],
        ['bd.crear', ['mysql', 'a;DROP']],
        ['bd.crear', ['mongodb', 'x', { usuario: 'u' }]],
        ['bd.borrar', ['mysql', 'x', 42]],
        ['bd.conexion', ['redis']],
        ['bd.bloqueEnv', ['mysql', 'x', 'rails']],
        ['bd.tieneTablas', ['mongodb', 'x']],
        ['bd.formato', [path.join(carpeta, 'no-existe.sql')]],
        ['bd.formato', [carpeta]],
        ['bd.restaurar', ['mysql', carpeta, 'x']],
        ['bd.restaurar', ['mongodb', path.join(carpeta, 'a.sql'), 'x']],
        ['bd.respaldar', ['mysql', 'x', path.join(carpeta, 'no-existe')]],
        [
          'bd.importar',
          ['mysql', { host: 'h', puerto: 0, usuario: 'u', clave: 'c', base: 'b' }, 'x'],
        ],
        [
          'bd.importar',
          ['mysql', { host: 'h', puerto: 3306, usuario: 'u', clave: 'c', base: 'b' }, 'x y'],
        ],
        ['pgvector.activar', ['Ventas']],
        ['https.cambiarPuerto', [80]],
        ['https.cambiarPuerto', ['443']],
        ['composer.cambiarPhpPorDefecto', ['8']],
        ['terminal.abrir', ['']],
        ['path.cambiar', ['si']],
        ['adminer.url', ['mysql', 'root; x']],
        ['ftp.activar', [null]],
        ['ftp.soloLectura', ['s1', 'true']],
        ['ftp.redLocal', [1]],
        ['ia.descargar', ['../x']],
        ['ia.cancelar', ['']],
        ['ia.borrar', [{}]],
        ['ia.probar', ['llama3.2', '']],
        ['ia.probar', ['llama3.2', 'a\u0000b']],
        ['instalador.instalar', [{ servicio: 'pgvector-src', version: '1.28.0' }]],
      ] as [string, unknown[]][]) {
        const r = (await canales.get(`entorno:${ruta}`)!({}, ...args)) as { ok: boolean };
        expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      }
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
    for (const m of [
      'cambiarPuertoServicio',
      'borrarDatosServicio',
      'autoIniciarServicio',
      'listarBases',
      'crearBase',
      'borrarBase',
      'conexionBd',
      'bloqueEnvBd',
      'tieneTablas',
      'formatoRespaldo',
      'restaurarBase',
      'respaldarBase',
      'importarBase',
      'activarVector',
      'cambiarPuertoHttps',
      'cambiarPhpPorDefecto',
      'abrirTerminal',
      'cambiarPathUsuario',
      'urlAdminer',
      'activarFtp',
      'ftpSoloLectura',
      'ftpRedLocal',
      'descargarModelo',
      'cancelarDescargaModelo',
      'borrarModelo',
      'probarModelo',
    ]) {
      expect((crudo as unknown as Record<string, Mock>)[m], m).not.toHaveBeenCalled();
    }
  });

  it('pasa los argumentos validados de las rutas nuevas al núcleo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipc-'));
    const archivo = path.join(carpeta, 'Backup-08-10-2026.sql');
    writeFileSync(archivo, 'select 1;');
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as { ok: boolean };
    try {
      // Las rutas de archivo y carpeta solo valen si salieron de los diálogos.
      sistema.elegirArchivo.mockResolvedValueOnce(archivo);
      sistema.elegirCarpeta.mockResolvedValueOnce(carpeta);
      await llamar('sistema.elegirArchivo');
      await llamar('sistema.elegirCarpeta');
      expect((await llamar('servicios.cambiarPuerto', 'mysql', 3308)).ok).toBe(true);
      expect(f['cambiarPuertoServicio']).toHaveBeenCalledWith('mysql', 3308);
      expect((await llamar('servicios.autoIniciar', 'postgresql', true)).ok).toBe(true);
      expect(f['autoIniciarServicio']).toHaveBeenCalledWith('postgresql', true);
      expect(
        (
          await llamar('bd.restaurar', 'postgresql', archivo, 'backup', {
            confirmarSobrescribir: true,
            otra: 'x',
          })
        ).ok,
      ).toBe(true);
      expect(f['restaurarBase']).toHaveBeenCalledWith('postgresql', archivo, 'backup', {
        confirmarSobrescribir: true,
      });
      expect((await llamar('bd.respaldar', 'mysql', 'ventas', carpeta)).ok).toBe(true);
      expect(f['respaldarBase']).toHaveBeenCalledWith('mysql', 'ventas', carpeta);
      expect((await llamar('bd.formato', archivo)).ok).toBe(true);
      expect((await llamar('https.cambiarPuerto', 443)).ok).toBe(true);
      expect((await llamar('composer.cambiarPhpPorDefecto', null)).ok).toBe(true);
      expect((await llamar('ia.descargar', 'qwen2.5-coder:7b')).ok).toBe(true);
      expect(f['descargarModelo']).toHaveBeenCalledWith('qwen2.5-coder:7b');
      expect(await llamar('avisoInicio')).toEqual({ ok: true, valor: 'aviso' });
      // Ya leído: una recarga del renderer no lo vuelve a recibir.
      expect(await llamar('avisoInicio')).toEqual({ ok: true, valor: null });
      expect((await llamar('ia.probar', 'llama3.2', 'línea 1\r\n\tlínea 2')).ok).toBe(true);
      expect(
        (await llamar('instalador.instalar', { servicio: 'mysql', version: '1.28.0' })).ok,
      ).toBe(true);
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('bd.importar nunca devuelve la clave de origen en un error', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    const clave = 'S3creta-#$-clave';
    f['importarBase']!.mockRejectedValueOnce(
      new Error(`Acceso denegado para root con la clave ${clave} en 10.0.0.5`),
    );
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const origen = { host: '10.0.0.5', puerto: 3306, usuario: 'root', clave, base: 'ventas' };
    const r = (await canales.get('entorno:bd.importar')!({}, 'mysql', origen, 'ventas_copia')) as {
      ok: boolean;
      error: { mensaje: string };
    };
    expect(r.ok).toBe(false);
    expect(r.error.mensaje).toContain('***');
    expect(JSON.stringify(r)).not.toContain(clave);
    expect(f['importarBase']).toHaveBeenCalledWith('mysql', origen, 'ventas_copia', undefined);
    // Una clave inválida (con salto de línea) tampoco se repite en el error de validación.
    const mala = 'otra\nclave-secreta';
    const x = await canales.get('entorno:bd.importar')!(
      {},
      'mysql',
      { ...origen, clave: mala },
      'd',
    );
    expect(JSON.stringify(x)).not.toContain('clave-secreta');
  });

  it('un error solo lleva datos estructurados de la lista blanca (respaldoPrevio)', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    const previo = 'C:/Users/x/Documents/WolfCore Dev/Respaldos/d-antes.dump';
    const error = Object.assign(new Error('No se pudo completar la restauración de d.'), {
      codigo: 'tras-reemplazo',
      respaldoPrevio: previo,
      clave: 'secreto-1',
      detalle: { interno: 'secreto-2' },
      cause: new Error('secreto-3'),
    });
    f['restaurarBase']!.mockRejectedValueOnce(error);
    f['importarBase']!.mockRejectedValueOnce(error);
    f['respaldarBase']!.mockRejectedValueOnce(
      Object.assign(new Error('x'), { respaldoPrevio: 'a'.repeat(1025) }),
    );
    f['tieneTablas']!.mockRejectedValueOnce(Object.assign(new Error('y'), { respaldoPrevio: 42 }));
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipc-'));
    const archivo = path.join(carpeta, 'd.dump');
    writeFileSync(archivo, 'PGDMP');
    try {
      sistema.elegirArchivo.mockResolvedValueOnce(archivo);
      await canales.get('entorno:sistema.elegirArchivo')!({});
      const r = await canales.get('entorno:bd.restaurar')!({}, 'postgresql', archivo, 'd', {
        confirmarSobrescribir: true,
      });
      expect(r).toEqual({
        ok: false,
        error: {
          mensaje: 'No se pudo completar la restauración de d.',
          codigo: 'tras-reemplazo',
          datos: { respaldoPrevio: previo },
        },
      });
      expect(JSON.stringify(r)).not.toMatch(/secreto|stack|cause/);
      // Importar (que enmascara la clave) conserva el dato.
      const origen = { host: 'h', puerto: 3306, usuario: 'root', clave: 'k', base: 'd' };
      const i = (await canales.get('entorno:bd.importar')!({}, 'mysql', origen, 'd')) as {
        error: { datos?: unknown };
      };
      expect(i.error.datos).toEqual({ respaldoPrevio: previo });
      // Demasiado largo o de otro tipo: no viaja.
      const largo = (await canales.get('entorno:bd.respaldar')!({}, 'mysql', 'd')) as {
        error: Record<string, unknown>;
      };
      expect(largo.error).not.toHaveProperty('datos');
      const numero = (await canales.get('entorno:bd.tieneTablas')!({}, 'mysql', 'd')) as {
        error: Record<string, unknown>;
      };
      expect(numero.error).not.toHaveProperty('datos');
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('bd.bloqueEnvSitio valida el sitio y pasa al núcleo solo id, motor y base', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    f['bloqueEnvSitio']!.mockResolvedValue('DB_HOST=127.0.0.1\n');
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (...a: unknown[]) => canales.get('entorno:bd.bloqueEnvSitio')!({}, ...a);
    for (const malo of [
      ['', 'mysql', 'tienda'],
      [42, 'mysql', 'tienda'],
      ['x'.repeat(129), 'mysql', 'tienda'],
      ['demo\n', 'mysql', 'tienda'],
      ['demo', 'oracle', 'tienda'],
      ['demo', 'postgresql', 'Tienda'],
    ]) {
      expect(((await llamar(...malo)) as { ok: boolean }).ok).toBe(false);
    }
    expect(f['bloqueEnvSitio']).not.toHaveBeenCalled();
    expect(await llamar('demo', 'mysql', 'tienda', 'C:/otra/carpeta')).toEqual({
      ok: true,
      valor: 'DB_HOST=127.0.0.1\n',
    });
    expect(f['bloqueEnvSitio']).toHaveBeenCalledWith('demo', 'mysql', 'tienda');
    f['carpetaRespaldos']!.mockResolvedValue('D:/Docs/WolfCore Dev/Respaldos');
    expect(await canales.get('entorno:bd.carpetaRespaldos')!({})).toEqual({
      ok: true,
      valor: 'D:/Docs/WolfCore Dev/Respaldos',
    });
  });

  it('reenvía bd:progreso e ia:progreso', () => {
    const { ipcMain } = ipcFalso();
    const { nucleo, oyentes } = nucleoFalso();
    const { ventana, enviados } = ventanaFalsa();
    registrarIpc(nucleo, ipcMain, ventana, sistema);
    oyentes.get('bd:progreso')!({ linea: 'x' });
    oyentes.get('ia:progreso')!({ modelo: 'm' });
    expect(enviados.map((e) => (e[1] as { nombre: string }).nombre)).toEqual([
      'bd:progreso',
      'ia:progreso',
    ]);
  });
});

describe('constantes compartidas', () => {
  it('el puerto de Adminer que muestra la interfaz es el del núcleo', () => {
    expect(PUERTO_ADMINER).toBe(PUERTO_ADMINER_NUCLEO);
  });
  it('las rutas de archivo y carpeta solo aceptan lo elegido en los diálogos', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipc-'));
    const archivo = path.join(carpeta, 'respaldo.sql');
    writeFileSync(archivo, 'select 1;');
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        error?: { mensaje: string };
      };
    try {
      // Existe, pero no salió de un diálogo.
      expect((await llamar('bd.formato', archivo)).error?.mensaje).toBe(
        'Elija el archivo desde el diálogo',
      );
      expect((await llamar('bd.restaurar', 'mysql', archivo, 'x')).error?.mensaje).toBe(
        'Elija el archivo desde el diálogo',
      );
      expect((await llamar('bd.respaldar', 'mysql', 'x', carpeta)).error?.mensaje).toBe(
        'Elija la carpeta desde el diálogo',
      );
      // Un diálogo cancelado no registra nada.
      sistema.elegirArchivo.mockResolvedValueOnce(null);
      expect(await llamar('sistema.elegirArchivo')).toEqual({ ok: true, valor: null });
      expect((await llamar('bd.formato', archivo)).ok).toBe(false);
      expect(f['formatoRespaldo']).not.toHaveBeenCalled();
      expect(f['restaurarBase']).not.toHaveBeenCalled();
      expect(f['respaldarBase']).not.toHaveBeenCalled();
      // Elegido: vale aunque cambien mayúsculas o separadores.
      sistema.elegirArchivo.mockResolvedValueOnce(archivo);
      sistema.elegirCarpeta.mockResolvedValueOnce(carpeta + path.sep);
      expect(await llamar('sistema.elegirArchivo')).toEqual({ ok: true, valor: archivo });
      await llamar('sistema.elegirCarpeta');
      const variante = archivo.toUpperCase().replace(/\\/g, '/');
      expect(
        (await llamar('bd.formato', process.platform === 'win32' ? variante : archivo)).ok,
      ).toBe(true);
      expect((await llamar('bd.respaldar', 'mysql', 'x', carpeta)).ok).toBe(true);
      // Elegido en el diálogo pero ya no existe: lo rechaza archivoExistente.
      rmSync(archivo);
      expect((await llamar('bd.formato', archivo)).error?.mensaje).toBe('El archivo no existe');
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });
});
