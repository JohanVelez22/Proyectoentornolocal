import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DiscoSalud, EventoDisco } from '@pel/core';
import { IDIOMAS_UI } from '@pel/core';
import { diccionarios } from '../src/renderer/i18n';
import { es } from '../src/renderer/i18n/es';
import { en } from '../src/renderer/i18n/en';
import {
  etiquetasDisco,
  filasContadores,
  hayDatosDeAdministrador,
  pideRespaldo,
  textoCopiaEventos,
  textoDatoConservado,
  textoDiscoEvento,
  textoMotivo,
  textoUnidades,
  textoVeredicto,
} from '../src/renderer/utilidades/saludDiscos';
import { textoEvidencia } from '../src/renderer/utilidades/doctor';
import { textoAviso } from '../src/shared/textosAvisos';

const t = es.herramientas.entorno.discos;
const te = es.herramientas.entorno.eventosDisco;

const disco = (extra: Partial<DiscoSalud> = {}): DiscoSalud => ({
  clave: 'd0',
  numero: 0,
  modelo: 'Disco de ejemplo',
  medio: 'ssd',
  bus: 'nvme',
  tamanoBytes: 1_000_204_886_016,
  salud: 'healthy',
  operacional: ['OK'],
  contadores: null,
  motivoSinContadores: 'admin',
  prediccionFallo: null,
  unidades: ['C:', 'D:'],
  veredicto: 'bien',
  motivos: [],
  contieneDatos: true,
  contieneProyectos: false,
  ...extra,
});

describe('filasContadores', () => {
  it('sin contadores: «No disponible» con el motivo en cada fila, nunca un 0', () => {
    const filas = filasContadores(disco(), 'sin_acceso', t);
    expect(filas).toHaveLength(8);
    for (const f of filas) {
      expect(f.disponible, f.clave).toBe(false);
      expect(f.valor, f.clave).toContain(t.noDisponible);
      expect(f.valor, f.clave).toContain('administrador');
      expect(f.valor, f.clave).not.toMatch(/(^|\s)0(\s|$)/);
    }
  });

  it('USB: el motivo es la conexión, no los permisos', () => {
    const f = filasContadores(disco({ bus: 'usb', motivoSinContadores: 'bus' }), 'ok', t);
    expect(f[0]!.valor).toContain('USB o RAID');
  });

  it('con datos: valores con su unidad; un 0 real sí se muestra', () => {
    const f = filasContadores(
      disco({
        contadores: {
          temperaturaC: 47,
          temperaturaMaxC: null,
          desgastePct: 91,
          erroresLecturaCorregidos: 0,
          erroresLecturaNoCorregidos: 0,
          erroresEscrituraCorregidos: null,
          erroresEscrituraNoCorregidos: null,
          horasEncendido: 9120,
        },
        motivoSinContadores: null,
        prediccionFallo: false,
      }),
      'ok',
      t,
    );
    const por = Object.fromEntries(f.map((x) => [x.clave, x]));
    expect(por['temperatura']!.valor).toBe('47 °C');
    expect(por['desgaste']!.valor).toBe('91 %');
    expect(por['lecturaCorregidos']).toMatchObject({ valor: '0', disponible: true });
    expect(por['escrituraCorregidos']!.disponible).toBe(false);
    expect(por['horas']!.valor).toBe('9120 h');
    expect(por['prediccion']!.valor).toBe(t.prediccionSinFallo);
  });
});

describe('textos', () => {
  it('etiquetas, unidades y datos del administrador', () => {
    expect(etiquetasDisco(disco(), t)).toEqual(['SSD', 'NVMe', '932 GB']);
    expect(etiquetasDisco(disco({ medio: null, bus: 'otro', tamanoBytes: null }), t)).toEqual([
      t.tipoDesconocido,
    ]);
    expect(textoUnidades(disco(), t)).toBe('Unidades: C: D:');
    expect(textoUnidades(disco({ unidades: [] }), t)).toBe(t.sinUnidades);
    expect(hayDatosDeAdministrador([disco()])).toBe(true);
    expect(hayDatosDeAdministrador([disco({ motivoSinContadores: 'bus' })])).toBe(false);
  });

  it('un motivo se explica con los números y el umbral de las constantes', () => {
    const d = disco({
      contadores: {
        temperaturaC: 64,
        temperaturaMaxC: null,
        desgastePct: 88,
        erroresLecturaCorregidos: null,
        erroresLecturaNoCorregidos: null,
        erroresEscrituraCorregidos: null,
        erroresEscrituraNoCorregidos: null,
        horasEncendido: null,
      },
    });
    expect(textoMotivo(d, 'desgaste', t)).toBe('Desgaste del 88 % (umbral: 80 %).');
    expect(textoMotivo(d, 'temperatura', t)).toBe('Temperatura de 64 °C (límite: 60 °C).');
  });
});

