import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { GestorHosts } from '../src/hosts/hosts';
import type { Plataforma, ResultadoEscritura } from '../src/plataforma/tipos';
import {
  PlataformaWindows,
  pidExiste,
  ejecutorPorDefecto,
  interpretarNetstat,
  interpretarTasklist,
} from '../src/plataforma/win';

/** Script elevado (base64 de -EncodedCommand) que arma PlataformaWindows.escribirComoAdmin. */
function scriptDe(args: string[]): string {
  const b64 = /-EncodedCommand ([A-Za-z0-9+/=]+)/.exec(args.join(' '))?.[1] ?? '';
  return Buffer.from(b64, 'base64').toString('utf16le');
}
/** Ruta del temporal que el script elevado copiaría. */
const temporalDe = (args: string[]): string => /^\$t = '([^']+)'$/m.exec(scriptDe(args))?.[1] ?? '';

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
    duenosDePuertos: async () => new Map(),
    instalarCertificadoUsuario: async () => ({ ok: true as const }),
    quitarCertificadoUsuario: async () => ({ ok: true as const }),
    certificadoInstalado: async () => false,
    procesoVivo: async () => ({ vivo: false }),
    matarArbol: async () => undefined,
    abrirUrl: async () => undefined,
    ejecutable: (n) => `${n}.exe`,
    carpetaDocumentos: async () => ruta,
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

  it('denegado con detalle (hosts protegido): el mensaje lo dice y el comando manual quita el solo lectura', async () => {
    resultado = {
      ok: false,
      motivo: 'denegado',
      detalle: 'el archivo hosts está protegido contra escritura',
    };
    const g = new GestorHosts(falsa(), eventos);
    const vistos: { mensaje?: string }[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const r = await g.sincronizar(['a.test']);
    expect(vistos[0]?.mensaje).toContain('protegido contra escritura');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.comandoManual).toContain('[IO.FileAttributes]::ReadOnly');
      expect(r.comandoManual.indexOf('ReadOnly')).toBeLessThan(
        r.comandoManual.indexOf('WriteAllText'),
      );
    }
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

  it('duenosDePuertos resuelve varios puertos con un solo netstat y un solo tasklist', async () => {
    const llamadas: string[] = [];
    const p = new PlataformaWindows(async (cmd) => {
      llamadas.push(cmd);
      return cmd === 'netstat'
        ? { codigo: 0, stdout: NETSTAT, stderr: '' }
        : {
            codigo: 0,
            stdout: [
              '"nginx.exe","4321","Console","1","1 KB"',
              '"FlyEnv.exe","777","Console","1","1 KB"',
            ].join('\r\n'),
            stderr: '',
          };
    });
    const m = await p.duenosDePuertos([80, 9830, 8080, 81]);
    expect(llamadas).toEqual(['netstat', 'tasklist']);
    expect(m.get(80)).toEqual({ pid: 4321, nombre: 'nginx.exe' });
    expect(m.get(9830)).toEqual({ pid: 777, nombre: 'FlyEnv.exe' });
    expect(m.get(8080)).toEqual({ pid: 555, nombre: 'desconocido' });
    expect(m.has(81)).toBe(false);
    llamadas.length = 0;
    expect((await p.duenosDePuertos([])).size).toBe(0);
    expect(llamadas).toEqual([]);
  });

  it('procesoVivo devuelve el ejecutable o no vivo', async () => {
    const vivo = new PlataformaWindows(async () => ({
      codigo: 0,
      stdout: '"php-cgi.exe","10","Console","1","1 KB"',
      stderr: '',
    }));
    expect(await vivo.procesoVivo(10)).toEqual({ vivo: true, ejecutable: 'php-cgi.exe' });
    const muerto = new PlataformaWindows(
      async () => ({
        codigo: 0,
        stdout: 'INFORMACIÓN: nada',
        stderr: '',
      }),
      () => false,
    );
    expect(await muerto.procesoVivo(10)).toEqual({ vivo: false });
  });

  it('inicioProceso lee la hora de creación de Win32_Process; null si no hay o falla', async () => {
    const vistos: string[][] = [];
    const p = new PlataformaWindows(async (cmd, args) => {
      vistos.push([cmd, ...args]);
      return { codigo: 0, stdout: '134079123456789012\r\n', stderr: '' };
    });
    expect(await p.inicioProceso(1234)).toBe('134079123456789012');
    expect(vistos[0]!.join(' ')).toContain('ProcessId=1234');
    const vacio = new PlataformaWindows(async () => ({ codigo: 0, stdout: '', stderr: '' }));
    expect(await vacio.inicioProceso(8)).toBeNull();
    const falla = new PlataformaWindows(async () => {
      throw new Error('sin powershell');
    });
    expect(await falla.inicioProceso(8)).toBeNull();
    expect(await p.inicioProceso(-1)).toBeNull();
  });

  it('procesoVivo no da por muerto un proceso vivo si tasklist falla', async () => {
    const consultados: number[] = [];
    const p = new PlataformaWindows(
      async () => ({ codigo: 1, stdout: '', stderr: 'ERROR: tiempo agotado' }),
      (pid) => {
        consultados.push(pid);
        return pid === 10;
      },
    );
    expect(await p.procesoVivo(10)).toEqual({ vivo: true });
    expect(await p.procesoVivo(11)).toEqual({ vivo: false });
    expect(consultados).toEqual([10, 11]);
  });

  it('pidExiste consulta el sistema real', () => {
    expect(pidExiste(process.pid)).toBe(true);
    expect(pidExiste(2 ** 30)).toBe(false);
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
      await writeFile(destino, await readFile(temporalDe(args), 'utf8'), 'utf8');
      return { codigo: 0, stdout: '', stderr: '' };
    });
    expect(await ok.escribirComoAdmin(destino, 'nuevo')).toEqual({ ok: true });
  });
});

