import { existsSync } from 'node:fs';
import { chmod, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import type { EntradaAviso } from '../src/avisos/avisos';
import { Doctor, type DepsDoctor, type Hallazgo } from '../src/doctor/doctor';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { MARCA_FIN, MARCA_INICIO } from '../src/hosts/bloque';
import { GestorHosts } from '../src/hosts/hosts';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { EstadoServicio } from '../src/tipos';

let dir: string;
let datos: string;
let respaldos: string;
let rutaHosts: string;
let plat: PlataformaFalsa;
let estados: EstadoServicio[];
let dominios: string[];
let vencimientos: { id: string; dias: number; nombre?: string }[];
let cambios: [string, number][];
let regeneraciones: string[];
let reintentos: string[];
let avisos: EntradaAviso[];
let puertoHttps: number;

const servicio = (o: Partial<EstadoServicio> & { id: string }): EstadoServicio => ({
  nombre: o.id,
  version: '1.0',
  estado: 'apagado',
  puertos: [],
  pid: null,
  ...o,
});

const sano = `127.0.0.1  localhost\r\n${MARCA_INICIO}\r\n127.0.0.1  a.test\r\n::1  a.test\r\n${MARCA_FIN}\r\n`;

function deps(extra: Partial<DepsDoctor> = {}): DepsDoctor {
  return {
    plataforma: plat,
    carpetaDatos: datos,
    carpetaRespaldos: respaldos,
    servicios: async () => estados,
    puertoHttps: async () => puertoHttps,
    puertosPropios: async () => [],
    probarPuerto: async () => true,
    cambiarPuerto: async (s, p) => {
      cambios.push([s, p]);
    },
    puertoCambiable: (s) => s === 'nginx' || s === 'https' || s === 'mysql',
    dominios: async () => dominios,
    hosts: new GestorHosts(plat, new Eventos<EventosNucleo>()),
    https: {
      vencimientos: async () => vencimientos,
      regenerarCertificados: async () => {
        regeneraciones.push('certificados');
        return { ok: true };
      },
      regenerarCA: async () => {
        regeneraciones.push('ca');
        return { ok: true };
      },
    },
    reintentarServicio: async (id) => {
      reintentos.push(id);
    },
    avisos: { publicar: (a) => avisos.push(a) },
    ...extra,
  };
}

const solo = async (d: Doctor, id: Parameters<Doctor['revisar']>[0]): Promise<Hallazgo[]> =>
  d.revisar(id);

beforeEach(async () => {
  dir = await carpetaTemporal('pel-doctor-');
  datos = join(dir, 'WolfCoreDev');
  respaldos = join(datos, 'etc', 'respaldos');
  rutaHosts = join(dir, 'hosts');
  await mkdir(datos, { recursive: true });
  await writeFile(rutaHosts, sano);
  plat = new PlataformaFalsa({ carpetaDatos: datos, rutaHosts });
  estados = [
    servicio({ id: 'nginx', estado: 'encendido', puertos: [80], pid: 100 }),
    servicio({ id: 'mysql', puertos: [3306] }),
    servicio({ id: 'redis', version: null, puertos: [6379] }),
  ];
  dominios = ['a.test'];
  vencimientos = [];
  cambios = [];
  regeneraciones = [];
  reintentos = [];
  avisos = [];
  puertoHttps = 443;
});

describe('Doctor: puertos', () => {
  it('sano: libres o del propio WolfCore Dev (y sus hijos) no dan hallazgos', async () => {
    plat.puertos.set(80, { pid: 100, nombre: 'nginx.exe' });
    plat.puertos.set(443, { pid: 101, nombre: 'nginx.exe' });
    plat.hijos.set(100, [101]);
    expect(await solo(new Doctor(deps()), ['puertos'])).toEqual([]);
  });

  it('un servicio no instalado no cuenta aunque su puerto esté ocupado', async () => {
    plat.puertos.set(6379, { pid: 5000, nombre: 'redis-server.exe' });
    expect(await solo(new Doctor(deps()), ['puertos'])).toEqual([]);
  });

  it('IIS (http.sys + W3SVC): detener W3SVC con elevación y confirmación', async () => {
    plat.puertos.set(80, { pid: 4, nombre: 'System' });
    plat.servicios.set('W3SVC', 'corriendo');
    const d = new Doctor(deps());
    const [h] = await solo(d, ['puertos']);
    expect(h).toMatchObject({
      revision: 'puertos',
      gravedad: 'error',
      codigo: 'doctor.puerto_iis',
      datos: { puerto: 80, servicio: 'nginx' },
      reparacion: { id: 'detener-w3svc', requiereAdmin: true, soloInforma: false },
    });
    expect(h!.reparacion!.comandoManual).toContain('detener-servicio');
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(plat.serviciosDetenidos).toEqual(['W3SVC']);
  });

  it('http.sys sin IIS: se propone cambiar el puerto propio', async () => {
    plat.puertos.set(80, { pid: 4, nombre: 'System' });
    const [h] = await solo(new Doctor(deps()), ['puertos']);
    expect(h).toMatchObject({
      codigo: 'doctor.puerto_http_sys',
      reparacion: { id: 'cambiar-puerto', requiereAdmin: false },
      datos: { alternativo: 8080 },
    });
  });

  it('FlyEnv: se reconoce por la ruta del ejecutable y NUNCA recibe acción', async () => {
    plat.puertos.set(80, { pid: 7000, nombre: 'nginx.exe' });
    plat.procesos.set(7000, 'C:\\Program Files\\FlyEnv\\resources\\nginx\\nginx.exe');
    plat.servicios.set('W3SVC', 'corriendo');
    const d = new Doctor(deps());
    const [h] = await solo(d, ['puertos']);
    expect(h).toMatchObject({
      codigo: 'doctor.puerto_flyenv',
      reparacion: { id: 'cambiar-puerto' },
      datos: { programa: 'FlyEnv' },
    });
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(cambios).toEqual([['nginx', 8080]]);
    expect(plat.matados).toEqual([]);
    expect(plat.serviciosDetenidos).toEqual([]);
    expect(plat.procesos.has(7000)).toBe(true);
  });

  it('XAMPP y Skype por nombre o ruta; otro programa genérico', async () => {
    plat.puertos.set(3306, { pid: 7100, nombre: 'mysqld.exe' });
    plat.procesos.set(7100, 'C:\\xampp\\mysql\\bin\\mysqld.exe');
    plat.puertos.set(443, { pid: 7200, nombre: 'Skype.exe' });
    plat.puertos.set(80, { pid: 7300, nombre: 'otro.exe' });
    const hs = await solo(new Doctor(deps()), ['puertos']);
    const por = (p: number) => hs.find((h) => h.datos['puerto'] === p);
    expect(por(3306)).toMatchObject({
      codigo: 'doctor.puerto_xampp',
      datos: { alternativo: 3307 },
    });
    expect(por(443)).toMatchObject({ codigo: 'doctor.puerto_skype', datos: { servicio: 'https' } });
    expect(por(80)).toMatchObject({
      codigo: 'doctor.puerto_ocupado',
      datos: { proceso: 'otro.exe' },
    });
  });

  it('el puerto alternativo evita los reservados, los de otros servicios y los ocupados', async () => {
    plat.puertos.set(80, { pid: 7300, nombre: 'otro.exe' });
    plat.rangos = [{ desde: 8080, hasta: 8081 }];
    const d = new Doctor(
      deps({ puertosPropios: async () => [8082], probarPuerto: async (p) => p !== 8083 }),
    );
    const [h] = await solo(d, ['puertos']);
    expect(h!.datos['alternativo']).toBe(8084);
  });

  it('un servicio cuyo puerto no se puede cambiar solo informa', async () => {
    estados.push(servicio({ id: 'php-8.3', puertos: [9000] }));
    plat.puertos.set(9000, { pid: 7300, nombre: 'otro.exe' });
    const d = new Doctor(deps());
    const [h] = await solo(d, ['puertos']);
    expect(h!.reparacion).toMatchObject({ soloInforma: true });
    expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'doctor.solo_informa' });
  });
});

