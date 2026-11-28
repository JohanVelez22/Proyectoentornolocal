import { describe, expect, it } from 'vitest';
import {
  SALIDA_QUITAR_CARPETA,
  argumentosPing,
  interpretarAdaptadores,
  interpretarCarpetasCompartidas,
  interpretarNetView,
  interpretarPing,
  interpretarVecinos,
  motivoNetView,
  normalizarMac,
  scriptQuitarCarpeta,
} from '../src/plataforma/redWin';

/** La salida de PowerShell viaja como JSON en Base64 de UTF-8. */
const b64 = (v: unknown): string =>
  `${Buffer.from(JSON.stringify(v), 'utf8').toString('base64')}\r\n`;

describe('carpetas compartidas de este equipo (D53)', () => {
  it('interpreta Get-SmbShare y marca las administrativas', () => {
    const r = interpretarCarpetasCompartidas(
      b64([
        {
          n: 'ADMIN$',
          r: 'C:\\WINDOWS',
          d: 'Admin remota',
          t: 'FileSystemDirectory',
          s: true,
          u: 0,
        },
        {
          n: 'C$',
          r: 'C:\\',
          d: 'Recurso predeterminado',
          t: 'FileSystemDirectory',
          s: true,
          u: 0,
        },
        { n: 'IPC$', r: '', d: 'IPC remota', t: 'IPC', s: true, u: 0 },
        {
          n: 'Música',
          r: 'C:\\Users\\yo\\Música',
          d: 'Mi música',
          t: 'FileSystemDirectory',
          s: false,
          u: 2,
        },
        { n: 'datos$', r: 'D:\\datos', d: '', t: 'FileSystemDirectory', s: false, u: 0 },
        { n: 'Impresora', r: 'HP', d: '', t: 'PrintQueue', s: false, u: 0 },
      ]),
    );
    expect(r).not.toBeNull();
    const por = Object.fromEntries(r!.map((c) => [c.nombre, c]));
    expect(por['ADMIN$']).toMatchObject({ administrativa: true, oculta: true });
    expect(por['C$']).toMatchObject({ administrativa: true, oculta: true });
    expect(por['IPC$']).toMatchObject({ administrativa: true, tipo: 'otro' });
    expect(por['Música']).toEqual({
      nombre: 'Música',
      ruta: 'C:\\Users\\yo\\Música',
      descripcion: 'Mi música',
      tipo: 'carpeta',
      administrativa: false,
      oculta: false,
      usuarios: 2,
    });
    // Oculta por el `$` aunque Windows no la llame especial: tampoco se deja de compartir desde la app.
    expect(por['datos$']).toMatchObject({ administrativa: true, oculta: true });
    expect(por['Impresora']).toMatchObject({ tipo: 'impresora', administrativa: true });
  });

  it('un solo objeto, una lista vacía y basura', () => {
    expect(
      interpretarCarpetasCompartidas(b64({ n: 'Uno', r: 'C:\\u', t: 'FileSystemDirectory' })),
    ).toHaveLength(1);
    expect(interpretarCarpetasCompartidas(b64([]))).toEqual([]);
    expect(interpretarCarpetasCompartidas('')).toEqual([]);
    expect(interpretarCarpetasCompartidas('esto no es base64 ni json!')).toBeNull();
    expect(interpretarCarpetasCompartidas(b64([{ r: 'sin nombre' }, 5, null]))).toEqual([]);
  });

  it('el script elevado vuelve a comprobar la carpeta, trae su plazo y cita el nombre como literal', () => {
    const s = scriptQuitarCarpeta("Fotos 'viejas'", String.raw`C:\Mis 'fotos'`, 1_700_000_000_000);
    expect(s).toContain("Get-SmbShare -Name 'Fotos ''viejas'''");
    expect(s).toContain("Remove-SmbShare -Name 'Fotos ''viejas''' -Force");
    expect(s).toContain('$s.Special');
    // Solo la carpeta que vio la persona: una sola con ese nombre y con la misma ruta.
    expect(s).toContain(`@($s).Count -ne 1) { exit ${SALIDA_QUITAR_CARPETA.cambio} }`);
    expect(s).toContain(
      String.raw`[string]$s.Path -ne 'C:\Mis ''fotos''') { exit ${SALIDA_QUITAR_CARPETA.cambio} }`,
    );
    // Solo «no existe» sale con 42; cualquier otro error de lectura es un fallo (43).
    expect(s).toContain(
      `$_.CategoryInfo.Category -eq 'ObjectNotFound') { exit ${SALIDA_QUITAR_CARPETA.noExiste} } else { exit ${SALIDA_QUITAR_CARPETA.fallo} }`,
    );
    expect(s).toContain("EndsWith('$')");
    expect(s).toContain('1700000000000');
    expect(s).toContain(`exit ${SALIDA_QUITAR_CARPETA.vencido}`);
    // Con comillas tipográficas no se puede cerrar el literal.
    expect(scriptQuitarCarpeta('a’b', String.raw`C:\x`, 1)).toContain("'a’’b'");
  });
});

