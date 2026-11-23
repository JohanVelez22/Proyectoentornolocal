import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  conexionPodman,
  Contenedores,
  esUriLocal,
  interpretarPs,
  limpiarLineaRegistro,
  validarIdContenedor,
  type DepsContenedores,
  type MotorContenedores,
} from '../src/contenedores/contenedores';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { Ejecutor, Lanzador, OpcionesLanzar } from '../src/plataforma/tipos';
import { buscarEjecutableWindows, PlataformaWindows } from '../src/plataforma/win';

/* ───────────── Salidas reales (recortadas) de cada CLI ───────────── */

const ID_DOCKER_1 = 'a1b2c3d4e5f6';
const ID_DOCKER_2 = '0f9e8d7c6b5a';
const PS_DOCKER = [
  JSON.stringify({
    Command: '"docker-entrypoint.s…"',
    CreatedAt: '2026-11-20 10:00:00 -0500 -05',
    ID: ID_DOCKER_1,
    Image: 'mysql:8.4',
    Labels:
      'com.docker.compose.project=tienda,com.docker.compose.project.config_files=C:\\p\\a.yml,C:\\p\\b.yml,com.docker.compose.service=db',
    Names: 'tienda-db-1',
    Ports: '0.0.0.0:3307->3306/tcp, [::]:3307->3306/tcp',
    State: 'running',
    Status: 'Up 2 hours',
  }),
  JSON.stringify({
    ID: ID_DOCKER_2,
    Image: 'redis:7',
    Labels: '',
    Names: 'cache',
    Ports: '',
    State: 'exited',
    Status: 'Exited (137) 5 minutes ago',
  }),
  '',
].join('\n');

const ID_PODMAN = 'b'.repeat(64);
const PS_PODMAN = JSON.stringify([
  {
    AutoRemove: false,
    Command: ['nginx', '-g', 'daemon off;'],
    Created: 1763650000,
    ExitCode: 0,
    Exited: false,
    Id: ID_PODMAN,
    Image: 'docker.io/library/nginx:latest',
    Labels: { 'io.podman.compose.project': 'blog' },
    Names: ['blog_web_1'],
    Pod: '',
    Ports: [
      { host_ip: '', container_port: 80, host_port: 8080, range: 1, protocol: 'tcp' },
      { host_ip: '127.0.0.1', container_port: 9000, host_port: 9000, range: 3, protocol: 'tcp' },
    ],
    State: 'running',
    Status: '',
  },
  {
    Id: 'c'.repeat(64),
    Image: 'docker.io/library/postgres:16',
    Labels: null,
    Names: ['pg'],
    Ports: null,
    State: 'exited',
    ExitCode: 1,
  },
  {
    Id: 'd'.repeat(64),
    Image: 'alpine',
    Names: ['pausa'],
    State: 'paused',
  },
]);

/* ───────────── CLI falsa ───────────── */

interface Llamada {
  cmd: string;
  args: string[];
  timeoutMs: number | undefined;
  env: Record<string, string> | undefined;
}

type Respuesta = { codigo: number; stdout?: string; stderr?: string };

/** Ejecutor falso: responde según el subcomando (lo que sigue a las opciones globales). */
type Respuestas = Record<string, Respuesta | ((args: string[]) => Respuesta)>;

/** Quita el destino fijado (`-H <endpoint>` o `--connection <nombre>`). */
const sinDestino = (args: string[]): string[] =>
  args[0] === '-H' || args[0] === '--connection' ? args.slice(2) : args;

function cliFalsa(respuestas: Respuestas) {
  const llamadas: Llamada[] = [];
  const exec: Ejecutor = async (cmd, args, opts) => {
    llamadas.push({ cmd, args, timeoutMs: opts?.timeoutMs, env: opts?.env });
    const sinGlobales = sinDestino(args);
    const clave = sinGlobales.slice(0, 2).join(' ');
    const r = respuestas[clave] ?? respuestas[sinGlobales[0] ?? ''];
    const v = typeof r === 'function' ? r(sinGlobales) : r;
    return { codigo: v?.codigo ?? 127, stdout: v?.stdout ?? '', stderr: v?.stderr ?? 'no' };
  };
  return { exec, llamadas };
}

const DOCKER_OK = {
  'context inspect': { codigo: 0, stdout: 'npipe:////./pipe/docker_engine\n' },
  version: { codigo: 0, stdout: '27.3.1\n' },
  'ps -a': { codigo: 0, stdout: PS_DOCKER },
};

const PODMAN_OK = {
  'system connection': {
    codigo: 0,
    stdout: JSON.stringify([
      {
        Name: 'podman-machine-default',
        URI: 'ssh://user@127.0.0.1:53210/run/user/1000/podman/podman.sock',
        IsMachine: true,
        Default: true,
      },
    ]),
  },
  info: { codigo: 0, stdout: '5.3.1\n' },
  'ps -a': { codigo: 0, stdout: PS_PODMAN },
};

