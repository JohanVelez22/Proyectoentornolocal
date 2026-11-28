import { describe, expect, it } from 'vitest';
import {
  discoDelEvento,
  fechaDeEvento,
  IDS_EVENTO_DISCO,
  interpretarEventosDisco,
  MAX_EVENTOS_DISCO,
  PROVEEDORES_EVENTO_DISCO,
} from '../src/discos/eventos';
import { enmascararSerie, modeloSeguro, sanearTextoSistema } from '../src/discos/privacidad';

const ev = (o: Record<string, unknown>) => ({
  f: '2026-11-20T08:30:00.0000000Z',
  id: 7,
  p: 'disk',
  m: 'The device, \\Device\\Harddisk1\\DR1, has a bad block.',
  ...o,
});

describe('constantes', () => {
  it('proveedores e identificadores pedidos', () => {
    expect([...PROVEEDORES_EVENTO_DISCO]).toEqual([
      'disk',
      'Ntfs',
      'Microsoft-Windows-Ntfs',
      'stornvme',
      'storahci',
      'volmgr',
    ]);
    expect([...IDS_EVENTO_DISCO]).toEqual([7, 11, 51, 52, 55, 98, 129, 140, 153, 157]);
    expect(MAX_EVENTOS_DISCO).toBe(200);
  });
});

describe('interpretarEventosDisco', () => {
  it('un evento crítico: fecha ISO, código, gravedad y disco', () => {
    const r = interpretarEventosDisco(JSON.stringify([ev({})]));
    expect(r).toEqual([
      {
        fecha: '2026-11-20T08:30:00.000Z',
        id: 7,
        proveedor: 'disk',
        codigo: 'disco_7',
        gravedad: 'critico',
        disco: { tipo: 'disco', valor: '1' },
        detalle: 'The device, \\Device\\Harddisk1\\DR1, has a bad block.',
      },
    ]);
  });

  it('un solo objeto (PowerShell no pone corchetes con un elemento) también vale', () => {
    expect(interpretarEventosDisco(JSON.stringify(ev({ id: 52 })))).toHaveLength(1);
  });

  it('la unidad de un evento de NTFS', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([
        ev({
          id: 55,
          p: 'Ntfs',
          m: 'A corruption was discovered in the file system structure on volume C:.',
        }),
      ]),
    );
    expect(r[0]).toMatchObject({ gravedad: 'critico', disco: { tipo: 'unidad', valor: 'C:' } });
  });

  it('sin disco claro (reinicio del controlador), no se inventa', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([
        ev({ id: 129, p: 'stornvme', m: 'Reset to device, \\Device\\RaidPort0, was issued.' }),
      ]),
    );
    expect(r[0]?.disco).toBeNull();
  });

  it('descarta otros identificadores y otros proveedores', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([ev({ id: 1 }), ev({ p: 'Microsoft-Windows-Kernel-Power' }), ev({ id: 153 })]),
    );
    expect(r.map((e) => e.id)).toEqual([153]);
  });

  it('ordena del más reciente al más antiguo y respeta el tope', () => {
    const muchos = Array.from({ length: 250 }, (_, i) =>
      ev({ f: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString() }),
    );
    const r = interpretarEventosDisco(JSON.stringify(muchos));
    expect(r).toHaveLength(200);
    expect(r[0]!.fecha > r[1]!.fecha).toBe(true);
    expect(interpretarEventosDisco(JSON.stringify(muchos), 5)).toHaveLength(5);
  });

  it('el detalle no lleva rutas de usuario completas', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([
        ev({
          id: 51,
          m: 'Error en C:\\Users\\maria.perez\\AppData\\Local\\x\\pagefile.sys durante la paginación',
        }),
      ]),
    );
    expect(r[0]?.detalle).not.toMatch(/maria|Users\\/);
    expect(r[0]?.detalle).toContain('[ruta de usuario]');
  });

  it('salida inválida o vacía: lista vacía, sin lanzar', () => {
    for (const s of ['', 'no es json', 'null', '5', '[]']) {
      expect(interpretarEventosDisco(s)).toEqual([]);
    }
  });
});

describe('evento real de un Windows en español', () => {
  it('NTFS 55 con el texto del sistema en español: unidad y fecha de 7 decimales', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([
        {
          f: '2026-11-15T00:50:21.4723204Z',
          id: 55,
          p: 'Ntfs',
          m: 'Se detectó un daño en la estructura del sistema de archivos del volumen D:.\r\n\r\nA file on the volume is no longer reachable from its parent directory.  The parent file reference number is 0x50000000000',
        },
      ]),
    );
    expect(r[0]).toMatchObject({
      fecha: '2026-11-15T00:50:21.472Z',
      gravedad: 'critico',
      disco: { tipo: 'unidad', valor: 'D:' },
    });
    expect(r[0]?.detalle).not.toMatch(/[\r\n]/);
  });
});

describe('fechas de un Windows en otro idioma', () => {
  it('acepta ISO, /Date()/ y d.m.a; descarta la fecha con barras, ambigua', () => {
    expect(fechaDeEvento('2026-11-20T08:30:00Z')).toBe('2026-11-20T08:30:00.000Z');
    expect(fechaDeEvento('/Date(1795163400000)/')).toBe(new Date(1795163400000).toISOString());
    expect(fechaDeEvento('20.11.2026 08:30:00')).toBe('2026-11-20T08:30:00.000Z');
    expect(fechaDeEvento('11/20/2026 8:30:00 AM')).toBeNull();
    expect(fechaDeEvento('27/11/2026 10:15:00')).toBeNull();
    expect(fechaDeEvento(undefined)).toBeNull();
  });
});

describe('discoDelEvento', () => {
  it('disco por la ruta del dispositivo y unidad por su letra', () => {
    expect(discoDelEvento('Device \\Device\\Harddisk12\\DR12 error')).toEqual({
      tipo: 'disco',
      valor: '12',
    });
    expect(discoDelEvento('volume d: is dirty')).toEqual({ tipo: 'unidad', valor: 'D:' });
    expect(discoDelEvento('sin pistas')).toBeNull();
  });
});

describe('privacidad', () => {
  it('enmascara lo que parece un número de serie o un GUID', () => {
    expect(enmascararSerie('WD-WCC4N5ABCDEFGH123456 disco')).toContain('…');
    expect(enmascararSerie('id 6b29fc40-ca47-1067-b31d-00dd010662da fin')).toBe('id … fin');
    expect(enmascararSerie('Samsung SSD 970 EVO Plus 1TB')).toBe('Samsung SSD 970 EVO Plus 1TB');
  });

  it('el modelo seguro conserva el modelo y tapa la serie', () => {
    expect(modeloSeguro('  Samsung SSD 970 EVO Plus 1TB ')).toBe('Samsung SSD 970 EVO Plus 1TB');
    expect(modeloSeguro('Generic S3Z9NB0K123456789A')).toBe('Generic …');
    expect(modeloSeguro('   ')).toBeNull();
    expect(modeloSeguro(5)).toBeNull();
  });

  it('el texto saneado se acota', () => {
    expect(sanearTextoSistema('a'.repeat(500), 50).length).toBeLessThanOrEqual(51);
  });
});
