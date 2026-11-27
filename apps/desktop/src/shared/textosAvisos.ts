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
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Un workspace no pudo encender todo',
      cuerpo: `${limpio(d['nombre'], 'El workspace')}: no arrancó ${limpio(d['nombres'], 'algún elemento')}. Abra Inicio para ver qué quedó encendido.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Un workspace no pudo apagar todo',
      cuerpo: `${limpio(d['nombre'], 'El workspace')}: no se apagó ${limpio(d['nombres'], 'algún elemento')}. Abra Inicio para ver qué sigue encendido.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Una tarea programada tardó demasiado'
          : 'Una tarea programada falló',
      cuerpo: `${limpio(d['nombre'], 'Una tarea')} (${limpio(d['sitio'], 'un proyecto')}) ${d['motivo'] === 'tiempo' ? 'superó su tiempo máximo y se detuvo' : 'terminó con un error'}. Abra el proyecto para ver su registro.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Una tarea programada no se ejecutó',
      cuerpo: `${limpio(d['nombre'], 'Una tarea')} (${limpio(d['sitio'], 'un proyecto')}): ${
        {
          aislado: 'la carpeta de datos es de prueba y no se permitió ejecutar tareas',
          no_confiado: 'el proyecto no está marcado como de confianza',
          receta_cambio: 'la receta del proyecto cambió desde que confió en él',
          sin_confirmar: 'falta confirmar su comando',
          comando_invalido: 'su comando no está permitido',
          cron_invalida: 'su horario no es válido',
          carpeta: 'la carpeta del proyecto no existe',
        }[String(d['motivo'])] ?? 'no se cumplen las condiciones'
      }.`,
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
    'avisos.proceso_sin_codigo': (d) => ({
      titulo: 'Un proceso terminó',
      cuerpo: `${limpio(d['nombre'], 'Un proceso')} terminó (código desconocido). No se pudo saber si fue bien: revise sus registros.`,
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
    'avisos.credenciales_sin_proteccion': () => ({
      titulo: 'Las claves guardadas no quedaron protegidas',
      cuerpo:
        'No se pudo dejar el archivo de claves de WolfCore Dev legible solo para su usuario de Windows. Los datos están a salvo, pero revise los permisos de la carpeta de datos.',
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
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Se dejó de compartir en la red local',
      cuerpo: `La red cambió: se dejó de compartir ${limpio(d['fuente'], 'un sitio')}.`,
    }),
    'avisos.https_quitado': (d) => ({
      titulo: 'Sitios sin HTTPS',
      cuerpo: `${limpio(d['fuente'], 'Algunos sitios')} pasó a HTTP: el puerto ${limpio(d['puerto'], '443')} lo ocupa ${limpio(d['ocupadoPor'], 'otro programa')}. Ciérrelo o cambie el puerto HTTPS en Ajustes y el HTTPS volverá al aplicar.`,
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
      titulo: `Nueva versión principal de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una versión principal nueva')} es más nueva que la que usa (${limpio(d['actual'], '?')}), sin huella publicada: no se puede verificar la descarga. Revísela en Servicios → Versiones; instalarla pide su confirmación.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nueva versión principal de ${limpio(d['servicio'], 'un servicio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una versión principal nueva')} es más nueva que la que usa (${limpio(d['actual'], '?')}). Se instala aparte, sin tocar sus datos.`,
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
    'avisos.workspace_fallos': (d) => ({
      titulo: 'A workspace could not start everything',
      cuerpo: `${limpio(d['nombre'], 'The workspace')}: ${limpio(d['nombres'], 'some item')} did not start. Open Home to see what is running.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'A workspace could not stop everything',
      cuerpo: `${limpio(d['nombre'], 'The workspace')}: ${limpio(d['nombres'], 'some item')} did not stop. Open Home to see what is still running.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo' ? 'A scheduled task took too long' : 'A scheduled task failed',
      cuerpo: `${limpio(d['nombre'], 'A task')} (${limpio(d['sitio'], 'a project')}) ${d['motivo'] === 'tiempo' ? 'exceeded its time limit and was stopped' : 'ended with an error'}. Open the project to see its log.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'A scheduled task did not run',
      cuerpo: `${limpio(d['nombre'], 'A task')} (${limpio(d['sitio'], 'a project')}): ${
        {
          aislado: 'the data folder is a test one and tasks were not allowed to run',
          no_confiado: 'the project is not marked as trusted',
          receta_cambio: 'the project recipe changed since you trusted it',
          sin_confirmar: 'its command needs to be confirmed',
          comando_invalido: 'its command is not allowed',
          cron_invalida: 'its schedule is not valid',
          carpeta: 'the project folder does not exist',
        }[String(d['motivo'])] ?? 'the conditions are not met'
      }.`,
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
    'avisos.proceso_sin_codigo': (d) => ({
      titulo: 'A process finished',
      cuerpo: `${limpio(d['nombre'], 'A process')} finished (exit code unknown). It could not be determined whether it went well: check its logs.`,
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
    'avisos.credenciales_sin_proteccion': () => ({
      titulo: 'The saved keys were not protected',
      cuerpo:
        'WolfCore Dev could not make its keys file readable only by your Windows user. Your data is safe, but please check the permissions of the data folder.',
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
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Sharing on the local network stopped',
      cuerpo: `The network changed: stopped sharing ${limpio(d['fuente'], 'a site')}.`,
    }),
    'avisos.https_quitado': (d) => ({
      titulo: 'Sites without HTTPS',
      cuerpo: `${limpio(d['fuente'], 'Some sites')} fell back to HTTP: port ${limpio(d['puerto'], '443')} is used by ${limpio(d['ocupadoPor'], 'another program')}. Close it or change the HTTPS port in Settings and HTTPS will return on the next apply.`,
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
      titulo: `New major version of ${limpio(d['servicio'], 'service')}`,
      cuerpo: `${limpio(d['nueva'], 'A new major version')} is newer than the one you use (${limpio(d['actual'], '?')}), with no published checksum: the download cannot be verified. Review it in Services → Versions; installing it asks for your confirmation.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `New major version of ${limpio(d['servicio'], 'service')}`,
      cuerpo: `${limpio(d['nueva'], 'A new major version')} is newer than the one you use (${limpio(d['actual'], '?')}). It installs side by side, without touching your data.`,
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
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Um workspace não conseguiu ligar tudo',
      cuerpo: `${limpio(d['nombre'], 'O workspace')}: não iniciou ${limpio(d['nombres'], 'algum item')}. Abra Início para ver o que ficou ligado.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Um workspace não conseguiu desligar tudo',
      cuerpo: `${limpio(d['nombre'], 'O workspace')}: não desligou ${limpio(d['nombres'], 'algum item')}. Abra Início para ver o que continua ligado.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Uma tarefa agendada demorou demais'
          : 'Uma tarefa agendada falhou',
      cuerpo: `${limpio(d['nombre'], 'Uma tarefa')} (${limpio(d['sitio'], 'um projeto')}) ${d['motivo'] === 'tiempo' ? 'excedeu o tempo máximo e foi interrompida' : 'terminou com um erro'}. Abra o projeto para ver o registro.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Uma tarefa agendada não foi executada',
      cuerpo: `${limpio(d['nombre'], 'Uma tarefa')} (${limpio(d['sitio'], 'um projeto')}): ${
        {
          aislado: 'a pasta de dados é de teste e não foi permitido executar tarefas',
          no_confiado: 'o projeto não está marcado como confiável',
          receta_cambio: 'a receita do projeto mudou desde que você confiou nele',
          sin_confirmar: 'falta confirmar o comando',
          comando_invalido: 'o comando não é permitido',
          cron_invalida: 'o horário não é válido',
          carpeta: 'a pasta do projeto não existe',
        }[String(d['motivo'])] ?? 'as condições não são cumpridas'
      }.`,
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
    'avisos.proceso_sin_codigo': (d) => ({
      titulo: 'Um processo terminou',
      cuerpo: `${limpio(d['nombre'], 'Um processo')} terminou (código desconhecido). Não foi possível saber se correu bem: confira os registros dele.`,
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
    'avisos.credenciales_sin_proteccion': () => ({
      titulo: 'As chaves guardadas não ficaram protegidas',
      cuerpo:
        'Não foi possível deixar o arquivo de chaves do WolfCore Dev legível apenas para o seu usuário do Windows. Os dados estão a salvo, mas confira as permissões da pasta de dados.',
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
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'O compartilhamento na rede local parou',
      cuerpo: `A rede mudou: parou de compartilhar ${limpio(d['fuente'], 'um site')}.`,
    }),
    'avisos.https_quitado': (d) => ({
      titulo: 'Sites sem HTTPS',
      cuerpo: `${limpio(d['fuente'], 'Alguns sites')} voltou para HTTP: a porta ${limpio(d['puerto'], '443')} está ocupada por ${limpio(d['ocupadoPor'], 'outro programa')}. Feche-o ou mude a porta HTTPS em Configurações e o HTTPS volta ao aplicar.`,
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
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Un workspace n’a pas pu tout allumer',
      cuerpo: `${limpio(d['nombre'], 'Le workspace')} : ${limpio(d['nombres'], 'un élément')} n’a pas démarré. Ouvrez Accueil pour voir ce qui tourne.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Un workspace n’a pas pu tout éteindre',
      cuerpo: `${limpio(d['nombre'], 'Le workspace')} : ${limpio(d['nombres'], 'un élément')} ne s’est pas arrêté. Ouvrez Accueil pour voir ce qui tourne encore.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Une tâche planifiée a pris trop de temps'
          : 'Une tâche planifiée a échoué',
      cuerpo: `${limpio(d['nombre'], 'Une tâche')} (${limpio(d['sitio'], 'un projet')}) ${d['motivo'] === 'tiempo' ? 'a dépassé sa durée maximale et a été arrêtée' : 's’est terminée avec une erreur'}. Ouvrez le projet pour voir son journal.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Une tâche planifiée ne s’est pas exécutée',
      cuerpo: `${limpio(d['nombre'], 'Une tâche')} (${limpio(d['sitio'], 'un projet')}) : ${
        {
          aislado:
            'le dossier de données est un dossier de test et les tâches n’ont pas été autorisées',
          no_confiado: 'le projet n’est pas marqué comme de confiance',
          receta_cambio: 'la recette du projet a changé depuis que vous lui avez fait confiance',
          sin_confirmar: 'sa commande doit être confirmée',
          comando_invalido: 'sa commande n’est pas autorisée',
          cron_invalida: 'son horaire n’est pas valide',
          carpeta: 'le dossier du projet n’existe pas',
        }[String(d['motivo'])] ?? 'les conditions ne sont pas remplies'
      }.`,
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
    'avisos.proceso_sin_codigo': (d) => ({
      titulo: 'Un processus s’est terminé',
      cuerpo: `${limpio(d['nombre'], 'Un processus')} s’est terminé (code inconnu). Impossible de savoir si tout s’est bien passé : consultez ses journaux.`,
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
    'avisos.credenciales_sin_proteccion': () => ({
      titulo: 'Les clés enregistrées ne sont pas protégées',
      cuerpo:
        'WolfCore Dev n’a pas pu rendre son fichier de clés lisible uniquement par votre utilisateur Windows. Vos données sont en sécurité, mais vérifiez les autorisations du dossier de données.',
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
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Le partage sur le réseau local s’est arrêté',
      cuerpo: `Le réseau a changé : le partage de ${limpio(d['fuente'], 'un site')} a été arrêté.`,
    }),
    'avisos.https_quitado': (d) => ({
      titulo: 'Sites sans HTTPS',
      cuerpo: `${limpio(d['fuente'], 'Certains sites')} est repassé en HTTP : le port ${limpio(d['puerto'], '443')} est utilisé par ${limpio(d['ocupadoPor'], 'un autre programme')}. Fermez-le ou changez le port HTTPS dans les Réglages et le HTTPS reviendra à la prochaine application.`,
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
      titulo: `Nouvelle version majeure de ${limpio(d['servicio'], 'un service')}`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle version majeure')} est plus récente que celle que vous utilisez (${limpio(d['actual'], '?')}), sans empreinte publiée : le téléchargement ne peut pas être vérifié. Consultez-la dans Services → Versions ; l’installer demande votre confirmation.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nouvelle version majeure de ${limpio(d['servicio'], 'un service')}`,
      cuerpo: `${limpio(d['nueva'], 'Une nouvelle version majeure')} est plus récente que celle que vous utilisez (${limpio(d['actual'], '?')}). Elle s’installe à côté, sans toucher à vos données.`,
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

const DE: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Ein Dienst wurde mit einem Fehler beendet',
      cuerpo: `${limpio(d['nombre'], 'Ein Dienst')} funktioniert nicht mehr. Öffnen Sie WolfCore Dev für Details.`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Alle starten konnte nicht alles starten',
      cuerpo: `Nicht gestartet: ${limpio(d['nombres'], 'ein Dienst')}. Öffnen Sie Dienste für Details.`,
    }),
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Ein Workspace konnte nicht alles starten',
      cuerpo: `${limpio(d['nombre'], 'Der Workspace')}: ${limpio(d['nombres'], 'ein Element')} startete nicht. Öffnen Sie Start, um den Status zu prüfen.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Ein Workspace konnte nicht alles stoppen',
      cuerpo: `${limpio(d['nombre'], 'Der Workspace')}: ${limpio(d['nombres'], 'ein Element')} wurde nicht gestoppt. Öffnen Sie Start, um aktive Elemente zu prüfen.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Eine geplante Aufgabe dauerte zu lange'
          : 'Eine geplante Aufgabe ist fehlgeschlagen',
      cuerpo: `${limpio(d['nombre'], 'Eine Aufgabe')} (${limpio(d['sitio'], 'ein Projekt')}) ${d['motivo'] === 'tiempo' ? 'überschritt das Zeitlimit und wurde gestoppt' : 'endete mit einem Fehler'}. Öffnen Sie das Projekt für das Protokoll.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Eine geplante Aufgabe wurde nicht ausgeführt',
      cuerpo: `${limpio(d['nombre'], 'Eine Aufgabe')} (${limpio(d['sitio'], 'ein Projekt')}): ${
        {
          aislado: 'der Datenordner ist ein Testordner und Aufgaben wurden nicht erlaubt',
          no_confiado: 'das Projekt ist nicht als vertrauenswürdig markiert',
          receta_cambio: 'das Projektrezept hat sich seit Ihrem Vertrauen geändert',
          sin_confirmar: 'der Befehl muss noch bestätigt werden',
          comando_invalido: 'der Befehl ist nicht zulässig',
          cron_invalida: 'der Zeitplan ist ungültig',
          carpeta: 'der Projektordner existiert nicht',
        }[String(d['motivo'])] ?? 'die Bedingungen sind nicht erfüllt'
      }.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Port belegt',
      cuerpo: `Port ${limpio(d['puerto'], '?')} wird von ${limpio(d['nombre'], 'einem anderen Programm')} verwendet: Der Dienst konnte nicht starten.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Ein Projektprozess endete mit einem Fehler',
      cuerpo: `${limpio(d['nombre'], 'Ein Prozess')} wurde beendet. Prüfen Sie seine Protokolle.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Ein Prozess wurde beendet',
      cuerpo: `${limpio(d['nombre'], 'Ein Prozess')} endete ohne Fehler.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Ein Prozess ist fehlgeschlagen',
      cuerpo: `${limpio(d['nombre'], 'Ein Prozess')} endete mit einem Fehler${d['codigoSalida'] !== undefined ? ` (Code ${limpio(d['codigoSalida'], '?')})` : ''}. Prüfen Sie seine Protokolle.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Ein Rezept wurde abgeschlossen',
      cuerpo: `Das Rezept für ${limpio(d['sitio'], 'ein Projekt')} endete ohne Fehler.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Ein Rezept ist fehlgeschlagen',
      cuerpo: `Das Rezept für ${limpio(d['sitio'], 'ein Projekt')} stoppte mit einem Fehler. Öffnen Sie das Projekt, um den Schritt zu sehen.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Ein Tunnel wurde unterbrochen',
      cuerpo: `Der Tunnel für ${limpio(d['fuente'], 'ein Projekt')} funktioniert nicht mehr.`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Ein Container wurde gestoppt',
      cuerpo: `${limpio(d['nombre'], 'Ein Container')} (${limpio(d['motor'], 'Docker')}) wurde unerwartet gestoppt${d['codigoSalida'] !== undefined ? ` (Code ${limpio(d['codigoSalida'], '?')})` : ''}.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'Die Zertifizierungsstelle läuft bald ab',
      cuerpo: `Sie läuft in ${limpio(d['dias'], '?')} Tagen ab. Erzeugen Sie sie neu und vertrauen Sie ihr erneut.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Ein Zertifikat läuft bald ab',
      cuerpo: `Das Zertifikat für ${limpio(d['fuente'], 'eine Website')} läuft in ${limpio(d['dias'], '?')} Tagen ab.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Ein Zertifikat ist abgelaufen',
      cuerpo: `Das Zertifikat für ${limpio(d['fuente'], 'eine Website')} ist nicht mehr gültig. Erzeugen Sie es neu.`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'Eigenes PHP einer Website startete nicht',
      cuerpo: `Das PHP von ${limpio(d['fuente'], 'einer Website')} startete nicht (möglicherweise ist der Port belegt). Prüfen Sie den PHP-Bereich der Karte.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Keine Ports für eigenes Website-PHP',
      cuerpo: `${limpio(d['fuente'], 'Eine Website')} nutzt das gemeinsame PHP ihrer Version ohne eigene Einstellungen: Keine freien Ports für eigenes PHP.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'PHP-Einstellungen verworfen',
      cuerpo: `Einige PHP-Einstellungen von ${limpio(d['fuente'], 'einer Website')} sind ungültig und wurden nicht angewendet: ${limpio(d['claves'], 'prüfen Sie den PHP-Bereich')}.`,
    }),
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Freigabe im lokalen Netzwerk beendet',
      cuerpo: `Das Netzwerk hat sich geändert: Die Freigabe von ${limpio(d['fuente'], 'einer Website')} wurde beendet.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Nginx-Regeln verworfen',
      cuerpo: `Die eigenen Regeln von ${limpio(d['fuente'], 'einer Website')} bestehen die Prüfung nicht mehr (Ordner, Domains oder Ports geändert) und wurden aus dem vhost ausgeschlossen. Prüfen Sie sie im Nginx-Bereich.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Manueller vhost nicht verwendet',
      cuerpo: `Der manuelle vhost von ${limpio(d['fuente'], 'einer Website')} besteht die Prüfung nicht mehr (Ordner, Domains oder Ports geändert): Der generierte vhost wird verwendet. Prüfen Sie ihn im Nginx-Bereich.`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup war bereits anderswo installiert',
      cuerpo:
        'Das Rust von WolfCore Dev wurde im eigenen Ordner installiert. Windows hatte bereits einen rustup-Deinstallationseintrag für eine andere Installation: Er blieb unverändert.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Neue Version von ${limpio(d['servicio'], 'einem Dienst')} verfügbar`,
      cuerpo: `${limpio(d['nueva'], 'Eine neue Version')} wurde veröffentlicht (installiert: ${limpio(d['actual'], 'andere')}). Öffnen Sie Dienste → Versionen zum Aktualisieren; nichts wird automatisch installiert.`,
      accion: 'Aktualisieren',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Neue Version von ${limpio(d['servicio'], 'einem Dienst')} verfügbar`,
      cuerpo: `${limpio(d['nueva'], 'Eine neue Version')} wurde veröffentlicht (installiert: ${limpio(d['actual'], 'andere')}), ohne veröffentlichte Prüfsumme: Der Download kann nicht geprüft werden. Prüfen Sie sie unter Dienste → Versionen; die Installation verlangt Ihre Bestätigung.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Neue Hauptversion von ${limpio(d['servicio'], 'einem Dienst')}`,
      cuerpo: `${limpio(d['nueva'], 'Eine neue Hauptversion')} ist neuer als Ihre aktuelle (${limpio(d['actual'], '?')}), ohne veröffentlichte Prüfsumme: Der Download kann nicht geprüft werden. Prüfen Sie sie unter Dienste → Versionen; die Installation verlangt Ihre Bestätigung.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Neue Hauptversion von ${limpio(d['servicio'], 'einem Dienst')}`,
      cuerpo: `${limpio(d['nueva'], 'Eine neue Hauptversion')} ist neuer als Ihre aktuelle (${limpio(d['actual'], '?')}). Sie wird parallel installiert, ohne Ihre Daten zu berühren.`,
      accion: 'Aktualisieren',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'Doctor hat Fehler in der Umgebung gefunden',
      cuerpo: `${limpio(d['errores'], 'Mehrere')} Probleme können die Umgebung beeinträchtigen. Öffnen Sie Doctor, um sie zu beheben.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Ein Dienst wurde gestoppt',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'puerto-ocupado': {
      titulo: 'Port belegt',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'certificado-por-vencer': {
      titulo: 'Ein Zertifikat läuft bald ab',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'tunel-caido': {
      titulo: 'Ein Tunnel wurde unterbrochen',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'proceso-error': {
      titulo: 'Ein Prozess endete mit einem Fehler',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'proceso-terminado': {
      titulo: 'Ein Prozess wurde beendet',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'receta-terminada': {
      titulo: 'Ein Rezept wurde abgeschlossen',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    doctor: {
      titulo: 'Doctor hat Probleme gefunden',
      cuerpo: 'Öffnen Sie WolfCore Dev zur Prüfung.',
    },
    'contenedor-detenido': {
      titulo: 'Ein Container wurde gestoppt',
      cuerpo: 'Öffnen Sie WolfCore Dev für Details.',
    },
    'version-nueva': {
      titulo: 'Eine neue Version ist verfügbar',
      cuerpo: 'Öffnen Sie WolfCore Dev zum Aktualisieren.',
    },
  },
};

const IT: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Un servizio si è fermato con un errore',
      cuerpo: `${limpio(d['nombre'], 'Un servizio')} ha smesso di funzionare. Apra WolfCore Dev per i dettagli.`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Avvia tutto non ha potuto avviare tutto',
      cuerpo: `Non avviato: ${limpio(d['nombres'], 'un servizio')}. Apra Servizi per i dettagli.`,
    }),
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Un workspace non ha potuto avviare tutto',
      cuerpo: `${limpio(d['nombre'], 'Il workspace')}: non avviato ${limpio(d['nombres'], 'un elemento')}. Apra Inizio per vedere cosa è attivo.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Un workspace non ha potuto fermare tutto',
      cuerpo: `${limpio(d['nombre'], 'Il workspace')}: non fermato ${limpio(d['nombres'], 'un elemento')}. Apra Inizio per vedere cosa è ancora attivo.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Un’attività pianificata ha impiegato troppo tempo'
          : 'Un’attività pianificata è fallita',
      cuerpo: `${limpio(d['nombre'], 'Un’attività')} (${limpio(d['sitio'], 'un progetto')}) ${d['motivo'] === 'tiempo' ? 'ha superato il tempo massimo ed è stata fermata' : 'è terminata con un errore'}. Apra il progetto per vedere il registro.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Un’attività pianificata non è stata eseguita',
      cuerpo: `${limpio(d['nombre'], 'Un’attività')} (${limpio(d['sitio'], 'un progetto')}): ${
        {
          aislado: 'la cartella dati è di test e non è stato consentito eseguire attività',
          no_confiado: 'il progetto non è contrassegnato come attendibile',
          receta_cambio: 'la ricetta del progetto è cambiata da quando si è fidato',
          sin_confirmar: 'manca la conferma del comando',
          comando_invalido: 'il comando non è consentito',
          cron_invalida: 'la pianificazione non è valida',
          carpeta: 'la cartella del progetto non esiste',
        }[String(d['motivo'])] ?? 'le condizioni non sono soddisfatte'
      }.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Porta occupata',
      cuerpo: `La porta ${limpio(d['puerto'], '?')} è usata da ${limpio(d['nombre'], 'un altro programma')}: impossibile avviare il servizio.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Un processo di progetto è terminato con un errore',
      cuerpo: `${limpio(d['nombre'], 'Un processo')} ha smesso di funzionare. Controlli i suoi registri.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Un processo è terminato',
      cuerpo: `${limpio(d['nombre'], 'Un processo')} è terminato senza errori.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Un processo è fallito',
      cuerpo: `${limpio(d['nombre'], 'Un processo')} è terminato con un errore${d['codigoSalida'] !== undefined ? ` (codice ${limpio(d['codigoSalida'], '?')})` : ''}. Controlli i suoi registri.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Una ricetta è terminata',
      cuerpo: `La ricetta di ${limpio(d['sitio'], 'un progetto')} è terminata senza errori.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Una ricetta è fallita',
      cuerpo: `La ricetta di ${limpio(d['sitio'], 'un progetto')} si è fermata con un errore. Apra il progetto per vedere il passaggio.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Un tunnel è caduto',
      cuerpo: `Il tunnel di ${limpio(d['fuente'], 'un progetto')} ha smesso di funzionare.`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Un container si è fermato',
      cuerpo: `${limpio(d['nombre'], 'Un container')} (${limpio(d['motor'], 'Docker')}) si è fermato inaspettatamente${d['codigoSalida'] !== undefined ? ` (codice ${limpio(d['codigoSalida'], '?')})` : ''}.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'L’autorità di certificazione scade presto',
      cuerpo: `Scade tra ${limpio(d['dias'], '?')} giorni. La rigeneri e le ridia fiducia.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Un certificato scade presto',
      cuerpo: `Il certificato di ${limpio(d['fuente'], 'un sito')} scade tra ${limpio(d['dias'], '?')} giorni.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Un certificato è scaduto',
      cuerpo: `Il certificato di ${limpio(d['fuente'], 'un sito')} non è più valido. Lo rigeneri.`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'Il PHP dedicato di un sito non si è avviato',
      cuerpo: `Il PHP di ${limpio(d['fuente'], 'un sito')} non si è avviato (la sua porta potrebbe essere occupata). Controlli la sezione PHP della scheda.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Nessuna porta per il PHP di un sito',
      cuerpo: `${limpio(d['fuente'], 'Un sito')} usa il PHP condiviso della propria versione senza le sue impostazioni: non ci sono porte libere per un PHP dedicato.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'Impostazioni PHP scartate',
      cuerpo: `Alcune impostazioni PHP di ${limpio(d['fuente'], 'un sito')} non sono valide e non sono state applicate: ${limpio(d['claves'], 'controlli la sezione PHP')}.`,
    }),
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Condivisione in rete locale interrotta',
      cuerpo: `La rete è cambiata: interrotta la condivisione di ${limpio(d['fuente'], 'un sito')}.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Regole Nginx scartate',
      cuerpo: `Le regole personalizzate di ${limpio(d['fuente'], 'un sito')} non superano più la verifica (cartella, domini o porte cambiati) e sono state escluse dal vhost. Le riveda nella sezione Nginx.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Vhost manuale non usato',
      cuerpo: `Il vhost scritto a mano di ${limpio(d['fuente'], 'un sito')} non supera più la verifica (cartella, domini o porte cambiati): viene usato quello generato. Lo riveda nella sezione Nginx.`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup era già installato altrove',
      cuerpo:
        'Il Rust di WolfCore Dev è stato installato nella propria cartella. Windows aveva già una voce di disinstallazione di rustup verso un’altra installazione: non è stata toccata.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Nuova versione di ${limpio(d['servicio'], 'un servizio')} disponibile`,
      cuerpo: `${limpio(d['nueva'], 'Una nuova versione')} è disponibile (ha ${limpio(d['actual'], 'un’altra')}). Apra Servizi → Versioni per aggiornare; nulla viene installato da solo.`,
      accion: 'Aggiorna',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Nuova versione di ${limpio(d['servicio'], 'un servizio')} disponibile`,
      cuerpo: `${limpio(d['nueva'], 'Una nuova versione')} è disponibile (ha ${limpio(d['actual'], 'un’altra')}), senza impronta pubblicata: impossibile verificare il download. La controlli in Servizi → Versioni; l’installazione chiede conferma.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Nuova versione principale di ${limpio(d['servicio'], 'un servizio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una nuova versione principale')} è più recente di quella in uso (${limpio(d['actual'], '?')}), senza impronta pubblicata: impossibile verificare il download. La controlli in Servizi → Versioni; l’installazione chiede conferma.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Nuova versione principale di ${limpio(d['servicio'], 'un servizio')}`,
      cuerpo: `${limpio(d['nueva'], 'Una nuova versione principale')} è più recente di quella in uso (${limpio(d['actual'], '?')}). Si installa separatamente, senza toccare i suoi dati.`,
      accion: 'Aggiorna',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'Doctor ha rilevato errori nell’ambiente',
      cuerpo: `Ci sono ${limpio(d['errores'], 'diversi')} problemi che possono impedire il funzionamento dell’ambiente. Apra Doctor per vedere come risolverli.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Un servizio si è fermato',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'puerto-ocupado': {
      titulo: 'Porta occupata',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'certificado-por-vencer': {
      titulo: 'Un certificato scade presto',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'tunel-caido': {
      titulo: 'Un tunnel è caduto',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'proceso-error': {
      titulo: 'Un processo è terminato con un errore',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'proceso-terminado': {
      titulo: 'Un processo è terminato',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'receta-terminada': {
      titulo: 'Una ricetta è terminata',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    doctor: {
      titulo: 'Doctor ha rilevato problemi',
      cuerpo: 'Apra WolfCore Dev per esaminarli.',
    },
    'contenedor-detenido': {
      titulo: 'Un container si è fermato',
      cuerpo: 'Apra WolfCore Dev per i dettagli.',
    },
    'version-nueva': {
      titulo: 'Nuova versione disponibile',
      cuerpo: 'Apra WolfCore Dev per aggiornare.',
    },
  },
};

const RU: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: 'Служба остановилась с ошибкой',
      cuerpo: `${limpio(d['nombre'], 'Служба')} перестала работать. Откройте WolfCore Dev для подробностей.`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: 'Команда «Запустить всё» не смогла запустить всё',
      cuerpo: `Не запустилось: ${limpio(d['nombres'], 'некоторые службы')}. Откройте Службы для подробностей.`,
    }),
    'avisos.workspace_fallos': (d) => ({
      titulo: 'Workspace не смог запустить всё',
      cuerpo: `${limpio(d['nombre'], 'Workspace')}: не запустилось ${limpio(d['nombres'], 'часть элементов')}. Откройте Главную, чтобы проверить состояние.`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: 'Workspace не смог остановить всё',
      cuerpo: `${limpio(d['nombre'], 'Workspace')}: не остановилось ${limpio(d['nombres'], 'часть элементов')}. Откройте Главную, чтобы увидеть работающие службы.`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo:
        d['motivo'] === 'tiempo'
          ? 'Запланированная задача выполнялась слишком долго'
          : 'Запланированная задача завершилась ошибкой',
      cuerpo: `${limpio(d['nombre'], 'Задача')} (${limpio(d['sitio'], 'проект')}) ${d['motivo'] === 'tiempo' ? 'превысила лимит времени и была остановлена' : 'завершилась с ошибкой'}. Откройте проект для просмотра журнала.`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: 'Запланированная задача не выполнена',
      cuerpo: `${limpio(d['nombre'], 'Задача')} (${limpio(d['sitio'], 'проект')}): ${
        {
          aislado: 'это тестовая папка данных, и запуск задач не разрешён',
          no_confiado: 'проект не отмечен как доверенный',
          receta_cambio: 'рецепт проекта изменился после подтверждения доверия',
          sin_confirmar: 'необходимо подтвердить команду',
          comando_invalido: 'команда не разрешена',
          cron_invalida: 'расписание недействительно',
          carpeta: 'папка проекта не существует',
        }[String(d['motivo'])] ?? 'условия не выполнены'
      }.`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: 'Порт занят',
      cuerpo: `Порт ${limpio(d['puerto'], '?')} используется ${limpio(d['nombre'], 'другой программой')}: не удалось запустить службу.`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: 'Процесс проекта завершился с ошибкой',
      cuerpo: `${limpio(d['nombre'], 'Процесс')} перестал работать. Проверьте его журналы.`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: 'Процесс завершён',
      cuerpo: `${limpio(d['nombre'], 'Процесс')} завершился без ошибок.`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: 'Сбой процесса',
      cuerpo: `${limpio(d['nombre'], 'Процесс')} завершился с ошибкой${d['codigoSalida'] !== undefined ? ` (код ${limpio(d['codigoSalida'], '?')})` : ''}. Проверьте его журналы.`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: 'Рецепт завершён',
      cuerpo: `Рецепт для ${limpio(d['sitio'], 'проекта')} завершился без ошибок.`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: 'Сбой рецепта',
      cuerpo: `Рецепт для ${limpio(d['sitio'], 'проекта')} остановился с ошибкой. Откройте проект, чтобы увидеть шаг.`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: 'Туннель оборвался',
      cuerpo: `Туннель для ${limpio(d['fuente'], 'проекта')} перестал работать.`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: 'Контейнер остановлен',
      cuerpo: `${limpio(d['nombre'], 'Контейнер')} (${limpio(d['motor'], 'Docker')}) неожиданно остановился${d['codigoSalida'] !== undefined ? ` (код ${limpio(d['codigoSalida'], '?')})` : ''}.`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: 'Срок действия центра сертификации скоро истечёт',
      cuerpo: `Истекает через ${limpio(d['dias'], '?')} дн. Пересоздайте его и снова подтвердите доверие.`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: 'Срок действия сертификата скоро истечёт',
      cuerpo: `Сертификат для ${limpio(d['fuente'], 'сайта')} истекает через ${limpio(d['dias'], '?')} дн.`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: 'Срок действия сертификата истёк',
      cuerpo: `Сертификат для ${limpio(d['fuente'], 'сайта')} больше недействителен. Пересоздайте его.`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: 'Собственный PHP сайта не запустился',
      cuerpo: `PHP сайта ${limpio(d['fuente'], 'сайта')} не запустился (возможно, порт занят). Проверьте раздел PHP на его карточке.`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: 'Нет портов для PHP сайта',
      cuerpo: `${limpio(d['fuente'], 'Сайт')} использует общий PHP своей версии без собственных настроек: нет свободных портов для отдельного PHP.`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'Настройки PHP отклонены',
      cuerpo: `Некоторые настройки PHP сайта ${limpio(d['fuente'], 'сайта')} недопустимы и не применены: ${limpio(d['claves'], 'проверьте раздел PHP')}.`,
    }),
    'avisos.lan_red_cambio': (d) => ({
      titulo: 'Доступ в локальной сети прекращён',
      cuerpo: `Сеть изменилась: доступ к ${limpio(d['fuente'], 'сайту')} закрыт.`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Правила Nginx отклонены',
      cuerpo: `Собственные правила ${limpio(d['fuente'], 'сайта')} больше не проходят проверку (изменились папка, домены или порты) и исключены из vhost. Проверьте их в разделе Nginx.`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: 'Ручной vhost не используется',
      cuerpo: `Написанный вручную vhost для ${limpio(d['fuente'], 'сайта')} больше не проходит проверку (изменились папка, домены или порты): используется сгенерированный. Проверьте его в разделе Nginx.`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup уже установлен в другом месте',
      cuerpo:
        'Rust из WolfCore Dev установлен в свою папку. В Windows уже была запись удаления rustup для другой установки: она не изменена.',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `Доступна новая версия ${limpio(d['servicio'], 'службы')}`,
      cuerpo: `Опубликована версия ${limpio(d['nueva'], 'новая версия')} (установлена ${limpio(d['actual'], 'другая')}). Откройте Службы → Версии для обновления; автоматически ничего не устанавливается.`,
      accion: 'Обновить',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `Доступна новая версия ${limpio(d['servicio'], 'службы')}`,
      cuerpo: `Опубликована версия ${limpio(d['nueva'], 'новая версия')} (установлена ${limpio(d['actual'], 'другая')}), без опубликованного хэша: загрузку нельзя проверить. Проверьте в Службы → Версии; установка запросит подтверждение.`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `Новая основная версия ${limpio(d['servicio'], 'службы')}`,
      cuerpo: `${limpio(d['nueva'], 'Новая версия')} новее вашей текущей (${limpio(d['actual'], '?')}), без опубликованного хэша: загрузку нельзя проверить. Проверьте в Службы → Версии; установка запросит подтверждение.`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `Новая основная версия ${limpio(d['servicio'], 'службы')}`,
      cuerpo: `${limpio(d['nueva'], 'Новая версия')} новее вашей текущей (${limpio(d['actual'], '?')}). Устанавливается отдельно, не затрагивая ваши данные.`,
      accion: 'Обновить',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'Doctor обнаружил ошибки в среде',
      cuerpo: `Найдено ${limpio(d['errores'], 'несколько')} проблем, мешающих работе среды. Откройте Doctor, чтобы узнать, как их исправить.`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: 'Служба остановлена',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'puerto-ocupado': {
      titulo: 'Порт занят',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'certificado-por-vencer': {
      titulo: 'Сертификат скоро истечёт',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'tunel-caido': {
      titulo: 'Туннель оборвался',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'proceso-error': {
      titulo: 'Процесс завершился с ошибкой',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'proceso-terminado': {
      titulo: 'Процесс завершён',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'receta-terminada': {
      titulo: 'Рецепт завершён',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    doctor: {
      titulo: 'Doctor обнаружил проблемы',
      cuerpo: 'Откройте WolfCore Dev для проверки.',
    },
    'contenedor-detenido': {
      titulo: 'Контейнер остановлен',
      cuerpo: 'Откройте WolfCore Dev для подробностей.',
    },
    'version-nueva': {
      titulo: 'Доступна новая версия',
      cuerpo: 'Откройте WolfCore Dev для обновления.',
    },
  },
};

const ZH: Diccionario = {
  porCodigo: {
    'avisos.servicio_caido': (d) => ({
      titulo: '某项服务因错误停止',
      cuerpo: `${limpio(d['nombre'], '某项服务')} 已停止运行。请打开 WolfCore Dev 查看详情。`,
    }),
    'avisos.iniciar_todo_fallos': (d) => ({
      titulo: '全部启动未能启动所有服务',
      cuerpo: `未能启动：${limpio(d['nombres'], '部分服务')}。请打开“服务”查看详情。`,
    }),
    'avisos.workspace_fallos': (d) => ({
      titulo: '工作区未能启动全部项目',
      cuerpo: `${limpio(d['nombre'], '工作区')}：未能启动 ${limpio(d['nombres'], '部分项目')}。请打开“首页”查看运行状态。`,
    }),
    'avisos.workspace_fallos_detener': (d) => ({
      titulo: '工作区未能停止全部项目',
      cuerpo: `${limpio(d['nombre'], '工作区')}：未能停止 ${limpio(d['nombres'], '部分项目')}。请打开“首页”查看仍在运行的项目。`,
    }),
    'avisos.tarea_fallo': (d) => ({
      titulo: d['motivo'] === 'tiempo' ? '定时任务运行超时' : '定时任务执行失败',
      cuerpo: `${limpio(d['nombre'], '某项任务')}（${limpio(d['sitio'], '某个项目')}）${d['motivo'] === 'tiempo' ? '超过最长运行时间并已停止' : '以错误结束'}。请打开项目查看日志。`,
    }),
    'avisos.tarea_bloqueada': (d) => ({
      titulo: '定时任务未执行',
      cuerpo: `${limpio(d['nombre'], '某项任务')}（${limpio(d['sitio'], '某个项目')}）：${
        {
          aislado: '当前为测试数据文件夹，未允许执行任务',
          no_confiado: '项目未标记为受信任',
          receta_cambio: '自您信任以来项目安装方案已变更',
          sin_confirmar: '尚未确认其命令',
          comando_invalido: '其命令不被允许',
          cron_invalida: '其计划时间无效',
          carpeta: '项目文件夹不存在',
        }[String(d['motivo'])] ?? '不满足执行条件'
      }。`,
    }),
    'avisos.puerto_ocupado': (d) => ({
      titulo: '端口被占用',
      cuerpo: `端口 ${limpio(d['puerto'], '?')} 正被 ${limpio(d['nombre'], '其他程序')} 占用：无法启动服务。`,
    }),
    'avisos.proceso_error': (d) => ({
      titulo: '项目进程因错误终止',
      cuerpo: `${limpio(d['nombre'], '某个进程')} 已停止运行。请检查其日志。`,
    }),
    'avisos.proceso_terminado': (d) => ({
      titulo: '进程已结束',
      cuerpo: `${limpio(d['nombre'], '某个进程')} 已无错误结束。`,
    }),
    'avisos.proceso_fallo': (d) => ({
      titulo: '进程失败',
      cuerpo: `${limpio(d['nombre'], '某个进程')} 以错误结束${d['codigoSalida'] !== undefined ? `（代码 ${limpio(d['codigoSalida'], '?')}）` : ''}。请检查其日志。`,
    }),
    'avisos.receta_terminada': (d) => ({
      titulo: '安装方案已完成',
      cuerpo: `${limpio(d['sitio'], '某个项目')} 的安装方案已无错误完成。`,
    }),
    'avisos.receta_fallo': (d) => ({
      titulo: '安装方案失败',
      cuerpo: `${limpio(d['sitio'], '某个项目')} 的安装方案因错误停止。请打开项目查看具体步骤。`,
    }),
    'avisos.tunel_caido': (d) => ({
      titulo: '隧道已断开',
      cuerpo: `${limpio(d['fuente'], '某个项目')} 的隧道已停止工作。`,
    }),
    'avisos.contenedor_detenido': (d) => ({
      titulo: '容器已停止',
      cuerpo: `${limpio(d['nombre'], '某个容器')}（${limpio(d['motor'], 'Docker')}）意外停止${d['codigoSalida'] !== undefined ? `（代码 ${limpio(d['codigoSalida'], '?')}）` : ''}。`,
    }),
    'avisos.ca_por_vencer': (d) => ({
      titulo: '证书颁发机构即将过期',
      cuerpo: `将在 ${limpio(d['dias'], '?')} 天后过期。请重新生成并再次信任。`,
    }),
    'avisos.certificado_por_vencer': (d) => ({
      titulo: '证书即将过期',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的证书将在 ${limpio(d['dias'], '?')} 天后过期。`,
    }),
    'avisos.certificado_vencido': (d) => ({
      titulo: '证书已过期',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的证书已失效。请重新生成。`,
    }),
    'avisos.php_sitio_fallo': (d) => ({
      titulo: '站点专用 PHP 未能启动',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的 PHP 未能启动（可能端口被占用）。请检查站点卡片的 PHP 区域。`,
    }),
    'avisos.php_sitio_sin_puertos': (d) => ({
      titulo: '站点 PHP 无可用端口',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 现使用该版本的共享 PHP（不含自定义设置）：没有空闲端口供专用 PHP 使用。`,
    }),
    'avisos.php_sitio_descartados': (d) => ({
      titulo: 'PHP 设置已忽略',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的部分 PHP 设置无效且未应用：${limpio(d['claves'], '请检查 PHP 区域')}。`,
    }),
    'avisos.lan_red_cambio': (d) => ({
      titulo: '已停止局域网共享',
      cuerpo: `网络发生变化：已停止共享 ${limpio(d['fuente'], '某个站点')}。`,
    }),
    'avisos.vhost_reglas_descartadas': (d) => ({
      titulo: 'Nginx 规则已忽略',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的自定义规则未通过校验（目录、域名或端口已变），已从 vhost 中排除。请在 Nginx 区域检查。`,
    }),
    'avisos.vhost_manual_descartado': (d) => ({
      titulo: '手写 vhost 未生效',
      cuerpo: `${limpio(d['fuente'], '某个站点')} 的手写 vhost 未通过校验（目录、域名或端口已变）：已改用自动生成配置。请在 Nginx 区域检查。`,
    }),
    'avisos.rustup_entrada_ajena': () => ({
      titulo: 'Rustup 已安装于其他位置',
      cuerpo:
        'WolfCore Dev 的 Rust 已安装至自有文件夹。Windows 已存在指向另一安装的 rustup 卸载项：未做修改。',
    }),
    'avisos.version_nueva': (d) => ({
      titulo: `${limpio(d['servicio'], '某项服务')} 有新版本可用`,
      cuerpo: `${limpio(d['nueva'], '新版本')} 已发布（当前为 ${limpio(d['actual'], '其他版本')}）。请前往“服务 → 版本”更新；不会自动安装。`,
      accion: '更新',
    }),
    'avisos.version_nueva_sin_huella': (d) => ({
      titulo: `${limpio(d['servicio'], '某项服务')} 有新版本可用`,
      cuerpo: `${limpio(d['nueva'], '新版本')} 已发布（当前为 ${limpio(d['actual'], '其他版本')}），无公布校验和：无法验证下载。请在“服务 → 版本”查看；安装时需您确认。`,
    }),
    'avisos.rama_nueva_sin_huella': (d) => ({
      titulo: `${limpio(d['servicio'], '某项服务')} 有新的主版本`,
      cuerpo: `${limpio(d['nueva'], '新主版本')} 比您当前使用的版本（${limpio(d['actual'], '?')}）更新，无公布校验和：无法验证下载。请在“服务 → 版本”查看；安装时需您确认。`,
    }),
    'avisos.rama_nueva': (d) => ({
      titulo: `${limpio(d['servicio'], '某项服务')} 有新的主版本`,
      cuerpo: `${limpio(d['nueva'], '新主版本')} 比您当前使用的版本（${limpio(d['actual'], '?')}）更新。将并行安装，不影响您的数据。`,
      accion: '更新',
    }),
    'doctor.hallazgos': (d) => ({
      titulo: 'Doctor 在环境中发现了错误',
      cuerpo: `共有 ${limpio(d['errores'], '多项')} 问题可能影响环境运行。请打开 Doctor 查看修复方式。`,
    }),
  },
  porTipo: {
    'servicio-caido': {
      titulo: '某项服务已停止',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'puerto-ocupado': {
      titulo: '端口被占用',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'certificado-por-vencer': {
      titulo: '证书即将过期',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'tunel-caido': {
      titulo: '隧道已断开',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'proceso-error': {
      titulo: '进程因错误结束',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'proceso-terminado': {
      titulo: '进程已结束',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'receta-terminada': {
      titulo: '安装方案已完成',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    doctor: {
      titulo: 'Doctor 发现了问题',
      cuerpo: '请打开 WolfCore Dev 进行检查。',
    },
    'contenedor-detenido': {
      titulo: '容器已停止',
      cuerpo: '请打开 WolfCore Dev 查看详情。',
    },
    'version-nueva': {
      titulo: '有新版本可用',
      cuerpo: '请打开 WolfCore Dev 进行更新。',
    },
  },
};

const DICCIONARIOS = { es: ES, en: EN, pt: PT, fr: FR, de: DE, it: IT, ru: RU, zh: ZH } satisfies Record<IdiomaUi, Diccionario>;

export const CODIGOS_AVISO = Object.keys(ES.porCodigo);

/** Códigos con texto propio en cada idioma (una prueba exige que sean los mismos). */
export const CODIGOS_AVISO_POR_IDIOMA: Record<IdiomaUi, string[]> = {
  es: Object.keys(ES.porCodigo),
  en: Object.keys(EN.porCodigo),
  pt: Object.keys(PT.porCodigo),
  fr: Object.keys(FR.porCodigo),
  de: Object.keys(DE.porCodigo),
  it: Object.keys(IT.porCodigo),
  ru: Object.keys(RU.porCodigo),
  zh: Object.keys(ZH.porCodigo),
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