describe('Doctor: ronda de arreglos (IIS, ya resuelto, sin repetir)', () => {
  it('IIS ofrece también cambiar el puerto propio como alternativa', async () => {
    plat.puertos.set(80, { pid: 4, nombre: 'System' });
    plat.servicios.set('W3SVC', 'corriendo');
    const d = new Doctor(deps());
    const [h] = await solo(d, ['puertos']);
    expect(h!.alternativa).toMatchObject({ id: 'cambiar-puerto', requiereAdmin: false });
    expect(h!.datos['alternativo']).toBe(8080);
    expect(await d.reparar(h!.id, true, 'cambiar-puerto')).toEqual({ ok: true });
    expect(cambios).toEqual([['nginx', 8080]]);
    expect(plat.serviciosDetenidos).toEqual([]);
    expect(await d.reparar(h!.id, true, 'otra-cosa')).toEqual({
      ok: false,
      codigo: 'doctor.solo_informa',
    });
  });

  it('si el puerto ya quedó libre antes de reparar: "ya resuelto" y no se actúa', async () => {
    plat.puertos.set(80, { pid: 4, nombre: 'System' });
    plat.servicios.set('W3SVC', 'corriendo');
    plat.puertos.set(3306, { pid: 7100, nombre: 'mysqld.exe' });
    const d = new Doctor(deps());
    const otro = new Doctor(deps());
    const [iis] = await solo(d, ['puertos']);
    const mysql = (await solo(otro, ['puertos'])).find((h) => h.datos['puerto'] === 3306)!;
    plat.puertos.clear();
    expect(await d.reparar(iis!.id, true)).toEqual({ ok: true, codigo: 'doctor.ya_resuelto' });
    expect(await otro.reparar(mysql.id, true)).toEqual({
      ok: true,
      codigo: 'doctor.ya_resuelto',
    });
    // Al volver a revisar, el área queda limpia.
    expect(d.ultimo()).toEqual([]);
    expect(plat.serviciosDetenidos).toEqual([]);
    expect(cambios).toEqual([]);
  });

  it('si ahora el puerto es del propio WolfCore Dev, también está resuelto', async () => {
    plat.puertos.set(3306, { pid: 7100, nombre: 'mysqld.exe' });
    const d = new Doctor(deps());
    const [h] = await solo(d, ['puertos']);
    plat.puertos.set(3306, { pid: 100, nombre: 'nginx.exe' });
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true, codigo: 'doctor.ya_resuelto' });
    expect(cambios).toEqual([]);
  });

  it('dos reparar seguidos del mismo hallazgo aplican una sola vez', async () => {
    plat.vcRedist = false;
    let soltar: () => void = () => undefined;
    const original = plat.instalarVcRedist.bind(plat);
    plat.instalarVcRedist = async () => {
      await new Promise<void>((r) => (soltar = r));
      return original();
    };
    const d = new Doctor(deps());
    const [h] = await solo(d, ['vcredist']);
    const a = d.reparar(h!.id, true);
    const b = d.reparar(h!.id, true);
    await new Promise((r) => setTimeout(r, 10));
    soltar();
    expect(await a).toEqual({ ok: true });
    expect(await b).toEqual({ ok: true });
    expect(plat.vcRedistInstalaciones).toBe(1);
  });

  it('regenerar la CA con la vieja sin quitar del almacén: ok con aviso', async () => {
    vencimientos = [{ id: 'ca', dias: 3 }];
    const d = new Doctor(
      deps({
        https: {
          vencimientos: async () => vencimientos,
          regenerarCertificados: async () => ({ ok: true }),
          regenerarCA: async () => ({ ok: true, aviso: 'doctor.ca_vieja_sin_quitar' }),
        },
      }),
    );
    const [h] = await solo(d, ['ca']);
    expect(await d.reparar(h!.id, true)).toEqual({
      ok: true,
      aviso: 'doctor.ca_vieja_sin_quitar',
    });
  });
});

