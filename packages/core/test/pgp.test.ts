import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { anillo, leerAnillo } from '../src/catalogo/pgp/anillos';
import { crc24, desarmar, leerFirma, leerPaquetes } from '../src/catalogo/pgp/paquetes';
import { iniciarVerificacion, verificarFirmaSeparada } from '../src/catalogo/pgp/verificar';
import { fuenteFirmaDe } from '../src/catalogo/huellas';
import {
  armar,
  azar,
  be16,
  be32,
  clavePublica,
  cuerpoFirma,
  firmar,
  mpi,
  nuevaClave,
  paquete,
  subpaquete,
} from './pgp-firmante';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const fx = (n: string): Buffer => readFileSync(path.join(AQUI, 'fixtures', 'pgp', n));

/** Fecha fija de las pruebas con fixtures reales. */
const AHORA = new Date('2026-11-24T12:00:00Z');

const ED_NODE = '5BE8A3F6C8A5C01D106C0AD820B1A390B168D356';
const RSA_NODE = 'CC68F5A3106FF448322E48ED27F5E38D5B0A215F';
const COMPOSER = '161DFBE342889F01DDAC4E61CBB3D576F2A0946F';
const NGINX_PLUKNET = 'D6786CE303D9A9022998DC6CC8464D549AF75C0A';

/** Huellas primarias de los releasers de Node (README de nodejs/node y nodejs/release-keys). */
const HUELLAS_NODE = [
  '5BE8A3F6C8A5C01D106C0AD820B1A390B168D356',
  'DD792F5973C6DE52C432CBDAC77ABFA00DDBF2B7',
  'CC68F5A3106FF448322E48ED27F5E38D5B0A215F',
  '890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4',
  'C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C',
  '108F52B48DB57BB0CC439B2997B01419BD92F80A',
  '655F3B5C1FB3FA8D1A0CA6BDE4A7D232B936D2FD',
  'A363A499291CBBC940DD62E41F10027AF002F8B0',
  'C0D6248439F1D5604AAFFB4021D900FFDB233756',
  '4ED778F539E3634C779C87C6D7062848A1AB005C',
  '141F07595B7B3FFE74309A937405533BE57C7D57',
  '9554F04D7259F04124DE6B476D5A82AC7E37093B',
  '94AE36675C464D64BAFA68DD7434390BDBE9B9C5',
  '1C050899334244A8AF75E53792EF661D867B9DFA',
  '74F12602B6F1C4E913FAA37AD3A89613643B6201',
  'B9AE9905FFD7803F25714661B63B535A4C206CA9',
  '77984A986EBC2AA786BC0F66B01FBB92821C587A',
  '93C7E9E91B49E432C2F75674B0A78B0A6C481CF6',
  '56730D5401028683275BD23C23EFEFE93C4CFFFE',
  '71DCFD284A79C3B38668286BC97EC7A07EDE3FC1',
  'FD3A5288F042B6850C66B31F09FE44734EB7990E',
  '61FC681DFB92A079F1685E77973F295594EC4689',
  '114F43EE0176B71C7BC219DD50A3051F888C628D',
  '8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600',
  'C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8',
  'DD8F2338BAE7501E3DD5AC78C273792F7D83545D',
  'A48C2BEE680E841632CD4E44F07496B3EB3C1762',
  'B9E2F5981AA6E0CD28160D9FF13993A75599653C',
  // 7937DFD2AB06298B2293C3187D33FF9D0246406D (Timothy J Fontaine) es DSA: no entra.
];

const primarias = (a: readonly { huella: string; huellaPrimaria: string }[]): string[] =>
  a.filter((c) => c.huella === c.huellaPrimaria).map((c) => c.huella);

describe('anillos fijados', () => {
  it('node.asc trae las claves de los releasers (sin la DSA)', () => {
    expect(primarias(anillo('node')).sort()).toEqual([...HUELLAS_NODE].sort());
  });

  it('composer.asc y nginx.asc traen las claves oficiales', () => {
    expect(primarias(anillo('composer'))).toEqual([COMPOSER]);
    expect(primarias(anillo('nginx')).sort()).toEqual(
      [
        '43387825DDB1BB97EC36BA5D007C8D7C15D87369',
        NGINX_PLUKNET,
        'AC50DD4E7CD5D51FD00D1F4C4DB15B66AA75322B',
        '13C82A63B603576156E30A4EA0EA981B66B0D967',
      ].sort(),
    );
  });

  it('todas las primarias y las subclaves de firma de los anillos siguen firmando', () => {
    // Autofirmas, vinculaciones y retrofirmas verificadas: ninguna clave fijada se pierde.
    for (const f of ['node', 'composer', 'nginx'] as const) {
      for (const c of anillo(f).filter((x) => x.huella === x.huellaPrimaria)) {
        expect(c.firma, `${f} ${c.huella}`).toBe(true);
      }
    }
    const subclavesNode = anillo('node')
      .filter((c) => c.huella !== c.huellaPrimaria && c.firma)
      .map((c) => c.huella)
      .sort();
    expect(subclavesNode).toEqual(
      [
        '26FFD37528D0DE0E6D4D1C1A7341B15C070877AC',
        '86C8D74642E67846F8E120284DAA80D1E737BC9F',
        'C2B25D9B4272DB29565BA87F3C7824F39A895758',
        'A6023530FC53461FEC91F99C04CD3F2FDE079578',
        '2B2B9F0D620463DB3DE74C50DEA16371974031A5',
        '0EFFE1BCEFD9C84E3D098152933B01F40B5CA946',
        '50CBD045680704B1B723693545F5EEBD813DAE8E',
      ].sort(),
    );
  });

  it('lee el vencimiento de la autofirma y si la clave firma', () => {
    const beth = anillo('node').find(
      (c) => c.huella === '4ED778F539E3634C779C87C6D7062848A1AB005C',
    );
    expect(beth?.expiracion).toBe(1679864449);
    const ed = anillo('node').find((c) => c.huella === ED_NODE);
    expect(ed).toMatchObject({ algoritmo: 22, firma: true, revocada: false, expiracion: null });
    // Las subclaves de cifrado (ECDH o RSA [E]) no firman.
    const composer = anillo('composer');
    expect(composer.filter((c) => c.firma).map((c) => c.huella)).toEqual([COMPOSER]);
  });
});