const RUTA_DOCKER = path.join('/conocida/docker', 'docker.bin');
const RUTA_PODMAN = path.join('/conocida/podman', 'podman.bin');
const PIPE = 'npipe:////./pipe/docker_engine';
const H = ['-H', PIPE];
const MAQUINA = ['--connection', 'podman-machine-default'];

function montar(
  o: {
    docker?: Respuestas;
    podman?: Respuestas;
    enPath?: Partial<Record<MotorContenedores, string>>;
    conocidas?: Partial<Record<MotorContenedores, string>>;
    entorno?: Record<string, string>;
    lanzar?: Lanzador;
    alDetenido?: DepsContenedores['alDetenido'];
  } = {},
) {
  const docker = cliFalsa(o.docker ?? {});
  const podman = cliFalsa(o.podman ?? {});
  const conocidas = o.conocidas ?? { docker: RUTA_DOCKER, podman: RUTA_PODMAN };
  const exec: Ejecutor = (cmd, args, opts) =>
    cmd.includes('podman') ? podman.exec(cmd, args, opts) : docker.exec(cmd, args, opts);
  const emitidos: { motor: string; id: string; lineas: string[]; fin?: boolean }[] = [];
  const buscados: string[] = [];
  const c = new Contenedores({
    exec,
    lanzar: o.lanzar ?? (async () => ({ codigo: 0 })),
    plataforma: {
      nombreEjecutable: (b) => `${b}.bin`,
      carpetasContenedores: async (m) => [`/conocida/${m}`],
      buscarEjecutable: async (n) => {
        buscados.push(n);
        return o.enPath?.[n as MotorContenedores] ?? null;
      },
    },
    existe: (ruta) => Object.values(conocidas).includes(ruta),
    entorno: o.entorno ?? {},
    emitir: (d) => emitidos.push(d),
    ...(o.alDetenido ? { alDetenido: o.alDetenido } : {}),
    intervaloLineasMs: 5,
  });
  return { c, docker, podman, emitidos, buscados };
}

/* ───────────── Pruebas ───────────── */

describe('validarIdContenedor', () => {
  it('acepta nombres e ids hexadecimales cortos y largos', () => {
    for (const id of ['web', 'tienda-db-1', 'a.b_c', ID_DOCKER_1, ID_PODMAN, 'A'.repeat(128)]) {
      expect(validarIdContenedor(id)).toBe(id);
    }
  });

  it('rechaza lo que podría ser una opción, texto libre o algo demasiado largo', () => {
    for (const id of [
      '',
      '-f',
      '--rm',
      '.oculto',
      '_x',
      'a b',
      'a;rm -rf /',
      'a/b',
      'a\\b',
      '$(id)',
      'a\nb',
      'A'.repeat(129),
      42,
      null,
      undefined,
      { id: 'x' },
    ]) {
      expect(() => validarIdContenedor(id)).toThrowError(
        expect.objectContaining({ codigo: 'contenedores.id_invalido' }),
      );
    }
  });
});

describe('interpretarPs', () => {
  it('lee el JSON por líneas de Docker (puertos en texto, etiquetas k=v)', () => {
    const l = interpretarPs(PS_DOCKER);
    expect(l).toEqual([
      {
        id: ID_DOCKER_1,
        nombre: 'tienda-db-1',
        imagen: 'mysql:8.4',
        estado: 'corriendo',
        detalle: 'Up 2 hours',
        puertos: ['0.0.0.0:3307->3306/tcp', '[::]:3307->3306/tcp'],
        proyectoCompose: 'tienda',
        codigoSalida: null,
      },
      {
        id: ID_DOCKER_2,
        nombre: 'cache',
        imagen: 'redis:7',
        estado: 'detenido',
        detalle: 'Exited (137) 5 minutes ago',
        puertos: [],
        proyectoCompose: null,
        codigoSalida: 137,
      },
    ]);
  });

  it('lee el arreglo JSON de Podman (Names en lista, puertos como objetos, etiquetas en objeto)', () => {
    const l = interpretarPs(PS_PODMAN);
    expect(l.map((c) => [c.nombre, c.estado, c.proyectoCompose, c.codigoSalida])).toEqual([
      ['blog_web_1', 'corriendo', 'blog', null],
      ['pg', 'detenido', null, 1],
      ['pausa', 'pausado', null, null],
    ]);
    expect(l[0]!.id).toBe(ID_PODMAN);
    expect(l[0]!.puertos).toEqual(['0.0.0.0:8080->80/tcp', '127.0.0.1:9000-9002->9000-9002/tcp']);
    expect(l[1]!.puertos).toEqual([]);
  });

  it('descarta entradas con id inválido o líneas dañadas sin perder las demás', () => {
    const salida = [
      '{"ID":"--rm","Names":"malo","State":"running"}',
      'no es json',
      '{"ID":"abc123","Names":"bueno","Image":"x","State":"restarting"}',
    ].join('\n');
    const l = interpretarPs(salida);
    expect(l.map((c) => [c.id, c.estado])).toEqual([['abc123', 'otro']]);
  });

  it('limpia caracteres de control y enmascara secretos en los textos', () => {
    const salida = JSON.stringify([
      {
        Id: 'abc',
        Names: ['x\u001b[31mrojo\u0007'],
        Image: 'https://usuario:clave@registro.local/img',
        State: 'running',
      },
    ]);
    const [c] = interpretarPs(salida);
    expect(c!.nombre).toBe('xrojo');
    expect(c!.imagen).not.toContain('clave');
  });

  it('una salida vacía o rara da una lista vacía', () => {
    expect(interpretarPs('')).toEqual([]);
    expect(interpretarPs('null')).toEqual([]);
    expect(interpretarPs('[]')).toEqual([]);
  });
});

