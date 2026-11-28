import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  cuerpoSaludDiscosAdmin,
  interpretarSaludDiscos,
  numeroLocal,
  SCRIPT_EVENTOS_DISCO,
  SCRIPT_SALUD_DISCOS,
} from '../src/plataforma/saludDiscosWin';
import { codificarPowerShell } from '../src/plataforma/pathUsuarioWin';

// Salidas de ejemplo con la forma real del script. Los modelos y números son de ejemplo.
const NVME_DESGASTADO = {
  n: '0',
  modelo: 'Samsung SSD 970 EVO Plus 1TB',
  medio: 'SSD',
  bus: 'NVMe',
  tam: 1000204886016,
  salud: 'Healthy',
  oper: ['OK'],
  cs: 'ok',
  c: { t: 47, tm: 85, w: 91, rc: 0, ru: 0, wc: 0, wu: 0, h: 9120 },
  pf: false,
  letras: ['C', 'D'],
};
const USB_SIN_CONTADORES = {
  n: '2',
  modelo: 'Generic Flash Disk USB Device',
  medio: 'Unspecified',
  bus: 'USB',
  tam: 32010928128,
  salud: 'Healthy',
  oper: ['OK'],
  cs: 'error',
  c: null,
  pf: null,
  letras: ['E'],
};

describe('interpretarSaludDiscos', () => {
  it('sin discos: una lectura vacía, no un fallo', () => {
    expect(interpretarSaludDiscos(JSON.stringify({ p: 'ok', discos: [] }))).toEqual({
      discos: [],
      prediccion: 'ok',
    });
  });

  it('NVMe con desgaste alto', () => {
    const r = interpretarSaludDiscos(
      JSON.stringify({ p: 'sin_acceso', discos: [NVME_DESGASTADO] }),
    );
    expect(r?.prediccion).toBe('sin_acceso');
    expect(r?.discos[0]).toEqual({
      numero: 0,
      modelo: 'Samsung SSD 970 EVO Plus 1TB',
      medio: 'ssd',
      bus: 'nvme',
      tamanoBytes: 1000204886016,
      salud: 'healthy',
      operacional: ['OK'],
      contadores: {
        temperaturaC: 47,
        temperaturaMaxC: 85,
        desgastePct: 91,
        erroresLecturaCorregidos: 0,
        erroresLecturaNoCorregidos: 0,
        erroresEscrituraCorregidos: 0,
        erroresEscrituraNoCorregidos: 0,
        horasEncendido: 9120,
      },
      motivoSinContadores: null,
      prediccionFallo: false,
      unidades: ['C:', 'D:'],
    });
  });

  it('USB sin contadores: «bus» como motivo y nada inventado', () => {
    const d = interpretarSaludDiscos(
      JSON.stringify({ p: 'no_disponible', discos: [USB_SIN_CONTADORES] }),
    )?.discos[0];
    expect(d).toMatchObject({
      bus: 'usb',
      medio: null,
      contadores: null,
      motivoSinContadores: 'bus',
      prediccionFallo: null,
      unidades: ['E:'],
    });
  });

  it('sin contadores por falta de permisos: «admin»; no admitidos: «no_soportado»', () => {
    const mk = (cs: string) =>
      interpretarSaludDiscos(
        JSON.stringify({ p: 'ok', discos: [{ ...NVME_DESGASTADO, cs, c: null }] }),
      )?.discos[0]?.motivoSinContadores;
    expect(mk('admin')).toBe('admin');
    expect(mk('no_soportado')).toBe('no_soportado');
    expect(mk('sin_datos')).toBe('no_leidos');
  });

  it('un objeto de contadores vacío o con 0xFFFFFFFF y temperatura 0 no inventa valores', () => {
    const d = interpretarSaludDiscos(
      JSON.stringify({
        p: 'ok',
        discos: [
          {
            ...NVME_DESGASTADO,
            cs: 'ok',
            c: { t: 0, tm: null, w: null, rc: 4294967295, ru: null, wc: null, wu: null, h: null },
          },
        ],
      }),
    )?.discos[0];
    expect(d?.contadores).toBeNull();
    expect(d?.motivoSinContadores).toBe('no_leidos');
  });

  it('Windows en otro idioma: números con coma decimal y estados numéricos', () => {
    const r = interpretarSaludDiscos(
      JSON.stringify({
        p: 'ok',
        discos: [
          {
            n: '1',
            modelo: 'WDC WD10EZEX-08WN4A0',
            medio: '3',
            bus: '11',
            tam: '1.000.204.886.016',
            salud: '1',
            oper: 'OK',
            cs: 'ok',
            c: { t: '51,0', tm: '60', w: null, rc: '12', ru: '0', wc: '0', wu: '0', h: '1.234' },
            pf: true,
            letras: ['F'],
          },
        ],
      }),
    );
    expect(r?.discos[0]).toMatchObject({
      medio: 'hdd',
      bus: 'sata',
      salud: 'warning',
      tamanoBytes: 1000204886016,
      operacional: ['OK'],
      prediccionFallo: true,
      contadores: {
        temperaturaC: 51,
        temperaturaMaxC: 60,
        desgastePct: null,
        horasEncendido: 1234,
      },
    });
  });

  it('un Windows en alemán: salud desconocida si el texto no es el esperado, nunca un valor inventado', () => {
    const d = interpretarSaludDiscos(
      JSON.stringify({ p: 'ok', discos: [{ ...NVME_DESGASTADO, salud: 'Fehlerfrei' }] }),
    )?.discos[0];
    expect(d?.salud).toBeNull();
  });

  it('salida inválida: null', () => {
    for (const s of ['', 'x', '[]', '{"otra":1}']) expect(interpretarSaludDiscos(s)).toBeNull();
  });

  it('acepta el BOM de un archivo escrito por la lectura elevada', () => {
    expect(
      interpretarSaludDiscos('\uFEFF' + JSON.stringify({ p: 'ok', discos: [USB_SIN_CONTADORES] }))
        ?.discos,
    ).toHaveLength(1);
  });
});

