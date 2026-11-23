import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ejecutor, Plataforma } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { ErrorPuertoOcupado, ServicioNginx } from '../src/servicios/nginx';
import { ServicioPhp } from '../src/servicios/php';
import { Servicios } from '../src/servicios/servicios';
import { ConfigSchema, type Config } from '../src/tipos';

let base: string;
let rutas: Rutas;
let iniciados: DefProceso[];
let detenidos: string[];
let estados: Map<string, EstadoProceso>;
let pids: Map<string, number>;
let ocupados: Map<number, { pid: number; nombre: string }>;
let respuestas: Set<number>;
let llamadas: { cmd: string; args: string[] }[];
let codigoExec: number;
let cfg: Config;

const supervisor = () =>
  ({
    iniciar: async (d: DefProceso) => {
      iniciados.push(d);
      estados.set(d.id, 'iniciando');
      pids.set(d.id, 1000 + iniciados.length);
    },
    detener: async (id: string) => {
      detenidos.push(id);
      estados.delete(id);
      pids.delete(id);
    },
    estado: (id: string) => estados.get(id) ?? 'apagado',
    pid: (id: string) => pids.get(id) ?? null,
  }) as never;

const plataforma = (): Plataforma =>
  ({
    quienUsaPuerto: async (p: number) => ocupados.get(p) ?? null,
    instalarCertificadoUsuario: async () => ({ ok: true as const }),
    quitarCertificadoUsuario: async () => ({ ok: true as const }),
    certificadoInstalado: async () => false,
    procesoVivo: async () => ({ vivo: false }),
    ejecutable: (n: string) => `${n}.exe`,
  }) as unknown as Plataforma;

const exec: Ejecutor = async (cmd, args) => {
  llamadas.push({ cmd, args });
  return { codigo: codigoExec, stdout: '', stderr: codigoExec ? 'nginx: [emerg] fallo' : 'ok' };
};

const instalador = (nginx: string[], php: string[]) => {
  const de = (s: string): string[] => (s === 'nginx' ? nginx : s === 'php' ? php : []);
  return {
    instalados: async (s: string) => de(s),
    instalado: async (s: string, v: string) => de(s).includes(v),
  } as never;
};

function sembrarNginx(v: string): string {
  const bin = rutas.bin('nginx', v);
  mkdirSync(path.join(bin, 'conf'), { recursive: true });
  writeFileSync(path.join(bin, 'conf', 'mime.types'), 'types {}');
  writeFileSync(path.join(bin, 'conf', 'fastcgi_params'), 'fastcgi_param X 1;');
  return bin;
}

