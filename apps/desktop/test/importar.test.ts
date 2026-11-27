import { describe, expect, it } from 'vitest';
import type { FilaImportar } from '../src/shared/api';
import {
  basesDeLaSeleccion,
  destinosBd,
  destinoSugerido,
  estadoFila,
  idsImportables,
  opcionesDeEjecucion,
  origenValido,
  resumenResultado,
} from '../src/renderer/utilidades/importar';

const fila = (o: Partial<FilaImportar> & { id: string; nombre: string }): FilaImportar => ({
  programa: 'laragon',
  carpeta: `C:/laragon/www/${o.nombre}`,
  dominio: `${o.nombre}.test`,
  php: '8.2',
  base: null,
  avisos: [],
  yaVinculado: false,
  dominioFinal: `${o.nombre}.test`,
  dominioEnUso: false,
  phpFinal: '8.2',
  baseExiste: null,
  ...o,
});

const filas: FilaImportar[] = [
  fila({
    id: 'laragon-aaaaaaaaaaaa',
    nombre: 'tienda',
    base: { motor: 'mysql', nombre: 'Tienda_DB' },
    baseExiste: true,
  }),
  fila({
    id: 'laragon-bbbbbbbbbbbb',
    nombre: 'blog',
    base: { motor: 'mysql', nombre: 'tienda_db' },
    baseExiste: true,
  }),
  fila({ id: 'laragon-cccccccccccc', nombre: 'viejo', yaVinculado: true }),
  fila({ id: 'laragon-dddddddddddd', nombre: 'otro', dominioEnUso: true }),
  fila({
    id: 'laragon-eeeeeeeeeeee',
    nombre: 'nuevo',
    base: { motor: 'mariadb', nombre: 'nuevo_db' },
    baseExiste: false,
  }),
];

describe('importar: utilidades de la interfaz', () => {
  it('solo se marca de entrada lo que se puede importar', () => {
    expect(idsImportables(filas)).toEqual([
      'laragon-aaaaaaaaaaaa',
      'laragon-bbbbbbbbbbbb',
      'laragon-eeeeeeeeeeee',
    ]);
    expect(estadoFila(filas[2]!)).toBe('yaVinculado');
    expect(estadoFila(filas[3]!)).toBe('dominioEnUso');
  });

  it('las bases de la selección no se repiten (sin distinguir mayúsculas) ni salen de lo no marcado', () => {
    const b = basesDeLaSeleccion(filas, ['laragon-aaaaaaaaaaaa', 'laragon-bbbbbbbbbbbb']);
    expect(b).toEqual([{ nombre: 'Tienda_DB', motor: 'mysql', existe: true }]);
    expect(basesDeLaSeleccion(filas, [])).toEqual([]);
  });

  it('destinos: MySQL y MariaDB por instancia; primero uno encendido', () => {
    const d = destinosBd([
      {
        id: 'mysql',
        nombre: 'MySQL',
        instancias: [
          { id: 'mysql@8.0', clave: '8.0', puerto: 3306, estado: 'apagado', predeterminada: true },
        ],
      },
      { id: 'mariadb', nombre: 'MariaDB', instancias: undefined },
      { id: 'postgresql', nombre: 'PostgreSQL', instancias: undefined },
    ] as never);
    expect(d.map((x) => x.value)).toEqual(['mysql@8.0', 'mariadb']);
    expect(d[0]!.apagada).toBe(true);
    expect(destinoSugerido(d)).toBe('mariadb');
    expect(destinoSugerido([])).toBeNull();
  });

  it('el origen necesita puerto y usuario válidos; la clave puede ir vacía', () => {
    expect(origenValido({ puerto: '3306', usuario: 'root', clave: '' })).toEqual({
      puerto: 3306,
      usuario: 'root',
    });
    for (const malo of [
      { puerto: '', usuario: 'root', clave: '' },
      { puerto: '0', usuario: 'root', clave: '' },
      { puerto: '70000', usuario: 'root', clave: '' },
      { puerto: '33a', usuario: 'root', clave: '' },
      { puerto: '3306', usuario: '  ', clave: '' },
    ]) {
      expect(origenValido(malo)).toBeNull();
    }
  });

  it('solo se piden reemplazos de bases que existen y se marcaron; sin bases no hay datos de origen', () => {
    const bases = basesDeLaSeleccion(filas, ['laragon-aaaaaaaaaaaa', 'laragon-eeeeeeeeeeee']);
    const base = {
      conBases: true,
      destino: 'mysql' as const,
      origen: { puerto: '3306', usuario: 'root', clave: 'x' },
      bases,
    };
    expect(opcionesDeEjecucion({ ...base, reemplazar: ['tienda_db', 'nuevo_db', 'otra'] })).toEqual(
      {
        instancia: 'mysql',
        origenBd: { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave: 'x' },
        // `nuevo_db` no existe (no hay nada que reemplazar) y `otra` no es de la selección.
        reemplazar: ['Tienda_DB'],
      },
    );
    expect(opcionesDeEjecucion({ ...base, reemplazar: [] }).reemplazar).toEqual([]);
    expect(opcionesDeEjecucion({ ...base, conBases: false, reemplazar: [] })).toEqual({});
    expect(opcionesDeEjecucion({ ...base, bases: [], reemplazar: [] })).toEqual({});
    expect(opcionesDeEjecucion({ ...base, destino: null, reemplazar: [] })).toEqual({});
    expect(
      opcionesDeEjecucion({ ...base, origen: { ...base.origen, puerto: '0' }, reemplazar: [] }),
    ).toEqual({});
  });

  it('resume el resultado', () => {
    expect(
      resumenResultado({
        sitios: [
          { id: 'a', ok: true },
          { id: 'b', ok: false, codigo: 'importar.sin_php' },
        ],
        bases: [{ nombre: 'x', ok: true, respaldoPrevio: null }],
        aplicado: true,
      }),
    ).toEqual({ sitios: 1, sitiosFallo: 1, bases: 1, basesFallo: 0 });
  });
});