describe('ejecutorPorDefecto', () => {
  it('pasa env extra y escribe la entrada estándar', async () => {
    const r = await ejecutorPorDefecto(
      process.execPath,
      ['-e', 'process.stdin.on("data", (d) => process.stdout.write(process.env.PEL_X + ":" + d))'],
      { env: { PEL_X: 'secreto' }, entrada: 'hola', timeoutMs: 10000 },
    );
    expect(r.codigo).toBe(0);
    expect(r.stdout).toBe('secreto:hola');
  });
});

describe('GestorHosts: UAC sin respuesta y agrupación (QA 1)', () => {
  it('un UAC sin responder vence con motivo "tiempo" y deja hosts intacto', async () => {
    const p = { ...falsa(), escribirComoAdmin: () => new Promise<ResultadoEscritura>(() => {}) };
    const g = new GestorHosts(p, eventos, { tiempoLimiteMs: 30 });
    const vistos: { mensaje?: string; pendientes: string[] }[] = [];
    eventos.on('hosts:estado', (e) => vistos.push(e));
    const r = await g.sincronizar(['a.test']);
    expect(r).toMatchObject({ ok: false, motivo: 'tiempo' });
    if (!r.ok) expect(r.comandoManual).toContain('ipconfig /flushdns');
    expect(await readFile(ruta, 'utf8')).toBe('127.0.0.1  localhost\r\n');
    expect(vistos.at(-1)?.pendientes).toEqual(['a.test']);
    expect(vistos.at(-1)?.mensaje).toContain('no hubo respuesta');
  });

  it('el plazo se pasa a la plataforma para que corte la elevación', async () => {
    const plazos: (number | undefined)[] = [];
    const p = {
      ...falsa(),
      escribirComoAdmin: async (d: string, c: string, o?: { tiempoLimiteMs?: number }) => {
        plazos.push(o?.tiempoLimiteMs);
        await writeFile(d, c, 'utf8');
        return { ok: true as const };
      },
    };
    await new GestorHosts(p, eventos, { tiempoLimiteMs: 1234 }).sincronizar(['a.test']);
    expect(plazos).toEqual([1234]);
  });

  it('pedidos seguidos mientras hay un UAC abierto se agrupan en una sola elevación más', async () => {
    let soltar: () => void = () => undefined;
    const p = {
      ...falsa(),
      escribirComoAdmin: async (d: string, c: string) => {
        llamadas++;
        if (llamadas === 1) await new Promise<void>((r) => (soltar = r));
        await writeFile(d, c, 'utf8');
        return { ok: true as const };
      },
    };
    const g = new GestorHosts(p, eventos);
    const a = g.sincronizar(['a.test']);
    await new Promise((r) => setTimeout(r, 5));
    const b = g.sincronizar(['a.test', 'b.test']);
    const c = g.sincronizar(['a.test', 'b.test', 'c.test']);
    soltar();
    expect(await a).toEqual({ ok: true });
    expect(await b).toEqual({ ok: true });
    expect(await c).toEqual({ ok: true });
    expect(llamadas).toBe(2);
    expect(await readFile(ruta, 'utf8')).toContain('::1  c.test');
  });

  it('si el UAC abierto se cancela o vence, los pedidos en espera no abren otro', async () => {
    let soltar: (r: ResultadoEscritura) => void = () => undefined;
    const p = {
      ...falsa(),
      escribirComoAdmin: () => {
        llamadas++;
        return new Promise<ResultadoEscritura>((r) => (soltar = r));
      },
    };
    const g = new GestorHosts(p, eventos);
    const a = g.sincronizar(['a.test']);
    await new Promise((r) => setTimeout(r, 5));
    const b = g.sincronizar(['a.test', 'b.test']);
    soltar({ ok: false, motivo: 'cancelado' });
    expect(await a).toMatchObject({ ok: false, motivo: 'cancelado' });
    const rb = await b;
    expect(rb).toMatchObject({ ok: false, motivo: 'cancelado' });
    if (!rb.ok) {
      const b64 = /FromBase64String\('([^']+)'\)/.exec(rb.comandoManual)?.[1] ?? '';
      expect(Buffer.from(b64, 'base64').toString('utf8')).toContain('127.0.0.1  b.test');
    }
    expect(llamadas).toBe(1);
    expect((await g.estado(['a.test', 'b.test'])).pendientes).toEqual(['a.test', 'b.test']);
  });
});