describe('carpetasContenedores', () => {
  it('Windows: carpetas de los instaladores oficiales (sin ejecutar nada)', async () => {
    const p = new PlataformaWindows(undefined, undefined, {
      entorno: { ProgramFiles: 'D:\\PF', LOCALAPPDATA: 'C:\\U\\L' },
    });
    expect(await p.carpetasContenedores('docker')).toEqual([
      'D:\\PF\\Docker\\Docker\\resources\\bin',
    ]);
    expect(await p.carpetasContenedores('podman')).toEqual([
      'D:\\PF\\RedHat\\Podman',
      'C:\\U\\L\\Programs\\Podman',
      'C:\\U\\L\\Programs\\RedHat\\Podman',
    ]);
  });

  it('Windows: Docker Desktop del registro (AppPath) va primero, leído una vez', async () => {
    const llamadas: string[][] = [];
    const b64 = Buffer.from('E:\\Docker\\App', 'utf16le').toString('base64');
    const p = new PlataformaWindows(
      async (_cmd, args) => {
        llamadas.push(args);
        return { codigo: 0, stdout: `OK ${b64}\r\n`, stderr: '' };
      },
      undefined,
      { entorno: { ProgramFiles: 'D:\\PF' }, gitRegistro: true },
    );
    expect(await p.carpetasContenedores('docker')).toEqual([
      'E:\\Docker\\App\\resources\\bin',
      'D:\\PF\\Docker\\Docker\\resources\\bin',
    ]);
    await p.carpetasContenedores('docker');
    expect(llamadas).toHaveLength(1);
    const script = Buffer.from(llamadas[0]!.at(-1)!, 'base64').toString('utf16le');
    expect(script).toContain("OpenSubKey('SOFTWARE\\Docker Inc.\\Docker\\1.0')");
    expect(script).toContain("GetValue('AppPath')");
  });

  it('Windows: un AppPath que no es una ruta absoluta limpia se ignora', async () => {
    const b64 = Buffer.from('\\\\srv\\docker', 'utf16le').toString('base64');
    const p = new PlataformaWindows(
      async () => ({ codigo: 0, stdout: `OK ${b64}`, stderr: '' }),
      undefined,
      { entorno: { ProgramFiles: 'D:\\PF' }, gitRegistro: true },
    );
    expect(await p.carpetasContenedores('docker')).toEqual([
      'D:\\PF\\Docker\\Docker\\resources\\bin',
    ]);
  });

  it('buscarEjecutableWindows ignora las entradas relativas o sin unidad del PATH', () => {
    const probadas: string[] = [];
    const r = buscarEjecutableWindows('docker', {
      entorno: { Path: '.;bin;..\\x;\\sin-unidad;"";C:\\B' },
      existe: (ruta) => {
        probadas.push(ruta);
        return false;
      },
    });
    expect(r).toBeNull();
    expect(probadas).toEqual(['C:\\B\\docker.exe']);
  });

  it('la plataforma falsa devuelve las que le pone la prueba', async () => {
    const p = new PlataformaFalsa();
    p.contenedores.docker = ['/x'];
    expect(await p.carpetasContenedores('docker')).toEqual(['/x']);
    expect(await p.carpetasContenedores('podman')).toEqual([]);
  });
});

describe('esUriLocal', () => {
  it('Docker: solo tubería con nombre de este equipo o socket Unix', () => {
    expect(esUriLocal('npipe:////./pipe/docker_engine', 'docker')).toBe(true);
    expect(esUriLocal('npipe://./pipe/dockerDesktopLinuxEngine', 'docker')).toBe(true);
    expect(esUriLocal('unix:///var/run/docker.sock', 'docker')).toBe(true);
    expect(esUriLocal('npipe:////servidor/pipe/docker_engine', 'docker')).toBe(false);
    expect(esUriLocal('npipe://servidor/pipe/docker_engine', 'docker')).toBe(false);
    expect(esUriLocal('npipe:////./pipe/../x', 'docker')).toBe(false);
    expect(esUriLocal('unix://host/var/run/docker.sock', 'docker')).toBe(false);
    expect(esUriLocal('', 'docker')).toBe(false);
    expect(esUriLocal('tcp://127.0.0.1:2375', 'docker')).toBe(false);
    expect(esUriLocal('tcp://10.0.0.5:2376', 'docker')).toBe(false);
    expect(esUriLocal('ssh://root@servidor', 'docker')).toBe(false);
  });

  it('Podman: también ssh a la máquina local (127.0.0.1, localhost, ::1)', () => {
    expect(esUriLocal('ssh://user@127.0.0.1:53210/run/podman.sock', 'podman')).toBe(true);
    expect(esUriLocal('ssh://user@localhost:22/x', 'podman')).toBe(true);
    expect(esUriLocal('ssh://user@[::1]:22/x', 'podman')).toBe(true);
    expect(esUriLocal('ssh://core@servidor.remoto:22/x', 'podman')).toBe(false);
    expect(esUriLocal('ssh://user@127.0.0.1.evil.com/x', 'podman')).toBe(false);
    expect(esUriLocal('tcp://127.0.0.1:8888', 'podman')).toBe(false);
  });
});

