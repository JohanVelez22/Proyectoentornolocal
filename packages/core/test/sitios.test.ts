import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Almacen } from '../src/almacen';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Rutas } from '../src/rutas';
import { GestorSitios, ramasEnUso, upstreamsPara } from '../src/sitios/sitios';
import type { Sitio } from '../src/tipos';

let base: string;
let rutas: Rutas;
let carpeta: string;
let nginxOk: boolean;
let estado: 'apagado' | 'iniciando' | 'encendido' | 'error';
let nginxInstalado: string[];
let phpInstalado: string[];
let llamadas: string[];
let dominiosHosts: string[][];
let hostsRes: { ok: true } | { ok: false; motivo: string; comandoManual: string };
let emitidos: Sitio[][];
let gestorValidarHook: (() => void) | null = null;

function gestor(avisarVhost?: (a: { sitio: string; modo: string; motivo: string }) => void): GestorSitios {
  const eventos = new Eventos<EventosNucleo>();
  eventos.on('sitio:cambio', (l) => emitidos.push(l));
  return new GestorSitios({
    almacen: new Almacen(rutas),
    rutas,
    nginx: {
      validar: async () => {
        llamadas.push('validar');
        gestorValidarHook?.();
        return { ok: nginxOk, salida: nginxOk ? 'ok' : 'nginx: [emerg] fallo' };
      },
      recargar: async () => {
        llamadas.push('recargar');
        if (!nginxOk) throw new Error('nginx: [emerg] fallo');
      },
    },
    estadoNginx: () => estado,
    hosts: {
      sincronizar: async (d: string[]) => {
        dominiosHosts.push(d);
        return hostsRes;
      },
    },
    instalador: {
      instalado: async (s: string, v: string) =>
        (s === 'php' ? phpInstalado : nginxInstalado).includes(v),
      instalados: async (s: string) => (s === 'nginx' ? nginxInstalado : phpInstalado),
    },
    eventos,
    ...(avisarVhost ? { avisarVhost } : {}),
  });
}

