import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import forge from 'node-forge';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  emitirCertificadoLibre,
  validarDominiosLibres,
} from '../src/herramientas/certificadosLibres';
import { limpiarBom } from '../src/herramientas/bom';
import {
  HerramientasPuertos,
  interpretarNetstatTodos,
  interpretarTablaProcesos,
} from '../src/herramientas/puertos';
import { generarCA } from '../src/https/ca';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';

let base: string;
beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-herrb-'));
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

/* ───────────────────────────── Puertos y procesos ───────────────────────────── */

const NETSTAT_ES = [
  '',
  'Conexiones activas',
  '',
  '  Proto  Dirección local          Dirección remota        Estado           PID',
  '  TCP    0.0.0.0:80             0.0.0.0:0              ESCUCHANDO       1200',
  '  TCP    0.0.0.0:135            0.0.0.0:0              ESCUCHANDO       900',
  '  TCP    127.0.0.1:5173         0.0.0.0:0              ESCUCHANDO       3100',
  '  TCP    127.0.0.1:5173         127.0.0.1:50000        ESTABLECIDA      3100',
  '  TCP    [::]:80                [::]:0                 ESCUCHANDO       1200',
  '  TCP    [::1]:5432             [::]:0                 ESCUCHANDO       4000',
  '  UDP    0.0.0.0:5353           *:*                                    2500',
  '  UDP    [::]:5353              *:*                                    2500',
  '  UDP    [fe80::1%12]:1900      *:*                                    2600',
  '',
].join('\r\n');

const TABLA = [
  '4|0|System',
  '900|700|svchost.exe',
  '1200|50|nginx.exe',
  '3100|3000|node.exe',
  '3000|50|cmd.exe',
  '50|10|electron.exe',
  '10|1|explorer.exe',
  '4000|1|postgres.exe',
  '2500|1|chrome.exe',
  '2600|1|svchost.exe',
].join('\r\n');

interface Llamada {
  cmd: string;
  args: string[];
}

/** Ejecutor falso: netstat, la tabla de procesos (PowerShell), tasklist y taskkill. */
function falso(o: {
  netstat?: string;
  tabla?: string | null;
  /** Nombre del PID en tasklist en cada consulta sucesiva (null: no existe). */
  nombres?: Record<number, (string | null)[]>;
  taskkill?: { codigo: number; stderr?: string };
}): { ejecutar: Ejecutor; llamadas: Llamada[] } {
  const llamadas: Llamada[] = [];
  const consultas = new Map<number, number>();
  const ejecutar: Ejecutor = (cmd, args) => {
    llamadas.push({ cmd, args });
    const exe = path.win32.basename(cmd).toLowerCase();
    if (exe.startsWith('netstat'))
      return Promise.resolve({ codigo: 0, stdout: o.netstat ?? '', stderr: '' });
    if (exe.startsWith('powershell')) {
      return Promise.resolve(
        o.tabla === null
          ? { codigo: 1, stdout: '', stderr: 'falló' }
          : { codigo: 0, stdout: o.tabla ?? TABLA, stderr: '' },
      );
    }
    if (exe.startsWith('tasklist')) {
      const filtro = args.find((a) => a.startsWith('PID eq '));
      if (!filtro) {
        const filas = (o.tabla ?? TABLA)
          .split(/\r?\n/)
          .map((l) => l.split('|'))
          .map(([pid, , nombre]) => `"${nombre}","${pid}","Console","1","1.000 K"`);
        return Promise.resolve({ codigo: 0, stdout: filas.join('\r\n'), stderr: '' });
      }
      const pid = Number(filtro.slice(7));
      const n = consultas.get(pid) ?? 0;
      consultas.set(pid, n + 1);
      const lista = o.nombres?.[pid] ?? [null];
      const nombre = lista[Math.min(n, lista.length - 1)];
      return Promise.resolve({
        codigo: 0,
        stdout:
          nombre === null || nombre === undefined
            ? 'INFORMACIÓN: no hay tareas ejecutándose que coincidan con los criterios especificados.'
            : `"${nombre}","${pid}","Console","1","10.000 K"`,
        stderr: '',
      });
    }
    if (exe.startsWith('taskkill')) {
      const t = o.taskkill ?? { codigo: 0 };
      return Promise.resolve({ codigo: t.codigo, stdout: '', stderr: t.stderr ?? '' });
    }
    return Promise.resolve({ codigo: 1, stdout: '', stderr: 'desconocido' });
  };
  return { ejecutar, llamadas };
}