describe('conexionPodman', () => {
  const lista = (x: unknown[]) => JSON.stringify(x);
  it('sin conexiones: local (Linux nativo)', () => {
    expect(conexionPodman('[]')).toEqual({ tipo: 'ninguna' });
    expect(conexionPodman('')).toEqual({ tipo: 'ninguna' });
    expect(conexionPodman('null')).toEqual({ tipo: 'ninguna' });
  });

  it('la máquina local se fija por nombre', () => {
    expect(
      conexionPodman(
        lista([
          { Name: 'otra', URI: 'ssh://core@lejos/x', IsMachine: false, Default: false },
          { Name: 'm1', URI: 'ssh://u@127.0.0.1:1/x', IsMachine: true, Default: true },
        ]),
      ),
    ).toEqual({ tipo: 'maquina', nombre: 'm1' });
  });

  it('ssh a loopback sin IsMachine, otro equipo, nombre raro o salida rara: remota', () => {
    for (const salida of [
      lista([{ Name: 'tunel', URI: 'ssh://u@127.0.0.1:2222/x', Default: true }]),
      lista([{ Name: 'tunel', URI: 'ssh://u@127.0.0.1:2222/x', IsMachine: false, Default: true }]),
      lista([{ Name: 'srv', URI: 'ssh://core@lejos/x', IsMachine: true, Default: true }]),
      lista([{ Name: '-x', URI: 'ssh://u@127.0.0.1:1/x', IsMachine: true, Default: true }]),
      lista([{ Name: 'm1', URI: 'ssh://u@127.0.0.1:1/x', IsMachine: true, Default: false }]),
      'no es json',
      '{}',
    ]) {
      expect(conexionPodman(salida)).toEqual({ tipo: 'remota' });
    }
  });
});

