import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlataformaWindows } from '../src/plataforma/win';
import { analizarPowerShell } from './soporte/parserPowerShell';
import {
  cuerpoSaludDiscosAdmin,
  DETALLE_SALUD_INSEGURA,
  interpretarLecturaRegistro,
  MAX_ANTIGUEDAD_LECTURA_MS,
  MAX_LECTURA_ADMIN,
  SALIDA_SALUD_ADMIN,
  SCRIPT_LEER_SALUD_ADMIN,
} from '../src/plataforma/saludDiscosWin';

/**
 * La lectura de discos con administrador deja el JSON en HKLM\SOFTWARE\WolfCoreDev\SaludDiscos y
 * la app lo lee sin elevar. Aquí no se toca el registro real ni se abre ningún UAC: un ejecutor
 * falso hace de «proceso elevado» y de «lectura del registro».
 */
const LECTURA = {
  p: 'ok',
  discos: [
    {
      n: '0',
      modelo: 'Disco de ejemplo',
      medio: 'SSD',
      bus: 'NVMe',
      tam: 5e11,
      salud: 'Healthy',
      oper: ['OK'],
      cs: 'ok',
      c: { t: 40, tm: 70, w: 5, rc: 0, ru: 0, wc: 0, wu: 0, h: 100 },
      pf: false,
      letras: ['C'],
    },
  ],
};

interface Valores {
  id: string;
  creado: string;
  lectura: string;
}

let carpeta: string;
beforeEach(async () => {
  carpeta = await mkdtemp(path.join(tmpdir(), 'pel-discos-reg-'));
});
afterEach(async () => {
  await rm(carpeta, { recursive: true, force: true });
});

const entorno = { SystemRoot: 'C:\\Windows' };
const esUac = (args: string[]): boolean => args.includes('-Command');

/** Un «registro» en memoria: lo que el cuerpo elevado escribió y cómo lo devuelve la lectura. */
function montar(
  o: {
    cambiar?: (v: Valores) => Valores;
    salidaLectura?: (v: Valores) => string;
    codigoUac?: number;
    inseguro?: boolean;
  } = {},
) {
  let cuerpo = '';
  let valores: Valores | null = null;
  const llamadas: Array<{ cmd: string; args: string[] }> = [];
  const ej = vi.fn(async (cmd: string, args: string[]) => {
    llamadas.push({ cmd, args });
    if (esUac(args)) {
      const t = (await readdir(carpeta)).find((n) => n.endsWith('.txt'))!;
      cuerpo = await readFile(path.join(carpeta, t), 'utf8');
      const id = /\$id = '([^']+)'/.exec(cuerpo)![1]!;
      valores = { id, creado: new Date().toISOString(), lectura: JSON.stringify(LECTURA) };
      if (o.cambiar) valores = o.cambiar(valores);
      return { codigo: o.codigoUac ?? 0, stdout: '', stderr: '' };
    }
    if (o.inseguro) return { codigo: 0, stdout: 'INSEGURO\r\n', stderr: '' };
    const v = valores;
    if (!v) return { codigo: 0, stdout: 'SIN\r\n', stderr: '' };
    const salida = o.salidaLectura
      ? o.salidaLectura(v)
      : `OK\r\n${v.id}\r\n${v.creado}\r\n${v.lectura}\r\n`;
    return { codigo: 0, stdout: salida, stderr: '' };
  });
  const p = new PlataformaWindows(ej, undefined, { entorno, carpetaTemporal: carpeta });
  return { p, ej, llamadas, cuerpo: () => cuerpo };
}

