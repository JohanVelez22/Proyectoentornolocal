import type { TextosParciales } from '../es';

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
const plural = (n: number, eins: string, mehrere: string): string =>
  `${n} ${n === 1 ? eins : mehrere}`;

export const deExtra: TextosParciales = {
  app: {
    lema: 'Ihr lokaler Stack, bereit zum Arbeiten',
  },
  resumenGlobal: {
    cortoApagado: 'Alles aus',
    cortoEncendidos: (n) => `${n} aktiv`,
    cortoErrores: (n) => plural(n, 'mit Fehler', 'mit Fehlern'),
    cortoCargando: 'Verbinde…',
    cortoSinConexion: 'Offline',
    irAServicios: 'Dienste öffnen',
  },
  acciones: {
    copiarCompleto: 'Gesamten Text kopieren',
  },
  errores: {
    codigos: {
      'asistentes.no_existe': 'Dieser Assistent wird nicht unterstützt.',
      'asistentes.no_instalado': '{asistente} ist nicht installiert.',
      'asistentes.no_compatible': '{asistente} kann noch nicht verbunden werden.',
      'asistentes.enlace_rechazado':
        '{archivo} ist ein Link (symbolisch oder Junction): Es wurde nicht geändert.',
      'asistentes.vista_desfasada':
        'Die Datei hat sich nach der Vorschau geändert. Bitte prüfen Sie die Vorschau erneut.',
      'asistentes.sin_carpeta': 'Der Konfigurationsordner von {asistente} existiert nicht.',
      'discos.sin_lectura':
        'Der Zustand der Laufwerke konnte nicht gelesen werden. Bitte versuchen Sie es erneut.',
      'discos.sin_eventos': 'Die Laufwerkereignisse konnten nicht gelesen werden.',
      'discos.admin_cancelado':
        'Die Administratorberechtigung wurde abgebrochen: Es wurde nichts gelesen.',
      'discos.admin_fallo':
        'Der Zustand der Laufwerke konnte mit Administratorrechten nicht gelesen werden.',
      'doctor.disco_atencion': 'Das Laufwerk {modelo} benötigt Aufmerksamkeit.',
      'doctor.disco_critico':
        'Das Laufwerk {modelo} befindet sich in einem kritischen Zustand: Erstellen Sie so bald wie möglich eine Sicherung.',
      'servicios.no_encendio':
        '{nombre} konnte nicht gestartet werden. Prüfen Sie Dienste und die zugehörigen Protokolle.',
      'tuneles.sitio_no_confiable':
        '{dominio} ist noch nicht vertrauenswürdig: Aktivieren Sie im Projekt „Ich vertraue diesem Repository“, bevor Sie es veröffentlichen.',
      'clientehttp.peticion_invalida': 'Ungültige Daten in der Anfrage: {campo}.',
      'clientehttp.variable_sin_definir':
        'Die Variable „{nombre}“ ist in der aktiven Umgebung nicht definiert.',
      'clientehttp.secreto_faltante':
        'Ein gespeicherter geheimer Wert fehlt: Geben Sie ihn erneut ein und speichern Sie die Anfrage oder die Umgebung.',
      'clientehttp.secreto_no_guardado':
        'Ein geheimer Wert konnte nicht gespeichert werden: Er darf keine Zeilenumbrüche enthalten und nicht größer als 16 KB sein, und die Systemverschlüsselung muss verfügbar sein.',
      'clientehttp.url_invalida': 'Die URL ist ungültig.',
      'clientehttp.url_con_credenciales':
        'Die URL darf keinen Benutzer und kein Passwort enthalten: Verwenden Sie den Tab „Authentifizierung“.',
      'clientehttp.protocolo': 'Es werden nur URLs mit http:// und https:// akzeptiert.',
      'clientehttp.cabecera_invalida': 'Der Header „{nombre}“ ist ungültig.',
      'clientehttp.cuerpo_grande': 'Der Anfragetext ist größer als 1 MB.',
      'clientehttp.plazo': 'Die Anfrage hat das Zeitlimit von {segundos} s überschritten.',
      'clientehttp.cancelado': 'Anfrage abgebrochen.',
      'clientehttp.sin_conexion':
        'Verbindung nicht möglich ({motivo}). Prüfen Sie die Adresse, den Port und ob der Server läuft.',
      'clientehttp.certificado': 'Das Serverzertifikat konnte nicht überprüft werden ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Mehr als {max} Weiterleitungen hintereinander.',
      'clientehttp.curl_invalido': 'Der Text ist kein gültiger curl-Befehl.',
      'clientehttp.curl_grande': 'Der curl-Text ist zu groß (höchstens 64 KB).',
      'clientehttp.no_existe': 'Der Eintrag existiert nicht mehr.',
      'clientehttp.limite': 'Die Obergrenze für gespeicherte Einträge wurde erreicht.',
      'ejemplohttp.no_arranca': 'Der Beispielserver konnte nicht gestartet werden.',
      'laboratoriogit.sin_git': 'Git ist auf diesem Computer nicht installiert.',
      'laboratoriogit.orden_invalida': 'Dieser Befehl steht nicht in der Liste des Labors.',
      'laboratoriogit.nombre_invalido':
        'Der Name darf nur Buchstaben, Ziffern, Bindestriche und Unterstriche enthalten (bis zu 30 Zeichen).',
      'laboratoriogit.mensaje_invalido':
        'Die Nachricht muss einzeilig sein, höchstens 200 Zeichen haben und darf nicht mit „-“ beginnen.',
      'laboratoriogit.archivo_invalido': 'Diese Datei gehört nicht zu den Übungsdateien.',
      'laboratoriogit.contenido_invalido': 'Der Inhalt muss Text mit höchstens 2000 Zeichen sein.',
      'laboratoriogit.ruta_insegura':
        'Der Laborordner ist nicht der erwartete, daher bleibt er unangetastet.',
      'laboratoriogit.fallo_sistema':
        'Das System hat nicht erlaubt, den Laborordner vorzubereiten oder zu verwenden. Versuchen Sie „Labor zurücksetzen“.',
      'buscar.ruta_vetada':
        'Dieser Ordner enthält Daten von WolfCore Dev: Er wird nicht durchsucht.',
      'buscar.resultado_caducado': 'Dieses Ergebnis ist nicht mehr verfügbar: Suchen Sie erneut.',
      'buscar.resultado_invalido': 'Dieses Ergebnis kann nicht geöffnet werden.',
      'diff.raiz_invalida': 'Wählen Sie zwei vorhandene Ordner, die keine Verknüpfungen sind.',
      'diff.ruta_vetada': 'Dieser Ordner enthält Daten von WolfCore Dev: Er wird nicht verglichen.',
      'diff.cancelado': 'Vergleich abgebrochen.',
      'diff.plazo': 'Der Vergleich hat länger als {segundos} s gedauert und wurde abgebrochen.',
      'diff.memoria':
        'Der Vergleich benötigt zu viel Speicher (mehr als {maximo}) und wurde abgebrochen.',
      'diff.ocupado': 'Ein Vergleich läuft bereits: Brechen Sie ihn ab oder warten Sie.',
      'diff.caducado': 'Dieser Vergleich ist nicht mehr verfügbar: Vergleichen Sie erneut.',
      'diff.archivo_invalido':
        'Diese Datei kann nicht mehr verglichen werden: Sie wurde geändert oder ist verschwunden.',
      'diff.fallo': 'Der Vergleich ist fehlgeschlagen.',
      'red.sin_confirmar': 'Bestätigen Sie die Aktion im Dialog, bevor Sie fortfahren.',
      'red.rango_no_permitido':
        'Es werden nur private Netzwerke (10.x, 172.16 bis 172.31 und 192.168.x) mit bis zu 254 Geräten erkundet.',
      'red.sin_adaptador': 'Es gibt kein aktives Netzwerk zum Erkunden.',
      'red.red_publica': 'In öffentlichen Netzwerken werden keine anderen Geräte erkundet.',
      'red.perfil_desconocido':
        'Es konnte nicht geprüft werden, ob das Netzwerk privat oder öffentlich ist; daher werden keine anderen Geräte erkundet.',
      'red.ocupado':
        'Es läuft bereits ein anderer Vorgang von Mein Netzwerk: Warten Sie, bis er beendet ist.',
      'red.equipo_no_valido':
        'Es werden nur private IPv4-Adressen des lokalen Netzwerks akzeptiert.',
      'red.equipo_desconocido':
        'Dieses Gerät ist nicht in der Liste: Lesen Sie das Netzwerk erneut.',
      'red.recurso_no_valido': 'Diese Ressource ist nicht in der Liste des Geräts.',
      'red.carpeta_no_valida': 'Diese Freigabe kann von hier aus nicht entfernt werden.',
      'red.lectura_fallo': 'Das Netzwerk dieses Computers konnte nicht gelesen werden.',
      'red.quitar_fallo': 'Die Freigabe des Ordners konnte nicht beendet werden.',
      'red.velocidad_fallo':
        'Die Geschwindigkeit konnte nicht gemessen werden: Prüfen Sie die Verbindung.',
      'compartir.confirmacion_requerida':
        'Die Freigabe im Internet muss im Fenster von WolfCore Dev bestätigt werden.',
      'compartir.ocupado': 'Es ist bereits etwas freigegeben: Beenden Sie zuerst die Freigabe.',
      'compartir.ruta_invalida': 'Wählen Sie einen vorhandenen Ordner oder eine vorhandene Datei.',
      'compartir.duracion_invalida': 'Wählen Sie 15 Minuten, 1 Stunde oder 4 Stunden.',
      'compartir.proveedor_invalido':
        'Dieser Tunnel wird nicht unterstützt: Verwenden Sie Cloudflare oder ngrok.',
      'compartir.raiz_unidad':
        'Das Stammverzeichnis eines Laufwerks wird nicht freigegeben. Wählen Sie einen Ordner darin.',
      'compartir.carpeta_usuario':
        'Der gesamte persönliche Ordner (oder ein Ordner, der ihn enthält) wird nicht freigegeben. Wählen Sie einen Unterordner.',
      'compartir.carpeta_datos': 'Der Datenordner von WolfCore Dev wird nicht freigegeben.',
      'compartir.sitio_datos_reales':
        'Eine Site mit echten Daten (oder etwas darin) wird nicht freigegeben.',
      'compartir.carpeta_secretos':
        'Dieser Ordner enthält Schlüssel (.ssh, .aws, .git…) und wird nicht freigegeben.',
      'compartir.carpeta_sistema': 'Systemordner werden nicht freigegeben.',
      'compartir.archivo_sensible':
        'Diese Datei enthält anscheinend ein Geheimnis oder echte Daten und wird nicht freigegeben.',
      'compartir.carpeta_perfil':
        'Die Daten der Programme des Benutzers (AppData, .claude, .config…) werden nicht freigegeben.',
      'compartir.archivo_grande':
        'Diese Datei ist zu groß für eine Prüfung und weder eine Mediendatei noch ein Paket: Sie wird nicht freigegeben.',
      'compartir.tunel_sin_url':
        'Der Tunnel hat seine Adresse nicht innerhalb von {segundos} s geliefert. Versuchen Sie es erneut.',
      'compartir.tunel_cerrado': 'Der Tunnel wurde geschlossen, bevor er fertig geöffnet war.',
      'compartir.fallo': 'Freigabe nicht möglich.',
      'disco.raiz_invalida': 'Wählen Sie einen vorhandenen, lesbaren Ordner oder ein Laufwerk.',
      'disco.cancelado': 'Analyse abgebrochen.',
      'info.ruta_invalida': 'Der Pfad ist ungültig: Er muss absolut und lokal sein.',
      'info.no_existe': 'Die Datei oder der Ordner existiert nicht.',
      'info.sin_ruta':
        'Dieses Element ist keine Datei auf der Festplatte (z. B. ein Anhang oder etwas in einer ZIP-Datei): Speichern Sie es zuerst in einem Ordner.',
      'info.enlace':
        'Das ist eine Verknüpfung: Wählen Sie stattdessen die Zieldatei oder den Zielordner.',
      'info.hash_grande':
        'Die Datei ist größer als {maximo} MB: Die Hashes werden nicht berechnet.',
      'disco.plazo': 'Die Analyse hat länger als {minutos} min gedauert und wurde abgebrochen.',
      'disco.memoria': 'Die Analyse benötigt zu viel Speicher (über {maximo}).',
      'disco.ocupado': 'Eine Analyse läuft bereits: Brechen Sie sie ab oder warten Sie.',
      'disco.caducado': 'Diese Analyse ist nicht mehr verfügbar: Analysieren Sie erneut.',
      'disco.entrada_invalida':
        'Dieser Ordner existiert nicht mehr oder hat sich geändert: Analysieren Sie erneut.',
      'disco.fallo': 'Die Analyse ist fehlgeschlagen.',
      'reverb.no_laravel': 'Reverb ist nur in Laravel-Projekten verfügbar.',
      'reverb.no_confiado':
        'Aktivieren Sie im Projekt „Ich vertraue diesem Repository“, um Reverb einzuschalten.',
      'reverb.sin_paquete':
        'Das Paket laravel/reverb fehlt: Installieren Sie es mit composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Bestätigen Sie, dass Sie Reverb einschalten möchten.',
      'reverb.sin_activar': 'Schalten Sie Reverb zuerst im Projekt ein.',
      'env.meilisearch_no_disponible':
        'Meilisearch ist nicht installiert: Installieren Sie es unter Dienste.',
      'bd.lentas_confirmar':
        'Das Protokollieren langsamer Abfragen zu ändern betrifft den gesamten Server: Es muss bestätigt werden. Es wurde nichts geändert.',
      'bd.lentas_umbral_invalido': 'Die Zeit muss zwischen 0,1 und 60 Sekunden liegen.',
      'bd.lentas_motor_no_soportado':
        'Langsame Abfragen lassen sich nur bei MySQL, MariaDB und PostgreSQL ändern, die von WolfCore Dev verwaltet werden.',
      'bd.lentas_literal_no_permitido':
        'Das SQL wird nicht mit seinen Werten angezeigt: Die Datenbank enthält echte Daten oder die Abfrage lässt sich keiner bekannten Datenbank zuordnen.',
      'bd.lentas_entrada_no_existe':
        'Diese Abfrage steht nicht mehr im Protokoll. Lesen Sie es erneut.',
      'bd.lentas_fallo':
        'Das Protokoll langsamer Abfragen konnte nicht gelesen oder geändert werden. Prüfen Sie, ob der Server läuft.',
      'bd.esquema_base_no_existe': 'Die Datenbank existiert auf diesem Server nicht.',
      'bd.esquema_motor_no_soportado':
        'Die Schema-Ansicht ist für MySQL, MariaDB und PostgreSQL gedacht.',
      'bd.esquema_lectura_fallo':
        'Das Datenbankschema konnte nicht gelesen werden. Prüfen Sie, ob der Server läuft.',
      'captura.atajo_invalido':
        'Dieses Tastenkürzel ist ungültig: Verwenden Sie Strg, Alt, Umschalt oder Super mit einem Buchstaben, einer Ziffer oder einer F-Taste.',
      'captura.atajo_no_permitido':
        'Dieses Tastenkürzel ist nicht erlaubt: Verwenden Sie Strg oder Super mit einem weiteren Modifikator (Strg+Alt ohne Umschalt ist AltGr und verhindert die Eingabe von @) und vermeiden Sie gängige Kürzel wie Strg+C oder Alt+F4.',
      'captura.atajo_ocupado':
        'Das Tastenkürzel {atajo} wird bereits von einem anderen Programm verwendet.',
      'captura.no_disponible': 'Die Bildschirmaufnahme ist auf diesem Computer nicht verfügbar.',
      'captura.permiso_denegado': 'Die Berechtigung zur Bildschirmaufzeichnung fehlt.',
      'captura.sin_imagen': 'Es gibt kein Bild zum Aufnehmen.',
      'captura.imagen_invalida': 'Das Aufnahmebild ist ungültig.',
      'disco.sin_confirmar': 'Bestätigen Sie die Bereinigung im Dialog, bevor Sie fortfahren.',
      'disco.categoria_invalida': 'Diese Bereinigungskategorie existiert nicht.',
      'disco.ruta_vetada':
        'Die Kategorie berührt einen geschützten Pfad (Daten, Sicherungen, Projekte oder FlyEnv); es wurde nichts bereinigt.',
      'disco.sin_analisis':
        'Analysieren Sie erneut, bevor Sie bereinigen: Die Analyse ist abgelaufen oder fehlt.',
      'disco.ocupada': 'Eine Analyse oder Bereinigung läuft bereits.',
      'disco.sin_registro':
        'Das Bereinigungsprotokoll konnte nicht erstellt werden; es wurde nichts gelöscht.',
      'editor.sin_confirmar': 'Bestätigen Sie das Speichern, bevor Sie fortfahren.',
      'editor.confirmacion_reforzada':
        'Diese Datei enthält anscheinend Geheimnisse oder gehört zu einer Site mit echten Daten: Bestätigen Sie mit der zusätzlichen Prüfung, um sie zu speichern.',
      'editor.ruta_invalida': 'Der Dateipfad ist ungültig.',
      'editor.no_existe': 'Die Datei existiert nicht.',
      'editor.no_regular': 'Es können nur reguläre Dateien bearbeitet werden.',
      'editor.ruta_vetada':
        'Diese Datei liegt im Datenordner von WolfCore Dev: Sie kann im Editor weder geöffnet noch gespeichert werden.',
      'editor.archivo_env':
        'Die .env-Dateien werden über die Projektvariablen verwaltet, nicht über den Editor.',
      'editor.demasiado_grande': 'Die Datei ist zu groß für den Editor (maximal {maximo}).',
      'editor.binario':
        'Die Datei ist kein Text (sie ist binär): Sie kann hier nicht bearbeitet werden.',
      'editor.codificacion':
        'Die Datei ist nicht UTF-8: Der Editor öffnet sie nicht, um sie nicht zu beschädigen.',
      'editor.no_abierto':
        'Diese Datei wurde nicht im Editor geöffnet (oder ihre Version hat sich geändert): Öffnen Sie sie erneut.',
      'editor.eol_mixto':
        'Die Datei mischt Zeilenenden: Bestätigen Sie deren Vereinheitlichung, um zu speichern.',
      'editor.contenido_invalido': 'Der Inhalt ist kein gültiger Text.',
      'editor.huella_invalida':
        'Der Fingerabdruck der geöffneten Datei fehlt: Öffnen Sie sie erneut.',
      'editor.archivo_cambiado':
        'Die Datei wurde seit dem Öffnen außerhalb des Editors geändert. Laden Sie sie neu oder bestätigen Sie das Überschreiben.',
      'editor.copia_fallo':
        'Die Sicherungskopie konnte nicht erstellt werden ({codigo}); es wurde nichts gespeichert.',
      'editor.lectura_fallo': 'Die Datei konnte nicht gelesen werden ({codigo}).',
      'editor.escritura_fallo':
        'Die Datei konnte nicht gespeichert werden ({codigo}). Das Original wurde nicht angetastet.',
      'memoria.sin_confirmar': 'Bestätigen Sie die Aktion im Dialog, bevor Sie fortfahren.',
      'memoria.modo_invalido': 'Dieser Optimierungsmodus existiert nicht.',
      'memoria.plan_caducado':
        'Die Liste ist abgelaufen oder nicht mehr die aktuelle. Zeigen Sie sie vor dem Anwenden erneut an.',
      'memoria.no_disponible':
        'Der Speicheroptimierer ist hier nicht verfügbar oder konnte das System nicht lesen.',
      'conversor.ocupado':
        'Eine Konvertierung läuft bereits und eine weitere wartet: Warten Sie, bis sie abgeschlossen ist.',
      'doctor.firewall_reglas_acotadas':
        'Es gibt {cantidad} Regel(n) für Programme von WolfCore Dev, die auf das lokale Netzwerk beschränkt sind (nur privates Profil, lokales Subnetz und bestimmte Ports), wie sie die App selbst zum Freigeben einer Site empfiehlt. Sie werden nur angezeigt: Von hier aus werden sie nicht entfernt.',
      'doctor.firewall_almacen_inseguro':
        'Der geschützten Kopie der Regeln kann nicht vertraut werden (Berechtigungen oder Inhalt weichen von dem Angezeigten ab): Es wurde keine Regel erstellt oder geändert.',
      'doctor.firewall_quitadas':
        'WolfCore Dev hat zuvor {cantidad} Firewall-Regel(n) entfernt und eine Kopie behalten: Sie können sie bei Bedarf neu erstellen.',
      'doctor.firewall_parcial':
        'Einige Regeln wurden entfernt, andere nicht: Sie haben sich seit der Anzeige der Liste geändert, stammten nicht von WolfCore Dev oder Windows hat das Entfernen nicht erlaubt. Prüfen Sie die Liste.',
      'doctor.firewall_sin_cambios':
        'Es wurde keine Regel geändert: Sie stimmen nicht mehr mit dem Angezeigten überein oder konnten nicht geändert werden.',
      'doctor.firewall_registro_fallido':
        'Die Kopie der Regeln konnte nicht im geschützten Registrierungsschlüssel HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos gespeichert werden: Es wurde nichts geändert.',
      'catalogo.paquete_invalido':
        'Das heruntergeladene Paket ist nicht sicher (Pfade außerhalb des Ordners, Verknüpfungen oder übermäßige Größe).',
      'catalogo.extraccion_fallo':
        'Das heruntergeladene .7z-Paket konnte nicht gelesen oder entpackt werden.',
      'runtimes.falta_runtime':
        '{nombre} ist für dieses Projekt nicht installiert: Installieren Sie es unter Dienste.',
      'runtimes.falta_jdk':
        'Für dieses Projekt ist kein JDK installiert: Installieren Sie Java unter Dienste.',
      'runtimes.instalacion_incompleta':
        'Die Installation von {nombre} ist unvollständig: Installieren Sie es unter Dienste erneut.',
      'procesos.escucha_publica':
        'Der Prozess lauscht auf {direccion}:{puerto} ({programa}) und ist damit im Netzwerk erreichbar. Er wurde beendet: Er darf nur auf 127.0.0.1 lauschen.',
      'procesos.escucha_publica_livereload':
        'Der Prozess lauscht auf {direccion}:{puerto} ({programa}) und ist damit im Netzwerk erreichbar. Er wurde beendet: Er darf nur auf 127.0.0.1 lauschen. Das ist Spring DevTools LiveReload: Schalten Sie es mit spring.devtools.livereload.enabled=false aus.',
      'procesos.escucha_publica_inspector':
        'Der Prozess lauscht auf {direccion}:{puerto} ({programa}) und ist damit im Netzwerk erreichbar. Er wurde beendet: Er darf nur auf 127.0.0.1 lauschen. Das ist der Node-Inspector: Verwenden Sie --inspect=127.0.0.1.',
    },
  },
  inicio: {
    servicios: {
      irA: (nombre) => `Zum Dienst ${nombre}`,
    },
    tuneles: {
      irA: (nombre) => `Zum Projekt ${nombre}`,
    },
  },
  servicios: {
    sinParaEncender: 'Es sind keine installierten Dienste zum Starten vorhanden',
    franjaExternos: {
      texto:
        'Sie haben den Webserver oder PHP noch nicht installiert. Externe Engines wurden automatisch erkannt.',
      accion: 'Nginx und PHP installieren',
    },
    externos: {
      titulo: 'Auf Ihrem Computer erkannt',
      ayuda: 'Ein anderes Programm verwaltet sie; WolfCore Dev zeigt sie nur an.',
    },
    borrarDatos: {
      que: {
        meilisearch: 'alle Meilisearch-Indizes',
      },
    },
    ftp: {
      redLocalAyuda:
        'Wenn deaktiviert, kann sich nur dieser Computer verbinden (127.0.0.1). Jedes Projekt aktiviert seinen Zugang unter Projekte.',
      compartir: {
        enlace: 'Ordner oder Datei freigeben…',
        ayuda:
          'FTP wird nicht über einen Tunnel freigegeben: Es ist unverschlüsselt und der Tunnel überträgt nur HTTP. Um etwas im Internet zu veröffentlichen, verwenden Sie „Ordner oder Datei freigeben“ (HTTP, nur lesend); FTP bleibt im lokalen Netzwerk.',
      },
    },
    datosConexion: 'Verbindungsdaten',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Verbindung zu Meilisearch',
      notaMeilisearch:
        'Zur Verwendung in einem Projekt: Variablen (.env) → Block hinzufügen → Meilisearch. Es wird eine Vorschau mit maskiertem Schlüssel angezeigt und eine Bestätigung verlangt. Der Schlüssel gehört nur zu diesem Computer.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Suche für Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (lokaler Port)',
      springboot: 'Spring Boot (lokaler Port)',
      aspnet: 'ASP.NET Core (lokaler Port)',
    },
    tiposCortos: {
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    },
  },
  tunel: {
    sinConfianza:
      'Diesem Projekt wird nicht vertraut: Aktivieren Sie „Ich vertraue diesem Repository“, um es veröffentlichen zu können.',
  },
  tuneles: {
    irAProyectos: 'Zu Projekte',
    compartir: {
      enlace: 'Ordner oder Datei freigeben…',
      ayuda:
        'Veröffentlicht einen Ordner oder eine einzelne Datei (nur lesend), ohne dass eine Site nötig ist.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Der Reverb-Prozess dieses Projekts hat nicht den Befehl von WolfCore Dev (anderer Host, anderes Programm oder anderer Port). Beim Einschalten wird er durch den Standardprozess ersetzt, der nur auf 127.0.0.1 lauscht.',
    ayuda: 'Laravel WebSockets, nur auf 127.0.0.1.',
    puerto: (p) => `Port ${p}`,
    interruptor: (dominio) => `Reverb für ${dominio} ein- oder ausschalten`,
    activarTitulo: 'Reverb einschalten?',
    activarTexto: (dominio) =>
      `„php artisan reverb:start“ wird in ${dominio} ausgeführt und lauscht nur auf 127.0.0.1 an einem freien Port. Der Code des Projekts läuft mit dessen PHP.`,
    desactivarTitulo: 'Reverb ausschalten?',
    desactivarTexto:
      'Der Prozess wird beendet und aus dem Projekt entfernt. Die REVERB_*-Variablen in .env bleiben unverändert.',
    activar: 'Einschalten',
    desactivar: 'Ausschalten',
    proponer: 'REVERB_*-Variablen vorschlagen',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Gestoppt',
      iniciando: 'Wird gestartet',
      encendido: 'Läuft',
      error: 'Fehlgeschlagen',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP ist nur für das lokale Netzwerk gedacht: Es wird nicht über einen Internet-Tunnel freigegeben, da es Passwort und Dateien unverschlüsselt sendet.',
    compartirIr: 'Ordner oder Datei mit einem temporären Link freigeben',
  },
  ia: {
    pestanas: {
      etiqueta: 'KI-Bereiche',
      agentes: 'Agenten',
      nube: 'Cloud',
      local: 'Lokale Modelle',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram:
        'Für Ihren Computer: Modelle bis ≈{b}B, die in den Speicher der Grafikkarte passen.',
      sugerenciaRam: 'Für Ihren Computer: Modelle bis ≈{b}B, die im Arbeitsspeicher laufen.',
      sugerenciaPequena: 'Für Ihren Computer: nur sehr kleine Modelle (unter 1B).',
      sugerenciaDesconocida:
        'Die Hardware Ihres Computers konnte nicht gelesen werden, daher gibt es keine Empfehlung.',
      aviso: 'Dies ist nur eine Orientierung: Sie können jedes Modell herunterladen.',
      comprobando: 'Ihr Computer wird geprüft…',
      niveles: {
        recomendado: 'Empfohlen',
        lento: 'Kann langsam sein',
        'no-cabe': 'Passt nicht',
        desconocido: 'Keine Daten',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Passt bequem in den Grafikkartenspeicher (benötigt ≈{necesario} von {disponible}).',
        'justo-vram':
          'Passt in die Grafikkarte, aber nur knapp (benötigt ≈{necesario} von {disponible}).',
        'solo-ram':
          'Passt nicht in die Grafikkarte und läuft im Arbeitsspeicher (benötigt ≈{necesario} von {disponible} nutzbar): langsamer.',
        'cabe-ram':
          'Passt bequem in den Arbeitsspeicher (benötigt ≈{necesario} von {disponible} nutzbar).',
        'ram-justo':
          'Passt in den Arbeitsspeicher, aber nur knapp (benötigt ≈{necesario} von {disponible} nutzbar): kann langsam sein.',
        'sin-memoria': 'Benötigt ≈{necesario} Speicher, Ihr Computer verfügt über ≈{disponible}.',
        'sin-disco':
          'Es ist nicht genug freier Speicherplatz für den Download vorhanden (noch {disponible}).',
        'tamano-desconocido':
          'Die Modellgröße konnte nicht abgefragt werden (keine Verbindung zur Ollama-Registry).',
        'equipo-desconocido': 'Der Speicher Ihres Computers konnte nicht gelesen werden.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'Sie können den Download jederzeit abbrechen; bereits Heruntergeladenes wird verworfen.',
      tamano: (t) => `Downloadgröße: ${t}.`,
      tamanoDesconocido:
        'Die Größe konnte nicht geprüft werden (keine Verbindung zur Ollama-Registry). Modelle haben meist 1 bis über 40 GB.',
      libre: (l) => `Freier Speicherplatz auf dem Modell-Laufwerk: ${l}.`,
      libreDesconocido: 'Der freie Speicherplatz konnte nicht ermittelt werden.',
      sinEspacio: (t, l) =>
        `Nicht genug Platz: Das Modell benötigt ${t}, aber nur ${l} sind frei. Schaffen Sie Platz oder wählen Sie ein kleineres Modell.`,
    },
  },
  proyectos: {
    asistente: {
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    tarjeta: {
      verEnBases: 'In Datenbanken anzeigen',
    },
  },
  panel: {
    insignias: {
      memoriaAlta: 'Hoher Speicherverbrauch',
    },
    discos: {
      titulo: 'Speicherplatz',
      leyendo: 'Laufwerke werden gelesen…',
      sistema: 'System',
      datos: 'WolfCore-Daten',
      ambos: 'System und WolfCore-Daten',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} frei (${pct} %)`,
      poco: 'Wenig freier Speicher',
      casiLleno: 'Fast kein Speicher mehr',
      liberar: 'Speicher freigeben',
      versiones: 'Ungenutzte Versionen bereinigen',
      temporales: 'Temporäre Dateien und Caches von WolfCore bereinigen',
      ocupaMas: 'Sehen, was am meisten Platz belegt',
    },
    alertas: {
      grupo: (n) => `Gefundene Probleme (${n})`,
      verTodos: (n) => `Alle ${n} anzeigen`,
      verMenos: 'Weniger anzeigen',
      masAcciones: 'Weitere Aktionen',
    },
    procesos: {
      resto: 'Weitere Dienste',
    },
  },
  captura: {
    barra: 'Zeichenwerkzeuge',
    herramientas: {
      recuadro: 'Rahmen',
      flecha: 'Pfeil',
      linea: 'Linie',
      resaltador: 'Textmarker',
      texto: 'Text',
      pixelar: 'Verpixeln',
      pixelarAyuda: 'Verpixeln (nicht sicher für sensible Daten: Verwenden Sie Verdecken)',
      ocultar: 'Verdecken',
      ocultarAyuda: 'Mit einer deckenden Fläche verdecken (empfohlen für sensible Daten)',
    },
    deshacer: 'Rückgängig',
    rehacer: 'Wiederholen',
    copiar: 'Kopieren',
    copiarAyuda:
      'In die Zwischenablage kopieren. Die Windows-Zwischenablage kann es im Verlauf behalten oder mit anderen Geräten synchronisieren.',
    guardar: 'Speichern…',
    alConversor: 'An den Bildkonverter senden',
    cerrar: 'Abbrechen (Esc)',
    nuevaSeleccion: 'Neue Auswahl',
    color: 'Farbe',
    grosor: 'Stärke',
    formato: 'Format',
    cargando: 'Aufnahme wird vorbereitet…',
    guiaRegion: 'Ziehen Sie, um den Bereich zu wählen. Esc bricht ab.',
    guiaVentana: 'Wählen Sie das Fenster, das Sie aufnehmen möchten. Esc bricht ab.',
    sinVentanas: 'Es gibt keine Fenster, die aufgenommen werden können.',
    textoPlaceholder: 'Eingeben und Enter drücken',
    copiada: 'In die Zwischenablage kopiert',
    guardada: (archivo) => `Gespeichert unter ${archivo}`,
    errorCargar: 'Die Aufnahme konnte nicht geöffnet werden.',
    errorCopiar: 'Das Bild konnte nicht kopiert werden.',
    errorGuardar: 'Das Bild konnte nicht gespeichert werden.',
    errorConversor: 'Das Bild konnte nicht an den Konverter gesendet werden.',
    errorVentana: 'Dieses Fenster konnte nicht aufgenommen werden.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Alles geschieht auf diesem Computer: Die Aufnahme wird nicht zu einem Dienst hochgeladen und erst auf der Festplatte gespeichert, wenn Sie sie speichern. Fenster von WolfCore Dev werden kurz ausgeblendet, damit sie nicht im Bild erscheinen.',
      region: 'Bereich',
      regionAyuda: 'Ziehen Sie über den Bildschirm, um den Bereich zu wählen.',
      ventana: 'Fenster',
      ventanaAyuda: 'Wählen Sie eines der geöffneten Fenster.',
      pantalla: 'Ganzer Bildschirm',
      pantallaAyuda: 'Der Bildschirm, auf dem sich der Mauszeiger befindet.',
      atajoActivo: (atajo) => `Globales Tastenkürzel aktiv: ${atajo} (Bereich).`,
      atajoInactivo: 'Es gibt kein globales Tastenkürzel. Aktivieren Sie es in den Einstellungen.',
      noDisponible: 'Die Bildschirmaufnahme ist auf diesem Computer nicht verfügbar.',
      permisoDenegado:
        'Die Berechtigung zur Bildschirmaufzeichnung fehlt. Aktivieren Sie sie für WolfCore Dev in den Systemeinstellungen.',
      ocupada: 'Eine Aufnahme läuft bereits.',
    },
    ajustes: {
      titulo: 'Bildschirmaufnahme',
      descripcion:
        'Bereich, Fenster oder ganzer Bildschirm mit einem Schnelleditor. Alles bleibt lokal: Nichts wird hochgeladen oder gespeichert, bevor Sie es entscheiden.',
      activar: 'Globales Tastenkürzel',
      activarAyuda:
        'Standardmäßig aus. Wenn aktiviert, wird es nur registriert, falls kein anderes Programm es verwendet, und beim Beenden von WolfCore Dev wieder freigegeben.',
      atajo: 'Kombination',
      grabar: 'Ändern',
      grabando: 'Drücken Sie die Kombination…',
      grabandoAyuda:
        'Verwenden Sie Strg oder Super mit einem weiteren Modifikator (zum Beispiel Strg+Alt+Umschalt) und einem Buchstaben, einer Ziffer oder einer F-Taste. Vermeiden Sie gängige Kürzel wie Strg+C.',
      formato: 'Format beim Speichern',
      activado: (atajo) => `Tastenkürzel ${atajo} aktiviert.`,
      desactivado: 'Tastenkürzel deaktiviert.',
      ocupado: (atajo) =>
        `Das Tastenkürzel ${atajo} wird bereits von einem anderen Programm verwendet und es wurde nichts geändert. Versuchen Sie eine andere Kombination.`,
      ocupadoInicio:
        'Das gespeicherte Tastenkürzel wird bereits von einem anderen Programm verwendet und wurde nicht registriert. Wählen Sie eine andere Kombination.',
      sinPermiso:
        'Unter macOS ist die Berechtigung zur Bildschirmaufzeichnung erforderlich; sie wird bei der ersten Aufnahme abgefragt.',
      formatoGuardado: 'Format gespeichert.',
    },
  },
  ajustes: {
    avisos: {
      tipos: {
        'salud-disco': 'Hinweise zum Laufwerkzustand',
      },
    },
  },
  avisos: {
    hacerRespaldo: 'Jetzt Sicherung erstellen',
  },
  herramientas: {
    entorno: {
      discos: {
        titulo: 'Zustand der Laufwerke',
        intro:
          'Der Zustand jedes Laufwerks laut Windows, ohne etwas zu installieren. Nur Lesezugriff: Auf den Laufwerken wird nichts geändert.',
        actualizar: 'Aktualisieren',
        leerAdmin: 'Mit Administratorrechten lesen',
        leerAdminAyuda:
          'Windows fragt nur nach, wenn Sie diese Schaltfläche drücken (UAC). Es werden ausschließlich Daten gelesen, und es geschieht nie von selbst.',
        sinDiscos: 'Windows hat kein physisches Laufwerk gemeldet.',
        numeroDisco: 'Laufwerk {n}',
        unidades: 'Laufwerke: {u}',
        sinUnidades: 'Ohne Laufwerkbuchstaben',
        datosWolf: 'Daten von WolfCore Dev',
        proyectos: 'Projekte',
        tipoDesconocido: 'Typ nicht angegeben',
        veredictos: {
          bien: 'Gut',
          atencion: 'Achtung',
          critico: 'Kritisch',
          no_disponible: 'Nicht verfügbar',
        },
        motivos: {
          estado_warning: 'Windows meldet den Zustand „Warning“ (Warnung).',
          estado_unhealthy: 'Windows meldet den Zustand „Unhealthy“ (fehlerhaft).',
          estado_operacional: 'Der Betriebsstatus weist auf einen Fehler hin ({estado}).',
          errores_sin_corregir:
            'Es gibt unkorrigierte Fehler (Lesen: {lectura}, Schreiben: {escritura}).',
          prediccion_fallo: 'Das Laufwerk sagt einen Ausfall voraus (SMART).',
          desgaste: 'Verschleiß von {desgaste} % (Schwelle: {umbral} %).',
          temperatura: 'Temperatur von {temperatura} °C (Grenzwert: {limite} °C).',
          errores_corregidos_suben:
            'Die korrigierten Lesefehler sind seit der vorigen Messung gestiegen (insgesamt {cantidad}).',
        },
        contadores: {
          temperatura: 'Temperatur',
          desgaste: 'Verschleiß',
          lecturaCorregidos: 'Korrigierte Lesefehler',
          lecturaNoCorregidos: 'Unkorrigierte Lesefehler',
          escrituraCorregidos: 'Korrigierte Schreibfehler',
          escrituraNoCorregidos: 'Unkorrigierte Schreibfehler',
          horas: 'Betriebsstunden',
          prediccion: 'Ausfallvorhersage',
        },
        noDisponible: 'Nicht verfügbar',
        noDisponibleMotivo: 'Nicht verfügbar ({motivo})',
        motivoSin: {
          admin: 'erfordert Administratorrechte',
          bus: 'Diese Anschlussart (USB oder RAID) stellt keine Zähler bereit',
          no_soportado: 'das Laufwerk oder sein Controller unterstützt sie nicht',
          no_leidos: 'Windows hat keine Werte geliefert',
        },
        prediccionSin: {
          sin_acceso: 'erfordert Administratorrechte',
          no_disponible: 'dieser Computer bietet sie nicht an',
        },
        prediccionSinFallo: 'Kein Ausfall zu erwarten',
        prediccionFallo: 'Ausfall zu erwarten',
        bienSoloEstado: 'In Ordnung (nur der von Windows gemeldete Zustand)',
        noAplicaHdd: 'Nicht zutreffend (HDD)',
        ultimoDatoAdmin: 'Letzte Daten mit Administratorrechten: {fecha}',
        ultimoDatoContadores: 'Letzte Zählerdaten: {fecha}',
        horasValor: '{n} Std.',
        criterios: {
          titulo: 'Wie wird die Bewertung festgelegt?',
          critico:
            'Kritisch: Windows meldet den Zustand Warning oder Unhealthy bzw. einen Betriebsfehler, es gibt unkorrigierte Fehler oder das Laufwerk sagt einen Ausfall voraus.',
          atencion:
            'Achtung: Verschleiß ab {desgaste} %, Temperatur über dem Höchstwert des Herstellers (ohne diesen ab {ssd} °C bei SSD und NVMe bzw. ab {hdd} °C bei Festplatten) oder korrigierte Lesefehler, die gegenüber der vorigen Messung zunehmen.',
          bien: 'Gut: Zustand Healthy und nichts von dem Obigen.',
          noDisponible:
            'Nicht verfügbar: Windows hat zu diesem Laufwerk nicht genügend Daten geliefert.',
        },
        leidoAdmin: 'Daten mit Administratorrechten gelesen.',
        requiereAdminAviso:
          'Einige Daten erfordern Administratorrechte. Sie können sie mit der Schaltfläche oben lesen: Windows fragt erst dann nach Ihrer Erlaubnis.',
        nota: 'Diese Auslesung dient der Orientierung und garantiert nichts: Ein gutes Zeichen verhindert keinen Ausfall. Bewahren Sie Sicherungen des Wichtigen auf.',
        privacidad: 'Seriennummern und eindeutige Kennungen werden weder gelesen noch angezeigt.',
      },
      eventosDisco: {
        titulo: 'Laufwerkereignisse',
        intro:
          'Einträge des Windows-Systemprotokolls zu den Laufwerken aus den letzten {dias} Tagen. Nur Lesezugriff.',
        actualizar: 'Ereignisse aktualisieren',
        copiar: 'Ereignisse kopieren',
        copiado: 'Ereignisse kopiert',
        vacio: 'In den letzten {dias} Tagen gab es keine Laufwerkereignisse.',
        sinDisco: 'Laufwerk nicht angegeben',
        disco: 'Laufwerk {n}',
        unidad: 'Laufwerk {u}',
        gravedad: {
          info: 'Information',
          aviso: 'Warnung',
          critico: 'Kritisch',
        },
        explicaciones: {
          disco_7: 'Das Laufwerk hat einen fehlerhaften Block.',
          disco_11: 'Der Controller hat einen Fehler am Laufwerk erkannt.',
          disco_51: 'Bei einem Auslagerungsvorgang ist am Laufwerk ein Fehler aufgetreten.',
          disco_52: 'Das Laufwerk sagt voraus, dass es ausfallen wird.',
          disco_55: 'Im Dateisystem eines Laufwerks wurde eine Beschädigung erkannt.',
          disco_129:
            'Windows musste den Laufwerkcontroller zurücksetzen, weil er nicht antwortete.',
          disco_98: 'Windows hat das Volume geprüft und es ist in Ordnung.',
          disco_140:
            'Das System konnte keine Daten in das Transaktionsprotokoll des Volumes schreiben; es kann zu Beschädigungen kommen.',
          disco_153: 'Ein Laufwerkvorgang ist fehlgeschlagen und wurde wiederholt.',
          disco_157: 'Das Laufwerk wurde unerwartet getrennt.',
        },
        tope: 'Es werden höchstens {n} Ereignisse angezeigt.',
        cabeceraCopia: 'Laufwerkereignisse (letzte {dias} Tage)',
      },
      equipo: {
        titulo: 'Mein Computer',
        copiarResumen: 'Zusammenfassung kopieren',
        resumenCopiado: 'Zusammenfassung kopiert',
        privacidad: 'Die Zusammenfassung enthält keine Seriennummern oder eindeutigen Kennungen.',
        desconocido: 'unbekannt',
        sinGpu: 'Keine erkannt',
        so: 'Betriebssystem',
        cpu: 'Prozessor',
        ram: 'Arbeitsspeicher (RAM)',
        gpu: 'Grafikkarte',
        placa: 'Hauptplatine',
        disco: 'Laufwerk {u}',
        compilacion: 'Build {n}',
        nucleosHilos: '{n} Kerne, {h} Threads',
        ramDetalle: '{total} gesamt, {libre} frei',
        vram: '{v} VRAM',
        discoDetalle: '{libre} frei von {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Computerübersicht · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Computerübersicht · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: 'Legen Sie hier eine Datei oder einen Ordner ab, um die Informationen zu sehen. Es wird nur gelesen: Nichts wird geändert.',
      soltarEnVentana: 'Zum Anzeigen der Informationen ablegen',
      ruta: 'Pfad',
      mime: 'MIME-Typ',
      creado: 'Erstellt',
      accedido: 'Letzter Zugriff',
      atributos: 'Attribute',
      soloLectura: 'Schreibgeschützt',
      oculto: 'Versteckt',
      ninguno: 'Keine',
      dimensiones: 'Abmessungen',
      sensible: 'Sensible Datei: Ihre Daten werden angezeigt, nie ihr Inhalt.',
      esArchivo: 'Datei',
      esCarpeta: 'Ordner',
      tamanoTotal: 'Gesamtgröße',
      archivos: 'Dateien',
      carpetas: 'Unterordner',
      analizando: 'Ordner wird analysiert…',
      cancelar: 'Abbrechen',
      cancelado: 'Analyse abgebrochen.',
      abrirDisco: 'In der Speicherbelegung öffnen',
      incompleto:
        'Einige Elemente wurden nicht gezählt: Verknüpfungen, verweigerte Zugriffe oder zu große Ordner.',
      raizUnidadTitulo: 'Gesamtes Laufwerk analysieren?',
      raizUnidadTexto:
        'Sie sind dabei, {ruta}, ein ganzes Laufwerk, zu analysieren. Das kann lange dauern und liest den gesamten Inhalt. Fortfahren?',
      raizUnidadAnalizar: 'Analysieren',
    },
    chmod: {
      permisos: 'Berechtigungen',
      propietario: 'Besitzer',
      grupo: 'Gruppe',
      otros: 'Andere',
      leer: 'Lesen (r)',
      escribir: 'Schreiben (w)',
      ejecutar: 'Ausführen (x)',
      especiales: 'Spezialbits',
      setuid: 'setuid: läuft mit den Rechten des Besitzers',
      setgid:
        'setgid: läuft mit den Rechten der Gruppe; bei einem Ordner erben neu darin angelegte Elemente die Gruppe',
      sticky: 'sticky: nur der Besitzer darf im Ordner löschen',
      habituales: 'Gängige Werte',
      octal: 'Oktal',
      simbolico: 'Symbolisch',
      octalInvalido: 'Geben Sie 3 oder 4 Ziffern von 0 bis 7 ein (zum Beispiel 755).',
      simbolicoInvalido: 'Geben Sie 9 Zeichen wie rwxr-xr-x ein.',
      ejemplo: 'Beispiel',
      archivo: 'Dateiname',
      archivoPorDefecto: 'datei',
      nota: 'Unter Windows ohne Bedeutung; gedacht für Linux- und macOS-Server.',
      avisoOtros:
        'Jeder Benutzer des Servers könnte die Datei ändern: Vermeiden Sie Schreibrechte für „Andere“.',
    },
    lista: {
      chmod: {
        nombre: 'chmod-Berechtigungen',
        descripcion: 'Kontrollkästchen, oktal und symbolisch, für Linux- und macOS-Server.',
      },
      clienteHttp: {
        nombre: 'HTTP-Client',
        descripcion: 'APIs ausprobieren: Anfragen, Umgebungen, Sammlungen und Verlauf.',
      },
      captura: {
        nombre: 'Bildschirmaufnahme',
        descripcion: 'Bereich, Fenster oder ganzer Bildschirm, mit einem Schnelleditor.',
      },
      guiaTuneles: {
        nombre: 'Tunnel-Leitfaden',
        descripcion: 'Cloudflare und ngrok Schritt für Schritt, mit Befehlen zum Kopieren.',
      },
      guiaHttp: {
        nombre: 'HTTP-Leitfaden',
        descripcion: 'Statuscodes und Methoden, mit Suche und Beispielen.',
      },
      guiaGit: {
        nombre: 'Git-und-GitHub-Leitfaden',
        descripcion: 'Befehle und Arbeitsabläufe, mit einem Labor zum sicheren Üben.',
      },
      limpiezaDisco: {
        nombre: 'Datenträgerbereinigung',
        descripcion:
          'Temporäre Dateien und neu erzeugbare Caches analysieren und löschen, mit Vorschau und Bestätigung.',
      },
      editor: {
        nombre: 'Code-Editor',
        descripcion:
          'Textdateien mit Hervorhebung, Sicherungskopie und bestätigtem Speichern bearbeiten.',
      },
      compartir: {
        nombre: 'Ordner oder Datei freigeben',
        descripcion:
          'Einen Ordner oder eine Datei mit einem temporären, schreibgeschützten Link im Internet veröffentlichen.',
      },
      miRed: {
        nombre: 'Mein Netzwerk',
        descripcion:
          'Ordner, die dieser Computer freigibt, Geräte im lokalen Netzwerk und Geschwindigkeitstest. Ohne Fernsteuerung.',
      },
      usoDisco: {
        nombre: 'Speicherbelegung',
        descripcion:
          'Was auf einem Laufwerk oder in einem Ordner Platz belegt: Baum, größte Dateien und Ordner, nach Erweiterung.',
      },
      diffCarpetas: {
        nombre: 'Ordnervergleich',
        descripcion:
          'Vergleicht zwei Ordner: nur in einem, nur im anderen und unterschiedlich, mit dem Diff jeder Datei.',
      },
      grabarPantalla: {
        nombre: 'Bildschirm aufzeichnen',
        descripcion: 'Öffnet den Rekorder, den Ihr System bereits mitbringt.',
      },
    },
    secciones: {
      codigo: 'Code',
      red: 'Netzwerk',
      seguridad: 'Sicherheit',
      archivos: 'Dateien und Medien',
      sistema: 'System',
    },
    tarjetas: {
      comparar: {
        nombre: 'Vergleichen',
        descripcion: 'Texte und Ordner: die Unterschiede nebeneinander.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'Aus einem Text oder Link, oder damit andere Ihrem WLAN beitreten können.',
      },
      guias: {
        nombre: 'Leitfäden',
        descripcion: 'HTTP, Tunnel und Git, mit Beispielen und Befehlen zum Kopieren.',
      },
    },
    pestanas: {
      diff: 'Texte',
      diffCarpetas: 'Ordner',
      qr: 'QR',
      qrWifi: 'WLAN',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunnel',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev hat keinen eigenen Rekorder: Es öffnet den, den Ihr System bereits mitbringt. Das Video wird dort gespeichert, wo dieses Programm es ablegt.',
      abrir: 'Rekorder öffnen',
      abierta: 'Snipping Tool geöffnet. Wählen Sie den Bildschirmbereich und drücken Sie Start.',
      noSePudo:
        'Snipping Tool konnte von hier aus nicht geöffnet werden. Verwenden Sie eines der Tastenkürzel im Leitfaden.',
      guiaTitulo: 'So zeichnen Sie auf Ihrem System auf',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Drücken Sie Win + Umschalt + R, um mit dem Snipping Tool aufzuzeichnen.',
            'Wenn Ihr Snipping Tool nicht aktuell ist, drücken Sie Win + Alt + R, um mit der Xbox Game Bar aufzuzeichnen.',
            'Beenden Sie die Aufnahme mit der Schaltfläche in der Leiste, die oben erscheint.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Drücken Sie Cmd + Umschalt + 5, um die Aufnahmeleiste zu öffnen.',
            'Wählen Sie, ob der gesamte Bildschirm oder ein Ausschnitt aufgezeichnet werden soll.',
            'Klicken Sie auf Aufnehmen und zum Beenden auf die Stopp-Schaltfläche in der Menüleiste.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Jeder Desktop bringt einen Rekorder mit: in GNOME Strg + Alt + Umschalt + R, in KDE Spectacle.',
            'Falls Sie keinen haben, installieren Sie OBS Studio oder SimpleScreenRecorder über Ihre Paketverwaltung.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `Ungültiger Ausdruck: ${detalle}` : 'Ungültiger Ausdruck.'),
      regexDetalle: {
        corchete: 'eine eckige Klammer „[“ wird nicht geschlossen.',
        parentesis: 'eine runde Klammer „(“ wird nicht geschlossen.',
        parentesisSobra: 'eine schließende runde Klammer „)“ hat keine öffnende.',
        nadaQueRepetir: 'ein Quantifizierer („*“, „+“, „?“ oder „{}“) hat nichts zu wiederholen.',
        barraAlFinal: 'das Muster darf nicht mit einem Backslash enden.',
        rangoInvertido: 'ein Bereich in einer Zeichenklasse ist umgekehrt (zum Beispiel „z-a“).',
        cuantificador:
          'der Quantifizierer „{}“ ist unvollständig oder seine Zahlen sind vertauscht.',
        grupo: 'der Name oder die Form einer Gruppe ist ungültig.',
        escape: 'eine Backslash-Escape-Sequenz ist ungültig.',
      },
    },
    busqueda: {
      excluir: 'Außerdem überspringen (durch Kommas getrennt)',
      incluirPesadas: 'Große Ordner einbeziehen (node_modules, vendor, .git…)',
      contexto: 'Kontextzeilen',
      grupoNombres: (n) => `Nach Name (${n})`,
      grupoContenido: (n) => `Nach Inhalt (${n})`,
      carpeta: 'Ordner',
      listaAria: 'Suchergebnisse',
      atajos:
        '↑ ↓ zum Bewegen, Enter zum Öffnen im Editor, Esc zum Abbrechen oder um zum Text zurückzukehren.',
      sensible: (n) => `Sensible Datei: Treffer in Zeile ${n} (ihr Inhalt wird nicht angezeigt).`,
      mostrarMas: (n) => `${n} weitere anzeigen`,
      linea: (n) => `Zeile ${n}`,
      sinGrupo: 'Keine Ergebnisse in dieser Gruppe.',
      topeBytes: 'Die Lesegrenze wurde erreicht: Engen Sie die Suche ein.',
    },
    compartir: {
      explicacion:
        'Veröffentlicht einen Ordner oder eine Datei dieses Computers mit einem temporären Link im Internet. Der Zugriff ist schreibgeschützt: Wer den Link hat, kann ansehen und herunterladen, aber nichts hochladen oder ändern. Der Link enthält einen geheimen Code, läuft zur gewählten Zeit ab und wird beim Beenden von WolfCore Dev geschlossen. .env-Dateien, Schlüssel, der Ordner .git und Sites mit echten Daten werden nie freigegeben.',
      eleccion: 'Was freigegeben werden soll',
      elegirCarpeta: 'Ordner wählen…',
      elegirArchivo: 'Datei wählen…',
      elegido: 'Gewählt',
      duracion: 'Freigabe beenden nach',
      duraciones: {
        m15: '15 Minuten',
        h1: '1 Stunde',
        h4: '4 Stunden',
      },
      tunel: 'Tunnel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (schnell, ohne Konto)',
        ngrok: 'ngrok (mit Ihrem Token)',
      },
      ngrokSinToken:
        'ngrok benötigt Ihren Token: Speichern Sie ihn in den Tunnel-Optionen einer Site.',
      compartir: 'Freigeben…',
      sinFtp:
        'FTP wird nicht über einen Tunnel freigegeben: Es ist unverschlüsselt und der Tunnel überträgt nur HTTP.',
      vacio: {
        titulo: 'Nichts ist freigegeben',
        texto:
          'Wählen Sie einen Ordner oder eine Datei, um einen temporären öffentlichen Link zu erhalten. Nichts wird veröffentlicht, bevor Sie es bestätigen.',
      },
      grandes:
        'Textdateien oder Dateien unbekannten Typs über 8 MB werden nicht freigegeben, weil sie nicht vollständig geprüft werden können; Bilder, Audio, Video und Pakete (zip, 7z, gz, pdf) schon. Sie erscheinen in der Liste markiert.',
      comprimidos:
        'Eine komprimierte Datei (.zip, .7z, .gz) wird unverändert freigegeben, ohne hineinzusehen: Enthält sie eine .env-Datei oder Schlüssel, werden diese veröffentlicht.',
      confirmar: {
        titulo: 'Im Internet freigeben',
        pregunta: 'Dies im Internet veröffentlichen?',
        rutaReal: 'Echter Pfad (Verknüpfungen aufgelöst)',
        ruta: 'Exakter Pfad',
        aviso: (dur) =>
          `Es ist ab dem Moment, in dem der Link bereit ist, ${dur} lang öffentlich im Internet. Jeder mit dem Link kann das Freigegebene ansehen und herunterladen.`,
        boton: 'Im Internet freigeben',
      },
      abriendo: 'Tunnel wird geöffnet…',
      activa: 'Freigabe aktiv',
      enlace: 'Öffentlicher Link',
      copiar: 'Link kopieren',
      qr: 'QR-Code des Links',
      vence: (hasta, restan) => `Läuft ab um ${hasta} (${restan})`,
      restan: (min) => (min <= 1 ? 'weniger als 1 Minute' : `${min} Min.`),
      dejar: 'Freigabe beenden',
      fin: {
        vencio: 'Die Zeit ist abgelaufen: Server und Tunnel wurden geschlossen.',
        tunel: 'Der Tunnel wurde geschlossen und die Freigabe beendet.',
      },
      registro: {
        titulo: 'Zugriffe',
        ayuda: 'Die letzten 200, nur im Speicher. Der geheime Code des Links wird nie angezeigt.',
        vacioTitulo: 'Noch keine Zugriffe',
        vacioTexto: 'Jedes Mal, wenn jemand den Link öffnet, erscheint es hier.',
        col: {
          hora: 'Uhrzeit',
          ip: 'IP',
          ruta: 'Pfad',
          codigo: 'Code',
        },
        sinPermiso: '(ohne den richtigen Code)',
      },
    },
    miRed: {
      explicacion:
        'Sehen Sie Ihr Netzwerk, ohne ein Gerät zu steuern: die Ordner, die dieser Computer freigibt, die Geräte im lokalen Netzwerk und einen Geschwindigkeitstest. Es wird nur gelesen und abgefragt: Es gibt keine Fernsteuerung, keinen Remotedesktop und keine Ausführung auf anderen Geräten.',
      carpetas: {
        titulo: 'Freigegebene Ordner dieses Computers',
        ayuda:
          'Was andere Geräte im Netzwerk auf diesem Computer öffnen können. Die administrativen Freigaben von Windows (C$, ADMIN$, IPC$) sind ausgeblendet und können von hier aus nicht entfernt werden.',
        mostrarAdministrativas: 'Administrative Freigaben anzeigen',
        administrativa: 'Administrativ',
        col: {
          nombre: 'Name',
          ruta: 'Ordner',
          descripcion: 'Beschreibung',
          usuarios: 'Verbindungen',
          acciones: 'Aktionen',
        },
        dejar: 'Freigabe beenden',
        vacioTitulo: 'Keine Ordner freigegeben',
        vacioTexto: 'Kein Ordner dieses Computers ist im Netzwerk freigegeben.',
        confirmar: {
          titulo: 'Freigabe eines Ordners beenden',
          pregunta: (nombre: string) => `Freigabe von „${nombre}“ beenden?`,
          efecto:
            'Andere Geräte sehen diesen Ordner dann nicht mehr. Seine Dateien werden weder gelöscht noch verschoben.',
          uac: 'Dafür sind Administratorrechte erforderlich: Windows zeigt eine Benutzerkontensteuerung (UAC) an, die Sie bestätigen müssen. Wenn Sie sie abbrechen oder nicht rechtzeitig antworten, wird nichts geändert.',
          entiendo:
            'Ich verstehe, dass Administratorrechte angefordert werden und der Ordner nicht mehr freigegeben sein wird.',
          boton: 'Fortfahren',
        },
        resultado: {
          quitada: (nombre: string) => `„${nombre}“ ist nicht mehr freigegeben.`,
          cancelado: 'Die Windows-Abfrage wurde abgebrochen: Es wurde nichts geändert.',
          tiempo:
            'Die Zeit zum Bestätigen der Windows-Abfrage ist abgelaufen: Es wurde nichts geändert.',
        },
      },
      equipos: {
        titulo: 'Geräte im lokalen Netzwerk',
        ayuda:
          'Das Lesen nutzt die ARP-Tabelle dieses Computers (die Geräte, mit denen er bereits kommuniziert hat): Es geschieht sofort und sendet nichts ins Netzwerk.',
        leer: 'Netzwerk lesen',
        redActiva: 'Aktives Netzwerk',
        perfil: {
          privado: 'privates Netzwerk',
          publico: 'öffentliches Netzwerk',
          dominio: 'Domänennetzwerk',
          desconocido: 'unbekanntes Profil',
        },
        publica:
          'In öffentlichen Netzwerken werden keine anderen Geräte erkundet. So stellen Sie das Netzwerk in Windows auf „Privat“ um: Einstellungen › Netzwerk und Internet › Eigenschaften › Netzwerkprofil.',
        tunel:
          'Das aktive Netzwerk ist ein VPN oder ein Tunnel; daher werden keine anderen Geräte erkundet.',
        ipEsteEquipo: 'IP-Adresse dieses Geräts',
        perfilDesconocido:
          'Es konnte nicht geprüft werden, ob das Netzwerk privat oder öffentlich ist; daher werden keine anderen Geräte erkundet.',
        sinRed: 'Es gibt kein aktives privates Netzwerk zum Erkunden.',
        escanear: 'Geräte suchen',
        progreso: (hechos: number, total: number) => `${hechos} von ${total} Adressen geprüft …`,
        escaneoListo: (cantidad: number, red: string) =>
          `Suche in ${red} beendet: ${cantidad} Geräte in der Liste.`,
        escaneoCancelado: (hechos: number, total: number) =>
          `Suche abgebrochen, nachdem ${hechos} von ${total} Adressen geprüft wurden.`,
        vacioTitulo: 'Keine Geräte anzuzeigen',
        vacioTexto:
          'Klicken Sie auf „Netzwerk lesen“, um die Geräte zu sehen, die dieser Computer bereits kennt, ohne etwas ins Netzwerk zu senden. Falls Sie das schon getan haben, versuchen Sie „Geräte suchen“.',
        col: {
          ip: 'IP-Adresse',
          nombre: 'Name',
          mac: 'MAC',
          fabricante: 'Hersteller',
          ping: 'Letzter Ping',
        },
        ping: 'Ping senden',
        verCarpetas: 'Ordner anzeigen',
        confirmar: {
          titulo: 'Geräte in Ihrem Netzwerk suchen',
          texto: (red: string, cantidad: number) =>
            `An jede der ${cantidad} Adressen von ${red} wird nacheinander und mit begrenzter Geschwindigkeit ein Ping gesendet, um Geräte zu finden.`,
          adaptador: (nombre: string) => `Netzwerkadapter: ${nombre}.`,
          limites:
            'Es wird nur Ihr aktives privates Netzwerk erkundet (höchstens 254 Adressen). Es werden keine Ports getestet und auf kein Gerät zugegriffen. Sie können jederzeit abbrechen.',
          boton: 'Geräte suchen',
        },
      },
      ping: {
        resultado: (recibidos: number, enviados: number, media: number) =>
          `${recibidos} von ${enviados} Antworten · Durchschnitt ${media} ms`,
        sinRespuesta: (enviados: number) => `0 von ${enviados} · keine Antwort`,
      },
      recursos: {
        titulo: (ip: string) => `Freigegebene Ordner von ${ip}`,
        vacio: 'Dieses Gerät gibt keine sichtbaren Ordner frei.',
        ayuda:
          'Sie werden im Datei-Explorer geöffnet. Fragt das Gerät nach Benutzername und Kennwort, fragt Windows danach, nicht diese Anwendung.',
        abrir: 'Öffnen',
        fallo: {
          denegado: 'Das Gerät zeigt seine Ordner nicht ohne Anmeldedaten an.',
          inaccesible: 'Es konnte keine Verbindung zum Gerät hergestellt werden.',
          error: 'Die Ordner dieses Geräts konnten nicht abgefragt werden.',
        },
      },
      velocidad: {
        titulo: 'Geschwindigkeitstest',
        ayuda: (mb: number) =>
          `Misst Latenz sowie Download- und Upload-Geschwindigkeit Ihrer Internetverbindung. Es werden etwa ${mb} MB Daten verbraucht.`,
        medir: 'Geschwindigkeit messen',
        fases: {
          latencia: 'Latenz wird gemessen …',
          bajada: 'Download wird gemessen …',
          subida: 'Upload wird gemessen …',
        },
        latencia: 'Latenz',
        bajada: 'Download',
        subida: 'Upload',
        cancelada: 'Messung abgebrochen: Es wird angezeigt, was bis dahin gemessen wurde.',
        incompleta: 'Eine der Messungen hat ihr Zeitlimit erreicht: Dieser Wert ist ungefähr.',
        confirmar: {
          titulo: 'Geschwindigkeit messen',
          texto: (bajada: number, subida: number, total: number) =>
            `Es werden etwa ${bajada} MB heruntergeladen und etwa ${subida} MB zu Cloudflare (speed.cloudflare.com) hochgeladen: insgesamt etwa ${total} MB Daten. Hat Ihre Verbindung ein Datenlimit, beachten Sie diesen Verbrauch.`,
          privacidad:
            'Es werden keine Daten von Ihnen gesendet: Hochgeladen werden Nullen. Sie können jederzeit abbrechen.',
          boton: 'Messen',
        },
      },
    },
    usoDisco: {
      explicacion:
        'Zeigt, was auf einem Laufwerk oder in einem Ordner Platz belegt. Es liest nur Namen und Größen (nie Inhalte), folgt keinen Verknüpfungen oder Junctions und läuft in einem eigenen Prozess. Es löscht, verschiebt oder ändert nichts.',
      unidades: 'Laufwerke',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${libre} frei von ${total}`,
      sinUnidades:
        'Die Laufwerksliste konnte nicht gelesen werden. Sie können einen Ordner wählen.',
      elegirCarpeta: 'Ordner wählen…',
      analizando: 'Wird analysiert…',
      leyendo: 'Wird gelesen',
      progreso: (archivos, carpetas, bytes) =>
        `${archivos} Dateien · ${carpetas} Ordner · ${bytes}`,
      cancelar: 'Abbrechen',
      cancelado: 'Analyse abgebrochen.',
      resumen: (total, archivos, carpetas) =>
        `${total} in ${archivos} Dateien und ${carpetas} Ordnern`,
      duracion: (segundos) => `Dauer: ${segundos} s.`,
      vistas: {
        arbol: 'Baum',
        carpetas: 'Ordner',
        archivos: 'Dateien',
        extensiones: 'Erweiterungen',
      },
      arbolAyuda:
        'Nach Größe sortiert. Es werden nur Ordner und Dateien angezeigt, die mindestens 0,5 % der Gesamtgröße ausmachen; der Rest wird unter „Andere“ zusammengefasst.',
      carpetasAyuda:
        'Die 50 Ordner mit dem meisten Eigengewicht: was die Dateien wiegen, die sie direkt enthalten, ohne ihre Unterordner.',
      archivosAyuda: 'Die 50 größten Dateien.',
      extensionesAyuda:
        'Die 20 Erweiterungen, die am meisten Platz belegen; der Rest kommt unter „Andere Erweiterungen“.',
      col: {
        nombre: 'Name',
        tamano: 'Größe',
        porcentaje: 'Vom Ganzen',
        archivos: 'Dateien',
        ruta: 'Pfad',
        extension: 'Erweiterung',
      },
      otros: (n) => `Andere (${n} kleine Dateien)`,
      sinExtension: '(keine Erweiterung)',
      otrasExtensiones: 'Andere Erweiterungen',
      expandir: (nombre) => `${nombre} aufklappen`,
      contraer: (nombre) => `${nombre} zuklappen`,
      abrir: 'Im Explorer öffnen',
      copiar: 'Pfad kopieren',
      denegada: 'Konnte nicht gelesen werden',
      avisos: {
        enlaces: (n) =>
          `${n} ${n === 1 ? 'Link oder Junction wurde' : 'Links oder Junctions wurden'} nicht verfolgt und ${n === 1 ? 'zählt' : 'zählen'} als 0.`,
        denegados: (n) =>
          `${n} ${n === 1 ? 'Element konnte' : 'Elemente konnten'} nicht gelesen werden (keine Berechtigung oder während der Analyse geändert). Ohne Administratorrechte lassen sich einige Systemordner nicht lesen: Dieses Werkzeug fordert sie nicht an.`,
        enlacesDuros: (n) =>
          `${n} ${n === 1 ? 'zusätzlicher Name' : 'zusätzliche Namen'} von Dateien mit Hardlinks ${n === 1 ? 'wurde' : 'wurden'} nicht doppelt gezählt.`,
        enlacesDurosIncompleto:
          'Es gab so viele Hardlinks, dass die Registrierung voll war: Die Gesamtsumme kann manche Datei doppelt zählen.',
        truncado: 'Die maximale Tiefe wurde erreicht: Einige Ordner wurden nicht mitgezählt.',
        tamanoLogico:
          'Die Größen sind logisch (was jede Datei meldet), nicht der belegte Speicherplatz: Bei nur online verfügbaren OneDrive-Dateien, komprimierten Dateien und Sparse-Dateien kann er abweichen.',
        verEnlaces: 'Nicht verfolgte Links anzeigen',
      },
      limpieza: {
        titulo: 'Speicher freigeben',
        texto:
          'Dieses Werkzeug misst nur. Um temporäre Dateien und neu erzeugbare Caches oder ungenutzte Dienstversionen zu löschen, verwenden Sie das bereits Vorhandene:',
        temporales: 'Datenträgerbereinigung',
        versiones: 'Ungenutzte Versionen (Dienste)',
      },
      vacio: {
        titulo: 'Noch keine Analyse',
        texto:
          'Wählen Sie ein Laufwerk oder einen Ordner, um zu sehen, was Platz belegt. Es wird nichts geändert.',
      },
      sinContenido: {
        titulo: 'Nichts zu zählen',
        texto: 'Dieser Ordner enthält keine lesbaren Dateien.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Vergleicht zwei Ordner, ohne etwas darin zu ändern: was nur in einem, nur im anderen und was unterschiedlich ist. Es folgt keinen Verknüpfungen und läuft in einem eigenen Prozess.',
      carpetaA: 'Ordner A',
      carpetaB: 'Ordner B',
      elegir: 'Ordner wählen',
      sinElegir: 'Nicht gewählt',
      comparar: 'Vergleichen',
      comparando: 'Wird verglichen…',
      cancelar: 'Abbrechen',
      cancelada: 'Vergleich abgebrochen.',
      iguales: 'Die beiden Ordner sind identisch.',
      grupoSoloA: 'Nur in A',
      grupoSoloB: 'Nur in B',
      grupoDistintos: 'Unterschiedlich',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'Keine',
      resumen: (a, b, iguales) => `A: ${a} Dateien · B: ${b} Dateien · ${iguales} identisch`,
      truncado:
        'Eine Grenze wurde erreicht (Dateien, Tiefe oder Größe): Die Liste ist nicht vollständig.',
      recortado: (mostrados, total) =>
        `Es gibt mehr Dateien als angezeigt (${mostrados} von ${total}).`,
      sinComparar: (n) =>
        `${n} große Dateien mit gleicher Größe wurden nicht inhaltlich verglichen.`,
      omitidos: (n) => `${n} Verknüpfungen, Junctions oder Sonderelemente wurden übersprungen.`,
      motivoTamano: 'andere Größe',
      motivoContenido: 'gleiche Größe, anderer Inhalt',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo:
        'Wählen Sie in der Liste eine Datei „Unterschiedlich“, um ihren Unterschied zu sehen.',
      soloEnUno: (lado) => `Diese Datei existiert nur in ${lado}.`,
      cargando: 'Dateien werden gelesen…',
      binario: 'Die Dateien sind unterschiedlich, aber kein Text: Der Diff wird nicht angezeigt.',
      sensible:
        'Sensible Datei (.env, Schlüssel oder echte Daten): Sie ist unterschiedlich, aber ihr Inhalt wird nicht angezeigt. Sie können sie im Editor öffnen, der eine verstärkte Bestätigung verlangt.',
      tope: (kb) =>
        `Die Dateien sind unterschiedlich, aber größer als ${kb} KB: Der Text-Diff wird nicht angezeigt.`,
      demasiadoDistinto:
        'Die Dateien unterscheiden sich so stark, dass der zeilenweise Diff nicht angezeigt wird.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'gemischte Zeilenenden',
        ninguno: 'keine Zeilenenden',
      },
      saltosDistintos: (a, b) => `Zeilenenden: A verwendet ${a} und B verwendet ${b}.`,
      soloSaltos:
        'Der Text der Zeilen ist gleich: Nur die Zeilenenden (einschließlich des am Dateiende) oder das BOM ändern sich.',
      resumenArchivo: (agregadas, quitadas) =>
        `${agregadas} Zeilen hinzugefügt, ${quitadas} entfernt`,
      truncadoArchivo: 'Es werden nur die ersten Zeilen angezeigt.',
      lineasIguales: (n) => `… ${n} identische Zeilen …`,
      abrirA: 'A im Editor öffnen',
      abrirB: 'B im Editor öffnen',
      atajos: '↑ ↓ zum Bewegen, Enter, um den Unterschied zu sehen, Esc zum Abbrechen.',
      listaAria: (grupo) => `Dateien: ${grupo}`,
      detalleAria: 'Dateiunterschiede',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Bereiche des HTTP-Clients',
        peticion: 'Anfrage',
        coleccion: 'Sammlung',
        historial: 'Verlauf',
        entornos: 'Umgebungen',
      },
      entorno: 'Umgebung',
      sinEntorno: 'Keine Umgebung',
      metodo: 'Methode',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/pfad oder {{base}}/pfad',
      enviar: 'Senden',
      enviarAtajo: 'Senden (Strg+Enter)',
      cancelar: 'Abbrechen',
      nueva: 'Neu',
      guardar: 'In Sammlung speichern',
      nombre: 'Name',
      nombrePlaceholder: 'Name der Anfrage',
      guardada: 'Anfrage gespeichert',
      ayudaVariables:
        'Verwenden Sie {{variable}}, um Werte aus der gewählten Umgebung zu übernehmen.',
      secciones: {
        params: 'Parameter',
        cabeceras: 'Header',
        cuerpo: 'Body',
        auth: 'Authentifizierung',
        opciones: 'Optionen',
      },
      par: {
        clave: 'Name',
        valor: 'Wert',
        agregar: 'Zeile hinzufügen',
        quitar: 'Zeile entfernen',
        activa: 'Zeile aktiv',
        falta: 'Das Geheimnis fehlt: Geben Sie es ein, um senden zu können.',
      },
      cuerpo: {
        tipo: 'Body-Typ',
        ninguno: 'Keiner',
        json: 'JSON',
        form: 'Formular (urlencoded)',
        multipart: 'Multipart (nur Text)',
        raw: 'Rohtext',
        tipoContenido: 'Content-Type',
        texto: 'Inhalt',
        multipartAyuda: 'Nur Textfelder: Es werden keine Dateien vom Datenträger gesendet.',
      },
      auth: {
        tipo: 'Typ',
        ninguna: 'Keine',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API-Schlüssel',
        token: 'Token',
        usuario: 'Benutzer',
        clave: 'Passwort',
        nombre: 'Name des Headers oder Parameters',
        en: 'Senden in',
        cabecera: 'Header',
        query: 'Query-String',
        ayuda:
          'Der Wert wird vom System verschlüsselt gespeichert; Sammlung, Verlauf und Umgebungen behalten nur einen Verweis.',
      },
      secreto: {
        guardado: 'Gespeichert (verschlüsselt). Zum Ersetzen eintippen.',
        mostrar: 'Anzeigen',
        ocultar: 'Verbergen',
        quitar: 'Entfernen',
        valor: 'Gespeicherter Wert',
        porNombre:
          'Er wird verschlüsselt gespeichert, weil der Name nach einem Geheimnis aussieht.',
      },
      opciones: {
        plazo: 'Zeitlimit (Sekunden)',
        plazoAyuda: 'Von 1 bis 120 Sekunden.',
        ignorarCert: 'Zertifikatsfehler für diese Anfrage ignorieren',
        ignorarAviso:
          'Gefährlich: Die Verbindung wird nicht mehr überprüft. Es gilt nur für diese Anfrage und ihren Host. WolfCore-.test-Sites werden bereits mit der eigenen CA überprüft.',
        limites:
          'Antwort bis 10 MB und höchstens 10 Weiterleitungen. Keine gespeicherten Cookies und kein System-Proxy.',
      },
      respuesta: {
        enviando: 'Wird gesendet…',
        estado: 'Status',
        tiempo: 'Zeit',
        tamano: 'Größe',
        cuerpo: 'Body',
        cabeceras: 'Header',
        redirecciones: 'Weiterleitungen',
        vacioTitulo: 'Noch keine Antwort',
        vacioTexto:
          'Geben Sie eine URL ein und klicken Sie auf Senden. Die Anfrage geht von WolfCore Dev aus.',
        binario: (bytes, tipo) => `Binärdaten mit ${bytes} Bytes, Typ ${tipo || 'unbekannt'}.`,
        sinCuerpo: 'Die Antwort hat keinen Body.',
        truncada: 'Die Antwort überschritt 10 MB: Sie wurde abgeschnitten und ist unvollständig.',
        parcial: (mostrados) => `Es werden die ersten ${mostrados} Zeichen angezeigt.`,
        sinRedirecciones: 'Es gab keine Weiterleitungen.',
        salto: (n) => `Sprung ${n}`,
        urlFinal: 'Finale URL',
        certIgnorado: 'Zertifikatsfehler wurden für diese Anfrage ignoriert.',
        caWolf: 'Mit der CA von WolfCore Dev überprüft.',
        copiar: 'Body kopieren',
        copiado: 'Body kopiert',
        formato: 'Formatiertes JSON',
        crudo: 'Originaltext',
      },
      curl: {
        copiar: 'Als curl kopieren',
        incluir: 'Zugangsdaten einbeziehen',
        incluirAyuda:
          'Ohne Haken erscheinen geheime Werte als <secreto>. Mit Haken enthält der Befehl die echten Zugangsdaten.',
        copiado: 'curl-Befehl kopiert',
        importar: 'curl importieren',
        importarTitulo: 'Einen curl-Befehl importieren',
        importarAyuda:
          'Fügen Sie einen curl-Befehl ein. Er wird nur als Text gelesen: Es wird nichts ausgeführt. Zugangsdaten landen im verschlüsselten Speicher.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/pfad -H 'Accept: application/json'",
        importarBoton: 'Importieren',
        importada: 'Anfrage in die Sammlung importiert',
        avisos: {
          opcion_ignorada: (d) => `Option ignoriert: ${d}`,
          archivo_ignorado: (d) => `Dateien vom Datenträger werden nicht gelesen: ${d}`,
          inseguro_ignorado:
            '-k/--insecure wurde ignoriert. Falls Sie es brauchen, aktivieren Sie „Zertifikatsfehler ignorieren“ von Hand.',
          comando_cortado: 'Alles nach einem Shell-Operator (|, ;, &, >) wurde ignoriert.',
          sin_evaluar:
            'Der Text enthielt $(…), Backticks oder Shell-Variablen: Sie werden nicht ausgewertet und bleiben als Text stehen.',
          url_sin_esquema: 'Die URL hatte kein Schema: Es wurde http:// verwendet.',
          varias_urls: (d) => `Ein zusätzliches Argument wurde ignoriert: ${d}`,
          cabecera_invalida: (d) => `Ein ungültiger Header wurde ignoriert: ${d}`,
          secretos_guardados:
            'Die importierten Zugangsdaten wurden verschlüsselt gespeichert; die Sammlung behält nur ihren Verweis.',
        },
      },
      coleccion: {
        vacioTitulo: 'Die Sammlung ist leer',
        vacioTexto:
          'Speichern Sie eine Anfrage oder importieren Sie einen curl-Befehl, um sie griffbereit zu haben.',
        abrir: 'Öffnen',
        borrar: 'Löschen',
        borrada: 'Anfrage gelöscht',
      },
      historial: {
        vacioTitulo: 'Kein Verlauf',
        vacioTexto:
          'Die letzten 100 Anfragen bleiben hier, ohne Zugangsdaten: Sensible Header erscheinen als ***.',
        abrir: 'Öffnen',
        limpiar: 'Verlauf löschen',
        sinRespuesta: 'Keine Antwort',
      },
      entornos: {
        vacioTitulo: 'Keine Umgebungen',
        vacioTexto:
          'Eine Umgebung definiert Variablen wie {{base}} oder {{token}}. Als geheim markierte werden verschlüsselt gespeichert.',
        nuevo: 'Neue Umgebung',
        nombre: 'Name der Umgebung',
        variable: 'Variable',
        valor: 'Wert',
        secreta: 'Geheim',
        agregar: 'Variable hinzufügen',
        quitar: 'Variable entfernen',
        guardar: 'Umgebung speichern',
        guardado: 'Umgebung gespeichert',
        borrar: 'Umgebung löschen',
        borrado: 'Umgebung gelöscht',
        usar: 'Diese Umgebung verwenden',
        activo: 'Aktiv',
        sinNombre: 'Geben Sie einen Namen für die Umgebung ein.',
      },
    },
    imagenes: {
      nombreCaptura: 'bildschirmfoto',
    },
  },
  doctor: {
    revisiones: {
      discos: 'Zustand der Laufwerke',
    },
    evidencias: {
      disco_modelo: '{modelo} (Laufwerk {numero})',
      disco_estado: 'Windows meldet den Zustand {estado}.',
      disco_operacional: 'Betriebsstatus: {estado}.',
      disco_errores: 'Unkorrigierte Fehler: {lectura} beim Lesen und {escritura} beim Schreiben.',
      disco_prediccion: 'Das Laufwerk sagt einen Ausfall voraus (SMART).',
      disco_desgaste: 'Verschleiß von {desgaste} % (Schwelle: {umbral} %).',
      disco_temperatura: 'Temperatur von {temperatura} °C (Grenzwert: {limite} °C).',
      disco_corregidos: 'Die korrigierten Lesefehler sind gestiegen (insgesamt {cantidad}).',
      texto: '{texto}',
      puerto_dueno: 'Port {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Port {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Reservierter Bereich {desde}-{hasta} (enthält {puerto})',
      ca_vencida: 'Die CA ist vor {dias} Tagen abgelaufen',
      ca_por_vencer: 'Die CA läuft in {dias} Tagen ab',
      certificado_vencido: 'Das Zertifikat für {dominio} ist vor {dias} Tagen abgelaufen',
      certificado_por_vencer: 'Das Zertifikat für {dominio} läuft in {dias} Tagen ab',
      firefox_perfiles: 'Firefox-Profile ohne Vertrauen:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (geöffnet)',
      firefox_perfil_fuera: '{perfil} (außerhalb des Firefox-Ordners)',
      hosts_ilegible: '{ruta}: konnte nicht gelesen werden ({motivo})',
      hosts_codificacion: '{ruta}: Kodierung {codificacion}',
      hosts_bloques: '{ruta}: {bloques} Blöcke von WolfCore Dev',
      hosts_sin_cierre: '{ruta}: Ein Block von WolfCore Dev hat keine Abschlussmarkierung',
      hosts_faltan: 'In hosts fehlen: {dominios}',
      hosts_solo_lectura: '{ruta}: Attribut „Schreibgeschützt“',
      path_repetidas: 'Doppelt: {entradas}',
      path_delante:
        '{entrada} steht vor den Werkzeugen von WolfCore Dev und enthält auch {programa}',
      antivirus_sin_leer:
        'Der Virenschutz ist aktiv; seine Ausnahmen konnten nicht gelesen werden (Administrator nötig).',
      antivirus_sin_exclusion:
        'Der Virenschutz ist aktiv und der Datenordner von WolfCore Dev ist nicht ausgenommen.',
      enlazador_ausente: 'Die C++-Werkzeuge der Visual Studio Build Tools wurden nicht gefunden.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) ist nicht installiert.',
      firewall_no_comprobado:
        'Die Firewall-Regeln konnten nicht gelesen werden (eventuell Administrator nötig).',
      firewall_reglas: 'WolfCore Dev: {propias} · Überreste von WolfCore-Tests: {pruebas}',
      firewall_acotadas: 'Auf das lokale Netzwerk beschränkte Regeln:',
      firewall_ajenas: 'Regeln anderer Programme:',
      firewall_quitadas: 'Entfernte Regeln, die wiederhergestellt werden können:',
    },
    ver: 'Anzeigen',
    verPuertos: 'Ports anzeigen',
    dialogo: {
      reglas: 'Betroffene Regeln: Deaktivieren Sie die, die Sie nicht anfassen möchten.',
      sinSeleccion: 'Aktivieren Sie mindestens eine Regel, um fortzufahren.',
      reglasNota:
        'Ohne Ihre Bestätigung und die Administratorberechtigung ändert sich nichts. Hat sich eine Regel nach der Anzeige geändert, wird sie übersprungen.',
    },
    reparaciones: {
      firewall:
        'Diese eingehenden Firewall-Regeln einzeln und anhand ihres exakten Namens entfernen. Zuvor wird eine Kopie im geschützten Registrierungsschlüssel HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos gespeichert, damit sie neu erstellt werden können. Regeln anderer Programme werden nie angetastet.',
      firewall_restaurar:
        'Die von Ihnen gewählten Regeln aus der geschützten Kopie (nicht aus der Datei in etc/) neu erstellen, mit demselben Programm, Profil, Protokoll, denselben Ports und Adressen wie angezeigt. Diese Programme können dann wieder Netzwerkverbindungen annehmen.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev startet Maven direkt mit dem JDK und liest aus Sicherheitsgründen weder .mvn/jvm.config noch die Variable MAVEN_OPTS. Wenn Ihr Projekt sie braucht, führen Sie Maven in einem Terminal aus.',
    avisoRuby:
      'Ruby wird ohne das Devkit (MSYS2) installiert und ohne Ihren PATH oder die Windows-Registrierung anzufassen: Es gibt kein Installationsprogramm. Gems mit nativen Erweiterungen ohne vorkompiliertes Binary benötigen das Devkit. Das ist ein manueller Schritt: Öffnen Sie ein Terminal aus dem Projekt und führen Sie „ridk install“ aus (es installiert MSYS2 auf Ihrem Computer und lädt aus dem Internet herunter).',
    avisoJdk:
      'Maven und Gradle laufen mit einem JDK von WolfCore Dev, und es ist noch keines installiert. Installieren Sie Java (Temurin) aus der Dienstliste.',
    avisoMeilisearch:
      'Jede Meilisearch-Nebenversion hat eigene Daten. Wenn Sie auf eine andere Nebenversion wechseln (zum Beispiel von 1.58 auf 1.59), sind ihre Indizes und der MEILISEARCH_KEY neu: Sie müssen neu indizieren und die .env Ihrer Projekte aktualisieren.',
    servicios: {
      meilisearch: 'Meilisearch',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    anteriores: (n) => `Frühere Patches (${n})`,
  },
  memoria: {
    boton: 'Speicher',
    tituloBoton: 'Speicher optimieren',
    titulo: 'Speicheroptimierer',
    intro:
      'Wählen Sie einen Modus und prüfen Sie die Liste. Nichts wird geschlossen oder gestoppt, bevor Sie bestätigen, und er läuft nie von selbst.',
    modo: 'Modus',
    modos: {
      liviano: 'Leicht',
      moderado: 'Moderat',
      profundo: 'Tief',
    },
    descripciones: {
      liviano:
        'Leert den Cache der App. Das schafft Speicherplatz; es schließt oder stoppt nichts.',
      moderado:
        'Bietet zusätzlich an, nur einen PHP-Worker zu behalten und Dienste von WolfCore Dev ohne Aktivität oder Verbindungen zu stoppen. Dienste sind zunächst nicht angehakt.',
      profundo:
        'Listet zusätzlich Ihre eigenen speicherhungrigen Programme auf, damit Sie sie bitten können, ihr Fenster zu schließen. Sie sind zunächst nicht angehakt.',
    },
    ver: 'Liste anzeigen',
    revisando: 'Wird geprüft…',
    vacio: 'In diesem Modus gibt es nichts freizugeben.',
    tipos: {
      'cache-app': 'Cache leeren',
      'reducir-pool': 'Nur einen Worker behalten',
      'detener-inactivo': 'Stoppen (inaktiv)',
      'cerrar-programa': 'Bitten, das Fenster zu schließen',
    },
    caches: {
      sesion: 'HTTP-Cache der Anwendungssitzung',
    },
    estimado: (cantidad) => `Etwa ${cantidad} RAM würden freigegeben`,
    estimadoDisco: (cantidad) =>
      `Zusätzlich etwa ${cantidad} Speicherplatz (der Cache ist kein RAM)`,
    marcadas: (n, total) => `${n} von ${total} angehakt`,
    sinDatos:
      'Es gibt noch nicht genug Aktivitätsdaten, um das Stoppen von Diensten oder das Reduzieren von PHP anzubieten. Lassen Sie Start einige Minuten geöffnet und schauen Sie erneut.',
    listadoFallido:
      'Die Liste der geöffneten Programme konnte nicht gelesen werden: Diese Liste ist möglicherweise unvollständig. Versuchen Sie es erneut.',
    avisoDetener:
      'Inaktive Dienste sind zunächst nicht angehakt: Wer einen stoppt, trennt alles, was ihn nutzt. Es werden nur die ohne aktuelle Verbindungen aufgelistet.',
    avisoCerrar:
      'Programme werden nur gebeten, ihr Fenster zu schließen, wie beim Klick auf das X: Sie können fragen, ob gespeichert werden soll. Ein Programm wird nie erzwungen oder beendet.',
    protegidos:
      'Systemprogramme, Windows-Dienste, Programme mit erhöhten Rechten, andere Benutzer, FlyEnv, PhpWebStudy und WolfCore Dev (oder alles, was sie starten) erscheinen nie.',
    aplicar: 'Angehakte anwenden',
    confirmarTitulo: 'Diese Aktionen anwenden?',
    confirmarTexto: (n) =>
      n === 1
        ? '1 Aktion aus der Liste wird ausgeführt.'
        : `${n} Aktionen aus der Liste werden ausgeführt.`,
    confirmarCerrar: (nombres) =>
      `Diese Programme werden gebeten, ihr Fenster zu schließen: ${nombres}.`,
    confirmarDetener: (nombres) => `Diese Dienste werden gestoppt: ${nombres}.`,
    confirmar: 'Ja, anwenden',
    cancelar: 'Abbrechen',
    resultadoTitulo: 'Ergebnis',
    liberado: (cantidad) => `Geschätzt: etwa ${cantidad} RAM freigegeben`,
    liberadoDisco: (cantidad) => `Zusätzlich etwa ${cantidad} Speicherplatz`,
    notaPedido:
      'Wartet auf Sie: Das Fenster wurde gebeten, sich zu schließen, und das Programm ist noch geöffnet (möglicherweise fragt es, ob gespeichert werden soll). Es zählt nicht als freigegeben.',
    estados: {
      hecho: 'Erledigt',
      pedido: 'Wartet auf Sie',
      saltado: 'Übersprungen',
      error: 'Fehlgeschlagen',
    },
    motivos: {
      no_en_plan: 'Es stand nicht in der Liste',
      protegido: 'Es ist ein geschütztes Programm',
      cambio: 'Es hat sich seit der Anzeige der Liste geändert',
      sin_ventana: 'Es hat kein Fenster mehr, das geschlossen werden könnte',
      ya_apagado: 'Es gab nichts mehr zu reduzieren',
      ocupado: 'Es war beschäftigt (es hat Verbindungen)',
      no_se_pudo:
        'Die Schließanfrage konnte nicht gesendet werden (das Programm läuft mit erhöhten Rechten)',
    },
    otraVez: 'Neu beginnen',
  },
  guias: {
    tuneles: {
      titulo: 'Tunnel-Leitfaden',
      copiar: 'Befehl kopieren',
    },
    http: {
      buscar: 'Nach Nummer, Name oder Text suchen',
      familia: 'Familie',
      todas: 'Alle',
      verMetodos: 'Methoden',
      verCodigos: 'Statuscodes',
      resultados: (n) => `${n} ${n === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
      vacio: 'Nichts entspricht der Suche.',
      seguro: 'Sicher',
      noSeguro: 'Nicht sicher',
      idempotente: 'Idempotent',
      noIdempotente: 'Nicht idempotent',
      noEstandar: 'Nicht standardisiert',
      broma: 'Scherzcode (RFC 2324)',
      causas: 'Häufige Ursachen',
      solucion: 'So beheben Sie es',
      ejemplo: 'Beispiel',
      copiarEjemplo: 'Beispiel kopieren',
      probar: 'Ausprobieren',
      probarTitulo:
        'Dieses Beispiel im HTTP-Client ausprobieren (nichts wird gesendet, bis Sie auf Senden klicken)',
      servidorActivo: (puerto) =>
        `Beispielserver läuft auf 127.0.0.1:${puerto}, solange Sie den Leitfaden oder den HTTP-Client verwenden. Er ist nur von diesem Computer aus erreichbar und stoppt, wenn Sie gehen oder nach 10 Min. ohne Nutzung.`,
      sinTraduccion: 'In diese Sprache nicht übersetzt: wird auf Englisch angezeigt.',
      familias: {
        '1xx': '1xx Informativ',
        '2xx': '2xx Erfolg',
        '3xx': '3xx Umleitung',
        '4xx': '4xx Clientfehler',
        '5xx': '5xx Serverfehler',
      },
    },
    git: {
      buscar: 'Nach einem Thema oder Befehl suchen',
      verGuia: 'Leitfaden',
      verLaboratorio: 'Labor',
      todos: 'Alle',
      grupos: {
        basico: 'Grundlagen',
        ramas: 'Zweige',
        deshacer: 'Rückgängig machen',
        remotos: 'Remotes und Tags',
        github: 'GitHub',
      },
      resultados: (n) => `${n} ${n === 1 ? 'Thema' : 'Themen'}`,
      vacio: 'Nichts entspricht der Suche.',
      ejemplo: 'Beispiel',
      errores: 'Häufige Fehler',
      copiarEjemplo: 'Beispiel kopieren',
      peligroso: 'Gefährlich',
      sinTraduccion: 'In diese Sprache nicht übersetzt: wird auf Englisch angezeigt.',
      avisoGithub:
        'Dieser Teil ist nur eine Erklärung: WolfCore Dev legt keine Konten an, meldet sich nicht bei GitHub an und verwendet keine Tokens aus diesem Leitfaden. Die Namen und Werte in den Beispielen sind erfunden.',
      irLaboratorio: 'Im Labor üben',
      lab: {
        intro:
          'Ein Übungs-Repository und ein lokales „Remote“ in einem Ordner, der WolfCore Dev gehört. Es nutzt weder das Internet noch GitHub und berührt weder Ihre Projekte noch Ihre Git-Einstellungen.',
        sinGit: {
          titulo: 'Git ist nicht installiert',
          texto:
            'Das Labor verwendet das Git Ihres Systems und lässt sich ohne dieses nicht öffnen. Installieren Sie Git und öffnen Sie diesen Tab erneut; WolfCore Dev installiert nichts für Sie.',
        },
        cargando: 'Labor wird vorbereitet…',
        reiniciar: 'Labor zurücksetzen',
        reiniciarAyuda: 'Löscht nur den Übungsordner und setzt ihn wie neu auf.',
        reiniciado: 'Labor zurückgesetzt.',
        version: (v) => `git ${v}`,
        ordenes: 'Befehle',
        mensaje: 'Commit-Nachricht',
        mensajePorDefecto: 'Übungsänderung',
        rama: 'Zweig',
        etiqueta: 'Tag',
        archivo: 'Datei',
        grupos: {
          basico: 'Grundlagen',
          ramas: 'Zweige',
          guardar: 'Speichern und rückgängig machen',
          remoto: 'Lokales Remote',
        },
        archivos: {
          titulo: 'Übungsdateien',
          ayuda: 'Nur diese Dateien können bearbeitet werden, mit Text von bis zu 2000 Zeichen.',
          guardar: 'Datei speichern',
          guardado: 'Datei gespeichert.',
          areaTexto: (n) => `Inhalt von ${n}`,
        },
        salida: 'Ausgabe',
        salidaVacia: 'Klicken Sie auf einen Befehl, um hier die Antwort von Git zu sehen.',
        codigo: (n) => (n === 0 ? 'Erfolgreich beendet' : `Mit Code ${n} beendet`),
        truncada: 'Die Ausgabe wurde gekürzt.',
        historial: 'Verlauf',
        historialVacio:
          'Es gibt noch keine Commits: Führen Sie git init, git add und git commit aus.',
        conflicto: {
          titulo: 'Geführte Übung: ein Konflikt',
          intro:
            'Zwei Zweige ändern dieselbe Zeile. Sie sehen, wie der Konflikt entsteht und wie man ihn löst.',
          paso: (n, total) => `Schritt ${n} von ${total}`,
          ejecutar: 'Diesen Schritt ausführen',
          hecho: 'Erledigt',
          reempezar: 'Neu beginnen',
          esperado: 'Git hat den Konflikt gemeldet: Das ist bei diesem Schritt zu erwarten.',
          elegir: {
            mia: 'Die von main behalten (grün)',
            otra: 'Die von rama-a behalten (rot)',
            ambas: 'Beide behalten',
          },
          final: 'Geschafft: Sie haben einen Konflikt gelöst. Sehen Sie sich den Verlauf an.',
          pasos: [
            {
              titulo: 'Labor vorbereiten',
              texto:
                'Das Labor wird zurückgesetzt und der erste Commit mit colores.txt („color: azul“) wird erstellt.',
            },
            {
              titulo: 'Zeile auf rama-a ändern',
              texto:
                'Der Zweig rama-a wird erstellt, die Zeile wird zu „color: rojo“ und per Commit gespeichert.',
            },
            {
              titulo: 'Dieselbe Zeile auf main ändern',
              texto:
                'Es geht zurück zu main, die Zeile wird zu „color: verde“ und per Commit gespeichert.',
            },
            {
              titulo: 'Merge versuchen',
              texto:
                'rama-a wird in main gemergt. Git kann nicht entscheiden, welche Zeile bleibt, und hinterlässt einen Konflikt.',
            },
            {
              titulo: 'Eine Version wählen',
              texto:
                'Wählen Sie, welche Version der Zeile bleibt. colores.txt enthält nun die Konfliktmarkierungen.',
            },
            {
              titulo: 'Lösung bestätigen',
              texto:
                'colores.txt wird vorgemerkt (add) und der Commit, der den Merge abschließt, wird erstellt.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `Ein leichter Editor mit Hervorhebung für Textdateien bis ${mb} MB. Wählen Sie die Datei im Systemdialog; das Speichern verlangt immer eine Bestätigung und legt zuvor eine Kopie im Datenordner von WolfCore Dev ab.`,
    abrir: 'Datei öffnen…',
    abriendo: 'Wird geöffnet…',
    guardar: 'Speichern',
    guardando: 'Wird gespeichert…',
    recargar: 'Vom Datenträger neu laden',
    vacio: 'Öffnen Sie eine Datei, um mit dem Bearbeiten zu beginnen.',
    sinCambios: 'Keine Änderungen',
    conCambios: 'Nicht gespeicherte Änderungen',
    posicion: (linea, columna) => `Zeile ${linea}, Spalte ${columna}`,
    areaTexto: (nombre) => `Code-Editor: ${nombre}`,
    salirTeclado: 'Um den Editor mit der Tastatur zu verlassen, drücken Sie Esc und dann Tab.',
    guardado: 'Datei gespeichert.',
    copiaPrevia: (ruta) => `Sicherungskopie: ${ruta}`,
    cancelar: 'Abbrechen',
    enlaceDuro:
      'Diese Datei hat auf dem Datenträger mehr als einen Namen (ein Hardlink). Beim Speichern wird dieser Link getrennt: Die anderen Namen behalten den alten Inhalt.',
    saltosMixtos: {
      aviso: 'Diese Datei mischt Zeilenenden. Beim Speichern werden alle auf LF vereinheitlicht.',
      aceptar: 'Ich stimme der Vereinheitlichung der Zeilenenden zu',
    },
    envGestor: {
      aviso:
        'Die .env-Dateien werden in den Projektvariablen bearbeitet, mit ihrem Ablauf für Geheimnisse. Die Schaltfläche öffnet die .env im Projektstamm, die nicht unbedingt die Datei ist, die Sie öffnen wollten.',
      boton: 'Die .env im Projektstamm öffnen',
    },
    huellaPerdida:
      'Gespeichert, aber der neue Fingerabdruck konnte nicht gelesen werden: Die Datei wurde neu geladen.',
    confirmarGuardar: {
      titulo: 'Änderungen speichern',
      texto: (nombre) =>
        `${nombre} wird gleich geschrieben. Zuvor wird eine Kopie des aktuellen Stands auf dem Datenträger im Datenordner von WolfCore Dev gespeichert.`,
      boton: 'Mit Sicherungskopie speichern',
    },
    refuerzo: {
      abrirTitulo: 'Sensible Datei',
      guardarTitulo: 'Eine sensible Datei speichern',
      secreto:
        'Diese Datei enthält anscheinend Geheimnisse (private Schlüssel, Tokens oder Zugangsdaten). Ihr Inhalt wird auf dem Bildschirm angezeigt.',
      datosReales:
        'Diese Datei gehört zu einer Site, die als Site mit echten Daten markiert ist. Eine falsche Änderung kann echte Informationen betreffen.',
      instruccion: (nombre) => `Geben Sie zum Fortfahren den Dateinamen ein: ${nombre}`,
      etiqueta: 'Dateiname',
      abrirBoton: 'Trotzdem öffnen',
      guardarBoton: 'Trotzdem speichern',
    },
    cambioExterno: {
      titulo: 'Die Datei wurde außerhalb des Editors geändert',
      texto:
        'Ein anderes Programm hat sie seit dem Öffnen geändert, daher wurde nichts gespeichert. Sie können sie neu laden (Ihre Änderungen gehen verloren) oder mit dem überschreiben, was Sie hier haben.',
      recargar: 'Neu laden und meine Änderungen verwerfen',
      sobrescribir: 'Überschreiben…',
      sobrescribirTitulo: 'Datei überschreiben',
      sobrescribirTexto:
        'Die Änderungen des anderen Programms gehen verloren. Sein aktueller Inhalt bleibt in der Sicherungskopie.',
      sobrescribirBoton: 'Ja, überschreiben',
      volver: 'Zurück',
    },
    descartar: {
      titulo: 'Nicht gespeicherte Änderungen',
      texto:
        'Im Editor gibt es nicht gespeicherte Änderungen. Wenn Sie fortfahren, gehen sie verloren.',
      confirmar: 'Änderungen verwerfen',
      seguir: 'Weiter bearbeiten',
    },
    cm: {
      'Control character': 'Steuerzeichen',
      'Selection deleted': 'Auswahl gelöscht',
      'Go to line': 'Gehe zu Zeile',
      go: 'los',
      Find: 'Suchen',
      Replace: 'Ersetzen',
      next: 'weiter',
      previous: 'zurück',
      all: 'alle',
      'match case': 'Groß-/Kleinschreibung',
      regexp: 'RegExp',
      'by word': 'ganzes Wort',
      replace: 'ersetzen',
      'replace all': 'alle ersetzen',
      close: 'schließen',
      'current match': 'aktueller Treffer',
      'on line': 'in Zeile',
      'replaced match on line $': 'Treffer in Zeile $ ersetzt',
      'replaced $ matches': '$ Treffer ersetzt',
      'folded code': 'eingeklappter Code',
      unfold: 'ausklappen',
      to: 'bis',
    },
  },
  limpiezaDisco: {
    intro:
      'Zuerst wird analysiert und angezeigt, wie viel jeder Eintrag belegt. Nichts wird gelöscht, bevor Sie bestätigen, und es läuft nie von selbst oder im Hintergrund.',
    analizar: 'Analysieren',
    analizando: 'Wird analysiert…',
    cancelarAnalisis: 'Abbrechen',
    vacio: 'Es gibt nichts zu bereinigen.',
    categorias: {
      temp: {
        nombre: 'Temporäre Dateien',
        ayuda:
          'Dateien in Ihrem TEMP-Ordner, die älter als 24 Stunden sind. Endgültig gelöscht; sie entstehen von selbst neu.',
      },
      'cache-chrome': {
        nombre: 'Google-Chrome-Cache',
        ayuda: 'Nur die Cache-Ordner jedes Profils; nie Cookies, Passwörter oder Verlauf.',
      },
      'cache-edge': {
        nombre: 'Microsoft-Edge-Cache',
        ayuda: 'Nur die Cache-Ordner jedes Profils; nie Cookies, Passwörter oder Verlauf.',
      },
      'cache-brave': {
        nombre: 'Brave-Cache',
        ayuda: 'Nur die Cache-Ordner jedes Profils; nie Cookies, Passwörter oder Verlauf.',
      },
      'cache-firefox': {
        nombre: 'Firefox-Cache',
        ayuda: 'Nur der Ordner cache2 jedes Profils; nie Cookies, Passwörter oder Verlauf.',
      },
      'wolfcore-descargas': {
        nombre: 'Zwischengespeicherte Downloads von WolfCore Dev',
        ayuda:
          'Lose Archive, die nicht mehr verwendet werden. Werden in den Papierkorb verschoben.',
      },
      'wolfcore-registros': {
        nombre: 'Protokolle von WolfCore Dev',
        ayuda: 'Protokolle, die älter als 30 Tage sind. Werden in den Papierkorb verschoben.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda: 'Optional. Windows erzeugt es neu, aber WolfCore Dev muss als Administrator laufen.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Browser geöffnet oder im Hintergrund aktiv: Schließen Sie ihn vollständig, um seinen Cache zu bereinigen (in Edge auch den Startbeschleuniger und Hintergrunderweiterungen ausschalten)',
      'requiere-admin': 'Erfordert, dass WolfCore Dev als Administrator läuft',
      'ruta-vetada': 'Geschützter Pfad: nicht bereinigt',
      'temp-no-seguro':
        'Die Variable TEMP verweist auf einen Ordner, der nicht der temporäre Ordner des Benutzers ist (Dokumente, ein ganzes Laufwerk, ein Netzwerkpfad…): nicht bereinigt',
    },
    borradoDefinitivo: 'Endgültig gelöscht (sie entstehen von selbst neu)',
    borradoPapelera: 'In den Systempapierkorb verschoben',
    archivos: (n) => (n === 1 ? '1 Datei' : `${n} Dateien`),
    carpetas: 'Nach Ordner',
    truncado: 'Die Analyse wurde an der Dateigrenze beendet: Es gibt mehr als angezeigt.',
    marcadas: (n, t) => `${n} von ${t} Kategorien ausgewählt`,
    total: (b) => `Etwa ${b} würden freigegeben`,
    limpiar: 'Auswahl bereinigen',
    confirmarTitulo: 'Diese Kategorien bereinigen?',
    confirmarTexto: (n) => `${n} Kategorien werden bereinigt.`,
    confirmarDefinitivo:
      'TEMP und Caches werden endgültig gelöscht (sie entstehen von selbst neu).',
    confirmarPapelera: 'Protokolle und Downloads von WolfCore Dev kommen in den Papierkorb.',
    confirmarPrefetch:
      'Prefetch: Windows erzeugt es neu, aber die ersten Programmstarts können etwas langsamer sein.',
    confirmar: 'Ja, bereinigen',
    cancelar: 'Abbrechen',
    detener: 'Bereinigung stoppen',
    resultadoTitulo: 'Ergebnis',
    liberado: (b) => `Freigegeben: ${b}`,
    enPapelera: (b) =>
      `Davon liegen ${b} im Papierkorb (der Platz wird frei, wenn Sie ihn leeren).`,
    saltados: (n) => `${n} Dateien wurden übersprungen`,
    cancelado: 'Bereinigung abgebrochen: Bereits Gelöschtes bleibt gelöscht.',
    topeEjecucion:
      'Die Dateigrenze pro Durchlauf wurde erreicht: Analysieren und bereinigen Sie erneut, um fortzufahren.',
    registroFallido:
      'Das Bereinigungsprotokoll konnte nicht mehr geschrieben werden, daher wurde die Bereinigung beendet: Was gelöscht wurde, ist bis dahin protokolliert.',
    motivos: {
      'en-uso': 'In Verwendung',
      enlace: 'Verknüpfung oder Reparsepunkt (nicht verfolgt)',
      protegido: 'Geschützt (.env, FlyEnv oder Ähnliches)',
      cambio: 'Seit der Analyse geändert',
      'sin-papelera': 'Kein Papierkorb verfügbar',
      ilegible: 'Konnte nicht gelesen werden',
      error: 'Fehler beim Löschen',
    },
    verRegistros: 'Protokolle anzeigen',
    registroEn: (r) => `Protokoll dieser Bereinigung: ${r}`,
    otraVez: 'Neu beginnen',
    protegidas:
      'Nie angetastet: Daten, Sicherungen, Projekte, Datenbanken oder .env-Dateien. Verknüpfungen werden nicht verfolgt, und nichts außerhalb der Pfade dieser Liste wird berührt.',
  },
  preferencias: {
    asistente: 'Willkommensrundgang',
    asistenteAyuda:
      'Sehen Sie sich den Rundgang durch die wichtigsten Bildschirme erneut an: Dienste, Projekte, Datenbanken, Werkzeuge und Doctor.',
    asistenteAbrir: 'Rundgang ansehen',
    avanzadas: 'Erweiterte Bereiche anzeigen',
    avanzadasAyuda:
      'Fügt der Seitenleiste die selten genutzten Bildschirme hinzu, etwa Container. Sie sind auch mit Strg+K erreichbar.',
    animacionInicio: 'Startanimation',
    animacionInicioAyuda:
      'Zeichnet beim Öffnen der Anwendung das Logo mit einem leuchtenden Strich. Mit einem Klick oder Esc wird sie übersprungen. Wenn Windows weniger Bewegung verlangt, erscheint nur eine kurze Überblendung.',
  },
  paleta: {
    irAServicio: (nombre) => `Zum Dienst ${nombre}`,
    irAProyecto: (nombre) => `Zum Projekt ${nombre}`,
    versionesDe: (nombre) => `Versionen von ${nombre}`,
    asistente: 'Willkommensrundgang ansehen',
  },
  env: {
    bloques: {
      meilisearch: 'Meilisearch (mit seinem Schlüssel)',
    },
  },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Noch keine Datenbank-Engine',
      texto:
        'Installieren Sie MySQL, MariaDB, PostgreSQL oder MongoDB unter Dienste, um die Datenbanken Ihrer Projekte zu erstellen und zu verwalten.',
      accion: 'Zu Dienste',
    },
    serviciosVacio: {
      titulo: 'Noch keine Dienste installiert',
      texto:
        'Dienste (Nginx, PHP, Datenbanken…) lassen Ihre Sites laufen. Beginnen Sie mit Nginx und PHP oder mit einer Datenbank.',
      accion: 'Dienst installieren',
    },
    registrosSinFuentes: {
      titulo: 'Noch keine Protokolle',
      texto:
        'Protokolle erscheinen, sobald ein Dienst, eine Site oder ein Prozess seine erste Zeile schreibt. Starten Sie einen Dienst und kommen Sie zurück.',
      accion: 'Zu Dienste',
    },
    registrosElegir: {
      titulo: 'Protokoll wählen',
      texto: 'Wählen Sie oben in der Auswahl eine Quelle, um ihre Zeilen live zu verfolgen.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Noch keine Dumps eingetroffen',
      texto:
        'Wenn eine Site dump(), dd() oder wd() ausführt, erscheint der Dump sofort hier. Öffnen Sie Ihre Site und führen Sie diesen Code aus.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Erfassung ist aus',
      texto:
        'Bei eingeschalteter Erfassung kommen die dump()- und dd()-Aufrufe Ihrer Sites hier an, ohne den Browser anzufassen. Schalten Sie sie ein und starten Sie eine Site.',
      accion: 'Erfassung einschalten',
    },
    depuracionElegir: {
      titulo: 'Dump wählen',
      texto: 'Wählen Sie einen Dump aus der Liste, um Inhalt, Datei und Quell-URL zu sehen.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Keine Fehler in den Protokollen',
      texto:
        'Fehler von PHP, Nginx und Projekten erscheinen hier gruppiert, sobald sie geschrieben werden. Eine leere Liste ist eine gute Nachricht.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Fehler wählen',
      texto:
        'Wählen Sie einen Fehler aus der Liste, um seinen Trace zu sehen und die Datei im Editor zu öffnen.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Noch keine Prüfung durchgeführt',
      texto:
        'Doctor prüft Ports, hosts, Zertifikate und Versionen und sagt Ihnen, wie Sie beheben, was fehlschlägt. Führen Sie die erste Prüfung durch.',
      accion: 'Jetzt prüfen',
    },
    doctorSinHallazgos: {
      titulo: 'Alles in Ordnung',
      texto:
        'Die letzte Prüfung hat keine Probleme gefunden. Prüfen Sie erneut, falls etwas nicht mehr reagiert.',
      accion: 'Erneut prüfen',
    },
    contenedoresVacio: {
      titulo: 'Keine Container',
      texto:
        'Die Docker- oder Podman-Container dieses Computers erscheinen hier. Erstellen Sie einen mit docker run oder docker compose und klicken Sie auf Aktualisieren.',
      accion: 'Aktualisieren',
    },
    avisos: {
      titulo: 'Keine Hinweise',
      texto: 'Dienstausfälle, belegte Ports und ablaufende Zertifikate erscheinen hier.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Noch keine Schnappschüsse',
      texto:
        'Ein Schnappschuss sichert den Zustand dieser Datenbank, damit Sie zurückkehren können, falls etwas schiefgeht. Erstellen Sie den ersten mit der Schaltfläche oben.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Dieser Server hat keine eigenen Datenbanken',
      texto:
        'Erstellen Sie eine Datenbank für Ihr Projekt oder importieren Sie einen vorhandenen Dump.',
      accion: 'Datenbank erstellen',
    },
    iaNube: {
      titulo: 'Noch keine KI-Anbieter',
      texto:
        'Ein Anbieter (OpenAI, Anthropic, OpenRouter und andere) lässt Ihre Agenten Cloud-Modelle nutzen. Der Schlüssel wird verschlüsselt auf diesem Computer gespeichert.',
      accion: 'Anbieter hinzufügen',
    },
    iaSinModelos: {
      titulo: 'Noch keine lokalen Modelle',
      texto: 'Laden Sie ein Modell aus der Liste unten herunter, um es offline zu nutzen.',
      accion: '',
    },
    versiones: {
      titulo: 'Keine Versionen zum Anzeigen',
      texto:
        'Die Liste wird aus dem offiziellen Katalog heruntergeladen. Prüfen Sie Ihre Verbindung und aktualisieren Sie die Liste.',
      accion: 'Liste aktualisieren',
    },
    buscar: {
      titulo: 'Keine Treffer',
      texto:
        'Nichts im Ordner entspricht Ihrer Suche. Versuchen Sie andere Wörter, deaktivieren Sie „Groß-/Kleinschreibung beachten“ oder prüfen Sie die Dateifilter.',
      accion: '',
    },
  },
  asistenteInicio: {
    animacionNota:
      'Falls Sie die Logo-Animation beim Öffnen nicht möchten, schalten Sie sie unter Einstellungen › Darstellung aus.',
    titulo: 'Willkommensrundgang',
    saltar: 'Später',
    terminar: 'Los geht’s',
    cerrar: 'Rundgang schließen',
    reabrir:
      'Drücken Sie Esc zum Verlassen. Sie können ihn unter Einstellungen › Darstellung erneut ansehen.',
    ir: (destino) => `Zu ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Willkommen bei WolfCore Dev',
        texto:
          'Ihre lokale Entwicklungsumgebung in einem einzigen Fenster: Dienste, .test-Sites mit HTTPS, Datenbanken, E-Mail und Werkzeuge. Dieser Rundgang dauert eine Minute und ändert nichts auf Ihrem Computer.',
      },
      servicios: {
        titulo: 'Dienste',
        texto:
          'Schalten Sie hier Nginx, PHP und die Datenbanken mit einem Schalter ein. Sind sie noch nicht installiert, lädt der Tab Versionen sie mit geprüfter Prüfsumme herunter.',
      },
      proyectos: {
        titulo: 'Projekte',
        texto:
          'Erstellen Sie ein neues Projekt oder importieren Sie einen Ordner oder ein Repository. Jede Site erhält ihre eigene .test-Adresse mit HTTPS.',
      },
      bases: {
        titulo: 'Datenbanken',
        texto:
          'Erstellen Sie Datenbanken, importieren und exportieren Sie Dumps und sichern und stellen Sie wieder her, ohne die App zu verlassen.',
      },
      herramientas: {
        titulo: 'Werkzeuge und Strg+K',
        texto:
          'Editor, Suche, Vergleich, Passwörter, Bilder und mehr, nach Bereichen gruppiert. Drücken Sie auf jedem Bildschirm Strg+K, um direkt zu dem zu springen, was Sie brauchen.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Er prüft Ports, hosts, Zertifikate und Versionen und schlägt vor, wie Sie beheben, was fehlschlägt. Öffnen Sie ihn, wenn etwas nicht reagiert.',
      },
      listo: {
        titulo: 'Alles bereit',
        texto:
          'Beginnen Sie damit, einen Dienst einzuschalten oder Ihr erstes Projekt zu erstellen. Sie können diesen Rundgang unter Einstellungen › Darstellung erneut ansehen.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v) => `Sie ist nicht mehr im Katalog: Stattdessen wird ${v} installiert.`,
      },
      resultado: {
        sustituida: (v) => `Anstelle der Version des Profils wurde ${v} installiert.`,
      },
    },
    motivos: {
      version_sustituida:
        'Diese Version ist nicht mehr im Katalog: Es wurde die neueste derselben Nebenversion (zum Beispiel 8.3) installiert.',
    },
  },
  consultasLentas: {
    boton: 'Langsame Abfragen',
    titulo: (motor) => `Langsame Abfragen auf ${motor}`,
    descripcion:
      'Die Abfragen, die länger als die von Ihnen gewählte Zeit dauern, von der langsamsten zur schnellsten.',
    cargando: 'Langsame Abfragen werden geladen…',
    estadoTitulo: 'Protokollstatus',
    estadoActivo: (s) =>
      `Die Protokollierung ist aktiv: Abfragen über ${s} s werden aufgezeichnet.`,
    estadoApagado: 'Die Protokollierung ist aus.',
    noGestionada:
      'WolfCore Dev verwaltet diesen Server nicht (zum Beispiel einen von einem anderen Programm gestarteten): Sie können ihn hier nur ansehen, nicht ändern.',
    umbral: 'Abfragen aufzeichnen über (Sekunden)',
    activar: 'Protokollierung einschalten',
    aplicarUmbral: 'Zeit ändern',
    desactivar: 'Protokollierung ausschalten',
    actualizar: 'Protokoll neu lesen',
    confirmarTitulo: 'Protokollierung langsamer Abfragen ändern',
    confirmarActivar: (motor, s) =>
      `Die Protokollierung wird für den gesamten ${motor}-Server eingeschaltet (Abfragen über ${s} s) und in seiner Konfiguration gespeichert. Sie betrifft alle seine Datenbanken.`,
    confirmarDesactivar: (motor) =>
      `Die Protokollierung wird für den gesamten ${motor}-Server ausgeschaltet und in seiner Konfiguration gespeichert. Bereits Aufgezeichnetes bleibt erhalten.`,
    confirmarBoton: 'Änderung bestätigen',
    cancelar: 'Abbrechen',
    activado: 'Protokollierung langsamer Abfragen eingeschaltet',
    desactivado: 'Protokollierung langsamer Abfragen ausgeschaltet',
    privacidad:
      'Das SQL wird mit durch „?“ ersetzten Werten angezeigt, weil es echte Kundendaten enthalten kann. Nichts davon verlässt diesen Computer oder wird in die Anwendungsprotokolle geschrieben.',
    columnas: {
      duracion: 'Dauer',
      filas: 'Geprüfte Zeilen',
      base: 'Datenbank',
      fecha: 'Datum',
      sql: 'Abfrage',
      acciones: 'Aktionen',
    },
    sinBase: 'Nicht zugeordnet',
    verLiteral: 'Literal anzeigen',
    ocultarLiteral: 'Literal verbergen',
    literalAviso: 'SQL unverändert, mit seinen Werten',
    sqlOculto: 'SQL verborgen',
    sqlOcultoAyuda:
      'Diese Abfrage kann nicht angezeigt werden, ohne echte Daten zu gefährden: Dieser Server hat Datenbanken mit echten Daten oder die Abfrage lässt sich nicht sicher einer Datenbank zuordnen.',
    copiar: 'Kopieren',
    copiado: 'Abfrage kopiert',
    truncado: (n) =>
      `Es werden höchstens die ${n} langsamsten Abfragen vom Ende des Protokolls (die letzten 5 MB) angezeigt.`,
    vacioTitulo: 'Noch keine langsamen Abfragen aufgezeichnet',
    vacioTextoApagado:
      'Schalten Sie die Protokollierung ein und nutzen Sie Ihre Sites: Abfragen, die länger als die gewählte Zeit dauern, erscheinen hier.',
    vacioTextoActivo:
      'Bisher hat keine Abfrage die gewählte Zeit überschritten. Nutzen Sie Ihre Sites und lesen Sie das Protokoll erneut.',
  },
  esquemaBd: {
    boton: 'Schema anzeigen',
    titulo: (base) => `Schema von ${base}`,
    descripcion:
      'Nur lesend: Tabellen, Spalten, Schlüssel und Beziehungen. Es werden keine Daten Ihrer Tabellen gelesen.',
    cargando: 'Schema wird gelesen…',
    error: 'Das Datenbankschema konnte nicht gelesen werden.',
    reintentar: 'Erneut versuchen',
    buscar: 'Nach einer Tabelle suchen',
    tablas: (n) => plural(n, 'Tabelle', 'Tabellen'),
    vista: 'Ansicht',
    truncado: (n) => `Die Liste wurde auf ${n} Tabellen gekürzt: Die Datenbank hat mehr.`,
    sinResultados: 'Keine Tabelle entspricht der Suche.',
    elegir:
      'Wählen Sie eine Tabelle aus der Liste, um ihre Spalten, Schlüssel und Beziehungen zu sehen.',
    columnas: 'Spalten',
    indices: 'Indizes',
    sinIndices: 'Diese Tabelle hat keine Indizes.',
    relaciones: 'Beziehungen',
    sinRelaciones: 'Diese Tabelle hat keine Beziehungen zu anderen.',
    salientes: 'Verweist auf',
    entrantes: 'Referenziert von',
    alBorrar: 'Beim Löschen:',
    alActualizar: 'Beim Aktualisieren:',
    irA: (tabla) => `Zur Tabelle ${tabla}`,
    col: {
      nombre: 'Spalte',
      tipo: 'Typ',
      nulo: 'Nullbar',
      defecto: 'Standard',
      clave: 'Schlüssel',
    },
    si: 'Ja',
    no: 'Nein',
    pk: 'PK',
    unico: 'eindeutig',
    vacioTitulo: 'Diese Datenbank hat keine Tabellen',
    vacioTexto:
      'Wenn Sie Tabellen erstellen (zum Beispiel mit den Migrationen Ihres Projekts), erscheinen sie hier.',
  },
  asistentes: {
    pestana: 'Assistenten verbinden',
    explicacion:
      'Wenn Sie einen Assistenten verbinden, kann Ihr KI-Assistent (Claude, Codex …) Ihre WolfCore-Dev-Dienste einsehen und steuern: Status ansehen, Dienste starten und Protokolle lesen. Bei allem Heiklen wird immer Ihre Bestätigung verlangt.',
    alcance:
      'WolfCore Dev fügt in der Konfiguration jedes Programms nur seinen eigenen Eintrag „wolfcore“ hinzu oder entfernt ihn, speichert vorher eine Kopie mit Datum und schreibt Ihr Token nie in diese Dateien.',
    notaVariable:
      'Die Assistenten lesen das Token aus der Umgebungsvariable WOLFCORE_MCP_TOKEN, die WolfCore Dev nur setzt, wenn Sie sie über KI › Agenten › „In einem Projekt öffnen“ starten. Cursor muss mit dieser definierten Variable gestartet werden.',
    recargar: 'Erneut erkennen',
    conectado: 'Verbunden',
    instalado: 'Installiert, nicht verbunden',
    noInstalado: 'Nicht installiert',
    noCompatible: 'Noch nicht unterstützt',
    motivoLocales:
      'Dieses Programm akzeptiert in seiner Datei nur lokale Server, und WolfCore Dev schreibt das Token nie im Klartext. Es kann daher noch nicht verbunden werden.',
    conectar: 'Verbinden',
    quitar: 'Entfernen',
    copiar: 'Konfiguration kopieren',
    carpeta: 'Konfigurationsordner öffnen',
    archivo: 'Konfigurationsdatei',
    cambios: 'Das ändert sich in der Datei:',
    titulo: (n: string) => `${n} verbinden`,
    tituloQuitar: (n: string) => `Verbindung von ${n} entfernen`,
    aceptarConectar: 'Verbinden',
    aceptarQuitar: 'Verbindung entfernen',
    preparando: 'Vorschau wird vorbereitet…',
    archivoNuevo: 'Die Datei existiert noch nicht: Sie wird erstellt.',
    sinCambios: 'Es gibt nichts zu ändern: Es ist bereits so.',
    copiaPrevia:
      'Vor dem Schreiben wird neben der Datei eine Kopie mit Datum gespeichert (die letzten 5 bleiben erhalten).',
    comentarios:
      'Achtung: Kommentare innerhalb des Eintrags „wolfcore“ gehen verloren. Der Rest der Datei bleibt unverändert.',
    hConectado: (n: string) => `${n} verbunden.`,
    hQuitado: (n: string) => `Verbindung von ${n} entfernt.`,
    hSinCambios: 'Es hat sich nichts geändert.',
    hCopia: (n: string) => `Kopie gespeichert: ${n}`,
    hTokenEscrito:
      'Die Datei enthielt das Token im Klartext: Die Kopie blendet es aus und die Datei enthält es nicht mehr.',
    hCopiada: 'Konfiguration kopiert (ohne das Token).',
  },
};
