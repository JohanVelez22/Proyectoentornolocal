import { describe, expect, it } from 'vitest';
import { interpretarEventosDisco } from '../src/discos/eventos';
import { enmascararSerie, modeloSeguro, sanearTextoSistema } from '../src/discos/privacidad';
import { PlataformaWindows } from '../src/plataforma/win';
import { SCRIPT_EVENTOS_DISCO } from '../src/plataforma/saludDiscosWin';

describe('series de fabricantes (I4)', () => {
  const SERIES = [
    'S4EWNX0R123456A', // Samsung
    'WD-WCC4E1234567', // Western Digital
    'WX12A1234567', // WD
    '21025A801234', // Crucial/Seagate
    '1907E1A2B3C4', // otro
  ];

  it.each(SERIES)('tapa %s dentro de un texto', (serie) => {
    const t = enmascararSerie(`El disco ${serie} no responde`);
    expect(t).not.toContain(serie);
    expect(t).not.toMatch(/\d{6}/);
    expect(t).toContain('…');
  });

  it('también por sanearTextoSistema', () => {
    for (const s of SERIES) {
      expect(sanearTextoSistema(`serie=${s};`)).not.toContain(s.replace(/^WD-/, ''));
    }
  });

  it('el guion bajo separa: la serie detrás de «_» se tapa (también la larga)', () => {
    for (const s of ['S4EWNX0R123456A', 'WCC4E1234567']) {
      const t = enmascararSerie(`Disk_${s} falló`);
      expect(t).not.toContain(s);
      expect(t).toBe('Disk_… falló');
    }
    expect(enmascararSerie('Disk_S3Z9NB0K123456789A falló')).toBe('Disk_… falló');
    expect(modeloSeguro('Generic_S3Z9NB0K123456789A')).toBe('Generic_…');
  });

  it('modeloSeguro tapa el token tras «_» y tras un prefijo de fabricante con guion (WD-…)', () => {
    expect(modeloSeguro('USB Disk_S4EWNX0R123456A')).toBe('USB Disk_…');
    expect(modeloSeguro('WDC WD10EZEX-08WN4A0 WD-WCC4E1234567')).toBe('WDC WD10EZEX-08WN4A0 WD-…');
    expect(modeloSeguro('wd-wcc4e1234567')).toBe('wd-…');
    expect(modeloSeguro('Samsung SSD 870 EVO S5Y1NX0R123456')).toBe(
      'Samsung SSD 870 EVO S5Y1NX0R123456',
    );
    // Los modelos con guion o con «_» sin serie se siguen viendo.
    for (const m of ['ST4000DM004-2CV104', 'Msft_Virtual_Disk', 'WDC WD10EZEX-08WN4A0']) {
      expect(modeloSeguro(m), m).toBe(m);
    }
  });

  it('modeloSeguro no aplica la regla de series cortas: los modelos reales se ven', () => {
    for (const m of [
      'ST2000DM008',
      'ST4000DM004-2CV104',
      'HDS721010CLA332',
      'WDC WD10EZEX-08WN4A0',
      'TOSHIBA DT01ACA100',
    ]) {
      expect(modeloSeguro(m), m).toBe(m);
    }
    // Las series largas, los EUI y los GUID sí se tapan en un modelo.
    expect(modeloSeguro('Generic S3Z9NB0K123456789A')).toBe('Generic …');
    expect(modeloSeguro('NVMe eui.0025385211700000')).toBe('NVMe …');
    // Y la regla corta sigue activa en el texto de los eventos.
    expect(sanearTextoSistema('serie ST2000DM008 fallo')).not.toContain('ST2000DM008');
  });

  it('no toca modelos ni textos normales', () => {
    for (const t of [
      'Samsung SSD 970 EVO Plus 1TB',
      'WDC WD10EZEX-08WN4A0',
      'Disk 0 has been surprise removed',
    ]) {
      expect(enmascararSerie(t)).toBe(t);
    }
  });

  it('NVMe EUI: con grupos, con punto final y con prefijo eui.', () => {
    expect(enmascararSerie('NVMe 0025_3852_1170_0B5C. fin')).toBe('NVMe … fin');
    expect(enmascararSerie('NVMe 0025_3852_1170_0B5C fin')).toBe('NVMe … fin');
    expect(enmascararSerie('id eui.0025385211700000 fin')).toBe('id … fin');
    expect(enmascararSerie('id EUI.0025385211700000')).toBe('id …');
    expect(enmascararSerie('nguid.0025385211700000AABBCCDDEEFF0011')).toBe('…');
  });
});