const datos = (dominio: string, extra: Partial<Omit<Sitio, 'id'>> = {}): Omit<Sitio, 'id'> => ({
  nombre: dominio,
  dominio,
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
  confiado: false,
  git: null,
  procesos: [],
  runtimes: {},
  nota: '',
  ...extra,
});

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-sitios-'));
  rutas = new Rutas(base);
  carpeta = path.join(base, 'proyecto con ñ');
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(path.join(carpeta, 'index.html'), 'hola');
  nginxOk = true;
  estado = 'apagado';
  nginxInstalado = ['1.28.0'];
  phpInstalado = ['8.4'];
  llamadas = [];
  dominiosHosts = [];
  hostsRes = { ok: true };
  emitidos = [];
  gestorValidarHook = null;
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('GestorSitios', () => {
  it('crea un sitio con id derivado del dominio y emite el cambio', async () => {
    const g = gestor();
    const s = await g.crear(datos('mi-app.test'));
    expect(s.id).toBe('mi-app');
    expect(await g.listar()).toHaveLength(1);
    expect(emitidos).toHaveLength(1);
    const s2 = await g.crear(datos('mi.app.test'));
    expect(s2.id).toBe('mi-app-2');
  });

  it('rechaza dominios duplicados (también contra alias)', async () => {
    const g = gestor();
    await g.crear(datos('a.test', { alias: ['b.test'] }));
    await expect(g.crear(datos('a.test'))).rejects.toThrow(
      'Ya existe un sitio con el dominio a.test',
    );
    await expect(g.crear(datos('b.test'))).rejects.toThrow(
      'Ya existe un sitio con el dominio b.test',
    );
  });

  it('rechaza dominio sin .test', async () => {
    await expect(gestor().crear(datos('a.com'))).rejects.toThrow(
      'El dominio debe terminar en .test',
    );
  });

  it('proxy exige puerto', async () => {
    await expect(gestor().crear(datos('p.test', { tipo: 'proxy' }))).rejects.toThrow(
      'Un sitio proxy necesita un puerto',
    );
    const s = await gestor().crear(
      datos('p.test', { tipo: 'proxy', puertoProxy: 3000, carpeta: '' }),
    );
    expect(s.puertoProxy).toBe(3000);
  });

  it('exige PHP instalado para laravel/ci3/personalizado', async () => {
    const g = gestor();
    await expect(g.crear(datos('l.test', { tipo: 'laravel', php: '8.3' }))).rejects.toThrow(
      'PHP 8.3 no está instalado. Instálelo desde Servicios.',
    );
    await expect(g.crear(datos('l.test', { tipo: 'laravel', php: '8.4' }))).resolves.toBeDefined();
  });

  it('exige que la carpeta exista', async () => {
    const falsa = path.join(base, 'noexiste');
    await expect(gestor().crear(datos('c.test', { carpeta: falsa }))).rejects.toThrow(
      `La carpeta no existe: ${falsa}`,
    );
  });

  it('permite 10 sitios sin límite', async () => {
    const g = gestor();
    for (let i = 0; i < 10; i++) await g.crear(datos(`s${i}.test`));
    expect(await g.listar()).toHaveLength(10);
  });

  it('editar revalida unicidad excluyéndose a sí mismo', async () => {
    const g = gestor();
    const a = await g.crear(datos('a.test'));
    await g.crear(datos('b.test'));
    await expect(g.editar(a.id, { nota: 'x' })).resolves.toMatchObject({ nota: 'x', id: 'a' });
    await expect(g.editar(a.id, { dominio: 'b.test' })).rejects.toThrow(
      'Ya existe un sitio con el dominio b.test',
    );
    await expect(g.editar('nada', { nota: 'x' })).rejects.toThrow();
  });

  it('aplicar escribe vhosts, valida y sincroniza hosts con dominios y alias', async () => {
    const g = gestor();
    await g.crear(datos('b.test', { alias: ['z.test'] }));
    await g.crear(datos('a.test'));
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(true);
    expect(llamadas).toEqual(['validar']);
    const v = readFileSync(rutas.vhost('b'), 'utf8');
    expect(v).toContain('server_name b.test z.test;');
    expect(v).toContain('sitios/b.access.log');
    expect(dominiosHosts[0]).toEqual(['a.test', 'b.test', 'z.test']);
    expect(r.hosts).toEqual({ ok: true });
  });

  it('aplicar recarga si nginx está encendido', async () => {
    estado = 'encendido';
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.aplicar();
    expect(llamadas).toEqual(['recargar']);
  });

  it('si nginx no está instalado no valida y lo avisa', async () => {
    nginxInstalado = [];
    const g = gestor();
    await g.crear(datos('a.test'));
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(true);
    expect(r.nginx.salida).toContain('Nginx no está instalado');
    expect(llamadas).toEqual([]);
    expect(existsSync(rutas.vhost('a'))).toBe(true);
  });

  it('aplicar con validación fallida deja el vhost anterior intacto', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.aplicar();
    const antes = readFileSync(rutas.vhost('a'), 'utf8');
    await g.editar('a', { reglasExtra: 'cosa_rara on;' });
    await g.crear(datos('n.test'));
    nginxOk = false;
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(false);
    expect(r.nginx.salida).toContain('[emerg] fallo');
    expect(readFileSync(rutas.vhost('a'), 'utf8')).toBe(antes);
    expect(existsSync(rutas.vhost('n'))).toBe(false);
  });

  it('un fallo al recargar también restaura', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.aplicar();
    const antes = readFileSync(rutas.vhost('a'), 'utf8');
    estado = 'encendido';
    nginxOk = false;
    await g.editar('a', { reglasExtra: 'x;' });
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(false);
    expect(readFileSync(rutas.vhost('a'), 'utf8')).toBe(antes);
  });

  it('informa el fallo de hosts', async () => {
    hostsRes = { ok: false, motivo: 'cancelado', comandoManual: 'cmd' };
    const g = gestor();
    await g.crear(datos('a.test'));
    const r = await g.aplicar();
    expect(r.hosts).toEqual({ ok: false, motivo: 'cancelado', comandoManual: 'cmd' });
  });

  it('borrar elimina el vhost pero no la carpeta del proyecto', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.aplicar();
    await g.borrar('a');
    await g.aplicar();
    expect(existsSync(rutas.vhost('a'))).toBe(false);
    expect(existsSync(carpeta)).toBe(true);
    expect(await g.listar()).toHaveLength(0);
  });
});

