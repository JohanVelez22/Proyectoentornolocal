import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { LIMITE_ENV_BYTES, Nucleo } from '../src/nucleo';
import { Supervisor } from '../src/procesos/supervisor';
import { BasesDeDatos } from '../src/bd/basesDeDatos';
import { InstaladorPgvector } from '../src/bd/pgvector';
import { Respaldos } from '../src/bd/respaldos';
import { ServidorFtp } from '../src/ftp/servidorFtp';
import { Adminer } from '../src/herramientas/adminer';
import { Composer } from '../src/herramientas/composer';
import { PathUsuario } from '../src/herramientas/pathUsuario';
import { Terminal } from '../src/herramientas/terminal';
import { GestorHttps } from '../src/https/certificados';
import { ClienteOllama } from '../src/ia/ollama';
import { Instalador } from '../src/catalogo/instalador';
import { Servicios } from '../src/servicios/servicios';
import '../src/servicios/ollama';
import { Mailpit } from '../src/servicios/mailpit';
import type { UrlBase } from '../src/sitios/urlbase';
import type { Plataforma } from '../src/plataforma/tipos';
import type { EstadoHosts, EstadoServicio, Sitio } from '../src/tipos';

let base: string;
let carpeta: string;
let hostsArchivo: string;
let plataforma: Plataforma;
let nucleos: Nucleo[];

const falsa = (): Plataforma => ({
  rutaHosts: () => hostsArchivo,
  escribirComoAdmin: async (destino, contenido) => {
    writeFileSync(destino, contenido);
    return { ok: true };
  },
  quienUsaPuerto: async () => null,
  duenosDePuertos: async () => new Map(),
  instalarCertificadoUsuario: async () => ({ ok: true as const }),
  quitarCertificadoUsuario: async () => ({ ok: true as const }),
  certificadoInstalado: async () => false,
  procesoVivo: async () => ({ vivo: false }),
  matarArbol: async () => undefined,
  abrirUrl: async () => undefined,
  ejecutable: (n) => `${n}.exe`,
  carpetaDocumentos: async () => hostsArchivo,
});

const crear = async (): Promise<Nucleo> => {
  const n = await Nucleo.crear({
    base,
    plataforma,
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
  });
  nucleos.push(n);
  return n;
};

/** Marca servicios con autoIniciar en el config.json antes de crear el núcleo. */
const autoIniciar = (...ids: string[]): void => {
  writeFileSync(
    path.join(base, 'config.json'),
    JSON.stringify({
      version: 1,
      servicios: { datos: Object.fromEntries(ids.map((id) => [id, { autoIniciar: true }])) },
    }),
  );
  const instalados = Instalador.prototype.instalados;
  vi.spyOn(Instalador.prototype, 'instalados').mockImplementation(async function (
    this: Instalador,
    servicio: string,
  ) {
    return ids.includes(servicio) ? ['1.0.0'] : instalados.call(this, servicio);
  });
};
const datos = (extra: Partial<Omit<Sitio, 'id'>> = {}): Omit<Sitio, 'id'> => ({
  nombre: 'Demo',
  dominio: 'demo.test',
  alias: [],
  carpeta,
  tipo: 'estatico',
  php: null,
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  https: false,
  redirigirHttps: false,
  nota: '',
  ...extra,
});

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-nucleo-'));
  carpeta = path.join(base, 'proyecto');
  mkdirSync(carpeta);
  hostsArchivo = path.join(base, 'hosts');
  writeFileSync(hostsArchivo, '127.0.0.1 localhost\r\n');
  plataforma = falsa();
  nucleos = [];
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  for (const n of nucleos) await n.cerrar({ detenerServicios: false });
  rmSync(base, { recursive: true, force: true });
});