describe('Doctor: rangos reservados', () => {
  it('sano y dañado: puerto propio dentro de un rango de Hyper-V/WSL', async () => {
    expect(await solo(new Doctor(deps()), ['rangos-reservados'])).toEqual([]);
    plat.rangos = [{ desde: 3300, hasta: 3399 }];
    const d = new Doctor(deps());
    const [h] = await solo(d, ['rangos-reservados']);
    expect(h).toMatchObject({
      codigo: 'doctor.puerto_reservado',
      datos: { puerto: 3306, servicio: 'mysql', desde: 3300, hasta: 3399, alternativo: 3400 },
      reparacion: { id: 'cambiar-puerto', soloInforma: false },
    });
    expect(h!.reparacion!.comandoManual).toContain('liberar-rangos');
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(cambios).toEqual([['mysql', 3400]]);
  });
});

describe('Doctor: CA y certificados', () => {
  it('sanos: sin hallazgos', async () => {
    vencimientos = [
      { id: 'ca', dias: 3000 },
      { id: 's1', dias: 300, nombre: 'a.test' },
    ];
    expect(await solo(new Doctor(deps()), ['ca', 'certificados'])).toEqual([]);
  });

  it('CA por vencer y vencida; certificados por vencer y vencidos; reparaciones', async () => {
    vencimientos = [
      { id: 'ca', dias: 10 },
      { id: 's1', dias: 5, nombre: 'a.test' },
      { id: 's2', dias: -2, nombre: 'b.test' },
    ];
    const d = new Doctor(deps());
    const hs = await solo(d, ['ca', 'certificados']);
    expect(hs.map((h) => [h.codigo, h.gravedad])).toEqual([
      ['doctor.ca_por_vencer', 'aviso'],
      ['doctor.certificado_por_vencer', 'aviso'],
      ['doctor.certificado_vencido', 'error'],
    ]);
    expect(hs[1]!.datos).toMatchObject({ dominio: 'a.test', dias: 5 });
    expect(await d.reparar(hs[2]!.id, true)).toEqual({ ok: true });
    expect(await d.reparar(hs[0]!.id, true)).toEqual({ ok: true });
    expect(regeneraciones).toEqual(['certificados', 'ca']);
    vencimientos = [{ id: 'ca', dias: -1 }];
    expect((await solo(d, ['ca']))[0]).toMatchObject({
      codigo: 'doctor.ca_vencida',
      gravedad: 'error',
    });
  });
});

