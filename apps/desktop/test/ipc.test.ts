import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  ControlMetricas,
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
    programador: {
      vista: vi.fn(async () => []),
      estado: vi.fn(() => ({ corriendo: true, aislado: false, permitido: false })),
      permitirAislado: vi.fn(),
      ejecutarAhora: vi.fn(async () => ({ estado: 'ok' })),
      leerLog: vi.fn(async () => []),
    },
    tareas: {
      guardar: vi.fn(async (_s: string, t: unknown) => t),
      activar: vi.fn(async () => ({})),
      confirmar: vi.fn(async () => ({})),
      borrar: vi.fn(async () => undefined),
      historial: vi.fn(async () => []),
      propuestas: vi.fn(async () => []),
      adoptar: vi.fn(async () => ({})),
      aWolfcoreYml: vi.fn(async () => undefined),
      proximas: vi.fn(() => []),
    },
    workspaces: {
      lista: vi.fn(async () => []),
      estados: vi.fn(async () => ({})),
      guardar: vi.fn(async (w: unknown) => w),
      borrar: vi.fn(async () => undefined),
      iniciar: vi.fn(async () => []),
      detener: vi.fn(async () => []),
    },
    lan: {
      estado: vi.fn(),
      activar: vi.fn(),
      desactivar: vi.fn(),
    },
    caMovil: { abrir: vi.fn(), cerrar: vi.fn() },
    comandoFirewallLan: vi.fn(async () => 'New-NetFirewallRule falso'),
    tuneles: {
      abrir: vi.fn(),
      cerrar: vi.fn(),
      renovar: vi.fn(),
      estados: vi.fn(),
      elegirProveedor: vi.fn(),
      configurarCloudflareNombre: vi.fn(),
      olvidarTunelNombre: vi.fn(),
      recrearTunelNombre: vi.fn(),
      cloudflareNombre: {
        tieneCuenta: vi.fn(() => true),
        conectar: vi.fn(),
        cancelarConexion: vi.fn(),
        desconectar: vi.fn(),
      },
    },
    instalador: { instalar: vi.fn(), instalados: vi.fn() },
    hosts: { sincronizar: vi.fn(async () => ({ ok: true })) },
    ia: {
      proveedores: vi.fn(async () => []),
      proveedor: vi.fn(async (id: string) => ({ id })),
      guardarProveedor: vi.fn(async () => []),
      borrarProveedor: vi.fn(async () => undefined),
      probarConexion: vi.fn(async () => ({ ok: true, latenciaMs: 1, modelos: [] })),
      probarMensaje: vi.fn(async () => ({ texto: 'ok', latenciaMs: 1 })),
      previsualizarEnv: vi.fn(async () => ({ bloque: '', gitignore: {}, existeEnv: false })),
      escribirEnv: vi.fn(async () => ({
        respaldo: false,
        conflictos: [],
        gitignoreAgregado: false,
      })),
      sitiosConRespaldosDeClave: vi.fn(async () => []),
      limpiarRespaldosDeClave: vi.fn(async () => ({ sitios: 0 })),
    },
    smtp: {
      proveedores: vi.fn(async () => [
        {
          id: 'resend',
          nombre: 'Resend',
          host: 'smtp.resend.com',
          puerto: 465,
          seguridad: 'tls',
          usuario: 'resend',
        },
      ]),
      proveedor: vi.fn(async (id: string) => ({ id })),
      guardar: vi.fn(async () => []),
      borrar: vi.fn(async () => undefined),
      probar: vi.fn(async () => ({ ok: true, idMensaje: '<id>' })),
    },
    usarCorreoEnSitio: vi.fn(async () => undefined),
    borrarProveedorSmtp: vi.fn(async () => undefined),
    vistaPreviaEnvSmtp: vi.fn(async () => ({
      diff: '+MAIL_HOST=smtp.resend.com',
      huella: 'a'.repeat(64),
    })),
    escribirEnvSmtp: vi.fn(async () => ({ copia: null, gitignoreAgregado: false })),
    plantillas: {
      lista: vi.fn(async () => []),
      vistaPrevia: vi.fn(async () => ({ archivos: 0, bytes: 0, excluidos: [], totalExcluidos: 0 })),
      guardar: vi.fn(async () => ({ id: 'tienda-a1b2c3' })),
      borrar: vi.fn(async () => undefined),
    },
    instantaneas: {
      lista: vi.fn(async () => []),
      tomar: vi.fn(async () => ({ id: '20261125-103000-abcdef' })),
      vistaPrevia: vi.fn(async () => ({ instantanea: {}, estadoActual: { tablas: 0, bytes: 0 } })),
      volver: vi.fn(async () => ({ respaldoPrevio: {}, advertencias: [] })),
      borrar: vi.fn(async () => undefined),
      listaInstancia: vi.fn(async () => []),
      papelera: vi.fn(async () => []),
      recuperar: vi.fn(async () => ({ id: '20261125-103000-abcdef' })),
    },
    auditoriaClaves: {
      auditar: vi.fn(async () => ({ revisadas: 0, debiles: [], noRevisables: 0, truncado: false })),
      vistaPreviaRestablecer: vi.fn(async () => ({
        sentencia: 'UPDATE t SET h = ? WHERE u = ?',
        formato: 'bcrypt',
        formatoNuevo: 'bcrypt',
        cambiaFormato: false,
      })),
      restablecer: vi.fn(async () => ({ copiaFila: 'x.json', instantanea: 'id' })),
      progreso: vi.fn(() => ({ revisadas: 1, total: 2 })),
      cancelar: vi.fn(() => true),
    },
    env: {
      ver: vi.fn(async () => ({ existe: true, filas: [] })),
      revelar: vi.fn(async () => 'valor'),
      vistaPrevia: vi.fn(async () => ({ diff: '' })),
      guardar: vi.fn(async () => ({ copia: null, gitignoreAgregado: false })),
      copias: vi.fn(async () => []),
      restaurarCopia: vi.fn(async () => ({ copia: null })),
    },
    usarUsuarioPropio: vi.fn(async () => ({ usuario: 'wolf_u_x', copia: null })),
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
        'conexionServicio',
        'vistaConexionBd',
        'revelarClaveBd',
        'vistaConexionServicio',
        'revelarClaveServicio',
        'bloqueEnvBd',
        'bloqueEnvSitio',
        'carpetaRespaldos',
        'tieneTablas',
        'formatoRespaldo',
        'restaurarBase',
        'respaldarBase',
        'importarBase',
        'vistaPreviaImportar',
        'importarDeOtros',
        'cancelarImportacion',
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
        'abrirBaseProyecto',
        'instalarPhpMyAdmin',
        'disponibilidadPhpMyAdmin',
        'activarFtp',
        'desactivarFtp',
        'regenerarClaveFtp',
        'ftpSoloLectura',
        'credencialesFtp',
        'urlFtp',
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
        'estadoReverb',
        'activarReverb',
        'desactivarReverb',
        'variablesReverb',
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
        'leerImagen',
        'guardarImagen',
        'comprimirZip',
        'optimizarPdf',
        'conversionesDocumento',
        'convertirDocumento',
        'iniciarBusqueda',
        'cancelarBusqueda',
        'rutaDeResultadoBusqueda',
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
        'crearProyecto',
        'huellaWordpress',
        'confiarReceta',
        'abrirEditor',
        // Task 19
        'versionesServicio',
        'silenciarVersiones',
        'desinstalarVersion',
        'listaInstancias',
        'crearInstancia',
        'iniciarInstancia',
        'detenerInstancia',
        'puertoInstancia',
        'predeterminarInstancia',
        'quitarInstancia',
        'borrarDatosInstancia',
        'desbloquearInstancia',
        'planActualizar',
        'actualizarServicio',
        'nuevaRamaServicio',
        'predeterminarVersion',
        'respaldosDeDatos',
        'borrarRespaldoDatos',
      ].map((m) => [m, vi.fn(async () => undefined)]),
    ),
    fuentesRegistro: vi.fn(async () => [
      { id: 'nginx', nombre: 'Nginx', grupo: 'nginx' },
      { id: 'sitio:s1:error', nombre: 'Errores', grupo: 'sitio', sitioId: 's1' },
    ]),
    seguirRegistro: vi.fn(async () => vi.fn()),
    listarCatalogo: vi.fn(async (servicio: string) => ({
      versiones: [versionFalsa(servicio)],
      origen: 'vivo',
      fecha: '2026-11-23T00:00:00.000Z',
    })),
    buscarVersion: vi.fn(async (servicio: string, version: string) =>
      version === '1.28.0' ? versionFalsa(servicio) : null,
    ),
  };
  return { nucleo: crudo as unknown as NucleoIpc, crudo, oyentes };
}

function versionFalsa(servicio: string) {
  return {
    servicio,
    version: '1.28.0',
    url: 'https://nginx.org/download/nginx-1.28.0.zip',
    sha256: 'a'.repeat(64),
    formato: 'zip',
  };
}