describe('PlataformaWindows.escribirComoAdmin con plazo (QA 1)', () => {
  it('pasa el plazo al ejecutor y, si vence, informa "tiempo" sin tocar el destino', async () => {
    const destino = join(await carpetaTemporal('pel-adm-'), 'hosts');
    await writeFile(destino, 'viejo', 'utf8');
    const opciones: ({ timeoutMs?: number } | undefined)[] = [];
    let temporal = '';
    const p = new PlataformaWindows(async (_c, args, o) => {
      opciones.push(o);
      temporal = temporalDe(args);
      await new Promise((r) => setTimeout(r, 40));
      return { codigo: 1, stdout: '', stderr: 'Command failed' };
    });
    expect(await p.escribirComoAdmin(destino, 'nuevo', { tiempoLimiteMs: 30 })).toEqual({
      ok: false,
      motivo: 'tiempo',
    });
    expect(opciones[0]?.timeoutMs).toBe(30);
    expect(await readFile(destino, 'utf8')).toBe('viejo');
    // El temporal se borra: un UAC aceptado tarde ya no tiene qué copiar.
    expect(existsSync(temporal)).toBe(false);
  });
});

describe('GestorHosts: pendientes en el resultado (QA 1)', () => {
  it('un fallo informa qué dominios quedaron pendientes', async () => {
    resultado = { ok: false, motivo: 'cancelado' };
    await writeFile(
      ruta,
      '# >>> WolfCore Dev (no editar a mano)\r\n127.0.0.1  a.test\r\n::1  a.test\r\n# <<< WolfCore Dev\r\n',
      'utf8',
    );
    const r = await new GestorHosts(falsa(), eventos).sincronizar(['a.test', 'b.test']);
    expect(r).toMatchObject({ ok: false, pendientes: ['b.test'] });
  });
});

describe('GestorHosts: no repetir UACs (ronda de seguridad)', () => {
  it('tras cancelar, un guardado automático con lo mismo no vuelve a pedir; el pedido explícito sí', async () => {
    resultado = { ok: false, motivo: 'cancelado' };
    const g = new GestorHosts(falsa(), eventos);
    expect(await g.sincronizar(['a.test'])).toMatchObject({ ok: false, motivo: 'cancelado' });
    expect(await g.sincronizar(['a.test'])).toMatchObject({ ok: false, motivo: 'cancelado' });
    expect(llamadas).toBe(1);
    // Dominios distintos = contenido distinto: sí se pide.
    await g.sincronizar(['a.test', 'b.test']);
    expect(llamadas).toBe(2);
    resultado = { ok: true };
    expect(await g.sincronizar(['a.test', 'b.test'], { reintentar: true })).toEqual({ ok: true });
    expect(llamadas).toBe(3);
  });

  it('mientras la escritura elevada anterior sigue viva no se abre otra', async () => {
    let soltar: (r: ResultadoEscritura) => void = () => undefined;
    const p = {
      ...falsa(),
      escribirComoAdmin: () => {
        llamadas++;
        return new Promise<ResultadoEscritura>((r) => (soltar = r));
      },
    };
    const g = new GestorHosts(p, eventos, { tiempoLimiteMs: 20 });
    expect(await g.sincronizar(['a.test'])).toMatchObject({ motivo: 'tiempo' });
    expect(await g.sincronizar(['a.test', 'b.test'], { reintentar: true })).toMatchObject({
      motivo: 'tiempo',
    });
    expect(llamadas).toBe(1);
    soltar({ ok: false, motivo: 'tiempo' });
    await new Promise((r) => setTimeout(r, 5));
    await g.sincronizar(['a.test', 'b.test'], { reintentar: true });
    expect(llamadas).toBe(2);
  });

  it('pasa a la plataforma la huella del hosts leído', async () => {
    const huellas: (string | undefined)[] = [];
    const p = {
      ...falsa(),
      escribirComoAdmin: async (_d: string, _c: string, o?: { hashPrevio?: string }) => {
        huellas.push(o?.hashPrevio);
        return { ok: false as const, motivo: 'denegado' as const };
      },
    };
    await new GestorHosts(p, eventos).sincronizar(['a.test']);
    const { createHash } = await import('node:crypto');
    expect(huellas).toEqual([
      createHash('sha256')
        .update(await readFile(ruta))
        .digest('hex'),
    ]);
  });
});