describe('Doctor: hosts', () => {
  it('sano: sin hallazgos', async () => {
    expect(await solo(new Doctor(deps()), ['hosts'])).toEqual([]);
  });

  it('dominios faltantes: reescribe el bloque con copia previa con fecha', async () => {
    dominios = ['a.test', 'b.test'];
    const d = new Doctor(deps());
    const [h] = await solo(d, ['hosts']);
    expect(h).toMatchObject({
      codigo: 'doctor.hosts_dominios_faltantes',
      datos: { cantidad: 1 },
      reparacion: { id: 'hosts-reescribir', requiereAdmin: true },
    });
    expect(h!.evidencia).toContain('b.test');
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    const nuevo = await readFile(rutaHosts, 'utf8');
    expect(nuevo).toContain('127.0.0.1  b.test');
    expect(nuevo).toContain('127.0.0.1  localhost');
    const copias = (await readdir(respaldos)).filter((n) => n.startsWith('hosts-'));
    expect(copias).toHaveLength(1);
    expect(await readFile(join(respaldos, copias[0]!), 'utf8')).toBe(sano);
    expect(await solo(d, ['hosts'])).toEqual([]);
  });

  it('bloque duplicado y bloque sin cierre: se reescribe uno solo y se conservan las líneas ajenas', async () => {
    const roto =
      `127.0.0.1  localhost\n${MARCA_INICIO}\n127.0.0.1  a.test\n${MARCA_FIN}\n` +
      `10.0.0.1  intranet\n${MARCA_INICIO}\n127.0.0.1  a.test\n${MARCA_FIN}\n` +
      `${MARCA_INICIO}\n127.0.0.1  a.test\n::1  a.test\n`;
    await writeFile(rutaHosts, roto);
    const d = new Doctor(deps());
    const hs = await solo(d, ['hosts']);
    expect(hs.map((h) => h.codigo).sort()).toEqual([
      'doctor.hosts_bloque_duplicado',
      'doctor.hosts_bloque_sin_cierre',
    ]);
    expect(await d.reparar(hs[0]!.id, true)).toEqual({ ok: true });
    const nuevo = await readFile(rutaHosts, 'utf8');
    expect(nuevo.split(MARCA_INICIO)).toHaveLength(2);
    expect(nuevo.split(MARCA_FIN)).toHaveLength(2);
    expect(nuevo).toContain('10.0.0.1  intranet');
    expect(nuevo).toContain('127.0.0.1  localhost');
    expect(await solo(d, ['hosts'])).toEqual([]);
  });

  it('UTF-16: se detecta y se reescribe en UTF-8 sin perder líneas', async () => {
    await writeFile(
      rutaHosts,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('10.0.0.1  intranet\r\n' + sano, 'utf16le'),
      ]),
    );
    const d = new Doctor(deps());
    const hs = await solo(d, ['hosts']);
    expect(hs.map((h) => h.codigo)).toEqual(['doctor.hosts_utf16']);
    expect(await d.reparar(hs[0]!.id, true)).toEqual({ ok: true });
    const b = await readFile(rutaHosts);
    expect(b.includes(0)).toBe(false);
    expect(b.toString('utf8')).toContain('10.0.0.1  intranet');
    expect(b.toString('utf8')).toContain('127.0.0.1  a.test');
    expect(await solo(d, ['hosts'])).toEqual([]);
  });

  it('solo lectura: se detecta y la reparación guiada lo quita con elevación', async () => {
    await chmod(rutaHosts, 0o444);
    try {
      const d = new Doctor(deps());
      const [h] = await solo(d, ['hosts']);
      expect(h).toMatchObject({
        codigo: 'doctor.hosts_solo_lectura',
        reparacion: { id: 'hosts-quitar-solo-lectura', requiereAdmin: true, soloInforma: false },
      });
      expect(h!.reparacion!.comandoManual).toContain('quitar-solo-lectura-hosts');
      expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
      expect(plat.soloLecturaQuitado).toBe(1);
      expect((await stat(rutaHosts)).mode & 0o200).not.toBe(0);
      expect(await solo(d, ['hosts'])).toEqual([]);
    } finally {
      await chmod(rutaHosts, 0o666);
    }
  });

  it('si la escritura elevada se cancela, la reparación lo informa y hosts queda igual', async () => {
    dominios = ['a.test', 'b.test'];
    plat.escribirComoAdmin = async () => ({ ok: false, motivo: 'cancelado' });
    const d = new Doctor(deps({ hosts: new GestorHosts(plat, new Eventos<EventosNucleo>()) }));
    const [h] = await solo(d, ['hosts']);
    expect(await d.reparar(h!.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_cancelada',
    });
    expect(await readFile(rutaHosts, 'utf8')).toBe(sano);
  });
});

