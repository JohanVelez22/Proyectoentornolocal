import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CentroAvisos,
  TIPOS_AVISO,
  conectarFuentesAvisos,
  revisarVencimientos,
  type Aviso,
} from '../src/avisos/avisos';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { emitirCertificado, generarCA } from '../src/https/ca';
import { GestorHttps } from '../src/https/certificados';
import { ErrorPuertoOcupado } from '../src/servicios/nginx';
import { Servicios } from '../src/servicios/servicios';
import { Rutas } from '../src/rutas';
import { ConfigSchema } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const MIN = 60_000;
const centros: CentroAvisos[] = [];
// Las escrituras pendientes terminan antes de que se borre la carpeta temporal.
afterEach(async () => {
  await Promise.all(centros.splice(0).map((c) => c.guardado()));
});
type Entrada = Omit<Aviso, 'id' | 'fecha' | 'leido'>;

async function crear(opciones: { ahora?: () => number } = {}) {
  const base = await carpetaTemporal('pel-avisos-');
  const archivo = path.join(base, 'run', 'avisos.json');
  const emitidos: Aviso[] = [];
  const ahora = opciones.ahora;
  const centro = new CentroAvisos({
    archivo,
    emitir: (a) => emitidos.push(a),
    ...(ahora ? { ahora: () => new Date(ahora()) } : {}),
  });
  centros.push(centro);
  return { base, archivo, emitidos, centro };
}

const base: Entrada = {
  nivel: 'error',
  tipo: 'servicio-caido',
  codigo: 'avisos.servicio_caido',
  datos: { fuente: 'mysql', nombre: 'MySQL' },
};

