import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenCredenciales } from '../src/almacen';
import { BasesDeDatos } from '../src/bd/basesDeDatos';
import type { Plataforma } from '../src/plataforma/tipos';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { claveMayor, Rutas } from '../src/rutas';
import type { CtxServicio, DefServicio } from '../src/servicios/definicion';
import { esIdInstancia, parsearInstancia } from '../src/servicios/instancias';
import { Servicios } from '../src/servicios/servicios';
import { ConfigSchema, type Config } from '../src/tipos';
import { carpetaTemporal } from './temporales';

let base: string;
let rutas: Rutas;
let cfg: Config;
let instalados: Record<string, string[]>;
let estados: Map<string, EstadoProceso>;
let iniciados: DefProceso[];
let contextos: CtxServicio[];
let ocupados: Map<number, { pid: number; nombre: string }>;
let reservados: { desde: number; hasta: number }[];
let credenciales: AlmacenCredenciales;
let renombrados: string[];

const def = (o: Partial<DefServicio> & Pick<DefServicio, 'id' | 'nombre'>): DefServicio => ({
  categoria: 'bd',
  puertoPorDefecto: 3306,
  async inicializar(c) {
    mkdirSync(c.datos, { recursive: true });
    writeFileSync(path.join(c.datos, 'ibdata1'), c.version);
  },
  async proceso(c) {
    contextos.push(c);
    return {
      id: o.id,
      comando: path.join(c.bin, 'bin', 'servidor.exe'),
      args: [`--port=${c.puerto}`, `--datadir=${c.datos}`],
      puerto: c.puerto,
      log: c.rutas.logs(`${o.id}.log`),
      reiniciar: false,
    };
  },
  ...o,
});

const defs = (): DefServicio[] => [
  def({ id: 'mysql', nombre: 'MySQL', puertoPorDefecto: 3306, puertoAlternativo: 3308 }),
  def({ id: 'mariadb', nombre: 'MariaDB', puertoPorDefecto: 3307 }),
  def({ id: 'postgresql', nombre: 'PostgreSQL', puertoPorDefecto: 5432, claveDatos: claveMayor }),
  def({
    id: 'mailpit',
    nombre: 'Mailpit',
    categoria: 'herramienta',
    puertoPorDefecto: 1025,
    puertosExtra: [8025],
    claveDatos: () => 'actual',
    multiInstancia: false,
  }),
];

function crear(): Servicios {
  return new Servicios({
    rutas,
    plataforma: {
      quienUsaPuerto: async (p: number) => ocupados.get(p) ?? null,
      duenosDePuertos: async (ps: number[]) =>
        new Map(ps.filter((x) => ocupados.has(x)).map((x) => [x, ocupados.get(x)!])),
      rangosReservados: async () => reservados,
    } as unknown as Plataforma,
    supervisor: {
      iniciar: async (d: DefProceso) => {
        iniciados.push(d);
        estados.set(d.id, 'encendido');
      },
      detener: async (id: string) => {
        estados.delete(id);
      },
      estado: (id: string) => estados.get(id) ?? 'apagado',
      pid: (id: string) => (estados.has(id) ? 1000 : null),
      renombrarRegistro: (a: string, b: string) => {
        renombrados.push(`${a}->${b}`);
        const e = estados.get(a);
        if (e) {
          estados.delete(a);
          estados.set(b, e);
        }
      },
    } as never,
    instalador: {
      instalados: async (s: string) => instalados[s] ?? [],
      instalado: async (s: string, v: string) => (instalados[s] ?? []).includes(v),
    } as never,
    leerConfig: async () => cfg,
    modificarConfig: async (fn) => {
      const copia = structuredClone(cfg);
      fn(copia);
      cfg = ConfigSchema.parse(copia);
    },
    credenciales,
    sonda: async () => false,
    definiciones: defs(),
    existePid: () => false,
  });
}