describe('firmas reales', () => {
  it('Node 24.22.3 (Ed25519) es válida con el anillo de Node', () => {
    const r = verificarFirmaSeparada({
      datos: fx('node-24.22.3-SHASUMS256.txt'),
      firma: fx('node-24.22.3-SHASUMS256.txt.sig'),
      anillo: anillo('node'),
      ahora: AHORA,
    });
    expect(r).toEqual({ ok: true, huellaClave: ED_NODE, huellaPrimaria: ED_NODE });
  });

  it('Node 20.20.2 (RSA, SHA-256) es válida con el anillo de Node', () => {
    const r = verificarFirmaSeparada({
      datos: fx('node-20.20.2-SHASUMS256.txt'),
      firma: fx('node-20.20.2-SHASUMS256.txt.sig'),
      anillo: anillo('node'),
      ahora: AHORA,
    });
    expect(r).toMatchObject({ ok: true, huellaClave: RSA_NODE });
  });

  it('un byte cambiado en SHASUMS256.txt → firma_invalida', () => {
    for (const v of ['24.22.3', '20.20.2']) {
      const datos = Buffer.from(fx(`node-${v}-SHASUMS256.txt`));
      datos[100] = datos[100]! ^ 0x01;
      const r = verificarFirmaSeparada({
        datos,
        firma: fx(`node-${v}-SHASUMS256.txt.sig`),
        anillo: anillo('node'),
        ahora: AHORA,
      });
      expect(r).toMatchObject({ ok: false, codigo: 'catalogo.firma_invalida' });
    }
  });

  it('firma real con un anillo sin esa clave → clave_desconocida', () => {
    const r = verificarFirmaSeparada({
      datos: fx('node-24.22.3-SHASUMS256.txt'),
      firma: fx('node-24.22.3-SHASUMS256.txt.sig'),
      anillo: anillo('composer'),
      ahora: AHORA,
    });
    expect(r).toMatchObject({ ok: false, codigo: 'catalogo.clave_desconocida' });
  });

  it('Nginx (RSA, armadura): un parche firmado de nginx.org es válido', () => {
    const r = verificarFirmaSeparada({
      datos: fx('nginx-patch.2025.smtp.txt'),
      firma: fx('nginx-patch.2025.smtp.txt.asc'),
      anillo: anillo('nginx'),
      ahora: AHORA,
    });
    expect(r).toEqual({ ok: true, huellaClave: NGINX_PLUKNET, huellaPrimaria: NGINX_PLUKNET });
  });

  it('Composer (RSA, SHA-512, binaria) y el zip de Nginx: la clave del anillo se reconoce', () => {
    // Sin el phar ni el zip (no se guardan en el repo) la firma no puede ser válida, pero el
    // emisor está en el anillo: el fallo es de datos, no de clave.
    const composer = leerFirma(leerPaquetes(fx('composer-2.11.2.phar.asc'))[0]!.cuerpo);
    expect(composer).toMatchObject({
      algoritmoHash: 10,
      algoritmoClave: 1,
      emisorHuella: COMPOSER,
    });
    for (const [firma, a, otro] of [
      ['composer-2.11.2.phar.asc', 'composer', 'nginx'],
      ['nginx-1.30.6.zip.asc', 'nginx', 'composer'],
    ] as const) {
      const datos = fx(
        firma.replace('.asc', firma.startsWith('composer') ? '.sha256sum' : '.sha256'),
      );
      expect(
        verificarFirmaSeparada({ datos, firma: fx(firma), anillo: anillo(a), ahora: AHORA }),
      ).toMatchObject({ ok: false, codigo: 'catalogo.firma_invalida' });
      expect(
        verificarFirmaSeparada({ datos, firma: fx(firma), anillo: anillo(otro), ahora: AHORA }),
      ).toMatchObject({ ok: false, codigo: 'catalogo.clave_desconocida' });
    }
  });

  it('armadura: CRC24 roto → firma_invalida; sin CRC se acepta (RFC 9580)', () => {
    const texto = fx('nginx-patch.2025.smtp.txt.asc').toString('latin1');
    const lineas = texto.split('\n');
    const i = lineas.findIndex((l) => /^=[A-Za-z0-9+/]{4}$/.test(l));
    expect(i).toBeGreaterThan(0);
    const roto = [...lineas];
    roto[i] = lineas[i]!.startsWith('=A') ? '=BAAA' : '=AAAA';
    const sinCrc = lineas.filter((_, j) => j !== i);
    const base = { datos: fx('nginx-patch.2025.smtp.txt'), anillo: anillo('nginx'), ahora: AHORA };
    expect(
      verificarFirmaSeparada({ ...base, firma: Buffer.from(roto.join('\n'), 'latin1') }),
    ).toMatchObject({ ok: false, codigo: 'catalogo.firma_invalida' });
    expect(
      verificarFirmaSeparada({ ...base, firma: Buffer.from(sinCrc.join('\r\n'), 'latin1') }),
    ).toMatchObject({ ok: true });
  });

  it('crc24 da el valor de referencia', () => {
    // RFC 4880 §6.1: el CRC de la entrada vacía es el valor inicial.
    expect(crc24(new Uint8Array())).toBe(0xb704ce);
  });
});