describe('Nucleo', () => {
  it('crea el árbol de datos y arma un sitio estático emitiendo sitio:cambio', async () => {
    const n = await crear();
    expect(n.rutas.base).toBe(base);
    const cambios: Sitio[][] = [];
    n.eventos.on('sitio:cambio', (s) => cambios.push(s));
    const { sitio, aplicar } = await n.guardarSitio(datos());
    expect(sitio.id).toBe('demo');
    expect(cambios.length).toBeGreaterThan(0);
    expect(cambios.at(-1)?.[0]?.dominio).toBe('demo.test');
    expect(aplicar.hosts.ok).toBe(true);
    expect(readFileSync(hostsArchivo, 'utf8')).toContain('demo.test');
    expect((await n.config.leer()).sitios).toHaveLength(1);
  });

  it('guardarSitio con id edita el sitio y aplica', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const { sitio } = await n.guardarSitio({ ...datos(), nota: 'hola' }, 'demo');
    expect(sitio.nota).toBe('hola');
    expect(await n.sitios.listar()).toHaveLength(1);
  });

  it('crear emite hosts:estado inicial para los dominios de los sitios existentes', async () => {
    const a = await crear();
    await a.guardarSitio(datos());
    await a.cerrar({ detenerServicios: false });
    // Se quita el bloque de hosts para que el estado inicial lo reporte pendiente.
    writeFileSync(hostsArchivo, '127.0.0.1 localhost\r\n');
    const visto: EstadoHosts[] = [];
    const n = await Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      alIniciar: (e) => e.on('hosts:estado', (h) => visto.push(h)),
    });
    nucleos.push(n);
    expect(visto).toHaveLength(1);
    expect(visto[0]?.pendientes).toEqual(['demo.test']);
  });

  it('borrarSitio cierra el túnel antes de borrar y luego aplica', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const orden: string[] = [];
    vi.spyOn(n.tuneles, 'cerrar').mockImplementation(async () => {
      orden.push('cerrar');
    });
    const borrar = n.sitios.borrar.bind(n.sitios);
    vi.spyOn(n.sitios, 'borrar').mockImplementation(async (id) => {
      orden.push('borrar');
      return borrar(id);
    });
    const aplicar = n.sitios.aplicar.bind(n.sitios);
    vi.spyOn(n.sitios, 'aplicar').mockImplementation(async () => {
      orden.push('aplicar');
      return aplicar();
    });
    const r = await n.borrarSitio('demo');
    expect(orden).toEqual(['cerrar', 'borrar', 'aplicar']);
    expect(r.hosts.ok).toBe(true);
    expect(await n.sitios.listar()).toEqual([]);
  });

  it('borrarSitio ignora el error de túnel no abierto', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    vi.spyOn(n.tuneles, 'cerrar').mockRejectedValue(new Error('no abierto'));
    await expect(n.borrarSitio('demo')).resolves.toBeDefined();
    expect(await n.sitios.listar()).toEqual([]);
  });

  it('estadoGeneral reúne servicios, sitios, túneles y hosts', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const g = await n.estadoGeneral();
    expect(g.servicios.find((s) => s.id === 'nginx')?.estado).toBe('apagado');
    expect(g.sitios).toHaveLength(1);
    expect(g.tuneles).toEqual([]);
    expect(g.hosts.pendientes).toEqual([]);
  });

  describe('sondeo', () => {
    it('emite servicio:estado cada 3000 ms solo cuando cambia', async () => {
      const n = await crear();
      let externo = false;
      vi.spyOn(n.servicios, 'estados').mockImplementation(async () => {
        const actuales: EstadoServicio[] = [
          {
            id: 'nginx',
            nombre: 'Nginx',
            version: null,
            estado: 'apagado',
            puertos: [80],
            pid: null,
          },
        ];
        if (!externo) return actuales;
        return [
          ...actuales,
          {
            id: 'mysql',
            nombre: 'MySQL (externo)',
            version: null,
            estado: 'externo',
            puertos: [3306],
            pid: null,
          } satisfies EstadoServicio,
        ];
      });
      vi.useFakeTimers();
      const vistos: EstadoServicio[] = [];
      n.eventos.on('servicio:estado', (e) => vistos.push(e));
      n.iniciarSondeo();
      n.iniciarSondeo(); // idempotente
      await vi.advanceTimersByTimeAsync(3000);
      const primeros = vistos.length;
      expect(vistos.filter((v) => v.id === 'nginx')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(6000);
      expect(vistos).toHaveLength(primeros);
      externo = true;
      await vi.advanceTimersByTimeAsync(3000);
      expect(vistos.filter((v) => v.id === 'mysql')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(3000);
      expect(vistos.filter((v) => v.id === 'mysql')).toHaveLength(1);
    });

    it('no solapa ticks y cerrar detiene el sondeo', async () => {
      const n = await crear();
      let llamadas = 0;
      let liberar!: () => void;
      vi.spyOn(n.servicios, 'estados').mockImplementation(() => {
        llamadas++;
        return new Promise<EstadoServicio[]>((r) => {
          liberar = () => r([]);
        });
      });
      vi.useFakeTimers();
      n.iniciarSondeo();
      await vi.advanceTimersByTimeAsync(9000);
      expect(llamadas).toBe(1);
      liberar();
      await vi.advanceTimersByTimeAsync(3000);
      expect(llamadas).toBe(2);
      liberar();
      await n.cerrar({ detenerServicios: false });
      await vi.advanceTimersByTimeAsync(9000);
      expect(llamadas).toBe(2);
    });
  });

  it('cerrar con detenerServicios cierra túneles y detiene todo', async () => {
    const n = await crear();
    vi.spyOn(n.tuneles, 'estados').mockReturnValue([
      { sitioId: 'a', estado: 'activo', url: 'https://x.trycloudflare.com' },
    ]);
    const cerrar = vi.spyOn(n.tuneles, 'cerrar').mockResolvedValue();
    const detener = vi.spyOn(n.servicios, 'detenerTodo').mockResolvedValue();
    await n.cerrar({ detenerServicios: true });
    expect(cerrar).toHaveBeenCalledWith('a');
    expect(detener).toHaveBeenCalled();
  });

  it('cerrar cierra el supervisor aunque falle un túnel o detenerTodo, y relanza el primer error', async () => {
    const n = await crear();
    vi.spyOn(n.tuneles, 'estados').mockReturnValue([
      { sitioId: 'a', estado: 'activo', url: 'https://x.trycloudflare.com' },
    ]);
    vi.spyOn(n.tuneles, 'cerrar').mockRejectedValue(new Error('túnel'));
    vi.spyOn(n.servicios, 'detenerTodo').mockRejectedValue(new Error('detener'));
    const sup = vi.spyOn(
      (n as unknown as { supervisor: { cerrar(): Promise<void> } }).supervisor,
      'cerrar',
    );
    await expect(n.cerrar({ detenerServicios: true })).rejects.toThrow('túnel');
    expect(sup).toHaveBeenCalled();
  });

  describe('editar un sitio con el túnel abierto', () => {
    let carpetaB: string;
    const original = Buffer.from('APP_NAME=A\r\nAPP_URL="http://demo.test"\r\nX=1');
    const envB = 'APP_URL=http://b.test\n';

    /** Deja el .env como lo deja un túnel abierto, sin lanzar cloudflared. */
    const abrirTunelFalso = async (n: Nucleo): Promise<void> => {
      const sitio = (await n.sitios.listar())[0]!;
      const urlBase = (n.tuneles as unknown as { d: { urlBase: UrlBase } }).d.urlBase;
      await urlBase.aplicar(sitio, 'https://falso.trycloudflare.com/');
      vi.spyOn(n.tuneles, 'estados').mockReturnValue([
        { sitioId: sitio.id, estado: 'activo', url: 'https://falso.trycloudflare.com' },
      ]);
    };

    beforeEach(() => {
      carpetaB = path.join(base, 'proyecto B');
      mkdirSync(carpetaB);
      writeFileSync(path.join(carpetaB, '.env'), envB);
      writeFileSync(path.join(carpeta, '.env'), original);
    });

    it('cambio de carpeta A→B: cierra el túnel antes, A queda idéntico y B intacto', async () => {
      const n = await crear();
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL' }));
      await abrirTunelFalso(n);
      expect(readFileSync(path.join(carpeta, '.env'), 'utf8')).toContain('falso.trycloudflare');
      const cerrar = vi.spyOn(n.tuneles, 'cerrar');
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL', carpeta: carpetaB }), 'demo');
      expect(cerrar).toHaveBeenCalledWith('demo');
      expect(readFileSync(path.join(carpeta, '.env')).equals(original)).toBe(true);
      expect(readFileSync(path.join(carpetaB, '.env'), 'utf8')).toBe(envB);
    });

    it('urlBaseVar → null: cierra el túnel y A queda idéntico', async () => {
      const n = await crear();
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL' }));
      await abrirTunelFalso(n);
      await n.guardarSitio(datos({ urlBaseVar: null }), 'demo');
      expect(readFileSync(path.join(carpeta, '.env')).equals(original)).toBe(true);
    });

    it('un cambio que no afecta al túnel (nota) no lo cierra', async () => {
      const n = await crear();
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL' }));
      await abrirTunelFalso(n);
      const cerrar = vi.spyOn(n.tuneles, 'cerrar');
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL', nota: 'x' }), 'demo');
      expect(cerrar).not.toHaveBeenCalled();
    });

    it('cambio de dominio también cierra el túnel', async () => {
      const n = await crear();
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL' }));
      await abrirTunelFalso(n);
      const cerrar = vi.spyOn(n.tuneles, 'cerrar');
      await n.guardarSitio(datos({ urlBaseVar: 'APP_URL', dominio: 'otro.test' }), 'demo');
      expect(cerrar).toHaveBeenCalledWith('demo');
    });
  });

  it('detenerTodo cierra primero los túneles y después los servicios', async () => {
    const n = await crear();
    const orden: string[] = [];
    vi.spyOn(n.tuneles, 'cerrarTodos').mockImplementation(async () => {
      orden.push('tuneles');
      return [];
    });
    vi.spyOn(n.servicios, 'detenerTodo').mockImplementation(async () => {
      orden.push('servicios');
    });
    await n.detenerTodo();
    expect(orden).toEqual(['tuneles', 'servicios']);
  });

  describe('guardarAjustes', () => {
    it('guarda solo puerto y trabajadores y regenera los vhosts con el nuevo listen', async () => {
      const n = await crear();
      await n.guardarSitio(datos());
      const r = await n.guardarAjustes({ puerto: 8089, trabajadores: 3 });
      expect(r.errores).toEqual([]);
      expect(r.reiniciados).toEqual([]);
      const cfg = await n.config.leer();
      expect(cfg.servicios.nginx.puerto).toBe(8089);
      expect(cfg.servicios.php.trabajadores).toBe(3);
      expect(cfg.sitios).toHaveLength(1);
      expect(readFileSync(n.rutas.vhost('demo'), 'utf8')).toContain('listen 8089;');
    });

    it('rechaza valores fuera de rango sin guardar', async () => {
      const n = await crear();
      await expect(n.guardarAjustes({ puerto: 70000, trabajadores: 2 })).rejects.toThrow(
        'entre 1 y 65535',
      );
      await expect(n.guardarAjustes({ puerto: 80, trabajadores: 0 })).rejects.toThrow(
        'entre 1 y 8',
      );
      expect((await n.config.leer()).servicios.nginx.puerto).toBe(80);
    });

    it('con Nginx encendido y otro puerto: lo detiene, aplica y lo vuelve a iniciar', async () => {
      const n = await crear();
      const sup = (n as unknown as { supervisor: Supervisor }).supervisor;
      vi.spyOn(sup, 'estado').mockImplementation((id) =>
        id === 'nginx' ? 'encendido' : 'apagado',
      );
      const orden: string[] = [];
      vi.spyOn(n.servicios, 'detener').mockImplementation(async (id) => {
        orden.push(`detener ${id}`);
      });
      vi.spyOn(n.servicios, 'iniciar').mockImplementation(async (id) => {
        orden.push(`iniciar ${id}`);
      });
      const aplicar = n.sitios.aplicar.bind(n.sitios);
      vi.spyOn(n.sitios, 'aplicar').mockImplementation(async () => {
        orden.push('aplicar');
        return aplicar();
      });
      const r = await n.guardarAjustes({ puerto: 8090, trabajadores: 2 });
      expect(orden).toEqual(['detener nginx', 'aplicar', 'iniciar nginx']);
      expect(r.reiniciados).toEqual(['Nginx']);
      expect(r.aplicar.nginx).toEqual({ ok: true, salida: 'Nginx reiniciado en el puerto 8090.' });
    });

    it('si cambian los trabajadores reinicia las ramas de PHP encendidas', async () => {
      const n = await crear();
      const sup = (n as unknown as { supervisor: Supervisor }).supervisor;
      vi.spyOn(sup, 'estado').mockImplementation((id) =>
        id === 'php-8.4-0' ? 'encendido' : 'apagado',
      );
      vi.spyOn(n.instalador, 'instalados').mockImplementation(async (s) =>
        s === 'php' ? ['8.3', '8.4'] : [],
      );
      const orden: string[] = [];
      vi.spyOn(n.servicios, 'detener').mockImplementation(async (id) => {
        orden.push(`detener ${id}`);
      });
      vi.spyOn(n.servicios, 'iniciar').mockImplementation(async (id) => {
        orden.push(`iniciar ${id}`);
      });
      const r = await n.guardarAjustes({ puerto: 80, trabajadores: 4 });
      expect(orden).toEqual(['detener php-8.4', 'iniciar php-8.4']);
      expect(r.reiniciados).toEqual(['PHP 8.4']);
    });
  });

  it('un dominio inválido en config.json no impide arrancar: hosts se degrada a un mensaje', async () => {
    writeFileSync(
      path.join(base, 'config.json'),
      JSON.stringify({
        version: 1,
        sitios: [{ ...datos(), id: 'mal', dominio: 'mal dominio.test' }],
      }),
    );
    const n = await crear();
    const g = await n.estadoGeneral();
    expect(g.sitios).toHaveLength(1);
    expect(g.hosts.mensaje).toContain('No se pudo revisar el archivo hosts');
    expect(g.hosts.mensaje).toContain('mal dominio.test');
  });

  it('crear cierra el supervisor y relanza si falla un paso posterior', async () => {
    const cerrar = vi.spyOn(Supervisor.prototype, 'cerrar');
    vi.spyOn(Supervisor.prototype, 'readoptar').mockRejectedValue(new Error('boom'));
    await expect(crear()).rejects.toThrow('boom');
    expect(cerrar).toHaveBeenCalled();
  });

  it('solo los estados agregados llegan al flujo público; los eventos crudos del supervisor no', async () => {
    const n = await crear();
    const internos = (n as unknown as { supervisor: { eventos: Eventos<EventosNucleo> } })
      .supervisor.eventos;
    const vistos: EstadoServicio[] = [];
    n.eventos.on('servicio:estado', (e) => vistos.push(e));
    const crudo = (id: string): EstadoServicio => ({
      id,
      nombre: id,
      version: null,
      estado: 'encendido',
      puertos: [],
      pid: 1,
    });
    internos.emit('servicio:estado', crudo('php-8.4-0'));
    internos.emit('servicio:estado', crudo('tunel-x'));
    internos.emit('servicio:estado', crudo('nginx'));
    await vi.waitFor(() => expect(vistos.length).toBeGreaterThan(0));
    expect(vistos.map((v) => v.id)).toEqual(['nginx', 'ftp']);
    expect(vistos.find((v) => v.id === 'nginx')).toMatchObject({
      nombre: 'Nginx',
      puertos: [80],
      estado: 'apagado',
    });
  });
});

