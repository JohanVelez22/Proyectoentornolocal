import { describe, expect, it } from 'vitest';
import { DetectorEquipo } from '../src/equipo/detector';
import { equipoDesconocido, type InfoEquipo } from '../src/equipo/tipos';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';

const conRam = (n: number): InfoEquipo => {
  const e = equipoDesconocido();
  e.ram.totalBytes = n;
  return e;
};

describe('DetectorEquipo', () => {
  it('guarda en caché durante el plazo y vuelve a leer después', async () => {
    let t = 0;
    let lecturas = 0;
    const d = new DetectorEquipo({
      leer: async () => conRam(++lecturas),
      ttlMs: 1000,
      ahora: () => t,
    });
    expect((await d.obtener()).ram.totalBytes).toBe(1);
    t = 500;
    expect((await d.obtener()).ram.totalBytes).toBe(1);
    t = 1500;
    expect((await d.obtener()).ram.totalBytes).toBe(2);
    expect(lecturas).toBe(2);
  });

  it('`forzar` ignora la caché', async () => {
    let lecturas = 0;
    const d = new DetectorEquipo({ leer: async () => conRam(++lecturas), ahora: () => 0 });
    await d.obtener();
    await d.obtener(true);
    expect(lecturas).toBe(2);
  });

  it('dos peticiones a la vez comparten una sola lectura', async () => {
    let lecturas = 0;
    const d = new DetectorEquipo({
      leer: async () => {
        lecturas++;
        await new Promise((r) => setTimeout(r, 10));
        return conRam(1);
      },
    });
    await Promise.all([d.obtener(), d.obtener(), d.obtener()]);
    expect(lecturas).toBe(1);
  });

  it('si la lectura falla devuelve un equipo desconocido y nunca lanza', async () => {
    const d = new DetectorEquipo({
      leer: async () => {
        throw new Error('boom');
      },
    });
    expect(await d.obtener()).toEqual(equipoDesconocido());
  });

  it('si la lectura se cuelga, el plazo la corta y el equipo queda desconocido', async () => {
    const d = new DetectorEquipo({
      leer: () => new Promise<InfoEquipo>(() => undefined),
      plazoMs: 30,
    });
    const t0 = Date.now();
    expect(await d.obtener()).toEqual(equipoDesconocido());
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it('un fallo no se guarda mucho tiempo: se reintenta tras unos segundos', async () => {
    let t = 0;
    let n = 0;
    const d = new DetectorEquipo({
      leer: async () => {
        if (++n === 1) throw new Error('x');
        return conRam(9);
      },
      ahora: () => t,
    });
    await d.obtener();
    t = 10_000;
    expect((await d.obtener()).ram.totalBytes).toBe(9);
  });

  it('devuelve copias: modificar el resultado no estropea la caché', async () => {
    const d = new DetectorEquipo({ leer: async () => conRam(5) });
    const a = await d.obtener();
    a.ram.totalBytes = 1;
    expect((await d.obtener()).ram.totalBytes).toBe(5);
  });
});

const codigoDe = (args: string[]): string =>
  Buffer.from(args[args.length - 1]!, 'base64').toString('utf16le');

describe('plataforma: infoEquipo', () => {
  it('la falsa devuelve lo que ponga la prueba (por omisión, desconocido)', async () => {
    const f = new PlataformaFalsa();
    expect(await f.infoEquipo()).toEqual(equipoDesconocido());
    f.equipo = conRam(7);
    expect((await f.infoEquipo()).ram.totalBytes).toBe(7);
  });

  it('Windows: usa PowerShell de System32 con -EncodedCommand y une nvidia-smi', async () => {
    const llamadas: { cmd: string; args: string[] }[] = [];
    const p = new PlataformaWindows(
      async (cmd, args) => {
        llamadas.push({ cmd, args });
        if (codigoDe(args).includes('nvidia-smi')) {
          return { codigo: 0, stdout: 'NVIDIA GeForce RTX 4070, 12282\r\n', stderr: '' };
        }
        return {
          codigo: 0,
          stdout: JSON.stringify({
            cpu: [{ nombre: 'Intel i7', nucleos: 8, hilos: 16 }],
            gpus: [{ nombre: 'NVIDIA GeForce RTX 4070', wmi: 4_293_918_720 }],
          }),
          stderr: '',
        };
      },
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows' } },
    );
    const e = await p.infoEquipo();
    expect(e.cpu.modelo).toBe('Intel i7');
    expect(e.gpus[0]).toMatchObject({ vramBytes: 12282 * 1024 * 1024, origenVram: 'nvidia-smi' });
    expect(llamadas).toHaveLength(2);
    for (const l of llamadas) {
      expect(l.cmd).toMatch(/^C:\\Windows\\System32\\WindowsPowerShell\\v1\.0\\powershell\.exe$/i);
      expect(l.args).toContain('-EncodedCommand');
    }
  });

  it('Windows: si nvidia-smi falla se sigue sin él; si todo falla, equipo desconocido', async () => {
    const sinSmi = new PlataformaWindows(
      async (_c, args) => {
        if (codigoDe(args).includes('nvidia-smi')) throw new Error('no está');
        return { codigo: 0, stdout: JSON.stringify({ cpu: [{ nombre: 'X' }] }), stderr: '' };
      },
      undefined,
      { entorno: {} },
    );
    expect((await sinSmi.infoEquipo()).cpu.modelo).toBe('X');
    const roto = new PlataformaWindows(
      async () => ({ codigo: 1, stdout: '', stderr: 'x' }),
      undefined,
      { entorno: {} },
    );
    expect(await roto.infoEquipo()).toEqual(equipoDesconocido());
  });
});