describe('Contenedores: motores', () => {
  it('sin motor instalado: lista los dos sin ruta y sin ejecutar nada', async () => {
    const { c, docker, podman } = montar({ conocidas: {} });
    const m = await c.motores();
    expect(m).toEqual([
      expect.objectContaining({ motor: 'docker', ruta: null, responde: false, version: null }),
      expect.objectContaining({ motor: 'podman', ruta: null, responde: false, version: null }),
    ]);
    expect(docker.llamadas).toEqual([]);
    expect(podman.llamadas).toEqual([]);
  });

  it('prefiere la carpeta de instalación conocida y no busca en el PATH', async () => {
    const { c, buscados } = montar({ docker: DOCKER_OK, podman: PODMAN_OK });
    const [d, p] = await c.motores();
    expect(d).toMatchObject({
      ruta: RUTA_DOCKER,
      origen: 'conocida',
      responde: true,
      version: '27.3.1',
      hostRemotoIgnorado: false,
    });
    expect(p).toMatchObject({ ruta: RUTA_PODMAN, responde: true, version: '5.3.1' });
    expect(buscados).toEqual([]);
  });

  it('si no está en la carpeta conocida, usa el PATH (y lo dice)', async () => {
    const { c } = montar({
      conocidas: {},
      enPath: { docker: '/usr/bin/docker' },
      docker: DOCKER_OK,
    });
    const [d] = await c.motores();
    expect(d).toMatchObject({ ruta: '/usr/bin/docker', origen: 'path', responde: true });
  });

  it('motor instalado pero apagado: responde false sin lanzar', async () => {
    const { c } = montar({
      docker: { ...DOCKER_OK, version: { codigo: 1, stderr: 'error during connect' } },
    });
    const [d] = await c.motores();
    expect(d).toMatchObject({ ruta: RUTA_DOCKER, responde: false, version: null });
  });

  it('toda llamada lleva plazo y un entorno sin DOCKER_HOST remoto', async () => {
    const { c, docker, podman } = montar({
      docker: DOCKER_OK,
      podman: PODMAN_OK,
      entorno: { DOCKER_HOST: 'tcp://10.0.0.5:2376', CONTAINER_HOST: 'ssh://core@lejos/x' },
    });
    const [d, p] = await c.motores();
    expect(d!.hostRemotoIgnorado).toBe(true);
    expect(p!.hostRemotoIgnorado).toBe(true);
    for (const l of [...docker.llamadas, ...podman.llamadas]) {
      expect(l.timeoutMs).toBeGreaterThan(0);
      expect(l.timeoutMs).toBeLessThanOrEqual(60_000);
      expect(l.env?.['DOCKER_HOST']).toBe('');
      expect(l.env?.['CONTAINER_HOST']).toBe('');
      expect(l.env?.['DOCKER_CONTEXT']).toBe('');
      expect(l.env?.['CONTAINER_CONNECTION']).toBe('');
    }
  });

  it('DOCKER_HOST local (tubería) se fija con -H y no se pasa por el entorno', async () => {
    const { c, docker } = montar({
      docker: DOCKER_OK,
      entorno: { DOCKER_HOST: 'npipe:////./pipe/podman-machine-default' },
    });
    const [d] = await c.motores();
    expect(d!.hostRemotoIgnorado).toBe(false);
    expect(docker.llamadas.some((l) => l.args.includes('context'))).toBe(false);
    const version = docker.llamadas.find((l) => l.args.includes('version'))!;
    expect(version.args.slice(0, 2)).toEqual(['-H', 'npipe:////./pipe/podman-machine-default']);
    expect(version.env?.['DOCKER_HOST']).toBe('');
  });

  it('un contexto de Docker remoto se ignora: se fija el endpoint del contexto default', async () => {
    const { c, docker } = montar({
      docker: {
        ...DOCKER_OK,
        'context inspect': (args) => ({
          codigo: 0,
          stdout: args.includes('default') ? `${PIPE}\n` : 'ssh://root@lejos\n',
        }),
      },
    });
    const [d] = await c.motores();
    expect(d!.hostRemotoIgnorado).toBe(true);
    const version = docker.llamadas.find((l) => l.args.includes('version'))!;
    expect(version.args.slice(0, 2)).toEqual(H);
    await c.lista('docker');
    expect(docker.llamadas.at(-1)!.args.slice(0, 2)).toEqual(H);
  });

  it('sin ningún endpoint local de Docker (contexto actual y default remotos): no se usa', async () => {
    const { c, docker } = montar({
      docker: { ...DOCKER_OK, 'context inspect': { codigo: 0, stdout: 'tcp://10.0.0.9:2376\n' } },
    });
    const [d] = await c.motores();
    expect(d).toMatchObject({ responde: false, hostRemotoIgnorado: true });
    expect(docker.llamadas.some((l) => l.args.includes('version'))).toBe(false);
    await expect(c.lista('docker')).rejects.toMatchObject({ codigo: 'contenedores.remoto' });
  });

  it('un cambio de contexto tras detectar no cambia el destino de stop', async () => {
    let remoto = false;
    const { c, docker } = montar({
      docker: {
        ...DOCKER_OK,
        'context inspect': () => ({ codigo: 0, stdout: remoto ? 'ssh://root@lejos\n' : PIPE }),
        stop: { codigo: 0 },
      },
    });
    await c.lista('docker');
    remoto = true;
    await c.accion('docker', ID_DOCKER_1, 'detener');
    const stop = docker.llamadas.find((l) => l.args.includes('stop'))!;
    expect(stop.args).toEqual([...H, 'stop', ID_DOCKER_1]);
    expect(stop.env?.['DOCKER_CONTEXT']).toBe('');
    expect(stop.env?.['DOCKER_HOST']).toBe('');
  });

  it('Podman: se fija la máquina con --connection en cada llamada', async () => {
    const { c, podman } = montar({ podman: PODMAN_OK });
    await c.lista('podman');
    for (const l of podman.llamadas.filter((x) => !x.args.includes('connection'))) {
      expect(l.args.slice(0, 2)).toEqual(MAQUINA);
    }
  });

  it('Podman sin conexiones (Linux nativo): local, sin --connection', async () => {
    const { c, podman } = montar({
      podman: { ...PODMAN_OK, 'system connection': { codigo: 0, stdout: '[]' } },
    });
    const [, p] = await c.motores();
    expect(p!.responde).toBe(true);
    await c.lista('podman');
    expect(podman.llamadas.at(-1)!.args).toEqual(['ps', '-a', '--format', 'json']);
  });

  it('Podman con conexión ssh a loopback que no es máquina: no se usa', async () => {
    const { c } = montar({
      podman: {
        ...PODMAN_OK,
        'system connection': {
          codigo: 0,
          stdout: JSON.stringify([
            { Name: 'tunel', URI: 'ssh://u@127.0.0.1:2222/x', IsMachine: false, Default: true },
          ]),
        },
      },
    });
    const [, p] = await c.motores();
    expect(p).toMatchObject({ responde: false, hostRemotoIgnorado: true });
  });

  it('Podman con conexión predeterminada remota: no se usa', async () => {
    const { c, podman } = montar({
      podman: {
        ...PODMAN_OK,
        'system connection': {
          codigo: 0,
          stdout: JSON.stringify([
            { Name: 'srv', URI: 'ssh://core@lejos:22/x', IsMachine: true, Default: true },
          ]),
        },
      },
    });
    const [, p] = await c.motores();
    expect(p).toMatchObject({ responde: false, hostRemotoIgnorado: true });
    expect(podman.llamadas.some((l) => l.args.includes('info'))).toBe(false);
    await expect(c.lista('podman')).rejects.toMatchObject({ codigo: 'contenedores.remoto' });
  });
});