describe('rutas (I4)', () => {
  const sin = (t: string, ...prohibido: string[]): string => {
    const r = sanearTextoSistema(t);
    for (const p of prohibido) expect(r).not.toContain(p);
    return r;
  };

  it('usuario con espacios, con y sin unidad, en \\Device\\HarddiskVolumeN y con barras', () => {
    sin('Error en C:\\Users\\María José Pérez\\AppData\\x.sys', 'María', 'Pérez', 'José');
    sin('Ruta \\Users\\Juan Carlos\\Documentos\\a.txt fin', 'Juan', 'Carlos');
    sin('\\Device\\HarddiskVolume3\\Users\\Ana López\\a.db', 'Ana', 'López');
    sin('en \\\\?\\C:\\Users\\Pedro Gil\\x', 'Pedro', 'Gil');
    sin('en C:/Users/Luis Mora/x', 'Luis', 'Mora');
    expect(sanearTextoSistema('C:\\Users\\Ana Gil\\x')).toContain('[ruta de usuario]');
  });

  it('el nombre se tapa entero hasta el siguiente separador y el texto de después se conserva', () => {
    expect(sanearTextoSistema('Falló C:\\Users\\Ana Gil\\x.db y se reintentó')).toBe(
      'Falló [ruta de usuario] y se reintentó',
    );
  });

  it('rutas UNC \\\\host\\recurso', () => {
    sin('Error en \\\\SERVIDOR-01\\Compartida\\a.txt fin', 'SERVIDOR', 'Compartida');
    expect(sanearTextoSistema('\\\\host\\c$')).toBe('[ruta de red]');
    // Las de dispositivo no son rutas de red.
    expect(sanearTextoSistema('\\\\.\\PhysicalDrive1')).toBe('\\\\.\\PhysicalDrive1');
  });

  it('rutas de instancia SCSI\\…\\5&…, USBSTOR y su forma de interfaz', () => {
    sin(
      'Dispositivo SCSI\\Disk&Ven_NVMe&Prod_Samsung_SSD_970\\5&1a2b3c4d&0&000000 falló',
      '5&1a2b3c4d',
      'Samsung',
    );
    sin('USBSTOR\\Disk&Ven_Generic&Prod_Flash\\0123456789AB&0 listo', '0123456789AB');
    sin('\\\\?\\SCSI#Disk&Ven_NVMe&Prod_X#5&1a2b3c4d&0&000000#{53f56307-b6bf-11d0}', '5&1a2b3c4d');
    expect(sanearTextoSistema('SCSI\\Disk&Ven_A&Prod_B\\5&1&0&0 fin')).toBe('[dispositivo] fin');
  });

  it('COMPUTERNAME y USERNAME literales, como dependencias', () => {
    const id = { equipo: 'PC-DE-MARIA', usuario: 'mperez' };
    const t = sanearTextoSistema('El equipo PC-DE-MARIA, usuario MPerez: disco 1 falló', 300, id);
    expect(t).toBe('El equipo [equipo], usuario [usuario]: disco 1 falló');
    // Sin dependencias no se inventa nada.
    expect(sanearTextoSistema('usuario mperez', 300)).toBe('usuario mperez');
    // Los nombres de menos de 3 caracteres se tapan solo como palabra completa.
    expect(sanearTextoSistema('a b', 300, { usuario: 'a', equipo: '' })).toBe('[usuario] b');
    expect(sanearTextoSistema('Fallo en PC y ab, abc', 300, { equipo: 'pc', usuario: 'ab' })).toBe(
      'Fallo en [equipo] y [usuario], abc',
    );
    expect(sanearTextoSistema('capa pcs', 300, { equipo: 'pc' })).toBe('capa pcs');
    // Una palabra más larga que lo contiene no se toca.
    expect(sanearTextoSistema('mperezgarcia', 300, { usuario: 'mperez' })).toBe('mperezgarcia');
  });

  it('el nombre del equipo se escapa como texto, no como expresión regular', () => {
    expect(sanearTextoSistema('x a.b y axb', 300, { equipo: 'a.b' })).toBe('x [equipo] y axb');
  });
});

describe('recorte DESPUÉS de enmascarar', () => {
  it('un identificador que cruzaría el corte no se escapa a medias', () => {
    const relleno = 'x '.repeat(145); // 290 caracteres
    const t = sanearTextoSistema(`${relleno}S4EWNX0R123456A fin`, 300);
    expect(t).not.toMatch(/S4EWNX|123456/);
    // Una ruta de usuario que empieza antes del corte se tapa entera, no se corta por la mitad.
    const u = sanearTextoSistema(`${'y '.repeat(140)}C:\\Users\\Maria Perez\\Docs\\a.txt`, 300);
    expect(u).not.toMatch(/Maria|Perez/);
  });

  it('el script de eventos ya no recorta a 400 antes de enmascarar', () => {
    expect(SCRIPT_EVENTOS_DISCO).not.toMatch(/-gt 400\)/);
  });

  it('un evento completo: ruta, serie y nombres del equipo salen tapados', () => {
    const r = interpretarEventosDisco(
      JSON.stringify([
        {
          f: '2026-11-20T08:30:00Z',
          id: 51,
          p: 'disk',
          m: 'Error en \\Device\\Harddisk0\\DR0 de PC-DE-MARIA con WD-WCC4E1234567, C:\\Users\\Ana Gil\\x',
        },
      ]),
      200,
      { equipo: 'PC-DE-MARIA', usuario: 'ana' },
    );
    expect(r[0]!.detalle).not.toMatch(/PC-DE-MARIA|WCC4E1234567|Ana|Gil/);
  });
});

describe('la plataforma pasa COMPUTERNAME y USERNAME al saneado', () => {
  it('eventosDisco tapa el nombre del equipo y del usuario del entorno', async () => {
    const salida = JSON.stringify([
      {
        f: '2026-11-20T08:30:00Z',
        id: 7,
        p: 'disk',
        m: 'Fallo en PC-DE-MARIA para mperez',
      },
    ]);
    const p = new PlataformaWindows(
      async () => ({ codigo: 0, stdout: salida, stderr: '' }),
      undefined,
      { entorno: { SystemRoot: 'C:\\Windows', COMPUTERNAME: 'PC-DE-MARIA', USERNAME: 'mperez' } },
    );
    const r = await p.eventosDisco();
    expect(r?.[0]?.detalle).toBe('Fallo en [equipo] para [usuario]');
  });
});
