import { describe, expect, it } from 'vitest';
import {
  BYTES_POR_MIL_MILLONES,
  FACTOR_CONTEXTO,
  MARGEN_HOLGADO,
  RESERVA_SISTEMA_BYTES,
  SOBRECARGA_BYTES,
  MARGEN_DISCO_BYTES,
  TOPE_RECOMENDADO_CPU_BYTES,
  VRAM_MINIMA_UTIL,
  clasificarModelo,
  memoriaNecesaria,
  sugerirParaEquipo,
} from '../src/equipo/modelosIa';
import { equipoDesconocido, type InfoEquipo } from '../src/equipo/tipos';

const GIB = 1024 ** 3;
const GB = 1_000_000_000;

function equipo(o: { ramGiB?: number | null; vramGiB?: number | null }): InfoEquipo {
  const e = equipoDesconocido();
  if (o.ramGiB !== undefined && o.ramGiB !== null) e.ram.totalBytes = o.ramGiB * GIB;
  if (o.vramGiB !== undefined && o.vramGiB !== null) {
    e.gpus = [{ nombre: 'GPU', vramBytes: o.vramGiB * GIB, origenVram: 'registro' }];
  }
  return e;
}

describe('fórmula de memoria necesaria', () => {
  it('es el tamaño cuantizado × 1,10 (contexto de 4096 tokens) + 0,5 GiB de sobrecarga', () => {
    expect(FACTOR_CONTEXTO).toBe(1.1);
    expect(SOBRECARGA_BYTES).toBe(0.5 * GIB);
    expect(memoriaNecesaria(4 * GB)).toBe(Math.ceil(4 * GB * 1.1 + 0.5 * GIB));
  });
  it('los márgenes están documentados', () => {
    expect(MARGEN_HOLGADO).toBe(0.8);
    expect(RESERVA_SISTEMA_BYTES).toBe(4 * GIB);
    expect(VRAM_MINIMA_UTIL).toBe(2 * GIB);
  });
});