// ---------------------------------------------------------------- claves de prueba

const T0 = 1_700_000_000;
const rsa = nuevaClave('rsa', T0);
const ed = nuevaClave('ed25519', T0);
const DATOS = Buffer.from('a1b2  node-v1.0.0-win-x64.zip\nc3d4  otro.zip\n');
const ahoraPrueba = new Date((T0 + 3600) * 1000);
const anilloDe = (...partes: Buffer[]) => leerAnillo(Buffer.concat(partes));
const ANILLO = anilloDe(clavePublica(rsa), clavePublica(ed));

function verificar(
  firma: Buffer | string,
  o: {
    datos?: Buffer;
    anillo?: ReturnType<typeof leerAnillo>;
    ahora?: Date;
    tipos?: readonly number[];
    noAntesDe?: Date;
  } = {},
) {
  return verificarFirmaSeparada({
    datos: o.datos ?? DATOS,
    firma: typeof firma === 'string' ? Buffer.from(firma, 'latin1') : firma,
    anillo: o.anillo ?? ANILLO,
    ahora: o.ahora ?? ahoraPrueba,
    ...(o.tipos ? { tipos: o.tipos } : {}),
    ...(o.noAntesDe ? { noAntesDe: o.noAntesDe } : {}),
  });
}

const TEXTO = [0x00, 0x01] as const;

