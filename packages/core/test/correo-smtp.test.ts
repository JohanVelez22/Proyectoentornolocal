import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { GestorSmtp, INTERVALO_PRUEBA_MS, MAX_PRUEBAS_POR_HORA } from '../src/correo/gestorSmtp';
import { destinatarioValido, probarEnvio } from '../src/correo/probarEnvio';
import {
  bloqueEnvSmtp,
  esDireccionNoPublica,
  hostDePreset,
  hostEsLocal,
  hostSmtpValido,
  PRESETS_SMTP,
  ProveedorSmtpSchema,
  type ProveedorSmtp,
} from '../src/correo/proveedores';
import { emitirCertificado, generarCA, type ParCertificado } from '../src/https/ca';
import { ConfigSchema, type Config } from '../src/tipos';
import { ServidorSmtpFalso } from './servidorSmtpFalso';

/** Clave de prueba: nunca debe salir de un error, un resultado, la config ni un log. */
const CENTINELA = 'centinela-secreta-d';
const USUARIO = 'usuario-prueba';

let ca: ParCertificado;
let certIp: ParCertificado;
let certNombre: ParCertificado;
let certOtroNombre: ParCertificado;

beforeAll(() => {
  ca = generarCA();
  certIp = emitirCertificado(ca, ['127.0.0.1']);
  certNombre = emitirCertificado(ca, ['smtp.prueba.test']);
  certOtroNombre = emitirCertificado(ca, ['otro.prueba.test']);
}, 60_000);

const abiertos: ServidorSmtpFalso[] = [];
afterEach(async () => {
  await Promise.all(abiertos.splice(0).map((s) => s.cerrar()));
});

async function servidor(o: ConstructorParameters<typeof ServidorSmtpFalso>[0]) {
  const s = new ServidorSmtpFalso({ usuario: USUARIO, clave: CENTINELA, ...o });
  await s.iniciar();
  abiertos.push(s);
  return s;
}

const proveedor = (p: Partial<ProveedorSmtp> & { puerto: number }): ProveedorSmtp => ({
  id: 'prueba',
  nombre: 'Prueba',
  host: '127.0.0.1',
  seguridad: 'starttls',
  usuario: USUARIO,
  redLocal: true,
  ...p,
});

