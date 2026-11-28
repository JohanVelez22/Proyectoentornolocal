import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  CandadoPgvector,
  activarVectorEnBases,
  activarVectorEnPlantilla,
  estadoPlantilla,
  estadoVectorBases,
  motivoDeError,
  quitarVectorDePlantilla,
  type PuertoVector,
} from '../src/bd/pgvectorBases';

/** Puerto falso: una "instancia" con bases, extensiones por base y bases de datos reales. */
function falso(
  o: {
    bases?: string[];
    activas?: string[];
    reales?: string[];
    servidor?: boolean;
    falla?: Record<string, Error>;
  } = {},
) {
  const activas = new Set(o.activas ?? []);
  const llamadas: string[] = [];
  const p: PuertoVector = {
    listarBases: async () => o.bases ?? ['a', 'b', 'c'],
    servidorTieneVector: async () => o.servidor ?? true,
    vectorActivo: async (b) => activas.has(b),
    activar: async (b) => {
      llamadas.push(`activar:${b}`);
      if (o.falla?.[b]) throw o.falla[b];
      activas.add(b);
    },
    quitar: async (b) => {
      llamadas.push(`quitar:${b}`);
      if (o.falla?.[b]) throw o.falla[b];
      activas.delete(b);
    },
    esDatosReales: async (b) => (o.reales ?? []).includes(b),
  };
  return { p, llamadas, activas };
}