function sembrarPhp(v: string): string {
  const bin = rutas.bin('php', v);
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    path.join(bin, 'php.ini-development'),
    [
      '; extension_dir = "ext"',
      ';extension=curl',
      ';extension=fileinfo',
      ';extension=gd',
      ';extension=intl',
      ';extension=mbstring',
      ';extension=openssl',
      ';extension=pdo_mysql',
      ';extension=pdo_pgsql',
      ';extension=pdo_sqlite',
      ';extension=pgsql',
      ';extension=sqlite3',
      ';extension=zip',
      'memory_limit = 128M',
      ';date.timezone =',
      '',
    ].join('\r\n'),
  );
  return bin;
}

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-serv-'));
  rutas = new Rutas(base);
  iniciados = [];
  detenidos = [];
  estados = new Map();
  pids = new Map();
  ocupados = new Map();
  respuestas = new Set();
  llamadas = [];
  codigoExec = 0;
  cfg = ConfigSchema.parse({});
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('ServicioPhp', () => {
  const crear = () =>
    new ServicioPhp(rutas, plataforma(), supervisor(), instalador([], ['8.4']), async () => cfg);

  it('asegurarPhpIni: lo genera si falta y lo regenera si extension_dir no es el del bin actual', async () => {
    const bin = sembrarPhp('8.4');
    const ini = rutas.phpIni('8.4');
    expect(await crear().asegurarPhpIni('8.4')).toBe(ini);
    const correcto = `extension_dir="${bin.replace(/\\/g, '/')}/ext"`;
    expect(readFileSync(ini, 'utf8')).toContain(correcto);
    // con el extension_dir correcto no se toca (se conservan cambios a mano)
    writeFileSync(ini, `${correcto}\r\n; a mano\r\n`);
    await crear().asegurarPhpIni('8.4');
    expect(readFileSync(ini, 'utf8')).toBe(`${correcto}\r\n; a mano\r\n`);
    // carpeta de datos movida: extension_dir viejo → se regenera
    writeFileSync(ini, 'extension_dir="C:/Users/viejo/WolfCore Dev/bin/php/8.4/ext"\r\n');
    await crear().asegurarPhpIni('8.4');
    expect(readFileSync(ini, 'utf8')).toContain(correcto);
    // sin extension_dir → se regenera
    writeFileSync(ini, 'memory_limit=1G\r\n');
    await crear().asegurarPhpIni('8.4');
    expect(readFileSync(ini, 'utf8')).toContain(correcto);
  });

  it('genera php.ini con extensiones y valores', async () => {
    const bin = sembrarPhp('8.4');
    await crear().generarIni('8.4');
    const ini = readFileSync(rutas.phpIni('8.4'), 'utf8');
    expect(ini).toContain(`extension_dir="${bin.replace(/\\/g, '/')}/ext"`);
    for (const e of [
      'curl',
      'fileinfo',
      'gd',
      'intl',
      'mbstring',
      'openssl',
      'pdo_mysql',
      'pdo_pgsql',
      'pdo_sqlite',
      'pgsql',
      'sqlite3',
      'zip',
      'sodium',
    ])
      expect(ini).toMatch(new RegExp(`^extension=${e}\\s*$`, 'm'));
    expect(ini).not.toMatch(/^;extension=curl/m);
    expect(ini).toMatch(/^memory_limit\s*=\s*512M\s*$/m);
    expect(ini).not.toContain('128M');
    expect(ini).toMatch(/^upload_max_filesize\s*=\s*64M\s*$/m);
    expect(ini).toMatch(/^post_max_size\s*=\s*64M\s*$/m);
    expect(ini).toMatch(/^date\.timezone\s*=\s*America\/Bogota\s*$/m);
    expect(ini).toMatch(/^cgi\.fix_pathinfo\s*=\s*0\s*$/m);
  });

  it('activa OPcache (si la rama trae php_opcache.dll) con revalidación inmediata (QA 5)', async () => {
    const bin = sembrarPhp('8.4');
    writeFileSync(
      path.join(bin, 'php.ini-development'),
      [
        ';zend_extension=opcache',
        'max_execution_time = 30',
        '[opcache]',
        ';opcache.enable=1',
        ';opcache.revalidate_freq=2',
      ].join('\r\n'),
    );
    mkdirSync(path.join(bin, 'ext'), { recursive: true });
    writeFileSync(path.join(bin, 'ext', 'php_opcache.dll'), '');
    await crear().generarIni('8.4');
    const ini = readFileSync(rutas.phpIni('8.4'), 'utf8');
    expect(ini).toMatch(/^zend_extension=opcache\s*$/m);
    expect(ini).not.toMatch(/^;zend_extension=opcache/m);
    expect(ini).toMatch(/^opcache\.enable=1\s*$/m);
    expect(ini).toMatch(/^opcache\.validate_timestamps=1\s*$/m);
    expect(ini).toMatch(/^opcache\.revalidate_freq=0\s*$/m);
    expect(ini).toMatch(/^max_execution_time=120\s*$/m);
    expect(ini).not.toMatch(/^max_execution_time\s*=\s*30/m);

    // Sin el .dll (PHP 8.5 lo trae incorporado) no se agrega zend_extension: daría un aviso.
    rmSync(path.join(bin, 'ext', 'php_opcache.dll'));
    await crear().generarIni('8.4');
    const sinDll = readFileSync(rutas.phpIni('8.4'), 'utf8');
    expect(sinDll).not.toMatch(/^zend_extension=opcache/m);
    expect(sinDll).toMatch(/^opcache\.enable=1\s*$/m);
  });

  it('inicia dos procesos en 9840 y 9841 con PHP_FCGI_MAX_REQUESTS=0', async () => {
    sembrarPhp('8.4');
    await crear().iniciar('8.4');
    expect(iniciados.map((d) => [d.id, d.puerto])).toEqual([
      ['php-8.4-0', 9840],
      ['php-8.4-1', 9841],
    ]);
    const d = iniciados[0]!;
    expect(d.env?.PHP_FCGI_MAX_REQUESTS).toBe('0');
    expect(d.reiniciar).toBe(true);
    expect(d.args).toEqual(['-c', rutas.phpIni('8.4'), '-b', '127.0.0.1:9840']);
    expect(d.log).toBe(rutas.logs('php-8.4.log'));
    expect(existsSync(rutas.phpIni('8.4'))).toBe(true);
  });

  it('lanza ErrorPuertoOcupado si un puerto está ocupado y no inicia ninguno', async () => {
    sembrarPhp('8.4');
    ocupados.set(9841, { pid: 55, nombre: 'FlyEnv.exe' });
    await expect(crear().iniciar('8.4')).rejects.toMatchObject({ puerto: 9841, pid: 55 });
    expect(iniciados).toHaveLength(0);
  });

  it('detiene todos los trabajadores', async () => {
    sembrarPhp('8.4');
    await crear().iniciar('8.4');
    await crear().detener('8.4');
    expect(detenidos).toEqual(expect.arrayContaining(['php-8.4-0', 'php-8.4-1']));
  });

  it('falla si PHP no está instalado', async () => {
    await expect(crear().iniciar('8.3')).rejects.toThrow(/PHP 8\.3 no está instalado/);
  });
});