describe('GestorSitios robustez', () => {
  it('si generar un vhost lanza, restaura los archivos anteriores byte a byte', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.crear(datos('b.test'));
    await g.aplicar();
    const a = readFileSync(rutas.vhost('a'), 'utf8');
    const b = readFileSync(rutas.vhost('b'), 'utf8');
    await g.borrar('b');
    await g.crear(datos('c.test'));
    await g.editar('a', { reglasExtra: 'x;' });
    // corrompe la config guardada: un laravel sin php hace lanzar a generarVhost
    const cfg = JSON.parse(readFileSync(rutas.config(), 'utf8'));
    cfg.sitios.push({
      ...cfg.sitios[0],
      id: 'roto',
      dominio: 'roto.test',
      tipo: 'laravel',
      php: null,
    });
    writeFileSync(rutas.config(), JSON.stringify(cfg));
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(false);
    expect(r.nginx.salida).toContain('No se pudo aplicar');
    expect(readFileSync(rutas.vhost('a'), 'utf8')).toBe(a);
    expect(readFileSync(rutas.vhost('b'), 'utf8')).toBe(b);
    expect(existsSync(rutas.vhost('c'))).toBe(false);
  });

  it('exige versión de PHP en laravel, codeigniter3 y personalizado', async () => {
    const g = gestor();
    for (const tipo of ['laravel', 'codeigniter3', 'personalizado'] as const) {
      await expect(g.crear(datos(`${tipo}.test`, { tipo }))).rejects.toThrow(
        'Seleccione una versión de PHP para este sitio',
      );
    }
  });

  it('codeigniter4 y wordpress exigen PHP; fastapi y node no', async () => {
    const g = gestor();
    for (const tipo of ['codeigniter4', 'wordpress'] as const) {
      await expect(g.crear(datos(`${tipo}.test`, { tipo }))).rejects.toThrow(
        'Seleccione una versión de PHP para este sitio',
      );
      expect((await g.crear(datos(`${tipo}-ok.test`, { tipo, php: '8.4' }))).php).toBe('8.4');
    }
    expect(ramasEnUso(await g.listar())).toEqual(['8.4']);
  });

  it('rails, springboot y aspnet son sitios de proxy: no piden PHP y necesitan puerto', async () => {
    const g = gestor();
    for (const tipo of ['rails', 'springboot', 'aspnet'] as const) {
      await expect(g.crear(datos(`${tipo}.test`, { tipo }))).rejects.toThrow(
        'necesita un puerto de proxy o un proceso con puerto',
      );
      const s = await g.crear(datos(`${tipo}-ok.test`, { tipo, puertoProxy: 8123 }));
      expect(s.php).toBeNull();
    }
  });

  it('fastapi y node necesitan un puerto de proxy o un proceso con puerto', async () => {
    const g = gestor();
    await expect(g.crear(datos('api.test', { tipo: 'fastapi' }))).rejects.toThrow(
      'Un sitio FastAPI o Node necesita un puerto de proxy o un proceso con puerto',
    );
    const proceso = {
      id: 'uvicorn',
      nombre: 'Uvicorn',
      comando: ['uvicorn', 'app:app'],
      cwd: 'raiz',
      autoIniciar: true,
      reiniciar: true,
      puerto: 8001,
      proxy: false,
    };
    const s = await g.crear(datos('api.test', { tipo: 'fastapi', procesos: [proceso] }));
    expect(s.procesos).toEqual([proceso]);
    expect((await g.crear(datos('web.test', { tipo: 'node', puertoProxy: 5173 }))).tipo).toBe(
      'node',
    );
    await expect(
      g.crear(datos('dup.test', { tipo: 'fastapi', procesos: [proceso, proceso] })),
    ).rejects.toThrow('El proceso uvicorn está repetido');
    await g.aplicar();
    expect(readFileSync(rutas.vhost('api'), 'utf8')).toContain('proxy_pass http://127.0.0.1:8001;');
  });

  it('solo un proceso puede ser el destino del proxy y necesita puerto', async () => {
    const g = gestor();
    const p = (id: string, puerto: number | null) => ({
      id,
      nombre: id,
      comando: ['x'],
      cwd: 'raiz',
      autoIniciar: false,
      reiniciar: false,
      puerto,
      proxy: true,
    });
    await expect(
      g.crear(datos('dos.test', { tipo: 'fastapi', procesos: [p('a', 8001), p('b', 8002)] })),
    ).rejects.toThrow('Solo un proceso puede ser el destino del proxy');
    await expect(
      g.crear(datos('sin.test', { tipo: 'fastapi', puertoProxy: 8000, procesos: [p('a', null)] })),
    ).rejects.toThrow('El proceso a es el destino del proxy y necesita un puerto');
  });

  it('dos crear() concurrentes persisten ambos', async () => {
    const g = gestor();
    await Promise.all([g.crear(datos('a.test')), g.crear(datos('b.test'))]);
    expect((await g.listar()).map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('si la restauración falla agrega el detalle pero conserva el error original', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.aplicar();
    await g.editar('a', { nota: 'n' });
    nginxOk = false;
    gestorValidarHook = () => {
      rmSync(rutas.vhost('a'));
      mkdirSync(rutas.vhost('a'));
    };
    const r = await g.aplicar();
    expect(r.nginx.ok).toBe(false);
    expect(r.nginx.salida).toContain('[emerg] fallo');
    expect(r.nginx.salida).toContain('No se pudo restaurar la configuración anterior:');
  });

  it('rechaza alias igual al dominio, repetidos y sin .test', async () => {
    const g = gestor();
    await expect(g.crear(datos('a.test', { alias: ['a.test'] }))).rejects.toThrow(
      /igual al dominio/,
    );
    await expect(g.crear(datos('a.test', { alias: ['x.test', 'x.test'] }))).rejects.toThrow(
      /repetido/,
    );
    await expect(g.crear(datos('a.test', { alias: ['x.com'] }))).rejects.toThrow(
      'El dominio debe terminar en .test',
    );
  });

  it('rechaza dominios y alias que el archivo hosts no admite', async () => {
    const g = gestor();
    await expect(g.crear(datos('mi sitio.test'))).rejects.toThrow(
      'Dominio inválido: mi sitio.test',
    );
    await expect(g.crear(datos('señal.test'))).rejects.toThrow('Dominio inválido: señal.test');
    await expect(g.crear(datos('ok.test', { alias: ['-mal.test'] }))).rejects.toThrow(
      'Dominio inválido: -mal.test',
    );
    expect(await g.listar()).toEqual([]);
  });

  it('guardarAjustes guarda solo puerto y trabajadores, y valida los rangos', async () => {
    const g = gestor();
    await g.crear(datos('a.test'));
    await g.guardarAjustes({ puerto: 8081, trabajadores: 3 });
    const cfg = await new Almacen(rutas).leer();
    expect(cfg.servicios.nginx.puerto).toBe(8081);
    expect(cfg.servicios.php.trabajadores).toBe(3);
    expect(cfg.sitios).toHaveLength(1);
    await expect(g.guardarAjustes({ puerto: 0, trabajadores: 2 })).rejects.toThrow(
      'entre 1 y 65535',
    );
    await expect(g.guardarAjustes({ puerto: 65536, trabajadores: 2 })).rejects.toThrow(
      'entre 1 y 65535',
    );
    await expect(g.guardarAjustes({ puerto: 80, trabajadores: 9 })).rejects.toThrow('entre 1 y 8');
    await expect(g.guardarAjustes({ puerto: 80, trabajadores: 1.5 })).rejects.toThrow(
      'entre 1 y 8',
    );
    expect((await new Almacen(rutas).leer()).servicios.nginx.puerto).toBe(8081);
  });

  it('editar una nota no revalida carpeta ni PHP', async () => {
    const g = gestor();
    const s = await g.crear(datos('l.test', { tipo: 'laravel', php: '8.4' }));
    rmSync(carpeta, { recursive: true });
    phpInstalado = [];
    await expect(g.editar(s.id, { nota: 'x' })).resolves.toMatchObject({ nota: 'x' });
    await expect(g.editar(s.id, { carpeta: path.join(base, 'otra') })).rejects.toThrow(
      'La carpeta no existe',
    );
  });
});

describe('proveedores de PHP', () => {
  const s = (tipo: Sitio['tipo'], php: string | null): Sitio => ({
    ...datos(`${tipo}${php}.test`),
    id: `${tipo}${php}`,
    tipo,
    php,
  });
  it('ramasEnUso ignora proxy/estático y ordena sin duplicados', () => {
    expect(
      ramasEnUso([
        s('laravel', '8.4'),
        s('laravel', '8.3'),
        s('estatico', '7.4'),
        s('proxy', '8.0'),
        s('personalizado', '8.4'),
        s('personalizado', null),
      ]),
    ).toEqual(['8.3', '8.4']);
  });
  it('upstreamsPara solo incluye ramas en uso e instaladas', () => {
    expect(upstreamsPara([s('laravel', '8.4'), s('laravel', '8.3')], 2, ['8.4', '8.2'])).toEqual([
      { version: '8.4', puertos: [9840, 9841] },
    ]);
  });
});

describe('GestorSitios: hosts fuera de la cola (QA 1)', () => {
  it('un UAC sin responder no bloquea otros guardados de la configuración', async () => {
    const eventos = new Eventos<EventosNucleo>();
    let soltar: (r: { ok: true }) => void = () => undefined;
    const g = new GestorSitios({
      almacen: new Almacen(rutas),
      rutas,
      nginx: { validar: async () => ({ ok: true, salida: 'ok' }), recargar: async () => undefined },
      estadoNginx: () => 'apagado',
      hosts: { sincronizar: () => new Promise((r) => (soltar = r)) },
      instalador: { instalado: async () => true, instalados: async () => ['1.28.0'] },
      eventos,
    });
    await g.crear(datos('a.test'));
    const aplicando = g.aplicar();
    let listo = false;
    void aplicando.then(() => (listo = true));
    // Mientras el UAC sigue abierto, la cola atiende otros cambios.
    await g.crear(datos('b.test'));
    await g.modificarConfig((c) => void (c.servicios.nginx.puerto = 8080));
    expect(await g.enCola(async () => 'credenciales')).toBe('credenciales');
    expect(listo).toBe(false);
    soltar({ ok: true });
    expect((await aplicando).hosts).toEqual({ ok: true });
  });

  it('si hosts queda pendiente, el sitio con HTTPS también queda pendiente', async () => {
    const eventos = new Eventos<EventosNucleo>();
    const g = new GestorSitios({
      almacen: new Almacen(rutas),
      rutas,
      nginx: { validar: async () => ({ ok: true, salida: 'ok' }), recargar: async () => undefined },
      estadoNginx: () => 'apagado',
      hosts: {
        sincronizar: async () => ({
          ok: false,
          motivo: 'tiempo',
          comandoManual: 'cmd',
          pendientes: ['a.test'],
        }),
      },
      instalador: { instalado: async () => true, instalados: async () => ['1.28.0'] },
      eventos,
      https: {
        caCreada: () => true,
        puertoUsable: async () => true,
        asegurarCertificado: async () => ({ crt: 'c.crt', key: 'c.key' }),
      },
    });
    await g.crear(datos('a.test', { https: true }));
    await g.crear(datos('b.test', { https: true }));
    const r = await g.aplicar();
    expect(r.hosts).toEqual({ ok: false, motivo: 'tiempo', comandoManual: 'cmd' });
    expect(r.httpsPendiente).toEqual(['a']);
    // El sitio queda guardado con su vhost.
    expect(existsSync(rutas.vhost('a'))).toBe(true);
  });
});

describe('GestorSitios.aplicar: orden y errores de hosts (ronda de seguridad)', () => {
  const armar = (sincronizar: () => Promise<never | { ok: true }>, orden: string[]) => {
    const eventos = new Eventos<EventosNucleo>();
    eventos.on('sitio:cambio', () => orden.push('sitio:cambio'));
    return new GestorSitios({
      almacen: new Almacen(rutas),
      rutas,
      nginx: { validar: async () => ({ ok: true, salida: 'ok' }), recargar: async () => undefined },
      estadoNginx: () => 'apagado',
      hosts: {
        sincronizar: async () => {
          orden.push('hosts');
          return sincronizar();
        },
      },
      instalador: { instalado: async () => true, instalados: async () => ['1.28.0'] },
      eventos,
    });
  };

  it('emite sitio:cambio y corre trasNginx antes de hosts', async () => {
    const orden: string[] = [];
    const g = armar(async () => ({ ok: true }), orden);
    await g.crear(datos('a.test'));
    orden.length = 0;
    const r = await g.aplicar({
      trasNginx: async (n) => {
        orden.push('trasNginx');
        return { ok: n.ok, salida: 'Nginx reiniciado' };
      },
    });
    expect(orden).toEqual(['sitio:cambio', 'trasNginx', 'hosts']);
    expect(r.nginx.salida).toBe('Nginx reiniciado');
  });

  it('si sincronizar lanza, hosts queda {ok:false, motivo:error}', async () => {
    const g = armar(async () => {
      throw new Error('raro');
    }, []);
    await g.crear(datos('a.test'));
    const r = await g.aplicar();
    expect(r.hosts).toMatchObject({ ok: false, motivo: 'error' });
  });
});

describe('GestorSitios.alinearVhosts (D40)', () => {
  const antiguo = (t: string): string =>
    t.replaceAll('127.0.0.1:80;', '80;').replaceAll('127.0.0.1:443 ssl;', '443 ssl;');

  it('reescribe con la plantilla actual los vhosts antiguos sin dirección en el listen', async () => {
    const g = gestor();
    const s = await g.crear(datos('viejo.test'));
    await g.aplicar();
    const actual = readFileSync(rutas.vhost(s.id), 'utf8');
    expect(actual).toContain('listen 127.0.0.1:80;');
    writeFileSync(rutas.vhost(s.id), antiguo(actual));
    expect(readFileSync(rutas.vhost(s.id), 'utf8')).not.toContain('127.0.0.1');
    dominiosHosts = [];

    await g.alinearVhosts();

    expect(readFileSync(rutas.vhost(s.id), 'utf8')).toBe(actual);
    // No toca el archivo hosts ni recarga Nginx: solo deja los vhosts al día.
    expect(dominiosHosts).toEqual([]);
  });

  it('no toca un vhost manual válido', async () => {
    const g = gestor();
    const s = await g.crear(datos('manual.test'));
    await g.aplicar();
    const manual = `${readFileSync(rutas.vhost(s.id), 'utf8')}\n# mío\n`;
    await g.modificarConfig((c) => {
      c.sitios[0]!.vhostManual = manual;
    });
    writeFileSync(rutas.vhost(s.id), manual);

    await g.alinearVhosts();

    expect(readFileSync(rutas.vhost(s.id), 'utf8')).toBe(manual);
  });

  it('con los vhosts ya al día no reescribe nada', async () => {
    const g = gestor();
    const s = await g.crear(datos('aldia.test'));
    await g.aplicar();
    const archivo = rutas.vhost(s.id);
    const pasado = new Date('2020-01-01T00:00:00Z');
    utimesSync(archivo, pasado, pasado);

    await g.alinearVhosts();

    expect(statSync(archivo).mtimeMs).toBe(pasado.getTime());
  });

  it('un vhost manual con listen sin dirección se descarta con aviso y queda el generado', async () => {
    const avisos: { sitio: string; modo: string }[] = [];
    const g = gestor((a) => avisos.push(a));
    const s = await g.crear(datos('roto.test'));
    await g.aplicar();
    const bueno = readFileSync(rutas.vhost(s.id), 'utf8');
    const manual = antiguo(bueno);
    await g.modificarConfig((c) => {
      c.sitios[0]!.vhostManual = manual;
    });
    writeFileSync(rutas.vhost(s.id), manual);

    await g.alinearVhosts();

    expect(readFileSync(rutas.vhost(s.id), 'utf8')).toBe(bueno);
    expect(avisos).toEqual([{ sitio: 'roto', modo: 'manual', motivo: expect.any(String) }]);
  });
});