const sistema = {
  elegirCarpeta: vi.fn(),
  elegirArchivo: vi.fn(),
  abrirUrl: vi.fn(),
  abrirGrabadora: vi.fn(),
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
      'busqueda:fin',
      'busqueda:resultado',
      'captura:imagen',
      'contenedor:lineas',
      'disco:progreso',
      'dump:nuevo',
      'git:progreso',
      'hosts:estado',
      'ia:progreso',
      'instalacion:progreso',
      'mcp:confirmacion-cerrada',
      'mcp:confirmar',
      'metricas:muestra',
      'perfil:progreso',
      'proyectos:sugerencias',
      'receta:progreso',
      'registro:lineas',
      'servicio:estado',
      'sitio:cambio',
      'tarea:terminada',
      'tunel:autorizacion',
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
      ['sistema.abrirUrl', ['ftp://u:clave@127.0.0.1:2121/']],
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
    expect(crudo.buscarVersion).toHaveBeenCalledWith('nginx', '1.28.0');
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
      { servicio: 'nginx', version: '1.28.0', confirmarSinHuella: 'si' },
      { servicio: 'nginx', version: '1.28.0', confirmarSinHuella: false },
      'nginx',
    ]) {
      const x = (await canales.get('entorno:instalador.instalar')!({}, malo)) as { ok: boolean };
      expect(x.ok, JSON.stringify(malo)).toBe(false);
    }
    expect(crudo.instalador.instalar).toHaveBeenCalledTimes(1);
    // La confirmación de instalar sin huella fuerte solo pasa como `true` literal.
    await canales.get('entorno:instalador.instalar')!(
      {},
      { servicio: 'nginx', version: '1.28.0', confirmarSinHuella: true },
    );
    expect(crudo.instalador.instalar).toHaveBeenLastCalledWith(
      expect.objectContaining({ version: '1.28.0' }),
      { confirmarSinHuella: true },
    );
  });

  it('instalador.listarVersiones valida servicio y filtro y devuelve el origen', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (...a: unknown[]) =>
      canales.get('entorno:instalador.listarVersiones')!({}, ...a) as Promise<{
        ok: boolean;
        valor?: { origen: string };
      }>;
    const r = await llamar('node', { rama: '22', todas: true });
    expect(r).toMatchObject({ ok: true, valor: { origen: 'vivo' } });
    expect(crudo.listarCatalogo).toHaveBeenLastCalledWith('node', { rama: '22', todas: true });
    expect((await llamar('composer')).ok).toBe(true);
    expect(crudo.listarCatalogo).toHaveBeenLastCalledWith('composer', {});
    for (const malo of [
      ['__proto__'],
      ['node', { rama: '../x' }],
      ['node', { todas: 'si' }],
      ['node', { url: 'https://evil.example' }],
      ['node', []],
    ]) {
      expect((await llamar(...malo)).ok, JSON.stringify(malo)).toBe(false);
    }
  });

  it('instalador.instalados solo acepta servicios y herramientas del catálogo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (s: unknown) =>
      canales.get('entorno:instalador.instalados')!({}, s) as Promise<{ ok: boolean }>;
    for (const bueno of ['php', 'mysql', 'composer', 'adminer', 'phpmyadmin', 'pgvector-src']) {
      expect((await llamar(bueno)).ok, bueno).toBe(true);
    }
    for (const malo of ['..', '..\\..\\Windows', 'php/../..', 'cualquiera', '', 3, null]) {
      expect((await llamar(malo)).ok, String(malo)).toBe(false);
    }
    expect(crudo.instalador.instalados).toHaveBeenCalledTimes(6);
  });

  it('servicios.detenerTodo usa Nucleo.detenerTodo (cierra túneles primero)', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    await canales.get('entorno:servicios.detenerTodo')!({});
    expect(crudo.detenerTodo).toHaveBeenCalled();
  });
  it('tareas programadas: ids, huellas y booleanos validados; el núcleo valida lo demás', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (c: string, ...a: unknown[]) => canales.get(`entorno:tareas.${c}`)!({}, ...a);
    const huella = 'a'.repeat(64);
    const t = { nombre: 'x', cron: '* * * * *', comando: ['php', 'a'], activa: true };
    expect(await llamar('guardar', 'tienda', t)).toEqual({ ok: true, valor: t });
    for (const malo of [[], null, 'x', 5]) {
      expect(await llamar('guardar', 'tienda', malo)).toMatchObject({ ok: false });
    }
    expect(crudo.tareas.guardar).toHaveBeenCalledTimes(1);
    await llamar('lista', 'tienda');
    await llamar('ejecutarAhora', 'tienda', 't_1');
    await llamar('confirmar', 'tienda', 't_1', huella);
    await llamar('adoptar', 'tienda', 'schedule', huella, true);
    await llamar('activar', 'tienda', 't_1', false);
    await llamar('borrar', 'tienda', 't_1');
    expect(crudo.programador.vista).toHaveBeenCalledWith('tienda');
    expect(crudo.programador.ejecutarAhora).toHaveBeenCalledWith('tienda', 't_1');
    expect(crudo.tareas.confirmar).toHaveBeenCalledWith('tienda', 't_1', huella);
    expect(crudo.tareas.adoptar).toHaveBeenCalledWith('tienda', 'schedule', huella, true);
    expect(crudo.tareas.activar).toHaveBeenCalledWith('tienda', 't_1', false);
    // Ids con ruta, huellas que no son SHA-256 y booleanos falsos: nunca llegan al núcleo.
    for (const malo of ['../x', 'a/b', '', 5, undefined, 'x'.repeat(200)]) {
      expect(await llamar('lista', malo)).toMatchObject({ ok: false });
      expect(await llamar('ejecutarAhora', 'tienda', malo)).toMatchObject({ ok: false });
      expect(await llamar('ejecutarAhora', malo, 't_1')).toMatchObject({ ok: false });
    }
    for (const mala of ['abc', 'A'.repeat(64), huella + 'a', 5, undefined, '']) {
      expect(await llamar('confirmar', 'tienda', 't_1', mala)).toMatchObject({ ok: false });
      expect(await llamar('adoptar', 'tienda', 'schedule', mala, true)).toMatchObject({
        ok: false,
      });
    }
    for (const malo of ['true', 1, undefined]) {
      expect(await llamar('activar', 'tienda', 't_1', malo)).toMatchObject({ ok: false });
      expect(await llamar('adoptar', 'tienda', 'schedule', huella, malo)).toMatchObject({
        ok: false,
      });
    }
    expect(await llamar('proximas', 'x'.repeat(300))).toMatchObject({ ok: false });
    expect(crudo.programador.ejecutarAhora).toHaveBeenCalledTimes(1);
    expect(crudo.tareas.confirmar).toHaveBeenCalledTimes(1);
    expect(crudo.tareas.adoptar).toHaveBeenCalledTimes(1);
    // La confirmación del modo aislado es una orden propia, sin argumentos.
    await llamar('permitirAislado');
    expect(crudo.programador.permitirAislado).toHaveBeenCalledTimes(1);
  });

  it('workspaces: solo ids válidos y objetos planos; el resto lo valida el núcleo', async () => {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (c: string, ...a: unknown[]) =>
      canales.get(`entorno:workspaces.${c}`)!({}, ...a);
    const w = { id: 'bot', nombre: 'Bot', elementos: [{ tipo: 'servicio', id: 'ollama' }] };
    expect(await llamar('guardar', w)).toEqual({ ok: true, valor: w });
    expect(crudo.workspaces.guardar).toHaveBeenCalledWith(w);
    for (const malo of [[], null, 'x', 5]) {
      expect(await llamar('guardar', malo)).toMatchObject({ ok: false });
    }
    expect(crudo.workspaces.guardar).toHaveBeenCalledTimes(1);
    await llamar('iniciar', 'bot');
    await llamar('detener', 'bot');
    await llamar('borrar', 'bot');
    expect(crudo.workspaces.iniciar).toHaveBeenCalledWith('bot');
    expect(crudo.workspaces.detener).toHaveBeenCalledWith('bot');
    expect(crudo.workspaces.borrar).toHaveBeenCalledWith('bot');
    for (const c of ['iniciar', 'detener', 'borrar']) {
      for (const malo of ['../x', 'Con Espacios', '', 5, undefined]) {
        expect(await llamar(c, malo)).toMatchObject({ ok: false });
      }
    }
    expect(crudo.workspaces.iniciar).toHaveBeenCalledTimes(1);
  });

  it('registra exactamente la lista de rutas de las etapas A y B', () => {
    const { ipcMain, canales } = ipcFalso();
    registrarIpc(nucleoFalso().nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    expect([...canales.keys()].map((c) => c.slice('entorno:'.length)).sort()).toEqual(
      [
        'estadoGeneral',
        'carpetaDatos',
        'perfiles.entorno',
        'perfiles.exportar',
        'perfiles.vistaPrevia',
        'perfiles.importar',
        'perfiles.instantaneas',
        'perfiles.quitarCaAnterior',
        'perfiles.instantanea',
        'avisoInicio',
        'sitios.listar',
        'sitios.guardar',
        'sitios.borrar',
        'sitios.aplicar',
        'sitios.phpSitio',
        'sitios.guardarPhpIni',
        'sitios.xdebug',
        'sitios.launchJsonVista',
        'sitios.launchJson',
        'nginx.vista',
        'nginx.aplicar',
        'nginx.historial',
        'nginx.restaurar',
        'nginx.snippets',
        'workspaces.lista',
        'tareas.lista',
        'tareas.estado',
        'tareas.proximas',
        'tareas.permitirAislado',
        'tareas.guardar',
        'tareas.activar',
        'tareas.confirmar',
        'tareas.borrar',
        'tareas.ejecutarAhora',
        'tareas.historial',
        'tareas.log',
        'tareas.propuestas',
        'tareas.adoptar',
        'tareas.aWolfcoreYml',
        'workspaces.estados',
        'workspaces.guardar',
        'workspaces.borrar',
        'workspaces.iniciar',
        'workspaces.detener',
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
        'bd.revelar',
        'bd.revelarBloqueEnv',
        'servicios.conexion',
        'servicios.revelarSecreto',
        'bd.bloqueEnv',
        'bd.bloqueEnvSitio',
        'bd.lentasEstado',
        'bd.lentasCambiar',
        'bd.lentasLeer',
        'bd.lentasLiteral',
        'bd.esquema',
        'bd.carpetaRespaldos',
        'bd.tieneTablas',
        'bd.formato',
        'bd.restaurar',
        'bd.respaldar',
        'bd.importar',
        'instantaneas.lista',
        'instantaneas.tomar',
        'instantaneas.vistaPrevia',
        'instantaneas.volver',
        'instantaneas.borrar',
        'instantaneas.listaInstancia',
        'instantaneas.papelera',
        'instantaneas.recuperar',
        'auditoriaClaves.auditar',
        'auditoriaClaves.progreso',
        'auditoriaClaves.cancelar',
        'auditoriaClaves.vistaPrevia',
        'auditoriaClaves.restablecer',
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
        'terminal.disponibles',
        'terminal.cambiarPorDefecto',
        'path.estado',
        'path.cambiar',
        'cli.estado',
        'clienteHttp.activarEntorno',
        'clienteHttp.borrarEntorno',
        'clienteHttp.borrarPeticion',
        'clienteHttp.cancelar',
        'clienteHttp.copiarComoCurl',
        'clienteHttp.enviar',
        'clienteHttp.estado',
        'clienteHttp.guardarEntorno',
        'clienteHttp.guardarPeticion',
        'clienteHttp.importarCurl',
        'clienteHttp.limpiarHistorial',
        'clienteHttp.revelar',
        'ejemploHttp.iniciar',
        'ejemploHttp.detener',
        'laboratorioGit.estado',
        'laboratorioGit.ejecutar',
        'laboratorioGit.escribirArchivo',
        'laboratorioGit.reiniciar',
        'cli.cambiarPath',
        'adminer.instalar',
        'adminer.disponibilidad',
        'adminer.url',
        'adminer.proyecto',
        'phpmyadmin.instalar',
        'phpmyadmin.disponibilidad',
        'accesoBd.abrir',
        'ftp.activar',
        'ftp.desactivar',
        'ftp.regenerarClave',
        'ftp.soloLectura',
        'ftp.credenciales',
        'ftp.url',
        'ftp.redLocal',
        'lan.estado',
        'lan.activar',
        'lan.desactivar',
        'lan.comandoFirewall',
        'lan.abrirCaMovil',
        'lan.cerrarCaMovil',
        'ia.modelos',
        'ia.descargar',
        'ia.cancelar',
        'ia.borrar',
        'ia.probar',
        'ia.espacioUsado',
        'ia.bloqueEnv',
        'ia.sugeridos',
        'ia.proveedores',
        'ia.guardarProveedor',
        'ia.borrarProveedor',
        'ia.guardarClave',
        'ia.borrarClave',
        'ia.estadoClave',
        'ia.respaldosClave',
        'ia.probarConexion',
        'ia.probarMensaje',
        'ia.previsualizarEnv',
        'ia.escribirEnv',
        'mailpit.noLeidos',
        'correo.captadores',
        'correo.elegir',
        'correo.presets',
        'correo.proveedores',
        'correo.guardarProveedor',
        'correo.borrarProveedor',
        'correo.guardarClave',
        'correo.borrarClave',
        'correo.probarEnvio',
        'correo.usarEnSitio',
        'correo.vistaPreviaEnv',
        'correo.escribirEnv',
        'instalador.listarVersiones',
        'instalador.instalar',
        'instalador.instalados',
        'instalador.desinstalar',
        'limpiezaVersiones.sinUso',
        'limpiezaVersiones.limpiar',
        'limpiezaVersiones.papelera',
        'limpiezaVersiones.recuperar',
        'catalogo.versiones',
        'catalogo.silenciar',
        'instancias.lista',
        'instancias.crear',
        'instancias.iniciar',
        'instancias.detener',
        'instancias.puerto',
        'instancias.predeterminar',
        'instancias.quitar',
        'instancias.borrarDatos',
        'instancias.desbloquear',
        'servicios.planActualizar',
        'servicios.actualizar',
        'servicios.nuevaRama',
        'servicios.predeterminada',
        'servicios.respaldosDatos',
        'servicios.borrarRespaldoDatos',
        'tuneles.abrir',
        'tuneles.cerrar',
        'tuneles.renovar',
        'tuneles.estados',
        'tuneles.cuentaCloudflare',
        'tuneles.conectarCloudflare',
        'tuneles.cancelarConexionCloudflare',
        'tuneles.desconectarCloudflare',
        'tuneles.olvidarCloudflare',
        'tuneles.recrearCloudflare',
        'tuneles.configurarCloudflare',
        'tuneles.usarTunelRapido',
        'tuneles.usarProveedor',
        'tuneles.estadoToken',
        'tuneles.guardarToken',
        'tuneles.borrarToken',
        'hosts.sincronizar',
        'detectarProyecto',
        'config.leer',
        'ajustes.guardar',
        'sistema.elegirCarpeta',
        'sistema.elegirArchivo',
        'sistema.abrirUrl',
        'sistema.abrirGrabadora',
        'sistema.abrirCarpeta',
        'sistema.copiar',
        'sistema.version',
        // Etapa B
        'sistema.guardarArchivo',
        'sistema.elegirArchivos',
        'sistema.abrirEditor',
        'editor.disponibles',
        'editor.cambiarPorDefecto',
        'avisos.lista',
        'avisos.marcarLeidos',
        'avisos.limpiar',
        'avisos.configurar',
        'doctor.revisar',
        'doctor.reparar',
        'doctor.ultimo',
        'confianza.estado',
        'confianza.nodeGlobal',
        'confianza.firefox',
        'depuracion.estado',
        'depuracion.activar',
        'depuracion.captura',
        'depuracion.lista',
        'depuracion.leer',
        'depuracion.limpiar',
        'depuracion.copiar',
        'env.ver',
        'env.revelar',
        'env.vistaPrevia',
        'env.guardar',
        'env.copias',
        'env.restaurarCopia',
        'env.usarUsuarioPropio',
        'errores.lista',
        'errores.leer',
        'editor.abrirEn',
        'contenedores.motores',
        'contenedores.lista',
        'contenedores.accion',
        'contenedores.seguir',
        'contenedores.dejar',
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
        'proyectos.crear',
        'proyectos.huellaWordpress',
        'proyectos.confiar',
        'plantillas.lista',
        'plantillas.vistaPrevia',
        'plantillas.guardar',
        'plantillas.borrar',
        'importar.vistaPrevia',
        'importar.ejecutar',
        'importar.cancelar',
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
        'reverb.estado',
        'reverb.activar',
        'reverb.desactivar',
        'reverb.variables',
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
        'buscar.iniciar',
        'buscar.cancelar',
        'buscar.prepararEditor',
        'memoria.plan',
        'memoria.aplicar',
        'limpiezaDisco.analizar',
        'limpiezaDisco.limpiar',
        'limpiezaDisco.cancelar',
        'limpiezaDisco.abrirRegistros',
        'editorCodigo.elegir',
        'editorCodigo.abrir',
        'editorCodigo.guardar',
        'editorCodigo.avisarCambios',
        'diffCarpetas.comparar',
        'diffCarpetas.cancelar',
        'diffCarpetas.archivo',
        'diffCarpetas.prepararEditor',
        'discoUso.unidades',
        'discoUso.analizar',
        'discoUso.analizarUnidad',
        'discoUso.cancelar',
        'discoUso.abrirCarpeta',
        'captura.leer',
        'captura.guardarConfig',
        'captura.iniciar',
        'captura.tomarPendiente',
        'herramientas.emitirCertificado',
        'herramientas.entorno',
        'herramientas.leerImagen',
        'herramientas.guardarImagen',
        'herramientas.comprimirZip',
        'herramientas.optimizarPdf',
        'herramientas.conversionesDocumento',
        'herramientas.convertirDocumento',
        'mcp.estado',
        'mcp.iniciar',
        'mcp.detener',
        'mcp.cambiarPuerto',
        'mcp.configuracion',
        'mcp.regenerarToken',
        'mcp.responderConfirmacion',
        'agentes.estado',
        'agentes.version',
        'agentes.instalar',
        'agentes.registrarMcp',
        'agentes.quitarMcp',
        'agentes.abrir',
        'git.sugerirCommit',
        'git.commitPreparado',
        'php.iniLeer',
        'php.iniValores',
        'php.iniConValores',
        'php.iniDiff',
        'php.iniGuardar',
        'php.iniRespaldos',
        'php.iniRestaurar',
        'php.extensiones',
        'php.extensionActivar',
        'php.extensionInstalar',
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
        ['bd.revelar', ['redis']],
        ['bd.revelarBloqueEnv', ['mysql', 'a;DROP', null]],
        ['bd.revelarBloqueEnv', ['mysql', 'x', 42]],
        ['bd.revelarBloqueEnv', ['mysql', 'x', 'demo' + String.fromCharCode(10)]],
        ['servicios.revelarSecreto', ['redis']],
        ['servicios.revelarSecreto', ['mysql@8.4']],
        ['bd.bloqueEnv', ['mysql', 'x', 'cobol']],
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
        ['cli.cambiarPath', ['si']],
        ['adminer.url', ['mysql', 'root; x']],
        ['accesoBd.abrir', ['s1', 'otra']],
        ['accesoBd.abrir', ['', 'adminer']],
        ['accesoBd.abrir', ['s1', null]],
        ['ftp.activar', [null]],
        ['ftp.soloLectura', ['s1', 'true']],
        ['ftp.redLocal', [1]],
        ['lan.activar', ['s1', null]],
        ['lan.activar', ['s1', { ip: '0.0.0.0; x', https: true }]],
        ['lan.activar', ['s1', { ip: '192.168.1.5', https: 'si' }]],
        ['lan.comandoFirewall', [80]],
        ['lan.comandoFirewall', ['8100; calc']],
        ['lan.abrirCaMovil', ['no-es-ip']],
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
      'vistaConexionBd',
      'revelarClaveBd',
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
      'abrirBaseProyecto',
      'activarFtp',
      'ftpSoloLectura',
      'ftpRedLocal',
      'comandoFirewallLan',
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
      expect((await llamar('ftp.url', 'demo')).ok).toBe(true);
      expect(f['urlFtp']).toHaveBeenCalledWith('demo');
      expect((await llamar('ftp.url', 5)).ok).toBe(false);
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
      // Almacén genérico (claves de IA): sin uso en estas rutas.
      guardar: vi.fn(async () => undefined),
      leer: vi.fn(async () => null),
      borrar: vi.fn(async () => undefined),
      hay: vi.fn(() => false),
      estado: vi.fn(async () => ({ configurada: false, final: null })),
      disponible: vi.fn(() => true),
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
        'estadoReverb',
        'activarReverb',
        'desactivarReverb',
        'variablesReverb',
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
      await llamar('reverb.activar', 's1', 'true');
      expect(f['activarReverb']).toHaveBeenLastCalledWith('s1', false);
      await llamar('reverb.activar', 's1', true);
      expect(f['activarReverb']).toHaveBeenLastCalledWith('s1', true);
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

  it('imágenes, ZIP y PDF solo aceptan rutas de diálogos, con el propósito correcto', async () => {
    const { f, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcd33-'));
    const imagen = path.join(carpeta, 'a.png');
    const pdf = path.join(carpeta, 'a.pdf');
    const destino = path.join(carpeta, 'salida.zip');
    const destinoImg = path.join(carpeta, 'salida.ico');
    try {
      // Sin diálogo, ninguna ruta sirve: ni para leer ni para escribir.
      expect((await llamar('herramientas.leerImagen', imagen)).ok).toBe(false);
      expect((await llamar('herramientas.comprimirZip', [carpeta], destino)).ok).toBe(false);
      expect((await llamar('herramientas.optimizarPdf', pdf, destino)).ok).toBe(false);
      sistema.elegirArchivo.mockResolvedValueOnce(imagen);
      await llamar('sistema.elegirArchivo');
      sistema.elegirCarpeta.mockResolvedValueOnce(carpeta);
      await llamar('sistema.elegirCarpeta');
      sistema.guardarArchivo.mockResolvedValueOnce(destino);
      await llamar('sistema.guardarArchivo', 'salida.zip');
      sistema.guardarArchivo.mockResolvedValueOnce(destinoImg);
      await llamar('sistema.guardarArchivo', 'salida.ico');
      expect((await llamar('herramientas.leerImagen', imagen)).ok).toBe(true);
      expect(f['leerImagen']).toHaveBeenCalledWith(imagen);
      // Una ruta de "guardar" no sirve para leer, ni una de "abrir" como destino.
      expect((await llamar('herramientas.leerImagen', destino)).ok).toBe(false);
      expect((await llamar('herramientas.comprimirZip', [carpeta], imagen)).ok).toBe(false);
      expect(
        (await llamar('herramientas.comprimirZip', [path.join(carpeta, 'x')], destino)).ok,
      ).toBe(false);
      expect((await llamar('herramientas.comprimirZip', [], destino)).ok).toBe(false);
      expect((await llamar('herramientas.comprimirZip', [carpeta, imagen], destino)).ok).toBe(true);
      expect(f['comprimirZip']).toHaveBeenCalledWith([carpeta, imagen], destino);
      // Los bytes de la imagen: solo Uint8Array no vacío y con tope.
      expect(
        (await llamar('herramientas.guardarImagen', destinoImg, new Uint8Array([1, 2]))).ok,
      ).toBe(true);
      expect(f['guardarImagen']).toHaveBeenCalledTimes(1);
      for (const malo of [
        [1, 2],
        'texto',
        new Uint8Array(0),
        null,
        new Uint8Array(61 * 1024 * 1024),
      ]) {
        expect((await llamar('herramientas.guardarImagen', destinoImg, malo)).ok).toBe(false);
      }
      expect((await llamar('herramientas.guardarImagen', imagen, new Uint8Array([1]))).ok).toBe(
        false,
      );
      expect(f['guardarImagen']).toHaveBeenCalledTimes(1);
      expect((await llamar('herramientas.optimizarPdf', pdf, destino)).ok).toBe(false);
      expect(f['optimizarPdf']).not.toHaveBeenCalled();
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('el conversor de documentos solo acepta rutas de diálogos y formatos de la lista', async () => {
    const { f, llamar } = montar();
    const carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-ipcd34-'));
    const origen = path.join(carpeta, 'a.docx');
    const destino = path.join(carpeta, 'a.md');
    try {
      expect((await llamar('herramientas.convertirDocumento', origen, 'md', destino)).ok).toBe(
        false,
      );
      sistema.elegirArchivo.mockResolvedValueOnce(origen);
      await llamar('sistema.elegirArchivo');
      sistema.guardarArchivo.mockResolvedValueOnce(destino);
      await llamar('sistema.guardarArchivo', 'a.md');
      // Una ruta de "guardar" no sirve como origen ni una de "abrir" como destino.
      expect((await llamar('herramientas.convertirDocumento', destino, 'md', destino)).ok).toBe(
        false,
      );
      expect((await llamar('herramientas.convertirDocumento', origen, 'md', origen)).ok).toBe(
        false,
      );
      // El formato es de una lista fija.
      for (const malo of ['exe', 'bat', '', null, 5, '../md']) {
        expect((await llamar('herramientas.convertirDocumento', origen, malo, destino)).ok).toBe(
          false,
        );
      }
      expect(f['convertirDocumento']).not.toHaveBeenCalled();
      expect((await llamar('herramientas.convertirDocumento', origen, 'md', destino)).ok).toBe(
        true,
      );
      expect(f['convertirDocumento']).toHaveBeenCalledWith(origen, 'md', destino);
      expect((await llamar('herramientas.conversionesDocumento')).ok).toBe(true);
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  describe('buscar', () => {
    const comunes = {
      consulta: 'aguja',
      modo: 'ambos',
      regex: false,
      mayusculas: false,
      incluir: [],
      excluir: ['node_modules'],
    };

    it('la raíz solo sale de un proyecto por id o de un diálogo', async () => {
      const { f, llamar } = montar();
      f['iniciarBusqueda']!.mockReturnValue('b1');
      // Una ruta libre del renderer no sirve.
      const libre = await llamar('buscar.iniciar', { ...comunes, rutaElegida: 'C://Windows' });
      expect(libre.ok).toBe(false);
      expect(f['iniciarBusqueda']).not.toHaveBeenCalled();
      // Tampoco un proyecto que no existe, ni las dos raíces a la vez, ni ninguna.
      expect((await llamar('buscar.iniciar', { ...comunes, sitioId: 'no-existe' })).ok).toBe(false);
      expect(
        (await llamar('buscar.iniciar', { ...comunes, sitioId: 's1', rutaElegida: 'C://x' })).ok,
      ).toBe(false);
      expect((await llamar('buscar.iniciar', comunes)).ok).toBe(false);
      expect(f['iniciarBusqueda']).not.toHaveBeenCalled();
      // Un proyecto por id: la carpeta sale de la configuración.
      (f['sitios'] as unknown as { listar: Mock }).listar.mockResolvedValueOnce([
        { id: 's1', carpeta: 'C://proyectos/uno' },
      ]);
      const ok = await llamar('buscar.iniciar', { ...comunes, sitioId: 's1' });
      expect(ok).toMatchObject({ ok: true, valor: 'b1' });
      expect(f['iniciarBusqueda']).toHaveBeenCalledWith(
        expect.objectContaining({ raiz: 'C://proyectos/uno', consulta: 'aguja' }),
      );
    });

    it('acepta una carpeta elegida en un diálogo y valida el resto', async () => {
      const { f, llamar } = montar();
      f['iniciarBusqueda']!.mockReturnValue('b2');
      const carpeta = path.join(os.tmpdir(), 'pel-buscar-elegida');
      sistema.elegirCarpeta.mockResolvedValueOnce(carpeta);
      await llamar('sistema.elegirCarpeta');
      expect((await llamar('buscar.iniciar', { ...comunes, rutaElegida: carpeta })).ok).toBe(true);
      expect(f['iniciarBusqueda']).toHaveBeenCalledWith(
        expect.objectContaining({ raiz: carpeta, excluir: ['node_modules'], incluir: [] }),
      );
      for (const malo of [
        { ...comunes, modo: 'todo' },
        { ...comunes, consulta: '' },
        { ...comunes, consulta: 'x'.repeat(501) },
        { ...comunes, regex: 'si' },
        { ...comunes, incluir: [1] },
        { ...comunes, excluir: Array.from({ length: 51 }, () => 'a') },
      ]) {
        expect((await llamar('buscar.iniciar', { ...malo, rutaElegida: carpeta })).ok).toBe(false);
      }
      expect(f['iniciarBusqueda']).toHaveBeenCalledTimes(1);
    });

    it('cancelar exige un id corto', async () => {
      const { f, llamar } = montar();
      f['cancelarBusqueda']!.mockReturnValue(true);
      expect((await llamar('buscar.cancelar', 'b1')).ok).toBe(true);
      expect(f['cancelarBusqueda']).toHaveBeenCalledWith('b1');
      expect((await llamar('buscar.cancelar', 7)).ok).toBe(false);
      expect((await llamar('buscar.cancelar', 'x'.repeat(65))).ok).toBe(false);
    });
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

  it('proyectos.crear: la carpeta padre sale de un diálogo y la ruta final la arma el main', async () => {
    const { f, llamar } = montar();
    const padre = temporal();
    const pedido = {
      tipo: 'laravel',
      nombre: 'tienda',
      carpetaPadre: padre,
      php: '8.4',
      base: { instancia: 'mysql@8.4', nombre: 'tienda' },
      opciones: { starterKit: 'vue' },
    };
    // Sin diálogo previo: rechazada y el núcleo no se entera.
    const sin = await llamar('proyectos.crear', pedido);
    expect(sin.ok).toBe(false);
    expect(sin.error?.mensaje).toMatch(/diálogo/);
    expect(f['crearProyecto']).not.toHaveBeenCalled();
    // Un campo `carpeta` suelto tampoco vale, aunque venga con la padre elegida.
    sistema.elegirCarpeta.mockResolvedValueOnce(padre);
    await llamar('sistema.elegirCarpeta');
    expect((await llamar('proyectos.crear', { ...pedido, carpeta: 'C:\\Windows' })).ok).toBe(false);
    expect(f['crearProyecto']).not.toHaveBeenCalled();
    // Elegida: el núcleo recibe la carpeta padre + nombre y no el campo carpetaPadre.
    expect((await llamar('proyectos.crear', pedido)).ok).toBe(true);
    const { carpetaPadre: _p, ...resto } = pedido;
    void _p;
    expect(f['crearProyecto']).toHaveBeenCalledWith(
      { ...resto, carpeta: path.join(padre, 'tienda') },
      // La clave del usuario propio de la base la genera el main y la guarda por alCrearSitio.
      {
        secretos: { claveBd: expect.stringMatching(/^[A-Za-z0-9_-]{32}$/) },
        alCrearSitio: expect.any(Function),
      },
    );
  });

  it('I3: proyectos.crear sin cifrado disponible crea sin usuario propio y sin generar clave', async () => {
    const secretos = secretosFalsos();
    secretos.disponible.mockReturnValue(false);
    const { f, llamar } = montar({ secretos });
    const padre = temporal();
    sistema.elegirCarpeta.mockResolvedValueOnce(padre);
    await llamar('sistema.elegirCarpeta');
    const pedido = {
      tipo: 'laravel',
      nombre: 'tienda',
      carpetaPadre: padre,
      php: '8.4',
      base: { instancia: 'mysql@8.4', nombre: 'tienda' },
      opciones: {},
    };
    expect((await llamar('proyectos.crear', pedido)).ok).toBe(true);
    expect(f['crearProyecto']).toHaveBeenCalledWith(expect.any(Object), { sinUsuarioPropio: true });
    expect(secretos.guardar).not.toHaveBeenCalled();
  });

  it('proyectos.crear rechaza pedidos mal formados sin llamar al núcleo', async () => {
    const { f, llamar } = montar();
    const padre = temporal();
    sistema.elegirCarpeta.mockResolvedValueOnce(padre);
    await llamar('sistema.elegirCarpeta');
    const ok = { tipo: 'estatico', nombre: 'web', carpetaPadre: padre, base: null, opciones: {} };
    for (const malo of [
      'x',
      null,
      { ...ok, tipo: 'rm-rf' },
      { ...ok, tipo: 7 },
      { ...ok, nombre: 7 },
      { ...ok, nombre: '..\\..\\x' },
      { ...ok, nombre: 'a/b' },
      { ...ok, nombre: 'a\\b' },
      { ...ok, nombre: 'c:x' },
      { ...ok, nombre: '' },
      { ...ok, carpetaPadre: 7 },
      { ...ok, base: 'x' },
      { ...ok, base: { instancia: 7, nombre: 'a' } },
      { ...ok, base: { instancia: null, nombre: 'a', motor: 'oracle' } },
      { ...ok, opciones: [] },
      { ...ok, opciones: 'x' },
      { ...ok, php: 84 },
      { ...ok, extra: true },
    ]) {
      expect((await llamar('proyectos.crear', malo)).ok, JSON.stringify(malo)).toBe(false);
    }
    expect(f['crearProyecto']).not.toHaveBeenCalled();
    expect((await llamar('proyectos.crear', ok)).ok).toBe(true);
  });

  it('proyectos.crear con plantilla: solo su id (nunca una ruta) y el resto del pedido igual', async () => {
    const { f, llamar } = montar();
    const padre = temporal();
    sistema.elegirCarpeta.mockResolvedValueOnce(padre);
    await llamar('sistema.elegirCarpeta');
    const ok = {
      tipo: 'laravel',
      nombre: 'tienda',
      carpetaPadre: padre,
      base: null,
      opciones: {},
      plantilla: 'tienda-a1b2c3',
    };
    for (const malo of ['../../x', 'C:\\Windows', 'A', '', 7, 'a/b', 'a\\b']) {
      expect((await llamar('proyectos.crear', { ...ok, plantilla: malo })).ok, String(malo)).toBe(
        false,
      );
    }
    expect(f['crearProyecto']).not.toHaveBeenCalled();
    expect((await llamar('proyectos.crear', ok)).ok).toBe(true);
    expect(f['crearProyecto']).toHaveBeenCalledWith(
      expect.objectContaining({
        plantilla: 'tienda-a1b2c3',
        carpeta: path.join(padre, 'tienda'),
      }),
      expect.objectContaining({ secretos: expect.anything() }),
    );
  });

  it('plantillas.*: el sitio debe existir, las opciones se validan y el id nunca es una ruta', async () => {
    const { crudo, llamar } = montar();
    const pl = (crudo as unknown as { plantillas: Record<string, Mock> }).plantillas;
    expect((await llamar('plantillas.lista')).ok).toBe(true);
    const opciones = { nombre: 'Mi base', conArchivos: true, excluirExtra: ['uploads'] };
    const esperadas = { ...opciones, incluir: [] };
    expect((await llamar('plantillas.guardar', 's1', opciones)).ok).toBe(true);
    expect(pl['guardar']).toHaveBeenCalledWith('s1', esperadas);
    expect((await llamar('plantillas.vistaPrevia', 's1', { excluirExtra: ['x'] })).ok).toBe(true);
    expect(pl['vistaPrevia']).toHaveBeenCalledWith('s1', {
      nombre: '',
      conArchivos: false,
      excluirExtra: ['x'],
      incluir: [],
    });
    pl['guardar']!.mockClear();
    for (const malo of [
      ['otro', opciones],
      ['s1', 'x'],
      ['s1', { ...opciones, nombre: '' }],
      ['s1', { ...opciones, nombre: 'x'.repeat(61) }],
      ['s1', { ...opciones, conArchivos: 'si' }],
      ['s1', { ...opciones, excluirExtra: 'uploads' }],
      ['s1', { ...opciones, excluirExtra: [7] }],
      ['s1', { ...opciones, excluirExtra: Array(51).fill('a') }],
      ['s1', { ...opciones, ruta: 'C:\\' }],
      ['s1', { ...opciones, incluir: 'x' }],
      ['s1', { ...opciones, incluir: [7] }],
    ] as [string, unknown][]) {
      expect((await llamar('plantillas.guardar', ...malo)).ok, JSON.stringify(malo)).toBe(false);
    }
    expect(pl['guardar']).not.toHaveBeenCalled();
    for (const id of ['../x', 'a/b', 'A', '', 7, 'C:\\x']) {
      expect((await llamar('plantillas.borrar', id)).ok, String(id)).toBe(false);
    }
    expect(pl['borrar']).not.toHaveBeenCalled();
    expect((await llamar('plantillas.borrar', 'tienda-a1b2c3')).ok).toBe(true);
    expect(pl['borrar']).toHaveBeenCalledWith('tienda-a1b2c3');
  });

  it('importar.*: ids de sitios (nunca rutas), origen siempre local y la clave nunca vuelve en un error', async () => {
    const { crudo, llamar } = montar();
    const f = crudo as unknown as Record<string, Mock>;
    expect((await llamar('importar.vistaPrevia')).ok).toBe(true);
    expect(f['vistaPreviaImportar']).toHaveBeenLastCalledWith(undefined);
    expect((await llamar('importar.vistaPrevia', 'mysql@8.0')).ok).toBe(true);
    expect(f['vistaPreviaImportar']).toHaveBeenLastCalledWith('mysql@8.0');
    expect((await llamar('importar.vistaPrevia', 'mongodb')).ok).toBe(false);
    expect((await llamar('importar.vistaPrevia', 'C:/x')).ok).toBe(false);

    const id = 'laragon-0123456789ab';
    const origenBd = { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: '' };
    const buenas = { origenBd, instancia: 'mysql', reemplazar: ['tienda_db'] };
    expect((await llamar('importar.ejecutar', [id], buenas)).ok).toBe(true);
    expect(f['importarDeOtros']).toHaveBeenLastCalledWith([id], buenas);
    expect((await llamar('importar.ejecutar', [id], undefined)).ok).toBe(true);
    expect(f['importarDeOtros']).toHaveBeenLastCalledWith([id], {});
    f['importarDeOtros']!.mockClear();
    for (const malo of [
      [[], buenas],
      [['C:/laragon/www/x'], buenas],
      [['../x'], buenas],
      [['laragon-xyz'], buenas],
      [['otro-0123456789ab'], buenas],
      ['laragon-0123456789ab', buenas],
      [Array(201).fill(id), buenas],
      [[id], { ...buenas, origenBd: { ...origenBd, host: '10.0.0.5' } }],
      [[id], { ...buenas, origenBd: { ...origenBd, host: 'localhost' } }],
      [[id], { ...buenas, origenBd: { ...origenBd, puerto: 0 } }],
      [[id], { ...buenas, origenBd: { ...origenBd, usuario: '' } }],
      [[id], { ...buenas, origenBd: { ...origenBd, clave: 'a' + String.fromCharCode(10) + 'b' } }],
      [[id], { ...buenas, origenBd: { ...origenBd, extra: 1 } }],
      [[id], { ...buenas, instancia: 'mongodb' }],
      [[id], { ...buenas, instancia: 'C:/x' }],
      [[id], { ...buenas, reemplazar: ['x y'] }],
      [[id], { ...buenas, reemplazar: 'tienda' }],
      [[id], { ...buenas, ruta: 'C:/x' }],
      [[id], 'x'],
    ] as [unknown, unknown][]) {
      expect((await llamar('importar.ejecutar', ...malo)).ok, JSON.stringify(malo)).toBe(false);
    }
    expect(f['importarDeOtros']).not.toHaveBeenCalled();

    expect((await llamar('importar.cancelar')).ok).toBe(true);
    expect(f['cancelarImportacion']).toHaveBeenCalledTimes(1);

    // La clave de origen se quita de cualquier error que vuelva al renderer.
    const clave = 'centinela-origen-ipc-d15';
    f['importarDeOtros']!.mockRejectedValueOnce(new Error(`Acceso denegado con ${clave}`));
    const r = await llamar('importar.ejecutar', [id], {
      ...buenas,
      origenBd: { ...origenBd, clave },
    });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain(clave);
  });

  it('proyectos.huellaWordpress valida la versión y llega al núcleo', async () => {
    const { f, llamar } = montar();
    expect((await llamar('proyectos.huellaWordpress')).ok).toBe(true);
    expect(f['huellaWordpress']).toHaveBeenLastCalledWith(undefined);
    expect((await llamar('proyectos.huellaWordpress', '7.1.5')).ok).toBe(true);
    expect(f['huellaWordpress']).toHaveBeenLastCalledWith('7.1.5');
    for (const mala of ['../x', '7', 7, '7.1.5 && calc']) {
      expect((await llamar('proyectos.huellaWordpress', mala)).ok, String(mala)).toBe(false);
    }
    expect(f['huellaWordpress']).toHaveBeenCalledTimes(2);
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

  it('accesoBd.abrir abre el navegador desde el proceso principal y nunca devuelve la URL ni la clave', async () => {
    const { f, llamar } = montar();
    const url = 'http://127.0.0.1:8091/wolfcore-signon.php?wolfcore_token=' + 'A'.repeat(43);
    f['abrirBaseProyecto']!.mockResolvedValueOnce({ url, usuario: 'wolf_u_tienda', propio: true });
    sistema.abrirUrl.mockClear();
    const r = await llamar('accesoBd.abrir', 's1', 'phpmyadmin');
    expect(r).toEqual({ ok: true, valor: { usuario: 'wolf_u_tienda', propio: true } });
    expect(f['abrirBaseProyecto']).toHaveBeenCalledWith('s1', 'phpmyadmin');
    expect(sistema.abrirUrl).toHaveBeenCalledWith(url);
    expect(JSON.stringify(r)).not.toContain('wolfcore_token');
    // Una herramienta que no es Adminer ni phpMyAdmin no llega al núcleo.
    f['abrirBaseProyecto']!.mockClear();
    expect((await llamar('accesoBd.abrir', 's1', 'mysql-workbench')).ok).toBe(false);
    expect(f['abrirBaseProyecto']).not.toHaveBeenCalled();
  });

  it('instantaneas.*: motor SQL, base y id válidos; volver exige true y el id nunca es una ruta', async () => {
    const { crudo, llamar } = montar();
    const inst = (crudo as unknown as { instantaneas: Record<string, Mock> }).instantaneas;
    const id = '20261125-103000-abcdef';
    expect((await llamar('instantaneas.lista', 'mysql@8.4', 'tienda')).ok).toBe(true);
    expect(inst['lista']).toHaveBeenCalledWith('mysql@8.4', 'tienda');
    expect((await llamar('instantaneas.tomar', 'postgresql', 'tienda', 'antes de migrar')).ok).toBe(
      true,
    );
    expect(inst['tomar']).toHaveBeenCalledWith('postgresql', 'tienda', 'antes de migrar');
    expect((await llamar('instantaneas.tomar', 'mysql', 'tienda')).ok).toBe(true);
    expect(inst['tomar']).toHaveBeenLastCalledWith('mysql', 'tienda', '');
    const rvp = await llamar('instantaneas.vistaPrevia', 'mysql', 'tienda', id);
    expect(rvp, JSON.stringify(rvp)).toMatchObject({ ok: true });
    // El proceso principal comprueba el nombre escrito y pasa `true` al núcleo.
    expect((await llamar('instantaneas.volver', 'mysql', 'tienda', id, 'tienda')).ok).toBe(true);
    expect(inst['volver']).toHaveBeenCalledWith('mysql', 'tienda', id, true, {});
    expect(
      (
        await llamar('instantaneas.volver', 'mysql', 'tienda', id, 'tienda', {
          sinGuardarEstado: true,
          vale: 'vale-de-prueba-0123456789',
          confirmacion: 'tienda',
        })
      ).ok,
    ).toBe(true);
    expect(inst['volver']).toHaveBeenLastCalledWith('mysql', 'tienda', id, true, {
      sinGuardarEstado: true,
      vale: 'vale-de-prueba-0123456789',
    });
    expect((await llamar('instantaneas.listaInstancia', 'mysql@8.4')).ok).toBe(true);
    expect(inst['listaInstancia']).toHaveBeenCalledWith('mysql@8.4');
    expect((await llamar('instantaneas.papelera', 'mysql', 'tienda')).ok).toBe(true);
    expect((await llamar('instantaneas.recuperar', 'mysql', 'tienda', id)).ok).toBe(true);
    expect(inst['recuperar']).toHaveBeenCalledWith('mysql', 'tienda', id);
    expect((await llamar('instantaneas.borrar', 'mysql', 'tienda', id)).ok).toBe(true);
    for (const f of Object.values(inst)) f.mockClear();
    for (const [ruta, args] of [
      ['instantaneas.lista', ['mongodb', 'tienda']],
      ['instantaneas.lista', ['mysql', '../tienda']],
      ['instantaneas.lista', ['mysql', 'a b']],
      ['instantaneas.tomar', ['mysql', 'tienda', 'a\u0000b']],
      ['instantaneas.tomar', ['mysql', 'tienda', 'x'.repeat(201)]],
      ['instantaneas.tomar', ['mysql', 'tienda', 7]],
      ['instantaneas.vistaPrevia', ['mysql', 'tienda', '../x']],
      ['instantaneas.volver', ['mysql', 'tienda', id]],
      ['instantaneas.volver', ['mysql', 'tienda', id, true]],
      ['instantaneas.volver', ['mysql', 'tienda', id, 'otra']],
      ['instantaneas.volver', ['mysql', 'tienda', id, 'Tienda']],
      ['instantaneas.volver', ['mysql', 'tienda', id, '']],
      ['instantaneas.volver', ['mysql', 'tienda', id, 'tienda', { sinGuardarEstado: 'si' }]],
      // Sin vale, con vale raro o sin la segunda confirmación no se acepta sinGuardarEstado.
      ['instantaneas.volver', ['mysql', 'tienda', id, 'tienda', { sinGuardarEstado: true }]],
      [
        'instantaneas.volver',
        ['mysql', 'tienda', id, 'tienda', { sinGuardarEstado: true, confirmacion: 'tienda' }],
      ],
      [
        'instantaneas.volver',
        [
          'mysql',
          'tienda',
          id,
          'tienda',
          { sinGuardarEstado: true, vale: 'corto', confirmacion: 'tienda' },
        ],
      ],
      [
        'instantaneas.volver',
        [
          'mysql',
          'tienda',
          id,
          'tienda',
          { sinGuardarEstado: true, vale: 'vale-de-prueba-0123456789', confirmacion: 'otra' },
        ],
      ],
      ['instantaneas.volver', ['mysql', 'tienda', id, 'tienda', { otra: true }]],
      ['instantaneas.volver', ['mysql', 'tienda', 'C:\\x.sql', 'tienda']],
      ['instantaneas.volver', ['mysql', 'tienda', '20261125-103000-abcdef/../../x', 'tienda']],
      ['instantaneas.recuperar', ['mysql', 'tienda', '../x']],
      ['instantaneas.papelera', ['mongodb', 'tienda']],
      ['instantaneas.listaInstancia', ['mongodb']],
      ['instantaneas.borrar', ['mysql', 'tienda', '..']],
      ['instantaneas.borrar', ['mysql', 'tienda', '']],
    ] as [string, unknown[]][]) {
      expect((await llamar(ruta, ...args)).ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
    }
    for (const f of Object.values(inst)) expect(f).not.toHaveBeenCalled();
  });

  it('auditoriaClaves.*: selección acotada, usuario escrito para restablecer y la clave nunca vuelve en un error', async () => {
    const { crudo, llamar } = montar();
    const aud = (crudo as unknown as { auditoriaClaves: Record<string, Mock> }).auditoriaClaves;
    const sel = { tabla: 'usuarios', columnaUsuario: 'email', columnaHash: 'clave' };
    expect((await llamar('auditoriaClaves.auditar', 'mysql@8.4', 'tienda', sel)).ok).toBe(true);
    expect(aud['auditar']).toHaveBeenCalledWith({
      instancia: 'mysql@8.4',
      base: 'tienda',
      ...sel,
    });
    expect(
      (await llamar('auditoriaClaves.vistaPrevia', 'postgresql', 'tienda', sel, 'ana@x.test')).ok,
    ).toBe(true);
    expect(aud['vistaPreviaRestablecer']).toHaveBeenCalledWith(
      { instancia: 'postgresql', base: 'tienda', ...sel, usuario: 'ana@x.test' },
      false,
    );
    expect(
      (
        await llamar(
          'auditoriaClaves.restablecer',
          'mysql',
          'tienda',
          sel,
          'ana@x.test',
          'Clave-Nueva-Centinela-d20',
          'ana@x.test',
        )
      ).ok,
    ).toBe(true);
    expect(aud['restablecer']).toHaveBeenCalledWith({
      instancia: 'mysql',
      base: 'tienda',
      ...sel,
      usuario: 'ana@x.test',
      claveNueva: 'Clave-Nueva-Centinela-d20',
      confirmado: true,
    });
    // Sin el usuario escrito (o con otro), no llega al núcleo.
    aud['restablecer']!.mockClear();
    for (const escrito of [undefined, '', 'ANA@x.test', true, 'otro']) {
      const r = await llamar(
        'auditoriaClaves.restablecer',
        'mysql',
        'tienda',
        sel,
        'ana@x.test',
        'Clave-Nueva-Centinela-d20',
        escrito,
      );
      expect(r.ok, String(escrito)).toBe(false);
    }
    expect(aud['restablecer']).not.toHaveBeenCalled();
    // Entradas no válidas.
    for (const [ruta, args] of [
      ['auditoriaClaves.auditar', ['mongodb', 'tienda', sel]],
      ['auditoriaClaves.auditar', ['mysql', '../x', sel]],
      ['auditoriaClaves.auditar', ['mysql', 'tienda', { ...sel, extra: 'x' }]],
      ['auditoriaClaves.auditar', ['mysql', 'tienda', { ...sel, tabla: '' }]],
      ['auditoriaClaves.auditar', ['mysql', 'tienda', { ...sel, tabla: 'x'.repeat(129) }]],
      ['auditoriaClaves.auditar', ['mysql', 'tienda', { ...sel, tabla: 'a b' }]],
      ['auditoriaClaves.auditar', ['mysql', 'tienda', 'usuarios']],
      ['auditoriaClaves.vistaPrevia', ['mysql', 'tienda', sel, '']],
      ['auditoriaClaves.vistaPrevia', ['mysql', 'tienda', sel, 'ana', 'si']],
      ['auditoriaClaves.restablecer', ['mysql', 'tienda', sel, 'ana', '', 'ana']],
      ['auditoriaClaves.restablecer', ['mysql', 'tienda', sel, 'ana', 'x'.repeat(1025), 'ana']],
      ['auditoriaClaves.restablecer', ['mysql', 'tienda', sel, 'ana', 7, 'ana']],
    ] as [string, unknown[]][]) {
      expect((await llamar(ruta, ...args)).ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
    }
    expect(aud['auditar']).toHaveBeenCalledTimes(1);
    // Casillas de datos reales y bcrypt; progreso y cancelar; esquema opcional.
    aud['restablecer']!.mockClear();
    expect(
      (
        await llamar(
          'auditoriaClaves.restablecer',
          'postgresql',
          'tienda',
          { ...sel, esquema: 'ventas' },
          'ana@x.test',
          'Clave-Nueva-Centinela-d20',
          'ana@x.test',
          true,
          true,
        )
      ).ok,
    ).toBe(true);
    expect(aud['restablecer']).toHaveBeenCalledWith(
      expect.objectContaining({ esquema: 'ventas', aBcrypt: true, confirmarDatosReales: true }),
    );
    for (const malo of ['si', 1, null]) {
      expect(
        (
          await llamar(
            'auditoriaClaves.restablecer',
            'mysql',
            'tienda',
            sel,
            'ana@x.test',
            'Clave-Nueva-Centinela-d20',
            'ana@x.test',
            undefined,
            malo,
          )
        ).ok,
      ).toBe(false);
    }
    expect((await llamar('auditoriaClaves.progreso')).ok).toBe(true);
    expect((await llamar('auditoriaClaves.cancelar')).ok).toBe(true);
    expect(aud['progreso']).toHaveBeenCalledTimes(1);
    expect(aud['cancelar']).toHaveBeenCalledTimes(1);
    // Un error del núcleo no devuelve la clave nueva.
    aud['restablecer']!.mockRejectedValueOnce(
      new Error('falló con Clave-Nueva-Centinela-d20 dentro'),
    );
    const mal = await llamar(
      'auditoriaClaves.restablecer',
      'mysql',
      'tienda',
      sel,
      'ana@x.test',
      'Clave-Nueva-Centinela-d20',
      'ana@x.test',
    );
    expect(mal.ok).toBe(false);
    expect(JSON.stringify(mal)).not.toContain('Clave-Nueva-Centinela-d20');
  });

  it('sistema.abrirEditor abre la carpeta del sitio por su id (nunca una ruta)', async () => {
    const { f, llamar } = montar();
    expect((await llamar('sistema.abrirEditor', 's1')).ok).toBe(true);
    expect(f['abrirEditor']).toHaveBeenCalledWith('s1', null);
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

describe('IPC de IA en la nube', () => {
  // Clave claramente falsa; nunca debe salir del proceso principal.
  const CLAVE = 'sk-falso-CENTINELA-ipc-000000000000wxyz';

  function secretosIa(inicial: string | null = CLAVE) {
    const guardadas = new Map<string, string>();
    if (inicial) guardadas.set('ia:openai', inicial);
    return {
      guardadas,
      guardar: vi.fn(async (id: string, v: string) => void guardadas.set(id, v)),
      leer: vi.fn(async (id: string) => guardadas.get(id) ?? null),
      borrar: vi.fn(async (id: string) => void guardadas.delete(id)),
      hay: vi.fn((id: string) => guardadas.has(id)),
      estado: vi.fn(async (id: string) => {
        const v = guardadas.get(id);
        return { configurada: !!v, final: v ? v.slice(-4) : null };
      }),
      guardarTokenGithub: vi.fn(),
      leerTokenGithub: vi.fn(async () => null),
      borrarTokenGithub: vi.fn(),
      hayTokenGithub: vi.fn(() => false),
    };
  }

  function montarIa(secretos = secretosIa()) {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, () => true, undefined, {
      secretos: secretos as never,
    });
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string; codigo?: string; datos?: Record<string, unknown> };
      };
    const ia = (crudo as unknown as { ia: Record<string, Mock> }).ia;
    return { llamar, ia, secretos };
  }

  const PROVEEDOR = { id: 'openai', tipo: 'openai', nombre: 'OpenAI', urlBase: null, modelo: null };
  const OPCIONES_ENV = { confirmado: true, agregarGitignore: true };

  it('rechaza argumentos inválidos de cada familia con un código, sin llamar al núcleo', async () => {
    const { llamar, ia, secretos } = montarIa();
    const casos: [string, unknown[], string][] = [
      ['ia.guardarProveedor', ['no-objeto'], 'ia.argumento_invalido'],
      ['ia.guardarProveedor', [{ ...PROVEEDOR, id: 'Con Espacios' }], 'ia.argumento_invalido'],
      ['ia.guardarProveedor', [{ ...PROVEEDOR, tipo: 'otro' }], 'ia.argumento_invalido'],
      ['ia.guardarProveedor', [{ ...PROVEEDOR, nombre: '' }], 'ia.argumento_invalido'],
      ['ia.guardarProveedor', [{ ...PROVEEDOR, nombre: 'a\nb' }], 'ia.argumento_invalido'],
      [
        'ia.guardarProveedor',
        [{ ...PROVEEDOR, urlBase: `https://a.example/${'x'.repeat(600)}` }],
        'ia.argumento_invalido',
      ],
      ['ia.guardarProveedor', [{ ...PROVEEDOR, modelo: 7 }], 'ia.argumento_invalido'],
      // Una clave pegada en la configuración no se acepta (nunca va a config.json).
      ['ia.guardarProveedor', [{ ...PROVEEDOR, clave: CLAVE }], 'ia.argumento_invalido'],
      ['ia.guardarProveedor', [PROVEEDOR, 'si'], 'ia.argumento_invalido'],
      ['ia.borrarProveedor', ['../openai'], 'ia.argumento_invalido'],
      ['ia.borrarProveedor', ['openai', { limpiarRespaldos: 'si' }], 'ia.argumento_invalido'],
      ['ia.guardarClave', ['openai', 'con espacios'], 'ia.clave_mal_formada'],
      ['ia.guardarClave', ['openai', 'x'.repeat(4097)], 'ia.clave_mal_formada'],
      ['ia.guardarClave', ['openai', 'línea\nnueva'], 'ia.clave_mal_formada'],
      ['ia.guardarClave', ['openai', 12345], 'ia.clave_mal_formada'],
      ['ia.guardarClave', ['OPENAI', CLAVE], 'ia.argumento_invalido'],
      ['ia.borrarClave', ['openai', { limpiarRespaldos: 1 }], 'ia.argumento_invalido'],
      ['ia.borrarClave', ['openai', { otra: true }], 'ia.argumento_invalido'],
      ['ia.estadoClave', [42], 'ia.argumento_invalido'],
      ['ia.respaldosClave', [''], 'ia.argumento_invalido'],
      ['ia.probarConexion', [null], 'ia.argumento_invalido'],
      ['ia.probarMensaje', ['openai', 'gpt-a'], 'ia.mensaje_sin_confirmar'],
      ['ia.probarMensaje', ['openai', 'gpt-a', 'true'], 'ia.mensaje_sin_confirmar'],
      ['ia.probarMensaje', ['openai', 'gpt-a', 1], 'ia.mensaje_sin_confirmar'],
      ['ia.probarMensaje', ['openai', '../../x', true], 'ia.modelo_invalido'],
      ['ia.previsualizarEnv', ['tienda\n', 'openai'], 'ia.argumento_invalido'],
      ['ia.previsualizarEnv', ['tienda', 'openai', 'mal modelo'], 'ia.modelo_invalido'],
      ['ia.escribirEnv', ['tienda', 'openai'], 'ia.env_sin_confirmar'],
      ['ia.escribirEnv', ['tienda', 'openai', { agregarGitignore: true }], 'ia.env_sin_confirmar'],
      [
        'ia.escribirEnv',
        ['tienda', 'openai', { confirmado: 'true', agregarGitignore: true }],
        'ia.env_sin_confirmar',
      ],
      ['ia.escribirEnv', ['tienda', 'openai', { confirmado: true }], 'ia.argumento_invalido'],
      [
        'ia.escribirEnv',
        ['tienda', 'openai', { ...OPCIONES_ENV, aceptarVersionado: 'si' }],
        'ia.argumento_invalido',
      ],
      [
        'ia.escribirEnv',
        ['tienda', 'openai', { ...OPCIONES_ENV, reemplazarAjenas: 1 }],
        'ia.argumento_invalido',
      ],
      [
        'ia.escribirEnv',
        ['tienda', 'openai', { ...OPCIONES_ENV, carpeta: 'C:\\otro' }],
        'ia.argumento_invalido',
      ],
    ];
    for (const [ruta, args, codigo] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo, `${ruta} ${JSON.stringify(args)}`).toBe(codigo);
      expect(JSON.stringify(r)).not.toContain(CLAVE);
    }
    for (const [nombre, m] of Object.entries(ia)) {
      if (nombre === 'proveedor') continue;
      expect(m, nombre).not.toHaveBeenCalled();
    }
    expect(secretos.guardar).not.toHaveBeenCalled();
    expect(secretos.borrar).not.toHaveBeenCalled();
  });

  it('ninguna respuesta ni error de las rutas de IA contiene la clave', async () => {
    const { llamar, ia } = montarIa();
    ia['proveedores']!.mockResolvedValue([PROVEEDOR]);
    const salidas: unknown[] = [];
    salidas.push(await llamar('ia.proveedores'));
    salidas.push(await llamar('ia.estadoClave', 'openai'));
    salidas.push(await llamar('ia.guardarClave', 'openai', CLAVE));
    salidas.push(await llamar('ia.respaldosClave', 'openai'));
    salidas.push(await llamar('ia.probarConexion', 'openai'));
    salidas.push(await llamar('ia.probarMensaje', 'openai', 'gpt-a', true));
    salidas.push(await llamar('ia.previsualizarEnv', 'tienda', 'openai', 'gpt-a'));
    salidas.push(await llamar('ia.escribirEnv', 'tienda', 'openai', OPCIONES_ENV));
    // Errores del núcleo que repiten la clave (mensaje y datos) salen limpios.
    ia['probarMensaje']!.mockRejectedValueOnce(
      new ErrorWolf('ia.respuesta_rara', `falló con ${CLAVE}`, { detalle: `eco ${CLAVE}` }),
    );
    salidas.push(await llamar('ia.probarMensaje', 'openai', 'gpt-a', true));
    ia['escribirEnv']!.mockRejectedValueOnce(new Error(`no se pudo: ${CLAVE}`));
    salidas.push(await llamar('ia.escribirEnv', 'tienda', 'openai', OPCIONES_ENV));
    // Un resultado que la llevara (eco del proveedor, bloque sin enmascarar) no sale.
    ia['probarMensaje']!.mockResolvedValueOnce({ texto: `eco ${CLAVE}`, latenciaMs: 1 });
    const eco = await llamar('ia.probarMensaje', 'openai', 'gpt-a', true);
    expect(eco.ok).toBe(false);
    salidas.push(eco);
    ia['previsualizarEnv']!.mockResolvedValueOnce({ bloque: `OPENAI_API_KEY=${CLAVE}` });
    const bloque = await llamar('ia.previsualizarEnv', 'tienda', 'openai');
    expect(bloque.ok).toBe(false);
    salidas.push(bloque);
    salidas.push(await llamar('ia.borrarClave', 'openai', { limpiarRespaldos: true }));
    expect(JSON.stringify(salidas)).not.toContain(CLAVE);
    expect(JSON.stringify(salidas)).not.toContain('CENTINELA');
  });

  it('la clave va del IPC al almacén; el renderer solo ve {configurada, final}', async () => {
    const { llamar, secretos } = montarIa(secretosIa(null));
    const r = await llamar('ia.guardarClave', 'openai', `  ${CLAVE}  `);
    expect(r).toEqual({ ok: true, valor: { configurada: true, final: 'wxyz' } });
    expect(secretos.guardar).toHaveBeenCalledWith('ia:openai', CLAVE);
    expect(await llamar('ia.estadoClave', 'openai')).toEqual({
      ok: true,
      valor: { configurada: true, final: 'wxyz' },
    });
  });

  it('la clave sale del almacén hacia el núcleo, nunca del renderer', async () => {
    const { llamar, ia } = montarIa();
    await llamar('ia.probarConexion', 'openai');
    expect(ia['probarConexion']).toHaveBeenCalledWith('openai', CLAVE);
    await llamar('ia.probarMensaje', 'openai', 'gpt-a', true);
    expect(ia['probarMensaje']).toHaveBeenCalledWith('openai', CLAVE, 'gpt-a', true);
    await llamar('ia.previsualizarEnv', 'tienda', 'openai');
    expect(ia['previsualizarEnv']).toHaveBeenCalledWith('tienda', 'openai', CLAVE, undefined);
    await llamar('ia.escribirEnv', 'tienda', 'openai', {
      ...OPCIONES_ENV,
      modelo: 'gpt-a',
      aceptarVersionado: true,
      reemplazarAjenas: false,
    });
    expect(ia['escribirEnv']).toHaveBeenCalledWith('tienda', 'openai', CLAVE, {
      confirmado: true,
      agregarGitignore: true,
      modelo: 'gpt-a',
      aceptarVersionado: true,
    });
  });

  it('proveedores trae el estado de la clave; guardar pasa si ya hay clave y la confirmación', async () => {
    const { llamar, ia } = montarIa();
    ia['proveedores']!.mockResolvedValue([PROVEEDOR, { ...PROVEEDOR, id: 'groq' }]);
    const r = await llamar('ia.proveedores');
    expect(r.valor).toEqual([
      { ...PROVEEDOR, clave: { configurada: true, final: 'wxyz' } },
      { ...PROVEEDOR, id: 'groq', clave: { configurada: false, final: null } },
    ]);
    await llamar('ia.guardarProveedor', PROVEEDOR);
    expect(ia['guardarProveedor']).toHaveBeenLastCalledWith(PROVEEDOR, { tieneClave: true });
    await llamar('ia.guardarProveedor', { ...PROVEEDOR, id: 'groq' }, true);
    expect(ia['guardarProveedor']).toHaveBeenLastCalledWith(
      { ...PROVEEDOR, id: 'groq' },
      { tieneClave: false, confirmarCambioUrl: true },
    );
  });

  it('borrar la clave con limpiarRespaldos borra antes las copias del .env que la tienen', async () => {
    const { llamar, ia, secretos } = montarIa();
    ia['limpiarRespaldosDeClave']!.mockResolvedValueOnce({ sitios: 2 });
    const r = await llamar('ia.borrarClave', 'openai', { limpiarRespaldos: true });
    expect(r).toEqual({ ok: true, valor: { sitiosLimpios: 2 } });
    expect(ia['limpiarRespaldosDeClave']).toHaveBeenCalledWith(CLAVE);
    expect(secretos.guardadas.has('ia:openai')).toBe(false);
    // Sin la opción, las copias quedan.
    const s2 = montarIa();
    await s2.llamar('ia.borrarClave', 'openai');
    expect(s2.ia['limpiarRespaldosDeClave']).not.toHaveBeenCalled();
    expect(s2.secretos.borrar).toHaveBeenCalledWith('ia:openai');
  });

  it('borrar un proveedor borra también su clave', async () => {
    const { llamar, ia, secretos } = montarIa();
    await llamar('ia.borrarProveedor', 'openai');
    expect(ia['borrarProveedor']).toHaveBeenCalledWith('openai');
    expect(secretos.borrar).toHaveBeenCalledWith('ia:openai');
  });

  it('borrar un proveedor borra primero la clave y después la configuración', async () => {
    const { llamar, ia, secretos } = montarIa();
    const orden: string[] = [];
    secretos.borrar.mockImplementationOnce(async (id: string) => {
      orden.push(`clave:${id}`);
      secretos.guardadas.delete(id);
    });
    ia['borrarProveedor']!.mockImplementationOnce(async (id: string) => {
      orden.push(`config:${id}`);
    });
    await llamar('ia.borrarProveedor', 'openai');
    expect(orden).toEqual(['clave:ia:openai', 'config:openai']);
    // Si no se pudo borrar la clave, la configuración queda (no hay clave huérfana).
    const s2 = montarIa();
    s2.secretos.borrar.mockRejectedValueOnce(new Error('disco lleno'));
    const r = await s2.llamar('ia.borrarProveedor', 'openai');
    expect(r.ok).toBe(false);
    expect(s2.ia['borrarProveedor']).not.toHaveBeenCalled();
  });

  it('un proveedor nuevo con una clave huérfana del mismo id la borra antes de guardar', async () => {
    const { llamar, ia, secretos } = montarIa();
    ia['proveedores']!.mockResolvedValue([]);
    const r = await llamar('ia.guardarProveedor', {
      ...PROVEEDOR,
      tipo: 'compatible',
      urlBase: 'https://otro.example/v1',
    });
    expect(r.ok).toBe(true);
    expect(secretos.borrar).toHaveBeenCalledWith('ia:openai');
    expect(secretos.guardadas.has('ia:openai')).toBe(false);
    expect(ia['guardarProveedor']).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'openai' }),
      { tieneClave: false },
    );
  });

  it('el tipo ollama no se guarda como proveedor en la nube (el diálogo nunca lo manda)', async () => {
    const { llamar, ia } = montarIa();
    const r = await llamar('ia.guardarProveedor', { ...PROVEEDOR, id: 'local', tipo: 'ollama' });
    expect(r.error?.codigo).toBe('ia.argumento_invalido');
    expect(ia['guardarProveedor']).not.toHaveBeenCalled();
  });

  it('una clave corta no bloquea respuestas ni destroza errores por subcadena', async () => {
    const { llamar, ia } = montarIa(secretosIa('x'));
    ia['probarConexion']!.mockResolvedValueOnce({
      ok: true,
      latenciaMs: 1,
      modelos: ['mixtral-8x7b', 'llama-3.1-70b'],
    });
    const r = await llamar('ia.probarConexion', 'openai');
    expect(r).toMatchObject({ ok: true, valor: { modelos: ['mixtral-8x7b', 'llama-3.1-70b'] } });
    ia['probarConexion']!.mockRejectedValueOnce(
      new Error('error de sintaxis con x en la respuesta'),
    );
    const e = await llamar('ia.probarConexion', 'openai');
    expect(e.error?.mensaje).toContain('error de sintaxis con *** en la respuesta');
    const s2 = montarIa(secretosIa('lm-studio'));
    s2.ia['previsualizarEnv']!.mockResolvedValueOnce({ bloque: 'APP_NAME=lm-studio-app' });
    expect((await s2.llamar('ia.previsualizarEnv', 'tienda', 'openai')).ok).toBe(true);
  });

  it('una clave guardada que no se puede descifrar da ia.clave_ilegible', async () => {
    const secretos = secretosIa();
    secretos.leer.mockRejectedValueOnce(new Error('No se pudo descifrar'));
    const { llamar, ia } = montarIa(secretos);
    const r = await llamar('ia.probarConexion', 'openai');
    expect(r.error?.codigo).toBe('ia.clave_ilegible');
    expect(ia['probarConexion']).not.toHaveBeenCalled();
  });
});

describe('IPC de versiones e instancias (Task 19)', () => {
  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string; codigo?: string };
      };
    return { llamar, n: crudo as unknown as Record<string, Mock> };
  }

  it('las rutas nuevas están en la lista blanca', () => {
    for (const r of [
      'catalogo.versiones',
      'catalogo.silenciar',
      'instalador.desinstalar',
      'instancias.lista',
      'instancias.crear',
      'instancias.iniciar',
      'instancias.detener',
      'instancias.puerto',
      'instancias.predeterminar',
      'instancias.quitar',
      'instancias.borrarDatos',
      'instancias.desbloquear',
      'servicios.planActualizar',
      'servicios.actualizar',
      'servicios.nuevaRama',
      'servicios.predeterminada',
      'servicios.respaldosDatos',
      'servicios.borrarRespaldoDatos',
    ]) {
      expect(RUTAS_IPC).toContain(r);
    }
  });

  it('catalogo.versiones valida servicio y filtro (solo rama/todas/refrescar)', async () => {
    const { llamar, n } = montar();
    expect((await llamar('catalogo.versiones', 'mysql', { rama: '8.4', todas: true })).ok).toBe(
      true,
    );
    expect(n['versionesServicio']).toHaveBeenCalledWith('mysql', { rama: '8.4', todas: true });
    for (const malo of [
      ['mongosh'],
      ['../php'],
      ['mysql', { url: 'https://x' }],
      ['mysql', { rama: '../8' }],
    ]) {
      expect((await llamar('catalogo.versiones', ...malo)).ok).toBe(false);
    }
    expect(n['versionesServicio']).toHaveBeenCalledTimes(1);
  });

  it('instalador.instalar: fuera del catálogo falla; sin confirmar sin huella no se confirma', async () => {
    const { llamar, n } = montar();
    const inst = (n as unknown as { instalador: { instalar: Mock } }).instalador.instalar;
    const fuera = await llamar('instalador.instalar', { servicio: 'mysql', version: '9.9.9' });
    expect(fuera.error?.codigo).toBe('catalogo.version_no_encontrada');
    expect(inst).not.toHaveBeenCalled();
    // Sin confirmar: el núcleo exige la huella fuerte (rechaza con `catalogo.sin_huella`).
    inst.mockRejectedValueOnce(new ErrorWolf('catalogo.sin_huella', 'sin huella'));
    const sin = await llamar('instalador.instalar', { servicio: 'mysql', version: '1.28.0' });
    expect(sin.error?.codigo).toBe('catalogo.sin_huella');
    expect(inst.mock.lastCall).toHaveLength(1);
    // Solo `true` exacto confirma.
    for (const c of ['true', 1, {}]) {
      const r = await llamar('instalador.instalar', {
        servicio: 'mysql',
        version: '1.28.0',
        confirmarSinHuella: c,
      });
      expect(r.ok).toBe(false);
    }
    expect(inst).toHaveBeenCalledTimes(1);
  });

  it('desinstalar solo quita binarios: nunca llama a borrar datos', async () => {
    const { llamar, n } = montar();
    expect((await llamar('instalador.desinstalar', 'mysql', '8.0.44')).ok).toBe(true);
    expect(n['desinstalarVersion']).toHaveBeenCalledWith('mysql', '8.0.44');
    expect(n['borrarDatosInstancia']).not.toHaveBeenCalled();
    expect(n['borrarDatosServicio']).not.toHaveBeenCalled();
    expect((await llamar('instalador.desinstalar', 'mysql', '../data')).ok).toBe(false);
  });

  it('instancias.borrarDatos pasa la confirmación tal cual (el núcleo la compara con el id)', async () => {
    const { llamar, n } = montar();
    n['borrarDatosInstancia']!.mockRejectedValueOnce(
      new ErrorWolf('servicios.confirmacion_borrado', 'escriba mysql@8.0', {
        nombre: 'mysql@8.0',
        id: 'mysql@8.0',
      }),
    );
    const r = await llamar('instancias.borrarDatos', 'mysql@8.0', 'mysql');
    expect(r.error?.codigo).toBe('servicios.confirmacion_borrado');
    expect(n['borrarDatosInstancia']).toHaveBeenCalledWith('mysql@8.0', 'mysql');
    expect((await llamar('instancias.borrarDatos', 'mysql@../x', 'mysql@../x')).ok).toBe(false);
    expect((await llamar('instancias.borrarDatos', 'nginx@1', 'nginx@1')).ok).toBe(false);
  });

  it('actualizar y nueva rama: solo ids, versiones y `confirmarSinHuella: true`', async () => {
    const { llamar, n } = montar();
    expect((await llamar('servicios.actualizar', 'mysql@8.4', '8.4.15')).ok).toBe(true);
    expect(n['actualizarServicio']).toHaveBeenLastCalledWith('mysql@8.4', '8.4.15', {});
    await llamar('servicios.actualizar', 'mysql@8.4', '8.4.15', { confirmarSinHuella: true });
    expect(n['actualizarServicio']).toHaveBeenLastCalledWith('mysql@8.4', '8.4.15', {
      confirmarSinHuella: true,
    });
    for (const o of [{ confirmarSinHuella: 'si' }, { url: 'https://x' }]) {
      expect((await llamar('servicios.actualizar', 'mysql@8.4', '8.4.15', o)).ok).toBe(false);
    }
    await llamar('servicios.nuevaRama', 'postgresql', '18.1', { copiarDesde: 'postgresql@17' });
    expect(n['nuevaRamaServicio']).toHaveBeenLastCalledWith('postgresql', '18.1', {
      copiarDesde: 'postgresql@17',
    });
    // Copiar desde otro motor no se acepta.
    const otro = await llamar('servicios.nuevaRama', 'postgresql', '18.1', {
      copiarDesde: 'mysql@8.4',
    });
    expect(otro.ok).toBe(false);
  });

  it('borrar una copia de datos exige `true` exacto y ids (nunca una ruta)', async () => {
    const { llamar, n } = montar();
    const ref = { servicio: 'mysql', clave: '8.4', tipo: 'respaldo', sello: '20261123-100000' };
    expect((await llamar('servicios.borrarRespaldoDatos', ref, true)).ok).toBe(true);
    expect(n['borrarRespaldoDatos']).toHaveBeenCalledWith(ref, true);
    const malos: [unknown, unknown][] = [
      [ref, 'true'],
      [{ ...ref, clave: '..' }, true],
      [{ ...ref, tipo: 'actual' }, true],
      [{ ...ref, carpeta: 'C:/x' }, true],
    ];
    for (const [r, c] of malos) {
      expect((await llamar('servicios.borrarRespaldoDatos', r, c)).ok).toBe(false);
    }
    expect(n['borrarRespaldoDatos']).toHaveBeenCalledTimes(1);
  });

  it('desbloquear: confirmación y sello opcional bien formado', async () => {
    const { llamar, n } = montar();
    await llamar('instancias.desbloquear', 'mysql@8.4', {
      confirmacion: 'mysql@8.4',
      respaldo: '20261123-100000',
    });
    expect(n['desbloquearInstancia']).toHaveBeenCalledWith('mysql@8.4', {
      confirmacion: 'mysql@8.4',
      respaldo: '20261123-100000',
    });
    const malo = await llamar('instancias.desbloquear', 'mysql@8.4', {
      confirmacion: 'mysql@8.4',
      respaldo: '../../x',
    });
    expect(malo.ok).toBe(false);
  });

  it('bd.* aceptan una instancia del mismo motor', async () => {
    const { llamar, n } = montar();
    expect((await llamar('bd.listar', 'mysql@8.0')).ok).toBe(true);
    expect(n['listarBases']).toHaveBeenCalledWith('mysql@8.0');
    expect((await llamar('bd.tieneTablas', 'postgresql@17', 'tienda')).ok).toBe(true);
    expect(n['tieneTablas']).toHaveBeenCalledWith('postgresql@17', 'tienda');
    expect((await llamar('bd.listar', 'redis@7')).ok).toBe(false);
    expect((await llamar('bd.tieneTablas', 'mongodb@8.0', 'x')).ok).toBe(false);
  });
});

/* ───────────── Gestor de .env y clave del usuario propio de la base (D16) ───────────── */

describe('IPC del gestor de .env', () => {
  const CENTINELA = 'centinela-secreta-d';

  function montarEnv() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const guardadas = new Map<string, string>();
    const secretos = {
      guardadas,
      disponible: vi.fn(() => true),
      guardar: vi.fn(async (id: string, v: string) => void guardadas.set(id, v)),
      leer: vi.fn(async (id: string) => guardadas.get(id) ?? null),
      borrar: vi.fn(async (id: string) => void guardadas.delete(id)),
      hay: vi.fn((id: string) => guardadas.has(id)),
      estado: vi.fn(async () => ({ configurada: false, final: null })),
      guardarTokenGithub: vi.fn(),
      leerTokenGithub: vi.fn(async () => null),
      borrarTokenGithub: vi.fn(),
      hayTokenGithub: vi.fn(() => false),
    };
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, () => true, undefined, {
      secretos: secretos as never,
    });
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string; codigo?: string };
      };
    const env = (crudo as unknown as { env: Record<string, Mock> }).env;
    const f = crudo as unknown as Record<string, Mock>;
    return { llamar, env, f, secretos };
  }

  it('las rutas llaman al gestor con ids y pedidos validados', async () => {
    const { llamar, env } = montarEnv();
    expect((await llamar('env.ver', 's1')).ok).toBe(true);
    expect(env['ver']).toHaveBeenCalledWith('s1');
    expect((await llamar('env.revelar', 's1', 'DB_PASSWORD')).valor).toBe('valor');
    expect(env['revelar']).toHaveBeenCalledWith('s1', 'DB_PASSWORD');
    const pedido = { cambios: { A: '1', B: null }, desdeEjemplo: ['C'], bloques: ['redis'] };
    await llamar('env.vistaPrevia', 's1', pedido);
    expect(env['vistaPrevia']).toHaveBeenCalledWith('s1', pedido);
    const huella = 'a'.repeat(64);
    await llamar('env.guardar', 's1', pedido, {
      confirmado: true,
      aceptarVersionado: true,
      huella,
    });
    expect(env['guardar']).toHaveBeenCalledWith('s1', pedido, true, {
      aceptarVersionado: true,
      huella,
    });
    await llamar('env.restaurarCopia', 's1', 'env-s1-x.respaldo', { confirmado: true });
    expect(env['restaurarCopia']).toHaveBeenCalledWith('s1', 'env-s1-x.respaldo', true);
  });

  it('guardar, volver a una copia y usar usuario propio exigen confirmado === true', async () => {
    const { llamar, env, f } = montarEnv();
    for (const o of [{}, { confirmado: false }, { confirmado: 'si' }, undefined]) {
      const g = await llamar('env.guardar', 's1', { cambios: { A: '1' } }, o);
      expect(g.ok).toBe(false);
      expect((await llamar('env.restaurarCopia', 's1', 'x', o)).ok).toBe(false);
      expect((await llamar('env.usarUsuarioPropio', 's1', o)).ok).toBe(false);
    }
    expect(env['guardar']).not.toHaveBeenCalled();
    expect(env['restaurarCopia']).not.toHaveBeenCalled();
    expect(f['usarUsuarioPropio']).not.toHaveBeenCalled();
  });

  it('menor 6: env.guardar exige la huella de la vista previa (64 hex)', async () => {
    const { llamar, env } = montarEnv();
    for (const huella of [undefined, '', 'x', 'A'.repeat(64), 7]) {
      const r = await llamar(
        'env.guardar',
        's1',
        { cambios: { A: '1' } },
        { confirmado: true, huella },
      );
      expect(r.ok, String(huella)).toBe(false);
    }
    expect(env['guardar']).not.toHaveBeenCalled();
  });

  it('I3: usar usuario propio sin cifrado disponible: secretos.sin_cifrado y el núcleo no se entera', async () => {
    const { llamar, f, secretos } = montarEnv();
    secretos.disponible.mockReturnValue(false);
    const r = await llamar('env.usarUsuarioPropio', 's1', { confirmado: true });
    expect(r.ok).toBe(false);
    expect(r.error?.codigo).toBe('secretos.sin_cifrado');
    expect(f['usarUsuarioPropio']).not.toHaveBeenCalled();
    expect(secretos.guardar).not.toHaveBeenCalled();
  });

  it('compartirUsuario (confirmación aparte) llega al núcleo solo si es true', async () => {
    const { llamar, f } = montarEnv();
    f['usarUsuarioPropio']!.mockResolvedValue({ usuario: 'wolf_u_x', copia: null });
    await llamar('env.usarUsuarioPropio', 's1', { confirmado: true, compartirUsuario: true });
    expect(f['usarUsuarioPropio']!.mock.calls[0]![1]).toMatchObject({ compartirUsuario: true });
    await llamar('env.usarUsuarioPropio', 's1', { confirmado: true });
    expect(f['usarUsuarioPropio']!.mock.calls[1]![1]).not.toHaveProperty('compartirUsuario');
    expect(
      (await llamar('env.usarUsuarioPropio', 's1', { confirmado: true, compartirUsuario: 'si' }))
        .ok,
    ).toBe(false);
  });

  it('I2: usar usuario propio guarda la clave que el núcleo decide usar (la reutilizada)', async () => {
    const { llamar, f, secretos } = montarEnv();
    f['usarUsuarioPropio']!.mockImplementation(
      async (_id: string, o: { guardarClave: (c: string) => Promise<void> }) => {
        await o.guardarClave('clave-de-otro-sitio');
        return { usuario: 'wolf_u_x', copia: null };
      },
    );
    expect((await llamar('env.usarUsuarioPropio', 's1', { confirmado: true })).ok).toBe(true);
    expect(secretos.guardadas.get('bd:s1')).toBe('clave-de-otro-sitio');
  });

  it('rechaza pedidos mal formados sin llamar al núcleo ni repetir el valor en el error', async () => {
    const { llamar, env } = montarEnv();
    const malos: unknown[] = [
      'x',
      { cambios: { 'MAL NOMBRE': CENTINELA } },
      { cambios: { A: 5 } },
      { cambios: { A: 'x'.repeat(5000) } },
      { cambios: 'x' },
      { desdeEjemplo: 'A' },
      { desdeEjemplo: ['no valida'] },
      { bloques: ['otro'] },
      { rutas: ['C:/'] },
    ];
    for (const m of malos) {
      const r = await llamar('env.vistaPrevia', 's1', m);
      expect(r.ok, JSON.stringify(m)?.slice(0, 40)).toBe(false);
      expect(JSON.stringify(r)).not.toContain(CENTINELA);
    }
    for (const clave of ['', 'con espacio', '1A', 7, 'x'.repeat(200)]) {
      expect((await llamar('env.revelar', 's1', clave)).ok, String(clave)).toBe(false);
    }
    expect(env['vistaPrevia']).not.toHaveBeenCalled();
    expect(env['revelar']).not.toHaveBeenCalled();
  });

  it('usar usuario propio: la clave la genera el main, se guarda como bd:<sitio> y no vuelve al renderer', async () => {
    const { llamar, f, secretos } = montarEnv();
    let clave = '';
    f['usarUsuarioPropio']!.mockImplementation(
      async (_id: string, o: { claveBd: string; guardarClave: (c: string) => Promise<void> }) => {
        clave = o.claveBd;
        await o.guardarClave(o.claveBd);
        return { usuario: 'wolf_u_x', copia: 'env-s1.respaldo' };
      },
    );
    const r = await llamar('env.usarUsuarioPropio', 's1', { confirmado: true });
    expect(r).toEqual({ ok: true, valor: { usuario: 'wolf_u_x', copia: 'env-s1.respaldo' } });
    expect(clave).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(secretos.guardadas.get('bd:s1')).toBe(clave);
    expect(JSON.stringify(r)).not.toContain(clave);
  });

  it('un error del núcleo que repitiera la clave sale sin ella', async () => {
    const { llamar, f } = montarEnv();
    f['usarUsuarioPropio']!.mockImplementation(async (_id: string, o: { claveBd: string }) => {
      throw new Error(`falló con ${o.claveBd}`);
    });
    const r = await llamar('env.usarUsuarioPropio', 's1', { confirmado: true });
    expect(r.ok).toBe(false);
    expect(r.error?.mensaje).toBe('falló con ***');
  });

  it('borrar un sitio borra también la clave de su usuario de base', async () => {
    const { llamar, f, secretos } = montarEnv();
    f['borrarSitio'] = vi.fn(async () => undefined);
    secretos.guardadas.set('bd:s1', 'x');
    await llamar('sitios.borrar', 's1');
    expect(secretos.guardadas.has('bd:s1')).toBe(false);
  });

  it('ejecutar una receta: un error que repitiera la clave guardada sale sin ella', async () => {
    const { llamar, f, secretos } = montarEnv();
    secretos.guardadas.set('bd:s1', CENTINELA);
    f['ejecutarReceta'] = vi.fn(async () => {
      throw new Error(`conexión con ${CENTINELA}`);
    });
    const r = await llamar('proyectos.ejecutarReceta', 's1');
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
  });
});

describe('correo: proveedores SMTP remotos (D22)', () => {
  const CENTINELA = 'centinela-secreta-d';
  const HUELLA = 'a'.repeat(64);

  function montarSmtp(clave: string | null = CENTINELA) {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock> & {
      smtp: { guardar: Mock; borrar: Mock; probar: Mock };
    };
    const secretos = {
      guardar: vi.fn(async () => undefined),
      leer: vi.fn(async () => clave),
      borrar: vi.fn(async () => undefined),
      hay: vi.fn(() => clave !== null),
      estado: vi.fn(async () =>
        clave === null ? { configurada: false, final: null } : { configurada: true, final: 'ta-d' },
      ),
      disponible: vi.fn(() => true),
      guardarTokenGithub: vi.fn(),
      leerTokenGithub: vi.fn(async () => null),
      borrarTokenGithub: vi.fn(),
      hayTokenGithub: vi.fn(() => false),
    };
    (crudo.config.leer as Mock).mockResolvedValue({ proyectos: { carpetaVigilada: null } });
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, () => true, undefined, {
      secretos,
      seguimientos: new Seguimientos(),
      metricas: new ControlMetricas(nucleo),
    });
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string; codigo?: string };
      };
    return { f, secretos, llamar };
  }

  it('la lista solo lleva {configurada, final} de la clave', async () => {
    const { llamar } = montarSmtp();
    const r = await llamar('correo.proveedores');
    expect(r.ok).toBe(true);
    expect((r.valor as { clave: unknown }[])[0]!.clave).toEqual({
      configurada: true,
      final: 'ta-d',
    });
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
  });

  it('guardarClave va al almacén (smtp:<id>) y devuelve solo el estado', async () => {
    const { llamar, secretos } = montarSmtp();
    const r = await llamar('correo.guardarClave', 'resend', CENTINELA);
    expect(secretos.guardar).toHaveBeenCalledWith('smtp:resend', CENTINELA);
    expect(r).toEqual({ ok: true, valor: { configurada: true, final: 'ta-d' } });
    // Un id con ruta o una clave con espacios nunca llegan al almacén.
    secretos.guardar.mockClear();
    expect((await llamar('correo.guardarClave', '../x', CENTINELA)).ok).toBe(false);
    expect((await llamar('correo.guardarClave', 'resend', 'con\nsalto')).ok).toBe(false);
    expect(secretos.guardar).not.toHaveBeenCalled();
  });

  it('guardarProveedor rechaza campos que no son de la lista (clave, redLocal)', async () => {
    const { llamar, f } = montarSmtp();
    const base = {
      id: 'resend',
      nombre: 'Resend',
      host: 'smtp.resend.com',
      puerto: 465,
      seguridad: 'tls',
      usuario: 'resend',
    };
    expect((await llamar('correo.guardarProveedor', { ...base, clave: CENTINELA })).ok).toBe(false);
    expect((await llamar('correo.guardarProveedor', { ...base, redLocal: true })).ok).toBe(false);
    expect((await llamar('correo.guardarProveedor', base, { confirmarRedLocal: 'si' })).ok).toBe(
      false,
    );
    expect(f.smtp.guardar).not.toHaveBeenCalled();
    expect((await llamar('correo.guardarProveedor', base, { confirmarRedLocal: true })).ok).toBe(
      true,
    );
    expect(f.smtp.guardar).toHaveBeenCalledWith(
      base,
      expect.objectContaining({ confirmarRedLocal: true }),
    );
  });

  it('probarEnvio lee la clave del almacén, valida el destino y no la devuelve', async () => {
    const { llamar, f } = montarSmtp();
    const r = await llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(r.ok).toBe(true);
    expect(f.smtp.probar).toHaveBeenCalledWith('resend', CENTINELA, 'yo@ejemplo.com');
    f.smtp.probar.mockClear();
    for (const malo of ['a@b.com,c@d.com', 'x@y.com\r\nBcc: z@w.com', 'sin-arroba', 42]) {
      const e = await llamar('correo.probarEnvio', 'resend', malo);
      expect(e.ok).toBe(false);
      expect(e.error?.codigo).toBe('correo.destinatario_invalido');
    }
    expect(f.smtp.probar).not.toHaveBeenCalled();
  });

  it('un error o un resultado con la clave nunca sale del proceso principal', async () => {
    const { llamar, f } = montarSmtp();
    f.smtp.probar.mockRejectedValueOnce(
      new ErrorWolf('correo.auth', `Falló con ${CENTINELA}`, { detalle: CENTINELA }),
    );
    const e = await llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(e.ok).toBe(false);
    expect(JSON.stringify(e)).not.toContain(CENTINELA);
    f.smtp.probar.mockResolvedValueOnce({ ok: true, idMensaje: `<${CENTINELA}@x>` });
    const eco = await llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(eco.ok).toBe(false);
    expect(JSON.stringify(eco)).not.toContain(CENTINELA);
  });

  it('sin clave guardada, probar no llama al núcleo', async () => {
    const { llamar, f } = montarSmtp(null);
    const r = await llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(r.error?.codigo).toBe('correo.sin_clave');
    expect(f.smtp.probar).not.toHaveBeenCalled();
  });

  it('escribirEnv exige confirmación; la clave solo pasa si se pide expresamente', async () => {
    const { llamar, f, secretos } = montarSmtp();
    const comun = { huella: HUELLA };
    // Sin confirmar o sin decir si incluir la clave: no se llama al núcleo ni se lee la clave.
    for (const o of [
      undefined,
      { ...comun, incluirClave: true },
      { ...comun, confirmado: true },
      { confirmado: true, incluirClave: false },
      { ...comun, confirmado: 'si', incluirClave: false },
    ]) {
      expect((await llamar('correo.escribirEnv', 's1', 'resend', o)).ok).toBe(false);
    }
    expect(f.escribirEnvSmtp).not.toHaveBeenCalled();
    expect(secretos.leer).not.toHaveBeenCalled();
    // Sin clave: nunca se lee del almacén.
    const sin = await llamar('correo.escribirEnv', 's1', 'resend', {
      ...comun,
      confirmado: true,
      incluirClave: false,
    });
    expect(sin.ok).toBe(true);
    expect(f.escribirEnvSmtp).toHaveBeenLastCalledWith('s1', 'resend', null, expect.anything());
    expect(secretos.leer).not.toHaveBeenCalled();
    // Con clave: la lee el proceso principal y llega al núcleo.
    const con = await llamar('correo.escribirEnv', 's1', 'resend', {
      ...comun,
      confirmado: true,
      incluirClave: true,
    });
    expect(con.ok).toBe(true);
    expect(f.escribirEnvSmtp).toHaveBeenLastCalledWith(
      's1',
      'resend',
      CENTINELA,
      expect.anything(),
    );
    expect(JSON.stringify(con)).not.toContain(CENTINELA);
  });

  it('la vista previa sin pedir la clave nunca la lee', async () => {
    const { llamar, f, secretos } = montarSmtp();
    const r = await llamar('correo.vistaPreviaEnv', 's1', 'resend', false);
    expect(r.ok).toBe(true);
    expect(f.vistaPreviaEnvSmtp).toHaveBeenCalledWith('s1', 'resend', null);
    expect(secretos.leer).not.toHaveBeenCalled();
    expect((await llamar('correo.vistaPreviaEnv', 's1', 'resend', 'si')).ok).toBe(false);
  });

  it('borrar el proveedor borra primero su clave', async () => {
    const { llamar, f, secretos } = montarSmtp();
    const r = await llamar('correo.borrarProveedor', 'resend');
    expect(r.ok).toBe(true);
    expect(secretos.borrar).toHaveBeenCalledWith('smtp:resend');
    expect(f.borrarProveedorSmtp).toHaveBeenCalledWith('resend');
  });

  it('la clave admite espacios internos y tiene su propio código al ser inválida', async () => {
    const { llamar, secretos } = montarSmtp();
    const ok = await llamar('correo.guardarClave', 'resend', 'abcd efgh ijkl mnop');
    expect(ok.ok).toBe(true);
    expect(secretos.guardar).toHaveBeenCalledWith('smtp:resend', 'abcd efgh ijkl mnop');
    secretos.guardar.mockClear();
    for (const mala of ['con\nsalto', '', '   ', 42, 'ñandú']) {
      const e = await llamar('correo.guardarClave', 'resend', mala);
      expect(e.ok).toBe(false);
      expect(e.error?.codigo).toBe('correo.clave_mal_formada');
    }
    expect(secretos.guardar).not.toHaveBeenCalled();
  });

  it('la clave larga no sale ni escapada como en un JSON; una corta no bloquea resultados', async () => {
    const rara = 'abc"def\\ghi-0123456789';
    const { llamar, f } = montarSmtp(rara);
    f.smtp.probar.mockResolvedValueOnce({
      ok: true,
      idMensaje: `<${rara}@x>`,
    });
    const eco = await llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(eco.ok).toBe(false);
    const corta = montarSmtp('x');
    const r = await corta.llamar('correo.probarEnvio', 'resend', 'yo@ejemplo.com');
    expect(r.ok).toBe(true);
  });

  it('guardarProveedor acepta un remitente y rechaza campos ajenos', async () => {
    const { llamar, f } = montarSmtp();
    const base = {
      id: 'resend',
      nombre: 'Resend',
      host: 'smtp.resend.com',
      puerto: 465,
      seguridad: 'tls',
      usuario: 'resend',
    };
    expect((await llamar('correo.guardarProveedor', { ...base, remitente: 'a@b.com' })).ok).toBe(
      true,
    );
    expect(f.smtp.guardar).toHaveBeenCalledWith(
      { ...base, remitente: 'a@b.com' },
      expect.anything(),
    );
  });

  it('usarEnSitio valida el modo', async () => {
    const { llamar, f } = montarSmtp();
    expect((await llamar('correo.usarEnSitio', 's1', { modo: 'otro' })).ok).toBe(false);
    expect((await llamar('correo.usarEnSitio', 's1', { modo: 'smtp' })).ok).toBe(false);
    expect((await llamar('correo.usarEnSitio', 's1', { modo: 'smtp', proveedor: '../x' })).ok).toBe(
      false,
    );
    expect(f.usarCorreoEnSitio).not.toHaveBeenCalled();
    const ok = await llamar('correo.usarEnSitio', 's1', { modo: 'smtp', proveedor: 'resend' });
    expect(ok.ok).toBe(true);
    expect(f.usarCorreoEnSitio).toHaveBeenCalledWith('s1', { modo: 'smtp', proveedor: 'resend' });
  });
});

describe('IPC de túneles (D23)', () => {
  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    return {
      crudo,
      llamar: (ruta: string, ...args: unknown[]) =>
        canales.get(`entorno:${ruta}`)!({}, ...args) as Promise<{ ok: boolean }>,
    };
  }

  it('abrir sin confirmar llega al núcleo con confirmado=false (el núcleo exige la reforzada)', async () => {
    const { crudo, llamar } = montar();
    await llamar('tuneles.abrir', 's1');
    expect(crudo.tuneles.abrir).toHaveBeenCalledWith('s1', { confirmado: false });
    await llamar('tuneles.abrir', 's1', 'si');
    expect(crudo.tuneles.abrir).toHaveBeenLastCalledWith('s1', { confirmado: false });
    await llamar('tuneles.abrir', 's1', true);
    expect(crudo.tuneles.abrir).toHaveBeenLastCalledWith('s1', { confirmado: true });
  });

  it('configurar Cloudflare valida los argumentos y nunca recibe credenciales', async () => {
    const { crudo, llamar } = montar();
    for (const args of [
      [42, 'a', 'b.com'],
      ['s1', 7, 'b.com'],
      ['s1', 'a', null],
      ['s1', '', 'b.com'],
    ]) {
      expect((await llamar('tuneles.configurarCloudflare', ...args)).ok, JSON.stringify(args)).toBe(
        false,
      );
    }
    expect(crudo.tuneles.configurarCloudflareNombre).not.toHaveBeenCalled();
    const ok = await llamar('tuneles.configurarCloudflare', 's1', 'wolf-dev', 'demo.midominio.com');
    expect(ok.ok).toBe(true);
    expect(crudo.tuneles.configurarCloudflareNombre).toHaveBeenCalledWith(
      's1',
      'wolf-dev',
      'demo.midominio.com',
    );
  });

  it('olvidar y recrear llegan al núcleo con confirmado=false salvo confirmación explícita', async () => {
    const { crudo, llamar } = montar();
    await llamar('tuneles.olvidarCloudflare', 'wolf-dev');
    expect(crudo.tuneles.olvidarTunelNombre).toHaveBeenLastCalledWith('wolf-dev', {
      confirmado: false,
      borrarEnCloudflare: true,
    });
    await llamar('tuneles.olvidarCloudflare', 'wolf-dev', true, false);
    expect(crudo.tuneles.olvidarTunelNombre).toHaveBeenLastCalledWith('wolf-dev', {
      confirmado: true,
      borrarEnCloudflare: false,
    });
    await llamar('tuneles.recrearCloudflare', 'wolf-dev', true);
    expect(crudo.tuneles.recrearTunelNombre).toHaveBeenLastCalledWith('wolf-dev', {
      confirmado: true,
    });
    expect((await llamar('tuneles.olvidarCloudflare', 7)).ok).toBe(false);
  });

  it('la cuenta de Cloudflare solo expone si está conectada', async () => {
    const { llamar } = montar();
    const r = (await llamar('tuneles.cuentaCloudflare')) as unknown as { valor: unknown };
    expect(r.valor).toEqual({ disponible: true, conectada: true });
  });

  it('volver al túnel rápido borra el proveedor del sitio', async () => {
    const { crudo, llamar } = montar();
    await llamar('tuneles.usarTunelRapido', 's1');
    expect(crudo.tuneles.elegirProveedor).toHaveBeenCalledWith('s1', null);
  });
});

describe('IPC de túneles (D24): ngrok, Expose y Tailscale', () => {
  const TOKEN = 'ngrok-prueba-falsa-centinela-secreta-d';

  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const secretos = {
      guardar: vi.fn(async () => undefined),
      leer: vi.fn(async () => TOKEN),
      borrar: vi.fn(async () => undefined),
      hay: vi.fn(() => true),
      estado: vi.fn(async () => ({ configurada: true, final: 'et-d' })),
      disponible: vi.fn(() => true),
      guardarTokenGithub: vi.fn(),
      leerTokenGithub: vi.fn(async () => null),
      borrarTokenGithub: vi.fn(),
      hayTokenGithub: vi.fn(() => false),
    };
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema, () => true, undefined, {
      secretos,
      seguimientos: new Seguimientos(),
      metricas: new ControlMetricas(nucleo),
    });
    const llamar = async (ruta: string, ...args: unknown[]) =>
      (await canales.get(`entorno:${ruta}`)!({}, ...args)) as {
        ok: boolean;
        valor?: unknown;
        error?: { mensaje: string; codigo?: string };
      };
    return { crudo, secretos, llamar };
  }

  it('el token va al almacén (tunel:<proveedor>) y solo vuelve {configurada, final}', async () => {
    const { llamar, secretos } = montar();
    const r = await llamar('tuneles.guardarToken', 'ngrok', TOKEN);
    expect(secretos.guardar).toHaveBeenCalledWith('tunel:ngrok', TOKEN);
    expect(r).toEqual({ ok: true, valor: { configurada: true, final: 'et-d' } });
    await llamar('tuneles.guardarToken', 'expose', TOKEN);
    expect(secretos.guardar).toHaveBeenLastCalledWith('tunel:expose', TOKEN);
    expect(JSON.stringify(await llamar('tuneles.estadoToken', 'ngrok'))).not.toContain(TOKEN);
    await llamar('tuneles.borrarToken', 'ngrok');
    expect(secretos.borrar).toHaveBeenCalledWith('tunel:ngrok');
  });

  it('proveedores o tokens que no valen nunca llegan al almacén y el error no repite el token', async () => {
    const { llamar, secretos } = montar();
    for (const args of [
      ['tailscale', TOKEN],
      ['cloudflare-nombre', TOKEN],
      ['../x', TOKEN],
      ['ngrok', 'corto'],
      ['ngrok', "x'; system('x'); 12345"],
      ['ngrok', 'con\nsalto-123456'],
      ['ngrok', 42],
    ]) {
      const r = await llamar('tuneles.guardarToken', ...args);
      expect(r.ok, JSON.stringify(args)).toBe(false);
      expect(JSON.stringify(r)).not.toContain(TOKEN);
    }
    expect((await llamar('tuneles.estadoToken', 'tailscale')).ok).toBe(false);
    expect((await llamar('tuneles.borrarToken', 'tailscale')).ok).toBe(false);
    expect(secretos.guardar).not.toHaveBeenCalled();
    expect(secretos.borrar).not.toHaveBeenCalled();
  });

  it('usarProveedor valida proveedor y modo y solo el núcleo elige', async () => {
    const { llamar, crudo } = montar();
    for (const args of [
      ['s1', 'cloudflare-nombre'],
      ['s1', 'otro'],
      ['s1', 'ngrok', 'funnel'],
      ['s1', 'tailscale', 'otro'],
      [42, 'ngrok'],
    ]) {
      expect((await llamar('tuneles.usarProveedor', ...args)).ok, JSON.stringify(args)).toBe(false);
    }
    expect(crudo.tuneles.elegirProveedor).not.toHaveBeenCalled();
    await llamar('tuneles.usarProveedor', 's1', 'ngrok');
    expect(crudo.tuneles.elegirProveedor).toHaveBeenLastCalledWith('s1', { proveedor: 'ngrok' });
    await llamar('tuneles.usarProveedor', 's1', 'tailscale', 'funnel');
    expect(crudo.tuneles.elegirProveedor).toHaveBeenLastCalledWith('s1', {
      proveedor: 'tailscale',
      modo: 'funnel',
    });
    await llamar('tuneles.usarProveedor', 's1', 'tailscale');
    expect(crudo.tuneles.elegirProveedor).toHaveBeenLastCalledWith('s1', {
      proveedor: 'tailscale',
    });
  });
});