describe('interpretarNetstatTodos', () => {
  it('lee TCP en escucha y UDP con salida localizada, sin conexiones establecidas', () => {
    const filas = interpretarNetstatTodos(NETSTAT_ES);
    expect(filas).toEqual(
      expect.arrayContaining([
        { protocolo: 'TCP', direccion: '0.0.0.0', puerto: 80, pid: 1200 },
        { protocolo: 'TCP', direccion: '::', puerto: 80, pid: 1200 },
        { protocolo: 'TCP', direccion: '127.0.0.1', puerto: 5173, pid: 3100 },
        { protocolo: 'TCP', direccion: '::1', puerto: 5432, pid: 4000 },
        { protocolo: 'UDP', direccion: '0.0.0.0', puerto: 5353, pid: 2500 },
        { protocolo: 'UDP', direccion: 'fe80::1%12', puerto: 1900, pid: 2600 },
      ]),
    );
    expect(filas.filter((f) => f.puerto === 5173)).toHaveLength(1);
  });

  it('ignora líneas raras sin lanzar', () => {
    expect(interpretarNetstatTodos('basura\nTCP x y z\nUDP 1.2.3.4 *:* abc')).toEqual([]);
  });
});

describe('interpretarTablaProcesos', () => {
  it('lee pid, padre y nombre', () => {
    const t = interpretarTablaProcesos('12|4|a.exe\r\nmal\r\n13|12|b b.exe');
    expect(t.get(12)).toEqual({ padre: 4, nombre: 'a.exe' });
    expect(t.get(13)).toEqual({ padre: 12, nombre: 'b b.exe' });
    expect(t.size).toBe(2);
  });
});

describe('HerramientasPuertos.puertosEnUso', () => {
  it('lista puertos con nombre y marca propios a la app, al supervisor y a sus hijos', async () => {
    const { ejecutar } = falso({ netstat: NETSTAT_ES });
    const h = new HerramientasPuertos({
      ejecutar,
      pidApp: 50,
      pidPadre: 10,
      pidsPropios: () => [3000],
    });
    const lista = await h.puertosEnUso();
    const de = (puerto: number, protocolo = 'TCP') =>
      lista.find((p) => p.puerto === puerto && p.protocolo === protocolo);
    expect(de(80)).toMatchObject({ pid: 1200, nombre: 'nginx.exe', propio: true }); // hijo de la app
    expect(de(5173)).toMatchObject({ pid: 3100, nombre: 'node.exe', propio: true }); // hijo de un proceso del supervisor
    expect(de(135)).toMatchObject({ pid: 900, nombre: 'svchost.exe', propio: false });
    expect(de(5353, 'UDP')).toMatchObject({ pid: 2500, nombre: 'chrome.exe', propio: false });
    // Un solo registro por protocolo, puerto y PID aunque escuche en IPv4 e IPv6.
    expect(lista.filter((p) => p.puerto === 80 && p.protocolo === 'TCP')).toHaveLength(1);
    // Ordenado por puerto.
    expect(lista.map((p) => p.puerto)).toEqual(
      [...lista.map((p) => p.puerto)].sort((a, b) => a - b),
    );
  });

  it('sin la tabla de PowerShell usa tasklist y marca solo los PIDs propios directos', async () => {
    const { ejecutar } = falso({ netstat: NETSTAT_ES, tabla: null });
    const h = new HerramientasPuertos({
      ejecutar,
      pidApp: 50,
      pidPadre: 10,
      pidsPropios: () => [3100],
    });
    const lista = await h.puertosEnUso();
    expect(lista.find((p) => p.puerto === 5173)).toMatchObject({
      nombre: 'node.exe',
      propio: true,
    });
    expect(lista.find((p) => p.puerto === 80)).toMatchObject({
      nombre: 'nginx.exe',
      propio: false,
    });
  });
});