describe('verificador con claves de prueba', () => {
  it('RSA y Ed25519 con SHA-256 y SHA-512, binaria y con armadura', () => {
    for (const clave of [rsa, ed]) {
      for (const hash of [8, 10]) {
        const f = firmar(clave, DATOS, { hash });
        expect(verificar(f)).toEqual({
          ok: true,
          huellaClave: clave.huella,
          huellaPrimaria: clave.huella,
        });
        expect(verificar(armar(f))).toMatchObject({ ok: true });
        expect(verificar(f, { datos: Buffer.concat([DATOS, Buffer.from('x')]) })).toMatchObject({
          ok: false,
          codigo: 'catalogo.firma_invalida',
        });
      }
    }
  });

  it('texto canónico (0x01): LF, CRLF y CR suelto valen lo mismo, si se admite el tipo', () => {
    const f = firmar(ed, DATOS, { tipoFirma: 0x01 });
    expect(verificar(f, { tipos: TEXTO })).toMatchObject({ ok: true });
    for (const fin of ['\r\n', '\r']) {
      expect(
        verificar(f, { tipos: TEXTO, datos: Buffer.from(DATOS.toString().replace(/\n/g, fin)) }),
      ).toMatchObject({ ok: true });
    }
    // Por defecto (zip, phar) solo se admite la firma binaria 0x00.
    expect(verificar(f)).toMatchObject({ codigo: 'catalogo.firma_no_soportada' });
    // Byte a byte, con CR sueltos: un solo fin de línea por cada uno.
    const dos = iniciarVerificacion({ firma: f, anillo: ANILLO, ahora: ahoraPrueba, tipos: TEXTO });
    if ('ok' in dos) throw new Error('debía iniciar');
    const conCr = Buffer.from(DATOS.toString().replace(/\n/g, '\r'));
    for (const b of conCr) dos.actualizar(Buffer.from([b]));
    expect(dos.terminar()).toMatchObject({ ok: true });
    // En trozos con el CR y el LF separados también.
    const v = iniciarVerificacion({ firma: f, anillo: ANILLO, ahora: ahoraPrueba, tipos: TEXTO });
    if ('ok' in v) throw new Error('debía iniciar');
    const crlf = Buffer.from(DATOS.toString().replace(/\n/g, '\r\n'));
    const corte = crlf.indexOf(0x0d) + 1;
    v.actualizar(crlf.subarray(0, corte));
    v.actualizar(crlf.subarray(corte));
    expect(v.terminar()).toMatchObject({ ok: true });
  });

  it('cabecera de paquete vieja y nueva de 5 bytes', () => {
    const cuerpo = cuerpoFirma(rsa, DATOS);
    expect(verificar(paquete(2, cuerpo, 'viejo'))).toMatchObject({ ok: true });
    expect(verificar(paquete(2, cuerpo, 'nuevo5'))).toMatchObject({ ok: true });
  });

  it('SHA-1, MD5 y SHA-384 → firma_no_soportada', () => {
    for (const hash of [2, 1, 9]) {
      expect(verificar(firmar(rsa, DATOS, { hash }))).toMatchObject({
        ok: false,
        codigo: 'catalogo.firma_no_soportada',
      });
    }
  });

  it('firma v3 o v5 → firma_no_soportada', () => {
    for (const version of [3, 5, 6]) {
      expect(verificar(firmar(ed, DATOS, { version }))).toMatchObject({
        ok: false,
        codigo: 'catalogo.firma_no_soportada',
      });
    }
  });

  it('tipos de firma que no son de documento → firma_no_soportada', () => {
    for (const tipoFirma of [0x02, 0x10, 0x13, 0x18, 0x20]) {
      expect(verificar(firmar(ed, DATOS, { tipoFirma }))).toMatchObject({
        codigo: 'catalogo.firma_no_soportada',
      });
    }
  });

  it('algoritmo de clave desconocido o distinto del de la clave', () => {
    expect(verificar(firmar(ed, DATOS, { algoritmo: 19 }))).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    // Firma Ed25519 que dice ser RSA: el MPI no cuadra o el algoritmo no es el de la clave.
    expect(verificar(firmar(ed, DATOS, { algoritmo: 1 }))).toMatchObject({ ok: false });
  });

  it('los 16 bits izquierdos alterados → firma_invalida', () => {
    expect(verificar(firmar(rsa, DATOS, { alterarIzquierda: true }))).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
  });

  it('subpaquetes: crítico desconocido → no soportada; desconocido no crítico se ignora', () => {
    expect(
      verificar(firmar(ed, DATOS, { conHash: [subpaquete(100, Buffer.from('x'), true)] })),
    ).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    expect(
      verificar(firmar(ed, DATOS, { conHash: [subpaquete(20, Buffer.alloc(8), true)] })),
    ).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    expect(
      verificar(firmar(ed, DATOS, { conHash: [subpaquete(100, Buffer.from('x'))] })),
    ).toMatchObject({
      ok: true,
    });
  });

  it('sin fecha de creación, o solo sin hash → firma_invalida', () => {
    expect(verificar(firmar(ed, DATOS, { creacion: null }))).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
    expect(
      verificar(firmar(ed, DATOS, { creacion: null, sinHash: [subpaquete(2, be32(T0 + 60))] })),
    ).toMatchObject({ codigo: 'catalogo.firma_invalida' });
  });

  it('emisor: solo id vale; ninguno → clave_desconocida; id y huella distintos → inválida', () => {
    expect(verificar(firmar(rsa, DATOS, { emisor: 'id' }))).toMatchObject({ ok: true });
    expect(verificar(firmar(rsa, DATOS, { emisor: 'huella' }))).toMatchObject({ ok: true });
    expect(verificar(firmar(rsa, DATOS, { emisor: 'ninguno' }))).toMatchObject({
      codigo: 'catalogo.clave_desconocida',
    });
    expect(verificar(firmar(rsa, DATOS, { idFalso: ed.id }))).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
  });

  it('una firma hecha con otra clave del mismo id no pasa', () => {
    const otra = nuevaClave('ed25519', T0);
    // Firma de `otra` que dice venir de `ed` (huella e id de `ed`).
    const falsa = firmar({ ...otra, huella: ed.huella, id: ed.id }, DATOS);
    expect(verificar(falsa)).toMatchObject({ codigo: 'catalogo.firma_invalida' });
  });

  it('firma vencida → firma_vencida; vigente → válida', () => {
    const f = firmar(ed, DATOS, { vigencia: 100 });
    expect(verificar(f, { ahora: new Date((T0 + 60 + 99) * 1000) })).toMatchObject({ ok: true });
    expect(verificar(f, { ahora: new Date((T0 + 60 + 100) * 1000) })).toMatchObject({
      codigo: 'catalogo.firma_vencida',
    });
  });

  it('clave vencida: vale si estaba vigente al firmar (como gpg); firmada ya vencida, no', () => {
    const a = anilloDe(clavePublica(ed, { vigenciaClave: 1000 }));
    const f = firmar(ed, DATOS);
    expect(verificar(f, { anillo: a, ahora: new Date((T0 + 999) * 1000) })).toMatchObject({
      ok: true,
    });
    // Vencida hoy, vigente al firmar (T0 + 60): válida.
    expect(verificar(f, { anillo: a, ahora: new Date((T0 + 90_000) * 1000) })).toMatchObject({
      ok: true,
    });
    const tarde = firmar(ed, DATOS, { creacion: T0 + 1000 });
    expect(verificar(tarde, { anillo: a, ahora: new Date((T0 + 2000) * 1000) })).toMatchObject({
      codigo: 'catalogo.firma_vencida',
    });
  });

  it('firma con fecha anterior a la publicación (menos el margen) → firma_invalida', () => {
    const f = firmar(ed, DATOS, { creacion: T0 + 60 });
    const pub = (s: number) => new Date((T0 + 60 + s) * 1000);
    expect(verificar(f, { noAntesDe: pub(0) })).toMatchObject({ ok: true });
    expect(verificar(f, { noAntesDe: pub(1) })).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
  });

  it('firma anterior a la clave → inválida; del futuro (más de 24 h) → reloj_atrasado', () => {
    expect(verificar(firmar(ed, DATOS, { creacion: T0 - 1 }))).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
    expect(verificar(firmar(ed, DATOS, { creacion: T0 + 3600 + 86400 }))).toMatchObject({
      ok: true,
    });
    expect(verificar(firmar(ed, DATOS, { creacion: T0 + 3600 + 86401 }))).toMatchObject({
      codigo: 'catalogo.reloj_atrasado',
    });
  });

  it('clave revocada (la revocación esté donde esté) → firma_invalida', () => {
    for (const revocada of [true, 'tras-usuario', 'al-final'] as const) {
      const sub = nuevaClave('ed25519', T0);
      const a = anilloDe(clavePublica(ed, { revocada, subclaves: [{ clave: sub }] }));
      expect(a.every((c) => c.revocada)).toBe(true);
      expect(verificar(firmar(ed, DATOS), { anillo: a })).toMatchObject({
        codigo: 'catalogo.firma_invalida',
      });
    }
  });

  it('una revocación falsificada no cuenta', () => {
    const otra = nuevaClave('ed25519', T0);
    const falsa = firmar({ ...otra, huella: ed.huella, id: ed.id }, Buffer.alloc(0), {
      tipoFirma: 0x20,
      prefijo: Buffer.concat([Buffer.from([0x99]), be16(ed.cuerpo.length), ed.cuerpo]),
    });
    const a = anilloDe(clavePublica(ed), falsa);
    expect(a[0]?.revocada).toBe(false);
  });

  it('subclave revocada (0x28 de la primaria) → firma_invalida', () => {
    const sub = nuevaClave('ed25519', T0);
    const a = anilloDe(clavePublica(rsa, { subclaves: [{ clave: sub, revocada: true }] }));
    expect(a.find((c) => c.huella === sub.huella)?.revocada).toBe(true);
    expect(a.find((c) => c.huella === rsa.huella)?.revocada).toBe(false);
    expect(verificar(firmar(sub, DATOS), { anillo: a })).toMatchObject({
      codigo: 'catalogo.firma_invalida',
    });
  });

  it('id de usuario revocado (0x30 posterior): su autofirma no cuenta', () => {
    const a = anilloDe(clavePublica(ed, { usuarioRevocado: true }));
    expect(a[0]?.firma).toBe(false);
    expect(verificar(firmar(ed, DATOS), { anillo: a })).toMatchObject({
      codigo: 'catalogo.clave_desconocida',
    });
  });

  it('autofirmas: falsificada no cuenta; SHA-1 solo si es antigua (antes de 2019-01-19)', () => {
    expect(anilloDe(clavePublica(ed, { autofirmaFalsa: true }))[0]?.firma).toBe(false);
    expect(anilloDe(clavePublica(rsa, { hashAutofirma: 2 }))[0]?.firma).toBe(false);
    const vieja = nuevaClave('rsa', 1_500_000_000);
    expect(anilloDe(clavePublica(vieja, { hashAutofirma: 2 }))[0]?.firma).toBe(true);
    expect(anilloDe(clavePublica(rsa, { hashAutofirma: 1 }))[0]?.firma).toBe(false);
  });

  it('subclave con vinculación 0x18 falsificada o sin retrofirma 0x19 válida: no firma', () => {
    const sub = nuevaClave('ed25519', T0);
    const casos: Parameters<typeof clavePublica>[1][] = [
      { subclaves: [{ clave: sub, vinculacionFalsa: true }] },
      { subclaves: [{ clave: sub, retrofirma: false }] },
      { subclaves: [{ clave: sub, retrofirma: 'falsa' }] },
    ];
    for (const o of casos) {
      const a = anilloDe(clavePublica(rsa, o));
      expect(a.find((c) => c.huella === sub.huella)?.firma).toBe(false);
      expect(verificar(firmar(sub, DATOS), { anillo: a })).toMatchObject({
        codigo: 'catalogo.clave_desconocida',
      });
    }
    // Una subclave agregada a una clave legítima con una vinculación falsificada.
    const legitima = clavePublica(rsa);
    const atacante = nuevaClave('rsa', T0);
    const ks = Buffer.concat([Buffer.from([0x99]), be16(sub.cuerpo.length), sub.cuerpo]);
    const kp = Buffer.concat([Buffer.from([0x99]), be16(rsa.cuerpo.length), rsa.cuerpo]);
    const agregada = Buffer.concat([
      legitima,
      paquete(14, sub.cuerpo),
      firmar({ ...atacante, huella: rsa.huella, id: rsa.id }, Buffer.alloc(0), {
        tipoFirma: 0x18,
        conHash: [
          subpaquete(27, Buffer.from([0x02])),
          subpaquete(
            32,
            cuerpoFirma(sub, Buffer.alloc(0), {
              tipoFirma: 0x19,
              prefijo: Buffer.concat([kp, ks]),
            }),
          ),
        ],
        prefijo: Buffer.concat([kp, ks]),
      }),
    ]);
    const a = anilloDe(agregada);
    expect(a.find((c) => c.huella === rsa.huella)?.firma).toBe(true);
    expect(a.find((c) => c.huella === sub.huella)?.firma).toBe(false);
    expect(verificar(firmar(sub, DATOS), { anillo: a })).toMatchObject({
      codigo: 'catalogo.clave_desconocida',
    });
  });

  it('subclave: firma si su vinculación lo dice; si no, clave_desconocida', () => {
    const sub = nuevaClave('ed25519', T0);
    const conFirma = anilloDe(
      clavePublica(rsa, { subclaves: [{ clave: sub, indicadores: 0x02 }] }),
    );
    expect(verificar(firmar(sub, DATOS), { anillo: conFirma })).toEqual({
      ok: true,
      huellaClave: sub.huella,
      huellaPrimaria: rsa.huella,
    });
    for (const indicadores of [0x0c, null]) {
      const sinFirma = anilloDe(clavePublica(rsa, { subclaves: [{ clave: sub, indicadores }] }));
      expect(verificar(firmar(sub, DATOS), { anillo: sinFirma })).toMatchObject({
        codigo: 'catalogo.clave_desconocida',
      });
    }
  });

  it('primaria con indicadores sin "firmar" → clave_desconocida', () => {
    const a = anilloDe(clavePublica(ed, { indicadores: 0x01 }));
    expect(verificar(firmar(ed, DATOS), { anillo: a })).toMatchObject({
      codigo: 'catalogo.clave_desconocida',
    });
  });
});