beforeEach(async () => {
  base = await carpetaTemporal('pel-instancias-');
  rutas = new Rutas(base);
  cfg = ConfigSchema.parse({});
  instalados = { mysql: ['8.0.44', '8.4.13'], mariadb: [], mailpit: ['1.29.0'] };
  cfg.servicios.datos.mysql.version = '8.4.13';
  estados = new Map();
  iniciados = [];
  contextos = [];
  ocupados = new Map();
  reservados = [];
  credenciales = new AlmacenCredenciales(rutas);
  renombrados = [];
});

describe('ids de instancia', () => {
  it('servicio@clave con minúsculas, dígitos y puntos; sin .. ni rutas', () => {
    expect(parsearInstancia('mysql@8.4')).toEqual({ servicio: 'mysql', clave: '8.4' });
    expect(parsearInstancia('postgresql@17')).toEqual({ servicio: 'postgresql', clave: '17' });
    for (const malo of [
      'mysql',
      'mysql@',
      'mysql@8..4',
      'mysql@../x',
      'nginx@1.30',
      'MYSQL@8.4',
      'mysql@8.4/x',
      'mysql@.8',
      'mysql@' + '1'.repeat(17),
    ]) {
      expect(esIdInstancia(malo), malo).toBe(false);
      expect(() => parsearInstancia(malo), malo).toThrow(
        expect.objectContaining({ codigo: 'instancias.id_invalido' }),
      );
    }
  });
});