describe('ServicioNginx', () => {
  const crear = (inst = instalador(['1.28.0'], [])) =>
    new ServicioNginx(
      rutas,
      plataforma(),
      supervisor(),
      inst,
      async () => cfg,
      async () => [{ version: '8.4', puertos: [9840, 9841] }],
      exec,
    );

  it('inicia con -p y -c, prueba la config antes y copia mime.types', async () => {
    const bin = sembrarNginx('1.28.0');
    await crear().iniciar();
    expect(llamadas[0]!.args).toEqual(['-t', '-p', bin, '-c', `${rutas.nginxConf()}.nuevo`]);
    const d = iniciados[0]!;
    expect(d.id).toBe('nginx');
    expect(d.args).toEqual(['-p', bin, '-c', rutas.nginxConf()]);
    expect(d.puerto).toBe(80);
    expect(d.reiniciar).toBe(true);
    expect(d.log).toBe(rutas.logs('nginx.log'));
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toContain('server 127.0.0.1:9840;');
    const etc = path.dirname(rutas.nginxConf());
    expect(existsSync(path.join(etc, 'mime.types'))).toBe(true);
    expect(existsSync(path.join(etc, 'fastcgi_params'))).toBe(true);
  });

  it('validar prueba y reemplaza la config sin iniciar ni lanzar', async () => {
    sembrarNginx('1.28.0');
    const r = await crear().validar();
    expect(r.ok).toBe(true);
    expect(iniciados).toHaveLength(0);
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toContain('server 127.0.0.1:9840;');
    writeFileSync(rutas.nginxConf(), 'conf anterior');
    codigoExec = 1;
    const mal = await crear().validar();
    expect(mal.ok).toBe(false);
    expect(mal.salida).toMatch(/\[emerg\] fallo/);
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toBe('conf anterior');
  });

  it('con el puerto ocupado lanza ErrorPuertoOcupado con nombre y PID', async () => {
    sembrarNginx('1.28.0');
    ocupados.set(80, { pid: 1234, nombre: 'nginx.exe' });
    const err = await crear()
      .iniciar()
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ErrorPuertoOcupado);
    expect((err as Error).message).toBe(
      'El puerto 80 lo usa nginx.exe (PID 1234). Ciérrelo o cambie el puerto en Ajustes.',
    );
    expect(iniciados).toHaveLength(0);
  });

  it('no es conflicto si el PID es nuestro nginx', async () => {
    sembrarNginx('1.28.0');
    estados.set('nginx', 'encendido');
    pids.set('nginx', 77);
    ocupados.set(80, { pid: 77, nombre: 'nginx.exe' });
    await expect(crear().iniciar()).resolves.toBeUndefined();
  });

  it('lanza el error de nginx si la config no es válida', async () => {
    sembrarNginx('1.28.0');
    codigoExec = 1;
    await expect(crear().iniciar()).rejects.toThrow(/\[emerg\] fallo/);
    expect(iniciados).toHaveLength(0);
  });

  it('probarConVhost: nginx -t sobre una copia temporal con el vhost nuevo; no toca la real', async () => {
    const bin = sembrarNginx('1.28.0');
    const sites = path.dirname(rutas.vhost('x'));
    mkdirSync(sites, { recursive: true });
    writeFileSync(rutas.vhost('blog'), 'server { # anterior }\n');
    writeFileSync(rutas.vhost('otro'), 'server { # otro }\n');
    writeFileSync(rutas.nginxConf(), 'conf real');
    let visto: { conf: string; sitios: Record<string, string> } | null = null;
    const execVhost: Ejecutor = async (cmd, args) => {
      llamadas.push({ cmd, args });
      const conf = args[args.indexOf('-c') + 1]!;
      const dir = path.join(path.dirname(conf), 'sites');
      visto = {
        conf: readFileSync(conf, 'utf8'),
        sitios: Object.fromEntries(
          ['blog.conf', 'otro.conf'].map((n) => [n, readFileSync(path.join(dir, n), 'utf8')]),
        ),
      };
      return {
        codigo: 1,
        stdout: '',
        stderr: `nginx: [emerg] unknown directive "gzipp" in ${dir.replace(/\\/g, '/')}/blog.conf:3`,
      };
    };
    const n = new ServicioNginx(
      rutas,
      plataforma(),
      supervisor(),
      instalador(['1.28.0'], []),
      async () => cfg,
      async () => [],
      execVhost,
    );
    const r = await n.probarConVhost('blog', 'server { gzipp on; }\n');
    expect(r.ok).toBe(false);
    expect(llamadas[0]!.args.slice(0, 3)).toEqual(['-t', '-p', bin]);
    expect(visto!.sitios).toEqual({
      'blog.conf': 'server { gzipp on; }\n',
      'otro.conf': 'server { # otro }\n',
    });
    expect(visto!.conf).toContain('/sites/*.conf";');
    expect(visto!.conf).not.toContain(`${sites.replace(/\\/g, '/')}/*.conf`);
    // La salida nombra el archivo real del sitio, no la copia temporal.
    expect(r.salida).toContain(`${sites.replace(/\\/g, '/')}/blog.conf:3`);
    // Lo real queda igual y la copia temporal se borró.
    expect(readFileSync(rutas.vhost('blog'), 'utf8')).toBe('server { # anterior }\n');
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toBe('conf real');
    expect(readdirSync(rutas.tmp()).filter((x) => x.startsWith('nginx-prueba-'))).toEqual([]);
  });

  it('crea logs y temp bajo el prefijo antes de probar', async () => {
    const bin = sembrarNginx('1.28.0');
    await crear().iniciar();
    expect(existsSync(path.join(bin, 'logs'))).toBe(true);
    expect(existsSync(path.join(bin, 'temp'))).toBe(true);
  });

  it('si -t falla conserva intacto el nginx.conf anterior y borra el candidato', async () => {
    sembrarNginx('1.28.0');
    mkdirSync(path.dirname(rutas.nginxConf()), { recursive: true });
    writeFileSync(rutas.nginxConf(), 'conf anterior');
    codigoExec = 1;
    await expect(crear().iniciar()).rejects.toThrow(/\[emerg\] fallo/);
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toBe('conf anterior');
    expect(existsSync(`${rutas.nginxConf()}.nuevo`)).toBe(false);
    estados.set('nginx', 'encendido');
    await expect(crear().recargar()).rejects.toThrow();
    expect(readFileSync(rutas.nginxConf(), 'utf8')).toBe('conf anterior');
    expect(llamadas.some((l) => l.args[1] === 'reload')).toBe(false);
  });

  it('falla si nginx no está instalado', async () => {
    await expect(crear(instalador([], [])).iniciar()).rejects.toThrow(
      'Nginx no está instalado. Instálelo desde Servicios.',
    );
  });

  it('usa la versión configurada si está instalada, si no la más reciente', async () => {
    sembrarNginx('1.26.0');
    const bin = sembrarNginx('1.28.0');
    cfg.servicios.nginx.version = '1.26.0';
    await crear(instalador(['1.26.0', '1.28.0'], [])).iniciar();
    expect(iniciados[0]!.args[1]).toBe(rutas.bin('nginx', '1.26.0'));
    iniciados = [];
    estados.clear();
    cfg.servicios.nginx.version = '9.9.9';
    await crear(instalador(['1.26.0', '1.28.0'], [])).iniciar();
    expect(iniciados[0]!.args[1]).toBe(bin);
  });

  it('recargar es no-op si nginx no corre y usa -s reload si corre', async () => {
    sembrarNginx('1.28.0');
    await crear().recargar();
    expect(llamadas).toHaveLength(0);
    estados.set('nginx', 'encendido');
    await crear().recargar();
    expect(llamadas.at(-1)!.args).toEqual([
      '-s',
      'reload',
      '-p',
      rutas.bin('nginx', '1.28.0'),
      '-c',
      rutas.nginxConf(),
    ]);
  });

  it('detener hace quit y luego libera en el supervisor', async () => {
    sembrarNginx('1.28.0');
    estados.set('nginx', 'encendido');
    pids.set('nginx', 5);
    await crear().detener();
    expect(llamadas[0]!.args.slice(0, 2)).toEqual(['-s', 'quit']);
    expect(detenidos).toContain('nginx');
  });
});