describe('Doctor: PATH', () => {
  let propio: string;
  let flyenv: string;
  let ajena: string;
  beforeEach(async () => {
    propio = join(datos, 'tools', 'bin');
    flyenv = join(dir, 'FlyEnv', 'php');
    ajena = join(dir, 'Git', 'cmd');
    for (const c of [propio, flyenv, ajena]) await mkdir(c, { recursive: true });
    await writeFile(join(propio, 'php.cmd'), '');
    await writeFile(join(propio, 'composer.cmd'), '');
    await writeFile(join(flyenv, 'php.exe'), '');
    await writeFile(join(ajena, 'git.exe'), '');
  });

  it('sano: sin hallazgos', async () => {
    plat.path = [propio, ajena];
    expect(await solo(new Doctor(deps()), ['path'])).toEqual([]);
  });

  it('duplicados propios: se quitan con copia y sin tocar entradas ajenas (ni sus duplicados)', async () => {
    plat.path = [ajena, propio, `${propio.toUpperCase()}\\`, ajena, propio];
    const d = new Doctor(deps());
    const [h] = await solo(d, ['path']);
    expect(h).toMatchObject({
      codigo: 'doctor.path_duplicados',
      datos: { cantidad: 2 },
      reparacion: { id: 'path-quitar-duplicados', requiereAdmin: false },
    });
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(plat.path).toEqual([ajena, propio, ajena]);
    const copias = (await readdir(respaldos)).filter((n) => n.startsWith('path-usuario-'));
    expect(copias).toHaveLength(1);
    expect(await readFile(join(respaldos, copias[0]!), 'utf8')).toContain(propio);
    expect(existsSync(join(datos, 'etc', 'path-usuario.respaldo.txt'))).toBe(true);
  });

  it('ajenos delante: FlyEnv con php antes de las herramientas propias solo se informa', async () => {
    plat.path = [flyenv, ajena, propio];
    const d = new Doctor(deps());
    const [h] = await solo(d, ['path']);
    expect(h).toMatchObject({
      codigo: 'doctor.path_ajeno_delante',
      gravedad: 'aviso',
      datos: { programa: 'php', origen: 'FlyEnv' },
      reparacion: { soloInforma: true },
    });
    expect(h!.evidencia).toContain(flyenv);
    expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'doctor.solo_informa' });
    expect(plat.path).toEqual([flyenv, ajena, propio]);
  });
});