describe('IPC de túneles: lo confirmado llega validado al núcleo (D24)', () => {
  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    return {
      crudo,
      llamar: (ruta: string, ...args: unknown[]) =>
        canales.get(`entorno:${ruta}`)!({}, ...args) as Promise<{ ok: boolean }>,
    };
  }

  it('abrir y renovar pasan tunelConfirmado {proveedor, nombre, dominio, modo}', async () => {
    const { crudo, llamar } = montar();
    await llamar('tuneles.abrir', 's1', true, { proveedor: 'tailscale', modo: 'funnel' });
    expect(crudo.tuneles.abrir).toHaveBeenLastCalledWith('s1', {
      confirmado: true,
      tunelConfirmado: { proveedor: 'tailscale', modo: 'funnel' },
    });
    await llamar('tuneles.renovar', 's1', true, {
      proveedor: 'cloudflare-nombre',
      nombre: 'wolf-dev',
      dominio: 'demo.midominio.com',
    });
    expect(crudo.tuneles.renovar).toHaveBeenLastCalledWith('s1', {
      confirmado: true,
      tunelConfirmado: {
        proveedor: 'cloudflare-nombre',
        nombre: 'wolf-dev',
        dominio: 'demo.midominio.com',
      },
    });
  });

  it('lo que no encaja se rechaza y no llega al núcleo', async () => {
    const { crudo, llamar } = montar();
    for (const t of [
      { proveedor: 'otro' },
      { proveedor: 'ngrok', modo: 'funnel' },
      { proveedor: 'tailscale', modo: 'raro' },
      { proveedor: 'cloudflare-nombre', nombre: 'MAL NOMBRE' },
      { proveedor: 'cloudflare-nombre', dominio: 'wolf.test' },
      { proveedor: 'ngrok', extra: 1 },
      'texto',
      [],
    ]) {
      expect((await llamar('tuneles.abrir', 's1', true, t)).ok, JSON.stringify(t)).toBe(false);
    }
    expect(crudo.tuneles.abrir).not.toHaveBeenCalled();
  });
});