describe('HerramientasPuertos.finalizarProceso', () => {
  // Aquí cmd.exe (3000) y su hijo node.exe (3100) no cuelgan de la app.
  const tabla = TABLA.replace('3000|50|cmd.exe', '3000|1|cmd.exe');
  const crear = (o: Parameters<typeof falso>[0], propios: number[] = []) => {
    const f = falso({ tabla, ...o });
    const h = new HerramientasPuertos({
      ejecutar: f.ejecutar,
      pidApp: 50,
      pidPadre: 10,
      pidsPropios: () => propios,
      env: { SystemRoot: 'C:\\Windows' },
    });
    return { h, llamadas: f.llamadas };
  };
  const mato = (l: Llamada[]) => l.some((x) => /taskkill/i.test(x.cmd));

  it('rechaza PIDs menores de 5 o no válidos sin consultar nada', async () => {
    const { h, llamadas } = crear({});
    for (const pid of [0, 4, -1, 1.5, Number.NaN]) {
      await expect(h.finalizarProceso(pid, 'System', { forzar: true })).rejects.toThrow(
        /sistema|válido/,
      );
    }
    expect(llamadas).toHaveLength(0);
  });

  it('rechaza siempre la lista negra del sistema, incluso con forzar', async () => {
    for (const nombre of [
      'svchost.exe',
      'csrss.exe',
      'lsass.exe',
      'explorer.exe',
      'winlogon.exe',
      'smss.exe',
      'wininit.exe',
      'services.exe',
      'System',
    ]) {
      const { h, llamadas } = crear({ nombres: { 900: [nombre] } });
      await expect(h.finalizarProceso(900, nombre, { forzar: true })).rejects.toThrow(/sistema/);
      expect(mato(llamadas)).toBe(false);
    }
  });

  it('nunca finaliza la propia aplicación ni su proceso padre', async () => {
    const { h, llamadas } = crear({ nombres: { 50: ['electron.exe'], 10: ['cmd.exe'] } });
    await expect(h.finalizarProceso(50, 'electron', { forzar: true })).rejects.toThrow(
      /WolfCore Dev/,
    );
    await expect(h.finalizarProceso(10, 'cmd', { forzar: true })).rejects.toThrow(/WolfCore Dev/);
    expect(mato(llamadas)).toBe(false);
  });

  it('exige que la confirmación sea el nombre del proceso (sin distinguir mayúsculas ni .exe)', async () => {
    const { h, llamadas } = crear({ nombres: { 3100: ['node.exe'] } });
    await expect(h.finalizarProceso(3100, 'nginx')).rejects.toThrow(/confirmación/i);
    await expect(h.finalizarProceso(3100, '')).rejects.toThrow(/confirmación/i);
    expect(mato(llamadas)).toBe(false);
    await expect(h.finalizarProceso(3100, ' NODE ')).resolves.toEqual({
      pid: 3100,
      nombre: 'node.exe',
    });
    await expect(h.finalizarProceso(3100, 'Node.EXE')).resolves.toEqual({
      pid: 3100,
      nombre: 'node.exe',
    });
  });

  it('mata con taskkill por ruta absoluta de System32, solo ese PID', async () => {
    const { h, llamadas } = crear({ nombres: { 3100: ['node.exe'] } });
    await h.finalizarProceso(3100, 'node');
    const k = llamadas.find((x) => /taskkill/i.test(x.cmd))!;
    expect(k.cmd).toBe('C:\\Windows\\System32\\taskkill.exe');
    expect(k.args).toEqual(['/PID', '3100', '/F']);
    // tasklist también por ruta absoluta.
    expect(
      llamadas
        .filter((x) => /tasklist/i.test(x.cmd))
        .every((x) => x.cmd === 'C:\\Windows\\System32\\tasklist.exe'),
    ).toBe(true);
  });

  it('los procesos propios (y sus hijos) solo se finalizan con forzar', async () => {
    const { h, llamadas } = crear({ nombres: { 3100: ['node.exe'] } }, [3000]);
    await expect(h.finalizarProceso(3100, 'node')).rejects.toThrow(/WolfCore Dev/);
    expect(mato(llamadas)).toBe(false);
    await expect(h.finalizarProceso(3100, 'node', { forzar: true })).resolves.toMatchObject({
      pid: 3100,
    });
  });

  it('vuelve a comprobar el nombre justo antes de matar (PID reutilizado)', async () => {
    const { h, llamadas } = crear({ nombres: { 3100: ['node.exe', 'chrome.exe'] } });
    await expect(h.finalizarProceso(3100, 'node')).rejects.toThrow(/otro proceso|ya no/);
    expect(mato(llamadas)).toBe(false);
    const otro = crear({ nombres: { 3100: ['node.exe', null] } });
    await expect(otro.h.finalizarProceso(3100, 'node')).rejects.toThrow(/ya no existe/);
    expect(mato(otro.llamadas)).toBe(false);
  });

  it('avisa en español si el proceso no existe o taskkill falla', async () => {
    await expect(crear({}).h.finalizarProceso(3100, 'node')).rejects.toThrow(/ya no existe/);
    const { h } = crear({
      nombres: { 3100: ['node.exe'] },
      taskkill: { codigo: 1, stderr: 'ERROR: Acceso denegado.' },
    });
    await expect(h.finalizarProceso(3100, 'node')).rejects.toThrow(
      /No se pudo finalizar.*Acceso denegado/,
    );
  });

  it.skipIf(process.platform !== 'win32')(
    'finaliza de verdad un proceso hijo propio de la prueba',
    async () => {
      const hijo = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      const salio = new Promise<void>((r) => hijo.once('exit', () => r()));
      try {
        const h = new HerramientasPuertos({ pidsPropios: () => [] });
        const nombre = path.win32.basename(process.execPath);
        // Es hijo de este proceso (propio): hace falta forzar.
        await expect(h.finalizarProceso(hijo.pid!, nombre)).rejects.toThrow(/WolfCore Dev/);
        const r = await h.finalizarProceso(hijo.pid!, nombre, { forzar: true });
        expect(r.pid).toBe(hijo.pid);
        await salio;
      } finally {
        hijo.kill();
      }
    },
    30_000,
  );
});