describe('salida real de un Windows en español (modelo sustituido)', () => {
  const REAL =
    '{"p":"no_disponible","discos":[{"n":"0","modelo":"Disco NVMe de ejemplo","medio":"SSD","bus":"NVMe","tam":1000204886016,"salud":"Healthy","oper":["OK"],"cs":"admin","c":null,"pf":null,"letras":["C"]}]}';

  it('sin administrador: salud y tipo sí; contadores y predicción, «no disponible»', () => {
    const r = interpretarSaludDiscos(REAL);
    expect(r?.prediccion).toBe('no_disponible');
    expect(r?.discos[0]).toMatchObject({
      numero: 0,
      medio: 'ssd',
      bus: 'nvme',
      salud: 'healthy',
      contadores: null,
      motivoSinContadores: 'admin',
      prediccionFallo: null,
      unidades: ['C:'],
    });
  });
});

describe('privacidad: sin números de serie ni identificadores únicos', () => {
  it('los scripts no piden serie, identificador único ni objeto', () => {
    for (const s of [
      SCRIPT_SALUD_DISCOS,
      cuerpoSaludDiscosAdmin('1-1-abc'),
      SCRIPT_EVENTOS_DISCO,
    ]) {
      expect(s).not.toMatch(/SerialNumber|UniqueId|ObjectId|Win32_PhysicalMedia|\bSerial/i);
    }
    // El PNPDeviceID solo se usa dentro del script para emparejar; no se emite.
    expect(SCRIPT_SALUD_DISCOS).not.toMatch(/(?:pnp|ident)\s*=\s*\[string\]/i);
  });

  it('si la salida trajera una serie, no sale en el resultado', () => {
    const r = interpretarSaludDiscos(
      JSON.stringify({
        p: 'ok',
        discos: [
          {
            ...NVME_DESGASTADO,
            modelo: 'Samsung SSD 970 S4EWNX0M123456789A',
            SerialNumber: 'S4EWNX0M123456789A',
            UniqueId: 'eui.0025385b71b0c8f1',
            c: { ...NVME_DESGASTADO.c, SerialNumber: 'S4EWNX0M123456789A' },
          },
        ],
      }),
    );
    const texto = JSON.stringify(r);
    expect(texto).not.toContain('S4EWNX0M123456789A');
    expect(texto).not.toContain('eui.');
    expect(r?.discos[0]?.modelo).toBe('Samsung SSD 970 …');
  });
});

describe('numeroLocal', () => {
  it('coma decimal, miles y basura', () => {
    expect(numeroLocal('36,5')).toBe(36.5);
    expect(numeroLocal('1,234.5')).toBe(1234.5);
    expect(numeroLocal('1.234,5')).toBe(1234.5);
    expect(numeroLocal('1,234', true)).toBe(1234);
    expect(numeroLocal('1,234')).toBe(1.234);
    expect(numeroLocal('abc')).toBeNull();
    expect(numeroLocal('')).toBeNull();
    expect(numeroLocal(null)).toBeNull();
  });
});

describe.skipIf(process.platform !== 'win32')(
  'los scripts son PowerShell válido (solo se analizan, no se ejecutan)',
  () => {
    it('sin errores de sintaxis', () => {
      for (const s of [
        SCRIPT_SALUD_DISCOS,
        cuerpoSaludDiscosAdmin('1-1-abc'),
        SCRIPT_EVENTOS_DISCO,
      ]) {
        const b64 = Buffer.from(s, 'utf8').toString('base64');
        const orden = `$t = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${b64}')); $e = $null; $null = [System.Management.Automation.Language.Parser]::ParseInput($t, [ref]$null, [ref]$e); if ($e.Count -gt 0) { $e | ForEach-Object { $_.Message }; exit 1 }`;
        const salida = execFileSync('powershell.exe', codificarPowerShell(orden), {
          encoding: 'utf8',
          timeout: 30_000,
        });
        expect(salida.trim()).toBe('');
      }
    });
  },
);

describe('desgaste de 0 a 255 (I3)', () => {
  const con = (w: unknown) =>
    interpretarSaludDiscos(
      JSON.stringify({ p: 'ok', discos: [{ ...NVME_DESGASTADO, c: { ...NVME_DESGASTADO.c, w } }] }),
    )?.discos[0]?.contadores?.desgastePct;

  it('acepta valores por encima de 100 hasta 255 y descarta lo demás', () => {
    expect(con(100)).toBe(100);
    expect(con(180)).toBe(180);
    expect(con(255)).toBe(255);
    expect(con(256)).toBeNull();
    expect(con(-1)).toBeNull();
    expect(con(null)).toBeNull();
  });
});