describe('entradas malformadas: código y nunca una excepción', () => {
  const buena = firmar(rsa, DATOS);
  const cuerpo = cuerpoFirma(rsa, DATOS);
  // Dónde empiezan los MPI: versión..área con hash, área sin hash y los 16 bits izquierdos.
  const conHash = cuerpo.readUInt16BE(4);
  const inicioMpi = 6 + conHash + 2 + cuerpo.readUInt16BE(6 + conHash) + 2;
  const antesMpi = cuerpo.subarray(0, inicioMpi);
  const valorMpi = cuerpo.subarray(inicioMpi + 2);

  const casos: [string, Buffer | string][] = [
    ['vacía', Buffer.alloc(0)],
    ['texto que no es armadura', 'hola'],
    ['armadura sin final', '-----BEGIN PGP SIGNATURE-----\n\nwsBc\n'],
    [
      'armadura con base64 roto',
      '-----BEGIN PGP SIGNATURE-----\n\nwsB*c\n-----END PGP SIGNATURE-----\n',
    ],
    ['truncada', buena.subarray(0, buena.length - 10)],
    ['solo la cabecera', buena.subarray(0, 2)],
    [
      'longitud de 5 bytes enorme',
      Buffer.concat([Buffer.from([0xc2, 0xff, 0xff, 0xff, 0xff, 0xff]), cuerpo]),
    ],
    [
      'longitud vieja de 4 bytes enorme',
      Buffer.concat([Buffer.from([0x8a, 0x7f, 0xff, 0xff, 0xff]), cuerpo]),
    ],
    ['bit 7 en 0', Buffer.concat([Buffer.from([0x42]), buena.subarray(1)])],
    ['etiqueta 0', Buffer.concat([Buffer.from([0xc0]), buena.subarray(1)])],
    ['bytes de más dentro del paquete', paquete(2, Buffer.concat([cuerpo, Buffer.from([0])]))],
    ['bytes de más después del paquete', Buffer.concat([buena, Buffer.from([0x01])])],
    [
      'MPI más largo que el paquete',
      paquete(2, Buffer.concat([antesMpi, be16(4096), Buffer.alloc(10, 1)])),
    ],
    [
      'MPI no canónico',
      paquete(2, Buffer.concat([antesMpi, be16(valorMpi.length * 8 + 1), valorMpi])),
    ],
    [
      'área con hash que se sale',
      paquete(2, Buffer.concat([cuerpo.subarray(0, 4), be16(60000), cuerpo.subarray(6)])),
    ],
    [
      'subpaquete truncado',
      paquete(2, Buffer.concat([Buffer.from([4, 0, 1, 8]), be16(3), Buffer.from([10, 2, 0])])),
    ],
    [
      'subpaquete de largo 0',
      paquete(
        2,
        Buffer.concat([
          Buffer.from([4, 0, 1, 8]),
          be16(1),
          Buffer.from([0]),
          be16(0),
          Buffer.alloc(2),
        ]),
      ),
    ],
    [
      'subpaquete de 5 bytes enorme',
      paquete(
        2,
        Buffer.concat([
          Buffer.from([4, 0, 1, 8]),
          be16(6),
          Buffer.from([255, 0xff, 0xff, 0xff, 0xff, 2]),
          be16(0),
          Buffer.alloc(2),
        ]),
      ),
    ],
    [
      'fecha de largo incorrecto',
      firmar(rsa, DATOS, { creacion: null, conHash: [subpaquete(2, Buffer.alloc(3))] }),
    ],
    ['dos fechas', firmar(rsa, DATOS, { conHash: [subpaquete(2, be32(T0 + 70))] })],
    [
      'huella de emisor corta',
      firmar(rsa, DATOS, { emisor: 'ninguno', conHash: [subpaquete(33, Buffer.from([4, 1, 2]))] }),
    ],
    ['MPI de 16 bits enorme', paquete(2, Buffer.concat([antesMpi, be16(65535)]))],
  ];

  for (const [nombre, entrada] of casos) {
    it(nombre, () => {
      const r = verificar(entrada);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(['catalogo.firma_invalida', 'catalogo.firma_no_soportada']).toContain(r.codigo);
      }
    });
  }

  it('longitud parcial e indeterminada → firma_no_soportada', () => {
    expect(verificar(Buffer.concat([Buffer.from([0xc2, 0xe0]), cuerpo]))).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    expect(verificar(Buffer.concat([Buffer.from([0x8b]), cuerpo]))).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
  });

  it('dos firmas u otro paquete en el archivo de firma → firma_no_soportada', () => {
    expect(verificar(Buffer.concat([buena, buena]))).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    expect(
      verificar(Buffer.concat([paquete(11, Buffer.from('b\0\0\0\0\0x')), buena])),
    ).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
    // Una clave pública en lugar de una firma.
    expect(verificar(paquete(6, rsa.cuerpo))).toMatchObject({
      codigo: 'catalogo.firma_no_soportada',
    });
  });

  it('un anillo con claves rotas o de algoritmo no soportado no rompe la lectura', () => {
    const dsa = Buffer.concat([
      Buffer.from([4]),
      be32(T0),
      Buffer.from([17]),
      mpi(Buffer.from([1, 2, 3])),
    ]);
    const a = anilloDe(
      paquete(6, dsa),
      paquete(13, Buffer.from('dsa')),
      paquete(6, Buffer.from([4, 0, 0])),
      paquete(12, Buffer.from([0])),
      clavePublica(ed),
    );
    expect(a.map((c) => c.huella)).toEqual([ed.huella]);
  });

  it('desarmar exige el final y el tipo correctos', () => {
    expect(() =>
      desarmar('-----BEGIN PGP SIGNATURE-----\n\nAAAA\n-----END PGP MESSAGE-----\n'),
    ).toThrow();
    expect(() => desarmar('nada')).toThrow(
      expect.objectContaining({ codigo: 'catalogo.firma_invalida' }),
    );
  });
});