describe('presets', () => {
  it('cada preset tiene host de documentación oficial, puerto y fuente https', () => {
    const ids = PRESETS_SMTP.map((p) => p.id);
    expect(ids).toEqual([
      'mailtrap',
      'resend',
      'brevo',
      'mailgun',
      'sendgrid',
      'postmark',
      'ses',
      'smtp2go',
      'gmail',
    ]);
    for (const p of PRESETS_SMTP) {
      expect(p.fuente).toMatch(/^https:\/\//);
      expect([465, 587]).toContain(p.puerto);
      expect(p.seguridad).toBe(p.puerto === 465 ? 'tls' : 'starttls');
      // Ningún preset apunta a una red local ni a una IP.
      expect(hostEsLocal(hostDePreset(p, p.regiones?.[0]) ?? 'x')).toBe(false);
    }
  });

  it('Amazon SES exige una región conocida', () => {
    const ses = PRESETS_SMTP.find((p) => p.id === 'ses')!;
    expect(hostDePreset(ses)).toBeNull();
    expect(hostDePreset(ses, 'evil.com/')).toBeNull();
    expect(hostDePreset(ses, 'eu-west-1')).toBe('email-smtp.eu-west-1.amazonaws.com');
  });
});

describe('validación del host', () => {
  it('acepta nombres e IP y rechaza esquemas, rutas, puertos y credenciales', () => {
    expect(hostSmtpValido('smtp.resend.com')).toBe(true);
    expect(hostSmtpValido('203.0.113.7')).toBe(true);
    for (const malo of [
      'smtp://x.com',
      'x.com/ruta',
      'x.com:25',
      'user@x.com',
      '',
      ' x.com',
      '-x.com',
      'a..b',
      'x.com\r\nRCPT',
    ]) {
      expect(hostSmtpValido(malo), malo).toBe(false);
    }
  });

  it('reconoce la red local y el propio equipo, incluidas IPv4 mapeadas en IPv6', () => {
    for (const ip of [
      '127.0.0.1',
      '10.1.2.3',
      '192.168.0.9',
      '172.16.5.5',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fe80::1',
      'fd00::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
    ]) {
      expect(esDireccionNoPublica(ip), ip).toBe(true);
    }
    for (const ip of ['8.8.8.8', '203.0.113.7', '2606:4700::1111']) {
      expect(esDireccionNoPublica(ip), ip).toBe(false);
    }
    for (const h of ['localhost', 'servidor', 'impresora.local', 'x.internal', '192.168.1.1']) {
      expect(hostEsLocal(h), h).toBe(true);
    }
    expect(hostEsLocal('smtp.gmail.com')).toBe(false);
  });

  it('el destinatario es una sola dirección', () => {
    expect(destinatarioValido('yo@ejemplo.com')).toBe(true);
    for (const malo of [
      'a@b.com,c@d.com',
      'a@b.com\r\nBcc: x@y.com',
      '<a@b.com>',
      'sin-arroba',
      'a b@c.com',
      'a@b',
    ]) {
      expect(destinatarioValido(malo), malo).toBe(false);
    }
  });
});

describe('probarEnvio con un servidor falso en 127.0.0.1', () => {
  it('envía con STARTTLS y TLS verificado', async () => {
    const s = await servidor({ starttls: { cert: certIp.certPem, key: certIp.keyPem } });
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      ca: ca.certPem,
      plazoMs: 8000,
    });
    expect(r.ok).toBe(true);
    expect(s.mensajes).toHaveLength(1);
    expect(s.mensajes[0]!.para).toBe('yo@ejemplo.com');
    // Las credenciales solo viajaron por la conexión ya cifrada.
    expect(s.authEnTextoPlano).toBe(false);
  });

  it('envía con TLS desde el primer byte', async () => {
    const s = await servidor({ implicito: { cert: certIp.certPem, key: certIp.keyPem } });
    const r = await probarEnvio(
      proveedor({ puerto: s.puerto, seguridad: 'tls' }),
      CENTINELA,
      'yo@ejemplo.com',
      { ca: ca.certPem, plazoMs: 8000 },
    );
    expect(r.ok).toBe(true);
    expect(s.mensajes).toHaveLength(1);
  });

  it('verifica el certificado contra el nombre del host (resuelto una sola vez)', async () => {
    const s = await servidor({ starttls: { cert: certNombre.certPem, key: certNombre.keyPem } });
    const r = await probarEnvio(
      proveedor({ puerto: s.puerto, host: 'smtp.prueba.test' }),
      CENTINELA,
      'yo@ejemplo.com',
      { ca: ca.certPem, plazoMs: 8000, resolver: async () => ['127.0.0.1'] },
    );
    expect(r.ok).toBe(true);
  });

  it('un certificado de otro nombre → correo.tls y no se envía nada', async () => {
    const s = await servidor({
      starttls: { cert: certOtroNombre.certPem, key: certOtroNombre.keyPem },
    });
    const r = await probarEnvio(
      proveedor({ puerto: s.puerto, host: 'smtp.prueba.test' }),
      CENTINELA,
      'yo@ejemplo.com',
      { ca: ca.certPem, plazoMs: 8000, resolver: async () => ['127.0.0.1'] },
    );
    expect(r).toEqual({ ok: false, codigo: 'correo.tls' });
    expect(s.mensajes).toHaveLength(0);
  });

  it('un certificado de una CA desconocida → correo.tls (no se desactiva la verificación)', async () => {
    const s = await servidor({ starttls: { cert: certIp.certPem, key: certIp.keyPem } });
    // Sin pasar la CA de la prueba: el certificado no es de confianza.
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      plazoMs: 8000,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.tls' });
    expect(s.mensajes).toHaveLength(0);
    expect(s.authEnTextoPlano).toBe(false);
  });

  it('un servidor sin STARTTLS no degrada a texto plano: correo.tls y sin credenciales enviadas', async () => {
    const s = await servidor({});
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      plazoMs: 8000,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.tls' });
    expect(s.authEnTextoPlano).toBe(false);
    expect(s.mensajes).toHaveLength(0);
  });

  it('credenciales malas → correo.auth sin la clave en el resultado', async () => {
    const s = await servidor({
      starttls: { cert: certIp.certPem, key: certIp.keyPem },
      clave: 'otra-clave-distinta',
    });
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      ca: ca.certPem,
      plazoMs: 8000,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.auth' });
    expect(JSON.stringify(r)).not.toContain(CENTINELA);
  });

  it('destinatario rechazado por el servidor → correo.rechazado', async () => {
    const s = await servidor({
      starttls: { cert: certIp.certPem, key: certIp.keyPem },
      rechazaDestinatario: true,
    });
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      ca: ca.certPem,
      plazoMs: 8000,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.rechazado' });
  });

  it('un servidor que no responde → correo.plazo dentro del plazo', async () => {
    const s = await servidor({ mudo: true });
    const t0 = Date.now();
    const r = await probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'yo@ejemplo.com', {
      plazoMs: 1200,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.plazo' });
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  it('un puerto cerrado → correo.conexion', async () => {
    const s = await servidor({});
    const puerto = s.puerto;
    await s.cerrar();
    abiertos.pop();
    const r = await probarEnvio(proveedor({ puerto }), CENTINELA, 'yo@ejemplo.com', {
      plazoMs: 5000,
    });
    expect(r).toEqual({ ok: false, codigo: 'correo.conexion' });
  });

  it('un host de la red local sin la confirmación del usuario nunca se contacta', async () => {
    const s = await servidor({ starttls: { cert: certIp.certPem, key: certIp.keyPem } });
    const sinConfirmar = proveedor({ puerto: s.puerto });
    delete sinConfirmar.redLocal;
    await expect(
      probarEnvio(sinConfirmar, CENTINELA, 'yo@ejemplo.com', { ca: ca.certPem }),
    ).rejects.toMatchObject({ codigo: 'correo.host_local' });
    // Un nombre público que se resuelve a la red local (DNS rebinding) tampoco.
    const nombre = proveedor({ puerto: s.puerto, host: 'smtp.prueba.test' });
    delete nombre.redLocal;
    await expect(
      probarEnvio(nombre, CENTINELA, 'yo@ejemplo.com', {
        ca: ca.certPem,
        resolver: async () => ['93.184.216.34', '10.0.0.5'],
      }),
    ).rejects.toMatchObject({ codigo: 'correo.host_local' });
    expect(s.conexiones).toBe(0);
  });

  it('rechaza un host mal formado y un destinatario con saltos de línea sin conectar', async () => {
    const s = await servidor({});
    await expect(
      probarEnvio(proveedor({ puerto: s.puerto, host: 'x.com\r\nEHLO' }), CENTINELA, 'a@b.com'),
    ).rejects.toMatchObject({ codigo: 'correo.host_invalido' });
    await expect(
      probarEnvio(proveedor({ puerto: s.puerto }), CENTINELA, 'a@b.com\r\nBcc: z@y.com'),
    ).rejects.toMatchObject({ codigo: 'correo.destinatario_invalido' });
    expect(s.conexiones).toBe(0);
  });
});

describe('GestorSmtp', () => {
  let carpeta: string;
  beforeAll(async () => {
    carpeta = await mkdtemp(path.join(tmpdir(), 'wolf-smtp-'));
  });
  afterAll(async () => rm(carpeta, { recursive: true, force: true }));

  function crear(opciones: { ahora?: () => number; enviar?: GestorSmtpEnviar } = {}) {
    const config = ConfigSchema.parse({}) as Config;
    config.sitios = [
      { id: 'miapp', correo: { modo: 'smtp', proveedor: 'prueba' } },
      { id: 'otra' },
    ] as unknown as Config['sitios'];
    const gestor = new GestorSmtp({
      leerConfig: async () => config,
      modificarConfig: async (fn) => fn(config),
      ...(opciones.ahora ? { ahora: opciones.ahora } : {}),
      ...(opciones.enviar ? { enviar: opciones.enviar } : {}),
    });
    return { config, gestor };
  }
  type GestorSmtpEnviar = NonNullable<ConstructorParameters<typeof GestorSmtp>[0]['enviar']>;

  const datos = (extra: Record<string, unknown> = {}) => ({
    id: 'prueba',
    nombre: 'Prueba',
    host: 'smtp.resend.com',
    puerto: 465,
    seguridad: 'tls',
    usuario: 'resend',
    ...extra,
  });

  it('la clave nunca aparece en config.json (centinela)', async () => {
    const { config, gestor } = crear();
    // Aunque alguien intente colar la clave en los datos, el esquema no la conserva.
    await gestor.guardar(datos({ clave: CENTINELA, password: CENTINELA }));
    expect(JSON.stringify(config)).not.toContain(CENTINELA);
    expect(Object.keys(config.correo.proveedores[0]!).sort()).toEqual(
      ['host', 'id', 'nombre', 'puerto', 'seguridad', 'usuario'].sort(),
    );
    // Y ningún archivo del equipo la recibió.
    expect(await readdir(carpeta)).toEqual([]);
  });

  it('un host local exige confirmación y queda marcado; el dato que llega no puede marcarlo', async () => {
    const { gestor } = crear();
    await expect(gestor.guardar(datos({ host: '192.168.1.20' }))).rejects.toMatchObject({
      codigo: 'correo.host_local',
    });
    await expect(
      gestor.guardar(datos({ host: 'localhost', redLocal: true })),
    ).rejects.toMatchObject({ codigo: 'correo.host_local' });
    const lista = await gestor.guardar(datos({ host: '192.168.1.20' }), {
      confirmarRedLocal: true,
    });
    expect(lista[0]!.redLocal).toBe(true);
    const publica = await gestor.guardar(datos({ redLocal: true }));
    expect(publica[0]!.redLocal).toBeUndefined();
  });

  it('rechaza datos inválidos', async () => {
    const { gestor } = crear();
    for (const malo of [
      datos({ host: 'smtp://x.com' }),
      datos({ puerto: 0 }),
      datos({ puerto: 70000 }),
      datos({ seguridad: 'ninguna' }),
      datos({ id: '../x' }),
      datos({ usuario: '' }),
      datos({ usuario: 'a\nb' }),
    ]) {
      await expect(gestor.guardar(malo)).rejects.toMatchObject({
        codigo: expect.stringMatching(/^correo\.(proveedor_invalido|host_local)$/),
      });
    }
  });

  it('cambiar host con clave guardada exige confirmar', async () => {
    const { gestor } = crear();
    await gestor.guardar(datos());
    await expect(
      gestor.guardar(datos({ host: 'smtp.otro.com' }), { tieneClave: true }),
    ).rejects.toMatchObject({ codigo: 'correo.cambia_con_clave' });
    await gestor.guardar(datos({ host: 'smtp.otro.com' }), {
      tieneClave: true,
      confirmarCambio: true,
    });
  });

  it('borrar un proveedor desvincula los proyectos que lo usaban', async () => {
    const { config, gestor } = crear();
    await gestor.guardar(datos());
    await gestor.borrar('prueba');
    expect(config.correo.proveedores).toEqual([]);
    expect(config.sitios.find((s) => s.id === 'miapp')!.correo).toBeUndefined();
    await expect(gestor.borrar('prueba')).rejects.toMatchObject({
      codigo: 'correo.proveedor_no_existe',
    });
  });

  it('una prueba cada 15 s por proveedor, una a la vez y 10 por hora', async () => {
    let reloj = 1_000_000;
    let liberar: (() => void) | undefined;
    const llamadas: string[] = [];
    const enviar: GestorSmtpEnviar = async (_p, _c, para) => {
      llamadas.push(para);
      if (liberar === undefined && llamadas.length === 1) {
        await new Promise<void>((r) => (liberar = r));
      }
      return { ok: true, idMensaje: '<id>' };
    };
    const { gestor } = crear({ ahora: () => reloj, enviar });
    await gestor.guardar(datos());
    const primera = gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com');
    await new Promise((r) => setTimeout(r, 10));
    await expect(gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com')).rejects.toMatchObject({
      codigo: 'correo.ocupado',
    });
    liberar!();
    await primera;
    reloj += INTERVALO_PRUEBA_MS - 1000;
    await expect(gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com')).rejects.toMatchObject({
      codigo: 'correo.limite',
      datos: { segundos: 1 },
    });
    expect(llamadas).toHaveLength(1);
    for (let i = 0; i < MAX_PRUEBAS_POR_HORA - 1; i++) {
      reloj += INTERVALO_PRUEBA_MS;
      await gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com');
    }
    reloj += INTERVALO_PRUEBA_MS;
    await expect(gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com')).rejects.toMatchObject({
      codigo: 'correo.limite',
    });
    expect(llamadas).toHaveLength(MAX_PRUEBAS_POR_HORA);
    reloj += 3_600_000;
    await gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com');
  });

  it('probar de punta a punta con el servidor falso deja un solo correo', async () => {
    const s = await servidor({ starttls: { cert: certIp.certPem, key: certIp.keyPem } });
    const config = ConfigSchema.parse({}) as Config;
    const gestor = new GestorSmtp({
      leerConfig: async () => config,
      modificarConfig: async (fn) => fn(config),
      opcionesEnvio: { ca: ca.certPem, plazoMs: 8000 },
    });
    await gestor.guardar(
      datos({ host: '127.0.0.1', puerto: s.puerto, seguridad: 'starttls', usuario: USUARIO }),
      { confirmarRedLocal: true },
    );
    const r = await gestor.probar('prueba', CENTINELA, 'yo@ejemplo.com');
    expect(r.ok).toBe(true);
    expect(s.mensajes).toHaveLength(1);
    expect(JSON.stringify(config)).not.toContain(CENTINELA);
  });
});