describe('Servicios', () => {
  const crear = (opts: { ramas?: string[] } = {}) =>
    new Servicios({
      rutas,
      plataforma: plataforma(),
      supervisor: supervisor(),
      instalador: instalador(['1.28.0'], ['8.4']),
      leerConfig: async () => cfg,
      modificarConfig: async (fn) => fn(cfg),
      ramasEnUso: async () => opts.ramas ?? ['8.4'],
      sonda: async (p) => respuestas.has(p),
      exec,
    });

  it('estados() marca 3306 como externo cuando la sonda responde', async () => {
    respuestas.add(3306);
    const e = await crear().estados();
    const my = e.find((s) => s.id === 'mysql');
    expect(my).toMatchObject({ estado: 'externo', nombre: 'MySQL (externo)', puertos: [3306] });
    expect(e.find((s) => s.id === 'postgresql')).toBeUndefined();
  });

  it('agrega los trabajadores de PHP en un estado', async () => {
    estados.set('php-8.4-0', 'encendido');
    estados.set('php-8.4-1', 'iniciando');
    const e = await crear().estados();
    expect(e.find((s) => s.id === 'php-8.4')).toMatchObject({
      estado: 'iniciando',
      version: '8.4',
      puertos: [9840, 9841],
    });
    estados.set('php-8.4-1', 'encendido');
    expect((await crear().estados()).find((s) => s.id === 'php-8.4')!.estado).toBe('encendido');
    estados.set('php-8.4-1', 'error');
    expect((await crear().estados()).find((s) => s.id === 'php-8.4')!.estado).toBe('error');
  });

  it('iniciarTodo arranca PHP y luego nginx; detenerTodo al revés', async () => {
    sembrarNginx('1.28.0');
    sembrarPhp('8.4');
    const s = crear();
    await s.iniciarTodo();
    expect(iniciados.map((d) => d.id)).toEqual(['php-8.4-0', 'php-8.4-1', 'nginx']);
    await s.detenerTodo();
    expect(detenidos[0]).toBe('nginx');
    expect(detenidos.slice(1)).toContain('php-8.4-0');
  });

  it('los PHP propios de los sitios arrancan tras su rama y se apagan antes que ella', async () => {
    sembrarPhp('8.4');
    const orden: string[] = [];
    const s = new Servicios({
      rutas,
      plataforma: plataforma(),
      supervisor: supervisor(),
      instalador: instalador(['1.28.0'], ['8.4']),
      leerConfig: async () => cfg,
      modificarConfig: async (fn) => fn(cfg),
      ramasEnUso: async () => ['8.4'],
      sonda: async (p) => respuestas.has(p),
      exec,
      poolsSitio: {
        iniciarRama: async (r) => {
          orden.push(`pools+${r}:${iniciados.map((d) => d.id).join(',')}`);
          throw new Error('puerto ocupado');
        },
        detenerRama: async (r) => {
          orden.push(`pools-${r}:${detenidos.join(',')}`);
        },
      },
    });
    // Un pool de sitio que falla no tumba la rama.
    await s.iniciar('php-8.4');
    await s.detener('php-8.4');
    expect(orden).toEqual(['pools+8.4:php-8.4-0,php-8.4-1', 'pools-8.4:']);
    expect(detenidos).toContain('php-8.4-0');
  });
});
