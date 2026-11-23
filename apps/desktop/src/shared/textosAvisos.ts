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
  porTipo: Record<Aviso['tipo'], TextoAviso>;
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
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Un contenedor se detuvo',
      cuerpo: `${limpio(d['nombre'], 'Un contenedor')} (${limpio(d['motor'], 'Docker')}) se detuvo sin que se lo pidiera${d['codigoSalida'] !== undefined ? ` (código ${limpio(d['codigoSalida'], '?')})` : ''}.`,
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
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'El PHP propio de un sitio no arrancó',
      cuerpo: `El PHP de ${limpio(d['fuente'], 'un sitio')} no arrancó (puede que su puerto lo use otro programa). Revise la sección PHP de su tarjeta.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Sin puertos para el PHP de un sitio',
      cuerpo: `${limpio(d['fuente'], 'Un sitio')} usa el PHP compartido de su versión, sin sus ajustes: no quedan puertos libres para su PHP propio.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'Ajustes de PHP descartados',
      cuerpo: `Algunos ajustes de PHP de ${limpio(d['fuente'], 'un sitio')} no son válidos y no se aplicaron: ${limpio(d['claves'], 'revise la sección PHP')}.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Reglas de Nginx descartadas',
      cuerpo: `Las reglas propias de ${limpio(d['fuente'], 'un sitio')} ya no pasan la revisión (cambió su carpeta, sus dominios o los puertos) y quedaron fuera de su vhost. Revíselas en su sección Nginx.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Vhost escrito a mano sin usar',
      cuerpo: `El vhost escrito a mano de ${limpio(d['fuente'], 'un sitio')} ya no pasa la revisión (cambió su carpeta, sus dominios o los puertos): se usa el generado. Revíselo en su sección Nginx.`,
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Hay una versión nueva de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una versión nueva')} ya está publicada (tiene ${limpio(d['actual'], 'otra')}). Ábrala en Servicios → Versiones para actualizar; nada se instala solo.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nueva rama de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una rama nueva')} es más nueva que la que usa (${limpio(d['actual'], '?')}). Se instala aparte, sin tocar sus datos.`,
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
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'A container stopped',
      cuerpo: `${limpio(d['nombre'], 'A container')} (${limpio(d['motor'], 'Docker')}) stopped without being asked to${d['codigoSalida'] !== undefined ? ` (code ${limpio(d['codigoSalida'], '?')})` : ''}.`,
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
    'avisos.php_sitio_fallo': (d) => ({
      titulo: "A site's own PHP did not start",
      cuerpo: `The PHP of ${limpio(d['fuente'], 'a site')} did not start (another program may be using its port). Check the PHP section of its card.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: "No ports for a site's PHP",
      cuerpo: `${limpio(d['fuente'], 'A site')} uses the shared PHP of its version, without its settings: there are no free ports left for its own PHP.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'PHP settings discarded',
      cuerpo: `Some PHP settings of ${limpio(d['fuente'], 'a site')} are not valid and were not applied: ${limpio(d['claves'], 'check the PHP section')}.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Custom Nginx rules discarded',
      cuerpo: `The custom rules of ${limpio(d['fuente'], 'a site')} no longer pass the check (its folder, domains or ports changed) and were left out of its vhost. Review them in its Nginx section.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Hand-written vhost not used',
      cuerpo: `The hand-written vhost of ${limpio(d['fuente'], 'a site')} no longer passes the check (its folder, domains or ports changed): the generated one is used. Review it in its Nginx section.`,
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `A new version of ${limpio(d['servicio'], 'a service')} is available`,
      cuerpo: `${limpio(d['nueva'], 'A new version')} has been published (you have ${limpio(d['actual'], 'another one')}). Open Services → Versions to update; nothing is installed automatically.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `New ${limpio(d['servicio'], 'service')} branch`,
      cuerpo: `${limpio(d['nueva'], 'A new branch')} is newer than the one you use (${limpio(d['actual'], '?')}). It installs side by side, without touching your data.`,
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