describe('Contenedores: lista y acciones', () => {
  it('lista de Docker con ps -a y formato JSON, sin shell', async () => {
    const { c, docker } = montar({ docker: DOCKER_OK });
    const l = await c.lista('docker');
    expect(l).toHaveLength(2);
    const ps = docker.llamadas.at(-1)!;
    expect(ps.cmd).toBe(RUTA_DOCKER);
    expect(ps.args).toEqual([...H, 'ps', '-a', '--no-trunc', '--format', '{{json .}}']);
  });

  it('lista de Podman con ps -a --format json', async () => {
    const { c, podman } = montar({ podman: PODMAN_OK });
    expect(await c.lista('podman')).toHaveLength(3);
    expect(podman.llamadas.at(-1)!.args).toEqual([...MAQUINA, 'ps', '-a', '--format', 'json']);
  });

  it('Docker con --no-trunc: se actúa con el id completo de 64 hex', async () => {
    const largo = 'e'.repeat(64);
    const { c, docker } = montar({
      docker: {
        ...DOCKER_OK,
        'ps -a': { codigo: 0, stdout: JSON.stringify({ ID: largo, Names: 'x', State: 'running' }) },
        stop: { codigo: 0 },
      },
    });
    const [x] = await c.lista('docker');
    expect(x!.id).toBe(largo);
    await c.accion('docker', largo, 'detener');
    expect(docker.llamadas.at(-1)!.args).toEqual([...H, 'stop', largo]);
  });

  it('sin motor: error claro (sin ejecutar nada)', async () => {
    const { c, docker } = montar({ conocidas: {} });
    await expect(c.lista('docker')).rejects.toMatchObject({ codigo: 'contenedores.sin_motor' });
    expect(docker.llamadas).toEqual([]);
  });

  it('motor que deja de responder: no_responde', async () => {
    let vivo = true;
    const { c } = montar({
      docker: {
        ...DOCKER_OK,
        'ps -a': () => (vivo ? { codigo: 0, stdout: PS_DOCKER } : { codigo: 1, stderr: 'x' }),
      },
    });
    await c.lista('docker');
    vivo = false;
    await expect(c.lista('docker')).rejects.toMatchObject({ codigo: 'contenedores.no_responde' });
  });

  it('motor desconocido rechazado', async () => {
    const { c } = montar({ docker: DOCKER_OK });
    await expect(c.lista('lxc' as MotorContenedores)).rejects.toMatchObject({
      codigo: 'contenedores.motor_invalido',
    });
  });

  it('iniciar, detener y reiniciar llaman al subcomando con el id validado y plazo', async () => {
    const { c, docker } = montar({
      docker: { ...DOCKER_OK, start: { codigo: 0 }, stop: { codigo: 0 }, restart: { codigo: 0 } },
    });
    await c.accion('docker', ID_DOCKER_2, 'iniciar');
    await c.accion('docker', ID_DOCKER_1, 'detener');
    await c.accion('docker', ID_DOCKER_1, 'reiniciar');
    const acciones = docker.llamadas.filter((l) =>
      ['start', 'stop', 'restart'].includes(l.args[2]!),
    );
    expect(acciones.map((l) => l.args)).toEqual([
      [...H, 'start', ID_DOCKER_2],
      [...H, 'stop', ID_DOCKER_1],
      [...H, 'restart', ID_DOCKER_1],
    ]);
    for (const l of acciones) expect(l.timeoutMs).toBeGreaterThan(0);
  });

  it('ids inválidos, acciones desconocidas o contenedores que no están se rechazan sin ejecutar', async () => {
    const { c, docker } = montar({ docker: { ...DOCKER_OK, start: { codigo: 0 } } });
    await expect(c.accion('docker', '--all', 'iniciar')).rejects.toMatchObject({
      codigo: 'contenedores.id_invalido',
    });
    await expect(c.accion('docker', ID_DOCKER_1, 'borrar' as 'iniciar')).rejects.toMatchObject({
      codigo: 'contenedores.argumento_invalido',
    });
    await expect(c.accion('docker', 'no-existe', 'iniciar')).rejects.toMatchObject({
      codigo: 'contenedores.no_existe',
    });
    expect(docker.llamadas.some((l) => ['start', 'rm', 'stop'].includes(l.args[0]!))).toBe(false);
  });

  it('un fallo de la acción da un detalle corto y sin secretos', async () => {
    const { c } = montar({
      docker: {
        ...DOCKER_OK,
        start: { codigo: 1, stderr: 'Error: password=supersecreta ' + 'x'.repeat(500) },
      },
    });
    const e = (await c.accion('docker', ID_DOCKER_2, 'iniciar').catch((x: unknown) => x)) as {
      codigo: string;
      datos: { detalle: string };
    };
    expect(e.codigo).toBe('contenedores.accion_fallo');
    expect(e.datos.detalle).not.toContain('supersecreta');
    expect(e.datos.detalle.length).toBeLessThanOrEqual(200);
  });
});

