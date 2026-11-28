import { evidenciaPlana } from './evidencia-plana';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Doctor, type DepsDoctor, type Hallazgo } from '../src/doctor/doctor';
import { quitarReglasPeligrosas, rutaRegistro } from '../src/doctor/firewallCambios';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  cuerpoQuitarReglas,
  cuerpoRestaurarReglas,
  idRegistro,
  RUTA_CLAVE_ALMACEN,
  SCRIPT_LEER_ALMACEN,
  sha256Hex,
  scriptCargador,
  scriptExportarReglas,
  type ReglaExportada,
  type ReglaPorQuitar,
} from '../src/plataforma/firewallCambiosWin';
import { SCRIPT_REGLAS_ENTRADA } from '../src/plataforma/firewallWin';
import {
  codificarComando,
  PREFIJO_TEMPORAL_HOSTS,
  scriptElevar,
} from '../src/plataforma/hostsAdmin';
import type { Ejecutor } from '../src/plataforma/tipos';
import { PlataformaWindows } from '../src/plataforma/win';

/** Cortafuegos SIMULADO (PlataformaFalsa): el real de la máquina no se toca en ninguna prueba. */

let dir: string;
let datos: string;
let plat: PlataformaFalsa;

const deps = (extra: Partial<DepsDoctor> = {}): DepsDoctor =>
  ({
    plataforma: plat,
    carpetaDatos: datos,
    carpetaRespaldos: join(datos, 'etc', 'respaldos'),
    carpetaTemporal: join(dir, 'tmp'),
    ahora: () => new Date('2026-11-26T10:00:00Z'),
    ...extra,
  }) as unknown as DepsDoctor;

const regla = (nombre: string, programa: string, perfil = 'Public, Private') => ({
  nombre,
  nombreVisible: programa.split(/[\\/]/).pop()!,
  perfil,
  programa,
});

const revisar = async (d: Doctor): Promise<Hallazgo[]> => d.revisar(['firewall']);
const quitar = (hs: Hallazgo[]): Hallazgo => hs.find((x) => x.id === 'firewall:reglas-entrada')!;
const guardadas = (d: Doctor): Hallazgo | undefined =>
  d.ultimo().find((x) => x.id === 'firewall:quitadas');
const nombresEnPie = (): string[] => plat.reglasEntrada.reglas.map((r) => r.nombre).sort();
const leerLog = async (): Promise<{ reglas: { nombre: string; regla: ReglaExportada }[] }> =>
  JSON.parse(await readFile(rutaRegistro(datos), 'utf8')) as never;

let nginx: string;
let mysqld: string;
const FLY = 'C:/Users/yo/AppData/Roaming/PhpWebStudy/nginx/nginx.exe';

beforeEach(async () => {
  dir = await carpetaTemporal('pel-d46-');
  datos = join(dir, 'WolfCoreDev');
  nginx = join(datos, 'bin', 'nginx', '1.28', 'nginx.exe');
  mysqld = join(datos, 'bin', 'mysql', '8.4', 'bin', 'mysqld.exe');
  await mkdir(join(dir, 'tmp'), { recursive: true });
  plat = new PlataformaFalsa();
  plat.reglasEntrada = {
    ok: true,
    reglas: [regla('{A-1}', nginx), regla('{B-2}', mysqld, 'Private'), regla('{FLY-1}', FLY)],
  };
});