describe('Nucleo.crear y la migración de la carpeta de datos', () => {
  it('sin base usa la carpeta que devuelve la migración y expone el aviso', async () => {
    const n = await Nucleo.crear({
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      migracion: async () => ({ resultado: 'fallida', base, aviso: 'aviso de prueba' }),
    });
    nucleos.push(n);
    expect(n.rutas.base).toBe(base);
    expect(n.avisoInicio).toBe('aviso de prueba');
  });
});

describe('Nucleo.crear purga temporales', () => {
  it('al arrancar borra los restos de restauraciones e importaciones interrumpidas', async () => {
    mkdirSync(path.join(base, 'tmp', 'restaurar-viejo'), { recursive: true });
    writeFileSync(path.join(base, 'tmp', 'lanzar-viejo.pid'), '1');
    await crear();
    expect(existsSync(path.join(base, 'tmp', 'restaurar-viejo'))).toBe(false);
    expect(existsSync(path.join(base, 'tmp', 'lanzar-viejo.pid'))).toBe(false);
  });
});

describe('Nucleo y credenciales', () => {
  const clave = 'Abc123Abc123Abc123Ab';

  it('migra las credenciales de config.json a etc/credenciales.json y config.leer no las devuelve', async () => {
    writeFileSync(
      path.join(base, 'config.json'),
      JSON.stringify({
        version: 1,
        sitios: [],
        credenciales: { mysql: { usuario: 'root', clave }, basura: { x: 1 } },
      }),
    );
    const n = await crear();
    const cfg = await n.config.leer();
    expect(cfg).not.toHaveProperty('credenciales');
    expect(JSON.stringify(cfg)).not.toContain(clave);
    expect(readFileSync(path.join(base, 'config.json'), 'utf8')).not.toContain(clave);
    expect(await n.credenciales('mysql')).toEqual({ usuario: 'root', clave });
    expect(await n.credenciales('postgresql')).toBeNull();
    const archivo = JSON.parse(readFileSync(path.join(base, 'etc', 'credenciales.json'), 'utf8'));
    expect(archivo).toEqual({ mysql: { usuario: 'root', clave } });
  });

  it('la migración no pisa credenciales ya guardadas en etc/credenciales.json', async () => {
    mkdirSync(path.join(base, 'etc'), { recursive: true });
    writeFileSync(
      path.join(base, 'etc', 'credenciales.json'),
      JSON.stringify({ mysql: { usuario: 'root', clave: 'Nueva' } }),
    );
    writeFileSync(
      path.join(base, 'config.json'),
      JSON.stringify({ credenciales: { mysql: { usuario: 'root', clave: 'Vieja' } } }),
    );
    const n = await crear();
    expect((await n.credenciales('mysql'))?.clave).toBe('Nueva');
  });

  it('un config.json corrupto no se lleva las credenciales', async () => {
    mkdirSync(path.join(base, 'etc'), { recursive: true });
    writeFileSync(
      path.join(base, 'etc', 'credenciales.json'),
      JSON.stringify({ postgresql: { usuario: 'postgres', clave } }),
    );
    writeFileSync(path.join(base, 'config.json'), '{ esto no es json');
    const n = await crear();
    await n.config.leer();
    expect(await n.credenciales('postgresql')).toEqual({ usuario: 'postgres', clave });
  });
});

