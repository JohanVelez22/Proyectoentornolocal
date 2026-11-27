import { describe, expect, it } from 'vitest';
import {
  SCRIPT_EQUIPO,
  combinarGpus,
  esGpuIntegrada,
  interpretarEquipo,
  interpretarNvidiaSmi,
  rutasNvidiaSmi,
  scriptNvidiaSmi,
} from '../src/plataforma/equipoWin';
import { equipoDesconocido } from '../src/equipo/tipos';

const GIB = 1024 ** 3;

const SALIDA = JSON.stringify({
  so: {
    caption: 'Microsoft Windows 11 Home Single Language',
    version: '10.0.26300',
    build: '26300',
  },
  cpu: [{ nombre: '  AMD Ryzen 7 5800H with Radeon Graphics   ', nucleos: 8, hilos: 16 }],
  ram: { totalKb: 16_000_000, libreKb: 6_000_000 },
  placa: { fabricante: 'LENOVO', modelo: 'LNVNB161216' },
  sistema: { fabricante: 'LENOVO', modelo: '82K2' },
  gpus: [
    { nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU', wmi: 4_293_918_720 },
    { nombre: 'AMD Radeon(TM) Graphics', wmi: 536_870_912 },
  ],
  reg: [
    { nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU', vram: 6 * GIB },
    { nombre: 'AMD Radeon(TM) Graphics', vram: 512 * 1024 * 1024 },
  ],
  discos: [
    { id: 'C:', total: 500_000_000_000, libre: 120_000_000_000, tipo: 'SSD' },
    { id: 'D:', total: 1_000_000_000_000, libre: 900_000_000_000, tipo: 'Unspecified' },
    { id: 'E:', total: 2_000_000_000_000, libre: 1, tipo: 'HDD' },
  ],
});

describe('interpretarEquipo (salida de PowerShell)', () => {
  it('lee SO, CPU, RAM, GPU, discos y placa', () => {
    const e = interpretarEquipo(SALIDA);
    expect(e.so).toEqual({
      nombre: 'Windows 11 Home Single Language',
      version: '10.0.26300',
      compilacion: '26300',
    });
    expect(e.cpu).toEqual({
      modelo: 'AMD Ryzen 7 5800H with Radeon Graphics',
      nucleos: 8,
      hilos: 16,
    });
    expect(e.ram).toEqual({ totalBytes: 16_000_000 * 1024, libreBytes: 6_000_000 * 1024 });
    expect(e.placa).toEqual({ fabricante: 'LENOVO', modelo: 'LNVNB161216' });
    expect(e.gpus[0]).toEqual({
      nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU',
      vramBytes: 6 * GIB,
      origenVram: 'registro',
    });
    expect(e.gpus[1]!.vramBytes).toBe(512 * 1024 * 1024);
  });

  it('el tipo de disco solo es SSD o HDD cuando el sistema lo declara', () => {
    const e = interpretarEquipo(SALIDA);
    expect(e.discos.map((d) => [d.unidad, d.tipo])).toEqual([
      ['C:', 'ssd'],
      ['D:', null],
      ['E:', 'hdd'],
    ]);
    expect(e.discos[0]).toMatchObject({ totalBytes: 500_000_000_000, libreBytes: 120_000_000_000 });
  });

  it('una salida vacía, rota o con basura da un equipo desconocido, sin lanzar', () => {
    expect(interpretarEquipo('')).toEqual(equipoDesconocido());
    expect(interpretarEquipo('no es json')).toEqual(equipoDesconocido());
    expect(interpretarEquipo('42')).toEqual(equipoDesconocido());
    expect(interpretarEquipo('{"so":5,"cpu":"x","ram":null,"gpus":3,"discos":{"id":1}}')).toEqual(
      equipoDesconocido(),
    );
  });

  it('descarta valores no numéricos, negativos o absurdos', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        cpu: [{ nombre: 'X', nucleos: -2, hilos: 'ocho' }],
        ram: { totalKb: 'mucha', libreKb: -1 },
        discos: [
          { id: 'C:', total: -5, libre: null, tipo: null },
          { id: 'no', total: 1 },
        ],
      }),
    );
    expect(e.cpu).toEqual({ modelo: 'X', nucleos: null, hilos: null });
    expect(e.ram).toEqual({ totalBytes: null, libreBytes: null });
    expect(e.discos).toEqual([{ unidad: 'C:', totalBytes: null, libreBytes: null, tipo: null }]);
  });

  it('los textos de relleno de los fabricantes quedan como desconocidos', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        placa: { fabricante: 'To Be Filled By O.E.M.', modelo: 'Default string' },
        sistema: { fabricante: 'System manufacturer', modelo: 'System Product Name' },
      }),
    );
    expect(e.placa).toEqual({ fabricante: null, modelo: null });
  });

  it('si la placa no dice nada se usa el fabricante y el modelo del equipo', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        placa: { fabricante: null, modelo: null },
        sistema: { fabricante: 'Dell Inc.', modelo: 'XPS 15' },
      }),
    );
    expect(e.placa).toEqual({ fabricante: 'Dell Inc.', modelo: 'XPS 15' });
  });

  it('nunca deja pasar números de serie ni identificadores aunque vengan en la salida', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        cpu: [
          { nombre: 'Intel', nucleos: 4, hilos: 8, ProcessorId: 'BFEBFBFF000906EA', serial: 'S1' },
        ],
        placa: { fabricante: 'ASUS', modelo: 'PRIME', SerialNumber: 'MB-123456', uuid: 'ABCD' },
        sistema: { uuid: '4C4C4544-0042-4A10-8051-C7C04F4D4E32' },
        discos: [
          { id: 'C:', total: 1, libre: 1, tipo: 'SSD', serie: 'WD-XYZ', volumeSerial: 'ABCD-1234' },
        ],
      }),
    );
    const texto = JSON.stringify(e);
    for (const prohibido of ['BFEBFBFF', 'MB-123456', 'ABCD', '4C4C4544', 'WD-XYZ', '"S1"']) {
      expect(texto).not.toContain(prohibido);
    }
  });

  it('limita el largo de los textos y quita los caracteres de control', () => {
    const e = interpretarEquipo(
      JSON.stringify({ cpu: [{ nombre: `A\u0000B\n${'x'.repeat(500)}` }] }),
    );
    expect([...e.cpu.modelo!].some((c) => c.charCodeAt(0) < 32)).toBe(false);
    expect(e.cpu.modelo!.length).toBeLessThanOrEqual(120);
  });

  it('suma los procesadores de un equipo con varios zócalos y toma el primer modelo', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        cpu: [
          { nombre: 'Xeon A', nucleos: 12, hilos: 24 },
          { nombre: 'Xeon A', nucleos: 12, hilos: 24 },
        ],
      }),
    );
    expect(e.cpu).toEqual({ modelo: 'Xeon A', nucleos: 24, hilos: 48 });
  });

  it('descarta los adaptadores virtuales', () => {
    const e = interpretarEquipo(
      JSON.stringify({
        gpus: [
          { nombre: 'Microsoft Remote Display Adapter', wmi: 0 },
          { nombre: 'Parsec Virtual Display Adapter', wmi: 0 },
          { nombre: 'Intel(R) UHD Graphics', wmi: 1_073_741_824 },
        ],
      }),
    );
    expect(e.gpus.map((g) => g.nombre)).toEqual(['Intel(R) UHD Graphics']);
  });
});