describe('D46: quitar reglas peligrosas del cortafuegos (simulado)', () => {
  it('muestra la lista exacta: nombre, programa, perfil y dirección; las ajenas aparte', async () => {
    const hs = await revisar(new Doctor(deps()));
    const h = quitar(hs);
    expect(h.reparacion).toMatchObject({ soloInforma: false, requiereAdmin: true });
    for (const t of ['{A-1}', nginx, 'Public, Private', 'Inbound/Allow', '{B-2}', mysqld]) {
      expect(evidenciaPlana(h.evidencia)).toContain(t);
    }
    expect(h.elementos!.map((e) => e.clave).sort()).toEqual(['{A-1}', '{B-2}']);
    expect(evidenciaPlana(h.evidencia)).not.toContain('FLY-1');
    expect(evidenciaPlana(hs.find((x) => x.id === 'firewall:reglas-ajenas')!.evidencia)).toContain(
      'FLY-1',
    );
  });

  it('sin confirmado no hace nada: ni elevación ni registro', async () => {
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, false as unknown as true)).toEqual({
      ok: false,
      codigo: 'doctor.confirmacion_requerida',
    });
    for (const o of [{}, { confirmado: false }, { confirmado: 'si' as unknown as true }]) {
      expect(
        await quitarReglasPeligrosas(deps(), [{ nombre: '{A-1}', programa: nginx }], o),
      ).toEqual({ ok: false, codigo: 'doctor.confirmacion_requerida' });
    }
    expect(plat.pedidosQuitarReglas).toEqual([]);
    expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    expect(existsSync(rutaRegistro(datos))).toBe(false);
  });

  it('con confirmación quita solo las de WolfCore Dev, por Name exacto; las ajenas no se piden ni se tocan', async () => {
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true });
    expect(plat.pedidosQuitarReglas).toHaveLength(1);
    const pedido = plat.pedidosQuitarReglas[0]!;
    expect(pedido.map((r) => r.nombre).sort()).toEqual(['{A-1}', '{B-2}']);
    expect(pedido[0]).toMatchObject({
      tipo: 'propia',
      id: expect.stringMatching(/^[0-9a-f]{32}$/),
    });
    expect(nombresEnPie()).toEqual(['{FLY-1}']);
    expect(d.ultimo().some((x) => x.id === 'firewall:reglas-entrada')).toBe(false);
  });

  it('una regla de otro programa que se cuela en la lista del usuario se ignora', async () => {
    const r = await quitarReglasPeligrosas(
      deps(),
      [
        { nombre: '{A-1}', programa: nginx },
        { nombre: '{FLY-1}', programa: FLY },
      ],
      { confirmado: true },
    );
    expect(r).toEqual({ ok: true, aviso: 'doctor.firewall_parcial' });
    expect(nombresEnPie()).toEqual(['{B-2}', '{FLY-1}']);
    expect(plat.pedidosQuitarReglas[0]!.map((x) => x.nombre)).toEqual(['{A-1}']);
  });

  it('una unión hacia fuera de la carpeta de datos no cuela un programa ajeno', async () => {
    const fuera = join(dir, 'otro-programa');
    await mkdir(fuera, { recursive: true });
    await writeFile(join(fuera, 'nginx.exe'), 'x');
    await mkdir(join(datos, 'bin'), { recursive: true });
    await symlink(fuera, join(datos, 'bin', 'enlace'), 'junction');
    plat.reglasEntrada = {
      ok: true,
      reglas: [regla('{J-1}', join(datos, 'bin', 'enlace', 'nginx.exe'))],
    };
    const hs = await revisar(new Doctor(deps()));
    expect(hs.map((x) => x.id)).toEqual(['firewall:reglas-ajenas']);
    const r = await quitarReglasPeligrosas(
      deps(),
      [{ nombre: '{J-1}', programa: join(datos, 'bin', 'enlace', 'nginx.exe') }],
      { confirmado: true },
    );
    expect(r.ok).toBe(false);
    expect(plat.pedidosQuitarReglas).toEqual([]);
    expect(nombresEnPie()).toEqual(['{J-1}']);
  });

  it('un nombre 8.3 que no se puede comprobar como propio sale: queda como ajena', async () => {
    const corto = join(dir, 'WOLFCO~1', 'bin', 'nginx.exe');
    plat.reglasEntrada = { ok: true, reglas: [regla('{S-1}', corto)] };
    const hs = await revisar(new Doctor(deps()));
    expect(hs.map((x) => x.id)).toEqual(['firewall:reglas-ajenas']);
  });

  it('el programa comparado no distingue mayúsculas (una ruta en otra caja sigue siendo propia)', async () => {
    plat.reglasEntrada = { ok: true, reglas: [regla('{M-1}', nginx.toUpperCase())] };
    const hs = await revisar(new Doctor(deps()));
    expect(quitar(hs).datos).toMatchObject({ cantidad: 1 });
  });

  it('una regla que cambió entre la lista y el borrado (la vio el Doctor) no se toca', async () => {
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    // Ahora {A-1} apunta a un programa ajeno y {B-2} pasó a Block (ya no sale en la lista Allow).
    plat.reglasEntrada = {
      ok: true,
      reglas: [regla('{A-1}', 'C:/xampp/apache/bin/php.exe'), regla('{FLY-1}', FLY)],
    };
    plat.reglasFirewallExtra = [
      {
        ...(await plat.exportarReglasFirewall(['{A-1}']))![0]!,
        nombre: '{B-2}',
        programa: mysqld,
        accion: 'Block',
      },
    ];
    expect(await d.reparar(h.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.firewall_sin_cambios',
    });
    expect(plat.pedidosQuitarReglas).toEqual([]);
    expect(nombresEnPie()).toEqual(['{A-1}', '{FLY-1}']);
    expect(plat.reglasFirewallExtra.map((x) => x.nombre)).toEqual(['{B-2}']);
  });

  it('una regla que cambia mientras se espera el UAC la vuelve a comprobar el script elevado', async () => {
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    plat.alElevarFirewall = () => {
      plat.reglasEntrada = {
        ok: true,
        reglas: plat.reglasEntrada.reglas.map((x) =>
          x.nombre === '{A-1}' ? { ...x, programa: 'D:/ajeno/nginx.exe' } : x,
        ),
      };
    };
    expect(await d.reparar(h.id, true)).toEqual({ ok: true, aviso: 'doctor.firewall_parcial' });
    expect(nombresEnPie()).toEqual(['{A-1}', '{FLY-1}']);
  });

  it('apunta el registro (para mostrar) ANTES de borrar, de forma atómica, y el script guarda la copia protegida', async () => {
    plat.reglasFirewallDetalle.set('{A-1}', {
      protocolo: 'TCP',
      puertoLocal: ['80', '443'],
      direccionRemota: ['LocalSubnet'],
      descripcion: 'nginx',
    });
    let visto: unknown = null;
    let antesBorrar: string[] = [];
    plat.alElevarFirewall = () => {
      // Mientras se espera el UAC el registro ya existe en disco y la regla sigue en pie.
      visto = JSON.parse(readFileSync(rutaRegistro(datos), 'utf8'));
      antesBorrar = nombresEnPie();
    };
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true });
    expect(antesBorrar).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    const previo = visto as { reglas: { nombre: string }[] };
    expect(previo.reglas.map((x) => x.nombre).sort()).toEqual(['{A-1}', '{B-2}']);
    const log = await leerLog();
    expect(log.reglas.find((x) => x.nombre === '{A-1}')).toMatchObject({
      nombre: '{A-1}',
      programa: nginx,
      perfil: 'Public, Private',
      fecha: '2026-11-26T10:00:00.000Z',
      regla: { protocolo: 'TCP', puertoLocal: ['80', '443'], direccionRemota: ['LocalSubnet'] },
    });
    expect((await readdir(join(datos, 'etc'))).filter((n) => n.includes('.pel-tmp-'))).toEqual([]);
    expect([...plat.almacenProtegido.keys()].sort()).toEqual(
      [idRegistro('{A-1}'), idRegistro('{B-2}')].sort(),
    );
  });

  it('si el registro no se puede escribir, no se borra nada ni se pide el UAC', async () => {
    await mkdir(datos, { recursive: true });
    await writeFile(join(datos, 'etc'), 'esto es un archivo, no una carpeta');
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.firewall_registro_fallido',
    });
    expect(plat.pedidosQuitarReglas).toEqual([]);
    expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
  });

  it('un UAC cancelado no cambia nada y no deja entradas de lo que no se quitó', async () => {
    plat.uacCancelado = true;
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.reparacion_cancelada',
    });
    expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    expect((await leerLog()).reglas).toEqual([]);
  });

  it('un borrado parcial se informa y el registro solo guarda lo que se quitó', async () => {
    plat.firewallNoBorrables.add('{B-2}');
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true, aviso: 'doctor.firewall_parcial' });
    expect(nombresEnPie()).toEqual(['{B-2}', '{FLY-1}']);
    expect((await leerLog()).reglas.map((x) => x.nombre)).toEqual(['{A-1}']);
  });

  it('si el script no puede guardar la copia protegida de una regla, no la borra', async () => {
    plat.firewallNoGuardables.add('{A-1}');
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true, aviso: 'doctor.firewall_parcial' });
    expect(nombresEnPie()).toEqual(['{A-1}', '{FLY-1}']);
  });

  it('si ninguna se pudo quitar, es un fallo (no "parcial")', async () => {
    plat.firewallNoBorrables.add('{A-1}');
    plat.firewallNoBorrables.add('{B-2}');
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({
      ok: false,
      codigo: 'doctor.firewall_sin_cambios',
    });
  });

  it('un registro ilegible no se pisa: se aparta y se empieza otro', async () => {
    await mkdir(join(datos, 'etc'), { recursive: true });
    await writeFile(rutaRegistro(datos), '{ roto');
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true });
    expect((await readdir(join(datos, 'etc'))).some((n) => n.includes('.ilegible-'))).toBe(true);
    expect((await leerLog()).reglas).toHaveLength(2);
  });

  describe('selección regla por regla', () => {
    it('solo quita las marcadas', async () => {
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      expect(await d.reparar(h.id, true, undefined, ['{A-1}'])).toEqual({ ok: true });
      expect(nombresEnPie()).toEqual(['{B-2}', '{FLY-1}']);
      expect(plat.pedidosQuitarReglas[0]!.map((x) => x.nombre)).toEqual(['{A-1}']);
    });

    it('una selección con algo que no se mostró se rechaza; una vacía no hace nada', async () => {
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      expect(await d.reparar(h.id, true, undefined, ['{FLY-1}'])).toEqual({
        ok: false,
        codigo: 'doctor.hallazgo_desconocido',
      });
      expect(await d.reparar(h.id, true, undefined, [])).toEqual({
        ok: false,
        codigo: 'doctor.firewall_sin_cambios',
      });
      expect(plat.pedidosQuitarReglas).toEqual([]);
      expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    });
  });

  describe('reglas acotadas a la red local (las que recomienda la propia app)', () => {
    const acotada = (nombre: string, o: Record<string, string> = {}) => ({
      ...regla(nombre, nginx, 'Private'),
      protocolo: 'TCP',
      puertoLocal: '8100',
      direccionRemota: 'LocalSubnet',
      ...o,
    });

    it('salen aparte, sin botón ni en la lista de peligrosas', async () => {
      plat.reglasEntrada = { ok: true, reglas: [acotada('{L-1}'), regla('{A-1}', nginx)] };
      const hs = await revisar(new Doctor(deps()));
      const a = hs.find((x) => x.id === 'firewall:reglas-acotadas')!;
      expect(a).toMatchObject({ gravedad: 'info', datos: { cantidad: 1 } });
      expect(a.reparacion).toBeUndefined();
      expect(evidenciaPlana(a.evidencia)).toContain('{L-1}');
      expect(quitar(hs).elementos!.map((e) => e.clave)).toEqual(['{A-1}']);
    });

    it('si no cumple TODO (perfil, protocolo, puertos y subred local) sigue siendo peligrosa', async () => {
      plat.reglasEntrada = {
        ok: true,
        reglas: [
          acotada('{X-1}', { direccionRemota: 'Any' }),
          acotada('{X-2}', { puertoLocal: 'Any' }),
          { ...acotada('{X-3}'), perfil: 'Private, Public' },
          acotada('{X-4}', { protocolo: 'Any' }),
          acotada('{X-5}', { direccionRemota: 'LocalSubnet,Internet' }),
          regla('{X-6}', nginx, 'Private'),
        ],
      };
      const hs = await revisar(new Doctor(deps()));
      expect(hs.some((x) => x.id === 'firewall:reglas-acotadas')).toBe(false);
      expect(quitar(hs).elementos).toHaveLength(6);
    });
  });

  describe('restos de pruebas: raíz real bajo la carpeta temporal', () => {
    it('la raíz del script elevado es la carpeta pel-* que contiene al programa', async () => {
      const tmp = join(dir, 'tmp');
      const p1 = join(tmp, 'pel-int-abc', 'bin', 'nginx.exe');
      const p2 = join(tmp, 'claude', 'scratchpad', 'ngx1', 'nginx.exe');
      plat.reglasEntrada = { ok: true, reglas: [regla('{T-1}', p1), regla('{T-2}', p2)] };
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      expect(h.datos).toMatchObject({ cantidad: 2 });
      expect(await d.reparar(h.id, true)).toEqual({ ok: true });
      const pedido = plat.pedidosQuitarReglas[0]!;
      const t1 = pedido.find((x) => x.nombre === '{T-1}')!;
      const t2 = pedido.find((x) => x.nombre === '{T-2}')!;
      expect(t1).toMatchObject({ tipo: 'prueba' });
      expect(t1.raiz.replaceAll('\\', '/').toLowerCase()).toMatch(/\/tmp\/pel-int-abc$/);
      expect(t2.raiz.replaceAll('\\', '/').toLowerCase()).toMatch(/\/scratchpad\/ngx1$/);
      expect(t1.temporal.replaceAll('\\', '/').toLowerCase()).toMatch(/\/tmp$/);
    });

    it('una carpeta pel-* fuera de la temporal indicada, aunque se llame "temp", es ajena', async () => {
      plat.reglasEntrada = {
        ok: true,
        reglas: [
          regla('{T-3}', join(dir, 'Temp', 'pel-int-abc', 'nginx.exe')),
          regla('{T-4}', 'C:/Users/yo/AppData/Local/Temp/pel-int-abc/nginx.exe'),
        ],
      };
      const hs = await revisar(new Doctor(deps()));
      expect(hs.map((x) => x.id)).toEqual(['firewall:reglas-ajenas']);
    });
  });

  describe('resultado cuando no se puede comprobar qué quedó (M1, M2)', () => {
    it('si falla la relectura, no se da por hecho: aviso parcial', async () => {
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      // 1 lectura antes de empezar la reparación; la de después ya falla.
      plat.exportarFallaTras = plat.exportaciones + 1;
      expect(await d.reparar(h.id, true)).toEqual({ ok: true, aviso: 'doctor.firewall_parcial' });
    });

    it('tras un plazo vencido el registro no se poda (quizá sí se quitó algo)', async () => {
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      plat.quitarReglasFirewall = async () => ({ ok: false, motivo: 'tiempo' });
      const r = await d.reparar(h.id, true);
      expect(r.ok).toBe(false);
      expect((await leerLog()).reglas.map((x) => x.nombre).sort()).toEqual(['{A-1}', '{B-2}']);
    });
  });

  describe('restaurar: solo desde la copia protegida', () => {
    it('recrea lo quitado con los mismos campos, con la misma confirmación', async () => {
      plat.reglasFirewallDetalle.set('{A-1}', {
        protocolo: 'TCP',
        puertoLocal: ['8080'],
        direccionRemota: ['LocalSubnet'],
      });
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
      const q = guardadas(d)!;
      expect(q.reparacion).toMatchObject({ soloInforma: false, requiereAdmin: true });
      // El diálogo muestra todos los campos de lo que se va a crear.
      const linea = q.elementos!.find((e) => e.texto.includes('{A-1}'))!.texto;
      for (const t of [
        nginx,
        'Profile=Public, Private',
        'Inbound/Allow',
        'Protocol=TCP',
        'LocalPort=8080',
        'RemoteAddress=LocalSubnet',
        'Enabled',
      ]) {
        expect(linea).toContain(t);
      }
      expect(await d.reparar(q.id, false as unknown as true)).toEqual({
        ok: false,
        codigo: 'doctor.confirmacion_requerida',
      });
      expect(plat.pedidosRestaurarReglas).toEqual([]);
      expect(await d.reparar(q.id, true)).toEqual({ ok: true });
      expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
      expect(plat.pedidosRestaurarReglas[0]![0]).toMatchObject({
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect((await leerLog()).reglas).toEqual([]);
    });

    it('se puede elegir una sola', async () => {
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      const q = guardadas(d)!;
      await d.reparar(q.id, true, undefined, [idRegistro('{B-2}')]);
      expect(nombresEnPie()).toEqual(['{B-2}', '{FLY-1}']);
    });

    it('un UAC cancelado al restaurar no recrea nada', async () => {
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      plat.uacCancelado = true;
      const q = guardadas(d)!;
      expect(await d.reparar(q.id, true)).toEqual({
        ok: false,
        codigo: 'doctor.reparacion_cancelada',
      });
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
    });

    it('C1: una entrada falsificada en el JSON de etc/ no ofrece ni crea nada', async () => {
      await mkdir(join(datos, 'etc'), { recursive: true });
      const base = (await plat.exportarReglasFirewall(['{A-1}']))![0]!;
      const falsa = {
        ...base,
        nombre: '{EVIL-1}',
        perfil: 'Any',
        programa: join(datos, 'bin', 'renombrado', 'nginx.exe'),
        puertoLocal: ['Any'],
        direccionRemota: ['Any'],
      };
      await writeFile(
        rutaRegistro(datos),
        JSON.stringify({
          version: 1,
          reglas: [
            {
              fecha: 'x',
              nombre: falsa.nombre,
              programa: falsa.programa,
              perfil: 'Any',
              regla: falsa,
            },
          ],
        }),
      );
      const d = new Doctor(deps());
      await revisar(d);
      expect(guardadas(d)).toBeUndefined();
      expect(await d.reparar('firewall:quitadas', true)).toEqual({
        ok: false,
        codigo: 'doctor.hallazgo_desconocido',
      });
      expect(plat.pedidosRestaurarReglas).toEqual([]);
      expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    });

    it('C1: si la copia protegida cambia entre la revisión y la aplicación, no se crea nada', async () => {
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      const q = guardadas(d)!;
      // Alguien con permisos cambia lo protegido (perfil Any, todo abierto) tras mostrarse.
      const id = idRegistro('{A-1}');
      const e = plat.almacenProtegido.get(id)!;
      const abierta = { ...e.regla, perfil: 'Any', direccionRemota: ['Any'] };
      plat.almacenProtegido.set(id, { texto: JSON.stringify(abierta), regla: abierta });
      expect(await d.reparar(q.id, true)).toEqual({
        ok: false,
        codigo: 'doctor.firewall_almacen_inseguro',
      });
      expect(plat.pedidosRestaurarReglas).toEqual([]);
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
    });

    it('C1: lo que cambia dentro del propio script elevado (huella distinta) tampoco crea nada', async () => {
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      const q = guardadas(d)!;
      const id = idRegistro('{A-1}');
      plat.alElevarFirewall = () => {
        const e = plat.almacenProtegido.get(id)!;
        const otra = { ...e.regla, perfil: 'Any' };
        plat.almacenProtegido.set(id, { texto: JSON.stringify(otra), regla: otra });
      };
      await d.reparar(q.id, true, undefined, [id]);
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
    });

    it('C1: una carpeta protegida que no es de fiar impide quitar y restaurar', async () => {
      const d = new Doctor(deps());
      plat.almacenInseguro = true;
      const h = quitar(await revisar(d));
      expect(await d.reparar(h.id, true)).toEqual({
        ok: false,
        codigo: 'doctor.firewall_almacen_inseguro',
      });
      expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
      plat.almacenInseguro = false;
      await d.reparar(h.id, true);
      plat.almacenInseguro = true;
      expect(await d.reparar(guardadas(d)!.id, true)).toEqual({
        ok: false,
        codigo: 'doctor.firewall_almacen_inseguro',
      });
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
    });

    it('una copia protegida con un programa ajeno no se ofrece', async () => {
      const base = (await plat.exportarReglasFirewall(['{A-1}']))![0]!;
      const ajena = { ...base, nombre: '{X-1}', programa: FLY };
      plat.almacenProtegido.set(idRegistro('{X-1}'), {
        texto: JSON.stringify(ajena),
        regla: ajena,
      });
      const d = new Doctor(deps());
      await revisar(d);
      expect(guardadas(d)).toBeUndefined();
    });
  });

  describe('nombres de regla que crea Windows (con barras, dos puntos y llaves)', () => {
    it('se listan y se quitan por su Name exacto', async () => {
      const nombre = `TCP Query User{88DB9641-6D7E-41E6-8660-45595C147EA6}${nginx}`;
      plat.reglasEntrada = { ok: true, reglas: [regla(nombre, nginx)] };
      const d = new Doctor(deps());
      const h = quitar(await revisar(d));
      expect(evidenciaPlana(h.evidencia)).toContain(nombre);
      expect(await d.reparar(h.id, true)).toEqual({ ok: true });
      expect(plat.reglasEntrada.reglas).toEqual([]);
    });

    it('un nombre que actuaría como patrón (comodines o comillas) no se quita desde aquí', async () => {
      for (const n of ['*', '{A}*', 'a?b', '[ab]', "x'; calc; '", 'a`b']) {
        plat.reglasEntrada = { ok: true, reglas: [regla(n, nginx)] };
        const r = await quitarReglasPeligrosas(deps(), [{ nombre: n, programa: nginx }], {
          confirmado: true,
        });
        expect(r.ok, n).toBe(false);
        expect(plat.pedidosQuitarReglas).toEqual([]);
      }
    });
  });
});