describe('eventos', () => {
  const ev = (extra: Partial<EventoDisco> = {}): EventoDisco => ({
    fecha: '2026-11-20T08:30:00.000Z',
    id: 7,
    proveedor: 'disk',
    codigo: 'disco_7',
    gravedad: 'critico',
    disco: { tipo: 'disco', valor: '1' },
    detalle: 'The device, \\Device\\Harddisk1\\DR1, has a bad block.',
    ...extra,
  });

  it('cada identificador leído tiene una explicación sencilla en todos los idiomas', () => {
    for (const id of [7, 11, 51, 52, 55, 129, 153, 157]) {
      for (const l of IDIOMAS_UI) {
        const tabla = diccionarios[l].herramientas.entorno.eventosDisco.explicaciones as Record<
          string,
          string
        >;
        expect(tabla[`disco_${id}`], `${l}/${id}`).toBeTruthy();
      }
    }
  });

  it('la copia lleva fecha, disco, explicación y el detalle ya saneado, sin series', () => {
    const texto = textoCopiaEventos(
      [ev(), ev({ disco: null, id: 129, codigo: 'disco_129' })],
      te,
      () => 'F',
    );
    expect(texto).toContain(
      'F · Disco 1 · disk 7 · Crítico · El disco tiene un bloque defectuoso.',
    );
    expect(texto).toContain('Disco no indicado');
    expect(texto).not.toMatch(/serial|S4EW|Users\\/i);
  });

  it('disco o unidad del evento', () => {
    expect(textoDiscoEvento(ev(), te)).toBe('Disco 1');
    expect(textoDiscoEvento(ev({ disco: { tipo: 'unidad', valor: 'C:' } }), te)).toBe('Unidad C:');
  });
});

describe('Doctor y avisos en los 16 idiomas', () => {
  it('la evidencia del disco se traduce con sus números', () => {
    for (const l of IDIOMAS_UI) {
      const txt = textoEvidencia(
        { codigo: 'disco_desgaste', datos: { desgaste: 88, umbral: 80 } },
        diccionarios[l],
      );
      expect(txt, l).toContain('88');
      expect(txt, l).toContain('80');
      expect(txt, l).not.toContain('{');
    }
  });

  it('el aviso de salud de un disco tiene título y texto en todos los idiomas', () => {
    for (const l of IDIOMAS_UI) {
      const critico = textoAviso(l, {
        tipo: 'salud-disco',
        codigo: 'avisos.disco_salud',
        datos: { estado: 'critico', modelo: 'Disco X' },
      });
      const atencion = textoAviso(l, {
        tipo: 'salud-disco',
        codigo: 'avisos.disco_salud',
        datos: { estado: 'atencion' },
      });
      expect(critico.titulo, l).toBeTruthy();
      expect(critico.cuerpo, l).toContain('Disco X');
      expect(atencion.titulo, l).not.toBe(critico.titulo);
      const generico = textoAviso(l, { tipo: 'salud-disco', codigo: 'otro', datos: {} });
      expect(generico.titulo, l).not.toBe('WolfCore Dev');
    }
  });

  it('el ajuste «Avisos de salud del disco» y la acción de respaldo existen en todos los idiomas', () => {
    for (const l of IDIOMAS_UI) {
      const d = diccionarios[l];
      expect((d.ajustes.avisos.tipos as Record<string, string>)['salud-disco'], l).toBeTruthy();
      expect(d.avisos.hacerRespaldo, l).toBeTruthy();
    }
    expect(es.avisos.hacerRespaldo).toBe('Hacer respaldo ahora');
    expect(en.ajustes.avisos.tipos['salud-disco']).toBe('Disk health alerts');
  });
});

describe('la lectura con administrador solo sale del botón', () => {
  const fuente = readFileSync(
    join(__dirname, '../src/renderer/componentes/herramientas/SaludDiscos.vue'),
    'utf8',
  );

  it('onMounted solo llama a la lectura normal', () => {
    const montaje = /onMounted\((.*)\);/.exec(fuente)?.[1] ?? '';
    expect(montaje).toContain('cargar');
    expect(montaje).not.toContain('Admin');
  });

  it('saludDiscosAdmin se llama en un solo sitio: la función del botón', () => {
    expect(fuente.match(/saludDiscosAdmin/g)).toHaveLength(1);
    expect(fuente).toMatch(/data-testid="discos-admin"[\s\S]*?@click="leerAdmin"/);
  });

  it('ningún otro archivo del renderer la pide', () => {
    for (const f of [
      'componentes/herramientas/EventosDisco.vue',
      'componentes/herramientas/Entorno.vue',
    ]) {
      expect(readFileSync(join(__dirname, '../src/renderer', f), 'utf8')).not.toContain(
        'saludDiscosAdmin',
      );
    }
  });
});

describe('privacidad', () => {
  it('ningún texto de la interfaz o del núcleo pide ni promete leer números de serie', () => {
    expect(t.privacidad).toMatch(/serie/);
    const fuente = readFileSync(
      join(__dirname, '../src/renderer/utilidades/saludDiscos.ts'),
      'utf8',
    );
    expect(fuente).not.toMatch(/SerialNumber|UniqueId|serial:/i);
  });
});

