import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  ATRIBUTO_ZONA,
  gestionadoPorOtro,
  instalarSoltarGlobal,
  llevaArchivos,
  type EventoArrastre,
} from '../src/renderer/utilidades/soltarGlobal';

/** D55: soltar en cualquier parte abre Info de archivo, salvo donde otra zona ya lo gestiona. */
const archivo = { name: 'a.txt' } as unknown as File;

/** Un elemento mínimo: `closest` responde según los selectores que «cumple». */
const elemento = (cumple: { zona?: boolean; entradaArchivo?: boolean } = {}) => ({
  closest: (sel: string) => {
    if (cumple.zona && sel.includes(`[${ATRIBUTO_ZONA}]`)) return {};
    if (cumple.entradaArchivo && sel.includes('input[type="file"]')) return {};
    return null;
  },
});

function evento(
  o: { tipos?: string[]; target?: unknown; cancelado?: boolean; files?: File[] } = {},
): EventoArrastre & { cancelado: boolean } {
  const e = {
    defaultPrevented: o.cancelado ?? false,
    cancelado: false,
    target: o.target ?? elemento(),
    relatedTarget: undefined as unknown,
    dataTransfer: {
      types: o.tipos ?? ['Files'],
      files: o.files ?? [archivo],
      dropEffect: 'none',
    },
    preventDefault() {
      e.defaultPrevented = true;
      e.cancelado = true;
    },
  };
  return e;
}

function montar() {
  const oyentes = new Map<string, (e: EventoArrastre) => void>();
  const destino = {
    addEventListener: (t: string, fn: (e: EventoArrastre) => void) => void oyentes.set(t, fn),
    removeEventListener: (t: string) => void oyentes.delete(t),
  };
  const alSoltar = vi.fn();
  const alCambiar = vi.fn();
  const quitar = instalarSoltarGlobal(destino, { alSoltar, alCambiar });
  const lanzar = (t: string, e: EventoArrastre) => oyentes.get(t)!(e);
  return { oyentes, alSoltar, alCambiar, quitar, lanzar };
}

describe('manejador global de soltar archivos', () => {
  it('detecta si el arrastre lleva archivos (y no solo texto)', () => {
    expect(llevaArchivos({ types: ['Files'] })).toBe(true);
    expect(llevaArchivos({ types: ['text/plain', 'Files'] })).toBe(true);
    expect(llevaArchivos({ types: ['text/plain'] })).toBe(false);
    expect(llevaArchivos(null)).toBe(false);
  });

  it('sin otra zona: acepta el arrastre (dragover cancelado, copia) y abre Info al soltar', () => {
    const { lanzar, alSoltar, alCambiar } = montar();
    const sobre = evento();
    lanzar('dragover', sobre);
    expect(sobre.cancelado).toBe(true);
    expect(sobre.dataTransfer?.dropEffect).toBe('copy');
    expect(alCambiar).toHaveBeenLastCalledWith(true);

    const suelto = evento();
    lanzar('drop', suelto);
    expect(suelto.cancelado).toBe(true);
    expect(alSoltar).toHaveBeenCalledOnce();
    expect(alSoltar).toHaveBeenCalledWith(archivo);
    expect(alCambiar).toHaveBeenLastCalledWith(false);
  });

  it('varios archivos: solo se atiende el primero', () => {
    const { lanzar, alSoltar } = montar();
    const otro = { name: 'b.txt' } as unknown as File;
    lanzar('drop', evento({ files: [archivo, otro] }));
    expect(alSoltar).toHaveBeenCalledTimes(1);
    expect(alSoltar).toHaveBeenCalledWith(archivo);
  });

  it('no actúa sobre una zona con data-zona-arrastre: solo evita la navegación', () => {
    const { lanzar, alSoltar, alCambiar } = montar();
    const sobre = evento({ target: elemento({ zona: true }) });
    lanzar('dragover', sobre);
    expect(sobre.cancelado).toBe(false);
    expect(alCambiar).toHaveBeenLastCalledWith(false);

    const suelto = evento({ target: elemento({ zona: true }) });
    lanzar('drop', suelto);
    expect(suelto.cancelado).toBe(true); // la ventana no navega al archivo
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it('no actúa sobre un <input type="file">', () => {
    const { lanzar, alSoltar } = montar();
    lanzar('drop', evento({ target: elemento({ entradaArchivo: true }) }));
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it('no actúa si otro manejador ya canceló el evento (zona propia sin atributo)', () => {
    const { lanzar, alSoltar } = montar();
    const sobre = evento({ cancelado: true });
    lanzar('dragover', sobre);
    expect(sobre.dataTransfer?.dropEffect).toBe('none');
    lanzar('drop', evento({ cancelado: true }));
    expect(alSoltar).not.toHaveBeenCalled();
  });

  it('no toca el arrastre de texto (p. ej. mover una línea del editor)', () => {
    const { lanzar, alSoltar, alCambiar } = montar();
    const sobre = evento({ tipos: ['text/plain'] });
    lanzar('dragover', sobre);
    lanzar('drop', evento({ tipos: ['text/plain'] }));
    expect(sobre.cancelado).toBe(false);
    expect(alSoltar).not.toHaveBeenCalled();
    expect(alCambiar).not.toHaveBeenCalledWith(true);
  });

  it('al salir de la ventana se quita la indicación; entre elementos, no', () => {
    const { lanzar, alCambiar } = montar();
    const entre = evento();
    entre.relatedTarget = {};
    lanzar('dragleave', entre);
    expect(alCambiar).not.toHaveBeenCalled();
    lanzar('dragleave', evento());
    expect(alCambiar).toHaveBeenCalledWith(false);
  });

  it('quitar() desinstala los oyentes', () => {
    const { oyentes, quitar } = montar();
    expect(oyentes.size).toBe(4);
    quitar();
    expect(oyentes.size).toBe(0);
  });

  it('gestionadoPorOtro: destino sin closest (nodo de texto) no cuenta', () => {
    expect(gestionadoPorOtro({ defaultPrevented: false, target: {} })).toBe(false);
    expect(gestionadoPorOtro({ defaultPrevented: false, target: null })).toBe(false);
  });
});

describe('zonas de arrastre de la interfaz', () => {
  const raiz = path.resolve(__dirname, '..', 'src', 'renderer');
  const fuentes = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const r = path.join(dir, n);
      return statSync(r).isDirectory() ? fuentes(r) : /\.(vue|ts)$/.test(n) ? [r] : [];
    });

  it('todo componente que gestiona arrastres declara data-zona-arrastre (el global no la pisa)', () => {
    const conManejador = fuentes(raiz).filter((f) => {
      if (f.endsWith(path.join('utilidades', 'soltarGlobal.ts'))) return false;
      return /@drop|@dragover|@dragenter|v-on:drop|addEventListener\(\s*['"]drop['"]/.test(
        readFileSync(f, 'utf8'),
      );
    });
    for (const f of conManejador) {
      expect(readFileSync(f, 'utf8'), path.relative(raiz, f)).toContain(ATRIBUTO_ZONA);
    }
  });

  it('el editor de código, que lee archivos de texto soltados, se declara zona de arrastre', () => {
    const f = readFileSync(
      path.join(raiz, 'componentes', 'herramientas', 'EditorCodigo.vue'),
      'utf8',
    );
    expect(f).toContain(ATRIBUTO_ZONA);
  });
});
