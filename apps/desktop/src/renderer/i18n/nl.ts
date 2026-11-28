/**
 * UI-teksten in het Nederlands (nl-NL). Dezelfde sleutels en functiesignaturen als es.ts.
 * Vaste woordenlijst: dienst, instantie, site, tunnel, back-up, melding; Doctor en
 * WolfCore Dev worden niet vertaald. Formele aanspreekvorm (u); buiten Git altijd 'versie'.
 */
import type { TextosParciales } from './es';

const plural = (n: number, een: string, meerdere: string): string =>
  `${n} ${n === 1 ? een : meerdere}`;

export const nl: TextosParciales = {
  app: {
    nombre: 'WolfCore Dev',
    version: 'Versie',
  },
  nav: {
    inicio: 'Start',
    proyectos: 'Projecten',
    agentes: 'Agents',
    servicios: 'Diensten',
    basesDeDatos: 'Databases',
    correo: 'E-mail',
    php: 'PHP',
    ia: 'AI',
    tuneles: 'Tunnels',
    contenedores: 'Containers',
    herramientas: 'Hulpmiddelen',
    doctor: 'Doctor',
    depuracion: 'Foutopsporing',
    registros: 'Logboeken',
    ajustes: 'Instellingen',
    contraer: 'Menu inklappen',
    expandir: 'Menu uitklappen',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'dienst ingeschakeld', 'diensten ingeschakeld'),
    tuneles: (n: number) => plural(n, 'actieve tunnel', 'actieve tunnels'),
    cargando: 'Verbinding maken met de kern…',
    conErrores: 'met fouten',
    sinConexion: 'Geen verbinding met de kern',
  },
  estado: {
    encendido: 'Ingeschakeld',
    apagado: 'Uitgeschakeld',
    iniciando: 'Starten…',
    error: 'Fout',
    externo: 'Extern',
    activo: 'Actief',
    aviso: 'Melding',
  },
  acciones: {
    encender: 'Inschakelen',
    apagar: 'Uitschakelen',
    iniciarTodo: 'Alles starten',
    detenerTodo: 'Alles stoppen',
    abrir: 'Openen',
    copiar: 'Kopiëren',
    copiado: 'Gekopieerd naar klembord',
    guardar: 'Opslaan',
    cerrar: 'Sluiten',
    abrirCarpeta: 'Map openen',
    instalar: 'Installeren',
    reintentar: 'Opnieuw proberen',
    cancelar: 'Annuleren',
    borrar: 'Verwijderen',
    editar: 'Bewerken',
    duplicar: 'Dupliceren',
    renovar: 'Vernieuwen',
    masAcciones: 'Meer acties',
    actualizar: 'Bijwerken',
    quitar: 'Verwijderen',
    reinstalar: 'Opnieuw installeren',
  },
  errores: {
    titulo: 'De actie kon niet worden voltooid',
    arranque: 'De status van de omgeving kon niet worden gelezen',
    desconocido: 'Er is een onverwachte fout opgetreden.',
    /** Details die de kern als code binnen een fout verzendt. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'niet-gesloten aanhalingstekens',
      'sintaxis.tras_comillas': 'er ontbreekt een spatie of ";" na de aanhalingstekens',
      'sintaxis.punto_y_coma_inesperado': '";" zonder instructie',
      'sintaxis.llave_inesperada': '"{" zonder instructie',
      'sintaxis.falta_punto_y_coma': 'er ontbreekt ";" aan het einde van de instructie',
      'sintaxis.sobra_llave': 'een overtollige "}"',
      'sintaxis.falta_llave': 'er ontbreekt een "}"',
    },
    codigos: {
      'git.cambios_locales':
        'Er zijn niet-opgeslagen wijzigingen in de map: sla ze op (commit) of verwerp ze voordat u wijzigingen ophaalt. Er is niets gewijzigd.',
      'git.divergencia':
        'De branch is afgeweken van de remote (er zijn verschillende lokale en remote commits): los dit handmatig op. Er is niets gewijzigd.',
      'git.sin_upstream':
        'De huidige branch volgt geen remote branch: er is niets om wijzigingen van op te halen.',
      'git.sin_rama':
        'De repository staat op een losse commit (zonder branch): er is niets gewijzigd.',
      'git.no_repositorio': 'De map is geen git-repository.',
      'git.destino_no_vacio': 'De doelmap is niet leeg.',
      'git.destino_es_archivo': 'Het doel is een bestand, geen map.',
      'git.no_encontrado': 'git is niet gevonden: installeer het eerst.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) is niet gevonden: installeer deze eerst.',
      'git.plazo': 'Het klonen overschreed de limiet van {minutos} min en is geannuleerd.',
      'git.token_invalido': 'Het GitHub-token is ongeldig.',
      'git.url_con_credenciales':
        'De URL mag geen gebruikersnaam of wachtwoord bevatten: gebruik een afzonderlijk token.',
      'servicios.desconocido': 'Onbekende dienst: {id}.',
      'servicios.no_instalado': '{nombre} is niet geïnstalleerd. Installeer deze via Diensten.',
      'servicios.puerto_invalido': 'De poort moet een getal tussen 1024 en 65535 zijn.',
      'servicios.puerto_asignado': 'Poort {puerto} is al toegewezen aan {otro}.',
      'servicios.puerto_ocupado':
        'Poort {puerto} wordt gebruikt door {nombre} (PID {pid}). Sluit dit proces af of kies een andere poort.',
      'servicios.confirmacion_borrado': 'Typ "{id}" om de gegevens van {nombre} te verwijderen.',
      'servicios.ftp_no_disponible': 'De FTP-server is niet beschikbaar.',
      'sistema.sin_cliente_ftp':
        'Er is geen FTP-client gekoppeld op dit systeem. Installeer er een (bijvoorbeeld FileZilla) of kopieer het adres.',
      'servicios.mailpit_no_responde': 'Mailpit reageert niet. Start de dienst via Diensten.',
      'servicios.iniciar_todo_fallos':
        'Alles starten kon niet inschakelen: {nombres}. Controleer Diensten en de bijbehorende logboeken.',
      'servicios.respaldo_fallo':
        '{nombre} is niet bijgewerkt: de voorafgaande back-up is mislukt en er is niets gewijzigd.',
      'servicios.espacio_insuficiente':
        'Er is onvoldoende ruimte om de gegevens te kopiëren: er is {necesarios} MB nodig en er is {libres} MB vrij.',
      'servicios.actualizacion_revertida':
        'Versie {version} startte niet; {nombre} is teruggezet naar {anterior}. De back-up blijft bewaard.',
      'servicios.restauracion_fallo':
        'De nieuwe versie startte niet en de gegevens van {nombre} konden niet worden hersteld. Er is niets ingeschakeld: de gewijzigde gegevens staan in {fallida} en de back-up in {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} behoort tot een andere hoofdversie: maak deze aan als een nieuwe instantie.',
      'servicios.misma_version': '{id} gebruikt versie {version} al.',
      'servicios.instancia_bloqueada':
        '{nombre} is geblokkeerd: een update kon de gegevens niet herstellen. De gewijzigde gegevens staan in {fallida} en de back-up in {respaldo}. Los dit op in Diensten → Versies voordat u deze inschakelt.',
      'servicios.datos_apartados':
        '{nombre} heeft geen gegevens in de map, maar er staan apart gezette gegevens van een update: er wordt geen lege map aangemaakt. Controleer Diensten → Versies.',
      'servicios.puerto_reservado':
        'Poort {puerto} is gereserveerd door het systeem ({desde}–{hasta}): kies een andere poort.',
      'servicios.borrado_con_bloqueo':
        '{nombre} heeft een geblokkeerde instantie na een update: los dit eerst op voordat u de gegevens verwijdert.',
      'servicios.config_no_revertida':
        '{nombre} {version} startte niet en de configuratie kon niet worden teruggezet naar {anterior}. Kies {anterior} opnieuw in Diensten → Versies.',
      'servicios.puerto_revertido_apagada':
        '{nombre} startte niet op de nieuwe poort; deze is teruggezet naar {anterior}, maar startte daar ook niet: de dienst is uitgeschakeld gebleven op poort {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} startte niet op poort {nuevo} en de configuratie kon niet worden teruggezet naar {anterior}: de dienst is uitgeschakeld gebleven.',
      'instancias.id_invalido': 'De id van de instantie is ongeldig.',
      'instancias.no_existe': 'Instantie {id} bestaat niet.',
      'instancias.existe': 'Instantie {id} bestaat al.',
      'instancias.una_sola': '{nombre} ondersteunt slechts één instantie.',
      'instancias.ultima': '{id} is de enige instantie: deze kan niet worden verwijderd.',
      'instancias.sin_puerto_libre': 'Er is geen vrije poort gevonden voor de instantie.',
      'instancias.confirmacion': 'Typ "{id}" om door te gaan.',
      'instancias.sin_datos':
        '{id} heeft geen gegevens in de map: kies een back-up om te herstellen.',
      'instancias.respaldo_no_existe': 'Die back-up van {id} bestaat niet.',
      'instancias.respaldo_en_uso':
        'Die kopie is nodig voor {id}, die geblokkeerd is: los dat eerst op.',
      'instancias.version_requerida':
        'Het is onduidelijk naar welke versie {id} moet worden teruggezet: kies een geïnstalleerde versie van dezelfde hoofdversie.',
      'instalador.version_en_uso':
        '{servicio} {version} kan niet worden verwijderd: deze wordt gebruikt door instantie {instancia}.',
      'limpieza.sin_confirmar': 'De bevestiging voor het opschonen van versies ontbreekt.',
      'limpieza.seleccion_invalida': 'De selectie van versies is ongeldig.',
      'limpieza.en_curso': 'Er is al een opschoning van versies bezig.',
      'limpieza.no_existe': '{servicio} {version} is niet meer geïnstalleerd.',
      'limpieza.en_uso': '{servicio} {version} is in gebruik genomen: niet verwijderd.',
      'limpieza.ruta_insegura':
        'De map van {servicio} {version} is niet veilig (een koppeling of een pad buiten bin): er is niets gewijzigd.',
      'limpieza.version_bloqueada':
        '{servicio} {version} bevat bestanden die in gebruik of vergrendeld zijn: niet verwijderd en niet half achtergelaten.',
      'limpieza.otro_volumen':
        '{servicio} {version} staat op een andere schijf dan de tijdelijke gegevensmap: kon niet volledig worden verplaatst en er is niets gewijzigd.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} bevat door u geïnstalleerde pakketten (npm, pip…): u moet accepteren dat deze verloren gaan om de versie te verwijderen.',
      'limpieza.destino_ocupado':
        'Er staat al een map van {servicio} {version} in bin: deze wordt niet overschreven. Verwijder deze eerst voordat u de andere herstelt.',
      'bd.encender_servicio': 'Schakel {nombre} in om de databases te beheren.',
      'bd.sin_credenciales': 'Er zijn geen opgeslagen inloggegevens voor {nombre}.',
      'bd.confirmacion_borrado': 'Typ de exacte naam om de database {nombre} te verwijderen.',
      'bd.usuario_privilegiado':
        'Gebruiker {usuario} is een beheerder of een systeemrol: kies een eigen gebruiker voor het project.',
      'bd.usuario_en_uso':
        'Een ander project gebruikt gebruiker {usuario} al: het wachtwoord wordt niet gewijzigd om de verbinding niet te verbreken. Er is niets aangemaakt.',
      'bd.rol_sin_login':
        'Gebruiker {usuario} bestaat, maar kan niet aanmelden (rol zonder LOGIN of toegangsregel van de server). Er is niets gewijzigd.',
      'bd.usuario_clave_distinta':
        'Gebruiker {usuario} bestaat al met een ander wachtwoord. Gebruik het huidige wachtwoord: het wordt niet gewijzigd om andere projecten niet zonder verbinding te zetten.',
      'bd.mongosh_faltante':
        'mongosh ontbreekt: installeer het via Diensten om MongoDB te beheren.',
      'tuneles.sitio_no_encontrado': 'Het project is niet gevonden.',
      'tuneles.confirmacion_requerida':
        'Het publiceren van {dominio} op internet vereist bevestiging in WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'De tunnel voor {dominio} is gewijzigd sinds de bevestiging: bevestig opnieuw.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared is niet geïnstalleerd. Installeer het via Diensten.',
      'tuneles.proveedor_no_disponible': 'De tunnelprovider {proveedor} is niet beschikbaar.',
      'tuneles.cloudflare_sin_cuenta': 'Koppel eerst uw Cloudflare-account in de tunnelopties.',
      'tuneles.cloudflare_sin_credencial':
        'Deze tunnel heeft geen opgeslagen inloggegevens: maak deze opnieuw aan in de tunnelopties.',
      'tuneles.cloudflare_datos_invalidos':
        'De tunnelnaam (kleine letters, cijfers en koppeltekens) of het openbare domein is ongeldig.',
      'tuneles.cloudflare_conexion_en_curso': 'Er is al een verbinding met Cloudflare bezig.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare heeft {registrado} geregistreerd in plaats van {dominio}: het domein behoort niet tot de zone die u heeft geautoriseerd. Verwijder dat record in het Cloudflare-dashboard.',
      'tuneles.cloudflare_conexiones_activas':
        'Tunnel {nombre} heeft actieve verbindingen (cloudflared vereist -f om deze te verwijderen). Sluit de tunnel af op alle apparaten waarop deze openstaat en probeer het opnieuw, of gebruik "Alleen hier vergeten".',
      'tuneles.nombre_en_uso': 'Tunnel {nombre} wordt al gebruikt door een andere site.',
      'tuneles.dominio_en_uso': 'Domein {dominio} wordt al gebruikt door een andere site.',
      'tuneles.confirmacion_olvidar':
        'Het vergeten of opnieuw aanmaken van tunnel {nombre} vereist bevestiging.',
      'tuneles.cloudflare_fallo': 'cloudflared kon de bewerking niet voltooien: {detalle}',
      'tuneles.credencial_no_protegida':
        'De inloggegevens konden niet worden beperkt tot de gebruiker en zijn daarom niet gebruikt.',
      'tuneles.sin_cifrado':
        'Systeemversleuteling is niet beschikbaar: inloggegevens kunnen niet worden opgeslagen.',
      'tuneles.token_invalido':
        'Het token is ongeldig: alleen letters, cijfers en _ . - (8 tot 200 tekens). Sla het opnieuw op in de tunnelopties.',
      'tuneles.ngrok_no_instalado':
        'ngrok is niet geïnstalleerd op dit systeem. Installeer het via ngrok.com en probeer het opnieuw.',
      'tuneles.ngrok_sin_token': 'Het ngrok-token ontbreekt: sla het op in de tunnelopties.',
      'tuneles.expose_sin_token': 'Het Expose-token ontbreekt: sla het op in de tunnelopties.',
      'tuneles.tailscale_no_instalado':
        'Tailscale is niet geïnstalleerd op dit systeem. WolfCore Dev installeert dit niet: installeer het via tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'U bent niet aangemeld bij Tailscale: meld u aan bij Tailscale en probeer het opnieuw.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale publiceert al iets op HTTPS-poort {puerto}. WolfCore Dev overschrijft dit niet: verwijder het via Tailscale en probeer het opnieuw.',
      'lan.sitio_no_encontrado': 'De site is niet gevonden.',
      'lan.confirmacion_requerida':
        'Het delen van {dominio} op het lokale netwerk vereist bevestiging in WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} bevat echte gegevens: deze wordt niet gedeeld op het lokale netwerk, ook niet met bevestiging. Gebruik een kopie zonder klantgegevens.',
      'lan.sin_red':
        'Er is geen lokaal netwerk verbonden (Wi-Fi of Ethernet). Maak verbinding met een netwerk en probeer het opnieuw.',
      'lan.ip_no_valida':
        'Adres {ip} hoort niet meer bij uw lokale netwerk. Open het dialoogvenster opnieuw en bevestig nogmaals.',
      'lan.requiere_https': '{dominio} stuurt door naar HTTPS: deel de site met de HTTPS-optie.',
      'lan.sin_puertos':
        'Er zijn geen vrije poorten tussen 8100 en 8199 voor het lokale netwerk (gedeelde sites en de CA-link gebruiken dit bereik). Stop het delen van een site of sluit het CA-dialoogvenster en probeer het opnieuw.',
      'tuneles.expose_no_instalado':
        'Expose is niet geïnstalleerd. Onder Windows werkt het alleen met expose.phar: plaats dit bestand in {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose wordt niet gebruikt voor sites met echte gegevens: de verzoekinspector is zichtbaar op het hele lokale netwerk. Gebruik een andere provider.',
      'tuneles.confirmacion_requerida_tailnet':
        'Het delen van {dominio} met uw tailnet vereist bevestiging in WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Kon niet lezen wat Tailscale al op dit systeem publiceert; er is daarom niets geopend om niets te overschrijven. Controleer of Tailscale actief is en probeer het opnieuw.',
      'tuneles.tailscale_no_habilitado':
        'Serve of Funnel is niet ingeschakeld op uw tailnet. Schakel dit in via {enlace} en probeer het opnieuw.',
      'tuneles.ngrok_desactualizado':
        'Uw ngrok is een oudere versie die niet ondersteunt wat WolfCore Dev nodig heeft. Werk het bij (ngrok update) en probeer het opnieuw.',
      'hosts.dominio_invalido': 'Er is een ongeldig domein.',
      'hosts.tiempo_agotado':
        'Geen reactie op de beheerdersmachtiging binnen {segundos} s; het hosts-bestand is ongewijzigd gebleven.',
      'https.sin_dominio': 'Een certificaat heeft minstens één domein nodig.',
      'https.sin_autoridad':
        'De certificeringsinstantie van WolfCore Dev bestaat niet. Installeer de CA via de sectie HTTPS voordat u certificaten uitgeeft.',
      'herramientas.pid_invalido': 'De PID is ongeldig.',
      'herramientas.pid_sistema': 'PID {pid} is een systeemproces en kan niet worden beëindigd.',
      'herramientas.proceso_propio':
        'WolfCore Dev en het proces dat het heeft gestart kunnen niet worden beëindigd.',
      'herramientas.proceso_inexistente': 'Proces {pid} bestaat niet meer.',
      'herramientas.sin_editor':
        'Er is geen code-editor gevonden. Installeer er een (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} is niet geïnstalleerd. Kies een andere editor in Instellingen.',
      'herramientas.editor_invalido': 'Die editor is ongeldig.',
      'herramientas.carpeta_sitio_inexistente': 'De projectmap bestaat niet.',
      'herramientas.ruta_no_absoluta': 'Het pad moet absoluut zijn.',
      'herramientas.sin_seleccion': 'Kies minstens één item.',
      'herramientas.dominio_invalido': 'Er is een ongeldig domein of IP-adres.',
      'herramientas.demasiados_dominios':
        'Een certificaat ondersteunt maximaal {maximo} domeinen of IP-adressen.',
      'buscar.consulta_invalida': 'Voer een zoekterm in (maximaal 500 tekens).',
      'buscar.raiz_invalida': 'De map of het bestand bestaat niet of is ongeldig.',
      'buscar.regex_invalida': 'De reguliere expressie is ongeldig.',
      'buscar.regex_lenta':
        'De reguliere expressie duurt te lang: vereenvoudig deze of gebruik letterlijke tekst.',
      'buscar.demasiadas': 'Er zijn al {maximo} zoekopdrachten actief: annuleer er een of wacht.',
      'terminal.no_abrio': 'De terminal kon niet worden geopend.',
      'terminal.no_instalada':
        '{nombre} is niet geïnstalleerd. Kies een andere terminal in Instellingen.',
      'terminal.invalida': 'Die terminal is ongeldig.',
      'terminal.powershell_restringido':
        'PowerShell staat op dit systeem in de beperkte taalmodus (organisatiebeleid of AppLocker): WolfCore Dev kan de terminal niet openen. Open deze zelf in de projectmap.',
      'proyectos.no_existe': 'Het project bestaat niet.',
      'proyectos.no_confiado':
        'Vink "Ik vertrouw deze repository" aan om het recept uit te voeren.',
      'proyectos.receta_en_curso': 'Er wordt al een recept uitgevoerd voor dit project.',
      'proyectos.paso_no_omitible': 'De stap "Site aanmaken" kan niet worden overgeslagen.',
      'workspaces.no_existe': 'Die workspace bestaat niet.',
      'workspaces.invalido': 'De workspace is ongeldig: controleer de naam en de onderdelen.',
      'workspaces.captadores_exclusivos':
        'Twee e-mailvangers kunnen niet tegelijk ingeschakeld zijn: er draait er slechts één.',
      'workspaces.elemento_fallo':
        'De bewerking met {elemento} kon niet worden voltooid. Controleer Diensten en de bijbehorende logboeken.',
      'workspaces.base_no_responde':
        '{elemento} is niet gestart omdat de database van dat project niet reageert.',
      'tareas.cron_invalida':
        'De cron-expressie is ongeldig. Gebruik 5 velden: minuut, uur, dag van de maand, maand en dag van de week (bijvoorbeeld 0 3 * * *).',
      'tareas.comando_invalido':
        'De opdracht is niet toegestaan. Gebruik php, node, npm run of python met een projectbestand, zonder inline code (-r, -e, -c).',
      'tareas.invalida': 'De taak is ongeldig: controleer de naam, het schema en de opdracht.',
      'tareas.no_existe': 'Die taak bestaat niet meer.',
      'tareas.sin_confirmar': 'Bevestig de opdracht van de taak om deze te kunnen uitvoeren.',
      'tareas.sitio_no_confiado':
        'Vink "Ik vertrouw deze repository" aan in het project om de taken uit te voeren.',
      'tareas.receta_cambio':
        'Het recept van het project is gewijzigd sinds u het vertrouwde: bekijk het opnieuw en vink "Ik vertrouw deze repository" nogmaals aan.',
      'tareas.aislado':
        'Dit is een map met testgegevens (WOLFCORE_DATOS): sta geplande taken toe om ze uit te voeren.',
      'tareas.carpeta': 'De projectmap bestaat niet: de taak kan niet worden uitgevoerd.',
      'tareas.en_curso': 'De taak wordt al uitgevoerd.',
      'tareas.demasiadas': 'Er zijn te veel taken in dit project (maximaal {maximo}).',
      'cli.no_autorizado':
        'De CLI-opdracht is niet geautoriseerd: voer deze opnieuw uit met de WolfCore Dev-app geopend.',
      'cli.orden_desconocida': 'WolfCore Dev kent die CLI-opdracht niet.',
      'cli.argumentos_invalidos': 'De argumenten van de opdracht zijn ongeldig.',
      'cli.solicitud_grande': 'Het verzoek is te groot (maximaal {maximo} bytes).',
      'cli.formato_no_admitido': 'Het verzoek heeft niet het formaat dat de CLI accepteert.',
      'cli.plazo':
        'De opdracht duurde te lang: deze is mogelijk nog actief. Controleer de status in WolfCore Dev.',
      'cli.ocupado': 'WolfCore Dev verwerkt te veel CLI-opdrachten: wacht een ogenblik.',
      'cli.requiere_confirmacion':
        'Deze opdracht publiceert of wijzigt iets en vereist bevestiging (--si) op {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} bevat echte gegevens: bevestig ook met de optie voor echte gegevens van de opdracht (het domein van de site).',
      'cli.requiere_confirmacion_global':
        'Het wijzigen van PHP voor alle terminals vereist bevestiging (--si).',
      'cli.confirmacion_rechazada':
        'De bevestiging in het WolfCore Dev-venster is geweigerd of was niet beschikbaar: er is niets uitgevoerd.',
      'cli.confirmacion_vencida':
        'Niemand heeft op tijd bevestigd in het WolfCore Dev-venster: er is niets uitgevoerd.',
      'cli.tunel_fallo':
        'De tunnel kon niet worden geopend. Controleer het logboek in WolfCore Dev.',
      'cli.inicio_fallo':
        'Niet alles wat werd aangevraagd kon worden gestart. Controleer de logboeken in WolfCore Dev.',
      'cli.parada_fallo':
        'Niet alles wat werd aangevraagd kon worden gestopt. Controleer de logboeken in WolfCore Dev.',
      'cli.interno': 'Interne fout van de CLI-server.',
      'cli.proveedor_distinto':
        'De site gebruikt een andere tunnelprovider ({proveedor}). Controleer en bevestig opnieuw.',
      'cli.sitio_no_encontrado': 'Site {sitio} bestaat niet.',
      'cli.carpeta_invalida':
        'De map bestaat niet, is een systeemmap of is de gegevensmap van WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Die map hoort niet bij een site van WolfCore Dev: koppel deze eerst.',
      'cli.ya_vinculada': 'Die map is al gekoppeld aan site {sitio}.',
      'cli.tipo_no_soportado':
        'Projecten van het type {tipo} worden aangemaakt via de interface van WolfCore Dev.',
      'cli.sitio_sin_php': 'Site {sitio} gebruikt geen PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} is niet geïnstalleerd. Installeer deze via Diensten.',
      'cli.fuente_no_existe': 'Dat logboek bestaat nog niet.',
      'cli.token_no_protegido':
        'Het tokenbestand kon niet worden beperkt tot de huidige gebruiker: de CLI wordt niet geactiveerd.',
      'cli.carpeta_ajena':
        'De map run/ in de gegevensmap is van een andere gebruiker: de CLI wordt niet geactiveerd.',
      'cli.ruta_invalida': 'Het pad van WolfCore Dev bevat tekens die wolf.cmd niet ondersteunt.',
      'cli.path_aislado':
        'Met een map voor testgegevens (WOLFCORE_DATOS) wordt het gebruikers-PATH niet gewijzigd.',
      'cli.sin_cliente':
        'Deze versie van WolfCore Dev bevat de wolf-client niet (moet nog worden gecompileerd).',
      'cli.demasiados_dialogos':
        'Te veel bevestigingen in de afgelopen minuut: wacht een ogenblik en probeer het opnieuw.',
      'cli.error': 'De opdracht kon niet worden voltooid: {detalle}',
      'proyectos.carpeta_no_vacia':
        'De projectmap bevat al bestanden: kies een andere map of maak deze leeg.',
      'secretos.sin_cifrado':
        'Systeemversleuteling is niet beschikbaar: het wachtwoord van de eigen gebruiker kan niet worden opgeslagen. Er is niets gewijzigd.',
      'proyectos.clave_bd_falta':
        'Het opgeslagen wachtwoord van gebruiker {usuario} ontbreekt: er is niets geschreven. In de .env-beheerder genereert "Eigen gebruiker gebruiken" een nieuw wachtwoord.',
      'env.archivo_grande': 'Het variabelenbestand is te groot (maximaal {maximo}).',
      'env.no_regular':
        'Het .env-bestand is geen regulier bestand: het wordt niet gelezen of gewijzigd.',
      'env.clave_inexistente': 'Variabele {clave} bestaat niet.',
      'env.cambio_invalido': 'Een wijziging in het .env-bestand is ongeldig.',
      'env.variable_invalida': 'De wijziging van variabele {clave} is ongeldig.',
      'env.solo_lectura':
        'Variabele {clave} beslaat meerdere regels: bewerk deze handmatig in het bestand.',
      'env.usuario_compartido':
        'Database {base} wordt ook gebruikt door project {proyecto}: bevestig of u de gebruiker wilt delen.',
      'env.cambio_externo':
        'Het .env-bestand is gewijzigd sinds het voorbeeld werd getoond: controleer het opnieuw voordat u opslaat.',
      'env.sin_confirmar': 'Bevestig dat u de wijzigingen in het .env-bestand wilt opslaan.',
      'env.versionado':
        'Git volgt het .env-bestand van dit project al: bij de volgende commit worden de waarden geüpload. Bevestig afzonderlijk om door te gaan.',
      'env.versionado_desconocido':
        'Kon niet controleren of git het .env-bestand van dit project volgt: bevestig afzonderlijk om door te gaan.',
      'env.copia_invalida': 'De kopie van het .env-bestand is ongeldig of bestaat niet meer.',
      'env.sin_base': 'Het .env-bestand van dit project bevat geen verbinding met een database.',
      'env.base_no_resuelta':
        'De database van dit project hoort niet bij een lokale server van WolfCore Dev: er is niets gewijzigd.',
      'env.motor_no_soportado':
        'Voorlopig werkt "Eigen gebruiker gebruiken" alleen met MySQL en MariaDB.',
      'env.ya_usa_usuario_propio': 'Dit project gebruikt al een eigen gebruiker.',
      'plantillas.id_invalido': 'De id van de sjabloon is ongeldig.',
      'plantillas.no_existe': 'De sjabloon bestaat niet.',
      'plantillas.danada':
        'De sjabloon is beschadigd of gewijzigd en wordt niet gebruikt. Verwijder deze en sla hem opnieuw op.',
      'plantillas.demasiado_grande':
        'Het project heeft te veel bestanden of is te groot om als sjabloon op te slaan (tot {maximo} bestanden). Sluit grote mappen uit.',
      'plantillas.demasiado_pesada':
        'Het project is te groot om als sjabloon op te slaan (tot {maximo}). Sluit grote mappen uit.',
      'plantillas.exclusion_invalida':
        'Een van de uitsluitingen is ongeldig (gebruik namen of relatieve paden, zonder "..").',
      'plantillas.nombre_invalido': 'De naam van de sjabloon is ongeldig (1 tot 60 tekens).',
      'plantillas.esquema_fallo':
        'Het databaseschema van het project kon niet worden gelezen: controleer of de bijbehorende dienst is ingeschakeld.',
      'plantillas.base_no_resuelta':
        'De sjabloon kan niet worden opgeslagen: de databaseserver is extern of geen enkele lokale dienst gebruikt die poort.',
      'plantillas.sin_generador_base':
        'Dit projecttype heeft geen basisgenerator: de sjabloon moet de projectbestanden bevatten.',
      'plantillas.exclusiones_nuevas':
        'De sjabloon bevat een bestand dat nu wordt uitgesloten ({archivo}): sla de sjabloon opnieuw op vanuit het project of verwijder deze.',
      'plantillas.motor_distinto':
        'Het schema van de sjabloon is van MySQL en de gekozen server is MariaDB (of andersom): er kunnen verschillen zijn. Bevestig dat u wilt doorgaan.',
      'bd.sql_no_permitido':
        'Het schema bevat een instructie die niet voor de structuur is bedoeld en er is niets uitgevoerd: {sentencia}',
      'bd.extension_no_permitida':
        'Het schema vraagt om extensie {nombre}, die niet op de toegestane lijst staat: er is niets hersteld.',
      'bd.esquema_fallo':
        'Het volledige schema kon niet worden hersteld: er is niets half achtergelaten.',
      'bd.datos_no_permitidos':
        'De gegevensdump bevat iets anders dan gegevens (alleen INSERT, LOCK TABLES en SET zijn toegestaan): er is niets geïmporteerd.',
      'bd.datos_fallo':
        'De gegevens konden niet worden geïmporteerd: de database is ongewijzigd gebleven, zonder halve wijzigingen.',
      'perfiles.destino_invalido':
        'Kies waar u het profiel wilt opslaan (een .wolfperfil-bestand).',
      'perfiles.frase_debil': 'De wachtwoordzin van de CA moet minstens {minimo} tekens bevatten.',
      'perfiles.frase_incorrecta': 'De wachtwoordzin is onjuist: er is niets geïmporteerd.',
      'perfiles.certificados_sin_ca':
        'De certificaten van de sites worden alleen samen met de versleutelde CA meegenomen: voeg de CA met een wachtwoordzin toe.',
      'perfiles.no_existe': 'Het profielbestand bestaat niet.',
      'perfiles.danado': 'Het profiel is beschadigd of gewijzigd: er is niets geïmporteerd.',
      'perfiles.demasiado_grande': 'Het profiel is te groot (maximaal {maximo}).',
      'perfiles.version_no_soportada':
        'Het profiel is afkomstig uit een nieuwere versie van WolfCore Dev (formaat {version}): werk de app bij om het te importeren.',
      'perfiles.sin_confirmar': 'Bevestig dat u het profiel wilt importeren.',
      'perfiles.vista_previa_vieja':
        'De gegevensmap of het profiel is gewijzigd sinds het voorbeeld: controleer het opnieuw.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS is geen geldige gegevensmap: het pad moet absoluut zijn, geen systeemmap zijn en verschillen van de echte map.',
      'perfiles.confirmar_reemplazar_ca':
        'Het profiel bevat een CA en deze computer heeft al een eigen CA: vergelijk de vingerafdruk en bevestig afzonderlijk dat u deze wilt vervangen (alleen als het uw eigen CA is).',
      'herramientas.imagen_tipo':
        'Dat bestand is geen ondersteunde afbeelding (PNG, JPG, WebP, GIF, BMP of ICO) of de inhoud komt niet overeen met het type.',
      'herramientas.imagen_grande': 'De afbeelding is te groot (maximaal {maximo}).',
      'herramientas.imagen_dimensiones':
        'De afbeelding is te groot ({ancho}×{alto} px; maximaal {maximo} px per zijde) en wordt om veiligheidsredenen niet geopend.',
      'herramientas.zip_sin_archivos':
        'Er zijn geen bestanden om te comprimeren (koppelingen worden niet gevolgd).',
      'herramientas.zip_demasiados':
        'Er zijn te veel bestanden om te comprimeren (maximaal {maximo}).',
      'herramientas.zip_grande': 'Wat u wilt comprimeren is te groot (maximaal {maximo}).',
      'herramientas.pdf_invalido': 'Het bestand is geen PDF die geoptimaliseerd kan worden.',
      'herramientas.pdf_grande': 'De PDF is te groot (maximaal {maximo}).',
      'herramientas.pdf_cifrado':
        'De PDF is beveiligd met een wachtwoord en kan niet worden geoptimaliseerd.',
      'herramientas.pdf_plazo': 'De PDF duurde langer dan {segundos} s en is geannuleerd.',
      'herramientas.salida_ocupada': 'Er is geen vrije naam gevonden voor het nieuwe bestand.',
      'conversor.formato': 'Die conversie is niet beschikbaar.',
      'conversor.archivo_invalido':
        'Het bestand is beschadigd of heeft niet het type dat de extensie aangeeft.',
      'conversor.archivo_grande': 'Het bestand is te groot (maximaal {maximo}).',
      'conversor.archivo_peligroso':
        'Het bestand lijkt op een ZIP-bom of is gemanipuleerd (te veel inhoud, XML-entiteiten of ongeldige namen) en wordt om veiligheidsredenen niet geopend.',
      'conversor.limite_filas': 'De tabel heeft te veel rijen (maximaal {maximo}).',
      'conversor.limite_columnas': 'De tabel heeft te veel kolommen (maximaal {maximo}).',
      'conversor.limite_paginas': "De PDF heeft te veel pagina's (maximaal {maximo}).",
      'conversor.pdf_cifrado':
        'De PDF is beveiligd met een wachtwoord en kan niet worden geconverteerd.',
      'conversor.plazo': 'De conversie duurde langer dan {segundos} s en is geannuleerd.',
      'conversor.cancelado': 'Conversie geannuleerd.',
      'conversor.libreoffice_ausente':
        'Voor die conversie is LibreOffice nodig en dat is niet geïnstalleerd op deze computer (WolfCore Dev installeert het niet).',
      'conversor.libreoffice_fallo': 'LibreOffice kon het document niet converteren.',
      'conversor.limite_celdas': 'De tabel heeft te veel cellen (maximaal {maximo}).',
      'conversor.memoria':
        'Het bestand vereist te veel geheugen (meer dan {maximo}) en is geannuleerd.',
      'conversor.pdf_no_disponible': 'Afdrukken naar PDF is op dit moment niet beschikbaar.',
      'herramientas.imagen_pixeles':
        'De afbeelding heeft in totaal te veel pixels ({ancho}×{alto} px; maximaal {maximo}) en wordt om veiligheidsredenen niet geopend.',
      'herramientas.zip_cambio':
        'Een bestand is gewijzigd tijdens het comprimeren: probeer het opnieuw.',
      'herramientas.pdf_demasiado_complejo':
        'De PDF is te complex (zou meer geheugen innemen dan toegestaan) en is geannuleerd.',
      'herramientas.salida_denegada':
        'Er kan niet naar die locatie worden geschreven: controleer de rechten of of de map bestaat.',
      'herramientas.fuera_de_la_ca':
        'De CA van WolfCore Dev ondertekent alleen .test-domeinen, localhost en lokale adressen: {dominio} kan niet worden opgenomen.',
      'perfiles.frase_requerida':
        'Voer de wachtwoordzin van het profiel in om de databases of de CA te importeren (of importeer zonder de databases).',
      'perfiles.sin_espacio':
        'Er is onvoldoende vrije ruimte om het profiel te importeren: {necesarios} vereist en {libres} beschikbaar.',
      'perfiles.ca_sin_restricciones':
        'Deze CA kan elke website ondertekenen: importeer deze alleen als het uw eigen CA is en vergelijk de vingerafdruk. Bevestig dit afzonderlijk om door te gaan.',
      'perfiles.ca_restricciones_ajenas':
        'De CA van het profiel heeft naambeperkingen die niet van WolfCore Dev zijn: deze wordt niet geïmporteerd.',
      'perfiles.instantanea_fallo':
        'De voorafgaande back-up van de omgeving kon niet worden opgeslagen: er is niets gewijzigd. Controleer de schijfruimte en de rechten van de gegevensmap.',
      'perfiles.en_curso': 'Er is al een profielimport bezig: wacht tot deze is voltooid.',
      'importar.origen_apagado':
        'Kan geen verbinding maken met de databaseserver van het andere programma: start deze vanuit dat programma en probeer het opnieuw. De sites zijn wel geïmporteerd.',
      'importar.origen_no_local': 'De bronserver moet zich op deze computer bevinden (127.0.0.1).',
      'importar.origen_rechazado':
        'De bronserver heeft de gebruikersnaam of het wachtwoord geweigerd.',
      'importar.origen_version':
        'De versie van de bronserver kan niet worden geïmporteerd met wat er in WolfCore Dev is geïnstalleerd.',
      'importar.volcado_enorme':
        'De databasegegevens zijn groter dan {maximo} MB: ze worden niet in één keer geïmporteerd.',
      'importar.motor_no_soportado':
        "Er worden alleen MySQL- en MariaDB-databases uit andere programma's geïmporteerd.",
      'importar.ruta_fuera':
        'Een map of bestand dat buiten de installatie of naar een systeemmap verwijst, is overgeslagen.',
      'importar.carpeta_invalida': 'Een map die niet meer bestaat of geen map is, is overgeslagen.',
      'importar.archivo_grande':
        'Een configuratiebestand is groter dan {maximo} KB en is niet gelezen.',
      'importar.archivo_ilegible':
        'Een configuratiebestand is geen tekstbestand of kon niet worden gelezen.',
      'importar.demasiados':
        'Er zijn te veel sites of configuratiebestanden: alleen de eerste zijn gelezen.',
      'importar.candidato_desconocido':
        'Die site verschijnt niet meer in het bronprogramma: zoek opnieuw.',
      'importar.ya_vinculado': 'Die map is al een site van WolfCore Dev.',
      'importar.dominio_existe':
        'Er bestaat al een site met het domein {dominio}: wijzig dit voordat u importeert.',
      'importar.sin_php':
        'Deze site heeft PHP nodig en er is geen versie geïnstalleerd: installeer deze via Diensten.',
      'importar.base_existe':
        'De database {nombre} bestaat al op de bestemming en is ongemoeid gelaten. Bevestig het vervangen om deze te importeren (er wordt vooraf een back-up gemaakt).',
      'importar.base_fallo':
        'De database {nombre} kon niet worden geïmporteerd: deze is ongewijzigd gebleven, zonder halve wijzigingen.',
      'importar.sitio_fallo': 'De site kon niet worden aangemaakt.',
      'importar.origen_invalido':
        'De gegevens van de bronserver zijn ongeldig (gebruikersnaam, wachtwoord of poort).',
      'importar.sin_seleccion': 'Kies minstens één site om te importeren.',
      'importar.en_curso': 'Er is al een import bezig: wacht tot deze is voltooid.',
      'importar.cancelado': 'Import geannuleerd: wat werd geïmporteerd, is ongewijzigd gebleven.',
      'importar.origen_estancado':
        'De server van het andere programma reageerde niet meer tijdens de dump: de database is niet geïmporteerd.',
      'importar.sin_espacio':
        'Er is onvoldoende vrije ruimte om de database te importeren: ongeveer {necesarios} MB vereist en {libres} MB beschikbaar.',
      'importar.origen_fallo': 'De database van het andere programma kon niet worden gedumpt.',
      'importar.clave_no_ascii':
        'Het wachtwoord bevat accenten of symbolen die niet aan de dump kunnen worden doorgegeven: gebruik een wachtwoord met alleen ASCII-tekens.',
      'plantillas.sin_esquema': 'De sjabloon bevat geen databaseschema.',
      'proyectos.carpeta_invalida': 'De projectmap is ongeldig.',
      'proyectos.nombre_invalido':
        'De projectnaam mag alleen kleine letters, cijfers en koppeltekens bevatten (maximaal 40).',
      'proyectos.argumento_invalido': 'Een projectgegeven is ongeldig (veld: {campo}).',
      'proyectos.base_existe': 'De database {nombre} bestaat al: kies een andere naam.',
      'proyectos.dominio_existe': 'Er bestaat al een site met het domein {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Die map behoort tot het project {dominio} of bevindt zich erin: kies een andere map.',
      'proyectos.sin_python': 'Python is niet geïnstalleerd: installeer het via Diensten.',
      'proyectos.venv_ajeno':
        'Het project bevat een eigen .venv en WolfCore Dev voert geen Python uit een externe repository uit: verwijder deze en maak de omgeving opnieuw aan.',
      'proyectos.paso_base_no_omitible':
        'De stap "Database aanmaken" van een nieuw project kan niet worden overgeslagen.',
      'proyectos.sin_php': 'PHP is niet geïnstalleerd: installeer het via Diensten.',
      'proyectos.php_no_instalado':
        'PHP {version} is niet geïnstalleerd: installeer deze via Diensten.',
      'proyectos.python_no_instalado':
        'Python {version} is niet geïnstalleerd: installeer deze via Diensten.',
      'mcp.token_invalido': 'Het token van de MCP-server is ongeldig.',
      'mcp.solicitud_cancelada':
        'De MCP-client heeft het verzoek geannuleerd: de actie is niet uitgevoerd.',
      'doctor.puerto_ocupado':
        'Poort {puerto} van {servicio} wordt gebruikt door een ander programma ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) gebruikt poort {puerto} van {servicio}.',
      'doctor.puerto_http_sys':
        'Een Windows-dienst ({programa}) gebruikt poort {puerto} van {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} gebruikt poort {puerto} van {servicio}. Sluit het af of wijzig de poort van WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} gebruikt poort {puerto} van {servicio}.',
      'doctor.puerto_skype': '{programa} gebruikt poort {puerto} van {servicio}.',
      'doctor.puerto_reservado':
        'Poort {puerto} van {servicio} ligt in een door Windows gereserveerd bereik ({desde}-{hasta}: Hyper-V, WSL of Docker).',
      'doctor.ca_por_vencer':
        'De certificeringsinstantie van WolfCore Dev verloopt over {dias} dagen.',
      'doctor.ca_vencida': 'De certificeringsinstantie van WolfCore Dev is verlopen.',
      'doctor.certificado_por_vencer': 'Het certificaat van {dominio} verloopt over {dias} dagen.',
      'doctor.certificado_vencido': 'Het certificaat van {dominio} is verlopen.',
      'doctor.hosts_ilegible': 'Het hosts-bestand kon niet worden gelezen.',
      'doctor.hosts_utf16':
        'Het hosts-bestand is opgeslagen in UTF-16: Windows leest de vermeldingen mogelijk niet.',
      'doctor.hosts_bloque_duplicado':
        'Het hosts-bestand heeft {bloques} blokken van WolfCore Dev; dat moet er één zijn.',
      'doctor.hosts_bloque_sin_cierre':
        'Een blok van WolfCore Dev in het hosts-bestand mist de afsluitmarkering.',
      'doctor.hosts_dominios_faltantes':
        'Er ontbreken {cantidad} domeinen van uw sites in het hosts-bestand.',
      'doctor.hosts_solo_lectura':
        'Het hosts-bestand is alleen-lezen (vaak ingesteld door een antivirusprogramma). WolfCore Dev kan het toch schrijven met administratorrechten.',
      'doctor.path_duplicados':
        'De gebruikers-PATH bevat {cantidad} dubbele vermeldingen van WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Een andere map met {programa} ({origen}) staat vóór WolfCore Dev in de PATH: in terminals wordt die gebruikt.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) ontbreekt: PHP en andere diensten starten zonder dit pakket niet.',
      'doctor.enlazador_msvc_ausente':
        "Rust is geïnstalleerd, maar de C++-hulpprogramma's van Visual Studio Build Tools (MSVC-linker) ontbreken: cargo kan de programma's niet linken.",
      'doctor.antivirus_sin_exclusion':
        'De antivirusscanner controleert de gegevensmap van WolfCore Dev: PHP en de diensten kunnen traag opstarten.',
      'doctor.firewall_reglas':
        "Windows laat binnenkomend netwerkverkeer toe via {cantidad} regel(s) voor programma's van WolfCore Dev (nginx, PHP of databases) in de profielen {perfiles}: die programma's staan open voor het netwerk.",
      'doctor.firewall_no_comprobado':
        'De Windows-firewall kon niet worden gecontroleerd (mogelijk zijn administratorrechten vereist).',
      'doctor.firewall_reglas_ajenas':
        "Er zijn {cantidad} binnenkomende regel(s) van andere programma's (FlyEnv, Laragon, XAMPP of andere) met nginx, PHP of databases in de profielen {perfiles}. Deze zijn niet van WolfCore Dev: ze worden alleen getoond en nooit vanaf hier verwijderd.",
      'doctor.servicio_en_error': '{servicio} bevindt zich in een foutstatus.',
      'doctor.revision_fallida': 'De controle {revision} kon niet worden voltooid.',
      'doctor.confirmacion_requerida': 'Bevestig de reparatie voordat u deze toepast.',
      'doctor.hallazgo_desconocido':
        'Die bevinding bestaat niet meer: voer de controle opnieuw uit.',
      'doctor.solo_informa':
        'Deze bevinding heeft geen automatische reparatie: volg de aanwijzingen.',
      'doctor.reparacion_fallida': 'De reparatie kon niet worden toegepast.',
      'doctor.reparacion_cancelada':
        'De administratorrechten zijn geannuleerd: er is niets gewijzigd.',
      'doctor.reparacion_denegada':
        'Windows of een antivirusprogramma heeft de toegang geweigerd: er is niets gewijzigd.',
      'doctor.ya_resuelto': 'Het probleem bestond niet meer: er hoefde niets te worden gewijzigd.',
      'doctor.ca_vieja_sin_quitar':
        'De nieuwe certificeringsinstantie is al in gebruik, maar de vorige kon niet uit het Windows-certificaatarchief worden verwijderd. U kunt deze verwijderen via de sectie HTTPS.',
      'doctor.sin_puerto_libre': 'Er is geen vrije poort gevonden om de dienst te verplaatsen.',
      'doctor.ca_vuelta_atras_incompleta':
        'De nieuwe certificeringsinstantie kon niet worden toegepast en het terugdraaien is onvolledig gebleven. Controleer de sectie HTTPS; er staat een back-up met datum in etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox vertrouwt de certificeringsinstantie van WolfCore Dev niet in {cantidad} profielen (het gebruikt zijn eigen archief).',
      'confianza.sin_ca': 'Er is nog geen certificeringsinstantie: maak deze aan via HTTPS.',
      'confianza.sin_raices':
        'Er zijn geen vertrouwde basiscertificaten voor Python gevonden (noch certifi, noch die van Windows): er is niets gewijzigd.',
      'confianza.node_variable_ajena':
        'U heeft al een eigen NODE_EXTRA_CA_CERTS: WolfCore Dev vervangt deze niet.',
      'confianza.variable_fallida': 'De gebruikersvariabele kon niet worden gewijzigd.',
      'firefox.abierto': 'Firefox is geopend: sluit het af en probeer het opnieuw.',
      'firefox.error':
        'De user.js van dat profiel kon niet worden gewijzigd; deze is ongewijzigd gebleven.',
      'firefox.fuera':
        'Er zijn profielen buiten de Firefox-map: schakel ze in via CA-vertrouwen, met uw afzonderlijke bevestiging.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS verwijst niet meer naar de certificeringsinstantie van WolfCore Dev (handmatig gewijzigd): deze is niet verwijderd.',
      'ia.clave_invalida':
        'De provider heeft de sleutel geweigerd: controleer deze of genereer een nieuwe.',
      'ia.sin_saldo': 'Het account bij de provider heeft geen saldo of quotum beschikbaar.',
      'ia.limite': 'De provider heeft de verzoeken beperkt: wacht even en probeer het opnieuw.',
      'ia.region': 'De provider biedt geen dienstverlening vanuit uw land of regio.',
      'ia.sin_red':
        'Kan geen verbinding maken met de provider: controleer het netwerk of de basis-URL.',
      'ia.url_invalida':
        'De basis-URL is ongeldig: gebruik https:// (of http:// alleen naar 127.0.0.1 of [::1]), zonder gebruikersnaam of wachtwoord.',
      'ia.plazo': 'De provider heeft niet binnen {segundos} s gereageerd.',
      'ia.respuesta_rara': 'De provider gaf een onverwacht antwoord.',
      'ia.cancelado': 'Het verzoek aan de provider is geannuleerd.',
      'ia.sin_clave': 'Deze provider heeft een sleutel nodig: sla deze eerst op.',
      'ia.clave_mal_formada': 'De sleutel heeft geen geldig formaat (geen spaties of regeleinden).',
      'ia.modelo_invalido': 'De modelnaam is ongeldig.',
      'ia.modelo_no_disponible': 'Het model bestaat niet of uw account heeft er geen toegang toe.',
      'ia.proveedor_invalido': 'De configuratie van de provider is ongeldig.',
      'ia.env_conflicto':
        'De .env definieert {claves} al met een andere waarde: bevestig of u deze wilt vervangen.',
      'ia.env_sin_confirmar':
        'Bevestig dat u de sleutel naar de .env wilt schrijven (deze wordt in platte tekst opgeslagen).',
      'ia.env_versionado':
        'Git volgt de .env van dit project al: bij de volgende commit wordt de sleutel geüpload, ook al staat deze in .gitignore. Verwijder het bestand uit de index met git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Kon niet controleren of git de .env van dit project al volgt: bevestig afzonderlijk dat u de sleutel wilt schrijven.',
      'ia.proveedor_no_existe': 'De AI-provider bestaat niet meer.',
      'ia.url_cambia_con_clave':
        'De provider heeft een opgeslagen sleutel: bevestig dat u deze naar de nieuwe URL wilt verzenden.',
      'ia.mensaje_sin_confirmar':
        'Bevestig het verzenden van het testbericht (dit verbruikt tokens van uw account).',
      'ia.clave_ilegible':
        'De opgeslagen sleutel van de provider kon niet worden gelezen: verwijder deze en sla deze opnieuw op.',
      'ia.argumento_invalido': 'Ongeldig gegeven ({campo}).',
      'correo.auth': 'De provider heeft de gebruikersnaam of het wachtwoord geweigerd.',
      'correo.conexion':
        'Kan geen verbinding maken met de SMTP-server: controleer de host en de poort.',
      'correo.tls':
        'Er kon geen geldige versleutelde verbinding met de server tot stand worden gebracht (certificaat, naam of STARTTLS). Er is niets verzonden.',
      'correo.rechazado':
        'De server heeft het bericht of een adres geweigerd. Controleer de afzender: veel providers accepteren alleen een geverifieerde afzender of domein.',
      'correo.plazo': 'De server heeft niet op tijd gereageerd (20 s).',
      'correo.host_invalido':
        'De SMTP-server moet een hostnaam of IP-adres zijn, zonder schema, poort of pad.',
      'correo.host_local':
        'Die server verwijst naar deze computer of het lokale netwerk: bevestig dit om hem te gebruiken.',
      'correo.destinatario_invalido': 'Het bestemmingsadres is ongeldig.',
      'correo.proveedor_invalido': 'De gegevens van de provider zijn ongeldig.',
      'correo.proveedor_no_existe': 'De e-mailprovider bestaat niet meer.',
      'correo.sin_clave': 'De provider heeft geen opgeslagen sleutel.',
      'correo.clave_ilegible':
        'De opgeslagen sleutel van de provider kon niet worden gelezen: verwijder deze en sla deze opnieuw op.',
      'correo.cambia_con_clave':
        'De provider heeft een opgeslagen sleutel: bevestig dat u deze naar de nieuwe server wilt verzenden.',
      'correo.env_sin_confirmar': 'Bevestig dat u de e-mailvariabelen naar de .env wilt schrijven.',
      'correo.ocupado': 'Er is al een testverzending bezig.',
      'correo.limite': 'Wacht {segundos} s vóór een volgende testverzending.',
      'correo.clave_mal_formada':
        'De sleutel heeft geen geldig formaat: alleen afdrukbare tekens, geen regeleinden en maximaal 4096 tekens.',
      'correo.argumento_invalido': 'Ongeldig gegeven ({campo}).',
      'agentes.no_existe': 'Die agent wordt niet ondersteund.',
      'agentes.sin_confirmar': 'Bevestig de actie in het dialoogvenster voordat u doorgaat.',
      'agentes.no_instalable':
        'Deze agent wordt niet vanuit WolfCore Dev geïnstalleerd: volg de officiële handleiding ({guia}).',
      'agentes.sin_node': 'Installeer Node via Diensten om de agent te kunnen installeren.',
      'agentes.node_antiguo':
        '{agente} vereist Node {requerida} of hoger en de versie die gebruikt zou worden is {actual}. Installeer een nieuwere Node via Diensten.',
      'agentes.node_version_desconocida':
        'De versie van Node kon niet worden bepaald en {agente} vereist Node {requerida} of hoger. Controleer Node in Diensten.',
      'instalador.zip_demasiado_grande':
        'Het gedownloade pakket is te groot of bevat te veel bestanden: het wordt niet geïnstalleerd.',
      'rust.rustup_init_fallo': 'rustup-init is niet goed afgesloten (code {codigo}): {detalle}',
      'rust.toolchain_fallo':
        'Rust {version} kon niet worden geïnstalleerd (code {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} kon niet worden verwijderd: {detalle}',
      'rust.descarga_fallo': 'rustup kon niet worden gedownload (HTTP {estado}).',
      'agentes.instalacion_fallo': 'De agent kon niet worden geïnstalleerd: {detalle}',
      'agentes.no_instalado': '{agente} is niet geïnstalleerd.',
      'agentes.mcp_no_soportado':
        '{agente} documenteert niet hoe het token uit een omgevingsvariabele wordt gelezen: MCP wordt er niet voor geregistreerd.',
      'agentes.config_ilegible':
        '{archivo} kon niet worden geïnterpreteerd; het is niet gewijzigd. Controleer het handmatig.',
      'agentes.config_en_uso':
        '{archivo} is gewijzigd terwijl WolfCore Dev het bewerkte: sluit de agent en probeer het opnieuw. Het bestand is niet gewijzigd.',
      'agentes.proveedor_incompatible': '{agente} kan die AI-provider niet gebruiken.',
      'agentes.sin_cambios_preparados':
        'Er zijn geen voorbereide wijzigingen (git add) om te beschrijven.',
      'agentes.argumento_invalido': 'Ongeldig gegeven ({campo}).',
      'git.commit_fallo': 'De commit kon niet worden uitgevoerd: {detalle}',
      'git.mensaje_invalido': 'Het commitbericht is leeg of ongeldig.',
      'php.rama_no_instalada': 'PHP {rama} is niet geïnstalleerd.',
      'php.argumento_invalido': 'Ongeldig gegeven ({campo}).',
      'php.valor_invalido': 'De waarde van {clave} is ongeldig.',
      'php.ini_invalido':
        'PHP start niet met die php.ini; er is niets opgeslagen. Uitvoer: {salida}',
      'php.no_arranco':
        'PHP {rama} startte niet opnieuw na de wijziging; de vorige configuratie is hersteld en reageert weer als voorheen.',
      'php.caido_tras_restaurar':
        'PHP {rama} startte niet opnieuw; de vorige configuratie is hersteld, maar reageert nog steeds niet. Controleer Diensten en de PHP-logboeken.',
      'php.respaldo_no_existe': 'Die back-up van php.ini bestaat niet.',
      'php.extension_no_existe': 'De extensie {nombre} staat niet in de map ext van deze versie.',
      'php.extension_no_catalogo':
        'De extensie {nombre} staat niet in de catalogus voor deze versie.',
      'php.variante_desconocida': 'Er kon niet worden bepaald hoe deze PHP-versie is gecompileerd.',
      'php.sin_variante': 'De catalogus bevat {nombre} niet voor de compilatie {variante}.',
      'php.huella_distinta':
        'De download komt niet overeen met de gepubliceerde vingerafdruk; er is niets geïnstalleerd.',
      'php.descarga_fallida': 'De extensie kon niet worden gedownload: {detalle}',
      'php.extension_en_uso':
        'De DLL van {nombre} is in gebruik. Stop PHP {rama} en probeer het opnieuw.',
      'php.extension_sin_dll':
        'De DLL van {nombre} kon niet worden vervangen en de map ext van PHP {rama} bleef zonder achter. Stop PHP {rama} en probeer het opnieuw: de vorige wordt bij het starten teruggeplaatst.',
      'php.sitio_sin_php': 'Die site gebruikt geen PHP.',
      'php.sitio_no_arranco':
        'De eigen PHP-instantie van {sitio} reageerde niet na de wijziging; de vorige configuratie is hersteld.',
      'php.sin_puertos_sitio':
        'Er zijn geen vrije poorten meer voor de eigen PHP-instanties van de sites.',
      'xdebug.launch_invalido':
        'De .vscode/launch.json van het project kan niet worden geïnterpreteerd; er is niets gewijzigd.',
      'xdebug.launch_no_seguro':
        'De map .vscode of het bestand launch.json is een koppeling of iets anders: daar wordt niet in geschreven.',
      'xdebug.sin_configurar': 'Configureer Xdebug op de site voordat u de launch.json genereert.',
      'nginx.sitio_no_existe': 'Die site bestaat niet meer.',
      'nginx.texto_invalido': 'De vhost-tekst is te lang, is leeg of bevat besturingstekens.',
      'nginx.sintaxis': 'Regel {linea}: {detalle}. Er is niets gewijzigd.',
      'nginx.directiva_prohibida':
        'Regel {linea}: "{directiva}" is niet toegestaan in de vhost van een site (dit kan andere sites of bestanden buiten het project beïnvloeden). Er is niets gewijzigd.',
      'nginx.ruta_fuera':
        'Regel {linea}: "{directiva}" verwijst buiten de projectmap of de bijbehorende logboeken en certificaten. Er is niets gewijzigd.',
      'nginx.fuera_de_server':
        'Regel {linea}: de volledige vhost mag alleen "server"-blokken bevatten; "{directiva}" staat erbuiten. Er is niets gewijzigd.',
      'nginx.dominio_ajeno':
        'Regel {linea}: "{nombre}" is geen domein van deze site. Voeg het eerst toe als alias van de site.',
      'nginx.puerto_ajeno':
        'Regel {linea}: de site mag alleen luisteren op de Nginx-poorten die in Instellingen zijn geconfigureerd.',
      'nginx.version_no_existe': 'Die versie van de vhost staat niet meer in de geschiedenis.',
      'nginx.argumento_invalido': 'Ongeldig argument: {campo}',
      'nginx.destino_interno':
        'Regel {linea}: "{directiva}" verwijst naar een interne dienst van WolfCore Dev (Adminer, Mailpit, databases, PHP van andere sites…) en zou deze blootstellen aan het netwerk en via tunnels. Er is niets gewijzigd.',
      'nginx.caido_tras_restaurar':
        'Nginx reageerde niet meer: de vorige vhost is hersteld, maar reageert nog steeds niet. Controleer Diensten en het Nginx-logboek. {salida}',
      'depuracion.puerto_ocupado':
        'Poort {puerto} is al in gebruik: de dumpopname kan niet luisteren. Sluit het programma dat deze gebruikt (bijv. een server:dump van Symfony).',
      'depuracion.no_iniciado': 'De dumpopname is uitgeschakeld.',
      'depuracion.tipo_no_soportado':
        'Het vastleggen van dumps is alleen voor PHP- en FastAPI-sites.',
      'depuracion.confirmacion': 'Bevestig het vastleggen van dumps in het dialoogvenster.',
      'depuracion.argumento_invalido': 'Ongeldig argument: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Dat bestand staat niet in de map van de site: het wordt niet in de editor geopend.',
      'contenedores.motor_invalido': 'Onbekende containerengine.',
      'contenedores.id_invalido': 'De container-ID is ongeldig.',
      'contenedores.argumento_invalido': 'Ongeldig argument: {campo}',
      'contenedores.sin_motor': '{motor} is niet geïnstalleerd op dit apparaat.',
      'contenedores.no_responde':
        '{motor} reageert niet. Open Docker Desktop of start de Podman-machine en probeer het opnieuw.',
      'contenedores.remoto':
        'De standaardverbinding van {motor} verwijst naar een ander apparaat: WolfCore Dev gebruikt alleen lokale engines.',
      'contenedores.no_existe': 'De container bestaat niet meer. Vernieuw de lijst.',
      'contenedores.accion_fallo': 'De engine kon dit niet uitvoeren: {detalle}',
      'contenedores.demasiados_registros':
        'Er kunnen maximaal {maximo} containerlogboeken tegelijk worden gevolgd.',
      'contenedores.sin_confirmar': 'Bevestig de actie in het dialoogvenster.',
      'catalogo.indice_invalido':
        'De versie-index van {servicio} kwam niet door de validatie; de opgeslagen lijst wordt gebruikt.',
      'catalogo.sin_huella':
        '{servicio} {version} heeft geen gepubliceerd controlegetal: bevestig de installatie in het dialoogvenster.',
      'catalogo.huella_debil':
        '{servicio} {version} heeft alleen een zwak controlegetal (MD5 of SHA-1): bevestig de installatie in het dialoogvenster.',
      'catalogo.huella_no_coincide':
        'De download komt niet overeen met het gepubliceerde controlegetal.',
      'catalogo.redireccion_ajena':
        'De download probeerde door te verwijzen naar een niet-toegestane site ({host}).',
      'catalogo.demasiadas_redirecciones':
        'De download heeft te veel doorverwijzingen gemaakt (meer dan {maximo}).',
      'catalogo.respuesta_grande': 'Het antwoord van de server is te groot.',
      'catalogo.version_no_encontrada':
        'Versie {version} van {servicio} staat niet in de catalogus.',
      'catalogo.huella_no_disponible':
        'Het controlegetal van {servicio} {version} kon niet worden opgehaald (geen verbinding of de bron reageerde niet). Probeer het opnieuw.',
      'catalogo.firma_invalida':
        'De PGP-handtekening van {servicio} {version} is ongeldig of niet gepubliceerd: er is niets geïnstalleerd.',
      'catalogo.firma_no_soportada':
        'De PGP-handtekening van {servicio} {version} gebruikt een indeling die WolfCore Dev niet controleert: er is niets geïnstalleerd.',
      'catalogo.clave_desconocida':
        'De handtekening van {servicio} {version} is afkomstig van een sleutel die niet in de vastgezette sleutels van de app staat: er is niets geïnstalleerd.',
      'catalogo.firma_vencida':
        'De handtekening van {servicio} {version} of de bijbehorende sleutel is verlopen: er is niets geïnstalleerd. Werk WolfCore Dev bij om de sleutels up-to-date te houden.',
      'catalogo.reloj_atrasado':
        'De handtekening van {servicio} {version} heeft een datum in de toekomst: controleer de datum en tijd van uw apparaat en probeer het opnieuw.',
      'acceso_bd.datos_invalidos': 'De toegangsgegevens voor de database zijn ongeldig.',
      'acceso_bd.sin_base': 'Het .env-bestand van dit project verwijst niet naar een database.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin opent alleen MySQL- en MariaDB-databases; gebruik Adminer voor PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'De database van dit project staat niet op een lokale server van WolfCore Dev.',
      'acceso_bd.no_listo':
        'Het hulpprogramma is niet gereed: installeer het vanuit Diensten en start PHP.',
      'auditoria.tabla_invalida': 'De tabel bestaat niet in die database.',
      'auditoria.columna_invalida':
        'De kolom bestaat niet in die tabel (en de gebruikerskolom en hashkolom moeten verschillend zijn).',
      'auditoria.usuario_no_encontrado': 'Er is geen account met die gebruikersnaam.',
      'auditoria.usuario_repetido':
        'Er is meer dan één account met die gebruikersnaam: het wachtwoord wordt niet opnieuw ingesteld om te voorkomen dat het verkeerde account wordt gewijzigd.',
      'auditoria.formato_no_soportado':
        'De indeling van de huidige hash kan niet worden gereproduceerd: het wachtwoord wordt niet opnieuw ingesteld.',
      'auditoria.clave_larga':
        'bcrypt gebruikt alleen de eerste 72 bytes van het wachtwoord: kies een korter wachtwoord.',
      'auditoria.clave_invalida': 'Het nieuwe wachtwoord is ongeldig.',
      'auditoria.sin_confirmar': 'Bevestig dat u dit wachtwoord opnieuw wilt instellen.',
      'auditoria.respaldo_previo_fallo':
        'Er kon geen back-up van de database worden opgeslagen vóór het opnieuw instellen: er is niets gewijzigd.',
      'auditoria.copia_fallo':
        'Er kon geen kopie van de rij worden opgeslagen: er is niets gewijzigd.',
      'auditoria.motor_no_soportado':
        'De wachtwoordaudit is beschikbaar voor MySQL, MariaDB en PostgreSQL.',
      'auditoria.cancelada': 'Audit geannuleerd.',
      'auditoria.usuario_invalido': 'De gebruikersnaam moet tussen 1 en 256 tekens lang zijn.',
      'auditoria.en_curso': 'Er loopt al een audit: wacht tot deze is voltooid of annuleer deze.',
      'auditoria.base_sistema':
        'Een systeemdatabase wordt niet geaudit: kies de database van een project.',
      'auditoria.esquema_invalido': 'Het schema bestaat niet in die database.',
      'auditoria.fila_cambio':
        'Het account is intussen gewijzigd: het wachtwoord is niet opnieuw ingesteld. Probeer het opnieuw.',
      'auditoria.verificacion_fallo':
        'De database heeft het wachtwoord niet opgeslagen zoals verwacht: de wijziging is ongedaan gemaakt.',
      'auditoria.columna_corta':
        'De hashkolom biedt ruimte aan {largo} tekens en de nieuwe hash heeft {necesario} tekens nodig: er is niets gewijzigd. Vergroot de kolom.',
      'auditoria.datos_reales_sin_confirmar':
        'Deze database bevat echte klantgegevens: voor het opnieuw instellen van een wachtwoord is de versterkte bevestiging vereist.',
      'instantaneas.id_invalido': 'De momentopname is ongeldig.',
      'instantaneas.no_encontrada':
        'De momentopname is niet gevonden; mogelijk is deze al verwijderd.',
      'instantaneas.otra_base':
        'Deze momentopname hoort bij een andere database en kan hier niet op worden toegepast.',
      'instantaneas.sin_confirmar': 'Bevestig dat u wilt terugkeren naar deze momentopname.',
      'instantaneas.motor_no_soportado':
        'Momentopnamen zijn beschikbaar voor MySQL, MariaDB en PostgreSQL.',
      'instantaneas.demasiado_grande':
        'De database is groter dan {maximo} MB, het maximum dat een momentopname kan opslaan.',
      'instantaneas.sin_espacio':
        'Er is onvoldoende vrije ruimte voor de momentopname: er is {necesarios} MB nodig en er is {libres} MB beschikbaar.',
      'instantaneas.limite':
        'Er zijn al {maximo} momentopnamen van deze database: verwijder er een om een nieuwe te maken.',
      'instantaneas.tomar_fallo':
        'De momentopname kon niet worden gemaakt. De database is niet gewijzigd.',
      'instantaneas.huella_no_coincide':
        'Het bestand van de momentopname is gewijzigd of beschadigd: er is niets hersteld.',
      'instantaneas.respaldo_previo_fallo':
        'De huidige status van de database kon niet worden opgeslagen: er is niets hersteld.',
      'instantaneas.restauracion_fallo':
        'De momentopname kon niet worden hersteld. De database is teruggezet naar de vorige status. Reden: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'De momentopname kon niet worden hersteld en de vorige status was niet opgeslagen: de database is mogelijk leeg of onvolledig achtergebleven. Reden: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'De momentopname kon niet worden hersteld en de vorige status kon niet worden teruggezet. Die status is opgeslagen in de automatische momentopname {respaldo}: keer daarnaar terug vanuit Momentopnamen.',
    },
  },
  instantaneas: {
    abrir: 'Momentopnamen',
    titulo: (base: string) => `Momentopnamen van ${base}`,
    ayuda:
      'Een momentopname slaat de database op zoals deze nu is. U kunt er op elk gewenst moment naar terugkeren: vóór het terugkeren wordt automatisch een momentopname van de huidige status opgeslagen.',
    ubicacion:
      'Ze worden opgeslagen in de gegevensmap van WolfCore Dev en zijn alleen leesbaar voor uw gebruiker. De diensten en hun gegevens worden niet aangeraakt.',
    notaEtiqueta: 'Notitie (optioneel)',
    notaMarcador: 'Bijvoorbeeld: vóór migratie',
    tomar: 'Momentopname maken',
    tomada: 'Momentopname opgeslagen',
    cargando: 'Momentopnamen lezen…',
    vacio: 'Er zijn nog geen momentopnamen van deze database.',
    automatica: 'Automatisch',
    sinNota: 'Geen notitie',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'tabel' : 'tabellen'} · ${tamano}`,
    volver: 'Terugkeren naar deze momentopname',
    borrar: 'Verwijderen',
    borrada: 'Momentopname verplaatst naar de prullenbak',
    papelera:
      'Verwijderde momentopnamen kunnen gedurende 7 dagen worden hersteld vanuit de prullenbak van WolfCore Dev.',
    cerrar: 'Sluiten',
    papeleraTitulo: 'Prullenbak',
    papeleraVacia: 'Er staan geen momentopnamen in de prullenbak.',
    recuperar: 'Herstellen',
    recuperada: 'Momentopname hersteld',
    borradaEl: (fecha: string) => `Verwijderd op ${fecha}`,
    borrarPregunta: 'Deze momentopname naar de prullenbak verplaatsen?',
    borrarSi: 'Naar prullenbak verplaatsen',
    notaAutomatica: (fecha: string) =>
      `Vorige status, opgeslagen vóór het terugkeren naar de momentopname van ${fecha}`,
    notaAutomaticaSinOrigen:
      'Vorige status, opgeslagen vóór het terugkeren naar een andere momentopname',
    extensionesAviso: (lista: string) =>
      `Bevat PostgreSQL-extensies (${lista}) die alleen worden hersteld met het controlegetalregister van dit apparaat.`,
    limites:
      'Bij MySQL en MariaDB worden ook routines, triggers en events opgeslagen. Bij PostgreSQL betreft het een gecomprimeerde dump van één enkele database: rollen en servergebruikers worden niet meegenomen. Een momentopname waarvan niet kan worden bevestigd dat deze van dit apparaat afkomstig is, wordt hersteld met een tot de database beperkte gebruiker, die geen views, routines of triggers van andere gebruikers ondersteunt.',
    basesBorradas: 'Momentopnamen van databases die niet meer bestaan',
    basesBorradasAyuda: 'Kies een database om deze opnieuw aan te maken vanuit de momentopname.',
    dialogoVolver: {
      titulo: (base: string) => `Terugkeren naar een momentopname van ${base}`,
      cargando: 'Voorbeeld voorbereiden…',
      base: 'Database',
      instantanea: 'Momentopname',
      ahora: 'Nu',
      tamano: 'Grootte',
      tablas: 'Tabellen',
      nota: 'Notitie',
      aviso: (base: string) =>
        `De database ${base} wordt volledig vervangen door deze momentopname: alles wat sindsdien is gewijzigd, gaat verloren uit de database. Vooraf wordt automatisch een momentopname van de huidige status opgeslagen; als er iets misgaat, keert de database automatisch terug naar die status.`,
      pedir: (base: string) => `Typ ${base} om te bevestigen`,
      confirmar: 'Terugkeren naar deze momentopname',
      trabajando: (base: string) =>
        `${base} herstellen… Sluit het programma niet af voordat dit is voltooid.`,
      hecho: (base: string) => `De database ${base} is teruggezet naar de momentopname`,
      respaldoPrevio: 'De vorige status is opgeslagen in de automatische momentopname van',
      advertencias: 'Het herstel is voltooid met meldingen:',
      hechoConAvisos: (base: string) =>
        `De database ${base} is teruggezet naar de momentopname, met meldingen`,
      baseVacia:
        'De database bestaat niet of is leeg: er is niets om op te slaan vóór het terugkeren.',
      sinGuardarTitulo: 'De huidige status kon niet worden opgeslagen',
      sinGuardarTexto:
        'WolfCore Dev kon de huidige status van de database niet opslaan vóór het terugkeren. Als u doorgaat ZONDER deze op te slaan en het herstel mislukt, gaan de huidige gegevens van de database verloren.',
      sinGuardarConfirmar: 'Ik begrijp dat de huidige gegevens van de database verloren gaan',
      sinGuardarBoton: 'Terugkeren zonder huidige status op te slaan',
    },
  },
  avisoInicio: {
    titulo: 'Melding van WolfCore Dev',
  },
  tareas: {
    titulo: 'Geplande taken',
    resumen: (n: number) => (n === 0 ? 'Geen taken' : n === 1 ? '1 taak' : `${n} taken`),
    mostrar: 'Taken bekijken',
    ocultar: 'Verbergen',
    cargando: 'Taken laden',
    errorCargar: 'De taken konden niet worden geladen',
    soloAbierta:
      'Taken worden alleen uitgevoerd zolang WolfCore Dev geopend is. Ze gebruiken niet de Windows Taakplanner: wanneer de toepassing is gesloten of het apparaat in slaapstand staat, worden ze niet uitgevoerd en gemiste uitvoeringen worden niet ingehaald.',
    repoEjecuta:
      'In een vertrouwd project wordt de inhoud van de repository direct uitgevoerd: het bestand dat de taak aanroept, `artisan`, de scripts in `package.json`, `.venv`… Als deze wijzigen na een `git pull`, voert de taak de nieuwe versie uit.',
    vacio:
      'Dit project heeft geen geplande taken. Maak er een aan (bijvoorbeeld "php artisan schedule:run" elke minuut in een Laravel-project).',
    nueva: 'Nieuwe taak',
    pausada: 'gepauzeerd',
    enCurso: 'Wordt uitgevoerd…',
    nunca: 'Nog niet uitgevoerd',
    ultima: (f: string) => `Laatste: ${f}`,
    proxima: (f: string) => `volgende: ${f}`,
    codigo: (n: number) => `code ${n}`,
    resultadoTitulo: (n: string) => `"${n}"`,
    origen: { usuario: 'hier aangemaakt', 'wolfcore.yml': 'uit wolfcore.yml' },
    describir: {
      cadaMinuto: 'Elke minuut',
      cadaN: (n: number) => `Elke ${n} minuten`,
      cadaHora: 'Elk heel uur',
      diaria: (h: string) => `Elke dag om ${h}`,
      laborables: (h: string) => `Van maandag tot en met vrijdag om ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Geslaagd',
      fallo: 'Mislukt',
      tiempo: 'Maximale duur overschreden',
      cancelada: 'Geannuleerd',
      omitida: 'Overgeslagen',
      bloqueada: 'Niet uitgevoerd',
    },
    motivo: {
      aislado:
        'Dit is een testgegevensmap (WOLFCORE_DATOS): de taak wordt niet uitgevoerd totdat u taken in deze sessie toestaat.',
      no_confiado:
        'Het project is niet als vertrouwd gemarkeerd: schakel "Ik vertrouw deze repository" in om het uit te voeren.',
      receta_cambio:
        'Het recept van het project is gewijzigd sinds u het vertrouwde: bekijk het opnieuw en schakel "Ik vertrouw deze repository" weer in.',
      sin_confirmar:
        'De opdracht moet nog worden bevestigd: deze wordt pas uitgevoerd nadat u deze hebt gecontroleerd en bevestigd.',
      comando_invalido: 'De opdracht is niet toegestaan (alleen php, node, npm run en python).',
      cron_invalida: 'Het schema is geen geldige cron-expressie.',
      carpeta: 'De projectmap bestaat niet.',
      solapada: 'De vorige uitvoering liep nog: deze is overgeslagen.',
      retraso: 'Te laat aangekomen (de toepassing was onderbroken): wordt niet ingehaald.',
      error: 'Het programma kon niet worden uitgevoerd.',
    },
    acciones: {
      ejecutar: 'Nu uitvoeren',
      editar: 'Bewerken',
      borrar: 'Verwijderen',
      verRegistro: 'Logboek bekijken',
      revisarConfirmar: 'Controleren en bevestigen',
      activar: (n: string) => `Taak ${n} activeren`,
    },
    borrar: {
      titulo: (n: string) => `"${n}" verwijderen?`,
      texto:
        'De taak en de bijbehorende geschiedenis worden verwijderd. Wat al is uitgevoerd wordt niet ongedaan gemaakt en de projectbestanden worden niet aangeraakt.',
      confirmar: 'Verwijderen',
      hecho: (n: string) => `Taak "${n}" verwijderd.`,
    },
    aislado: {
      titulo: 'Testgegevensmap.',
      texto:
        'Met WOLFCORE_DATOS wordt geen enkele taak automatisch uitgevoerd. Sta taken alleen toe als u ze in deze sessie wilt testen.',
      permitir: 'In deze sessie toestaan',
      confirmarTitulo: 'Taken toestaan in deze testmap?',
      confirmarTexto:
        'Actieve taken van vertrouwde projecten worden uitgevoerd totdat u de toepassing sluit. De opdrachten zijn die van elk project en draaien in de echte projectmap.',
      permitido: 'Taken toegestaan in deze sessie.',
    },
    yml: {
      titulo: 'Voorstellen uit wolfcore.yml',
      texto:
        'Het projectbestand stelt deze taken voor. Er wordt niets automatisch uitgevoerd enkel omdat het daarin staat: controleer de opdracht en bevestig deze om de taak over te nemen.',
      estado: { nueva: 'Nieuw', adoptada: 'Overgenomen', cambiada: 'Gewijzigd' },
      revisar: 'Controleren en overnemen',
      cambiada:
        'De opdracht in wolfcore.yml is gewijzigd sinds u deze hebt overgenomen. De projecttaak gebruikt nog de opdracht die u hebt bevestigd; neem de nieuwe versie over als u deze herkent.',
      guardarEn: 'Opslaan in wolfcore.yml',
      escribirTitulo: 'Taak wegschrijven naar wolfcore.yml?',
      escribirTexto:
        'De taak wordt toegevoegd of bijgewerkt in het projectbestand (zonder de rest aan te raken), zodat deze meereist met de repository. Iedereen die de repository kloont, moet deze op het eigen apparaat bevestigen.',
      escribir: 'Wegschrijven',
      escrita: 'Taak opgeslagen in wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Logboek van "${n}"`,
      historial: 'Laatste uitvoeringen',
      sinHistorial: 'Nog geen uitvoeringen.',
      salida: 'Uitvoer van de laatste uitvoering',
      sinSalida: 'Geen uitvoer opgeslagen.',
      enmascarado:
        'Logboeken verbergen wachtwoorden en sleutels, hebben een maximale grootte en roteren automatisch.',
      origen: { programada: 'gepland', manual: 'handmatig' },
    },
    dialogo: {
      tituloNueva: 'Nieuwe geplande taak',
      tituloEditar: 'Geplande taak bewerken',
      tituloAdoptar: 'Taak uit wolfcore.yml overnemen',
      tituloConfirmar: 'Opdracht van de taak bevestigen',
      nombre: 'Naam',
      nombrePlaceholder: 'Laravel-taken',
      horario: 'Wanneer',
      preset: {
        cadaMinuto: 'Elke minuut',
        cadaN: 'Om de paar minuten',
        cadaHora: 'Elk uur',
        diaria: 'Elke dag op een vast tijdstip',
        laborables: 'Maandag t/m vrijdag op een vast tijdstip',
        personalizada: 'Eigen cron-expressie',
      },
      cadaNOpcion: (n: number) => `Elke ${n} minuten`,
      hora: 'Tijdstip',
      horaPlaceholder: '03:00',
      horaInvalida: 'Voer een geldig tijdstip in, bijvoorbeeld 03:00.',
      expresion: 'Cron-expressie',
      cronEquivale: 'Cron-expressie:',
      expresionAyuda:
        '5 velden: minuut, uur, dag van de maand, maand en dag van de week (* , - /). Minimaal één keer per minuut.',
      proximas: 'Volgende uitvoeringen:',
      comando: 'Opdracht',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Alleen php, node, npm run en python, met een bestand uit het project. Draait in de projectmap, zonder shell en zonder inline code (-r, -e, -c).',
      comandoFijo:
        'Deze opdracht bevat argumenten met aanhalingstekens die niet als platte tekst kunnen worden ingevoerd: deze blijft ongewijzigd en kan hier niet worden bewerkt (verwijder de taak en maak een nieuwe aan als u deze wilt wijzigen).',
      argumentos: 'Wordt uitgevoerd met deze argumenten:',
      comillasSinCerrar: 'Er zijn niet-gesloten aanhalingstekens.',
      tiempo: 'Maximale duur',
      minutos: 'minuten',
      tiempoAyuda:
        'Als de taak langer duurt, wordt deze automatisch gestopt (alleen dat proces en wat het heeft gestart).',
      activa: 'Actief (draait automatisch zolang de toepassing geopend is)',
      advertencia:
        'Door akkoord te gaan geeft u toestemming voor exact deze opdracht: deze wordt automatisch uitgevoerd in de map van dit project telkens wanneer deze aan de beurt is. Als u de opdracht wijzigt, moet u deze opnieuw bevestigen.',
      revise: 'Ik heb deze opdracht gecontroleerd en herken deze.',
      guardar: 'Opslaan en opdracht bevestigen',
      adoptar: 'Bevestigen en overnemen',
      confirmar: 'Opdracht bevestigen',
      guardada: 'Taak opgeslagen.',
      adoptada: 'Taak overgenomen.',
      confirmada: 'Opdracht bevestigd.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Benoemde verzamelingen van databases, diensten en processen die gezamenlijk worden gestart en gestopt.',
    nuevo: 'Nieuwe workspace',
    vacio:
      'Er zijn nog geen workspaces. Maak er een aan, bijvoorbeeld "Bot FastAPI" met PostgreSQL, Redis, Ollama en het proces van uw project.',
    elementos: (n: number) => (n === 1 ? '1 element' : `${n} elementen`),
    sinElementos: 'Geen elementen',
    estado: { apagado: 'Gestopt', parcial: 'Gedeeltelijk', encendido: 'Actief' },
    acciones: {
      iniciar: 'Starten',
      detener: 'Stoppen',
      editar: 'Bewerken',
      borrar: 'Verwijderen',
      cerrar: 'Sluiten',
    },
    borrar: {
      titulo: (n: string) => `"${n}" verwijderen?`,
      texto:
        'Het verwijderen van de workspace stopt of verwijdert niets: alleen de verzameling wordt verwijderd. Alles wat actief is, blijft actief.',
      confirmar: 'Verwijderen',
      hecho: (n: string) => `Workspace "${n}" verwijderd.`,
    },
    dialogo: {
      tituloNuevo: 'Nieuwe workspace',
      tituloEditar: 'Workspace bewerken',
      nombre: 'Naam',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Voer een naam in.',
      aviso:
        'Een workspace slaat alleen op wat er moet worden gestart. Deze opent geen tunnels, deelt niets op het lokale netwerk en start geen processen van een project dat u niet vertrouwt.',
      secciones: {
        instancias: 'Databases',
        servicios: 'Diensten',
        procesos: 'Projectprocessen',
      },
      sinOpciones: 'Er is hier niets om te kiezen.',
      captadorUnico: 'Slechts één e-mailvanger tegelijk: een andere kiezen vervangt de vorige.',
      yaNoExisten: (lista: string) =>
        `Bestaan niet meer en worden bij het opslaan verwijderd: ${lista}`,
      guardar: 'Opslaan',
      guardado: (n: string) => `Workspace "${n}" opgeslagen.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `"${n}": resultaat na het starten`,
      tituloDetener: (n: string) => `"${n}": resultaat na het stoppen`,
      encendido: 'Gestart',
      apagado: 'Gestopt',
      yaEncendido: 'Was al actief',
      yaApagado: 'Was al gestopt',
      noExiste: 'Bestaat niet meer: genegeerd',
      compartido: 'Blijft actief: in gebruik door een andere actieve workspace',
      reemplaza: (otro: string) => `Gestart; ${otro} uit dezelfde e-mailgroep is gestopt`,
      fallo: 'Kon niet worden gestart',
      falloApagar: 'Blijft actief',
      ok: (n: string) => `"${n}" gereed.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `"${n}": ${encendidos} van de ${total} zijn gestart. Controleer wat niet is gestart.`,
      parcialApagar: (n: string, siguen: number) =>
        `"${n}": ${siguen} zijn nog actief. Controleer wat niet is gestopt.`,
    },
  },
  inicio: {
    titulo: 'Start',
    bienvenida: 'Uw ontwikkelomgeving in één oogopslag.',
    tiles: {
      servicios: 'Actieve diensten',
      serviciosDe: (total: number) => `van ${total}`,
      sitios: 'Projecten',
      tuneles: 'Actieve tunnels',
      hosts: 'Openstaande hosts',
      hostsOk: 'Alles in orde',
      hostsFaltan: 'Vereist aandacht',
    },
    hosts: {
      titulo: 'Er zijn domeinen die niet in het hosts-bestand staan',
      texto:
        'Deze domeinen verwijzen nog niet naar uw apparaat. Bij het herstellen vraagt Windows om beheerdersrechten.',
      corregir: 'Openstaande hosts toepassen',
      reintentarPermiso: 'Opnieuw proberen met machtiging',
      corregido: 'Hosts-bestand bijgewerkt',
      fallo: 'Het hosts-bestand kon niet worden bijgewerkt',
      verInstrucciones: 'Instructies bekijken',
      duplicados:
        'Deze domeinen staan al in hosts buiten het blok van WolfCore Dev (ze blijven behouden):',
      motivos: {
        cancelado:
          'De beheerdersmachtiging is geannuleerd. Het hosts-bestand is ongewijzigd gebleven.',
        tiempo:
          'Niemand heeft op tijd gereageerd op de beheerdersmachtiging. De site is opgeslagen; het hosts-bestand is ongewijzigd gebleven. Als u de melding van Windows nog ziet, annuleer deze dan (deze doet niets meer). Pas de openstaande wijzigingen toe zodra het schikt (één machtiging voor alle wijzigingen).',
        denegado:
          'Windows stond het schrijven naar het hosts-bestand niet toe. Mogelijk blokkeert een antivirusprogramma dit.',
      } as Record<string, string>,
      modalTitulo: 'Hosts handmatig corrigeren',
      modalTexto:
        'Open PowerShell als administrator (klik met de rechtermuisknop op Start → Terminal (beheerder)), plak deze opdracht en druk op Enter.',
    },
    servicios: {
      titulo: 'Diensten',
      ver: 'Diensten bekijken',
      vacio: 'Er zijn nog geen diensten geïnstalleerd.',
    },
    tuneles: {
      titulo: 'Actieve tunnels',
      vacio: 'Er zijn geen open tunnels. U kunt er een openen vanuit Projecten.',
      sitioDesconocido: 'Site zonder naam',
    },
  },
  servicios: {
    titulo: 'Diensten',
    descripcion:
      "Start en stop de webserver, PHP, databases en hulpprogramma's. De status wordt automatisch bijgewerkt.",
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Databases',
      correo: 'E-mail',
      ia: 'AI',
      herramientas: "Hulpprogramma's",
    },
    gruposAyuda: {
      web: 'Server die de .test-domeinen afhandelt.',
      php: 'Eén installatie per versie (8.3, 8.4…); elke site gebruikt zijn eigen versie.',
      bd: 'Luisteren alleen op 127.0.0.1.',
      correo: 'Vangt e-mails op die uw projecten verzenden, zonder dat ze het internet op gaan.',
      ia: 'Taalmodellen op uw eigen apparaat.',
      herramientas: 'Hulpmiddelen voor dagelijks gebruik.',
    },
    puerto: 'Poort',
    cambiarPuerto: 'Poort wijzigen',
    cambiarPuertoDe: (nombre: string) => `Poort van ${nombre} wijzigen`,
    versionesDe: (nombre: string) => `Versies van ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instanties, ${encendidas} actief`,
    usarPuerto: (p: number) => `Poort ${p} gebruiken`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} gebruikt nu poort ${p}`,
    conflicto: 'Poort bezet',
    autoIniciar: 'Starten bij het opstarten van WolfCore Dev',
    autoIniciarActivado: (nombre: string) =>
      `${nombre} wordt gestart bij het opstarten van WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} wordt niet meer gestart bij het opstarten van WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Poort van ${nombre}`,
      etiqueta: 'Nieuwe poort',
      ayuda:
        'Tussen 1024 en 65535 en vrij. Als de dienst actief is, wordt deze opnieuw gestart. Werk het .env-bestand van uw projecten bij.',
      rango: 'Gebruik een getal tussen 1024 en 65535',
      igual: 'Dit is de huidige poort',
      guardar: 'Poort wijzigen',
    },
    borrarDatos: {
      opcion: 'Gegevens verwijderen',
      titulo: (nombre: string) => `Gegevens van ${nombre} verwijderen`,
      copias: (n: number, tam: string) =>
        `Ook ${n === 1 ? 'één kopie' : `${n} kopieën`} van de updates (${tam}) ${n === 1 ? 'wordt' : 'worden'} verwijderd. Als u deze wilt bewaren, kopieer ze dan eerst vanuit de gegevensmap.`,
      /** Wat er verloren gaat, afhankelijk van de dienst. */
      que: {
        mysql: 'alle databases en gebruikers van MySQL',
        mariadb: 'alle databases en gebruikers van MariaDB',
        postgresql: 'alle databases en gebruikers van PostgreSQL',
        redis: 'alle sleutels en gegevens opgeslagen in Redis',
        mongodb: 'alle databases, collecties en gegevens van MongoDB',
        mailpit: 'alle e-mails opgevangen door Mailpit',
        smtp4dev: 'alle e-mails opgevangen door smtp4dev',
        inbucket: 'alle e-mails opgevangen door Inbucket',
        papercut: 'alle e-mails opgevangen door Papercut SMTP',
        ollama: 'alle gedownloade modellen van Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `Hiermee verwijdert u ${que}. Dit kan niet ongedaan worden gemaakt. Het programma blijft geïnstalleerd.`,
      generico: (nombre: string) => `alle gegevens van ${nombre}`,
      pedir: (id: string) => `Typ ${id} om te bevestigen`,
      boton: 'Gegevens verwijderen',
      hecho: (nombre: string) => `Gegevens van ${nombre} verwijderd`,
    },
    ftp: {
      interruptor: 'FTP-server',
      redLocal: 'Verbindingen vanuit het lokale netwerk toestaan',
      avisoTitulo: 'FTP openstellen voor het lokale netwerk',
      avisoTexto:
        'FTP verzendt gebruikersnamen, wachtwoorden en bestanden onversleuteld. Elke computer in uw netwerk kan proberen verbinding te maken. Gebruik dit alleen in een vertrouwd netwerk.',
      avisoConfirmar: 'Toestaan',
      redLocalActivada: 'FTP accepteert verbindingen vanuit het lokale netwerk',
      redLocalDesactivada: 'FTP accepteert alleen verbindingen vanaf deze computer',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'PHP-pakketbeheerder',
      instalado: 'Geïnstalleerd',
      noInstalado: 'Niet geïnstalleerd',
      sinVersion: 'niet geïnstalleerd',
      uso: 'Gebruik',
      usoTexto: 'composer',
      ayuda:
        'Gebruik "Terminal" in een project, of voeg WolfCore Dev toe aan het PATH in Instellingen.',
      instaladoOk: 'Composer geïnstalleerd',
      sinPhp: 'Installeer eerst PHP',
      actualizado: (v: string) => `Composer bijgewerkt: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Webbeheerder voor databases',
      direccion: 'Adres',
      disponible: 'Gereed',
      noInstalado: 'Niet geïnstalleerd',
      sinPhp: 'PHP ontbreekt',
      abrir: 'Adminer openen',
      instaladoOk: 'Adminer geïnstalleerd',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Webbeheerder voor MySQL en MariaDB',
      direccion: 'Adres',
      disponible: 'Gereed',
      noInstalado: 'Niet geïnstalleerd',
      sinPhp: 'PHP ontbreekt',
      abrirDesdeProyecto: 'Opent vanuit de kaart van elk project, al aangemeld.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} heeft de extensie ${ext} niet actief. Herstart PHP of schakel deze in via uw php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin ondersteunt officieel tot en met PHP 8.3 en u gebruikt PHP ${rama}: er kunnen fouten optreden. Start een PHP-versie van 7.2 tot 8.3 als er iets misgaat.`,
      instalarPrimero: 'Installeer phpMyAdmin om het te gebruiken.',
      encenderPhp: 'Start PHP om phpMyAdmin te gebruiken.',
      instaladoOk: 'phpMyAdmin geïnstalleerd',
    },
    puertos: 'Poorten',
    pid: 'PID',
    sinVersion: 'geen versie',
    sinPuertos: '—',
    terminado: 'Zonder fouten voltooid',
    externo: 'Beheerd buiten WolfCore Dev',
    verDetalle: 'Foutdetails bekijken',
    vacioTitulo: 'Nog geen diensten',
    vacio:
      'Er zijn nog geen diensten geïnstalleerd. Begin met Nginx en PHP voor uw sites, of met een database.',
    irAInstalar: 'Naar Installeren',
  },
  bd: {
    descripcion:
      'Maak databases voor uw projecten aan, maak back-ups en zet ze terug. De servers luisteren alleen op 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Nieuwe database',
    restaurar: 'Back-up terugzetten',
    importar: 'Importeren vanaf een andere server',
    soloSql: 'Beschikbaar voor MySQL, MariaDB en PostgreSQL',
    enCursoAyuda: 'Wacht tot de huidige bewerking is voltooid',
    encenderPrimero: (motor: string) => `Start ${motor} eerst`,
    cargando: 'Databases laden…',
    recargar: 'Lijst opnieuw laden',
    vacioTitulo: 'Er is geen databaseserver geïnstalleerd',
    vacio:
      'Installeer MySQL, MariaDB, PostgreSQL of MongoDB via Diensten om uw databases te beheren.',
    irAServicios: 'Naar Diensten',
    apagado: {
      titulo: (motor: string) => `${motor} is gestopt`,
      texto: (motor: string) => `Start ${motor} om uw databases te bekijken en te beheren.`,
      iniciando: (motor: string) => `${motor} wordt gestart…`,
      error: (motor: string) => `${motor} kon niet worden gestart`,
      encender: (motor: string) => `${motor} starten`,
      verServicios: 'Bekijken in Diensten',
    },
    errorLista: 'Kan de databaselijst niet lezen',
    sinBases: 'Deze server heeft nog geen eigen databases.',
    total: (n: number) => plural(n, 'database', 'databases'),
    columnas: { nombre: 'Database', tamano: 'Grootte', acciones: 'Acties' },
    acciones: {
      respaldar: 'Back-up maken',
      restaurarAqui: 'Hier terugzetten',
      adminer: 'Openen in Adminer',
      conexion: 'Verbindingsgegevens',
      vector: 'Vector inschakelen',
      borrar: 'Verwijderen',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Installeer Adminer en PHP in Diensten om dit te openen',
    vectorSinInstalar: 'Installeer pgvector hieronder om het in een database in te schakelen',
    vectorActivado: (base: string) => `Vector ingeschakeld in ${base}`,
    formatos: {
      sql: 'Platte SQL',
      pgdump: 'PostgreSQL-back-up (pg_dump, aangepast formaat)',
      gz: 'Gecomprimeerde SQL (.gz)',
      zip: '.zip-bestand (wordt uitgepakt voor het terugzetten)',
      rar: '.rar-bestand (wordt geprobeerd uit te pakken met Windows)',
      '7z': '.7z-bestand (wordt geprobeerd uit te pakken met Windows)',
      desconocido: 'Niet-herkend formaat',
    } as Record<string, string>,
    formatoDesconocido:
      'Het formaat wordt niet herkend. Als het een gecomprimeerd bestand is, pak het dan uit en kies het .sql- of .dump-bestand erin.',
    formatoIncompatible:
      'Dit bestand is een PostgreSQL-back-up: zet het terug op het tabblad PostgreSQL.',
    nombre: {
      etiqueta: 'Databasenaam',
      vacio: 'Voer een naam in',
      largo: 'De naam is te lang',
      caracteres: {
        mysql: 'Gebruik alleen letters, cijfers en een underscore',
        mariadb: 'Gebruik alleen letters, cijfers en een underscore',
        postgresql: 'Gebruik kleine letters, cijfers en een underscore',
        mongodb: 'Gebruik alleen letters, cijfers, koppelteken en underscore',
      } as Record<string, string>,
      inicio: 'In PostgreSQL mag de naam niet met een cijfer beginnen',
    },
    reemplazo: {
      titulo: (base: string) => `De database ${base} bevat al tabellen`,
      texto: (base: string) =>
        `Als u doorgaat, wordt de huidige database ${base} volledig VERVANGEN. Eerst wordt automatisch een back-up opgeslagen; daarna wordt de database verwijderd en opnieuw aangemaakt met de nieuwe inhoud.`,
      donde: 'De back-up wordt opgeslagen in',
      carpetaPorDefecto: 'Documenten\\WolfCore Dev\\Back-ups',
      otraBase:
        'Als u de database niet wilt vervangen, ga dan terug en kies een andere naam: er wordt dan een nieuwe database aangemaakt.',
      pedir: (base: string) => `Typ ${base} om te bevestigen`,
      volver: 'Terug',
      confirmar: 'Database vervangen',
    },
    resultado: {
      restaurada: (base: string) => `Database ${base} teruggezet`,
      importada: (base: string) => `Database ${base} geïmporteerd`,
      respaldada: (base: string) => `Back-up van ${base} opgeslagen`,
      archivo: 'Bestand',
      respaldoPrevio: 'Back-up van de vorige database',
      advertencias: (n: number) => plural(n, 'waarschuwing', 'waarschuwingen'),
      advertenciasAyuda:
        'De bewerking is voltooid. Controleer deze meldingen; meestal zijn dit rollen of rechten die op deze computer niet bestaan.',
      fallo: {
        restaurar: 'Terugzetten mislukt',
        importar: 'Importeren mislukt',
        respaldar: 'Back-up maken mislukt',
      } as Record<string, string>,
      trasReemplazo: 'De oorspronkelijke database is vervangen en het terugzetten is niet voltooid',
      trasReemplazoAyuda:
        'Uw vorige gegevens staan in de aangegeven back-up. U kunt deze terugzetten met "Back-up terugzetten".',
    },
    progreso: {
      titulo: 'Logboek',
      corriendo: {
        restaurar: (base: string) => `${base} terugzetten…`,
        importar: (base: string) => `${base} importeren…`,
        respaldar: (base: string) => `Back-up maken van ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Wachten op uitvoer van het hulpprogramma…',
      limitado: (n: number) => `De laatste ${n} regels worden weergegeven.`,
      noCierre:
        'Sluit het programma niet af voordat dit klaar is. U kunt dit scherm verlaten en later terugkomen: hier ziet u het resultaat.',
      otraEnCurso: 'Er is al een bewerking bezig; wacht tot deze is voltooid.',
      ver: 'Details bekijken',
      descartar: 'Sluiten',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Back-up terugzetten in ${motor}`,
      confianza:
        'Zet alleen vertrouwde back-ups terug: een back-up kan acties op de server uitvoeren.',
      archivo: 'Back-upbestand',
      elegir: 'Bestand kiezen…',
      cambiar: 'Wijzigen',
      sinArchivo: 'Geen bestand gekozen',
      formato: 'Gedetecteerd formaat',
      detectando: 'Formaat detecteren…',
      destino: 'Doeldatabase',
      destinoAyuda:
        'Als deze niet bestaat, wordt deze aangemaakt. Als deze bestaat en leeg is, wordt deze gebruikt. Als deze tabellen bevat, wordt u om bevestiging gevraagd.',
      restaurar: 'Terugzetten',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Importeren naar ${motor} vanaf een andere server`,
      soloLectura:
        'De bronserver wordt alleen gelezen: uw database wordt naar deze computer gekopieerd en de bron wordt niet gewijzigd.',
      detectado: (puerto: number) =>
        `Er is een andere server gedetecteerd op poort ${puerto} (bijvoorbeeld die van FlyEnv).`,
      origen: 'Bronserver',
      host: 'Server',
      puerto: 'Poort',
      usuario: 'Gebruiker',
      clave: 'Wachtwoord',
      claveAyuda: 'Wordt alleen voor deze kopie gebruikt en niet opgeslagen.',
      baseOrigen: 'Brondatabase',
      destino: 'Doeldatabase op deze computer',
      destinoAyuda:
        'Als deze niet bestaat, wordt deze aangemaakt. Als deze tabellen bevat, wordt u om bevestiging gevraagd voordat deze wordt vervangen.',
      faltaHost: 'Voer de server in',
      faltaPuerto: 'Gebruik een poort tussen 1 en 65535',
      faltaUsuario: 'Voer de gebruiker in',
      faltaBase: 'Voer de brondatabase in',
      importar: 'Importeren',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Nieuwe database in ${motor}`,
      codificacion: 'Codering',
      codificacionValor: {
        mysql: 'utf8mb4 (ondersteunt emoji en alle accenten)',
        mariadb: 'utf8mb4 (ondersteunt emoji en alle accenten)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Een eigen gebruiker voor deze database aanmaken',
      usuarioPropioAyuda:
        'Optioneel. Zo niet, dan gebruiken uw projecten de beheerdersgebruiker van de server.',
      usuario: 'Gebruiker',
      clave: 'Wachtwoord',
      faltaClave: 'Voer een wachtwoord in',
      crear: 'Database aanmaken',
      creada: (base: string) => `Database ${base} aangemaakt`,
      mongo: 'In MongoDB wordt de database aangemaakt met een initiële collectie (_pel_init).',
      cambiarClave: 'Wachtwoord wijzigen',
      cambiarClaveTitulo: (u: string) => `De gebruiker ${u} bestaat al met een ander wachtwoord`,
      cambiarClaveTexto: (u: string) =>
        `Als u het wachtwoord van ${u} wijzigt, kunnen projecten die dit al gebruiken geen verbinding meer maken totdat u hun .env bijwerkt. Normaal gebruikt u het huidige wachtwoord. Toch wijzigen?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Database ${base} verwijderen?`,
      texto: (base: string, motor: string) =>
        `De database ${base} van ${motor} en alle bijbehorende gegevens worden verwijderd. Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up als u deze nog nodig hebt.`,
      pedir: (base: string) => `Typ ${base} om te bevestigen`,
      boton: 'Database verwijderen',
      hecho: (base: string) => `Database ${base} verwijderd`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Back-up maken van ${base}`,
      destino: 'Wordt opgeslagen in',
      porDefecto: 'Documenten\\WolfCore Dev\\Back-ups (standaardmap)',
      porDefectoEn: (carpeta: string) => `${carpeta} (standaardmap)`,
      cambiar: 'Andere map kiezen…',
      porDefectoVolver: 'Standaardmap gebruiken',
      formato: {
        mysql: '.sql-bestand (mysqldump met routines en triggers)',
        mariadb: '.sql-bestand (mysqldump met routines en triggers)',
        postgresql: '.dump-bestand (pg_dump, aangepast formaat)',
      } as Record<string, string>,
      boton: 'Back-up maken',
    },
    dialogoConexion: {
      sitio: 'Project',
      sitioAyuda:
        'Het .env-bestand van de site wordt gelezen om de variabelen te gebruiken die het al bevat (bijvoorbeeld CodeIgniter 4). De inhoud wordt niet weergegeven of gekopieerd.',
      generico: 'Algemeen (Laravel-formaat)',
      titulo: (base: string) => `Verbinding met ${base}`,
      host: 'Server',
      puerto: 'Poort',
      usuario: 'Gebruiker',
      clave: 'Wachtwoord',
      base: 'Database',
      sinClave: 'Geen wachtwoord (luistert alleen op 127.0.0.1)',
      mostrar: 'Wachtwoord tonen',
      ocultar: 'Wachtwoord verbergen',
      copiarDato: (dato: string) => `${dato} kopiëren`,
      env: 'Blok voor het .env-bestand',
      envAyuda:
        'Plak dit in het .env-bestand van uw project. WolfCore Dev schrijft niet in uw projecten.',
      copiarEnv: 'Blok kopiëren',
      cargando: 'Verbindingsgegevens lezen…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Er is al een installatie van pgvector bezig.',
      descripcion:
        'Zoeken op gelijkenis (embeddings) binnen PostgreSQL. Wordt gecompileerd vanuit de officiële broncode.',
      instalado: (v: string | null) => (v ? `Geïnstalleerd (versie ${v})` : 'Geïnstalleerd'),
      noInstalado: 'Niet geïnstalleerd',
      herramientas: 'Compilatiehulpmiddelen',
      herramientasSi: 'Gereed',
      herramientasNo: 'Ontbreken',
      instalar: 'pgvector installeren',
      reinstalar: 'Opnieuw compileren',
      instalarHerramientas: 'Compilatiehulpmiddelen installeren',
      dialogoHerramientasTitulo: 'Compilatiehulpmiddelen installeren',
      dialogoHerramientas:
        'Om pgvector te compileren zijn de Build Tools van Visual Studio nodig. Er wordt ca. 6 GB gedownload en Windows vraagt om beheerdersrechten. Dit kan geruime tijd duren; laat WolfCore Dev geopend.',
      dialogoCompilarTitulo: 'pgvector compileren en installeren',
      dialogoCompilar:
        'De officiële broncode van pgvector wordt gedownload, gecompileerd en in uw PostgreSQL geïnstalleerd. PostgreSQL wordt enkele seconden gestopt terwijl de extensie wordt gekopieerd en daarna weer gestart.',
      continuar: 'Doorgaan',
      instalando: 'Compilatiehulpmiddelen installeren…',
      compilando: 'pgvector compileren…',
      herramientasOk: 'Compilatiehulpmiddelen geïnstalleerd',
      instaladoOk: (v: string) => `pgvector ${v} geïnstalleerd`,
      sinWinget:
        'Deze computer heeft geen winget. Installeer "Build Tools voor Visual Studio 2022" via visualstudio.microsoft.com met de workload "Desktopontwikkeling met C++" en probeer het opnieuw.',
      falloHerramientas: 'Kan de compilatiehulpmiddelen niet installeren',
      activarAyuda: 'Gebruik daarna "Vector inschakelen" bij elke database die dit nodig heeft.',
      errorEstado: 'Kan de status van pgvector niet lezen',
    },
  },
  instalar: {
    titulo: 'Installeren',
    descripcion:
      'Download officiële versies. Elk bestand wordt vóór gebruik geverifieerd met zijn SHA-256-hash.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Webserver (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Openbare tunnels (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Database, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Database, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Database (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Cache en wachtrijen in geheugen (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Documentdatabase (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB-console (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Test-e-mail (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Test-e-mail (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Test-e-mail (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Test-e-mail (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Lokale AI (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'PHP-afhankelijkheden (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Webbeheerder voor databases' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Webbeheerder voor MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web en PHP',
      bd: 'Databases',
      otros: 'E-mail, AI en tunnels',
    },
    instalados: 'Geïnstalleerd',
    ninguno: 'Geen versie geïnstalleerd',
    elegir: 'Kies een versie',
    buscando: 'Versies zoeken…',
    sinVersiones: 'Geen versies gevonden',
    rama: (rama: string) => rama,
    yaInstalada: 'al geïnstalleerd',
    fases: {
      descargando: 'Downloaden',
      verificando: 'SHA-256 verifiëren',
      extrayendo: 'Uitpakken',
      compilando: 'Compileren',
      listo: 'Geïnstalleerd',
      error: 'Installatie mislukt',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} geïnstalleerd`,
  },
  sitios: {
    titulo: 'Sites',
    descripcion: 'Elke site is een map die door Nginx wordt geserveerd op zijn eigen .test-domein.',
    nuevo: 'Nieuwe site',
    buscar: 'Zoeken op naam of domein',
    sinResultados: (q: string) => `Geen enkele site komt overeen met "${q}".`,
    vacioTitulo: 'Nog geen sites',
    vacio:
      'Kies de map van een project en WolfCore Dev detecteert of het Laravel, CodeIgniter of statisch is.',
    agregar: 'Site toevoegen',
    total: (n: number) => plural(n, 'site', 'sites'),
    abrirSitio: (dominio: string) => `${dominio} openen in de browser`,
    carpeta: 'Map',
    abrirCarpeta: 'Projectmap openen',
    alias: (n: number) => `+${plural(n, 'alias', 'aliassen')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statisch',
      proxy: 'Proxy (lokale poort)',
      personalizado: 'Aangepast',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (lokale poort)',
      node: 'Node / Vite (lokale poort)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statisch',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Echte gegevens',
    datosRealesAyuda: 'Bevat echte klantgegevens: wees voorzichtig bij het publiceren.',
    faltaHosts: 'Ontbreekt in hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} verwijst nog niet naar deze computer. Herstel het hosts-bestand met de melding hierboven.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Ontbreekt in hosts',
      iniciando: 'Nginx start…',
      errorNginx: 'Nginx-fout',
      nginxExterno: 'Externe Nginx',
      nginxApagado: 'Nginx gestopt',
    },
    borrar: {
      titulo: (nombre: string) => `Site ${nombre} verwijderen?`,
      texto: 'De projectmap blijft onaangeroerd.',
      hecho: (nombre: string) => `Site ${nombre} verwijderd`,
      nginxFallo: 'De site is verwijderd, maar Nginx heeft de nieuwe configuratie geweigerd',
    },
  },
  formSitio: {
    tituloNuevo: 'Nieuwe site',
    tituloEditar: 'Site bewerken',
    tituloDuplicar: 'Site dupliceren',
    paso: 'Begin met de projectmap',
    pasoAyuda:
      'Het projecttype, de PHP-versie en een voorgesteld domein worden gedetecteerd. Daarna kunt u alles wijzigen.',
    elegirCarpeta: 'Map kiezen',
    cambiarCarpeta: 'Wijzigen',
    detectando: 'Project analyseren…',
    detectado: (tipo: string) => `Gedetecteerd: ${tipo}`,
    sinDeteccionAlEditar:
      'Automatische detectie geldt alleen bij het aanmaken; controleer type en PHP.',
    nombre: 'Naam',
    nombreAyuda: 'Alleen om de site in de lijst te herkennen.',
    nombreCopia: (nombre: string) => `${nombre} (kopie)`,
    duplicarProxy:
      'De kopie verwijst naar dezelfde lokale poort als het origineel en kopieert geen processen: wijzig de poort of voeg een eigen proces toe.',
    dominio: 'Domein',
    dominioPlaceholder: 'mijn-project',
    alias: 'Aliassen',
    aliasAyuda: 'Andere .test-domeinen die dezelfde site openen. Typ en druk op Enter.',
    aliasAgregar: 'Alias toevoegen',
    carpeta: 'Projectmap',
    raizLaravel: 'Nginx serveert de submap public/.',
    tipo: 'Projecttype',
    php: 'PHP-versie',
    phpElegir: 'Kies een versie',
    phpNinguno: 'Er is geen PHP-versie geïnstalleerd.',
    phpInstalar: 'PHP installeren',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Het project vereist PHP ${pedida}, maar die is niet geïnstalleerd. PHP ${elegida} is gekozen.`,
    puertoProxy: 'Lokale poort',
    puertoProxyAyuda:
      'Nginx stuurt verzoeken door naar http://127.0.0.1:<poort> (bijvoorbeeld Vite of Node).',
    urlBaseVar: 'Basis-URL-variabele',
    urlBaseVarAyuda:
      'Bij het openen van een tunnel wordt de openbare link in deze .env-variabele geschreven en bij het sluiten hersteld.',
    urlBaseVarNinguna: 'Geen (.env niet aanpassen)',
    datosReales: 'Bevat echte klantgegevens',
    datosRealesAyuda:
      'Wordt gemarkeerd in de lijst en vraagt om bevestiging voordat u de site via een tunnel publiceert.',
    avanzado: 'Geavanceerd',
    reglasExtra: 'Extra Nginx-regels',
    reglasExtraAyuda:
      'Worden ingevoegd binnen het server-blok (beveiligingsheaders, eigen deny-regels…). Worden bij het opslaan gevalideerd met nginx -t.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Notitie',
    notaPlaceholder: 'Iets dat u over deze site wilt onthouden',
    guardar: 'Site opslaan',
    guardado: (nombre: string) => `Site ${nombre} opgeslagen`,
    errorGuardar: 'Kan de site niet opslaan',
    nginxFallo: 'De site is opgeslagen, maar Nginx heeft de configuratie geweigerd',
    nginxFalloAyuda:
      'De vorige Nginx-configuratie is hersteld. Controleer de extra regels en sla opnieuw op.',
    errores: {
      carpeta: 'Kies de projectmap',
      sufijo: 'Het domein moet eindigen op .test',
      caracteres: 'Gebruik alleen letters, cijfers, koppeltekens en punten',
      aliasIgualDominio: (d: string) => `De alias ${d} is gelijk aan het domein van de site`,
      aliasRepetido: (d: string) => `De alias ${d} komt dubbel voor`,
      ocupado: (d: string) => `Er bestaat al een site met het domein ${d}`,
      puertoFalta: 'Een proxysite heeft een poort nodig',
      puertoRango: 'De poort moet tussen 1 en 65535 liggen',
      php: 'Selecteer een PHP-versie voor deze site',
      urlBaseVar: 'Gebruik letters, cijfers en een underscore (bijvoorbeeld APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Openbare tunnel voor ${dominio}`,
    etiqueta: 'Tunnel',
    apagadoAyuda: 'Deel deze site met een tijdelijke openbare link.',
    abriendo: 'Tunnel openen…',
    cerrando: 'Tunnel sluiten…',
    error: 'De tunnel is mislukt',
    sinNginx: 'Start eerst Nginx',
    sinCloudflared: 'Installeer cloudflared in Diensten',
    abrirUrl: 'Openbare link openen',
    copiarUrl: 'Openbare link kopiëren',
    verQr: 'QR-code van de link tonen',
    qrTitulo: 'Openbare link van deze site',
    renovar: 'Vernieuwen (nieuwe link)',
    cerrar: 'Tunnel sluiten',
    confirmarTitulo: 'Een site met echte gegevens publiceren',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} bevat echte klantgegevens en zou op internet worden gepubliceerd via ${destino}: iedereen met de link kan de site bekijken zolang deze open staat. Publiceren?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} wordt op internet gepubliceerd met Expose: iedereen met de link heeft toegang zolang de tunnel open staat. Bovendien is de verzoekinspector van Expose zichtbaar voor elke computer in uw lokale netwerk. Publiceren?`,
    compartir: 'Delen',
    confirmar: 'Publiceren',
    confirmarPublicoTitulo: 'De site op internet publiceren',
    confirmarPublicoTexto: (dominio: string) =>
      `Er wordt een openbare Cloudflare-tunnel geopend voor ${dominio}: iedereen met de link heeft toegang zolang deze open staat. Publiceren?`,
    opciones: 'Tunnelopties',
    opcionesDe: (dominio: string) => `Tunnelopties voor ${dominio}`,
    proveedor: 'Provider',
    proveedorRapido: 'Snel (zonder account)',
    proveedorRapidoAyuda:
      'Een link van trycloudflare.com die telkens verandert wanneer u de tunnel opent.',
    proveedorNombre: 'Met naam (uw domein)',
    proveedorNombreAyuda:
      'Een vaste link op een eigen domein bij Cloudflare. Hiervoor hebt u een Cloudflare-account nodig.',
    cuentaConectada: 'Cloudflare-account verbonden.',
    cuentaSinConectar: 'Er is nog geen Cloudflare-account verbonden.',
    conectar: 'Verbinden met Cloudflare',
    conectando: 'Wachten op autorisatie in uw browser…',
    conectarAyuda:
      'Uw browser wordt geopend om WolfCore Dev te autoriseren voor uw account. Het certificaat blijft alleen in uw gegevensmap staan.',
    autorizacion: 'Cloudflare-autorisatie',
    abrirAutorizacion: 'Autorisatiepagina openen',
    copiarAutorizacion: 'Autorisatielink kopiëren',
    cancelarConexion: 'Annuleren',
    recrear: 'Tunnel opnieuw aanmaken',
    olvidar: 'Tunnel vergeten',
    recrearTitulo: 'Tunnel opnieuw aanmaken',
    recrearTexto: (n: string) =>
      `De tunnel "${n}" in Cloudflare wordt verwijderd en er wordt een nieuwe met dezelfde naam aangemaakt. Sites die deze gebruiken worden gesloten.`,
    olvidarTitulo: 'Tunnel vergeten',
    olvidarTexto: (n: string) =>
      `De tunnel "${n}" in Cloudflare en de opgeslagen aanmeldgegevens worden verwijderd. Sites die deze gebruiken schakelen terug naar de snelle tunnel.`,
    olvidarAqui: 'Alleen hier vergeten',
    olvidarAquiTitulo: 'De tunnel alleen op deze computer vergeten',
    olvidarAquiTexto: (n: string) =>
      `De opgeslagen aanmeldgegevens van de tunnel “${n}” worden van deze computer verwijderd; de tunnel blijft bestaan in Cloudflare. Sites die deze tunnel gebruiken keren terug naar de snelle tunnel.`,
    desconectar: 'Verbinding verbreken',
    nombreTunel: 'Naam van de tunnel',
    nombreTunelAyuda: 'Kleine letters, cijfers en koppeltekens.',
    dominioPublico: 'Openbaar domein',
    dominioPublicoAyuda:
      'Een subdomein van een domein van u in Cloudflare, bijv. demo.mijndomein.com.',
    crear: 'Aanmaken en routeren',
    guardadoNombre: 'Tunnel met naam gereed. Bij het openen wordt om bevestiging gevraagd.',
    guardadoRapido: 'Deze site gebruikt weer de snelle tunnel.',
    cambiarCierra: 'Bij het wijzigen van provider wordt de geopende tunnel van deze site gesloten.',
    usarRapido: 'De snelle tunnel gebruiken',
    nombreActual: (nombre: string, dominio: string) => `Tunnel “${nombre}” op ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} wordt gepubliceerd op ${publico} met een Cloudflare-tunnel: iedereen met de link heeft toegang zolang deze open blijft. Publiceren?`,
    proveedorNgrokAyuda:
      'Met uw ngrok-account. Het programma ngrok moet al op deze computer geïnstalleerd zijn.',
    proveedorExposeAyuda:
      'Met uw Expose-account. Expose moet al op deze computer geïnstalleerd zijn; op Windows werkt dit alleen met expose.phar. De inspector blijft zichtbaar op het lokale netwerk en wordt daarom niet gebruikt voor sites met echte gegevens.',
    proveedorTailscaleAyuda:
      'Via uw privénetwerk van Tailscale. Tailscale moet geïnstalleerd en aangemeld zijn.',
    tokenGuardado: (f: string) => `Token opgeslagen (eindigt op ${f}).`,
    tokenSinGuardar: 'Er is nog geen token opgeslagen.',
    tokenNgrok: 'ngrok-token',
    tokenExpose: 'Expose-token',
    tokenAyuda:
      'Wordt versleuteld op deze computer opgeslagen en alleen bij het openen van de tunnel aan het programma doorgegeven; wordt nooit weergegeven.',
    tokenPlaceholder: 'Plak hier het token',
    guardarToken: 'Token opslaan',
    borrarToken: 'Token verwijderen',
    usarProveedor: 'Deze provider gebruiken',
    guardadoProveedor:
      'Provider opgeslagen. Bij het openen van de tunnel wordt om bevestiging gevraagd.',
    ngrokAyudaInstalacion:
      'ngrok moet al op deze computer geïnstalleerd zijn (WolfCore Dev downloadt het niet omdat ngrok geen verifieerbare download publiceert). Uw globale configuratie blijft ongewijzigd.',
    exposeAyudaInstalacion:
      'Expose moet al geïnstalleerd zijn of het bestand expose.phar moet in de map bin/expose van de gegevens van WolfCore Dev staan (op Windows werkt het alleen met de phar; er is geen download met vingerafdruk). De verzoekinspector blijft zichtbaar op het hele lokale netwerk; daarom wordt dit niet gebruikt voor sites met echte gegevens. Uw globale configuratie blijft ongewijzigd.',
    tailscaleAlcance: 'Bereik',
    tailscaleServe: 'Serve: alleen uw tailnet',
    tailscaleServeAyuda:
      'Alleen de apparaten in uw Tailscale-netwerk. Niet bereikbaar via internet.',
    tailscaleFunnel: 'Funnel: het hele internet',
    tailscaleFunnelAyuda: 'Iedereen met de link heeft toegang, ook buiten uw tailnet.',
    tailscaleFunnelAviso:
      'Funnel publiceert deze site op internet: iedereen met de link heeft toegang zolang deze open blijft.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev installeert Tailscale niet (het is een systeemdienst): het moet al geïnstalleerd en aangemeld zijn. Niets van wat u al met Tailscale publiceert wordt gewijzigd; de site gebruikt HTTPS-poort 8443.',
    confirmarTailnetTitulo: 'Delen met uw tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} wordt gedeeld met Tailscale Serve: alleen apparaten in uw tailnet hebben toegang; het wordt niet op internet gepubliceerd. Delen?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} bevat echte klantgegevens. Met Tailscale Serve kunnen alleen apparaten in uw tailnet deze site zien (wordt niet op internet gepubliceerd). Delen?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} wordt op internet gepubliceerd met Tailscale Funnel: iedereen met de link heeft toegang zolang deze open blijft. Publiceren?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} wordt op internet gepubliceerd met ${proveedor}: iedereen met de link heeft toegang zolang deze open blijft. Publiceren?`,
    tituloError: 'De tunnel kon niet worden geopend',
  },
  tuneles: {
    titulo: 'Tunnels',
    descripcion: 'Tijdelijke openbare Cloudflare-links om een site buiten uw netwerk te tonen.',
    explicacion:
      'Snelle tunnels krijgen telkens een nieuw adres wanneer ze worden geopend of vernieuwd, en werken alleen zolang deze computer aanstaat en de processen actief blijven (als u WolfCore Dev sluit terwijl ze actief blijven, blijven ze bereikbaar).',
    columnas: { sitio: 'Site', estado: 'Status', url: 'Link', acciones: 'Acties' },
    vacioTitulo: 'Er zijn geen geopende tunnels',
    vacio: 'Schakel de tunnelschakelaar van een site in om een openbare link te verkrijgen.',
    sinNombre: 'Verwijderde site',
  },
  ajustes: {
    titulo: 'Instellingen',
    descripcion: 'Voorkeuren voor de omgeving.',
    general: 'Algemeen',
    carpetaDatos: 'Gegevensmap',
    carpetaDatosAyuda:
      'Uitvoerbare bestanden, configuratie en logboeken. Kan worden geopend, niet gewijzigd.',
    servicios: 'Diensten',
    puertoNginx: 'Nginx-poort',
    puertoNginxAyuda:
      'Meestal 80. Als dit niet 80 is, bevatten lokale URL’s het poortnummer. Geopende tunnels blijven op de vorige poort: vernieuw ze.',
    trabajadores: 'PHP-workers',
    trabajadoresAyuda:
      'php-cgi-processen per versie. Meer workers verwerken meer verzoeken tegelijk.',
    nota: 'Bij het opslaan worden de sites opnieuw gegenereerd met de nieuwe poort. Als Nginx actief is, wordt het opnieuw gestart (of herladen als de poort niet is gewijzigd), en actieve PHP-versies worden opnieuw gestart als het aantal workers wijzigt.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Instellingen opgeslagen en toegepast. Opnieuw gestart: ${reiniciados.join(', ')}.`
        : 'Instellingen opgeslagen en toegepast.',
    errorAplicar: 'Instellingen opgeslagen, maar konden niet volledig worden toegepast',
    errorSeccion: (detalle: string) => `Dit gegeven kon niet worden gelezen: ${detalle}`,
    acerca: 'Over',
    avisos: {
      titulo: 'Meldingen',
      descripcion:
        'Welke meldingen bij het belletje worden bewaard en of Windows een melding toont wanneer het venster niet zichtbaar is.',
      nativas: 'Windows-meldingen',
      nativasAyuda:
        'Alleen wanneer WolfCore Dev niet op de voorgrond staat; maximaal één per type per 5 min.',
      tiposTitulo: 'Soorten meldingen',
      versionesTitulo: 'Nieuwe versies per dienst',
      versionesAyuda:
        'Schakel een dienst uit om geen meldingen over nieuwe versies te ontvangen (het tabblad Versies blijft updates aangeven).',
      versionesDe: (s: string) => `Melden bij nieuwe versies van ${s}`,
      tipos: {
        'servicio-caido': 'Een dienst is met een fout gestopt',
        'puerto-ocupado': 'Poort bezet bij het starten van een dienst',
        'certificado-por-vencer': 'Certificaten verlopen binnenkort',
        'tunel-caido': 'Een tunnel is weggevallen',
        'proceso-error': 'Een projectproces is mislukt',
        'proceso-terminado': 'Een projectproces is voltooid',
        'receta-terminada': 'Een projectrecept is voltooid',
        doctor: 'Diagnose (Doctor)',
        'contenedor-detenido': 'Een container is gestopt',
        'version-nueva': 'Er is een nieuwe versie van een geïnstalleerde dienst',
      } as Record<string, string>,
      errorGuardar: 'De meldingen konden niet worden opgeslagen',
    },
    versionPrograma: 'Programmaversie',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Lokale autoriteit',
      autoridadAyuda:
        'WolfCore Dev ondertekent de certificaten van uw .test-sites met een eigen autoriteit. Deze wordt geïnstalleerd in de certificaatopslag van uw Windows-gebruiker, zonder beheerdersrechten.',
      instalada: 'Geïnstalleerd in Windows',
      noInstalada: 'Niet geïnstalleerd',
      instalar: 'Autoriteit installeren',
      reinstalar: 'Opnieuw installeren',
      quitar: 'Verwijderen',
      instaladaOk: 'HTTPS-autoriteit geïnstalleerd',
      quitadaOk: 'HTTPS-autoriteit verwijderd',
      cancelado: 'De bevestiging van Windows is geannuleerd. Er is niets gewijzigd.',
      fallo: 'De HTTPS-autoriteit kon niet worden gewijzigd',
      quitarTitulo: 'HTTPS-autoriteit verwijderen?',
      quitarTexto:
        'Browsers vertrouwen de certificaten van uw .test-sites niet meer totdat u deze opnieuw installeert.',
      puerto: 'HTTPS-poort',
      puertoAyuda:
        'Meestal 443. Als een ander programma deze poort gebruikt, kies dan een poort tussen 1024 en 65535; URL’s bevatten dan het poortnummer.',
      puertoRango: 'Gebruik 443 of een nummer tussen 1024 en 65535',
      puertoGuardado: (p: number) => `HTTPS gebruikt nu poort ${p}`,
      puertoAplicarFallo:
        'Poort opgeslagen, maar Nginx heeft de nieuwe configuratie niet geaccepteerd',
      firefox:
        'Firefox gebruikt een eigen certificaatopslag. Om de autoriteit te vertrouwen, opent u about:config en schakelt u in',
    },
    herramientas: {
      titulo: 'Terminal en hulpprogramma’s',
      phpPorDefecto: 'Standaard-PHP',
      phpPorDefectoAyuda:
        'De versie van php en composer in de terminal en in de snelkoppelingen van WolfCore Dev. “Terminal” gebruikt de PHP van elk project.',
      phpMasReciente: 'De nieuwste geïnstalleerde',
      phpSinInstalar: 'Installeer PHP in Diensten om een versie te kiezen',
      phpGuardado: 'Standaard-PHP bijgewerkt',
      path: 'PATH van gebruiker',
      pathAyuda:
        'Voegt php en composer van WolfCore Dev toe aan het PATH van uw gebruiker om ze in elke terminal te gebruiken.',
      pathActivo: 'Toegevoegd aan PATH',
      pathInactivo: 'Niet in PATH',
      pathAgregar: 'Toevoegen aan gebruikers-PATH',
      pathQuitar: 'Verwijderen uit PATH',
      pathTitulo: 'PATH bijgewerkt',
      pathAviso:
        'Open een nieuwe terminal om de wijziging te zien: reeds geopende terminals zien deze niet.',
      pathQuitarTitulo: 'WolfCore Dev uit PATH verwijderen?',
      pathQuitarTexto:
        'php en composer van WolfCore Dev zijn niet langer beschikbaar in nieuwe terminals. Reeds geopende terminals veranderen niet.',
      adminer: 'Adminer-poort',
      adminerAyuda: 'Adminer wordt alleen op deze computer aangeboden, op dit vaste adres.',
      terminal: 'Standaardterminal',
      terminalSistema: 'Die van het systeem (PowerShell)',
      terminalAyuda:
        'De terminal die “Terminal” in projecten opent. Als het project eigen variabelen nodig heeft (eigen PHP in het PATH, de sleutel van een agent), opent “Windows Terminal” PowerShell binnen de standaardterminal van Windows: een al geopende Windows Terminal ontvangt die variabelen niet.',
      terminalGuardada: 'Standaardterminal bijgewerkt',
      editor: 'Standaardeditor',
      editorPrimero: 'De eerste die wordt gedetecteerd',
      editorAyuda:
        'De editor die “Editor” in projecten en “Openen in editor” bij zoekopdrachten en fouten opent. VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed en Notepad++ worden gedetecteerd.',
      editorGuardado: 'Standaardeditor bijgewerkt',
      editorNinguno: 'Er is geen editor gedetecteerd.',
    },
  },
  /* ───────────── HTTPS, terminal en FTP op sites; E-mail; Lokale AI ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS actief',
    candadoAyuda: 'Deze site reageert ook via HTTPS met een certificaat van WolfCore Dev.',
    redirige: 'Stuurt door http → https',
    abrirHttp: (dominio: string) => `http://${dominio} openen in de browser`,
    abrirHttps: (url: string) => `${url} openen in de browser`,
    pendiente: (motivo: string) => `HTTPS in afwachting: ${motivo}`,
    pendienteCorto: 'HTTPS in afwachting',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `poort ${puerto} wordt gebruikt door ${nombre} (PID ${pid}).`,
    sinAutoridad: 'de certificaatautoriteit ontbreekt. Installeer deze in Instellingen.',
    pendienteAyuda:
      'De site blijft werken via HTTP. Sluit dat programma of kies een andere HTTPS-poort in Instellingen.',
    sinConfianza: 'Autoriteit niet geïnstalleerd',
    sinConfianzaAyuda:
      'De browser toont een beveiligingsmelding totdat u de autoriteit van WolfCore Dev installeert (Instellingen → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Ook via HTTPS aanbieden',
    httpsAyuda:
      'Met een eigen certificaat voor het domein en de aliassen, ondertekend door WolfCore Dev.',
    redirigir: 'Doorsturen naar HTTPS',
    redirigirAyuda:
      'Bezoeken via http worden doorgestuurd naar https. Openbare tunnels worden niet beïnvloed.',
    redirigirDeshabilitado: 'Schakel eerst HTTPS in',
    sinAutoridadTitulo: 'De HTTPS-autoriteit is niet geïnstalleerd',
    sinAutoridadTexto:
      'Zonder deze autoriteit toont de browser een beveiligingsmelding. Windows vraagt u om de installatie te bevestigen.',
    instalar: 'Autoriteit installeren',
    instalada: 'HTTPS-autoriteit geïnstalleerd',
    cancelado: 'De bevestiging van Windows is geannuleerd. Er is niets gewijzigd.',
    fallo: 'De HTTPS-autoriteit kon niet worden geïnstalleerd',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Opent een terminal in de projectmap, met de bijbehorende PHP en Composer in het PATH.',
    elegir: 'Terminal kiezen',
    predeterminada: 'standaard',
  },
  editorSitio: {
    ayuda: 'Opent de projectmap in de standaardeditor.',
    elegir: 'Openen met…',
    predeterminada: 'standaard',
    sustituido: (pred: string, usado: string) =>
      '{pred} is niet geïnstalleerd: geopend met {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'De editor kon niet worden geopend',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Gedeelde PHP ${rama}`,
    propio: (rama: string) => `Eigen PHP ${rama} voor deze site`,
    conXdebug: 'Xdebug actief',
    mostrar: 'PHP-instellingen',
    ocultar: 'PHP-instellingen verbergen',
    cargando: 'PHP-instellingen lezen…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} is uitgeschakeld: de eigen PHP van deze site start samen met deze versie.`,
    ajustesTitulo: 'Eigen php.ini',
    ajustesAyuda: (rama: string) =>
      `Worden alleen voor deze site toegevoegd aan de php.ini van PHP ${rama}. Met een eigen instelling (of met Xdebug) gebruikt de site een eigen PHP met 1 of 2 processen; andere sites veranderen niet.`,
    clave: 'Richtlijn',
    valor: 'Waarde',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `${clave || 'instelling'} verwijderen`,
    agregar: 'Instelling toevoegen',
    guardarAjustes: 'Testen en opslaan',
    ajustesGuardados: 'PHP-instellingen van de site toegepast',
    sinAjustes: 'Geen eigen instellingen: gebruikt de gedeelde php.ini ongewijzigd.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug voor ${dominio}`,
    xdebugAyuda:
      'Wordt alleen geladen in de PHP van deze site, nooit in de gedeelde PHP: de andere sites blijven even snel.',
    xdebugDescarga:
      'Xdebug is niet geïnstalleerd in deze PHP-versie: het wordt gedownload uit de catalogus (xdebug.org, SHA-256-vingerafdruk geverifieerd).',
    modo: 'Modi',
    modos: {
      debug: 'debug (breekpunten)',
      develop: 'develop (betere foutmeldingen)',
      coverage: 'coverage (dekking)',
      profile: 'profile (profilering)',
      trace: 'trace (tracering)',
    },
    puerto: 'Editorpoort',
    inicio: 'Wanneer verbinden',
    inicioTrigger: 'Alleen met XDEBUG_TRIGGER',
    inicioYes: 'Bij elk verzoek',
    inicioAyuda:
      'Met “Alleen met XDEBUG_TRIGGER” start het debuggen wanneer het verzoek de cookie, de GET/POST-parameter of de browserextensie (Xdebug Helper) meestuurt.',
    guardarXdebug: 'Xdebug opslaan',
    xdebugPuertoEnUso: (puerto: number) =>
      `Poort ${puerto} wordt al gebruikt door een PHP of andere dienst van WolfCore Dev: uw editor kan er niet op luisteren. Kies een andere poort (9003 is gebruikelijk).`,
    xdebugGuardado: 'Xdebug voor de site toegepast',
    quitarXdebug: 'Xdebug verwijderen',
    quitarXdebugTitulo: 'Xdebug van deze site verwijderen?',
    quitarXdebugTexto:
      'De configuratie wordt verwijderd. Als de site geen andere instellingen heeft, keert deze terug naar de gedeelde PHP. Het bestand launch.json van het project blijft ongewijzigd.',
    xdebugQuitado: 'Xdebug van de site verwijderd',
    ide: 'Editor',
    generarLaunch: 'launch.json genereren',
    launchTitulo: '.vscode/launch.json van het project',
    launchNuevo:
      'Er wordt een .vscode/launch.json aangemaakt met deze configuratie (PHP Debug voor VS Code, luistert alleen op 127.0.0.1).',
    launchFusion:
      'Er bestaat al een launch.json: alleen de configuratie van WolfCore wordt toegevoegd (of bijgewerkt); de overige configuraties en opmerkingen blijven behouden. Vooraf wordt een back-up met datum opgeslagen in de gegevensmap van WolfCore Dev.',
    launchSinCambios: 'Het bestand launch.json bevat deze configuratie al.',
    launchEscribir: 'launch.json schrijven',
    launchCreado: 'launch.json aangemaakt in .vscode',
    launchActualizado: (respaldo: string) => `launch.json bijgewerkt. Vorige back-up: ${respaldo}`,
    phpStorm: 'Configuratie voor PhpStorm',
    copiarPhpStorm: 'PhpStorm-configuratie kopiëren',
    errorNginx: (salida: string) =>
      `Nginx heeft de wijziging niet geaccepteerd; de vorige status is hersteld. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Gegenereerde vhost',
    conReglas: 'met eigen regels',
    manualResumen: 'Handmatig geschreven vhost (wordt niet opnieuw gegenereerd)',
    mostrar: 'Vhost bewerken',
    ocultar: 'Vhost verbergen',
    cargando: 'Vhost lezen…',
    reglasTitulo: 'Eigen regels',
    reglasAyuda:
      'Komen binnen het server-blok van deze site. Voor het toepassen worden ze getest met nginx -t op een kopie van de volledige configuratie; als iets mislukt, blijft alles zoals het was.',
    reglasEtiqueta: 'Eigen Nginx-regels',
    reglasPlaceholder: '# Bijvoorbeeld: client_max_body_size 256m;',
    snippetsTitulo: 'Fragmenten',
    insertar: (titulo: string) => `Invoegen: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache voor statische bestanden',
      'limite-subida': 'Uploadlimiet',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Beveiligingsheaders',
      websocket: 'WebSocket-proxy',
      gzip: 'gzip-compressie',
      ocultos: 'Verborgen bestanden weigeren',
    },
    aplicar: 'Testen en toepassen',
    descartar: 'Wijzigingen negeren',
    aplicado: 'Vhost toegepast en Nginx herladen',
    aplicadoApagado: 'Vhost opgeslagen; wordt gebruikt zodra Nginx wordt gestart',
    fallo: 'Nginx heeft de wijziging niet geaccepteerd; de vhost blijft zoals deze was',
    salidaTitulo: 'Uitvoer van nginx -t',
    desactivado:
      'Nginx heeft wat u voor deze site schreef niet geaccepteerd bij het toepassen van de configuratie en dit is uit de vhost weggelaten (het blijft opgeslagen). Corrigeer het en pas het opnieuw toe om het weer te gebruiken.',
    avisoDestino: (destino: string, linea: number) =>
      `Regel ${linea}: het verkeer wordt naar een andere computer verzonden (${destino}). Controleer of dit de bedoeling is.`,
    generadoTitulo: 'Gegenereerde vhost (alleen-lezen)',
    avanzadoTitulo: 'Geavanceerde modus',
    avanzadoInterruptor: 'De volledige vhost handmatig schrijven',
    avanzadoAyuda:
      'Vervangt de gegenereerde vhost. WolfCore Dev genereert deze niet meer opnieuw: als u het domein, HTTPS, poorten of de map wijzigt, moet u dit zelf aanpassen. U kunt alleen de domeinen en poorten van deze site gebruiken.',
    avanzadoActivarTitulo: 'De vhost handmatig schrijven?',
    avanzadoActivarTexto:
      'U begint vanaf de huidige gegenereerde vhost. Zolang dit actief is, worden wijzigingen aan de site (domein, HTTPS, PHP…) niet in de vhost verwerkt: u moet deze zelf aanbrengen.',
    avanzadoActivar: 'Handmatig schrijven',
    manualEtiqueta: 'Volledige vhost van de site',
    aplicarManual: 'Vhost testen en toepassen',
    volverGenerado: 'Terug naar gegenereerde vhost',
    volverGeneradoTitulo: 'Terug naar de gegenereerde vhost?',
    volverGeneradoTexto:
      'De handmatig geschreven vhost wordt in de geschiedenis opgeslagen en WolfCore Dev genereert weer de vhost van de site (met uw eigen regels).',
    historial: 'Geschiedenis',
    historialTitulo: 'Vorige versies van de vhost',
    historialVacio: 'Er zijn nog geen vorige versies.',
    historialAyuda:
      'De laatste 10 versies worden voor elke wijziging opgeslagen. Herstellen doorloopt dezelfde test met nginx -t.',
    modoReglas: 'Gegenereerd met regels',
    modoManual: 'Handmatig geschreven',
    restaurar: 'Herstellen',
    restaurarTitulo: 'Deze versie herstellen?',
    restaurarTexto: (fecha: string) =>
      `De vhost keert terug naar de staat van ${fecha}. De huidige versie blijft in de geschiedenis.`,
    restaurado: 'Versie hersteld',
  },
  lan: {
    etiqueta: 'Lokaal netwerk',
    interruptor: (dominio: string) => `${dominio} delen op het lokale netwerk`,
    apagadoAyuda: 'Open deze site vanaf uw mobiel of een ander apparaat op hetzelfde netwerk.',
    sinNginx: 'Start Nginx om de site op het lokale netwerk te delen.',
    sinRed: 'Er is geen lokaal netwerk verbonden (wifi of ethernet).',
    activo: 'Zichtbaar op het lokale netwerk',
    abriendo: 'Delen…',
    cerrando: 'Delen stoppen…',
    abrirUrl: 'Op deze computer openen',
    copiarUrl: 'Adres kopiëren',
    verQr: 'QR tonen',
    qrTitulo: (dominio: string) => `${dominio} op het lokale netwerk`,
    qrAviso: 'Scan de QR-code met een mobiel die met hetzelfde netwerk is verbonden.',
    confirmarTitulo: 'Delen op het lokale netwerk',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} wordt zonder wachtwoord zichtbaar voor elk apparaat op hetzelfde netwerk als deze computer (${ip}). Het delen stopt wanneer u de schakelaar uitschakelt, wanneer u WolfCore Dev sluit en wanneer u het opnieuw start.`,
    ipEtiqueta: 'Netwerk (IP van deze computer)',
    https: 'HTTPS gebruiken',
    httpsAyuda:
      'Met HTTPS moet de mobiel de CA van WolfCore Dev vertrouwen (knop “CA op mobiel installeren”). Zonder deze optie gebruikt de site HTTP.',
    httpsObligatorio: 'Deze site stuurt door naar HTTPS en wordt daarom via HTTPS gedeeld.',
    compartir: 'Delen op het netwerk',
    tituloError: 'Kon niet worden gedeeld op het lokale netwerk',
    caBoton: 'CA op mobiel installeren',
    firewallTitulo: 'Opent niet op de mobiel?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} bevat echte gegevens en wordt niet gedeeld op het lokale netwerk, ook niet met bevestiging.`,
    redPublica:
      'Dit netwerk is in Windows gemarkeerd als openbaar: de firewall blokkeert inkomend verkeer en de opdracht opent alleen privénetwerken. Markeer het als privé als het uw vertrouwde netwerk is.',
    firewallTexto:
      'WolfCore Dev wijzigt de firewall niet. Accepteer de Windows-melding niet voor het hele programma: gebruik de opdracht voor deze poort (alleen het lokale subnet en alleen privénetwerken) in PowerShell als administrator. Op een openbaar netwerk wordt deze niet geopend, en een bestaande blokkeerregel heeft voorrang op een toestaanregel.',
    copiarComando: 'Opdracht kopiëren',
  },
  caMovil: {
    titulo: 'CA op mobiel installeren',
    intro:
      'Scan de QR-code met een mobiel op hetzelfde netwerk om het certificaat van de autoriteit van WolfCore Dev te downloaden. Alleen dat bestand wordt aangeboden en de link sluit automatisch.',
    abriendo: 'Link openen…',
    expira: (minutos: number) => `De link sluit automatisch over ${minutos} min.`,
    expirado: 'De link is gesloten.',
    reabrir: 'Opnieuw openen',
    android: 'Android',
    ios: 'iPhone of iPad',
    pasosAndroid: [
      'Scan de QR-code of open het adres in de mobiele browser en download het bestand.',
      'Open Instellingen > Beveiliging en privacy > Meer beveiligingsinstellingen > Versleuteling en inloggegevens > Een certificaat installeren > CA-certificaat (de benamingen verschillen per merk).',
      'Vergelijk vóór het vertrouwen de SHA-256-vingerafdruk van het certificaat op uw mobiel met die in dit venster: als ze niet overeenkomen, installeer het dan niet.',
      'Kies het gedownloade bestand en accepteer de melding: dit is normaal, Android waarschuwt bij elke CA.',
    ],
    pasosIos: [
      'Open het adres in Safari en sta toe dat het profiel wordt gedownload.',
      'Open Instellingen > Profiel gedownload en vergelijk de SHA-1-vingerafdruk in de details met die in dit venster: als ze niet overeenkomen, installeer het dan niet. Installeer het daarna.',
      'Open Instellingen > Algemeen > Info > Vertrouwensinstellingen voor certificaten en schakel volledig vertrouwen in voor de CA van WolfCore Dev.',
    ],
    aviso:
      'Een geïnstalleerde CA verleent vertrouwen aan alles wat ermee wordt ondertekend op die mobiel: installeer deze alleen op uw eigen apparaten en verwijder deze wanneer u klaar bent.',
    firewallAviso: (puerto: number) =>
      'Om ervoor te zorgen dat de mobiel de link kan bereiken, moet poort ' +
      puerto +
      ' worden geopend (alleen het lokale subnet en privénetwerken). Accepteer de Windows-melding niet voor het hele programma: voer deze opdracht uit in PowerShell als administrator. Op een openbaar netwerk wordt deze niet geopend, en een bestaande blokkeerregel heeft voorrang.',
    huellas: 'Certificaatvingerafdrukken',
    tituloError: 'De CA-link kon niet worden geopend',
  },
  dialogoQr: {
    descargar: 'PNG downloaden',
    descargado: 'QR opgeslagen',
    largo: 'De tekst is te lang voor een QR-code.',
    generando: 'QR-code genereren…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `FTP-toegang voor ${dominio}`,
    apagadoAyuda: 'Sta toe om bestanden via FTP naar de map van deze site te uploaden.',
    activoAyuda: 'Toegang actief.',
    soloLecturaEtiqueta: 'alleen-lezen',
    mostrarDatos: 'FTP-gegevens tonen',
    ocultarDatos: 'FTP-gegevens verbergen',
    host: 'Server',
    puerto: 'Poort',
    usuario: 'Gebruiker',
    clave: 'Wachtwoord',
    mostrarClave: 'Wachtwoord tonen',
    ocultarClave: 'Wachtwoord verbergen',
    copiarDato: (dato: string) => `${dato} kopiëren`,
    cargando: 'FTP-gegevens lezen…',
    regenerar: 'Wachtwoord opnieuw genereren',
    regenerarTitulo: 'FTP-wachtwoord opnieuw genereren?',
    regenerarTexto:
      'Het huidige wachtwoord werkt niet meer en geopende verbindingen van deze site worden gesloten. U moet het in uw FTP-client bijwerken.',
    regenerada: 'FTP-wachtwoord opnieuw gegenereerd',
    soloLectura: 'Alleen-lezen',
    soloLecturaAyuda:
      'Downloaden is mogelijk, maar bestanden uploaden, wijzigen of verwijderen niet.',
    soloLecturaActivado: 'De FTP van deze site is nu alleen-lezen',
    soloLecturaDesactivado: 'De FTP van deze site staat nu schrijven toe',
    activado: 'FTP-toegang ingeschakeld',
    desactivarTitulo: 'FTP-toegang van deze site verwijderen?',
    desactivarTexto:
      'Het wachtwoord wordt verwijderd en open verbindingen worden gesloten. De map van de site blijft ongemoeid.',
    desactivar: 'Toegang verwijderen',
    desactivado: 'FTP-toegang verwijderd',
    redLocalAviso:
      'FTP accepteert verbindingen vanuit het lokale netwerk en verzendt het wachtwoord en de bestanden onversleuteld. Gebruik dit alleen in een vertrouwd netwerk.',
    redLocalHost: 'of het IP-adres van deze computer in uw netwerk',
    servidorApagado:
      'De FTP-server is uitgeschakeld: niemand kan verbinding maken totdat u deze inschakelt.',
    encender: 'FTP inschakelen',
    urlEtiqueta: 'Adres',
    urlAyuda: 'Het adres bevat niet het wachtwoord: dit wordt gevraagd bij het verbinden.',
    abrirUrl: 'Openen in een FTP-client',
    copiarUrl: 'FTP-adres kopiëren',
    verQr: 'QR-code van het adres tonen',
    qrTitulo: 'FTP-adres van deze site',
    qrAviso: 'De code bevat alleen het adres, niet het wachtwoord.',
  },
  correo: {
    descripcion:
      'E-mailvangers onderscheppen de e-mails die uw projecten verzenden, zodat u ze kunt bekijken zonder dat ze het internet op gaan. Ze luisteren alleen op deze computer (127.0.0.1) en er is er slechts één tegelijk actief.',
    seccionCaptadores: 'Lokale e-mailvangers',
    seccionProveedores: 'Externe SMTP-providers',
    proveedores: {
      descripcion:
        'Een echte SMTP-provider verzendt daadwerkelijk e-mail: gebruik deze om het verzenden vanuit uw project te testen voordat u het publiceert. Het wachtwoord wordt versleuteld op deze computer opgeslagen en wordt nooit getoond.',
      agregar: 'Provider toevoegen',
      vacio:
        'U hebt nog geen provider toegevoegd. Kies Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO of Gmail, of voer uw eigen provider in.',
      errorLista: 'Kan de lijst met providers niet lezen',
      tarjeta: {
        servidor: 'Server',
        usuario: 'Gebruiker',
        clave: 'Wachtwoord',
        sinClave: 'Geen wachtwoord',
        claveIlegible: 'Opgeslagen (kon niet worden gelezen)',
        red: 'Netwerk',
        redLocal: 'Server op deze computer of in het lokale netwerk (bevestigd)',
        editar: 'Bewerken',
        borrar: 'Verwijderen',
        borrarTitulo: (n: string) => `${n} verwijderen?`,
        borrarTexto:
          'De provider en het opgeslagen wachtwoord worden verwijderd. Projecten die deze provider gebruiken schakelen terug naar de lokale e-mailvanger, maar hun .env-bestanden blijven ongemoeid: ze behouden de MAIL_*-variabelen van deze provider (en het wachtwoord, als u dat hebt ingevuld). Herschrijf het e-mailblok in elk .env-bestand.',
        borrado: (n: string) => `${n} verwijderd`,
        usar: 'Gebruiken in een project',
        destino: 'Bestemmingsadres voor de test',
        destinoPlaceholder: 'uw-adres@voorbeeld.nl',
        probar: 'Verzending testen',
        probando: 'Verzenden…',
        probarAyuda:
          'Verzendt één echte e-mail naar dat adres, via een geverifieerde versleutelde verbinding. Maximaal één per 15 s.',
        sinClaveParaProbar:
          'Sla het wachtwoord van de provider op om de verzending te kunnen testen.',
        hostLocal:
          'De naam van deze server verwijst naar deze computer of naar het lokale netwerk.',
        confirmarRed: 'Lokaal netwerk bevestigen',
        enviado: (para: string) => `E-mail verzonden naar ${para}. Controleer uw postvak.`,
        fallos: {
          'correo.auth': 'De provider heeft de gebruiker of het wachtwoord geweigerd.',
          'correo.conexion': 'Kan geen verbinding maken: controleer de host en de poort.',
          'correo.tls':
            'De versleutelde verbinding is niet geldig (certificaat, naam of STARTTLS). Er is niets verzonden.',
          'correo.rechazado':
            'De server heeft het bericht of een adres geweigerd. Controleer de afzender: veel providers accepteren alleen een geverifieerde afzender of een geverifieerd domein.',
          'correo.plazo': 'De server reageerde niet op tijd (20 s).',
        },
      },
      dialogo: {
        nuevo: 'SMTP-provider toevoegen',
        editar: (n: string) => `${n} bewerken`,
        preset: 'Provider',
        presetOtro: 'Andere (gegevens handmatig invoeren)',
        presetAyuda: 'Host en poort komen uit de officiële documentatie van elke provider.',
        documentacion: 'Documentatie bekijken',
        region: 'Regio',
        nombre: 'Naam',
        nombreObligatorio: 'Voer een naam in.',
        host: 'Server (host)',
        hostAyuda: 'Alleen de naam of het IP-adres, zonder smtp:// of poort.',
        hostObligatorio: 'Voer de server in.',
        puerto: 'Poort',
        seguridad: 'Versleuteling',
        seguridadAyuda:
          'Een versleutelde verbinding met een geldig certificaat is altijd vereist: er wordt nooit teruggevallen op platte tekst.',
        tls: 'Directe TLS (poort 465)',
        starttls: 'STARTTLS (poort 587)',
        usuario: 'Gebruiker',
        usuarioObligatorio: 'Voer de gebruiker in.',
        usuarioFijoAyuda:
          'Deze provider gebruikt altijd deze gebruiker; het wachtwoord is dat van uw account.',
        clave: 'SMTP-wachtwoord',
        claveGuardada: (f: string) => `Opgeslagen: ••••${f}`,
        claveNueva: 'Voer het wachtwoord in om het op te slaan',
        claveAyuda:
          'Wordt versleuteld op deze computer opgeslagen en nooit meer getoond. Laat leeg om het niet te wijzigen.',
        remitente: 'Afzender van de test (optioneel)',
        remitenteAyuda:
          'Veel providers verzenden alleen vanaf een geverifieerde afzender of een geverifieerd domein. Als u dit leeg laat, wordt het bestemmingsadres zelf als afzender gebruikt.',
        claveSinEspacios:
          'Plak het wachtwoord precies zoals de provider het opgeeft: interne spaties blijven behouden.',
        borrarClave: 'Wachtwoord verwijderen',
        borrarClaveTitulo: (n: string) => `Het wachtwoord van ${n} verwijderen?`,
        borrarClaveTexto:
          'Het opgeslagen wachtwoord wordt verwijderd. De provider blijft in de lijst staan.',
        claveBorrada: 'Wachtwoord verwijderd',
        guardar: 'Opslaan',
        guardado: (n: string) => `${n} opgeslagen`,
        redLocalTitulo: 'Server op deze computer of in het lokale netwerk',
        redLocalTexto: (h: string) =>
          `${h} verwijst naar deze computer of naar het lokale netwerk. WolfCore Dev maakt daar alleen verbinding mee als u dit bevestigt. Is dit uw eigen server?`,
        redLocalConfirmar: 'Ja, deze is van mij',
        cambiaTitulo: 'Wachtwoord naar een andere server verzenden',
        cambiaTexto: (h: string) =>
          `De provider heeft een opgeslagen wachtwoord en u hebt de server of de gebruiker gewijzigd. Het wachtwoord wordt verzonden naar ${h}. Doorgaan?`,
        cambiaConfirmar: 'Ja, doorgaan',
      },
      env: {
        titulo: (n: string) => `${n} gebruiken in een project`,
        proyecto: 'Project',
        sinProyectos: 'Er zijn nog geen projecten.',
        yaUsaSmtp: 'Dit project verzendt al via een SMTP-provider.',
        volverCaptador: 'Terug naar de lokale e-mailvanger',
        volvio: (n: string) =>
          `${n} verzendt weer naar de lokale e-mailvanger, maar het .env-bestand is niet gewijzigd: het behoudt de MAIL_*-variabelen van de provider (en het wachtwoord, als u dat hebt ingevuld). Herschrijf het e-mailblok.`,
        incluirClave: 'Ook het wachtwoord in het .env-bestand schrijven',
        incluirClaveAyuda:
          'Niet aangevinkt: het blok bevat geen MAIL_PASSWORD en u voegt dit handmatig toe.',
        sinClaveGuardada: 'De provider heeft geen opgeslagen wachtwoord.',
        vista: 'Wijzigingen in .env (het wachtwoord is gemaskeerd)',
        textoPlano:
          'Het wachtwoord komt in platte tekst in het .env-bestand van het project te staan. Iedereen met toegang tot die map, of tot uw repository als u het uploadt, kan het lezen.',
        claveTitulo: 'Wachtwoord in .env schrijven',
        claveTexto:
          'Het wachtwoord wordt in platte tekst opgeslagen in het .env-bestand van het project. Gebruik dit alleen als het project niet naar een repository wordt geüpload en de map alleen van u is.',
        claveConfirmar: 'Ik begrijp het, wachtwoord opnemen',
        agregarGitignore: '.env toevoegen aan .gitignore',
        gitignoreTitulo: '.gitignore wijzigen',
        gitignoreTexto:
          'De regel .env wordt toegevoegd aan de .gitignore van het project (met eerst een back-up).',
        gitignoreConfirmar: 'Toevoegen',
        versionadoTitulo: 'Git volgt .env al',
        versionadoTexto:
          'De volgende commit zou uw waarden uploaden. Verwijder het uit de index met git rm --cached .env.',
        desconocidoTitulo: 'Kan git niet controleren',
        desconocidoTexto: 'Kon niet vaststellen of git het .env-bestand van dit project volgt.',
        aceptarVersionado: 'Toch schrijven',
        aceptarTitulo: 'Schrijven naar een door git gevolgd .env-bestand',
        aceptarTexto:
          'Als git het .env-bestand volgt, kunnen deze variabelen in de repository terechtkomen. Toch schrijven?',
        aceptarConfirmar: 'Toch schrijven',
        confirmarTitulo: 'Schrijven naar .env',
        confirmarTexto: (ruta: string) =>
          `Er wordt een back-up van ${ruta} opgeslagen en de MAIL_*-variabelen worden toegevoegd zonder het wachtwoord.`,
        confirmarTextoClave: (ruta: string) =>
          `Er wordt een back-up van ${ruta} opgeslagen en de MAIL_*-variabelen worden toegevoegd, met het wachtwoord in platte tekst.`,
        confirmar: 'Schrijven',
        escribir: 'Schrijven naar .env',
        escrito: (n: string) => `${n} verzendt nu via deze provider`,
      },
    },
    estado: 'Status',
    smtp: 'SMTP',
    buzon: 'Webpostvak',
    abrirBuzon: 'Postvak openen',
    noLeidos: 'Ongelezen',
    noLeidosValor: (n: number) => plural(n, 'ongelezen e-mail', 'ongelezen e-mails'),
    noLeidosError: 'Kan het postvak niet lezen',
    actualizar: 'E-mails opnieuw tellen',
    actualizaSolo: 'Wordt elke 15 seconden bijgewerkt zolang dit scherm geopend is.',
    env: 'Blok voor het .env-bestand van Laravel',
    envAyuda: (captador: string) =>
      `Plak dit in het .env-bestand van uw project. E-mail blijft in ${captador}, zonder versleuteling en zonder gebruiker.`,
    copiarEnv: 'Blok kopiëren',
    irAServicios: 'Naar Diensten',
    cargando: 'E-mailvangers laden…',
    errorLista: 'Kan de lijst met e-mailvangers niet lezen',
    captador: {
      opcional: 'Optioneel',
      elegido: 'Ontvangt de e-mail van uw projecten',
      noInstalado: 'Niet geïnstalleerd',
      instalar: 'Installeren',
      usar: 'Deze gebruiken',
      apagar: 'Uitschakelen',
      iniciando: 'Bezig met inschakelen…',
      avisoMantenimiento:
        'Deze e-mailvanger wordt nauwelijks nog onderhouden. Geef de voorkeur aan Mailpit of smtp4dev.',
    },
    notaDescartados:
      'MailHog en MailDev worden niet aangeboden: MailHog publiceert geen checksum waarmee de download kan worden geverifieerd en MailDev bestaat alleen op npm. Zonder verifieerbare checksum wordt er niets gedownload.',
    notaHost:
      'De webpostvakken reageren alleen op 127.0.0.1, maar terwijl een e-mailvanger actief is kan een kwaadaardige webpagina proberen uw postvak te lezen (DNS rebinding). smtp4dev en Papercut weigeren vreemde Host-headers; Mailpit biedt zijn postvak aan onder een geheim pad dat eigen is aan deze computer (WolfCore Dev opent dat adres voor u); Inbucket heeft geen enkele bescherming: schakel deze uit wanneer u hem niet gebruikt.',
  },
  ia: {
    descripcion:
      'Cloud-AI-providers en lokale modellen met Ollama. De sleutels worden versleuteld op deze computer opgeslagen en worden nooit getoond.',
    nube: {
      titulo: 'AI in de cloud',
      agregar: 'Provider toevoegen',
      vacio:
        'U hebt nog geen provider toegevoegd. Voeg OpenAI, Anthropic, Gemini, Hermes (Nous) of een OpenAI-compatibele provider toe.',
      errorLista: 'Kan de lijst met providers niet lezen',
    },
    local: { titulo: 'Lokale AI (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Compatibel met OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Sleutel',
      sinClave: 'Geen sleutel',
      claveIlegible: 'Opgeslagen (kon niet worden gelezen)',
      url: 'Basis-URL',
      modeloPorDefecto: 'Standaardmodel',
      ninguno: 'Geen',
      probarConexion: 'Verbinding testen',
      probarConexionAyuda: 'Toont de modellen van de provider. Verbruikt geen tokens.',
      probando: 'Testen…',
      conectado: (ms: number, n: number) => `Verbonden · ${ms} ms · ${n} modellen`,
      verModelos: (n: number) => `Alle ${n} modellen bekijken`,
      soloGratuitos: 'Alleen gratis',
      fallo: 'Kan geen verbinding maken',
      probarMensaje: 'Een bericht testen',
      probarMensajeAyuda:
        'Verzendt een kort vast bericht om te controleren of het model reageert. Verbruikt enkele tokens.',
      elegirModelo: 'Model voor het bericht',
      sinModelo: 'Test de verbinding of stel een standaardmodel in om er een te kiezen.',
      enviando: 'Verzenden…',
      respuesta: (ms: number) => `Antwoord in ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} invoertokens, ${salida} uitvoertokens`,
      usar: 'Gebruiken in een project',
      editar: 'Bewerken',
      borrar: 'Verwijderen',
      acciones: (nombre: string) => `Acties voor ${nombre}`,
    },
    costo: {
      titulo: 'Een bericht testen',
      texto: (modelo: string, proveedor: string) =>
        `Er wordt een kort, vast bericht verzonden naar het model ${modelo} van ${proveedor}. Dit verbruikt tokens van uw account: het antwoord wordt begrensd op 16 tokens en kost doorgaans fracties van een cent.`,
      enviar: 'Bericht verzenden',
    },
    dialogo: {
      nuevo: 'AI-provider toevoegen',
      editar: (nombre: string) => `${nombre} bewerken`,
      tipo: 'Type',
      preset: 'Compatibele provider',
      presetAyuda: 'Vult de naam en de URL in; u kunt ze aanpassen.',
      presetOtro: 'Andere',
      documentacion: 'Documentatie bekijken',
      nombre: 'Naam',
      urlBase: 'Basis-URL',
      urlAyuda:
        'Leeg = de officiële URL. Alleen https://, of http:// naar 127.0.0.1 of [::1] (LM Studio).',
      urlObligatoria: 'Voer de basis-URL van de compatibele provider in.',
      modelo: 'Standaardmodel (optioneel)',
      modeloAyuda: 'Wordt gebruikt in het .env-blok (AI_MODEL) en in het testbericht.',
      clave: 'API-sleutel',
      claveNueva: 'Plak de sleutel',
      claveGuardada: (final: string) =>
        `Er is een sleutel opgeslagen (${final}). Voer alleen een andere in als u deze wilt vervangen.`,
      claveAyuda:
        'Wordt versleuteld op deze computer opgeslagen en wordt nooit meer getoond. Alleen de laatste 4 tekens zijn zichtbaar.',
      claveOpcional: 'Optioneel voor lokale servers (LM Studio).',
      borrarClave: 'Sleutel verwijderen',
      guardar: 'Opslaan',
      guardado: (nombre: string) => `${nombre} opgeslagen`,
      urlCambiaTitulo: 'De sleutel gaat naar een andere URL',
      urlCambiaTexto: (url: string) =>
        `Deze provider heeft een opgeslagen sleutel. Vanaf nu wordt deze verzonden naar ${url}. Bevestig alleen als u die server vertrouwt.`,
      urlCambiaConfirmar: 'Sleutel naar de nieuwe URL verzenden',
    },
    borrar: {
      claveTitulo: (nombre: string) => `De sleutel van ${nombre} verwijderen?`,
      claveTexto:
        'De sleutel wordt van deze computer verwijderd. De .env-bestanden waarin u deze hebt geschreven blijven ongemoeid: wijzig de sleutel ook daar als u haar intrekt.',
      proveedorTitulo: (nombre: string) => `${nombre} verwijderen?`,
      proveedorTexto:
        'De provider en de opgeslagen sleutel worden verwijderd. De .env-bestanden van uw projecten blijven ongemoeid.',
      respaldos: (n: number) =>
        n === 1
          ? 'Ook de .env-back-ups verwijderen van 1 project die deze sleutel in platte tekst bevatten'
          : `Ook de .env-back-ups verwijderen van ${n} projecten die deze sleutel in platte tekst bevatten`,
      respaldosAyuda:
        'WolfCore Dev bewaart back-ups van het .env-bestand voordat het wordt overschreven, buiten de projecten. Verwijderen kan niet ongedaan worden gemaakt.',
      claveBorrada: 'Sleutel verwijderd',
      proveedorBorrado: (nombre: string) => `${nombre} verwijderd`,
      respaldosBorrados: (n: number) => `De .env-back-ups van ${n} project(en) zijn verwijderd`,
    },
    env: {
      titulo: (nombre: string) => `${nombre} gebruiken in een project`,
      proyecto: 'Project',
      sinProyectos: 'Er zijn geen projecten toegevoegd.',
      modelo: 'Model (AI_MODEL)',
      modeloAyuda: 'Optioneel. Kies er een uit de lijst of typ de naam.',
      vista: 'Blok dat naar .env wordt geschreven (de sleutel wordt gemaskeerd weergegeven)',
      cargando: 'Voorbeeld voorbereiden…',
      textoPlano:
        'De sleutel komt in platte tekst in het .env-bestand van het project te staan. Iedereen met toegang tot die map kan haar lezen.',
      copiaPrevia:
        'Van het huidige .env-bestand wordt eerst een back-up gemaakt, buiten het project (in de gegevensmap van WolfCore Dev).',
      sinClave:
        'Deze provider vereist een sleutel: sla er een op voordat u deze in een project gebruikt.',
      gitignoreFalta: 'De .gitignore van het project negeert .env niet.',
      gitignoreNoExiste: 'Het project heeft geen .gitignore.',
      gitignoreOk: 'De .gitignore negeert .env al.',
      agregarGitignore: '.env toevoegen aan .gitignore',
      gitignoreTitulo: '.gitignore wijzigen',
      gitignoreTexto:
        'De regel .env wordt toegevoegd aan de .gitignore van het project (of het bestand wordt aangemaakt), met eerst een back-up.',
      gitignoreConfirmar: 'Toevoegen aan .gitignore',
      versionadoTitulo: 'Git volgt het .env-bestand van dit project al',
      versionadoTexto:
        'Zelfs als het in .gitignore staat, zou de volgende commit de sleutel uploaden. Verwijder het eerst uit de index en maak een commit:',
      desconocidoTitulo: 'Kon niet controleren of git .env volgt',
      desconocidoTexto:
        'Git reageerde niet (niet geïnstalleerd of de map is niet vertrouwd). Als .env al in de repository staat, zou de volgende commit de sleutel uploaden. Controleer dit met:',
      aceptarVersionado: 'Ik begrijp het risico: de sleutel toch schrijven',
      aceptarTitulo: 'Schrijven hoewel git de sleutel kan uploaden',
      aceptarTexto:
        'Als .env in de repository staat, komt de sleutel in de volgende commit en in de geschiedenis terecht. Doe dit alleen als u git rm --cached .env al hebt uitgevoerd of als de repository alleen van u is.',
      aceptarConfirmar: 'Ik aanvaard het risico',
      conflictoTitulo: 'Het .env-bestand definieert deze variabelen al met een andere waarde',
      reemplazar: (claves: string) => `${claves} vervangen`,
      reemplazarTitulo: 'Variabelen in .env vervangen',
      reemplazarTexto: (claves: string) =>
        `De regels voor ${claves} die al in .env stonden worden verwijderd en vervangen door die uit het blok van WolfCore Dev. Van het vorige .env-bestand wordt eerst een back-up gemaakt.`,
      reemplazarConfirmar: 'Vervangen',
      escribir: 'Schrijven naar .env',
      confirmarTitulo: 'Sleutel in platte tekst schrijven',
      confirmarTexto: (carpeta: string) =>
        `De sleutel wordt onversleuteld geschreven in ${carpeta}. Deel dat bestand niet en upload het niet naar een repository.`,
      confirmar: 'Sleutel schrijven',
      escrito: (proyecto: string) => `AI-blok geschreven in het .env-bestand van ${proyecto}`,
      copiarComando: 'Opdracht kopiëren',
    },
  },
  iaLocal: {
    descripcion:
      'Taalmodellen die op uw computer draaien met Ollama. Gebruik ze vanuit uw projecten zonder gegevens naar het internet te verzenden.',
    sinInstalarTitulo: 'Ollama is niet geïnstalleerd',
    sinInstalar:
      'Installeer Ollama via Diensten om modellen op uw computer te downloaden en te gebruiken.',
    irAServicios: 'Naar Diensten',
    apagadoTitulo: 'Ollama is uitgeschakeld',
    apagado: 'Schakel Ollama in om modellen te bekijken, te downloaden en te testen.',
    iniciando: 'Ollama wordt ingeschakeld…',
    errorTitulo: 'Ollama kon niet worden ingeschakeld',
    encender: 'Ollama inschakelen',
    verServicios: 'Bekijken in Diensten',
    modelos: 'Geïnstalleerde modellen',
    sinModelos: 'Er zijn nog geen modellen. Download er hieronder een.',
    errorModelos: 'Kan de lijst met modellen niet lezen',
    recargar: 'Lijst opnieuw laden',
    total: (n: number) => plural(n, 'model', 'modellen'),
    espacio: 'Gebruikte ruimte',
    espacioAyuda: 'De schijfruimte die alle modellen innemen in de gegevensmap.',
    probarDe: (modelo: string) => `${modelo} testen`,
    borrarDe: (modelo: string) => `${modelo} verwijderen`,
    borrarTitulo: (modelo: string) => `Model ${modelo} verwijderen?`,
    borrarTexto: (tamano: string) =>
      `Er komt ${tamano} aan schijfruimte vrij. Om het opnieuw te gebruiken moet u het opnieuw downloaden.`,
    borrado: (modelo: string) => `Model ${modelo} verwijderd`,
    descargar: {
      titulo: 'Een model downloaden',
      campo: 'Naam van het model',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Voer de naam in die Ollama gebruikt (ollama.com/library) of kies een suggestie.',
      sugerenciaAyuda: {
        'llama3.2': 'Algemene chat, lichtgewicht',
        'qwen2.5-coder': 'Programmeren',
        mistral: 'Algemene chat',
        'nomic-embed-text': 'Embeddings voor zoekopdrachten (bots)',
      } as Record<string, string>,
      boton: 'Downloaden',
      invalido: 'Gebruik letters, cijfers en . _ : / - (bijvoorbeeld llama3.2)',
      yaInstalado: 'Dat model is al geïnstalleerd',
      enCurso: 'Dat model wordt al gedownload',
      confirmarTitulo: (modelo: string) => `${modelo} downloaden?`,
      confirmar: 'Downloaden',
    },
    progreso: {
      fases: {
        preparando: 'Voorbereiden…',
        descargando: 'Downloaden',
        verificando: 'Verifiëren',
        guardando: 'Opslaan',
        listo: 'Gereed',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} van ${total}`,
      cancelarDe: (modelo: string) => `Download van ${modelo} annuleren`,
      cancelando: 'Annuleren…',
      listo: (modelo: string) => `${modelo} gedownload`,
      cancelado: (modelo: string) => `Download van ${modelo} geannuleerd`,
      error: (modelo: string) => `Kan ${modelo} niet downloaden`,
      descartar: 'Sluiten',
      descartarDe: (modelo: string) => `Melding van ${modelo} sluiten`,
    },
    prueba: {
      titulo: 'Een model testen',
      modelo: 'Model',
      elegir: 'Kies een model',
      prompt: 'Bericht',
      placeholder: 'Typ een korte vraag en druk op Enter',
      enviar: 'Verzenden',
      respuesta: 'Antwoord',
      pensando: 'Het model antwoordt… de eerste keer kan dit even duren terwijl het wordt geladen.',
      vacia: '(Het model heeft geen tekst teruggegeven.)',
      sinModelos: 'Download een model om het te testen.',
    },
    conexion: {
      titulo: 'Verbinding vanuit uw projecten',
      base: 'Basis-URL van Ollama',
      openai: 'OpenAI-compatibel endpoint',
      env: 'Blok voor het .env-bestand',
      envAyuda:
        'Geschikt voor Laravel of voor een bot met FastAPI. WolfCore Dev schrijft niet in uw projecten.',
      copiarEnv: 'Blok kopiëren',
      copiarDato: (dato: string) => `${dato} kopiëren`,
    },
    etapaB:
      'Hermes Agent, Claude Code en Codex kunnen in Fase B met één klik verbinding maken met deze modellen.',
  },
  proyectos: {
    titulo: 'Projecten',
    descripcion:
      'Elk project is een map met zijn .test-site, zijn installatierecept en zijn processen.',
    agregar: 'Project toevoegen',
    vacioTitulo: 'Er zijn nog geen projecten',
    vacio:
      'Kloon een GitHub-repository of kies een map: WolfCore Dev herkent het projecttype en bereidt het stap voor stap voor.',
    pasos: {
      porTipo: {
        'composer-install': 'PHP-afhankelijkheden installeren (composer install)',
        'env-crear': 'Het .env-bestand aanmaken',
        'key-generate': 'De applicatiesleutel genereren',
        'bd-crear': 'De database aanmaken',
        'bd-restaurar': 'Een back-up terugzetten',
        migrar: 'De database migreren',
        'storage-link': 'Storage koppelen (storage:link)',
        'npm-ci': 'Node-afhankelijkheden installeren (npm ci)',
        'npm-build': 'Assets compileren (npm run build)',
        'python-venv': 'De virtuele omgeving aanmaken (.venv)',
        'pip-install': 'Python-afhankelijkheden installeren (pip)',
        'pgvector-activar': 'pgvector in de database inschakelen',
        'sitio-crear': 'De site aanmaken',
        comando: 'Projectopdracht',
      } as Record<string, string>,
      sitioCrear: (dominio: string) =>
        dominio ? `De site ${dominio} aanmaken` : 'De site aanmaken',
      bdRestaurar: (archivo: string | null) =>
        archivo ? `De back-up ${archivo} terugzetten` : 'Een back-up terugzetten',
      migrar: 'De database migreren',
      migrarSemilla: 'De database migreren en testgegevens laden (--seed)',
      comando: (linea: string) => (linea ? `Uitvoeren: ${linea}` : 'Projectopdracht'),
    },
    estadoPaso: {
      pendiente: 'In wachtrij',
      corriendo: 'Bezig',
      listo: 'Gereed',
      error: 'Fout',
      omitido: 'Overgeslagen',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Niet voorbereid',
      corriendo: 'Voorbereiden…',
      lista: 'Voorbereid',
      error: 'Een stap is mislukt',
      cancelada: 'Voorbereiding geannuleerd',
      incompleta: 'Voorbereiding onvolledig',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Project toevoegen',
      pestanas: { github: 'GitHub', url: 'Git-URL', carpeta: 'Map' },
      destino: 'Doelmap',
      destinoAyuda: (base: string) =>
        `Wordt gekloond naar ${base}. Gebruik "Map kiezen…" voor een andere locatie.`,
      nombreCarpeta: 'Mapnaam',
      nombrePlaceholder: 'mijn-project',
      elegirDestino: 'Map kiezen…',
      destinoPorDefecto: 'De projectenmap gebruiken',
      clonar: 'Klonen',
      clonando: 'Klonen…',
      clonado: 'Repository gekloond',
      errorClonar: 'Kan de repository niet klonen',
      sinCancelar:
        'Het klonen kan hiervandaan niet worden onderbroken: wacht tot het klaar is (dit kan enkele minuten duren).',
      sinGit:
        'Git is niet geïnstalleerd. Installeer Git (git-scm.com) en open dit dialoogvenster opnieuw.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Verbonden met GitHub CLI als ${usuario}` : 'Verbonden met GitHub CLI',
      estadoToken: 'Verbonden met een persoonlijk token',
      estadoNinguna: 'Geen verbinding met GitHub',
      ayudaNinguna:
        'Meld u aan met GitHub CLI (aanbevolen) of gebruik een fine-grained persoonlijk token met leesrechten voor inhoud.',
      instalarGh: 'GitHub CLI installeren',
      instalandoGh: 'GitHub CLI wordt geïnstalleerd…',
      ghInstalado: 'GitHub CLI geïnstalleerd. Meld u nu aan.',
      iniciarSesion: 'Aanmelden',
      sesionAbierta:
        'Er is een venster geopend om u aan te melden. Klik wanneer u klaar bent op "Opnieuw controleren".',
      comprobar: 'Opnieuw controleren',
      usarToken: 'Een token gebruiken',
      token: 'Persoonlijk GitHub-token',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Wordt versleuteld opgeslagen op dit apparaat en wordt nooit meer weergegeven of in projecten geschreven.',
      guardarToken: 'Token opslaan',
      tokenGuardado: 'Token opgeslagen',
      quitarToken: 'Token verwijderen',
      tokenQuitado: 'Token verwijderd',
      buscar: 'Repositories zoeken',
      cargando: 'Repositories laden…',
      sinRepos: 'Geen repositories gevonden.',
      cargarMas: 'Meer laden',
      privado: 'Privé',
      yaClonado: 'Al gekloond',
      yaClonadoAyuda: 'Er is al een project met deze repository of in de doelmap.',
      actualizado: (fecha: string) => `Bijgewerkt ${fecha}`,
      elegir: 'Kiezen',
      errorRepos: 'Kan de lijst met repositories niet lezen',
    },
    url: {
      etiqueta: 'Repository-URL',
      placeholder: 'https://github.com/gebruiker/project.git',
      ayuda:
        'https://…, git@host:pad of gebruiker/project (GitHub). Zonder gebruikersnaam of wachtwoord in de URL.',
      invalida: 'Gebruik https://…, git@host:pad of gebruiker/project',
    },
    carpeta: {
      titulo: 'Project dat al op dit apparaat staat',
      texto: 'Kies de map: het projecttype wordt gedetecteerd en een recept wordt voorgesteld.',
      elegir: 'Map kiezen',
      manual: 'Toevoegen zonder recept (handmatige configuratie)',
      yaEsProyecto: (nombre: string) => `Die map is al het project ${nombre}.`,
      vigilarTitulo: 'Bewaakte map',
      vigilarTexto:
        'WolfCore Dev geeft een melding wanneer er een nieuwe map verschijnt die op een project lijkt. Dit is ook de plek waar repositories worden gekloond.',
      vigilando: (carpeta: string) => `Bewaakt ${carpeta}`,
      sinVigilar: 'Er wordt geen map bewaakt.',
      vigilar: 'Map kiezen om te bewaken',
      cambiarVigilada: 'Wijzigen',
      dejarDeVigilar: 'Stoppen met bewaken',
    },
    asistente: {
      titulo: (nombre: string) => `${nombre} voorbereiden`,
      cargando: 'Project wordt geanalyseerd…',
      origenYml: 'Het recept komt uit de wolfcore.yml van de repository.',
      origenDefecto: 'Voorgesteld recept op basis van het projecttype.',
      deteccion: 'Wat er is gedetecteerd',
      deteccionAyuda: 'Pas dit aan als iets niet overeenkomt met het project.',
      tipo: 'Type',
      php: 'PHP',
      phpNinguno: 'Geen geïnstalleerd',
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
      versionAuto: 'Automatisch gedetecteerd',
      servicios: 'Diensten',
      serviciosNinguno: 'Geen',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Gedetecteerd: ${v}`,
      nodeInstalar: 'Node is niet geïnstalleerd: installeer het bij Diensten.',
      pythonInstalar: 'Python is niet geïnstalleerd: installeer het bij Diensten.',
      lenguajeInstalar: (nombre: string) =>
        `${nombre} is niet geïnstalleerd: installeer het bij Diensten.`,
      dominio: 'Domein',
      puertoProxy: 'Lokale poort',
      puertoPlaceholder: '8000',
      receta: 'Stappen',
      recetaAyuda:
        'Worden op volgorde uitgevoerd. Schakel stappen uit die u niet wilt; optionele stappen kunnen worden verplaatst.',
      subir: 'Omhoog',
      bajar: 'Omlaag',
      fijo: 'Deze stap is vereist',
      restaurar: 'Een back-up herstellen…',
      cambiarRespaldo: 'Back-up wijzigen',
      quitarRespaldo: 'Back-up verwijderen',
      sobrescribir: 'Database overschrijven als deze al tabellen bevat',
      semilla: 'Testgegevens laden (--seed)',
      sinMotor:
        'Geen database: kies een database-engine bij Diensten om er een aan te maken of een back-up te herstellen.',
      confio: 'Ik vertrouw deze repository: de installatiestappen uitvoeren',
      confioAyuda:
        "De stappen voeren programma's van het project (composer, npm, pip, migraties) uit op uw apparaat. Vink dit alleen aan als u de code kent.",
      montar: 'Project opzetten',
      montando: 'Project wordt opgezet…',
      reintentar: 'Opnieuw proberen',
      omitir: 'Overslaan',
      cancelar: 'Annuleren',
      cancelando: 'Annuleren…',
      cerrar: 'Sluiten',
      cerrarCorriendo: 'Verbergen (draait op de achtergrond door)',
      abrirSitio: 'Site openen',
      verRegistro: 'Logboek bekijken',
      ocultarRegistro: 'Logboek verbergen',
      listo: 'Het project is klaar.',
      fallo: (paso: string) =>
        `Mislukt: ${paso}. Probeer opnieuw, sla over of annuleer; niets is ongedaan gemaakt.`,
      cancelada: 'De voorbereiding is geannuleerd. U kunt deze hervatten vanaf de projectkaart.',
      incompleta: 'Er zijn nog stappen die niet zijn uitgevoerd.',
      errorCrear: 'Kan het project niet aanmaken',
      errorReceta: 'Kan het recept niet lezen',
      recetaCambio:
        'Het projectrecept (wolfcore.yml) is gewijzigd sinds u het hebt vertrouwd. Opnieuw proberen gebruikt het opgeslagen recept van de vorige keer.',
      recargar: 'Nieuw recept bekijken',
      seguirGuardada: 'Doorgaan met opgeslagen recept',
      soloLectura:
        'Type, PHP, domein, versies en poort horen bij het project: wijzig ze met Bewerken.',
    },
    tarjeta: {
      receta: 'Voorbereiding',
      reinstalar: 'Afhankelijkheden opnieuw installeren',
      reinstalarTitulo: (nombre: string) => `Het recept van ${nombre} uitvoeren?`,
      reinstalarTexto:
        'De stappen van de laatste voorbereiding worden herhaald (die u in de assistent hebt gecontroleerd):',
      noRestaura: 'wordt niet opnieuw hersteld',
      recetaCambio:
        'Het projectrecept (wolfcore.yml) is gewijzigd sinds u het hebt vertrouwd. Opnieuw installeren herhaalt het opgeslagen recept; gebruik "Recept bekijken" om het nieuwe te controleren.',
      revisarReceta: 'Recept bekijken',
      preparar: 'Voorbereiden…',
      ejecutar: 'Uitvoeren',
      verPreparacion: 'Voorbereiding bekijken',
      sinConfianza:
        'Controleer het recept en vink "Ik vertrouw deze repository" aan in de assistent om het te kunnen uitvoeren.',
      runtimes: 'Versiemeldingen',
      verRegistros: 'Logboeken bekijken',
      abrirAgente: 'Een AI-agent openen',
      vscode: 'Editor',
      vscodeAyuda: 'De projectmap openen in de standaardeditor',
      vscodeError: 'Kan de editor niet openen',
      baseDatos: 'Database',
      baseDatosAyuda: (base: string) =>
        `De database "${base}" al aangemeld openen (Adminer of phpMyAdmin)`,
      baseDatosSinDetectar: 'De database van het project openen (Adminer of phpMyAdmin)',
      sinBase:
        'Het .env-bestand van het project vermeldt geen MySQL-, MariaDB- of PostgreSQL-database.',
      adminerNoListo: 'Adminer is niet gereed',
      entradaAutomatica: 'U wordt automatisch aangemeld, zonder wachtwoord in te voeren.',
      elegirBd: 'Adminer of phpMyAdmin kiezen',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (alleen MySQL en MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin is niet gereed',
      entroComoAdmin: (usuario: string) =>
        `U bent aangemeld als ${usuario}, de serverbeheerder, omdat dit project geen eigen gebruiker gebruikt. In het .env-beheer maakt "Eigen gebruiker gebruiken" er een aan die beperkt is tot uw database.`,
      entroComoAdminSinClave: (usuario: string) =>
        `U bent aangemeld als ${usuario}, de serverbeheerder: het wachtwoord van de eigen gebruiker van dit project is niet opgeslagen op dit apparaat. In het .env-beheer genereert "Eigen gebruiker gebruiken" een nieuw wachtwoord.`,
      abrirSitio: 'De site openen in de browser',
      github: 'Repository',
      abrirRemoto: (url: string) => `${url} openen`,
      confiado: 'Vertrouwd',
      confiadoAyuda: 'De installatiestappen kunnen worden uitgevoerd.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Losgekoppelde HEAD',
      cambios: (n: number) => plural(n, 'niet-opgeslagen wijziging', 'niet-opgeslagen wijzigingen'),
      limpio: 'Geen wijzigingen',
      atras: (n: number) => `${n} op te halen`,
      adelante: (n: number) => `${n} te pushen`,
      traer: 'Wijzigingen ophalen',
      traerAyuda:
        'git pull zonder samenvoegen: bij lokale wijzigingen of uiteenlopende branches wordt niets gewijzigd.',
      alDia: 'Was al up-to-date.',
      actualizado: 'Wijzigingen opgehaald',
      sugeridosTitulo: 'Wijzigingen opgehaald',
      sugeridosTexto:
        'Op basis van wat er is gewijzigd, is het raadzaam deze stappen uit te voeren:',
      sugeridosNinguno: 'Er hoeven geen stappen te worden uitgevoerd.',
      migracionesNuevas: (n: number) => plural(n, 'nieuwe migratie', 'nieuwe migraties'),
      ejecutarSugeridos: 'Stappen uitvoeren',
      corridaTitulo: 'Stappen na het ophalen van wijzigingen',
      corridaAyuda: 'Wijzigt het opgeslagen recept van het project niet.',
      ahoraNo: 'Nu niet',
      errorEstado: 'Kan de Git-status niet lezen',
      commitIa: {
        boton: 'Commit voorstellen',
        ayuda:
          'Stelt met AI een bericht voor voor de klaargezette wijzigingen (git add) en voert de commit uit als u akkoord gaat.',
        titulo: 'Commit met voorgesteld bericht',
        proveedor: 'AI-provider',
        modelo: 'Model',
        sinProveedores:
          'Configureer een AI-cloudprovider (AI-scherm) om berichten voor te stellen.',
        privacidad:
          'De diff van de klaargezette wijzigingen wordt naar de provider verzonden, zonder .env, sleutels, certificaten, referentiebestanden of binaire bestanden, en maximaal 20.000 tekens. Verbruikt weinig tokens.',
        sugerir: 'Bericht voorstellen',
        mensaje: 'Bericht (u kunt het bewerken)',
        commit: 'Commit uitvoeren',
        commitAyuda:
          'Alleen klaargezette wijzigingen (git add): voegt geen bestanden toe en pusht niet.',
        hecho: 'Commit uitgevoerd met de klaargezette wijzigingen.',
      },
    },
    procesos: {
      titulo: 'Processen',
      /** Melding van de supervisor van een proces zonder herstart dat eindigde met code 0. */
      terminado: 'Zonder fouten beëindigd',
      ninguno: 'Geen processen. Voeg npm run dev, queue:work, uvicorn… toe',
      agregar: 'Proces toevoegen',
      editar: 'Proces bewerken',
      nuevo: 'Nieuw proces',
      interruptor: (nombre: string) => `${nombre} in- of uitschakelen`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx stuurt de site door naar dit proces.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'herstart', 'herstarts'),
      verLog: 'Log bekijken',
      ocultarLog: 'Log verbergen',
      logVacio: 'Nog geen uitvoer.',
      abrirCarpetaLog: 'Logmap openen',
      quitar: 'Proces verwijderen',
      quitarTitulo: (nombre: string) => `Het proces ${nombre} verwijderen?`,
      quitarTexto: 'Als het actief is, wordt het gestopt.',
      nombre: 'Naam',
      nombrePlaceholder: 'Vite',
      comando: 'Commando',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda:
        'Programma en argumenten, zonder shell. Gebruik aanhalingstekens voor argumenten met spaties.',
      cwd: 'Map',
      cwdPlaceholder: 'root',
      cwdAyuda: 'root of een submap van het project (bijvoorbeeld frontend).',
      puertoCampo: 'Poort',
      puertoNinguno: 'Geen',
      puertoAyuda: 'Alleen informatief, tenzij het proces het doel van de proxy is.',
      autoIniciar: 'Starten bij het openen van WolfCore Dev',
      reiniciar: 'Herstarten bij vastlopen',
      esProxy: 'Doel van Nginx-proxy',
      requiereReinicio:
        'Het proces is actief: wijzigingen in commando, map of poort worden toegepast na herstarten.',
      reinicieAhora:
        'Opgeslagen. Stop en start het proces opnieuw om de wijzigingen toe te passen.',
      guardado: 'Proces opgeslagen',
      errores: {
        comando: 'Voer het commando in',
        puerto: 'De poort moet tussen 1 en 65535 liggen',
        proxySinPuerto: 'Het proxydoel vereist een poort',
        cwd: 'Gebruik root of een submap binnen het project',
        repetido: 'Er is al een proces met die naam',
      },
      estados: {
        encendido: 'Actief',
        apagado: 'Gestopt',
        iniciando: 'Starten…',
        error: 'Fout',
        externo: 'Extern',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Logboeken van ${nombre}`,
      fuente: 'Bron',
      ninguna: 'Dit project heeft nog geen logboeken.',
      vacio: 'Het logboek is leeg.',
      actualizar: 'Vernieuwen',
      abrirCarpeta: 'Map openen',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Er is een nieuwe map die op een project lijkt'
          : `Er zijn ${n} nieuwe mappen die op projecten lijken`,
      montar: 'Voorbereiden',
      ignorar: 'Negeren',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Ongelezen e-mails',
    correoApagado: 'Mailpit uitgeschakeld',
    correoSinInstalar: 'Mailpit niet geïnstalleerd',
    modelos: 'AI-modellen',
    iaApagada: 'Ollama uitgeschakeld',
    iaSinInstalar: 'Ollama niet geïnstalleerd',
    sinLeer: 'Kan niet worden gelezen',
    sinDato: '—',
  },
  /* ───────────── Prestatiepaneel, logboekweergave en MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'u',
    dias: 'd',
    /** Worker N van een dienst (bijv. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Prestaties',
    ventana: 'Laatste 5 minuten',
    pausado: 'Gepauzeerd terwijl het venster verborgen is',
    esperando: 'Wachten op de eerste meting…',
    errorMuestreo: (detalle: string) => `Kan prestatiemeting niet opvragen: ${detalle}`,
    cpu: 'CPU',
    ram: 'Geheugen',
    disco: 'Gegevensschijf',
    red: 'Netwerk',
    deTotal: (usado: string, total: string) => `${usado} van ${total}`,
    libre: (libre: string) => `${libre} vrij`,
    bajada: 'Download',
    subida: 'Upload',
    graficaCpu: (valor: string) => `CPU-grafiek van de laatste 5 minuten; nu ${valor}`,
    graficaRam: (valor: string) => `Geheugengrafiek van de laatste 5 minuten; nu ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Netwerkgrafiek van de laatste 5 minuten; download ${bajada}, upload ${subida}`,
    alertas: {
      titulo: 'Waarschuwingen',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Poort ${puerto} van ${servicio} wordt gebruikt door een ander programma: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Het geheugen van het apparaat staat op ${porcentaje}%. Sluit af wat u niet gebruikt zodat alles beter reageert.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Er is een php-cgi die niet van WolfCore Dev is (PID ${pid}) en luistert op ${puertos.join(', ')}: overgebleven uit een vorige sessie.`,
      finalizar: 'Proces beëindigen',
      finalizarTitulo: 'Dit proces beëindigen?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) wordt afgesloten zonder openstaande gegevens op te slaan. Gebruik dit alleen als u zeker weet dat dit programma niet nodig is.`,
      finalizado: (nombre: string) => `${nombre} beëindigd`,
      verPuertos: 'Poorten bekijken',
      errorPuertos: "Kan niet controleren welke programma's de poorten gebruiken.",
    },
    procesos: {
      titulo: 'Diensten en processen',
      vacio: 'Er zijn geen diensten of projectprocessen actief.',
      nombre: 'Naam',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Poort',
      encendido: 'Actief',
      acciones: 'Acties',
      detener: 'Stoppen',
      registros: 'Logboeken bekijken',
      servicio: 'Dienst',
      proyecto: 'Project',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Logboeken',
    descripcion:
      'Volg live de logboeken van Nginx, PHP, de diensten, de sites, de projectprocessen en de tunnels.',
    fuente: 'Bron',
    elegirFuente: 'Kies een logboek',
    sinFuentes:
      'Nog geen logboeken. Ze verschijnen zodra een dienst, site of proces het eerste bericht schrijft.',
    buscar: 'Filteren op tekst',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pauzeren',
    reanudar: 'Hervatten',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 nieuwe regel gepauzeerd' : `${n} nieuwe regels gepauzeerd`,
    copiar: 'Zichtbare regels kopiëren',
    copiadas: (n: number) => (n === 1 ? '1 regel gekopieerd' : `${n} regels gekopieerd`),
    limpiar: 'Wissen',
    abrirCarpeta: 'Map openen',
    alFinal: 'Einde volgen',
    mostrarMas: 'Meer tonen',
    ocultas: (n: number) =>
      n === 1 ? '1 eerdere regel niet weergegeven' : `${n} eerdere regels niet weergegeven`,
    vacio: 'Nog geen regels. Nieuwe regels verschijnen hier zodra ze worden geschreven.',
    sinCoincidencias: 'Geen enkele regel komt overeen met het filter.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} regels` : `${visibles} van ${total} regels`,
    descartadas: (n: number) => `(de laatste 5000 worden bewaard; ${n} oudere verwijderd)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Diensten',
      sitio: 'Sites',
      laravel: 'Laravel',
      proyecto: 'Projectprocessen',
      tunel: 'Tunnels',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (toegang)',
      nginxError: 'Nginx (fouten)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (toegang)`,
      sitioError: (dominio: string) => `${dominio} (fouten)`,
      tunel: (sitio: string) => `Tunnel van ${sitio}`,
      tunelSalida: (sitio: string) => `Tunnel van ${sitio} (uitvoer)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Open een nieuwe terminal om de wijziging te zien: al geopende terminals zien deze niet.',
    enPathSinCliente: 'In het PATH, maar het commando ontbreekt',
    reparar: 'Herstellen',
    repararTitulo: 'Het commando wolf herstellen?',
    repararTexto:
      'wolf staat in het PATH maar de bestanden zijn niet volledig. Ze worden opnieuw naar de gegevensmap gekopieerd en de lokale server wordt gestart, net als bij het toevoegen.',
    titulo: 'Terminal: commando wolf',
    descripcion:
      'Bedien WolfCore Dev vanuit PowerShell, cmd of Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Werkt alleen wanneer de app geopend is.',
    activo: 'Beschikbaar in het PATH',
    enPathSinServidor: 'In het PATH, server uitgeschakeld',
    inactivo: 'Niet in het PATH',
    agregarBoton: 'wolf aan PATH toevoegen',
    quitarBoton: 'wolf uit PATH verwijderen',
    agregarTitulo: 'wolf toevoegen aan het gebruikers-PATH?',
    agregarTexto:
      'Het commando wolf wordt gekopieerd naar de gegevensmap van WolfCore Dev, die map wordt toegevoegd aan het PATH van uw gebruiker (er wordt een kopie van het oorspronkelijke PATH bewaard) en er wordt een lokale server gestart op 127.0.0.1 die alleen wolf bedient met een sleutel die bij elke start wijzigt. Een site op internet publiceren of de PHP-versie van alle terminals wijzigen wordt bovendien altijd bevestigd in het app-venster. U kunt dit op elk moment verwijderen.',
    agregar: 'Toevoegen',
    quitarTitulo: 'wolf verwijderen uit het PATH?',
    quitarTexto:
      'De map van wolf wordt uit het PATH van uw gebruiker verwijderd, de lokale server wordt gestopt en het gekopieerde commando wordt verwijderd. Al geopende terminals veranderen niet.',
    quitar: 'Verwijderen',
    listoTitulo: 'Commando wolf bijgewerkt',
    ayuda: 'Open een nieuwe terminal na het toevoegen. De server luistert alleen op 127.0.0.1.',
    aislado: 'Met een testgegevensmap (WOLFCORE_DATOS) wordt het PATH niet gewijzigd.',
    errorCargar: (detalle: string) => `Kan de status van wolf niet lezen: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP-server',
    descripcion:
      'Stelt Claude Code en andere assistenten in staat uw sites, diensten en databases vanaf dit apparaat te beheren. Luistert alleen op 127.0.0.1 en vereist een token.',
    estado: 'Status',
    activo: 'Actief',
    inactivo: 'Gestopt',
    activar: 'Activeren',
    detener: 'Stoppen',
    activado: 'MCP-server actief',
    detenido: 'MCP-server gestopt',
    direccion: 'Adres',
    puerto: 'Poort',
    puertoAyuda: 'Tussen 1024 en 65535. Indien actief, wordt deze herstart op de nieuwe poort.',
    puertoRango: 'Gebruik een getal tussen 1024 en 65535',
    puertoGuardado: (p: number) => `De MCP-server gebruikt poort ${p}`,
    copiarConfig: 'Configuratie voor Claude Code kopiëren',
    copiarConfigAyuda:
      'Kopieert de configuratie met het token naar het klembord. Plak deze in Claude Code; het token wordt hier niet weergegeven.',
    configCopiada: 'Configuratie gekopieerd naar het klembord',
    regenerar: 'Token opnieuw genereren',
    regenerarTitulo: 'Het token van de MCP-server opnieuw genereren?',
    regenerarTexto:
      'Het huidige token wordt direct ongeldig: verbonden assistenten moeten de nieuwe configuratie gebruiken.',
    regenerado: 'Token opnieuw gegenereerd. Kopieer de configuratie opnieuw.',
    errorCargar: (detalle: string) => `Kan de status van de MCP-server niet lezen: ${detalle}`,
    confirmacion: {
      titulo: 'Een assistent vraagt om bevestiging',
      herramienta: 'Hulpmiddel',
      pendientes: (actual: number, total: number) => `${actual} van ${total}`,
      aprobar: 'Goedkeuren',
      rechazar: 'Afwijzen',
      aprobada: 'Actie goedgekeurd',
      rechazada: 'Actie afgewezen',
      vencida: 'Het verzoek was niet meer in behandeling.',
      descartadas: (n: number) =>
        n === 1
          ? 'en 1 ander verzoek dat niet paste (verloopt automatisch)'
          : `en ${n} andere verzoeken die niet pasten (verlopen automatisch)`,
      falloRespuesta: (detalle: string) =>
        `Kan het antwoord niet verzenden; het verzoek blijft in behandeling. ${detalle}`,
      si: 'Ja',
      no: 'Nee',
      campos: {
        motor: 'Engine',
        base: 'Database',
        archivo: 'Bestand',
        sobrescribir: 'Overschrijven',
        pid: 'PID',
        nombre: 'Proces',
        proyecto: 'Project',
        pasos: 'Stappen',
        cantidad: 'Dumps',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Hulpmiddelen voor dagelijks gebruik. Werken offline en zonder externe diensten.',
    buscar: 'Hulpmiddel zoeken…',
    sinResultados: 'Geen enkel hulpmiddel komt overeen met de zoekopdracht.',
    abrir: 'Openen',
    procesar: 'Verwerken…',
    copiar: 'Kopiëren',
    copiado: 'Gekopieerd naar het klembord',
    limpiar: 'Wissen',
    pendienteApi:
      'In behandeling: de kern stelt deze informatie nog niet beschikbaar aan de interface.',
    lista: {
      qr: { nombre: 'QR-generator', descripcion: 'Van een tekst of de link van een tunnel; PNG.' },
      json: {
        nombre: 'JSON',
        descripcion: 'Formatteren, valideren en minimaliseren, met boomstructuur.',
      },
      regex: {
        nombre: 'Reguliere expressies',
        descripcion: 'Tester met overeenkomsten, groepen en referentie.',
      },
      diff: {
        nombre: 'Teksten vergelijken',
        descripcion: 'Verschillen naast elkaar, ook van bestanden.',
      },
      tiempo: { nombre: 'Tijd', descripcion: 'Timestamp ↔ datum, met tijdzone.' },
      puertos: {
        nombre: 'Poorten en processen',
        descripcion: 'Wat op elke poort luistert en het proces beëindigen.',
      },
      bom: {
        nombre: 'UTF-8 BOM opschonen',
        descripcion: 'Verwijdert de BOM uit bestanden of mappen.',
      },
      certificados: {
        nombre: 'Certificaten',
        descripcion: 'Uitgeven met de CA van WolfCore Dev voor elke naam.',
      },
      cripto: {
        nombre: 'Crypto',
        descripcion: 'Hash, base64, URL, UUID, wachtwoorden en JWT.',
      },
      markdown: { nombre: 'Markdown-voorbeeld', descripcion: 'Typ en bekijk het resultaat.' },
      entorno: { nombre: 'Systeemomgeving', descripcion: 'PATH, versies en variabelen.' },
      buscar: {
        nombre: 'Zoeken',
        descripcion: 'Tekst in namen en inhoud van een project, map of bestand.',
      },
      infoArchivo: {
        nombre: 'Bestandsinformatie',
        descripcion: 'Grootte, type en hashes van een bestand.',
      },
      websocket: {
        nombre: 'WebSocket-client',
        descripcion: 'Verbinden, verzenden en berichten bekijken.',
      },
      contrasenas: {
        nombre: 'Wachtwoorden',
        descripcion: 'Een wachtwoord testen en zwakke accounts in uw databases controleren.',
      },
      qrWifi: {
        nombre: 'Wi-Fi QR',
        descripcion: 'QR-code zodat anderen verbinding kunnen maken met uw netwerk.',
      },
      imagenes: {
        nombre: 'Afbeeldingen',
        descripcion: 'Converteren naar ICO of PNG en JPEG of WebP comprimeren.',
      },
      comprimir: {
        nombre: 'ZIP en PDF',
        descripcion: 'Bestanden en mappen comprimeren naar ZIP en PDF optimaliseren.',
      },
      conversor: {
        nombre: 'Documentconverter',
        descripcion:
          'Word, Excel, PDF, CSV en Markdown converteren zonder dit apparaat te verlaten.',
      },
    },
    errores: {
      jsonVacio: 'Typ of plak JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `Ongeldige JSON: controleer regel ${linea}, kolom ${columna}.`,
      banderas: 'Ongeldige vlaggen: gebruik alleen d, g, i, m, s, u, v of y, zonder herhaling.',
      trabajador: 'Kan de bewerking op de achtergrond niet uitvoeren.',
      diffLento: 'De teksten verschillen te veel om op tijd te vergelijken.',
      base64: 'Ongeldige Base64.',
      utf8: 'De gedecodeerde inhoud is geen UTF-8-tekst.',
      url: 'Ongeldige URL-reeks.',
      coste: (max: number) => `De bcrypt-kosten moeten tussen 4 en ${max} liggen.`,
      jwtPartes: 'De JWT moet uit drie delen bestaan, gescheiden door een punt.',
      jwtCabecera: 'De header van de JWT kon niet worden gelezen.',
      jwtCarga: 'De payload van de JWT kon niet worden gelezen.',
      longitud: 'De lengte moet tussen 4 en 256 liggen.',
      sinConjuntos: 'Kies ten minste één type teken.',
      sinDominios: 'Voer ten minste één naam of IP-adres in.',
      muchosDominios: (max: number) => `Maximaal ${max} namen per certificaat.`,
    },
    qr: {
      texto: 'Tekst of URL',
      textoAyuda:
        'De QR-code wordt op dit apparaat gegenereerd; er wordt niets over het netwerk verzonden.',
      tunel: 'Tunnellink van een project',
      sinTuneles: 'Geen actieve tunnels',
      descargar: 'PNG downloaden',
      vacio: 'Voer iets in om de code te genereren.',
      largo: 'De tekst is te lang voor een QR-code.',
      descargado: 'Download gestart.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Opmaak toepassen',
      minificar: 'Minificeren',
      validar: 'Valideren',
      valido: 'Geldige JSON.',
      resultado: 'Resultaat',
      arbol: 'Boomstructuur',
      mas: (n: number) => `… nog ${n}`,
    },
    regex: {
      patron: 'Patroon',
      banderas: 'Vlaggen',
      texto: 'Testtekst',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'overeenkomst' : 'overeenkomsten'}${truncado ? ' (de eerste worden getoond)' : ''}`,
      sinCoincidencias: 'Geen overeenkomsten.',
      tiempo: 'De expressie duurde te lang en is gestopt (mogelijk catastrofaal backtracking).',
      grupo: (n: number) => `Groep ${n}`,
      referencia: 'Snelle referentie',
      tabla: [
        ['.', 'Willekeurig teken (behalve regeleinde zonder s)'],
        ['\\d \\w \\s', 'Cijfer, letter/cijfer/_ en witruimte'],
        ['\\D \\W \\S', 'Het tegenovergestelde van bovenstaande'],
        ['[abc] [^abc]', 'Een uit de lijst / geen uit de lijst'],
        ['^ $', 'Begin en einde (van regel met m)'],
        ['\\b', 'Woordgrens'],
        ['* + ?', 'Nul of meer, één of meer, optioneel'],
        ['{n,m}', 'Tussen n en m herhalingen'],
        ['*? +?', 'Luie versie'],
        ['(…) (?<nombre>…)', 'Vastleggende groep en benoemde groep'],
        ['(?:…)', 'Niet-vastleggende groep'],
        ['(?=…) (?!…)', 'Gevolgd door / niet gevolgd door'],
        ['a|b', 'Alternatief'],
        ['g i m s u y', 'Globaal, hoofdletterongevoelig, meerdere regels, dotAll, Unicode, sticky'],
      ] as [string, string][],
    },
    diff: {
      original: 'Origineel',
      modificado: 'Gewijzigd',
      cargarArchivo: 'Bestand laden',
      comparar: 'Vergelijken',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} regels`,
      iguales: 'De teksten zijn gelijk.',
      archivoGrande: 'Het bestand is groter dan 5 MB; kies een kleiner bestand.',
      textoGrande: 'Elke tekst mag maximaal 5 MB groot zijn.',
      truncado: (mostradas: number, total: number) =>
        `De eerste ${mostradas} van ${total} rijen worden getoond.`,
    },
    tiempo: {
      timestamp: 'Timestamp (seconden of milliseconden)',
      fecha: 'Datum (JJJJ-MM-DD HH:mm:ss)',
      zona: 'Tijdzone',
      ahora: 'Nu',
      segundos: 'Seconden',
      milisegundos: 'Milliseconden',
      iso: 'ISO 8601 (UTC)',
      enZona: 'In de gekozen tijdzone',
      desplazamiento: 'Verschil (offset)',
      relativo: 'Relatief',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Gelezen in seconden' : 'Gelezen in milliseconden',
      timestampInvalido: 'Voer alleen cijfers in (een teken is toegestaan).',
      fechaInvalida: 'Gebruik de notatie JJJJ-MM-DD HH:mm[:ss] met een bestaande datum.',
      zonaInvalida: 'Onbekende tijdzone.',
    },
    puertos: {
      filtro: 'Filteren op poort, PID of naam',
      actualizar: 'Vernieuwen',
      columnas: {
        puerto: 'Poort',
        protocolo: 'Protocol',
        proceso: 'Proces',
        pid: 'PID',
        direcciones: 'Adressen',
        acciones: 'Acties',
      },
      propio: 'WolfCore Dev',
      sistema: 'Systeem',
      finalizar: 'Beëindigen',
      noFinalizable:
        'Systeemprocessen en processen van WolfCore Dev kunnen hier niet worden beëindigd.',
      confirmarTitulo: 'Proces beëindigen',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) wordt afgesloten zonder op te slaan. Typ ter bevestiging de naam van het proces:`,
      finalizado: (nombre: string) => `${nombre} is beëindigd.`,
      vacio: 'Geen poorten in gebruik of ze konden niet worden uitgelezen.',
    },
    bom: {
      explicacion:
        'Eerst wordt getoond welke bestanden een BOM hebben; bij het opschonen wordt van elk bestand een .bak-bom-kopie opgeslagen. node_modules, vendor, .git en binaire bestanden worden overgeslagen.',
      elegirArchivos: 'Bestanden kiezen',
      elegirCarpeta: 'Map kiezen',
      seleccion: (n: number) => `${n} ${n === 1 ? 'gekozen pad' : 'gekozen paden'}`,
      analizar: 'Analyseren',
      limpiar: 'BOM verwijderen',
      confirmar: (n: number) =>
        `De BOM wordt verwijderd uit ${n} ${n === 1 ? 'bestand' : 'bestanden'} (met kopie). Doorgaan?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'bestand met BOM' : 'bestanden met BOM'}`,
      sinBom: 'Geen enkel bestand heeft een BOM.',
      limpiados: (n: number) =>
        `${n} ${n === 1 ? 'bestand opgeschoond' : 'bestanden opgeschoond'}.`,
      copia: 'Kopie',
    },
    certificados: {
      explicacion:
        'Ondertekent een certificaat met de lokale CA van WolfCore Dev. Het .crt-bestand wordt opgeslagen waar u kiest en de sleutel (.key) ernaast; de sleutel gaat nooit via de interface.',
      dominios: 'Namen of IP-adressen (gescheiden door spatie, komma of regel)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Uitgeven en opslaan',
      guardado: 'Certificaat opgeslagen',
      certificado: 'Certificaat',
      clave: 'Sleutel',
    },
    cripto: {
      texto: 'Tekst',
      hash: 'Hash',
      calcular: 'Berekenen',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt-kostenfactor',
      bcryptTrunca: 'bcrypt gebruikt alleen de eerste 72 bytes van de tekst.',
      bcryptVerificar: 'bcrypt-hash om te verifiëren',
      verificar: 'Verifiëren',
      coincide: 'De tekst komt overeen met de hash.',
      noCoincide: 'De tekst komt niet overeen met de hash.',
      base64: 'Base64',
      base64Url: 'URL-variant',
      codificar: 'Coderen',
      decodificar: 'Decoderen',
      url: 'URL coderen',
      decodificarUrl: 'URL decoderen',
      codificarBase64: 'Base64 coderen',
      decodificarBase64: 'Base64 decoderen',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID en wachtwoorden',
      uuid: 'UUID v4',
      generar: 'Genereren',
      generarDiez: '10 genereren',
      contrasena: 'Willekeurig wachtwoord',
      longitud: 'Lengte',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Symbolen',
      jwt: 'JWT decoderen',
      jwtToken: 'Token',
      cabecera: 'Header',
      carga: 'Payload',
      firmaNoVerificada:
        'Handtekening niet geverifieerd: de inhoud wordt ongewijzigd getoond en kan gemanipuleerd zijn.',
      vencido: 'Het token is verlopen (exp).',
      vigente: 'Het token is nog geldig (exp).',
      salida: 'Resultaat',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Voorbeeld',
      ejemplo:
        '# Titel\n\nTekst met **vet**, _cursief_ en een [link](https://example.com).\n\n- Een\n- Twee\n\n```\ncode\n```\n',
      seguro:
        'Ruwe HTML wordt als tekst getoond, gevaarlijke links worden verwijderd en afbeeldingen worden niet geladen.',
      imagenOmitida: (alt: string) => `[afbeelding${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Versie van WolfCore Dev',
      navegador: 'Interface-engine',
      plataforma: 'Platform',
      idioma: 'Taal',
      zona: 'Tijdzone',
      nucleos: 'Logische kernen',
      actualizar: 'Vernieuwen',
      path: 'PATH',
      pathVacio: 'PATH is leeg.',
      herramientas: 'Hulpmiddelen van WolfCore Dev',
      noInstalada: 'Niet geïnstalleerd',
      sinRespuesta: 'Reageerde niet op tijd',
      variables: 'Omgevingsvariabelen',
      filtro: 'Variabelen filteren',
      enmascarada: 'Verborgen waarde: de naam lijkt op een geheim.',
    },
    busqueda: {
      explicacion:
        'Zoekt in namen en inhoud, zonder links te volgen en zonder binaire bestanden te lezen. Standaard worden node_modules, vendor en .git overgeslagen.',
      origen: 'Waar zoeken',
      proyecto: 'Project',
      elegirCarpeta: 'Map kiezen',
      elegirArchivo: 'Bestand kiezen',
      sinOrigen: 'Kies een project, map of bestand.',
      consulta: 'Zoektekst',
      modoNombre: 'Namen',
      modoContenido: 'Inhoud',
      modoAmbos: 'Beide',
      regex: 'Reguliere expressie',
      mayusculas: 'Hoofdlettergevoelig',
      incluir: "Alleen bestanden (gescheiden door komma's, bijv. *.php)",
      buscar: 'Zoeken',
      cancelar: 'Annuleren',
      buscando: 'Zoeken…',
      sinResultados: 'Geen overeenkomsten.',
      truncado: 'Er zijn meer resultaten dan getoond: verfijn uw zoekopdracht.',
      cancelada: 'Zoekopdracht geannuleerd.',
      abrir: 'Openen in editor',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'overeenkomst' : 'overeenkomsten'}`,
      resumen: (archivos: number, examinados: number) =>
        `in ${archivos} ${archivos === 1 ? 'bestand' : 'bestanden'} (${examinados} gecontroleerd)`,
    },
    infoArchivo: {
      elegir: 'Bestand kiezen',
      ayuda: 'Wordt lokaal gelezen om de hashes te berekenen (maximaal 200 MB).',
      nombre: 'Naam',
      tamano: 'Grootte',
      tipo: 'Type',
      modificado: 'Gewijzigd',
      sinTipo: 'Onbekend',
      grande: 'Het bestand is groter dan 200 MB: gegevens worden zonder hashes getoond.',
      calculando: 'Hashes berekenen…',
    },
    websocket: {
      url: 'URL (ws:// of wss://)',
      conectar: 'Verbinden',
      desconectar: 'Verbinding verbreken',
      mensaje: 'Bericht',
      enviar: 'Verzenden',
      urlInvalida: 'Voer een URL in die begint met ws:// of wss://.',
      conectando: 'Verbinden…',
      conectado: 'Verbonden',
      desconectado: 'Verbinding verbroken',
      error: 'Verbindingsfout',
      cerrado: (codigo: number, motivo: string) =>
        `Gesloten (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Verzonden',
      recibido: 'Ontvangen',
      binario: (n: number) => `[binair, ${n} bytes]`,
      vacio: 'Nog geen berichten.',
      tope: 'De laatste 500 berichten worden bewaard; elk bericht wordt tot 10 KB getoond.',
    },
    qrWifi: {
      ssid: 'Netwerknaam (SSID)',
      clave: 'Wachtwoord',
      seguridad: 'Beveiliging',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Geen wachtwoord',
      oculta: 'Verborgen netwerk',
      mostrar: 'Tonen',
      ocultar: 'Verbergen',
      aviso:
        'De QR-code bevat het wachtwoord in leesbare tekst: iedereen die de code ziet of fotografeert kan verbinding maken met uw netwerk. De code wordt hier gegenereerd, niet opgeslagen en gewist zodra u dit paneel sluit.',
      avisoPng:
        'Het gedownloade PNG-bestand bevat het wachtwoord eveneens in de code: bewaar het op een plek waar alleen u toegang toe heeft.',
      escribala:
        'U typt het wachtwoord zelf in: WolfCore Dev leest nooit Wi-Fi-wachtwoorden uit die in het systeem zijn opgeslagen.',
      errorSsid: 'Voer de netwerknaam in (maximaal 32 tekens).',
      errorClave: 'Voer het wachtwoord in.',
      errorClaveWpa: 'Een WPA-wachtwoord bevat tussen 8 en 63 tekens.',
      vacio: 'Vul de gegevens in om de code te bekijken.',
      alt: 'QR-code om verbinding te maken met het Wi-Fi-netwerk',
      descargar: 'PNG downloaden',
      descargado: 'QR-code opgeslagen',
      largo: 'De gegevens zijn te lang voor een QR-code.',
    },
    imagenes: {
      elegir: 'Afbeelding kiezen',
      ayuda:
        'Wordt op dit apparaat verwerkt (tot 30 MB en 12000 px per zijde). Het origineel blijft ongewijzigd: het resultaat is een nieuw bestand.',
      original: 'Origineel',
      accion: 'Actie',
      aIco: 'Converteren naar ICO',
      aPng: 'Converteren naar PNG',
      comprimir: 'Comprimeren',
      tamanos: 'ICO-formaten',
      formato: 'Indeling',
      calidad: 'Kwaliteit',
      ladoMax: 'Maximale zijde in px (leeg = origineel)',
      procesar: 'Verwerken',
      procesando: 'Verwerken…',
      guardar: 'Opslaan als…',
      antes: 'Voor',
      despues: 'Na',
      sinMejora:
        'Het resultaat is niet kleiner dan het origineel: probeer een andere kwaliteit of indeling.',
      errorAbrir: 'De afbeelding kon niet op dit apparaat worden geopend.',
      errorProcesar: 'De afbeelding kon niet worden verwerkt.',
      sufijoConvertida: '-geconverteerd',
      sufijoComprimida: '-gecomprimeerd',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% minder`
          : porcentaje < 0
            ? `${-porcentaje}% meer`
            : 'geen verschil',
      guardado: (archivo: string) => `Opgeslagen in ${archivo}`,
    },
    comprimir: {
      zip: 'Comprimeren naar ZIP',
      zipAyuda:
        'Kies bestanden of mappen. Links worden niet gevolgd en de ZIP is een nieuw bestand: een bestaand bestand wordt nooit overschreven.',
      agregarArchivos: 'Bestanden toevoegen',
      agregarCarpeta: 'Map toevoegen',
      quitar: 'Verwijderen',
      vacio: 'Nog niets gekozen.',
      crearZip: 'ZIP maken…',
      creando: 'Maken…',
      pdf: 'PDF optimaliseren',
      pdfAyuda:
        'Wordt opnieuw opgeslagen met objectstromen, in een aparte thread. Het bestand wordt alleen aangemaakt als het kleiner is; met een wachtwoord beveiligde PDF-bestanden worden niet geopend. Het origineel blijft ongewijzigd. Let op: bij opnieuw opslaan gaan digitale handtekeningen en PDF/A-conformiteit verloren.',
      elegirPdf: 'PDF kiezen',
      optimizar: 'Optimaliseren…',
      optimizando: 'Optimaliseren…',
      antes: 'Voor',
      despues: 'Na',
      sinMejora: 'De PDF zou na optimalisatie niet kleiner zijn: er is geen bestand aangemaakt.',
      sufijoOptimizado: '-geoptimaliseerd',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'link, onleesbare map of speciaal bestand is niet opgenomen' : 'links, onleesbare mappen of speciale bestanden zijn niet opgenomen'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'bestand' : 'bestanden'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% minder`
          : porcentaje < 0
            ? `${-porcentaje}% meer`
            : 'geen verschil',
      guardado: (archivo: string) => `Opgeslagen in ${archivo}`,
    },
    conversor: {
      ayuda:
        'Wordt op dit apparaat geconverteerd: het document wordt nergens geüpload. Het origineel blijft ongewijzigd; het resultaat is een nieuw bestand en overschrijft nooit een bestaand bestand.',
      elegir: 'Document kiezen',
      tipoNoSoportado:
        'Er zijn geen conversies beschikbaar voor dit bestandstype. Ondersteund worden docx, xlsx, csv, md, html en pdf (en odt, pptx en doc met LibreOffice).',
      convertirA: 'Converteren naar',
      convertir: 'Converteren…',
      convirtiendo: 'Converteren…',
      avisoLibreOffice:
        'Deze conversie gebruikt LibreOffice, dat al op dit apparaat is geïnstalleerd. WolfCore Dev installeert of downloadt het niet: het wordt zonder venster en met een tijdelijk profiel geopend.',
      sinLibreOffice:
        'Als u LibreOffice installeert, kunt u ook odt, pptx en doc converteren (WolfCore Dev installeert het niet).',
      limites:
        'Uit veiligheidsoverwegingen gelden limieten: tot 50 MB (10 MB voor md en html), 120 s, 200.000 rijen, 1000 kolommen en 5 miljoen cellen; bestanden die op een ZIP-bom lijken of XML-entiteiten bevatten worden geweigerd.',
      guardado: (archivo: string) => `Opgeslagen in ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Sterkte',
      pestanaAuditar: 'Database auditen',
      fortaleza: {
        etiqueta: 'Te testen wachtwoord',
        marcador: 'Voer een wachtwoord in',
        privacidad:
          'Wordt direct hier gemeten: er verlaat niets uw apparaat en er wordt niets opgeslagen.',
        mostrar: 'Tonen',
        ocultar: 'Verbergen',
        niveles: ['Zeer zwak', 'Zwak', 'Matig', 'Sterk', 'Zeer sterk'],
        sinAvisos: 'Geen meldingen.',
        estimacion: 'Dit is een schatting, geen garantie.',
        avisos: {
          straightRow: 'Een rij opeenvolgende toetsen is gemakkelijk te raden.',
          keyPattern: 'Korte toetsenbordpatronen zijn gemakkelijk te raden.',
          simpleRepeat: 'Het herhalen van een teken of groep maakt het nauwelijks sterker.',
          extendedRepeat: 'Herhaalde groepen zijn gemakkelijk te raden.',
          sequences: 'Reeksen zoals abc of 6543 zijn gemakkelijk te raden.',
          recentYears: 'Vermijd recente jaartallen en datums die aan u gekoppeld zijn.',
          dates: 'Vermijd datums: deze zijn gemakkelijk te raden.',
          topTen: 'Dit behoort tot de tien meest gebruikte wachtwoorden.',
          topHundred: 'Dit behoort tot de honderd meest gebruikte wachtwoorden.',
          common: 'Dit is een veelgebruikt wachtwoord.',
          similarToCommon: 'Dit lijkt op een veelgebruikt wachtwoord.',
          wordByItself: 'Een los woord is gemakkelijk te raden.',
          namesByThemselves: 'Een losse voor- of achternaam is gemakkelijk te raden.',
          commonNames: 'Veelvoorkomende voor- en achternamen zijn gemakkelijk te raden.',
          userInputs: 'Gebruik geen gegevens die anderen over u kennen.',
          l33t: 'Letters vervangen door voorspelbare symbolen (@ voor a) helpt weinig.',
          reverseWords: 'Woorden achterstevoren schrijven helpt weinig.',
          allUppercase: 'Alles in hoofdletters zetten helpt weinig.',
          capitalization: 'Alleen de eerste letter als hoofdletter schrijven helpt weinig.',
          associatedYears: 'Vermijd jaartallen die aan u gekoppeld zijn.',
          repeated: 'Vermijd herhaalde woorden en tekens.',
          longerKeyboardPattern: 'Gebruik een langer toetsenbordpatroon en verander van richting.',
          anotherWord: 'Voeg nog één of twee woorden toe; minder gebruikelijke woorden helpen.',
          useWords: 'Meerdere willekeurige woorden vormen samen een goed wachtwoord.',
          noNeed: 'U kunt veilig zijn zonder symbolen of cijfers: de lengte is doorslaggevend.',
        },
      },
      auditar: {
        limite:
          'Dit detecteert alleen zeer veelgebruikte wachtwoorden: elke hash wordt vergeleken met een korte lijst van ongeveer 200 wachtwoorden. Het is geen aanval of brute-forcetest. Dat een account niet wordt gemarkeerd betekent niet dat het wachtwoord sterk is.',
        privacidad:
          'Er wordt nooit getoond welk wachtwoord overeenkwam, en er wordt gelezen met een tijdelijke alleen-lezen gebruiker (in PostgreSQL met de sessie in alleen-lezen modus). Gebruik dit uitsluitend op uw eigen databases.',
        motor: 'Engine',
        base: 'Database',
        tabla: 'Tabel',
        columnaUsuario: 'Gebruikerskolom',
        columnaHash: 'Hashkolom',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Start de server vanuit Databases om de databases te controleren.',
        sinBases: 'Er zijn geen databases op deze server.',
        sinMotores: 'Er is geen eigen MySQL-, MariaDB- of PostgreSQL-server.',
        revisar: 'Controleren',
        revisando: 'Controleren…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'gecontroleerd account' : 'gecontroleerde accounts'} · ${d} zwak`,
        sinDebiles:
          'Geen enkel gecontroleerd account komt overeen met een veelgebruikt wachtwoord.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? 'account kon niet worden gecontroleerd' : 'accounts konden niet worden gecontroleerd'}:`,
        truncado:
          'De controle is afgebroken door de limiet van 10.000 rijen of 60 seconden: er zijn accounts overgeslagen.',
        usuario: 'Gebruiker',
        motivo: 'Reden',
        accion: 'Actie',
        motivos: {
          comun: 'Zeer veelgebruikt wachtwoord',
          formato_debil: 'Zwakke indeling (md5 of sha1 zonder salt)',
        },
        restablecer: 'Opnieuw instellen',
        mas: (n: number) => `en nog ${n} (de eerste 200 worden getoond)`,
        esquema: 'Schema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Annuleren',
        cancelando: 'Annuleren…',
        cancelada: 'Audit geannuleerd.',
        progreso: (a: number, b: number) => `${a} van ${b} gecontroleerd`,
        tiposNoRevisables: {
          vacio: 'lege hash',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (niet beschikbaar op dit apparaat of parameters buiten bereik)',
          bcrypt_otro: 'bcrypt met kostenfactor buiten bereik of $2x$-variant',
          pbkdf2_otro: 'PBKDF2 met parameters buiten bereik',
          ldap: 'LDAP-indeling ({SHA}…)',
          otro: 'onbekende indeling',
        },
        rlsActiva:
          'De tabel gebruikt rijbeveiliging (RLS): de audit ziet alleen de rijen die het beleid toestaat voor de beperkte rol, waardoor accounts kunnen ontbreken.',
        falsoPositivo:
          'Een waarde van 32 of 40 hexadecimale tekens wordt als md5 of sha1 beschouwd, maar kan iets anders zijn (bijvoorbeeld een token). Als de kolom geen wachtwoorden opslaat, is het resultaat niet bruikbaar.',
      },
      restablecer: {
        titulo: (u: string) => `Wachtwoord opnieuw instellen voor ${u}`,
        ayuda:
          'Een wachtwoord kan niet worden achterhaald: u stelt een nieuw wachtwoord in. Vooraf wordt een momentopname van de database gemaakt en een kopie van de rij opgeslagen.',
        cargando: 'Voorbeeld voorbereiden…',
        sentencia: 'Wordt uitgevoerd (de waarden worden apart doorgegeven en niet getoond)',
        formatoActual: (f: string) => `Huidige indeling: ${f}`,
        cambiaFormato:
          'Het account wordt omgezet naar bcrypt: de applicatie moet dit kunnen verifiëren (bijvoorbeeld met password_verify); anders kan niemand met dit account inloggen.',
        nueva: 'Nieuw wachtwoord',
        generar: 'Genereren',
        mostrar: 'Tonen',
        ocultar: 'Verbergen',
        anotar: 'Noteer het nu: het wordt niet opnieuw getoond en niet opgeslagen.',
        escribaUsuario: (u: string) => `Typ ter bevestiging de gebruiker: ${u}`,
        confirmar: 'Wachtwoord opnieuw instellen',
        cancelar: 'Annuleren',
        cerrar: 'Sluiten',
        hecho: 'Wachtwoord opnieuw ingesteld.',
        copiaFila: 'Kopie van de rij (identificatie en vorige hash, 30 dagen bewaard):',
        instantanea: 'Voorafgaande momentopname van de database:',
        instantaneaAyuda: 'U kunt hiernaar terugkeren via Databases › Momentopnamen.',
        aBcrypt:
          'Omzetten naar bcrypt: alleen als de applicatie password_verify of iets gelijkwaardigs gebruikt',
        avisoLegado:
          'Deze hash is md5 of sha1 zonder salt en blijft in die indeling behouden. Als de applicatie de salt apart opslaat (in een andere kolom of in een constante), kan de hash niet worden gereproduceerd en werkt het nieuwe wachtwoord niet om in te loggen.',
        datosReales: {
          titulo: 'Database met echte gegevens',
          texto:
            'Deze database hoort bij een site die is gemarkeerd met echte klantgegevens: het opnieuw instellen van een wachtwoord wijzigt een echt account.',
          casilla: 'Ik begrijp dat dit echte gegevens zijn en wil dit wachtwoord opnieuw instellen',
        },
        rlsActiva:
          'De tabel gebruikt rijbeveiliging (RLS): als het beleid dit account verbergt voor de beperkte rol, kan het wachtwoord niet opnieuw worden ingesteld.',
        copiaSinRestringir:
          'Deze kopie kon niet worden beperkt tot de gebruiker van dit apparaat: controleer de maprechten.',
      },
    },
  },
  doctor: {
    descripcion:
      'Controleert poorten, certificaten, het hosts-bestand, PATH, Visual C++, de antivirus en de diensten, en stelt voor hoe u problemen kunt herstellen.',
    revisarAhora: 'Nu controleren',
    revisando: 'Controleren…',
    sinRevision: 'Nog geen controle uitgevoerd. Klik op “Nu controleren”.',
    sinHallazgos: 'Alles in orde: geen problemen gevonden.',
    gravedades: { error: 'Fouten', aviso: 'Meldingen', info: 'Informatie' },
    evidencia: 'Wat is waargenomen',
    requiereAdmin: 'Vereist administratorrechten',
    comandoManual: 'Commando voor een administratorconsole (wordt niet automatisch uitgevoerd):',
    copiar: 'Commando kopiëren',
    copiado: 'Commando gekopieerd.',
    reparar: 'Herstellen',
    alternativa: 'Poort van WolfCore Dev verplaatsen',
    soloInforma: 'WolfCore Dev wijzigt dit niet zelfstandig: volg de aanwijzingen.',
    dialogo: {
      titulo: 'Herstel bevestigen',
      queHara: 'Dit wordt er uitgevoerd:',
      admin: 'Windows zal u om administratorrechten vragen.',
      puerto: (p: string | number) => `De nieuwe poort wordt ${p}.`,
      aplicar: 'Toepassen',
      cancelar: 'Annuleren',
    },
    estados: {
      aplicando: 'Toepassen…',
      hecha: 'Herstel toegepast.',
      fallida: 'Kon niet worden hersteld.',
    },
    revisiones: {
      puertos: 'Poorten',
      'rangos-reservados': 'Gereserveerde bereiken',
      ca: 'Certificeringsinstantie',
      certificados: 'Certificaten',
      confianza: 'Vertrouwen van de CA',
      hosts: 'Hosts-bestand',
      path: 'PATH van de gebruiker',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++-linker',
      antivirus: 'Antivirus',
      firewall: 'Firewall',
      servicios: 'Diensten',
    },
    reparaciones: {
      cambiar_puerto:
        'De poort van WolfCore Dev wijzigen naar een vrije poort. Het andere programma blijft ongemoeid.',
      puerto_manual:
        'De poort van WolfCore Dev buiten het gereserveerde bereik verplaatsen. Het vrijgeven van het bereik beslist u zelf met het getoonde commando.',
      detener_iis:
        'De IIS-dienst (W3SVC) stoppen om de poort vrij te maken. Deze wordt niet uitgeschakeld: bij het opnieuw opstarten van Windows start deze weer op.',
      regenerar_ca:
        'Een nieuwe certificeringsinstantie aanmaken, vertrouwen in Windows (u krijgt een bevestigingsvraag), de certificaten opnieuw uitgeven en de vorige verwijderen. Vooraf wordt een kopie opgeslagen.',
      regenerar_certificados:
        'De certificaten van de sites opnieuw uitgeven en Nginx opnieuw laden.',
      hosts_reescribir:
        'Het WolfCore Dev-blok in het hosts-bestand herschrijven in UTF-8, met een voorafgaande kopie. Andere regels blijven ongewijzigd.',
      hosts_solo_lectura: 'Het alleen-lezen kenmerk van het hosts-bestand verwijderen.',
      path_duplicados:
        'Dubbele vermeldingen van WolfCore Dev verwijderen uit het gebruikers-PATH, met een kopie van de vorige waarde. Andere vermeldingen blijven ongewijzigd.',
      path_ajeno:
        'Een ander hulpmiddel staat eerder in PATH. WolfCore Dev verwijdert dit niet: verplaats het zelf indien nodig.',
      instalar_vcredist:
        'Visual C++ 2015+ x64 installeren met winget. Het installatieprogramma van Microsoft vraagt zelf om toestemming.',
      instalar_build_tools:
        'Installeer de Build Tools voor Visual Studio (met de C++-hulpmiddelen) met het getoonde commando: ze zijn enkele GB groot en vereisen administratorrechten, dus u beslist zelf.',
      antivirus:
        'Het toevoegen van de gegevensmap aan de uitzonderingen van de antivirus beslist u zelf, met het getoonde commando.',
      reintentar_servicio: 'De dienst opnieuw starten.',
      firefox_confianza:
        'Voeg aan de user.js van elk Firefox-profiel de voorkeur toe die de Windows-autoriteit vertrouwt, met een voorafgaande kopie. prefs.js wordt niet aangeraakt en geopende profielen worden overgeslagen.',
    },
    confianza: {
      titulo: 'CA-vertrouwen',
      texto:
        'Windows vertrouwt de autoriteit van WolfCore Dev al; Node, Python en Firefox gebruiken hun eigen opslag.',
      sinCa:
        'Er is nog geen certificaatautoriteit. Maak deze aan via HTTPS om deze sectie te gebruiken.',
      node: {
        titulo: 'Node',
        proyectos:
          'Projectprocessen en de Terminal ontvangen NODE_EXTRA_CA_CERTS met de autoriteit.',
        ajena: 'U hebt al uw eigen NODE_EXTRA_CA_CERTS: WolfCore Dev vervangt deze niet.',
        global: "Ook als gebruikersvariabele (voor andere terminals en programma's)",
        confirmarActivar:
          "NODE_EXTRA_CA_CERTS wordt ingesteld als gebruikersvariabele. Dit geldt voor programma's die u hierna opent; de variabele wordt verwijderd wanneer u deze optie uitschakelt.",
        confirmarDesactivar:
          'De variabele NODE_EXTRA_CA_CERTS die door WolfCore Dev is ingesteld, wordt verwijderd.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Projecten met .venv ontvangen REQUESTS_CA_BUNDLE en SSL_CERT_FILE met de rootcertificaten van certifi (of die van Windows) plus de autoriteit. Nooit alleen de autoriteit.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Geen Firefox-profielen gevonden.',
        activo: 'Vertrouwt',
        inactivo: 'Vertrouwt niet',
        abierto: 'Geopend',
        fuera: 'Buiten de Firefox-map',
        avisoFuera: (lista: string) =>
          `Deze profielen bevinden zich buiten de Firefox-map en worden niet aangeraakt tenzij u dit aanvinkt: ${lista}.`,
        incluirFuera: 'Ook profielen buiten de Firefox-map wijzigen',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profiel buiten de Firefox-map is niet aangeraakt', 'profielen buiten de Firefox-map zijn niet aangeraakt')}.`,
        activar: 'Inschakelen in Firefox',
        quitar: 'Verwijderen uit Firefox',
        confirmarActivar:
          'security.enterprise_roots.enabled wordt toegevoegd aan de user.js van elk profiel, tussen markeringen van WolfCore Dev en met een voorafgaande kopie in etc/respaldos. prefs.js wordt niet aangeraakt. Profielen waarbij Firefox geopend is, worden overgeslagen: sluit Firefox eerst.',
        confirmarQuitar:
          'Het WolfCore Dev-blok wordt verwijderd uit de user.js van elk profiel (met een voorafgaande kopie). Uw overige voorkeuren blijven ongewijzigd.',
        resultadoOk: (n: number) => `Klaar in ${plural(n, 'profiel', 'profielen')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profiel is overgeslagen', 'profielen zijn overgeslagen')} omdat Firefox geopend is. Sluit Firefox en probeer het opnieuw.`,
        resultadoError: (n: number) =>
          `${plural(n, 'profiel kon niet worden', 'profielen konden niet worden')} gewijzigd.`,
      },
      confirmar: 'Bevestigen',
      cancelar: 'Annuleren',
    },
  },
  php: {
    descripcion:
      'php.ini en extensies van elke geïnstalleerde PHP-versie. Vóór het opslaan wordt de diff getoond, wordt getest met php -v en wordt een gedateerde kopie opgeslagen; als PHP niet opnieuw opstart, wordt de vorige versie hersteld.',
    rama: 'PHP-versie',
    sinPhp: 'Er is geen PHP geïnstalleerd. Installeer PHP via Diensten.',
    irServicios: 'Ga naar Diensten',
    pestanas: { ini: 'php.ini', extensiones: 'Extensies' },
    rapidosTitulo: 'Snelle waarden',
    rapidosAyuda:
      'Worden toegepast op de onderstaande tekst; niets wordt opgeslagen totdat u de diff bevestigt.',
    aplicarRapidos: 'Toepassen op tekst',
    sinValor: 'niet ingesteld',
    rapidos: {
      memory_limit: 'Geheugen per script (memory_limit)',
      upload_max_filesize: 'Maximale uploadgrootte (upload_max_filesize)',
      post_max_size: 'Maximale POST-grootte (post_max_size)',
      max_execution_time: 'Maximale tijd in seconden (max_execution_time)',
      display_errors: 'Fouten weergeven (display_errors)',
      error_reporting: 'Foutniveau (error_reporting)',
      'date.timezone': 'Tijdzone (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Regels die beginnen met ; zijn opmerkingen.',
    sinCambios: 'Geen wijzigingen ten opzichte van het opgeslagen bestand.',
    descartar: 'Wijzigingen verwerpen',
    revisar: 'Controleren en opslaan',
    diffTitulo: (rama: string) => `Wijzigingen in de php.ini van PHP ${rama}`,
    diffAyuda:
      'Er wordt een gedateerde kopie opgeslagen, getest met php -v en als PHP actief is, wordt deze herstart.',
    guardar: 'Opslaan en toepassen',
    cancelar: 'Annuleren',
    guardado: (respaldo: string) => `php.ini opgeslagen. Vorige kopie: ${respaldo}`,
    respaldosTitulo: 'Gedateerde kopieën',
    sinRespaldos: 'Nog geen kopieën.',
    restaurar: 'Herstellen',
    confirmarRestaurar: (nombre: string) =>
      `${nombre} herstellen? De huidige php.ini wordt vooraf als extra kopie opgeslagen.`,
    restaurado: 'Kopie hersteld.',
    recargar: 'Opnieuw inlezen',
    extensiones: {
      ayuda:
        'Alleen extensies die deze build in ext/ meelevert worden ingeschakeld. Extensies van derden worden geïnstalleerd uit de catalogus (variant van deze build en geverifieerde SHA-256-hash).',
      activa: 'Actief',
      inactiva: 'Inactief',
      falta: 'Bestand ontbreekt',
      catalogo: 'Catalogus',
      instalar: 'Installeren',
      instalada: (nombre: string) => `${nombre} geïnstalleerd en ingeschakeld.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} ingeschakeld.` : `${nombre} uitgeschakeld.`,
      buscar: 'Extensie zoeken',
      vacio: 'Geen overeenkomende extensies gevonden.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI en Antigravity CLI: detecteer of installeer ze en open ze in een project. Agents die dit ondersteunen verbinden met de MCP van WolfCore Dev. Geen enkele wordt automatisch geopend.',
    recargar: 'Opnieuw detecteren',
    notaMcp:
      'De geregistreerde MCP authenticeert alleen wanneer de agent vanuit WolfCore Dev wordt geopend ("Openen in een project"): het token staat in de variabele WOLFCORE_MCP_TOKEN van die terminal en wordt nooit in de configuratie van de agent geschreven. Buiten WolfCore Dev ziet de agent de vermelding "wolfcore", maar kan deze geen verbinding maken.',
    sitioElegido: (nombre: string) => `Kies een agent om te openen in ${nombre}.`,
    instalado: 'Geïnstalleerd',
    noInstalado: 'Niet geïnstalleerd',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Onbekende versie',
    verVersion: 'Versie bekijken',
    verVersionAyuda:
      'Voert het programma uit met --version (gebeurt niet automatisch bij het openen van het scherm).',
    origen: {
      propio: 'Geïnstalleerd door WolfCore Dev',
      'npm-usuario': 'Globale npm van gebruiker',
      ejecutable: 'Systeemprogramma',
    },
    mcpRegistrado: 'MCP geregistreerd',
    mcpSinRegistrar: 'MCP niet geregistreerd',
    mcpNoSoportado:
      'De documentatie staat niet toe om het token uit een omgevingsvariabele te lezen: WolfCore Dev registreert de MCP niet (het token wordt nooit naar bestanden geschreven).',
    instalar: 'Installeren',
    instalando: 'Installeren…',
    guia: 'Installatiehandleiding',
    soloGuia:
      'WolfCore Dev installeert deze niet (het installatieprogramma heeft geen vaste hash): volg de officiële handleiding.',
    abrir: 'Openen in een project',
    conectarEn: 'Koppelen in ‘Assistenten koppelen’',
    confirmarInstalar: {
      titulo: (nombre: string) => `${nombre} installeren?`,
      texto: (paquete: string) =>
        `De nieuwste gepubliceerde versie van ${paquete} wordt geïnstalleerd vanaf registry.npmjs.org, met de Node van WolfCore Dev en in de bijbehorende gegevensmap.`,
      aislado:
        'Gebruikt uw npm-configuratie niet en raakt uw globale npm niet aan. Dit kan enkele minuten duren.',
      aceptar: 'Installeren',
      hecho: (nombre: string) => `${nombre} is geïnstalleerd.`,
    },
    dialogoAbrir: {
      titulo: (nombre: string) => `${nombre} openen`,
      proyecto: 'Project',
      sinProyectos: 'Nog geen projecten.',
      proveedor: 'AI-provider',
      proveedorPropio: 'De provider die in de agent is geconfigureerd',
      proveedorAyuda:
        'Bij een provider wordt uw sleutel alleen in de omgeving van die terminal geplaatst: deze wordt niet in bestanden of op de opdrachtregel geschreven.',
      aceptar: 'Terminal openen',
      hecho: (nombre: string) => `${nombre} is geopend in een nieuwe terminal.`,
    },
    costo: {
      titulo: 'Voordat u een agent opent',
      texto:
        'Een AI-agent werkt met uw account bij de provider: elk verzoek verbruikt tokens en kan kosten met zich meebrengen. De agent kan ook projectbestanden lezen en wijzigen en opdrachten uitvoeren.',
      nunca:
        'WolfCore Dev opent nooit uit zichzelf een agent: u geeft altijd zelf de opdracht. Deze melding wordt slechts één keer getoond.',
      aceptar: 'Begrepen, openen',
    },
  },
  depuracion: {
    descripcion:
      'Bekijk hier de dump(), dd() en wd() van uw PHP-sites en de wolfdump van uw Python-processen, met bestand en regelnummer. De pagina blijft gewoon antwoorden.',
    receptor: 'Dump-opname',
    escuchando: (direccion: string, puerto: number) => `Luistert op ${direccion}:${puerto}`,
    apagado: 'Uitgeschakeld',
    memoria:
      'Dumps blijven alleen in het geheugen (de laatste 500) en gaan verloren bij het afsluiten. Ze kunnen gevoelige gegevens bevatten: bij het kopiëren worden bekende sleutels gemaskeerd.',
    sitios: 'Sites',
    sinSitios: 'Geen PHP- of FastAPI-sites.',
    sinPhp: 'Kies eerst een PHP-versie voor de site.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Herstart de processen van de site om wolfdump te laden.',
    confirmarTitulo: (sitio: string) => `Opname inschakelen op ${sitio}`,
    confirmarPhp:
      'De PHP van deze site laadt vóór elk verzoek een bestand van WolfCore Dev (auto_prepend_file, alleen op deze site) dat dump(), dd() en wd() definieert als het project deze niet definieert. Als uw bestanden een eigen functie dump() of dd() declareren zonder function_exists te controleren, geeft PHP een foutmelding: schakel de opname in dat geval uit. De site gebruikt voortaan een eigen PHP-proces.',
    usoPhp:
      'Laravel en Symfony: dump($x) en dd($x) zoals gebruikelijk. CodeIgniter 3 en andere: wd($x) verzendt zonder iets op de pagina te tonen.',
    confirmarPython:
      'De processen van deze site krijgen de module wolfdump in hun PYTHONPATH (er wordt niets in het project geschreven). Geldt vanaf de volgende start van de processen.',
    usoPython: 'from wolfdump import dump  →  dump(waarde)',
    activar: 'Opname inschakelen',
    cancelar: 'Annuleren',
    filtroSitio: 'Alle sites',
    filtroOrigen: 'Alle bronnen',
    buscar: 'Zoeken in tekst, bestand of URL',
    limpiar: 'Wissen',
    confirmarLimpiar: 'Alle dumps uit het geheugen wissen?',
    vacio: 'Er is nog geen dump binnengekomen.',
    vacioApagado: 'Schakel de opname in en start een site om te beginnen.',
    elegir: 'Kies een dump uit de lijst.',
    copiar: 'Kopiëren',
    copiado: 'Gekopieerd (met gemaskeerde sleutels)',
    sinSitio: 'zonder site',
    total: (n: number) => `${n} in geheugen`,
    archivo: 'Bestand',
    url: 'URL',
    pestanaVolcados: 'Dumps',
    pestanaErrores: 'Fouten',
    erroresDescripcion:
      'Fouten uit de logboeken van PHP, Nginx, laravel.log, CodeIgniter 3 en Python, gegroepeerd: dezelfde herhaalde fout verschijnt één keer met een teller.',
    erroresVacio: 'Geen fouten in de logboeken. Ze verschijnen hier zodra ze worden weggeschreven.',
    erroresElegir: 'Kies een fout uit de lijst.',
    actualizar: 'Vernieuwen',
    abrirEditor: 'Openen in editor',
    abrirEditorSinSitio: 'Alleen bestanden uit een sitemap kunnen worden geopend.',
    veces: (n: number) => (n === 1 ? '1 keer' : `${n} keer`),
    primera: 'Eerste keer',
    ultima: 'Laatste keer',
    fuente: 'Logboek',
    traza: 'Stacktrace (laatste keer)',
    sinTraza: 'Geen stacktrace.',
  },
  contenedores: {
    descripcion:
      'Bekijk en beheer de Docker- of Podman-containers op deze computer. WolfCore Dev maakt, verwijdert of downloadt geen containers, images of volumes.',
    motor: 'Engine',
    refrescar: 'Vernieuwen',
    detectando: 'Zoeken naar Docker en Podman…',
    sinMotorTitulo: 'Geen Docker of Podman',
    sinMotor:
      'Er is geen Docker of Podman gevonden op deze computer. WolfCore Dev installeert deze niet: als u ze nodig hebt, installeer er een vanaf de officiële website en klik op Vernieuwen.',
    instalarDocker: 'Docker installeren',
    instalarPodman: 'Podman installeren',
    apagadoTitulo: (m: string) => `${m} reageert niet`,
    apagado: (m: string) =>
      `${m} is geïnstalleerd, maar de engine reageert niet. Open Docker Desktop (of start de Podman-machine met "podman machine start") en klik op Vernieuwen.`,
    remoto:
      'Een externe verbinding is genegeerd (DOCKER_HOST, CONTAINER_HOST, een context of een standaardverbinding): WolfCore Dev gebruikt alleen de engine op deze computer.',
    desdePath: 'Gevonden in PATH, niet in de gebruikelijke installatiemap.',
    version: (v: string) => `Versie ${v}`,
    vacio: 'Geen containers.',
    columnas: {
      nombre: 'Naam',
      imagen: 'Image',
      estado: 'Status',
      puertos: 'Poorten',
      compose: 'Compose',
      acciones: 'Acties',
    },
    estados: {
      corriendo: 'Actief',
      detenido: 'Gestopt',
      pausado: 'Gepauzeerd',
      otro: 'Overig',
    },
    codigoSalida: (n: number) => `code ${n}`,
    iniciar: 'Starten',
    detener: 'Stoppen',
    reiniciar: 'Herstarten',
    registros: 'Logboeken',
    confirmarDetenerTitulo: 'Container stoppen?',
    confirmarDetener: (n: string) =>
      `"${n}" wordt gestopt. Alles wat erin draait wordt afgebroken (de engine wacht enkele seconden tot het is afgerond). Er wordt niets verwijderd.`,
    confirmarReiniciarTitulo: 'Container herstarten?',
    confirmarReiniciar: (n: string) =>
      `"${n}" wordt herstart. Alles wat erin draait wordt afgebroken en opnieuw opgestart. Er wordt niets verwijderd.`,
    confirmar: 'Bevestigen',
    cancelar: 'Annuleren',
    hecho: {
      iniciar: (n: string) => `"${n}" gestart.`,
      detener: (n: string) => `"${n}" gestopt.`,
      reiniciar: (n: string) => `"${n}" herstart.`,
    },
    registroTitulo: (n: string) => `Logboeken van "${n}"`,
    registroEsperando: 'Wachten op regels…',
    registroFin:
      'Het logboek is beëindigd (de container is gestopt of de engine heeft de verbinding verbroken).',
    cerrar: 'Sluiten',
  },
  versiones: {
    pestana: 'Versies',
    pestanaServicios: 'Diensten',
    elegirServicio: 'Dienst',
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
    },
    ayuda: {
      instancias:
        'Elke hoofdversie (8.4, 17…) heeft een eigen instantie met een eigen gegevensmap en poort: u kunt er meerdere tegelijk starten. De ster markeert de instantie die nieuwe projecten gebruiken.',
      pool: 'Elke gestarte PHP-versie heeft een eigen PHP-proces; de ster markeert de versie voor nieuwe projecten.',
      unica:
        'U kunt meerdere versies installeren, maar er is er altijd maar één actief: een andere starten wisselt de actieve versie.',
      ninguno:
        'Er hoeft niets te worden gestart: projecten gebruiken de gevraagde versie of de standaardversie (ster).',
    },
    filtroRama: 'Versie',
    todasRamas: 'Alle versies',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Alles tonen',
    origen: {
      vivo: 'Online',
      cache: (h: number) =>
        h < 1 ? 'Cache van minder dan 1 uur geleden' : `Cache van ${h} uur geleden`,
      fija: 'Offline lijst',
    },
    actualizarLista: 'Lijst bijwerken',
    errorCarga: 'Kan de lijst met versies niet lezen',
    vacio: 'Geen versies om weer te geven.',
    soporte: { lts: 'LTS', actual: 'Huidig', fin: 'Niet ondersteund', preview: 'Preview' },
    finSoporte: (f: string) => `Ondersteund tot ${f}`,
    finSoportePasado: (f: string) => `Niet meer ondersteund sinds ${f}`,
    marcas: {
      instalada: 'Geïnstalleerd',
      encendida: 'Actief',
      actualizacion: (v: string) => `Update: ${v}`,
      bloqueada: 'Vergrendeld',
      sinHuella: 'Geen gepubliceerde hash',
      huellaDebil: 'Alleen MD5-hash',
      firmada: 'Met PGP-handtekening',
    },
    ayudaFirmada:
      'De officiële bron ondertekent deze download met PGP: WolfCore Dev controleert de handtekening vóór installatie met de in de app vastgelegde sleutels.',
    ayudaSinHuella:
      'De officiële bron publiceert geen sterke hash (SHA-256 of SHA-512): de download kan niet worden geverifieerd.',
    instalar: 'Installeren',
    desinstalar: 'Verwijderen',
    encender: 'Starten',
    apagar: 'Stoppen',
    actualizar: 'Bijwerken',
    usarEsta: 'Deze versie gebruiken',
    usarEstaAyuda: (id: string) =>
      `${id} gebruikt een andere versie van deze dienst: er wordt gewisseld met een voorafgaande back-up van uw gegevens.`,
    predeterminada: 'Standaard voor nieuwe projecten',
    hacerPredeterminada: 'Gebruiken voor nieuwe projecten',
    predeterminadaHecha: (v: string) => `${v} is ingesteld als standaard.`,
    puerto: 'Poort',
    puertoDe: (id: string) => `Poort van ${id}`,
    cambiarPuerto: 'Wijzigen',
    puertoCambiado: (p: number) => `Poort gewijzigd naar ${p}.`,
    puertoProyectosTitulo: 'Projecten met de vorige poort',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Deze projecten gebruiken nog steeds poort ${viejo} in hun .env (niet gewijzigd): ${lista}. Wijzig deze naar ${nuevo}.`,
    resolver: 'Oplossen',
    instalada: (v: string) => `${v} geïnstalleerd.`,
    selector: { etiqueta: 'Instantie', predeterminada: 'standaard', apagada: 'gestopt' },
    dialogoSinHuella: {
      titulo: (v: string) => `${v} installeren zonder hash`,
      riesgo:
        'Deze versie heeft geen gepubliceerde hash van de officiële bron: WolfCore Dev kan niet controleren of het gedownloade bestand origineel is.',
      explicacion:
        'De download verloopt nog steeds via HTTPS vanaf de officiële website, maar als die website of de verbinding gecompromitteerd is, wordt dit niet opgemerkt. Installeer deze alleen als u deze echt nodig hebt.',
      alternativa: (v: string) => `Er is een geverifieerde versie van dezelfde dienst: ${v}.`,
      casilla: 'Ik begrijp het risico en wil zonder verificatie installeren',
      instalarVerificada: (v: string) => `${v} installeren (geverifieerd)`,
      instalarIgual: 'Installeren zonder verificatie',
    },
    dialogoActualizar: {
      titulo: (n: string) => `${n} bijwerken`,
      tituloRama: (v: string) => `Nieuwe versie: ${v}`,
      ninguna: 'geen',
      instancia: (id: string) =>
        `Instantie ${id} wordt bijgewerkt. Voordat er iets wordt gewijzigd:`,
      pasoInstalar: (v: string) =>
        `wordt ${v} naast de huidige versie geïnstalleerd (deze wordt niet verwijderd);`,
      pasoVolcados: 'wordt van elke database een dump gemaakt met de huidige versie;',
      pasoCopia: 'wordt de volledige gegevensmap gestopt en gekopieerd (koude kopie);',
      pasoArrancar: 'wordt de nieuwe versie gestart en gecontroleerd of deze reageert;',
      pasoVuelta:
        'als deze niet start, wordt teruggekeerd naar de vorige versie met uw gegevens en blijft de kopie bewaard.',
      datos: 'Gegevens:',
      respaldo: 'Kopie in:',
      espacio: 'Ruimte:',
      espacioLibre: (libres: string, necesarios: string) => `${libres} vrij; ${necesarios} nodig`,
      datosQuedan:
        'De vorige gegevens worden nooit verwijderd: de kopie en de dumps blijven in Update-back-ups staan totdat u ze verwijdert.',
      sinEspacio:
        'Onvoldoende schijfruimte voor de kopie: maak ruimte vrij en probeer het opnieuw.',
      alLado: (v: string) =>
        `${v} wordt geïnstalleerd. Overige geïnstalleerde versies worden niet aangeraakt; projecten die een andere versie vastleggen blijven die gebruiken.`,
      ramaExplicacion:
        'Een nieuwe hoofdversie vervangt de vorige niet: er wordt een nieuwe instantie aangemaakt met een eigen gegevensmap en poort. De huidige instantie blijft ongewijzigd.',
      copiarDesdeTitulo: 'Gegevens van de nieuwe instantie',
      copiarDesde: (id: string) =>
        `Gegevens kopiëren vanuit ${id} (er wordt een dump gemaakt en hersteld; het origineel wordt niet aangeraakt)`,
      vacia: 'Leeg beginnen',
      ramaNota:
        'Databasegebruikers worden niet gekopieerd; projecten moeten naar de poort van de nieuwe instantie verwijzen.',
      crearInstancia: 'Nieuwe instantie aanmaken',
      confirmar: 'Bijwerken met back-up',
      hecho: (v: string) => `${v} bijgewerkt.`,
      fallo: 'Bijwerken mislukt',
      ramaCreada: (id: string) => `Instantie ${id} aangemaakt.`,
      copiadas: (l: string) => `Gekopieerd: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} niet gekopieerd: ${m}`,
    },
    limpieza: {
      boton: 'Ongebruikte versies opschonen…',
      titulo: 'Ongebruikte versies opschonen',
      intro:
        "Alleen de programma's van versies die nergens worden gebruikt worden verwijderd (de map bin). Databasegegevens, instanties en uw projecten worden nooit aangeraakt.",
      cargando: 'Versies zoeken…',
      vacia: 'Geen geïnstalleerde versies.',
      sinLibres: 'Alle geïnstalleerde versies zijn in gebruik: er is niets om op te schonen.',
      fallo: 'Opschonen mislukt',
      fallaLista: 'Kan de lijst met versies niet lezen',
      bloqueada: 'Kan niet worden geselecteerd',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'versie' : 'versies'} · ${tam}`,
      destinoTitulo: 'Wat ermee te doen',
      papelera:
        'Verplaatsen naar de prullenbak: worden 7 dagen bewaard en blijven tot die tijd schijfruimte innemen',
      definitivo:
        'Definitief verwijderen: maakt de ruimte direct vrij en kan niet ongedaan worden gemaakt',
      avisoDefinitivo:
        'Definitief verwijderen: om deze versies weer te gebruiken moet u ze opnieuw downloaden.',
      instantanea:
        'Als u kiest voor definitief verwijderen, wordt vooraf een kopie van de omgevingsconfiguratie opgeslagen; in de prullenbak kunnen versies worden hersteld.',
      entiendo: 'Ik begrijp dat dit niet ongedaan kan worden gemaakt',
      confirmar: (n: number) => `${n} ${n === 1 ? 'versie' : 'versies'} verwijderen`,
      motivos: {
        predeterminada: 'Is de standaardversie',
        encendida: 'Is actief of wordt uitgevoerd',
        sitio: 'Wordt gebruikt door een project',
        instancia: 'Wordt gebruikt door een instantie (ook al is deze gestopt)',
        plantilla: 'Wordt gebruikt door een sjabloon',
        workspace: 'Wordt gebruikt door een workspace',
        runtime: 'Wordt gebruikt door een project',
        tarea: 'Wordt gebruikt door een project met geplande taken',
        duda: 'Kon niet worden gecontroleerd: wordt niet aangeraakt',
        datos: 'Bevat gegevens die alleen deze versie kan openen',
        herramienta: 'Wordt gebruikt door phpMyAdmin of Adminer',
      },
      resultadoTitulo: 'Resultaat',
      liberadas: (tam: string) => `${tam} vrijgemaakt.`,
      enPapelera: (tam: string) =>
        `${tam} staan in de prullenbak (worden na 7 dagen definitief verwijderd).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'versie is al uit bin verwijderd, maar er zijn resten achtergebleven' : 'versies zijn al uit bin verwijderd, maar er zijn resten achtergebleven'} die bij het openen van de applicatie opnieuw worden geprobeerd.`,
      instantaneaGuardada: 'Kopie van de omgeving opgeslagen vóór het verwijderen.',
      ajeno: (lista: string) =>
        `Bevat wat u daarin hebt geïnstalleerd: ${lista}. Bij het verwijderen gaat dit verloren.`,
      incluirAjeno: 'Toch verwijderen, ook al gaat dit verloren',
      sinCatalogo:
        'Staat niet meer in de catalogus: als u deze verwijdert, kunt u deze niet opnieuw downloaden.',
      papeleraTitulo: 'In de prullenbak',
      recuperar: 'Herstellen',
      recuperada: (v: string) => `${v} hersteld.`,
      borradaEl: (f: string) => `Verwijderd op ${f}`,
      fallaRecuperar: 'Herstellen mislukt',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `${v} verwijderen`,
      binario: "Alleen de programma's van deze versie worden verwijderd.",
      instancia: (id: string) =>
        `Wordt gebruikt door instantie ${id}: deze wordt gestopt en uit de lijst met instanties verwijderd.`,
      datosQuedan:
        'Uw gegevens blijven op schijf staan: als u deze versie opnieuw installeert, opent de instantie ze opnieuw.',
      borrarDatos: 'Ook de gegevens verwijderen',
      borrarAviso: (id: string) =>
        `De gegevensmap van ${id} met alle bijbehorende databases wordt verwijderd. Dit kan niet ongedaan worden gemaakt. Typ "${id}" om te bevestigen.`,
      escriba: (id: string) => `Typ ${id} om te bevestigen`,
      desinstalar: 'Verwijderen',
      desinstalarYBorrar: 'Verwijderen en gegevens wissen',
      unica:
        'Dit is de actieve versie: als dit de enige geïnstalleerde versie is, kan deze worden verwijderd terwijl de dienst is gestopt (blijft niet geïnstalleerd); als er andere versies zijn, kies dan eerst een andere als actief (ster).',
      predeterminada: (id: string) =>
        `${id} is de standaardinstantie: Databases, het .env-blok en hulpprogramma's die de engine gebruiken schakelen over naar een andere instantie (met een andere poort).`,
      hecho: (v: string) => `${v} verwijderd.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `${id} oplossen`,
      explicacion:
        'Een update is mislukt en de gegevens van deze instantie konden niet worden teruggezet, dus wordt deze niet gestart totdat u kiest wat u wilt doen. Er wordt niets verwijderd.',
      fallida: 'Aangeraakte gegevens:',
      respaldo: 'Back-up:',
      opciones: 'Wat te doen',
      devolver: (sello: string, tam: string) =>
        `De back-up ${sello} (${tam}) terugzetten; de huidige map wordt opzij gezet, niet verwijderd`,
      usarActual: 'De huidige gegevensmap gebruiken zoals deze is',
      notaActual:
        'Alleen als de huidige map volledige gegevens bevat; zo niet, kies dan een back-up.',
      notaDevolver:
        'De back-up wordt gekopieerd, gecontroleerd en pas daarna op zijn plaats gezet.',
      escriba: (id: string) => `Typ ${id} om te bevestigen`,
      elegirVersion:
        'De vergrendelingsmarkering kon niet worden gelezen: kies met welke versie de gegevens worden geopend (die van vóór de update).',
      version: 'Versie',
      confirmar: 'Oplossen',
      hecho: (id: string) => `${id} ontgrendeld. U kunt deze nu starten.`,
    },
    respaldos: {
      titulo: 'Back-ups van updates',
      descripcion:
        'Kopieën die zijn achtergelaten door updates en nieuwe versies. De gegevensmap die elke instantie gebruikt verschijnt hier nooit.',
      vacio: 'Er zijn geen kopieën.',
      tipos: {
        respaldo: 'Koude kopie',
        volcados: 'Database-dumps',
        fallida: 'Gegevens van een mislukte versie',
        restaurando: 'Onvolledig herstel',
        copia: 'Dumps voor een nieuwe versie',
      },
      archivos: (n: number) => plural(n, 'bestand', 'bestanden'),
      borrar: 'Verwijderen',
      borrarDe: (n: string) => `${n} verwijderen`,
      confirmarTitulo: 'Kopie verwijderen',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) wordt verwijderd. Dit kan niet ongedaan worden gemaakt. De gegevens die instanties gebruiken worden niet aangeraakt.`,
      borrado: 'Kopie verwijderd.',
    },
  },
  navGrupos: {
    trabajo: 'Werk',
    entorno: 'Omgeving',
    utilidades: 'Hulpprogramma’s',
  },
  avisos: {
    campana: 'Meldingen',
    campanaConNuevos: (n: number) => `Meldingen: ${n} ongelezen`,
    titulo: 'Meldingencentrum',
    vacio:
      'Er zijn geen meldingen. Hier verschijnen uitgevallen diensten, bezette poorten en bijna verlopende certificaten.',
    marcarTodos: 'Alles als gelezen markeren',
    limpiar: 'Geschiedenis wissen',
    ver: 'Bekijken',
    actualizar: 'Bijwerken',
    verVersiones: 'Versies bekijken',
    cerrar: 'Sluiten',
    niveles: { info: 'Informatie', aviso: 'Melding', error: 'Fout' },
    sinLeer: 'Ongelezen',
  },
  barra: {
    paleta: 'Zoek of voer een opdracht uit',
    atajoPaleta: 'Ctrl+K',
    tema: 'Thema wijzigen',
    idioma: 'Taal wijzigen',
  },
  preferencias: {
    titulo: 'Weergave en taal',
    descripcion: 'Wijzigingen worden direct toegepast en op deze computer opgeslagen.',
    tema: 'Thema',
    temas: { sistema: 'Systeem', claro: 'Licht', oscuro: 'Donker' },
    idioma: 'Taal',
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
    traduccionAutomatica: 'Automatische vertaling, nagekeken',
    acento: 'Accentkleur',
    acentos: {
      indigo: 'Indigo',
      azul: 'Blauw',
      verde: 'Groen',
      violeta: 'Violet',
      naranja: 'Oranje',
      rosa: 'Roze',
    },
    acentoPropio: (color: string) => `Aangepast (${color})`,
    errorGuardar: 'De voorkeur kon niet worden opgeslagen',
  },
  paleta: {
    titulo: 'Opdrachtenpalet',
    placeholder: 'Zoek een scherm, dienst, project of hulpmiddel…',
    sinResultados: 'Geen enkele opdracht komt overeen met uw zoekopdracht.',
    ayuda: '↑ ↓ om te navigeren · Enter om uit te voeren · Esc om te sluiten',
    grupos: {
      navegacion: 'Ga naar',
      servicios: 'Diensten',
      proyectos: 'Projecten',
      herramientas: 'Hulpmiddelen',
      github: 'GitHub',
      general: 'Algemeen',
    },
    irA: (pantalla: string) => `Ga naar ${pantalla}`,
    encender: (servicio: string) => `${servicio} starten`,
    apagar: (servicio: string) => `${servicio} stoppen`,
    iniciarTodo: 'Alle diensten starten',
    detenerTodo: 'Alle diensten stoppen',
    iniciarWorkspace: (n: string) => `Workspace ${n} starten`,
    detenerWorkspace: (n: string) => `Workspace ${n} stoppen`,
    abrirSitio: (nombre: string) => `${nombre} openen in de browser`,
    traerCambios: (nombre: string) => `Wijzigingen ophalen in ${nombre}`,
    abrirHerramienta: (nombre: string) => `${nombre} openen`,
    clonar: 'Een repository klonen vanaf GitHub',
    agregarProyecto: 'Een project toevoegen',
    nuevoProyecto: 'Een nieuw project aanmaken',
    tema: (tema: string) => `Thema: ${tema}`,
    idioma: (idioma: string) => `Taal: ${idioma}`,
  },
  nuevoProyecto: {
    titulo: 'Nieuw project',
    boton: 'Nieuw project',
    descripcion:
      'Maak een project vanaf nul aan: de map, de site met HTTPS, de database en de verbinding.',
    pasos: { tipo: 'Type', datos: 'Gegevens', resumen: 'Overzicht', crear: 'Aanmaken' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Met Composer; applicatiesleutel, database en migraties.',
      },
      codeigniter4: {
        nombre: 'CodeIgniter 4',
        descripcion: 'Officiële appstarter met eigen .env.',
      },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Klassiek framework met geconfigureerde database.php.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Officieel skelet (of webapp) met eigen .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Virtuele omgeving, requirements.txt en uvicorn-proces.',
      },
      wordpress: {
        nombre: 'WordPress',
        descripcion: 'Officiële download met kant-en-klare wp-config.php.',
      },
      estatico: {
        nombre: 'Statische site',
        descripcion: 'HTML en CSS geserveerd door Nginx, zonder database.',
      },
    },
    campos: {
      nombre: 'Projectnaam',
      nombrePlaceholder: 'mijn-winkel',
      nombreAyuda: (dominio: string) =>
        `Wordt ${dominio}: kleine letters, cijfers en koppeltekens.`,
      carpeta: 'Bovenliggende map',
      elegirCarpeta: 'Map kiezen…',
      cambiarCarpeta: 'Map wijzigen…',
      carpetaAyuda:
        'Het project wordt aangemaakt in een nieuwe map met uw naam binnen deze map. Deze moet leeg zijn of nog niet bestaan.',
      php: 'PHP-versie',
      python: 'Python-versie',
      sinInstalada: 'Geen geïnstalleerd: installeer deze vanuit Diensten.',
      conBase: 'Een database aanmaken voor het project',
      sinBase: 'Zonder database',
      instancia: 'Databaseserver',
      apagada: 'gestopt',
      apagadaAyuda: 'Deze server staat uit: start deze in Diensten voordat u het project aanmaakt.',
      sinMotores: 'Er is geen databaseserver geïnstalleerd voor dit type project.',
      nombreBase: 'Databasenaam',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Geen', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Webpakketten (webapp) opnemen',
      pgvector: 'pgvector inschakelen (vectorzoeken)',
    },
    huella: {
      titulo: 'WordPress publiceert alleen een zwakke controlegetal',
      riesgo:
        'Het gepubliceerde controlegetal is SHA-1, een algoritme dat niet langer als veilig wordt beschouwd, en komt van dezelfde site als het bestand.',
      explicacion:
        'Als die site of de verbinding gecompromitteerd is, zou een aangepaste download de controle doorstaan. De download verloopt nog steeds via HTTPS vanaf wordpress.org. Ga alleen door als u deze bron vertrouwt.',
      leyendo: 'Gepubliceerd controlegetal lezen…',
      noDisponible:
        'Het controlegetal kon nu niet worden gelezen (geen verbinding of de bron reageerde niet); het wordt opnieuw gelezen bij het aanmaken.',
      fuente: 'Bron: wordpress.org',
      casilla: 'Ik begrijp dat het controlegetal zwak is en wil het project toch aanmaken',
    },
    resumen: {
      titulo: 'Dit wordt aangemaakt',
      intro: 'Controleer dit voordat u begint.',
      tipo: 'Type',
      carpeta: 'Map',
      sitio: 'Site',
      dominio: 'Domein',
      https: 'Adres met HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Database',
      env: 'Verbinding geschreven in',
      nota: 'Als een stap mislukt, wordt er niets verwijderd: u ziet wat is aangemaakt en kunt opnieuw proberen.',
    },
    errores: {
      nombreVacio: 'Voer een naam in voor het project.',
      nombreInvalido:
        'De naam mag alleen kleine letters, cijfers en koppeltekens bevatten (maximaal 40), zonder te beginnen of te eindigen met een koppelteken.',
      sinCarpeta: 'Kies de bovenliggende map van het project.',
      sinPhp: 'Kies een PHP-versie (installeer deze vanuit Diensten als er geen is).',
      sinPython: 'Kies een Python-versie (installeer deze vanuit Diensten als er geen is).',
      sinInstancia: 'Kies de server waarop de database wordt aangemaakt, of vink de database uit.',
      baseInvalida: 'De databasenaam is ongeldig voor deze engine.',
      motorNoVale: 'WordPress vereist MySQL of MariaDB.',
      pgvectorMotor: 'pgvector vereist PostgreSQL.',
      huellaDebil: 'Bevestig dat u begrijpt dat het controlegetal van WordPress zwak is.',
    },
    acciones: {
      cambiarCarpeta: 'Een andere map kiezen',
      cambiarBase: 'De databasenaam wijzigen',
      cambiarNombre: 'De naam wijzigen',
      reintentarPaso: 'Stap opnieuw proberen',
      servicios: 'Ga naar Diensten',
      confirmarHuella: 'Bevestiging controleren',
    },
    botones: {
      siguiente: 'Volgende',
      atras: 'Vorige',
      crear: 'Project aanmaken',
      creando: 'Aanmaken…',
      cerrar: 'Sluiten',
      abrirEditor: 'Openen in editor',
      verSitio: 'Site bekijken',
      verProyecto: 'Bekijken in Projecten',
    },
    progreso: {
      titulo: 'Project aanmaken',
      listo: 'Project aangemaakt.',
      fallo: (paso: string) =>
        `De stap «${paso}» is mislukt. Er is niets verwijderd: probeer de stap opnieuw of los het probleem op en probeer het nogmaals.`,
      quedo: (partes: string) => `Dit is aangemaakt: ${partes}.`,
      quedoCarpeta: 'de map',
      quedoBase: (nombre: string) => `de database ${nombre}`,
      quedoSitio: 'de site',
      avisos: 'Meldingen',
      sinUsuarioPropio:
        'Systeemversleuteling is niet beschikbaar: het project gebruikt de beheerdersverbinding van de database. Gebruik zodra deze beschikbaar is "Eigen gebruiker gebruiken" in de .env-beheerder.',
      editorFallo: 'De editor kon niet worden geopend.',
    },
  },
  importar: {
    boton: 'Importeren…',
    titulo: 'Importeren vanuit Laragon, XAMPP of Herd',
    intro:
      'De sites worden gekoppeld op hun huidige locatie: er wordt geen enkele map verplaatst, gekopieerd of gewijzigd. Indien gewenst worden ook hun databases gekopieerd. WolfCore Dev leest alleen de installaties van de andere programma’s.',
    buscando: 'Zoeken naar installaties…',
    nada: 'Laragon, XAMPP en Herd zijn niet gevonden in de gebruikelijke mappen.',
    errorVista: 'Kon niet zoeken naar wat geïmporteerd kan worden',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Sites',
      todos: 'Alles selecteren',
      ninguno: 'Alles deselecteren',
      dominio: (d: string) => `Domein ${d}`,
      dominioPropuesto: (d: string) => `Domein ${d} (voorgesteld)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP niet bepaald',
      base: (nombre: string, motor: string) => `Database ${nombre} (${motor})`,
      yaVinculado: 'Al een site van WolfCore Dev',
      dominioEnUso: 'Een andere site gebruikt dit domein al',
    },
    avisos: {
      sin_dominio: 'Heeft geen domein in het andere programma: er wordt er een voorgesteld.',
      dominio_invalido: 'Het domein is ongeldig: er wordt er een voorgesteld.',
      sin_vhost: 'Heeft geen eigen virtual host: er wordt een domein voorgesteld.',
      php_desconocido:
        'Onbekend welke PHP-versie wordt gebruikt: er wordt een geïnstalleerde versie gekozen.',
      base_no_local: 'De database staat op een andere server: wordt niet geïmporteerd.',
      base_nombre_invalido: 'De databasenaam is ongeldig: wordt niet geïmporteerd.',
      motor_no_soportado: 'De database is geen MySQL of MariaDB: wordt niet geïmporteerd.',
    },
    problemas: {
      titulo: (n: number) =>
        `${plural(n, 'item', 'items')} overgeslagen of konden niet worden gelezen`,
    },
    bases: {
      titulo: 'Databases',
      importarBases: 'Ook de databases importeren',
      ayuda:
        'Start de databaseserver van het andere programma voordat u doorgaat: WolfCore Dev start of stopt geen externe programma’s. Het wachtwoord wordt alleen voor deze import gebruikt en niet opgeslagen.',
      destino: 'Doelserver',
      apagada: 'gestopt',
      sinMotores:
        'Er is geen MySQL of MariaDB geïnstalleerd: installeer deze vanuit Diensten om databases te importeren.',
      puerto: 'Poort van de bronserver',
      usuario: 'Gebruiker',
      clave: 'Wachtwoord',
      claveAyuda:
        'Laat dit leeg als de gebruiker geen wachtwoord heeft (zoals root in Laragon of XAMPP).',
      existe: 'bestaat al op de bestemming',
      reemplazar: 'Vervangen (er wordt vooraf een kopie gemaakt)',
      noSeToca: 'Wordt niet aangeraakt als u dit niet aanvinkt.',
    },
    pasos: { elegir: 'Kiezen', confirmar: 'Bevestigen' },
    continuar: 'Doorgaan',
    volver: 'Terug',
    cancelar: 'Annuleren',
    importar: 'Importeren',
    cerrar: 'Sluiten',
    sinSeleccion: 'Kies ten minste één site.',
    origenIncompleto: 'Geef de poort en de gebruiker van de bronserver op.',
    confirmar: {
      titulo: 'Import bevestigen',
      sitios: (n: number) =>
        `Er worden ${plural(n, 'site', 'sites')} gekoppeld in hun huidige map. Er wordt geen enkel bestand verplaatst, gekopieerd of gewijzigd.`,
      sinConfianza:
        'Geen enkele geïmporteerde site voert recepten uit totdat u «Ik vertrouw deze repository» aanvinkt.',
      hosts:
        'Nginx en het hosts-bestand worden bijgewerkt (Windows kan om beheerdersrechten vragen).',
      basesNuevas: (nombres: string) => `Deze databases worden gekopieerd: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Deze reeds bestaande databases worden vervangen: ${nombres}. Vooraf wordt van elk een kopie opgeslagen.`,
      basesSinTocar: (nombres: string) =>
        `Deze reeds bestaande databases worden niet aangeraakt: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Worden gedumpt vanaf de server van het andere programma (127.0.0.1:${puerto}, gebruiker ${usuario}). Alleen lezen, zonder wijzigingen.`,
      sinBases: 'Er wordt geen enkele database geïmporteerd.',
      proteccion:
        'De structuur van elke database wordt vooraf gecontroleerd en de gegevens worden ingevoerd met een beperkte gebruiker: als er iets misgaat, blijft de database zoals deze was.',
    },
    resultado: {
      titulo: 'Importresultaat',
      importando: 'Importeren…',
      cancelar: 'Import annuleren',
      restaurada:
        'De oorspronkelijke database is automatisch teruggezet vanuit de kopie: alles bleef zoals het was.',
      sitioOk: 'Geïmporteerd',
      sitioFallo: 'Niet geïmporteerd',
      baseOk: (n: string) => `Database ${n} geïmporteerd`,
      baseFallo: (n: string) => `Database ${n} niet geïmporteerd`,
      copiaPrevia: (ruta: string) => `Kopie van de vorige database: ${ruta}`,
      phpDistinto: (v: string) =>
        `PHP ${v} gebruikt (de oorspronkelijke versie was niet geïnstalleerd).`,
      sinAplicar:
        'Nginx of het hosts-bestand zijn niet bijgewerkt: bekijk de melding in Projecten en probeer opnieuw.',
      resumen: (s: number, b: number) =>
        `${plural(s, 'geïmporteerde site', 'geïmporteerde sites')}, ${plural(b, 'geïmporteerde database', 'geïmporteerde databases')}.`,
      errorImportar: 'Importeren mislukt',
    },
  },
  plantillas: {
    guardarComo: 'Opslaan als sjabloon…',
    dialogo: {
      titulo: (nombre: string) => `«${nombre}» opslaan als sjabloon`,
      intro:
        'De sjabloon slaat het recept, de PHP- en Nginx-instellingen, de extensies en het databaseschema op (alleen de structuur, zonder rijen). Er worden nooit wachtwoorden, sleutels of databasegegevens opgeslagen.',
      nombre: 'Naam van de sjabloon',
      nombrePlaceholder: 'Mijn basisproject',
      conArchivos: 'Ook de projectbestanden opnemen',
      conArchivosAyuda:
        'Zonder dit worden alleen het recept, de instellingen en het schema opgeslagen.',
      siempre: 'Wordt altijd uitgesloten',
      siempreLista:
        '.env en .env.*, vendor, node_modules, .git, .venv, logboeken, dumps en bestandsdatabases (*.sql, *.dump, *.sqlite), sleutels en certificaten (*.pem, *.key, *.crt…), wp-config.php en wolfcore.yml. Een bestand dat een sleutel of wachtwoord bevat wordt ook uitgesloten.',
      extra: 'Daarnaast uitsluiten (één per regel)',
      extraAyuda: 'Namen of paden relatief aan het project, bijvoorbeeld uploads of public/build.',
      vista: 'Wat wordt opgeslagen',
      calculando: 'Berekenen…',
      resumen: (archivos: number, tamano: string) =>
        `${plural(archivos, 'bestand', 'bestanden')} · ${tamano}`,
      fuera: (n: number) => `${n} uitgesloten`,
      sinArchivos:
        'Alleen het recept, de instellingen en het schema worden opgeslagen; geen bestanden.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Alleen de structuur van database ${nombre} (server ${servidor}) wordt opgeslagen, zonder rijen.`,
      sinBase: 'Het project declareert geen database: er wordt geen schema opgeslagen.',
      avisoMongodb:
        'Dit project gebruikt MongoDB: het schema (collecties en indexen) wordt niet opgeslagen.',
      incluirDeTodosModos: 'Toch opnemen',
      avisoIncluir: 'Als dat bestand een echte sleutel bevat, wordt deze in de sjabloon opgenomen.',
      guardar: 'Sjabloon opslaan',
      guardada: (nombre: string) => `Sjabloon «${nombre}» opgeslagen.`,
      errorGuardar: 'De sjabloon kon niet worden opgeslagen',
      errorVista: 'Het voorbeeld kon niet worden berekend',
      cancelar: 'Annuleren',
    },
    lista: {
      titulo: 'Mijn sjablonen',
      ayuda:
        'Start een nieuw project met het recept, de instellingen en het schema (zonder gegevens) van een bestaand project.',
      vacia: 'Nog geen sjablonen. Sla een project op als sjabloon via het menu op de projectkaart.',
      conArchivosEtiqueta: 'met bestanden',
      soloEsquema: 'recept en schema',
      conBase: (motor: string) => `${motor}-database zonder gegevens`,
      borrarEtiqueta: (nombre: string) => `Sjabloon ${nombre} verwijderen`,
      borrarTitulo: (nombre: string) => `Sjabloon ${nombre} verwijderen?`,
      borrarTexto:
        'Alleen de sjabloon wordt verwijderd. Projecten die ermee zijn gemaakt en het oorspronkelijke project blijven onaangetast.',
      borrada: 'Sjabloon verwijderd.',
      errorBorrar: 'De sjabloon kon niet worden verwijderd',
      errorLista: 'De sjablonen konden niet worden gelezen',
      desde: (nombre: string) => `Sjabloon: ${nombre}`,
      avisoSinBase: 'Deze sjabloon bevat geen database.',
      importadaEtiqueta: 'geïmporteerd',
      avisoImportada:
        'Deze sjabloon komt van een derde partij: het project wordt zonder vertrouwen en zonder actieve processen aangemaakt, en het openen van de site voert de code uit. Controleer de bestanden vooraf.',
      generadoresTitulo: 'Projecten vanaf nul',
    },
  },
  env: {
    accion: '.env-variabelen…',
    titulo: (nombre: string) => `.env van ${nombre}`,
    intro:
      'Geheime waarden worden gemaskeerd weergegeven. Een volledige waarde verschijnt alleen wanneer u op «Tonen» klikt bij die variabele en wordt na 30 seconden weer verborgen. Vóór het opslaan wordt een kopie met datum van de huidige .env gemaakt.',
    noExiste: 'Dit project heeft nog geen .env-bestand: dit wordt aangemaakt bij het opslaan.',
    tablaEtiqueta: '.env-variabelen',
    sinVariables: 'De .env bevat geen variabelen.',
    secretaEtiqueta: 'geheim',
    duplicadaEtiqueta: 'dubbel',
    duplicadaAyuda:
      'Deze variabele komt meerdere keren voor in de .env: de laatste wordt getoond en gewijzigd.',
    soloLecturaEtiqueta: 'meerdere regels',
    soloLecturaAyuda: 'Beslaat meerdere regels: bewerk deze handmatig in het bestand.',
    seQuitara: 'Wordt verwijderd bij het opslaan',
    valorNuevo: 'Nieuwe waarde',
    valorNuevoDe: (clave: string) => `Nieuwe waarde van ${clave}`,
    valorDe: (clave: string) => `Waarde van ${clave}`,
    vacio: '(leeg)',
    mostrar: 'Tonen',
    ocultar: 'Verbergen',
    mostrarEtiqueta: (clave: string) => `Waarde van ${clave} tonen`,
    ocultarEtiqueta: (clave: string) => `Waarde van ${clave} verbergen`,
    cambiar: 'Wijzigen',
    deshacer: 'Ongedaan maken',
    deshacerEtiqueta: (clave: string) => `Wijziging van ${clave} ongedaan maken`,
    quitar: 'Verwijderen',
    quitarEtiqueta: (clave: string) => `Variabele ${clave} verwijderen`,
    errorRevelar: 'De waarde kon niet worden getoond',
    agregarTitulo: 'Een variabele toevoegen',
    agregarNombre: 'NAAM',
    agregarValor: 'waarde',
    agregar: 'Toevoegen',
    nombreInvalido:
      'Gebruik letters, cijfers, underscore en punt, zonder te beginnen met een cijfer; en de naam mag nog niet bestaan.',
    comparar: {
      titulo: 'Vergelijken met het voorbeeldbestand',
      sinEjemplo: 'Het project heeft geen .env.example om mee te vergelijken.',
      alDia: 'De .env bevat dezelfde variabelen als het voorbeeld.',
      faltan: (n: number) => `${n} ontbreken:`,
      sobran: (n: number) => `${n} extra (niet in het voorbeeld):`,
      distintas: (n: number) => `${n} met een andere waarde dan het voorbeeld:`,
      agregarFaltantes: 'Ontbrekende toevoegen',
    },
    bloques: {
      titulo: 'Een blok variabelen toevoegen',
      ayuda:
        'Voegt alleen de ontbrekende variabelen van dat onderwerp toe aan de .env (bestaande worden niet aangeraakt), zonder wachtwoorden of sleutels; vul deze daarna in de tabel aan.',
      bd: 'Database',
      correo: 'E-mail',
      ia: 'AI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Eigen gebruiker gebruiken',
      ayuda:
        'Maakt een databasegebruiker aan die alleen voor dit project geldt (uitsluitend met rechten op de eigen database, nooit beheerder) en schrijft deze in de .env. Werkt momenteel met MySQL en MariaDB van WolfCore Dev.',
      confirmarTitulo: 'Een eigen gebruiker voor de database gebruiken?',
      confirmarTexto:
        'Er wordt een nieuwe gebruiker met een willekeurig wachtwoord aangemaakt, met rechten alleen op de database van dit project, en de verbindingsgebruiker en het wachtwoord in de .env worden bijgewerkt. Vooraf wordt een kopie van de huidige .env opgeslagen; het nieuwe wachtwoord staat in de .env van het project en versleuteld in WolfCore Dev.',
      confirmar: 'Aanmaken en gebruiken',
      hecho: (usuario: string) => `Het project gebruikt nu gebruiker ${usuario}.`,
      compartirTitulo: 'De gebruiker van een ander project delen?',
      compartirTexto: (base: string, proyecto: string) =>
        `Database ${base} wordt ook gebruikt door ${proyecto}. De gebruiker delen? Dit project gebruikt dezelfde gebruiker en hetzelfde wachtwoord; het wachtwoord verandert niet, zodat ${proyecto} verbonden blijft.`,
      compartir: 'Gebruiker delen',
      error: 'De databasegebruiker kon niet worden gewijzigd',
    },
    copias: {
      titulo: 'Terugzetten naar een kopie',
      ninguna: 'Er zijn nog geen kopieën van deze .env.',
      volver: 'Terug naar deze kopie',
      confirmarTitulo: 'Terugzetten naar een kopie van de .env?',
      confirmarTexto: (fecha: string) =>
        `De huidige .env wordt vervangen door de kopie van ${fecha}. Vooraf wordt een nieuwe kopie van de huidige opgeslagen, zodat u dit ook ongedaan kunt maken.`,
      hecho: 'Teruggezet naar de kopie.',
      error: 'Kon niet terugzetten naar de kopie',
    },
    cambiosPendientes: (n: number) =>
      `${plural(n, 'niet-opgeslagen wijziging', 'niet-opgeslagen wijzigingen')}`,
    descartar: 'Wijzigingen negeren',
    guardar: 'Controleren en opslaan…',
    cerrar: 'Sluiten',
    cerrarTitulo: 'Sluiten zonder op te slaan?',
    cerrarTexto: (n: number) =>
      `Er zijn ${plural(n, 'niet-opgeslagen wijziging', 'niet-opgeslagen wijzigingen')}. Als u sluit, gaan deze verloren.`,
    cerrarDescartar: 'Sluiten en negeren',
    seguirEditando: 'Doorgaan met bewerken',
    confirmar: {
      titulo: 'Wijzigingen in .env opslaan',
      texto:
        'Dit wordt gewijzigd. Geheime waarden worden gemaskeerd weergegeven. Er wordt een kopie met datum van de huidige .env opgeslagen en het bestand wordt in één keer geschreven.',
      sinCambios: 'Er zijn geen wijzigingen om op te slaan.',
      agregarGitignore: '.env toevoegen aan .gitignore van het project',
      aceptarVersionado: 'Ik begrijp het risico en wil toch opslaan',
      guardar: 'Wijzigingen opslaan',
      versionado:
        'Git volgt de .env van dit project al: de volgende commit zou de waarden uploaden, zelfs als het bestand in .gitignore staat. Verwijder het uit de index met git rm --cached .env.',
      versionadoDesconocido:
        'Kon niet controleren of git de .env van dit project volgt; bevestig apart om op te slaan.',
    },
    errorVistaPrevia: 'Het voorbeeld kon niet worden voorbereid',
    errorGuardar: 'De .env kon niet worden opgeslagen',
    guardado: 'De .env is opgeslagen.',
    guardadoConCopia: 'De .env is opgeslagen; de vorige versie is als kopie bewaard.',
  },
  asistenteInicio: {
    paso: (n: number, total: number) => `Stap ${n} van ${total}`,
    anterior: 'Vorige',
    siguiente: 'Volgende',
  },
  /** Resultaat van het importeren of exporteren van een profiel (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Back-up en profielen',
      descripcion:
        'Met een profiel neemt u uw omgeving mee naar een andere computer: sites, versies, instanties, sjablonen en instellingen. Het bevat nooit sleutels, tokens of wachtwoorden.',
      aislado: {
        titulo: 'Testmap',
        texto: (ruta: string) =>
          `WolfCore Dev gebruikt een testgegevensmap (${ruta}). Wat u hier doet, raakt uw echte map en computer niet: het hosts-bestand wordt niet gewijzigd en er worden geen certificaten geïnstalleerd.`,
      },
      exportar: {
        titulo: 'De omgeving exporteren',
        texto:
          'Slaat een .wolfperfil-bestand op met uw sites, versies, instanties, sjablonen en instellingen.',
        bases: 'Databases opnemen',
        basesAyuda:
          'De volledige dumps (met gegevens van uw klanten) worden versleuteld met de wachtwoordzin opgeslagen.',
        ca: 'Certificaatautoriteit (CA) opnemen',
        caAyuda:
          'Wordt versleuteld met de wachtwoordzin opgeslagen. Importeer deze alleen op een eigen computer.',
        certificados: 'Certificaten van de sites opnemen',
        certificadosAyuda: 'Worden alleen samen met de CA en versleuteld ermee opgeslagen.',
        frase: 'Wachtwoordzin',
        fraseRepetir: 'Wachtwoordzin herhalen',
        fraseAyuda: (minimo: number) =>
          `Minimaal ${minimo} tekens. Zonder deze wachtwoordzin kunnen de databases en de CA niet worden hersteld, en deze wordt nergens opgeslagen.`,
        problemas: {
          frase_corta: (minimo: number) =>
            `De wachtwoordzin moet minimaal ${minimo} tekens bevatten.`,
          frase_distinta: 'De twee wachtwoordzinnen komen niet overeen.',
          certificados_sin_ca: 'Certificaten worden alleen samen met de CA opgenomen.',
        },
        exportar: 'Profiel exporteren…',
        nota: 'Het profiel bevat nooit sleutels, tokens of wachtwoorden, en evenmin momentopnamen, de prullenbak, back-ups of de map data.',
        listo: 'Profiel geëxporteerd',
        guardado: (archivo: string, tamano: string) => `Opgeslagen in ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Een profiel importeren',
        texto:
          'Kies een .wolfperfil-bestand. Voordat er iets wordt gewijzigd, ziet u alles wat wordt vervangen, verwijderd of in behandeling blijft, en wordt er een kopie bewaard van wat wordt vervangen.',
        boton: 'Profiel importeren…',
      },
      instantaneas: {
        titulo: 'Momentopnamen van de omgeving',
        texto:
          'Vóór het bijwerken van PHP of Nginx en vóór het importeren van een profiel slaat WolfCore Dev een kopie op van uw configuratie, Nginx en php.ini, zonder sleutels of gegevens en alleen voor u. De laatste 10 worden bewaard.',
        compartidas:
          'De 10 worden gedeeld tussen alle redenen: bij een nieuwe momentopname wordt de oudste vervangen, ook als die handmatig was gemaakt.',
        tomar: 'Nu een maken',
        tomada: 'Momentopname opgeslagen.',
        sinNada: 'Er is nog niets om te kopiëren.',
        vacia: 'Er zijn nog geen momentopnamen.',
        motivos: {
          actualizar: 'Vóór bijwerken',
          'importar-perfil': 'Vóór importeren van een profiel',
          'limpiar-versiones': 'Vóór opschonen van versies',
          manual: 'Handmatig',
        },
      },
    },
    reasignar: {
      titulo: 'Mappen van de sites',
      texto:
        'Deze mappen komen van de andere computer. Zoek waar ze zich op deze computer bevinden of importeer de site als in behandeling: deze blijft zonder map totdat u er een kiest.',
      sitio: 'Site',
      origen: 'Map in het profiel',
      destino: 'Map op deze computer',
      existe: 'Bestaat',
      noExiste: 'Bestaat niet op deze computer',
      buscar: 'Map zoeken…',
      cambiar: 'Wijzigen',
      comoPendiente: 'Toch importeren als in behandeling',
      prefijo: (viejo: string, nuevo: string) =>
        `Dezelfde wijziging gebruiken voor de overige (${viejo} → ${nuevo})`,
      omitido: 'Wordt niet geïmporteerd',
    },
    asistente: {
      titulo: 'Een profiel importeren',
      pasos: {
        archivo: 'Bestand',
        revisar: 'Controleren',
        confirmar: 'Bevestigen',
        resultado: 'Resultaat',
      },
      archivo: {
        texto:
          'Kies het .wolfperfil-bestand. Er wordt nog niets gewijzigd: u ziet eerst wat er wordt vervangen, verwijderd of in behandeling blijft.',
        elegir: 'Bestand kiezen…',
        cambiar: 'Ander kiezen',
        ninguno: 'Geen bestand gekozen',
        leyendo: 'Profiel lezen…',
        error: 'Het profiel kon niet worden gelezen',
      },
      origen: (fecha: string, sistema: string) => `Aangemaakt op ${fecha} op ${sistema}.`,
      ignoradas: (n: number) =>
        `${n} items in het bestand horen niet bij een profiel en worden genegeerd.`,
      reemplaza: {
        titulo: 'Wat wordt vervangen',
        ninguno:
          'Er staan geen gegevens in deze map: er wordt geïmporteerd over een schone installatie.',
        copia:
          'Vóór het vervangen wordt een kopie opgeslagen in respaldos/pre-perfil-… en wordt een momentopname van de omgeving gemaakt; elke database die wordt vervangen krijgt een eigen momentopname. De map data wordt nooit verwijderd.',
        config: 'De configuratie (config.json)',
        sitio: (id: string) => `De site ${id}`,
        base: (instancia: string, base: string) => `De database ${base} (${instancia})`,
        plantilla: (id: string) => `Het sjabloon ${id}`,
        ca: 'De certificaatautoriteit (CA) van deze computer',
      },
      versiones: {
        titulo: 'Versies',
        ninguna: 'Het profiel bevat geen versies.',
        instalada: 'Al geïnstalleerd',
        descargar: 'Wordt gedownload met geverifieerde vingerafdruk',
        pendienteDebil: 'In behandeling: zonder sterke vingerafdruk, installeer handmatig',
        pendienteFuera: 'In behandeling: staat niet meer in de catalogus',
        huellas: {
          fuerte: 'SHA-256- of SHA-512-vingerafdruk',
          firmada: 'Ondertekend',
          debil: 'Zwakke vingerafdruk',
          ninguna: 'Geen vingerafdruk',
        },
        descargas: (n: number) =>
          `Er worden ${n} versies gedownload van officiële sites, elk met geverifieerde vingerafdruk of handtekening.`,
      },
      instancias: {
        titulo: 'Database-instanties',
        existente: 'Bestaat al: blijft behouden met huidige poort en versie',
        nueva: (puerto: number) => `Wordt aangemaakt met nieuwe inloggegevens op poort ${puerto}`,
        reasignada: (de: number, a: number) => `Poort ${de} is in gebruik: gebruikt poort ${a}`,
      },
      bases: {
        titulo: 'Databases',
        ninguna: 'Het profiel bevat geen databases.',
        texto:
          'Ze worden hersteld met een gebruiker beperkt tot elke database en alleen met toegestane instructies. Bestaande databases krijgen eerst een back-up.',
        omitir: 'Importeren zonder databases',
      },
      plantillas: {
        titulo: 'Sjablonen',
        existe: 'Bestaat al: wordt vervangen',
        nueva: 'Nieuw',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Bevatten alleen verwijzingen naar databases en diensten (projectprocessen worden niet meegenomen). Ze worden gevalideerd tegen wat hier aanwezig is en starten nooit vanzelf.',
        existe: 'U hebt er al een met dezelfde id: uw versie blijft behouden',
        nuevo: 'Nieuw',
        elementos: (n: number) => (n === 1 ? '1 element' : `${n} elementen`),
        invalidos: (n: number) => `${n} uit het profiel zijn ongeldig en worden niet geïmporteerd.`,
      },
      quitado: {
        titulo: 'Wat niet uit de configuratie wordt overgenomen',
        texto:
          'Deze gegevensmap is schoon: uit het profiel wordt niet overgenomen wat buiten deze computer verwijst.',
      },
      puertos: {
        titulo: 'Poorten in gebruik',
        texto: (lista: string) =>
          `Deze poorten uit het profiel worden al gebruikt door een ander programma op deze computer: ${lista}. Wijzig ze na het importeren via Diensten.`,
      },
      ca: {
        titulo: 'Certificaatautoriteit (CA)',
        texto:
          'Het profiel bevat een versleutelde CA. Importeer deze alleen als het uw eigen CA is: deze computer accepteert dan de certificaten die deze ondertekent.',
        huella: 'SHA-256-vingerafdruk van de CA uit het profiel',
        comparar: 'Vergelijk deze met die van uw broncomputer voordat u deze accepteert.',
        importar: 'De CA uit het profiel importeren',
        noImportar:
          'Zonder deze te importeren gebruikt deze computer de huidige CA of maakt een nieuwe aan.',
        ajena:
          'Deze CA heeft naambeperkingen die niet van WolfCore Dev zijn: deze kan niet worden geïmporteerd.',
        sinRestricciones:
          'Deze CA heeft geen naambeperkingen: deze kan certificaten ondertekenen voor elke website, ook van banken en e-mail. Importeer deze alleen als het uw eigen CA is en de vingerafdruk overeenkomt.',
        aceptarSin: 'Ik begrijp het risico: dit is mijn CA en de vingerafdruk komt overeen',
        reemplazaLocal:
          'Deze computer heeft al een CA. Het importeren van die uit het profiel vervangt deze (er blijft een kopie in de voorafgaande back-up).',
        reemplazar: 'De CA van deze computer vervangen',
        noSeInstala:
          'De CA wordt niet automatisch geïnstalleerd in het certificaatarchief van het systeem.',
      },
      frase: {
        titulo: 'Wachtwoordzin van het profiel',
        texto:
          'Het profiel bevat versleutelde databases of een CA. Voer de wachtwoordzin in die u bij het exporteren hebt gekozen.',
        campo: 'Wachtwoordzin',
        omitirBases: 'Importeren zonder databases',
        nota: 'De wachtwoordzin wordt alleen in dit venster gebruikt: deze wordt niet opgeslagen en wordt gewist bij voltooiing of sluiten.',
      },
      env: {
        titulo: 'Verbinding van de projecten',
        texto:
          'Selecteer de projecten waarvan het .env-bestand moet verwijzen naar een nieuwe eigen gebruiker van hun database (met voorafgaande kopie van .env). De overige worden niet gewijzigd en worden vermeld.',
      },
      confirmar: {
        titulo: 'Importeren bevestigen',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Er worden ${sitios} sites, ${versiones} versies en ${bases} databases geïmporteerd.`,
        importar: 'Importeren',
        revisar: 'Controleren',
        volver: 'Terug',
        bloqueos: {
          sitios_sin_carpeta:
            'Kies de map van elke site of markeer deze om als in behandeling te importeren.',
          frase_requerida:
            'Voer de wachtwoordzin van het profiel in of importeer zonder databases.',
          ca_ajena: 'De CA uit het profiel kan niet worden geïmporteerd.',
          ca_sin_restricciones: 'Bevestig apart dat u een CA zonder beperkingen wilt importeren.',
          reemplazar_ca: 'Bevestig apart dat u de CA van deze computer wilt vervangen.',
        },
      },
      progreso:
        'Profiel wordt geïmporteerd… Sluit het venster niet: met databases of downloads kan dit even duren.',
      fases: {
        copia: 'Kopiëren van wat wordt vervangen',
        versiones: 'Versies installeren',
        configuracion: 'Configuratie en sites opslaan',
        plantillas: 'Sjablonen kopiëren',
        ca: 'CA en certificaten voorbereiden',
        bases: 'Databases herstellen',
        env: '.env-bestanden herschrijven',
      },
      avance: (paso: number, de: number) => `Stap ${paso} van ${de}`,
      resultado: {
        titulo: 'Resultaat van het importeren',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} geïmporteerd, ${pendientes} in behandeling, ${omitidos} overgeslagen en ${errores} met fout.`,
        respaldo: (ruta: string) => `Kopie van wat is vervangen: ${ruta}`,
        pendientes: 'Wat in behandeling is gebleven, kunt u handmatig voltooien.',
        error: 'Het profiel kon niet worden geïmporteerd',
        secciones: {
          sitios: 'Sites',
          versiones: 'Versies',
          instancias: 'Instanties',
          bases: 'Databases',
          plantillas: 'Sjablonen',
          workspaces: 'Workspaces',
          env: '.env-bestanden',
          ca: 'CA',
        },
        estados: {
          importado: 'Geïmporteerd',
          pendiente: 'In behandeling',
          omitido: 'Overgeslagen',
          error: 'Fout',
          instalada: 'Geïnstalleerd',
          ya_instalada: 'Was al aanwezig',
          creada: 'Aangemaakt',
          existente: 'Bestond al',
          puerto_reasignado: 'Poort opnieuw toegewezen',
          reescrito: 'Herschreven',
          sin_marcar: 'Niet geselecteerd',
        },
        ca: {
          importada: 'CA geïmporteerd',
          nueva: 'Nieuwe CA gegenereerd',
          sin_cambios: 'De CA is niet gewijzigd',
        },
        quitarCa: {
          boton: 'Vorige CA verwijderen…',
          titulo: 'Vorige CA uit vertrouwde certificaten verwijderen',
          texto:
            'De vorige CA van deze computer wordt verwijderd uit het certificaatarchief van het systeem. Windows kan om bevestiging vragen. De nieuwe CA wordt niet automatisch geïnstalleerd.',
          si: 'Verwijderen',
          hecho: 'Vorige CA uit vertrouwde certificaten verwijderd.',
        },
        descartadosWorkspace: (lista: string) => `Bestaat hier niet en is verwijderd: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} ongeldige workspaces zijn niet geïmporteerd.`,
        puerto: (de: number, a: number) => `Poort ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Kopie van .env: ${ruta}`,
      },
    },
    /** Sterke melding in de voorvertoning: de CA van het profiel heeft geen naambeperkingen. */
    caSinRestricciones:
      'Deze CA kan elke website ondertekenen; importeer deze alleen als het uw eigen CA is en vergelijk de vingerafdruk.',
    motivos: {
      procesos_quitados:
        'Uw processen (opdrachten van een andere computer) zijn niet geïmporteerd.',
      tareas_quitadas:
        'Uw geplande taken (opdrachten van een andere computer) zijn niet geïmporteerd. Maak ze opnieuw aan of neem ze over uit wolfcore.yml.',
      tunel_con_nombre:
        'Uw benoemde tunnel wordt niet meegenomen: keert terug naar de snelle tunnel.',
      php_ini: 'Sommige instellingen van php.ini zijn niet geïmporteerd.',
      xdebug: 'Uw Xdebug-instelling was ongeldig en is verwijderd.',
      nginx_desactivado:
        'Uw Nginx-regels blijven opgeslagen maar niet toegepast: controleer ze in de editor.',
      carpeta_no_existe: 'Uw map bestaat niet op deze computer: zoek deze op.',
      correo_sin_proveedor: 'Uw SMTP-provider is niet geïmporteerd: gebruikt de e-mailopvanger.',
      sitio_invalido: 'De site is ongeldig.',
      dominio_invalido: 'Uw domein is ongeldig (moet eindigen op .test).',
      ruta_protegida: 'Uw map is van het systeem of van WolfCore Dev: wordt niet geïmporteerd.',
      dominio_en_uso: 'Een andere site op deze computer gebruikt dat domein al.',
      sitio_repetido: 'De site komt dubbel voor in het profiel.',
      no_disponible: 'Die versie staat niet meer in de catalogus.',
      huella_debil:
        'Die versie heeft geen sterke vingerafdruk: installeer deze handmatig via Versies.',
      tope_descargas:
        'Niet gedownload om niet te veel downloads tegelijk uit te voeren: installeer deze via Versies.',
      instancia_pendiente: 'Uw instantie is in behandeling gebleven.',
      motor_no_soportado: 'Die engine wordt niet vanuit een profiel geïmporteerd.',
      version_pendiente: 'Uw versie van de engine is in behandeling gebleven.',
      danada: 'Uw bestanden in het profiel zijn beschadigd.',
      bases_omitidas: 'Geïmporteerd zonder databases.',
      instancia_apagada: 'Uw instantie kon niet worden gestart.',
      sin_copia_previa:
        'De voorafgaande momentopname kon niet worden gemaakt: de database is niet vervangen.',
      sin_base: 'Uw .env verwijst niet naar een lokale database.',
      base_no_resuelta: 'Er kon niet worden vastgesteld bij welke instantie uw database hoort.',
      error_inesperado: 'Er is iets misgegaan.',
    },
    avisos: {
      ca_reemplazada:
        'De vorige CA van deze computer staat nog in het vertrouwde archief van het systeem en wordt niet meer gebruikt. U kunt deze hier verwijderen.',
      base_no_incluida: 'De database {base} ({instancia}) is niet opgenomen.',
      sin_ca: 'Er is geen CA op deze computer: het profiel wordt zonder CA opgeslagen.',
      ca_no_importada:
        'De CA uit het profiel is niet geïmporteerd: de CA van deze computer of een nieuwe wordt gebruikt.',
      certificados: 'De certificaten konden niet worden voorbereid: {detalle}',
      aplicar:
        'De geïmporteerde sites zijn niet volledig toegepast (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'AI-provider {id}: gebruikt een eigen URL.',
      smtp: 'SMTP-provider {id}: de host is niet van een bekende provider of de gebruiker ontbreekt.',
      puerto: 'Poort van {id}: buiten bereik, keert terug naar de standaardwaarde.',
      carpeta_vigilada: 'De bewaakte map is van een andere computer.',
    },
  },
};
