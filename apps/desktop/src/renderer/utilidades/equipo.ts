/**
 * Textos y resumen de «Mi equipo» y de «Qué modelo cabe en su equipo» (D55). Funciones puras: el
 * núcleo da los datos (`InfoEquipo`, `CompatibilidadModelo`) y aquí se vuelven frases en el idioma
 * de la interfaz. Nada de lo que sale lleva números de serie ni identificadores únicos (el núcleo
 * no los lee), así que el resumen se puede pegar tal cual en un ticket de soporte.
 */
import type { CompatibilidadModelo, InfoEquipo, SugerenciaEquipo } from '@pel/core';
import { formatearTamano } from './bd';

export interface TextosEquipo {
  desconocido: string;
  sinGpu: string;
  so: string;
  cpu: string;
  ram: string;
  gpu: string;
  placa: string;
  /** `Disco {u}` */
  disco: string;
  /** `compilación {n}` */
  compilacion: string;
  /** `{n} núcleos, {h} hilos` */
  nucleosHilos: string;
  /** `{total} en total, {libre} libres` */
  ramDetalle: string;
  /** `{v} de VRAM` */
  vram: string;
  /** `{libre} libres de {total}` */
  discoDetalle: string;
  ssd: string;
  hdd: string;
  /** `Resumen del equipo · WolfCore Dev {v}` */
  resumenTitulo: string;
  /** Sin versión de la aplicación. */
  resumenTituloSinVersion: string;
}

export interface TextosCompat {
  sugerenciaVram: string;
  sugerenciaRam: string;
  sugerenciaPequena: string;
  sugerenciaDesconocida: string;
  motivos: Record<string, string>;
}

/** Sustituye `{nombre}` por su valor; lo que no se conoce se deja tal cual. */
export function rellenar(plantilla: string, valores: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = valores[k];
    return v === undefined ? m : String(v);
  });
}

export interface LineaEquipo {
  etiqueta: string;
  valor: string;
}

/** Los datos del equipo como líneas «etiqueta: valor», con «desconocido» donde falte algo. */
export function lineasEquipo(e: InfoEquipo, t: TextosEquipo): LineaEquipo[] {
  const l: LineaEquipo[] = [];

  const so = [e.so.nombre, e.so.version].filter((x): x is string => !!x).join(' ');
  l.push({
    etiqueta: t.so,
    valor: so
      ? e.so.compilacion && !so.endsWith(`.${e.so.compilacion}`)
        ? `${so} (${rellenar(t.compilacion, { n: e.so.compilacion })})`
        : so
      : t.desconocido,
  });

  const nh =
    e.cpu.nucleos !== null && e.cpu.hilos !== null
      ? rellenar(t.nucleosHilos, { n: e.cpu.nucleos, h: e.cpu.hilos })
      : null;
  l.push({
    etiqueta: t.cpu,
    valor: e.cpu.modelo ? (nh ? `${e.cpu.modelo} — ${nh}` : e.cpu.modelo) : t.desconocido,
  });

  l.push({
    etiqueta: t.ram,
    valor:
      e.ram.totalBytes === null
        ? t.desconocido
        : e.ram.libreBytes === null
          ? formatearTamano(e.ram.totalBytes)
          : rellenar(t.ramDetalle, {
              total: formatearTamano(e.ram.totalBytes),
              libre: formatearTamano(e.ram.libreBytes),
            }),
  });

  if (e.gpus.length === 0) l.push({ etiqueta: t.gpu, valor: t.sinGpu });
  for (const g of e.gpus) {
    l.push({
      etiqueta: t.gpu,
      valor:
        g.vramBytes === null
          ? g.nombre
          : `${g.nombre} — ${rellenar(t.vram, { v: formatearTamano(g.vramBytes) })}`,
    });
  }

  if (e.discos.length === 0)
    l.push({ etiqueta: rellenar(t.disco, { u: '' }).trim(), valor: t.desconocido });
  for (const d of e.discos) {
    const tipo = d.tipo === 'ssd' ? t.ssd : d.tipo === 'hdd' ? t.hdd : null;
    const detalle =
      d.totalBytes === null || d.libreBytes === null
        ? t.desconocido
        : rellenar(t.discoDetalle, {
            libre: formatearTamano(d.libreBytes),
            total: formatearTamano(d.totalBytes),
          });
    l.push({
      etiqueta: rellenar(t.disco, { u: d.unidad }),
      valor: [tipo, detalle].filter((x): x is string => !!x).join(' · '),
    });
  }

  const placa = [e.placa.fabricante, e.placa.modelo].filter((x): x is string => !!x).join(' ');
  l.push({ etiqueta: t.placa, valor: placa || t.desconocido });
  return l;
}

/** Texto plano para pegar en un ticket de soporte (sin identificadores únicos). */
export function resumenEquipo(e: InfoEquipo, t: TextosEquipo, version: string | null): string {
  const titulo = version ? rellenar(t.resumenTitulo, { v: version }) : t.resumenTituloSinVersion;
  return [titulo, ...lineasEquipo(e, t).map((x) => `${x.etiqueta}: ${x.valor}`)].join('\n');
}

/** «Para su equipo: modelos de hasta ≈7B…». */
export function textoSugerencia(s: SugerenciaEquipo, c: TextosCompat): string {
  if (s.memoria === null) return c.sugerenciaDesconocida;
  if (s.parametrosMaxB === null) return c.sugerenciaPequena;
  return rellenar(s.memoria === 'vram' ? c.sugerenciaVram : c.sugerenciaRam, {
    b: s.parametrosMaxB,
  });
}

/** Explicación corta de un veredicto, con las cifras de memoria. */
export function explicacionCompat(m: CompatibilidadModelo, c: TextosCompat): string {
  const plantilla = c.motivos[m.motivo] ?? '';
  return rellenar(plantilla, {
    necesario: m.necesarioBytes === null ? '—' : formatearTamano(m.necesarioBytes),
    disponible: m.disponibleBytes === null ? '—' : formatearTamano(m.disponibleBytes),
  });
}
