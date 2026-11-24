import { describe, expect, it } from 'vitest';
import type { VersionDisponible } from '../src/catalogo/catalogo';
import { armarTabla, huellaDeFila, type EntradaTabla } from '../src/catalogo/tablaVersiones';
import type { EstadoInstancia } from '../src/tipos';

const v = (
  version: string,
  rama: string,
  extra: Partial<VersionDisponible> = {},
): VersionDisponible => ({
  servicio: 'mysql',
  version,
  rama,
  url: `https://cdn.mysql.com/${version}.zip`,
  sha256: null,
  formato: 'zip',
  huella: null,
  soporte: rama === '8.4' ? 'lts' : 'fin',
  finSoporte: rama === '8.4' ? '2032-04-30' : '2026-04-30',
  ...extra,
});

const instancia = (clave: string, version: string, o: Partial<EstadoInstancia> = {}) =>
  ({
    id: `mysql@${clave}`,
    servicio: 'mysql',
    clave,
    version,
    puerto: clave === '8.4' ? 3306 : 3308,
    estado: 'apagado',
    pid: null,
    predeterminada: clave === '8.4',
    autoIniciar: false,
    tieneDatos: true,
    bloqueo: null,
    ...o,
  }) as EstadoInstancia;

function entrada(o: Partial<EntradaTabla> = {}): EntradaTabla {
  return {
    servicio: 'mysql',
    listado: {
      origen: 'vivo',
      fecha: '2026-11-23T10:00:00.000Z',
      versiones: [v('8.4.15', '8.4'), v('8.4.14', '8.4'), v('8.0.46', '8.0')],
    },
    instaladas: ['8.4.13', '8.0.46'],
    encendidas: [],
    instancias: [
      instancia('8.4', '8.4.13', { estado: 'encendido' }),
      instancia('8.0', '8.0.46', { bloqueo: { fecha: 'x', fallida: 'f', respaldo: 'r' } }),
    ],
    predeterminada: '8.4.13',
    ramaDe: (x) => x.split('.').slice(0, 2).join('.'),
    ...o,
  };
}

describe('armarTabla (pestaña Versiones)', () => {
  it('agrupa por rama (más nueva primero) con soporte y fin de soporte; suma lo instalado no publicado', () => {
    const t = armarTabla(entrada());
    expect(t.interruptor).toBe('instancias');
    expect(t.ramas.map((r) => [r.rama, r.soporte, r.finSoporte])).toEqual([
      ['8.4', 'lts', '2032-04-30'],
      ['8.0', 'fin', '2026-04-30'],
    ]);
    expect(t.ramas[0]!.versiones.map((f) => f.version)).toEqual(['8.4.15', '8.4.14', '8.4.13']);
  });

  it('marcas: instalada, encendida, con actualización, predeterminada única, instancia y puerto', () => {
    const t = armarTabla(entrada());
    const f = (x: string) => t.ramas.flatMap((r) => r.versiones).find((y) => y.version === x)!;
    expect(f('8.4.13')).toMatchObject({
      instalada: true,
      encendida: true,
      actualizacion: '8.4.15',
      predeterminada: true,
      instancia: 'mysql@8.4',
      puerto: 3306,
      bloqueada: false,
    });
    expect(f('8.4.15')).toMatchObject({ instalada: false, encendida: false, actualizacion: null });
    expect(f('8.0.46')).toMatchObject({
      instancia: 'mysql@8.0',
      puerto: 3308,
      actualizacion: null,
      bloqueada: true,
    });
    const predeterminadas = t.ramas.flatMap((r) => r.versiones).filter((x) => x.predeterminada);
    expect(predeterminadas).toHaveLength(1);
  });

  it('Nginx: una sola encendida; runtimes sin interruptor', () => {
    const nginx = armarTabla(
      entrada({
        servicio: 'nginx',
        instaladas: ['8.4.13', '8.4.14'],
        encendidas: ['8.4.14'],
        instancias: [],
      }),
    );
    expect(nginx.interruptor).toBe('unica');
    expect(
      nginx.ramas
        .flatMap((r) => r.versiones)
        .filter((f) => f.encendida)
        .map((f) => f.version),
    ).toEqual(['8.4.14']);
    const node = armarTabla(entrada({ servicio: 'node', encendidas: ['8.4.13'], instancias: [] }));
    expect(node.interruptor).toBe('ninguno');
    expect(node.ramas.flatMap((r) => r.versiones).some((f) => f.encendida)).toBe(false);
  });

  it('huella: Node, Nginx y Composer ≥ 2.1 publican firma PGP = firmada', () => {
    const con = (servicio: VersionDisponible['servicio'], version: string) =>
      huellaDeFila({ ...v(version, '1'), servicio });
    expect(con('nginx', '1.30.6')).toBe('firmada');
    expect(con('node', '24.22.3')).toBe('firmada');
    expect(con('composer', '2.11.2')).toBe('firmada');
    expect(con('composer', '2.0.2')).toBe('ninguna');
  });

  it('huella: SHA-256/512 o diferida = fuerte, MD5 = débil, sin nada = ninguna', () => {
    expect(
      huellaDeFila(v('1', '1', { huella: { algoritmo: 'sha512', valor: 'a'.repeat(128) } })),
    ).toBe('fuerte');
    expect(huellaDeFila(v('1', '1', { huellaDiferida: true }))).toBe('fuerte');
    expect(huellaDeFila(v('1', '1', { huella: { algoritmo: 'md5', valor: 'a'.repeat(32) } }))).toBe(
      'debil',
    );
    expect(huellaDeFila(v('1', '1'))).toBe('ninguna');
    expect(huellaDeFila(v('1', '1', { sha256: 'a'.repeat(64) }))).toBe('fuerte');
  });
});

describe('envUsaPuerto (aviso al cambiar el puerto de una instancia)', () => {
  it('detecta *_PORT y localhost:puerto, sin confundir 3306 con 33060', async () => {
    const { envUsaPuerto } = await import('../src/nucleo');
    expect(envUsaPuerto('DB_HOST=127.0.0.1\nDB_PORT=3306\n', 3306)).toBe(true);
    expect(envUsaPuerto('DB_PORT="3306"', 3306)).toBe(true);
    expect(envUsaPuerto('DATABASE_URL=mysql://u:p@127.0.0.1:3306/db', 3306)).toBe(true);
    expect(envUsaPuerto('DB_PORT=33060', 3306)).toBe(false);
    expect(envUsaPuerto('REDIS_URL=redis://localhost:33060', 3306)).toBe(false);
    expect(envUsaPuerto('APP_NAME=x', 3306)).toBe(false);
  });
});
