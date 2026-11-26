import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { Doctor, type DepsDoctor, type Hallazgo } from '../src/doctor/doctor';
import { quitarReglasPeligrosas, rutaRegistro } from '../src/doctor/firewallCambios';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import {
  scriptExportarReglas,
  scriptQuitarReglas,
  scriptRestaurarReglas,
  type ReglaExportada,
} from '../src/plataforma/firewallCambiosWin';

/** Cortafuegos SIMULADO (PlataformaFalsa): el real de la máquina no se toca en ninguna prueba. */

let dir: string;
let datos: string;
let plat: PlataformaFalsa;

const deps = (): DepsDoctor =>
  ({
    plataforma: plat,
    carpetaDatos: datos,
    carpetaRespaldos: join(datos, 'etc', 'respaldos'),
    carpetaTemporal: join(dir, 'tmp'),
    ahora: () => new Date('2026-11-26T10:00:00Z'),
  }) as unknown as DepsDoctor;

const regla = (nombre: string, programa: string, perfil = 'Public, Private') => ({
  nombre,
  nombreVisible: programa.split(/[\\/]/).pop()!,
  perfil,
  programa,
});

const revisar = async (d: Doctor): Promise<Hallazgo[]> => d.revisar(['firewall']);
const quitar = (hs: Hallazgo[]): Hallazgo => hs.find((x) => x.id === 'firewall:reglas-entrada')!;
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
      expect(h.evidencia).toContain(t);
    }
    expect(h.evidencia).not.toContain('FLY-1');
    expect(hs.find((x) => x.id === 'firewall:reglas-ajenas')!.evidencia).toContain('FLY-1');
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
    expect(plat.pedidosQuitarReglas[0]!.map((r) => r.nombre).sort()).toEqual(['{A-1}', '{B-2}']);
    expect(nombresEnPie()).toEqual(['{FLY-1}']);
    // La revisión posterior ya no ofrece quitar nada.
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

  it('guarda el registro con la regla completa ANTES de borrar, de forma atómica', async () => {
    plat.reglasFirewallDetalle.set('{A-1}', {
      protocolo: 'TCP',
      puertoLocal: ['80', '443'],
      direccionRemota: ['LocalSubnet'],
      descripcion: 'nginx',
    });
    let visto: unknown = null;
    let antesBorrar: string[] = [];
    plat.alElevarFirewall = () => {
      visto = JSON.parse(
        // Mientras se espera el UAC el archivo ya existe en disco.
        readFileSync(rutaRegistro(datos), 'utf8'),
      );
      antesBorrar = nombresEnPie();
    };
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(await d.reparar(h.id, true)).toEqual({ ok: true });
    expect(antesBorrar).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
    const previo = visto as { reglas: { nombre: string }[] };
    expect(previo.reglas.map((x) => x.nombre).sort()).toEqual(['{A-1}', '{B-2}']);
    const log = await leerLog();
    const a = log.reglas.find((x) => x.nombre === '{A-1}')!;
    expect(a).toMatchObject({
      nombre: '{A-1}',
      programa: nginx,
      perfil: 'Public, Private',
      fecha: '2026-11-26T10:00:00.000Z',
      regla: { protocolo: 'TCP', puertoLocal: ['80', '443'], direccionRemota: ['LocalSubnet'] },
    });
    // Sin temporales de la escritura atómica.
    expect((await readdir(join(datos, 'etc'))).filter((n) => n.includes('.pel-tmp-'))).toEqual([]);
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
    const nombres = await readdir(join(datos, 'etc'));
    expect(nombres.some((n) => n.includes('.ilegible-'))).toBe(true);
    expect((await leerLog()).reglas).toHaveLength(2);
  });

  describe('restaurar', () => {
    it('recrea lo quitado con la misma confirmación y vacía el registro', async () => {
      plat.reglasFirewallDetalle.set('{A-1}', { protocolo: 'TCP', puertoLocal: ['8080'] });
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
      const hs = d.ultimo();
      const q = hs.find((x) => x.id === 'firewall:quitadas')!;
      expect(q.reparacion).toMatchObject({ soloInforma: false, requiereAdmin: true });
      expect(q.evidencia).toContain('{A-1}');
      expect(await d.reparar(q.id, false as unknown as true)).toEqual({
        ok: false,
        codigo: 'doctor.confirmacion_requerida',
      });
      expect(plat.pedidosRestaurarReglas).toEqual([]);
      expect(await d.reparar(q.id, true)).toEqual({ ok: true });
      expect(nombresEnPie()).toEqual(['{A-1}', '{B-2}', '{FLY-1}']);
      expect(plat.pedidosRestaurarReglas).toHaveLength(1);
      expect((await leerLog()).reglas).toEqual([]);
    });

    it('un UAC cancelado al restaurar no recrea nada y conserva el registro', async () => {
      const d = new Doctor(deps());
      await d.reparar(quitar(await revisar(d)).id, true);
      plat.uacCancelado = true;
      const q = d.ultimo().find((x) => x.id === 'firewall:quitadas')!;
      expect(await d.reparar(q.id, true)).toEqual({
        ok: false,
        codigo: 'doctor.reparacion_cancelada',
      });
      expect(nombresEnPie()).toEqual(['{FLY-1}']);
      expect((await leerLog()).reglas).toHaveLength(2);
    });

    it('un registro editado a mano con un programa ajeno no se ofrece ni se recrea', async () => {
      await mkdir(join(datos, 'etc'), { recursive: true });
      const base = (await plat.exportarReglasFirewall(['{A-1}']))![0]!;
      const malas = [
        { ...base, nombre: '{X-1}', programa: FLY },
        { ...base, nombre: '{X-2}', accion: 'Block' },
        { ...base, nombre: '{X-3}', puertoLocal: ["80'; calc; '"] },
      ];
      await writeFile(
        rutaRegistro(datos),
        JSON.stringify({
          version: 1,
          reglas: malas.map((r) => ({
            fecha: 'x',
            nombre: r.nombre,
            programa: r.programa,
            perfil: r.perfil,
            regla: r,
          })),
        }),
      );
      const hs = await revisar(new Doctor(deps()));
      expect(hs.some((x) => x.id === 'firewall:quitadas')).toBe(false);
    });
  });

  describe('scripts del cortafuegos real (solo se comprueba su texto: nunca se ejecutan)', () => {
    const base = { nombre: '{AAAA-1}', programa: 'C:\\Datos\\bin\\nginx.exe', raiz: 'C:\\Datos' };

    it('quitar actúa por Name exacto y vuelve a comprobar entrada, Allow, programa y raíz', () => {
      const s = scriptQuitarReglas([base], 1_800_000_000_000);
      expect(s).toContain('Remove-NetFirewallRule -Name $e.n');
      expect(s).not.toMatch(/-DisplayName|-Program\b|\*/);
      expect(s).toContain("$r.Direction -eq 'Inbound'");
      expect(s).toContain("$r.Action -eq 'Allow'");
      expect(s).toContain('[WolfRuta]::Real');
      expect(s).toContain("n = '{AAAA-1}'");
      expect(s).toContain('exit 41');
      expect(s).toContain('exit 11');
    });

    it('rechaza nombres con comodines o comillas', () => {
      for (const n of ['*', 'a?b', '[a]', "a'; calc", 'a\nb', '']) {
        expect(() => scriptQuitarReglas([{ ...base, nombre: n }], null)).toThrow(/no válido/);
        expect(() => scriptExportarReglas([n])).toThrow(/no válido/);
      }
    });

    it('restaurar solo recrea reglas de entrada Allow de forma conocida', () => {
      const r: ReglaExportada = {
        nombre: '{AAAA-1}',
        nombreVisible: 'nginx',
        descripcion: "it's",
        habilitada: true,
        perfil: 'Public, Private',
        direccion: 'Inbound',
        accion: 'Allow',
        programa: base.programa,
        protocolo: 'TCP',
        puertoLocal: ['80'],
        puertoRemoto: ['Any'],
        direccionLocal: ['Any'],
        direccionRemota: ['LocalSubnet'],
      };
      const s = scriptRestaurarReglas([{ regla: r, raiz: base.raiz }], null);
      expect(s).toContain('New-NetFirewallRule -Name');
      expect(s).toContain("-Description 'it''s'");
      expect(s).toContain("-Profile @('Public', 'Private')");
      expect(s).toContain("-LocalPort @('80')");
      expect(s).not.toContain('-RemotePort');
      expect(() =>
        scriptRestaurarReglas([{ regla: { ...r, accion: 'Block' }, raiz: base.raiz }], null),
      ).toThrow();
      expect(() =>
        scriptRestaurarReglas(
          [{ regla: { ...r, puertoLocal: ["1'; x; '"] }, raiz: base.raiz }],
          null,
        ),
      ).toThrow();
    });
  });
});

describe('D46: nombres de regla que crea Windows (con barras, dos puntos y llaves)', () => {
  it('se listan y se quitan por su Name exacto', async () => {
    const nombre = `TCP Query User{88DB9641-6D7E-41E6-8660-45595C147EA6}${nginx}`;
    plat.reglasEntrada = { ok: true, reglas: [regla(nombre, nginx)] };
    const d = new Doctor(deps());
    const h = quitar(await revisar(d));
    expect(h.evidencia).toContain(nombre);
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