describe('IPC de la red local (D25)', () => {
  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    return {
      crudo,
      llamar: (ruta: string, ...args: unknown[]) =>
        canales.get(`entorno:${ruta}`)!({}, ...args) as Promise<{ ok: boolean; valor?: unknown }>,
    };
  }

  it('activar lleva al núcleo lo confirmado (IP, HTTPS y confirmado), nada más', async () => {
    const { crudo, llamar } = montar();
    const r = await llamar('lan.activar', 's1', {
      confirmado: true,
      ip: '192.168.1.50',
      https: true,
      extra: 'se ignora',
      datosReales: true,
    });
    expect(r.ok).toBe(true);
    expect(crudo.lan.activar).toHaveBeenCalledWith('s1', {
      confirmado: true,
      ip: '192.168.1.50',
      https: true,
    });
  });

  it('el IPC no inventa la confirmación: sin confirmado === true llega false al núcleo', async () => {
    const { crudo, llamar } = montar();
    for (const c of [undefined, false, 'true', 1, {}]) {
      await llamar('lan.activar', 's1', { ip: '10.0.0.4', https: false, confirmado: c });
      expect(crudo.lan.activar).toHaveBeenLastCalledWith('s1', {
        confirmado: false,
        ip: '10.0.0.4',
        https: false,
      });
    }
  });

  it('la IP debe ser IPv4 y el puerto del cortafuegos, uno de 1024 a 65535', async () => {
    const { crudo, llamar } = montar();
    expect((await llamar('lan.activar', 's1', { ip: '300.1.1.1', https: false })).ok).toBe(false);
    expect((await llamar('lan.activar', 's1', { https: false })).ok).toBe(false);
    expect(crudo.lan.activar).not.toHaveBeenCalled();
    expect((await llamar('lan.comandoFirewall', 80)).ok).toBe(false);
    expect((await llamar('lan.comandoFirewall', 8100, 'otro')).ok).toBe(false);
    expect((await llamar('lan.comandoFirewall', 8100)).ok).toBe(true);
    expect(crudo.comandoFirewallLan).toHaveBeenLastCalledWith(8100, 'sitio');
    expect((await llamar('lan.comandoFirewall', 8101, 'ca')).ok).toBe(true);
    expect(crudo.comandoFirewallLan).toHaveBeenLastCalledWith(8101, 'ca');
  });

  it('el servidor de la CA se abre con una IP válida o sin ella, y se cierra', async () => {
    const { crudo, llamar } = montar();
    await llamar('lan.abrirCaMovil');
    expect(crudo.caMovil.abrir).toHaveBeenLastCalledWith({});
    await llamar('lan.abrirCaMovil', '192.168.1.50');
    expect(crudo.caMovil.abrir).toHaveBeenLastCalledWith({ ip: '192.168.1.50' });
    await llamar('lan.cerrarCaMovil');
    expect(crudo.caMovil.cerrar).toHaveBeenCalled();
  });
});