/* ─────────────────────────────────── BOM ─────────────────────────────────── */

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

describe('limpiarBom', () => {
  const escribir = (rel: string, datos: Buffer | string): string => {
    const f = path.join(base, rel);
    mkdirSync(path.dirname(f), { recursive: true });
    writeFileSync(f, datos);
    return f;
  };

  it('exige rutas absolutas y existentes', async () => {
    await expect(limpiarBom(['relativa.php'], { simular: true })).rejects.toThrow(/absoluta/);
    await expect(limpiarBom([path.join(base, 'no-existe.php')], { simular: true })).rejects.toThrow(
      /no existe/,
    );
  });

  it('en modo simular lista sin escribir nada', async () => {
    const contenido = Buffer.concat([BOM, Buffer.from('<?php echo "á";\r\n')]);
    const a = escribir('a.php', contenido);
    const b = escribir('sub/b.txt', 'sin bom');
    const r = await limpiarBom([base], { simular: true });
    expect(r).toEqual(
      expect.arrayContaining([
        { archivo: a, teniaBom: true },
        { archivo: b, teniaBom: false },
      ]),
    );
    expect(readFileSync(a).equals(contenido)).toBe(true);
    expect(existsSync(`${a}.bak-bom`)).toBe(false);
  });

  it('en modo real hace la copia .bak-bom y quita solo los 3 bytes del BOM', async () => {
    const resto = Buffer.from([0x3c, 0x3f, 0x0d, 0x0a, 0xc3, 0xa1, 0xef, 0xbb, 0xbf, 0x0a, 0x20]);
    const original = Buffer.concat([BOM, resto]);
    const a = escribir('a.php', original);
    const sin = escribir('b.php', resto);
    const r = await limpiarBom([a, sin], { simular: false });
    expect(r.find((x) => x.archivo === a)).toMatchObject({ teniaBom: true, copia: `${a}.bak-bom` });
    expect(r.find((x) => x.archivo === sin)).toEqual({ archivo: sin, teniaBom: false });
    expect(readFileSync(a).equals(resto)).toBe(true);
    expect(readFileSync(`${a}.bak-bom`).equals(original)).toBe(true);
    expect(readFileSync(sin).equals(resto)).toBe(true);
    expect(existsSync(`${sin}.bak-bom`)).toBe(false);
    // Sin temporales sueltos.
    expect(readdirSync(base).sort()).toEqual(['a.php', 'a.php.bak-bom', 'b.php']);
  });

  it('no sobrescribe una copia .bak-bom existente: usa un sufijo', async () => {
    const original = Buffer.concat([BOM, Buffer.from('x')]);
    const a = escribir('a.css', original);
    writeFileSync(`${a}.bak-bom`, 'copia vieja');
    writeFileSync(`${a}.bak-bom.1`, 'otra copia vieja');
    const [r] = await limpiarBom([a], { simular: false });
    expect(r?.copia).toBe(`${a}.bak-bom.2`);
    expect(readFileSync(`${a}.bak-bom`, 'utf8')).toBe('copia vieja');
    expect(readFileSync(`${a}.bak-bom.1`, 'utf8')).toBe('otra copia vieja');
    expect(readFileSync(`${a}.bak-bom.2`).equals(original)).toBe(true);
    expect(readFileSync(a, 'utf8')).toBe('x');
  });

  it('omite binarios, carpetas excluidas, archivos grandes y las propias copias', async () => {
    const binExt = escribir('logo.png', Buffer.concat([BOM, Buffer.from('png')]));
    const binNul = escribir('datos.dat', Buffer.concat([BOM, Buffer.from([0x41, 0x00, 0x42])]));
    const nm = escribir('node_modules/x/i.js', Buffer.concat([BOM, Buffer.from('x')]));
    const ve = escribir('vendor/y.php', Buffer.concat([BOM, Buffer.from('y')]));
    const gi = escribir('.git/config', Buffer.concat([BOM, Buffer.from('z')]));
    const copia = escribir('k.php.bak-bom', Buffer.concat([BOM, Buffer.from('k')]));
    const grande = escribir('grande.txt', Buffer.concat([BOM, Buffer.alloc(32, 0x61)]));
    const ok = escribir('ok.js', Buffer.concat([BOM, Buffer.from('ok')]));
    const r = await limpiarBom([base], { simular: true, tamanoMaximo: 16 });
    const archivos = r.map((x) => x.archivo);
    expect(archivos).toEqual([ok]);
    for (const f of [binExt, binNul, nm, ve, gi, copia, grande]) expect(archivos).not.toContain(f);
  });

  it('no sigue enlaces simbólicos ni uniones', async () => {
    const fuera = mkdtempSync(path.join(os.tmpdir(), 'pel-herrb-fuera-'));
    try {
      writeFileSync(path.join(fuera, 'x.php'), Buffer.concat([BOM, Buffer.from('x')]));
      let creado = true;
      try {
        symlinkSync(fuera, path.join(base, 'enlace'), 'junction');
      } catch {
        creado = false;
      }
      if (!creado) return;
      const r = await limpiarBom([base], { simular: false });
      expect(r).toEqual([]);
      expect(readFileSync(path.join(fuera, 'x.php'))[0]).toBe(0xef);
    } finally {
      rmSync(fuera, { recursive: true, force: true });
    }
  });
});