describe('Instancias', () => {
  it('mysql@8.0 y mysql@8.4 con puertos, carpetas y credenciales distintos', async () => {
    const s = crear();
    expect(await s.datos.instancias.crear('mysql', '8.0.44')).toBe('mysql@8.0');
    // La implícita pasó a mysql@8.4 con su puerto de siempre y es la predeterminada.
    expect(cfg.servicios.datos.mysql).toMatchObject({
      predeterminada: '8.4',
      instancias: {
        '8.4': { version: '8.4.13', puerto: 3306 },
        // 3307 es de MariaDB (aunque no esté instalada).
        '8.0': { version: '8.0.44', puerto: 3308, autoIniciar: false },
      },
    });
    await s.datos.instancias.iniciar('mysql@8.0');
    await s.iniciar('mysql');
    const [a, b] = contextos;
    expect(a!.datos).toBe(path.join(base, 'data', 'mysql', '8.0'));
    expect(b!.datos).toBe(path.join(base, 'data', 'mysql', '8.4'));
    expect([a!.puerto, b!.puerto]).toEqual([3308, 3306]);
    expect(a!.credenciales.clave).not.toBe(b!.credenciales.clave);
    expect((await credenciales.leer('mysql@8.0'))?.clave).toBe(a!.credenciales.clave);
    expect(iniciados.map((d) => d.id)).toEqual(['mysql@8.0', 'mysql@8.4']);
    // Cada una con su propio registro.
    expect(iniciados[0]!.log).toBe(rutas.logs('mysql-8.0.log'));
    const lista = await s.datos.instancias.lista('mysql');
    expect(lista.map((i) => [i.id, i.estado, i.predeterminada, i.tieneDatos])).toEqual([
      ['mysql@8.0', 'encendido', false, true],
      ['mysql@8.4', 'encendido', true, true],
    ]);
    const estado = (await s.estados()).find((e) => e.id === 'mysql')!;
    expect(estado).toMatchObject({ version: '8.4.13', puertos: [3306], estado: 'encendido' });
    expect(estado.instancias?.map((i) => i.id)).toEqual(['mysql@8.0', 'mysql@8.4']);
  });

  it('una rama que ya tiene instancia no se crea dos veces', async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await expect(s.datos.instancias.crear('mysql', '8.0.44')).rejects.toMatchObject({
      codigo: 'instancias.existe',
    });
    await expect(s.datos.instancias.crear('mysql', '8.4.13')).rejects.toMatchObject({
      codigo: 'instancias.existe',
    });
  });

  it('el puerto nuevo salta los ocupados, los fijos de la app y un rango reservado', async () => {
    ocupados.set(3308, { pid: 9, nombre: 'otro.exe' });
    reservados = [{ desde: 3309, hasta: 3310 }];
    cfg.https.puerto = 3311;
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    expect(cfg.servicios.datos.mysql.instancias?.['8.0']?.puerto).toBe(3312);
  });

  it('cambiarPuerto al de otra instancia propia falla; a uno libre, se guarda', async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await expect(s.datos.instancias.cambiarPuerto('mysql@8.0', 3306)).rejects.toMatchObject({
      codigo: 'servicios.puerto_asignado',
      datos: { puerto: 3306, otro: 'MySQL 8.4' },
    });
    await expect(s.cambiarPuerto('mysql', 3308)).rejects.toMatchObject({
      codigo: 'servicios.puerto_asignado',
    });
    await s.datos.instancias.cambiarPuerto('mysql@8.0', 3400);
    expect(cfg.servicios.datos.mysql.instancias?.['8.0']?.puerto).toBe(3400);
    // La predeterminada se refleja en el puerto del servicio.
    await s.cambiarPuerto('mysql', 3401);
    expect(cfg.servicios.datos.mysql.puerto).toBe(3401);
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.puerto).toBe(3401);
  });

  it('Mailpit no admite una segunda instancia', async () => {
    await expect(crear().datos.instancias.crear('mailpit', '1.29.0')).rejects.toMatchObject({
      codigo: 'instancias.una_sola',
    });
  });

  it("borrarDatos('mysql@8.0', 'mysql@8.0') deja intacta data/mysql/8.4; mal confirmada falla", async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await s.datos.instancias.iniciar('mysql@8.0');
    await s.datos.instancias.iniciar('mysql@8.4');
    const viva = path.join(base, 'data', 'mysql', '8.4', 'ibdata1');
    expect(readFileSync(viva, 'utf8')).toBe('8.4.13');
    for (const mala of ['mysql', 'mysql@8.4', 'MYSQL@8.0', '']) {
      await expect(s.datos.instancias.borrarDatos('mysql@8.0', mala)).rejects.toMatchObject({
        codigo: 'servicios.confirmacion_borrado',
      });
    }
    expect(existsSync(path.join(base, 'data', 'mysql', '8.0'))).toBe(true);
    await s.datos.instancias.borrarDatos('mysql@8.0', 'mysql@8.0');
    expect(existsSync(path.join(base, 'data', 'mysql', '8.0'))).toBe(false);
    expect(readFileSync(viva, 'utf8')).toBe('8.4.13');
    // Se detuvo la que se borró, no la otra.
    expect(estados.get('mysql@8.0')).toBeUndefined();
    expect(estados.get('mysql@8.4')).toBe('encendido');
  });

  it('quitar la saca de la configuración y deja sus datos y credenciales; la última no se quita', async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await s.datos.instancias.iniciar('mysql@8.0');
    const clave = (await credenciales.leer('mysql@8.0'))!.clave;
    await s.datos.instancias.quitar('mysql@8.0');
    expect(cfg.servicios.datos.mysql.instancias?.['8.0']).toBeUndefined();
    expect(estados.get('mysql@8.0')).toBeUndefined();
    expect(existsSync(path.join(base, 'data', 'mysql', '8.0', 'ibdata1'))).toBe(true);
    expect((await credenciales.leer('mysql@8.0'))?.clave).toBe(clave);
    await expect(s.datos.instancias.quitar('mysql@8.4')).rejects.toMatchObject({
      codigo: 'instancias.ultima',
    });
    // Al volver a crearla abre lo mismo, con la misma clave.
    await s.datos.instancias.crear('mysql', '8.0.44');
    await s.datos.instancias.iniciar('mysql@8.0');
    expect(contextos.at(-1)!.credenciales.clave).toBe(clave);
  });

  it('predeterminar cambia a qué instancia van iniciar(servicio), credenciales y el puerto reflejado', async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await s.datos.instancias.predeterminar('mysql@8.0');
    expect(cfg.servicios.datos.mysql).toMatchObject({
      predeterminada: '8.0',
      version: '8.0.44',
      puerto: 3308,
    });
    await s.iniciar('mysql');
    expect(iniciados.map((d) => d.id)).toEqual(['mysql@8.0']);
    expect((await s.datos.credenciales('mysql')).clave).toBe(
      (await credenciales.leer('mysql@8.0'))!.clave,
    );
    await s.datos.instancias.autoIniciar('mysql@8.0', true);
    expect(cfg.servicios.datos.mysql.autoIniciar).toBe(true);
    expect(cfg.servicios.datos.mysql.instancias?.['8.4']?.autoIniciar).toBe(false);
  });

  it('al pasar a instancias, el proceso vivo y la credencial vieja siguen a la predeterminada', async () => {
    await credenciales.guardar('mysql', { usuario: 'root', clave: 'clave-falsa-vieja' });
    const s = crear();
    await s.iniciar('mysql'); // implícita: id de proceso y credencial de siempre
    expect(iniciados.map((d) => d.id)).toEqual(['mysql']);
    await s.datos.instancias.crear('mysql', '8.0.44');
    expect(renombrados).toEqual(['mysql->mysql@8.4']);
    expect(estados.get('mysql@8.4')).toBe('encendido');
    expect((await credenciales.leer('mysql@8.4'))?.clave).toBe('clave-falsa-vieja');
    expect((await credenciales.leer('mysql'))?.clave).toBe('clave-falsa-vieja');
    // No se vuelve a lanzar: ya está encendida con su id nuevo.
    await s.iniciar('mysql');
    expect(iniciados).toHaveLength(1);
  });

  it('versionEnUso: la versión de cada instancia', async () => {
    const s = crear();
    expect(await s.datos.versionEnUso('mysql', '8.4.13')).toBe('mysql@8.4');
    expect(await s.datos.versionEnUso('mysql', '8.0.44')).toBeNull();
    await s.datos.instancias.crear('mysql', '8.0.44');
    expect(await s.datos.versionEnUso('mysql', '8.0.44')).toBe('mysql@8.0');
  });
});