describe('D46: scripts del cortafuegos real (solo se comprueba su texto: nunca se ejecutan)', () => {
  const base: ReglaPorQuitar = {
    id: idRegistro('{AAAA-1}'),
    nombre: '{AAAA-1}',
    programa: 'C:\\Datos\\bin\\nginx.exe',
    raiz: 'C:\\Datos',
    tipo: 'propia',
    temporal: 'C:\\Temp',
  };

  it('quitar actúa por Name exacto y vuelve a comprobar entrada, Allow, programa, .exe y raíz', () => {
    const s = cuerpoQuitarReglas([base], 1_800_000_000_000);
    expect(s).toContain('Remove-NetFirewallRule -Name $e.n');
    expect(s).not.toMatch(/-DisplayName|-Program\b/);
    expect(s).toContain("$r.Direction -eq 'Inbound'");
    expect(s).toContain("$r.Action -eq 'Allow'");
    expect(s).toContain('Get-RutaReal');
    expect(s).toContain("GetExtension($rl) -ne '.exe'");
    expect(s).toContain("n = '{AAAA-1}'");
    expect(s).toContain('exit 41');
    expect(s).toContain('exit 11');
  });

  it('M1: revisa el plazo antes de CADA regla y para sin tocar más', () => {
    const s = cuerpoQuitarReglas(
      [base, { ...base, nombre: '{B}', id: idRegistro('{B}') }],
      1_800_000_000_000,
    );
    const fila = s.indexOf('foreach ($e in $reglas) {');
    const plazo = s.indexOf('1800000000000) { $vencido = $true; break }');
    const borrar = s.indexOf('Remove-NetFirewallRule');
    expect(fila).toBeGreaterThan(0);
    expect(plazo).toBeGreaterThan(fila);
    expect(plazo).toBeLessThan(borrar);
    expect(s).toContain('if ($vencido) { exit 11 }');
  });

  it('I3: el resto de pruebas exige una carpeta pel-* (o scratchpad\\ngx*) bajo la temporal', () => {
    const s = cuerpoQuitarReglas(
      [{ ...base, tipo: 'prueba', raiz: 'C:\\Temp\\pel-int-x', temporal: 'C:\\Temp' }],
      null,
    );
    expect(s).toContain("$tipo -eq 'prueba'");
    expect(s).toContain('^(pel-int-|pel-etapa-|pel-vhost-real-)');
    expect(s).toContain("'scratchpad'");
    expect(s).toContain("k = 'prueba'");
    expect(s).toContain('$bl.StartsWith($tl +');
  });

  it('N1: la copia va al registro (HKLM), no al sistema de archivos', () => {
    const q = cuerpoQuitarReglas([base], null);
    const r = cuerpoRestaurarReglas([], null);
    for (const s of [q, r]) {
      // La clave es una constante: sale del mismo sitio para mostrar y para el script elevado.
      expect(s).toContain(`$rutaClave = '${RUTA_CLAVE_ALMACEN}'`);
      expect(s).toContain('[Microsoft.Win32.RegistryHive]::LocalMachine');
      // Nada de ProgramData, carpetas, archivos ni variables de entorno del usuario.
      expect(s).not.toMatch(
        /ProgramData|CommonApplicationData|WriteAllBytes|ReadAllBytes\(\$archivo|\$env:(?!PSModulePath)/,
      );
      expect(s).not.toContain('Initialize-AlmacenWolf');
      expect(s).not.toContain('Test-AlmacenWolf');
    }
    expect(SCRIPT_LEER_ALMACEN).toContain(RUTA_CLAVE_ALMACEN);
    expect(RUTA_CLAVE_ALMACEN).toBe('SOFTWARE\\WolfCoreDev\\Cortafuegos');
  });

  it('N1: quitar guarda la copia como REG_SZ, la verifica y solo entonces borra la regla', () => {
    const s = cuerpoQuitarReglas([base], null);
    const crear = s.indexOf('Open-ClaveWolf $true');
    const escribir = s.indexOf(
      '$k.SetValue($e.i, $json, [Microsoft.Win32.RegistryValueKind]::String)',
    );
    const leer = s.indexOf('$leido = [string]$k.GetValue($e.i, $null)');
    const verificar = s.indexOf('$leido -ceq $json');
    const borrar = s.indexOf('Remove-NetFirewallRule -Name $e.n');
    expect(crear).toBeGreaterThan(0);
    expect(escribir).toBeGreaterThan(crear);
    expect(leer).toBeGreaterThan(escribir);
    expect(verificar).toBeGreaterThan(leer);
    expect(borrar).toBeGreaterThan(verificar);
    // Si la clave no es de confianza se sale con 21 ANTES de tocar ninguna regla.
    expect(s.indexOf('exit 21')).toBeGreaterThan(crear);
    expect(s.indexOf('exit 21')).toBeLessThan(s.indexOf('foreach ($e in $reglas)'));
  });

  it('N1: la clave debe tener dueño Administradores/SYSTEM y solo ellos escriben; si no, salida 21', () => {
    const s = cuerpoQuitarReglas([base], null);
    expect(s).toContain("'S-1-5-18'");
    expect(s).toContain("'S-1-5-32-544'");
    expect(s).toContain('GetOwner([Security.Principal.SecurityIdentifier])');
    expect(s).toContain('@($sidSistema, $sidAdmins) -notcontains $dueno');
    expect(s).toContain(
      'SetValue, CreateSubKey, CreateLink, Delete, ChangePermissions, TakeOwnership',
    );
    expect(s).toContain('-band $derechosPeligrosos');
    // También la clave superior, y una clave que ya existía se comprueba, no se reescribe.
    expect(s).toContain('$base = $hklm.OpenSubKey($rutaBase)');
    expect(s).toContain('(-not $baseBien) -or (-not (Test-ClaveWolf $k))');
    expect(s).toContain('if ($nueva) {');
    // Una clave nueva lleva ACL propia: herencia cortada, SYSTEM y Administradores total, Users lectura.
    expect(s).toContain('SetAccessRuleProtection($true, $false)');
    expect(s).toMatch(/\$sidSistema\), \[Security\.AccessControl\.RegistryRights\]::FullControl/);
    expect(s).toMatch(/\$sidAdmins\), \[Security\.AccessControl\.RegistryRights\]::FullControl/);
    expect(s).toMatch(/\$sidUsuarios\), \[Security\.AccessControl\.RegistryRights\]::ReadKey/);
    expect(s).toContain('exit 21');
  });

  it('N1: restaurar lee SOLO de esa clave, por id, y exige clave de confianza, huella y campos', () => {
    const r = {
      id: idRegistro('{AAAA-1}'),
      sha256: 'a'.repeat(64),
      raiz: 'C:\\Datos',
      tipo: 'propia' as const,
      temporal: 'C:\\Temp',
    };
    const s = cuerpoRestaurarReglas([r], null);
    expect(s).toContain('Open-ClaveWolf $false');
    expect(s).toContain('exit 21');
    expect(s.indexOf('exit 21')).toBeLessThan(s.indexOf('foreach ($e in $reglas)'));
    expect(s).toContain('$k.GetValue($e.i, $null)');
    expect(s).toContain('(Get-HuellaWolf $bytes) -ne $e.h');
    expect(s).toContain(`h = '${'a'.repeat(64)}'`);
    expect(s).toContain('Test-ReglaRestaurable $x');
    // Nada de la regla sale del Doctor: no hay puertos, direcciones ni perfil incrustados.
    expect(s).not.toMatch(/-Profile 'Any'|LocalSubnet/);
    expect(s).toContain('New-NetFirewallRule @p');
    // N4: recreada la regla, se borra su copia.
    expect(s.indexOf('New-NetFirewallRule @p')).toBeLessThan(
      s.indexOf('$k.DeleteValue($e.i, $false)'),
    );
    expect(() => cuerpoRestaurarReglas([{ ...r, sha256: 'xx' }], null)).toThrow(/Huella/);
    expect(() => cuerpoRestaurarReglas([{ ...r, id: '../x' }], null)).toThrow(/Identificador/);
  });

  it('M6: el protocolo numérico (6, 17) también lleva puertos', () => {
    const s = cuerpoRestaurarReglas([], null);
    expect(s).toContain("@('tcp', 'udp', '6', '17')");
  });

  it('M4: la lectura y la exportación fijan el PSModulePath de Windows PowerShell', () => {
    for (const s of [SCRIPT_REGLAS_ENTRADA, scriptExportarReglas(['{A-1}'])]) {
      expect(s).toContain('$env:PSModulePath = ');
      expect(s).toContain("'WindowsPowerShell', 'v1.0', 'Modules'");
    }
  });

  it('rechaza nombres con comodines o comillas', () => {
    for (const n of ['*', 'a?b', '[a]', "a'; calc", 'a\nb', '']) {
      expect(() => cuerpoQuitarReglas([{ ...base, nombre: n }], null)).toThrow(/no válido/);
      expect(() => scriptExportarReglas([n])).toThrow(/no válido/);
    }
  });

  it('I2: el comando elevado mide lo mismo con 1 que con 100 reglas (el cuerpo va en un archivo)', async () => {
    const tmp = await carpetaTemporal('pel-d46-win-');
    const comandos: string[] = [];
    const archivos: { nombre: string; texto: string; huella: string }[] = [];
    const ejecutor: Ejecutor = async (_c, args) => {
      const externo = args.join(' ');
      comandos.push(externo);
      const interno = Buffer.from(
        /(?:-EncodedCommand |FromBase64String\(')([A-Za-z0-9+/=]+)/.exec(externo)![1]!,
        'base64',
      ).toString('utf16le');
      const huella = /-ne '([0-9a-f]{64})'/.exec(interno)![1]!;
      const nombre = (await readdir(tmp)).find((n) => n.startsWith(PREFIJO_TEMPORAL_HOSTS))!;
      archivos.push({ nombre, texto: await readFile(join(tmp, nombre), 'utf8'), huella });
      return { codigo: 0, stdout: '', stderr: '' };
    };
    const p = new PlataformaWindows(ejecutor, undefined, { carpetaTemporal: tmp, entorno: {} });
    const hacer = (n: number): ReglaPorQuitar[] =>
      Array.from({ length: n }, (_, i) => ({
        ...base,
        nombre: `TCP Query User{${String(i).padStart(8, '0')}-AAAA}C:\\Users\\alguien\\AppData\\Local\\WolfCoreDev\\bin\\nginx\\1.28\\nginx.exe`,
        id: idRegistro(`r${i}`),
      }));
    await p.quitarReglasFirewall(hacer(1));
    await p.quitarReglasFirewall(hacer(100));
    expect(comandos).toHaveLength(2);
    // El comando que se ve en la línea de comandos no crece y queda muy por debajo del límite.
    expect(Math.abs(comandos[0]!.length - comandos[1]!.length)).toBeLessThan(40);
    expect(comandos[1]!.length).toBeLessThan(12_000);
    // El cuerpo sí crece, pero va en un archivo cuya huella está en el comando elevado.
    expect(archivos[1]!.texto.length).toBeGreaterThan(archivos[0]!.texto.length * 3);
    for (const a of archivos) {
      const { createHash } = await import('node:crypto');
      expect(createHash('sha256').update(a.texto, 'utf8').digest('hex')).toBe(a.huella);
    }
    // Sin restos: el temporal se borra al terminar.
    expect((await readdir(tmp)).filter((n) => n.startsWith(PREFIJO_TEMPORAL_HOSTS))).toEqual([]);
  });

  it('M1: el plazo del script deja margen antes del límite externo', async () => {
    const tmp = await carpetaTemporal('pel-d46-win-');
    let cuerpo = '';
    let opciones: { timeoutMs?: number } | undefined;
    const ejecutor: Ejecutor = async (_c, _a, o) => {
      opciones = o;
      const nombre = (await readdir(tmp)).find((n) => n.startsWith(PREFIJO_TEMPORAL_HOSTS))!;
      cuerpo = await readFile(join(tmp, nombre), 'utf8');
      return { codigo: 0, stdout: '', stderr: '' };
    };
    const p = new PlataformaWindows(ejecutor, undefined, { carpetaTemporal: tmp, entorno: {} });
    const antes = Date.now();
    await p.quitarReglasFirewall([base]);
    const limite = Number(/ToUnixTimeMilliseconds\(\) -gt (\d+)\)/.exec(cuerpo)![1]);
    const margen = antes + opciones!.timeoutMs! - limite;
    expect(margen).toBeGreaterThanOrEqual(25_000);
  });

  it('salidas del script elevado: parcial es éxito a medias, vencido es tiempo, carpeta no fiable es error', async () => {
    const tmp = await carpetaTemporal('pel-d46-win-');
    const con = (codigo: number): PlataformaWindows =>
      new PlataformaWindows(async () => ({ codigo, stdout: '', stderr: '' }), undefined, {
        carpetaTemporal: tmp,
        entorno: {},
      });
    expect(await con(41).quitarReglasFirewall([base])).toEqual({ ok: true });
    expect(await con(11).quitarReglasFirewall([base])).toEqual({ ok: false, motivo: 'tiempo' });
    expect(await con(21).quitarReglasFirewall([base])).toEqual({
      ok: false,
      motivo: 'error',
      detalle: 'almacen-inseguro',
    });
    expect(await con(10).quitarReglasFirewall([base])).toEqual({ ok: false, motivo: 'cancelado' });
  });

  it('el cargador comprueba el SHA-256 del cuerpo antes de ejecutarlo', () => {
    const s = scriptCargador('C:\\Temp\\pel-hosts-1-1-a.txt', 'B'.repeat(64));
    expect(s).toContain('exit 12');
    expect(s).toContain('exit 13');
    expect(s).toContain(`-ne '${'b'.repeat(64)}'`);
    expect(s.indexOf('exit 13')).toBeLessThan(s.indexOf('[scriptblock]::Create'));
    // Corto y de tamaño fijo: muy por debajo de los 8191 caracteres que admite cualquier línea de órdenes.
    expect(scriptElevar(codificarComando(s)).length).toBeLessThan(6000);
  });
});