describe('Doctor: VC++, antivirus y servicios', () => {
  it('VC++ ausente: winget con confirmación', async () => {
    expect(await solo(new Doctor(deps()), ['vcredist'])).toEqual([]);
    plat.vcRedist = false;
    const d = new Doctor(deps());
    const [h] = await solo(d, ['vcredist']);
    expect(h).toMatchObject({
      codigo: 'doctor.vcredist_ausente',
      gravedad: 'error',
      reparacion: { id: 'instalar-vcredist', requiereAdmin: true },
    });
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(plat.vcRedistInstalaciones).toBe(1);
  });

  it('antivirus: solo informa y muestra el comando; nunca cambia nada', async () => {
    plat.antivirusEstado = { activo: true, excluida: true };
    expect(await solo(new Doctor(deps()), ['antivirus'])).toEqual([]);
    plat.antivirusEstado = { activo: true, excluida: null };
    const d = new Doctor(deps());
    const [h] = await solo(d, ['antivirus']);
    expect(h).toMatchObject({
      codigo: 'doctor.antivirus_sin_exclusion',
      gravedad: 'info',
      reparacion: { soloInforma: true },
    });
    expect(h!.reparacion!.comandoManual).toContain('exclusion-antivirus');
    expect(h!.reparacion!.comandoManual).toContain(JSON.stringify(datos).slice(1, -1));
    expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'doctor.solo_informa' });
  });

  describe('firewall: reglas de entrada Allow de nginx, PHP, MySQL y PostgreSQL', () => {
    const regla = (nombre: string, programa: string, perfil = 'Public, Private') => ({
      nombre,
      nombreVisible: programa.split('/').pop()!,
      perfil,
      programa,
    });

    it('sin reglas no hay hallazgo', async () => {
      plat.reglasEntrada = { ok: true, reglas: [] };
      expect(await solo(new Doctor(deps()), ['firewall'])).toEqual([]);
    });

    it('avisa con el perfil y la ruta, y muestra el comando para quitarlas sin ejecutarlo', async () => {
      plat.reglasEntrada = {
        ok: true,
        reglas: [
          regla('{AAAA-1}', 'C:/datos/bin/nginx/1.28/nginx.exe'),
          regla('{BBBB-2}', 'C:/datos/bin/mysql/8.4/bin/mysqld.exe', 'Private'),
        ],
      };
      const d = new Doctor(deps());
      const [h] = await solo(d, ['firewall']);
      expect(h).toMatchObject({
        codigo: 'doctor.firewall_reglas',
        gravedad: 'aviso',
        datos: { cantidad: 2, perfiles: 'Private, Public, Private' },
        reparacion: { soloInforma: true, requiereAdmin: true },
      });
      expect(h!.evidencia).toContain('nginx.exe');
      expect(h!.evidencia).toContain('Public, Private');
      expect(h!.evidencia).toContain('mysqld.exe');
      expect(h!.reparacion!.comandoManual).toContain('quitar-reglas-firewall');
      expect(h!.reparacion!.comandoManual).toContain('{AAAA-1}');
      expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'doctor.solo_informa' });
    });

    it('si no se pueden leer (sin permisos) es "no se pudo comprobar", no un error', async () => {
      plat.reglasEntrada = { ok: false, reglas: [] };
      const [h] = await solo(new Doctor(deps()), ['firewall']);
      expect(h).toMatchObject({ codigo: 'doctor.firewall_no_comprobado', gravedad: 'info' });
      expect(h!.reparacion).toBeUndefined();
    });
  });

  it('servicio en error: evidencia con el final del log y reintento', async () => {
    expect(await solo(new Doctor(deps()), ['servicios'])).toEqual([]);
    estados[1] = servicio({
      id: 'mysql',
      nombre: 'MySQL',
      estado: 'error',
      puertos: [3306],
      mensaje: '[ERROR] InnoDB: archivo dañado',
    });
    const d = new Doctor(deps());
    const [h] = await solo(d, ['servicios']);
    expect(h).toMatchObject({
      codigo: 'doctor.servicio_en_error',
      gravedad: 'error',
      datos: { servicio: 'MySQL' },
      reparacion: { id: 'reintentar-servicio' },
    });
    expect(h!.evidencia).toContain('InnoDB');
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(reintentos).toEqual(['mysql']);
  });
});

