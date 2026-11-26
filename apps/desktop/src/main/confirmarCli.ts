import type { SolicitudCli } from '@pel/core';
import type { TextosMain } from './textos';

/** Lo que se le pasa al diálogo nativo (un subconjunto de `MessageBoxOptions`). */
export interface OpcionesDialogoCli {
  type: 'warning';
  title: string;
  message: string;
  detail?: string;
  buttons: string[];
  defaultId: number;
  cancelId: number;
  noLink: true;
}

export interface DepsConfirmarCli {
  mostrar(o: OpcionesDialogoCli): Promise<{ response: number }>;
  textos(): TextosMain;
  /** [0, 1): para mezclar las opciones de dominio (pruebas). */
  aleatorio?: () => number;
}

const llenar = (t: string, v: Record<string, string>): string =>
  t.replace(/\{(\w+)\}/g, (_m, k: string) => v[k] ?? '');

/** Dominios parecidos que no son el del sitio (la opción correcta no está siempre en el mismo lugar). */
export function senuelos(dominio: string): string[] {
  const base = dominio.replace(/\.test$/, '');
  return [`${base}-2.test`, `${base}-old.test`];
}

/**
 * Confirmación en un diálogo nativo de la app para lo que la CLI no puede decidir por sí sola:
 * publicar un sitio en internet y cambiar el PHP de todas las terminales. Por defecto (y al
 * cerrarlo) se cancela. Con datos reales no hay botón "Publicar": hay que elegir el dominio exacto
 * del sitio entre varios parecidos (el diálogo nativo no tiene campo de texto).
 */
export function crearConfirmarCli(d: DepsConfirmarCli): (s: SolicitudCli) => Promise<boolean> {
  const azar = d.aleatorio ?? Math.random;
  return async (s) => {
    const t = d.textos();
    if (s.tipo === 'php-global') {
      const r = await d.mostrar({
        type: 'warning',
        title: t.cliTitulo,
        message: llenar(t.cliPhpGlobal, { version: s.version }),
        buttons: [t.cancelar, t.cliCambiar],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      return r.response === 1;
    }
    const aviso = llenar(s.alcance === 'tailnet' ? t.cliTunelTailnet : t.cliTunelInternet, {
      dominio: s.dominio,
      proveedor: s.proveedor,
    });
    const detalle = s.publicoEn ? llenar(t.cliPublicoEn, { publico: s.publicoEn }) : undefined;
    if (!s.datosReales) {
      const r = await d.mostrar({
        type: 'warning',
        title: t.cliTitulo,
        message: aviso,
        ...(detalle ? { detail: detalle } : {}),
        buttons: [t.cancelar, t.cliPublicar],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      return r.response === 1;
    }
    const opciones = [s.dominio, ...senuelos(s.dominio)]
      .map((v) => ({ v, k: azar() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.v);
    const r = await d.mostrar({
      type: 'warning',
      title: t.cliTitulo,
      message: `${aviso}\n\n${llenar(t.cliDatosReales, { dominio: s.dominio })}`,
      ...(detalle ? { detail: detalle } : {}),
      buttons: [t.cancelar, ...opciones],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    return r.response >= 1 && opciones[r.response - 1] === s.dominio;
  };
}
