import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  ControlMetricas,
  idiomaDeLocale,
  registrarIpc,
  Seguimientos,
  type IpcMainLike,
  type NucleoIpc,
  type VentanaLike,
} from '../src/main/ipc';
import { ErrorWolf, PUERTO_ADMINER as PUERTO_ADMINER_NUCLEO } from '@pel/core';
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
        // Etapa B
        'detectarCarpetaProyecto',
        'leerConfigProyecto',
        'guardarConfigProyecto',
        'recetaPropuesta',
        'ejecutarReceta',
        'omitirPasoReceta',
        'estadoReceta',
        'cancelarReceta',
        'resumenReceta',
        'disponibilidadGit',
        'clonarRepo',
        'estadoGit',
        'traerCambios',
        'reposGithub',
        'instalarGh',
        'iniciarSesionGh',
        'runtimesInstalados',
        'runtimesProyecto',
        'iniciarProceso',
        'detenerProceso',
        'estadosProcesos',
        'sugerenciasProyectos',
        'cambiarCarpetaVigilada',
        'iniciarMetricas',
        'pausarMetricas',
        'ultimasMetricas',
        'leerRegistro',
        'carpetaRegistro',
        'puertosEnUso',
        'finalizarProceso',
        'limpiarBom',
        'emitirCertificadoLibre',
        'entornoSistema',
        'estadoMcp',
        'iniciarMcp',
        'detenerMcp',
        'cambiarPuertoMcp',
        'configuracionMcp',
        'regenerarTokenMcp',
        'responderConfirmacionMcp',
        'crearSitioProyecto',
        'confiarReceta',
        'abrirEditor',
      ].map((m) => [m, vi.fn(async () => undefined)]),
    ),
    fuentesRegistro: vi.fn(async () => [
      { id: 'nginx', nombre: 'Nginx', grupo: 'nginx' },
      { id: 'sitio:s1:error', nombre: 'Errores', grupo: 'sitio', sitioId: 's1' },
    ]),
    seguirRegistro: vi.fn(async () => vi.fn()),
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
  guardarArchivo: vi.fn(async (): Promise<string | null> => null),
  elegirArchivos: vi.fn(async (): Promise<string[]> => []),
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
    expect(crudo.hosts.sincronizar).toHaveBeenCalledWith(['a.test', 'b.test', 'c.test'], {
      reintentar: true,
    });
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
      'aviso:abrir',
      'aviso:inicio',
      'aviso:nuevo',
      'bd:progreso',
      'git:progreso',
      'hosts:estado',
      'ia:progreso',
      'instalacion:progreso',
      'mcp:confirmacion-cerrada',
      'mcp:confirmar',
      'metricas:muestra',
      'proyectos:sugerencias',
      'receta:progreso',
      'registro:lineas',
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
  it('registra exactamente la lista de rutas de las etapas A y B', () => {
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
        // Etapa B
        'sistema.guardarArchivo',
        'sistema.elegirArchivos',
        'sistema.abrirEditor',
        'avisos.lista',
        'avisos.marcarLeidos',
        'avisos.limpiar',
        'avisos.configurar',
        'proyectos.detectar',
        'proyectos.configLeer',
        'proyectos.configGuardar',
        'proyectos.recetaPorDefecto',
        'proyectos.ejecutarReceta',
        'proyectos.omitirPaso',
        'proyectos.estadoReceta',
        'proyectos.cancelarReceta',
        'proyectos.resumenReceta',
        'proyectos.crearSitio',
        'proyectos.confiar',
        'git.disponible',
        'git.clonar',
        'git.estado',
        'git.traerCambios',
        'github.repos',
        'github.guardarToken',
        'github.borrarToken',
        'github.hayToken',
        'github.instalarGh',
        'github.iniciarSesionGh',
        'runtimes.instalados',
        'runtimes.proyecto',
        'procesos.iniciar',
        'procesos.detener',
        'procesos.estados',
        'preferencias.leer',
        'preferencias.guardar',
        'vigilar.sugerencias',
        'vigilar.cambiarCarpeta',
        'metricas.iniciar',
        'metricas.pausar',
        'metricas.ultimos',
        'registros.fuentes',
        'registros.seguir',
        'registros.dejar',
        'registros.leerFinal',
        'registros.abrirCarpeta',
        'herramientas.puertos',
        'herramientas.finalizarProceso',
        'herramientas.limpiarBom',
        'herramientas.emitirCertificado',
        'herramientas.entorno',
        'mcp.estado',
        'mcp.iniciar',
        'mcp.detener',
        'mcp.cambiarPuerto',
        'mcp.configuracion',
        'mcp.regenerarToken',
        'mcp.responderConfirmacion',
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
        ['bd.crear', ['mysql', 'x', { usuario: 'u', clave: 'c', cambiarClave: 'si' }]],
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

  it('un ErrorWolf lleva su código y solo los datos que el código declara', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    crudo.sitios.listar.mockRejectedValueOnce(
      new ErrorWolf('servicios.puerto_asignado', 'El puerto 80 ya está asignado a PHP.', {
        puerto: 80,
        otro: 'PHP',
        clave: 'CENTINELA-SECRETO',
        ruta: 'C:/Users/x/secreto',
      }),
    );
    crudo.sitios.listar.mockRejectedValueOnce(
      Object.assign(new Error('x'), {
        codigo: 'codigo.inventado',
        datos: { clave: 'CENTINELA-SECRETO' },
      }),
    );
    crudo.sitios.listar.mockRejectedValueOnce(
      new ErrorWolf('git.cambios_locales', 'Hay cambios.', { clave: 'CENTINELA-SECRETO' }),
    );
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (): Promise<unknown> =>
      Promise.resolve(canales.get('entorno:sitios.listar')!({}));
    const a = await llamar();
    expect(a).toEqual({
      ok: false,
      error: {
        mensaje: 'El puerto 80 ya está asignado a PHP.',
        codigo: 'servicios.puerto_asignado',
        datos: { puerto: 80, otro: 'PHP' },
      },
    });
    const b = await llamar();
    const c = await llamar();
    expect(JSON.stringify([a, b, c])).not.toContain('CENTINELA');
    expect((c as { error: object }).error).not.toHaveProperty('datos');
  });

  it('un ErrorWolf conserva código y datos al pasar por el enmascarado de la clave', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    f['importarBase']!.mockRejectedValueOnce(
      new ErrorWolf('bd.encender_servicio', 'Encienda clave-x para administrar sus bases', {
        nombre: 'clave-x',
      }),
    );
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const origen = { host: 'h', puerto: 3306, usuario: 'root', clave: 'clave-x', base: 'd' };
    const r = await canales.get('entorno:bd.importar')!({}, 'mysql', origen, 'd');
    expect(r).toEqual({
      ok: false,
      error: {
        mensaje: 'Encienda *** para administrar sus bases',
        codigo: 'bd.encender_servicio',
        datos: { nombre: '***' },
      },
    });
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

describe('IPC de la Etapa B', () => {
  const TOKEN = 'ghp_TokenFalsoDePrueba1234567890';
  const temporales: string[] = [];
  const temporal = (): string => {
    const d = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    temporales.push(d);
    return d;
  };
  afterEach(() => {
    for (const d of temporales.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  function secretosFalsos(token: string | null = TOKEN) {
    let guardado = token;
    return {
      guardarTokenGithub: vi.fn(async (t: string) => {
        guardado = t;
      }),
      leerTokenGithub: vi.fn(async () => guardado),
      borrarTokenGithub: vi.fn(async () => {
        guardado = null;
      }),
      hayTokenGithub: vi.fn(() => guardado !== null),
    };
  }

  function montar(o: { secretos?: ReturnType<typeof secretosFalsos>; sinVigilada?: string } = {}) {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo, oyentes } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    // Carpeta de proyectos (la vigilada): los clones van directo dentro de ella.
    const proyectos = temporal();
    crudo.config.leer.mockResolvedValue({
      proyectos: { carpetaVigilada: o.sinVigilada === undefined ? proyectos : null },
    });
    const secretos = o.secretos ?? secretosFalsos();
    const seguimientos = new Seguimientos();
    const metricas = new ControlMetricas(nucleo);
    const { ventana, enviados } = ventanaFalsa();
    const baja = registrarIpc(nucleo, ipcMain, ventana, sistema, () => true, undefined, {
      secretos,
      seguimientos,
      metricas,
      ...(o.sinVigilada === undefined ? {} : { carpetaProyectosPorDefecto: o.sinVigilada }),
    });
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string };
      };
    const llamarDesde = async (evento: unknown, ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!(evento, ...args)) as { ok: boolean };
    return {
      f,
      crudo,
      proyectos,
      oyentes,
      secretos,
      seguimientos,
      metricas,
      enviados,
      baja,
      llamar,
      llamarDesde,
    };
  }

  it('rechaza argumentos inválidos de cada familia sin llamar al núcleo', async () => {
    const { f, llamar } = montar();
    const largo = 'x'.repeat(5000);
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    try {
      for (const [ruta, args] of [
        ['proyectos.detectar', [42]],
        ['proyectos.detectar', [path.join(carpeta, 'no-existe')]],
        ['proyectos.configLeer', [null]],
        ['proyectos.configGuardar', ['', {}]],
        ['proyectos.configGuardar', ['s1', 'no-objeto']],
        ['proyectos.configGuardar', ['s1', { env: { A: largo.repeat(20) } }]],
        ['proyectos.recetaPorDefecto', [{}]],
        ['proyectos.ejecutarReceta', [42]],
        ['proyectos.ejecutarReceta', ['s1', { desde: '' }]],
        ['proyectos.ejecutarReceta', ['s1', { receta: 'x' }]],
        ['proyectos.ejecutarReceta', ['s1', { receta: [{ id: 'a', tipo: 'rm-rf', titulo: '' }] }]],
        [
          'proyectos.ejecutarReceta',
          [
            's1',
            {
              receta: Array.from({ length: 51 }, (_, i) => ({
                id: `p${i}`,
                tipo: 'comando',
                titulo: 't',
              })),
            },
          ],
        ],
        ['proyectos.omitirPaso', ['s1', largo]],
        ['proyectos.ejecutarReceta', ['s1', { suelta: 'si' }]],
        ['proyectos.ejecutarReceta', ['s1', { guardada: 1 }]],
        ['proyectos.crearSitio', ['no-objeto', []]],
        ['proyectos.crearSitio', [{ nombre: 'x' }, 'x']],
        ['proyectos.crearSitio', [{ nombre: 'x' }, [{ id: 'a', tipo: 'rm-rf', titulo: '' }]]],
        ['proyectos.confiar', [largo]],
        ['sistema.abrirEditor', ['C:\\Windows']],
        ['sistema.abrirEditor', [42]],
        ['proyectos.estadoReceta', ['a\nb']],
        ['proyectos.cancelarReceta', [undefined]],
        ['proyectos.resumenReceta', [largo]],
        ['git.clonar', ['file:///c:/repo', 'C:\\Proyectos\\x']],
        ['git.clonar', ['https://github.com/a/b.git', 'relativa\\x']],
        ['git.clonar', ['--upload-pack=malo', 'C:\\Proyectos\\x']],
        ['git.clonar', ['https://usuario:clave@github.com/a/b.git', 'C:\\Proyectos\\x']],
        ['git.clonar', [`https://github.com/${largo}`, 'C:\\Proyectos\\x']],
        ['git.estado', [{}]],
        ['git.traerCambios', ['']],
        ['github.repos', ['no-objeto']],
        ['github.repos', [{ pagina: 0 }]],
        ['github.repos', [{ buscar: largo }]],
        ['github.guardarToken', ['']],
        ['github.guardarToken', [largo]],
        ['runtimes.instalados', ['php']],
        ['runtimes.proyecto', [3]],
        ['procesos.iniciar', ['s1', '']],
        ['procesos.detener', [null, 'web']],
        ['procesos.estados', ['']],
        ['vigilar.cambiarCarpeta', [carpeta]],
        ['vigilar.cambiarCarpeta', [42]],
        ['metricas.ultimos', [6]],
        ['metricas.ultimos', ['5']],
        ['registros.seguir', ['']],
        ['registros.seguir', ['no-existe']],
        ['registros.leerFinal', ['nginx', 5001]],
        ['registros.abrirCarpeta', [42]],
        ['herramientas.finalizarProceso', [0, 'x']],
        ['herramientas.finalizarProceso', [1.5, 'x']],
        ['herramientas.finalizarProceso', [1234, '']],
        ['herramientas.finalizarProceso', [1234, 'node.exe', { forzar: 'si' }]],
        ['herramientas.limpiarBom', [[path.join(carpeta, 'a.php')], true]],
        ['herramientas.limpiarBom', [[], true]],
        ['herramientas.limpiarBom', [['x'], 'true']],
        ['herramientas.emitirCertificado', [['a.test'], path.join(carpeta, 'a.crt')]],
        ['herramientas.emitirCertificado', [[], path.join(carpeta, 'a.crt')]],
        ['mcp.cambiarPuerto', [80]],
        ['mcp.responderConfirmacion', ['', true]],
        ['mcp.responderConfirmacion', ['abc', 'si']],
        ['sistema.guardarArchivo', [largo]],
      ] as [string, unknown[]][]) {
        const r = await llamar(ruta, ...args);
        expect(r.ok, `${ruta} ${JSON.stringify(args).slice(0, 80)}`).toBe(false);
      }
      for (const m of [
        'detectarCarpetaProyecto',
        'leerConfigProyecto',
        'guardarConfigProyecto',
        'recetaPropuesta',
        'ejecutarReceta',
        'omitirPasoReceta',
        'estadoReceta',
        'cancelarReceta',
        'resumenReceta',
        'clonarRepo',
        'estadoGit',
        'traerCambios',
        'reposGithub',
        'runtimesInstalados',
        'runtimesProyecto',
        'iniciarProceso',
        'detenerProceso',
        'estadosProcesos',
        'cambiarCarpetaVigilada',
        'ultimasMetricas',
        'seguirRegistro',
        'leerRegistro',
        'carpetaRegistro',
        'finalizarProceso',
        'limpiarBom',
        'emitirCertificadoLibre',
        'cambiarPuertoMcp',
        'responderConfirmacionMcp',
      ]) {
        expect(f[m], m).not.toHaveBeenCalled();
      }
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('pasa los argumentos validados al núcleo', async () => {
    const { f, crudo, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    try {
      crudo.sitios.listar.mockResolvedValue([{ id: 's1', carpeta }] as never);
      expect((await llamar('proyectos.detectar', carpeta)).ok).toBe(true);
      expect(f['detectarCarpetaProyecto']).toHaveBeenCalledWith(path.resolve(carpeta));
      expect((await llamar('proyectos.configGuardar', 's1', { version: 1 })).ok).toBe(true);
      expect(f['guardarConfigProyecto']).toHaveBeenCalledWith(carpeta, { version: 1 });
      await llamar('proyectos.ejecutarReceta', 's1', { soloPaso: 'migrar', otra: 'x' });
      expect(f['ejecutarReceta']).toHaveBeenCalledWith('s1', { soloPaso: 'migrar' });
      await llamar('procesos.iniciar', 's1', 'web');
      expect(f['iniciarProceso']).toHaveBeenCalledWith('s1', 'web');
      await llamar('runtimes.instalados', 'node');
      expect(f['runtimesInstalados']).toHaveBeenCalledWith('node');
      await llamar('registros.leerFinal', 'nginx');
      expect(f['leerRegistro']).toHaveBeenCalledWith('nginx', 500);
      await llamar('herramientas.finalizarProceso', 4321, 'node.exe', {
        forzar: true,
        creado: '133000000000000000',
      });
      expect(f['finalizarProceso']).toHaveBeenCalledWith(4321, 'node.exe', {
        forzar: true,
        creado: '133000000000000000',
      });
      await llamar('mcp.responderConfirmacion', 'c1', false);
      expect(f['responderConfirmacionMcp']).toHaveBeenCalledWith('c1', false);
      await llamar('vigilar.cambiarCarpeta', null);
      expect(f['cambiarCarpetaVigilada']).toHaveBeenCalledWith(null);
      // Node y Python se instalan desde el catálogo como los demás.
      for (const servicio of ['node', 'python']) {
        const r = await llamar('instalador.instalar', { servicio, version: '1.28.0' });
        expect(r.ok, servicio).toBe(true);
        expect((await llamar('instalador.instalados', servicio)).ok, servicio).toBe(true);
      }
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('el archivo de bd-restaurar de una receta debe venir de un diálogo', async () => {
    const { f, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    const archivo = path.join(carpeta, 'respaldo.sql');
    writeFileSync(archivo, 'select 1;');
    const receta = [
      { id: 'bd-restaurar', tipo: 'bd-restaurar', titulo: 'Restaurar', args: { archivo } },
    ];
    try {
      const r = await llamar('proyectos.ejecutarReceta', 's1', { receta });
      expect(r.error?.mensaje).toBe('Elija el archivo desde el diálogo');
      expect(f['ejecutarReceta']).not.toHaveBeenCalled();
      sistema.elegirArchivo.mockResolvedValueOnce(archivo);
      await llamar('sistema.elegirArchivo');
      expect((await llamar('proyectos.ejecutarReceta', 's1', { receta })).ok).toBe(true);
      expect(f['ejecutarReceta']).toHaveBeenCalledWith('s1', {
        receta: [expect.objectContaining({ args: { archivo: path.resolve(archivo) } })],
      });
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('el token de GitHub nunca aparece en un resultado ni en un error', async () => {
    const { f, secretos, proyectos, llamar } = montar();
    // El núcleo falso repite todo lo que recibe, también en sus errores.
    const eco = (...a: unknown[]) => JSON.stringify(a);
    f['clonarRepo']!.mockImplementation(async (...a: unknown[]) => {
      throw new Error(`falló el clon: ${eco(...a)}`);
    });
    f['traerCambios']!.mockImplementation(async (...a: unknown[]) => ({ eco: eco(...a) }));
    f['reposGithub']!.mockImplementation(async (...a: unknown[]) => {
      throw Object.assign(new Error(`api: ${eco(...a)}`), { codigo: 'X' });
    });
    const salidas: unknown[] = [];
    salidas.push(
      await llamar('git.clonar', 'https://github.com/a/b.git', path.join(proyectos, 'b')),
    );
    salidas.push(await llamar('git.traerCambios', 's1'));
    salidas.push(await llamar('github.repos', { buscar: 'b' }));
    salidas.push(await llamar('github.hayToken'));
    salidas.push(await llamar('github.guardarToken', TOKEN));
    secretos.guardarTokenGithub.mockRejectedValueOnce(new Error(`no vale ${TOKEN}`));
    salidas.push(await llamar('github.guardarToken', TOKEN));
    for (const s of salidas) expect(JSON.stringify(s)).not.toContain(TOKEN);
    // Pero sí llegó al núcleo, que es quien lo pasa a git y a la API.
    expect(f['clonarRepo']).toHaveBeenCalledWith(
      'https://github.com/a/b.git',
      path.join(proyectos, 'b'),
      TOKEN,
    );
    expect(f['traerCambios']).toHaveBeenCalledWith('s1', TOKEN);
    expect(f['reposGithub']).toHaveBeenCalledWith({ buscar: 'b', token: TOKEN });
    expect(salidas[3]).toEqual({ ok: true, valor: true });
    // traerCambios "devolvió" el token: no se envía.
    expect(salidas[1]).toMatchObject({ ok: false });
  });

  it('sin token guardado, git y GitHub van sin token', async () => {
    const { f, proyectos, llamar } = montar({ secretos: secretosFalsos(null) });
    await llamar('git.clonar', 'owner/repo', path.join(proyectos, 'repo'));
    expect(f['clonarRepo']).toHaveBeenCalledWith('owner/repo', path.join(proyectos, 'repo'), null);
    await llamar('github.repos');
    expect(f['reposGithub']).toHaveBeenCalledWith({});
    expect(await llamar('github.hayToken')).toEqual({ ok: true, valor: false });
  });

  it('mcp.configuracion copia al portapapeles y no devuelve el token del MCP', async () => {
    const { f, llamar } = montar();
    f['configuracionMcp']!.mockResolvedValueOnce('{"token":"secreto-mcp"}');
    const r = await llamar('mcp.configuracion');
    expect(r).toEqual({ ok: true });
    expect(sistema.copiar).toHaveBeenCalledWith('{"token":"secreto-mcp"}');
  });

  it('los registros seguidos se sueltan con dejar, al destruir la ventana y al borrar el sitio', async () => {
    const { crudo, seguimientos, llamarDesde, baja } = montar();
    const dejar = vi.fn();
    crudo.seguirRegistro.mockResolvedValue(dejar);
    let destruido: () => void = () => undefined;
    const sender = { once: (_e: string, fn: () => void) => void (destruido = fn) };
    const ev = { sender };
    expect((await llamarDesde(ev, 'registros.seguir', 'nginx')).ok).toBe(true);
    await llamarDesde(ev, 'registros.seguir', 'nginx');
    expect(crudo.seguirRegistro).toHaveBeenCalledTimes(1);
    await llamarDesde(ev, 'registros.dejar', 'nginx');
    await vi.waitFor(() => expect(dejar).toHaveBeenCalledTimes(1));

    await llamarDesde(ev, 'registros.seguir', 'nginx');
    await llamarDesde(ev, 'registros.seguir', 'sitio:s1:error');
    expect(seguimientos.cuantas(sender)).toBe(2);
    await llamarDesde(ev, 'sitios.borrar', 's1');
    expect(seguimientos.cuantas(sender)).toBe(1);
    await vi.waitFor(() => expect(dejar).toHaveBeenCalledTimes(2));
    destruido();
    expect(seguimientos.cuantas(sender)).toBe(0);
    await vi.waitFor(() => expect(dejar).toHaveBeenCalledTimes(3));

    await llamarDesde(ev, 'registros.seguir', 'nginx');
    baja();
    await vi.waitFor(() => expect(dejar).toHaveBeenCalledTimes(4));
  });

  it('las métricas solo corren pedidas y con la ventana visible', async () => {
    const { f, metricas, llamar } = montar();
    await llamar('metricas.iniciar');
    expect(f['iniciarMetricas']).toHaveBeenCalledTimes(1);
    metricas.visibilidad(false);
    expect(f['pausarMetricas']).toHaveBeenCalledTimes(1);
    metricas.visibilidad(true);
    expect(f['iniciarMetricas']).toHaveBeenCalledTimes(2);
    await llamar('metricas.pausar');
    metricas.visibilidad(false);
    metricas.visibilidad(true);
    // Sin pedido, mostrar la ventana no reanuda.
    expect(f['iniciarMetricas']).toHaveBeenCalledTimes(2);
  });

  it('emitirCertificado guarda los PEM en la ruta del diálogo y nunca pisa una clave', async () => {
    const { f, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    const crt = path.join(carpeta, 'mi.test.crt');
    f['emitirCertificadoLibre']!.mockResolvedValue({ certPem: 'CERT', clavePem: 'CLAVE' });
    try {
      sistema.guardarArchivo.mockResolvedValueOnce(crt);
      expect(await llamar('sistema.guardarArchivo', 'mi.test.crt')).toEqual({
        ok: true,
        valor: crt,
      });
      const r = await llamar('herramientas.emitirCertificado', ['mi.test'], crt);
      expect(r).toEqual({
        ok: true,
        valor: { certificado: crt, clave: path.join(carpeta, 'mi.test.key') },
      });
      expect(readFileSync(crt, 'utf8')).toBe('CERT');
      expect(readFileSync(path.join(carpeta, 'mi.test.key'), 'utf8')).toBe('CLAVE');
      expect(JSON.stringify(r)).not.toContain('CLAVE');
      const otra = await llamar('herramientas.emitirCertificado', ['mi.test'], crt);
      expect(otra.error?.mensaje).toMatch(/Ya existe/);
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('limpiarBom solo acepta rutas elegidas en diálogos', async () => {
    const { f, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcb-'));
    const a = path.join(carpeta, 'a.php');
    try {
      sistema.elegirArchivos.mockResolvedValueOnce([a]);
      await llamar('sistema.elegirArchivos');
      expect((await llamar('herramientas.limpiarBom', [a], true)).ok).toBe(true);
      expect(f['limpiarBom']).toHaveBeenCalledWith([a], true);
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('herramientas.entorno devuelve lo del núcleo', async () => {
    const { f, llamar } = montar();
    const entorno = {
      path: ['C:\\x'],
      herramientas: [{ nombre: 'git', versiones: ['2.47.1'] }],
      variables: [{ nombre: 'API_KEY', valor: '••••••••', enmascarada: true }],
    };
    f['entornoSistema']!.mockResolvedValue(entorno);
    const r = await llamar('herramientas.entorno');
    expect(r.ok).toBe(true);
    expect(r.valor).toEqual(entorno);
    expect(f['entornoSistema']).toHaveBeenCalledTimes(1);
  });

  it('git.clonar solo clona dentro de la carpeta de proyectos o de una elegida, y en vacío', async () => {
    const { f, proyectos, llamar } = montar();
    // Directo en la carpeta de proyectos: vale.
    expect((await llamar('git.clonar', 'owner/a', path.join(proyectos, 'a'))).ok).toBe(true);
    // Más adentro, o en otra carpeta cualquiera: no.
    const r1 = await llamar('git.clonar', 'owner/a', path.join(proyectos, 'x', 'a'));
    expect(r1.error?.mensaje).toMatch(/carpeta de proyectos/);
    const otra = temporal();
    const r2 = await llamar('git.clonar', 'owner/a', path.join(otra, 'a'));
    expect(r2.error?.mensaje).toMatch(/carpeta de proyectos/);
    // Elegida en el diálogo: vale.
    sistema.elegirCarpeta.mockResolvedValueOnce(otra);
    await llamar('sistema.elegirCarpeta');
    expect((await llamar('git.clonar', 'owner/a', path.join(otra, 'a'))).ok).toBe(true);
    // El destino no debe existir o debe estar vacío.
    mkdirSync(path.join(proyectos, 'vacia'));
    expect((await llamar('git.clonar', 'owner/a', path.join(proyectos, 'vacia'))).ok).toBe(true);
    mkdirSync(path.join(proyectos, 'llena'));
    writeFileSync(path.join(proyectos, 'llena', 'x.txt'), 'x');
    const r3 = await llamar('git.clonar', 'owner/a', path.join(proyectos, 'llena'));
    expect(r3.error?.mensaje).toMatch(/no está vacía/);
    expect(f['clonarRepo']).toHaveBeenCalledTimes(3);
  });

  it('sin carpeta vigilada, clonar en la carpeta por defecto la crea si falta (solo esa)', async () => {
    const raiz = temporal();
    const defecto = path.join(raiz, 'Proyectos');
    const { f, llamar } = montar({ sinVigilada: defecto });
    expect(existsSync(defecto)).toBe(false);
    expect((await llamar('git.clonar', 'owner/a', path.join(defecto, 'a'))).ok).toBe(true);
    expect(existsSync(defecto)).toBe(true);
    expect(f['clonarRepo']!.mock.calls[0]!.slice(0, 2)).toEqual([
      'owner/a',
      path.join(defecto, 'a'),
    ]);
    // Otra carpeta que no existe no se crea.
    const otra = path.join(raiz, 'Otra');
    const r = await llamar('git.clonar', 'owner/a', path.join(otra, 'a'));
    expect(r.ok).toBe(false);
    expect(existsSync(otra)).toBe(false);
  });

  it('proyectos.crearSitio, proyectos.confiar y opciones guardada/suelta llegan al núcleo', async () => {
    const { f, llamar } = montar();
    const receta = [
      { id: 'sitio-crear', tipo: 'sitio-crear', titulo: '', args: { tipo: 'fastapi' } },
    ];
    expect((await llamar('proyectos.crearSitio', { nombre: 'Bot' }, receta)).ok).toBe(true);
    expect(f['crearSitioProyecto']).toHaveBeenCalledWith({ nombre: 'Bot' }, receta);
    expect((await llamar('proyectos.confiar', 's1')).ok).toBe(true);
    expect(f['confiarReceta']).toHaveBeenCalledWith('s1');
    expect((await llamar('proyectos.ejecutarReceta', 's1', { guardada: true })).ok).toBe(true);
    expect(f['ejecutarReceta']).toHaveBeenLastCalledWith('s1', { guardada: true });
    const suelta = [{ id: 'migrar', tipo: 'migrar', titulo: '' }];
    await llamar('proyectos.ejecutarReceta', 's1', { receta: suelta, suelta: true });
    expect(f['ejecutarReceta']).toHaveBeenLastCalledWith('s1', { receta: suelta, suelta: true });
  });

  it('sistema.abrirEditor abre la carpeta del sitio por su id (nunca una ruta)', async () => {
    const { f, llamar } = montar();
    expect((await llamar('sistema.abrirEditor', 's1')).ok).toBe(true);
    expect(f['abrirEditor']).toHaveBeenCalledWith('s1');
    f['abrirEditor']!.mockRejectedValueOnce(new Error('No se encontró Visual Studio Code.'));
    expect((await llamar('sistema.abrirEditor', 's1')).error?.mensaje).toMatch(/Visual Studio/);
  });

  it('si el token guardado no se puede leer, sigue sin token y lo dice si algo falla', async () => {
    const secretos = secretosFalsos();
    secretos.leerTokenGithub.mockRejectedValue(new Error('No se pudo descifrar'));
    const { f, proyectos, llamar } = montar({ secretos });
    // Un repo público funciona igual.
    expect((await llamar('git.clonar', 'owner/a', path.join(proyectos, 'a'))).ok).toBe(true);
    expect(f['clonarRepo']).toHaveBeenLastCalledWith('owner/a', path.join(proyectos, 'a'), null);
    // Uno privado falla por autenticación: el error lo explica.
    f['traerCambios']!.mockRejectedValueOnce(new Error('Authentication failed'));
    const r = await llamar('git.traerCambios', 's1');
    expect(r.error?.mensaje).toContain('Authentication failed');
    expect(r.error?.mensaje).toContain('el token guardado no se pudo leer; vuelva a guardarlo');
  });

  it('los seguimientos aguantan llamadas simultáneas: un oyente y el tope de 16', async () => {
    const { crudo, seguimientos, llamarDesde } = montar();
    const ids = Array.from({ length: 20 }, (_, i) => `f${i}`);
    crudo.fuentesRegistro.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 1));
      return ids.map((id) => ({ id, nombre: id, grupo: 'nginx' }));
    });
    const once = vi.fn();
    const ev = { sender: { once } };
    const r = await Promise.all(
      [...ids, 'f0', 'f0', 'f1'].map((id) => llamarDesde(ev, 'registros.seguir', id)),
    );
    expect(once).toHaveBeenCalledTimes(1);
    expect(seguimientos.cuantas(ev.sender)).toBe(16);
    expect(crudo.seguirRegistro).toHaveBeenCalledTimes(16);
    expect(r.filter((x) => !x.ok)).toHaveLength(4);
  });

  it('las rutas de guardar y las de abrir no se mezclan', async () => {
    const { f, llamar } = montar();
    const carpeta = temporal();
    const abierto = path.join(carpeta, 'a.php');
    const guardado = path.join(carpeta, 'b.crt');
    sistema.elegirArchivo.mockResolvedValueOnce(abierto);
    await llamar('sistema.elegirArchivo');
    sistema.guardarArchivo.mockResolvedValueOnce(guardado);
    await llamar('sistema.guardarArchivo', 'b.crt');
    // Un archivo elegido para abrir no sirve de destino, ni uno de guardar para leer.
    expect((await llamar('herramientas.emitirCertificado', ['a.test'], abierto)).ok).toBe(false);
    expect((await llamar('herramientas.limpiarBom', [guardado], true)).ok).toBe(false);
    expect((await llamar('bd.formato', guardado)).ok).toBe(false);
    expect(f['emitirCertificadoLibre']).not.toHaveBeenCalled();
    expect(f['limpiarBom']).not.toHaveBeenCalled();
  });

  it('emitirCertificado borra la clave si no pudo escribir el certificado', async () => {
    const { f, llamar } = montar();
    const carpeta = temporal();
    // El destino es una carpeta: escribir el .crt falla después de escribir el .key.
    const crt = path.join(carpeta, 'malo.crt');
    mkdirSync(crt);
    f['emitirCertificadoLibre']!.mockResolvedValue({ certPem: 'CERT', clavePem: 'CLAVE' });
    sistema.guardarArchivo.mockResolvedValueOnce(crt);
    await llamar('sistema.guardarArchivo', 'malo.crt');
    const r = await llamar('herramientas.emitirCertificado', ['mi.test'], crt);
    expect(r.ok).toBe(false);
    expect(existsSync(path.join(carpeta, 'malo.key'))).toBe(false);
  });

  it('la lista de rutas compartida coincide con la tabla del proceso principal', () => {
    expect(new Set(RUTAS_IPC).size).toBe(RUTAS_IPC.length);
  });
});

describe('preferencias de la interfaz', () => {
  it('idiomaDeLocale: español para es, es-419, es_AR; inglés para lo demás', () => {
    expect(idiomaDeLocale('es')).toBe('es');
    expect(idiomaDeLocale('es-419')).toBe('es');
    expect(idiomaDeLocale('ES_ar')).toBe('es');
    expect(idiomaDeLocale('en-US')).toBe('en');
    expect(idiomaDeLocale('pt-BR')).toBe('en');
    expect(idiomaDeLocale('estonian')).toBe('en');
    expect(idiomaDeLocale('')).toBe('en');
  });

  it('leer detecta el idioma la primera vez, lo guarda y aplica el tema', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo } = nucleoFalso();
    const base = { tema: 'oscuro', idioma: null, acento: null, asistenteVisto: false };
    const crudo = nucleo as unknown as Record<string, Mock>;
    crudo['preferenciasUi'] = vi.fn(async () => base);
    crudo['guardarPreferenciasUi'] = vi.fn(async (c: object) => ({ ...base, ...c }));
    const aplicarTema = vi.fn();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, undefined, undefined, {
      idiomaSistema: () => 'en-GB',
      aplicarPreferencias: aplicarTema,
    });
    const r = (await canales.get('entorno:preferencias.leer')!({})) as {
      valor: { idioma: string };
    };
    expect(r.valor.idioma).toBe('en');
    expect(crudo['guardarPreferenciasUi']).toHaveBeenCalledWith({ idioma: 'en' });
    expect(aplicarTema).toHaveBeenCalledWith(
      expect.objectContaining({ tema: 'oscuro', idioma: 'en' }),
    );
  });

  it('guardar pasa solo un objeto plano al núcleo y aplica el tema resultante', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo } = nucleoFalso();
    const crudo = nucleo as unknown as Record<string, Mock>;
    crudo['guardarPreferenciasUi'] = vi.fn(async () => ({
      tema: 'claro',
      idioma: 'es',
      acento: null,
      asistenteVisto: true,
    }));
    const aplicarTema = vi.fn();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, undefined, undefined, {
      aplicarPreferencias: aplicarTema,
    });
    const ok = await canales.get('entorno:preferencias.guardar')!({}, { tema: 'claro' });
    expect(ok).toMatchObject({ ok: true });
    expect(aplicarTema).toHaveBeenCalledWith(expect.objectContaining({ tema: 'claro' }));
    const mal = await canales.get('entorno:preferencias.guardar')!({}, 'claro');
    expect(mal).toMatchObject({ ok: false });
  });
});
