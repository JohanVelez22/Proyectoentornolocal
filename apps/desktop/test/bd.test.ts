import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiEntorno, EstadoServicio, EventosNucleo } from '../src/shared/api';
import { LIMITE_LINEAS, useBd } from '../src/renderer/stores/bd';
import {
  carpetaDe,
  confirmacionValida,
  formatearTamano,
  formatoIncompatible,
  nombreDesdeArchivo,
  opcionesRestaurar,
  origenSugerido,
  problemaNombre,
  recortarLineas,
  REGLA_NOMBRE,
  respaldoEnMensaje,
} from '../src/renderer/utilidades/bd';

describe('utilidades de Bases de datos', () => {
  it('sanea el nombre del archivo de respaldo como nombre de base', () => {
    expect(nombreDesdeArchivo('Backup-08-10-2026.sql', 'postgresql')).toBe('backup_08_10_2026');
    expect(nombreDesdeArchivo('C:\\Respaldos\\Backup-08-10-2026.sql', 'mysql')).toBe(
      'backup_08_10_2026',
    );
    expect(nombreDesdeArchivo('D:/x/Diamantes Prod.sql.gz', 'mysql')).toBe('diamantes_prod');
    expect(nombreDesdeArchivo('tienda.dump', 'postgresql')).toBe('tienda');
    expect(nombreDesdeArchivo('Año—Café (v2).zip', 'mariadb')).toBe('ano_cafe_v2');
    expect(nombreDesdeArchivo('respaldo.tar.gz', 'mysql')).toBe('respaldo');
  });

  it('el nombre sugerido siempre cumple la regla del motor', () => {
    // PostgreSQL no admite que empiece por número.
    expect(nombreDesdeArchivo('2026-10-08.sql', 'postgresql')).toBe('bd_2026_10_08');
    expect(nombreDesdeArchivo('2026-10-08.sql', 'mysql')).toBe('2026_10_08');
    // Sin nada útil: un nombre por defecto.
    expect(nombreDesdeArchivo('---.sql', 'postgresql')).toBe('restaurada');
    const largo = nombreDesdeArchivo(`${'a'.repeat(80)}.sql`, 'postgresql');
    expect(largo.length).toBe(63);
    for (const motor of ['mysql', 'mariadb', 'postgresql', 'mongodb'] as const) {
      for (const archivo of ['Backup-08-10-2026.sql', '9.sql', '__x__.dump', 'ÑANDÚ.7z']) {
        expect(REGLA_NOMBRE[motor].test(nombreDesdeArchivo(archivo, motor))).toBe(true);
      }
    }
  });

  it('valida el nombre según las reglas de cada motor', () => {
    expect(problemaNombre('mysql', '')).toBe('vacio');
    expect(problemaNombre('mysql', 'Tienda_1')).toBeNull();
    expect(problemaNombre('mysql', 'tienda-1')).toBe('caracteres');
    expect(problemaNombre('postgresql', 'Tienda')).toBe('caracteres');
    expect(problemaNombre('postgresql', '1tienda')).toBe('inicio');
    expect(problemaNombre('postgresql', 'tienda_1')).toBeNull();
    expect(problemaNombre('mongodb', 'tienda-1')).toBeNull();
    expect(problemaNombre('mysql', 'a'.repeat(65))).toBe('largo');
  });

  it('exige la confirmación para sobrescribir solo si la base tiene tablas', () => {
    expect(opcionesRestaurar(false, false)).toEqual({});
    expect(opcionesRestaurar(false, true)).toEqual({});
    expect(opcionesRestaurar(true, false)).toBeNull();
    expect(opcionesRestaurar(true, true)).toEqual({ confirmarSobrescribir: true });
  });

  it('la confirmación escrita debe coincidir exactamente con el nombre', () => {
    expect(confirmacionValida('tienda', 'tienda')).toBe(true);
    expect(confirmacionValida('tienda', 'Tienda')).toBe(false);
    expect(confirmacionValida('tienda', 'tienda ')).toBe(false);
    expect(confirmacionValida('', '')).toBe(false);
  });

  it('un pg_dump solo se ofrece en PostgreSQL', () => {
    expect(formatoIncompatible('pgdump', 'mysql')).toBe(true);
    expect(formatoIncompatible('pgdump', 'postgresql')).toBe(false);
    expect(formatoIncompatible('sql', 'mysql')).toBe(false);
  });

  it('formatea tamaños y saca la carpeta y el respaldo previo de una ruta', () => {
    expect(formatearTamano(0)).toBe('0 B');
    expect(formatearTamano(512)).toBe('512 B');
    expect(formatearTamano(1536)).toBe('1,5 KB');
    expect(formatearTamano(250 * 1024 * 1024)).toBe('250 MB');
    expect(carpetaDe('C:\\Users\\x\\Respaldos\\a.dump')).toBe('C:\\Users\\x\\Respaldos');
    const msg =
      'No se pudo completar la restauración de d. La base original se reemplazó; su copia de seguridad está en C:\\R\\d-antes-de-sobrescribir-20261118-1200.dump. Puede restaurarla desde Bases de datos.';
    expect(respaldoEnMensaje(msg)).toBe('C:\\R\\d-antes-de-sobrescribir-20261118-1200.dump');
    expect(respaldoEnMensaje('otro error')).toBeNull();
  });

  it('sugiere el servidor externo (FlyEnv) al importar', () => {
    const s = (p: Partial<EstadoServicio>): EstadoServicio => ({
      id: 'mysql',
      nombre: 'MySQL',
      version: null,
      estado: 'apagado',
      puertos: [],
      pid: null,
      ...p,
    });
    // Externo detectado en 3306 (el propio no está instalado).
    expect(origenSugerido('mysql', [s({ estado: 'externo', puertos: [3306] })])).toEqual({
      host: '127.0.0.1',
      puerto: 3306,
      usuario: 'root',
    });
    // El propio usa el puerto alternativo: el estándar es del otro servidor.
    expect(
      origenSugerido('postgresql', [s({ id: 'postgresql', estado: 'encendido', puertos: [5433] })])
        .puerto,
    ).toBe(5432);
    // El propio no pudo usar el estándar porque otro lo ocupa.
    expect(
      origenSugerido('mysql', [
        s({
          estado: 'error',
          puertos: [3306],
          mensaje: 'El puerto 3306 lo usa mysqld.exe (PID 42). Use el puerto 3308.',
        }),
      ]).puerto,
    ).toBe(3306);
    // Nada detectado: no se inventa un puerto.
    expect(origenSugerido('mysql', [s({ estado: 'encendido', puertos: [3306] })]).puerto).toBe(
      null,
    );
    expect(origenSugerido('mariadb', [s({ id: 'mariadb', puertos: [3307] })]).puerto).toBe(null);
  });

  it('recorta el registro a las últimas líneas', () => {
    expect(recortarLineas([1, 2, 3], [4, 5], 4)).toEqual([2, 3, 4, 5]);
    expect(recortarLineas([1], [2], 4)).toEqual([1, 2]);
  });
});