/* ───────────────────────────── Certificados libres ───────────────────────────── */

describe('validarDominiosLibres', () => {
  it('acepta nombres, comodines de un nivel, IPv4 e IPv6 y normaliza', () => {
    expect(
      validarDominiosLibres([
        ' App.Test ',
        'localhost',
        '*.mi-sitio.test',
        '127.0.0.1',
        '::1',
        '[fe80::1]',
        'app.test',
      ]),
    ).toEqual(['app.test', 'localhost', '*.mi-sitio.test', '127.0.0.1', '::1', 'fe80::1']);
  });

  it.each([
    [[], /al menos un/],
    [[''], /no es válido/],
    [['a b.test'], /no es válido/],
    [['-a.test'], /no es válido/],
    [['a-.test'], /no es válido/],
    [['*.test'], /comodín/],
    [['*.*.x.test'], /comodín/],
    [['a.*.test'], /comodín/],
    [['*'], /comodín/],
    [['x'.repeat(64) + '.test'], /no es válido/],
    [['a_b.test'], /no es válido/],
    [['256.1.1.1'], /no es válido/],
    [['http://a.test'], /no es válido/],
    [[`${'a.'.repeat(130)}test`], /no es válido/],
    [[42 as unknown as string], /no es válido/],
  ])('rechaza %j', (lista, error) => {
    expect(() => validarDominiosLibres(lista)).toThrow(error);
  });

  it('limita la cantidad de nombres', () => {
    const muchos = Array.from({ length: 21 }, (_, i) => `s${i}.test`);
    expect(() => validarDominiosLibres(muchos)).toThrow(/20/);
    expect(validarDominiosLibres(muchos.slice(0, 20))).toHaveLength(20);
  });
});

