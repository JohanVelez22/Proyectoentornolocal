/**
 * Textes de l’interface en français (fr-FR). Mêmes clés et mêmes signatures de fonction que es.ts
 * (un test le vérifie). Glossaire fixe : service, instance, site, tunnel, sauvegarde, avis ;
 * Doctor et WolfCore Dev ne se traduisent pas. Vouvoiement à l’impératif, jamais de « tu ».
 */
import type { Textos } from './es';

const plural = (n: number, uno: string, varios: string): string =>
  `${n} ${Math.abs(n) < 2 ? uno : varios}`;

export const fr: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP et Nginx sans complication',
    version: 'Version',
  },
  nav: {
    inicio: 'Accueil',
    proyectos: 'Projets',
    agentes: 'Agents',
    servicios: 'Services',
    basesDeDatos: 'Bases de données',
    correo: 'Courrier',
    php: 'PHP',
    ia: 'IA',
    tuneles: 'Tunnels',
    contenedores: 'Conteneurs',
    herramientas: 'Outils',
    doctor: 'Doctor',
    depuracion: 'Débogage',
    registros: 'Journaux',
    ajustes: 'Réglages',
    contraer: 'Réduire le menu',
    expandir: 'Développer le menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'service actif', 'services actifs'),
    tuneles: (n: number) => plural(n, 'tunnel actif', 'tunnels actifs'),
    cargando: 'Connexion au noyau…',
    conErrores: 'avec des erreurs',
    sinConexion: 'Pas de connexion au noyau',
  },
  estado: {
    encendido: 'Allumé',
    apagado: 'Éteint',
    iniciando: 'Démarrage…',
    error: 'Erreur',
    externo: 'Externe',
    activo: 'Actif',
    aviso: 'Attention',
  },
  acciones: {
    encender: 'Allumer',
    apagar: 'Éteindre',
    iniciarTodo: 'Tout démarrer',
    detenerTodo: 'Tout arrêter',
    abrir: 'Ouvrir',
    copiar: 'Copier',
    copiado: 'Copié dans le presse-papiers',
    copiarCompleto: 'Copier le texte complet',
    guardar: 'Enregistrer',
    cerrar: 'Fermer',
    abrirCarpeta: 'Ouvrir le dossier',
    instalar: 'Installer',
    reintentar: 'Réessayer',
    cancelar: 'Annuler',
    borrar: 'Supprimer',
    editar: 'Modifier',
    duplicar: 'Dupliquer',
    renovar: 'Renouveler',
    masAcciones: 'Plus d’actions',
    actualizar: 'Mettre à jour',
    quitar: 'Retirer',
    reinstalar: 'Réinstaller',
  },
  errores: {
    titulo: 'L’action n’a pas pu aboutir',
    arranque: 'Impossible de lire l’état de l’environnement',
    desconocido: 'Une erreur inattendue s’est produite.',
    /** Détails que le noyau envoie sous forme de code dans une erreur. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'guillemets non fermés',
      'sintaxis.tras_comillas': 'il manque un espace ou « ; » après les guillemets',
      'sintaxis.punto_y_coma_inesperado': '« ; » sans directive',
      'sintaxis.llave_inesperada': '« { » sans directive',
      'sintaxis.falta_punto_y_coma': 'il manque « ; » à la fin de la directive',
      'sintaxis.sobra_llave': 'une « } » en trop',
      'sintaxis.falta_llave': 'il manque une « } »',
    },
    codigos: {
      'git.cambios_locales':
        'Le dossier contient des modifications non enregistrées : enregistrez-les (commit) ou abandonnez-les avant de récupérer des changements. Rien n’a été modifié.',
      'git.divergencia':
        'La branche a divergé du dépôt distant (des commits locaux et distants diffèrent) : résolvez-le à la main. Rien n’a été modifié.',
      'git.sin_upstream':
        'La branche actuelle ne suit aucune branche distante : il n’y a rien à récupérer.',
      'git.sin_rama': 'Le dépôt est sur un commit isolé (sans branche) : rien n’a été modifié.',
      'git.no_repositorio': 'Le dossier n’est pas un dépôt git.',
      'git.destino_no_vacio': 'Le dossier de destination n’est pas vide.',
      'git.destino_es_archivo': 'La destination est un fichier, pas un dossier.',
      'git.no_encontrado': 'git est introuvable : installez-le d’abord.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) est introuvable : installez-le d’abord.',
      'git.plazo': 'Le clonage a dépassé le délai de {minutos} min et a été annulé.',
      'git.token_invalido': 'Le jeton GitHub n’est pas valide.',
      'git.url_con_credenciales':
        'L’URL ne doit contenir ni utilisateur ni mot de passe : utilisez un jeton à part.',
      'servicios.desconocido': 'Service inconnu : {id}.',
      'servicios.no_instalado': '{nombre} n’est pas installé. Installez-le depuis Services.',
      'servicios.puerto_invalido': 'Le port doit être un nombre entre 1024 et 65535.',
      'servicios.puerto_asignado': 'Le port {puerto} est déjà attribué à {otro}.',
      'servicios.puerto_ocupado':
        'Le port {puerto} est utilisé par {nombre} (PID {pid}). Fermez-le ou choisissez un autre port.',
      'servicios.confirmacion_borrado': 'Pour supprimer les données de {nombre}, tapez "{id}".',
      'servicios.ftp_no_disponible': 'Le serveur FTP n’est pas disponible.',
      'sistema.sin_cliente_ftp':
        'Aucun client FTP n’est associé sur cet ordinateur. Installez-en un (par exemple FileZilla) ou copiez l’adresse.',
      'servicios.mailpit_no_responde': 'Mailpit ne répond pas. Démarrez-le depuis Services.',
      'servicios.no_encendio': '{nombre} n’a pas pu démarrer. Consultez Services et ses journaux.',
      'servicios.iniciar_todo_fallos':
        'Tout démarrer n’a pas pu allumer : {nombres}. Consultez Services et leurs journaux.',
      'servicios.respaldo_fallo':
        '{nombre} n’a pas été mis à jour : la sauvegarde préalable a échoué et rien n’a été modifié.',
      'servicios.espacio_insuficiente':
        'Pas assez d’espace pour copier les données : il faut {necesarios} Mo et il reste {libres} Mo libres.',
      'servicios.actualizacion_revertida':
        'La version {version} n’a pas démarré ; {nombre} est revenu à {anterior}. La sauvegarde est conservée.',
      'servicios.restauracion_fallo':
        'La nouvelle version n’a pas démarré et les données de {nombre} n’ont pas pu être restituées. Rien n’a été allumé : les données touchées sont dans {fallida} et la sauvegarde dans {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} appartient à une version majeure différente : créez-la comme une nouvelle instance.',
      'servicios.misma_version': '{id} utilise déjà la version {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} est bloquée : une mise à jour n’a pas pu restituer ses données. Les données touchées sont dans {fallida} et la sauvegarde dans {respaldo}. Réglez-le dans Services → Versions avant de l’allumer.',
      'servicios.datos_apartados':
        '{nombre} n’a pas de données dans son dossier, mais des données ont été mises de côté lors d’une mise à jour : aucun dossier vide n’est créé. Consultez Services → Versions.',
      'servicios.puerto_reservado':
        'Le port {puerto} est réservé par le système ({desde}–{hasta}) : choisissez-en un autre.',
      'servicios.borrado_con_bloqueo':
        '{nombre} a une instance bloquée après une mise à jour : réglez-le avant de supprimer ses données.',
      'servicios.config_no_revertida':
        '{nombre} {version} n’a pas démarré et le retour à {anterior} dans la configuration a échoué. Choisissez de nouveau {anterior} dans Services → Versions.',
      'servicios.puerto_revertido_apagada':
        '{nombre} n’a pas démarré sur le nouveau port ; retour au {anterior}, mais il n’y a pas démarré non plus : il est resté éteint sur le port {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} n’a pas démarré sur le port {nuevo} et le retour au {anterior} dans la configuration a échoué : il est resté éteint.',
      'instancias.id_invalido': 'L’identifiant de l’instance n’est pas valide.',
      'instancias.no_existe': 'L’instance {id} n’existe pas.',
      'instancias.existe': 'L’instance {id} existe déjà.',
      'instancias.una_sola': '{nombre} n’admet qu’une seule instance.',
      'instancias.ultima': '{id} est la seule instance : impossible de la retirer.',
      'instancias.sin_puerto_libre': 'Aucun port libre n’a été trouvé pour l’instance.',
      'instancias.confirmacion': 'Pour continuer, tapez "{id}".',
      'instancias.sin_datos':
        '{id} n’a pas de données dans son dossier : choisissez une sauvegarde à restaurer.',
      'instancias.respaldo_no_existe': 'Cette sauvegarde de {id} n’existe pas.',
      'instancias.respaldo_en_uso':
        'Cette copie est nécessaire à {id}, qui est bloquée : réglez-le d’abord.',
      'instancias.version_requerida':
        'On ne sait pas à quelle version ramener {id} : choisissez une version installée de la même version majeure.',
      'instalador.version_en_uso':
        'Impossible de désinstaller {servicio} {version} : l’instance {instancia} l’utilise.',
      'limpieza.sin_confirmar': 'La confirmation est requise pour nettoyer les versions.',
      'limpieza.seleccion_invalida': 'La sélection de versions n’est pas valide.',
      'limpieza.en_curso': 'Un nettoyage de versions est déjà en cours.',
      'limpieza.no_existe': '{servicio} {version} n’est plus installée.',
      'limpieza.en_uso':
        '{servicio} {version} est désormais utilisée : elle n’a pas été supprimée.',
      'limpieza.ruta_insegura':
        'Le dossier de {servicio} {version} n’est pas sûr (un lien ou un chemin hors de bin) : il n’a pas été touché.',
      'limpieza.version_bloqueada':
        '{servicio} {version} contient des fichiers utilisés ou verrouillés : elle n’a pas été supprimée ni laissée à moitié.',
      'limpieza.otro_volumen':
        '{servicio} {version} est sur un autre disque que le dossier temporaire des données : impossible de la déplacer entière, elle n’a pas été touchée.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} contient des paquets que vous avez installés (npm, pip…) : il faut accepter de les perdre pour la supprimer.',
      'limpieza.destino_ocupado':
        'Un dossier {servicio} {version} existe déjà dans bin : il n’est pas écrasé. Supprimez-le avant de récupérer l’autre.',
      'bd.encender_servicio': 'Allumez {nombre} pour gérer ses bases.',
      'bd.sin_credenciales': 'Aucun identifiant enregistré pour {nombre}.',
      'bd.confirmacion_borrado': 'Pour supprimer la base {nombre}, tapez son nom exact.',
      'bd.usuario_privilegiado':
        'L’utilisateur {usuario} est un administrateur ou un rôle système : choisissez un utilisateur propre au projet.',
      'bd.usuario_en_uso':
        'Un autre projet utilise déjà l’utilisateur {usuario} : son mot de passe n’est pas modifié pour ne pas le priver de connexion. Rien n’a été créé.',
      'bd.rol_sin_login':
        'L’utilisateur {usuario} existe mais ne peut pas se connecter (rôle sans LOGIN ou règle d’accès du serveur). Rien n’a été modifié.',
      'bd.usuario_clave_distinta':
        'L’utilisateur {usuario} existe déjà avec un autre mot de passe. Utilisez son mot de passe actuel : il n’est pas changé pour ne pas couper l’accès d’autres projets.',
      'bd.mongosh_faltante': 'mongosh manque : installez-le depuis Services pour gérer MongoDB.',
      'tuneles.sitio_no_encontrado': 'Le projet est introuvable.',
      'tuneles.sitio_no_confiable':
        '{dominio} n’est pas encore de confiance : cochez « Je fais confiance à ce dépôt » dans le projet avant de le publier.',
      'tuneles.confirmacion_requerida':
        'Publier {dominio} sur Internet doit être confirmé dans WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Le tunnel de {dominio} a changé depuis la confirmation : confirmez à nouveau.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared n’est pas installé. Installez-le depuis Services.',
      'tuneles.proveedor_no_disponible':
        'Le fournisseur de tunnel {proveedor} n’est pas disponible.',
      'tuneles.cloudflare_sin_cuenta':
        'Connectez d’abord votre compte Cloudflare dans les options du tunnel.',
      'tuneles.cloudflare_sin_credencial':
        'Ce tunnel n’a aucun identifiant enregistré : recréez-le dans les options du tunnel.',
      'tuneles.cloudflare_datos_invalidos':
        'Le nom du tunnel (minuscules, chiffres et tirets) ou le domaine public n’est pas valide.',
      'tuneles.cloudflare_conexion_en_curso': 'Une connexion à Cloudflare est déjà en cours.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare a enregistré {registrado} au lieu de {dominio} : le domaine n’appartient pas à la zone autorisée. Supprimez cet enregistrement dans le tableau de bord Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'Le tunnel {nombre} a des connexions actives (cloudflared exige -f pour le supprimer). Fermez-le sur tous les ordinateurs où il est ouvert et réessayez, ou utilisez « Oublier seulement ici ».',
      'tuneles.nombre_en_uso': 'Le tunnel {nombre} est déjà utilisé par un autre site.',
      'tuneles.dominio_en_uso': 'Le domaine {dominio} est déjà utilisé par un autre site.',
      'tuneles.confirmacion_olvidar': 'Oublier ou recréer le tunnel {nombre} doit être confirmé.',
      'tuneles.cloudflare_fallo': 'cloudflared n’a pas pu terminer l’opération : {detalle}',
      'tuneles.credencial_no_protegida':
        'L’identifiant n’a pas pu être limité à l’utilisateur, il n’a donc pas été utilisé.',
      'tuneles.sin_cifrado':
        'Le chiffrement du système n’est pas disponible : impossible d’enregistrer des identifiants.',
      'tuneles.token_invalido':
        'Le jeton n’est pas valide : uniquement des lettres, des chiffres et _ . - (de 8 à 200 caractères). Enregistrez-le à nouveau dans les options du tunnel.',
      'tuneles.ngrok_no_instalado':
        'ngrok n’est pas installé sur cet ordinateur. Installez-le depuis ngrok.com puis réessayez.',
      'tuneles.ngrok_sin_token':
        'Le jeton ngrok est manquant : enregistrez-le dans les options du tunnel.',
      'tuneles.expose_sin_token':
        'Le jeton Expose est manquant : enregistrez-le dans les options du tunnel.',
      'tuneles.tailscale_no_instalado':
        'Tailscale n’est pas installé sur cet ordinateur. WolfCore Dev ne l’installe pas : téléchargez-le sur tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale n’est pas connecté : connectez-vous à Tailscale puis réessayez.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale publie déjà quelque chose sur le port HTTPS {puerto}. WolfCore Dev ne l’écrase pas : retirez-le avec Tailscale puis réessayez.',
      'lan.sitio_no_encontrado': 'Le site est introuvable.',
      'lan.confirmacion_requerida':
        'Partager {dominio} sur le réseau local doit être confirmé dans WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} contient des données réelles : il n’est pas partagé sur le réseau local, même avec confirmation. Utilisez une copie sans données de clients.',
      'lan.sin_red':
        'Aucun réseau local n’est connecté (Wi-Fi ou Ethernet). Connectez-vous à un réseau et réessayez.',
      'lan.ip_no_valida':
        'L’adresse {ip} ne fait plus partie de votre réseau local. Rouvrez la boîte de dialogue et confirmez à nouveau.',
      'lan.requiere_https': '{dominio} redirige vers HTTPS : partagez-le avec l’option HTTPS.',
      'lan.sin_puertos':
        'Aucun port libre entre 8100 et 8199 pour le réseau local (les sites partagés et le lien de l’AC utilisent cette plage). Arrêtez de partager un site ou fermez la boîte de dialogue de l’AC et réessayez.',
      'tuneles.expose_no_instalado':
        'Expose n’est pas installé. Sous Windows il ne fonctionne qu’avec expose.phar : placez-le dans {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose n’est pas utilisé avec des sites contenant de vraies données : son inspecteur de requêtes est visible sur tout le réseau local. Utilisez un autre fournisseur.',
      'tuneles.confirmacion_requerida_tailnet':
        'Partager {dominio} avec votre tailnet doit être confirmé dans WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Impossible de lire ce que Tailscale publie déjà sur cet ordinateur ; rien n’a été ouvert pour ne pas l’écraser. Vérifiez que Tailscale est en cours d’exécution puis réessayez.',
      'tuneles.tailscale_no_habilitado':
        'Serve ou Funnel n’est pas activé sur votre tailnet. Activez-le sur {enlace} puis réessayez.',
      'tuneles.ngrok_desactualizado':
        'Votre ngrok est une version ancienne qui ne prend pas en charge ce dont WolfCore Dev a besoin. Mettez-le à jour (ngrok update) puis réessayez.',
      'hosts.dominio_invalido': 'Un domaine n’est pas valide.',
      'hosts.tiempo_agotado':
        'Aucune réponse à la demande d’autorisation administrateur en {segundos} s ; le fichier hosts est resté tel quel.',
      'https.sin_dominio': 'Un certificat a besoin d’au moins un domaine.',
      'https.sin_autoridad':
        'L’autorité de certification de WolfCore Dev n’existe pas. Installez la CA depuis la section HTTPS avant d’émettre des certificats.',
      'clientehttp.peticion_invalida': 'Donnée non valide dans la requête : {campo}.',
      'clientehttp.variable_sin_definir':
        'La variable «{nombre}» n’est pas définie dans l’environnement actif.',
      'clientehttp.secreto_faltante':
        'Une valeur secrète enregistrée est manquante : saisissez-la de nouveau et enregistrez la requête ou l’environnement.',
      'clientehttp.secreto_no_guardado':
        'Une valeur secrète n’a pas pu être enregistrée : elle ne peut pas contenir de saut de ligne ni dépasser 16 Ko, et le chiffrement du système doit être disponible.',
      'clientehttp.url_invalida': 'L’URL n’est pas valide.',
      'clientehttp.url_con_credenciales':
        'L’URL ne peut pas contenir d’utilisateur ni de mot de passe : utilisez l’onglet d’authentification.',
      'clientehttp.protocolo': 'Seules les URL http:// et https:// sont acceptées.',
      'clientehttp.cabecera_invalida': 'L’en-tête « {nombre} » n’est pas valide.',
      'clientehttp.cuerpo_grande': 'Le corps de la requête dépasse 1 Mo.',
      'clientehttp.plazo': 'La requête a dépassé le délai de {segundos} s.',
      'clientehttp.cancelado': 'Requête annulée.',
      'clientehttp.sin_conexion':
        'Connexion impossible ({motivo}). Vérifiez l’adresse, le port et que le serveur est démarré.',
      'clientehttp.certificado': 'Le certificat du serveur n’a pas pu être vérifié ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Plus de {max} redirections à la suite.',
      'clientehttp.curl_invalido': 'Le texte n’est pas une commande curl valide.',
      'clientehttp.curl_grande': 'Le texte curl est trop grand (64 Ko au maximum).',
      'clientehttp.no_existe': 'L’élément n’existe plus.',
      'clientehttp.limite': 'La limite d’éléments enregistrés a été atteinte.',
      'ejemplohttp.no_arranca': 'Le serveur d’exemple n’a pas pu démarrer.',
      'laboratoriogit.sin_git': 'Git n’est pas installé sur cet ordinateur.',
      'laboratoriogit.orden_invalida': 'Cette commande ne figure pas dans la liste du laboratoire.',
      'laboratoriogit.nombre_invalido':
        'Le nom ne peut contenir que des lettres, des chiffres, des tirets et des tirets bas (30 caractères au plus).',
      'laboratoriogit.mensaje_invalido':
        'Le message doit tenir sur une ligne, faire 200 caractères au plus et ne pas commencer par « - ».',
      'laboratoriogit.archivo_invalido': 'Ce fichier n’est pas l’un des fichiers d’exercice.',
      'laboratoriogit.contenido_invalido':
        'Le contenu doit être du texte de 2000 caractères au plus.',
      'laboratoriogit.ruta_insegura':
        'Le dossier du laboratoire n’est pas celui attendu : on n’y touche pas.',
      'laboratoriogit.fallo_sistema':
        'Le système n’a pas permis de préparer ou d’utiliser le dossier du laboratoire. Essayez « Réinitialiser le laboratoire ».',
      'herramientas.pid_invalido': 'Le PID n’est pas valide.',
      'herramientas.pid_sistema': 'Le PID {pid} appartient au système et ne peut pas être terminé.',
      'herramientas.proceso_propio':
        'Impossible de terminer WolfCore Dev ni le processus qui l’a lancé.',
      'herramientas.proceso_inexistente': 'Le processus {pid} n’existe plus.',
      'herramientas.sin_editor':
        'Aucun éditeur de code n’a été trouvé. Installez-en un (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} n’est pas installé. Choisissez un autre éditeur dans les Paramètres.',
      'herramientas.editor_invalido': 'Cet éditeur n’est pas valide.',
      'herramientas.carpeta_sitio_inexistente': 'Le dossier du projet n’existe pas.',
      'herramientas.ruta_no_absoluta': 'Le chemin doit être absolu.',
      'herramientas.sin_seleccion': 'Choisissez au moins un élément.',
      'herramientas.dominio_invalido': 'Un domaine ou une IP n’est pas valide.',
      'herramientas.demasiados_dominios': 'Un certificat admet au maximum {maximo} domaines ou IP.',
      'buscar.consulta_invalida': 'Saisissez ce que vous cherchez (500 caractères au maximum).',
      'buscar.raiz_invalida': 'Le dossier ou le fichier n’existe pas ou n’est pas valide.',
      'buscar.regex_invalida': 'L’expression régulière n’est pas valide.',
      'buscar.regex_lenta':
        'L’expression régulière est trop lente : simplifiez-la ou utilisez du texte littéral.',
      'buscar.demasiadas': '{maximo} recherches sont déjà en cours : annulez-en une ou patientez.',
      'buscar.ruta_vetada':
        'Ce dossier contient des données de WolfCore Dev : il n’est pas exploré.',
      'buscar.resultado_caducado': 'Ce résultat n’est plus disponible : relancez la recherche.',
      'buscar.resultado_invalido': 'Ce résultat ne peut pas être ouvert.',
      'diff.raiz_invalida': 'Choisissez deux dossiers existants qui ne sont pas des liens.',
      'diff.ruta_vetada': 'Ce dossier contient des données de WolfCore Dev : il n’est pas comparé.',
      'diff.cancelado': 'Comparaison annulée.',
      'diff.plazo': 'La comparaison a duré plus de {segundos} s et a été annulée.',
      'diff.memoria':
        'La comparaison nécessite trop de mémoire (plus de {maximo}) et a été annulée.',
      'diff.ocupado': 'Une comparaison est déjà en cours : annulez-la ou patientez.',
      'diff.caducado': 'Cette comparaison n’est plus disponible : relancez-la.',
      'diff.archivo_invalido': 'Ce fichier ne peut plus être comparé : il a changé ou a disparu.',
      'diff.fallo': 'La comparaison a échoué.',
      'compartir.confirmacion_requerida':
        'Le partage sur internet doit être confirmé dans la fenêtre de WolfCore Dev.',
      'compartir.ocupado': 'Quelque chose est déjà partagé : arrêtez d’abord le partage.',
      'compartir.ruta_invalida': 'Choisissez un dossier ou un fichier existant.',
      'compartir.duracion_invalida': 'Choisissez 15 minutes, 1 heure ou 4 heures.',
      'compartir.proveedor_invalido':
        'Ce tunnel n’est pas pris en charge : utilisez Cloudflare ou ngrok.',
      'compartir.raiz_unidad':
        'La racine d’un lecteur ne se partage pas. Choisissez un dossier à l’intérieur.',
      'compartir.carpeta_usuario':
        'Le dossier personnel entier (ou un dossier qui le contient) ne se partage pas. Choisissez un sous-dossier.',
      'compartir.carpeta_datos': 'Le dossier de données de WolfCore Dev ne se partage pas.',
      'compartir.sitio_datos_reales':
        'Un site avec des données réelles (ni rien de ce qu’il contient) ne se partage pas.',
      'compartir.carpeta_secretos':
        'Ce dossier contient des clés (.ssh, .aws, .git…) et ne se partage pas.',
      'compartir.carpeta_sistema': 'Les dossiers du système ne se partagent pas.',
      'compartir.archivo_sensible':
        'Ce fichier semble contenir un secret ou des données réelles et ne se partage pas.',
      'compartir.carpeta_perfil':
        'Les données des programmes de l’utilisateur (AppData, .claude, .config…) ne se partagent pas.',
      'compartir.archivo_grande':
        'Ce fichier est trop volumineux pour être vérifié et n’est ni un média ni un paquet : il ne se partage pas.',
      'compartir.tunel_sin_url': 'Le tunnel n’a pas donné son adresse en {segundos} s. Réessayez.',
      'compartir.tunel_cerrado': 'Le tunnel s’est fermé avant d’avoir fini de s’ouvrir.',
      'compartir.fallo': 'Impossible de partager.',
      'disco.raiz_invalida': 'Choisissez un dossier ou un lecteur existant et lisible.',
      'disco.cancelado': 'Analyse annulée.',
      'disco.plazo': 'L’analyse a duré plus de {minutos} min et a été annulée.',
      'disco.memoria': 'L’analyse demande trop de mémoire (plus de {maximo}).',
      'disco.ocupado': 'Une analyse est déjà en cours : annulez-la ou patientez.',
      'disco.caducado': 'Cette analyse n’est plus disponible : analysez à nouveau.',
      'disco.entrada_invalida': 'Ce dossier n’existe plus ou a changé : analysez à nouveau.',
      'disco.fallo': 'L’analyse a échoué.',
      'terminal.no_abrio': 'Impossible d’ouvrir le terminal.',
      'terminal.no_instalada':
        '{nombre} n’est pas installé. Choisissez un autre terminal dans Réglages.',
      'terminal.invalida': 'Ce terminal n’est pas valide.',
      'terminal.powershell_restringido':
        'PowerShell est en mode de langage restreint sur cet ordinateur (stratégie de l’organisation ou AppLocker) : WolfCore Dev ne peut pas ouvrir le terminal. Ouvrez-le vous-même dans le dossier du projet.',
      'proyectos.no_existe': 'Le projet n’existe pas.',
      'proyectos.no_confiado': 'Cochez "Je fais confiance à ce dépôt" pour exécuter la recette.',
      'proyectos.receta_en_curso': 'Une recette est déjà en cours pour ce projet.',
      'proyectos.paso_no_omitible': 'L’étape "Créer le site" ne peut pas être ignorée.',
      'workspaces.no_existe': 'Ce workspace n’existe pas.',
      'workspaces.invalido': 'Le workspace n’est pas valide : vérifiez son nom et ses éléments.',
      'workspaces.captadores_exclusivos':
        'Deux capteurs de courrier ne peuvent pas tourner en même temps : un seul fonctionne.',
      'workspaces.elemento_fallo':
        'L’opération n’a pas pu aboutir pour {elemento}. Consultez Services et ses journaux.',
      'workspaces.base_no_responde':
        '{elemento} n’a pas démarré car la base de données de ce projet ne répond pas.',
      'reverb.no_laravel': 'Reverb n’est disponible que dans les projets Laravel.',
      'reverb.no_confiado':
        'Cochez « Je fais confiance à ce dépôt » sur le projet pour activer Reverb.',
      'reverb.sin_paquete':
        'Le paquet laravel/reverb est absent : installez-le avec composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Confirmez que vous voulez activer Reverb.',
      'reverb.sin_activar': 'Activez d’abord Reverb dans le projet.',
      'tareas.cron_invalida':
        'L’expression cron n’est pas valide. Utilisez 5 champs : minute, heure, jour du mois, mois et jour de la semaine (par exemple, 0 3 * * *).',
      'tareas.comando_invalido':
        'Cette commande n’est pas autorisée. Utilisez php, node, npm run ou python avec un fichier du projet, sans code sur la ligne de commande (-r, -e, -c).',
      'tareas.invalida':
        'La tâche n’est pas valide : vérifiez son nom, son horaire et sa commande.',
      'tareas.no_existe': 'Cette tâche n’existe plus.',
      'tareas.sin_confirmar': 'Confirmez la commande de la tâche pour pouvoir l’exécuter.',
      'tareas.sitio_no_confiado':
        'Cochez « Je fais confiance à ce dépôt » sur le projet pour exécuter ses tâches.',
      'tareas.receta_cambio':
        'La recette du projet a changé depuis que vous lui avez fait confiance : vérifiez-la et cochez de nouveau « Je fais confiance à ce dépôt ».',
      'tareas.aislado':
        'Ceci est un dossier de données de test (WOLFCORE_DATOS) : autorisez les tâches planifiées pour les exécuter.',
      'tareas.carpeta': 'Le dossier du projet n’existe pas : la tâche ne peut pas s’exécuter.',
      'tareas.en_curso': 'La tâche est déjà en cours d’exécution.',
      'tareas.demasiadas': 'Ce projet a trop de tâches (maximum {maximo}).',
      'cli.no_autorizado':
        'La commande de la CLI n’est pas autorisée : relancez-la avec l’application WolfCore Dev ouverte.',
      'cli.orden_desconocida': 'WolfCore Dev ne connaît pas cette commande de la CLI.',
      'cli.argumentos_invalidos': 'Les arguments de la commande ne sont pas valides.',
      'cli.solicitud_grande': 'La requête est trop volumineuse (maximum {maximo} octets).',
      'cli.formato_no_admitido': 'La requête n’a pas le format accepté par la CLI.',
      'cli.plazo':
        'La commande a pris trop de temps : elle est peut-être encore en cours. Vérifiez son état dans WolfCore Dev.',
      'cli.ocupado': 'WolfCore Dev traite trop de commandes de la CLI : patientez un instant.',
      'cli.requiere_confirmacion':
        'Cette commande publie ou modifie quelque chose et doit être confirmée (--si) pour {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} contient des données réelles : confirmez aussi avec l’option données réelles de la commande (le domaine du site).',
      'cli.requiere_confirmacion_global':
        'Changer le PHP de tous les terminaux doit être confirmé (--si).',
      'cli.confirmacion_rechazada':
        'La confirmation dans la fenêtre de WolfCore Dev a été refusée ou indisponible : rien n’a été fait.',
      'cli.confirmacion_vencida':
        'Personne n’a confirmé à temps dans la fenêtre de WolfCore Dev : rien n’a été fait.',
      'cli.tunel_fallo':
        'Le tunnel n’a pas pu être ouvert. Consultez son journal dans WolfCore Dev.',
      'cli.inicio_fallo':
        'Tout ce qui était demandé n’a pas pu être démarré. Consultez les journaux dans WolfCore Dev.',
      'cli.parada_fallo':
        'Tout ce qui était demandé n’a pas pu être arrêté. Consultez les journaux dans WolfCore Dev.',
      'cli.interno': 'Erreur interne du serveur de la CLI.',
      'cli.proveedor_distinto':
        'Le site utilise un autre fournisseur de tunnel ({proveedor}). Vérifiez et confirmez à nouveau.',
      'cli.sitio_no_encontrado': 'Le site {sitio} n’existe pas.',
      'cli.carpeta_invalida':
        'Le dossier n’existe pas, est un dossier système ou est le dossier de données de WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Ce dossier n’appartient à aucun site WolfCore Dev : liez-le d’abord.',
      'cli.ya_vinculada': 'Ce dossier est déjà le site {sitio}.',
      'cli.tipo_no_soportado':
        'Les projets de type {tipo} se créent depuis l’interface de WolfCore Dev.',
      'cli.sitio_sin_php': 'Le site {sitio} n’utilise pas PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} n’est pas installé. Installez-le depuis Services.',
      'cli.fuente_no_existe': 'Ce journal n’existe pas encore.',
      'cli.token_no_protegido':
        'Impossible de restreindre le fichier du jeton à l’utilisateur actuel : la CLI n’est pas activée.',
      'cli.carpeta_ajena':
        'Le dossier run/ du dossier de données appartient à un autre utilisateur : la CLI n’est pas activée.',
      'cli.ruta_invalida':
        'Le chemin de WolfCore Dev contient des caractères que wolf.cmd n’accepte pas.',
      'cli.path_aislado':
        'Avec un dossier de données de test (WOLFCORE_DATOS), le PATH de l’utilisateur n’est pas modifié.',
      'cli.sin_cliente':
        'Cette version de WolfCore Dev n’inclut pas le client wolf (il reste à le compiler).',
      'cli.demasiados_dialogos':
        'Trop de confirmations en une minute : patientez un instant et réessayez.',
      'cli.error': 'La commande n’a pas pu être terminée : {detalle}',
      'proyectos.carpeta_no_vacia':
        'Le dossier du projet contient déjà des fichiers : choisissez-en un autre ou videz-le.',
      'secretos.sin_cifrado':
        'Le chiffrement du système n’est pas disponible : le mot de passe de l’utilisateur dédié ne peut pas être enregistré. Rien n’a été modifié.',
      'proyectos.clave_bd_falta':
        'Le mot de passe enregistré de l’utilisateur {usuario} est absent : rien n’a été écrit. Dans le gestionnaire de .env, « Utiliser un utilisateur dédié » génère un nouveau mot de passe.',
      'env.archivo_grande': 'Le fichier de variables est trop volumineux (maximum {maximo}).',
      'env.no_regular': 'Le .env n’est pas un fichier normal : il n’est ni lu ni modifié.',
      'env.clave_inexistente': 'La variable {clave} n’existe pas.',
      'env.cambio_invalido': 'Une modification du .env n’est pas valide.',
      'env.variable_invalida': 'La modification de la variable {clave} n’est pas valide.',
      'env.solo_lectura':
        'La variable {clave} occupe plusieurs lignes : modifiez-la à la main dans le fichier.',
      'env.usuario_compartido':
        'La base {base} est aussi utilisée par le projet {proyecto} : confirmez si vous voulez partager son utilisateur.',
      'env.cambio_externo':
        'Le .env a changé depuis l’aperçu : vérifiez-le de nouveau avant d’enregistrer.',
      'env.meilisearch_no_disponible':
        'Meilisearch n’est pas installé : installez-le dans Services.',
      'env.sin_confirmar': 'Confirmez que vous voulez enregistrer les modifications du .env.',
      'env.versionado':
        'Git suit déjà le .env de ce projet : le prochain commit enverrait ses valeurs. Confirmez séparément pour continuer.',
      'env.versionado_desconocido':
        'Impossible de vérifier si git suit le .env de ce projet : confirmez séparément pour continuer.',
      'env.copia_invalida': 'La copie du .env n’est pas valide ou n’existe plus.',
      'env.sin_base': 'Le .env de ce projet n’a pas de connexion à une base de données.',
      'env.base_no_resuelta':
        'La base de ce projet n’est pas sur un serveur local de WolfCore Dev : rien n’a été modifié.',
      'env.motor_no_soportado':
        'Pour l’instant « Utiliser un utilisateur dédié » fonctionne avec MySQL et MariaDB.',
      'env.ya_usa_usuario_propio': 'Ce projet utilise déjà son propre utilisateur.',
      'plantillas.id_invalido': "L'identifiant du modèle n'est pas valide.",
      'plantillas.no_existe': "Le modèle n'existe pas.",
      'plantillas.danada':
        'Le modèle est endommagé ou a été modifié : il ne sera pas utilisé. Supprimez-le et enregistrez-le à nouveau.',
      'plantillas.demasiado_grande':
        "Le projet contient trop de fichiers ou est trop volumineux pour être enregistré comme modèle (jusqu'à {maximo} fichiers). Excluez les gros dossiers.",
      'plantillas.demasiado_pesada':
        "Le projet est trop volumineux pour être enregistré comme modèle (jusqu'à {maximo}). Excluez les gros dossiers.",
      'plantillas.exclusion_invalida':
        "Une des exclusions n'est pas valide (utilisez des noms ou des chemins relatifs, sans « .. »).",
      'plantillas.nombre_invalido': "Le nom du modèle n'est pas valide (de 1 à 60 caractères).",
      'plantillas.esquema_fallo':
        'Impossible de lire le schéma de la base du projet : vérifiez que son service est démarré.',
      'plantillas.base_no_resuelta':
        "Impossible d'enregistrer le modèle : le serveur de la base est distant ou aucun service local n'utilise ce port.",
      'plantillas.sin_generador_base':
        "Ce type de projet n'a pas de générateur de base : le modèle doit inclure les fichiers du projet.",
      'plantillas.exclusiones_nuevas':
        'Le modèle contient un fichier désormais exclu ({archivo}) : enregistrez-le à nouveau depuis le projet ou supprimez-le.',
      'plantillas.motor_distinto':
        "Le schéma du modèle vient de MySQL et le serveur choisi est MariaDB (ou l'inverse) : il peut y avoir des différences. Confirmez que vous voulez continuer.",
      'bd.sql_no_permitido':
        "Le schéma contient une instruction qui n'est pas de structure et rien n'a été exécuté : {sentencia}",
      'bd.extension_no_permitida':
        "Le schéma demande l'extension {nombre}, qui n'est pas dans la liste autorisée : rien n'a été restauré.",
      'bd.esquema_fallo':
        "Impossible de restaurer le schéma complet : rien n'a été laissé à moitié.",
      'bd.datos_no_permitidos':
        "L'export de données contient autre chose que des données (seuls INSERT, LOCK TABLES et SET sont acceptés) : rien n'a été importé.",
      'bd.datos_fallo':
        "Impossible d'importer les données : la base est restée telle quelle, rien n'a été laissé à moitié.",
      'bd.lentas_confirmar':
        "Modifier le journal des requêtes lentes concerne tout le serveur : il faut le confirmer. Rien n'a été modifié.",
      'bd.lentas_umbral_invalido': 'La durée doit être comprise entre 0,1 et 60 secondes.',
      'bd.lentas_motor_no_soportado':
        'Les requêtes lentes ne peuvent être modifiées que sur MySQL, MariaDB et PostgreSQL gérés par WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        "Le SQL n'est pas affiché avec ses valeurs : la base contient de vraies données ou la requête ne peut pas être attribuée à une base connue.",
      'bd.lentas_entrada_no_existe': "Cette requête n'est plus dans le journal. Relisez-le.",
      'bd.lentas_fallo':
        'Impossible de lire ou de modifier le journal des requêtes lentes. Vérifiez que le serveur est démarré.',
      'bd.esquema_base_no_existe': "La base n'existe pas sur ce serveur.",
      'bd.esquema_motor_no_soportado':
        'Le visualiseur de schéma est destiné à MySQL, MariaDB et PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Impossible de lire le schéma de la base. Vérifiez que le serveur est démarré.',
      'perfiles.destino_invalido': 'Choisissez où enregistrer le profil (un fichier .wolfperfil).',
      'perfiles.frase_debil': 'La phrase de la CA doit comporter au moins {minimo} caractères.',
      'perfiles.frase_incorrecta': "La phrase n'est pas correcte : rien n'a été importé.",
      'perfiles.certificados_sin_ca':
        "Les certificats des sites ne voyagent qu'avec la CA chiffrée : incluez la CA avec une phrase.",
      'perfiles.no_existe': "Le fichier du profil n'existe pas.",
      'perfiles.danado': "Le profil est endommagé ou a été modifié : rien n'a été importé.",
      'perfiles.demasiado_grande': "Le profil est trop volumineux (jusqu'à {maximo}).",
      'perfiles.version_no_soportada':
        "Le profil provient d'une version plus récente de WolfCore Dev (format {version}) : mettez l'application à jour pour l'importer.",
      'perfiles.sin_confirmar': 'Confirmez que vous voulez importer le profil.',
      'perfiles.vista_previa_vieja':
        "Le dossier de données ou le profil a changé depuis l'aperçu : vérifiez-le à nouveau.",
      'perfiles.carpeta_datos_invalida':
        "WOLFCORE_DATOS n'est pas un dossier de données valide : il doit être absolu, hors des dossiers système et différent du dossier réel.",
      'perfiles.confirmar_reemplazar_ca':
        "Le profil contient une CA et cet ordinateur a déjà la sienne : comparez l'empreinte et confirmez séparément que vous voulez la remplacer (uniquement s'il s'agit de votre propre CA).",
      'herramientas.imagen_tipo':
        'Ce fichier n’est pas une image prise en charge (PNG, JPG, WebP, GIF, BMP ou ICO) ou son contenu ne correspond pas à son type.',
      'herramientas.imagen_grande': 'L’image est trop lourde (jusqu’à {maximo}).',
      'herramientas.imagen_dimensiones':
        'L’image est trop grande ({ancho}×{alto} px ; jusqu’à {maximo} px par côté) et n’est pas ouverte par sécurité.',
      'herramientas.zip_sin_archivos':
        'Il n’y a aucun fichier à compresser (les liens ne sont pas suivis).',
      'herramientas.zip_demasiados': 'Il y a trop de fichiers à compresser (jusqu’à {maximo}).',
      'herramientas.zip_grande': 'Ce que vous voulez compresser est trop lourd (jusqu’à {maximo}).',
      'herramientas.pdf_invalido': 'Le fichier n’est pas un PDF pouvant être optimisé.',
      'herramientas.pdf_grande': 'Le PDF est trop lourd (jusqu’à {maximo}).',
      'herramientas.pdf_cifrado':
        'Le PDF est protégé par un mot de passe et ne peut pas être optimisé.',
      'herramientas.pdf_plazo': 'Le PDF a pris plus de {segundos} s et a été annulé.',
      'herramientas.salida_ocupada': 'Aucun nom libre n’a été trouvé pour le nouveau fichier.',
      'captura.atajo_invalido':
        'Ce raccourci n’est pas valide : utilisez Ctrl, Alt, Maj ou Super avec une lettre, un chiffre ou une touche F.',
      'captura.atajo_no_permitido':
        'Ce raccourci n’est pas autorisé : utilisez Ctrl ou Super avec un autre modificateur (Ctrl+Alt sans Maj est AltGr et empêche de taper @) et évitez les raccourcis courants comme Ctrl+C ou Alt+F4.',
      'captura.atajo_ocupado': 'Le raccourci {atajo} est déjà utilisé par un autre programme.',
      'captura.no_disponible': 'La capture d’écran n’est pas disponible sur cet ordinateur.',
      'captura.permiso_denegado': 'L’autorisation d’enregistrement de l’écran manque.',
      'captura.sin_imagen': 'Il n’y a aucune image à capturer.',
      'captura.imagen_invalida': 'L’image de la capture n’est pas valide.',
      'conversor.formato': 'Cette conversion n’est pas disponible.',
      'disco.sin_confirmar': 'Confirmez le nettoyage dans la boîte de dialogue avant de continuer.',
      'disco.categoria_invalida': 'Cette catégorie de nettoyage n’existe pas.',
      'disco.ruta_vetada':
        'La catégorie touche un chemin protégé (données, sauvegardes, projets ou FlyEnv) ; rien n’a été nettoyé.',
      'disco.sin_analisis': 'Analysez de nouveau avant de nettoyer : l’analyse a expiré ou manque.',
      'disco.ocupada': 'Une analyse ou un nettoyage est déjà en cours.',
      'disco.sin_registro': 'Le journal du nettoyage n’a pas pu être créé ; rien n’a été supprimé.',
      'editor.sin_confirmar': 'Confirmez l’enregistrement avant de continuer.',
      'editor.confirmacion_reforzada':
        'Ce fichier semble contenir des secrets ou appartient à un site avec des données réelles : confirmez avec la vérification renforcée pour l’enregistrer.',
      'editor.ruta_invalida': 'Le chemin du fichier n’est pas valide.',
      'editor.no_existe': 'Le fichier n’existe pas.',
      'editor.no_regular': 'Seuls les fichiers ordinaires peuvent être modifiés.',
      'editor.ruta_vetada':
        'Ce fichier se trouve dans le dossier de données de WolfCore Dev : il ne s’ouvre ni ne s’enregistre depuis l’éditeur.',
      'editor.archivo_env':
        'Les fichiers .env se gèrent depuis les variables du projet, pas depuis l’éditeur.',
      'editor.demasiado_grande':
        'Le fichier est trop volumineux pour l’éditeur (maximum {maximo}).',
      'editor.binario':
        'Le fichier n’est pas du texte (il est binaire) : il ne peut pas être modifié ici.',
      'editor.codificacion':
        'Le fichier n’est pas en UTF-8 : l’éditeur ne l’ouvre pas afin de ne pas l’endommager.',
      'editor.no_abierto':
        'Ce fichier n’a pas été ouvert dans l’éditeur (ou sa version a changé) : rouvrez-le.',
      'editor.eol_mixto':
        'Le fichier mélange des fins de ligne : confirmez leur normalisation pour enregistrer.',
      'editor.contenido_invalido': 'Le contenu n’est pas du texte valide.',
      'editor.huella_invalida': 'L’empreinte du fichier ouvert est absente : rouvrez-le.',
      'editor.archivo_cambiado':
        'Le fichier a changé en dehors de l’éditeur depuis son ouverture. Rechargez-le ou confirmez l’écrasement.',
      'editor.copia_fallo':
        'La copie préalable n’a pas pu être faite ({codigo}) ; rien n’a été enregistré.',
      'editor.lectura_fallo': 'Le fichier n’a pas pu être lu ({codigo}).',
      'editor.escritura_fallo':
        'Le fichier n’a pas pu être enregistré ({codigo}). L’original n’a pas été touché.',
      'memoria.sin_confirmar': 'Confirmez l’action dans la boîte de dialogue avant de continuer.',
      'memoria.modo_invalido': 'Ce mode d’optimisation n’existe pas.',
      'memoria.plan_caducado':
        'La liste a expiré ou n’est plus la liste actuelle. Affichez-la de nouveau avant d’appliquer.',
      'memoria.no_disponible':
        'L’optimiseur de mémoire n’est pas disponible ici ou n’a pas pu lire le système.',
      'conversor.archivo_invalido':
        'Le fichier est endommagé ou n’est pas du type indiqué par son extension.',
      'conversor.archivo_grande': 'Le fichier est trop volumineux (jusqu’à {maximo}).',
      'conversor.archivo_peligroso':
        'Le fichier ressemble à une bombe ZIP ou a été manipulé (trop de contenu, entités XML ou noms invalides) et n’est pas ouvert par sécurité.',
      'conversor.limite_filas': 'Le tableau a trop de lignes (jusqu’à {maximo}).',
      'conversor.limite_columnas': 'Le tableau a trop de colonnes (jusqu’à {maximo}).',
      'conversor.limite_paginas': 'Le PDF a trop de pages (jusqu’à {maximo}).',
      'conversor.pdf_cifrado': 'Le PDF est protégé par mot de passe et ne peut pas être converti.',
      'conversor.plazo': 'La conversion a duré plus de {segundos} s et a été annulée.',
      'conversor.ocupado':
        'Une conversion est déjà en cours et une autre est en attente : attendez qu’elle se termine.',
      'conversor.cancelado': 'Conversion annulée.',
      'conversor.libreoffice_ausente':
        'Cette conversion nécessite LibreOffice, qui n’est pas installé sur cet ordinateur (WolfCore Dev ne l’installe pas).',
      'conversor.libreoffice_fallo': 'LibreOffice n’a pas pu convertir le document.',
      'conversor.limite_celdas': 'Le tableau a trop de cellules (jusqu’à {maximo}).',
      'conversor.memoria':
        'Le fichier nécessite trop de mémoire (plus de {maximo}) et a été annulé.',
      'conversor.pdf_no_disponible': 'L’impression en PDF n’est pas disponible pour le moment.',
      'herramientas.imagen_pixeles':
        'L’image compte trop de pixels au total ({ancho}×{alto} px ; jusqu’à {maximo}) et n’est pas ouverte par sécurité.',
      'herramientas.zip_cambio': 'Un fichier a changé pendant la compression : réessayez.',
      'herramientas.pdf_demasiado_complejo':
        'Le PDF est trop complexe (il gonflerait plus de mémoire que permis) et a été annulé.',
      'herramientas.salida_denegada':
        'Impossible d’écrire à cet emplacement : vérifiez l’autorisation ou que le dossier existe.',
      'herramientas.fuera_de_la_ca':
        'La CA de WolfCore Dev ne signe que les domaines .test, localhost et les adresses locales : {dominio} ne peut pas être inclus.',
      'perfiles.frase_requerida':
        'Saisissez la phrase du profil pour importer ses bases ou sa CA (ou importez sans les bases).',
      'perfiles.sin_espacio':
        "Il n'y a pas assez d'espace libre pour importer le profil : {necesarios} nécessaires, {libres} disponibles.",
      'perfiles.ca_sin_restricciones':
        "Cette CA peut signer n'importe quel site web : importez-la uniquement si c'est la vôtre et comparez l'empreinte. Confirmez séparément pour continuer.",
      'perfiles.ca_restricciones_ajenas':
        "La CA du profil a des contraintes de nom qui ne sont pas celles de WolfCore Dev : elle n'est pas importée.",
      'perfiles.instantanea_fallo':
        "La copie préalable de l'environnement n'a pas pu être enregistrée : rien n'a été modifié. Vérifiez l'espace disque et les droits du dossier de données.",
      'perfiles.en_curso':
        "Une importation de profil est déjà en cours : attendez qu'elle se termine.",
      'importar.origen_apagado':
        "Impossible de se connecter au serveur de base de données de l'autre programme : démarrez-le depuis ce programme et réessayez. Les sites ont tout de même été importés.",
      'importar.origen_no_local':
        'Le serveur source doit se trouver sur cet ordinateur (127.0.0.1).',
      'importar.origen_rechazado': "Le serveur source a refusé l'utilisateur ou le mot de passe.",
      'importar.origen_version':
        'La version du serveur source ne peut pas être importée avec ce que WolfCore Dev a installé.',
      'importar.volcado_enorme':
        "Les données de la base dépassent {maximo} Mo : elles ne sont pas importées d'un coup.",
      'importar.motor_no_soportado':
        "Seules les bases MySQL et MariaDB peuvent être importées depuis d'autres programmes.",
      'importar.ruta_fuera':
        "Un dossier ou fichier qui pointe hors de l'installation ou vers un dossier système a été écarté.",
      'importar.carpeta_invalida':
        "Un dossier qui n'existe plus ou n'est pas un dossier a été écarté.",
      'importar.archivo_grande':
        "Un fichier de configuration dépasse {maximo} Ko et n'a pas été lu.",
      'importar.archivo_ilegible':
        "Un fichier de configuration n'est pas du texte ou n'a pas pu être lu.",
      'importar.demasiados':
        'Il y a trop de sites ou de fichiers de configuration : seuls les premiers ont été lus.',
      'importar.candidato_desconocido':
        "Ce site n'apparaît plus dans le programme source : relancez la recherche.",
      'importar.ya_vinculado': 'Ce dossier est déjà un site WolfCore Dev.',
      'importar.dominio_existe':
        "Un site avec le domaine {dominio} existe déjà : modifiez-le avant d'importer.",
      'importar.sin_php':
        "Ce site a besoin de PHP et aucune version n'est installée : installez-en une depuis Services.",
      'importar.base_existe':
        "La base {nombre} existe déjà à destination et n'a pas été touchée. Confirmez le remplacement pour l'importer (une copie est faite avant).",
      'importar.base_fallo':
        "Impossible d'importer la base {nombre} : elle est restée telle quelle, rien n'a été laissé à moitié.",
      'importar.sitio_fallo': 'Impossible de créer le site.',
      'importar.origen_invalido':
        'Les informations du serveur source ne sont pas valides (utilisateur, mot de passe ou port).',
      'importar.sin_seleccion': 'Choisissez au moins un site à importer.',
      'importar.en_curso': "Une importation est déjà en cours : attendez qu'elle se termine.",
      'importar.cancelado':
        "Importation annulée : ce qui était en cours d'importation est resté tel quel.",
      'importar.origen_estancado':
        "Le serveur de l'autre programme a cessé de répondre pendant l'export : la base n'a pas été importée.",
      'importar.sin_espacio':
        "Pas assez d'espace libre pour importer la base : environ {necesarios} Mo sont nécessaires et {libres} Mo sont libres.",
      'importar.origen_fallo': "Impossible d'exporter la base de l'autre programme.",
      'importar.clave_no_ascii':
        "Le mot de passe contient des accents ou des symboles qui ne peuvent pas être transmis à l'export : utilisez un mot de passe en ASCII uniquement.",
      'plantillas.sin_esquema': "Le modèle ne contient pas le schéma d'une base de données.",
      'proyectos.carpeta_invalida': 'Le dossier du projet n’est pas valide.',
      'proyectos.nombre_invalido':
        'Le nom du projet ne peut contenir que des minuscules, des chiffres et des tirets (40 au maximum).',
      'proyectos.argumento_invalido': 'Une donnée du projet n’est pas valide (champ : {campo}).',
      'proyectos.base_existe': 'La base {nombre} existe déjà : choisissez un autre nom.',
      'proyectos.dominio_existe': 'Un site avec le domaine {dominio} existe déjà.',
      'proyectos.carpeta_de_otro_sitio':
        'Ce dossier est celui du projet {dominio} ou se trouve dedans : choisissez-en un autre.',
      'proyectos.sin_python': 'Aucun Python n’est installé : installez-le depuis Services.',
      'proyectos.venv_ajeno':
        "Le projet contient son propre .venv et WolfCore Dev n'exécute pas le Python d'un dépôt tiers : supprimez-le et recréez l'environnement.",
      'proyectos.paso_base_no_omitible':
        'L’étape "Créer la base de données" d’un nouveau projet ne peut pas être ignorée.',
      'proyectos.sin_php': 'Aucun PHP n’est installé : installez-le depuis Services.',
      'proyectos.php_no_instalado':
        'PHP {version} n’est pas installé : installez-le depuis Services.',
      'proyectos.python_no_instalado':
        'Python {version} n’est pas installé : installez-le depuis Services.',
      'mcp.token_invalido': 'Le jeton du serveur MCP n’est pas valide.',
      'mcp.solicitud_cancelada':
        'Le client MCP a annulé la demande : l’action n’a pas été exécutée.',
      'doctor.puerto_ocupado':
        'Le port {puerto} de {servicio} est utilisé par un autre programme ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) occupe le port {puerto} de {servicio}.',
      'doctor.puerto_http_sys':
        'Un service Windows ({programa}) occupe le port {puerto} de {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} occupe le port {puerto} de {servicio}. Fermez-le ou changez le port de WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} occupe le port {puerto} de {servicio}.',
      'doctor.puerto_skype': '{programa} occupe le port {puerto} de {servicio}.',
      'doctor.puerto_reservado':
        'Le port {puerto} de {servicio} se trouve dans une plage réservée par Windows ({desde}-{hasta} : Hyper-V, WSL ou Docker).',
      'doctor.ca_por_vencer':
        'L’autorité de certification de WolfCore Dev expire dans {dias} jours.',
      'doctor.ca_vencida': 'L’autorité de certification de WolfCore Dev a expiré.',
      'doctor.certificado_por_vencer': 'Le certificat de {dominio} expire dans {dias} jours.',
      'doctor.certificado_vencido': 'Le certificat de {dominio} a expiré.',
      'doctor.hosts_ilegible': 'Impossible de lire le fichier hosts.',
      'doctor.hosts_utf16':
        'Le fichier hosts est enregistré en UTF-16 : Windows risque de ne pas lire ses entrées.',
      'doctor.hosts_bloque_duplicado':
        'Le fichier hosts contient {bloques} blocs de WolfCore Dev ; il doit y en avoir un.',
      'doctor.hosts_bloque_sin_cierre':
        'Un bloc de WolfCore Dev dans le fichier hosts n’a pas sa marque de fermeture.',
      'doctor.hosts_dominios_faltantes':
        'Il manque {cantidad} domaines de vos sites dans le fichier hosts.',
      'doctor.hosts_solo_lectura':
        'Le fichier hosts est en lecture seule (souvent à cause d’un antivirus). WolfCore Dev peut quand même l’écrire avec une autorisation administrateur.',
      'doctor.path_duplicados':
        'Le PATH de l’utilisateur contient {cantidad} entrées répétées de WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Un autre dossier contenant {programa} ({origen}) précède WolfCore Dev dans le PATH : les terminaux utiliseront celui-là.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) manque : PHP et d’autres services ne démarrent pas sans lui.',
      'doctor.enlazador_msvc_ausente':
        'Rust est installé mais les outils C++ de Visual Studio Build Tools (éditeur de liens MSVC) manquent : cargo ne pourra pas lier les programmes.',
      'doctor.antivirus_sin_exclusion':
        'L’antivirus analyse le dossier de données de WolfCore Dev : PHP et les services peuvent démarrer lentement.',
      'doctor.firewall_reglas':
        'Windows laisse entrer depuis le réseau {cantidad} règle(s) de programmes de WolfCore Dev (nginx, PHP ou bases de données) sur les profils {perfiles} : ces programmes sont ouverts au réseau.',
      'doctor.firewall_no_comprobado':
        'Impossible de vérifier le pare-feu de Windows (les droits d’administrateur peuvent être nécessaires).',
      'doctor.firewall_reglas_ajenas':
        'Il y a {cantidad} règle(s) entrante(s) d’autres programmes (FlyEnv, Laragon, XAMPP ou autres) pour nginx, PHP ou des bases de données sur les profils {perfiles}. Elles ne sont pas de WolfCore Dev : elles sont seulement affichées et jamais supprimées d’ici.',
      'doctor.firewall_reglas_acotadas':
        'Il y a {cantidad} règle(s) de programmes de WolfCore Dev limitées au réseau local (profil privé uniquement, sous-réseau local et ports précis), comme celles que l’application recommande elle-même pour partager un site. Elles sont seulement affichées : elles ne sont pas supprimées d’ici.',
      'doctor.firewall_almacen_inseguro':
        'La copie protégée des règles n’est pas fiable (autorisations ou contenu différents de ce qui était affiché) : aucune règle n’a été créée ni modifiée.',
      'doctor.firewall_quitadas':
        'WolfCore Dev a supprimé auparavant {cantidad} règle(s) du pare-feu et en a gardé une copie : vous pouvez les recréer si besoin.',
      'doctor.firewall_parcial':
        'Certaines règles ont été supprimées, d’autres non : elles ont changé depuis l’affichage de la liste, n’étaient pas de WolfCore Dev ou Windows n’a pas permis de les supprimer. Vérifiez la liste.',
      'doctor.firewall_sin_cambios':
        'Aucune règle n’a été modifiée : elles ne correspondent plus à ce qui était affiché ou n’ont pas pu être modifiées.',
      'doctor.firewall_registro_fallido':
        'La copie des règles n’a pas pu être enregistrée dans etc/cortafuegos-quitadas.json : rien n’a été modifié.',
      'doctor.servicio_en_error': '{servicio} est en erreur.',
      'doctor.revision_fallida': 'La vérification {revision} n’a pas pu être menée à terme.',
      'doctor.confirmacion_requerida': 'Confirmez la réparation avant de l’appliquer.',
      'doctor.hallazgo_desconocido': 'Ce constat n’existe plus : relancez la vérification.',
      'doctor.solo_informa':
        'Ce constat n’a pas de réparation automatique : suivez les indications.',
      'doctor.reparacion_fallida': 'La réparation n’a pas pu être appliquée.',
      'doctor.reparacion_cancelada':
        'L’autorisation administrateur a été annulée : rien n’a été modifié.',
      'doctor.reparacion_denegada':
        'Windows ou un antivirus a refusé l’accès : rien n’a été modifié.',
      'doctor.ya_resuelto': 'Le problème n’existait plus : il n’y a rien eu à modifier.',
      'doctor.ca_vieja_sin_quitar':
        'La nouvelle autorité de certification est déjà utilisée, mais l’ancienne n’a pas pu être retirée du magasin de Windows. Vous pouvez la retirer depuis la section HTTPS.',
      'doctor.sin_puerto_libre': 'Aucun port libre n’a été trouvé pour déplacer le service.',
      'doctor.ca_vuelta_atras_incompleta':
        'La nouvelle autorité n’a pas pu être appliquée et le retour en arrière est resté incomplet. Consultez la section HTTPS ; une copie datée se trouve dans etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox ne fait pas confiance à l’autorité de WolfCore Dev dans {cantidad} profils (il utilise son propre magasin).',
      'confianza.sin_ca':
        'Il n’y a pas encore d’autorité de certification : créez-en une depuis HTTPS.',
      'confianza.sin_raices':
        'Aucune racine de confiance trouvée pour Python (ni certifi ni celles de Windows) : rien n’a été modifié.',
      'confianza.node_variable_ajena':
        'Vous avez déjà votre propre NODE_EXTRA_CA_CERTS : WolfCore Dev ne la remplace pas.',
      'confianza.variable_fallida': 'La variable de l’utilisateur n’a pas pu être modifiée.',
      'firefox.abierto': 'Firefox est ouvert : fermez-le et réessayez.',
      'firefox.error': 'Le user.js de ce profil n’a pas pu être modifié ; il est resté tel quel.',
      'firefox.fuera':
        'Des profils se trouvent hors du dossier de Firefox : activez-les depuis Confiance de la CA, avec une confirmation distincte.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS ne pointe plus vers l’autorité de WolfCore Dev (modifiée à la main) : elle n’a pas été supprimée.',
      'ia.clave_invalida':
        'Le fournisseur a refusé la clé : vérifiez-la ou générez-en une nouvelle.',
      'ia.sin_saldo': 'Le compte du fournisseur n’a plus de solde ni de quota disponible.',
      'ia.limite': 'Le fournisseur a limité les requêtes : patientez un instant et réessayez.',
      'ia.region': 'Le fournisseur ne dessert pas votre pays ou votre région.',
      'ia.sin_red': 'Impossible de joindre le fournisseur : vérifiez le réseau ou l’URL de base.',
      'ia.url_invalida':
        'L’URL de base n’est pas valide : utilisez https:// (ou http:// uniquement vers 127.0.0.1 ou [::1]), sans utilisateur ni mot de passe.',
      'ia.plazo': 'Le fournisseur n’a pas répondu en {segundos} s.',
      'ia.respuesta_rara': 'Le fournisseur a répondu quelque chose d’inattendu.',
      'ia.cancelado': 'La requête au fournisseur a été annulée.',
      'ia.sin_clave': 'Ce fournisseur a besoin d’une clé : enregistrez-la d’abord.',
      'ia.clave_mal_formada': 'La clé n’a pas un format valide (sans espaces ni sauts de ligne).',
      'ia.modelo_invalido': 'Le nom du modèle n’est pas valide.',
      'ia.modelo_no_disponible': 'Le modèle n’existe pas ou votre compte n’y a pas accès.',
      'ia.proveedor_invalido': 'La configuration du fournisseur n’est pas valide.',
      'ia.env_conflicto':
        'Le .env définit déjà {claves} avec une autre valeur : confirmez si vous voulez la remplacer.',
      'ia.env_sin_confirmar':
        'Confirmez que vous voulez écrire la clé dans le .env (elle y reste en clair).',
      'ia.env_versionado':
        'Git suit déjà le .env de ce projet : le prochain commit enverrait la clé même si elle est dans .gitignore. Retirez-le de l’index avec git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Impossible de vérifier si Git suit déjà le .env de ce projet : confirmez à part que vous voulez écrire la clé.',
      'ia.proveedor_no_existe': 'Le fournisseur d’IA n’existe plus.',
      'ia.url_cambia_con_clave':
        'Le fournisseur a une clé enregistrée : confirmez que vous voulez l’envoyer à la nouvelle URL.',
      'ia.mensaje_sin_confirmar':
        'Confirmez l’envoi du message de test (il consomme des jetons de votre compte).',
      'ia.clave_ilegible':
        'Impossible de lire la clé enregistrée du fournisseur : supprimez-la et enregistrez-la de nouveau.',
      'ia.argumento_invalido': 'Donnée non valide ({campo}).',
      'correo.auth': 'Le fournisseur a refusé l’identifiant ou la clé.',
      'correo.conexion': 'Impossible de se connecter au serveur SMTP : vérifiez l’hôte et le port.',
      'correo.tls':
        'Impossible d’établir une connexion chiffrée valide avec le serveur (certificat, nom ou STARTTLS). Rien n’a été envoyé.',
      'correo.rechazado':
        'Le serveur a refusé le message ou une adresse. Vérifiez l’expéditeur : beaucoup de fournisseurs n’acceptent qu’un expéditeur ou un domaine vérifié.',
      'correo.plazo': 'Le serveur n’a pas répondu à temps (20 s).',
      'correo.host_invalido':
        'Le serveur SMTP doit être un nom d’hôte ou une IP, sans schéma, port ni chemin.',
      'correo.host_local':
        'Ce serveur pointe vers cet ordinateur ou le réseau local : confirmez pour l’utiliser.',
      'correo.destinatario_invalido': 'L’adresse de destination n’est pas valide.',
      'correo.proveedor_invalido': 'Les données du fournisseur ne sont pas valides.',
      'correo.proveedor_no_existe': 'Le fournisseur de courrier n’existe plus.',
      'correo.sin_clave': 'Le fournisseur n’a pas de clé enregistrée.',
      'correo.clave_ilegible':
        'Impossible de lire la clé enregistrée du fournisseur : supprimez-la et enregistrez-la de nouveau.',
      'correo.cambia_con_clave':
        'Le fournisseur a une clé enregistrée : confirmez que vous voulez l’envoyer au nouveau serveur.',
      'correo.env_sin_confirmar':
        'Confirmez que vous voulez écrire les variables de courrier dans le .env.',
      'correo.ocupado': 'Un test d’envoi est déjà en cours.',
      'correo.limite': 'Attendez {segundos} s avant un autre test d’envoi.',
      'correo.clave_mal_formada':
        'La clé n’est pas valide : uniquement des caractères imprimables, sans saut de ligne, jusqu’à 4096 caractères.',
      'correo.argumento_invalido': 'Donnée non valide ({campo}).',
      'agentes.no_existe': 'Cet agent n’est pas pris en charge.',
      'agentes.sin_confirmar': 'Confirmez l’action dans la boîte de dialogue avant de continuer.',
      'agentes.no_instalable':
        'Cet agent ne s’installe pas depuis WolfCore Dev : suivez le guide officiel ({guia}).',
      'agentes.sin_node': 'Installez Node depuis Services pour pouvoir installer l’agent.',
      'agentes.node_antiguo':
        '{agente} nécessite Node {requerida} ou supérieur et celui qui serait utilisé est le {actual}. Installez un Node plus récent depuis Services.',
      'agentes.node_version_desconocida':
        'La version de Node n’a pas pu être déterminée et {agente} nécessite Node {requerida} ou supérieur. Vérifiez le Node dans Services.',
      'instalador.zip_demasiado_grande':
        'Le paquet téléchargé est trop volumineux ou contient trop de fichiers : il n’est pas installé.',
      'rust.rustup_init_fallo':
        'rustup-init ne s’est pas terminé correctement (code {codigo}) : {detalle}',
      'rust.toolchain_fallo': 'Rust {version} n’a pas pu être installé (code {codigo}) : {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} n’a pas pu être désinstallé : {detalle}',
      'rust.descarga_fallo': 'rustup n’a pas pu être téléchargé (HTTP {estado}).',
      'agentes.instalacion_fallo': 'L’agent n’a pas pu être installé : {detalle}',
      'agentes.no_instalado': '{agente} n’est pas installé.',
      'agentes.mcp_no_soportado':
        '{agente} ne documente pas comment lire le jeton depuis une variable d’environnement : le MCP n’y est pas enregistré.',
      'agentes.config_ilegible':
        '{archivo} n’a pas pu être interprété ; il n’a pas été modifié. Vérifiez-le à la main.',
      'agentes.config_en_uso':
        '{archivo} a changé pendant que WolfCore Dev le modifiait : fermez l’agent et réessayez. Il n’a pas été modifié.',
      'agentes.proveedor_incompatible': '{agente} ne peut pas utiliser ce fournisseur d’IA.',
      'agentes.sin_cambios_preparados': 'Aucun changement préparé (git add) à décrire.',
      'agentes.argumento_invalido': 'Donnée non valide ({campo}).',
      'git.commit_fallo': 'Le commit n’a pas pu être effectué : {detalle}',
      'git.mensaje_invalido': 'Le message de commit est vide ou n’est pas valide.',
      'php.rama_no_instalada': 'PHP {rama} n’est pas installé.',
      'php.argumento_invalido': 'Donnée non valide ({campo}).',
      'php.valor_invalido': 'La valeur de {clave} n’est pas valide.',
      'php.ini_invalido':
        'PHP ne démarre pas avec ce php.ini ; rien n’a été enregistré. Sortie : {salida}',
      'php.no_arranco':
        'PHP {rama} n’a pas redémarré avec le changement ; l’état précédent a été restauré et il répond comme avant.',
      'php.caido_tras_restaurar':
        'PHP {rama} n’a pas redémarré ; l’état précédent a été restauré, mais il ne répond toujours pas. Consultez Services et les journaux de PHP.',
      'php.respaldo_no_existe': 'Cette copie du php.ini n’existe pas.',
      'php.extension_no_existe':
        'L’extension {nombre} n’est pas dans le dossier ext de cette version.',
      'php.extension_no_catalogo':
        'L’extension {nombre} n’est pas dans le catalogue pour cette version.',
      'php.variante_desconocida': 'Impossible de savoir comment ce PHP est compilé.',
      'php.sin_variante': 'Le catalogue n’a pas {nombre} pour la compilation {variante}.',
      'php.huella_distinta':
        'Le téléchargement ne correspond pas à l’empreinte publiée ; rien n’a été installé.',
      'php.descarga_fallida': 'L’extension n’a pas pu être téléchargée : {detalle}',
      'php.extension_en_uso':
        'La DLL de {nombre} est en cours d’utilisation. Arrêtez PHP {rama} et réessayez.',
      'php.extension_sin_dll':
        'La DLL de {nombre} n’a pas pu être remplacée et le dossier ext de PHP {rama} est resté sans elle. Arrêtez PHP {rama} et réessayez : l’ancienne reprend sa place au démarrage.',
      'php.sitio_sin_php': 'Ce site n’utilise pas PHP.',
      'php.sitio_no_arranco':
        'Le PHP propre de {sitio} n’a pas répondu avec le changement ; l’état précédent a été rétabli.',
      'php.sin_puertos_sitio': 'Il ne reste aucun port libre pour les PHP propres des sites.',
      'xdebug.launch_invalido':
        'Le .vscode/launch.json du projet ne peut pas être interprété ; rien n’a été modifié.',
      'xdebug.launch_no_seguro':
        'Le dossier .vscode ou son launch.json est un lien ou autre chose : rien n’y est écrit.',
      'xdebug.sin_configurar': 'Configurez Xdebug sur le site avant de générer le launch.json.',
      'nginx.sitio_no_existe': 'Ce site n’existe plus.',
      'nginx.texto_invalido':
        'Le texte du vhost est trop long, vide ou contient des caractères de contrôle.',
      'nginx.sintaxis': 'Ligne {linea} : {detalle}. Rien n’a été modifié.',
      'nginx.directiva_prohibida':
        'Ligne {linea} : « {directiva} » n’est pas autorisée dans le vhost d’un site (elle pourrait affecter d’autres sites ou des fichiers hors du projet). Rien n’a été modifié.',
      'nginx.ruta_fuera':
        'Ligne {linea} : « {directiva} » pointe hors du dossier du projet ou de ses journaux et certificats. Rien n’a été modifié.',
      'nginx.fuera_de_server':
        'Ligne {linea} : le vhost complet ne peut contenir que des blocs « server » ; « {directiva} » est en dehors. Rien n’a été modifié.',
      'nginx.dominio_ajeno':
        'Ligne {linea} : « {nombre} » n’est pas un domaine de ce site. Ajoutez-le d’abord comme alias du site.',
      'nginx.puerto_ajeno':
        'Ligne {linea} : le site ne peut écouter que sur les ports Nginx configurés dans Réglages.',
      'nginx.version_no_existe': 'Cette version du vhost n’est plus dans l’historique.',
      'nginx.argumento_invalido': 'Argument non valide : {campo}',
      'nginx.destino_interno':
        'Ligne {linea} : « {directiva} » pointe vers un service interne de WolfCore Dev (Adminer, Mailpit, bases de données, PHP d’autres sites…) et l’exposerait sur le réseau et dans les tunnels. Rien n’a été modifié.',
      'nginx.caido_tras_restaurar':
        'Nginx ne répond plus : le vhost précédent a été restauré, mais il ne répond toujours pas. Consultez Services et le journal de Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'Le port {puerto} est déjà utilisé : la capture de dumps ne peut pas écouter. Fermez le programme qui l’utilise (p. ex. un server:dump de Symfony).',
      'depuracion.no_iniciado': 'La capture de dumps est désactivée.',
      'depuracion.tipo_no_soportado': 'La capture de dumps concerne les sites PHP et FastAPI.',
      'depuracion.confirmacion': 'Confirmez la capture de dumps dans la boîte de dialogue.',
      'depuracion.argumento_invalido': 'Argument non valide : {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Ce fichier n’est pas dans le dossier du site : il n’est pas ouvert dans l’éditeur.',
      'contenedores.motor_invalido': 'Moteur de conteneurs inconnu.',
      'contenedores.id_invalido': 'L’identifiant du conteneur n’est pas valide.',
      'contenedores.argumento_invalido': 'Argument non valide : {campo}',
      'contenedores.sin_motor': '{motor} n’est pas installé sur cet ordinateur.',
      'contenedores.no_responde':
        '{motor} ne répond pas. Ouvrez Docker Desktop ou démarrez la machine Podman, puis réessayez.',
      'contenedores.remoto':
        'La connexion par défaut de {motor} pointe vers un autre ordinateur : WolfCore Dev n’utilise que des moteurs locaux.',
      'contenedores.no_existe': 'Le conteneur n’existe plus. Actualisez la liste.',
      'contenedores.accion_fallo': 'Le moteur n’a pas pu le faire : {detalle}',
      'contenedores.demasiados_registros':
        'Vous pouvez suivre au maximum {maximo} journaux de conteneurs à la fois.',
      'contenedores.sin_confirmar': 'Confirmez l’action dans la boîte de dialogue.',
      'catalogo.indice_invalido':
        'L’index des versions de {servicio} n’a pas passé la validation ; la liste enregistrée est utilisée.',
      'catalogo.sin_huella':
        '{servicio} {version} n’a pas d’empreinte publiée : confirmez l’installation dans la boîte de dialogue.',
      'catalogo.huella_debil':
        '{servicio} {version} n’a qu’une empreinte faible (MD5 ou SHA-1) : confirmez l’installation dans la boîte de dialogue.',
      'catalogo.huella_no_coincide': 'Le téléchargement ne correspond pas à l’empreinte publiée.',
      'catalogo.paquete_invalido':
        'Le paquet téléchargé n’est pas sûr (chemins hors du dossier, liens ou taille excessive).',
      'catalogo.extraccion_fallo': 'Le paquet .7z téléchargé n’a pas pu être lu ou extrait.',
      'runtimes.falta_runtime':
        '{nombre} n’est pas installé pour ce projet : installez-le depuis Services.',
      'runtimes.falta_jdk':
        'Aucun JDK n’est installé pour ce projet : installez Java depuis Services.',
      'runtimes.instalacion_incompleta':
        'L’installation de {nombre} est incomplète : réinstallez-la depuis Services.',
      'procesos.escucha_publica':
        'Le processus écoute sur {direccion}:{puerto} ({programa}), ouvert au réseau. Il a été arrêté : il ne peut écouter que sur 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'Le processus écoute sur {direccion}:{puerto} ({programa}), ouvert au réseau. Il a été arrêté : il ne peut écouter que sur 127.0.0.1. C’est le LiveReload de Spring DevTools : désactivez-le avec spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'Le processus écoute sur {direccion}:{puerto} ({programa}), ouvert au réseau. Il a été arrêté : il ne peut écouter que sur 127.0.0.1. C’est l’inspecteur de Node : utilisez --inspect=127.0.0.1.',
      'catalogo.redireccion_ajena':
        'Le téléchargement a tenté d’aller vers un site non autorisé ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Le téléchargement a fait trop de redirections (plus de {maximo}).',
      'catalogo.respuesta_grande': 'La réponse du serveur est trop volumineuse.',
      'catalogo.version_no_encontrada':
        'La version {version} de {servicio} n’est pas dans le catalogue.',
      'catalogo.huella_no_disponible':
        'Impossible d’obtenir l’empreinte de {servicio} {version} (pas de connexion ou la source n’a pas répondu). Réessayez.',
      'catalogo.firma_invalida':
        'La signature PGP de {servicio} {version} n’est pas valide ou n’est pas publiée : rien n’a été installé.',
      'catalogo.firma_no_soportada':
        'La signature PGP de {servicio} {version} utilise un format que WolfCore Dev ne vérifie pas : rien n’a été installé.',
      'catalogo.clave_desconocida':
        'La signature de {servicio} {version} provient d’une clé absente des clés épinglées de l’application : rien n’a été installé.',
      'catalogo.firma_vencida':
        'La signature de {servicio} {version} ou sa clé a expiré : rien n’a été installé. Mettez WolfCore Dev à jour pour avoir des clés à jour.',
      'catalogo.reloj_atrasado':
        'La signature de {servicio} {version} est datée dans le futur : vérifiez la date et l’heure de l’ordinateur et réessayez.',
      'acceso_bd.datos_invalidos': 'Les données d’accès à la base ne sont pas valides.',
      'acceso_bd.sin_base': 'Le .env de ce projet ne pointe pas vers une base de données.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin n’ouvre que les bases MySQL et MariaDB ; utilisez Adminer pour PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'La base de ce projet n’est pas sur un serveur local de WolfCore Dev.',
      'acceso_bd.no_listo': 'L’outil n’est pas prêt : installez-le depuis Services et allumez PHP.',
      'auditoria.tabla_invalida': "La table n'existe pas dans cette base.",
      'auditoria.columna_invalida':
        "La colonne n'existe pas dans cette table (et celles de l'utilisateur et du hash doivent être différentes).",
      'auditoria.usuario_no_encontrado': "Aucun compte n'a cet utilisateur.",
      'auditoria.usuario_repetido':
        "Plusieurs comptes ont cet utilisateur : rien n'a été réinitialisé, pour ne pas toucher le mauvais.",
      'auditoria.formato_no_soportado':
        "Le format du hash actuel ne peut pas être reproduit : rien n'a été réinitialisé.",
      'auditoria.clave_larga':
        "bcrypt n'utilise que les 72 premiers octets du mot de passe : choisissez-en un plus court.",
      'auditoria.clave_invalida': "Le nouveau mot de passe n'est pas valide.",
      'auditoria.sin_confirmar': 'Confirmez que vous voulez réinitialiser ce mot de passe.',
      'auditoria.respaldo_previo_fallo':
        "Impossible d'enregistrer une copie de la base avant la réinitialisation : rien n'a été modifié.",
      'auditoria.copia_fallo':
        "Impossible d'enregistrer la copie de la ligne : rien n'a été modifié.",
      'auditoria.motor_no_soportado':
        "L'audit des mots de passe concerne MySQL, MariaDB et PostgreSQL.",
      'auditoria.cancelada': 'Audit annulé.',
      'auditoria.usuario_invalido': "L'utilisateur doit comporter entre 1 et 256 caractères.",
      'auditoria.en_curso': "Un audit est déjà en cours : attendez qu'il se termine ou annulez-le.",
      'auditoria.base_sistema':
        "Une base système n'est pas auditée : choisissez la base d'un projet.",
      'auditoria.esquema_invalido': "Le schéma n'existe pas dans cette base.",
      'auditoria.fila_cambio':
        "Le compte a changé entre-temps : rien n'a été réinitialisé. Réessayez.",
      'auditoria.verificacion_fallo':
        "La base n'a pas enregistré le mot de passe comme prévu : la modification a été annulée.",
      'auditoria.columna_corta':
        'La colonne du hash accepte {largo} caractères et le nouveau hash en demande {necesario} : rien n’a été modifié. Agrandissez la colonne.',
      'auditoria.datos_reales_sin_confirmar':
        'Cette base contient des données réelles de clients : réinitialiser un mot de passe exige la confirmation renforcée.',
      'instantaneas.id_invalido': 'L’instantané n’est pas valide.',
      'instantaneas.no_encontrada': 'Instantané introuvable ; il a peut-être déjà été supprimé.',
      'instantaneas.otra_base':
        'Cet instantané appartient à une autre base : il ne peut pas être appliqué à celle-ci.',
      'instantaneas.sin_confirmar': 'Confirmez que vous voulez revenir à cet instantané.',
      'instantaneas.motor_no_soportado': 'Les instantanés concernent MySQL, MariaDB et PostgreSQL.',
      'instantaneas.demasiado_grande':
        'La base pèse plus de {maximo} Mo, le maximum qu’un instantané conserve.',
      'instantaneas.sin_espacio':
        'Pas assez d’espace libre pour l’instantané : il faut {necesarios} Mo et il y en a {libres} Mo.',
      'instantaneas.limite':
        'Cette base a déjà {maximo} instantanés : supprimez-en un pour en prendre un autre.',
      'instantaneas.tomar_fallo':
        'Impossible de prendre l’instantané. La base n’a pas été touchée.',
      'instantaneas.huella_no_coincide':
        'Le fichier de l’instantané a changé ou est abîmé : rien n’a été restauré.',
      'instantaneas.respaldo_previo_fallo':
        'Impossible d’enregistrer l’état actuel de la base : rien n’a été restauré.',
      'instantaneas.restauracion_fallo':
        'Impossible de restaurer l’instantané. La base est revenue à son état d’avant. Motif : {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Impossible de restaurer l’instantané et l’état précédent n’avait pas été enregistré : la base peut être vide ou à moitié restaurée. Motif : {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Impossible de restaurer l’instantané ni de revenir à l’état précédent. Cet état est enregistré dans l’instantané automatique {respaldo} : revenez-y depuis Instantanés.',
    },
  },
  instantaneas: {
    abrir: 'Instantanés',
    titulo: (base: string) => `Instantanés de ${base}`,
    ayuda:
      'Un instantané enregistre la base telle qu’elle est maintenant. Vous pouvez y revenir quand vous voulez : avant de revenir, un instantané de l’état actuel est enregistré automatiquement.',
    ubicacion:
      'Ils sont enregistrés dans le dossier de données de WolfCore Dev, lisibles uniquement par votre utilisateur. Les services et leurs données ne sont pas touchés.',
    notaEtiqueta: 'Note (facultatif)',
    notaMarcador: 'Par exemple : avant la migration',
    tomar: 'Prendre un instantané',
    tomada: 'Instantané enregistré',
    cargando: 'Lecture des instantanés…',
    vacio: 'Cette base n’a pas encore d’instantané.',
    automatica: 'Automatique',
    sinNota: 'Sans note',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'table' : 'tables'} · ${tamano}`,
    volver: 'Revenir à cet instantané',
    borrar: 'Supprimer',
    borrada: 'Instantané déplacé dans la corbeille',
    papelera:
      'Les instantanés supprimés peuvent être récupérés pendant 7 jours dans la corbeille de WolfCore Dev.',
    cerrar: 'Fermer',
    papeleraTitulo: 'Corbeille',
    papeleraVacia: 'Il n’y a aucun instantané dans la corbeille.',
    recuperar: 'Récupérer',
    recuperada: 'Instantané récupéré',
    borradaEl: (fecha: string) => `Supprimé le ${fecha}`,
    borrarPregunta: 'Déplacer cet instantané dans la corbeille ?',
    borrarSi: 'Déplacer dans la corbeille',
    notaAutomatica: (fecha: string) =>
      `État précédent, enregistré avant de revenir à l’instantané du ${fecha}`,
    notaAutomaticaSinOrigen: 'État précédent, enregistré avant de revenir à un autre instantané',
    extensionesAviso: (lista: string) =>
      `Il contient des extensions PostgreSQL (${lista}) qui ne sont restaurées qu’avec le registre d’empreintes de cet ordinateur.`,
    limites:
      'Les instantanés MySQL et MariaDB conservent aussi les routines, les déclencheurs et les événements. Sous PostgreSQL, c’est une sauvegarde compressée d’une seule base : elle n’inclut pas les rôles ni les utilisateurs du serveur. Un instantané dont on ne peut pas vérifier qu’il vient de cet ordinateur est restauré avec un utilisateur limité à la base, qui n’admet pas de vues, de routines ni de déclencheurs d’autres utilisateurs.',
    basesBorradas: 'Instantanés de bases qui n’existent plus',
    basesBorradasAyuda: 'Choisissez une base pour la recréer à partir de son instantané.',
    dialogoVolver: {
      titulo: (base: string) => `Revenir à un instantané de ${base}`,
      cargando: 'Préparation de l’aperçu…',
      base: 'Base',
      instantanea: 'Instantané',
      ahora: 'Maintenant',
      tamano: 'Taille',
      tablas: 'Tables',
      nota: 'Note',
      aviso: (base: string) =>
        `La base ${base} sera entièrement remplacée par cet instantané : ce qui a changé depuis est perdu dans la base. Avant, un instantané automatique de l’état actuel est enregistré ; si quelque chose échoue, la base revient seule à cet état.`,
      pedir: (base: string) => `Pour confirmer, saisissez ${base}`,
      confirmar: 'Revenir à cet instantané',
      trabajando: (base: string) =>
        `Restauration de ${base}… Ne fermez pas le programme avant la fin.`,
      hecho: (base: string) => `La base ${base} est revenue à l’instantané`,
      respaldoPrevio: 'L’état précédent a été enregistré dans l’instantané automatique du',
      advertencias: 'La restauration s’est terminée avec des avertissements :',
      hechoConAvisos: (base: string) =>
        `La base ${base} est revenue à l’instantané, avec des avertissements`,
      baseVacia: 'La base n’existe pas ou est vide : il n’y a rien à enregistrer avant de revenir.',
      sinGuardarTitulo: 'Impossible d’enregistrer l’état actuel',
      sinGuardarTexto:
        'WolfCore Dev n’a pas pu enregistrer l’état actuel de la base avant de revenir. Si vous continuez SANS l’enregistrer et que la restauration échoue, les données actuelles de la base sont perdues.',
      sinGuardarConfirmar: 'Je comprends que les données actuelles de la base seront perdues',
      sinGuardarBoton: 'Revenir sans enregistrer l’état actuel',
    },
  },
  avisoInicio: {
    titulo: 'Avis de WolfCore Dev',
  },
  tareas: {
    titulo: 'Tâches planifiées',
    resumen: (n: number) => (n === 0 ? 'Aucune tâche' : n === 1 ? '1 tâche' : `${n} tâches`),
    mostrar: 'Voir les tâches',
    ocultar: 'Masquer',
    cargando: 'Chargement des tâches',
    errorCargar: 'Impossible de charger les tâches',
    soloAbierta:
      'Les tâches ne s’exécutent que lorsque WolfCore Dev est ouvert. Elles n’utilisent pas le Planificateur de tâches de Windows : application fermée ou ordinateur en veille, elles ne s’exécutent pas, et une exécution manquée n’est pas rattrapée.',
    repoEjecuta:
      'Dans un projet de confiance, ce qui se trouve dans le dépôt s’exécute tel quel : le fichier que nomme la tâche, `artisan`, les scripts de `package.json`, `.venv`… S’ils changent après un `git pull`, la tâche exécutera la nouvelle version.',
    vacio:
      'Ce projet n’a aucune tâche planifiée. Créez-en une (par exemple « php artisan schedule:run » toutes les minutes dans un Laravel).',
    nueva: 'Nouvelle tâche',
    pausada: 'en pause',
    enCurso: 'En cours…',
    nunca: 'Pas encore exécutée',
    ultima: (f: string) => `Dernière : ${f}`,
    proxima: (f: string) => `prochaine : ${f}`,
    codigo: (n: number) => `code ${n}`,
    resultadoTitulo: (n: string) => `« ${n} »`,
    origen: { usuario: 'écrite ici', 'wolfcore.yml': 'de wolfcore.yml' },
    describir: {
      cadaMinuto: 'Toutes les minutes',
      cadaN: (n: number) => `Toutes les ${n} minutes`,
      cadaHora: 'Toutes les heures, pile',
      diaria: (h: string) => `Tous les jours à ${h}`,
      laborables: (h: string) => `Du lundi au vendredi à ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Réussie',
      fallo: 'Échec',
      tiempo: 'Durée maximale dépassée',
      cancelada: 'Annulée',
      omitida: 'Ignorée',
      bloqueada: 'Non exécutée',
    },
    motivo: {
      aislado:
        'C’est un dossier de données de test (WOLFCORE_DATOS) : elle ne s’exécute pas tant que vous n’autorisez pas les tâches pour cette session.',
      no_confiado:
        'Le projet n’est pas marqué comme de confiance : cochez « Je fais confiance à ce dépôt » pour qu’elle s’exécute.',
      receta_cambio:
        'La recette du projet a changé depuis que vous lui avez fait confiance : vérifiez-la et cochez de nouveau « Je fais confiance à ce dépôt ».',
      sin_confirmar:
        'Sa commande doit être confirmée : elle ne s’exécute pas tant que vous ne l’avez pas vérifiée et confirmée.',
      comando_invalido: 'Sa commande n’est pas autorisée (seulement php, node, npm run et python).',
      cron_invalida: 'Son horaire n’est pas une expression cron valide.',
      carpeta: 'Le dossier du projet n’existe pas.',
      solapada: 'La précédente était encore en cours : celle-ci a été ignorée.',
      retraso:
        'Elle est arrivée en retard (l’application était suspendue) : elle n’est pas rattrapée.',
      error: 'Le programme n’a pas pu être lancé.',
    },
    acciones: {
      ejecutar: 'Exécuter maintenant',
      editar: 'Modifier',
      borrar: 'Supprimer',
      verRegistro: 'Voir le journal',
      revisarConfirmar: 'Vérifier et confirmer',
      activar: (n: string) => `Activer la tâche ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Supprimer « ${n} » ?`,
      texto:
        'La tâche et son historique sont supprimés. Ce qu’elle a déjà exécuté n’est pas annulé et les fichiers du projet ne sont pas touchés.',
      confirmar: 'Supprimer',
      hecho: (n: string) => `Tâche « ${n} » supprimée.`,
    },
    aislado: {
      titulo: 'Dossier de données de test.',
      texto:
        'Avec WOLFCORE_DATOS, aucune tâche ne s’exécute seule. Autorisez-les seulement si vous voulez les essayer pendant cette session.',
      permitir: 'Autoriser pour cette session',
      confirmarTitulo: 'Autoriser les tâches dans ce dossier de test ?',
      confirmarTexto:
        'Les tâches actives des projets de confiance commenceront à s’exécuter jusqu’à la fermeture de l’application. Les commandes sont celles de chaque projet et s’exécutent dans son vrai dossier.',
      permitido: 'Tâches autorisées pour cette session.',
    },
    yml: {
      titulo: 'Suggestions de wolfcore.yml',
      texto:
        'Le fichier du projet suggère ces tâches. Rien ne s’exécute parce que c’est écrit là : vérifiez la commande et confirmez-la pour l’adopter.',
      estado: { nueva: 'Nouvelle', adoptada: 'Adoptée', cambiada: 'Modifiée' },
      revisar: 'Vérifier et adopter',
      cambiada:
        'La commande de wolfcore.yml a changé depuis que vous l’avez adoptée. La tâche du projet garde la commande que vous avez confirmée ; adoptez la nouvelle version si vous la reconnaissez.',
      guardarEn: 'Enregistrer dans wolfcore.yml',
      escribirTitulo: 'Écrire la tâche dans wolfcore.yml ?',
      escribirTexto:
        'La tâche est ajoutée ou mise à jour dans le fichier du projet (le reste n’est pas touché) pour voyager avec le dépôt. Quiconque le clone devra la confirmer sur son ordinateur.',
      escribir: 'Écrire',
      escrita: 'Tâche enregistrée dans wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Journal de « ${n} »`,
      historial: 'Dernières exécutions',
      sinHistorial: 'Aucune exécution pour le moment.',
      salida: 'Sortie de la dernière exécution',
      sinSalida: 'Aucune sortie enregistrée.',
      enmascarado:
        'Les journaux masquent les mots de passe et les clés, ont une taille maximale et tournent tout seuls.',
      origen: { programada: 'planifiée', manual: 'manuelle' },
    },
    dialogo: {
      tituloNueva: 'Nouvelle tâche planifiée',
      tituloEditar: 'Modifier la tâche planifiée',
      tituloAdoptar: 'Adopter la tâche de wolfcore.yml',
      tituloConfirmar: 'Confirmer la commande de la tâche',
      nombre: 'Nom',
      nombrePlaceholder: 'Tâches Laravel',
      horario: 'Quand',
      preset: {
        cadaMinuto: 'Toutes les minutes',
        cadaN: 'Toutes les quelques minutes',
        cadaHora: 'Toutes les heures',
        diaria: 'Tous les jours à une heure',
        laborables: 'Du lundi au vendredi à une heure',
        personalizada: 'Expression cron personnalisée',
      },
      cadaNOpcion: (n: number) => `Toutes les ${n} minutes`,
      hora: 'Heure',
      horaPlaceholder: '03:00',
      horaInvalida: 'Saisissez une heure valide, par exemple 03:00.',
      expresion: 'Expression cron',
      cronEquivale: 'Expression cron :',
      expresionAyuda:
        '5 champs : minute, heure, jour du mois, mois et jour de la semaine (* , - /). Au plus une fois par minute.',
      proximas: 'Prochaines exécutions :',
      comando: 'Commande',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Seulement php, node, npm run et python, avec un fichier du projet. Elle s’exécute dans le dossier du projet, sans shell et sans code sur la ligne de commande (-r, -e, -c).',
      comandoFijo:
        'Cette commande contient des arguments avec des guillemets qui ne peuvent pas s’écrire comme texte : elle est conservée telle quelle et n’est pas modifiable ici (supprimez-la et créez-en une autre si besoin).',
      argumentos: 'Elle s’exécutera avec ces arguments :',
      comillasSinCerrar: 'Un guillemet n’est pas fermé.',
      tiempo: 'Durée maximale',
      minutos: 'minutes',
      tiempoAyuda:
        'Si elle dure plus longtemps, elle s’arrête toute seule (seulement ce processus et ce qu’il a lancé).',
      activa: 'Active (s’exécute toute seule tant que l’application est ouverte)',
      advertencia:
        'En acceptant, vous autorisez cette commande exacte : elle s’exécutera toute seule, dans le dossier de ce projet, à chaque échéance. Si vous la modifiez, vous devrez la confirmer de nouveau.',
      revise: 'J’ai vérifié cette commande et je la reconnais.',
      guardar: 'Enregistrer et confirmer la commande',
      adoptar: 'Confirmer et adopter',
      confirmar: 'Confirmer la commande',
      guardada: 'Tâche enregistrée.',
      adoptada: 'Tâche adoptée.',
      confirmada: 'Commande confirmée.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Ensembles nommés de bases de données, de services et de processus qui démarrent et s’arrêtent ensemble.',
    nuevo: 'Nouveau workspace',
    vacio:
      'Aucun workspace pour le moment. Créez-en un, par exemple « Bot FastAPI » avec PostgreSQL, Redis, Ollama et le processus de votre projet.',
    elementos: (n: number) => (n === 1 ? '1 élément' : `${n} éléments`),
    sinElementos: 'Aucun élément',
    estado: { apagado: 'Arrêté', parcial: 'En partie', encendido: 'Démarré' },
    acciones: {
      iniciar: 'Démarrer',
      detener: 'Arrêter',
      editar: 'Modifier',
      borrar: 'Supprimer',
      cerrar: 'Fermer',
    },
    borrar: {
      titulo: (n: string) => `Supprimer « ${n} » ?`,
      texto:
        'Supprimer le workspace n’arrête ni ne supprime rien : cela retire seulement l’ensemble. Ce qui tourne continue de tourner.',
      confirmar: 'Supprimer',
      hecho: (n: string) => `Workspace « ${n} » supprimé.`,
    },
    dialogo: {
      tituloNuevo: 'Nouveau workspace',
      tituloEditar: 'Modifier le workspace',
      nombre: 'Nom',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Saisissez un nom.',
      aviso:
        'Un workspace ne garde que ce qu’il faut démarrer. Il n’ouvre pas de tunnels, ne partage pas sur le réseau local et ne démarre pas les processus d’un projet auquel vous ne faites pas confiance.',
      secciones: {
        instancias: 'Bases de données',
        servicios: 'Services',
        procesos: 'Processus des projets',
      },
      sinOpciones: 'Il n’y a rien à choisir ici.',
      captadorUnico:
        'Un seul capteur de courrier à la fois : en choisir un autre remplace le précédent.',
      yaNoExisten: (lista: string) =>
        `N’existent plus et seront retirés à l’enregistrement : ${lista}`,
      guardar: 'Enregistrer',
      guardado: (n: string) => `Workspace « ${n} » enregistré.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `« ${n} » : état après le démarrage`,
      tituloDetener: (n: string) => `« ${n} » : état après l’arrêt`,
      encendido: 'Démarré',
      apagado: 'Arrêté',
      yaEncendido: 'Déjà démarré',
      yaApagado: 'Déjà arrêté',
      noExiste: 'N’existe plus : ignoré',
      compartido: 'Toujours démarré : un autre workspace démarré l’utilise',
      reemplaza: (otro: string) => `Démarré ; a arrêté ${otro}, du même groupe de courrier`,
      fallo: 'N’a pas démarré',
      falloApagar: 'Toujours démarré',
      ok: (n: string) => `« ${n} » est prêt.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `« ${n} » : ${encendidos} sur ${total} sont démarrés. Vérifiez ce qui n’a pas démarré.`,
      parcialApagar: (n: string, siguen: number) =>
        `« ${n} » : ${siguen} tournent encore. Vérifiez ce qui ne s’est pas arrêté.`,
    },
  },
  inicio: {
    titulo: 'Accueil',
    bienvenida: 'Votre environnement de développement, en un coup d’œil.',
    tiles: {
      servicios: 'Services actifs',
      serviciosDe: (total: number) => `sur ${total}`,
      sitios: 'Projets',
      tuneles: 'Tunnels actifs',
      hosts: 'Hosts en attente',
      hostsOk: 'Tout est en ordre',
      hostsFaltan: 'Nécessite votre attention',
    },
    hosts: {
      titulo: 'Des domaines ne sont pas enregistrés dans le fichier hosts',
      texto:
        'Ces domaines ne pointent pas encore vers votre ordinateur. Pour corriger cela, Windows demandera l’autorisation administrateur.',
      corregir: 'Appliquer les hosts en attente',
      reintentarPermiso: 'Réessayer avec l’autorisation',
      corregido: 'Fichier hosts mis à jour',
      fallo: 'Impossible de mettre à jour le fichier hosts',
      verInstrucciones: 'Voir les instructions',
      duplicados:
        'Ces domaines figurent déjà dans hosts hors du bloc de WolfCore Dev (ils sont conservés) :',
      motivos: {
        cancelado:
          'L’autorisation administrateur a été annulée. Le fichier hosts est resté tel quel.',
        tiempo:
          'Personne n’a répondu à temps à la demande d’autorisation administrateur. Le site a été enregistré ; le fichier hosts est resté tel quel. Si l’alerte Windows s’affiche encore, annulez-la (elle ne fera plus rien). Appliquez les hosts en attente dès que possible (une seule autorisation pour tous).',
        denegado:
          'Windows n’a pas autorisé l’écriture du fichier hosts. Un antivirus le bloque peut-être.',
      } as Record<string, string>,
      modalTitulo: 'Corriger hosts manuellement',
      modalTexto:
        'Ouvrez PowerShell en tant qu’administrateur (clic droit sur Démarrer → Terminal (administrateur)), collez cette commande et appuyez sur Entrée.',
    },
    servicios: {
      titulo: 'Services',
      ver: 'Voir les services',
      irA: (nombre: string) => `Aller au service ${nombre}`,
      vacio: 'Aucun service n’est encore installé.',
    },
    tuneles: {
      titulo: 'Tunnels actifs',
      vacio: 'Aucun tunnel ouvert. Vous pouvez en ouvrir un depuis Projets.',
      sitioDesconocido: 'Site sans nom',
      irA: (nombre: string) => `Aller au projet ${nombre}`,
    },
  },
  servicios: {
    titulo: 'Services',
    descripcion:
      'Allumez et éteignez le serveur web, PHP, les bases de données et les outils. L’état se met à jour tout seul.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Bases de données',
      correo: 'Courrier',
      ia: 'IA',
      herramientas: 'Outils',
    },
    gruposAyuda: {
      web: 'Serveur qui sert les domaines .test.',
      php: 'Une installation par version (8.3, 8.4…) ; chaque site utilise la sienne.',
      bd: 'Elles n’écoutent que sur 127.0.0.1.',
      correo: 'Capture les courriers envoyés par vos projets, sans qu’ils sortent sur Internet.',
      ia: 'Modèles de langage sur votre ordinateur.',
      herramientas: 'Utilitaires du quotidien.',
    },
    puerto: 'Port',
    cambiarPuerto: 'Changer le port',
    cambiarPuertoDe: (nombre: string) => `Changer le port de ${nombre}`,
    versionesDe: (nombre: string) => `Versions de ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instances, ${encendidas} allumées`,
    usarPuerto: (p: number) => `Utiliser le port ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} utilise désormais le port ${p}`,
    conflicto: 'Port occupé',
    autoIniciar: 'Allumer au démarrage de WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} s’allumera au démarrage de WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} ne s’allumera plus au démarrage de WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Port de ${nombre}`,
      etiqueta: 'Nouveau port',
      ayuda:
        'Entre 1024 et 65535, et libre. Si le service est allumé, il redémarre. Mettez à jour le .env de vos projets.',
      rango: 'Utilisez un nombre entre 1024 et 65535',
      igual: 'C’est le port actuel',
      guardar: 'Changer le port',
    },
    borrarDatos: {
      opcion: 'Supprimer les données',
      titulo: (nombre: string) => `Supprimer les données de ${nombre}`,
      copias: (n: number, tam: string) =>
        `${n === 1 ? 'Une copie' : `${n} copies`} des mises à jour (${tam}) ${n === 1 ? 'sera aussi supprimée' : 'seront aussi supprimées'}. Si vous voulez les conserver, copiez-les d’abord depuis le dossier de données.`,
      /** Ce qui est perdu, selon le service. */
      que: {
        mysql: 'toutes les bases et tous les utilisateurs de MySQL',
        mariadb: 'toutes les bases et tous les utilisateurs de MariaDB',
        postgresql: 'toutes les bases et tous les utilisateurs de PostgreSQL',
        redis: 'toutes les clés et données enregistrées dans Redis',
        mongodb: 'toutes les bases, collections et données de MongoDB',
        mailpit: 'tous les courriers capturés par Mailpit',
        smtp4dev: 'tous les courriers capturés par smtp4dev',
        inbucket: 'tous les courriers capturés par Inbucket',
        papercut: 'tous les courriers capturés par Papercut SMTP',
        ollama: 'tous les modèles téléchargés d’Ollama',
        meilisearch: 'tous les index de Meilisearch',
      } as Record<string, string>,
      texto: (que: string) =>
        `Seront supprimés : ${que}. Cette action est irréversible. Le programme reste installé.`,
      generico: (nombre: string) => `toutes les données de ${nombre}`,
      pedir: (id: string) => `Pour confirmer, tapez ${id}`,
      boton: 'Supprimer les données',
      hecho: (nombre: string) => `Données de ${nombre} supprimées`,
    },
    ftp: {
      interruptor: 'Serveur FTP',
      redLocal: 'Autoriser les connexions du réseau local',
      redLocalAyuda:
        'Désactivé, seul cet ordinateur peut se connecter (127.0.0.1). Chaque site active son propre accès dans Sites.',
      avisoTitulo: 'Ouvrir le FTP au réseau local',
      avisoTexto:
        'Le FTP envoie utilisateurs, mots de passe et fichiers sans chiffrement. N’importe quel ordinateur de votre réseau pourra tenter de se connecter. Ne l’utilisez que sur un réseau de confiance.',
      avisoConfirmar: 'Autoriser',
      redLocalActivada: 'Le FTP accepte les connexions du réseau local',
      redLocalDesactivada: 'Le FTP n’accepte que les connexions de cet ordinateur',
      compartir: {
        enlace: 'Partager un dossier ou un fichier…',
        ayuda:
          'Le FTP ne se partage pas par tunnel : il circule sans chiffrement et le tunnel ne laisse passer que le HTTP. Pour publier quelque chose sur internet, utilisez « Partager un dossier ou un fichier » (HTTP, en lecture seule) ; le FTP reste réservé au réseau local.',
      },
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Gestionnaire de dépendances PHP',
      instalado: 'Installé',
      noInstalado: 'Non installé',
      sinVersion: 'non installé',
      uso: 'Utilisation',
      usoTexto: 'composer',
      ayuda: 'Utilisez « Terminal » dans un projet, ou ajoutez WolfCore Dev au PATH dans Réglages.',
      instaladoOk: 'Composer installé',
      sinPhp: 'Installez d’abord PHP',
      actualizado: (v: string) => `Composer mis à jour : ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Administrateur web de bases de données',
      direccion: 'Adresse',
      disponible: 'Prêt',
      noInstalado: 'Non installé',
      sinPhp: 'PHP manquant',
      abrir: 'Ouvrir Adminer',
      instaladoOk: 'Adminer installé',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Administrateur web de MySQL et MariaDB',
      direccion: 'Adresse',
      disponible: 'Prêt',
      noInstalado: 'Non installé',
      sinPhp: 'PHP manquant',
      abrirDesdeProyecto: 'S’ouvre depuis la carte de chaque projet, déjà connecté.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} n’a pas l’extension ${ext} activée. Redémarrez PHP ou activez-la dans son php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin déclare une prise en charge jusqu’à PHP 8.3 et PHP ${rama} est utilisé : des erreurs peuvent apparaître. Allumez une version de PHP de 7.2 à 8.3 si quelque chose échoue.`,
      instalarPrimero: 'Installez phpMyAdmin pour l’utiliser.',
      encenderPhp: 'Allumez PHP pour utiliser phpMyAdmin.',
      instaladoOk: 'phpMyAdmin installé',
    },
    puertos: 'Ports',
    pid: 'PID',
    sinVersion: 'sans version',
    datosConexion: 'Données de connexion',
    sinPuertos: '—',
    terminado: 'Terminé sans erreur',
    externo: 'Géré hors de WolfCore Dev',
    verDetalle: 'Voir le détail de l’erreur',
    vacioTitulo: 'Aucun service pour l’instant',
    vacio:
      'Aucun service n’est encore installé. Commencez par Nginx et PHP pour vos sites, ou par une base de données.',
    irAInstalar: 'Aller à l’installation',
  },
  bd: {
    descripcion:
      'Créez, sauvegardez et restaurez les bases de vos projets. Les serveurs n’écoutent que sur 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Nouvelle base',
    restaurar: 'Restaurer une sauvegarde',
    importar: 'Importer depuis un autre serveur',
    soloSql: 'Disponible pour MySQL, MariaDB et PostgreSQL',
    enCursoAyuda: 'Attendez la fin de l’opération en cours',
    encenderPrimero: (motor: string) => `Allumez d’abord ${motor}`,
    cargando: 'Chargement des bases…',
    recargar: 'Recharger la liste',
    vacioTitulo: 'Aucun serveur de base de données n’est installé',
    vacio: 'Installez MySQL, MariaDB, PostgreSQL ou MongoDB depuis Services pour gérer vos bases.',
    irAServicios: 'Aller à Services',
    apagado: {
      titulo: (motor: string) => `${motor} est éteint`,
      texto: (motor: string) => `Allumez ${motor} pour voir et gérer ses bases.`,
      iniciando: (motor: string) => `${motor} est en cours de démarrage…`,
      error: (motor: string) => `${motor} n’a pas pu s’allumer`,
      encender: (motor: string) => `Allumer ${motor}`,
      verServicios: 'Voir dans Services',
    },
    errorLista: 'Impossible de lire la liste des bases',
    sinBases: 'Ce serveur n’a pas encore de bases propres.',
    total: (n: number) => plural(n, 'base', 'bases'),
    columnas: { nombre: 'Base', tamano: 'Taille', acciones: 'Actions' },
    acciones: {
      respaldar: 'Sauvegarder',
      restaurarAqui: 'Restaurer ici',
      adminer: 'Ouvrir dans Adminer',
      conexion: 'Données de connexion',
      vector: 'Activer vector',
      borrar: 'Supprimer',
      de: (accion: string, base: string) => `${accion} : ${base}`,
    },
    adminerNoDisponible: 'Installez Adminer et PHP dans Services pour l’ouvrir',
    vectorSinInstalar: 'Installez pgvector plus bas pour l’activer sur une base',
    vectorActivado: (base: string) => `Vector activé sur ${base}`,
    formatos: {
      sql: 'SQL brut',
      pgdump: 'Sauvegarde PostgreSQL (pg_dump, format personnalisé)',
      gz: 'SQL compressé (.gz)',
      zip: 'Archive .zip (décompressée avant la restauration)',
      rar: 'Archive .rar (on tente de la décompresser avec Windows)',
      '7z': 'Archive .7z (on tente de la décompresser avec Windows)',
      desconocido: 'Format non reconnu',
    } as Record<string, string>,
    formatoDesconocido:
      'Le format n’est pas reconnu. S’il s’agit d’une archive, décompressez-la et choisissez le .sql ou .dump qu’elle contient.',
    formatoIncompatible:
      'Ce fichier est une sauvegarde PostgreSQL : restaurez-la dans l’onglet PostgreSQL.',
    nombre: {
      etiqueta: 'Nom de la base',
      vacio: 'Saisissez un nom',
      largo: 'Le nom est trop long',
      caracteres: {
        mysql: 'Utilisez uniquement des lettres, des chiffres et le tiret bas',
        mariadb: 'Utilisez uniquement des lettres, des chiffres et le tiret bas',
        postgresql: 'Utilisez des minuscules, des chiffres et le tiret bas',
        mongodb: 'Utilisez uniquement des lettres, des chiffres, le tiret et le tiret bas',
      } as Record<string, string>,
      inicio: 'Dans PostgreSQL, le nom ne peut pas commencer par un chiffre',
    },
    reemplazo: {
      titulo: (base: string) => `La base ${base} contient déjà des tables`,
      texto: (base: string) =>
        `Si vous continuez, la base ${base} actuelle sera entièrement REMPLACÉE. Une sauvegarde automatique est d’abord enregistrée ; ensuite la base est supprimée puis recréée avec le nouveau contenu.`,
      donde: 'La sauvegarde est enregistrée dans',
      carpetaPorDefecto: 'Documents\\WolfCore Dev\\Respaldos',
      otraBase:
        'Si vous ne voulez pas la remplacer, revenez en arrière et choisissez un autre nom : une nouvelle base sera créée.',
      pedir: (base: string) => `Pour confirmer, tapez ${base}`,
      volver: 'Retour',
      confirmar: 'Remplacer la base',
    },
    resultado: {
      restaurada: (base: string) => `Base ${base} restaurée`,
      importada: (base: string) => `Base ${base} importée`,
      respaldada: (base: string) => `Sauvegarde de ${base} enregistrée`,
      archivo: 'Fichier',
      respaldoPrevio: 'Sauvegarde de la base précédente',
      advertencias: (n: number) => plural(n, 'avertissement', 'avertissements'),
      advertenciasAyuda:
        'L’opération est terminée. Consultez ces avertissements ; ce sont généralement des rôles ou des permissions qui n’existent pas sur cet ordinateur.',
      fallo: {
        restaurar: 'Impossible de restaurer',
        importar: 'Impossible d’importer',
        respaldar: 'Impossible de sauvegarder',
      } as Record<string, string>,
      trasReemplazo: 'La base d’origine a été remplacée et la restauration ne s’est pas terminée',
      trasReemplazoAyuda:
        'Vos données précédentes se trouvent dans la sauvegarde indiquée. Vous pouvez la restaurer avec « Restaurer une sauvegarde ».',
    },
    progreso: {
      titulo: 'Journal',
      corriendo: {
        restaurar: (base: string) => `Restauration de ${base}…`,
        importar: (base: string) => `Importation de ${base}…`,
        respaldar: (base: string) => `Sauvegarde de ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'En attente de la sortie de l’outil…',
      limitado: (n: number) => `Les ${n} dernières lignes sont affichées.`,
      noCierre:
        'Ne fermez pas le programme avant la fin. Vous pouvez quitter cet écran et y revenir : le résultat s’affichera ici.',
      otraEnCurso: 'Une opération est déjà en cours ; attendez qu’elle se termine.',
      ver: 'Voir le détail',
      descartar: 'Ignorer',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Restaurer une sauvegarde dans ${motor}`,
      confianza:
        'Ne restaurez que des sauvegardes de confiance : une sauvegarde peut exécuter des actions sur le serveur.',
      archivo: 'Fichier de sauvegarde',
      elegir: 'Choisir un fichier…',
      cambiar: 'Changer',
      sinArchivo: 'Aucun fichier choisi',
      formato: 'Format détecté',
      detectando: 'Détection du format…',
      destino: 'Base de destination',
      destinoAyuda:
        'Si elle n’existe pas, elle est créée. Si elle existe et est vide, elle est utilisée. Si elle contient des tables, une confirmation vous sera demandée.',
      restaurar: 'Restaurer',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Importer dans ${motor} depuis un autre serveur`,
      soloLectura:
        'Seul le serveur d’origine est lu : sa base est copiée sur cet ordinateur et l’origine n’est pas modifiée.',
      detectado: (puerto: number) =>
        `Un autre serveur a été détecté sur le port ${puerto} (par exemple celui de FlyEnv).`,
      origen: 'Serveur d’origine',
      host: 'Serveur',
      puerto: 'Port',
      usuario: 'Utilisateur',
      clave: 'Mot de passe',
      claveAyuda: 'Utilisé uniquement pour cette copie ; il n’est pas enregistré.',
      baseOrigen: 'Base d’origine',
      destino: 'Base de destination sur cet ordinateur',
      destinoAyuda:
        'Si elle n’existe pas, elle est créée. Si elle contient des tables, une confirmation vous sera demandée avant de la remplacer.',
      faltaHost: 'Saisissez le serveur',
      faltaPuerto: 'Utilisez un port entre 1 et 65535',
      faltaUsuario: 'Saisissez l’utilisateur',
      faltaBase: 'Saisissez la base d’origine',
      importar: 'Importer',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Nouvelle base dans ${motor}`,
      codificacion: 'Encodage',
      codificacionValor: {
        mysql: 'utf8mb4 (prend en charge les émojis et tous les accents)',
        mariadb: 'utf8mb4 (prend en charge les émojis et tous les accents)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Créer un utilisateur propre à cette base',
      usuarioPropioAyuda:
        'Facultatif. Sinon, vos projets utilisent l’utilisateur administrateur du serveur.',
      usuario: 'Utilisateur',
      clave: 'Mot de passe',
      faltaClave: 'Saisissez un mot de passe',
      crear: 'Créer la base',
      creada: (base: string) => `Base ${base} créée`,
      mongo: 'Dans MongoDB, la base est créée avec une collection initiale (_pel_init).',
      cambiarClave: 'Changer le mot de passe',
      cambiarClaveTitulo: (u: string) =>
        `L’utilisateur ${u} existe déjà avec un autre mot de passe`,
      cambiarClaveTexto: (u: string) =>
        `Si vous changez le mot de passe de ${u}, les projets qui l’utilisent déjà ne pourront plus se connecter tant que vous n’aurez pas mis à jour leur .env. Le plus simple est d’utiliser le mot de passe actuel. Le changer quand même ?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Supprimer la base ${base} ?`,
      texto: (base: string, motor: string) =>
        `La base ${base} de ${motor} et toutes ses données seront supprimées. Cette action est irréversible. Si vous en avez besoin, sauvegardez-la d’abord.`,
      pedir: (base: string) => `Pour confirmer, tapez ${base}`,
      boton: 'Supprimer la base',
      hecho: (base: string) => `Base ${base} supprimée`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Sauvegarder ${base}`,
      destino: 'Elle sera enregistrée dans',
      porDefecto: 'Documents\\WolfCore Dev\\Respaldos (dossier par défaut)',
      porDefectoEn: (carpeta: string) => `${carpeta} (dossier par défaut)`,
      cambiar: 'Choisir un autre dossier…',
      porDefectoVolver: 'Utiliser le dossier par défaut',
      formato: {
        mysql: 'Fichier .sql (mysqldump avec routines et déclencheurs)',
        mariadb: 'Fichier .sql (mysqldump avec routines et déclencheurs)',
        postgresql: 'Fichier .dump (pg_dump, format personnalisé)',
      } as Record<string, string>,
      boton: 'Sauvegarder',
    },
    dialogoConexion: {
      tituloServicio: 'Connexion à Meilisearch',
      notaMeilisearch:
        'Pour l’utiliser dans un projet : Variables (.env) → Ajouter un bloc → Meilisearch. Un aperçu avec la clé masquée s’affiche et une confirmation est demandée. La clé appartient uniquement à cet ordinateur.',
      sitio: 'Projet',
      sitioAyuda:
        'Le .env du site est lu pour reprendre les variables qu’il contient déjà (par exemple CodeIgniter 4). Son contenu n’est ni affiché ni copié.',
      generico: 'Générique (format Laravel)',
      titulo: (base: string) => `Connexion à ${base}`,
      host: 'Serveur',
      puerto: 'Port',
      usuario: 'Utilisateur',
      clave: 'Mot de passe',
      base: 'Base',
      sinClave: 'Sans mot de passe (écoute uniquement sur 127.0.0.1)',
      mostrar: 'Afficher le mot de passe',
      ocultar: 'Masquer le mot de passe',
      copiarDato: (dato: string) => `Copier ${dato}`,
      env: 'Bloc pour le fichier .env',
      envAyuda:
        'Collez-le dans le .env de votre projet. WolfCore Dev n’écrit pas dans vos projets.',
      copiarEnv: 'Copier le bloc',
      cargando: 'Lecture des données de connexion…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Une installation de pgvector est déjà en cours.',
      descripcion:
        'Recherche par similarité (embeddings) dans PostgreSQL. Il est compilé à partir du code officiel.',
      instalado: (v: string | null) => (v ? `Installé (version ${v})` : 'Installé'),
      noInstalado: 'Non installé',
      herramientas: 'Outils de compilation',
      herramientasSi: 'Prêts',
      herramientasNo: 'Manquants',
      instalar: 'Installer pgvector',
      reinstalar: 'Recompiler',
      instalarHerramientas: 'Installer les outils de compilation',
      dialogoHerramientasTitulo: 'Installer les outils de compilation',
      dialogoHerramientas:
        'Pour compiler pgvector, les Build Tools de Visual Studio sont nécessaires. Environ 6 Go seront téléchargés et Windows demandera l’autorisation administrateur. Cela peut être long ; laissez WolfCore Dev ouvert.',
      dialogoCompilarTitulo: 'Compiler et installer pgvector',
      dialogoCompilar:
        'Le code officiel de pgvector est téléchargé, compilé et installé dans votre PostgreSQL. PostgreSQL s’arrête quelques secondes pendant la copie de l’extension, puis se rallume.',
      continuar: 'Continuer',
      instalando: 'Installation des outils de compilation…',
      compilando: 'Compilation de pgvector…',
      herramientasOk: 'Outils de compilation installés',
      instaladoOk: (v: string) => `pgvector ${v} installé`,
      sinWinget:
        'Cet ordinateur n’a pas winget. Installez « Build Tools pour Visual Studio 2022 » depuis visualstudio.microsoft.com avec la charge de travail « Développement Desktop en C++ », puis réessayez.',
      falloHerramientas: 'Impossible d’installer les outils de compilation',
      activarAyuda: 'Ensuite, utilisez « Activer vector » sur chaque base qui en a besoin.',
      errorEstado: 'Impossible de lire l’état de pgvector',
    },
  },
  instalar: {
    titulo: 'Installer',
    descripcion:
      'Téléchargez les versions officielles. Chaque fichier est vérifié avec son empreinte SHA-256 avant d’être utilisé.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Serveur web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Tunnels publics (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Base de données, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Base de données, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Base de données (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Cache et files d’attente en mémoire (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Base de données de documents (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Console MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Courrier de test (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Courrier de test (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Courrier de test (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Courrier de test (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'IA locale (ollama.com)' },
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Recherche pour Laravel Scout (github.com/meilisearch)',
      },
      composer: { nombre: 'Composer', detalle: 'Dépendances PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Administrateur web de bases de données' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Administrateur web de MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web et PHP',
      bd: 'Bases de données',
      otros: 'Courrier, IA et tunnels',
    },
    instalados: 'Installé',
    ninguno: 'Aucune version installée',
    elegir: 'Choisissez une version',
    buscando: 'Recherche des versions…',
    sinVersiones: 'Aucune version trouvée',
    rama: (rama: string) => rama,
    yaInstalada: 'déjà installée',
    fases: {
      descargando: 'Téléchargement',
      verificando: 'Vérification SHA-256',
      extrayendo: 'Extraction',
      compilando: 'Compilation',
      listo: 'Installé',
      error: 'L’installation a échoué',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} installé`,
  },
  sitios: {
    titulo: 'Sites',
    descripcion: 'Chaque site est un dossier servi par Nginx sur son propre domaine .test.',
    nuevo: 'Nouveau site',
    buscar: 'Rechercher par nom ou domaine',
    sinResultados: (q: string) => `Aucun site ne correspond à « ${q} ».`,
    vacioTitulo: 'Aucun site pour l’instant',
    vacio:
      'Choisissez le dossier d’un projet et WolfCore Dev détecte s’il s’agit de Laravel, de CodeIgniter ou d’un site statique.',
    agregar: 'Ajouter un site',
    total: (n: number) => plural(n, 'site', 'sites'),
    abrirSitio: (dominio: string) => `Ouvrir ${dominio} dans le navigateur`,
    carpeta: 'Dossier',
    abrirCarpeta: 'Ouvrir le dossier du projet',
    alias: (n: number) => `+${plural(n, 'alias', 'alias')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statique',
      proxy: 'Proxy (port local)',
      personalizado: 'Personnalisé',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (port local)',
      node: 'Node / Vite (port local)',
      rails: 'Rails (port local)',
      springboot: 'Spring Boot (port local)',
      aspnet: 'ASP.NET Core (port local)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statique',
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
    datosReales: 'Données réelles',
    datosRealesAyuda:
      'Contient des données réelles de clients : soyez prudent avant de le publier.',
    faltaHosts: 'Absent de hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} ne pointe pas encore vers cet ordinateur. Corrigez le fichier hosts avec l’avis ci-dessus.`,
    estado: {
      enLinea: 'En ligne',
      faltaHosts: 'Absent de hosts',
      iniciando: 'Nginx démarre…',
      errorNginx: 'Erreur Nginx',
      nginxExterno: 'Nginx externe',
      nginxApagado: 'Nginx éteint',
    },
    borrar: {
      titulo: (nombre: string) => `Supprimer le site ${nombre} ?`,
      texto: 'Le dossier du projet n’est pas touché.',
      hecho: (nombre: string) => `Site ${nombre} supprimé`,
      nginxFallo: 'Le site a été supprimé, mais Nginx n’a pas accepté la nouvelle configuration',
    },
  },
  formSitio: {
    tituloNuevo: 'Nouveau site',
    tituloEditar: 'Modifier le site',
    tituloDuplicar: 'Dupliquer le site',
    paso: 'Commencez par le dossier du projet',
    pasoAyuda:
      'Le type de projet, la version de PHP et un domaine suggéré sont détectés. Vous pourrez ensuite tout modifier.',
    elegirCarpeta: 'Choisir un dossier',
    cambiarCarpeta: 'Changer',
    detectando: 'Analyse du projet…',
    detectado: (tipo: string) => `Détecté : ${tipo}`,
    sinDeteccionAlEditar:
      'La détection automatique ne s’applique qu’à la création ; vérifiez le type et PHP.',
    nombre: 'Nom',
    nombreAyuda: 'Uniquement pour le reconnaître dans la liste.',
    nombreCopia: (nombre: string) => `${nombre} (copie)`,
    duplicarProxy:
      'La copie pointe vers le même port local que l’original et ne copie pas ses processus : changez le port ou ajoutez un processus propre.',
    dominio: 'Domaine',
    dominioPlaceholder: 'mon-projet',
    alias: 'Alias',
    aliasAyuda:
      'D’autres domaines .test qui ouvrent le même site. Saisissez puis appuyez sur Entrée.',
    aliasAgregar: 'Ajouter un alias',
    carpeta: 'Dossier du projet',
    raizLaravel: 'Nginx servira le sous-dossier public/.',
    tipo: 'Type de projet',
    php: 'Version de PHP',
    phpElegir: 'Choisissez une version',
    phpNinguno: 'Aucune version de PHP n’est installée.',
    phpInstalar: 'Installer PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Le projet demande PHP ${pedida}, qui n’est pas installé. PHP ${elegida} a été choisi.`,
    puertoProxy: 'Port local',
    puertoProxyAyuda:
      'Nginx transmettra les requêtes à http://127.0.0.1:<port> (par exemple Vite ou Node).',
    urlBaseVar: 'Variable d’URL de base',
    urlBaseVarAyuda:
      'À l’ouverture d’un tunnel, le lien public est écrit dans cette variable du .env, puis restauré à la fermeture.',
    urlBaseVarNinguna: 'Aucune (ne pas toucher au .env)',
    datosReales: 'Contient des données réelles de clients',
    datosRealesAyuda:
      'Il est signalé dans la liste et une confirmation est demandée avant de le publier avec un tunnel.',
    avanzado: 'Avancé',
    reglasExtra: 'Règles Nginx supplémentaires',
    reglasExtraAyuda:
      'Elles sont insérées dans le bloc server (en-têtes de sécurité, deny personnalisés…). Elles sont validées avec nginx -t à l’enregistrement.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Note',
    notaPlaceholder: 'Quelque chose à retenir sur ce site',
    guardar: 'Enregistrer le site',
    guardado: (nombre: string) => `Site ${nombre} enregistré`,
    errorGuardar: 'Impossible d’enregistrer le site',
    nginxFallo: 'Le site a été enregistré, mais Nginx a rejeté la configuration',
    nginxFalloAyuda:
      'La configuration précédente de Nginx a été restaurée. Vérifiez les règles supplémentaires et enregistrez de nouveau.',
    errores: {
      carpeta: 'Choisissez le dossier du projet',
      sufijo: 'Le domaine doit se terminer par .test',
      caracteres: 'Utilisez uniquement des lettres, des chiffres, des tirets et des points',
      aliasIgualDominio: (d: string) => `L’alias ${d} est identique au domaine du site`,
      aliasRepetido: (d: string) => `L’alias ${d} est en double`,
      ocupado: (d: string) => `Un site avec le domaine ${d} existe déjà`,
      puertoFalta: 'Un site proxy a besoin d’un port',
      puertoRango: 'Le port doit être compris entre 1 et 65535',
      php: 'Sélectionnez une version de PHP pour ce site',
      urlBaseVar: 'Utilisez des lettres, des chiffres et le tiret bas (par exemple APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Tunnel public pour ${dominio}`,
    etiqueta: 'Tunnel',
    apagadoAyuda: 'Partagez ce site avec un lien public temporaire.',
    abriendo: 'Ouverture du tunnel…',
    cerrando: 'Fermeture du tunnel…',
    error: 'Le tunnel a échoué',
    sinNginx: 'Allumez d’abord Nginx',
    sinCloudflared: 'Installez cloudflared dans Services',
    sinConfianza:
      'Ce projet n’est pas de confiance : cochez « Je fais confiance à ce dépôt » pour pouvoir le publier.',
    abrirUrl: 'Ouvrir le lien public',
    copiarUrl: 'Copier le lien public',
    verQr: 'Afficher le code QR du lien',
    qrTitulo: 'Lien public de ce site',
    renovar: 'Renouveler (nouveau lien)',
    cerrar: 'Fermer le tunnel',
    confirmarTitulo: 'Publier un site contenant des données réelles',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} contient de vraies données clients et serait publié sur Internet avec ${destino} : toute personne ayant le lien pourra le voir tant qu’il reste ouvert. Publier ?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} sera publié sur Internet avec Expose : toute personne ayant le lien pourra entrer tant qu’il reste ouvert. De plus, l’inspecteur de requêtes d’Expose est visible par tous les appareils de votre réseau local. Publier ?`,
    compartir: 'Partager',
    confirmar: 'Publier',
    confirmarPublicoTitulo: 'Publier le site sur Internet',
    confirmarPublicoTexto: (dominio: string) =>
      `Un tunnel public Cloudflare sera ouvert pour ${dominio} : toute personne disposant du lien pourra entrer tant qu’il reste ouvert. Publier ?`,
    opciones: 'Options du tunnel',
    opcionesDe: (dominio: string) => `Options du tunnel de ${dominio}`,
    proveedor: 'Fournisseur',
    proveedorRapido: 'Rapide (sans compte)',
    proveedorRapidoAyuda: 'Un lien trycloudflare.com qui change à chaque ouverture.',
    proveedorNombre: 'Nommé (votre domaine)',
    proveedorNombreAyuda:
      'Un lien fixe sur un de vos domaines Cloudflare. Nécessite un compte Cloudflare.',
    cuentaConectada: 'Compte Cloudflare connecté.',
    cuentaSinConectar: 'Aucun compte Cloudflare n’est encore connecté.',
    conectar: 'Se connecter à Cloudflare',
    conectando: 'En attente de l’autorisation dans votre navigateur…',
    conectarAyuda:
      'Votre navigateur s’ouvre pour autoriser WolfCore Dev sur votre compte. Le certificat reste uniquement dans votre dossier de données.',
    autorizacion: 'Autorisation Cloudflare',
    abrirAutorizacion: 'Ouvrir la page d’autorisation',
    copiarAutorizacion: 'Copier le lien d’autorisation',
    cancelarConexion: 'Annuler',
    recrear: 'Recréer le tunnel',
    olvidar: 'Oublier le tunnel',
    recrearTitulo: 'Recréer le tunnel',
    recrearTexto: (n: string) =>
      `Le tunnel « ${n} » sera supprimé chez Cloudflare et un nouveau sera créé avec le même nom. Les sites qui l’utilisent sont fermés.`,
    olvidarTitulo: 'Oublier le tunnel',
    olvidarTexto: (n: string) =>
      `Le tunnel « ${n} » sera supprimé chez Cloudflare avec son identifiant enregistré. Les sites qui l’utilisent reviennent au tunnel rapide.`,
    olvidarAqui: 'Oublier seulement ici',
    olvidarAquiTitulo: 'Oublier le tunnel sur cet ordinateur uniquement',
    olvidarAquiTexto: (n: string) =>
      `L’identifiant enregistré du tunnel « ${n} » sera supprimé sur cet ordinateur ; le tunnel continuera d’exister chez Cloudflare. Les sites qui l’utilisent reviennent au tunnel rapide.`,
    desconectar: 'Déconnecter',
    nombreTunel: 'Nom du tunnel',
    nombreTunelAyuda: 'Minuscules, chiffres et tirets.',
    dominioPublico: 'Domaine public',
    dominioPublicoAyuda:
      'Un sous-domaine d’un de vos domaines Cloudflare, p. ex. demo.mondomaine.com.',
    crear: 'Créer et router',
    guardadoNombre: 'Tunnel nommé prêt. Une confirmation sera demandée à l’ouverture.',
    guardadoRapido: 'Ce site utilise de nouveau le tunnel rapide.',
    cambiarCierra: 'Changer de fournisseur ferme le tunnel ouvert de ce site.',
    usarRapido: 'Utiliser le tunnel rapide',
    nombreActual: (nombre: string, dominio: string) => `Tunnel « ${nombre} » sur ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} sera publié sur ${publico} via un tunnel Cloudflare : toute personne disposant du lien peut y accéder tant qu’il reste ouvert. Publier ?`,
    proveedorNgrokAyuda:
      'Avec votre compte ngrok. Nécessite le programme ngrok déjà installé sur cet ordinateur.',
    proveedorExposeAyuda:
      'Avec votre compte Expose. Nécessite Expose déjà installé sur cet ordinateur ; sous Windows il ne fonctionne qu’avec expose.phar. Son inspecteur est visible sur le réseau local, il n’est donc pas utilisé avec des sites contenant de vraies données.',
    proveedorTailscaleAyuda:
      'Par votre réseau privé Tailscale. Nécessite Tailscale installé et connecté.',
    tokenGuardado: (f: string) => `Jeton enregistré (se termine par ${f}).`,
    tokenSinGuardar: "Aucun jeton enregistré pour l'instant.",
    tokenNgrok: 'Jeton ngrok',
    tokenExpose: 'Jeton Expose',
    tokenAyuda:
      "Il est enregistré chiffré sur cet ordinateur et n'est remis au programme qu'à l'ouverture du tunnel ; il n'est jamais affiché.",
    tokenPlaceholder: 'Collez le jeton ici',
    guardarToken: 'Enregistrer le jeton',
    borrarToken: 'Supprimer le jeton',
    usarProveedor: 'Utiliser ce fournisseur',
    guardadoProveedor: "Fournisseur enregistré. L'ouverture du tunnel demandera une confirmation.",
    ngrokAyudaInstalacion:
      "ngrok doit déjà être installé sur cet ordinateur (WolfCore Dev ne le télécharge pas car ngrok ne publie aucun téléchargement vérifiable). Sa configuration globale n'est pas touchée.",
    exposeAyudaInstalacion:
      'Expose doit déjà être installé ou avoir son expose.phar dans le dossier bin/expose des données de WolfCore Dev (sous Windows il ne fonctionne qu’avec le phar ; il n’y a pas de téléchargement avec empreinte). Son inspecteur de requêtes est visible sur tout le réseau local, il n’est donc pas utilisé avec des sites contenant de vraies données. Sa configuration globale n’est pas touchée.',
    tailscaleAlcance: "Jusqu'où il va",
    tailscaleServe: 'Serve : votre tailnet seulement',
    tailscaleServeAyuda:
      "Seulement les appareils de votre réseau Tailscale. Il n'atteint pas Internet.",
    tailscaleFunnel: 'Funnel : tout Internet',
    tailscaleFunnelAyuda:
      "Toute personne ayant le lien peut entrer, qu'elle soit ou non sur votre tailnet.",
    tailscaleFunnelAviso:
      "Funnel publie ce site sur Internet : toute personne ayant le lien pourra entrer tant qu'il reste ouvert.",
    tailscaleAyudaInstalacion:
      "WolfCore Dev n'installe pas Tailscale (c'est un service système) : il doit être installé et connecté. Rien de ce que vous publiez déjà avec Tailscale n'est modifié ; le site utilise le port HTTPS 8443.",
    confirmarTailnetTitulo: 'Partager avec votre tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} sera partagé avec Tailscale Serve : seuls les appareils de votre tailnet pourront entrer ; il n'est pas publié sur Internet. Partager ?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} contient de vraies données clients. Avec Tailscale Serve, seuls les appareils de votre tailnet pourront le voir (il n'est pas publié sur Internet). Partager ?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} sera publié sur Internet avec Tailscale Funnel : toute personne ayant le lien pourra entrer tant qu'il reste ouvert. Publier ?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} sera publié sur Internet avec ${proveedor} : toute personne ayant le lien pourra entrer tant qu'il reste ouvert. Publier ?`,
    tituloError: 'Impossible d’ouvrir le tunnel',
  },
  tuneles: {
    titulo: 'Tunnels',
    descripcion:
      'Liens publics temporaires de Cloudflare pour montrer un site hors de votre réseau.',
    explicacion:
      'Les tunnels rapides changent d’adresse à chaque ouverture ou renouvellement, et ne fonctionnent que tant que cet ordinateur est allumé et que leurs processus tournent (si vous quittez WolfCore Dev en les laissant allumés, ils restent actifs).',
    columnas: { sitio: 'Site', estado: 'État', url: 'Lien', acciones: 'Actions' },
    vacioTitulo: 'Aucun tunnel ouvert',
    vacio: 'Activez l’interrupteur de tunnel d’un site pour obtenir un lien public.',
    irASitios: 'Aller à Sites',
    sinNombre: 'Site supprimé',
    compartir: {
      enlace: 'Partager un dossier ou un fichier…',
      ayuda: 'Publie un dossier ou un fichier seul (lecture seule), sans avoir besoin d’un site.',
    },
  },
  ajustes: {
    titulo: 'Réglages',
    descripcion: 'Préférences de l’environnement.',
    general: 'Général',
    carpetaDatos: 'Dossier de données',
    carpetaDatosAyuda: 'Binaires, configuration et journaux. Il peut être ouvert, pas modifié.',
    servicios: 'Services',
    puertoNginx: 'Port de Nginx',
    puertoNginxAyuda:
      'Normalement 80. S’il ne s’agit pas de 80, les URL locales comporteront le port. Les tunnels ouverts restent sur l’ancien port : renouvelez-les.',
    trabajadores: 'Workers PHP',
    trabajadoresAyuda:
      'Processus php-cgi par version. Plus de workers traitent plus de requêtes à la fois.',
    nota: 'À l’enregistrement, les sites sont régénérés avec le nouveau port. Si Nginx est allumé, il redémarre (ou se recharge si le port n’a pas changé), et les versions de PHP allumées redémarrent si les workers changent.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Réglages enregistrés et appliqués. Redémarré : ${reiniciados.join(', ')}.`
        : 'Réglages enregistrés et appliqués.',
    errorAplicar: 'Réglages enregistrés, mais ils n’ont pas pu être entièrement appliqués',
    errorSeccion: (detalle: string) => `Impossible de lire cette donnée : ${detalle}`,
    acerca: 'À propos',
    avisos: {
      titulo: 'Avis',
      descripcion:
        'Quels avis sont conservés dans la cloche et si Windows affiche une notification lorsque la fenêtre n’est pas visible.',
      nativas: 'Notifications Windows',
      nativasAyuda:
        'Uniquement quand WolfCore Dev n’est pas au premier plan ; au plus une par type toutes les 5 min.',
      tiposTitulo: 'Types d’avis',
      versionesTitulo: 'Nouvelles versions par service',
      versionesAyuda:
        'Désactivez un service pour ne plus recevoir d’avis sur ses nouvelles versions (l’onglet Versions continue de signaler les mises à jour).',
      versionesDe: (s: string) => `Avertir des nouvelles versions de ${s}`,
      tipos: {
        'servicio-caido': 'Un service s’est arrêté sur une erreur',
        'puerto-ocupado': 'Port occupé au démarrage d’un service',
        'certificado-por-vencer': 'Certificats bientôt expirés',
        'tunel-caido': 'Un tunnel est tombé',
        'proceso-error': 'Un processus de projet a échoué',
        'proceso-terminado': 'Un processus de projet s’est terminé',
        'receta-terminada': 'Une recette de projet est terminée',
        doctor: 'Diagnostic (Doctor)',
        'contenedor-detenido': 'Un conteneur s’est arrêté',
        'version-nueva': 'Une nouvelle version d’un service installé est disponible',
      } as Record<string, string>,
      errorGuardar: 'Impossible d’enregistrer les avis',
    },
    versionPrograma: 'Version du programme',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Autorité locale',
      autoridadAyuda:
        'WolfCore Dev signe les certificats de vos sites .test avec une autorité propre. Elle est installée dans le magasin de votre utilisateur Windows, sans droits d’administrateur.',
      instalada: 'Installée dans Windows',
      noInstalada: 'Non installée',
      instalar: 'Installer l’autorité',
      reinstalar: 'Réinstaller',
      quitar: 'Retirer',
      instaladaOk: 'Autorité HTTPS installée',
      quitadaOk: 'Autorité HTTPS retirée',
      cancelado: 'La confirmation de Windows a été annulée. Rien n’a été modifié.',
      fallo: 'Impossible de modifier l’autorité HTTPS',
      quitarTitulo: 'Retirer l’autorité HTTPS ?',
      quitarTexto:
        'Les navigateurs ne feront plus confiance aux certificats de vos sites .test tant que vous ne l’aurez pas réinstallée.',
      puerto: 'Port HTTPS',
      puertoAyuda:
        'Normalement 443. Si un autre programme l’utilise, choisissez-en un entre 1024 et 65535 ; les URL comporteront le port.',
      puertoRango: 'Utilisez 443 ou un nombre entre 1024 et 65535',
      puertoGuardado: (p: number) => `HTTPS utilise désormais le port ${p}`,
      puertoAplicarFallo: 'Port enregistré, mais Nginx n’a pas accepté la nouvelle configuration',
      firefox:
        'Firefox utilise son propre magasin de certificats. Pour qu’il fasse confiance à l’autorité, ouvrez about:config et activez',
    },
    herramientas: {
      titulo: 'Terminal et outils',
      phpPorDefecto: 'PHP par défaut',
      phpPorDefectoAyuda:
        'La version de php et de composer dans le terminal et dans les raccourcis de WolfCore Dev. « Terminal » utilise le PHP de chaque projet.',
      phpMasReciente: 'La plus récente installée',
      phpSinInstalar: 'Installez PHP dans Services pour choisir une version',
      phpGuardado: 'PHP par défaut mis à jour',
      path: 'PATH de l’utilisateur',
      pathAyuda:
        'Ajoute php et composer de WolfCore Dev au PATH de votre utilisateur pour les utiliser dans n’importe quel terminal.',
      pathActivo: 'Ajouté au PATH',
      pathInactivo: 'Absent du PATH',
      pathAgregar: 'Ajouter au PATH de l’utilisateur',
      pathQuitar: 'Retirer du PATH',
      pathTitulo: 'PATH mis à jour',
      pathAviso:
        'Ouvrez un nouveau terminal pour voir le changement : les terminaux déjà ouverts ne le voient pas.',
      pathQuitarTitulo: 'Retirer WolfCore Dev du PATH ?',
      pathQuitarTexto:
        'php et composer de WolfCore Dev ne seront plus disponibles dans les nouveaux terminaux. Les terminaux déjà ouverts ne changent pas.',
      adminer: 'Port d’Adminer',
      adminerAyuda: 'Adminer n’est servi que sur cet ordinateur, à cette adresse fixe.',
      terminal: 'Terminal par défaut',
      terminalSistema: 'Celui du système (PowerShell)',
      terminalAyuda:
        'Celui qu’ouvre « Terminal » dans les projets. Si le projet a besoin de variables propres (son PHP dans le PATH, la clé d’un agent), avec « Windows Terminal » PowerShell s’ouvre dans le terminal par défaut de Windows : un Windows Terminal déjà ouvert ne recevrait pas ces variables.',
      terminalGuardada: 'Terminal par défaut mis à jour',
      editor: 'Éditeur par défaut',
      editorPrimero: 'Le premier détecté',
      editorAyuda:
        'Celui qu’ouvre « Éditeur » dans les projets et « Ouvrir dans l’éditeur » dans les recherches et les erreurs. VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed et Notepad++ sont détectés.',
      editorGuardado: 'Éditeur par défaut mis à jour',
      editorNinguno: 'Aucun éditeur n’a été détecté.',
    },
  },
  /* ───────────── HTTPS, terminal et FTP dans les sites ; Courrier ; IA locale ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS actif',
    candadoAyuda: 'Ce site répond aussi en HTTPS avec un certificat de WolfCore Dev.',
    redirige: 'Redirige http → https',
    abrirHttp: (dominio: string) => `Ouvrir http://${dominio} dans le navigateur`,
    abrirHttps: (url: string) => `Ouvrir ${url} dans le navigateur`,
    pendiente: (motivo: string) => `HTTPS en attente : ${motivo}`,
    pendienteCorto: 'HTTPS en attente',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `le port ${puerto} est utilisé par ${nombre} (PID ${pid}).`,
    sinAutoridad: 'l’autorité de certification manque. Installez-la dans Réglages.',
    pendienteAyuda:
      'Le site continue de fonctionner en HTTP. Fermez ce programme ou choisissez un autre port HTTPS dans Réglages.',
    sinConfianza: 'Autorité non installée',
    sinConfianzaAyuda:
      'Le navigateur affichera un avertissement de sécurité tant que vous n’aurez pas installé l’autorité de WolfCore Dev (Réglages → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Servir aussi en HTTPS',
    httpsAyuda: 'Avec un certificat propre au domaine et à ses alias, signé par WolfCore Dev.',
    redirigir: 'Rediriger vers HTTPS',
    redirigirAyuda:
      'Les visites en http passent en https. Les tunnels publics ne sont pas affectés.',
    redirigirDeshabilitado: 'Activez d’abord HTTPS',
    sinAutoridadTitulo: 'L’autorité HTTPS n’est pas installée',
    sinAutoridadTexto:
      'Sans elle, le navigateur affichera un avertissement de sécurité. Windows vous demandera de confirmer l’installation.',
    instalar: 'Installer l’autorité',
    instalada: 'Autorité HTTPS installée',
    cancelado: 'La confirmation de Windows a été annulée. Rien n’a été modifié.',
    fallo: 'Impossible d’installer l’autorité HTTPS',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Ouvre un terminal dans le dossier du projet, avec son PHP et Composer dans le PATH.',
    elegir: 'Choisir un terminal',
    predeterminada: 'par défaut',
  },
  editorSitio: {
    ayuda: 'Ouvre le dossier du projet dans l’éditeur par défaut.',
    elegir: 'Ouvrir avec…',
    predeterminada: 'par défaut',
    sustituido: (pred: string, usado: string) =>
      '{pred} n’est pas installé : ouvert avec {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Impossible d’ouvrir l’éditeur',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `PHP ${rama} partagé`,
    propio: (rama: string) => `PHP ${rama} propre à ce site`,
    conXdebug: 'Xdebug actif',
    mostrar: 'Réglages PHP',
    ocultar: 'Masquer les réglages PHP',
    cargando: 'Lecture des réglages PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} est éteint : le PHP propre à ce site démarre avec lui.`,
    ajustesTitulo: 'php.ini propre',
    ajustesAyuda: (rama: string) =>
      `Ils s’ajoutent au php.ini de PHP ${rama} pour ce site uniquement. Avec l’un d’eux (ou avec Xdebug), le site utilise son propre PHP de 1 ou 2 processus ; les autres sites ne changent pas.`,
    clave: 'Directive',
    valor: 'Valeur',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Retirer ${clave || 'le réglage'}`,
    agregar: 'Ajouter un réglage',
    guardarAjustes: 'Tester et enregistrer',
    ajustesGuardados: 'Réglages PHP du site appliqués',
    sinAjustes: 'Aucun réglage propre : il utilise le php.ini partagé tel quel.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug pour ${dominio}`,
    xdebugAyuda:
      'Il n’est chargé que dans le PHP de ce site, jamais dans le PHP partagé : les autres sites restent aussi rapides.',
    xdebugDescarga:
      'Xdebug n’est pas installé dans cette version de PHP : il sera téléchargé depuis le catalogue (xdebug.org, empreinte SHA-256 vérifiée).',
    modo: 'Modes',
    modos: {
      debug: 'debug (points d’arrêt)',
      develop: 'develop (meilleures erreurs)',
      coverage: 'coverage (couverture)',
      profile: 'profile (profilage)',
      trace: 'trace (traçage)',
    },
    puerto: 'Port de l’éditeur',
    inicio: 'Quand il se connecte',
    inicioTrigger: 'Seulement avec XDEBUG_TRIGGER',
    inicioYes: 'À chaque requête',
    inicioAyuda:
      'Avec « Seulement avec XDEBUG_TRIGGER », le débogage démarre lorsque la requête contient le cookie, le paramètre GET/POST ou l’extension du navigateur (Xdebug Helper).',
    guardarXdebug: 'Enregistrer Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Le port ${puerto} est déjà utilisé par un PHP ou un autre service de WolfCore Dev : votre éditeur ne pourra pas l’écouter. Choisissez-en un autre (9003 est le port habituel).`,
    xdebugGuardado: 'Xdebug du site appliqué',
    quitarXdebug: 'Retirer Xdebug',
    quitarXdebugTitulo: 'Retirer Xdebug de ce site ?',
    quitarXdebugTexto:
      'Sa configuration est supprimée. Si le site n’a pas d’autres réglages, il revient au PHP partagé. Le launch.json du projet n’est pas touché.',
    xdebugQuitado: 'Xdebug retiré du site',
    ide: 'Éditeur',
    generarLaunch: 'Générer launch.json',
    launchTitulo: '.vscode/launch.json du projet',
    launchNuevo:
      'Le fichier .vscode/launch.json sera créé avec cette configuration (PHP Debug de VS Code, écoute uniquement sur 127.0.0.1).',
    launchFusion:
      'Un launch.json existe déjà : seule la configuration de WolfCore est ajoutée (ou mise à jour) ; les autres et les commentaires sont conservés. Une copie datée est d’abord enregistrée dans le dossier de données de WolfCore Dev.',
    launchSinCambios: 'Le launch.json contient déjà cette configuration.',
    launchEscribir: 'Écrire launch.json',
    launchCreado: 'launch.json créé dans .vscode',
    launchActualizado: (respaldo: string) =>
      `launch.json mis à jour. Copie préalable : ${respaldo}`,
    phpStorm: 'Configuration pour PhpStorm',
    copiarPhpStorm: 'Copier la configuration PhpStorm',
    errorNginx: (salida: string) =>
      `Nginx n’a pas accepté le changement ; l’état précédent a été rétabli. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Vhost généré',
    conReglas: 'avec règles propres',
    manualResumen: 'Vhost écrit à la main (non régénéré)',
    mostrar: 'Modifier le vhost',
    ocultar: 'Masquer le vhost',
    cargando: 'Lecture du vhost…',
    reglasTitulo: 'Règles propres',
    reglasAyuda:
      'Elles vont dans le bloc server de ce site. Avant d’être appliquées, elles sont testées avec nginx -t sur une copie de toute la configuration ; en cas d’échec, tout reste comme avant.',
    reglasEtiqueta: 'Règles Nginx propres',
    reglasPlaceholder: '# Par exemple : client_max_body_size 256m;',
    snippetsTitulo: 'Extraits',
    insertar: (titulo: string) => `Insérer : ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache des fichiers statiques',
      'limite-subida': 'Limite d’envoi',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'En-têtes de sécurité',
      websocket: 'Proxy WebSocket',
      gzip: 'Compression gzip',
      ocultos: 'Interdire les fichiers cachés',
    },
    aplicar: 'Tester et appliquer',
    descartar: 'Abandonner les modifications',
    aplicado: 'Vhost appliqué et Nginx rechargé',
    aplicadoApagado: 'Vhost enregistré ; il sera utilisé au prochain démarrage de Nginx',
    fallo: 'Nginx n’a pas accepté le changement ; le vhost reste comme avant',
    salidaTitulo: 'Sortie de nginx -t',
    desactivado:
      'Nginx n’a pas accepté ce que vous avez écrit pour ce site lors de l’application de la configuration, et cela a été exclu du vhost (il reste enregistré). Corrigez-le et appliquez-le de nouveau pour le réutiliser.',
    avisoDestino: (destino: string, linea: number) =>
      `Ligne ${linea} : le trafic est envoyé vers un autre ordinateur (${destino}). Vérifiez que c’est bien ce que vous voulez.`,
    generadoTitulo: 'Vhost généré (lecture seule)',
    avanzadoTitulo: 'Mode avancé',
    avanzadoInterruptor: 'Écrire le vhost complet à la main',
    avanzadoAyuda:
      'Remplace le vhost généré. WolfCore Dev ne le régénère plus : si le domaine, HTTPS, les ports ou le dossier changent, c’est à vous de l’ajuster. Il ne peut utiliser que les domaines et les ports de ce site.',
    avanzadoActivarTitulo: 'Écrire le vhost à la main ?',
    avanzadoActivarTexto:
      'On part du vhost généré actuel. Tant que ce mode est actif, les changements du site (domaine, HTTPS, PHP…) ne se reflètent pas dans le vhost : c’est à vous de les faire.',
    avanzadoActivar: 'Écrire à la main',
    manualEtiqueta: 'Vhost complet du site',
    aplicarManual: 'Tester et appliquer le vhost',
    volverGenerado: 'Revenir au vhost généré',
    volverGeneradoTitulo: 'Revenir au vhost généré ?',
    volverGeneradoTexto:
      'Le vhost écrit à la main est conservé dans l’historique et WolfCore Dev régénère celui du site (avec ses règles propres).',
    historial: 'Historique',
    historialTitulo: 'Versions précédentes du vhost',
    historialVacio: 'Aucune version précédente pour l’instant.',
    historialAyuda:
      'Les 10 dernières versions sont conservées, avant chaque changement. La restauration passe par le même test nginx -t.',
    modoReglas: 'Généré avec règles',
    modoManual: 'Écrit à la main',
    restaurar: 'Restaurer',
    restaurarTitulo: 'Restaurer cette version ?',
    restaurarTexto: (fecha: string) =>
      `Le vhost revient à son état du ${fecha}. La version actuelle reste dans l’historique.`,
    restaurado: 'Version restaurée',
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Le processus Reverb de ce projet n’a pas la commande de WolfCore Dev (autre hôte, programme ou port). En l’activant, vous le remplacez par la commande standard, qui n’écoute que sur 127.0.0.1.',
    ayuda: 'WebSockets de Laravel, uniquement sur 127.0.0.1.',
    puerto: (p: number) => 'Port {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) =>
      'Activer ou désactiver Reverb pour {d}'.replace('{d}', dominio),
    activarTitulo: 'Activer Reverb ?',
    activarTexto: (dominio: string) =>
      '« php artisan reverb:start » sera exécuté dans {d}, en écoutant uniquement sur 127.0.0.1 avec un port libre. Le code du projet s’exécute avec son PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Désactiver Reverb ?',
    desactivarTexto:
      'Le processus est arrêté et retiré du projet. Les variables REVERB_* du .env ne sont pas modifiées.',
    activar: 'Activer',
    desactivar: 'Désactiver',
    proponer: 'Proposer les variables REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Arrêté',
      iniciando: 'Démarrage',
      encendido: 'En marche',
      error: 'En erreur',
    },
  },
  lan: {
    etiqueta: 'Réseau local',
    interruptor: (dominio: string) => `Partager ${dominio} sur le réseau local`,
    apagadoAyuda: 'Ouvrez ce site depuis votre mobile ou un autre appareil du même réseau.',
    sinNginx: 'Démarrez Nginx pour partager le site sur le réseau local.',
    sinRed: 'Aucun réseau local n’est connecté (Wi-Fi ou Ethernet).',
    activo: 'Visible sur le réseau local',
    abriendo: 'Partage en cours…',
    cerrando: 'Arrêt du partage…',
    abrirUrl: 'Ouvrir sur cet ordinateur',
    copiarUrl: 'Copier l’adresse',
    verQr: 'Afficher le QR',
    qrTitulo: (dominio: string) => `${dominio} sur le réseau local`,
    qrAviso: 'Scannez le QR avec un mobile connecté au même réseau.',
    confirmarTitulo: 'Partager sur le réseau local',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} sera visible pour tout appareil connecté au même réseau que cet ordinateur (${ip}), sans mot de passe. Le partage s’arrête quand vous éteignez l’interrupteur, à la fermeture de WolfCore Dev et à son prochain démarrage.`,
    ipEtiqueta: 'Réseau (IP de cet ordinateur)',
    https: 'Utiliser HTTPS',
    httpsAyuda:
      'Avec HTTPS, le mobile doit faire confiance à l’AC de WolfCore Dev (bouton « Installer l’AC sur le mobile »). Sans HTTPS, le site passe en HTTP.',
    httpsObligatorio: 'Ce site redirige vers HTTPS : il est donc partagé en HTTPS.',
    compartir: 'Partager sur le réseau',
    tituloError: 'Impossible de partager sur le réseau local',
    caBoton: 'Installer l’AC sur le mobile',
    firewallTitulo: 'Ça ne s’ouvre pas sur le mobile ?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} contient des données réelles et n’est pas partagé sur le réseau local, même avec confirmation.`,
    redPublica:
      'Ce réseau est marqué comme public dans Windows : le pare-feu bloquera l’entrée et la commande n’ouvre que les réseaux privés. Marquez-le comme privé s’il s’agit de votre réseau de confiance.',
    firewallTexto:
      'WolfCore Dev ne modifie pas le pare-feu. N’acceptez pas l’avertissement de Windows pour tout le programme : utilisez la commande de ce port (sous-réseau local et réseaux privés uniquement) dans PowerShell en administrateur. Sur un réseau public, ça n’ouvrira pas, et une règle de blocage existante est prioritaire sur celle d’autorisation.',
    copiarComando: 'Copier la commande',
  },
  caMovil: {
    titulo: 'Installer l’AC sur le mobile',
    intro:
      'Scannez le QR avec un mobile connecté au même réseau pour télécharger le certificat de l’autorité de WolfCore Dev. Seul ce fichier est servi et le lien se ferme tout seul.',
    abriendo: 'Ouverture du lien…',
    expira: (minutos: number) => `Le lien se ferme tout seul dans ${minutos} min.`,
    expirado: 'Le lien a été fermé.',
    reabrir: 'Rouvrir',
    android: 'Android',
    ios: 'iPhone ou iPad',
    pasosAndroid: [
      'Scannez le QR ou ouvrez l’adresse dans le navigateur du mobile et téléchargez le fichier.',
      'Ouvrez Paramètres > Sécurité et confidentialité > Plus de sécurité > Chiffrement et identifiants > Installer un certificat > Certificat d’AC (les noms varient selon la marque).',
      'Avant de faire confiance, comparez l’empreinte SHA-256 affichée par le mobile à celle de cette boîte de dialogue : si elles diffèrent, ne l’installez pas.',
      'Choisissez le fichier téléchargé et acceptez l’avertissement : c’est normal, Android avertit pour toute AC.',
    ],
    pasosIos: [
      'Ouvrez l’adresse dans Safari et autorisez le téléchargement du profil.',
      'Ouvrez Réglages > Profil téléchargé et comparez l’empreinte SHA-1 du détail à celle de cette boîte de dialogue : si elles diffèrent, ne l’installez pas. Puis installez-le.',
      'Ouvrez Réglages > Général > Informations > Réglages des certificats de confiance et activez la confiance totale pour l’AC de WolfCore Dev.',
    ],
    aviso:
      'Une AC installée fait confiance à tout ce qu’elle signe sur ce mobile : installez-la uniquement sur vos appareils et retirez-la ensuite.',
    firewallAviso: (puerto: number) =>
      'Pour que le mobile atteigne le lien, il faut ouvrir le port ' +
      puerto +
      ' (sous-réseau local et réseaux privés uniquement). N’acceptez pas l’avertissement de Windows pour tout le programme : exécutez cette commande dans PowerShell en administrateur. Sur un réseau public, ça n’ouvrira pas, et une règle de blocage existante est prioritaire.',
    huellas: 'Empreintes du certificat',
    tituloError: 'Impossible d’ouvrir le lien de l’AC',
  },
  dialogoQr: {
    descargar: 'Télécharger le PNG',
    descargado: 'QR enregistré',
    largo: 'Le texte est trop long pour un QR.',
    generando: 'Génération du code QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Accès FTP pour ${dominio}`,
    apagadoAyuda: 'Autorisez l’envoi de fichiers vers le dossier de ce site par FTP.',
    activoAyuda: 'Accès actif.',
    soloLecturaEtiqueta: 'lecture seule',
    mostrarDatos: 'Afficher les données FTP',
    ocultarDatos: 'Masquer les données FTP',
    host: 'Serveur',
    puerto: 'Port',
    usuario: 'Utilisateur',
    clave: 'Mot de passe',
    mostrarClave: 'Afficher le mot de passe',
    ocultarClave: 'Masquer le mot de passe',
    copiarDato: (dato: string) => `Copier ${dato}`,
    cargando: 'Lecture des données FTP…',
    regenerar: 'Régénérer le mot de passe',
    regenerarTitulo: 'Régénérer le mot de passe FTP ?',
    regenerarTexto:
      'Le mot de passe actuel cesse de fonctionner et les connexions ouvertes de ce site sont fermées. Vous devrez le mettre à jour dans votre client FTP.',
    regenerada: 'Mot de passe FTP régénéré',
    soloLectura: 'Lecture seule',
    soloLecturaAyuda: 'On peut télécharger, mais pas envoyer, modifier ni supprimer de fichiers.',
    soloLecturaActivado: 'Le FTP de ce site est désormais en lecture seule',
    soloLecturaDesactivado: 'Le FTP de ce site autorise désormais l’écriture',
    activado: 'Accès FTP activé',
    desactivarTitulo: 'Retirer l’accès FTP de ce site ?',
    desactivarTexto:
      'Le mot de passe est supprimé et les connexions ouvertes sont fermées. Le dossier du site n’est pas touché.',
    desactivar: 'Retirer l’accès',
    desactivado: 'Accès FTP retiré',
    redLocalAviso:
      'Le FTP accepte les connexions du réseau local et envoie le mot de passe et les fichiers sans chiffrement. Ne l’utilisez que sur un réseau de confiance.',
    redLocalHost: 'ou l’IP de cet ordinateur sur votre réseau',
    servidorApagado:
      'Le serveur FTP est éteint : personne ne pourra se connecter tant que vous ne l’aurez pas allumé.',
    encender: 'Allumer le FTP',
    urlEtiqueta: 'Adresse',
    urlAyuda: 'L’adresse n’inclut pas le mot de passe : il est demandé à la connexion.',
    abrirUrl: 'Ouvrir dans un client FTP',
    copiarUrl: 'Copier l’adresse FTP',
    verQr: 'Afficher le code QR de l’adresse',
    qrTitulo: 'Adresse FTP de ce site',
    qrAviso: 'Le code ne contient que l’adresse, pas le mot de passe.',
    compartirNota:
      'Le FTP ne sert que sur le réseau local : il n’est pas partagé par un tunnel internet, car il envoie le mot de passe et les fichiers sans chiffrement.',
    compartirIr: 'Partager un dossier ou un fichier avec un lien temporaire',
  },
  correo: {
    descripcion:
      "Les capteurs interceptent les courriers envoyés par vos projets pour que vous les examiniez sans qu'ils sortent sur internet. Ils écoutent uniquement sur cet ordinateur (127.0.0.1) et un seul est actif à la fois.",
    seccionCaptadores: 'Capteurs locaux',
    seccionProveedores: 'Fournisseurs SMTP distants',
    proveedores: {
      descripcion:
        'Un vrai fournisseur SMTP envoie réellement le courrier : utilisez-le pour tester l’envoi de votre projet avant de le publier. La clé est stockée chiffrée sur cet ordinateur et n’est jamais affichée.',
      agregar: 'Ajouter un fournisseur',
      vacio:
        'Vous n’avez encore ajouté aucun fournisseur. Choisissez Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO ou Gmail, ou saisissez le vôtre.',
      errorLista: 'Impossible de lire la liste des fournisseurs',
      tarjeta: {
        servidor: 'Serveur',
        usuario: 'Identifiant',
        clave: 'Clé',
        sinClave: 'Sans clé',
        claveIlegible: 'Enregistrée (illisible)',
        red: 'Réseau',
        redLocal: 'Serveur de cet ordinateur ou du réseau local (confirmé)',
        editar: 'Modifier',
        borrar: 'Supprimer',
        borrarTitulo: (n: string) => `Supprimer ${n} ?`,
        borrarTexto:
          'Le fournisseur et sa clé enregistrée sont supprimés. Les projets qui l’utilisent reviennent au capteur local, mais leurs .env ne sont pas modifiés : ils gardent les variables MAIL_* de ce fournisseur (et sa clé, si vous l’avez écrite). Réécrivez le bloc courrier dans chaque .env.',
        borrado: (n: string) => `${n} supprimé`,
        usar: 'Utiliser dans un projet',
        destino: 'Adresse de destination du test',
        destinoPlaceholder: 'votre-adresse@exemple.com',
        probar: 'Tester l’envoi',
        probando: 'Envoi…',
        probarAyuda:
          'Envoie un seul vrai courriel à cette adresse, via une connexion chiffrée vérifiée. Au plus un toutes les 15 s.',
        sinClaveParaProbar: 'Enregistrez la clé du fournisseur pour pouvoir tester l’envoi.',
        hostLocal: 'Le nom de ce serveur se résout vers cet ordinateur ou le réseau local.',
        confirmarRed: 'Confirmer le réseau local',
        enviado: (para: string) => `Courriel envoyé à ${para}. Vérifiez votre boîte de réception.`,
        fallos: {
          'correo.auth': 'Le fournisseur a refusé l’identifiant ou la clé.',
          'correo.conexion': 'Connexion impossible : vérifiez l’hôte et le port.',
          'correo.tls':
            'La connexion chiffrée n’est pas valide (certificat, nom ou STARTTLS). Rien n’a été envoyé.',
          'correo.rechazado':
            'Le serveur a refusé le message ou une adresse. Vérifiez l’expéditeur : beaucoup de fournisseurs n’acceptent qu’un expéditeur ou un domaine vérifié.',
          'correo.plazo': 'Le serveur n’a pas répondu à temps (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Ajouter un fournisseur SMTP',
        editar: (n: string) => `Modifier ${n}`,
        preset: 'Fournisseur',
        presetOtro: 'Autre (saisir les données)',
        presetAyuda:
          'L’hôte et le port proviennent de la documentation officielle de chaque fournisseur.',
        documentacion: 'Voir la documentation',
        region: 'Région',
        nombre: 'Nom',
        nombreObligatorio: 'Saisissez un nom.',
        host: 'Serveur (hôte)',
        hostAyuda: 'Seulement le nom ou l’IP, sans smtp:// ni port.',
        hostObligatorio: 'Saisissez le serveur.',
        puerto: 'Port',
        seguridad: 'Chiffrement',
        seguridadAyuda:
          'Une connexion chiffrée avec un certificat valide est toujours exigée : on ne retombe jamais en texte clair.',
        tls: 'TLS direct (port 465)',
        starttls: 'STARTTLS (port 587)',
        usuario: 'Identifiant',
        usuarioObligatorio: 'Saisissez l’identifiant.',
        usuarioFijoAyuda:
          'Ce fournisseur utilise toujours cet identifiant ; la clé est celle de votre compte.',
        clave: 'Clé SMTP',
        claveGuardada: (f: string) => `Enregistrée : ••••${f}`,
        claveNueva: 'Saisissez la clé pour l’enregistrer',
        claveAyuda:
          'Elle est stockée chiffrée sur cet ordinateur et n’est plus jamais affichée. Laissez vide pour la conserver.',
        remitente: 'Expéditeur du test (facultatif)',
        remitenteAyuda:
          'Beaucoup de fournisseurs n’envoient que depuis un expéditeur ou un domaine vérifié. Si vous laissez vide, l’expéditeur est l’adresse de destination elle-même.',
        claveSinEspacios:
          'Collez la clé telle que le fournisseur la donne : les espaces internes sont conservés.',
        borrarClave: 'Supprimer la clé',
        borrarClaveTitulo: (n: string) => `Supprimer la clé de ${n} ?`,
        borrarClaveTexto: 'La clé enregistrée est supprimée. Le fournisseur reste dans la liste.',
        claveBorrada: 'Clé supprimée',
        guardar: 'Enregistrer',
        guardado: (n: string) => `${n} enregistré`,
        redLocalTitulo: 'Serveur sur cet ordinateur ou le réseau local',
        redLocalTexto: (h: string) =>
          `${h} pointe vers cet ordinateur ou le réseau local. WolfCore Dev ne s’y connecte que si vous le confirmez. Est-ce un serveur à vous ?`,
        redLocalConfirmar: 'Oui, c’est le mien',
        cambiaTitulo: 'Envoyer la clé à un autre serveur',
        cambiaTexto: (h: string) =>
          `Le fournisseur a une clé enregistrée et vous avez changé le serveur ou l’identifiant. La clé sera envoyée à ${h}. Continuer ?`,
        cambiaConfirmar: 'Oui, continuer',
      },
      env: {
        titulo: (n: string) => `Utiliser ${n} dans un projet`,
        proyecto: 'Projet',
        sinProyectos: 'Il n’y a pas encore de projets.',
        yaUsaSmtp: 'Ce projet envoie déjà via un fournisseur SMTP.',
        volverCaptador: 'Revenir au capteur local',
        volvio: (n: string) =>
          `${n} renvoie de nouveau vers le capteur local, mais son .env n’a pas été modifié : il garde les variables MAIL_* du fournisseur (et sa clé, si vous l’avez écrite). Réécrivez son bloc courrier.`,
        incluirClave: 'Écrire aussi la clé dans le .env',
        incluirClaveAyuda:
          'Sans cocher, le bloc ne contient pas MAIL_PASSWORD et vous l’ajoutez à la main.',
        sinClaveGuardada: 'Le fournisseur n’a pas de clé enregistrée.',
        vista: 'Modifications du .env (la clé est masquée)',
        textoPlano:
          'La clé sera en texte clair dans le .env du projet. Toute personne ayant accès à ce dossier, ou à son dépôt si vous le publiez, pourra la lire.',
        claveTitulo: 'Écrire la clé dans le .env',
        claveTexto:
          'La clé est enregistrée en texte clair dans le fichier .env du projet. N’utilisez cette option que si le projet n’est pas publié dans un dépôt et que le dossier est uniquement à vous.',
        claveConfirmar: 'Je comprends, inclure la clé',
        agregarGitignore: 'Ajouter .env au .gitignore',
        gitignoreTitulo: 'Modifier le .gitignore',
        gitignoreTexto:
          'La ligne .env est ajoutée au .gitignore du projet (avec une copie préalable).',
        gitignoreConfirmar: 'Ajouter',
        versionadoTitulo: 'Git suit déjà le .env',
        versionadoTexto:
          'Le prochain commit publierait ses valeurs. Retirez-le de l’index avec git rm --cached .env.',
        desconocidoTitulo: 'Impossible de vérifier Git',
        desconocidoTexto: 'Impossible de savoir si Git suit le .env de ce projet.',
        aceptarVersionado: 'Écrire quand même',
        aceptarTitulo: 'Écrire dans un .env suivi',
        aceptarTexto:
          'Si Git suit le .env, ces variables peuvent finir dans le dépôt. Écrire quand même ?',
        aceptarConfirmar: 'Écrire quand même',
        confirmarTitulo: 'Écrire dans le .env',
        confirmarTexto: (ruta: string) =>
          `Une copie de ${ruta} sera enregistrée et les variables MAIL_* seront ajoutées sans la clé.`,
        confirmarTextoClave: (ruta: string) =>
          `Une copie de ${ruta} sera enregistrée et les variables MAIL_* seront ajoutées, avec la clé en texte clair.`,
        confirmar: 'Écrire',
        escribir: 'Écrire dans le .env',
        escrito: (n: string) => `${n} envoie désormais via ce fournisseur`,
      },
    },
    estado: 'État',
    smtp: 'SMTP',
    buzon: 'Boîte web',
    abrirBuzon: 'Ouvrir la boîte',
    noLeidos: 'Non lus',
    noLeidosValor: (n: number) => plural(n, 'courrier non lu', 'courriers non lus'),
    noLeidosError: 'Impossible de lire la boîte',
    actualizar: 'Recompter les courriers',
    actualizaSolo: 'Se met à jour toutes les 15 secondes tant que cet écran est ouvert.',
    env: 'Bloc pour le .env de Laravel',
    envAyuda: (captador: string) =>
      `Collez-le dans le .env de votre projet. Le courrier reste dans ${captador}, sans chiffrement ni utilisateur.`,
    copiarEnv: 'Copier le bloc',
    irAServicios: 'Aller à Services',
    cargando: 'Lecture des capteurs…',
    errorLista: 'Impossible de lire la liste des capteurs',
    captador: {
      opcional: 'Optionnel',
      elegido: 'Reçoit le courrier de vos projets',
      noInstalado: 'Non installé',
      instalar: 'Installer',
      usar: 'Utiliser celui-ci',
      apagar: 'Arrêter',
      iniciando: 'Démarrage…',
      avisoMantenimiento: "Ce capteur n'est presque plus maintenu. Préférez Mailpit ou smtp4dev.",
    },
    notaDescartados:
      "MailHog et MailDev ne sont pas proposés : MailHog ne publie aucune empreinte pour vérifier le téléchargement et MailDev n'existe que sur npm. Rien n'est téléchargé sans empreinte vérifiable.",
    notaHost:
      "Les boîtes web ne répondent que sur 127.0.0.1, mais tant qu'un capteur est actif une page web malveillante pourrait tenter de lire votre boîte (DNS rebinding). smtp4dev et Papercut rejettent les en-têtes Host étrangers ; Mailpit sert sa boîte sous un chemin secret propre à cet ordinateur (WolfCore Dev ouvre cette adresse pour vous) ; Inbucket n'a aucune protection : arrêtez-le quand vous ne l'utilisez pas.",
  },
  ia: {
    descripcion:
      'Fournisseurs d’IA dans le cloud et modèles locaux avec Ollama. Les clés sont enregistrées chiffrées sur cet ordinateur et ne sont jamais affichées.',
    nube: {
      titulo: 'IA dans le cloud',
      agregar: 'Ajouter un fournisseur',
      vacio:
        'Vous n’avez encore ajouté aucun fournisseur. Ajoutez OpenAI, Anthropic, Gemini, Hermes (Nous) ou un fournisseur compatible OpenAI.',
      errorLista: 'Impossible de lire la liste des fournisseurs',
    },
    local: { titulo: 'IA locale (Ollama)' },
    pestanas: {
      etiqueta: 'Sections IA',
      agentes: 'Agents',
      nube: 'Cloud',
      local: 'Modèles locaux',
    },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Compatible OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Clé',
      sinClave: 'Sans clé',
      claveIlegible: 'Enregistrée (illisible)',
      url: 'URL de base',
      modeloPorDefecto: 'Modèle par défaut',
      ninguno: 'Aucun',
      probarConexion: 'Tester la connexion',
      probarConexionAyuda: 'Liste les modèles du fournisseur. Ne consomme pas de jetons.',
      probando: 'Test en cours…',
      conectado: (ms: number, n: number) => `Connecté · ${ms} ms · ${n} modèles`,
      verModelos: (n: number) => `Voir les ${n} modèles`,
      soloGratuitos: 'Gratuits uniquement',
      fallo: 'Connexion impossible',
      probarMensaje: 'Tester un message',
      probarMensajeAyuda:
        'Envoie un court message fixe pour vérifier que le modèle répond. Consomme quelques jetons.',
      elegirModelo: 'Modèle pour le message',
      sinModelo: 'Testez la connexion ou définissez un modèle par défaut pour en choisir un.',
      enviando: 'Envoi…',
      respuesta: (ms: number) => `Réponse en ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} jetons en entrée, ${salida} en sortie`,
      usar: 'Utiliser dans un projet',
      editar: 'Modifier',
      borrar: 'Supprimer',
      acciones: (nombre: string) => `Actions de ${nombre}`,
    },
    costo: {
      titulo: 'Tester un message',
      texto: (modelo: string, proveedor: string) =>
        `Un court message fixe sera envoyé au modèle ${modelo} de ${proveedor}. Cela consomme des jetons de votre compte : la réponse est coupée à 16 jetons et coûte généralement une fraction de centime.`,
      enviar: 'Envoyer le message',
    },
    dialogo: {
      nuevo: 'Ajouter un fournisseur d’IA',
      editar: (nombre: string) => `Modifier ${nombre}`,
      tipo: 'Type',
      preset: 'Fournisseur compatible',
      presetAyuda: 'Remplit le nom et l’URL ; vous pouvez les modifier.',
      presetOtro: 'Autre',
      documentacion: 'Voir la documentation',
      nombre: 'Nom',
      urlBase: 'URL de base',
      urlAyuda:
        'Vide = l’officielle. Uniquement https://, ou http:// vers 127.0.0.1 ou [::1] (LM Studio).',
      urlObligatoria: 'Saisissez l’URL de base du fournisseur compatible.',
      modelo: 'Modèle par défaut (facultatif)',
      modeloAyuda: 'Utilisé dans le bloc .env (AI_MODEL) et dans le message de test.',
      clave: 'Clé d’API',
      claveNueva: 'Collez la clé',
      claveGuardada: (final: string) =>
        `Une clé est enregistrée (${final}). N’en saisissez une autre que pour la remplacer.`,
      claveAyuda:
        'Elle est enregistrée chiffrée sur cet ordinateur et n’est plus jamais affichée. Seuls les 4 derniers caractères sont visibles.',
      claveOpcional: 'Facultative pour les serveurs locaux (LM Studio).',
      borrarClave: 'Supprimer la clé',
      guardar: 'Enregistrer',
      guardado: (nombre: string) => `${nombre} enregistré`,
      urlCambiaTitulo: 'La clé sera envoyée à une autre URL',
      urlCambiaTexto: (url: string) =>
        `Ce fournisseur a une clé enregistrée. Désormais, elle sera envoyée à ${url}. Ne confirmez que si vous faites confiance à ce serveur.`,
      urlCambiaConfirmar: 'Envoyer la clé à la nouvelle URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Supprimer la clé de ${nombre} ?`,
      claveTexto:
        'La clé est supprimée de cet ordinateur. Les .env où vous l’avez écrite ne sont pas touchés : changez-la aussi là-bas si vous la révoquez.',
      proveedorTitulo: (nombre: string) => `Supprimer ${nombre} ?`,
      proveedorTexto:
        'Le fournisseur et sa clé enregistrée sont supprimés. Les .env de vos projets ne sont pas touchés.',
      respaldos: (n: number) =>
        n === 1
          ? 'Supprimer aussi les copies du .env d’1 projet qui contiennent cette clé en clair'
          : `Supprimer aussi les copies du .env de ${n} projets qui contiennent cette clé en clair`,
      respaldosAyuda:
        'WolfCore Dev conserve des copies du .env avant de l’écrire, en dehors des projets. Leur suppression est irréversible.',
      claveBorrada: 'Clé supprimée',
      proveedorBorrado: (nombre: string) => `${nombre} supprimé`,
      respaldosBorrados: (n: number) => `Les copies du .env de ${n} projet(s) ont été supprimées`,
    },
    env: {
      titulo: (nombre: string) => `Utiliser ${nombre} dans un projet`,
      proyecto: 'Projet',
      sinProyectos: 'Aucun projet monté.',
      modelo: 'Modèle (AI_MODEL)',
      modeloAyuda: 'Facultatif. Choisissez-en un dans la liste ou saisissez-le.',
      vista: 'Bloc qui sera écrit dans le .env (la clé est affichée masquée)',
      cargando: 'Préparation de l’aperçu…',
      textoPlano:
        'La clé sera en clair dans le .env du projet. Toute personne ayant accès à ce dossier pourra la lire.',
      copiaPrevia:
        'Le .env actuel est copié auparavant, en dehors du projet (dans le dossier de données de WolfCore Dev).',
      sinClave:
        'Ce fournisseur a besoin d’une clé : enregistrez-la avant de l’utiliser dans un projet.',
      gitignoreFalta: 'Le .gitignore du projet n’ignore pas le .env.',
      gitignoreNoExiste: 'Le projet n’a pas de .gitignore.',
      gitignoreOk: 'Le .gitignore ignore déjà le .env.',
      agregarGitignore: 'Ajouter .env au .gitignore',
      gitignoreTitulo: 'Modifier le .gitignore',
      gitignoreTexto:
        'La ligne .env sera ajoutée au .gitignore du projet (ou le fichier sera créé), avec une copie préalable.',
      gitignoreConfirmar: 'Ajouter au .gitignore',
      versionadoTitulo: 'Git suit déjà le .env de ce projet',
      versionadoTexto:
        'Même s’il est dans .gitignore, le prochain commit enverrait la clé. Avant de l’écrire, retirez-le de l’index et faites un commit :',
      desconocidoTitulo: 'Impossible de vérifier si git suit le .env',
      desconocidoTexto:
        'Git n’a pas répondu (il n’est pas installé ou le dossier n’est pas de confiance). Si le .env est déjà dans le dépôt, le prochain commit enverrait la clé. Vérifiez-le avec :',
      aceptarVersionado: 'Je comprends le risque : écrire la clé quand même',
      aceptarTitulo: 'Écrire même si git peut envoyer la clé',
      aceptarTexto:
        'Si le .env est dans le dépôt, la clé se retrouvera dans le prochain commit et dans l’historique. Ne le faites que si vous avez déjà exécuté git rm --cached .env ou si le dépôt n’est qu’à vous.',
      aceptarConfirmar: 'J’accepte le risque',
      conflictoTitulo: 'Le .env définit déjà ces variables avec une autre valeur',
      reemplazar: (claves: string) => `Remplacer ${claves}`,
      reemplazarTitulo: 'Remplacer des variables du .env',
      reemplazarTexto: (claves: string) =>
        `Les lignes de ${claves} que le .env contenait déjà seront retirées et celles du bloc de WolfCore Dev resteront. Le .env précédent est copié auparavant.`,
      reemplazarConfirmar: 'Remplacer',
      escribir: 'Écrire dans le .env',
      confirmarTitulo: 'Écrire la clé en clair',
      confirmarTexto: (carpeta: string) =>
        `La clé sera écrite sans chiffrement dans ${carpeta}. Ne partagez pas ce fichier et ne l’envoyez pas dans un dépôt.`,
      confirmar: 'Écrire la clé',
      escrito: (proyecto: string) => `Bloc d’IA écrit dans le .env de ${proyecto}`,
      copiarComando: 'Copier la commande',
    },
  },
  iaLocal: {
    descripcion:
      'Modèles de langage qui tournent sur votre ordinateur avec Ollama. Utilisez-les depuis vos projets sans envoyer de données sur Internet.',
    sinInstalarTitulo: 'Ollama n’est pas installé',
    sinInstalar:
      'Installez-le depuis Services pour télécharger et utiliser des modèles sur votre ordinateur.',
    irAServicios: 'Aller à Services',
    apagadoTitulo: 'Ollama est éteint',
    apagado: 'Allumez-le pour voir, télécharger et tester des modèles.',
    iniciando: 'Ollama est en cours de démarrage…',
    errorTitulo: 'Ollama n’a pas pu s’allumer',
    encender: 'Allumer Ollama',
    verServicios: 'Voir dans Services',
    modelos: 'Modèles installés',
    sinModelos: 'Aucun modèle pour l’instant. Téléchargez-en un plus bas.',
    errorModelos: 'Impossible de lire la liste des modèles',
    recargar: 'Recharger la liste',
    total: (n: number) => plural(n, 'modèle', 'modèles'),
    espacio: 'Espace utilisé',
    espacioAyuda: 'Ce que tous les modèles occupent dans le dossier de données.',
    probarDe: (modelo: string) => `Tester ${modelo}`,
    borrarDe: (modelo: string) => `Supprimer ${modelo}`,
    borrarTitulo: (modelo: string) => `Supprimer le modèle ${modelo} ?`,
    borrarTexto: (tamano: string) =>
      `${tamano} d’espace disque seront libérés. Pour le réutiliser, vous devrez le télécharger de nouveau.`,
    borrado: (modelo: string) => `Modèle ${modelo} supprimé`,
    descargar: {
      titulo: 'Télécharger un modèle',
      campo: 'Nom du modèle',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda:
        'Saisissez le nom utilisé par Ollama (ollama.com/library) ou choisissez une suggestion.',
      sugerenciaAyuda: {
        'llama3.2': 'Chat généraliste, léger',
        'qwen2.5-coder': 'Programmation',
        mistral: 'Chat généraliste',
        'nomic-embed-text': 'Embeddings pour les recherches (bots)',
      } as Record<string, string>,
      boton: 'Télécharger',
      invalido: 'Utilisez des lettres, des chiffres et . _ : / - (par exemple llama3.2)',
      yaInstalado: 'Ce modèle est déjà installé',
      enCurso: 'Ce modèle est déjà en cours de téléchargement',
      confirmarTitulo: (modelo: string) => `Télécharger ${modelo} ?`,
      confirmarTexto:
        'Vous pouvez annuler le téléchargement à tout moment ; ce qui a déjà été téléchargé est supprimé.',
      tamano: (t: string) => `Taille du téléchargement : ${t}.`,
      tamanoDesconocido:
        'Impossible de consulter la taille (pas de connexion au registre d’Ollama). Les modèles pèsent en général de 1 à plus de 40 Go.',
      libre: (l: string) => `Espace libre sur le disque des modèles : ${l}.`,
      libreDesconocido: 'Impossible de mesurer l’espace libre du disque.',
      sinEspacio: (t: string, l: string) =>
        `Espace insuffisant : le modèle pèse ${t} et il reste ${l} de libre. Libérez de l’espace ou choisissez un modèle plus petit.`,
      confirmar: 'Télécharger',
    },
    progreso: {
      fases: {
        preparando: 'Préparation…',
        descargando: 'Téléchargement',
        verificando: 'Vérification',
        guardando: 'Enregistrement',
        listo: 'Terminé',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} sur ${total}`,
      cancelarDe: (modelo: string) => `Annuler le téléchargement de ${modelo}`,
      cancelando: 'Annulation…',
      listo: (modelo: string) => `${modelo} téléchargé`,
      cancelado: (modelo: string) => `Téléchargement de ${modelo} annulé`,
      error: (modelo: string) => `Impossible de télécharger ${modelo}`,
      descartar: 'Ignorer',
      descartarDe: (modelo: string) => `Ignorer l’avis de ${modelo}`,
    },
    prueba: {
      titulo: 'Tester un modèle',
      modelo: 'Modèle',
      elegir: 'Choisissez un modèle',
      prompt: 'Message',
      placeholder: 'Saisissez une courte question et appuyez sur Entrée',
      enviar: 'Envoyer',
      respuesta: 'Réponse',
      pensando:
        'Le modèle est en train de répondre… la première fois, cela peut prendre du temps pendant son chargement.',
      vacia: '(Le modèle n’a renvoyé aucun texte.)',
      sinModelos: 'Téléchargez un modèle pour le tester.',
    },
    conexion: {
      titulo: 'Connexion depuis vos projets',
      base: 'URL de base d’Ollama',
      openai: 'Endpoint compatible OpenAI',
      env: 'Bloc pour le fichier .env',
      envAyuda:
        'Utile pour Laravel ou pour un bot avec FastAPI. WolfCore Dev n’écrit pas dans vos projets.',
      copiarEnv: 'Copier le bloc',
      copiarDato: (dato: string) => `Copier ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code et Codex pourront se connecter à ces modèles en un clic à l’étape B.',
  },
  proyectos: {
    titulo: 'Projets',
    descripcion:
      'Chaque projet est un dossier avec son site .test, sa recette d’installation et ses processus.',
    agregar: 'Ajouter un projet',
    vacioTitulo: 'Aucun projet pour l’instant',
    vacio:
      'Clonez un dépôt GitHub ou choisissez un dossier : WolfCore Dev détecte le type de projet et le prépare pas à pas.',
    pasos: {
      porTipo: {
        'composer-install': 'Installer les dépendances PHP (composer install)',
        'env-crear': 'Créer le fichier .env',
        'key-generate': 'Générer la clé de l’application',
        'bd-crear': 'Créer la base de données',
        'bd-restaurar': 'Restaurer une sauvegarde',
        migrar: 'Migrer la base de données',
        'storage-link': 'Lier le stockage (storage:link)',
        'npm-ci': 'Installer les dépendances Node (npm ci)',
        'npm-build': 'Compiler les ressources (npm run build)',
        'python-venv': 'Créer l’environnement virtuel (.venv)',
        'pip-install': 'Installer les dépendances Python (pip)',
        'pgvector-activar': 'Activer pgvector sur la base',
        'sitio-crear': 'Créer le site',
        comando: 'Commande du projet',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Créer le site ${dominio}` : 'Créer le site'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Restaurer la sauvegarde ${archivo}` : 'Restaurer une sauvegarde',
      migrar: 'Migrer la base de données',
      migrarSemilla: 'Migrer la base de données et charger des données de test (--seed)',
      comando: (linea: string) => (linea ? `Exécuter : ${linea}` : 'Commande du projet'),
    },
    estadoPaso: {
      pendiente: 'En attente',
      corriendo: 'En cours',
      listo: 'Terminé',
      error: 'Erreur',
      omitido: 'Ignoré',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Non préparé',
      corriendo: 'Préparation…',
      lista: 'Préparé',
      error: 'Une étape a échoué',
      cancelada: 'Préparation annulée',
      incompleta: 'Préparation incomplète',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Ajouter un projet',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Dossier' },
      destino: 'Dossier de destination',
      destinoAyuda: (base: string) =>
        `Il est cloné dans ${base}. Pour un autre emplacement, utilisez "Choisir un dossier…".`,
      nombreCarpeta: 'Nom du dossier',
      nombrePlaceholder: 'mon-projet',
      elegirDestino: 'Choisir un dossier…',
      destinoPorDefecto: 'Utiliser le dossier des projets',
      clonar: 'Cloner',
      clonando: 'Clonage…',
      clonado: 'Dépôt cloné',
      errorClonar: 'Impossible de cloner le dépôt',
      sinCancelar:
        'Le clonage ne peut pas être interrompu d’ici : attendez qu’il se termine (cela peut prendre plusieurs minutes).',
      sinGit:
        'Git n’est pas installé. Installez-le (git-scm.com) et rouvrez cette boîte de dialogue.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Connecté avec GitHub CLI en tant que ${usuario}` : 'Connecté avec GitHub CLI',
      estadoToken: 'Connecté avec un jeton personnel',
      estadoNinguna: 'Pas de connexion à GitHub',
      ayudaNinguna:
        'Connectez-vous avec GitHub CLI (recommandé) ou utilisez un jeton personnel à granularité fine avec la permission de lecture du contenu.',
      instalarGh: 'Installer GitHub CLI',
      instalandoGh: 'Installation de GitHub CLI…',
      ghInstalado: 'GitHub CLI installé. Connectez-vous maintenant.',
      iniciarSesion: 'Se connecter',
      sesionAbierta:
        'Une fenêtre de connexion s’est ouverte. Quand vous avez terminé, appuyez sur "Vérifier à nouveau".',
      comprobar: 'Vérifier à nouveau',
      usarToken: 'Utiliser un jeton',
      token: 'Jeton personnel GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Il est enregistré chiffré sur cet ordinateur et n’est plus jamais affiché ni écrit dans les projets.',
      guardarToken: 'Enregistrer le jeton',
      tokenGuardado: 'Jeton enregistré',
      quitarToken: 'Retirer le jeton',
      tokenQuitado: 'Jeton retiré',
      buscar: 'Rechercher des dépôts',
      cargando: 'Chargement des dépôts…',
      sinRepos: 'Aucun dépôt trouvé.',
      cargarMas: 'Charger plus',
      privado: 'Privé',
      yaClonado: 'Déjà cloné',
      yaClonadoAyuda: 'Un projet existe déjà avec ce dépôt ou dans son dossier de destination.',
      actualizado: (fecha: string) => `Mis à jour ${fecha}`,
      elegir: 'Choisir',
      errorRepos: 'Impossible de lire la liste des dépôts',
    },
    url: {
      etiqueta: 'URL du dépôt',
      placeholder: 'https://github.com/utilisateur/projet.git',
      ayuda:
        'https://…, git@hôte:chemin ou utilisateur/projet (GitHub). Sans utilisateur ni mot de passe dans l’URL.',
      invalida: 'Utilisez https://…, git@hôte:chemin ou utilisateur/projet',
    },
    carpeta: {
      titulo: 'Projet déjà présent sur l’ordinateur',
      texto: 'Choisissez le dossier : le type de projet est détecté et sa recette est proposée.',
      elegir: 'Choisir un dossier',
      manual: 'Ajouter sans recette (configuration manuelle)',
      yaEsProyecto: (nombre: string) => `Ce dossier est déjà le projet ${nombre}.`,
      vigilarTitulo: 'Dossier surveillé',
      vigilarTexto:
        'WolfCore Dev vous prévient quand un nouveau dossier ressemblant à un projet apparaît. C’est aussi là que les dépôts sont clonés.',
      vigilando: (carpeta: string) => `Surveillance de ${carpeta}`,
      sinVigilar: 'Aucun dossier n’est surveillé.',
      vigilar: 'Choisir le dossier à surveiller',
      cambiarVigilada: 'Changer',
      dejarDeVigilar: 'Arrêter la surveillance',
    },
    asistente: {
      titulo: (nombre: string) => `Préparer ${nombre}`,
      cargando: 'Analyse du projet…',
      origenYml: 'La recette provient du wolfcore.yml du dépôt.',
      origenDefecto: 'Recette proposée selon le type de projet.',
      deteccion: 'Ce qui a été détecté',
      deteccionAyuda: 'Corrigez-le si quelque chose ne correspond pas au projet.',
      tipo: 'Type',
      php: 'PHP',
      phpNinguno: 'Aucune version installée',
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
      versionAuto: 'Celle détectée',
      servicios: 'Services',
      serviciosNinguno: 'Aucun',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Détecté : ${v}`,
      nodeInstalar: 'Node n’est pas installé : installez-le dans Services.',
      pythonInstalar: 'Python n’est pas installé : installez-le dans Services.',
      lenguajeInstalar: (nombre: string) =>
        `${nombre} n’est pas installé : installez-le dans Services.`,
      dominio: 'Domaine',
      puertoProxy: 'Port local',
      puertoPlaceholder: '8000',
      receta: 'Étapes',
      recetaAyuda:
        'Elles s’exécutent dans l’ordre. Désactivez celles dont vous ne voulez pas ; les facultatives peuvent être déplacées.',
      subir: 'Monter',
      bajar: 'Descendre',
      fijo: 'Cette étape est nécessaire',
      restaurar: 'Restaurer une sauvegarde…',
      cambiarRespaldo: 'Changer de sauvegarde',
      quitarRespaldo: 'Retirer la sauvegarde',
      sobrescribir: 'Écraser la base si elle contient déjà des tables',
      semilla: 'Charger des données de test (--seed)',
      sinMotor:
        'Pas de base de données : choisissez un moteur dans Services pour la créer ou restaurer une sauvegarde.',
      confio: 'Je fais confiance à ce dépôt : exécuter ses étapes d’installation',
      confioAyuda:
        'Les étapes exécutent des programmes du projet (composer, npm, pip, migrations) sur votre ordinateur. Ne cochez que si vous connaissez le code.',
      montar: 'Monter le projet',
      montando: 'Montage du projet…',
      reintentar: 'Réessayer',
      omitir: 'Ignorer',
      cancelar: 'Annuler',
      cancelando: 'Annulation…',
      cerrar: 'Fermer',
      cerrarCorriendo: 'Masquer (continue en arrière-plan)',
      abrirSitio: 'Ouvrir le site',
      verRegistro: 'Voir le journal',
      ocultarRegistro: 'Masquer le journal',
      listo: 'Le projet est prêt.',
      fallo: (paso: string) =>
        `Échec : ${paso}. Réessayez, ignorez-la ou annulez ; rien n’a été défait.`,
      cancelada:
        'La préparation a été annulée. Vous pouvez la reprendre depuis la carte du projet.',
      incompleta: 'Des étapes restent à exécuter.',
      errorCrear: 'Impossible de créer le projet',
      errorReceta: 'Impossible de lire la recette',
      recetaCambio:
        'La recette du projet (wolfcore.yml) a changé depuis que vous lui avez fait confiance. Réessayer utilise la recette enregistrée la dernière fois.',
      recargar: 'Examiner la nouvelle recette',
      seguirGuardada: 'Continuer avec celle enregistrée',
      soloLectura:
        'Le type, PHP, le domaine, les versions et le port sont ceux du projet : modifiez-les avec Modifier.',
    },
    tarjeta: {
      receta: 'Préparation',
      reinstalar: 'Réinstaller les dépendances',
      reinstalarTitulo: (nombre: string) => `Exécuter la recette de ${nombre} ?`,
      reinstalarTexto:
        'Les étapes de la dernière préparation (celles que vous avez vérifiées dans l’assistant) sont répétées :',
      noRestaura: 'n’est pas restauré de nouveau',
      recetaCambio:
        'La recette du projet (wolfcore.yml) a changé depuis que vous lui avez fait confiance. Réinstaller répète celle enregistrée ; utilisez "Examiner la recette" pour voir la nouvelle.',
      revisarReceta: 'Examiner la recette',
      preparar: 'Préparer…',
      ejecutar: 'Exécuter',
      verPreparacion: 'Voir la préparation',
      sinConfianza:
        'Examinez la recette et cochez "Je fais confiance à ce dépôt" dans l’assistant pour pouvoir l’exécuter.',
      runtimes: 'Avis de versions',
      verRegistros: 'Voir les journaux',
      verEnBases: 'Voir dans Bases de données',
      abrirAgente: 'Ouvrir un agent d’IA',
      vscode: 'Éditeur',
      vscodeAyuda: 'Ouvrir le dossier du projet dans l’éditeur par défaut',
      vscodeError: 'Impossible d’ouvrir l’éditeur',
      baseDatos: 'Base de données',
      baseDatosAyuda: (base: string) =>
        `Ouvrir la base « ${base} » déjà connectée (Adminer ou phpMyAdmin)`,
      baseDatosSinDetectar: 'Ouvrir la base de données du projet (Adminer ou phpMyAdmin)',
      sinBase: 'Le .env du projet ne déclare pas de base MySQL, MariaDB ou PostgreSQL.',
      adminerNoListo: 'Adminer n’est pas prêt',
      entradaAutomatica: 'S’ouvre déjà connecté, sans saisir le mot de passe.',
      elegirBd: 'Choisir Adminer ou phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (MySQL et MariaDB seulement)',
      phpMyAdminNoListo: 'phpMyAdmin n’est pas prêt',
      entroComoAdmin: (usuario: string) =>
        `Connecté en tant que ${usuario}, l’administrateur du serveur, car ce projet n’utilise pas d’utilisateur propre. Dans le gestionnaire de .env, « Utiliser un utilisateur dédié » en crée un limité à sa base.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Connecté en tant que ${usuario}, l’administrateur du serveur : le mot de passe de l’utilisateur propre de ce projet n’est pas enregistré sur cet ordinateur. Dans le gestionnaire de .env, « Utiliser un utilisateur dédié » en génère un nouveau.`,
      abrirSitio: 'Ouvrir le site dans le navigateur',
      github: 'Dépôt',
      abrirRemoto: (url: string) => `Ouvrir ${url}`,
      confiado: 'De confiance',
      confiadoAyuda: 'Ses étapes d’installation peuvent être exécutées.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'HEAD détaché',
      cambios: (n: number) =>
        plural(n, 'modification non enregistrée', 'modifications non enregistrées'),
      limpio: 'Aucune modification',
      atras: (n: number) => `${n} à récupérer`,
      adelante: (n: number) => `${n} à envoyer`,
      traer: 'Récupérer les changements',
      traerAyuda:
        'git pull sans fusion : en cas de modifications locales ou de branches divergentes, il ne touche à rien.',
      alDia: 'Déjà à jour.',
      actualizado: 'Changements récupérés',
      sugeridosTitulo: 'Changements récupérés',
      sugeridosTexto: 'Selon ce qui a changé, il est conseillé d’exécuter ces étapes :',
      sugeridosNinguno: 'Aucune étape à exécuter.',
      migracionesNuevas: (n: number) => plural(n, 'nouvelle migration', 'nouvelles migrations'),
      ejecutarSugeridos: 'Exécuter les étapes',
      corridaTitulo: 'Étapes après la récupération des changements',
      corridaAyuda: 'Ne modifie pas la recette enregistrée du projet.',
      ahoraNo: 'Pas maintenant',
      errorEstado: 'Impossible de lire l’état de Git',
      commitIa: {
        boton: 'Suggérer un commit',
        ayuda:
          'Propose avec l’IA un message pour ce qui est préparé (git add) et fait le commit si vous l’acceptez.',
        titulo: 'Commit avec un message suggéré',
        proveedor: 'Fournisseur d’IA',
        modelo: 'Modèle',
        sinProveedores:
          'Configurez un fournisseur d’IA dans le cloud (écran IA) pour suggérer des messages.',
        privacidad:
          'Le diff de ce qui est préparé est envoyé au fournisseur, sans .env, clés, certificats, fichiers d’identifiants ni binaires, et au maximum 20 000 caractères. Consomme peu de jetons.',
        sugerir: 'Suggérer un message',
        mensaje: 'Message (vous pouvez le modifier)',
        commit: 'Faire le commit',
        commitAyuda:
          'Uniquement ce qui est préparé (git add) : n’ajoute pas de fichiers et ne fait pas de push.',
        hecho: 'Commit effectué avec ce qui était préparé.',
      },
    },
    procesos: {
      titulo: 'Processus',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Terminé sans erreur',
      ninguno: 'Aucun processus. Ajoutez npm run dev, queue:work, uvicorn…',
      agregar: 'Ajouter un processus',
      editar: 'Modifier le processus',
      nuevo: 'Nouveau processus',
      interruptor: (nombre: string) => `Allumer ou éteindre ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx envoie le site vers ce processus.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'redémarrage', 'redémarrages'),
      verLog: 'Voir le journal',
      ocultarLog: 'Masquer le journal',
      logVacio: 'Pas encore de sortie.',
      abrirCarpetaLog: 'Ouvrir le dossier du journal',
      quitar: 'Retirer le processus',
      quitarTitulo: (nombre: string) => `Retirer le processus ${nombre} ?`,
      quitarTexto: 'S’il est en cours d’exécution, il est arrêté.',
      nombre: 'Nom',
      nombrePlaceholder: 'Vite',
      comando: 'Commande',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda:
        'Programme et arguments, sans shell. Utilisez des guillemets pour les arguments avec espaces.',
      cwd: 'Dossier',
      cwdPlaceholder: 'racine',
      cwdAyuda: 'racine ou un sous-dossier du projet (par exemple frontend).',
      puertoCampo: 'Port',
      puertoNinguno: 'Aucun',
      puertoAyuda: 'Informatif uniquement, sauf si le processus est la cible du proxy.',
      autoIniciar: 'Allumer au démarrage de WolfCore Dev',
      reiniciar: 'Redémarrer en cas de plantage',
      esProxy: 'Cible du proxy Nginx',
      requiereReinicio:
        'Le processus est en cours d’exécution : les changements de commande, de dossier ou de port s’appliquent à son redémarrage.',
      reinicieAhora:
        'Enregistré. Éteignez et rallumez le processus pour appliquer les changements.',
      guardado: 'Processus enregistré',
      errores: {
        comando: 'Saisissez la commande',
        puerto: 'Le port doit être compris entre 1 et 65535',
        proxySinPuerto: 'La cible du proxy a besoin d’un port',
        cwd: 'Utilisez racine ou un sous-dossier du projet',
        repetido: 'Un processus porte déjà ce nom',
      },
      estados: {
        encendido: 'Allumé',
        apagado: 'Éteint',
        iniciando: 'Démarrage…',
        error: 'Erreur',
        externo: 'Externe',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Journaux de ${nombre}`,
      fuente: 'Source',
      ninguna: 'Ce projet n’a pas encore de journaux.',
      vacio: 'Le journal est vide.',
      actualizar: 'Actualiser',
      abrirCarpeta: 'Ouvrir le dossier',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Un nouveau dossier ressemble à un projet'
          : `${n} nouveaux dossiers ressemblent à des projets`,
      montar: 'Préparer',
      ignorar: 'Ignorer',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Courriers non lus',
    correoApagado: 'Mailpit éteint',
    correoSinInstalar: 'Mailpit non installé',
    modelos: 'Modèles d’IA',
    iaApagada: 'Ollama éteint',
    iaSinInstalar: 'Ollama non installé',
    sinLeer: 'Lecture impossible',
    sinDato: '—',
  },
  /* ───────────── Panneau de performances, visionneuse de journaux et MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['o', 'Ko', 'Mo', 'Go', 'To'],
    porSegundo: '/s',
    porcentaje: ' %',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'j',
    /** Worker N d’un service (p. ex. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Performances',
    ventana: '5 dernières minutes',
    pausado: 'En pause tant que la fenêtre est masquée',
    esperando: 'En attente du premier échantillon…',
    errorMuestreo: (detalle: string) =>
      `Impossible de demander l’échantillonnage des performances : ${detalle}`,
    cpu: 'CPU',
    ram: 'Mémoire',
    disco: 'Disque de données',
    red: 'Réseau',
    deTotal: (usado: string, total: string) => `${usado} sur ${total}`,
    libre: (libre: string) => `${libre} libres`,
    bajada: 'Réception',
    subida: 'Envoi',
    graficaCpu: (valor: string) =>
      `Graphique du CPU des 5 dernières minutes ; actuellement ${valor}`,
    graficaRam: (valor: string) =>
      `Graphique de la mémoire des 5 dernières minutes ; actuellement ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Graphique du réseau des 5 dernières minutes ; réception ${bajada}, envoi ${subida}`,
    alertas: {
      titulo: 'Alertes',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Le port ${puerto} de ${servicio} est utilisé par un autre programme : ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `La mémoire de l’ordinateur est à ${porcentaje} %. Éteignez ce que vous n’utilisez pas pour que tout réponde mieux.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Un php-cgi qui n’appartient pas à WolfCore Dev (PID ${pid}) écoute sur ${puertos.join(', ')} : il date d’une session précédente.`,
      finalizar: 'Terminer le processus',
      finalizarTitulo: 'Terminer ce processus ?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) sera fermé sans enregistrer ce qu’il a d’ouvert. Ne l’utilisez que si vous savez que ce programme est inutile.`,
      finalizado: (nombre: string) => `${nombre} terminé`,
      verPuertos: 'Voir les ports',
      errorPuertos: 'Impossible de vérifier quels programmes utilisent les ports.',
    },
    procesos: {
      titulo: 'Services et processus',
      vacio: 'Aucun service ni processus de projet en cours.',
      nombre: 'Nom',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Port',
      encendido: 'Allumé',
      acciones: 'Actions',
      detener: 'Arrêter',
      registros: 'Voir les journaux',
      servicio: 'Service',
      proyecto: 'Projet',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto} : ${proceso}`,
    },
  },
  registros: {
    titulo: 'Journaux',
    descripcion:
      'Suivez en direct les journaux de Nginx, de PHP, des services, des sites, des processus de projet et des tunnels.',
    fuente: 'Source',
    elegirFuente: 'Choisissez un journal',
    sinFuentes:
      'Aucun journal pour l’instant. Ils apparaissent lorsqu’un service, un site ou un processus écrit le premier.',
    buscar: 'Filtrer par texte',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pause',
    reanudar: 'Reprendre',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 nouvelle ligne en pause' : `${n} nouvelles lignes en pause`,
    copiar: 'Copier le visible',
    copiadas: (n: number) => (n === 1 ? '1 ligne copiée' : `${n} lignes copiées`),
    limpiar: 'Effacer',
    abrirCarpeta: 'Ouvrir le dossier',
    alFinal: 'Suivre la fin',
    mostrarMas: 'Afficher plus',
    ocultas: (n: number) =>
      n === 1 ? '1 ligne précédente non affichée' : `${n} lignes précédentes non affichées`,
    vacio: 'Pas encore de lignes. Les nouvelles apparaissent ici dès qu’elles sont écrites.',
    sinCoincidencias: 'Aucune ligne ne correspond au filtre.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} lignes` : `${visibles} sur ${total} lignes`,
    descartadas: (n: number) =>
      `(les 5000 dernières sont conservées ; ${n} plus anciennes écartées)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Services',
      sitio: 'Sites',
      laravel: 'Laravel',
      proyecto: 'Processus de projet',
      tunel: 'Tunnels',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (accès)',
      nginxError: 'Nginx (erreurs)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (accès)`,
      sitioError: (dominio: string) => `${dominio} (erreurs)`,
      tunel: (sitio: string) => `Tunnel de ${sitio}`,
      tunelSalida: (sitio: string) => `Tunnel de ${sitio} (sortie)`,
      laravel: (sitio: string) => `${sitio} : laravel.log`,
      ci3: (sitio: string) => `${sitio} : CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio} : ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Ouvrez un nouveau terminal pour voir le changement : les terminaux déjà ouverts ne le voient pas.',
    enPathSinCliente: 'Dans le PATH, mais la commande manque',
    reparar: 'Réparer',
    repararTitulo: 'Réparer la commande wolf ?',
    repararTexto:
      'wolf est dans le PATH mais ses fichiers sont incomplets. Ils seront copiés de nouveau dans le dossier de données et le serveur local démarrera, comme à l’ajout.',
    titulo: 'Terminal : commande wolf',
    descripcion:
      'Pilotez WolfCore Dev depuis PowerShell, cmd ou Git Bash : wolf status, wolf use php@8.4, wolf share, wolf logs. Cela ne fonctionne que si l’application est ouverte.',
    activo: 'Disponible dans le PATH',
    enPathSinServidor: 'Dans le PATH, serveur arrêté',
    inactivo: 'Pas dans le PATH',
    agregarBoton: 'Ajouter wolf au PATH',
    quitarBoton: 'Retirer wolf du PATH',
    agregarTitulo: 'Ajouter wolf au PATH de l’utilisateur ?',
    agregarTexto:
      'La commande wolf sera copiée dans le dossier de données de WolfCore Dev, ce dossier sera ajouté au PATH de votre utilisateur (une copie du PATH d’origine est conservée) et un serveur local démarrera sur 127.0.0.1, qui ne répond qu’à wolf avec une clé qui change à chaque démarrage. Publier un site sur internet ou changer le PHP de tous les terminaux est toujours confirmé aussi dans la fenêtre de l’application. Vous pouvez le retirer à tout moment.',
    agregar: 'Ajouter',
    quitarTitulo: 'Retirer wolf du PATH ?',
    quitarTexto:
      'Le dossier de wolf sera retiré du PATH de votre utilisateur, le serveur local sera arrêté et la commande copiée sera supprimée. Les terminaux déjà ouverts ne changent pas.',
    quitar: 'Retirer',
    listoTitulo: 'Commande wolf mise à jour',
    ayuda:
      'Ouvrez un nouveau terminal après l’avoir ajouté. Le serveur n’écoute que sur 127.0.0.1.',
    aislado: 'Avec un dossier de données de test (WOLFCORE_DATOS), le PATH n’est pas modifié.',
    errorCargar: (detalle: string) => `Impossible de lire l’état de wolf : ${detalle}`,
  },
  mcp: {
    titulo: 'Serveur MCP',
    descripcion:
      'Permet à Claude Code et à d’autres assistants de piloter vos sites, services et bases depuis cet ordinateur. Il n’écoute que sur 127.0.0.1 et exige un jeton.',
    estado: 'État',
    activo: 'Actif',
    inactivo: 'Arrêté',
    activar: 'Activer',
    detener: 'Arrêter',
    activado: 'Serveur MCP actif',
    detenido: 'Serveur MCP arrêté',
    direccion: 'Adresse',
    puerto: 'Port',
    puertoAyuda: 'Entre 1024 et 65535. S’il est actif, il redémarre sur le nouveau port.',
    puertoRango: 'Utilisez un nombre entre 1024 et 65535',
    puertoGuardado: (p: number) => `Le serveur MCP utilisera le port ${p}`,
    copiarConfig: 'Copier la configuration pour Claude Code',
    copiarConfigAyuda:
      'Copie dans le presse-papiers la configuration avec le jeton. Collez-la dans Claude Code ; le jeton n’est pas affiché ici.',
    configCopiada: 'Configuration copiée dans le presse-papiers',
    regenerar: 'Régénérer le jeton',
    regenerarTitulo: 'Régénérer le jeton du serveur MCP ?',
    regenerarTexto:
      'Le jeton actuel cesse d’être valide immédiatement : les assistants connectés devront utiliser la nouvelle configuration.',
    regenerado: 'Jeton régénéré. Copiez de nouveau la configuration.',
    errorCargar: (detalle: string) => `Impossible de lire l’état du serveur MCP : ${detalle}`,
    confirmacion: {
      titulo: 'Un assistant demande une confirmation',
      herramienta: 'Outil',
      pendientes: (actual: number, total: number) => `${actual} sur ${total}`,
      aprobar: 'Approuver',
      rechazar: 'Refuser',
      aprobada: 'Action approuvée',
      rechazada: 'Action refusée',
      vencida: 'La demande n’était plus en attente.',
      descartadas: (n: number) =>
        n === 1
          ? 'et 1 autre qui n’a pas tenu (elle expirera toute seule)'
          : `et ${n} autres qui n’ont pas tenu (elles expireront toutes seules)`,
      falloRespuesta: (detalle: string) =>
        `Impossible d’envoyer la réponse ; la demande reste en attente. ${detalle}`,
      si: 'Oui',
      no: 'Non',
      campos: {
        motor: 'Moteur',
        base: 'Base de données',
        archivo: 'Fichier',
        sobrescribir: 'Écraser',
        pid: 'PID',
        nombre: 'Processus',
        proyecto: 'Projet',
        pasos: 'Étapes',
        cantidad: 'Dumps',
      } as Record<string, string>,
    },
  },
  captura: {
    barra: 'Outils de dessin',
    herramientas: {
      recuadro: 'Rectangle',
      flecha: 'Flèche',
      linea: 'Ligne',
      resaltador: 'Surligneur',
      texto: 'Texte',
      pixelar: 'Pixeliser',
      pixelarAyuda: 'Pixeliser (peu sûr pour des données sensibles : utilisez Masquer)',
      ocultar: 'Masquer',
      ocultarAyuda: 'Masquer avec un aplat opaque (recommandé pour les données sensibles)',
    },
    deshacer: 'Annuler',
    rehacer: 'Rétablir',
    copiar: 'Copier',
    copiarAyuda:
      'Copier dans le presse-papiers. Le presse-papiers de Windows peut le conserver dans son historique ou le synchroniser avec d’autres appareils.',
    guardar: 'Enregistrer…',
    alConversor: 'Envoyer au convertisseur d’images',
    cerrar: 'Annuler (Échap)',
    nuevaSeleccion: 'Nouvelle sélection',
    color: 'Couleur',
    grosor: 'Épaisseur',
    formato: 'Format',
    cargando: 'Préparation de la capture…',
    guiaRegion: 'Faites glisser pour choisir la zone. Échap annule.',
    guiaVentana: 'Choisissez la fenêtre à capturer. Échap annule.',
    sinVentanas: 'Aucune fenêtre ne peut être capturée.',
    textoPlaceholder: 'Saisissez puis appuyez sur Entrée',
    copiada: 'Copiée dans le presse-papiers',
    guardada: (archivo: string) => `Enregistrée dans ${archivo}`,
    errorCargar: 'Impossible d’ouvrir la capture.',
    errorCopiar: 'Impossible de copier l’image.',
    errorGuardar: 'Impossible d’enregistrer l’image.',
    errorConversor: 'Impossible d’envoyer l’image au convertisseur.',
    errorVentana: 'Impossible de capturer cette fenêtre.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Tout se passe sur cet ordinateur : la capture n’est envoyée à aucun service et n’est pas écrite sur le disque tant que vous ne l’enregistrez pas. Les fenêtres de WolfCore Dev se cachent un instant pour ne pas apparaître sur l’image.',
      region: 'Région',
      regionAyuda: 'Faites glisser sur l’écran pour choisir la zone.',
      ventana: 'Fenêtre',
      ventanaAyuda: 'Choisissez l’une des fenêtres ouvertes.',
      pantalla: 'Plein écran',
      pantallaAyuda: 'L’écran où se trouve le curseur.',
      atajoActivo: (atajo: string) => `Raccourci global actif : ${atajo} (région).`,
      atajoInactivo: 'Il n’y a pas de raccourci global. Activez-le dans les Réglages.',
      noDisponible: 'La capture d’écran n’est pas disponible sur cet ordinateur.',
      permisoDenegado:
        'L’autorisation d’enregistrement de l’écran manque. Activez-la pour WolfCore Dev dans les réglages du système.',
      ocupada: 'Une capture est déjà en cours.',
    },
    ajustes: {
      titulo: 'Capture d’écran',
      descripcion:
        'Région, fenêtre ou plein écran avec un éditeur rapide. C’est 100 % local : rien n’est envoyé ni enregistré tant que vous ne le décidez pas.',
      activar: 'Raccourci global',
      activarAyuda:
        'Désactivé par défaut. Une fois activé, il n’est enregistré que si aucun autre programme ne l’utilise, et il est libéré à la fermeture de WolfCore Dev.',
      atajo: 'Combinaison',
      grabar: 'Modifier',
      grabando: 'Appuyez sur la combinaison…',
      grabandoAyuda:
        'Utilisez Ctrl ou Super avec un autre modificateur (par exemple Ctrl+Alt+Maj) et une lettre, un chiffre ou une touche F. Évitez les raccourcis courants comme Ctrl+C.',
      formato: 'Format à l’enregistrement',
      activado: (atajo: string) => `Raccourci ${atajo} activé.`,
      desactivado: 'Raccourci désactivé.',
      ocupado: (atajo: string) =>
        `Le raccourci ${atajo} est déjà utilisé par un autre programme et rien n’a été modifié. Essayez une autre combinaison.`,
      ocupadoInicio:
        'Le raccourci enregistré est déjà utilisé par un autre programme et n’a pas été enregistré. Choisissez une autre combinaison.',
      sinPermiso:
        'Sur macOS, l’autorisation d’enregistrement de l’écran est requise ; elle sera demandée à la première capture.',
      formatoGuardado: 'Format enregistré.',
    },
  },

  herramientas: {
    descripcion:
      'Utilitaires du quotidien. Ils fonctionnent hors connexion et sans services externes.',
    buscar: 'Rechercher un outil…',
    sinResultados: 'Aucun outil ne correspond à la recherche.',
    abrir: 'Ouvrir',
    procesar: 'Traitement…',
    copiar: 'Copier',
    copiado: 'Copié dans le presse-papiers',
    limpiar: 'Effacer',
    pendienteApi: 'En attente : le noyau n’expose pas encore cette information à l’interface.',
    lista: {
      qr: {
        nombre: 'Générateur de QR',
        descripcion: 'À partir d’un texte ou du lien d’un tunnel ; PNG.',
      },
      json: { nombre: 'JSON', descripcion: 'Formater, valider et minifier, avec arborescence.' },
      regex: {
        nombre: 'Expressions régulières',
        descripcion: 'Testeur avec correspondances, groupes et référence.',
      },
      diff: {
        nombre: 'Comparer des textes',
        descripcion: 'Différences côte à côte, y compris de fichiers.',
      },
      tiempo: { nombre: 'Temps', descripcion: 'Timestamp ↔ date, avec fuseau horaire.' },
      puertos: {
        nombre: 'Ports et processus',
        descripcion: 'Ce qui écoute sur chaque port, et terminer le processus.',
      },
      bom: {
        nombre: 'Nettoyage du BOM UTF-8',
        descripcion: 'Retire le BOM de fichiers ou de dossiers.',
      },
      certificados: {
        nombre: 'Certificats',
        descripcion: 'Émettre avec la CA de WolfCore Dev pour n’importe quel nom.',
      },
      cripto: {
        nombre: 'Crypto',
        descripcion: 'Hash, base64, URL, UUID, mots de passe et JWT.',
      },
      markdown: { nombre: 'Aperçu Markdown', descripcion: 'Écrivez et voyez le résultat.' },
      entorno: { nombre: 'Environnement du système', descripcion: 'PATH, versions et variables.' },
      buscar: {
        nombre: 'Recherche',
        descripcion: 'Texte dans les noms et le contenu d’un projet, dossier ou fichier.',
      },
      infoArchivo: {
        nombre: 'Informations sur un fichier',
        descripcion: 'Taille, type et hashes d’un fichier.',
      },
      clienteHttp: {
        nombre: 'Client HTTP',
        descripcion: 'Tester des API : requêtes, environnements, collections et historique.',
      },
      websocket: {
        nombre: 'Client WebSocket',
        descripcion: 'Se connecter, envoyer et voir les messages.',
      },
      contrasenas: {
        nombre: 'Mots de passe',
        descripcion: 'Mesurer un mot de passe et repérer les comptes faibles de vos bases.',
      },
      qrWifi: {
        nombre: 'QR Wi-Fi',
        descripcion: 'Code QR pour que d’autres se connectent à votre réseau.',
      },
      imagenes: {
        nombre: 'Images',
        descripcion: 'Convertir en ICO ou PNG et compresser en JPEG ou WebP.',
      },
      comprimir: {
        nombre: 'ZIP et PDF',
        descripcion: 'Compresser fichiers et dossiers en ZIP et optimiser les PDF.',
      },
      conversor: {
        nombre: 'Convertisseur de documents',
        descripcion: 'Convertir Word, Excel, PDF, CSV et Markdown sans quitter cet ordinateur.',
      },
      captura: {
        nombre: 'Capture d’écran',
        descripcion: 'Région, fenêtre ou plein écran, avec éditeur rapide.',
      },
      guiaTuneles: {
        nombre: 'Guide des tunnels',
        descripcion: 'Cloudflare et ngrok pas à pas, avec des commandes à copier.',
      },
      guiaHttp: {
        nombre: 'Guide HTTP',
        descripcion: 'Codes d’état et méthodes, avec recherche et exemples.',
      },
      guiaGit: {
        nombre: 'Guide de Git et GitHub',
        descripcion:
          'Commandes et façons de travailler, avec un laboratoire pour s’exercer sans risque.',
      },
      limpiezaDisco: {
        nombre: 'Nettoyage du disque',
        descripcion:
          'Analyse et supprime les fichiers temporaires et les caches régénérables, avec aperçu et confirmation.',
      },
      editor: {
        nombre: 'Éditeur de code',
        descripcion:
          'Modifiez des fichiers texte avec coloration, copie préalable et enregistrement confirmé.',
      },
      compartir: {
        nombre: 'Partager un dossier ou un fichier',
        descripcion:
          'Publiez un dossier ou un fichier sur internet avec un lien temporaire, en lecture seule.',
      },
      usoDisco: {
        nombre: 'Utilisation du disque',
        descripcion:
          'Ce qui occupe de la place sur un lecteur ou un dossier : arborescence, plus gros fichiers et dossiers, par extension.',
      },
      diffCarpetas: {
        nombre: 'Différences de dossiers',
        descripcion:
          'Compare deux dossiers : seulement dans l’un, seulement dans l’autre et différents, avec les différences de chaque fichier.',
      },
      grabarPantalla: {
        nombre: 'Enregistrer l’écran',
        descripcion: 'Ouvre l’enregistreur déjà fourni avec votre système.',
      },
    },
    secciones: {
      codigo: 'Code',
      red: 'Réseau',
      seguridad: 'Sécurité',
      archivos: 'Fichiers et médias',
      sistema: 'Système',
    },
    tarjetas: {
      comparar: {
        nombre: 'Comparer',
        descripcion: 'Textes et dossiers : les différences côte à côte.',
      },
      qr: {
        nombre: 'QR',
        descripcion:
          'À partir d’un texte ou d’un lien, ou pour que d’autres rejoignent votre Wi-Fi.',
      },
      guias: {
        nombre: 'Guides',
        descripcion: 'HTTP, tunnels et Git, avec des exemples et des commandes à copier.',
      },
    },
    pestanas: {
      diff: 'Textes',
      diffCarpetas: 'Dossiers',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunnels',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev n’a pas d’enregistreur propre : il ouvre celui que votre système fournit déjà. La vidéo est enregistrée là où cet outil la range.',
      abrir: 'Ouvrir l’enregistreur',
      abierta:
        'L’Outil Capture d’écran est ouvert. Choisissez la zone de l’écran et cliquez sur Démarrer.',
      noSePudo:
        'Impossible d’ouvrir l’Outil Capture d’écran d’ici. Utilisez l’un des raccourcis du guide.',
      guiaTitulo: 'Comment enregistrer sur votre système',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Appuyez sur Win + Maj + R pour enregistrer avec l’Outil Capture d’écran.',
            'S’il n’est pas à jour, appuyez sur Win + Alt + R pour enregistrer avec la Xbox Game Bar.',
            'Arrêtez l’enregistrement avec le bouton de la barre qui apparaît en haut.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Appuyez sur Cmd + Maj + 5 pour ouvrir la barre de capture.',
            'Choisissez d’enregistrer tout l’écran ou une partie sélectionnée.',
            'Cliquez sur Enregistrer puis, pour terminer, sur le bouton d’arrêt de la barre des menus.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Chaque bureau fournit son enregistreur : dans GNOME, Ctrl + Alt + Maj + R ; dans KDE, Spectacle.',
            'Si vous n’en avez aucun, installez OBS Studio ou SimpleScreenRecorder depuis votre gestionnaire de paquets.',
          ],
        },
      },
    },
    errores: {
      jsonVacio: 'Saisissez ou collez un JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `JSON non valide : vérifiez la ligne ${linea}, colonne ${columna}.`,
      banderas:
        'Drapeaux non valides : utilisez uniquement d, g, i, m, s, u, v ou y, sans répétition.',
      regex: (detalle: string) => `Expression non valide (${detalle}).`,
      trabajador: 'Impossible d’exécuter l’opération en arrière-plan.',
      diffLento: 'Les textes sont trop différents pour être comparés à temps.',
      base64: 'Base64 non valide.',
      utf8: 'Le contenu décodé n’est pas du texte UTF-8.',
      url: 'Séquence d’URL non valide.',
      coste: (max: number) => `Le coût de bcrypt doit être compris entre 4 et ${max}.`,
      jwtPartes: 'Le JWT doit avoir trois parties séparées par un point.',
      jwtCabecera: 'Impossible de lire l’en-tête du JWT.',
      jwtCarga: 'Impossible de lire le contenu (payload) du JWT.',
      longitud: 'La longueur doit être comprise entre 4 et 256.',
      sinConjuntos: 'Choisissez au moins un type de caractère.',
      sinDominios: 'Saisissez au moins un nom ou une IP.',
      muchosDominios: (max: number) => `Au maximum ${max} noms par certificat.`,
    },
    qr: {
      texto: 'Texte ou URL',
      textoAyuda: 'Le QR est généré sur l’ordinateur ; rien ne sort sur le réseau.',
      tunel: 'Lien de tunnel d’un projet',
      sinTuneles: 'Aucun tunnel actif',
      descargar: 'Télécharger le PNG',
      vacio: 'Saisissez quelque chose pour générer le code.',
      largo: 'Le texte est trop long pour un QR.',
      descargado: 'Téléchargement lancé.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formater',
      minificar: 'Minifier',
      validar: 'Valider',
      valido: 'JSON valide.',
      resultado: 'Résultat',
      arbol: 'Arborescence',
      mas: (n: number) => `… ${n} de plus`,
    },
    regex: {
      patron: 'Motif',
      banderas: 'Drapeaux',
      texto: 'Texte de test',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'correspondance' : 'correspondances'}${truncado ? ' (les premières sont affichées)' : ''}`,
      sinCoincidencias: 'Aucune correspondance.',
      tiempo:
        'L’expression a pris trop de temps et a été interrompue (possible retour arrière catastrophique).',
      grupo: (n: number) => `Groupe ${n}`,
      referencia: 'Aide-mémoire',
      tabla: [
        ['.', 'N’importe quel caractère (sauf saut de ligne sans s)'],
        ['\\d \\w \\s', 'Chiffre, lettre/nombre/_ et espace'],
        ['\\D \\W \\S', 'Le contraire des précédents'],
        ['[abc] [^abc]', 'Un de la liste / aucun de la liste'],
        ['^ $', 'Début et fin (de ligne avec m)'],
        ['\\b', 'Limite de mot'],
        ['* + ?', 'Zéro ou plus, un ou plus, facultatif'],
        ['{n,m}', 'Entre n et m répétitions'],
        ['*? +?', 'Version paresseuse'],
        ['(…) (?<nombre>…)', 'Groupe de capture et groupe nommé'],
        ['(?:…)', 'Groupe sans capture'],
        ['(?=…) (?!…)', 'Suivi de / non suivi de'],
        ['a|b', 'Alternative'],
        ['g i m s u y', 'Global, insensible à la casse, multiligne, point total, Unicode, collant'],
      ] as [string, string][],
    },
    diff: {
      original: 'Original',
      modificado: 'Modifié',
      cargarArchivo: 'Charger un fichier',
      comparar: 'Comparer',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} lignes`,
      iguales: 'Les textes sont identiques.',
      archivoGrande: 'Le fichier dépasse 5 Mo ; choisissez-en un plus petit.',
      textoGrande: 'Chaque texte peut faire au maximum 5 Mo.',
      truncado: (mostradas: number, total: number) =>
        `Les ${mostradas} premières lignes sur ${total} sont affichées.`,
    },
    tiempo: {
      timestamp: 'Timestamp (secondes ou millisecondes)',
      fecha: 'Date (AAAA-MM-JJ HH:mm:ss)',
      zona: 'Fuseau horaire',
      ahora: 'Maintenant',
      segundos: 'Secondes',
      milisegundos: 'Millisecondes',
      iso: 'ISO 8601 (UTC)',
      enZona: 'Dans le fuseau choisi',
      desplazamiento: 'Décalage',
      relativo: 'Relatif',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Lu en secondes' : 'Lu en millisecondes',
      timestampInvalido: 'Saisissez uniquement des chiffres (un signe est permis).',
      fechaInvalida: 'Utilisez le format AAAA-MM-JJ HH:mm[:ss] avec une vraie date.',
      zonaInvalida: 'Fuseau horaire inconnu.',
    },
    puertos: {
      filtro: 'Filtrer par port, PID ou nom',
      actualizar: 'Actualiser',
      columnas: {
        puerto: 'Port',
        protocolo: 'Protocole',
        proceso: 'Processus',
        pid: 'PID',
        direcciones: 'Adresses',
        acciones: 'Actions',
      },
      propio: 'WolfCore Dev',
      sistema: 'Système',
      finalizar: 'Terminer',
      noFinalizable: 'Les processus du système et ceux de WolfCore Dev ne se terminent pas d’ici.',
      confirmarTitulo: 'Terminer le processus',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) sera fermé sans enregistrement. Pour confirmer, saisissez le nom du processus :`,
      finalizado: (nombre: string) => `${nombre} a été terminé.`,
      vacio: 'Aucun port utilisé, ou ils n’ont pas pu être lus.',
    },
    bom: {
      explicacion:
        'On commence par afficher quels fichiers ont un BOM ; au nettoyage, une copie .bak-bom de chacun est enregistrée. node_modules, vendor, .git et les binaires sont ignorés.',
      elegirArchivos: 'Choisir des fichiers',
      elegirCarpeta: 'Choisir un dossier',
      seleccion: (n: number) => `${n} ${n === 1 ? 'chemin choisi' : 'chemins choisis'}`,
      analizar: 'Analyser',
      limpiar: 'Retirer le BOM',
      confirmar: (n: number) =>
        `Le BOM de ${n} ${n === 1 ? 'fichier' : 'fichiers'} sera retiré (avec copie). Continuer ?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'fichier avec BOM' : 'fichiers avec BOM'}`,
      sinBom: 'Aucun fichier n’a de BOM.',
      limpiados: (n: number) => `${n} ${n === 1 ? 'fichier nettoyé' : 'fichiers nettoyés'}.`,
      copia: 'Copie',
    },
    certificados: {
      explicacion:
        'Signe un certificat avec la CA locale de WolfCore Dev. Le .crt est enregistré où vous voulez et la clé (.key) à côté ; la clé ne passe jamais par l’interface.',
      dominios: 'Noms ou IP (séparés par un espace, une virgule ou un saut de ligne)',
      ejemplo: 'monapp.test, *.monapp.test, 127.0.0.1',
      emitir: 'Émettre et enregistrer',
      guardado: 'Certificat enregistré',
      certificado: 'Certificat',
      clave: 'Clé',
    },
    cripto: {
      texto: 'Texte',
      hash: 'Hash',
      calcular: 'Calculer',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Coût de bcrypt',
      bcryptTrunca: 'bcrypt n’utilise que les 72 premiers octets du texte.',
      bcryptVerificar: 'Hash bcrypt à vérifier',
      verificar: 'Vérifier',
      coincide: 'Le texte correspond au hash.',
      noCoincide: 'Le texte ne correspond pas au hash.',
      base64: 'Base64',
      base64Url: 'Variante URL',
      codificar: 'Encoder',
      decodificar: 'Décoder',
      url: 'Encoder l’URL',
      decodificarUrl: 'Décoder l’URL',
      codificarBase64: 'Encoder en base64',
      decodificarBase64: 'Décoder le base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID et mots de passe',
      uuid: 'UUID v4',
      generar: 'Générer',
      generarDiez: 'Générer 10',
      contrasena: 'Mot de passe aléatoire',
      longitud: 'Longueur',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Symboles',
      jwt: 'Décoder un JWT',
      jwtToken: 'Jeton',
      cabecera: 'En-tête',
      carga: 'Contenu (payload)',
      firmaNoVerificada:
        'Signature non vérifiée : le contenu est affiché tel quel et peut avoir été modifié.',
      vencido: 'Le jeton a expiré (exp).',
      vigente: 'Le jeton n’a pas expiré (exp).',
      salida: 'Résultat',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Aperçu',
      ejemplo:
        '# Titre\n\nTexte en **gras**, en _italique_ et un [lien](https://example.com).\n\n- Un\n- Deux\n\n```\ncode\n```\n',
      seguro:
        'Le HTML brut est affiché comme du texte, les liens dangereux sont écartés et les images ne sont pas chargées.',
      imagenOmitida: (alt: string) => `[image${alt ? ` : ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Version de WolfCore Dev',
      navegador: 'Moteur de l’interface',
      plataforma: 'Plateforme',
      idioma: 'Langue',
      zona: 'Fuseau horaire',
      nucleos: 'Cœurs logiques',
      actualizar: 'Actualiser',
      path: 'PATH',
      pathVacio: 'Le PATH est vide.',
      herramientas: 'Outils de WolfCore Dev',
      noInstalada: 'Non installé',
      sinRespuesta: 'N’a pas répondu à temps',
      variables: 'Variables d’environnement',
      filtro: 'Filtrer les variables',
      enmascarada: 'Valeur masquée : le nom ressemble à celui d’un secret.',
    },
    busqueda: {
      explicacion:
        'Cherche dans les noms et le contenu, sans suivre les liens ni lire les binaires. node_modules, vendor et .git sont ignorés par défaut.',
      origen: 'Où chercher',
      proyecto: 'Projet',
      elegirCarpeta: 'Choisir un dossier',
      elegirArchivo: 'Choisir un fichier',
      sinOrigen: 'Choisissez un projet, un dossier ou un fichier.',
      consulta: 'Texte à chercher',
      modoNombre: 'Noms',
      modoContenido: 'Contenu',
      modoAmbos: 'Les deux',
      regex: 'Expression régulière',
      mayusculas: 'Respecter la casse',
      incluir: 'Fichiers seulement (séparés par des virgules, ex. *.php)',
      excluir: 'Ignorer aussi (séparés par des virgules)',
      buscar: 'Chercher',
      cancelar: 'Annuler',
      buscando: 'Recherche…',
      sinResultados: 'Aucune correspondance.',
      truncado: 'Il y a plus de résultats que ceux affichés : affinez la recherche.',
      cancelada: 'Recherche annulée.',
      abrir: 'Ouvrir dans l’éditeur',
      incluirPesadas: 'Inclure les dossiers lourds (node_modules, vendor, .git…)',
      contexto: 'Lignes de contexte',
      grupoNombres: (n: number) => `Par nom (${n})`,
      grupoContenido: (n: number) => `Par contenu (${n})`,
      carpeta: 'dossier',
      listaAria: 'Résultats de la recherche',
      atajos:
        '↑ ↓ pour vous déplacer, Entrée pour ouvrir dans l’éditeur, Échap pour annuler ou revenir au texte.',
      sensible: (n: number) =>
        `Fichier sensible : correspondance à la ligne ${n} (son contenu n’est pas affiché).`,
      mostrarMas: (n: number) => `Afficher ${n} de plus`,
      linea: (n: number) => `ligne ${n}`,
      sinGrupo: 'Aucun résultat dans ce groupe.',
      topeBytes: 'La limite de lecture est atteinte : affinez la recherche.',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'correspondance' : 'correspondances'}`,
      resumen: (archivos: number, examinados: number) =>
        `dans ${archivos} ${archivos === 1 ? 'fichier' : 'fichiers'} (${examinados} examinés)`,
    },
    compartir: {
      explicacion:
        'Publie sur internet, avec un lien temporaire, un dossier ou un fichier de cet ordinateur. C’est en lecture seule : celui qui a le lien peut consulter et télécharger, mais pas envoyer ni modifier quoi que ce soit. Le lien contient un code secret, expire à l’heure que vous choisissez et se ferme quand vous quittez WolfCore Dev. Les fichiers .env, les clés, le dossier .git et les sites avec des données réelles ne sont jamais partagés.',
      eleccion: 'Que partager',
      elegirCarpeta: 'Choisir un dossier…',
      elegirArchivo: 'Choisir un fichier…',
      elegido: 'Choisi',
      duracion: 'Arrêter le partage dans',
      duraciones: { m15: '15 minutes', h1: '1 heure', h4: '4 heures' },
      tunel: 'Tunnel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (rapide, sans compte)',
        ngrok: 'ngrok (avec votre jeton)',
      },
      ngrokSinToken:
        'ngrok a besoin de votre jeton : enregistrez-le dans les options du tunnel d’un site.',
      compartir: 'Partager…',
      sinFtp:
        'Le FTP ne se partage pas par tunnel : il circule sans chiffrement et le tunnel ne laisse passer que le HTTP.',
      vacio: {
        titulo: 'Rien n’est partagé',
        texto:
          'Choisissez un dossier ou un fichier pour obtenir un lien public temporaire. Rien n’est publié tant que vous ne l’avez pas confirmé.',
      },
      grandes:
        'Les fichiers texte ou de type inconnu de plus de 8 Mo ne sont pas partagés, car ils ne peuvent pas être vérifiés en entier ; les images, l’audio, la vidéo et les paquets (zip, 7z, gz, pdf) le sont. Ils apparaissent marqués dans la liste.',
      comprimidos:
        'Une archive compressée (.zip, .7z, .gz) est partagée telle quelle, sans regarder son contenu : si elle contient un fichier .env ou des clés, ils sont publiés.',
      confirmar: {
        titulo: 'Partager sur internet',
        pregunta: 'Publier ceci sur internet ?',
        rutaReal: 'Chemin réel (liens résolus)',
        ruta: 'Chemin exact',
        aviso: (dur: string) =>
          `Ce sera public sur internet pendant ${dur} à partir du moment où le lien sera prêt. Toute personne ayant le lien pourra consulter et télécharger ce qui est partagé.`,
        boton: 'Partager sur internet',
      },
      abriendo: 'Ouverture du tunnel…',
      activa: 'Partage en cours',
      enlace: 'Lien public',
      copiar: 'Copier le lien',
      qr: 'Code QR du lien',
      vence: (hasta: string, restan: string) => `Expire à ${hasta} (${restan})`,
      restan: (min: number) => (min <= 1 ? 'moins d’une minute' : `${min} min`),
      dejar: 'Arrêter le partage',
      fin: {
        vencio: 'Le temps est écoulé : le serveur et le tunnel ont été fermés.',
        tunel: 'Le tunnel s’est fermé et le partage a pris fin.',
      },
      registro: {
        titulo: 'Accès',
        ayuda:
          'Les 200 derniers, en mémoire seulement. Ils n’affichent jamais le code secret du lien.',
        vacioTitulo: 'Aucun accès pour l’instant',
        vacioTexto: 'Chaque fois que quelqu’un ouvrira le lien, il apparaîtra ici.',
        col: { hora: 'Heure', ip: 'IP', ruta: 'Chemin', codigo: 'Code' },
        sinPermiso: '(sans le bon code)',
      },
    },
    usoDisco: {
      explicacion:
        'Montre ce qui occupe de la place sur un lecteur ou dans un dossier. Il ne lit que les noms et les tailles (jamais le contenu), ne suit ni les liens ni les jonctions et travaille dans un processus séparé. Il ne supprime, ne déplace et ne modifie rien.',
      unidades: 'Lecteurs',
      unidad: (ruta: string, etiqueta: string) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre: string, total: string) => `${libre} libres sur ${total}`,
      sinUnidades: 'La liste des lecteurs n’a pas pu être lue. Vous pouvez choisir un dossier.',
      elegirCarpeta: 'Choisir un dossier…',
      analizando: 'Analyse en cours…',
      leyendo: 'Lecture',
      progreso: (archivos: string, carpetas: string, bytes: string) =>
        `${archivos} fichiers · ${carpetas} dossiers · ${bytes}`,
      cancelar: 'Annuler',
      cancelado: 'Analyse annulée.',
      resumen: (total: string, archivos: string, carpetas: string) =>
        `${total} dans ${archivos} fichiers et ${carpetas} dossiers`,
      duracion: (segundos: string) => `Durée : ${segundos} s.`,
      vistas: {
        arbol: 'Arborescence',
        carpetas: 'Dossiers',
        archivos: 'Fichiers',
        extensiones: 'Extensions',
      },
      arbolAyuda:
        'Trié par taille. Seuls les dossiers et fichiers qui pèsent au moins 0,5 % du total sont affichés ; le reste est résumé dans « Autres ».',
      carpetasAyuda:
        'Les 50 dossiers au plus gros poids propre : ce que pèsent les fichiers qu’ils contiennent directement, sans compter leurs sous-dossiers.',
      archivosAyuda: 'Les 50 plus gros fichiers.',
      extensionesAyuda:
        'Les 20 extensions qui occupent le plus ; le reste va dans « Autres extensions ».',
      col: {
        nombre: 'Nom',
        tamano: 'Taille',
        porcentaje: 'Du total',
        archivos: 'Fichiers',
        ruta: 'Chemin',
        extension: 'Extension',
      },
      otros: (n: string) => `Autres (${n} petits fichiers)`,
      sinExtension: '(sans extension)',
      otrasExtensiones: 'Autres extensions',
      expandir: (nombre: string) => `Développer ${nombre}`,
      contraer: (nombre: string) => `Réduire ${nombre}`,
      abrir: 'Ouvrir dans l’Explorateur',
      copiar: 'Copier le chemin',
      denegada: 'Lecture impossible',
      avisos: {
        enlaces: (n: number) =>
          `${n} ${n === 1 ? 'lien ou jonction n’a pas été suivi' : 'liens ou jonctions n’ont pas été suivis'} et ${n === 1 ? 'compte' : 'comptent'} pour 0.`,
        denegados: (n: number) =>
          `${n} ${n === 1 ? 'élément n’a pas pu être lu' : 'éléments n’ont pas pu être lus'} (sans autorisation, ou modifiés pendant l’analyse). Sans droits d’administrateur, certains dossiers système ne sont pas lus : cet outil ne les demande pas.`,
        enlacesDuros: (n: number) =>
          `${n} ${n === 1 ? 'nom supplémentaire' : 'noms supplémentaires'} de fichiers à liens physiques n’ont pas été comptés deux fois.`,
        enlacesDurosIncompleto:
          'Il y avait tant de liens physiques que le registre est plein : le total peut compter un fichier deux fois.',
        truncado: 'La profondeur maximale a été atteinte : certains dossiers ne sont pas comptés.',
        tamanoLogico:
          'Les tailles sont logiques (ce que déclare chaque fichier), pas l’espace occupé sur le disque : les fichiers OneDrive en ligne seulement, compressés ou fragmentés peuvent différer.',
        verEnlaces: 'Voir les liens qui n’ont pas été suivis',
      },
      limpieza: {
        titulo: 'Libérer de l’espace',
        texto:
          'Cet outil ne fait que mesurer. Pour supprimer les fichiers temporaires et les caches régénérables, ou les versions de services inutilisées, utilisez ce qui existe déjà :',
        temporales: 'Nettoyage du disque',
        versiones: 'Versions inutilisées (Services)',
      },
      vacio: {
        titulo: 'Aucune analyse pour l’instant',
        texto:
          'Choisissez un lecteur ou un dossier pour voir ce qui occupe de la place. Rien n’est modifié.',
      },
      sinContenido: {
        titulo: 'Rien à compter',
        texto: 'Ce dossier ne contient aucun fichier lisible.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Compare deux dossiers sans rien modifier dedans : ce qui n’est que dans l’un, ce qui n’est que dans l’autre et ce qui diffère. Il ne suit pas les liens et travaille dans un processus séparé.',
      carpetaA: 'Dossier A',
      carpetaB: 'Dossier B',
      elegir: 'Choisir un dossier',
      sinElegir: 'Non choisi',
      comparar: 'Comparer',
      comparando: 'Comparaison en cours…',
      cancelar: 'Annuler',
      cancelada: 'Comparaison annulée.',
      iguales: 'Les deux dossiers sont identiques.',
      grupoSoloA: 'Seulement dans A',
      grupoSoloB: 'Seulement dans B',
      grupoDistintos: 'Différents',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'Aucun',
      resumen: (a: number, b: number, iguales: number) =>
        `A : ${a} fichiers · B : ${b} fichiers · ${iguales} identiques`,
      truncado:
        'Une limite a été atteinte (fichiers, profondeur ou taille) : la liste n’est pas complète.',
      recortado: (mostrados: number, total: number) =>
        `Il y a plus de fichiers que ceux affichés (${mostrados} sur ${total}).`,
      sinComparar: (n: number) =>
        `${n} gros fichiers de même taille n’ont pas été comparés par leur contenu.`,
      omitidos: (n: number) => `${n} liens, jonctions ou éléments spéciaux ont été ignorés.`,
      motivoTamano: 'taille différente',
      motivoContenido: 'même taille, contenu différent',
      tamano: (a: string, b: string) => `A : ${a} · B : ${b}`,
      elegirArchivo: 'Choisissez un fichier « différent » dans la liste pour voir sa différence.',
      soloEnUno: (lado: string) => `Ce fichier n’existe que dans ${lado}.`,
      cargando: 'Lecture des fichiers…',
      binario:
        'Les fichiers sont différents, mais ce ne sont pas des textes : la différence n’est pas affichée.',
      sensible:
        'Fichier sensible (.env, clés ou données réelles) : il est différent, mais son contenu n’est pas affiché. Vous pouvez l’ouvrir dans l’éditeur, qui demande une confirmation renforcée.',
      tope: (kb: number) =>
        `Les fichiers sont différents, mais dépassent ${kb} Ko : la différence de texte n’est pas affichée.`,
      demasiadoDistinto:
        'Les fichiers sont si différents que la comparaison ligne à ligne n’est pas affichée.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'sauts de ligne mélangés',
        ninguno: 'aucun saut de ligne',
      },
      saltosDistintos: (a: string, b: string) =>
        `Sauts de ligne : A utilise ${a} et B utilise ${b}.`,
      soloSaltos:
        'Le texte des lignes est le même : seuls les sauts de ligne (y compris celui de la fin du fichier) ou le BOM changent.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${agregadas} lignes ajoutées, ${quitadas} supprimées`,
      truncadoArchivo: 'Seules les premières lignes sont affichées.',
      lineasIguales: (n: number) => `… ${n} lignes identiques …`,
      abrirA: 'Ouvrir A dans l’éditeur',
      abrirB: 'Ouvrir B dans l’éditeur',
      atajos: '↑ ↓ pour vous déplacer, Entrée pour voir la différence, Échap pour annuler.',
      listaAria: (grupo: string) => `Fichiers : ${grupo}`,
      detalleAria: 'Différences du fichier',
    },
    infoArchivo: {
      elegir: 'Choisir un fichier',
      ayuda: 'Il est lu sur l’ordinateur pour calculer les hashes (200 Mo maximum).',
      nombre: 'Nom',
      tamano: 'Taille',
      tipo: 'Type',
      modificado: 'Modifié',
      sinTipo: 'Inconnu',
      grande: 'Le fichier dépasse 200 Mo : les données sont affichées sans les hashes.',
      calculando: 'Calcul des hashes…',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Sections du client HTTP',
        peticion: 'Requête',
        coleccion: 'Collection',
        historial: 'Historique',
        entornos: 'Environnements',
      },
      entorno: 'Environnement',
      sinEntorno: 'Aucun environnement',
      metodo: 'Méthode',
      url: 'URL',
      urlPlaceholder: 'https://api.exemple.test/chemin ou {{base}}/chemin',
      enviar: 'Envoyer',
      enviarAtajo: 'Envoyer (Ctrl+Entrée)',
      cancelar: 'Annuler',
      nueva: 'Nouvelle',
      guardar: 'Enregistrer dans la collection',
      nombre: 'Nom',
      nombrePlaceholder: 'Nom de la requête',
      guardada: 'Requête enregistrée',
      ayudaVariables: 'Utilisez {{variable}} pour prendre des valeurs de l’environnement choisi.',
      secciones: {
        params: 'Paramètres',
        cabeceras: 'En-têtes',
        cuerpo: 'Corps',
        auth: 'Authentification',
        opciones: 'Options',
      },
      par: {
        clave: 'Nom',
        valor: 'Valeur',
        agregar: 'Ajouter une ligne',
        quitar: 'Retirer la ligne',
        activa: 'Ligne active',
        falta: 'Le secret est manquant : saisissez-le pour pouvoir envoyer.',
      },
      cuerpo: {
        tipo: 'Type de corps',
        ninguno: 'Aucun',
        json: 'JSON',
        form: 'Formulaire (urlencoded)',
        multipart: 'Multipart (texte seulement)',
        raw: 'Texte brut',
        tipoContenido: 'Content-Type',
        texto: 'Contenu',
        multipartAyuda: 'Champs de texte uniquement : aucun fichier du disque n’est envoyé.',
      },
      auth: {
        tipo: 'Type',
        ninguna: 'Aucune',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API key',
        token: 'Jeton',
        usuario: 'Utilisateur',
        clave: 'Mot de passe',
        nombre: 'Nom de l’en-tête ou du paramètre',
        en: 'Envoyer dans',
        cabecera: 'En-tête',
        query: 'Chaîne de requête (query)',
        ayuda:
          'La valeur est conservée chiffrée par le système ; la collection, l’historique et les environnements ne gardent qu’une référence.',
      },
      secreto: {
        guardado: 'Enregistré (chiffré). Saisissez pour le remplacer.',
        mostrar: 'Afficher',
        ocultar: 'Masquer',
        quitar: 'Retirer',
        valor: 'Valeur enregistrée',
        porNombre: 'Elle sera conservée chiffrée, car le nom ressemble à un secret.',
      },
      opciones: {
        plazo: 'Délai (secondes)',
        plazoAyuda: 'De 1 à 120 secondes.',
        ignorarCert: 'Ignorer les erreurs de certificat pour cette requête',
        ignorarAviso:
          'Dangereux : la connexion n’est plus vérifiée. Cela ne vaut que pour cette requête et son hôte. Les sites .test de WolfCore sont déjà vérifiés avec leur propre CA.',
        limites:
          'Réponse de 10 Mo au plus et 10 redirections au maximum. Aucun cookie conservé et aucun proxy système.',
      },
      respuesta: {
        enviando: 'Envoi en cours…',
        estado: 'Statut',
        tiempo: 'Durée',
        tamano: 'Taille',
        cuerpo: 'Corps',
        cabeceras: 'En-têtes',
        redirecciones: 'Redirections',
        vacioTitulo: 'Pas encore de réponse',
        vacioTexto: 'Saisissez une URL et cliquez sur Envoyer. La requête part de WolfCore Dev.',
        binario: (bytes: number, tipo: string) =>
          `Binaire de ${bytes} octets, type ${tipo || 'inconnu'}.`,
        sinCuerpo: 'La réponse n’a pas de corps.',
        truncada: 'La réponse a dépassé 10 Mo : elle a été coupée et est incomplète.',
        parcial: (mostrados: number) => `Affichage des ${mostrados} premiers caractères.`,
        sinRedirecciones: 'Il n’y a eu aucune redirection.',
        salto: (n: number) => `Saut ${n}`,
        urlFinal: 'URL finale',
        certIgnorado: 'Les erreurs de certificat ont été ignorées pour cette requête.',
        caWolf: 'Vérifié avec la CA de WolfCore Dev.',
        copiar: 'Copier le corps',
        copiado: 'Corps copié',
        formato: 'JSON formaté',
        crudo: 'Texte d’origine',
      },
      curl: {
        copiar: 'Copier comme curl',
        incluir: 'Inclure les identifiants',
        incluirAyuda:
          'Décoché, les valeurs secrètes sortent sous la forme <secreto>. Coché, la commande contient les vrais identifiants.',
        copiado: 'Commande curl copiée',
        importar: 'Importer un curl',
        importarTitulo: 'Importer une commande curl',
        importarAyuda:
          'Collez une commande curl. Elle est lue comme du simple texte : rien n’est exécuté. Les identifiants vont dans le stockage chiffré.',
        importarPlaceholder:
          "curl -X POST https://api.exemple.test/chemin -H 'Accept: application/json'",
        importarBoton: 'Importer',
        importada: 'Requête importée dans la collection',
        avisos: {
          opcion_ignorada: (d: string) => `Option ignorée : ${d}`,
          archivo_ignorado: (d: string) => `Les fichiers du disque ne sont pas lus : ${d}`,
          inseguro_ignorado:
            '-k/--insecure a été ignoré. Si vous en avez besoin, activez à la main « Ignorer les erreurs de certificat ».',
          comando_cortado: 'Ce qui suit un opérateur du shell (|, ;, &, >) a été ignoré.',
          sin_evaluar:
            'Le texte contenait $(…), des apostrophes inverses ou des variables du shell : ils ne sont pas évalués et restent du texte.',
          url_sin_esquema: 'L’URL n’avait pas de schéma : http:// a été utilisé.',
          varias_urls: (d: string) => `Un argument supplémentaire a été ignoré : ${d}`,
          cabecera_invalida: (d: string) => `Un en-tête non valide a été ignoré : ${d}`,
          secretos_guardados:
            'Les identifiants importés ont été conservés chiffrés ; la collection n’en garde que la référence.',
        },
      },
      coleccion: {
        vacioTitulo: 'La collection est vide',
        vacioTexto:
          'Enregistrez une requête ou importez une commande curl pour l’avoir sous la main.',
        abrir: 'Ouvrir',
        borrar: 'Supprimer',
        borrada: 'Requête supprimée',
      },
      historial: {
        vacioTitulo: 'Aucun historique',
        vacioTexto:
          'Les 100 dernières requêtes restent ici, sans identifiants : les en-têtes sensibles apparaissent sous la forme ***.',
        abrir: 'Ouvrir',
        limpiar: 'Vider l’historique',
        sinRespuesta: 'Sans réponse',
      },
      entornos: {
        vacioTitulo: 'Aucun environnement',
        vacioTexto:
          'Un environnement définit des variables comme {{base}} ou {{token}}. Celles marquées comme secrètes sont conservées chiffrées.',
        nuevo: 'Nouvel environnement',
        nombre: 'Nom de l’environnement',
        variable: 'Variable',
        valor: 'Valeur',
        secreta: 'Secrète',
        agregar: 'Ajouter une variable',
        quitar: 'Retirer la variable',
        guardar: 'Enregistrer l’environnement',
        guardado: 'Environnement enregistré',
        borrar: 'Supprimer l’environnement',
        borrado: 'Environnement supprimé',
        usar: 'Utiliser cet environnement',
        activo: 'Actif',
        sinNombre: 'Saisissez un nom pour l’environnement.',
      },
    },
    websocket: {
      url: 'URL (ws:// ou wss://)',
      conectar: 'Se connecter',
      desconectar: 'Se déconnecter',
      mensaje: 'Message',
      enviar: 'Envoyer',
      urlInvalida: 'Saisissez une URL commençant par ws:// ou wss://.',
      conectando: 'Connexion…',
      conectado: 'Connecté',
      desconectado: 'Déconnecté',
      error: 'Erreur de connexion',
      cerrado: (codigo: number, motivo: string) =>
        `Fermé (${codigo}${motivo ? ` : ${motivo}` : ''})`,
      enviado: 'Envoyé',
      recibido: 'Reçu',
      binario: (n: number) => `[binaire, ${n} octets]`,
      vacio: 'Pas encore de messages.',
      tope: 'Les 500 derniers messages sont conservés ; chacun est affiché jusqu’à 10 Ko.',
    },
    qrWifi: {
      ssid: 'Nom du réseau (SSID)',
      clave: 'Mot de passe',
      seguridad: 'Sécurité',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Sans mot de passe',
      oculta: 'Réseau masqué',
      mostrar: 'Afficher',
      ocultar: 'Masquer',
      aviso:
        'Le code QR contient le mot de passe tel quel : quiconque le voit ou le photographie peut se connecter à votre réseau. Il est généré ici, jamais enregistré, et effacé à la fermeture de ce panneau.',
      avisoPng:
        'Le PNG téléchargé contient lui aussi le mot de passe dans le code : gardez-le là où vous seul le voyez.',
      escribala:
        'C’est vous qui saisissez le mot de passe : WolfCore Dev ne lit jamais les mots de passe Wi-Fi enregistrés dans le système.',
      errorSsid: 'Saisissez le nom du réseau (32 caractères au maximum).',
      errorClave: 'Saisissez le mot de passe.',
      errorClaveWpa: 'Un mot de passe WPA compte entre 8 et 63 caractères.',
      vacio: 'Remplissez les champs pour voir le code.',
      alt: 'Code QR pour se connecter au réseau Wi-Fi',
      descargar: 'Télécharger le PNG',
      descargado: 'QR enregistré',
      largo: 'Les données sont trop longues pour un code QR.',
    },
    imagenes: {
      elegir: 'Choisir une image',
      ayuda:
        'Traitée sur cet ordinateur (jusqu’à 30 Mo et 12000 px par côté). L’original n’est pas modifié : le résultat est un nouveau fichier.',
      original: 'Original',
      accion: 'Que faire',
      aIco: 'Convertir en ICO',
      aPng: 'Convertir en PNG',
      comprimir: 'Compresser',
      tamanos: 'Tailles de l’ICO',
      formato: 'Format',
      calidad: 'Qualité',
      ladoMax: 'Côté maximal en px (vide = l’original)',
      procesar: 'Traiter',
      procesando: 'Traitement…',
      guardar: 'Enregistrer sous…',
      antes: 'Avant',
      despues: 'Après',
      sinMejora:
        'Le résultat n’est pas plus léger que l’original : essayez une autre qualité ou un autre format.',
      errorAbrir: 'Impossible d’ouvrir l’image sur cet ordinateur.',
      errorProcesar: 'Impossible de traiter l’image.',
      sufijoConvertida: '-convertie',
      sufijoComprimida: '-compressee',
      nombreCaptura: 'capture-d-ecran',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % de moins`
          : porcentaje < 0
            ? `${-porcentaje} % de plus`
            : 'sans changement',
      guardado: (archivo: string) => `Enregistré dans ${archivo}`,
    },
    comprimir: {
      zip: 'Compresser en ZIP',
      zipAyuda:
        'Choisissez des fichiers ou des dossiers. Les liens ne sont pas suivis et le ZIP est un nouveau fichier : un fichier existant n’est jamais écrasé.',
      agregarArchivos: 'Ajouter des fichiers',
      agregarCarpeta: 'Ajouter un dossier',
      quitar: 'Retirer',
      vacio: 'Rien n’est encore choisi.',
      crearZip: 'Créer le ZIP…',
      creando: 'Création…',
      pdf: 'Optimiser un PDF',
      pdfAyuda:
        'Il est réenregistré avec des flux d’objets, dans un thread séparé. Le fichier n’est créé que s’il est plus léger ; les PDF protégés par mot de passe ne sont pas ouverts. L’original n’est pas touché. Attention : le réenregistrement fait perdre les signatures numériques et la conformité PDF/A.',
      elegirPdf: 'Choisir un PDF',
      optimizar: 'Optimiser…',
      optimizando: 'Optimisation…',
      antes: 'Avant',
      despues: 'Après',
      sinMejora: 'Le PDF ne serait pas plus léger : aucun fichier n’a été créé.',
      sufijoOptimizado: '-optimise',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'lien, dossier illisible ou fichier spécial n’a pas été inclus' : 'liens, dossiers illisibles ou fichiers spéciaux n’ont pas été inclus'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'fichier' : 'fichiers'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % de moins`
          : porcentaje < 0
            ? `${-porcentaje} % de plus`
            : 'sans changement',
      guardado: (archivo: string) => `Enregistré dans ${archivo}`,
    },
    conversor: {
      ayuda:
        'La conversion se fait sur cet ordinateur : le document n’est envoyé nulle part. L’original n’est pas modifié ; le résultat est un nouveau fichier et un fichier existant n’est jamais écrasé.',
      elegir: 'Choisir un document',
      tipoNoSoportado:
        'Aucune conversion n’existe pour ce type de fichier. Sont pris en charge : docx, xlsx, csv, md, html et pdf (et odt, pptx et doc avec LibreOffice).',
      convertirA: 'Convertir en',
      convertir: 'Convertir…',
      convirtiendo: 'Conversion…',
      avisoLibreOffice:
        'Cette conversion utilise LibreOffice, déjà installé sur cet ordinateur. WolfCore Dev ne l’installe ni ne le télécharge : il l’ouvre sans fenêtre et avec un profil temporaire.',
      sinLibreOffice:
        'Si vous installez LibreOffice, vous pourrez aussi convertir odt, pptx et doc (WolfCore Dev ne l’installe pas).',
      limites:
        'Des limites de sécurité s’appliquent : jusqu’à 50 Mo (10 Mo pour md et html), 120 s, 200 000 lignes, 1000 colonnes et 5 millions de cellules ; les fichiers qui ressemblent à une bombe ZIP ou contiennent des entités XML sont refusés.',
      guardado: (archivo: string) => `Enregistré dans ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Robustesse',
      pestanaAuditar: 'Auditer une base',
      fortaleza: {
        etiqueta: 'Mot de passe à mesurer',
        marcador: 'Saisissez un mot de passe',
        privacidad: "Mesuré ici même : rien ne quitte votre ordinateur et rien n'est enregistré.",
        mostrar: 'Afficher',
        ocultar: 'Masquer',
        niveles: ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'],
        sinAvisos: 'Aucune remarque.',
        estimacion: "C'est une estimation, pas une garantie.",
        avisos: {
          straightRow: 'Une rangée de touches consécutives est facile à deviner.',
          keyPattern: 'Les motifs de clavier courts sont faciles à deviner.',
          simpleRepeat: "Répéter un caractère ou un groupe n'apporte presque rien.",
          extendedRepeat: 'Les groupes répétés sont faciles à deviner.',
          sequences: 'Les suites comme abc ou 6543 sont faciles à deviner.',
          recentYears: 'Évitez les années récentes et les dates liées à vous.',
          dates: 'Évitez les dates : elles sont faciles à deviner.',
          topTen: 'Il fait partie des dix mots de passe les plus utilisés.',
          topHundred: 'Il fait partie des cent mots de passe les plus utilisés.',
          common: 'Ce mot de passe est très courant.',
          similarToCommon: 'Il ressemble à un mot de passe très courant.',
          wordByItself: 'Un mot seul est facile à deviner.',
          namesByThemselves: 'Un prénom ou un nom seul est facile à deviner.',
          commonNames: 'Les prénoms et noms courants sont faciles à deviner.',
          userInputs: "N'utilisez pas des informations que d'autres connaissent sur vous.",
          l33t: 'Remplacer des lettres par des symboles prévisibles (@ pour a) aide peu.',
          reverseWords: "Écrire les mots à l'envers aide peu.",
          allUppercase: 'Tout mettre en majuscules aide peu.',
          capitalization: 'Mettre la première lettre en majuscule aide peu.',
          associatedYears: 'Évitez les années associées à vous.',
          repeated: 'Évitez les mots et caractères répétés.',
          longerKeyboardPattern: 'Utilisez un motif de clavier plus long et changez de direction.',
          anotherWord: 'Ajoutez un ou deux mots ; les moins courants aident.',
          useWords: 'Plusieurs mots au hasard font un bon mot de passe.',
          noNeed:
            "On peut être en sécurité sans symboles ni chiffres : c'est la longueur qui compte.",
        },
      },
      auditar: {
        limite:
          "Cela ne détecte que les mots de passe très courants : chaque hash est comparé à une courte liste d'environ 200. Ce n'est ni une attaque ni un test par force brute. Un compte non signalé n'a pas forcément un bon mot de passe.",
        privacidad:
          "Le mot de passe qui correspond n'est jamais affiché, et la lecture se fait avec un utilisateur temporaire en lecture seule (sur PostgreSQL, avec la session en lecture seule). À utiliser uniquement sur vos propres bases.",
        motor: 'Moteur',
        base: 'Base de données',
        tabla: 'Table',
        columnaUsuario: "Colonne de l'utilisateur",
        columnaHash: 'Colonne du hash',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Démarrez le serveur depuis Bases de données pour examiner ses bases.',
        sinBases: "Il n'y a aucune base sur ce serveur.",
        sinMotores: "Il n'y a pas de serveur MySQL, MariaDB ou PostgreSQL propre.",
        revisar: 'Examiner',
        revisando: 'Examen en cours…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'compte examiné' : 'comptes examinés'} · ${d} ${d === 1 ? 'faible' : 'faibles'}`,
        sinDebiles: 'Aucun compte examiné ne correspond à un mot de passe très courant.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? "compte n'a pas pu être examiné" : "comptes n'ont pas pu être examinés"} :`,
        truncado:
          "L'examen s'est arrêté à la limite de 10 000 lignes ou de 60 secondes : des comptes n'ont pas été examinés.",
        usuario: 'Utilisateur',
        motivo: 'Motif',
        accion: 'Action',
        motivos: {
          comun: 'Mot de passe très courant',
          formato_debil: 'Format faible (md5 ou sha1 sans sel)',
        },
        restablecer: 'Réinitialiser',
        mas: (n: number) => `et ${n} de plus (les 200 premiers sont affichés)`,
        esquema: 'Schéma (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Annuler',
        cancelando: 'Annulation…',
        cancelada: 'Audit annulé.',
        progreso: (a: number, b: number) => `${a} sur ${b} examinés`,
        tiposNoRevisables: {
          vacio: 'hash vide',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (indisponible sur cet ordinateur ou paramètres au-delà de la limite)',
          bcrypt_otro: 'bcrypt avec un coût hors limites ou variante $2x$',
          pbkdf2_otro: 'PBKDF2 avec des paramètres au-delà de la limite',
          ldap: 'format LDAP ({SHA}…)',
          otro: 'format inconnu',
        },
        rlsActiva:
          "La table a la sécurité au niveau des lignes (RLS) : l'audit ne voit que les lignes que la politique autorise au rôle limité, il peut donc manquer des comptes.",
        falsoPositivo:
          "Une valeur de 32 ou 40 caractères hexadécimaux est prise pour du md5 ou du sha1, mais ce peut être autre chose (un jeton, par exemple). Si la colonne ne stocke pas de mots de passe, le résultat n'a aucune valeur.",
      },
      restablecer: {
        titulo: (u: string) => `Réinitialiser le mot de passe de ${u}`,
        ayuda:
          'Un mot de passe ne se récupère pas : on en définit un nouveau. Avant, un instantané de la base est pris et une copie de la ligne est enregistrée.',
        cargando: "Préparation de l'aperçu…",
        sentencia: "Sera exécuté (les valeurs sont envoyées à part et ne s'affichent pas)",
        formatoActual: (f: string) => `Format actuel : ${f}`,
        cambiaFormato:
          "Le compte passera à bcrypt : l'application doit pouvoir le vérifier (par exemple avec password_verify) ; sinon personne ne pourra se connecter avec ce compte.",
        nueva: 'Nouveau mot de passe',
        generar: 'En générer un',
        mostrar: 'Afficher',
        ocultar: 'Masquer',
        anotar: "Notez-le maintenant : il n'est plus affiché ni enregistré.",
        escribaUsuario: (u: string) => `Pour confirmer, saisissez l'utilisateur : ${u}`,
        confirmar: 'Réinitialiser le mot de passe',
        cancelar: 'Annuler',
        cerrar: 'Fermer',
        hecho: 'Mot de passe réinitialisé.',
        copiaFila: 'Copie de la ligne (identification et ancien hash, conservée 30 jours) :',
        instantanea: 'Instantané de la base pris avant :',
        instantaneaAyuda: 'Vous pouvez y revenir depuis Bases de données › Instantanés.',
        aBcrypt:
          "Passer à bcrypt : seulement si l'application utilise password_verify ou équivalent",
        avisoLegado:
          "Ce hash est du md5 ou du sha1 sans sel et garde ce format. Si l'application stocke le sel à part (dans une autre colonne ou une constante), le hash ne peut pas être reproduit et le nouveau mot de passe ne permettrait pas de se connecter.",
        datosReales: {
          titulo: 'Base avec données réelles',
          texto:
            'Cette base appartient à un site marqué avec des données réelles de clients : réinitialiser un mot de passe modifie un vrai compte.',
          casilla:
            'Je comprends que ce sont des données réelles et je veux réinitialiser ce mot de passe',
        },
        rlsActiva:
          'La table a la sécurité au niveau des lignes (RLS) : si la politique masque ce compte au rôle limité, il ne pourra pas être réinitialisé.',
        copiaSinRestringir:
          "Impossible de limiter cette copie à l'utilisateur de cet ordinateur : vérifiez les droits du dossier.",
      },
    },
  },
  doctor: {
    descripcion:
      'Vérifie les ports, les certificats, le fichier hosts, le PATH, Visual C++, l’antivirus et les services, et propose comment les réparer.',
    revisarAhora: 'Vérifier maintenant',
    revisando: 'Vérification…',
    sinRevision: 'Aucune vérification pour l’instant. Cliquez sur « Vérifier maintenant ».',
    sinHallazgos: 'Tout est en ordre : aucun problème trouvé.',
    gravedades: { error: 'Erreurs', aviso: 'Avertissements', info: 'Informations' },
    evidencia: 'Ce qui a été constaté',
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Port {puerto} : {proceso} (PID {pid})',
      puerto_dueno_exe: 'Port {puerto} : {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Plage réservée {desde}-{hasta} (comprend {puerto})',
      ca_vencida: 'La CA a expiré il y a {dias} jours',
      ca_por_vencer: 'La CA expire dans {dias} jours',
      certificado_vencido: 'Le certificat de {dominio} a expiré il y a {dias} jours',
      certificado_por_vencer: 'Le certificat de {dominio} expire dans {dias} jours',
      firefox_perfiles: 'Profils Firefox sans la confiance :',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (ouvert)',
      firefox_perfil_fuera: '{perfil} (hors du dossier de Firefox)',
      hosts_ilegible: '{ruta} : lecture impossible ({motivo})',
      hosts_codificacion: '{ruta} : encodage {codificacion}',
      hosts_bloques: '{ruta} : {bloques} blocs de WolfCore Dev',
      hosts_sin_cierre: '{ruta} : un bloc de WolfCore Dev n’a pas sa marque de fermeture',
      hosts_faltan: 'Absents du fichier hosts : {dominios}',
      hosts_solo_lectura: '{ruta} : attribut en lecture seule',
      path_repetidas: 'En double : {entradas}',
      path_delante:
        '{entrada} se trouve avant les outils de WolfCore Dev et contient aussi {programa}',
      antivirus_sin_leer:
        'L’antivirus est actif ; ses exclusions n’ont pas pu être lues (droits d’administrateur requis).',
      antivirus_sin_exclusion:
        'L’antivirus est actif et le dossier de données de WolfCore Dev n’est pas exclu.',
      enlazador_ausente: 'Les outils C++ de Visual Studio Build Tools sont introuvables.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) n’est pas installé.',
      firewall_no_comprobado:
        'Les règles du pare-feu n’ont pas pu être lues (les droits d’administrateur peuvent être requis).',
      firewall_reglas: 'WolfCore Dev : {propias} · Restes de tests de WolfCore : {pruebas}',
      firewall_acotadas: 'Règles limitées au réseau local :',
      firewall_ajenas: 'Règles d’autres programmes :',
      firewall_quitadas: 'Règles supprimées qui peuvent être restaurées :',
    },
    requiereAdmin: 'Demande l’autorisation administrateur',
    comandoManual: 'Commande pour une console administrateur (elle ne s’exécute pas toute seule) :',
    copiar: 'Copier la commande',
    copiado: 'Commande copiée.',
    reparar: 'Réparer',
    ver: 'Voir',
    verPuertos: 'Voir les ports',
    alternativa: 'Déplacer le port de WolfCore Dev',
    soloInforma: 'WolfCore Dev ne modifie pas cela de lui-même : suivez les indications.',
    dialogo: {
      titulo: 'Confirmer la réparation',
      queHara: 'Voici ce qui sera fait :',
      admin: 'Windows vous demandera l’autorisation administrateur.',
      reglas: 'Règles concernées : décochez celles que vous ne voulez pas toucher.',
      sinSeleccion: 'Cochez au moins une règle pour continuer.',
      reglasNota:
        'Rien ne change sans votre confirmation et l’autorisation administrateur. Si une règle a changé depuis son affichage, elle est ignorée.',
      puerto: (p: string | number) => `Le nouveau port sera ${p}.`,
      aplicar: 'Appliquer',
      cancelar: 'Annuler',
    },
    estados: {
      aplicando: 'Application…',
      hecha: 'Réparation appliquée.',
      fallida: 'La réparation a échoué.',
    },
    revisiones: {
      puertos: 'Ports',
      'rangos-reservados': 'Plages réservées',
      ca: 'Autorité de certification',
      certificados: 'Certificats',
      confianza: 'Confiance de la CA',
      hosts: 'Fichier hosts',
      path: 'PATH de l’utilisateur',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Éditeur de liens C++',
      antivirus: 'Antivirus',
      firewall: 'Pare-feu',
      servicios: 'Services',
    },
    reparaciones: {
      cambiar_puerto:
        'Changer le port de WolfCore Dev pour un port libre. L’autre programme n’est pas touché.',
      puerto_manual:
        'Déplacer le port de WolfCore Dev hors de la plage réservée. Libérer la plage est votre décision, avec la commande affichée.',
      detener_iis:
        'Arrêter le service IIS (W3SVC) pour libérer le port. Il n’est pas désactivé : il redémarre au redémarrage de Windows.',
      regenerar_ca:
        'Créer une nouvelle autorité de certification, lui faire confiance dans Windows (une confirmation sera demandée), réémettre les certificats et retirer l’ancienne. Une copie est d’abord enregistrée.',
      regenerar_certificados: 'Réémettre les certificats des sites et recharger Nginx.',
      hosts_reescribir:
        'Réécrire le bloc de WolfCore Dev dans le fichier hosts en UTF-8, avec une copie préalable. Les lignes étrangères ne sont pas touchées.',
      hosts_solo_lectura: 'Retirer l’attribut de lecture seule du fichier hosts.',
      path_duplicados:
        'Retirer les entrées répétées de WolfCore Dev du PATH de l’utilisateur, avec une copie de l’ancienne valeur. Les entrées étrangères ne sont pas touchées.',
      path_ajeno:
        'Un autre outil précède WolfCore Dev dans le PATH. WolfCore Dev ne le retire pas : déplacez-le si nécessaire.',
      instalar_vcredist:
        'Installer Visual C++ 2015+ x64 avec winget. L’installateur de Microsoft demande sa propre autorisation.',
      instalar_build_tools:
        'Installez Visual Studio Build Tools (avec les outils C++) avec la commande affichée : ils pèsent plusieurs Go et demandent l’autorisation d’administrateur, c’est donc à vous de décider.',
      antivirus:
        'Ajouter le dossier de données aux exclusions de l’antivirus est votre décision, avec la commande affichée.',
      firewall:
        'Supprimer ces règles entrantes du pare-feu, une par une et par leur nom exact. Une copie est d’abord enregistrée dans etc/cortafuegos-quitadas.json pour pouvoir les recréer. Les règles des autres programmes ne sont jamais touchées.',
      firewall_restaurar:
        'Recréer les règles que vous cochez, avec les mêmes programme, profil, protocole, ports et adresses que ceux affichés, à partir de la copie protégée (et non du fichier de etc/). Ces programmes pourront de nouveau recevoir des connexions du réseau.',
      reintentar_servicio: 'Redémarrer le service.',
      firefox_confianza:
        'Ajouter dans le user.js de chaque profil Firefox la préférence qui fait confiance à l’autorité de Windows, avec une copie préalable. prefs.js n’est pas touché et les profils ouverts sont ignorés.',
    },
    confianza: {
      titulo: 'Confiance de la CA',
      texto:
        'Windows fait déjà confiance à l’autorité de WolfCore Dev ; Node, Python et Firefox utilisent leur propre magasin.',
      sinCa:
        'Il n’y a pas encore d’autorité de certification. Créez-en une depuis HTTPS pour utiliser cette section.',
      node: {
        titulo: 'Node',
        proyectos:
          'Les processus de projet et le Terminal reçoivent NODE_EXTRA_CA_CERTS avec l’autorité.',
        ajena: 'Vous avez déjà votre propre NODE_EXTRA_CA_CERTS : WolfCore Dev ne la remplace pas.',
        global: 'Aussi comme variable de l’utilisateur (pour d’autres terminaux et programmes)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS sera définie comme variable de votre utilisateur. Cela affecte les programmes que vous ouvrirez ensuite ; elle est retirée en désactivant cette option.',
        confirmarDesactivar:
          'La variable NODE_EXTRA_CA_CERTS définie par WolfCore Dev sera retirée.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Les projets avec .venv reçoivent REQUESTS_CA_BUNDLE et SSL_CERT_FILE avec les racines de certifi (ou celles de Windows) plus l’autorité. Jamais l’autorité seule.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Aucun profil Firefox trouvé.',
        activo: 'Fait confiance',
        inactivo: 'Ne fait pas confiance',
        abierto: 'Ouvert',
        fuera: 'Hors du dossier de Firefox',
        avisoFuera: (lista: string) =>
          `Ces profils sont hors du dossier de Firefox et ne sont pas touchés sauf si vous le cochez : ${lista}.`,
        incluirFuera: 'Modifier aussi les profils hors du dossier de Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profil hors du dossier de Firefox n’a pas été touché', 'profils hors du dossier de Firefox n’ont pas été touchés')}.`,
        activar: 'Activer dans Firefox',
        quitar: 'Retirer de Firefox',
        confirmarActivar:
          'security.enterprise_roots.enabled sera ajoutée dans le user.js de chaque profil, entre des marques de WolfCore Dev et avec une copie préalable dans etc/respaldos. prefs.js n’est pas touché. Les profils dont Firefox est ouvert sont ignorés : fermez-le d’abord.',
        confirmarQuitar:
          'Le bloc de WolfCore Dev sera retiré du user.js de chaque profil (avec copie préalable). Vos autres préférences restent inchangées.',
        resultadoOk: (n: number) => `Terminé pour ${plural(n, 'profil', 'profils')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profil a été ignoré', 'profils ont été ignorés')} car Firefox est ouvert. Fermez-le et réessayez.`,
        resultadoError: (n: number) =>
          `${plural(n, 'profil n’a pas pu être modifié', 'profils n’ont pas pu être modifiés')}.`,
      },
      confirmar: 'Confirmer',
      cancelar: 'Annuler',
    },
  },
  php: {
    descripcion:
      'php.ini et extensions de chaque version de PHP installée. Avant d’enregistrer, le diff est affiché, le résultat est testé avec php -v et une copie datée est conservée ; si PHP ne redémarre pas, l’état précédent est restauré.',
    rama: 'Version de PHP',
    sinPhp: 'PHP n’est pas installé. Installez-le depuis Services.',
    irServicios: 'Aller à Services',
    pestanas: { ini: 'php.ini', extensiones: 'Extensions' },
    rapidosTitulo: 'Valeurs rapides',
    rapidosAyuda:
      'Elles sont appliquées au texte ci-dessous ; rien n’est enregistré avant de confirmer le diff.',
    aplicarRapidos: 'Appliquer au texte',
    sinValor: 'non défini',
    rapidos: {
      memory_limit: 'Mémoire par script (memory_limit)',
      upload_max_filesize: 'Taille maximale d’envoi (upload_max_filesize)',
      post_max_size: 'Taille maximale du POST (post_max_size)',
      max_execution_time: 'Durée maximale en secondes (max_execution_time)',
      display_errors: 'Afficher les erreurs (display_errors)',
      error_reporting: 'Niveau des erreurs (error_reporting)',
      'date.timezone': 'Fuseau horaire (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Les lignes qui commencent par ; sont des commentaires.',
    sinCambios: 'Aucune modification par rapport à ce qui est enregistré.',
    descartar: 'Abandonner les modifications',
    revisar: 'Vérifier et enregistrer',
    diffTitulo: (rama: string) => `Modifications du php.ini de PHP ${rama}`,
    diffAyuda:
      'Une copie datée sera conservée, le résultat sera testé avec php -v et, si PHP est allumé, il sera redémarré.',
    guardar: 'Enregistrer et appliquer',
    cancelar: 'Annuler',
    guardado: (respaldo: string) => `php.ini enregistré. Copie préalable : ${respaldo}`,
    respaldosTitulo: 'Copies datées',
    sinRespaldos: 'Aucune copie pour l’instant.',
    restaurar: 'Restaurer',
    confirmarRestaurar: (nombre: string) =>
      `Restaurer ${nombre} ? Le php.ini actuel est d’abord conservé comme une autre copie.`,
    restaurado: 'Copie restaurée.',
    recargar: 'Relire',
    extensiones: {
      ayuda:
        'Seules les extensions fournies par cette compilation dans ext/ peuvent être activées. Celles de tiers s’installent depuis le catalogue (variante de cette compilation et empreinte SHA-256 vérifiée).',
      activa: 'Active',
      inactiva: 'Inactive',
      falta: 'Fichier manquant',
      catalogo: 'Catalogue',
      instalar: 'Installer',
      instalada: (nombre: string) => `${nombre} installée et activée.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} activée.` : `${nombre} désactivée.`,
      buscar: 'Rechercher une extension',
      vacio: 'Aucune extension ne correspond.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI et Antigravity CLI : détectez-les ou installez-les et ouvrez-les dans un projet. Ceux qui le permettent se connectent au MCP de WolfCore Dev. Aucun ne s’ouvre tout seul.',
    recargar: 'Détecter à nouveau',
    notaMcp:
      'Le MCP enregistré n’authentifie que lorsque l’agent est ouvert depuis WolfCore Dev ("Ouvrir dans un projet") : le jeton se trouve dans la variable WOLFCORE_MCP_TOKEN de ce terminal et n’est jamais écrit dans la configuration de l’agent. Ouvert de l’extérieur, l’agent voit l’entrée « wolfcore » mais ne peut pas se connecter.',
    sitioElegido: (nombre: string) => `Choisissez un agent pour l’ouvrir dans ${nombre}.`,
    instalado: 'Installé',
    noInstalado: 'Non installé',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Version inconnue',
    verVersion: 'Voir la version',
    verVersionAyuda:
      'Exécute le programme avec --version (cela ne se fait pas tout seul à l’ouverture de l’écran).',
    origen: {
      propio: 'Installé par WolfCore Dev',
      'npm-usuario': 'npm global de l’utilisateur',
      ejecutable: 'Programme du système',
    },
    mcpRegistrado: 'MCP enregistré',
    mcpSinRegistrar: 'MCP non enregistré',
    tokenEscrito:
      'Le fichier de l’agent contenait le jeton du MCP en clair : il ne l’a plus et la copie préalable le conserve masqué (***). Pensez à régénérer le jeton du serveur MCP.',
    mcpNoSoportado:
      'Sa documentation ne permet pas de lire le jeton depuis une variable d’environnement : WolfCore Dev n’y enregistre pas le MCP (le jeton n’est jamais écrit dans des fichiers).',
    instalar: 'Installer',
    instalando: 'Installation…',
    guia: 'Guide d’installation',
    soloGuia:
      'WolfCore Dev ne l’installe pas (son installateur n’a pas d’empreinte fixe) : suivez le guide officiel.',
    registrar: 'Enregistrer le MCP',
    quitar: 'Retirer le MCP',
    abrir: 'Ouvrir dans un projet',
    confirmarInstalar: {
      titulo: (nombre: string) => `Installer ${nombre} ?`,
      texto: (paquete: string) =>
        `La dernière version publiée de ${paquete} est installée depuis registry.npmjs.org, avec le Node de WolfCore Dev et dans votre dossier de données.`,
      aislado:
        'N’utilise pas votre configuration npm et ne touche pas à votre npm global. Cela peut prendre plusieurs minutes.',
      aceptar: 'Installer',
      hecho: (nombre: string) => `${nombre} a été installé.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Enregistrer le MCP dans ${nombre} ?`,
      texto:
        'Seule l’entrée « wolfcore » de ce fichier est ajoutée (ou mise à jour) ; le reste est inchangé :',
      aceptar: 'Enregistrer',
      hecho: (nombre: string) => `MCP enregistré dans ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Retirer le MCP de ${nombre} ?`,
      texto: 'Seule l’entrée « wolfcore » de ce fichier est retirée ; le reste est inchangé :',
      aceptar: 'Retirer',
      hecho: (nombre: string) => `MCP retiré de ${nombre}.`,
    },
    copiaPrevia:
      'Avant d’y toucher, une copie datée est conservée à côté du fichier (<fichier>.wolfcore-AAAAMMJJ-HHmmss.bak) ; les 5 plus récentes sont gardées. Si l’agent est ouvert, fermez-le d’abord.',
    copiaHecha: (ruta: string) => `Copie préalable : ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Ouvrir ${nombre}`,
      proyecto: 'Projet',
      sinProyectos: 'Aucun projet pour l’instant.',
      proveedor: 'Fournisseur d’IA',
      proveedorPropio: 'Celui que l’agent a configuré',
      proveedorAyuda:
        'Avec un fournisseur, sa clé va uniquement dans l’environnement de ce terminal : elle n’est écrite ni dans des fichiers ni dans la ligne de commande.',
      aceptar: 'Ouvrir le terminal',
      hecho: (nombre: string) => `${nombre} s’est ouvert dans un nouveau terminal.`,
    },
    costo: {
      titulo: 'Avant d’ouvrir un agent',
      texto:
        'Un agent d’IA travaille avec votre compte chez le fournisseur : chaque demande consomme des jetons et peut coûter de l’argent. Il peut aussi lire et modifier les fichiers du projet et exécuter des commandes.',
      nunca:
        'WolfCore Dev n’ouvre jamais un agent de lui-même : c’est toujours vous qui le demandez. Cet avis n’est affiché qu’une seule fois.',
      aceptar: 'Compris, ouvrir',
    },
  },
  depuracion: {
    descripcion:
      'Voyez ici les dump(), dd() et wd() de vos sites PHP et les wolfdump de vos processus Python, avec fichier et ligne. La page continue de répondre de la même façon.',
    receptor: 'Capture de dumps',
    escuchando: (direccion: string, puerto: number) => `Écoute sur ${direccion}:${puerto}`,
    apagado: 'Désactivée',
    memoria:
      'Les dumps ne restent qu’en mémoire (les 500 derniers) et sont perdus à la fermeture. Ils peuvent contenir des données sensibles : à la copie, les clés connues sont masquées.',
    sitios: 'Sites',
    sinSitios: 'Aucun site PHP ni FastAPI.',
    sinPhp: 'Choisissez d’abord une version de PHP dans le site.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Redémarrez les processus du site pour qu’ils prennent wolfdump.',
    confirmarTitulo: (sitio: string) => `Activer la capture dans ${sitio}`,
    confirmarPhp:
      'Le PHP de ce site chargera avant chaque requête un fichier de WolfCore Dev (auto_prepend_file, uniquement pour ce site) qui définit dump(), dd() et wd() si le projet ne les définit pas. Si vos fichiers déclarent leur propre fonction dump() ou dd() sans vérifier function_exists, PHP affichera une erreur : dans ce cas, désactivez la capture. Le site utilise alors son propre PHP.',
    usoPhp:
      'Laravel et Symfony : dump($x) et dd($x) comme d’habitude. CodeIgniter 3 et autres : wd($x) envoie sans rien afficher dans la page.',
    confirmarPython:
      'Les processus de ce site auront le module wolfdump dans leur PYTHONPATH (rien n’est écrit dans le projet). Valable dès le prochain démarrage de leurs processus.',
    usoPython: 'from wolfdump import dump  →  dump(valeur)',
    activar: 'Activer la capture',
    cancelar: 'Annuler',
    filtroSitio: 'Tous les sites',
    filtroOrigen: 'Toute origine',
    buscar: 'Rechercher dans le texte, le fichier ou l’URL',
    limpiar: 'Effacer',
    confirmarLimpiar: 'Supprimer tous les dumps de la mémoire ?',
    vacio: 'Aucun dump reçu pour l’instant.',
    vacioApagado: 'Activez la capture et allumez un site pour commencer.',
    elegir: 'Choisissez un dump dans la liste.',
    copiar: 'Copier',
    copiado: 'Copié (clés masquées)',
    sinSitio: 'sans site',
    total: (n: number) => `${n} en mémoire`,
    archivo: 'Fichier',
    url: 'URL',
    pestanaVolcados: 'Dumps',
    pestanaErrores: 'Erreurs',
    erroresDescripcion:
      'Erreurs des journaux de PHP, Nginx, laravel.log, CodeIgniter 3 et Python, regroupées : la même erreur répétée apparaît une fois avec son compteur.',
    erroresVacio:
      'Aucune erreur dans les journaux. Elles apparaissent ici dès qu’elles sont écrites.',
    erroresElegir: 'Choisissez une erreur dans la liste.',
    actualizar: 'Actualiser',
    abrirEditor: 'Ouvrir dans l’éditeur',
    abrirEditorSinSitio: 'Seuls les fichiers du dossier d’un site sont ouverts.',
    veces: (n: number) => (n === 1 ? '1 fois' : `${n} fois`),
    primera: 'Première fois',
    ultima: 'Dernière fois',
    fuente: 'Journal',
    traza: 'Trace (dernière fois)',
    sinTraza: 'Pas de trace.',
  },
  contenedores: {
    descripcion:
      'Voyez et contrôlez les conteneurs Docker ou Podman de cet ordinateur. WolfCore Dev ne crée, ne supprime ni ne télécharge de conteneurs, d’images ou de volumes.',
    motor: 'Moteur',
    refrescar: 'Actualiser',
    detectando: 'Recherche de Docker et Podman…',
    sinMotorTitulo: 'Ni Docker ni Podman',
    sinMotor:
      'Ni Docker ni Podman n’ont été trouvés sur cet ordinateur. WolfCore Dev ne les installe pas : si vous en avez besoin, installez-en un depuis sa page officielle puis cliquez sur Actualiser.',
    instalarDocker: 'Installer Docker',
    instalarPodman: 'Installer Podman',
    apagadoTitulo: (m: string) => `${m} ne répond pas`,
    apagado: (m: string) =>
      `${m} est installé, mais son moteur ne répond pas. Ouvrez Docker Desktop (ou démarrez la machine Podman avec « podman machine start ») puis cliquez sur Actualiser.`,
    remoto:
      'Une connexion distante a été ignorée (DOCKER_HOST, CONTAINER_HOST, un contexte ou une connexion par défaut) : WolfCore Dev n’utilise que le moteur de cet ordinateur.',
    desdePath: 'Trouvé dans le PATH, pas dans le dossier d’installation habituel.',
    version: (v: string) => `Version ${v}`,
    vacio: 'Aucun conteneur.',
    columnas: {
      nombre: 'Nom',
      imagen: 'Image',
      estado: 'État',
      puertos: 'Ports',
      compose: 'Compose',
      acciones: 'Actions',
    },
    estados: {
      corriendo: 'En cours',
      detenido: 'Arrêté',
      pausado: 'En pause',
      otro: 'Autre',
    },
    codigoSalida: (n: number) => `code ${n}`,
    iniciar: 'Démarrer',
    detener: 'Arrêter',
    reiniciar: 'Redémarrer',
    registros: 'Journaux',
    confirmarDetenerTitulo: 'Arrêter le conteneur ?',
    confirmarDetener: (n: string) =>
      `« ${n} » sera arrêté. Ce qui tourne à l’intérieur est interrompu (le moteur attend quelques secondes que cela se termine). Rien n’est supprimé.`,
    confirmarReiniciarTitulo: 'Redémarrer le conteneur ?',
    confirmarReiniciar: (n: string) =>
      `« ${n} » sera redémarré. Ce qui tourne à l’intérieur est interrompu puis repart. Rien n’est supprimé.`,
    confirmar: 'Confirmer',
    cancelar: 'Annuler',
    hecho: {
      iniciar: (n: string) => `« ${n} » démarré.`,
      detener: (n: string) => `« ${n} » arrêté.`,
      reiniciar: (n: string) => `« ${n} » redémarré.`,
    },
    registroTitulo: (n: string) => `Journaux de « ${n} »`,
    registroEsperando: 'En attente de lignes…',
    registroFin: 'Le journal est terminé (le conteneur s’est arrêté ou le moteur a coupé).',
    cerrar: 'Fermer',
  },
  versiones: {
    pestana: 'Versions',
    avisoMaven:
      'WolfCore Dev lance Maven directement avec le JDK et, par sécurité, ne lit ni .mvn/jvm.config ni la variable MAVEN_OPTS. Si votre projet en a besoin, exécutez Maven depuis un terminal.',
    avisoRuby:
      'Ruby s’installe sans le Devkit (MSYS2) et sans toucher au PATH ni au registre de Windows : il n’y a pas d’installateur. Les gems à extensions natives sans binaire précompilé ont besoin du Devkit. C’est une étape manuelle : ouvrez un terminal depuis le projet et exécutez « ridk install » (cela installe MSYS2 sur votre ordinateur et télécharge depuis Internet).',
    avisoJdk:
      'Maven et Gradle s’exécutent avec un JDK de WolfCore Dev et aucun n’est encore installé. Installez Java (Temurin) depuis la liste des services.',
    avisoMeilisearch:
      'Chaque version mineure de Meilisearch a ses propres données. Si vous passez à une autre version mineure (par exemple de 1.58 à 1.59), vos index et la MEILISEARCH_KEY seront nouveaux : vous devrez réindexer et mettre à jour le .env de vos projets.',
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
        'Chaque version majeure (8.4, 17…) a son instance, avec son dossier de données et son port : vous pouvez en allumer plusieurs à la fois. L’étoile marque celle qu’utilisent les nouveaux projets.',
      pool: 'Chaque version de PHP allumée a son propre PHP ; l’étoile marque celle des nouveaux projets.',
      unica:
        'Vous pouvez installer plusieurs versions, mais une seule reste allumée : en allumer une autre change la version active.',
      ninguno:
        'Il n’y a rien à allumer : les projets utilisent la version qu’ils demandent ou celle par défaut (étoile).',
    },
    filtroRama: 'Version',
    todasRamas: 'Toutes les versions',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Tout afficher',
    anteriores: (n: number) => `Correctifs précédents (${n})`,
    origen: {
      vivo: 'En ligne',
      cache: (h: number) => (h < 1 ? 'Cache datant de moins d’1 h' : `Cache datant de ${h} h`),
      fija: 'Liste hors connexion',
    },
    actualizarLista: 'Actualiser la liste',
    errorCarga: 'Impossible de lire la liste des versions',
    vacio: 'Aucune version à afficher.',
    soporte: { lts: 'LTS', actual: 'Actuelle', fin: 'Fin de support', preview: 'Preview' },
    finSoporte: (f: string) => `Support jusqu’au ${f}`,
    finSoportePasado: (f: string) => `Fin de support depuis le ${f}`,
    marcas: {
      instalada: 'Installée',
      encendida: 'Allumée',
      actualizacion: (v: string) => `Mise à jour : ${v}`,
      bloqueada: 'Bloquée',
      sinHuella: 'Sans empreinte publiée',
      huellaDebil: 'Empreinte MD5 uniquement',
      firmada: 'Avec signature PGP',
    },
    ayudaFirmada:
      'La source officielle signe ce téléchargement avec PGP : WolfCore Dev vérifie la signature avec les clés épinglées dans l’application avant d’installer.',
    ayudaSinHuella:
      'La source officielle ne publie pas d’empreinte forte (SHA-256 ou SHA-512) : le téléchargement ne peut pas être vérifié.',
    instalar: 'Installer',
    desinstalar: 'Désinstaller',
    encender: 'Allumer',
    apagar: 'Éteindre',
    actualizar: 'Mettre à jour',
    usarEsta: 'Utiliser cette version',
    usarEstaAyuda: (id: string) =>
      `${id} utilise une autre version de ce service : elle est changée avec une sauvegarde préalable de ses données.`,
    predeterminada: 'Par défaut pour les nouveaux projets',
    hacerPredeterminada: 'Utiliser pour les nouveaux projets',
    predeterminadaHecha: (v: string) => `${v} devient la version par défaut.`,
    puerto: 'Port',
    puertoDe: (id: string) => `Port de ${id}`,
    cambiarPuerto: 'Changer',
    puertoCambiado: (p: number) => `Port changé en ${p}.`,
    puertoProyectosTitulo: 'Projets avec l’ancien port',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Ces projets utilisent encore le port ${viejo} dans leur .env (ils n’ont pas été modifiés) : ${lista}. Changez-le en ${nuevo}.`,
    resolver: 'Résoudre',
    instalada: (v: string) => `${v} installé.`,
    selector: { etiqueta: 'Instance', predeterminada: 'par défaut', apagada: 'éteinte' },
    dialogoSinHuella: {
      titulo: (v: string) => `Installer ${v} sans empreinte`,
      riesgo:
        'Cette version n’a pas d’empreinte publiée par sa source officielle : WolfCore Dev ne peut pas vérifier que le fichier téléchargé est l’original.',
      explicacion:
        'Le téléchargement se fait toujours en HTTPS depuis le site officiel, mais si ce site ou la connexion étaient compromis, cela ne se verrait pas. Ne l’installez que si vous en avez besoin.',
      alternativa: (v: string) => `Une version vérifiée du même service existe : ${v}.`,
      casilla: 'Je comprends le risque et je veux l’installer sans vérification',
      instalarVerificada: (v: string) => `Installer ${v} (vérifiée)`,
      instalarIgual: 'Installer sans vérification',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Mettre à jour ${n}`,
      tituloRama: (v: string) => `Nouvelle version : ${v}`,
      ninguna: 'aucune',
      instancia: (id: string) =>
        `L’instance ${id} est mise à jour. Avant de changer quoi que ce soit :`,
      pasoInstalar: (v: string) =>
        `${v} est installée à côté de la version actuelle (qui n’est pas supprimée) ;`,
      pasoVolcados: 'chaque base de données est exportée (dump) avec la version actuelle ;',
      pasoCopia: 'le dossier de données complet est arrêté puis copié (copie à froid) ;',
      pasoArrancar: 'elle est démarrée avec la nouvelle version et on vérifie qu’elle répond ;',
      pasoVuelta:
        'si elle ne démarre pas, elle revient à la version précédente avec ses données et la copie reste conservée.',
      datos: 'Données :',
      respaldo: 'Copie dans :',
      espacio: 'Espace :',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} libres ; il en faut ${necesarios}`,
      datosQuedan:
        'Les données précédentes ne sont jamais supprimées : la copie et les dumps restent dans Respaldos des mises à jour jusqu’à ce que vous les supprimiez.',
      sinEspacio: 'Pas assez d’espace pour la copie : libérez de l’espace et réessayez.',
      alLado: (v: string) =>
        `${v} est installée. Les autres versions installées ne sont pas touchées ; les projets qui fixent une autre version continuent de l’utiliser.`,
      ramaExplicacion:
        'Une nouvelle version majeure ne remplace pas la précédente : une nouvelle instance est créée avec son propre dossier de données et son port. L’instance actuelle reste inchangée.',
      copiarDesdeTitulo: 'Données de la nouvelle instance',
      copiarDesde: (id: string) =>
        `Copier les données depuis ${id} (elles sont exportées puis restaurées ; l’original n’est pas touché)`,
      vacia: 'Commencer vide',
      ramaNota:
        'Les utilisateurs de la base de données ne sont pas copiés ; les projets doivent pointer vers le port de la nouvelle instance.',
      crearInstancia: 'Créer une nouvelle instance',
      confirmar: 'Mettre à jour avec sauvegarde',
      hecho: (v: string) => `${v} mis à jour.`,
      fallo: 'Impossible de mettre à jour',
      ramaCreada: (id: string) => `Instance ${id} créée.`,
      copiadas: (l: string) => `Copiées : ${l}.`,
      noCopiada: (b: string, m: string) => `${b} n’a pas été copiée : ${m}`,
    },
    limpieza: {
      boton: 'Nettoyer les versions inutilisées…',
      titulo: 'Nettoyer les versions inutilisées',
      intro:
        'Seuls les programmes des versions que rien n’utilise sont supprimés (le dossier bin). Les données des bases, les instances et vos projets ne sont jamais touchés.',
      cargando: 'Recherche des versions…',
      vacia: 'Aucune version n’est installée.',
      sinLibres: 'Toutes les versions installées sont utilisées : il n’y a rien à nettoyer.',
      fallo: 'Nettoyage impossible',
      fallaLista: 'Impossible de lire la liste des versions',
      bloqueada: 'Ne peut pas être cochée',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'version' : 'versions'} · ${tam}`,
      destinoTitulo: 'Que faire de ces versions',
      papelera:
        'Déplacer dans la corbeille : conservées 7 jours, elles occupent le disque jusque-là',
      definitivo: 'Supprimer définitivement : libère l’espace maintenant, irréversible',
      avisoDefinitivo:
        'Suppression définitive : pour retrouver ces versions, il faudra les télécharger à nouveau.',
      instantanea:
        'Avec la suppression définitive, une copie de la configuration de l’environnement est d’abord enregistrée ; dans la corbeille, les versions se récupèrent.',
      entiendo: 'Je comprends que c’est irréversible',
      confirmar: (n: number) => `Supprimer ${n} ${n === 1 ? 'version' : 'versions'}`,
      motivos: {
        predeterminada: 'C’est la version par défaut',
        encendida: 'Elle est démarrée ou en cours d’exécution',
        sitio: 'Un projet l’utilise',
        instancia: 'Une instance l’utilise (même arrêtée)',
        plantilla: 'Un modèle l’utilise',
        workspace: 'Un workspace l’utilise',
        runtime: 'Un projet l’utilise',
        tarea: 'Un projet avec des tâches planifiées l’utilise',
        duda: 'Vérification impossible : on n’y touche pas',
        datos: 'Elle a des données que seule cette version peut ouvrir',
        herramienta: 'phpMyAdmin ou Adminer l’utilise',
      },
      resultadoTitulo: 'Résultat',
      liberadas: (tam: string) => `${tam} libérés.`,
      enPapelera: (tam: string) => `${tam} sont dans la corbeille (purgés après 7 jours).`,
      saltada: (v: string, motivo: string) => `${v} : ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'version est déjà hors de bin mais il reste des fichiers' : 'versions sont déjà hors de bin mais il reste des fichiers'} qui seront retentés à l’ouverture de l’application.`,
      instantaneaGuardada: 'Copie de l’environnement enregistrée avant la suppression.',
      ajeno: (lista: string) =>
        `Elle contient ce que vous avez installé dedans : ${lista}. La supprimer le perd.`,
      incluirAjeno: 'La supprimer même si cela se perd',
      sinCatalogo:
        'Elle n’est plus au catalogue : si vous la supprimez, vous ne pourrez plus la télécharger.',
      papeleraTitulo: 'Dans la corbeille',
      recuperar: 'Récupérer',
      recuperada: (v: string) => `${v} récupérée.`,
      borradaEl: (f: string) => `Supprimée le ${f}`,
      fallaRecuperar: 'Récupération impossible',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Désinstaller ${v}`,
      binario: 'Seuls les programmes de cette version sont retirés.',
      instancia: (id: string) =>
        `L’instance ${id} l’utilise : elle est arrêtée et retirée de la liste des instances.`,
      datosQuedan:
        'Ses données restent sur le disque : si vous réinstallez cette version, l’instance les rouvre.',
      borrarDatos: 'Supprimer aussi les données',
      borrarAviso: (id: string) =>
        `Le dossier de données de ${id} sera supprimé avec toutes ses bases. Cette action est irréversible. Tapez "${id}" pour confirmer.`,
      escriba: (id: string) => `Tapez ${id} pour confirmer`,
      desinstalar: 'Désinstaller',
      desinstalarYBorrar: 'Désinstaller et supprimer les données',
      unica:
        'C’est la version active : si c’est la seule installée, elle peut être retirée service éteint (elle devient non installée) ; s’il y en a d’autres, choisissez d’abord une autre version active (étoile).',
      predeterminada: (id: string) =>
        `${id} est l’instance par défaut : Bases de données, le bloc .env et les outils qui utilisent le moteur passeront à une autre instance (avec un autre port).`,
      hecho: (v: string) => `${v} désinstallé.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Résoudre ${id}`,
      explicacion:
        'Une mise à jour a échoué et les données de cette instance n’ont pas pu être restituées ; elle ne s’allume donc pas tant que vous n’avez pas choisi quoi faire. Rien n’est supprimé.',
      fallida: 'Données touchées :',
      respaldo: 'Sauvegarde :',
      opciones: 'Que faire',
      devolver: (sello: string, tam: string) =>
        `Restituer la sauvegarde ${sello} (${tam}) ; le dossier actuel est mis de côté, pas supprimé`,
      usarActual: 'Utiliser le dossier de données actuel tel quel',
      notaActual:
        'Uniquement si le dossier actuel contient des données complètes ; sinon, choisissez une sauvegarde.',
      notaDevolver: 'La sauvegarde est copiée, vérifiée et seulement ensuite mise en place.',
      escriba: (id: string) => `Tapez ${id} pour confirmer`,
      elegirVersion:
        'La marque de blocage n’a pas pu être lue : choisissez avec quelle version les données seront ouvertes (celle d’avant la mise à jour).',
      version: 'Version',
      confirmar: 'Résoudre',
      hecho: (id: string) => `${id} débloquée. Vous pouvez maintenant l’allumer.`,
    },
    respaldos: {
      titulo: 'Respaldos des mises à jour',
      descripcion:
        'Copies laissées par les mises à jour et les nouvelles versions. Le dossier de données qu’utilise chaque instance n’apparaît jamais ici.',
      vacio: 'Aucune copie.',
      tipos: {
        respaldo: 'Copie à froid',
        volcados: 'Dumps des bases',
        fallida: 'Données d’une version qui a échoué',
        restaurando: 'Restitution interrompue',
        copia: 'Dumps pour une nouvelle version',
      },
      archivos: (n: number) => (n === 1 ? '1 fichier' : `${n} fichiers`),
      borrar: 'Supprimer',
      borrarDe: (n: string) => `Supprimer ${n}`,
      confirmarTitulo: 'Supprimer la copie',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) sera supprimé. Cette action est irréversible. Les données utilisées par les instances ne sont pas touchées.`,
      borrado: 'Copie supprimée.',
    },
  },
  navGrupos: {
    trabajo: 'Travail',
    entorno: 'Environnement',
    utilidades: 'Utilitaires',
  },
  avisos: {
    campana: 'Avis',
    campanaConNuevos: (n: number) => `Avis : ${n} non lus`,
    titulo: 'Centre d’avis',
    vacio:
      'Aucun avis. Ici apparaîtront les pannes de services, les ports occupés et les certificats bientôt expirés.',
    marcarTodos: 'Tout marquer comme lu',
    limpiar: 'Effacer l’historique',
    ver: 'Voir',
    actualizar: 'Actualiser',
    verVersiones: 'Voir les versions',
    cerrar: 'Fermer',
    niveles: { info: 'Information', aviso: 'Avertissement', error: 'Erreur' },
    sinLeer: 'Non lu',
  },
  memoria: {
    boton: 'Mémoire',
    tituloBoton: 'Optimiser la mémoire',
    titulo: 'Optimiseur de mémoire',
    intro:
      'Choisissez un mode et vérifiez la liste. Rien n’est fermé ni arrêté tant que vous ne confirmez pas, et rien ne se lance tout seul.',
    modo: 'Mode',
    modos: { liviano: 'Léger', moderado: 'Modéré', profundo: 'Approfondi' },
    descripciones: {
      liviano:
        'Vide seulement le cache de la session de l’application : il libère du disque, pas de la RAM. N’arrête ni ne ferme rien.',
      moderado:
        'Propose aussi de ne garder qu’un seul processus PHP et d’arrêter les services de WolfCore Dev sans activité ni connexions. Les services sont décochés.',
      profundo:
        'Liste aussi vos programmes gourmands en mémoire pour leur demander de fermer leur fenêtre. Ils sont décochés.',
    },
    ver: 'Afficher la liste',
    revisando: 'Vérification…',
    vacio: 'Il n’y a rien à libérer dans ce mode.',
    tipos: {
      'cache-app': 'Vider le cache',
      'reducir-pool': 'Ne garder qu’un processus',
      'detener-inactivo': 'Arrêter (inactif)',
      'cerrar-programa': 'Demander de fermer sa fenêtre',
    },
    caches: {
      sesion: 'Cache HTTP de la session de l’application',
    },
    estimado: (cantidad: string) => `Environ ${cantidad} de RAM seraient libérés`,
    estimadoDisco: (cantidad: string) =>
      `Et environ ${cantidad} de disque (le cache n’est pas de la RAM)`,
    marcadas: (n: number, total: number) => `${n} sur ${total} cochées`,
    sinDatos:
      'Il n’y a pas encore assez de données d’activité pour proposer d’arrêter des services ou de réduire PHP. Laissez Accueil ouvert quelques minutes et regardez à nouveau.',
    listadoFallido:
      'La liste des programmes ouverts n’a pas pu être lue : cette liste peut être incomplète. Réessayez.',
    avisoDetener:
      'Les services inactifs sont décochés : en arrêter un coupe ce qui l’utilise. Seuls ceux sans connexion en ce moment sont listés.',
    avisoCerrar:
      'On demande seulement aux programmes de fermer leur fenêtre, comme en cliquant sur la croix : ils peuvent demander s’il faut enregistrer. Un programme n’est jamais forcé ni terminé.',
    protegidos:
      'Les programmes système, les services Windows, les programmes élevés, ceux d’autres utilisateurs, FlyEnv, PhpWebStudy et WolfCore Dev (ni ce qu’ils lancent) n’apparaissent jamais.',
    aplicar: 'Appliquer la sélection',
    confirmarTitulo: 'Appliquer ces actions ?',
    confirmarTexto: (n: number) =>
      n === 1
        ? '1 action de la liste sera exécutée.'
        : `${n} actions de la liste seront exécutées.`,
    confirmarCerrar: (nombres: string) =>
      `On demandera à ces programmes de fermer leur fenêtre : ${nombres}.`,
    confirmarDetener: (nombres: string) => `Ces services seront arrêtés : ${nombres}.`,
    confirmar: 'Oui, appliquer',
    cancelar: 'Annuler',
    resultadoTitulo: 'Résultat',
    liberado: (cantidad: string) => `Estimation : environ ${cantidad} de RAM libérés`,
    liberadoDisco: (cantidad: string) => `Et environ ${cantidad} de disque`,
    notaPedido:
      'En attente de l’utilisateur : on a demandé de fermer la fenêtre et le programme est toujours ouvert (il demande peut-être d’enregistrer). Ce n’est pas compté comme libéré.',
    estados: {
      hecho: 'Fait',
      pedido: 'En attente de l’utilisateur',
      saltado: 'Ignoré',
      error: 'Échec',
    },
    motivos: {
      no_en_plan: 'Ce n’était pas dans la liste',
      protegido: 'C’est un programme protégé',
      cambio: 'Cela a changé depuis l’affichage de la liste',
      sin_ventana: 'Il n’a plus de fenêtre à fermer',
      ya_apagado: 'Il n’y avait plus rien à réduire',
      ocupado: 'Il était occupé (il a des connexions)',
      no_se_pudo:
        'La demande de fermeture n’a pas pu être envoyée (le programme a des droits élevés)',
    },
    otraVez: 'Recommencer',
  },
  guias: {
    tuneles: { titulo: 'Guide des tunnels', copiar: 'Copier la commande' },
    http: {
      buscar: 'Rechercher par numéro, nom ou texte',
      familia: 'Famille',
      todas: 'Toutes',
      verMetodos: 'Méthodes',
      verCodigos: 'Codes d’état',
      resultados: (n: number) => `${n} ${n > 1 ? 'résultats' : 'résultat'}`,
      vacio: 'Aucun résultat pour cette recherche.',
      seguro: 'Sûre',
      noSeguro: 'Non sûre',
      idempotente: 'Idempotente',
      noIdempotente: 'Non idempotente',
      noEstandar: 'Non standard',
      broma: 'Code pour rire (RFC 2324)',
      causas: 'Causes courantes',
      solucion: 'Comment le résoudre',
      ejemplo: 'Exemple',
      copiarEjemplo: 'Copier l’exemple',
      probar: 'Essayer',
      probarTitulo:
        'Essayer cet exemple dans le client HTTP (rien n’est envoyé tant que vous n’avez pas cliqué sur Envoyer)',
      servidorActivo: (puerto: number) =>
        `Serveur d’exemple actif sur 127.0.0.1:${puerto} pendant que vous utilisez le guide ou le client HTTP. Il n’est accessible que depuis cet ordinateur et s’arrête à votre départ ou après 10 min d’inactivité.`,
      sinTraduccion: 'Pas de traduction dans cette langue : affiché en anglais.',
      familias: {
        '1xx': '1xx Informatifs',
        '2xx': '2xx Succès',
        '3xx': '3xx Redirection',
        '4xx': '4xx Erreur du client',
        '5xx': '5xx Erreur du serveur',
      },
    },
    git: {
      buscar: 'Chercher un sujet ou une commande',
      verGuia: 'Guide',
      verLaboratorio: 'Laboratoire',
      todos: 'Tous',
      grupos: {
        basico: 'Les bases',
        ramas: 'Branches',
        deshacer: 'Annuler',
        remotos: 'Dépôts distants et tags',
        github: 'GitHub',
      },
      resultados: (n: number) => `${n} ${n === 1 ? 'sujet' : 'sujets'}`,
      vacio: 'Rien ne correspond à la recherche.',
      ejemplo: 'Exemple',
      errores: 'Erreurs courantes',
      copiarEjemplo: 'Copier l’exemple',
      peligroso: 'Dangereux',
      sinTraduccion: 'Non traduit dans cette langue : affiché en anglais.',
      avisoGithub:
        'Cette partie est une simple explication : WolfCore Dev ne crée pas de compte, ne se connecte pas à GitHub et n’utilise pas de jeton depuis ce guide. Les noms et valeurs des exemples sont inventés.',
      irLaboratorio: 'S’exercer dans le laboratoire',
      lab: {
        intro:
          'Un dépôt d’exercice et un « distant » local, dans un dossier propre à WolfCore Dev. Il n’utilise ni internet ni GitHub et ne touche ni à vos projets ni à votre configuration git.',
        sinGit: {
          titulo: 'Git n’est pas installé',
          texto:
            'Le laboratoire utilise le git de votre système et ne peut pas s’ouvrir sans lui. Installez Git puis rouvrez cet onglet ; WolfCore Dev n’installe rien à votre place.',
        },
        cargando: 'Préparation du laboratoire…',
        reiniciar: 'Réinitialiser le laboratoire',
        reiniciarAyuda: 'Supprime uniquement le dossier d’exercice et le remet à neuf.',
        reiniciado: 'Laboratoire réinitialisé.',
        version: (v: string) => `git ${v}`,
        ordenes: 'Commandes',
        mensaje: 'Message du commit',
        mensajePorDefecto: 'Modification d’exercice',
        rama: 'Branche',
        etiqueta: 'Tag',
        archivo: 'Fichier',
        grupos: {
          basico: 'Les bases',
          ramas: 'Branches',
          guardar: 'Mettre de côté et annuler',
          remoto: 'Distant local',
        },
        archivos: {
          titulo: 'Fichiers d’exercice',
          ayuda:
            'Seuls ces fichiers peuvent être modifiés, avec du texte de 2000 caractères au plus.',
          guardar: 'Enregistrer le fichier',
          guardado: 'Fichier enregistré.',
          areaTexto: (n: string) => `Contenu de ${n}`,
        },
        salida: 'Sortie',
        salidaVacia: 'Cliquez sur une commande pour voir ici la réponse de git.',
        codigo: (n: number) => (n === 0 ? 'Terminé sans erreur' : `Terminé avec le code ${n}`),
        truncada: 'La sortie a été tronquée.',
        historial: 'Historique',
        historialVacio: 'Il n’y a pas encore de commit : faites git init, git add puis git commit.',
        conflicto: {
          titulo: 'Exercice guidé : un conflit',
          intro:
            'Deux branches modifient la même ligne. Vous verrez comment le conflit apparaît et comment le résoudre.',
          paso: (n: number, total: number) => `Étape ${n} sur ${total}`,
          ejecutar: 'Exécuter cette étape',
          hecho: 'Fait',
          reempezar: 'Recommencer',
          esperado: 'Git a signalé le conflit : c’est normal à cette étape.',
          elegir: {
            mia: 'Garder celle de main (vert)',
            otra: 'Garder celle de rama-a (rouge)',
            ambas: 'Garder les deux',
          },
          final: 'Terminé : vous avez résolu un conflit. Regardez l’historique.',
          pasos: [
            {
              titulo: 'Préparer le laboratoire',
              texto:
                'Le laboratoire est réinitialisé et le premier commit est créé avec colores.txt (« color: azul »).',
            },
            {
              titulo: 'Modifier la ligne sur rama-a',
              texto:
                'La branche rama-a est créée, la ligne devient « color: rojo » et un commit est fait.',
            },
            {
              titulo: 'Modifier la même ligne sur main',
              texto:
                'On revient sur main, la ligne devient « color: verde » et un commit est fait.',
            },
            {
              titulo: 'Tenter le merge',
              texto:
                'rama-a est fusionnée dans main. Git ne sait pas quelle ligne garder et laisse un conflit.',
            },
            {
              titulo: 'Choisir une version',
              texto:
                'Choisissez la version de la ligne à garder. colores.txt contient maintenant les marques du conflit.',
            },
            {
              titulo: 'Confirmer la résolution',
              texto: 'colores.txt est ajouté (add) et le commit qui termine le merge est fait.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `Éditeur léger avec coloration pour les fichiers texte jusqu’à ${mb} Mo. Choisissez le fichier dans la boîte de dialogue du système ; l’enregistrement demande toujours une confirmation et laisse d’abord une copie dans le dossier de données de WolfCore Dev.`,
    abrir: 'Ouvrir un fichier…',
    abriendo: 'Ouverture…',
    guardar: 'Enregistrer',
    guardando: 'Enregistrement…',
    recargar: 'Recharger depuis le disque',
    vacio: 'Ouvrez un fichier pour commencer à le modifier.',
    sinCambios: 'Aucune modification',
    conCambios: 'Modifications non enregistrées',
    posicion: (linea: number, columna: number) => `Ligne ${linea}, colonne ${columna}`,
    areaTexto: (nombre: string) => `Éditeur de code : ${nombre}`,
    salirTeclado: 'Pour quitter l’éditeur au clavier, appuyez sur Échap puis sur Tab.',
    guardado: 'Fichier enregistré.',
    copiaPrevia: (ruta: string) => `Copie préalable : ${ruta}`,
    cancelar: 'Annuler',
    enlaceDuro:
      'Ce fichier porte plusieurs noms sur le disque (lien physique). L’enregistrer rompt ce lien : les autres noms gardent l’ancien contenu.',
    saltosMixtos: {
      aviso:
        'Ce fichier mélange des fins de ligne. À l’enregistrement, elles sont toutes normalisées en LF.',
      aceptar: 'J’accepte de normaliser les fins de ligne',
    },
    envGestor: {
      aviso:
        'Les fichiers .env se modifient dans les variables du projet, avec leur circuit des secrets. Le bouton ouvre le .env à la racine du projet, qui n’est peut-être pas le fichier que vous avez essayé d’ouvrir.',
      boton: 'Ouvrir le .env à la racine du projet',
    },
    huellaPerdida:
      'Enregistré, mais la nouvelle empreinte n’a pas pu être lue : le fichier a été rechargé.',
    confirmarGuardar: {
      titulo: 'Enregistrer les modifications',
      texto: (nombre: string) =>
        `${nombre} va être écrit. Auparavant, une copie du contenu actuel du disque est conservée dans le dossier de données de WolfCore Dev.`,
      boton: 'Enregistrer avec copie préalable',
    },
    refuerzo: {
      abrirTitulo: 'Fichier sensible',
      guardarTitulo: 'Enregistrer un fichier sensible',
      secreto:
        'Ce fichier semble contenir des secrets (clés privées, jetons ou identifiants). Son contenu sera affiché à l’écran.',
      datosReales:
        'Ce fichier appartient à un site marqué comme contenant des données réelles. Une mauvaise modification peut toucher des informations bien réelles.',
      instruccion: (nombre: string) => `Pour continuer, saisissez le nom du fichier : ${nombre}`,
      etiqueta: 'Nom du fichier',
      abrirBoton: 'Ouvrir quand même',
      guardarBoton: 'Enregistrer quand même',
    },
    cambioExterno: {
      titulo: 'Le fichier a changé en dehors de l’éditeur',
      texto:
        'Un autre programme l’a modifié depuis que vous l’avez ouvert ; rien n’a donc été enregistré. Vous pouvez le recharger (vos modifications sont perdues) ou l’écraser avec ce que vous avez ici.',
      recargar: 'Recharger et abandonner mes modifications',
      sobrescribir: 'Écraser…',
      sobrescribirTitulo: 'Écraser le fichier',
      sobrescribirTexto:
        'Les modifications faites par l’autre programme seront perdues. Son contenu actuel restera dans la copie préalable.',
      sobrescribirBoton: 'Oui, écraser',
      volver: 'Retour',
    },
    descartar: {
      titulo: 'Modifications non enregistrées',
      texto:
        'L’éditeur contient des modifications non enregistrées. Si vous continuez, elles sont perdues.',
      confirmar: 'Abandonner les modifications',
      seguir: 'Continuer à modifier',
    },
    cm: {
      'Control character': 'Caractère de contrôle',
      'Selection deleted': 'Sélection supprimée',
      'Go to line': 'Aller à la ligne',
      go: 'aller',
      Find: 'Rechercher',
      Replace: 'Remplacer',
      next: 'suivant',
      previous: 'précédent',
      all: 'tout',
      'match case': 'respecter la casse',
      regexp: 'expression régulière',
      'by word': 'mot entier',
      replace: 'remplacer',
      'replace all': 'tout remplacer',
      close: 'fermer',
      'current match': 'occurrence actuelle',
      'on line': 'à la ligne',
      'replaced match on line $': 'occurrence remplacée à la ligne $',
      'replaced $ matches': '$ occurrences remplacées',
      'folded code': 'code replié',
      unfold: 'déplier',
      to: 'à',
    },
  },
  limpiezaDisco: {
    intro:
      'On analyse d’abord et on voit ce que chaque élément occupe. Rien n’est supprimé tant que vous n’avez pas confirmé, et rien ne tourne seul ni en arrière-plan.',
    analizar: 'Analyser',
    analizando: 'Analyse…',
    cancelarAnalisis: 'Annuler',
    vacio: 'Il n’y a rien à nettoyer.',
    categorias: {
      temp: {
        nombre: 'Fichiers temporaires',
        ayuda:
          'Ceux de votre dossier TEMP de plus de 24 heures. Supprimés définitivement ; ils se régénèrent seuls.',
      },
      'cache-chrome': {
        nombre: 'Cache de Google Chrome',
        ayuda:
          'Seulement les dossiers de cache de chaque profil ; jamais les cookies, mots de passe ni historique.',
      },
      'cache-edge': {
        nombre: 'Cache de Microsoft Edge',
        ayuda:
          'Seulement les dossiers de cache de chaque profil ; jamais les cookies, mots de passe ni historique.',
      },
      'cache-brave': {
        nombre: 'Cache de Brave',
        ayuda:
          'Seulement les dossiers de cache de chaque profil ; jamais les cookies, mots de passe ni historique.',
      },
      'cache-firefox': {
        nombre: 'Cache de Firefox',
        ayuda:
          'Seulement le dossier cache2 de chaque profil ; jamais les cookies, mots de passe ni historique.',
      },
      'wolfcore-descargas': {
        nombre: 'Téléchargements en cache de WolfCore Dev',
        ayuda: 'Archives isolées qui ne servent plus. Envoyées à la corbeille.',
      },
      'wolfcore-registros': {
        nombre: 'Journaux de WolfCore Dev',
        ayuda: 'Journaux de plus de 30 jours. Envoyés à la corbeille.',
      },
      prefetch: {
        nombre: 'Prefetch de Windows',
        ayuda:
          'Facultatif. Windows le régénère, mais il faut lancer WolfCore Dev en administrateur.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Navigateur ouvert ou en arrière-plan : fermez-le complètement pour nettoyer son cache (dans Edge, désactivez aussi le boost de démarrage et les extensions en arrière-plan)',
      'requiere-admin': 'Nécessite de lancer WolfCore Dev en administrateur',
      'ruta-vetada': 'Chemin protégé : non nettoyé',
      'temp-no-seguro':
        'La variable TEMP pointe vers un dossier qui n’est pas le dossier temporaire de l’utilisateur (Documents, un lecteur entier, un chemin réseau…) : non nettoyé',
    },
    borradoDefinitivo: 'Supprimés définitivement (ils se régénèrent seuls)',
    borradoPapelera: 'Envoyés à la corbeille du système',
    archivos: (n: number) => (n === 1 ? '1 fichier' : `${n} fichiers`),
    carpetas: 'Par dossier',
    truncado:
      'L’analyse s’est arrêtée à la limite de fichiers : il y en a plus que ce qui est affiché.',
    marcadas: (n: number, t: number) => `${n} catégories cochées sur ${t}`,
    total: (b: string) => `Environ ${b} seraient libérés`,
    limpiar: 'Nettoyer la sélection',
    confirmarTitulo: 'Nettoyer ces catégories ?',
    confirmarTexto: (n: number) => `${n} catégories seront nettoyées.`,
    confirmarDefinitivo:
      'TEMP et les caches sont supprimés définitivement (ils se régénèrent seuls).',
    confirmarPapelera: 'Les journaux et téléchargements de WolfCore Dev vont à la corbeille.',
    confirmarPrefetch:
      'Prefetch : Windows le régénère, mais les premiers lancements de programmes peuvent être un peu plus lents.',
    confirmar: 'Oui, nettoyer',
    cancelar: 'Annuler',
    detener: 'Arrêter le nettoyage',
    resultadoTitulo: 'Résultat',
    liberado: (b: string) => `Libéré : ${b}`,
    enPapelera: (b: string) =>
      `Dont ${b} dans la corbeille (l’espace revient quand vous la videz).`,
    saltados: (n: number) => `${n} fichiers ont été ignorés`,
    cancelado: 'Nettoyage annulé : ce qui a déjà été supprimé reste supprimé.',
    topeEjecucion:
      'La limite de fichiers par exécution est atteinte : analysez et nettoyez de nouveau pour continuer.',
    registroFallido:
      'Le journal du nettoyage ne pouvait plus être écrit, le nettoyage s’est donc arrêté : ce qui a été supprimé est consigné jusqu’à ce point.',
    motivos: {
      'en-uso': 'Utilisé',
      enlace: 'Lien ou point d’analyse (non suivi)',
      protegido: 'Protégé (.env, FlyEnv ou similaire)',
      cambio: 'Modifié depuis l’analyse',
      'sin-papelera': 'Aucune corbeille disponible',
      ilegible: 'Illisible',
      error: 'Erreur de suppression',
    },
    verRegistros: 'Voir les journaux',
    registroEn: (r: string) => `Journal de ce nettoyage : ${r}`,
    otraVez: 'Recommencer',
    protegidas:
      'Jamais touchés : données, sauvegardes, projets, bases ni fichiers .env. Les liens ne sont pas suivis et rien en dehors des chemins de cette liste n’est touché.',
  },
  barra: {
    paleta: 'Rechercher ou exécuter une commande',
    atajoPaleta: 'Ctrl+K',
    tema: 'Changer de thème',
    idioma: 'Changer de langue',
  },
  preferencias: {
    titulo: 'Apparence et langue',
    descripcion:
      'Les changements s’appliquent immédiatement et sont enregistrés sur cet ordinateur.',
    tema: 'Thème',
    temas: { sistema: 'Système', claro: 'Clair', oscuro: 'Sombre' },
    idioma: 'Langue',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' },
    acento: 'Couleur d’accent',
    acentos: {
      indigo: 'Indigo',
      azul: 'Bleu',
      verde: 'Vert',
      violeta: 'Violet',
      naranja: 'Orange',
      rosa: 'Rose',
    },
    acentoPropio: (color: string) => `Personnalisée (${color})`,
    errorGuardar: 'Impossible d’enregistrer la préférence',
    asistente: 'Visite de bienvenue',
    asistenteAyuda:
      'Revoyez la visite des écrans principaux : services, projets, bases de données, outils et Doctor.',
    asistenteAbrir: 'Voir la visite',
    avanzadas: 'Afficher les sections avancées',
    avanzadasAyuda:
      'Ajoute à la barre latérale les écrans rarement utilisés, comme Conteneurs. Vous y accédez aussi avec Ctrl+K.',
  },
  paleta: {
    titulo: 'Palette de commandes',
    placeholder: 'Cherchez un écran, un service, un projet ou un outil…',
    sinResultados: 'Aucune commande ne correspond à la recherche.',
    ayuda: '↑ ↓ pour naviguer · Entrée pour exécuter · Échap pour fermer',
    grupos: {
      navegacion: 'Aller à',
      servicios: 'Services',
      proyectos: 'Projets',
      herramientas: 'Outils',
      github: 'GitHub',
      general: 'Général',
    },
    irA: (pantalla: string) => `Aller à ${pantalla}`,
    encender: (servicio: string) => `Allumer ${servicio}`,
    apagar: (servicio: string) => `Éteindre ${servicio}`,
    iniciarTodo: 'Démarrer tous les services',
    detenerTodo: 'Arrêter tous les services',
    iniciarWorkspace: (n: string) => `Démarrer le workspace ${n}`,
    detenerWorkspace: (n: string) => `Arrêter le workspace ${n}`,
    abrirSitio: (nombre: string) => `Ouvrir ${nombre} dans le navigateur`,
    traerCambios: (nombre: string) => `Récupérer les changements de ${nombre}`,
    irAServicio: (nombre: string) => `Aller au service ${nombre}`,
    irAProyecto: (nombre: string) => `Aller au projet ${nombre}`,
    versionesDe: (nombre: string) => `Versions de ${nombre}`,
    abrirHerramienta: (nombre: string) => `Ouvrir ${nombre}`,
    clonar: 'Cloner un dépôt depuis GitHub',
    agregarProyecto: 'Ajouter un projet',
    nuevoProyecto: 'Créer un nouveau projet',
    tema: (tema: string) => `Thème : ${tema}`,
    idioma: (idioma: string) => `Langue : ${idioma}`,
    asistente: 'Voir la visite de bienvenue',
  },
  nuevoProyecto: {
    titulo: 'Nouveau projet',
    boton: 'Nouveau projet',
    descripcion:
      'Créez un projet de zéro : le dossier, le site en HTTPS, la base de données et sa connexion.',
    pasos: { tipo: 'Type', datos: 'Détails', resumen: 'Récapitulatif', crear: 'Création' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Via Composer ; clé de l’application, base et migrations.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Appstarter officiel avec son .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Framework classique avec database.php configuré.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Squelette officiel (ou webapp) avec son .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Environnement virtuel, requirements.txt et processus uvicorn.',
      },
      wordpress: {
        nombre: 'WordPress',
        descripcion: 'Téléchargement officiel avec wp-config.php prêt.',
      },
      estatico: {
        nombre: 'Site statique',
        descripcion: 'HTML et CSS servis par Nginx, sans base de données.',
      },
    },
    campos: {
      nombre: 'Nom du projet',
      nombrePlaceholder: 'mi-tienda',
      nombreAyuda: (dominio: string) => `Ce sera ${dominio} : minuscules, chiffres et tirets.`,
      carpeta: 'Dossier parent',
      elegirCarpeta: 'Choisir un dossier…',
      cambiarCarpeta: 'Changer de dossier…',
      carpetaAyuda:
        'Le projet est créé dans un nouveau dossier à son nom, à l’intérieur de celui-ci. Il doit être vide ou ne pas exister.',
      php: 'Version de PHP',
      python: 'Version de Python',
      sinInstalada: 'Aucune installée : installez-en une depuis Services.',
      conBase: 'Créer une base de données pour le projet',
      sinBase: 'Sans base de données',
      instancia: 'Serveur de la base',
      apagada: 'éteinte',
      apagadaAyuda: 'Ce serveur est éteint : allumez-le dans Services avant de créer le projet.',
      sinMotores: 'Aucun serveur de base de données n’est installé pour ce type de projet.',
      nombreBase: 'Nom de la base',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Aucun', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Inclure les paquets web (webapp)',
      pgvector: 'Activer pgvector (recherche vectorielle)',
    },
    huella: {
      titulo: 'WordPress ne publie qu’une empreinte faible',
      riesgo:
        'L’empreinte publiée est un SHA-1, un algorithme qui n’est plus considéré comme sûr, et elle provient du même site que le fichier.',
      explicacion:
        'Si ce site ou la connexion était compromis, un téléchargement altéré passerait la vérification. Le téléchargement reste en HTTPS depuis wordpress.org. Continuez seulement si vous faites confiance à cette source.',
      leyendo: 'Lecture de l’empreinte publiée…',
      noDisponible:
        'L’empreinte n’a pas pu être lue maintenant (hors ligne ou source muette) ; elle sera relue à la création.',
      fuente: 'Origine : wordpress.org',
      casilla: 'Je comprends que l’empreinte est faible et je veux créer le projet quand même',
    },
    resumen: {
      titulo: 'Voici ce qui sera créé',
      intro: 'Vérifiez avant de commencer.',
      tipo: 'Type',
      carpeta: 'Dossier',
      sitio: 'Site',
      dominio: 'Domaine',
      https: 'Adresse HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Base de données',
      env: 'Connexion écrite dans',
      nota: 'Si une étape échoue, rien n’est supprimé : vous verrez ce qui a été créé et pourrez réessayer.',
    },
    errores: {
      nombreVacio: 'Saisissez un nom de projet.',
      nombreInvalido:
        'Le nom ne peut contenir que des minuscules, des chiffres et des tirets (40 au plus), sans commencer ni finir par un tiret.',
      sinCarpeta: 'Choisissez le dossier parent du projet.',
      sinPhp: 'Choisissez une version de PHP (installez-en une depuis Services s’il n’y en a pas).',
      sinPython:
        'Choisissez une version de Python (installez-en une depuis Services s’il n’y en a pas).',
      sinInstancia: 'Choisissez le serveur où créer la base, ou décochez la base.',
      baseInvalida: 'Le nom de la base n’est pas valide pour ce moteur.',
      motorNoVale: 'WordPress a besoin de MySQL ou de MariaDB.',
      pgvectorMotor: 'pgvector a besoin de PostgreSQL.',
      huellaDebil: 'Confirmez que vous comprenez que l’empreinte de WordPress est faible.',
    },
    acciones: {
      cambiarCarpeta: 'Choisir un autre dossier',
      cambiarBase: 'Changer le nom de la base',
      cambiarNombre: 'Changer le nom',
      reintentarPaso: 'Réessayer l’étape',
      servicios: 'Aller à Services',
      confirmarHuella: 'Revoir la confirmation',
    },
    botones: {
      siguiente: 'Suivant',
      atras: 'Retour',
      crear: 'Créer le projet',
      creando: 'Création…',
      cerrar: 'Fermer',
      abrirEditor: 'Ouvrir dans l’éditeur',
      verSitio: 'Voir le site',
      verProyecto: 'Voir dans Projets',
    },
    progreso: {
      titulo: 'Création du projet',
      listo: 'Projet créé.',
      fallo: (paso: string) =>
        `L’étape « ${paso} » a échoué. Rien n’a été supprimé : réessayez l’étape ou corrigez le problème puis recommencez.`,
      quedo: (partes: string) => `Voici ce qui a été créé : ${partes}.`,
      quedoCarpeta: 'le dossier',
      quedoBase: (nombre: string) => `la base ${nombre}`,
      quedoSitio: 'le site',
      avisos: 'Avertissements',
      sinUsuarioPropio:
        'Le chiffrement du système n’est pas disponible : le projet utilise la connexion de l’administrateur de la base. Dès qu’il le sera, utilisez « Utiliser un utilisateur dédié » dans le gestionnaire de .env.',
      editorFallo: 'L’éditeur n’a pas pu être ouvert.',
    },
  },
  importar: {
    boton: 'Importer…',
    titulo: 'Importer depuis Laragon, XAMPP ou Herd',
    intro:
      "Les sites sont liés là où ils se trouvent : aucun dossier n'est déplacé, copié ni modifié. Si vous le souhaitez, leurs bases de données sont aussi copiées. WolfCore Dev se contente de lire les installations des autres programmes.",
    buscando: 'Recherche des installations…',
    nada: "Laragon, XAMPP et Herd n'ont pas été trouvés dans les dossiers habituels.",
    errorVista: 'Impossible de chercher ce qui peut être importé',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Sites',
      todos: 'Tout sélectionner',
      ninguno: 'Tout désélectionner',
      dominio: (d: string) => `Domaine ${d}`,
      dominioPropuesto: (d: string) => `Domaine ${d} (proposé)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP non déterminé',
      base: (nombre: string, motor: string) => `Base ${nombre} (${motor})`,
      yaVinculado: 'Déjà un site WolfCore Dev',
      dominioEnUso: 'Un autre site utilise déjà ce domaine',
    },
    avisos: {
      sin_dominio: "Il n'a pas de domaine dans l'autre programme : un domaine est proposé.",
      dominio_invalido: "Son domaine n'est pas valide : un domaine est proposé.",
      sin_vhost: "Il n'a pas d'hôte virtuel propre : un domaine est proposé.",
      php_desconocido:
        'On ne sait pas quelle version de PHP il utilise : une version installée est choisie.',
      base_no_local: "Sa base est sur un autre serveur : elle n'est pas importée.",
      base_nombre_invalido: "Le nom de sa base n'est pas valide : elle n'est pas importée.",
      motor_no_soportado: "Sa base n'est ni MySQL ni MariaDB : elle n'est pas importée.",
    },
    problemas: {
      titulo: (n: number) =>
        `${n} ${n === 1 ? 'élément a été écarté ou n’a pas pu être lu' : 'éléments ont été écartés ou n’ont pas pu être lus'}`,
    },
    bases: {
      titulo: 'Bases de données',
      importarBases: 'Importer aussi les bases de données',
      ayuda:
        "Démarrez le serveur de bases de données de l'autre programme avant de continuer : WolfCore Dev ne démarre ni n'arrête les programmes tiers. Le mot de passe n'est utilisé que pour cette importation et n'est pas enregistré.",
      destino: 'Serveur de destination',
      apagada: 'arrêté',
      sinMotores:
        'MySQL et MariaDB ne sont pas installés : installez-les depuis Services pour importer des bases.',
      puerto: 'Port du serveur source',
      usuario: 'Utilisateur',
      clave: 'Mot de passe',
      claveAyuda:
        "Laissez vide si l'utilisateur n'a pas de mot de passe (comme root dans Laragon ou XAMPP).",
      existe: 'existe déjà à destination',
      reemplazar: 'Remplacer (une copie est faite avant)',
      noSeToca: "Elle n'est pas touchée si vous ne cochez pas.",
    },
    pasos: { elegir: 'Choisir', confirmar: 'Confirmer' },
    continuar: 'Continuer',
    volver: 'Retour',
    cancelar: 'Annuler',
    importar: 'Importer',
    cerrar: 'Fermer',
    sinSeleccion: 'Choisissez au moins un site.',
    origenIncompleto: "Indiquez le port et l'utilisateur du serveur source.",
    confirmar: {
      titulo: "Confirmez l'importation",
      sitios: (n: number) =>
        `${n} ${n === 1 ? 'site sera lié' : 'sites seront liés'} dans son dossier actuel. Aucun fichier n'est déplacé, copié ni modifié.`,
      sinConfianza:
        "Aucun site importé n'exécute de recette tant que vous n'avez pas coché « Je fais confiance à ce dépôt ».",
      hosts:
        "Nginx et le fichier hosts seront mis à jour (Windows peut demander l'autorisation administrateur).",
      basesNuevas: (nombres: string) => `Ces bases seront copiées : ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Ces bases existent déjà et seront remplacées : ${nombres}. Une copie de chacune est faite avant.`,
      basesSinTocar: (nombres: string) =>
        `Ces bases existent déjà et ne seront pas touchées : ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Elles seront exportées depuis le serveur de l'autre programme (127.0.0.1:${puerto}, utilisateur ${usuario}). Il est lu sans être modifié.`,
      sinBases: 'Aucune base de données ne sera importée.',
      proteccion:
        "La structure de chaque base est vérifiée avant et les données entrent avec un utilisateur limité : en cas d'échec, la base reste comme elle était.",
    },
    resultado: {
      titulo: "Résultat de l'importation",
      importando: 'Importation…',
      cancelar: 'Annuler l’importation',
      restaurada:
        "La base d'origine a été remise automatiquement depuis sa copie : elle est telle qu'elle était.",
      sitioOk: 'Importé',
      sitioFallo: 'Non importé',
      baseOk: (n: string) => `Base ${n} importée`,
      baseFallo: (n: string) => `Base ${n} non importée`,
      copiaPrevia: (ruta: string) => `Copie de la base précédente : ${ruta}`,
      phpDistinto: (v: string) =>
        `PHP ${v} a été utilisé (la version d'origine n'est pas installée).`,
      sinAplicar:
        "Nginx ou le fichier hosts n'ont pas été mis à jour : consultez l'avis dans Projets et réessayez.",
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'site importé' : 'sites importés'}, ${b} ${b === 1 ? 'base importée' : 'bases importées'}.`,
      errorImportar: "Impossible d'importer",
    },
  },
  plantillas: {
    guardarComo: 'Enregistrer comme modèle…',
    dialogo: {
      titulo: (nombre: string) => `Enregistrer « ${nombre} » comme modèle`,
      intro:
        'Le modèle conserve la recette, les réglages PHP et Nginx, les extensions et le schéma de la base (la structure seulement, aucune ligne). Il ne conserve jamais de mots de passe, de clés ni de données de la base.',
      nombre: 'Nom du modèle',
      nombrePlaceholder: 'Mon projet de base',
      conArchivos: 'Inclure aussi les fichiers du projet',
      conArchivosAyuda: 'Sans cela, seuls la recette, les réglages et le schéma sont enregistrés.',
      siempre: 'Toujours exclus',
      siempreLista:
        '.env et .env.*, vendor, node_modules, .git, .venv, journaux, sauvegardes et bases en fichier (*.sql, *.dump, *.sqlite), clés et certificats (*.pem, *.key, *.crt…), wp-config.php et wolfcore.yml. Un fichier qui contient une clé ou un mot de passe est aussi exclu.',
      extra: 'Exclure aussi (un par ligne)',
      extraAyuda: 'Noms ou chemins relatifs au projet, par exemple uploads ou public/build.',
      vista: 'Ce qui sera enregistré',
      calculando: 'Calcul en cours…',
      resumen: (archivos: number, tamano: string) => `${archivos} fichiers · ${tamano}`,
      fuera: (n: number) => `${n} exclus`,
      sinArchivos:
        'Seuls la recette, les réglages et le schéma seront enregistrés ; aucun fichier.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Seule la structure de la base ${nombre} (serveur ${servidor}) sera enregistrée, sans aucune ligne.`,
      sinBase: 'Le projet ne déclare pas de base de données : aucun schéma ne sera enregistré.',
      avisoMongodb:
        "Ce projet utilise MongoDB : son schéma (collections et index) n'est pas enregistré.",
      incluirDeTodosModos: 'Inclure quand même',
      avisoIncluir: 'Si ce fichier contient une vraie clé, elle se retrouvera dans le modèle.',
      guardar: 'Enregistrer le modèle',
      guardada: (nombre: string) => `Modèle « ${nombre} » enregistré.`,
      errorGuardar: "Impossible d'enregistrer le modèle",
      errorVista: "Impossible de calculer l'aperçu",
      cancelar: 'Annuler',
    },
    lista: {
      titulo: 'Mes modèles',
      ayuda:
        "Démarrez un nouveau projet avec la recette, les réglages et le schéma (sans données) d'un projet existant.",
      vacia:
        "Il n'y a pas encore de modèle. Enregistrez un projet comme modèle depuis le menu de sa carte.",
      conArchivosEtiqueta: 'avec fichiers',
      soloEsquema: 'recette et schéma',
      conBase: (motor: string) => `base ${motor} sans données`,
      borrarEtiqueta: (nombre: string) => `Supprimer le modèle ${nombre}`,
      borrarTitulo: (nombre: string) => `Supprimer le modèle ${nombre} ?`,
      borrarTexto:
        "Seul le modèle est supprimé. Les projets créés avec lui et le projet d'origine ne sont pas touchés.",
      borrada: 'Modèle supprimé.',
      errorBorrar: 'Impossible de supprimer le modèle',
      errorLista: 'Impossible de lire les modèles',
      desde: (nombre: string) => `Modèle : ${nombre}`,
      avisoSinBase: "Ce modèle n'a pas de base de données.",
      importadaEtiqueta: 'importé',
      avisoImportada:
        "Le modèle vient d'un tiers : le projet est créé sans confiance et sans démarrer ses processus, et ouvrir le site exécute son code. Vérifiez ses fichiers d'abord.",
      generadoresTitulo: 'Projets à partir de zéro',
    },
  },
  env: {
    accion: 'Variables .env…',
    titulo: (nombre: string) => `.env de ${nombre}`,
    intro:
      'Les valeurs secrètes sont masquées. Une valeur complète n’apparaît que si vous cliquez sur « Afficher » pour cette variable, et elle est de nouveau masquée après 30 secondes. Avant d’enregistrer, une copie datée du .env actuel est faite.',
    noExiste: 'Ce projet n’a pas encore de fichier .env : il sera créé à l’enregistrement.',
    tablaEtiqueta: 'Variables du .env',
    sinVariables: 'Le .env n’a aucune variable.',
    secretaEtiqueta: 'secrète',
    duplicadaEtiqueta: 'répétée',
    duplicadaAyuda:
      'Cette variable apparaît plus d’une fois dans le .env : la dernière est affichée et modifiée.',
    soloLecturaEtiqueta: 'plusieurs lignes',
    soloLecturaAyuda: 'Elle occupe plusieurs lignes : modifiez-la à la main dans le fichier.',
    seQuitara: 'Elle sera supprimée à l’enregistrement',
    valorNuevo: 'Nouvelle valeur',
    valorNuevoDe: (clave: string) => `Nouvelle valeur de ${clave}`,
    valorDe: (clave: string) => `Valeur de ${clave}`,
    vacio: '(vide)',
    mostrar: 'Afficher',
    ocultar: 'Masquer',
    mostrarEtiqueta: (clave: string) => `Afficher la valeur de ${clave}`,
    ocultarEtiqueta: (clave: string) => `Masquer la valeur de ${clave}`,
    cambiar: 'Modifier',
    deshacer: 'Annuler',
    deshacerEtiqueta: (clave: string) => `Annuler la modification de ${clave}`,
    quitar: 'Supprimer',
    quitarEtiqueta: (clave: string) => `Supprimer la variable ${clave}`,
    errorRevelar: 'Impossible d’afficher la valeur',
    agregarTitulo: 'Ajouter une variable',
    agregarNombre: 'NOM',
    agregarValor: 'valeur',
    agregar: 'Ajouter',
    nombreInvalido:
      'Utilisez des lettres, des chiffres, le tiret bas et le point, sans commencer par un chiffre, et qui n’existe pas déjà.',
    comparar: {
      titulo: 'Comparer avec le fichier d’exemple',
      sinEjemplo: 'Le projet n’a pas de .env.example à comparer.',
      alDia: 'Le .env a les mêmes variables que l’exemple.',
      faltan: (n: number) => `${n} manquantes :`,
      sobran: (n: number) => `${n} en trop (absentes de l’exemple) :`,
      distintas: (n: number) => `${n} avec une valeur différente de l’exemple :`,
      agregarFaltantes: 'Ajouter les manquantes',
    },
    bloques: {
      titulo: 'Ajouter un bloc de variables',
      ayuda:
        'N’ajoute que les variables de ce thème absentes du .env (celles qui existent ne sont pas modifiées), sans mots de passe ni clés ; complétez-les ensuite dans le tableau.',
      bd: 'Base de données',
      correo: 'Courrier',
      ia: 'IA',
      redis: 'Redis',
      meilisearch: 'Meilisearch (avec sa clé)',
    },
    usuarioPropio: {
      titulo: 'Utiliser un utilisateur dédié',
      ayuda:
        'Crée un utilisateur de base de données réservé à ce projet (avec des droits uniquement sur sa base, jamais administrateur) et l’écrit dans le .env. Pour l’instant, cela fonctionne avec le MySQL et le MariaDB de WolfCore Dev.',
      confirmarTitulo: 'Utiliser un utilisateur dédié pour la base ?',
      confirmarTexto:
        'Un nouvel utilisateur est créé avec un mot de passe aléatoire, avec des droits uniquement sur la base de ce projet, et l’utilisateur et le mot de passe de la connexion sont modifiés dans le .env. Une copie du .env actuel est d’abord enregistrée ; le nouveau mot de passe reste dans le .env du projet et chiffré dans WolfCore Dev.',
      confirmar: 'Créer et utiliser',
      hecho: (usuario: string) => `Le projet utilise maintenant l’utilisateur ${usuario}.`,
      compartirTitulo: 'Partager l’utilisateur d’un autre projet ?',
      compartirTexto: (base: string, proyecto: string) =>
        `La base ${base} est aussi utilisée par ${proyecto}. Partager son utilisateur ? Ce projet utilisera le même utilisateur et le même mot de passe ; le mot de passe ne change pas, donc ${proyecto} reste connecté.`,
      compartir: 'Partager l’utilisateur',
      error: 'Impossible de changer l’utilisateur de la base',
    },
    copias: {
      titulo: 'Revenir à une copie',
      ninguna: 'Il n’y a pas encore de copies de ce .env.',
      volver: 'Revenir à cette copie',
      confirmarTitulo: 'Revenir à une copie du .env ?',
      confirmarTexto: (fecha: string) =>
        `Le .env actuel est remplacé par la copie du ${fecha}. Une autre copie de l’actuel est d’abord enregistrée, donc cela peut aussi être annulé.`,
      hecho: 'Retour à la copie effectué.',
      error: 'Impossible de revenir à la copie',
    },
    cambiosPendientes: (n: number) => `${n} modifications non enregistrées`,
    descartar: 'Annuler les modifications',
    guardar: 'Vérifier et enregistrer…',
    cerrar: 'Fermer',
    cerrarTitulo: 'Fermer sans enregistrer ?',
    cerrarTexto: (n: number) =>
      `Il y a ${n} modifications non enregistrées. Si vous fermez, elles sont perdues.`,
    cerrarDescartar: 'Fermer et annuler',
    seguirEditando: 'Continuer à modifier',
    confirmar: {
      titulo: 'Enregistrer les modifications du .env',
      texto:
        'Voici ce qui va changer. Les valeurs secrètes sont masquées. Une copie datée du .env actuel est enregistrée et le fichier est écrit en une seule fois.',
      sinCambios: 'Il n’y a aucune modification à enregistrer.',
      agregarGitignore: 'Ajouter .env au .gitignore du projet',
      aceptarVersionado: 'Je comprends le risque et je veux enregistrer quand même',
      guardar: 'Enregistrer les modifications',
      versionado:
        'Git suit déjà le .env de ce projet : le prochain commit enverrait ses valeurs même s’il est dans .gitignore. Retirez-le de l’index avec git rm --cached .env.',
      versionadoDesconocido:
        'Impossible de vérifier si git suit le .env de ce projet ; confirmez séparément pour enregistrer.',
    },
    errorVistaPrevia: 'Impossible de préparer l’aperçu',
    errorGuardar: 'Impossible d’enregistrer le .env',
    guardado: 'Le .env a été enregistré.',
    guardadoConCopia: 'Le .env a été enregistré ; la version précédente est conservée en copie.',
  },
  /** Estados vacíos que guían: qué es, por qué está vacío y la acción principal (D38b). */
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Aucun moteur de base de données pour le moment',
      texto:
        'Installez MySQL, MariaDB, PostgreSQL ou MongoDB depuis Services pour créer et gérer les bases de vos projets.',
      accion: 'Aller à Services',
    },
    serviciosVacio: {
      titulo: 'Aucun service installé pour le moment',
      texto:
        'Les services (Nginx, PHP, bases de données…) font fonctionner vos sites. Commencez par Nginx et PHP, ou par une base de données.',
      accion: 'Installer un service',
    },
    registrosSinFuentes: {
      titulo: 'Aucun journal pour le moment',
      texto:
        'Les journaux apparaissent dès qu’un service, un site ou un processus écrit sa première ligne. Démarrez un service puis revenez ici.',
      accion: 'Aller à Services',
    },
    registrosElegir: {
      titulo: 'Choisissez un journal',
      texto: 'Choisissez une source dans le sélecteur ci-dessus pour suivre ses lignes en direct.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Aucun dump reçu pour le moment',
      texto:
        'Quand un site exécute dump(), dd() ou wd(), le dump s’affiche ici aussitôt. Ouvrez votre site et exécutez ce code.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'La capture est désactivée',
      texto:
        'Capture activée, les dump() et dd() de vos sites arrivent ici sans toucher au navigateur. Activez-la et démarrez un site.',
      accion: 'Activer la capture',
    },
    depuracionElegir: {
      titulo: 'Choisissez un dump',
      texto:
        'Sélectionnez un dump dans la liste pour voir son contenu, son fichier et son URL d’origine.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Aucune erreur dans les journaux',
      texto:
        'Les erreurs de PHP, Nginx et de vos projets apparaissent ici, regroupées, dès qu’elles sont écrites. Une liste vide est une bonne nouvelle.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Choisissez une erreur',
      texto:
        'Sélectionnez une erreur dans la liste pour voir sa trace et ouvrir le fichier dans l’éditeur.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Aucune vérification pour le moment',
      texto:
        'Doctor vérifie les ports, les hosts, les certificats et les versions, et vous dit comment corriger ce qui échoue. Lancez la première vérification.',
      accion: 'Vérifier maintenant',
    },
    doctorSinHallazgos: {
      titulo: 'Tout est en ordre',
      texto:
        'La dernière vérification n’a trouvé aucun problème. Revérifiez si quelque chose cesse de répondre.',
      accion: 'Revérifier',
    },
    contenedoresVacio: {
      titulo: 'Aucun conteneur',
      texto:
        'Les conteneurs Docker ou Podman de cet ordinateur apparaissent ici. Créez-en un avec docker run ou docker compose, puis cliquez sur Actualiser.',
      accion: 'Actualiser',
    },
    avisos: {
      titulo: 'Aucun avis',
      texto:
        'Les pannes de services, les ports occupés et les certificats bientôt expirés apparaîtront ici.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Aucun instantané pour le moment',
      texto:
        'Un instantané conserve l’état de cette base pour y revenir si quelque chose tourne mal. Prenez le premier avec le bouton ci-dessus.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Ce serveur n’a pas de base propre',
      texto: 'Créez une base pour votre projet ou importez un dump existant.',
      accion: 'Créer une base',
    },
    iaNube: {
      titulo: 'Aucun fournisseur d’IA pour le moment',
      texto:
        'Un fournisseur (OpenAI, Anthropic, OpenRouter et d’autres) permet d’utiliser des modèles dans le cloud depuis vos agents. La clé est chiffrée sur cet ordinateur.',
      accion: 'Ajouter un fournisseur',
    },
    iaSinModelos: {
      titulo: 'Aucun modèle local pour le moment',
      texto: 'Téléchargez un modèle dans la liste ci-dessous pour l’utiliser hors ligne.',
      accion: '',
    },
    versiones: {
      titulo: 'Aucune version à afficher',
      texto:
        'La liste est téléchargée depuis le catalogue officiel. Vérifiez votre connexion puis actualisez la liste.',
      accion: 'Actualiser la liste',
    },
    buscar: {
      titulo: 'Aucune correspondance',
      texto:
        'Rien dans le dossier ne correspond à votre recherche. Essayez d’autres mots, décochez « Respecter la casse » ou vérifiez les filtres de fichiers.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Visite de bienvenue',
    paso: (n: number, total: number) => `Étape ${n} sur ${total}`,
    anterior: 'Précédent',
    siguiente: 'Suivant',
    saltar: 'Passer',
    terminar: 'Commencer',
    cerrar: 'Fermer la visite',
    reabrir: 'Appuyez sur Échap pour quitter. Vous pouvez la revoir depuis Réglages › Apparence.',
    ir: (destino: string) => `Aller à ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Bienvenue dans WolfCore Dev',
        texto:
          'Votre environnement de développement local dans une seule fenêtre : services, sites .test en HTTPS, bases de données, e-mail et outils. Cette visite dure une minute et ne modifie rien sur votre ordinateur.',
      },
      servicios: {
        titulo: 'Services',
        texto:
          'Démarrez ici Nginx, PHP et les bases de données d’un simple interrupteur. S’ils ne sont pas encore installés, l’onglet Versions les télécharge avec l’empreinte vérifiée.',
      },
      proyectos: {
        titulo: 'Projets',
        texto:
          'Créez un projet ou importez un dossier ou un dépôt. Chaque site reçoit sa propre adresse .test en HTTPS.',
      },
      bases: {
        titulo: 'Bases de données',
        texto:
          'Créez des bases, importez et exportez des dumps, et sauvegardez ou restaurez sans quitter l’application.',
      },
      herramientas: {
        titulo: 'Outils et Ctrl+K',
        texto:
          'Éditeur, recherche, comparaison, mots de passe, images et plus, regroupés par section. Appuyez sur Ctrl+K sur n’importe quel écran pour aller droit au but.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Il vérifie les ports, les hosts, les certificats et les versions, et vous propose comment corriger ce qui échoue. Ouvrez-le quand quelque chose ne répond pas.',
      },
      listo: {
        titulo: 'Tout est prêt',
        texto:
          'Commencez par démarrer un service ou créer votre premier projet. Vous pouvez revoir cette visite depuis Réglages › Apparence.',
      },
    },
  },
  /** Resultado de importar o exportar un perfil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Sauvegarde et profils',
      descripcion:
        "Un profil emporte votre environnement sur un autre ordinateur : sites, versions, instances, modèles et réglages. Il n'emporte jamais de clés, de jetons ni de mots de passe.",
      aislado: {
        titulo: 'Dossier de test',
        texto: (ruta: string) =>
          `WolfCore Dev utilise un dossier de données de test (${ruta}). Ce que vous faites ici ne touche ni votre dossier réel ni votre ordinateur : le fichier hosts n'est pas modifié et aucun certificat n'est installé.`,
      },
      exportar: {
        titulo: "Exporter l'environnement",
        texto:
          'Enregistre un fichier .wolfperfil avec vos sites, versions, instances, modèles et réglages.',
        bases: 'Inclure les bases de données',
        basesAyuda:
          'Les vidages complets (avec les données de vos clients) voyagent chiffrés avec la phrase.',
        ca: "Inclure l'autorité de certification (CA)",
        caAyuda:
          'Elle est chiffrée avec la phrase. Importez-la uniquement sur un de vos ordinateurs.',
        certificados: 'Inclure les certificats des sites',
        certificadosAyuda: 'Ils ne voyagent qu’avec la CA, chiffrés avec elle.',
        frase: 'Phrase secrète',
        fraseRepetir: 'Répéter la phrase secrète',
        fraseAyuda: (minimo: number) =>
          `Au moins ${minimo} caractères. Sans elle, les bases et la CA sont irrécupérables, et elle n'est enregistrée nulle part.`,
        problemas: {
          frase_corta: (minimo: number) =>
            `La phrase secrète doit comporter au moins ${minimo} caractères.`,
          frase_distinta: 'Les deux phrases ne correspondent pas.',
          certificados_sin_ca: "Les certificats ne voyagent qu'avec la CA.",
        },
        exportar: 'Exporter le profil…',
        nota: "Le profil n'emporte jamais de clés, de jetons ni de mots de passe, ni les instantanés, la corbeille, les sauvegardes ou le dossier data.",
        listo: 'Profil exporté',
        guardado: (archivo: string, tamano: string) => `Enregistré dans ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Importer un profil',
        texto:
          'Choisissez un fichier .wolfperfil. Avant de modifier quoi que ce soit, vous verrez tout ce qui est remplacé, retiré ou laissé en attente, et une copie de ce qui est remplacé est enregistrée.',
        boton: 'Importer un profil…',
      },
      instantaneas: {
        titulo: "Instantanés de l'environnement",
        texto:
          "Avant de mettre à jour PHP ou Nginx et avant d'importer un profil, WolfCore Dev enregistre une copie de votre configuration, de Nginx et des php.ini, sans clés ni données et rien que pour vous. Les 10 derniers sont conservés.",
        compartidas:
          "Les 10 sont partagés entre tous les motifs : en prendre un nouveau remplace le plus ancien, même s'il était manuel.",
        tomar: 'En prendre un maintenant',
        tomada: 'Instantané enregistré.',
        sinNada: "Il n'y a encore rien à copier.",
        vacia: "Il n'y a pas encore d'instantanés.",
        motivos: {
          actualizar: 'Avant une mise à jour',
          'importar-perfil': "Avant l'importation d'un profil",
          'limpiar-versiones': 'Avant le nettoyage des versions',
          manual: 'Manuel',
        },
      },
    },
    reasignar: {
      titulo: 'Dossiers des sites',
      texto:
        "Ces dossiers viennent de l'autre ordinateur. Cherchez où ils se trouvent sur celui-ci ou importez le site en attente : il reste sans dossier jusqu'à ce que vous en choisissiez un.",
      sitio: 'Site',
      origen: 'Dossier dans le profil',
      destino: 'Dossier sur cet ordinateur',
      existe: 'Existe',
      noExiste: "N'existe pas sur cet ordinateur",
      buscar: 'Chercher le dossier…',
      cambiar: 'Changer',
      comoPendiente: 'Importer quand même en attente',
      prefijo: (viejo: string, nuevo: string) =>
        `Appliquer le même changement aux autres (${viejo} → ${nuevo})`,
      omitido: 'Ne sera pas importé',
    },
    asistente: {
      titulo: 'Importer un profil',
      pasos: {
        archivo: 'Fichier',
        revisar: 'Vérifier',
        confirmar: 'Confirmer',
        resultado: 'Résultat',
      },
      archivo: {
        texto:
          "Choisissez le fichier .wolfperfil. Rien n'est encore modifié : vous verrez d'abord ce qui sera remplacé, retiré ou laissé en attente.",
        elegir: 'Choisir un fichier…',
        cambiar: 'En choisir un autre',
        ninguno: 'Aucun fichier choisi',
        leyendo: 'Lecture du profil…',
        error: 'Le profil n’a pas pu être lu',
      },
      origen: (fecha: string, sistema: string) => `Créé le ${fecha} sur ${sistema}.`,
      ignoradas: (n: number) =>
        `${n} entrées du fichier ne font pas partie d'un profil et sont ignorées.`,
      reemplaza: {
        titulo: 'Ce qui est remplacé',
        ninguno:
          "Il n'y a pas de données dans ce dossier : l'importation se fait sur une installation propre.",
        copia:
          "Avant de remplacer, tout est copié dans respaldos/pre-perfil-… et un instantané de l'environnement est pris ; chaque base remplacée a son propre instantané. Le dossier data n'est jamais supprimé.",
        config: 'La configuration (config.json)',
        sitio: (id: string) => `Le site ${id}`,
        base: (instancia: string, base: string) => `La base ${base} (${instancia})`,
        plantilla: (id: string) => `Le modèle ${id}`,
        ca: "L'autorité de certification (CA) de cet ordinateur",
      },
      versiones: {
        titulo: 'Versions',
        ninguna: "Le profil n'a aucune version.",
        instalada: 'Déjà installée',
        descargar: 'Sera téléchargée avec son empreinte vérifiée',
        pendienteDebil: "En attente : pas d'empreinte forte, installez-la à la main",
        sustituida: (v: string) =>
          `Elle n'est plus dans le catalogue : ${v} sera installée à la place.`,
        pendienteFuera: "En attente : elle n'est plus dans le catalogue",
        huellas: {
          fuerte: 'Empreinte SHA-256 ou SHA-512',
          firmada: 'Signée',
          debil: 'Empreinte faible',
          ninguna: "Pas d'empreinte",
        },
        descargas: (n: number) =>
          `${n} versions seront téléchargées depuis des sites officiels, chacune avec son empreinte ou sa signature vérifiée.`,
      },
      instancias: {
        titulo: 'Instances de bases de données',
        existente: 'Existe déjà : conservée avec son port et sa version',
        nueva: (puerto: number) => `Créée avec de nouveaux identifiants sur le port ${puerto}`,
        reasignada: (de: number, a: number) => `Le port ${de} est occupé : elle utilisera le ${a}`,
      },
      bases: {
        titulo: 'Bases de données',
        ninguna: "Le profil n'a aucune base.",
        texto:
          'Elles sont restaurées avec un utilisateur limité à chaque base et seulement avec des instructions autorisées. Celles qui existent déjà sont sauvegardées avant.',
        omitir: 'Importer sans les bases',
      },
      plantillas: {
        titulo: 'Modèles',
        existe: 'Existe déjà : remplacé',
        nueva: 'Nouveau',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Ils ne portent que des références à des bases de données et à des services (les processus des projets ne voyagent pas). Ils sont vérifiés par rapport à ce qui existe ici et ne démarrent jamais seuls.',
        existe: 'Vous en avez déjà un avec cet id : le vôtre est conservé',
        nuevo: 'Nouveau',
        elementos: (n: number) => (n === 1 ? '1 élément' : `${n} éléments`),
        invalidos: (n: number) => `${n} du profil ne sont pas valides et ne seront pas importés.`,
      },
      quitado: {
        titulo: 'Ce qui n’est pas repris de la configuration',
        texto:
          'Ce dossier de données est vide : on ne reprend pas du profil ce qui pointe en dehors de cet ordinateur.',
      },
      puertos: {
        titulo: 'Ports occupés',
        texto: (lista: string) =>
          `Ces ports du profil sont déjà utilisés par un autre programme sur cet ordinateur : ${lista}. Changez-les depuis Services après l'importation.`,
      },
      ca: {
        titulo: 'Autorité de certification (CA)',
        texto:
          "Le profil contient une CA chiffrée. Importez-la uniquement si c'est la vôtre : cet ordinateur accepterait les certificats qu'elle signe.",
        huella: 'Empreinte SHA-256 de la CA du profil',
        comparar: "Comparez-la avec celle de votre ordinateur d'origine avant de l'accepter.",
        importar: 'Importer la CA du profil',
        noImportar:
          "Sans l'importer, cet ordinateur utilise sa CA actuelle ou en crée une nouvelle.",
        ajena:
          'Cette CA a des contraintes de nom qui ne sont pas celles de WolfCore Dev : elle ne peut pas être importée.',
        sinRestricciones:
          "Cette CA n'a aucune contrainte de nom : elle peut signer des certificats pour n'importe quel site web, banques et messagerie compris. Importez-la uniquement si c'est la vôtre et que l'empreinte correspond.",
        aceptarSin: "Je comprends le risque : c'est ma CA et l'empreinte correspond",
        reemplazaLocal:
          'Cet ordinateur a déjà une CA. Importer celle du profil la remplace (une copie reste dans la sauvegarde préalable).',
        reemplazar: 'Remplacer la CA de cet ordinateur',
        noSeInstala:
          "La CA ne s'installe pas toute seule dans le magasin de certificats du système.",
      },
      frase: {
        titulo: 'Phrase secrète du profil',
        texto:
          "Le profil contient des bases ou la CA chiffrées. Saisissez la phrase secrète choisie lors de l'exportation.",
        campo: 'Phrase secrète',
        omitirBases: 'Importer sans les bases',
        nota: "La phrase n'est utilisée que dans cette fenêtre : elle n'est pas enregistrée et elle est effacée à la fin ou à la fermeture.",
      },
      env: {
        titulo: 'Connexion des projets',
        texto:
          'Cochez les projets dont le .env doit pointer vers un nouvel utilisateur propre à leur base (avec copie préalable du .env). Les autres ne sont pas touchés et sont signalés.',
      },
      confirmar: {
        titulo: "Confirmer l'importation",
        resumen: (sitios: number, versiones: number, bases: number) =>
          `${sitios} sites, ${versiones} versions et ${bases} bases seront importés.`,
        importar: 'Importer',
        revisar: 'Vérifier',
        volver: 'Retour',
        bloqueos: {
          sitios_sin_carpeta:
            "Choisissez le dossier de chaque site ou cochez-le pour l'importer en attente.",
          frase_requerida: 'Saisissez la phrase secrète du profil ou importez sans les bases.',
          ca_ajena: 'La CA du profil ne peut pas être importée.',
          ca_sin_restricciones:
            'Confirmez à part que vous voulez importer une CA sans contraintes.',
          reemplazar_ca: 'Confirmez à part que vous voulez remplacer la CA de cet ordinateur.',
        },
      },
      progreso:
        'Importation du profil… Ne fermez pas la fenêtre : avec des bases ou des téléchargements, cela peut être long.',
      fases: {
        copia: 'Copie de ce qui est remplacé',
        versiones: 'Installation des versions',
        configuracion: 'Enregistrement de la configuration et des sites',
        plantillas: 'Copie des modèles',
        ca: 'Préparation de la CA et des certificats',
        bases: 'Restauration des bases de données',
        env: 'Réécriture des .env',
      },
      avance: (paso: number, de: number) => `Étape ${paso} sur ${de}`,
      resultado: {
        titulo: "Résultat de l'importation",
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} importés, ${pendientes} en attente, ${omitidos} ignorés et ${errores} en erreur.`,
        respaldo: (ruta: string) => `Copie de ce qui a été remplacé : ${ruta}`,
        pendientes: 'Ce qui est resté en attente peut être terminé à la main.',
        error: "Le profil n'a pas pu être importé",
        secciones: {
          sitios: 'Sites',
          versiones: 'Versions',
          instancias: 'Instances',
          bases: 'Bases',
          plantillas: 'Modèles',
          workspaces: 'Workspaces',
          env: 'Fichiers .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Importé',
          pendiente: 'En attente',
          omitido: 'Ignoré',
          error: 'Erreur',
          instalada: 'Installée',
          ya_instalada: 'Déjà là',
          creada: 'Créée',
          existente: 'Existait déjà',
          puerto_reasignado: 'Port réattribué',
          reescrito: 'Réécrit',
          sin_marcar: 'Non coché',
        },
        ca: {
          importada: 'CA importée',
          nueva: 'Nouvelle CA générée',
          sin_cambios: "La CA n'a pas changé",
        },
        quitarCa: {
          boton: "Retirer l'ancienne CA…",
          titulo: "Retirer l'ancienne CA de la confiance",
          texto:
            "La CA que cet ordinateur avait avant sera retirée du magasin de certificats du système. Windows peut demander une confirmation. La nouvelle CA ne s'installe pas toute seule.",
          si: 'Retirer',
          hecho: 'Ancienne CA retirée de la confiance.',
        },
        descartadosWorkspace: (lista: string) => `N’existe pas ici et a été retiré : ${lista}`,
        workspacesInvalidos: (n: number) => `${n} workspaces non valides n’ont pas été importés.`,
        sustituida: (v: string) => `${v} a été installée à la place de la version du profil.`,
        puerto: (de: number, a: number) => `Port ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Copie du .env : ${ruta}`,
      },
    },
    /** Aviso fuerte de la vista previa: la CA del perfil no tiene restricciones de nombre. */
    caSinRestricciones:
      "Cette CA peut signer n'importe quel site web ; importez-la uniquement si c'est la vôtre, comparez l'empreinte.",
    motivos: {
      procesos_quitados: "Ses processus (commandes d'un autre ordinateur) n'ont pas été importés.",
      tareas_quitadas:
        "Ses tâches planifiées (commandes d'un autre ordinateur) n'ont pas été importées. Recréez-les ou adoptez-les depuis wolfcore.yml.",
      tunel_con_nombre: 'Son tunnel nommé ne voyage pas : il revient au tunnel rapide.',
      php_ini: "Certains réglages de php.ini n'ont pas été importés.",
      xdebug: "Son réglage Xdebug n'était pas valide et a été retiré.",
      nginx_desactivado:
        "Ses règles Nginx sont enregistrées mais pas appliquées : vérifiez-les dans l'éditeur.",
      carpeta_no_existe: "Son dossier n'existe pas sur cet ordinateur : cherchez-le.",
      correo_sin_proveedor:
        "Son fournisseur SMTP n'a pas été importé : il utilise le capteur de courrier.",
      sitio_invalido: "Le site n'est pas valide.",
      dominio_invalido: "Son domaine n'est pas valide (il doit finir par .test).",
      ruta_protegida:
        "Son dossier est un dossier système ou de WolfCore Dev : il n'est pas importé.",
      dominio_en_uso: 'Un autre site de cet ordinateur utilise déjà ce domaine.',
      sitio_repetido: 'Le site est répété dans le profil.',
      no_disponible: "Cette version n'est plus dans le catalogue.",
      version_sustituida:
        "Cette version n'est plus dans le catalogue : la dernière de sa branche a été installée.",
      huella_debil:
        "Cette version n'a pas d'empreinte forte : installez-la à la main depuis Versions.",
      tope_descargas:
        'Pas téléchargée pour éviter trop de téléchargements à la fois : installez-la depuis Versions.',
      instancia_pendiente: 'Son instance est en attente.',
      motor_no_soportado: "Ce moteur n'est pas importé depuis un profil.",
      version_pendiente: 'La version du moteur est en attente.',
      danada: 'Ses fichiers dans le profil sont endommagés.',
      bases_omitidas: 'Importé sans les bases.',
      instancia_apagada: "Son instance n'a pas pu démarrer.",
      sin_copia_previa:
        "L'instantané préalable n'a pas pu être pris : la base n'a pas été remplacée.",
      sin_base: 'Son .env ne pointe pas vers une base locale.',
      base_no_resuelta: 'Impossible de savoir à quelle instance appartient sa base.',
      error_inesperado: 'Quelque chose a échoué.',
    },
    avisos: {
      ca_reemplazada:
        "L'ancienne CA de cet ordinateur est toujours dans le magasin de confiance du système et n'est plus utilisée. Vous pouvez la retirer d'ici.",
      base_no_incluida: "La base {base} ({instancia}) n'a pas été incluse.",
      sin_ca: "Il n'y a pas de CA sur cet ordinateur : le profil part sans elle.",
      ca_no_importada:
        "La CA du profil n'a pas été importée : on utilise celle de cet ordinateur ou une nouvelle.",
      certificados: "Les certificats n'ont pas pu être préparés : {detalle}",
      aplicar:
        "Les sites importés n'ont pas été entièrement appliqués (Nginx : {nginx} ; hosts : {hosts}).",
    },
    quitado: {
      ia: "Fournisseur d'IA {id} : il utilise sa propre URL.",
      smtp: "Fournisseur SMTP {id} : son hôte n'est pas un fournisseur connu ou son utilisateur manque.",
      puerto: 'Port de {id} : hors plage, retour à la valeur par défaut.',
      carpeta_vigilada: 'Le dossier surveillé appartient à un autre ordinateur.',
    },
  },

  consultasLentas: {
    boton: 'Requêtes lentes',
    titulo: (motor: string) => `Requêtes lentes de ${motor}`,
    descripcion:
      'Les requêtes qui prennent plus de temps que la durée que vous choisissez, de la plus lente à la plus rapide.',
    cargando: 'Chargement des requêtes lentes…',
    estadoTitulo: 'État du journal',
    estadoActivo: (s: string) =>
      `Journal actif : les requêtes de plus de ${s} s sont enregistrées.`,
    estadoApagado: 'Le journal est désactivé.',
    noGestionada:
      "WolfCore Dev ne gère pas ce serveur (par exemple, celui d'un autre programme) : ici, vous pouvez seulement le consulter, pas le modifier.",
    umbral: 'Enregistrer les requêtes de plus de (secondes)',
    activar: 'Activer le journal',
    aplicarUmbral: 'Changer la durée',
    desactivar: 'Désactiver le journal',
    actualizar: 'Relire le journal',
    confirmarTitulo: 'Modifier le journal des requêtes lentes',
    confirmarActivar: (motor: string, s: string) =>
      `Le journal sera activé sur tout le serveur ${motor} (requêtes de plus de ${s} s) et enregistré dans sa configuration. Il concerne toutes ses bases.`,
    confirmarDesactivar: (motor: string) =>
      `Le journal sera désactivé sur tout le serveur ${motor} et enregistré dans sa configuration. Ce qui a déjà été enregistré est conservé.`,
    confirmarBoton: 'Confirmer la modification',
    cancelar: 'Annuler',
    activado: 'Journal des requêtes lentes activé',
    desactivado: 'Journal des requêtes lentes désactivé',
    privacidad:
      "Le SQL est affiché avec ses valeurs remplacées par « ? », car il peut contenir de vraies données de clients. Rien de tout cela ne quitte cet ordinateur ni n'est écrit dans les journaux de l'application.",
    columnas: {
      duracion: 'Durée',
      filas: 'Lignes examinées',
      base: 'Base',
      fecha: 'Date',
      sql: 'Requête',
      acciones: 'Actions',
    },
    sinBase: 'Non attribuée',
    verLiteral: 'Voir le littéral',
    ocultarLiteral: 'Masquer le littéral',
    literalAviso: 'SQL tel quel, avec ses valeurs',
    sqlOculto: 'SQL masqué',
    sqlOcultoAyuda:
      'Cette requête ne peut pas être affichée sans risque de montrer des données : ce serveur contient des bases avec des données réelles ou la requête ne peut pas être attribuée de façon sûre à une base.',
    copiar: 'Copier',
    copiado: 'Requête copiée',
    truncado: (n: number) =>
      `Au plus les ${n} requêtes les plus lentes de la fin du journal (les 5 derniers Mo) sont affichées.`,
    vacioTitulo: "Aucune requête lente n'est encore enregistrée",
    vacioTextoApagado:
      'Activez le journal et utilisez vos sites : les requêtes plus longues que la durée choisie apparaîtront ici.',
    vacioTextoActivo:
      "Pour l'instant, aucune requête n'a dépassé la durée choisie. Utilisez vos sites puis relisez le journal.",
  },
  esquemaBd: {
    boton: 'Voir le schéma',
    titulo: (base: string) => `Schéma de ${base}`,
    descripcion:
      "Lecture seule : tables, colonnes, clés et relations. Aucune donnée de vos tables n'est lue.",
    cargando: 'Lecture du schéma…',
    error: 'Impossible de lire le schéma de la base.',
    reintentar: 'Réessayer',
    buscar: 'Rechercher une table',
    tablas: (n: number) => plural(n, 'table', 'tables'),
    vista: 'vue',
    truncado: (n: number) =>
      `La liste a été limitée à ${n} tables : la base en contient davantage.`,
    sinResultados: 'Aucune table ne correspond à la recherche.',
    elegir: 'Choisissez une table dans la liste pour voir ses colonnes, ses clés et ses relations.',
    columnas: 'Colonnes',
    indices: 'Index',
    sinIndices: "Cette table n'a aucun index.",
    relaciones: 'Relations',
    sinRelaciones: "Cette table n'a pas de relation avec d'autres.",
    salientes: 'Référence',
    entrantes: 'Est référencée par',
    alBorrar: 'À la suppression :',
    alActualizar: 'À la mise à jour :',
    irA: (tabla: string) => `Aller à la table ${tabla}`,
    col: { nombre: 'Colonne', tipo: 'Type', nulo: 'Nullable', defecto: 'Par défaut', clave: 'Clé' },
    si: 'Oui',
    no: 'Non',
    pk: 'PK',
    unico: 'unique',
    vacioTitulo: "Cette base n'a aucune table",
    vacioTexto:
      'Lorsque vous créerez des tables (par exemple avec les migrations de votre projet), elles apparaîtront ici.',
  },
};