describe('Contenedores: contenedor detenido', () => {
  it('avisa si uno que corría aparece detenido sin que lo pidiéramos', async () => {
    let salida = PS_DOCKER;
    const alDetenido = vi.fn();
    const { c } = montar({
      docker: { ...DOCKER_OK, 'ps -a': () => ({ codigo: 0, stdout: salida }) },
      alDetenido,
    });
    await c.lista('docker');
    expect(alDetenido).not.toHaveBeenCalled();
    salida = salida
      .replace('"State":"running"', '"State":"exited"')
      .replace('"Status":"Up 2 hours"', '"Status":"Exited (1) 1 second ago"');
    await c.lista('docker');
    expect(alDetenido).toHaveBeenCalledWith({
      motor: 'docker',
      id: ID_DOCKER_1,
      nombre: 'tienda-db-1',
      codigoSalida: 1,
    });
  });

  it('no avisa si lo detuvo el usuario desde WolfCore Dev', async () => {
    let salida = PS_DOCKER;
    const alDetenido = vi.fn();
    const { c } = montar({
      docker: {
        ...DOCKER_OK,
        'ps -a': () => ({ codigo: 0, stdout: salida }),
        stop: () => {
          salida = salida.replace('"State":"running"', '"State":"exited"');
          return { codigo: 0 };
        },
      },
      alDetenido,
    });
    await c.lista('docker');
    await c.accion('docker', ID_DOCKER_1, 'detener');
    await c.lista('docker');
    expect(alDetenido).not.toHaveBeenCalled();
  });

  it('la vigilancia en segundo plano solo consulta motores con contenedores en marcha', async () => {
    const { c, docker } = montar({ docker: DOCKER_OK, podman: PODMAN_OK });
    await c.revisarEnSegundoPlano();
    expect(docker.llamadas.filter((l) => l.args[2] === 'ps')).toHaveLength(0);
    await c.lista('docker');
    await c.revisarEnSegundoPlano();
    expect(docker.llamadas.filter((l) => l.args[2] === 'ps')).toHaveLength(2);
  });
});

/* ───────────── Registros en vivo ───────────── */