describe('CentroAvisos', () => {
  it('publica con id, fecha y no leído, y emite el evento', async () => {
    const { centro, emitidos } = await crear();
    const a = centro.publicar(base)!;
    expect(a.id).toBeTruthy();
    expect(a.leido).toBe(false);
    expect(Number.isNaN(Date.parse(a.fecha))).toBe(false);
    expect(emitidos).toEqual([a]);
    expect(centro.lista()).toEqual([a]);
  });

  it('agrupa por límite: el mismo tipo y fuente en 5 min no vuelve a publicar', async () => {
    let t = Date.parse('2026-11-19T10:00:00Z');
    const { centro, emitidos } = await crear({ ahora: () => t });
    expect(centro.publicar(base)).not.toBeNull();
    t += 4 * MIN;
    expect(centro.publicar(base)).toBeNull();
    // otra fuente del mismo tipo sí pasa
    expect(centro.publicar({ ...base, datos: { fuente: 'redis' } })).not.toBeNull();
    // otro tipo con la misma fuente también
    expect(centro.publicar({ ...base, tipo: 'puerto-ocupado' })).not.toBeNull();
    t += 2 * MIN;
    expect(centro.publicar(base)).not.toBeNull();
    expect(emitidos).toHaveLength(4);
  });

  it('marcarLeidos con ids, sin ids (todos) y limpiar', async () => {
    const { centro } = await crear();
    const a = centro.publicar(base)!;
    const b = centro.publicar({ ...base, datos: { fuente: 'redis' } })!;
    centro.marcarLeidos([a.id]);
    expect(centro.lista().find((x) => x.id === a.id)!.leido).toBe(true);
    expect(centro.lista().find((x) => x.id === b.id)!.leido).toBe(false);
    centro.marcarLeidos();
    expect(centro.lista().every((x) => x.leido)).toBe(true);
    centro.limpiar();
    expect(centro.lista()).toEqual([]);
  });

  it('persiste en run/avisos.json y lo recupera en otra instancia', async () => {
    const { centro, archivo } = await crear();
    const a = centro.publicar(base)!;
    await centro.guardado();
    expect(existsSync(archivo)).toBe(true);
    const otro = new CentroAvisos({ archivo, emitir: () => undefined });
    expect(otro.lista()).toEqual([a]);
  });

  it('conserva el foco de la acción al recargar y descarta un foco que no es texto', async () => {
    const { centro, archivo } = await crear();
    const a = centro.publicar({
      ...base,
      accion: { ruta: 'servicios', foco: 'servicio:mysql' },
    })!;
    await centro.guardado();
    expect(new CentroAvisos({ archivo, emitir: () => undefined }).lista()).toEqual([a]);
    const crudo = JSON.parse(readFileSync(archivo, 'utf8')) as { accion: { foco?: unknown } }[];
    crudo[0]!.accion.foco = 42;
    writeFileSync(archivo, JSON.stringify(crudo));
    const recargado = new CentroAvisos({ archivo, emitir: () => undefined }).lista();
    expect(recargado[0]!.accion).toEqual({ ruta: 'servicios' });
  });

  it('el historial se queda en 200 (los más nuevos primero)', async () => {
    let t = Date.parse('2026-11-19T10:00:00Z');
    const { centro, archivo } = await crear({ ahora: () => t });
    for (let i = 0; i < 205; i++) {
      t += 10 * MIN;
      centro.publicar({ ...base, datos: { fuente: `s${i}` } });
    }
    await centro.guardado();
    const l = centro.lista();
    expect(l).toHaveLength(200);
    expect(l[0]!.datos['fuente']).toBe('s204');
    expect(l[199]!.datos['fuente']).toBe('s5');
    expect((JSON.parse(readFileSync(archivo, 'utf8')) as unknown[]).length).toBe(200);
  });

  it('un archivo dañado o con entradas inválidas no rompe el arranque', async () => {
    const { archivo } = await crear();
    mkdirSync(path.dirname(archivo), { recursive: true });
    writeFileSync(archivo, '{no es json');
    expect(new CentroAvisos({ archivo, emitir: () => undefined }).lista()).toEqual([]);
    writeFileSync(archivo, JSON.stringify([{ id: 1 }, null, 'x']));
    expect(new CentroAvisos({ archivo, emitir: () => undefined }).lista()).toEqual([]);
  });

  it('un tipo desactivado en la configuración no se publica', async () => {
    const { centro, emitidos } = await crear();
    centro.fijarConfig({
      nativas: true,
      tipos: {
        ...Object.fromEntries(TIPOS_AVISO.map((t) => [t, true])),
        'servicio-caido': false,
      } as never,
    });
    expect(centro.publicar(base)).toBeNull();
    expect(emitidos).toHaveLength(0);
    expect(centro.publicar({ ...base, tipo: 'tunel-caido' })).not.toBeNull();
  });

  it('los tipos nuevos vienen activos y una configuracion vieja sin su clave los deja activos', async () => {
    expect(TIPOS_AVISO).toContain('proceso-terminado');
    expect(TIPOS_AVISO).toContain('receta-terminada');
    const vieja = ConfigSchema.parse({ avisos: { tipos: { 'servicio-caido': false } } });
    expect(vieja.avisos.tipos['proceso-terminado']).toBe(true);
    expect(vieja.avisos.tipos['receta-terminada']).toBe(true);
    expect(vieja.avisos.tipos['servicio-caido']).toBe(false);
    const { centro } = await crear();
    centro.fijarConfig({ nativas: true, tipos: { 'servicio-caido': true } as never });
    expect(centro.publicar({ ...base, tipo: 'proceso-terminado' })).not.toBeNull();
    expect(centro.nativaPermitida('receta-terminada')).toBe(true);
  });

  it('un tipo nuevo desactivado no publica', async () => {
    const { centro } = await crear();
    centro.fijarConfig({
      nativas: true,
      tipos: {
        ...Object.fromEntries(TIPOS_AVISO.map((t) => [t, true])),
        'proceso-terminado': false,
      } as never,
    });
    expect(centro.publicar({ ...base, tipo: 'proceso-terminado' })).toBeNull();
    expect(centro.publicar({ ...base, tipo: 'receta-terminada' })).not.toBeNull();
  });

  it('acota el texto de los datos y descarta lo que no sea texto o número', async () => {
    const { centro } = await crear();
    const a = centro.publicar({
      ...base,
      datos: { fuente: 'x', largo: 'a'.repeat(500), n: 3, raro: { a: 1 } as never },
    })!;
    expect((a.datos['largo'] as string).length).toBeLessThanOrEqual(201);
    expect(a.datos['n']).toBe(3);
    expect('raro' in a.datos).toBe(false);
  });
});