describe('BasesDeDatos por instancia', () => {
  const bdDe = (s: Servicios): BasesDeDatos =>
    new BasesDeDatos({
      servicios: {
        estados: () => s.estados(),
        instancias: (m) => s.datos.listaInstancias(m),
      },
      credenciales,
      rutas,
      exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
    });

  it('una instancia usa su puerto y su credencial; el motor solo, la predeterminada', async () => {
    const s = crear();
    await s.datos.instancias.crear('mysql', '8.0.44');
    await s.datos.instancias.iniciar('mysql@8.0');
    await s.iniciar('mysql');
    const bd = bdDe(s);
    const c80 = await bd.conexion('mysql@8.0');
    expect(c80).toMatchObject({ puerto: 3308, usuario: 'root', instancia: 'mysql@8.0' });
    expect(c80.clave).toBe((await credenciales.leer('mysql@8.0'))!.clave);
    const pred = await bd.conexion('mysql');
    expect(pred).toMatchObject({ puerto: 3306, instancia: 'mysql@8.4' });
    expect(pred.clave).toBe((await credenciales.leer('mysql@8.4'))!.clave);
    expect(await bd.bloqueEnv('mysql@8.0', 'tienda', 'laravel')).toContain('DB_PORT=3308');
    await expect(bd.conexion('mysql@9.9')).rejects.toMatchObject({
      codigo: 'instancias.no_existe',
    });
    await s.datos.instancias.detener('mysql@8.0');
    await expect(bd.conexion('mysql@8.0')).rejects.toMatchObject({
      codigo: 'bd.encender_servicio',
    });
    await expect(bd.conexion('mailpit@actual' as never)).rejects.toMatchObject({
      codigo: 'instancias.id_invalido',
    });
  });

  it('sin instancias configuradas, la implícita usa la credencial del servicio', async () => {
    await credenciales.guardar('mysql', { usuario: 'root', clave: 'clave-falsa-de-siempre' });
    const s = crear();
    await s.iniciar('mysql');
    const bd = bdDe(s);
    expect(await bd.conexion('mysql')).toEqual({
      host: '127.0.0.1',
      puerto: 3306,
      usuario: 'root',
      clave: 'clave-falsa-de-siempre',
    });
    expect((await bd.conexion('mysql@8.4')).clave).toBe('clave-falsa-de-siempre');
  });
});
