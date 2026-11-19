import type { Aviso, IdiomaUi } from '@pel/core';

/**
 * Textos de los avisos (centro de avisos y notificación nativa). Se arman solo con el código del
 * aviso y unos pocos datos cortos: nunca con rutas, mensajes de error ni salidas de logs.
 * Un código sin texto propio (p. ej. el de otra tarea) usa el genérico de su tipo.
 */
export interface TextoAviso {
  titulo: string;
  cuerpo: string;
}

type Datos = Record<string, string | number>;
type Plantilla = (d: Datos) => TextoAviso;

/** Valor corto y sin separadores de ruta: lo demás se ignora (no debe filtrarse una ruta). */
function limpio(v: string | number | undefined, respaldo: string): string {
  if (v === undefined) return respaldo;
  const t = String(v);
  return t === '' || t.length > 60 || /[\\/]/.test(t) ? respaldo : t;
}

interface Diccionario {
  porCodigo: Record<string, Plantilla>;
  porTipo: Record<Aviso['tipo'] | 'version-nueva', TextoAviso>;
}

const ES: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Un servicio se detuvo con un error',
      cuerpo: `${limpio(d['nombre'], 'Un servicio')} dejó de funcionar. Abra WolfCore Dev para ver el detalle.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Puerto ocupado',
      cuerpo: `El puerto ${limpio(d['puerto'], '?')} lo usa ${limpio(d['nombre'], 'otro programa')}: no se pudo iniciar el servicio.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Un proceso de proyecto terminó con un error',
      cuerpo: `${limpio(d['nombre'], 'Un proceso')} dejó de funcionar. Revise sus registros.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Un túnel se cayó',
      cuerpo: `El túnel de ${limpio(d['fuente'], 'un proyecto')} dejó de funcionar.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'La autoridad de certificados vence pronto',
      cuerpo: `Vence en ${limpio(d['dias'], '?')} días. Regenérela y vuelva a confiar en ella.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Un certificado vence pronto',
      cuerpo: `El certificado de ${limpio(d['fuente'], 'un sitio')} vence en ${limpio(d['dias'], '?')} días.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Un certificado venció',
      cuerpo: `El certificado de ${limpio(d['fuente'], 'un sitio')} ya no es válido. Regenérelo.`,
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'El Doctor encontró errores en el entorno',
      cuerpo: `Hay ${limpio(d['errores'], 'varios')} problemas que pueden impedir que el entorno funcione. Abra el Doctor para ver cómo repararlos.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Un servicio se detuvo',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    'puerto-ocupado': {
      titulo: 'Puerto ocupado',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    'certificado-por-vencer': {
      titulo: 'Un certificado vence pronto',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    'tunel-caido': { titulo: 'Un túnel se cayó', cuerpo: 'Abra WolfCore Dev para ver el detalle.' },
    'proceso-error': {
      titulo: 'Un proceso terminó con un error',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    doctor: {
      titulo: 'El Doctor encontró problemas',
      cuerpo: 'Abra WolfCore Dev para revisarlos.',
    },
    'contenedor-detenido': {
      titulo: 'Un contenedor se detuvo',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    'version-nueva': {
      titulo: 'Hay una versión nueva',
      cuerpo: 'Abra WolfCore Dev para actualizar.',
    },
  },
};

const EN: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'A service stopped with an error',
      cuerpo: `${limpio(d['nombre'], 'A service')} stopped working. Open WolfCore Dev for details.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Port in use',
      cuerpo: `Port ${limpio(d['puerto'], '?')} is used by ${limpio(d['nombre'], 'another program')}: the service could not start.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'A project process ended with an error',
      cuerpo: `${limpio(d['nombre'], 'A process')} stopped working. Check its logs.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'A tunnel went down',
      cuerpo: `The tunnel for ${limpio(d['fuente'], 'a project')} stopped working.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'The certificate authority expires soon',
      cuerpo: `It expires in ${limpio(d['dias'], '?')} days. Regenerate it and trust it again.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'A certificate expires soon',
      cuerpo: `The certificate for ${limpio(d['fuente'], 'a site')} expires in ${limpio(d['dias'], '?')} days.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'A certificate expired',
      cuerpo: `The certificate for ${limpio(d['fuente'], 'a site')} is no longer valid. Regenerate it.`,
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'The Doctor found errors in the environment',
      cuerpo: `${limpio(d['errores'], 'Several')} problems may keep the environment from working. Open the Doctor to see how to fix them.`,
    }),
  },
  porTipo: {
    'servicio-caido': { titulo: 'A service stopped', cuerpo: 'Open WolfCore Dev for details.' },
    'puerto-ocupado': { titulo: 'Port in use', cuerpo: 'Open WolfCore Dev for details.' },
    'certificado-por-vencer': {
      titulo: 'A certificate expires soon',
      cuerpo: 'Open WolfCore Dev for details.',
    },
    'tunel-caido': { titulo: 'A tunnel went down', cuerpo: 'Open WolfCore Dev for details.' },
    'proceso-error': {
      titulo: 'A process ended with an error',
      cuerpo: 'Open WolfCore Dev for details.',
    },
    doctor: { titulo: 'The Doctor found problems', cuerpo: 'Open WolfCore Dev to review them.' },
    'contenedor-detenido': {
      titulo: 'A container stopped',
      cuerpo: 'Open WolfCore Dev for details.',
    },
    'version-nueva': {
      titulo: 'A new version is available',
      cuerpo: 'Open WolfCore Dev to update.',
    },
  },
};

const DICCIONARIOS = { es: ES, en: EN } satisfies Record<IdiomaUi, Diccionario>;

export const CODIGOS_AVISO = Object.keys(ES.porCodigo);

export function textoAviso(
  idioma: IdiomaUi | null,
  a: Pick<Aviso, 'tipo' | 'codigo' | 'datos'>,
): TextoAviso {
  const dic = DICCIONARIOS[idioma ?? 'es'];
  const plantilla = dic.porCodigo[a.codigo];
  if (plantilla) return plantilla(a.datos);
  return dic.porTipo[a.tipo] ?? { titulo: 'WolfCore Dev', cuerpo: '' };
}