describe('Doctor: revisar y reparar', () => {
  it('reparar sin confirmación falla y no hace nada', async () => {
    plat.vcRedist = false;
    const d = new Doctor(deps());
    const [h] = await solo(d, ['vcredist']);
    expect(await d.reparar(h!.id, false as unknown as true)).toEqual({
      ok: false,
      codigo: 'doctor.confirmacion_requerida',
    });
    expect(plat.vcRedistInstalaciones).toBe(0);
    expect(await d.reparar('no-existe', true)).toEqual({
      ok: false,
      codigo: 'doctor.hallazgo_desconocido',
    });
  });

  it('revisar todo: ultimo() guarda el resultado y se publica un aviso si hay errores', async () => {
    plat.vcRedist = false;
    const d = new Doctor(deps());
    expect(d.ultimo()).toEqual([]);
    const hs = await d.revisar();
    expect(hs.some((h) => h.codigo === 'doctor.vcredist_ausente')).toBe(true);
    expect(d.ultimo()).toEqual(hs);
    expect(avisos).toEqual([
      expect.objectContaining({
        nivel: 'error',
        tipo: 'doctor',
        codigo: 'doctor.hallazgos',
        datos: expect.objectContaining({ fuente: 'doctor', errores: 1 }),
        accion: { ruta: 'doctor' },
      }),
    ]);
    // Los hallazgos no llevan la función de reparación (van tal cual por IPC).
    expect(JSON.parse(JSON.stringify(hs))).toEqual(hs);
  });

  it('una revisión que falla no corta las demás', async () => {
    plat.vcRedist = false;
    plat.antivirus = async () => {
      throw new Error('PowerShell roto');
    };
    const hs = await new Doctor(deps()).revisar(['antivirus', 'vcredist']);
    expect(hs.map((h) => h.codigo)).toEqual(['doctor.revision_fallida', 'doctor.vcredist_ausente']);
    expect(hs[0]).toMatchObject({ gravedad: 'info', datos: { revision: 'antivirus' } });
  });

  it('tras reparar se vuelve a revisar esa área y ultimo() se actualiza', async () => {
    plat.vcRedist = false;
    const d = new Doctor(deps());
    const hs = await d.revisar();
    const h = hs.find((x) => x.codigo === 'doctor.vcredist_ausente')!;
    await d.reparar(h.id, true);
    expect(d.ultimo().some((x) => x.codigo === 'doctor.vcredist_ausente')).toBe(false);
  });
});