describe('bloque .env', () => {
  const p = ProveedorSmtpSchema.parse({
    id: 'resend',
    nombre: 'Resend',
    host: 'smtp.resend.com',
    puerto: 465,
    seguridad: 'tls',
    usuario: 'resend',
  });

  it('sin confirmación no lleva MAIL_PASSWORD', () => {
    const b = bloqueEnvSmtp(p, null);
    expect(b).toEqual({
      MAIL_MAILER: 'smtp',
      MAIL_HOST: 'smtp.resend.com',
      MAIL_PORT: '465',
      MAIL_USERNAME: 'resend',
      MAIL_ENCRYPTION: 'ssl',
    });
    expect('MAIL_PASSWORD' in b).toBe(false);
  });

  it('con la clave confirmada la incluye y STARTTLS es "tls"', () => {
    const b = bloqueEnvSmtp({ ...p, puerto: 587, seguridad: 'starttls' }, CENTINELA);
    expect(b['MAIL_PASSWORD']).toBe(CENTINELA);
    expect(b['MAIL_ENCRYPTION']).toBe('tls');
  });
});

describe('.env del proyecto con el bloque SMTP', () => {
  it('la vista previa enmascara la clave y escribir la deja solo con la confirmación', async () => {
    const { GestorEnv } = await import('../src/proyectos/env/gestor');
    const carpeta = await mkdtemp(path.join(tmpdir(), 'wolf-smtp-env-'));
    const respaldos = await mkdtemp(path.join(tmpdir(), 'wolf-smtp-resp-'));
    try {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path.join(carpeta, '.env'), 'APP_NAME=Mi\nMAIL_HOST=127.0.0.1\n');
      await writeFile(path.join(carpeta, '.gitignore'), '.env\n');
      const sitio = { id: 'miapp', carpeta, tipo: 'laravel' } as never;
      const g = new GestorEnv({
        sitio: async () => sitio,
        carpetaRespaldos: () => respaldos,
        versionado: async () => false,
        puertos: async () => ({ correo: 1025, redis: 6379 }),
      });
      const p = ProveedorSmtpSchema.parse({
        id: 'resend',
        nombre: 'Resend',
        host: 'smtp.resend.com',
        puerto: 465,
        seguridad: 'tls',
        usuario: 'resend',
      });
      const vista = await g.vistaPrevia('miapp', { cambios: bloqueEnvSmtp(p, CENTINELA) });
      expect(vista.diff).not.toContain(CENTINELA);
      expect(vista.diff).toContain('MAIL_PASSWORD');
      expect(vista.diff).toContain('smtp.resend.com');
      const sin = await g.vistaPrevia('miapp', { cambios: bloqueEnvSmtp(p, null) });
      expect(sin.diff).not.toContain('MAIL_PASSWORD');
      await g.guardar('miapp', { cambios: bloqueEnvSmtp(p, null) }, true);
      expect(await readFile(path.join(carpeta, '.env'), 'utf8')).not.toContain(CENTINELA);
      await g.guardar('miapp', { cambios: bloqueEnvSmtp(p, CENTINELA) }, true);
      const texto = await readFile(path.join(carpeta, '.env'), 'utf8');
      expect(texto).toContain(`MAIL_PASSWORD=${CENTINELA}`);
      expect(texto).toContain('MAIL_HOST=smtp.resend.com');
    } finally {
      await rm(carpeta, { recursive: true, force: true });
      await rm(respaldos, { recursive: true, force: true });
    }
  });
});
