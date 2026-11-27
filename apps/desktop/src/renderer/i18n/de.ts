/**
 * UI-Texte auf Deutsch (de-DE). Gleiche Schlüssel und Funktionssignaturen wie es.ts.
 * Festes Glossar: Dienst, Instanz, Website/Site, Tunnel, Sicherung, Hinweis; Doctor und
 * WolfCore Dev bleiben unübersetzt. Formelle Anrede (Sie), niemals „du“; außerhalb von Git
 * immer „Version“ statt „Zweig“.
 */
import type { Textos } from './es';

const plural = (n: number, eins: string, mehrere: string): string => `${n} ${n === 1 ? eins : mehrere}`;

export const de: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP und Nginx ohne Aufwand',
    version: 'Version',
  },
  nav: {
    inicio: 'Start',
    proyectos: 'Projekte',
    agentes: 'Agenten',
    servicios: 'Dienste',
    basesDeDatos: 'Datenbanken',
    correo: 'E-Mail',
    php: 'PHP',
    ia: 'KI',
    tuneles: 'Tunnel',
    contenedores: 'Container',
    herramientas: 'Werkzeuge',
    doctor: 'Doctor',
    depuracion: 'Debugging',
    registros: 'Protokolle',
    ajustes: 'Einstellungen',
    contraer: 'Menü einklappen',
    expandir: 'Menü ausklappen',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'Dienst gestartet', 'Dienste gestartet'),
    tuneles: (n: number) => plural(n, 'aktiver Tunnel', 'aktive Tunnel'),
    cargando: 'Verbindung zum Kern wird hergestellt…',
    conErrores: 'mit Fehlern',
    sinConexion: 'Keine Verbindung zum Kern',
  },
  estado: {
    encendido: 'Gestartet',
    apagado: 'Gestoppt',
    iniciando: 'Wird gestartet…',
    error: 'Fehler',
    externo: 'Extern',
    activo: 'Aktiv',
    aviso: 'Hinweis',
  },
  acciones: {
    encender: 'Starten',
    apagar: 'Stoppen',
    iniciarTodo: 'Alles starten',
    detenerTodo: 'Alles stoppen',
    abrir: 'Öffnen',
    copiar: 'Kopieren',
    copiado: 'In die Zwischenablage kopiert',
    guardar: 'Speichern',
    cerrar: 'Schließen',
    abrirCarpeta: 'Ordner öffnen',
    instalar: 'Installieren',
    reintentar: 'Erneut versuchen',
    cancelar: 'Abbrechen',
    borrar: 'Löschen',
    editar: 'Bearbeiten',
    duplicar: 'Duplizieren',
    renovar: 'Erneuern',
    masAcciones: 'Weitere Aktionen',
    actualizar: 'Aktualisieren',
    quitar: 'Entfernen',
    reinstalar: 'Neu installieren',
  },
  errores: {
    titulo: 'Die Aktion konnte nicht abgeschlossen werden',
    arranque: 'Der Status der Umgebung konnte nicht gelesen werden',
    desconocido: 'Ein unerwarteter Fehler ist aufgetreten.',
    /** Details, die der Kern als Code innerhalb eines Fehlers sendet. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'nicht geschlossene Anführungszeichen',
      'sintaxis.tras_comillas': 'fehlendes Leerzeichen oder ";" nach den Anführungszeichen',
      'sintaxis.punto_y_coma_inesperado': '";" ohne Direktive',
      'sintaxis.llave_inesperada': '"{" ohne Direktive',
      'sintaxis.falta_punto_y_coma': 'fehlendes ";" am Ende der Direktive',
      'sintaxis.sobra_llave': 'überflüssige "}"',
      'sintaxis.falta_llave': 'fehlende "}"',
    },
    codigos: {
      'git.cambios_locales':
        'Es gibt ungespeicherte Änderungen im Ordner: Committen oder verwerfen Sie sie, bevor Sie Änderungen abrufen. Es wurde nichts geändert.',
      'git.divergencia':
        'Der Branch ist vom Remote abgewichen (es gibt unterschiedliche lokale und Remote-Commits): Beheben Sie dies manuell. Es wurde nichts geändert.',
      'git.sin_upstream':
        'Der aktuelle Branch verfolgt keinen Remote-Branch: Es gibt keine Quelle zum Abrufen von Änderungen.',
      'git.sin_rama':
        'Das Repository befindet sich auf einem losgelösten Commit (kein Branch): Es wurde nichts geändert.',
      'git.no_repositorio': 'Der Ordner ist kein Git-Repository.',
      'git.destino_no_vacio': 'Der Zielordner ist nicht leer.',
      'git.destino_es_archivo': 'Das Ziel ist eine Datei, kein Ordner.',
      'git.no_encontrado': 'git wurde nicht gefunden: Installieren Sie es zuerst.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) wurde nicht gefunden: Installieren Sie es zuerst.',
      'git.plazo': 'Das Klonen hat das Zeitlimit von {minutos} Min. überschritten und wurde abgebrochen.',
      'git.token_invalido': 'Das GitHub-Token ist ungültig.',
      'git.url_con_credenciales':
        'Die URL darf keinen Benutzernamen und kein Passwort enthalten: Verwenden Sie stattdessen ein separates Token.',
      'servicios.desconocido': 'Unbekannter Dienst: {id}.',
      'servicios.no_instalado': '{nombre} ist nicht installiert. Installieren Sie es unter Dienste.',
      'servicios.puerto_invalido': 'Der Port muss eine Zahl zwischen 1024 und 65535 sein.',
      'servicios.puerto_asignado': 'Port {puerto} ist bereits {otro} zugewiesen.',
      'servicios.puerto_ocupado':
        'Port {puerto} wird von {nombre} (PID {pid}) verwendet. Beenden Sie den Prozess oder wählen Sie einen anderen Port.',
      'servicios.confirmacion_borrado': 'Geben Sie "{id}" ein, um die Daten von {nombre} zu löschen.',
      'servicios.ftp_no_disponible': 'Der FTP-Server ist nicht verfügbar.',
      'sistema.sin_cliente_ftp':
        'Auf diesem Computer ist kein FTP-Client verknüpft. Installieren Sie einen (z. B. FileZilla) oder kopieren Sie die Adresse.',
      'servicios.mailpit_no_responde': 'Mailpit antwortet nicht. Starten Sie es unter Dienste.',
      'servicios.iniciar_todo_fallos':
        '„Alles starten“ konnte Folgendes nicht starten: {nombres}. Prüfen Sie Dienste und die zugehörigen Protokolle.',
      'servicios.respaldo_fallo':
        '{nombre} wurde nicht aktualisiert: Die vorherige Sicherung ist fehlgeschlagen und es wurde nichts geändert.',
      'servicios.espacio_insuficiente':
        'Nicht genügend Speicherplatz zum Kopieren der Daten: {necesarios} MB erforderlich, nur {libres} MB frei.',
      'servicios.actualizacion_revertida':
        'Version {version} konnte nicht gestartet werden; {nombre} wurde auf {anterior} zurückgesetzt. Die Sicherung bleibt erhalten.',
      'servicios.restauracion_fallo':
        'Die neue Version konnte nicht gestartet werden und die Daten von {nombre} ließen sich nicht wiederherstellen. Es wurde nichts gestartet: Die geänderten Daten liegen in {fallida} und die Sicherung in {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} gehört zu einer anderen Hauptversion: Erstellen Sie sie als neue Instanz.',
      'servicios.misma_version': '{id} verwendet bereits Version {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} ist gesperrt: Bei einer Aktualisierung konnten die Daten nicht wiederhergestellt werden. Die geänderten Daten liegen in {fallida} und die Sicherung in {respaldo}. Beheben Sie dies unter Dienste → Versionen, bevor Sie die Instanz starten.',
      'servicios.datos_apartados':
        '{nombre} hat keine Daten im Ordner, aber es gibt ausgelagerte Daten einer Aktualisierung: Es wird kein leerer Ordner angelegt. Prüfen Sie Dienste → Versionen.',
      'servicios.puerto_reservado':
        'Port {puerto} ist vom System reserviert ({desde}–{hasta}): Wählen Sie einen anderen Port.',
      'servicios.borrado_con_bloqueo':
        '{nombre} hat nach einer Aktualisierung eine gesperrte Instanz: Beheben Sie die Sperre, bevor Sie die Daten löschen.',
      'servicios.config_no_revertida':
        '{nombre} {version} konnte nicht gestartet werden und die Konfiguration ließ sich nicht auf {anterior} zurücksetzen. Wählen Sie {anterior} unter Dienste → Versionen erneut aus.',
      'servicios.puerto_revertido_apagada':
        '{nombre} konnte auf dem neuen Port nicht gestartet werden; es wurde auf {anterior} zurückgesetzt, startete dort aber ebenfalls nicht: Der Dienst bleibt auf Port {anterior} gestoppt.',
      'servicios.puerto_no_revertido':
        '{nombre} konnte auf Port {nuevo} nicht gestartet werden und die Konfiguration ließ sich nicht auf {anterior} zurücksetzen: Der Dienst bleibt gestoppt.',
      'instancias.id_invalido': 'Die Instanz-ID ist ungültig.',
      'instancias.no_existe': 'Die Instanz {id} existiert nicht.',
      'instancias.existe': 'Die Instanz {id} existiert bereits.',
      'instancias.una_sola': '{nombre} unterstützt nur eine einzelne Instanz.',
      'instancias.ultima': '{id} ist die einzige Instanz und kann nicht entfernt werden.',
      'instancias.sin_puerto_libre': 'Es wurde kein freier Port für die Instanz gefunden.',
      'instancias.confirmacion': 'Geben Sie "{id}" ein, um fortzufahren.',
      'instancias.sin_datos': '{id} hat keine Daten im Ordner: Wählen Sie eine Sicherung zur Wiederherstellung aus.',
      'instancias.respaldo_no_existe': 'Diese Sicherung von {id} existiert nicht.',
      'instancias.respaldo_en_uso':
        'Diese Kopie wird von {id} benötigt, die gesperrt ist: Beheben Sie dies zuerst.',
      'instancias.version_requerida':
        'Es ist unklar, auf welche Version {id} zurückgesetzt werden soll: Wählen Sie eine installierte Version derselben Hauptversion.',
      'instalador.version_en_uso':
        '{servicio} {version} kann nicht deinstalliert werden: Sie wird von der Instanz {instancia} verwendet.',
      'limpieza.sin_confirmar': 'Die Bestätigung zum Bereinigen von Versionen fehlt.',
      'limpieza.seleccion_invalida': 'Die Versionsauswahl ist ungültig.',
      'limpieza.en_curso': 'Es läuft bereits eine Versionsbereinigung.',
      'limpieza.no_existe': '{servicio} {version} ist nicht mehr installiert.',
      'limpieza.en_uso': '{servicio} {version} wird inzwischen verwendet und wurde nicht entfernt.',
      'limpieza.ruta_insegura':
        'Der Ordner von {servicio} {version} ist nicht sicher (ein Link oder ein Pfad außerhalb von bin): Es wurde nichts geändert.',
      'limpieza.version_bloqueada':
        '{servicio} {version} enthält geöffnete oder gesperrte Dateien: Sie wurde weder entfernt noch teilweise gelöscht.',
      'limpieza.otro_volumen':
        '{servicio} {version} liegt auf einem anderen Laufwerk als der temporäre Datenordner: Sie konnte nicht vollständig verschoben werden und blieb unverändert.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} enthält von Ihnen installierte Pakete (npm, pip…): Sie müssen deren Verlust akzeptieren, um die Version zu entfernen.',
      'limpieza.destino_ocupado':
        'Es existiert bereits ein Ordner für {servicio} {version} in bin: Er wird nicht überschrieben. Entfernen Sie ihn, bevor Sie den anderen wiederherstellen.',
      'bd.encender_servicio': 'Starten Sie {nombre}, um dessen Datenbanken zu verwalten.',
      'bd.sin_credenciales': 'Für {nombre} sind keine Zugangsdaten gespeichert.',
      'bd.confirmacion_borrado': 'Geben Sie zum Löschen der Datenbank {nombre} deren exakten Namen ein.',
      'bd.usuario_privilegiado':
        'Der Benutzer {usuario} ist ein Administrator oder eine Systemrolle: Wählen Sie einen eigenen Benutzer für das Projekt.',
      'bd.usuario_en_uso':
        'Ein anderes Projekt verwendet bereits den Benutzer {usuario}: Das Passwort wird nicht geändert, um dessen Verbindung nicht zu unterbrechen. Es wurde nichts erstellt.',
      'bd.rol_sin_login':
        'Der Benutzer {usuario} existiert, kann sich aber nicht anmelden (Rolle ohne LOGIN oder Zugriffsregel des Servers). Es wurde nichts geändert.',
      'bd.usuario_clave_distinta':
        'Der Benutzer {usuario} existiert bereits mit einem anderen Passwort. Verwenden Sie das aktuelle Passwort: Es wird nicht geändert, um andere Projekte nicht zu trennen.',
      'bd.mongosh_faltante': 'mongosh fehlt: Installieren Sie es unter Dienste, um MongoDB zu verwalten.',
      'tuneles.sitio_no_encontrado': 'Das Projekt wurde nicht gefunden.',
      'tuneles.confirmacion_requerida':
        'Das Veröffentlichen von {dominio} im Internet muss in WolfCore Dev bestätigt werden.',
      'tuneles.confirmacion_obsoleta':
        'Der Tunnel für {dominio} hat sich seit der Bestätigung geändert: Bitte bestätigen Sie erneut.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared ist nicht installiert. Installieren Sie es unter Dienste.',
      'tuneles.proveedor_no_disponible': 'Der Tunnel-Anbieter {proveedor} ist nicht verfügbar.',
      'tuneles.cloudflare_sin_cuenta':
        'Verbinden Sie zuerst Ihr Cloudflare-Konto in den Tunnel-Optionen.',
      'tuneles.cloudflare_sin_credencial':
        'Für diesen Tunnel sind keine Zugangsdaten gespeichert: Erstellen Sie ihn in den Tunnel-Optionen neu.',
      'tuneles.cloudflare_datos_invalidos':
        'Der Tunnelname (Kleinbuchstaben, Ziffern und Bindestriche) oder die öffentliche Domain ist ungültig.',
      'tuneles.cloudflare_conexion_en_curso': 'Es läuft bereits eine Verbindung zu Cloudflare.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare hat {registrado} statt {dominio} registriert: Die Domain gehört nicht zur autorisierten Zone. Löschen Sie diesen Eintrag im Cloudflare-Dashboard.',
      'tuneles.cloudflare_conexiones_activas':
        'Der Tunnel {nombre} hat aktive Verbindungen (cloudflared erfordert -f zum Löschen). Schließen Sie ihn auf allen Geräten, auf denen er geöffnet ist, und versuchen Sie es erneut, oder verwenden Sie „Nur hier vergessen“.',
      'tuneles.nombre_en_uso': 'Der Tunnel {nombre} wird bereits von einer anderen Website verwendet.',
      'tuneles.dominio_en_uso': 'Die Domain {dominio} wird bereits von einer anderen Website verwendet.',
      'tuneles.confirmacion_olvidar': 'Das Vergessen oder Neuerstellen des Tunnels {nombre} muss bestätigt werden.',
      'tuneles.cloudflare_fallo': 'cloudflared konnte den Vorgang nicht abschließen: {detalle}',
      'tuneles.credencial_no_protegida':
        'Die Zugangsdaten konnten nicht auf den Benutzer beschränkt werden und wurden daher nicht verwendet.',
      'tuneles.sin_cifrado':
        'Die Systemverschlüsselung ist nicht verfügbar: Zugangsdaten können nicht gespeichert werden.',
      'tuneles.token_invalido':
        'Das Token ist ungültig: erlaubt sind nur Buchstaben, Ziffern sowie _ . - (8 bis 200 Zeichen). Speichern Sie es in den Tunnel-Optionen erneut.',
      'tuneles.ngrok_no_instalado':
        'ngrok ist auf diesem Computer nicht installiert. Installieren Sie es von ngrok.com und versuchen Sie es erneut.',
      'tuneles.ngrok_sin_token': 'Das ngrok-Token fehlt: Speichern Sie es in den Tunnel-Optionen.',
      'tuneles.expose_sin_token': 'Das Expose-Token fehlt: Speichern Sie es in den Tunnel-Optionen.',
      'tuneles.tailscale_no_instalado':
        'Tailscale ist auf diesem Computer nicht installiert. WolfCore Dev installiert es nicht: Installieren Sie es von tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale ist nicht angemeldet: Melden Sie sich bei Tailscale an und versuchen Sie es erneut.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale veröffentlicht bereits etwas auf dem HTTPS-Port {puerto}. WolfCore Dev überschreibt dies nicht: Entfernen Sie es über Tailscale und versuchen Sie es erneut.',
      'lan.sitio_no_encontrado': 'Die Website wurde nicht gefunden.',
      'lan.confirmacion_requerida':
        'Die Freigabe von {dominio} im lokalen Netzwerk muss in WolfCore Dev bestätigt werden.',
      'lan.datos_reales':
        '{dominio} enthält echte Daten: Eine Freigabe im lokalen Netzwerk ist nicht zulässig, auch nicht mit Bestätigung. Verwenden Sie eine Kopie ohne Kundendaten.',
      'lan.sin_red':
        'Es besteht keine Verbindung zu einem lokalen Netzwerk (WLAN oder Ethernet). Verbinden Sie sich mit einem Netzwerk und versuchen Sie es erneut.',
      'lan.ip_no_valida':
        'Die Adresse {ip} gehört nicht mehr zu Ihrem lokalen Netzwerk. Öffnen Sie den Dialog erneut und bestätigen Sie noch einmal.',
      'lan.requiere_https': '{dominio} leitet auf HTTPS um: Geben Sie die Website mit der HTTPS-Option frei.',
      'lan.sin_puertos':
        'Zwischen 8100 und 8199 sind keine freien Ports für das lokale Netzwerk verfügbar (freigegebene Websites und der CA-Link nutzen diesen Bereich). Beenden Sie eine Freigabe oder schließen Sie den CA-Dialog und versuchen Sie es erneut.',
      'tuneles.expose_no_instalado':
        'Expose ist nicht installiert. Unter Windows funktioniert es nur mit expose.phar: Legen Sie die Datei in {carpeta} ab.',
      'tuneles.expose_datos_reales':
        'Expose wird nicht für Websites mit echten Daten verwendet: Der Anfrage-Inspektor ist im gesamten lokalen Netzwerk sichtbar. Verwenden Sie einen anderen Anbieter.',
      'tuneles.confirmacion_requerida_tailnet':
        'Die Freigabe von {dominio} für Ihr Tailnet muss in WolfCore Dev bestätigt werden.',
      'tuneles.tailscale_estado_ilegible':
        'Es konnte nicht gelesen werden, was Tailscale auf diesem Computer bereits veröffentlicht; daher wurde nichts geöffnet, um nichts zu überschreiben. Prüfen Sie, ob Tailscale läuft, und versuchen Sie es erneut.',
      'tuneles.tailscale_no_habilitado':
        'Serve oder Funnel ist in Ihrem Tailnet nicht aktiviert. Aktivieren Sie es unter {enlace} und versuchen Sie es erneut.',
      'tuneles.ngrok_desactualizado':
        'Ihre ngrok-Version ist veraltet und unterstützt nicht die Funktionen, die WolfCore Dev benötigt. Aktualisieren Sie ngrok (ngrok update) und versuchen Sie es erneut.',
      'hosts.dominio_invalido': 'Eine Domain ist ungültig.',
      'hosts.tiempo_agotado':
        'Keine Antwort auf die Administratorberechtigung innerhalb von {segundos} s; die hosts-Datei blieb unverändert.',
      'https.sin_dominio': 'Ein Zertifikat benötigt mindestens eine Domain.',
      'https.sin_autoridad':
        'Die Zertifizierungsstelle von WolfCore Dev existiert nicht. Installieren Sie die CA im Bereich HTTPS, bevor Sie Zertifikate ausstellen.',
      'herramientas.pid_invalido': 'Die PID ist ungültig.',
      'herramientas.pid_sistema': 'Die PID {pid} gehört zum System und kann nicht beendet werden.',
      'herramientas.proceso_propio':
        'WolfCore Dev und der Prozess, der es gestartet hat, können nicht beendet werden.',
      'herramientas.proceso_inexistente': 'Der Prozess {pid} existiert nicht mehr.',
      'herramientas.sin_editor':
        'Es wurde kein Code-Editor gefunden. Installieren Sie einen (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} ist nicht installiert. Wählen Sie unter Einstellungen einen anderen Editor.',
      'herramientas.editor_invalido': 'Dieser Editor ist ungültig.',
      'herramientas.carpeta_sitio_inexistente': 'Der Projektordner existiert nicht.',
      'herramientas.ruta_no_absoluta': 'Der Pfad muss absolut sein.',
      'herramientas.sin_seleccion': 'Wählen Sie mindestens ein Element aus.',
      'herramientas.dominio_invalido': 'Eine Domain oder IP ist ungültig.',
      'herramientas.demasiados_dominios':
        'Ein Zertifikat unterstützt höchstens {maximo} Domains oder IPs.',
      'buscar.consulta_invalida': 'Geben Sie einen Suchbegriff ein (bis zu 500 Zeichen).',
      'buscar.raiz_invalida': 'Der Ordner oder die Datei existiert nicht oder ist ungültig.',
      'buscar.regex_invalida': 'Der reguläre Ausdruck ist ungültig.',
      'buscar.regex_lenta':
        'Der reguläre Ausdruck dauert zu lange: Vereinfachen Sie ihn oder verwenden Sie literalen Text.',
      'buscar.demasiadas': 'Es laufen bereits {maximo} Suchen: Brechen Sie eine ab oder warten Sie.',
      'terminal.no_abrio': 'Das Terminal konnte nicht geöffnet werden.',
      'terminal.no_instalada': '{nombre} ist nicht installiert. Wählen Sie unter Einstellungen ein anderes Terminal.',
      'terminal.invalida': 'Dieses Terminal ist ungültig.',
      'terminal.powershell_restringido':
        'PowerShell befindet sich auf diesem Computer im eingeschränkten Sprachmodus (Organisationsrichtlinie oder AppLocker): WolfCore Dev kann das Terminal nicht öffnen. Öffnen Sie es selbst im Projektordner.',
      'proyectos.no_existe': 'Das Projekt existiert nicht.',
      'proyectos.no_confiado': 'Aktivieren Sie "Ich vertraue diesem Repository", um das Rezept auszuführen.',
      'proyectos.receta_en_curso': 'Für dieses Projekt wird bereits ein Rezept ausgeführt.',
      'proyectos.paso_no_omitible': 'Der Schritt "Website erstellen" kann nicht übersprungen werden.',
      'workspaces.no_existe': 'Dieser Workspace existiert nicht.',
      'workspaces.invalido': 'Der Workspace ist ungültig: Prüfen Sie Name und Elemente.',
      'workspaces.captadores_exclusivos':
        'Zwei E-Mail-Catcher können nicht gleichzeitig gestartet sein: Es läuft immer nur einer.',
      'workspaces.elemento_fallo':
        'Der Vorgang mit {elemento} konnte nicht abgeschlossen werden. Prüfen Sie Dienste und die zugehörigen Protokolle.',
      'workspaces.base_no_responde':
        '{elemento} wurde nicht gestartet, weil die Datenbank dieses Projekts nicht antwortet.',
      'tareas.cron_invalida':
        'Der Cron-Ausdruck ist ungültig. Verwenden Sie 5 Felder: Minute, Stunde, Tag des Monats, Monat und Wochentag (z. B. 0 3 * * *).',
      'tareas.comando_invalido':
        'Der Befehl ist nicht zulässig. Verwenden Sie php, node, npm run oder python mit einer Projektdatei, ohne Inline-Code (-r, -e, -c).',
      'tareas.invalida': 'Die Aufgabe ist ungültig: Prüfen Sie Name, Zeitplan und Befehl.',
      'tareas.no_existe': 'Diese Aufgabe existiert nicht mehr.',
      'tareas.sin_confirmar': 'Bestätigen Sie den Befehl der Aufgabe, um sie ausführen zu können.',
      'tareas.sitio_no_confiado':
        'Aktivieren Sie im Projekt „Ich vertraue diesem Repository“, um dessen Aufgaben auszuführen.',
      'tareas.receta_cambio':
        'Das Rezept des Projekts hat sich geändert, seit Sie ihm vertraut haben: Prüfen Sie es und aktivieren Sie „Ich vertraue diesem Repository“ erneut.',
      'tareas.aislado':
        'Dies ist ein Testdaten-Ordner (WOLFCORE_DATOS): Erlauben Sie geplante Aufgaben, um sie auszuführen.',
      'tareas.carpeta': 'Der Projektordner existiert nicht: Die Aufgabe kann nicht ausgeführt werden.',
      'tareas.en_curso': 'Die Aufgabe wird bereits ausgeführt.',
      'tareas.demasiadas': 'Zu viele Aufgaben in diesem Projekt (maximal {maximo}).',
      'cli.no_autorizado':
        'Der CLI-Befehl ist nicht autorisiert: Führen Sie ihn erneut aus, während die WolfCore Dev-App geöffnet ist.',
      'cli.orden_desconocida': 'WolfCore Dev kennt diesen CLI-Befehl nicht.',
      'cli.argumentos_invalidos': 'Die Befehlsargumente sind ungültig.',
      'cli.solicitud_grande': 'Die Anfrage ist zu groß (maximal {maximo} Bytes).',
      'cli.formato_no_admitido': 'Die Anfrage hat kein von der CLI unterstütztes Format.',
      'cli.plazo':
        'Der Befehl hat zu lange gedauert und läuft möglicherweise noch. Prüfen Sie den Status in WolfCore Dev.',
      'cli.ocupado':
        'WolfCore Dev bearbeitet derzeit zu viele CLI-Befehle: Bitte warten Sie einen Moment.',
      'cli.requiere_confirmacion':
        'Dieser Befehl veröffentlicht oder ändert etwas und erfordert eine Bestätigung (--si) für {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} enthält echte Daten: Bestätigen Sie zusätzlich mit der Befehlsoption für echte Daten (der Domain der Website).',
      'cli.requiere_confirmacion_global':
        'Das Ändern von PHP für alle Terminals erfordert eine Bestätigung (--si).',
      'cli.confirmacion_rechazada':
        'Die Bestätigung im WolfCore Dev-Fenster wurde abgelehnt oder war nicht verfügbar: Es wurde nichts geändert.',
      'cli.confirmacion_vencida':
        'Niemand hat rechtzeitig im WolfCore Dev-Fenster bestätigt: Es wurde nichts geändert.',
      'cli.tunel_fallo': 'Der Tunnel konnte nicht geöffnet werden. Prüfen Sie das zugehörige Protokoll in WolfCore Dev.',
      'cli.inicio_fallo':
        'Es konnte nicht alles Angeforderte gestartet werden. Prüfen Sie die Protokolle in WolfCore Dev.',
      'cli.parada_fallo':
        'Es konnte nicht alles Angeforderte gestoppt werden. Prüfen Sie die Protokolle in WolfCore Dev.',
      'cli.interno': 'Interner Fehler des CLI-Servers.',
      'cli.proveedor_distinto':
        'Die Website verwendet einen anderen Tunnel-Anbieter ({proveedor}). Prüfen Sie dies und bestätigen Sie erneut.',
      'cli.sitio_no_encontrado': 'Die Website {sitio} existiert nicht.',
      'cli.carpeta_invalida':
        'Der Ordner existiert nicht, ist ein Systemordner oder der Datenordner von WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Dieser Ordner gehört zu keiner Website in WolfCore Dev: Verknüpfen Sie ihn zuerst.',
      'cli.ya_vinculada': 'Dieser Ordner ist bereits die Website {sitio}.',
      'cli.tipo_no_soportado':
        'Projekte vom Typ {tipo} werden über die Oberfläche von WolfCore Dev erstellt.',
      'cli.sitio_sin_php': 'Die Website {sitio} verwendet kein PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} ist nicht installiert. Installieren Sie es unter Dienste.',
      'cli.fuente_no_existe': 'Dieses Protokoll existiert noch nicht.',
      'cli.token_no_protegido':
        'Die Token-Datei konnte nicht auf den aktuellen Benutzer beschränkt werden: Die CLI wird nicht aktiviert.',
      'cli.carpeta_ajena':
        'Der Ordner run/ im Datenordner gehört einem anderen Benutzer: Die CLI wird nicht aktiviert.',
      'cli.ruta_invalida': 'Der Pfad von WolfCore Dev enthält Zeichen, die wolf.cmd nicht unterstützt.',
      'cli.path_aislado':
        'Bei einem Testdaten-Ordner (WOLFCORE_DATOS) wird der Benutzer-PATH nicht geändert.',
      'cli.sin_cliente': 'Diese Version von WolfCore Dev enthält den wolf-Client nicht (muss noch kompiliert werden).',
      'cli.demasiados_dialogos':
        'Zu viele Bestätigungen in der letzten Minute: Warten Sie einen Moment und versuchen Sie es erneut.',
      'cli.error': 'Der Befehl konnte nicht abgeschlossen werden: {detalle}',
      'proyectos.carpeta_no_vacia':
        'Der Projektordner enthält bereits Dateien: Wählen Sie einen anderen oder leeren Sie ihn.',
      'secretos.sin_cifrado':
        'Die Systemverschlüsselung ist nicht verfügbar: Das Passwort des eigenen Benutzers kann nicht gespeichert werden. Es wurde nichts geändert.',
      'proyectos.clave_bd_falta':
        'Das gespeicherte Passwort für den Benutzer {usuario} fehlt: Es wurde nichts geschrieben. Im .env-Manager erzeugt "Eigenen Benutzer verwenden" ein neues Passwort.',
      'env.archivo_grande': 'Die Variablendatei ist zu groß (maximal {maximo}).',
      'env.no_regular': 'Die .env-Datei ist keine reguläre Datei: Sie wird weder gelesen noch geändert.',
      'env.clave_inexistente': 'Die Variable {clave} existiert nicht.',
      'env.cambio_invalido': 'Eine Änderung an der .env-Datei ist ungültig.',
      'env.variable_invalida': 'Die Änderung der Variable {clave} ist ungültig.',
      'env.solo_lectura': 'Die Variable {clave} erstreckt sich über mehrere Zeilen: Bearbeiten Sie sie manuell in der Datei.',
      'env.usuario_compartido':
        'Die Datenbank {base} wird auch vom Projekt {proyecto} verwendet: Bestätigen Sie, ob Sie denselben Benutzer teilen möchten.',
      'env.cambio_externo':
        'Die .env-Datei wurde geändert, seit die Vorschau angezeigt wurde: Prüfen Sie sie vor dem Speichern erneut.',
      'env.sin_confirmar': 'Bestätigen Sie, dass Sie die Änderungen an der .env-Datei speichern möchten.',
      'env.versionado':
        'Git verfolgt die .env-Datei dieses Projekts bereits: Der nächste Commit würde ihre Werte hochladen. Bestätigen Sie separat, um fortzufahren.',
      'env.versionado_desconocido':
        'Es konnte nicht geprüft werden, ob Git die .env-Datei dieses Projekts verfolgt: Bestätigen Sie separat, um fortzufahren.',
      'env.copia_invalida': 'Die Kopie der .env-Datei ist ungültig oder existiert nicht mehr.',
      'env.sin_base': 'Die .env-Datei dieses Projekts enthält keine Datenbankverbindung.',
      'env.base_no_resuelta':
        'Die Datenbank dieses Projekts liegt nicht auf einem lokalen Server von WolfCore Dev: Es wurde nichts geändert.',
      'env.motor_no_soportado': 'Derzeit funktioniert "Eigenen Benutzer verwenden" mit MySQL und MariaDB.',
      'env.ya_usa_usuario_propio': 'Dieses Projekt verwendet bereits einen eigenen Benutzer.',
      'plantillas.id_invalido': 'Die Vorlagen-ID ist ungültig.',
      'plantillas.no_existe': 'Die Vorlage existiert nicht.',
      'plantillas.danada':
        'Die Vorlage ist beschädigt oder wurde verändert und wird nicht verwendet. Löschen Sie sie und speichern Sie sie erneut.',
      'plantillas.demasiado_grande':
        'Das Projekt hat zu viele Dateien oder ist zu groß, um es als Vorlage zu speichern (bis zu {maximo} Dateien). Schließen Sie große Ordner aus.',
      'plantillas.demasiado_pesada':
        'Das Projekt ist zu groß, um es als Vorlage zu speichern (bis zu {maximo}). Schließen Sie große Ordner aus.',
      'plantillas.exclusion_invalida':
        'Eine der Ausnahmen ist ungültig (verwenden Sie Namen oder relative Pfade ohne "..").',
      'plantillas.nombre_invalido':
        'Der Vorlagenname ist ungültig (1 bis 60 Zeichen).',
      'plantillas.esquema_fallo':
        'Das Datenbankschema des Projekts konnte nicht gelesen werden: Prüfen Sie, ob der zugehörige Dienst gestartet ist.',
      'plantillas.base_no_resuelta':
        'Die Vorlage kann nicht gespeichert werden: Der Datenbankserver ist entfernt oder keiner der lokalen Dienste verwendet diesen Port.',
      'plantillas.sin_generador_base':
        'Dieser Projekttyp hat keinen Basisgenerator: Die Vorlage muss die Projektdateien enthalten.',
      'plantillas.exclusiones_nuevas':
        'Die Vorlage enthält eine Datei, die jetzt ausgeschlossen ist ({archivo}): Speichern Sie sie erneut aus dem Projekt oder löschen Sie sie.',
      'plantillas.motor_distinto':
        'Das Schema der Vorlage stammt aus MySQL und der gewählte Server ist MariaDB (oder umgekehrt): Es kann Unterschiede geben. Bestätigen Sie, dass Sie fortfahren möchten.',
      'bd.sql_no_permitido':
        'Das Schema enthält eine Anweisung, die nicht zur Struktur gehört, daher wurde nichts ausgeführt: {sentencia}',
      'bd.extension_no_permitida':
        'Das Schema erfordert die Erweiterung {nombre}, die nicht auf der Zulassungsliste steht: Es wurde nichts wiederhergestellt.',
      'bd.esquema_fallo': 'Das vollständige Schema konnte nicht wiederhergestellt werden: Es wurden keine Teiländerungen hinterlassen.',
      'bd.datos_no_permitidos':
        'Der Daten-Dump enthält Anweisungen, die keine reinen Daten sind (nur INSERT, LOCK TABLES und SET sind zulässig): Es wurde nichts importiert.',
      'bd.datos_fallo':
        'Die Daten konnten nicht importiert werden: Die Datenbank blieb unverändert.',
      'perfiles.destino_invalido': 'Wählen Sie den Speicherort für das Profil (eine .wolfperfil-Datei).',
      'perfiles.frase_debil': 'Die Passphrase der CA muss mindestens {minimo} Zeichen lang sein.',
      'perfiles.frase_incorrecta': 'Die Passphrase ist falsch: Es wurde nichts importiert.',
      'perfiles.certificados_sin_ca':
        'Website-Zertifikate werden nur zusammen mit der verschlüsselten CA exportiert: Fügen Sie die CA mit einer Passphrase hinzu.',
      'perfiles.no_existe': 'Die Profildatei existiert nicht.',
      'perfiles.danado': 'Das Profil ist beschädigt oder wurde verändert: Es wurde nichts importiert.',
      'perfiles.demasiado_grande': 'Das Profil ist zu groß (maximal {maximo}).',
      'perfiles.version_no_soportada':
        'Das Profil stammt aus einer neueren Version von WolfCore Dev (Format {version}): Aktualisieren Sie die App zum Importieren.',
      'perfiles.sin_confirmar': 'Bestätigen Sie, dass Sie das Profil importieren möchten.',
      'perfiles.vista_previa_vieja':
        'Der Datenordner oder das Profil hat sich seit der Vorschau geändert: Prüfen Sie sie erneut.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS ist kein gültiger Datenordner: Er muss absolut sein, kein Systemordner und anders als der echte Ordner.',
      'perfiles.confirmar_reemplazar_ca':
        'Das Profil enthält eine CA und auf diesem Computer existiert bereits eine: Vergleichen Sie den Fingerabdruck und bestätigen Sie separat das Ersetzen (nur wenn es Ihre eigene CA ist).',
      'herramientas.imagen_tipo':
        'Diese Datei ist kein unterstütztes Bild (PNG, JPG, WebP, GIF, BMP oder ICO) oder ihr Inhalt stimmt nicht mit dem Typ überein.',
      'herramientas.imagen_grande': 'Das Bild ist zu groß (maximal {maximo}).',
      'herramientas.imagen_dimensiones':
        'Das Bild ist zu groß ({ancho}×{alto} px; maximal {maximo} px pro Seite) und wird aus Sicherheitsgründen nicht geöffnet.',
      'herramientas.zip_sin_archivos': 'Keine Dateien zum Komprimieren vorhanden (Links werden nicht verfolgt).',
      'herramientas.zip_demasiados': 'Zu viele Dateien zum Komprimieren (maximal {maximo}).',
      'herramientas.zip_grande': 'Die zu komprimierenden Daten sind zu groß (maximal {maximo}).',
      'herramientas.pdf_invalido': 'Die Datei ist kein optimierbares PDF.',
      'herramientas.pdf_grande': 'Das PDF ist zu groß (maximal {maximo}).',
      'herramientas.pdf_cifrado': 'Das PDF ist passwortgeschützt und kann nicht optimiert werden.',
      'herramientas.pdf_plazo': 'Das PDF dauerte länger als {segundos} s und wurde abgebrochen.',
      'herramientas.salida_ocupada': 'Es wurde kein freier Dateiname für die neue Datei gefunden.',
      'conversor.formato': 'Diese Konvertierung ist nicht verfügbar.',
      'conversor.archivo_invalido':
        'Die Datei ist beschädigt oder entspricht nicht dem durch die Endung angegebenen Typ.',
      'conversor.archivo_grande': 'Die Datei ist zu groß (maximal {maximo}).',
      'conversor.archivo_peligroso':
        'Die Datei wirkt wie eine ZIP-Bombe oder wurde manipuliert (zu viel Inhalt, XML-Entitäten oder ungültige Namen) und wird aus Sicherheitsgründen nicht geöffnet.',
      'conversor.limite_filas': 'Die Tabelle hat zu viele Zeilen (maximal {maximo}).',
      'conversor.limite_columnas': 'Die Tabelle hat zu viele Spalten (maximal {maximo}).',
      'conversor.limite_paginas': 'Das PDF hat zu viele Seiten (maximal {maximo}).',
      'conversor.pdf_cifrado': 'Das PDF ist passwortgeschützt und kann nicht konvertiert werden.',
      'conversor.plazo': 'Die Konvertierung dauerte länger als {segundos} s und wurde abgebrochen.',
      'conversor.cancelado': 'Konvertierung abgebrochen.',
      'conversor.libreoffice_ausente':
        'Für diese Konvertierung ist LibreOffice erforderlich, das auf diesem Computer nicht installiert ist (WolfCore Dev installiert es nicht).',
      'conversor.libreoffice_fallo': 'LibreOffice konnte das Dokument nicht konvertieren.',
      'conversor.limite_celdas': 'Die Tabelle hat zu viele Zellen (maximal {maximo}).',
      'conversor.memoria': 'Die Datei benötigt zu viel Speicher (mehr als {maximo}) und wurde abgebrochen.',
      'conversor.pdf_no_disponible': 'Das Drucken als PDF ist derzeit nicht verfügbar.',
      'herramientas.imagen_pixeles':
        'Das Bild hat insgesamt zu viele Pixel ({ancho}×{alto} px; maximal {maximo}) und wird aus Sicherheitsgründen nicht geöffnet.',
      'herramientas.zip_cambio': 'Eine Datei wurde während des Komprimierens geändert: Versuchen Sie es erneut.',
      'herramientas.pdf_demasiado_complejo':
        'Das PDF ist zu komplex (würde mehr Speicher als zulässig belegen) und wurde abgebrochen.',
      'herramientas.salida_denegada':
        'An diesem Speicherort kann nicht geschrieben werden: Prüfen Sie die Berechtigungen oder ob der Ordner existiert.',
      'herramientas.fuera_de_la_ca':
        'Die CA von WolfCore Dev signiert nur .test-Domains, localhost und lokale Adressen: {dominio} kann nicht eingeschlossen werden.',
      'perfiles.frase_requerida':
        'Geben Sie die Passphrase des Profils ein, um dessen Datenbanken oder CA zu importieren (oder importieren Sie ohne Datenbanken).',
      'perfiles.sin_espacio':
        'Nicht genügend freier Speicherplatz zum Importieren des Profils: {necesarios} erforderlich, {libres} verfügbar.',
      'perfiles.ca_sin_restricciones':
        'Diese CA kann jede beliebige Website signieren: Importieren Sie sie nur, wenn es Ihre eigene ist, und vergleichen Sie den Fingerabdruck. Bestätigen Sie dies separat.',
      'perfiles.ca_restricciones_ajenas':
        'Die CA des Profils hat Namensbeschränkungen, die nicht von WolfCore Dev stammen: Sie wird nicht importiert.',
      'perfiles.instantanea_fallo':
        'Die vorherige Sicherung der Umgebung konnte nicht gespeichert werden: Es wurde nichts geändert. Prüfen Sie Speicherplatz und Berechtigungen des Datenordners.',
      'perfiles.en_curso': 'Ein Profilimport läuft bereits: Warten Sie, bis er abgeschlossen ist.',
      'importar.origen_apagado':
        'Keine Verbindung zum Datenbankserver des anderen Programms: Starten Sie ihn dort und versuchen Sie es erneut. Die Websites wurden bereits importiert.',
      'importar.origen_no_local': 'Der Quellserver muss sich auf diesem Computer befinden (127.0.0.1).',
      'importar.origen_rechazado': 'Der Quellserver hat Benutzername oder Passwort abgelehnt.',
      'importar.origen_version':
        'Die Version des Quellservers kann mit den in WolfCore Dev installierten Komponenten nicht importiert werden.',
      'importar.volcado_enorme':
        'Die Datenbankdaten sind größer als {maximo} MB und werden nicht auf einmal importiert.',
      'importar.motor_no_soportado':
        'Aus anderen Programmen werden nur MySQL- und MariaDB-Datenbanken importiert.',
      'importar.ruta_fuera':
        'Ein Ordner oder eine Datei außerhalb der Installation oder in einem Systemordner wurde übersprungen.',
      'importar.carpeta_invalida': 'Ein nicht mehr vorhandener oder ungültiger Ordner wurde übersprungen.',
      'importar.archivo_grande':
        'Eine Konfigurationsdatei ist größer als {maximo} KB und wurde nicht gelesen.',
      'importar.archivo_ilegible': 'Eine Konfigurationsdatei ist keine Textdatei oder konnte nicht gelesen werden.',
      'importar.demasiados':
        'Zu viele Websites oder Konfigurationsdateien: Es wurden nur die ersten gelesen.',
      'importar.candidato_desconocido':
        'Diese Website erscheint im Quellprogramm nicht mehr: Suchen Sie erneut.',
      'importar.ya_vinculado': 'Dieser Ordner ist bereits eine Website in WolfCore Dev.',
      'importar.dominio_existe':
        'Es gibt bereits eine Website mit der Domain {dominio}: Ändern Sie diese vor dem Import.',
      'importar.sin_php':
        'Diese Website benötigt PHP, aber es ist keine Version installiert: Installieren Sie eine unter Dienste.',
      'importar.base_existe':
        'Die Datenbank {nombre} existiert am Ziel bereits und wurde nicht verändert. Bestätigen Sie das Ersetzen zum Importieren (zuvor wird eine Sicherung erstellt).',
      'importar.base_fallo':
        'Die Datenbank {nombre} konnte nicht importiert werden: Sie blieb unverändert.',
      'importar.sitio_fallo': 'Die Website konnte nicht erstellt werden.',
      'importar.origen_invalido':
        'Die Zugangsdaten des Quellservers sind ungültig (Benutzer, Passwort oder Port).',
      'importar.sin_seleccion': 'Wählen Sie mindestens eine Website zum Importieren aus.',
      'importar.en_curso': 'Ein Import läuft bereits: Warten Sie, bis er abgeschlossen ist.',
      'importar.cancelado': 'Import abgebrochen: Alles blieb im vorherigen Zustand.',
      'importar.origen_estancado':
        'Der Server des anderen Programms reagierte während des Dumps nicht mehr: Die Datenbank wurde nicht importiert.',
      'importar.sin_espacio':
        'Nicht genügend freier Speicherplatz zum Importieren der Datenbank: ca. {necesarios} MB erforderlich, {libres} MB frei.',
      'importar.origen_fallo': 'Die Datenbank des anderen Programms konnte nicht exportiert werden.',
      'importar.clave_no_ascii':
        'Das Passwort enthält Akzente oder Sonderzeichen, die nicht übergeben werden können: Verwenden Sie ein reines ASCII-Passwort.',
      'plantillas.sin_esquema': 'Die Vorlage enthält kein Datenbankschema.',
      'proyectos.carpeta_invalida': 'Der Projektordner ist ungültig.',
      'proyectos.nombre_invalido':
        'Der Projektname darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten (maximal 40).',
      'proyectos.argumento_invalido': 'Ein Projektwert ist ungültig (Feld: {campo}).',
      'proyectos.base_existe': 'Die Datenbank {nombre} existiert bereits: Wählen Sie einen anderen Namen.',
      'proyectos.dominio_existe': 'Es gibt bereits eine Website mit der Domain {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Dieser Ordner gehört zum Projekt {dominio} oder liegt darin: Wählen Sie einen anderen.',
      'proyectos.sin_python': 'Kein Python installiert: Installieren Sie es unter Dienste.',
      'proyectos.venv_ajeno':
        'Das Projekt bringt ein eigenes .venv mit und WolfCore Dev führt kein Python aus fremden Repositories aus: Löschen Sie es und erstellen Sie die Umgebung neu.',
      'proyectos.paso_base_no_omitible':
        'Der Schritt „Datenbank erstellen“ eines neuen Projekts kann nicht übersprungen werden.',
      'proyectos.sin_php': 'Kein PHP installiert: Installieren Sie es unter Dienste.',
      'proyectos.php_no_instalado': 'PHP {version} ist nicht installiert: Installieren Sie es unter Dienste.',
      'proyectos.python_no_instalado':
        'Python {version} ist nicht installiert: Installieren Sie es unter Dienste.',
      'mcp.token_invalido': 'Das Token des MCP-Servers ist ungültig.',
      'mcp.solicitud_cancelada': 'Der MCP-Client hat die Anfrage abgebrochen: Die Aktion wurde nicht ausgeführt.',
      'doctor.puerto_ocupado': 'Port {puerto} von {servicio} wird von einem anderen Programm ({proceso}) verwendet.',
      'doctor.puerto_iis': 'IIS ({programa}) belegt Port {puerto} von {servicio}.',
      'doctor.puerto_http_sys':
        'Ein Windows-Dienst ({programa}) belegt Port {puerto} von {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} belegt Port {puerto} von {servicio}. Schließen Sie es oder ändern Sie den Port von WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} belegt Port {puerto} von {servicio}.',
      'doctor.puerto_skype': '{programa} belegt Port {puerto} von {servicio}.',
      'doctor.puerto_reservado':
        'Port {puerto} von {servicio} liegt in einem von Windows reservierten Bereich ({desde}-{hasta}: Hyper-V, WSL oder Docker).',
      'doctor.ca_por_vencer': 'Die Zertifizierungsstelle von WolfCore Dev läuft in {dias} Tagen ab.',
      'doctor.ca_vencida': 'Die Zertifizierungsstelle von WolfCore Dev ist abgelaufen.',
      'doctor.certificado_por_vencer': 'Das Zertifikat für {dominio} läuft in {dias} Tagen ab.',
      'doctor.certificado_vencido': 'Das Zertifikat für {dominio} ist abgelaufen.',
      'doctor.hosts_ilegible': 'Die hosts-Datei konnte nicht gelesen werden.',
      'doctor.hosts_utf16':
        'Die hosts-Datei ist in UTF-16 gespeichert: Windows liest ihre Einträge möglicherweise nicht.',
      'doctor.hosts_bloque_duplicado':
        'Die hosts-Datei enthält {bloques} WolfCore Dev-Blöcke; es darf nur einer sein.',
      'doctor.hosts_bloque_sin_cierre':
        'Einem WolfCore Dev-Block in der hosts-Datei fehlt die Schlussmarkierung.',
      'doctor.hosts_dominios_faltantes':
        '{cantidad} Domains Ihrer Websites fehlen in der hosts-Datei.',
      'doctor.hosts_solo_lectura':
        'Die hosts-Datei ist schreibgeschützt (oft durch ein Antivirenprogramm). WolfCore Dev kann sie dennoch mit Administratorrechten schreiben.',
      'doctor.path_duplicados':
        'Der Benutzer-PATH enthält {cantidad} doppelte Einträge von WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Ein anderer Ordner mit {programa} ({origen}) steht vor WolfCore Dev im PATH: In Terminals wird dieser verwendet.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) fehlt: PHP und andere Dienste starten ohne dieses Paket nicht.',
      'doctor.enlazador_msvc_ausente':
        'Rust ist installiert, aber die C++-Tools der Visual Studio Build Tools (MSVC-Linker) fehlen: cargo kann Programme nicht linken.',
      'doctor.antivirus_sin_exclusion':
        'Das Antivirenprogramm prüft den Datenordner von WolfCore Dev: PHP und Dienste starten möglicherweise langsamer.',
      'doctor.firewall_reglas':
        'Windows erlaubt eingehende Netzwerkverbindungen über {cantidad} Regel(n) für WolfCore Dev-Programme (nginx, PHP oder Datenbanken) in den Profilen {perfiles}: Diese Programme sind im Netzwerk erreichbar.',
      'doctor.firewall_no_comprobado':
        'Die Windows-Firewall konnte nicht geprüft werden (Administratorrechte erforderlich).',
      'doctor.firewall_reglas_ajenas':
        'Es gibt {cantidad} eingehende Regel(n) anderer Programme (FlyEnv, Laragon, XAMPP oder andere) für nginx, PHP oder Datenbanken in den Profilen {perfiles}. Sie gehören nicht zu WolfCore Dev und werden hier nur angezeigt, niemals entfernt.',
      'doctor.servicio_en_error': '{servicio} befindet sich im Fehlerzustand.',
      'doctor.revision_fallida': 'Die Prüfung {revision} konnte nicht abgeschlossen werden.',
      'doctor.confirmacion_requerida': 'Bestätigen Sie die Reparatur vor der Anwendung.',
      'doctor.hallazgo_desconocido': 'Dieser Befund existiert nicht mehr: Prüfen Sie erneut.',
      'doctor.solo_informa':
        'Dieser Befund hat keine automatische Reparatur: Folgen Sie den Hinweisen.',
      'doctor.reparacion_fallida': 'Die Reparatur konnte nicht angewendet werden.',
      'doctor.reparacion_cancelada': 'Administratorberechtigung abgebrochen: Es wurde nichts geändert.',
      'doctor.reparacion_denegada': 'Windows oder ein Antivirenprogramm hat den Zugriff verweigert: Es wurde nichts geändert.',
      'doctor.ya_resuelto': 'Das Problem bestand nicht mehr: Keine Änderung erforderlich.',
      'doctor.ca_vieja_sin_quitar':
        'Die neue Zertifizierungsstelle ist aktiv, aber die alte konnte nicht aus dem Windows-Speicher entfernt werden. Sie können sie unter HTTPS entfernen.',
      'doctor.sin_puerto_libre': 'Es wurde kein freier Port zum Verschieben des Dienstes gefunden.',
      'doctor.ca_vuelta_atras_incompleta':
        'Die neue Zertifizierungsstelle konnte nicht angewendet werden und das Zurücksetzen war unvollständig. Prüfen Sie den Bereich HTTPS; eine datierte Kopie liegt in etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox vertraut der Zertifizierungsstelle von WolfCore Dev in {cantidad} Profilen nicht (es nutzt einen eigenen Speicher).',
      'confianza.sin_ca': 'Noch keine Zertifizierungsstelle vorhanden: Erstellen Sie sie unter HTTPS.',
      'confianza.sin_raices':
        'Keine vertrauenswürdigen Stammzertifikate für Python gefunden (weder certifi noch Windows): Es wurde nichts geändert.',
      'confianza.node_variable_ajena':
        'Sie haben bereits eine eigene NODE_EXTRA_CA_CERTS: WolfCore Dev ersetzt sie nicht.',
      'confianza.variable_fallida': 'Die Benutzervariable konnte nicht geändert werden.',
      'firefox.abierto': 'Firefox ist geöffnet: Schließen Sie ihn und versuchen Sie es erneut.',
      'firefox.error': 'Die user.js dieses Profils konnte nicht geändert werden; sie blieb unverändert.',
      'firefox.fuera':
        'Es gibt Profile außerhalb des Firefox-Ordners: Aktivieren Sie sie unter CA-Vertrauen mit eigener Bestätigung.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS verweist nicht mehr auf die WolfCore Dev-CA (manuell geändert): Sie wurde nicht gelöscht.',
      'ia.clave_invalida': 'Der Anbieter hat den Schlüssel abgelehnt: Prüfen Sie ihn oder erstellen Sie einen neuen.',
      'ia.sin_saldo': 'Das Konto beim Anbieter hat kein Guthaben oder Kontingent mehr.',
      'ia.limite': 'Der Anbieter hat die Anfragen begrenzt: Warten Sie kurz und versuchen Sie es erneut.',
      'ia.region': 'Der Anbieter ist in Ihrem Land oder Ihrer Region nicht verfügbar.',
      'ia.sin_red': 'Keine Verbindung zum Anbieter: Prüfen Sie das Netzwerk oder die Basis-URL.',
      'ia.url_invalida':
        'Die Basis-URL ist ungültig: Verwenden Sie https:// (oder http:// nur für 127.0.0.1 oder [::1]), ohne Benutzer oder Passwort.',
      'ia.plazo': 'Der Anbieter antwortete nicht innerhalb von {segundos} s.',
      'ia.respuesta_rara': 'Der Anbieter hat eine unerwartete Antwort zurückgegeben.',
      'ia.cancelado': 'Die Anfrage an den Anbieter wurde abgebrochen.',
      'ia.sin_clave': 'Dieser Anbieter benötigt einen Schlüssel: Speichern Sie ihn zuerst.',
      'ia.clave_mal_formada':
        'Der Schlüssel hat kein gültiges Format (keine Leerzeichen oder Zeilenumbrüche).',
      'ia.modelo_invalido': 'Der Modellname ist ungültig.',
      'ia.modelo_no_disponible': 'Das Modell existiert nicht oder Ihr Konto hat keinen Zugriff darauf.',
      'ia.proveedor_invalido': 'Die Anbieterkonfiguration ist ungültig.',
      'ia.env_conflicto':
        'Die .env definiert {claves} bereits mit einem anderen Wert: Bestätigen Sie das Ersetzen.',
      'ia.env_sin_confirmar':
        'Bestätigen Sie das Schreiben des Schlüssels in die .env (wird im Klartext gespeichert).',
      'ia.env_versionado':
        'Git verfolgt die .env dieses Projekts bereits: Der nächste Commit würde den Schlüssel hochladen, selbst wenn sie in .gitignore steht. Entfernen Sie sie mit git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Es konnte nicht geprüft werden, ob Git die .env dieses Projekts verfolgt: Bestätigen Sie separat das Schreiben des Schlüssels.',
      'ia.proveedor_no_existe': 'Der KI-Anbieter existiert nicht mehr.',
      'ia.url_cambia_con_clave':
        'Der Anbieter hat einen gespeicherten Schlüssel: Bestätigen Sie, dass er an die neue URL gesendet werden darf.',
      'ia.mensaje_sin_confirmar':
        'Bestätigen Sie das Senden der Testnachricht (verbraucht Token Ihres Kontos).',
      'ia.clave_ilegible':
        'Der gespeicherte Schlüssel des Anbieters konnte nicht gelesen werden: Löschen und speichern Sie ihn erneut.',
      'ia.argumento_invalido': 'Ungültiger Wert ({campo}).',
      'correo.auth': 'Der Anbieter hat Benutzername oder Passwort abgelehnt.',
      'correo.conexion': 'Keine Verbindung zum SMTP-Server: Prüfen Sie Host und Port.',
      'correo.tls':
        'Es konnte keine gültige verschlüsselte Verbindung zum Server hergestellt werden (Zertifikat, Hostname oder STARTTLS). Es wurde nichts gesendet.',
      'correo.rechazado':
        'Der Server hat die Nachricht oder eine Adresse abgelehnt. Prüfen Sie den Absender: Viele Anbieter akzeptieren nur verifizierte Absender oder Domains.',
      'correo.plazo': 'Der Server hat nicht rechtzeitig geantwortet (20 s).',
      'correo.host_invalido':
        'Der SMTP-Server muss ein Hostname oder eine IP sein, ohne Protokoll, Port oder Pfad.',
      'correo.host_local':
        'Dieser Server zeigt auf diesen Computer oder das lokale Netzwerk: Bestätigen Sie die Verwendung.',
      'correo.destinatario_invalido': 'Die Empfängeradresse ist ungültig.',
      'correo.proveedor_invalido': 'Die Anbieterdaten sind ungültig.',
      'correo.proveedor_no_existe': 'Der E-Mail-Anbieter existiert nicht mehr.',
      'correo.sin_clave': 'Der Anbieter hat keinen gespeicherten Schlüssel.',
      'correo.clave_ilegible':
        'Der gespeicherte Schlüssel des Anbieters konnte nicht gelesen werden: Löschen und speichern Sie ihn erneut.',
      'correo.cambia_con_clave':
        'Der Anbieter hat einen gespeicherten Schlüssel: Bestätigen Sie das Senden an den neuen Server.',
      'correo.env_sin_confirmar':
        'Bestätigen Sie das Schreiben der E-Mail-Variablen in die .env.',
      'correo.ocupado': 'Ein Versandtest läuft bereits.',
      'correo.limite': 'Warten Sie {segundos} s vor einem weiteren Versandtest.',
      'correo.clave_mal_formada':
        'Der Schlüssel hat kein gültiges Format: nur druckbare Zeichen, keine Zeilenumbrüche, maximal 4096 Zeichen.',
      'correo.argumento_invalido': 'Ungültiger Wert ({campo}).',
      'agentes.no_existe': 'Dieser Agent wird nicht unterstützt.',
      'agentes.sin_confirmar': 'Bestätigen Sie die Aktion im Dialog, bevor Sie fortfahren.',
      'agentes.no_instalable':
        'Dieser Agent wird nicht über WolfCore Dev installiert: Folgen Sie der offiziellen Anleitung ({guia}).',
      'agentes.sin_node': 'Installieren Sie Node unter Dienste, um den Agenten installieren zu können.',
      'agentes.node_antiguo':
        '{agente} benötigt Node {requerida} oder neuer, aktiv wäre jedoch {actual}. Installieren Sie ein neueres Node unter Dienste.',
      'agentes.node_version_desconocida':
        'Die Node-Version konnte nicht ermittelt werden und {agente} benötigt Node {requerida} oder neuer. Prüfen Sie Node unter Dienste.',
      'instalador.zip_demasiado_grande':
        'Das heruntergeladene Paket ist zu groß oder enthält zu viele Dateien: Es wird nicht installiert.',
      'rust.rustup_init_fallo': 'rustup-init wurde nicht sauber beendet (Code {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Rust {version} konnte nicht installiert werden (Code {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} konnte nicht deinstalliert werden: {detalle}',
      'rust.descarga_fallo': 'rustup konnte nicht heruntergeladen werden (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Der Agent konnte nicht installiert werden: {detalle}',
      'agentes.no_instalado': '{agente} ist nicht installiert.',
      'agentes.mcp_no_soportado':
        '{agente} dokumentiert nicht, wie das Token aus einer Umgebungsvariable gelesen wird: MCP wird nicht registriert.',
      'agentes.config_ilegible':
        '{archivo} konnte nicht gelesen werden und wurde nicht geändert. Prüfen Sie die Datei manuell.',
      'agentes.config_en_uso':
        '{archivo} wurde während der Bearbeitung durch WolfCore Dev geändert: Schließen Sie den Agenten und versuchen Sie es erneut. Es wurde nichts geändert.',
      'agentes.proveedor_incompatible': '{agente} kann diesen KI-Anbieter nicht verwenden.',
      'agentes.sin_cambios_preparados': 'Keine vorgemerkten Änderungen (git add) zum Beschreiben vorhanden.',
      'agentes.argumento_invalido': 'Ungültiger Wert ({campo}).',
      'git.commit_fallo': 'Der Commit konnte nicht erstellt werden: {detalle}',
      'git.mensaje_invalido': 'Die Commit-Nachricht ist leer oder ungültig.',
      'php.rama_no_instalada': 'PHP {rama} ist nicht installiert.',
      'php.argumento_invalido': 'Ungültiger Wert ({campo}).',
      'php.valor_invalido': 'Der Wert für {clave} ist ungültig.',
      'php.ini_invalido': 'PHP startet nicht mit dieser php.ini; es wurde nichts gespeichert. Ausgabe: {salida}',
      'php.no_arranco':
        'PHP {rama} startete mit der Änderung nicht neu; der vorherige Stand wurde wiederhergestellt und läuft wie zuvor.',
      'php.caido_tras_restaurar':
        'PHP {rama} startete nicht neu; der vorherige Stand wurde wiederhergestellt, antwortet aber weiterhin nicht. Prüfen Sie Dienste und PHP-Protokolle.',
      'php.respaldo_no_existe': 'Diese Sicherung der php.ini existiert nicht.',
      'php.extension_no_existe': 'Die Erweiterung {nombre} befindet sich nicht im ext-Ordner dieser Version.',
      'php.extension_no_catalogo':
        'Die Erweiterung {nombre} ist im Katalog für diese Version nicht vorhanden.',
      'php.variante_desconocida': 'Die Build-Variante dieses PHP konnte nicht ermittelt werden.',
      'php.sin_variante': 'Der Katalog enthält {nombre} nicht für den Build {variante}.',
      'php.huella_distinta': 'Der Download stimmt nicht mit der veröffentlichten Prüfsumme überein; es wurde nichts installiert.',
      'php.descarga_fallida': 'Die Erweiterung konnte nicht heruntergeladen werden: {detalle}',
      'php.extension_en_uso':
        'Die DLL von {nombre} wird verwendet. Stoppen Sie PHP {rama} und versuchen Sie es erneut.',
      'php.extension_sin_dll':
        'Die DLL von {nombre} konnte nicht ersetzt werden und der ext-Ordner von PHP {rama} ist ohne sie. Stoppen Sie PHP {rama} und versuchen Sie es erneut: Die vorherige kehrt beim Start zurück.',
      'php.sitio_sin_php': 'Diese Website verwendet kein PHP.',
      'php.sitio_no_arranco':
        'Das eigene PHP von {sitio} antwortete nach der Änderung nicht; der vorherige Stand wurde wiederhergestellt.',
      'php.sin_puertos_sitio': 'Keine freien Ports mehr für eigene PHP-Instanzen der Websites.',
      'xdebug.launch_invalido':
        'Die .vscode/launch.json des Projekts kann nicht gelesen werden; es wurde nichts geändert.',
      'xdebug.launch_no_seguro':
        'Der Ordner .vscode oder seine launch.json ist ein Link oder etwas anderes: Dort wird nicht geschrieben.',
      'xdebug.sin_configurar': 'Konfigurieren Sie Xdebug auf der Website, bevor Sie launch.json erzeugen.',
      'nginx.sitio_no_existe': 'Diese Website existiert nicht mehr.',
      'nginx.texto_invalido':
        'Der vhost-Text ist zu lang, leer oder enthält Steuerzeichen.',
      'nginx.sintaxis': 'Zeile {linea}: {detalle}. Es wurde nichts geändert.',
      'nginx.directiva_prohibida':
        'Zeile {linea}: „{directiva}“ ist im vhost einer Website nicht erlaubt (könnte andere Websites oder Dateien außerhalb des Projekts betreffen). Es wurde nichts geändert.',
      'nginx.ruta_fuera':
        'Zeile {linea}: „{directiva}“ zeigt außerhalb des Projektordners oder seiner Protokolle und Zertifikate. Es wurde nichts geändert.',
      'nginx.fuera_de_server':
        'Zeile {linea}: Der vollständige vhost darf nur „server“-Blöcke enthalten; „{directiva}“ liegt außerhalb. Es wurde nichts geändert.',
      'nginx.dominio_ajeno':
        'Zeile {linea}: „{nombre}“ ist keine Domain dieser Website. Fügen Sie sie zuerst als Alias hinzu.',
      'nginx.puerto_ajeno':
        'Zeile {linea}: Die Website darf nur auf den in den Einstellungen konfigurierten Nginx-Ports lauschen.',
      'nginx.version_no_existe': 'Diese vhost-Version ist nicht mehr im Verlauf vorhanden.',
      'nginx.argumento_invalido': 'Ungültiges Argument: {campo}',
      'nginx.destino_interno':
        'Zeile {linea}: „{directiva}“ zeigt auf einen internen Dienst von WolfCore Dev (Adminer, Mailpit, Datenbanken, PHP anderer Websites…) und würde ihn im Netzwerk und in Tunneln freigeben. Es wurde nichts geändert.',
      'nginx.caido_tras_restaurar':
        'Nginx antwortete nicht mehr: Der vorherige vhost wurde wiederhergestellt, antwortet aber weiterhin nicht. Prüfen Sie Dienste und das Nginx-Protokoll. {salida}',
      'depuracion.puerto_ocupado':
        'Port {puerto} ist bereits belegt: Die Dump-Erfassung kann nicht lauschen. Schließen Sie das verwendende Programm (z. B. Symfony server:dump).',
      'depuracion.no_iniciado': 'Die Dump-Erfassung ist ausgeschaltet.',
      'depuracion.tipo_no_soportado': 'Die Dump-Erfassung ist für PHP- und FastAPI-Websites gedacht.',
      'depuracion.confirmacion': 'Bestätigen Sie die Dump-Erfassung im Dialog.',
      'depuracion.argumento_invalido': 'Ungültiges Argument: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Diese Datei liegt nicht im Website-Ordner: Sie wird nicht im Editor geöffnet.',
      'contenedores.motor_invalido': 'Unbekannte Container-Engine.',
      'contenedores.id_invalido': 'Die Container-ID ist ungültig.',
      'contenedores.argumento_invalido': 'Ungültiges Argument: {campo}',
      'contenedores.sin_motor': '{motor} ist auf diesem Computer nicht installiert.',
      'contenedores.no_responde':
        '{motor} antwortet nicht. Öffnen Sie Docker Desktop oder starten Sie die Podman-Maschine und versuchen Sie es erneut.',
      'contenedores.remoto':
        'Die Standardverbindung von {motor} zeigt auf einen anderen Computer: WolfCore Dev nutzt nur lokale Engines.',
      'contenedores.no_existe': 'Der Container existiert nicht mehr. Aktualisieren Sie die Liste.',
      'contenedores.accion_fallo': 'Die Engine konnte dies nicht ausführen: {detalle}',
      'contenedores.demasiados_registros':
        'Es können höchstens {maximo} Container-Protokolle gleichzeitig verfolgt werden.',
      'contenedores.sin_confirmar': 'Bestätigen Sie die Aktion im Dialog.',
      'catalogo.indice_invalido':
        'Der Versionsindex von {servicio} hat die Prüfung nicht bestanden; die gespeicherte Liste wird verwendet.',
      'catalogo.sin_huella':
        '{servicio} {version} hat keine veröffentlichte Prüfsumme: Bestätigen Sie die Installation im Dialog.',
      'catalogo.huella_debil':
        '{servicio} {version} hat nur eine schwache Prüfsumme (MD5 oder SHA-1): Bestätigen Sie die Installation im Dialog.',
      'catalogo.huella_no_coincide': 'Der Download stimmt nicht mit der veröffentlichten Prüfsumme überein.',
      'catalogo.redireccion_ajena': 'Der Download versuchte auf eine nicht erlaubte Website ({host}) umzuleiten.',
      'catalogo.demasiadas_redirecciones':
        'Der Download führte zu viele Weiterleitungen aus (mehr als {maximo}).',
      'catalogo.respuesta_grande': 'Die Serverantwort ist zu groß.',
      'catalogo.version_no_encontrada':
        'Version {version} von {servicio} ist nicht im Katalog.',
      'catalogo.huella_no_disponible':
        'Die Prüfsumme für {servicio} {version} konnte nicht abgerufen werden (keine Verbindung oder Quelle antwortete nicht). Versuchen Sie es erneut.',
      'catalogo.firma_invalida':
        'Die PGP-Signatur von {servicio} {version} ist ungültig oder nicht veröffentlicht: Es wurde nichts installiert.',
      'catalogo.firma_no_soportada':
        'Die PGP-Signatur von {servicio} {version} nutzt ein Format, das WolfCore Dev nicht prüft: Es wurde nichts installiert.',
      'catalogo.clave_desconocida':
        'Die Signatur von {servicio} {version} stammt von einem Schlüssel, der nicht in den hinterlegten Schlüsseln der App steht: Es wurde nichts installiert.',
      'catalogo.firma_vencida':
        'Die Signatur von {servicio} {version} oder ihr Schlüssel ist abgelaufen: Es wurde nichts installiert. Aktualisieren Sie WolfCore Dev für aktuelle Schlüssel.',
      'catalogo.reloj_atrasado':
        'Die Signatur von {servicio} {version} trägt ein zukünftiges Datum: Prüfen Sie Datum und Uhrzeit Ihres Computers und versuchen Sie es erneut.',
      'acceso_bd.datos_invalidos': 'Die Datenbank-Zugangsdaten sind ungültig.',
      'acceso_bd.sin_base': 'Die .env dieses Projekts verweist auf keine Datenbank.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin öffnet nur MySQL- und MariaDB-Datenbanken; verwenden Sie Adminer für PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'Die Datenbank dieses Projekts liegt auf keinem lokalen Server von WolfCore Dev.',
      'acceso_bd.no_listo':
        'Das Werkzeug ist nicht bereit: Installieren Sie es unter Dienste und starten Sie PHP.',
      'auditoria.tabla_invalida': 'Die Tabelle existiert in dieser Datenbank nicht.',
      'auditoria.columna_invalida':
        'Die Spalte existiert in dieser Tabelle nicht (Benutzer- und Hash-Spalte müssen verschieden sein).',
      'auditoria.usuario_no_encontrado': 'Es gibt kein Konto mit diesem Benutzernamen.',
      'auditoria.usuario_repetido':
        'Es gibt mehrere Konten mit diesem Benutzernamen: Kein Zurücksetzen, um kein falsches Konto zu ändern.',
      'auditoria.formato_no_soportado':
        'Das aktuelle Hash-Format kann nicht reproduziert werden: Kein Zurücksetzen.',
      'auditoria.clave_larga':
        'bcrypt verwendet nur die ersten 72 Bytes des Passworts: Wählen Sie ein kürzeres.',
      'auditoria.clave_invalida': 'Das neue Passwort ist ungültig.',
      'auditoria.sin_confirmar': 'Bestätigen Sie, dass Sie dieses Passwort zurücksetzen möchten.',
      'auditoria.respaldo_previo_fallo':
        'Vor dem Zurücksetzen konnte keine Sicherung der Datenbank erstellt werden: Es wurde nichts geändert.',
      'auditoria.copia_fallo': 'Die Zeilenkopie konnte nicht gespeichert werden: Es wurde nichts geändert.',
      'auditoria.motor_no_soportado':
        'Die Passwortprüfung ist für MySQL, MariaDB und PostgreSQL gedacht.',
      'auditoria.cancelada': 'Prüfung abgebrochen.',
      'auditoria.usuario_invalido': 'Der Benutzername muss zwischen 1 und 256 Zeichen lang sein.',
      'auditoria.en_curso': 'Eine Prüfung läuft bereits: Warten Sie auf den Abschluss oder brechen Sie sie ab.',
      'auditoria.base_sistema': 'Eine Systemdatenbank wird nicht geprüft: Wählen Sie eine Projektdatenbank.',
      'auditoria.esquema_invalido': 'Das Schema existiert in dieser Datenbank nicht.',
      'auditoria.fila_cambio':
        'Das Konto wurde zwischenzeitlich geändert: Nicht zurückgesetzt. Versuchen Sie es erneut.',
      'auditoria.verificacion_fallo':
        'Die Datenbank hat das Passwort nicht wie erwartet gespeichert: Die Änderung wurde rückgängig gemacht.',
      'auditoria.columna_corta':
        'Die Hash-Spalte fasst {largo} Zeichen, der neue Hash benötigt jedoch {necesario}: Es wurde nichts geändert. Vergrößern Sie die Spalte.',
      'auditoria.datos_reales_sin_confirmar':
        'Diese Datenbank enthält echte Kundendaten: Das Zurücksetzen eines Passworts erfordert eine verstärkte Bestätigung.',
      'instantaneas.id_invalido': 'Der Schnappschuss ist ungültig.',
      'instantaneas.no_encontrada': 'Der Schnappschuss wurde nicht gefunden; möglicherweise wurde er gelöscht.',
      'instantaneas.otra_base': 'Dieser Schnappschuss gehört zu einer anderen Datenbank und kann hier nicht angewendet werden.',
      'instantaneas.sin_confirmar': 'Bestätigen Sie, dass Sie zu diesem Schnappschuss zurückkehren möchten.',
      'instantaneas.motor_no_soportado': 'Schnappschüsse sind für MySQL, MariaDB und PostgreSQL verfügbar.',
      'instantaneas.demasiado_grande':
        'Die Datenbank ist größer als {maximo} MB, das Maximum für einen Schnappschuss.',
      'instantaneas.sin_espacio':
        'Nicht genügend freier Speicherplatz für den Schnappschuss: {necesarios} MB erforderlich, {libres} MB frei.',
      'instantaneas.limite':
        'Es gibt bereits {maximo} Schnappschüsse dieser Datenbank: Löschen Sie einen, um einen neuen zu erstellen.',
      'instantaneas.tomar_fallo': 'Der Schnappschuss konnte nicht erstellt werden. Die Datenbank blieb unverändert.',
      'instantaneas.huella_no_coincide':
        'Die Schnappschussdatei wurde verändert oder ist beschädigt: Es wurde nichts wiederhergestellt.',
      'instantaneas.respaldo_previo_fallo':
        'Der aktuelle Stand der Datenbank konnte nicht gesichert werden: Es wurde nichts wiederhergestellt.',
      'instantaneas.restauracion_fallo':
        'Der Schnappschuss konnte nicht wiederhergestellt werden. Die Datenbank wurde auf den vorherigen Stand zurückgesetzt. Grund: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Der Schnappschuss konnte nicht wiederhergestellt werden und es gab keine vorherige Sicherung: Die Datenbank ist möglicherweise leer oder unvollständig. Grund: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Weder die Wiederherstellung noch das Zurücksetzen gelang. Der vorherige Stand liegt im automatischen Schnappschuss {respaldo}: Kehren Sie über Schnappschüsse dorthin zurück.',
    },
  },
  instantaneas: {
    abrir: 'Schnappschüsse',
    titulo: (base: string) => `Schnappschüsse von ${base}`,
    ayuda:
      'Ein Schnappschuss sichert die Datenbank im aktuellen Zustand. Sie können jederzeit zurückkehren: Zuvor wird automatisch ein Schnappschuss des aktuellen Stands erstellt.',
    ubicacion:
      'Sie werden im Datenordner von WolfCore Dev gespeichert und sind nur für Ihren Benutzer lesbar. Dienste und ihre Daten bleiben unberührt.',
    notaEtiqueta: 'Notiz (optional)',
    notaMarcador: 'Zum Beispiel: vor der Migration',
    tomar: 'Schnappschuss erstellen',
    tomada: 'Schnappschuss gespeichert',
    cargando: 'Schnappschüsse werden geladen…',
    vacio: 'Noch keine Schnappschüsse für diese Datenbank.',
    automatica: 'Automatisch',
    sinNota: 'Keine Notiz',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'Tabelle' : 'Tabellen'} · ${tamano}`,
    volver: 'Zu diesem Schnappschuss zurückkehren',
    borrar: 'Löschen',
    borrada: 'Schnappschuss in den Papierkorb verschoben',
    papelera:
      'Gelöschte Schnappschüsse können 7 Tage lang aus dem Papierkorb von WolfCore Dev wiederhergestellt werden.',
    cerrar: 'Schließen',
    papeleraTitulo: 'Papierkorb',
    papeleraVacia: 'Keine Schnappschüsse im Papierkorb.',
    recuperar: 'Wiederherstellen',
    recuperada: 'Schnappschuss wiederhergestellt',
    borradaEl: (fecha: string) => `Gelöscht am ${fecha}`,
    borrarPregunta: 'Diesen Schnappschuss in den Papierkorb verschieben?',
    borrarSi: 'In Papierkorb verschieben',
    notaAutomatica: (fecha: string) =>
      `Vorheriger Stand, gesichert vor Rückkehr zum Schnappschuss vom ${fecha}`,
    notaAutomaticaSinOrigen: 'Vorheriger Stand, gesichert vor Rückkehr zu einem anderen Schnappschuss',
    extensionesAviso: (lista: string) =>
      `Enthält PostgreSQL-Erweiterungen (${lista}), die nur mit dem Prüfsummenregister dieses Computers wiederhergestellt werden.`,
    limites:
      'Bei MySQL und MariaDB werden auch Routinen, Trigger und Events gesichert. Bei PostgreSQL handelt es sich um einen komprimierten Dump einer einzelnen Datenbank ohne Serverrollen oder -benutzer. Ein nicht diesem Computer zuordenbarer Schnappschuss wird mit einem eingeschränkten Benutzer wiederhergestellt, der keine fremden Views, Routinen oder Trigger zulässt.',
    basesBorradas: 'Schnappschüsse nicht mehr vorhandener Datenbanken',
    basesBorradasAyuda: 'Wählen Sie eine Datenbank, um sie aus ihrem Schnappschuss neu anzulegen.',
    dialogoVolver: {
      titulo: (base: string) => `Zu einem Schnappschuss von ${base} zurückkehren`,
      cargando: 'Vorschau wird vorbereitet…',
      base: 'Datenbank',
      instantanea: 'Schnappschuss',
      ahora: 'Jetzt',
      tamano: 'Größe',
      tablas: 'Tabellen',
      nota: 'Notiz',
      aviso: (base: string) =>
        `Die Datenbank ${base} wird vollständig durch diesen Schnappschuss ersetzt: Alle seither erfolgten Änderungen gehen verloren. Zuvor wird automatisch ein Schnappschuss des aktuellen Stands erstellt; bei einem Fehler kehrt die Datenbank automatisch dorthin zurück.`,
      pedir: (base: string) => `Geben Sie zur Bestätigung ${base} ein`,
      confirmar: 'Zu diesem Schnappschuss zurückkehren',
      trabajando: (base: string) => `${base} wird wiederhergestellt… Schließen Sie das Programm bis dahin nicht.`,
      hecho: (base: string) => `Die Datenbank ${base} wurde auf den Schnappschuss zurückgesetzt`,
      respaldoPrevio: 'Der vorherige Stand wurde gespeichert im automatischen Schnappschuss vom',
      advertencias: 'Die Wiederherstellung endete mit Hinweisen:',
      hechoConAvisos: (base: string) => `Die Datenbank ${base} wurde mit Hinweisen auf den Schnappschuss zurückgesetzt`,
      baseVacia: 'Die Datenbank existiert nicht oder ist leer: Nichts vor der Rückkehr zu sichern.',
      sinGuardarTitulo: 'Aktueller Stand konnte nicht gesichert werden',
      sinGuardarTexto:
        'WolfCore Dev konnte den aktuellen Stand der Datenbank vor der Rückkehr nicht sichern. Wenn Sie OHNE Sicherung fortfahren und die Wiederherstellung fehlschlägt, gehen die aktuellen Daten verloren.',
      sinGuardarConfirmar: 'Ich verstehe, dass die aktuellen Datenbankdaten verloren gehen',
      sinGuardarBoton: 'Ohne Sicherung des aktuellen Stands zurückkehren',
    },
  },
  avisoInicio: {
    titulo: 'Hinweis von WolfCore Dev',
  },
  tareas: {
    titulo: 'Geplante Aufgaben',
    resumen: (n: number) => (n === 0 ? 'Keine Aufgaben' : n === 1 ? '1 Aufgabe' : `${n} Aufgaben`),
    mostrar: 'Aufgaben anzeigen',
    ocultar: 'Ausblenden',
    cargando: 'Aufgaben werden geladen',
    errorCargar: 'Aufgaben konnten nicht geladen werden',
    soloAbierta:
      'Aufgaben laufen nur, solange WolfCore Dev geöffnet ist. Sie nutzen nicht die Windows-Aufgabenplanung: Bei geschlossener App oder im Ruhezustand laufen sie nicht und verpasste Läufe werden nicht nachgeholt.',
    repoEjecuta:
      'In einem vertrauenswürdigen Projekt wird der Inhalt des Repositories direkt ausgeführt: die genannte Datei, `artisan`, Skripte in `package.json`, `.venv`… Ändern sie sich durch `git pull`, führt die Aufgabe die neue Version aus.',
    vacio:
      'Dieses Projekt hat keine geplanten Aufgaben. Erstellen Sie eine (z. B. „php artisan schedule:run“ jede Minute bei Laravel).',
    nueva: 'Neue Aufgabe',
    pausada: 'pausiert',
    enCurso: 'Läuft…',
    nunca: 'Noch nicht ausgeführt',
    ultima: (f: string) => `Letzte: ${f}`,
    proxima: (f: string) => `nächste: ${f}`,
    codigo: (n: number) => `Code ${n}`,
    resultadoTitulo: (n: string) => `„${n}“`,
    origen: { usuario: 'hier erstellt', 'wolfcore.yml': 'aus wolfcore.yml' },
    describir: {
      cadaMinuto: 'Jede Minute',
      cadaN: (n: number) => `Alle ${n} Minuten`,
      cadaHora: 'Jede volle Stunde',
      diaria: (h: string) => `Täglich um ${h}`,
      laborables: (h: string) => `Montag bis Freitag um ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Erfolgreich',
      fallo: 'Fehlgeschlagen',
      tiempo: 'Zeitlimit überschritten',
      cancelada: 'Abgebrochen',
      omitida: 'Übersprungen',
      bloqueada: 'Nicht ausgeführt',
    },
    motivo: {
      aislado:
        'Dies ist ein Testdatenordner (WOLFCORE_DATOS): Aufgaben laufen erst, wenn Sie sie für diese Sitzung zulassen.',
      no_confiado:
        'Das Projekt ist nicht als vertrauenswürdig markiert: Aktivieren Sie „Ich vertraue diesem Repository“.',
      receta_cambio:
        'Das Projektrezept hat sich seit Ihrem Vertrauen geändert: Prüfen Sie es und markieren Sie „Ich vertraue diesem Repository“ erneut.',
      sin_confirmar: 'Der Befehl wurde noch nicht bestätigt: Er läuft erst nach Prüfung und Bestätigung.',
      comando_invalido: 'Der Befehl ist nicht zulässig (nur php, node, npm run und python).',
      cron_invalida: 'Der Zeitplan ist kein gültiger Cron-Ausdruck.',
      carpeta: 'Der Projektordner existiert nicht.',
      solapada: 'Der vorherige Lauf war noch aktiv: Dieser wurde übersprungen.',
      retraso: 'Zu spät (die Anwendung war angehalten): Wird nicht nachgeholt.',
      error: 'Das Programm konnte nicht gestartet werden.',
    },
    acciones: {
      ejecutar: 'Jetzt ausführen',
      editar: 'Bearbeiten',
      borrar: 'Löschen',
      verRegistro: 'Protokoll anzeigen',
      revisarConfirmar: 'Prüfen und bestätigen',
      activar: (n: string) => `Aufgabe ${n} aktivieren`,
    },
    borrar: {
      titulo: (n: string) => `„${n}“ löschen?`,
      texto:
        'Die Aufgabe und ihr Verlauf werden entfernt. Bereits Ausgeführtes wird nicht rückgängig gemacht und Projektdateien bleiben unberührt.',
      confirmar: 'Löschen',
      hecho: (n: string) => `Aufgabe „${n}“ gelöscht.`,
    },
    aislado: {
      titulo: 'Testdatenordner.',
      texto:
        'Mit WOLFCORE_DATOS läuft keine Aufgabe automatisch. Erlauben Sie sie nur, wenn Sie sie in dieser Sitzung testen möchten.',
      permitir: 'Für diese Sitzung erlauben',
      confirmarTitulo: 'Aufgaben in diesem Testordner erlauben?',
      confirmarTexto:
        'Aktive Aufgaben vertrauenswürdiger Projekte werden bis zum Schließen der Anwendung ausgeführt. Die Befehle stammen aus dem jeweiligen Projekt und laufen in dessen echtem Ordner.',
      permitido: 'Aufgaben für diese Sitzung erlaubt.',
    },
    yml: {
      titulo: 'Vorschläge aus wolfcore.yml',
      texto:
        'Die Projektdatei schlägt diese Aufgaben vor. Nichts läuft automatisch: Prüfen und bestätigen Sie den Befehl zur Übernahme.',
      estado: { nueva: 'Neu', adoptada: 'Übernommen', cambiada: 'Geändert' },
      revisar: 'Prüfen und übernehmen',
      cambiada:
        'Der Befehl in wolfcore.yml hat sich seit der Übernahme geändert. Die Projektaufgabe nutzt weiter den bestätigten Befehl; übernehmen Sie die neue Version, wenn Sie sie kennen.',
      guardarEn: 'In wolfcore.yml speichern',
      escribirTitulo: 'Aufgabe in wolfcore.yml schreiben?',
      escribirTexto:
        'Die Aufgabe wird in der Projektdatei ergänzt oder aktualisiert (der Rest bleibt unverändert), damit sie im Repository mitgeführt wird. Nach dem Klonen muss sie dort neu bestätigt werden.',
      escribir: 'Schreiben',
      escrita: 'Aufgabe in wolfcore.yml gespeichert.',
    },
    registro: {
      titulo: (n: string) => `Protokoll von „${n}“`,
      historial: 'Letzte Ausführungen',
      sinHistorial: 'Noch keine Ausführungen.',
      salida: 'Ausgabe der letzten Ausführung',
      sinSalida: 'Keine Ausgabe gespeichert.',
      enmascarado:
        'Protokolle verbergen Passwörter und Schlüssel, haben eine Maximalgröße und rotieren automatisch.',
      origen: { programada: 'geplant', manual: 'manuell' },
    },
    dialogo: {
      tituloNueva: 'Neue geplante Aufgabe',
      tituloEditar: 'Geplante Aufgabe bearbeiten',
      tituloAdoptar: 'Aufgabe aus wolfcore.yml übernehmen',
      tituloConfirmar: 'Befehl der Aufgabe bestätigen',
      nombre: 'Name',
      nombrePlaceholder: 'Laravel-Aufgaben',
      horario: 'Zeitplan',
      preset: {
        cadaMinuto: 'Jede Minute',
        cadaN: 'Alle paar Minuten',
        cadaHora: 'Stündlich',
        diaria: 'Täglich zu einer Uhrzeit',
        laborables: 'Montag bis Freitag zu einer Uhrzeit',
        personalizada: 'Eigener Cron-Ausdruck',
      },
      cadaNOpcion: (n: number) => `Alle ${n} Minuten`,
      hora: 'Uhrzeit',
      horaPlaceholder: '03:00',
      horaInvalida: 'Geben Sie eine gültige Uhrzeit ein, z. B. 03:00.',
      expresion: 'Cron-Ausdruck',
      cronEquivale: 'Cron-Ausdruck:',
      expresionAyuda:
        '5 Felder: Minute, Stunde, Tag des Monats, Monat und Wochentag (* , - /). Maximal einmal pro Minute.',
      proximas: 'Nächste Ausführungen:',
      comando: 'Befehl',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Nur php, node, npm run und python mit einer Projektdatei. Läuft im Projektordner ohne Shell und ohne Inline-Code (-r, -e, -c).',
      comandoFijo:
        'Dieser Befehl enthält Argumente mit Anführungszeichen, die nicht als Text bearbeitet werden können: Er bleibt unverändert (löschen und neu erstellen zum Ändern).',
      argumentos: 'Wird mit diesen Argumenten ausgeführt:',
      comillasSinCerrar: 'Ein Anführungszeichen wurde nicht geschlossen.',
      tiempo: 'Zeitlimit',
      minutos: 'Minuten',
      tiempoAyuda: 'Bei Überschreitung wird nur dieser Prozess samt Kindprozessen gestoppt.',
      activa: 'Aktiv (läuft automatisch, solange die App geöffnet ist)',
      advertencia:
        'Mit der Bestätigung erlauben Sie genau diesen Befehl: Er läuft automatisch im Projektordner gemäß Zeitplan. Bei Änderungen ist eine neue Bestätigung nötig.',
      revise: 'Ich habe diesen Befehl geprüft und erkenne ihn an.',
      guardar: 'Speichern und Befehl bestätigen',
      adoptar: 'Bestätigen und übernehmen',
      confirmar: 'Befehl bestätigen',
      guardada: 'Aufgabe gespeichert.',
      adoptada: 'Aufgabe übernommen.',
      confirmada: 'Befehl bestätigt.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Benannte Gruppen aus Datenbanken, Diensten und Prozessen, die gemeinsam gestartet und gestoppt werden.',
    nuevo: 'Neuer Workspace',
    vacio:
      'Noch keine Workspaces vorhanden. Erstellen Sie einen, z. B. „Bot FastAPI“ mit PostgreSQL, Redis, Ollama und Ihrem Projektprozess.',
    elementos: (n: number) => (n === 1 ? '1 Element' : `${n} Elemente`),
    sinElementos: 'Keine Elemente',
    estado: { apagado: 'Aus', parcial: 'Teilweise', encendido: 'Ein' },
    acciones: {
      iniciar: 'Starten',
      detener: 'Stoppen',
      editar: 'Bearbeiten',
      borrar: 'Löschen',
      cerrar: 'Schließen',
    },
    borrar: {
      titulo: (n: string) => `„${n}“ löschen?`,
      texto:
        'Das Löschen des Workspaces stoppt oder löscht nichts: Es entfernt nur die Gruppe. Laufende Dienste bleiben aktiv.',
      confirmar: 'Löschen',
      hecho: (n: string) => `Workspace „${n}“ gelöscht.`,
    },
    dialogo: {
      tituloNuevo: 'Neuer Workspace',
      tituloEditar: 'Workspace bearbeiten',
      nombre: 'Name',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Geben Sie einen Namen ein.',
      aviso:
        'Ein Workspace speichert nur, was gestartet werden soll. Er öffnet keine Tunnel, gibt nichts im lokalen Netzwerk frei und startet keine Prozesse nicht vertrauenswürdiger Projekte.',
      secciones: {
        instancias: 'Datenbanken',
        servicios: 'Dienste',
        procesos: 'Projektprozesse',
      },
      sinOpciones: 'Hier gibt es nichts auszuwählen.',
      captadorUnico: 'Nur ein Mail-Catcher gleichzeitig: Die Auswahl eines anderen ersetzt den bisherigen.',
      yaNoExisten: (lista: string) => `Existieren nicht mehr und werden beim Speichern entfernt: ${lista}`,
      guardar: 'Speichern',
      guardado: (n: string) => `Workspace „${n}“ gespeichert.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `„${n}“: Ergebnis beim Starten`,
      tituloDetener: (n: string) => `„${n}“: Ergebnis beim Stoppen`,
      encendido: 'Gestartet',
      apagado: 'Gestoppt',
      yaEncendido: 'Lief bereits',
      yaApagado: 'War bereits gestoppt',
      noExiste: 'Existiert nicht mehr: übersprungen',
      compartido: 'Bleibt aktiv: wird von einem anderen aktiven Workspace verwendet',
      reemplaza: (otro: string) => `Gestartet; ${otro} aus derselben Mail-Gruppe wurde gestoppt`,
      fallo: 'Konnte nicht gestartet werden',
      falloApagar: 'Läuft weiter',
      ok: (n: string) => `„${n}“ bereit.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `„${n}“: ${encendidos} von ${total} gestartet. Prüfen Sie, was nicht gestartet ist.`,
      parcialApagar: (n: string, siguen: number) =>
        `„${n}“: ${siguen} laufen noch. Prüfen Sie, was nicht gestoppt wurde.`,
    },
  },
  inicio: {
    titulo: 'Start',
    bienvenida: 'Ihre Entwicklungsumgebung auf einen Blick.',
    tiles: {
      servicios: 'Laufende Dienste',
      serviciosDe: (total: number) => `von ${total}`,
      sitios: 'Projekte',
      tuneles: 'Aktive Tunnel',
      hosts: 'Ausstehende Hosts',
      hostsOk: 'Alles in Ordnung',
      hostsFaltan: 'Erfordert Aufmerksamkeit',
    },
    hosts: {
      titulo: 'Es gibt nicht eingetragene Domains in der hosts-Datei',
      texto:
        'Diese Domains zeigen noch nicht auf diesen Computer. Zum Korrigieren fragt Windows nach Administratorrechten.',
      corregir: 'Ausstehende Hosts anwenden',
      reintentarPermiso: 'Mit Berechtigung wiederholen',
      corregido: 'hosts-Datei aktualisiert',
      fallo: 'Die hosts-Datei konnte nicht aktualisiert werden',
      verInstrucciones: 'Anleitung anzeigen',
      duplicados:
        'Diese Domains stehen bereits außerhalb des WolfCore Dev-Blocks in hosts (bleiben erhalten):',
      motivos: {
        cancelado: 'Administratorberechtigung abgebrochen. Die hosts-Datei blieb unverändert.',
        tiempo:
          'Die Administratorabfrage wurde nicht rechtzeitig beantwortet. Die Website wurde gespeichert, hosts blieb unverändert. Falls die Windows-Abfrage noch offen ist, brechen Sie sie ab und wenden Sie die Einträge später gesammelt an.',
        denegado:
          'Windows hat das Schreiben der hosts-Datei verweigert. Möglicherweise blockiert ein Antivirenprogramm den Zugriff.',
      } as Record<string, string>,
      modalTitulo: 'hosts manuell korrigieren',
      modalTexto:
        'Öffnen Sie PowerShell als Administrator (Rechtsklick auf Start → Terminal (Administrator)), fügen Sie diesen Befehl ein und drücken Sie Enter.',
    },
    servicios: {
      titulo: 'Dienste',
      ver: 'Dienste anzeigen',
      vacio: 'Noch keine Dienste installiert.',
    },
    tuneles: {
      titulo: 'Aktive Tunnel',
      vacio: 'Keine offenen Tunnel. Sie können einen unter Projekte öffnen.',
      sitioDesconocido: 'Unbenannte Website',
    },
  },
  servicios: {
    titulo: 'Dienste',
    descripcion:
      'Starten und stoppen Sie Webserver, PHP, Datenbanken und Werkzeuge. Der Status aktualisiert sich automatisch.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Datenbanken',
      correo: 'E-Mail',
      ia: 'KI',
      herramientas: 'Werkzeuge',
    },
    gruposAyuda: {
      web: 'Server, der .test-Domains ausliefert.',
      php: 'Eine Installation pro Version (8.3, 8.4…); jede Website nutzt ihre eigene.',
      bd: 'Lauschen nur auf 127.0.0.1.',
      correo: 'Fängt E-Mails Ihrer Projekte ab, ohne dass sie ins Internet gelangen.',
      ia: 'Sprachmodelle lokal auf Ihrem Computer.',
      herramientas: 'Hilfsmittel für den Alltag.',
    },
    puerto: 'Port',
    cambiarPuerto: 'Port ändern',
    cambiarPuertoDe: (nombre: string) => `Port von ${nombre} ändern`,
    versionesDe: (nombre: string) => `Versionen von ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} Instanzen, ${encendidas} aktiv`,
    usarPuerto: (p: number) => `Port ${p} verwenden`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} verwendet jetzt Port ${p}`,
    conflicto: 'Port belegt',
    autoIniciar: 'Beim Start von WolfCore Dev starten',
    autoIniciarActivado: (nombre: string) => `${nombre} startet beim Öffnen von WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} startet nicht mehr automatisch mit WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Port von ${nombre}`,
      etiqueta: 'Neuer Port',
      ayuda:
        'Zwischen 1024 und 65535 und frei. Ein laufender Dienst wird neu gestartet. Aktualisieren Sie die .env Ihrer Projekte.',
      rango: 'Verwenden Sie eine Zahl zwischen 1024 und 65535',
      igual: 'Dies ist bereits der aktuelle Port',
      guardar: 'Port ändern',
    },
    borrarDatos: {
      opcion: 'Daten löschen',
      titulo: (nombre: string) => `Daten von ${nombre} löschen`,
      copias: (n: number, tam: string) =>
        `Es werden außerdem ${n === 1 ? 'eine Sicherung' : `${n} Sicherungen`} aus Aktualisierungen (${tam}) gelöscht. Kopieren Sie diese bei Bedarf vorab aus dem Datenordner.`,
      /** Qué se pierde, según el servicio. */
      que: {
        mysql: 'alle Datenbanken und Benutzer von MySQL',
        mariadb: 'alle Datenbanken und Benutzer von MariaDB',
        postgresql: 'alle Datenbanken und Benutzer von PostgreSQL',
        redis: 'alle Schlüssel und gespeicherten Daten in Redis',
        mongodb: 'alle Datenbanken, Sammlungen und Daten von MongoDB',
        mailpit: 'alle von Mailpit abgefangenen E-Mails',
        smtp4dev: 'alle von smtp4dev abgefangenen E-Mails',
        inbucket: 'alle von Inbucket abgefangenen E-Mails',
        papercut: 'alle von Papercut SMTP abgefangenen E-Mails',
        ollama: 'alle heruntergeladenen Ollama-Modelle',
      } as Record<string, string>,
      texto: (que: string) =>
        `Es wird Folgendes gelöscht: ${que}. Dies kann nicht rückgängig gemacht werden. Das Programm bleibt installiert.`,
      generico: (nombre: string) => `alle Daten von ${nombre}`,
      pedir: (id: string) => `Geben Sie zur Bestätigung ${id} ein`,
      boton: 'Daten löschen',
      hecho: (nombre: string) => `Daten von ${nombre} gelöscht`,
    },
    ftp: {
      interruptor: 'FTP-Server',
      redLocal: 'Verbindungen aus dem lokalen Netzwerk zulassen',
      redLocalAyuda:
        'Ist diese Option deaktiviert, kann sich nur dieser Computer verbinden (127.0.0.1). Jede Website aktiviert ihren Zugriff unter Websites.',
      avisoTitulo: 'FTP für das lokale Netzwerk öffnen',
      avisoTexto:
        'FTP überträgt Benutzernamen, Passwörter und Dateien unverschlüsselt. Jedes Gerät in Ihrem Netzwerk kann versuchen, eine Verbindung herzustellen. Verwenden Sie diese Option nur in einem vertrauenswürdigen Netzwerk.',
      avisoConfirmar: 'Zulassen',
      redLocalActivada: 'FTP akzeptiert Verbindungen aus dem lokalen Netzwerk',
      redLocalDesactivada: 'FTP akzeptiert nur Verbindungen von diesem Computer',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Abhängigkeitsmanager für PHP',
      instalado: 'Installiert',
      noInstalado: 'Nicht installiert',
      sinVersion: 'nicht installiert',
      uso: 'Verwendung',
      usoTexto: 'composer',
      ayuda: 'Verwenden Sie „Terminal“ in einem Projekt oder fügen Sie WolfCore Dev in den Einstellungen zum PATH hinzu.',
      instaladoOk: 'Composer installiert',
      sinPhp: 'Installieren Sie zuerst PHP',
      actualizado: (v: string) => `Composer aktualisiert: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Web-Administrator für Datenbanken',
      direccion: 'Adresse',
      disponible: 'Bereit',
      noInstalado: 'Nicht installiert',
      sinPhp: 'PHP fehlt',
      abrir: 'Adminer öffnen',
      instaladoOk: 'Adminer installiert',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Web-Administrator für MySQL und MariaDB',
      direccion: 'Adresse',
      disponible: 'Bereit',
      noInstalado: 'Nicht installiert',
      sinPhp: 'PHP fehlt',
      abrirDesdeProyecto: 'Wird direkt über die jeweilige Projektkarte bereits angemeldet geöffnet.',
      faltaExtension: (ext: string, rama: string) =>
        `In PHP ${rama} ist die Erweiterung ${ext} nicht aktiviert. Starten Sie PHP neu oder aktivieren Sie sie in Ihrer php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin gibt Unterstützung bis PHP 8.3 an, aktuell wird jedoch PHP ${rama} verwendet: Es können Fehler auftreten. Starten Sie bei Problemen eine PHP-Version zwischen 7.2 und 8.3.`,
      instalarPrimero: 'Installieren Sie phpMyAdmin, um es zu verwenden.',
      encenderPhp: 'Starten Sie PHP, um phpMyAdmin zu verwenden.',
      instaladoOk: 'phpMyAdmin installiert',
    },
    puertos: 'Ports',
    pid: 'PID',
    sinVersion: 'ohne Version',
    sinPuertos: '—',
    terminado: 'Ohne Fehler beendet',
    externo: 'Außerhalb von WolfCore Dev verwaltet',
    verDetalle: 'Fehlerdetails anzeigen',
    vacioTitulo: 'Noch keine Dienste vorhanden',
    vacio:
      'Es sind noch keine Dienste installiert. Beginnen Sie mit Nginx und PHP für Ihre Websites oder mit einer Datenbank.',
    irAInstalar: 'Zur Installation',
  },
  bd: {
    descripcion:
      'Erstellen, sichern und stellen Sie die Datenbanken Ihrer Projekte wieder her. Die Server lauschen ausschließlich auf 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Neue Datenbank',
    restaurar: 'Sicherung wiederherstellen',
    importar: 'Von anderem Server importieren',
    soloSql: 'Verfügbar für MySQL, MariaDB und PostgreSQL',
    enCursoAyuda: 'Warten Sie, bis der laufende Vorgang abgeschlossen ist',
    encenderPrimero: (motor: string) => `Starten Sie zuerst ${motor}`,
    cargando: 'Datenbanken werden geladen…',
    recargar: 'Liste neu laden',
    vacioTitulo: 'Kein Datenbankserver installiert',
    vacio:
      'Installieren Sie MySQL, MariaDB, PostgreSQL oder MongoDB unter Dienste, um Ihre Datenbanken zu verwalten.',
    irAServicios: 'Zu Dienste',
    apagado: {
      titulo: (motor: string) => `${motor} ist gestoppt`,
      texto: (motor: string) => `Starten Sie ${motor}, um Ihre Datenbanken anzuzeigen und zu verwalten.`,
      iniciando: (motor: string) => `${motor} wird gestartet…`,
      error: (motor: string) => `${motor} konnte nicht gestartet werden`,
      encender: (motor: string) => `${motor} starten`,
      verServicios: 'Unter Dienste anzeigen',
    },
    errorLista: 'Die Datenbankliste konnte nicht gelesen werden',
    sinBases: 'Dieser Server hat noch keine eigenen Datenbanken.',
    total: (n: number) => plural(n, 'Datenbank', 'Datenbanken'),
    columnas: { nombre: 'Datenbank', tamano: 'Größe', acciones: 'Aktionen' },
    acciones: {
      respaldar: 'Sichern',
      restaurarAqui: 'Hier wiederherstellen',
      adminer: 'In Adminer öffnen',
      conexion: 'Verbindungsdaten',
      vector: 'Vector aktivieren',
      borrar: 'Löschen',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Installieren Sie Adminer und PHP unter Dienste, um es zu öffnen',
    vectorSinInstalar: 'Installieren Sie pgvector weiter unten, um es in einer Datenbank zu aktivieren',
    vectorActivado: (base: string) => `Vector in ${base} aktiviert`,
    formatos: {
      sql: 'Einfaches SQL',
      pgdump: 'PostgreSQL-Sicherung (pg_dump, benutzerdefiniertes Format)',
      gz: 'Komprimiertes SQL (.gz)',
      zip: '.zip-Archiv (wird vor der Wiederherstellung entpackt)',
      rar: '.rar-Archiv (Entpacken über Windows wird versucht)',
      '7z': '.7z-Archiv (Entpacken über Windows wird versucht)',
      desconocido: 'Format nicht erkannt',
    } as Record<string, string>,
    formatoDesconocido:
      'Das Format wurde nicht erkannt. Handelt es sich um ein komprimiertes Archiv, entpacken Sie es und wählen Sie die enthaltene .sql- oder .dump-Datei aus.',
    formatoIncompatible:
      'Diese Datei ist eine PostgreSQL-Sicherung: Stellen Sie sie im Tab PostgreSQL wieder her.',
    nombre: {
      etiqueta: 'Datenbankname',
      vacio: 'Geben Sie einen Namen ein',
      largo: 'Der Name ist zu lang',
      caracteres: {
        mysql: 'Verwenden Sie nur Buchstaben, Ziffern und Unterstriche',
        mariadb: 'Verwenden Sie nur Buchstaben, Ziffern und Unterstriche',
        postgresql: 'Verwenden Sie Kleinbuchstaben, Ziffern und Unterstriche',
        mongodb: 'Verwenden Sie nur Buchstaben, Ziffern, Bindestriche und Unterstriche',
      } as Record<string, string>,
      inicio: 'In PostgreSQL darf der Name nicht mit einer Ziffer beginnen',
    },
    reemplazo: {
      titulo: (base: string) => `Die Datenbank ${base} enthält bereits Tabellen`,
      texto: (base: string) =>
        `Wenn Sie fortfahren, wird die aktuelle Datenbank ${base} vollständig ERSETZT. Zuerst wird automatisch eine Sicherung erstellt; anschließend wird die Datenbank gelöscht und mit dem neuen Inhalt neu angelegt.`,
      donde: 'Die Sicherung wird gespeichert unter',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'Wenn Sie sie nicht ersetzen möchten, gehen Sie zurück und wählen Sie einen anderen Namen: Es wird eine neue Datenbank erstellt.',
      pedir: (base: string) => `Geben Sie zur Bestätigung ${base} ein`,
      volver: 'Zurück',
      confirmar: 'Datenbank ersetzen',
    },
    resultado: {
      restaurada: (base: string) => `Datenbank ${base} wiederhergestellt`,
      importada: (base: string) => `Datenbank ${base} importiert`,
      respaldada: (base: string) => `Sicherung von ${base} gespeichert`,
      archivo: 'Datei',
      respaldoPrevio: 'Sicherung der vorherigen Datenbank',
      advertencias: (n: number) => plural(n, 'Warnung', 'Warnungen'),
      advertenciasAyuda:
        'Der Vorgang wurde abgeschlossen. Prüfen Sie diese Hinweise; normalerweise handelt es sich um Rollen oder Berechtigungen, die auf diesem Computer nicht existieren.',
      fallo: {
        restaurar: 'Wiederherstellung fehlgeschlagen',
        importar: 'Import fehlgeschlagen',
        respaldar: 'Sicherung fehlgeschlagen',
      } as Record<string, string>,
      trasReemplazo: 'Die ursprüngliche Datenbank wurde ersetzt und die Wiederherstellung nicht abgeschlossen',
      trasReemplazoAyuda:
        'Ihre vorherigen Daten befinden sich in der angegebenen Sicherung. Sie können sie über „Sicherung wiederherstellen“ zurückspielen.',
    },
    progreso: {
      titulo: 'Protokoll',
      corriendo: {
        restaurar: (base: string) => `${base} wird wiederhergestellt…`,
        importar: (base: string) => `${base} wird importiert…`,
        respaldar: (base: string) => `${base} wird gesichert…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Warte auf Ausgabe des Werkzeugs…',
      limitado: (n: number) => `Es werden die letzten ${n} Zeilen angezeigt.`,
      noCierre:
        'Schließen Sie das Programm erst, wenn der Vorgang abgeschlossen ist. Sie können diese Ansicht verlassen und zurückkehren: Das Ergebnis wird hier angezeigt.',
      otraEnCurso: 'Es läuft bereits ein Vorgang; warten Sie, bis er abgeschlossen ist.',
      ver: 'Details anzeigen',
      descartar: 'Verwerfen',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Sicherung in ${motor} wiederherstellen`,
      confianza:
        'Stellen Sie nur vertrauenswürdige Sicherungen wieder her: Eine Sicherung kann Aktionen auf dem Server ausführen.',
      archivo: 'Sicherungsdatei',
      elegir: 'Datei wählen…',
      cambiar: 'Ändern',
      sinArchivo: 'Keine Datei ausgewählt',
      formato: 'Erkanntes Format',
      detectando: 'Format wird erkannt…',
      destino: 'Zieldatenbank',
      destinoAyuda:
        'Existiert sie nicht, wird sie erstellt. Existiert sie und ist leer, wird sie verwendet. Enthält sie Tabellen, werden Sie um Bestätigung gebeten.',
      restaurar: 'Wiederherstellen',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Von anderem Server in ${motor} importieren`,
      soloLectura:
        'Der Quellserver wird nur gelesen: Ihre Datenbank wird auf diesen Computer kopiert und die Quelle bleibt unverändert.',
      detectado: (puerto: number) =>
        `Ein weiterer Server wurde auf Port ${puerto} erkannt (zum Beispiel von FlyEnv).`,
      origen: 'Quellserver',
      host: 'Server',
      puerto: 'Port',
      usuario: 'Benutzer',
      clave: 'Passwort',
      claveAyuda: 'Wird nur für diese Kopie verwendet und nicht gespeichert.',
      baseOrigen: 'Quelldatenbank',
      destino: 'Zieldatenbank auf diesem Computer',
      destinoAyuda:
        'Existiert sie nicht, wird sie erstellt. Enthält sie Tabellen, werden Sie vor dem Ersetzen um Bestätigung gebeten.',
      faltaHost: 'Geben Sie den Server ein',
      faltaPuerto: 'Verwenden Sie einen Port zwischen 1 und 65535',
      faltaUsuario: 'Geben Sie den Benutzer ein',
      faltaBase: 'Geben Sie die Quelldatenbank ein',
      importar: 'Importieren',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Neue Datenbank in ${motor}`,
      codificacion: 'Zeichenkodierung',
      codificacionValor: {
        mysql: 'utf8mb4 (unterstützt Emojis und alle Sonderzeichen)',
        mariadb: 'utf8mb4 (unterstützt Emojis und alle Sonderzeichen)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Eigenen Benutzer für diese Datenbank erstellen',
      usuarioPropioAyuda:
        'Optional. Andernfalls verwenden Ihre Projekte den Administratorbenutzer des Servers.',
      usuario: 'Benutzer',
      clave: 'Passwort',
      faltaClave: 'Geben Sie ein Passwort ein',
      crear: 'Datenbank erstellen',
      creada: (base: string) => `Datenbank ${base} erstellt`,
      mongo: 'In MongoDB wird die Datenbank mit einer initialen Collection (_pel_init) erstellt.',
      cambiarClave: 'Passwort ändern',
      cambiarClaveTitulo: (u: string) => `Der Benutzer ${u} existiert bereits mit einem anderen Passwort`,
      cambiarClaveTexto: (u: string) =>
        `Wenn Sie das Passwort von ${u} ändern, können Projekte, die es bereits verwenden, keine Verbindung mehr herstellen, bis Sie deren .env aktualisieren. Üblicherweise sollte das aktuelle Passwort beibehalten werden. Trotzdem ändern?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Datenbank ${base} löschen?`,
      texto: (base: string, motor: string) =>
        `Die Datenbank ${base} in ${motor} und alle darin enthaltenen Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden. Sichern Sie sie vorher, falls Sie sie noch benötigen.`,
      pedir: (base: string) => `Geben Sie zur Bestätigung ${base} ein`,
      boton: 'Datenbank löschen',
      hecho: (base: string) => `Datenbank ${base} gelöscht`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `${base} sichern`,
      destino: 'Wird gespeichert unter',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (Standardordner)',
      porDefectoEn: (carpeta: string) => `${carpeta} (Standardordner)`,
      cambiar: 'Anderen Ordner wählen…',
      porDefectoVolver: 'Standardordner verwenden',
      formato: {
        mysql: '.sql-Datei (mysqldump mit Routinen und Triggern)',
        mariadb: '.sql-Datei (mysqldump mit Routinen und Triggern)',
        postgresql: '.dump-Datei (pg_dump, benutzerdefiniertes Format)',
      } as Record<string, string>,
      boton: 'Sichern',
    },
    dialogoConexion: {
      sitio: 'Projekt',
      sitioAyuda:
        'Die .env-Datei der Website wird gelesen, um bereits vorhandene Variablennamen zu verwenden (zum Beispiel CodeIgniter 4). Ihr Inhalt wird weder angezeigt noch kopiert.',
      generico: 'Allgemein (Laravel-Format)',
      titulo: (base: string) => `Verbindung zu ${base}`,
      host: 'Server',
      puerto: 'Port',
      usuario: 'Benutzer',
      clave: 'Passwort',
      base: 'Datenbank',
      sinClave: 'Kein Passwort (lauscht nur auf 127.0.0.1)',
      mostrar: 'Passwort anzeigen',
      ocultar: 'Passwort verbergen',
      copiarDato: (dato: string) => `${dato} kopieren`,
      env: 'Block für die .env-Datei',
      envAyuda: 'Fügen Sie diesen in die .env-Datei Ihres Projekts ein. WolfCore Dev schreibt nicht in Ihre Projekte.',
      copiarEnv: 'Block kopieren',
      cargando: 'Verbindungsdaten werden gelesen…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Es läuft bereits eine Installation von pgvector.',
      descripcion:
        'Ähnlichkeitssuche (Embeddings) direkt in PostgreSQL. Wird aus dem offiziellen Quellcode kompiliert.',
      instalado: (v: string | null) => (v ? `Installiert (Version ${v})` : 'Installiert'),
      noInstalado: 'Nicht installiert',
      herramientas: 'Build-Werkzeuge',
      herramientasSi: 'Bereit',
      herramientasNo: 'Fehlen',
      instalar: 'pgvector installieren',
      reinstalar: 'Erneut kompilieren',
      instalarHerramientas: 'Build-Werkzeuge installieren',
      dialogoHerramientasTitulo: 'Build-Werkzeuge installieren',
      dialogoHerramientas:
        'Zum Kompilieren von pgvector werden die Visual Studio Build Tools benötigt. Es werden ca. 6 GB heruntergeladen und Windows fordert Administratorrechte an. Dies kann einige Zeit dauern; lassen Sie WolfCore Dev geöffnet.',
      dialogoCompilarTitulo: 'pgvector kompilieren und installieren',
      dialogoCompilar:
        'Der offizielle Quellcode von pgvector wird heruntergeladen, kompiliert und in Ihrem PostgreSQL installiert. PostgreSQL wird beim Kopieren der Erweiterung für einige Sekunden angehalten und anschließend neu gestartet.',
      continuar: 'Fortfahren',
      instalando: 'Build-Werkzeuge werden installiert…',
      compilando: 'pgvector wird kompiliert…',
      herramientasOk: 'Build-Werkzeuge installiert',
      instaladoOk: (v: string) => `pgvector ${v} installiert`,
      sinWinget:
        'Auf diesem Computer ist winget nicht verfügbar. Installieren Sie „Build Tools für Visual Studio 2022“ von visualstudio.microsoft.com mit der Workload „Desktopentwicklung mit C++“ und versuchen Sie es erneut.',
      falloHerramientas: 'Die Build-Werkzeuge konnten nicht installiert werden',
      activarAyuda: 'Verwenden Sie anschließend „Vector aktivieren“ bei jeder Datenbank, die es benötigt.',
      errorEstado: 'Der Status von pgvector konnte nicht gelesen werden',
    },
  },
  instalar: {
    titulo: 'Installieren',
    descripcion:
      'Laden Sie offizielle Versionen herunter. Jede Datei wird vor der Verwendung anhand ihres SHA-256-Prüfwerts verifiziert.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Webserver (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Öffentliche Tunnel (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Datenbank, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Datenbank, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Datenbank (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'In-Memory-Cache und Warteschlangen (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Dokumentendatenbank (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB-Konsole (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Test-E-Mail-Server (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Test-E-Mail-Server (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Test-E-Mail-Server (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Test-E-Mail-Server (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Lokale KI (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'PHP-Abhängigkeiten (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Web-Administrator für Datenbanken' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Web-Administrator für MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web und PHP',
      bd: 'Datenbanken',
      otros: 'E-Mail, KI und Tunnel',
    },
    instalados: 'Installiert',
    ninguno: 'Keine Version installiert',
    elegir: 'Version wählen',
    buscando: 'Suche nach Versionen…',
    sinVersiones: 'Keine Versionen gefunden',
    rama: (rama: string) => rama,
    yaInstalada: 'bereits installiert',
    fases: {
      descargando: 'Wird heruntergeladen',
      verificando: 'SHA-256 wird geprüft',
      extrayendo: 'Wird entpackt',
      compilando: 'Wird kompiliert',
      listo: 'Installiert',
      error: 'Installation fehlgeschlagen',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} installiert`,
  },
  sitios: {
    titulo: 'Websites',
    descripcion: 'Jede Website ist ein Ordner, den Nginx unter einer eigenen .test-Domain bereitstellt.',
    nuevo: 'Neue Website',
    buscar: 'Nach Name oder Domain suchen',
    sinResultados: (q: string) => `Keine Website entspricht „${q}“.`,
    vacioTitulo: 'Noch keine Websites vorhanden',
    vacio:
      'Wählen Sie einen Projektordner aus und WolfCore Dev erkennt automatisch, ob es sich um Laravel, CodeIgniter oder eine statische Website handelt.',
    agregar: 'Website hinzufügen',
    total: (n: number) => plural(n, 'Website', 'Websites'),
    abrirSitio: (dominio: string) => `${dominio} im Browser öffnen`,
    carpeta: 'Ordner',
    abrirCarpeta: 'Projektordner öffnen',
    alias: (n: number) => `+${plural(n, 'Alias', 'Aliase')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statisch',
      proxy: 'Proxy (lokaler Port)',
      personalizado: 'Benutzerdefiniert',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (lokaler Port)',
      node: 'Node / Vite (lokaler Port)',
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
    datosReales: 'Echtdaten',
    datosRealesAyuda: 'Enthält echte Kundendaten: Seien Sie bei der Veröffentlichung vorsichtig.',
    faltaHosts: 'Fehlt in hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} verweist noch nicht auf diesen Computer. Korrigieren Sie die hosts-Datei über den Hinweis oben.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Fehlt in hosts',
      iniciando: 'Nginx wird gestartet…',
      errorNginx: 'Nginx-Fehler',
      nginxExterno: 'Externes Nginx',
      nginxApagado: 'Nginx gestoppt',
    },
    borrar: {
      titulo: (nombre: string) => `Website ${nombre} löschen?`,
      texto: 'Der Projektordner bleibt unberührt.',
      hecho: (nombre: string) => `Website ${nombre} gelöscht`,
      nginxFallo: 'Die Website wurde gelöscht, aber Nginx hat die neue Konfiguration abgelehnt',
    },
  },
  formSitio: {
    tituloNuevo: 'Neue Website',
    tituloEditar: 'Website bearbeiten',
    tituloDuplicar: 'Website duplizieren',
    paso: 'Beginnen Sie mit dem Projektordner',
    pasoAyuda:
      'Projekttyp, PHP-Version und eine vorgeschlagene Domain werden automatisch erkannt. Sie können anschließend alles anpassen.',
    elegirCarpeta: 'Ordner wählen',
    cambiarCarpeta: 'Ändern',
    detectando: 'Projekt wird analysiert…',
    detectado: (tipo: string) => `Erkannt: ${tipo}`,
    sinDeteccionAlEditar: 'Die automatische Erkennung erfolgt nur beim Erstellen; prüfen Sie Typ und PHP-Version.',
    nombre: 'Name',
    nombreAyuda: 'Nur zur Erkennung in der Liste.',
    nombreCopia: (nombre: string) => `${nombre} (Kopie)`,
    duplicarProxy:
      'Die Kopie verweist auf denselben lokalen Port wie das Original und übernimmt dessen Prozesse nicht: Ändern Sie den Port oder fügen Sie einen eigenen Prozess hinzu.',
    dominio: 'Domain',
    dominioPlaceholder: 'mein-projekt',
    alias: 'Aliase',
    aliasAyuda: 'Weitere .test-Domains, die dieselbe Website öffnen. Eingeben und Enter drücken.',
    aliasAgregar: 'Alias hinzufügen',
    carpeta: 'Projektordner',
    raizLaravel: 'Nginx stellt den Unterordner public/ bereit.',
    tipo: 'Projekttyp',
    php: 'PHP-Version',
    phpElegir: 'Version wählen',
    phpNinguno: 'Es ist keine PHP-Version installiert.',
    phpInstalar: 'PHP installieren',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Das Projekt verlangt PHP ${pedida}, das nicht installiert ist. Es wurde PHP ${elegida} ausgewählt.`,
    puertoProxy: 'Lokaler Port',
    puertoProxyAyuda:
      'Nginx leitet Anfragen an http://127.0.0.1:<Port> weiter (zum Beispiel Vite oder Node).',
    urlBaseVar: 'Variable für Basis-URL',
    urlBaseVarAyuda:
      'Beim Öffnen eines Tunnels wird der öffentliche Link in diese Variable der .env eingetragen und beim Schließen wiederhergestellt.',
    urlBaseVarNinguna: 'Keine (.env nicht verändern)',
    datosReales: 'Enthält echte Kundendaten',
    datosRealesAyuda:
      'Wird in der Liste markiert und erfordert eine Bestätigung, bevor sie über einen Tunnel veröffentlicht wird.',
    avanzado: 'Erweitert',
    reglasExtra: 'Zusätzliche Nginx-Regeln',
    reglasExtraAyuda:
      'Werden innerhalb des server-Blocks eingefügt (Sicherheitsheader, eigene deny-Regeln…). Beim Speichern mit nginx -t geprüft.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Notiz',
    notaPlaceholder: 'Etwas, das Sie sich zu dieser Website merken möchten',
    guardar: 'Website speichern',
    guardado: (nombre: string) => `Website ${nombre} gespeichert`,
    errorGuardar: 'Die Website konnte nicht gespeichert werden',
    nginxFallo: 'Die Website wurde gespeichert, aber Nginx hat die Konfiguration abgelehnt',
    nginxFalloAyuda:
      'Die vorherige Nginx-Konfiguration wurde wiederhergestellt. Prüfen Sie die zusätzlichen Regeln und speichern Sie erneut.',
    errores: {
      carpeta: 'Wählen Sie den Projektordner aus',
      sufijo: 'Die Domain muss auf .test enden',
      caracteres: 'Verwenden Sie nur Buchstaben, Ziffern, Bindestriche und Punkte',
      aliasIgualDominio: (d: string) => `Der Alias ${d} entspricht bereits der Domain der Website`,
      aliasRepetido: (d: string) => `Der Alias ${d} ist doppelt vorhanden`,
      ocupado: (d: string) => `Es existiert bereits eine Website mit der Domain ${d}`,
      puertoFalta: 'Eine Proxy-Website benötigt einen Port',
      puertoRango: 'Der Port muss zwischen 1 und 65535 liegen',
      php: 'Wählen Sie eine PHP-Version für diese Website',
      urlBaseVar: 'Verwenden Sie Buchstaben, Ziffern und Unterstriche (zum Beispiel APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Öffentlicher Tunnel für ${dominio}`,
    etiqueta: 'Tunnel',
    apagadoAyuda: 'Teilen Sie diese Website über einen temporären öffentlichen Link.',
    abriendo: 'Tunnel wird geöffnet…',
    cerrando: 'Tunnel wird geschlossen…',
    error: 'Tunnel fehlgeschlagen',
    sinNginx: 'Starten Sie zuerst Nginx',
    sinCloudflared: 'Installieren Sie cloudflared unter Dienste',
    abrirUrl: 'Öffentlichen Link öffnen',
    copiarUrl: 'Öffentlichen Link kopieren',
    verQr: 'QR-Code für den Link anzeigen',
    qrTitulo: 'Öffentlicher Link dieser Website',
    renovar: 'Erneuern (neuer Link)',
    cerrar: 'Tunnel schließen',
    confirmarTitulo: 'Website mit Echtdaten veröffentlichen',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} enthält echte Kundendaten und würde über ${destino} im Internet veröffentlicht: Jeder mit dem Link kann darauf zugreifen, solange der Tunnel geöffnet bleibt. Veröffentlichen?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} wird über Expose im Internet veröffentlicht: Jeder mit dem Link kann darauf zugreifen, solange der Tunnel geöffnet bleibt. Außerdem ist der Request-Inspector von Expose für jedes Gerät in Ihrem lokalen Netzwerk sichtbar. Veröffentlichen?`,
    compartir: 'Teilen',
    confirmar: 'Veröffentlichen',
    confirmarPublicoTitulo: 'Website im Internet veröffentlichen',
    confirmarPublicoTexto: (dominio: string) =>
      `Es wird ein öffentlicher Cloudflare-Tunnel für ${dominio} geöffnet: Jeder mit dem Link kann darauf zugreifen, solange der Tunnel geöffnet bleibt. Veröffentlichen?`,
    opciones: 'Tunnel-Optionen',
    opcionesDe: (dominio: string) => `Tunnel-Optionen für ${dominio}`,
    proveedor: 'Anbieter',
    proveedorRapido: 'Schnell (ohne Konto)',
    proveedorRapidoAyuda: 'Ein trycloudflare.com-Link, der sich bei jedem Öffnen ändert.',
    proveedorNombre: 'Benannt (Ihre Domain)',
    proveedorNombreAyuda:
      'Ein fester Link unter einer Ihrer Cloudflare-Domains. Erfordert ein Cloudflare-Konto.',
    cuentaConectada: 'Cloudflare-Konto verbunden.',
    cuentaSinConectar: 'Noch kein Cloudflare-Konto verbunden.',
    conectar: 'Mit Cloudflare verbinden',
    conectando: 'Warte auf Autorisierung in Ihrem Browser…',
    conectarAyuda:
      'Ihr Browser wird geöffnet, um WolfCore Dev für Ihr Konto zu autorisieren. Das Zertifikat verbleibt ausschließlich in Ihrem Datenordner.',
    autorizacion: 'Cloudflare-Autorisierung',
    abrirAutorizacion: 'Autorisierungsseite öffnen',
    copiarAutorizacion: 'Autorisierungslink kopieren',
    cancelarConexion: 'Abbrechen',
    recrear: 'Tunnel neu erstellen',
    olvidar: 'Tunnel vergessen',
    recrearTitulo: 'Tunnel neu erstellen',
    recrearTexto: (n: string) =>
      `Der Tunnel „${n}“ wird bei Cloudflare gelöscht und mit demselben Namen neu erstellt. Websites, die ihn verwenden, werden getrennt.`,
    olvidarTitulo: 'Tunnel vergessen',
    olvidarTexto: (n: string) =>
      `Der Tunnel „${n}“ wird bei Cloudflare gelöscht und die gespeicherten Zugangsdaten werden entfernt. Websites, die ihn verwenden, wechseln zurück zum Schnell-Tunnel.`,
    olvidarAqui: 'Nur hier vergessen',
    olvidarAquiTitulo: 'Tunnel nur auf diesem Computer vergessen',
    olvidarAquiTexto: (n: string) =>
      `Die gespeicherte Zugangsdatei für den Tunnel „${n}“ wird auf diesem Computer gelöscht; in Cloudflare besteht der Tunnel weiter. Zugeordnete Websites nutzen wieder den Schnelltunnel.`,
    desconectar: 'Trennen',
    nombreTunel: 'Tunnelname',
    nombreTunelAyuda: 'Kleinbuchstaben, Zahlen und Bindestriche.',
    dominioPublico: 'Öffentliche Domain',
    dominioPublicoAyuda:
      'Eine Subdomain einer eigenen Domain in Cloudflare, z. B. demo.meinedomain.com.',
    crear: 'Erstellen und routen',
    guardadoNombre: 'Benannter Tunnel bereit. Beim Öffnen wird eine Bestätigung verlangt.',
    guardadoRapido: 'Diese Website verwendet wieder den Schnelltunnel.',
    cambiarCierra: 'Beim Anbieterwechsel wird der offene Tunnel dieser Website geschlossen.',
    usarRapido: 'Schnelltunnel verwenden',
    nombreActual: (nombre: string, dominio: string) => `Tunnel „${nombre}“ unter ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} wird über einen Cloudflare-Tunnel unter ${publico} veröffentlicht: Jeder mit dem Link kann zugreifen, solange er offen ist. Veröffentlichen?`,
    proveedorNgrokAyuda:
      'Mit Ihrem ngrok-Konto. Das Programm ngrok muss bereits auf diesem Computer installiert sein.',
    proveedorExposeAyuda:
      'Mit Ihrem Expose-Konto. Expose muss installiert sein; unter Windows funktioniert nur expose.phar. Sein Inspektor ist im lokalen Netzwerk sichtbar, daher nicht für Websites mit echten Daten geeignet.',
    proveedorTailscaleAyuda:
      'Über Ihr privates Tailscale-Netzwerk. Tailscale muss installiert und angemeldet sein.',
    tokenGuardado: (f: string) => `Token gespeichert (endet auf ${f}).`,
    tokenSinGuardar: 'Noch kein Token gespeichert.',
    tokenNgrok: 'ngrok-Token',
    tokenExpose: 'Expose-Token',
    tokenAyuda:
      'Wird verschlüsselt auf diesem Computer gespeichert und nur beim Öffnen des Tunnels übergeben; niemals im Klartext angezeigt.',
    tokenPlaceholder: 'Token hier einfügen',
    guardarToken: 'Token speichern',
    borrarToken: 'Token löschen',
    usarProveedor: 'Diesen Anbieter verwenden',
    guardadoProveedor: 'Anbieter gespeichert. Beim Öffnen des Tunnels wird eine Bestätigung verlangt.',
    ngrokAyudaInstalacion:
      'ngrok muss bereits auf diesem Computer installiert sein (WolfCore Dev lädt es nicht herunter, da keine verifizierbare Prüfsumme vorliegt). Ihre globale Konfiguration bleibt unberührt.',
    exposeAyudaInstalacion:
      'Expose muss installiert sein oder seine expose.phar muss im Ordner bin/expose der WolfCore Dev-Daten liegen (unter Windows funktioniert nur die phar-Datei; kein Download mit Prüfsumme). Sein Anfrage-Inspektor ist im gesamten lokalen Netzwerk sichtbar, daher nicht bei echten Daten zulässig. Ihre globale Konfiguration bleibt unberührt.',
    tailscaleAlcance: 'Reichweite',
    tailscaleServe: 'Serve: nur Ihr Tailnet',
    tailscaleServeAyuda: 'Nur Geräte in Ihrem Tailscale-Netzwerk. Kein Zugriff aus dem Internet.',
    tailscaleFunnel: 'Funnel: gesamtes Internet',
    tailscaleFunnelAyuda: 'Jeder mit dem Link kann zugreifen, auch außerhalb Ihres Tailnets.',
    tailscaleFunnelAviso:
      'Funnel veröffentlicht diese Website im Internet: Jeder mit dem Link kann zugreifen, solange er offen ist.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev installiert Tailscale nicht (Systemdienst): Es muss installiert und angemeldet sein. Bestehende Tailscale-Freigaben werden nicht verändert; die Website nutzt HTTPS-Port 8443.',
    confirmarTailnetTitulo: 'Im Tailnet freigeben',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} wird über Tailscale Serve freigegeben: Nur Geräte Ihres Tailnets können zugreifen; keine Veröffentlichung im Internet. Freigeben?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} enthält echte Kundendaten. Über Tailscale Serve haben nur Geräte Ihres Tailnets Zugriff (nicht öffentlich im Internet). Freigeben?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} wird über Tailscale Funnel im Internet veröffentlicht: Jeder mit dem Link kann zugreifen, solange er offen ist. Veröffentlichen?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} wird über ${proveedor} im Internet veröffentlicht: Jeder mit dem Link kann zugreifen, solange er offen ist. Veröffentlichen?`,
    tituloError: 'Tunnel konnte nicht geöffnet werden',
  },
  tuneles: {
    titulo: 'Tunnel',
    descripcion: 'Temporäre öffentliche Cloudflare-Links, um eine Website außerhalb Ihres Netzwerks zu zeigen.',
    explicacion:
      'Schnelltunnel wechseln bei jedem Öffnen oder Erneuern ihre Adresse und funktionieren nur, solange dieser Computer läuft und die Prozesse aktiv sind (beim Beenden von WolfCore Dev bleiben sie aktiv, wenn sie weiterlaufen dürfen).',
    columnas: { sitio: 'Website', estado: 'Status', url: 'Link', acciones: 'Aktionen' },
    vacioTitulo: 'Keine offenen Tunnel',
    vacio: 'Aktivieren Sie den Tunnel-Schalter einer Website, um einen öffentlichen Link zu erhalten.',
    irASitios: 'Zu Websites',
    sinNombre: 'Gelöschte Website',
  },
  ajustes: {
    titulo: 'Einstellungen',
    descripcion: 'Einstellungen der Umgebung.',
    general: 'Allgemein',
    carpetaDatos: 'Datenordner',
    carpetaDatosAyuda: 'Binärdateien, Konfiguration und Protokolle. Kann geöffnet, aber nicht geändert werden.',
    servicios: 'Dienste',
    puertoNginx: 'Nginx-Port',
    puertoNginxAyuda:
      'Üblicherweise 80. Bei einem anderen Port enthalten lokale URLs den Port. Offene Tunnel nutzen noch den alten Port: Erneuern Sie sie.',
    trabajadores: 'PHP-Worker',
    trabajadoresAyuda:
      'php-cgi-Prozesse pro Version. Mehr Worker bearbeiten mehr parallele Anfragen.',
    nota: 'Beim Speichern werden Websites mit dem neuen Port neu erzeugt. Läuft Nginx, wird es neu gestartet (oder neu geladen, wenn der Port gleich blieb); laufende PHP-Versionen starten neu, falls sich die Worker ändern.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Einstellungen gespeichert und angewendet. Neu gestartet: ${reiniciados.join(', ')}.`
        : 'Einstellungen gespeichert und angewendet.',
    errorAplicar: 'Einstellungen gespeichert, konnten aber nicht vollständig angewendet werden',
    errorSeccion: (detalle: string) => `Dieser Wert konnte nicht gelesen werden: ${detalle}`,
    acerca: 'Über',
    avisos: {
      titulo: 'Hinweise',
      descripcion:
        'Welche Hinweise in der Glocke gespeichert werden und ob Windows eine Benachrichtigung anzeigt, wenn das Fenster im Hintergrund ist.',
      nativas: 'Windows-Benachrichtigungen',
      nativasAyuda:
        'Nur wenn WolfCore Dev nicht im Vordergrund ist; höchstens eine pro Typ alle 5 Min.',
      tiposTitulo: 'Hinweistypen',
      versionesTitulo: 'Neue Versionen nach Dienst',
      versionesAyuda:
        'Deaktivieren Sie einen Dienst, um keine Hinweise zu neuen Versionen zu erhalten (der Tab Versionen zeigt Updates weiterhin an).',
      versionesDe: (s: string) => `Über neue Versionen von ${s} informieren`,
      tipos: {
        'servicio-caido': 'Ein Dienst wurde mit einem Fehler beendet',
        'puerto-ocupado': 'Port beim Starten eines Dienstes belegt',
        'certificado-por-vencer': 'Bald ablaufende Zertifikate',
        'tunel-caido': 'Ein Tunnel wurde unterbrochen',
        'proceso-error': 'Ein Projektprozess ist fehlgeschlagen',
        'proceso-terminado': 'Ein Projektprozess wurde beendet',
        'receta-terminada': 'Ein Projektrezept wurde abgeschlossen',
        doctor: 'Diagnose (Doctor)',
        'contenedor-detenido': 'Ein Container wurde gestoppt',
        'version-nueva': 'Neue Version eines installierten Dienstes verfügbar',
      } as Record<string, string>,
      errorGuardar: 'Hinweise konnten nicht gespeichert werden',
    },
    versionPrograma: 'Programmversion',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Lokale Zertifizierungsstelle',
      autoridadAyuda:
        'WolfCore Dev signiert Zertifikate Ihrer .test-Websites mit einer eigenen CA. Sie wird ohne Administratorrechte im Windows-Benutzerspeicher installiert.',
      instalada: 'In Windows installiert',
      noInstalada: 'Nicht installiert',
      instalar: 'CA installieren',
      reinstalar: 'Neu installieren',
      quitar: 'Entfernen',
      instaladaOk: 'HTTPS-CA installiert',
      quitadaOk: 'HTTPS-CA entfernt',
      cancelado: 'Windows-Bestätigung abgebrochen. Es wurde nichts geändert.',
      fallo: 'Die HTTPS-CA konnte nicht geändert werden',
      quitarTitulo: 'HTTPS-CA entfernen?',
      quitarTexto:
        'Browser vertrauen den Zertifikaten Ihrer .test-Websites erst wieder nach erneuter Installation.',
      puerto: 'HTTPS-Port',
      puertoAyuda:
        'Üblicherweise 443. Falls ein anderes Programm ihn nutzt, wählen Sie einen Port zwischen 1024 und 65535; URLs enthalten dann den Port.',
      puertoRango: 'Verwenden Sie 443 oder eine Zahl zwischen 1024 und 65535',
      puertoGuardado: (p: number) => `HTTPS verwendet jetzt Port ${p}`,
      puertoAplicarFallo: 'Port gespeichert, aber Nginx hat die neue Konfiguration abgelehnt',
      firefox:
        'Firefox nutzt einen eigenen Zertifikatsspeicher. Zum Vertrauen öffnen Sie about:config und aktivieren',
    },
    herramientas: {
      titulo: 'Terminal und Werkzeuge',
      phpPorDefecto: 'Standard-PHP',
      phpPorDefectoAyuda:
        'Die PHP- und Composer-Version im Terminal und in WolfCore Dev-Kurzbefehlen. „Terminal“ nutzt das PHP des jeweiligen Projekts.',
      phpMasReciente: 'Neueste installierte Version',
      phpSinInstalar: 'Installieren Sie PHP unter Dienste, um eine Version zu wählen',
      phpGuardado: 'Standard-PHP aktualisiert',
      path: 'Benutzer-PATH',
      pathAyuda:
        'Fügt PHP und Composer von WolfCore Dev dem Benutzer-PATH hinzu, sodass sie in jedem Terminal verfügbar sind.',
      pathActivo: 'Im PATH enthalten',
      pathInactivo: 'Nicht im PATH',
      pathAgregar: 'Zum Benutzer-PATH hinzufügen',
      pathQuitar: 'Aus PATH entfernen',
      pathTitulo: 'PATH aktualisiert',
      pathAviso: 'Öffnen Sie ein neues Terminal für die Änderung: Bereits offene Terminals sehen sie nicht.',
      pathQuitarTitulo: 'WolfCore Dev aus dem PATH entfernen?',
      pathQuitarTexto:
        'PHP und Composer von WolfCore Dev stehen in neuen Terminals nicht mehr zur Verfügung. Offene Terminals ändern sich nicht.',
      adminer: 'Adminer-Port',
      adminerAyuda: 'Adminer wird nur lokal auf diesem Computer unter dieser festen Adresse bereitgestellt.',
      terminal: 'Standard-Terminal',
      terminalSistema: 'Systemstandard (PowerShell)',
      terminalAyuda:
        'Wird über „Terminal“ in Projekten geöffnet. Benötigt ein Projekt eigene Variablen (sein PHP im PATH, Agenten-Schlüssel), öffnet „Windows Terminal“ PowerShell im Windows-Standardterminal: Ein bereits offenes Windows Terminal erhält diese Variablen nicht.',
      terminalGuardada: 'Standard-Terminal aktualisiert',
      editor: 'Standard-Editor',
      editorPrimero: 'Erster erkannter Editor',
      editorAyuda:
        'Wird bei „Editor“ in Projekten sowie „Im Editor öffnen“ bei Suchen und Fehlern genutzt. Erkannt werden VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed und Notepad++.',
      editorGuardado: 'Standard-Editor aktualisiert',
      editorNinguno: 'Kein Editor erkannt.',
    },
  },
  /* ───────────── HTTPS, terminal y FTP en sitios; Correo; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS aktiv',
    candadoAyuda: 'Diese Website antwortet auch über HTTPS mit einem WolfCore Dev-Zertifikat.',
    redirige: 'Leitet http → https um',
    abrirHttp: (dominio: string) => `http://${dominio} im Browser öffnen`,
    abrirHttps: (url: string) => `${url} im Browser öffnen`,
    pendiente: (motivo: string) => `HTTPS ausstehend: ${motivo}`,
    pendienteCorto: 'HTTPS ausstehend',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `Port ${puerto} wird von ${nombre} (PID ${pid}) verwendet.`,
    sinAutoridad: 'Zertifizierungsstelle fehlt. Installieren Sie sie unter Einstellungen.',
    pendienteAyuda:
      'Die Website läuft weiterhin über HTTP. Schließen Sie das Programm oder wählen Sie einen anderen HTTPS-Port in den Einstellungen.',
    sinConfianza: 'CA nicht installiert',
    sinConfianzaAyuda:
      'Der Browser zeigt eine Sicherheitswarnung, bis Sie die CA von WolfCore Dev installieren (Einstellungen → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Auch über HTTPS ausliefern',
    httpsAyuda: 'Mit eigenem Zertifikat für die Domain und ihre Aliase, signiert von WolfCore Dev.',
    redirigir: 'Auf HTTPS umleiten',
    redirigirAyuda: 'Aufrufe über http werden auf https umgeleitet. Öffentliche Tunnel bleiben unberührt.',
    redirigirDeshabilitado: 'Aktivieren Sie zuerst HTTPS',
    sinAutoridadTitulo: 'HTTPS-CA ist nicht installiert',
    sinAutoridadTexto:
      'Ohne sie zeigt der Browser eine Sicherheitswarnung. Windows bittet Sie um Bestätigung der Installation.',
    instalar: 'CA installieren',
    instalada: 'HTTPS-CA installiert',
    cancelado: 'Windows-Bestätigung abgebrochen. Es wurde nichts geändert.',
    fallo: 'Die HTTPS-CA konnte nicht installiert werden',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Öffnet ein Terminal im Projektordner mit dessen PHP und Composer im PATH.',
    elegir: 'Terminal wählen',
    predeterminada: 'Standard',
  },
  editorSitio: {
    ayuda: 'Öffnet den Projektordner im Standard-Editor.',
    elegir: 'Öffnen mit…',
    predeterminada: 'Standard',
    sustituido: (pred: string, usado: string) =>
      '{pred} ist nicht installiert: mit {usado} geöffnet.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Der Editor konnte nicht geöffnet werden',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Gemeinsames PHP ${rama}`,
    propio: (rama: string) => `Eigenes PHP ${rama} dieser Website`,
    conXdebug: 'Xdebug aktiv',
    mostrar: 'PHP-Einstellungen',
    ocultar: 'PHP-Einstellungen ausblenden',
    cargando: 'PHP-Einstellungen werden gelesen…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} ist gestoppt: Das eigene PHP dieser Website startet damit zusammen.`,
    ajustesTitulo: 'Eigene php.ini',
    ajustesAyuda: (rama: string) =>
      `Werden nur für diese Website zur php.ini von PHP ${rama} hinzugefügt. Mit eigenen Einstellungen (oder Xdebug) nutzt die Website ein eigenes PHP mit 1–2 Prozessen; andere Websites bleiben unverändert.`,
    clave: 'Direktive',
    valor: 'Wert',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `${clave || 'Einstellung'} entfernen`,
    agregar: 'Einstellung hinzufügen',
    guardarAjustes: 'Prüfen und speichern',
    ajustesGuardados: 'PHP-Einstellungen der Website angewendet',
    sinAjustes: 'Keine eigenen Einstellungen: verwendet die gemeinsame php.ini unverändert.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug für ${dominio}`,
    xdebugAyuda:
      'Wird nur im PHP dieser Website geladen, niemals im gemeinsamen PHP: Andere Websites bleiben genauso schnell.',
    xdebugDescarga:
      'Xdebug ist für diese PHP-Version nicht installiert: Es wird aus dem Katalog heruntergeladen (xdebug.org, SHA-256 geprüft).',
    modo: 'Modi',
    modos: {
      debug: 'debug (Haltepunkte)',
      develop: 'develop (bessere Fehlerausgaben)',
      coverage: 'coverage (Codeabdeckung)',
      profile: 'profile (Profiling)',
      trace: 'trace (Trace)',
    },
    puerto: 'Editor-Port',
    inicio: 'Wann verbinden',
    inicioTrigger: 'Nur mit XDEBUG_TRIGGER',
    inicioYes: 'Bei jeder Anfrage',
    inicioAyuda:
      'Bei „Nur mit XDEBUG_TRIGGER“ startet das Debugging erst mit Cookie, GET/POST-Parameter oder Browser-Erweiterung (Xdebug Helper).',
    guardarXdebug: 'Xdebug speichern',
    xdebugPuertoEnUso: (puerto: number) =>
      `Port ${puerto} wird bereits von einem PHP oder Dienst in WolfCore Dev genutzt: Ihr Editor kann dort nicht lauschen. Wählen Sie einen anderen (9003 ist üblich).`,
    xdebugGuardado: 'Xdebug für die Website angewendet',
    quitarXdebug: 'Xdebug entfernen',
    quitarXdebugTitulo: 'Xdebug von dieser Website entfernen?',
    quitarXdebugTexto:
      'Die Konfiguration wird gelöscht. Ohne weitere eigene Einstellungen wechselt die Website zurück zum gemeinsamen PHP. Die launch.json des Projekts bleibt unberührt.',
    xdebugQuitado: 'Xdebug von der Website entfernt',
    ide: 'Editor',
    generarLaunch: 'launch.json erzeugen',
    launchTitulo: '.vscode/launch.json des Projekts',
    launchNuevo:
      '.vscode/launch.json wird mit dieser Konfiguration erstellt (PHP Debug für VS Code, lauscht nur auf 127.0.0.1).',
    launchFusion:
      'Es existiert bereits eine launch.json: Nur die WolfCore-Konfiguration wird ergänzt oder aktualisiert; andere Einträge und Kommentare bleiben. Zuvor wird eine datierte Sicherung im Datenordner gespeichert.',
    launchSinCambios: 'Die launch.json enthält diese Konfiguration bereits.',
    launchEscribir: 'launch.json schreiben',
    launchCreado: 'launch.json in .vscode erstellt',
    launchActualizado: (respaldo: string) => `launch.json aktualisiert. Vorherige Sicherung: ${respaldo}`,
    phpStorm: 'Konfiguration für PhpStorm',
    copiarPhpStorm: 'PhpStorm-Konfiguration kopieren',
    errorNginx: (salida: string) => `Nginx hat die Änderung abgelehnt; vorheriger Stand wiederhergestellt. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Generierter vhost',
    conReglas: 'mit eigenen Regeln',
    manualResumen: 'Manuell geschriebener vhost (wird nicht neu generiert)',
    mostrar: 'vhost bearbeiten',
    ocultar: 'vhost ausblenden',
    cargando: 'vhost wird gelesen…',
    reglasTitulo: 'Eigene Regeln',
    reglasAyuda:
      'Stehen im server-Block dieser Website. Vor dem Anwenden erfolgt ein Test mit nginx -t auf einer Kopie der Gesamtkonfiguration; bei Fehlern bleibt alles unverändert.',
    reglasEtiqueta: 'Eigene Nginx-Regeln',
    reglasPlaceholder: '# Zum Beispiel: client_max_body_size 256m;',
    snippetsTitulo: 'Vorlagen',
    insertar: (titulo: string) => `Einfügen: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache für statische Dateien',
      'limite-subida': 'Upload-Limit',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Sicherheitsheader',
      websocket: 'WebSocket-Proxy',
      gzip: 'gzip-Komprimierung',
      ocultos: 'Versteckte Dateien sperren',
    },
    aplicar: 'Prüfen und anwenden',
    descartar: 'Änderungen verwerfen',
    aplicado: 'vhost angewendet und Nginx neu geladen',
    aplicadoApagado: 'vhost gespeichert; wird beim Start von Nginx verwendet',
    fallo: 'Nginx hat die Änderung abgelehnt; der vhost blieb unverändert',
    salidaTitulo: 'Ausgabe von nginx -t',
    desactivado:
      'Nginx hat Ihre Regeln für diese Website nicht akzeptiert; sie wurden aus dem vhost ausgeschlossen (bleiben aber gespeichert). Korrigieren und erneut anwenden.',
    avisoDestino: (destino: string, linea: number) =>
      `Zeile ${linea}: Datenverkehr wird an einen anderen Rechner (${destino}) geleitet. Prüfen Sie, ob das beabsichtigt ist.`,
    generadoTitulo: 'Generierter vhost (schreibgeschützt)',
    avanzadoTitulo: 'Erweiterter Modus',
    avanzadoInterruptor: 'Vollständigen vhost manuell schreiben',
    avanzadoAyuda:
      'Ersetzt den generierten vhost. WolfCore Dev erzeugt ihn nicht mehr neu: Änderungen an Domain, HTTPS, Ports oder Ordner müssen Sie selbst pflegen. Nur Domains und Ports dieser Website sind erlaubt.',
    avanzadoActivarTitulo: 'vhost manuell schreiben?',
    avanzadoActivarTexto:
      'Ausgangspunkt ist der aktuell generierte vhost. Solange aktiv, werden Website-Änderungen (Domain, HTTPS, PHP…) nicht automatisch im vhost übernommen.',
    avanzadoActivar: 'Manuell schreiben',
    manualEtiqueta: 'Vollständiger Website-vhost',
    aplicarManual: 'vhost prüfen und anwenden',
    volverGenerado: 'Zum generierten vhost zurückkehren',
    volverGeneradoTitulo: 'Zum generierten vhost zurückkehren?',
    volverGeneradoTexto:
      'Der manuell geschriebene vhost wird im Verlauf gesichert und WolfCore Dev generiert den Website-vhost wieder automatisch (inklusive Ihrer eigenen Regeln).',
    historial: 'Verlauf',
    historialTitulo: 'Frühere vhost-Versionen',
    historialVacio: 'Noch keine früheren Versionen.',
    historialAyuda:
      'Die letzten 10 Versionen vor jeder Änderung werden aufbewahrt. Beim Wiederherstellen erfolgt derselbe Test mit nginx -t.',
    modoReglas: 'Generiert mit Regeln',
    modoManual: 'Manuell geschrieben',
    restaurar: 'Wiederherstellen',
    restaurarTitulo: 'Diese Version wiederherstellen?',
    restaurarTexto: (fecha: string) =>
      `Der vhost wird auf den Stand vom ${fecha} zurückgesetzt. Die aktuelle Version bleibt im Verlauf.`,
    restaurado: 'Version wiederhergestellt',
  },
  lan: {
    etiqueta: 'Lokales Netzwerk',
    interruptor: (dominio: string) => `${dominio} im lokalen Netzwerk freigeben`,
    apagadoAyuda: 'Öffnen Sie diese Website auf Ihrem Smartphone oder einem anderen Gerät im selben Netzwerk.',
    sinNginx: 'Starten Sie Nginx, um die Website im lokalen Netzwerk freizugeben.',
    sinRed: 'Kein lokales Netzwerk verbunden (WLAN oder Ethernet).',
    activo: 'Im lokalen Netzwerk sichtbar',
    abriendo: 'Wird freigegeben…',
    cerrando: 'Freigabe wird beendet…',
    abrirUrl: 'Auf diesem Computer öffnen',
    copiarUrl: 'Adresse kopieren',
    verQr: 'QR-Code anzeigen',
    qrTitulo: (dominio: string) => `${dominio} im lokalen Netzwerk`,
    qrAviso: 'Scannen Sie den QR-Code mit einem Smartphone im selben Netzwerk.',
    confirmarTitulo: 'Im lokalen Netzwerk freigeben',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} wird für jedes Gerät im selben Netzwerk wie dieser Computer (${ip}) ohne Passwort sichtbar. Die Freigabe endet beim Ausschalten, beim Schließen und beim Neustart von WolfCore Dev.`,
    ipEtiqueta: 'Netzwerk (IP dieses Computers)',
    https: 'HTTPS verwenden',
    httpsAyuda:
      'Für HTTPS muss das Smartphone der WolfCore Dev-CA vertrauen (Schaltfläche „CA auf dem Smartphone installieren“). Andernfalls läuft die Website über HTTP.',
    httpsObligatorio: 'Diese Website leitet auf HTTPS um und wird daher mit HTTPS freigegeben.',
    compartir: 'Im Netzwerk freigeben',
    tituloError: 'Freigabe im lokalen Netzwerk fehlgeschlagen',
    caBoton: 'CA auf dem Smartphone installieren',
    firewallTitulo: 'Öffnet sich nicht auf dem Smartphone?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} enthält echte Daten und wird im lokalen Netzwerk nicht freigegeben, auch nicht mit Bestätigung.`,
    redPublica:
      'Dieses Netzwerk ist in Windows als öffentlich markiert: Die Firewall blockiert eingehende Verbindungen und der Befehl öffnet nur private Netzwerke. Stellen Sie es auf privat um, wenn Sie dem Netzwerk vertrauen.',
    firewallTexto:
      'WolfCore Dev ändert die Firewall nicht. Bestätigen Sie nicht die allgemeine Windows-Meldung für das gesamte Programm: Führen Sie den Befehl für diesen Port (nur lokales Subnetz, nur private Netzwerke) in PowerShell als Administrator aus. In öffentlichen Netzwerken öffnet er nicht, und bestehende Blockierregeln haben Vorrang.',
    copiarComando: 'Befehl kopieren',
  },
  caMovil: {
    titulo: 'CA auf dem Smartphone installieren',
    intro:
      'Scannen Sie den QR-Code mit einem Smartphone im selben Netzwerk, um das CA-Zertifikat von WolfCore Dev herunterzuladen. Nur diese Datei wird bereitgestellt und der Link schließt sich automatisch.',
    abriendo: 'Link wird geöffnet…',
    expira: (minutos: number) => `Der Link schließt sich automatisch in ${minutos} Min.`,
    expirado: 'Der Link wurde geschlossen.',
    reabrir: 'Erneut öffnen',
    android: 'Android',
    ios: 'iPhone oder iPad',
    pasosAndroid: [
      'Scannen Sie den QR-Code oder öffnen Sie die Adresse im mobilen Browser und laden Sie die Datei herunter.',
      'Öffnen Sie Einstellungen > Sicherheit & Datenschutz > Weitere Sicherheitseinstellungen > Verschlüsselung & Anmeldedaten > Zertifikat installieren > CA-Zertifikat (Bezeichnungen variieren je nach Hersteller).',
      'Vergleichen Sie vor dem Vertrauen den SHA-256-Fingerabdruck auf dem Smartphone mit diesem Dialog: Stimmt er nicht überein, nicht installieren.',
      'Wählen Sie die heruntergeladene Datei und bestätigen Sie die Warnung: Das ist bei jeder CA unter Android normal.',
    ],
    pasosIos: [
      'Öffnen Sie die Adresse in Safari und erlauben Sie den Profil-Download.',
      'Öffnen Sie Einstellungen > Geladenes Profil und vergleichen Sie den SHA-1-Fingerabdruck in den Details mit diesem Dialog: Bei Abweichung nicht installieren. Andernfalls installieren.',
      'Öffnen Sie Einstellungen > Allgemein > Info > Zertifikatsvertrauenseinstellungen und aktivieren Sie das volle Vertrauen für die CA von WolfCore Dev.',
    ],
    aviso:
      'Eine installierte CA macht alles vertrauenswürdig, was sie signiert: Installieren Sie sie nur auf eigenen Geräten und entfernen Sie sie danach wieder.',
    firewallAviso: (puerto: number) =>
      'Damit das Smartphone den Link erreicht, muss Port ' +
      puerto +
      ' geöffnet werden (nur lokales Subnetz und private Netzwerke). Bestätigen Sie nicht die allgemeine Windows-Meldung: Führen Sie diesen Befehl in PowerShell als Administrator aus. In öffentlichen Netzwerken öffnet er nicht, und bestehende Blockierregeln haben Vorrang.',
    huellas: 'Zertifikats-Fingerabdrücke',
    tituloError: 'CA-Link konnte nicht geöffnet werden',
  },
  dialogoQr: {
    descargar: 'PNG herunterladen',
    descargado: 'QR-Code gespeichert',
    largo: 'Der Text ist zu lang für einen QR-Code.',
    generando: 'QR-Code wird erzeugt…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `FTP-Zugang für ${dominio}`,
    apagadoAyuda: 'Ermöglicht das Hochladen von Dateien in den Ordner dieser Website per FTP.',
    activoAyuda: 'Zugang aktiv.',
    soloLecturaEtiqueta: 'schreibgeschützt',
    mostrarDatos: 'FTP-Daten anzeigen',
    ocultarDatos: 'FTP-Daten ausblenden',
    host: 'Server',
    puerto: 'Port',
    usuario: 'Benutzer',
    clave: 'Passwort',
    mostrarClave: 'Passwort anzeigen',
    ocultarClave: 'Passwort ausblenden',
    copiarDato: (dato: string) => `${dato} kopieren`,
    cargando: 'FTP-Daten werden gelesen…',
    regenerar: 'Passwort neu erzeugen',
    regenerarTitulo: 'FTP-Passwort neu erzeugen?',
    regenerarTexto:
      'Das aktuelle Passwort verliert sofort seine Gültigkeit und offene Verbindungen dieser Website werden getrennt. Aktualisieren Sie es in Ihrem FTP-Client.',
    regenerada: 'FTP-Passwort neu erzeugt',
    soloLectura: 'Schreibgeschützt',
    soloLecturaAyuda: 'Dateien können heruntergeladen, aber nicht hochgeladen, geändert oder gelöscht werden.',
    soloLecturaActivado: 'Der FTP-Zugang dieser Website ist jetzt schreibgeschützt',
    soloLecturaDesactivado: 'Der FTP-Zugang dieser Website erlaubt jetzt Schreibzugriff',
    activado: 'FTP-Zugang aktiviert',
    desactivarTitulo: 'FTP-Zugang für diese Website entfernen?',
    desactivarTexto:
      'Das Passwort wird gelöscht und offene Verbindungen werden geschlossen. Der Ordner der Website bleibt unverändert.',
    desactivar: 'Zugang entfernen',
    desactivado: 'FTP-Zugang entfernt',
    redLocalAviso:
      'FTP akzeptiert Verbindungen aus dem lokalen Netzwerk und überträgt das Passwort sowie Dateien unverschlüsselt. Verwenden Sie es nur in einem vertrauenswürdigen Netzwerk.',
    redLocalHost: 'oder die IP dieses Computers in Ihrem Netzwerk',
    servidorApagado: 'Der FTP-Server ist ausgeschaltet: Niemand kann sich verbinden, bis Sie ihn einschalten.',
    encender: 'FTP einschalten',
    urlEtiqueta: 'Adresse',
    urlAyuda: 'Die Adresse enthält nicht das Passwort: Es wird beim Verbinden abgefragt.',
    abrirUrl: 'In einem FTP-Client öffnen',
    copiarUrl: 'FTP-Adresse kopieren',
    verQr: 'QR-Code der Adresse anzeigen',
    qrTitulo: 'FTP-Adresse dieser Website',
    qrAviso: 'Der Code enthält nur die Adresse, nicht das Passwort.',
  },
  correo: {
    descripcion:
      'E-Mail-Catcher fangen die von Ihren Projekten gesendeten E-Mails ab, damit Sie sie prüfen können, ohne dass sie ins Internet gelangen. Sie lauschen nur auf diesem Computer (127.0.0.1), und es ist jeweils nur einer eingeschaltet.',
    seccionCaptadores: 'Lokale E-Mail-Catcher',
    seccionProveedores: 'Externe SMTP-Anbieter',
    proveedores: {
      descripcion:
        'Ein echter SMTP-Anbieter versendet E-Mails tatsächlich: Nutzen Sie ihn, um den Versand Ihres Projekts vor der Veröffentlichung zu testen. Das Passwort wird verschlüsselt auf diesem Computer gespeichert und niemals angezeigt.',
      agregar: 'Anbieter hinzufügen',
      vacio:
        'Sie haben noch keinen Anbieter hinzugefügt. Wählen Sie Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO oder Gmail, oder geben Sie Ihren eigenen ein.',
      errorLista: 'Die Anbieterliste konnte nicht gelesen werden',
      tarjeta: {
        servidor: 'Server',
        usuario: 'Benutzer',
        clave: 'Passwort',
        sinClave: 'Kein Passwort',
        claveIlegible: 'Gespeichert (konnte nicht gelesen werden)',
        red: 'Netzwerk',
        redLocal: 'Server auf diesem Computer oder im lokalen Netzwerk (bestätigt)',
        editar: 'Bearbeiten',
        borrar: 'Löschen',
        borrarTitulo: (n: string) => `${n} löschen?`,
        borrarTexto:
          'Der Anbieter und sein gespeichertes Passwort werden gelöscht. Projekte, die ihn verwenden, wechseln zurück zum lokalen E-Mail-Catcher, aber ihre .env-Dateien werden nicht angetastet: Sie behalten die MAIL_*-Variablen dieses Anbieters (und sein Passwort, falls Sie es eingetragen haben). Überschreiben Sie den E-Mail-Block in jeder .env-Datei.',
        borrado: (n: string) => `${n} gelöscht`,
        usar: 'In einem Projekt verwenden',
        destino: 'Zieladresse für den Test',
        destinoPlaceholder: 'ihre-adresse@beispiel.de',
        probar: 'Versand testen',
        probando: 'Wird gesendet…',
        probarAyuda:
          'Sendet eine einzelne echte E-Mail an diese Adresse über eine geprüfte verschlüsselte Verbindung. Maximal eine alle 15 s.',
        sinClaveParaProbar: 'Speichern Sie das Passwort des Anbieters, um den Versand testen zu können.',
        hostLocal: 'Dieser Servername wird auf diesen Computer oder das lokale Netzwerk aufgelöst.',
        confirmarRed: 'Lokales Netzwerk bestätigen',
        enviado: (para: string) => `E-Mail an ${para} gesendet. Prüfen Sie Ihren Posteingang.`,
        fallos: {
          'correo.auth': 'Der Anbieter hat den Benutzer oder das Passwort abgelehnt.',
          'correo.conexion': 'Verbindung fehlgeschlagen: Prüfen Sie Host und Port.',
          'correo.tls':
            'Die verschlüsselte Verbindung ist ungültig (Zertifikat, Hostname oder STARTTLS). Es wurde nichts gesendet.',
          'correo.rechazado':
            'Der Server hat die Nachricht oder eine Adresse abgelehnt. Prüfen Sie den Absender: Viele Anbieter akzeptieren nur einen verifizierten Absender oder eine verifizierte Domain.',
          'correo.plazo': 'Der Server hat nicht rechtzeitig geantwortet (20 s).',
        },
      },
      dialogo: {
        nuevo: 'SMTP-Anbieter hinzufügen',
        editar: (n: string) => `${n} bearbeiten`,
        preset: 'Anbieter',
        presetOtro: 'Anderer (Daten selbst eingeben)',
        presetAyuda: 'Host und Port stammen aus der offiziellen Dokumentation des jeweiligen Anbieters.',
        documentacion: 'Dokumentation ansehen',
        region: 'Region',
        nombre: 'Name',
        nombreObligatorio: 'Geben Sie einen Namen ein.',
        host: 'Server (Host)',
        hostAyuda: 'Nur der Hostname oder die IP, ohne smtp:// und ohne Port.',
        hostObligatorio: 'Geben Sie den Server ein.',
        puerto: 'Port',
        seguridad: 'Verschlüsselung',
        seguridadAyuda:
          'Es wird immer eine verschlüsselte Verbindung mit gültigem Zertifikat vorausgesetzt: Es erfolgt niemals ein Rückfall auf Klartext.',
        tls: 'Direktes TLS (Port 465)',
        starttls: 'STARTTLS (Port 587)',
        usuario: 'Benutzer',
        usuarioObligatorio: 'Geben Sie den Benutzer ein.',
        usuarioFijoAyuda: 'Dieser Anbieter verwendet immer diesen Benutzer; das Passwort stammt aus Ihrem Konto.',
        clave: 'SMTP-Passwort',
        claveGuardada: (f: string) => `Gespeichert: ••••${f}`,
        claveNueva: 'Geben Sie das Passwort zum Speichern ein',
        claveAyuda:
          'Wird verschlüsselt auf diesem Computer gespeichert und nie wieder angezeigt. Leer lassen, um es nicht zu ändern.',
        remitente: 'Test-Absender (optional)',
        remitenteAyuda:
          'Viele Anbieter senden nur von einem verifizierten Absender oder einer verifizierten Domain. Wenn Sie das Feld leer lassen, wird die Zieladresse selbst als Absender verwendet.',
        claveSinEspacios:
          'Fügen Sie das Passwort genau so ein, wie es der Anbieter vorgibt: Leerzeichen im Inneren bleiben erhalten.',
        borrarClave: 'Passwort löschen',
        borrarClaveTitulo: (n: string) => `Passwort von ${n} löschen?`,
        borrarClaveTexto: 'Das gespeicherte Passwort wird gelöscht. Der Anbieter bleibt in der Liste.',
        claveBorrada: 'Passwort gelöscht',
        guardar: 'Speichern',
        guardado: (n: string) => `${n} gespeichert`,
        redLocalTitulo: 'Server auf diesem Computer oder im lokalen Netzwerk',
        redLocalTexto: (h: string) =>
          `${h} verweist auf diesen Computer oder das lokale Netzwerk. WolfCore Dev verbindet sich nur dorthin, wenn Sie dies bestätigen. Ist es Ihr eigener Server?`,
        redLocalConfirmar: 'Ja, gehört mir',
        cambiaTitulo: 'Passwort an einen anderen Server senden',
        cambiaTexto: (h: string) =>
          `Der Anbieter hat ein gespeichertes Passwort und der Server oder Benutzer wurde geändert. Das Passwort wird an ${h} gesendet. Fortfahren?`,
        cambiaConfirmar: 'Ja, fortfahren',
      },
      env: {
        titulo: (n: string) => `${n} in einem Projekt verwenden`,
        proyecto: 'Projekt',
        sinProyectos: 'Es gibt noch keine Projekte.',
        yaUsaSmtp: 'Dieses Projekt sendet bereits über einen SMTP-Anbieter.',
        volverCaptador: 'Zurück zum lokalen E-Mail-Catcher',
        volvio: (n: string) =>
          `${n} sendet wieder an den lokalen E-Mail-Catcher, aber die .env-Datei wurde nicht angetastet: Sie behält die MAIL_*-Variablen des Anbieters (und sein Passwort, falls Sie es eingetragen haben). Überschreiben Sie den E-Mail-Block.`,
        incluirClave: 'Passwort ebenfalls in die .env-Datei schreiben',
        incluirClaveAyuda: 'Ohne Häkchen enthält der Block kein MAIL_PASSWORD und Sie tragen es manuell ein.',
        sinClaveGuardada: 'Für diesen Anbieter ist kein Passwort gespeichert.',
        vista: 'Änderungen in der .env-Datei (das Passwort wird maskiert)',
        textoPlano:
          'Das Passwort steht im Klartext in der .env-Datei des Projekts. Jeder mit Zugriff auf diesen Ordner – oder auf Ihr Repository, falls Sie es hochladen – kann es lesen.',
        claveTitulo: 'Passwort in die .env-Datei schreiben',
        claveTexto:
          'Das Passwort wird im Klartext in der .env-Datei des Projekts gespeichert. Verwenden Sie dies nur, wenn das Projekt nicht in ein Repository hochgeladen wird und nur Sie Zugriff auf den Ordner haben.',
        claveConfirmar: 'Verstanden, Passwort einfügen',
        agregarGitignore: '.env zu .gitignore hinzufügen',
        gitignoreTitulo: '.gitignore bearbeiten',
        gitignoreTexto:
          'Die Zeile .env wird zur .gitignore-Datei des Projekts hinzugefügt (mit vorheriger Kopie).',
        gitignoreConfirmar: 'Hinzufügen',
        versionadoTitulo: 'Git verfolgt die .env-Datei bereits',
        versionadoTexto:
          'Der nächste Commit würde Ihre Werte hochladen. Entfernen Sie sie mit git rm --cached .env aus dem Index.',
        desconocidoTitulo: 'Git konnte nicht geprüft werden',
        desconocidoTexto: 'Es konnte nicht festgestellt werden, ob Git die .env-Datei dieses Projekts verfolgt.',
        aceptarVersionado: 'Trotzdem schreiben',
        aceptarTitulo: 'In eine versionierte .env-Datei schreiben',
        aceptarTexto:
          'Wenn Git die .env-Datei verfolgt, können diese Variablen im Repository landen. Trotzdem schreiben?',
        aceptarConfirmar: 'Trotzdem schreiben',
        confirmarTitulo: 'In die .env-Datei schreiben',
        confirmarTexto: (ruta: string) =>
          `Es wird eine Kopie von ${ruta} gespeichert und die MAIL_*-Variablen werden ohne das Passwort hinzugefügt.`,
        confirmarTextoClave: (ruta: string) =>
          `Es wird eine Kopie von ${ruta} gespeichert und die MAIL_*-Variablen werden mit dem Passwort im Klartext hinzugefügt.`,
        confirmar: 'Schreiben',
        escribir: 'In .env schreiben',
        escrito: (n: string) => `${n} sendet jetzt über diesen Anbieter`,
      },
    },
    estado: 'Status',
    smtp: 'SMTP',
    buzon: 'Web-Postfach',
    abrirBuzon: 'Postfach öffnen',
    noLeidos: 'Ungelesen',
    noLeidosValor: (n: number) => plural(n, 'ungelesene E-Mail', 'ungelesene E-Mails'),
    noLeidosError: 'Das Postfach konnte nicht gelesen werden',
    actualizar: 'E-Mails erneut zählen',
    actualizaSolo: 'Wird alle 15 Sekunden aktualisiert, solange diese Ansicht geöffnet ist.',
    env: 'Block für die Laravel-.env-Datei',
    envAyuda: (captador: string) =>
      `Fügen Sie ihn in die .env-Datei Ihres Projekts ein. Die E-Mails landen in ${captador}, unverschlüsselt und ohne Benutzer.`,
    copiarEnv: 'Block kopieren',
    irAServicios: 'Zu Dienste wechseln',
    cargando: 'E-Mail-Catcher werden geladen…',
    errorLista: 'Die Liste der E-Mail-Catcher konnte nicht gelesen werden',
    captador: {
      opcional: 'Optional',
      elegido: 'Empfängt die E-Mails Ihrer Projekte',
      noInstalado: 'Nicht installiert',
      instalar: 'Installieren',
      usar: 'Diesen verwenden',
      apagar: 'Ausschalten',
      iniciando: 'Wird gestartet…',
      avisoMantenimiento:
        'Dieser E-Mail-Catcher wird kaum noch gepflegt. Bevorzugen Sie Mailpit oder smtp4dev.',
    },
    notaDescartados:
      'MailHog und MailDev werden nicht angeboten: MailHog veröffentlicht keine Prüfsumme zur Überprüfung des Downloads, und MailDev existiert nur auf npm. Ohne überprüfbare Prüfsumme wird nichts heruntergeladen.',
    notaHost:
      'Die Web-Postfächer antworten nur auf 127.0.0.1, aber solange ein E-Mail-Catcher läuft, könnte eine bösartige Website versuchen, Ihr Postfach auszulesen (DNS-Rebinding). smtp4dev und Papercut lehnen fremde Host-Header ab; Mailpit stellt sein Postfach unter einem geheimen Pfad bereit, der nur auf diesem Computer gilt (WolfCore Dev öffnet diese Adresse für Sie); Inbucket bietet keinerlei Schutz: Schalten Sie es aus, wenn Sie es nicht verwenden.',
  },
  ia: {
    descripcion:
      'Cloud-KI-Anbieter und lokale Modelle mit Ollama. Die Schlüssel werden verschlüsselt auf diesem Computer gespeichert und niemals angezeigt.',
    nube: {
      titulo: 'Cloud-KI',
      agregar: 'Anbieter hinzufügen',
      vacio:
        'Sie haben noch keinen Anbieter hinzugefügt. Fügen Sie OpenAI, Anthropic, Gemini, Hermes (Nous) oder einen OpenAI-kompatiblen Anbieter hinzu.',
      errorLista: 'Die Anbieterliste konnte nicht gelesen werden',
    },
    local: { titulo: 'Lokale KI (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'OpenAI-kompatibel',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Schlüssel',
      sinClave: 'Kein Schlüssel',
      claveIlegible: 'Gespeichert (konnte nicht gelesen werden)',
      url: 'Basis-URL',
      modeloPorDefecto: 'Standardmodell',
      ninguno: 'Keines',
      probarConexion: 'Verbindung testen',
      probarConexionAyuda: 'Listet die Modelle des Anbieters auf. Verbraucht keine Tokens.',
      probando: 'Wird getestet…',
      conectado: (ms: number, n: number) => `Verbunden · ${ms} ms · ${n} Modelle`,
      verModelos: (n: number) => `Alle ${n} Modelle anzeigen`,
      soloGratuitos: 'Nur kostenlose',
      fallo: 'Verbindung fehlgeschlagen',
      probarMensaje: 'Nachricht testen',
      probarMensajeAyuda:
        'Sendet eine kurze, feste Nachricht, um zu prüfen, ob das Modell antwortet. Verbraucht einige wenige Tokens.',
      elegirModelo: 'Modell für die Nachricht',
      sinModelo: 'Testen Sie die Verbindung oder legen Sie ein Standardmodell fest, um eines auszuwählen.',
      enviando: 'Wird gesendet…',
      respuesta: (ms: number) => `Antwort in ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} Eingabe-Tokens, ${salida} Ausgabe-Tokens`,
      usar: 'In einem Projekt verwenden',
      editar: 'Bearbeiten',
      borrar: 'Löschen',
      acciones: (nombre: string) => `Aktionen für ${nombre}`,
    },
    costo: {
      titulo: 'Nachricht testen',
      texto: (modelo: string, proveedor: string) =>
        `Es wird eine kurze, feste Nachricht an das Modell ${modelo} von ${proveedor} gesendet. Dies verbraucht Tokens Ihres Kontos: Die Antwort ist auf 16 Tokens begrenzt und kostet in der Regel Bruchteile eines Cents.`,
      enviar: 'Nachricht senden',
    },
    dialogo: {
      nuevo: 'KI-Anbieter hinzufügen',
      editar: (nombre: string) => `${nombre} bearbeiten`,
      tipo: 'Typ',
      preset: 'Kompatibler Anbieter',
      presetAyuda: 'Füllt Name und URL aus; Sie können beides ändern.',
      presetOtro: 'Anderer',
      documentacion: 'Dokumentation ansehen',
      nombre: 'Name',
      urlBase: 'Basis-URL',
      urlAyuda: 'Leer = die offizielle URL. Nur https:// oder http:// an 127.0.0.1 bzw. [::1] (LM Studio).',
      urlObligatoria: 'Geben Sie die Basis-URL des kompatiblen Anbieters ein.',
      modelo: 'Standardmodell (optional)',
      modeloAyuda: 'Wird im .env-Block (AI_MODEL) und für die Testnachricht verwendet.',
      clave: 'API-Schlüssel',
      claveNueva: 'Schlüssel einfügen',
      claveGuardada: (final: string) =>
        `Ein Schlüssel ist gespeichert (${final}). Geben Sie nur dann einen anderen ein, wenn Sie ihn ersetzen möchten.`,
      claveAyuda:
        'Wird verschlüsselt auf diesem Computer gespeichert und nie wieder angezeigt. Es sind nur die letzten 4 Zeichen sichtbar.',
      claveOpcional: 'Optional für lokale Server (LM Studio).',
      borrarClave: 'Schlüssel löschen',
      guardar: 'Speichern',
      guardado: (nombre: string) => `${nombre} gespeichert`,
      urlCambiaTitulo: 'Der Schlüssel wird an eine andere URL gesendet',
      urlCambiaTexto: (url: string) =>
        `Dieser Anbieter hat einen gespeicherten Schlüssel. Ab jetzt wird er an ${url} gesendet. Bestätigen Sie nur, wenn Sie diesem Server vertrauen.`,
      urlCambiaConfirmar: 'Schlüssel an die neue URL senden',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Schlüssel von ${nombre} löschen?`,
      claveTexto:
        'Der Schlüssel wird von diesem Computer gelöscht. Die .env-Dateien, in die Sie ihn geschrieben haben, werden nicht angetastet: Ändern Sie ihn auch dort, wenn Sie ihn widerrufen.',
      proveedorTitulo: (nombre: string) => `${nombre} löschen?`,
      proveedorTexto:
        'Der Anbieter und sein gespeicherter Schlüssel werden gelöscht. Die .env-Dateien Ihrer Projekte werden nicht angetastet.',
      respaldos: (n: number) =>
        n === 1
          ? 'Auch die .env-Kopien von 1 Projekt löschen, die diesen Schlüssel im Klartext enthalten'
          : `Auch die .env-Kopien von ${n} Projekten löschen, die diesen Schlüssel im Klartext enthalten`,
      respaldosAyuda:
        'WolfCore Dev speichert vor dem Schreiben Kopien der .env-Datei außerhalb der Projekte. Das Löschen kann nicht rückgängig gemacht werden.',
      claveBorrada: 'Schlüssel gelöscht',
      proveedorBorrado: (nombre: string) => `${nombre} gelöscht`,
      respaldosBorrados: (n: number) => `Die .env-Kopien von ${n} Projekt(en) wurden gelöscht`,
    },
    env: {
      titulo: (nombre: string) => `${nombre} in einem Projekt verwenden`,
      proyecto: 'Projekt',
      sinProyectos: 'Es sind keine Projekte eingerichtet.',
      modelo: 'Modell (AI_MODEL)',
      modeloAyuda: 'Optional. Wählen Sie eines aus der Liste oder geben Sie es ein.',
      vista: 'Block, der in .env geschrieben wird (der Schlüssel wird maskiert angezeigt)',
      cargando: 'Vorschau wird vorbereitet…',
      textoPlano:
        'Der Schlüssel steht im Klartext in der .env-Datei des Projekts. Jeder mit Zugriff auf diesen Ordner kann ihn lesen.',
      copiaPrevia:
        'Die aktuelle .env-Datei wird vorher außerhalb des Projekts kopiert (im Datenordner von WolfCore Dev).',
      sinClave: 'Dieser Anbieter benötigt einen Schlüssel: Speichern Sie ihn, bevor Sie ihn in einem Projekt verwenden.',
      gitignoreFalta: 'Die .gitignore-Datei des Projekts ignoriert .env nicht.',
      gitignoreNoExiste: 'Das Projekt hat keine .gitignore-Datei.',
      gitignoreOk: 'Die .gitignore-Datei ignoriert .env bereits.',
      agregarGitignore: '.env zu .gitignore hinzufügen',
      gitignoreTitulo: '.gitignore bearbeiten',
      gitignoreTexto:
        'Die Zeile .env wird zur .gitignore-Datei des Projekts hinzugefügt (oder die Datei wird erstellt), inklusive vorheriger Kopie.',
      gitignoreConfirmar: 'Zu .gitignore hinzufügen',
      versionadoTitulo: 'Git verfolgt die .env-Datei dieses Projekts bereits',
      versionadoTexto:
        'Selbst wenn sie in .gitignore steht, würde der nächste Commit den Schlüssel hochladen. Entfernen Sie sie vor dem Schreiben aus dem Index und führen Sie einen Commit durch:',
      desconocidoTitulo: 'Es konnte nicht geprüft werden, ob Git die .env-Datei verfolgt',
      desconocidoTexto:
        'Git hat nicht geantwortet (nicht installiert oder der Ordner ist nicht als vertrauenswürdig eingestuft). Wenn die .env-Datei bereits im Repository liegt, würde der nächste Commit den Schlüssel hochladen. Prüfen Sie es mit:',
      aceptarVersionado: 'Ich verstehe das Risiko: Schlüssel trotzdem schreiben',
      aceptarTitulo: 'Schreiben, obwohl Git den Schlüssel hochladen könnte',
      aceptarTexto:
        'Wenn die .env-Datei im Repository liegt, landet der Schlüssel im nächsten Commit und in der Historie. Tun Sie dies nur, wenn Sie bereits git rm --cached .env ausgeführt haben oder das Repository nur Ihnen gehört.',
      aceptarConfirmar: 'Risiko akzeptieren',
      conflictoTitulo: 'Die .env-Datei definiert diese Variablen bereits mit einem anderen Wert',
      reemplazar: (claves: string) => `${claves} ersetzen`,
      reemplazarTitulo: 'Variablen in .env ersetzen',
      reemplazarTexto: (claves: string) =>
        `Die bereits in der .env-Datei vorhandenen Zeilen für ${claves} werden entfernt und durch den Block von WolfCore Dev ersetzt. Die vorherige .env-Datei wird zuvor kopiert.`,
      reemplazarConfirmar: 'Ersetzen',
      escribir: 'In .env schreiben',
      confirmarTitulo: 'Schlüssel im Klartext schreiben',
      confirmarTexto: (carpeta: string) =>
        `Der Schlüssel wird unverschlüsselt in ${carpeta} geschrieben. Teilen Sie diese Datei nicht und laden Sie sie nicht in ein Repository hoch.`,
      confirmar: 'Schlüssel schreiben',
      escrito: (proyecto: string) => `KI-Block in die .env-Datei von ${proyecto} geschrieben`,
      copiarComando: 'Befehl kopieren',
    },
  },
  iaLocal: {
    descripcion:
      'Sprachmodelle, die mit Ollama auf Ihrem Computer laufen. Verwenden Sie sie in Ihren Projekten, ohne Daten ins Internet zu senden.',
    sinInstalarTitulo: 'Ollama ist nicht installiert',
    sinInstalar: 'Installieren Sie es unter Dienste, um Modelle auf Ihrem Computer herunterzuladen und zu nutzen.',
    irAServicios: 'Zu Dienste wechseln',
    apagadoTitulo: 'Ollama ist ausgeschaltet',
    apagado: 'Schalten Sie es ein, um Modelle anzuzeigen, herunterzuladen und zu testen.',
    iniciando: 'Ollama wird gestartet…',
    errorTitulo: 'Ollama konnte nicht gestartet werden',
    encender: 'Ollama einschalten',
    verServicios: 'Unter Dienste anzeigen',
    modelos: 'Installierte Modelle',
    sinModelos: 'Es gibt noch keine Modelle. Laden Sie unten eines herunter.',
    errorModelos: 'Die Modellliste konnte nicht gelesen werden',
    recargar: 'Liste neu laden',
    total: (n: number) => plural(n, 'Modell', 'Modelle'),
    espacio: 'Belegter Speicherplatz',
    espacioAyuda: 'Der Speicherplatz, den alle Modelle im Datenordner belegen.',
    probarDe: (modelo: string) => `${modelo} testen`,
    borrarDe: (modelo: string) => `${modelo} löschen`,
    borrarTitulo: (modelo: string) => `Modell ${modelo} löschen?`,
    borrarTexto: (tamano: string) =>
      `Es werden ${tamano} Speicherplatz freigegeben. Um es wieder zu verwenden, müssen Sie es erneut herunterladen.`,
    borrado: (modelo: string) => `Modell ${modelo} gelöscht`,
    descargar: {
      titulo: 'Ein Modell herunterladen',
      campo: 'Modellname',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Geben Sie den von Ollama verwendeten Namen ein (ollama.com/library) oder wählen Sie einen Vorschlag.',
      sugerenciaAyuda: {
        'llama3.2': 'Allgemeiner Chat, leichtgewichtig',
        'qwen2.5-coder': 'Programmierung',
        mistral: 'Allgemeiner Chat',
        'nomic-embed-text': 'Embeddings für die Suche (Bots)',
      } as Record<string, string>,
      boton: 'Herunterladen',
      invalido: 'Verwenden Sie Buchstaben, Ziffern sowie . _ : / - (z. B. llama3.2)',
      yaInstalado: 'Dieses Modell ist bereits installiert',
      enCurso: 'Dieses Modell wird bereits heruntergeladen',
      confirmarTitulo: (modelo: string) => `${modelo} herunterladen?`,
      confirmarTexto:
        'Modelle sind oft mehrere GB groß (von 1 bis über 40 GB je nach Größe). Ollama teilt die Größe vor Beginn nicht mit: Sie sehen sie im Fortschrittsbalken und können jederzeit abbrechen.',
      confirmar: 'Herunterladen',
    },
    progreso: {
      fases: {
        preparando: 'Wird vorbereitet…',
        descargando: 'Wird heruntergeladen',
        verificando: 'Wird überprüft',
        guardando: 'Wird gespeichert',
        listo: 'Fertig',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} von ${total}`,
      cancelarDe: (modelo: string) => `Download von ${modelo} abbrechen`,
      cancelando: 'Wird abgebrochen…',
      listo: (modelo: string) => `${modelo} heruntergeladen`,
      cancelado: (modelo: string) => `Download von ${modelo} abgebrochen`,
      error: (modelo: string) => `${modelo} konnte nicht heruntergeladen werden`,
      descartar: 'Verwerfen',
      descartarDe: (modelo: string) => `Hinweis zu ${modelo} verwerfen`,
    },
    prueba: {
      titulo: 'Ein Modell testen',
      modelo: 'Modell',
      elegir: 'Modell wählen',
      prompt: 'Nachricht',
      placeholder: 'Geben Sie eine kurze Frage ein und drücken Sie Enter',
      enviar: 'Senden',
      respuesta: 'Antwort',
      pensando: 'Das Modell antwortet… beim ersten Mal kann es etwas dauern, während es geladen wird.',
      vacia: '(Das Modell hat keinen Text zurückgegeben.)',
      sinModelos: 'Laden Sie ein Modell herunter, um es zu testen.',
    },
    conexion: {
      titulo: 'Verbindung aus Ihren Projekten',
      base: 'Ollama-Basis-URL',
      openai: 'OpenAI-kompatibler Endpunkt',
      env: 'Block für die .env-Datei',
      envAyuda:
        'Geeignet für Laravel oder einen Bot mit FastAPI. WolfCore Dev schreibt nicht in Ihre Projekte.',
      copiarEnv: 'Block kopieren',
      copiarDato: (dato: string) => `${dato} kopieren`,
    },
    etapaB:
      'Hermes Agent, Claude Code und Codex können sich in Phase B mit einem Klick mit diesen Modellen verbinden.',
  },
  proyectos: {
    titulo: 'Projekte',
    descripcion:
      'Jedes Projekt ist ein Ordner mit seiner .test-Website, seinem Einrichtungsrezept und seinen Prozessen.',
    agregar: 'Projekt hinzufügen',
    vacioTitulo: 'Es gibt noch keine Projekte',
    vacio:
      'Klonen Sie ein GitHub-Repository oder wählen Sie einen Ordner: WolfCore Dev erkennt den Projekttyp und richtet es Schritt für Schritt ein.',
    pasos: {
      porTipo: {
        'composer-install': 'PHP-Abhängigkeiten installieren (composer install)',
        'env-crear': '.env-Datei erstellen',
        'key-generate': 'Anwendungsschlüssel generieren',
        'bd-crear': 'Datenbank erstellen',
        'bd-restaurar': 'Sicherung wiederherstellen',
        migrar: 'Datenbank migrieren',
        'storage-link': 'Storage verknüpfen (storage:link)',
        'npm-ci': 'Node-Abhängigkeiten installieren (npm ci)',
        'npm-build': 'Assets kompilieren (npm run build)',
        'python-venv': 'Virtuelle Umgebung erstellen (.venv)',
        'pip-install': 'Python-Abhängigkeiten installieren (pip)',
        'pgvector-activar': 'pgvector in der Datenbank aktivieren',
        'sitio-crear': 'Website erstellen',
        comando: 'Projektbefehl',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Website ${dominio} erstellen` : 'Website erstellen'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Sicherung ${archivo} wiederherstellen` : 'Sicherung wiederherstellen',
      migrar: 'Datenbank migrieren',
      migrarSemilla: 'Datenbank migrieren und Testdaten laden (--seed)',
      comando: (linea: string) => (linea ? `Ausführen: ${linea}` : 'Projektbefehl'),
    },
    estadoPaso: {
      pendiente: 'Ausstehend',
      corriendo: 'Läuft',
      listo: 'Fertig',
      error: 'Fehler',
      omitido: 'Übersprungen',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Nicht eingerichtet',
      corriendo: 'Wird eingerichtet…',
      lista: 'Eingerichtet',
      error: 'Ein Schritt ist fehlgeschlagen',
      cancelada: 'Einrichtung abgebrochen',
      incompleta: 'Einrichtung unvollständig',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Projekt hinzufügen',
      pestanas: { github: 'GitHub', url: 'Git-URL', carpeta: 'Ordner' },
      destino: 'Zielordner',
      destinoAyuda: (base: string) =>
        `Wird in ${base} geklont. Für einen anderen Speicherort verwenden Sie "Ordner wählen…".`,
      nombreCarpeta: 'Ordnername',
      nombrePlaceholder: 'mein-projekt',
      elegirDestino: 'Ordner wählen…',
      destinoPorDefecto: 'Projektordner verwenden',
      clonar: 'Klonen',
      clonando: 'Wird geklont…',
      clonado: 'Repository geklont',
      errorClonar: 'Das Repository konnte nicht geklont werden',
      sinCancelar:
        'Das Klonen kann von hier aus nicht abgebrochen werden: Warten Sie, bis es abgeschlossen ist (kann mehrere Minuten dauern).',
      sinGit: 'Git ist nicht installiert. Installieren Sie es (git-scm.com) und öffnen Sie diesen Dialog erneut.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Mit GitHub CLI verbunden als ${usuario}` : 'Mit GitHub CLI verbunden',
      estadoToken: 'Mit einem persönlichen Token verbunden',
      estadoNinguna: 'Keine Verbindung zu GitHub',
      ayudaNinguna:
        'Melden Sie sich mit der GitHub CLI an (empfohlen) oder verwenden Sie ein feingranulares persönliches Token mit Leseberechtigung für Inhalte.',
      instalarGh: 'GitHub CLI installieren',
      instalandoGh: 'GitHub CLI wird installiert…',
      ghInstalado: 'GitHub CLI installiert. Melden Sie sich nun an.',
      iniciarSesion: 'Anmelden',
      sesionAbierta:
        'Ein Anmeldefenster wurde geöffnet. Klicken Sie danach auf „Erneut prüfen“.',
      comprobar: 'Erneut prüfen',
      usarToken: 'Token verwenden',
      token: 'Persönliches GitHub-Token',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Wird verschlüsselt auf diesem Computer gespeichert und nie wieder angezeigt oder in Projekte geschrieben.',
      guardarToken: 'Token speichern',
      tokenGuardado: 'Token gespeichert',
      quitarToken: 'Token entfernen',
      tokenQuitado: 'Token entfernt',
      buscar: 'Repositories suchen',
      cargando: 'Repositories werden geladen…',
      sinRepos: 'Keine Repositories gefunden.',
      cargarMas: 'Mehr laden',
      privado: 'Privat',
      yaClonado: 'Bereits geklont',
      yaClonadoAyuda: 'Es gibt bereits ein Projekt mit diesem Repository oder im Zielordner.',
      actualizado: (fecha: string) => `Aktualisiert ${fecha}`,
      elegir: 'Auswählen',
      errorRepos: 'Die Repository-Liste konnte nicht gelesen werden',
    },
    url: {
      etiqueta: 'Repository-URL',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:ruta oder usuario/proyecto (GitHub). Ohne Benutzer oder Passwort in der URL.',
      invalida: 'Verwenden Sie https://…, git@host:ruta oder usuario/proyecto',
    },
    carpeta: {
      titulo: 'Bereits vorhandenes Projekt',
      texto: 'Wählen Sie den Ordner: Der Projekttyp wird erkannt und ein Rezept vorgeschlagen.',
      elegir: 'Ordner wählen',
      manual: 'Ohne Rezept hinzufügen (manuelle Konfiguration)',
      yaEsProyecto: (nombre: string) => `Dieser Ordner ist bereits das Projekt ${nombre}.`,
      vigilarTitulo: 'Überwachter Ordner',
      vigilarTexto:
        'WolfCore Dev informiert Sie, wenn ein neuer Ordner erscheint, der wie ein Projekt aussieht. Dort werden auch Repositories geklont.',
      vigilando: (carpeta: string) => `Überwacht ${carpeta}`,
      sinVigilar: 'Kein Ordner wird überwacht.',
      vigilar: 'Zu überwachenden Ordner wählen',
      cambiarVigilada: 'Ändern',
      dejarDeVigilar: 'Überwachung beenden',
    },
    asistente: {
      titulo: (nombre: string) => `${nombre} vorbereiten`,
      cargando: 'Projekt wird analysiert…',
      origenYml: 'Das Rezept stammt aus der wolfcore.yml des Repositories.',
      origenDefecto: 'Vorgeschlagenes Rezept gemäß Projekttyp.',
      deteccion: 'Erkannt',
      deteccionAyuda: 'Korrigieren Sie die Angaben, falls etwas nicht passt.',
      tipo: 'Typ',
      php: 'PHP',
      phpNinguno: 'Keines installiert',
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
      versionAuto: 'Automatisch erkannt',
      servicios: 'Dienste',
      serviciosNinguno: 'Keine',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Erkannt: ${v}`,
      nodeInstalar: 'Kein Node installiert: Installieren Sie es unter Dienste.',
      pythonInstalar: 'Kein Python installiert: Installieren Sie es unter Dienste.',
      lenguajeInstalar: (nombre: string) => `Kein ${nombre} installiert: Installieren Sie es unter Dienste.`,
      dominio: 'Domain',
      puertoProxy: 'Lokaler Port',
      puertoPlaceholder: '8000',
      receta: 'Schritte',
      recetaAyuda:
        'Werden der Reihe nach ausgeführt. Deaktivieren Sie unerwünschte; optionale lassen sich verschieben.',
      subir: 'Nach oben',
      bajar: 'Nach unten',
      fijo: 'Dieser Schritt ist erforderlich',
      restaurar: 'Sicherung wiederherstellen…',
      cambiarRespaldo: 'Sicherung ändern',
      quitarRespaldo: 'Sicherung entfernen',
      sobrescribir: 'Datenbank überschreiben, falls bereits Tabellen vorhanden sind',
      semilla: 'Testdaten laden (--seed)',
      sinMotor:
        'Keine Datenbank: Wählen Sie unter Dienste eine Engine zum Erstellen oder Wiederherstellen.',
      confio: 'Ich vertraue diesem Repository: Installationsschritte ausführen',
      confioAyuda:
        'Die Schritte führen Programme des Projekts (composer, npm, pip, Migrationen) auf Ihrem Computer aus. Nur aktivieren, wenn Sie den Code kennen.',
      montar: 'Projekt einrichten',
      montando: 'Projekt wird eingerichtet…',
      reintentar: 'Wiederholen',
      omitir: 'Überspringen',
      cancelar: 'Abbrechen',
      cancelando: 'Wird abgebrochen…',
      cerrar: 'Schließen',
      cerrarCorriendo: 'Ausblenden (läuft im Hintergrund weiter)',
      abrirSitio: 'Website öffnen',
      verRegistro: 'Protokoll anzeigen',
      ocultarRegistro: 'Protokoll ausblenden',
      listo: 'Das Projekt ist bereit.',
      fallo: (paso: string) => `Fehlgeschlagen: ${paso}. Wiederholen, überspringen oder abbrechen; nichts wurde rückgängig gemacht.`,
      cancelada: 'Einrichtung abgebrochen. Sie können sie über die Projektkarte fortsetzen.',
      incompleta: 'Es stehen noch Schritte aus.',
      errorCrear: 'Das Projekt konnte nicht erstellt werden',
      errorReceta: 'Das Rezept konnte nicht gelesen werden',
      recetaCambio:
        'Das Projektrezept (wolfcore.yml) hat sich seit Ihrem Vertrauen geändert. Wiederholen nutzt das zuletzt gespeicherte Rezept.',
      recargar: 'Neues Rezept prüfen',
      seguirGuardada: 'Mit gespeichertem fortfahren',
      soloLectura:
        'Typ, PHP, Domain, Versionen und Port stammen vom Projekt: Ändern Sie sie über Bearbeiten.',
    },
    tarjeta: {
      receta: 'Einrichtung',
      reinstalar: 'Abhängigkeiten neu installieren',
      reinstalarTitulo: (nombre: string) => `Rezept von ${nombre} ausführen?`,
      reinstalarTexto:
        'Die Schritte der letzten Einrichtung (wie im Assistenten geprüft) werden wiederholt:',
      noRestaura: 'wird nicht erneut wiederhergestellt',
      recetaCambio:
        'Das Projektrezept (wolfcore.yml) hat sich seit Ihrem Vertrauen geändert. Neu installieren wiederholt das gespeicherte; nutzen Sie „Rezept prüfen“ für das neue.',
      revisarReceta: 'Rezept prüfen',
      preparar: 'Vorbereiten…',
      ejecutar: 'Ausführen',
      verPreparacion: 'Einrichtung anzeigen',
      sinConfianza:
        'Prüfen Sie das Rezept und markieren Sie im Assistenten „Ich vertraue diesem Repository“, um es auszuführen.',
      runtimes: 'Versionshinweise',
      verRegistros: 'Protokolle anzeigen',
      abrirAgente: 'KI-Agent öffnen',
      vscode: 'Editor',
      vscodeAyuda: 'Projektordner im Standard-Editor öffnen',
      vscodeError: 'Der Editor konnte nicht geöffnet werden',
      baseDatos: 'Datenbank',
      baseDatosAyuda: (base: string) =>
        `Datenbank „${base}“ bereits angemeldet öffnen (Adminer oder phpMyAdmin)`,
      baseDatosSinDetectar: 'Projektdatenbank öffnen (Adminer oder phpMyAdmin)',
      sinBase: 'Die .env des Projekts nennt keine MySQL-, MariaDB- oder PostgreSQL-Datenbank.',
      adminerNoListo: 'Adminer ist nicht bereit',
      entradaAutomatica: 'Öffnet bereits angemeldet ohne Passworteingabe.',
      elegirBd: 'Adminer oder phpMyAdmin wählen',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (nur MySQL und MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin ist nicht bereit',
      entroComoAdmin: (usuario: string) =>
        `Als Serveradministrator ${usuario} angemeldet, da dieses Projekt keinen eigenen Benutzer hat. Im .env-Manager erstellt „Eigenen Benutzer verwenden“ einen auf diese Datenbank beschränkten Benutzer.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Als Serveradministrator ${usuario} angemeldet: Das Passwort des eigenen Projektbenutzers ist auf diesem Computer nicht gespeichert. Im .env-Manager erzeugt „Eigenen Benutzer verwenden“ ein neues.`,
      abrirSitio: 'Website im Browser öffnen',
      github: 'Repository',
      abrirRemoto: (url: string) => `${url} öffnen`,
      confiado: 'Vertraut',
      confiadoAyuda: 'Installationsschritte dürfen ausgeführt werden.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Losgelöster HEAD',
      cambios: (n: number) => plural(n, 'ungespeicherte Änderung', 'ungespeicherte Änderungen'),
      limpio: 'Keine Änderungen',
      atras: (n: number) => `${n} zum Abrufen`,
      adelante: (n: number) => `${n} zum Hochladen`,
      traer: 'Änderungen abrufen',
      traerAyuda: 'git pull ohne Merge: Bei lokalen Änderungen oder abweichenden Branches wird nichts berührt.',
      alDia: 'Bereits aktuell.',
      actualizado: 'Änderungen abgerufen',
      sugeridosTitulo: 'Änderungen abgerufen',
      sugeridosTexto: 'Je nach Änderungen empfiehlt es sich, diese Schritte auszuführen:',
      sugeridosNinguno: 'Es müssen keine Schritte ausgeführt werden.',
      migracionesNuevas: (n: number) => plural(n, 'neue Migration', 'neue Migrationen'),
      ejecutarSugeridos: 'Schritte ausführen',
      corridaTitulo: 'Schritte nach dem Abruf',
      corridaAyuda: 'Ändert das gespeicherte Projektrezept nicht.',
      ahoraNo: 'Jetzt nicht',
      errorEstado: 'Git-Status konnte nicht gelesen werden',
      commitIa: {
        boton: 'Commit vorschlagen',
        ayuda:
          'Schlägt per KI eine Nachricht für vorgemerkte Änderungen (git add) vor und erstellt den Commit nach Ihrer Zustimmung.',
        titulo: 'Commit mit vorgeschlagener Nachricht',
        proveedor: 'KI-Anbieter',
        modelo: 'Modell',
        sinProveedores:
          'Konfigurieren Sie einen Cloud-KI-Anbieter (Bereich KI), um Nachrichten vorzuschlagen.',
        privacidad:
          'Gesendet wird der Diff der vorgemerkten Änderungen ohne .env, Schlüssel, Zertifikate, Zugangsdateien oder Binärdateien (maximal 20 000 Zeichen). Verbraucht wenige Token.',
        sugerir: 'Nachricht vorschlagen',
        mensaje: 'Nachricht (bearbeitbar)',
        commit: 'Commit erstellen',
        commitAyuda: 'Nur vorgemerkte Änderungen (git add): fügt keine Dateien hinzu und führt kein Push aus.',
        hecho: 'Commit für vorgemerkte Änderungen erstellt.',
      },
    },
    procesos: {
      titulo: 'Prozesse',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Ohne Fehler beendet',
      ninguno: 'Keine Prozesse. Fügen Sie npm run dev, queue:work, uvicorn… hinzu.',
      agregar: 'Prozess hinzufügen',
      editar: 'Prozess bearbeiten',
      nuevo: 'Neuer Prozess',
      interruptor: (nombre: string) => `${nombre} starten oder stoppen`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx leitet die Website an diesen Prozess weiter.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'Neustart', 'Neustarts'),
      verLog: 'Log anzeigen',
      ocultarLog: 'Log ausblenden',
      logVacio: 'Noch keine Ausgabe.',
      abrirCarpetaLog: 'Log-Ordner öffnen',
      quitar: 'Prozess entfernen',
      quitarTitulo: (nombre: string) => `Prozess ${nombre} entfernen?`,
      quitarTexto: 'Falls er läuft, wird er gestoppt.',
      nombre: 'Name',
      nombrePlaceholder: 'Vite',
      comando: 'Befehl',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Programm und Argumente, ohne Shell. Nutzen Sie Anführungszeichen für Argumente mit Leerzeichen.',
      cwd: 'Ordner',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz oder ein Unterordner des Projekts (z. B. frontend).',
      puertoCampo: 'Port',
      puertoNinguno: 'Keiner',
      puertoAyuda: 'Nur informativ, außer der Prozess ist das Ziel des Proxys.',
      autoIniciar: 'Beim Start von WolfCore Dev starten',
      reiniciar: 'Bei Absturz neu starten',
      esProxy: 'Ziel des Nginx-Proxys',
      requiereReinicio:
        'Der Prozess läuft: Änderungen an Befehl, Ordner oder Port greifen erst nach einem Neustart.',
      reinicieAhora: 'Gespeichert. Stoppen und starten Sie den Prozess neu, um die Änderungen anzuwenden.',
      guardado: 'Prozess gespeichert',
      errores: {
        comando: 'Geben Sie den Befehl ein',
        puerto: 'Der Port muss zwischen 1 und 65535 liegen',
        proxySinPuerto: 'Das Proxy-Ziel benötigt einen Port',
        cwd: 'Verwenden Sie raiz oder einen Unterordner im Projekt',
        repetido: 'Es gibt bereits einen Prozess mit diesem Namen',
      },
      estados: {
        encendido: 'Aktiv',
        apagado: 'Gestoppt',
        iniciando: 'Startet…',
        error: 'Fehler',
        externo: 'Extern',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Protokolle von ${nombre}`,
      fuente: 'Quelle',
      ninguna: 'Dieses Projekt hat noch keine Protokolle.',
      vacio: 'Das Protokoll ist leer.',
      actualizar: 'Aktualisieren',
      abrirCarpeta: 'Ordner öffnen',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Ein neuer Ordner sieht wie ein Projekt aus'
          : `${n} neue Ordner sehen wie Projekte aus`,
      montar: 'Einrichten',
      ignorar: 'Ignorieren',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Ungelesene E-Mails',
    correoApagado: 'Mailpit gestoppt',
    correoSinInstalar: 'Mailpit nicht installiert',
    modelos: 'KI-Modelle',
    iaApagada: 'Ollama gestoppt',
    iaSinInstalar: 'Ollama nicht installiert',
    sinLeer: 'Konnte nicht gelesen werden',
    sinDato: '—',
  },
  /* ───────────── Panel de rendimiento, visor de registros y MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'Min.',
    horas: 'Std.',
    dias: 'T',
    /** Trabajador N de un servicio (p. ej. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Leistung',
    ventana: 'Letzte 5 Minuten',
    pausado: 'Pausiert, solange das Fenster ausgeblendet ist',
    esperando: 'Warte auf erste Messung…',
    errorMuestreo: (detalle: string) => `Leistungsmessung konnte nicht angefordert werden: ${detalle}`,
    cpu: 'CPU',
    ram: 'Arbeitsspeicher',
    disco: 'Datenträger',
    red: 'Netzwerk',
    deTotal: (usado: string, total: string) => `${usado} von ${total}`,
    libre: (libre: string) => `${libre} frei`,
    bajada: 'Download',
    subida: 'Upload',
    graficaCpu: (valor: string) => `CPU-Verlauf der letzten 5 Minuten; aktuell ${valor}`,
    graficaRam: (valor: string) => `Speicherverlauf der letzten 5 Minuten; aktuell ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Netzwerkverlauf der letzten 5 Minuten; Download ${bajada}, Upload ${subida}`,
    alertas: {
      titulo: 'Warnungen',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Port ${puerto} von ${servicio} wird von einem anderen Programm genutzt: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Der Arbeitsspeicher ist zu ${porcentaje} % ausgelastet. Stoppen Sie Ungenutztes für bessere Leistung.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Ein fremder php-cgi-Prozess (PID ${pid}) lauscht auf ${puertos.join(', ')}: Überbleibsel einer früheren Sitzung.`,
      finalizar: 'Prozess beenden',
      finalizarTitulo: 'Diesen Prozess beenden?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) wird ohne Speichern geschlossen. Nur verwenden, wenn Sie sicher sind, dass das Programm nicht benötigt wird.`,
      finalizado: (nombre: string) => `${nombre} beendet`,
      verPuertos: 'Ports anzeigen',
      errorPuertos: 'Es konnte nicht geprüft werden, welche Programme Ports nutzen.',
    },
    procesos: {
      titulo: 'Dienste und Prozesse',
      vacio: 'Keine Dienste oder Projektprozesse aktiv.',
      nombre: 'Name',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Port',
      encendido: 'Aktiv',
      acciones: 'Aktionen',
      detener: 'Stoppen',
      registros: 'Protokolle',
      servicio: 'Dienst',
      proyecto: 'Projekt',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Protokolle',
    descripcion:
      'Verfolgen Sie live die Protokolle von Nginx, PHP, Diensten, Websites, Projektprozessen und Tunneln.',
    fuente: 'Quelle',
    elegirFuente: 'Protokoll wählen',
    sinFuentes:
      'Noch keine Protokolle vorhanden. Sie erscheinen, sobald ein Dienst, eine Website oder ein Prozess schreibt.',
    buscar: 'Nach Text filtern',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pausieren',
    reanudar: 'Fortsetzen',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 neue Zeile pausiert' : `${n} neue Zeilen pausiert`,
    copiar: 'Sichtbares kopieren',
    copiadas: (n: number) => (n === 1 ? '1 Zeile kopiert' : `${n} Zeilen kopiert`),
    limpiar: 'Leeren',
    abrirCarpeta: 'Ordner öffnen',
    alFinal: 'Ende folgen',
    mostrarMas: 'Mehr anzeigen',
    ocultas: (n: number) =>
      n === 1 ? '1 vorherige Zeile ausgeblendet' : `${n} vorherige Zeilen ausgeblendet`,
    vacio: 'Noch keine Zeilen. Neue erscheinen hier sofort beim Schreiben.',
    sinCoincidencias: 'Keine Zeile entspricht dem Filter.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} Zeilen` : `${visibles} von ${total} Zeilen`,
    descartadas: (n: number) => `(die letzten 5000 werden behalten; ${n} ältere verworfen)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Dienste',
      sitio: 'Websites',
      laravel: 'Laravel',
      proyecto: 'Projektprozesse',
      tunel: 'Tunnel',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (Zugriff)',
      nginxError: 'Nginx (Fehler)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (Zugriff)`,
      sitioError: (dominio: string) => `${dominio} (Fehler)`,
      tunel: (sitio: string) => `Tunnel von ${sitio}`,
      tunelSalida: (sitio: string) => `Tunnel von ${sitio} (Ausgabe)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Öffnen Sie ein neues Terminal für die Änderung: Offene Terminals sehen sie nicht.',
    enPathSinCliente: 'Im PATH, aber der Befehl fehlt',
    reparar: 'Reparieren',
    repararTitulo: 'Befehl wolf reparieren?',
    repararTexto:
      'wolf steht im PATH, aber seine Dateien sind unvollständig. Sie werden erneut in den Datenordner kopiert und der lokale Server wird gestartet.',
    titulo: 'Terminal: Befehl wolf',
    descripcion:
      'Steuert WolfCore Dev aus PowerShell, cmd oder Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Funktioniert nur bei geöffneter App.',
    activo: 'Im PATH verfügbar',
    enPathSinServidor: 'Im PATH, Server gestoppt',
    inactivo: 'Nicht im PATH',
    agregarBoton: 'wolf zum PATH hinzufügen',
    quitarBoton: 'wolf aus PATH entfernen',
    agregarTitulo: 'wolf zum Benutzer-PATH hinzufügen?',
    agregarTexto:
      'Der Befehl wolf wird in den Datenordner von WolfCore Dev kopiert, dieser Ordner wird dem Benutzer-PATH hinzugefügt (eine Sicherung des alten PATH wird erstellt) und ein lokaler Server auf 127.0.0.1 gestartet, der wolf nur mit einem bei jedem Start neuen Schlüssel bedient. Das Veröffentlichen im Internet oder Ändern des globalen PHP erfordert immer zusätzlich eine Bestätigung im App-Fenster. Sie können ihn jederzeit entfernen.',
    agregar: 'Hinzufügen',
    quitarTitulo: 'wolf aus dem PATH entfernen?',
    quitarTexto:
      'Der wolf-Ordner wird aus Ihrem Benutzer-PATH entfernt, der lokale Server gestoppt und der kopierte Befehl gelöscht. Offene Terminals bleiben unverändert.',
    quitar: 'Entfernen',
    listoTitulo: 'Befehl wolf aktualisiert',
    ayuda: 'Öffnen Sie nach dem Hinzufügen ein neues Terminal. Der Server lauscht nur auf 127.0.0.1.',
    aislado: 'Mit einem Testdatenordner (WOLFCORE_DATOS) wird der PATH nicht geändert.',
    errorCargar: (detalle: string) => `Status von wolf konnte nicht gelesen werden: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP-Server',
    descripcion:
      'Ermöglicht Claude Code und anderen Assistenten die Verwaltung Ihrer Websites, Dienste und Datenbanken auf diesem Computer. Lauscht nur auf 127.0.0.1 und erfordert ein Token.',
    estado: 'Status',
    activo: 'Aktiv',
    inactivo: 'Gestoppt',
    activar: 'Aktivieren',
    detener: 'Stoppen',
    activado: 'MCP-Server aktiv',
    detenido: 'MCP-Server gestoppt',
    direccion: 'Adresse',
    puerto: 'Port',
    puertoAyuda: 'Zwischen 1024 und 65535. Falls aktiv, erfolgt ein Neustart auf dem neuen Port.',
    puertoRango: 'Verwenden Sie eine Zahl zwischen 1024 und 65535',
    puertoGuardado: (p: number) => `Der MCP-Server verwendet Port ${p}`,
    copiarConfig: 'Konfiguration für Claude Code kopieren',
    copiarConfigAyuda:
      'Kopiert die Konfiguration inklusive Token in die Zwischenablage. Fügen Sie sie in Claude Code ein; das Token wird hier nicht angezeigt.',
    configCopiada: 'Konfiguration in Zwischenablage kopiert',
    regenerar: 'Token neu erzeugen',
    regenerarTitulo: 'Token des MCP-Servers neu erzeugen?',
    regenerarTexto:
      'Das aktuelle Token wird sofort ungültig: Verbundene Assistenten müssen die neue Konfiguration übernehmen.',
    regenerado: 'Token neu erzeugt. Kopieren Sie die Konfiguration erneut.',
    errorCargar: (detalle: string) => `Status des MCP-Servers konnte nicht gelesen werden: ${detalle}`,
    confirmacion: {
      titulo: 'Ein Assistent bittet um Bestätigung',
      herramienta: 'Werkzeug',
      pendientes: (actual: number, total: number) => `${actual} von ${total}`,
      aprobar: 'Genehmigen',
      rechazar: 'Ablehnen',
      aprobada: 'Aktion genehmigt',
      rechazada: 'Aktion abgelehnt',
      vencida: 'Die Anfrage war nicht mehr ausstehend.',
      descartadas: (n: number) =>
        n === 1
          ? 'und 1 weitere, die keinen Platz fand (läuft automatisch ab)'
          : `und ${n} weitere, die keinen Platz fanden (laufen automatisch ab)`,
      falloRespuesta: (detalle: string) =>
        `Antwort konnte nicht gesendet werden; Anfrage bleibt ausstehend. ${detalle}`,
      si: 'Ja',
      no: 'Nein',
      campos: {
        motor: 'Engine',
        base: 'Datenbank',
        archivo: 'Datei',
        sobrescribir: 'Überschreiben',
        pid: 'PID',
        nombre: 'Prozess',
        proyecto: 'Projekt',
        pasos: 'Schritte',
        cantidad: 'Dumps',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Alltagswerkzeuge. Funktionieren offline und ohne externe Dienste.',
    buscar: 'Werkzeug suchen…',
    sinResultados: 'Kein Werkzeug entspricht der Suche.',
    abrir: 'Öffnen',
    procesar: 'Verarbeitung…',
    copiar: 'Kopieren',
    copiado: 'In Zwischenablage kopiert',
    limpiar: 'Leeren',
    pendienteApi: 'Ausstehend: Der Kern stellt diese Information der Oberfläche noch nicht bereit.',
    lista: {
      qr: { nombre: 'QR-Generator', descripcion: 'Aus Text oder einem Tunnel-Link; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Formatieren, prüfen und minimieren mit Baumansicht.' },
      regex: {
        nombre: 'Reguläre Ausdrücke',
        descripcion: 'Tester mit Treffern, Gruppen und Kurzreferenz.',
      },
      diff: {
        nombre: 'Texte vergleichen',
        descripcion: 'Unterschiede nebeneinander, auch für Dateien.',
      },
      tiempo: { nombre: 'Zeit', descripcion: 'Timestamp ↔ Datum mit Zeitzone.' },
      puertos: {
        nombre: 'Ports und Prozesse',
        descripcion: 'Prüfen, was auf jedem Port lauscht, und Prozesse beenden.',
      },
      bom: { nombre: 'UTF-8-BOM-Bereinigung', descripcion: 'Entfernt BOM aus Dateien oder Ordnern.' },
      certificados: {
        nombre: 'Zertifikate',
        descripcion: 'Mit der WolfCore Dev-CA für beliebige Namen ausstellen.',
      },
      cripto: {
        nombre: 'Krypto',
        descripcion: 'Hash, Base64, URL, UUID, Passwörter und JWT.',
      },
      markdown: { nombre: 'Markdown-Vorschau', descripcion: 'Schreiben und Ergebnis direkt sehen.' },
      entorno: { nombre: 'Systemumgebung', descripcion: 'PATH, Versionen und Variablen.' },
      buscar: {
        nombre: 'Suchen',
        descripcion: 'Text in Namen und Inhalten eines Projekts, Ordners oder einer Datei.',
      },
      infoArchivo: {
        nombre: 'Dateiinformationen',
        descripcion: 'Größe, Typ und Prüfsummen einer Datei.',
      },
      websocket: { nombre: 'WebSocket-Client', descripcion: 'Verbinden, senden und Nachrichten anzeigen.' },
      contrasenas: {
        nombre: 'Passwörter',
        descripcion: 'Passwortstärke prüfen und schwache Konten in Datenbanken finden.',
      },
      qrWifi: {
        nombre: 'WLAN-QR',
        descripcion: 'QR-Code zum Verbinden anderer Geräte mit Ihrem Netzwerk.',
      },
      imagenes: {
        nombre: 'Bilder',
        descripcion: 'In ICO oder PNG umwandeln und JPEG oder WebP komprimieren.',
      },
      comprimir: {
        nombre: 'ZIP und PDF',
        descripcion: 'Dateien und Ordner als ZIP packen und PDFs optimieren.',
      },
      conversor: {
        nombre: 'Dokumentkonverter',
        descripcion: 'Word, Excel, PDF, CSV und Markdown lokal auf diesem Computer konvertieren.',
      },
    },
    errores: {
      jsonVacio: 'Geben Sie JSON ein oder fügen Sie es ein.',
      jsonInvalido: (linea: number, columna: number) =>
        `Ungültiges JSON: Prüfen Sie Zeile ${linea}, Spalte ${columna}.`,
      banderas: 'Ungültige Flags: Verwenden Sie nur d, g, i, m, s, u, v oder y ohne Wiederholung.',
      regex: (detalle: string) => `Ungültiger Ausdruck (${detalle}).`,
      trabajador: 'Die Hintergrundoperation konnte nicht ausgeführt werden.',
      diffLento: 'Die Texte sind zu unterschiedlich für einen rechtzeitigen Vergleich.',
      base64: 'Ungültiges Base64.',
      utf8: 'Der dekodierte Inhalt ist kein gültiger UTF-8-Text.',
      url: 'Ungültige URL-Sequenz.',
      coste: (max: number) => `Die bcrypt-Kosten müssen zwischen 4 und ${max} liegen.`,
      jwtPartes: 'Ein JWT muss drei durch Punkte getrennte Teile haben.',
      jwtCabecera: 'Der JWT-Header konnte nicht gelesen werden.',
      jwtCarga: 'Die JWT-Payload konnte nicht gelesen werden.',
      longitud: 'Die Länge muss zwischen 4 und 256 liegen.',
      sinConjuntos: 'Wählen Sie mindestens eine Zeichenart.',
      sinDominios: 'Geben Sie mindestens einen Namen oder eine IP ein.',
      muchosDominios: (max: number) => `Höchstens ${max} Namen pro Zertifikat.`,
    },
    qr: {
      texto: 'Text oder URL',
      textoAyuda: 'Der QR-Code wird lokal erzeugt; nichts verlässt diesen Computer.',
      tunel: 'Tunnel-Link eines Projekts',
      sinTuneles: 'Keine aktiven Tunnel',
      descargar: 'PNG herunterladen',
      vacio: 'Geben Sie etwas ein, um den Code zu erzeugen.',
      largo: 'Der Text ist zu lang für einen QR-Code.',
      descargado: 'Download gestartet.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formatieren',
      minificar: 'Minimieren',
      validar: 'Prüfen',
      valido: 'Gültiges JSON.',
      resultado: 'Ergebnis',
      arbol: 'Baum',
      mas: (n: number) => `… ${n} weitere`,
    },
    regex: {
      patron: 'Muster',
      banderas: 'Flags',
      texto: 'Testtext',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'Treffer' : 'Treffer'}${truncado ? ' (nur die ersten angezeigt)' : ''}`,
      sinCoincidencias: 'Keine Treffer.',
      tiempo: 'Der Ausdruck dauerte zu lange und wurde gestoppt (mögliches katastrophales Backtracking).',
      grupo: (n: number) => `Gruppe ${n}`,
      referencia: 'Kurzreferenz',
      tabla: [
        ['.', 'Beliebiges Zeichen (außer Zeilenumbruch ohne s)'],
        ['\\d \\w \\s', 'Ziffer, Buchstabe/Zahl/_ und Leerzeichen'],
        ['\\D \\W \\S', 'Das Gegenteil der obigen'],
        ['[abc] [^abc]', 'Eines aus der Liste / keines aus der Liste'],
        ['^ $', 'Anfang und Ende (einer Zeile mit m)'],
        ['\\b', 'Wortgrenze'],
        ['* + ?', 'Null oder mehr, eins oder mehr, optional'],
        ['{n,m}', 'Zwischen n und m Wiederholungen'],
        ['*? +?', 'Genügsame (lazy) Variante'],
        ['(…) (?<nombre>…)', 'Erfassungsgruppe und benannte Gruppe'],
        ['(?:…)', 'Nicht erfassende Gruppe'],
        ['(?=…) (?!…)', 'Gefolgt von / nicht gefolgt von'],
        ['a|b', 'Alternative'],
        ['g i m s u y', 'Global, Groß-/Kleinschreibung egal, mehrzeilig, DotAll, Unicode, Sticky'],
      ] as [string, string][],
    },
    diff: {
      original: 'Original',
      modificado: 'Geändert',
      cargarArchivo: 'Datei laden',
      comparar: 'Vergleichen',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} Zeilen`,
      iguales: 'Die Texte sind identisch.',
      archivoGrande: 'Die Datei ist größer als 5 MB; wählen Sie eine kleinere.',
      textoGrande: 'Jeder Text darf höchstens 5 MB groß sein.',
      truncado: (mostradas: number, total: number) =>
        `Es werden die ersten ${mostradas} von ${total} Zeilen angezeigt.`,
    },
    tiempo: {
      timestamp: 'Timestamp (Sekunden oder Millisekunden)',
      fecha: 'Datum (JJJJ-MM-TT HH:mm:ss)',
      zona: 'Zeitzone',
      ahora: 'Jetzt',
      segundos: 'Sekunden',
      milisegundos: 'Millisekunden',
      iso: 'ISO 8601 (UTC)',
      enZona: 'In gewählter Zeitzone',
      desplazamiento: 'Versatz',
      relativo: 'Relativ',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Als Sekunden gelesen' : 'Als Millisekunden gelesen',
      timestampInvalido: 'Geben Sie nur Ziffern ein (Vorzeichen erlaubt).',
      fechaInvalida: 'Verwenden Sie das Format JJJJ-MM-TT HH:mm[:ss] mit einem gültigen Datum.',
      zonaInvalida: 'Unbekannte Zeitzone.',
    },
    puertos: {
      filtro: 'Nach Port, PID oder Name filtern',
      actualizar: 'Aktualisieren',
      columnas: {
        puerto: 'Port',
        protocolo: 'Protokoll',
        proceso: 'Prozess',
        pid: 'PID',
        direcciones: 'Adressen',
        acciones: 'Aktionen',
      },
      propio: 'WolfCore Dev',
      sistema: 'System',
      finalizar: 'Beenden',
      noFinalizable: 'Systemprozesse und Prozesse von WolfCore Dev werden hier nicht beendet.',
      confirmarTitulo: 'Prozess beenden',
      confirmarTexto: (nombre: string, pid: number) =>
        `„${nombre}“ (PID ${pid}) wird ohne Speichern geschlossen. Geben Sie zur Bestätigung den Prozessnamen ein:`,
      finalizado: (nombre: string) => `${nombre} wurde beendet.`,
      vacio: 'Keine Ports belegt oder sie konnten nicht gelesen werden.',
    },
    bom: {
      explicacion:
        'Zuerst werden alle Dateien mit BOM angezeigt; beim Bereinigen wird jeweils eine .bak-bom-Sicherung erstellt. node_modules, vendor, .git und Binärdateien werden übersprungen.',
      elegirArchivos: 'Dateien wählen',
      elegirCarpeta: 'Ordner wählen',
      seleccion: (n: number) => `${n} ${n === 1 ? 'Pfad gewählt' : 'Pfade gewählt'}`,
      analizar: 'Analysieren',
      limpiar: 'BOM entfernen',
      confirmar: (n: number) =>
        `BOM wird aus ${n} ${n === 1 ? 'Datei' : 'Dateien'} entfernt (mit Sicherung). Fortfahren?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'Datei mit BOM' : 'Dateien mit BOM'}`,
      sinBom: 'Keine Datei enthält ein BOM.',
      limpiados: (n: number) => `${n} ${n === 1 ? 'Datei' : 'Dateien'} bereinigt.`,
      copia: 'Sicherung',
    },
    certificados: {
      explicacion:
        'Signiert ein Zertifikat mit der lokalen CA von WolfCore Dev. Die .crt-Datei wird am gewählten Ort gespeichert und der Schlüssel (.key) daneben; der Schlüssel läuft nie über die Oberfläche.',
      dominios: 'Namen oder IPs (durch Leerzeichen, Komma oder Zeile getrennt)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Ausstellen und speichern',
      guardado: 'Zertifikat gespeichert',
      certificado: 'Zertifikat',
      clave: 'Schlüssel',
    },
    cripto: {
      texto: 'Text',
      hash: 'Hash',
      calcular: 'Berechnen',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt-Kosten',
      bcryptTrunca: 'bcrypt nutzt nur die ersten 72 Bytes des Textes.',
      bcryptVerificar: 'bcrypt-Hash zum Prüfen',
      verificar: 'Prüfen',
      coincide: 'Der Text stimmt mit dem Hash überein.',
      noCoincide: 'Der Text stimmt nicht mit dem Hash überein.',
      base64: 'Base64',
      base64Url: 'URL-Variante',
      codificar: 'Kodieren',
      decodificar: 'Dekodieren',
      url: 'URL kodieren',
      decodificarUrl: 'URL dekodieren',
      codificarBase64: 'Base64 kodieren',
      decodificarBase64: 'Base64 dekodieren',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID und Passwörter',
      uuid: 'UUID v4',
      generar: 'Erzeugen',
      generarDiez: '10 erzeugen',
      contrasena: 'Zufälliges Passwort',
      longitud: 'Länge',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Symbole',
      jwt: 'JWT dekodieren',
      jwtToken: 'Token',
      cabecera: 'Header',
      carga: 'Payload',
      firmaNoVerificada:
        'Signatur nicht geprüft: Der Inhalt wird unverändert angezeigt und könnte manipuliert sein.',
      vencido: 'Das Token ist abgelaufen (exp).',
      vigente: 'Das Token ist noch gültig (exp).',
      salida: 'Ergebnis',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Vorschau',
      ejemplo:
        '# Titel\n\nText mit **fett**, _kursiv_ und einem [Link](https://example.com).\n\n- Eins\n- Zwei\n\n```\nCode\n```\n',
      seguro:
        'Rohes HTML wird als Text angezeigt, unsichere Links werden entfernt und Bilder nicht geladen.',
      imagenOmitida: (alt: string) => `[Bild${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Version von WolfCore Dev',
      navegador: 'Oberflächen-Engine',
      plataforma: 'Plattform',
      idioma: 'Sprache',
      zona: 'Zeitzone',
      nucleos: 'Logische Kerne',
      actualizar: 'Aktualisieren',
      path: 'PATH',
      pathVacio: 'Der PATH ist leer.',
      herramientas: 'Werkzeuge von WolfCore Dev',
      noInstalada: 'Nicht installiert',
      sinRespuesta: 'Keine rechtzeitige Antwort',
      variables: 'Umgebungsvariablen',
      filtro: 'Variablen filtern',
      enmascarada: 'Wert verborgen: Der Name deutet auf ein Geheimnis hin.',
    },
    busqueda: {
      explicacion:
        'Sucht in Dateinamen und Inhalten ohne Links zu folgen oder Binärdateien zu lesen. Überspringt standardmäßig node_modules, vendor und .git.',
      origen: 'Wo suchen',
      proyecto: 'Projekt',
      elegirCarpeta: 'Ordner wählen',
      elegirArchivo: 'Datei wählen',
      sinOrigen: 'Wählen Sie ein Projekt, einen Ordner oder eine Datei.',
      consulta: 'Suchtext',
      modoNombre: 'Namen',
      modoContenido: 'Inhalt',
      modoAmbos: 'Beides',
      regex: 'Regulärer Ausdruck',
      mayusculas: 'Groß-/Kleinschreibung beachten',
      incluir: 'Nur Dateien (kommagetrennt, z. B. *.php)',
      excluir: 'Überspringen (kommagetrennt)',
      buscar: 'Suchen',
      cancelar: 'Abbrechen',
      buscando: 'Suche läuft…',
      sinResultados: 'Keine Treffer.',
      truncado: 'Es gibt mehr Treffer als angezeigt: Grenzen Sie die Suche ein.',
      cancelada: 'Suche abgebrochen.',
      abrir: 'Im Editor öffnen',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'Treffer' : 'Treffer'}`,
      resumen: (archivos: number, examinados: number) =>
        `in ${archivos} ${archivos === 1 ? 'Datei' : 'Dateien'} (${examinados} geprüft)`,
    },
    infoArchivo: {
      elegir: 'Datei wählen',
      ayuda: 'Wird lokal zum Berechnen der Prüfsummen gelesen (maximal 200 MB).',
      nombre: 'Name',
      tamano: 'Größe',
      tipo: 'Typ',
      modificado: 'Geändert',
      sinTipo: 'Unbekannt',
      grande: 'Die Datei ist größer als 200 MB: Daten werden ohne Prüfsummen angezeigt.',
      calculando: 'Prüfsummen werden berechnet…',
    },
    websocket: {
      url: 'URL (ws:// oder wss://)',
      conectar: 'Verbinden',
      desconectar: 'Trennen',
      mensaje: 'Nachricht',
      enviar: 'Senden',
      urlInvalida: 'Geben Sie eine URL an, die mit ws:// oder wss:// beginnt.',
      conectando: 'Verbindung wird hergestellt…',
      conectado: 'Verbunden',
      desconectado: 'Getrennt',
      error: 'Verbindungsfehler',
      cerrado: (codigo: number, motivo: string) =>
        `Geschlossen (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Gesendet',
      recibido: 'Empfangen',
      binario: (n: number) => `[binär, ${n} Bytes]`,
      vacio: 'Noch keine Nachrichten.',
      tope: 'Die letzten 500 Nachrichten werden gespeichert; jede wird bis 10 KB angezeigt.',
    },
    qrWifi: {
      ssid: 'Netzwerkname (SSID)',
      clave: 'Passwort',
      seguridad: 'Sicherheit',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Ohne Passwort',
      oculta: 'Verstecktes Netzwerk',
      mostrar: 'Anzeigen',
      ocultar: 'Ausblenden',
      aviso:
        'Der QR-Code enthält das Passwort im Klartext: Jeder, der ihn sieht oder abfotografiert, kann sich mit Ihrem Netzwerk verbinden. Er wird lokal erzeugt, nicht gespeichert und beim Schließen gelöscht.',
      avisoPng:
        'Auch das heruntergeladene PNG enthält das Passwort im Code: Bewahren Sie es sicher auf.',
      escribala:
        'Sie geben das Passwort selbst ein: WolfCore Dev liest niemals gespeicherte WLAN-Passwörter aus dem System.',
      errorSsid: 'Geben Sie den Netzwerknamen ein (maximal 32 Zeichen).',
      errorClave: 'Geben Sie das Passwort ein.',
      errorClaveWpa: 'Ein WPA-Passwort hat zwischen 8 und 63 Zeichen.',
      vacio: 'Füllen Sie die Daten aus, um den Code zu sehen.',
      alt: 'QR-Code zur Verbindung mit dem WLAN',
      descargar: 'PNG herunterladen',
      descargado: 'QR-Code gespeichert',
      largo: 'Die Daten sind zu lang für einen QR-Code.',
    },
    imagenes: {
      elegir: 'Bild wählen',
      ayuda:
        'Wird lokal verarbeitet (bis 30 MB und 12000 px pro Seite). Das Original bleibt unverändert: Es entsteht eine neue Datei.',
      original: 'Original',
      accion: 'Aktion',
      aIco: 'In ICO umwandeln',
      aPng: 'In PNG umwandeln',
      comprimir: 'Komprimieren',
      tamanos: 'ICO-Größen',
      formato: 'Format',
      calidad: 'Qualität',
      ladoMax: 'Maximale Seitenlänge in px (leer = Original)',
      procesar: 'Verarbeiten',
      procesando: 'Verarbeitung…',
      guardar: 'Speichern unter…',
      antes: 'Vorher',
      despues: 'Nachher',
      sinMejora: 'Das Ergebnis ist nicht kleiner als das Original: Probieren Sie eine andere Qualität oder ein anderes Format.',
      errorAbrir: 'Das Bild konnte auf diesem Computer nicht geöffnet werden.',
      errorProcesar: 'Das Bild konnte nicht verarbeitet werden.',
      sufijoConvertida: '-konvertiert',
      sufijoComprimida: '-komprimiert',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % kleiner`
          : porcentaje < 0
            ? `${-porcentaje} % größer`
            : 'unverändert',
      guardado: (archivo: string) => `Gespeichert unter ${archivo}`,
    },
    comprimir: {
      zip: 'Als ZIP komprimieren',
      zipAyuda:
        'Wählen Sie Dateien oder Ordner. Links werden nicht verfolgt und das ZIP ist eine neue Datei: Bestehende werden nie überschrieben.',
      agregarArchivos: 'Dateien hinzufügen',
      agregarCarpeta: 'Ordner hinzufügen',
      quitar: 'Entfernen',
      vacio: 'Noch nichts ausgewählt.',
      crearZip: 'ZIP erstellen…',
      creando: 'Wird erstellt…',
      pdf: 'PDF optimieren',
      pdfAyuda:
        'Speichert mit Objektströmen in einem eigenen Thread neu. Die Datei wird nur erstellt, wenn sie kleiner ist; passwortgeschützte PDFs werden nicht geöffnet. Das Original bleibt unberührt. Hinweis: Beim Neuspeichern gehen digitale Signaturen und PDF/A-Konformität verloren.',
      elegirPdf: 'PDF wählen',
      optimizar: 'Optimieren…',
      optimizando: 'Wird optimiert…',
      antes: 'Vorher',
      despues: 'Nachher',
      sinMejora: 'Das PDF würde durch Optimierung nicht kleiner: Keine Datei erstellt.',
      sufijoOptimizado: '-optimiert',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'Link, unlesbarer Ordner oder Spezialdatei wurde ausgelassen' : 'Links, unlesbare Ordner oder Spezialdateien wurden ausgelassen'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'Datei' : 'Dateien'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % kleiner`
          : porcentaje < 0
            ? `${-porcentaje} % größer`
            : 'unverändert',
      guardado: (archivo: string) => `Gespeichert unter ${archivo}`,
    },
    conversor: {
      ayuda:
        'Konvertiert lokal auf diesem Computer: Kein Dokument wird hochgeladen. Das Original bleibt unverändert; es entsteht eine neue Datei ohne Überschreiben.',
      elegir: 'Dokument wählen',
      tipoNoSoportado:
        'Für diesen Dateityp gibt es keine Konvertierungen. Unterstützt werden docx, xlsx, csv, md, html und pdf (sowie odt, pptx und doc mit LibreOffice).',
      convertirA: 'Konvertieren in',
      convertir: 'Konvertieren…',
      convirtiendo: 'Wird konvertiert…',
      avisoLibreOffice:
        'Diese Konvertierung nutzt das auf diesem Computer installierte LibreOffice. WolfCore Dev installiert oder lädt es nicht herunter, sondern startet es im Hintergrund mit temporärem Profil.',
      sinLibreOffice:
        'Wenn Sie LibreOffice installieren, können Sie auch odt, pptx und doc konvertieren (WolfCore Dev installiert es nicht).',
      limites:
        'Aus Sicherheitsgründen gelten Limits: bis 50 MB (10 MB für md und html), 120 s, 200 000 Zeilen, 1000 Spalten und 5 Millionen Zellen; Dateien mit Verdacht auf ZIP-Bombe oder XML-Entitäten werden abgelehnt.',
      guardado: (archivo: string) => `Gespeichert unter ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Stärke',
      pestanaAuditar: 'Datenbank prüfen',
      fortaleza: {
        etiqueta: 'Zu prüfendes Passwort',
        marcador: 'Passwort eingeben',
        privacidad: 'Wird direkt hier geprüft: Nichts verlässt Ihren Computer oder wird gespeichert.',
        mostrar: 'Anzeigen',
        ocultar: 'Ausblenden',
        niveles: ['Sehr schwach', 'Schwach', 'Mittel', 'Stark', 'Sehr stark'],
        sinAvisos: 'Keine Hinweise.',
        estimacion: 'Dies ist eine Schätzung, keine Garantie.',
        avisos: {
          straightRow: 'Aufeinanderfolgende Tasten in einer Reihe sind leicht zu erraten.',
          keyPattern: 'Kurze Tastaturmuster sind leicht zu erraten.',
          simpleRepeat: 'Wiederholte Zeichen oder Gruppen erhöhen die Sicherheit kaum.',
          extendedRepeat: 'Wiederholte Muster sind leicht zu erraten.',
          sequences: 'Folgen wie abc oder 6543 sind leicht zu erraten.',
          recentYears: 'Vermeiden Sie aktuelle Jahre und persönliche Daten.',
          dates: 'Vermeiden Sie Datumsangaben: Sie sind leicht zu erraten.',
          topTen: 'Gehört zu den zehn häufigsten Passwörtern.',
          topHundred: 'Gehört zu den hundert häufigsten Passwörtern.',
          common: 'Dies ist ein sehr häufig verwendetes Passwort.',
          similarToCommon: 'Ähnelt einem sehr häufig verwendeten Passwort.',
          wordByItself: 'Ein einzelnes Wort ist leicht zu erraten.',
          namesByThemselves: 'Ein einzelner Vor- oder Nachname ist leicht zu erraten.',
          commonNames: 'Häufige Namen sind leicht zu erraten.',
          userInputs: 'Verwenden Sie keine leicht bekannten persönlichen Angaben.',
          l33t: 'Vorhersehbare Ersetzungen (@ statt a) helfen kaum.',
          reverseWords: 'Rückwärts geschriebene Wörter helfen kaum.',
          allUppercase: 'Nur Großbuchstaben helfen kaum.',
          capitalization: 'Nur den ersten Buchstaben großzuschreiben hilft kaum.',
          associatedYears: 'Vermeiden Sie Jahre mit Bezug zu Ihnen.',
          repeated: 'Vermeiden Sie wiederholte Wörter und Zeichen.',
          longerKeyboardPattern: 'Verwenden Sie ein längeres Tastaturmuster mit Richtungswechsel.',
          anotherWord: 'Fügen Sie ein oder zwei weitere, weniger gebräuchliche Wörter hinzu.',
          useWords: 'Mehrere zufällige Wörter ergeben ein gutes Passwort.',
          noNeed: 'Sicherheit gelingt auch ohne Symbole und Ziffern: Entscheidend ist die Länge.',
        },
      },
      auditar: {
        limite:
          'Erkennt nur sehr häufige Passwörter durch Vergleich mit einer kurzen Liste von etwa 200 Einträgen. Kein Angriff und kein Brute-Force-Test. Ein unmarkiertes Konto garantiert kein starkes Passwort.',
        privacidad:
          'Das passende Passwort wird niemals angezeigt und es wird mit einem temporären Nur-Lese-Benutzer geprüft (in PostgreSQL mit Nur-Lese-Sitzung). Nur auf eigenen Datenbanken verwenden.',
        motor: 'Engine',
        base: 'Datenbank',
        tabla: 'Tabelle',
        columnaUsuario: 'Benutzerspalte',
        columnaHash: 'Hash-Spalte',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Starten Sie den Server unter Datenbanken, um seine Datenbanken zu prüfen.',
        sinBases: 'Keine Datenbanken auf diesem Server.',
        sinMotores: 'Kein eigener MySQL-, MariaDB- oder PostgreSQL-Server vorhanden.',
        revisar: 'Prüfen',
        revisando: 'Prüfung läuft…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'Konto geprüft' : 'Konten geprüft'} · ${d} ${d === 1 ? 'schwach' : 'schwach'}`,
        sinDebiles: 'Keines der geprüften Konten stimmt mit einem sehr häufigen Passwort überein.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? 'Konto konnte nicht geprüft werden' : 'Konten konnten nicht geprüft werden'}:`,
        truncado:
          'Die Prüfung stoppte beim Limit von 10 000 Zeilen oder 60 Sekunden: Einige Konten blieben ungeprüft.',
        usuario: 'Benutzer',
        motivo: 'Grund',
        accion: 'Aktion',
        motivos: {
          comun: 'Sehr häufiges Passwort',
          formato_debil: 'Schwaches Format (md5 oder sha1 ohne Salt)',
        },
        restablecer: 'Zurücksetzen',
        mas: (n: number) => `und ${n} weitere (die ersten 200 werden angezeigt)`,
        esquema: 'Schema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Abbrechen',
        cancelando: 'Wird abgebrochen…',
        cancelada: 'Prüfung abgebrochen.',
        progreso: (a: number, b: number) => `${a} von ${b} geprüft`,
        tiposNoRevisables: {
          vacio: 'leerer Hash',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (auf diesem Computer nicht verfügbar oder Parameter außerhalb des Limits)',
          bcrypt_otro: 'bcrypt mit Kosten außerhalb des Bereichs oder Variante $2x$',
          pbkdf2_otro: 'PBKDF2 mit Parametern außerhalb des Limits',
          ldap: 'LDAP-Format ({SHA}…)',
          otro: 'unbekanntes Format',
        },
        rlsActiva:
          'Die Tabelle nutzt Row-Level Security (RLS): Die Prüfung sieht nur Zeilen, die für die eingeschränkte Rolle freigegeben sind.',
        falsoPositivo:
          'Ein Wert aus 32 oder 40 Hex-Zeichen wird als md5 oder sha1 gewertet, könnte aber etwas anderes sein (z. B. ein Token). Enthält die Spalte keine Passwörter, ist das Ergebnis bedeutungslos.',
      },
      restablecer: {
        titulo: (u: string) => `Passwort von ${u} zurücksetzen`,
        ayuda:
          'Ein Passwort lässt sich nicht auslesen, sondern nur neu setzen. Zuvor wird ein Schnappschuss der Datenbank erstellt und eine Kopie der Zeile gespeichert.',
        cargando: 'Vorschau wird vorbereitet…',
        sentencia: 'Wird ausgeführt (Werte laufen separat und werden nicht angezeigt)',
        formatoActual: (f: string) => `Aktuelles Format: ${f}`,
        cambiaFormato:
          'Das Konto wechselt zu bcrypt: Die Anwendung muss dies prüfen können (z. B. mit password_verify), sonst ist keine Anmeldung mehr möglich.',
        nueva: 'Neues Passwort',
        generar: 'Erzeugen',
        mostrar: 'Anzeigen',
        ocultar: 'Ausblenden',
        anotar: 'Jetzt notieren: Es wird weder erneut angezeigt noch gespeichert.',
        escribaUsuario: (u: string) => `Geben Sie zur Bestätigung den Benutzer ein: ${u}`,
        confirmar: 'Passwort zurücksetzen',
        cancelar: 'Abbrechen',
        cerrar: 'Schließen',
        hecho: 'Passwort zurückgesetzt.',
        copiaFila: 'Zeilenkopie (Kennung und alter Hash, 30 Tage aufbewahrt):',
        instantanea: 'Vorheriger Schnappschuss der Datenbank:',
        instantaneaAyuda: 'Wiederherstellbar unter Datenbanken › Schnappschüsse.',
        aBcrypt: 'Auf bcrypt umstellen: nur wenn die Anwendung password_verify oder Ähnliches nutzt',
        avisoLegado:
          'Dieser Hash ist md5 oder sha1 ohne Salt und bleibt in diesem Format. Nutzt die Anwendung ein separates Salt (andere Spalte oder Konstante), lässt sich der Hash nicht nachbilden und das neue Passwort funktioniert nicht.',
        datosReales: {
          titulo: 'Datenbank mit echten Daten',
          texto:
            'Diese Datenbank gehört zu einer Website mit echten Kundendaten: Das Zurücksetzen ändert ein reales Benutzerkonto.',
          casilla: 'Ich verstehe, dass es echte Daten sind, und möchte dieses Passwort zurücksetzen',
        },
        rlsActiva:
          'Die Tabelle nutzt Row-Level Security (RLS): Verbirgt die Richtlinie dieses Konto vor der eingeschränkten Rolle, ist kein Zurücksetzen möglich.',
        copiaSinRestringir:
          'Diese Kopie konnte nicht auf Ihren Benutzer beschränkt werden: Prüfen Sie die Ordnerberechtigungen.',
      },
    },
  },
  doctor: {
    descripcion:
      'Prüft Ports, Zertifikate, hosts-Datei, PATH, Visual C++, Antivirus und Dienste und schlägt Reparaturen vor.',
    revisarAhora: 'Jetzt prüfen',
    revisando: 'Prüfung läuft…',
    sinRevision: 'Noch keine Prüfung durchgeführt. Klicken Sie auf „Jetzt prüfen“.',
    sinHallazgos: 'Alles in Ordnung: Keine Probleme gefunden.',
    gravedades: { error: 'Fehler', aviso: 'Hinweise', info: 'Informationen' },
    evidencia: 'Beobachtung',
    requiereAdmin: 'Erfordert Administratorrechte',
    comandoManual: 'Befehl für eine Administrator-Konsole (wird nicht automatisch ausgeführt):',
    copiar: 'Befehl kopieren',
    copiado: 'Befehl kopiert.',
    reparar: 'Reparieren',
    alternativa: 'Port von WolfCore Dev verschieben',
    soloInforma: 'WolfCore Dev ändert dies nicht selbstständig: Folgen Sie den Hinweisen.',
    dialogo: {
      titulo: 'Reparatur bestätigen',
      queHara: 'Folgendes wird ausgeführt:',
      admin: 'Windows wird um Administratorrechte bitten.',
      puerto: (p: string | number) => `Der neue Port wird ${p} sein.`,
      aplicar: 'Anwenden',
      cancelar: 'Abbrechen',
    },
    estados: {
      aplicando: 'Wird angewendet…',
      hecha: 'Reparatur angewendet.',
      fallida: 'Reparatur fehlgeschlagen.',
    },
    revisiones: {
      puertos: 'Ports',
      'rangos-reservados': 'Reservierte Bereiche',
      ca: 'Zertifizierungsstelle',
      certificados: 'Zertifikate',
      confianza: 'CA-Vertrauen',
      hosts: 'hosts-Datei',
      path: 'Benutzer-PATH',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++-Linker',
      antivirus: 'Antivirus',
      firewall: 'Firewall',
      servicios: 'Dienste',
    },
    reparaciones: {
      cambiar_puerto: 'Port von WolfCore Dev auf einen freien Port ändern. Das andere Programm bleibt unberührt.',
      puerto_manual:
        'Port von WolfCore Dev aus dem reservierten Bereich verschieben. Das Freigeben des Bereichs entscheiden Sie selbst mit dem angezeigten Befehl.',
      detener_iis:
        'IIS-Dienst (W3SVC) stoppen, um den Port freizugeben. Wird nicht deaktiviert und startet beim Windows-Neustart wieder.',
      regenerar_ca:
        'Neue Zertifizierungsstelle erstellen, in Windows vertrauen (Bestätigung nötig), Zertifikate neu ausstellen und alte CA entfernen. Zuvor wird eine Sicherung erstellt.',
      regenerar_certificados: 'Zertifikate der Websites neu ausstellen und Nginx neu laden.',
      hosts_reescribir:
        'WolfCore Dev-Block in der hosts-Datei in UTF-8 neu schreiben (mit vorheriger Sicherung). Fremde Zeilen bleiben unberührt.',
      hosts_solo_lectura: 'Schreibschutzattribut der hosts-Datei entfernen.',
      path_duplicados:
        'Doppelte WolfCore Dev-Einträge aus dem Benutzer-PATH entfernen (mit Sicherung des alten Werts). Fremde Einträge bleiben unberührt.',
      path_ajeno:
        'Ein anderes Werkzeug steht vorher im PATH. WolfCore Dev entfernt es nicht: Ändern Sie die Reihenfolge bei Bedarf selbst.',
      instalar_vcredist:
        'Visual C++ 2015+ x64 über winget installieren. Das Microsoft-Installationsprogramm fragt selbst nach Berechtigung.',
      instalar_build_tools:
        'Installieren Sie die Visual Studio Build Tools (mit C++-Tools) per angezeigtem Befehl: Sie benötigen mehrere GB und Administratorrechte, daher entscheiden Sie selbst.',
      antivirus:
        'Das Hinzufügen des Datenordners zu den Antivirus-Ausschlüssen entscheiden Sie selbst mit dem angezeigten Befehl.',
      firewall:
        'Das Entfernen dieser Regeln entscheiden Sie selbst mit dem angezeigten Befehl in einer Administrator-Konsole. WolfCore Dev ändert niemals die Firewall.',
      reintentar_servicio: 'Dienst erneut starten.',
      firefox_confianza:
        'In der user.js jedes Firefox-Profils die Einstellung hinzufügen, die der Windows-Zertifizierungsstelle vertraut, mit vorheriger Sicherung. prefs.js bleibt unberührt und geöffnete Profile werden übersprungen.',
    },
    confianza: {
      titulo: 'CA-Vertrauen',
      texto:
        'Windows vertraut der Zertifizierungsstelle von WolfCore Dev bereits; Node, Python und Firefox verwenden ihren eigenen Speicher.',
      sinCa: 'Es gibt noch keine Zertifizierungsstelle. Erstellen Sie sie unter HTTPS, um diesen Bereich zu nutzen.',
      node: {
        titulo: 'Node',
        proyectos:
          'Projektprozesse und das Terminal erhalten NODE_EXTRA_CA_CERTS mit der Zertifizierungsstelle.',
        ajena: 'Sie haben bereits eine eigene NODE_EXTRA_CA_CERTS: WolfCore Dev ersetzt sie nicht.',
        global: 'Auch als Benutzervariable (für andere Terminals und Programme)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS wird als Variable Ihres Benutzers gesetzt. Dies gilt für Programme, die Sie danach öffnen; beim Deaktivieren dieser Option wird sie entfernt.',
        confirmarDesactivar: 'Die von WolfCore Dev gesetzte Variable NODE_EXTRA_CA_CERTS wird entfernt.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Projekte mit .venv erhalten REQUESTS_CA_BUNDLE und SSL_CERT_FILE mit den Stammzertifikaten von certifi (oder denen von Windows) plus der Zertifizierungsstelle. Niemals nur die Zertifizierungsstelle allein.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Keine Firefox-Profile gefunden.',
        activo: 'Vertraut',
        inactivo: 'Vertraut nicht',
        abierto: 'Geöffnet',
        fuera: 'Außerhalb des Firefox-Ordners',
        avisoFuera: (lista: string) =>
          `Diese Profile liegen außerhalb des Firefox-Ordners und werden nur geändert, wenn Sie dies aktivieren: ${lista}.`,
        incluirFuera: 'Auch Profile außerhalb des Firefox-Ordners ändern',
        resultadoFuera: (n: number) =>
          `${plural(n, 'Profil außerhalb des Firefox-Ordners wurde nicht verändert', 'Profile außerhalb des Firefox-Ordners wurden nicht verändert')}.`,
        activar: 'In Firefox aktivieren',
        quitar: 'Aus Firefox entfernen',
        confirmarActivar:
          'security.enterprise_roots.enabled wird in der user.js jedes Profils zwischen WolfCore-Dev-Markierungen und mit vorheriger Sicherung in etc/respaldos hinzugefügt. prefs.js bleibt unberührt. Profile mit geöffnetem Firefox werden übersprungen: Schließen Sie Firefox vorher.',
        confirmarQuitar:
          'Der WolfCore-Dev-Block wird aus der user.js jedes Profils entfernt (mit vorheriger Sicherung). Ihre übrigen Einstellungen bleiben unverändert.',
        resultadoOk: (n: number) => `In ${plural(n, 'Profil', 'Profilen')} abgeschlossen.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'Profil wurde übersprungen', 'Profile wurden übersprungen')}, weil Firefox geöffnet ist. Schließen Sie Firefox und versuchen Sie es erneut.`,
        resultadoError: (n: number) =>
          `${plural(n, 'Profil konnte nicht', 'Profile konnten nicht')} geändert werden.`,
      },
      confirmar: 'Bestätigen',
      cancelar: 'Abbrechen',
    },
  },
  php: {
    descripcion:
      'php.ini und Erweiterungen jeder installierten PHP-Version. Vor dem Speichern wird der Diff angezeigt, mit php -v geprüft und eine datierte Sicherung angelegt; startet PHP nicht wieder, wird die vorherige Version wiederhergestellt.',
    rama: 'PHP-Version',
    sinPhp: 'Kein PHP installiert. Installieren Sie es unter Dienste.',
    irServicios: 'Zu Dienste',
    pestanas: { ini: 'php.ini', extensiones: 'Erweiterungen' },
    rapidosTitulo: 'Schnellwerte',
    rapidosAyuda: 'Werden auf den Text unten angewendet; nichts wird gespeichert, bevor Sie den Diff bestätigen.',
    aplicarRapidos: 'Auf Text anwenden',
    sinValor: 'nicht festgelegt',
    rapidos: {
      memory_limit: 'Speicher pro Skript (memory_limit)',
      upload_max_filesize: 'Maximale Upload-Größe (upload_max_filesize)',
      post_max_size: 'Maximale POST-Größe (post_max_size)',
      max_execution_time: 'Maximale Laufzeit in Sekunden (max_execution_time)',
      display_errors: 'Fehler anzeigen (display_errors)',
      error_reporting: 'Fehlerstufe (error_reporting)',
      'date.timezone': 'Zeitzone (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Zeilen, die mit ; beginnen, sind Kommentare.',
    sinCambios: 'Keine Änderungen gegenüber der gespeicherten Version.',
    descartar: 'Änderungen verwerfen',
    revisar: 'Prüfen und speichern',
    diffTitulo: (rama: string) => `Änderungen in der php.ini von PHP ${rama}`,
    diffAyuda:
      'Es wird eine datierte Sicherung gespeichert, mit php -v getestet und PHP neu gestartet, falls es läuft.',
    guardar: 'Speichern und anwenden',
    cancelar: 'Abbrechen',
    guardado: (respaldo: string) => `php.ini gespeichert. Vorherige Sicherung: ${respaldo}`,
    respaldosTitulo: 'Datierte Sicherungen',
    sinRespaldos: 'Noch keine Sicherungen vorhanden.',
    restaurar: 'Wiederherstellen',
    confirmarRestaurar: (nombre: string) =>
      `${nombre} wiederherstellen? Die aktuelle php.ini wird vorher als weitere Sicherung gespeichert.`,
    restaurado: 'Sicherung wiederhergestellt.',
    recargar: 'Neu einlesen',
    extensiones: {
      ayuda:
        'Es werden nur die Erweiterungen aktiviert, die dieser Build in ext/ mitbringt. Erweiterungen von Drittanbietern werden aus dem Katalog installiert (passende Variante dieses Builds und geprüfter SHA-256-Hash).',
      activa: 'Aktiv',
      inactiva: 'Inaktiv',
      falta: 'Datei fehlt',
      catalogo: 'Katalog',
      instalar: 'Installieren',
      instalada: (nombre: string) => `${nombre} installiert und aktiviert.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} aktiviert.` : `${nombre} deaktiviert.`,
      buscar: 'Erweiterung suchen',
      vacio: 'Keine passenden Erweiterungen gefunden.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI und Antigravity CLI: Erkennen oder installieren Sie sie und öffnen Sie sie in einem Projekt. Unterstützte Agenten verbinden sich mit dem MCP von WolfCore Dev. Keiner wird automatisch geöffnet.',
    recargar: 'Erneut erkennen',
    notaMcp:
      'Der registrierte MCP authentifiziert sich nur, wenn der Agent über WolfCore Dev („In einem Projekt öffnen“) gestartet wird: Das Token wird in der Variable WOLFCORE_MCP_TOKEN dieses Terminals übergeben und niemals in die Konfiguration des Agenten geschrieben. Extern geöffnet sieht der Agent den Eintrag „wolfcore“, kann sich aber nicht verbinden.',
    sitioElegido: (nombre: string) => `Wählen Sie einen Agenten zum Öffnen in ${nombre}.`,
    instalado: 'Installiert',
    noInstalado: 'Nicht installiert',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Unbekannte Version',
    verVersion: 'Version anzeigen',
    verVersionAyuda: 'Führt das Programm mit --version aus (geschieht nicht automatisch beim Öffnen der Ansicht).',
    origen: {
      propio: 'Von WolfCore Dev installiert',
      'npm-usuario': 'Globales npm des Benutzers',
      ejecutable: 'Systemprogramm',
    },
    mcpRegistrado: 'MCP registriert',
    mcpSinRegistrar: 'MCP nicht registriert',
    tokenEscrito:
      'Die Datei des Agenten enthielt das MCP-Token im Klartext: Es wurde entfernt und in der vorherigen Sicherung maskiert (***) gespeichert. Erwägen Sie, das Token des MCP-Servers neu zu generieren.',
    mcpNoSoportado:
      'Seine Dokumentation unterstützt das Auslesen des Tokens aus einer Umgebungsvariable nicht: WolfCore Dev registriert den MCP dafür nicht (das Token wird niemals in Dateien geschrieben).',
    instalar: 'Installieren',
    instalando: 'Wird installiert…',
    guia: 'Installationsanleitung',
    soloGuia:
      'WolfCore Dev installiert diesen Agenten nicht (sein Installer hat keinen festen Hash): Folgen Sie der offiziellen Anleitung.',
    registrar: 'MCP registrieren',
    quitar: 'MCP entfernen',
    abrir: 'In einem Projekt öffnen',
    confirmarInstalar: {
      titulo: (nombre: string) => `${nombre} installieren?`,
      texto: (paquete: string) =>
        `Es wird die neueste veröffentlichte Version von ${paquete} von registry.npmjs.org mit dem Node von WolfCore Dev in dessen Datenordner installiert.`,
      aislado: 'Verwendet nicht Ihre npm-Konfiguration und verändert Ihr globales npm nicht. Dies kann mehrere Minuten dauern.',
      aceptar: 'Installieren',
      hecho: (nombre: string) => `${nombre} wurde installiert.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `MCP in ${nombre} registrieren?`,
      texto:
        'Es wird nur der Eintrag „wolfcore“ in dieser Datei hinzugefügt (oder aktualisiert); alles andere bleibt unverändert:',
      aceptar: 'Registrieren',
      hecho: (nombre: string) => `MCP in ${nombre} registriert.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `MCP aus ${nombre} entfernen?`,
      texto: 'Es wird nur der Eintrag „wolfcore“ aus dieser Datei entfernt; alles andere bleibt unverändert:',
      aceptar: 'Entfernen',
      hecho: (nombre: string) => `MCP aus ${nombre} entfernt.`,
    },
    copiaPrevia:
      'Vor der Änderung wird eine datierte Sicherung neben der Datei gespeichert (<Datei>.wolfcore-JJJJMMTT-HHmmss.bak); die 5 neuesten bleiben erhalten. Falls der Agent geöffnet ist, schließen Sie ihn vorher.',
    copiaHecha: (ruta: string) => `Vorherige Sicherung: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `${nombre} öffnen`,
      proyecto: 'Projekt',
      sinProyectos: 'Noch keine Projekte vorhanden.',
      proveedor: 'KI-Anbieter',
      proveedorPropio: 'Der im Agenten konfigurierte Anbieter',
      proveedorAyuda:
        'Bei Auswahl eines Anbieters wird Ihr Schlüssel nur in der Umgebung dieses Terminals gesetzt: Er wird weder in Dateien noch in die Befehlszeile geschrieben.',
      aceptar: 'Terminal öffnen',
      hecho: (nombre: string) => `${nombre} wurde in einem neuen Terminal geöffnet.`,
    },
    costo: {
      titulo: 'Vor dem Öffnen eines Agenten',
      texto:
        'Ein KI-Agent arbeitet mit Ihrem Konto beim jeweiligen Anbieter: Jede Anfrage verbraucht Tokens und kann Kosten verursachen. Zudem kann er Projektdateien lesen und ändern sowie Befehle ausführen.',
      nunca:
        'WolfCore Dev öffnet niemals eigenständig einen Agenten: Er startet immer nur auf Ihre Anforderung. Dieser Hinweis wird nur einmal angezeigt.',
      aceptar: 'Verstanden, öffnen',
    },
  },
  depuracion: {
    descripcion:
      'Sehen Sie hier die Aufrufe von dump(), dd() und wd() Ihrer PHP-Websites sowie wolfdump Ihrer Python-Prozesse samt Datei und Zeile. Die Seite antwortet weiterhin wie gewohnt.',
    receptor: 'Dump-Erfassung',
    escuchando: (direccion: string, puerto: number) => `Lauscht auf ${direccion}:${puerto}`,
    apagado: 'Ausgeschaltet',
    memoria:
      'Die Dumps bleiben nur im Arbeitsspeicher (die letzten 500) und gehen beim Schließen verloren. Sie können sensible Daten enthalten: Beim Kopieren werden bekannte Schlüssel maskiert.',
    sitios: 'Websites',
    sinSitios: 'Keine PHP- oder FastAPI-Websites vorhanden.',
    sinPhp: 'Wählen Sie zuerst eine PHP-Version für die Website.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Starten Sie die Prozesse der Website neu, damit sie wolfdump übernehmen.',
    confirmarTitulo: (sitio: string) => `Erfassung für ${sitio} aktivieren`,
    confirmarPhp:
      'Das PHP dieser Website lädt vor jeder Anfrage eine Datei von WolfCore Dev (auto_prepend_file, nur für diese Website), die dump(), dd() und wd() definiert, falls das Projekt sie nicht selbst definiert. Deklarieren Ihre Dateien eine eigene Funktion dump() oder dd() ohne Prüfung auf function_exists, meldet PHP einen Fehler: Deaktivieren Sie die Erfassung in diesem Fall. Die Website verwendet dann ihr eigenes PHP.',
    usoPhp:
      'Laravel und Symfony: dump($x) und dd($x) wie gewohnt. CodeIgniter 3 und andere: wd($x) sendet Daten, ohne etwas auf der Seite auszugeben.',
    confirmarPython:
      'Die Prozesse dieser Website erhalten das Modul wolfdump in ihrem PYTHONPATH (im Projekt wird nichts geschrieben). Gilt ab dem nächsten Start der Prozesse.',
    usoPython: 'from wolfdump import dump  →  dump(wert)',
    activar: 'Erfassung aktivieren',
    cancelar: 'Abbrechen',
    filtroSitio: 'Alle Websites',
    filtroOrigen: 'Jede Quelle',
    buscar: 'In Text, Datei oder URL suchen',
    limpiar: 'Leeren',
    confirmarLimpiar: 'Alle Dumps aus dem Arbeitsspeicher löschen?',
    vacio: 'Noch kein Dump eingegangen.',
    vacioApagado: 'Aktivieren Sie die Erfassung und starten Sie eine Website, um zu beginnen.',
    elegir: 'Wählen Sie einen Dump aus der Liste.',
    copiar: 'Kopieren',
    copiado: 'Kopiert (mit maskierten Schlüsseln)',
    sinSitio: 'ohne Website',
    total: (n: number) => `${n} im Speicher`,
    archivo: 'Datei',
    url: 'URL',
    pestanaVolcados: 'Dumps',
    pestanaErrores: 'Fehler',
    erroresDescripcion:
      'Fehler aus den Protokollen von PHP, Nginx, laravel.log, CodeIgniter 3 und Python, gruppiert: derselbe wiederholte Fehler erscheint einmal mit Zähler.',
    erroresVacio: 'Keine Fehler in den Protokollen. Sie erscheinen hier, sobald sie geschrieben werden.',
    erroresElegir: 'Wählen Sie einen Fehler aus der Liste.',
    actualizar: 'Aktualisieren',
    abrirEditor: 'Im Editor öffnen',
    abrirEditorSinSitio: 'Es werden nur Dateien aus dem Ordner einer Website geöffnet.',
    veces: (n: number) => (n === 1 ? '1 Mal' : `${n} Mal`),
    primera: 'Erstes Mal',
    ultima: 'Letztes Mal',
    fuente: 'Protokoll',
    traza: 'Stacktrace (letztes Mal)',
    sinTraza: 'Kein Stacktrace.',
  },
  contenedores: {
    descripcion:
      'Sehen und steuern Sie die Docker- oder Podman-Container auf diesem Rechner. WolfCore Dev erstellt, löscht oder lädt keine Container, Images oder Volumes herunter.',
    motor: 'Engine',
    refrescar: 'Aktualisieren',
    detectando: 'Suche nach Docker und Podman…',
    sinMotorTitulo: 'Weder Docker noch Podman vorhanden',
    sinMotor:
      'Auf diesem Rechner wurde weder Docker noch Podman gefunden. WolfCore Dev installiert sie nicht: Wenn Sie eines davon benötigen, installieren Sie es von der offiziellen Website und klicken Sie auf Aktualisieren.',
    instalarDocker: 'Docker installieren',
    instalarPodman: 'Podman installieren',
    apagadoTitulo: (m: string) => `${m} antwortet nicht`,
    apagado: (m: string) =>
      `${m} ist installiert, aber die Engine antwortet nicht. Öffnen Sie Docker Desktop (oder starten Sie die Podman-Maschine mit „podman machine start“) und klicken Sie auf Aktualisieren.`,
    remoto:
      'Eine Remoteverbindung (DOCKER_HOST, CONTAINER_HOST, ein Kontext oder eine Standardverbindung) wurde ignoriert: WolfCore Dev verwendet nur die Engine dieses Rechners.',
    desdePath: 'Im PATH gefunden, nicht im üblichen Installationsordner.',
    version: (v: string) => `Version ${v}`,
    vacio: 'Keine Container vorhanden.',
    columnas: {
      nombre: 'Name',
      imagen: 'Image',
      estado: 'Status',
      puertos: 'Ports',
      compose: 'Compose',
      acciones: 'Aktionen',
    },
    estados: {
      corriendo: 'Läuft',
      detenido: 'Gestoppt',
      pausado: 'Pausiert',
      otro: 'Sonstiges',
    },
    codigoSalida: (n: number) => `Code ${n}`,
    iniciar: 'Starten',
    detener: 'Stoppen',
    reiniciar: 'Neu starten',
    registros: 'Protokolle',
    confirmarDetenerTitulo: 'Container stoppen?',
    confirmarDetener: (n: string) =>
      `„${n}“ wird gestoppt. Laufende Prozesse darin werden beendet (die Engine wartet einige Sekunden auf das Beenden). Es wird nichts gelöscht.`,
    confirmarReiniciarTitulo: 'Container neu starten?',
    confirmarReiniciar: (n: string) =>
      `„${n}“ wird neu gestartet. Laufende Prozesse darin werden beendet und neu gestartet. Es wird nichts gelöscht.`,
    confirmar: 'Bestätigen',
    cancelar: 'Abbrechen',
    hecho: {
      iniciar: (n: string) => `„${n}“ gestartet.`,
      detener: (n: string) => `„${n}“ gestoppt.`,
      reiniciar: (n: string) => `„${n}“ neu gestartet.`,
    },
    registroTitulo: (n: string) => `Protokolle von „${n}“`,
    registroEsperando: 'Warte auf Zeilen…',
    registroFin: 'Das Protokoll wurde beendet (der Container wurde gestoppt oder die Engine hat die Verbindung getrennt).',
    cerrar: 'Schließen',
  },
  versiones: {
    pestana: 'Versionen',
    pestanaServicios: 'Dienste',
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
        'Jede Hauptversion (8.4, 17…) hat eine eigene Instanz mit eigenem Datenordner und eigenem Port: Sie können mehrere gleichzeitig starten. Der Stern markiert die Instanz für neue Projekte.',
      pool: 'Jede gestartete PHP-Version hat ihr eigenes PHP; der Stern markiert die Version für neue Projekte.',
      unica:
        'Sie können mehrere Versionen installieren, aber es läuft immer nur eine: Das Starten einer anderen wechselt die aktive Version.',
      ninguno:
        'Hier muss nichts gestartet werden: Projekte verwenden die angeforderte Version oder die Standardversion (Stern).',
    },
    filtroRama: 'Version',
    todasRamas: 'Alle Versionen',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Alle anzeigen',
    origen: {
      vivo: 'Online',
      cache: (h: number) => (h < 1 ? 'Cache vor weniger als 1 Std.' : `Cache vor ${h} Std.`),
      fija: 'Offline-Liste',
    },
    actualizarLista: 'Liste aktualisieren',
    errorCarga: 'Versionsliste konnte nicht gelesen werden',
    vacio: 'Keine Versionen zum Anzeigen.',
    soporte: { lts: 'LTS', actual: 'Aktuell', fin: 'Kein Support', preview: 'Preview' },
    finSoporte: (f: string) => `Support bis ${f}`,
    finSoportePasado: (f: string) => `Kein Support seit ${f}`,
    marcas: {
      instalada: 'Installiert',
      encendida: 'Läuft',
      actualizacion: (v: string) => `Aktualisierung: ${v}`,
      bloqueada: 'Gesperrt',
      sinHuella: 'Kein veröffentlichter Hash',
      huellaDebil: 'Nur MD5-Hash',
      firmada: 'PGP-signiert',
    },
    ayudaFirmada:
      'Die offizielle Quelle signiert diesen Download mit PGP: WolfCore Dev prüft die Signatur vor der Installation anhand der in der App hinterlegten Schlüssel.',
    ayudaSinHuella:
      'Die offizielle Quelle veröffentlicht keinen starken Hash (SHA-256 oder SHA-512): Der Download kann nicht verifiziert werden.',
    instalar: 'Installieren',
    desinstalar: 'Deinstallieren',
    encender: 'Starten',
    apagar: 'Stoppen',
    actualizar: 'Aktualisieren',
    usarEsta: 'Diese Version verwenden',
    usarEstaAyuda: (id: string) =>
      `${id} verwendet eine andere Version dieses Dienstes: Der Wechsel erfolgt mit vorheriger Sicherung Ihrer Daten.`,
    predeterminada: 'Standard für neue Projekte',
    hacerPredeterminada: 'Für neue Projekte verwenden',
    predeterminadaHecha: (v: string) => `${v} ist nun als Standard festgelegt.`,
    puerto: 'Port',
    puertoDe: (id: string) => `Port von ${id}`,
    cambiarPuerto: 'Ändern',
    puertoCambiado: (p: number) => `Port auf ${p} geändert.`,
    puertoProyectosTitulo: 'Projekte mit dem vorherigen Port',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Diese Projekte verwenden in ihrer .env noch Port ${viejo} (wurden nicht geändert): ${lista}. Ändern Sie ihn auf ${nuevo}.`,
    resolver: 'Beheben',
    instalada: (v: string) => `${v} installiert.`,
    selector: { etiqueta: 'Instanz', predeterminada: 'Standard', apagada: 'gestoppt' },
    dialogoSinHuella: {
      titulo: (v: string) => `${v} ohne Hash installieren`,
      riesgo:
        'Für diese Version veröffentlicht die offizielle Quelle keinen Hash: WolfCore Dev kann nicht prüfen, ob die heruntergeladene Datei dem Original entspricht.',
      explicacion:
        'Der Download erfolgt weiterhin per HTTPS von der offiziellen Website, aber falls diese Website oder die Verbindung kompromittiert wäre, bliebe dies unbemerkt. Installieren Sie sie nur, wenn Sie sie wirklich benötigen.',
      alternativa: (v: string) => `Es gibt eine verifizierte Version desselben Dienstes: ${v}.`,
      casilla: 'Ich verstehe das Risiko und möchte ohne Prüfung installieren',
      instalarVerificada: (v: string) => `${v} installieren (verifiziert)`,
      instalarIgual: 'Ohne Prüfung installieren',
    },
    dialogoActualizar: {
      titulo: (n: string) => `${n} aktualisieren`,
      tituloRama: (v: string) => `Neue Version: ${v}`,
      ninguna: 'keine',
      instancia: (id: string) => `Die Instanz ${id} wird aktualisiert. Vor jeder Änderung:`,
      pasoInstalar: (v: string) => `wird ${v} neben der aktuellen Version installiert (diese wird nicht gelöscht);`,
      pasoVolcados: 'wird jede Datenbank mit der aktuellen Version exportiert;',
      pasoCopia: 'wird der Dienst gestoppt und der gesamte Datenordner kopiert (Kaltsicherung);',
      pasoArrancar: 'wird mit der neuen Version gestartet und geprüft, ob sie antwortet;',
      pasoVuelta:
        'startet sie nicht, wird zur vorherigen Version samt Daten zurückgekehrt und die Sicherung bleibt erhalten.',
      datos: 'Daten:',
      respaldo: 'Sicherung unter:',
      espacio: 'Speicherplatz:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} frei; benötigt werden ${necesarios}`,
      datosQuedan:
        'Die bisherigen Daten werden niemals gelöscht: Sicherung und Dumps bleiben unter Sicherungen der Aktualisierungen erhalten, bis Sie sie löschen.',
      sinEspacio: 'Nicht genügend Speicherplatz für die Sicherung: Geben Sie Speicherplatz frei und versuchen Sie es erneut.',
      alLado: (v: string) =>
        `${v} wird installiert. Die übrigen installierten Versionen bleiben unberührt; Projekte mit einer anderen festgelegten Version nutzen diese weiterhin.`,
      ramaExplicacion:
        'Eine neue Hauptversion ersetzt die vorherige nicht: Es wird eine neue Instanz mit eigenem Datenordner und eigenem Port erstellt. Die bestehende Instanz bleibt unverändert.',
      copiarDesdeTitulo: 'Daten der neuen Instanz',
      copiarDesde: (id: string) =>
        `Daten aus ${id} kopieren (werden exportiert und wiederhergestellt; das Original bleibt unberührt)`,
      vacia: 'Leer starten',
      ramaNota:
        'Datenbankbenutzer werden nicht kopiert; Projekte müssen auf den Port der neuen Instanz verweisen.',
      crearInstancia: 'Neue Instanz erstellen',
      confirmar: 'Mit Sicherung aktualisieren',
      hecho: (v: string) => `${v} aktualisiert.`,
      fallo: 'Aktualisierung fehlgeschlagen',
      ramaCreada: (id: string) => `Instanz ${id} erstellt.`,
      copiadas: (l: string) => `Kopiert: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} wurde nicht kopiert: ${m}`,
    },
    limpieza: {
      boton: 'Ungenutzte Versionen bereinigen…',
      titulo: 'Ungenutzte Versionen bereinigen',
      intro:
        'Es werden nur die Programme von Versionen entfernt, die nirgends verwendet werden (der Ordner bin). Datenbankdaten, Instanzen und Ihre Projekte werden niemals angerührt.',
      cargando: 'Suche nach Versionen…',
      vacia: 'Keine Versionen installiert.',
      sinLibres: 'Alle installierten Versionen werden verwendet: Es gibt nichts zu bereinigen.',
      fallo: 'Bereinigung fehlgeschlagen',
      fallaLista: 'Versionsliste konnte nicht gelesen werden',
      bloqueada: 'Kann nicht ausgewählt werden',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'Version' : 'Versionen'} · ${tam}`,
      destinoTitulo: 'Was damit geschehen soll',
      papelera: 'In den Papierkorb verschieben: bleibt 7 Tage erhalten und belegt bis dahin Speicherplatz',
      definitivo: 'Endgültig löschen: gibt den Speicherplatz sofort frei und kann nicht rückgängig gemacht werden',
      avisoDefinitivo:
        'Endgültiges Löschen: Um diese Versionen wieder zu verwenden, müssen sie erneut heruntergeladen werden.',
      instantanea:
        'Bei endgültigem Löschen wird vorher eine Sicherung der Umgebungskonfiguration gespeichert; im Papierkorb lassen sich Versionen wiederherstellen.',
      entiendo: 'Ich verstehe, dass dies nicht rückgängig gemacht werden kann',
      confirmar: (n: number) => `${n} ${n === 1 ? 'Version' : 'Versionen'} entfernen`,
      motivos: {
        predeterminada: 'Ist die Standardversion',
        encendida: 'Läuft derzeit',
        sitio: 'Wird von einem Projekt verwendet',
        instancia: 'Wird von einer Instanz verwendet (auch wenn gestoppt)',
        plantilla: 'Wird von einer Vorlage verwendet',
        workspace: 'Wird von einem Workspace verwendet',
        runtime: 'Wird von einem Projekt verwendet',
        tarea: 'Wird von einem Projekt mit geplanten Aufgaben verwendet',
        duda: 'Konnte nicht geprüft werden: bleibt unberührt',
        datos: 'Enthält Daten, die nur diese Version öffnen kann',
        herramienta: 'Wird von phpMyAdmin oder Adminer verwendet',
      },
      resultadoTitulo: 'Ergebnis',
      liberadas: (tam: string) => `${tam} wurden freigegeben.`,
      enPapelera: (tam: string) => `${tam} befinden sich im Papierkorb (werden nach 7 Tagen geleert).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'Version wurde bereits aus bin entfernt, aber es blieben Reste' : 'Versionen wurden bereits aus bin entfernt, aber es blieben Reste'}, die beim nächsten Start der Anwendung erneut entfernt werden.`,
      instantaneaGuardada: 'Sicherung der Umgebung vor dem Löschen gespeichert.',
      ajeno: (lista: string) =>
        `Enthält von Ihnen darin installierte Komponenten: ${lista}. Beim Entfernen gehen diese verloren.`,
      incluirAjeno: 'Trotzdem entfernen, auch wenn dies verloren geht',
      sinCatalogo: 'Nicht mehr im Katalog vorhanden: Nach dem Entfernen kann sie nicht erneut heruntergeladen werden.',
      papeleraTitulo: 'Im Papierkorb',
      recuperar: 'Wiederherstellen',
      recuperada: (v: string) => `${v} wiederhergestellt.`,
      borradaEl: (f: string) => `Gelöscht am ${f}`,
      fallaRecuperar: 'Wiederherstellung fehlgeschlagen',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `${v} deinstallieren`,
      binario: 'Es werden nur die Programme dieser Version entfernt.',
      instancia: (id: string) =>
        `Wird von der Instanz ${id} verwendet: Sie wird gestoppt und aus der Instanzliste entfernt.`,
      datosQuedan:
        'Ihre Daten bleiben auf der Festplatte: Wenn Sie diese Version erneut installieren, öffnet die Instanz sie wieder.',
      borrarDatos: 'Auch die Daten löschen',
      borrarAviso: (id: string) =>
        `Der Datenordner von ${id} samt aller Datenbanken wird gelöscht. Dies kann nicht rückgängig gemacht werden. Geben Sie „${id}“ zur Bestätigung ein.`,
      escriba: (id: string) => `Geben Sie ${id} zur Bestätigung ein`,
      desinstalar: 'Deinstallieren',
      desinstalarYBorrar: 'Deinstallieren und Daten löschen',
      unica:
        'Dies ist die aktive Version: Wenn sie die einzig installierte ist, kann sie bei gestopptem Dienst entfernt werden (danach nicht mehr installiert); gibt es weitere, wählen Sie vorher eine andere als aktiv (Stern).',
      predeterminada: (id: string) =>
        `${id} ist die Standardinstanz: Datenbanken, der .env-Block und Werkzeuge, die diese Engine verwenden, wechseln zu einer anderen Instanz (mit anderem Port).`,
      hecho: (v: string) => `${v} deinstalliert.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `${id} auflösen`,
      explicacion:
        'Eine Aktualisierung ist fehlgeschlagen und die Daten dieser Instanz konnten nicht wiederhergestellt werden. Sie wird daher nicht gestartet, bis Sie entscheiden, wie vorgegangen werden soll. Es wird nichts gelöscht.',
      fallida: 'Betroffene Daten:',
      respaldo: 'Sicherung:',
      opciones: 'Vorgehensweise',
      devolver: (sello: string, tam: string) =>
        `Sicherung ${sello} (${tam}) wiederherstellen; der aktuelle Ordner wird beiseitegelegt und nicht gelöscht`,
      usarActual: 'Aktuellen Datenordner unverändert verwenden',
      notaActual:
        'Nur wenn der aktuelle Ordner vollständige Daten enthält; andernfalls wählen Sie eine Sicherung.',
      notaDevolver: 'Die Sicherung wird kopiert, geprüft und erst dann an ihren Platz verschoben.',
      escriba: (id: string) => `Geben Sie ${id} zur Bestätigung ein`,
      elegirVersion:
        'Die Sperrmarkierung konnte nicht gelesen werden: Wählen Sie die Version, mit der die Daten geöffnet werden sollen (die Version vor der Aktualisierung).',
      version: 'Version',
      confirmar: 'Auflösen',
      hecho: (id: string) => `${id} entsperrt. Sie können die Instanz jetzt starten.`,
    },
    respaldos: {
      titulo: 'Sicherungen aus Aktualisierungen',
      descripcion:
        'Kopien, die bei Aktualisierungen und neuen Versionen erstellt wurden. Der aktive Datenordner jeder Instanz erscheint hier nie.',
      vacio: 'Keine Sicherungen vorhanden.',
      tipos: {
        respaldo: 'Kaltsicherung',
        volcados: 'Datenbank-Dumps',
        fallida: 'Daten einer fehlgeschlagenen Version',
        restaurando: 'Unvollständige Wiederherstellung',
        copia: 'Dumps für eine neue Version',
      },
      archivos: (n: number) => (n === 1 ? '1 Datei' : `${n} Dateien`),
      borrar: 'Löschen',
      borrarDe: (n: string) => `${n} löschen`,
      confirmarTitulo: 'Sicherung löschen',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) wird gelöscht. Dies kann nicht rückgängig gemacht werden. Die von den Instanzen genutzten Daten bleiben unberührt.`,
      borrado: 'Sicherung gelöscht.',
    },
  },
  navGrupos: {
    trabajo: 'Arbeit',
    entorno: 'Umgebung',
    utilidades: 'Werkzeuge',
  },
  avisos: {
    campana: 'Hinweise',
    campanaConNuevos: (n: number) => `Hinweise: ${n} ungelesen`,
    titulo: 'Hinweiszentrum',
    vacio:
      'Keine Hinweise vorhanden. Hier erscheinen Dienstausfälle, belegte Ports und bald ablaufende Zertifikate.',
    marcarTodos: 'Alle als gelesen markieren',
    limpiar: 'Verlauf leeren',
    ver: 'Ansehen',
    actualizar: 'Aktualisieren',
    verVersiones: 'Versionen anzeigen',
    cerrar: 'Schließen',
    niveles: { info: 'Information', aviso: 'Hinweis', error: 'Fehler' },
    sinLeer: 'Ungelesen',
  },
  barra: {
    paleta: 'Befehl suchen oder ausführen',
    atajoPaleta: 'Ctrl+K',
    tema: 'Design wechseln',
    idioma: 'Sprache wechseln',
  },
  preferencias: {
    titulo: 'Darstellung und Sprache',
    descripcion: 'Änderungen werden sofort übernommen und auf diesem Gerät gespeichert.',
    tema: 'Design',
    temas: { sistema: 'System', claro: 'Hell', oscuro: 'Dunkel' },
    idioma: 'Sprache',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語', ko: '한국어' },
    acento: 'Akzentfarbe',
    acentos: {
      indigo: 'Indigo',
      azul: 'Blau',
      verde: 'Grün',
      violeta: 'Violett',
      naranja: 'Orange',
      rosa: 'Rosa',
    },
    acentoPropio: (color: string) => `Benutzerdefiniert (${color})`,
    errorGuardar: 'Einstellung konnte nicht gespeichert werden',
    asistente: 'Einrichtungsassistent',
    asistenteAyuda:
      'Durchlaufen Sie die ersten Schritte erneut: Projektordner, Grundausstattung, CA, GitHub und überwachter Ordner.',
    asistenteAbrir: 'Assistenten öffnen',
  },
  paleta: {
    titulo: 'Befehlspalette',
    placeholder: 'Ansicht, Dienst, Projekt oder Werkzeug suchen…',
    sinResultados: 'Kein Befehl entspricht der Suche.',
    ayuda: '↑ ↓ zum Navigieren · Enter zum Ausführen · Esc zum Schließen',
    grupos: {
      navegacion: 'Gehe zu',
      servicios: 'Dienste',
      proyectos: 'Projekte',
      herramientas: 'Werkzeuge',
      github: 'GitHub',
      general: 'Allgemein',
    },
    irA: (pantalla: string) => `Gehe zu ${pantalla}`,
    encender: (servicio: string) => `${servicio} starten`,
    apagar: (servicio: string) => `${servicio} stoppen`,
    iniciarTodo: 'Alle Dienste starten',
    detenerTodo: 'Alle Dienste stoppen',
    iniciarWorkspace: (n: string) => `Workspace ${n} starten`,
    detenerWorkspace: (n: string) => `Workspace ${n} stoppen`,
    abrirSitio: (nombre: string) => `${nombre} im Browser öffnen`,
    traerCambios: (nombre: string) => `Änderungen in ${nombre} abrufen`,
    abrirHerramienta: (nombre: string) => `${nombre} öffnen`,
    clonar: 'Repository von GitHub klonen',
    agregarProyecto: 'Projekt hinzufügen',
    nuevoProyecto: 'Neues Projekt erstellen',
    tema: (tema: string) => `Design: ${tema}`,
    idioma: (idioma: string) => `Sprache: ${idioma}`,
    asistente: 'Einrichtungsassistenten öffnen',
  },
  nuevoProyecto: {
    titulo: 'Neues Projekt',
    boton: 'Neues Projekt',
    descripcion:
      'Erstellen Sie ein Projekt von Grund auf: Ordner, Website mit HTTPS, Datenbank und deren Verbindung.',
    pasos: { tipo: 'Typ', datos: 'Daten', resumen: 'Übersicht', crear: 'Erstellung' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Mit Composer; Anwendungsschlüssel, Datenbank und Migrationen.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Offizieller Appstarter mit .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Klassisches Framework mit konfigurierter database.php.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Offizielles Skeleton (oder Webapp) mit .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Virtuelle Umgebung, requirements.txt und uvicorn-Prozess.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Offizieller Download mit fertiger wp-config.php.' },
      estatico: {
        nombre: 'Statische Website',
        descripcion: 'HTML und CSS über Nginx ausgeliefert, ohne Datenbank.',
      },
    },
    campos: {
      nombre: 'Projektname',
      nombrePlaceholder: 'mein-shop',
      nombreAyuda: (dominio: string) => `Ergibt ${dominio}: Kleinbuchstaben, Ziffern und Bindestriche.`,
      carpeta: 'Übergeordneter Ordner',
      elegirCarpeta: 'Ordner wählen…',
      cambiarCarpeta: 'Ordner ändern…',
      carpetaAyuda:
        'Das Projekt wird in einem neuen Ordner mit seinem Namen darin angelegt. Er muss leer sein oder noch nicht existieren.',
      php: 'PHP-Version',
      python: 'Python-Version',
      sinInstalada: 'Keine installiert: Installieren Sie eine unter Dienste.',
      conBase: 'Datenbank für das Projekt erstellen',
      sinBase: 'Ohne Datenbank',
      instancia: 'Datenbankserver',
      apagada: 'gestoppt',
      apagadaAyuda:
        'Dieser Server ist gestoppt: Starten Sie ihn unter Dienste, bevor Sie das Projekt erstellen.',
      sinMotores: 'Für diesen Projekttyp ist kein Datenbankserver installiert.',
      nombreBase: 'Datenbankname',
      starterKit: 'Starter-Kit',
      starterKits: { ninguno: 'Keines', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Web-Pakete (webapp) einschließen',
      pgvector: 'pgvector aktivieren (Vektorsuche)',
    },
    huella: {
      titulo: 'WordPress veröffentlicht nur eine schwache Prüfsumme',
      riesgo:
        'Die veröffentlichte Prüfsumme ist SHA-1, ein Algorithmus, der nicht mehr als sicher gilt, und stammt von derselben Website wie die Datei.',
      explicacion:
        'Wenn diese Website oder die Verbindung kompromittiert wäre, würde ein manipulierter Download die Prüfung bestehen. Der Download erfolgt weiterhin per HTTPS von wordpress.org. Fahren Sie nur fort, wenn Sie dieser Quelle vertrauen.',
      leyendo: 'Veröffentlichte Prüfsumme wird gelesen…',
      noDisponible:
        'Die Prüfsumme konnte jetzt nicht gelesen werden (keine Verbindung oder die Quelle hat nicht geantwortet); sie wird beim Erstellen erneut gelesen.',
      fuente: 'Quelle: wordpress.org',
      casilla: 'Ich verstehe, dass die Prüfsumme schwach ist, und möchte das Projekt trotzdem erstellen',
    },
    resumen: {
      titulo: 'Dies wird erstellt',
      intro: 'Prüfen Sie alles vor dem Start.',
      tipo: 'Typ',
      carpeta: 'Ordner',
      sitio: 'Website',
      dominio: 'Domain',
      https: 'Adresse mit HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Datenbank',
      env: 'Verbindung geschrieben in',
      nota: 'Wenn ein Schritt fehlschlägt, wird nichts gelöscht: Sie sehen, was bereits erstellt wurde, und können es erneut versuchen.',
    },
    errores: {
      nombreVacio: 'Geben Sie einen Projektnamen ein.',
      nombreInvalido:
        'Der Name darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten (max. 40 Zeichen) und nicht mit einem Bindestrich beginnen oder enden.',
      sinCarpeta: 'Wählen Sie den übergeordneten Ordner des Projekts.',
      sinPhp: 'Wählen Sie eine PHP-Version (installieren Sie eine unter Dienste, falls keine vorhanden ist).',
      sinPython: 'Wählen Sie eine Python-Version (installieren Sie eine unter Dienste, falls keine vorhanden ist).',
      sinInstancia: 'Wählen Sie den Server für die Datenbankerstellung oder deaktivieren Sie die Datenbank.',
      baseInvalida: 'Der Datenbankname ist für diese Engine nicht gültig.',
      motorNoVale: 'WordPress benötigt MySQL oder MariaDB.',
      pgvectorMotor: 'pgvector benötigt PostgreSQL.',
      huellaDebil: 'Bestätigen Sie, dass Sie verstehen, dass die WordPress-Prüfsumme schwach ist.',
    },
    acciones: {
      cambiarCarpeta: 'Anderen Ordner wählen',
      cambiarBase: 'Datenbanknamen ändern',
      cambiarNombre: 'Namen ändern',
      reintentarPaso: 'Schritt wiederholen',
      servicios: 'Zu Dienste wechseln',
      confirmarHuella: 'Bestätigung prüfen',
    },
    botones: {
      siguiente: 'Weiter',
      atras: 'Zurück',
      crear: 'Projekt erstellen',
      creando: 'Wird erstellt…',
      cerrar: 'Schließen',
      abrirEditor: 'Im Editor öffnen',
      verSitio: 'Website öffnen',
      verProyecto: 'In Projekte anzeigen',
    },
    progreso: {
      titulo: 'Projekt wird erstellt',
      listo: 'Projekt erstellt.',
      fallo: (paso: string) =>
        `Der Schritt „${paso}“ ist fehlgeschlagen. Es wurde nichts gelöscht: Wiederholen Sie den Schritt oder beheben Sie die Ursache und versuchen Sie es erneut.`,
      quedo: (partes: string) => `Bereits erstellt: ${partes}.`,
      quedoCarpeta: 'der Ordner',
      quedoBase: (nombre: string) => `die Datenbank ${nombre}`,
      quedoSitio: 'die Website',
      avisos: 'Hinweise',
      sinUsuarioPropio:
        'Die Systemverschlüsselung ist nicht verfügbar: Das Projekt verwendet die Administratorverbindung der Datenbank. Sobald sie verfügbar ist, nutzen Sie „Eigenen Benutzer verwenden“ im .env-Manager.',
      editorFallo: 'Der Editor konnte nicht geöffnet werden.',
    },
  },
  importar: {
    boton: 'Importieren…',
    titulo: 'Aus Laragon, XAMPP oder Herd importieren',
    intro:
      'Die Websites werden an ihrem aktuellen Speicherort verknüpft: Kein Ordner wird verschoben, kopiert oder geändert. Auf Wunsch werden auch die Datenbanken kopiert. WolfCore Dev liest die Installationen der anderen Programme ausschließlich.',
    buscando: 'Installationen werden gesucht…',
    nada: 'In den üblichen Ordnern wurden weder Laragon, XAMPP noch Herd gefunden.',
    errorVista: 'Importierbare Elemente konnten nicht ermittelt werden',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Websites',
      todos: 'Alle auswählen',
      ninguno: 'Auswahl aufheben',
      dominio: (d: string) => `Domain ${d}`,
      dominioPropuesto: (d: string) => `Domain ${d} (vorgeschlagen)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP nicht bestimmt',
      base: (nombre: string, motor: string) => `Datenbank ${nombre} (${motor})`,
      yaVinculado: 'Bereits eine Website in WolfCore Dev',
      dominioEnUso: 'Eine andere Website verwendet diese Domain bereits',
    },
    avisos: {
      sin_dominio: 'Hat im anderen Programm keine Domain: Es wird eine vorgeschlagen.',
      dominio_invalido: 'Die Domain ist ungültig: Es wird eine vorgeschlagen.',
      sin_vhost: 'Hat keinen eigenen Virtual Host: Es wird eine Domain vorgeschlagen.',
      php_desconocido: 'Verwendete PHP-Version unbekannt: Es wird eine installierte Version gewählt.',
      base_no_local: 'Die Datenbank liegt auf einem anderen Server: Sie wird nicht importiert.',
      base_nombre_invalido: 'Der Datenbankname ist ungültig: Sie wird nicht importiert.',
      motor_no_soportado: 'Die Datenbank ist weder MySQL noch MariaDB: Sie wird nicht importiert.',
    },
    problemas: {
      titulo: (n: number) =>
        `${n} ${n === 1 ? 'Eintrag wurde verworfen oder konnte' : 'Einträge wurden verworfen oder konnten'} nicht gelesen werden`,
    },
    bases: {
      titulo: 'Datenbanken',
      importarBases: 'Datenbanken ebenfalls importieren',
      ayuda:
        'Starten Sie den Datenbankserver des anderen Programms, bevor Sie fortfahren: WolfCore Dev startet oder stoppt keine fremden Programme. Das Passwort wird nur für diesen Import verwendet und nicht gespeichert.',
      destino: 'Zielserver',
      apagada: 'gestoppt',
      sinMotores:
        'Weder MySQL noch MariaDB sind installiert: Installieren Sie einen Dienst unter Dienste, um Datenbanken zu importieren.',
      puerto: 'Port des Quellservers',
      usuario: 'Benutzer',
      clave: 'Passwort',
      claveAyuda: 'Leer lassen, wenn der Benutzer kein Passwort hat (wie root in Laragon oder XAMPP).',
      existe: 'existiert bereits am Ziel',
      reemplazar: 'Ersetzen (zuvor wird eine Sicherung erstellt)',
      noSeToca: 'Bleibt unberührt, wenn nicht ausgewählt.',
    },
    pasos: { elegir: 'Auswählen', confirmar: 'Bestätigen' },
    continuar: 'Weiter',
    volver: 'Zurück',
    cancelar: 'Abbrechen',
    importar: 'Importieren',
    cerrar: 'Schließen',
    sinSeleccion: 'Wählen Sie mindestens eine Website aus.',
    origenIncompleto: 'Geben Sie Port und Benutzer des Quellservers an.',
    confirmar: {
      titulo: 'Import bestätigen',
      sitios: (n: number) =>
        `${n} ${n === 1 ? 'Website wird' : 'Websites werden'} im aktuellen Ordner verknüpft. Es werden keine Dateien verschoben, kopiert oder geändert.`,
      sinConfianza:
        'Keine importierte Website führt Rezepte aus, bis Sie „Ich vertraue diesem Repository“ aktivieren.',
      hosts:
        'Nginx und die hosts-Datei werden aktualisiert (Windows fragt möglicherweise nach Administratorrechten).',
      basesNuevas: (nombres: string) => `Folgende Datenbanken werden kopiert: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Diese bereits vorhandenen Datenbanken werden ersetzt: ${nombres}. Zuvor wird von jeder eine Sicherung angelegt.`,
      basesSinTocar: (nombres: string) => `Diese bereits vorhandenen Datenbanken bleiben unberührt: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Die Daten werden vom Server des anderen Programms exportiert (127.0.0.1:${puerto}, Benutzer ${usuario}). Es wird nur lesend zugegriffen.`,
      sinBases: 'Es wird keine Datenbank importiert.',
      proteccion:
        'Die Struktur jeder Datenbank wird vorab geprüft und die Daten werden mit einem eingeschränkten Benutzer eingespielt: Schlägt etwas fehl, bleibt die Datenbank unverändert.',
    },
    resultado: {
      titulo: 'Importergebnis',
      importando: 'Wird importiert…',
      cancelar: 'Import abbrechen',
      restaurada: 'Die ursprüngliche Datenbank wurde automatisch aus ihrer Sicherung wiederhergestellt und ist unverändert.',
      sitioOk: 'Importiert',
      sitioFallo: 'Nicht importiert',
      baseOk: (n: string) => `Datenbank ${n} importiert`,
      baseFallo: (n: string) => `Datenbank ${n} nicht importiert`,
      copiaPrevia: (ruta: string) => `Sicherung der vorherigen Datenbank: ${ruta}`,
      phpDistinto: (v: string) => `PHP ${v} wurde verwendet (die ursprüngliche Version war nicht installiert).`,
      sinAplicar:
        'Nginx oder die hosts-Datei konnten nicht aktualisiert werden: Prüfen Sie den Hinweis unter Projekte und versuchen Sie es erneut.',
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'Website importiert' : 'Websites importiert'}, ${b} ${b === 1 ? 'Datenbank importiert' : 'Datenbanken importiert'}.`,
      errorImportar: 'Import fehlgeschlagen',
    },
  },
  plantillas: {
    guardarComo: 'Als Vorlage speichern…',
    dialogo: {
      titulo: (nombre: string) => `„${nombre}“ als Vorlage speichern`,
      intro:
        'Die Vorlage speichert das Rezept, die PHP- und Nginx-Einstellungen, die Erweiterungen und das Datenbankschema (nur die Struktur, ohne Datenzeilen). Passwörter, Schlüssel und Datenbankinhalte werden niemals gespeichert.',
      nombre: 'Name der Vorlage',
      nombrePlaceholder: 'Mein Basisprojekt',
      conArchivos: 'Projektdateien ebenfalls einschließen',
      conArchivosAyuda: 'Ohne diese Option werden nur Rezept, Einstellungen und Schema gespeichert.',
      siempre: 'Immer ausgeschlossen',
      siempreLista:
        '.env und .env.*, vendor, node_modules, .git, .venv, Protokolle, Dumps und Dateidatenbanken (*.sql, *.dump, *.sqlite), Schlüssel und Zertifikate (*.pem, *.key, *.crt…), wp-config.php und wolfcore.yml. Dateien, die einen Schlüssel oder ein Passwort enthalten, werden ebenfalls ausgeschlossen.',
      extra: 'Zusätzlich ausschließen (eine Angabe pro Zeile)',
      extraAyuda: 'Namen oder Pfade relativ zum Projekt, z. B. uploads oder public/build.',
      vista: 'Was gespeichert wird',
      calculando: 'Wird berechnet…',
      resumen: (archivos: number, tamano: string) => `${archivos} Dateien · ${tamano}`,
      fuera: (n: number) => `${n} ausgeschlossen`,
      sinArchivos: 'Es werden nur Rezept, Einstellungen und Schema gespeichert; keine Dateien.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Es wird nur die Struktur der Datenbank ${nombre} (Server ${servidor}) gespeichert, ohne Datenzeilen.`,
      sinBase: 'Das Projekt deklariert keine Datenbank: Es wird kein Schema gespeichert.',
      avisoMongodb: 'Dieses Projekt nutzt MongoDB: Dessen Schema (Collections und Indizes) wird nicht gespeichert.',
      incluirDeTodosModos: 'Trotzdem einschließen',
      avisoIncluir: 'Wenn diese Datei einen echten Schlüssel enthält, wird dieser in der Vorlage gespeichert.',
      guardar: 'Vorlage speichern',
      guardada: (nombre: string) => `Vorlage „${nombre}“ gespeichert.`,
      errorGuardar: 'Vorlage konnte nicht gespeichert werden',
      errorVista: 'Vorschau konnte nicht berechnet werden',
      cancelar: 'Abbrechen',
    },
    lista: {
      titulo: 'Meine Vorlagen',
      ayuda:
        'Starten Sie ein neues Projekt mit dem Rezept, den Einstellungen und dem Schema (ohne Daten) eines bestehenden Projekts.',
      vacia:
        'Noch keine Vorlagen vorhanden. Speichern Sie ein Projekt über das Menü seiner Karte als Vorlage.',
      conArchivosEtiqueta: 'mit Dateien',
      soloEsquema: 'Rezept und Schema',
      conBase: (motor: string) => `${motor}-Datenbank ohne Daten`,
      borrarEtiqueta: (nombre: string) => `Vorlage ${nombre} löschen`,
      borrarTitulo: (nombre: string) => `Vorlage ${nombre} löschen?`,
      borrarTexto:
        'Nur die Vorlage wird gelöscht. Daraus erstellte Projekte und das Originalprojekt bleiben unberührt.',
      borrada: 'Vorlage gelöscht.',
      errorBorrar: 'Vorlage konnte nicht gelöscht werden',
      errorLista: 'Vorlagen konnten nicht geladen werden',
      desde: (nombre: string) => `Vorlage: ${nombre}`,
      avisoSinBase: 'Diese Vorlage enthält keine Datenbank.',
      importadaEtiqueta: 'importiert',
      avisoImportada:
        'Diese Vorlage stammt von Dritten: Das Projekt wird ohne Vertrauensstatus und ohne Starten seiner Prozesse erstellt, und das Öffnen der Website führt deren Code aus. Prüfen Sie die Dateien vorher.',
      generadoresTitulo: 'Projekte von Grund auf',
    },
  },
  env: {
    accion: '.env-Variablen…',
    titulo: (nombre: string) => `.env von ${nombre}`,
    intro:
      'Geheime Werte werden maskiert angezeigt. Ein vollständiger Wert erscheint erst, wenn Sie bei dieser Variable auf „Anzeigen“ klicken, und wird nach 30 Sekunden wieder ausgeblendet. Vor dem Speichern wird eine datierte Sicherung der aktuellen .env angelegt.',
    noExiste: 'Dieses Projekt hat noch keine .env-Datei: Sie wird beim Speichern erstellt.',
    tablaEtiqueta: 'Variablen der .env-Datei',
    sinVariables: 'Die .env-Datei enthält keine Variablen.',
    secretaEtiqueta: 'geheim',
    duplicadaEtiqueta: 'doppelt',
    duplicadaAyuda:
      'Diese Variable kommt mehrfach in der .env vor: Es wird der letzte Eintrag angezeigt und geändert.',
    soloLecturaEtiqueta: 'mehrzeilig',
    soloLecturaAyuda: 'Umfasst mehrere Zeilen: Bearbeiten Sie sie direkt in der Datei.',
    seQuitara: 'Wird beim Speichern entfernt',
    valorNuevo: 'Neuer Wert',
    valorNuevoDe: (clave: string) => `Neuer Wert für ${clave}`,
    valorDe: (clave: string) => `Wert von ${clave}`,
    vacio: '(leer)',
    mostrar: 'Anzeigen',
    ocultar: 'Ausblenden',
    mostrarEtiqueta: (clave: string) => `Wert von ${clave} anzeigen`,
    ocultarEtiqueta: (clave: string) => `Wert von ${clave} ausblenden`,
    cambiar: 'Ändern',
    deshacer: 'Rückgängig',
    deshacerEtiqueta: (clave: string) => `Änderung an ${clave} rückgängig machen`,
    quitar: 'Entfernen',
    quitarEtiqueta: (clave: string) => `Variable ${clave} entfernen`,
    errorRevelar: 'Wert konnte nicht angezeigt werden',
    agregarTitulo: 'Variable hinzufügen',
    agregarNombre: 'NAME',
    agregarValor: 'Wert',
    agregar: 'Hinzufügen',
    nombreInvalido:
      'Verwenden Sie Buchstaben, Ziffern, Unterstriche und Punkte, nicht mit einer Ziffer beginnend; der Name darf noch nicht existieren.',
    comparar: {
      titulo: 'Mit Beispieldatei vergleichen',
      sinEjemplo: 'Das Projekt hat keine .env.example zum Vergleichen.',
      alDia: 'Die .env enthält dieselben Variablen wie die Beispieldatei.',
      faltan: (n: number) => `${n} fehlend:`,
      sobran: (n: number) => `${n} zusätzlich (nicht im Beispiel):`,
      distintas: (n: number) => `${n} mit abweichendem Wert gegenüber dem Beispiel:`,
      agregarFaltantes: 'Fehlende hinzufügen',
    },
    bloques: {
      titulo: 'Variablenblock hinzufügen',
      ayuda:
        'Fügt nur die fehlenden Variablen dieses Bereichs in die .env ein (vorhandene bleiben unberührt), ohne Passwörter oder Schlüssel; ergänzen Sie diese anschließend in der Tabelle.',
      bd: 'Datenbank',
      correo: 'E-Mail',
      ia: 'KI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Eigenen Benutzer verwenden',
      ayuda:
        'Erstellt einen Datenbankbenutzer exklusiv für dieses Projekt (mit Rechten nur auf dessen Datenbank, niemals als Administrator) und trägt ihn in die .env ein. Funktioniert derzeit mit MySQL und MariaDB von WolfCore Dev.',
      confirmarTitulo: 'Eigenen Benutzer für die Datenbank verwenden?',
      confirmarTexto:
        'Es wird ein neuer Benutzer mit zufälligem Passwort und Rechten ausschließlich auf die Datenbank dieses Projekts erstellt; Benutzer und Passwort der Verbindung werden in der .env aktualisiert. Zuvor wird eine Sicherung der aktuellen .env angelegt; das neue Passwort wird in der .env des Projekts und verschlüsselt in WolfCore Dev gespeichert.',
      confirmar: 'Erstellen und verwenden',
      hecho: (usuario: string) => `Das Projekt verwendet jetzt den Benutzer ${usuario}.`,
      compartirTitulo: 'Benutzer eines anderen Projekts mitbenutzen?',
      compartirTexto: (base: string, proyecto: string) =>
        `Die Datenbank ${base} wird auch von ${proyecto} genutzt. Dessen Benutzer mitbenutzen? Dieses Projekt verwendet dann denselben Benutzer und dasselbe Passwort; das Passwort ändert sich nicht, sodass ${proyecto} verbunden bleibt.`,
      compartir: 'Benutzer mitbenutzen',
      error: 'Datenbankbenutzer konnte nicht geändert werden',
    },
    copias: {
      titulo: 'Sicherung wiederherstellen',
      ninguna: 'Es gibt noch keine Sicherungen dieser .env.',
      volver: 'Diese Sicherung wiederherstellen',
      confirmarTitulo: 'Sicherung der .env wiederherstellen?',
      confirmarTexto: (fecha: string) =>
        `Die aktuelle .env wird durch die Sicherung vom ${fecha} ersetzt. Zuvor wird eine weitere Sicherung der aktuellen Datei angelegt, sodass auch dies rückgängig gemacht werden kann.`,
      hecho: 'Sicherung wurde wiederhergestellt.',
      error: 'Sicherung konnte nicht wiederhergestellt werden',
    },
    cambiosPendientes: (n: number) => `${n} ${n === 1 ? 'ungespeicherte Änderung' : 'ungespeicherte Änderungen'}`,
    descartar: 'Änderungen verwerfen',
    guardar: 'Prüfen und speichern…',
    cerrar: 'Schließen',
    cerrarTitulo: 'Ohne Speichern schließen?',
    cerrarTexto: (n: number) =>
      `Sie haben ${n} ${n === 1 ? 'ungespeicherte Änderung' : 'ungespeicherte Änderungen'}. Beim Schließen gehen diese verloren.`,
    cerrarDescartar: 'Schließen und verwerfen',
    seguirEditando: 'Weiter bearbeiten',
    confirmar: {
      titulo: 'Änderungen an der .env speichern',
      texto:
        'Folgendes wird geändert. Geheime Werte werden maskiert angezeigt. Es wird eine datierte Sicherung der aktuellen .env erstellt und die Datei in einem Schritt geschrieben.',
      sinCambios: 'Keine Änderungen zum Speichern vorhanden.',
      agregarGitignore: '.env zur .gitignore des Projekts hinzufügen',
      aceptarVersionado: 'Ich verstehe das Risiko und möchte trotzdem speichern',
      guardar: 'Änderungen speichern',
      versionado:
        'Git verfolgt die .env dieses Projekts bereits: Der nächste Commit würde ihre Werte hochladen, selbst wenn sie in .gitignore steht. Entfernen Sie sie mit git rm --cached .env aus dem Index.',
      versionadoDesconocido:
        'Es konnte nicht geprüft werden, ob Git die .env dieses Projekts verfolgt; bestätigen Sie das Speichern gesondert.',
    },
    errorVistaPrevia: 'Vorschau konnte nicht erstellt werden',
    errorGuardar: '.env konnte nicht gespeichert werden',
    guardado: 'Die .env wurde gespeichert.',
    guardadoConCopia: 'Die .env wurde gespeichert; die vorherige Version wurde als Sicherung abgelegt.',
  },
  asistenteInicio: {
    titulo: 'Willkommen bei WolfCore Dev',
    subtitulo:
      'Fünf Schritte für eine einsatzbereite Umgebung. Nichts wird installiert oder geändert, bis Sie im jeweiligen Schritt auf die Schaltfläche klicken.',
    paso: (n: number, total: number) => `Schritt ${n} von ${total}`,
    anterior: 'Zurück',
    siguiente: 'Weiter',
    omitirTodo: 'Assistenten überspringen',
    terminar: 'Abschließen',
    hecho: 'Erledigt',
    reabrir: 'Sie können ihn jederzeit unter Einstellungen erneut öffnen.',
    pasos: {
      carpeta: {
        titulo: 'Projektordner',
        texto:
          'Hier werden Ihre Projekte gespeichert. Neue Repositories werden hierhin geklont, und dieser Ordner wird im letzten Schritt überwacht.',
        elegir: 'Ordner wählen',
        actual: (ruta: string) => `Gewählter Ordner: ${ruta}`,
        guardada: (ruta: string) => `Aktueller Ordner: ${ruta}`,
        ninguna: 'Nicht gewählt: Es wird C:\\Proyectos verwendet, falls vorhanden.',
      },
      basicos: {
        titulo: 'Grundausstattung installieren',
        texto:
          'Nginx, PHP 8.4, Composer und Node LTS aus ihren offiziellen Quellen mit geprüfter Prüfsumme. Jedes Paket wird erst beim Klick auf seine Schaltfläche installiert.',
        instalado: 'Installiert',
        instalar: (version: string) => `${version} installieren`,
        sinVersion: 'Keine Version im Katalog',
        cargando: 'Versionen werden gesucht…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'Lokaler Zertifizierungsstelle vertrauen',
        texto:
          'Damit .test-Sites ohne Hinweise über HTTPS geöffnet werden, muss Windows der Zertifizierungsstelle von WolfCore Dev vertrauen. Windows bittet Sie um eine Bestätigung.',
        confiar: 'CA vertrauen',
        confiada: 'Windows vertraut der lokalen Zertifizierungsstelle bereits.',
      },
      github: {
        titulo: 'GitHub verbinden',
        texto:
          'Um Ihre Repositories anzuzeigen und mit einem Klick zu klonen. Nutzen Sie die GitHub CLI-Sitzung oder ein persönliches Token, das verschlüsselt auf diesem Computer gespeichert wird.',
      },
      vigilar: {
        titulo: 'Ordner überwachen',
        texto:
          'WolfCore Dev schlägt Ihnen vor, jeden neuen Ordner einzubinden, der im Projektordner erscheint. Ohne Ihre Bestätigung wird nichts eingebunden.',
        activar: 'Diesen Ordner überwachen',
        activa: (ruta: string) => `Überwachung aktiv: ${ruta}`,
        sinCarpeta: 'Wählen Sie zuerst den Projektordner aus (Schritt 1).',
      },
    },
  },
  /** Ergebnis des Imports oder Exports eines Profils (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Sicherung und Profile',
      descripcion:
        'Ein Profil überträgt Ihre Umgebung auf einen anderen Computer: Sites, Versionen, Instanzen, Vorlagen und Einstellungen. Es enthält niemals Schlüssel, Tokens oder Passwörter.',
      aislado: {
        titulo: 'Testordner',
        texto: (ruta: string) =>
          `WolfCore Dev verwendet einen Test-Datenordner (${ruta}). Was Sie hier tun, berührt weder Ihren echten Ordner noch Ihren Computer: Die hosts-Datei wird nicht beschrieben und es werden keine Zertifikate installiert.`,
      },
      exportar: {
        titulo: 'Umgebung exportieren',
        texto:
          'Speichert eine .wolfperfil-Datei mit Ihren Sites, Versionen, Instanzen, Vorlagen und Einstellungen.',
        bases: 'Datenbanken einschließen',
        basesAyuda:
          'Die vollständigen Dumps (einschließlich Ihrer Kundendaten) werden mit der Passphrase verschlüsselt übertragen.',
        ca: 'Zertifizierungsstelle (CA) einschließen',
        caAyuda: 'Wird mit der Passphrase verschlüsselt. Importieren Sie sie nur auf einem eigenen Computer.',
        certificados: 'Site-Zertifikate einschließen',
        certificadosAyuda: 'Werden nur zusammen mit der CA und mit ihr verschlüsselt übertragen.',
        frase: 'Passphrase',
        fraseRepetir: 'Passphrase wiederholen',
        fraseAyuda: (minimo: number) =>
          `Mindestens ${minimo} Zeichen. Ohne sie können die Datenbanken und die CA nicht wiederhergestellt werden, und sie wird nirgendwo gespeichert.`,
        problemas: {
          frase_corta: (minimo: number) => `Die Passphrase muss mindestens ${minimo} Zeichen lang sein.`,
          frase_distinta: 'Die beiden Passphrasen stimmen nicht überein.',
          certificados_sin_ca: 'Zertifikate werden nur zusammen mit der CA übertragen.',
        },
        exportar: 'Profil exportieren…',
        nota: 'Das Profil enthält niemals Schlüssel, Tokens oder Passwörter und auch keine Snapshots, den Papierkorb, Sicherungen oder den Ordner data.',
        listo: 'Profil exportiert',
        guardado: (archivo: string, tamano: string) => `Gespeichert unter ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Profil importieren',
        texto:
          'Wählen Sie eine .wolfperfil-Datei aus. Bevor etwas geändert wird, sehen Sie alles, was ersetzt, entfernt oder ausstehend bleibt, und es wird eine Sicherungskopie der ersetzten Daten angelegt.',
        boton: 'Profil importieren…',
      },
      instantaneas: {
        titulo: 'Umgebungs-Snapshots',
        texto:
          'Vor der Aktualisierung von PHP oder Nginx und vor dem Importieren eines Profils speichert WolfCore Dev eine Kopie Ihrer Konfiguration, von Nginx und den php.ini-Dateien – ohne Schlüssel oder Daten und nur für Sie. Die letzten 10 werden aufbewahrt.',
        compartidas:
          'Alle 10 Plätze werden über alle Anlässe hinweg geteilt: Wenn ein neuer erstellt wird, wird der älteste ersetzt, auch wenn er manuell erstellt wurde.',
        tomar: 'Jetzt erstellen',
        tomada: 'Snapshot gespeichert.',
        sinNada: 'Es gibt noch nichts zu kopieren.',
        vacia: 'Es gibt noch keine Snapshots.',
        motivos: {
          actualizar: 'Vor dem Aktualisieren',
          'importar-perfil': 'Vor dem Profilimport',
          'limpiar-versiones': 'Vor dem Bereinigen von Versionen',
          manual: 'Manuell',
        },
      },
    },
    reasignar: {
      titulo: 'Ordner der Sites',
      texto:
        'Diese Ordner stammen vom anderen Computer. Suchen Sie sie auf diesem Computer oder importieren Sie die Site als ausstehend: Sie bleibt ohne Ordner, bis Sie einen auswählen.',
      sitio: 'Site',
      origen: 'Ordner im Profil',
      destino: 'Ordner auf diesem Computer',
      existe: 'Vorhanden',
      noExiste: 'Auf diesem Computer nicht vorhanden',
      buscar: 'Ordner suchen…',
      cambiar: 'Ändern',
      comoPendiente: 'Trotzdem als ausstehend importieren',
      prefijo: (viejo: string, nuevo: string) =>
        `Dieselbe Änderung für die übrigen übernehmen (${viejo} → ${nuevo})`,
      omitido: 'Wird nicht importiert',
    },
    asistente: {
      titulo: 'Profil importieren',
      pasos: {
        archivo: 'Datei',
        revisar: 'Prüfen',
        confirmar: 'Bestätigen',
        resultado: 'Ergebnis',
      },
      archivo: {
        texto:
          'Wählen Sie die .wolfperfil-Datei aus. Es wird noch nichts geändert: Zuerst sehen Sie, was ersetzt, entfernt oder ausstehend gelassen wird.',
        elegir: 'Datei auswählen…',
        cambiar: 'Andere auswählen',
        ninguno: 'Keine Datei ausgewählt',
        leyendo: 'Profil wird gelesen…',
        error: 'Das Profil konnte nicht gelesen werden',
      },
      origen: (fecha: string, sistema: string) => `Erstellt am ${fecha} auf ${sistema}.`,
      ignoradas: (n: number) => `${n} Einträge der Datei gehören nicht zu einem Profil und werden ignoriert.`,
      reemplaza: {
        titulo: 'Was ersetzt wird',
        ninguno: 'In diesem Ordner befinden sich keine Daten: Der Import erfolgt auf eine saubere Installation.',
        copia:
          'Vor dem Ersetzen wird eine Kopie in respaldos/pre-perfil-… angelegt und ein Umgebungs-Snapshot erstellt; jede ersetzte Datenbank erhält einen eigenen Snapshot. Der Ordner data wird niemals gelöscht.',
        config: 'Die Konfiguration (config.json)',
        sitio: (id: string) => `Die Site ${id}`,
        base: (instancia: string, base: string) => `Die Datenbank ${base} (${instancia})`,
        plantilla: (id: string) => `Die Vorlage ${id}`,
        ca: 'Die Zertifizierungsstelle (CA) dieses Computers',
      },
      versiones: {
        titulo: 'Versionen',
        ninguna: 'Das Profil enthält keine Versionen.',
        instalada: 'Bereits installiert',
        descargar: 'Wird mit verifiziertem Fingerabdruck heruntergeladen',
        pendienteDebil: 'Ausstehend: kein starker Fingerabdruck, bitte manuell installieren',
        pendienteFuera: 'Ausstehend: nicht mehr im Katalog',
        huellas: {
          fuerte: 'SHA-256- oder SHA-512-Fingerabdruck',
          firmada: 'Signiert',
          debil: 'Schwacher Fingerabdruck',
          ninguna: 'Kein Fingerabdruck',
        },
        descargas: (n: number) =>
          `Es werden ${n} Versionen von offiziellen Quellen heruntergeladen, jeweils mit verifiziertem Fingerabdruck oder verifizierter Signatur.`,
      },
      instancias: {
        titulo: 'Datenbankinstanzen',
        existente: 'Bereits vorhanden: bleibt mit ihrem Port und ihrer Version erhalten',
        nueva: (puerto: number) => `Wird mit neuen Zugangsdaten auf Port ${puerto} erstellt`,
        reasignada: (de: number, a: number) => `Port ${de} ist belegt: verwendet Port ${a}`,
      },
      bases: {
        titulo: 'Datenbanken',
        ninguna: 'Das Profil enthält keine Datenbanken.',
        texto:
          'Sie werden mit einem auf die jeweilige Datenbank beschränkten Benutzer und nur mit zulässigen Anweisungen wiederhergestellt. Bereits vorhandene Datenbanken werden zuvor gesichert.',
        omitir: 'Ohne Datenbanken importieren',
      },
      plantillas: {
        titulo: 'Vorlagen',
        existe: 'Bereits vorhanden: wird ersetzt',
        nueva: 'Neu',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Sie enthalten nur Verweise auf Datenbanken und Dienste (Projektprozesse werden nicht übertragen). Sie werden gegen das geprüft, was hier vorhanden ist, und starten niemals automatisch.',
        existe: 'Es existiert bereits ein Workspace mit derselben ID: Ihrer bleibt erhalten',
        nuevo: 'Neu',
        elementos: (n: number) => (n === 1 ? '1 Element' : `${n} Elemente`),
        invalidos: (n: number) => `${n} aus dem Profil sind ungültig und werden nicht importiert.`,
      },
      quitado: {
        titulo: 'Was aus der Konfiguration nicht übernommen wird',
        texto:
          'Dieser Datenordner ist sauber: Aus dem Profil wird nichts übernommen, was außerhalb dieses Computers zeigt.',
      },
      puertos: {
        titulo: 'Belegte Ports',
        texto: (lista: string) =>
          `Diese Ports aus dem Profil werden bereits von einem anderen Programm auf diesem Computer verwendet: ${lista}. Ändern Sie sie nach dem Import unter Dienste.`,
      },
      ca: {
        titulo: 'Zertifizierungsstelle (CA)',
        texto:
          'Das Profil enthält eine verschlüsselte CA. Importieren Sie sie nur, wenn es Ihre eigene ist: Dieser Computer würde die von ihr signierten Zertifikate akzeptieren.',
        huella: 'SHA-256-Fingerabdruck der Profil-CA',
        comparar: 'Vergleichen Sie ihn mit dem Ihres Quellcomputers, bevor Sie sie akzeptieren.',
        importar: 'Profil-CA importieren',
        noImportar: 'Ohne Import verwendet dieser Computer seine aktuelle CA oder erstellt eine neue.',
        ajena:
          'Diese CA hat Namensbeschränkungen, die nicht von WolfCore Dev stammen: Sie kann nicht importiert werden.',
        sinRestricciones:
          'Diese CA hat keine Namensbeschränkungen: Sie kann Zertifikate für jede beliebige Website signieren, auch für Banken und E-Mail-Dienste. Importieren Sie sie nur, wenn es Ihre eigene ist und der Fingerabdruck übereinstimmt.',
        aceptarSin: 'Ich verstehe das Risiko: Es ist meine CA und der Fingerabdruck stimmt überein',
        reemplazaLocal:
          'Dieser Computer hat bereits eine CA. Der Import der Profil-CA ersetzt sie (eine Kopie bleibt in der vorherigen Sicherung erhalten).',
        reemplazar: 'CA dieses Computers ersetzen',
        noSeInstala: 'Die CA wird nicht automatisch im Zertifikatsspeicher des Systems installiert.',
      },
      frase: {
        titulo: 'Profil-Passphrase',
        texto: 'Das Profil enthält verschlüsselte Datenbanken oder die CA. Geben Sie die Passphrase ein, die Sie beim Exportieren gewählt haben.',
        campo: 'Passphrase',
        omitirBases: 'Ohne Datenbanken importieren',
        nota: 'Die Passphrase wird nur in diesem Fenster verwendet: Sie wird nicht gespeichert und beim Abschluss oder Schließen gelöscht.',
      },
      env: {
        titulo: 'Verbindung der Projekte',
        texto:
          'Markieren Sie die Projekte, deren .env auf einen neuen eigenen Benutzer ihrer Datenbank verweisen soll (mit vorheriger Kopie der .env). Die übrigen bleiben unverändert und werden aufgelistet.',
      },
      confirmar: {
        titulo: 'Import bestätigen',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Es werden ${sitios} Sites, ${versiones} Versionen und ${bases} Datenbanken importiert.`,
        importar: 'Importieren',
        revisar: 'Prüfen',
        volver: 'Zurück',
        bloqueos: {
          sitios_sin_carpeta:
            'Wählen Sie den Ordner für jede Site aus oder markieren Sie sie für den Import als ausstehend.',
          frase_requerida: 'Geben Sie die Profil-Passphrase ein oder importieren Sie ohne Datenbanken.',
          ca_ajena: 'Die Profil-CA kann nicht importiert werden.',
          ca_sin_restricciones: 'Bestätigen Sie gesondert, dass Sie eine CA ohne Beschränkungen importieren möchten.',
          reemplazar_ca: 'Bestätigen Sie gesondert, dass Sie die CA dieses Computers ersetzen möchten.',
        },
      },
      progreso: 'Profil wird importiert… Schließen Sie das Fenster nicht: Bei Datenbanken oder Downloads kann dies eine Weile dauern.',
      fases: {
        copia: 'Zu ersetzende Daten werden gesichert',
        versiones: 'Versionen werden installiert',
        configuracion: 'Konfiguration und Sites werden gespeichert',
        plantillas: 'Vorlagen werden kopiert',
        ca: 'CA und Zertifikate werden vorbereitet',
        bases: 'Datenbanken werden wiederhergestellt',
        env: '.env-Dateien werden neu geschrieben',
      },
      avance: (paso: number, de: number) => `Schritt ${paso} von ${de}`,
      resultado: {
        titulo: 'Ergebnis des Imports',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} importiert, ${pendientes} ausstehend, ${omitidos} übersprungen und ${errores} mit Fehlern.`,
        respaldo: (ruta: string) => `Sicherungskopie der ersetzten Daten: ${ruta}`,
        pendientes: 'Was ausstehend geblieben ist, kann manuell vervollständigt werden.',
        error: 'Das Profil konnte nicht importiert werden',
        secciones: {
          sitios: 'Sites',
          versiones: 'Versionen',
          instancias: 'Instanzen',
          bases: 'Datenbanken',
          plantillas: 'Vorlagen',
          workspaces: 'Workspaces',
          env: '.env-Dateien',
          ca: 'CA',
        },
        estados: {
          importado: 'Importiert',
          pendiente: 'Ausstehend',
          omitido: 'Übersprungen',
          error: 'Fehler',
          instalada: 'Installiert',
          ya_instalada: 'Bereits vorhanden',
          creada: 'Erstellt',
          existente: 'War bereits vorhanden',
          puerto_reasignado: 'Port neu zugewiesen',
          reescrito: 'Neu geschrieben',
          sin_marcar: 'Nicht markiert',
        },
        ca: {
          importada: 'CA importiert',
          nueva: 'Neue CA erzeugt',
          sin_cambios: 'CA unverändert',
        },
        quitarCa: {
          boton: 'Vorherige CA entfernen…',
          titulo: 'Vorherige CA aus dem Vertrauensspeicher entfernen',
          texto:
            'Die bisherige CA dieses Computers wird aus dem Zertifikatsspeicher des Systems entfernt. Windows bittet möglicherweise um eine Bestätigung. Die neue CA wird nicht automatisch installiert.',
          si: 'Entfernen',
          hecho: 'Vorherige CA aus dem Vertrauensspeicher entfernt.',
        },
        descartadosWorkspace: (lista: string) => `Hier nicht vorhanden und entfernt: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} ungültige Workspaces wurden nicht importiert.`,
        puerto: (de: number, a: number) => `Port ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Kopie der .env: ${ruta}`,
      },
    },
    /** Starker Hinweis in der Vorschau: Die Profil-CA hat keine Namensbeschränkungen. */
    caSinRestricciones:
      'Diese CA kann jede beliebige Website signieren; importieren Sie sie nur, wenn es Ihre eigene ist, und vergleichen Sie den Fingerabdruck.',
    motivos: {
      procesos_quitados: 'Ihre Prozesse (Befehle eines anderen Computers) wurden nicht importiert.',
      tareas_quitadas:
        'Ihre geplanten Aufgaben (Befehle eines anderen Computers) wurden nicht importiert. Erstellen Sie sie neu oder übernehmen Sie sie aus wolfcore.yml.',
      tunel_con_nombre: 'Ihr benannter Tunnel wird nicht übertragen: Es wird auf den Schnell-Tunnel zurückgesetzt.',
      php_ini: 'Einige php.ini-Einstellungen wurden nicht importiert.',
      xdebug: 'Ihre Xdebug-Einstellung war ungültig und wurde entfernt.',
      nginx_desactivado:
        'Ihre Nginx-Regeln bleiben gespeichert, sind aber nicht angewendet: Prüfen Sie sie im Editor.',
      carpeta_no_existe: 'Ihr Ordner existiert auf diesem Computer nicht: Suchen Sie ihn.',
      correo_sin_proveedor: 'Ihr SMTP-Anbieter wurde nicht importiert: Es wird der lokale Mail-Catcher verwendet.',
      sitio_invalido: 'Die Site ist ungültig.',
      dominio_invalido: 'Ihre Domain ist ungültig (muss auf .test enden).',
      ruta_protegida: 'Ihr Ordner gehört zum System oder zu WolfCore Dev: Er wird nicht importiert.',
      dominio_en_uso: 'Eine andere Site auf diesem Computer verwendet diese Domain bereits.',
      sitio_repetido: 'Die Site ist im Profil doppelt vorhanden.',
      no_disponible: 'Diese Version ist nicht mehr im Katalog.',
      huella_debil: 'Diese Version hat keinen starken Fingerabdruck: Installieren Sie sie manuell unter Versionen.',
      tope_descargas:
        'Wurde nicht heruntergeladen, um nicht zu viele Downloads gleichzeitig auszuführen: Installieren Sie sie unter Versionen.',
      instancia_pendiente: 'Ihre Instanz ist ausstehend geblieben.',
      motor_no_soportado: 'Diese Engine wird nicht aus einem Profil importiert.',
      version_pendiente: 'Ihre Engine-Version ist ausstehend geblieben.',
      danada: 'Ihre Dateien im Profil sind beschädigt.',
      bases_omitidas: 'Wurde ohne Datenbanken importiert.',
      instancia_apagada: 'Ihre Instanz konnte nicht gestartet werden.',
      sin_copia_previa: 'Der vorherige Snapshot konnte nicht erstellt werden: Die Datenbank wurde nicht ersetzt.',
      sin_base: 'Ihre .env verweist nicht auf eine lokale Datenbank.',
      base_no_resuelta: 'Es konnte nicht ermittelt werden, zu welcher Instanz Ihre Datenbank gehört.',
      error_inesperado: 'Etwas ist fehlgeschlagen.',
    },
    avisos: {
      ca_reemplazada:
        'Die vorherige CA dieses Computers befindet sich noch im Vertrauensspeicher des Systems und wird nicht mehr verwendet. Sie können sie von hier aus entfernen.',
      base_no_incluida: 'Die Datenbank {base} ({instancia}) wurde nicht eingeschlossen.',
      sin_ca: 'Auf diesem Computer gibt es keine CA: Das Profil wird ohne sie erstellt.',
      ca_no_importada: 'Die Profil-CA wurde nicht importiert: Es wird die dieses Computers oder eine neue verwendet.',
      certificados: 'Die Zertifikate konnten nicht vorbereitet werden: {detalle}',
      aplicar:
        'Die importierten Sites wurden nicht vollständig angewendet (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'KI-Anbieter {id}: verwendet eine eigene URL.',
      smtp: 'SMTP-Anbieter {id}: Der Host gehört nicht zu einem bekannten Anbieter oder der Benutzer fehlt.',
      puerto: 'Port von {id}: außerhalb des zulässigen Bereichs, wird auf den Standardwert zurückgesetzt.',
      carpeta_vigilada: 'Der überwachte Ordner stammt von einem anderen Computer.',
    },
  },
};