/** Lanzador falso: entrega líneas a pedido y termina solo al abortarse o al llamar `fin`. */
function lanzadorFalso() {
  const corridas: {
    cmd: string;
    args: string[];
    opts: OpcionesLanzar;
    linea: (l: string, f?: 'stdout' | 'stderr') => void;
    fin: (codigo?: number) => void;
    abortado: () => boolean;
  }[] = [];
  const lanzar: Lanzador = (cmd, args, opts = {}) =>
    new Promise((resolve, reject) => {
      if (opts.senal?.aborted) {
        reject(new Error('Cancelado'));
        return;
      }
      let terminado = false;
      const fin = (codigo = 0): void => {
        if (terminado) return;
        terminado = true;
        resolve({ codigo });
      };
      opts.senal?.addEventListener('abort', () => fin(1), { once: true });
      corridas.push({
        cmd,
        args,
        opts,
        linea: (l, f = 'stdout') => opts.alLinea?.(l, f),
        fin,
        abortado: () => opts.senal?.aborted === true,
      });
    });
  return { lanzar, corridas };
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Contenedores: registros', () => {
  it('logs -f --tail 500 por el lanzador, líneas saneadas en lotes y cancelables', async () => {
    const lz = lanzadorFalso();
    const { c, emitidos } = montar({ docker: DOCKER_OK, lanzar: lz.lanzar });
    const dejar = await c.seguirLogs('docker', ID_DOCKER_1);
    expect(lz.corridas).toHaveLength(1);
    const r = lz.corridas[0]!;
    expect(r.cmd).toBe(RUTA_DOCKER);
    expect(r.args).toEqual([...H, 'logs', '-f', '--tail', '500', ID_DOCKER_1]);
    expect(r.opts.env?.['DOCKER_HOST']).toBe('');
    r.linea('hola');
    r.linea('\u001b[32mDB_PASSWORD=secreta\u001b[0m', 'stderr');
    await esperar(30);
    const lineas = emitidos.flatMap((e) => e.lineas);
    expect(lineas).toEqual(['hola', 'DB_PASSWORD=***']);
    expect(emitidos[0]).toMatchObject({ motor: 'docker', id: ID_DOCKER_1 });
    dejar();
    expect(r.abortado()).toBe(true);
    dejar();
    await esperar(10);
    expect(c.siguiendo()).toBe(0);
  });

  it('dos ventanas siguiendo el mismo contenedor: soltar una no corta la otra', async () => {
    const lz = lanzadorFalso();
    const { c } = montar({ docker: DOCKER_OK, lanzar: lz.lanzar });
    const a = await c.seguirLogs('docker', ID_DOCKER_1);
    const b = await c.seguirLogs('docker', ID_DOCKER_1);
    expect(lz.corridas).toHaveLength(1);
    a();
    a();
    expect(lz.corridas[0]!.abortado()).toBe(false);
    expect(c.siguiendo()).toBe(1);
    b();
    expect(lz.corridas[0]!.abortado()).toBe(true);
    await esperar(10);
    expect(c.siguiendo()).toBe(0);
  });

  it('cerrar() cancela todos los registros en curso', async () => {
    const lz = lanzadorFalso();
    const { c } = montar({ docker: DOCKER_OK, lanzar: lz.lanzar });
    await c.seguirLogs('docker', ID_DOCKER_1);
    await c.seguirLogs('docker', ID_DOCKER_2);
    expect(c.siguiendo()).toBe(2);
    c.cerrar();
    expect(lz.corridas.every((r) => r.abortado())).toBe(true);
    expect(c.siguiendo()).toBe(0);
  });

  it('cuando el contenedor termina, emite fin y se suelta solo', async () => {
    const lz = lanzadorFalso();
    const { c, emitidos } = montar({ docker: DOCKER_OK, lanzar: lz.lanzar });
    await c.seguirLogs('docker', ID_DOCKER_1);
    lz.corridas[0]!.fin(0);
    await esperar(30);
    expect(emitidos.at(-1)).toMatchObject({ fin: true });
    expect(c.siguiendo()).toBe(0);
  });

  it('rechaza ids inválidos y contenedores que no existen sin lanzar', async () => {
    const lz = lanzadorFalso();
    const { c } = montar({ docker: DOCKER_OK, lanzar: lz.lanzar });
    await expect(c.seguirLogs('docker', '-f')).rejects.toMatchObject({
      codigo: 'contenedores.id_invalido',
    });
    await expect(c.seguirLogs('docker', 'otro')).rejects.toMatchObject({
      codigo: 'contenedores.no_existe',
    });
    expect(lz.corridas).toHaveLength(0);
  });

  it('tope de registros simultáneos', async () => {
    const lz = lanzadorFalso();
    const ids = ['a1', 'a2', 'a3', 'a4', 'a5'];
    const ps = ids.map((id) => JSON.stringify({ ID: id, Names: id, State: 'running' })).join('\n');
    const { c } = montar({
      docker: { ...DOCKER_OK, 'ps -a': { codigo: 0, stdout: ps } },
      lanzar: lz.lanzar,
    });
    for (const id of ids.slice(0, 4)) await c.seguirLogs('docker', id);
    await expect(c.seguirLogs('docker', 'a5')).rejects.toMatchObject({
      codigo: 'contenedores.demasiados_registros',
    });
    c.cerrar();
  });

  it('limpiarLineaRegistro quita códigos ANSI, controles y corta lo largo', () => {
    expect(limpiarLineaRegistro('\u001b[1;31mERROR\u001b[0m\tlisto\u0000')).toBe('ERROR\tlisto');
    expect(limpiarLineaRegistro('x'.repeat(10_000)).length).toBeLessThanOrEqual(4097);
    expect(limpiarLineaRegistro('Authorization: Bearer abc.def.ghi')).toBe(
      'Authorization: Bearer ***',
    );
  });
});

/* ───────────── Núcleo: aviso de contenedor detenido ───────────── */

describe('Nucleo: contenedores', () => {
  it('publica avisos.contenedor_detenido en el centro de avisos y corta todo al cerrar', async () => {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { carpetaTemporal } = await import('./temporales');
    const { Nucleo } = await import('../src/nucleo');
    const base = await carpetaTemporal('pel-cont-');
    const bin = path.join(base, 'docker-bin');
    await mkdir(bin, { recursive: true });
    const plataforma = new PlataformaFalsa({ carpetaDatos: base, carpetaInicio: base });
    plataforma.contenedores.docker = [bin];
    await writeFile(path.join(bin, plataforma.nombreEjecutable('docker')), '');
    let salida = PS_DOCKER;
    const { exec } = cliFalsa({ ...DOCKER_OK, 'ps -a': () => ({ codigo: 0, stdout: salida }) });
    const n = await Nucleo.crear({
      base,
      plataforma,
      ejecutor: exec,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
    try {
      await n.contenedores.lista('docker');
      salida = salida.replace('"State":"running"', '"State":"exited"');
      await n.contenedores.lista('docker');
      const avisos = n.avisos.lista().filter((a) => a.tipo === 'contenedor-detenido');
      expect(avisos).toHaveLength(1);
      expect(avisos[0]).toMatchObject({
        codigo: 'avisos.contenedor_detenido',
        datos: { fuente: `docker:${ID_DOCKER_1}`, nombre: 'tienda-db-1', motor: 'docker' },
        accion: { ruta: 'contenedores' },
      });
    } finally {
      await n.cerrar({ detenerServicios: false });
    }
    expect(n.contenedores.siguiendo()).toBe(0);
  });
});