describe('fuzz: bytes mutados nunca dan "válida"', () => {
  /**
   * Inicio y fin del área sin hash de una firma binaria (cabecera nueva o vieja): esa área no la
   * cubre la firma (RFC 9580 §5.2.3.7). Una mutación ahí puede seguir siendo válida (p. ej.
   * cambiar el tipo del subpaquete de id de emisor), pero nunca cambia qué clave firmó.
   */
  function areaSinHash(f: Buffer): [number, number] {
    const ctb = f[0]!;
    const off = ctb & 0x40 ? (f[1]! < 192 ? 2 : f[1]! < 224 ? 3 : 6) : 1 + [1, 2, 4][ctb & 0x03]!;
    const conHash = f.readUInt16BE(off + 4);
    const desde = off + 6 + conHash;
    return [desde, desde + 2 + f.readUInt16BE(desde)];
  }

  for (const [nombre, firma, datos, a] of [
    [
      'Node Ed25519',
      fx('node-24.22.3-SHASUMS256.txt.sig'),
      fx('node-24.22.3-SHASUMS256.txt'),
      'node',
    ],
    ['Node RSA', fx('node-20.20.2-SHASUMS256.txt.sig'), fx('node-20.20.2-SHASUMS256.txt'), 'node'],
  ] as const) {
    it(`${nombre}: 250 mutaciones con semilla fija`, () => {
      const rnd = azar(nombre.length * 7919);
      const original = verificarFirmaSeparada({ datos, firma, anillo: anillo(a), ahora: AHORA });
      expect(original.ok).toBe(true);
      const [desde, hasta] = areaSinHash(firma);
      for (let i = 0; i < 250; i++) {
        const m = Buffer.from(firma);
        const tipo = Math.floor(rnd() * 4);
        let tocadas: number[] = [];
        let mutada: Buffer = m;
        if (tipo === 0) {
          const p = Math.floor(rnd() * m.length);
          m[p] = m[p]! ^ (1 + Math.floor(rnd() * 255));
          tocadas = [p];
        } else if (tipo === 1) {
          const n = 1 + Math.floor(rnd() * 4);
          for (let k = 0; k < n; k++) {
            const p = Math.floor(rnd() * m.length);
            m[p] = Math.floor(rnd() * 256);
            tocadas.push(p);
          }
        } else if (tipo === 2) {
          mutada = m.subarray(0, Math.floor(rnd() * m.length));
          tocadas = [-1];
        } else {
          const p = Math.floor(rnd() * m.length);
          mutada = Buffer.concat([
            m.subarray(0, p),
            Buffer.from([Math.floor(rnd() * 256)]),
            m.subarray(p),
          ]);
          tocadas = [-1];
        }
        let r;
        expect(() => {
          r = verificarFirmaSeparada({ datos, firma: mutada, anillo: anillo(a), ahora: AHORA });
        }).not.toThrow();
        const res = r as unknown as ReturnType<typeof verificarFirmaSeparada>;
        const igual = Buffer.compare(mutada, firma) === 0;
        const soloSinHash = tocadas.every((p) => p >= desde && p < hasta);
        if (res.ok) {
          expect(igual || soloSinHash, `mutación ${i} dio válida`).toBe(true);
          expect(res.huellaClave).toBe((original as { huellaClave: string }).huellaClave);
        } else {
          expect([
            'catalogo.firma_invalida',
            'catalogo.firma_no_soportada',
            'catalogo.clave_desconocida',
            'catalogo.firma_vencida',
          ]).toContain(res.codigo);
        }
        // Los mismos datos con la firma mutada y los datos mutados con la original: nunca a la vez.
      }
    });
  }
});