describe('D46: lectura de la copia protegida (registro simulado)', () => {
  const exportada: ReglaExportada = {
    nombre: '{AAAA-1}',
    nombreVisible: 'nginx',
    descripcion: '',
    habilitada: true,
    perfil: 'Private',
    direccion: 'Inbound',
    accion: 'Allow',
    programa: 'C:/Datos/bin/nginx.exe',
    protocolo: 'TCP',
    puertoLocal: ['80'],
    puertoRemoto: ['Any'],
    direccionLocal: ['Any'],
    direccionRemota: ['LocalSubnet'],
  };
  const texto = JSON.stringify(exportada);
  const con = (codigo: number, stdout: string): PlataformaWindows =>
    new PlataformaWindows(async () => ({ codigo, stdout, stderr: '' }), undefined, { entorno: {} });

  it('lee id, huella (SHA-256 del texto) y regla; descarta lo que no cuadra', async () => {
    const id = idRegistro('{AAAA-1}');
    const salida = [
      `${id} ${texto}`,
      `${'0'.repeat(32)} ${texto}`,
      `${idRegistro('{BBBB-2}')} { roto`,
      'sin-id {}',
      '',
    ].join('\r\n');
    const res = await con(0, salida).leerAlmacenFirewall();
    expect(res).toHaveLength(1);
    expect(res![0]).toMatchObject({ id, regla: exportada });
    expect(res![0]!.sha256).toBe(sha256Hex(texto));
  });

  it('sin la clave no hay copias; un fallo de lectura da null', async () => {
    expect(await con(0, '').leerAlmacenFirewall()).toEqual([]);
    expect(await con(1, '').leerAlmacenFirewall()).toBeNull();
    const p = new PlataformaWindows(
      async () => {
        throw new Error('sin PowerShell');
      },
      undefined,
      { entorno: {} },
    );
    expect(await p.leerAlmacenFirewall()).toBeNull();
  });

  it('el script de lectura no eleva ni cambia nada: solo abre la clave para leer', () => {
    expect(SCRIPT_LEER_ALMACEN).not.toMatch(
      /\b(New|Set|Remove|Add)-|SetValue|DeleteValue|CreateSubKey|runas/,
    );
    expect(SCRIPT_LEER_ALMACEN).toContain('OpenSubKey(');
    expect(SCRIPT_LEER_ALMACEN).toContain('GetValueNames()');
  });

  it('el registro simulado de PlataformaFalsa guarda al quitar y borra la copia al restaurar (N4)', async () => {
    plat.reglasEntrada = { ok: true, reglas: [regla('{A-1}', nginx)] };
    const d = new Doctor(deps());
    await d.reparar(quitar(await revisar(d)).id, true);
    expect([...plat.almacenProtegido.keys()]).toEqual([idRegistro('{A-1}')]);
    expect(await plat.leerAlmacenFirewall()).toHaveLength(1);
    await d.reparar(guardadas(d)!.id, true);
    expect(nombresEnPie()).toEqual(['{A-1}']);
    expect(plat.almacenProtegido.size).toBe(0);
    expect(await plat.leerAlmacenFirewall()).toEqual([]);
    // Ya no hay nada que restaurar.
    await revisar(d);
    expect(guardadas(d)).toBeUndefined();
  });
});