describe('adaptadores y vecinos (D53)', () => {
  it('marca los túneles, PPP y VPN por tipo de interfaz o por nombre, y no a los demás', () => {
    const r = interpretarAdaptadores(
      b64([
        {
          i: 1,
          n: 'Wi-Fi',
          a: '192.168.1.20',
          p: 24,
          d: true,
          c: 'Private',
          t: 71,
          x: 'Intel(R) Wi-Fi 6 AX201',
        },
        {
          i: 2,
          n: 'Conexión',
          a: '10.8.0.2',
          p: 24,
          d: false,
          c: 'Private',
          t: 131,
          x: 'Adaptador',
        },
        { i: 3, n: 'Datos', a: '10.9.0.2', p: 24, d: false, c: 'Private', t: 23, x: 'RAS' },
        {
          i: 4,
          n: 'Ethernet 3',
          a: '10.7.0.2',
          p: 24,
          d: false,
          c: 'Private',
          t: 6,
          x: 'TAP-Windows Adapter V9',
        },
        { i: 5, n: 'WireGuard', a: '10.6.0.2', p: 24, d: false, c: 'Private', t: 6, x: 'x' },
        {
          i: 6,
          n: 'Laptop',
          a: '10.5.0.2',
          p: 24,
          d: false,
          c: 'Private',
          t: 6,
          x: 'Desktop Adapter',
        },
        {
          i: 7,
          n: 'Ethernet',
          a: '10.4.0.2',
          p: 24,
          d: false,
          c: 'Private',
          x: 'Mi VPN corporativa',
        },
      ]),
    );
    expect(r?.map((a) => [a.nombre, a.tunel === true])).toEqual([
      ['Wi-Fi', false],
      ['Conexión', true],
      ['Datos', true],
      ['Ethernet 3', true],
      ['WireGuard', true],
      ['Laptop', false],
      ['Ethernet', true],
    ]);
  });

  it('interpreta los adaptadores con su perfil de red y cuál es el predeterminado', () => {
    const r = interpretarAdaptadores(
      b64([
        { i: 12, n: 'Wi-Fi', a: '192.168.1.20', p: 24, d: true, c: 'Private' },
        { i: 5, n: 'Ethernet 2', a: '10.0.0.5', p: 8, d: false, c: 'Public' },
        { i: 7, n: 'vEthernet', a: '172.20.0.1', p: 16, d: false, c: 'DomainAuthenticated' },
        { i: 9, n: 'Sin perfil', a: '192.168.9.9', p: 24, d: false, c: '' },
        { i: 1, n: 'raro', a: 'no-ip', p: 24 },
        { i: 2, n: 'prefijo malo', a: '10.1.1.1', p: 40 },
      ]),
    );
    expect(r).toEqual([
      {
        indice: 12,
        nombre: 'Wi-Fi',
        ip: '192.168.1.20',
        prefijo: 24,
        predeterminado: true,
        perfil: 'privado',
      },
      {
        indice: 5,
        nombre: 'Ethernet 2',
        ip: '10.0.0.5',
        prefijo: 8,
        predeterminado: false,
        perfil: 'publico',
      },
      {
        indice: 7,
        nombre: 'vEthernet',
        ip: '172.20.0.1',
        prefijo: 16,
        predeterminado: false,
        perfil: 'dominio',
      },
      {
        indice: 9,
        nombre: 'Sin perfil',
        ip: '192.168.9.9',
        prefijo: 24,
        predeterminado: false,
        perfil: null,
      },
    ]);
  });

  it('la tabla ARP: solo privadas, con MAC de equipo, sin difusión ni multidifusión ni repetidas', () => {
    const r = interpretarVecinos(
      b64([
        { a: '192.168.1.1', m: 'AA-BB-CC-00-11-22', e: 'Reachable', i: 12 },
        { a: '192.168.1.1', m: 'AA-BB-CC-00-11-22', e: 'Stale', i: 12 },
        { a: '192.168.1.255', m: 'FF-FF-FF-FF-FF-FF', e: 'Permanent', i: 12 },
        { a: '224.0.0.22', m: '01-00-5E-00-00-16', e: 'Permanent', i: 12 },
        { a: '192.168.1.40', m: '00-00-00-00-00-00', e: 'Stale', i: 12 },
        { a: '8.8.8.8', m: 'AA-BB-CC-00-11-33', e: 'Reachable', i: 12 },
        { a: '10.0.0.7', m: 'aa:bb:cc:00:11:44', e: 'Stale', i: 5 },
        { a: '10.0.0.8', m: 'xx', e: 'Stale', i: 5 },
      ]),
    );
    expect(r).toEqual([
      { ip: '192.168.1.1', mac: 'aa:bb:cc:00:11:22', estado: 'Reachable', indice: 12 },
      { ip: '10.0.0.7', mac: 'aa:bb:cc:00:11:44', estado: 'Stale', indice: 5 },
    ]);
  });

  it('normaliza las MAC', () => {
    expect(normalizarMac('AA-BB-CC-DD-EE-FF')).toBe('aa:bb:cc:dd:ee:ff');
    expect(normalizarMac('aabbccddeeff')).toBe('aa:bb:cc:dd:ee:ff');
    expect(normalizarMac('aa:bb:cc')).toBeNull();
    expect(normalizarMac('01:00:5e:00:00:01')).toBeNull();
  });
});