type Oyente = (dato: unknown) => void;

function apiFalsa() {
  const oyentes = new Map<string, Set<Oyente>>();
  const api = {
    bd: {
      listar: vi.fn(async () => [{ nombre: 'tienda', tamanoBytes: 10 }]),
      restaurar: vi.fn(async () => ({ advertencias: ['rol "x" no existe'] })),
      importar: vi.fn(async () => ({ advertencias: [] })),
      respaldar: vi.fn(async () => ({ archivo: 'C:\\R\\tienda.sql' })),
    },
    pgvector: {
      estado: vi.fn(async () => ({ buildTools: false, instalado: false, version: null })),
      instalarBuildTools: vi.fn(async () => ({ ok: true })),
      compilarEInstalar: vi.fn(async () => ({ version: '0.8.1' })),
    },
    on: vi.fn((nombre: string, fn: Oyente) => {
      const set = oyentes.get(nombre) ?? new Set<Oyente>();
      set.add(fn);
      oyentes.set(nombre, set);
      return () => void set.delete(fn);
    }),
  };
  const emitir = <K extends keyof EventosNucleo>(nombre: K, dato: EventosNucleo[K]): void => {
    for (const fn of oyentes.get(nombre) ?? []) fn(dato);
  };
  return { api, emitir };
}

