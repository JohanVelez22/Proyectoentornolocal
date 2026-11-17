import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { GestorHosts } from '../src/hosts/hosts';
import type { Plataforma, ResultadoEscritura } from '../src/plataforma/tipos';
import { PlataformaWindows, interpretarNetstat, interpretarTasklist } from '../src/plataforma/win';

let ruta: string;
let llamadas: number;
let resultado: ResultadoEscritura;
let eventos: Eventos<EventosNucleo>;

function falsa(): Plataforma {
  return {
    rutaHosts: () => ruta,
    escribirComoAdmin: async (destino, contenido) => {
      llamadas++;
      if (resultado.ok) await writeFile(destino, contenido, 'utf8');
      return resultado;
    },
    quienUsaPuerto: async () => null,
    procesoVivo: async () => ({ vivo: false }),
    matarArbol: async () => undefined,
    abrirUrl: async () => undefined,
    ejecutable: (n) => `${n}.exe`,
  };
}

beforeEach(async () => {
  ruta = join(await carpetaTemporal('pel-hosts-'), 'hosts');
  await writeFile(ruta, '127.0.0.1  localhost\r\n', 'utf8');
  llamadas = 0;
  resultado = { ok: true };
  eventos = new Eventos<EventosNucleo>();
});

describe('GestorHosts', () => {
  it('estado lista pendientes y duplicados fuera del bloque', async () => {
    await writeFile(ruta, '127.0.0.1  app.test\r\n', 'utf8');
    const g = new GestorHosts(falsa(), eventos);
    const vistos: unknown[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const e = await g.estado(['app.test', 'otro.test']);
    expect(e.pendientes).toEqual(['app.test', 'otro.test']);
    expect(e.duplicadosFuera).toEqual(['app.test']);
    expect(vistos).toHaveLength(1);
  });

  it('sincronizar escribe el bloque y deja de haber pendientes', async () => {
    const g = new GestorHosts(falsa(), eventos);
    expect(await g.sincronizar(['a.test'])).toEqual({ ok: true });
    expect(await readFile(ruta, 'utf8')).toContain('::1  a.test');
    expect((await g.estado(['a.test'])).pendientes).toEqual([]);
  });

  it('no pide elevación si no hay cambios', async () => {
    const g = new GestorHosts(falsa(), eventos);
    await g.sincronizar(['a.test']);
    expect(llamadas).toBe(1);
    expect(await g.sincronizar(['a.test'])).toEqual({ ok: true });
    expect(llamadas).toBe(1);
  });

  it('cancelado: devuelve ok:false, hosts intacto, pendientes y mensaje', async () => {
    resultado = { ok: false, motivo: 'cancelado' };
    const g = new GestorHosts(falsa(), eventos);
    const vistos: { mensaje?: string }[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const r = await g.sincronizar(['a.test']);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toBe('cancelado');
      expect(r.comandoManual).toContain('ipconfig /flushdns');
      const b64 = /FromBase64String\('([^']+)'\)/.exec(r.comandoManual)?.[1] ?? '';
      expect(Buffer.from(b64, 'base64').toString('utf8')).toContain('127.0.0.1  a.test');
    }
    expect(await readFile(ruta, 'utf8')).toBe('127.0.0.1  localhost\r\n');
    expect((await g.estado(['a.test'])).pendientes).toEqual(['a.test']);
    expect(vistos[0]?.mensaje).toBe(
      'No se pudo actualizar el archivo hosts: se canceló el permiso de administrador.',
    );
  });

  it('denegado: mensaje de acceso negado', async () => {
    resultado = { ok: false, motivo: 'denegado' };
    const g = new GestorHosts(falsa(), eventos);
    const vistos: { mensaje?: string }[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const r = await g.sincronizar(['a.test']);
    expect(r).toMatchObject({ ok: false, motivo: 'denegado' });
    expect(vistos[0]?.mensaje).toBe(
      'No se pudo actualizar el archivo hosts: Windows negó el acceso.',
    );
  });
});

describe('GestorHosts con lectura fallida', () => {
  it('no eleva ni sobrescribe si hosts no se puede leer', async () => {
    const dir = await carpetaTemporal('pel-dir-');
    const p = { ...falsa(), rutaHosts: () => dir }; // leer un directorio da EISDIR
    const g = new GestorHosts(p, eventos);
    const vistos: { mensaje?: string }[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const r = await g.sincronizar(['a.test']);
    expect(r).toMatchObject({ ok: false, motivo: 'error' });
    expect(llamadas).toBe(0);
    expect(vistos[0]?.mensaje).toContain('No se pudo leer el archivo hosts: EISDIR');
  });

  it('si hosts no existe (ENOENT) se trata como vacío', async () => {
    ruta = join(await carpetaTemporal('pel-no-'), 'no-existe');
    const g = new GestorHosts(falsa(), eventos);
    expect(await g.sincronizar(['a.test'])).toEqual({ ok: true });
  });
});

const NETSTAT = `
Conexiones activas

  Proto  Dirección local         Dirección remota       Estado           PID
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4321
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1000
  TCP    127.0.0.1:9830         0.0.0.0:0              LISTENING       777
  TCP    [::]:8080              [::]:0                 LISTENING       555
  TCP    192.168.1.5:80         10.0.0.1:5000          ESTABLISHED     999
  TCP    127.0.0.1:380          0.0.0.0:0              LISTENING       12
`;

describe('intérpretes', () => {
  it('interpretarNetstat encuentra el PID que escucha', () => {
    expect(interpretarNetstat(NETSTAT, 80)).toBe(4321);
    expect(interpretarNetstat(NETSTAT, 9830)).toBe(777);
    expect(interpretarNetstat(NETSTAT, 8080)).toBe(555);
    expect(interpretarNetstat(NETSTAT, 81)).toBeNull();
  });

  it('interpretarNetstat acepta estado localizado y [::1]', () => {
    const es =
      '  TCP    [::1]:5173             [::]:0                 ESCUCHANDO      4242\n  TCP    0.0.0.0:3000   0.0.0.0:0   ESCUCHANDO   99\n';
    expect(interpretarNetstat(es, 5173)).toBe(4242);
    expect(interpretarNetstat(es, 3000)).toBe(99);
  });

  it('interpretarTasklist lee el CSV y el mensaje sin coincidencias', () => {
    expect(interpretarTasklist('"nginx.exe","4321","Console","1","12.000 KB"\r\n')).toEqual({
      pid: 4321,
      nombre: 'nginx.exe',
    });
    expect(
      interpretarTasklist(
        'INFORMACIÓN: no hay tareas ejecutándose que coincidan con los criterios.',
      ),
    ).toBeNull();
  });
});

describe('PlataformaWindows con ejecutor falso', () => {
  it('quienUsaPuerto combina netstat y tasklist', async () => {
    const p = new PlataformaWindows(async (cmd) =>
      cmd === 'netstat'
        ? { codigo: 0, stdout: NETSTAT, stderr: '' }
        : { codigo: 0, stdout: '"nginx.exe","4321","Console","1","1 KB"', stderr: '' },
    );
    expect(await p.quienUsaPuerto(80)).toEqual({ pid: 4321, nombre: 'nginx.exe' });
    expect(await p.quienUsaPuerto(81)).toBeNull();
  });

  it('procesoVivo devuelve el ejecutable o no vivo', async () => {
    const vivo = new PlataformaWindows(async () => ({
      codigo: 0,
      stdout: '"php-cgi.exe","10","Console","1","1 KB"',
      stderr: '',
    }));
    expect(await vivo.procesoVivo(10)).toEqual({ vivo: true, ejecutable: 'php-cgi.exe' });
    const muerto = new PlataformaWindows(async () => ({
      codigo: 0,
      stdout: 'INFORMACIÓN: nada',
      stderr: '',
    }));
    expect(await muerto.procesoVivo(10)).toEqual({ vivo: false });
  });

  it('abrirUrl rechaza esquemas que no son http(s)', async () => {
    const p = new PlataformaWindows(async () => ({ codigo: 0, stdout: '', stderr: '' }));
    await expect(p.abrirUrl('file:///c:/x')).rejects.toThrow();
    await expect(p.abrirUrl('https://a.test')).resolves.toBeUndefined();
  });

  it('abrirUrl lanza rundll32 con un solo argumento y sin cmd', async () => {
    const llamadas: [string, string[]][] = [];
    const p = new PlataformaWindows(async (c, a) => {
      llamadas.push([c, a]);
      return { codigo: 0, stdout: '', stderr: '' };
    });
    await p.abrirUrl('https://a.test/?x=1&calc.exe');
    expect(llamadas).toEqual([
      ['rundll32', ['url.dll,FileProtocolHandler', 'https://a.test/?x=1&calc.exe']],
    ]);
    expect(llamadas.some(([c]) => c === 'cmd')).toBe(false);
  });

  it('escribirComoAdmin detecta cancelación y denegación', async () => {
    const destino = join(await carpetaTemporal('pel-adm-'), 'hosts');
    await writeFile(destino, 'viejo', 'utf8');
    const cancel = new PlataformaWindows(async () => ({
      codigo: 1,
      stdout: '',
      stderr: 'La operación fue cancelada por el usuario',
    }));
    expect(await cancel.escribirComoAdmin(destino, 'nuevo')).toEqual({
      ok: false,
      motivo: 'cancelado',
    });
    const nada = new PlataformaWindows(async () => ({ codigo: 0, stdout: '', stderr: '' }));
    expect(await nada.escribirComoAdmin(destino, 'nuevo')).toMatchObject({
      ok: false,
      motivo: 'denegado',
    });
    const ok = new PlataformaWindows(async (_c, args) => {
      const m = /-LiteralPath ''([^']+)''/.exec(args.join(' '));
      await writeFile(destino, await readFile(m?.[1] ?? '', 'utf8'), 'utf8');
      return { codigo: 0, stdout: '', stderr: '' };
    });
    expect(await ok.escribirComoAdmin(destino, 'nuevo')).toEqual({ ok: true });
  });
});