describe('pgvector en varias bases (D54b)', () => {
  it('sin confirmado === true no toca nada ni consulta el catálogo', async () => {
    const { p, llamadas } = falso();
    for (const c of [false, undefined, 'true', 1, null]) {
      await expect(
        activarVectorEnBases(p, { bases: ['a'], confirmado: c as never }),
      ).rejects.toMatchObject({ codigo: 'bd.vector_confirmacion' });
    }
    await expect(activarVectorEnPlantilla(p, { confirmado: 'si' as never })).rejects.toBeInstanceOf(
      ErrorWolf,
    );
    await expect(quitarVectorDePlantilla(p, { confirmado: 0 as never })).rejects.toBeInstanceOf(
      ErrorWolf,
    );
    expect(llamadas).toEqual([]);
  });

  it('informa por base: activada, ya estaba y error; una que falla no detiene a las demás', async () => {
    const { p, llamadas } = falso({
      activas: ['b'],
      falla: { c: new Error('No se pudo activar pgvector en c: permiso denegado (42501).') },
    });
    const r = await activarVectorEnBases(p, { bases: ['a', 'b', 'c'], confirmado: true });
    expect(r).toEqual([
      { base: 'a', estado: 'activada' },
      { base: 'b', estado: 'ya-estaba' },
      { base: 'c', estado: 'error', motivo: 'permiso' },
    ]);
    expect(llamadas).toEqual(['activar:a', 'activar:c']);
  });

  it('solo bases del catálogo: una inexistente, una plantilla o un nombre malicioso dan error sin ejecutar nada', async () => {
    const { p, llamadas } = falso();
    const r = await activarVectorEnBases(p, {
      bases: ['a', 'fantasma', 'template1', 'x"; DROP DATABASE a; --'],
      confirmado: true,
    });
    expect(r.map((x) => [x.base, x.estado, x.motivo])).toEqual([
      ['a', 'activada', undefined],
      ['fantasma', 'error', 'no-existe'],
      ['template1', 'error', 'sistema'],
      ['x"; DROP DATABASE a; --', 'error', 'no-existe'],
    ]);
    expect(llamadas).toEqual(['activar:a']);
  });

  it('una base con datos reales no se toca sin su aviso adicional', async () => {
    const { p, llamadas } = falso({ reales: ['b'] });
    const r1 = await activarVectorEnBases(p, { bases: ['a', 'b'], confirmado: true });
    expect(r1).toEqual([
      { base: 'a', estado: 'activada' },
      { base: 'b', estado: 'requiere-aviso' },
    ]);
    expect(llamadas).toEqual(['activar:a']);
    const r2 = await activarVectorEnBases(p, {
      bases: ['b'],
      confirmado: true,
      datosRealesConfirmadas: ['b'],
    });
    expect(r2).toEqual([{ base: 'b', estado: 'activada' }]);
  });

  it('si no se sabe si es de datos reales, se trata como de datos reales', async () => {
    const { p, llamadas } = falso();
    p.esDatosReales = async () => {
      throw new Error('no se pudo leer');
    };
    const r = await activarVectorEnBases(p, { bases: ['a'], confirmado: true });
    expect(r).toEqual([{ base: 'a', estado: 'requiere-aviso' }]);
    expect(llamadas).toEqual([]);
  });

  it('sin pgvector instalado en el servidor falla antes de tocar ninguna base', async () => {
    const { p, llamadas } = falso({ servidor: false });
    await expect(activarVectorEnBases(p, { bases: ['a'], confirmado: true })).rejects.toMatchObject(
      { codigo: 'bd.vector_no_instalado' },
    );
    await expect(activarVectorEnPlantilla(p, { confirmado: true })).rejects.toMatchObject({
      codigo: 'bd.vector_no_instalado',
    });
    expect(llamadas).toEqual([]);
  });

  it('exige al menos una base y repite cada una una sola vez', async () => {
    const { p, llamadas } = falso();
    await expect(activarVectorEnBases(p, { bases: [], confirmado: true })).rejects.toThrow(
      'al menos una',
    );
    await activarVectorEnBases(p, { bases: ['a', 'a'], confirmado: true });
    expect(llamadas).toEqual(['activar:a']);
  });

  it('un error del catálogo al listar se propaga (no se inventa un informe)', async () => {
    const { p } = falso();
    p.listarBases = async () => {
      throw new Error('No se pudo listar las bases: permiso denegado (42501).');
    };
    await expect(activarVectorEnBases(p, { bases: ['a'], confirmado: true })).rejects.toThrow(
      'permiso denegado',
    );
  });

  it('template1: activar, ya estaba, error y quitar', async () => {
    const { p, llamadas, activas } = falso();
    expect(await activarVectorEnPlantilla(p, { confirmado: true })).toEqual({
      base: 'template1',
      estado: 'activada',
    });
    expect(await activarVectorEnPlantilla(p, { confirmado: true })).toEqual({
      base: 'template1',
      estado: 'ya-estaba',
    });
    expect(await quitarVectorDePlantilla(p, { confirmado: true })).toEqual({
      base: 'template1',
      estado: 'quitada',
    });
    expect(activas.has('template1')).toBe(false);
    expect(await quitarVectorDePlantilla(p, { confirmado: true })).toEqual({
      base: 'template1',
      estado: 'ya-estaba',
    });
    expect(llamadas).toEqual(['activar:template1', 'quitar:template1']);
    const f = falso({
      falla: { template1: new Error('No se pudo x: la base está en uso (55006).') },
    });
    expect(await activarVectorEnPlantilla(f.p, { confirmado: true })).toEqual({
      base: 'template1',
      estado: 'error',
      motivo: 'en-uso',
    });
  });

  it('el estado trae por base si la extensión está, si es de datos reales y si template1 la lleva', async () => {
    const { p } = falso({ activas: ['a', 'template1'], reales: ['c'] });
    expect(await estadoVectorBases(p)).toEqual({
      servidorTiene: true,
      bases: [
        { base: 'a', activo: true, datosReales: false, valida: true },
        { base: 'b', activo: false, datosReales: false, valida: true },
        { base: 'c', activo: false, datosReales: true, valida: true },
      ],
      truncado: false,
      plantilla: true,
    });
  });

  it('un nombre de base raro sale con valida:false y no tumba el lote ni se consulta', async () => {
    const { p } = falso({ bases: ['a', 'Mi Base', 'b'] });
    const consultadas: string[] = [];
    const antes = p.vectorActivo;
    p.vectorActivo = async (b) => {
      consultadas.push(b);
      return antes(b);
    };
    const e = await estadoVectorBases(p);
    expect(e.bases.map((b) => [b.base, b.valida])).toEqual([
      ['a', true],
      ['Mi Base', false],
      ['b', true],
    ]);
    expect(consultadas).not.toContain('Mi Base');
    const r = await activarVectorEnBases(p, { bases: ['Mi Base'], confirmado: true });
    expect(r).toEqual([{ base: 'Mi Base', estado: 'error', motivo: 'nombre-no-valido' }]);
  });

  it('más de 200 bases: se marca truncado y solo se listan las primeras', async () => {
    const muchas = Array.from({ length: 205 }, (_, i) => `b${i}`);
    const { p } = falso({ bases: muchas });
    const e = await estadoVectorBases(p);
    expect(e.bases).toHaveLength(200);
    expect(e.truncado).toBe(true);
  });

  it('la plantilla es null cuando no se puede leer (estado ligero y completo)', async () => {
    const { p } = falso();
    p.vectorActivo = async (b) => {
      if (b === 'template1') throw new Error('sin conexión');
      return false;
    };
    expect(await estadoPlantilla(p)).toBeNull();
    expect((await estadoVectorBases(p)).plantilla).toBeNull();
  });

  it('los errores de «ninguna base» y «demasiadas» son del catálogo', async () => {
    const { p } = falso();
    await expect(activarVectorEnBases(p, { bases: [], confirmado: true })).rejects.toMatchObject({
      codigo: 'bd.vector_sin_bases',
    });
    const muchas = Array.from({ length: 201 }, (_, i) => `b${i}`);
    await expect(
      activarVectorEnBases(p, { bases: muchas, confirmado: true }),
    ).rejects.toMatchObject({ codigo: 'bd.vector_demasiadas' });
  });

  it('una carrera (activar devuelve false) cuenta como «ya estaba»; 2BP01 es «dependencias»', async () => {
    const { p } = falso();
    p.activar = async () => false;
    expect(await activarVectorEnBases(p, { bases: ['a'], confirmado: true })).toEqual([
      { base: 'a', estado: 'ya-estaba' },
    ]);
    expect(motivoDeError(new Error('No se pudo quitar (2BP01).'))).toBe('dependencias');
  });

  it('las bases del sistema se rechazan por nombre, sin ejecutar nada', async () => {
    const { p, llamadas } = falso({ bases: ['a', 'postgres'] });
    const r = await activarVectorEnBases(p, {
      bases: ['postgres', 'template0', 'template1'],
      confirmado: true,
    });
    expect(r.map((x) => x.motivo)).toEqual(['sistema', 'sistema', 'sistema']);
    expect(llamadas).toEqual([]);
  });

  it('el candado deja pasar una operación a la vez y avisa con bd.vector_ocupado; se libera al acabar o fallar', async () => {
    const c = new CandadoPgvector();
    let soltar!: () => void;
    const larga = c.con(() => new Promise<void>((r) => (soltar = r)));
    await expect(c.con(async () => 1)).rejects.toMatchObject({ codigo: 'bd.vector_ocupado' });
    soltar();
    await larga;
    await expect(c.con(async () => 7)).resolves.toBe(7);
    await expect(
      c.con(async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow('x');
    await expect(c.con(async () => 8)).resolves.toBe(8);
  });

  it('motivoDeError clasifica por el código de PostgreSQL y por el mensaje de «no instalado»', () => {
    expect(motivoDeError(new Error('pgvector no está instalado: use "Instalar"'))).toBe(
      'sin-pgvector',
    );
    expect(motivoDeError(new Error('la base no existe (3D000).'))).toBe('no-existe');
    expect(motivoDeError(new Error('se perdió la conexión (08006).'))).toBe('conexion');
    expect(motivoDeError(new Error('otra cosa'))).toBe('otro');
    expect(motivoDeError('texto')).toBe('otro');
  });
});
