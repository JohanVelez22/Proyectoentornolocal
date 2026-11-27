/** Todos los textos visibles de la interfaz. Nada en español va escrito directo en los componentes. */

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

export const es = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP y Nginx sin complicaciones',
    version: 'Versión',
  },
  nav: {
    inicio: 'Inicio',
    proyectos: 'Proyectos',
    agentes: 'Agentes',
    servicios: 'Servicios',
    basesDeDatos: 'Bases de datos',
    correo: 'Correo',
    php: 'PHP',
    ia: 'IA',
    tuneles: 'Túneles',
    contenedores: 'Contenedores',
    herramientas: 'Herramientas',
    doctor: 'Doctor',
    depuracion: 'Depuración',
    registros: 'Registros',
    ajustes: 'Ajustes',
    contraer: 'Contraer menú',
    expandir: 'Expandir menú',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'servicio encendido', 'servicios encendidos'),
    tuneles: (n: number) => plural(n, 'túnel activo', 'túneles activos'),
    cargando: 'Conectando con el núcleo…',
    conErrores: 'con errores',
    sinConexion: 'Sin conexión con el núcleo',
  },
  estado: {
    encendido: 'Encendido',
    apagado: 'Apagado',
    iniciando: 'Iniciando…',
    error: 'Error',
    externo: 'Externo',
    activo: 'Activo',
    aviso: 'Atención',
  },
  acciones: {
    encender: 'Encender',
    apagar: 'Apagar',
    iniciarTodo: 'Iniciar todo',
    detenerTodo: 'Detener todo',
    abrir: 'Abrir',
    copiar: 'Copiar',
    copiado: 'Copiado al portapapeles',
    copiarCompleto: 'Copiar el texto completo',
    guardar: 'Guardar',
    cerrar: 'Cerrar',
    abrirCarpeta: 'Abrir carpeta',
    instalar: 'Instalar',
    reintentar: 'Reintentar',
    cancelar: 'Cancelar',
    borrar: 'Borrar',
    editar: 'Editar',
    duplicar: 'Duplicar',
    renovar: 'Renovar',
    masAcciones: 'Más acciones',
    actualizar: 'Actualizar',
    quitar: 'Quitar',
    reinstalar: 'Reinstalar',
  },
  errores: {
    titulo: 'No se pudo completar la acción',
    arranque: 'No se pudo leer el estado del entorno',
    desconocido: 'Ocurrió un error inesperado.',
    /** Detalles que el núcleo manda como código dentro de un error. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'comillas sin cerrar',
      'sintaxis.tras_comillas': 'falta un espacio o «;» después de las comillas',
      'sintaxis.punto_y_coma_inesperado': '«;» sin directiva',
      'sintaxis.llave_inesperada': '«{» sin directiva',
      'sintaxis.falta_punto_y_coma': 'falta «;» al final de la directiva',
      'sintaxis.sobra_llave': 'sobra una «}»',
      'sintaxis.falta_llave': 'falta una «}»',
    },
    codigos: {
      'git.cambios_locales':
        'Hay cambios sin guardar en la carpeta: guárdelos (commit) o descártelos antes de traer cambios. No se tocó nada.',
      'git.divergencia':
        'La rama divergió del remoto (hay commits locales y remotos distintos): resuélvalo a mano. No se tocó nada.',
      'git.sin_upstream':
        'La rama actual no sigue a ninguna rama remota: no hay de dónde traer cambios.',
      'git.sin_rama': 'El repositorio está en un commit suelto (sin rama): no se tocó nada.',
      'git.no_repositorio': 'La carpeta no es un repositorio de git.',
      'git.destino_no_vacio': 'La carpeta de destino no está vacía.',
      'git.destino_es_archivo': 'El destino es un archivo, no una carpeta.',
      'git.no_encontrado': 'No se encontró git: instálelo primero.',
      'git.gh_no_encontrado': 'No se encontró GitHub CLI (gh): instálelo primero.',
      'git.plazo': 'El clon superó el plazo de {minutos} min y se canceló.',
      'git.token_invalido': 'El token de GitHub no es válido.',
      'git.url_con_credenciales':
        'La URL no debe llevar usuario ni clave: use un token por separado.',
      'servicios.desconocido': 'Servicio desconocido: {id}.',
      'servicios.no_instalado': '{nombre} no está instalado. Instálelo desde Servicios.',
      'servicios.puerto_invalido': 'El puerto debe ser un número entre 1024 y 65535.',
      'servicios.puerto_asignado': 'El puerto {puerto} ya está asignado a {otro}.',
      'servicios.puerto_ocupado':
        'El puerto {puerto} lo usa {nombre} (PID {pid}). Ciérrelo o elija otro puerto.',
      'servicios.confirmacion_borrado': 'Para borrar los datos de {nombre} escriba "{id}".',
      'servicios.ftp_no_disponible': 'El servidor FTP no está disponible.',
      'sistema.sin_cliente_ftp':
        'No hay un cliente FTP asociado en este equipo. Instale uno (por ejemplo FileZilla) o copie la dirección.',
      'servicios.mailpit_no_responde': 'Mailpit no responde. Inícielo desde Servicios.',
      'servicios.iniciar_todo_fallos':
        'Iniciar todo no pudo encender: {nombres}. Revise Servicios y sus registros.',
      'servicios.respaldo_fallo':
        'No se actualizó {nombre}: falló el respaldo previo y no se cambió nada.',
      'servicios.espacio_insuficiente':
        'No hay espacio para copiar los datos: hacen falta {necesarios} MB y quedan {libres} MB libres.',
      'servicios.actualizacion_revertida':
        'La versión {version} no arrancó; {nombre} volvió a {anterior}. El respaldo se conserva.',
      'servicios.restauracion_fallo':
        'La versión nueva no arrancó y no se pudieron devolver los datos de {nombre}. No se encendió nada: los datos tocados están en {fallida} y el respaldo en {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} es de una versión principal distinta: créela como instancia nueva.',
      'servicios.misma_version': '{id} ya usa la versión {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} está bloqueada: una actualización no pudo devolver sus datos. Los datos tocados están en {fallida} y el respaldo en {respaldo}. Resuélvalo en Servicios → Versiones antes de encenderla.',
      'servicios.datos_apartados':
        '{nombre} no tiene datos en su carpeta, pero hay datos apartados de una actualización: no se crea una carpeta vacía. Revise Servicios → Versiones.',
      'servicios.puerto_reservado':
        'El puerto {puerto} está reservado por el sistema ({desde}–{hasta}): elija otro.',
      'servicios.borrado_con_bloqueo':
        '{nombre} tiene una instancia bloqueada tras una actualización: resuélvala antes de borrar sus datos.',
      'servicios.config_no_revertida':
        '{nombre} {version} no arrancó y no se pudo volver a {anterior} en la configuración. Vuelva a elegir {anterior} en Servicios → Versiones.',
      'servicios.puerto_revertido_apagada':
        '{nombre} no arrancó en el puerto nuevo; se volvió al {anterior}, pero tampoco arrancó ahí: quedó apagada en el puerto {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} no arrancó en el puerto {nuevo} y no se pudo volver al {anterior} en la configuración: quedó apagada.',
      'instancias.id_invalido': 'El identificador de la instancia no es válido.',
      'instancias.no_existe': 'No existe la instancia {id}.',
      'instancias.existe': 'Ya existe la instancia {id}.',
      'instancias.una_sola': '{nombre} admite una sola instancia.',
      'instancias.ultima': '{id} es la única instancia: no se puede quitar.',
      'instancias.sin_puerto_libre': 'No se encontró un puerto libre para la instancia.',
      'instancias.confirmacion': 'Para continuar escriba "{id}".',
      'instancias.sin_datos': '{id} no tiene datos en su carpeta: elija un respaldo para devolver.',
      'instancias.respaldo_no_existe': 'No existe ese respaldo de {id}.',
      'instancias.respaldo_en_uso':
        'Esa copia la necesita {id}, que está bloqueada: resuélvalo antes.',
      'instancias.version_requerida':
        'No se sabe a qué versión volver {id}: elija una versión instalada de la misma versión principal.',
      'instalador.version_en_uso':
        'No se puede desinstalar {servicio} {version}: la usa la instancia {instancia}.',
      'limpieza.sin_confirmar': 'Falta la confirmación para limpiar versiones.',
      'limpieza.seleccion_invalida': 'La selección de versiones no es válida.',
      'limpieza.en_curso': 'Ya hay una limpieza de versiones en curso.',
      'limpieza.no_existe': '{servicio} {version} ya no está instalada.',
      'limpieza.en_uso': '{servicio} {version} pasó a estar en uso: no se quitó.',
      'limpieza.ruta_insegura':
        'La carpeta de {servicio} {version} no es segura (un enlace o una ruta fuera de bin): no se tocó.',
      'limpieza.version_bloqueada':
        '{servicio} {version} tiene archivos en uso o bloqueados: no se quitó ni se dejó a medias.',
      'limpieza.otro_volumen':
        '{servicio} {version} está en otro disco que la carpeta temporal de datos: no se pudo mover entera y no se tocó.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} tiene paquetes instalados por usted (npm, pip…): hay que aceptar perderlos para quitarla.',
      'limpieza.destino_ocupado':
        'Ya hay una carpeta de {servicio} {version} en bin: no se sobrescribe. Quítela antes de recuperar la otra.',
      'bd.encender_servicio': 'Encienda {nombre} para administrar sus bases.',
      'bd.sin_credenciales': 'No hay credenciales guardadas de {nombre}.',
      'bd.confirmacion_borrado': 'Para borrar la base {nombre} escriba su nombre exacto.',
      'bd.usuario_privilegiado':
        'El usuario {usuario} es un administrador o un rol del sistema: elija un usuario propio para el proyecto.',
      'bd.usuario_en_uso':
        'Otro proyecto ya usa el usuario {usuario}: no se cambia su clave para no dejarlo sin conexión. No se creó nada.',
      'bd.rol_sin_login':
        'El usuario {usuario} existe pero no puede iniciar sesión (rol sin LOGIN o regla de acceso del servidor). No se cambió nada.',
      'bd.usuario_clave_distinta':
        'El usuario {usuario} ya existe con otra clave. Use su clave actual: no se cambia para no dejar sin conexión a otros proyectos.',
      'bd.mongosh_faltante': 'Falta mongosh: instálelo desde Servicios para administrar MongoDB.',
      'tuneles.sitio_no_encontrado': 'No se encontró el proyecto.',
      'tuneles.sitio_no_confiable':
        '{dominio} no es de confianza todavía: marque «Confío en este repositorio» en el proyecto antes de publicarlo.',
      'tuneles.confirmacion_requerida':
        'Publicar {dominio} en internet exige confirmarlo en WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'El túnel de {dominio} cambió desde que se confirmó: confirme de nuevo.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared no está instalado. Instálelo desde Servicios.',
      'tuneles.proveedor_no_disponible': 'El proveedor de túnel {proveedor} no está disponible.',
      'tuneles.cloudflare_sin_cuenta':
        'Conecte primero su cuenta de Cloudflare en las opciones del túnel.',
      'tuneles.cloudflare_sin_credencial':
        'Este túnel no tiene credencial guardada: créelo de nuevo en las opciones del túnel.',
      'tuneles.cloudflare_datos_invalidos':
        'El nombre del túnel (minúsculas, números y guiones) o el dominio público no son válidos.',
      'tuneles.cloudflare_conexion_en_curso': 'Ya hay una conexión con Cloudflare en curso.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare registró {registrado} en lugar de {dominio}: el dominio no pertenece a la zona que autorizó. Borre ese registro en el panel de Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'El túnel {nombre} tiene conexiones activas (cloudflared pide -f para borrarlo). Ciérrelo en todos los equipos donde esté abierto y vuelva a intentarlo, o use «Olvidar solo aquí».',
      'tuneles.nombre_en_uso': 'El túnel {nombre} ya lo usa otro sitio.',
      'tuneles.dominio_en_uso': 'El dominio {dominio} ya lo usa otro sitio.',
      'tuneles.confirmacion_olvidar': 'Olvidar o recrear el túnel {nombre} exige confirmarlo.',
      'tuneles.cloudflare_fallo': 'cloudflared no pudo completar la operación: {detalle}',
      'tuneles.credencial_no_protegida':
        'No se pudo restringir la credencial al usuario, así que no se usó.',
      'tuneles.sin_cifrado':
        'El cifrado del sistema no está disponible: no se pueden guardar credenciales.',
      'tuneles.token_invalido':
        'El token no es válido: solo letras, números y _ . - (de 8 a 200 caracteres). Guárdelo de nuevo en las opciones del túnel.',
      'tuneles.ngrok_no_instalado':
        'ngrok no está instalado en este equipo. Instálelo desde ngrok.com y vuelva a intentarlo.',
      'tuneles.ngrok_sin_token': 'Falta el token de ngrok: guárdelo en las opciones del túnel.',
      'tuneles.expose_sin_token': 'Falta el token de Expose: guárdelo en las opciones del túnel.',
      'tuneles.tailscale_no_instalado':
        'Tailscale no está instalado en este equipo. WolfCore Dev no lo instala: instálelo desde tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale no tiene la sesión iniciada: inicie sesión en Tailscale y vuelva a intentarlo.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale ya publica algo en el puerto HTTPS {puerto}. WolfCore Dev no lo pisa: retírelo con Tailscale y vuelva a intentarlo.',
      'lan.sitio_no_encontrado': 'No se encontró el sitio.',
      'lan.confirmacion_requerida':
        'Compartir {dominio} en la red local exige confirmarlo en WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} tiene datos reales: no se comparte en la red local, ni con confirmación. Use una copia sin datos de clientes.',
      'lan.sin_red':
        'No hay una red local conectada (Wi-Fi o Ethernet). Conéctese a una red y vuelva a intentarlo.',
      'lan.ip_no_valida':
        'La dirección {ip} ya no es una de su red local. Vuelva a abrir el diálogo y confirme de nuevo.',
      'lan.requiere_https': '{dominio} redirige a HTTPS: compártalo con la opción HTTPS.',
      'lan.sin_puertos':
        'No hay puertos libres entre 8100 y 8199 para la red local (los sitios compartidos y el enlace de la CA usan ese rango). Deje de compartir un sitio o cierre el diálogo de la CA y vuelva a intentarlo.',
      'tuneles.expose_no_instalado':
        'Expose no está instalado. En Windows solo funciona con expose.phar: póngalo en {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose no se usa con sitios con datos reales: su inspector de peticiones queda visible en toda la red local. Use otro proveedor.',
      'tuneles.confirmacion_requerida_tailnet':
        'Compartir {dominio} con su tailnet exige confirmarlo en WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'No se pudo leer lo que Tailscale ya publica en este equipo, así que no se abrió nada para no pisarlo. Compruebe que Tailscale está en marcha y vuelva a intentarlo.',
      'tuneles.tailscale_no_habilitado':
        'Serve o Funnel no está habilitado en su tailnet. Habilítelo desde {enlace} y vuelva a intentarlo.',
      'tuneles.ngrok_desactualizado':
        'Su ngrok es una versión antigua que no admite lo que WolfCore Dev necesita. Actualícelo (ngrok update) y vuelva a intentarlo.',
      'hosts.dominio_invalido': 'Hay un dominio no válido.',
      'hosts.tiempo_agotado':
        'No hubo respuesta al permiso de administrador en {segundos} s; el archivo hosts quedó igual.',
      'https.sin_dominio': 'Un certificado necesita al menos un dominio.',
      'https.sin_autoridad':
        'No existe la autoridad de certificados de WolfCore Dev. Instale la CA desde la sección HTTPS antes de emitir certificados.',
      'herramientas.pid_invalido': 'El PID no es válido.',
      'herramientas.pid_sistema': 'El PID {pid} es del sistema y no se puede finalizar.',
      'herramientas.proceso_propio':
        'No se puede finalizar WolfCore Dev ni el proceso que lo inició.',
      'herramientas.proceso_inexistente': 'El proceso {pid} ya no existe.',
      'herramientas.sin_editor':
        'No se encontró ningún editor de código. Instale uno (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} no está instalado. Elija otro editor en Ajustes.',
      'herramientas.editor_invalido': 'Ese editor no es válido.',
      'herramientas.carpeta_sitio_inexistente': 'La carpeta del proyecto no existe.',
      'herramientas.ruta_no_absoluta': 'La ruta debe ser absoluta.',
      'herramientas.sin_seleccion': 'Elija al menos un elemento.',
      'herramientas.dominio_invalido': 'Hay un dominio o IP no válido.',
      'herramientas.demasiados_dominios':
        'Un certificado admite como máximo {maximo} dominios o IP.',
      'buscar.consulta_invalida': 'Escriba qué buscar (hasta 500 caracteres).',
      'buscar.raiz_invalida': 'La carpeta o el archivo no existe o no es válido.',
      'buscar.regex_invalida': 'La expresión regular no es válida.',
      'buscar.regex_lenta':
        'La expresión regular tarda demasiado: simplifíquela o use texto literal.',
      'buscar.demasiadas': 'Ya hay {maximo} búsquedas en curso: cancele una o espere.',
      'buscar.ruta_vetada': 'Esa carpeta es de datos de WolfCore Dev: no se busca dentro de ella.',
      'buscar.resultado_caducado': 'Ese resultado ya no está disponible: vuelva a buscar.',
      'buscar.resultado_invalido': 'Ese resultado no se puede abrir.',
      'diff.raiz_invalida': 'Elija dos carpetas que existan y que no sean enlaces.',
      'diff.ruta_vetada': 'Esa carpeta es de datos de WolfCore Dev: no se compara.',
      'diff.cancelado': 'Comparación cancelada.',
      'diff.plazo': 'La comparación tardó más de {segundos} s y se canceló.',
      'diff.memoria': 'La comparación necesita demasiada memoria (más de {maximo}) y se canceló.',
      'diff.ocupado': 'Ya hay una comparación en curso: cancélela o espere.',
      'diff.caducado': 'Esa comparación ya no está disponible: vuelva a comparar.',
      'diff.archivo_invalido': 'Ese archivo ya no se puede comparar: cambió o desapareció.',
      'diff.fallo': 'La comparación falló.',
      'terminal.no_abrio': 'No se pudo abrir la terminal.',
      'terminal.no_instalada': '{nombre} no está instalada. Elija otra terminal en Ajustes.',
      'terminal.invalida': 'Esa terminal no es válida.',
      'terminal.powershell_restringido':
        'PowerShell está en modo de lenguaje restringido en este equipo (directiva de la organización o AppLocker): WolfCore Dev no puede abrir la terminal. Ábrala usted en la carpeta del proyecto.',
      'proyectos.no_existe': 'No existe el proyecto.',
      'proyectos.no_confiado': 'Marque "Confío en este repositorio" para ejecutar la receta.',
      'proyectos.receta_en_curso': 'Ya hay una receta en curso para este proyecto.',
      'proyectos.paso_no_omitible': 'El paso "Crear el sitio" no se puede omitir.',
      'workspaces.no_existe': 'No existe ese workspace.',
      'workspaces.invalido': 'El workspace no es válido: revise su nombre y sus elementos.',
      'workspaces.captadores_exclusivos':
        'Dos captadores de correo no pueden estar encendidos a la vez: solo corre uno.',
      'workspaces.elemento_fallo':
        'No se pudo completar la operación con {elemento}. Revise Servicios y sus registros.',
      'workspaces.base_no_responde':
        '{elemento} no se inició porque la base de datos de ese proyecto no responde.',
      'reverb.no_laravel': 'Reverb solo está disponible en proyectos Laravel.',
      'reverb.no_confiado':
        'Marque «Confío en este repositorio» en el proyecto para encender Reverb.',
      'reverb.sin_paquete':
        'Falta el paquete laravel/reverb: instálelo con composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Confirme que quiere encender Reverb.',
      'reverb.sin_activar': 'Encienda Reverb en el proyecto primero.',
      'tareas.cron_invalida':
        'La expresión cron no es válida. Use 5 campos: minuto, hora, día del mes, mes y día de la semana (por ejemplo, 0 3 * * *).',
      'tareas.comando_invalido':
        'El comando no está permitido. Use php, node, npm run o python con un archivo del proyecto, sin código en la línea (-r, -e, -c).',
      'tareas.invalida': 'La tarea no es válida: revise el nombre, el horario y el comando.',
      'tareas.no_existe': 'Esa tarea ya no existe.',
      'tareas.sin_confirmar': 'Confirme el comando de la tarea para poder ejecutarla.',
      'tareas.sitio_no_confiado':
        'Marque «Confío en este repositorio» en el proyecto para ejecutar sus tareas.',
      'tareas.receta_cambio':
        'La receta del proyecto cambió desde que confió en él: revísela y vuelva a marcar «Confío en este repositorio».',
      'tareas.aislado':
        'Esta es una carpeta de datos de prueba (WOLFCORE_DATOS): permita las tareas programadas para ejecutarlas.',
      'tareas.carpeta': 'No existe la carpeta del proyecto: la tarea no se puede ejecutar.',
      'tareas.en_curso': 'La tarea ya se está ejecutando.',
      'tareas.demasiadas': 'Hay demasiadas tareas en este proyecto (máximo {maximo}).',
      'cli.no_autorizado':
        'La orden de la CLI no está autorizada: vuelva a ejecutarla con la app de WolfCore Dev abierta.',
      'cli.orden_desconocida': 'WolfCore Dev no conoce esa orden de la CLI.',
      'cli.argumentos_invalidos': 'Los argumentos de la orden no son válidos.',
      'cli.solicitud_grande': 'La solicitud es demasiado grande (máximo {maximo} bytes).',
      'cli.formato_no_admitido': 'La solicitud no tiene el formato que acepta la CLI.',
      'cli.plazo':
        'La orden tardó demasiado: puede que siga en curso. Revise el estado en WolfCore Dev.',
      'cli.ocupado':
        'WolfCore Dev está atendiendo demasiadas órdenes de la CLI: espere un momento.',
      'cli.requiere_confirmacion':
        'Esta orden publica o cambia algo y exige confirmarla (--si) en {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} tiene datos reales: confirme también con la opción de datos reales de la orden (el dominio del sitio).',
      'cli.requiere_confirmacion_global':
        'Cambiar el PHP de todas las terminales exige confirmarlo (--si).',
      'cli.confirmacion_rechazada':
        'La confirmación en la ventana de WolfCore Dev se rechazó o no estaba disponible: no se hizo nada.',
      'cli.confirmacion_vencida':
        'Nadie confirmó en la ventana de WolfCore Dev a tiempo: no se hizo nada.',
      'cli.tunel_fallo': 'No se pudo abrir el túnel. Revise su registro en WolfCore Dev.',
      'cli.inicio_fallo':
        'No se pudo iniciar todo lo pedido. Revise los registros en WolfCore Dev.',
      'cli.parada_fallo':
        'No se pudo detener todo lo pedido. Revise los registros en WolfCore Dev.',
      'cli.interno': 'Error interno del servidor de la CLI.',
      'cli.proveedor_distinto':
        'El sitio usa otro proveedor de túnel ({proveedor}). Revise y confirme de nuevo.',
      'cli.sitio_no_encontrado': 'El sitio {sitio} no existe.',
      'cli.carpeta_invalida':
        'La carpeta no existe, es del sistema o es la carpeta de datos de WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Esa carpeta no pertenece a ningún sitio de WolfCore Dev: vincúlela primero.',
      'cli.ya_vinculada': 'Esa carpeta ya es el sitio {sitio}.',
      'cli.tipo_no_soportado':
        'Los proyectos de tipo {tipo} se crean desde la interfaz de WolfCore Dev.',
      'cli.sitio_sin_php': 'El sitio {sitio} no usa PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} no está instalado. Instálelo desde Servicios.',
      'cli.fuente_no_existe': 'Ese registro todavía no existe.',
      'cli.token_no_protegido':
        'No se pudo restringir el archivo del token al usuario actual: la CLI no se activa.',
      'cli.carpeta_ajena':
        'La carpeta run/ de la carpeta de datos es de otro usuario: la CLI no se activa.',
      'cli.ruta_invalida': 'La ruta de WolfCore Dev tiene caracteres que wolf.cmd no admite.',
      'cli.path_aislado':
        'Con una carpeta de datos de prueba (WOLFCORE_DATOS) no se cambia el PATH del usuario.',
      'cli.sin_cliente': 'Esta versión de WolfCore Dev no trae el cliente wolf (falta compilarlo).',
      'cli.demasiados_dialogos':
        'Demasiadas confirmaciones en el último minuto: espere un momento y vuelva a intentarlo.',
      'cli.error': 'No se pudo completar la orden: {detalle}',
      'proyectos.carpeta_no_vacia':
        'La carpeta del proyecto ya tiene archivos: elija otra o vacíela.',
      'secretos.sin_cifrado':
        'El cifrado del sistema no está disponible: no se puede guardar la clave del usuario propio. No se cambió nada.',
      'proyectos.clave_bd_falta':
        'Falta la clave guardada del usuario {usuario}: no se escribió nada. En el gestor de .env, "Usar usuario propio" genera una clave nueva.',
      'env.archivo_grande': 'El archivo de variables es demasiado grande (máximo {maximo}).',
      'env.no_regular': 'El archivo .env no es un archivo normal: no se lee ni se modifica.',
      'env.clave_inexistente': 'La variable {clave} no existe.',
      'env.cambio_invalido': 'Un cambio del .env no es válido.',
      'env.variable_invalida': 'El cambio de la variable {clave} no es válido.',
      'env.solo_lectura': 'La variable {clave} ocupa varias líneas: edítela a mano en el archivo.',
      'env.usuario_compartido':
        'La base {base} también la usa el proyecto {proyecto}: confirme si quiere compartir su usuario.',
      'env.cambio_externo':
        'El .env cambió desde que se mostró la vista previa: revíselo de nuevo antes de guardar.',
      'env.meilisearch_no_disponible': 'Meilisearch no está instalado: instálelo en Servicios.',
      'env.sin_confirmar': 'Confirme que quiere guardar los cambios del .env.',
      'env.versionado':
        'Git ya sigue el .env de este proyecto: el próximo commit subiría sus valores. Confirme aparte para continuar.',
      'env.versionado_desconocido':
        'No se pudo comprobar si git sigue el .env de este proyecto: confirme aparte para continuar.',
      'env.copia_invalida': 'La copia del .env no es válida o ya no existe.',
      'env.sin_base': 'El .env de este proyecto no tiene una conexión a una base de datos.',
      'env.base_no_resuelta':
        'La base de este proyecto no es de un servidor local de WolfCore Dev: no se cambió nada.',
      'env.motor_no_soportado': 'Por ahora "Usar usuario propio" funciona con MySQL y MariaDB.',
      'env.ya_usa_usuario_propio': 'Este proyecto ya usa un usuario propio.',
      'plantillas.id_invalido': 'El identificador de la plantilla no es válido.',
      'plantillas.no_existe': 'La plantilla no existe.',
      'plantillas.danada':
        'La plantilla está dañada o fue modificada: no se usa. Bórrela y guárdela de nuevo.',
      'plantillas.demasiado_grande':
        'El proyecto tiene demasiados archivos o pesa demasiado para guardarlo como plantilla (hasta {maximo} archivos). Excluya carpetas grandes.',
      'plantillas.demasiado_pesada':
        'El proyecto pesa demasiado para guardarlo como plantilla (hasta {maximo}). Excluya carpetas grandes.',
      'plantillas.exclusion_invalida':
        'Una de las exclusiones no es válida (use nombres o rutas relativas, sin "..").',
      'plantillas.nombre_invalido':
        'El nombre de la plantilla no es válido (de 1 a 60 caracteres).',
      'plantillas.esquema_fallo':
        'No se pudo leer el esquema de la base del proyecto: compruebe que su servicio esté encendido.',
      'plantillas.base_no_resuelta':
        'No se puede guardar la plantilla: el servidor de la base es remoto o ninguno de los servicios locales usa ese puerto.',
      'plantillas.sin_generador_base':
        'Este tipo de proyecto no tiene un generador base: la plantilla debe incluir los archivos del proyecto.',
      'plantillas.exclusiones_nuevas':
        'La plantilla trae un archivo que ahora se excluye ({archivo}): guárdela de nuevo desde el proyecto o bórrela.',
      'plantillas.motor_distinto':
        'El esquema de la plantilla es de MySQL y el servidor elegido es MariaDB (o al revés): puede haber diferencias. Confirme que quiere continuar.',
      'bd.sql_no_permitido':
        'El esquema trae una sentencia que no es de estructura y no se ejecutó nada: {sentencia}',
      'bd.extension_no_permitida':
        'El esquema pide la extensión {nombre}, que no está en la lista permitida: no se restauró nada.',
      'bd.esquema_fallo': 'No se pudo restaurar el esquema completo: no se dejó nada a medias.',
      'bd.datos_no_permitidos':
        'El volcado de datos trae algo que no son datos (solo se aceptan INSERT, LOCK TABLES y SET): no se importó nada.',
      'bd.datos_fallo':
        'No se pudieron importar los datos: la base quedó como estaba, sin nada a medias.',
      'bd.lentas_confirmar':
        'Cambiar el registro de consultas lentas afecta a todo el servidor: hay que confirmarlo. No se cambió nada.',
      'bd.lentas_umbral_invalido': 'El tiempo debe estar entre 0,1 y 60 segundos.',
      'bd.lentas_motor_no_soportado':
        'Las consultas lentas solo se pueden cambiar en MySQL, MariaDB y PostgreSQL gestionados por WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        'No se muestra el SQL con sus valores: la base tiene datos reales o la consulta no se puede atribuir a una base conocida.',
      'bd.lentas_entrada_no_existe': 'Esa consulta ya no está en el registro. Vuelva a leerlo.',
      'bd.lentas_fallo':
        'No se pudo leer o cambiar el registro de consultas lentas. Compruebe que el servidor está encendido.',
      'bd.esquema_base_no_existe': 'La base no existe en ese servidor.',
      'bd.esquema_motor_no_soportado': 'El visor de esquema es para MySQL, MariaDB y PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'No se pudo leer el esquema de la base. Compruebe que el servidor está encendido.',
      'perfiles.destino_invalido': 'Elija dónde guardar el perfil (un archivo .wolfperfil).',
      'perfiles.frase_debil': 'La frase de la CA debe tener al menos {minimo} caracteres.',
      'perfiles.frase_incorrecta': 'La frase no es correcta: no se importó nada.',
      'perfiles.certificados_sin_ca':
        'Los certificados de los sitios solo viajan junto con la CA cifrada: incluya la CA con una frase.',
      'perfiles.no_existe': 'El archivo del perfil no existe.',
      'perfiles.danado': 'El perfil está dañado o fue modificado: no se importó nada.',
      'perfiles.demasiado_grande': 'El perfil es demasiado grande (hasta {maximo}).',
      'perfiles.version_no_soportada':
        'El perfil es de una versión más nueva de WolfCore Dev (formato {version}): actualice la app para importarlo.',
      'perfiles.sin_confirmar': 'Confirme que quiere importar el perfil.',
      'perfiles.vista_previa_vieja':
        'La carpeta de datos o el perfil cambiaron desde la vista previa: revísela otra vez.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS no es una carpeta de datos válida: debe ser absoluta, no del sistema y distinta de la carpeta real.',
      'perfiles.confirmar_reemplazar_ca':
        'El perfil trae una CA y este equipo ya tiene la suya: compare la huella y confirme aparte que quiere reemplazarla (solo si es su propia CA).',
      'herramientas.imagen_tipo':
        'Ese archivo no es una imagen admitida (PNG, JPG, WebP, GIF, BMP o ICO) o su contenido no coincide con el tipo.',
      'herramientas.imagen_grande': 'La imagen pesa demasiado (hasta {maximo}).',
      'herramientas.imagen_dimensiones':
        'La imagen es demasiado grande ({ancho}×{alto} px; hasta {maximo} px por lado) y no se abre por seguridad.',
      'herramientas.zip_sin_archivos': 'No hay archivos para comprimir (los enlaces no se siguen).',
      'herramientas.zip_demasiados': 'Hay demasiados archivos para comprimir (hasta {maximo}).',
      'herramientas.zip_grande': 'Lo que se quiere comprimir pesa demasiado (hasta {maximo}).',
      'herramientas.pdf_invalido': 'El archivo no es un PDF que se pueda optimizar.',
      'herramientas.pdf_grande': 'El PDF pesa demasiado (hasta {maximo}).',
      'herramientas.pdf_cifrado': 'El PDF está protegido con contraseña y no se puede optimizar.',
      'herramientas.pdf_plazo': 'El PDF tardó más de {segundos} s y se canceló.',
      'herramientas.salida_ocupada': 'No se encontró un nombre libre para el archivo nuevo.',
      'captura.atajo_invalido':
        'Ese atajo no es válido: use Ctrl, Alt, Mayús o Super con una letra, un número o una tecla F.',
      'captura.atajo_no_permitido':
        'Ese atajo no se permite: use Ctrl o Super con otro modificador (Ctrl+Alt sin Mayús es AltGr y quita la @) y evite atajos comunes como Ctrl+C o Alt+F4.',
      'captura.atajo_ocupado': 'El atajo {atajo} ya lo usa otro programa.',
      'captura.no_disponible': 'La captura de pantalla no está disponible en este equipo.',
      'captura.permiso_denegado': 'Falta el permiso de grabación de pantalla.',
      'captura.sin_imagen': 'No hay ninguna imagen para capturar.',
      'captura.imagen_invalida': 'La imagen de la captura no es válida.',
      'conversor.formato': 'Esa conversión no está disponible.',
      'disco.sin_confirmar': 'Confirma la limpieza en el diálogo antes de continuar.',
      'disco.categoria_invalida': 'Esa categoría de limpieza no existe.',
      'disco.ruta_vetada':
        'La categoría toca una ruta protegida (datos, respaldos, proyectos o FlyEnv); no se limpió nada.',
      'disco.sin_analisis': 'Analice de nuevo antes de limpiar: el análisis caducó o falta.',
      'disco.ocupada': 'Ya hay un análisis o una limpieza en curso.',
      'disco.sin_registro': 'No se pudo crear el registro de la limpieza; no se borró nada.',
      'editor.sin_confirmar': 'Confirma el guardado antes de continuar.',
      'editor.confirmacion_reforzada':
        'Este archivo parece guardar secretos o es de un sitio con datos reales: confirma con refuerzo para guardarlo.',
      'editor.ruta_invalida': 'La ruta del archivo no es válida.',
      'editor.no_existe': 'El archivo no existe.',
      'editor.no_regular': 'Solo se editan archivos normales.',
      'editor.ruta_vetada':
        'Ese archivo está en la carpeta de datos de WolfCore Dev: no se abre ni se guarda desde el editor.',
      'editor.archivo_env':
        'Los archivos .env se gestionan desde las variables del proyecto, no desde el editor.',
      'editor.demasiado_grande': 'El archivo es demasiado grande para el editor (máximo {maximo}).',
      'editor.binario': 'El archivo no es de texto (es binario): no se edita aquí.',
      'editor.codificacion': 'El archivo no está en UTF-8: el editor no lo abre para no dañarlo.',
      'editor.no_abierto':
        'Ese archivo no se abrió en el editor (o su versión cambió): ábrelo de nuevo.',
      'editor.eol_mixto': 'El archivo mezcla saltos de línea: confirma normalizarlos para guardar.',
      'editor.contenido_invalido': 'El contenido no es texto válido.',
      'editor.huella_invalida': 'Falta la huella del archivo abierto: ábralo de nuevo.',
      'editor.archivo_cambiado':
        'El archivo cambió fuera del editor desde que se abrió. Recárgalo o confirma sobrescribirlo.',
      'editor.copia_fallo': 'No se pudo hacer la copia previa ({codigo}); no se guardó nada.',
      'editor.lectura_fallo': 'No se pudo leer el archivo ({codigo}).',
      'editor.escritura_fallo': 'No se pudo guardar el archivo ({codigo}). El original no se tocó.',
      'memoria.sin_confirmar': 'Confirma la acción en el diálogo antes de continuar.',
      'memoria.modo_invalido': 'Ese modo de optimización no existe.',
      'memoria.plan_caducado':
        'La lista caducó o ya no es la actual. Vea la lista de nuevo antes de aplicar.',
      'memoria.no_disponible':
        'El optimizador de memoria no está disponible aquí o no pudo leer el sistema.',
      'conversor.archivo_invalido':
        'El archivo está dañado o no es del tipo que indica su extensión.',
      'conversor.archivo_grande': 'El archivo pesa demasiado (hasta {maximo}).',
      'conversor.archivo_peligroso':
        'El archivo parece un ZIP bomba o está manipulado (demasiado contenido, entidades XML o nombres no válidos) y no se abre por seguridad.',
      'conversor.limite_filas': 'La tabla tiene demasiadas filas (hasta {maximo}).',
      'conversor.limite_columnas': 'La tabla tiene demasiadas columnas (hasta {maximo}).',
      'conversor.limite_paginas': 'El PDF tiene demasiadas páginas (hasta {maximo}).',
      'conversor.pdf_cifrado': 'El PDF está protegido con contraseña y no se puede convertir.',
      'conversor.plazo': 'La conversión tardó más de {segundos} s y se canceló.',
      'conversor.ocupado': 'Ya hay una conversión en curso y otra en espera: espere a que termine.',
      'conversor.cancelado': 'Conversión cancelada.',
      'conversor.libreoffice_ausente':
        'Esa conversión necesita LibreOffice y no está instalado en este equipo (WolfCore Dev no lo instala).',
      'conversor.libreoffice_fallo': 'LibreOffice no pudo convertir el documento.',
      'conversor.limite_celdas': 'La tabla tiene demasiadas celdas (hasta {maximo}).',
      'conversor.memoria': 'El archivo necesita demasiada memoria (más de {maximo}) y se canceló.',
      'conversor.pdf_no_disponible': 'La impresión a PDF no está disponible en este momento.',
      'herramientas.imagen_pixeles':
        'La imagen tiene demasiados píxeles en total ({ancho}×{alto} px; hasta {maximo}) y no se abre por seguridad.',
      'herramientas.zip_cambio': 'Un archivo cambió mientras se comprimía: vuelva a intentarlo.',
      'herramientas.pdf_demasiado_complejo':
        'El PDF es demasiado complejo (inflaría más memoria de la permitida) y se canceló.',
      'herramientas.salida_denegada':
        'No se puede escribir en esa ubicación: revise el permiso o que la carpeta exista.',
      'herramientas.fuera_de_la_ca':
        'La CA de WolfCore Dev solo firma dominios .test, localhost y direcciones locales: {dominio} no se puede incluir.',
      'perfiles.frase_requerida':
        'Escriba la frase del perfil para importar sus bases o su CA (o importe sin las bases).',
      'perfiles.sin_espacio':
        'No hay espacio libre suficiente para importar el perfil: hacen falta {necesarios} y hay {libres}.',
      'perfiles.ca_sin_restricciones':
        'Esta CA puede firmar cualquier sitio web: impórtela solo si es la suya y compare la huella. Confírmelo aparte para continuar.',
      'perfiles.ca_restricciones_ajenas':
        'La CA del perfil tiene restricciones de nombre que no son las de WolfCore Dev: no se importa.',
      'perfiles.instantanea_fallo':
        'No se pudo guardar la copia previa del entorno: no se cambió nada. Revise el espacio en disco y los permisos de la carpeta de datos.',
      'perfiles.en_curso': 'Ya hay una importación de perfil en curso: espere a que termine.',
      'importar.origen_apagado':
        'No se pudo conectar al servidor de base de datos del otro programa: enciéndalo desde ese programa e inténtelo de nuevo. Los sitios sí se importaron.',
      'importar.origen_no_local': 'El servidor de origen debe estar en este equipo (127.0.0.1).',
      'importar.origen_rechazado': 'El servidor de origen rechazó el usuario o la clave.',
      'importar.origen_version':
        'La versión del servidor de origen no se puede importar con lo que hay instalado en WolfCore Dev.',
      'importar.volcado_enorme':
        'Los datos de la base pesan más de {maximo} MB: no se importan de una vez.',
      'importar.motor_no_soportado':
        'Solo se importan bases de MySQL y MariaDB desde otros programas.',
      'importar.ruta_fuera':
        'Se descartó una carpeta o archivo que apunta fuera de la instalación o a una carpeta del sistema.',
      'importar.carpeta_invalida': 'Se descartó una carpeta que ya no existe o no es una carpeta.',
      'importar.archivo_grande':
        'Un archivo de configuración pesa más de {maximo} KB y no se leyó.',
      'importar.archivo_ilegible': 'Un archivo de configuración no es de texto o no se pudo leer.',
      'importar.demasiados':
        'Hay demasiados sitios o archivos de configuración: solo se leyeron los primeros.',
      'importar.candidato_desconocido':
        'Ese sitio ya no aparece en el programa de origen: vuelva a buscar.',
      'importar.ya_vinculado': 'Esa carpeta ya es un sitio de WolfCore Dev.',
      'importar.dominio_existe':
        'Ya hay un sitio con el dominio {dominio}: cámbielo antes de importar.',
      'importar.sin_php':
        'Este sitio necesita PHP y no hay ninguna versión instalada: instálela desde Servicios.',
      'importar.base_existe':
        'La base {nombre} ya existe en el destino y no se tocó. Confirme el reemplazo para importarla (se hace una copia antes).',
      'importar.base_fallo':
        'No se pudo importar la base {nombre}: quedó como estaba, sin nada a medias.',
      'importar.sitio_fallo': 'No se pudo crear el sitio.',
      'importar.origen_invalido':
        'Los datos del servidor de origen no son válidos (usuario, clave o puerto).',
      'importar.sin_seleccion': 'Elija al menos un sitio para importar.',
      'importar.en_curso': 'Ya hay una importación en curso: espere a que termine.',
      'importar.cancelado': 'Importación cancelada: lo que se estaba importando quedó como estaba.',
      'importar.origen_estancado':
        'El servidor del otro programa dejó de responder durante el volcado: no se importó la base.',
      'importar.sin_espacio':
        'No hay espacio libre suficiente para importar la base: hacen falta unos {necesarios} MB y hay {libres} MB.',
      'importar.origen_fallo': 'No se pudo volcar la base del otro programa.',
      'importar.clave_no_ascii':
        'La clave tiene acentos o símbolos que no se pueden pasar al volcado: use una clave solo con caracteres ASCII.',
      'plantillas.sin_esquema': 'La plantilla no trae el esquema de una base de datos.',
      'proyectos.carpeta_invalida': 'La carpeta del proyecto no es válida.',
      'proyectos.nombre_invalido':
        'El nombre del proyecto solo puede llevar minúsculas, números y guiones (hasta 40).',
      'proyectos.argumento_invalido': 'Un dato del proyecto no es válido (campo: {campo}).',
      'proyectos.base_existe': 'La base {nombre} ya existe: elija otro nombre.',
      'proyectos.dominio_existe': 'Ya existe un sitio con el dominio {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Esa carpeta es la del proyecto {dominio} o está dentro de ella: elija otra.',
      'proyectos.sin_python': 'No hay Python instalado: instálelo desde Servicios.',
      'proyectos.venv_ajeno':
        'El proyecto trae su propio .venv y WolfCore Dev no ejecuta el Python de un repositorio ajeno: bórrelo y vuelva a crear el entorno.',
      'proyectos.paso_base_no_omitible':
        'El paso "Crear la base de datos" de un proyecto nuevo no se puede omitir.',
      'proyectos.sin_php': 'No hay PHP instalado: instálelo desde Servicios.',
      'proyectos.php_no_instalado': 'PHP {version} no está instalado: instálelo desde Servicios.',
      'proyectos.python_no_instalado':
        'Python {version} no está instalado: instálelo desde Servicios.',
      'mcp.token_invalido': 'El token del servidor MCP no es válido.',
      'mcp.solicitud_cancelada': 'El cliente MCP canceló la solicitud: no se ejecutó la acción.',
      'doctor.puerto_ocupado': 'El puerto {puerto} de {servicio} lo usa otro programa ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) ocupa el puerto {puerto} de {servicio}.',
      'doctor.puerto_http_sys':
        'Un servicio de Windows ({programa}) ocupa el puerto {puerto} de {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} ocupa el puerto {puerto} de {servicio}. Ciérrelo o cambie el puerto de WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} ocupa el puerto {puerto} de {servicio}.',
      'doctor.puerto_skype': '{programa} ocupa el puerto {puerto} de {servicio}.',
      'doctor.puerto_reservado':
        'El puerto {puerto} de {servicio} está en un rango reservado por Windows ({desde}-{hasta}: Hyper-V, WSL o Docker).',
      'doctor.ca_por_vencer': 'La autoridad de certificados de WolfCore Dev vence en {dias} días.',
      'doctor.ca_vencida': 'La autoridad de certificados de WolfCore Dev venció.',
      'doctor.certificado_por_vencer': 'El certificado de {dominio} vence en {dias} días.',
      'doctor.certificado_vencido': 'El certificado de {dominio} venció.',
      'doctor.hosts_ilegible': 'No se pudo leer el archivo hosts.',
      'doctor.hosts_utf16':
        'El archivo hosts está guardado en UTF-16: Windows puede no leer sus entradas.',
      'doctor.hosts_bloque_duplicado':
        'El archivo hosts tiene {bloques} bloques de WolfCore Dev; debe haber uno.',
      'doctor.hosts_bloque_sin_cierre':
        'Un bloque de WolfCore Dev en el archivo hosts quedó sin su marca de cierre.',
      'doctor.hosts_dominios_faltantes':
        'Faltan {cantidad} dominios de sus sitios en el archivo hosts.',
      'doctor.hosts_solo_lectura':
        'El archivo hosts es de solo lectura (suele ponerlo un antivirus). WolfCore Dev igual puede escribirlo con permiso de administrador.',
      'doctor.path_duplicados':
        'El PATH del usuario tiene {cantidad} entradas repetidas de WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Otra carpeta con {programa} ({origen}) está antes que WolfCore Dev en el PATH: en las terminales se usará esa.',
      'doctor.vcredist_ausente':
        'Falta Microsoft Visual C++ 2015-2022 (x64): PHP y otros servicios no arrancan sin él.',
      'doctor.enlazador_msvc_ausente':
        'Rust está instalado pero faltan las herramientas de C++ de Visual Studio Build Tools (enlazador MSVC): cargo no podrá enlazar los programas.',
      'doctor.antivirus_sin_exclusion':
        'El antivirus revisa la carpeta de datos de WolfCore Dev: PHP y los servicios pueden arrancar lento.',
      'doctor.firewall_reglas':
        'Windows deja entrar desde la red a {cantidad} regla(s) de programas de WolfCore Dev (nginx, PHP o bases de datos) en los perfiles {perfiles}: esos programas quedan abiertos a la red.',
      'doctor.firewall_no_comprobado':
        'No se pudo comprobar el cortafuegos de Windows (puede hacer falta administrador).',
      'doctor.firewall_reglas_ajenas':
        'Hay {cantidad} regla(s) de entrada de otros programas (FlyEnv, Laragon, XAMPP u otros) con nginx, PHP o bases de datos en los perfiles {perfiles}. No son de WolfCore Dev: solo se muestran, nunca se quitan desde aquí.',
      'doctor.firewall_reglas_acotadas':
        'Hay {cantidad} regla(s) de programas de WolfCore Dev acotadas a la red local (solo perfil privado, subred local y puertos concretos), como las que recomienda la propia aplicación para compartir un sitio. Solo se muestran: no se quitan desde aquí.',
      'doctor.firewall_almacen_inseguro':
        'La copia protegida de las reglas no es de fiar (permisos o contenido distintos de lo mostrado): no se creó ni se cambió ninguna regla.',
      'doctor.firewall_quitadas':
        'WolfCore Dev quitó antes {cantidad} regla(s) del cortafuegos y guardó una copia: puede volver a crearlas si las necesita.',
      'doctor.firewall_parcial':
        'Se quitaron algunas reglas, pero otras no: cambiaron desde que se mostró la lista, no eran de WolfCore Dev o Windows no dejó quitarlas. Revise la lista.',
      'doctor.firewall_sin_cambios':
        'No se cambió ninguna regla: ya no coinciden con lo que se mostró o no se pudieron cambiar.',
      'doctor.firewall_registro_fallido':
        'No se pudo guardar la copia de las reglas en etc/cortafuegos-quitadas.json: no se cambió nada.',
      'doctor.servicio_en_error': '{servicio} está en error.',
      'doctor.revision_fallida': 'No se pudo completar la revisión {revision}.',
      'doctor.confirmacion_requerida': 'Confirme la reparación antes de aplicarla.',
      'doctor.hallazgo_desconocido': 'Ese hallazgo ya no está: vuelva a revisar.',
      'doctor.solo_informa':
        'Este hallazgo no tiene una reparación automática: siga las indicaciones.',
      'doctor.reparacion_fallida': 'No se pudo aplicar la reparación.',
      'doctor.reparacion_cancelada': 'Se canceló el permiso de administrador: no se cambió nada.',
      'doctor.reparacion_denegada': 'Windows o un antivirus negó el acceso: no se cambió nada.',
      'doctor.ya_resuelto': 'El problema ya no estaba: no hizo falta cambiar nada.',
      'doctor.ca_vieja_sin_quitar':
        'La autoridad de certificados nueva ya está en uso, pero no se pudo quitar la anterior del almacén de Windows. Puede quitarla desde la sección HTTPS.',
      'doctor.sin_puerto_libre': 'No se encontró un puerto libre para mover el servicio.',
      'doctor.ca_vuelta_atras_incompleta':
        'No se pudo aplicar la autoridad nueva y la vuelta atrás quedó incompleta. Revise la sección HTTPS; hay una copia con fecha en etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox no confía en la autoridad de WolfCore Dev en {cantidad} perfiles (usa su propio almacén).',
      'confianza.sin_ca': 'Aún no hay autoridad de certificados: créela desde HTTPS.',
      'confianza.sin_raices':
        'No se encontraron raíces de confianza para Python (ni certifi ni las de Windows): no se cambió nada.',
      'confianza.node_variable_ajena':
        'Ya tiene su propia NODE_EXTRA_CA_CERTS: WolfCore Dev no la reemplaza.',
      'confianza.variable_fallida': 'No se pudo cambiar la variable del usuario.',
      'firefox.abierto': 'Firefox está abierto: ciérrelo y vuelva a intentarlo.',
      'firefox.error': 'No se pudo cambiar el user.js de ese perfil; quedó como estaba.',
      'firefox.fuera':
        'Hay perfiles fuera de la carpeta de Firefox: actívelos desde Confianza de la CA, con su confirmación aparte.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS ya no apunta a la autoridad de WolfCore Dev (se cambió a mano): no se borró.',
      'ia.clave_invalida': 'El proveedor rechazó la clave: revísela o genere una nueva.',
      'ia.sin_saldo': 'La cuenta del proveedor no tiene saldo o cuota disponible.',
      'ia.limite': 'El proveedor limitó las peticiones: espere un momento y vuelva a probar.',
      'ia.region': 'El proveedor no da servicio desde su país o región.',
      'ia.sin_red': 'No se pudo conectar con el proveedor: revise la red o la URL base.',
      'ia.url_invalida':
        'La URL base no es válida: use https:// (o http:// solo hacia 127.0.0.1 o [::1]), sin usuario ni clave.',
      'ia.plazo': 'El proveedor no respondió en {segundos} s.',
      'ia.respuesta_rara': 'El proveedor respondió algo inesperado.',
      'ia.cancelado': 'Se canceló la petición al proveedor.',
      'ia.sin_clave': 'Este proveedor necesita una clave: guárdela primero.',
      'ia.clave_mal_formada':
        'La clave no tiene un formato válido (sin espacios ni saltos de línea).',
      'ia.modelo_invalido': 'El nombre del modelo no es válido.',
      'ia.modelo_no_disponible': 'El modelo no existe o su cuenta no tiene acceso a él.',
      'ia.proveedor_invalido': 'La configuración del proveedor no es válida.',
      'ia.env_conflicto':
        'El .env ya define {claves} con otro valor: confirme si quiere reemplazarlo.',
      'ia.env_sin_confirmar':
        'Confirme que quiere escribir la clave en el .env (queda en texto plano).',
      'ia.env_versionado':
        'Git ya sigue el .env de este proyecto: el próximo commit subiría la clave aunque esté en .gitignore. Quítelo del índice con git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'No se pudo comprobar si git ya sigue el .env de este proyecto: confirme aparte que quiere escribir la clave.',
      'ia.proveedor_no_existe': 'El proveedor de IA ya no existe.',
      'ia.url_cambia_con_clave':
        'El proveedor tiene una clave guardada: confirme que quiere enviarla a la nueva URL.',
      'ia.mensaje_sin_confirmar':
        'Confirme el envío del mensaje de prueba (gasta tokens de su cuenta).',
      'ia.clave_ilegible':
        'No se pudo leer la clave guardada del proveedor: bórrela y vuelva a guardarla.',
      'ia.argumento_invalido': 'Dato no válido ({campo}).',
      'correo.auth': 'El proveedor rechazó el usuario o la clave.',
      'correo.conexion': 'No se pudo conectar con el servidor SMTP: revise el host y el puerto.',
      'correo.tls':
        'No se pudo establecer una conexión cifrada y válida con el servidor (certificado, nombre o STARTTLS). No se envió nada.',
      'correo.rechazado':
        'El servidor rechazó el mensaje o una dirección. Revise el remitente: muchos proveedores solo aceptan un remitente o dominio verificado.',
      'correo.plazo': 'El servidor no respondió a tiempo (20 s).',
      'correo.host_invalido':
        'El servidor SMTP debe ser un nombre de host o una IP, sin esquema, puerto ni ruta.',
      'correo.host_local':
        'Ese servidor apunta a este equipo o a la red local: confírmelo para usarlo.',
      'correo.destinatario_invalido': 'La dirección de destino no es válida.',
      'correo.proveedor_invalido': 'Los datos del proveedor no son válidos.',
      'correo.proveedor_no_existe': 'El proveedor de correo ya no existe.',
      'correo.sin_clave': 'El proveedor no tiene una clave guardada.',
      'correo.clave_ilegible':
        'No se pudo leer la clave guardada del proveedor: bórrela y vuelva a guardarla.',
      'correo.cambia_con_clave':
        'El proveedor tiene una clave guardada: confirme que quiere enviarla al nuevo servidor.',
      'correo.env_sin_confirmar':
        'Confirme que quiere escribir las variables de correo en el .env.',
      'correo.ocupado': 'Ya hay una prueba de envío en curso.',
      'correo.limite': 'Espere {segundos} s antes de otra prueba de envío.',
      'correo.clave_mal_formada':
        'La clave no tiene un formato válido: solo caracteres imprimibles, sin saltos de línea y de hasta 4096 caracteres.',
      'correo.argumento_invalido': 'Dato no válido ({campo}).',
      'agentes.no_existe': 'Ese agente no está soportado.',
      'agentes.sin_confirmar': 'Confirme la acción en el diálogo antes de continuar.',
      'agentes.no_instalable':
        'Este agente no se instala desde WolfCore Dev: siga la guía oficial ({guia}).',
      'agentes.sin_node': 'Instale Node desde Servicios para poder instalar el agente.',
      'agentes.node_antiguo':
        '{agente} necesita Node {requerida} o superior y el que se usaría es el {actual}. Instale un Node más nuevo desde Servicios.',
      'agentes.node_version_desconocida':
        'No se pudo saber la versión de Node y {agente} necesita Node {requerida} o superior. Revise el Node de Servicios.',
      'instalador.zip_demasiado_grande':
        'El paquete descargado es demasiado grande o trae demasiados archivos: no se instala.',
      'rust.rustup_init_fallo': 'rustup-init no terminó bien (código {codigo}): {detalle}',
      'rust.toolchain_fallo': 'No se pudo instalar Rust {version} (código {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'No se pudo desinstalar Rust {version}: {detalle}',
      'rust.descarga_fallo': 'No se pudo descargar rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'No se pudo instalar el agente: {detalle}',
      'agentes.no_instalado': '{agente} no está instalado.',
      'agentes.mcp_no_soportado':
        '{agente} no documenta cómo tomar el token de una variable de entorno: no se le registra el MCP.',
      'agentes.config_ilegible':
        'No se pudo interpretar {archivo}; no se modificó. Revíselo a mano.',
      'agentes.config_en_uso':
        '{archivo} cambió mientras WolfCore Dev lo editaba: cierre el agente y vuelva a intentarlo. No se modificó.',
      'agentes.proveedor_incompatible': '{agente} no puede usar ese proveedor de IA.',
      'agentes.sin_cambios_preparados': 'No hay cambios preparados (git add) para describir.',
      'agentes.argumento_invalido': 'Dato no válido ({campo}).',
      'git.commit_fallo': 'No se pudo hacer el commit: {detalle}',
      'git.mensaje_invalido': 'El mensaje de commit está vacío o no es válido.',
      'php.rama_no_instalada': 'PHP {rama} no está instalado.',
      'php.argumento_invalido': 'Dato no válido ({campo}).',
      'php.valor_invalido': 'El valor de {clave} no es válido.',
      'php.ini_invalido': 'PHP no arranca con ese php.ini; no se guardó nada. Salida: {salida}',
      'php.no_arranco':
        'PHP {rama} no volvió a arrancar con el cambio; se restauró lo anterior y responde como antes.',
      'php.caido_tras_restaurar':
        'PHP {rama} no volvió a arrancar; se restauró lo anterior, pero sigue sin responder. Revise Servicios y los registros de PHP.',
      'php.respaldo_no_existe': 'Esa copia del php.ini no existe.',
      'php.extension_no_existe': 'La extensión {nombre} no está en la carpeta ext de esta versión.',
      'php.extension_no_catalogo':
        'La extensión {nombre} no está en el catálogo para esta versión.',
      'php.variante_desconocida': 'No se pudo saber cómo está compilado este PHP.',
      'php.sin_variante': 'El catálogo no tiene {nombre} para la compilación {variante}.',
      'php.huella_distinta': 'La descarga no coincide con la huella publicada; no se instaló nada.',
      'php.descarga_fallida': 'No se pudo descargar la extensión: {detalle}',
      'php.extension_en_uso':
        'La DLL de {nombre} está en uso. Detenga PHP {rama} y vuelva a intentarlo.',
      'php.extension_sin_dll':
        'No se pudo cambiar la DLL de {nombre} y la carpeta ext de PHP {rama} quedó sin ella. Detenga PHP {rama} y vuelva a intentarlo: la anterior vuelve a su lugar al arrancar.',
      'php.sitio_sin_php': 'Ese sitio no usa PHP.',
      'php.sitio_no_arranco':
        'El PHP propio de {sitio} no respondió con el cambio; se volvió a lo anterior.',
      'php.sin_puertos_sitio': 'No quedan puertos libres para los PHP propios de los sitios.',
      'xdebug.launch_invalido':
        'El .vscode/launch.json del proyecto no se puede interpretar; no se cambió nada.',
      'xdebug.launch_no_seguro':
        'La carpeta .vscode o su launch.json son un enlace u otra cosa: no se escribe ahí.',
      'xdebug.sin_configurar': 'Configure Xdebug en el sitio antes de generar el launch.json.',
      'nginx.sitio_no_existe': 'Ese sitio ya no existe.',
      'nginx.texto_invalido':
        'El texto del vhost es demasiado largo, está vacío o tiene caracteres de control.',
      'nginx.sintaxis': 'Línea {linea}: {detalle}. No se cambió nada.',
      'nginx.directiva_prohibida':
        'Línea {linea}: «{directiva}» no se permite en el vhost de un sitio (podría afectar a otros sitios o a archivos fuera del proyecto). No se cambió nada.',
      'nginx.ruta_fuera':
        'Línea {linea}: «{directiva}» apunta fuera de la carpeta del proyecto o de sus registros y certificados. No se cambió nada.',
      'nginx.fuera_de_server':
        'Línea {linea}: el vhost completo solo puede tener bloques «server»; «{directiva}» queda fuera. No se cambió nada.',
      'nginx.dominio_ajeno':
        'Línea {linea}: «{nombre}» no es un dominio de este sitio. Agréguelo como alias del sitio primero.',
      'nginx.puerto_ajeno':
        'Línea {linea}: el sitio solo puede escuchar en los puertos de Nginx configurados en Ajustes.',
      'nginx.version_no_existe': 'Esa versión del vhost ya no está en el historial.',
      'nginx.argumento_invalido': 'Argumento no válido: {campo}',
      'nginx.destino_interno':
        'Línea {linea}: «{directiva}» apunta a un servicio interno de WolfCore Dev (Adminer, Mailpit, bases de datos, PHP de otros sitios…) y lo expondría en la red y en los túneles. No se cambió nada.',
      'nginx.caido_tras_restaurar':
        'Nginx no volvió a responder: se restauró el vhost anterior, pero sigue sin responder. Revise Servicios y el registro de Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'El puerto {puerto} ya está en uso: la captura de dumps no puede escuchar. Cierre el programa que lo usa (p. ej. un server:dump de Symfony).',
      'depuracion.no_iniciado': 'La captura de dumps está apagada.',
      'depuracion.tipo_no_soportado': 'La captura de dumps es para sitios PHP y FastAPI.',
      'depuracion.confirmacion': 'Confirme la captura de dumps en el diálogo.',
      'depuracion.argumento_invalido': 'Argumento no válido: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Ese archivo no está dentro de la carpeta del sitio: no se abre en el editor.',
      'contenedores.motor_invalido': 'Motor de contenedores desconocido.',
      'contenedores.id_invalido': 'El id del contenedor no es válido.',
      'contenedores.argumento_invalido': 'Argumento no válido: {campo}',
      'contenedores.sin_motor': '{motor} no está instalado en este equipo.',
      'contenedores.no_responde':
        '{motor} no responde. Abra Docker Desktop o inicie la máquina de Podman y vuelva a intentarlo.',
      'contenedores.remoto':
        'La conexión predeterminada de {motor} apunta a otro equipo: WolfCore Dev solo usa motores locales.',
      'contenedores.no_existe': 'El contenedor ya no existe. Refresque la lista.',
      'contenedores.accion_fallo': 'El motor no pudo hacerlo: {detalle}',
      'contenedores.demasiados_registros':
        'Se pueden seguir como mucho {maximo} registros de contenedores a la vez.',
      'contenedores.sin_confirmar': 'Confirme la acción en el diálogo.',
      'catalogo.indice_invalido':
        'El índice de versiones de {servicio} no pasó la validación; se usa la lista guardada.',
      'catalogo.sin_huella':
        '{servicio} {version} no tiene huella publicada: confirme la instalación en el diálogo.',
      'catalogo.huella_debil':
        '{servicio} {version} solo tiene una huella débil (MD5 o SHA-1): confirme la instalación en el diálogo.',
      'catalogo.huella_no_coincide': 'La descarga no coincide con la huella publicada.',
      'catalogo.paquete_invalido':
        'El paquete descargado no es seguro (rutas fuera de la carpeta, enlaces o tamaño excesivo).',
      'catalogo.extraccion_fallo': 'No se pudo leer o extraer el paquete .7z descargado.',
      'runtimes.falta_runtime':
        'No hay {nombre} instalado para este proyecto: instálelo desde Servicios.',
      'runtimes.falta_jdk':
        'No hay un JDK instalado para este proyecto: instale Java desde Servicios.',
      'runtimes.instalacion_incompleta':
        'La instalación de {nombre} está incompleta: reinstálela desde Servicios.',
      'procesos.escucha_publica':
        'El proceso escucha en {direccion}:{puerto}, abierto a la red. Se detuvo: debe escuchar solo en 127.0.0.1.',
      'catalogo.redireccion_ajena': 'La descarga intentó ir a un sitio no permitido ({host}).',
      'catalogo.demasiadas_redirecciones':
        'La descarga hizo demasiadas redirecciones (más de {maximo}).',
      'catalogo.respuesta_grande': 'La respuesta del servidor es demasiado grande.',
      'catalogo.version_no_encontrada':
        'La versión {version} de {servicio} no está en el catálogo.',
      'catalogo.huella_no_disponible':
        'No se pudo obtener la huella de {servicio} {version} (sin conexión o la fuente no respondió). Vuelva a intentarlo.',
      'catalogo.firma_invalida':
        'La firma PGP de {servicio} {version} no es válida o no está publicada: no se instaló nada.',
      'catalogo.firma_no_soportada':
        'La firma PGP de {servicio} {version} usa un formato que WolfCore Dev no verifica: no se instaló nada.',
      'catalogo.clave_desconocida':
        'La firma de {servicio} {version} es de una clave que no está en las claves fijadas de la app: no se instaló nada.',
      'catalogo.firma_vencida':
        'La firma de {servicio} {version} o su clave están vencidas: no se instaló nada. Actualice WolfCore Dev para tener las claves al día.',
      'catalogo.reloj_atrasado':
        'La firma de {servicio} {version} tiene fecha futura: revise la fecha y hora del equipo y vuelva a intentarlo.',
      'acceso_bd.datos_invalidos': 'Los datos de acceso a la base no son válidos.',
      'acceso_bd.sin_base': 'El .env de este proyecto no apunta a una base de datos.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin solo abre bases de MySQL y MariaDB; use Adminer para PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'La base de este proyecto no es de un servidor local de WolfCore Dev.',
      'acceso_bd.no_listo':
        'La herramienta no está lista: instálela desde Servicios y encienda PHP.',
      'auditoria.tabla_invalida': 'La tabla no existe en esa base.',
      'auditoria.columna_invalida':
        'La columna no existe en esa tabla (y la del usuario y la del hash deben ser distintas).',
      'auditoria.usuario_no_encontrado': 'No hay ninguna cuenta con ese usuario.',
      'auditoria.usuario_repetido':
        'Hay más de una cuenta con ese usuario: no se restablece, para no tocar la que no es.',
      'auditoria.formato_no_soportado':
        'El formato del hash actual no se puede reproducir: no se restablece.',
      'auditoria.clave_larga':
        'bcrypt solo usa los primeros 72 bytes de la contraseña: elija una más corta.',
      'auditoria.clave_invalida': 'La contraseña nueva no es válida.',
      'auditoria.sin_confirmar': 'Confirme que quiere restablecer esta contraseña.',
      'auditoria.respaldo_previo_fallo':
        'No se pudo guardar una copia de la base antes de restablecer: no se cambió nada.',
      'auditoria.copia_fallo': 'No se pudo guardar la copia de la fila: no se cambió nada.',
      'auditoria.motor_no_soportado':
        'La auditoría de contraseñas es para MySQL, MariaDB y PostgreSQL.',
      'auditoria.cancelada': 'Auditoría cancelada.',
      'auditoria.usuario_invalido': 'El usuario debe tener entre 1 y 256 caracteres.',
      'auditoria.en_curso': 'Ya hay una auditoría en curso: espere a que termine o cancélela.',
      'auditoria.base_sistema': 'No se audita una base del sistema: elija la base de un proyecto.',
      'auditoria.esquema_invalido': 'El esquema no existe en esa base.',
      'auditoria.fila_cambio':
        'La cuenta cambió mientras tanto: no se restableció. Vuelva a intentarlo.',
      'auditoria.verificacion_fallo':
        'La base no guardó la contraseña tal como se esperaba: se deshizo el cambio.',
      'auditoria.columna_corta':
        'La columna del hash admite {largo} caracteres y el hash nuevo necesita {necesario}: no se cambió nada. Amplíe la columna.',
      'auditoria.datos_reales_sin_confirmar':
        'Esta base tiene datos reales de clientes: restablecer una contraseña exige la confirmación reforzada.',
      'instantaneas.id_invalido': 'La instantánea no es válida.',
      'instantaneas.no_encontrada': 'No se encontró la instantánea; puede que ya se haya borrado.',
      'instantaneas.otra_base': 'Esta instantánea es de otra base: no se puede aplicar a esta.',
      'instantaneas.sin_confirmar': 'Confirme que quiere volver a esta instantánea.',
      'instantaneas.motor_no_soportado': 'Las instantáneas son para MySQL, MariaDB y PostgreSQL.',
      'instantaneas.demasiado_grande':
        'La base pesa más de {maximo} MB, el máximo que guarda una instantánea.',
      'instantaneas.sin_espacio':
        'No hay espacio libre suficiente para la instantánea: hacen falta {necesarios} MB y hay {libres} MB.',
      'instantaneas.limite':
        'Ya hay {maximo} instantáneas de esta base: borre alguna para tomar otra.',
      'instantaneas.tomar_fallo': 'No se pudo tomar la instantánea. La base no se tocó.',
      'instantaneas.huella_no_coincide':
        'El archivo de la instantánea cambió o está dañado: no se restauró nada.',
      'instantaneas.respaldo_previo_fallo':
        'No se pudo guardar el estado actual de la base: no se restauró nada.',
      'instantaneas.restauracion_fallo':
        'No se pudo restaurar la instantánea. La base volvió a como estaba antes. Motivo: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'No se pudo restaurar la instantánea y no se había guardado el estado anterior: la base puede haber quedado vacía o a medias. Motivo: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'No se pudo restaurar la instantánea ni volver al estado anterior. Ese estado está guardado en la instantánea automática {respaldo}: vuelva a ella desde Instantáneas.',
    },
  },
  instantaneas: {
    abrir: 'Instantáneas',
    titulo: (base: string) => `Instantáneas de ${base}`,
    ayuda:
      'Una instantánea guarda la base tal como está ahora. Puede volver a ella cuando quiera: antes de volver se guarda sola una instantánea del estado actual.',
    ubicacion:
      'Se guardan en la carpeta de datos de WolfCore Dev, legibles solo por su usuario. Los servicios y sus datos no se tocan.',
    notaEtiqueta: 'Nota (opcional)',
    notaMarcador: 'Por ejemplo: antes de migrar',
    tomar: 'Tomar instantánea',
    tomada: 'Instantánea guardada',
    cargando: 'Leyendo instantáneas…',
    vacio: 'Todavía no hay instantáneas de esta base.',
    automatica: 'Automática',
    sinNota: 'Sin nota',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'tabla' : 'tablas'} · ${tamano}`,
    volver: 'Volver a esta instantánea',
    borrar: 'Borrar',
    borrada: 'Instantánea movida a la papelera',
    papelera:
      'Las instantáneas borradas se pueden recuperar durante 7 días desde la papelera de WolfCore Dev.',
    cerrar: 'Cerrar',
    papeleraTitulo: 'Papelera',
    papeleraVacia: 'No hay instantáneas en la papelera.',
    recuperar: 'Recuperar',
    recuperada: 'Instantánea recuperada',
    borradaEl: (fecha: string) => `Borrada el ${fecha}`,
    borrarPregunta: '¿Mover esta instantánea a la papelera?',
    borrarSi: 'Mover a la papelera',
    notaAutomatica: (fecha: string) =>
      `Estado anterior, guardado antes de volver a la instantánea del ${fecha}`,
    notaAutomaticaSinOrigen: 'Estado anterior, guardado antes de volver a otra instantánea',
    extensionesAviso: (lista: string) =>
      `Trae extensiones de PostgreSQL (${lista}) que solo se restauran con el registro de huellas de este equipo.`,
    limites:
      'En MySQL y MariaDB se guardan también las rutinas, los disparadores y los eventos. En PostgreSQL es un volcado comprimido de una sola base: no incluye los roles ni los usuarios del servidor. Una instantánea que no se pueda comprobar como propia de este equipo se restaura con un usuario limitado a la base, que no admite vistas, rutinas ni disparadores de otros usuarios.',
    basesBorradas: 'Instantáneas de bases que ya no existen',
    basesBorradasAyuda: 'Elija una base para volver a crearla desde su instantánea.',
    dialogoVolver: {
      titulo: (base: string) => `Volver a una instantánea de ${base}`,
      cargando: 'Preparando la vista previa…',
      base: 'Base',
      instantanea: 'Instantánea',
      ahora: 'Ahora',
      tamano: 'Tamaño',
      tablas: 'Tablas',
      nota: 'Nota',
      aviso: (base: string) =>
        `La base ${base} se reemplazará por completo por esta instantánea: lo que cambió desde entonces se pierde de la base. Antes se guarda una instantánea automática del estado actual; si algo falla, la base vuelve sola a ese estado.`,
      pedir: (base: string) => `Para confirmar, escriba ${base}`,
      confirmar: 'Volver a esta instantánea',
      trabajando: (base: string) => `Restaurando ${base}… No cierre el programa hasta que termine.`,
      hecho: (base: string) => `La base ${base} volvió a la instantánea`,
      respaldoPrevio: 'El estado anterior quedó guardado en la instantánea automática del',
      advertencias: 'La restauración terminó con avisos:',
      hechoConAvisos: (base: string) => `La base ${base} volvió a la instantánea, con avisos`,
      baseVacia: 'La base no existe o está vacía: no hay nada que guardar antes de volver.',
      sinGuardarTitulo: 'No se pudo guardar el estado actual',
      sinGuardarTexto:
        'WolfCore Dev no pudo guardar el estado actual de la base antes de volver. Si continúa SIN guardarlo y la restauración falla, los datos actuales de la base se pierden.',
      sinGuardarConfirmar: 'Entiendo que se perderán los datos actuales de la base',
      sinGuardarBoton: 'Volver sin guardar el estado actual',
    },
  },
  avisoInicio: {
    titulo: 'Aviso de WolfCore Dev',
  },
  tareas: {
    titulo: 'Tareas programadas',
    resumen: (n: number) => (n === 0 ? 'Sin tareas' : n === 1 ? '1 tarea' : `${n} tareas`),
    mostrar: 'Ver tareas',
    ocultar: 'Ocultar',
    cargando: 'Cargando las tareas',
    errorCargar: 'No se pudieron cargar las tareas',
    soloAbierta:
      'Las tareas solo corren mientras WolfCore Dev está abierto. No usan el Programador de tareas de Windows: con la aplicación cerrada o el equipo en reposo no se ejecutan, y una ejecución que se pierde no se recupera.',
    repoEjecuta:
      'En un proyecto de confianza, lo que está dentro del repositorio se ejecuta tal cual: el archivo que nombra la tarea, `artisan`, los scripts de `package.json`, `.venv`… Si cambian al hacer `git pull`, la tarea ejecutará la versión nueva.',
    vacio:
      'Este proyecto no tiene tareas programadas. Cree una (por ejemplo «php artisan schedule:run» cada minuto en un Laravel).',
    nueva: 'Nueva tarea',
    pausada: 'pausada',
    enCurso: 'Ejecutándose…',
    nunca: 'Aún no se ejecutó',
    ultima: (f: string) => `Última: ${f}`,
    proxima: (f: string) => `próxima: ${f}`,
    codigo: (n: number) => `código ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'escrita aquí', 'wolfcore.yml': 'de wolfcore.yml' },
    describir: {
      cadaMinuto: 'Cada minuto',
      cadaN: (n: number) => `Cada ${n} minutos`,
      cadaHora: 'Cada hora, en punto',
      diaria: (h: string) => `Todos los días a las ${h}`,
      laborables: (h: string) => `De lunes a viernes a las ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Correcta',
      fallo: 'Falló',
      tiempo: 'Superó el tiempo máximo',
      cancelada: 'Cancelada',
      omitida: 'Omitida',
      bloqueada: 'No se ejecutó',
    },
    motivo: {
      aislado:
        'Es una carpeta de datos de prueba (WOLFCORE_DATOS): no corre hasta que permita las tareas en esta sesión.',
      no_confiado:
        'El proyecto no está marcado como de confianza: marque «Confío en este repositorio» para que corra.',
      receta_cambio:
        'La receta del proyecto cambió desde que confió en él: revísela y vuelva a marcar «Confío en este repositorio».',
      sin_confirmar: 'Falta confirmar su comando: no se ejecuta hasta que lo revise y lo confirme.',
      comando_invalido: 'Su comando no está permitido (solo php, node, npm run y python).',
      cron_invalida: 'Su horario no es una expresión cron válida.',
      carpeta: 'La carpeta del proyecto no existe.',
      solapada: 'La anterior seguía en ejecución: se saltó esta.',
      retraso: 'Llegó tarde (la aplicación estaba suspendida): no se recupera.',
      error: 'No se pudo ejecutar el programa.',
    },
    acciones: {
      ejecutar: 'Ejecutar ahora',
      editar: 'Editar',
      borrar: 'Borrar',
      verRegistro: 'Ver registro',
      revisarConfirmar: 'Revisar y confirmar',
      activar: (n: string) => `Activar la tarea ${n}`,
    },
    borrar: {
      titulo: (n: string) => `¿Borrar «${n}»?`,
      texto:
        'Se quita la tarea y su historial. Lo que ya ejecutó no se deshace y los archivos del proyecto no se tocan.',
      confirmar: 'Borrar',
      hecho: (n: string) => `Tarea «${n}» borrada.`,
    },
    aislado: {
      titulo: 'Carpeta de datos de prueba.',
      texto:
        'Con WOLFCORE_DATOS ninguna tarea corre sola. Permítalas solo si quiere probarlas en esta sesión.',
      permitir: 'Permitir en esta sesión',
      confirmarTitulo: '¿Permitir las tareas en esta carpeta de prueba?',
      confirmarTexto:
        'Las tareas activas de los proyectos de confianza empezarán a ejecutarse hasta que cierre la aplicación. Los comandos son los de cada proyecto y corren en su carpeta real.',
      permitido: 'Tareas permitidas en esta sesión.',
    },
    yml: {
      titulo: 'Propuestas de wolfcore.yml',
      texto:
        'El archivo del proyecto propone estas tareas. Nada corre por estar escrito ahí: revise el comando y confírmelo para adoptarla.',
      estado: { nueva: 'Nueva', adoptada: 'Adoptada', cambiada: 'Cambió' },
      revisar: 'Revisar y adoptar',
      cambiada:
        'El comando de wolfcore.yml cambió desde que la adoptó. La tarea del proyecto sigue con el comando que confirmó; adopte la versión nueva si la reconoce.',
      guardarEn: 'Guardar en wolfcore.yml',
      escribirTitulo: '¿Escribir la tarea en wolfcore.yml?',
      escribirTexto:
        'Se agrega o actualiza la tarea en el archivo del proyecto (sin tocar el resto) para que viaje con el repositorio. Quien la clone deberá confirmarla en su equipo.',
      escribir: 'Escribir',
      escrita: 'Tarea guardada en wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Registro de «${n}»`,
      historial: 'Últimas ejecuciones',
      sinHistorial: 'Aún no hay ejecuciones.',
      salida: 'Salida de la última ejecución',
      sinSalida: 'Sin salida guardada.',
      enmascarado:
        'Los registros ocultan contraseñas y claves, tienen un tamaño máximo y rotan solos.',
      origen: { programada: 'programada', manual: 'a mano' },
    },
    dialogo: {
      tituloNueva: 'Nueva tarea programada',
      tituloEditar: 'Editar tarea programada',
      tituloAdoptar: 'Adoptar la tarea de wolfcore.yml',
      tituloConfirmar: 'Confirmar el comando de la tarea',
      nombre: 'Nombre',
      nombrePlaceholder: 'Tareas de Laravel',
      horario: 'Cuándo',
      preset: {
        cadaMinuto: 'Cada minuto',
        cadaN: 'Cada varios minutos',
        cadaHora: 'Cada hora',
        diaria: 'Todos los días a una hora',
        laborables: 'De lunes a viernes a una hora',
        personalizada: 'Expresión cron propia',
      },
      cadaNOpcion: (n: number) => `Cada ${n} minutos`,
      hora: 'Hora',
      horaPlaceholder: '03:00',
      horaInvalida: 'Escriba una hora válida, por ejemplo 03:00.',
      expresion: 'Expresión cron',
      cronEquivale: 'Expresión cron:',
      expresionAyuda:
        '5 campos: minuto, hora, día del mes, mes y día de la semana (* , - /). Mínimo, una vez por minuto.',
      proximas: 'Próximas ejecuciones:',
      comando: 'Comando',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Solo php, node, npm run y python, con un archivo del proyecto. Corre en la carpeta del proyecto, sin shell y sin código en la línea (-r, -e, -c).',
      comandoFijo:
        'Este comando tiene argumentos con comillas que no se pueden escribir como texto: se conserva tal cual y no se edita aquí (bórrela y cree otra si necesita cambiarlo).',
      argumentos: 'Se ejecutará con estos argumentos:',
      comillasSinCerrar: 'Falta cerrar unas comillas.',
      tiempo: 'Tiempo máximo',
      minutos: 'minutos',
      tiempoAyuda: 'Si tarda más, se detiene sola (solo ese proceso y lo que lanzó).',
      activa: 'Activa (corre sola mientras la aplicación esté abierta)',
      advertencia:
        'Al aceptar autoriza este comando exacto: se ejecutará solo, en la carpeta de este proyecto, cada vez que toque. Si lo cambia, deberá confirmarlo de nuevo.',
      revise: 'Revisé este comando y lo reconozco.',
      guardar: 'Guardar y confirmar el comando',
      adoptar: 'Confirmar y adoptar',
      confirmar: 'Confirmar el comando',
      guardada: 'Tarea guardada.',
      adoptada: 'Tarea adoptada.',
      confirmada: 'Comando confirmado.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Conjuntos con nombre de bases de datos, servicios y procesos que se encienden y se apagan juntos.',
    nuevo: 'Nuevo workspace',
    vacio:
      'Todavía no hay workspaces. Cree uno, por ejemplo «Bot FastAPI» con PostgreSQL, Redis, Ollama y el proceso de su proyecto.',
    elementos: (n: number) => (n === 1 ? '1 elemento' : `${n} elementos`),
    sinElementos: 'Sin elementos',
    estado: { apagado: 'Apagado', parcial: 'En parte', encendido: 'Encendido' },
    acciones: {
      iniciar: 'Encender',
      detener: 'Apagar',
      editar: 'Editar',
      borrar: 'Borrar',
      cerrar: 'Cerrar',
    },
    borrar: {
      titulo: (n: string) => `¿Borrar «${n}»?`,
      texto:
        'Borrar el workspace no apaga ni borra nada: solo quita el conjunto. Lo que está encendido sigue encendido.',
      confirmar: 'Borrar',
      hecho: (n: string) => `Workspace «${n}» borrado.`,
    },
    dialogo: {
      tituloNuevo: 'Nuevo workspace',
      tituloEditar: 'Editar workspace',
      nombre: 'Nombre',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Escriba un nombre.',
      aviso:
        'Un workspace solo guarda qué encender. No abre túneles, no comparte en la red local y no enciende los procesos de un proyecto en el que no confía.',
      secciones: {
        instancias: 'Bases de datos',
        servicios: 'Servicios',
        procesos: 'Procesos de proyectos',
      },
      sinOpciones: 'No hay nada para elegir aquí.',
      captadorUnico: 'Solo un captador de correo a la vez: elegir otro reemplaza al anterior.',
      yaNoExisten: (lista: string) => `Ya no existen y se quitarán al guardar: ${lista}`,
      guardar: 'Guardar',
      guardado: (n: string) => `Workspace «${n}» guardado.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: así quedó al encender`,
      tituloDetener: (n: string) => `«${n}»: así quedó al apagar`,
      encendido: 'Encendido',
      apagado: 'Apagado',
      yaEncendido: 'Ya estaba encendido',
      yaApagado: 'Ya estaba apagado',
      noExiste: 'Ya no existe: se ignoró',
      compartido: 'Sigue encendido: lo usa otro workspace encendido',
      reemplaza: (otro: string) => `Encendido; apagó ${otro}, del mismo grupo de correo`,
      fallo: 'No quedó encendido',
      falloApagar: 'Sigue encendido',
      ok: (n: string) => `«${n}» listo.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: quedaron encendidos ${encendidos} de ${total}. Revise lo que no arrancó.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} siguen encendidos. Revise lo que no se apagó.`,
    },
  },
  inicio: {
    titulo: 'Inicio',
    bienvenida: 'Su entorno de desarrollo, de un vistazo.',
    tiles: {
      servicios: 'Servicios encendidos',
      serviciosDe: (total: number) => `de ${total}`,
      sitios: 'Proyectos',
      tuneles: 'Túneles activos',
      hosts: 'Hosts pendientes',
      hostsOk: 'Todo en orden',
      hostsFaltan: 'Requiere atención',
    },
    hosts: {
      titulo: 'Hay dominios sin registrar en el archivo hosts',
      texto:
        'Estos dominios todavía no apuntan a su equipo. Al corregirlo, Windows pedirá permiso de administrador.',
      corregir: 'Aplicar hosts pendientes',
      reintentarPermiso: 'Reintentar con permiso',
      corregido: 'Archivo hosts actualizado',
      fallo: 'No se pudo actualizar el archivo hosts',
      verInstrucciones: 'Ver instrucciones',
      duplicados:
        'Estos dominios ya están en hosts fuera del bloque de WolfCore Dev (se conservan):',
      motivos: {
        cancelado: 'Se canceló el permiso de administrador. El archivo hosts quedó igual.',
        tiempo:
          'Nadie respondió el permiso de administrador a tiempo. El sitio se guardó; el archivo hosts quedó igual. Si aún ve el aviso de Windows, cancélelo (ya no hará nada). Aplique los pendientes cuando pueda (un solo permiso para todos).',
        denegado:
          'Windows no permitió escribir el archivo hosts. Es posible que un antivirus lo bloquee.',
      } as Record<string, string>,
      modalTitulo: 'Corregir hosts manualmente',
      modalTexto:
        'Abra PowerShell como administrador (clic derecho en Inicio → Terminal (administrador)), pegue este comando y presione Enter.',
    },
    servicios: {
      titulo: 'Servicios',
      ver: 'Ver servicios',
      irA: (nombre: string) => `Ir al servicio ${nombre}`,
      vacio: 'Todavía no hay servicios instalados.',
    },
    tuneles: {
      titulo: 'Túneles activos',
      vacio: 'No hay túneles abiertos. Puede abrir uno desde Proyectos.',
      sitioDesconocido: 'Sitio sin nombre',
      irA: (nombre: string) => `Ir al proyecto ${nombre}`,
    },
  },
  servicios: {
    titulo: 'Servicios',
    descripcion:
      'Encienda y apague el servidor web, PHP, las bases de datos y las herramientas. El estado se actualiza solo.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Bases de datos',
      correo: 'Correo',
      ia: 'IA',
      herramientas: 'Herramientas',
    },
    gruposAyuda: {
      web: 'Servidor que atiende los dominios .test.',
      php: 'Una instalación por versión (8.3, 8.4…); cada sitio usa la suya.',
      bd: 'Escuchan solo en 127.0.0.1.',
      correo: 'Atrapa los correos que envían sus proyectos, sin que salgan a internet.',
      ia: 'Modelos de lenguaje en su equipo.',
      herramientas: 'Utilidades para el día a día.',
    },
    puerto: 'Puerto',
    cambiarPuerto: 'Cambiar puerto',
    cambiarPuertoDe: (nombre: string) => `Cambiar el puerto de ${nombre}`,
    versionesDe: (nombre: string) => `Versiones de ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instancias, ${encendidas} encendidas`,
    usarPuerto: (p: number) => `Usar puerto ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} ahora usa el puerto ${p}`,
    conflicto: 'Puerto ocupado',
    autoIniciar: 'Encender al iniciar WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} se encenderá al iniciar WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} ya no se encenderá al iniciar WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Puerto de ${nombre}`,
      etiqueta: 'Puerto nuevo',
      ayuda:
        'Entre 1024 y 65535 y libre. Si el servicio está encendido, se reinicia. Actualice el .env de sus proyectos.',
      rango: 'Use un número entre 1024 y 65535',
      igual: 'Es el puerto actual',
      guardar: 'Cambiar puerto',
    },
    borrarDatos: {
      opcion: 'Borrar datos',
      titulo: (nombre: string) => `Borrar los datos de ${nombre}`,
      copias: (n: number, tam: string) =>
        `También se borrarán ${n === 1 ? 'una copia' : `${n} copias`} de las actualizaciones (${tam}). Si quiere conservarlas, cópielas antes desde la carpeta de datos.`,
      /** Qué se pierde, según el servicio. */
      que: {
        mysql: 'todas las bases y usuarios de MySQL',
        mariadb: 'todas las bases y usuarios de MariaDB',
        postgresql: 'todas las bases y usuarios de PostgreSQL',
        redis: 'todas las claves y datos guardados en Redis',
        mongodb: 'todas las bases, colecciones y datos de MongoDB',
        mailpit: 'todos los correos atrapados por Mailpit',
        smtp4dev: 'todos los correos atrapados por smtp4dev',
        inbucket: 'todos los correos atrapados por Inbucket',
        papercut: 'todos los correos atrapados por Papercut SMTP',
        ollama: 'todos los modelos descargados de Ollama',
        meilisearch: 'todos los índices de Meilisearch',
      } as Record<string, string>,
      texto: (que: string) =>
        `Se borran ${que}. No se puede deshacer. El programa sigue instalado.`,
      generico: (nombre: string) => `todos los datos de ${nombre}`,
      pedir: (id: string) => `Para confirmar, escriba ${id}`,
      boton: 'Borrar datos',
      hecho: (nombre: string) => `Datos de ${nombre} borrados`,
    },
    ftp: {
      interruptor: 'Servidor FTP',
      redLocal: 'Permitir conexiones de la red local',
      redLocalAyuda:
        'Apagado, solo este equipo puede conectarse (127.0.0.1). Cada sitio activa su acceso en Sitios.',
      avisoTitulo: 'Abrir el FTP a la red local',
      avisoTexto:
        'El FTP envía usuarios, claves y archivos sin cifrar. Cualquier equipo de su red podrá intentar conectarse. Úselo solo en una red de confianza.',
      avisoConfirmar: 'Permitir',
      redLocalActivada: 'El FTP acepta conexiones de la red local',
      redLocalDesactivada: 'El FTP solo acepta conexiones de este equipo',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Gestor de dependencias de PHP',
      instalado: 'Instalado',
      noInstalado: 'No instalado',
      sinVersion: 'sin instalar',
      uso: 'Uso',
      usoTexto: 'composer',
      ayuda: 'Use «Terminal» en un proyecto, o agregue WolfCore Dev al PATH en Ajustes.',
      instaladoOk: 'Composer instalado',
      sinPhp: 'Instale PHP primero',
      actualizado: (v: string) => `Composer actualizado: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Administrador web de bases de datos',
      direccion: 'Dirección',
      disponible: 'Listo',
      noInstalado: 'No instalado',
      sinPhp: 'Falta PHP',
      abrir: 'Abrir Adminer',
      instaladoOk: 'Adminer instalado',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Administrador web de MySQL y MariaDB',
      direccion: 'Dirección',
      disponible: 'Listo',
      noInstalado: 'No instalado',
      sinPhp: 'Falta PHP',
      abrirDesdeProyecto: 'Se abre desde la tarjeta de cada proyecto, ya autenticado.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} no tiene activa la extensión ${ext}. Reinicie PHP o actívela en su php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin declara soporte hasta PHP 8.3 y se está usando PHP ${rama}: puede mostrar errores. Encienda una versión de PHP 7.2 a 8.3 si algo falla.`,
      instalarPrimero: 'Instale phpMyAdmin para usarlo.',
      encenderPhp: 'Encienda PHP para usar phpMyAdmin.',
      instaladoOk: 'phpMyAdmin instalado',
    },
    puertos: 'Puertos',
    pid: 'PID',
    sinVersion: 'sin versión',
    datosConexion: 'Datos de conexión',
    sinPuertos: '—',
    terminado: 'Terminó sin errores',
    externo: 'Administrado fuera de WolfCore Dev',
    verDetalle: 'Ver detalle del error',
    vacioTitulo: 'Aún no hay servicios',
    vacio:
      'Todavía no hay servicios instalados. Empiece por Nginx y PHP para sus sitios, o por una base de datos.',
    irAInstalar: 'Ir a instalar',
  },
  bd: {
    descripcion:
      'Cree, respalde y restaure las bases de sus proyectos. Los servidores escuchan solo en 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Nueva base',
    restaurar: 'Restaurar respaldo',
    importar: 'Importar desde otro servidor',
    soloSql: 'Disponible en MySQL, MariaDB y PostgreSQL',
    enCursoAyuda: 'Espere a que termine la operación en curso',
    encenderPrimero: (motor: string) => `Encienda ${motor} primero`,
    cargando: 'Cargando bases…',
    recargar: 'Volver a cargar la lista',
    vacioTitulo: 'No hay ningún servidor de bases de datos instalado',
    vacio:
      'Instale MySQL, MariaDB, PostgreSQL o MongoDB desde Servicios para administrar sus bases.',
    irAServicios: 'Ir a Servicios',
    apagado: {
      titulo: (motor: string) => `${motor} está apagado`,
      texto: (motor: string) => `Encienda ${motor} para ver y administrar sus bases.`,
      iniciando: (motor: string) => `${motor} se está encendiendo…`,
      error: (motor: string) => `${motor} no pudo encender`,
      encender: (motor: string) => `Encender ${motor}`,
      verServicios: 'Ver en Servicios',
    },
    errorLista: 'No se pudo leer la lista de bases',
    sinBases: 'Este servidor todavía no tiene bases propias.',
    total: (n: number) => plural(n, 'base', 'bases'),
    columnas: { nombre: 'Base', tamano: 'Tamaño', acciones: 'Acciones' },
    acciones: {
      respaldar: 'Respaldar',
      restaurarAqui: 'Restaurar aquí',
      adminer: 'Abrir en Adminer',
      conexion: 'Datos de conexión',
      vector: 'Activar vector',
      borrar: 'Borrar',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Instale Adminer y PHP en Servicios para abrirlo',
    vectorSinInstalar: 'Instale pgvector más abajo para activarlo en una base',
    vectorActivado: (base: string) => `Vector activado en ${base}`,
    formatos: {
      sql: 'SQL plano',
      pgdump: 'Respaldo de PostgreSQL (pg_dump, formato personalizado)',
      gz: 'SQL comprimido (.gz)',
      zip: 'Archivo .zip (se descomprime antes de restaurar)',
      rar: 'Archivo .rar (se intenta descomprimir con Windows)',
      '7z': 'Archivo .7z (se intenta descomprimir con Windows)',
      desconocido: 'Formato no reconocido',
    } as Record<string, string>,
    formatoDesconocido:
      'No se reconoce el formato. Si es un archivo comprimido, descomprímalo y elija el .sql o .dump que contiene.',
    formatoIncompatible:
      'Este archivo es un respaldo de PostgreSQL: restáurelo en la pestaña PostgreSQL.',
    nombre: {
      etiqueta: 'Nombre de la base',
      vacio: 'Escriba un nombre',
      largo: 'El nombre es demasiado largo',
      caracteres: {
        mysql: 'Use solo letras, números y guion bajo',
        mariadb: 'Use solo letras, números y guion bajo',
        postgresql: 'Use minúsculas, números y guion bajo',
        mongodb: 'Use solo letras, números, guion y guion bajo',
      } as Record<string, string>,
      inicio: 'En PostgreSQL el nombre no puede empezar por un número',
    },
    reemplazo: {
      titulo: (base: string) => `La base ${base} ya tiene tablas`,
      texto: (base: string) =>
        `Si continúa, la base ${base} actual se REEMPLAZARÁ por completo. Primero se guarda una copia de seguridad automática; después se borra la base y se vuelve a crear con el contenido nuevo.`,
      donde: 'La copia de seguridad se guarda en',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'Si no quiere reemplazarla, vuelva atrás y elija otro nombre: se creará una base nueva.',
      pedir: (base: string) => `Para confirmar, escriba ${base}`,
      volver: 'Volver',
      confirmar: 'Reemplazar la base',
    },
    resultado: {
      restaurada: (base: string) => `Base ${base} restaurada`,
      importada: (base: string) => `Base ${base} importada`,
      respaldada: (base: string) => `Respaldo de ${base} guardado`,
      archivo: 'Archivo',
      respaldoPrevio: 'Copia de seguridad de la base anterior',
      advertencias: (n: number) => plural(n, 'advertencia', 'advertencias'),
      advertenciasAyuda:
        'La operación terminó. Revise estos avisos; normalmente son roles o permisos que no existen en este equipo.',
      fallo: {
        restaurar: 'No se pudo restaurar',
        importar: 'No se pudo importar',
        respaldar: 'No se pudo respaldar',
      } as Record<string, string>,
      trasReemplazo: 'La base original se reemplazó y la restauración no terminó',
      trasReemplazoAyuda:
        'Sus datos anteriores están en la copia de seguridad indicada. Puede restaurarla con «Restaurar respaldo».',
    },
    progreso: {
      titulo: 'Registro',
      corriendo: {
        restaurar: (base: string) => `Restaurando ${base}…`,
        importar: (base: string) => `Importando ${base}…`,
        respaldar: (base: string) => `Respaldando ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Esperando la salida de la herramienta…',
      limitado: (n: number) => `Se muestran las últimas ${n} líneas.`,
      noCierre:
        'No cierre el programa hasta que termine. Puede salir de esta pantalla y volver: aquí verá el resultado.',
      otraEnCurso: 'Ya hay una operación en curso; espere a que termine.',
      ver: 'Ver detalle',
      descartar: 'Descartar',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Restaurar respaldo en ${motor}`,
      confianza:
        'Restaure solo respaldos de confianza: un respaldo puede ejecutar acciones en el servidor.',
      archivo: 'Archivo de respaldo',
      elegir: 'Elegir archivo…',
      cambiar: 'Cambiar',
      sinArchivo: 'Ningún archivo elegido',
      formato: 'Formato detectado',
      detectando: 'Detectando formato…',
      destino: 'Base destino',
      destinoAyuda:
        'Si no existe, se crea. Si existe y está vacía, se usa. Si tiene tablas, se le pedirá confirmación.',
      restaurar: 'Restaurar',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Importar a ${motor} desde otro servidor`,
      soloLectura:
        'Solo se lee el servidor de origen: su base se copia a este equipo y el origen no se modifica.',
      detectado: (puerto: number) =>
        `Se detectó otro servidor en el puerto ${puerto} (por ejemplo, el de FlyEnv).`,
      origen: 'Servidor de origen',
      host: 'Servidor',
      puerto: 'Puerto',
      usuario: 'Usuario',
      clave: 'Clave',
      claveAyuda: 'Se usa solo para esta copia y no se guarda.',
      baseOrigen: 'Base de origen',
      destino: 'Base destino en este equipo',
      destinoAyuda:
        'Si no existe, se crea. Si tiene tablas, se le pedirá confirmación antes de reemplazarla.',
      faltaHost: 'Escriba el servidor',
      faltaPuerto: 'Use un puerto entre 1 y 65535',
      faltaUsuario: 'Escriba el usuario',
      faltaBase: 'Escriba la base de origen',
      importar: 'Importar',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Nueva base en ${motor}`,
      codificacion: 'Codificación',
      codificacionValor: {
        mysql: 'utf8mb4 (admite emojis y todos los acentos)',
        mariadb: 'utf8mb4 (admite emojis y todos los acentos)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Crear un usuario propio para esta base',
      usuarioPropioAyuda:
        'Opcional. Si no, sus proyectos usan el usuario administrador del servidor.',
      usuario: 'Usuario',
      clave: 'Clave',
      faltaClave: 'Escriba una clave',
      crear: 'Crear base',
      creada: (base: string) => `Base ${base} creada`,
      mongo: 'En MongoDB la base se crea con una colección inicial (_pel_init).',
      cambiarClave: 'Cambiar la clave',
      cambiarClaveTitulo: (u: string) => `El usuario ${u} ya existe con otra clave`,
      cambiarClaveTexto: (u: string) =>
        `Si cambia la clave de ${u}, los proyectos que ya la usan dejarán de conectar hasta que actualice su .env. Lo normal es usar la clave actual. ¿Cambiarla de todos modos?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `¿Borrar la base ${base}?`,
      texto: (base: string, motor: string) =>
        `Se borran la base ${base} de ${motor} y todos sus datos. No se puede deshacer. Si la necesita, respáldela antes.`,
      pedir: (base: string) => `Para confirmar, escriba ${base}`,
      boton: 'Borrar base',
      hecho: (base: string) => `Base ${base} borrada`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Respaldar ${base}`,
      destino: 'Se guardará en',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (carpeta por defecto)',
      porDefectoEn: (carpeta: string) => `${carpeta} (carpeta por defecto)`,
      cambiar: 'Elegir otra carpeta…',
      porDefectoVolver: 'Usar la carpeta por defecto',
      formato: {
        mysql: 'Archivo .sql (mysqldump con rutinas y disparadores)',
        mariadb: 'Archivo .sql (mysqldump con rutinas y disparadores)',
        postgresql: 'Archivo .dump (pg_dump, formato personalizado)',
      } as Record<string, string>,
      boton: 'Respaldar',
    },
    dialogoConexion: {
      tituloServicio: 'Conexión a Meilisearch',
      notaMeilisearch:
        'Para usarla en un proyecto: Variables (.env) → Agregar un bloque → Meilisearch. Se muestra una vista previa con la clave enmascarada y se pide confirmación. La clave es solo de este equipo.',
      sitio: 'Proyecto',
      sitioAyuda:
        'Se lee el .env del sitio para usar las variables que ya tiene (por ejemplo, CodeIgniter 4). Su contenido no se muestra ni se copia.',
      generico: 'Genérico (formato Laravel)',
      titulo: (base: string) => `Conexión a ${base}`,
      host: 'Servidor',
      puerto: 'Puerto',
      usuario: 'Usuario',
      clave: 'Clave',
      base: 'Base',
      sinClave: 'Sin clave (solo escucha en 127.0.0.1)',
      mostrar: 'Mostrar clave',
      ocultar: 'Ocultar clave',
      copiarDato: (dato: string) => `Copiar ${dato}`,
      env: 'Bloque para el archivo .env',
      envAyuda: 'Péguelo en el .env de su proyecto. WolfCore Dev no escribe en sus proyectos.',
      copiarEnv: 'Copiar bloque',
      cargando: 'Leyendo los datos de conexión…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Ya hay una instalación de pgvector en curso.',
      descripcion:
        'Búsqueda por similitud (embeddings) dentro de PostgreSQL. Se compila desde el código oficial.',
      instalado: (v: string | null) => (v ? `Instalado (versión ${v})` : 'Instalado'),
      noInstalado: 'No instalado',
      herramientas: 'Herramientas de compilación',
      herramientasSi: 'Listas',
      herramientasNo: 'Faltan',
      instalar: 'Instalar pgvector',
      reinstalar: 'Compilar de nuevo',
      instalarHerramientas: 'Instalar herramientas de compilación',
      dialogoHerramientasTitulo: 'Instalar herramientas de compilación',
      dialogoHerramientas:
        'Para compilar pgvector hacen falta las Build Tools de Visual Studio. Se descargarán ~6 GB y Windows pedirá permiso de administrador. Puede tardar bastante; deje WolfCore Dev abierto.',
      dialogoCompilarTitulo: 'Compilar e instalar pgvector',
      dialogoCompilar:
        'Se descarga el código oficial de pgvector, se compila y se instala en su PostgreSQL. PostgreSQL se detiene unos segundos mientras se copia la extensión y vuelve a encenderse.',
      continuar: 'Continuar',
      instalando: 'Instalando las herramientas de compilación…',
      compilando: 'Compilando pgvector…',
      herramientasOk: 'Herramientas de compilación instaladas',
      instaladoOk: (v: string) => `pgvector ${v} instalado`,
      sinWinget:
        'Este equipo no tiene winget. Instale «Build Tools para Visual Studio 2022» desde visualstudio.microsoft.com con la carga «Desarrollo para el escritorio con C++» y vuelva a intentarlo.',
      falloHerramientas: 'No se pudieron instalar las herramientas de compilación',
      activarAyuda: 'Después, use «Activar vector» en cada base que lo necesite.',
      errorEstado: 'No se pudo leer el estado de pgvector',
    },
  },
  instalar: {
    titulo: 'Instalar',
    descripcion:
      'Descargue versiones oficiales. Cada archivo se verifica con su huella SHA-256 antes de usarse.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Servidor web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Túneles públicos (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Base de datos, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Base de datos, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Base de datos (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Caché y colas en memoria (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Base de datos de documentos (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Consola de MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Correo de prueba (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Correo de prueba (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Correo de prueba (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Correo de prueba (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'IA local (ollama.com)' },
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Búsqueda para Laravel Scout (github.com/meilisearch)',
      },
      composer: { nombre: 'Composer', detalle: 'Dependencias de PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Administrador web de bases de datos' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Administrador web de MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web y PHP',
      bd: 'Bases de datos',
      otros: 'Correo, IA y túneles',
    },
    instalados: 'Instalado',
    ninguno: 'Ninguna versión instalada',
    elegir: 'Elija una versión',
    buscando: 'Buscando versiones…',
    sinVersiones: 'No se encontraron versiones',
    rama: (rama: string) => rama,
    yaInstalada: 'ya instalada',
    fases: {
      descargando: 'Descargando',
      verificando: 'Verificando SHA-256',
      extrayendo: 'Extrayendo',
      compilando: 'Compilando',
      listo: 'Instalado',
      error: 'Falló la instalación',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} instalado`,
  },
  sitios: {
    titulo: 'Sitios',
    descripcion: 'Cada sitio es una carpeta servida por Nginx en su propio dominio .test.',
    nuevo: 'Nuevo sitio',
    buscar: 'Buscar por nombre o dominio',
    sinResultados: (q: string) => `Ningún sitio coincide con «${q}».`,
    vacioTitulo: 'Todavía no hay sitios',
    vacio:
      'Elija la carpeta de un proyecto y WolfCore Dev detecta si es Laravel, CodeIgniter o estático.',
    agregar: 'Agregar sitio',
    total: (n: number) => plural(n, 'sitio', 'sitios'),
    abrirSitio: (dominio: string) => `Abrir ${dominio} en el navegador`,
    carpeta: 'Carpeta',
    abrirCarpeta: 'Abrir la carpeta del proyecto',
    alias: (n: number) => `+${plural(n, 'alias', 'alias')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Estático',
      proxy: 'Proxy (puerto local)',
      personalizado: 'Personalizado',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (puerto local)',
      node: 'Node / Vite (puerto local)',
      rails: 'Rails (puerto local)',
      springboot: 'Spring Boot (puerto local)',
      aspnet: 'ASP.NET Core (puerto local)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Estático',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Datos reales',
    datosRealesAyuda: 'Contiene datos reales de clientes: tenga cuidado al publicarlo.',
    faltaHosts: 'Falta en hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} todavía no apunta a este equipo. Corrija el archivo hosts con el aviso de arriba.`,
    estado: {
      enLinea: 'En línea',
      faltaHosts: 'Falta en hosts',
      iniciando: 'Nginx iniciando…',
      errorNginx: 'Error en Nginx',
      nginxExterno: 'Nginx externo',
      nginxApagado: 'Nginx apagado',
    },
    borrar: {
      titulo: (nombre: string) => `¿Borrar el sitio ${nombre}?`,
      texto: 'La carpeta del proyecto no se toca.',
      hecho: (nombre: string) => `Sitio ${nombre} borrado`,
      nginxFallo: 'El sitio se borró, pero Nginx no aceptó la nueva configuración',
    },
  },
  formSitio: {
    tituloNuevo: 'Nuevo sitio',
    tituloEditar: 'Editar sitio',
    tituloDuplicar: 'Duplicar sitio',
    paso: 'Empiece por la carpeta del proyecto',
    pasoAyuda:
      'Se detecta el tipo de proyecto, la versión de PHP y un dominio sugerido. Después puede cambiar todo.',
    elegirCarpeta: 'Elegir carpeta',
    cambiarCarpeta: 'Cambiar',
    detectando: 'Analizando el proyecto…',
    detectado: (tipo: string) => `Detectado: ${tipo}`,
    sinDeteccionAlEditar: 'La detección automática solo se aplica al crear; revise tipo y PHP.',
    nombre: 'Nombre',
    nombreAyuda: 'Solo para reconocerlo en la lista.',
    nombreCopia: (nombre: string) => `${nombre} (copia)`,
    duplicarProxy:
      'La copia apunta al mismo puerto local que el original y no copia sus procesos: cambie el puerto o agregue un proceso propio.',
    dominio: 'Dominio',
    dominioPlaceholder: 'mi-proyecto',
    alias: 'Alias',
    aliasAyuda: 'Otros dominios .test que abren el mismo sitio. Escriba y presione Enter.',
    aliasAgregar: 'Agregar alias',
    carpeta: 'Carpeta del proyecto',
    raizLaravel: 'Nginx servirá la subcarpeta public/.',
    tipo: 'Tipo de proyecto',
    php: 'Versión de PHP',
    phpElegir: 'Elija una versión',
    phpNinguno: 'No hay ninguna versión de PHP instalada.',
    phpInstalar: 'Instalar PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `El proyecto pide PHP ${pedida}, que no está instalado. Se eligió PHP ${elegida}.`,
    puertoProxy: 'Puerto local',
    puertoProxyAyuda:
      'Nginx reenviará las peticiones a http://127.0.0.1:<puerto> (por ejemplo, Vite o Node).',
    urlBaseVar: 'Variable de URL base',
    urlBaseVarAyuda:
      'Al abrir un túnel se escribe el enlace público en esta variable del .env, y al cerrarlo se restaura.',
    urlBaseVarNinguna: 'Ninguna (no tocar el .env)',
    datosReales: 'Tiene datos reales de clientes',
    datosRealesAyuda:
      'Se marca en la lista y se pide confirmación antes de publicarlo con un túnel.',
    avanzado: 'Avanzado',
    reglasExtra: 'Reglas extra de Nginx',
    reglasExtraAyuda:
      'Se insertan dentro del bloque server (cabeceras de seguridad, deny propios…). Se validan con nginx -t al guardar.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Nota',
    notaPlaceholder: 'Algo que quiera recordar de este sitio',
    guardar: 'Guardar sitio',
    guardado: (nombre: string) => `Sitio ${nombre} guardado`,
    errorGuardar: 'No se pudo guardar el sitio',
    nginxFallo: 'El sitio se guardó, pero Nginx rechazó la configuración',
    nginxFalloAyuda:
      'Se restauró la configuración anterior de Nginx. Revise las reglas extra y vuelva a guardar.',
    errores: {
      carpeta: 'Elija la carpeta del proyecto',
      sufijo: 'El dominio debe terminar en .test',
      caracteres: 'Use solo letras, números, guiones y puntos',
      aliasIgualDominio: (d: string) => `El alias ${d} es igual al dominio del sitio`,
      aliasRepetido: (d: string) => `El alias ${d} está repetido`,
      ocupado: (d: string) => `Ya existe un sitio con el dominio ${d}`,
      puertoFalta: 'Un sitio proxy necesita un puerto',
      puertoRango: 'El puerto debe estar entre 1 y 65535',
      php: 'Seleccione una versión de PHP para este sitio',
      urlBaseVar: 'Use letras, números y guion bajo (por ejemplo, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Túnel público para ${dominio}`,
    etiqueta: 'Túnel',
    apagadoAyuda: 'Comparta este sitio con un enlace público temporal.',
    abriendo: 'Abriendo túnel…',
    cerrando: 'Cerrando túnel…',
    error: 'El túnel falló',
    sinNginx: 'Encienda Nginx primero',
    sinCloudflared: 'Instale cloudflared en Servicios',
    sinConfianza:
      'Este proyecto no es de confianza: marque «Confío en este repositorio» para poder publicarlo.',
    abrirUrl: 'Abrir el enlace público',
    copiarUrl: 'Copiar el enlace público',
    verQr: 'Mostrar el código QR del enlace',
    qrTitulo: 'Enlace público de este sitio',
    renovar: 'Renovar (nuevo enlace)',
    cerrar: 'Cerrar túnel',
    confirmarTitulo: 'Publicar un sitio con datos reales',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} tiene datos reales de clientes y se publicaría en internet con ${destino}: cualquiera con el enlace podrá verlo mientras siga abierto. ¿Publicar?`,
    confirmarExposeTexto: (dominio: string) =>
      `Se publicará ${dominio} en internet con Expose: cualquiera con el enlace podrá entrar mientras siga abierto. Además, el inspector de peticiones de Expose queda visible para cualquier equipo de su red local. ¿Publicar?`,
    compartir: 'Compartir',
    confirmar: 'Publicar',
    confirmarPublicoTitulo: 'Publicar el sitio en internet',
    confirmarPublicoTexto: (dominio: string) =>
      `Se abrirá un túnel público de Cloudflare para ${dominio}: cualquiera con el enlace podrá entrar mientras siga abierto. ¿Publicar?`,
    opciones: 'Opciones del túnel',
    opcionesDe: (dominio: string) => `Opciones del túnel de ${dominio}`,
    proveedor: 'Proveedor',
    proveedorRapido: 'Rápido (sin cuenta)',
    proveedorRapidoAyuda: 'Un enlace de trycloudflare.com que cambia cada vez que se abre.',
    proveedorNombre: 'Con nombre (su dominio)',
    proveedorNombreAyuda:
      'Un enlace fijo en un dominio suyo de Cloudflare. Necesita una cuenta de Cloudflare.',
    cuentaConectada: 'Cuenta de Cloudflare conectada.',
    cuentaSinConectar: 'Todavía no hay una cuenta de Cloudflare conectada.',
    conectar: 'Conectar con Cloudflare',
    conectando: 'Esperando la autorización en su navegador…',
    conectarAyuda:
      'Se abre su navegador para autorizar a WolfCore Dev en su cuenta. El certificado queda solo en su carpeta de datos.',
    autorizacion: 'Autorización de Cloudflare',
    abrirAutorizacion: 'Abrir la página de autorización',
    copiarAutorizacion: 'Copiar el enlace de autorización',
    cancelarConexion: 'Cancelar',
    recrear: 'Recrear el túnel',
    olvidar: 'Olvidar el túnel',
    recrearTitulo: 'Recrear el túnel',
    recrearTexto: (n: string) =>
      `Se borrará el túnel «${n}» en Cloudflare y se creará uno nuevo con el mismo nombre. Los sitios que lo usan se cierran.`,
    olvidarTitulo: 'Olvidar el túnel',
    olvidarTexto: (n: string) =>
      `Se borrará el túnel «${n}» en Cloudflare y su credencial guardada. Los sitios que lo usan vuelven al túnel rápido.`,
    olvidarAqui: 'Olvidar solo aquí',
    olvidarAquiTitulo: 'Olvidar el túnel solo en este equipo',
    olvidarAquiTexto: (n: string) =>
      `Se borrará la credencial guardada del túnel «${n}» en este equipo; el túnel seguirá existiendo en Cloudflare. Los sitios que lo usan vuelven al túnel rápido.`,
    desconectar: 'Desconectar',
    nombreTunel: 'Nombre del túnel',
    nombreTunelAyuda: 'Minúsculas, números y guiones.',
    dominioPublico: 'Dominio público',
    dominioPublicoAyuda:
      'Un subdominio de un dominio suyo en Cloudflare, p. ej. demo.midominio.com.',
    crear: 'Crear y enrutar',
    guardadoNombre: 'Túnel con nombre listo. Al abrirlo se pedirá confirmación.',
    guardadoRapido: 'Este sitio vuelve a usar el túnel rápido.',
    cambiarCierra: 'Al cambiar de proveedor se cierra el túnel abierto de este sitio.',
    usarRapido: 'Usar el túnel rápido',
    nombreActual: (nombre: string, dominio: string) => `Túnel «${nombre}» en ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `Se publicará ${dominio} en ${publico} con un túnel de Cloudflare: cualquiera con el enlace podrá entrar mientras siga abierto. ¿Publicar?`,
    proveedorNgrokAyuda:
      'Con su cuenta de ngrok. Necesita el programa ngrok ya instalado en este equipo.',
    proveedorExposeAyuda:
      'Con su cuenta de Expose. Necesita Expose ya instalado en este equipo; en Windows solo funciona con expose.phar. Su inspector queda visible en la red local, así que no se usa con sitios con datos reales.',
    proveedorTailscaleAyuda:
      'Por su red privada de Tailscale. Necesita Tailscale instalado y con sesión iniciada.',
    tokenGuardado: (f: string) => `Token guardado (termina en ${f}).`,
    tokenSinGuardar: 'Todavía no hay un token guardado.',
    tokenNgrok: 'Token de ngrok',
    tokenExpose: 'Token de Expose',
    tokenAyuda:
      'Se guarda cifrado en este equipo y solo se entrega al programa al abrir el túnel; nunca se muestra.',
    tokenPlaceholder: 'Pegue aquí el token',
    guardarToken: 'Guardar el token',
    borrarToken: 'Borrar el token',
    usarProveedor: 'Usar este proveedor',
    guardadoProveedor: 'Proveedor guardado. Al abrir el túnel se pedirá confirmación.',
    ngrokAyudaInstalacion:
      'ngrok ya debe estar instalado en este equipo (WolfCore Dev no lo descarga porque ngrok no publica una descarga verificable). Su configuración global no se toca.',
    exposeAyudaInstalacion:
      'Expose ya debe estar instalado o tener su expose.phar en la carpeta bin/expose de los datos de WolfCore Dev (en Windows solo funciona con el phar; no hay descarga con huella). Su inspector de peticiones queda visible en toda la red local, por eso no se usa con sitios con datos reales. Su configuración global no se toca.',
    tailscaleAlcance: 'Hasta dónde llega',
    tailscaleServe: 'Serve: solo su tailnet',
    tailscaleServeAyuda: 'Solo los equipos de su red Tailscale. No sale a internet.',
    tailscaleFunnel: 'Funnel: todo internet',
    tailscaleFunnelAyuda: 'Cualquiera con el enlace puede entrar, esté o no en su tailnet.',
    tailscaleFunnelAviso:
      'Funnel publica este sitio en internet: cualquiera con el enlace podrá entrar mientras esté abierto.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev no instala Tailscale (es un servicio del sistema): debe estar instalado y con sesión iniciada. No se cambia nada de lo que ya publica con Tailscale; el sitio usa el puerto HTTPS 8443.',
    confirmarTailnetTitulo: 'Compartir con su tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `Se compartirá ${dominio} con Tailscale Serve: solo podrán entrar los equipos de su tailnet; no se publica en internet. ¿Compartir?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} tiene datos reales de clientes. Con Tailscale Serve solo podrán verlo los equipos de su tailnet (no se publica en internet). ¿Compartir?`,
    confirmarFunnelTexto: (dominio: string) =>
      `Se publicará ${dominio} en internet con Tailscale Funnel: cualquiera con el enlace podrá entrar mientras siga abierto. ¿Publicar?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `Se publicará ${dominio} en internet con ${proveedor}: cualquiera con el enlace podrá entrar mientras siga abierto. ¿Publicar?`,
    tituloError: 'No se pudo abrir el túnel',
  },
  tuneles: {
    titulo: 'Túneles',
    descripcion: 'Enlaces públicos temporales de Cloudflare para mostrar un sitio fuera de su red.',
    explicacion:
      'Los túneles rápidos cambian de dirección cada vez que se abren o renuevan, y solo funcionan mientras este equipo esté encendido y sus procesos sigan vivos (si sale de WolfCore Dev dejándolos encendidos, siguen activos).',
    columnas: { sitio: 'Sitio', estado: 'Estado', url: 'Enlace', acciones: 'Acciones' },
    vacioTitulo: 'No hay túneles abiertos',
    vacio: 'Encienda el interruptor de túnel de un sitio para obtener un enlace público.',
    irASitios: 'Ir a Sitios',
    sinNombre: 'Sitio borrado',
  },
  ajustes: {
    titulo: 'Ajustes',
    descripcion: 'Preferencias del entorno.',
    general: 'General',
    carpetaDatos: 'Carpeta de datos',
    carpetaDatosAyuda: 'Binarios, configuración y registros. Se puede abrir, no cambiar.',
    servicios: 'Servicios',
    puertoNginx: 'Puerto de Nginx',
    puertoNginxAyuda:
      'Normalmente 80. Si no es 80, las URL locales llevarán el puerto. Los túneles abiertos siguen en el puerto anterior: renuévelos.',
    trabajadores: 'Trabajadores PHP',
    trabajadoresAyuda:
      'Procesos php-cgi por versión. Más trabajadores atienden más peticiones a la vez.',
    nota: 'Al guardar se regeneran los sitios con el puerto nuevo. Si Nginx está encendido se reinicia (o se recarga si el puerto no cambió), y las versiones de PHP encendidas se reinician si cambian los trabajadores.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Ajustes guardados y aplicados. Reiniciado: ${reiniciados.join(', ')}.`
        : 'Ajustes guardados y aplicados.',
    errorAplicar: 'Ajustes guardados, pero no se pudieron aplicar del todo',
    errorSeccion: (detalle: string) => `No se pudo leer este dato: ${detalle}`,
    acerca: 'Acerca de',
    avisos: {
      titulo: 'Avisos',
      descripcion:
        'Qué avisos se guardan en la campana y si Windows muestra una notificación cuando la ventana no está a la vista.',
      nativas: 'Notificaciones de Windows',
      nativasAyuda:
        'Solo cuando WolfCore Dev no está en primer plano; como mucho una por tipo cada 5 min.',
      tiposTitulo: 'Tipos de aviso',
      versionesTitulo: 'Versiones nuevas por servicio',
      versionesAyuda:
        'Desactive un servicio para no recibir avisos de sus versiones nuevas (la pestaña Versiones sigue marcando las actualizaciones).',
      versionesDe: (s: string) => `Avisar de versiones nuevas de ${s}`,
      tipos: {
        'servicio-caido': 'Un servicio se detuvo con un error',
        'puerto-ocupado': 'Puerto ocupado al iniciar un servicio',
        'certificado-por-vencer': 'Certificados por vencer',
        'tunel-caido': 'Un túnel se cayó',
        'proceso-error': 'Un proceso de proyecto falló',
        'proceso-terminado': 'Un proceso de proyecto terminó',
        'receta-terminada': 'Una receta de proyecto terminó',
        doctor: 'Diagnóstico (Doctor)',
        'contenedor-detenido': 'Un contenedor se detuvo',
        'version-nueva': 'Hay una versión nueva de un servicio instalado',
      } as Record<string, string>,
      errorGuardar: 'No se pudieron guardar los avisos',
    },
    versionPrograma: 'Versión del programa',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Autoridad local',
      autoridadAyuda:
        'WolfCore Dev firma los certificados de sus sitios .test con una autoridad propia. Se instala en el almacén de su usuario de Windows, sin permisos de administrador.',
      instalada: 'Instalada en Windows',
      noInstalada: 'No instalada',
      instalar: 'Instalar autoridad',
      reinstalar: 'Reinstalar',
      quitar: 'Quitar',
      instaladaOk: 'Autoridad HTTPS instalada',
      quitadaOk: 'Autoridad HTTPS quitada',
      cancelado: 'Se canceló la confirmación de Windows. No se cambió nada.',
      fallo: 'No se pudo cambiar la autoridad HTTPS',
      quitarTitulo: '¿Quitar la autoridad HTTPS?',
      quitarTexto:
        'Los navegadores dejarán de confiar en los certificados de sus sitios .test hasta que la vuelva a instalar.',
      puerto: 'Puerto HTTPS',
      puertoAyuda:
        'Normalmente 443. Si lo usa otro programa, elija uno entre 1024 y 65535; las URL llevarán el puerto.',
      puertoRango: 'Use 443 o un número entre 1024 y 65535',
      puertoGuardado: (p: number) => `HTTPS ahora usa el puerto ${p}`,
      puertoAplicarFallo: 'Puerto guardado, pero Nginx no aceptó la nueva configuración',
      firefox:
        'Firefox usa su propio almacén de certificados. Para que confíe en la autoridad, abra about:config y active',
    },
    herramientas: {
      titulo: 'Terminal y herramientas',
      phpPorDefecto: 'PHP por defecto',
      phpPorDefectoAyuda:
        'La versión de php y composer en la terminal y en los atajos de WolfCore Dev. «Terminal» usa el PHP de cada proyecto.',
      phpMasReciente: 'La más reciente instalada',
      phpSinInstalar: 'Instale PHP en Servicios para elegir una versión',
      phpGuardado: 'PHP por defecto actualizado',
      path: 'PATH del usuario',
      pathAyuda:
        'Agrega php y composer de WolfCore Dev al PATH de su usuario para usarlos en cualquier terminal.',
      pathActivo: 'Agregado al PATH',
      pathInactivo: 'No está en el PATH',
      pathAgregar: 'Agregar al PATH del usuario',
      pathQuitar: 'Quitar del PATH',
      pathTitulo: 'PATH actualizado',
      pathAviso: 'Abra una terminal nueva para ver el cambio: las terminales abiertas no lo ven.',
      pathQuitarTitulo: '¿Quitar WolfCore Dev del PATH?',
      pathQuitarTexto:
        'php y composer de WolfCore Dev dejarán de estar disponibles en las terminales nuevas. Las terminales abiertas no cambian.',
      adminer: 'Puerto de Adminer',
      adminerAyuda: 'Adminer se sirve solo en este equipo, en esta dirección fija.',
      terminal: 'Terminal predeterminada',
      terminalSistema: 'La del sistema (PowerShell)',
      terminalAyuda:
        'La que abre «Terminal» en los proyectos. Si el proyecto necesita variables propias (su PHP en el PATH, la clave de un agente), con «Windows Terminal» se abre PowerShell dentro de la terminal predeterminada de Windows: Windows Terminal ya abierto no recibiría esas variables.',
      terminalGuardada: 'Terminal predeterminada actualizada',
      editor: 'Editor predeterminado',
      editorPrimero: 'El primero que se detecte',
      editorAyuda:
        'El que abre «Editor» en los proyectos y «Abrir en el editor» en las búsquedas y los errores. Se detectan VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed y Notepad++.',
      editorGuardado: 'Editor predeterminado actualizado',
      editorNinguno: 'No se detectó ningún editor.',
    },
  },
  /* ───────────── HTTPS, terminal y FTP en sitios; Correo; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS activo',
    candadoAyuda: 'Este sitio también responde por HTTPS con un certificado de WolfCore Dev.',
    redirige: 'Redirige http → https',
    abrirHttp: (dominio: string) => `Abrir http://${dominio} en el navegador`,
    abrirHttps: (url: string) => `Abrir ${url} en el navegador`,
    pendiente: (motivo: string) => `HTTPS pendiente: ${motivo}`,
    pendienteCorto: 'HTTPS pendiente',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `el puerto ${puerto} lo usa ${nombre} (PID ${pid}).`,
    sinAutoridad: 'falta la autoridad de certificados. Instálela en Ajustes.',
    pendienteAyuda:
      'El sitio sigue funcionando por HTTP. Cierre ese programa o elija otro puerto HTTPS en Ajustes.',
    sinConfianza: 'Autoridad sin instalar',
    sinConfianzaAyuda:
      'El navegador mostrará un aviso de seguridad hasta que instale la autoridad de WolfCore Dev (Ajustes → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Servir también por HTTPS',
    httpsAyuda: 'Con un certificado propio para el dominio y sus alias, firmado por WolfCore Dev.',
    redirigir: 'Redirigir a HTTPS',
    redirigirAyuda: 'Las visitas por http pasan a https. Los túneles públicos no se ven afectados.',
    redirigirDeshabilitado: 'Active HTTPS primero',
    sinAutoridadTitulo: 'La autoridad HTTPS no está instalada',
    sinAutoridadTexto:
      'Sin ella el navegador mostrará un aviso de seguridad. Windows le pedirá confirmar la instalación.',
    instalar: 'Instalar autoridad',
    instalada: 'Autoridad HTTPS instalada',
    cancelado: 'Se canceló la confirmación de Windows. No se cambió nada.',
    fallo: 'No se pudo instalar la autoridad HTTPS',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Abre una terminal en la carpeta del proyecto, con su PHP y Composer en el PATH.',
    elegir: 'Elegir terminal',
    predeterminada: 'predeterminada',
  },
  editorSitio: {
    ayuda: 'Abre la carpeta del proyecto en el editor predeterminado.',
    elegir: 'Abrir con…',
    predeterminada: 'predeterminado',
    sustituido: (pred: string, usado: string) =>
      '{pred} no está instalado: se abrió con {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'No se pudo abrir el editor',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `PHP ${rama} compartido`,
    propio: (rama: string) => `PHP ${rama} propio de este sitio`,
    conXdebug: 'Xdebug activo',
    mostrar: 'Ajustes de PHP',
    ocultar: 'Ocultar ajustes de PHP',
    cargando: 'Leyendo los ajustes de PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} está apagado: el PHP propio de este sitio arranca con él.`,
    ajustesTitulo: 'php.ini propio',
    ajustesAyuda: (rama: string) =>
      `Se suman al php.ini de PHP ${rama} solo para este sitio. Con alguno (o con Xdebug), el sitio usa su propio PHP de 1 o 2 procesos; los demás sitios no cambian.`,
    clave: 'Directiva',
    valor: 'Valor',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Quitar ${clave || 'ajuste'}`,
    agregar: 'Agregar ajuste',
    guardarAjustes: 'Probar y guardar',
    ajustesGuardados: 'Ajustes de PHP del sitio aplicados',
    sinAjustes: 'Sin ajustes propios: usa el php.ini compartido tal cual.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug para ${dominio}`,
    xdebugAyuda:
      'Se carga solo en el PHP de este sitio, nunca en el PHP compartido: los demás sitios siguen igual de rápidos.',
    xdebugDescarga:
      'Xdebug no está instalado en esta versión de PHP: se descargará del catálogo (xdebug.org, huella SHA-256 verificada).',
    modo: 'Modos',
    modos: {
      debug: 'debug (puntos de interrupción)',
      develop: 'develop (mejores errores)',
      coverage: 'coverage (cobertura)',
      profile: 'profile (perfilado)',
      trace: 'trace (traza)',
    },
    puerto: 'Puerto del editor',
    inicio: 'Cuándo se conecta',
    inicioTrigger: 'Solo con XDEBUG_TRIGGER',
    inicioYes: 'En cada petición',
    inicioAyuda:
      'Con «Solo con XDEBUG_TRIGGER», la depuración empieza cuando la petición trae la cookie, el parámetro GET/POST o la extensión del navegador (Xdebug Helper).',
    guardarXdebug: 'Guardar Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `El puerto ${puerto} ya lo usa un PHP u otro servicio de WolfCore Dev: su editor no podrá escucharlo. Elija otro (9003 es el habitual).`,
    xdebugGuardado: 'Xdebug del sitio aplicado',
    quitarXdebug: 'Quitar Xdebug',
    quitarXdebugTitulo: '¿Quitar Xdebug de este sitio?',
    quitarXdebugTexto:
      'Se borra su configuración. Si el sitio no tiene otros ajustes, vuelve al PHP compartido. El launch.json del proyecto no se toca.',
    xdebugQuitado: 'Xdebug quitado del sitio',
    ide: 'Editor',
    generarLaunch: 'Generar launch.json',
    launchTitulo: '.vscode/launch.json del proyecto',
    launchNuevo:
      'Se creará .vscode/launch.json con esta configuración (PHP Debug de VS Code, escucha solo en 127.0.0.1).',
    launchFusion:
      'Ya existe un launch.json: se agrega (o actualiza) solo la configuración de WolfCore; las demás y sus comentarios quedan. Antes se guarda una copia con fecha en la carpeta de datos de WolfCore Dev.',
    launchSinCambios: 'El launch.json ya tiene esta configuración.',
    launchEscribir: 'Escribir launch.json',
    launchCreado: 'launch.json creado en .vscode',
    launchActualizado: (respaldo: string) => `launch.json actualizado. Copia previa: ${respaldo}`,
    phpStorm: 'Configuración para PhpStorm',
    copiarPhpStorm: 'Copiar configuración de PhpStorm',
    errorNginx: (salida: string) => `Nginx no aceptó el cambio; se volvió a lo anterior. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Vhost generado',
    conReglas: 'con reglas propias',
    manualResumen: 'Vhost escrito a mano (no se regenera)',
    mostrar: 'Editar vhost',
    ocultar: 'Ocultar vhost',
    cargando: 'Leyendo el vhost…',
    reglasTitulo: 'Reglas propias',
    reglasAyuda:
      'Van dentro del bloque server de este sitio. Antes de aplicar se prueban con nginx -t sobre una copia de toda la configuración; si algo falla, todo queda como estaba.',
    reglasEtiqueta: 'Reglas propias de Nginx',
    reglasPlaceholder: '# Por ejemplo: client_max_body_size 256m;',
    snippetsTitulo: 'Fragmentos',
    insertar: (titulo: string) => `Insertar: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Caché de estáticos',
      'limite-subida': 'Límite de subida',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Cabeceras de seguridad',
      websocket: 'Proxy WebSocket',
      gzip: 'Compresión gzip',
      ocultos: 'Negar archivos ocultos',
    },
    aplicar: 'Probar y aplicar',
    descartar: 'Descartar cambios',
    aplicado: 'Vhost aplicado y Nginx recargado',
    aplicadoApagado: 'Vhost guardado; se usará al encender Nginx',
    fallo: 'Nginx no aceptó el cambio; el vhost sigue como estaba',
    salidaTitulo: 'Salida de nginx -t',
    desactivado:
      'Nginx no aceptó lo que escribió para este sitio al aplicar la configuración y quedó fuera del vhost (sigue guardado). Corríjalo y aplíquelo de nuevo para volver a usarlo.',
    avisoDestino: (destino: string, linea: number) =>
      `Línea ${linea}: el tráfico se envía a otro equipo (${destino}). Revise que sea lo que quiere.`,
    generadoTitulo: 'Vhost generado (solo lectura)',
    avanzadoTitulo: 'Modo avanzado',
    avanzadoInterruptor: 'Escribir el vhost completo a mano',
    avanzadoAyuda:
      'Reemplaza el vhost generado. WolfCore Dev ya no lo regenera: si cambia el dominio, el HTTPS, los puertos o la carpeta, tendrá que ajustarlo usted. Solo puede usar los dominios y puertos de este sitio.',
    avanzadoActivarTitulo: '¿Escribir el vhost a mano?',
    avanzadoActivarTexto:
      'Se parte del vhost generado actual. Mientras esté activo, los cambios del sitio (dominio, HTTPS, PHP…) no se reflejan en el vhost: los tendrá que hacer usted.',
    avanzadoActivar: 'Escribir a mano',
    manualEtiqueta: 'Vhost completo del sitio',
    aplicarManual: 'Probar y aplicar el vhost',
    volverGenerado: 'Volver al vhost generado',
    volverGeneradoTitulo: '¿Volver al vhost generado?',
    volverGeneradoTexto:
      'El vhost escrito a mano se guarda en el historial y WolfCore Dev vuelve a generar el del sitio (con sus reglas propias).',
    historial: 'Historial',
    historialTitulo: 'Versiones anteriores del vhost',
    historialVacio: 'Todavía no hay versiones anteriores.',
    historialAyuda:
      'Se guardan las 10 últimas versiones, antes de cada cambio. Restaurar pasa por la misma prueba con nginx -t.',
    modoReglas: 'Generado con reglas',
    modoManual: 'Escrito a mano',
    restaurar: 'Restaurar',
    restaurarTitulo: '¿Restaurar esta versión?',
    restaurarTexto: (fecha: string) =>
      `El vhost vuelve a como estaba el ${fecha}. La versión actual queda en el historial.`,
    restaurado: 'Versión restaurada',
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'El proceso de Reverb de este proyecto no tiene el comando de WolfCore Dev (otro host, programa o puerto). Al encenderlo se reemplaza por el propio, que solo escucha en 127.0.0.1.',
    ayuda: 'WebSockets de Laravel, solo en 127.0.0.1.',
    puerto: (p: number) => 'Puerto {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) => 'Encender o apagar Reverb de {d}'.replace('{d}', dominio),
    activarTitulo: '¿Encender Reverb?',
    activarTexto: (dominio: string) =>
      'Se ejecutará «php artisan reverb:start» en {d}, escuchando solo en 127.0.0.1 con un puerto libre. El código del proyecto se ejecuta con su PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: '¿Apagar Reverb?',
    desactivarTexto:
      'Se detiene el proceso y se quita del proyecto. Las variables REVERB_* del .env no se tocan.',
    activar: 'Encender',
    desactivar: 'Apagar',
    proponer: 'Proponer variables REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Apagado',
      iniciando: 'Iniciando',
      encendido: 'Encendido',
      error: 'Con error',
    },
  },
  lan: {
    etiqueta: 'Red local',
    interruptor: (dominio: string) => `Compartir ${dominio} en la red local`,
    apagadoAyuda: 'Abra este sitio desde su móvil u otro equipo de la misma red.',
    sinNginx: 'Encienda Nginx para compartir el sitio en la red local.',
    sinRed: 'No hay una red local conectada (Wi-Fi o Ethernet).',
    activo: 'Visible en la red local',
    abriendo: 'Compartiendo…',
    cerrando: 'Dejando de compartir…',
    abrirUrl: 'Abrir en este equipo',
    copiarUrl: 'Copiar la dirección',
    verQr: 'Mostrar el QR',
    qrTitulo: (dominio: string) => `${dominio} en la red local`,
    qrAviso: 'Escanee el QR con un móvil conectado a la misma red.',
    confirmarTitulo: 'Compartir en la red local',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} quedará visible para cualquier dispositivo conectado a la misma red que este equipo (${ip}), sin pedir contraseña. Se deja de compartir al apagar el interruptor, al cerrar WolfCore Dev y al arrancarlo de nuevo.`,
    ipEtiqueta: 'Red (IP de este equipo)',
    https: 'Usar HTTPS',
    httpsAyuda:
      'Con HTTPS el móvil debe confiar en la CA de WolfCore Dev (botón «Instalar la CA en el móvil»). Sin él, el sitio va por HTTP.',
    httpsObligatorio: 'Este sitio redirige a HTTPS, así que se comparte con HTTPS.',
    compartir: 'Compartir en la red',
    tituloError: 'No se pudo compartir en la red local',
    caBoton: 'Instalar la CA en el móvil',
    firewallTitulo: '¿No abre en el móvil?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} tiene datos reales y no se comparte en la red local, ni con confirmación.`,
    redPublica:
      'Esta red está marcada como pública en Windows: el cortafuegos bloqueará la entrada y el comando solo abre redes privadas. Márquela como privada si es su red de confianza.',
    firewallTexto:
      'WolfCore Dev no cambia el cortafuegos. No acepte el aviso de Windows para todo el programa: use el comando de este puerto (solo la subred local y solo redes privadas) en PowerShell como administrador. En una red pública no abrirá, y una regla de bloqueo que ya exista tiene prioridad sobre la de permitir.',
    copiarComando: 'Copiar el comando',
  },
  caMovil: {
    titulo: 'Instalar la CA en el móvil',
    intro:
      'Escanee el QR con un móvil conectado a la misma red para descargar el certificado de la autoridad de WolfCore Dev. Solo se entrega ese archivo y el enlace se cierra solo.',
    abriendo: 'Abriendo el enlace…',
    expira: (minutos: number) => `El enlace se cierra solo en ${minutos} min.`,
    expirado: 'El enlace se cerró.',
    reabrir: 'Abrir de nuevo',
    android: 'Android',
    ios: 'iPhone o iPad',
    pasosAndroid: [
      'Escanee el QR o abra la dirección en el navegador del móvil y descargue el archivo.',
      'Abra Ajustes > Seguridad y privacidad > Más seguridad > Cifrado y credenciales > Instalar un certificado > Certificado de CA (los nombres cambian según la marca).',
      'Antes de confiar, compare la huella SHA-256 del certificado que muestra el móvil con la de este diálogo: si no coinciden, no lo instale.',
      'Elija el archivo descargado y acepte el aviso: es normal, Android avisa con toda CA.',
    ],
    pasosIos: [
      'Abra la dirección en Safari y permita descargar el perfil.',
      'Abra Ajustes > Perfil descargado y compare la huella SHA-1 del detalle con la de este diálogo: si no coinciden, no lo instale. Luego instálelo.',
      'Abra Ajustes > General > Información > Ajustes de confianza de certificados y active la confianza total para la CA de WolfCore Dev.',
    ],
    aviso:
      'Una CA instalada da confianza a todo lo que firme en ese móvil: instálela solo en sus dispositivos y quítela cuando termine.',
    firewallAviso: (puerto: number) =>
      'Para que el móvil llegue al enlace hay que abrir el puerto ' +
      puerto +
      ' (solo la subred local y redes privadas). No acepte el aviso de Windows para todo el programa: ejecute este comando en PowerShell como administrador. En una red pública no abrirá, y una regla de bloqueo ya existente tiene prioridad.',
    huellas: 'Huellas del certificado',
    tituloError: 'No se pudo abrir el enlace de la CA',
  },
  dialogoQr: {
    descargar: 'Descargar PNG',
    descargado: 'QR guardado',
    largo: 'El texto es demasiado largo para un QR.',
    generando: 'Generando el código QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Acceso FTP para ${dominio}`,
    apagadoAyuda: 'Permita subir archivos a la carpeta de este sitio por FTP.',
    activoAyuda: 'Acceso activo.',
    soloLecturaEtiqueta: 'solo lectura',
    mostrarDatos: 'Mostrar datos de FTP',
    ocultarDatos: 'Ocultar datos de FTP',
    host: 'Servidor',
    puerto: 'Puerto',
    usuario: 'Usuario',
    clave: 'Clave',
    mostrarClave: 'Mostrar clave',
    ocultarClave: 'Ocultar clave',
    copiarDato: (dato: string) => `Copiar ${dato}`,
    cargando: 'Leyendo los datos de FTP…',
    regenerar: 'Regenerar clave',
    regenerarTitulo: '¿Regenerar la clave FTP?',
    regenerarTexto:
      'La clave actual deja de funcionar y se cierran las conexiones abiertas de este sitio. Tendrá que actualizarla en su cliente FTP.',
    regenerada: 'Clave FTP regenerada',
    soloLectura: 'Solo lectura',
    soloLecturaAyuda: 'Se puede descargar, pero no subir, cambiar ni borrar archivos.',
    soloLecturaActivado: 'El FTP de este sitio ahora es de solo lectura',
    soloLecturaDesactivado: 'El FTP de este sitio ahora permite escribir',
    activado: 'Acceso FTP activado',
    desactivarTitulo: '¿Quitar el acceso FTP de este sitio?',
    desactivarTexto:
      'Se borra la clave y se cierran las conexiones abiertas. La carpeta del sitio no se toca.',
    desactivar: 'Quitar acceso',
    desactivado: 'Acceso FTP quitado',
    redLocalAviso:
      'El FTP acepta conexiones de la red local y envía la clave y los archivos sin cifrar. Úselo solo en una red de confianza.',
    redLocalHost: 'o la IP de este equipo en su red',
    servidorApagado: 'El servidor FTP está apagado: nadie podrá conectarse hasta que lo encienda.',
    encender: 'Encender FTP',
    urlEtiqueta: 'Dirección',
    urlAyuda: 'La dirección no incluye la clave: se pide al conectarse.',
    abrirUrl: 'Abrir en un cliente FTP',
    copiarUrl: 'Copiar la dirección FTP',
    verQr: 'Mostrar el código QR de la dirección',
    qrTitulo: 'Dirección FTP de este sitio',
    qrAviso: 'El código solo lleva la dirección, no la clave.',
  },
  correo: {
    descripcion:
      'Los captadores atrapan los correos que envían sus proyectos para que los revise sin que salgan a internet. Escuchan solo en este equipo (127.0.0.1) y solo uno está encendido a la vez.',
    seccionCaptadores: 'Captadores locales',
    seccionProveedores: 'Proveedores SMTP remotos',
    proveedores: {
      descripcion:
        'Un proveedor SMTP real envía el correo de verdad: úselo para probar el envío de su proyecto antes de publicarlo. La clave se guarda cifrada en este equipo y nunca se muestra.',
      agregar: 'Agregar proveedor',
      vacio:
        'Todavía no agregó ningún proveedor. Elija Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO o Gmail, o escriba el suyo.',
      errorLista: 'No se pudo leer la lista de proveedores',
      tarjeta: {
        servidor: 'Servidor',
        usuario: 'Usuario',
        clave: 'Clave',
        sinClave: 'Sin clave',
        claveIlegible: 'Guardada (no se pudo leer)',
        red: 'Red',
        redLocal: 'Servidor de este equipo o de la red local (confirmado)',
        editar: 'Editar',
        borrar: 'Borrar',
        borrarTitulo: (n: string) => `¿Borrar ${n}?`,
        borrarTexto:
          'Se borra el proveedor y su clave guardada. Los proyectos que lo usan vuelven al captador local, pero sus .env no se tocan: conservan las variables MAIL_* de este proveedor (y su clave, si la escribió). Reescriba el bloque de correo en cada .env.',
        borrado: (n: string) => `${n} borrado`,
        usar: 'Usar en un proyecto',
        destino: 'Dirección de destino de la prueba',
        destinoPlaceholder: 'su-direccion@ejemplo.com',
        probar: 'Probar envío',
        probando: 'Enviando…',
        probarAyuda:
          'Envía un solo correo de verdad a esa dirección, con conexión cifrada verificada. Máximo uno cada 15 s.',
        sinClaveParaProbar: 'Guarde la clave del proveedor para poder probar el envío.',
        hostLocal: 'El nombre de este servidor se resuelve a este equipo o a la red local.',
        confirmarRed: 'Confirmar red local',
        enviado: (para: string) => `Correo enviado a ${para}. Revise su bandeja.`,
        fallos: {
          'correo.auth': 'El proveedor rechazó el usuario o la clave.',
          'correo.conexion': 'No se pudo conectar: revise el host y el puerto.',
          'correo.tls':
            'La conexión cifrada no es válida (certificado, nombre o STARTTLS). No se envió nada.',
          'correo.rechazado':
            'El servidor rechazó el mensaje o una dirección. Revise el remitente: muchos proveedores solo aceptan un remitente o dominio verificado.',
          'correo.plazo': 'El servidor no respondió a tiempo (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Agregar proveedor SMTP',
        editar: (n: string) => `Editar ${n}`,
        preset: 'Proveedor',
        presetOtro: 'Otro (escribir los datos)',
        presetAyuda: 'Host y puerto vienen de la documentación oficial de cada proveedor.',
        documentacion: 'Ver documentación',
        region: 'Región',
        nombre: 'Nombre',
        nombreObligatorio: 'Escriba un nombre.',
        host: 'Servidor (host)',
        hostAyuda: 'Solo el nombre o la IP, sin smtp:// ni puerto.',
        hostObligatorio: 'Escriba el servidor.',
        puerto: 'Puerto',
        seguridad: 'Cifrado',
        seguridadAyuda:
          'Siempre se exige una conexión cifrada y con certificado válido: nunca se baja a texto plano.',
        tls: 'TLS directo (puerto 465)',
        starttls: 'STARTTLS (puerto 587)',
        usuario: 'Usuario',
        usuarioObligatorio: 'Escriba el usuario.',
        usuarioFijoAyuda: 'Este proveedor usa siempre este usuario; la clave es la de su cuenta.',
        clave: 'Clave SMTP',
        claveGuardada: (f: string) => `Guardada: ••••${f}`,
        claveNueva: 'Escriba la clave para guardarla',
        claveAyuda:
          'Se guarda cifrada en este equipo y nunca vuelve a mostrarse. Déjela vacía para no cambiarla.',
        remitente: 'Remitente de la prueba (opcional)',
        remitenteAyuda:
          'Muchos proveedores solo envían desde un remitente o dominio verificado. Si lo deja vacío, el remitente es la propia dirección de destino.',
        claveSinEspacios:
          'Pegue la clave tal como la da el proveedor: los espacios internos se conservan.',
        borrarClave: 'Borrar la clave',
        borrarClaveTitulo: (n: string) => `¿Borrar la clave de ${n}?`,
        borrarClaveTexto: 'Se borra la clave guardada. El proveedor sigue en la lista.',
        claveBorrada: 'Clave borrada',
        guardar: 'Guardar',
        guardado: (n: string) => `${n} guardado`,
        redLocalTitulo: 'Servidor en este equipo o en la red local',
        redLocalTexto: (h: string) =>
          `${h} apunta a este equipo o a la red local. WolfCore Dev solo se conecta ahí si usted lo confirma. ¿Es un servidor suyo?`,
        redLocalConfirmar: 'Sí, es mío',
        cambiaTitulo: 'Enviar la clave a otro servidor',
        cambiaTexto: (h: string) =>
          `El proveedor tiene una clave guardada y cambió el servidor o el usuario. La clave se enviará a ${h}. ¿Continuar?`,
        cambiaConfirmar: 'Sí, continuar',
      },
      env: {
        titulo: (n: string) => `Usar ${n} en un proyecto`,
        proyecto: 'Proyecto',
        sinProyectos: 'Todavía no hay proyectos.',
        yaUsaSmtp: 'Este proyecto ya envía por un proveedor SMTP.',
        volverCaptador: 'Volver al captador local',
        volvio: (n: string) =>
          `${n} vuelve a enviar al captador local, pero su .env no se tocó: conserva las variables MAIL_* del proveedor (y su clave, si la escribió). Reescriba su bloque de correo.`,
        incluirClave: 'Escribir también la clave en el .env',
        incluirClaveAyuda: 'Sin marcar, el bloque no lleva MAIL_PASSWORD y usted la agrega a mano.',
        sinClaveGuardada: 'El proveedor no tiene una clave guardada.',
        vista: 'Cambios en el .env (la clave va enmascarada)',
        textoPlano:
          'La clave quedará en texto plano en el .env del proyecto. Cualquiera con acceso a esa carpeta, o a su repositorio si lo sube, podrá leerla.',
        claveTitulo: 'Escribir la clave en el .env',
        claveTexto:
          'La clave se guarda en texto plano en el archivo .env del proyecto. Úsela solo si el proyecto no se sube a un repositorio y la carpeta es solo suya.',
        claveConfirmar: 'Entiendo, incluir la clave',
        agregarGitignore: 'Agregar .env al .gitignore',
        gitignoreTitulo: 'Modificar .gitignore',
        gitignoreTexto:
          'Se agrega la línea .env al .gitignore del proyecto (con una copia previa).',
        gitignoreConfirmar: 'Agregar',
        versionadoTitulo: 'Git ya sigue el .env',
        versionadoTexto:
          'El próximo commit subiría sus valores. Quítelo del índice con git rm --cached .env.',
        desconocidoTitulo: 'No se pudo comprobar git',
        desconocidoTexto: 'No se pudo saber si git sigue el .env de este proyecto.',
        aceptarVersionado: 'Escribir de todos modos',
        aceptarTitulo: 'Escribir en un .env versionado',
        aceptarTexto:
          'Si git sigue el .env, estas variables pueden acabar en el repositorio. ¿Escribir de todos modos?',
        aceptarConfirmar: 'Escribir de todos modos',
        confirmarTitulo: 'Escribir en el .env',
        confirmarTexto: (ruta: string) =>
          `Se guardará una copia de ${ruta} y se agregarán las variables MAIL_* sin la clave.`,
        confirmarTextoClave: (ruta: string) =>
          `Se guardará una copia de ${ruta} y se agregarán las variables MAIL_*, con la clave en texto plano.`,
        confirmar: 'Escribir',
        escribir: 'Escribir en el .env',
        escrito: (n: string) => `${n} ahora envía por este proveedor`,
      },
    },
    estado: 'Estado',
    smtp: 'SMTP',
    buzon: 'Buzón web',
    abrirBuzon: 'Abrir buzón',
    noLeidos: 'Sin leer',
    noLeidosValor: (n: number) => plural(n, 'correo sin leer', 'correos sin leer'),
    noLeidosError: 'No se pudo leer el buzón',
    actualizar: 'Volver a contar los correos',
    actualizaSolo: 'Se actualiza cada 15 segundos mientras esta pantalla está abierta.',
    env: 'Bloque para el .env de Laravel',
    envAyuda: (captador: string) =>
      `Péguelo en el .env de su proyecto. El correo queda en ${captador}, sin cifrado y sin usuario.`,
    copiarEnv: 'Copiar bloque',
    irAServicios: 'Ir a Servicios',
    cargando: 'Leyendo los captadores…',
    errorLista: 'No se pudo leer la lista de captadores',
    captador: {
      opcional: 'Opcional',
      elegido: 'Recibe el correo de sus proyectos',
      noInstalado: 'No instalado',
      instalar: 'Instalar',
      usar: 'Usar este',
      apagar: 'Apagar',
      iniciando: 'Encendiéndose…',
      avisoMantenimiento:
        'Este captador casi no recibe mantenimiento. Prefiera Mailpit o smtp4dev.',
    },
    notaDescartados:
      'MailHog y MailDev no se ofrecen: MailHog no publica una huella con la que comprobar la descarga y MailDev solo existe en npm. Sin huella verificable no se descarga nada.',
    notaHost:
      'Los buzones web solo responden en 127.0.0.1, pero mientras un captador está encendido una página web maliciosa podría intentar leer su buzón (DNS rebinding). smtp4dev y Papercut rechazan cabeceras Host ajenas; Mailpit sirve su buzón bajo una ruta secreta propia de este equipo (WolfCore Dev abre esa dirección por usted); Inbucket no tiene ninguna protección: apáguelo cuando no lo use.',
  },
  ia: {
    descripcion:
      'Proveedores de IA en la nube y modelos locales con Ollama. Las claves se guardan cifradas en este equipo y nunca se muestran.',
    nube: {
      titulo: 'IA en la nube',
      agregar: 'Agregar proveedor',
      vacio:
        'Todavía no agregó ningún proveedor. Agregue OpenAI, Anthropic, Gemini, Hermes (Nous) o un compatible con OpenAI.',
      errorLista: 'No se pudo leer la lista de proveedores',
    },
    local: { titulo: 'IA local (Ollama)' },
    pestanas: {
      etiqueta: 'Secciones de IA',
      agentes: 'Agentes',
      nube: 'Nube',
      local: 'Modelos locales',
    },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Compatible con OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Clave',
      sinClave: 'Sin clave',
      claveIlegible: 'Guardada (no se pudo leer)',
      url: 'URL base',
      modeloPorDefecto: 'Modelo por defecto',
      ninguno: 'Ninguno',
      probarConexion: 'Probar conexión',
      probarConexionAyuda: 'Lista los modelos del proveedor. No gasta tokens.',
      probando: 'Probando…',
      conectado: (ms: number, n: number) => `Conectado · ${ms} ms · ${n} modelos`,
      verModelos: (n: number) => `Ver los ${n} modelos`,
      soloGratuitos: 'Solo gratuitos',
      fallo: 'No se pudo conectar',
      probarMensaje: 'Probar un mensaje',
      probarMensajeAyuda:
        'Envía un mensaje corto fijo para comprobar que el modelo responde. Gasta unos pocos tokens.',
      elegirModelo: 'Modelo para el mensaje',
      sinModelo: 'Pruebe la conexión o fije un modelo por defecto para elegir uno.',
      enviando: 'Enviando…',
      respuesta: (ms: number) => `Respuesta en ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} tokens de entrada, ${salida} de salida`,
      usar: 'Usar en un proyecto',
      editar: 'Editar',
      borrar: 'Borrar',
      acciones: (nombre: string) => `Acciones de ${nombre}`,
    },
    costo: {
      titulo: 'Probar un mensaje',
      texto: (modelo: string, proveedor: string) =>
        `Se enviará un mensaje corto y fijo al modelo ${modelo} de ${proveedor}. Gasta tokens de su cuenta: la respuesta se corta en 16 tokens y suele costar fracciones de centavo.`,
      enviar: 'Enviar el mensaje',
    },
    dialogo: {
      nuevo: 'Agregar proveedor de IA',
      editar: (nombre: string) => `Editar ${nombre}`,
      tipo: 'Tipo',
      preset: 'Proveedor compatible',
      presetAyuda: 'Rellena el nombre y la URL; puede cambiarlos.',
      presetOtro: 'Otro',
      documentacion: 'Ver documentación',
      nombre: 'Nombre',
      urlBase: 'URL base',
      urlAyuda: 'Vacía = la oficial. Solo https://, o http:// hacia 127.0.0.1 o [::1] (LM Studio).',
      urlObligatoria: 'Escriba la URL base del proveedor compatible.',
      modelo: 'Modelo por defecto (opcional)',
      modeloAyuda: 'Se usa en el bloque .env (AI_MODEL) y en el mensaje de prueba.',
      clave: 'Clave de API',
      claveNueva: 'Pegue la clave',
      claveGuardada: (final: string) =>
        `Hay una clave guardada (${final}). Escriba otra solo si quiere reemplazarla.`,
      claveAyuda:
        'Se guarda cifrada en este equipo y nunca se vuelve a mostrar. Solo se ven los 4 últimos caracteres.',
      claveOpcional: 'Opcional para servidores locales (LM Studio).',
      borrarClave: 'Borrar la clave',
      guardar: 'Guardar',
      guardado: (nombre: string) => `${nombre} guardado`,
      urlCambiaTitulo: 'La clave irá a otra URL',
      urlCambiaTexto: (url: string) =>
        `Este proveedor tiene una clave guardada. Desde ahora se enviará a ${url}. Confirme solo si confía en ese servidor.`,
      urlCambiaConfirmar: 'Enviar la clave a la nueva URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `¿Borrar la clave de ${nombre}?`,
      claveTexto:
        'La clave se borra de este equipo. Los .env donde la escribió no se tocan: cámbiela también allí si la revoca.',
      proveedorTitulo: (nombre: string) => `¿Borrar ${nombre}?`,
      proveedorTexto:
        'Se borran el proveedor y su clave guardada. Los .env de sus proyectos no se tocan.',
      respaldos: (n: number) =>
        n === 1
          ? 'Borrar también las copias del .env de 1 proyecto que tienen esta clave en texto plano'
          : `Borrar también las copias del .env de ${n} proyectos que tienen esta clave en texto plano`,
      respaldosAyuda:
        'WolfCore Dev guarda copias del .env antes de escribirlo, fuera de los proyectos. Borrarlas no se puede deshacer.',
      claveBorrada: 'Clave borrada',
      proveedorBorrado: (nombre: string) => `${nombre} borrado`,
      respaldosBorrados: (n: number) => `Se borraron las copias del .env de ${n} proyecto(s)`,
    },
    env: {
      titulo: (nombre: string) => `Usar ${nombre} en un proyecto`,
      proyecto: 'Proyecto',
      sinProyectos: 'No hay proyectos montados.',
      modelo: 'Modelo (AI_MODEL)',
      modeloAyuda: 'Opcional. Elija uno de la lista o escríbalo.',
      vista: 'Bloque que se escribirá en .env (la clave se muestra enmascarada)',
      cargando: 'Preparando la vista previa…',
      textoPlano:
        'La clave quedará en texto plano en el .env del proyecto. Cualquiera con acceso a esa carpeta podrá leerla.',
      copiaPrevia:
        'El .env actual se copia antes, fuera del proyecto (en la carpeta de datos de WolfCore Dev).',
      sinClave: 'Este proveedor necesita una clave: guárdela antes de usarlo en un proyecto.',
      gitignoreFalta: 'El .gitignore del proyecto no ignora el .env.',
      gitignoreNoExiste: 'El proyecto no tiene .gitignore.',
      gitignoreOk: 'El .gitignore ya ignora el .env.',
      agregarGitignore: 'Agregar .env al .gitignore',
      gitignoreTitulo: 'Modificar .gitignore',
      gitignoreTexto:
        'Se agregará la línea .env al .gitignore del proyecto (o se creará el archivo), con una copia previa.',
      gitignoreConfirmar: 'Agregar al .gitignore',
      versionadoTitulo: 'Git ya sigue el .env de este proyecto',
      versionadoTexto:
        'Aunque esté en .gitignore, el próximo commit subiría la clave. Antes de escribirla, quítelo del índice y haga commit:',
      desconocidoTitulo: 'No se pudo comprobar si git sigue el .env',
      desconocidoTexto:
        'Git no respondió (no está instalado o la carpeta no es de confianza). Si el .env ya está en el repositorio, el próximo commit subiría la clave. Revíselo con:',
      aceptarVersionado: 'Entiendo el riesgo: escribir la clave igual',
      aceptarTitulo: 'Escribir aunque git pueda subir la clave',
      aceptarTexto:
        'Si el .env está en el repositorio, la clave quedará en el próximo commit y en el historial. Hágalo solo si ya ejecutó git rm --cached .env o si el repositorio es solo suyo.',
      aceptarConfirmar: 'Acepto el riesgo',
      conflictoTitulo: 'El .env ya define estas variables con otro valor',
      reemplazar: (claves: string) => `Reemplazar ${claves}`,
      reemplazarTitulo: 'Reemplazar variables del .env',
      reemplazarTexto: (claves: string) =>
        `Se quitarán las líneas de ${claves} que ya tenía el .env y quedarán las del bloque de WolfCore Dev. El .env anterior se copia antes.`,
      reemplazarConfirmar: 'Reemplazar',
      escribir: 'Escribir en .env',
      confirmarTitulo: 'Escribir la clave en texto plano',
      confirmarTexto: (carpeta: string) =>
        `La clave se escribirá sin cifrar en ${carpeta}. No comparta ese archivo ni lo suba a un repositorio.`,
      confirmar: 'Escribir la clave',
      escrito: (proyecto: string) => `Bloque de IA escrito en el .env de ${proyecto}`,
      copiarComando: 'Copiar comando',
    },
  },
  iaLocal: {
    descripcion:
      'Modelos de lenguaje que corren en su equipo con Ollama. Úselos desde sus proyectos sin enviar datos a internet.',
    sinInstalarTitulo: 'Ollama no está instalado',
    sinInstalar: 'Instálelo desde Servicios para descargar y usar modelos en su equipo.',
    irAServicios: 'Ir a Servicios',
    apagadoTitulo: 'Ollama está apagado',
    apagado: 'Enciéndalo para ver, descargar y probar modelos.',
    iniciando: 'Ollama se está encendiendo…',
    errorTitulo: 'Ollama no pudo encender',
    encender: 'Encender Ollama',
    verServicios: 'Ver en Servicios',
    modelos: 'Modelos instalados',
    sinModelos: 'Todavía no hay modelos. Descargue uno más abajo.',
    errorModelos: 'No se pudo leer la lista de modelos',
    recargar: 'Volver a cargar la lista',
    total: (n: number) => plural(n, 'modelo', 'modelos'),
    espacio: 'Espacio usado',
    espacioAyuda: 'Lo que ocupan todos los modelos en la carpeta de datos.',
    probarDe: (modelo: string) => `Probar ${modelo}`,
    borrarDe: (modelo: string) => `Borrar ${modelo}`,
    borrarTitulo: (modelo: string) => `¿Borrar el modelo ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `Se libera ${tamano} de disco. Para volver a usarlo tendrá que descargarlo otra vez.`,
    borrado: (modelo: string) => `Modelo ${modelo} borrado`,
    descargar: {
      titulo: 'Descargar un modelo',
      campo: 'Nombre del modelo',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Escriba el nombre que usa Ollama (ollama.com/library) o elija una sugerencia.',
      sugerenciaAyuda: {
        'llama3.2': 'Chat general, liviano',
        'qwen2.5-coder': 'Programación',
        mistral: 'Chat general',
        'nomic-embed-text': 'Embeddings para búsquedas (bots)',
      } as Record<string, string>,
      boton: 'Descargar',
      invalido: 'Use letras, números y . _ : / - (por ejemplo llama3.2)',
      yaInstalado: 'Ese modelo ya está instalado',
      enCurso: 'Ese modelo ya se está descargando',
      confirmarTitulo: (modelo: string) => `¿Descargar ${modelo}?`,
      confirmarTexto:
        'Los modelos suelen pesar varios GB (de 1 a más de 40 según el tamaño). Ollama no informa el tamaño antes de empezar: lo verá en la barra de progreso y puede cancelar en cualquier momento.',
      confirmar: 'Descargar',
    },
    progreso: {
      fases: {
        preparando: 'Preparando…',
        descargando: 'Descargando',
        verificando: 'Verificando',
        guardando: 'Guardando',
        listo: 'Listo',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} de ${total}`,
      cancelarDe: (modelo: string) => `Cancelar la descarga de ${modelo}`,
      cancelando: 'Cancelando…',
      listo: (modelo: string) => `${modelo} descargado`,
      cancelado: (modelo: string) => `Descarga de ${modelo} cancelada`,
      error: (modelo: string) => `No se pudo descargar ${modelo}`,
      descartar: 'Descartar',
      descartarDe: (modelo: string) => `Descartar el aviso de ${modelo}`,
    },
    prueba: {
      titulo: 'Probar un modelo',
      modelo: 'Modelo',
      elegir: 'Elija un modelo',
      prompt: 'Mensaje',
      placeholder: 'Escriba una pregunta corta y presione Enter',
      enviar: 'Enviar',
      respuesta: 'Respuesta',
      pensando: 'El modelo está respondiendo… la primera vez puede tardar mientras se carga.',
      vacia: '(El modelo no devolvió texto.)',
      sinModelos: 'Descargue un modelo para probarlo.',
    },
    conexion: {
      titulo: 'Conexión desde sus proyectos',
      base: 'URL base de Ollama',
      openai: 'Endpoint compatible con OpenAI',
      env: 'Bloque para el archivo .env',
      envAyuda:
        'Sirve para Laravel o para un bot con FastAPI. WolfCore Dev no escribe en sus proyectos.',
      copiarEnv: 'Copiar bloque',
      copiarDato: (dato: string) => `Copiar ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code y Codex se podrán conectar a estos modelos con un clic en la Etapa B.',
  },
  proyectos: {
    titulo: 'Proyectos',
    descripcion:
      'Cada proyecto es una carpeta con su sitio .test, su receta de instalación y sus procesos.',
    agregar: 'Agregar proyecto',
    vacioTitulo: 'Todavía no hay proyectos',
    vacio:
      'Clone un repositorio de GitHub o elija una carpeta: WolfCore Dev detecta el tipo de proyecto y lo prepara paso a paso.',
    pasos: {
      porTipo: {
        'composer-install': 'Instalar dependencias de PHP (composer install)',
        'env-crear': 'Crear el archivo .env',
        'key-generate': 'Generar la clave de la aplicación',
        'bd-crear': 'Crear la base de datos',
        'bd-restaurar': 'Restaurar un respaldo',
        migrar: 'Migrar la base de datos',
        'storage-link': 'Enlazar storage (storage:link)',
        'npm-ci': 'Instalar dependencias de Node (npm ci)',
        'npm-build': 'Compilar recursos (npm run build)',
        'python-venv': 'Crear el entorno virtual (.venv)',
        'pip-install': 'Instalar dependencias de Python (pip)',
        'pgvector-activar': 'Activar pgvector en la base',
        'sitio-crear': 'Crear el sitio',
        comando: 'Comando del proyecto',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Crear el sitio ${dominio}` : 'Crear el sitio'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Restaurar el respaldo ${archivo}` : 'Restaurar un respaldo',
      migrar: 'Migrar la base de datos',
      migrarSemilla: 'Migrar la base de datos y cargar datos de prueba (--seed)',
      comando: (linea: string) => (linea ? `Ejecutar: ${linea}` : 'Comando del proyecto'),
    },
    estadoPaso: {
      pendiente: 'Pendiente',
      corriendo: 'En curso',
      listo: 'Listo',
      error: 'Error',
      omitido: 'Omitido',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Sin preparar',
      corriendo: 'Preparando…',
      lista: 'Preparado',
      error: 'Un paso falló',
      cancelada: 'Preparación cancelada',
      incompleta: 'Preparación incompleta',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Agregar proyecto',
      pestanas: { github: 'GitHub', url: 'URL de Git', carpeta: 'Carpeta' },
      destino: 'Carpeta de destino',
      destinoAyuda: (base: string) =>
        `Se clona en ${base}. Para otro lugar, use "Elegir carpeta…".`,
      nombreCarpeta: 'Nombre de la carpeta',
      nombrePlaceholder: 'mi-proyecto',
      elegirDestino: 'Elegir carpeta…',
      destinoPorDefecto: 'Usar la carpeta de proyectos',
      clonar: 'Clonar',
      clonando: 'Clonando…',
      clonado: 'Repositorio clonado',
      errorClonar: 'No se pudo clonar el repositorio',
      sinCancelar:
        'El clon no se puede interrumpir desde aquí: espere a que termine (puede tardar varios minutos).',
      sinGit: 'Git no está instalado. Instálelo (git-scm.com) y vuelva a abrir este diálogo.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Conectado con GitHub CLI como ${usuario}` : 'Conectado con GitHub CLI',
      estadoToken: 'Conectado con un token personal',
      estadoNinguna: 'Sin conexión con GitHub',
      ayudaNinguna:
        'Inicie sesión con GitHub CLI (recomendado) o use un token personal de grano fino con permiso de lectura de contenido.',
      instalarGh: 'Instalar GitHub CLI',
      instalandoGh: 'Instalando GitHub CLI…',
      ghInstalado: 'GitHub CLI instalado. Ahora inicie sesión.',
      iniciarSesion: 'Iniciar sesión',
      sesionAbierta:
        'Se abrió una ventana para iniciar sesión. Cuando termine, presione "Comprobar de nuevo".',
      comprobar: 'Comprobar de nuevo',
      usarToken: 'Usar un token',
      token: 'Token personal de GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Se guarda cifrado en este equipo y nunca se muestra de nuevo ni se escribe en los proyectos.',
      guardarToken: 'Guardar token',
      tokenGuardado: 'Token guardado',
      quitarToken: 'Quitar token',
      tokenQuitado: 'Token quitado',
      buscar: 'Buscar repositorios',
      cargando: 'Cargando repositorios…',
      sinRepos: 'No se encontraron repositorios.',
      cargarMas: 'Cargar más',
      privado: 'Privado',
      yaClonado: 'Ya clonado',
      yaClonadoAyuda: 'Ya hay un proyecto con este repositorio o en su carpeta de destino.',
      actualizado: (fecha: string) => `Actualizado ${fecha}`,
      elegir: 'Elegir',
      errorRepos: 'No se pudo leer la lista de repositorios',
    },
    url: {
      etiqueta: 'URL del repositorio',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:ruta o usuario/proyecto (GitHub). Sin usuario ni clave en la URL.',
      invalida: 'Use https://…, git@host:ruta o usuario/proyecto',
    },
    carpeta: {
      titulo: 'Proyecto que ya está en el equipo',
      texto: 'Elija la carpeta: se detecta el tipo de proyecto y se propone su receta.',
      elegir: 'Elegir carpeta',
      manual: 'Agregar sin receta (configuración manual)',
      yaEsProyecto: (nombre: string) => `Esa carpeta ya es el proyecto ${nombre}.`,
      vigilarTitulo: 'Carpeta vigilada',
      vigilarTexto:
        'WolfCore Dev avisa cuando aparece una carpeta nueva que parece un proyecto. También es donde se clonan los repositorios.',
      vigilando: (carpeta: string) => `Vigilando ${carpeta}`,
      sinVigilar: 'No se vigila ninguna carpeta.',
      vigilar: 'Elegir carpeta a vigilar',
      cambiarVigilada: 'Cambiar',
      dejarDeVigilar: 'Dejar de vigilar',
    },
    asistente: {
      titulo: (nombre: string) => `Preparar ${nombre}`,
      cargando: 'Analizando el proyecto…',
      origenYml: 'La receta viene del wolfcore.yml del repositorio.',
      origenDefecto: 'Receta propuesta según el tipo de proyecto.',
      deteccion: 'Lo que se detectó',
      deteccionAyuda: 'Corríjalo si algo no coincide con el proyecto.',
      tipo: 'Tipo',
      php: 'PHP',
      phpNinguno: 'Ninguno instalado',
      node: 'Node',
      python: 'Python',
      java: 'Java',
      dotnet: '.NET',
      go: 'Go',
      rust: 'Rust',
      bun: 'Bun',
      deno: 'Deno',
      zig: 'Zig',
      kotlin: 'Kotlin',
      dart: 'Dart',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
      versionAuto: 'La que detecte',
      servicios: 'Servicios',
      serviciosNinguno: 'Ninguno',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Detectado: ${v}`,
      nodeInstalar: 'No hay Node instalado: instálelo en Servicios.',
      pythonInstalar: 'No hay Python instalado: instálelo en Servicios.',
      lenguajeInstalar: (nombre: string) => `No hay ${nombre} instalado: instálelo en Servicios.`,
      dominio: 'Dominio',
      puertoProxy: 'Puerto local',
      puertoPlaceholder: '8000',
      receta: 'Pasos',
      recetaAyuda:
        'Se ejecutan en orden. Desactive los que no quiera; los opcionales se pueden mover.',
      subir: 'Subir',
      bajar: 'Bajar',
      fijo: 'Este paso es necesario',
      restaurar: 'Restaurar un respaldo…',
      cambiarRespaldo: 'Cambiar respaldo',
      quitarRespaldo: 'Quitar respaldo',
      sobrescribir: 'Sobrescribir la base si ya tiene tablas',
      semilla: 'Cargar datos de prueba (--seed)',
      sinMotor:
        'Sin base de datos: elija un motor en Servicios para crearla o restaurar un respaldo.',
      confio: 'Confío en este repositorio: ejecutar sus pasos de instalación',
      confioAyuda:
        'Los pasos ejecutan programas del proyecto (composer, npm, pip, migraciones) en su equipo. Márquelo solo si conoce el código.',
      montar: 'Montar proyecto',
      montando: 'Montando proyecto…',
      reintentar: 'Reintentar',
      omitir: 'Omitir',
      cancelar: 'Cancelar',
      cancelando: 'Cancelando…',
      cerrar: 'Cerrar',
      cerrarCorriendo: 'Ocultar (sigue en segundo plano)',
      abrirSitio: 'Abrir sitio',
      verRegistro: 'Ver registro',
      ocultarRegistro: 'Ocultar registro',
      listo: 'El proyecto quedó listo.',
      fallo: (paso: string) => `Falló: ${paso}. Reintente, omítalo o cancele; nada se deshizo.`,
      cancelada: 'Se canceló la preparación. Puede reanudarla desde la tarjeta del proyecto.',
      incompleta: 'Quedan pasos sin ejecutar.',
      errorCrear: 'No se pudo crear el proyecto',
      errorReceta: 'No se pudo leer la receta',
      recetaCambio:
        'La receta del proyecto (wolfcore.yml) cambió desde que confió en él. Reintentar usa la receta guardada de la última vez.',
      recargar: 'Revisar la receta nueva',
      seguirGuardada: 'Seguir con la guardada',
      soloLectura:
        'El tipo, PHP, dominio, versiones y puerto son los del proyecto: cámbielos con Editar.',
    },
    tarjeta: {
      receta: 'Preparación',
      reinstalar: 'Reinstalar dependencias',
      reinstalarTitulo: (nombre: string) => `¿Ejecutar la receta de ${nombre}?`,
      reinstalarTexto:
        'Se repiten los pasos de la última preparación (los que revisó en el asistente):',
      noRestaura: 'no se vuelve a restaurar',
      recetaCambio:
        'La receta del proyecto (wolfcore.yml) cambió desde que confió en él. Reinstalar repite la guardada; use "Revisar la receta" para revisar la nueva.',
      revisarReceta: 'Revisar la receta',
      preparar: 'Preparar…',
      ejecutar: 'Ejecutar',
      verPreparacion: 'Ver preparación',
      sinConfianza:
        'Revise la receta y marque "Confío en este repositorio" en el asistente para poder ejecutarla.',
      runtimes: 'Avisos de versiones',
      verRegistros: 'Ver registros',
      verEnBases: 'Ver en Bases de datos',
      abrirAgente: 'Abrir un agente de IA',
      vscode: 'Editor',
      vscodeAyuda: 'Abrir la carpeta del proyecto en el editor predeterminado',
      vscodeError: 'No se pudo abrir el editor',
      baseDatos: 'Base de datos',
      baseDatosAyuda: (base: string) =>
        `Abrir la base «${base}» ya autenticada (Adminer o phpMyAdmin)`,
      baseDatosSinDetectar: 'Abrir la base de datos del proyecto (Adminer o phpMyAdmin)',
      sinBase: 'El .env del proyecto no declara una base MySQL, MariaDB o PostgreSQL.',
      adminerNoListo: 'Adminer no está listo',
      entradaAutomatica: 'Entra ya autenticada, sin escribir la clave.',
      elegirBd: 'Elegir Adminer o phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (solo MySQL y MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin no está listo',
      entroComoAdmin: (usuario: string) =>
        `Entró como ${usuario}, el administrador del servidor, porque este proyecto no usa un usuario propio. En el gestor de .env, «Usar usuario propio» crea uno limitado a su base.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Entró como ${usuario}, el administrador del servidor: la clave del usuario propio de este proyecto no está guardada en este equipo. En el gestor de .env, «Usar usuario propio» genera una nueva.`,
      abrirSitio: 'Abrir el sitio en el navegador',
      github: 'Repositorio',
      abrirRemoto: (url: string) => `Abrir ${url}`,
      confiado: 'Confiado',
      confiadoAyuda: 'Sus pasos de instalación se pueden ejecutar.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'HEAD suelto',
      cambios: (n: number) => plural(n, 'cambio sin guardar', 'cambios sin guardar'),
      limpio: 'Sin cambios',
      atras: (n: number) => `${n} por traer`,
      adelante: (n: number) => `${n} por subir`,
      traer: 'Traer cambios',
      traerAyuda: 'git pull sin mezclar: si hay cambios locales o ramas divergidas no toca nada.',
      alDia: 'Ya estaba al día.',
      actualizado: 'Cambios traídos',
      sugeridosTitulo: 'Cambios traídos',
      sugeridosTexto: 'Según lo que cambió, conviene ejecutar estos pasos:',
      sugeridosNinguno: 'No hace falta ejecutar ningún paso.',
      migracionesNuevas: (n: number) => plural(n, 'migración nueva', 'migraciones nuevas'),
      ejecutarSugeridos: 'Ejecutar pasos',
      corridaTitulo: 'Pasos tras traer cambios',
      corridaAyuda: 'No cambia la receta guardada del proyecto.',
      ahoraNo: 'Ahora no',
      errorEstado: 'No se pudo leer el estado de Git',
      commitIa: {
        boton: 'Sugerir commit',
        ayuda:
          'Propone con IA un mensaje para lo preparado (git add) y hace el commit si usted lo acepta.',
        titulo: 'Commit con mensaje sugerido',
        proveedor: 'Proveedor de IA',
        modelo: 'Modelo',
        sinProveedores:
          'Configure un proveedor de IA en la nube (pantalla IA) para sugerir mensajes.',
        privacidad:
          'Se envía al proveedor el diff de lo preparado, sin .env, claves, certificados, archivos de credenciales ni binarios, y como mucho 20 000 caracteres. Gasta pocos tokens.',
        sugerir: 'Sugerir mensaje',
        mensaje: 'Mensaje (puede editarlo)',
        commit: 'Hacer commit',
        commitAyuda: 'Solo lo preparado (git add): no agrega archivos ni hace push.',
        hecho: 'Commit hecho con lo preparado.',
      },
    },
    procesos: {
      titulo: 'Procesos',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Terminó sin errores',
      ninguno: 'Sin procesos. Agregue npm run dev, queue:work, uvicorn…',
      agregar: 'Agregar proceso',
      editar: 'Editar proceso',
      nuevo: 'Nuevo proceso',
      interruptor: (nombre: string) => `Encender o apagar ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx envía el sitio a este proceso.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'reinicio', 'reinicios'),
      verLog: 'Ver log',
      ocultarLog: 'Ocultar log',
      logVacio: 'Sin salida todavía.',
      abrirCarpetaLog: 'Abrir carpeta del log',
      quitar: 'Quitar proceso',
      quitarTitulo: (nombre: string) => `¿Quitar el proceso ${nombre}?`,
      quitarTexto: 'Si está en marcha se detiene.',
      nombre: 'Nombre',
      nombrePlaceholder: 'Vite',
      comando: 'Comando',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Programa y argumentos, sin shell. Use comillas para argumentos con espacios.',
      cwd: 'Carpeta',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz o una subcarpeta del proyecto (por ejemplo, frontend).',
      puertoCampo: 'Puerto',
      puertoNinguno: 'Ninguno',
      puertoAyuda: 'Solo informativo, salvo que el proceso sea el destino del proxy.',
      autoIniciar: 'Encender al iniciar WolfCore Dev',
      reiniciar: 'Reiniciar si se cae',
      esProxy: 'Destino del proxy de Nginx',
      requiereReinicio:
        'El proceso está en marcha: los cambios de comando, carpeta o puerto se aplican al reiniciarlo.',
      reinicieAhora: 'Guardado. Apague y encienda el proceso para aplicar los cambios.',
      guardado: 'Proceso guardado',
      errores: {
        comando: 'Escriba el comando',
        puerto: 'El puerto debe estar entre 1 y 65535',
        proxySinPuerto: 'El destino del proxy necesita un puerto',
        cwd: 'Use raiz o una subcarpeta dentro del proyecto',
        repetido: 'Ya hay un proceso con ese nombre',
      },
      estados: {
        encendido: 'Encendido',
        apagado: 'Apagado',
        iniciando: 'Iniciando…',
        error: 'Error',
        externo: 'Externo',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Registros de ${nombre}`,
      fuente: 'Fuente',
      ninguna: 'Este proyecto todavía no tiene registros.',
      vacio: 'El registro está vacío.',
      actualizar: 'Actualizar',
      abrirCarpeta: 'Abrir carpeta',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Hay una carpeta nueva que parece un proyecto'
          : `Hay ${n} carpetas nuevas que parecen proyectos`,
      montar: 'Preparar',
      ignorar: 'Ignorar',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Correos sin leer',
    correoApagado: 'Mailpit apagado',
    correoSinInstalar: 'Mailpit sin instalar',
    modelos: 'Modelos de IA',
    iaApagada: 'Ollama apagado',
    iaSinInstalar: 'Ollama sin instalar',
    sinLeer: 'No se pudo leer',
    sinDato: '—',
  },
  /* ───────────── Panel de rendimiento, visor de registros y MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'd',
    /** Trabajador N de un servicio (p. ej. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Rendimiento',
    ventana: 'Últimos 5 minutos',
    pausado: 'En pausa mientras la ventana está oculta',
    esperando: 'Esperando la primera muestra…',
    errorMuestreo: (detalle: string) => `No se pudo pedir el muestreo de rendimiento: ${detalle}`,
    cpu: 'CPU',
    ram: 'Memoria',
    disco: 'Disco de datos',
    red: 'Red',
    deTotal: (usado: string, total: string) => `${usado} de ${total}`,
    libre: (libre: string) => `${libre} libres`,
    bajada: 'Bajada',
    subida: 'Subida',
    graficaCpu: (valor: string) => `Gráfica de CPU de los últimos 5 minutos; ahora ${valor}`,
    graficaRam: (valor: string) => `Gráfica de memoria de los últimos 5 minutos; ahora ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Gráfica de red de los últimos 5 minutos; bajada ${bajada}, subida ${subida}`,
    alertas: {
      titulo: 'Alertas',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `El puerto ${puerto} de ${servicio} lo usa otro programa: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `La memoria del equipo está al ${porcentaje} %. Apague lo que no use para que todo responda mejor.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Hay un php-cgi que no es de WolfCore Dev (PID ${pid}) escuchando en ${puertos.join(', ')}: quedó de una sesión anterior.`,
      finalizar: 'Finalizar proceso',
      finalizarTitulo: '¿Finalizar este proceso?',
      finalizarTexto: (nombre: string, pid: number) =>
        `Se cerrará ${nombre} (PID ${pid}) sin guardar lo que tenga abierto. Úselo solo si sabe que ese programa no hace falta.`,
      finalizado: (nombre: string) => `${nombre} finalizado`,
      verPuertos: 'Ver puertos',
      errorPuertos: 'No se pudo revisar qué programas usan los puertos.',
    },
    procesos: {
      titulo: 'Servicios y procesos',
      vacio: 'No hay servicios ni procesos de proyecto en marcha.',
      nombre: 'Nombre',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Puerto',
      encendido: 'Encendido',
      acciones: 'Acciones',
      detener: 'Detener',
      registros: 'Ver registros',
      servicio: 'Servicio',
      proyecto: 'Proyecto',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Registros',
    descripcion:
      'Siga en vivo los registros de Nginx, PHP, los servicios, los sitios, los procesos de proyecto y los túneles.',
    fuente: 'Fuente',
    elegirFuente: 'Elija un registro',
    sinFuentes:
      'Todavía no hay registros. Aparecen cuando un servicio, sitio o proceso escribe el primero.',
    buscar: 'Filtrar por texto',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pausar',
    reanudar: 'Reanudar',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 línea nueva en pausa' : `${n} líneas nuevas en pausa`,
    copiar: 'Copiar lo visible',
    copiadas: (n: number) => (n === 1 ? '1 línea copiada' : `${n} líneas copiadas`),
    limpiar: 'Limpiar',
    abrirCarpeta: 'Abrir carpeta',
    alFinal: 'Seguir el final',
    mostrarMas: 'Mostrar más',
    ocultas: (n: number) =>
      n === 1 ? '1 línea anterior sin mostrar' : `${n} líneas anteriores sin mostrar`,
    vacio: 'Sin líneas todavía. Las nuevas aparecen aquí en cuanto se escriben.',
    sinCoincidencias: 'Ninguna línea coincide con el filtro.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} líneas` : `${visibles} de ${total} líneas`,
    descartadas: (n: number) => `(se guardan las últimas 5000; ${n} más antiguas descartadas)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Servicios',
      sitio: 'Sitios',
      laravel: 'Laravel',
      proyecto: 'Procesos de proyecto',
      tunel: 'Túneles',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (acceso)',
      nginxError: 'Nginx (errores)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (acceso)`,
      sitioError: (dominio: string) => `${dominio} (errores)`,
      tunel: (sitio: string) => `Túnel de ${sitio}`,
      tunelSalida: (sitio: string) => `Túnel de ${sitio} (salida)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Abra una terminal nueva para ver el cambio: las terminales abiertas no lo ven.',
    enPathSinCliente: 'En el PATH, pero falta el comando',
    reparar: 'Reparar',
    repararTitulo: '¿Reparar el comando wolf?',
    repararTexto:
      'wolf está en el PATH pero sus archivos no están completos. Se volverán a copiar a la carpeta de datos y se encenderá el servidor local, como al agregarlo.',
    titulo: 'Terminal: comando wolf',
    descripcion:
      'Maneja WolfCore Dev desde PowerShell, cmd o Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Solo funciona con la app abierta.',
    activo: 'Disponible en el PATH',
    enPathSinServidor: 'En el PATH, servidor apagado',
    inactivo: 'No está en el PATH',
    agregarBoton: 'Agregar wolf al PATH',
    quitarBoton: 'Quitar wolf del PATH',
    agregarTitulo: '¿Agregar wolf al PATH del usuario?',
    agregarTexto:
      'Se copiará el comando wolf a la carpeta de datos de WolfCore Dev, se agregará esa carpeta al PATH de su usuario (se guarda una copia del PATH original) y se encenderá un servidor local en 127.0.0.1 que solo atiende a wolf con una clave que cambia en cada arranque. Publicar un sitio en internet o cambiar el PHP de todas las terminales siempre se confirma además en la ventana de la app. Puede quitarlo cuando quiera.',
    agregar: 'Agregar',
    quitarTitulo: '¿Quitar wolf del PATH?',
    quitarTexto:
      'Se quitará la carpeta de wolf del PATH de su usuario, se apagará el servidor local y se borrará el comando copiado. Las terminales abiertas no cambian.',
    quitar: 'Quitar',
    listoTitulo: 'Comando wolf actualizado',
    ayuda: 'Abra una terminal nueva después de agregarlo. El servidor solo escucha en 127.0.0.1.',
    aislado: 'Con una carpeta de datos de prueba (WOLFCORE_DATOS) el PATH no se toca.',
    errorCargar: (detalle: string) => `No se pudo leer el estado de wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Servidor MCP',
    descripcion:
      'Permite que Claude Code y otros asistentes manejen sus sitios, servicios y bases desde este equipo. Solo escucha en 127.0.0.1 y pide un token.',
    estado: 'Estado',
    activo: 'Activo',
    inactivo: 'Detenido',
    activar: 'Activar',
    detener: 'Detener',
    activado: 'Servidor MCP activo',
    detenido: 'Servidor MCP detenido',
    direccion: 'Dirección',
    puerto: 'Puerto',
    puertoAyuda: 'Entre 1024 y 65535. Si está activo, se reinicia en el puerto nuevo.',
    puertoRango: 'Use un número entre 1024 y 65535',
    puertoGuardado: (p: number) => `El servidor MCP usará el puerto ${p}`,
    copiarConfig: 'Copiar configuración para Claude Code',
    copiarConfigAyuda:
      'Copia al portapapeles la configuración con el token. Péguela en Claude Code; el token no se muestra aquí.',
    configCopiada: 'Configuración copiada al portapapeles',
    regenerar: 'Regenerar token',
    regenerarTitulo: '¿Regenerar el token del servidor MCP?',
    regenerarTexto:
      'El token actual deja de valer al instante: los asistentes conectados tendrán que usar la configuración nueva.',
    regenerado: 'Token regenerado. Copie la configuración de nuevo.',
    errorCargar: (detalle: string) => `No se pudo leer el estado del servidor MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Un asistente pide confirmación',
      herramienta: 'Herramienta',
      pendientes: (actual: number, total: number) => `${actual} de ${total}`,
      aprobar: 'Aprobar',
      rechazar: 'Rechazar',
      aprobada: 'Acción aprobada',
      rechazada: 'Acción rechazada',
      vencida: 'La solicitud ya no estaba pendiente.',
      descartadas: (n: number) =>
        n === 1
          ? 'y 1 más que no cupo (vencerá sola)'
          : `y ${n} más que no cupieron (vencerán solas)`,
      falloRespuesta: (detalle: string) =>
        `No se pudo enviar la respuesta; la solicitud sigue pendiente. ${detalle}`,
      si: 'Sí',
      no: 'No',
      campos: {
        motor: 'Motor',
        base: 'Base de datos',
        archivo: 'Archivo',
        sobrescribir: 'Sobrescribir',
        pid: 'PID',
        nombre: 'Proceso',
        proyecto: 'Proyecto',
        pasos: 'Pasos',
        cantidad: 'Volcados',
      } as Record<string, string>,
    },
  },
  captura: {
    barra: 'Herramientas de dibujo',
    herramientas: {
      recuadro: 'Recuadro',
      flecha: 'Flecha',
      linea: 'Línea',
      resaltador: 'Resaltador',
      texto: 'Texto',
      pixelar: 'Pixelar',
      pixelarAyuda: 'Pixelar (no es seguro para datos sensibles: use Ocultar)',
      ocultar: 'Ocultar',
      ocultarAyuda: 'Ocultar con un relleno sólido (recomendado para datos sensibles)',
    },
    deshacer: 'Deshacer',
    rehacer: 'Rehacer',
    copiar: 'Copiar',
    copiarAyuda:
      'Copiar al portapapeles. El portapapeles de Windows puede guardarlo en su historial o sincronizarlo con otros equipos.',
    guardar: 'Guardar…',
    alConversor: 'Enviar al conversor de imágenes',
    cerrar: 'Cancelar (Esc)',
    nuevaSeleccion: 'Nueva selección',
    color: 'Color',
    grosor: 'Grosor',
    formato: 'Formato',
    cargando: 'Preparando la captura…',
    guiaRegion: 'Arrastre para elegir la zona. Esc cancela.',
    guiaVentana: 'Elija la ventana que quiere capturar. Esc cancela.',
    sinVentanas: 'No hay ventanas que se puedan capturar.',
    textoPlaceholder: 'Escriba y pulse Intro',
    copiada: 'Copiada al portapapeles',
    guardada: (archivo: string) => `Guardada en ${archivo}`,
    errorCargar: 'No se pudo abrir la captura.',
    errorCopiar: 'No se pudo copiar la imagen.',
    errorGuardar: 'No se pudo guardar la imagen.',
    errorConversor: 'No se pudo enviar la imagen al conversor.',
    errorVentana: 'No se pudo capturar esa ventana.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Todo ocurre en este equipo: la captura no se sube a ningún servicio y no se guarda en disco hasta que usted la guarda. Las ventanas de WolfCore Dev se ocultan un instante para no salir en la imagen.',
      region: 'Región',
      regionAyuda: 'Arrastre sobre la pantalla para elegir la zona.',
      ventana: 'Ventana',
      ventanaAyuda: 'Elija una de las ventanas abiertas.',
      pantalla: 'Pantalla completa',
      pantallaAyuda: 'La pantalla donde está el cursor.',
      atajoActivo: (atajo: string) => `Atajo global activo: ${atajo} (región).`,
      atajoInactivo: 'No hay atajo global. Se activa en Ajustes.',
      noDisponible: 'La captura de pantalla no está disponible en este equipo.',
      permisoDenegado:
        'Falta el permiso de grabación de pantalla. Actívelo para WolfCore Dev en los ajustes del sistema.',
      ocupada: 'Ya hay una captura en curso.',
    },
    ajustes: {
      titulo: 'Captura de pantalla',
      descripcion:
        'Región, ventana o pantalla completa con un editor rápido. Es 100 % local: nada se sube ni se guarda hasta que usted lo decide.',
      activar: 'Atajo global',
      activarAyuda:
        'Desactivado por defecto. Al activarlo se registra solo si ningún otro programa lo usa, y se libera al cerrar WolfCore Dev.',
      atajo: 'Combinación',
      grabar: 'Cambiar',
      grabando: 'Pulse la combinación…',
      grabandoAyuda:
        'Use Ctrl o Super con otro modificador (por ejemplo Ctrl+Alt+Mayús) y una letra, un número o una tecla F. Evite los atajos comunes como Ctrl+C.',
      formato: 'Formato al guardar',
      activado: (atajo: string) => `Atajo ${atajo} activado.`,
      desactivado: 'Atajo desactivado.',
      ocupado: (atajo: string) =>
        `El atajo ${atajo} ya lo usa otro programa y no se cambió nada. Pruebe con otra combinación.`,
      ocupadoInicio:
        'El atajo guardado ya lo usa otro programa y no se registró. Elija otra combinación.',
      sinPermiso:
        'En macOS hace falta el permiso de grabación de pantalla; se le pedirá la primera vez que capture.',
      formatoGuardado: 'Formato guardado.',
    },
  },

  herramientas: {
    descripcion: 'Utilidades para el día a día. Funcionan sin conexión y sin servicios externos.',
    buscar: 'Buscar herramienta…',
    sinResultados: 'Ninguna herramienta coincide con la búsqueda.',
    abrir: 'Abrir',
    procesar: 'Procesando…',
    copiar: 'Copiar',
    copiado: 'Copiado al portapapeles',
    limpiar: 'Limpiar',
    pendienteApi: 'Pendiente: el núcleo todavía no expone esta información a la interfaz.',
    lista: {
      qr: { nombre: 'Generador de QR', descripcion: 'De un texto o del enlace de un túnel; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Formatear, validar y minificar, con árbol.' },
      regex: {
        nombre: 'Expresiones regulares',
        descripcion: 'Probador con coincidencias, grupos y referencia.',
      },
      diff: {
        nombre: 'Comparar textos',
        descripcion: 'Diferencias lado a lado, también de archivos.',
      },
      tiempo: { nombre: 'Tiempo', descripcion: 'Timestamp ↔ fecha, con zona horaria.' },
      puertos: {
        nombre: 'Puertos y procesos',
        descripcion: 'Qué escucha en cada puerto y finalizar el proceso.',
      },
      bom: { nombre: 'Limpieza BOM UTF-8', descripcion: 'Quita el BOM de archivos o carpetas.' },
      certificados: {
        nombre: 'Certificados',
        descripcion: 'Emitir con la CA de WolfCore Dev para cualquier nombre.',
      },
      cripto: {
        nombre: 'Cripto',
        descripcion: 'Hash, base64, URL, UUID, contraseñas y JWT.',
      },
      markdown: { nombre: 'Vista previa de Markdown', descripcion: 'Escriba y vea el resultado.' },
      entorno: { nombre: 'Entorno del sistema', descripcion: 'PATH, versiones y variables.' },
      buscar: {
        nombre: 'Buscar',
        descripcion: 'Texto en nombres y contenido de un proyecto, carpeta o archivo.',
      },
      infoArchivo: {
        nombre: 'Información de archivo',
        descripcion: 'Tamaño, tipo y hashes de un archivo.',
      },
      websocket: { nombre: 'Cliente WebSocket', descripcion: 'Conectar, enviar y ver mensajes.' },
      contrasenas: {
        nombre: 'Contraseñas',
        descripcion: 'Medir una contraseña y revisar las cuentas débiles de sus bases.',
      },
      qrWifi: {
        nombre: 'QR de Wi-Fi',
        descripcion: 'Código QR para que otros se conecten a su red.',
      },
      imagenes: {
        nombre: 'Imágenes',
        descripcion: 'Convertir a ICO o PNG y comprimir JPEG o WebP.',
      },
      comprimir: {
        nombre: 'ZIP y PDF',
        descripcion: 'Comprimir archivos y carpetas a ZIP y optimizar PDF.',
      },
      conversor: {
        nombre: 'Conversor de documentos',
        descripcion: 'Convertir Word, Excel, PDF, CSV y Markdown sin salir de este equipo.',
      },
      captura: {
        nombre: 'Captura de pantalla',
        descripcion: 'Región, ventana o pantalla completa, con editor rápido.',
      },
      guiaTuneles: {
        nombre: 'Guía de túneles',
        descripcion: 'Cloudflare y ngrok paso a paso, con comandos para copiar.',
      },
      guiaHttp: {
        nombre: 'Guía HTTP',
        descripcion: 'Códigos de estado y métodos, con buscador y ejemplos.',
      },
      limpiezaDisco: {
        nombre: 'Limpieza de disco',
        descripcion:
          'Analiza y borra temporales y cachés regenerables, con lista previa y confirmación.',
      },
      editor: {
        nombre: 'Editor de código',
        descripcion: 'Edita archivos de texto con resaltado, copia previa y guardado confirmado.',
      },
      diffCarpetas: {
        nombre: 'Diff de carpetas',
        descripcion:
          'Compara dos carpetas: solo en una, solo en la otra y distintos, con el diff de cada archivo.',
      },
      grabarPantalla: {
        nombre: 'Grabar pantalla',
        descripcion: 'Abre la grabadora que ya trae su sistema.',
      },
    },
    secciones: {
      codigo: 'Código',
      red: 'Red',
      seguridad: 'Seguridad',
      archivos: 'Archivos y medios',
      sistema: 'Sistema',
    },
    tarjetas: {
      comparar: {
        nombre: 'Comparar',
        descripcion: 'Textos y carpetas: las diferencias lado a lado.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'De un texto o enlace, o para que otros se conecten a su Wi-Fi.',
      },
      guias: {
        nombre: 'Guías',
        descripcion: 'HTTP y túneles, con ejemplos y comandos para copiar.',
      },
    },
    pestanas: {
      diff: 'Textos',
      diffCarpetas: 'Carpetas',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Túneles',
    },
    grabar: {
      ayuda:
        'WolfCore Dev no tiene grabadora propia: abre la que ya trae su sistema. El video queda donde esa herramienta lo guarde.',
      abrir: 'Abrir la grabadora',
      abierta: 'Se abrió Recortes. Elija el área de la pantalla y pulse Iniciar.',
      noSePudo: 'No se pudo abrir Recortes desde aquí. Use uno de los atajos de la guía.',
      guiaTitulo: 'Cómo grabar en su sistema',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Pulse Win + Shift + R para grabar con Recortes.',
            'Si no tiene Recortes actualizado, pulse Win + Alt + R para grabar con la Xbox Game Bar.',
            'Detenga la grabación con el botón de la barra que aparece arriba.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Pulse Cmd + Shift + 5 para abrir la barra de captura.',
            'Elija grabar la pantalla completa o una parte seleccionada.',
            'Pulse Grabar y, para terminar, el botón de detener de la barra de menús.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Cada escritorio trae su grabadora: en GNOME, Ctrl + Alt + Shift + R; en KDE, Spectacle.',
            'Si no tiene ninguna, instale OBS Studio o SimpleScreenRecorder desde su gestor de paquetes.',
          ],
        },
      },
    },
    errores: {
      jsonVacio: 'Escriba o pegue un JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `JSON no válido: revise la línea ${linea}, columna ${columna}.`,
      banderas: 'Banderas no válidas: use solo d, g, i, m, s, u, v o y, sin repetir.',
      regex: (detalle: string) => `Expresión no válida (${detalle}).`,
      trabajador: 'No se pudo ejecutar la operación en segundo plano.',
      diffLento: 'Los textos son demasiado distintos para compararlos a tiempo.',
      base64: 'Base64 no válido.',
      utf8: 'El contenido decodificado no es texto UTF-8.',
      url: 'Secuencia de URL no válida.',
      coste: (max: number) => `El coste de bcrypt debe estar entre 4 y ${max}.`,
      jwtPartes: 'El JWT debe tener tres partes separadas por punto.',
      jwtCabecera: 'No se pudo leer la cabecera del JWT.',
      jwtCarga: 'No se pudo leer la carga del JWT.',
      longitud: 'La longitud debe estar entre 4 y 256.',
      sinConjuntos: 'Elija al menos un tipo de carácter.',
      sinDominios: 'Escriba al menos un nombre o IP.',
      muchosDominios: (max: number) => `Como máximo ${max} nombres por certificado.`,
    },
    qr: {
      texto: 'Texto o URL',
      textoAyuda: 'El QR se genera en el equipo; nada sale a la red.',
      tunel: 'Enlace de túnel de un proyecto',
      sinTuneles: 'No hay túneles activos',
      descargar: 'Descargar PNG',
      vacio: 'Escriba algo para generar el código.',
      largo: 'El texto es demasiado largo para un QR.',
      descargado: 'Descarga iniciada.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formatear',
      minificar: 'Minificar',
      validar: 'Validar',
      valido: 'JSON válido.',
      resultado: 'Resultado',
      arbol: 'Árbol',
      mas: (n: number) => `… ${n} más`,
    },
    regex: {
      patron: 'Patrón',
      banderas: 'Banderas',
      texto: 'Texto de prueba',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'coincidencia' : 'coincidencias'}${truncado ? ' (se muestran las primeras)' : ''}`,
      sinCoincidencias: 'Sin coincidencias.',
      tiempo: 'La expresión tardó demasiado y se detuvo (posible retroceso catastrófico).',
      grupo: (n: number) => `Grupo ${n}`,
      referencia: 'Referencia rápida',
      tabla: [
        ['.', 'Cualquier carácter (salvo salto de línea sin s)'],
        ['\\d \\w \\s', 'Dígito, letra/número/_ y espacio'],
        ['\\D \\W \\S', 'Lo contrario de los anteriores'],
        ['[abc] [^abc]', 'Uno de la lista / ninguno de la lista'],
        ['^ $', 'Inicio y fin (de línea con m)'],
        ['\\b', 'Límite de palabra'],
        ['* + ?', 'Cero o más, uno o más, opcional'],
        ['{n,m}', 'Entre n y m repeticiones'],
        ['*? +?', 'Versión perezosa'],
        ['(…) (?<nombre>…)', 'Grupo de captura y con nombre'],
        ['(?:…)', 'Grupo sin captura'],
        ['(?=…) (?!…)', 'Seguido de / no seguido de'],
        ['a|b', 'Alternativa'],
        ['g i m s u y', 'Global, sin mayúsculas, multilínea, punto total, Unicode, fijo'],
      ] as [string, string][],
    },
    diff: {
      original: 'Original',
      modificado: 'Modificado',
      cargarArchivo: 'Cargar archivo',
      comparar: 'Comparar',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} líneas`,
      iguales: 'Los textos son iguales.',
      archivoGrande: 'El archivo supera 5 MB; elija uno más pequeño.',
      textoGrande: 'Cada texto puede tener como máximo 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `Se muestran las primeras ${mostradas} de ${total} filas.`,
    },
    tiempo: {
      timestamp: 'Timestamp (segundos o milisegundos)',
      fecha: 'Fecha (AAAA-MM-DD HH:mm:ss)',
      zona: 'Zona horaria',
      ahora: 'Ahora',
      segundos: 'Segundos',
      milisegundos: 'Milisegundos',
      iso: 'ISO 8601 (UTC)',
      enZona: 'En la zona elegida',
      desplazamiento: 'Desplazamiento',
      relativo: 'Relativo',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Leído en segundos' : 'Leído en milisegundos',
      timestampInvalido: 'Escriba solo cifras (puede llevar signo).',
      fechaInvalida: 'Use el formato AAAA-MM-DD HH:mm[:ss] con una fecha real.',
      zonaInvalida: 'Zona horaria desconocida.',
    },
    puertos: {
      filtro: 'Filtrar por puerto, PID o nombre',
      actualizar: 'Actualizar',
      columnas: {
        puerto: 'Puerto',
        protocolo: 'Protocolo',
        proceso: 'Proceso',
        pid: 'PID',
        direcciones: 'Direcciones',
        acciones: 'Acciones',
      },
      propio: 'WolfCore Dev',
      sistema: 'Sistema',
      finalizar: 'Finalizar',
      noFinalizable: 'Los procesos del sistema y los de WolfCore Dev no se finalizan desde aquí.',
      confirmarTitulo: 'Finalizar proceso',
      confirmarTexto: (nombre: string, pid: number) =>
        `Se cerrará "${nombre}" (PID ${pid}) sin guardar. Para confirmar, escriba el nombre del proceso:`,
      finalizado: (nombre: string) => `Se finalizó ${nombre}.`,
      vacio: 'No hay puertos en uso o no se pudieron leer.',
    },
    bom: {
      explicacion:
        'Primero se muestra qué archivos tienen BOM; al limpiar se guarda una copia .bak-bom de cada uno. Se omiten node_modules, vendor, .git y binarios.',
      elegirArchivos: 'Elegir archivos',
      elegirCarpeta: 'Elegir carpeta',
      seleccion: (n: number) => `${n} ${n === 1 ? 'ruta elegida' : 'rutas elegidas'}`,
      analizar: 'Analizar',
      limpiar: 'Quitar BOM',
      confirmar: (n: number) =>
        `Se quitará el BOM de ${n} ${n === 1 ? 'archivo' : 'archivos'} (con copia). ¿Continuar?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'archivo con BOM' : 'archivos con BOM'}`,
      sinBom: 'Ningún archivo tiene BOM.',
      limpiados: (n: number) => `Se limpiaron ${n} ${n === 1 ? 'archivo' : 'archivos'}.`,
      copia: 'Copia',
    },
    certificados: {
      explicacion:
        'Firma un certificado con la CA local de WolfCore Dev. El .crt se guarda donde elija y la clave (.key) junto a él; la clave nunca pasa por la interfaz.',
      dominios: 'Nombres o IP (separados por espacio, coma o línea)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Emitir y guardar',
      guardado: 'Certificado guardado',
      certificado: 'Certificado',
      clave: 'Clave',
    },
    cripto: {
      texto: 'Texto',
      hash: 'Hash',
      calcular: 'Calcular',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Coste de bcrypt',
      bcryptTrunca: 'bcrypt solo usa los primeros 72 bytes del texto.',
      bcryptVerificar: 'Hash bcrypt para verificar',
      verificar: 'Verificar',
      coincide: 'El texto coincide con el hash.',
      noCoincide: 'El texto no coincide con el hash.',
      base64: 'Base64',
      base64Url: 'Variante URL',
      codificar: 'Codificar',
      decodificar: 'Decodificar',
      url: 'Codificar URL',
      decodificarUrl: 'Decodificar URL',
      codificarBase64: 'Codificar base64',
      decodificarBase64: 'Decodificar base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID y contraseñas',
      uuid: 'UUID v4',
      generar: 'Generar',
      generarDiez: 'Generar 10',
      contrasena: 'Contraseña aleatoria',
      longitud: 'Longitud',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Símbolos',
      jwt: 'Decodificar JWT',
      jwtToken: 'Token',
      cabecera: 'Cabecera',
      carga: 'Carga',
      firmaNoVerificada:
        'Firma no verificada: el contenido se muestra tal cual y puede estar alterado.',
      vencido: 'El token está vencido (exp).',
      vigente: 'El token no ha vencido (exp).',
      salida: 'Resultado',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Vista previa',
      ejemplo:
        '# Título\n\nTexto con **negrita**, _cursiva_ y un [enlace](https://example.com).\n\n- Uno\n- Dos\n\n```\ncódigo\n```\n',
      seguro:
        'El HTML crudo se muestra como texto, los enlaces peligrosos se descartan y las imágenes no se cargan.',
      imagenOmitida: (alt: string) => `[imagen${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Versión de WolfCore Dev',
      navegador: 'Motor de la interfaz',
      plataforma: 'Plataforma',
      idioma: 'Idioma',
      zona: 'Zona horaria',
      nucleos: 'Núcleos lógicos',
      actualizar: 'Actualizar',
      path: 'PATH',
      pathVacio: 'El PATH está vacío.',
      herramientas: 'Herramientas de WolfCore Dev',
      noInstalada: 'No instalada',
      sinRespuesta: 'No respondió a tiempo',
      variables: 'Variables de entorno',
      filtro: 'Filtrar variables',
      enmascarada: 'Valor oculto: el nombre parece de un secreto.',
    },
    busqueda: {
      explicacion:
        'Busca en nombres y en contenido, sin seguir enlaces y sin leer binarios. Por defecto salta node_modules, vendor y .git.',
      origen: 'Dónde buscar',
      proyecto: 'Proyecto',
      elegirCarpeta: 'Elegir carpeta',
      elegirArchivo: 'Elegir archivo',
      sinOrigen: 'Elija un proyecto, una carpeta o un archivo.',
      consulta: 'Texto a buscar',
      modoNombre: 'Nombres',
      modoContenido: 'Contenido',
      modoAmbos: 'Ambos',
      regex: 'Expresión regular',
      mayusculas: 'Distinguir mayúsculas',
      incluir: 'Solo archivos (separe con comas, p. ej. *.php)',
      excluir: 'Saltar además (separe con comas)',
      buscar: 'Buscar',
      cancelar: 'Cancelar',
      buscando: 'Buscando…',
      sinResultados: 'Sin coincidencias.',
      truncado: 'Hay más resultados de los que se muestran: afine la búsqueda.',
      cancelada: 'Búsqueda cancelada.',
      abrir: 'Abrir en el editor',
      incluirPesadas: 'Incluir carpetas pesadas (node_modules, vendor, .git…)',
      contexto: 'Líneas de contexto',
      grupoNombres: (n: number) => `Por nombre (${n})`,
      grupoContenido: (n: number) => `Por contenido (${n})`,
      carpeta: 'carpeta',
      listaAria: 'Resultados de la búsqueda',
      atajos:
        '↑ ↓ para moverse, Enter para abrir en el editor, Esc para cancelar o volver al texto.',
      sensible: (n: number) =>
        `Archivo sensible: coincidencia en la línea ${n} (no se muestra su contenido).`,
      mostrarMas: (n: number) => `Mostrar ${n} más`,
      linea: (n: number) => `línea ${n}`,
      sinGrupo: 'Sin resultados en este grupo.',
      topeBytes: 'Se alcanzó el tope de lectura: afine la búsqueda.',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'coincidencia' : 'coincidencias'}`,
      resumen: (archivos: number, examinados: number) =>
        `en ${archivos} ${archivos === 1 ? 'archivo' : 'archivos'} (${examinados} revisados)`,
    },
    diffCarpetas: {
      explicacion:
        'Compara dos carpetas sin cambiar nada en ellas: lo que solo está en una, lo que solo está en la otra y lo que es distinto. No sigue enlaces y trabaja en un proceso aparte.',
      carpetaA: 'Carpeta A',
      carpetaB: 'Carpeta B',
      elegir: 'Elegir carpeta',
      sinElegir: 'Sin elegir',
      comparar: 'Comparar',
      comparando: 'Comparando…',
      cancelar: 'Cancelar',
      cancelada: 'Comparación cancelada.',
      iguales: 'Las dos carpetas son iguales.',
      grupoSoloA: 'Solo en A',
      grupoSoloB: 'Solo en B',
      grupoDistintos: 'Distintos',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'Ninguno',
      resumen: (a: number, b: number, iguales: number) =>
        `A: ${a} archivos · B: ${b} archivos · ${iguales} iguales`,
      truncado: 'Se alcanzó un tope (archivos, profundidad o tamaño): la lista no está completa.',
      recortado: (mostrados: number, total: number) =>
        `Hay más archivos de los que se muestran (${mostrados} de ${total}).`,
      sinComparar: (n: number) =>
        `${n} archivos grandes con el mismo tamaño no se compararon por contenido.`,
      omitidos: (n: number) => `${n} enlaces, uniones o elementos especiales se saltaron.`,
      motivoTamano: 'distinto tamaño',
      motivoContenido: 'mismo tamaño, distinto contenido',
      tamano: (a: string, b: string) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Elija un archivo «distinto» de la lista para ver su diferencia.',
      soloEnUno: (lado: string) => `Este archivo solo existe en ${lado}.`,
      cargando: 'Leyendo los archivos…',
      binario: 'Los archivos son distintos, pero no son de texto: no se muestra el diff.',
      sensible:
        'Archivo sensible (.env, claves o datos reales): es distinto, pero no se muestra su contenido. Puede abrirlo en el editor, que pide una confirmación reforzada.',
      tope: (kb: number) =>
        `Los archivos son distintos, pero pasan de ${kb} KB: no se muestra el diff de texto.`,
      demasiadoDistinto: 'Los archivos son tan distintos que no se muestra el diff línea a línea.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'saltos mezclados',
        ninguno: 'sin saltos de línea',
      },
      saltosDistintos: (a: string, b: string) => `Saltos de línea: A usa ${a} y B usa ${b}.`,
      soloSaltos:
        'El texto de las líneas es el mismo: solo cambian los saltos de línea (incluido el del final del archivo) o el BOM.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${agregadas} líneas agregadas, ${quitadas} quitadas`,
      truncadoArchivo: 'Se muestran solo las primeras filas.',
      lineasIguales: (n: number) => `… ${n} líneas iguales …`,
      abrirA: 'Abrir A en el editor',
      abrirB: 'Abrir B en el editor',
      atajos: '↑ ↓ para moverse, Enter para ver la diferencia, Esc para cancelar.',
      listaAria: (grupo: string) => `Archivos: ${grupo}`,
      detalleAria: 'Diferencias del archivo',
    },
    infoArchivo: {
      elegir: 'Elegir archivo',
      ayuda: 'Se lee en el equipo para calcular los hashes (máximo 200 MB).',
      nombre: 'Nombre',
      tamano: 'Tamaño',
      tipo: 'Tipo',
      modificado: 'Modificado',
      sinTipo: 'Desconocido',
      grande: 'El archivo supera 200 MB: se muestran los datos sin hashes.',
      calculando: 'Calculando hashes…',
    },
    websocket: {
      url: 'URL (ws:// o wss://)',
      conectar: 'Conectar',
      desconectar: 'Desconectar',
      mensaje: 'Mensaje',
      enviar: 'Enviar',
      urlInvalida: 'Escriba una URL que empiece por ws:// o wss://.',
      conectando: 'Conectando…',
      conectado: 'Conectado',
      desconectado: 'Desconectado',
      error: 'Error de conexión',
      cerrado: (codigo: number, motivo: string) =>
        `Cerrado (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Enviado',
      recibido: 'Recibido',
      binario: (n: number) => `[binario, ${n} bytes]`,
      vacio: 'Sin mensajes todavía.',
      tope: 'Se guardan los últimos 500 mensajes; cada uno se muestra hasta 10 KB.',
    },
    qrWifi: {
      ssid: 'Nombre de la red (SSID)',
      clave: 'Contraseña',
      seguridad: 'Seguridad',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Sin contraseña',
      oculta: 'Red oculta',
      mostrar: 'Mostrar',
      ocultar: 'Ocultar',
      aviso:
        'El código QR contiene la contraseña tal cual: quien lo vea o lo fotografíe puede conectarse a su red. Se genera aquí, no se guarda y se borra al cerrar este panel.',
      avisoPng:
        'El PNG que se descarga también lleva la contraseña dentro del código: guárdelo donde solo usted lo vea.',
      escribala:
        'La contraseña la escribe usted: WolfCore Dev nunca lee las contraseñas de Wi-Fi guardadas en el sistema.',
      errorSsid: 'Escriba el nombre de la red (hasta 32 caracteres).',
      errorClave: 'Escriba la contraseña.',
      errorClaveWpa: 'Una contraseña WPA tiene entre 8 y 63 caracteres.',
      vacio: 'Complete los datos para ver el código.',
      alt: 'Código QR para conectarse a la red Wi-Fi',
      descargar: 'Descargar PNG',
      descargado: 'QR guardado',
      largo: 'Los datos son demasiado largos para un QR.',
    },
    imagenes: {
      elegir: 'Elegir imagen',
      ayuda:
        'Se procesa en este equipo (hasta 30 MB y 12000 px por lado). El original no se modifica: el resultado es un archivo nuevo.',
      original: 'Original',
      accion: 'Qué hacer',
      aIco: 'Convertir a ICO',
      aPng: 'Convertir a PNG',
      comprimir: 'Comprimir',
      tamanos: 'Tamaños del ICO',
      formato: 'Formato',
      calidad: 'Calidad',
      ladoMax: 'Lado máximo en px (vacío = el original)',
      procesar: 'Procesar',
      procesando: 'Procesando…',
      guardar: 'Guardar como…',
      antes: 'Antes',
      despues: 'Después',
      sinMejora: 'El resultado no pesa menos que el original: pruebe con otra calidad o formato.',
      errorAbrir: 'No se pudo abrir la imagen en este equipo.',
      errorProcesar: 'No se pudo procesar la imagen.',
      sufijoConvertida: '-convertida',
      sufijoComprimida: '-comprimida',
      nombreCaptura: 'captura-de-pantalla',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % menos`
          : porcentaje < 0
            ? `${-porcentaje} % más`
            : 'sin cambio',
      guardado: (archivo: string) => `Guardado en ${archivo}`,
    },
    comprimir: {
      zip: 'Comprimir a ZIP',
      zipAyuda:
        'Elija archivos o carpetas. No se siguen enlaces y el ZIP es un archivo nuevo: nunca se sobrescribe uno existente.',
      agregarArchivos: 'Agregar archivos',
      agregarCarpeta: 'Agregar carpeta',
      quitar: 'Quitar',
      vacio: 'Aún no hay nada elegido.',
      crearZip: 'Crear ZIP…',
      creando: 'Creando…',
      pdf: 'Optimizar PDF',
      pdfAyuda:
        'Se vuelve a guardar con flujos de objetos, en un hilo aparte. Solo se crea el archivo si pesa menos; no se abren PDF protegidos con contraseña. El original no se toca. Ojo: al re-guardar se pierden las firmas digitales y el cumplimiento de PDF/A.',
      elegirPdf: 'Elegir PDF',
      optimizar: 'Optimizar…',
      optimizando: 'Optimizando…',
      antes: 'Antes',
      despues: 'Después',
      sinMejora: 'El PDF no pesaría menos al optimizarlo: no se creó ningún archivo.',
      sufijoOptimizado: '-optimizado',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'enlace, carpeta ilegible o archivo especial no se incluyó' : 'enlaces, carpetas ilegibles o archivos especiales no se incluyeron'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'archivo' : 'archivos'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % menos`
          : porcentaje < 0
            ? `${-porcentaje} % más`
            : 'sin cambio',
      guardado: (archivo: string) => `Guardado en ${archivo}`,
    },
    conversor: {
      ayuda:
        'Se convierte en este equipo: el documento no se sube a ningún sitio. El original no se modifica; el resultado es un archivo nuevo y nunca se sobrescribe uno existente.',
      elegir: 'Elegir documento',
      tipoNoSoportado:
        'No hay conversiones para ese tipo de archivo. Se admiten docx, xlsx, csv, md, html y pdf (y odt, pptx y doc con LibreOffice).',
      convertirA: 'Convertir a',
      convertir: 'Convertir…',
      convirtiendo: 'Convirtiendo…',
      avisoLibreOffice:
        'Esta conversión usa LibreOffice, que ya está instalado en este equipo. WolfCore Dev no lo instala ni lo descarga: lo abre sin ventana y con un perfil temporal.',
      sinLibreOffice:
        'Si instala LibreOffice también podrá convertir odt, pptx y doc (WolfCore Dev no lo instala).',
      limites:
        'Por seguridad hay límites: hasta 50 MB (10 MB para md y html), 120 s, 200 000 filas, 1000 columnas y 5 millones de celdas; los archivos que parecen un ZIP bomba o traen entidades XML se rechazan.',
      guardado: (archivo: string) => `Guardado en ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Fortaleza',
      pestanaAuditar: 'Auditar una base',
      fortaleza: {
        etiqueta: 'Contraseña a medir',
        marcador: 'Escriba una contraseña',
        privacidad: 'Se mide aquí mismo: nada sale de su equipo ni se guarda.',
        mostrar: 'Mostrar',
        ocultar: 'Ocultar',
        niveles: ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'],
        sinAvisos: 'Sin observaciones.',
        estimacion: 'Es una estimación, no una garantía.',
        avisos: {
          straightRow: 'Una fila de teclas seguidas es fácil de adivinar.',
          keyPattern: 'Los patrones de teclado cortos son fáciles de adivinar.',
          simpleRepeat: 'Repetir un carácter o un grupo apenas la refuerza.',
          extendedRepeat: 'Los grupos repetidos son fáciles de adivinar.',
          sequences: 'Las secuencias como abc o 6543 son fáciles de adivinar.',
          recentYears: 'Evite años recientes y fechas ligadas a usted.',
          dates: 'Evite fechas: son fáciles de adivinar.',
          topTen: 'Está entre las diez contraseñas más usadas.',
          topHundred: 'Está entre las cien contraseñas más usadas.',
          common: 'Es una contraseña muy usada.',
          similarToCommon: 'Se parece a una contraseña muy usada.',
          wordByItself: 'Una palabra suelta es fácil de adivinar.',
          namesByThemselves: 'Un nombre o apellido suelto es fácil de adivinar.',
          commonNames: 'Los nombres y apellidos comunes son fáciles de adivinar.',
          userInputs: 'No use datos que otros conozcan de usted.',
          l33t: 'Cambiar letras por símbolos previsibles (@ por a) ayuda poco.',
          reverseWords: 'Escribir las palabras al revés ayuda poco.',
          allUppercase: 'Poner todo en mayúsculas ayuda poco.',
          capitalization: 'Poner la primera letra en mayúscula ayuda poco.',
          associatedYears: 'Evite años asociados a usted.',
          repeated: 'Evite palabras y caracteres repetidos.',
          longerKeyboardPattern: 'Use un patrón de teclado más largo y cambie de dirección.',
          anotherWord: 'Añada una o dos palabras más; las poco comunes ayudan.',
          useWords: 'Varias palabras al azar forman una buena contraseña.',
          noNeed: 'Se puede ser seguro sin símbolos ni números: lo que cuenta es el largo.',
        },
      },
      auditar: {
        limite:
          'Esto detecta solo contraseñas muy comunes: compara cada hash con una lista corta de unas 200. No es un ataque ni una prueba de fuerza bruta. Que una cuenta no salga marcada no quiere decir que su contraseña sea buena.',
        privacidad:
          'Nunca se muestra cuál contraseña coincidió, y se lee con un usuario temporal solo de lectura (en PostgreSQL, con la sesión en solo lectura). Úsela solo en sus propias bases.',
        motor: 'Motor',
        base: 'Base de datos',
        tabla: 'Tabla',
        columnaUsuario: 'Columna del usuario',
        columnaHash: 'Columna del hash',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Encienda el servidor desde Bases de datos para revisar sus bases.',
        sinBases: 'No hay bases en este servidor.',
        sinMotores: 'No hay un servidor de MySQL, MariaDB o PostgreSQL propio.',
        revisar: 'Revisar',
        revisando: 'Revisando…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'cuenta revisada' : 'cuentas revisadas'} · ${d} ${d === 1 ? 'débil' : 'débiles'}`,
        sinDebiles: 'Ninguna cuenta revisada coincide con una contraseña muy común.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? 'cuenta no se pudo revisar' : 'cuentas no se pudieron revisar'}:`,
        truncado:
          'La revisión se cortó por el tope de 10 000 filas o de 60 segundos: quedaron cuentas sin revisar.',
        usuario: 'Usuario',
        motivo: 'Motivo',
        accion: 'Acción',
        motivos: {
          comun: 'Contraseña muy común',
          formato_debil: 'Formato débil (md5 o sha1 sin sal)',
        },
        restablecer: 'Restablecer',
        mas: (n: number) => `y ${n} más (se muestran las primeras 200)`,
        esquema: 'Esquema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Cancelar',
        cancelando: 'Cancelando…',
        cancelada: 'Auditoría cancelada.',
        progreso: (a: number, b: number) => `Revisadas ${a} de ${b}`,
        tiposNoRevisables: {
          vacio: 'hash vacío',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (no disponible en este equipo o con parámetros fuera del tope)',
          bcrypt_otro: 'bcrypt con costo fuera de rango o variante $2x$',
          pbkdf2_otro: 'PBKDF2 con parámetros fuera del tope',
          ldap: 'formato LDAP ({SHA}…)',
          otro: 'formato desconocido',
        },
        rlsActiva:
          'La tabla tiene seguridad por filas (RLS): la auditoría ve solo las filas que la política permite al rol limitado, así que puede faltar alguna cuenta.',
        falsoPositivo:
          'Un valor de 32 o 40 caracteres hexadecimales se toma por md5 o sha1, pero podría ser otra cosa (un token, por ejemplo). Si la columna no guarda contraseñas, el resultado no sirve.',
      },
      restablecer: {
        titulo: (u: string) => `Restablecer la contraseña de ${u}`,
        ayuda:
          'No se puede recuperar una contraseña: se pone una nueva. Antes se toma una instantánea de la base y se guarda una copia de la fila.',
        cargando: 'Preparando la vista previa…',
        sentencia: 'Se ejecutará (los valores van aparte y no se muestran)',
        formatoActual: (f: string) => `Formato actual: ${f}`,
        cambiaFormato:
          'La cuenta pasará a bcrypt: la aplicación debe poder verificarlo (por ejemplo con password_verify); si no, nadie podrá entrar con esa cuenta.',
        nueva: 'Contraseña nueva',
        generar: 'Generar una',
        mostrar: 'Mostrar',
        ocultar: 'Ocultar',
        anotar: 'Anótela ahora: no se vuelve a mostrar ni se guarda.',
        escribaUsuario: (u: string) => `Para confirmar, escriba el usuario: ${u}`,
        confirmar: 'Restablecer contraseña',
        cancelar: 'Cancelar',
        cerrar: 'Cerrar',
        hecho: 'Contraseña restablecida.',
        copiaFila: 'Copia de la fila (identificación y hash anterior, se conserva 30 días):',
        instantanea: 'Instantánea previa de la base:',
        instantaneaAyuda: 'Se puede volver a ella desde Bases de datos › Instantáneas.',
        aBcrypt: 'Pasar a bcrypt: solo si la aplicación usa password_verify o algo equivalente',
        avisoLegado:
          'Este hash es md5 o sha1 sin sal y se conserva en ese formato. Si la aplicación guarda la sal aparte (en otra columna o en una constante), el hash no se puede reproducir y la contraseña nueva no serviría para entrar.',
        datosReales: {
          titulo: 'Base con datos reales',
          texto:
            'Esta base es de un sitio marcado con datos reales de clientes: restablecer una contraseña cambia una cuenta de verdad.',
          casilla: 'Entiendo que son datos reales y quiero restablecer esta contraseña',
        },
        rlsActiva:
          'La tabla tiene seguridad por filas (RLS): si la política oculta esta cuenta al rol limitado, no se podrá restablecer.',
        copiaSinRestringir:
          'No se pudo limitar esa copia al usuario de este equipo: revise los permisos de la carpeta.',
      },
    },
  },
  doctor: {
    descripcion:
      'Revisa puertos, certificados, el archivo hosts, el PATH, Visual C++, el antivirus y los servicios, y propone cómo repararlos.',
    revisarAhora: 'Revisar ahora',
    revisando: 'Revisando…',
    sinRevision: 'Todavía no hay una revisión. Pulse «Revisar ahora».',
    sinHallazgos: 'Todo en orden: no se encontraron problemas.',
    gravedades: { error: 'Errores', aviso: 'Avisos', info: 'Información' },
    evidencia: 'Lo que se vio',
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Puerto {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Puerto {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Rango reservado {desde}-{hasta} (incluye {puerto})',
      ca_vencida: 'La CA venció hace {dias} días',
      ca_por_vencer: 'La CA vence en {dias} días',
      certificado_vencido: 'El certificado de {dominio} venció hace {dias} días',
      certificado_por_vencer: 'El certificado de {dominio} vence en {dias} días',
      firefox_perfiles: 'Perfiles de Firefox sin la confianza:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (abierto)',
      firefox_perfil_fuera: '{perfil} (fuera de la carpeta de Firefox)',
      hosts_ilegible: '{ruta}: no se pudo leer ({motivo})',
      hosts_codificacion: '{ruta}: codificación {codificacion}',
      hosts_bloques: '{ruta}: {bloques} bloques de WolfCore Dev',
      hosts_sin_cierre: '{ruta}: un bloque de WolfCore Dev no tiene su marca de cierre',
      hosts_faltan: 'Faltan en hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: atributo de solo lectura',
      path_repetidas: 'Repetidas: {entradas}',
      path_delante:
        '{entrada} está antes que las herramientas de WolfCore Dev y también tiene {programa}',
      antivirus_sin_leer:
        'El antivirus está activo; no se pudieron leer sus exclusiones (hace falta administrador).',
      antivirus_sin_exclusion:
        'El antivirus está activo y la carpeta de datos de WolfCore Dev no está excluida.',
      enlazador_ausente: 'No se encontraron las herramientas de C++ de Visual Studio Build Tools.',
      vcredist_ausente: 'No está instalado Microsoft Visual C++ 2015-2022 (x64).',
      firewall_no_comprobado:
        'No se pudieron leer las reglas del cortafuegos (puede hacer falta administrador).',
      firewall_reglas: 'WolfCore Dev: {propias} · Restos de pruebas de WolfCore: {pruebas}',
      firewall_acotadas: 'Reglas acotadas a la red local:',
      firewall_ajenas: 'Reglas de otros programas:',
      firewall_quitadas: 'Reglas quitadas que se pueden restaurar:',
    },
    requiereAdmin: 'Pide permiso de administrador',
    comandoManual: 'Comando para una consola de administrador (no se ejecuta solo):',
    copiar: 'Copiar comando',
    copiado: 'Comando copiado.',
    reparar: 'Reparar',
    ver: 'Ver',
    verPuertos: 'Ver puertos',
    alternativa: 'Mover el puerto de WolfCore Dev',
    soloInforma: 'WolfCore Dev no cambia esto por su cuenta: siga las indicaciones.',
    dialogo: {
      titulo: 'Confirmar la reparación',
      queHara: 'Esto es lo que se hará:',
      admin: 'Windows le pedirá permiso de administrador.',
      reglas: 'Reglas afectadas: desmarque las que no quiera tocar.',
      sinSeleccion: 'Marque al menos una regla para continuar.',
      reglasNota:
        'Nada cambia sin su confirmación y el permiso de administrador. Si una regla cambió desde que se mostró, se salta.',
      puerto: (p: string | number) => `El nuevo puerto será ${p}.`,
      aplicar: 'Aplicar',
      cancelar: 'Cancelar',
    },
    estados: {
      aplicando: 'Aplicando…',
      hecha: 'Reparación aplicada.',
      fallida: 'No se pudo reparar.',
    },
    revisiones: {
      puertos: 'Puertos',
      'rangos-reservados': 'Rangos reservados',
      ca: 'Autoridad de certificados',
      certificados: 'Certificados',
      confianza: 'Confianza de la CA',
      hosts: 'Archivo hosts',
      path: 'PATH del usuario',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Enlazador de C++',
      antivirus: 'Antivirus',
      firewall: 'Cortafuegos',
      servicios: 'Servicios',
    },
    reparaciones: {
      cambiar_puerto: 'Cambiar el puerto de WolfCore Dev a uno libre. El otro programa no se toca.',
      puerto_manual:
        'Mover el puerto de WolfCore Dev fuera del rango reservado. Liberar el rango lo decide usted con el comando que se muestra.',
      detener_iis:
        'Detener el servicio de IIS (W3SVC) para liberar el puerto. No se deshabilita: vuelve a arrancar al reiniciar Windows.',
      regenerar_ca:
        'Crear una autoridad de certificados nueva, confiarla en Windows (le pedirá confirmación), volver a emitir los certificados y quitar la anterior. Antes se guarda una copia.',
      regenerar_certificados: 'Volver a emitir los certificados de los sitios y recargar Nginx.',
      hosts_reescribir:
        'Reescribir el bloque de WolfCore Dev en el archivo hosts en UTF-8, con una copia previa. Las líneas ajenas no se tocan.',
      hosts_solo_lectura: 'Quitar el atributo de solo lectura del archivo hosts.',
      path_duplicados:
        'Quitar las entradas repetidas de WolfCore Dev del PATH del usuario, con copia del valor anterior. Las ajenas no se tocan.',
      path_ajeno:
        'Otra herramienta está antes en el PATH. WolfCore Dev no la quita: cámbiela de lugar si lo necesita.',
      instalar_vcredist:
        'Instalar Visual C++ 2015+ x64 con winget. El instalador de Microsoft pide su propio permiso.',
      instalar_build_tools:
        'Instale las Build Tools de Visual Studio (con las herramientas de C++) con el comando que se muestra: pesan varios GB y piden permiso de administrador, así que lo decide usted.',
      antivirus:
        'Agregar la carpeta de datos a las exclusiones del antivirus lo decide usted, con el comando que se muestra.',
      firewall:
        'Quitar esas reglas de entrada del cortafuegos, una por una y por su nombre exacto. Antes se guarda una copia en etc/cortafuegos-quitadas.json para poder recrearlas. Las reglas de otros programas nunca se tocan.',
      firewall_restaurar:
        'Volver a crear las reglas que marque, con los mismos programa, perfil, protocolo, puertos y direcciones que se muestran, a partir de la copia protegida (no del archivo de etc/). Esos programas volverán a poder recibir conexiones de la red.',
      reintentar_servicio: 'Volver a iniciar el servicio.',
      firefox_confianza:
        'Agregar en el user.js de cada perfil de Firefox la preferencia que confía en la autoridad de Windows, con una copia previa. prefs.js no se toca y los perfiles abiertos se saltan.',
    },
    confianza: {
      titulo: 'Confianza de la CA',
      texto:
        'Windows ya confía en la autoridad de WolfCore Dev; Node, Python y Firefox usan su propio almacén.',
      sinCa: 'Todavía no hay autoridad de certificados. Créela desde HTTPS para usar esta sección.',
      node: {
        titulo: 'Node',
        proyectos:
          'Los procesos de proyecto y la Terminal reciben NODE_EXTRA_CA_CERTS con la autoridad.',
        ajena: 'Ya tiene su propia NODE_EXTRA_CA_CERTS: WolfCore Dev no la reemplaza.',
        global: 'También como variable del usuario (para otras terminales y programas)',
        confirmarActivar:
          'Se fijará NODE_EXTRA_CA_CERTS como variable de su usuario. Afecta a los programas que abra después; se quita al desactivar esta opción.',
        confirmarDesactivar: 'Se quitará la variable NODE_EXTRA_CA_CERTS que puso WolfCore Dev.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Los proyectos con .venv reciben REQUESTS_CA_BUNDLE y SSL_CERT_FILE con las raíces de certifi (o las de Windows) más la autoridad. Nunca solo la autoridad.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'No se encontraron perfiles de Firefox.',
        activo: 'Confía',
        inactivo: 'No confía',
        abierto: 'Abierto',
        fuera: 'Fuera de la carpeta de Firefox',
        avisoFuera: (lista: string) =>
          `Estos perfiles están fuera de la carpeta de Firefox y no se tocan salvo que lo marque: ${lista}.`,
        incluirFuera: 'Cambiar también los perfiles fuera de la carpeta de Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'perfil fuera de la carpeta de Firefox no se tocó', 'perfiles fuera de la carpeta de Firefox no se tocaron')}.`,
        activar: 'Activar en Firefox',
        quitar: 'Quitar de Firefox',
        confirmarActivar:
          'Se agregará security.enterprise_roots.enabled en el user.js de cada perfil, entre marcas de WolfCore Dev y con una copia previa en etc/respaldos. prefs.js no se toca. Los perfiles con Firefox abierto se saltan: ciérrelo antes.',
        confirmarQuitar:
          'Se quitará el bloque de WolfCore Dev del user.js de cada perfil (con copia previa). Sus otras preferencias quedan igual.',
        resultadoOk: (n: number) => `Listo en ${plural(n, 'perfil', 'perfiles')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'perfil se saltó', 'perfiles se saltaron')} porque Firefox está abierto. Ciérrelo y vuelva a intentarlo.`,
        resultadoError: (n: number) =>
          `${plural(n, 'perfil no se pudo', 'perfiles no se pudieron')} cambiar.`,
      },
      confirmar: 'Confirmar',
      cancelar: 'Cancelar',
    },
  },
  php: {
    descripcion:
      'php.ini y extensiones de cada versión de PHP instalada. Antes de guardar se muestra el diff, se prueba con php -v y se guarda una copia con fecha; si PHP no vuelve a arrancar, se restaura el anterior.',
    rama: 'Versión de PHP',
    sinPhp: 'No hay PHP instalado. Instálelo desde Servicios.',
    irServicios: 'Ir a Servicios',
    pestanas: { ini: 'php.ini', extensiones: 'Extensiones' },
    rapidosTitulo: 'Valores rápidos',
    rapidosAyuda: 'Se aplican al texto de abajo; nada se guarda hasta confirmar el diff.',
    aplicarRapidos: 'Aplicar al texto',
    sinValor: 'sin definir',
    rapidos: {
      memory_limit: 'Memoria por script (memory_limit)',
      upload_max_filesize: 'Tamaño máximo de subida (upload_max_filesize)',
      post_max_size: 'Tamaño máximo de POST (post_max_size)',
      max_execution_time: 'Tiempo máximo en segundos (max_execution_time)',
      display_errors: 'Mostrar errores (display_errors)',
      error_reporting: 'Nivel de errores (error_reporting)',
      'date.timezone': 'Zona horaria (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Las líneas que empiezan con ; son comentarios.',
    sinCambios: 'No hay cambios respecto de lo guardado.',
    descartar: 'Descartar cambios',
    revisar: 'Revisar y guardar',
    diffTitulo: (rama: string) => `Cambios en el php.ini de PHP ${rama}`,
    diffAyuda:
      'Se guardará una copia con fecha, se probará con php -v y, si PHP está encendido, se reiniciará.',
    guardar: 'Guardar y aplicar',
    cancelar: 'Cancelar',
    guardado: (respaldo: string) => `php.ini guardado. Copia previa: ${respaldo}`,
    respaldosTitulo: 'Copias con fecha',
    sinRespaldos: 'Todavía no hay copias.',
    restaurar: 'Restaurar',
    confirmarRestaurar: (nombre: string) =>
      `¿Restaurar ${nombre}? El php.ini actual se guarda antes como otra copia.`,
    restaurado: 'Copia restaurada.',
    recargar: 'Volver a leer',
    extensiones: {
      ayuda:
        'Solo se activan las extensiones que trae esta compilación en ext/. Las de terceros se instalan del catálogo (variante de esta compilación y huella SHA-256 verificada).',
      activa: 'Activa',
      inactiva: 'Inactiva',
      falta: 'Falta el archivo',
      catalogo: 'Catálogo',
      instalar: 'Instalar',
      instalada: (nombre: string) => `${nombre} instalada y activada.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} activada.` : `${nombre} desactivada.`,
      buscar: 'Buscar extensión',
      vacio: 'No hay extensiones que coincidan.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI y Antigravity CLI: detéctelos o instálelos y ábralos en un proyecto. Los que lo permiten se conectan al MCP de WolfCore Dev. Ninguno se abre solo.',
    recargar: 'Volver a detectar',
    notaMcp:
      'El MCP registrado solo autentica cuando el agente se abre desde WolfCore Dev ("Abrir en un proyecto"): el token va en la variable WOLFCORE_MCP_TOKEN de esa terminal y nunca queda escrito en la configuración del agente. Abierto por fuera, el agente ve la entrada «wolfcore» pero no puede conectarse.',
    sitioElegido: (nombre: string) => `Elija un agente para abrirlo en ${nombre}.`,
    instalado: 'Instalado',
    noInstalado: 'No instalado',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Versión desconocida',
    verVersion: 'Ver versión',
    verVersionAyuda: 'Ejecuta el programa con --version (no se hace solo al abrir la pantalla).',
    origen: {
      propio: 'Instalado por WolfCore Dev',
      'npm-usuario': 'npm global del usuario',
      ejecutable: 'Programa del sistema',
    },
    mcpRegistrado: 'MCP registrado',
    mcpSinRegistrar: 'MCP sin registrar',
    tokenEscrito:
      'El archivo del agente traía el token del MCP escrito: ya no lo tiene y la copia previa lo guarda enmascarado (***). Considere regenerar el token del servidor MCP.',
    mcpNoSoportado:
      'Su documentación no permite tomar el token de una variable de entorno: WolfCore Dev no le registra el MCP (el token nunca se escribe en archivos).',
    instalar: 'Instalar',
    instalando: 'Instalando…',
    guia: 'Guía de instalación',
    soloGuia:
      'WolfCore Dev no lo instala (su instalador no tiene huella fija): siga la guía oficial.',
    registrar: 'Registrar MCP',
    quitar: 'Quitar MCP',
    abrir: 'Abrir en un proyecto',
    confirmarInstalar: {
      titulo: (nombre: string) => `¿Instalar ${nombre}?`,
      texto: (paquete: string) =>
        `Se instala la última versión publicada de ${paquete} desde registry.npmjs.org, con el Node de WolfCore Dev y en su carpeta de datos.`,
      aislado: 'No usa su configuración de npm ni toca su npm global. Puede tardar varios minutos.',
      aceptar: 'Instalar',
      hecho: (nombre: string) => `${nombre} quedó instalado.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `¿Registrar el MCP en ${nombre}?`,
      texto:
        'Se agrega (o actualiza) solo la entrada «wolfcore» de este archivo; lo demás queda igual:',
      aceptar: 'Registrar',
      hecho: (nombre: string) => `MCP registrado en ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `¿Quitar el MCP de ${nombre}?`,
      texto: 'Se quita solo la entrada «wolfcore» de este archivo; lo demás queda igual:',
      aceptar: 'Quitar',
      hecho: (nombre: string) => `MCP quitado de ${nombre}.`,
    },
    copiaPrevia:
      'Antes de tocarlo se guarda una copia con fecha junto al archivo (<archivo>.wolfcore-AAAAMMDD-HHmmss.bak); se conservan las 5 más nuevas. Si el agente está abierto, ciérrelo antes.',
    copiaHecha: (ruta: string) => `Copia previa: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Abrir ${nombre}`,
      proyecto: 'Proyecto',
      sinProyectos: 'Todavía no hay proyectos.',
      proveedor: 'Proveedor de IA',
      proveedorPropio: 'El que el agente tenga configurado',
      proveedorAyuda:
        'Con un proveedor, su clave va solo en el entorno de esa terminal: no se escribe en archivos ni en la línea de órdenes.',
      aceptar: 'Abrir terminal',
      hecho: (nombre: string) => `${nombre} se abrió en una terminal nueva.`,
    },
    costo: {
      titulo: 'Antes de abrir un agente',
      texto:
        'Un agente de IA trabaja con su cuenta del proveedor: cada pedido consume tokens y puede costar dinero. También puede leer y cambiar los archivos del proyecto y ejecutar comandos.',
      nunca:
        'WolfCore Dev nunca abre un agente por su cuenta: siempre lo pide usted. Este aviso se muestra una sola vez.',
      aceptar: 'Entendido, abrir',
    },
  },
  depuracion: {
    descripcion:
      'Vea aquí los dump(), dd() y wd() de sus sitios PHP y los wolfdump de sus procesos Python, con archivo y línea. La página sigue respondiendo igual.',
    receptor: 'Captura de dumps',
    escuchando: (direccion: string, puerto: number) => `Escuchando en ${direccion}:${puerto}`,
    apagado: 'Apagada',
    memoria:
      'Los volcados quedan solo en memoria (los últimos 500) y se pierden al cerrar. Pueden llevar datos sensibles: al copiar se enmascaran las claves conocidas.',
    sitios: 'Sitios',
    sinSitios: 'No hay sitios PHP ni FastAPI.',
    sinPhp: 'Elija una versión de PHP en el sitio primero.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Reinicie los procesos del sitio para que tomen wolfdump.',
    confirmarTitulo: (sitio: string) => `Activar la captura en ${sitio}`,
    confirmarPhp:
      'El PHP de este sitio cargará antes de cada petición un archivo de WolfCore Dev (auto_prepend_file, solo en este sitio) que define dump(), dd() y wd() si el proyecto no los define. Si sus archivos declaran su propia función dump() o dd() sin comprobar function_exists, PHP mostrará un error: desactive la captura en ese caso. El sitio pasa a usar su propio PHP.',
    usoPhp:
      'Laravel y Symfony: dump($x) y dd($x) como siempre. CodeIgniter 3 y otros: wd($x) envía sin mostrar nada en la página.',
    confirmarPython:
      'Los procesos de este sitio tendrán el módulo wolfdump en su PYTHONPATH (no se escribe nada en el proyecto). Vale desde el próximo arranque de sus procesos.',
    usoPython: 'from wolfdump import dump  →  dump(valor)',
    activar: 'Activar captura',
    cancelar: 'Cancelar',
    filtroSitio: 'Todos los sitios',
    filtroOrigen: 'Todo origen',
    buscar: 'Buscar en el texto, archivo o URL',
    limpiar: 'Limpiar',
    confirmarLimpiar: '¿Borrar todos los volcados de la memoria?',
    vacio: 'Todavía no llegó ningún volcado.',
    vacioApagado: 'Active la captura y encienda un sitio para empezar.',
    elegir: 'Elija un volcado de la lista.',
    copiar: 'Copiar',
    copiado: 'Copiado (con las claves enmascaradas)',
    sinSitio: 'sin sitio',
    total: (n: number) => `${n} en memoria`,
    archivo: 'Archivo',
    url: 'URL',
    pestanaVolcados: 'Volcados',
    pestanaErrores: 'Errores',
    erroresDescripcion:
      'Errores de los registros de PHP, Nginx, laravel.log, CodeIgniter 3 y Python, agrupados: el mismo error repetido aparece una vez con su contador.',
    erroresVacio: 'Sin errores en los registros. Aparecen aquí en cuanto se escriben.',
    erroresElegir: 'Elija un error de la lista.',
    actualizar: 'Actualizar',
    abrirEditor: 'Abrir en el editor',
    abrirEditorSinSitio: 'Solo se abren archivos de la carpeta de un sitio.',
    veces: (n: number) => (n === 1 ? '1 vez' : `${n} veces`),
    primera: 'Primera vez',
    ultima: 'Última vez',
    fuente: 'Registro',
    traza: 'Traza (última vez)',
    sinTraza: 'Sin traza.',
  },
  contenedores: {
    descripcion:
      'Vea y controle los contenedores de Docker o Podman de este equipo. WolfCore Dev no crea, borra ni descarga contenedores, imágenes ni volúmenes.',
    motor: 'Motor',
    refrescar: 'Refrescar',
    detectando: 'Buscando Docker y Podman…',
    sinMotorTitulo: 'No hay Docker ni Podman',
    sinMotor:
      'No se encontró Docker ni Podman en este equipo. WolfCore Dev no los instala: si los necesita, instale uno desde su página oficial y pulse Refrescar.',
    instalarDocker: 'Instalar Docker',
    instalarPodman: 'Instalar Podman',
    apagadoTitulo: (m: string) => `${m} no responde`,
    apagado: (m: string) =>
      `${m} está instalado, pero su motor no responde. Abra Docker Desktop (o inicie la máquina de Podman con «podman machine start») y pulse Refrescar.`,
    remoto:
      'Se ignoró una conexión remota (DOCKER_HOST, CONTAINER_HOST, un contexto o una conexión predeterminada): WolfCore Dev solo usa el motor de este equipo.',
    desdePath: 'Encontrado en el PATH, no en la carpeta de instalación habitual.',
    version: (v: string) => `Versión ${v}`,
    vacio: 'No hay contenedores.',
    columnas: {
      nombre: 'Nombre',
      imagen: 'Imagen',
      estado: 'Estado',
      puertos: 'Puertos',
      compose: 'Compose',
      acciones: 'Acciones',
    },
    estados: {
      corriendo: 'En marcha',
      detenido: 'Detenido',
      pausado: 'En pausa',
      otro: 'Otro',
    },
    codigoSalida: (n: number) => `código ${n}`,
    iniciar: 'Iniciar',
    detener: 'Detener',
    reiniciar: 'Reiniciar',
    registros: 'Registros',
    confirmarDetenerTitulo: '¿Detener el contenedor?',
    confirmarDetener: (n: string) =>
      `Se detendrá «${n}». Lo que corre dentro se corta (el motor espera unos segundos a que termine). No se borra nada.`,
    confirmarReiniciarTitulo: '¿Reiniciar el contenedor?',
    confirmarReiniciar: (n: string) =>
      `Se reiniciará «${n}». Lo que corre dentro se corta y vuelve a arrancar. No se borra nada.`,
    confirmar: 'Confirmar',
    cancelar: 'Cancelar',
    hecho: {
      iniciar: (n: string) => `«${n}» iniciado.`,
      detener: (n: string) => `«${n}» detenido.`,
      reiniciar: (n: string) => `«${n}» reiniciado.`,
    },
    registroTitulo: (n: string) => `Registros de «${n}»`,
    registroEsperando: 'Esperando líneas…',
    registroFin: 'El registro terminó (el contenedor se detuvo o el motor cortó).',
    cerrar: 'Cerrar',
  },
  versiones: {
    pestana: 'Versiones',
    avisoMaven:
      'WolfCore Dev lanza Maven directamente con el JDK y, por seguridad, no lee .mvn/jvm.config ni la variable MAVEN_OPTS. Si su proyecto las necesita, ejecute Maven desde una terminal.',
    avisoRuby:
      'Ruby se instala sin Devkit (MSYS2) y sin tocar el PATH ni el registro de Windows: no hay instalador. Las gemas con extensiones nativas que no traen binario precompilado necesitan el Devkit. Es un paso manual: abra una terminal desde el proyecto y ejecute «ridk install» (instala MSYS2 en su equipo y descarga de Internet).',
    avisoJdk:
      'Maven y Gradle se ejecutan con un JDK de WolfCore Dev y todavía no hay ninguno instalado. Instale Java (Temurin) desde la lista de servicios.',
    avisoMeilisearch:
      'Cada versión menor de Meilisearch tiene sus propios datos. Si cambia a otra versión menor (por ejemplo, de 1.58 a 1.59), sus índices y la MEILISEARCH_KEY serán nuevos: tendrá que reindexar y actualizar el .env de sus proyectos.',
    pestanaServicios: 'Servicios',
    elegirServicio: 'Servicio',
    servicios: {
      php: 'PHP',
      nginx: 'Nginx',
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      redis: 'Redis',
      mongodb: 'MongoDB',
      node: 'Node.js',
      python: 'Python',
      composer: 'Composer',
      mailpit: 'Mailpit',
      smtp4dev: 'smtp4dev',
      inbucket: 'Inbucket',
      papercut: 'Papercut SMTP',
      ollama: 'Ollama',
      meilisearch: 'Meilisearch',
      cloudflared: 'cloudflared',
      java: 'Java',
      dotnet: '.NET',
      go: 'Go',
      rust: 'Rust',
      bun: 'Bun',
      deno: 'Deno',
      zig: 'Zig',
      kotlin: 'Kotlin',
      dart: 'Dart',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    ayuda: {
      instancias:
        'Cada versión principal (8.4, 17…) tiene su instancia, con su carpeta de datos y su puerto: puede encender varias a la vez. La estrella marca la que usan los proyectos nuevos.',
      pool: 'Cada versión de PHP encendida tiene su propio PHP; la estrella marca la de los proyectos nuevos.',
      unica:
        'Puede instalar varias versiones, pero solo una queda encendida: encender otra cambia la activa.',
      ninguno:
        'No hay nada que encender: los proyectos usan la versión que piden o la predeterminada (estrella).',
    },
    filtroRama: 'Versión',
    todasRamas: 'Todas las versiones',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Mostrar todas',
    anteriores: (n: number) => `Parches anteriores (${n})`,
    origen: {
      vivo: 'En línea',
      cache: (h: number) => (h < 1 ? 'Caché de hace menos de 1 h' : `Caché de hace ${h} h`),
      fija: 'Lista sin conexión',
    },
    actualizarLista: 'Actualizar lista',
    errorCarga: 'No se pudo leer la lista de versiones',
    vacio: 'No hay versiones para mostrar.',
    soporte: { lts: 'LTS', actual: 'Actual', fin: 'Sin soporte', preview: 'Preview' },
    finSoporte: (f: string) => `Soporte hasta ${f}`,
    finSoportePasado: (f: string) => `Sin soporte desde ${f}`,
    marcas: {
      instalada: 'Instalada',
      encendida: 'Encendida',
      actualizacion: (v: string) => `Actualización: ${v}`,
      bloqueada: 'Bloqueada',
      sinHuella: 'Sin huella publicada',
      huellaDebil: 'Solo huella MD5',
      firmada: 'Con firma PGP',
    },
    ayudaFirmada:
      'La fuente oficial firma esta descarga con PGP: WolfCore Dev comprueba la firma con las claves fijadas en la app antes de instalar.',
    ayudaSinHuella:
      'La fuente oficial no publica una huella fuerte (SHA-256 o SHA-512): la descarga no se puede verificar.',
    instalar: 'Instalar',
    desinstalar: 'Desinstalar',
    encender: 'Encender',
    apagar: 'Apagar',
    actualizar: 'Actualizar',
    usarEsta: 'Usar esta versión',
    usarEstaAyuda: (id: string) =>
      `${id} usa otra versión de este servicio: se cambia con respaldo previo de sus datos.`,
    predeterminada: 'Predeterminada para proyectos nuevos',
    hacerPredeterminada: 'Usar para proyectos nuevos',
    predeterminadaHecha: (v: string) => `${v} queda como predeterminada.`,
    puerto: 'Puerto',
    puertoDe: (id: string) => `Puerto de ${id}`,
    cambiarPuerto: 'Cambiar',
    puertoCambiado: (p: number) => `Puerto cambiado a ${p}.`,
    puertoProyectosTitulo: 'Proyectos con el puerto anterior',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Estos proyectos todavía usan el puerto ${viejo} en su .env (no se cambiaron): ${lista}. Cámbielo a ${nuevo}.`,
    resolver: 'Resolver',
    instalada: (v: string) => `${v} instalado.`,
    selector: { etiqueta: 'Instancia', predeterminada: 'predeterminada', apagada: 'apagada' },
    dialogoSinHuella: {
      titulo: (v: string) => `Instalar ${v} sin huella`,
      riesgo:
        'Esta versión no tiene huella publicada por su fuente oficial: WolfCore Dev no puede comprobar que el archivo descargado sea el original.',
      explicacion:
        'La descarga sigue siendo por HTTPS desde el sitio oficial, pero si ese sitio o la conexión estuvieran comprometidos, no se notaría. Instálela solo si la necesita.',
      alternativa: (v: string) => `Hay una versión verificada del mismo servicio: ${v}.`,
      casilla: 'Entiendo el riesgo y quiero instalarla sin verificar',
      instalarVerificada: (v: string) => `Instalar ${v} (verificada)`,
      instalarIgual: 'Instalar sin verificar',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Actualizar ${n}`,
      tituloRama: (v: string) => `Versión nueva: ${v}`,
      ninguna: 'ninguna',
      instancia: (id: string) => `Se actualiza la instancia ${id}. Antes de cambiar nada:`,
      pasoInstalar: (v: string) => `se instala ${v} junto a la versión actual (que no se borra);`,
      pasoVolcados: 'se vuelca cada base de datos con la versión actual;',
      pasoCopia: 'se detiene y se copia la carpeta de datos completa (copia en frío);',
      pasoArrancar: 'se arranca con la versión nueva y se comprueba que responda;',
      pasoVuelta:
        'si no arranca, vuelve a la versión anterior con sus datos y la copia queda guardada.',
      datos: 'Datos:',
      respaldo: 'Copia en:',
      espacio: 'Espacio:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} libres; hacen falta ${necesarios}`,
      datosQuedan:
        'Los datos anteriores nunca se borran: la copia y los volcados quedan en Respaldos de las actualizaciones hasta que los borre.',
      sinEspacio: 'No hay espacio suficiente para la copia: libere espacio y vuelva a intentarlo.',
      alLado: (v: string) =>
        `Se instala ${v}. Las demás versiones instaladas no se tocan; los proyectos que fijan otra versión la siguen usando.`,
      ramaExplicacion:
        'Una versión principal nueva no reemplaza a la anterior: se crea una instancia nueva con su propia carpeta de datos y su puerto. La instancia actual sigue igual.',
      copiarDesdeTitulo: 'Datos de la instancia nueva',
      copiarDesde: (id: string) =>
        `Copiar datos desde ${id} (se vuelcan y se restauran; el original no se toca)`,
      vacia: 'Empezar vacía',
      ramaNota:
        'Los usuarios de la base de datos no se copian; los proyectos deben apuntar al puerto de la instancia nueva.',
      crearInstancia: 'Crear instancia nueva',
      confirmar: 'Actualizar con respaldo',
      hecho: (v: string) => `${v} actualizado.`,
      fallo: 'No se pudo actualizar',
      ramaCreada: (id: string) => `Instancia ${id} creada.`,
      copiadas: (l: string) => `Copiadas: ${l}.`,
      noCopiada: (b: string, m: string) => `No se copió ${b}: ${m}`,
    },
    limpieza: {
      boton: 'Limpiar versiones sin uso…',
      titulo: 'Limpiar versiones sin uso',
      intro:
        'Se quitan solo los programas de versiones que ninguna parte usa (la carpeta bin). Nunca se tocan los datos de las bases, las instancias ni sus proyectos.',
      cargando: 'Buscando versiones…',
      vacia: 'No hay versiones instaladas.',
      sinLibres: 'Todas las versiones instaladas están en uso: no hay nada que limpiar.',
      fallo: 'No se pudo limpiar',
      fallaLista: 'No se pudo leer la lista de versiones',
      bloqueada: 'No se puede marcar',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'versión' : 'versiones'} · ${tam}`,
      destinoTitulo: 'Qué hacer con ellas',
      papelera: 'Mover a la papelera: se conservan 7 días y siguen ocupando disco hasta entonces',
      definitivo: 'Borrar de forma definitiva: libera el espacio ahora y no se puede deshacer',
      avisoDefinitivo:
        'Borrado definitivo: para volver a tener estas versiones habrá que descargarlas otra vez.',
      instantanea:
        'Si elige el borrado definitivo, antes se guarda una copia de la configuración del entorno; en la papelera se pueden recuperar.',
      entiendo: 'Entiendo que no se puede deshacer',
      confirmar: (n: number) => `Quitar ${n} ${n === 1 ? 'versión' : 'versiones'}`,
      motivos: {
        predeterminada: 'Es la predeterminada',
        encendida: 'Está encendida o en ejecución',
        sitio: 'La usa un proyecto',
        instancia: 'La usa una instancia (aunque esté apagada)',
        plantilla: 'La usa una plantilla',
        workspace: 'La usa un workspace',
        runtime: 'La usa un proyecto',
        tarea: 'La usa un proyecto con tareas programadas',
        duda: 'No se pudo comprobar: no se toca',
        datos: 'Tiene datos que solo esta versión puede abrir',
        herramienta: 'La usa phpMyAdmin o Adminer',
      },
      resultadoTitulo: 'Resultado',
      liberadas: (tam: string) => `Se liberaron ${tam}.`,
      enPapelera: (tam: string) => `${tam} están en la papelera (se purgan a los 7 días).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'versión ya está fuera de bin pero quedaron restos' : 'versiones ya están fuera de bin pero quedaron restos'} que se reintentarán al abrir la aplicación.`,
      instantaneaGuardada: 'Copia del entorno guardada antes de borrar.',
      ajeno: (lista: string) =>
        `Trae lo que usted instaló dentro: ${lista}. Al quitarla se pierde.`,
      incluirAjeno: 'Quitarla aunque se pierda eso',
      sinCatalogo: 'Ya no está en el catálogo: si la quita, no podrá volver a descargarla.',
      papeleraTitulo: 'En la papelera',
      recuperar: 'Recuperar',
      recuperada: (v: string) => `${v} recuperada.`,
      borradaEl: (f: string) => `Borrada el ${f}`,
      fallaRecuperar: 'No se pudo recuperar',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Desinstalar ${v}`,
      binario: 'Se quitan solo los programas de esta versión.',
      instancia: (id: string) =>
        `La usa la instancia ${id}: se detiene y se quita de la lista de instancias.`,
      datosQuedan:
        'Sus datos quedan en disco: si vuelve a instalar esta versión, la instancia los vuelve a abrir.',
      borrarDatos: 'Borrar también los datos',
      borrarAviso: (id: string) =>
        `Se borrará la carpeta de datos de ${id} con todas sus bases. No se puede deshacer. Escriba "${id}" para confirmar.`,
      escriba: (id: string) => `Escriba ${id} para confirmar`,
      desinstalar: 'Desinstalar',
      desinstalarYBorrar: 'Desinstalar y borrar datos',
      unica:
        'Es la versión activa: si es la única instalada se puede quitar con el servicio apagado (queda sin instalar); si hay otras, elija antes otra como activa (estrella).',
      predeterminada: (id: string) =>
        `${id} es la instancia predeterminada: Bases de datos, el bloque .env y las herramientas que usan el motor pasarán a otra instancia (con otro puerto).`,
      hecho: (v: string) => `${v} desinstalado.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Resolver ${id}`,
      explicacion:
        'Una actualización falló y no se pudieron devolver los datos de esta instancia, así que no se enciende hasta que usted elija qué hacer. Nada se borra.',
      fallida: 'Datos tocados:',
      respaldo: 'Respaldo:',
      opciones: 'Qué hacer',
      devolver: (sello: string, tam: string) =>
        `Devolver el respaldo ${sello} (${tam}); la carpeta actual se aparta, no se borra`,
      usarActual: 'Usar la carpeta de datos actual tal como está',
      notaActual:
        'Solo si la carpeta actual tiene datos completos; si no los tiene, elija un respaldo.',
      notaDevolver: 'Se copia el respaldo, se comprueba y solo entonces se pone en su sitio.',
      escriba: (id: string) => `Escriba ${id} para confirmar`,
      elegirVersion:
        'La marca de bloqueo no se pudo leer: elija con qué versión se abrirán los datos (la de antes de la actualización).',
      version: 'Versión',
      confirmar: 'Resolver',
      hecho: (id: string) => `${id} desbloqueada. Ya puede encenderla.`,
    },
    respaldos: {
      titulo: 'Respaldos de las actualizaciones',
      descripcion:
        'Copias que dejaron las actualizaciones y las versiones nuevas. La carpeta de datos que usa cada instancia nunca aparece aquí.',
      vacio: 'No hay copias.',
      tipos: {
        respaldo: 'Copia en frío',
        volcados: 'Volcados de las bases',
        fallida: 'Datos de una versión que falló',
        restaurando: 'Devolución a medias',
        copia: 'Volcados para una versión nueva',
      },
      archivos: (n: number) => (n === 1 ? '1 archivo' : `${n} archivos`),
      borrar: 'Borrar',
      borrarDe: (n: string) => `Borrar ${n}`,
      confirmarTitulo: 'Borrar copia',
      confirmar: (n: string, tam: string) =>
        `Se borrará ${n} (${tam}). No se puede deshacer. Los datos que usan las instancias no se tocan.`,
      borrado: 'Copia borrada.',
    },
  },
  navGrupos: {
    trabajo: 'Trabajo',
    entorno: 'Entorno',
    utilidades: 'Utilidades',
  },
  avisos: {
    campana: 'Avisos',
    campanaConNuevos: (n: number) => `Avisos: ${n} sin leer`,
    titulo: 'Centro de avisos',
    vacio:
      'No hay avisos. Aquí aparecerán las caídas de servicios, los puertos ocupados y los certificados por vencer.',
    marcarTodos: 'Marcar todo como leído',
    limpiar: 'Limpiar historial',
    ver: 'Ver',
    actualizar: 'Actualizar',
    verVersiones: 'Ver versiones',
    cerrar: 'Cerrar',
    niveles: { info: 'Información', aviso: 'Aviso', error: 'Error' },
    sinLeer: 'Sin leer',
  },
  memoria: {
    boton: 'Memoria',
    tituloBoton: 'Optimizar la memoria',
    titulo: 'Optimizador de memoria',
    intro:
      'Elige un modo y revisa la lista. No se cierra ni se detiene nada hasta que lo confirmes, y nunca se ejecuta solo.',
    modo: 'Modo',
    modos: { liviano: 'Liviano', moderado: 'Moderado', profundo: 'Profundo' },
    descripciones: {
      liviano:
        'Solo vacía la caché de la sesión de la aplicación: libera disco, no RAM. No detiene ni cierra nada.',
      moderado:
        'Además propone dejar un solo trabajador de PHP y detener servicios de WolfCore Dev sin actividad ni conexiones. Los servicios salen desmarcados.',
      profundo:
        'Además lista programas tuyos que usan mucha memoria para pedirles que cierren su ventana. Salen desmarcados.',
    },
    ver: 'Ver la lista',
    revisando: 'Revisando…',
    vacio: 'No hay nada que liberar en este modo.',
    tipos: {
      'cache-app': 'Vaciar caché',
      'reducir-pool': 'Dejar un solo trabajador',
      'detener-inactivo': 'Detener (sin actividad)',
      'cerrar-programa': 'Pedir que cierre su ventana',
    },
    caches: {
      sesion: 'Caché HTTP de la sesión de la aplicación',
    },
    estimado: (cantidad: string) => `Se liberarían unos ${cantidad} de RAM`,
    estimadoDisco: (cantidad: string) => `Y unos ${cantidad} de disco (la caché no es RAM)`,
    marcadas: (n: number, total: number) => `${n} de ${total} marcadas`,
    sinDatos:
      'Aún no hay datos de actividad suficientes para proponer detener servicios o reducir PHP. Deja abierto Inicio unos minutos y vuelve a mirar.',
    listadoFallido:
      'No se pudo leer la lista de programas abiertos: esta lista puede estar incompleta. Inténtalo de nuevo.',
    avisoDetener:
      'Los servicios sin actividad salen desmarcados: detener uno corta lo que lo use. Solo aparecen los que no tienen conexiones ahora.',
    avisoCerrar:
      'A los programas solo se les pide cerrar su ventana, como al pulsar la X: pueden preguntarte si guardas. Nunca se fuerza ni se termina un programa.',
    protegidos:
      'Nunca aparecen programas del sistema, servicios de Windows, programas elevados, de otros usuarios, FlyEnv, PhpWebStudy ni WolfCore Dev (ni lo que ellos lanzan).',
    aplicar: 'Aplicar lo marcado',
    confirmarTitulo: '¿Aplicar estas acciones?',
    confirmarTexto: (n: number) =>
      n === 1 ? 'Se hará 1 acción de la lista.' : `Se harán ${n} acciones de la lista.`,
    confirmarCerrar: (nombres: string) => `Se pedirá cerrar la ventana de: ${nombres}.`,
    confirmarDetener: (nombres: string) => `Se detendrán estos servicios: ${nombres}.`,
    confirmar: 'Sí, aplicar',
    cancelar: 'Cancelar',
    resultadoTitulo: 'Resultado',
    liberado: (cantidad: string) => `Calculado: unos ${cantidad} de RAM liberados`,
    liberadoDisco: (cantidad: string) => `Además, unos ${cantidad} de disco`,
    notaPedido:
      'Esperando al usuario: se pidió cerrar la ventana y el programa sigue abierto (quizá pregunta si guardas). No se cuenta como liberado.',
    estados: { hecho: 'Hecho', pedido: 'Esperando al usuario', saltado: 'Omitido', error: 'Falló' },
    motivos: {
      no_en_plan: 'No estaba en la lista',
      protegido: 'Es un programa protegido',
      cambio: 'Cambió desde que se mostró la lista',
      sin_ventana: 'Ya no tiene una ventana que cerrar',
      ya_apagado: 'Ya no había nada que reducir',
      ocupado: 'Estaba ocupado (tiene conexiones)',
      no_se_pudo: 'No se pudo pedir el cierre (el programa tiene permisos elevados)',
    },
    otraVez: 'Volver a empezar',
  },
  guias: {
    tuneles: { titulo: 'Guía de túneles', copiar: 'Copiar el comando' },
    http: {
      buscar: 'Buscar por número, nombre o texto',
      familia: 'Familia',
      todas: 'Todas',
      verMetodos: 'Métodos',
      verCodigos: 'Códigos de estado',
      resultados: (n: number) => `${n} ${n === 1 ? 'resultado' : 'resultados'}`,
      vacio: 'Nada coincide con la búsqueda.',
      seguro: 'Seguro',
      noSeguro: 'No seguro',
      idempotente: 'Idempotente',
      noIdempotente: 'No idempotente',
      noEstandar: 'No estándar',
      broma: 'Código de broma (RFC 2324)',
      causas: 'Causas comunes',
      solucion: 'Cómo solucionarlo',
      ejemplo: 'Ejemplo',
      copiarEjemplo: 'Copiar el ejemplo',
      sinTraduccion: 'Sin traducción a este idioma: se muestra en inglés.',
      familias: {
        '1xx': '1xx Informativos',
        '2xx': '2xx Éxito',
        '3xx': '3xx Redirección',
        '4xx': '4xx Error del cliente',
        '5xx': '5xx Error del servidor',
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `Editor ligero con resaltado para archivos de texto de hasta ${mb} MB. Elige el archivo en el diálogo del sistema; guardar siempre pide confirmación y deja antes una copia en la carpeta de datos de WolfCore Dev.`,
    abrir: 'Abrir archivo…',
    abriendo: 'Abriendo…',
    guardar: 'Guardar',
    guardando: 'Guardando…',
    recargar: 'Recargar del disco',
    vacio: 'Abre un archivo para empezar a editar.',
    sinCambios: 'Sin cambios',
    conCambios: 'Cambios sin guardar',
    posicion: (linea: number, columna: number) => `Línea ${linea}, columna ${columna}`,
    areaTexto: (nombre: string) => `Editor de código: ${nombre}`,
    salirTeclado: 'Para salir del editor con el teclado, pulsa Esc y después Tab.',
    guardado: 'Archivo guardado.',
    copiaPrevia: (ruta: string) => `Copia previa: ${ruta}`,
    cancelar: 'Cancelar',
    enlaceDuro:
      'Este archivo tiene más de un nombre en el disco (enlace duro). Guardarlo rompe ese enlace: los otros nombres seguirán con el contenido anterior.',
    saltosMixtos: {
      aviso: 'Este archivo mezcla saltos de línea. Al guardar se normalizan todos a LF.',
      aceptar: 'Acepto normalizar los saltos de línea',
    },
    envGestor: {
      aviso:
        'Los archivos .env se editan en las variables del proyecto, con su flujo de secretos. El botón abre el .env de la raíz del proyecto, que puede no ser el archivo que intentó abrir.',
      boton: 'Abrir el .env de la raíz del proyecto',
    },
    huellaPerdida: 'Guardado, pero no se pudo leer la huella nueva: se recargó el archivo.',
    confirmarGuardar: {
      titulo: 'Guardar cambios',
      texto: (nombre: string) =>
        `Se va a escribir ${nombre}. Antes se guarda una copia del contenido actual del disco en la carpeta de datos de WolfCore Dev.`,
      boton: 'Guardar con copia previa',
    },
    refuerzo: {
      abrirTitulo: 'Archivo delicado',
      guardarTitulo: 'Guardar un archivo delicado',
      secreto:
        'Este archivo parece contener secretos (claves privadas, tokens o credenciales). Su contenido se mostrará en pantalla.',
      datosReales:
        'Este archivo es de un sitio marcado con datos reales. Un cambio equivocado puede afectar a información de verdad.',
      instruccion: (nombre: string) => `Para continuar, escribe el nombre del archivo: ${nombre}`,
      etiqueta: 'Nombre del archivo',
      abrirBoton: 'Abrir de todos modos',
      guardarBoton: 'Guardar de todos modos',
    },
    cambioExterno: {
      titulo: 'El archivo cambió fuera del editor',
      texto:
        'Otro programa lo modificó desde que lo abrió, así que no se guardó nada. Puede recargarlo (se pierden sus cambios) o sobrescribirlo con lo que tiene aquí.',
      recargar: 'Recargar y descartar mis cambios',
      sobrescribir: 'Sobrescribir…',
      sobrescribirTitulo: 'Sobrescribir el archivo',
      sobrescribirTexto:
        'Se perderán los cambios que hizo el otro programa. Su contenido actual quedará en la copia previa.',
      sobrescribirBoton: 'Sí, sobrescribir',
      volver: 'Volver',
    },
    descartar: {
      titulo: 'Cambios sin guardar',
      texto: 'Hay cambios sin guardar en el editor. Si continúas, se pierden.',
      confirmar: 'Descartar cambios',
      seguir: 'Seguir editando',
    },
    cm: {
      'Control character': 'Carácter de control',
      'Selection deleted': 'Selección eliminada',
      'Go to line': 'Ir a la línea',
      go: 'ir',
      Find: 'Buscar',
      Replace: 'Reemplazar',
      next: 'siguiente',
      previous: 'anterior',
      all: 'todas',
      'match case': 'distinguir mayúsculas',
      regexp: 'expresión regular',
      'by word': 'palabra completa',
      replace: 'reemplazar',
      'replace all': 'reemplazar todo',
      close: 'cerrar',
      'current match': 'coincidencia actual',
      'on line': 'en la línea',
      'replaced match on line $': 'coincidencia reemplazada en la línea $',
      'replaced $ matches': '$ coincidencias reemplazadas',
      'folded code': 'código plegado',
      unfold: 'desplegar',
      to: 'a',
    },
  },
  limpiezaDisco: {
    intro:
      'Primero se analiza y se ve cuánto ocupa cada cosa. No se borra nada hasta que lo confirmes, y nunca corre sola ni en segundo plano.',
    analizar: 'Analizar',
    analizando: 'Analizando…',
    cancelarAnalisis: 'Cancelar',
    vacio: 'No hay nada que limpiar.',
    categorias: {
      temp: {
        nombre: 'Archivos temporales',
        ayuda:
          'Los de su carpeta TEMP con más de 24 horas. Se borran definitivamente; se regeneran solos.',
      },
      'cache-chrome': {
        nombre: 'Caché de Google Chrome',
        ayuda:
          'Solo las carpetas de caché de cada perfil; nunca cookies, contraseñas ni historial.',
      },
      'cache-edge': {
        nombre: 'Caché de Microsoft Edge',
        ayuda:
          'Solo las carpetas de caché de cada perfil; nunca cookies, contraseñas ni historial.',
      },
      'cache-brave': {
        nombre: 'Caché de Brave',
        ayuda:
          'Solo las carpetas de caché de cada perfil; nunca cookies, contraseñas ni historial.',
      },
      'cache-firefox': {
        nombre: 'Caché de Firefox',
        ayuda: 'Solo la carpeta cache2 de cada perfil; nunca cookies, contraseñas ni historial.',
      },
      'wolfcore-descargas': {
        nombre: 'Descargas en caché de WolfCore Dev',
        ayuda: 'Paquetes comprimidos sueltos que ya no se usan. Van a la papelera.',
      },
      'wolfcore-registros': {
        nombre: 'Registros de WolfCore Dev',
        ayuda: 'Registros con más de 30 días. Van a la papelera.',
      },
      prefetch: {
        nombre: 'Prefetch de Windows',
        ayuda:
          'Opcional. Windows lo regenera, pero necesita ejecutar WolfCore Dev como administrador.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Navegador abierto o en segundo plano: ciérralo del todo para limpiar su caché (en Edge, desactiva también el inicio rápido y las extensiones en segundo plano)',
      'requiere-admin': 'Requiere ejecutar WolfCore Dev como administrador',
      'ruta-vetada': 'Ruta protegida: no se limpia',
      'temp-no-seguro':
        'La variable TEMP apunta a una carpeta que no es la temporal del usuario (Documentos, una unidad entera, una ruta de red…): no se limpia',
    },
    borradoDefinitivo: 'Se borran definitivamente (se regeneran solas)',
    borradoPapelera: 'Van a la papelera del sistema',
    archivos: (n: number) => (n === 1 ? '1 archivo' : `${n} archivos`),
    carpetas: 'Por carpeta',
    truncado: 'El análisis se cortó en el tope de archivos: hay más de lo que se muestra.',
    marcadas: (n: number, t: number) => `${n} de ${t} categorías marcadas`,
    total: (b: string) => `Se liberarían unos ${b}`,
    limpiar: 'Limpiar lo marcado',
    confirmarTitulo: '¿Limpiar estas categorías?',
    confirmarTexto: (n: number) => `Se limpiarán ${n} categorías.`,
    confirmarDefinitivo: 'Lo de TEMP y las cachés se borra definitivamente (se regenera solo).',
    confirmarPapelera: 'Los registros y descargas de WolfCore Dev van a la papelera.',
    confirmarPrefetch:
      'Prefetch: Windows lo regenera, pero las primeras aperturas de programas pueden ser algo más lentas.',
    confirmar: 'Sí, limpiar',
    cancelar: 'Cancelar',
    detener: 'Detener la limpieza',
    resultadoTitulo: 'Resultado',
    liberado: (b: string) => `Liberado: ${b}`,
    enPapelera: (b: string) =>
      `De ello, ${b} están en la papelera (el espacio vuelve al vaciarla).`,
    saltados: (n: number) => `Se saltaron ${n} archivos`,
    cancelado: 'Limpieza cancelada: lo ya borrado se queda borrado.',
    topeEjecucion:
      'Se llegó al tope de archivos de una ejecución: analice y limpie de nuevo para seguir.',
    registroFallido:
      'No se pudo seguir escribiendo el registro de la limpieza, así que se paró: lo ya borrado está anotado hasta ese punto.',
    motivos: {
      'en-uso': 'En uso',
      enlace: 'Enlace o punto de reanálisis (no se sigue)',
      protegido: 'Protegido (.env, FlyEnv o similar)',
      cambio: 'Cambió desde el análisis',
      'sin-papelera': 'No hay papelera disponible',
      ilegible: 'No se pudo leer',
      error: 'Error al borrar',
    },
    verRegistros: 'Ver los registros',
    registroEn: (r: string) => `Registro de esta limpieza: ${r}`,
    otraVez: 'Volver a empezar',
    protegidas:
      'Nunca se toca: datos, respaldos, proyectos, bases ni archivos .env. Tampoco se siguen enlaces ni se sale de las rutas de esta lista.',
  },
  barra: {
    paleta: 'Buscar o ejecutar un comando',
    atajoPaleta: 'Ctrl+K',
    tema: 'Cambiar tema',
    idioma: 'Cambiar idioma',
  },
  preferencias: {
    titulo: 'Apariencia e idioma',
    descripcion: 'Los cambios se aplican al instante y se guardan en este equipo.',
    tema: 'Tema',
    temas: { sistema: 'Sistema', claro: 'Claro', oscuro: 'Oscuro' },
    idioma: 'Idioma',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' },
    acento: 'Color de acento',
    acentos: {
      indigo: 'Índigo',
      azul: 'Azul',
      verde: 'Verde',
      violeta: 'Violeta',
      naranja: 'Naranja',
      rosa: 'Rosa',
    },
    acentoPropio: (color: string) => `Personalizado (${color})`,
    errorGuardar: 'No se pudo guardar la preferencia',
    asistente: 'Recorrido de bienvenida',
    asistenteAyuda:
      'Vuelva a ver el recorrido por las pantallas principales: servicios, proyectos, bases de datos, herramientas y Doctor.',
    asistenteAbrir: 'Ver el recorrido',
    avanzadas: 'Mostrar secciones avanzadas',
    avanzadasAyuda:
      'Añade a la barra lateral las pantallas que casi no se usan, como Contenedores. También se llega a ellas con Ctrl+K.',
  },
  paleta: {
    titulo: 'Paleta de comandos',
    placeholder: 'Busque una pantalla, un servicio, un proyecto o una herramienta…',
    sinResultados: 'Ningún comando coincide con la búsqueda.',
    ayuda: '↑ ↓ para moverse · Enter para ejecutar · Esc para cerrar',
    grupos: {
      navegacion: 'Ir a',
      servicios: 'Servicios',
      proyectos: 'Proyectos',
      herramientas: 'Herramientas',
      github: 'GitHub',
      general: 'General',
    },
    irA: (pantalla: string) => `Ir a ${pantalla}`,
    encender: (servicio: string) => `Encender ${servicio}`,
    apagar: (servicio: string) => `Apagar ${servicio}`,
    iniciarTodo: 'Iniciar todos los servicios',
    detenerTodo: 'Detener todos los servicios',
    iniciarWorkspace: (n: string) => `Encender el workspace ${n}`,
    detenerWorkspace: (n: string) => `Apagar el workspace ${n}`,
    abrirSitio: (nombre: string) => `Abrir ${nombre} en el navegador`,
    traerCambios: (nombre: string) => `Traer cambios en ${nombre}`,
    irAServicio: (nombre: string) => `Ir al servicio ${nombre}`,
    irAProyecto: (nombre: string) => `Ir al proyecto ${nombre}`,
    versionesDe: (nombre: string) => `Versiones de ${nombre}`,
    abrirHerramienta: (nombre: string) => `Abrir ${nombre}`,
    clonar: 'Clonar un repositorio desde GitHub',
    agregarProyecto: 'Agregar un proyecto',
    nuevoProyecto: 'Crear un proyecto nuevo',
    tema: (tema: string) => `Tema: ${tema}`,
    idioma: (idioma: string) => `Idioma: ${idioma}`,
    asistente: 'Ver el recorrido de bienvenida',
  },
  nuevoProyecto: {
    titulo: 'Nuevo proyecto',
    boton: 'Nuevo proyecto',
    descripcion:
      'Cree un proyecto desde cero: la carpeta, el sitio con HTTPS, la base de datos y su conexión.',
    pasos: { tipo: 'Tipo', datos: 'Datos', resumen: 'Resumen', crear: 'Creando' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Con Composer; clave de aplicación, base y migraciones.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Appstarter oficial con su .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Framework clásico con database.php configurado.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Esqueleto oficial (o webapp) con su .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Entorno virtual, requirements.txt y proceso uvicorn.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Descarga oficial con wp-config.php listo.' },
      estatico: {
        nombre: 'Sitio estático',
        descripcion: 'HTML y CSS servidos por Nginx, sin base de datos.',
      },
    },
    campos: {
      nombre: 'Nombre del proyecto',
      nombrePlaceholder: 'mi-tienda',
      nombreAyuda: (dominio: string) => `Será ${dominio}: minúsculas, números y guiones.`,
      carpeta: 'Carpeta padre',
      elegirCarpeta: 'Elegir carpeta…',
      cambiarCarpeta: 'Cambiar carpeta…',
      carpetaAyuda:
        'El proyecto se crea en una carpeta nueva con su nombre dentro de esta. Debe estar vacía o no existir.',
      php: 'Versión de PHP',
      python: 'Versión de Python',
      sinInstalada: 'Ninguna instalada: instálela desde Servicios.',
      conBase: 'Crear una base de datos para el proyecto',
      sinBase: 'Sin base de datos',
      instancia: 'Servidor de la base',
      apagada: 'apagada',
      apagadaAyuda:
        'Ese servidor está apagado: enciéndalo en Servicios antes de crear el proyecto.',
      sinMotores: 'No hay ningún servidor de base de datos instalado para este tipo de proyecto.',
      nombreBase: 'Nombre de la base',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Ninguno', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Incluir los paquetes web (webapp)',
      pgvector: 'Activar pgvector (búsqueda por vectores)',
    },
    huella: {
      titulo: 'WordPress solo publica una huella débil',
      riesgo:
        'La huella publicada es SHA-1, un algoritmo que ya no se considera seguro, y viene del mismo sitio que el archivo.',
      explicacion:
        'Si ese sitio o la conexión estuvieran comprometidos, una descarga alterada pasaría la verificación. La descarga sigue siendo por HTTPS desde wordpress.org. Continúe solo si confía en esa fuente.',
      leyendo: 'Leyendo la huella publicada…',
      noDisponible:
        'No se pudo leer la huella ahora (sin conexión o la fuente no respondió); se leerá de nuevo al crear.',
      fuente: 'Origen: wordpress.org',
      casilla: 'Entiendo que la huella es débil y quiero crear el proyecto igual',
    },
    resumen: {
      titulo: 'Esto se va a crear',
      intro: 'Revise antes de empezar.',
      tipo: 'Tipo',
      carpeta: 'Carpeta',
      sitio: 'Sitio',
      dominio: 'Dominio',
      https: 'Dirección con HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Base de datos',
      env: 'Conexión escrita en',
      nota: 'Si un paso falla no se borra nada: verá qué quedó creado y podrá reintentar.',
    },
    errores: {
      nombreVacio: 'Escriba un nombre para el proyecto.',
      nombreInvalido:
        'El nombre solo puede llevar minúsculas, números y guiones (hasta 40), sin empezar ni terminar en guion.',
      sinCarpeta: 'Elija la carpeta padre del proyecto.',
      sinPhp: 'Elija una versión de PHP (instálela desde Servicios si no hay ninguna).',
      sinPython: 'Elija una versión de Python (instálela desde Servicios si no hay ninguna).',
      sinInstancia: 'Elija el servidor donde crear la base de datos, o desmarque la base.',
      baseInvalida: 'El nombre de la base no es válido para este motor.',
      motorNoVale: 'WordPress necesita MySQL o MariaDB.',
      pgvectorMotor: 'pgvector necesita PostgreSQL.',
      huellaDebil: 'Confirme que entiende que la huella de WordPress es débil.',
    },
    acciones: {
      cambiarCarpeta: 'Elegir otra carpeta',
      cambiarBase: 'Cambiar el nombre de la base',
      cambiarNombre: 'Cambiar el nombre',
      reintentarPaso: 'Reintentar el paso',
      servicios: 'Ir a Servicios',
      confirmarHuella: 'Revisar la confirmación',
    },
    botones: {
      siguiente: 'Siguiente',
      atras: 'Atrás',
      crear: 'Crear proyecto',
      creando: 'Creando…',
      cerrar: 'Cerrar',
      abrirEditor: 'Abrir en el editor',
      verSitio: 'Ver el sitio',
      verProyecto: 'Ver en Proyectos',
    },
    progreso: {
      titulo: 'Creando el proyecto',
      listo: 'Proyecto creado.',
      fallo: (paso: string) =>
        `El paso «${paso}» falló. Nada se borró: reintente el paso o arréglelo y vuelva a intentarlo.`,
      quedo: (partes: string) => `Esto quedó creado: ${partes}.`,
      quedoCarpeta: 'la carpeta',
      quedoBase: (nombre: string) => `la base ${nombre}`,
      quedoSitio: 'el sitio',
      avisos: 'Avisos',
      sinUsuarioPropio:
        'El cifrado del sistema no está disponible: el proyecto usa la conexión del administrador de la base. Cuando lo esté, use "Usar usuario propio" en el gestor de .env.',
      editorFallo: 'No se pudo abrir el editor.',
    },
  },
  importar: {
    boton: 'Importar…',
    titulo: 'Importar desde Laragon, XAMPP o Herd',
    intro:
      'Los sitios se vinculan donde están: no se mueve, copia ni modifica ninguna carpeta. Si quiere, también se copian sus bases de datos. WolfCore Dev solo lee las instalaciones de los otros programas.',
    buscando: 'Buscando instalaciones…',
    nada: 'No se encontró Laragon, XAMPP ni Herd en las carpetas habituales.',
    errorVista: 'No se pudo buscar lo que se puede importar',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Sitios',
      todos: 'Elegir todos',
      ninguno: 'Quitar todos',
      dominio: (d: string) => `Dominio ${d}`,
      dominioPropuesto: (d: string) => `Dominio ${d} (propuesto)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP sin determinar',
      base: (nombre: string, motor: string) => `Base ${nombre} (${motor})`,
      yaVinculado: 'Ya es un sitio de WolfCore Dev',
      dominioEnUso: 'Otro sitio ya usa ese dominio',
    },
    avisos: {
      sin_dominio: 'No tiene dominio en el otro programa: se propone uno.',
      dominio_invalido: 'Su dominio no es válido: se propone uno.',
      sin_vhost: 'No tiene un host virtual propio: se propone un dominio.',
      php_desconocido: 'No se sabe qué versión de PHP usa: se elige una instalada.',
      base_no_local: 'Su base está en otro servidor: no se importa.',
      base_nombre_invalido: 'El nombre de su base no es válido: no se importa.',
      motor_no_soportado: 'Su base no es MySQL ni MariaDB: no se importa.',
    },
    problemas: {
      titulo: (n: number) => `${n} cosas se descartaron o no se pudieron leer`,
    },
    bases: {
      titulo: 'Bases de datos',
      importarBases: 'Importar también las bases de datos',
      ayuda:
        'Encienda el servidor de bases de datos del otro programa antes de seguir: WolfCore Dev no arranca ni detiene programas ajenos. La clave se usa solo en esta importación y no se guarda.',
      destino: 'Servidor de destino',
      apagada: 'apagado',
      sinMotores:
        'No hay MySQL ni MariaDB instalados: instálelos desde Servicios para importar bases.',
      puerto: 'Puerto del servidor de origen',
      usuario: 'Usuario',
      clave: 'Clave',
      claveAyuda: 'Déjela vacía si el usuario no tiene clave (como root en Laragon o XAMPP).',
      existe: 'ya existe en el destino',
      reemplazar: 'Reemplazar (se hace una copia antes)',
      noSeToca: 'No se toca si no la marca.',
    },
    pasos: { elegir: 'Elegir', confirmar: 'Confirmar' },
    continuar: 'Continuar',
    volver: 'Volver',
    cancelar: 'Cancelar',
    importar: 'Importar',
    cerrar: 'Cerrar',
    sinSeleccion: 'Elija al menos un sitio.',
    origenIncompleto: 'Indique el puerto y el usuario del servidor de origen.',
    confirmar: {
      titulo: 'Confirme la importación',
      sitios: (n: number) =>
        `Se vincularán ${n} ${n === 1 ? 'sitio' : 'sitios'} en su carpeta actual. No se mueve, copia ni modifica ningún archivo.`,
      sinConfianza:
        'Ningún sitio importado ejecuta recetas hasta que usted marque «Confío en este repositorio».',
      hosts:
        'Se actualizarán Nginx y el archivo hosts (Windows puede pedir permiso de administrador).',
      basesNuevas: (nombres: string) => `Se copiarán las bases: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Se reemplazarán estas bases, que ya existen: ${nombres}. Antes se guarda una copia de cada una.`,
      basesSinTocar: (nombres: string) => `No se tocarán estas bases, que ya existen: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Se volcarán del servidor del otro programa (127.0.0.1:${puerto}, usuario ${usuario}). Se lee sin modificarlo.`,
      sinBases: 'No se importará ninguna base de datos.',
      proteccion:
        'La estructura de cada base se revisa antes y los datos entran con un usuario limitado: si algo falla, la base queda como estaba.',
    },
    resultado: {
      titulo: 'Resultado de la importación',
      importando: 'Importando…',
      cancelar: 'Cancelar importación',
      restaurada: 'La base original se volvió a poner sola desde su copia: quedó como estaba.',
      sitioOk: 'Importado',
      sitioFallo: 'No se importó',
      baseOk: (n: string) => `Base ${n} importada`,
      baseFallo: (n: string) => `Base ${n} no importada`,
      copiaPrevia: (ruta: string) => `Copia de la base anterior: ${ruta}`,
      phpDistinto: (v: string) => `Se usó PHP ${v} (no estaba instalada la versión original).`,
      sinAplicar:
        'Nginx o el archivo hosts no quedaron al día: revise el aviso en Proyectos y reintente.',
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'sitio importado' : 'sitios importados'}, ${b} ${b === 1 ? 'base importada' : 'bases importadas'}.`,
      errorImportar: 'No se pudo importar',
    },
  },
  plantillas: {
    guardarComo: 'Guardar como plantilla…',
    dialogo: {
      titulo: (nombre: string) => `Guardar «${nombre}» como plantilla`,
      intro:
        'La plantilla guarda la receta, los ajustes de PHP y Nginx, las extensiones y el esquema de la base (solo la estructura, sin ninguna fila). Nunca guarda contraseñas, claves ni datos de la base.',
      nombre: 'Nombre de la plantilla',
      nombrePlaceholder: 'Mi proyecto base',
      conArchivos: 'Incluir también los archivos del proyecto',
      conArchivosAyuda: 'Sin esto solo se guardan la receta, los ajustes y el esquema.',
      siempre: 'Siempre se dejan fuera',
      siempreLista:
        '.env y .env.*, vendor, node_modules, .git, .venv, registros, volcados y bases de archivo (*.sql, *.dump, *.sqlite), claves y certificados (*.pem, *.key, *.crt…), wp-config.php y wolfcore.yml. Un archivo que contenga una clave o una contraseña también se deja fuera.',
      extra: 'Excluir además (una por línea)',
      extraAyuda: 'Nombres o rutas relativas al proyecto, por ejemplo uploads o public/build.',
      vista: 'Qué se guardará',
      calculando: 'Calculando…',
      resumen: (archivos: number, tamano: string) => `${archivos} archivos · ${tamano}`,
      fuera: (n: number) => `${n} dejados fuera`,
      sinArchivos: 'Solo se guardarán la receta, los ajustes y el esquema; ningún archivo.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Se guardará solo la estructura de la base ${nombre} (servidor ${servidor}), sin ninguna fila.`,
      sinBase: 'El proyecto no declara una base de datos: no se guardará ningún esquema.',
      avisoMongodb: 'Este proyecto usa MongoDB: su esquema (colecciones e índices) no se guarda.',
      incluirDeTodosModos: 'Incluir de todos modos',
      avisoIncluir: 'Si ese archivo trae una clave de verdad, quedará dentro de la plantilla.',
      guardar: 'Guardar plantilla',
      guardada: (nombre: string) => `Plantilla «${nombre}» guardada.`,
      errorGuardar: 'No se pudo guardar la plantilla',
      errorVista: 'No se pudo calcular la vista previa',
      cancelar: 'Cancelar',
    },
    lista: {
      titulo: 'Mis plantillas',
      ayuda:
        'Empiece un proyecto nuevo con la receta, los ajustes y el esquema (sin datos) de uno que ya tiene.',
      vacia:
        'Aún no hay plantillas. Guarde un proyecto como plantilla desde el menú de su tarjeta.',
      conArchivosEtiqueta: 'con archivos',
      soloEsquema: 'receta y esquema',
      conBase: (motor: string) => `base ${motor} sin datos`,
      borrarEtiqueta: (nombre: string) => `Borrar la plantilla ${nombre}`,
      borrarTitulo: (nombre: string) => `¿Borrar la plantilla ${nombre}?`,
      borrarTexto:
        'Solo se borra la plantilla. Los proyectos creados con ella y el proyecto original no se tocan.',
      borrada: 'Plantilla borrada.',
      errorBorrar: 'No se pudo borrar la plantilla',
      errorLista: 'No se pudieron leer las plantillas',
      desde: (nombre: string) => `Plantilla: ${nombre}`,
      avisoSinBase: 'Esta plantilla no trae base de datos.',
      importadaEtiqueta: 'importada',
      avisoImportada:
        'La plantilla viene de un tercero: el proyecto se crea sin confianza y sin arrancar sus procesos, y abrir el sitio ejecuta su código. Revise sus archivos antes.',
      generadoresTitulo: 'Proyectos desde cero',
    },
  },
  env: {
    accion: 'Variables .env…',
    titulo: (nombre: string) => `.env de ${nombre}`,
    intro:
      'Los valores secretos se muestran enmascarados. Un valor completo solo aparece si usted pulsa «Mostrar» en esa variable y se vuelve a ocultar a los 30 segundos. Antes de guardar se hace una copia con fecha del .env actual.',
    noExiste: 'Este proyecto todavía no tiene un archivo .env: se creará al guardar.',
    tablaEtiqueta: 'Variables del .env',
    sinVariables: 'El .env no tiene variables.',
    secretaEtiqueta: 'secreta',
    duplicadaEtiqueta: 'repetida',
    duplicadaAyuda:
      'Esta variable aparece más de una vez en el .env: se muestra y se cambia la última.',
    soloLecturaEtiqueta: 'varias líneas',
    soloLecturaAyuda: 'Ocupa varias líneas: edítela a mano en el archivo.',
    seQuitara: 'Se quitará al guardar',
    valorNuevo: 'Valor nuevo',
    valorNuevoDe: (clave: string) => `Valor nuevo de ${clave}`,
    valorDe: (clave: string) => `Valor de ${clave}`,
    vacio: '(vacío)',
    mostrar: 'Mostrar',
    ocultar: 'Ocultar',
    mostrarEtiqueta: (clave: string) => `Mostrar el valor de ${clave}`,
    ocultarEtiqueta: (clave: string) => `Ocultar el valor de ${clave}`,
    cambiar: 'Cambiar',
    deshacer: 'Deshacer',
    deshacerEtiqueta: (clave: string) => `Deshacer el cambio de ${clave}`,
    quitar: 'Quitar',
    quitarEtiqueta: (clave: string) => `Quitar la variable ${clave}`,
    errorRevelar: 'No se pudo mostrar el valor',
    agregarTitulo: 'Agregar una variable',
    agregarNombre: 'NOMBRE',
    agregarValor: 'valor',
    agregar: 'Agregar',
    nombreInvalido:
      'Use letras, números, guion bajo y punto, sin empezar por un número; y que no exista ya.',
    comparar: {
      titulo: 'Comparar con el archivo de ejemplo',
      sinEjemplo: 'El proyecto no tiene .env.example para comparar.',
      alDia: 'El .env tiene las mismas variables que el ejemplo.',
      faltan: (n: number) => `Faltan ${n}:`,
      sobran: (n: number) => `Sobran ${n} (no están en el ejemplo):`,
      distintas: (n: number) => `${n} con un valor distinto del ejemplo:`,
      agregarFaltantes: 'Agregar las que faltan',
    },
    bloques: {
      titulo: 'Agregar un bloque de variables',
      ayuda:
        'Agrega solo las variables de ese tema que faltan en el .env (las que ya tiene no se tocan), sin contraseñas ni claves; complételas después en la tabla.',
      bd: 'Base de datos',
      correo: 'Correo',
      ia: 'IA',
      redis: 'Redis',
      meilisearch: 'Meilisearch (con su clave)',
    },
    usuarioPropio: {
      titulo: 'Usar usuario propio',
      ayuda:
        'Crea un usuario de la base solo para este proyecto (con permisos únicamente sobre su base, nunca de administrador) y lo escribe en el .env. Hoy funciona con MySQL y MariaDB de WolfCore Dev.',
      confirmarTitulo: '¿Usar un usuario propio para la base?',
      confirmarTexto:
        'Se crea un usuario nuevo con una clave aleatoria, con permisos solo sobre la base de este proyecto, y se cambian el usuario y la clave de la conexión en el .env. Antes se guarda una copia del .env actual; la clave nueva queda en el .env del proyecto y cifrada en WolfCore Dev.',
      confirmar: 'Crear y usar',
      hecho: (usuario: string) => `El proyecto ahora usa el usuario ${usuario}.`,
      compartirTitulo: '¿Compartir el usuario de otro proyecto?',
      compartirTexto: (base: string, proyecto: string) =>
        `La base ${base} también la usa ${proyecto}. ¿Compartir su usuario? Este proyecto usará el mismo usuario y la misma clave; la clave no cambia, así que ${proyecto} sigue conectado.`,
      compartir: 'Compartir el usuario',
      error: 'No se pudo cambiar el usuario de la base',
    },
    copias: {
      titulo: 'Volver a una copia',
      ninguna: 'Aún no hay copias de este .env.',
      volver: 'Volver a esta copia',
      confirmarTitulo: '¿Volver a una copia del .env?',
      confirmarTexto: (fecha: string) =>
        `El .env actual se reemplaza por la copia del ${fecha}. Antes se guarda otra copia del actual, así que también se puede deshacer.`,
      hecho: 'Se volvió a la copia.',
      error: 'No se pudo volver a la copia',
    },
    cambiosPendientes: (n: number) => `${n} cambios sin guardar`,
    descartar: 'Descartar cambios',
    guardar: 'Revisar y guardar…',
    cerrar: 'Cerrar',
    cerrarTitulo: '¿Cerrar sin guardar?',
    cerrarTexto: (n: number) => `Hay ${n} cambios sin guardar. Si cierra, se pierden.`,
    cerrarDescartar: 'Cerrar y descartar',
    seguirEditando: 'Seguir editando',
    confirmar: {
      titulo: 'Guardar los cambios del .env',
      texto:
        'Esto es lo que cambiará. Los valores secretos se muestran enmascarados. Se guarda una copia con fecha del .env actual y el archivo se escribe de una sola vez.',
      sinCambios: 'No hay cambios que guardar.',
      agregarGitignore: 'Agregar .env al .gitignore del proyecto',
      aceptarVersionado: 'Entiendo el riesgo y quiero guardar de todos modos',
      guardar: 'Guardar cambios',
      versionado:
        'Git ya sigue el .env de este proyecto: el próximo commit subiría sus valores aunque esté en .gitignore. Quítelo del índice con git rm --cached .env.',
      versionadoDesconocido:
        'No se pudo comprobar si git sigue el .env de este proyecto; confirme aparte para guardar.',
    },
    errorVistaPrevia: 'No se pudo preparar la vista previa',
    errorGuardar: 'No se pudo guardar el .env',
    guardado: 'El .env se guardó.',
    guardadoConCopia: 'El .env se guardó; la versión anterior quedó como copia.',
  },
  /** Estados vacíos que guían: qué es, por qué está vacío y la acción principal (D38b). */
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Aún no hay un motor de bases de datos',
      texto:
        'Instale MySQL, MariaDB, PostgreSQL o MongoDB desde Servicios para crear y administrar las bases de sus proyectos.',
      accion: 'Ir a Servicios',
    },
    serviciosVacio: {
      titulo: 'Todavía no hay servicios instalados',
      texto:
        'Los servicios (Nginx, PHP, bases de datos…) son lo que hace funcionar sus sitios. Empiece por Nginx y PHP, o por una base de datos.',
      accion: 'Instalar un servicio',
    },
    registrosSinFuentes: {
      titulo: 'Aún no hay registros',
      texto:
        'Los registros aparecen cuando un servicio, un sitio o un proceso escribe el primero. Encienda un servicio y vuelva aquí.',
      accion: 'Ir a Servicios',
    },
    registrosElegir: {
      titulo: 'Elija un registro',
      texto: 'Escoja una fuente en el selector de arriba para seguir sus líneas en vivo.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Todavía no llegó ningún volcado',
      texto:
        'Cuando un sitio ejecute dump(), dd() o wd(), el volcado aparece aquí al instante. Abra su sitio y ejecute ese código.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'La captura está apagada',
      texto:
        'Con la captura encendida, los dump() y dd() de sus sitios llegan aquí sin tocar el navegador. Actívela y encienda un sitio.',
      accion: 'Activar captura',
    },
    depuracionElegir: {
      titulo: 'Elija un volcado',
      texto: 'Pulse un volcado de la lista para ver su contenido, el archivo y la URL de origen.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Sin errores en los registros',
      texto:
        'Aquí aparecen, agrupados, los errores de PHP, Nginx y de sus proyectos en cuanto se escriben. Que esté vacío es buena señal.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Elija un error',
      texto: 'Pulse un error de la lista para ver su traza y abrir el archivo en el editor.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Todavía no hay una revisión',
      texto:
        'El Doctor revisa puertos, hosts, certificados y versiones, y le dice cómo arreglar lo que falle. Lance la primera revisión.',
      accion: 'Revisar ahora',
    },
    doctorSinHallazgos: {
      titulo: 'Todo en orden',
      texto:
        'La última revisión no encontró problemas. Vuelva a revisar si algo deja de responder.',
      accion: 'Revisar de nuevo',
    },
    contenedoresVacio: {
      titulo: 'No hay contenedores',
      texto:
        'Aquí aparecen los contenedores de Docker o Podman de este equipo. Cree uno con docker run o docker compose y pulse Refrescar.',
      accion: 'Refrescar',
    },
    avisos: {
      titulo: 'No hay avisos',
      texto:
        'Aquí aparecerán las caídas de servicios, los puertos ocupados y los certificados por vencer.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Todavía no hay instantáneas',
      texto:
        'Una instantánea guarda el estado de esta base para volver a él si algo sale mal. Tome la primera con el botón de arriba.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Este servidor no tiene bases propias',
      texto: 'Cree una base para su proyecto o importe un volcado existente.',
      accion: 'Crear base',
    },
    iaNube: {
      titulo: 'Aún no hay proveedores de IA',
      texto:
        'Un proveedor (OpenAI, Anthropic, OpenRouter y otros) permite usar modelos en la nube desde sus agentes. La clave se guarda cifrada en este equipo.',
      accion: 'Agregar proveedor',
    },
    iaSinModelos: {
      titulo: 'Todavía no hay modelos locales',
      texto: 'Descargue un modelo de la lista de más abajo para usarlo sin conexión.',
      accion: '',
    },
    versiones: {
      titulo: 'No hay versiones para mostrar',
      texto: 'La lista se descarga del catálogo oficial. Revise su conexión y actualice la lista.',
      accion: 'Actualizar lista',
    },
    buscar: {
      titulo: 'Sin coincidencias',
      texto:
        'Nada en la carpeta coincide con el texto buscado. Pruebe con otras palabras, desmarque «Distinguir mayúsculas» o revise los filtros de archivos.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Recorrido de bienvenida',
    paso: (n: number, total: number) => `Paso ${n} de ${total}`,
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    saltar: 'Saltar',
    terminar: 'Empezar',
    cerrar: 'Cerrar el recorrido',
    reabrir: 'Pulse Esc para salir. Puede volver a verlo desde Ajustes › Apariencia.',
    ir: (destino: string) => `Ir a ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Bienvenido a WolfCore Dev',
        texto:
          'Su entorno de desarrollo local en una sola ventana: servicios, sitios .test con HTTPS, bases de datos, correo y herramientas. Este recorrido dura un minuto y no cambia nada en su equipo.',
      },
      servicios: {
        titulo: 'Servicios',
        texto:
          'Encienda aquí Nginx, PHP y las bases de datos con un interruptor. Si aún no están instalados, la pestaña Versiones los descarga con la huella verificada.',
      },
      proyectos: {
        titulo: 'Proyectos',
        texto:
          'Cree un proyecto nuevo o importe una carpeta o un repositorio. Cada sitio recibe su propia dirección .test con HTTPS.',
      },
      bases: {
        titulo: 'Bases de datos',
        texto:
          'Cree bases, importe y exporte volcados, y haga respaldos y restauraciones sin salir de la aplicación.',
      },
      herramientas: {
        titulo: 'Herramientas y Ctrl+K',
        texto:
          'Editor, buscador, comparador, contraseñas, imágenes y más, agrupadas por secciones. Pulse Ctrl+K en cualquier pantalla para saltar a lo que busque.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Revisa puertos, hosts, certificados y versiones, y le propone cómo arreglar lo que falle. Ábralo cuando algo no responda.',
      },
      listo: {
        titulo: 'Todo listo',
        texto:
          'Empiece por encender un servicio o por crear su primer proyecto. Puede volver a ver este recorrido desde Ajustes › Apariencia.',
      },
    },
  },
  /** Resultado de importar o exportar un perfil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Respaldo y perfiles',
      descripcion:
        'Un perfil lleva su entorno a otro equipo: sitios, versiones, instancias, plantillas y ajustes. Nunca lleva claves, tokens ni contraseñas.',
      aislado: {
        titulo: 'Carpeta de prueba',
        texto: (ruta: string) =>
          `WolfCore Dev usa una carpeta de datos de prueba (${ruta}). Lo que haga aquí no toca su carpeta real ni su equipo: no se escribe el archivo hosts ni se instalan certificados.`,
      },
      exportar: {
        titulo: 'Exportar el entorno',
        texto:
          'Guarda un archivo .wolfperfil con sus sitios, versiones, instancias, plantillas y ajustes.',
        bases: 'Incluir las bases de datos',
        basesAyuda:
          'Los volcados completos (con los datos de sus clientes) viajan cifrados con la frase.',
        ca: 'Incluir la autoridad de certificación (CA)',
        caAyuda: 'Va cifrada con la frase. Impórtela solo en un equipo suyo.',
        certificados: 'Incluir los certificados de los sitios',
        certificadosAyuda: 'Solo viajan junto con la CA y cifrados con ella.',
        frase: 'Frase',
        fraseRepetir: 'Repetir la frase',
        fraseAyuda: (minimo: number) =>
          `Al menos ${minimo} caracteres. Sin ella no se pueden recuperar las bases ni la CA, y no se guarda en ningún sitio.`,
        problemas: {
          frase_corta: (minimo: number) => `La frase debe tener al menos ${minimo} caracteres.`,
          frase_distinta: 'Las dos frases no coinciden.',
          certificados_sin_ca: 'Los certificados solo viajan junto con la CA.',
        },
        exportar: 'Exportar perfil…',
        nota: 'El perfil nunca lleva claves, tokens ni contraseñas, ni las instantáneas, la papelera, los respaldos ni la carpeta data.',
        listo: 'Perfil exportado',
        guardado: (archivo: string, tamano: string) => `Guardado en ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Importar un perfil',
        texto:
          'Elija un archivo .wolfperfil. Antes de cambiar nada verá todo lo que se reemplaza, se quita o queda pendiente, y se guarda una copia de lo que se reemplaza.',
        boton: 'Importar perfil…',
      },
      instantaneas: {
        titulo: 'Instantáneas del entorno',
        texto:
          'Antes de actualizar PHP o Nginx y antes de importar un perfil, WolfCore Dev guarda una copia de su configuración, de Nginx y de los php.ini, sin claves ni datos y solo para usted. Se conservan las 10 últimas.',
        compartidas:
          'Las 10 se comparten entre todos los motivos: al tomar una nueva se reemplaza la más antigua, también si fue manual.',
        tomar: 'Tomar una ahora',
        tomada: 'Instantánea guardada.',
        sinNada: 'Todavía no hay nada que copiar.',
        vacia: 'Todavía no hay instantáneas.',
        motivos: {
          actualizar: 'Antes de actualizar',
          'importar-perfil': 'Antes de importar un perfil',
          'limpiar-versiones': 'Antes de limpiar versiones',
          manual: 'A mano',
        },
      },
    },
    reasignar: {
      titulo: 'Carpetas de los sitios',
      texto:
        'Estas carpetas vienen del otro equipo. Busque dónde están en este o importe el sitio como pendiente: queda sin carpeta hasta que la elija.',
      sitio: 'Sitio',
      origen: 'Carpeta en el perfil',
      destino: 'Carpeta en este equipo',
      existe: 'Existe',
      noExiste: 'No existe en este equipo',
      buscar: 'Buscar carpeta…',
      cambiar: 'Cambiar',
      comoPendiente: 'Importar igual como pendiente',
      prefijo: (viejo: string, nuevo: string) =>
        `Usar el mismo cambio para los demás (${viejo} → ${nuevo})`,
      omitido: 'No se importará',
    },
    asistente: {
      titulo: 'Importar un perfil',
      pasos: {
        archivo: 'Archivo',
        revisar: 'Revisar',
        confirmar: 'Confirmar',
        resultado: 'Resultado',
      },
      archivo: {
        texto:
          'Elija el archivo .wolfperfil. Todavía no se cambia nada: primero verá lo que se va a reemplazar, quitar o dejar pendiente.',
        elegir: 'Elegir archivo…',
        cambiar: 'Elegir otro',
        ninguno: 'Ningún archivo elegido',
        leyendo: 'Leyendo el perfil…',
        error: 'No se pudo leer el perfil',
      },
      origen: (fecha: string, sistema: string) => `Creado el ${fecha} en ${sistema}.`,
      ignoradas: (n: number) => `${n} entradas del archivo no son de un perfil y se ignoran.`,
      reemplaza: {
        titulo: 'Lo que se reemplaza',
        ninguno: 'No hay datos en esta carpeta: se importa sobre una instalación limpia.',
        copia:
          'Antes de reemplazar se copia en respaldos/pre-perfil-… y se toma una instantánea del entorno; cada base que se reemplaza tiene su propia instantánea. La carpeta data nunca se borra.',
        config: 'La configuración (config.json)',
        sitio: (id: string) => `El sitio ${id}`,
        base: (instancia: string, base: string) => `La base ${base} (${instancia})`,
        plantilla: (id: string) => `La plantilla ${id}`,
        ca: 'La autoridad de certificación (CA) de este equipo',
      },
      versiones: {
        titulo: 'Versiones',
        ninguna: 'El perfil no trae versiones.',
        instalada: 'Ya instalada',
        descargar: 'Se descargará con su huella verificada',
        pendienteDebil: 'Pendiente: sin huella fuerte, instálela a mano',
        pendienteFuera: 'Pendiente: ya no está en el catálogo',
        huellas: {
          fuerte: 'Huella SHA-256 o SHA-512',
          firmada: 'Firmada',
          debil: 'Huella débil',
          ninguna: 'Sin huella',
        },
        descargas: (n: number) =>
          `Se descargarán ${n} versiones de sitios oficiales, cada una con su huella o firma verificada.`,
      },
      instancias: {
        titulo: 'Instancias de bases de datos',
        existente: 'Ya existe: se conserva con su puerto y su versión',
        nueva: (puerto: number) => `Se crea con credenciales nuevas en el puerto ${puerto}`,
        reasignada: (de: number, a: number) => `El puerto ${de} está ocupado: usará el ${a}`,
      },
      bases: {
        titulo: 'Bases de datos',
        ninguna: 'El perfil no trae bases.',
        texto:
          'Se restauran con un usuario limitado a cada base y solo con sentencias permitidas. Las que ya existen se respaldan antes.',
        omitir: 'Importar sin las bases',
      },
      plantillas: {
        titulo: 'Plantillas',
        existe: 'Ya existe: se reemplaza',
        nueva: 'Nueva',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Solo llevan referencias a bases de datos y servicios (los procesos de proyectos no viajan). Se validan contra lo que existe aquí y nunca arrancan solos.',
        existe: 'Ya tiene uno con el mismo id: se conserva el suyo',
        nuevo: 'Nuevo',
        elementos: (n: number) => (n === 1 ? '1 elemento' : `${n} elementos`),
        invalidos: (n: number) => `${n} del perfil no son válidos y no se importan.`,
      },
      quitado: {
        titulo: 'Lo que no se toma de la configuración',
        texto:
          'Esta carpeta de datos está limpia: del perfil no se toma lo que apunta fuera de este equipo.',
      },
      puertos: {
        titulo: 'Puertos ocupados',
        texto: (lista: string) =>
          `Estos puertos del perfil ya los usa otro programa en este equipo: ${lista}. Cámbielos desde Servicios después de importar.`,
      },
      ca: {
        titulo: 'Autoridad de certificación (CA)',
        texto:
          'El perfil trae una CA cifrada. Impórtela solo si es la suya: este equipo aceptaría los certificados que firme.',
        huella: 'Huella SHA-256 de la CA del perfil',
        comparar: 'Compárela con la de su equipo de origen antes de aceptarla.',
        importar: 'Importar la CA del perfil',
        noImportar: 'Sin importarla, este equipo usa su CA actual o crea una nueva.',
        ajena:
          'Esta CA tiene restricciones de nombre que no son las de WolfCore Dev: no se puede importar.',
        sinRestricciones:
          'Esta CA no tiene restricciones de nombre: puede firmar certificados de cualquier sitio web, también de bancos y correo. Impórtela solo si es la suya y la huella coincide.',
        aceptarSin: 'Entiendo el riesgo: es mi CA y la huella coincide',
        reemplazaLocal:
          'Este equipo ya tiene una CA. Importar la del perfil la reemplaza (queda una copia en el respaldo previo).',
        reemplazar: 'Reemplazar la CA de este equipo',
        noSeInstala: 'La CA no se instala sola en el almacén de certificados del sistema.',
      },
      frase: {
        titulo: 'Frase del perfil',
        texto: 'El perfil trae bases o la CA cifradas. Escriba la frase que eligió al exportarlo.',
        campo: 'Frase',
        omitirBases: 'Importar sin las bases',
        nota: 'La frase solo se usa en esta ventana: no se guarda y se borra al terminar o al cerrar.',
      },
      env: {
        titulo: 'Conexión de los proyectos',
        texto:
          'Marque los proyectos cuyo .env debe apuntar a un usuario propio nuevo de su base (con copia previa del .env). Los demás no se tocan y quedan informados.',
      },
      confirmar: {
        titulo: 'Confirmar la importación',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Se importarán ${sitios} sitios, ${versiones} versiones y ${bases} bases.`,
        importar: 'Importar',
        revisar: 'Revisar',
        volver: 'Volver',
        bloqueos: {
          sitios_sin_carpeta:
            'Elija la carpeta de cada sitio o márquelo para importarlo como pendiente.',
          frase_requerida: 'Escriba la frase del perfil o importe sin las bases.',
          ca_ajena: 'La CA del perfil no se puede importar.',
          ca_sin_restricciones: 'Confirme aparte que quiere importar una CA sin restricciones.',
          reemplazar_ca: 'Confirme aparte que quiere reemplazar la CA de este equipo.',
        },
      },
      progreso: 'Importando el perfil… No cierre la ventana: con bases o descargas puede tardar.',
      fases: {
        copia: 'Copiando lo que se reemplaza',
        versiones: 'Instalando versiones',
        configuracion: 'Guardando la configuración y los sitios',
        plantillas: 'Copiando plantillas',
        ca: 'Preparando la CA y los certificados',
        bases: 'Restaurando bases de datos',
        env: 'Reescribiendo los .env',
      },
      avance: (paso: number, de: number) => `Paso ${paso} de ${de}`,
      resultado: {
        titulo: 'Resultado de la importación',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} importados, ${pendientes} pendientes, ${omitidos} omitidos y ${errores} con error.`,
        respaldo: (ruta: string) => `Copia de lo que se reemplazó: ${ruta}`,
        pendientes: 'Lo que quedó pendiente se puede completar a mano.',
        error: 'No se pudo importar el perfil',
        secciones: {
          sitios: 'Sitios',
          versiones: 'Versiones',
          instancias: 'Instancias',
          bases: 'Bases',
          plantillas: 'Plantillas',
          workspaces: 'Workspaces',
          env: 'Archivos .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Importado',
          pendiente: 'Pendiente',
          omitido: 'Omitido',
          error: 'Error',
          instalada: 'Instalada',
          ya_instalada: 'Ya estaba',
          creada: 'Creada',
          existente: 'Ya existía',
          puerto_reasignado: 'Puerto reasignado',
          reescrito: 'Reescrito',
          sin_marcar: 'Sin marcar',
        },
        ca: {
          importada: 'CA importada',
          nueva: 'CA nueva generada',
          sin_cambios: 'La CA no cambió',
        },
        quitarCa: {
          boton: 'Quitar la CA anterior…',
          titulo: 'Quitar la CA anterior de la confianza',
          texto:
            'Se quitará del almacén de certificados del sistema la CA que este equipo tenía antes. Windows puede pedir confirmación. La CA nueva no se instala sola.',
          si: 'Quitar',
          hecho: 'CA anterior quitada de la confianza.',
        },
        descartadosWorkspace: (lista: string) => `No existe aquí y se quitó: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} workspaces no válidos no se importaron.`,
        puerto: (de: number, a: number) => `Puerto ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Copia del .env: ${ruta}`,
      },
    },
    /** Aviso fuerte de la vista previa: la CA del perfil no tiene restricciones de nombre. */
    caSinRestricciones:
      'Esta CA puede firmar cualquier sitio web; impórtela solo si es la suya, compare la huella.',
    motivos: {
      procesos_quitados: 'Sus procesos (comandos de otro equipo) no se importaron.',
      tareas_quitadas:
        'Sus tareas programadas (comandos de otro equipo) no se importaron. Vuelva a crearlas o adóptelas desde wolfcore.yml.',
      tunel_con_nombre: 'Su túnel con nombre no viaja: vuelve al túnel rápido.',
      php_ini: 'Algunos ajustes de php.ini no se importaron.',
      xdebug: 'Su ajuste de Xdebug no era válido y se quitó.',
      nginx_desactivado:
        'Sus reglas de Nginx quedan guardadas pero sin aplicar: revíselas en el editor.',
      carpeta_no_existe: 'Su carpeta no existe en este equipo: búsquela.',
      correo_sin_proveedor: 'Su proveedor SMTP no se importó: usa el captador de correo.',
      sitio_invalido: 'El sitio no es válido.',
      dominio_invalido: 'Su dominio no es válido (debe terminar en .test).',
      ruta_protegida: 'Su carpeta es del sistema o de WolfCore Dev: no se importa.',
      dominio_en_uso: 'Otro sitio de este equipo ya usa ese dominio.',
      sitio_repetido: 'El sitio está repetido en el perfil.',
      no_disponible: 'Esa versión ya no está en el catálogo.',
      huella_debil: 'Esa versión no tiene una huella fuerte: instálela a mano desde Versiones.',
      tope_descargas:
        'No se descargó para no hacer demasiadas descargas a la vez: instálela desde Versiones.',
      instancia_pendiente: 'Su instancia quedó pendiente.',
      motor_no_soportado: 'Ese motor no se importa desde un perfil.',
      version_pendiente: 'Su versión del motor quedó pendiente.',
      danada: 'Sus archivos en el perfil están dañados.',
      bases_omitidas: 'Se importó sin las bases.',
      instancia_apagada: 'Su instancia no se pudo encender.',
      sin_copia_previa: 'No se pudo tomar la instantánea previa: la base no se reemplazó.',
      sin_base: 'Su .env no apunta a una base local.',
      base_no_resuelta: 'No se supo de qué instancia es su base.',
      error_inesperado: 'Algo falló.',
    },
    avisos: {
      ca_reemplazada:
        'La CA anterior de este equipo sigue en el almacén de confianza del sistema y ya no se usa. Puede quitarla desde aquí.',
      base_no_incluida: 'No se incluyó la base {base} ({instancia}).',
      sin_ca: 'No hay una CA en este equipo: el perfil va sin ella.',
      ca_no_importada: 'La CA del perfil no se importó: se usa la de este equipo o una nueva.',
      certificados: 'No se pudieron preparar los certificados: {detalle}',
      aplicar:
        'Los sitios importados no quedaron aplicados del todo (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Proveedor de IA {id}: usa una URL propia.',
      smtp: 'Proveedor SMTP {id}: su host no es de un proveedor conocido o falta su usuario.',
      puerto: 'Puerto de {id}: fuera de rango, vuelve al de siempre.',
      carpeta_vigilada: 'La carpeta vigilada es de otro equipo.',
    },
  },

  consultasLentas: {
    boton: 'Consultas lentas',
    titulo: (motor: string) => `Consultas lentas de ${motor}`,
    descripcion:
      'Las consultas que tardan más que el tiempo que usted elija, de la más lenta a la más rápida.',
    cargando: 'Cargando consultas lentas…',
    estadoTitulo: 'Estado del registro',
    estadoActivo: (s: string) => `Registro activo: se anotan las consultas de más de ${s} s.`,
    estadoApagado: 'El registro está apagado.',
    noGestionada:
      'Este servidor no lo gestiona WolfCore Dev (por ejemplo, el de otro programa): aquí solo se puede ver, no cambiar.',
    umbral: 'Anotar consultas de más de (segundos)',
    activar: 'Activar el registro',
    aplicarUmbral: 'Cambiar el tiempo',
    desactivar: 'Desactivar el registro',
    actualizar: 'Volver a leer el registro',
    confirmarTitulo: 'Cambiar el registro de consultas lentas',
    confirmarActivar: (motor: string, s: string) =>
      `Se activará el registro en todo el servidor ${motor} (consultas de más de ${s} s) y quedará guardado en su configuración. Afecta a todas sus bases.`,
    confirmarDesactivar: (motor: string) =>
      `Se desactivará el registro en todo el servidor ${motor} y quedará guardado en su configuración. Lo ya anotado se conserva.`,
    confirmarBoton: 'Confirmar el cambio',
    cancelar: 'Cancelar',
    activado: 'Registro de consultas lentas activado',
    desactivado: 'Registro de consultas lentas desactivado',
    privacidad:
      'El SQL se muestra con los valores cambiados por «?», porque puede contener datos reales de clientes. Nada de esto sale de este equipo ni se escribe en los registros de la aplicación.',
    columnas: {
      duracion: 'Duración',
      filas: 'Filas examinadas',
      base: 'Base',
      fecha: 'Fecha',
      sql: 'Consulta',
      acciones: 'Acciones',
    },
    sinBase: 'Sin atribuir',
    verLiteral: 'Ver literal',
    ocultarLiteral: 'Ocultar literal',
    literalAviso: 'SQL tal cual, con sus valores',
    sqlOculto: 'SQL oculto',
    sqlOcultoAyuda:
      'No se puede mostrar esta consulta sin riesgo de enseñar datos: este servidor tiene bases con datos reales o la consulta no se puede atribuir con seguridad a una base.',
    copiar: 'Copiar',
    copiado: 'Consulta copiada',
    truncado: (n: number) =>
      `Se muestran como mucho las ${n} más lentas de la cola del registro (los últimos 5 MB).`,
    vacioTitulo: 'Todavía no hay consultas lentas anotadas',
    vacioTextoApagado:
      'Active el registro y use sus sitios: las consultas que tarden más que el tiempo elegido aparecerán aquí.',
    vacioTextoActivo:
      'Por ahora ninguna consulta superó el tiempo elegido. Use sus sitios y vuelva a leer el registro.',
  },
  esquemaBd: {
    boton: 'Ver esquema',
    titulo: (base: string) => `Esquema de ${base}`,
    descripcion:
      'Solo lectura: tablas, columnas, claves y relaciones. No se lee ningún dato de sus tablas.',
    cargando: 'Leyendo el esquema…',
    error: 'No se pudo leer el esquema de la base.',
    reintentar: 'Reintentar',
    buscar: 'Buscar una tabla',
    tablas: (n: number) => plural(n, 'tabla', 'tablas'),
    vista: 'vista',
    truncado: (n: number) => `La lista se recortó a ${n} tablas: hay más en la base.`,
    sinResultados: 'Ninguna tabla coincide con la búsqueda.',
    elegir: 'Elija una tabla de la lista para ver sus columnas, claves y relaciones.',
    columnas: 'Columnas',
    indices: 'Índices',
    sinIndices: 'Esta tabla no tiene índices.',
    relaciones: 'Relaciones',
    sinRelaciones: 'Esta tabla no tiene relaciones con otras.',
    salientes: 'Hace referencia a',
    entrantes: 'Es referenciada por',
    alBorrar: 'Al borrar:',
    alActualizar: 'Al actualizar:',
    irA: (tabla: string) => `Ir a la tabla ${tabla}`,
    col: {
      nombre: 'Columna',
      tipo: 'Tipo',
      nulo: 'Admite nulo',
      defecto: 'Por defecto',
      clave: 'Clave',
    },
    si: 'Sí',
    no: 'No',
    pk: 'PK',
    unico: 'único',
    vacioTitulo: 'Esta base no tiene tablas',
    vacioTexto:
      'Cuando cree tablas (por ejemplo, con las migraciones de su proyecto) aparecerán aquí.',
  },
};

export type Textos = typeof es;