describe('combinarGpus (VRAM: nvidia-smi > registro > WMI si es fiable)', () => {
  it('Win32_VideoController.AdapterRAM no sirve por encima de 4 GB: se descarta el tope', () => {
    const g = combinarGpus([{ nombre: 'GPU X', wmi: 4_293_918_720 }], [], []);
    expect(g).toEqual([{ nombre: 'GPU X', vramBytes: null, origenVram: null }]);
    const g2 = combinarGpus([{ nombre: 'GPU Y', wmi: 2 * GIB }], [], []);
    expect(g2[0]).toMatchObject({ vramBytes: 2 * GIB, origenVram: 'wmi' });
  });

  it('el registro (64 bits) manda sobre WMI y nvidia-smi sobre el registro', () => {
    const wmi = [{ nombre: 'NVIDIA GeForce RTX 4090', wmi: 4_293_918_720 }];
    const reg = [{ nombre: 'NVIDIA GeForce RTX 4090', vram: 24 * GIB }];
    expect(combinarGpus(wmi, reg, [])[0]).toMatchObject({
      vramBytes: 24 * GIB,
      origenVram: 'registro',
    });
    const smi = [{ nombre: 'NVIDIA GeForce RTX 4090', vramBytes: 24 * GIB - 1_000_000 }];
    expect(combinarGpus(wmi, reg, smi)[0]).toMatchObject({
      vramBytes: 24 * GIB - 1_000_000,
      origenVram: 'nvidia-smi',
    });
  });

  it('dos tarjetas iguales se emparejan una a una y no se repiten por nombre', () => {
    const wmi = [
      { nombre: 'NVIDIA RTX A4000', wmi: 0 },
      { nombre: 'NVIDIA RTX A4000', wmi: 0 },
    ];
    const smi = [
      { nombre: 'NVIDIA RTX A4000', vramBytes: 16 * GIB },
      { nombre: 'NVIDIA RTX A4000', vramBytes: 8 * GIB },
    ];
    const g = combinarGpus(wmi, [], smi);
    expect(g.map((x) => x.vramBytes)).toEqual([16 * GIB, 8 * GIB]);
  });
});

