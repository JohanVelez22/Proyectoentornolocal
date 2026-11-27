/** English UI texts. Same keys and same function signatures as es.ts (a test checks it). */
import type { Textos } from './es';

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

export const en: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'Your local stack, ready to work',
    version: 'Version',
  },
  nav: {
    inicio: 'Home',
    proyectos: 'Projects',
    agentes: 'Agents',
    servicios: 'Services',
    basesDeDatos: 'Databases',
    correo: 'Mail',
    php: 'PHP',
    ia: 'AI',
    tuneles: 'Tunnels',
    contenedores: 'Containers',
    herramientas: 'Tools',
    doctor: 'Doctor',
    depuracion: 'Debugging',
    registros: 'Logs',
    ajustes: 'Settings',
    contraer: 'Collapse menu',
    expandir: 'Expand menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'service running', 'services running'),
    tuneles: (n: number) => plural(n, 'active tunnel', 'active tunnels'),
    cargando: 'Connecting to the core…',
    conErrores: 'with errors',
    sinConexion: 'No connection to the core',
    /** Short pill text (always visible, 14 characters at most). */
    cortoApagado: 'All off',
    cortoEncendidos: (n: number) => `${n} running`,
    cortoErrores: (n: number) => plural(n, 'with error', 'with errors'),
    cortoCargando: 'Connecting…',
    cortoSinConexion: 'Offline',
    irAServicios: 'Open Services',
  },
  estado: {
    encendido: 'Running',
    apagado: 'Stopped',
    iniciando: 'Starting…',
    error: 'Error',
    externo: 'External',
    activo: 'Active',
    aviso: 'Attention',
  },
  acciones: {
    encender: 'Start',
    apagar: 'Stop',
    iniciarTodo: 'Start all',
    detenerTodo: 'Stop all',
    abrir: 'Open',
    copiar: 'Copy',
    copiado: 'Copied to clipboard',
    copiarCompleto: 'Copy the full text',
    guardar: 'Save',
    cerrar: 'Close',
    abrirCarpeta: 'Open folder',
    instalar: 'Install',
    reintentar: 'Retry',
    cancelar: 'Cancel',
    borrar: 'Delete',
    editar: 'Edit',
    duplicar: 'Duplicate',
    renovar: 'Renew',
    masAcciones: 'More actions',
    actualizar: 'Update',
    quitar: 'Remove',
    reinstalar: 'Reinstall',
  },
  errores: {
    titulo: 'The action could not be completed',
    arranque: 'Could not read the environment status',
    desconocido: 'An unexpected error occurred.',
    /** Details the core sends as a code inside an error. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'unclosed quotes',
      'sintaxis.tras_comillas': 'a space or “;” is missing after the quotes',
      'sintaxis.punto_y_coma_inesperado': '“;” without a directive',
      'sintaxis.llave_inesperada': '“{” without a directive',
      'sintaxis.falta_punto_y_coma': 'missing “;” at the end of the directive',
      'sintaxis.sobra_llave': 'extra “}”',
      'sintaxis.falta_llave': 'missing “}”',
    },
    codigos: {
      'git.cambios_locales':
        'There are unsaved changes in the folder: commit or discard them before pulling. Nothing was touched.',
      'git.divergencia':
        'The branch has diverged from the remote (different local and remote commits): resolve it by hand. Nothing was touched.',
      'git.sin_upstream':
        'The current branch does not track any remote branch: there is nothing to pull from.',
      'git.sin_rama': 'The repository is on a detached commit (no branch): nothing was touched.',
      'git.no_repositorio': 'The folder is not a git repository.',
      'git.destino_no_vacio': 'The destination folder is not empty.',
      'git.destino_es_archivo': 'The destination is a file, not a folder.',
      'git.no_encontrado': 'git was not found: install it first.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) was not found: install it first.',
      'git.plazo': 'The clone exceeded the {minutos} min limit and was cancelled.',
      'git.token_invalido': 'The GitHub token is not valid.',
      'git.url_con_credenciales':
        'The URL must not include a user or password: use a token instead.',
      'servicios.desconocido': 'Unknown service: {id}.',
      'servicios.no_instalado': '{nombre} is not installed. Install it from Services.',
      'servicios.puerto_invalido': 'The port must be a number between 1024 and 65535.',
      'servicios.puerto_asignado': 'Port {puerto} is already assigned to {otro}.',
      'servicios.puerto_ocupado':
        'Port {puerto} is used by {nombre} (PID {pid}). Close it or choose another port.',
      'servicios.confirmacion_borrado': 'To delete the data of {nombre}, type "{id}".',
      'servicios.ftp_no_disponible': 'The FTP server is not available.',
      'sistema.sin_cliente_ftp':
        'No FTP client is associated on this computer. Install one (for example FileZilla) or copy the address.',
      'servicios.mailpit_no_responde': 'Mailpit is not responding. Start it from Services.',
      'servicios.no_encendio': '{nombre} did not manage to start. Check Services and its logs.',
      'servicios.iniciar_todo_fallos':
        'Start all could not start: {nombres}. Check Services and their logs.',
      'servicios.respaldo_fallo':
        '{nombre} was not updated: the backup beforehand failed and nothing was changed.',
      'servicios.espacio_insuficiente':
        'Not enough space to copy the data: {necesarios} MB needed, {libres} MB free.',
      'servicios.actualizacion_revertida':
        'Version {version} did not start; {nombre} went back to {anterior}. The backup is kept.',
      'servicios.restauracion_fallo':
        'The new version did not start and the data of {nombre} could not be restored. Nothing was started: the touched data is in {fallida} and the backup in {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} belongs to a different major version: create it as a new instance.',
      'servicios.misma_version': '{id} already uses version {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} is blocked: an update could not restore its data. The touched data is in {fallida} and the backup in {respaldo}. Resolve it in Services → Versions before starting it.',
      'servicios.datos_apartados':
        '{nombre} has no data in its folder, but there is data set aside by an update: an empty folder is not created. Check Services → Versions.',
      'servicios.puerto_reservado':
        'Port {puerto} is reserved by the system ({desde}–{hasta}): choose another one.',
      'servicios.borrado_con_bloqueo':
        '{nombre} has an instance blocked after an update: resolve it before deleting its data.',
      'servicios.config_no_revertida':
        '{nombre} {version} did not start and the configuration could not go back to {anterior}. Choose {anterior} again in Services → Versions.',
      'servicios.puerto_revertido_apagada':
        '{nombre} did not start on the new port; it went back to {anterior}, but it did not start there either: it is stopped on port {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} did not start on port {nuevo} and the configuration could not go back to {anterior}: it is stopped.',
      'instancias.id_invalido': 'The instance identifier is not valid.',
      'instancias.no_existe': 'Instance {id} does not exist.',
      'instancias.existe': 'Instance {id} already exists.',
      'instancias.una_sola': '{nombre} supports a single instance.',
      'instancias.ultima': '{id} is the only instance: it cannot be removed.',
      'instancias.sin_puerto_libre': 'No free port was found for the instance.',
      'instancias.confirmacion': 'To continue, type "{id}".',
      'instancias.sin_datos': '{id} has no data in its folder: choose a backup to restore.',
      'instancias.respaldo_no_existe': 'That backup of {id} does not exist.',
      'instancias.respaldo_en_uso': '{id} is blocked and needs that copy: resolve it first.',
      'instancias.version_requerida':
        'It is unknown which version {id} should go back to: choose an installed version of the same major version.',
      'instalador.version_en_uso':
        'Cannot uninstall {servicio} {version}: instance {instancia} uses it.',
      'limpieza.sin_confirmar': 'Confirmation is required to clean up versions.',
      'limpieza.seleccion_invalida': 'The version selection is not valid.',
      'limpieza.en_curso': 'A version cleanup is already running.',
      'limpieza.no_existe': '{servicio} {version} is no longer installed.',
      'limpieza.en_uso': '{servicio} {version} is now in use: it was not removed.',
      'limpieza.ruta_insegura':
        'The folder of {servicio} {version} is not safe (a link or a path outside bin): it was not touched.',
      'limpieza.version_bloqueada':
        '{servicio} {version} has files in use or locked: it was not removed nor left half-done.',
      'limpieza.otro_volumen':
        '{servicio} {version} is on a different disk than the temporary data folder: it could not be moved whole and was not touched.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} has packages you installed (npm, pip…): you must accept losing them to remove it.',
      'limpieza.destino_ocupado':
        'A {servicio} {version} folder already exists in bin: it is not overwritten. Remove it before recovering the other one.',
      'bd.encender_servicio': 'Start {nombre} to manage its databases.',
      'bd.sin_credenciales': 'There are no saved credentials for {nombre}.',
      'bd.confirmacion_borrado': 'To delete the database {nombre}, type its exact name.',
      'bd.usuario_privilegiado':
        'User {usuario} is an administrator or a system role: choose a dedicated user for the project.',
      'bd.usuario_en_uso':
        'Another project already uses user {usuario}: its password is not changed so that project keeps its connection. Nothing was created.',
      'bd.rol_sin_login':
        'User {usuario} exists but cannot log in (role without LOGIN or a server access rule). Nothing was changed.',
      'bd.usuario_clave_distinta':
        'User {usuario} already exists with another password. Use its current password: it is not changed so other projects keep connecting.',
      'bd.mongosh_faltante': 'mongosh is missing: install it from Services to manage MongoDB.',
      'tuneles.sitio_no_encontrado': 'The project was not found.',
      'tuneles.sitio_no_confiable':
        '{dominio} is not trusted yet: tick «I trust this repository» in the project before publishing it.',
      'tuneles.confirmacion_requerida':
        'Publishing {dominio} on the internet must be confirmed in WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'The tunnel for {dominio} changed after you confirmed: confirm again.',
      'tuneles.cloudflared_no_instalado': 'cloudflared is not installed. Install it from Services.',
      'tuneles.proveedor_no_disponible': 'The tunnel provider {proveedor} is not available.',
      'tuneles.cloudflare_sin_cuenta':
        'Connect your Cloudflare account first in the tunnel options.',
      'tuneles.cloudflare_sin_credencial':
        'This tunnel has no saved credential: create it again in the tunnel options.',
      'tuneles.cloudflare_datos_invalidos':
        'The tunnel name (lowercase, numbers and hyphens) or the public domain is not valid.',
      'tuneles.cloudflare_conexion_en_curso': 'A Cloudflare connection is already in progress.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare registered {registrado} instead of {dominio}: the domain is not in the zone you authorized. Delete that record in the Cloudflare dashboard.',
      'tuneles.cloudflare_conexiones_activas':
        'The tunnel {nombre} has active connections (cloudflared requires -f to delete it). Close it on every computer where it is open and try again, or use “Forget only here”.',
      'tuneles.nombre_en_uso': 'The tunnel {nombre} is already used by another site.',
      'tuneles.dominio_en_uso': 'The domain {dominio} is already used by another site.',
      'tuneles.confirmacion_olvidar':
        'Forgetting or recreating the tunnel {nombre} must be confirmed.',
      'tuneles.cloudflare_fallo': 'cloudflared could not complete the operation: {detalle}',
      'tuneles.credencial_no_protegida':
        'The credential could not be restricted to your user, so it was not used.',
      'tuneles.sin_cifrado': 'System encryption is not available: credentials cannot be saved.',
      'tuneles.token_invalido':
        'The token is not valid: only letters, numbers and _ . - (8 to 200 characters). Save it again in the tunnel options.',
      'tuneles.ngrok_no_instalado':
        'ngrok is not installed on this computer. Install it from ngrok.com and try again.',
      'tuneles.ngrok_sin_token': 'The ngrok token is missing: save it in the tunnel options.',
      'tuneles.expose_sin_token': 'The Expose token is missing: save it in the tunnel options.',
      'tuneles.tailscale_no_instalado':
        'Tailscale is not installed on this computer. WolfCore Dev does not install it: get it from tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale is not signed in: sign in to Tailscale and try again.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale already publishes something on HTTPS port {puerto}. WolfCore Dev does not overwrite it: remove it with Tailscale and try again.',
      'lan.sitio_no_encontrado': 'The site was not found.',
      'lan.confirmacion_requerida':
        'Sharing {dominio} on the local network must be confirmed in WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} has real data: it is not shared on the local network, not even with confirmation. Use a copy without customer data.',
      'lan.sin_red':
        'No local network is connected (Wi-Fi or Ethernet). Connect to a network and try again.',
      'lan.ip_no_valida':
        'The address {ip} is no longer one of your local network. Reopen the dialog and confirm again.',
      'lan.requiere_https': '{dominio} redirects to HTTPS: share it with the HTTPS option.',
      'lan.sin_puertos':
        'There are no free ports between 8100 and 8199 for the local network (shared sites and the CA link use that range). Stop sharing a site or close the CA dialog and try again.',
      'tuneles.expose_no_instalado':
        'Expose is not installed. On Windows it only works with expose.phar: put it in {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose is not used with sites that have real data: its request inspector is visible on the whole local network. Use another provider.',
      'tuneles.confirmacion_requerida_tailnet':
        'Sharing {dominio} with your tailnet must be confirmed in WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Could not read what Tailscale already publishes on this computer, so nothing was opened to avoid overwriting it. Check that Tailscale is running and try again.',
      'tuneles.tailscale_no_habilitado':
        'Serve or Funnel is not enabled on your tailnet. Enable it at {enlace} and try again.',
      'tuneles.ngrok_desactualizado':
        'Your ngrok is an old version that does not support what WolfCore Dev needs. Update it (ngrok update) and try again.',
      'hosts.dominio_invalido': 'A domain is not valid.',
      'hosts.tiempo_agotado':
        'The administrator prompt got no answer within {segundos} s; the hosts file was not changed.',
      'https.sin_dominio': 'A certificate needs at least one domain.',
      'https.sin_autoridad':
        'The WolfCore Dev certificate authority does not exist. Install the CA from the HTTPS section before issuing certificates.',
      'clientehttp.peticion_invalida': 'Invalid data in the request: {campo}.',
      'clientehttp.variable_sin_definir':
        'The variable “{nombre}” is not defined in the active environment.',
      'clientehttp.secreto_faltante':
        'A stored secret value is missing: type it again and save the request or the environment.',
      'clientehttp.secreto_no_guardado':
        'A secret value could not be stored: it cannot have line breaks or exceed 16 KB, and the system encryption must be available.',
      'clientehttp.url_invalida': 'The URL is not valid.',
      'clientehttp.url_con_credenciales':
        'The URL cannot carry a user or password: use the authentication tab.',
      'clientehttp.protocolo': 'Only http:// and https:// URLs are accepted.',
      'clientehttp.cabecera_invalida': 'The header “{nombre}” is not valid.',
      'clientehttp.cuerpo_grande': 'The request body is larger than 1 MB.',
      'clientehttp.plazo': 'The request exceeded the {segundos} s timeout.',
      'clientehttp.cancelado': 'Request cancelled.',
      'clientehttp.sin_conexion':
        'Could not connect ({motivo}). Check the address, the port and that the server is running.',
      'clientehttp.certificado': 'The server certificate could not be verified ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'More than {max} redirects in a row.',
      'clientehttp.curl_invalido': 'The text is not a valid curl command.',
      'clientehttp.curl_grande': 'The curl text is too large (64 KB at most).',
      'clientehttp.no_existe': 'The item no longer exists.',
      'clientehttp.limite': 'The limit of stored items was reached.',
      'ejemplohttp.no_arranca': 'The example server could not be started.',
      'laboratoriogit.sin_git': 'Git is not installed on this computer.',
      'laboratoriogit.orden_invalida': 'That command is not in the lab list.',
      'laboratoriogit.nombre_invalido':
        'The name can only contain letters, numbers, hyphens and underscores (up to 30 characters).',
      'laboratoriogit.mensaje_invalido':
        'The message must be one line, up to 200 characters, and not start with “-”.',
      'laboratoriogit.archivo_invalido': 'That file is not one of the practice files.',
      'laboratoriogit.contenido_invalido': 'The content must be text of up to 2000 characters.',
      'laboratoriogit.ruta_insegura':
        'The lab folder is not the expected one, so it is left alone.',
      'laboratoriogit.fallo_sistema':
        'The system did not allow the lab folder to be prepared or used. Try «Reset lab».',
      'herramientas.pid_invalido': 'The PID is not valid.',
      'herramientas.pid_sistema': 'PID {pid} belongs to the system and cannot be ended.',
      'herramientas.proceso_propio': 'You cannot end WolfCore Dev or the process that started it.',
      'herramientas.proceso_inexistente': 'Process {pid} no longer exists.',
      'herramientas.sin_editor':
        'No code editor was found. Install one (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} is not installed. Choose another editor in Settings.',
      'herramientas.editor_invalido': 'That editor is not valid.',
      'herramientas.carpeta_sitio_inexistente': 'The project folder does not exist.',
      'herramientas.ruta_no_absoluta': 'The path must be absolute.',
      'herramientas.sin_seleccion': 'Choose at least one item.',
      'herramientas.dominio_invalido': 'A domain or IP is not valid.',
      'herramientas.demasiados_dominios': 'A certificate allows at most {maximo} domains or IPs.',
      'buscar.consulta_invalida': 'Type what to search for (up to 500 characters).',
      'buscar.raiz_invalida': 'The folder or file does not exist or is not valid.',
      'buscar.regex_invalida': 'The regular expression is not valid.',
      'buscar.regex_lenta': 'The regular expression takes too long: simplify it or use plain text.',
      'buscar.demasiadas': 'There are already {maximo} searches running: cancel one or wait.',
      'buscar.ruta_vetada': 'That folder holds WolfCore Dev data: it is not searched.',
      'buscar.resultado_caducado': 'That result is no longer available: search again.',
      'buscar.resultado_invalido': 'That result cannot be opened.',
      'diff.raiz_invalida': 'Choose two folders that exist and are not links.',
      'diff.ruta_vetada': 'That folder holds WolfCore Dev data: it is not compared.',
      'diff.cancelado': 'Comparison cancelled.',
      'diff.plazo': 'The comparison took more than {segundos} s and was cancelled.',
      'diff.memoria':
        'The comparison needs too much memory (more than {maximo}) and was cancelled.',
      'diff.ocupado': 'A comparison is already running: cancel it or wait.',
      'diff.caducado': 'That comparison is no longer available: compare again.',
      'diff.archivo_invalido': 'That file can no longer be compared: it changed or disappeared.',
      'diff.fallo': 'The comparison failed.',
      'compartir.confirmacion_requerida':
        'Sharing on the internet must be confirmed in the WolfCore Dev window.',
      'compartir.ocupado': 'Something is already shared: stop sharing first.',
      'compartir.ruta_invalida': 'Choose a folder or a file that exists.',
      'compartir.duracion_invalida': 'Choose 15 minutes, 1 hour or 4 hours.',
      'compartir.proveedor_invalido': 'That tunnel is not supported: use Cloudflare or ngrok.',
      'compartir.raiz_unidad': 'The root of a drive is not shared. Choose a folder inside it.',
      'compartir.carpeta_usuario':
        'The whole personal folder (or one that contains it) is not shared. Choose a subfolder.',
      'compartir.carpeta_datos': 'The WolfCore Dev data folder is not shared.',
      'compartir.sitio_datos_reales':
        'A site with real data (or anything inside it) is not shared.',
      'compartir.carpeta_secretos': 'That folder holds keys (.ssh, .aws, .git…) and is not shared.',
      'compartir.carpeta_sistema': 'System folders are not shared.',
      'compartir.archivo_sensible':
        'That file looks like it holds a secret or real data and is not shared.',
      'compartir.carpeta_perfil':
        'The data of the user’s programs (AppData, .claude, .config…) is not shared.',
      'compartir.archivo_grande':
        'That file is too large to check and is not a media file or a package: it is not shared.',
      'compartir.tunel_sin_url': 'The tunnel did not give its address in {segundos} s. Try again.',
      'compartir.tunel_cerrado': 'The tunnel closed before it finished opening.',
      'compartir.fallo': 'Could not share.',
      'disco.raiz_invalida': 'Choose a folder or drive that exists and can be read.',
      'disco.cancelado': 'Analysis cancelled.',
      'disco.plazo': 'The analysis took more than {minutos} min and was cancelled.',
      'disco.memoria': 'The analysis needs too much memory (over {maximo}).',
      'disco.ocupado': 'An analysis is already running: cancel it or wait.',
      'disco.caducado': 'That analysis is no longer available: analyze again.',
      'disco.entrada_invalida': 'That folder no longer exists or has changed: analyze again.',
      'disco.fallo': 'The analysis failed.',
      'terminal.no_abrio': 'The terminal could not be opened.',
      'terminal.no_instalada': '{nombre} is not installed. Choose another terminal in Settings.',
      'terminal.invalida': 'That terminal is not valid.',
      'terminal.powershell_restringido':
        'PowerShell is in Constrained Language Mode on this computer (organization policy or AppLocker): WolfCore Dev cannot open the terminal. Open it yourself in the project folder.',
      'proyectos.no_existe': 'The project does not exist.',
      'proyectos.no_confiado': 'Check "I trust this repository" to run the recipe.',
      'proyectos.receta_en_curso': 'A recipe is already running for this project.',
      'proyectos.paso_no_omitible': 'The "Create the site" step cannot be skipped.',
      'workspaces.no_existe': 'That workspace does not exist.',
      'workspaces.invalido': 'The workspace is not valid: check its name and its items.',
      'workspaces.captadores_exclusivos':
        'Two mail catchers cannot run at the same time: only one runs.',
      'workspaces.elemento_fallo':
        'The operation could not be completed for {elemento}. Check Services and its logs.',
      'workspaces.base_no_responde':
        '{elemento} was not started because that project’s database is not responding.',
      'reverb.no_laravel': 'Reverb is only available in Laravel projects.',
      'reverb.no_confiado': 'Tick “I trust this repository” on the project to turn Reverb on.',
      'reverb.sin_paquete':
        'The laravel/reverb package is missing: install it with composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Confirm that you want to turn Reverb on.',
      'reverb.sin_activar': 'Turn Reverb on in the project first.',
      'tareas.cron_invalida':
        'The cron expression is not valid. Use 5 fields: minute, hour, day of month, month and day of week (for example, 0 3 * * *).',
      'tareas.comando_invalido':
        'That command is not allowed. Use php, node, npm run or python with a project file, with no code on the command line (-r, -e, -c).',
      'tareas.invalida': 'The task is not valid: check its name, schedule and command.',
      'tareas.no_existe': 'That task no longer exists.',
      'tareas.sin_confirmar': 'Confirm the task’s command before it can run.',
      'tareas.sitio_no_confiado': 'Tick “I trust this repository” on the project to run its tasks.',
      'tareas.receta_cambio':
        'The project recipe changed since you trusted it: review it and tick “I trust this repository” again.',
      'tareas.aislado':
        'This is a test data folder (WOLFCORE_DATOS): allow scheduled tasks to run them.',
      'tareas.carpeta': 'The project folder does not exist: the task cannot run.',
      'tareas.en_curso': 'The task is already running.',
      'tareas.demasiadas': 'This project has too many tasks (maximum {maximo}).',
      'cli.no_autorizado':
        'The CLI command is not authorized: run it again with the WolfCore Dev app open.',
      'cli.orden_desconocida': 'WolfCore Dev does not know that CLI command.',
      'cli.argumentos_invalidos': 'The command arguments are not valid.',
      'cli.solicitud_grande': 'The request is too large (maximum {maximo} bytes).',
      'cli.formato_no_admitido': 'The request does not have the format the CLI accepts.',
      'cli.plazo':
        'The command took too long: it may still be running. Check its status in WolfCore Dev.',
      'cli.ocupado': 'WolfCore Dev is handling too many CLI commands: wait a moment.',
      'cli.requiere_confirmacion':
        'This command publishes or changes something and must be confirmed (--si) for {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} has real data: also confirm with the real-data option of the command (the domain of the site).',
      'cli.requiere_confirmacion_global':
        'Changing the PHP of all terminals must be confirmed (--si).',
      'cli.confirmacion_rechazada':
        'The confirmation in the WolfCore Dev window was rejected or unavailable: nothing was done.',
      'cli.confirmacion_vencida':
        'Nobody confirmed in the WolfCore Dev window in time: nothing was done.',
      'cli.tunel_fallo': 'The tunnel could not be opened. Check its log in WolfCore Dev.',
      'cli.inicio_fallo':
        'Not everything requested could be started. Check the logs in WolfCore Dev.',
      'cli.parada_fallo':
        'Not everything requested could be stopped. Check the logs in WolfCore Dev.',
      'cli.interno': 'Internal error in the CLI server.',
      'cli.proveedor_distinto':
        'The site uses a different tunnel provider ({proveedor}). Review it and confirm again.',
      'cli.sitio_no_encontrado': 'The site {sitio} does not exist.',
      'cli.carpeta_invalida':
        'The folder does not exist, is a system folder or is the WolfCore Dev data folder.',
      'cli.carpeta_sin_sitio':
        'That folder does not belong to any WolfCore Dev site: link it first.',
      'cli.ya_vinculada': 'That folder is already the site {sitio}.',
      'cli.tipo_no_soportado':
        'Projects of type {tipo} are created from the WolfCore Dev interface.',
      'cli.sitio_sin_php': 'The site {sitio} does not use PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} is not installed. Install it from Services.',
      'cli.fuente_no_existe': 'That log does not exist yet.',
      'cli.token_no_protegido':
        'The token file could not be restricted to the current user: the CLI is not enabled.',
      'cli.carpeta_ajena':
        'The run/ folder of the data folder belongs to another user: the CLI is not enabled.',
      'cli.ruta_invalida': 'The WolfCore Dev path has characters that wolf.cmd cannot hold.',
      'cli.path_aislado': 'With a test data folder (WOLFCORE_DATOS) the user PATH is not changed.',
      'cli.sin_cliente':
        'This build of WolfCore Dev does not include the wolf client (it still has to be built).',
      'cli.demasiados_dialogos':
        'Too many confirmations in the last minute: wait a moment and try again.',
      'cli.error': 'The command could not be completed: {detalle}',
      'proyectos.carpeta_no_vacia':
        'The project folder already has files: choose another one or empty it.',
      'secretos.sin_cifrado':
        'System encryption is not available: the password of the dedicated user cannot be stored. Nothing was changed.',
      'proyectos.clave_bd_falta':
        'The stored password for user {usuario} is missing: nothing was written. In the .env manager, "Use own user" generates a new password.',
      'env.archivo_grande': 'The variables file is too large (maximum {maximo}).',
      'env.no_regular': 'The .env is not a regular file: it is not read or modified.',
      'env.clave_inexistente': 'The variable {clave} does not exist.',
      'env.cambio_invalido': 'A change to the .env is not valid.',
      'env.variable_invalida': 'The change to variable {clave} is not valid.',
      'env.solo_lectura': 'Variable {clave} spans several lines: edit it by hand in the file.',
      'env.usuario_compartido':
        'Database {base} is also used by project {proyecto}: confirm whether you want to share its user.',
      'env.cambio_externo':
        'The .env changed after the preview was shown: review it again before saving.',
      'env.meilisearch_no_disponible': 'Meilisearch is not installed: install it in Services.',
      'env.sin_confirmar': 'Confirm that you want to save the .env changes.',
      'env.versionado':
        'Git already tracks this project’s .env: the next commit would upload its values. Confirm separately to continue.',
      'env.versionado_desconocido':
        'Could not check whether git tracks this project’s .env: confirm separately to continue.',
      'env.copia_invalida': 'The .env backup is not valid or no longer exists.',
      'env.sin_base': 'This project’s .env has no database connection.',
      'env.base_no_resuelta':
        'This project’s database is not on a local WolfCore Dev server: nothing was changed.',
      'env.motor_no_soportado': 'For now "Use own user" works with MySQL and MariaDB.',
      'env.ya_usa_usuario_propio': 'This project already uses its own user.',
      'plantillas.id_invalido': 'The template identifier is not valid.',
      'plantillas.no_existe': 'The template does not exist.',
      'plantillas.danada':
        'The template is damaged or was modified: it will not be used. Delete it and save it again.',
      'plantillas.demasiado_grande':
        'The project has too many files or is too large to save as a template (up to {maximo} files). Exclude large folders.',
      'plantillas.demasiado_pesada':
        'The project is too large to save as a template (up to {maximo}). Exclude large folders.',
      'plantillas.exclusion_invalida':
        'One of the exclusions is not valid (use relative names or paths, without "..").',
      'plantillas.nombre_invalido': 'The template name is not valid (1 to 60 characters).',
      'plantillas.esquema_fallo':
        'The project database schema could not be read: check that its service is running.',
      'plantillas.base_no_resuelta':
        'The template cannot be saved: the database server is remote or no local service uses that port.',
      'plantillas.sin_generador_base':
        'This project type has no base generator: the template must include the project files.',
      'plantillas.exclusiones_nuevas':
        'The template has a file that is now excluded ({archivo}): save it again from the project or delete it.',
      'plantillas.motor_distinto':
        'The template schema is from MySQL and the chosen server is MariaDB (or the other way around): there may be differences. Confirm that you want to continue.',
      'bd.sql_no_permitido':
        'The schema has a statement that is not structure and nothing was run: {sentencia}',
      'bd.extension_no_permitida':
        'The schema asks for extension {nombre}, which is not on the allowed list: nothing was restored.',
      'bd.esquema_fallo': 'The full schema could not be restored: nothing was left half done.',
      'bd.datos_no_permitidos':
        'The data dump contains something that is not data (only INSERT, LOCK TABLES and SET are accepted): nothing was imported.',
      'bd.datos_fallo':
        'The data could not be imported: the database was left as it was, nothing half done.',
      'bd.lentas_confirmar':
        'Changing slow query logging affects the whole server: it has to be confirmed. Nothing was changed.',
      'bd.lentas_umbral_invalido': 'The time must be between 0.1 and 60 seconds.',
      'bd.lentas_motor_no_soportado':
        'Slow queries can only be changed on MySQL, MariaDB and PostgreSQL managed by WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        'The SQL is not shown with its values: the database has real data or the query cannot be attributed to a known database.',
      'bd.lentas_entrada_no_existe': 'That query is no longer in the log. Read it again.',
      'bd.lentas_fallo':
        'The slow query log could not be read or changed. Check that the server is running.',
      'bd.esquema_base_no_existe': 'The database does not exist on that server.',
      'bd.esquema_motor_no_soportado': 'The schema viewer is for MySQL, MariaDB and PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'The database schema could not be read. Check that the server is running.',
      'perfiles.destino_invalido': 'Choose where to save the profile (a .wolfperfil file).',
      'perfiles.frase_debil': 'The CA passphrase must have at least {minimo} characters.',
      'perfiles.frase_incorrecta': 'The passphrase is not correct: nothing was imported.',
      'perfiles.certificados_sin_ca':
        'Site certificates only travel together with the encrypted CA: include the CA with a passphrase.',
      'perfiles.no_existe': 'The profile file does not exist.',
      'perfiles.danado': 'The profile is damaged or was modified: nothing was imported.',
      'perfiles.demasiado_grande': 'The profile is too large (up to {maximo}).',
      'perfiles.version_no_soportada':
        'The profile comes from a newer version of WolfCore Dev (format {version}): update the app to import it.',
      'perfiles.sin_confirmar': 'Confirm that you want to import the profile.',
      'perfiles.vista_previa_vieja':
        'The data folder or the profile changed since the preview: review it again.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS is not a valid data folder: it must be absolute, not a system folder and different from the real one.',
      'perfiles.confirmar_reemplazar_ca':
        'The profile carries a CA and this computer already has one: compare the fingerprint and confirm separately that you want to replace it (only if it is your own CA).',
      'herramientas.imagen_tipo':
        'That file is not a supported image (PNG, JPG, WebP, GIF, BMP or ICO) or its content does not match its type.',
      'herramientas.imagen_grande': 'The image is too large (up to {maximo}).',
      'herramientas.imagen_dimensiones':
        'The image is too big ({ancho}×{alto} px; up to {maximo} px per side) and is not opened for safety.',
      'herramientas.zip_sin_archivos': 'There are no files to compress (links are not followed).',
      'herramientas.zip_demasiados': 'There are too many files to compress (up to {maximo}).',
      'herramientas.zip_grande': 'What you want to compress is too large (up to {maximo}).',
      'herramientas.pdf_invalido': 'The file is not a PDF that can be optimized.',
      'herramientas.pdf_grande': 'The PDF is too large (up to {maximo}).',
      'herramientas.pdf_cifrado': 'The PDF is password-protected and cannot be optimized.',
      'herramientas.pdf_plazo': 'The PDF took longer than {segundos} s and was cancelled.',
      'herramientas.salida_ocupada': 'No free name was found for the new file.',
      'captura.atajo_invalido':
        'That shortcut is not valid: use Ctrl, Alt, Shift or Super with a letter, a number or an F key.',
      'captura.atajo_no_permitido':
        'That shortcut is not allowed: use Ctrl or Super with another modifier (Ctrl+Alt without Shift is AltGr and breaks typing @) and avoid common shortcuts such as Ctrl+C or Alt+F4.',
      'captura.atajo_ocupado': 'The shortcut {atajo} is already used by another program.',
      'captura.no_disponible': 'Screen capture is not available on this computer.',
      'captura.permiso_denegado': 'The screen recording permission is missing.',
      'captura.sin_imagen': 'There is no image to capture.',
      'captura.imagen_invalida': 'The capture image is not valid.',
      'conversor.formato': 'That conversion is not available.',
      'disco.sin_confirmar': 'Confirm the cleanup in the dialog before continuing.',
      'disco.categoria_invalida': 'That cleanup category does not exist.',
      'disco.ruta_vetada':
        'The category touches a protected path (data, backups, projects or FlyEnv); nothing was cleaned.',
      'disco.sin_analisis': 'Analyze again before cleaning: the analysis expired or is missing.',
      'disco.ocupada': 'An analysis or cleanup is already running.',
      'disco.sin_registro': 'The cleanup log could not be created; nothing was deleted.',
      'editor.sin_confirmar': 'Confirm the save before continuing.',
      'editor.confirmacion_reforzada':
        'This file looks like it holds secrets or belongs to a site with real data: confirm with the extra check to save it.',
      'editor.ruta_invalida': 'The file path is not valid.',
      'editor.no_existe': 'The file does not exist.',
      'editor.no_regular': 'Only regular files can be edited.',
      'editor.ruta_vetada':
        'That file is inside the WolfCore Dev data folder: it cannot be opened or saved from the editor.',
      'editor.archivo_env':
        '.env files are managed from the project variables, not from the editor.',
      'editor.demasiado_grande': 'The file is too large for the editor (maximum {maximo}).',
      'editor.binario': 'The file is not text (it is binary): it cannot be edited here.',
      'editor.codificacion':
        'The file is not UTF-8: the editor does not open it so as not to damage it.',
      'editor.no_abierto':
        'That file was not opened in the editor (or its version changed): open it again.',
      'editor.eol_mixto': 'The file mixes line endings: confirm normalizing them to save.',
      'editor.contenido_invalido': 'The content is not valid text.',
      'editor.huella_invalida': 'The fingerprint of the open file is missing: open it again.',
      'editor.archivo_cambiado':
        'The file changed outside the editor since it was opened. Reload it or confirm overwriting it.',
      'editor.copia_fallo': 'The backup copy could not be made ({codigo}); nothing was saved.',
      'editor.lectura_fallo': 'The file could not be read ({codigo}).',
      'editor.escritura_fallo':
        'The file could not be saved ({codigo}). The original was not touched.',
      'memoria.sin_confirmar': 'Confirm the action in the dialog before continuing.',
      'memoria.modo_invalido': 'That optimization mode does not exist.',
      'memoria.plan_caducado':
        'The list expired or is no longer the current one. Show it again before applying.',
      'memoria.no_disponible':
        'The memory optimizer is not available here or could not read the system.',
      'conversor.archivo_invalido': 'The file is damaged or is not the type its extension says.',
      'conversor.archivo_grande': 'The file is too large (up to {maximo}).',
      'conversor.archivo_peligroso':
        'The file looks like a ZIP bomb or has been tampered with (too much content, XML entities or invalid names) and is not opened for safety.',
      'conversor.limite_filas': 'The table has too many rows (up to {maximo}).',
      'conversor.limite_columnas': 'The table has too many columns (up to {maximo}).',
      'conversor.limite_paginas': 'The PDF has too many pages (up to {maximo}).',
      'conversor.pdf_cifrado': 'The PDF is password-protected and cannot be converted.',
      'conversor.plazo': 'The conversion took more than {segundos} s and was cancelled.',
      'conversor.ocupado':
        'A conversion is already running and another is waiting: wait for it to finish.',
      'conversor.cancelado': 'Conversion cancelled.',
      'conversor.libreoffice_ausente':
        'That conversion needs LibreOffice, which is not installed on this computer (WolfCore Dev does not install it).',
      'conversor.libreoffice_fallo': 'LibreOffice could not convert the document.',
      'conversor.limite_celdas': 'The table has too many cells (up to {maximo}).',
      'conversor.memoria': 'The file needs too much memory (more than {maximo}) and was cancelled.',
      'conversor.pdf_no_disponible': 'Printing to PDF is not available right now.',
      'herramientas.imagen_pixeles':
        'The image has too many pixels in total ({ancho}×{alto} px; up to {maximo}) and is not opened for safety.',
      'herramientas.zip_cambio': 'A file changed while it was being compressed: try again.',
      'herramientas.pdf_demasiado_complejo':
        'The PDF is too complex (it would inflate more memory than allowed) and was cancelled.',
      'herramientas.salida_denegada':
        'It is not possible to write to that location: check the permission or that the folder exists.',
      'herramientas.fuera_de_la_ca':
        'The WolfCore Dev CA only signs .test domains, localhost and local addresses: {dominio} cannot be included.',
      'perfiles.frase_requerida':
        'Enter the profile passphrase to import its databases or its CA (or import without the databases).',
      'perfiles.sin_espacio':
        'There is not enough free space to import the profile: {necesarios} needed, {libres} available.',
      'perfiles.ca_sin_restricciones':
        'This CA can sign any website: import it only if it is yours and compare the fingerprint. Confirm separately to continue.',
      'perfiles.ca_restricciones_ajenas':
        "The profile's CA has name constraints that are not WolfCore Dev's: it is not imported.",
      'perfiles.instantanea_fallo':
        'The environment snapshot could not be saved, so nothing was changed. Check the free disk space and the permissions of the data folder.',
      'perfiles.en_curso': 'A profile import is already in progress: wait for it to finish.',
      'importar.origen_apagado':
        "Could not connect to the other program's database server: start it from that program and try again. The sites were imported anyway.",
      'importar.origen_no_local': 'The source server must be on this computer (127.0.0.1).',
      'importar.origen_rechazado': 'The source server rejected the user or password.',
      'importar.origen_version':
        'The source server version cannot be imported with what WolfCore Dev has installed.',
      'importar.volcado_enorme':
        'The database data is larger than {maximo} MB: it is not imported in one go.',
      'importar.motor_no_soportado':
        'Only MySQL and MariaDB databases can be imported from other programs.',
      'importar.ruta_fuera':
        'A folder or file that points outside the installation or to a system folder was discarded.',
      'importar.carpeta_invalida':
        'A folder that no longer exists or is not a folder was discarded.',
      'importar.archivo_grande':
        'A configuration file is larger than {maximo} KB and was not read.',
      'importar.archivo_ilegible': 'A configuration file is not text or could not be read.',
      'importar.demasiados':
        'There are too many sites or configuration files: only the first ones were read.',
      'importar.candidato_desconocido':
        'That site no longer appears in the source program: search again.',
      'importar.ya_vinculado': 'That folder is already a WolfCore Dev site.',
      'importar.dominio_existe':
        'A site with the domain {dominio} already exists: change it before importing.',
      'importar.sin_php':
        'This site needs PHP and no version is installed: install one from Services.',
      'importar.base_existe':
        'The database {nombre} already exists at the destination and was not touched. Confirm the replacement to import it (a backup is made first).',
      'importar.base_fallo':
        'The database {nombre} could not be imported: it was left as it was, nothing half done.',
      'importar.sitio_fallo': 'The site could not be created.',
      'importar.origen_invalido':
        'The source server details are not valid (user, password or port).',
      'importar.sin_seleccion': 'Choose at least one site to import.',
      'importar.en_curso': 'An import is already in progress: wait for it to finish.',
      'importar.cancelado': 'Import cancelled: what was being imported was left as it was.',
      'importar.origen_estancado':
        "The other program's server stopped responding during the dump: the database was not imported.",
      'importar.sin_espacio':
        'There is not enough free space to import the database: about {necesarios} MB are needed and {libres} MB are free.',
      'importar.origen_fallo': "The other program's database could not be dumped.",
      'importar.clave_no_ascii':
        'The password has accents or symbols that cannot be passed to the dump: use an ASCII-only password.',
      'plantillas.sin_esquema': 'The template has no database schema.',
      'proyectos.carpeta_invalida': 'The project folder is not valid.',
      'proyectos.nombre_invalido':
        'The project name can only have lowercase letters, numbers and hyphens (up to 40).',
      'proyectos.argumento_invalido': 'A project value is not valid (field: {campo}).',
      'proyectos.base_existe': 'The database {nombre} already exists: choose another name.',
      'proyectos.dominio_existe': 'A site with the domain {dominio} already exists.',
      'proyectos.carpeta_de_otro_sitio':
        'That folder is the one of project {dominio} or is inside it: choose another one.',
      'proyectos.sin_python': 'No Python is installed: install it from Services.',
      'proyectos.venv_ajeno':
        "The project ships its own .venv and WolfCore Dev does not run the Python from someone else's repository: delete it and create the environment again.",
      'proyectos.paso_base_no_omitible':
        'The "Create the database" step of a new project cannot be skipped.',
      'proyectos.sin_php': 'No PHP is installed: install it from Services.',
      'proyectos.php_no_instalado': 'PHP {version} is not installed: install it from Services.',
      'proyectos.python_no_instalado':
        'Python {version} is not installed: install it from Services.',
      'mcp.token_invalido': 'The MCP server token is not valid.',
      'mcp.solicitud_cancelada': 'The MCP client cancelled the request: the action was not run.',
      'doctor.puerto_ocupado':
        'Port {puerto} of {servicio} is used by another program ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) is using port {puerto} of {servicio}.',
      'doctor.puerto_http_sys':
        'A Windows service ({programa}) is using port {puerto} of {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} is using port {puerto} of {servicio}. Close it or change the WolfCore Dev port.',
      'doctor.puerto_xampp': '{programa} is using port {puerto} of {servicio}.',
      'doctor.puerto_skype': '{programa} is using port {puerto} of {servicio}.',
      'doctor.puerto_reservado':
        'Port {puerto} of {servicio} is in a range reserved by Windows ({desde}-{hasta}: Hyper-V, WSL or Docker).',
      'doctor.ca_por_vencer': 'The WolfCore Dev certificate authority expires in {dias} days.',
      'doctor.ca_vencida': 'The WolfCore Dev certificate authority has expired.',
      'doctor.certificado_por_vencer': 'The certificate for {dominio} expires in {dias} days.',
      'doctor.certificado_vencido': 'The certificate for {dominio} has expired.',
      'doctor.hosts_ilegible': 'The hosts file could not be read.',
      'doctor.hosts_utf16': 'The hosts file is saved as UTF-16: Windows may not read its entries.',
      'doctor.hosts_bloque_duplicado':
        'The hosts file has {bloques} WolfCore Dev blocks; there should be one.',
      'doctor.hosts_bloque_sin_cierre':
        'A WolfCore Dev block in the hosts file is missing its closing mark.',
      'doctor.hosts_dominios_faltantes':
        '{cantidad} of your site domains are missing from the hosts file.',
      'doctor.hosts_solo_lectura':
        'The hosts file is read-only (often set by an antivirus). WolfCore Dev can still write it with administrator permission.',
      'doctor.path_duplicados': 'The user PATH has {cantidad} repeated WolfCore Dev entries.',
      'doctor.path_ajeno_delante':
        'Another folder with {programa} ({origen}) comes before WolfCore Dev in the PATH: terminals will use that one.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) is missing: PHP and other services will not start without it.',
      'doctor.enlazador_msvc_ausente':
        'Rust is installed but the Visual Studio Build Tools C++ tools (MSVC linker) are missing: cargo will not be able to link programs.',
      'doctor.antivirus_sin_exclusion':
        'The antivirus scans the WolfCore Dev data folder: PHP and services may start slowly.',
      'doctor.firewall_reglas':
        'Windows lets {cantidad} rule(s) for WolfCore Dev programs (nginx, PHP or databases) accept connections from the network on the profiles {perfiles}: those programs are open to the network.',
      'doctor.firewall_no_comprobado':
        'Could not check the Windows firewall (administrator rights may be needed).',
      'doctor.firewall_reglas_ajenas':
        "There are {cantidad} inbound rule(s) from other programs (FlyEnv, Laragon, XAMPP or others) for nginx, PHP or databases on the profiles {perfiles}. They are not WolfCore Dev's: they are only shown and never removed from here.",
      'doctor.firewall_reglas_acotadas':
        'There are {cantidad} rule(s) for WolfCore Dev programs limited to the local network (private profile only, local subnet and specific ports), like the ones the app itself recommends for sharing a site. They are only shown: they are not removed from here.',
      'doctor.firewall_almacen_inseguro':
        'The protected copy of the rules cannot be trusted (permissions or contents differ from what was shown): no rule was created or changed.',
      'doctor.firewall_quitadas':
        'WolfCore Dev removed {cantidad} firewall rule(s) earlier and kept a copy: you can recreate them if you need them.',
      'doctor.firewall_parcial':
        'Some rules were removed, but others were not: they changed since the list was shown, were not WolfCore Dev’s, or Windows would not let them go. Check the list.',
      'doctor.firewall_sin_cambios':
        'No rule was changed: they no longer match what was shown, or they could not be changed.',
      'doctor.firewall_registro_fallido':
        'The copy of the rules could not be saved to etc/cortafuegos-quitadas.json: nothing was changed.',
      'doctor.servicio_en_error': '{servicio} is in an error state.',
      'doctor.revision_fallida': 'The {revision} check could not be completed.',
      'doctor.confirmacion_requerida': 'Confirm the fix before applying it.',
      'doctor.hallazgo_desconocido': 'That finding is gone: run the check again.',
      'doctor.solo_informa': 'This finding has no automatic fix: follow the instructions.',
      'doctor.reparacion_fallida': 'The fix could not be applied.',
      'doctor.reparacion_cancelada':
        'The administrator permission was cancelled: nothing was changed.',
      'doctor.reparacion_denegada': 'Windows or an antivirus denied access: nothing was changed.',
      'doctor.ya_resuelto': 'The problem was already gone: nothing needed to change.',
      'doctor.ca_vieja_sin_quitar':
        'The new certificate authority is in use, but the old one could not be removed from the Windows store. You can remove it from the HTTPS section.',
      'doctor.sin_puerto_libre': 'No free port was found to move the service.',
      'doctor.ca_vuelta_atras_incompleta':
        'The new authority could not be applied and the rollback was incomplete. Check the HTTPS section; there is a dated copy in etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox does not trust the WolfCore Dev authority in {cantidad} profiles (it uses its own store).',
      'confianza.sin_ca': 'There is no certificate authority yet: create it from HTTPS.',
      'confianza.sin_raices':
        'No trusted roots were found for Python (neither certifi nor Windows): nothing was changed.',
      'confianza.node_variable_ajena':
        'You already have your own NODE_EXTRA_CA_CERTS: WolfCore Dev does not replace it.',
      'confianza.variable_fallida': 'The user variable could not be changed.',
      'firefox.abierto': 'Firefox is open: close it and try again.',
      'firefox.error': 'The user.js of that profile could not be changed; it was left as it was.',
      'firefox.fuera':
        'Some profiles are outside the Firefox folder: turn them on from CA trust, with their own confirmation.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS no longer points to the WolfCore Dev authority (it was changed by hand): it was not deleted.',
      'ia.clave_invalida': 'The provider rejected the key: check it or create a new one.',
      'ia.sin_saldo': 'The provider account has no balance or quota left.',
      'ia.limite': 'The provider is rate limiting requests: wait a moment and try again.',
      'ia.region': 'The provider does not serve your country or region.',
      'ia.sin_red': 'Could not connect to the provider: check the network or the base URL.',
      'ia.url_invalida':
        'The base URL is not valid: use https:// (or http:// only to 127.0.0.1 or [::1]), without user or password.',
      'ia.plazo': 'The provider did not answer within {segundos} s.',
      'ia.respuesta_rara': 'The provider returned something unexpected.',
      'ia.cancelado': 'The request to the provider was cancelled.',
      'ia.sin_clave': 'This provider needs a key: save it first.',
      'ia.clave_mal_formada': 'The key is not valid (no spaces or line breaks).',
      'ia.modelo_invalido': 'The model name is not valid.',
      'ia.modelo_no_disponible': 'The model does not exist or your account has no access to it.',
      'ia.proveedor_invalido': 'The provider settings are not valid.',
      'ia.env_conflicto':
        'The .env already defines {claves} with another value: confirm if you want to replace it.',
      'ia.env_sin_confirmar':
        'Confirm that you want to write the key to the .env (it is stored in plain text).',
      'ia.env_versionado':
        'Git already tracks the .env of this project: the next commit would upload the key even if it is in .gitignore. Remove it from the index with git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Could not check whether git already tracks the .env of this project: confirm separately that you want to write the key.',
      'ia.proveedor_no_existe': 'The AI provider no longer exists.',
      'ia.url_cambia_con_clave':
        'The provider has a saved key: confirm that you want to send it to the new URL.',
      'ia.mensaje_sin_confirmar':
        'Confirm sending the test message (it spends tokens from your account).',
      'ia.clave_ilegible': 'The saved provider key could not be read: delete it and save it again.',
      'ia.argumento_invalido': 'Invalid value ({campo}).',
      'correo.auth': 'The provider rejected the username or the key.',
      'correo.conexion': 'Could not connect to the SMTP server: check the host and port.',
      'correo.tls':
        'Could not establish a valid encrypted connection with the server (certificate, name or STARTTLS). Nothing was sent.',
      'correo.rechazado':
        'The server rejected the message or an address. Check the sender: many providers only accept a verified sender or domain.',
      'correo.plazo': 'The server did not answer in time (20 s).',
      'correo.host_invalido':
        'The SMTP server must be a host name or an IP, without scheme, port or path.',
      'correo.host_local':
        'That server points to this computer or the local network: confirm it to use it.',
      'correo.destinatario_invalido': 'The destination address is not valid.',
      'correo.proveedor_invalido': 'The provider data is not valid.',
      'correo.proveedor_no_existe': 'The mail provider no longer exists.',
      'correo.sin_clave': 'The provider has no saved key.',
      'correo.clave_ilegible':
        'The saved provider key could not be read: delete it and save it again.',
      'correo.cambia_con_clave':
        'The provider has a saved key: confirm that you want to send it to the new server.',
      'correo.env_sin_confirmar': 'Confirm that you want to write the mail variables to the .env.',
      'correo.ocupado': 'A test send is already in progress.',
      'correo.limite': 'Wait {segundos} s before another test send.',
      'correo.clave_mal_formada':
        'The key is not valid: only printable characters, no line breaks, up to 4096 characters.',
      'correo.argumento_invalido': 'Invalid value ({campo}).',
      'agentes.no_existe': 'That agent is not supported.',
      'agentes.sin_confirmar': 'Confirm the action in the dialog before continuing.',
      'agentes.no_instalable':
        'This agent is not installed from WolfCore Dev: follow the official guide ({guia}).',
      'agentes.sin_node': 'Install Node from Services to be able to install the agent.',
      'agentes.node_antiguo':
        '{agente} needs Node {requerida} or newer and the one that would be used is {actual}. Install a newer Node from Services.',
      'agentes.node_version_desconocida':
        'The Node version could not be determined and {agente} needs Node {requerida} or newer. Check the Node in Services.',
      'instalador.zip_demasiado_grande':
        'The downloaded package is too large or has too many files: it is not installed.',
      'rust.rustup_init_fallo': 'rustup-init did not finish correctly (code {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Rust {version} could not be installed (code {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} could not be uninstalled: {detalle}',
      'rust.descarga_fallo': 'rustup could not be downloaded (HTTP {estado}).',
      'agentes.instalacion_fallo': 'The agent could not be installed: {detalle}',
      'agentes.no_instalado': '{agente} is not installed.',
      'agentes.mcp_no_soportado':
        '{agente} does not document how to read the token from an environment variable: the MCP is not registered in it.',
      'agentes.config_ilegible':
        '{archivo} could not be parsed; it was not changed. Check it by hand.',
      'agentes.config_en_uso':
        '{archivo} changed while WolfCore Dev was editing it: close the agent and try again. It was not modified.',
      'agentes.proveedor_incompatible': '{agente} cannot use that AI provider.',
      'agentes.sin_cambios_preparados': 'There are no staged changes (git add) to describe.',
      'agentes.argumento_invalido': 'Invalid value ({campo}).',
      'git.commit_fallo': 'The commit failed: {detalle}',
      'git.mensaje_invalido': 'The commit message is empty or invalid.',
      'php.rama_no_instalada': 'PHP {rama} is not installed.',
      'php.argumento_invalido': 'Invalid value ({campo}).',
      'php.valor_invalido': 'The value for {clave} is not valid.',
      'php.ini_invalido':
        'PHP does not start with that php.ini; nothing was saved. Output: {salida}',
      'php.no_arranco':
        'PHP {rama} did not start again with the change; the previous state was restored and responds as before.',
      'php.caido_tras_restaurar':
        'PHP {rama} did not start again; the previous state was restored but it still does not respond. Check Services and the PHP logs.',
      'php.respaldo_no_existe': 'That php.ini copy does not exist.',
      'php.extension_no_existe': 'The {nombre} extension is not in this version ext folder.',
      'php.extension_no_catalogo': 'The {nombre} extension is not in the catalog for this version.',
      'php.variante_desconocida': 'Could not tell how this PHP was built.',
      'php.sin_variante': 'The catalog has no {nombre} for the {variante} build.',
      'php.huella_distinta':
        'The download does not match the published hash; nothing was installed.',
      'php.descarga_fallida': 'Could not download the extension: {detalle}',
      'php.extension_en_uso': 'The {nombre} DLL is in use. Stop PHP {rama} and try again.',
      'php.extension_sin_dll':
        'The {nombre} DLL could not be replaced and the ext folder of PHP {rama} was left without it. Stop PHP {rama} and try again: the previous one is put back when it starts.',
      'php.sitio_sin_php': 'That site does not use PHP.',
      'php.sitio_no_arranco':
        'The own PHP of {sitio} did not respond with the change; the previous settings were restored.',
      'php.sin_puertos_sitio': "There are no free ports left for the sites' own PHP.",
      'xdebug.launch_invalido':
        'The project .vscode/launch.json cannot be parsed; nothing was changed.',
      'xdebug.launch_no_seguro':
        'The .vscode folder or its launch.json is a link or something else: nothing is written there.',
      'xdebug.sin_configurar': 'Set up Xdebug on the site before generating launch.json.',
      'nginx.sitio_no_existe': 'That site no longer exists.',
      'nginx.texto_invalido': 'The vhost text is too long, empty or has control characters.',
      'nginx.sintaxis': 'Line {linea}: {detalle}. Nothing was changed.',
      'nginx.directiva_prohibida':
        'Line {linea}: “{directiva}” is not allowed in a site vhost (it could affect other sites or files outside the project). Nothing was changed.',
      'nginx.ruta_fuera':
        'Line {linea}: “{directiva}” points outside the project folder or its logs and certificates. Nothing was changed.',
      'nginx.fuera_de_server':
        'Line {linea}: the full vhost can only have “server” blocks; “{directiva}” is outside them. Nothing was changed.',
      'nginx.dominio_ajeno':
        'Line {linea}: “{nombre}” is not a domain of this site. Add it as a site alias first.',
      'nginx.puerto_ajeno':
        'Line {linea}: the site can only listen on the Nginx ports set in Settings.',
      'nginx.version_no_existe': 'That vhost version is no longer in the history.',
      'nginx.argumento_invalido': 'Invalid argument: {campo}',
      'nginx.destino_interno':
        'Line {linea}: “{directiva}” points to an internal WolfCore Dev service (Adminer, Mailpit, databases, other sites’ PHP…) and would expose it on the network and tunnels. Nothing was changed.',
      'nginx.caido_tras_restaurar':
        'Nginx did not respond again: the previous vhost was restored, but it still does not respond. Check Services and the Nginx log. {salida}',
      'depuracion.puerto_ocupado':
        'Port {puerto} is already in use: dump capture cannot listen. Close the program using it (e.g. a Symfony server:dump).',
      'depuracion.no_iniciado': 'Dump capture is off.',
      'depuracion.tipo_no_soportado': 'Dump capture is for PHP and FastAPI sites.',
      'depuracion.confirmacion': 'Confirm dump capture in the dialog.',
      'depuracion.argumento_invalido': 'Invalid argument: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'That file is not inside the site folder: it will not be opened in the editor.',
      'contenedores.motor_invalido': 'Unknown container engine.',
      'contenedores.id_invalido': 'The container id is not valid.',
      'contenedores.argumento_invalido': 'Invalid argument: {campo}',
      'contenedores.sin_motor': '{motor} is not installed on this computer.',
      'contenedores.no_responde':
        '{motor} is not responding. Open Docker Desktop or start the Podman machine and try again.',
      'contenedores.remoto':
        'The default {motor} connection points to another computer: WolfCore Dev only uses local engines.',
      'contenedores.no_existe': 'The container no longer exists. Refresh the list.',
      'contenedores.accion_fallo': 'The engine could not do it: {detalle}',
      'contenedores.demasiados_registros':
        'At most {maximo} container logs can be followed at once.',
      'contenedores.sin_confirmar': 'Confirm the action in the dialog.',
      'catalogo.indice_invalido':
        'The {servicio} version index failed validation; the saved list is used instead.',
      'catalogo.sin_huella':
        '{servicio} {version} has no published checksum: confirm the installation in the dialog.',
      'catalogo.huella_debil':
        '{servicio} {version} only has a weak checksum (MD5 or SHA-1): confirm the installation in the dialog.',
      'catalogo.huella_no_coincide': 'The download does not match the published checksum.',
      'catalogo.paquete_invalido':
        'The downloaded package is not safe (paths outside the folder, links or excessive size).',
      'catalogo.extraccion_fallo': 'The downloaded .7z package could not be read or extracted.',
      'runtimes.falta_runtime':
        '{nombre} is not installed for this project: install it from Services.',
      'runtimes.falta_jdk': 'No JDK is installed for this project: install Java from Services.',
      'runtimes.instalacion_incompleta':
        'The {nombre} installation is incomplete: reinstall it from Services.',
      'procesos.escucha_publica':
        'The process listens on {direccion}:{puerto} ({programa}), open to the network. It was stopped: it may only listen on 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'The process listens on {direccion}:{puerto} ({programa}), open to the network. It was stopped: it may only listen on 127.0.0.1. This is Spring DevTools LiveReload: turn it off with spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'The process listens on {direccion}:{puerto} ({programa}), open to the network. It was stopped: it may only listen on 127.0.0.1. This is the Node inspector: use --inspect=127.0.0.1.',
      'catalogo.redireccion_ajena':
        'The download tried to go to a site that is not allowed ({host}).',
      'catalogo.demasiadas_redirecciones':
        'The download made too many redirects (more than {maximo}).',
      'catalogo.respuesta_grande': 'The server response is too large.',
      'catalogo.version_no_encontrada': 'Version {version} of {servicio} is not in the catalog.',
      'catalogo.huella_no_disponible':
        'Could not get the checksum for {servicio} {version} (offline or the source did not respond). Try again.',
      'catalogo.firma_invalida':
        'The PGP signature of {servicio} {version} is invalid or not published: nothing was installed.',
      'catalogo.firma_no_soportada':
        'The PGP signature of {servicio} {version} uses a format WolfCore Dev does not verify: nothing was installed.',
      'catalogo.clave_desconocida':
        'The signature of {servicio} {version} is from a key that is not among the keys pinned in the app: nothing was installed.',
      'catalogo.firma_vencida':
        'The signature of {servicio} {version} or its key has expired: nothing was installed. Update WolfCore Dev to get current keys.',
      'catalogo.reloj_atrasado':
        "The signature of {servicio} {version} is dated in the future: check this computer's date and time and try again.",
      'acceso_bd.datos_invalidos': 'The database access data is not valid.',
      'acceso_bd.sin_base': "This project's .env does not point to a database.",
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin only opens MySQL and MariaDB databases; use Adminer for PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        "This project's database is not on a local WolfCore Dev server.",
      'acceso_bd.no_listo': 'The tool is not ready: install it from Services and turn PHP on.',
      'auditoria.tabla_invalida': 'The table does not exist in that database.',
      'auditoria.columna_invalida':
        'The column does not exist in that table (and the user and hash columns must differ).',
      'auditoria.usuario_no_encontrado': 'No account has that user.',
      'auditoria.usuario_repetido':
        'More than one account has that user: nothing was reset, so the wrong one is not touched.',
      'auditoria.formato_no_soportado':
        'The current hash format cannot be reproduced: nothing was reset.',
      'auditoria.clave_larga':
        'bcrypt only uses the first 72 bytes of the password: choose a shorter one.',
      'auditoria.clave_invalida': 'The new password is not valid.',
      'auditoria.sin_confirmar': 'Confirm that you want to reset this password.',
      'auditoria.respaldo_previo_fallo':
        'Could not save a copy of the database before resetting: nothing was changed.',
      'auditoria.copia_fallo': 'Could not save the copy of the row: nothing was changed.',
      'auditoria.motor_no_soportado': 'The password audit is for MySQL, MariaDB and PostgreSQL.',
      'auditoria.cancelada': 'Audit cancelled.',
      'auditoria.usuario_invalido': 'The user must be between 1 and 256 characters.',
      'auditoria.en_curso': 'An audit is already running: wait for it to finish or cancel it.',
      'auditoria.base_sistema': 'A system database is not audited: choose a project database.',
      'auditoria.esquema_invalido': 'The schema does not exist in that database.',
      'auditoria.fila_cambio': 'The account changed in the meantime: nothing was reset. Try again.',
      'auditoria.verificacion_fallo':
        'The database did not store the password as expected: the change was undone.',
      'auditoria.columna_corta':
        'The hash column holds {largo} characters and the new hash needs {necesario}: nothing was changed. Widen the column.',
      'auditoria.datos_reales_sin_confirmar':
        'This database has real customer data: resetting a password requires the reinforced confirmation.',
      'instantaneas.id_invalido': 'The snapshot is not valid.',
      'instantaneas.no_encontrada': 'The snapshot was not found; it may have been deleted already.',
      'instantaneas.otra_base':
        'This snapshot belongs to another database: it cannot be applied to this one.',
      'instantaneas.sin_confirmar': 'Confirm that you want to go back to this snapshot.',
      'instantaneas.motor_no_soportado': 'Snapshots are for MySQL, MariaDB and PostgreSQL.',
      'instantaneas.demasiado_grande':
        'The database is larger than {maximo} MB, the most a snapshot holds.',
      'instantaneas.sin_espacio':
        'There is not enough free space for the snapshot: {necesarios} MB are needed and {libres} MB are free.',
      'instantaneas.limite':
        'This database already has {maximo} snapshots: delete one to take another.',
      'instantaneas.tomar_fallo': 'The snapshot could not be taken. The database was not touched.',
      'instantaneas.huella_no_coincide':
        'The snapshot file changed or is damaged: nothing was restored.',
      'instantaneas.respaldo_previo_fallo':
        'The current state of the database could not be saved: nothing was restored.',
      'instantaneas.restauracion_fallo':
        'The snapshot could not be restored. The database went back to how it was. Reason: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'The snapshot could not be restored and the previous state had not been saved: the database may be empty or half restored. Reason: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'The snapshot could not be restored and the previous state could not be put back. That state is saved in the automatic snapshot {respaldo}: go back to it from Snapshots.',
    },
  },
  instantaneas: {
    abrir: 'Snapshots',
    titulo: (base: string) => `Snapshots of ${base}`,
    ayuda:
      'A snapshot saves the database exactly as it is now. You can go back to it whenever you want: before going back, a snapshot of the current state is saved automatically.',
    ubicacion:
      'They are stored in the WolfCore Dev data folder, readable only by your user. Services and their data are not touched.',
    notaEtiqueta: 'Note (optional)',
    notaMarcador: 'For example: before migrating',
    tomar: 'Take snapshot',
    tomada: 'Snapshot saved',
    cargando: 'Reading snapshots…',
    vacio: 'This database has no snapshots yet.',
    automatica: 'Automatic',
    sinNota: 'No note',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'table' : 'tables'} · ${tamano}`,
    volver: 'Go back to this snapshot',
    borrar: 'Delete',
    borrada: 'Snapshot moved to the trash',
    papelera: 'Deleted snapshots can be recovered for 7 days from the WolfCore Dev trash.',
    cerrar: 'Close',
    papeleraTitulo: 'Trash',
    papeleraVacia: 'There are no snapshots in the trash.',
    recuperar: 'Recover',
    recuperada: 'Snapshot recovered',
    borradaEl: (fecha: string) => `Deleted on ${fecha}`,
    borrarPregunta: 'Move this snapshot to the trash?',
    borrarSi: 'Move to the trash',
    notaAutomatica: (fecha: string) =>
      `Previous state, saved before going back to the snapshot from ${fecha}`,
    notaAutomaticaSinOrigen: 'Previous state, saved before going back to another snapshot',
    extensionesAviso: (lista: string) =>
      `It has PostgreSQL extensions (${lista}) that are only restored with this computer's fingerprint record.`,
    limites:
      "MySQL and MariaDB snapshots also keep routines, triggers and events. In PostgreSQL it is a compressed dump of a single database: it does not include the server's roles or users. A snapshot that cannot be checked as made on this computer is restored with a user limited to the database, which does not allow views, routines or triggers owned by other users.",
    basesBorradas: 'Snapshots of databases that no longer exist',
    basesBorradasAyuda: 'Choose a database to create it again from its snapshot.',
    dialogoVolver: {
      titulo: (base: string) => `Go back to a snapshot of ${base}`,
      cargando: 'Preparing the preview…',
      base: 'Database',
      instantanea: 'Snapshot',
      ahora: 'Now',
      tamano: 'Size',
      tablas: 'Tables',
      nota: 'Note',
      aviso: (base: string) =>
        `The database ${base} will be completely replaced by this snapshot: anything that changed since then is lost from the database. First, an automatic snapshot of the current state is saved; if anything fails, the database goes back to that state on its own.`,
      pedir: (base: string) => `To confirm, type ${base}`,
      confirmar: 'Go back to this snapshot',
      trabajando: (base: string) =>
        `Restoring ${base}… Do not close the program until it finishes.`,
      hecho: (base: string) => `The database ${base} went back to the snapshot`,
      respaldoPrevio: 'The previous state was saved in the automatic snapshot from',
      advertencias: 'The restore finished with warnings:',
      hechoConAvisos: (base: string) =>
        `The database ${base} went back to the snapshot, with warnings`,
      baseVacia:
        'The database does not exist or is empty: there is nothing to save before going back.',
      sinGuardarTitulo: 'The current state could not be saved',
      sinGuardarTexto:
        'WolfCore Dev could not save the current state of the database before going back. If you continue WITHOUT saving it and the restore fails, the current data in the database is lost.',
      sinGuardarConfirmar: 'I understand the current data in the database will be lost',
      sinGuardarBoton: 'Go back without saving the current state',
    },
  },
  avisoInicio: {
    titulo: 'WolfCore Dev notice',
  },
  tareas: {
    titulo: 'Scheduled tasks',
    resumen: (n: number) => (n === 0 ? 'No tasks' : n === 1 ? '1 task' : `${n} tasks`),
    mostrar: 'Show tasks',
    ocultar: 'Hide',
    cargando: 'Loading tasks',
    errorCargar: 'The tasks could not be loaded',
    soloAbierta:
      'Tasks only run while WolfCore Dev is open. They do not use the Windows Task Scheduler: with the app closed or the computer asleep they do not run, and a missed run is not made up.',
    repoEjecuta:
      'In a trusted project, whatever is inside the repository runs as is: the file the task names, `artisan`, the `package.json` scripts, `.venv`… If they change after a `git pull`, the task will run the new version.',
    vacio:
      'This project has no scheduled tasks. Create one (for example “php artisan schedule:run” every minute in a Laravel project).',
    nueva: 'New task',
    pausada: 'paused',
    enCurso: 'Running…',
    nunca: 'Has not run yet',
    ultima: (f: string) => `Last: ${f}`,
    proxima: (f: string) => `next: ${f}`,
    codigo: (n: number) => `code ${n}`,
    resultadoTitulo: (n: string) => `“${n}”`,
    origen: { usuario: 'written here', 'wolfcore.yml': 'from wolfcore.yml' },
    describir: {
      cadaMinuto: 'Every minute',
      cadaN: (n: number) => `Every ${n} minutes`,
      cadaHora: 'Every hour, on the hour',
      diaria: (h: string) => `Every day at ${h}`,
      laborables: (h: string) => `Monday to Friday at ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Succeeded',
      fallo: 'Failed',
      tiempo: 'Exceeded the time limit',
      cancelada: 'Cancelled',
      omitida: 'Skipped',
      bloqueada: 'Did not run',
    },
    motivo: {
      aislado:
        'This is a test data folder (WOLFCORE_DATOS): it does not run until you allow tasks for this session.',
      no_confiado:
        'The project is not marked as trusted: tick “I trust this repository” for it to run.',
      receta_cambio:
        'The project recipe changed since you trusted it: review it and tick “I trust this repository” again.',
      sin_confirmar:
        'Its command needs confirming: it does not run until you review and confirm it.',
      comando_invalido: 'Its command is not allowed (only php, node, npm run and python).',
      cron_invalida: 'Its schedule is not a valid cron expression.',
      carpeta: 'The project folder does not exist.',
      solapada: 'The previous run was still going: this one was skipped.',
      retraso: 'It was late (the app was suspended): it is not made up.',
      error: 'The program could not be run.',
    },
    acciones: {
      ejecutar: 'Run now',
      editar: 'Edit',
      borrar: 'Delete',
      verRegistro: 'View log',
      revisarConfirmar: 'Review and confirm',
      activar: (n: string) => `Enable the task ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Delete “${n}”?`,
      texto:
        'The task and its history are removed. What it already ran is not undone and the project files are not touched.',
      confirmar: 'Delete',
      hecho: (n: string) => `Task “${n}” deleted.`,
    },
    aislado: {
      titulo: 'Test data folder.',
      texto:
        'With WOLFCORE_DATOS no task runs on its own. Allow them only if you want to try them in this session.',
      permitir: 'Allow in this session',
      confirmarTitulo: 'Allow tasks in this test folder?',
      confirmarTexto:
        'Active tasks of trusted projects will start running until you close the app. The commands are each project’s own and run in its real folder.',
      permitido: 'Tasks allowed in this session.',
    },
    yml: {
      titulo: 'Suggestions from wolfcore.yml',
      texto:
        'The project file suggests these tasks. Nothing runs just because it is written there: review the command and confirm it to adopt it.',
      estado: { nueva: 'New', adoptada: 'Adopted', cambiada: 'Changed' },
      revisar: 'Review and adopt',
      cambiada:
        'The command in wolfcore.yml changed since you adopted it. The project’s task keeps the command you confirmed; adopt the new version if you recognise it.',
      guardarEn: 'Save to wolfcore.yml',
      escribirTitulo: 'Write the task to wolfcore.yml?',
      escribirTexto:
        'The task is added or updated in the project file (the rest is left alone) so it travels with the repository. Whoever clones it will have to confirm it on their computer.',
      escribir: 'Write',
      escrita: 'Task saved to wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Log of “${n}”`,
      historial: 'Latest runs',
      sinHistorial: 'No runs yet.',
      salida: 'Output of the last run',
      sinSalida: 'No output saved.',
      enmascarado: 'Logs hide passwords and keys, have a size limit and rotate on their own.',
      origen: { programada: 'scheduled', manual: 'manual' },
    },
    dialogo: {
      tituloNueva: 'New scheduled task',
      tituloEditar: 'Edit scheduled task',
      tituloAdoptar: 'Adopt the task from wolfcore.yml',
      tituloConfirmar: 'Confirm the task command',
      nombre: 'Name',
      nombrePlaceholder: 'Laravel tasks',
      horario: 'When',
      preset: {
        cadaMinuto: 'Every minute',
        cadaN: 'Every few minutes',
        cadaHora: 'Every hour',
        diaria: 'Every day at a time',
        laborables: 'Monday to Friday at a time',
        personalizada: 'Custom cron expression',
      },
      cadaNOpcion: (n: number) => `Every ${n} minutes`,
      hora: 'Time',
      horaPlaceholder: '03:00',
      horaInvalida: 'Enter a valid time, for example 03:00.',
      expresion: 'Cron expression',
      cronEquivale: 'Cron expression:',
      expresionAyuda:
        '5 fields: minute, hour, day of month, month and day of week (* , - /). At most once a minute.',
      proximas: 'Next runs:',
      comando: 'Command',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Only php, node, npm run and python, with a project file. It runs in the project folder, without a shell and with no code on the command line (-r, -e, -c).',
      comandoFijo:
        'This command has quoted arguments that cannot be written as text: it is kept as is and not edited here (delete it and create another if you need to change it).',
      argumentos: 'It will run with these arguments:',
      comillasSinCerrar: 'A quote is not closed.',
      tiempo: 'Time limit',
      minutos: 'minutes',
      tiempoAyuda:
        'If it takes longer it stops on its own (only that process and what it started).',
      activa: 'Enabled (runs on its own while the app is open)',
      advertencia:
        'By accepting you authorise this exact command: it will run on its own, in this project’s folder, every time it is due. If you change it you will have to confirm it again.',
      revise: 'I reviewed this command and recognise it.',
      guardar: 'Save and confirm the command',
      adoptar: 'Confirm and adopt',
      confirmar: 'Confirm the command',
      guardada: 'Task saved.',
      adoptada: 'Task adopted.',
      confirmada: 'Command confirmed.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion: 'Named sets of databases, services and processes that start and stop together.',
    nuevo: 'New workspace',
    vacio:
      'There are no workspaces yet. Create one, for example “FastAPI bot” with PostgreSQL, Redis, Ollama and your project’s process.',
    elementos: (n: number) => (n === 1 ? '1 item' : `${n} items`),
    sinElementos: 'No items',
    estado: { apagado: 'Stopped', parcial: 'Partly on', encendido: 'Running' },
    acciones: {
      iniciar: 'Start',
      detener: 'Stop',
      editar: 'Edit',
      borrar: 'Delete',
      cerrar: 'Close',
    },
    borrar: {
      titulo: (n: string) => `Delete “${n}”?`,
      texto:
        'Deleting the workspace does not stop or delete anything: it only removes the set. What is running keeps running.',
      confirmar: 'Delete',
      hecho: (n: string) => `Workspace “${n}” deleted.`,
    },
    dialogo: {
      tituloNuevo: 'New workspace',
      tituloEditar: 'Edit workspace',
      nombre: 'Name',
      nombrePlaceholder: 'FastAPI bot',
      nombreVacio: 'Enter a name.',
      aviso:
        'A workspace only stores what to start. It does not open tunnels, does not share on the local network and does not start the processes of a project you do not trust.',
      secciones: {
        instancias: 'Databases',
        servicios: 'Services',
        procesos: 'Project processes',
      },
      sinOpciones: 'There is nothing to choose here.',
      captadorUnico: 'Only one mail catcher at a time: choosing another replaces the previous one.',
      yaNoExisten: (lista: string) => `These no longer exist and will be removed on save: ${lista}`,
      guardar: 'Save',
      guardado: (n: string) => `Workspace “${n}” saved.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `“${n}”: how it ended up after starting`,
      tituloDetener: (n: string) => `“${n}”: how it ended up after stopping`,
      encendido: 'Running',
      apagado: 'Stopped',
      yaEncendido: 'Was already running',
      yaApagado: 'Was already stopped',
      noExiste: 'No longer exists: skipped',
      compartido: 'Still running: another running workspace uses it',
      reemplaza: (otro: string) => `Running; it stopped ${otro}, of the same mail group`,
      fallo: 'Did not start',
      falloApagar: 'Still running',
      ok: (n: string) => `“${n}” is ready.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `“${n}”: ${encendidos} of ${total} are running. Check what did not start.`,
      parcialApagar: (n: string, siguen: number) =>
        `“${n}”: ${siguen} are still running. Check what did not stop.`,
    },
  },
  inicio: {
    titulo: 'Home',
    bienvenida: 'Your development environment at a glance.',
    tiles: {
      servicios: 'Services running',
      serviciosDe: (total: number) => `of ${total}`,
      sitios: 'Projects',
      tuneles: 'Active tunnels',
      hosts: 'Pending hosts',
      hostsOk: 'All good',
      hostsFaltan: 'Needs attention',
    },
    hosts: {
      titulo: 'Some domains are missing from the hosts file',
      texto:
        'These domains do not point to your computer yet. To fix it, Windows will ask for administrator permission.',
      corregir: 'Apply pending hosts',
      reintentarPermiso: 'Retry with permission',
      corregido: 'Hosts file updated',
      fallo: 'Could not update the hosts file',
      verInstrucciones: 'View instructions',
      duplicados:
        'These domains are already in hosts outside the WolfCore Dev block (they are kept):',
      motivos: {
        cancelado: 'Administrator permission was canceled. The hosts file was not changed.',
        tiempo:
          'Nobody answered the administrator prompt in time. The site was saved; the hosts file was not changed. If you still see the Windows prompt, cancel it (it will no longer do anything). Apply the pending entries when you can (one prompt for all).',
        denegado:
          'Windows did not allow writing to the hosts file. An antivirus may be blocking it.',
      } as Record<string, string>,
      modalTitulo: 'Fix hosts manually',
      modalTexto:
        'Open PowerShell as administrator (right-click Start → Terminal (Admin)), paste this command and press Enter.',
    },
    servicios: {
      titulo: 'Services',
      ver: 'View services',
      irA: (nombre: string) => `Go to the ${nombre} service`,
      vacio: 'No services installed yet.',
    },
    tuneles: {
      titulo: 'Active tunnels',
      vacio: 'No tunnels open. You can open one from Projects.',
      sitioDesconocido: 'Unnamed site',
      irA: (nombre: string) => `Go to the ${nombre} project`,
    },
  },
  servicios: {
    titulo: 'Services',
    descripcion:
      'Start and stop the web server, PHP, databases and tools. Status updates automatically.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Databases',
      correo: 'Mail',
      ia: 'AI',
      herramientas: 'Tools',
    },
    gruposAyuda: {
      web: 'Server that handles the .test domains.',
      php: 'One install per version (8.3, 8.4…); each site uses its own.',
      bd: 'Listen on 127.0.0.1 only.',
      correo: 'Catches the emails your projects send, without them reaching the internet.',
      ia: 'Language models on your computer.',
      herramientas: 'Everyday utilities.',
    },
    puerto: 'Port',
    /** "Start all" with nothing to start. */
    sinParaEncender: 'There are no installed services to start',
    /** Strip shown when only external engines exist (D54a). */
    franjaExternos: {
      texto:
        'You have not installed the web server or PHP yet. External engines were detected automatically.',
      accion: 'Install Nginx and PHP',
    },
    externos: {
      titulo: 'Detected on your computer',
      ayuda: 'Another program manages them; WolfCore Dev only shows them.',
    },
    cambiarPuerto: 'Change port',
    cambiarPuertoDe: (nombre: string) => `Change the ${nombre} port`,
    versionesDe: (nombre: string) => `Versions of ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instances, ${encendidas} running`,
    usarPuerto: (p: number) => `Use port ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} now uses port ${p}`,
    conflicto: 'Port in use',
    autoIniciar: 'Start when WolfCore Dev starts',
    autoIniciarActivado: (nombre: string) => `${nombre} will start when WolfCore Dev starts`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} will no longer start when WolfCore Dev starts`,
    dialogoPuerto: {
      titulo: (nombre: string) => `${nombre} port`,
      etiqueta: 'New port',
      ayuda:
        'Between 1024 and 65535 and free. If the service is running, it restarts. Update the .env of your projects.',
      rango: 'Use a number between 1024 and 65535',
      igual: 'This is the current port',
      guardar: 'Change port',
    },
    borrarDatos: {
      opcion: 'Delete data',
      titulo: (nombre: string) => `Delete ${nombre} data`,
      copias: (n: number, tam: string) =>
        `${n === 1 ? 'One update copy' : `${n} update copies`} (${tam}) will also be deleted. To keep them, copy them from the data folder first.`,
      /** What is lost, per service. */
      que: {
        mysql: 'all MySQL databases and users',
        mariadb: 'all MariaDB databases and users',
        postgresql: 'all PostgreSQL databases and users',
        redis: 'all keys and data stored in Redis',
        mongodb: 'all MongoDB databases, collections and data',
        mailpit: 'all emails caught by Mailpit',
        smtp4dev: 'all emails caught by smtp4dev',
        inbucket: 'all emails caught by Inbucket',
        papercut: 'all emails caught by Papercut SMTP',
        ollama: 'all models downloaded by Ollama',
        meilisearch: 'all Meilisearch indexes',
      } as Record<string, string>,
      texto: (que: string) =>
        `This deletes ${que}. It cannot be undone. The program stays installed.`,
      generico: (nombre: string) => `all ${nombre} data`,
      pedir: (id: string) => `To confirm, type ${id}`,
      boton: 'Delete data',
      hecho: (nombre: string) => `${nombre} data deleted`,
    },
    ftp: {
      interruptor: 'FTP server',
      redLocal: 'Allow connections from the local network',
      redLocalAyuda:
        'When off, only this computer can connect (127.0.0.1). Each project enables its access in Projects.',
      avisoTitulo: 'Open FTP to the local network',
      avisoTexto:
        'FTP sends users, passwords and files unencrypted. Any computer on your network will be able to try to connect. Only use it on a trusted network.',
      avisoConfirmar: 'Allow',
      redLocalActivada: 'FTP accepts connections from the local network',
      redLocalDesactivada: 'FTP only accepts connections from this computer',
      compartir: {
        enlace: 'Share folder or file…',
        ayuda:
          'FTP is not shared through a tunnel: it is unencrypted and the tunnel only carries HTTP. To publish something on the internet use “Share folder or file” (HTTP, read-only); FTP stays on the local network.',
      },
    },
    composer: {
      nombre: 'Composer',
      detalle: 'PHP dependency manager',
      instalado: 'Installed',
      noInstalado: 'Not installed',
      sinVersion: 'not installed',
      uso: 'Usage',
      usoTexto: 'composer',
      ayuda: 'Use "Terminal" on a project, or add WolfCore Dev to the PATH in Settings.',
      instaladoOk: 'Composer installed',
      sinPhp: 'Install PHP first',
      actualizado: (v: string) => `Composer updated: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Web database manager',
      direccion: 'Address',
      disponible: 'Ready',
      noInstalado: 'Not installed',
      sinPhp: 'PHP missing',
      abrir: 'Open Adminer',
      instaladoOk: 'Adminer installed',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'MySQL and MariaDB web manager',
      direccion: 'Address',
      disponible: 'Ready',
      noInstalado: 'Not installed',
      sinPhp: 'PHP missing',
      abrirDesdeProyecto: "Opens from each project's card, already signed in.",
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} does not have the ${ext} extension enabled. Restart PHP or enable it in its php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin declares support up to PHP 8.3 and PHP ${rama} is in use: it may show errors. Turn on a PHP version from 7.2 to 8.3 if something fails.`,
      instalarPrimero: 'Install phpMyAdmin to use it.',
      encenderPhp: 'Turn PHP on to use phpMyAdmin.',
      instaladoOk: 'phpMyAdmin installed',
    },
    puertos: 'Ports',
    pid: 'PID',
    sinVersion: 'no version',
    datosConexion: 'Connection details',
    sinPuertos: '—',
    terminado: 'Finished without errors',
    externo: 'Managed outside WolfCore Dev',
    verDetalle: 'View error details',
    vacioTitulo: 'No services yet',
    vacio:
      'No services installed yet. Start with Nginx and PHP for your sites, or with a database.',
    irAInstalar: 'Go to install',
  },
  bd: {
    descripcion:
      'Create, back up and restore your project databases. Servers listen on 127.0.0.1 only.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'New database',
    restaurar: 'Restore backup',
    importar: 'Import from another server',
    soloSql: 'Available for MySQL, MariaDB and PostgreSQL',
    enCursoAyuda: 'Wait for the current operation to finish',
    encenderPrimero: (motor: string) => `Start ${motor} first`,
    cargando: 'Loading databases…',
    recargar: 'Reload the list',
    vacioTitulo: 'No database server installed',
    vacio: 'Install MySQL, MariaDB, PostgreSQL or MongoDB from Services to manage your databases.',
    irAServicios: 'Go to Services',
    apagado: {
      titulo: (motor: string) => `${motor} is stopped`,
      texto: (motor: string) => `Start ${motor} to view and manage its databases.`,
      iniciando: (motor: string) => `${motor} is starting…`,
      error: (motor: string) => `${motor} failed to start`,
      encender: (motor: string) => `Start ${motor}`,
      verServicios: 'View in Services',
    },
    errorLista: 'Could not read the database list',
    sinBases: 'This server has no databases of its own yet.',
    total: (n: number) => plural(n, 'database', 'databases'),
    columnas: { nombre: 'Database', tamano: 'Size', acciones: 'Actions' },
    acciones: {
      respaldar: 'Back up',
      restaurarAqui: 'Restore here',
      adminer: 'Open in Adminer',
      conexion: 'Connection details',
      vector: 'Enable vector',
      borrar: 'Delete',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Install Adminer and PHP in Services to open it',
    vectorSinInstalar: 'Install pgvector below to enable it on a database',
    vectorActivado: (base: string) => `Vector enabled on ${base}`,
    formatos: {
      sql: 'Plain SQL',
      pgdump: 'PostgreSQL backup (pg_dump, custom format)',
      gz: 'Compressed SQL (.gz)',
      zip: '.zip archive (extracted before restoring)',
      rar: '.rar archive (extraction attempted with Windows)',
      '7z': '.7z archive (extraction attempted with Windows)',
      desconocido: 'Unrecognized format',
    } as Record<string, string>,
    formatoDesconocido:
      'The format is not recognized. If it is a compressed archive, extract it and choose the .sql or .dump file inside.',
    formatoIncompatible: 'This file is a PostgreSQL backup: restore it in the PostgreSQL tab.',
    nombre: {
      etiqueta: 'Database name',
      vacio: 'Enter a name',
      largo: 'The name is too long',
      caracteres: {
        mysql: 'Use only letters, numbers and underscores',
        mariadb: 'Use only letters, numbers and underscores',
        postgresql: 'Use lowercase letters, numbers and underscores',
        mongodb: 'Use only letters, numbers, hyphens and underscores',
      } as Record<string, string>,
      inicio: 'In PostgreSQL the name cannot start with a number',
    },
    reemplazo: {
      titulo: (base: string) => `The ${base} database already has tables`,
      texto: (base: string) =>
        `If you continue, the current ${base} database will be COMPLETELY REPLACED. An automatic backup is saved first; then the database is dropped and recreated with the new content.`,
      donde: 'The backup is saved in',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'If you do not want to replace it, go back and choose another name: a new database will be created.',
      pedir: (base: string) => `To confirm, type ${base}`,
      volver: 'Back',
      confirmar: 'Replace database',
    },
    resultado: {
      restaurada: (base: string) => `Database ${base} restored`,
      importada: (base: string) => `Database ${base} imported`,
      respaldada: (base: string) => `Backup of ${base} saved`,
      archivo: 'File',
      respaldoPrevio: 'Backup of the previous database',
      advertencias: (n: number) => plural(n, 'warning', 'warnings'),
      advertenciasAyuda:
        'The operation finished. Review these warnings; they are usually roles or permissions that do not exist on this computer.',
      fallo: {
        restaurar: 'Could not restore',
        importar: 'Could not import',
        respaldar: 'Could not back up',
      } as Record<string, string>,
      trasReemplazo: 'The original database was replaced and the restore did not finish',
      trasReemplazoAyuda:
        'Your previous data is in the backup shown. You can restore it with "Restore backup".',
    },
    progreso: {
      titulo: 'Log',
      corriendo: {
        restaurar: (base: string) => `Restoring ${base}…`,
        importar: (base: string) => `Importing ${base}…`,
        respaldar: (base: string) => `Backing up ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Waiting for tool output…',
      limitado: (n: number) => `Showing the last ${n} lines.`,
      noCierre:
        'Do not close the program until it finishes. You can leave this screen and come back: you will see the result here.',
      otraEnCurso: 'An operation is already in progress; wait for it to finish.',
      ver: 'View details',
      descartar: 'Dismiss',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Restore backup to ${motor}`,
      confianza: 'Only restore trusted backups: a backup can run actions on the server.',
      archivo: 'Backup file',
      elegir: 'Choose file…',
      cambiar: 'Change',
      sinArchivo: 'No file chosen',
      formato: 'Detected format',
      detectando: 'Detecting format…',
      destino: 'Target database',
      destinoAyuda:
        'If it does not exist, it is created. If it exists and is empty, it is used. If it has tables, you will be asked to confirm.',
      restaurar: 'Restore',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Import into ${motor} from another server`,
      soloLectura:
        'The source server is only read: its database is copied to this computer and the source is not modified.',
      detectado: (puerto: number) =>
        `Another server was detected on port ${puerto} (for example, FlyEnv's).`,
      origen: 'Source server',
      host: 'Host',
      puerto: 'Port',
      usuario: 'User',
      clave: 'Password',
      claveAyuda: 'Used only for this copy and not saved.',
      baseOrigen: 'Source database',
      destino: 'Target database on this computer',
      destinoAyuda:
        'If it does not exist, it is created. If it has tables, you will be asked to confirm before replacing it.',
      faltaHost: 'Enter the host',
      faltaPuerto: 'Use a port between 1 and 65535',
      faltaUsuario: 'Enter the user',
      faltaBase: 'Enter the source database',
      importar: 'Import',
    },
    dialogoNueva: {
      titulo: (motor: string) => `New database in ${motor}`,
      codificacion: 'Encoding',
      codificacionValor: {
        mysql: 'utf8mb4 (supports emojis and all accents)',
        mariadb: 'utf8mb4 (supports emojis and all accents)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Create a dedicated user for this database',
      usuarioPropioAyuda: 'Optional. Otherwise, your projects use the server admin user.',
      usuario: 'User',
      clave: 'Password',
      faltaClave: 'Enter a password',
      crear: 'Create database',
      creada: (base: string) => `Database ${base} created`,
      mongo: 'In MongoDB the database is created with an initial collection (_pel_init).',
      cambiarClave: 'Change the password',
      cambiarClaveTitulo: (u: string) => `User ${u} already exists with another password`,
      cambiarClaveTexto: (u: string) =>
        `If you change the password of ${u}, projects already using it will stop connecting until you update their .env. Normally you would use the current password. Change it anyway?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Delete the ${base} database?`,
      texto: (base: string, motor: string) =>
        `This deletes the ${base} database from ${motor} and all its data. It cannot be undone. If you need it, back it up first.`,
      pedir: (base: string) => `To confirm, type ${base}`,
      boton: 'Delete database',
      hecho: (base: string) => `Database ${base} deleted`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Back up ${base}`,
      destino: 'It will be saved in',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (default folder)',
      porDefectoEn: (carpeta: string) => `${carpeta} (default folder)`,
      cambiar: 'Choose another folder…',
      porDefectoVolver: 'Use the default folder',
      formato: {
        mysql: '.sql file (mysqldump with routines and triggers)',
        mariadb: '.sql file (mysqldump with routines and triggers)',
        postgresql: '.dump file (pg_dump, custom format)',
      } as Record<string, string>,
      boton: 'Back up',
    },
    dialogoConexion: {
      tituloServicio: 'Connection to Meilisearch',
      notaMeilisearch:
        'To use it in a project: Variables (.env) → Add a block → Meilisearch. A preview with the key masked is shown and confirmation is required. The key only belongs to this computer.',
      sitio: 'Project',
      sitioAyuda:
        "The site's .env is read to use the variables it already has (for example, CodeIgniter 4). Its content is not shown or copied.",
      generico: 'Generic (Laravel format)',
      titulo: (base: string) => `Connection to ${base}`,
      host: 'Host',
      puerto: 'Port',
      usuario: 'User',
      clave: 'Password',
      base: 'Database',
      sinClave: 'No password (listens on 127.0.0.1 only)',
      mostrar: 'Show password',
      ocultar: 'Hide password',
      copiarDato: (dato: string) => `Copy ${dato}`,
      env: 'Block for the .env file',
      envAyuda: "Paste it into your project's .env. WolfCore Dev does not write to your projects.",
      copiarEnv: 'Copy block',
      cargando: 'Reading connection details…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'A pgvector installation is already in progress.',
      descripcion:
        'Similarity search (embeddings) inside PostgreSQL. Built from the official source code.',
      instalado: (v: string | null) => (v ? `Installed (version ${v})` : 'Installed'),
      noInstalado: 'Not installed',
      herramientas: 'Build tools',
      herramientasSi: 'Ready',
      herramientasNo: 'Missing',
      instalar: 'Install pgvector',
      reinstalar: 'Rebuild',
      instalarHerramientas: 'Install build tools',
      dialogoHerramientasTitulo: 'Install build tools',
      dialogoHerramientas:
        'Building pgvector requires the Visual Studio Build Tools. About 6 GB will be downloaded and Windows will ask for administrator permission. It can take a while; keep WolfCore Dev open.',
      dialogoCompilarTitulo: 'Build and install pgvector',
      dialogoCompilar:
        'The official pgvector source code is downloaded, built and installed into your PostgreSQL. PostgreSQL stops for a few seconds while the extension is copied and then starts again.',
      continuar: 'Continue',
      instalando: 'Installing build tools…',
      compilando: 'Building pgvector…',
      herramientasOk: 'Build tools installed',
      instaladoOk: (v: string) => `pgvector ${v} installed`,
      sinWinget:
        'This computer does not have winget. Install "Build Tools for Visual Studio 2022" from visualstudio.microsoft.com with the "Desktop development with C++" workload and try again.',
      falloHerramientas: 'Could not install the build tools',
      activarAyuda: 'Then use "Enable vector" on each database that needs it.',
      errorEstado: 'Could not read the pgvector status',
    },
  },
  instalar: {
    titulo: 'Install',
    descripcion:
      'Download official versions. Each file is verified against its SHA-256 hash before use.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Web server (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Public tunnels (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Database, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Database, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Database (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'In-memory cache and queues (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Document database (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB shell (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Test mail (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Test mail (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Test mail (github.com/inbucket)' },
      papercut: { nombre: 'Papercut SMTP', detalle: 'Test mail (github.com/ChangemakerStudios)' },
      ollama: { nombre: 'Ollama', detalle: 'Local AI (ollama.com)' },
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Search for Laravel Scout (github.com/meilisearch)',
      },
      composer: { nombre: 'Composer', detalle: 'PHP dependencies (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Web database manager' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'MySQL web manager (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web and PHP',
      bd: 'Databases',
      otros: 'Mail, AI and tunnels',
    },
    instalados: 'Installed',
    ninguno: 'No version installed',
    elegir: 'Choose a version',
    buscando: 'Looking for versions…',
    sinVersiones: 'No versions found',
    rama: (rama: string) => rama,
    yaInstalada: 'already installed',
    fases: {
      descargando: 'Downloading',
      verificando: 'Verifying SHA-256',
      extrayendo: 'Extracting',
      compilando: 'Building',
      listo: 'Installed',
      error: 'Installation failed',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} installed`,
  },
  sitios: {
    titulo: 'Sites',
    descripcion: 'Each site is a folder served by Nginx on its own .test domain.',
    nuevo: 'New site',
    buscar: 'Search by name or domain',
    sinResultados: (q: string) => `No site matches "${q}".`,
    vacioTitulo: 'No sites yet',
    vacio:
      'Choose a project folder and WolfCore Dev detects whether it is Laravel, CodeIgniter or static.',
    agregar: 'Add site',
    total: (n: number) => plural(n, 'site', 'sites'),
    abrirSitio: (dominio: string) => `Open ${dominio} in the browser`,
    carpeta: 'Folder',
    abrirCarpeta: 'Open the project folder',
    alias: (n: number) => `+${plural(n, 'alias', 'aliases')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Static',
      proxy: 'Proxy (local port)',
      personalizado: 'Custom',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (local port)',
      node: 'Node / Vite (local port)',
      rails: 'Rails (local port)',
      springboot: 'Spring Boot (local port)',
      aspnet: 'ASP.NET Core (local port)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Static',
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
    datosReales: 'Real data',
    datosRealesAyuda: 'Contains real customer data: be careful when publishing it.',
    faltaHosts: 'Missing from hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} does not point to this computer yet. Fix the hosts file using the notice above.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Missing from hosts',
      iniciando: 'Nginx starting…',
      errorNginx: 'Nginx error',
      nginxExterno: 'External Nginx',
      nginxApagado: 'Nginx stopped',
    },
    borrar: {
      titulo: (nombre: string) => `Delete the site ${nombre}?`,
      texto: 'The project folder is not touched.',
      hecho: (nombre: string) => `Site ${nombre} deleted`,
      nginxFallo: 'The site was deleted, but Nginx did not accept the new configuration',
    },
  },
  formSitio: {
    tituloNuevo: 'New site',
    tituloEditar: 'Edit site',
    tituloDuplicar: 'Duplicate site',
    paso: 'Start with the project folder',
    pasoAyuda:
      'The project type, PHP version and a suggested domain are detected. You can change everything afterwards.',
    elegirCarpeta: 'Choose folder',
    cambiarCarpeta: 'Change',
    detectando: 'Analyzing the project…',
    detectado: (tipo: string) => `Detected: ${tipo}`,
    sinDeteccionAlEditar: 'Automatic detection only applies when creating; check the type and PHP.',
    nombre: 'Name',
    nombreAyuda: 'Only used to recognize it in the list.',
    nombreCopia: (nombre: string) => `${nombre} (copy)`,
    duplicarProxy:
      'The copy points to the same local port as the original and does not copy its processes: change the port or add its own process.',
    dominio: 'Domain',
    dominioPlaceholder: 'my-project',
    alias: 'Aliases',
    aliasAyuda: 'Other .test domains that open the same site. Type one and press Enter.',
    aliasAgregar: 'Add alias',
    carpeta: 'Project folder',
    raizLaravel: 'Nginx will serve the public/ subfolder.',
    tipo: 'Project type',
    php: 'PHP version',
    phpElegir: 'Choose a version',
    phpNinguno: 'No PHP version is installed.',
    phpInstalar: 'Install PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `The project requires PHP ${pedida}, which is not installed. PHP ${elegida} was selected.`,
    puertoProxy: 'Local port',
    puertoProxyAyuda:
      'Nginx will forward requests to http://127.0.0.1:<port> (for example, Vite or Node).',
    urlBaseVar: 'Base URL variable',
    urlBaseVarAyuda:
      'When a tunnel opens, the public link is written to this .env variable, and it is restored when the tunnel closes.',
    urlBaseVarNinguna: 'None (do not touch the .env)',
    datosReales: 'Has real customer data',
    datosRealesAyuda:
      'It is flagged in the list and confirmation is required before publishing it with a tunnel.',
    avanzado: 'Advanced',
    reglasExtra: 'Extra Nginx rules',
    reglasExtraAyuda:
      'Inserted inside the server block (security headers, custom deny rules…). Validated with nginx -t on save.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Note',
    notaPlaceholder: 'Something you want to remember about this site',
    guardar: 'Save site',
    guardado: (nombre: string) => `Site ${nombre} saved`,
    errorGuardar: 'Could not save the site',
    nginxFallo: 'The site was saved, but Nginx rejected the configuration',
    nginxFalloAyuda:
      'The previous Nginx configuration was restored. Check the extra rules and save again.',
    errores: {
      carpeta: 'Choose the project folder',
      sufijo: 'The domain must end in .test',
      caracteres: 'Use only letters, numbers, hyphens and dots',
      aliasIgualDominio: (d: string) => `The alias ${d} is the same as the site domain`,
      aliasRepetido: (d: string) => `The alias ${d} is repeated`,
      ocupado: (d: string) => `A site with the domain ${d} already exists`,
      puertoFalta: 'A proxy site needs a port',
      puertoRango: 'The port must be between 1 and 65535',
      php: 'Select a PHP version for this site',
      urlBaseVar: 'Use letters, numbers and underscores (for example, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Public tunnel for ${dominio}`,
    etiqueta: 'Tunnel',
    apagadoAyuda: 'Share this site with a temporary public link.',
    abriendo: 'Opening tunnel…',
    cerrando: 'Closing tunnel…',
    error: 'The tunnel failed',
    sinNginx: 'Start Nginx first',
    sinCloudflared: 'Install cloudflared in Services',
    sinConfianza:
      'This project is not trusted: tick «I trust this repository» to be able to publish it.',
    abrirUrl: 'Open the public link',
    copiarUrl: 'Copy the public link',
    verQr: 'Show the QR code of the link',
    qrTitulo: 'Public link of this site',
    renovar: 'Renew (new link)',
    cerrar: 'Close tunnel',
    confirmarTitulo: 'Publish a site with real data',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} has real customer data and would be published on the internet with ${destino}: anyone with the link can see it while it stays open. Publish?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} will be published on the internet with Expose: anyone with the link can get in while it stays open. Also, the Expose request inspector is visible to every device on your local network. Publish?`,
    compartir: 'Share',
    confirmar: 'Publish',
    confirmarPublicoTitulo: 'Publish the site on the internet',
    confirmarPublicoTexto: (dominio: string) =>
      `A public Cloudflare tunnel will be opened for ${dominio}: anyone with the link can access it while it stays open. Publish?`,
    opciones: 'Tunnel options',
    opcionesDe: (dominio: string) => `Tunnel options for ${dominio}`,
    proveedor: 'Provider',
    proveedorRapido: 'Quick (no account)',
    proveedorRapidoAyuda: 'A trycloudflare.com link that changes every time it is opened.',
    proveedorNombre: 'Named (your domain)',
    proveedorNombreAyuda:
      'A fixed link on one of your Cloudflare domains. Needs a Cloudflare account.',
    cuentaConectada: 'Cloudflare account connected.',
    cuentaSinConectar: 'No Cloudflare account is connected yet.',
    conectar: 'Connect to Cloudflare',
    conectando: 'Waiting for authorization in your browser…',
    conectarAyuda:
      'Your browser opens so you can authorize WolfCore Dev on your account. The certificate stays only in your data folder.',
    autorizacion: 'Cloudflare authorization',
    abrirAutorizacion: 'Open the authorization page',
    copiarAutorizacion: 'Copy the authorization link',
    cancelarConexion: 'Cancel',
    recrear: 'Recreate the tunnel',
    olvidar: 'Forget the tunnel',
    recrearTitulo: 'Recreate the tunnel',
    recrearTexto: (n: string) =>
      `Tunnel “${n}” will be deleted in Cloudflare and a new one created with the same name. Sites using it are closed.`,
    olvidarTitulo: 'Forget the tunnel',
    olvidarTexto: (n: string) =>
      `Tunnel “${n}” will be deleted in Cloudflare along with its saved credential. Sites using it go back to the quick tunnel.`,
    olvidarAqui: 'Forget only here',
    olvidarAquiTitulo: 'Forget the tunnel on this computer only',
    olvidarAquiTexto: (n: string) =>
      `The saved credential of tunnel “${n}” will be deleted on this computer; the tunnel will keep existing in Cloudflare. Sites using it go back to the quick tunnel.`,
    desconectar: 'Disconnect',
    nombreTunel: 'Tunnel name',
    nombreTunelAyuda: 'Lowercase letters, numbers and hyphens.',
    dominioPublico: 'Public domain',
    dominioPublicoAyuda: 'A subdomain of one of your Cloudflare domains, e.g. demo.mydomain.com.',
    crear: 'Create and route',
    guardadoNombre: 'Named tunnel ready. You will be asked to confirm when opening it.',
    guardadoRapido: 'This site uses the quick tunnel again.',
    cambiarCierra: 'Changing the provider closes this site’s open tunnel.',
    usarRapido: 'Use the quick tunnel',
    nombreActual: (nombre: string, dominio: string) => `Tunnel “${nombre}” on ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} will be published at ${publico} through a Cloudflare tunnel: anyone with the link can access it while it stays open. Publish?`,
    proveedorNgrokAyuda:
      'With your ngrok account. Needs the ngrok program already installed on this computer.',
    proveedorExposeAyuda:
      'With your Expose account. Needs Expose already installed on this computer; on Windows it only works with expose.phar. Its inspector is visible on the local network, so it is not used with sites that have real data.',
    proveedorTailscaleAyuda:
      'Through your private Tailscale network. Needs Tailscale installed and signed in.',
    tokenGuardado: (f: string) => `Token saved (ends in ${f}).`,
    tokenSinGuardar: 'No token saved yet.',
    tokenNgrok: 'ngrok token',
    tokenExpose: 'Expose token',
    tokenAyuda:
      'It is stored encrypted on this computer and only handed to the program when the tunnel opens; it is never shown.',
    tokenPlaceholder: 'Paste the token here',
    guardarToken: 'Save the token',
    borrarToken: 'Delete the token',
    usarProveedor: 'Use this provider',
    guardadoProveedor: 'Provider saved. Opening the tunnel will ask for confirmation.',
    ngrokAyudaInstalacion:
      'ngrok must already be installed on this computer (WolfCore Dev does not download it because ngrok publishes no verifiable download). Its global configuration is not touched.',
    exposeAyudaInstalacion:
      'Expose must already be installed or have its expose.phar in the bin/expose folder of the WolfCore Dev data (on Windows it only works with the phar; there is no download with a checksum). Its request inspector is visible on the whole local network, so it is not used with sites that have real data. Its global configuration is not touched.',
    tailscaleAlcance: 'How far it reaches',
    tailscaleServe: 'Serve: your tailnet only',
    tailscaleServeAyuda:
      'Only the devices on your Tailscale network. It does not reach the internet.',
    tailscaleFunnel: 'Funnel: the whole internet',
    tailscaleFunnelAyuda:
      'Anyone with the link can get in, whether or not they are on your tailnet.',
    tailscaleFunnelAviso:
      'Funnel puts this site on the internet: anyone with the link can get in while it is open.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev does not install Tailscale (it is a system service): it must be installed and signed in. Nothing you already publish with Tailscale is changed; the site uses HTTPS port 8443.',
    confirmarTailnetTitulo: 'Share with your tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} will be shared with Tailscale Serve: only the devices on your tailnet can get in; it is not published on the internet. Share?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} has real customer data. With Tailscale Serve only the devices on your tailnet can see it (it is not published on the internet). Share?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} will be published on the internet with Tailscale Funnel: anyone with the link can get in while it stays open. Publish?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} will be published on the internet with ${proveedor}: anyone with the link can get in while it stays open. Publish?`,
    tituloError: 'Could not open the tunnel',
  },
  tuneles: {
    titulo: 'Tunnels',
    descripcion: 'Temporary public Cloudflare links to show a site outside your network.',
    explicacion:
      'Quick tunnels change address every time they are opened or renewed, and only work while this computer is on and their processes are alive (if you quit WolfCore Dev and leave them running, they stay active).',
    columnas: { sitio: 'Site', estado: 'Status', url: 'Link', acciones: 'Actions' },
    vacioTitulo: 'No tunnels open',
    vacio: "Turn on a site's tunnel switch to get a public link.",
    irAProyectos: 'Go to Projects',
    sinNombre: 'Deleted site',
    compartir: {
      enlace: 'Share folder or file…',
      ayuda: 'Publishes a folder or a single file (read-only), without needing a site.',
    },
  },
  ajustes: {
    titulo: 'Settings',
    descripcion: 'Environment preferences.',
    general: 'General',
    carpetaDatos: 'Data folder',
    carpetaDatosAyuda: 'Binaries, configuration and logs. It can be opened, not changed.',
    servicios: 'Services',
    puertoNginx: 'Nginx port',
    puertoNginxAyuda:
      'Usually 80. If it is not 80, local URLs will include the port. Open tunnels stay on the previous port: renew them.',
    trabajadores: 'PHP workers',
    trabajadoresAyuda:
      'php-cgi processes per version. More workers handle more requests at the same time.',
    nota: 'Saving regenerates the sites with the new port. If Nginx is running it restarts (or reloads if the port did not change), and running PHP versions restart if the worker count changes.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Settings saved and applied. Restarted: ${reiniciados.join(', ')}.`
        : 'Settings saved and applied.',
    errorAplicar: 'Settings saved, but they could not be fully applied',
    errorSeccion: (detalle: string) => `Could not read this value: ${detalle}`,
    acerca: 'About',
    avisos: {
      titulo: 'Notices',
      descripcion:
        'Which notices are kept in the bell and whether Windows shows a notification when the window is not in view.',
      nativas: 'Windows notifications',
      nativasAyuda:
        'Only when WolfCore Dev is not in the foreground; at most one per type every 5 min.',
      tiposTitulo: 'Notice types',
      versionesTitulo: 'New versions per service',
      versionesAyuda:
        'Turn a service off to stop getting notices about its new versions (the Versions tab still marks updates).',
      versionesDe: (s: string) => `Notify about new versions of ${s}`,
      tipos: {
        'servicio-caido': 'A service stopped with an error',
        'puerto-ocupado': 'Port in use when starting a service',
        'certificado-por-vencer': 'Certificates about to expire',
        'tunel-caido': 'A tunnel went down',
        'proceso-error': 'A project process failed',
        'proceso-terminado': 'A project process finished',
        'receta-terminada': 'A project recipe finished',
        doctor: 'Diagnostics (Doctor)',
        'contenedor-detenido': 'A container stopped',
        'version-nueva': 'A new version of an installed service',
      } as Record<string, string>,
      errorGuardar: 'The notice settings could not be saved',
    },
    versionPrograma: 'Program version',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Local authority',
      autoridadAyuda:
        "WolfCore Dev signs the certificates for your .test sites with its own authority. It is installed in your Windows user's store, without administrator permissions.",
      instalada: 'Installed in Windows',
      noInstalada: 'Not installed',
      instalar: 'Install authority',
      reinstalar: 'Reinstall',
      quitar: 'Remove',
      instaladaOk: 'HTTPS authority installed',
      quitadaOk: 'HTTPS authority removed',
      cancelado: 'The Windows confirmation was canceled. Nothing was changed.',
      fallo: 'Could not change the HTTPS authority',
      quitarTitulo: 'Remove the HTTPS authority?',
      quitarTexto:
        'Browsers will stop trusting the certificates for your .test sites until you install it again.',
      puerto: 'HTTPS port',
      puertoAyuda:
        'Usually 443. If another program uses it, choose one between 1024 and 65535; URLs will include the port.',
      puertoRango: 'Use 443 or a number between 1024 and 65535',
      puertoGuardado: (p: number) => `HTTPS now uses port ${p}`,
      puertoAplicarFallo: 'Port saved, but Nginx did not accept the new configuration',
      firefox:
        'Firefox uses its own certificate store. To make it trust the authority, open about:config and enable',
    },
    herramientas: {
      titulo: 'Terminal and tools',
      phpPorDefecto: 'Default PHP',
      phpPorDefectoAyuda: `The php and composer version in the terminal and in WolfCore Dev shortcuts. "Terminal" uses each project's PHP.`,
      phpMasReciente: 'Latest installed',
      phpSinInstalar: 'Install PHP in Services to choose a version',
      phpGuardado: 'Default PHP updated',
      path: 'User PATH',
      pathAyuda:
        "Adds WolfCore Dev's php and composer to your user PATH so you can use them in any terminal.",
      pathActivo: 'Added to PATH',
      pathInactivo: 'Not in PATH',
      pathAgregar: 'Add to user PATH',
      pathQuitar: 'Remove from PATH',
      pathTitulo: 'PATH updated',
      pathAviso:
        'Open a new terminal to see the change: terminals that are already open do not see it.',
      pathQuitarTitulo: 'Remove WolfCore Dev from the PATH?',
      pathQuitarTexto:
        "WolfCore Dev's php and composer will no longer be available in new terminals. Open terminals do not change.",
      adminer: 'Adminer port',
      adminerAyuda: 'Adminer is served only on this computer, at this fixed address.',
      terminal: 'Default terminal',
      terminalSistema: "The system's (PowerShell)",
      terminalAyuda:
        'The one "Terminal" opens on projects. If the project needs its own variables (its PHP on the PATH, an agent key), choosing "Windows Terminal" opens PowerShell inside the Windows default terminal: an already open Windows Terminal would not receive those variables.',
      terminalGuardada: 'Default terminal updated',
      editor: 'Default editor',
      editorPrimero: 'The first one detected',
      editorAyuda:
        'The one "Editor" opens on projects, and "Open in editor" in searches and errors. VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed and Notepad++ are detected.',
      editorGuardado: 'Default editor updated',
      editorNinguno: 'No editor was detected.',
    },
  },
  /* ───────────── HTTPS, terminal and FTP on sites; Mail; Local AI ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS active',
    candadoAyuda: 'This site also responds over HTTPS with a WolfCore Dev certificate.',
    redirige: 'Redirects http → https',
    abrirHttp: (dominio: string) => `Open http://${dominio} in the browser`,
    abrirHttps: (url: string) => `Open ${url} in the browser`,
    pendiente: (motivo: string) => `HTTPS pending: ${motivo}`,
    pendienteCorto: 'HTTPS pending',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `port ${puerto} is used by ${nombre} (PID ${pid}).`,
    sinAutoridad: 'the certificate authority is missing. Install it in Settings.',
    pendienteAyuda:
      'The site keeps working over HTTP. Close that program or choose another HTTPS port in Settings.',
    sinConfianza: 'Authority not installed',
    sinConfianzaAyuda:
      'The browser will show a security warning until you install the WolfCore Dev authority (Settings → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Also serve over HTTPS',
    httpsAyuda: 'With its own certificate for the domain and its aliases, signed by WolfCore Dev.',
    redirigir: 'Redirect to HTTPS',
    redirigirAyuda: 'Visits over http go to https. Public tunnels are not affected.',
    redirigirDeshabilitado: 'Enable HTTPS first',
    sinAutoridadTitulo: 'The HTTPS authority is not installed',
    sinAutoridadTexto:
      'Without it the browser will show a security warning. Windows will ask you to confirm the installation.',
    instalar: 'Install authority',
    instalada: 'HTTPS authority installed',
    cancelado: 'The Windows confirmation was canceled. Nothing was changed.',
    fallo: 'Could not install the HTTPS authority',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: "Opens a terminal in the project's folder, with its PHP and Composer in the PATH.",
    elegir: 'Choose terminal',
    predeterminada: 'default',
  },
  editorSitio: {
    ayuda: 'Opens the project folder in the default editor.',
    elegir: 'Open with…',
    predeterminada: 'default',
    sustituido: (pred: string, usado: string) =>
      '{pred} is not installed: opened with {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Could not open the editor',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Shared PHP ${rama}`,
    propio: (rama: string) => `PHP ${rama} of its own for this site`,
    conXdebug: 'Xdebug on',
    mostrar: 'PHP settings',
    ocultar: 'Hide PHP settings',
    cargando: 'Reading the PHP settings…',
    apagadoRama: (rama: string) => `PHP ${rama} is stopped: this site's own PHP starts with it.`,
    ajustesTitulo: 'Own php.ini',
    ajustesAyuda: (rama: string) =>
      `Added to the PHP ${rama} php.ini for this site only. With any of them (or with Xdebug), the site uses its own PHP with 1 or 2 processes; other sites do not change.`,
    clave: 'Directive',
    valor: 'Value',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Remove ${clave || 'setting'}`,
    agregar: 'Add setting',
    guardarAjustes: 'Test and save',
    ajustesGuardados: 'Site PHP settings applied',
    sinAjustes: 'No settings of its own: it uses the shared php.ini as is.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug for ${dominio}`,
    xdebugAyuda:
      "Loaded only in this site's PHP, never in the shared PHP: other sites stay just as fast.",
    xdebugDescarga:
      'Xdebug is not installed for this PHP version: it will be downloaded from the catalog (xdebug.org, SHA-256 checked).',
    modo: 'Modes',
    modos: {
      debug: 'debug (breakpoints)',
      develop: 'develop (better errors)',
      coverage: 'coverage',
      profile: 'profile',
      trace: 'trace',
    },
    puerto: 'Editor port',
    inicio: 'When it connects',
    inicioTrigger: 'Only with XDEBUG_TRIGGER',
    inicioYes: 'On every request',
    inicioAyuda:
      'With "Only with XDEBUG_TRIGGER", debugging starts when the request carries the cookie, the GET/POST parameter or the browser extension (Xdebug Helper).',
    guardarXdebug: 'Save Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Port ${puerto} is already used by a PHP or another WolfCore Dev service: your editor cannot listen on it. Choose another one (9003 is the usual one).`,
    xdebugGuardado: 'Site Xdebug applied',
    quitarXdebug: 'Remove Xdebug',
    quitarXdebugTitulo: 'Remove Xdebug from this site?',
    quitarXdebugTexto:
      'Its settings are deleted. If the site has no other settings, it goes back to the shared PHP. The project launch.json is not touched.',
    xdebugQuitado: 'Xdebug removed from the site',
    ide: 'Editor',
    generarLaunch: 'Generate launch.json',
    launchTitulo: 'Project .vscode/launch.json',
    launchNuevo:
      '.vscode/launch.json will be created with this configuration (VS Code PHP Debug, listening on 127.0.0.1 only).',
    launchFusion:
      'A launch.json already exists: only the WolfCore configuration is added (or updated); the others and their comments stay. A dated copy is saved first in the WolfCore Dev data folder.',
    launchSinCambios: 'The launch.json already has this configuration.',
    launchEscribir: 'Write launch.json',
    launchCreado: 'launch.json created in .vscode',
    launchActualizado: (respaldo: string) => `launch.json updated. Previous copy: ${respaldo}`,
    phpStorm: 'PhpStorm settings',
    copiarPhpStorm: 'Copy PhpStorm settings',
    errorNginx: (salida: string) =>
      `Nginx did not accept the change; the previous settings were restored. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Generated vhost',
    conReglas: 'with custom rules',
    manualResumen: 'Hand-written vhost (not regenerated)',
    mostrar: 'Edit vhost',
    ocultar: 'Hide vhost',
    cargando: 'Reading the vhost…',
    reglasTitulo: 'Custom rules',
    reglasAyuda:
      'They go inside this site’s server block. Before applying, they are tested with nginx -t on a copy of the whole configuration; if anything fails, everything stays as it was.',
    reglasEtiqueta: 'Custom Nginx rules',
    reglasPlaceholder: '# For example: client_max_body_size 256m;',
    snippetsTitulo: 'Snippets',
    insertar: (titulo: string) => `Insert: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Static file caching',
      'limite-subida': 'Upload limit',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Security headers',
      websocket: 'WebSocket proxy',
      gzip: 'Gzip compression',
      ocultos: 'Deny hidden files',
    },
    aplicar: 'Test and apply',
    descartar: 'Discard changes',
    aplicado: 'Vhost applied and Nginx reloaded',
    aplicadoApagado: 'Vhost saved; it will be used when Nginx starts',
    fallo: 'Nginx did not accept the change; the vhost is unchanged',
    salidaTitulo: 'nginx -t output',
    desactivado:
      'Nginx did not accept what you wrote for this site when applying the configuration, so it was left out of the vhost (it is still saved). Fix it and apply it again to use it.',
    avisoDestino: (destino: string, linea: number) =>
      `Line ${linea}: traffic is sent to another machine (${destino}). Make sure that is what you want.`,
    generadoTitulo: 'Generated vhost (read-only)',
    avanzadoTitulo: 'Advanced mode',
    avanzadoInterruptor: 'Write the whole vhost by hand',
    avanzadoAyuda:
      'Replaces the generated vhost. WolfCore Dev no longer regenerates it: if the domain, HTTPS, ports or folder change, you will have to adjust it yourself. Only this site’s domains and ports can be used.',
    avanzadoActivarTitulo: 'Write the vhost by hand?',
    avanzadoActivarTexto:
      'It starts from the current generated vhost. While it is on, site changes (domain, HTTPS, PHP…) are not reflected in the vhost: you will have to make them yourself.',
    avanzadoActivar: 'Write by hand',
    manualEtiqueta: 'Full site vhost',
    aplicarManual: 'Test and apply the vhost',
    volverGenerado: 'Back to the generated vhost',
    volverGeneradoTitulo: 'Go back to the generated vhost?',
    volverGeneradoTexto:
      'The hand-written vhost is kept in the history and WolfCore Dev generates the site’s vhost again (with its custom rules).',
    historial: 'History',
    historialTitulo: 'Previous vhost versions',
    historialVacio: 'There are no previous versions yet.',
    historialAyuda:
      'The last 10 versions are kept, before each change. Restoring goes through the same nginx -t test.',
    modoReglas: 'Generated with rules',
    modoManual: 'Hand-written',
    restaurar: 'Restore',
    restaurarTitulo: 'Restore this version?',
    restaurarTexto: (fecha: string) =>
      `The vhost goes back to how it was on ${fecha}. The current version stays in the history.`,
    restaurado: 'Version restored',
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'This project’s Reverb process does not have WolfCore Dev’s command (another host, program or port). Turning it on replaces it with the standard one, which only listens on 127.0.0.1.',
    ayuda: 'Laravel WebSockets, on 127.0.0.1 only.',
    puerto: (p: number) => 'Port {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) => 'Turn Reverb on or off for {d}'.replace('{d}', dominio),
    activarTitulo: 'Turn Reverb on?',
    activarTexto: (dominio: string) =>
      '“php artisan reverb:start” will run in {d}, listening only on 127.0.0.1 on a free port. The project’s code runs with its PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Turn Reverb off?',
    desactivarTexto:
      'The process stops and is removed from the project. The REVERB_* variables in .env are not touched.',
    activar: 'Turn on',
    desactivar: 'Turn off',
    proponer: 'Suggest REVERB_* variables',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Stopped',
      iniciando: 'Starting',
      encendido: 'Running',
      error: 'Failed',
    },
  },
  lan: {
    etiqueta: 'Local network',
    interruptor: (dominio: string) => `Share ${dominio} on the local network`,
    apagadoAyuda: 'Open this site from your phone or another device on the same network.',
    sinNginx: 'Start Nginx to share the site on the local network.',
    sinRed: 'No local network is connected (Wi-Fi or Ethernet).',
    activo: 'Visible on the local network',
    abriendo: 'Sharing…',
    cerrando: 'Stopping…',
    abrirUrl: 'Open on this computer',
    copiarUrl: 'Copy the address',
    verQr: 'Show the QR',
    qrTitulo: (dominio: string) => `${dominio} on the local network`,
    qrAviso: 'Scan the QR with a phone connected to the same network.',
    confirmarTitulo: 'Share on the local network',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} will be visible to any device connected to the same network as this computer (${ip}), with no password. Sharing stops when you turn the switch off, when WolfCore Dev closes and when it starts again.`,
    ipEtiqueta: 'Network (this computer’s IP)',
    https: 'Use HTTPS',
    httpsAyuda:
      'With HTTPS the phone must trust the WolfCore Dev CA (“Install the CA on the phone” button). Without it, the site is served over HTTP.',
    httpsObligatorio: 'This site redirects to HTTPS, so it is shared with HTTPS.',
    compartir: 'Share on the network',
    tituloError: 'Could not share on the local network',
    caBoton: 'Install the CA on the phone',
    firewallTitulo: 'Does not open on the phone?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} has real data and is not shared on the local network, not even with confirmation.`,
    redPublica:
      'This network is marked as public in Windows: the firewall will block inbound traffic and the command only opens private networks. Mark it as private if it is your trusted network.',
    firewallTexto:
      'WolfCore Dev does not change the firewall. Do not accept the Windows prompt for the whole program: use the command for this port (local subnet only, private networks only) in PowerShell as administrator. It will not open on a public network, and an existing block rule takes priority over an allow rule.',
    copiarComando: 'Copy the command',
  },
  caMovil: {
    titulo: 'Install the CA on the phone',
    intro:
      'Scan the QR with a phone connected to the same network to download the WolfCore Dev authority certificate. Only that file is served and the link closes by itself.',
    abriendo: 'Opening the link…',
    expira: (minutos: number) => `The link closes by itself in ${minutos} min.`,
    expirado: 'The link was closed.',
    reabrir: 'Open again',
    android: 'Android',
    ios: 'iPhone or iPad',
    pasosAndroid: [
      'Scan the QR or open the address in the phone browser and download the file.',
      'Open Settings > Security & privacy > More security > Encryption & credentials > Install a certificate > CA certificate (names vary by brand).',
      'Before trusting it, compare the SHA-256 fingerprint the phone shows with the one in this dialog: if they differ, do not install it.',
      'Pick the downloaded file and accept the warning: it is normal, Android warns for every CA.',
    ],
    pasosIos: [
      'Open the address in Safari and allow the profile to download.',
      'Open Settings > Profile Downloaded and compare the SHA-1 fingerprint in its details with the one in this dialog: if they differ, do not install it. Then install it.',
      'Open Settings > General > About > Certificate Trust Settings and turn on full trust for the WolfCore Dev CA.',
    ],
    aviso:
      'An installed CA trusts everything it signs on that phone: install it only on your own devices and remove it when you are done.',
    firewallAviso: (puerto: number) =>
      'For the phone to reach the link, port ' +
      puerto +
      ' must be opened (local subnet and private networks only). Do not accept the Windows prompt for the whole program: run this command in PowerShell as administrator. It will not open on a public network, and an existing block rule takes priority.',
    huellas: 'Certificate fingerprints',
    tituloError: 'Could not open the CA link',
  },
  dialogoQr: {
    descargar: 'Download PNG',
    descargado: 'QR saved',
    largo: 'The text is too long for a QR code.',
    generando: 'Generating the QR code…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `FTP access for ${dominio}`,
    apagadoAyuda: "Allow uploading files to this site's folder over FTP.",
    activoAyuda: 'Access enabled.',
    soloLecturaEtiqueta: 'read-only',
    mostrarDatos: 'Show FTP details',
    ocultarDatos: 'Hide FTP details',
    host: 'Host',
    puerto: 'Port',
    usuario: 'User',
    clave: 'Password',
    mostrarClave: 'Show password',
    ocultarClave: 'Hide password',
    copiarDato: (dato: string) => `Copy ${dato}`,
    cargando: 'Reading FTP details…',
    regenerar: 'Regenerate password',
    regenerarTitulo: 'Regenerate the FTP password?',
    regenerarTexto:
      "The current password stops working and this site's open connections are closed. You will need to update it in your FTP client.",
    regenerada: 'FTP password regenerated',
    soloLectura: 'Read-only',
    soloLecturaAyuda: 'Files can be downloaded, but not uploaded, changed or deleted.',
    soloLecturaActivado: "This site's FTP is now read-only",
    soloLecturaDesactivado: "This site's FTP now allows writing",
    activado: 'FTP access enabled',
    desactivarTitulo: "Remove this site's FTP access?",
    desactivarTexto:
      "The password is deleted and open connections are closed. The site's folder is not touched.",
    desactivar: 'Remove access',
    desactivado: 'FTP access removed',
    redLocalAviso:
      'FTP accepts connections from the local network and sends the password and files unencrypted. Only use it on a trusted network.',
    redLocalHost: "or this computer's IP on your network",
    servidorApagado: 'The FTP server is stopped: nobody can connect until you start it.',
    encender: 'Start FTP',
    urlEtiqueta: 'Address',
    urlAyuda: 'The address does not include the password: it is asked for when connecting.',
    abrirUrl: 'Open in an FTP client',
    copiarUrl: 'Copy the FTP address',
    verQr: 'Show the QR code of the address',
    qrTitulo: 'FTP address of this site',
    qrAviso: 'The code only carries the address, not the password.',
    compartirNota:
      'FTP is for the local network only: it is not shared through an internet tunnel because it sends the password and files unencrypted.',
    compartirIr: 'Share a folder or file with a temporary link',
  },
  correo: {
    descripcion:
      'Catchers capture the emails your projects send so you can review them without them reaching the internet. They listen only on this computer (127.0.0.1) and only one runs at a time.',
    seccionCaptadores: 'Local catchers',
    seccionProveedores: 'Remote SMTP providers',
    proveedores: {
      descripcion:
        'A real SMTP provider sends the email for real: use it to test your project’s sending before going live. The key is stored encrypted on this computer and is never shown.',
      agregar: 'Add provider',
      vacio:
        'You have not added any provider yet. Pick Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO or Gmail, or enter your own.',
      errorLista: 'The provider list could not be read',
      tarjeta: {
        servidor: 'Server',
        usuario: 'Username',
        clave: 'Key',
        sinClave: 'No key',
        claveIlegible: 'Saved (could not be read)',
        red: 'Network',
        redLocal: 'Server on this computer or the local network (confirmed)',
        editar: 'Edit',
        borrar: 'Delete',
        borrarTitulo: (n: string) => `Delete ${n}?`,
        borrarTexto:
          'The provider and its saved key are deleted. Projects that use it go back to the local catcher, but their .env files are not touched: they keep this provider’s MAIL_* variables (and its key, if you wrote it). Rewrite the mail block in each .env.',
        borrado: (n: string) => `${n} deleted`,
        usar: 'Use in a project',
        destino: 'Destination address for the test',
        destinoPlaceholder: 'your-address@example.com',
        probar: 'Test send',
        probando: 'Sending…',
        probarAyuda:
          'Sends one real email to that address over a verified encrypted connection. At most one every 15 s.',
        sinClaveParaProbar: 'Save the provider key to be able to test sending.',
        hostLocal: 'This server’s name resolves to this computer or the local network.',
        confirmarRed: 'Confirm local network',
        enviado: (para: string) => `Email sent to ${para}. Check your inbox.`,
        fallos: {
          'correo.auth': 'The provider rejected the username or the key.',
          'correo.conexion': 'Could not connect: check the host and port.',
          'correo.tls':
            'The encrypted connection is not valid (certificate, name or STARTTLS). Nothing was sent.',
          'correo.rechazado':
            'The server rejected the message or an address. Check the sender: many providers only accept a verified sender or domain.',
          'correo.plazo': 'The server did not answer in time (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Add SMTP provider',
        editar: (n: string) => `Edit ${n}`,
        preset: 'Provider',
        presetOtro: 'Other (enter the details)',
        presetAyuda: 'Host and port come from each provider’s official documentation.',
        documentacion: 'View documentation',
        region: 'Region',
        nombre: 'Name',
        nombreObligatorio: 'Enter a name.',
        host: 'Server (host)',
        hostAyuda: 'Only the name or the IP, without smtp:// or a port.',
        hostObligatorio: 'Enter the server.',
        puerto: 'Port',
        seguridad: 'Encryption',
        seguridadAyuda:
          'An encrypted connection with a valid certificate is always required: it never falls back to plain text.',
        tls: 'Direct TLS (port 465)',
        starttls: 'STARTTLS (port 587)',
        usuario: 'Username',
        usuarioObligatorio: 'Enter the username.',
        usuarioFijoAyuda: 'This provider always uses this username; the key is your account’s.',
        clave: 'SMTP key',
        claveGuardada: (f: string) => `Saved: ••••${f}`,
        claveNueva: 'Type the key to save it',
        claveAyuda:
          'It is stored encrypted on this computer and never shown again. Leave it empty to keep it.',
        remitente: 'Sender of the test (optional)',
        remitenteAyuda:
          'Many providers only send from a verified sender or domain. If left empty, the sender is the destination address itself.',
        claveSinEspacios: 'Paste the key exactly as the provider gives it: inner spaces are kept.',
        borrarClave: 'Delete the key',
        borrarClaveTitulo: (n: string) => `Delete the key of ${n}?`,
        borrarClaveTexto: 'The saved key is deleted. The provider stays in the list.',
        claveBorrada: 'Key deleted',
        guardar: 'Save',
        guardado: (n: string) => `${n} saved`,
        redLocalTitulo: 'Server on this computer or the local network',
        redLocalTexto: (h: string) =>
          `${h} points to this computer or the local network. WolfCore Dev only connects there if you confirm it. Is it your own server?`,
        redLocalConfirmar: 'Yes, it is mine',
        cambiaTitulo: 'Send the key to another server',
        cambiaTexto: (h: string) =>
          `The provider has a saved key and you changed the server or the username. The key will be sent to ${h}. Continue?`,
        cambiaConfirmar: 'Yes, continue',
      },
      env: {
        titulo: (n: string) => `Use ${n} in a project`,
        proyecto: 'Project',
        sinProyectos: 'There are no projects yet.',
        yaUsaSmtp: 'This project already sends through an SMTP provider.',
        volverCaptador: 'Go back to the local catcher',
        volvio: (n: string) =>
          `${n} sends to the local catcher again, but its .env was not touched: it keeps the provider’s MAIL_* variables (and its key, if you wrote it). Rewrite its mail block.`,
        incluirClave: 'Also write the key to the .env',
        incluirClaveAyuda: 'Unchecked, the block has no MAIL_PASSWORD and you add it by hand.',
        sinClaveGuardada: 'The provider has no saved key.',
        vista: 'Changes to the .env (the key is masked)',
        textoPlano:
          'The key will be in plain text in the project’s .env. Anyone with access to that folder, or to its repository if you push it, will be able to read it.',
        claveTitulo: 'Write the key to the .env',
        claveTexto:
          'The key is saved in plain text in the project’s .env file. Use it only if the project is not pushed to a repository and the folder is only yours.',
        claveConfirmar: 'I understand, include the key',
        agregarGitignore: 'Add .env to .gitignore',
        gitignoreTitulo: 'Modify .gitignore',
        gitignoreTexto: 'The .env line is added to the project’s .gitignore (with a prior copy).',
        gitignoreConfirmar: 'Add',
        versionadoTitulo: 'Git already tracks the .env',
        versionadoTexto:
          'The next commit would upload its values. Remove it from the index with git rm --cached .env.',
        desconocidoTitulo: 'Git could not be checked',
        desconocidoTexto: 'It could not be determined whether git tracks this project’s .env.',
        aceptarVersionado: 'Write anyway',
        aceptarTitulo: 'Write to a tracked .env',
        aceptarTexto:
          'If git tracks the .env, these variables may end up in the repository. Write anyway?',
        aceptarConfirmar: 'Write anyway',
        confirmarTitulo: 'Write to the .env',
        confirmarTexto: (ruta: string) =>
          `A copy of ${ruta} will be saved and the MAIL_* variables will be added without the key.`,
        confirmarTextoClave: (ruta: string) =>
          `A copy of ${ruta} will be saved and the MAIL_* variables will be added, with the key in plain text.`,
        confirmar: 'Write',
        escribir: 'Write to the .env',
        escrito: (n: string) => `${n} now sends through this provider`,
      },
    },
    estado: 'Status',
    smtp: 'SMTP',
    buzon: 'Web inbox',
    abrirBuzon: 'Open inbox',
    noLeidos: 'Unread',
    noLeidosValor: (n: number) => plural(n, 'unread email', 'unread emails'),
    noLeidosError: 'Could not read the inbox',
    actualizar: 'Recount emails',
    actualizaSolo: 'Updates every 15 seconds while this screen is open.',
    env: 'Block for the Laravel .env',
    envAyuda: (captador: string) =>
      `Paste it into your project's .env. Mail stays in ${captador}, without encryption or a user.`,
    copiarEnv: 'Copy block',
    irAServicios: 'Go to Services',
    cargando: 'Reading the catchers…',
    errorLista: 'Could not read the list of catchers',
    captador: {
      opcional: 'Optional',
      elegido: "Receives your projects' mail",
      noInstalado: 'Not installed',
      instalar: 'Install',
      usar: 'Use this one',
      apagar: 'Stop',
      iniciando: 'Starting…',
      avisoMantenimiento: 'This catcher is barely maintained. Prefer Mailpit or smtp4dev.',
    },
    notaDescartados:
      'MailHog and MailDev are not offered: MailHog publishes no checksum to verify the download and MailDev exists only on npm. Nothing is downloaded without a verifiable checksum.',
    notaHost:
      'The web inboxes only answer on 127.0.0.1, but while a catcher is running a malicious web page could try to read your inbox (DNS rebinding). smtp4dev and Papercut reject foreign Host headers; Mailpit serves its inbox under a secret path unique to this computer (WolfCore Dev opens that address for you); Inbucket has no protection at all: stop it when you are not using it.',
  },
  ia: {
    descripcion:
      'Cloud AI providers and local models with Ollama. Keys are stored encrypted on this computer and are never shown.',
    nube: {
      titulo: 'Cloud AI',
      agregar: 'Add provider',
      vacio:
        'You have not added any provider yet. Add OpenAI, Anthropic, Gemini, Hermes (Nous) or an OpenAI-compatible one.',
      errorLista: 'Could not read the provider list',
    },
    local: { titulo: 'Local AI (Ollama)' },
    pestanas: {
      etiqueta: 'AI sections',
      agentes: 'Agents',
      nube: 'Cloud',
      local: 'Local models',
    },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'OpenAI-compatible',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Key',
      sinClave: 'No key',
      claveIlegible: 'Saved (could not be read)',
      url: 'Base URL',
      modeloPorDefecto: 'Default model',
      ninguno: 'None',
      probarConexion: 'Test connection',
      probarConexionAyuda: 'Lists the provider models. Spends no tokens.',
      probando: 'Testing…',
      conectado: (ms: number, n: number) => `Connected · ${ms} ms · ${n} models`,
      verModelos: (n: number) => `Show the ${n} models`,
      soloGratuitos: 'Free only',
      fallo: 'Could not connect',
      probarMensaje: 'Test a message',
      probarMensajeAyuda:
        'Sends a short fixed message to check that the model answers. Spends a few tokens.',
      elegirModelo: 'Model for the message',
      sinModelo: 'Test the connection or set a default model to pick one.',
      enviando: 'Sending…',
      respuesta: (ms: number) => `Answer in ${ms} ms`,
      tokens: (entrada: number, salida: number) => `${entrada} input tokens, ${salida} output`,
      usar: 'Use in a project',
      editar: 'Edit',
      borrar: 'Delete',
      acciones: (nombre: string) => `${nombre} actions`,
    },
    costo: {
      titulo: 'Test a message',
      texto: (modelo: string, proveedor: string) =>
        `A short fixed message will be sent to the ${modelo} model of ${proveedor}. It spends tokens from your account: the answer is cut at 16 tokens and usually costs fractions of a cent.`,
      enviar: 'Send the message',
    },
    dialogo: {
      nuevo: 'Add AI provider',
      editar: (nombre: string) => `Edit ${nombre}`,
      tipo: 'Type',
      preset: 'Compatible provider',
      presetAyuda: 'Fills in the name and URL; you can change them.',
      presetOtro: 'Other',
      documentacion: 'View documentation',
      nombre: 'Name',
      urlBase: 'Base URL',
      urlAyuda:
        'Empty = the official one. Only https://, or http:// to 127.0.0.1 or [::1] (LM Studio).',
      urlObligatoria: 'Enter the base URL of the compatible provider.',
      modelo: 'Default model (optional)',
      modeloAyuda: 'Used in the .env block (AI_MODEL) and in the test message.',
      clave: 'API key',
      claveNueva: 'Paste the key',
      claveGuardada: (final: string) =>
        `A key is saved (${final}). Type another one only if you want to replace it.`,
      claveAyuda:
        'It is stored encrypted on this computer and never shown again. Only the last 4 characters are visible.',
      claveOpcional: 'Optional for local servers (LM Studio).',
      borrarClave: 'Delete the key',
      guardar: 'Save',
      guardado: (nombre: string) => `${nombre} saved`,
      urlCambiaTitulo: 'The key will go to another URL',
      urlCambiaTexto: (url: string) =>
        `This provider has a saved key. From now on it will be sent to ${url}. Confirm only if you trust that server.`,
      urlCambiaConfirmar: 'Send the key to the new URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Delete the ${nombre} key?`,
      claveTexto:
        'The key is deleted from this computer. The .env files where you wrote it are not touched: change it there too if you revoke it.',
      proveedorTitulo: (nombre: string) => `Delete ${nombre}?`,
      proveedorTexto:
        'The provider and its saved key are deleted. The .env files of your projects are not touched.',
      respaldos: (n: number) =>
        n === 1
          ? 'Also delete the .env copies of 1 project that hold this key in plain text'
          : `Also delete the .env copies of ${n} projects that hold this key in plain text`,
      respaldosAyuda:
        'WolfCore Dev keeps copies of the .env before writing it, outside the projects. Deleting them cannot be undone.',
      claveBorrada: 'Key deleted',
      proveedorBorrado: (nombre: string) => `${nombre} deleted`,
      respaldosBorrados: (n: number) => `The .env copies of ${n} project(s) were deleted`,
    },
    env: {
      titulo: (nombre: string) => `Use ${nombre} in a project`,
      proyecto: 'Project',
      sinProyectos: 'There are no mounted projects.',
      modelo: 'Model (AI_MODEL)',
      modeloAyuda: 'Optional. Pick one from the list or type it.',
      vista: 'Block that will be written to .env (the key is shown masked)',
      cargando: 'Preparing the preview…',
      textoPlano:
        'The key will be stored in plain text in the project .env. Anyone with access to that folder will be able to read it.',
      copiaPrevia:
        'The current .env is copied first, outside the project (in the WolfCore Dev data folder).',
      sinClave: 'This provider needs a key: save it before using it in a project.',
      gitignoreFalta: 'The project .gitignore does not ignore .env.',
      gitignoreNoExiste: 'The project has no .gitignore.',
      gitignoreOk: '.gitignore already ignores .env.',
      agregarGitignore: 'Add .env to .gitignore',
      gitignoreTitulo: 'Change .gitignore',
      gitignoreTexto:
        'The line .env will be added to the project .gitignore (or the file will be created), with a previous copy.',
      gitignoreConfirmar: 'Add to .gitignore',
      versionadoTitulo: 'Git already tracks the .env of this project',
      versionadoTexto:
        'Even if it is in .gitignore, the next commit would upload the key. Before writing it, remove it from the index and commit:',
      desconocidoTitulo: 'Could not check whether git tracks the .env',
      desconocidoTexto:
        'Git did not answer (it is not installed or the folder is not trusted). If the .env is already in the repository, the next commit would upload the key. Check it with:',
      aceptarVersionado: 'I understand the risk: write the key anyway',
      aceptarTitulo: 'Write even though git may upload the key',
      aceptarTexto:
        'If the .env is in the repository, the key will end up in the next commit and in the history. Do it only if you already ran git rm --cached .env or the repository is only yours.',
      aceptarConfirmar: 'I accept the risk',
      conflictoTitulo: 'The .env already defines these variables with another value',
      reemplazar: (claves: string) => `Replace ${claves}`,
      reemplazarTitulo: 'Replace .env variables',
      reemplazarTexto: (claves: string) =>
        `The ${claves} lines the .env already had will be removed and the WolfCore Dev block ones will stay. The previous .env is copied first.`,
      reemplazarConfirmar: 'Replace',
      escribir: 'Write to .env',
      confirmarTitulo: 'Write the key in plain text',
      confirmarTexto: (carpeta: string) =>
        `The key will be written unencrypted in ${carpeta}. Do not share that file or upload it to a repository.`,
      confirmar: 'Write the key',
      escrito: (proyecto: string) => `AI block written to the .env of ${proyecto}`,
      copiarComando: 'Copy command',
    },
  },
  iaLocal: {
    descripcion:
      'Language models that run on your computer with Ollama. Use them from your projects without sending data to the internet.',
    sinInstalarTitulo: 'Ollama is not installed',
    sinInstalar: 'Install it from Services to download and use models on your computer.',
    irAServicios: 'Go to Services',
    apagadoTitulo: 'Ollama is stopped',
    apagado: 'Start it to view, download and try models.',
    iniciando: 'Ollama is starting…',
    errorTitulo: 'Ollama failed to start',
    encender: 'Start Ollama',
    verServicios: 'View in Services',
    modelos: 'Installed models',
    sinModelos: 'No models yet. Download one below.',
    errorModelos: 'Could not read the model list',
    recargar: 'Reload the list',
    total: (n: number) => plural(n, 'model', 'models'),
    espacio: 'Space used',
    espacioAyuda: 'Space taken by all models in the data folder.',
    probarDe: (modelo: string) => `Try ${modelo}`,
    borrarDe: (modelo: string) => `Delete ${modelo}`,
    borrarTitulo: (modelo: string) => `Delete the model ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `This frees ${tamano} of disk space. To use it again you will need to download it again.`,
    borrado: (modelo: string) => `Model ${modelo} deleted`,
    compat: {
      sugerenciaVram:
        'For your computer: models up to ≈{b}B, which fit in the graphics card memory.',
      sugerenciaRam: 'For your computer: models up to ≈{b}B, which run in RAM.',
      sugerenciaPequena: 'For your computer: only very small models (under 1B).',
      sugerenciaDesconocida:
        "Your computer's hardware could not be read, so there is no recommendation.",
      aviso: 'This is only guidance: you can download any model.',
      comprobando: 'Checking your computer…',
      niveles: {
        recomendado: 'Recommended',
        lento: 'May be slow',
        'no-cabe': 'Does not fit',
        desconocido: 'No data',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Fits comfortably in the graphics card memory (needs ≈{necesario} of {disponible}).',
        'justo-vram':
          'Fits in the graphics card, but only just (needs ≈{necesario} of {disponible}).',
        'solo-ram':
          'Does not fit in the graphics card and will run in RAM (needs ≈{necesario} of {disponible} usable): slower.',
        'cabe-ram': 'Fits comfortably in RAM (needs ≈{necesario} of {disponible} usable).',
        'ram-justo':
          'Fits in RAM, but only just (needs ≈{necesario} of {disponible} usable): may be slow.',
        'sin-memoria': 'Needs ≈{necesario} of memory and your computer has ≈{disponible}.',
        'sin-disco': 'There is not enough free disk space to download it ({disponible} left).',
        'tamano-desconocido':
          'The model size could not be checked (no connection to the Ollama registry).',
        'equipo-desconocido': "Your computer's memory could not be read.",
      } as Record<string, string>,
    },
    descargar: {
      titulo: 'Download a model',
      campo: 'Model name',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Type the name Ollama uses (ollama.com/library) or choose a suggestion.',
      sugerenciaAyuda: {
        'llama3.2': 'General chat, lightweight',
        'qwen2.5-coder': 'Coding',
        mistral: 'General chat',
        'nomic-embed-text': 'Embeddings for search (bots)',
      } as Record<string, string>,
      boton: 'Download',
      invalido: 'Use letters, numbers and . _ : / - (for example llama3.2)',
      yaInstalado: 'That model is already installed',
      enCurso: 'That model is already downloading',
      confirmarTitulo: (modelo: string) => `Download ${modelo}?`,
      confirmarTexto:
        'You can cancel the download at any time; what was already downloaded is discarded.',
      tamano: (t: string) => `Download size: ${t}.`,
      tamanoDesconocido:
        'The size could not be checked (no connection to the Ollama registry). Models usually take 1 to over 40 GB.',
      libre: (l: string) => `Free space on the models disk: ${l}.`,
      libreDesconocido: 'The free disk space could not be measured.',
      sinEspacio: (t: string, l: string) =>
        `Not enough space: the model takes ${t} and only ${l} is free. Free some space or choose a smaller model.`,
      confirmar: 'Download',
    },
    progreso: {
      fases: {
        preparando: 'Preparing…',
        descargando: 'Downloading',
        verificando: 'Verifying',
        guardando: 'Saving',
        listo: 'Done',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} of ${total}`,
      cancelarDe: (modelo: string) => `Cancel the ${modelo} download`,
      cancelando: 'Canceling…',
      listo: (modelo: string) => `${modelo} downloaded`,
      cancelado: (modelo: string) => `${modelo} download canceled`,
      error: (modelo: string) => `Could not download ${modelo}`,
      descartar: 'Dismiss',
      descartarDe: (modelo: string) => `Dismiss the ${modelo} notice`,
    },
    prueba: {
      titulo: 'Try a model',
      modelo: 'Model',
      elegir: 'Choose a model',
      prompt: 'Message',
      placeholder: 'Type a short question and press Enter',
      enviar: 'Send',
      respuesta: 'Response',
      pensando: 'The model is responding… the first time can take a while as it loads.',
      vacia: '(The model returned no text.)',
      sinModelos: 'Download a model to try it.',
    },
    conexion: {
      titulo: 'Connecting from your projects',
      base: 'Ollama base URL',
      openai: 'OpenAI-compatible endpoint',
      env: 'Block for the .env file',
      envAyuda:
        'Works for Laravel or for a FastAPI bot. WolfCore Dev does not write to your projects.',
      copiarEnv: 'Copy block',
      copiarDato: (dato: string) => `Copy ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code and Codex will be able to connect to these models with one click in Stage B.',
  },
  proyectos: {
    titulo: 'Projects',
    descripcion:
      'Each project is a folder with its .test site, its install recipe and its processes.',
    agregar: 'Add project',
    vacioTitulo: 'No projects yet',
    vacio:
      'Clone a GitHub repository or choose a folder: WolfCore Dev detects the project type and sets it up step by step.',
    pasos: {
      porTipo: {
        'composer-install': 'Install PHP dependencies (composer install)',
        'env-crear': 'Create the .env file',
        'key-generate': 'Generate the application key',
        'bd-crear': 'Create the database',
        'bd-restaurar': 'Restore a backup',
        migrar: 'Migrate the database',
        'storage-link': 'Link storage (storage:link)',
        'npm-ci': 'Install Node dependencies (npm ci)',
        'npm-build': 'Build assets (npm run build)',
        'python-venv': 'Create the virtual environment (.venv)',
        'pip-install': 'Install Python dependencies (pip)',
        'pgvector-activar': 'Enable pgvector on the database',
        'sitio-crear': 'Create the site',
        comando: 'Project command',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Create the site ${dominio}` : 'Create the site'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Restore the backup ${archivo}` : 'Restore a backup',
      migrar: 'Migrate the database',
      migrarSemilla: 'Migrate the database and load test data (--seed)',
      comando: (linea: string) => (linea ? `Run: ${linea}` : 'Project command'),
    },
    estadoPaso: {
      pendiente: 'Pending',
      corriendo: 'Running',
      listo: 'Done',
      error: 'Error',
      omitido: 'Skipped',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Not set up',
      corriendo: 'Setting up…',
      lista: 'Set up',
      error: 'A step failed',
      cancelada: 'Setup canceled',
      incompleta: 'Setup incomplete',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Add project',
      pestanas: { github: 'GitHub', url: 'Git URL', carpeta: 'Folder' },
      destino: 'Destination folder',
      destinoAyuda: (base: string) =>
        `It is cloned into ${base}. For another location, use "Choose folder…".`,
      nombreCarpeta: 'Folder name',
      nombrePlaceholder: 'my-project',
      elegirDestino: 'Choose folder…',
      destinoPorDefecto: 'Use the projects folder',
      clonar: 'Clone',
      clonando: 'Cloning…',
      clonado: 'Repository cloned',
      errorClonar: 'Could not clone the repository',
      sinCancelar:
        'The clone cannot be interrupted from here: wait for it to finish (it may take several minutes).',
      sinGit: 'Git is not installed. Install it (git-scm.com) and reopen this dialog.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Connected with GitHub CLI as ${usuario}` : 'Connected with GitHub CLI',
      estadoToken: 'Connected with a personal token',
      estadoNinguna: 'Not connected to GitHub',
      ayudaNinguna:
        'Sign in with GitHub CLI (recommended) or use a fine-grained personal token with read access to contents.',
      instalarGh: 'Install GitHub CLI',
      instalandoGh: 'Installing GitHub CLI…',
      ghInstalado: 'GitHub CLI installed. Now sign in.',
      iniciarSesion: 'Sign in',
      sesionAbierta: 'A sign-in window was opened. When you are done, press "Check again".',
      comprobar: 'Check again',
      usarToken: 'Use a token',
      token: 'GitHub personal token',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'It is stored encrypted on this computer and is never shown again or written to projects.',
      guardarToken: 'Save token',
      tokenGuardado: 'Token saved',
      quitarToken: 'Remove token',
      tokenQuitado: 'Token removed',
      buscar: 'Search repositories',
      cargando: 'Loading repositories…',
      sinRepos: 'No repositories found.',
      cargarMas: 'Load more',
      privado: 'Private',
      yaClonado: 'Already cloned',
      yaClonadoAyuda: 'A project already uses this repository or its destination folder.',
      actualizado: (fecha: string) => `Updated ${fecha}`,
      elegir: 'Choose',
      errorRepos: 'Could not read the repository list',
    },
    url: {
      etiqueta: 'Repository URL',
      placeholder: 'https://github.com/user/project.git',
      ayuda: 'https://…, git@host:path or user/project (GitHub). No user or password in the URL.',
      invalida: 'Use https://…, git@host:path or user/project',
    },
    carpeta: {
      titulo: 'Project already on this computer',
      texto: 'Choose the folder: the project type is detected and its recipe is suggested.',
      elegir: 'Choose folder',
      manual: 'Add without a recipe (manual setup)',
      yaEsProyecto: (nombre: string) => `That folder is already the project ${nombre}.`,
      vigilarTitulo: 'Watched folder',
      vigilarTexto:
        'WolfCore Dev lets you know when a new folder that looks like a project appears. It is also where repositories are cloned.',
      vigilando: (carpeta: string) => `Watching ${carpeta}`,
      sinVigilar: 'No folder is being watched.',
      vigilar: 'Choose folder to watch',
      cambiarVigilada: 'Change',
      dejarDeVigilar: 'Stop watching',
    },
    asistente: {
      titulo: (nombre: string) => `Set up ${nombre}`,
      cargando: 'Analyzing the project…',
      origenYml: "The recipe comes from the repository's wolfcore.yml.",
      origenDefecto: 'Recipe suggested for the project type.',
      deteccion: 'What was detected',
      deteccionAyuda: 'Correct it if anything does not match the project.',
      tipo: 'Type',
      php: 'PHP',
      phpNinguno: 'None installed',
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
      versionAuto: 'Whichever is detected',
      servicios: 'Services',
      serviciosNinguno: 'None',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Detected: ${v}`,
      nodeInstalar: 'Node is not installed: install it in Services.',
      pythonInstalar: 'Python is not installed: install it in Services.',
      lenguajeInstalar: (nombre: string) => `${nombre} is not installed: install it in Services.`,
      dominio: 'Domain',
      puertoProxy: 'Local port',
      puertoPlaceholder: '8000',
      receta: 'Steps',
      recetaAyuda:
        'They run in order. Turn off the ones you do not want; optional ones can be moved.',
      subir: 'Move up',
      bajar: 'Move down',
      fijo: 'This step is required',
      restaurar: 'Restore a backup…',
      cambiarRespaldo: 'Change backup',
      quitarRespaldo: 'Remove backup',
      sobrescribir: 'Overwrite the database if it already has tables',
      semilla: 'Load test data (--seed)',
      sinMotor: 'No database: choose an engine in Services to create one or restore a backup.',
      confio: 'I trust this repository: run its install steps',
      confioAyuda:
        "The steps run the project's programs (composer, npm, pip, migrations) on your computer. Only check this if you know the code.",
      montar: 'Set up project',
      montando: 'Setting up project…',
      reintentar: 'Retry',
      omitir: 'Skip',
      cancelar: 'Cancel',
      cancelando: 'Canceling…',
      cerrar: 'Close',
      cerrarCorriendo: 'Hide (keeps running in the background)',
      abrirSitio: 'Open site',
      verRegistro: 'View log',
      ocultarRegistro: 'Hide log',
      listo: 'The project is ready.',
      fallo: (paso: string) => `Failed: ${paso}. Retry, skip it or cancel; nothing was undone.`,
      cancelada: "Setup was canceled. You can resume it from the project's card.",
      incompleta: 'Some steps have not run yet.',
      errorCrear: 'Could not create the project',
      errorReceta: 'Could not read the recipe',
      recetaCambio:
        "The project's recipe (wolfcore.yml) changed since you trusted it. Retry uses the recipe saved last time.",
      recargar: 'Review the new recipe',
      seguirGuardada: 'Continue with the saved one',
      soloLectura:
        "The type, PHP, domain, versions and port are the project's: change them with Edit.",
    },
    tarjeta: {
      receta: 'Setup',
      reinstalar: 'Reinstall dependencies',
      reinstalarTitulo: (nombre: string) => `Run the ${nombre} recipe?`,
      reinstalarTexto:
        'The steps of the last setup are repeated (the ones you reviewed in the wizard):',
      noRestaura: 'not restored again',
      recetaCambio:
        'The project\'s recipe (wolfcore.yml) changed since you trusted it. Reinstall repeats the saved one; use "Review recipe" to review the new one.',
      revisarReceta: 'Review recipe',
      preparar: 'Set up…',
      ejecutar: 'Run',
      verPreparacion: 'View setup',
      sinConfianza:
        'Review the recipe and check "I trust this repository" in the wizard to be able to run it.',
      runtimes: 'Version warnings',
      verRegistros: 'View logs',
      verEnBases: 'View in Databases',
      abrirAgente: 'Open an AI agent',
      vscode: 'Editor',
      vscodeAyuda: 'Open the project folder in the default editor',
      vscodeError: 'Could not open the editor',
      baseDatos: 'Database',
      baseDatosAyuda: (base: string) =>
        `Open the "${base}" database already signed in (Adminer or phpMyAdmin)`,
      baseDatosSinDetectar: "Open the project's database (Adminer or phpMyAdmin)",
      sinBase: "The project's .env does not declare a MySQL, MariaDB or PostgreSQL database.",
      adminerNoListo: 'Adminer is not ready',
      entradaAutomatica: 'Opens already signed in, without typing the password.',
      elegirBd: 'Choose Adminer or phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (MySQL and MariaDB only)',
      phpMyAdminNoListo: 'phpMyAdmin is not ready',
      entroComoAdmin: (usuario: string) =>
        `Signed in as ${usuario}, the server administrator, because this project does not use its own user. In the .env manager, “Use own user” creates one limited to its database.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Signed in as ${usuario}, the server administrator: the password of this project's own user is not stored on this computer. In the .env manager, “Use own user” generates a new one.`,
      abrirSitio: 'Open the site in the browser',
      github: 'Repository',
      abrirRemoto: (url: string) => `Open ${url}`,
      confiado: 'Trusted',
      confiadoAyuda: 'Its install steps can be run.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Detached HEAD',
      cambios: (n: number) => plural(n, 'uncommitted change', 'uncommitted changes'),
      limpio: 'No changes',
      atras: (n: number) => `${n} to pull`,
      adelante: (n: number) => `${n} to push`,
      traer: 'Pull changes',
      traerAyuda:
        'git pull without merging: if there are local changes or diverged branches, nothing is touched.',
      alDia: 'Already up to date.',
      actualizado: 'Changes pulled',
      sugeridosTitulo: 'Changes pulled',
      sugeridosTexto: 'Based on what changed, it is a good idea to run these steps:',
      sugeridosNinguno: 'No steps need to run.',
      migracionesNuevas: (n: number) => plural(n, 'new migration', 'new migrations'),
      ejecutarSugeridos: 'Run steps',
      corridaTitulo: 'Steps after pulling changes',
      corridaAyuda: "Does not change the project's saved recipe.",
      ahoraNo: 'Not now',
      errorEstado: 'Could not read the Git status',
      commitIa: {
        boton: 'Suggest commit',
        ayuda:
          'Uses AI to propose a message for what is staged (git add) and commits if you accept it.',
        titulo: 'Commit with a suggested message',
        proveedor: 'AI provider',
        modelo: 'Model',
        sinProveedores: 'Set up a cloud AI provider (AI screen) to suggest messages.',
        privacidad:
          'The staged diff is sent to the provider, without .env, keys, certificates, credential files or binaries, and up to 20,000 characters. It uses few tokens.',
        sugerir: 'Suggest message',
        mensaje: 'Message (you can edit it)',
        commit: 'Commit',
        commitAyuda: 'Only what is staged (git add): it does not add files or push.',
        hecho: 'Committed what was staged.',
      },
    },
    procesos: {
      titulo: 'Processes',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Finished without errors',
      ninguno: 'No processes. Add npm run dev, queue:work, uvicorn…',
      agregar: 'Add process',
      editar: 'Edit process',
      nuevo: 'New process',
      interruptor: (nombre: string) => `Start or stop ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx sends the site to this process.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'restart', 'restarts'),
      verLog: 'View log',
      ocultarLog: 'Hide log',
      logVacio: 'No output yet.',
      abrirCarpetaLog: 'Open log folder',
      quitar: 'Remove process',
      quitarTitulo: (nombre: string) => `Remove the process ${nombre}?`,
      quitarTexto: 'If it is running, it is stopped.',
      nombre: 'Name',
      nombrePlaceholder: 'Vite',
      comando: 'Command',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Program and arguments, no shell. Use quotes for arguments with spaces.',
      cwd: 'Folder',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz or a project subfolder (for example, frontend).',
      puertoCampo: 'Port',
      puertoNinguno: 'None',
      puertoAyuda: 'Informational only, unless the process is the proxy target.',
      autoIniciar: 'Start when WolfCore Dev starts',
      reiniciar: 'Restart if it crashes',
      esProxy: 'Nginx proxy target',
      requiereReinicio:
        'The process is running: command, folder or port changes apply when it restarts.',
      reinicieAhora: 'Saved. Stop and start the process to apply the changes.',
      guardado: 'Process saved',
      errores: {
        comando: 'Enter the command',
        puerto: 'The port must be between 1 and 65535',
        proxySinPuerto: 'The proxy target needs a port',
        cwd: 'Use raiz or a subfolder inside the project',
        repetido: 'A process with that name already exists',
      },
      estados: {
        encendido: 'Running',
        apagado: 'Stopped',
        iniciando: 'Starting…',
        error: 'Error',
        externo: 'External',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `${nombre} logs`,
      fuente: 'Source',
      ninguna: 'This project has no logs yet.',
      vacio: 'The log is empty.',
      actualizar: 'Refresh',
      abrirCarpeta: 'Open folder',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'There is a new folder that looks like a project'
          : `There are ${n} new folders that look like projects`,
      montar: 'Set up',
      ignorar: 'Ignore',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Unread emails',
    correoApagado: 'Mailpit stopped',
    correoSinInstalar: 'Mailpit not installed',
    modelos: 'AI models',
    iaApagada: 'Ollama stopped',
    iaSinInstalar: 'Ollama not installed',
    sinLeer: 'Could not read',
    sinDato: '—',
  },
  /* ───────────── Performance panel, log viewer and MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'd',
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Performance',
    ventana: 'Last 5 minutes',
    pausado: 'Paused while the window is hidden',
    esperando: 'Waiting for the first sample…',
    errorMuestreo: (detalle: string) => `Could not request performance sampling: ${detalle}`,
    cpu: 'CPU',
    ram: 'Memory',
    disco: 'Data disk',
    red: 'Network',
    deTotal: (usado: string, total: string) => `${usado} of ${total}`,
    libre: (libre: string) => `${libre} free`,
    bajada: 'Download',
    subida: 'Upload',
    graficaCpu: (valor: string) => `CPU chart for the last 5 minutes; now ${valor}`,
    graficaRam: (valor: string) => `Memory chart for the last 5 minutes; now ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Network chart for the last 5 minutes; download ${bajada}, upload ${subida}`,
    insignias: { memoriaAlta: 'High memory' },
    discos: {
      titulo: 'Disk space',
      leyendo: 'Reading the disks…',
      sistema: 'System',
      datos: 'WolfCore data',
      ambos: 'System and WolfCore data',
      libre: (unidad: string, libre: string, pct: number) => `${unidad} · ${libre} free (${pct} %)`,
      poco: 'Low free space',
      casiLleno: 'Almost out of space',
      liberar: 'Free up space',
      versiones: 'Clean up unused versions',
      temporales: 'Clean up WolfCore temporary files and caches',
      ocupaMas: 'See what takes the most space',
    },
    alertas: {
      titulo: 'Alerts',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `${servicio} port ${puerto} is used by another program: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `System memory is at ${porcentaje} %. Stop what you are not using so everything responds better.`,
      huerfano: (pid: number, puertos: number[]) =>
        `A php-cgi that does not belong to WolfCore Dev (PID ${pid}) is listening on ${puertos.join(', ')}: it is left over from a previous session.`,
      grupo: (n: number) => `Problems found (${n})`,
      verTodos: (n: number) => `Show all ${n}`,
      verMenos: 'Show less',
      masAcciones: 'More actions',
      finalizar: 'End process',
      finalizarTitulo: 'End this process?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) will be closed without saving anything it has open. Only use this if you know that program is not needed.`,
      finalizado: (nombre: string) => `${nombre} ended`,
      verPuertos: 'View ports',
      errorPuertos: 'Could not check which programs are using the ports.',
    },
    procesos: {
      titulo: 'Services and processes',
      vacio: 'No services or project processes are running.',
      nombre: 'Name',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Port',
      encendido: 'Running',
      acciones: 'Actions',
      resto: 'Other services',
      detener: 'Stop',
      registros: 'View logs',
      servicio: 'Service',
      proyecto: 'Project',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Logs',
    descripcion: 'Follow the Nginx, PHP, service, site, project process and tunnel logs live.',
    fuente: 'Source',
    elegirFuente: 'Choose a log',
    sinFuentes: 'No logs yet. They appear when a service, site or process writes the first one.',
    buscar: 'Filter by text',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pause',
    reanudar: 'Resume',
    pausadoNuevas: (n: number) => (n === 1 ? '1 new line paused' : `${n} new lines paused`),
    copiar: 'Copy visible',
    copiadas: (n: number) => (n === 1 ? '1 line copied' : `${n} lines copied`),
    limpiar: 'Clear',
    abrirCarpeta: 'Open folder',
    alFinal: 'Follow the end',
    mostrarMas: 'Show more',
    ocultas: (n: number) => (n === 1 ? '1 earlier line not shown' : `${n} earlier lines not shown`),
    vacio: 'No lines yet. New ones appear here as soon as they are written.',
    sinCoincidencias: 'No line matches the filter.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} lines` : `${visibles} of ${total} lines`,
    descartadas: (n: number) => `(the last 5000 are kept; ${n} older ones discarded)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Services',
      sitio: 'Sites',
      laravel: 'Laravel',
      proyecto: 'Project processes',
      tunel: 'Tunnels',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (access)',
      nginxError: 'Nginx (errors)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (access)`,
      sitioError: (dominio: string) => `${dominio} (errors)`,
      tunel: (sitio: string) => `${sitio} tunnel`,
      tunelSalida: (sitio: string) => `${sitio} tunnel (output)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Open a new terminal to see the change: terminals that are already open do not see it.',
    enPathSinCliente: 'In the PATH, but the command is missing',
    reparar: 'Repair',
    repararTitulo: 'Repair the wolf command?',
    repararTexto:
      'wolf is in the PATH but its files are incomplete. They will be copied again to the data folder and the local server will start, as when adding it.',
    titulo: 'Terminal: wolf command',
    descripcion:
      'Manage WolfCore Dev from PowerShell, cmd or Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. It only works while the app is open.',
    activo: 'Available in the PATH',
    enPathSinServidor: 'In the PATH, server off',
    inactivo: 'Not in the PATH',
    agregarBoton: 'Add wolf to the PATH',
    quitarBoton: 'Remove wolf from the PATH',
    agregarTitulo: 'Add wolf to the user PATH?',
    agregarTexto:
      'The wolf command will be copied to the WolfCore Dev data folder, that folder will be added to your user PATH (a copy of the original PATH is kept) and a local server will start on 127.0.0.1 that only answers wolf, with a key that changes on every start. Publishing a site on the internet or changing the PHP of all terminals is always confirmed in the app window as well. You can remove it at any time.',
    agregar: 'Add',
    quitarTitulo: 'Remove wolf from the PATH?',
    quitarTexto:
      'The wolf folder will be removed from your user PATH, the local server will stop and the copied command will be deleted. Terminals that are already open do not change.',
    quitar: 'Remove',
    listoTitulo: 'wolf command updated',
    ayuda: 'Open a new terminal after adding it. The server only listens on 127.0.0.1.',
    aislado: 'With a test data folder (WOLFCORE_DATOS) the PATH is not touched.',
    errorCargar: (detalle: string) => `Could not read the wolf status: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP server',
    descripcion:
      'Lets Claude Code and other assistants manage your sites, services and databases from this computer. It only listens on 127.0.0.1 and requires a token.',
    estado: 'Status',
    activo: 'Active',
    inactivo: 'Stopped',
    activar: 'Enable',
    detener: 'Stop',
    activado: 'MCP server active',
    detenido: 'MCP server stopped',
    direccion: 'Address',
    puerto: 'Port',
    puertoAyuda: 'Between 1024 and 65535. If it is active, it restarts on the new port.',
    puertoRango: 'Use a number between 1024 and 65535',
    puertoGuardado: (p: number) => `The MCP server will use port ${p}`,
    copiarConfig: 'Copy configuration for Claude Code',
    copiarConfigAyuda:
      'Copies the configuration with the token to the clipboard. Paste it into Claude Code; the token is not shown here.',
    configCopiada: 'Configuration copied to clipboard',
    regenerar: 'Regenerate token',
    regenerarTitulo: 'Regenerate the MCP server token?',
    regenerarTexto:
      'The current token stops working immediately: connected assistants will need to use the new configuration.',
    regenerado: 'Token regenerated. Copy the configuration again.',
    errorCargar: (detalle: string) => `Could not read the MCP server status: ${detalle}`,
    confirmacion: {
      titulo: 'An assistant is asking for confirmation',
      herramienta: 'Tool',
      pendientes: (actual: number, total: number) => `${actual} of ${total}`,
      aprobar: 'Approve',
      rechazar: 'Reject',
      aprobada: 'Action approved',
      rechazada: 'Action rejected',
      vencida: 'The request was no longer pending.',
      descartadas: (n: number) =>
        n === 1
          ? 'and 1 more that did not fit (it will expire on its own)'
          : `and ${n} more that did not fit (they will expire on their own)`,
      falloRespuesta: (detalle: string) =>
        `Could not send the response; the request is still pending. ${detalle}`,
      si: 'Yes',
      no: 'No',
      campos: {
        motor: 'Engine',
        base: 'Database',
        archivo: 'File',
        sobrescribir: 'Overwrite',
        pid: 'PID',
        nombre: 'Process',
        proyecto: 'Project',
        pasos: 'Steps',
        cantidad: 'Dumps',
      } as Record<string, string>,
    },
  },
  captura: {
    barra: 'Drawing tools',
    herramientas: {
      recuadro: 'Box',
      flecha: 'Arrow',
      linea: 'Line',
      resaltador: 'Highlighter',
      texto: 'Text',
      pixelar: 'Pixelate',
      pixelarAyuda: 'Pixelate (not safe for sensitive data: use Hide)',
      ocultar: 'Hide',
      ocultarAyuda: 'Hide with a solid fill (recommended for sensitive data)',
    },
    deshacer: 'Undo',
    rehacer: 'Redo',
    copiar: 'Copy',
    copiarAyuda:
      'Copy to the clipboard. The Windows clipboard may keep it in its history or sync it to other devices.',
    guardar: 'Save…',
    alConversor: 'Send to the image converter',
    cerrar: 'Cancel (Esc)',
    nuevaSeleccion: 'New selection',
    color: 'Color',
    grosor: 'Thickness',
    formato: 'Format',
    cargando: 'Preparing the capture…',
    guiaRegion: 'Drag to choose the area. Esc cancels.',
    guiaVentana: 'Choose the window you want to capture. Esc cancels.',
    sinVentanas: 'There are no windows that can be captured.',
    textoPlaceholder: 'Type and press Enter',
    copiada: 'Copied to the clipboard',
    guardada: (archivo: string) => `Saved to ${archivo}`,
    errorCargar: 'The capture could not be opened.',
    errorCopiar: 'The image could not be copied.',
    errorGuardar: 'The image could not be saved.',
    errorConversor: 'The image could not be sent to the converter.',
    errorVentana: 'That window could not be captured.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Everything happens on this computer: the capture is not uploaded to any service and is not saved to disk until you save it. WolfCore Dev windows hide for a moment so they do not appear in the image.',
      region: 'Region',
      regionAyuda: 'Drag over the screen to choose the area.',
      ventana: 'Window',
      ventanaAyuda: 'Pick one of the open windows.',
      pantalla: 'Full screen',
      pantallaAyuda: 'The screen where the cursor is.',
      atajoActivo: (atajo: string) => `Global shortcut active: ${atajo} (region).`,
      atajoInactivo: 'There is no global shortcut. Turn it on in Settings.',
      noDisponible: 'Screen capture is not available on this computer.',
      permisoDenegado:
        'The screen recording permission is missing. Turn it on for WolfCore Dev in the system settings.',
      ocupada: 'A capture is already in progress.',
    },
    ajustes: {
      titulo: 'Screen capture',
      descripcion:
        'Region, window or full screen with a quick editor. It is 100% local: nothing is uploaded or saved until you decide.',
      activar: 'Global shortcut',
      activarAyuda:
        'Off by default. When turned on it is registered only if no other program uses it, and it is released when WolfCore Dev closes.',
      atajo: 'Combination',
      grabar: 'Change',
      grabando: 'Press the combination…',
      grabandoAyuda:
        'Use Ctrl or Super with another modifier (for example Ctrl+Alt+Shift) and a letter, a number or an F key. Avoid common shortcuts such as Ctrl+C.',
      formato: 'Format when saving',
      activado: (atajo: string) => `Shortcut ${atajo} turned on.`,
      desactivado: 'Shortcut turned off.',
      ocupado: (atajo: string) =>
        `The shortcut ${atajo} is already used by another program and nothing was changed. Try another combination.`,
      ocupadoInicio:
        'The saved shortcut is already used by another program and was not registered. Choose another combination.',
      sinPermiso:
        'On macOS the screen recording permission is required; you will be asked the first time you capture.',
      formatoGuardado: 'Format saved.',
    },
  },

  herramientas: {
    descripcion: 'Everyday utilities. They work offline and without external services.',
    buscar: 'Search tools…',
    sinResultados: 'No tool matches the search.',
    abrir: 'Open',
    procesar: 'Processing…',
    copiar: 'Copy',
    copiado: 'Copied to clipboard',
    limpiar: 'Clear',
    pendienteApi: 'Pending: the core does not expose this information to the UI yet.',
    chmod: {
      permisos: 'Permissions',
      propietario: 'Owner',
      grupo: 'Group',
      otros: 'Others',
      leer: 'Read (r)',
      escribir: 'Write (w)',
      ejecutar: 'Execute (x)',
      especiales: 'Special bits',
      setuid: "setuid: runs with the owner's permissions",
      setgid: "setgid: runs with the group's permissions",
      sticky: 'sticky: only the owner can delete inside the folder',
      habituales: 'Common values',
      octal: 'Octal',
      simbolico: 'Symbolic',
      octalInvalido: 'Enter 3 or 4 digits from 0 to 7 (for example 755).',
      simbolicoInvalido: 'Enter 9 characters such as rwxr-xr-x.',
      ejemplo: 'Example',
      archivo: 'File name',
      nota: 'Windows does not use this; it is for Linux and macOS servers.',
      avisoOtros: 'Any user on the server could modify it: avoid giving write access to "others".',
    },
    lista: {
      chmod: {
        nombre: 'chmod permissions',
        descripcion: 'Checkboxes, octal and symbolic, for Linux and macOS servers.',
      },
      qr: { nombre: 'QR generator', descripcion: 'From text or a tunnel link; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Format, validate and minify, with a tree view.' },
      regex: {
        nombre: 'Regular expressions',
        descripcion: 'Tester with matches, groups and a reference.',
      },
      diff: {
        nombre: 'Compare text',
        descripcion: 'Side-by-side differences, including files.',
      },
      tiempo: { nombre: 'Time', descripcion: 'Timestamp ↔ date, with time zone.' },
      puertos: {
        nombre: 'Ports and processes',
        descripcion: 'What is listening on each port, and end the process.',
      },
      bom: { nombre: 'UTF-8 BOM cleanup', descripcion: 'Removes the BOM from files or folders.' },
      certificados: {
        nombre: 'Certificates',
        descripcion: 'Issue with the WolfCore Dev CA for any name.',
      },
      cripto: {
        nombre: 'Crypto',
        descripcion: 'Hash, base64, URL, UUID, passwords and JWT.',
      },
      markdown: { nombre: 'Markdown preview', descripcion: 'Write and see the result.' },
      entorno: { nombre: 'System environment', descripcion: 'PATH, versions and variables.' },
      buscar: {
        nombre: 'Search',
        descripcion: 'Text in names and contents of a project, folder or file.',
      },
      infoArchivo: {
        nombre: 'File info',
        descripcion: 'Size, type and hashes of a file.',
      },
      clienteHttp: {
        nombre: 'HTTP client',
        descripcion: 'Try APIs: requests, environments, collections and history.',
      },
      websocket: { nombre: 'WebSocket client', descripcion: 'Connect, send and view messages.' },
      contrasenas: {
        nombre: 'Passwords',
        descripcion: 'Measure a password and review weak accounts in your databases.',
      },
      qrWifi: {
        nombre: 'Wi-Fi QR',
        descripcion: 'QR code so others can join your network.',
      },
      imagenes: {
        nombre: 'Images',
        descripcion: 'Convert to ICO or PNG and compress JPEG or WebP.',
      },
      comprimir: {
        nombre: 'ZIP and PDF',
        descripcion: 'Compress files and folders to ZIP and optimize PDFs.',
      },
      conversor: {
        nombre: 'Document converter',
        descripcion: 'Convert Word, Excel, PDF, CSV and Markdown without leaving this computer.',
      },
      captura: {
        nombre: 'Screen capture',
        descripcion: 'Region, window or full screen, with a quick editor.',
      },
      guiaTuneles: {
        nombre: 'Tunnels guide',
        descripcion: 'Cloudflare and ngrok step by step, with commands to copy.',
      },
      guiaHttp: {
        nombre: 'HTTP guide',
        descripcion: 'Status codes and methods, with search and examples.',
      },
      guiaGit: {
        nombre: 'Git and GitHub guide',
        descripcion: 'Commands and workflows, with a lab to practise safely.',
      },
      limpiezaDisco: {
        nombre: 'Disk cleanup',
        descripcion:
          'Analyze and delete temp files and regenerable caches, with a preview and confirmation.',
      },
      editor: {
        nombre: 'Code editor',
        descripcion: 'Edit text files with highlighting, a backup copy and confirmed saving.',
      },
      compartir: {
        nombre: 'Share folder or file',
        descripcion: 'Publish a folder or a file on the internet with a temporary, read-only link.',
      },
      usoDisco: {
        nombre: 'Disk usage',
        descripcion:
          'What takes up space on a drive or folder: tree, largest files and folders, by extension.',
      },
      diffCarpetas: {
        nombre: 'Folder diff',
        descripcion:
          'Compares two folders: only in one, only in the other and different, with each file’s diff.',
      },
      grabarPantalla: {
        nombre: 'Record screen',
        descripcion: 'Opens the recorder your system already includes.',
      },
    },
    secciones: {
      codigo: 'Code',
      red: 'Network',
      seguridad: 'Security',
      archivos: 'Files and media',
      sistema: 'System',
    },
    tarjetas: {
      comparar: {
        nombre: 'Compare',
        descripcion: 'Texts and folders: the differences side by side.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'From a text or link, or so others can join your Wi-Fi.',
      },
      guias: {
        nombre: 'Guides',
        descripcion: 'HTTP, tunnels and Git, with examples and commands to copy.',
      },
    },
    pestanas: {
      diff: 'Texts',
      diffCarpetas: 'Folders',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunnels',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev has no recorder of its own: it opens the one your system already includes. The video is saved wherever that tool saves it.',
      abrir: 'Open the recorder',
      abierta: 'Snipping Tool opened. Pick the screen area and press Start.',
      noSePudo:
        'Snipping Tool could not be opened from here. Use one of the shortcuts in the guide.',
      guiaTitulo: 'How to record on your system',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Press Win + Shift + R to record with Snipping Tool.',
            'If your Snipping Tool is not up to date, press Win + Alt + R to record with the Xbox Game Bar.',
            'Stop the recording with the button on the bar that appears at the top.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Press Cmd + Shift + 5 to open the capture bar.',
            'Choose to record the entire screen or a selected portion.',
            'Press Record and, to finish, the stop button in the menu bar.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Each desktop includes a recorder: in GNOME, Ctrl + Alt + Shift + R; in KDE, Spectacle.',
            'If you have none, install OBS Studio or SimpleScreenRecorder from your package manager.',
          ],
        },
      },
    },
    errores: {
      jsonVacio: 'Type or paste some JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `Invalid JSON: check line ${linea}, column ${columna}.`,
      banderas: 'Invalid flags: use only d, g, i, m, s, u, v or y, without repeats.',
      regex: (detalle: string | null) =>
        detalle ? `Invalid expression: ${detalle}` : 'Invalid expression.',
      regexDetalle: {
        corchete: 'a bracket “[” is not closed.',
        parentesis: 'a parenthesis “(” is not closed.',
        parentesisSobra: 'a closing parenthesis “)” has no opening one.',
        nadaQueRepetir: 'a quantifier (“*”, “+”, “?” or “{}”) has nothing to repeat.',
        barraAlFinal: 'the pattern cannot end with a backslash.',
        rangoInvertido: 'a range in a character class is reversed (for example “z-a”).',
        cuantificador: 'the “{}” quantifier is incomplete or its numbers are reversed.',
        grupo: 'the name or form of a group is not valid.',
        escape: 'a backslash escape sequence is not valid.',
      },
      trabajador: 'Could not run the operation in the background.',
      diffLento: 'The texts are too different to compare in time.',
      base64: 'Invalid Base64.',
      utf8: 'The decoded content is not UTF-8 text.',
      url: 'Invalid URL sequence.',
      coste: (max: number) => `The bcrypt cost must be between 4 and ${max}.`,
      jwtPartes: 'The JWT must have three parts separated by dots.',
      jwtCabecera: 'Could not read the JWT header.',
      jwtCarga: 'Could not read the JWT payload.',
      longitud: 'The length must be between 4 and 256.',
      sinConjuntos: 'Choose at least one character type.',
      sinDominios: 'Enter at least one name or IP.',
      muchosDominios: (max: number) => `At most ${max} names per certificate.`,
    },
    qr: {
      texto: 'Text or URL',
      textoAyuda: 'The QR is generated on this computer; nothing goes out to the network.',
      tunel: 'Project tunnel link',
      sinTuneles: 'No active tunnels',
      descargar: 'Download PNG',
      vacio: 'Type something to generate the code.',
      largo: 'The text is too long for a QR code.',
      descargado: 'Download started.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Format',
      minificar: 'Minify',
      validar: 'Validate',
      valido: 'Valid JSON.',
      resultado: 'Result',
      arbol: 'Tree',
      mas: (n: number) => `… ${n} more`,
    },
    regex: {
      patron: 'Pattern',
      banderas: 'Flags',
      texto: 'Test text',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'match' : 'matches'}${truncado ? ' (showing the first ones)' : ''}`,
      sinCoincidencias: 'No matches.',
      tiempo: 'The expression took too long and was stopped (possible catastrophic backtracking).',
      grupo: (n: number) => `Group ${n}`,
      referencia: 'Quick reference',
      tabla: [
        ['.', 'Any character (except line break without s)'],
        ['\\d \\w \\s', 'Digit, letter/number/_ and whitespace'],
        ['\\D \\W \\S', 'The opposite of the above'],
        ['[abc] [^abc]', 'One from the list / none from the list'],
        ['^ $', 'Start and end (of line with m)'],
        ['\\b', 'Word boundary'],
        ['* + ?', 'Zero or more, one or more, optional'],
        ['{n,m}', 'Between n and m repetitions'],
        ['*? +?', 'Lazy version'],
        ['(…) (?<name>…)', 'Capturing group and named group'],
        ['(?:…)', 'Non-capturing group'],
        ['(?=…) (?!…)', 'Followed by / not followed by'],
        ['a|b', 'Alternation'],
        ['g i m s u y', 'Global, case-insensitive, multiline, dotAll, Unicode, sticky'],
      ] as [string, string][],
    },
    diff: {
      original: 'Original',
      modificado: 'Modified',
      cargarArchivo: 'Load file',
      comparar: 'Compare',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} lines`,
      iguales: 'The texts are identical.',
      archivoGrande: 'The file exceeds 5 MB; choose a smaller one.',
      textoGrande: 'Each text can be at most 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `Showing the first ${mostradas} of ${total} rows.`,
    },
    tiempo: {
      timestamp: 'Timestamp (seconds or milliseconds)',
      fecha: 'Date (YYYY-MM-DD HH:mm:ss)',
      zona: 'Time zone',
      ahora: 'Now',
      segundos: 'Seconds',
      milisegundos: 'Milliseconds',
      iso: 'ISO 8601 (UTC)',
      enZona: 'In the chosen zone',
      desplazamiento: 'Offset',
      relativo: 'Relative',
      detectado: (unidad: 's' | 'ms') =>
        unidad === 's' ? 'Read as seconds' : 'Read as milliseconds',
      timestampInvalido: 'Enter digits only (a sign is allowed).',
      fechaInvalida: 'Use the YYYY-MM-DD HH:mm[:ss] format with a real date.',
      zonaInvalida: 'Unknown time zone.',
    },
    puertos: {
      filtro: 'Filter by port, PID or name',
      actualizar: 'Refresh',
      columnas: {
        puerto: 'Port',
        protocolo: 'Protocol',
        proceso: 'Process',
        pid: 'PID',
        direcciones: 'Addresses',
        acciones: 'Actions',
      },
      propio: 'WolfCore Dev',
      sistema: 'System',
      finalizar: 'End',
      noFinalizable: 'System and WolfCore Dev processes cannot be ended from here.',
      confirmarTitulo: 'End process',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) will be closed without saving. To confirm, type the process name:`,
      finalizado: (nombre: string) => `${nombre} was ended.`,
      vacio: 'No ports in use, or they could not be read.',
    },
    bom: {
      explicacion:
        'First it shows which files have a BOM; cleaning saves a .bak-bom copy of each one. node_modules, vendor, .git and binaries are skipped.',
      elegirArchivos: 'Choose files',
      elegirCarpeta: 'Choose folder',
      seleccion: (n: number) => `${n} ${n === 1 ? 'path selected' : 'paths selected'}`,
      analizar: 'Analyze',
      limpiar: 'Remove BOM',
      confirmar: (n: number) =>
        `The BOM will be removed from ${n} ${n === 1 ? 'file' : 'files'} (with a backup copy). Continue?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'file with BOM' : 'files with BOM'}`,
      sinBom: 'No file has a BOM.',
      limpiados: (n: number) => `${n} ${n === 1 ? 'file' : 'files'} cleaned.`,
      copia: 'Copy',
    },
    certificados: {
      explicacion:
        'Signs a certificate with the WolfCore Dev local CA. The .crt is saved where you choose and the key (.key) next to it; the key never passes through the UI.',
      dominios: 'Names or IPs (separated by space, comma or line)',
      ejemplo: 'myapp.test, *.myapp.test, 127.0.0.1',
      emitir: 'Issue and save',
      guardado: 'Certificate saved',
      certificado: 'Certificate',
      clave: 'Key',
    },
    cripto: {
      texto: 'Text',
      hash: 'Hash',
      calcular: 'Calculate',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt cost',
      bcryptTrunca: 'bcrypt only uses the first 72 bytes of the text.',
      bcryptVerificar: 'bcrypt hash to verify',
      verificar: 'Verify',
      coincide: 'The text matches the hash.',
      noCoincide: 'The text does not match the hash.',
      base64: 'Base64',
      base64Url: 'URL variant',
      codificar: 'Encode',
      decodificar: 'Decode',
      url: 'URL encode',
      decodificarUrl: 'URL decode',
      codificarBase64: 'Base64 encode',
      decodificarBase64: 'Base64 decode',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID and passwords',
      uuid: 'UUID v4',
      generar: 'Generate',
      generarDiez: 'Generate 10',
      contrasena: 'Random password',
      longitud: 'Length',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Symbols',
      jwt: 'Decode JWT',
      jwtToken: 'Token',
      cabecera: 'Header',
      carga: 'Payload',
      firmaNoVerificada:
        'Signature not verified: the content is shown as is and may have been tampered with.',
      vencido: 'The token has expired (exp).',
      vigente: 'The token has not expired (exp).',
      salida: 'Result',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Preview',
      ejemplo:
        '# Title\n\nText with **bold**, _italic_ and a [link](https://example.com).\n\n- One\n- Two\n\n```\ncode\n```\n',
      seguro: 'Raw HTML is shown as text, dangerous links are discarded and images are not loaded.',
      imagenOmitida: (alt: string) => `[image${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      equipo: {
        titulo: 'My computer',
        copiarResumen: 'Copy summary',
        resumenCopiado: 'Summary copied',
        privacidad: 'The summary contains no serial numbers or unique identifiers.',
        desconocido: 'unknown',
        sinGpu: 'None detected',
        so: 'Operating system',
        cpu: 'Processor',
        ram: 'RAM',
        gpu: 'Graphics card',
        placa: 'Motherboard',
        disco: 'Disk {u}',
        compilacion: 'build {n}',
        nucleosHilos: '{n} cores, {h} threads',
        ramDetalle: '{total} total, {libre} free',
        vram: '{v} of VRAM',
        discoDetalle: '{libre} free of {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Computer summary · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Computer summary · WolfCore Dev',
      },
      aplicacion: 'WolfCore Dev version',
      navegador: 'UI engine',
      plataforma: 'Platform',
      idioma: 'Language',
      zona: 'Time zone',
      nucleos: 'Logical cores',
      actualizar: 'Refresh',
      path: 'PATH',
      pathVacio: 'The PATH is empty.',
      herramientas: 'WolfCore Dev tools',
      noInstalada: 'Not installed',
      sinRespuesta: 'Did not respond in time',
      variables: 'Environment variables',
      filtro: 'Filter variables',
      enmascarada: 'Value hidden: the name looks like a secret.',
    },
    busqueda: {
      explicacion:
        'Searches names and contents, without following links and without reading binaries. node_modules, vendor and .git are skipped by default.',
      origen: 'Where to search',
      proyecto: 'Project',
      elegirCarpeta: 'Choose folder',
      elegirArchivo: 'Choose file',
      sinOrigen: 'Choose a project, a folder or a file.',
      consulta: 'Text to search for',
      modoNombre: 'Names',
      modoContenido: 'Contents',
      modoAmbos: 'Both',
      regex: 'Regular expression',
      mayusculas: 'Match case',
      incluir: 'Only files (comma-separated, e.g. *.php)',
      excluir: 'Also skip (comma-separated)',
      buscar: 'Search',
      cancelar: 'Cancel',
      buscando: 'Searching…',
      sinResultados: 'No matches.',
      truncado: 'There are more results than shown: narrow the search.',
      cancelada: 'Search cancelled.',
      abrir: 'Open in editor',
      incluirPesadas: 'Include heavy folders (node_modules, vendor, .git…)',
      contexto: 'Context lines',
      grupoNombres: (n: number) => `By name (${n})`,
      grupoContenido: (n: number) => `By content (${n})`,
      carpeta: 'folder',
      listaAria: 'Search results',
      atajos: '↑ ↓ to move, Enter to open in the editor, Esc to cancel or go back to the text.',
      sensible: (n: number) => `Sensitive file: match on line ${n} (its content is not shown).`,
      mostrarMas: (n: number) => `Show ${n} more`,
      linea: (n: number) => `line ${n}`,
      sinGrupo: 'No results in this group.',
      topeBytes: 'The read limit was reached: narrow the search.',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'match' : 'matches'}`,
      resumen: (archivos: number, examinados: number) =>
        `in ${archivos} ${archivos === 1 ? 'file' : 'files'} (${examinados} checked)`,
    },
    compartir: {
      explicacion:
        'Publishes a folder or a file from this computer on the internet with a temporary link. It is read-only: anyone with the link can view and download, not upload or change anything. The link carries a secret code, expires at the time you choose and closes when you quit WolfCore Dev. .env files, keys, the .git folder and sites with real data are never shared.',
      eleccion: 'What to share',
      elegirCarpeta: 'Choose folder…',
      elegirArchivo: 'Choose file…',
      elegido: 'Chosen',
      duracion: 'Stop sharing in',
      duraciones: { m15: '15 minutes', h1: '1 hour', h4: '4 hours' },
      tunel: 'Tunnel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (quick, no account)',
        ngrok: 'ngrok (with your token)',
      },
      ngrokSinToken: 'ngrok needs your token: save it in the tunnel options of a site.',
      compartir: 'Share…',
      sinFtp:
        'FTP is not shared through a tunnel: it is unencrypted and the tunnel only carries HTTP.',
      vacio: {
        titulo: 'Nothing is shared',
        texto:
          'Choose a folder or a file to get a temporary public link. Nothing is published until you confirm it.',
      },
      grandes:
        'Text files or files of an unknown type larger than 8 MB are not shared, because they cannot be fully checked; images, audio, video and packages (zip, 7z, gz, pdf) are. They show as marked in the listing.',
      comprimidos:
        'A compressed file (.zip, .7z, .gz) is shared as it is, without looking inside: if it holds a .env file or keys, they are published.',
      confirmar: {
        titulo: 'Share on the internet',
        pregunta: 'Publish this on the internet?',
        rutaReal: 'Real path (links resolved)',
        ruta: 'Exact path',
        aviso: (dur: string) =>
          `It will be public on the internet for ${dur} from the moment the link is ready. Anyone with the link will be able to view and download what is shared.`,
        boton: 'Share on the internet',
      },
      abriendo: 'Opening the tunnel…',
      activa: 'Sharing',
      enlace: 'Public link',
      copiar: 'Copy link',
      qr: 'QR code of the link',
      vence: (hasta: string, restan: string) => `Expires at ${hasta} (${restan})`,
      restan: (min: number) => (min <= 1 ? 'less than 1 minute' : `${min} min`),
      dejar: 'Stop sharing',
      fin: {
        vencio: 'Time is up: the server and the tunnel were closed.',
        tunel: 'The tunnel closed and sharing stopped.',
      },
      registro: {
        titulo: 'Accesses',
        ayuda: 'The latest 200, in memory only. They never show the secret code of the link.',
        vacioTitulo: 'No accesses yet',
        vacioTexto: 'Each time someone opens the link it will appear here.',
        col: { hora: 'Time', ip: 'IP', ruta: 'Path', codigo: 'Code' },
        sinPermiso: '(without the right code)',
      },
    },
    usoDisco: {
      explicacion:
        'Shows what takes up space on a drive or in a folder. It only reads names and sizes (never contents), does not follow links or junctions and works in a separate process. It does not delete, move or change anything.',
      unidades: 'Drives',
      unidad: (ruta: string, etiqueta: string) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre: string, total: string) => `${libre} free of ${total}`,
      sinUnidades: 'The list of drives could not be read. You can choose a folder.',
      elegirCarpeta: 'Choose folder…',
      analizando: 'Analyzing…',
      leyendo: 'Reading',
      progreso: (archivos: string, carpetas: string, bytes: string) =>
        `${archivos} files · ${carpetas} folders · ${bytes}`,
      cancelar: 'Cancel',
      cancelado: 'Analysis cancelled.',
      resumen: (total: string, archivos: string, carpetas: string) =>
        `${total} in ${archivos} files and ${carpetas} folders`,
      duracion: (segundos: string) => `It took ${segundos} s.`,
      vistas: {
        arbol: 'Tree',
        carpetas: 'Folders',
        archivos: 'Files',
        extensiones: 'Extensions',
      },
      arbolAyuda:
        'Sorted by size. Only folders and files that weigh at least 0.5% of the total are shown; the rest is summed up in “Others”.',
      carpetasAyuda:
        'The 50 folders with the most weight of their own: what the files they hold directly weigh, not counting their subfolders.',
      archivosAyuda: 'The 50 largest files.',
      extensionesAyuda:
        'The 20 extensions that take up the most; the rest go to “Other extensions”.',
      col: {
        nombre: 'Name',
        tamano: 'Size',
        porcentaje: 'Of total',
        archivos: 'Files',
        ruta: 'Path',
        extension: 'Extension',
      },
      otros: (n: string) => `Others (${n} small files)`,
      sinExtension: '(no extension)',
      otrasExtensiones: 'Other extensions',
      expandir: (nombre: string) => `Expand ${nombre}`,
      contraer: (nombre: string) => `Collapse ${nombre}`,
      abrir: 'Open in Explorer',
      copiar: 'Copy path',
      denegada: 'Could not be read',
      avisos: {
        enlaces: (n: number) =>
          `${n} ${n === 1 ? 'link or junction was' : 'links or junctions were'} not followed and ${n === 1 ? 'counts' : 'count'} as 0.`,
        denegados: (n: number) =>
          `${n} ${n === 1 ? 'item' : 'items'} could not be read (no permission, or changed during the analysis). Without administrator rights some system folders cannot be read: this tool does not ask for them.`,
        enlacesDuros: (n: number) =>
          `${n} ${n === 1 ? 'extra name' : 'extra names'} of hard-linked files were not counted twice.`,
        enlacesDurosIncompleto:
          'There were so many hard links that the registry filled up: the total may count some file twice.',
        truncado: 'The maximum depth was reached: some folders were not counted.',
        tamanoLogico:
          'Sizes are logical (what each file reports), not the space used on disk: online-only OneDrive files, compressed files and sparse files may differ.',
        verEnlaces: 'Show the links that were not followed',
      },
      limpieza: {
        titulo: 'Free up space',
        texto:
          'This tool only measures. To delete temporary files and regenerable caches, or unused service versions, use what already exists:',
        temporales: 'Disk cleanup',
        versiones: 'Unused versions (Services)',
      },
      vacio: {
        titulo: 'No analysis yet',
        texto: 'Choose a drive or a folder to see what takes up space. Nothing is changed.',
      },
      sinContenido: {
        titulo: 'Nothing to count',
        texto: 'That folder has no files that can be read.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Compares two folders without changing anything in them: what is only in one, only in the other and what differs. It does not follow links and works in a separate process.',
      carpetaA: 'Folder A',
      carpetaB: 'Folder B',
      elegir: 'Choose folder',
      sinElegir: 'Not chosen',
      comparar: 'Compare',
      comparando: 'Comparing…',
      cancelar: 'Cancel',
      cancelada: 'Comparison cancelled.',
      iguales: 'The two folders are the same.',
      grupoSoloA: 'Only in A',
      grupoSoloB: 'Only in B',
      grupoDistintos: 'Different',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'None',
      resumen: (a: number, b: number, iguales: number) =>
        `A: ${a} files · B: ${b} files · ${iguales} identical`,
      truncado: 'A limit was reached (files, depth or size): the list is not complete.',
      recortado: (mostrados: number, total: number) =>
        `There are more files than shown (${mostrados} of ${total}).`,
      sinComparar: (n: number) =>
        `${n} large files with the same size were not compared by content.`,
      omitidos: (n: number) => `${n} links, junctions or special items were skipped.`,
      motivoTamano: 'different size',
      motivoContenido: 'same size, different content',
      tamano: (a: string, b: string) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Choose a “different” file from the list to see its difference.',
      soloEnUno: (lado: string) => `This file only exists in ${lado}.`,
      cargando: 'Reading the files…',
      binario: 'The files are different, but they are not text: the diff is not shown.',
      sensible:
        'Sensitive file (.env, keys or real data): it is different, but its content is not shown. You can open it in the editor, which asks for a reinforced confirmation.',
      tope: (kb: number) =>
        `The files are different, but they are over ${kb} KB: the text diff is not shown.`,
      demasiadoDistinto: 'The files are so different that the line-by-line diff is not shown.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'mixed line endings',
        ninguno: 'no line endings',
      },
      saltosDistintos: (a: string, b: string) => `Line endings: A uses ${a} and B uses ${b}.`,
      soloSaltos:
        'The text of the lines is the same: only the line endings (including the one at the end of the file) or the BOM change.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${agregadas} lines added, ${quitadas} removed`,
      truncadoArchivo: 'Only the first rows are shown.',
      lineasIguales: (n: number) => `… ${n} identical lines …`,
      abrirA: 'Open A in the editor',
      abrirB: 'Open B in the editor',
      atajos: '↑ ↓ to move, Enter to see the difference, Esc to cancel.',
      listaAria: (grupo: string) => `Files: ${grupo}`,
      detalleAria: 'File differences',
    },
    infoArchivo: {
      elegir: 'Choose file',
      ayuda: 'Read on this computer to calculate the hashes (200 MB maximum).',
      nombre: 'Name',
      tamano: 'Size',
      tipo: 'Type',
      modificado: 'Modified',
      sinTipo: 'Unknown',
      grande: 'The file exceeds 200 MB: details are shown without hashes.',
      calculando: 'Calculating hashes…',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'HTTP client sections',
        peticion: 'Request',
        coleccion: 'Collection',
        historial: 'History',
        entornos: 'Environments',
      },
      entorno: 'Environment',
      sinEntorno: 'No environment',
      metodo: 'Method',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path or {{base}}/path',
      enviar: 'Send',
      enviarAtajo: 'Send (Ctrl+Enter)',
      cancelar: 'Cancel',
      nueva: 'New',
      guardar: 'Save to collection',
      nombre: 'Name',
      nombrePlaceholder: 'Request name',
      guardada: 'Request saved',
      ayudaVariables: 'Use {{variable}} to take values from the selected environment.',
      secciones: {
        params: 'Parameters',
        cabeceras: 'Headers',
        cuerpo: 'Body',
        auth: 'Authentication',
        opciones: 'Options',
      },
      par: {
        clave: 'Name',
        valor: 'Value',
        agregar: 'Add row',
        quitar: 'Remove row',
        activa: 'Row enabled',
        falta: 'The secret is missing: type it to be able to send.',
      },
      cuerpo: {
        tipo: 'Body type',
        ninguno: 'None',
        json: 'JSON',
        form: 'Form (urlencoded)',
        multipart: 'Multipart (text only)',
        raw: 'Raw text',
        tipoContenido: 'Content-Type',
        texto: 'Content',
        multipartAyuda: 'Text fields only: no files from the disk are sent.',
      },
      auth: {
        tipo: 'Type',
        ninguna: 'None',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API key',
        token: 'Token',
        usuario: 'User',
        clave: 'Password',
        nombre: 'Header or parameter name',
        en: 'Send in',
        cabecera: 'Header',
        query: 'Query string',
        ayuda:
          'The value is stored encrypted by the system; the collection, the history and the environments only keep a reference.',
      },
      secreto: {
        guardado: 'Stored (encrypted). Type to replace it.',
        mostrar: 'Show',
        ocultar: 'Hide',
        quitar: 'Remove',
        valor: 'Stored value',
        porNombre: 'It will be stored encrypted because the name looks like a secret.',
      },
      opciones: {
        plazo: 'Timeout (seconds)',
        plazoAyuda: 'From 1 to 120 seconds.',
        ignorarCert: 'Ignore certificate errors for this request',
        ignorarAviso:
          'Dangerous: the connection is no longer verified. It only applies to this request and its host. WolfCore .test sites are already verified with its own CA.',
        limites:
          'Response of up to 10 MB and at most 10 redirects. No stored cookies and no system proxy.',
      },
      respuesta: {
        enviando: 'Sending…',
        estado: 'Status',
        tiempo: 'Time',
        tamano: 'Size',
        cuerpo: 'Body',
        cabeceras: 'Headers',
        redirecciones: 'Redirects',
        vacioTitulo: 'No response yet',
        vacioTexto: 'Type a URL and press Send. The request goes out from WolfCore Dev.',
        binario: (bytes: number, tipo: string) =>
          `Binary of ${bytes} bytes, type ${tipo || 'unknown'}.`,
        sinCuerpo: 'The response has no body.',
        truncada: 'The response exceeded 10 MB: it was cut and is incomplete.',
        parcial: (mostrados: number) => `Showing the first ${mostrados} characters.`,
        sinRedirecciones: 'There were no redirects.',
        salto: (n: number) => `Hop ${n}`,
        urlFinal: 'Final URL',
        certIgnorado: 'Certificate errors were ignored for this request.',
        caWolf: 'Verified with the WolfCore Dev CA.',
        copiar: 'Copy the body',
        copiado: 'Body copied',
        formato: 'Formatted JSON',
        crudo: 'Original text',
      },
      curl: {
        copiar: 'Copy as curl',
        incluir: 'Include credentials',
        incluirAyuda:
          'Unchecked, secret values come out as <secreto>. Checked, the command carries the real credentials.',
        copiado: 'curl command copied',
        importar: 'Import curl',
        importarTitulo: 'Import a curl command',
        importarAyuda:
          'Paste a curl command. It is only read as text: nothing is run. Credentials go to the encrypted store.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'Import',
        importada: 'Request imported into the collection',
        avisos: {
          opcion_ignorada: (d: string) => `Option ignored: ${d}`,
          archivo_ignorado: (d: string) => `Files on the disk are not read: ${d}`,
          inseguro_ignorado:
            '-k/--insecure was ignored. If you need it, turn on «Ignore certificate errors» by hand.',
          comando_cortado: 'Whatever follows a shell operator (|, ;, &, >) was ignored.',
          sin_evaluar:
            'The text had $(…), backticks or shell variables: they are not evaluated and stay as text.',
          url_sin_esquema: 'The URL had no scheme: http:// was used.',
          varias_urls: (d: string) => `An extra argument was ignored: ${d}`,
          cabecera_invalida: (d: string) => `An invalid header was ignored: ${d}`,
          secretos_guardados:
            'The imported credentials were stored encrypted; the collection only keeps their reference.',
        },
      },
      coleccion: {
        vacioTitulo: 'The collection is empty',
        vacioTexto: 'Save a request or import a curl command to keep it at hand.',
        abrir: 'Open',
        borrar: 'Delete',
        borrada: 'Request deleted',
      },
      historial: {
        vacioTitulo: 'No history',
        vacioTexto:
          'The last 100 requests stay here, without credentials: sensitive headers show as ***.',
        abrir: 'Open',
        limpiar: 'Clear history',
        sinRespuesta: 'No response',
      },
      entornos: {
        vacioTitulo: 'No environments',
        vacioTexto:
          'An environment defines variables such as {{base}} or {{token}}. Those marked as secret are stored encrypted.',
        nuevo: 'New environment',
        nombre: 'Environment name',
        variable: 'Variable',
        valor: 'Value',
        secreta: 'Secret',
        agregar: 'Add variable',
        quitar: 'Remove variable',
        guardar: 'Save environment',
        guardado: 'Environment saved',
        borrar: 'Delete environment',
        borrado: 'Environment deleted',
        usar: 'Use this environment',
        activo: 'Active',
        sinNombre: 'Type a name for the environment.',
      },
    },
    websocket: {
      url: 'URL (ws:// or wss://)',
      conectar: 'Connect',
      desconectar: 'Disconnect',
      mensaje: 'Message',
      enviar: 'Send',
      urlInvalida: 'Enter a URL that starts with ws:// or wss://.',
      conectando: 'Connecting…',
      conectado: 'Connected',
      desconectado: 'Disconnected',
      error: 'Connection error',
      cerrado: (codigo: number, motivo: string) =>
        `Closed (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Sent',
      recibido: 'Received',
      binario: (n: number) => `[binary, ${n} bytes]`,
      vacio: 'No messages yet.',
      tope: 'The last 500 messages are kept; each one is shown up to 10 KB.',
    },
    qrWifi: {
      ssid: 'Network name (SSID)',
      clave: 'Password',
      seguridad: 'Security',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'No password',
      oculta: 'Hidden network',
      mostrar: 'Show',
      ocultar: 'Hide',
      aviso:
        'The QR code contains the password as is: anyone who sees or photographs it can join your network. It is generated here, never saved, and cleared when you close this panel.',
      avisoPng:
        'The PNG you download also carries the password inside the code: keep it where only you can see it.',
      escribala:
        'You type the password: WolfCore Dev never reads the Wi-Fi passwords stored in the system.',
      errorSsid: 'Type the network name (up to 32 characters).',
      errorClave: 'Type the password.',
      errorClaveWpa: 'A WPA password has between 8 and 63 characters.',
      vacio: 'Fill in the details to see the code.',
      alt: 'QR code to join the Wi-Fi network',
      descargar: 'Download PNG',
      descargado: 'QR saved',
      largo: 'The data is too long for a QR code.',
    },
    imagenes: {
      elegir: 'Choose image',
      ayuda:
        'Processed on this computer (up to 30 MB and 12000 px per side). The original is not modified: the result is a new file.',
      original: 'Original',
      accion: 'What to do',
      aIco: 'Convert to ICO',
      aPng: 'Convert to PNG',
      comprimir: 'Compress',
      tamanos: 'ICO sizes',
      formato: 'Format',
      calidad: 'Quality',
      ladoMax: 'Maximum side in px (empty = original)',
      procesar: 'Process',
      procesando: 'Processing…',
      guardar: 'Save as…',
      antes: 'Before',
      despues: 'After',
      sinMejora: 'The result is not smaller than the original: try another quality or format.',
      errorAbrir: 'The image could not be opened on this computer.',
      errorProcesar: 'The image could not be processed.',
      sufijoConvertida: '-converted',
      sufijoComprimida: '-compressed',
      nombreCaptura: 'screenshot',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% smaller`
          : porcentaje < 0
            ? `${-porcentaje}% larger`
            : 'no change',
      guardado: (archivo: string) => `Saved to ${archivo}`,
    },
    comprimir: {
      zip: 'Compress to ZIP',
      zipAyuda:
        'Choose files or folders. Links are not followed and the ZIP is a new file: an existing one is never overwritten.',
      agregarArchivos: 'Add files',
      agregarCarpeta: 'Add folder',
      quitar: 'Remove',
      vacio: 'Nothing chosen yet.',
      crearZip: 'Create ZIP…',
      creando: 'Creating…',
      pdf: 'Optimize PDF',
      pdfAyuda:
        'It is saved again with object streams, in a separate thread. The file is only created if it is smaller; password-protected PDFs are not opened. The original is not touched. Note: saving again loses digital signatures and PDF/A conformance.',
      elegirPdf: 'Choose PDF',
      optimizar: 'Optimize…',
      optimizando: 'Optimizing…',
      antes: 'Before',
      despues: 'After',
      sinMejora: 'The PDF would not get smaller: no file was created.',
      sufijoOptimizado: '-optimized',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'link, unreadable folder or special file was not included' : 'links, unreadable folders or special files were not included'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'file' : 'files'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% smaller`
          : porcentaje < 0
            ? `${-porcentaje}% larger`
            : 'no change',
      guardado: (archivo: string) => `Saved to ${archivo}`,
    },
    conversor: {
      ayuda:
        'Conversion happens on this computer: the document is not uploaded anywhere. The original is not modified; the result is a new file and an existing one is never overwritten.',
      elegir: 'Choose document',
      tipoNoSoportado:
        'There are no conversions for that file type. docx, xlsx, csv, md, html and pdf are supported (and odt, pptx and doc with LibreOffice).',
      convertirA: 'Convert to',
      convertir: 'Convert…',
      convirtiendo: 'Converting…',
      avisoLibreOffice:
        'This conversion uses LibreOffice, which is already installed on this computer. WolfCore Dev does not install or download it: it opens it without a window and with a temporary profile.',
      sinLibreOffice:
        'If you install LibreOffice you can also convert odt, pptx and doc (WolfCore Dev does not install it).',
      limites:
        'There are safety limits: up to 50 MB (10 MB for md and html), 120 s, 200,000 rows, 1,000 columns and 5 million cells; files that look like a ZIP bomb or carry XML entities are rejected.',
      guardado: (archivo: string) => `Saved to ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Strength',
      pestanaAuditar: 'Audit a database',
      fortaleza: {
        etiqueta: 'Password to measure',
        marcador: 'Type a password',
        privacidad: 'Measured right here: nothing leaves your computer or is saved.',
        mostrar: 'Show',
        ocultar: 'Hide',
        niveles: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'],
        sinAvisos: 'No remarks.',
        estimacion: 'This is an estimate, not a guarantee.',
        avisos: {
          straightRow: 'A straight row of keys is easy to guess.',
          keyPattern: 'Short keyboard patterns are easy to guess.',
          simpleRepeat: 'Repeating a character or a group barely helps.',
          extendedRepeat: 'Repeated groups are easy to guess.',
          sequences: 'Sequences like abc or 6543 are easy to guess.',
          recentYears: 'Avoid recent years and dates tied to you.',
          dates: 'Avoid dates: they are easy to guess.',
          topTen: 'It is among the ten most used passwords.',
          topHundred: 'It is among the hundred most used passwords.',
          common: 'It is a very common password.',
          similarToCommon: 'It looks like a very common password.',
          wordByItself: 'A single word is easy to guess.',
          namesByThemselves: 'A single name or surname is easy to guess.',
          commonNames: 'Common names and surnames are easy to guess.',
          userInputs: 'Do not use details others know about you.',
          l33t: 'Swapping letters for predictable symbols (@ for a) helps little.',
          reverseWords: 'Writing words backwards helps little.',
          allUppercase: 'All capitals helps little.',
          capitalization: 'Capitalizing the first letter helps little.',
          associatedYears: 'Avoid years associated with you.',
          repeated: 'Avoid repeated words and characters.',
          longerKeyboardPattern: 'Use a longer keyboard pattern and change direction.',
          anotherWord: 'Add one or two more words; uncommon ones help.',
          useWords: 'Several random words make a good password.',
          noNeed: 'You can be secure without symbols or numbers: length is what counts.',
        },
      },
      auditar: {
        limite:
          'This only detects very common passwords: it compares each hash with a short list of about 200. It is not an attack or a brute-force test. An account not being flagged does not mean its password is good.',
        privacidad:
          'Which password matched is never shown, and the data is read with a temporary read-only user (on PostgreSQL, with a read-only session). Use it only on your own databases.',
        motor: 'Engine',
        base: 'Database',
        tabla: 'Table',
        columnaUsuario: 'User column',
        columnaHash: 'Hash column',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Start the server from Databases to review its databases.',
        sinBases: 'There are no databases on this server.',
        sinMotores: 'There is no MySQL, MariaDB or PostgreSQL server of your own.',
        revisar: 'Review',
        revisando: 'Reviewing…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'account reviewed' : 'accounts reviewed'} · ${d} weak`,
        sinDebiles: 'No reviewed account matches a very common password.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? 'account could not be reviewed' : 'accounts could not be reviewed'}:`,
        truncado:
          'The review stopped at the limit of 10,000 rows or 60 seconds: some accounts were not reviewed.',
        usuario: 'User',
        motivo: 'Reason',
        accion: 'Action',
        motivos: {
          comun: 'Very common password',
          formato_debil: 'Weak format (unsalted md5 or sha1)',
        },
        restablecer: 'Reset',
        mas: (n: number) => `and ${n} more (the first 200 are shown)`,
        esquema: 'Schema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Cancel',
        cancelando: 'Cancelling…',
        cancelada: 'Audit cancelled.',
        progreso: (a: number, b: number) => `Reviewed ${a} of ${b}`,
        tiposNoRevisables: {
          vacio: 'empty hash',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (not available on this computer or with parameters over the limit)',
          bcrypt_otro: 'bcrypt with a cost out of range or the $2x$ variant',
          pbkdf2_otro: 'PBKDF2 with parameters over the limit',
          ldap: 'LDAP format ({SHA}…)',
          otro: 'unknown format',
        },
        rlsActiva:
          'The table has row-level security (RLS): the audit sees only the rows the policy allows the limited role, so some accounts may be missing.',
        falsoPositivo:
          'A value of 32 or 40 hexadecimal characters is taken for md5 or sha1, but it could be something else (a token, for example). If the column does not store passwords, the result is meaningless.',
      },
      restablecer: {
        titulo: (u: string) => `Reset the password of ${u}`,
        ayuda:
          'A password cannot be recovered: a new one is set. First a snapshot of the database is taken and a copy of the row is saved.',
        cargando: 'Preparing the preview…',
        sentencia: 'This will run (the values are sent separately and not shown)',
        formatoActual: (f: string) => `Current format: ${f}`,
        cambiaFormato:
          'The account will switch to bcrypt: the application must be able to verify it (for example with password_verify); otherwise nobody will be able to sign in with that account.',
        nueva: 'New password',
        generar: 'Generate one',
        mostrar: 'Show',
        ocultar: 'Hide',
        anotar: 'Write it down now: it is not shown again or saved.',
        escribaUsuario: (u: string) => `To confirm, type the user: ${u}`,
        confirmar: 'Reset password',
        cancelar: 'Cancel',
        cerrar: 'Close',
        hecho: 'Password reset.',
        copiaFila: 'Copy of the row (identification and previous hash, kept for 30 days):',
        instantanea: 'Snapshot of the database taken before:',
        instantaneaAyuda: 'You can go back to it from Databases › Snapshots.',
        aBcrypt: 'Switch to bcrypt: only if the application uses password_verify or the equivalent',
        avisoLegado:
          'This hash is unsalted md5 or sha1 and keeps that format. If the application stores the salt separately (in another column or a constant), the hash cannot be reproduced and the new password would not work for sign-in.',
        datosReales: {
          titulo: 'Database with real data',
          texto:
            'This database belongs to a site marked as having real customer data: resetting a password changes a real account.',
          casilla: 'I understand this is real data and I want to reset this password',
        },
        rlsActiva:
          'The table has row-level security (RLS): if the policy hides this account from the limited role, it cannot be reset.',
        copiaSinRestringir:
          'That copy could not be restricted to this computer’s user: check the folder permissions.',
      },
    },
  },
  doctor: {
    descripcion:
      'Checks ports, certificates, the hosts file, PATH, Visual C++, the antivirus and the services, and suggests how to fix them.',
    revisarAhora: 'Check now',
    revisando: 'Checking…',
    sinRevision: 'There is no check yet. Click “Check now”.',
    sinHallazgos: 'All good: no problems were found.',
    gravedades: { error: 'Errors', aviso: 'Warnings', info: 'Information' },
    evidencia: 'What was seen',
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Port {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Port {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Reserved range {desde}-{hasta} (includes {puerto})',
      ca_vencida: 'The CA expired {dias} days ago',
      ca_por_vencer: 'The CA expires in {dias} days',
      certificado_vencido: 'The certificate for {dominio} expired {dias} days ago',
      certificado_por_vencer: 'The certificate for {dominio} expires in {dias} days',
      firefox_perfiles: 'Firefox profiles without trust:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (open)',
      firefox_perfil_fuera: '{perfil} (outside the Firefox folder)',
      hosts_ilegible: '{ruta}: could not be read ({motivo})',
      hosts_codificacion: '{ruta}: {codificacion} encoding',
      hosts_bloques: '{ruta}: {bloques} WolfCore Dev blocks',
      hosts_sin_cierre: '{ruta}: a WolfCore Dev block has no closing marker',
      hosts_faltan: 'Missing from hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: read-only attribute',
      path_repetidas: 'Repeated: {entradas}',
      path_delante: '{entrada} comes before the WolfCore Dev tools and also has {programa}',
      antivirus_sin_leer:
        'The antivirus is active; its exclusions could not be read (administrator needed).',
      antivirus_sin_exclusion:
        'The antivirus is active and the WolfCore Dev data folder is not excluded.',
      enlazador_ausente: 'The C++ tools of Visual Studio Build Tools were not found.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) is not installed.',
      firewall_no_comprobado: 'The firewall rules could not be read (administrator may be needed).',
      firewall_reglas: 'WolfCore Dev: {propias} · Leftovers from WolfCore tests: {pruebas}',
      firewall_acotadas: 'Rules limited to the local network:',
      firewall_ajenas: 'Rules from other programs:',
      firewall_quitadas: 'Removed rules that can be restored:',
    },
    requiereAdmin: 'Asks for administrator permission',
    comandoManual: 'Command for an administrator console (it does not run by itself):',
    copiar: 'Copy command',
    copiado: 'Command copied.',
    reparar: 'Fix',
    ver: 'View',
    verPuertos: 'View ports',
    alternativa: 'Move the WolfCore Dev port',
    soloInforma: 'WolfCore Dev does not change this on its own: follow the instructions.',
    dialogo: {
      titulo: 'Confirm the fix',
      queHara: 'This is what will be done:',
      admin: 'Windows will ask for administrator permission.',
      reglas: 'Affected rules: untick the ones you do not want to touch.',
      sinSeleccion: 'Tick at least one rule to continue.',
      reglasNota:
        'Nothing changes without your confirmation and the administrator permission. If a rule changed after it was shown, it is skipped.',
      puerto: (p: string | number) => `The new port will be ${p}.`,
      aplicar: 'Apply',
      cancelar: 'Cancel',
    },
    estados: {
      aplicando: 'Applying…',
      hecha: 'Fix applied.',
      fallida: 'It could not be fixed.',
    },
    revisiones: {
      puertos: 'Ports',
      'rangos-reservados': 'Reserved ranges',
      ca: 'Certificate authority',
      certificados: 'Certificates',
      confianza: 'CA trust',
      hosts: 'Hosts file',
      path: 'User PATH',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++ linker',
      antivirus: 'Antivirus',
      firewall: 'Firewall',
      servicios: 'Services',
    },
    reparaciones: {
      cambiar_puerto:
        'Change the WolfCore Dev port to a free one. The other program is not touched.',
      puerto_manual:
        'Move the WolfCore Dev port out of the reserved range. Freeing the range is up to you, with the command shown.',
      detener_iis:
        'Stop the IIS service (W3SVC) to free the port. It is not disabled: it starts again when Windows restarts.',
      regenerar_ca:
        'Create a new certificate authority, trust it in Windows (it will ask you), issue the certificates again and remove the old one. A copy is saved first.',
      regenerar_certificados: 'Issue the site certificates again and reload Nginx.',
      hosts_reescribir:
        'Rewrite the WolfCore Dev block of the hosts file in UTF-8, with a copy first. Other lines are not touched.',
      hosts_solo_lectura: 'Remove the read-only attribute from the hosts file.',
      path_duplicados:
        'Remove repeated WolfCore Dev entries from the user PATH, with a copy of the previous value. Other entries are not touched.',
      path_ajeno:
        'Another tool comes first in PATH. WolfCore Dev does not remove it: move it if you need to.',
      instalar_vcredist:
        'Install Visual C++ 2015+ x64 with winget. The Microsoft installer asks for its own permission.',
      instalar_build_tools:
        'Install the Visual Studio Build Tools (with the C++ tools) using the command shown: they take several GB and ask for administrator permission, so it is up to you.',
      antivirus:
        'Adding the data folder to the antivirus exclusions is up to you, with the command shown.',
      firewall:
        'Remove those inbound firewall rules, one by one and by their exact name. A copy is saved first in etc/cortafuegos-quitadas.json so they can be recreated. Rules of other programs are never touched.',
      firewall_restaurar:
        'Recreate the rules you tick, with the same program, profile, protocol, ports and addresses that are shown, from the protected copy (not from the file in etc/). Those programs will be able to accept network connections again.',
      reintentar_servicio: 'Start the service again.',
      firefox_confianza:
        'Add to the user.js of each Firefox profile the preference that trusts the Windows authority, with a copy first. prefs.js is not touched and open profiles are skipped.',
    },
    confianza: {
      titulo: 'CA trust',
      texto:
        'Windows already trusts the WolfCore Dev authority; Node, Python and Firefox use their own store.',
      sinCa: 'There is no certificate authority yet. Create it from HTTPS to use this section.',
      node: {
        titulo: 'Node',
        proyectos: 'Project processes and the Terminal get NODE_EXTRA_CA_CERTS with the authority.',
        ajena: 'You already have your own NODE_EXTRA_CA_CERTS: WolfCore Dev does not replace it.',
        global: 'Also as a user variable (for other terminals and programs)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS will be set as a variable of your user. It affects programs you open afterwards; it is removed when you turn this off.',
        confirmarDesactivar:
          'The NODE_EXTRA_CA_CERTS variable set by WolfCore Dev will be removed.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Projects with a .venv get REQUESTS_CA_BUNDLE and SSL_CERT_FILE with the certifi roots (or the Windows ones) plus the authority. Never the authority alone.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'No Firefox profiles were found.',
        activo: 'Trusts',
        inactivo: 'Does not trust',
        abierto: 'Open',
        fuera: 'Outside the Firefox folder',
        avisoFuera: (lista: string) =>
          `These profiles are outside the Firefox folder and are not touched unless you check this: ${lista}.`,
        incluirFuera: 'Also change the profiles outside the Firefox folder',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profile outside the Firefox folder was', 'profiles outside the Firefox folder were')} not touched.`,
        activar: 'Turn on in Firefox',
        quitar: 'Remove from Firefox',
        confirmarActivar:
          'security.enterprise_roots.enabled will be added to the user.js of each profile, between WolfCore Dev markers and with a copy first in etc/respaldos. prefs.js is not touched. Profiles with Firefox open are skipped: close it first.',
        confirmarQuitar:
          'The WolfCore Dev block will be removed from the user.js of each profile (with a copy first). Your other preferences stay the same.',
        resultadoOk: (n: number) => `Done in ${plural(n, 'profile', 'profiles')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profile was', 'profiles were')} skipped because Firefox is open. Close it and try again.`,
        resultadoError: (n: number) => `${plural(n, 'profile', 'profiles')} could not be changed.`,
      },
      confirmar: 'Confirm',
      cancelar: 'Cancel',
    },
  },
  php: {
    descripcion:
      'php.ini and extensions for each installed PHP version. Before saving you see the diff, it is tested with php -v and a dated copy is kept; if PHP does not start again, the previous file is restored.',
    rama: 'PHP version',
    sinPhp: 'No PHP is installed. Install it from Services.',
    irServicios: 'Go to Services',
    pestanas: { ini: 'php.ini', extensiones: 'Extensions' },
    rapidosTitulo: 'Quick values',
    rapidosAyuda:
      'They are applied to the text below; nothing is saved until you confirm the diff.',
    aplicarRapidos: 'Apply to text',
    sinValor: 'not set',
    rapidos: {
      memory_limit: 'Memory per script (memory_limit)',
      upload_max_filesize: 'Max upload size (upload_max_filesize)',
      post_max_size: 'Max POST size (post_max_size)',
      max_execution_time: 'Max execution time in seconds (max_execution_time)',
      display_errors: 'Display errors (display_errors)',
      error_reporting: 'Error level (error_reporting)',
      'date.timezone': 'Time zone (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Lines starting with ; are comments.',
    sinCambios: 'No changes compared to the saved file.',
    descartar: 'Discard changes',
    revisar: 'Review and save',
    diffTitulo: (rama: string) => `Changes to the PHP ${rama} php.ini`,
    diffAyuda:
      'A dated copy will be kept, it will be tested with php -v and, if PHP is running, it will be restarted.',
    guardar: 'Save and apply',
    cancelar: 'Cancel',
    guardado: (respaldo: string) => `php.ini saved. Previous copy: ${respaldo}`,
    respaldosTitulo: 'Dated copies',
    sinRespaldos: 'No copies yet.',
    restaurar: 'Restore',
    confirmarRestaurar: (nombre: string) =>
      `Restore ${nombre}? The current php.ini is saved first as another copy.`,
    restaurado: 'Copy restored.',
    recargar: 'Reload',
    extensiones: {
      ayuda:
        'Only extensions shipped in this build ext/ folder can be enabled. Third-party ones are installed from the catalog (variant of this build, SHA-256 verified).',
      activa: 'Enabled',
      inactiva: 'Disabled',
      falta: 'File missing',
      catalogo: 'Catalog',
      instalar: 'Install',
      instalada: (nombre: string) => `${nombre} installed and enabled.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} enabled.` : `${nombre} disabled.`,
      buscar: 'Search extension',
      vacio: 'No extensions match.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI and Antigravity CLI: detect or install them and open them in a project. Those that allow it connect to the WolfCore Dev MCP. None of them opens on its own.',
    recargar: 'Detect again',
    notaMcp:
      'The registered MCP only authenticates when the agent is opened from WolfCore Dev ("Open in a project"): the token travels in the WOLFCORE_MCP_TOKEN variable of that terminal and is never written to the agent configuration. Opened elsewhere, the agent sees the «wolfcore» entry but cannot connect.',
    sitioElegido: (nombre: string) => `Choose an agent to open it in ${nombre}.`,
    instalado: 'Installed',
    noInstalado: 'Not installed',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Unknown version',
    verVersion: 'Check version',
    verVersionAyuda: 'Runs the program with --version (never done just by opening this screen).',
    origen: {
      propio: 'Installed by WolfCore Dev',
      'npm-usuario': 'User global npm',
      ejecutable: 'System program',
    },
    mcpRegistrado: 'MCP registered',
    mcpSinRegistrar: 'MCP not registered',
    tokenEscrito:
      'The agent file had the MCP token written in it: it no longer does, and the earlier copy keeps it masked (***). Consider regenerating the token of the MCP server.',
    mcpNoSoportado:
      'Its documentation does not allow reading the token from an environment variable: WolfCore Dev does not register the MCP in it (the token is never written to files).',
    instalar: 'Install',
    instalando: 'Installing…',
    guia: 'Installation guide',
    soloGuia:
      'WolfCore Dev does not install it (its installer has no pinned hash): follow the official guide.',
    registrar: 'Register MCP',
    quitar: 'Remove MCP',
    abrir: 'Open in a project',
    confirmarInstalar: {
      titulo: (nombre: string) => `Install ${nombre}?`,
      texto: (paquete: string) =>
        `The latest published version of ${paquete} is installed from registry.npmjs.org, with the WolfCore Dev Node and inside its data folder.`,
      aislado:
        'It does not use your npm configuration nor touch your global npm. It may take several minutes.',
      aceptar: 'Install',
      hecho: (nombre: string) => `${nombre} is installed.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Register the MCP in ${nombre}?`,
      texto:
        'Only the «wolfcore» entry of this file is added (or updated); everything else stays the same:',
      aceptar: 'Register',
      hecho: (nombre: string) => `MCP registered in ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Remove the MCP from ${nombre}?`,
      texto: 'Only the «wolfcore» entry of this file is removed; everything else stays the same:',
      aceptar: 'Remove',
      hecho: (nombre: string) => `MCP removed from ${nombre}.`,
    },
    copiaPrevia:
      'Before touching it, a dated copy is saved next to the file (<file>.wolfcore-YYYYMMDD-HHmmss.bak); the 5 newest are kept. If the agent is open, close it first.',
    copiaHecha: (ruta: string) => `Previous copy: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Open ${nombre}`,
      proyecto: 'Project',
      sinProyectos: 'There are no projects yet.',
      proveedor: 'AI provider',
      proveedorPropio: 'Whatever the agent has configured',
      proveedorAyuda:
        'With a provider, its key goes only into the environment of that terminal: it is never written to files or to the command line.',
      aceptar: 'Open terminal',
      hecho: (nombre: string) => `${nombre} opened in a new terminal.`,
    },
    costo: {
      titulo: 'Before opening an agent',
      texto:
        'An AI agent works with your provider account: every request consumes tokens and may cost money. It can also read and change the project files and run commands.',
      nunca:
        'WolfCore Dev never opens an agent on its own: you always ask for it. This notice is shown only once.',
      aceptar: 'Got it, open',
    },
  },
  depuracion: {
    descripcion:
      'See the dump(), dd() and wd() calls of your PHP sites and the wolfdump calls of your Python processes, with file and line. The page keeps responding the same.',
    receptor: 'Dump capture',
    escuchando: (direccion: string, puerto: number) => `Listening on ${direccion}:${puerto}`,
    apagado: 'Off',
    memoria:
      'Dumps are kept in memory only (the last 500) and are lost when closing. They may contain sensitive data: known keys are masked when copying.',
    sitios: 'Sites',
    sinSitios: 'There are no PHP or FastAPI sites.',
    sinPhp: 'Choose a PHP version for the site first.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Restart the site processes so they pick up wolfdump.',
    confirmarTitulo: (sitio: string) => `Enable capture on ${sitio}`,
    confirmarPhp:
      'Before each request, the PHP of this site will load a WolfCore Dev file (auto_prepend_file, only on this site) that defines dump(), dd() and wd() if the project does not define them. If your files declare their own dump() or dd() function without checking function_exists, PHP will show an error: disable capture in that case. The site switches to its own PHP.',
    usoPhp:
      'Laravel and Symfony: dump($x) and dd($x) as usual. CodeIgniter 3 and others: wd($x) sends without showing anything on the page.',
    confirmarPython:
      'The processes of this site will have the wolfdump module on their PYTHONPATH (nothing is written to the project). It applies from the next start of its processes.',
    usoPython: 'from wolfdump import dump  →  dump(value)',
    activar: 'Enable capture',
    cancelar: 'Cancel',
    filtroSitio: 'All sites',
    filtroOrigen: 'Any origin',
    buscar: 'Search text, file or URL',
    limpiar: 'Clear',
    confirmarLimpiar: 'Delete all dumps from memory?',
    vacio: 'No dump has arrived yet.',
    vacioApagado: 'Turn capture on and enable a site to start.',
    elegir: 'Pick a dump from the list.',
    copiar: 'Copy',
    copiado: 'Copied (with keys masked)',
    sinSitio: 'no site',
    total: (n: number) => `${n} in memory`,
    archivo: 'File',
    url: 'URL',
    pestanaVolcados: 'Dumps',
    pestanaErrores: 'Errors',
    erroresDescripcion:
      'Errors from the PHP, Nginx, laravel.log, CodeIgniter 3 and Python logs, grouped: the same error repeated shows up once with its count.',
    erroresVacio: 'No errors in the logs. They show up here as soon as they are written.',
    erroresElegir: 'Pick an error from the list.',
    actualizar: 'Refresh',
    abrirEditor: 'Open in editor',
    abrirEditorSinSitio: 'Only files inside a site folder can be opened.',
    veces: (n: number) => (n === 1 ? 'once' : `${n} times`),
    primera: 'First seen',
    ultima: 'Last seen',
    fuente: 'Log',
    traza: 'Trace (last time)',
    sinTraza: 'No trace.',
  },
  contenedores: {
    descripcion:
      'View and control the Docker or Podman containers on this computer. WolfCore Dev never creates, removes or pulls containers, images or volumes.',
    motor: 'Engine',
    refrescar: 'Refresh',
    detectando: 'Looking for Docker and Podman…',
    sinMotorTitulo: 'No Docker or Podman',
    sinMotor:
      'Neither Docker nor Podman was found on this computer. WolfCore Dev does not install them: if you need one, install it from its official page and press Refresh.',
    instalarDocker: 'Install Docker',
    instalarPodman: 'Install Podman',
    apagadoTitulo: (m: string) => `${m} is not responding`,
    apagado: (m: string) =>
      `${m} is installed, but its engine is not responding. Open Docker Desktop (or start the Podman machine with "podman machine start") and press Refresh.`,
    remoto:
      'A remote connection was ignored (DOCKER_HOST, CONTAINER_HOST, a context or a default connection): WolfCore Dev only uses the engine on this computer.',
    desdePath: 'Found on the PATH, not in the usual install folder.',
    version: (v: string) => `Version ${v}`,
    vacio: 'There are no containers.',
    columnas: {
      nombre: 'Name',
      imagen: 'Image',
      estado: 'State',
      puertos: 'Ports',
      compose: 'Compose',
      acciones: 'Actions',
    },
    estados: {
      corriendo: 'Running',
      detenido: 'Stopped',
      pausado: 'Paused',
      otro: 'Other',
    },
    codigoSalida: (n: number) => `code ${n}`,
    iniciar: 'Start',
    detener: 'Stop',
    reiniciar: 'Restart',
    registros: 'Logs',
    confirmarDetenerTitulo: 'Stop the container?',
    confirmarDetener: (n: string) =>
      `"${n}" will be stopped. Whatever runs inside is cut off (the engine waits a few seconds for it to finish). Nothing is removed.`,
    confirmarReiniciarTitulo: 'Restart the container?',
    confirmarReiniciar: (n: string) =>
      `"${n}" will be restarted. Whatever runs inside is cut off and starts again. Nothing is removed.`,
    confirmar: 'Confirm',
    cancelar: 'Cancel',
    hecho: {
      iniciar: (n: string) => `"${n}" started.`,
      detener: (n: string) => `"${n}" stopped.`,
      reiniciar: (n: string) => `"${n}" restarted.`,
    },
    registroTitulo: (n: string) => `Logs of "${n}"`,
    registroEsperando: 'Waiting for lines…',
    registroFin: 'The log ended (the container stopped or the engine closed it).',
    cerrar: 'Close',
  },
  versiones: {
    pestana: 'Versions',
    avisoMaven:
      'WolfCore Dev launches Maven directly with the JDK and, for security, does not read .mvn/jvm.config or the MAVEN_OPTS variable. If your project needs them, run Maven from a terminal.',
    avisoRuby:
      'Ruby is installed without the Devkit (MSYS2) and without touching your PATH or the Windows registry: there is no installer. Gems with native extensions that have no precompiled binary need the Devkit. This is a manual step: open a terminal from the project and run "ridk install" (it installs MSYS2 on your computer and downloads from the Internet).',
    avisoJdk:
      'Maven and Gradle run with a WolfCore Dev JDK, and none is installed yet. Install Java (Temurin) from the services list.',
    avisoMeilisearch:
      'Each Meilisearch minor version has its own data. If you switch to another minor version (for example, from 1.58 to 1.59), its indexes and the MEILISEARCH_KEY will be new: you will need to reindex and update your projects’ .env.',
    pestanaServicios: 'Services',
    elegirServicio: 'Service',
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
        'Each major version (8.4, 17…) has its own instance, with its data folder and port: you can run several at once. The star marks the one new projects use.',
      pool: 'Each running PHP version has its own PHP; the star marks the one for new projects.',
      unica:
        'You can install several versions, but only one runs: starting another one switches the active one.',
      ninguno:
        'There is nothing to start: projects use the version they ask for or the default one (star).',
    },
    filtroRama: 'Version',
    todasRamas: 'All versions',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Show all',
    anteriores: (n: number) => `Earlier patches (${n})`,
    origen: {
      vivo: 'Online',
      cache: (h: number) => (h < 1 ? 'Cached less than 1 h ago' : `Cached ${h} h ago`),
      fija: 'Offline list',
    },
    actualizarLista: 'Refresh list',
    errorCarga: 'Could not read the list of versions',
    vacio: 'There are no versions to show.',
    soporte: { lts: 'LTS', actual: 'Current', fin: 'Unsupported', preview: 'Preview' },
    finSoporte: (f: string) => `Supported until ${f}`,
    finSoportePasado: (f: string) => `Unsupported since ${f}`,
    marcas: {
      instalada: 'Installed',
      encendida: 'Running',
      actualizacion: (v: string) => `Update: ${v}`,
      bloqueada: 'Blocked',
      sinHuella: 'No published checksum',
      huellaDebil: 'MD5 checksum only',
      firmada: 'PGP-signed',
    },
    ayudaFirmada:
      'The official source signs this download with PGP: WolfCore Dev checks the signature against the keys pinned in the app before installing.',
    ayudaSinHuella:
      'The official source does not publish a strong checksum (SHA-256 or SHA-512): the download cannot be verified.',
    instalar: 'Install',
    desinstalar: 'Uninstall',
    encender: 'Start',
    apagar: 'Stop',
    actualizar: 'Update',
    usarEsta: 'Use this version',
    usarEstaAyuda: (id: string) =>
      `${id} uses another version of this service: it switches with a backup of its data first.`,
    predeterminada: 'Default for new projects',
    hacerPredeterminada: 'Use for new projects',
    predeterminadaHecha: (v: string) => `${v} is now the default.`,
    puerto: 'Port',
    puertoDe: (id: string) => `Port of ${id}`,
    cambiarPuerto: 'Change',
    puertoCambiado: (p: number) => `Port changed to ${p}.`,
    puertoProyectosTitulo: 'Projects with the previous port',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `These projects still use port ${viejo} in their .env (they were not changed): ${lista}. Change it to ${nuevo}.`,
    resolver: 'Resolve',
    instalada: (v: string) => `${v} installed.`,
    selector: { etiqueta: 'Instance', predeterminada: 'default', apagada: 'stopped' },
    dialogoSinHuella: {
      titulo: (v: string) => `Install ${v} without a checksum`,
      riesgo:
        'This version has no checksum published by its official source: WolfCore Dev cannot check that the downloaded file is the original one.',
      explicacion:
        'The download still uses HTTPS from the official site, but if that site or the connection were compromised, it would go unnoticed. Install it only if you need it.',
      alternativa: (v: string) => `There is a verified version of the same service: ${v}.`,
      casilla: 'I understand the risk and want to install it unverified',
      instalarVerificada: (v: string) => `Install ${v} (verified)`,
      instalarIgual: 'Install unverified',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Update ${n}`,
      tituloRama: (v: string) => `New version: ${v}`,
      ninguna: 'none',
      instancia: (id: string) => `Instance ${id} is updated. Before anything changes:`,
      pasoInstalar: (v: string) =>
        `${v} is installed next to the current version (which is not removed);`,
      pasoVolcados: 'every database is dumped with the current version;',
      pasoCopia: 'it is stopped and the whole data folder is copied (cold copy);',
      pasoArrancar: 'it starts with the new version and is checked to respond;',
      pasoVuelta:
        'if it does not start, it goes back to the previous version with its data and the copy is kept.',
      datos: 'Data:',
      respaldo: 'Copy at:',
      espacio: 'Space:',
      espacioLibre: (libres: string, necesarios: string) => `${libres} free; ${necesarios} needed`,
      datosQuedan:
        'Previous data is never deleted: the copy and the dumps stay in Update backups until you delete them.',
      sinEspacio: 'There is not enough space for the copy: free some space and try again.',
      alLado: (v: string) =>
        `${v} is installed. Other installed versions are untouched; projects that pin another version keep using it.`,
      ramaExplicacion:
        'A new major version does not replace the old one: a new instance is created with its own data folder and port. The current instance stays as it is.',
      copiarDesdeTitulo: 'Data of the new instance',
      copiarDesde: (id: string) =>
        `Copy data from ${id} (dumped and restored; the original is untouched)`,
      vacia: 'Start empty',
      ramaNota:
        'Database users are not copied; projects must point to the port of the new instance.',
      crearInstancia: 'Create new instance',
      confirmar: 'Update with backup',
      hecho: (v: string) => `${v} updated.`,
      fallo: 'Could not update',
      ramaCreada: (id: string) => `Instance ${id} created.`,
      copiadas: (l: string) => `Copied: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} was not copied: ${m}`,
    },
    limpieza: {
      boton: 'Clean up unused versions…',
      titulo: 'Clean up unused versions',
      intro:
        'Only the programs of versions nothing uses are removed (the bin folder). Database data, instances and your projects are never touched.',
      cargando: 'Looking for versions…',
      vacia: 'No versions are installed.',
      sinLibres: 'Every installed version is in use: there is nothing to clean up.',
      fallo: 'Could not clean up',
      fallaLista: 'Could not read the list of versions',
      bloqueada: 'Cannot be selected',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'version' : 'versions'} · ${tam}`,
      destinoTitulo: 'What to do with them',
      papelera: 'Move to the recycle bin: kept for 7 days and still using disk space until then',
      definitivo: 'Delete permanently: frees the space now and cannot be undone',
      avisoDefinitivo:
        'Permanent deletion: to have these versions again you will have to download them again.',
      instantanea:
        'With permanent deletion, a copy of the environment configuration is saved first; versions in the recycle bin can be recovered.',
      entiendo: 'I understand this cannot be undone',
      confirmar: (n: number) => `Remove ${n} ${n === 1 ? 'version' : 'versions'}`,
      motivos: {
        predeterminada: 'It is the default',
        encendida: 'It is running',
        sitio: 'A project uses it',
        instancia: 'An instance uses it (even if stopped)',
        plantilla: 'A template uses it',
        workspace: 'A workspace uses it',
        runtime: 'A project uses it',
        tarea: 'A project with scheduled tasks uses it',
        duda: 'Could not be checked: left alone',
        datos: 'It has data that only this version can open',
        herramienta: 'phpMyAdmin or Adminer uses it',
      },
      resultadoTitulo: 'Result',
      liberadas: (tam: string) => `${tam} freed.`,
      enPapelera: (tam: string) => `${tam} are in the recycle bin (purged after 7 days).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'version is already out of bin but leftovers remain' : 'versions are already out of bin but leftovers remain'} and will be retried when the app opens.`,
      instantaneaGuardada: 'Environment copy saved before deleting.',
      ajeno: (lista: string) =>
        `It contains what you installed inside: ${lista}. Removing it loses that.`,
      incluirAjeno: 'Remove it even if that is lost',
      sinCatalogo:
        'It is no longer in the catalog: if you remove it, you will not be able to download it again.',
      papeleraTitulo: 'In the recycle bin',
      recuperar: 'Recover',
      recuperada: (v: string) => `${v} recovered.`,
      borradaEl: (f: string) => `Deleted on ${f}`,
      fallaRecuperar: 'Could not recover',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Uninstall ${v}`,
      binario: 'Only the programs of this version are removed.',
      instancia: (id: string) =>
        `Instance ${id} uses it: it is stopped and removed from the list of instances.`,
      datosQuedan:
        'Its data stays on disk: if you install this version again, the instance opens it again.',
      borrarDatos: 'Also delete the data',
      borrarAviso: (id: string) =>
        `The data folder of ${id} will be deleted with all its databases. This cannot be undone. Type "${id}" to confirm.`,
      escriba: (id: string) => `Type ${id} to confirm`,
      desinstalar: 'Uninstall',
      desinstalarYBorrar: 'Uninstall and delete data',
      unica:
        'This is the active version: if it is the only one installed it can be removed with the service stopped (it ends up uninstalled); if there are others, make another one active first (star).',
      predeterminada: (id: string) =>
        `${id} is the default instance: Databases, the .env block and the tools that use the engine will switch to another instance (with another port).`,
      hecho: (v: string) => `${v} uninstalled.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Resolve ${id}`,
      explicacion:
        'An update failed and the data of this instance could not be restored, so it will not start until you choose what to do. Nothing is deleted.',
      fallida: 'Touched data:',
      respaldo: 'Backup:',
      opciones: 'What to do',
      devolver: (sello: string, tam: string) =>
        `Restore backup ${sello} (${tam}); the current folder is moved aside, not deleted`,
      usarActual: 'Use the current data folder as it is',
      notaActual: 'Only if the current folder has complete data; if it does not, choose a backup.',
      notaDevolver: 'The backup is copied, checked and only then put in place.',
      escriba: (id: string) => `Type ${id} to confirm`,
      elegirVersion:
        'The block marker could not be read: choose which version will open the data (the one before the update).',
      version: 'Version',
      confirmar: 'Resolve',
      hecho: (id: string) => `${id} unblocked. You can start it now.`,
    },
    respaldos: {
      titulo: 'Update backups',
      descripcion:
        'Copies left by updates and new versions. The data folder each instance uses never shows up here.',
      vacio: 'There are no copies.',
      tipos: {
        respaldo: 'Cold copy',
        volcados: 'Database dumps',
        fallida: 'Data of a failed version',
        restaurando: 'Half-done restore',
        copia: 'Dumps for a new version',
      },
      archivos: (n: number) => (n === 1 ? '1 file' : `${n} files`),
      borrar: 'Delete',
      borrarDe: (n: string) => `Delete ${n}`,
      confirmarTitulo: 'Delete copy',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) will be deleted. This cannot be undone. The data the instances use is untouched.`,
      borrado: 'Copy deleted.',
    },
  },
  navGrupos: {
    trabajo: 'Work',
    entorno: 'Environment',
    utilidades: 'Utilities',
  },
  avisos: {
    campana: 'Notices',
    campanaConNuevos: (n: number) => `Notices: ${n} unread`,
    titulo: 'Notice center',
    vacio:
      'No notices. Service outages, ports in use and certificates about to expire will show up here.',
    marcarTodos: 'Mark all as read',
    limpiar: 'Clear history',
    ver: 'View',
    actualizar: 'Update',
    verVersiones: 'View versions',
    cerrar: 'Close',
    niveles: { info: 'Information', aviso: 'Warning', error: 'Error' },
    sinLeer: 'Unread',
  },
  memoria: {
    boton: 'Memory',
    tituloBoton: 'Optimize memory',
    titulo: 'Memory optimizer',
    intro:
      'Pick a mode and review the list. Nothing is closed or stopped until you confirm, and it never runs on its own.',
    modo: 'Mode',
    modos: { liviano: 'Light', moderado: 'Moderate', profundo: 'Deep' },
    descripciones: {
      liviano: 'Clears the app cache. It frees disk space; it does not close or stop anything.',
      moderado:
        'Also offers to leave a single PHP worker and to stop WolfCore Dev services with no activity or connections. Services start unchecked.',
      profundo:
        'Also lists your own memory-hungry programs so you can ask them to close their window. They start unchecked.',
    },
    ver: 'Show the list',
    revisando: 'Checking…',
    vacio: 'There is nothing to free in this mode.',
    tipos: {
      'cache-app': 'Clear cache',
      'reducir-pool': 'Leave a single worker',
      'detener-inactivo': 'Stop (idle)',
      'cerrar-programa': 'Ask it to close its window',
    },
    caches: {
      sesion: 'HTTP cache of the application session',
    },
    estimado: (cantidad: string) => `About ${cantidad} of RAM would be freed`,
    estimadoDisco: (cantidad: string) => `Plus about ${cantidad} of disk (the cache is not RAM)`,
    marcadas: (n: number, total: number) => `${n} of ${total} checked`,
    sinDatos:
      'There is not enough activity data yet to offer stopping services or reducing PHP. Leave Home open for a few minutes and look again.',
    listadoFallido:
      'The list of open programs could not be read: this list may be incomplete. Try again.',
    avisoDetener:
      'Idle services start unchecked: stopping one cuts off whatever uses it. Only those with no connections right now are listed.',
    avisoCerrar:
      'Programs are only asked to close their window, like clicking the X: they may ask whether to save. A program is never forced or terminated.',
    protegidos:
      'System programs, Windows services, elevated programs, other users, FlyEnv, PhpWebStudy and WolfCore Dev (or anything they launch) never appear.',
    aplicar: 'Apply the checked ones',
    confirmarTitulo: 'Apply these actions?',
    confirmarTexto: (n: number) =>
      n === 1 ? '1 action from the list will run.' : `${n} actions from the list will run.`,
    confirmarCerrar: (nombres: string) =>
      `These programs will be asked to close their window: ${nombres}.`,
    confirmarDetener: (nombres: string) => `These services will be stopped: ${nombres}.`,
    confirmar: 'Yes, apply',
    cancelar: 'Cancel',
    resultadoTitulo: 'Result',
    liberado: (cantidad: string) => `Estimated: about ${cantidad} of RAM freed`,
    liberadoDisco: (cantidad: string) => `Plus about ${cantidad} of disk`,
    notaPedido:
      'Waiting for you: the window was asked to close and the program is still open (it may be asking whether to save). It is not counted as freed.',
    estados: { hecho: 'Done', pedido: 'Waiting for you', saltado: 'Skipped', error: 'Failed' },
    motivos: {
      no_en_plan: 'It was not in the list',
      protegido: 'It is a protected program',
      cambio: 'It changed since the list was shown',
      sin_ventana: 'It no longer has a window to close',
      ya_apagado: 'There was nothing left to reduce',
      ocupado: 'It was busy (it has connections)',
      no_se_pudo: 'The close request could not be sent (the program runs with elevated rights)',
    },
    otraVez: 'Start over',
  },
  guias: {
    tuneles: { titulo: 'Tunnels guide', copiar: 'Copy the command' },
    http: {
      buscar: 'Search by number, name or text',
      familia: 'Family',
      todas: 'All',
      verMetodos: 'Methods',
      verCodigos: 'Status codes',
      resultados: (n: number) => `${n} ${n === 1 ? 'result' : 'results'}`,
      vacio: 'Nothing matches the search.',
      seguro: 'Safe',
      noSeguro: 'Not safe',
      idempotente: 'Idempotent',
      noIdempotente: 'Not idempotent',
      noEstandar: 'Non-standard',
      broma: 'Joke code (RFC 2324)',
      causas: 'Common causes',
      solucion: 'How to fix it',
      ejemplo: 'Example',
      copiarEjemplo: 'Copy the example',
      probar: 'Try it',
      probarTitulo: 'Try this example in the HTTP client (nothing is sent until you press Send)',
      servidorActivo: (puerto: number) =>
        `Example server running at 127.0.0.1:${puerto} while you use the guide or the HTTP client. It is reachable from this computer only and stops when you leave or after 10 min unused.`,
      sinTraduccion: 'Not translated into this language: shown in English.',
      familias: {
        '1xx': '1xx Informational',
        '2xx': '2xx Success',
        '3xx': '3xx Redirection',
        '4xx': '4xx Client error',
        '5xx': '5xx Server error',
      },
    },
    git: {
      buscar: 'Search for a topic or command',
      verGuia: 'Guide',
      verLaboratorio: 'Lab',
      todos: 'All',
      grupos: {
        basico: 'The basics',
        ramas: 'Branches',
        deshacer: 'Undoing',
        remotos: 'Remotes and tags',
        github: 'GitHub',
      },
      resultados: (n: number) => `${n} ${n === 1 ? 'topic' : 'topics'}`,
      vacio: 'Nothing matches the search.',
      ejemplo: 'Example',
      errores: 'Common mistakes',
      copiarEjemplo: 'Copy the example',
      peligroso: 'Dangerous',
      sinTraduccion: 'Not translated into this language: shown in English.',
      avisoGithub:
        'This part is explanation only: WolfCore Dev does not create accounts, sign in to GitHub or use tokens from this guide. The names and values in the examples are made up.',
      irLaboratorio: 'Practise in the lab',
      lab: {
        intro:
          'A practice repository and a local “remote”, in a folder that belongs to WolfCore Dev. It does not use the internet or GitHub, and it does not touch your projects or your git settings.',
        sinGit: {
          titulo: 'Git is not installed',
          texto:
            'The lab uses your system’s git and cannot open without it. Install Git and reopen this tab; WolfCore Dev does not install anything for you.',
        },
        cargando: 'Preparing the lab…',
        reiniciar: 'Reset lab',
        reiniciarAyuda: 'Deletes only the practice folder and leaves it as new.',
        reiniciado: 'Lab reset.',
        version: (v: string) => `git ${v}`,
        ordenes: 'Commands',
        mensaje: 'Commit message',
        mensajePorDefecto: 'Practice change',
        rama: 'Branch',
        etiqueta: 'Tag',
        archivo: 'File',
        grupos: {
          basico: 'The basics',
          ramas: 'Branches',
          guardar: 'Save and undo',
          remoto: 'Local remote',
        },
        archivos: {
          titulo: 'Practice files',
          ayuda: 'Only these files can be edited, with text of up to 2000 characters.',
          guardar: 'Save file',
          guardado: 'File saved.',
          areaTexto: (n: string) => `Contents of ${n}`,
        },
        salida: 'Output',
        salidaVacia: 'Press a command to see git’s answer here.',
        codigo: (n: number) => (n === 0 ? 'Finished fine' : `Finished with code ${n}`),
        truncada: 'The output was cut short.',
        historial: 'History',
        historialVacio: 'There are no commits yet: run git init, git add and git commit.',
        conflicto: {
          titulo: 'Guided exercise: a conflict',
          intro:
            'Two branches change the same line. You will see how the conflict appears and how to resolve it.',
          paso: (n: number, total: number) => `Step ${n} of ${total}`,
          ejecutar: 'Run this step',
          hecho: 'Done',
          reempezar: 'Start over',
          esperado: 'Git reported the conflict: that is expected at this step.',
          elegir: {
            mia: 'Keep the one from main (green)',
            otra: 'Keep the one from rama-a (red)',
            ambas: 'Keep both',
          },
          final: 'Done: you resolved a conflict. Look at the history.',
          pasos: [
            {
              titulo: 'Prepare the lab',
              texto:
                'The lab is reset and the first commit is made with colores.txt (“color: azul”).',
            },
            {
              titulo: 'Change the line on rama-a',
              texto:
                'The rama-a branch is created, the line becomes “color: rojo” and it is committed.',
            },
            {
              titulo: 'Change the same line on main',
              texto: 'It goes back to main, the line becomes “color: verde” and it is committed.',
            },
            {
              titulo: 'Try the merge',
              texto:
                'rama-a is merged into main. Git cannot tell which line to keep and leaves a conflict.',
            },
            {
              titulo: 'Choose a version',
              texto:
                'Choose which version of the line to keep. colores.txt now has the conflict markers.',
            },
            {
              titulo: 'Confirm the resolution',
              texto: 'colores.txt is staged (add) and the commit that closes the merge is made.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `A light editor with highlighting for text files up to ${mb} MB. Choose the file in the system dialog; saving always asks for confirmation and first leaves a copy in the WolfCore Dev data folder.`,
    abrir: 'Open file…',
    abriendo: 'Opening…',
    guardar: 'Save',
    guardando: 'Saving…',
    recargar: 'Reload from disk',
    vacio: 'Open a file to start editing.',
    sinCambios: 'No changes',
    conCambios: 'Unsaved changes',
    posicion: (linea: number, columna: number) => `Line ${linea}, column ${columna}`,
    areaTexto: (nombre: string) => `Code editor: ${nombre}`,
    salirTeclado: 'To leave the editor with the keyboard, press Esc and then Tab.',
    guardado: 'File saved.',
    copiaPrevia: (ruta: string) => `Backup copy: ${ruta}`,
    cancelar: 'Cancel',
    enlaceDuro:
      'This file has more than one name on disk (a hard link). Saving it breaks that link: the other names keep the old content.',
    saltosMixtos: {
      aviso: 'This file mixes line endings. Saving normalizes them all to LF.',
      aceptar: 'I accept normalizing the line endings',
    },
    envGestor: {
      aviso:
        '.env files are edited in the project variables, with their secrets flow. The button opens the .env in the project root, which may not be the file you tried to open.',
      boton: 'Open the .env in the project root',
    },
    huellaPerdida: 'Saved, but the new fingerprint could not be read: the file was reloaded.',
    confirmarGuardar: {
      titulo: 'Save changes',
      texto: (nombre: string) =>
        `${nombre} is about to be written. First, a copy of what is on disk now is saved in the WolfCore Dev data folder.`,
      boton: 'Save with a backup copy',
    },
    refuerzo: {
      abrirTitulo: 'Sensitive file',
      guardarTitulo: 'Save a sensitive file',
      secreto:
        'This file looks like it contains secrets (private keys, tokens or credentials). Its content will be shown on screen.',
      datosReales:
        'This file belongs to a site marked as holding real data. A wrong change can affect real information.',
      instruccion: (nombre: string) => `To continue, type the file name: ${nombre}`,
      etiqueta: 'File name',
      abrirBoton: 'Open anyway',
      guardarBoton: 'Save anyway',
    },
    cambioExterno: {
      titulo: 'The file changed outside the editor',
      texto:
        'Another program modified it since you opened it, so nothing was saved. You can reload it (your changes are lost) or overwrite it with what you have here.',
      recargar: 'Reload and discard my changes',
      sobrescribir: 'Overwrite…',
      sobrescribirTitulo: 'Overwrite the file',
      sobrescribirTexto:
        'The changes made by the other program will be lost. Its current content will stay in the backup copy.',
      sobrescribirBoton: 'Yes, overwrite',
      volver: 'Go back',
    },
    descartar: {
      titulo: 'Unsaved changes',
      texto: 'There are unsaved changes in the editor. If you continue, they are lost.',
      confirmar: 'Discard changes',
      seguir: 'Keep editing',
    },
    cm: {
      'Control character': 'Control character',
      'Selection deleted': 'Selection deleted',
      'Go to line': 'Go to line',
      go: 'go',
      Find: 'Find',
      Replace: 'Replace',
      next: 'next',
      previous: 'previous',
      all: 'all',
      'match case': 'match case',
      regexp: 'regexp',
      'by word': 'by word',
      replace: 'replace',
      'replace all': 'replace all',
      close: 'close',
      'current match': 'current match',
      'on line': 'on line',
      'replaced match on line $': 'replaced match on line $',
      'replaced $ matches': 'replaced $ matches',
      'folded code': 'folded code',
      unfold: 'unfold',
      to: 'to',
    },
  },
  limpiezaDisco: {
    intro:
      'First it analyzes and shows how much each item takes. Nothing is deleted until you confirm, and it never runs on its own or in the background.',
    analizar: 'Analyze',
    analizando: 'Analyzing…',
    cancelarAnalisis: 'Cancel',
    vacio: 'There is nothing to clean.',
    categorias: {
      temp: {
        nombre: 'Temporary files',
        ayuda:
          'Files in your TEMP folder older than 24 hours. Deleted permanently; they regenerate on their own.',
      },
      'cache-chrome': {
        nombre: 'Google Chrome cache',
        ayuda: 'Only the cache folders of each profile; never cookies, passwords or history.',
      },
      'cache-edge': {
        nombre: 'Microsoft Edge cache',
        ayuda: 'Only the cache folders of each profile; never cookies, passwords or history.',
      },
      'cache-brave': {
        nombre: 'Brave cache',
        ayuda: 'Only the cache folders of each profile; never cookies, passwords or history.',
      },
      'cache-firefox': {
        nombre: 'Firefox cache',
        ayuda: 'Only the cache2 folder of each profile; never cookies, passwords or history.',
      },
      'wolfcore-descargas': {
        nombre: 'WolfCore Dev cached downloads',
        ayuda: 'Loose archives that are no longer used. Sent to the recycle bin.',
      },
      'wolfcore-registros': {
        nombre: 'WolfCore Dev logs',
        ayuda: 'Logs older than 30 days. Sent to the recycle bin.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          'Optional. Windows regenerates it, but it needs WolfCore Dev to run as administrator.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Browser open or running in the background: close it completely to clean its cache (in Edge, also turn off startup boost and background extensions)',
      'requiere-admin': 'Requires running WolfCore Dev as administrator',
      'ruta-vetada': 'Protected path: not cleaned',
      'temp-no-seguro':
        'The TEMP variable points to a folder that is not the user temporary folder (Documents, a whole drive, a network path…): not cleaned',
    },
    borradoDefinitivo: 'Deleted permanently (they regenerate on their own)',
    borradoPapelera: 'Sent to the system recycle bin',
    archivos: (n: number) => (n === 1 ? '1 file' : `${n} files`),
    carpetas: 'By folder',
    truncado: 'The analysis stopped at the file limit: there is more than shown.',
    marcadas: (n: number, t: number) => `${n} of ${t} categories selected`,
    total: (b: string) => `About ${b} would be freed`,
    limpiar: 'Clean selected',
    confirmarTitulo: 'Clean these categories?',
    confirmarTexto: (n: number) => `${n} categories will be cleaned.`,
    confirmarDefinitivo: 'TEMP and caches are deleted permanently (they regenerate on their own).',
    confirmarPapelera: 'WolfCore Dev logs and downloads go to the recycle bin.',
    confirmarPrefetch:
      'Prefetch: Windows regenerates it, but the first launches of programs may be a bit slower.',
    confirmar: 'Yes, clean',
    cancelar: 'Cancel',
    detener: 'Stop cleaning',
    resultadoTitulo: 'Result',
    liberado: (b: string) => `Freed: ${b}`,
    enPapelera: (b: string) =>
      `Of that, ${b} is in the recycle bin (the space returns when you empty it).`,
    saltados: (n: number) => `${n} files were skipped`,
    cancelado: 'Cleanup cancelled: what was already deleted stays deleted.',
    topeEjecucion: 'The per-run file limit was reached: analyze and clean again to continue.',
    registroFallido:
      'The cleanup log could no longer be written, so the cleanup stopped: what was deleted is logged up to that point.',
    motivos: {
      'en-uso': 'In use',
      enlace: 'Link or reparse point (not followed)',
      protegido: 'Protected (.env, FlyEnv or similar)',
      cambio: 'Changed since the analysis',
      'sin-papelera': 'No recycle bin available',
      ilegible: 'Could not be read',
      error: 'Error while deleting',
    },
    verRegistros: 'View the logs',
    registroEn: (r: string) => `Log of this cleanup: ${r}`,
    otraVez: 'Start over',
    protegidas:
      'Never touched: data, backups, projects, databases or .env files. Links are not followed and nothing outside the paths in this list is touched.',
  },
  barra: {
    paleta: 'Search or run a command',
    atajoPaleta: 'Ctrl+K',
    tema: 'Change theme',
    idioma: 'Change language',
  },
  preferencias: {
    titulo: 'Appearance and language',
    descripcion: 'Changes apply right away and are saved on this computer.',
    tema: 'Theme',
    temas: { sistema: 'System', claro: 'Light', oscuro: 'Dark' },
    idioma: 'Language',
    idiomas: {
      es: 'Español',
      en: 'English',
      pt: 'Português',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      ru: 'Русский',
      zh: '简体中文',
      ja: '日本語',
      ko: '한국어',
      hi: 'हिन्दी',
      tr: 'Türkçe',
      id: 'Bahasa Indonesia',
      pl: 'Polski',
      nl: 'Nederlands',
      uk: 'Українська',
    },
    /** Aviso junto a los idiomas que no son es, en, pt ni fr (la traducción es automática y revisada). */
    traduccionAutomatica: 'Machine translation, reviewed',
    acento: 'Accent color',
    acentos: {
      indigo: 'Indigo',
      azul: 'Blue',
      verde: 'Green',
      violeta: 'Violet',
      naranja: 'Orange',
      rosa: 'Pink',
    },
    acentoPropio: (color: string) => `Custom (${color})`,
    errorGuardar: 'Could not save the preference',
    asistente: 'Welcome tour',
    asistenteAyuda:
      'Watch the tour of the main screens again: services, projects, databases, tools and Doctor.',
    asistenteAbrir: 'Watch the tour',
    avanzadas: 'Show advanced sections',
    avanzadasAyuda:
      'Adds the rarely used screens to the sidebar, such as Containers. They are also reachable with Ctrl+K.',
  },
  paleta: {
    titulo: 'Command palette',
    placeholder: 'Search for a screen, a service, a project or a tool…',
    sinResultados: 'No command matches the search.',
    ayuda: '↑ ↓ to move · Enter to run · Esc to close',
    grupos: {
      navegacion: 'Go to',
      servicios: 'Services',
      proyectos: 'Projects',
      herramientas: 'Tools',
      github: 'GitHub',
      general: 'General',
    },
    irA: (pantalla: string) => `Go to ${pantalla}`,
    encender: (servicio: string) => `Start ${servicio}`,
    apagar: (servicio: string) => `Stop ${servicio}`,
    iniciarTodo: 'Start all services',
    detenerTodo: 'Stop all services',
    iniciarWorkspace: (n: string) => `Start the ${n} workspace`,
    detenerWorkspace: (n: string) => `Stop the ${n} workspace`,
    abrirSitio: (nombre: string) => `Open ${nombre} in the browser`,
    traerCambios: (nombre: string) => `Pull changes in ${nombre}`,
    irAServicio: (nombre: string) => `Go to the ${nombre} service`,
    irAProyecto: (nombre: string) => `Go to the ${nombre} project`,
    versionesDe: (nombre: string) => `${nombre} versions`,
    abrirHerramienta: (nombre: string) => `Open ${nombre}`,
    clonar: 'Clone a repository from GitHub',
    agregarProyecto: 'Add a project',
    nuevoProyecto: 'Create a new project',
    tema: (tema: string) => `Theme: ${tema}`,
    idioma: (idioma: string) => `Language: ${idioma}`,
    asistente: 'Watch the welcome tour',
  },
  nuevoProyecto: {
    titulo: 'New project',
    boton: 'New project',
    descripcion:
      'Create a project from scratch: the folder, the HTTPS site, the database and its connection.',
    pasos: { tipo: 'Type', datos: 'Details', resumen: 'Summary', crear: 'Creating' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Via Composer; app key, database and migrations.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Official appstarter with its .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Classic framework with database.php configured.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Official skeleton (or webapp) with its .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Virtual environment, requirements.txt and a uvicorn process.',
      },
      wordpress: {
        nombre: 'WordPress',
        descripcion: 'Official download with wp-config.php ready.',
      },
      estatico: {
        nombre: 'Static site',
        descripcion: 'HTML and CSS served by Nginx, no database.',
      },
    },
    campos: {
      nombre: 'Project name',
      nombrePlaceholder: 'mi-tienda',
      nombreAyuda: (dominio: string) =>
        `It will be ${dominio}: lowercase letters, numbers and hyphens.`,
      carpeta: 'Parent folder',
      elegirCarpeta: 'Choose folder…',
      cambiarCarpeta: 'Change folder…',
      carpetaAyuda:
        'The project is created in a new folder with its name inside this one. It must be empty or not exist.',
      php: 'PHP version',
      python: 'Python version',
      sinInstalada: 'None installed: install one from Services.',
      conBase: 'Create a database for the project',
      sinBase: 'No database',
      instancia: 'Database server',
      apagada: 'off',
      apagadaAyuda: 'That server is off: turn it on in Services before creating the project.',
      sinMotores: 'No database server is installed for this type of project.',
      nombreBase: 'Database name',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'None', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Include the web packages (webapp)',
      pgvector: 'Enable pgvector (vector search)',
    },
    huella: {
      titulo: 'WordPress only publishes a weak checksum',
      riesgo:
        'The published checksum is SHA-1, an algorithm no longer considered secure, and it comes from the same site as the file.',
      explicacion:
        'If that site or the connection were compromised, a tampered download would pass the check. The download is still over HTTPS from wordpress.org. Continue only if you trust that source.',
      leyendo: 'Reading the published checksum…',
      noDisponible:
        'The checksum could not be read now (offline or the source did not answer); it will be read again when creating.',
      fuente: 'Source: wordpress.org',
      casilla: 'I understand the checksum is weak and I want to create the project anyway',
    },
    resumen: {
      titulo: 'This will be created',
      intro: 'Review before starting.',
      tipo: 'Type',
      carpeta: 'Folder',
      sitio: 'Site',
      dominio: 'Domain',
      https: 'HTTPS address',
      php: 'PHP',
      python: 'Python',
      base: 'Database',
      env: 'Connection written to',
      nota: 'If a step fails nothing is deleted: you will see what was created and can retry.',
    },
    errores: {
      nombreVacio: 'Enter a project name.',
      nombreInvalido:
        'The name can only have lowercase letters, numbers and hyphens (up to 40), and cannot start or end with a hyphen.',
      sinCarpeta: 'Choose the parent folder of the project.',
      sinPhp: 'Choose a PHP version (install one from Services if there is none).',
      sinPython: 'Choose a Python version (install one from Services if there is none).',
      sinInstancia: 'Choose the server where the database is created, or untick the database.',
      baseInvalida: 'The database name is not valid for this engine.',
      motorNoVale: 'WordPress needs MySQL or MariaDB.',
      pgvectorMotor: 'pgvector needs PostgreSQL.',
      huellaDebil: 'Confirm that you understand the WordPress checksum is weak.',
    },
    acciones: {
      cambiarCarpeta: 'Choose another folder',
      cambiarBase: 'Change the database name',
      cambiarNombre: 'Change the name',
      reintentarPaso: 'Retry the step',
      servicios: 'Go to Services',
      confirmarHuella: 'Review the confirmation',
    },
    botones: {
      siguiente: 'Next',
      atras: 'Back',
      crear: 'Create project',
      creando: 'Creating…',
      cerrar: 'Close',
      abrirEditor: 'Open in editor',
      verSitio: 'View the site',
      verProyecto: 'View in Projects',
    },
    progreso: {
      titulo: 'Creating the project',
      listo: 'Project created.',
      fallo: (paso: string) =>
        `Step “${paso}” failed. Nothing was deleted: retry the step or fix the problem and try again.`,
      quedo: (partes: string) => `This was created: ${partes}.`,
      quedoCarpeta: 'the folder',
      quedoBase: (nombre: string) => `database ${nombre}`,
      quedoSitio: 'the site',
      avisos: 'Warnings',
      sinUsuarioPropio:
        'System encryption is not available: the project uses the database administrator connection. Once it is available, use "Use own user" in the .env manager.',
      editorFallo: 'The editor could not be opened.',
    },
  },
  importar: {
    boton: 'Import…',
    titulo: 'Import from Laragon, XAMPP or Herd',
    intro:
      'Sites are linked where they are: no folder is moved, copied or modified. If you want, their databases are copied too. WolfCore Dev only reads the other programs’ installations.',
    buscando: 'Looking for installations…',
    nada: 'Laragon, XAMPP and Herd were not found in the usual folders.',
    errorVista: 'Could not look for what can be imported',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Sites',
      todos: 'Select all',
      ninguno: 'Clear all',
      dominio: (d: string) => `Domain ${d}`,
      dominioPropuesto: (d: string) => `Domain ${d} (suggested)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP not determined',
      base: (nombre: string, motor: string) => `Database ${nombre} (${motor})`,
      yaVinculado: 'Already a WolfCore Dev site',
      dominioEnUso: 'Another site already uses that domain',
    },
    avisos: {
      sin_dominio: 'It has no domain in the other program: one is suggested.',
      dominio_invalido: 'Its domain is not valid: one is suggested.',
      sin_vhost: 'It has no virtual host of its own: a domain is suggested.',
      php_desconocido: 'It is not known which PHP version it uses: an installed one is chosen.',
      base_no_local: 'Its database is on another server: it is not imported.',
      base_nombre_invalido: 'Its database name is not valid: it is not imported.',
      motor_no_soportado: 'Its database is not MySQL or MariaDB: it is not imported.',
    },
    problemas: {
      titulo: (n: number) =>
        `${n} ${n === 1 ? 'thing was' : 'things were'} discarded or could not be read`,
    },
    bases: {
      titulo: 'Databases',
      importarBases: 'Also import the databases',
      ayuda:
        'Start the other program’s database server before continuing: WolfCore Dev does not start or stop other programs. The password is only used for this import and is not saved.',
      destino: 'Destination server',
      apagada: 'stopped',
      sinMotores:
        'MySQL and MariaDB are not installed: install them from Services to import databases.',
      puerto: 'Source server port',
      usuario: 'User',
      clave: 'Password',
      claveAyuda: 'Leave it empty if the user has no password (like root in Laragon or XAMPP).',
      existe: 'already exists at the destination',
      reemplazar: 'Replace (a backup is made first)',
      noSeToca: 'It is left alone unless you tick it.',
    },
    pasos: { elegir: 'Choose', confirmar: 'Confirm' },
    continuar: 'Continue',
    volver: 'Back',
    cancelar: 'Cancel',
    importar: 'Import',
    cerrar: 'Close',
    sinSeleccion: 'Choose at least one site.',
    origenIncompleto: 'Enter the port and user of the source server.',
    confirmar: {
      titulo: 'Confirm the import',
      sitios: (n: number) =>
        `${n} ${n === 1 ? 'site' : 'sites'} will be linked in their current folder. No file is moved, copied or modified.`,
      sinConfianza: 'No imported site runs recipes until you tick “I trust this repository”.',
      hosts:
        'Nginx and the hosts file will be updated (Windows may ask for administrator permission).',
      basesNuevas: (nombres: string) => `These databases will be copied: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `These databases already exist and will be replaced: ${nombres}. A backup of each is made first.`,
      basesSinTocar: (nombres: string) =>
        `These databases already exist and will not be touched: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `They will be dumped from the other program’s server (127.0.0.1:${puerto}, user ${usuario}). It is only read, never modified.`,
      sinBases: 'No database will be imported.',
      proteccion:
        'Each database structure is checked first and the data goes in with a limited user: if anything fails, the database is left as it was.',
    },
    resultado: {
      titulo: 'Import result',
      importando: 'Importing…',
      cancelar: 'Cancel import',
      restaurada:
        'The original database was put back automatically from its backup: it is as it was.',
      sitioOk: 'Imported',
      sitioFallo: 'Not imported',
      baseOk: (n: string) => `Database ${n} imported`,
      baseFallo: (n: string) => `Database ${n} not imported`,
      copiaPrevia: (ruta: string) => `Backup of the previous database: ${ruta}`,
      phpDistinto: (v: string) => `PHP ${v} was used (the original version is not installed).`,
      sinAplicar:
        'Nginx or the hosts file were not brought up to date: check the notice in Projects and try again.',
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'site' : 'sites'} imported, ${b} ${b === 1 ? 'database' : 'databases'} imported.`,
      errorImportar: 'Could not import',
    },
  },
  plantillas: {
    guardarComo: 'Save as template…',
    dialogo: {
      titulo: (nombre: string) => `Save “${nombre}” as a template`,
      intro:
        'The template stores the recipe, the PHP and Nginx settings, the extensions and the database schema (structure only, no rows). It never stores passwords, keys or database data.',
      nombre: 'Template name',
      nombrePlaceholder: 'My base project',
      conArchivos: 'Also include the project files',
      conArchivosAyuda: 'Without this only the recipe, the settings and the schema are saved.',
      siempre: 'Always left out',
      siempreLista:
        '.env and .env.*, vendor, node_modules, .git, .venv, logs, dumps and file databases (*.sql, *.dump, *.sqlite), keys and certificates (*.pem, *.key, *.crt…), wp-config.php and wolfcore.yml. A file that contains a key or a password is also left out.',
      extra: 'Also exclude (one per line)',
      extraAyuda: 'Names or paths relative to the project, for example uploads or public/build.',
      vista: 'What will be saved',
      calculando: 'Calculating…',
      resumen: (archivos: number, tamano: string) => `${archivos} files · ${tamano}`,
      fuera: (n: number) => `${n} left out`,
      sinArchivos: 'Only the recipe, the settings and the schema will be saved; no files.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Only the structure of database ${nombre} (server ${servidor}) will be saved, with no rows.`,
      sinBase: 'The project does not declare a database: no schema will be saved.',
      avisoMongodb: 'This project uses MongoDB: its schema (collections and indexes) is not saved.',
      incluirDeTodosModos: 'Include anyway',
      avisoIncluir: 'If that file holds a real key, it will end up inside the template.',
      guardar: 'Save template',
      guardada: (nombre: string) => `Template “${nombre}” saved.`,
      errorGuardar: 'The template could not be saved',
      errorVista: 'The preview could not be calculated',
      cancelar: 'Cancel',
    },
    lista: {
      titulo: 'My templates',
      ayuda:
        'Start a new project with the recipe, the settings and the schema (no data) of one you already have.',
      vacia: 'There are no templates yet. Save a project as a template from the menu on its card.',
      conArchivosEtiqueta: 'with files',
      soloEsquema: 'recipe and schema',
      conBase: (motor: string) => `${motor} database, no data`,
      borrarEtiqueta: (nombre: string) => `Delete template ${nombre}`,
      borrarTitulo: (nombre: string) => `Delete template ${nombre}?`,
      borrarTexto:
        'Only the template is deleted. Projects created from it and the original project are not touched.',
      borrada: 'Template deleted.',
      errorBorrar: 'The template could not be deleted',
      errorLista: 'The templates could not be read',
      desde: (nombre: string) => `Template: ${nombre}`,
      avisoSinBase: 'This template has no database.',
      importadaEtiqueta: 'imported',
      avisoImportada:
        'This template comes from a third party: the project is created untrusted and without starting its processes, and opening the site runs its code. Review its files first.',
      generadoresTitulo: 'Projects from scratch',
    },
  },
  env: {
    accion: '.env variables…',
    titulo: (nombre: string) => `.env of ${nombre}`,
    intro:
      'Secret values are shown masked. A full value only appears if you press “Show” on that variable, and it is hidden again after 30 seconds. Before saving, a dated copy of the current .env is made.',
    noExiste: 'This project does not have a .env file yet: it will be created when you save.',
    tablaEtiqueta: '.env variables',
    sinVariables: 'The .env has no variables.',
    secretaEtiqueta: 'secret',
    duplicadaEtiqueta: 'repeated',
    duplicadaAyuda:
      'This variable appears more than once in the .env: the last one is shown and changed.',
    soloLecturaEtiqueta: 'multi-line',
    soloLecturaAyuda: 'It spans several lines: edit it by hand in the file.',
    seQuitara: 'It will be removed when you save',
    valorNuevo: 'New value',
    valorNuevoDe: (clave: string) => `New value for ${clave}`,
    valorDe: (clave: string) => `Value of ${clave}`,
    vacio: '(empty)',
    mostrar: 'Show',
    ocultar: 'Hide',
    mostrarEtiqueta: (clave: string) => `Show the value of ${clave}`,
    ocultarEtiqueta: (clave: string) => `Hide the value of ${clave}`,
    cambiar: 'Change',
    deshacer: 'Undo',
    deshacerEtiqueta: (clave: string) => `Undo the change to ${clave}`,
    quitar: 'Remove',
    quitarEtiqueta: (clave: string) => `Remove the variable ${clave}`,
    errorRevelar: 'Could not show the value',
    agregarTitulo: 'Add a variable',
    agregarNombre: 'NAME',
    agregarValor: 'value',
    agregar: 'Add',
    nombreInvalido:
      'Use letters, numbers, underscore and dot, not starting with a number, and not already in the file.',
    comparar: {
      titulo: 'Compare with the example file',
      sinEjemplo: 'The project has no .env.example to compare with.',
      alDia: 'The .env has the same variables as the example.',
      faltan: (n: number) => `${n} missing:`,
      sobran: (n: number) => `${n} extra (not in the example):`,
      distintas: (n: number) => `${n} with a value different from the example:`,
      agregarFaltantes: 'Add the missing ones',
    },
    bloques: {
      titulo: 'Add a block of variables',
      ayuda:
        'Adds only that topic’s variables that the .env is missing (existing ones are left untouched), without passwords or keys; fill them in later in the table.',
      bd: 'Database',
      correo: 'Mail',
      ia: 'AI',
      redis: 'Redis',
      meilisearch: 'Meilisearch (with its key)',
    },
    usuarioPropio: {
      titulo: 'Use own user',
      ayuda:
        'Creates a database user just for this project (with permissions only on its database, never an administrator) and writes it to the .env. For now it works with WolfCore Dev’s MySQL and MariaDB.',
      confirmarTitulo: 'Use an own user for the database?',
      confirmarTexto:
        'A new user is created with a random password, with permissions only on this project’s database, and the connection user and password in the .env are changed. A copy of the current .env is saved first; the new password stays in the project’s .env and encrypted in WolfCore Dev.',
      confirmar: 'Create and use',
      hecho: (usuario: string) => `The project now uses the user ${usuario}.`,
      compartirTitulo: 'Share another project’s user?',
      compartirTexto: (base: string, proyecto: string) =>
        `Database ${base} is also used by ${proyecto}. Share its user? This project will use the same user and password; the password does not change, so ${proyecto} stays connected.`,
      compartir: 'Share the user',
      error: 'Could not change the database user',
    },
    copias: {
      titulo: 'Go back to a copy',
      ninguna: 'There are no copies of this .env yet.',
      volver: 'Go back to this copy',
      confirmarTitulo: 'Go back to a copy of the .env?',
      confirmarTexto: (fecha: string) =>
        `The current .env is replaced by the copy from ${fecha}. Another copy of the current one is saved first, so this can be undone too.`,
      hecho: 'Went back to the copy.',
      error: 'Could not go back to the copy',
    },
    cambiosPendientes: (n: number) => `${n} unsaved changes`,
    descartar: 'Discard changes',
    guardar: 'Review and save…',
    cerrar: 'Close',
    cerrarTitulo: 'Close without saving?',
    cerrarTexto: (n: number) => `There are ${n} unsaved changes. If you close, they are lost.`,
    cerrarDescartar: 'Close and discard',
    seguirEditando: 'Keep editing',
    confirmar: {
      titulo: 'Save the .env changes',
      texto:
        'This is what will change. Secret values are shown masked. A dated copy of the current .env is saved and the file is written in one go.',
      sinCambios: 'There are no changes to save.',
      agregarGitignore: 'Add .env to the project’s .gitignore',
      aceptarVersionado: 'I understand the risk and want to save anyway',
      guardar: 'Save changes',
      versionado:
        'Git already tracks this project’s .env: the next commit would upload its values even if it is in .gitignore. Remove it from the index with git rm --cached .env.',
      versionadoDesconocido:
        'Could not check whether git tracks this project’s .env; confirm separately to save.',
    },
    errorVistaPrevia: 'Could not prepare the preview',
    errorGuardar: 'Could not save the .env',
    guardado: 'The .env was saved.',
    guardadoConCopia: 'The .env was saved; the previous version was kept as a copy.',
  },
  /** Estados vacíos que guían: qué es, por qué está vacío y la acción principal (D38b). */
  estadosVacios: {
    basesSinMotor: {
      titulo: 'No database engine yet',
      texto:
        'Install MySQL, MariaDB, PostgreSQL or MongoDB from Services to create and manage your projects’ databases.',
      accion: 'Go to Services',
    },
    serviciosVacio: {
      titulo: 'No services installed yet',
      texto:
        'Services (Nginx, PHP, databases…) are what make your sites run. Start with Nginx and PHP, or with a database.',
      accion: 'Install a service',
    },
    registrosSinFuentes: {
      titulo: 'No logs yet',
      texto:
        'Logs appear as soon as a service, a site or a process writes its first line. Turn on a service and come back.',
      accion: 'Go to Services',
    },
    registrosElegir: {
      titulo: 'Pick a log',
      texto: 'Choose a source in the selector above to follow its lines live.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'No dumps have arrived yet',
      texto:
        'When a site runs dump(), dd() or wd(), the dump shows up here instantly. Open your site and run that code.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Capture is off',
      texto:
        'With capture on, your sites’ dump() and dd() calls arrive here without touching the browser. Turn it on and start a site.',
      accion: 'Turn on capture',
    },
    depuracionElegir: {
      titulo: 'Pick a dump',
      texto: 'Select a dump from the list to see its content, file and source URL.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'No errors in the logs',
      texto:
        'PHP, Nginx and project errors show up here, grouped, as soon as they are written. An empty list is good news.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Pick an error',
      texto: 'Select an error from the list to see its trace and open the file in the editor.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'No check has run yet',
      texto:
        'Doctor checks ports, hosts, certificates and versions, and tells you how to fix what fails. Run the first check.',
      accion: 'Check now',
    },
    doctorSinHallazgos: {
      titulo: 'All good',
      texto: 'The last check found no problems. Check again if something stops responding.',
      accion: 'Check again',
    },
    contenedoresVacio: {
      titulo: 'No containers',
      texto:
        'The Docker or Podman containers on this computer appear here. Create one with docker run or docker compose and press Refresh.',
      accion: 'Refresh',
    },
    avisos: {
      titulo: 'No notices',
      texto: 'Service outages, busy ports and expiring certificates will show up here.',
      accion: '',
    },
    instantaneas: {
      titulo: 'No snapshots yet',
      texto:
        'A snapshot saves this database’s state so you can go back if something goes wrong. Take the first one with the button above.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'This server has no databases of its own',
      texto: 'Create a database for your project or import an existing dump.',
      accion: 'Create database',
    },
    iaNube: {
      titulo: 'No AI providers yet',
      texto:
        'A provider (OpenAI, Anthropic, OpenRouter and others) lets your agents use cloud models. The key is stored encrypted on this computer.',
      accion: 'Add provider',
    },
    iaSinModelos: {
      titulo: 'No local models yet',
      texto: 'Download a model from the list below to use it offline.',
      accion: '',
    },
    versiones: {
      titulo: 'No versions to show',
      texto:
        'The list is downloaded from the official catalog. Check your connection and refresh the list.',
      accion: 'Refresh list',
    },
    buscar: {
      titulo: 'No matches',
      texto:
        'Nothing in the folder matches your search. Try other words, uncheck “Match case” or review the file filters.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Welcome tour',
    paso: (n: number, total: number) => `Step ${n} of ${total}`,
    anterior: 'Back',
    siguiente: 'Next',
    saltar: 'Skip',
    terminar: 'Get started',
    cerrar: 'Close the tour',
    reabrir: 'Press Esc to leave. You can watch it again from Settings › Appearance.',
    ir: (destino: string) => `Go to ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Welcome to WolfCore Dev',
        texto:
          'Your local development environment in a single window: services, .test sites with HTTPS, databases, mail and tools. This tour takes a minute and changes nothing on your computer.',
      },
      servicios: {
        titulo: 'Services',
        texto:
          'Turn on Nginx, PHP and the databases here with a switch. If they are not installed yet, the Versions tab downloads them with a verified checksum.',
      },
      proyectos: {
        titulo: 'Projects',
        texto:
          'Create a new project or import a folder or a repository. Each site gets its own .test address with HTTPS.',
      },
      bases: {
        titulo: 'Databases',
        texto:
          'Create databases, import and export dumps, and back up and restore without leaving the app.',
      },
      herramientas: {
        titulo: 'Tools and Ctrl+K',
        texto:
          'Editor, search, compare, passwords, images and more, grouped by section. Press Ctrl+K on any screen to jump to what you need.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'It checks ports, hosts, certificates and versions, and suggests how to fix what fails. Open it when something does not respond.',
      },
      listo: {
        titulo: 'All set',
        texto:
          'Start by turning on a service or creating your first project. You can watch this tour again from Settings › Appearance.',
      },
    },
  },
  /** Resultado de importar o exportar un perfil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Backup and profiles',
      descripcion:
        'A profile takes your environment to another computer: sites, versions, instances, templates and settings. It never carries keys, tokens or passwords.',
      aislado: {
        titulo: 'Test folder',
        texto: (ruta: string) =>
          `WolfCore Dev is using a test data folder (${ruta}). Nothing you do here touches your real folder or your computer: the hosts file is not written and no certificates are installed.`,
      },
      exportar: {
        titulo: 'Export the environment',
        texto:
          'Saves a .wolfperfil file with your sites, versions, instances, templates and settings.',
        bases: 'Include the databases',
        basesAyuda: 'Full dumps (with your customers’ data) travel encrypted with the passphrase.',
        ca: 'Include the certificate authority (CA)',
        caAyuda: 'It is encrypted with the passphrase. Import it only on a computer of yours.',
        certificados: 'Include the sites’ certificates',
        certificadosAyuda: 'They only travel together with the CA, encrypted with it.',
        frase: 'Passphrase',
        fraseRepetir: 'Repeat the passphrase',
        fraseAyuda: (minimo: number) =>
          `At least ${minimo} characters. Without it the databases and the CA cannot be recovered, and it is not stored anywhere.`,
        problemas: {
          frase_corta: (minimo: number) => `The passphrase must be at least ${minimo} characters.`,
          frase_distinta: 'The two passphrases do not match.',
          certificados_sin_ca: 'Certificates only travel together with the CA.',
        },
        exportar: 'Export profile…',
        nota: 'A profile never carries keys, tokens or passwords, nor snapshots, the trash, backups or the data folder.',
        listo: 'Profile exported',
        guardado: (archivo: string, tamano: string) => `Saved to ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Import a profile',
        texto:
          'Choose a .wolfperfil file. Before anything changes you will see everything that is replaced, removed or left pending, and a copy of what is replaced is saved.',
        boton: 'Import profile…',
      },
      instantaneas: {
        titulo: 'Environment snapshots',
        texto:
          'Before updating PHP or Nginx and before importing a profile, WolfCore Dev saves a copy of your configuration, Nginx and the php.ini files, without keys or data and only for you. The 10 latest are kept.',
        compartidas:
          'The 10 are shared among all reasons: taking a new one replaces the oldest, manual ones included.',
        tomar: 'Take one now',
        tomada: 'Snapshot saved.',
        sinNada: 'There is nothing to copy yet.',
        vacia: 'There are no snapshots yet.',
        motivos: {
          actualizar: 'Before updating',
          'importar-perfil': 'Before importing a profile',
          'limpiar-versiones': 'Before cleaning up versions',
          manual: 'Manual',
        },
      },
    },
    reasignar: {
      titulo: 'Site folders',
      texto:
        'These folders come from the other computer. Find where they are on this one, or import the site as pending: it stays without a folder until you choose one.',
      sitio: 'Site',
      origen: 'Folder in the profile',
      destino: 'Folder on this computer',
      existe: 'Exists',
      noExiste: 'Does not exist on this computer',
      buscar: 'Find folder…',
      cambiar: 'Change',
      comoPendiente: 'Import anyway as pending',
      prefijo: (viejo: string, nuevo: string) =>
        `Use the same change for the others (${viejo} → ${nuevo})`,
      omitido: 'It will not be imported',
    },
    asistente: {
      titulo: 'Import a profile',
      pasos: {
        archivo: 'File',
        revisar: 'Review',
        confirmar: 'Confirm',
        resultado: 'Result',
      },
      archivo: {
        texto:
          'Choose the .wolfperfil file. Nothing changes yet: first you will see what is going to be replaced, removed or left pending.',
        elegir: 'Choose file…',
        cambiar: 'Choose another',
        ninguno: 'No file chosen',
        leyendo: 'Reading the profile…',
        error: 'The profile could not be read',
      },
      origen: (fecha: string, sistema: string) => `Created on ${fecha} on ${sistema}.`,
      ignoradas: (n: number) =>
        `${n} entries in the file are not part of a profile and are ignored.`,
      reemplaza: {
        titulo: 'What is replaced',
        ninguno: 'There is no data in this folder: the import goes onto a clean installation.',
        copia:
          'Before replacing, it is copied to respaldos/pre-perfil-… and an environment snapshot is taken; every database that is replaced has its own snapshot. The data folder is never deleted.',
        config: 'The configuration (config.json)',
        sitio: (id: string) => `The site ${id}`,
        base: (instancia: string, base: string) => `The database ${base} (${instancia})`,
        plantilla: (id: string) => `The template ${id}`,
        ca: 'The certificate authority (CA) of this computer',
      },
      versiones: {
        titulo: 'Versions',
        ninguna: 'The profile has no versions.',
        instalada: 'Already installed',
        descargar: 'Will be downloaded with its fingerprint verified',
        pendienteDebil: 'Pending: no strong fingerprint, install it by hand',
        sustituida: (v: string) =>
          `It is no longer in the catalog: ${v} will be installed instead.`,
        pendienteFuera: 'Pending: it is no longer in the catalog',
        huellas: {
          fuerte: 'SHA-256 or SHA-512 fingerprint',
          firmada: 'Signed',
          debil: 'Weak fingerprint',
          ninguna: 'No fingerprint',
        },
        descargas: (n: number) =>
          `${n} versions will be downloaded from official sites, each with its fingerprint or signature verified.`,
      },
      instancias: {
        titulo: 'Database instances',
        existente: 'Already exists: kept with its port and version',
        nueva: (puerto: number) => `Created with new credentials on port ${puerto}`,
        reasignada: (de: number, a: number) => `Port ${de} is busy: it will use ${a}`,
      },
      bases: {
        titulo: 'Databases',
        ninguna: 'The profile has no databases.',
        texto:
          'They are restored with a user limited to each database and only with allowed statements. Existing ones are backed up first.',
        omitir: 'Import without the databases',
      },
      plantillas: {
        titulo: 'Templates',
        existe: 'Already exists: replaced',
        nueva: 'New',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'They only carry references to databases and services (project processes do not travel). They are checked against what exists here and never start on their own.',
        existe: 'You already have one with that id: yours is kept',
        nuevo: 'New',
        elementos: (n: number) => (n === 1 ? '1 item' : `${n} items`),
        invalidos: (n: number) => `${n} in the profile are not valid and will not be imported.`,
      },
      quitado: {
        titulo: 'What is not taken from the configuration',
        texto:
          'This data folder is clean: anything in the profile that points outside this computer is not taken.',
      },
      puertos: {
        titulo: 'Busy ports',
        texto: (lista: string) =>
          `These ports from the profile are already used by another program on this computer: ${lista}. Change them from Services after importing.`,
      },
      ca: {
        titulo: 'Certificate authority (CA)',
        texto:
          'The profile carries an encrypted CA. Import it only if it is yours: this computer would accept the certificates it signs.',
        huella: 'SHA-256 fingerprint of the profile’s CA',
        comparar: 'Compare it with the one on your original computer before accepting it.',
        importar: 'Import the profile’s CA',
        noImportar:
          'If you do not import it, this computer uses its current CA or creates a new one.',
        ajena: 'This CA has name constraints that are not WolfCore Dev’s: it cannot be imported.',
        sinRestricciones:
          'This CA has no name constraints: it can sign certificates for any website, banks and email included. Import it only if it is yours and the fingerprint matches.',
        aceptarSin: 'I understand the risk: it is my CA and the fingerprint matches',
        reemplazaLocal:
          'This computer already has a CA. Importing the profile’s replaces it (a copy stays in the previous backup).',
        reemplazar: 'Replace this computer’s CA',
        noSeInstala: 'The CA is not installed by itself in the system certificate store.',
      },
      frase: {
        titulo: 'Profile passphrase',
        texto:
          'The profile carries encrypted databases or CA. Type the passphrase you chose when exporting it.',
        campo: 'Passphrase',
        omitirBases: 'Import without the databases',
        nota: 'The passphrase is only used in this window: it is not stored and it is erased when finished or closed.',
      },
      env: {
        titulo: 'Project connection',
        texto:
          'Mark the projects whose .env should point to a new user of its own for their database (with a prior copy of the .env). The others are not touched and are reported.',
      },
      confirmar: {
        titulo: 'Confirm the import',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `${sitios} sites, ${versiones} versions and ${bases} databases will be imported.`,
        importar: 'Import',
        revisar: 'Review',
        volver: 'Back',
        bloqueos: {
          sitios_sin_carpeta:
            'Choose the folder of each site or mark it to be imported as pending.',
          frase_requerida: 'Type the profile passphrase or import without the databases.',
          ca_ajena: 'The profile’s CA cannot be imported.',
          ca_sin_restricciones:
            'Confirm separately that you want to import a CA without restrictions.',
          reemplazar_ca: 'Confirm separately that you want to replace this computer’s CA.',
        },
      },
      progreso:
        'Importing the profile… Do not close the window: with databases or downloads it can take a while.',
      fases: {
        copia: 'Copying what is replaced',
        versiones: 'Installing versions',
        configuracion: 'Saving the configuration and sites',
        plantillas: 'Copying templates',
        ca: 'Preparing the CA and certificates',
        bases: 'Restoring databases',
        env: 'Rewriting the .env files',
      },
      avance: (paso: number, de: number) => `Step ${paso} of ${de}`,
      resultado: {
        titulo: 'Import result',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} imported, ${pendientes} pending, ${omitidos} skipped and ${errores} with errors.`,
        respaldo: (ruta: string) => `Copy of what was replaced: ${ruta}`,
        pendientes: 'What was left pending can be completed by hand.',
        error: 'The profile could not be imported',
        secciones: {
          sitios: 'Sites',
          versiones: 'Versions',
          instancias: 'Instances',
          bases: 'Databases',
          plantillas: 'Templates',
          workspaces: 'Workspaces',
          env: '.env files',
          ca: 'CA',
        },
        estados: {
          importado: 'Imported',
          pendiente: 'Pending',
          omitido: 'Skipped',
          error: 'Error',
          instalada: 'Installed',
          ya_instalada: 'Already there',
          creada: 'Created',
          existente: 'Already existed',
          puerto_reasignado: 'Port reassigned',
          reescrito: 'Rewritten',
          sin_marcar: 'Not marked',
        },
        ca: {
          importada: 'CA imported',
          nueva: 'New CA generated',
          sin_cambios: 'The CA did not change',
        },
        quitarCa: {
          boton: 'Remove the previous CA…',
          titulo: 'Remove the previous CA from trust',
          texto:
            'The CA this computer had before will be removed from the system certificate store. Windows may ask for confirmation. The new CA is not installed by itself.',
          si: 'Remove',
          hecho: 'Previous CA removed from trust.',
        },
        descartadosWorkspace: (lista: string) => `Does not exist here and was removed: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} invalid workspaces were not imported.`,
        sustituida: (v: string) => `${v} was installed instead of the profile's version.`,
        puerto: (de: number, a: number) => `Port ${de} → ${a}`,
        copiaEnv: (ruta: string) => `.env copy: ${ruta}`,
      },
    },
    /** Aviso fuerte de la vista previa: la CA del perfil no tiene restricciones de nombre. */
    caSinRestricciones:
      'This CA can sign any website; import it only if it is yours, compare the fingerprint.',
    motivos: {
      procesos_quitados: 'Its processes (commands from another computer) were not imported.',
      tareas_quitadas:
        'Its scheduled tasks (commands from another computer) were not imported. Create them again or adopt them from wolfcore.yml.',
      tunel_con_nombre: 'Its named tunnel does not travel: it goes back to the quick tunnel.',
      php_ini: 'Some php.ini settings were not imported.',
      xdebug: 'Its Xdebug setting was not valid and was removed.',
      nginx_desactivado: 'Its Nginx rules are saved but not applied: review them in the editor.',
      carpeta_no_existe: 'Its folder does not exist on this computer: find it.',
      correo_sin_proveedor: 'Its SMTP provider was not imported: it uses the mail catcher.',
      sitio_invalido: 'The site is not valid.',
      dominio_invalido: 'Its domain is not valid (it must end in .test).',
      ruta_protegida: 'Its folder is a system or WolfCore Dev folder: not imported.',
      dominio_en_uso: 'Another site on this computer already uses that domain.',
      sitio_repetido: 'The site is repeated in the profile.',
      no_disponible: 'That version is no longer in the catalog.',
      version_sustituida:
        'That version is no longer in the catalog: the newest one of the same minor version (for example, 8.3) was installed.',
      huella_debil: 'That version has no strong checksum: install it by hand from Versions.',
      tope_descargas:
        'Not downloaded to avoid too many downloads at once: install it from Versions.',
      instancia_pendiente: 'Its instance is pending.',
      motor_no_soportado: 'That engine is not imported from a profile.',
      version_pendiente: 'Its engine version is pending.',
      danada: 'Its files in the profile are damaged.',
      bases_omitidas: 'Imported without the databases.',
      instancia_apagada: 'Its instance could not be started.',
      sin_copia_previa: 'The previous snapshot could not be taken: the database was not replaced.',
      sin_base: 'Its .env does not point to a local database.',
      base_no_resuelta: 'Could not tell which instance its database belongs to.',
      error_inesperado: 'Something failed.',
    },
    avisos: {
      ca_reemplazada:
        "This computer's previous CA is still in the system trust store and is no longer used. You can remove it from here.",
      base_no_incluida: 'The database {base} ({instancia}) was not included.',
      sin_ca: 'There is no CA on this computer: the profile goes without it.',
      ca_no_importada:
        "The profile's CA was not imported: this computer's CA or a new one is used.",
      certificados: 'The certificates could not be prepared: {detalle}',
      aplicar: 'The imported sites were not fully applied (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'AI provider {id}: it uses its own URL.',
      smtp: 'SMTP provider {id}: its host is not a known provider or its user is missing.',
      puerto: 'Port of {id}: out of range, back to the default.',
      carpeta_vigilada: 'The watched folder belongs to another computer.',
    },
  },

  consultasLentas: {
    boton: 'Slow queries',
    titulo: (motor: string) => `Slow queries on ${motor}`,
    descripcion:
      'The queries that take longer than the time you choose, from the slowest to the fastest.',
    cargando: 'Loading slow queries…',
    estadoTitulo: 'Log status',
    estadoActivo: (s: string) => `Logging is on: queries over ${s} s are recorded.`,
    estadoApagado: 'Logging is off.',
    noGestionada:
      'WolfCore Dev does not manage this server (for example, one started by another program): you can only view it here, not change it.',
    umbral: 'Record queries over (seconds)',
    activar: 'Turn logging on',
    aplicarUmbral: 'Change the time',
    desactivar: 'Turn logging off',
    actualizar: 'Read the log again',
    confirmarTitulo: 'Change slow query logging',
    confirmarActivar: (motor: string, s: string) =>
      `Logging will be turned on for the whole ${motor} server (queries over ${s} s) and saved in its configuration. It affects all of its databases.`,
    confirmarDesactivar: (motor: string) =>
      `Logging will be turned off for the whole ${motor} server and saved in its configuration. What was already recorded is kept.`,
    confirmarBoton: 'Confirm the change',
    cancelar: 'Cancel',
    activado: 'Slow query logging turned on',
    desactivado: 'Slow query logging turned off',
    privacidad:
      'The SQL is shown with its values replaced by “?”, because it can contain real customer data. None of this leaves this computer or is written to the application logs.',
    columnas: {
      duracion: 'Duration',
      filas: 'Rows examined',
      base: 'Database',
      fecha: 'Date',
      sql: 'Query',
      acciones: 'Actions',
    },
    sinBase: 'Not attributed',
    verLiteral: 'Show literal',
    ocultarLiteral: 'Hide literal',
    literalAviso: 'SQL as is, with its values',
    sqlOculto: 'SQL hidden',
    sqlOcultoAyuda:
      'This query cannot be shown without risking real data: this server has databases with real data or the query cannot be safely attributed to a database.',
    copiar: 'Copy',
    copiado: 'Query copied',
    truncado: (n: number) =>
      `At most the ${n} slowest queries from the tail of the log (the last 5 MB) are shown.`,
    vacioTitulo: 'No slow queries recorded yet',
    vacioTextoApagado:
      'Turn logging on and use your sites: queries that take longer than the chosen time will appear here.',
    vacioTextoActivo:
      'So far no query went over the chosen time. Use your sites and read the log again.',
  },
  esquemaBd: {
    boton: 'View schema',
    titulo: (base: string) => `Schema of ${base}`,
    descripcion:
      'Read only: tables, columns, keys and relations. No data from your tables is read.',
    cargando: 'Reading the schema…',
    error: 'The database schema could not be read.',
    reintentar: 'Try again',
    buscar: 'Search for a table',
    tablas: (n: number) => plural(n, 'table', 'tables'),
    vista: 'view',
    truncado: (n: number) => `The list was cut to ${n} tables: the database has more.`,
    sinResultados: 'No table matches the search.',
    elegir: 'Choose a table from the list to see its columns, keys and relations.',
    columnas: 'Columns',
    indices: 'Indexes',
    sinIndices: 'This table has no indexes.',
    relaciones: 'Relations',
    sinRelaciones: 'This table has no relations with others.',
    salientes: 'References',
    entrantes: 'Referenced by',
    alBorrar: 'On delete:',
    alActualizar: 'On update:',
    irA: (tabla: string) => `Go to table ${tabla}`,
    col: { nombre: 'Column', tipo: 'Type', nulo: 'Nullable', defecto: 'Default', clave: 'Key' },
    si: 'Yes',
    no: 'No',
    pk: 'PK',
    unico: 'unique',
    vacioTitulo: 'This database has no tables',
    vacioTexto:
      'When you create tables (for example, with your project migrations) they will appear here.',
  },
};