describe('store de Bases de datos', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('el registro de bd:progreso conserva solo las últimas líneas', () => {
    const bd = useBd();
    bd.iniciar();
    for (let i = 0; i < LIMITE_LINEAS + 120; i++) {
      falsa.emitir('bd:progreso', {
        operacion: 'restaurar',
        motor: 'postgresql',
        base: 'd',
        linea: `línea ${i}`,
      });
    }
    expect(bd.lineas).toHaveLength(LIMITE_LINEAS);
    expect(bd.lineas[0]!.texto).toBe('línea 120');
    expect(bd.lineas.at(-1)!.texto).toBe(`línea ${LIMITE_LINEAS + 119}`);
    // Claves únicas para la lista.
    expect(new Set(bd.lineas.map((l) => l.n)).size).toBe(LIMITE_LINEAS);
  });

  it('el progreso de pgvector y de las Build Tools va a su propio registro', () => {
    const bd = useBd();
    bd.iniciar();
    const base = { version: '0.8.1', fase: 'compilando' as const, porcentaje: 0 };
    falsa.emitir('instalacion:progreso', { ...base, servicio: 'buildtools', mensaje: 'winget' });
    falsa.emitir('instalacion:progreso', { ...base, servicio: 'pgvector', mensaje: 'nmake' });
    falsa.emitir('instalacion:progreso', { ...base, servicio: 'php', mensaje: 'ajeno' });
    expect(bd.lineasPgvector.map((l) => l.texto)).toEqual(['winget', 'nmake']);
    expect(bd.lineas).toEqual([]);
  });

  it('importar no guarda la clave del origen en el estado, ni si sale bien ni si falla', async () => {
    const bd = useBd();
    const clave = 'Sup3r-Secreta!';
    const origen = { host: '127.0.0.1', puerto: 3306, usuario: 'root', clave, base: 'tienda' };

    const ok = await bd.importar('mysql', origen, 'tienda_local', false);
    expect(ok.estado).toBe('ok');
    expect(falsa.api.bd.importar).toHaveBeenCalledWith('mysql', origen, 'tienda_local', {});
    expect(JSON.stringify(bd.$state)).not.toContain(clave);

    bd.descartarOperacion();
    falsa.api.bd.importar.mockRejectedValueOnce(new Error('Acceso denegado para root'));
    const mal = await bd.importar('mysql', origen, 'tienda_local', true);
    expect(mal.estado).toBe('error');
    expect(falsa.api.bd.importar).toHaveBeenLastCalledWith('mysql', origen, 'tienda_local', {
      confirmarSobrescribir: true,
    });
    expect(JSON.stringify(bd.$state)).not.toContain(clave);
  });

  it('restaurar guarda advertencias y respaldo previo; el error tras reemplazo queda destacado', async () => {
    const bd = useBd();
    falsa.api.bd.restaurar.mockResolvedValueOnce({
      advertencias: ['rol "x" no existe'],
      respaldoPrevio: 'C:\\R\\d-antes.dump',
    } as never);
    const r = await bd.restaurar('postgresql', 'C:\\x\\d.dump', 'd', true);
    expect(r.resultado).toEqual({
      advertencias: ['rol "x" no existe'],
      respaldoPrevio: 'C:\\R\\d-antes.dump',
    });
    expect(falsa.api.bd.restaurar).toHaveBeenCalledWith('postgresql', 'C:\\x\\d.dump', 'd', {
      confirmarSobrescribir: true,
    });

    bd.descartarOperacion();
    const mensaje =
      'No se pudo completar la restauración de d. La base original se reemplazó; su copia de seguridad está en C:\\R\\d-antes.dump. Puede restaurarla desde Bases de datos.';
    falsa.api.bd.restaurar.mockRejectedValueOnce(
      Object.assign(new Error(mensaje), { codigo: 'tras-reemplazo' }),
    );
    const e = await bd.restaurar('postgresql', 'C:\\x\\d.dump', 'd', true);
    expect(e).toMatchObject({
      estado: 'error',
      error: mensaje,
      trasReemplazo: true,
      respaldoPrevio: 'C:\\R\\d-antes.dump',
    });
  });

  it('no permite dos operaciones a la vez ni descartar la que está en curso', async () => {
    const bd = useBd();
    let terminar!: (v: { advertencias: string[] }) => void;
    falsa.api.bd.restaurar.mockImplementationOnce(
      () => new Promise((r) => (terminar = r)) as never,
    );
    const p = bd.restaurar('mysql', 'C:\\a.sql', 'a', false);
    expect(bd.enCurso).toBe(true);
    await expect(bd.respaldar('mysql', 'b', null)).rejects.toThrow(/en curso/);
    bd.descartarOperacion();
    expect(bd.operacion?.estado).toBe('corriendo');
    terminar({ advertencias: [] });
    await p;
    expect(bd.enCurso).toBe(false);
  });

  it('una lista que no se puede leer deja el mensaje y no bases viejas', async () => {
    const bd = useBd();
    await bd.cargarBases('mysql');
    expect(bd.bases.mysql).toHaveLength(1);
    falsa.api.bd.listar.mockRejectedValueOnce(
      new Error('Encienda MySQL para administrar sus bases'),
    );
    await bd.cargarBases('mysql');
    expect(bd.bases.mysql).toBeUndefined();
    expect(bd.errorCarga.mysql).toBe('Encienda MySQL para administrar sus bases');
  });
});
