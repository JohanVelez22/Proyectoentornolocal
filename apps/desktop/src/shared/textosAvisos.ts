import type { Aviso, IdiomaUi } from '@pel/core';

/**
 * Textos de los avisos (centro de avisos y notificación nativa). Se arman solo con el código del
 * aviso y unos pocos datos cortos: nunca con rutas, mensajes de error ni salidas de logs.
 * Un código sin texto propio (p. ej. el de otra tarea) usa el genérico de su tipo.
 */
export interface TextoAviso {
  titulo: string;
  cuerpo: string;
  /** Texto del botón de acción del toast (solo los avisos que lo ofrecen). */
  accion?: string;
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
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Iniciar todo no pudo encender todo',
      cuerpo: `No arrancó: ${limpio(d['nombres'], 'algún servicio')}. Abra Servicios para ver el detalle.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Puerto ocupado',
      cuerpo: `El puerto ${limpio(d['puerto'], '?')} lo usa ${limpio(d['nombre'], 'otro programa')}: no se pudo iniciar el servicio.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Un proceso de proyecto terminó con un error',
      cuerpo: `${limpio(d['nombre'], 'Un proceso')} dejó de funcionar. Revise sus registros.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Un proceso terminó',
      cuerpo: `${limpio(d['nombre'], 'Un proceso')} terminó sin errores.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Un proceso falló',
      cuerpo: `${limpio(d['nombre'], 'Un proceso')} terminó con un error${d['codigoSalida'] !== undefined ? ` (código ${limpio(d['codigoSalida'], '?')})` : ''}. Revise sus registros.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Una receta terminó',
      cuerpo: `La receta de ${limpio(d['sitio'], 'un proyecto')} terminó sin errores.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Una receta falló',
      cuerpo: `La receta de ${limpio(d['sitio'], 'un proyecto')} se detuvo con un error. Abra el proyecto para ver el paso.`,
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
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup ya estaba instalado en otro lugar',
      cuerpo:
        'Se instaló el Rust de WolfCore Dev en su propia carpeta. Windows ya tenía una entrada de desinstalación de rustup que apunta a otra instalación: no se tocó.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Hay una versión nueva de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una versión nueva')} ya está publicada (tiene ${limpio(d['actual'], 'otra')}). Ábrala en Servicios → Versiones para actualizar; nada se instala solo.`,
      accion: 'Actualizar',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Hay una versión nueva de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una versión nueva')} ya está publicada (tiene ${limpio(d['actual'], 'otra')}), sin huella publicada: no se puede verificar la descarga. Revísela en Servicios → Versiones; instalarla pide su confirmación.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Nueva rama de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una rama nueva')} es más nueva que la que usa (${limpio(d['actual'], '?')}), sin huella publicada: no se puede verificar la descarga. Revísela en Servicios → Versiones; instalarla pide su confirmación.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nueva rama de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una rama nueva')} es más nueva que la que usa (${limpio(d['actual'], '?')}). Se instala aparte, sin tocar sus datos.`,
      accion: 'Actualizar',
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
    'proceso-terminado': {
      titulo: 'Un proceso terminó',
      cuerpo: 'Abra WolfCore Dev para ver el detalle.',
    },
    'receta-terminada': {
      titulo: 'Una receta terminó',
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
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Start all could not start everything',
      cuerpo: `Did not start: ${limpio(d['nombres'], 'some service')}. Open Services for details.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Port in use',
      cuerpo: `Port ${limpio(d['puerto'], '?')} is used by ${limpio(d['nombre'], 'another program')}: the service could not start.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'A project process ended with an error',
      cuerpo: `${limpio(d['nombre'], 'A process')} stopped working. Check its logs.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'A process finished',
      cuerpo: `${limpio(d['nombre'], 'A process')} finished without errors.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'A process failed',
      cuerpo: `${limpio(d['nombre'], 'A process')} ended with an error${d['codigoSalida'] !== undefined ? ` (code ${limpio(d['codigoSalida'], '?')})` : ''}. Check its logs.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'A recipe finished',
      cuerpo: `The recipe of ${limpio(d['sitio'], 'a project')} finished without errors.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'A recipe failed',
      cuerpo: `The recipe of ${limpio(d['sitio'], 'a project')} stopped with an error. Open the project to see the step.`,
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
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup was already installed elsewhere',
      cuerpo:
        'The WolfCore Dev Rust was installed in its own folder. Windows already had a rustup uninstall entry that points to another installation: it was left untouched.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `A new version of ${limpio(d['servicio'], 'a service')} is available`,
      cuerpo: `${limpio(d['nueva'], 'A new version')} has been published (you have ${limpio(d['actual'], 'another one')}). Open Services → Versions to update; nothing is installed automatically.`,
      accion: 'Update',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `A new version of ${limpio(d['servicio'], 'a service')} is available`,
      cuerpo: `${limpio(d['nueva'], 'A new version')} has been published (you have ${limpio(d['actual'], 'another one')}), with no published checksum: the download cannot be verified. Review it in Services → Versions; installing it asks for your confirmation.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `New ${limpio(d['servicio'], 'service')} branch`,
      cuerpo: `${limpio(d['nueva'], 'A new branch')} is newer than the one you use (${limpio(d['actual'], '?')}), with no published checksum: the download cannot be verified. Review it in Services → Versions; installing it asks for your confirmation.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `New ${limpio(d['servicio'], 'service')} branch`,
      cuerpo: `${limpio(d['nueva'], 'A new branch')} is newer than the one you use (${limpio(d['actual'], '?')}). It installs side by side, without touching your data.`,
      accion: 'Update',
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
    'proceso-terminado': {
      titulo: 'A process finished',
      cuerpo: 'Open WolfCore Dev for details.',
    },
    'receta-terminada': {
      titulo: 'A recipe finished',
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

const PT: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Um serviço parou com um erro',
      cuerpo: `${limpio(d['nombre'], 'Um serviço')} parou de funcionar. Abra o WolfCore Dev para ver os detalhes.`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Iniciar tudo não conseguiu ligar tudo',
      cuerpo: `Não iniciou: ${limpio(d['nombres'], 'algum serviço')}. Abra Serviços para ver os detalhes.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Porta ocupada',
      cuerpo: `A porta ${limpio(d['puerto'], '?')} está sendo usada por ${limpio(d['nombre'], 'outro programa')}: não foi possível iniciar o serviço.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Um processo de projeto terminou com um erro',
      cuerpo: `${limpio(d['nombre'], 'Um processo')} parou de funcionar. Confira os registros dele.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Um processo terminou',
      cuerpo: `${limpio(d['nombre'], 'Um processo')} terminou sem erros.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Um processo falhou',
      cuerpo: `${limpio(d['nombre'], 'Um processo')} terminou com um erro${d['codigoSalida'] !== undefined ? ` (código ${limpio(d['codigoSalida'], '?')})` : ''}. Confira os registros dele.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Uma receita terminou',
      cuerpo: `A receita de ${limpio(d['sitio'], 'um projeto')} terminou sem erros.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Uma receita falhou',
      cuerpo: `A receita de ${limpio(d['sitio'], 'um projeto')} parou com um erro. Abra o projeto para ver a etapa.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Um túnel caiu',
      cuerpo: `O túnel de ${limpio(d['fuente'], 'um projeto')} parou de funcionar.`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Um contêiner parou',
      cuerpo: `${limpio(d['nombre'], 'Um contêiner')} (${limpio(d['motor'], 'Docker')}) parou sem que você pedisse${d['codigoSalida'] !== undefined ? ` (código ${limpio(d['codigoSalida'], '?')})` : ''}.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'A autoridade certificadora vence em breve',
      cuerpo: `Ela vence em ${limpio(d['dias'], '?')} dias. Gere-a de novo e volte a confiar nela.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Um certificado vence em breve',
      cuerpo: `O certificado de ${limpio(d['fuente'], 'um site')} vence em ${limpio(d['dias'], '?')} dias.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Um certificado venceu',
      cuerpo: `O certificado de ${limpio(d['fuente'], 'um site')} não é mais válido. Gere-o de novo.`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'O PHP próprio de um site não iniciou',
      cuerpo: `O PHP de ${limpio(d['fuente'], 'um site')} não iniciou (talvez outro programa esteja usando a porta dele). Confira a seção PHP do cartão dele.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Sem portas para o PHP de um site',
      cuerpo: `${limpio(d['fuente'], 'Um site')} usa o PHP compartilhado da sua versão, sem as configurações próprias: não há mais portas livres para o PHP dele.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'Configurações do PHP descartadas',
      cuerpo: `Algumas configurações do PHP de ${limpio(d['fuente'], 'um site')} não são válidas e não foram aplicadas: ${limpio(d['claves'], 'confira a seção PHP')}.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Regras do Nginx descartadas',
      cuerpo: `As regras próprias de ${limpio(d['fuente'], 'um site')} não passam mais na verificação (a pasta, os domínios ou as portas mudaram) e ficaram fora do vhost dele. Revise-as na seção Nginx.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Vhost escrito à mão não usado',
      cuerpo: `O vhost escrito à mão de ${limpio(d['fuente'], 'um site')} não passa mais na verificação (a pasta, os domínios ou as portas mudaram): o gerado automaticamente é usado. Revise-o na seção Nginx.`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'O rustup já estava instalado em outro lugar',
      cuerpo:
        'O Rust do WolfCore Dev foi instalado na sua própria pasta. O Windows já tinha uma entrada de desinstalação do rustup que aponta para outra instalação: ela não foi alterada.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Há uma nova versão de ${limpio(d['servicio'], 'um serviço')}`,
      cuerpo: `${limpio(d['nueva'], 'Uma nova versão')} já foi publicada (você tem ${limpio(d['actual'], 'outra')}). Abra Serviços → Versões para atualizar; nada é instalado sozinho.`,
      accion: 'Atualizar',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Há uma nova versão de ${limpio(d['servicio'], 'um serviço')}`,
      cuerpo: `${limpio(d['nueva'], 'Uma nova versão')} já foi publicada (você tem ${limpio(d['actual'], 'outra')}), sem checksum publicado: não é possível verificar o download. Confira em Serviços → Versões; instalar pede a sua confirmação.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Nova linha de ${limpio(d['servicio'], 'um serviço')}`,
      cuerpo: `${limpio(d['nueva'], 'Uma nova linha')} é mais recente que a que você usa (${limpio(d['actual'], '?')}), sem checksum publicado: não é possível verificar o download. Confira em Serviços → Versões; instalar pede a sua confirmação.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nova linha de ${limpio(d['servicio'], 'um serviço')}`,
      cuerpo: `${limpio(d['nueva'], 'Uma nova linha')} é mais recente que a que você usa (${limpio(d['actual'], '?')}). Ela é instalada em paralelo, sem tocar nos seus dados.`,
      accion: 'Atualizar',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'O Doctor encontrou erros no ambiente',
      cuerpo: `Há ${limpio(d['errores'], 'vários')} problemas que podem impedir o ambiente de funcionar. Abra o Doctor para ver como corrigi-los.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Um serviço parou',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'puerto-ocupado': {
      titulo: 'Porta ocupada',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'certificado-por-vencer': {
      titulo: 'Um certificado vence em breve',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'tunel-caido': {
      titulo: 'Um túnel caiu',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'proceso-error': {
      titulo: 'Um processo terminou com um erro',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'proceso-terminado': {
      titulo: 'Um processo terminou',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'receta-terminada': {
      titulo: 'Uma receita terminou',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    doctor: {
      titulo: 'O Doctor encontrou problemas',
      cuerpo: 'Abra o WolfCore Dev para revisá-los.',
    },
    'contenedor-detenido': {
      titulo: 'Um contêiner parou',
      cuerpo: 'Abra o WolfCore Dev para ver os detalhes.',
    },
    'version-nueva': {
      titulo: 'Há uma nova versão',
      cuerpo: 'Abra o WolfCore Dev para atualizar.',
    },
  },
};

const FR: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Un service s’est arrêté sur une erreur',
      cuerpo: `${limpio(d['nombre'], 'Un service')} a cessé de fonctionner. Ouvrez WolfCore Dev pour voir le détail.`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Tout démarrer n’a pas pu tout allumer',
      cuerpo: `N’a pas démarré : ${limpio(d['nombres'], 'un service')}. Ouvrez Services pour voir le détail.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Port occupé',
      cuerpo: `Le port ${limpio(d['puerto'], '?')} est utilisé par ${limpio(d['nombre'], 'un autre programme')} : le service n’a pas pu démarrer.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Un processus de projet s’est terminé sur une erreur',
      cuerpo: `${limpio(d['nombre'], 'Un processus')} a cessé de fonctionner. Consultez ses journaux.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Un processus s’est terminé',
      cuerpo: `${limpio(d['nombre'], 'Un processus')} s’est terminé sans erreur.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Un processus a échoué',
      cuerpo: `${limpio(d['nombre'], 'Un processus')} s’est terminé sur une erreur${d['codigoSalida'] !== undefined ? ` (code ${limpio(d['codigoSalida'], '?')})` : ''}. Consultez ses journaux.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Une recette est terminée',
      cuerpo: `La recette de ${limpio(d['sitio'], 'un projet')} s’est terminée sans erreur.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Une recette a échoué',
      cuerpo: `La recette de ${limpio(d['sitio'], 'un projet')} s’est arrêtée sur une erreur. Ouvrez le projet pour voir l’étape.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Un tunnel est tombé',
      cuerpo: `Le tunnel de ${limpio(d['fuente'], 'un projet')} a cessé de fonctionner.`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Un conteneur s’est arrêté',
      cuerpo: `${limpio(d['nombre'], 'Un conteneur')} (${limpio(d['motor'], 'Docker')}) s’est arrêté sans que vous l’ayez demandé${d['codigoSalida'] !== undefined ? ` (code ${limpio(d['codigoSalida'], '?')})` : ''}.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'L’autorité de certification expire bientôt',
      cuerpo: `Elle expire dans ${limpio(d['dias'], '?')} jours. Régénérez-la et accordez-lui de nouveau votre confiance.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Un certificat expire bientôt',
      cuerpo: `Le certificat de ${limpio(d['fuente'], 'un site')} expire dans ${limpio(d['dias'], '?')} jours.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Un certificat a expiré',
      cuerpo: `Le certificat de ${limpio(d['fuente'], 'un site')} n’est plus valide. Régénérez-le.`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'Le PHP propre d’un site n’a pas démarré',
      cuerpo: `Le PHP de ${limpio(d['fuente'], 'un site')} n’a pas démarré (un autre programme utilise peut-être son port). Consultez la section PHP de sa carte.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Plus de ports pour le PHP d’un site',
      cuerpo: `${limpio(d['fuente'], 'Un site')} utilise le PHP partagé de sa version, sans ses réglages : il ne reste aucun port libre pour son PHP propre.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'Réglages PHP ignorés',
      cuerpo: `Certains réglages PHP de ${limpio(d['fuente'], 'un site')} ne sont pas valides et n’ont pas été appliqués : ${limpio(d['claves'], 'consultez la section PHP')}.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Règles Nginx ignorées',
      cuerpo: `Les règles personnalisées de ${limpio(d['fuente'], 'un site')} ne passent plus la vérification (son dossier, ses domaines ou ses ports ont changé) et ont été exclues de son vhost. Revoyez-les dans sa section Nginx.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Vhost écrit à la main non utilisé',
      cuerpo: `Le vhost écrit à la main de ${limpio(d['fuente'], 'un site')} ne passe plus la vérification (son dossier, ses domaines ou ses ports ont changé) : le vhost généré est utilisé. Revoyez-le dans sa section Nginx.`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup était déjà installé ailleurs',
      cuerpo:
        'Le Rust de WolfCore Dev a été installé dans son propre dossier. Windows avait déjà une entrée de désinstallation de rustup pointant vers une autre installation : elle n’a pas été modifiée.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Une nouvelle version de ${limpio(d['servicio'], 'un service')} est disponible`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle version')} est publiée (vous avez ${limpio(d['actual'], 'une autre')}). Ouvrez Services → Versions pour mettre à jour ; rien ne s’installe tout seul.`,
      accion: 'Mettre à jour',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Une nouvelle version de ${limpio(d['servicio'], 'un service')} est disponible`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle version')} est publiée (vous avez ${limpio(d['actual'], 'une autre')}), sans empreinte publiée : le téléchargement ne peut pas être vérifié. Consultez-la dans Services → Versions ; l’installer demande votre confirmation.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Nouvelle branche de ${limpio(d['servicio'], 'un service')}`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle branche')} est plus récente que celle que vous utilisez (${limpio(d['actual'], '?')}), sans empreinte publiée : le téléchargement ne peut pas être vérifié. Consultez-la dans Services → Versions ; l’installer demande votre confirmation.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nouvelle branche de ${limpio(d['servicio'], 'un service')}`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle branche')} est plus récente que celle que vous utilisez (${limpio(d['actual'], '?')}). Elle s’installe à côté, sans toucher à vos données.`,
      accion: 'Mettre à jour',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'Le Doctor a trouvé des erreurs dans l’environnement',
      cuerpo: `${limpio(d['errores'], 'Plusieurs')} problèmes peuvent empêcher l’environnement de fonctionner. Ouvrez le Doctor pour voir comment les réparer.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Un service s’est arrêté',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'puerto-ocupado': {
      titulo: 'Port occupé',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'certificado-por-vencer': {
      titulo: 'Un certificat expire bientôt',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'tunel-caido': {
      titulo: 'Un tunnel est tombé',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'proceso-error': {
      titulo: 'Un processus s’est terminé sur une erreur',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'proceso-terminado': {
      titulo: 'Un processus s’est terminé',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'receta-terminada': {
      titulo: 'Une recette est terminée',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    doctor: {
      titulo: 'Le Doctor a trouvé des problèmes',
      cuerpo: 'Ouvrez WolfCore Dev pour les examiner.',
    },
    'contenedor-detenido': {
      titulo: 'Un conteneur s’est arrêté',
      cuerpo: 'Ouvrez WolfCore Dev pour voir le détail.',
    },
    'version-nueva': {
      titulo: 'Une nouvelle version est disponible',
      cuerpo: 'Ouvrez WolfCore Dev pour mettre à jour.',
    },
  },
};

const DICCIONARIOS = { es: ES, en: EN, pt: PT, fr: FR } satisfies Record<IdiomaUi, Diccionario>;

export const CODIGOS_AVISO = Object.keys(ES.porCodigo);

/** Códigos con texto propio en cada idioma (una prueba exige que sean los mismos). */
export const CODIGOS_AVISO_POR_IDIOMA: Record<IdiomaUi, string[]> = {
  es: Object.keys(ES.porCodigo),
  en: Object.keys(EN.porCodigo),
  pt: Object.keys(PT.porCodigo),
  fr: Object.keys(FR.porCodigo),
};

export function textoAviso(
  idioma: IdiomaUi | null,
  a: Pick<Aviso, 'tipo' | 'codigo' | 'datos'>,
): TextoAviso {
  const dic = DICCIONARIOS[idioma ?? 'es'];
  const plantilla = dic.porCodigo[a.codigo];
  if (plantilla) return plantilla(a.datos);
  return dic.porTipo[a.tipo] ?? { titulo: 'WolfCore Dev', cuerpo: '' };
}