describe('D38c: «Datos de conexión» no lleva secretos; la clave sale solo por las rutas de revelar', () => {
  const CLAVE = 'clave-falsa-de-prueba-123';

  function montar() {
    const { ipcMain, canales } = ipcFalso();
    const { nucleo, crudo } = nucleoFalso();
    const f = crudo as unknown as Record<string, Mock>;
    registrarIpc(nucleo, ipcMain, ventanaFalsa().ventana, sistema);
    const llamar = (ruta: string, ...a: unknown[]) =>
      canales.get(`entorno:${ruta}`)!({}, ...a) as Promise<{ ok: boolean; valor?: unknown }>;
    return { f, llamar };
  }

  it('bd.conexion y servicios.conexion devuelven la vista del núcleo (sin clave) y nada más', async () => {
    const { f, llamar } = montar();
    const vista = { host: '127.0.0.1', puerto: 3306, usuario: 'root', tieneClave: true };
    f['vistaConexionBd']!.mockResolvedValue(vista);
    f['vistaConexionServicio']!.mockResolvedValue({ ...vista, puerto: 7700, usuario: '' });
    const a = await llamar('bd.conexion', 'mysql');
    const b = await llamar('servicios.conexion', 'meilisearch');
    expect(a).toEqual({ ok: true, valor: vista });
    expect(JSON.stringify([a, b])).not.toContain(CLAVE);
    // El IPC normal nunca pide la versión con clave al núcleo.
    expect(f['conexionBd']).not.toHaveBeenCalled();
    expect(f['conexionServicio']).not.toHaveBeenCalled();
    expect(f['revelarClaveBd']).not.toHaveBeenCalled();
    expect(f['revelarClaveServicio']).not.toHaveBeenCalled();
  });

  it('bd.bloqueEnv y bd.bloqueEnvSitio piden el bloque enmascarado (sin la opción revelar)', async () => {
    const { f, llamar } = montar();
    f['bloqueEnvBd']!.mockResolvedValue('DB_PASSWORD=************\n');
    f['bloqueEnvSitio']!.mockResolvedValue('DB_PASSWORD=************\n');
    await llamar('bd.bloqueEnv', 'mysql', 'tienda', 'laravel');
    await llamar('bd.bloqueEnvSitio', 'demo', 'mysql', 'tienda');
    expect(f['bloqueEnvBd']).toHaveBeenCalledWith('mysql', 'tienda', 'laravel', undefined);
    expect(f['bloqueEnvSitio']).toHaveBeenCalledWith('demo', 'mysql', 'tienda');
  });

  it('bd.revelar y servicios.revelarSecreto devuelven la clave y validan su entrada', async () => {
    const { f, llamar } = montar();
    f['revelarClaveBd']!.mockResolvedValue(CLAVE);
    f['revelarClaveServicio']!.mockResolvedValue(CLAVE);
    expect(await llamar('bd.revelar', 'mysql@8.4')).toEqual({ ok: true, valor: CLAVE });
    expect(await llamar('servicios.revelarSecreto', 'meilisearch')).toEqual({
      ok: true,
      valor: CLAVE,
    });
    expect(f['revelarClaveBd']).toHaveBeenCalledWith('mysql@8.4');
    expect(f['revelarClaveServicio']).toHaveBeenCalledWith('meilisearch');
    for (const [ruta, arg] of [
      ['bd.revelar', 'redis'],
      ['bd.revelar', { motor: 'mysql' }],
      ['bd.revelar', undefined],
      ['servicios.revelarSecreto', 'mysql'],
      ['servicios.revelarSecreto', 'redis@8'],
      ['servicios.revelarSecreto', '../meilisearch'],
    ] as [string, unknown][]) {
      expect((await llamar(ruta, arg)).ok, `${ruta} ${JSON.stringify(arg)}`).toBe(false);
    }
    expect(f['revelarClaveBd']).toHaveBeenCalledTimes(1);
    expect(f['revelarClaveServicio']).toHaveBeenCalledTimes(1);
  });

  it('bd.revelarBloqueEnv pide el bloque completo (revelar: true), genérico o de un sitio', async () => {
    const { f, llamar } = montar();
    const completo = `DB_PASSWORD=${CLAVE}\n`;
    f['bloqueEnvBd']!.mockResolvedValue(completo);
    f['bloqueEnvSitio']!.mockResolvedValue(completo);
    expect(await llamar('bd.revelarBloqueEnv', 'mysql', 'tienda', null)).toEqual({
      ok: true,
      valor: completo,
    });
    expect(f['bloqueEnvBd']).toHaveBeenCalledWith('mysql', 'tienda', 'generico', undefined, {
      revelar: true,
    });
    expect(await llamar('bd.revelarBloqueEnv', 'mysql', 'tienda', 'demo')).toEqual({
      ok: true,
      valor: completo,
    });
    expect(f['bloqueEnvSitio']).toHaveBeenCalledWith('demo', 'mysql', 'tienda', { revelar: true });
    for (const malo of [
      ['oracle', 'tienda', null],
      ['mysql', 'a;DROP', null],
      ['mysql', 'tienda', 42],
      ['mysql', 'tienda', ''],
      ['mysql', 'tienda', 'x'.repeat(129)],
    ]) {
      expect((await llamar('bd.revelarBloqueEnv', ...malo)).ok, JSON.stringify(malo)).toBe(false);
    }
    expect(f['bloqueEnvBd']).toHaveBeenCalledTimes(1);
    expect(f['bloqueEnvSitio']).toHaveBeenCalledTimes(1);
  });
});