describe('fuentes de avisos', () => {
  function montar() {
    const eventos = new Eventos<EventosNucleo>();
    const publicados: Entrada[] = [];
    const baja = conectarFuentesAvisos(eventos, {
      publicar: (a) => {
        publicados.push(a);
        return null;
      },
    });
    return { eventos, publicados, baja };
  }
  const est = (estado: string, extra = {}) =>
    ({
      id: 'mysql',
      nombre: 'MySQL',
      version: null,
      estado,
      puertos: [3306],
      pid: 1,
      ...extra,
    }) as never;

  it('servicio que pasa a error publica servicio-caido sin el mensaje (puede traer logs)', () => {
    const { eventos, publicados } = montar();
    eventos.emit('servicio:estado', est('encendido'));
    eventos.emit('servicio:estado', est('error', { mensaje: 'C:/secreto/log token=abc' }));
    eventos.emit('servicio:estado', est('error', { mensaje: 'otro' }));
    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({
      tipo: 'servicio-caido',
      nivel: 'error',
      codigo: 'avisos.servicio_caido',
      datos: { fuente: 'mysql', nombre: 'MySQL' },
      accion: { ruta: 'servicios', foco: 'servicio:mysql' },
    });
    expect(JSON.stringify(publicados[0])).not.toMatch(/secreto|token/);
  });

  it('un servicio que se ve por primera vez en error no avisa (estado viejo al abrir)', () => {
    const { eventos, publicados } = montar();
    eventos.emit('servicio:estado', est('error'));
    expect(publicados).toHaveLength(0);
  });

  it('apagar normalmente no avisa', () => {
    const { eventos, publicados } = montar();
    eventos.emit('servicio:estado', est('encendido'));
    eventos.emit('servicio:estado', est('apagado'));
    expect(publicados).toHaveLength(0);
  });

  it('un proceso de proyecto en error publica proceso-error', () => {
    const { eventos, publicados } = montar();
    const e = (estado: string) =>
      ({
        id: 'proy-mi-sitio-web',
        nombre: 'web (mi.test)',
        categoria: 'proyecto',
        version: null,
        estado,
        puertos: [],
        pid: null,
      }) as never;
    eventos.emit('servicio:estado', e('iniciando'));
    eventos.emit('servicio:estado', e('error'));
    expect(publicados[0]).toMatchObject({
      tipo: 'proceso-error',
      codigo: 'avisos.proceso_error',
      accion: { ruta: 'proyectos', foco: 'proceso:mi-sitio:web' },
    });
  });

  describe('procesos y recetas que terminan', () => {
    const e = (estado: string, extra = {}) =>
      ({
        id: 'proy-mi-sitio-web',
        nombre: 'web (mi.test)',
        categoria: 'proyecto',
        version: null,
        estado,
        puertos: [],
        pid: null,
        ...extra,
      }) as never;
    const terminado = (codigo: number | null) =>
      ({ id: 'proy-mi-sitio-web', sitioId: 'mi-sitio', codigo }) as const;

    it('codigo 0: proceso-terminado info con el nombre del proceso', () => {
      const { eventos, publicados } = montar();
      eventos.emit('servicio:estado', e('encendido'));
      eventos.emit('proceso:terminado', terminado(0));
      eventos.emit('servicio:estado', e('apagado', { mensaje: 'terminado' }));
      expect(publicados).toHaveLength(1);
      expect(publicados[0]).toMatchObject({
        nivel: 'info',
        tipo: 'proceso-terminado',
        codigo: 'avisos.proceso_terminado',
        datos: { fuente: 'proy-mi-sitio-web', nombre: 'web (mi.test)' },
        accion: { ruta: 'proyectos', foco: 'proceso:mi-sitio:web' },
      });
    });

    it('otro codigo: proceso-error con el codigo de salida, y el estado error no repite', () => {
      const { eventos, publicados } = montar();
      eventos.emit('servicio:estado', e('encendido'));
      eventos.emit('proceso:terminado', terminado(3));
      eventos.emit('servicio:estado', e('error', { mensaje: 'C:/secreto token=abc' }));
      expect(publicados).toHaveLength(1);
      expect(publicados[0]).toMatchObject({
        nivel: 'error',
        tipo: 'proceso-error',
        codigo: 'avisos.proceso_fallo',
        datos: { fuente: 'proy-mi-sitio-web', nombre: 'web (mi.test)', codigoSalida: 3 },
        accion: { ruta: 'proyectos', foco: 'proceso:mi-sitio:web' },
      });
      expect(JSON.stringify(publicados[0])).not.toMatch(/secreto|token/);
    });

    it('sin codigo (senal): proceso_fallo sin codigoSalida', () => {
      const { eventos, publicados } = montar();
      eventos.emit('proceso:terminado', terminado(null));
      expect(publicados[0]).toMatchObject({ codigo: 'avisos.proceso_fallo' });
      expect(publicados[0]!.datos).not.toHaveProperty('codigoSalida');
    });

    it('un error de arranque (sin salida) sigue avisando por el estado, tambien tras terminar bien', () => {
      const { eventos, publicados } = montar();
      eventos.emit('servicio:estado', e('iniciando'));
      eventos.emit('servicio:estado', e('error'));
      eventos.emit('proceso:terminado', terminado(0));
      eventos.emit('servicio:estado', e('apagado', { mensaje: 'terminado' }));
      eventos.emit('servicio:estado', e('iniciando'));
      eventos.emit('servicio:estado', e('error'));
      expect(publicados.map((p) => p.codigo)).toEqual([
        'avisos.proceso_error',
        'avisos.proceso_terminado',
        'avisos.proceso_error',
      ]);
    });

    it('receta: lista da receta_terminada (info) y error da receta_fallo (error)', () => {
      const { eventos, publicados } = montar();
      eventos.emit('receta:terminada', { sitioId: 'mi-sitio', estado: 'error' });
      eventos.emit('receta:terminada', { sitioId: 'mi-sitio', estado: 'lista' });
      expect(publicados).toHaveLength(2);
      expect(publicados[0]).toMatchObject({
        nivel: 'error',
        tipo: 'receta-terminada',
        codigo: 'avisos.receta_fallo',
        datos: { sitio: 'mi-sitio' },
        accion: { ruta: 'proyectos', foco: 'sitio:mi-sitio' },
      });
      expect(publicados[1]).toMatchObject({
        nivel: 'info',
        tipo: 'receta-terminada',
        codigo: 'avisos.receta_terminada',
        datos: { sitio: 'mi-sitio' },
      });
      // Las fuentes difieren: en el centro real no se agrupan entre si.
      expect(publicados[0]!.datos['fuente']).not.toBe(publicados[1]!.datos['fuente']);
    });
  });

  it('tunel caido: de activo a error', () => {
    const { eventos, publicados } = montar();
    eventos.emit('tunel:estado', {
      sitioId: 'blog',
      estado: 'activo',
      url: 'https://x.trycloudflare.com',
    });
    eventos.emit('tunel:estado', { sitioId: 'blog', estado: 'error', url: null });
    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({
      tipo: 'tunel-caido',
      datos: { fuente: 'blog' },
      accion: { ruta: 'tuneles' },
    });
    expect(JSON.stringify(publicados[0])).not.toContain('trycloudflare');
  });

  it('la baja deja de escuchar', () => {
    const { eventos, publicados, baja } = montar();
    baja();
    eventos.emit('servicio:estado', est('encendido'));
    eventos.emit('servicio:estado', est('error'));
    expect(publicados).toHaveLength(0);
  });
});