describe('ping (D53)', () => {
  it('los argumentos: IPv4 sin resolver, intentos de 1 a 10 y plazo acotado', () => {
    expect(argumentosPing('192.168.1.5', { intentos: 4, plazoMs: 1000 })).toEqual([
      '-4',
      '-n',
      '4',
      '-w',
      '1000',
      '192.168.1.5',
    ]);
    expect(argumentosPing('10.0.0.1', { intentos: 10, plazoMs: 100 })[2]).toBe('10');
    for (const intentos of [0, 11, 100, -1, 1.5, NaN]) {
      expect(
        () => argumentosPing('192.168.1.5', { intentos, plazoMs: 1000 }),
        String(intentos),
      ).toThrow();
    }
    for (const plazoMs of [0, 99, 5001, 1e9, 1.5]) {
      expect(
        () => argumentosPing('192.168.1.5', { intentos: 4, plazoMs }),
        String(plazoMs),
      ).toThrow();
    }
    for (const ip of ['8.8.8.8', 'pc', '192.168.1.5 -t', '-t', '']) {
      expect(() => argumentosPing(ip, { intentos: 4, plazoMs: 1000 }), ip).toThrow();
    }
  });

  it('cuenta las respuestas en español, inglés, alemán y ruso', () => {
    const es = [
      'Haciendo ping a 192.168.1.5 con 32 bytes de datos:',
      'Respuesta desde 192.168.1.5: bytes=32 tiempo=12ms TTL=64',
      'Respuesta desde 192.168.1.5: bytes=32 tiempo<1ms TTL=64',
      'Tiempo de espera agotado para esta solicitud.',
      'Respuesta desde 192.168.1.1: Host de destino inaccesible.',
    ].join('\r\n');
    expect(interpretarPing(es, '192.168.1.5', 4)).toEqual({
      enviados: 4,
      recibidos: 2,
      tiemposMs: [12, 0],
      cancelado: false,
    });
    const en =
      'Reply from 10.0.0.2: bytes=32 time=3ms TTL=128\nReply from 10.0.0.2: bytes=32 time=5ms TTL=128';
    expect(interpretarPing(en, '10.0.0.2', 2).tiemposMs).toEqual([3, 5]);
    const de =
      'Antwort von 10.0.0.2: Bytes=32 Zeit=7ms TTL=64\nZeitüberschreitung der Anforderung.';
    expect(interpretarPing(de, '10.0.0.2', 2)).toMatchObject({ recibidos: 1, tiemposMs: [7] });
    const ru = 'Ответ от 10.0.0.2: число байт=32 время=4мс TTL=64';
    expect(interpretarPing(ru, '10.0.0.2', 1).tiemposMs).toEqual([4]);
  });

  it('cuenta las respuestas en francés, chino, japonés, coreano y turco (la IP va como token)', () => {
    const casos: [string, string][] = [
      ['fr', 'Réponse de 192.168.1.5 : octets=32 temps<1ms TTL=128'],
      ['zh', '来自 192.168.1.5 的回复: 字节=32 时间<1ms TTL=128'],
      ['ja', '192.168.1.5 からの応答: バイト数 =32 時間 <1ms TTL=128'],
      ['ko', '192.168.1.5의 응답: 바이트=32 시간<1ms TTL=128'],
      ['tr', '192.168.1.5 yanıtı: bayt=32 süre<1ms TTL=128'],
    ];
    for (const [idioma, linea] of casos) {
      expect(interpretarPing(linea, '192.168.1.5', 1), idioma).toMatchObject({
        recibidos: 1,
        tiemposMs: [0],
      });
    }
    expect(
      interpretarPing('Réponse de 192.168.1.5 : octets=32 temps=14ms TTL=128', '192.168.1.5', 1)
        .tiemposMs,
    ).toEqual([14]);
  });

  it('un «host inaccesible» de la puerta de enlace, un plazo agotado o una IP que solo la contiene no cuentan', () => {
    const salida = [
      'Respuesta desde 192.168.1.1: Host de destino inaccesible.',
      'Tiempo de espera agotado para esta solicitud.',
    ].join('\r\n');
    expect(interpretarPing(salida, '192.168.1.5', 2).recibidos).toBe(0);
    expect(interpretarPing(salida, '192.168.1.1', 2).recibidos).toBe(0);
    const otra =
      'Reply from 192.168.1.50: bytes=32 time=1ms TTL=64\nReply from 10.192.168.1.5: bytes=32 time=1ms TTL=64';
    expect(interpretarPing(otra, '192.168.1.5', 2).recibidos).toBe(0);
  });

  it('sin respuestas, o respuestas de otra IP, no cuentan', () => {
    expect(interpretarPing('Request timed out.\nRequest timed out.', '10.0.0.2', 2).recibidos).toBe(
      0,
    );
    expect(
      interpretarPing('Reply from 10.0.0.9: bytes=32 time=1ms TTL=64', '10.0.0.2', 1).recibidos,
    ).toBe(0);
    // Nunca más respuestas que paquetes enviados.
    const mucho = Array(6).fill('Reply from 10.0.0.2: bytes=32 time=1ms TTL=64').join('\n');
    expect(interpretarPing(mucho, '10.0.0.2', 4).recibidos).toBe(4);
  });
});