describe('clasificarModelo', () => {
  const llama32 = 2 * GB; // llama3.2 (3B)
  const siete = 4.7 * GB; // 7B cuantizado a 4 bits
  const catorce = 9 * GB;

  it('con GPU: cabe holgado en la VRAM → recomendado', () => {
    const r = clasificarModelo(
      { nombre: 'llama3.2', tamanoBytes: llama32 },
      equipo({ ramGiB: 16, vramGiB: 8 }),
    );
    expect(r).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-vram', memoria: 'vram' });
    expect(r.disponibleBytes).toBe(8 * GIB);
  });

  it('con GPU: va justo en la VRAM (y sin RAM que lo salve) → puede ir lento', () => {
    // 7B necesita ≈5,3 GiB; en 6 GiB cabe, pero sin el 20 % de margen
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: siete }, equipo({ vramGiB: 6 }));
    expect(r).toMatchObject({ nivel: 'lento', motivo: 'justo-vram', memoria: 'vram' });
  });

  it('con GPU: no cabe en la VRAM pero sí en la RAM → puede ir lento', () => {
    const r = clasificarModelo(
      { nombre: 'm', tamanoBytes: catorce },
      equipo({ ramGiB: 32, vramGiB: 6 }),
    );
    expect(r).toMatchObject({ nivel: 'lento', motivo: 'solo-ram', memoria: 'ram' });
    expect(r.disponibleBytes).toBe(28 * GIB);
  });

  it('sin GPU: cabe en la RAM con margen → recomendado', () => {
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: siete }, equipo({ ramGiB: 16 }));
    expect(r).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-ram', memoria: 'ram' });
  });

  it('sin GPU: cabe en la RAM pero justo → puede ir lento', () => {
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: catorce }, equipo({ ramGiB: 16 }));
    expect(r).toMatchObject({ nivel: 'lento', motivo: 'ram-justo' });
  });

  it('sin GPU: un 70B en 64 GiB cabe pero en la CPU va a ≈1 token/s → puede ir lento', () => {
    const r = clasificarModelo({ nombre: '70b', tamanoBytes: 45 * GB }, equipo({ ramGiB: 64 }));
    expect(r.nivel).toBe('lento');
  });

  it('sin GPU: un 7B en 64 GiB → recomendado; el techo de «recomendado» es 6 GiB', () => {
    expect(TOPE_RECOMENDADO_CPU_BYTES).toBe(6 * GIB);
    expect(
      clasificarModelo({ nombre: '7b', tamanoBytes: siete }, equipo({ ramGiB: 64 })).nivel,
    ).toBe('recomendado');
    // 14B (≈10,4 GiB necesarios): cabe de sobra en la RAM, pero pasa del techo de la CPU
    expect(
      clasificarModelo({ nombre: '14b', tamanoBytes: catorce }, equipo({ ramGiB: 64 })).nivel,
    ).toBe('lento');
  });

  it('tener GPU nunca empeora el veredicto frente a no tenerla', () => {
    const tamanos = [1, 2, 4.7, 6, 9, 20, 45].map((g) => g * GB);
    for (const ramGiB of [8, 16, 32, 64]) {
      for (const vramGiB of [2, 3, 4, 6, 8, 12, 24]) {
        for (const t of tamanos) {
          const sin = clasificarModelo({ nombre: 'm', tamanoBytes: t }, equipo({ ramGiB }));
          const con = clasificarModelo(
            { nombre: 'm', tamanoBytes: t },
            equipo({ ramGiB, vramGiB }),
          );
          const orden = { 'no-cabe': 0, lento: 1, recomendado: 2 } as Record<string, number>;
          expect(
            orden[con.nivel],
            `ram ${ramGiB} vram ${vramGiB} tam ${t / GB}`,
          ).toBeGreaterThanOrEqual(orden[sin.nivel]!);
        }
      }
    }
  });

  it('con una GPU de 8 GiB, un 14B (en la RAM) nunca sale peor que sin GPU', () => {
    const sin = clasificarModelo({ nombre: '14b', tamanoBytes: catorce }, equipo({ ramGiB: 32 }));
    const con = clasificarModelo(
      { nombre: '14b', tamanoBytes: catorce },
      equipo({ ramGiB: 32, vramGiB: 8 }),
    );
    expect(sin.nivel).toBe('lento');
    expect(con.nivel).toBe('lento');
  });

  it('una GPU pequeña no empeora a un 7B que sin ella ya era recomendado', () => {
    const r = clasificarModelo(
      { nombre: '7b', tamanoBytes: siete },
      equipo({ ramGiB: 32, vramGiB: 6 }),
    );
    expect(r.nivel).toBe('recomendado');
  });

  it('las GPU integradas no cuentan como VRAM, aunque declaren varios GiB', () => {
    const e = equipo({ ramGiB: 16 });
    e.gpus = [
      {
        nombre: 'Intel(R) Iris(R) Xe Graphics',
        vramBytes: 8 * GIB,
        origenVram: 'registro',
        integrada: true,
      },
    ];
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: catorce }, e);
    expect(r).toMatchObject({ nivel: 'lento', memoria: 'ram' });
    expect(sugerirParaEquipo(e).memoria).toBe('ram');
  });

  it('no cabe ni en la VRAM ni en la RAM → no cabe', () => {
    const r = clasificarModelo(
      { nombre: 'm', tamanoBytes: 40 * GB },
      equipo({ ramGiB: 16, vramGiB: 8 }),
    );
    expect(r).toMatchObject({ nivel: 'no-cabe', motivo: 'sin-memoria' });
  });

  it('a la RAM se le descuentan 4 GiB para el sistema y las demás aplicaciones', () => {
    // 8 GiB de RAM → 4 GiB útiles; un modelo de 3,6 GB necesita ≈4,2 GiB
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: 3.6 * GB }, equipo({ ramGiB: 8 }));
    expect(r.nivel).toBe('no-cabe');
    const r2 = clasificarModelo({ nombre: 'm', tamanoBytes: llama32 }, equipo({ ramGiB: 8 }));
    expect(r2.nivel).toBe('recomendado');
  });

  it('una GPU con menos de 2 GiB (integrada) no cuenta: se usa la RAM', () => {
    const e = equipo({ ramGiB: 16 });
    e.gpus = [{ nombre: 'Intel UHD', vramBytes: 0.5 * GIB, origenVram: 'registro' }];
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: siete }, e);
    expect(r).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-ram', memoria: 'ram' });
  });

  it('con varias GPU se usa la de más VRAM', () => {
    const e = equipo({ ramGiB: 16 });
    e.gpus = [
      { nombre: 'A', vramBytes: 4 * GIB, origenVram: 'registro' },
      { nombre: 'B', vramBytes: 12 * GIB, origenVram: 'nvidia-smi' },
    ];
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: siete }, e);
    expect(r).toMatchObject({ nivel: 'recomendado', motivo: 'cabe-vram' });
    expect(r.disponibleBytes).toBe(12 * GIB);
  });

  it('GPU con VRAM desconocida: se trata como si no hubiera GPU', () => {
    const e = equipo({ ramGiB: 16 });
    e.gpus = [{ nombre: 'X', vramBytes: null, origenVram: null }];
    expect(clasificarModelo({ nombre: 'm', tamanoBytes: siete }, e).motivo).toBe('cabe-ram');
  });

  it('el disco exige además 1 GiB de margen tras la descarga', () => {
    expect(MARGEN_DISCO_BYTES).toBe(GIB);
    const e = equipo({ ramGiB: 32, vramGiB: 24 });
    const justo = clasificarModelo(
      { nombre: 'm', tamanoBytes: siete, libreDiscoBytes: siete + 0.5 * GIB },
      e,
    );
    expect(justo).toMatchObject({ nivel: 'no-cabe', motivo: 'sin-disco' });
    const holgado = clasificarModelo(
      { nombre: 'm', tamanoBytes: siete, libreDiscoBytes: siete + GIB },
      e,
    );
    expect(holgado.nivel).toBe('recomendado');
  });

  it('el disco libre insuficiente es «no cabe», salvo que el modelo ya esté instalado', () => {
    const e = equipo({ ramGiB: 32, vramGiB: 24 });
    const nuevo = clasificarModelo({ nombre: 'm', tamanoBytes: siete, libreDiscoBytes: 1 * GB }, e);
    expect(nuevo).toMatchObject({ nivel: 'no-cabe', motivo: 'sin-disco' });
    const ya = clasificarModelo(
      { nombre: 'm', tamanoBytes: siete, libreDiscoBytes: 1 * GB, instalado: true },
      e,
    );
    expect(ya.nivel).toBe('recomendado');
    expect(ya.instalado).toBe(true);
  });

  it('sin tamaño del modelo o sin datos del equipo → desconocido (nunca bloquea)', () => {
    expect(
      clasificarModelo({ nombre: 'm', tamanoBytes: null }, equipo({ ramGiB: 16 })),
    ).toMatchObject({
      nivel: 'desconocido',
      motivo: 'tamano-desconocido',
    });
    expect(
      clasificarModelo({ nombre: 'm', tamanoBytes: siete }, equipoDesconocido()),
    ).toMatchObject({
      nivel: 'desconocido',
      motivo: 'equipo-desconocido',
    });
  });

  it('la VRAM sola basta aunque no se sepa la RAM', () => {
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: llama32 }, equipo({ vramGiB: 8 }));
    expect(r.nivel).toBe('recomendado');
  });

  it('devuelve lo necesario y lo disponible para explicarlo', () => {
    const r = clasificarModelo({ nombre: 'm', tamanoBytes: siete }, equipo({ ramGiB: 16 }));
    expect(r.necesarioBytes).toBe(memoriaNecesaria(siete));
    expect(r.disponibleBytes).toBe(12 * GIB);
  });
});