describe('lectura con administrador por el registro (C2)', () => {
  it('cola + UAC por la PowerShell de System32; la app lee del registro y limpia todo', async () => {
    const { p, llamadas } = montar();
    const r = await p.saludDiscosAdmin();
    expect(r.ok).toBe(true);
    expect(llamadas).toHaveLength(2);
    expect(llamadas[0]!.cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(llamadas[0]!.args.join(' ')).toContain('runas');
    // La segunda llamada es la lectura SIN elevar del registro.
    expect(llamadas[1]!.cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(llamadas[1]!.args).toContain('-EncodedCommand');
    expect(llamadas[1]!.args.join(' ')).not.toContain('runas');
    expect(
      Buffer.from(llamadas[1]!.args[llamadas[1]!.args.length - 1]!, 'base64').toString('utf16le'),
    ).toBe(SCRIPT_LEER_SALUD_ADMIN);
    expect(await readdir(carpeta)).toEqual([]);
  });

  it('el cuerpo elevado no escribe en el sistema de archivos ni nombra rutas del usuario', async () => {
    const { p, cuerpo } = montar({ codigoUac: 10 });
    expect(await p.saludDiscosAdmin()).toMatchObject({ ok: false, motivo: 'cancelado' });
    const c = cuerpo();
    expect(c).toContain('Get-PhysicalDisk');
    expect(c).not.toMatch(
      /WriteAllText|WriteAllBytes|WriteAllLines|Out-File|Set-Content|Add-Content|New-Item|Remove-Item|Start-Process|Invoke-Expression|\biex\b|\bTEMP\b|\btmp\b|\.json|\.txt/i,
    );
    expect(c).not.toContain(carpeta);
    expect(c).not.toContain(tmpdir());
    // Escribe SOLO en la clave protegida, con los tres valores.
    expect(c).toContain("$rutaClave = 'SOFTWARE\\WolfCoreDev\\SaludDiscos'");
    expect(c.match(/\.SetValue\('(\w+)'/g)).toEqual([
      ".SetValue('Lectura'",
      ".SetValue('Creado'",
      ".SetValue('Id'",
    ]);
    // Un solo texto incrustado: el id validado.
    expect(c.match(/^\$id = .*$/gm)).toHaveLength(1);
    expect(await readdir(carpeta)).toEqual([]);
  });

  it('el cuerpo recorta en origen y rechaza una clave que no es de fiar antes de escribir', () => {
    const c = cuerpoSaludDiscosAdmin('1-2-abc');
    expect(c).toContain(`$json.Length -gt ${MAX_LECTURA_ADMIN}`);
    expect(c).toContain('Test-ClaveWolf');
    expect(c).toContain(`exit ${SALIDA_SALUD_ADMIN.almacenInseguro}`);
    // Escribe solo después de abrir la clave protegida.
    expect(c.indexOf('Open-ClaveWolf $true')).toBeLessThan(c.indexOf(".SetValue('Lectura'"));
  });

  it('solo se incrusta un id válido (^[\\w-]+$)', () => {
    for (const malo of ['', 'a b', "a'b", 'a’b', 'C:\\x', 'a;b', '../x', 'x'.repeat(101)]) {
      expect(() => cuerpoSaludDiscosAdmin(malo)).toThrow();
    }
    expect(cuerpoSaludDiscosAdmin('123-4-abcdef01')).toContain("$id = '123-4-abcdef01'");
  });

  it('la lectura comprueba dueño y ACL de la clave antes de leer ningún valor', () => {
    const s = SCRIPT_LEER_SALUD_ADMIN;
    expect(s).toContain('Test-ClaveWolf $base');
    expect(s).toContain('Test-ClaveWolf $k');
    expect(s.indexOf('INSEGURO')).toBeLessThan(s.indexOf("'Lectura'"));
    expect(s.indexOf('INSEGURO')).toBeLessThan(s.indexOf('GetValue('));
    // Trae la función que crea la clave (compartida con el cortafuegos) pero nunca la llama.
    expect(s).not.toMatch(/Open-ClaveWolf \$|\.SetValue|\.DeleteValue/);
  });

  it('una clave insegura se rechaza y no se interpreta nada', async () => {
    const { p } = montar({ inseguro: true });
    expect(await p.saludDiscosAdmin()).toEqual({
      ok: false,
      motivo: 'error',
      detalle: DETALLE_SALUD_INSEGURA,
    });
  });

  it('si el cuerpo elevado sale por clave insegura (54), se informa igual', async () => {
    const { p } = montar({ codigoUac: SALIDA_SALUD_ADMIN.almacenInseguro });
    expect(await p.saludDiscosAdmin()).toMatchObject({
      ok: false,
      detalle: DETALLE_SALUD_INSEGURA,
    });
  });

  it('un id distinto en el registro no se acepta', async () => {
    const { p } = montar({ cambiar: (v) => ({ ...v, id: 'otra-peticion-1' }) });
    expect(await p.saludDiscosAdmin()).toMatchObject({
      ok: false,
      motivo: 'error',
      detalle: 'la lectura es de otra petición',
    });
  });

  it('un valor viejo (de antes de la petición) o de hace mucho se rechaza', async () => {
    const viejo = montar({ cambiar: (v) => ({ ...v, creado: '2020-01-01T00:00:00.0000000Z' }) });
    expect(await viejo.p.saludDiscosAdmin()).toMatchObject({ ok: false, motivo: 'error' });
  });

  it('un campo de más en el JSON lo rechaza (esquema estricto)', async () => {
    const extra = { ...LECTURA, discos: [{ ...LECTURA.discos[0]!, SerialNumber: 'X' }] };
    const { p } = montar({ cambiar: (v) => ({ ...v, lectura: JSON.stringify(extra) }) });
    expect(await p.saludDiscosAdmin()).toMatchObject({
      ok: false,
      detalle: 'la lectura no tiene la forma esperada',
    });
    const raiz = { ...LECTURA, extra: 1 };
    const m2 = montar({ cambiar: (v) => ({ ...v, lectura: JSON.stringify(raiz) }) });
    expect(await m2.p.saludDiscosAdmin()).toMatchObject({ ok: false });
  });

  it('un valor por encima del tope se rechaza', async () => {
    const grande = JSON.stringify({ ...LECTURA, relleno: 'x'.repeat(MAX_LECTURA_ADMIN) });
    const { p } = montar({ cambiar: (v) => ({ ...v, lectura: grande }) });
    expect(await p.saludDiscosAdmin()).toMatchObject({
      ok: false,
      detalle: 'salida demasiado grande',
    });
  });

  it('un fallo al leer el registro es un error, sin valores inventados', async () => {
    const ej = vi.fn(async (_c: string, args: string[]) =>
      esUac(args) ? { codigo: 0, stdout: '', stderr: '' } : { codigo: 1, stdout: '', stderr: 'x' },
    );
    const p = new PlataformaWindows(ej, undefined, { entorno, carpetaTemporal: carpeta });
    expect(await p.saludDiscosAdmin()).toMatchObject({ ok: false, motivo: 'error' });
  });

  it('limpiarTemporalesAdmin quita los pel-discos- de procesos que ya no existen (y los antiguos)', async () => {
    const pid = 987654;
    const nombres = [
      `pel-discos-${pid}-1-abc.txt`,
      `pel-hosts-discos-${pid}-1-abc.txt`,
      `pel-hosts-discos-${pid}-1-abc.json`,
      `pel-discos-${process.pid}-1-abc.txt`,
      'otro.txt',
    ];
    for (const n of nombres) await writeFile(path.join(carpeta, n), 'x');
    const p = new PlataformaWindows(vi.fn(), (x) => x === process.pid, {
      entorno,
      carpetaTemporal: carpeta,
    });
    await p.limpiarTemporalesAdmin();
    expect((await readdir(carpeta)).sort()).toEqual(
      [`pel-discos-${process.pid}-1-abc.txt`, 'otro.txt'].sort(),
    );
  });
});

describe('interpretarLecturaRegistro', () => {
  const ahora = Date.parse('2026-11-27T12:00:00.0000000Z');
  const desde = ahora - 20_000;
  const ok = (extra: Partial<{ id: string; creado: string; lectura: string }> = {}) =>
    interpretarLecturaRegistro(
      [
        'OK',
        extra.id ?? 'x-1',
        extra.creado ?? new Date(ahora - 5000).toISOString(),
        extra.lectura ?? JSON.stringify(LECTURA),
      ].join('\r\n'),
      { id: 'x-1', desde, ahora },
    );

  it('acepta una lectura buena', () => {
    expect(ok().ok).toBe(true);
  });

  it('rechaza lo anterior a la petición, lo del futuro y lo más viejo que el máximo', () => {
    expect(ok({ creado: new Date(desde - 5 * 60_000).toISOString() }).ok).toBe(false);
    expect(ok({ creado: new Date(ahora + 10 * 60_000).toISOString() }).ok).toBe(false);
    const largo = interpretarLecturaRegistro(
      ['OK', 'x-1', new Date(ahora - MAX_ANTIGUEDAD_LECTURA_MS - 1000).toISOString(), '{}'].join(
        '\n',
      ),
      { id: 'x-1', desde: 0, ahora },
    );
    expect(largo).toMatchObject({ ok: false, detalle: 'la lectura es demasiado vieja' });
  });

  it('rechaza una fecha que no es ISO UTC, un id ajeno y un JSON roto', () => {
    expect(ok({ creado: 'ayer' }).ok).toBe(false);
    expect(ok({ id: 'y-2' })).toMatchObject({ ok: false });
    expect(ok({ lectura: '{no' }).ok).toBe(false);
  });
});

describe.skipIf(process.platform !== 'win32')(
  'los scripts del registro son PowerShell válido',
  () => {
    it('se analizan con el parser (sin ejecutarlos): sin errores y con un único literal de id', () => {
      const [cuerpo, lectura] = analizarPowerShell([
        cuerpoSaludDiscosAdmin('123-4-abcdef01'),
        SCRIPT_LEER_SALUD_ADMIN,
      ]);
      expect(cuerpo!.errores).toEqual([]);
      expect(lectura!.errores).toEqual([]);
      expect(cuerpo!.literales.filter((l) => l === '123-4-abcdef01')).toHaveLength(1);
    });
  },
);