describe('fuzz: anillos mutados nunca lanzan sin control', () => {
  const texto = readFileSync(
    path.join(AQUI, '..', 'src', 'catalogo', 'claves', 'composer.asc'),
    'latin1',
  );
  const binario = Buffer.from(desarmar(texto));
  const controlado = (f: () => unknown): void => {
    try {
      const r = f();
      expect(Array.isArray(r)).toBe(true);
    } catch (e) {
      expect(e).toMatchObject({
        codigo: expect.stringMatching(/^catalogo\.firma_(invalida|no_soportada)$/),
      });
    }
  };

  it('composer.asc: 100 mutaciones de la armadura y 100 del binario', () => {
    const rnd = azar(4242);
    const alfabeto = 'ABCabc019+/=-\n \r:';
    for (let i = 0; i < 100; i++) {
      const c = texto.split('');
      for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) {
        c[Math.floor(rnd() * c.length)] = alfabeto[Math.floor(rnd() * alfabeto.length)]!;
      }
      controlado(() => leerAnillo(c.join('')));
    }
    for (let i = 0; i < 100; i++) {
      const m = Buffer.from(binario);
      const tipo = Math.floor(rnd() * 3);
      let mutada: Buffer = m;
      if (tipo === 0) {
        for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) {
          const p = Math.floor(rnd() * m.length);
          m[p] = Math.floor(rnd() * 256);
        }
      } else if (tipo === 1) {
        mutada = m.subarray(0, Math.floor(rnd() * m.length));
      } else {
        const p = Math.floor(rnd() * m.length);
        mutada = Buffer.concat([
          m.subarray(0, p),
          Buffer.from([Math.floor(rnd() * 256)]),
          m.subarray(p),
        ]);
      }
      controlado(() => leerAnillo(mutada));
    }
  });
});

describe('fuenteFirmaDe', () => {
  it('Node y Nginx siempre; Composer desde 2.0.3', () => {
    expect(fuenteFirmaDe({ servicio: 'node', version: '24.22.3' })).toBe('node');
    expect(fuenteFirmaDe({ servicio: 'nginx', version: '1.30.6' })).toBe('nginx');
    expect(fuenteFirmaDe({ servicio: 'composer', version: '2.11.2' })).toBe('composer');
    expect(fuenteFirmaDe({ servicio: 'composer', version: '3.0.0' })).toBe('composer');
    expect(fuenteFirmaDe({ servicio: 'composer', version: '2.0.14' })).toBe('composer');
    expect(fuenteFirmaDe({ servicio: 'composer', version: '2.0.3' })).toBe('composer');
    expect(fuenteFirmaDe({ servicio: 'composer', version: '2.0.2' })).toBeNull();
    expect(fuenteFirmaDe({ servicio: 'composer', version: '1.10.28' })).toBeNull();
    expect(fuenteFirmaDe({ servicio: 'php', version: '8.4.1' })).toBeNull();
  });
});
