import type { TextosParciales } from '../es';

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
const plural = (n: number, uno: string, molti: string): string => `${n} ${n === 1 ? uno : molti}`;

export const itExtra: TextosParciales = {
  app: {
    lema: 'Il suo stack locale, pronto per lavorare',
  },
  resumenGlobal: {
    cortoApagado: 'Tutto spento',
    cortoEncendidos: (n) => `${n} attivi`,
    cortoErrores: (n) => plural(n, 'con errore', 'con errori'),
    cortoCargando: 'Connessione…',
    cortoSinConexion: 'Offline',
    irAServicios: 'Apri Servizi',
  },
  acciones: {
    copiarCompleto: 'Copia il testo completo',
  },
  errores: {
    codigos: {
      'servicios.no_encendio':
        '{nombre} non è riuscito ad avviarsi. Controlli Servizi e i relativi log.',
      'tuneles.sitio_no_confiable':
        '{dominio} non è ancora attendibile: nel progetto selezioni «Mi fido di questo repository» prima di pubblicarlo.',
      'clientehttp.peticion_invalida': 'Dati non validi nella richiesta: {campo}.',
      'clientehttp.variable_sin_definir':
        "La variabile «{nombre}» non è definita nell'ambiente attivo.",
      'clientehttp.secreto_faltante':
        "Manca un valore segreto memorizzato: lo digiti di nuovo e salvi la richiesta o l'ambiente.",
      'clientehttp.secreto_no_guardado':
        'Non è stato possibile memorizzare un valore segreto: non può contenere a capo né superare 16 KB, e la cifratura del sistema deve essere disponibile.',
      'clientehttp.url_invalida': "L'URL non è valido.",
      'clientehttp.url_con_credenciales':
        "L'URL non può contenere utente o password: usi la scheda di autenticazione.",
      'clientehttp.protocolo': 'Sono accettati solo URL http:// e https://.',
      'clientehttp.cabecera_invalida': "L'intestazione «{nombre}» non è valida.",
      'clientehttp.cuerpo_grande': 'Il corpo della richiesta supera 1 MB.',
      'clientehttp.plazo': 'La richiesta ha superato il timeout di {segundos} s.',
      'clientehttp.cancelado': 'Richiesta annullata.',
      'clientehttp.sin_conexion':
        "Impossibile connettersi ({motivo}). Controlli l'indirizzo, la porta e che il server sia in esecuzione.",
      'clientehttp.certificado':
        'Non è stato possibile verificare il certificato del server ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Più di {max} reindirizzamenti consecutivi.',
      'clientehttp.curl_invalido': 'Il testo non è un comando curl valido.',
      'clientehttp.curl_grande': 'Il testo curl è troppo grande (64 KB al massimo).',
      'clientehttp.no_existe': "L'elemento non esiste più.",
      'clientehttp.limite': 'È stato raggiunto il limite di elementi memorizzati.',
      'ejemplohttp.no_arranca': 'Non è stato possibile avviare il server di esempio.',
      'laboratoriogit.sin_git': 'Git non è installato su questo computer.',
      'laboratoriogit.orden_invalida': "Quel comando non è nell'elenco del laboratorio.",
      'laboratoriogit.nombre_invalido':
        'Il nome può contenere solo lettere, numeri, trattini e trattini bassi (fino a 30 caratteri).',
      'laboratoriogit.mensaje_invalido':
        'Il messaggio deve essere di una sola riga, di massimo 200 caratteri, e non iniziare con «-».',
      'laboratoriogit.archivo_invalido': 'Quel file non è uno dei file di pratica.',
      'laboratoriogit.contenido_invalido':
        'Il contenuto deve essere testo di massimo 2000 caratteri.',
      'laboratoriogit.ruta_insegura':
        'La cartella del laboratorio non è quella prevista, quindi non viene toccata.',
      'laboratoriogit.fallo_sistema':
        'Il sistema non ha consentito di preparare o usare la cartella del laboratorio. Provi «Reimposta laboratorio».',
      'buscar.ruta_vetada': 'Quella cartella contiene dati di WolfCore Dev: non viene cercata.',
      'buscar.resultado_caducado': 'Quel risultato non è più disponibile: cerchi di nuovo.',
      'buscar.resultado_invalido': 'Quel risultato non può essere aperto.',
      'diff.raiz_invalida': 'Scelga due cartelle esistenti che non siano collegamenti.',
      'diff.ruta_vetada': 'Quella cartella contiene dati di WolfCore Dev: non viene confrontata.',
      'diff.cancelado': 'Confronto annullato.',
      'diff.plazo': 'Il confronto ha richiesto più di {segundos} s ed è stato annullato.',
      'diff.memoria': 'Il confronto richiede troppa memoria (oltre {maximo}) ed è stato annullato.',
      'diff.ocupado': 'Un confronto è già in corso: lo annulli o attenda.',
      'diff.caducado': 'Quel confronto non è più disponibile: confronti di nuovo.',
      'diff.archivo_invalido':
        'Quel file non può più essere confrontato: è cambiato o è scomparso.',
      'diff.fallo': 'Il confronto non è riuscito.',
      'compartir.confirmacion_requerida':
        'La condivisione su internet deve essere confermata nella finestra di WolfCore Dev.',
      'compartir.ocupado': 'Qualcosa è già condiviso: interrompa prima la condivisione.',
      'compartir.ruta_invalida': 'Scelga una cartella o un file esistente.',
      'compartir.duracion_invalida': 'Scelga 15 minuti, 1 ora o 4 ore.',
      'compartir.proveedor_invalido': 'Quel tunnel non è supportato: usi Cloudflare o ngrok.',
      'compartir.raiz_unidad':
        "La radice di un'unità non viene condivisa. Scelga una cartella al suo interno.",
      'compartir.carpeta_usuario':
        "L'intera cartella personale (o una che la contenga) non viene condivisa. Scelga una sottocartella.",
      'compartir.carpeta_datos': 'La cartella dei dati di WolfCore Dev non viene condivisa.',
      'compartir.sitio_datos_reales':
        'Un sito con dati reali (o qualsiasi cosa al suo interno) non viene condiviso.',
      'compartir.carpeta_secretos':
        'Quella cartella contiene chiavi (.ssh, .aws, .git…) e non viene condivisa.',
      'compartir.carpeta_sistema': 'Le cartelle di sistema non vengono condivise.',
      'compartir.archivo_sensible':
        'Quel file sembra contenere un segreto o dati reali e non viene condiviso.',
      'compartir.carpeta_perfil':
        "I dati dei programmi dell'utente (AppData, .claude, .config…) non vengono condivisi.",
      'compartir.archivo_grande':
        'Quel file è troppo grande per essere controllato e non è un file multimediale né un pacchetto: non viene condiviso.',
      'compartir.tunel_sin_url':
        'Il tunnel non ha fornito il suo indirizzo entro {segundos} s. Riprovi.',
      'compartir.tunel_cerrado': 'Il tunnel si è chiuso prima di finire di aprirsi.',
      'compartir.fallo': 'Impossibile condividere.',
      'disco.raiz_invalida': "Scelga una cartella o un'unità esistente e leggibile.",
      'disco.cancelado': 'Analisi annullata.',
      'info.ruta_invalida': 'Il percorso non è valido: deve essere assoluto e locale.',
      'info.no_existe': 'Il file o la cartella non esiste.',
      'info.enlace': 'È un collegamento: scelga il file o la cartella di destinazione.',
      'info.hash_grande': 'Il file supera {maximo} MB: gli hash non vengono calcolati.',
      'disco.plazo': "L'analisi ha richiesto più di {minutos} min ed è stata annullata.",
      'disco.memoria': "L'analisi richiede troppa memoria (oltre {maximo}).",
      'disco.ocupado': "Un'analisi è già in corso: la annulli o attenda.",
      'disco.caducado': "Quell'analisi non è più disponibile: analizzi di nuovo.",
      'disco.entrada_invalida': 'Quella cartella non esiste più o è cambiata: analizzi di nuovo.',
      'disco.fallo': "L'analisi non è riuscita.",
      'reverb.no_laravel': 'Reverb è disponibile solo nei progetti Laravel.',
      'reverb.no_confiado':
        'Selezioni «Mi fido di questo repository» nel progetto per attivare Reverb.',
      'reverb.sin_paquete':
        'Manca il pacchetto laravel/reverb: lo installi con composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Confermi di voler attivare Reverb.',
      'reverb.sin_activar': 'Attivi prima Reverb nel progetto.',
      'env.meilisearch_no_disponible': 'Meilisearch non è installato: lo installi in Servizi.',
      'bd.lentas_confirmar':
        "Modificare la registrazione delle query lente riguarda l'intero server: va confermato. Non è stato modificato nulla.",
      'bd.lentas_umbral_invalido': 'Il tempo deve essere compreso tra 0,1 e 60 secondi.',
      'bd.lentas_motor_no_soportado':
        'Le query lente si possono modificare solo su MySQL, MariaDB e PostgreSQL gestiti da WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        "L'SQL non viene mostrato con i suoi valori: il database contiene dati reali oppure la query non può essere attribuita a un database noto.",
      'bd.lentas_entrada_no_existe': 'Quella query non è più nel log. La legga di nuovo.',
      'bd.lentas_fallo':
        'Non è stato possibile leggere o modificare il log delle query lente. Controlli che il server sia in esecuzione.',
      'bd.esquema_base_no_existe': 'Il database non esiste su quel server.',
      'bd.esquema_motor_no_soportado':
        'Il visualizzatore dello schema è per MySQL, MariaDB e PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Non è stato possibile leggere lo schema del database. Controlli che il server sia in esecuzione.',
      'captura.atajo_invalido':
        'Quella scorciatoia non è valida: usi Ctrl, Alt, Maiusc o Super con una lettera, un numero o un tasto F.',
      'captura.atajo_no_permitido':
        'Quella scorciatoia non è consentita: usi Ctrl o Super con un altro modificatore (Ctrl+Alt senza Maiusc è AltGr e impedisce di scrivere @) ed eviti scorciatoie comuni come Ctrl+C o Alt+F4.',
      'captura.atajo_ocupado': 'La scorciatoia {atajo} è già usata da un altro programma.',
      'captura.no_disponible': "L'acquisizione dello schermo non è disponibile su questo computer.",
      'captura.permiso_denegado': "Manca l'autorizzazione per la registrazione dello schermo.",
      'captura.sin_imagen': "Non c'è nessuna immagine da acquisire.",
      'captura.imagen_invalida': "L'immagine acquisita non è valida.",
      'disco.sin_confirmar': 'Confermi la pulizia nella finestra di dialogo prima di continuare.',
      'disco.categoria_invalida': 'Quella categoria di pulizia non esiste.',
      'disco.ruta_vetada':
        'La categoria tocca un percorso protetto (dati, backup, progetti o FlyEnv): non è stato pulito nulla.',
      'disco.sin_analisis': "Analizzi di nuovo prima di pulire: l'analisi è scaduta o manca.",
      'disco.ocupada': "Un'analisi o una pulizia è già in corso.",
      'disco.sin_registro':
        'Non è stato possibile creare il registro della pulizia: non è stato eliminato nulla.',
      'editor.sin_confirmar': 'Confermi il salvataggio prima di continuare.',
      'editor.confirmacion_reforzada':
        'Questo file sembra contenere segreti o appartenere a un sito con dati reali: confermi con la verifica aggiuntiva per salvarlo.',
      'editor.ruta_invalida': 'Il percorso del file non è valido.',
      'editor.no_existe': 'Il file non esiste.',
      'editor.no_regular': 'È possibile modificare solo file normali.',
      'editor.ruta_vetada':
        "Quel file si trova nella cartella dei dati di WolfCore Dev: non può essere aperto né salvato dall'editor.",
      'editor.archivo_env':
        "I file .env si gestiscono dalle variabili del progetto, non dall'editor.",
      'editor.demasiado_grande': "Il file è troppo grande per l'editor (massimo {maximo}).",
      'editor.binario': 'Il file non è testo (è binario): non può essere modificato qui.',
      'editor.codificacion': "Il file non è UTF-8: l'editor non lo apre per non danneggiarlo.",
      'editor.no_abierto':
        "Quel file non è stato aperto nell'editor (o la sua versione è cambiata): lo apra di nuovo.",
      'editor.eol_mixto':
        'Il file mescola diversi tipi di fine riga: confermi la normalizzazione per salvare.',
      'editor.contenido_invalido': 'Il contenuto non è un testo valido.',
      'editor.huella_invalida': "Manca l'impronta del file aperto: lo apra di nuovo.",
      'editor.archivo_cambiado':
        "Il file è stato modificato fuori dall'editor dopo l'apertura. Lo ricarichi o confermi la sovrascrittura.",
      'editor.copia_fallo':
        'Non è stato possibile creare la copia di backup ({codigo}): non è stato salvato nulla.',
      'editor.lectura_fallo': 'Non è stato possibile leggere il file ({codigo}).',
      'editor.escritura_fallo':
        "Non è stato possibile salvare il file ({codigo}). L'originale non è stato toccato.",
      'memoria.sin_confirmar': "Confermi l'azione nella finestra di dialogo prima di continuare.",
      'memoria.modo_invalido': 'Quella modalità di ottimizzazione non esiste.',
      'memoria.plan_caducado':
        "L'elenco è scaduto o non è più quello attuale. Lo mostri di nuovo prima di applicare.",
      'memoria.no_disponible':
        "L'ottimizzatore della memoria non è disponibile qui o non ha potuto leggere il sistema.",
      'conversor.ocupado':
        "Una conversione è già in corso e un'altra è in attesa: attenda che termini.",
      'doctor.firewall_reglas_acotadas':
        "Ci sono {cantidad} regole per programmi di WolfCore Dev limitate alla rete locale (solo profilo privato, sottorete locale e porte specifiche), come quelle che l'app stessa consiglia per condividere un sito. Vengono solo mostrate: da qui non vengono rimosse.",
      'doctor.firewall_almacen_inseguro':
        'La copia protetta delle regole non è affidabile (permessi o contenuto diversi da quanto mostrato): non è stata creata né modificata alcuna regola.',
      'doctor.firewall_quitadas':
        'WolfCore Dev ha rimosso in precedenza {cantidad} regole del firewall e ne ha conservato una copia: può ricrearle se ne ha bisogno.',
      'doctor.firewall_parcial':
        "Alcune regole sono state rimosse, altre no: sono cambiate dopo aver mostrato l'elenco, non erano di WolfCore Dev oppure Windows non le ha lasciate andare. Controlli l'elenco.",
      'doctor.firewall_sin_cambios':
        'Non è stata modificata alcuna regola: non corrispondono più a quanto mostrato oppure non è stato possibile modificarle.',
      'doctor.firewall_registro_fallido':
        'Non è stato possibile salvare la copia delle regole nella chiave di registro protetta HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos: non è stato modificato nulla.',
      'catalogo.paquete_invalido':
        'Il pacchetto scaricato non è sicuro (percorsi fuori dalla cartella, collegamenti o dimensioni eccessive).',
      'catalogo.extraccion_fallo':
        'Non è stato possibile leggere o estrarre il pacchetto .7z scaricato.',
      'runtimes.falta_runtime':
        '{nombre} non è installato per questo progetto: lo installi da Servizi.',
      'runtimes.falta_jdk':
        'Per questo progetto non è installato alcun JDK: installi Java da Servizi.',
      'runtimes.instalacion_incompleta':
        "L'installazione di {nombre} è incompleta: la reinstalli da Servizi.",
      'procesos.escucha_publica':
        'Il processo è in ascolto su {direccion}:{puerto} ({programa}), aperto alla rete. È stato arrestato: può restare in ascolto solo su 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'Il processo è in ascolto su {direccion}:{puerto} ({programa}), aperto alla rete. È stato arrestato: può restare in ascolto solo su 127.0.0.1. Si tratta di Spring DevTools LiveReload: lo disattivi con spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        "Il processo è in ascolto su {direccion}:{puerto} ({programa}), aperto alla rete. È stato arrestato: può restare in ascolto solo su 127.0.0.1. Si tratta dell'inspector di Node: usi --inspect=127.0.0.1.",
    },
  },
  inicio: {
    servicios: {
      irA: (nombre) => `Vai al servizio ${nombre}`,
    },
    tuneles: {
      irA: (nombre) => `Vai al progetto ${nombre}`,
    },
  },
  servicios: {
    sinParaEncender: 'Non ci sono servizi installati da avviare',
    franjaExternos: {
      texto:
        'Non ha ancora installato il server web o PHP. Sono stati rilevati automaticamente motori esterni.',
      accion: 'Installa Nginx e PHP',
    },
    externos: {
      titulo: 'Rilevati sul suo computer',
      ayuda: 'Li gestisce un altro programma; WolfCore Dev si limita a mostrarli.',
    },
    borrarDatos: {
      que: {
        meilisearch: 'tutti gli indici di Meilisearch',
      },
    },
    ftp: {
      redLocalAyuda:
        'Se disattivato, può connettersi solo questo computer (127.0.0.1). Ogni progetto abilita il proprio accesso in Progetti.',
      compartir: {
        enlace: 'Condividi cartella o file…',
        ayuda:
          'FTP non si condivide tramite tunnel: non è cifrato e il tunnel trasporta solo HTTP. Per pubblicare qualcosa su internet usi «Condividi cartella o file» (HTTP, sola lettura); FTP resta nella rete locale.',
      },
    },
    datosConexion: 'Dati di connessione',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Connessione a Meilisearch',
      notaMeilisearch:
        "Per usarlo in un progetto: Variabili (.env) → Aggiungi un blocco → Meilisearch. Viene mostrata un'anteprima con la chiave mascherata ed è richiesta una conferma. La chiave appartiene solo a questo computer.",
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Ricerca per Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (porta locale)',
      springboot: 'Spring Boot (porta locale)',
      aspnet: 'ASP.NET Core (porta locale)',
    },
    tiposCortos: {
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    },
  },
  tunel: {
    sinConfianza:
      'Questo progetto non è attendibile: selezioni «Mi fido di questo repository» per poterlo pubblicare.',
  },
  tuneles: {
    irAProyectos: 'Vai a Progetti',
    compartir: {
      enlace: 'Condividi cartella o file…',
      ayuda: 'Pubblica una cartella o un singolo file (sola lettura), senza bisogno di un sito.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Il processo Reverb di questo progetto non ha il comando di WolfCore Dev (altro host, programma o porta). Attivandolo viene sostituito con quello standard, che resta in ascolto solo su 127.0.0.1.',
    ayuda: 'Laravel WebSockets, solo su 127.0.0.1.',
    puerto: (p) => `Porta ${p}`,
    interruptor: (dominio) => `Attiva o disattiva Reverb per ${dominio}`,
    activarTitulo: 'Attivare Reverb?',
    activarTexto: (dominio) =>
      `«php artisan reverb:start» verrà eseguito in ${dominio}, in ascolto solo su 127.0.0.1 su una porta libera. Il codice del progetto viene eseguito con il suo PHP.`,
    desactivarTitulo: 'Disattivare Reverb?',
    desactivarTexto:
      'Il processo si arresta e viene rimosso dal progetto. Le variabili REVERB_* in .env non vengono toccate.',
    activar: 'Attiva',
    desactivar: 'Disattiva',
    proponer: 'Suggerisci variabili REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Arrestato',
      iniciando: 'Avvio in corso',
      encendido: 'In esecuzione',
      error: 'Non riuscito',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP è solo per la rete locale: non si condivide tramite un tunnel internet perché invia password e file senza cifratura.',
    compartirIr: 'Condividi una cartella o un file con un link temporaneo',
  },
  ia: {
    pestanas: {
      etiqueta: 'Sezioni IA',
      agentes: 'Agenti',
      nube: 'Cloud',
      local: 'Modelli locali',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram:
        'Per il suo computer: modelli fino a ≈{b}B, che entrano nella memoria della scheda grafica.',
      sugerenciaRam: 'Per il suo computer: modelli fino a ≈{b}B, che girano nella RAM.',
      sugerenciaPequena: 'Per il suo computer: solo modelli molto piccoli (meno di 1B).',
      sugerenciaDesconocida:
        'Non è stato possibile leggere l’hardware del suo computer, quindi non c’è alcun consiglio.',
      aviso: 'È solo un’indicazione: può scaricare qualsiasi modello.',
      comprobando: 'Verifica del suo computer in corso…',
      niveles: {
        recomendado: 'Consigliato',
        lento: 'Potrebbe essere lento',
        'no-cabe': 'Non entra',
        desconocido: 'Nessun dato',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Entra comodamente nella memoria della scheda grafica (richiede ≈{necesario} su {disponible}).',
        'justo-vram':
          'Entra nella scheda grafica, ma appena (richiede ≈{necesario} su {disponible}).',
        'solo-ram':
          'Non entra nella scheda grafica e girerà nella RAM (richiede ≈{necesario} su {disponible} utilizzabili): più lento.',
        'cabe-ram':
          'Entra comodamente nella RAM (richiede ≈{necesario} su {disponible} utilizzabili).',
        'ram-justo':
          'Entra nella RAM, ma appena (richiede ≈{necesario} su {disponible} utilizzabili): potrebbe essere lento.',
        'sin-memoria':
          'Richiede ≈{necesario} di memoria e il suo computer dispone di ≈{disponible}.',
        'sin-disco':
          'Non c’è abbastanza spazio libero su disco per scaricarlo (restano {disponible}).',
        'tamano-desconocido':
          'Non è stato possibile consultare la dimensione del modello (nessuna connessione al registro di Ollama).',
        'equipo-desconocido': 'Non è stato possibile leggere la memoria del suo computer.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'Può annullare il download in qualsiasi momento; ciò che è già stato scaricato viene scartato.',
      tamano: (t) => `Dimensione del download: ${t}.`,
      tamanoDesconocido:
        'Non è stato possibile verificare la dimensione (nessuna connessione al registro di Ollama). I modelli pesano di solito da 1 a oltre 40 GB.',
      libre: (l) => `Spazio libero sul disco dei modelli: ${l}.`,
      libreDesconocido: 'Non è stato possibile misurare lo spazio libero su disco.',
      sinEspacio: (t, l) =>
        `Spazio insufficiente: il modello occupa ${t} e sono liberi solo ${l}. Liberi dello spazio o scelga un modello più piccolo.`,
    },
  },
  proyectos: {
    asistente: {
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    tarjeta: {
      verEnBases: 'Mostra in Database',
    },
  },
  panel: {
    insignias: {
      memoriaAlta: 'Memoria elevata',
    },
    discos: {
      titulo: 'Spazio su disco',
      leyendo: 'Lettura dei dischi…',
      sistema: 'Sistema',
      datos: 'Dati di WolfCore',
      ambos: 'Sistema e dati di WolfCore',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} liberi (${pct} %)`,
      poco: 'Poco spazio libero',
      casiLleno: 'Spazio quasi esaurito',
      liberar: 'Libera spazio',
      versiones: 'Pulisci le versioni inutilizzate',
      temporales: 'Pulisci file temporanei e cache di WolfCore',
      ocupaMas: 'Vedi cosa occupa più spazio',
    },
    alertas: {
      grupo: (n) => `Problemi rilevati (${n})`,
      verTodos: (n) => `Mostra tutti (${n})`,
      verMenos: 'Mostra meno',
      masAcciones: 'Altre azioni',
    },
    procesos: {
      resto: 'Altri servizi',
    },
  },
  captura: {
    barra: 'Strumenti di disegno',
    herramientas: {
      recuadro: 'Riquadro',
      flecha: 'Freccia',
      linea: 'Linea',
      resaltador: 'Evidenziatore',
      texto: 'Testo',
      pixelar: 'Pixelizza',
      pixelarAyuda: 'Pixelizza (non sicuro per dati sensibili: usi Nascondi)',
      ocultar: 'Nascondi',
      ocultarAyuda: 'Nascondi con un riempimento pieno (consigliato per dati sensibili)',
    },
    deshacer: 'Annulla',
    rehacer: 'Ripeti',
    copiar: 'Copia',
    copiarAyuda:
      'Copia negli appunti. Gli appunti di Windows possono conservarla nella cronologia o sincronizzarla con altri dispositivi.',
    guardar: 'Salva…',
    alConversor: 'Invia al convertitore di immagini',
    cerrar: 'Annulla (Esc)',
    nuevaSeleccion: 'Nuova selezione',
    color: 'Colore',
    grosor: 'Spessore',
    formato: 'Formato',
    cargando: "Preparazione dell'acquisizione…",
    guiaRegion: "Trascini per scegliere l'area. Esc annulla.",
    guiaVentana: 'Scelga la finestra da acquisire. Esc annulla.',
    sinVentanas: 'Non ci sono finestre che si possano acquisire.',
    textoPlaceholder: 'Scriva e prema Invio',
    copiada: 'Copiata negli appunti',
    guardada: (archivo) => `Salvata in ${archivo}`,
    errorCargar: "Non è stato possibile aprire l'acquisizione.",
    errorCopiar: "Non è stato possibile copiare l'immagine.",
    errorGuardar: "Non è stato possibile salvare l'immagine.",
    errorConversor: "Non è stato possibile inviare l'immagine al convertitore.",
    errorVentana: 'Non è stato possibile acquisire quella finestra.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        "Tutto avviene su questo computer: l'acquisizione non viene caricata su alcun servizio e non viene salvata su disco finché non la salva. Le finestre di WolfCore Dev si nascondono per un istante per non comparire nell'immagine.",
      region: 'Area',
      regionAyuda: "Trascini sullo schermo per scegliere l'area.",
      ventana: 'Finestra',
      ventanaAyuda: 'Scelga una delle finestre aperte.',
      pantalla: 'Schermo intero',
      pantallaAyuda: 'Lo schermo in cui si trova il cursore.',
      atajoActivo: (atajo) => `Scorciatoia globale attiva: ${atajo} (area).`,
      atajoInactivo: "Non c'è alcuna scorciatoia globale. La attivi in Impostazioni.",
      noDisponible: "L'acquisizione dello schermo non è disponibile su questo computer.",
      permisoDenegado:
        "Manca l'autorizzazione per la registrazione dello schermo. La attivi per WolfCore Dev nelle impostazioni di sistema.",
      ocupada: "Un'acquisizione è già in corso.",
    },
    ajustes: {
      titulo: 'Acquisizione schermo',
      descripcion:
        'Area, finestra o schermo intero con un editor rapido. È al 100% locale: nulla viene caricato o salvato finché non decide lei.',
      activar: 'Scorciatoia globale',
      activarAyuda:
        'Disattivata per impostazione predefinita. Se attivata, viene registrata solo se nessun altro programma la usa e viene rilasciata alla chiusura di WolfCore Dev.',
      atajo: 'Combinazione',
      grabar: 'Cambia',
      grabando: 'Prema la combinazione…',
      grabandoAyuda:
        'Usi Ctrl o Super con un altro modificatore (ad esempio Ctrl+Alt+Maiusc) e una lettera, un numero o un tasto F. Eviti scorciatoie comuni come Ctrl+C.',
      formato: 'Formato di salvataggio',
      activado: (atajo) => `Scorciatoia ${atajo} attivata.`,
      desactivado: 'Scorciatoia disattivata.',
      ocupado: (atajo) =>
        `La scorciatoia ${atajo} è già usata da un altro programma e non è stato modificato nulla. Provi un'altra combinazione.`,
      ocupadoInicio:
        "La scorciatoia salvata è già usata da un altro programma e non è stata registrata. Scelga un'altra combinazione.",
      sinPermiso:
        "Su macOS è necessaria l'autorizzazione per la registrazione dello schermo; verrà richiesta alla prima acquisizione.",
      formatoGuardado: 'Formato salvato.',
    },
  },
  herramientas: {
    entorno: {
      equipo: {
        titulo: 'Il mio computer',
        copiarResumen: 'Copia riepilogo',
        resumenCopiado: 'Riepilogo copiato',
        privacidad: 'Il riepilogo non include numeri di serie né identificatori univoci.',
        desconocido: 'sconosciuto',
        sinGpu: 'Nessuna rilevata',
        so: 'Sistema operativo',
        cpu: 'Processore',
        ram: 'Memoria RAM',
        gpu: 'Scheda grafica',
        placa: 'Scheda madre',
        disco: 'Disco {u}',
        compilacion: 'build {n}',
        nucleosHilos: '{n} core, {h} thread',
        ramDetalle: '{total} in totale, {libre} liberi',
        vram: '{v} di VRAM',
        discoDetalle: '{libre} liberi su {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Riepilogo del computer · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Riepilogo del computer · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: 'Trascini qui un file o una cartella per vederne le informazioni. Viene solo letto: non viene modificato nulla.',
      soltarEnVentana: 'Rilasci per vedere le informazioni',
      ruta: 'Percorso',
      mime: 'Tipo MIME',
      creado: 'Creato',
      accedido: 'Ultimo accesso',
      atributos: 'Attributi',
      soloLectura: 'Sola lettura',
      oculto: 'Nascosto',
      ninguno: 'Nessuno',
      dimensiones: 'Dimensioni',
      sensible: 'File sensibile: ne vengono mostrati i dati, mai il contenuto.',
      esArchivo: 'File',
      esCarpeta: 'Cartella',
      tamanoTotal: 'Dimensione totale',
      archivos: 'File',
      carpetas: 'Sottocartelle',
      analizando: 'Analisi della cartella…',
      cancelar: 'Annulla',
      cancelado: 'Analisi annullata.',
      abrirDisco: 'Apri in Utilizzo del disco',
      incompleto:
        'Alcuni elementi non sono stati conteggiati: collegamenti, accessi negati o cartelle troppo grandi.',
    },
    chmod: {
      permisos: 'Permessi',
      propietario: 'Proprietario',
      grupo: 'Gruppo',
      otros: 'Altri',
      leer: 'Lettura (r)',
      escribir: 'Scrittura (w)',
      ejecutar: 'Esecuzione (x)',
      especiales: 'Bit speciali',
      setuid: 'setuid: viene eseguito con i permessi del proprietario',
      setgid: 'setgid: viene eseguito con i permessi del gruppo',
      sticky: 'sticky: solo il proprietario può eliminare nella cartella',
      habituales: 'Valori comuni',
      octal: 'Ottale',
      simbolico: 'Simbolico',
      octalInvalido: 'Inserisca 3 o 4 cifre da 0 a 7 (per esempio 755).',
      simbolicoInvalido: 'Inserisca 9 caratteri come rwxr-xr-x.',
      ejemplo: 'Esempio',
      archivo: 'Nome del file',
      nota: 'Su Windows non si applica; serve per i server Linux e macOS.',
      avisoOtros:
        'Qualsiasi utente del server potrebbe modificarlo: eviti di dare scrittura a «altri».',
    },
    lista: {
      chmod: {
        nombre: 'Permessi chmod',
        descripcion: 'Caselle, ottale e simbolico, per server Linux e macOS.',
      },
      clienteHttp: {
        nombre: 'Client HTTP',
        descripcion: 'Provi le API: richieste, ambienti, raccolte e cronologia.',
      },
      captura: {
        nombre: 'Acquisizione schermo',
        descripcion: 'Area, finestra o schermo intero, con un editor rapido.',
      },
      guiaTuneles: {
        nombre: 'Guida ai tunnel',
        descripcion: 'Cloudflare e ngrok passo dopo passo, con comandi da copiare.',
      },
      guiaHttp: {
        nombre: 'Guida HTTP',
        descripcion: 'Codici di stato e metodi, con ricerca ed esempi.',
      },
      guiaGit: {
        nombre: 'Guida a Git e GitHub',
        descripcion: 'Comandi e flussi di lavoro, con un laboratorio per esercitarsi in sicurezza.',
      },
      limpiezaDisco: {
        nombre: 'Pulizia del disco',
        descripcion:
          'Analizza ed elimina file temporanei e cache rigenerabili, con anteprima e conferma.',
      },
      editor: {
        nombre: 'Editor di codice',
        descripcion:
          'Modifichi file di testo con evidenziazione, copia di backup e salvataggio confermato.',
      },
      compartir: {
        nombre: 'Condividi cartella o file',
        descripcion:
          'Pubblichi una cartella o un file su internet con un link temporaneo di sola lettura.',
      },
      usoDisco: {
        nombre: 'Utilizzo del disco',
        descripcion:
          "Cosa occupa spazio in un'unità o in una cartella: albero, file e cartelle più grandi, per estensione.",
      },
      diffCarpetas: {
        nombre: 'Confronto cartelle',
        descripcion:
          "Confronta due cartelle: solo in una, solo nell'altra e diversi, con il diff di ogni file.",
      },
      grabarPantalla: {
        nombre: 'Registra lo schermo',
        descripcion: 'Apre il registratore già incluso nel sistema.',
      },
    },
    secciones: {
      codigo: 'Codice',
      red: 'Rete',
      seguridad: 'Sicurezza',
      archivos: 'File e multimedia',
      sistema: 'Sistema',
    },
    tarjetas: {
      comparar: {
        nombre: 'Confronta',
        descripcion: 'Testi e cartelle: le differenze affiancate.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'Da un testo o un link, oppure perché altri possano collegarsi al suo Wi-Fi.',
      },
      guias: {
        nombre: 'Guide',
        descripcion: 'HTTP, tunnel e Git, con esempi e comandi da copiare.',
      },
    },
    pestanas: {
      diff: 'Testi',
      diffCarpetas: 'Cartelle',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunnel',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev non ha un registratore proprio: apre quello già incluso nel sistema. Il video viene salvato dove lo salva quello strumento.',
      abrir: 'Apri il registratore',
      abierta: "Strumento di cattura aperto. Scelga l'area dello schermo e prema Avvia.",
      noSePudo:
        'Non è stato possibile aprire lo Strumento di cattura da qui. Usi una delle scorciatoie della guida.',
      guiaTitulo: 'Come registrare sul suo sistema',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Prema Win + Maiusc + R per registrare con lo Strumento di cattura.',
            'Se il suo Strumento di cattura non è aggiornato, prema Win + Alt + R per registrare con la Xbox Game Bar.',
            'Interrompa la registrazione con il pulsante sulla barra che compare in alto.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Prema Cmd + Maiusc + 5 per aprire la barra di acquisizione.',
            "Scelga se registrare l'intero schermo o una parte selezionata.",
            'Prema Registra e, per terminare, il pulsante di stop nella barra dei menu.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Ogni desktop include un registratore: in GNOME, Ctrl + Alt + Maiusc + R; in KDE, Spectacle.',
            'Se non ne ha nessuno, installi OBS Studio o SimpleScreenRecorder dal suo gestore di pacchetti.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) =>
        detalle ? `Espressione non valida: ${detalle}` : 'Espressione non valida.',
      regexDetalle: {
        corchete: 'una parentesi quadra «[» non è chiusa.',
        parentesis: 'una parentesi tonda «(» non è chiusa.',
        parentesisSobra: 'una parentesi tonda di chiusura «)» non ha quella di apertura.',
        nadaQueRepetir: 'un quantificatore («*», «+», «?» o «{}») non ha nulla da ripetere.',
        barraAlFinal: 'il modello non può terminare con una barra rovesciata.',
        rangoInvertido: 'un intervallo in una classe di caratteri è invertito (ad esempio «z-a»).',
        cuantificador: 'il quantificatore «{}» è incompleto o i suoi numeri sono invertiti.',
        grupo: 'il nome o la forma di un gruppo non è valido.',
        escape: 'una sequenza di escape con barra rovesciata non è valida.',
      },
    },
    busqueda: {
      excluir: 'Salta anche (separati da virgole)',
      incluirPesadas: 'Includi cartelle pesanti (node_modules, vendor, .git…)',
      contexto: 'Righe di contesto',
      grupoNombres: (n) => `Per nome (${n})`,
      grupoContenido: (n) => `Per contenuto (${n})`,
      carpeta: 'cartella',
      listaAria: 'Risultati della ricerca',
      atajos:
        "↑ ↓ per spostarsi, Invio per aprire nell'editor, Esc per annullare o tornare al testo.",
      sensible: (n) =>
        `File sensibile: corrispondenza alla riga ${n} (il suo contenuto non viene mostrato).`,
      mostrarMas: (n) => `Mostra altri ${n}`,
      linea: (n) => `riga ${n}`,
      sinGrupo: 'Nessun risultato in questo gruppo.',
      topeBytes: 'È stato raggiunto il limite di lettura: restringa la ricerca.',
    },
    compartir: {
      explicacion:
        "Pubblica su internet una cartella o un file di questo computer con un link temporaneo. È di sola lettura: chiunque abbia il link può vedere e scaricare, ma non caricare né modificare nulla. Il link contiene un codice segreto, scade all'ora che sceglie e si chiude quando esce da WolfCore Dev. I file .env, le chiavi, la cartella .git e i siti con dati reali non vengono mai condivisi.",
      eleccion: 'Cosa condividere',
      elegirCarpeta: 'Scegli cartella…',
      elegirArchivo: 'Scegli file…',
      elegido: 'Scelto',
      duracion: 'Interrompi la condivisione tra',
      duraciones: {
        m15: '15 minuti',
        h1: '1 ora',
        h4: '4 ore',
      },
      tunel: 'Tunnel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (rapido, senza account)',
        ngrok: 'ngrok (con il suo token)',
      },
      ngrokSinToken: 'ngrok richiede il suo token: lo salvi nelle opzioni del tunnel di un sito.',
      compartir: 'Condividi…',
      sinFtp: 'FTP non si condivide tramite tunnel: non è cifrato e il tunnel trasporta solo HTTP.',
      vacio: {
        titulo: 'Non è condiviso nulla',
        texto:
          'Scelga una cartella o un file per ottenere un link pubblico temporaneo. Non viene pubblicato nulla finché non lo conferma.',
      },
      grandes:
        "I file di testo o di tipo sconosciuto superiori a 8 MB non vengono condivisi, perché non si possono controllare completamente; le immagini, l'audio, i video e i pacchetti (zip, 7z, gz, pdf) sì. Compaiono contrassegnati nell'elenco.",
      comprimidos:
        "Un file compresso (.zip, .7z, .gz) viene condiviso così com'è, senza guardare al suo interno: se contiene un file .env o chiavi, vengono pubblicati.",
      confirmar: {
        titulo: 'Condividi su internet',
        pregunta: 'Pubblicare questo su internet?',
        rutaReal: 'Percorso reale (collegamenti risolti)',
        ruta: 'Percorso esatto',
        aviso: (dur) =>
          `Sarà pubblico su internet per ${dur} dal momento in cui il link è pronto. Chiunque abbia il link potrà vedere e scaricare ciò che viene condiviso.`,
        boton: 'Condividi su internet',
      },
      abriendo: 'Apertura del tunnel…',
      activa: 'Condivisione attiva',
      enlace: 'Link pubblico',
      copiar: 'Copia link',
      qr: 'Codice QR del link',
      vence: (hasta, restan) => `Scade alle ${hasta} (${restan})`,
      restan: (min) => (min <= 1 ? 'meno di 1 minuto' : `${min} min`),
      dejar: 'Interrompi la condivisione',
      fin: {
        vencio: 'Il tempo è scaduto: il server e il tunnel sono stati chiusi.',
        tunel: 'Il tunnel si è chiuso e la condivisione è terminata.',
      },
      registro: {
        titulo: 'Accessi',
        ayuda: 'Gli ultimi 200, solo in memoria. Non mostrano mai il codice segreto del link.',
        vacioTitulo: 'Ancora nessun accesso',
        vacioTexto: 'Ogni volta che qualcuno aprirà il link comparirà qui.',
        col: {
          hora: 'Ora',
          ip: 'IP',
          ruta: 'Percorso',
          codigo: 'Codice',
        },
        sinPermiso: '(senza il codice corretto)',
      },
    },
    usoDisco: {
      explicacion:
        "Mostra cosa occupa spazio in un'unità o in una cartella. Legge solo nomi e dimensioni (mai i contenuti), non segue collegamenti né junction e lavora in un processo separato. Non elimina, sposta né modifica nulla.",
      unidades: 'Unità',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${libre} liberi su ${total}`,
      sinUnidades:
        "Non è stato possibile leggere l'elenco delle unità. Può scegliere una cartella.",
      elegirCarpeta: 'Scegli cartella…',
      analizando: 'Analisi in corso…',
      leyendo: 'Lettura',
      progreso: (archivos, carpetas, bytes) => `${archivos} file · ${carpetas} cartelle · ${bytes}`,
      cancelar: 'Annulla',
      cancelado: 'Analisi annullata.',
      resumen: (total, archivos, carpetas) => `${total} in ${archivos} file e ${carpetas} cartelle`,
      duracion: (segundos) => `Ha richiesto ${segundos} s.`,
      vistas: {
        arbol: 'Albero',
        carpetas: 'Cartelle',
        archivos: 'File',
        extensiones: 'Estensioni',
      },
      arbolAyuda:
        'Ordinato per dimensione. Vengono mostrate solo le cartelle e i file che pesano almeno lo 0,5% del totale; il resto è riassunto in «Altri».',
      carpetasAyuda:
        'Le 50 cartelle con più peso proprio: quanto pesano i file che contengono direttamente, senza contare le sottocartelle.',
      archivosAyuda: 'I 50 file più grandi.',
      extensionesAyuda:
        'Le 20 estensioni che occupano più spazio; il resto va in «Altre estensioni».',
      col: {
        nombre: 'Nome',
        tamano: 'Dimensione',
        porcentaje: 'Del totale',
        archivos: 'File',
        ruta: 'Percorso',
        extension: 'Estensione',
      },
      otros: (n) => `Altri (${n} file piccoli)`,
      sinExtension: '(senza estensione)',
      otrasExtensiones: 'Altre estensioni',
      expandir: (nombre) => `Espandi ${nombre}`,
      contraer: (nombre) => `Comprimi ${nombre}`,
      abrir: 'Apri in Esplora risorse',
      copiar: 'Copia percorso',
      denegada: 'Non è stato possibile leggerlo',
      avisos: {
        enlaces: (n) =>
          `${n} ${n === 1 ? 'collegamento o junction non è stato seguito' : 'collegamenti o junction non sono stati seguiti'} e ${n === 1 ? 'conta' : 'contano'} come 0.`,
        denegados: (n) =>
          `${n} ${n === 1 ? 'elemento non è stato leggibile' : 'elementi non sono stati leggibili'} (nessun permesso, o modificati durante l'analisi). Senza diritti di amministratore alcune cartelle di sistema non si possono leggere: questo strumento non li richiede.`,
        enlacesDuros: (n) =>
          `${n} ${n === 1 ? 'nome aggiuntivo' : 'nomi aggiuntivi'} di file con collegamenti reali ${n === 1 ? 'non è stato contato' : 'non sono stati contati'} due volte.`,
        enlacesDurosIncompleto:
          "C'erano così tanti collegamenti reali che il registro si è riempito: il totale potrebbe contare due volte qualche file.",
        truncado:
          'È stata raggiunta la profondità massima: alcune cartelle non sono state conteggiate.',
        tamanoLogico:
          'Le dimensioni sono logiche (quelle che ogni file dichiara), non lo spazio usato su disco: i file di OneDrive solo online, i file compressi e quelli sparsi possono differire.',
        verEnlaces: 'Mostra i collegamenti non seguiti',
      },
      limpieza: {
        titulo: 'Libera spazio',
        texto:
          'Questo strumento si limita a misurare. Per eliminare file temporanei e cache rigenerabili, o versioni di servizi inutilizzate, usi ciò che già esiste:',
        temporales: 'Pulizia del disco',
        versiones: 'Versioni inutilizzate (Servizi)',
      },
      vacio: {
        titulo: 'Ancora nessuna analisi',
        texto:
          "Scelga un'unità o una cartella per vedere cosa occupa spazio. Non viene modificato nulla.",
      },
      sinContenido: {
        titulo: 'Niente da contare',
        texto: 'Quella cartella non contiene file leggibili.',
      },
    },
    diffCarpetas: {
      explicacion:
        "Confronta due cartelle senza modificare nulla al loro interno: cosa c'è solo in una, solo nell'altra e cosa è diverso. Non segue i collegamenti e lavora in un processo separato.",
      carpetaA: 'Cartella A',
      carpetaB: 'Cartella B',
      elegir: 'Scegli cartella',
      sinElegir: 'Non scelta',
      comparar: 'Confronta',
      comparando: 'Confronto in corso…',
      cancelar: 'Annulla',
      cancelada: 'Confronto annullato.',
      iguales: 'Le due cartelle sono uguali.',
      grupoSoloA: 'Solo in A',
      grupoSoloB: 'Solo in B',
      grupoDistintos: 'Diversi',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'Nessuno',
      resumen: (a, b, iguales) => `A: ${a} file · B: ${b} file · ${iguales} identici`,
      truncado:
        "È stato raggiunto un limite (file, profondità o dimensione): l'elenco non è completo.",
      recortado: (mostrados, total) =>
        `Ci sono più file di quelli mostrati (${mostrados} su ${total}).`,
      sinComparar: (n) =>
        `${n} file grandi con la stessa dimensione non sono stati confrontati per contenuto.`,
      omitidos: (n) => `${n} collegamenti, junction o elementi speciali sono stati saltati.`,
      motivoTamano: 'dimensione diversa',
      motivoContenido: 'stessa dimensione, contenuto diverso',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: "Scelga dall'elenco un file «diverso» per vederne la differenza.",
      soloEnUno: (lado) => `Questo file esiste solo in ${lado}.`,
      cargando: 'Lettura dei file…',
      binario: 'I file sono diversi, ma non sono testo: il diff non viene mostrato.',
      sensible:
        "File sensibile (.env, chiavi o dati reali): è diverso, ma il suo contenuto non viene mostrato. Può aprirlo nell'editor, che richiede una conferma rafforzata.",
      tope: (kb) =>
        `I file sono diversi, ma superano ${kb} KB: il diff del testo non viene mostrato.`,
      demasiadoDistinto: 'I file sono così diversi che il diff riga per riga non viene mostrato.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'fine riga miste',
        ninguno: 'nessuna fine riga',
      },
      saltosDistintos: (a, b) => `Fine riga: A usa ${a} e B usa ${b}.`,
      soloSaltos:
        'Il testo delle righe è lo stesso: cambiano solo le fine riga (compresa quella alla fine del file) o il BOM.',
      resumenArchivo: (agregadas, quitadas) => `${agregadas} righe aggiunte, ${quitadas} rimosse`,
      truncadoArchivo: 'Vengono mostrate solo le prime righe.',
      lineasIguales: (n) => `… ${n} righe identiche …`,
      abrirA: "Apri A nell'editor",
      abrirB: "Apri B nell'editor",
      atajos: '↑ ↓ per spostarsi, Invio per vedere la differenza, Esc per annullare.',
      listaAria: (grupo) => `File: ${grupo}`,
      detalleAria: 'Differenze del file',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Sezioni del client HTTP',
        peticion: 'Richiesta',
        coleccion: 'Raccolta',
        historial: 'Cronologia',
        entornos: 'Ambienti',
      },
      entorno: 'Ambiente',
      sinEntorno: 'Nessun ambiente',
      metodo: 'Metodo',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/percorso o {{base}}/percorso',
      enviar: 'Invia',
      enviarAtajo: 'Invia (Ctrl+Invio)',
      cancelar: 'Annulla',
      nueva: 'Nuova',
      guardar: 'Salva nella raccolta',
      nombre: 'Nome',
      nombrePlaceholder: 'Nome della richiesta',
      guardada: 'Richiesta salvata',
      ayudaVariables: "Usi {{variable}} per prendere i valori dall'ambiente selezionato.",
      secciones: {
        params: 'Parametri',
        cabeceras: 'Intestazioni',
        cuerpo: 'Corpo',
        auth: 'Autenticazione',
        opciones: 'Opzioni',
      },
      par: {
        clave: 'Nome',
        valor: 'Valore',
        agregar: 'Aggiungi riga',
        quitar: 'Rimuovi riga',
        activa: 'Riga attiva',
        falta: 'Manca il segreto: lo digiti per poter inviare.',
      },
      cuerpo: {
        tipo: 'Tipo di corpo',
        ninguno: 'Nessuno',
        json: 'JSON',
        form: 'Modulo (urlencoded)',
        multipart: 'Multipart (solo testo)',
        raw: 'Testo grezzo',
        tipoContenido: 'Content-Type',
        texto: 'Contenuto',
        multipartAyuda: 'Solo campi di testo: non vengono inviati file del disco.',
      },
      auth: {
        tipo: 'Tipo',
        ninguna: 'Nessuna',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'Chiave API',
        token: 'Token',
        usuario: 'Utente',
        clave: 'Password',
        nombre: "Nome dell'intestazione o del parametro",
        en: 'Invia in',
        cabecera: 'Intestazione',
        query: 'Query string',
        ayuda:
          'Il valore viene memorizzato cifrato dal sistema; la raccolta, la cronologia e gli ambienti ne conservano solo un riferimento.',
      },
      secreto: {
        guardado: 'Memorizzato (cifrato). Digiti per sostituirlo.',
        mostrar: 'Mostra',
        ocultar: 'Nascondi',
        quitar: 'Rimuovi',
        valor: 'Valore memorizzato',
        porNombre: 'Verrà memorizzato cifrato perché il nome sembra quello di un segreto.',
      },
      opciones: {
        plazo: 'Timeout (secondi)',
        plazoAyuda: 'Da 1 a 120 secondi.',
        ignorarCert: 'Ignora gli errori di certificato per questa richiesta',
        ignorarAviso:
          'Pericoloso: la connessione non viene più verificata. Vale solo per questa richiesta e per il suo host. I siti .test di WolfCore sono già verificati con la propria CA.',
        limites:
          'Risposta fino a 10 MB e al massimo 10 reindirizzamenti. Nessun cookie memorizzato e nessun proxy di sistema.',
      },
      respuesta: {
        enviando: 'Invio in corso…',
        estado: 'Stato',
        tiempo: 'Tempo',
        tamano: 'Dimensione',
        cuerpo: 'Corpo',
        cabeceras: 'Intestazioni',
        redirecciones: 'Reindirizzamenti',
        vacioTitulo: 'Ancora nessuna risposta',
        vacioTexto: 'Digiti un URL e prema Invia. La richiesta parte da WolfCore Dev.',
        binario: (bytes, tipo) => `Binario di ${bytes} byte, tipo ${tipo || 'sconosciuto'}.`,
        sinCuerpo: 'La risposta non ha corpo.',
        truncada: 'La risposta ha superato 10 MB: è stata troncata ed è incompleta.',
        parcial: (mostrados) => `Vengono mostrati i primi ${mostrados} caratteri.`,
        sinRedirecciones: 'Non ci sono stati reindirizzamenti.',
        salto: (n) => `Salto ${n}`,
        urlFinal: 'URL finale',
        certIgnorado: 'Per questa richiesta sono stati ignorati gli errori di certificato.',
        caWolf: 'Verificato con la CA di WolfCore Dev.',
        copiar: 'Copia il corpo',
        copiado: 'Corpo copiato',
        formato: 'JSON formattato',
        crudo: 'Testo originale',
      },
      curl: {
        copiar: 'Copia come curl',
        incluir: 'Includi le credenziali',
        incluirAyuda:
          'Disattivato, i valori segreti compaiono come <secreto>. Attivato, il comando contiene le credenziali reali.',
        copiado: 'Comando curl copiato',
        importar: 'Importa curl',
        importarTitulo: 'Importa un comando curl',
        importarAyuda:
          "Incolli un comando curl. Viene letto solo come testo: non viene eseguito nulla. Le credenziali vanno nell'archivio cifrato.",
        importarPlaceholder:
          "curl -X POST https://api.example.test/percorso -H 'Accept: application/json'",
        importarBoton: 'Importa',
        importada: 'Richiesta importata nella raccolta',
        avisos: {
          opcion_ignorada: (d) => `Opzione ignorata: ${d}`,
          archivo_ignorado: (d) => `I file del disco non vengono letti: ${d}`,
          inseguro_ignorado:
            '-k/--insecure è stato ignorato. Se le serve, attivi a mano «Ignora gli errori di certificato».',
          comando_cortado:
            'Tutto ciò che segue un operatore della shell (|, ;, &, >) è stato ignorato.',
          sin_evaluar:
            'Il testo conteneva $(…), apici inversi o variabili della shell: non vengono valutati e restano come testo.',
          url_sin_esquema: "L'URL non aveva lo schema: è stato usato http://.",
          varias_urls: (d) => `Un argomento aggiuntivo è stato ignorato: ${d}`,
          cabecera_invalida: (d) => `Un'intestazione non valida è stata ignorata: ${d}`,
          secretos_guardados:
            'Le credenziali importate sono state memorizzate cifrate; la raccolta ne conserva solo il riferimento.',
        },
      },
      coleccion: {
        vacioTitulo: 'La raccolta è vuota',
        vacioTexto: 'Salvi una richiesta o importi un comando curl per averla a portata di mano.',
        abrir: 'Apri',
        borrar: 'Elimina',
        borrada: 'Richiesta eliminata',
      },
      historial: {
        vacioTitulo: 'Nessuna cronologia',
        vacioTexto:
          'Le ultime 100 richieste restano qui, senza credenziali: le intestazioni sensibili compaiono come ***.',
        abrir: 'Apri',
        limpiar: 'Cancella cronologia',
        sinRespuesta: 'Nessuna risposta',
      },
      entornos: {
        vacioTitulo: 'Nessun ambiente',
        vacioTexto:
          'Un ambiente definisce variabili come {{base}} o {{token}}. Quelle contrassegnate come segrete vengono memorizzate cifrate.',
        nuevo: 'Nuovo ambiente',
        nombre: "Nome dell'ambiente",
        variable: 'Variabile',
        valor: 'Valore',
        secreta: 'Segreta',
        agregar: 'Aggiungi variabile',
        quitar: 'Rimuovi variabile',
        guardar: 'Salva ambiente',
        guardado: 'Ambiente salvato',
        borrar: 'Elimina ambiente',
        borrado: 'Ambiente eliminato',
        usar: 'Usa questo ambiente',
        activo: 'Attivo',
        sinNombre: "Digiti un nome per l'ambiente.",
      },
    },
    imagenes: {
      nombreCaptura: 'schermata',
    },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Porta {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Porta {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Intervallo riservato {desde}-{hasta} (include {puerto})',
      ca_vencida: 'La CA è scaduta {dias} giorni fa',
      ca_por_vencer: 'La CA scade tra {dias} giorni',
      certificado_vencido: 'Il certificato per {dominio} è scaduto {dias} giorni fa',
      certificado_por_vencer: 'Il certificato per {dominio} scade tra {dias} giorni',
      firefox_perfiles: 'Profili di Firefox senza fiducia:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (aperto)',
      firefox_perfil_fuera: '{perfil} (fuori dalla cartella di Firefox)',
      hosts_ilegible: '{ruta}: non è stato possibile leggerlo ({motivo})',
      hosts_codificacion: '{ruta}: codifica {codificacion}',
      hosts_bloques: '{ruta}: {bloques} blocchi di WolfCore Dev',
      hosts_sin_cierre: '{ruta}: un blocco di WolfCore Dev non ha il marcatore di chiusura',
      hosts_faltan: 'Mancano in hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: attributo di sola lettura',
      path_repetidas: 'Ripetute: {entradas}',
      path_delante:
        '{entrada} viene prima degli strumenti di WolfCore Dev e contiene anche {programa}',
      antivirus_sin_leer:
        "L'antivirus è attivo; non è stato possibile leggere le sue esclusioni (serve un amministratore).",
      antivirus_sin_exclusion:
        "L'antivirus è attivo e la cartella dei dati di WolfCore Dev non è esclusa.",
      enlazador_ausente: 'Non sono stati trovati gli strumenti C++ di Visual Studio Build Tools.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) non è installato.',
      firewall_no_comprobado:
        'Non è stato possibile leggere le regole del firewall (potrebbe servire un amministratore).',
      firewall_reglas: 'WolfCore Dev: {propias} · Residui dei test di WolfCore: {pruebas}',
      firewall_acotadas: 'Regole limitate alla rete locale:',
      firewall_ajenas: 'Regole di altri programmi:',
      firewall_quitadas: 'Regole rimosse che si possono ripristinare:',
    },
    ver: 'Mostra',
    verPuertos: 'Mostra le porte',
    dialogo: {
      reglas: 'Regole interessate: deselezioni quelle che non vuole toccare.',
      sinSeleccion: 'Selezioni almeno una regola per continuare.',
      reglasNota:
        "Nulla cambia senza la sua conferma e l'autorizzazione di amministratore. Se una regola è cambiata dopo essere stata mostrata, viene saltata.",
    },
    reparaciones: {
      firewall:
        'Rimuove queste regole in entrata del firewall, una per una e con il loro nome esatto. Prima viene salvata una copia nella chiave di registro protetta HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos per poterle ricreare. Le regole di altri programmi non vengono mai toccate.',
      firewall_restaurar:
        'Ricrea le regole che seleziona, con lo stesso programma, profilo, protocollo, porte e indirizzi mostrati, dalla copia protetta (non dal file in etc/). Quei programmi potranno di nuovo accettare connessioni di rete.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev avvia Maven direttamente con il JDK e, per sicurezza, non legge .mvn/jvm.config né la variabile MAVEN_OPTS. Se il suo progetto ne ha bisogno, esegua Maven da un terminale.',
    avisoRuby:
      "Ruby viene installato senza il Devkit (MSYS2) e senza toccare il suo PATH né il registro di Windows: non c'è un programma di installazione. Le gemme con estensioni native senza binario precompilato richiedono il Devkit. È un passaggio manuale: apra un terminale dal progetto ed esegua «ridk install» (installa MSYS2 sul suo computer e scarica da internet).",
    avisoJdk:
      "Maven e Gradle funzionano con un JDK di WolfCore Dev e non ne è ancora installato nessuno. Installi Java (Temurin) dall'elenco dei servizi.",
    avisoMeilisearch:
      "Ogni versione secondaria di Meilisearch ha i propri dati. Se passa a un'altra versione secondaria (ad esempio da 1.58 a 1.59), i suoi indici e MEILISEARCH_KEY saranno nuovi: dovrà reindicizzare e aggiornare il .env dei suoi progetti.",
    servicios: {
      meilisearch: 'Meilisearch',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    anteriores: (n) => `Patch precedenti (${n})`,
  },
  memoria: {
    boton: 'Memoria',
    tituloBoton: 'Ottimizza la memoria',
    titulo: 'Ottimizzatore della memoria',
    intro:
      "Scelga una modalità e controlli l'elenco. Nulla viene chiuso né arrestato finché non conferma, e non si avvia mai da solo.",
    modo: 'Modalità',
    modos: {
      liviano: 'Leggera',
      moderado: 'Moderata',
      profundo: 'Profonda',
    },
    descripciones: {
      liviano: "Svuota la cache dell'app. Libera spazio su disco; non chiude né arresta nulla.",
      moderado:
        'Propone inoltre di lasciare un solo worker PHP e di arrestare i servizi di WolfCore Dev senza attività né connessioni. I servizi partono deselezionati.',
      profundo:
        'Elenca inoltre i suoi programmi che consumano più memoria, così può chiedere loro di chiudere la finestra. Partono deselezionati.',
    },
    ver: "Mostra l'elenco",
    revisando: 'Controllo in corso…',
    vacio: "In questa modalità non c'è nulla da liberare.",
    tipos: {
      'cache-app': 'Svuota la cache',
      'reducir-pool': 'Lascia un solo worker',
      'detener-inactivo': 'Arresta (inattivo)',
      'cerrar-programa': 'Chiedi di chiudere la finestra',
    },
    caches: {
      sesion: "Cache HTTP della sessione dell'applicazione",
    },
    estimado: (cantidad) => `Verrebbero liberati circa ${cantidad} di RAM`,
    estimadoDisco: (cantidad) => `Più circa ${cantidad} di disco (la cache non è RAM)`,
    marcadas: (n, total) => `${n} di ${total} selezionati`,
    sinDatos:
      'Non ci sono ancora abbastanza dati di attività per proporre di arrestare servizi o ridurre PHP. Lasci aperta la Home per qualche minuto e controlli di nuovo.',
    listadoFallido:
      "Non è stato possibile leggere l'elenco dei programmi aperti: questo elenco potrebbe essere incompleto. Riprovi.",
    avisoDetener:
      'I servizi inattivi partono deselezionati: arrestarne uno interrompe tutto ciò che lo usa. Sono elencati solo quelli senza connessioni in questo momento.',
    avisoCerrar:
      'Ai programmi viene solo chiesto di chiudere la finestra, come cliccando sulla X: possono chiedere se salvare. Un programma non viene mai forzato né terminato.',
    protegidos:
      'I programmi di sistema, i servizi di Windows, i programmi con privilegi elevati, gli altri utenti, FlyEnv, PhpWebStudy e WolfCore Dev (o qualsiasi cosa avviino) non compaiono mai.',
    aplicar: 'Applica quelli selezionati',
    confirmarTitulo: 'Applicare queste azioni?',
    confirmarTexto: (n) =>
      n === 1
        ? "Verrà eseguita 1 azione dell'elenco."
        : `Verranno eseguite ${n} azioni dell'elenco.`,
    confirmarCerrar: (nombres) =>
      `Ai seguenti programmi verrà chiesto di chiudere la finestra: ${nombres}.`,
    confirmarDetener: (nombres) => `I seguenti servizi verranno arrestati: ${nombres}.`,
    confirmar: 'Sì, applica',
    cancelar: 'Annulla',
    resultadoTitulo: 'Risultato',
    liberado: (cantidad) => `Stima: circa ${cantidad} di RAM liberati`,
    liberadoDisco: (cantidad) => `Più circa ${cantidad} di disco`,
    notaPedido:
      'In attesa di lei: è stato chiesto alla finestra di chiudersi e il programma è ancora aperto (potrebbe chiedere se salvare). Non viene conteggiato come liberato.',
    estados: {
      hecho: 'Fatto',
      pedido: 'In attesa di lei',
      saltado: 'Saltato',
      error: 'Non riuscito',
    },
    motivos: {
      no_en_plan: "Non era nell'elenco",
      protegido: 'È un programma protetto',
      cambio: "È cambiato dopo che l'elenco è stato mostrato",
      sin_ventana: 'Non ha più una finestra da chiudere',
      ya_apagado: "Non c'era più nulla da ridurre",
      ocupado: 'Era occupato (ha connessioni)',
      no_se_pudo:
        'Non è stato possibile inviare la richiesta di chiusura (il programma è in esecuzione con privilegi elevati)',
    },
    otraVez: 'Ricomincia',
  },
  guias: {
    tuneles: {
      titulo: 'Guida ai tunnel',
      copiar: 'Copia il comando',
    },
    http: {
      buscar: 'Cerca per numero, nome o testo',
      familia: 'Famiglia',
      todas: 'Tutte',
      verMetodos: 'Metodi',
      verCodigos: 'Codici di stato',
      resultados: (n) => `${n} ${n === 1 ? 'risultato' : 'risultati'}`,
      vacio: 'Nessun elemento corrisponde alla ricerca.',
      seguro: 'Sicuro',
      noSeguro: 'Non sicuro',
      idempotente: 'Idempotente',
      noIdempotente: 'Non idempotente',
      noEstandar: 'Non standard',
      broma: 'Codice scherzoso (RFC 2324)',
      causas: 'Cause comuni',
      solucion: 'Come risolverlo',
      ejemplo: 'Esempio',
      copiarEjemplo: "Copia l'esempio",
      probar: 'Provalo',
      probarTitulo:
        'Provi questo esempio nel client HTTP (non viene inviato nulla finché non preme Invia)',
      servidorActivo: (puerto) =>
        `Server di esempio in esecuzione su 127.0.0.1:${puerto} mentre usa la guida o il client HTTP. È raggiungibile solo da questo computer e si arresta quando esce o dopo 10 min di inutilizzo.`,
      sinTraduccion: 'Non tradotto in questa lingua: mostrato in inglese.',
      familias: {
        '1xx': '1xx Informativi',
        '2xx': '2xx Successo',
        '3xx': '3xx Reindirizzamento',
        '4xx': '4xx Errore del client',
        '5xx': '5xx Errore del server',
      },
    },
    git: {
      buscar: 'Cerca un argomento o un comando',
      verGuia: 'Guida',
      verLaboratorio: 'Laboratorio',
      todos: 'Tutti',
      grupos: {
        basico: 'Le basi',
        ramas: 'Rami',
        deshacer: 'Annullare',
        remotos: 'Remoti e tag',
        github: 'GitHub',
      },
      resultados: (n) => `${n} ${n === 1 ? 'argomento' : 'argomenti'}`,
      vacio: 'Nessun elemento corrisponde alla ricerca.',
      ejemplo: 'Esempio',
      errores: 'Errori comuni',
      copiarEjemplo: "Copia l'esempio",
      peligroso: 'Pericoloso',
      sinTraduccion: 'Non tradotto in questa lingua: mostrato in inglese.',
      avisoGithub:
        'Questa parte è solo una spiegazione: WolfCore Dev non crea account, non accede a GitHub né usa token da questa guida. I nomi e i valori degli esempi sono inventati.',
      irLaboratorio: 'Eserciti nel laboratorio',
      lab: {
        intro:
          'Un repository di pratica e un «remoto» locale, in una cartella che appartiene a WolfCore Dev. Non usa internet né GitHub e non tocca i suoi progetti né le sue impostazioni di git.',
        sinGit: {
          titulo: 'Git non è installato',
          texto:
            'Il laboratorio usa il git del suo sistema e non può aprirsi senza. Installi Git e riapra questa scheda; WolfCore Dev non installa nulla al suo posto.',
        },
        cargando: 'Preparazione del laboratorio…',
        reiniciar: 'Reimposta laboratorio',
        reiniciarAyuda: 'Elimina solo la cartella di pratica e la lascia come nuova.',
        reiniciado: 'Laboratorio reimpostato.',
        version: (v) => `git ${v}`,
        ordenes: 'Comandi',
        mensaje: 'Messaggio del commit',
        mensajePorDefecto: 'Modifica di pratica',
        rama: 'Ramo',
        etiqueta: 'Tag',
        archivo: 'File',
        grupos: {
          basico: 'Le basi',
          ramas: 'Rami',
          guardar: 'Salvare e annullare',
          remoto: 'Remoto locale',
        },
        archivos: {
          titulo: 'File di pratica',
          ayuda: 'Si possono modificare solo questi file, con testo fino a 2000 caratteri.',
          guardar: 'Salva file',
          guardado: 'File salvato.',
          areaTexto: (n) => `Contenuto di ${n}`,
        },
        salida: 'Output',
        salidaVacia: 'Prema un comando per vedere qui la risposta di git.',
        codigo: (n) => (n === 0 ? 'Terminato correttamente' : `Terminato con codice ${n}`),
        truncada: "L'output è stato troncato.",
        historial: 'Cronologia',
        historialVacio: 'Non ci sono ancora commit: esegua git init, git add e git commit.',
        conflicto: {
          titulo: 'Esercizio guidato: un conflitto',
          intro:
            'Due rami modificano la stessa riga. Vedrà come compare il conflitto e come risolverlo.',
          paso: (n, total) => `Passo ${n} di ${total}`,
          ejecutar: 'Esegui questo passo',
          hecho: 'Fatto',
          reempezar: 'Ricomincia',
          esperado: 'Git ha segnalato il conflitto: è ciò che ci si aspetta in questo passo.',
          elegir: {
            mia: 'Mantieni quella di main (verde)',
            otra: 'Mantieni quella di rama-a (rosso)',
            ambas: 'Mantieni entrambe',
          },
          final: 'Fatto: ha risolto un conflitto. Guardi la cronologia.',
          pasos: [
            {
              titulo: 'Preparare il laboratorio',
              texto:
                'Il laboratorio viene reimpostato e viene creato il primo commit con colores.txt («color: azul»).',
            },
            {
              titulo: 'Modificare la riga su rama-a',
              texto:
                'Viene creato il ramo rama-a, la riga diventa «color: rojo» e viene fatto il commit.',
            },
            {
              titulo: 'Modificare la stessa riga su main',
              texto: 'Si torna a main, la riga diventa «color: verde» e viene fatto il commit.',
            },
            {
              titulo: 'Provare il merge',
              texto:
                'rama-a viene unito a main. Git non sa quale riga mantenere e lascia un conflitto.',
            },
            {
              titulo: 'Scegliere una versione',
              texto:
                'Scelga quale versione della riga mantenere. colores.txt ora contiene i marcatori del conflitto.',
            },
            {
              titulo: 'Confermare la risoluzione',
              texto:
                "colores.txt viene aggiunto all'area di staging (add) e viene fatto il commit che chiude il merge.",
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `Un editor leggero con evidenziazione per file di testo fino a ${mb} MB. Scelga il file nella finestra di sistema; il salvataggio chiede sempre conferma e prima lascia una copia nella cartella dei dati di WolfCore Dev.`,
    abrir: 'Apri file…',
    abriendo: 'Apertura in corso…',
    guardar: 'Salva',
    guardando: 'Salvataggio in corso…',
    recargar: 'Ricarica dal disco',
    vacio: 'Apra un file per iniziare a modificare.',
    sinCambios: 'Nessuna modifica',
    conCambios: 'Modifiche non salvate',
    posicion: (linea, columna) => `Riga ${linea}, colonna ${columna}`,
    areaTexto: (nombre) => `Editor di codice: ${nombre}`,
    salirTeclado: "Per uscire dall'editor con la tastiera, prema Esc e poi Tab.",
    guardado: 'File salvato.',
    copiaPrevia: (ruta) => `Copia di backup: ${ruta}`,
    cancelar: 'Annulla',
    enlaceDuro:
      'Questo file ha più di un nome su disco (un collegamento reale). Salvandolo si spezza quel collegamento: gli altri nomi mantengono il contenuto precedente.',
    saltosMixtos: {
      aviso:
        'Questo file mescola diversi tipi di fine riga. Salvando vengono tutti normalizzati a LF.',
      aceptar: 'Accetto di normalizzare le fine riga',
    },
    envGestor: {
      aviso:
        'I file .env si modificano nelle variabili del progetto, con il loro flusso per i segreti. Il pulsante apre il .env nella radice del progetto, che potrebbe non essere il file che ha tentato di aprire.',
      boton: 'Apri il .env nella radice del progetto',
    },
    huellaPerdida:
      'Salvato, ma non è stato possibile leggere la nuova impronta: il file è stato ricaricato.',
    confirmarGuardar: {
      titulo: 'Salva le modifiche',
      texto: (nombre) =>
        `Sta per essere scritto ${nombre}. Prima viene salvata una copia di ciò che è ora su disco nella cartella dei dati di WolfCore Dev.`,
      boton: 'Salva con copia di backup',
    },
    refuerzo: {
      abrirTitulo: 'File sensibile',
      guardarTitulo: 'Salva un file sensibile',
      secreto:
        'Questo file sembra contenere segreti (chiavi private, token o credenziali). Il suo contenuto verrà mostrato sullo schermo.',
      datosReales:
        'Questo file appartiene a un sito contrassegnato come contenente dati reali. Una modifica sbagliata può influire su informazioni reali.',
      instruccion: (nombre) => `Per continuare, digiti il nome del file: ${nombre}`,
      etiqueta: 'Nome del file',
      abrirBoton: 'Apri comunque',
      guardarBoton: 'Salva comunque',
    },
    cambioExterno: {
      titulo: "Il file è cambiato fuori dall'editor",
      texto:
        'Un altro programma lo ha modificato dopo che lo ha aperto, quindi non è stato salvato nulla. Può ricaricarlo (le sue modifiche vanno perse) o sovrascriverlo con ciò che ha qui.',
      recargar: 'Ricarica e scarta le mie modifiche',
      sobrescribir: 'Sovrascrivi…',
      sobrescribirTitulo: 'Sovrascrivi il file',
      sobrescribirTexto:
        "Le modifiche fatte dall'altro programma andranno perse. Il suo contenuto attuale resterà nella copia di backup.",
      sobrescribirBoton: 'Sì, sovrascrivi',
      volver: 'Indietro',
    },
    descartar: {
      titulo: 'Modifiche non salvate',
      texto: "Nell'editor ci sono modifiche non salvate. Se continua, vanno perse.",
      confirmar: 'Scarta le modifiche',
      seguir: 'Continua a modificare',
    },
    cm: {
      'Control character': 'Carattere di controllo',
      'Selection deleted': 'Selezione eliminata',
      'Go to line': 'Vai alla riga',
      go: 'vai',
      Find: 'Trova',
      Replace: 'Sostituisci',
      next: 'successivo',
      previous: 'precedente',
      all: 'tutti',
      'match case': 'maiuscole/minuscole',
      regexp: 'regexp',
      'by word': 'parola intera',
      replace: 'sostituisci',
      'replace all': 'sostituisci tutto',
      close: 'chiudi',
      'current match': 'corrispondenza attuale',
      'on line': 'alla riga',
      'replaced match on line $': 'corrispondenza sostituita alla riga $',
      'replaced $ matches': '$ corrispondenze sostituite',
      'folded code': 'codice compresso',
      unfold: 'espandi',
      to: 'a',
    },
  },
  limpiezaDisco: {
    intro:
      'Prima analizza e mostra quanto occupa ogni elemento. Nulla viene eliminato finché non conferma, e non si avvia mai da solo né in background.',
    analizar: 'Analizza',
    analizando: 'Analisi in corso…',
    cancelarAnalisis: 'Annulla',
    vacio: "Non c'è nulla da pulire.",
    categorias: {
      temp: {
        nombre: 'File temporanei',
        ayuda:
          'File nella sua cartella TEMP più vecchi di 24 ore. Eliminati definitivamente; si rigenerano da soli.',
      },
      'cache-chrome': {
        nombre: 'Cache di Google Chrome',
        ayuda: 'Solo le cartelle della cache di ogni profilo; mai cookie, password o cronologia.',
      },
      'cache-edge': {
        nombre: 'Cache di Microsoft Edge',
        ayuda: 'Solo le cartelle della cache di ogni profilo; mai cookie, password o cronologia.',
      },
      'cache-brave': {
        nombre: 'Cache di Brave',
        ayuda: 'Solo le cartelle della cache di ogni profilo; mai cookie, password o cronologia.',
      },
      'cache-firefox': {
        nombre: 'Cache di Firefox',
        ayuda: 'Solo la cartella cache2 di ogni profilo; mai cookie, password o cronologia.',
      },
      'wolfcore-descargas': {
        nombre: 'Download in cache di WolfCore Dev',
        ayuda: 'Archivi sciolti che non servono più. Spostati nel cestino.',
      },
      'wolfcore-registros': {
        nombre: 'Log di WolfCore Dev',
        ayuda: 'Log più vecchi di 30 giorni. Spostati nel cestino.',
      },
      prefetch: {
        nombre: 'Prefetch di Windows',
        ayuda:
          'Facoltativo. Windows lo rigenera, ma richiede che WolfCore Dev sia eseguito come amministratore.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        "Browser aperto o in esecuzione in background: lo chiuda completamente per pulire la sua cache (in Edge disattivi anche l'avvio rapido e le estensioni in background)",
      'requiere-admin': "Richiede l'esecuzione di WolfCore Dev come amministratore",
      'ruta-vetada': 'Percorso protetto: non viene pulito',
      'temp-no-seguro':
        "La variabile TEMP punta a una cartella che non è la cartella temporanea dell'utente (Documenti, un'intera unità, un percorso di rete…): non viene pulita",
    },
    borradoDefinitivo: 'Eliminati definitivamente (si rigenerano da soli)',
    borradoPapelera: 'Spostati nel cestino di sistema',
    archivos: (n) => (n === 1 ? '1 file' : `${n} file`),
    carpetas: 'Per cartella',
    truncado: "L'analisi si è fermata al limite di file: c'è più di quanto mostrato.",
    marcadas: (n, t) => `${n} categorie su ${t} selezionate`,
    total: (b) => `Verrebbero liberati circa ${b}`,
    limpiar: 'Pulisci selezionati',
    confirmarTitulo: 'Pulire queste categorie?',
    confirmarTexto: (n) => `Verranno pulite ${n} categorie.`,
    confirmarDefinitivo: 'TEMP e cache vengono eliminati definitivamente (si rigenerano da soli).',
    confirmarPapelera: 'I log e i download di WolfCore Dev vanno nel cestino.',
    confirmarPrefetch:
      "Prefetch: Windows lo rigenera, ma i primi avvii dei programmi possono essere un po' più lenti.",
    confirmar: 'Sì, pulisci',
    cancelar: 'Annulla',
    detener: 'Interrompi la pulizia',
    resultadoTitulo: 'Risultato',
    liberado: (b) => `Liberati: ${b}`,
    enPapelera: (b) => `Di questi, ${b} sono nel cestino (lo spazio torna quando lo svuota).`,
    saltados: (n) => `${n} file sono stati saltati`,
    cancelado: 'Pulizia annullata: ciò che è già stato eliminato resta eliminato.',
    topeEjecucion:
      'È stato raggiunto il limite di file per esecuzione: analizzi e pulisca di nuovo per continuare.',
    registroFallido:
      'Non è stato più possibile scrivere il registro della pulizia, quindi la pulizia si è interrotta: ciò che è stato eliminato è registrato fino a quel punto.',
    motivos: {
      'en-uso': 'In uso',
      enlace: 'Collegamento o reparse point (non seguito)',
      protegido: 'Protetto (.env, FlyEnv o simili)',
      cambio: "Modificato dopo l'analisi",
      'sin-papelera': 'Nessun cestino disponibile',
      ilegible: 'Non è stato possibile leggerlo',
      error: "Errore durante l'eliminazione",
    },
    verRegistros: 'Mostra i log',
    registroEn: (r) => `Registro di questa pulizia: ${r}`,
    otraVez: 'Ricomincia',
    protegidas:
      'Mai toccati: dati, backup, progetti, database o file .env. I collegamenti non vengono seguiti e non viene toccato nulla al di fuori dei percorsi di questo elenco.',
  },
  preferencias: {
    asistente: 'Tour di benvenuto',
    asistenteAyuda:
      'Riveda il tour delle schermate principali: servizi, progetti, database, strumenti e Doctor.',
    asistenteAbrir: 'Guarda il tour',
    avanzadas: 'Mostra le sezioni avanzate',
    avanzadasAyuda:
      'Aggiunge alla barra laterale le schermate usate di rado, come Container. Sono raggiungibili anche con Ctrl+K.',
  },
  paleta: {
    irAServicio: (nombre) => `Vai al servizio ${nombre}`,
    irAProyecto: (nombre) => `Vai al progetto ${nombre}`,
    versionesDe: (nombre) => `Versioni di ${nombre}`,
    asistente: 'Guarda il tour di benvenuto',
  },
  env: {
    bloques: {
      meilisearch: 'Meilisearch (con la sua chiave)',
    },
  },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Ancora nessun motore di database',
      texto:
        'Installi MySQL, MariaDB, PostgreSQL o MongoDB da Servizi per creare e gestire i database dei suoi progetti.',
      accion: 'Vai a Servizi',
    },
    serviciosVacio: {
      titulo: 'Ancora nessun servizio installato',
      texto:
        'I servizi (Nginx, PHP, database…) fanno funzionare i suoi siti. Inizi con Nginx e PHP, oppure con un database.',
      accion: 'Installa un servizio',
    },
    registrosSinFuentes: {
      titulo: 'Ancora nessun log',
      texto:
        'I log compaiono appena un servizio, un sito o un processo scrive la sua prima riga. Avvii un servizio e torni qui.',
      accion: 'Vai a Servizi',
    },
    registrosElegir: {
      titulo: 'Scelga un log',
      texto: 'Scelga una fonte nel selettore qui sopra per seguirne le righe in tempo reale.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Non è ancora arrivato alcun dump',
      texto:
        "Quando un sito esegue dump(), dd() o wd(), il dump compare qui all'istante. Apra il suo sito ed esegua quel codice.",
      accion: '',
    },
    depuracionApagado: {
      titulo: "L'acquisizione è disattivata",
      texto:
        "Con l'acquisizione attiva, le chiamate dump() e dd() dei suoi siti arrivano qui senza toccare il browser. La attivi e avvii un sito.",
      accion: "Attiva l'acquisizione",
    },
    depuracionElegir: {
      titulo: 'Scelga un dump',
      texto: "Selezioni un dump dall'elenco per vederne il contenuto, il file e l'URL di origine.",
      accion: '',
    },
    erroresVacio: {
      titulo: 'Nessun errore nei log',
      texto:
        'Gli errori di PHP, Nginx e dei progetti compaiono qui, raggruppati, appena vengono scritti. Un elenco vuoto è una buona notizia.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Scelga un errore',
      texto: "Selezioni un errore dall'elenco per vederne la traccia e aprire il file nell'editor.",
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Non è ancora stato eseguito alcun controllo',
      texto:
        'Doctor controlla porte, hosts, certificati e versioni, e le dice come risolvere ciò che non funziona. Esegua il primo controllo.',
      accion: 'Controlla ora',
    },
    doctorSinHallazgos: {
      titulo: 'Tutto in ordine',
      texto:
        "L'ultimo controllo non ha trovato problemi. Controlli di nuovo se qualcosa smette di rispondere.",
      accion: 'Controlla di nuovo',
    },
    contenedoresVacio: {
      titulo: 'Nessun container',
      texto:
        'I container Docker o Podman di questo computer compaiono qui. Ne crei uno con docker run o docker compose e prema Aggiorna.',
      accion: 'Aggiorna',
    },
    avisos: {
      titulo: 'Nessun avviso',
      texto:
        'Qui compariranno i servizi interrotti, le porte occupate e i certificati in scadenza.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Ancora nessuna istantanea',
      texto:
        "Un'istantanea salva lo stato di questo database per poter tornare indietro se qualcosa va storto. Crei la prima con il pulsante qui sopra.",
      accion: '',
    },
    basesSinBases: {
      titulo: 'Questo server non ha database propri',
      texto: 'Crei un database per il suo progetto o importi un dump esistente.',
      accion: 'Crea database',
    },
    iaNube: {
      titulo: 'Ancora nessun provider IA',
      texto:
        'Un provider (OpenAI, Anthropic, OpenRouter e altri) permette ai suoi agenti di usare modelli nel cloud. La chiave viene memorizzata cifrata su questo computer.',
      accion: 'Aggiungi provider',
    },
    iaSinModelos: {
      titulo: 'Ancora nessun modello locale',
      texto: "Scarichi un modello dall'elenco qui sotto per usarlo offline.",
      accion: '',
    },
    versiones: {
      titulo: 'Nessuna versione da mostrare',
      texto:
        "L'elenco viene scaricato dal catalogo ufficiale. Controlli la connessione e aggiorni l'elenco.",
      accion: 'Aggiorna elenco',
    },
    buscar: {
      titulo: 'Nessuna corrispondenza',
      texto:
        'Nulla nella cartella corrisponde alla sua ricerca. Provi altre parole, deselezioni «Maiuscole/minuscole» o controlli i filtri dei file.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Tour di benvenuto',
    saltar: 'Salta',
    terminar: 'Inizia',
    cerrar: 'Chiudi il tour',
    reabrir: 'Prema Esc per uscire. Può rivederlo da Impostazioni › Aspetto.',
    ir: (destino) => `Vai a ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Benvenuto in WolfCore Dev',
        texto:
          "Il suo ambiente di sviluppo locale in un'unica finestra: servizi, siti .test con HTTPS, database, posta e strumenti. Questo tour dura un minuto e non modifica nulla sul suo computer.",
      },
      servicios: {
        titulo: 'Servizi',
        texto:
          'Attivi da qui Nginx, PHP e i database con un interruttore. Se non sono ancora installati, la scheda Versioni li scarica con un checksum verificato.',
      },
      proyectos: {
        titulo: 'Progetti',
        texto:
          'Crei un nuovo progetto o importi una cartella o un repository. Ogni sito ottiene il proprio indirizzo .test con HTTPS.',
      },
      bases: {
        titulo: 'Database',
        texto:
          "Crei database, importi ed esporti dump, ed esegua backup e ripristini senza uscire dall'app.",
      },
      herramientas: {
        titulo: 'Strumenti e Ctrl+K',
        texto:
          'Editor, ricerca, confronto, password, immagini e altro, raggruppati per sezione. Prema Ctrl+K in qualsiasi schermata per saltare a ciò che le serve.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Controlla porte, hosts, certificati e versioni, e suggerisce come risolvere ciò che non funziona. Lo apra quando qualcosa non risponde.',
      },
      listo: {
        titulo: 'Tutto pronto',
        texto:
          'Inizi attivando un servizio o creando il suo primo progetto. Può rivedere questo tour da Impostazioni › Aspetto.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v) => `Non è più nel catalogo: verrà installata ${v} al suo posto.`,
      },
      resultado: {
        sustituida: (v) => `È stata installata ${v} al posto della versione del profilo.`,
      },
    },
    motivos: {
      version_sustituida:
        'Quella versione non è più nel catalogo: è stata installata la più recente della stessa versione secondaria (ad esempio 8.3).',
    },
  },
  consultasLentas: {
    boton: 'Query lente',
    titulo: (motor) => `Query lente su ${motor}`,
    descripcion:
      'Le query che richiedono più del tempo che sceglie, dalla più lenta alla più veloce.',
    cargando: 'Caricamento delle query lente…',
    estadoTitulo: 'Stato del log',
    estadoActivo: (s) => `La registrazione è attiva: vengono registrate le query oltre ${s} s.`,
    estadoApagado: 'La registrazione è disattivata.',
    noGestionada:
      'WolfCore Dev non gestisce questo server (ad esempio uno avviato da un altro programma): qui può solo vederlo, non modificarlo.',
    umbral: 'Registra le query oltre (secondi)',
    activar: 'Attiva la registrazione',
    aplicarUmbral: 'Cambia il tempo',
    desactivar: 'Disattiva la registrazione',
    actualizar: 'Rileggi il log',
    confirmarTitulo: 'Cambia la registrazione delle query lente',
    confirmarActivar: (motor, s) =>
      `La registrazione verrà attivata per l'intero server ${motor} (query oltre ${s} s) e salvata nella sua configurazione. Riguarda tutti i suoi database.`,
    confirmarDesactivar: (motor) =>
      `La registrazione verrà disattivata per l'intero server ${motor} e salvata nella sua configurazione. Ciò che è già stato registrato viene conservato.`,
    confirmarBoton: 'Conferma la modifica',
    cancelar: 'Annulla',
    activado: 'Registrazione delle query lente attivata',
    desactivado: 'Registrazione delle query lente disattivata',
    privacidad:
      "L'SQL viene mostrato con i valori sostituiti da «?», perché può contenere dati reali dei clienti. Nulla di tutto ciò lascia questo computer né viene scritto nei log dell'applicazione.",
    columnas: {
      duracion: 'Durata',
      filas: 'Righe esaminate',
      base: 'Database',
      fecha: 'Data',
      sql: 'Query',
      acciones: 'Azioni',
    },
    sinBase: 'Non attribuita',
    verLiteral: 'Mostra il letterale',
    ocultarLiteral: 'Nascondi il letterale',
    literalAviso: "SQL così com'è, con i suoi valori",
    sqlOculto: 'SQL nascosto',
    sqlOcultoAyuda:
      'Questa query non può essere mostrata senza mettere a rischio dati reali: questo server ha database con dati reali oppure la query non può essere attribuita in modo sicuro a un database.',
    copiar: 'Copia',
    copiado: 'Query copiata',
    truncado: (n) =>
      `Vengono mostrate al massimo le ${n} query più lente dalla coda del log (gli ultimi 5 MB).`,
    vacioTitulo: 'Ancora nessuna query lenta registrata',
    vacioTextoApagado:
      'Attivi la registrazione e usi i suoi siti: le query che richiedono più del tempo scelto compariranno qui.',
    vacioTextoActivo:
      'Finora nessuna query ha superato il tempo scelto. Usi i suoi siti e rilegga il log.',
  },
  esquemaBd: {
    boton: 'Vedi schema',
    titulo: (base) => `Schema di ${base}`,
    descripcion:
      'Sola lettura: tabelle, colonne, chiavi e relazioni. Non viene letto alcun dato delle sue tabelle.',
    cargando: 'Lettura dello schema…',
    error: 'Non è stato possibile leggere lo schema del database.',
    reintentar: 'Riprova',
    buscar: 'Cerca una tabella',
    tablas: (n) => plural(n, 'tabella', 'tabelle'),
    vista: 'vista',
    truncado: (n) => `L'elenco è stato ridotto a ${n} tabelle: il database ne ha di più.`,
    sinResultados: 'Nessuna tabella corrisponde alla ricerca.',
    elegir: "Scelga una tabella dall'elenco per vederne colonne, chiavi e relazioni.",
    columnas: 'Colonne',
    indices: 'Indici',
    sinIndices: 'Questa tabella non ha indici.',
    relaciones: 'Relazioni',
    sinRelaciones: 'Questa tabella non ha relazioni con altre.',
    salientes: 'Fa riferimento a',
    entrantes: 'Referenziata da',
    alBorrar: "All'eliminazione:",
    alActualizar: "All'aggiornamento:",
    irA: (tabla) => `Vai alla tabella ${tabla}`,
    col: {
      nombre: 'Colonna',
      tipo: 'Tipo',
      nulo: 'Nullable',
      defecto: 'Predefinito',
      clave: 'Chiave',
    },
    si: 'Sì',
    no: 'No',
    pk: 'PK',
    unico: 'univoco',
    vacioTitulo: 'Questo database non ha tabelle',
    vacioTexto:
      'Quando creerà delle tabelle (ad esempio con le migrazioni del suo progetto) compariranno qui.',
  },
};
