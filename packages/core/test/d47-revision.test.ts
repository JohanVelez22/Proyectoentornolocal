import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { extraer7z } from '../src/catalogo/extraer7z';
import { HerramientasPuertos } from '../src/herramientas/puertos';
import type { Ejecutor } from '../src/plataforma/tipos';
import { PROGRAMAS_VIGILADOS } from '../src/plataforma/firewallWin';
import { entornoProyecto, resolverPrograma, type Herramientas } from '../src/proyectos/pasos/comun';
import {
  asegurarEscuchaLocal,
  ESCUCHA_LOCAL_CJS,
  nodeOptionsConEscuchaLocal,
} from '../src/proyectos/escuchaLocal';
import { lanzamientoGradle, lanzamientoMaven } from '../src/runtimes/lanzadoresJava';
import { Runtimes, variablesRuntime } from '../src/runtimes/runtimes';
import { Rutas } from '../src/rutas';
import { SitioSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';
import { rm } from 'node:fs/promises';

const ejecutarArchivo = promisify(execFile);
const temporales: string[] = [];
afterEach(async () => {
  for (const t of temporales.splice(0)) await rm(t, { recursive: true, force: true });
});
async function temp(): Promise<string> {
  const c = await carpetaTemporal('pel-d47r-');
  temporales.push(c);
  return c;
}

/* ───────────── I1(a): precarga de Node ───────────── */

describe('D47 revisión I1(a): escucha-local.cjs', () => {
  const SONDA = `
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const casos = {
  puerto: (s, cb) => s.listen(0),
  puerto_cb: (s, cb) => s.listen(0, cb),
  cero: (s, cb) => s.listen('0', cb),
  sin_args: (s, cb) => { s.once('listening', cb); s.listen(); },
  solo_cb: (s, cb) => s.listen(cb),
  host_abierto: (s, cb) => s.listen(0, '0.0.0.0', cb),
  host_v6: (s, cb) => s.listen(0, '::', cb),
  host_vacio: (s, cb) => s.listen(0, '', cb),
  host_corchetes: (s, cb) => s.listen(0, '[::]', cb),
  host_v6_largo: (s, cb) => s.listen(0, '0:0::0', cb),
  host_v6_ceros: (s, cb) => s.listen(0, '0000:0000::', cb),
  host_v4_mapeado: (s, cb) => s.listen(0, '::ffff:0.0.0.0', cb),
  host_v6_sin_cortar: (s, cb) => s.listen({ port: 0, host: '[::]' }, cb),
  host_y_backlog: (s, cb) => s.listen(0, '0.0.0.0', 5, cb),
  puerto_backlog: (s, cb) => s.listen(0, 5, cb),
  opciones: (s, cb) => s.listen({ port: 0 }, cb),
  opciones_abierto: (s, cb) => s.listen({ port: 0, host: '::', ipv6Only: true }, cb),
  host_local: (s, cb) => s.listen(0, '127.0.0.1', cb),
  host_localhost: (s, cb) => s.listen(0, 'localhost', cb),
  host_ipv6_local: (s, cb) => s.listen(0, '::1', cb),
  pipe: (s, cb) => s.listen(process.platform === 'win32'
    ? '\\\\\\\\.\\\\pipe\\\\wolf-d47-' + process.pid
    : path.join(os.tmpdir(), 'wolf-d47-' + process.pid + '.sock'), cb),
};
const salida = {};
(async () => {
  for (const [nombre, f] of Object.entries(casos)) {
    const s = nombre === 'puerto' || nombre.startsWith('host') ? http.createServer() : net.createServer();
    await new Promise((resolve) => {
      s.on('error', (e) => { salida[nombre] = 'error:' + e.code; resolve(); });
      const cb = () => { const a = s.address(); salida[nombre] = typeof a === 'string' ? 'pipe' : a.address; s.close(() => resolve()); };
      f(s, cb);
      if (nombre === 'puerto') s.once('listening', cb);
    });
  }
  process.stdout.write(JSON.stringify(salida));
})();
`;

  it('fuerza 127.0.0.1 en todas las firmas y deja intactos pipes y hosts concretos', async () => {
    const base = await temp();
    const rutas = new Rutas(base);
    const precarga = await asegurarEscuchaLocal(rutas);
    expect(await readFile(precarga, 'utf8')).toBe(ESCUCHA_LOCAL_CJS);
    const sonda = path.join(base, 'sonda.cjs');
    await writeFile(sonda, SONDA);
    const { stdout } = await ejecutarArchivo(process.execPath, ['--require', precarga, sonda], {
      timeout: 30_000,
    });
    const r = JSON.parse(stdout) as Record<string, string>;
    for (const caso of [
      'puerto',
      'puerto_cb',
      'cero',
      'sin_args',
      'solo_cb',
      'host_abierto',
      'host_v6',
      'host_vacio',
      'host_corchetes',
      'host_v6_largo',
      'host_v6_ceros',
      'host_v4_mapeado',
      'host_v6_sin_cortar',
      'host_y_backlog',
      'puerto_backlog',
      'opciones',
      'opciones_abierto',
      'host_local',
    ]) {
      expect(r[caso], caso).toBe('127.0.0.1');
    }
    expect(r.host_ipv6_local).toBe('::1');
    expect(r.pipe).toBe('pipe');
    // `localhost` resuelve a ::1 o a 127.0.0.1: en cualquier caso, local.
    expect(['127.0.0.1', '::1']).toContain(r.host_localhost);
  });

  it('sin la precarga el mismo servidor escucha en todas las interfaces (la sonda detecta)', async () => {
    const base = await temp();
    const sonda = path.join(base, 'sonda.cjs');
    await writeFile(sonda, SONDA);
    const { stdout } = await ejecutarArchivo(process.execPath, [sonda], { timeout: 30_000 });
    const r = JSON.parse(stdout) as Record<string, string>;
    expect(['::', '0.0.0.0']).toContain(r.puerto);
  });

  it('NODE_OPTIONS: se concatena a lo que había; la ruta va entre comillas, con / y sin escapes', () => {
    expect(nodeOptionsConEscuchaLocal(undefined, 'C:\\a b\\x.cjs')).toBe(
      '--require "C:/a b/x.cjs"',
    );
    expect(nodeOptionsConEscuchaLocal('  ', 'C:/x.cjs')).toBe('--require "C:/x.cjs"');
    expect(nodeOptionsConEscuchaLocal('--no-warnings', 'C:\\x.cjs')).toBe(
      '--no-warnings --require "C:/x.cjs"',
    );
    // Una comilla suelta no rompe las comillas de la opción.
    expect(nodeOptionsConEscuchaLocal(undefined, 'C:/a"b.cjs')).toBe('--require "C:/a\\"b.cjs"');
  });

  it('C1: un Node real arranca con NODE_OPTIONS hecho desde una ruta con barras invertidas y espacio', async () => {
    const base = await temp();
    const carpeta = path.join(base, 'datos con espacio');
    await mkdir(carpeta, { recursive: true });
    const precarga = path.join(carpeta, 'escucha-local.cjs');
    await writeFile(precarga, ESCUCHA_LOCAL_CJS);
    // En Windows la ruta real trae `\`; en otros sistemas se usa la ruta tal cual.
    const ruta = process.platform === 'win32' ? path.win32.normalize(precarga) : precarga;
    const opciones = nodeOptionsConEscuchaLocal(undefined, ruta);
    expect(opciones).not.toMatch(/[\\]/);
    const sonda = path.join(base, 'servidor.cjs');
    await writeFile(
      sonda,
      "const s = require('node:http').createServer(); s.listen(0, () => { process.stdout.write(s.address().address); s.close(); });",
    );
    const { stdout } = await ejecutarArchivo(process.execPath, [sonda], {
      env: { ...process.env, NODE_OPTIONS: opciones },
      timeout: 30_000,
    });
    expect(stdout).toBe('127.0.0.1');
  });
});

/* ───────────── I1(b): escuchas del árbol ───────────── */

describe('D47 revisión I1(b): escuchasTcpDelArbol', () => {
  const NETSTAT = [
    '  TCP    0.0.0.0:8123           0.0.0.0:0              LISTENING       3100',
    '  TCP    127.0.0.1:9229         0.0.0.0:0              LISTENING       3100',
    '  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       1200',
    '  TCP    [::1]:5000             [::]:0                 LISTENING       3000',
    '  UDP    0.0.0.0:5353           *:*                                    3100',
    '  TCP    127.0.0.1:8123         127.0.0.1:50000        ESTABLISHED     3100',
  ].join('\r\n');
  // pid|padre|creado|nombre: 3000 (npm) → 3100 (node); 1200 es de otro árbol.
  const TABLA = ['3000|50|1|cmd.exe', '3100|3000|2|node.exe', '1200|50|3|nginx.exe'].join('\r\n');

  it('devuelve las escuchas TCP del proceso y de sus hijos, no las de otros árboles', async () => {
    const ejecutar: Ejecutor = async (cmd) => {
      const exe = path.win32.basename(cmd).toLowerCase();
      if (exe.startsWith('netstat')) return { codigo: 0, stdout: NETSTAT, stderr: '' };
      return { codigo: 0, stdout: TABLA, stderr: '' };
    };
    const h = new HerramientasPuertos({ ejecutar, pidApp: 50, pidPadre: 10 });
    const filas = await h.escuchasTcpDelArbol(3000);
    expect(filas.map((f) => `${f.direccion}:${f.puerto}`)).toEqual([
      '0.0.0.0:8123',
      '127.0.0.1:9229',
      '::1:5000',
    ]);
  });
});

describe('D47 revisión I2: una sola toma para varios procesos', () => {
  it('escuchasTcpDeArboles lee netstat y la tabla una vez y reparte por árbol', async () => {
    const llamadas: string[] = [];
    const ejecutar: Ejecutor = async (cmd) => {
      const exe = path.win32.basename(cmd).toLowerCase();
      llamadas.push(exe);
      if (exe.startsWith('netstat')) {
        return {
          codigo: 0,
          stdout: [
            '  TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       3100',
            '  TCP    127.0.0.1:8080         0.0.0.0:0              LISTENING       3300',
          ].join('\r\n'),
          stderr: '',
        };
      }
      return {
        codigo: 0,
        stdout: [
          '3000|50|1|cmd.exe',
          '3100|3000|2|dotnet.exe',
          '3200|50|3|cmd.exe',
          '3300|3200|4|java.exe',
        ].join('\r\n'),
        stderr: '',
      };
    };
    const h = new HerramientasPuertos({ ejecutar, pidApp: 50, pidPadre: 10 });
    const { escuchas: m, completa } = await h.escuchasTcpDeArboles([3000, 3200]);
    expect(completa).toBe(true);
    expect(m.get(3000)![0]!.nombre).toBe('dotnet.exe');
    expect(m.get(3000)!.map((f) => `${f.direccion}:${f.puerto}`)).toEqual(['0.0.0.0:5000']);
    expect(m.get(3200)!.map((f) => `${f.direccion}:${f.puerto}`)).toEqual(['127.0.0.1:8080']);
    expect(llamadas.filter((c) => c.startsWith('netstat'))).toHaveLength(1);
    expect(llamadas.filter((c) => c.startsWith('powershell'))).toHaveLength(1);
  });
});

describe('D47 revisión M9: sin tabla de procesos', () => {
  it('la toma sale incompleta (solo los PID raíz) para que quien vigila no la dé por buena', async () => {
    const ejecutar: Ejecutor = async (cmd) => {
      const exe = path.win32.basename(cmd).toLowerCase();
      if (exe.startsWith('netstat')) {
        return {
          codigo: 0,
          stdout: '  TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       3100',
          stderr: '',
        };
      }
      return { codigo: 1, stdout: '', stderr: 'falló' };
    };
    const h = new HerramientasPuertos({ ejecutar, pidApp: 50, pidPadre: 10 });
    const { escuchas, completa } = await h.escuchasTcpDeArboles([3000]);
    expect(completa).toBe(false);
    // El hijo 3100 no se puede atribuir a 3000 sin la tabla.
    expect(escuchas.get(3000)).toEqual([]);
  });
});

/* ───────────── I1(c) ───────────── */

describe('D47 revisión I1(c): programas vigilados del cortafuegos', () => {
  it('incluyen los runtimes de los proyectos', () => {
    for (const p of ['node', 'java', 'dotnet', 'ruby']) {
      expect(PROGRAMAS_VIGILADOS as readonly string[]).toContain(p);
    }
  });
});

/* ───────────── M1 y M4: extraer7z ───────────── */

describe('D47 revisión M1 y M4: extraer7z falla cerrado y con códigos', () => {
  const NOMBRES = 'rb/\nrb/bin/\nrb/bin/ruby.exe';
  const DETALLE = [
    'drwxr-xr-x  0 0      0           0 nov. 19 15:45 rb/',
    'drwxr-xr-x  0 0      0           0 nov. 19 15:45 rb/bin/',
    '-rw-r--r--  0 0      0          10 nov. 19 15:45 rb/bin/ruby.exe',
  ].join('\n');
  const exec = (nombres: string, detalle: string): { exec: Ejecutor; llamadas: string[][] } => {
    const llamadas: string[][] = [];
    return {
      llamadas,
      exec: async (_c, args) => {
        llamadas.push(args);
        if (args[0] === '-tf') return { codigo: 0, stdout: nombres, stderr: '' };
        if (args[0] === '-tvf') return { codigo: 0, stdout: detalle, stderr: '' };
        return { codigo: 0, stdout: '', stderr: '' };
      },
    };
  };

  it('con el listado entero interpretado, extrae', async () => {
    const t = exec(NOMBRES, DETALLE);
    await extraer7z(t.exec, 'tar', 'a.7z', 'dest');
    expect(t.llamadas.at(-1)).toEqual(['-xf', 'a.7z', '-C', 'dest']);
  });

  it('una línea del listado que no encaja con el formato: no se extrae', async () => {
    const t = exec(NOMBRES, `${DETALLE}\nlínea rara que no es un listado`);
    await expect(extraer7z(t.exec, 'tar', 'a.7z', 'dest')).rejects.toMatchObject({
      codigo: 'catalogo.paquete_invalido',
    });
    expect(t.llamadas.some((a) => a[0] === '-xf')).toBe(false);
  });

  it('un listado con menos líneas que nombres: no se extrae', async () => {
    const t = exec(NOMBRES, DETALLE.split('\n').slice(0, 2).join('\n'));
    await expect(extraer7z(t.exec, 'tar', 'a.7z', 'dest')).rejects.toMatchObject({
      codigo: 'catalogo.paquete_invalido',
    });
    expect(t.llamadas.some((a) => a[0] === '-xf')).toBe(false);
  });

  it('un fallo de tar sale con el código de extracción', async () => {
    const malo: Ejecutor = async () => ({ codigo: 1, stdout: '', stderr: 'boom' });
    await expect(extraer7z(malo, 'tar', 'a.7z', 'dest')).rejects.toMatchObject({
      codigo: 'catalogo.extraccion_fallo',
    });
  });
});

describe('D47 revisión M4: errores con código', () => {
  it('Maven y Gradle incompletos: runtimes.instalacion_incompleta', async () => {
    const vacio = await temp();
    await expect(lanzamientoMaven(vacio, 'java', 'x', [])).rejects.toMatchObject({
      codigo: 'runtimes.instalacion_incompleta',
      datos: { nombre: 'Maven' },
    });
    await expect(lanzamientoGradle(vacio, 'java', [])).rejects.toMatchObject({
      codigo: 'runtimes.instalacion_incompleta',
      datos: { nombre: 'Gradle' },
    });
  });

  it('falta de runtime o de JDK en resolverPrograma: códigos de runtimes.*', async () => {
    const rutas = new Rutas(await temp());
    const d = { runtimes: new Runtimes(rutas) };
    const h = (versiones: Herramientas['versiones']): Herramientas => ({ env: {}, versiones });
    await expect(resolverPrograma(['ruby', 'x'], 'C:\\p', d, h({}))).rejects.toMatchObject({
      codigo: 'runtimes.falta_runtime',
      datos: { nombre: 'Ruby' },
    });
    await expect(resolverPrograma(['dotnet', 'x'], 'C:\\p', d, h({}))).rejects.toMatchObject({
      codigo: 'runtimes.falta_runtime',
      datos: { nombre: '.NET' },
    });
    await expect(
      resolverPrograma(['mvn', 'x'], 'C:\\p', d, h({ java: '21' })),
    ).rejects.toMatchObject({ codigo: 'runtimes.falta_runtime', datos: { nombre: 'Maven' } });
    await expect(
      resolverPrograma(['gradle', 'x'], 'C:\\p', d, h({ gradle: '9.9.2' })),
    ).rejects.toMatchObject({ codigo: 'runtimes.falta_jdk' });
  });
});

/* ───────────── M2: gemas por proyecto ───────────── */

describe('D47 revisión M2: BUNDLE_PATH en el proyecto', () => {
  it('con Ruby en el entorno, las gemas van a <proyecto>/vendor/bundle y no al Ruby compartido', async () => {
    const base = await temp();
    const carpeta = await temp();
    const rutas = new Rutas(base);
    const exe = path.join(rutas.bin('ruby', '3.4.13-1'), 'bin', 'ruby.exe');
    await mkdir(path.dirname(exe), { recursive: true });
    await writeFile(exe, 'x');
    const runtimes = new Runtimes(rutas);
    const sitio = SitioSchema.parse({
      id: 'rb',
      nombre: 'rb',
      dominio: 'rb.test',
      carpeta,
      tipo: 'rails',
      runtimes: { ruby: '3.4.13-1' },
    });
    const e = await entornoProyecto(
      sitio,
      carpeta,
      {
        rutas,
        runtimes,
        php: async () => ({ exe: 'php', ini: 'php.ini' }),
        entorno: { Path: 'C:\\w' },
      },
      {},
    );
    expect(e.cambios.BUNDLE_PATH).toBe(path.join(carpeta, 'vendor', 'bundle'));
    expect(e.cambios.BUNDLE_PATH!.startsWith(rutas.bin('ruby', '3.4.13-1'))).toBe(false);
    // Un proyecto sin Ruby no recibe la variable.
    const otro = SitioSchema.parse({
      id: 'x',
      nombre: 'x',
      dominio: 'x.test',
      carpeta,
      tipo: 'node',
    });
    const sin = await entornoProyecto(
      otro,
      carpeta,
      {
        rutas,
        runtimes,
        php: async () => ({ exe: 'php', ini: 'php.ini' }),
        entorno: { Path: 'C:\\w' },
      },
      {},
    );
    expect(sin.cambios.BUNDLE_PATH).toBeUndefined();
  });

  it('Bundler guarda su configuración y caché en la carpeta de datos', () => {
    expect(variablesRuntime('ruby', 'C:\\r', { datos: 'C:\\datos' })).toEqual({
      BUNDLE_USER_HOME: path.join('C:\\datos', 'cache', 'ruby', 'bundle'),
    });
    expect(variablesRuntime('ruby', 'C:\\r')).toEqual({});
  });
});