describe('FTP en el núcleo', () => {
  it('aparece como servicio "ftp", y su clave no viaja por config.leer', async () => {
    const n = await crear();
    const { sitio } = await n.guardarSitio(datos());
    const estados = await n.servicios.estados();
    expect(estados.find((e) => e.id === 'ftp')).toMatchObject({
      categoria: 'herramienta',
      estado: 'apagado',
      puertos: [2121],
    });
    const cred = await n.activarFtp(sitio.id);
    expect(cred.usuario).toBe(sitio.id);
    expect(JSON.stringify(await n.config.leer())).not.toContain(cred.clave);
    expect((await n.config.leer()).sitios[0]?.ftp).toEqual({
      activo: true,
      usuario: sitio.id,
      soloLectura: false,
    });
    // Editar el sitio no pisa su FTP.
    await n.guardarSitio(datos({ nota: 'otra' }), sitio.id);
    expect((await n.config.leer()).sitios[0]?.ftp?.activo).toBe(true);
    expect(await n.credencialesFtp(sitio.id)).toEqual(cred);
    // Borrar el sitio borra su clave.
    await n.borrarSitio(sitio.id);
    expect(await n.credencialesFtp(sitio.id)).toBeNull();
  });

  it('cambiar la carpeta de un sitio corta sus sesiones FTP', async () => {
    const n = await crear();
    const { sitio } = await n.guardarSitio(datos());
    const cortar = vi
      .spyOn(
        (n as unknown as { ftp: { cortarSesiones(id: string): Promise<void> } }).ftp,
        'cortarSesiones',
      )
      .mockResolvedValue(undefined);
    await n.guardarSitio(datos({ nota: 'solo nota' }), sitio.id);
    expect(cortar).not.toHaveBeenCalled();
    const otra = path.join(base, 'otra');
    mkdirSync(otra);
    await n.guardarSitio(datos({ carpeta: otra }), sitio.id);
    expect(cortar).toHaveBeenCalledWith(sitio.id);
  });
});