describe('interfaz de la salud de los discos tras la revisión de seguridad', () => {
  const sano = {
    temperaturaC: 40,
    temperaturaMaxC: null,
    desgastePct: 3,
    erroresLecturaCorregidos: 0,
    erroresLecturaNoCorregidos: 0,
    erroresEscrituraCorregidos: 0,
    erroresEscrituraNoCorregidos: 0,
    horasEncendido: 100,
  };

  it('el desgaste de 100 o más se muestra «≥ 100 %»', () => {
    const fila = (n: number) =>
      filasContadores(disco({ contadores: { ...sano, desgastePct: n } }), 'ok', t).find(
        (f) => f.clave === 'desgaste',
      )!;
    expect(fila(99).valor).toBe('99 %');
    expect(fila(100).valor).toBe('≥ 100 %');
    expect(fila(180).valor).toBe('≥ 100 %');
    expect(
      textoMotivo(disco({ contadores: { ...sano, desgastePct: 200 } }), 'desgaste', t),
    ).toContain('≥ 100 %');
  });

  it('en un HDD el desgaste es «No aplica (HDD)»', () => {
    const d = disco({ medio: 'hdd', bus: 'sata', contadores: { ...sano, desgastePct: null } });
    const f = filasContadores(d, 'ok', t).find((x) => x.clave === 'desgaste')!;
    expect(f.valor).toBe(t.noAplicaHdd);
    expect(f.valor).toBe('No aplica (HDD)');
    // Sin ningún contador también: no se confunde con «No disponible».
    const sin = filasContadores(disco({ medio: 'hdd', bus: 'sata' }), 'ok', t).find(
      (x) => x.clave === 'desgaste',
    )!;
    expect(sin.valor).toBe(t.noAplicaHdd);
  });

  it('los motivos no inventan ceros: si falta el dato, «No disponible»', () => {
    const d = disco({ contadores: null, motivos: ['errores_sin_corregir'] });
    const txt = textoMotivo(d, 'errores_sin_corregir', t);
    expect(txt).toContain(t.noDisponible);
    expect(txt).not.toMatch(/(^|[\s:])0(\D|$)/);
    expect(textoMotivo(disco({ operacional: [] }), 'estado_operacional', t)).toContain(
      t.noDisponible,
    );
    expect(textoMotivo(disco({ medio: null, bus: null }), 'temperatura', t)).not.toMatch(/\b0\b/);
  });

  it('«Bien» sin contadores se matiza; con contadores, no', () => {
    expect(textoVeredicto(disco({ veredicto: 'bien', contadores: null }), t)).toBe(
      'Bien (solo el estado que informa Windows)',
    );
    expect(textoVeredicto(disco({ veredicto: 'bien', contadores: sano }), t)).toBe('Bien');
    expect(textoVeredicto(disco({ veredicto: 'critico', contadores: null }), t)).toBe('Crítico');
  });

  it('«Último dato con permisos de administrador: <fecha>» y los motivos con los números de entonces', () => {
    const d = disco({
      veredicto: 'critico',
      motivos: ['errores_sin_corregir'],
      contadores: null,
      datoConservado: {
        en: '2026-11-20T08:30:00.000Z',
        origen: 'admin',
        contadores: { ...sano, erroresLecturaNoCorregidos: 7 },
      },
    });
    expect(textoDatoConservado(d, t, () => '20/11/2026')).toBe(
      'Último dato con permisos de administrador: 20/11/2026',
    );
    expect(textoMotivo(d, 'errores_sin_corregir', t)).toContain('lectura: 7');
    expect(
      textoDatoConservado(
        { ...d, datoConservado: { ...d.datoConservado!, origen: 'sondeo' } },
        t,
        () => 'x',
      ),
    ).toBe('Último dato de los contadores: x');
    expect(textoDatoConservado(disco(), t, () => 'x')).toBeNull();
  });

  it('«Hacer respaldo ahora» solo en Atención y Crítico', () => {
    expect(pideRespaldo({ veredicto: 'atencion' })).toBe(true);
    expect(pideRespaldo({ veredicto: 'critico' })).toBe(true);
    expect(pideRespaldo({ veredicto: 'bien' })).toBe(false);
    expect(pideRespaldo({ veredicto: 'no_disponible' })).toBe(false);
    expect(es.avisos.hacerRespaldo).toBe('Hacer respaldo ahora');
  });

  it('los eventos nuevos de NTFS (98 y 140) tienen su explicación en todos los idiomas', () => {
    for (const id of IDIOMAS_UI) {
      const e = (diccionarios[id] as typeof es).herramientas.entorno.eventosDisco
        .explicaciones as Record<string, string>;
      expect(e['disco_98'], id).toBeTruthy();
      expect(e['disco_140'], id).toBeTruthy();
    }
  });
});
