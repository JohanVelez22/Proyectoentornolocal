import type { TextosParciales } from '../es';

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
const plural = (n: number, een: string, meerdere: string): string =>
  `${n} ${n === 1 ? een : meerdere}`;

export const nlExtra: TextosParciales = {
  app: {
    lema: 'Uw lokale stack, klaar om te werken',
  },
  resumenGlobal: {
    cortoApagado: 'Alles uit',
    cortoEncendidos: (n) => `${n} actief`,
    cortoErrores: (n) => plural(n, 'met fout', 'met fouten'),
    cortoCargando: 'Verbinden…',
    cortoSinConexion: 'Offline',
    irAServicios: 'Diensten openen',
  },
  acciones: {
    copiarCompleto: 'De volledige tekst kopiëren',
  },
  errores: {
    codigos: {
      'servicios.no_encendio':
        '{nombre} kon niet worden gestart. Controleer Diensten en de bijbehorende logboeken.',
      'tuneles.sitio_no_confiable':
        '{dominio} wordt nog niet vertrouwd: vink in het project "Ik vertrouw deze repository" aan voordat u het publiceert.',
      'clientehttp.peticion_invalida': 'Ongeldige gegevens in het verzoek: {campo}.',
      'clientehttp.variable_sin_definir':
        'De variabele "{nombre}" is niet gedefinieerd in de actieve omgeving.',
      'clientehttp.secreto_faltante':
        'Een opgeslagen geheime waarde ontbreekt: voer deze opnieuw in en sla het verzoek of de omgeving op.',
      'clientehttp.secreto_no_guardado':
        'Een geheime waarde kon niet worden opgeslagen: deze mag geen regeleindes bevatten of groter zijn dan 16 KB, en de systeemversleuteling moet beschikbaar zijn.',
      'clientehttp.url_invalida': 'De URL is niet geldig.',
      'clientehttp.url_con_credenciales':
        'De URL mag geen gebruiker of wachtwoord bevatten: gebruik het tabblad voor authenticatie.',
      'clientehttp.protocolo': "Alleen URL's met http:// en https:// worden geaccepteerd.",
      'clientehttp.cabecera_invalida': 'De header "{nombre}" is niet geldig.',
      'clientehttp.cuerpo_grande': 'De berichttekst van het verzoek is groter dan 1 MB.',
      'clientehttp.plazo': 'Het verzoek heeft de time-out van {segundos} s overschreden.',
      'clientehttp.cancelado': 'Verzoek geannuleerd.',
      'clientehttp.sin_conexion':
        'Kan geen verbinding maken ({motivo}). Controleer het adres, de poort en of de server draait.',
      'clientehttp.certificado': 'Het servercertificaat kon niet worden geverifieerd ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Meer dan {max} omleidingen achter elkaar.',
      'clientehttp.curl_invalido': 'De tekst is geen geldig curl-commando.',
      'clientehttp.curl_grande': 'De curl-tekst is te groot (maximaal 64 KB).',
      'clientehttp.no_existe': 'Het item bestaat niet meer.',
      'clientehttp.limite': 'De limiet van opgeslagen items is bereikt.',
      'ejemplohttp.no_arranca': 'De voorbeeldserver kon niet worden gestart.',
      'laboratoriogit.sin_git': 'Git is niet geïnstalleerd op deze computer.',
      'laboratoriogit.orden_invalida': 'Dat commando staat niet in de lijst van het lab.',
      'laboratoriogit.nombre_invalido':
        'De naam mag alleen letters, cijfers, koppeltekens en underscores bevatten (maximaal 30 tekens).',
      'laboratoriogit.mensaje_invalido':
        'Het bericht moet uit één regel bestaan, maximaal 200 tekens lang zijn en mag niet met "-" beginnen.',
      'laboratoriogit.archivo_invalido': 'Dat bestand is geen oefenbestand.',
      'laboratoriogit.contenido_invalido': 'De inhoud moet tekst zijn van maximaal 2000 tekens.',
      'laboratoriogit.ruta_insegura':
        'De labmap is niet de verwachte, dus wordt die met rust gelaten.',
      'laboratoriogit.fallo_sistema':
        'Het systeem stond niet toe de labmap voor te bereiden of te gebruiken. Probeer "Lab resetten".',
      'buscar.ruta_vetada': 'Die map bevat gegevens van WolfCore Dev: er wordt niet in gezocht.',
      'buscar.resultado_caducado': 'Dat resultaat is niet meer beschikbaar: zoek opnieuw.',
      'buscar.resultado_invalido': 'Dat resultaat kan niet worden geopend.',
      'diff.raiz_invalida': 'Kies twee bestaande mappen die geen koppelingen zijn.',
      'diff.ruta_vetada': 'Die map bevat gegevens van WolfCore Dev: deze wordt niet vergeleken.',
      'diff.cancelado': 'Vergelijking geannuleerd.',
      'diff.plazo': 'De vergelijking duurde langer dan {segundos} s en is geannuleerd.',
      'diff.memoria':
        'De vergelijking heeft te veel geheugen nodig (meer dan {maximo}) en is geannuleerd.',
      'diff.ocupado': 'Er loopt al een vergelijking: annuleer die of wacht.',
      'diff.caducado': 'Die vergelijking is niet meer beschikbaar: vergelijk opnieuw.',
      'diff.archivo_invalido':
        'Dat bestand kan niet meer worden vergeleken: het is gewijzigd of verdwenen.',
      'diff.fallo': 'De vergelijking is mislukt.',
      'compartir.confirmacion_requerida':
        'Delen op internet moet worden bevestigd in het venster van WolfCore Dev.',
      'compartir.ocupado': 'Er wordt al iets gedeeld: stop eerst met delen.',
      'compartir.ruta_invalida': 'Kies een bestaande map of een bestaand bestand.',
      'compartir.duracion_invalida': 'Kies 15 minuten, 1 uur of 4 uur.',
      'compartir.proveedor_invalido':
        'Die tunnel wordt niet ondersteund: gebruik Cloudflare of ngrok.',
      'compartir.raiz_unidad':
        'De hoofdmap van een station wordt niet gedeeld. Kies een map daarbinnen.',
      'compartir.carpeta_usuario':
        'De volledige persoonlijke map (of een map die deze bevat) wordt niet gedeeld. Kies een submap.',
      'compartir.carpeta_datos': 'De gegevensmap van WolfCore Dev wordt niet gedeeld.',
      'compartir.sitio_datos_reales':
        'Een site met echte gegevens (of iets daarbinnen) wordt niet gedeeld.',
      'compartir.carpeta_secretos':
        'Die map bevat sleutels (.ssh, .aws, .git…) en wordt niet gedeeld.',
      'compartir.carpeta_sistema': 'Systeemmappen worden niet gedeeld.',
      'compartir.archivo_sensible':
        'Dat bestand lijkt een geheim of echte gegevens te bevatten en wordt niet gedeeld.',
      'compartir.carpeta_perfil':
        "De gegevens van de programma's van de gebruiker (AppData, .claude, .config…) worden niet gedeeld.",
      'compartir.archivo_grande':
        'Dat bestand is te groot om te controleren en is geen mediabestand of pakket: het wordt niet gedeeld.',
      'compartir.tunel_sin_url':
        'De tunnel gaf zijn adres niet binnen {segundos} s. Probeer het opnieuw.',
      'compartir.tunel_cerrado': 'De tunnel werd gesloten voordat hij klaar was met openen.',
      'compartir.fallo': 'Delen is niet gelukt.',
      'disco.raiz_invalida': 'Kies een bestaande, leesbare map of een station.',
      'disco.cancelado': 'Analyse geannuleerd.',
      'info.ruta_invalida': 'Het pad is ongeldig: het moet absoluut en lokaal zijn.',
      'info.no_existe': 'Het bestand of de map bestaat niet.',
      'info.enlace': 'Dit is een koppeling: kies in plaats daarvan het doelbestand of de doelmap.',
      'info.hash_grande': 'Het bestand is groter dan {maximo} MB: de hashes worden niet berekend.',
      'disco.plazo': 'De analyse duurde langer dan {minutos} min en is geannuleerd.',
      'disco.memoria': 'De analyse heeft te veel geheugen nodig (meer dan {maximo}).',
      'disco.ocupado': 'Er loopt al een analyse: annuleer die of wacht.',
      'disco.caducado': 'Die analyse is niet meer beschikbaar: analyseer opnieuw.',
      'disco.entrada_invalida': 'Die map bestaat niet meer of is gewijzigd: analyseer opnieuw.',
      'disco.fallo': 'De analyse is mislukt.',
      'reverb.no_laravel': 'Reverb is alleen beschikbaar in Laravel-projecten.',
      'reverb.no_confiado':
        'Vink in het project "Ik vertrouw deze repository" aan om Reverb in te schakelen.',
      'reverb.sin_paquete':
        'Het pakket laravel/reverb ontbreekt: installeer het met composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Bevestig dat u Reverb wilt inschakelen.',
      'reverb.sin_activar': 'Schakel Reverb eerst in bij het project.',
      'env.meilisearch_no_disponible':
        'Meilisearch is niet geïnstalleerd: installeer het bij Diensten.',
      'bd.lentas_confirmar':
        'Het loggen van trage queries wijzigen heeft invloed op de hele server: het moet worden bevestigd. Er is niets gewijzigd.',
      'bd.lentas_umbral_invalido': 'De tijd moet tussen 0,1 en 60 seconden liggen.',
      'bd.lentas_motor_no_soportado':
        'Trage queries kunnen alleen worden gewijzigd bij MySQL, MariaDB en PostgreSQL die door WolfCore Dev worden beheerd.',
      'bd.lentas_literal_no_permitido':
        'De SQL wordt niet met zijn waarden getoond: de database bevat echte gegevens of de query kan niet aan een bekende database worden toegeschreven.',
      'bd.lentas_entrada_no_existe': 'Die query staat niet meer in het logboek. Lees het opnieuw.',
      'bd.lentas_fallo':
        'Het logboek van trage queries kon niet worden gelezen of gewijzigd. Controleer of de server draait.',
      'bd.esquema_base_no_existe': 'De database bestaat niet op die server.',
      'bd.esquema_motor_no_soportado': 'De schemaweergave is voor MySQL, MariaDB en PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Het databaseschema kon niet worden gelezen. Controleer of de server draait.',
      'captura.atajo_invalido':
        'Die sneltoets is niet geldig: gebruik Ctrl, Alt, Shift of Super met een letter, een cijfer of een F-toets.',
      'captura.atajo_no_permitido':
        'Die sneltoets is niet toegestaan: gebruik Ctrl of Super met een andere modifier (Ctrl+Alt zonder Shift is AltGr en verhindert het typen van @) en vermijd gangbare sneltoetsen zoals Ctrl+C of Alt+F4.',
      'captura.atajo_ocupado': 'De sneltoets {atajo} wordt al door een ander programma gebruikt.',
      'captura.no_disponible': 'Schermopname is niet beschikbaar op deze computer.',
      'captura.permiso_denegado': 'De toestemming voor schermopname ontbreekt.',
      'captura.sin_imagen': 'Er is geen afbeelding om vast te leggen.',
      'captura.imagen_invalida': 'De opgenomen afbeelding is niet geldig.',
      'disco.sin_confirmar': 'Bevestig het opruimen in het dialoogvenster voordat u doorgaat.',
      'disco.categoria_invalida': 'Die opruimcategorie bestaat niet.',
      'disco.ruta_vetada':
        'De categorie raakt een beschermd pad (gegevens, back-ups, projecten of FlyEnv); er is niets opgeruimd.',
      'disco.sin_analisis':
        'Analyseer opnieuw voordat u opruimt: de analyse is verlopen of ontbreekt.',
      'disco.ocupada': 'Er loopt al een analyse of opruimactie.',
      'disco.sin_registro': 'Het opruimlogboek kon niet worden aangemaakt; er is niets verwijderd.',
      'editor.sin_confirmar': 'Bevestig het opslaan voordat u doorgaat.',
      'editor.confirmacion_reforzada':
        'Dit bestand lijkt geheimen te bevatten of bij een site met echte gegevens te horen: bevestig met de extra controle om het op te slaan.',
      'editor.ruta_invalida': 'Het bestandspad is niet geldig.',
      'editor.no_existe': 'Het bestand bestaat niet.',
      'editor.no_regular': 'Alleen gewone bestanden kunnen worden bewerkt.',
      'editor.ruta_vetada':
        'Dat bestand staat in de gegevensmap van WolfCore Dev: het kan niet vanuit de editor worden geopend of opgeslagen.',
      'editor.archivo_env':
        'De .env-bestanden worden beheerd via de projectvariabelen, niet via de editor.',
      'editor.demasiado_grande': 'Het bestand is te groot voor de editor (maximaal {maximo}).',
      'editor.binario':
        'Het bestand is geen tekst (het is binair): het kan hier niet worden bewerkt.',
      'editor.codificacion':
        'Het bestand is geen UTF-8: de editor opent het niet om het niet te beschadigen.',
      'editor.no_abierto':
        'Dat bestand is niet in de editor geopend (of de versie is gewijzigd): open het opnieuw.',
      'editor.eol_mixto':
        'Het bestand bevat gemengde regeleindes: bevestig het normaliseren ervan om op te slaan.',
      'editor.contenido_invalido': 'De inhoud is geen geldige tekst.',
      'editor.huella_invalida':
        'De vingerafdruk van het geopende bestand ontbreekt: open het opnieuw.',
      'editor.archivo_cambiado':
        'Het bestand is sinds het openen buiten de editor gewijzigd. Laad het opnieuw of bevestig het overschrijven.',
      'editor.copia_fallo':
        'De back-upkopie kon niet worden gemaakt ({codigo}); er is niets opgeslagen.',
      'editor.lectura_fallo': 'Het bestand kon niet worden gelezen ({codigo}).',
      'editor.escritura_fallo':
        'Het bestand kon niet worden opgeslagen ({codigo}). Het origineel is niet aangeraakt.',
      'memoria.sin_confirmar': 'Bevestig de actie in het dialoogvenster voordat u doorgaat.',
      'memoria.modo_invalido': 'Die optimalisatiemodus bestaat niet.',
      'memoria.plan_caducado':
        'De lijst is verlopen of is niet meer de actuele. Toon hem opnieuw voordat u toepast.',
      'memoria.no_disponible':
        'De geheugenoptimalisatie is hier niet beschikbaar of kon het systeem niet lezen.',
      'conversor.ocupado':
        'Er loopt al een conversie en er wacht er nog een: wacht tot die klaar is.',
      'doctor.firewall_reglas_acotadas':
        "Er zijn {cantidad} regel(s) voor programma's van WolfCore Dev die beperkt zijn tot het lokale netwerk (alleen privéprofiel, lokaal subnet en specifieke poorten), zoals de app zelf aanbeveelt om een site te delen. Ze worden alleen getoond: vanaf hier worden ze niet verwijderd.",
      'doctor.firewall_almacen_inseguro':
        'De beveiligde kopie van de regels is niet te vertrouwen (rechten of inhoud wijken af van wat getoond werd): er is geen regel aangemaakt of gewijzigd.',
      'doctor.firewall_quitadas':
        'WolfCore Dev heeft eerder {cantidad} firewallregel(s) verwijderd en een kopie bewaard: u kunt ze opnieuw aanmaken als u ze nodig hebt.',
      'doctor.firewall_parcial':
        'Sommige regels zijn verwijderd, andere niet: ze zijn gewijzigd sinds de lijst werd getoond, waren niet van WolfCore Dev of Windows liet ze niet los. Controleer de lijst.',
      'doctor.firewall_sin_cambios':
        'Er is geen regel gewijzigd: ze komen niet meer overeen met wat getoond werd of konden niet worden gewijzigd.',
      'doctor.firewall_registro_fallido':
        'De kopie van de regels kon niet worden opgeslagen in de beveiligde registersleutel HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos: er is niets gewijzigd.',
      'catalogo.paquete_invalido':
        'Het gedownloade pakket is niet veilig (paden buiten de map, koppelingen of overmatige grootte).',
      'catalogo.extraccion_fallo':
        'Het gedownloade .7z-pakket kon niet worden gelezen of uitgepakt.',
      'runtimes.falta_runtime':
        '{nombre} is niet geïnstalleerd voor dit project: installeer het via Diensten.',
      'runtimes.falta_jdk':
        'Voor dit project is geen JDK geïnstalleerd: installeer Java via Diensten.',
      'runtimes.instalacion_incompleta':
        'De installatie van {nombre} is onvolledig: installeer het opnieuw via Diensten.',
      'procesos.escucha_publica':
        'Het proces luistert op {direccion}:{puerto} ({programa}) en is dus open voor het netwerk. Het is gestopt: het mag alleen op 127.0.0.1 luisteren.',
      'procesos.escucha_publica_livereload':
        'Het proces luistert op {direccion}:{puerto} ({programa}) en is dus open voor het netwerk. Het is gestopt: het mag alleen op 127.0.0.1 luisteren. Dit is Spring DevTools LiveReload: schakel het uit met spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'Het proces luistert op {direccion}:{puerto} ({programa}) en is dus open voor het netwerk. Het is gestopt: het mag alleen op 127.0.0.1 luisteren. Dit is de Node-inspector: gebruik --inspect=127.0.0.1.',
    },
  },
  inicio: {
    servicios: {
      irA: (nombre) => `Naar de dienst ${nombre}`,
    },
    tuneles: {
      irA: (nombre) => `Naar het project ${nombre}`,
    },
  },
  servicios: {
    sinParaEncender: 'Er zijn geen geïnstalleerde diensten om te starten',
    franjaExternos: {
      texto:
        'U hebt de webserver of PHP nog niet geïnstalleerd. Externe engines zijn automatisch gedetecteerd.',
      accion: 'Nginx en PHP installeren',
    },
    externos: {
      titulo: 'Gedetecteerd op uw computer',
      ayuda: 'Een ander programma beheert ze; WolfCore Dev toont ze alleen.',
    },
    borrarDatos: {
      que: {
        meilisearch: 'alle Meilisearch-indexen',
      },
    },
    ftp: {
      redLocalAyuda:
        'Indien uit kan alleen deze computer verbinden (127.0.0.1). Elk project schakelt zijn toegang in bij Projecten.',
      compartir: {
        enlace: 'Map of bestand delen…',
        ayuda:
          'FTP wordt niet via een tunnel gedeeld: het is niet versleuteld en de tunnel draagt alleen HTTP. Om iets op internet te publiceren gebruikt u "Map of bestand delen" (HTTP, alleen-lezen); FTP blijft op het lokale netwerk.',
      },
    },
    datosConexion: 'Verbindingsgegevens',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Verbinding met Meilisearch',
      notaMeilisearch:
        'Om het in een project te gebruiken: Variabelen (.env) → Een blok toevoegen → Meilisearch. Er wordt een voorbeeld met gemaskeerde sleutel getoond en bevestiging is vereist. De sleutel hoort alleen bij deze computer.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Zoeken voor Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (lokale poort)',
      springboot: 'Spring Boot (lokale poort)',
      aspnet: 'ASP.NET Core (lokale poort)',
    },
    tiposCortos: {
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    },
  },
  tunel: {
    sinConfianza:
      'Dit project wordt niet vertrouwd: vink "Ik vertrouw deze repository" aan om het te kunnen publiceren.',
  },
  tuneles: {
    irAProyectos: 'Naar Projecten',
    compartir: {
      enlace: 'Map of bestand delen…',
      ayuda:
        'Publiceert een map of één enkel bestand (alleen-lezen), zonder dat een site nodig is.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Het Reverb-proces van dit project heeft niet het commando van WolfCore Dev (andere host, ander programma of andere poort). Inschakelen vervangt het door het standaardproces, dat alleen op 127.0.0.1 luistert.',
    ayuda: 'Laravel WebSockets, alleen op 127.0.0.1.',
    puerto: (p) => `Poort ${p}`,
    interruptor: (dominio) => `Reverb in- of uitschakelen voor ${dominio}`,
    activarTitulo: 'Reverb inschakelen?',
    activarTexto: (dominio) =>
      `"php artisan reverb:start" wordt uitgevoerd in ${dominio} en luistert alleen op 127.0.0.1 op een vrije poort. De code van het project draait met zijn PHP.`,
    desactivarTitulo: 'Reverb uitschakelen?',
    desactivarTexto:
      'Het proces wordt gestopt en uit het project verwijderd. De REVERB_*-variabelen in .env blijven ongemoeid.',
    activar: 'Inschakelen',
    desactivar: 'Uitschakelen',
    proponer: 'REVERB_*-variabelen voorstellen',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Gestopt',
      iniciando: 'Starten',
      encendido: 'Actief',
      error: 'Mislukt',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP is alleen voor het lokale netwerk: het wordt niet via een internettunnel gedeeld omdat het wachtwoord en bestanden onversleuteld verstuurt.',
    compartirIr: 'Een map of bestand delen met een tijdelijke link',
  },
  ia: {
    pestanas: {
      etiqueta: 'AI-secties',
      agentes: 'Agents',
      nube: 'Cloud',
      local: 'Lokale modellen',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram:
        'Voor uw computer: modellen tot ≈{b}B, die in het geheugen van de grafische kaart passen.',
      sugerenciaRam: 'Voor uw computer: modellen tot ≈{b}B, die in het werkgeheugen draaien.',
      sugerenciaPequena: 'Voor uw computer: alleen zeer kleine modellen (minder dan 1B).',
      sugerenciaDesconocida:
        'De hardware van uw computer kon niet worden gelezen, dus er is geen aanbeveling.',
      aviso: 'Dit is slechts een richtlijn: u kunt elk model downloaden.',
      comprobando: 'Uw computer wordt gecontroleerd…',
      niveles: {
        recomendado: 'Aanbevolen',
        lento: 'Kan traag zijn',
        'no-cabe': 'Past niet',
        desconocido: 'Geen gegevens',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Past ruim in het geheugen van de grafische kaart (heeft ≈{necesario} nodig van {disponible}).',
        'justo-vram':
          'Past in de grafische kaart, maar krap (heeft ≈{necesario} nodig van {disponible}).',
        'solo-ram':
          'Past niet in de grafische kaart en draait in het werkgeheugen (heeft ≈{necesario} nodig van {disponible} bruikbaar): trager.',
        'cabe-ram':
          'Past ruim in het werkgeheugen (heeft ≈{necesario} nodig van {disponible} bruikbaar).',
        'ram-justo':
          'Past in het werkgeheugen, maar krap (heeft ≈{necesario} nodig van {disponible} bruikbaar): kan traag zijn.',
        'sin-memoria':
          'Heeft ≈{necesario} geheugen nodig en uw computer beschikt over ≈{disponible}.',
        'sin-disco':
          'Er is niet genoeg vrije schijfruimte om het te downloaden ({disponible} over).',
        'tamano-desconocido':
          'De grootte van het model kon niet worden opgevraagd (geen verbinding met het register van Ollama).',
        'equipo-desconocido': 'Het geheugen van uw computer kon niet worden gelezen.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'U kunt de download op elk moment annuleren; wat al is gedownload, wordt verwijderd.',
      tamano: (t) => `Downloadgrootte: ${t}.`,
      tamanoDesconocido:
        'De grootte kon niet worden gecontroleerd (geen verbinding met het Ollama-register). Modellen zijn meestal 1 tot meer dan 40 GB.',
      libre: (l) => `Vrije ruimte op de modelschijf: ${l}.`,
      libreDesconocido: 'De vrije schijfruimte kon niet worden gemeten.',
      sinEspacio: (t, l) =>
        `Onvoldoende ruimte: het model neemt ${t} in beslag en er is slechts ${l} vrij. Maak ruimte vrij of kies een kleiner model.`,
    },
  },
  proyectos: {
    asistente: {
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    tarjeta: {
      verEnBases: 'Bekijken in Databases',
    },
  },
  panel: {
    insignias: {
      memoriaAlta: 'Hoog geheugengebruik',
    },
    discos: {
      titulo: 'Schijfruimte',
      leyendo: 'Schijven lezen…',
      sistema: 'Systeem',
      datos: 'WolfCore-gegevens',
      ambos: 'Systeem en WolfCore-gegevens',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} vrij (${pct} %)`,
      poco: 'Weinig vrije ruimte',
      casiLleno: 'Bijna geen ruimte meer',
      liberar: 'Ruimte vrijmaken',
      versiones: 'Ongebruikte versies opruimen',
      temporales: 'Tijdelijke bestanden en caches van WolfCore opruimen',
      ocupaMas: 'Zien wat de meeste ruimte inneemt',
    },
    alertas: {
      grupo: (n) => `Gevonden problemen (${n})`,
      verTodos: (n) => `Alle ${n} tonen`,
      verMenos: 'Minder tonen',
      masAcciones: 'Meer acties',
    },
    procesos: {
      resto: 'Overige diensten',
    },
  },
  captura: {
    barra: 'Tekengereedschap',
    herramientas: {
      recuadro: 'Kader',
      flecha: 'Pijl',
      linea: 'Lijn',
      resaltador: 'Markeerstift',
      texto: 'Tekst',
      pixelar: 'Pixeleren',
      pixelarAyuda: 'Pixeleren (niet veilig voor gevoelige gegevens: gebruik Verbergen)',
      ocultar: 'Verbergen',
      ocultarAyuda: 'Verbergen met een effen vulling (aanbevolen voor gevoelige gegevens)',
    },
    deshacer: 'Ongedaan maken',
    rehacer: 'Opnieuw',
    copiar: 'Kopiëren',
    copiarAyuda:
      'Kopiëren naar het klembord. Het Windows-klembord kan het in zijn geschiedenis bewaren of met andere apparaten synchroniseren.',
    guardar: 'Opslaan…',
    alConversor: 'Naar de afbeeldingsconverter sturen',
    cerrar: 'Annuleren (Esc)',
    nuevaSeleccion: 'Nieuwe selectie',
    color: 'Kleur',
    grosor: 'Dikte',
    formato: 'Indeling',
    cargando: 'Opname voorbereiden…',
    guiaRegion: 'Sleep om het gebied te kiezen. Esc annuleert.',
    guiaVentana: 'Kies het venster dat u wilt vastleggen. Esc annuleert.',
    sinVentanas: 'Er zijn geen vensters die kunnen worden vastgelegd.',
    textoPlaceholder: 'Typ en druk op Enter',
    copiada: 'Naar het klembord gekopieerd',
    guardada: (archivo) => `Opgeslagen in ${archivo}`,
    errorCargar: 'De opname kon niet worden geopend.',
    errorCopiar: 'De afbeelding kon niet worden gekopieerd.',
    errorGuardar: 'De afbeelding kon niet worden opgeslagen.',
    errorConversor: 'De afbeelding kon niet naar de converter worden gestuurd.',
    errorVentana: 'Dat venster kon niet worden vastgelegd.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Alles gebeurt op deze computer: de opname wordt niet naar een dienst geüpload en pas op schijf opgeslagen als u dat doet. Vensters van WolfCore Dev worden even verborgen zodat ze niet op de afbeelding komen.',
      region: 'Gebied',
      regionAyuda: 'Sleep over het scherm om het gebied te kiezen.',
      ventana: 'Venster',
      ventanaAyuda: 'Kies een van de geopende vensters.',
      pantalla: 'Volledig scherm',
      pantallaAyuda: 'Het scherm waar de cursor zich bevindt.',
      atajoActivo: (atajo) => `Globale sneltoets actief: ${atajo} (gebied).`,
      atajoInactivo: 'Er is geen globale sneltoets. Schakel die in bij Instellingen.',
      noDisponible: 'Schermopname is niet beschikbaar op deze computer.',
      permisoDenegado:
        'De toestemming voor schermopname ontbreekt. Schakel die voor WolfCore Dev in bij de systeeminstellingen.',
      ocupada: 'Er is al een opname bezig.',
    },
    ajustes: {
      titulo: 'Schermopname',
      descripcion:
        'Gebied, venster of volledig scherm met een snelle editor. Volledig lokaal: er wordt niets geüpload of opgeslagen totdat u dat beslist.',
      activar: 'Globale sneltoets',
      activarAyuda:
        'Standaard uit. Indien ingeschakeld wordt hij alleen geregistreerd als geen ander programma hem gebruikt, en hij wordt vrijgegeven wanneer WolfCore Dev sluit.',
      atajo: 'Combinatie',
      grabar: 'Wijzigen',
      grabando: 'Druk op de combinatie…',
      grabandoAyuda:
        'Gebruik Ctrl of Super met een andere modifier (bijvoorbeeld Ctrl+Alt+Shift) en een letter, een cijfer of een F-toets. Vermijd gangbare sneltoetsen zoals Ctrl+C.',
      formato: 'Indeling bij opslaan',
      activado: (atajo) => `Sneltoets ${atajo} ingeschakeld.`,
      desactivado: 'Sneltoets uitgeschakeld.',
      ocupado: (atajo) =>
        `De sneltoets ${atajo} wordt al door een ander programma gebruikt en er is niets gewijzigd. Probeer een andere combinatie.`,
      ocupadoInicio:
        'De opgeslagen sneltoets wordt al door een ander programma gebruikt en is niet geregistreerd. Kies een andere combinatie.',
      sinPermiso:
        'Op macOS is de toestemming voor schermopname vereist; die wordt bij de eerste opname gevraagd.',
      formatoGuardado: 'Indeling opgeslagen.',
    },
  },
  herramientas: {
    entorno: {
      equipo: {
        titulo: 'Mijn computer',
        copiarResumen: 'Samenvatting kopiëren',
        resumenCopiado: 'Samenvatting gekopieerd',
        privacidad: 'De samenvatting bevat geen serienummers of unieke identificatiegegevens.',
        desconocido: 'onbekend',
        sinGpu: 'Geen gedetecteerd',
        so: 'Besturingssysteem',
        cpu: 'Processor',
        ram: 'Werkgeheugen (RAM)',
        gpu: 'Grafische kaart',
        placa: 'Moederbord',
        disco: 'Schijf {u}',
        compilacion: 'build {n}',
        nucleosHilos: '{n} kernen, {h} threads',
        ramDetalle: '{total} in totaal, {libre} vrij',
        vram: '{v} VRAM',
        discoDetalle: '{libre} vrij van {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Computeroverzicht · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Computeroverzicht · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: 'Zet hier een bestand of map neer om de gegevens te zien. Er wordt alleen gelezen: er wordt niets gewijzigd.',
      soltarEnVentana: 'Zet neer om de gegevens te zien',
      ruta: 'Pad',
      mime: 'MIME-type',
      creado: 'Gemaakt',
      accedido: 'Laatst geopend',
      atributos: 'Kenmerken',
      soloLectura: 'Alleen-lezen',
      oculto: 'Verborgen',
      ninguno: 'Geen',
      dimensiones: 'Afmetingen',
      sensible: 'Gevoelig bestand: de gegevens worden getoond, nooit de inhoud.',
      esArchivo: 'Bestand',
      esCarpeta: 'Map',
      tamanoTotal: 'Totale grootte',
      archivos: 'Bestanden',
      carpetas: 'Submappen',
      analizando: 'Map analyseren…',
      cancelar: 'Annuleren',
      cancelado: 'Analyse geannuleerd.',
      abrirDisco: 'Openen in Schijfgebruik',
      incompleto:
        'Sommige items zijn niet meegeteld: koppelingen, geweigerde toegang of te grote mappen.',
    },
    chmod: {
      permisos: 'Machtigingen',
      propietario: 'Eigenaar',
      grupo: 'Groep',
      otros: 'Anderen',
      leer: 'Lezen (r)',
      escribir: 'Schrijven (w)',
      ejecutar: 'Uitvoeren (x)',
      especiales: 'Speciale bits',
      setuid: 'setuid: draait met de rechten van de eigenaar',
      setgid: 'setgid: draait met de rechten van de groep; bij een map erft alles wat erin wordt aangemaakt de groep',
      sticky: 'sticky: alleen de eigenaar mag in de map verwijderen',
      habituales: 'Veelgebruikte waarden',
      octal: 'Octaal',
      simbolico: 'Symbolisch',
      octalInvalido: 'Voer 3 of 4 cijfers van 0 tot 7 in (bijvoorbeeld 755).',
      simbolicoInvalido: 'Voer 9 tekens in, zoals rwxr-xr-x.',
      ejemplo: 'Voorbeeld',
      archivo: 'Bestandsnaam',
      archivoPorDefecto: 'bestand',
      nota: 'Op Windows niet van toepassing; bedoeld voor Linux- en macOS-servers.',
      avisoOtros:
        'Elke gebruiker op de server kan het wijzigen: geef «anderen» liever geen schrijfrechten.',
    },
    lista: {
      chmod: {
        nombre: 'chmod-machtigingen',
        descripcion: 'Selectievakjes, octaal en symbolisch, voor Linux- en macOS-servers.',
      },
      clienteHttp: {
        nombre: 'HTTP-client',
        descripcion: "API's uitproberen: verzoeken, omgevingen, collecties en geschiedenis.",
      },
      captura: {
        nombre: 'Schermopname',
        descripcion: 'Gebied, venster of volledig scherm, met een snelle editor.',
      },
      guiaTuneles: {
        nombre: 'Tunnelgids',
        descripcion: "Cloudflare en ngrok stap voor stap, met commando's om te kopiëren.",
      },
      guiaHttp: {
        nombre: 'HTTP-gids',
        descripcion: 'Statuscodes en methoden, met zoekfunctie en voorbeelden.',
      },
      guiaGit: {
        nombre: 'Git- en GitHub-gids',
        descripcion: "Commando's en werkwijzen, met een lab om veilig te oefenen.",
      },
      limpiezaDisco: {
        nombre: 'Schijfopruiming',
        descripcion:
          'Tijdelijke bestanden en te hergenereren caches analyseren en verwijderen, met voorbeeld en bevestiging.',
      },
      editor: {
        nombre: 'Code-editor',
        descripcion:
          'Tekstbestanden bewerken met kleurmarkering, back-upkopie en bevestigd opslaan.',
      },
      compartir: {
        nombre: 'Map of bestand delen',
        descripcion:
          'Een map of een bestand op internet publiceren met een tijdelijke alleen-lezen link.',
      },
      usoDisco: {
        nombre: 'Schijfgebruik',
        descripcion:
          'Wat ruimte inneemt op een station of in een map: boomstructuur, grootste bestanden en mappen, per extensie.',
      },
      diffCarpetas: {
        nombre: 'Mapvergelijking',
        descripcion:
          'Vergelijkt twee mappen: alleen in de ene, alleen in de andere en verschillend, met de diff van elk bestand.',
      },
      grabarPantalla: {
        nombre: 'Scherm opnemen',
        descripcion: 'Opent de recorder die uw systeem al bevat.',
      },
    },
    secciones: {
      codigo: 'Code',
      red: 'Netwerk',
      seguridad: 'Beveiliging',
      archivos: 'Bestanden en media',
      sistema: 'Systeem',
    },
    tarjetas: {
      comparar: {
        nombre: 'Vergelijken',
        descripcion: 'Teksten en mappen: de verschillen naast elkaar.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'Van een tekst of link, of zodat anderen op uw wifi kunnen komen.',
      },
      guias: {
        nombre: 'Gidsen',
        descripcion: "HTTP, tunnels en Git, met voorbeelden en commando's om te kopiëren.",
      },
    },
    pestanas: {
      diff: 'Teksten',
      diffCarpetas: 'Mappen',
      qr: 'QR',
      qrWifi: 'Wifi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunnels',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev heeft geen eigen recorder: het opent die welke uw systeem al bevat. De video wordt opgeslagen waar dat programma hem bewaart.',
      abrir: 'Recorder openen',
      abierta: 'Knipprogramma geopend. Kies het schermgebied en druk op Starten.',
      noSePudo:
        'Het Knipprogramma kon van hieruit niet worden geopend. Gebruik een van de sneltoetsen uit de gids.',
      guiaTitulo: 'Zo neemt u op op uw systeem',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Druk op Win + Shift + R om op te nemen met het Knipprogramma.',
            'Als uw Knipprogramma niet up-to-date is, drukt u op Win + Alt + R om op te nemen met de Xbox Game Bar.',
            'Stop de opname met de knop op de balk die bovenaan verschijnt.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Druk op Cmd + Shift + 5 om de opnamebalk te openen.',
            'Kies of u het hele scherm of een geselecteerd deel opneemt.',
            'Klik op Opnemen en klik om te stoppen op de stopknop in de menubalk.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Elke desktop bevat een recorder: in GNOME Ctrl + Alt + Shift + R; in KDE Spectacle.',
            'Als u er geen hebt, installeert u OBS Studio of SimpleScreenRecorder via uw pakketbeheer.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `Ongeldige expressie: ${detalle}` : 'Ongeldige expressie.'),
      regexDetalle: {
        corchete: 'een vierkant haakje "[" wordt niet gesloten.',
        parentesis: 'een ronde haak "(" wordt niet gesloten.',
        parentesisSobra: 'een sluitende ronde haak ")" heeft geen openende.',
        nadaQueRepetir: 'een kwantor ("*", "+", "?" of "{}") heeft niets om te herhalen.',
        barraAlFinal: 'het patroon mag niet eindigen op een backslash.',
        rangoInvertido: 'een bereik in een tekenklasse is omgekeerd (bijvoorbeeld "z-a").',
        cuantificador: 'de kwantor "{}" is onvolledig of de getallen staan omgekeerd.',
        grupo: 'de naam of vorm van een groep is niet geldig.',
        escape: 'een escapereeks met backslash is niet geldig.',
      },
    },
    busqueda: {
      excluir: "Ook overslaan (gescheiden door komma's)",
      incluirPesadas: 'Zware mappen meenemen (node_modules, vendor, .git…)',
      contexto: 'Contextregels',
      grupoNombres: (n) => `Op naam (${n})`,
      grupoContenido: (n) => `Op inhoud (${n})`,
      carpeta: 'map',
      listaAria: 'Zoekresultaten',
      atajos:
        '↑ ↓ om te bewegen, Enter om in de editor te openen, Esc om te annuleren of terug te gaan naar de tekst.',
      sensible: (n) => `Gevoelig bestand: treffer op regel ${n} (de inhoud wordt niet getoond).`,
      mostrarMas: (n) => `${n} meer tonen`,
      linea: (n) => `regel ${n}`,
      sinGrupo: 'Geen resultaten in deze groep.',
      topeBytes: 'De leeslimiet is bereikt: verfijn de zoekopdracht.',
    },
    compartir: {
      explicacion:
        'Publiceert een map of een bestand van deze computer op internet met een tijdelijke link. Alleen-lezen: iedereen met de link kan bekijken en downloaden, maar niets uploaden of wijzigen. De link bevat een geheime code, verloopt op het door u gekozen tijdstip en wordt gesloten wanneer u WolfCore Dev afsluit. .env-bestanden, sleutels, de map .git en sites met echte gegevens worden nooit gedeeld.',
      eleccion: 'Wat te delen',
      elegirCarpeta: 'Map kiezen…',
      elegirArchivo: 'Bestand kiezen…',
      elegido: 'Gekozen',
      duracion: 'Stoppen met delen na',
      duraciones: {
        m15: '15 minuten',
        h1: '1 uur',
        h4: '4 uur',
      },
      tunel: 'Tunnel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (snel, zonder account)',
        ngrok: 'ngrok (met uw token)',
      },
      ngrokSinToken: 'ngrok heeft uw token nodig: sla het op in de tunnelopties van een site.',
      compartir: 'Delen…',
      sinFtp:
        'FTP wordt niet via een tunnel gedeeld: het is niet versleuteld en de tunnel draagt alleen HTTP.',
      vacio: {
        titulo: 'Er wordt niets gedeeld',
        texto:
          'Kies een map of een bestand om een tijdelijke openbare link te krijgen. Er wordt niets gepubliceerd totdat u het bevestigt.',
      },
      grandes:
        'Tekstbestanden of bestanden van onbekend type groter dan 8 MB worden niet gedeeld, omdat ze niet volledig gecontroleerd kunnen worden; afbeeldingen, audio, video en pakketten (zip, 7z, gz, pdf) wel. Ze staan gemarkeerd in de lijst.',
      comprimidos:
        'Een gecomprimeerd bestand (.zip, .7z, .gz) wordt gedeeld zoals het is, zonder erin te kijken: bevat het een .env-bestand of sleutels, dan worden die gepubliceerd.',
      confirmar: {
        titulo: 'Op internet delen',
        pregunta: 'Dit op internet publiceren?',
        rutaReal: 'Echt pad (koppelingen omgezet)',
        ruta: 'Exact pad',
        aviso: (dur) =>
          `Het is ${dur} openbaar op internet vanaf het moment dat de link klaar is. Iedereen met de link kan bekijken en downloaden wat er gedeeld wordt.`,
        boton: 'Op internet delen',
      },
      abriendo: 'Tunnel openen…',
      activa: 'Bezig met delen',
      enlace: 'Openbare link',
      copiar: 'Link kopiëren',
      qr: 'QR-code van de link',
      vence: (hasta, restan) => `Verloopt om ${hasta} (${restan})`,
      restan: (min) => (min <= 1 ? 'minder dan 1 minuut' : `${min} min`),
      dejar: 'Stoppen met delen',
      fin: {
        vencio: 'De tijd is om: de server en de tunnel zijn gesloten.',
        tunel: 'De tunnel is gesloten en het delen is gestopt.',
      },
      registro: {
        titulo: 'Toegangen',
        ayuda:
          'De laatste 200, alleen in het geheugen. De geheime code van de link wordt nooit getoond.',
        vacioTitulo: 'Nog geen toegangen',
        vacioTexto: 'Elke keer dat iemand de link opent, verschijnt dit hier.',
        col: {
          hora: 'Tijd',
          ip: 'IP',
          ruta: 'Pad',
          codigo: 'Code',
        },
        sinPermiso: '(zonder de juiste code)',
      },
    },
    usoDisco: {
      explicacion:
        'Toont wat ruimte inneemt op een station of in een map. Leest alleen namen en groottes (nooit inhoud), volgt geen koppelingen of junctions en werkt in een apart proces. Het verwijdert, verplaatst of wijzigt niets.',
      unidades: 'Stations',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${libre} vrij van ${total}`,
      sinUnidades: 'De lijst met stations kon niet worden gelezen. U kunt een map kiezen.',
      elegirCarpeta: 'Map kiezen…',
      analizando: 'Analyseren…',
      leyendo: 'Lezen',
      progreso: (archivos, carpetas, bytes) =>
        `${archivos} bestanden · ${carpetas} mappen · ${bytes}`,
      cancelar: 'Annuleren',
      cancelado: 'Analyse geannuleerd.',
      resumen: (total, archivos, carpetas) =>
        `${total} in ${archivos} bestanden en ${carpetas} mappen`,
      duracion: (segundos) => `Het duurde ${segundos} s.`,
      vistas: {
        arbol: 'Boom',
        carpetas: 'Mappen',
        archivos: 'Bestanden',
        extensiones: 'Extensies',
      },
      arbolAyuda:
        'Gesorteerd op grootte. Alleen mappen en bestanden die minstens 0,5% van het totaal wegen worden getoond; de rest wordt samengevat onder "Overige".',
      carpetasAyuda:
        'De 50 mappen met het meeste eigen gewicht: wat de bestanden wegen die ze rechtstreeks bevatten, zonder hun submappen.',
      archivosAyuda: 'De 50 grootste bestanden.',
      extensionesAyuda:
        'De 20 extensies die de meeste ruimte innemen; de rest gaat naar "Overige extensies".',
      col: {
        nombre: 'Naam',
        tamano: 'Grootte',
        porcentaje: 'Van totaal',
        archivos: 'Bestanden',
        ruta: 'Pad',
        extension: 'Extensie',
      },
      otros: (n) => `Overige (${n} kleine bestanden)`,
      sinExtension: '(geen extensie)',
      otrasExtensiones: 'Overige extensies',
      expandir: (nombre) => `${nombre} uitklappen`,
      contraer: (nombre) => `${nombre} inklappen`,
      abrir: 'Openen in Verkenner',
      copiar: 'Pad kopiëren',
      denegada: 'Kon niet worden gelezen',
      avisos: {
        enlaces: (n) =>
          `${n} ${n === 1 ? 'koppeling of junction is' : 'koppelingen of junctions zijn'} niet gevolgd en ${n === 1 ? 'telt' : 'tellen'} als 0.`,
        denegados: (n) =>
          `${n} ${n === 1 ? 'item kon' : 'items konden'} niet worden gelezen (geen toestemming, of gewijzigd tijdens de analyse). Zonder beheerdersrechten kunnen sommige systeemmappen niet worden gelezen: dit hulpmiddel vraagt er niet om.`,
        enlacesDuros: (n) =>
          `${n} ${n === 1 ? 'extra naam' : 'extra namen'} van bestanden met harde koppelingen ${n === 1 ? 'is' : 'zijn'} niet dubbel geteld.`,
        enlacesDurosIncompleto:
          'Er waren zoveel harde koppelingen dat het register vol raakte: het totaal kan sommige bestanden dubbel tellen.',
        truncado: 'De maximale diepte is bereikt: sommige mappen zijn niet meegeteld.',
        tamanoLogico:
          'De groottes zijn logisch (wat elk bestand opgeeft), niet de gebruikte schijfruimte: bestanden van OneDrive die alleen online staan, gecomprimeerde bestanden en sparse-bestanden kunnen afwijken.',
        verEnlaces: 'De niet gevolgde koppelingen tonen',
      },
      limpieza: {
        titulo: 'Ruimte vrijmaken',
        texto:
          'Dit hulpmiddel meet alleen. Om tijdelijke bestanden en te hergenereren caches of ongebruikte dienstversies te verwijderen, gebruikt u wat al bestaat:',
        temporales: 'Schijfopruiming',
        versiones: 'Ongebruikte versies (Diensten)',
      },
      vacio: {
        titulo: 'Nog geen analyse',
        texto:
          'Kies een station of een map om te zien wat ruimte inneemt. Er wordt niets gewijzigd.',
      },
      sinContenido: {
        titulo: 'Niets om te tellen',
        texto: 'Die map bevat geen leesbare bestanden.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Vergelijkt twee mappen zonder er iets in te wijzigen: wat alleen in de ene staat, alleen in de andere en wat verschilt. Volgt geen koppelingen en werkt in een apart proces.',
      carpetaA: 'Map A',
      carpetaB: 'Map B',
      elegir: 'Map kiezen',
      sinElegir: 'Niet gekozen',
      comparar: 'Vergelijken',
      comparando: 'Vergelijken…',
      cancelar: 'Annuleren',
      cancelada: 'Vergelijking geannuleerd.',
      iguales: 'De twee mappen zijn gelijk.',
      grupoSoloA: 'Alleen in A',
      grupoSoloB: 'Alleen in B',
      grupoDistintos: 'Verschillend',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'Geen',
      resumen: (a, b, iguales) => `A: ${a} bestanden · B: ${b} bestanden · ${iguales} identiek`,
      truncado: 'Een limiet is bereikt (bestanden, diepte of grootte): de lijst is niet volledig.',
      recortado: (mostrados, total) =>
        `Er zijn meer bestanden dan getoond (${mostrados} van ${total}).`,
      sinComparar: (n) =>
        `${n} grote bestanden met dezelfde grootte zijn niet op inhoud vergeleken.`,
      omitidos: (n) => `${n} koppelingen, junctions of speciale items zijn overgeslagen.`,
      motivoTamano: 'andere grootte',
      motivoContenido: 'zelfde grootte, andere inhoud',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Kies een "verschillend" bestand uit de lijst om het verschil te zien.',
      soloEnUno: (lado) => `Dit bestand bestaat alleen in ${lado}.`,
      cargando: 'Bestanden lezen…',
      binario: 'De bestanden verschillen, maar zijn geen tekst: de diff wordt niet getoond.',
      sensible:
        'Gevoelig bestand (.env, sleutels of echte gegevens): het verschilt, maar de inhoud wordt niet getoond. U kunt het in de editor openen, die om een versterkte bevestiging vraagt.',
      tope: (kb) =>
        `De bestanden verschillen, maar zijn groter dan ${kb} KB: de tekstdiff wordt niet getoond.`,
      demasiadoDistinto:
        'De bestanden verschillen zo sterk dat de regel-voor-regel-diff niet wordt getoond.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'gemengde regeleindes',
        ninguno: 'geen regeleindes',
      },
      saltosDistintos: (a, b) => `Regeleindes: A gebruikt ${a} en B gebruikt ${b}.`,
      soloSaltos:
        'De tekst van de regels is gelijk: alleen de regeleindes (inclusief die aan het eind van het bestand) of de BOM verschillen.',
      resumenArchivo: (agregadas, quitadas) =>
        `${agregadas} regels toegevoegd, ${quitadas} verwijderd`,
      truncadoArchivo: 'Alleen de eerste regels worden getoond.',
      lineasIguales: (n) => `… ${n} identieke regels …`,
      abrirA: 'A openen in de editor',
      abrirB: 'B openen in de editor',
      atajos: '↑ ↓ om te bewegen, Enter om het verschil te zien, Esc om te annuleren.',
      listaAria: (grupo) => `Bestanden: ${grupo}`,
      detalleAria: 'Bestandsverschillen',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Secties van de HTTP-client',
        peticion: 'Verzoek',
        coleccion: 'Collectie',
        historial: 'Geschiedenis',
        entornos: 'Omgevingen',
      },
      entorno: 'Omgeving',
      sinEntorno: 'Geen omgeving',
      metodo: 'Methode',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/pad of {{base}}/pad',
      enviar: 'Verzenden',
      enviarAtajo: 'Verzenden (Ctrl+Enter)',
      cancelar: 'Annuleren',
      nueva: 'Nieuw',
      guardar: 'Opslaan in collectie',
      nombre: 'Naam',
      nombrePlaceholder: 'Naam van het verzoek',
      guardada: 'Verzoek opgeslagen',
      ayudaVariables: 'Gebruik {{variable}} om waarden uit de geselecteerde omgeving te halen.',
      secciones: {
        params: 'Parameters',
        cabeceras: 'Headers',
        cuerpo: 'Body',
        auth: 'Authenticatie',
        opciones: 'Opties',
      },
      par: {
        clave: 'Naam',
        valor: 'Waarde',
        agregar: 'Rij toevoegen',
        quitar: 'Rij verwijderen',
        activa: 'Rij actief',
        falta: 'Het geheim ontbreekt: typ het om te kunnen verzenden.',
      },
      cuerpo: {
        tipo: 'Bodytype',
        ninguno: 'Geen',
        json: 'JSON',
        form: 'Formulier (urlencoded)',
        multipart: 'Multipart (alleen tekst)',
        raw: 'Ruwe tekst',
        tipoContenido: 'Content-Type',
        texto: 'Inhoud',
        multipartAyuda: 'Alleen tekstvelden: er worden geen bestanden van de schijf verzonden.',
      },
      auth: {
        tipo: 'Type',
        ninguna: 'Geen',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API-sleutel',
        token: 'Token',
        usuario: 'Gebruiker',
        clave: 'Wachtwoord',
        nombre: 'Naam van header of parameter',
        en: 'Verzenden in',
        cabecera: 'Header',
        query: 'Querystring',
        ayuda:
          'De waarde wordt door het systeem versleuteld opgeslagen; de collectie, de geschiedenis en de omgevingen bewaren alleen een verwijzing.',
      },
      secreto: {
        guardado: 'Opgeslagen (versleuteld). Typ om te vervangen.',
        mostrar: 'Tonen',
        ocultar: 'Verbergen',
        quitar: 'Verwijderen',
        valor: 'Opgeslagen waarde',
        porNombre: 'Het wordt versleuteld opgeslagen omdat de naam op een geheim lijkt.',
      },
      opciones: {
        plazo: 'Time-out (seconden)',
        plazoAyuda: 'Van 1 tot 120 seconden.',
        ignorarCert: 'Certificaatfouten negeren voor dit verzoek',
        ignorarAviso:
          'Gevaarlijk: de verbinding wordt niet meer geverifieerd. Geldt alleen voor dit verzoek en zijn host. WolfCore-.test-sites worden al met een eigen CA geverifieerd.',
        limites:
          'Antwoord tot 10 MB en maximaal 10 omleidingen. Geen opgeslagen cookies en geen systeemproxy.',
      },
      respuesta: {
        enviando: 'Verzenden…',
        estado: 'Status',
        tiempo: 'Tijd',
        tamano: 'Grootte',
        cuerpo: 'Body',
        cabeceras: 'Headers',
        redirecciones: 'Omleidingen',
        vacioTitulo: 'Nog geen antwoord',
        vacioTexto: 'Typ een URL en druk op Verzenden. Het verzoek gaat uit van WolfCore Dev.',
        binario: (bytes, tipo) => `Binair van ${bytes} bytes, type ${tipo || 'onbekend'}.`,
        sinCuerpo: 'Het antwoord heeft geen body.',
        truncada: 'Het antwoord overschreed 10 MB: het is afgekapt en onvolledig.',
        parcial: (mostrados) => `De eerste ${mostrados} tekens worden getoond.`,
        sinRedirecciones: 'Er waren geen omleidingen.',
        salto: (n) => `Stap ${n}`,
        urlFinal: 'Definitieve URL',
        certIgnorado: 'Certificaatfouten zijn voor dit verzoek genegeerd.',
        caWolf: 'Geverifieerd met de CA van WolfCore Dev.',
        copiar: 'Body kopiëren',
        copiado: 'Body gekopieerd',
        formato: 'Opgemaakte JSON',
        crudo: 'Originele tekst',
      },
      curl: {
        copiar: 'Kopiëren als curl',
        incluir: 'Inloggegevens opnemen',
        incluirAyuda:
          'Uitgevinkt verschijnen geheime waarden als <secreto>. Aangevinkt bevat het commando de echte inloggegevens.',
        copiado: 'curl-commando gekopieerd',
        importar: 'curl importeren',
        importarTitulo: 'Een curl-commando importeren',
        importarAyuda:
          'Plak een curl-commando. Het wordt alleen als tekst gelezen: er wordt niets uitgevoerd. Inloggegevens gaan naar de versleutelde opslag.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/pad -H 'Accept: application/json'",
        importarBoton: 'Importeren',
        importada: 'Verzoek in de collectie geïmporteerd',
        avisos: {
          opcion_ignorada: (d) => `Optie genegeerd: ${d}`,
          archivo_ignorado: (d) => `Bestanden van de schijf worden niet gelezen: ${d}`,
          inseguro_ignorado:
            '-k/--insecure is genegeerd. Hebt u het nodig, schakel dan "Certificaatfouten negeren" handmatig in.',
          comando_cortado: 'Alles na een shell-operator (|, ;, &, >) is genegeerd.',
          sin_evaluar:
            'De tekst bevatte $(…), backticks of shellvariabelen: ze worden niet geëvalueerd en blijven als tekst staan.',
          url_sin_esquema: 'De URL had geen schema: http:// is gebruikt.',
          varias_urls: (d) => `Een extra argument is genegeerd: ${d}`,
          cabecera_invalida: (d) => `Een ongeldige header is genegeerd: ${d}`,
          secretos_guardados:
            'De geïmporteerde inloggegevens zijn versleuteld opgeslagen; de collectie bewaart alleen hun verwijzing.',
        },
      },
      coleccion: {
        vacioTitulo: 'De collectie is leeg',
        vacioTexto:
          'Sla een verzoek op of importeer een curl-commando om het bij de hand te hebben.',
        abrir: 'Openen',
        borrar: 'Verwijderen',
        borrada: 'Verzoek verwijderd',
      },
      historial: {
        vacioTitulo: 'Geen geschiedenis',
        vacioTexto:
          'De laatste 100 verzoeken blijven hier, zonder inloggegevens: gevoelige headers verschijnen als ***.',
        abrir: 'Openen',
        limpiar: 'Geschiedenis wissen',
        sinRespuesta: 'Geen antwoord',
      },
      entornos: {
        vacioTitulo: 'Geen omgevingen',
        vacioTexto:
          'Een omgeving definieert variabelen zoals {{base}} of {{token}}. Als geheim gemarkeerde worden versleuteld opgeslagen.',
        nuevo: 'Nieuwe omgeving',
        nombre: 'Naam van de omgeving',
        variable: 'Variabele',
        valor: 'Waarde',
        secreta: 'Geheim',
        agregar: 'Variabele toevoegen',
        quitar: 'Variabele verwijderen',
        guardar: 'Omgeving opslaan',
        guardado: 'Omgeving opgeslagen',
        borrar: 'Omgeving verwijderen',
        borrado: 'Omgeving verwijderd',
        usar: 'Deze omgeving gebruiken',
        activo: 'Actief',
        sinNombre: 'Typ een naam voor de omgeving.',
      },
    },
    imagenes: {
      nombreCaptura: 'schermafbeelding',
    },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Poort {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Poort {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Gereserveerd bereik {desde}-{hasta} (omvat {puerto})',
      ca_vencida: 'De CA is {dias} dagen geleden verlopen',
      ca_por_vencer: 'De CA verloopt over {dias} dagen',
      certificado_vencido: 'Het certificaat voor {dominio} is {dias} dagen geleden verlopen',
      certificado_por_vencer: 'Het certificaat voor {dominio} verloopt over {dias} dagen',
      firefox_perfiles: 'Firefox-profielen zonder vertrouwen:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (geopend)',
      firefox_perfil_fuera: '{perfil} (buiten de Firefox-map)',
      hosts_ilegible: '{ruta}: kon niet worden gelezen ({motivo})',
      hosts_codificacion: '{ruta}: codering {codificacion}',
      hosts_bloques: '{ruta}: {bloques} blokken van WolfCore Dev',
      hosts_sin_cierre: '{ruta}: een blok van WolfCore Dev heeft geen sluitmarkering',
      hosts_faltan: 'Ontbreken in hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: kenmerk alleen-lezen',
      path_repetidas: 'Herhaald: {entradas}',
      path_delante: '{entrada} staat vóór de hulpmiddelen van WolfCore Dev en bevat ook {programa}',
      antivirus_sin_leer:
        'De antivirus is actief; de uitsluitingen ervan konden niet worden gelezen (beheerder nodig).',
      antivirus_sin_exclusion:
        'De antivirus is actief en de gegevensmap van WolfCore Dev is niet uitgesloten.',
      enlazador_ausente: 'De C++-hulpmiddelen van Visual Studio Build Tools zijn niet gevonden.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) is niet geïnstalleerd.',
      firewall_no_comprobado:
        'De firewallregels konden niet worden gelezen (mogelijk is een beheerder nodig).',
      firewall_reglas: 'WolfCore Dev: {propias} · Restanten van WolfCore-tests: {pruebas}',
      firewall_acotadas: 'Regels beperkt tot het lokale netwerk:',
      firewall_ajenas: "Regels van andere programma's:",
      firewall_quitadas: 'Verwijderde regels die kunnen worden hersteld:',
    },
    ver: 'Bekijken',
    verPuertos: 'Poorten bekijken',
    dialogo: {
      reglas: 'Betrokken regels: vink de regels uit die u niet wilt aanraken.',
      sinSeleccion: 'Vink minstens één regel aan om door te gaan.',
      reglasNota:
        'Er verandert niets zonder uw bevestiging en de beheerdersmachtiging. Als een regel is gewijzigd nadat hij werd getoond, wordt hij overgeslagen.',
    },
    reparaciones: {
      firewall:
        "Verwijder die inkomende firewallregels, één voor één en op hun exacte naam. Eerst wordt een kopie opgeslagen in de beveiligde registersleutel HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos zodat ze opnieuw kunnen worden aangemaakt. Regels van andere programma's worden nooit aangeraakt.",
      firewall_restaurar:
        "Maak de regels die u aanvinkt opnieuw aan, met hetzelfde programma, profiel, protocol, dezelfde poorten en adressen als getoond, vanuit de beveiligde kopie (niet vanuit het bestand in etc/). Die programma's kunnen dan weer netwerkverbindingen accepteren.",
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev start Maven rechtstreeks met de JDK en leest uit veiligheidsoverwegingen noch .mvn/jvm.config noch de variabele MAVEN_OPTS. Hebt u ze voor uw project nodig, voer Maven dan uit vanuit een terminal.',
    avisoRuby:
      'Ruby wordt geïnstalleerd zonder de Devkit (MSYS2) en zonder uw PATH of het Windows-register aan te raken: er is geen installatieprogramma. Gems met native extensies zonder voorgecompileerde binary hebben de Devkit nodig. Dit is een handmatige stap: open een terminal vanuit het project en voer "ridk install" uit (het installeert MSYS2 op uw computer en downloadt van internet).',
    avisoJdk:
      'Maven en Gradle draaien met een JDK van WolfCore Dev en er is nog geen geïnstalleerd. Installeer Java (Temurin) vanuit de lijst met diensten.',
    avisoMeilisearch:
      'Elke Meilisearch-minorversie heeft eigen gegevens. Als u overstapt op een andere minorversie (bijvoorbeeld van 1.58 naar 1.59), zijn de indexen en de MEILISEARCH_KEY nieuw: u moet opnieuw indexeren en de .env van uw projecten bijwerken.',
    servicios: {
      meilisearch: 'Meilisearch',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    anteriores: (n) => `Eerdere patches (${n})`,
  },
  memoria: {
    boton: 'Geheugen',
    tituloBoton: 'Geheugen optimaliseren',
    titulo: 'Geheugenoptimalisatie',
    intro:
      'Kies een modus en bekijk de lijst. Er wordt niets gesloten of gestopt voordat u bevestigt, en het draait nooit uit zichzelf.',
    modo: 'Modus',
    modos: {
      liviano: 'Licht',
      moderado: 'Gematigd',
      profundo: 'Diep',
    },
    descripciones: {
      liviano: 'Leegt de cache van de app. Maakt schijfruimte vrij; sluit of stopt niets.',
      moderado:
        'Biedt daarnaast aan om één PHP-worker over te houden en diensten van WolfCore Dev zonder activiteit of verbindingen te stoppen. Diensten staan standaard uitgevinkt.',
      profundo:
        "Toont daarnaast uw eigen geheugenvretende programma's, zodat u ze kunt vragen hun venster te sluiten. Ze staan standaard uitgevinkt.",
    },
    ver: 'Lijst tonen',
    revisando: 'Controleren…',
    vacio: 'In deze modus valt niets vrij te maken.',
    tipos: {
      'cache-app': 'Cache leegmaken',
      'reducir-pool': 'Eén worker overhouden',
      'detener-inactivo': 'Stoppen (inactief)',
      'cerrar-programa': 'Vragen het venster te sluiten',
    },
    caches: {
      sesion: 'HTTP-cache van de toepassingssessie',
    },
    estimado: (cantidad) => `Ongeveer ${cantidad} RAM zou worden vrijgemaakt`,
    estimadoDisco: (cantidad) => `Plus ongeveer ${cantidad} schijfruimte (de cache is geen RAM)`,
    marcadas: (n, total) => `${n} van ${total} aangevinkt`,
    sinDatos:
      'Er zijn nog niet genoeg activiteitsgegevens om aan te bieden diensten te stoppen of PHP te verkleinen. Laat Start enkele minuten open en kijk opnieuw.',
    listadoFallido:
      "De lijst met geopende programma's kon niet worden gelezen: deze lijst is mogelijk onvolledig. Probeer het opnieuw.",
    avisoDetener:
      'Inactieve diensten staan standaard uitgevinkt: wie er een stopt, kapt alles af wat het gebruikt. Alleen die zonder verbindingen op dit moment worden getoond.',
    avisoCerrar:
      "Programma's wordt alleen gevraagd hun venster te sluiten, als bij een klik op het kruisje: ze kunnen vragen of u wilt opslaan. Een programma wordt nooit geforceerd of beëindigd.",
    protegidos:
      "Systeemprogramma's, Windows-diensten, programma's met verhoogde rechten, andere gebruikers, FlyEnv, PhpWebStudy en WolfCore Dev (of alles wat ze starten) verschijnen nooit.",
    aplicar: 'Aangevinkte toepassen',
    confirmarTitulo: 'Deze acties toepassen?',
    confirmarTexto: (n) =>
      n === 1
        ? '1 actie uit de lijst wordt uitgevoerd.'
        : `${n} acties uit de lijst worden uitgevoerd.`,
    confirmarCerrar: (nombres) =>
      `Deze programma's wordt gevraagd hun venster te sluiten: ${nombres}.`,
    confirmarDetener: (nombres) => `Deze diensten worden gestopt: ${nombres}.`,
    confirmar: 'Ja, toepassen',
    cancelar: 'Annuleren',
    resultadoTitulo: 'Resultaat',
    liberado: (cantidad) => `Geschat: ongeveer ${cantidad} RAM vrijgemaakt`,
    liberadoDisco: (cantidad) => `Plus ongeveer ${cantidad} schijfruimte`,
    notaPedido:
      'Wacht op u: het venster is gevraagd te sluiten en het programma is nog open (mogelijk vraagt het of u wilt opslaan). Het telt niet als vrijgemaakt.',
    estados: {
      hecho: 'Klaar',
      pedido: 'Wacht op u',
      saltado: 'Overgeslagen',
      error: 'Mislukt',
    },
    motivos: {
      no_en_plan: 'Het stond niet in de lijst',
      protegido: 'Het is een beschermd programma',
      cambio: 'Het is gewijzigd sinds de lijst werd getoond',
      sin_ventana: 'Het heeft geen venster meer om te sluiten',
      ya_apagado: 'Er viel niets meer te verkleinen',
      ocupado: 'Het was bezig (het heeft verbindingen)',
      no_se_pudo:
        'Het sluitverzoek kon niet worden verzonden (het programma draait met verhoogde rechten)',
    },
    otraVez: 'Opnieuw beginnen',
  },
  guias: {
    tuneles: {
      titulo: 'Tunnelgids',
      copiar: 'Commando kopiëren',
    },
    http: {
      buscar: 'Zoeken op nummer, naam of tekst',
      familia: 'Familie',
      todas: 'Alle',
      verMetodos: 'Methoden',
      verCodigos: 'Statuscodes',
      resultados: (n) => `${n} ${n === 1 ? 'resultaat' : 'resultaten'}`,
      vacio: 'Niets komt overeen met de zoekopdracht.',
      seguro: 'Veilig',
      noSeguro: 'Niet veilig',
      idempotente: 'Idempotent',
      noIdempotente: 'Niet idempotent',
      noEstandar: 'Niet-standaard',
      broma: 'Grapcode (RFC 2324)',
      causas: 'Veelvoorkomende oorzaken',
      solucion: 'Hoe op te lossen',
      ejemplo: 'Voorbeeld',
      copiarEjemplo: 'Voorbeeld kopiëren',
      probar: 'Uitproberen',
      probarTitulo:
        'Probeer dit voorbeeld in de HTTP-client (er wordt niets verzonden totdat u op Verzenden drukt)',
      servidorActivo: (puerto) =>
        `Voorbeeldserver draait op 127.0.0.1:${puerto} zolang u de gids of de HTTP-client gebruikt. Hij is alleen bereikbaar vanaf deze computer en stopt wanneer u weggaat of na 10 min ongebruikt.`,
      sinTraduccion: 'Niet vertaald naar deze taal: weergegeven in het Engels.',
      familias: {
        '1xx': '1xx Informatief',
        '2xx': '2xx Geslaagd',
        '3xx': '3xx Omleiding',
        '4xx': '4xx Clientfout',
        '5xx': '5xx Serverfout',
      },
    },
    git: {
      buscar: 'Zoek een onderwerp of commando',
      verGuia: 'Gids',
      verLaboratorio: 'Lab',
      todos: 'Alle',
      grupos: {
        basico: 'De basis',
        ramas: 'Branches',
        deshacer: 'Ongedaan maken',
        remotos: 'Remotes en tags',
        github: 'GitHub',
      },
      resultados: (n) => `${n} ${n === 1 ? 'onderwerp' : 'onderwerpen'}`,
      vacio: 'Niets komt overeen met de zoekopdracht.',
      ejemplo: 'Voorbeeld',
      errores: 'Veelgemaakte fouten',
      copiarEjemplo: 'Voorbeeld kopiëren',
      peligroso: 'Gevaarlijk',
      sinTraduccion: 'Niet vertaald naar deze taal: weergegeven in het Engels.',
      avisoGithub:
        'Dit deel is alleen uitleg: WolfCore Dev maakt geen accounts aan, logt niet in bij GitHub en gebruikt geen tokens uit deze gids. De namen en waarden in de voorbeelden zijn verzonnen.',
      irLaboratorio: 'Oefenen in het lab',
      lab: {
        intro:
          'Een oefenrepository en een lokale "remote", in een map die van WolfCore Dev is. Er wordt geen internet of GitHub gebruikt en uw projecten en uw git-instellingen blijven onaangeroerd.',
        sinGit: {
          titulo: 'Git is niet geïnstalleerd',
          texto:
            'Het lab gebruikt de git van uw systeem en kan zonder niet openen. Installeer Git en open dit tabblad opnieuw; WolfCore Dev installeert niets voor u.',
        },
        cargando: 'Lab voorbereiden…',
        reiniciar: 'Lab resetten',
        reiniciarAyuda: 'Verwijdert alleen de oefenmap en zet hem terug als nieuw.',
        reiniciado: 'Lab gereset.',
        version: (v) => `git ${v}`,
        ordenes: "Commando's",
        mensaje: 'Commitbericht',
        mensajePorDefecto: 'Oefenwijziging',
        rama: 'Branch',
        etiqueta: 'Tag',
        archivo: 'Bestand',
        grupos: {
          basico: 'De basis',
          ramas: 'Branches',
          guardar: 'Opslaan en ongedaan maken',
          remoto: 'Lokale remote',
        },
        archivos: {
          titulo: 'Oefenbestanden',
          ayuda: 'Alleen deze bestanden kunnen worden bewerkt, met tekst van maximaal 2000 tekens.',
          guardar: 'Bestand opslaan',
          guardado: 'Bestand opgeslagen.',
          areaTexto: (n) => `Inhoud van ${n}`,
        },
        salida: 'Uitvoer',
        salidaVacia: 'Druk op een commando om hier het antwoord van git te zien.',
        codigo: (n) => (n === 0 ? 'Correct afgerond' : `Afgerond met code ${n}`),
        truncada: 'De uitvoer is ingekort.',
        historial: 'Geschiedenis',
        historialVacio: 'Er zijn nog geen commits: voer git init, git add en git commit uit.',
        conflicto: {
          titulo: 'Begeleide oefening: een conflict',
          intro:
            'Twee branches wijzigen dezelfde regel. U ziet hoe het conflict ontstaat en hoe u het oplost.',
          paso: (n, total) => `Stap ${n} van ${total}`,
          ejecutar: 'Deze stap uitvoeren',
          hecho: 'Klaar',
          reempezar: 'Opnieuw beginnen',
          esperado: 'Git meldde het conflict: dat is in deze stap te verwachten.',
          elegir: {
            mia: 'Die van main behouden (groen)',
            otra: 'Die van rama-a behouden (rood)',
            ambas: 'Beide behouden',
          },
          final: 'Klaar: u hebt een conflict opgelost. Bekijk de geschiedenis.',
          pasos: [
            {
              titulo: 'Het lab voorbereiden',
              texto:
                'Het lab wordt gereset en de eerste commit wordt gemaakt met colores.txt (“color: azul”).',
            },
            {
              titulo: 'De regel wijzigen op rama-a',
              texto:
                'De branch rama-a wordt aangemaakt, de regel wordt “color: rojo” en er wordt gecommit.',
            },
            {
              titulo: 'Dezelfde regel wijzigen op main',
              texto:
                'Er wordt teruggegaan naar main, de regel wordt “color: verde” en er wordt gecommit.',
            },
            {
              titulo: 'De merge proberen',
              texto:
                'rama-a wordt in main gemerged. Git kan niet kiezen welke regel blijft en laat een conflict achter.',
            },
            {
              titulo: 'Een versie kiezen',
              texto:
                'Kies welke versie van de regel blijft. colores.txt bevat nu de conflictmarkeringen.',
            },
            {
              titulo: 'De oplossing bevestigen',
              texto:
                'colores.txt wordt gestaged (add) en de commit die de merge afsluit wordt gemaakt.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `Een lichte editor met kleurmarkering voor tekstbestanden tot ${mb} MB. Kies het bestand in het systeemvenster; opslaan vraagt altijd om bevestiging en laat eerst een kopie achter in de gegevensmap van WolfCore Dev.`,
    abrir: 'Bestand openen…',
    abriendo: 'Openen…',
    guardar: 'Opslaan',
    guardando: 'Opslaan…',
    recargar: 'Opnieuw laden van schijf',
    vacio: 'Open een bestand om te beginnen met bewerken.',
    sinCambios: 'Geen wijzigingen',
    conCambios: 'Niet-opgeslagen wijzigingen',
    posicion: (linea, columna) => `Regel ${linea}, kolom ${columna}`,
    areaTexto: (nombre) => `Code-editor: ${nombre}`,
    salirTeclado: 'Om de editor met het toetsenbord te verlaten, drukt u op Esc en daarna op Tab.',
    guardado: 'Bestand opgeslagen.',
    copiaPrevia: (ruta) => `Back-upkopie: ${ruta}`,
    cancelar: 'Annuleren',
    enlaceDuro:
      'Dit bestand heeft meer dan één naam op schijf (een harde koppeling). Opslaan verbreekt die koppeling: de andere namen behouden de oude inhoud.',
    saltosMixtos: {
      aviso:
        'Dit bestand bevat gemengde regeleindes. Bij het opslaan worden ze allemaal genormaliseerd naar LF.',
      aceptar: 'Ik ga akkoord met het normaliseren van de regeleindes',
    },
    envGestor: {
      aviso:
        'De .env-bestanden worden bewerkt in de projectvariabelen, met hun stroom voor geheimen. De knop opent de .env in de hoofdmap van het project, wat mogelijk niet het bestand is dat u wilde openen.',
      boton: 'De .env in de hoofdmap van het project openen',
    },
    huellaPerdida:
      'Opgeslagen, maar de nieuwe vingerafdruk kon niet worden gelezen: het bestand is opnieuw geladen.',
    confirmarGuardar: {
      titulo: 'Wijzigingen opslaan',
      texto: (nombre) =>
        `${nombre} staat op het punt te worden geschreven. Eerst wordt een kopie van wat nu op schijf staat opgeslagen in de gegevensmap van WolfCore Dev.`,
      boton: 'Opslaan met back-upkopie',
    },
    refuerzo: {
      abrirTitulo: 'Gevoelig bestand',
      guardarTitulo: 'Een gevoelig bestand opslaan',
      secreto:
        'Dit bestand lijkt geheimen te bevatten (privésleutels, tokens of inloggegevens). De inhoud wordt op het scherm getoond.',
      datosReales:
        'Dit bestand hoort bij een site die als site met echte gegevens is gemarkeerd. Een verkeerde wijziging kan echte informatie beïnvloeden.',
      instruccion: (nombre) => `Typ om door te gaan de bestandsnaam: ${nombre}`,
      etiqueta: 'Bestandsnaam',
      abrirBoton: 'Toch openen',
      guardarBoton: 'Toch opslaan',
    },
    cambioExterno: {
      titulo: 'Het bestand is buiten de editor gewijzigd',
      texto:
        'Een ander programma heeft het gewijzigd sinds u het opende, dus er is niets opgeslagen. U kunt het opnieuw laden (uw wijzigingen gaan verloren) of overschrijven met wat u hier hebt.',
      recargar: 'Opnieuw laden en mijn wijzigingen verwerpen',
      sobrescribir: 'Overschrijven…',
      sobrescribirTitulo: 'Het bestand overschrijven',
      sobrescribirTexto:
        'De wijzigingen van het andere programma gaan verloren. De huidige inhoud blijft bewaard in de back-upkopie.',
      sobrescribirBoton: 'Ja, overschrijven',
      volver: 'Terug',
    },
    descartar: {
      titulo: 'Niet-opgeslagen wijzigingen',
      texto: 'Er zijn niet-opgeslagen wijzigingen in de editor. Als u doorgaat, gaan ze verloren.',
      confirmar: 'Wijzigingen verwerpen',
      seguir: 'Verder bewerken',
    },
    cm: {
      'Control character': 'Stuurteken',
      'Selection deleted': 'Selectie verwijderd',
      'Go to line': 'Ga naar regel',
      go: 'ga',
      Find: 'Zoeken',
      Replace: 'Vervangen',
      next: 'volgende',
      previous: 'vorige',
      all: 'alle',
      'match case': 'hoofdlettergevoelig',
      regexp: 'regexp',
      'by word': 'heel woord',
      replace: 'vervangen',
      'replace all': 'alles vervangen',
      close: 'sluiten',
      'current match': 'huidige overeenkomst',
      'on line': 'op regel',
      'replaced match on line $': 'overeenkomst vervangen op regel $',
      'replaced $ matches': '$ overeenkomsten vervangen',
      'folded code': 'ingeklapte code',
      unfold: 'uitklappen',
      to: 'tot',
    },
  },
  limpiezaDisco: {
    intro:
      'Eerst wordt geanalyseerd en getoond hoeveel elk item inneemt. Er wordt niets verwijderd totdat u bevestigt, en het draait nooit uit zichzelf of op de achtergrond.',
    analizar: 'Analyseren',
    analizando: 'Analyseren…',
    cancelarAnalisis: 'Annuleren',
    vacio: 'Er valt niets op te ruimen.',
    categorias: {
      temp: {
        nombre: 'Tijdelijke bestanden',
        ayuda:
          'Bestanden in uw TEMP-map die ouder zijn dan 24 uur. Definitief verwijderd; ze worden vanzelf opnieuw aangemaakt.',
      },
      'cache-chrome': {
        nombre: 'Cache van Google Chrome',
        ayuda:
          'Alleen de cachemappen van elk profiel; nooit cookies, wachtwoorden of geschiedenis.',
      },
      'cache-edge': {
        nombre: 'Cache van Microsoft Edge',
        ayuda:
          'Alleen de cachemappen van elk profiel; nooit cookies, wachtwoorden of geschiedenis.',
      },
      'cache-brave': {
        nombre: 'Cache van Brave',
        ayuda:
          'Alleen de cachemappen van elk profiel; nooit cookies, wachtwoorden of geschiedenis.',
      },
      'cache-firefox': {
        nombre: 'Cache van Firefox',
        ayuda: 'Alleen de map cache2 van elk profiel; nooit cookies, wachtwoorden of geschiedenis.',
      },
      'wolfcore-descargas': {
        nombre: 'Gecachte downloads van WolfCore Dev',
        ayuda: 'Losse archieven die niet meer worden gebruikt. Naar de prullenbak verplaatst.',
      },
      'wolfcore-registros': {
        nombre: 'Logboeken van WolfCore Dev',
        ayuda: 'Logboeken ouder dan 30 dagen. Naar de prullenbak verplaatst.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          'Optioneel. Windows maakt het opnieuw aan, maar WolfCore Dev moet als beheerder draaien.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Browser geopend of actief op de achtergrond: sluit hem volledig om zijn cache op te ruimen (in Edge ook de opstartversnelling en achtergrondextensies uitschakelen)',
      'requiere-admin': 'Vereist dat WolfCore Dev als beheerder draait',
      'ruta-vetada': 'Beschermd pad: niet opgeruimd',
      'temp-no-seguro':
        'De variabele TEMP wijst naar een map die niet de tijdelijke map van de gebruiker is (Documenten, een heel station, een netwerkpad…): niet opgeruimd',
    },
    borradoDefinitivo: 'Definitief verwijderd (ze worden vanzelf opnieuw aangemaakt)',
    borradoPapelera: 'Naar de prullenbak van het systeem verplaatst',
    archivos: (n) => (n === 1 ? '1 bestand' : `${n} bestanden`),
    carpetas: 'Per map',
    truncado: 'De analyse stopte bij de bestandslimiet: er is meer dan getoond.',
    marcadas: (n, t) => `${n} van ${t} categorieën geselecteerd`,
    total: (b) => `Ongeveer ${b} zou worden vrijgemaakt`,
    limpiar: 'Geselecteerde opruimen',
    confirmarTitulo: 'Deze categorieën opruimen?',
    confirmarTexto: (n) => `${n} categorieën worden opgeruimd.`,
    confirmarDefinitivo:
      'TEMP en caches worden definitief verwijderd (ze worden vanzelf opnieuw aangemaakt).',
    confirmarPapelera: 'Logboeken en downloads van WolfCore Dev gaan naar de prullenbak.',
    confirmarPrefetch:
      "Prefetch: Windows maakt het opnieuw aan, maar de eerste starts van programma's kunnen iets trager zijn.",
    confirmar: 'Ja, opruimen',
    cancelar: 'Annuleren',
    detener: 'Opruimen stoppen',
    resultadoTitulo: 'Resultaat',
    liberado: (b) => `Vrijgemaakt: ${b}`,
    enPapelera: (b) =>
      `Daarvan staat ${b} in de prullenbak (de ruimte komt vrij wanneer u hem leegt).`,
    saltados: (n) => `${n} bestanden zijn overgeslagen`,
    cancelado: 'Opruimen geannuleerd: wat al is verwijderd, blijft verwijderd.',
    topeEjecucion:
      'De bestandslimiet per uitvoering is bereikt: analyseer en ruim opnieuw op om door te gaan.',
    registroFallido:
      'Het opruimlogboek kon niet meer worden geschreven, dus het opruimen is gestopt: wat is verwijderd, staat tot dat punt in het logboek.',
    motivos: {
      'en-uso': 'In gebruik',
      enlace: 'Koppeling of reparsepunt (niet gevolgd)',
      protegido: 'Beschermd (.env, FlyEnv of vergelijkbaar)',
      cambio: 'Gewijzigd sinds de analyse',
      'sin-papelera': 'Geen prullenbak beschikbaar',
      ilegible: 'Kon niet worden gelezen',
      error: 'Fout bij het verwijderen',
    },
    verRegistros: 'Logboeken bekijken',
    registroEn: (r) => `Logboek van deze opruiming: ${r}`,
    otraVez: 'Opnieuw beginnen',
    protegidas:
      'Nooit aangeraakt: gegevens, back-ups, projecten, databases of .env-bestanden. Koppelingen worden niet gevolgd en er wordt niets buiten de paden in deze lijst aangeraakt.',
  },
  preferencias: {
    asistente: 'Welkomstrondleiding',
    asistenteAyuda:
      'Bekijk de rondleiding langs de belangrijkste schermen opnieuw: diensten, projecten, databases, hulpmiddelen en Doctor.',
    asistenteAbrir: 'Rondleiding bekijken',
    avanzadas: 'Geavanceerde secties tonen',
    avanzadasAyuda:
      'Voegt de zelden gebruikte schermen toe aan de zijbalk, zoals Containers. Ze zijn ook bereikbaar met Ctrl+K.',
  },
  paleta: {
    irAServicio: (nombre) => `Naar de dienst ${nombre}`,
    irAProyecto: (nombre) => `Naar het project ${nombre}`,
    versionesDe: (nombre) => `Versies van ${nombre}`,
    asistente: 'Welkomstrondleiding bekijken',
  },
  env: {
    bloques: {
      meilisearch: 'Meilisearch (met zijn sleutel)',
    },
  },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Nog geen database-engine',
      texto:
        'Installeer MySQL, MariaDB, PostgreSQL of MongoDB via Diensten om de databases van uw projecten aan te maken en te beheren.',
      accion: 'Naar Diensten',
    },
    serviciosVacio: {
      titulo: 'Nog geen diensten geïnstalleerd',
      texto:
        'Diensten (Nginx, PHP, databases…) laten uw sites draaien. Begin met Nginx en PHP, of met een database.',
      accion: 'Een dienst installeren',
    },
    registrosSinFuentes: {
      titulo: 'Nog geen logboeken',
      texto:
        'Logboeken verschijnen zodra een dienst, site of proces zijn eerste regel schrijft. Schakel een dienst in en kom terug.',
      accion: 'Naar Diensten',
    },
    registrosElegir: {
      titulo: 'Kies een logboek',
      texto: 'Kies hierboven in de keuzelijst een bron om de regels live te volgen.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Er zijn nog geen dumps binnengekomen',
      texto:
        'Wanneer een site dump(), dd() of wd() uitvoert, verschijnt de dump hier meteen. Open uw site en voer die code uit.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Vastleggen staat uit',
      texto:
        'Met vastleggen aan komen de dump()- en dd()-aanroepen van uw sites hier aan zonder de browser aan te raken. Schakel het in en start een site.',
      accion: 'Vastleggen inschakelen',
    },
    depuracionElegir: {
      titulo: 'Kies een dump',
      texto: 'Selecteer een dump uit de lijst om de inhoud, het bestand en de bron-URL te zien.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Geen fouten in de logboeken',
      texto:
        'Fouten van PHP, Nginx en projecten verschijnen hier gegroepeerd zodra ze worden geschreven. Een lege lijst is goed nieuws.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Kies een fout',
      texto:
        'Selecteer een fout uit de lijst om de trace te zien en het bestand in de editor te openen.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Er is nog geen controle uitgevoerd',
      texto:
        'Doctor controleert poorten, hosts, certificaten en versies en vertelt u hoe u oplost wat misgaat. Voer de eerste controle uit.',
      accion: 'Nu controleren',
    },
    doctorSinHallazgos: {
      titulo: 'Alles in orde',
      texto:
        'De laatste controle vond geen problemen. Controleer opnieuw als iets niet meer reageert.',
      accion: 'Opnieuw controleren',
    },
    contenedoresVacio: {
      titulo: 'Geen containers',
      texto:
        'De Docker- of Podman-containers van deze computer verschijnen hier. Maak er een aan met docker run of docker compose en druk op Vernieuwen.',
      accion: 'Vernieuwen',
    },
    avisos: {
      titulo: 'Geen meldingen',
      texto:
        'Uitgevallen diensten, bezette poorten en bijna verlopen certificaten verschijnen hier.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Nog geen momentopnamen',
      texto:
        'Een momentopname slaat de status van deze database op, zodat u terug kunt als er iets misgaat. Maak de eerste met de knop hierboven.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Deze server heeft geen eigen databases',
      texto: 'Maak een database voor uw project of importeer een bestaande dump.',
      accion: 'Database aanmaken',
    },
    iaNube: {
      titulo: 'Nog geen AI-providers',
      texto:
        'Met een provider (OpenAI, Anthropic, OpenRouter en andere) kunnen uw agents cloudmodellen gebruiken. De sleutel wordt versleuteld opgeslagen op deze computer.',
      accion: 'Provider toevoegen',
    },
    iaSinModelos: {
      titulo: 'Nog geen lokale modellen',
      texto: 'Download een model uit de lijst hieronder om het offline te gebruiken.',
      accion: '',
    },
    versiones: {
      titulo: 'Geen versies om te tonen',
      texto:
        'De lijst wordt gedownload uit de officiële catalogus. Controleer uw verbinding en vernieuw de lijst.',
      accion: 'Lijst vernieuwen',
    },
    buscar: {
      titulo: 'Geen overeenkomsten',
      texto:
        'Niets in de map komt overeen met uw zoekopdracht. Probeer andere woorden, schakel "Hoofdlettergevoelig" uit of controleer de bestandsfilters.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Welkomstrondleiding',
    saltar: 'Later',
    terminar: 'Aan de slag',
    cerrar: 'Rondleiding sluiten',
    reabrir: 'Druk op Esc om te verlaten. U kunt hem opnieuw bekijken via Instellingen › Weergave.',
    ir: (destino) => `Naar ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Welkom bij WolfCore Dev',
        texto:
          'Uw lokale ontwikkelomgeving in één venster: diensten, .test-sites met HTTPS, databases, e-mail en hulpmiddelen. Deze rondleiding duurt een minuut en wijzigt niets op uw computer.',
      },
      servicios: {
        titulo: 'Diensten',
        texto:
          'Schakel hier Nginx, PHP en de databases in met een schakelaar. Zijn ze nog niet geïnstalleerd, dan downloadt het tabblad Versies ze met een geverifieerde controlesom.',
      },
      proyectos: {
        titulo: 'Projecten',
        texto:
          'Maak een nieuw project aan of importeer een map of een repository. Elke site krijgt zijn eigen .test-adres met HTTPS.',
      },
      bases: {
        titulo: 'Databases',
        texto:
          'Maak databases aan, importeer en exporteer dumps en maak back-ups en herstel zonder de app te verlaten.',
      },
      herramientas: {
        titulo: 'Hulpmiddelen en Ctrl+K',
        texto:
          'Editor, zoeken, vergelijken, wachtwoorden, afbeeldingen en meer, gegroepeerd per sectie. Druk op elk scherm op Ctrl+K om direct naar te gaan wat u nodig hebt.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Controleert poorten, hosts, certificaten en versies en stelt voor hoe u oplost wat misgaat. Open hem wanneer iets niet reageert.',
      },
      listo: {
        titulo: 'Alles klaar',
        texto:
          'Begin met het inschakelen van een dienst of het aanmaken van uw eerste project. U kunt deze rondleiding opnieuw bekijken via Instellingen › Weergave.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v) =>
          `Het staat niet meer in de catalogus: in plaats daarvan wordt ${v} geïnstalleerd.`,
      },
      resultado: {
        sustituida: (v) => `${v} is geïnstalleerd in plaats van de versie van het profiel.`,
      },
    },
    motivos: {
      version_sustituida:
        'Die versie staat niet meer in de catalogus: de nieuwste van dezelfde minorversie (bijvoorbeeld 8.3) is geïnstalleerd.',
    },
  },
  consultasLentas: {
    boton: 'Trage queries',
    titulo: (motor) => `Trage queries op ${motor}`,
    descripcion:
      'De queries die langer duren dan de tijd die u kiest, van de langzaamste naar de snelste.',
    cargando: 'Trage queries laden…',
    estadoTitulo: 'Status van het logboek',
    estadoActivo: (s) => `Loggen staat aan: queries van meer dan ${s} s worden vastgelegd.`,
    estadoApagado: 'Loggen staat uit.',
    noGestionada:
      'WolfCore Dev beheert deze server niet (bijvoorbeeld een server die door een ander programma is gestart): u kunt hem hier alleen bekijken, niet wijzigen.',
    umbral: 'Queries vastleggen van meer dan (seconden)',
    activar: 'Loggen inschakelen',
    aplicarUmbral: 'Tijd wijzigen',
    desactivar: 'Loggen uitschakelen',
    actualizar: 'Logboek opnieuw lezen',
    confirmarTitulo: 'Loggen van trage queries wijzigen',
    confirmarActivar: (motor, s) =>
      `Loggen wordt ingeschakeld voor de hele ${motor}-server (queries van meer dan ${s} s) en opgeslagen in zijn configuratie. Het geldt voor al zijn databases.`,
    confirmarDesactivar: (motor) =>
      `Loggen wordt uitgeschakeld voor de hele ${motor}-server en opgeslagen in zijn configuratie. Wat al is vastgelegd, blijft bewaard.`,
    confirmarBoton: 'Wijziging bevestigen',
    cancelar: 'Annuleren',
    activado: 'Loggen van trage queries ingeschakeld',
    desactivado: 'Loggen van trage queries uitgeschakeld',
    privacidad:
      'De SQL wordt getoond met zijn waarden vervangen door "?", omdat hij echte klantgegevens kan bevatten. Niets hiervan verlaat deze computer of wordt in de toepassingslogboeken geschreven.',
    columnas: {
      duracion: 'Duur',
      filas: 'Onderzochte rijen',
      base: 'Database',
      fecha: 'Datum',
      sql: 'Query',
      acciones: 'Acties',
    },
    sinBase: 'Niet toegewezen',
    verLiteral: 'Letterlijke tekst tonen',
    ocultarLiteral: 'Letterlijke tekst verbergen',
    literalAviso: 'SQL zoals hij is, met zijn waarden',
    sqlOculto: 'SQL verborgen',
    sqlOcultoAyuda:
      'Deze query kan niet worden getoond zonder echte gegevens in gevaar te brengen: deze server heeft databases met echte gegevens of de query kan niet veilig aan een database worden toegewezen.',
    copiar: 'Kopiëren',
    copiado: 'Query gekopieerd',
    truncado: (n) =>
      `Er worden hoogstens de ${n} langzaamste queries uit het einde van het logboek (de laatste 5 MB) getoond.`,
    vacioTitulo: 'Nog geen trage queries vastgelegd',
    vacioTextoApagado:
      'Schakel loggen in en gebruik uw sites: queries die langer duren dan de gekozen tijd verschijnen hier.',
    vacioTextoActivo:
      'Tot nu toe heeft geen query de gekozen tijd overschreden. Gebruik uw sites en lees het logboek opnieuw.',
  },
  esquemaBd: {
    boton: 'Schema bekijken',
    titulo: (base) => `Schema van ${base}`,
    descripcion:
      'Alleen-lezen: tabellen, kolommen, sleutels en relaties. Er worden geen gegevens uit uw tabellen gelezen.',
    cargando: 'Schema lezen…',
    error: 'Het databaseschema kon niet worden gelezen.',
    reintentar: 'Opnieuw proberen',
    buscar: 'Een tabel zoeken',
    tablas: (n) => plural(n, 'tabel', 'tabellen'),
    vista: 'view',
    truncado: (n) => `De lijst is ingekort tot ${n} tabellen: de database heeft er meer.`,
    sinResultados: 'Geen tabel komt overeen met de zoekopdracht.',
    elegir: 'Kies een tabel uit de lijst om de kolommen, sleutels en relaties te zien.',
    columnas: 'Kolommen',
    indices: 'Indexen',
    sinIndices: 'Deze tabel heeft geen indexen.',
    relaciones: 'Relaties',
    sinRelaciones: 'Deze tabel heeft geen relaties met andere.',
    salientes: 'Verwijst naar',
    entrantes: 'Waarnaar wordt verwezen door',
    alBorrar: 'Bij verwijderen:',
    alActualizar: 'Bij bijwerken:',
    irA: (tabla) => `Naar tabel ${tabla}`,
    col: {
      nombre: 'Kolom',
      tipo: 'Type',
      nulo: 'Nullable',
      defecto: 'Standaard',
      clave: 'Sleutel',
    },
    si: 'Ja',
    no: 'Nee',
    pk: 'PK',
    unico: 'uniek',
    vacioTitulo: 'Deze database heeft geen tabellen',
    vacioTexto:
      'Wanneer u tabellen aanmaakt (bijvoorbeeld met de migraties van uw project), verschijnen ze hier.',
  },
};