describe('Nucleo expone y cablea los módulos de la Etapa A', () => {
  it('expone bd, respaldos, pgvector, https, herramientas, ftp, ollama y mailpit', async () => {
    const n = await crear();
    expect(n.bd).toBeInstanceOf(BasesDeDatos);
    expect(n.respaldos).toBeInstanceOf(Respaldos);
    expect(n.pgvector).toBeInstanceOf(InstaladorPgvector);
    expect(n.https).toBeInstanceOf(GestorHttps);
    expect(n.composer).toBeInstanceOf(Composer);
    expect(n.terminal).toBeInstanceOf(Terminal);
    expect(n.pathUsuario).toBeInstanceOf(PathUsuario);
    expect(n.adminer).toBeInstanceOf(Adminer);
    expect(n.ftp).toBeInstanceOf(ServidorFtp);
    expect(n.ollama).toBeInstanceOf(ClienteOllama);
    expect(n.mailpit).toBeInstanceOf(Mailpit);
  });

  it('las acciones de bases de datos pasan por el servicio (apagado: "Encienda …")', async () => {
    const n = await crear();
    await expect(n.listarBases('mysql')).rejects.toThrow('Encienda MySQL');
    await expect(n.conexionBd('postgresql')).rejects.toThrow('Encienda PostgreSQL');
    await expect(n.activarVector('demo')).rejects.toThrow('Encienda PostgreSQL');
    await expect(n.respaldarBase('mongodb', 'x')).rejects.toThrow('MongoDB');
  });

  it('Ollama usa el puerto configurado, la carpeta data/ollama/actual/models y emite ia:progreso', async () => {
    const urls: string[] = [];
    const n = await Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async (u: string) => {
        urls.push(String(u));
        if (String(u).endsWith('/api/pull')) {
          return new Response(
            '{"status":"pulling","completed":1,"total":2}\n{"status":"success"}\n',
          );
        }
        return new Response(JSON.stringify({ models: [{ name: 'llama3.2', size: 5 }] }));
      }) as typeof fetch,
    });
    nucleos.push(n);
    await n.sitios.modificarConfig((c) => {
      c.servicios.datos.ollama.puerto = 12345;
    });
    expect(await n.modelosIa()).toEqual([{ nombre: 'llama3.2', tamanoBytes: 5, modificado: '' }]);
    expect(urls.at(-1)).toBe('http://127.0.0.1:12345/api/tags');
    expect(await n.bloqueEnvIa()).toContain('OLLAMA_BASE_URL=http://127.0.0.1:12345');
    const progreso: unknown[] = [];
    n.eventos.on('ia:progreso', (p) => progreso.push(p));
    await n.descargarModelo('llama3.2');
    expect(progreso.length).toBeGreaterThan(0);
    const modelos = path.join(base, 'data', 'ollama', 'actual', 'models');
    mkdirSync(modelos, { recursive: true });
    writeFileSync(path.join(modelos, 'blob'), 'x'.repeat(10));
    expect(await n.espacioIa()).toBe(10);
  });

  it('Mailpit usa el fetch del núcleo', async () => {
    const n = await Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{"unread":3}')) as typeof fetch,
    });
    nucleos.push(n);
    expect(await n.noLeidosCorreo()).toBe(3);
  });

  it('pgvector detiene PostgreSQL solo si corría y lo vuelve a iniciar con Servicios', async () => {
    const n = await crear();
    const deps = (
      n.pgvector as unknown as {
        d: {
          detenerPostgres(): Promise<boolean>;
          iniciarPostgres(): Promise<void>;
          versionPostgres(): Promise<string | null>;
        };
      }
    ).d;
    const detener = vi.spyOn(n.servicios, 'detener').mockResolvedValue(undefined);
    const iniciar = vi.spyOn(n.servicios, 'iniciar').mockResolvedValue(undefined);
    expect(await deps.detenerPostgres()).toBe(false);
    expect(detener).not.toHaveBeenCalled();
    await deps.iniciarPostgres();
    expect(iniciar).toHaveBeenCalledWith('postgresql');
    expect(await deps.versionPostgres()).toBeNull();
    expect(await n.estadoPgvector()).toMatchObject({ instalado: false, version: null });
  });

  it('al encender inicia los servicios con autoIniciar después de readoptar', async () => {
    const orden: string[] = [];
    const readoptar = Supervisor.prototype.readoptar;
    vi.spyOn(Supervisor.prototype, 'readoptar').mockImplementation(async function (
      this: Supervisor,
    ) {
      orden.push('readoptar');
      return readoptar.call(this);
    });
    autoIniciar('mailpit');
    vi.spyOn(Servicios.prototype, 'iniciar').mockImplementation(async (id) => {
      orden.push(`iniciar:${id}`);
    });
    const n = await crear();
    expect(await n.arranqueAutomatico).toEqual([]);
    expect(orden).toEqual(['readoptar', 'iniciar:mailpit']);
    expect(n.tomarAvisoInicio()).toBeNull();
  });

  it('si un servicio automático falla, deja un aviso de inicio que se entrega una sola vez', async () => {
    autoIniciar('mailpit');
    vi.spyOn(Servicios.prototype, 'iniciar').mockRejectedValue(new Error('puerto 1025 ocupado'));
    const avisos: string[] = [];
    const n = await Nucleo.crear({
      base,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      alIniciar: (e) => e.on('aviso:inicio', (a) => avisos.push(a)),
    });
    nucleos.push(n);
    await n.arranqueAutomatico;
    expect(avisos).toEqual(['No se pudieron encender al iniciar: Mailpit: puerto 1025 ocupado']);
    expect(n.tomarAvisoInicio()).toBe(avisos[0]);
    expect(n.tomarAvisoInicio()).toBeNull();
  });

  it('el aviso de la migración se entrega una sola vez', async () => {
    const n = await Nucleo.crear({
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
      migracion: async () => ({ resultado: 'fallida', base, aviso: 'aviso de prueba' }),
    });
    nucleos.push(n);
    await n.arranqueAutomatico;
    expect(n.tomarAvisoInicio()).toBe('aviso de prueba');
    expect(n.tomarAvisoInicio()).toBeNull();
  });

  it('cerrar durante un arranque automático lento cierra los túneles antes y no enciende más', async () => {
    autoIniciar('mailpit', 'ollama');
    const orden: string[] = [];
    let soltar!: () => void;
    vi.spyOn(Servicios.prototype, 'iniciar').mockImplementation((id) => {
      orden.push(`iniciar:${id}`);
      return new Promise<void>((r) => {
        soltar = () => {
          orden.push(`listo:${id}`);
          r();
        };
      });
    });
    vi.spyOn(Servicios.prototype, 'detenerTodo').mockImplementation(async () => {
      orden.push('detenerTodo');
    });
    const n = await crear();
    await vi.waitFor(() => expect(orden).toEqual(['iniciar:mailpit']));
    vi.spyOn(n.tuneles, 'cerrarTodos').mockImplementation(async () => {
      orden.push('tuneles');
      return [];
    });
    const cierre = n.cerrar({ detenerServicios: true });
    await vi.waitFor(() => expect(orden).toContain('tuneles'));
    expect(orden).toEqual(['iniciar:mailpit', 'tuneles']);
    soltar();
    await cierre;
    expect(orden).toEqual(['iniciar:mailpit', 'tuneles', 'listo:mailpit', 'detenerTodo']);
  });

  it('cerrar sin detener servicios no espera al arranque automático', async () => {
    autoIniciar('mailpit');
    vi.spyOn(Servicios.prototype, 'iniciar').mockImplementation(() => new Promise<void>(() => {}));
    const n = await crear();
    await n.cerrar({ detenerServicios: false });
    nucleos.splice(nucleos.indexOf(n), 1);
  });

  it('guardarSitio emite el certificado antes de aplicar cuando https pasa a true', async () => {
    const n = await crear();
    const { sitio } = await n.guardarSitio(datos());
    const orden: string[] = [];
    const asegurar = n.https.asegurarCertificado.bind(n.https);
    vi.spyOn(n.https, 'asegurarCertificado').mockImplementation(async (s) => {
      orden.push(`cert:${s.id}`);
      return asegurar(s);
    });
    const aplicar = n.sitios.aplicar.bind(n.sitios);
    vi.spyOn(n.sitios, 'aplicar').mockImplementation(async () => {
      orden.push('aplicar');
      return aplicar();
    });
    await n.guardarSitio(datos({ nota: 'sin https' }), sitio.id);
    expect(orden).toEqual(['aplicar']);
    orden.length = 0;
    const r = await n.guardarSitio(datos({ https: true }), sitio.id);
    expect(orden[0]).toBe(`cert:${sitio.id}`);
    expect(orden).toContain('aplicar');
    expect(r.aplicar.httpsPendiente).toEqual([]);
  });

  it('estadoHttps informa el puerto configurado y el programa ajeno que lo ocupa', async () => {
    const n = await crear();
    expect(await n.estadoHttps()).toEqual({
      caCreada: false,
      caInstalada: false,
      puerto: 443,
      ocupadoPor: null,
    });
    plataforma.duenosDePuertos = async (puertos) =>
      new Map(puertos.map((p) => [p, { pid: 4321, nombre: 'nginx.exe' }]));
    await n.cambiarPuertoHttps(8443);
    const e = await n.estadoHttps();
    expect(e.puerto).toBe(8443);
    expect(e.ocupadoPor).toEqual({ pid: 4321, nombre: 'nginx.exe' });
  });

  it('cambiarPuertoHttps guarda el puerto y aplica', async () => {
    const n = await crear();
    const aplicar = vi.spyOn(n.sitios, 'aplicar');
    await n.cambiarPuertoHttps(8443);
    expect((await n.config.leer()).https.puerto).toBe(8443);
    expect(aplicar).toHaveBeenCalled();
    await expect(n.cambiarPuertoHttps(80)).rejects.toThrow('puerto');
  });

  it('autoIniciarServicio guarda la preferencia sin tocar el servicio', async () => {
    const n = await crear();
    const iniciar = vi.spyOn(n.servicios, 'iniciar');
    await n.autoIniciarServicio('postgresql', true);
    expect((await n.config.leer()).servicios.datos.postgresql.autoIniciar).toBe(true);
    await n.autoIniciarServicio('postgresql', false);
    expect((await n.config.leer()).servicios.datos.postgresql.autoIniciar).toBe(false);
    expect(iniciar).not.toHaveBeenCalled();
    await expect(n.autoIniciarServicio('nginx' as never, true)).rejects.toThrow('arranque');
  });

  it('cambiarPuertoServicio y borrarDatosServicio delegan en Servicios', async () => {
    const n = await crear();
    const cambiar = vi.spyOn(n.servicios, 'cambiarPuerto').mockResolvedValue(undefined);
    const borrar = vi.spyOn(n.servicios, 'borrarDatos').mockResolvedValue(undefined);
    await n.cambiarPuertoServicio('mysql', 3308);
    await n.borrarDatosServicio('mysql', 'mysql');
    expect(cambiar).toHaveBeenCalledWith('mysql', 3308);
    expect(borrar).toHaveBeenCalledWith('mysql', 'mysql');
  });

  describe('bloque .env por sitio', () => {
    const conexion = {
      host: '127.0.0.1' as const,
      puerto: 3308,
      usuario: 'root',
      clave: 'clave-local',
    };

    /** El sitio va directo al config.json (sin validar PHP ni aplicar nginx). */
    const conSitio = async (tipo: Sitio['tipo']): Promise<Nucleo> => {
      writeFileSync(
        path.join(base, 'config.json'),
        JSON.stringify({ version: 1, sitios: [{ id: 'demo', ...datos({ tipo, php: '8.4' }) }] }),
      );
      return crear();
    };

    it('lee el .env del sitio (desde config) y devuelve solo el bloque', async () => {
      const n = await conSitio('codeigniter3');
      const secreto = 'encryption.key = hex2bin:SECRETO_DEL_PROYECTO';
      writeFileSync(
        path.join(carpeta, '.env'),
        `CI_ENVIRONMENT = development\n${secreto}\n# database.default.hostname = localhost\n`,
      );
      vi.spyOn(n.bd, 'conexion').mockResolvedValue(conexion);
      const bloque = await n.bloqueEnvSitio('demo', 'mysql', 'tienda');
      expect(bloque).toContain('database.default.hostname = 127.0.0.1');
      expect(bloque).toContain('database.default.database = tienda');
      expect(bloque).not.toContain('SECRETO_DEL_PROYECTO');
      expect(bloque).not.toContain('CI_ENVIRONMENT');
    });

    it('sin .env usa el formato por defecto; un sitio inexistente se rechaza', async () => {
      const n = await conSitio('laravel');
      vi.spyOn(n.bd, 'conexion').mockResolvedValue(conexion);
      expect(await n.bloqueEnvSitio('demo', 'mysql', 'tienda')).toContain('DB_CONNECTION=mysql');
      await expect(n.bloqueEnvSitio('otro', 'mysql', 'tienda')).rejects.toThrow(
        'El sitio ya no existe',
      );
    });

    it('solo lee los primeros 256 KB del .env', async () => {
      const n = await conSitio('codeigniter3');
      // La marca de CodeIgniter 4 queda fuera del límite: no se detecta.
      writeFileSync(
        path.join(carpeta, '.env'),
        `${'#'.repeat(LIMITE_ENV_BYTES)}\ndatabase.default.hostname = localhost\n`,
      );
      vi.spyOn(n.bd, 'conexion').mockResolvedValue(conexion);
      const bloque = await n.bloqueEnvSitio('demo', 'mysql', 'tienda');
      expect(bloque).not.toContain('database.default');
      expect(bloque).toContain('DB_HOST=127.0.0.1');
    });
  });

  it('carpetaRespaldos usa la carpeta Documentos real de la plataforma', async () => {
    plataforma = { ...falsa(), carpetaDocumentos: async () => 'D:/OneDrive/Documentos' };
    const n = await crear();
    expect(await n.carpetaRespaldos()).toBe(
      path.join('D:/OneDrive/Documentos', 'WolfCore Dev', 'Respaldos'),
    );
  });
});