describe('net view (D53)', () => {
  const EN = [
    'Shared resources at \\\\192.168.1.5',
    '',
    'Share name   Type   Used as  Comment',
    '',
    '-------------------------------------------------------------------------------',
    'Docs         Disk            Documentos del equipo',
    'Mis fotos    Disk',
    'Printer      Print           Canon en el pasillo',
    'The command completed successfully.',
    '',
  ].join('\r\n');

  it('interpreta nombre, tipo y comentario en inglés', () => {
    expect(interpretarNetView(EN)).toEqual([
      { nombre: 'Docs', tipo: 'Disk', comentario: 'Documentos del equipo' },
      { nombre: 'Mis fotos', tipo: 'Disk', comentario: '' },
      { nombre: 'Printer', tipo: 'Print', comentario: 'Canon en el pasillo' },
    ]);
  });

  it('aguanta nombres largos o con espacios tomando las columnas de la cabecera', () => {
    const salida = [
      'Shared resources at \\\\192.168.1.5',
      '',
      'Share name                          Type   Used as  Comment',
      '',
      '-------------------------------------------------------------------------------',
      'Documentos de la familia Pérez      Disk            Fotos y papeles',
      'Disk compartido                     Disk',
      'Mis  fotos  viejas                  Disk            Dos espacios',
      'Impresora de la oficina grande      Print           Canon',
      'The command completed successfully.',
      '',
    ].join('\r\n');
    expect(interpretarNetView(salida)).toEqual([
      { nombre: 'Documentos de la familia Pérez', tipo: 'Disk', comentario: 'Fotos y papeles' },
      { nombre: 'Disk compartido', tipo: 'Disk', comentario: '' },
      { nombre: 'Mis  fotos  viejas', tipo: 'Disk', comentario: 'Dos espacios' },
      { nombre: 'Impresora de la oficina grande', tipo: 'Print', comentario: 'Canon' },
    ]);
  });

  it('interpreta la salida en español sin tomar la última línea por un recurso', () => {
    const es = [
      'Recursos compartidos en \\\\192.168.1.5',
      '',
      'Nombre de recurso compartido   Tipo   Usado como  Comentario',
      '',
      '-------------------------------------------------------------------------------',
      'Compartida                     Disco',
      'Se ha completado el comando correctamente.',
      '',
    ].join('\r\n');
    expect(interpretarNetView(es)).toEqual([
      { nombre: 'Compartida', tipo: 'Disco', comentario: '' },
    ]);
  });

  it('sin recursos o sin tabla da una lista vacía', () => {
    expect(interpretarNetView('')).toEqual([]);
    expect(
      interpretarNetView('Error de sistema 53.\r\nNo se ha encontrado la ruta de acceso de red.'),
    ).toEqual([]);
    expect(interpretarNetView('Hay 0 entradas en la lista.')).toEqual([]);
  });

  it('el motivo del fallo sale del número de error, en cualquier idioma', () => {
    expect(motivoNetView('Error de sistema 5.\r\nAcceso denegado.')).toBe('denegado');
    expect(motivoNetView('System error 53 has occurred.\r\nThe network path was not found.')).toBe(
      'inaccesible',
    );
    expect(motivoNetView('Systemfehler 1219.')).toBe('denegado');
    expect(motivoNetView('Fehler 6118 aufgetreten')).toBe('inaccesible');
    expect(motivoNetView('algo raro')).toBe('error');
  });
});