describe('Doctor: confianza de la CA en Firefox', () => {
  const perfiles = (
    entrada: { perfil: string; activo: boolean; abierto: boolean; fuera?: boolean }[],
  ) => {
    const lista = entrada.map((p) => ({ fuera: false, ...p }));
    const activados: { activar: boolean; incluirFuera?: boolean }[] = [];
    return {
      activados,
      confianza: {
        caCreada: () => true,
        firefox: async () => lista,
        firefoxActivar: async (a: boolean, o?: { incluirFuera?: boolean }) => {
          activados.push({ activar: a, ...(o?.incluirFuera ? { incluirFuera: true } : {}) });
          return lista.map((p) =>
            p.abierto
              ? { perfil: p.perfil, ok: false, codigo: 'firefox.abierto' as const }
              : p.fuera && !o?.incluirFuera
                ? { perfil: p.perfil, ok: false, codigo: 'firefox.fuera' as const }
                : { perfil: p.perfil, ok: true },
          );
        },
      },
    };
  };

  it('sano: sin CA, sin Firefox o con todos los perfiles activos no hay hallazgo', async () => {
    expect(await solo(new Doctor(deps()), ['confianza'])).toEqual([]);
    const { confianza } = perfiles([{ perfil: 'a', activo: true, abierto: false }]);
    expect(await solo(new Doctor(deps({ confianza })), ['confianza'])).toEqual([]);
    const sinCa = { ...perfiles([{ perfil: 'a', activo: false, abierto: false }]).confianza };
    sinCa.caCreada = () => false;
    expect(await solo(new Doctor(deps({ confianza: sinCa })), ['confianza'])).toEqual([]);
  });

  it('perfil sin confianza: aviso con reparación que activa (con confirmación)', async () => {
    const p = perfiles([
      { perfil: 'a.default', activo: false, abierto: false },
      { perfil: 'b', activo: true, abierto: false },
    ]);
    const d = new Doctor(deps({ confianza: p.confianza }));
    const [h] = await solo(d, ['confianza']);
    expect(h).toMatchObject({
      revision: 'confianza',
      gravedad: 'aviso',
      codigo: 'doctor.firefox_sin_confianza',
      datos: { cantidad: 1 },
      reparacion: {
        id: 'firefox-confianza',
        codigo: 'doctor.reparaciones.firefox_confianza',
        soloInforma: false,
      },
    });
    expect(h!.evidencia).toContain('a.default');
    expect(await d.reparar(h!.id, true)).toEqual({ ok: true });
    expect(p.activados).toEqual([{ activar: true }]);
  });

  it('con Firefox abierto la reparación falla con firefox.abierto', async () => {
    const p = perfiles([{ perfil: 'a', activo: false, abierto: true }]);
    const d = new Doctor(deps({ confianza: p.confianza }));
    const [h] = await solo(d, ['confianza']);
    expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'firefox.abierto' });
  });

  it('un perfil fuera de la carpeta de Firefox se marca y la reparación no lo toca', async () => {
    const p = perfiles([
      { perfil: 'a', activo: false, abierto: false },
      { perfil: 'lejos', activo: false, abierto: false, fuera: true },
    ]);
    const d = new Doctor(deps({ confianza: p.confianza }));
    const [h] = await solo(d, ['confianza']);
    expect(h!.evidencia).toMatch(/lejos \(fuera/);
    expect(await d.reparar(h!.id, true)).toEqual({ ok: false, codigo: 'firefox.fuera' });
    expect(p.activados).toEqual([{ activar: true }]);
  });
});

describe('Doctor D5: enlazador MSVC para Rust', () => {
  it('sin Rust instalado no revisa nada, aunque falte el enlazador', async () => {
    plat.enlazador = false;
    expect(await solo(new Doctor(deps()), ['enlazador-msvc'])).toEqual([]);
    expect(
      await solo(new Doctor(deps({ rustInstalado: async () => false })), ['enlazador-msvc']),
    ).toEqual([]);
  });

  it('con Rust y el enlazador presente no hay hallazgo', async () => {
    expect(
      await solo(new Doctor(deps({ rustInstalado: async () => true })), ['enlazador-msvc']),
    ).toEqual([]);
  });

  it('con Rust y sin enlazador: hallazgo info que solo informa, con el comando winget', async () => {
    plat.enlazador = false;
    const d = new Doctor(deps({ rustInstalado: async () => true }));
    const [h] = await solo(d, ['enlazador-msvc']);
    expect(h).toMatchObject({
      id: 'enlazador-msvc:ausente',
      codigo: 'doctor.enlazador_msvc_ausente',
      gravedad: 'info',
      reparacion: {
        id: 'instalar-build-tools',
        soloInforma: true,
        comandoManual: plat.comandoManual({ tipo: 'instalar-build-tools' }),
      },
    });
    // Solo informa: reparar no hace nada.
    const r = await d.reparar(h!.id, true);
    expect(r.ok).toBe(false);
    expect(r.codigo).toBe('doctor.solo_informa');
  });
});