describe('emitirCertificadoLibre', () => {
  it('pide instalar la CA si no existe', async () => {
    await expect(emitirCertificadoLibre(['a.test'], { rutas: new Rutas(base) })).rejects.toThrow(
      /autoridad de certificados.*(Instale|instale)/,
    );
  });

  it('emite con la CA de WolfCore Dev, con SAN DNS e IP, sin escribir la clave', async () => {
    const rutas = new Rutas(base);
    const ca = generarCA();
    mkdirSync(path.dirname(rutas.caCrt()), { recursive: true });
    writeFileSync(rutas.caCrt(), ca.certPem);
    writeFileSync(rutas.caKey(), ca.keyPem);
    const antes = readdirSync(base, { recursive: true }).sort();
    const r = await emitirCertificadoLibre(['App.test', '*.app.test', '192.168.1.5', '::1'], {
      rutas,
    });
    expect(readdirSync(base, { recursive: true }).sort()).toEqual(antes);
    expect(r.clavePem).toMatch(/PRIVATE KEY/);
    const cert = forge.pki.certificateFromPem(r.certPem);
    expect(forge.pki.certificateFromPem(ca.certPem).verify(cert)).toBe(true);
    const san = cert.getExtension('subjectAltName') as {
      altNames: { type: number; value: string; ip?: string }[];
    };
    expect(san.altNames.map((a) => (a.type === 7 ? `ip:${a.ip}` : a.value))).toEqual([
      'app.test',
      '*.app.test',
      'ip:192.168.1.5',
      'ip:::1',
    ]);
    const clave = forge.pki.privateKeyFromPem(r.clavePem) as forge.pki.rsa.PrivateKey;
    expect((cert.publicKey as forge.pki.rsa.PublicKey).n.equals(clave.n)).toBe(true);
  });
});