describe('sugerirParaEquipo («modelos de hasta ≈NB»)', () => {
  it('8 GiB de VRAM → hasta ≈7B, en la VRAM', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 16, vramGiB: 8 }))).toMatchObject({
      parametrosMaxB: 7,
      memoria: 'vram',
    });
  });
  it('16 GiB de RAM sin GPU → hasta ≈7B en la RAM', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 16 }))).toMatchObject({
      parametrosMaxB: 7,
      memoria: 'ram',
    });
  });
  it('64 GiB de RAM sin GPU → sigue limitado a 7B', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 64 }))).toMatchObject({
      parametrosMaxB: 7,
      memoria: 'ram',
    });
  });
  it('una GPU pequeña no baja la sugerencia por debajo de la que daría la RAM', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 32, vramGiB: 3 })).parametrosMaxB).toBe(7);
  });
  it('24 GiB de VRAM → hasta ≈14B; 32 GiB → ≈32B', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 64, vramGiB: 24 })).parametrosMaxB).toBe(14);
    expect(sugerirParaEquipo(equipo({ ramGiB: 64, vramGiB: 32 })).parametrosMaxB).toBe(32);
  });
  it('4 GiB de RAM → solo modelos de menos de 1B (nada que sugerir en cifras)', () => {
    expect(sugerirParaEquipo(equipo({ ramGiB: 4 }))).toMatchObject({
      parametrosMaxB: null,
      memoria: 'ram',
    });
  });
  it('sin datos → no sugiere nada', () => {
    expect(sugerirParaEquipo(equipoDesconocido())).toEqual({
      parametrosMaxB: null,
      memoria: null,
      capacidadBytes: null,
    });
  });
  it('la sugerencia es coherente con la clasificación: lo sugerido sale «recomendado»', () => {
    for (const e of [
      equipo({ ramGiB: 16, vramGiB: 8 }),
      equipo({ ramGiB: 16 }),
      equipo({ ramGiB: 32, vramGiB: 12 }),
      equipo({ ramGiB: 64 }),
      equipo({ ramGiB: 32, vramGiB: 3 }),
    ]) {
      const s = sugerirParaEquipo(e);
      const tam = s.parametrosMaxB! * BYTES_POR_MIL_MILLONES;
      expect(clasificarModelo({ nombre: 'm', tamanoBytes: tam }, e).nivel).toBe('recomendado');
    }
  });
});