describe('GPU integrada (no cuenta como VRAM)', () => {
  it('se marca por el nombre', () => {
    for (const n of [
      'Intel(R) UHD Graphics 630',
      'Intel(R) Iris(R) Xe Graphics',
      'Intel(R) HD Graphics 520',
      'Intel(R) Arc(TM) Graphics',
      'AMD Radeon(TM) Graphics',
      'AMD Radeon(TM) Vega 8 Graphics',
      'AMD Radeon(TM) 780M Graphics',
    ]) {
      expect(esGpuIntegrada(n), n).toBe(true);
    }
  });
  it('las tarjetas dedicadas no se marcan', () => {
    for (const n of [
      'NVIDIA GeForce RTX 3060 Laptop GPU',
      'AMD Radeon RX 6700 XT',
      'Intel(R) Arc(TM) A770 Graphics',
      'AMD Radeon(TM) RX Vega 56',
    ]) {
      expect(esGpuIntegrada(n), n).toBe(false);
    }
  });
  it('combinarGpus añade integrada: true solo a las integradas, aunque declaren 8 GiB', () => {
    const r = combinarGpus(
      [
        { nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU', wmi: 0 },
        { nombre: 'AMD Radeon(TM) Graphics', wmi: 0 },
      ],
      [
        { nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU', vram: 6 * GIB },
        { nombre: 'AMD Radeon(TM) Graphics', vram: 8 * GIB },
      ],
      [],
    );
    expect(r[0]).not.toHaveProperty('integrada');
    expect(r[1]).toMatchObject({ vramBytes: 8 * GIB, integrada: true });
  });
  it('interpretarEquipo la marca en la lectura completa', () => {
    const e = interpretarEquipo(SALIDA);
    expect(e.gpus[1]!.integrada).toBe(true);
    expect(e.gpus[0]!.integrada).toBeUndefined();
  });
});

describe('interpretarNvidiaSmi', () => {
  it('lee «nombre, MiB» por línea', () => {
    expect(
      interpretarNvidiaSmi(
        'NVIDIA GeForce RTX 3060 Laptop GPU, 6144\r\nNVIDIA RTX A4000, 16376\r\n',
      ),
    ).toEqual([
      { nombre: 'NVIDIA GeForce RTX 3060 Laptop GPU', vramBytes: 6144 * 1024 * 1024 },
      { nombre: 'NVIDIA RTX A4000', vramBytes: 16376 * 1024 * 1024 },
    ]);
  });
  it('ignora errores, líneas vacías y mensajes de que no hay controlador', () => {
    expect(interpretarNvidiaSmi('')).toEqual([]);
    expect(interpretarNvidiaSmi('NVIDIA-SMI has failed because it could not communicate')).toEqual(
      [],
    );
    expect(interpretarNvidiaSmi('GPU, [N/A]')).toEqual([]);
  });
});

describe('scripts', () => {
  it('solo consultan: sin escritura ni elevación, y sin leer números de serie', () => {
    const SMI = scriptNvidiaSmi(rutasNvidiaSmi({}));
    for (const s of [SCRIPT_EQUIPO, SMI]) {
      expect(s).not.toMatch(/Set-|Remove-|New-Item|Start-Process|-Verb|RunAs|Invoke-Expression/i);
    }
    expect(SCRIPT_EQUIPO).not.toMatch(/SerialNumber|UUID|ProcessorId|PNPDeviceID|MACAddress/i);
    expect(SCRIPT_EQUIPO).toContain('qwMemorySize');
    expect(SCRIPT_EQUIPO).toContain('MediaType');
    expect(SMI).toContain('nvidia-smi');
  });
  it('nvidia-smi solo se busca en System32 y en NVSMI, nunca por el PATH', () => {
    const env = { SystemRoot: 'D:\\Win', ProgramFiles: 'E:\\PF', Path: 'C:\\proyecto' };
    expect(rutasNvidiaSmi(env)).toEqual([
      'D:\\Win\\System32\\nvidia-smi.exe',
      'E:\\PF\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe',
    ]);
    const s = scriptNvidiaSmi(rutasNvidiaSmi(env));
    expect(s).not.toMatch(/Get-Command|\$env:/i);
    expect(s).toContain("'D:\\Win\\System32\\nvidia-smi.exe'");
    expect(s).toContain("'E:\\PF\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe'");
  });
  it('las rutas por omisión son las de Windows estándar y las comillas se escapan', () => {
    expect(rutasNvidiaSmi({})[0]).toBe('C:\\Windows\\System32\\nvidia-smi.exe');
    expect(scriptNvidiaSmi(["C:\\o'x\\a.exe"])).toContain("'C:\\o''x\\a.exe'");
  });
});