describe('Servicios: puerto ocupado', () => {
  it('publica puerto-ocupado y repropaga el error', async () => {
    const avisos: unknown[] = [];
    const s = new Servicios({
      rutas: new Rutas('/x'),
      plataforma: {} as never,
      supervisor: {} as never,
      instalador: {} as never,
      leerConfig: async () => ConfigSchema.parse({}),
      modificarConfig: async () => undefined,
      ftp: {
        estado: (() => undefined) as never,
        iniciar: async () => {
          throw new ErrorPuertoOcupado(2121, 77, 'otro.exe');
        },
        detener: async () => undefined,
      },
      avisar: (a) => void avisos.push(a),
    });
    await expect(s.iniciar('ftp')).rejects.toBeInstanceOf(ErrorPuertoOcupado);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: 'puerto-ocupado',
      codigo: 'avisos.puerto_ocupado',
      datos: { fuente: 'ftp', puerto: 2121, nombre: 'otro.exe' },
    });
  });
});

describe('vencimiento de certificados', () => {
  const DIA = 86_400_000;
  async function conCerts(diasCa: number, diasCert: number) {
    const dir = await carpetaTemporal('pel-venc-');
    const rutas = new Rutas(dir);
    mkdirSync(path.join(dir, 'ca'), { recursive: true });
    mkdirSync(path.join(dir, 'certs'), { recursive: true });
    const hoy = new Date('2026-11-19T12:00:00Z');
    // La CA dura 3652 días y el certificado 825: se fija "ahora" para que queden `dias` por delante.
    const ca = generarCA(new Date(hoy.getTime() - (3652 - diasCa) * DIA));
    writeFileSync(rutas.caCrt(), ca.certPem);
    writeFileSync(rutas.caKey(), ca.keyPem);
    const c = emitirCertificado(ca, ['mi.test'], new Date(hoy.getTime() - (825 - diasCert) * DIA));
    writeFileSync(rutas.certCrt('mi'), c.certPem);
    writeFileSync(rutas.certKey('mi'), c.keyPem);
    return new GestorHttps({ rutas, plataforma: {} as never, ahora: () => hoy });
  }

  it('vencimientos() lista la CA y cada certificado con sus días', async () => {
    const https = await conCerts(2000, 29);
    const v = await https.vencimientos();
    expect(v.find((x) => x.id === 'ca')!.dias).toBeGreaterThanOrEqual(1999);
    expect(v.find((x) => x.id === 'mi')!.dias).toBe(29);
  });

  it('un certificado a 29 días publica un aviso; a 31 no', async () => {
    const publicados: Entrada[] = [];
    const centro = {
      publicar: (a: Entrada) => void publicados.push(a),
      lista: () => [] as Aviso[],
    };
    await revisarVencimientos(await conCerts(2000, 29), centro);
    expect(publicados).toHaveLength(1);
    expect(publicados[0]).toMatchObject({
      tipo: 'certificado-por-vencer',
      nivel: 'aviso',
      codigo: 'avisos.certificado_por_vencer',
      datos: { fuente: 'mi', dias: 29 },
    });
    publicados.length = 0;
    await revisarVencimientos(await conCerts(2000, 31), centro);
    expect(publicados).toHaveLength(0);
  });

  it('la CA por vencer usa su propio código y un certificado vencido es de nivel error', async () => {
    const publicados: Entrada[] = [];
    await revisarVencimientos(await conCerts(10, -2), {
      publicar: (a) => void publicados.push(a),
      lista: () => [],
    });
    expect(publicados.find((p) => p.datos['fuente'] === 'ca')).toMatchObject({
      codigo: 'avisos.ca_por_vencer',
      nivel: 'aviso',
    });
    expect(publicados.find((p) => p.datos['fuente'] === 'mi')).toMatchObject({
      codigo: 'avisos.certificado_vencido',
      nivel: 'error',
    });
  });

  it('no repite un aviso que sigue sin leer', async () => {
    const existente: Aviso = {
      id: '1',
      fecha: '',
      leido: false,
      nivel: 'aviso',
      tipo: 'certificado-por-vencer',
      codigo: 'avisos.certificado_por_vencer',
      datos: { fuente: 'mi', dias: 30 },
    };
    const publicados: unknown[] = [];
    await revisarVencimientos(await conCerts(2000, 29), {
      publicar: (a) => void publicados.push(a),
      lista: () => [existente],
    });
    expect(publicados).toHaveLength(0);
  });
});
