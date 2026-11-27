/**
 * Testi dell'interfaccia in italiano (it-IT). Stesse chiavi e firme di es.ts.
 * Glossario fisso: servizio, istanza, sito, tunnel, backup, avviso; Doctor e WolfCore Dev
 * non si traducono. Tono formale e neutro (Lei), mai «tu»; fuori da Git sempre «versione».
 */
import type { Textos } from './es';

const plural = (n: number, uno: string, molti: string): string => `${n} ${n === 1 ? uno : molti}`;

export const it: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP e Nginx senza complicazioni',
    version: 'Versione',
  },
  nav: {
    inicio: 'Home',
    proyectos: 'Progetti',
    agentes: 'Agenti',
    servicios: 'Servizi',
    basesDeDatos: 'Database',
    correo: 'Posta',
    php: 'PHP',
    ia: 'IA',
    tuneles: 'Tunnel',
    contenedores: 'Container',
    herramientas: 'Strumenti',
    doctor: 'Doctor',
    depuracion: 'Debug',
    registros: 'Log',
    ajustes: 'Impostazioni',
    contraer: 'Comprimere menu',
    expandir: 'Espandere menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'servizio avviato', 'servizi avviati'),
    tuneles: (n: number) => plural(n, 'tunnel attivo', 'tunnel attivi'),
    cargando: 'Connessione al core in corso…',
    conErrores: 'con errori',
    sinConexion: 'Nessuna connessione al core',
  },
  estado: {
    encendido: 'Avviato',
    apagado: 'Arrestato',
    iniciando: 'Avvio in corso…',
    error: 'Errore',
    externo: 'Esterno',
    activo: 'Attivo',
    aviso: 'Attenzione',
  },
  acciones: {
    encender: 'Avviare',
    apagar: 'Arrestare',
    iniciarTodo: 'Avviare tutto',
    detenerTodo: 'Arrestare tutto',
    abrir: 'Aprire',
    copiar: 'Copiare',
    copiado: 'Copiato negli appunti',
    guardar: 'Salvare',
    cerrar: 'Chiudere',
    abrirCarpeta: 'Aprire cartella',
    instalar: 'Installare',
    reintentar: 'Riprovare',
    cancelar: 'Annullare',
    borrar: 'Eliminare',
    editar: 'Modificare',
    duplicar: 'Duplicare',
    renovar: 'Rinnovare',
    masAcciones: 'Altre azioni',
    actualizar: 'Aggiornare',
    quitar: 'Rimuovere',
    reinstalar: 'Reinstallare',
  },
  errores: {
    titulo: 'Impossibile completare l\'azione',
    arranque: 'Impossibile leggere lo stato dell\'ambiente',
    desconocido: 'Si è verificato un errore imprevisto.',
    /** Dettagli che il core invia come codice all'interno di un errore. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'virgolette non chiuse',
      'sintaxis.tras_comillas': 'manca uno spazio o «;» dopo le virgolette',
      'sintaxis.punto_y_coma_inesperado': '«;» senza direttiva',
      'sintaxis.llave_inesperada': '«{» senza direttiva',
      'sintaxis.falta_punto_y_coma': 'manca «;» alla fine della direttiva',
      'sintaxis.sobra_llave': '«}» in eccesso',
      'sintaxis.falta_llave': 'manca una «}»',
    },
    codigos: {
      'git.cambios_locales':
        'Ci sono modifiche non salvate nella cartella: le salvi (commit) o le scarti prima di scaricare gli aggiornamenti. Non è stato modificato nulla.',
      'git.divergencia':
        'Il ramo è divergente rispetto al remoto (ci sono commit locali e remoti diversi): risolva manualmente. Non è stato modificato nulla.',
      'git.sin_upstream':
        'Il ramo attuale non segue alcun ramo remoto: non c\'è alcuna origine da cui scaricare le modifiche.',
      'git.sin_rama': 'Il repository è su un commit scollegato (senza ramo): non è stato modificato nulla.',
      'git.no_repositorio': 'La cartella non è un repository git.',
      'git.destino_no_vacio': 'La cartella di destinazione non è vuota.',
      'git.destino_es_archivo': 'La destinazione è un file, non una cartella.',
      'git.no_encontrado': 'git non trovato: lo installi prima.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) non trovato: lo installi prima.',
      'git.plazo': 'La clonazione ha superato il limite di {minutos} min ed è stata annullata.',
      'git.token_invalido': 'Il token di GitHub non è valido.',
      'git.url_con_credenciales':
        'L\'URL non deve contenere utente né password: usi un token separatamente.',
      'servicios.desconocido': 'Servizio sconosciuto: {id}.',
      'servicios.no_instalado': '{nombre} non è installato. Lo installi da Servizi.',
      'servicios.puerto_invalido': 'La porta deve essere un numero compreso tra 1024 e 65535.',
      'servicios.puerto_asignado': 'La porta {puerto} è già assegnata a {otro}.',
      'servicios.puerto_ocupado':
        'La porta {puerto} è utilizzata da {nombre} (PID {pid}). Lo chiuda o scelga un\'altra porta.',
      'servicios.confirmacion_borrado': 'Per eliminare i dati di {nombre} digiti "{id}".',
      'servicios.ftp_no_disponible': 'Il server FTP non è disponibile.',
      'sistema.sin_cliente_ftp':
        'Non è presente un client FTP associato su questo computer. Ne installi uno (ad esempio FileZilla) o copi l\'indirizzo.',
      'servicios.mailpit_no_responde': 'Mailpit non risponde. Lo avvii da Servizi.',
      'servicios.iniciar_todo_fallos':
        'Avviare tutto non è riuscito ad avviare: {nombres}. Controlli Servizi e i relativi log.',
      'servicios.respaldo_fallo':
        '{nombre} non è stato aggiornato: il backup preventivo non è riuscito e non è stato modificato nulla.',
      'servicios.espacio_insuficiente':
        'Spazio insufficiente per copiare i dati: sono necessari {necesarios} MB e restano {libres} MB liberi.',
      'servicios.actualizacion_revertida':
        'La versione {version} non si è avviata; {nombre} è tornato a {anterior}. Il backup viene conservato.',
      'servicios.restauracion_fallo':
        'La nuova versione non si è avviata e non è stato possibile ripristinare i dati di {nombre}. Non è stato avviato nulla: i dati modificati si trovano in {fallida} e il backup in {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} appartiene a una versione principale diversa: la crei come nuova istanza.',
      'servicios.misma_version': '{id} utilizza già la versione {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} è bloccata: un aggiornamento non è riuscito a ripristinare i dati. I dati modificati si trovano in {fallida} e il backup in {respaldo}. Risolva il problema in Servizi → Versioni prima di avviarla.',
      'servicios.datos_apartados':
        '{nombre} non ha dati nella propria cartella, ma sono presenti dati messi da parte da un aggiornamento: non viene creata una cartella vuota. Controlli Servizi → Versioni.',
      'servicios.puerto_reservado':
        'La porta {puerto} è riservata dal sistema ({desde}–{hasta}): ne scelga un\'altra.',
      'servicios.borrado_con_bloqueo':
        '{nombre} ha un\'istanza bloccata dopo un aggiornamento: la risolva prima di eliminare i suoi dati.',
      'servicios.config_no_revertida':
        '{nombre} {version} non si è avviato e non è stato possibile tornare a {anterior} nella configurazione. Selezioni nuovamente {anterior} in Servizi → Versioni.',
      'servicios.puerto_revertido_apagada':
        '{nombre} non si è avviato sulla nuova porta; si è tornati alla {anterior}, ma non si è avviato nemmeno lì: è rimasto arrestato sulla porta {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} non si è avviato sulla porta {nuevo} e non è stato possibile tornare alla {anterior} nella configurazione: è rimasto arrestato.',
      'instancias.id_invalido': 'L\'identificatore dell\'istanza non è valido.',
      'instancias.no_existe': 'L\'istanza {id} non esiste.',
      'instancias.existe': 'L\'istanza {id} esiste già.',
      'instancias.una_sola': '{nombre} supporta una sola istanza.',
      'instancias.ultima': '{id} è l\'unica istanza: non è possibile rimuoverla.',
      'instancias.sin_puerto_libre': 'Non è stata trovata alcuna porta libera per l\'istanza.',
      'instancias.confirmacion': 'Per continuare digiti "{id}".',
      'instancias.sin_datos': '{id} non ha dati nella propria cartella: scelga un backup da ripristinare.',
      'instancias.respaldo_no_existe': 'Quel backup di {id} non esiste.',
      'instancias.respaldo_en_uso':
        'Quella copia è necessaria a {id}, che è bloccata: risolva prima il problema.',
      'instancias.version_requerida':
        'Non è noto a quale versione riportare {id}: scelga una versione installata della stessa versione principale.',
      'instalador.version_en_uso':
        'Impossibile disinstallare {servicio} {version}: è utilizzata dall\'istanza {instancia}.',
      'limpieza.sin_confirmar': 'Manca la conferma per la pulizia delle versioni.',
      'limpieza.seleccion_invalida': 'La selezione delle versioni non è valida.',
      'limpieza.en_curso': 'È già in corso una pulizia delle versioni.',
      'limpieza.no_existe': '{servicio} {version} non è più installato.',
      'limpieza.en_uso': '{servicio} {version} è tornato in uso: non è stato rimosso.',
      'limpieza.ruta_insegura':
        'La cartella di {servicio} {version} non è sicura (un collegamento o un percorso fuori da bin): non è stata toccata.',
      'limpieza.version_bloqueada':
        '{servicio} {version} contiene file in uso o bloccati: non è stato rimosso né lasciato a metà.',
      'limpieza.otro_volumen':
        '{servicio} {version} si trova su un disco diverso rispetto alla cartella temporanea dei dati: impossibile spostarlo interamente, non è stato toccato.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} contiene pacchetti installati da Lei (npm, pip…): è necessario accettarne la perdita per rimuoverlo.',
      'limpieza.destino_ocupado':
        'Esiste già una cartella di {servicio} {version} in bin: non viene sovrascritta. La rimuova prima di recuperare l\'altra.',
      'bd.encender_servicio': 'Avvii {nombre} per gestire i suoi database.',
      'bd.sin_credenciales': 'Non ci sono credenziali salvate per {nombre}.',
      'bd.confirmacion_borrado': 'Per eliminare il database {nombre} digiti il suo nome esatto.',
      'bd.usuario_privilegiado':
        'L\'utente {usuario} è un amministratore o un ruolo di sistema: scelga un utente dedicato per il progetto.',
      'bd.usuario_en_uso':
        'Un altro progetto utilizza già l\'utente {usuario}: la sua password non viene modificata per non lasciarlo senza connessione. Non è stato creato nulla.',
      'bd.rol_sin_login':
        'L\'utente {usuario} esiste ma non può accedere (ruolo senza LOGIN o regola di accesso del server). Non è stato modificato nulla.',
      'bd.usuario_clave_distinta':
        'L\'utente {usuario} esiste già con un\'altra password. Usi la sua password attuale: non viene modificata per non lasciare senza connessione altri progetti.',
      'bd.mongosh_faltante': 'Manca mongosh: lo installi da Servizi per gestire MongoDB.',
      'tuneles.sitio_no_encontrado': 'Progetto non trovato.',
      'tuneles.confirmacion_requerida':
        'Pubblicare {dominio} su internet richiede una conferma in WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Il tunnel di {dominio} è cambiato dopo la conferma: confermi nuovamente.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared non è installato. Lo installi da Servizi.',
      'tuneles.proveedor_no_disponible': 'Il provider di tunnel {proveedor} non è disponibile.',
      'tuneles.cloudflare_sin_cuenta':
        'Colleghi prima il Suo account Cloudflare nelle opzioni del tunnel.',
      'tuneles.cloudflare_sin_credencial':
        'Questo tunnel non ha credenziali salvate: lo crei nuovamente nelle opzioni del tunnel.',
      'tuneles.cloudflare_datos_invalidos':
        'Il nome del tunnel (lettere minuscole, numeri e trattini) o il dominio pubblico non sono validi.',
      'tuneles.cloudflare_conexion_en_curso': 'È già in corso una connessione con Cloudflare.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare ha registrato {registrado} invece di {dominio}: il dominio non appartiene alla zona autorizzata. Elimini quel record dal pannello di Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'Il tunnel {nombre} ha connessioni attive (cloudflared richiede -f per eliminarlo). Lo chiuda su tutti i computer in cui è aperto e riprovi, oppure usi «Dimenticare solo qui».',
      'tuneles.nombre_en_uso': 'Il tunnel {nombre} è già utilizzato da un altro sito.',
      'tuneles.dominio_en_uso': 'Il dominio {dominio} è già utilizzato da un altro sito.',
      'tuneles.confirmacion_olvidar': 'Dimenticare o ricreare il tunnel {nombre} richiede una conferma.',
      'tuneles.cloudflare_fallo': 'cloudflared non è riuscito a completare l\'operazione: {detalle}',
      'tuneles.credencial_no_protegida':
        'Impossibile limitare le credenziali all\'utente, pertanto non sono state utilizzate.',
      'tuneles.sin_cifrado':
        'La crittografia di sistema non è disponibile: impossibile salvare le credenziali.',
      'tuneles.token_invalido':
        'Il token non è valido: solo lettere, numeri e _ . - (da 8 a 200 caratteri). Lo salvi nuovamente nelle opzioni del tunnel.',
      'tuneles.ngrok_no_instalado':
        'ngrok non è installato su questo computer. Lo installi da ngrok.com e riprovi.',
      'tuneles.ngrok_sin_token': 'Manca il token di ngrok: lo salvi nelle opzioni del tunnel.',
      'tuneles.expose_sin_token': 'Manca il token di Expose: lo salvi nelle opzioni del tunnel.',
      'tuneles.tailscale_no_instalado':
        'Tailscale non è installato su questo computer. WolfCore Dev non lo installa: lo installi da tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale non ha una sessione attiva: effettui l\'accesso in Tailscale e riprovi.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale pubblica già qualcosa sulla porta HTTPS {puerto}. WolfCore Dev non lo sovrascrive: lo rimuova tramite Tailscale e riprovi.',
      'lan.sitio_no_encontrado': 'Sito non trovato.',
      'lan.confirmacion_requerida':
        'Condividere {dominio} sulla rete locale richiede una conferma in WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} contiene dati reali: non può essere condiviso sulla rete locale, nemmeno con conferma. Usi una copia priva di dati dei clienti.',
      'lan.sin_red':
        'Nessuna rete locale connessa (Wi-Fi o Ethernet). Si connetta a una rete e riprovi.',
      'lan.ip_no_valida':
        'L\'indirizzo {ip} non appartiene più alla Sua rete locale. Riapra la finestra di dialogo e confermi nuovamente.',
      'lan.requiere_https': '{dominio} reindirizza a HTTPS: lo condivida con l\'opzione HTTPS.',
      'lan.sin_puertos':
        'Non ci sono porte libere tra 8100 e 8199 per la rete locale (i siti condivisi e il link della CA utilizzano questo intervallo). Interrompa la condivisione di un sito o chiuda la finestra della CA e riprovi.',
      'tuneles.expose_no_instalado':
        'Expose non è installato. Su Windows funziona solo con expose.phar: lo inserisca in {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose non viene utilizzato con siti contenenti dati reali: il suo inspector delle richieste rimane visibile su tutta la rete locale. Usi un altro provider.',
      'tuneles.confirmacion_requerida_tailnet':
        'Condividere {dominio} con la Sua tailnet richiede una conferma in WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Impossibile leggere ciò che Tailscale pubblica già su questo computer, pertanto non è stato aperto nulla per evitare sovrascritture. Verifichi che Tailscale sia in esecuzione e riprovi.',
      'tuneles.tailscale_no_habilitado':
        'Serve o Funnel non è abilitato nella Sua tailnet. Lo abiliti da {enlace} e riprovi.',
      'tuneles.ngrok_desactualizado':
        'La Sua versione di ngrok è obsoleta e non supporta ciò che serve a WolfCore Dev. Lo aggiorni (ngrok update) e riprovi.',
      'hosts.dominio_invalido': 'È presente un dominio non valido.',
      'hosts.tiempo_agotado':
        'Nessuna risposta alla richiesta di autorizzazione amministratore entro {segundos} s; il file hosts è rimasto invariato.',
      'https.sin_dominio': 'Un certificato richiede almeno un dominio.',
      'https.sin_autoridad':
        'L\'autorità di certificazione di WolfCore Dev non esiste. Installi la CA dalla sezione HTTPS prima di emettere certificati.',
      'herramientas.pid_invalido': 'Il PID non è valido.',
      'herramientas.pid_sistema': 'Il PID {pid} è un processo di sistema e non può essere terminato.',
      'herramientas.proceso_propio':
        'Non è possibile terminare WolfCore Dev né il processo che lo ha avviato.',
      'herramientas.proceso_inexistente': 'Il processo {pid} non esiste più.',
      'herramientas.sin_editor':
        'Nessun editor di codice trovato. Ne installi uno (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} non è installato. Scelga un altro editor in Impostazioni.',
      'herramientas.editor_invalido': 'Questo editor non è valido.',
      'herramientas.carpeta_sitio_inexistente': 'La cartella del progetto non esiste.',
      'herramientas.ruta_no_absoluta': 'Il percorso deve essere assoluto.',
      'herramientas.sin_seleccion': 'Selezioni almeno un elemento.',
      'herramientas.dominio_invalido': 'È presente un dominio o un indirizzo IP non valido.',
      'herramientas.demasiados_dominios':
        'Un certificato supporta al massimo {maximo} domini o indirizzi IP.',
      'buscar.consulta_invalida': 'Digiti cosa cercare (fino a 500 caratteri).',
      'buscar.raiz_invalida': 'La cartella o il file non esiste o non è valido.',
      'buscar.regex_invalida': 'L\'espressione regolare non è valida.',
      'buscar.regex_lenta':
        'L\'espressione regolare impiega troppo tempo: la semplifichi o usi testo letterale.',
      'buscar.demasiadas': 'Sono già in corso {maximo} ricerche: ne annulli una o attenda.',
      'terminal.no_abrio': 'Impossibile aprire il terminale.',
      'terminal.no_instalada': '{nombre} non è installato. Scelga un altro terminale in Impostazioni.',
      'terminal.invalida': 'Questo terminale non è valido.',
      'terminal.powershell_restringido':
        'PowerShell è in modalità linguaggio limitato su questo computer (criterio aziendale o AppLocker): WolfCore Dev non può aprire il terminale. Lo apra manualmente nella cartella del progetto.',
      'proyectos.no_existe': 'Il progetto non esiste.',
      'proyectos.no_confiado': 'Selezioni "Mi fido di questo repository" per eseguire la ricetta.',
      'proyectos.receta_en_curso': 'È già in corso una ricetta per questo progetto.',
      'proyectos.paso_no_omitible': 'Il passaggio "Creare il sito" non può essere omesso.',
      'workspaces.no_existe': 'Questo workspace non esiste.',
      'workspaces.invalido': 'Il workspace non è valido: controlli il nome e i suoi elementi.',
      'workspaces.captadores_exclusivos':
        'Due catturatori di posta non possono essere avviati contemporaneamente: ne è consentito solo uno.',
      'workspaces.elemento_fallo':
        'Impossibile completare l\'operazione con {elemento}. Controlli Servizi e i relativi log.',
      'workspaces.base_no_responde':
        '{elemento} non è stato avviato perché il database di quel progetto non risponde.',
      'tareas.cron_invalida':
        'L\'espressione cron non è valida. Usi 5 campi: minuto, ora, giorno del mese, mese e giorno della settimana (ad esempio, 0 3 * * *).',
      'tareas.comando_invalido':
        'Il comando non è consentito. Usi php, node, npm run o python con un file del progetto, senza codice in linea (-r, -e, -c).',
      'tareas.invalida': 'L\'attività non è valida: controlli il nome, la pianificazione e il comando.',
      'tareas.no_existe': 'Questa attività non esiste più.',
      'tareas.sin_confirmar': 'Confermi il comando dell\'attività per poterla eseguire.',
      'tareas.sitio_no_confiado':
        'Selezioni «Mi fido di questo repository» nel progetto per eseguire le sue attività.',
      'tareas.receta_cambio':
        'La ricetta del progetto è cambiata da quando ha accordato la fiducia: la controlli e selezioni nuovamente «Mi fido di questo repository».',
      'tareas.aislado':
        'Questa è una cartella di dati di test (WOLFCORE_DATOS): consenta le attività pianificate per eseguirle.',
      'tareas.carpeta': 'La cartella del progetto non esiste: l\'attività non può essere eseguita.',
      'tareas.en_curso': 'L\'attività è già in esecuzione.',
      'tareas.demasiadas': 'Ci sono troppe attività in questo progetto (massimo {maximo}).',
      'cli.no_autorizado':
        'Il comando della CLI non è autorizzato: lo esegua nuovamente con l\'app WolfCore Dev aperta.',
      'cli.orden_desconocida': 'WolfCore Dev non riconosce questo comando della CLI.',
      'cli.argumentos_invalidos': 'Gli argomenti del comando non sono validi.',
      'cli.solicitud_grande': 'La richiesta è troppo grande (massimo {maximo} byte).',
      'cli.formato_no_admitido': 'La richiesta non ha il formato accettato dalla CLI.',
      'cli.plazo':
        'Il comando ha impiegato troppo tempo: potrebbe essere ancora in corso. Controlli lo stato in WolfCore Dev.',
      'cli.ocupado':
        'WolfCore Dev sta gestendo troppi comandi della CLI: attenda un momento.',
      'cli.requiere_confirmacion':
        'Questo comando pubblica o modifica qualcosa e richiede conferma (--si) su {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} contiene dati reali: confermi anche con l\'opzione dati reali del comando (il dominio del sito).',
      'cli.requiere_confirmacion_global':
        'Cambiare il PHP di tutti i terminali richiede conferma (--si).',
      'cli.confirmacion_rechazada':
        'La conferma nella finestra di WolfCore Dev è stata rifiutata o non era disponibile: non è stato eseguito nulla.',
      'cli.confirmacion_vencida':
        'Nessuno ha confermato in tempo nella finestra di WolfCore Dev: non è stato eseguito nulla.',
      'cli.tunel_fallo': 'Impossibile aprire il tunnel. Controlli il relativo log in WolfCore Dev.',
      'cli.inicio_fallo':
        'Impossibile avviare tutto quanto richiesto. Controlli i log in WolfCore Dev.',
      'cli.parada_fallo':
        'Impossibile arrestare tutto quanto richiesto. Controlli i log in WolfCore Dev.',
      'cli.interno': 'Errore interno del server della CLI.',
      'cli.proveedor_distinto':
        'Il sito utilizza un altro provider di tunnel ({proveedor}). Controlli e confermi nuovamente.',
      'cli.sitio_no_encontrado': 'Il sito {sitio} non esiste.',
      'cli.carpeta_invalida':
        'La cartella non esiste, è una cartella di sistema oppure è la cartella dati di WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Questa cartella non appartiene ad alcun sito di WolfCore Dev: la colleghi prima.',
      'cli.ya_vinculada': 'Questa cartella è già il sito {sitio}.',
      'cli.tipo_no_soportado':
        'I progetti di tipo {tipo} vanno creati dall\'interfaccia di WolfCore Dev.',
      'cli.sitio_sin_php': 'Il sito {sitio} non utilizza PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} non è installato. Lo installi da Servizi.',
      'cli.fuente_no_existe': 'Questo log non esiste ancora.',
      'cli.token_no_protegido':
        'Impossibile limitare il file del token all\'utente corrente: la CLI non viene attivata.',
      'cli.carpeta_ajena':
        'La cartella run/ della cartella dati appartiene a un altro utente: la CLI non viene attivata.',
      'cli.ruta_invalida': 'Il percorso di WolfCore Dev contiene caratteri non supportati da wolf.cmd.',
      'cli.path_aislado':
        'Con una cartella di dati di test (WOLFCORE_DATOS) il PATH dell\'utente non viene modificato.',
      'cli.sin_cliente': 'Questa versione di WolfCore Dev non include il client wolf (manca la compilazione).',
      'cli.demasiados_dialogos':
        'Troppe conferme nell\'ultimo minuto: attenda un momento e riprovi.',
      'cli.error': 'Impossibile completare il comando: {detalle}',
      'proyectos.carpeta_no_vacia':
        'La cartella del progetto contiene già dei file: ne scelga un\'altra o la svuoti.',
      'secretos.sin_cifrado':
        'La crittografia di sistema non è disponibile: impossibile salvare la password dell\'utente dedicato. Non è stato modificato nulla.',
      'proyectos.clave_bd_falta':
        'Manca la password salvata dell\'utente {usuario}: non è stato scritto nulla. Nel gestore di .env, "Usare utente dedicato" genera una nuova password.',
      'env.archivo_grande': 'Il file delle variabili è troppo grande (massimo {maximo}).',
      'env.no_regular': 'Il file .env non è un file normale: non viene letto né modificato.',
      'env.clave_inexistente': 'La variabile {clave} non esiste.',
      'env.cambio_invalido': 'Una modifica del file .env non è valida.',
      'env.variable_invalida': 'La modifica della variabile {clave} non è valida.',
      'env.solo_lectura': 'La variabile {clave} occupa più righe: la modifichi manualmente nel file.',
      'env.usuario_compartido':
        'Il database {base} è utilizzato anche dal progetto {proyecto}: confermi se desidera condividere il suo utente.',
      'env.cambio_externo':
        'Il file .env è cambiato da quando è stata mostrata l\'anteprima: lo controlli nuovamente prima di salvare.',
      'env.sin_confirmar': 'Confermi di voler salvare le modifiche del file .env.',
      'env.versionado':
        'Git sta già tracciando il file .env di questo progetto: il prossimo commit ne caricherebbe i valori. Confermi separatamente per continuare.',
      'env.versionado_desconocido':
        'Impossibile verificare se git traccia il file .env di questo progetto: confermi separatamente per continuare.',
      'env.copia_invalida': 'La copia del file .env non è valida o non esiste più.',
      'env.sin_base': 'Il file .env di questo progetto non contiene una connessione a un database.',
      'env.base_no_resuelta':
        'Il database di questo progetto non appartiene a un server locale di WolfCore Dev: non è stato modificato nulla.',
      'env.motor_no_soportado': 'Al momento "Usare utente dedicato" funziona con MySQL e MariaDB.',
      'env.ya_usa_usuario_propio': 'Questo progetto utilizza già un utente dedicato.',
      'plantillas.id_invalido': 'L\'identificatore del modello non è valido.',
      'plantillas.no_existe': 'Il modello non esiste.',
      'plantillas.danada':
        'Il modello è danneggiato o è stato modificato: non viene utilizzato. Lo elimini e lo salvi nuovamente.',
      'plantillas.demasiado_grande':
        'Il progetto ha troppi file o è troppo pesante per essere salvato come modello (fino a {maximo} file). Escluda le cartelle grandi.',
      'plantillas.demasiado_pesada':
        'Il progetto è troppo pesante per essere salvato come modello (fino a {maximo}). Escluda le cartelle grandi.',
      'plantillas.exclusion_invalida':
        'Una delle esclusioni non è valida (usi nomi o percorsi relativi, senza "..").',
      'plantillas.nombre_invalido':
        'Il nome del modello non è valido (da 1 a 60 caratteri).',
      'plantillas.esquema_fallo':
        'Impossibile leggere lo schema del database del progetto: verifichi che il relativo servizio sia avviato.',
      'plantillas.base_no_resuelta':
        'Impossibile salvare il modello: il server del database è remoto oppure nessuno dei servizi locali utilizza quella porta.',
      'plantillas.sin_generador_base':
        'Questo tipo di progetto non ha un generatore di base: il modello deve includere i file del progetto.',
      'plantillas.exclusiones_nuevas':
        'Il modello contiene un file che ora viene escluso ({archivo}): lo salvi nuovamente dal progetto oppure lo elimini.',
      'plantillas.motor_distinto':
        'Lo schema del modello è di MySQL e il server selezionato è MariaDB (o viceversa): potrebbero esserci differenze. Confermi di voler continuare.',
      'bd.sql_no_permitido':
        'Lo schema contiene un\'istruzione non strutturale e non è stato eseguito nulla: {sentencia}',
      'bd.extension_no_permitida':
        'Lo schema richiede l\'estensione {nombre}, che non è nell\'elenco consentito: non è stato ripristinato nulla.',
      'bd.esquema_fallo': 'Impossibile ripristinare lo schema completo: non è stato lasciato nulla a metà.',
      'bd.datos_no_permitidos':
        'Il dump dei dati contiene elementi che non sono dati (sono accettati solo INSERT, LOCK TABLES e SET): non è stato importato nulla.',
      'bd.datos_fallo':
        'Impossibile importare i dati: il database è rimasto invariato, senza modifiche parziali.',
      'perfiles.destino_invalido': 'Scelga dove salvare il profilo (un file .wolfperfil).',
      'perfiles.frase_debil': 'La passphrase della CA deve contenere almeno {minimo} caratteri.',
      'perfiles.frase_incorrecta': 'La passphrase non è corretta: non è stato importato nulla.',
      'perfiles.certificados_sin_ca':
        'I certificati dei siti vengono esportati solo insieme alla CA cifrata: includa la CA con una passphrase.',
      'perfiles.no_existe': 'Il file del profilo non esiste.',
      'perfiles.danado': 'Il profilo è danneggiato o è stato modificato: non è stato importato nulla.',
      'perfiles.demasiado_grande': 'Il profilo è troppo grande (fino a {maximo}).',
      'perfiles.version_no_soportada':
        'Il profilo appartiene a una versione più recente di WolfCore Dev (formato {version}): aggiorni l\'app per importarlo.',
      'perfiles.sin_confirmar': 'Confermi di voler importare il profilo.',
      'perfiles.vista_previa_vieja':
        'La cartella dei dati o il profilo sono cambiati dall\'anteprima: la controlli di nuovo.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS non è una cartella dati valida: deve essere assoluta, non di sistema e diversa dalla cartella reale.',
      'perfiles.confirmar_reemplazar_ca':
        'Il profilo include una CA e questo computer ha già la propria: confronti l\'impronta e confermi separatamente di volerla sostituire (solo se è la Sua CA).',
      'herramientas.imagen_tipo':
        'Questo file non è un\'immagine supportata (PNG, JPG, WebP, GIF, BMP o ICO) o il suo contenuto non corrisponde al tipo.',
      'herramientas.imagen_grande': 'L\'immagine è troppo pesante (fino a {maximo}).',
      'herramientas.imagen_dimensiones':
        'L\'immagine è troppo grande ({ancho}×{alto} px; fino a {maximo} px per lato) e non viene aperta per sicurezza.',
      'herramientas.zip_sin_archivos': 'Non ci sono file da comprimere (i collegamenti non vengono seguiti).',
      'herramientas.zip_demasiados': 'Ci sono troppi file da comprimere (fino a {maximo}).',
      'herramientas.zip_grande': 'Gli elementi da comprimere sono troppo pesanti (fino a {maximo}).',
      'herramientas.pdf_invalido': 'Il file non è un PDF ottimizzabile.',
      'herramientas.pdf_grande': 'Il PDF è troppo pesante (fino a {maximo}).',
      'herramientas.pdf_cifrado': 'Il PDF è protetto da password e non può essere ottimizzato.',
      'herramientas.pdf_plazo': 'L\'elaborazione del PDF ha impiegato più di {segundos} s ed è stata annullata.',
      'herramientas.salida_ocupada': 'Impossibile trovare un nome libero per il nuovo file.',
      'conversor.formato': 'Questa conversione non è disponibile.',
      'conversor.archivo_invalido':
        'Il file è danneggiato o non corrisponde al tipo indicato dalla sua estensione.',
      'conversor.archivo_grande': 'Il file è troppo pesante (fino a {maximo}).',
      'conversor.archivo_peligroso':
        'Il file sembra una ZIP bomb o è stato manipolato (contenuto eccessivo, entità XML o nomi non validi) e non viene aperto per sicurezza.',
      'conversor.limite_filas': 'La tabella ha troppe righe (fino a {maximo}).',
      'conversor.limite_columnas': 'La tabella ha troppe colonne (fino a {maximo}).',
      'conversor.limite_paginas': 'Il PDF ha troppe pagine (fino a {maximo}).',
      'conversor.pdf_cifrado': 'Il PDF è protetto da password e non può essere convertito.',
      'conversor.plazo': 'La conversione ha impiegato più di {segundos} s ed è stata annullata.',
      'conversor.cancelado': 'Conversione annullata.',
      'conversor.libreoffice_ausente':
        'Questa conversione richiede LibreOffice, che non è installato su questo computer (WolfCore Dev non lo installa).',
      'conversor.libreoffice_fallo': 'LibreOffice non è riuscito a convertire il documento.',
      'conversor.limite_celdas': 'La tabella ha troppe celle (fino a {maximo}).',
      'conversor.memoria': 'Il file richiede troppa memoria (oltre {maximo}) e l\'operazione è stata annullata.',
      'conversor.pdf_no_disponible': 'La stampa su PDF non è disponibile in questo momento.',
      'herramientas.imagen_pixeles':
        'L\'immagine ha troppi pixel in totale ({ancho}×{alto} px; fino a {maximo}) e non viene aperta per sicurezza.',
      'herramientas.zip_cambio': 'Un file è cambiato durante la compressione: riprovi.',
      'herramientas.pdf_demasiado_complejo':
        'Il PDF è troppo complesso (richiederebbe più memoria di quella consentita) e l\'operazione è stata annullata.',
      'herramientas.salida_denegada':
        'Impossibile scrivere in quella posizione: controlli i permessi o verifichi che la cartella esista.',
      'herramientas.fuera_de_la_ca':
        'La CA di WolfCore Dev firma solo domini .test, localhost e indirizzi locali: {dominio} non può essere incluso.',
      'perfiles.frase_requerida':
        'Inserisca la passphrase del profilo per importare i database o la CA (oppure importi senza i database).',
      'perfiles.sin_espacio':
        'Spazio libero insufficiente per importare il profilo: servono {necesarios} e sono disponibili {libres}.',
      'perfiles.ca_sin_restricciones':
        'Questa CA può firmare qualsiasi sito web: la importi solo se è la Sua e confronti l\'impronta. Confermi separatamente per continuare.',
      'perfiles.ca_restricciones_ajenas':
        'La CA del profilo ha restrizioni sui nomi diverse da quelle di WolfCore Dev: non viene importata.',
      'perfiles.instantanea_fallo':
        'Impossibile salvare il backup preventivo dell\'ambiente: non è stato modificato nulla. Controlli lo spazio su disco e i permessi della cartella dati.',
      'perfiles.en_curso': 'È già in corso un\'importazione di profilo: attenda che termini.',
      'importar.origen_apagado':
        'Impossibile connettersi al server database dell\'altro programma: lo avvii da quel programma e riprovi. I siti sono stati comunque importati.',
      'importar.origen_no_local': 'Il server di origine deve trovarsi su questo computer (127.0.0.1).',
      'importar.origen_rechazado': 'Il server di origine ha rifiutato il nome utente o la password.',
      'importar.origen_version':
        'La versione del server di origine non può essere importata con ciò che è installato in WolfCore Dev.',
      'importar.volcado_enorme':
        'I dati del database superano {maximo} MB: non possono essere importati in un\'unica operazione.',
      'importar.motor_no_soportado':
        'Da altri programmi vengono importati solo database MySQL e MariaDB.',
      'importar.ruta_fuera':
        'È stata scartata una cartella o un file che punta fuori dall\'installazione o a una cartella di sistema.',
      'importar.carpeta_invalida': 'È stata scartata una cartella che non esiste più o non è una cartella.',
      'importar.archivo_grande':
        'Un file di configurazione supera {maximo} KB e non è stato letto.',
      'importar.archivo_ilegible': 'Un file di configurazione non è un file di testo o non è stato possibile leggerlo.',
      'importar.demasiados':
        'Ci sono troppi siti o file di configurazione: sono stati letti solo i primi.',
      'importar.candidato_desconocido':
        'Quel sito non compare più nel programma di origine: esegua una nuova ricerca.',
      'importar.ya_vinculado': 'Quella cartella è già un sito di WolfCore Dev.',
      'importar.dominio_existe':
        'Esiste già un sito con il dominio {dominio}: lo modifichi prima di importare.',
      'importar.sin_php':
        'Questo sito richiede PHP e non c\'è alcuna versione installata: la installi da Servizi.',
      'importar.base_existe':
        'Il database {nombre} esiste già nella destinazione e non è stato toccato. Confermi la sostituzione per importarlo (viene effettuato prima un backup).',
      'importar.base_fallo':
        'Impossibile importare il database {nombre}: è rimasto invariato, senza modifiche parziali.',
      'importar.sitio_fallo': 'Impossibile creare il sito.',
      'importar.origen_invalido':
        'I dati del server di origine non sono validi (utente, password o porta).',
      'importar.sin_seleccion': 'Selezioni almeno un sito da importare.',
      'importar.en_curso': 'È già in corso un\'importazione: attenda che termini.',
      'importar.cancelado': 'Importazione annullata: ciò che era in corso di importazione è rimasto invariato.',
      'importar.origen_estancado':
        'Il server dell\'altro programma ha smesso di rispondere durante il dump: il database non è stato importato.',
      'importar.sin_espacio':
        'Spazio libero insufficiente per importare il database: servono circa {necesarios} MB e sono disponibili {libres} MB.',
      'importar.origen_fallo': 'Impossibile eseguire il dump del database dell\'altro programma.',
      'importar.clave_no_ascii':
        'La password contiene accenti o simboli che non possono essere passati al dump: usi una password con soli caratteri ASCII.',
      'plantillas.sin_esquema': 'Il modello non include lo schema di un database.',
      'proyectos.carpeta_invalida': 'La cartella del progetto non è valida.',
      'proyectos.nombre_invalido':
        'Il nome del progetto può contenere solo lettere minuscole, numeri e trattini (fino a 40).',
      'proyectos.argumento_invalido': 'Un dato del progetto non è valido (campo: {campo}).',
      'proyectos.base_existe': 'Il database {nombre} esiste già: scelga un altro nome.',
      'proyectos.dominio_existe': 'Esiste già un sito con il dominio {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Quella cartella appartiene al progetto {dominio} o si trova al suo interno: ne scelga un\'altra.',
      'proyectos.sin_python': 'Python non è installato: lo installi da Servizi.',
      'proyectos.venv_ajeno':
        'Il progetto include il proprio .venv e WolfCore Dev non esegue il Python di un repository esterno: lo elimini e ricrei l\'ambiente.',
      'proyectos.paso_base_no_omitible':
        'Il passaggio "Crea il database" di un nuovo progetto non può essere saltato.',
      'proyectos.sin_php': 'PHP non è installato: lo installi da Servizi.',
      'proyectos.php_no_instalado': 'PHP {version} non è installato: lo installi da Servizi.',
      'proyectos.python_no_instalado':
        'Python {version} non è installato: lo installi da Servizi.',
      'mcp.token_invalido': 'Il token del server MCP non è valido.',
      'mcp.solicitud_cancelada': 'Il client MCP ha annullato la richiesta: l\'azione non è stata eseguita.',
      'doctor.puerto_ocupado': 'La porta {puerto} di {servicio} è utilizzata da un altro programma ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) occupa la porta {puerto} di {servicio}.',
      'doctor.puerto_http_sys':
        'Un servizio di Windows ({programa}) occupa la porta {puerto} di {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} occupa la porta {puerto} di {servicio}. Lo chiuda o cambi la porta di WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} occupa la porta {puerto} di {servicio}.',
      'doctor.puerto_skype': '{programa} occupa la porta {puerto} di {servicio}.',
      'doctor.puerto_reservado':
        'La porta {puerto} di {servicio} si trova in un intervallo riservato da Windows ({desde}-{hasta}: Hyper-V, WSL o Docker).',
      'doctor.ca_por_vencer': 'L\'autorità di certificazione di WolfCore Dev scade tra {dias} giorni.',
      'doctor.ca_vencida': 'L\'autorità di certificazione di WolfCore Dev è scaduta.',
      'doctor.certificado_por_vencer': 'Il certificato di {dominio} scade tra {dias} giorni.',
      'doctor.certificado_vencido': 'Il certificato di {dominio} è scaduto.',
      'doctor.hosts_ilegible': 'Impossibile leggere il file hosts.',
      'doctor.hosts_utf16':
        'Il file hosts è salvato in UTF-16: Windows potrebbe non leggerne le voci.',
      'doctor.hosts_bloque_duplicado':
        'Il file hosts contiene {bloques} blocchi di WolfCore Dev; dovrebbe essercene uno solo.',
      'doctor.hosts_bloque_sin_cierre':
        'Un blocco di WolfCore Dev nel file hosts è rimasto senza il marcatore di chiusura.',
      'doctor.hosts_dominios_faltantes':
        'Mancano {cantidad} domini dei Suoi siti nel file hosts.',
      'doctor.hosts_solo_lectura':
        'Il file hosts è di sola lettura (di solito impostato da un antivirus). WolfCore Dev può comunque scriverlo con privilegi di amministratore.',
      'doctor.path_duplicados':
        'Il PATH dell\'utente contiene {cantidad} voci duplicate di WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Un\'altra cartella con {programa} ({origen}) precede WolfCore Dev nel PATH: nei terminali verrà usata quella.',
      'doctor.vcredist_ausente':
        'Manca Microsoft Visual C++ 2015-2022 (x64): PHP e altri servizi non si avviano senza di esso.',
      'doctor.enlazador_msvc_ausente':
        'Rust è installato ma mancano gli strumenti C++ di Visual Studio Build Tools (linker MSVC): cargo non potrà effettuare il link dei programmi.',
      'doctor.antivirus_sin_exclusion':
        'L\'antivirus scansiona la cartella dati di WolfCore Dev: PHP e i servizi potrebbero avviarsi lentamente.',
      'doctor.firewall_reglas':
        'Windows consente l\'accesso dalla rete a {cantidad} regola/e di programmi di WolfCore Dev (nginx, PHP o database) nei profili {perfiles}: questi programmi restano esposti alla rete.',
      'doctor.firewall_no_comprobado':
        'Impossibile verificare il firewall di Windows (potrebbero essere necessari privilegi di amministratore).',
      'doctor.firewall_reglas_ajenas':
        'Sono presenti {cantidad} regola/e in ingresso di altri programmi (FlyEnv, Laragon, XAMPP o altri) con nginx, PHP o database nei profili {perfiles}. Non appartengono a WolfCore Dev: vengono solo mostrate e non vengono mai rimosse da qui.',
      'doctor.servicio_en_error': '{servicio} è in stato di errore.',
      'doctor.revision_fallida': 'Impossibile completare il controllo {revision}.',
      'doctor.confirmacion_requerida': 'Confermi la riparazione prima di applicarla.',
      'doctor.hallazgo_desconocido': 'Questo rilevamento non è più presente: esegua un nuovo controllo.',
      'doctor.solo_informa':
        'Questo rilevamento non dispone di una riparazione automatica: segua le indicazioni.',
      'doctor.reparacion_fallida': 'Impossibile applicare la riparazione.',
      'doctor.reparacion_cancelada': 'Permesso di amministratore annullato: non è stato modificato nulla.',
      'doctor.reparacion_denegada': 'Windows o un antivirus ha negato l\'accesso: non è stato modificato nulla.',
      'doctor.ya_resuelto': 'Il problema non era più presente: non è stato necessario modificare nulla.',
      'doctor.ca_vieja_sin_quitar':
        'La nuova autorità di certificazione è già in uso, ma non è stato possibile rimuovere quella precedente dall\'archivio di Windows. Può rimuoverla dalla sezione HTTPS.',
      'doctor.sin_puerto_libre': 'Impossibile trovare una porta libera su cui spostare il servizio.',
      'doctor.ca_vuelta_atras_incompleta':
        'Impossibile applicare la nuova autorità e il ripristino è rimasto incompleto. Controlli la sezione HTTPS; è presente una copia datata in etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox non si fida dell\'autorità di WolfCore Dev in {cantidad} profili (utilizza il proprio archivio).',
      'confianza.sin_ca': 'Non è ancora presente un\'autorità di certificazione: la crei da HTTPS.',
      'confianza.sin_raices':
        'Non sono stati trovati certificati radice attendibili per Python (né certifi né quelli di Windows): non è stato modificato nulla.',
      'confianza.node_variable_ajena':
        'Dispone già della propria NODE_EXTRA_CA_CERTS: WolfCore Dev non la sostituisce.',
      'confianza.variable_fallida': 'Impossibile modificare la variabile utente.',
      'firefox.abierto': 'Firefox è aperto: lo chiuda e riprovi.',
      'firefox.error': 'Impossibile modificare il file user.js di quel profilo; è rimasto invariato.',
      'firefox.fuera':
        'Ci sono profili fuori dalla cartella di Firefox: li attivi da Attendibilità della CA, con conferma separata.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS non punta più all\'autorità di WolfCore Dev (è stata modificata manualmente): non è stata eliminata.',
      'ia.clave_invalida': 'Il provider ha rifiutato la chiave: la controlli o ne generi una nuova.',
      'ia.sin_saldo': 'L\'account del provider non ha credito o quota disponibile.',
      'ia.limite': 'Il provider ha limitato le richieste: attenda un momento e riprovi.',
      'ia.region': 'Il provider non offre il servizio nel Suo Paese o nella Sua regione.',
      'ia.sin_red': 'Impossibile connettersi al provider: controlli la rete o l\'URL di base.',
      'ia.url_invalida':
        'L\'URL di base non è valido: usi https:// (o http:// solo verso 127.0.0.1 o [::1]), senza nome utente né password.',
      'ia.plazo': 'Il provider non ha risposto entro {segundos} s.',
      'ia.respuesta_rara': 'Il provider ha restituito una risposta inattesa.',
      'ia.cancelado': 'Richiesta al provider annullata.',
      'ia.sin_clave': 'Questo provider richiede una chiave: la salvi prima.',
      'ia.clave_mal_formada':
        'La chiave non ha un formato valido (senza spazi né interruzioni di riga).',
      'ia.modelo_invalido': 'Il nome del modello non è valido.',
      'ia.modelo_no_disponible': 'Il modello non esiste o il Suo account non ha accesso a esso.',
      'ia.proveedor_invalido': 'La configurazione del provider non è valida.',
      'ia.env_conflicto':
        'Il file .env definisce già {claves} con un altro valore: confermi se desidera sostituirlo.',
      'ia.env_sin_confirmar':
        'Confermi di voler scrivere la chiave nel file .env (rimane in testo in chiaro).',
      'ia.env_versionado':
        'Git traccia già il file .env di questo progetto: il prossimo commit caricherebbe la chiave anche se è in .gitignore. Lo rimuova dall\'indice con git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Impossibile verificare se git traccia già il file .env di questo progetto: confermi separatamente di voler scrivere la chiave.',
      'ia.proveedor_no_existe': 'Il provider IA non esiste più.',
      'ia.url_cambia_con_clave':
        'Il provider ha una chiave salvata: confermi di volerla inviare al nuovo URL.',
      'ia.mensaje_sin_confirmar':
        'Confermi l\'invio del messaggio di prova (consuma token del Suo account).',
      'ia.clave_ilegible':
        'Impossibile leggere la chiave salvata del provider: la elimini e la salvi di nuovo.',
      'ia.argumento_invalido': 'Dato non valido ({campo}).',
      'correo.auth': 'Il provider ha rifiutato il nome utente o la password.',
      'correo.conexion': 'Impossibile connettersi al server SMTP: controlli l\'host e la porta.',
      'correo.tls':
        'Impossibile stabilire una connessione cifrata e valida con il server (certificato, nome o STARTTLS). Non è stato inviato nulla.',
      'correo.rechazado':
        'Il server ha rifiutato il messaggio o un indirizzo. Controlli il mittente: molti provider accettano solo un mittente o un dominio verificato.',
      'correo.plazo': 'Il server non ha risposto in tempo (20 s).',
      'correo.host_invalido':
        'Il server SMTP deve essere un nome host o un IP, senza schema, porta né percorso.',
      'correo.host_local':
        'Questo server punta a questo computer o alla rete locale: confermi per utilizzarlo.',
      'correo.destinatario_invalido': 'L\'indirizzo di destinazione non è valido.',
      'correo.proveedor_invalido': 'I dati del provider non sono validi.',
      'correo.proveedor_no_existe': 'Il provider di posta non esiste più.',
      'correo.sin_clave': 'Il provider non ha una chiave salvata.',
      'correo.clave_ilegible':
        'Impossibile leggere la chiave salvata del provider: la elimini e la salvi di nuovo.',
      'correo.cambia_con_clave':
        'Il provider ha una chiave salvata: confermi di volerla inviare al nuovo server.',
      'correo.env_sin_confirmar':
        'Confermi di voler scrivere le variabili di posta nel file .env.',
      'correo.ocupado': 'È già in corso una prova di invio.',
      'correo.limite': 'Attenda {segundos} s prima di un\'altra prova di invio.',
      'correo.clave_mal_formada':
        'La chiave non ha un formato valido: solo caratteri stampabili, senza interruzioni di riga e fino a 4096 caratteri.',
      'correo.argumento_invalido': 'Dato non valido ({campo}).',
      'agentes.no_existe': 'Questo agente non è supportato.',
      'agentes.sin_confirmar': 'Confermi l\'azione nella finestra di dialogo prima di continuare.',
      'agentes.no_instalable':
        'Questo agente non si installa da WolfCore Dev: segua la guida ufficiale ({guia}).',
      'agentes.sin_node': 'Installi Node da Servizi per poter installare l\'agente.',
      'agentes.node_antiguo':
        '{agente} richiede Node {requerida} o superiore e quello che verrebbe usato è {actual}. Installi una versione più recente di Node da Servizi.',
      'agentes.node_version_desconocida':
        'Impossibile rilevare la versione di Node e {agente} richiede Node {requerida} o superiore. Controlli Node in Servizi.',
      'instalador.zip_demasiado_grande':
        'Il pacchetto scaricato è troppo grande o contiene troppi file: non viene installato.',
      'rust.rustup_init_fallo': 'rustup-init non è terminato correttamente (codice {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Impossibile installare Rust {version} (codice {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Impossibile disinstallare Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Impossibile scaricare rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Impossibile installare l\'agente: {detalle}',
      'agentes.no_instalado': '{agente} non è installato.',
      'agentes.mcp_no_soportado':
        '{agente} non documenta come leggere il token da una variabile d\'ambiente: l\'MCP non viene registrato.',
      'agentes.config_ilegible':
        'Impossibile interpretare {archivo}; non è stato modificato. Lo controlli manualmente.',
      'agentes.config_en_uso':
        '{archivo} è cambiato mentre WolfCore Dev lo modificava: chiuda l\'agente e riprovi. Non è stato modificato.',
      'agentes.proveedor_incompatible': '{agente} non può utilizzare questo provider IA.',
      'agentes.sin_cambios_preparados': 'Non ci sono modifiche preparate (git add) da descrivere.',
      'agentes.argumento_invalido': 'Dato non valido ({campo}).',
      'git.commit_fallo': 'Impossibile eseguire il commit: {detalle}',
      'git.mensaje_invalido': 'Il messaggio di commit è vuoto o non è valido.',
      'php.rama_no_instalada': 'PHP {rama} non è installato.',
      'php.argumento_invalido': 'Dato non valido ({campo}).',
      'php.valor_invalido': 'Il valore di {clave} non è valido.',
      'php.ini_invalido': 'PHP non si avvia con quel php.ini; non è stato salvato nulla. Output: {salida}',
      'php.no_arranco':
        'PHP {rama} non si è riavviato con la modifica; è stata ripristinata la configurazione precedente e risponde come prima.',
      'php.caido_tras_restaurar':
        'PHP {rama} non si è riavviato; è stata ripristinata la configurazione precedente, ma continua a non rispondere. Controlli Servizi e i log di PHP.',
      'php.respaldo_no_existe': 'Quel backup del php.ini non esiste.',
      'php.extension_no_existe': 'L\'estensione {nombre} non è presente nella cartella ext di questa versione.',
      'php.extension_no_catalogo':
        'L\'estensione {nombre} non è presente nel catalogo per questa versione.',
      'php.variante_desconocida': 'Impossibile determinare come è compilato questo PHP.',
      'php.sin_variante': 'Il catalogo non dispone di {nombre} per la compilazione {variante}.',
      'php.huella_distinta': 'Il download non corrisponde all\'impronta pubblicata; non è stato installato nulla.',
      'php.descarga_fallida': 'Impossibile scaricare l\'estensione: {detalle}',
      'php.extension_en_uso':
        'La DLL di {nombre} è in uso. Arresti PHP {rama} e riprovi.',
      'php.extension_sin_dll':
        'Impossibile sostituire la DLL di {nombre} e la cartella ext di PHP {rama} ne è rimasta priva. Arresti PHP {rama} e riprovi: quella precedente tornerà al suo posto all\'avvio.',
      'php.sitio_sin_php': 'Questo sito non utilizza PHP.',
      'php.sitio_no_arranco':
        'Il PHP dedicato di {sitio} non ha risposto con la modifica; è stata ripristinata la configurazione precedente.',
      'php.sin_puertos_sitio': 'Non restano porte libere per i PHP dedicati dei siti.',
      'xdebug.launch_invalido':
        'Impossibile interpretare il file .vscode/launch.json del progetto; non è stato modificato nulla.',
      'xdebug.launch_no_seguro':
        'La cartella .vscode o il suo launch.json sono un collegamento o qualcos\'altro: non viene scritto nulla lì.',
      'xdebug.sin_configurar': 'Configuri Xdebug nel sito prima di generare launch.json.',
      'nginx.sitio_no_existe': 'Quel sito non esiste più.',
      'nginx.texto_invalido':
        'Il testo del vhost è troppo lungo, è vuoto o contiene caratteri di controllo.',
      'nginx.sintaxis': 'Riga {linea}: {detalle}. Non è stato modificato nulla.',
      'nginx.directiva_prohibida':
        'Riga {linea}: «{directiva}» non è consentita nel vhost di un sito (potrebbe influire su altri siti o su file esterni al progetto). Non è stato modificato nulla.',
      'nginx.ruta_fuera':
        'Riga {linea}: «{directiva}» punta fuori dalla cartella del progetto o dai suoi log e certificati. Non è stato modificato nulla.',
      'nginx.fuera_de_server':
        'Riga {linea}: il vhost completo può contenere solo blocchi «server»; «{directiva}» è fuori. Non è stato modificato nulla.',
      'nginx.dominio_ajeno':
        'Riga {linea}: «{nombre}» non è un dominio di questo sito. Lo aggiunga prima come alias del sito.',
      'nginx.puerto_ajeno':
        'Riga {linea}: il sito può ascoltare solo sulle porte di Nginx configurate in Impostazioni.',
      'nginx.version_no_existe': 'Quella versione del vhost non è più nella cronologia.',
      'nginx.argumento_invalido': 'Argomento non valido: {campo}',
      'nginx.destino_interno':
        'Riga {linea}: «{directiva}» punta a un servizio interno di WolfCore Dev (Adminer, Mailpit, database, PHP di altri siti…) e lo esporrebbe nella rete e nei tunnel. Non è stato modificato nulla.',
      'nginx.caido_tras_restaurar':
        'Nginx non ha ripreso a rispondere: è stato ripristinato il vhost precedente, ma continua a non rispondere. Controlli Servizi e il log di Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'La porta {puerto} è già in uso: la cattura dei dump non può rimanere in ascolto. Chiuda il programma che la utilizza (ad es. un server:dump di Symfony).',
      'depuracion.no_iniciado': 'La cattura dei dump è spenta.',
      'depuracion.tipo_no_soportado': 'La cattura dei dump è supportata per siti PHP e FastAPI.',
      'depuracion.confirmacion': 'Confermi la cattura dei dump nella finestra di dialogo.',
      'depuracion.argumento_invalido': 'Argomento non valido: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        "Questo file non si trova nella cartella del sito: non verrà aperto nell'editor.",
      'contenedores.motor_invalido': 'Motore di container sconosciuto.',
      'contenedores.id_invalido': "L'ID del container non è valido.",
      'contenedores.argumento_invalido': 'Argomento non valido: {campo}',
      'contenedores.sin_motor': '{motor} non è installato su questo computer.',
      'contenedores.no_responde':
        '{motor} non risponde. Apra Docker Desktop o avvii la macchina Podman e riprovi.',
      'contenedores.remoto':
        'La connessione predefinita di {motor} punta a un altro computer: WolfCore Dev utilizza solo motori locali.',
      'contenedores.no_existe': "Il container non esiste più. Aggiorni l'elenco.",
      'contenedores.accion_fallo': 'Il motore non è riuscito a completare l\'operazione: {detalle}',
      'contenedores.demasiados_registros':
        'È possibile seguire al massimo {maximo} log di container contemporaneamente.',
      'contenedores.sin_confirmar': "Confermi l'azione nella finestra di dialogo.",
      'catalogo.indice_invalido':
        "L'indice delle versioni di {servicio} non ha superato la convalida; verrà usato l'elenco salvato.",
      'catalogo.sin_huella':
        "{servicio} {version} non ha un'impronta pubblicata: confermi l'installazione nella finestra di dialogo.",
      'catalogo.huella_debil':
        "{servicio} {version} dispone solo di un'impronta debole (MD5 o SHA-1): confermi l'installazione nella finestra di dialogo.",
      'catalogo.huella_no_coincide': "Il download non corrisponde all'impronta pubblicata.",
      'catalogo.redireccion_ajena': 'Il download ha tentato di accedere a un sito non consentito ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Il download ha eseguito troppi reindirizzamenti (più di {maximo}).',
      'catalogo.respuesta_grande': 'La risposta del server è troppo grande.',
      'catalogo.version_no_encontrada':
        'La versione {version} di {servicio} non è presente nel catalogo.',
      'catalogo.huella_no_disponible':
        "Impossibile ottenere l'impronta di {servicio} {version} (nessuna connessione o la fonte non ha risposto). Riprovi.",
      'catalogo.firma_invalida':
        'La firma PGP di {servicio} {version} non è valida o non è pubblicata: non è stato installato nulla.',
      'catalogo.firma_no_soportada':
        'La firma PGP di {servicio} {version} usa un formato che WolfCore Dev non verifica: non è stato installato nulla.',
      'catalogo.clave_desconocida':
        "La firma di {servicio} {version} proviene da una chiave non presente tra le chiavi fissate dell'app: non è stato installato nulla.",
      'catalogo.firma_vencida':
        'La firma di {servicio} {version} o la relativa chiave è scaduta: non è stato installato nulla. Aggiorni WolfCore Dev per avere le chiavi aggiornate.',
      'catalogo.reloj_atrasado':
        "La firma di {servicio} {version} ha una data futura: verifichi la data e l'ora del computer e riprovi.",
      'acceso_bd.datos_invalidos': 'I dati di accesso al database non sono validi.',
      'acceso_bd.sin_base': 'Il file .env di questo progetto non punta a un database.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin apre solo database MySQL e MariaDB; utilizzi Adminer per PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'Il database di questo progetto non appartiene a un server locale di WolfCore Dev.',
      'acceso_bd.no_listo':
        'Lo strumento non è pronto: lo installi da Servizi e avvii PHP.',
      'auditoria.tabla_invalida': 'La tabella non esiste in quel database.',
      'auditoria.columna_invalida':
        "La colonna non esiste in quella tabella (e la colonna dell'utente e quella dell'hash devono essere diverse).",
      'auditoria.usuario_no_encontrado': 'Non esiste alcun account con quel nome utente.',
      'auditoria.usuario_repetido':
        'Esiste più di un account con quel nome utente: il ripristino non verrà eseguito per evitare di modificare quello sbagliato.',
      'auditoria.formato_no_soportado':
        "Il formato dell'hash attuale non può essere riprodotto: il ripristino non verrà eseguito.",
      'auditoria.clave_larga':
        'bcrypt utilizza solo i primi 72 byte della password: ne scelga una più corta.',
      'auditoria.clave_invalida': 'La nuova password non è valida.',
      'auditoria.sin_confirmar': 'Confermi di voler reimpostare questa password.',
      'auditoria.respaldo_previo_fallo':
        'Impossibile salvare un backup del database prima del ripristino: non è stato modificato nulla.',
      'auditoria.copia_fallo': 'Impossibile salvare una copia della riga: non è stato modificato nulla.',
      'auditoria.motor_no_soportado':
        "L'audit delle password è supportato per MySQL, MariaDB e PostgreSQL.",
      'auditoria.cancelada': 'Audit annullato.',
      'auditoria.usuario_invalido': 'Il nome utente deve contenere tra 1 e 256 caratteri.',
      'auditoria.en_curso': "È già in corso un audit: attenda il termine o lo annulli.",
      'auditoria.base_sistema': 'Non è possibile eseguire un audit su un database di sistema: scelga il database di un progetto.',
      'auditoria.esquema_invalido': 'Lo schema non esiste in quel database.',
      'auditoria.fila_cambio':
        "L'account è cambiato nel frattempo: la password non è stata reimpostata. Riprovi.",
      'auditoria.verificacion_fallo':
        'Il database non ha salvato la password come previsto: la modifica è stata annullata.',
      'auditoria.columna_corta':
        "La colonna dell'hash accetta {largo} caratteri e il nuovo hash ne richiede {necesario}: non è stato modificato nulla. Estenda la colonna.",
      'auditoria.datos_reales_sin_confirmar':
        'Questo database contiene dati reali di clienti: reimpostare una password richiede la conferma rafforzata.',
      'instantaneas.id_invalido': "L'istantanea non è valida.",
      'instantaneas.no_encontrada': "Istantanea non trovata; potrebbe essere già stata eliminata.",
      'instantaneas.otra_base': 'Questa istantanea appartiene a un altro database: non può essere applicata a questo.',
      'instantaneas.sin_confirmar': 'Confermi di voler tornare a questa istantanea.',
      'instantaneas.motor_no_soportado': 'Le istantanee sono supportate per MySQL, MariaDB e PostgreSQL.',
      'instantaneas.demasiado_grande':
        "Il database supera {maximo} MB, il limite massimo consentito per un'istantanea.",
      'instantaneas.sin_espacio':
        "Spazio libero insufficiente per l'istantanea: servono {necesarios} MB e ne sono disponibili {libres} MB.",
      'instantaneas.limite':
        'Esistono già {maximo} istantanee per questo database: ne elimini qualcuna per crearne una nuova.',
      'instantaneas.tomar_fallo': "Impossibile creare l'istantanea. Il database non è stato modificato.",
      'instantaneas.huella_no_coincide':
        "Il file dell'istantanea è stato modificato o è danneggiato: non è stato ripristinato nulla.",
      'instantaneas.respaldo_previo_fallo':
        'Impossibile salvare lo stato attuale del database: non è stato ripristinato nulla.',
      'instantaneas.restauracion_fallo':
        "Impossibile ripristinare l'istantanea. Il database è tornato allo stato precedente. Motivo: {detalle}",
      'instantaneas.restauracion_sin_copia':
        "Impossibile ripristinare l'istantanea e lo stato precedente non era stato salvato: il database potrebbe risultare vuoto o incompleto. Motivo: {detalle}",
      'instantaneas.restauracion_sin_revertir':
        "Impossibile ripristinare l'istantanea o tornare allo stato precedente. Tale stato è salvato nell'istantanea automatica {respaldo}: la ripristini da Istantanee.",
    },
  },
  instantaneas: {
    abrir: 'Istantanee',
    titulo: (base: string) => `Istantanee di ${base}`,
    ayuda:
      "Un'istantanea salva il database così com'è ora. Può tornarvi in qualsiasi momento: prima del ripristino viene salvata automaticamente un'istantanea dello stato attuale.",
    ubicacion:
      'Vengono salvate nella cartella dati di WolfCore Dev, leggibili solo dal Suo utente. I servizi e i relativi dati non vengono toccati.',
    notaEtiqueta: 'Nota (facoltativa)',
    notaMarcador: 'Ad esempio: prima della migrazione',
    tomar: 'Crea istantanea',
    tomada: 'Istantanea salvata',
    cargando: 'Lettura delle istantanee…',
    vacio: 'Non ci sono ancora istantanee per questo database.',
    automatica: 'Automatica',
    sinNota: 'Nessuna nota',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'tabella' : 'tabelle'} · ${tamano}`,
    volver: 'Ripristina questa istantanea',
    borrar: 'Elimina',
    borrada: 'Istantanea spostata nel cestino',
    papelera:
      'Le istantanee eliminate possono essere recuperate per 7 giorni dal cestino di WolfCore Dev.',
    cerrar: 'Chiudi',
    papeleraTitulo: 'Cestino',
    papeleraVacia: 'Non ci sono istantanee nel cestino.',
    recuperar: 'Recupera',
    recuperada: 'Istantanea recuperata',
    borradaEl: (fecha: string) => `Eliminata il ${fecha}`,
    borrarPregunta: 'Spostare questa istantanea nel cestino?',
    borrarSi: 'Sposta nel cestino',
    notaAutomatica: (fecha: string) =>
      `Stato precedente, salvato prima di tornare all'istantanea del ${fecha}`,
    notaAutomaticaSinOrigen: "Stato precedente, salvato prima di tornare a un'altra istantanea",
    extensionesAviso: (lista: string) =>
      `Contiene estensioni PostgreSQL (${lista}) che vengono ripristinate solo con il registro delle impronte di questo computer.`,
    limites:
      "In MySQL e MariaDB vengono salvati anche routine, trigger ed eventi. In PostgreSQL si tratta di un dump compresso di un singolo database: non include ruoli né utenti del server. Un'istantanea che non può essere verificata come appartenente a questo computer viene ripristinata con un utente limitato al database, che non supporta viste, routine né trigger di altri utenti.",
    basesBorradas: 'Istantanee di database non più esistenti',
    basesBorradasAyuda: 'Scelga un database per ricrearlo dalla sua istantanea.',
    dialogoVolver: {
      titulo: (base: string) => `Ripristina un'istantanea di ${base}`,
      cargando: "Preparazione dell'anteprima…",
      base: 'Database',
      instantanea: 'Istantanea',
      ahora: 'Ora',
      tamano: 'Dimensione',
      tablas: 'Tabelle',
      nota: 'Nota',
      aviso: (base: string) =>
        `Il database ${base} verrà sostituito completamente da questa istantanea: tutte le modifiche successive andranno perse nel database. Prima viene salvata un'istantanea automatica dello stato attuale; in caso di errore, il database tornerà automaticamente a quello stato.`,
      pedir: (base: string) => `Per confermare, digiti ${base}`,
      confirmar: 'Ripristina questa istantanea',
      trabajando: (base: string) => `Ripristino di ${base} in corso… Non chiuda il programma fino al completamento.`,
      hecho: (base: string) => `Il database ${base} è stato ripristinato all'istantanea`,
      respaldoPrevio: "Lo stato precedente è stato salvato nell'istantanea automatica del",
      advertencias: 'Il ripristino è terminato con avvisi:',
      hechoConAvisos: (base: string) => `Il database ${base} è stato ripristinato all'istantanea, con avvisi`,
      baseVacia: 'Il database non esiste o è vuoto: non c\'è nulla da salvare prima del ripristino.',
      sinGuardarTitulo: 'Impossibile salvare lo stato attuale',
      sinGuardarTexto:
        'WolfCore Dev non è riuscito a salvare lo stato attuale del database prima del ripristino. Se continua SENZA salvarlo e il ripristino fallisce, i dati attuali del database andranno persi.',
      sinGuardarConfirmar: 'Comprendo che i dati attuali del database andranno persi',
      sinGuardarBoton: 'Ripristina senza salvare lo stato attuale',
    },
  },
  avisoInicio: {
    titulo: 'Avviso di WolfCore Dev',
  },
  tareas: {
    titulo: 'Attività pianificate',
    resumen: (n: number) => (n === 0 ? 'Nessuna attività' : n === 1 ? '1 attività' : `${n} attività`),
    mostrar: 'Mostra attività',
    ocultar: 'Nascondi',
    cargando: 'Caricamento delle attività',
    errorCargar: 'Impossibile caricare le attività',
    soloAbierta:
      "Le attività vengono eseguite solo mentre WolfCore Dev è aperto. Non utilizzano l'Utilità di pianificazione di Windows: con l'applicazione chiusa o il computer in sospensione non vengono eseguite e le esecuzioni mancate non vengono recuperate.",
    repoEjecuta:
      'In un progetto attendibile, ciò che si trova nel repository viene eseguito così com\'è: il file indicato dall\'attività, `artisan`, gli script di `package.json`, `.venv`… Se cambiano dopo un `git pull`, l\'attività eseguirà la nuova versione.',
    vacio:
      'Questo progetto non ha attività pianificate. Ne crei una (ad esempio «php artisan schedule:run» ogni minuto in un progetto Laravel).',
    nueva: 'Nuova attività',
    pausada: 'in pausa',
    enCurso: 'In esecuzione…',
    nunca: 'Non ancora eseguita',
    ultima: (f: string) => `Ultima: ${f}`,
    proxima: (f: string) => `prossima: ${f}`,
    codigo: (n: number) => `codice ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'creata qui', 'wolfcore.yml': 'da wolfcore.yml' },
    describir: {
      cadaMinuto: 'Ogni minuto',
      cadaN: (n: number) => `Ogni ${n} minuti`,
      cadaHora: 'Ogni ora, allo scoccare',
      diaria: (h: string) => `Tutti i giorni alle ${h}`,
      laborables: (h: string) => `Dal lunedì al venerdì alle ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Riuscita',
      fallo: 'Non riuscita',
      tiempo: 'Tempo massimo superato',
      cancelada: 'Annullata',
      omitida: 'Saltata',
      bloqueada: 'Non eseguita',
    },
    motivo: {
      aislado:
        'Questa è una cartella dati di prova (WOLFCORE_DATOS): non viene eseguita finché non consente le attività in questa sessione.',
      no_confiado:
        'Il progetto non è contrassegnato come attendibile: selezioni «Mi fido di questo repository» per consentirne l\'esecuzione.',
      receta_cambio:
        'La ricetta del progetto è cambiata da quando l\'ha contrassegnato come attendibile: la controlli e selezioni nuovamente «Mi fido di questo repository».',
      sin_confirmar: 'È necessario confermare il comando: non verrà eseguito finché non lo esamina e lo conferma.',
      comando_invalido: 'Il comando non è consentito (solo php, node, npm run e python).',
      cron_invalida: 'La pianificazione non è un\'espressione cron valida.',
      carpeta: 'La cartella del progetto non esiste.',
      solapada: 'L\'esecuzione precedente era ancora in corso: questa è stata saltata.',
      retraso: 'In ritardo (l\'applicazione era sospesa): non verrà recuperata.',
      error: 'Impossibile eseguire il programma.',
    },
    acciones: {
      ejecutar: 'Esegui ora',
      editar: 'Modifica',
      borrar: 'Elimina',
      verRegistro: 'Visualizza log',
      revisarConfirmar: 'Esamina e conferma',
      activar: (n: string) => `Attiva l'attività ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Eliminare «${n}»?`,
      texto:
        'L\'attività e la relativa cronologia vengono rimosse. Ciò che è già stato eseguito non viene annullato e i file del progetto non vengono toccati.',
      confirmar: 'Elimina',
      hecho: (n: string) => `Attività «${n}» eliminata.`,
    },
    aislado: {
      titulo: 'Cartella dati di prova.',
      texto:
        'Con WOLFCORE_DATOS nessuna attività viene eseguita automaticamente. Le consenta solo se desidera testarle in questa sessione.',
      permitir: 'Consenti in questa sessione',
      confirmarTitulo: 'Consentire le attività in questa cartella di prova?',
      confirmarTexto:
        'Le attività attive dei progetti attendibili inizieranno a essere eseguite fino alla chiusura dell\'applicazione. I comandi appartengono ai rispettivi progetti e vengono eseguiti nella loro cartella reale.',
      permitido: 'Attività consentite in questa sessione.',
    },
    yml: {
      titulo: 'Proposte da wolfcore.yml',
      texto:
        'Il file del progetto propone queste attività. Nulla viene eseguito solo perché presente nel file: esamini il comando e lo confermi per adottarla.',
      estado: { nueva: 'Nuova', adoptada: 'Adottata', cambiada: 'Modificata' },
      revisar: 'Esamina e adotta',
      cambiada:
        'Il comando in wolfcore.yml è cambiato da quando l\'ha adottata. L\'attività del progetto continua con il comando confermato; adotti la nuova versione se la riconosce.',
      guardarEn: 'Salva in wolfcore.yml',
      escribirTitulo: 'Scrivere l\'attività in wolfcore.yml?',
      escribirTexto:
        'L\'attività viene aggiunta o aggiornata nel file del progetto (senza modificare il resto) affinché viaggi con il repository. Chi lo clonerà dovrà confermarla sul proprio computer.',
      escribir: 'Scrivi',
      escrita: 'Attività salvata in wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Log di «${n}»`,
      historial: 'Ultime esecuzioni',
      sinHistorial: 'Nessuna esecuzione finora.',
      salida: 'Output dell\'ultima esecuzione',
      sinSalida: 'Nessun output salvato.',
      enmascarado:
        'I log nascondono password e chiavi, hanno una dimensione massima e ruotano automaticamente.',
      origen: { programada: 'pianificata', manual: 'manuale' },
    },
    dialogo: {
      tituloNueva: 'Nuova attività pianificata',
      tituloEditar: 'Modifica attività pianificata',
      tituloAdoptar: 'Adotta l\'attività da wolfcore.yml',
      tituloConfirmar: 'Conferma il comando dell\'attività',
      nombre: 'Nome',
      nombrePlaceholder: 'Attività di Laravel',
      horario: 'Quando',
      preset: {
        cadaMinuto: 'Ogni minuto',
        cadaN: 'Ogni tot minuti',
        cadaHora: 'Ogni ora',
        diaria: 'Tutti i giorni a un\'ora specifica',
        laborables: 'Dal lunedì al venerdì a un\'ora specifica',
        personalizada: 'Espressione cron personalizzata',
      },
      cadaNOpcion: (n: number) => `Ogni ${n} minuti`,
      hora: 'Ora',
      horaPlaceholder: '03:00',
      horaInvalida: 'Inserisca un\'ora valida, ad esempio 03:00.',
      expresion: 'Espressione cron',
      cronEquivale: 'Espressione cron:',
      expresionAyuda:
        '5 campi: minuto, ora, giorno del mese, mese e giorno della settimana (* , - /). Minimo una volta al minuto.',
      proximas: 'Prossime esecuzioni:',
      comando: 'Comando',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Solo php, node, npm run e python, con un file del progetto. Viene eseguito nella cartella del progetto, senza shell e senza codice inline (-r, -e, -c).',
      comandoFijo:
        'Questo comando contiene argomenti con virgolette che non possono essere scritti come testo: viene conservato così com\'è e non può essere modificato qui (la elimini e ne crei un\'altra se deve cambiarlo).',
      argumentos: 'Verrà eseguito con questi argomenti:',
      comillasSinCerrar: 'Mancano delle virgolette di chiusura.',
      tiempo: 'Tempo massimo',
      minutos: 'minuti',
      tiempoAyuda: 'Se impiega più tempo, si arresta automaticamente (solo quel processo e quelli avviati da esso).',
      activa: 'Attiva (viene eseguita automaticamente mentre l\'applicazione è aperta)',
      advertencia:
        'Accettando autorizza questo comando esatto: verrà eseguito automaticamente, nella cartella di questo progetto, ogni volta che è pianificato. Se lo modifica, dovrà confermarlo nuovamente.',
      revise: 'Ho esaminato questo comando e lo riconosco.',
      guardar: 'Salva e conferma il comando',
      adoptar: 'Conferma e adotta',
      confirmar: 'Conferma il comando',
      guardada: 'Attività salvata.',
      adoptada: 'Attività adottata.',
      confirmada: 'Comando confermato.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Insiemi con nome di database, servizi e processi che si avviano e si arrestano insieme.',
    nuevo: 'Nuovo workspace',
    vacio:
      'Non ci sono ancora workspace. Ne crei uno, ad esempio «Bot FastAPI» con PostgreSQL, Redis, Ollama e il processo del Suo progetto.',
    elementos: (n: number) => (n === 1 ? '1 elemento' : `${n} elementi`),
    sinElementos: 'Nessun elemento',
    estado: { apagado: 'Spento', parcial: 'Parziale', encendido: 'Acceso' },
    acciones: {
      iniciar: 'Avvia',
      detener: 'Arresta',
      editar: 'Modifica',
      borrar: 'Elimina',
      cerrar: 'Chiudi',
    },
    borrar: {
      titulo: (n: string) => `Eliminare «${n}»?`,
      texto:
        'L\'eliminazione del workspace non arresta né elimina nulla: rimuove solo il gruppo. Ciò che è avviato rimane avviato.',
      confirmar: 'Elimina',
      hecho: (n: string) => `Workspace «${n}» eliminato.`,
    },
    dialogo: {
      tituloNuevo: 'Nuovo workspace',
      tituloEditar: 'Modifica workspace',
      nombre: 'Nome',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Inserisca un nome.',
      aviso:
        'Un workspace salva solo cosa avviare. Non apre tunnel, non condivide sulla rete locale e non avvia i processi di un progetto non attendibile.',
      secciones: {
        instancias: 'Database',
        servicios: 'Servizi',
        procesos: 'Processi dei progetti',
      },
      sinOpciones: 'Non c\'è nulla da selezionare qui.',
      captadorUnico: 'È consentito un solo server di cattura email alla volta: selezionarne un altro sostituisce il precedente.',
      yaNoExisten: (lista: string) => `Non esistono più e verranno rimossi al salvataggio: ${lista}`,
      guardar: 'Salva',
      guardado: (n: string) => `Workspace «${n}» salvato.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: risultato dell'avvio`,
      tituloDetener: (n: string) => `«${n}»: risultato dell'arresto`,
      encendido: 'Avviato',
      apagado: 'Arrestato',
      yaEncendido: 'Era già avviato',
      yaApagado: 'Era già arrestato',
      noExiste: 'Non esiste più: ignorato',
      compartido: 'Rimane avviato: utilizzato da un altro workspace attivo',
      reemplaza: (otro: string) => `Avviato; ha arrestato ${otro}, dello stesso gruppo email`,
      fallo: 'Non avviato',
      falloApagar: 'Ancora avviato',
      ok: (n: string) => `«${n}» pronto.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: avviati ${encendidos} su ${total}. Controlli cosa non si è avviato.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} risultano ancora avviati. Controlli cosa non si è arrestato.`,
    },
  },
  inicio: {
    titulo: 'Home',
    bienvenida: 'Il Suo ambiente di sviluppo, a colpo d\'occhio.',
    tiles: {
      servicios: 'Servizi attivi',
      serviciosDe: (total: number) => `su ${total}`,
      sitios: 'Progetti',
      tuneles: 'Tunnel attivi',
      hosts: 'Hosts in sospeso',
      hostsOk: 'Tutto in ordine',
      hostsFaltan: 'Richiede attenzione',
    },
    hosts: {
      titulo: 'Ci sono domini non registrati nel file hosts',
      texto:
        'Questi domini non puntano ancora al Suo computer. Per correggerlo, Windows richiederà i privilegi di amministratore.',
      corregir: 'Applica hosts in sospeso',
      reintentarPermiso: 'Riprova con privilegi',
      corregido: 'File hosts aggiornato',
      fallo: 'Impossibile aggiornare il file hosts',
      verInstrucciones: 'Visualizza istruzioni',
      duplicados:
        'Questi domini sono già presenti in hosts fuori dal blocco di WolfCore Dev (verranno conservati):',
      motivos: {
        cancelado: 'I privilegi di amministratore sono stati annullati. Il file hosts è rimasto invariato.',
        tiempo:
          'Nessuno ha risposto in tempo alla richiesta di privilegi di amministratore. Il sito è stato salvato; il file hosts è rimasto invariato. Se vede ancora l\'avviso di Windows, lo annulli (non avrà più effetto). Applichi le modifiche in sospeso quando può (una sola autorizzazione per tutti).',
        denegado:
          'Windows non ha consentito la scrittura del file hosts. Un antivirus potrebbe bloccarlo.',
      } as Record<string, string>,
      modalTitulo: 'Correggi hosts manualmente',
      modalTexto:
        'Apra PowerShell come amministratore (clic destro su Start → Terminale (amministratore)), incolli questo comando e prema Invio.',
    },
    servicios: {
      titulo: 'Servizi',
      ver: 'Visualizza servizi',
      vacio: 'Non ci sono ancora servizi installati.',
    },
    tuneles: {
      titulo: 'Tunnel attivi',
      vacio: 'Non ci sono tunnel aperti. Può aprirne uno da Progetti.',
      sitioDesconocido: 'Sito senza nome',
    },
  },
  servicios: {
    titulo: 'Servizi',
    descripcion:
      'Avvii e arresti il server web, PHP, i database e gli strumenti. Lo stato si aggiorna automaticamente.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Database',
      correo: 'Email',
      ia: 'IA',
      herramientas: 'Strumenti',
    },
    gruposAyuda: {
      web: 'Server che gestisce i domini .test.',
      php: 'Un\'installazione per versione (8.3, 8.4…); ogni sito utilizza la propria.',
      bd: 'In ascolto solo su 127.0.0.1.',
      correo: 'Cattura le email inviate dai Suoi progetti, senza farle uscire su internet.',
      ia: 'Modelli linguistici sul Suo computer.',
      herramientas: 'Utilità per il lavoro quotidiano.',
    },
    puerto: 'Porta',
    cambiarPuerto: 'Cambia porta',
    cambiarPuertoDe: (nombre: string) => `Cambia la porta di ${nombre}`,
    versionesDe: (nombre: string) => `Versioni di ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} istanze, ${encendidas} attive`,
    usarPuerto: (p: number) => `Usa porta ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} ora utilizza la porta ${p}`,
    conflicto: 'Porta occupata',
    autoIniciar: 'Avvia all\'avvio di WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} si avvierà all'avvio di WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} non si avvierà più all'avvio di WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Porta di ${nombre}`,
      etiqueta: 'Nuova porta',
      ayuda:
        'Tra 1024 e 65535 e libera. Se il servizio è attivo, verrà riavviato. Aggiorni il file .env dei Suoi progetti.',
      rango: 'Utilizzi un numero compreso tra 1024 e 65535',
      igual: 'È la porta attuale',
      guardar: 'Cambia porta',
    },
    borrarDatos: {
      opcion: 'Elimina dati',
      titulo: (nombre: string) => `Elimina i dati di ${nombre}`,
      copias: (n: number, tam: string) =>
        `Verranno eliminati anche ${n === 1 ? 'un backup' : `${n} backup`} degli aggiornamenti (${tam}). Se desidera conservarli, li copi prima dalla cartella dati.`,
      /** Cosa si perde, a seconda del servizio. */
      que: {
        mysql: 'tutti i database e gli utenti di MySQL',
        mariadb: 'tutti i database e gli utenti di MariaDB',
        postgresql: 'tutti i database e gli utenti di PostgreSQL',
        redis: 'tutte le chiavi e i dati salvati in Redis',
        mongodb: 'tutti i database, le raccolte e i dati di MongoDB',
        mailpit: 'tutte le email catturate da Mailpit',
        smtp4dev: 'tutte le email catturate da smtp4dev',
        inbucket: 'tutte le email catturate da Inbucket',
        papercut: 'tutte le email catturate da Papercut SMTP',
        ollama: 'tutti i modelli scaricati di Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `Verranno eliminati ${que}. Non è possibile annullare. Il programma rimane installato.`,
      generico: (nombre: string) => `tutti i dati di ${nombre}`,
      pedir: (id: string) => `Per confermare, digiti ${id}`,
      boton: 'Elimina dati',
      hecho: (nombre: string) => `Dati di ${nombre} eliminati`,
    },
    ftp: {
      interruptor: 'Server FTP',
      redLocal: 'Consenti connessioni dalla rete locale',
      redLocalAyuda:
        'Spento, solo questo computer può connettersi (127.0.0.1). Ogni sito attiva il proprio accesso in Siti.',
      avisoTitulo: 'Aprire FTP alla rete locale',
      avisoTexto:
        'FTP invia utenti, password e file senza cifratura. Qualsiasi dispositivo sulla rete potrà tentare di connettersi. Lo usi solo su una rete attendibile.',
      avisoConfirmar: 'Consenti',
      redLocalActivada: 'FTP accetta connessioni dalla rete locale',
      redLocalDesactivada: 'FTP accetta connessioni solo da questo computer',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Gestore delle dipendenze PHP',
      instalado: 'Installato',
      noInstalado: 'Non installato',
      sinVersion: 'non installato',
      uso: 'Uso',
      usoTexto: 'composer',
      ayuda: 'Usi «Terminale» in un progetto, oppure aggiunga WolfCore Dev al PATH in Impostazioni.',
      instaladoOk: 'Composer installato',
      sinPhp: 'Installi prima PHP',
      actualizado: (v: string) => `Composer aggiornato: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Amministratore web per database',
      direccion: 'Indirizzo',
      disponible: 'Pronto',
      noInstalado: 'Non installato',
      sinPhp: 'Manca PHP',
      abrir: 'Apri Adminer',
      instaladoOk: 'Adminer installato',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Amministratore web per MySQL e MariaDB',
      direccion: 'Indirizzo',
      disponible: 'Pronto',
      noInstalado: 'Non installato',
      sinPhp: 'Manca PHP',
      abrirDesdeProyecto: 'Si apre dalla scheda di ciascun progetto, già autenticato.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} non ha l'estensione ${ext} attiva. Riavvii PHP o la attivi nel suo php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin dichiara il supporto fino a PHP 8.3 e si sta usando PHP ${rama}: potrebbero comparire errori. Avvii una versione PHP da 7.2 a 8.3 se qualcosa non funziona.`,
      instalarPrimero: 'Installi phpMyAdmin per usarlo.',
      encenderPhp: 'Avvii PHP per usare phpMyAdmin.',
      instaladoOk: 'phpMyAdmin installato',
    },
    puertos: 'Porte',
    pid: 'PID',
    sinVersion: 'nessuna versione',
    sinPuertos: '—',
    terminado: 'Terminato senza errori',
    externo: 'Gestito fuori da WolfCore Dev',
    verDetalle: 'Vedi dettagli errore',
    vacioTitulo: 'Nessun servizio ancora',
    vacio:
      'Non ci sono ancora servizi installati. Inizi da Nginx e PHP per i suoi siti, o da un database.',
    irAInstalar: 'Vai a installa',
  },
  bd: {
    descripcion:
      'Crei, faccia il backup e ripristini i database dei suoi progetti. I server ascoltano solo su 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Nuovo database',
    restaurar: 'Ripristina backup',
    importar: 'Importa da altro server',
    soloSql: 'Disponibile per MySQL, MariaDB e PostgreSQL',
    enCursoAyuda: 'Attenda il completamento dell’operazione in corso',
    encenderPrimero: (motor: string) => `Avvii prima ${motor}`,
    cargando: 'Caricamento database…',
    recargar: 'Ricarica elenco',
    vacioTitulo: 'Nessun server di database installato',
    vacio:
      'Installi MySQL, MariaDB, PostgreSQL o MongoDB da Servizi per gestire i suoi database.',
    irAServicios: 'Vai a Servizi',
    apagado: {
      titulo: (motor: string) => `${motor} è spento`,
      texto: (motor: string) => `Avvii ${motor} per vedere e gestire i suoi database.`,
      iniciando: (motor: string) => `Avvio di ${motor}…`,
      error: (motor: string) => `Impossibile avviare ${motor}`,
      encender: (motor: string) => `Avvia ${motor}`,
      verServicios: 'Vedi in Servizi',
    },
    errorLista: 'Impossibile leggere l’elenco dei database',
    sinBases: 'Questo server non ha ancora database propri.',
    total: (n: number) => plural(n, 'database', 'database'),
    columnas: { nombre: 'Database', tamano: 'Dimensione', acciones: 'Azioni' },
    acciones: {
      respaldar: 'Backup',
      restaurarAqui: 'Ripristina qui',
      adminer: 'Apri in Adminer',
      conexion: 'Dati di connessione',
      vector: 'Attiva vector',
      borrar: 'Elimina',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Installi Adminer e PHP in Servizi per aprirlo',
    vectorSinInstalar: 'Installi pgvector più sotto per attivarlo in un database',
    vectorActivado: (base: string) => `Vector attivato in ${base}`,
    formatos: {
      sql: 'SQL semplice',
      pgdump: 'Backup PostgreSQL (pg_dump, formato personalizzato)',
      gz: 'SQL compresso (.gz)',
      zip: 'Archivio .zip (estratto prima del ripristino)',
      rar: 'Archivio .rar (estrazione tentata con Windows)',
      '7z': 'Archivio .7z (estrazione tentata con Windows)',
      desconocido: 'Formato non riconosciuto',
    } as Record<string, string>,
    formatoDesconocido:
      'Formato non riconosciuto. Se è un file compresso, lo estragga e scelga il file .sql o .dump contenuto.',
    formatoIncompatible:
      'Questo file è un backup di PostgreSQL: lo ripristini nella scheda PostgreSQL.',
    nombre: {
      etiqueta: 'Nome del database',
      vacio: 'Inserisca un nome',
      largo: 'Il nome è troppo lungo',
      caracteres: {
        mysql: 'Usi solo lettere, numeri e underscore',
        mariadb: 'Usi solo lettere, numeri e underscore',
        postgresql: 'Usi lettere minuscole, numeri e underscore',
        mongodb: 'Usi solo lettere, numeri, trattino e underscore',
      } as Record<string, string>,
      inicio: 'In PostgreSQL il nome non può iniziare con un numero',
    },
    reemplazo: {
      titulo: (base: string) => `Il database ${base} contiene già tabelle`,
      texto: (base: string) =>
        `Se continua, il database ${base} attuale verrà SOSTITUITO completamente. Prima viene salvato un backup automatico; poi il database viene eliminato e ricreato con il nuovo contenuto.`,
      donde: 'Il backup viene salvato in',
      carpetaPorDefecto: 'Documenti\\WolfCore Dev\\Respaldos',
      otraBase:
        'Se non desidera sostituirlo, torni indietro e scelga un altro nome: verrà creato un nuovo database.',
      pedir: (base: string) => `Per confermare, digiti ${base}`,
      volver: 'Indietro',
      confirmar: 'Sostituisci database',
    },
    resultado: {
      restaurada: (base: string) => `Database ${base} ripristinato`,
      importada: (base: string) => `Database ${base} importato`,
      respaldada: (base: string) => `Backup di ${base} salvato`,
      archivo: 'File',
      respaldoPrevio: 'Backup del database precedente',
      advertencias: (n: number) => plural(n, 'avviso', 'avvisi'),
      advertenciasAyuda:
        'Operazione completata. Controlli questi avvisi; di solito sono ruoli o permessi assenti su questo computer.',
      fallo: {
        restaurar: 'Ripristino non riuscito',
        importar: 'Importazione non riuscita',
        respaldar: 'Backup non riuscito',
      } as Record<string, string>,
      trasReemplazo: 'Il database originale è stato sostituito e il ripristino non si è concluso',
      trasReemplazoAyuda:
        'I dati precedenti si trovano nel backup indicato. Può ripristinarlo con «Ripristina backup».',
    },
    progreso: {
      titulo: 'Registro',
      corriendo: {
        restaurar: (base: string) => `Ripristino di ${base}…`,
        importar: (base: string) => `Importazione di ${base}…`,
        respaldar: (base: string) => `Backup di ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'In attesa dell’output dello strumento…',
      limitado: (n: number) => `Mostrate le ultime ${n} righe.`,
      noCierre:
        'Non chiuda il programma fino al termine. Può uscire da questa schermata e tornare: vedrà qui il risultato.',
      otraEnCurso: 'È già in corso un’operazione; attenda il termine.',
      ver: 'Vedi dettagli',
      descartar: 'Chiudi',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Ripristina backup in ${motor}`,
      confianza:
        'Ripristini solo backup attendibili: un backup può eseguire azioni sul server.',
      archivo: 'File di backup',
      elegir: 'Scegli file…',
      cambiar: 'Cambia',
      sinArchivo: 'Nessun file scelto',
      formato: 'Formato rilevato',
      detectando: 'Rilevamento formato…',
      destino: 'Database di destinazione',
      destinoAyuda:
        'Se non esiste, viene creato. Se esiste ed è vuoto, viene usato. Se contiene tabelle, verrà chiesta conferma.',
      restaurar: 'Ripristina',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Importa in ${motor} da altro server`,
      soloLectura:
        'Il server di origine viene solo letto: il database viene copiato su questo computer senza modificare l’origine.',
      detectado: (puerto: number) =>
        `Rilevato un altro server sulla porta ${puerto} (ad esempio FlyEnv).`,
      origen: 'Server di origine',
      host: 'Host',
      puerto: 'Porta',
      usuario: 'Utente',
      clave: 'Password',
      claveAyuda: 'Usata solo per questa copia e non salvata.',
      baseOrigen: 'Database di origine',
      destino: 'Database di destinazione su questo computer',
      destinoAyuda:
        'Se non esiste, viene creato. Se contiene tabelle, verrà chiesta conferma prima della sostituzione.',
      faltaHost: 'Inserisca il server',
      faltaPuerto: 'Usi una porta tra 1 e 65535',
      faltaUsuario: 'Inserisca l’utente',
      faltaBase: 'Inserisca il database di origine',
      importar: 'Importa',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Nuovo database in ${motor}`,
      codificacion: 'Codifica',
      codificacionValor: {
        mysql: 'utf8mb4 (supporta emoji e tutti gli accenti)',
        mariadb: 'utf8mb4 (supporta emoji e tutti gli accenti)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Crea un utente dedicato per questo database',
      usuarioPropioAyuda:
        'Facoltativo. Altrimenti i progetti usano l’utente amministratore del server.',
      usuario: 'Utente',
      clave: 'Password',
      faltaClave: 'Inserisca una password',
      crear: 'Crea database',
      creada: (base: string) => `Database ${base} creato`,
      mongo: 'In MongoDB il database viene creato con una raccolta iniziale (_pel_init).',
      cambiarClave: 'Cambia password',
      cambiarClaveTitulo: (u: string) => `L’utente ${u} esiste già con un’altra password`,
      cambiarClaveTexto: (u: string) =>
        `Se cambia la password di ${u}, i progetti che la usano smetteranno di connettersi finché non aggiorna il loro .env. Di solito conviene usare la password attuale. Cambiarla comunque?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Eliminare il database ${base}?`,
      texto: (base: string, motor: string) =>
        `Verranno eliminati il database ${base} di ${motor} e tutti i suoi dati. L’azione non è reversibile. Se le serve, esegua prima un backup.`,
      pedir: (base: string) => `Per confermare, digiti ${base}`,
      boton: 'Elimina database',
      hecho: (base: string) => `Database ${base} eliminato`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Backup di ${base}`,
      destino: 'Verrà salvato in',
      porDefecto: 'Documenti\\WolfCore Dev\\Respaldos (cartella predefinita)',
      porDefectoEn: (carpeta: string) => `${carpeta} (cartella predefinita)`,
      cambiar: 'Scegli altra cartella…',
      porDefectoVolver: 'Usa cartella predefinita',
      formato: {
        mysql: 'File .sql (mysqldump con routine e trigger)',
        mariadb: 'File .sql (mysqldump con routine e trigger)',
        postgresql: 'File .dump (pg_dump, formato personalizzato)',
      } as Record<string, string>,
      boton: 'Esegui backup',
    },
    dialogoConexion: {
      sitio: 'Progetto',
      sitioAyuda:
        'Viene letto il .env del sito per usare le variabili già presenti (ad esempio CodeIgniter 4). Il contenuto non viene mostrato né copiato.',
      generico: 'Generico (formato Laravel)',
      titulo: (base: string) => `Connessione a ${base}`,
      host: 'Host',
      puerto: 'Porta',
      usuario: 'Utente',
      clave: 'Password',
      base: 'Database',
      sinClave: 'Senza password (ascolta solo su 127.0.0.1)',
      mostrar: 'Mostra password',
      ocultar: 'Nascondi password',
      copiarDato: (dato: string) => `Copia ${dato}`,
      env: 'Blocco per il file .env',
      envAyuda: 'Lo incolli nel .env del progetto. WolfCore Dev non modifica i suoi progetti.',
      copiarEnv: 'Copia blocco',
      cargando: 'Lettura dati di connessione…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'È già in corso un’installazione di pgvector.',
      descripcion:
        'Ricerca per similarità (embeddings) dentro PostgreSQL. Compilato dal codice ufficiale.',
      instalado: (v: string | null) => (v ? `Installato (versione ${v})` : 'Installato'),
      noInstalado: 'Non installato',
      herramientas: 'Strumenti di compilazione',
      herramientasSi: 'Pronti',
      herramientasNo: 'Mancanti',
      instalar: 'Installa pgvector',
      reinstalar: 'Ricompila',
      instalarHerramientas: 'Installa strumenti di compilazione',
      dialogoHerramientasTitulo: 'Installa strumenti di compilazione',
      dialogoHerramientas:
        'Per compilare pgvector servono i Visual Studio Build Tools. Verranno scaricati ~6 GB e Windows chiederà i permessi di amministratore. Può richiedere tempo; lasci WolfCore Dev aperto.',
      dialogoCompilarTitulo: 'Compila e installa pgvector',
      dialogoCompilar:
        'Scarica il codice ufficiale di pgvector, lo compila e lo installa nel suo PostgreSQL. PostgreSQL si ferma alcuni secondi mentre copia l’estensione e poi si riavvia.',
      continuar: 'Continua',
      instalando: 'Installazione degli strumenti di compilazione…',
      compilando: 'Compilazione di pgvector…',
      herramientasOk: 'Strumenti di compilazione installati',
      instaladoOk: (v: string) => `pgvector ${v} installato`,
      sinWinget:
        'Questo computer non dispone di winget. Installi «Build Tools per Visual Studio 2022» da visualstudio.microsoft.com con il carico «Sviluppo di applicazioni desktop con C++» e riprovi.',
      falloHerramientas: 'Impossibile installare gli strumenti di compilazione',
      activarAyuda: 'Poi usi «Attiva vector» su ogni database che lo richiede.',
      errorEstado: 'Impossibile leggere lo stato di pgvector',
    },
  },
  instalar: {
    titulo: 'Installa',
    descripcion:
      'Scarichi versioni ufficiali. Ogni file viene verificato con la sua impronta SHA-256 prima dell’uso.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Server web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Tunnel pubblici (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Database, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Database, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Database (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Cache e code in memoria (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Database a documenti (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Console MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Posta di test (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Posta di test (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Posta di test (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Posta di test (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'IA locale (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'Dipendenze PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Amministratore web di database' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Amministratore web MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web e PHP',
      bd: 'Database',
      otros: 'Posta, IA e tunnel',
    },
    instalados: 'Installato',
    ninguno: 'Nessuna versione installata',
    elegir: 'Scelga una versione',
    buscando: 'Ricerca versioni…',
    sinVersiones: 'Nessuna versione trovata',
    rama: (rama: string) => rama,
    yaInstalada: 'già installata',
    fases: {
      descargando: 'Download in corso',
      verificando: 'Verifica SHA-256',
      extrayendo: 'Estrazione',
      compilando: 'Compilazione',
      listo: 'Installato',
      error: 'Installazione non riuscita',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} installato`,
  },
  sitios: {
    titulo: 'Siti',
    descripcion: 'Ogni sito è una cartella servita da Nginx sul proprio dominio .test.',
    nuevo: 'Nuovo sito',
    buscar: 'Cerca per nome o dominio',
    sinResultados: (q: string) => `Nessun sito corrisponde a «${q}».`,
    vacioTitulo: 'Nessun sito ancora',
    vacio:
      'Scelga la cartella di un progetto e WolfCore Dev rileva se è Laravel, CodeIgniter o statico.',
    agregar: 'Aggiungi sito',
    total: (n: number) => plural(n, 'sito', 'siti'),
    abrirSitio: (dominio: string) => `Apri ${dominio} nel browser`,
    carpeta: 'Cartella',
    abrirCarpeta: 'Apri la cartella del progetto',
    alias: (n: number) => `+${plural(n, 'alias', 'alias')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statico',
      proxy: 'Proxy (porta locale)',
      personalizado: 'Personalizzato',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (porta locale)',
      node: 'Node / Vite (porta locale)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statico',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Dati reali',
    datosRealesAyuda: 'Contiene dati reali di clienti: faccia attenzione prima di pubblicarlo.',
    faltaHosts: 'Manca in hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} non punta ancora a questo computer. Corregga il file hosts con l’avviso in alto.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Manca in hosts',
      iniciando: 'Avvio di Nginx…',
      errorNginx: 'Errore Nginx',
      nginxExterno: 'Nginx esterno',
      nginxApagado: 'Nginx spento',
    },
    borrar: {
      titulo: (nombre: string) => `Eliminare il sito ${nombre}?`,
      texto: 'La cartella del progetto non viene toccata.',
      hecho: (nombre: string) => `Sito ${nombre} eliminato`,
      nginxFallo: 'Il sito è stato eliminato, ma Nginx ha rifiutato la nuova configurazione',
    },
  },
  formSitio: {
    tituloNuevo: 'Nuovo sito',
    tituloEditar: 'Modifica sito',
    tituloDuplicar: 'Duplica sito',
    paso: 'Inizi dalla cartella del progetto',
    pasoAyuda:
      'Vengono rilevati il tipo di progetto, la versione di PHP e un dominio suggerito. Potrà modificare tutto in seguito.',
    elegirCarpeta: 'Scegli cartella',
    cambiarCarpeta: 'Cambia',
    detectando: 'Analisi del progetto…',
    detectado: (tipo: string) => `Rilevato: ${tipo}`,
    sinDeteccionAlEditar: 'Il rilevamento automatico vale solo alla creazione; controlli tipo e PHP.',
    nombre: 'Nome',
    nombreAyuda: 'Solo per riconoscerlo nell’elenco.',
    nombreCopia: (nombre: string) => `${nombre} (copia)`,
    duplicarProxy:
      'La copia punta alla stessa porta locale dell’originale e non copia i suoi processi: cambi la porta o aggiunga un processo dedicato.',
    dominio: 'Dominio',
    dominioPlaceholder: 'mio-progetto',
    alias: 'Alias',
    aliasAyuda: 'Altri domini .test che aprono lo stesso sito. Digiti e prema Invio.',
    aliasAgregar: 'Aggiungi alias',
    carpeta: 'Cartella del progetto',
    raizLaravel: 'Nginx servirà la sottocartella public/.',
    tipo: 'Tipo di progetto',
    php: 'Versione di PHP',
    phpElegir: 'Scelga una versione',
    phpNinguno: 'Nessuna versione di PHP installata.',
    phpInstalar: 'Installa PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Il progetto richiede PHP ${pedida}, che non è installato. È stato scelto PHP ${elegida}.`,
    puertoProxy: 'Porta locale',
    puertoProxyAyuda:
      'Nginx inoltrerà le richieste a http://127.0.0.1:<puerto> (ad esempio Vite o Node).',
    urlBaseVar: 'Variabile URL di base',
    urlBaseVarAyuda:
      'All’apertura di un tunnel il link pubblico viene scritto in questa variabile del .env e ripristinato alla chiusura.',
    urlBaseVarNinguna: 'Nessuna (non toccare il .env)',
    datosReales: 'Contiene dati reali di clienti',
    datosRealesAyuda:
      'Viene segnalato nell’elenco e chiede conferma prima di pubblicarlo con un tunnel.',
    avanzado: 'Avanzate',
    reglasExtra: 'Regole Nginx extra',
    reglasExtraAyuda:
      'Vengono inserite nel blocco server (header di sicurezza, deny personalizzati…). Validate con nginx -t al salvataggio.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Nota',
    notaPlaceholder: 'Qualcosa da ricordare su questo sito',
    guardar: 'Salva sito',
    guardado: (nombre: string) => `Sito ${nombre} salvato`,
    errorGuardar: 'Impossibile salvare il sito',
    nginxFallo: 'Il sito è stato salvato, ma Nginx ha rifiutato la configurazione',
    nginxFalloAyuda:
      'È stata ripristinata la configurazione Nginx precedente. Controlli le regole extra e salvi di nuovo.',
    errores: {
      carpeta: 'Scelga la cartella del progetto',
      sufijo: 'Il dominio deve terminare con .test',
      caracteres: 'Usi solo lettere, numeri, trattini e punti',
      aliasIgualDominio: (d: string) => `L’alias ${d} è uguale al dominio del sito`,
      aliasRepetido: (d: string) => `L’alias ${d} è duplicato`,
      ocupado: (d: string) => `Esiste già un sito con il dominio ${d}`,
      puertoFalta: 'Un sito proxy richiede una porta',
      puertoRango: 'La porta deve essere compresa tra 1 e 65535',
      php: 'Selezioni una versione di PHP per questo sito',
      urlBaseVar: 'Usi lettere, numeri e underscore (ad esempio APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Tunnel pubblico per ${dominio}`,
    etiqueta: 'Tunnel',
    apagadoAyuda: 'Condivida questo sito con un link pubblico temporaneo.',
    abriendo: 'Apertura tunnel…',
    cerrando: 'Chiusura tunnel…',
    error: 'Errore del tunnel',
    sinNginx: 'Avvii prima Nginx',
    sinCloudflared: 'Installi cloudflared in Servizi',
    abrirUrl: 'Apri il link pubblico',
    copiarUrl: 'Copia il link pubblico',
    verQr: 'Mostra il codice QR del link',
    qrTitulo: 'Link pubblico di questo sito',
    renovar: 'Rinnova (nuovo link)',
    cerrar: 'Chiudi tunnel',
    confirmarTitulo: 'Pubblicare un sito con dati reali',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} contiene dati reali di clienti e verrebbe pubblicato su internet con ${destino}: chiunque abbia il link potrà vederlo finché resta aperto. Pubblicare?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} verrà pubblicato su internet con Expose: chiunque abbia il link potrà accedere finché resta aperto. Inoltre l’ispettore delle richieste di Expose resta visibile a tutta la rete locale. Pubblicare?`,
    compartir: 'Condividi',
    confirmar: 'Pubblica',
    confirmarPublicoTitulo: 'Pubblicare il sito su internet',
    confirmarPublicoTexto: (dominio: string) =>
      `Verrà aperto un tunnel pubblico Cloudflare per ${dominio}: chiunque abbia il link potrà accedere finché resta aperto. Pubblicare?`,
    opciones: 'Opzioni del tunnel',
    opcionesDe: (dominio: string) => `Opzioni del tunnel di ${dominio}`,
    proveedor: 'Provider',
    proveedorRapido: 'Rapido (senza account)',
    proveedorRapidoAyuda: 'Un link trycloudflare.com che cambia a ogni apertura.',
    proveedorNombre: 'Con nome (suo dominio)',
    proveedorNombreAyuda:
      'Un link fisso su un suo dominio Cloudflare. Richiede un account Cloudflare.',
    cuentaConectada: 'Account Cloudflare connesso.',
    cuentaSinConectar: 'Nessun account Cloudflare ancora connesso.',
    conectar: 'Connetti con Cloudflare',
    conectando: 'In attesa di autorizzazione nel browser…',
    conectarAyuda:
      'Si apre il browser per autorizzare WolfCore Dev sul suo account. Il certificato resta solo nella cartella dati.',
    autorizacion: 'Autorizzazione Cloudflare',
    abrirAutorizacion: 'Apri la pagina di autorizzazione',
    copiarAutorizacion: 'Copia il link di autorizzazione',
    cancelarConexion: 'Annulla',
    recrear: 'Ricrea tunnel',
    olvidar: 'Dimentica tunnel',
    recrearTitulo: 'Ricrea il tunnel',
    recrearTexto: (n: string) =>
      `Il tunnel «${n}» verrà eliminato in Cloudflare e ne verrà creato uno nuovo con lo stesso nome. I siti che lo usano vengono chiusi.`,
    olvidarTitulo: 'Dimentica il tunnel',
    olvidarTexto: (n: string) =>
      `Il tunnel «${n}» verrà eliminato in Cloudflare insieme alle credenziali salvate. I siti che lo usano tornano al tunnel rapido.`,
    olvidarAqui: 'Dimentica solo qui',
    olvidarAquiTitulo: 'Dimentica il tunnel solo su questo computer',
    olvidarAquiTexto: (n: string) =>
      `Verranno eliminate le credenziali salvate del tunnel «${n}» su questo computer; il tunnel continuerà a esistere su Cloudflare. I siti che lo utilizzano torneranno al tunnel rapido.`,
    desconectar: 'Disconnetti',
    nombreTunel: 'Nome del tunnel',
    nombreTunelAyuda: 'Lettere minuscole, numeri e trattini.',
    dominioPublico: 'Dominio pubblico',
    dominioPublicoAyuda:
      'Un sottodominio di un suo dominio su Cloudflare, ad es. demo.miodominio.com.',
    crear: 'Crea e instrada',
    guardadoNombre: 'Tunnel con nome pronto. All\'apertura verrà richiesta conferma.',
    guardadoRapido: 'Questo sito torna a usare il tunnel rapido.',
    cambiarCierra: 'Cambiando fornitore si chiude il tunnel aperto di questo sito.',
    usarRapido: 'Usa il tunnel rapido',
    nombreActual: (nombre: string, dominio: string) => `Tunnel «${nombre}» su ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} verrà pubblicato su ${publico} tramite un tunnel Cloudflare: chiunque abbia il link potrà accedere finché resterà aperto. Pubblicare?`,
    proveedorNgrokAyuda:
      'Con il suo account ngrok. Richiede il programma ngrok già installato su questo computer.',
    proveedorExposeAyuda:
      'Con il suo account Expose. Richiede Expose già installato su questo computer; su Windows funziona solo con expose.phar. Il suo inspector rimane visibile sulla rete locale, quindi non va usato con siti contenenti dati reali.',
    proveedorTailscaleAyuda:
      'Tramite la sua rete privata Tailscale. Richiede Tailscale installato e con sessione attiva.',
    tokenGuardado: (f: string) => `Token salvato (termina con ${f}).`,
    tokenSinGuardar: 'Non c\'è ancora alcun token salvato.',
    tokenNgrok: 'Token di ngrok',
    tokenExpose: 'Token di Expose',
    tokenAyuda:
      'Viene salvato crittografato su questo computer e consegnato al programma solo all\'apertura del tunnel; non viene mai mostrato.',
    tokenPlaceholder: 'Incolli qui il token',
    guardarToken: 'Salva token',
    borrarToken: 'Elimina token',
    usarProveedor: 'Usa questo fornitore',
    guardadoProveedor: 'Fornitore salvato. All\'apertura del tunnel verrà richiesta conferma.',
    ngrokAyudaInstalacion:
      'ngrok deve essere già installato su questo computer (WolfCore Dev non lo scarica perché ngrok non pubblica un download verificabile). La configurazione globale non viene modificata.',
    exposeAyudaInstalacion:
      'Expose deve essere già installato oppure avere il file expose.phar nella cartella bin/expose dei dati di WolfCore Dev (su Windows funziona solo con il file phar; non esiste un download con impronta verificabile). Il suo inspector delle richieste rimane visibile sull\'intera rete locale, per questo non va usato con siti contenenti dati reali. La configurazione globale non viene modificata.',
    tailscaleAlcance: 'Ambito di visibilità',
    tailscaleServe: 'Serve: solo la sua tailnet',
    tailscaleServeAyuda: 'Solo i computer della sua rete Tailscale. Non è esposto su Internet.',
    tailscaleFunnel: 'Funnel: tutto Internet',
    tailscaleFunnelAyuda: 'Chiunque abbia il link può accedere, sia o meno nella sua tailnet.',
    tailscaleFunnelAviso:
      'Funnel pubblica questo sito su Internet: chiunque abbia il link potrà accedere finché resterà aperto.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev non installa Tailscale (è un servizio di sistema): deve essere già installato e con sessione attiva. Non viene modificato nulla di ciò che già pubblica con Tailscale; il sito utilizza la porta HTTPS 8443.',
    confirmarTailnetTitulo: 'Condividi con la sua tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} verrà condiviso con Tailscale Serve: potranno accedere solo i computer della sua tailnet; non viene pubblicato su Internet. Condividere?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} contiene dati reali di clienti. Con Tailscale Serve potranno vederlo solo i computer della sua tailnet (non viene pubblicato su Internet). Condividere?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} verrà pubblicato su Internet con Tailscale Funnel: chiunque abbia il link potrà accedere finché resterà aperto. Pubblicare?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} verrà pubblicato su Internet con ${proveedor}: chiunque abbia il link potrà accedere finché resterà aperto. Pubblicare?`,
    tituloError: 'Impossibile aprire il tunnel',
  },
  tuneles: {
    titulo: 'Tunnel',
    descripcion: 'Link pubblici temporanei di Cloudflare per mostrare un sito fuori dalla sua rete.',
    explicacion:
      'I tunnel rapidi cambiano indirizzo ogni volta che vengono aperti o rinnovati e funzionano solo finché questo computer è acceso e i relativi processi restano attivi (se esce da WolfCore Dev lasciandoli accesi, continuano a funzionare).',
    columnas: { sitio: 'Sito', estado: 'Stato', url: 'Link', acciones: 'Azioni' },
    vacioTitulo: 'Nessun tunnel aperto',
    vacio: 'Attivi l\'interruttore del tunnel di un sito per ottenere un link pubblico.',
    irASitios: 'Vai a Siti',
    sinNombre: 'Sito eliminato',
  },
  ajustes: {
    titulo: 'Impostazioni',
    descripcion: 'Preferenze dell\'ambiente.',
    general: 'Generale',
    carpetaDatos: 'Cartella dati',
    carpetaDatosAyuda: 'File binari, configurazione e log. Può essere aperta, non modificata.',
    servicios: 'Servizi',
    puertoNginx: 'Porta di Nginx',
    puertoNginxAyuda:
      'Normalmente 80. Se non è 80, gli URL locali includeranno la porta. I tunnel aperti restano sulla porta precedente: li rinnovi.',
    trabajadores: 'Worker PHP',
    trabajadoresAyuda:
      'Processi php-cgi per versione. Più worker gestiscono più richieste contemporaneamente.',
    nota: 'Al salvataggio i siti vengono rigenerati con la nuova porta. Se Nginx è avviato viene riavviato (o ricaricato se la porta non è cambiata) e le versioni di PHP avviate vengono riavviate se cambiano i worker.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Impostazioni salvate e applicate. Riavviato: ${reiniciados.join(', ')}.`
        : 'Impostazioni salvate e applicate.',
    errorAplicar: 'Impostazioni salvate, ma non è stato possibile applicarle completamente',
    errorSeccion: (detalle: string) => `Impossibile leggere questo dato: ${detalle}`,
    acerca: 'Informazioni',
    avisos: {
      titulo: 'Avvisi',
      descripcion:
        'Quali avvisi vengono salvati nella campanella e se Windows mostra una notifica quando la finestra non è visibile.',
      nativas: 'Notifiche di Windows',
      nativasAyuda:
        'Solo quando WolfCore Dev non è in primo piano; al massimo una per tipo ogni 5 min.',
      tiposTitulo: 'Tipi di avviso',
      versionesTitulo: 'Nuove versioni per servizio',
      versionesAyuda:
        'Disattivi un servizio per non ricevere avvisi sulle nuove versioni (la scheda Versioni continua a segnalare gli aggiornamenti).',
      versionesDe: (s: string) => `Avvisa sulle nuove versioni di ${s}`,
      tipos: {
        'servicio-caido': 'Un servizio si è arrestato con un errore',
        'puerto-ocupado': 'Porta occupata all\'avvio di un servizio',
        'certificado-por-vencer': 'Certificati in scadenza',
        'tunel-caido': 'Un tunnel si è interrotto',
        'proceso-error': 'Un processo di progetto non è riuscito',
        'proceso-terminado': 'Un processo di progetto è terminato',
        'receta-terminada': 'Una ricetta di progetto è terminata',
        doctor: 'Diagnostica (Doctor)',
        'contenedor-detenido': 'Un container si è arrestato',
        'version-nueva': 'È disponibile una nuova versione di un servizio installato',
      } as Record<string, string>,
      errorGuardar: 'Impossibile salvare gli avvisi',
    },
    versionPrograma: 'Versione del programma',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Autorità locale',
      autoridadAyuda:
        'WolfCore Dev firma i certificati dei suoi siti .test con una propria autorità. Viene installata nell\'archivio del suo utente Windows, senza privilegi di amministratore.',
      instalada: 'Installata in Windows',
      noInstalada: 'Non installata',
      instalar: 'Installa autorità',
      reinstalar: 'Reinstalla',
      quitar: 'Rimuovi',
      instaladaOk: 'Autorità HTTPS installata',
      quitadaOk: 'Autorità HTTPS rimossa',
      cancelado: 'Conferma di Windows annullata. Non è stato modificato nulla.',
      fallo: 'Impossibile modificare l\'autorità HTTPS',
      quitarTitulo: 'Rimuovere l\'autorità HTTPS?',
      quitarTexto:
        'I browser smetteranno di fidarsi dei certificati dei suoi siti .test finché non la reinstallerà.',
      puerto: 'Porta HTTPS',
      puertoAyuda:
        'Normalmente 443. Se è usata da un altro programma, scelga un valore tra 1024 e 65535; gli URL includeranno la porta.',
      puertoRango: 'Usi 443 o un numero tra 1024 e 65535',
      puertoGuardado: (p: number) => `HTTPS ora usa la porta ${p}`,
      puertoAplicarFallo: 'Porta salvata, ma Nginx non ha accettato la nuova configurazione',
      firefox:
        'Firefox usa il proprio archivio di certificati. Affinché si fidi dell\'autorità, apra about:config e attivi',
    },
    herramientas: {
      titulo: 'Terminale e strumenti',
      phpPorDefecto: 'PHP predefinito',
      phpPorDefectoAyuda:
        'La versione di php e composer nel terminale e nelle scorciatoie di WolfCore Dev. «Terminale» utilizza il PHP di ciascun progetto.',
      phpMasReciente: 'La più recente installata',
      phpSinInstalar: 'Installi PHP in Servizi per scegliere una versione',
      phpGuardado: 'PHP predefinito aggiornato',
      path: 'PATH dell\'utente',
      pathAyuda:
        'Aggiunge php e composer di WolfCore Dev al PATH del suo utente per usarli in qualsiasi terminale.',
      pathActivo: 'Aggiunto al PATH',
      pathInactivo: 'Non presente nel PATH',
      pathAgregar: 'Aggiungi al PATH utente',
      pathQuitar: 'Rimuovi dal PATH',
      pathTitulo: 'PATH aggiornato',
      pathAviso: 'Apra un nuovo terminale per vedere la modifica: i terminali già aperti non la rilevano.',
      pathQuitarTitulo: 'Rimuovere WolfCore Dev dal PATH?',
      pathQuitarTexto:
        'php e composer di WolfCore Dev non saranno più disponibili nei nuovi terminali. I terminali già aperti non cambiano.',
      adminer: 'Porta di Adminer',
      adminerAyuda: 'Adminer è disponibile solo su questo computer, a questo indirizzo fisso.',
      terminal: 'Terminale predefinito',
      terminalSistema: 'Quello di sistema (PowerShell)',
      terminalAyuda:
        'Quello aperto da «Terminale» nei progetti. Se il progetto richiede variabili proprie (il proprio PHP nel PATH, la chiave di un agente), con «Windows Terminal» si apre PowerShell nel terminale predefinito di Windows: un\'istanza già aperta di Windows Terminal non riceverebbe tali variabili.',
      terminalGuardada: 'Terminale predefinito aggiornato',
      editor: 'Editor predefinito',
      editorPrimero: 'Il primo rilevato',
      editorAyuda:
        'Quello aperto da «Editor» nei progetti e da «Apri nell\'editor» nelle ricerche e negli errori. Vengono rilevati VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed e Notepad++.',
      editorGuardado: 'Editor predefinito aggiornato',
      editorNinguno: 'Nessun editor rilevato.',
    },
  },
  /* ───────────── HTTPS, terminale e FTP nei siti; Posta; IA locale ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS attivo',
    candadoAyuda: 'Questo sito risponde anche via HTTPS con un certificato di WolfCore Dev.',
    redirige: 'Reindirizza http → https',
    abrirHttp: (dominio: string) => `Apri http://${dominio} nel browser`,
    abrirHttps: (url: string) => `Apri ${url} nel browser`,
    pendiente: (motivo: string) => `HTTPS in sospeso: ${motivo}`,
    pendienteCorto: 'HTTPS in sospeso',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `la porta ${puerto} è usata da ${nombre} (PID ${pid}).`,
    sinAutoridad: 'manca l\'autorità di certificazione. La installi in Impostazioni.',
    pendienteAyuda:
      'Il sito continua a funzionare via HTTP. Chiuda quel programma o scelga un\'altra porta HTTPS in Impostazioni.',
    sinConfianza: 'Autorità non installata',
    sinConfianzaAyuda:
      'Il browser mostrerà un avviso di sicurezza finché non installerà l\'autorità di WolfCore Dev (Impostazioni → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Servi anche via HTTPS',
    httpsAyuda: 'Con un certificato proprio per il dominio e i suoi alias, firmato da WolfCore Dev.',
    redirigir: 'Reindirizza a HTTPS',
    redirigirAyuda: 'Le visite via http passano a https. I tunnel pubblici non sono interessati.',
    redirigirDeshabilitado: 'Attivi prima HTTPS',
    sinAutoridadTitulo: 'L\'autorità HTTPS non è installata',
    sinAutoridadTexto:
      'Senza di essa il browser mostrerà un avviso di sicurezza. Windows le chiederà di confermare l\'installazione.',
    instalar: 'Installa autorità',
    instalada: 'Autorità HTTPS installata',
    cancelado: 'Conferma di Windows annullata. Non è stato modificato nulla.',
    fallo: 'Impossibile installare l\'autorità HTTPS',
  },
  terminalSitio: {
    boton: 'Terminale',
    ayuda: 'Apre un terminale nella cartella del progetto, con il relativo PHP e Composer nel PATH.',
    elegir: 'Scegli terminale',
    predeterminada: 'predefinito',
  },
  editorSitio: {
    ayuda: 'Apre la cartella del progetto nell\'editor predefinito.',
    elegir: 'Apri con…',
    predeterminada: 'predefinito',
    sustituido: (pred: string, usado: string) =>
      '{pred} non è installato: aperto con {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Impossibile aprire l\'editor',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `PHP ${rama} condiviso`,
    propio: (rama: string) => `PHP ${rama} dedicato a questo sito`,
    conXdebug: 'Xdebug attivo',
    mostrar: 'Impostazioni PHP',
    ocultar: 'Nascondi impostazioni PHP',
    cargando: 'Lettura delle impostazioni PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} è arrestato: il PHP dedicato di questo sito si avvia insieme ad esso.`,
    ajustesTitulo: 'php.ini personalizzato',
    ajustesAyuda: (rama: string) =>
      `Si aggiungono al php.ini di PHP ${rama} solo per questo sito. Con almeno un\'impostazione (o con Xdebug), il sito usa un proprio PHP con 1 o 2 processi; gli altri siti non cambiano.`,
    clave: 'Direttiva',
    valor: 'Valore',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Rimuovi ${clave || 'impostazione'}`,
    agregar: 'Aggiungi impostazione',
    guardarAjustes: 'Verifica e salva',
    ajustesGuardados: 'Impostazioni PHP del sito applicate',
    sinAjustes: 'Nessuna impostazione personalizzata: usa il php.ini condiviso così com\'è.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug per ${dominio}`,
    xdebugAyuda:
      'Viene caricato solo nel PHP di questo sito, mai nel PHP condiviso: gli altri siti restano veloci come sempre.',
    xdebugDescarga:
      'Xdebug non è installato in questa versione di PHP: verrà scaricato dal catalogo (xdebug.org, impronta SHA-256 verificata).',
    modo: 'Modalità',
    modos: {
      debug: 'debug (breakpoint)',
      develop: 'develop (errori migliorati)',
      coverage: 'coverage (copertura)',
      profile: 'profile (profilazione)',
      trace: 'trace (traccia)',
    },
    puerto: 'Porta dell\'editor',
    inicio: 'Quando si connette',
    inicioTrigger: 'Solo con XDEBUG_TRIGGER',
    inicioYes: 'A ogni richiesta',
    inicioAyuda:
      'Con «Solo con XDEBUG_TRIGGER», il debug inizia quando la richiesta include il cookie, il parametro GET/POST o l\'estensione del browser (Xdebug Helper).',
    guardarXdebug: 'Salva Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `La porta ${puerto} è già usata da un PHP o un altro servizio di WolfCore Dev: il suo editor non potrà restare in ascolto su di essa. Ne scelga un\'altra (9003 è quella abituale).`,
    xdebugGuardado: 'Xdebug del sito applicato',
    quitarXdebug: 'Rimuovi Xdebug',
    quitarXdebugTitulo: 'Rimuovere Xdebug da questo sito?',
    quitarXdebugTexto:
      'La sua configurazione viene eliminata. Se il sito non ha altre impostazioni, torna al PHP condiviso. Il file launch.json del progetto non viene modificato.',
    xdebugQuitado: 'Xdebug rimosso dal sito',
    ide: 'Editor',
    generarLaunch: 'Genera launch.json',
    launchTitulo: '.vscode/launch.json del progetto',
    launchNuevo:
      'Verrà creato .vscode/launch.json con questa configurazione (PHP Debug di VS Code, in ascolto solo su 127.0.0.1).',
    launchFusion:
      'Esiste già un launch.json: viene aggiunta (o aggiornata) solo la configurazione di WolfCore; le altre e i relativi commenti restano intatti. Prima viene salvato un backup datato nella cartella dati di WolfCore Dev.',
    launchSinCambios: 'Il file launch.json contiene già questa configurazione.',
    launchEscribir: 'Scrivi launch.json',
    launchCreado: 'launch.json creato in .vscode',
    launchActualizado: (respaldo: string) => `launch.json aggiornato. Backup precedente: ${respaldo}`,
    phpStorm: 'Configurazione per PhpStorm',
    copiarPhpStorm: 'Copia configurazione PhpStorm',
    errorNginx: (salida: string) => `Nginx non ha accettato la modifica; ripristinato lo stato precedente. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Vhost generato',
    conReglas: 'con regole personalizzate',
    manualResumen: 'Vhost scritto manualmente (non viene rigenerato)',
    mostrar: 'Modifica vhost',
    ocultar: 'Nascondi vhost',
    cargando: 'Lettura del vhost…',
    reglasTitulo: 'Regole personalizzate',
    reglasAyuda:
      'Vanno all\'interno del blocco server di questo sito. Prima di applicarle vengono verificate con nginx -t su una copia dell\'intera configurazione; in caso di errore, tutto rimane invariato.',
    reglasEtiqueta: 'Regole personalizzate di Nginx',
    reglasPlaceholder: '# Ad esempio: client_max_body_size 256m;',
    snippetsTitulo: 'Frammenti',
    insertar: (titulo: string) => `Inserisci: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache dei file statici',
      'limite-subida': 'Limite di caricamento',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Intestazioni di sicurezza',
      websocket: 'Proxy WebSocket',
      gzip: 'Compressione gzip',
      ocultos: 'Nega file nascosti',
    },
    aplicar: 'Verifica e applica',
    descartar: 'Scarta modifiche',
    aplicado: 'Vhost applicato e Nginx ricaricato',
    aplicadoApagado: 'Vhost salvato; verrà usato all\'avvio di Nginx',
    fallo: 'Nginx non ha accettato la modifica; il vhost rimane invariato',
    salidaTitulo: 'Output di nginx -t',
    desactivado:
      'Nginx non ha accettato quanto scritto per questo sito durante l\'applicazione della configurazione ed è stato escluso dal vhost (rimane comunque salvato). Lo corregga e lo applichi di nuovo per riutilizzarlo.',
    avisoDestino: (destino: string, linea: number) =>
      `Riga ${linea}: il traffico viene inviato a un altro computer (${destino}). Verifichi che sia ciò che desidera.`,
    generadoTitulo: 'Vhost generato (sola lettura)',
    avanzadoTitulo: 'Modalità avanzata',
    avanzadoInterruptor: 'Scrivi l\'intero vhost manualmente',
    avanzadoAyuda:
      'Sostituisce il vhost generato. WolfCore Dev non lo rigenererà più: se cambia il dominio, HTTPS, le porte o la cartella, dovrà adeguarlo manualmente. Può usare solo i domini e le porte di questo sito.',
    avanzadoActivarTitulo: 'Scrivere il vhost manualmente?',
    avanzadoActivarTexto:
      'Si parte dal vhost generato attuale. Finché questa modalità è attiva, le modifiche al sito (dominio, HTTPS, PHP…) non si riflettono nel vhost: dovrà apportarle manualmente.',
    avanzadoActivar: 'Scrivi manualmente',
    manualEtiqueta: 'Vhost completo del sito',
    aplicarManual: 'Verifica e applica vhost',
    volverGenerado: 'Torna al vhost generato',
    volverGeneradoTitulo: 'Tornare al vhost generato?',
    volverGeneradoTexto:
      'Il vhost scritto manualmente viene salvato nella cronologia e WolfCore Dev torna a generare quello del sito (con le sue regole personalizzate).',
    historial: 'Cronologia',
    historialTitulo: 'Versioni precedenti del vhost',
    historialVacio: 'Non ci sono ancora versioni precedenti.',
    historialAyuda:
      'Vengono salvate le ultime 10 versioni, prima di ogni modifica. Il ripristino passa attraverso la stessa verifica con nginx -t.',
    modoReglas: 'Generato con regole',
    modoManual: 'Scritto manualmente',
    restaurar: 'Ripristina',
    restaurarTitulo: 'Ripristinare questa versione?',
    restaurarTexto: (fecha: string) =>
      `Il vhost torna allo stato del ${fecha}. La versione attuale resta nella cronologia.`,
    restaurado: 'Versione ripristinata',
  },
  lan: {
    etiqueta: 'Rete locale',
    interruptor: (dominio: string) => `Condividi ${dominio} sulla rete locale`,
    apagadoAyuda: 'Apra questo sito dal suo telefono o da un altro computer sulla stessa rete.',
    sinNginx: 'Avvii Nginx per condividere il sito sulla rete locale.',
    sinRed: 'Nessuna rete locale connessa (Wi-Fi o Ethernet).',
    activo: 'Visibile sulla rete locale',
    abriendo: 'Condivisione in corso…',
    cerrando: 'Interruzione della condivisione…',
    abrirUrl: 'Apri su questo computer',
    copiarUrl: 'Copia indirizzo',
    verQr: 'Mostra QR',
    qrTitulo: (dominio: string) => `${dominio} sulla rete locale`,
    qrAviso: 'Scansioni il QR con un telefono connesso alla stessa rete.',
    confirmarTitulo: 'Condividi sulla rete locale',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} diventerà visibile a qualsiasi dispositivo connesso alla stessa rete di questo computer (${ip}), senza richiedere password. La condivisione si interrompe disattivando l\'interruttore, chiudendo WolfCore Dev e al successivo riavvio.`,
    ipEtiqueta: 'Rete (IP di questo computer)',
    https: 'Usa HTTPS',
    httpsAyuda:
      'Con HTTPS il telefono deve fidarsi della CA di WolfCore Dev (pulsante «Installa la CA sul telefono»). Senza di essa, il sito funziona via HTTP.',
    httpsObligatorio: 'Questo sito reindirizza a HTTPS, quindi viene condiviso via HTTPS.',
    compartir: 'Condividi in rete',
    tituloError: 'Impossibile condividere sulla rete locale',
    caBoton: 'Installa la CA sul telefono',
    firewallTitulo: 'Non si apre sul telefono?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} contiene dati reali e non può essere condiviso sulla rete locale, nemmeno con conferma.`,
    redPublica:
      'Questa rete è contrassegnata come pubblica in Windows: il firewall bloccherà le connessioni in entrata e il comando apre solo reti private. La contrassegni come privata se si tratta della sua rete di fiducia.',
    firewallTexto:
      'WolfCore Dev non modifica il firewall. Non accetti l\'avviso di Windows per l\'intero programma: esegua il comando per questa porta (solo sottorete locale e solo reti private) in PowerShell come amministratore. Su una rete pubblica non si aprirà e un\'eventuale regola di blocco già esistente ha la priorità su quella di autorizzazione.',
    copiarComando: 'Copia comando',
  },
  caMovil: {
    titulo: 'Installa la CA sul telefono',
    intro:
      'Scansioni il QR con un telefono connesso alla stessa rete per scaricare il certificato dell\'autorità di WolfCore Dev. Viene fornito solo questo file e il link si chiude automaticamente.',
    abriendo: 'Apertura del link…',
    expira: (minutos: number) => `Il link si chiude automaticamente tra ${minutos} min.`,
    expirado: 'Il link è stato chiuso.',
    reabrir: 'Apri di nuovo',
    android: 'Android',
    ios: 'iPhone o iPad',
    pasosAndroid: [
      'Scansioni il QR o apra l\'indirizzo nel browser del telefono e scarichi il file.',
      'Apra Impostazioni > Sicurezza e privacy > Altre impostazioni di sicurezza > Crittografia e credenziali > Installa un certificato > Certificato CA (i nomi variano in base al produttore).',
      'Prima di autorizzarlo, confronti l\'impronta SHA-256 del certificato mostrata sul telefono con quella di questa finestra: se non coincidono, non lo installi.',
      'Selezioni il file scaricato e accetti l\'avviso: è normale, Android avvisa per ogni CA.',
    ],
    pasosIos: [
      'Apra l\'indirizzo in Safari e consenta il download del profilo.',
      'Apra Impostazioni > Profilo scaricato e confronti l\'impronta SHA-1 nei dettagli con quella di questa finestra: se non coincidono, non lo installi. Poi proceda con l\'installazione.',
      'Apra Impostazioni > Generali > Info > Impostazioni attendibilità certificati e attivi l\'attendibilità completa per la CA di WolfCore Dev.',
    ],
    aviso:
      'Una CA installata rende attendibile tutto ciò che firma su quel telefono: la installi solo sui suoi dispositivi e la rimuova al termine.',
    firewallAviso: (puerto: number) =>
      'Affinché il telefono possa raggiungere il link è necessario aprire la porta ' +
      puerto +
      ' (solo sottorete locale e reti private). Non accetti l\'avviso di Windows per l\'intero programma: esegua questo comando in PowerShell come amministratore. Su una rete pubblica non si aprirà e un\'eventuale regola di blocco già esistente ha la priorità.',
    huellas: 'Impronte del certificato',
    tituloError: 'Impossibile aprire il link della CA',
  },
  dialogoQr: {
    descargar: 'Scarica PNG',
    descargado: 'QR salvato',
    largo: 'Il testo è troppo lungo per un codice QR.',
    generando: 'Generazione del codice QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Accesso FTP per ${dominio}`,
    apagadoAyuda: 'Consenta di caricare file nella cartella di questo sito via FTP.',
    activoAyuda: 'Accesso attivo.',
    soloLecturaEtiqueta: 'sola lettura',
    mostrarDatos: 'Mostra dati FTP',
    ocultarDatos: 'Nascondi dati FTP',
    host: 'Server',
    puerto: 'Porta',
    usuario: 'Utente',
    clave: 'Password',
    mostrarClave: 'Mostra password',
    ocultarClave: 'Nascondi password',
    copiarDato: (dato: string) => `Copia ${dato}`,
    cargando: 'Lettura dei dati FTP…',
    regenerar: 'Rigenera password',
    regenerarTitulo: 'Rigenerare la password FTP?',
    regenerarTexto:
      'La password attuale smette di funzionare e le connessioni aperte di questo sito vengono chiuse. Dovrà aggiornarla nel suo client FTP.',
    regenerada: 'Password FTP rigenerata',
    soloLectura: 'Sola lettura',
    soloLecturaAyuda: 'È possibile scaricare i file, ma non caricarli, modificarli né eliminarli.',
    soloLecturaActivado: 'L\'FTP di questo sito è ora in sola lettura',
    soloLecturaDesactivado: 'L\'FTP di questo sito ora consente la scrittura',
    activado: 'Accesso FTP attivato',
    desactivarTitulo: 'Rimuovere l\'accesso FTP da questo sito?',
    desactivarTexto:
      'La password viene eliminata e le connessioni aperte vengono chiuse. La cartella del sito non viene toccata.',
    desactivar: 'Rimuovere accesso',
    desactivado: 'Accesso FTP rimosso',
    redLocalAviso:
      'L\'FTP accetta connessioni dalla rete locale e invia la password e i file non cifrati. Lo usi solo su una rete fidata.',
    redLocalHost: 'o l\'IP di questo computer sulla sua rete',
    servidorApagado: 'Il server FTP è spento: nessuno potrà connettersi finché non lo avvia.',
    encender: 'Avviare FTP',
    urlEtiqueta: 'Indirizzo',
    urlAyuda: 'L\'indirizzo non include la password: viene richiesta al momento della connessione.',
    abrirUrl: 'Aprire in un client FTP',
    copiarUrl: 'Copiare l\'indirizzo FTP',
    verQr: 'Mostrare il codice QR dell\'indirizzo',
    qrTitulo: 'Indirizzo FTP di questo sito',
    qrAviso: 'Il codice contiene solo l\'indirizzo, non la password.',
  },
  correo: {
    descripcion:
      'Gli intercettatori catturano le e-mail inviate dai suoi progetti affinché possa controllarle senza che escano su internet. Rimangono in ascolto solo su questo computer (127.0.0.1) e ne è attivo solo uno alla volta.',
    seccionCaptadores: 'Intercettatori locali',
    seccionProveedores: 'Provider SMTP remoti',
    proveedores: {
      descripcion:
        'Un provider SMTP reale invia l\'e-mail per davvero: lo usi per testare l\'invio del suo progetto prima di pubblicarlo. La password viene salvata cifrata su questo computer e non viene mai mostrata.',
      agregar: 'Aggiungere provider',
      vacio:
        'Non ha ancora aggiunto alcun provider. Scelga Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO o Gmail, oppure inserisca il suo.',
      errorLista: 'Impossibile leggere l\'elenco dei provider',
      tarjeta: {
        servidor: 'Server',
        usuario: 'Utente',
        clave: 'Password',
        sinClave: 'Nessuna password',
        claveIlegible: 'Salvata (impossibile leggerla)',
        red: 'Rete',
        redLocal: 'Server di questo computer o della rete locale (confermato)',
        editar: 'Modificare',
        borrar: 'Eliminare',
        borrarTitulo: (n: string) => `Eliminare ${n}?`,
        borrarTexto:
          'Vengono eliminati il provider e la sua password salvata. I progetti che lo usano tornano all\'intercettatore locale, ma i loro file .env non vengono toccati: conservano le variabili MAIL_* di questo provider (e la sua password, se l\'ha scritta). Riscriva il blocco della posta in ciascun .env.',
        borrado: (n: string) => `${n} eliminato`,
        usar: 'Usare in un progetto',
        destino: 'Indirizzo di destinazione del test',
        destinoPlaceholder: 'suo-indirizzo@esempio.com',
        probar: 'Testare invio',
        probando: 'Invio in corso…',
        probarAyuda:
          'Invia una sola e-mail reale a quell\'indirizzo, con connessione cifrata verificata. Massimo una ogni 15 s.',
        sinClaveParaProbar: 'Salvi la password del provider per poter testare l\'invio.',
        hostLocal: 'Il nome di questo server si risolve a questo computer o alla rete locale.',
        confirmarRed: 'Confermare rete locale',
        enviado: (para: string) => `E-mail inviata a ${para}. Controlli la sua casella.`,
        fallos: {
          'correo.auth': 'Il provider ha rifiutato l\'utente o la password.',
          'correo.conexion': 'Impossibile connettersi: controlli l\'host e la porta.',
          'correo.tls':
            'La connessione cifrata non è valida (certificato, nome o STARTTLS). Non è stato inviato nulla.',
          'correo.rechazado':
            'Il server ha rifiutato il messaggio o un indirizzo. Controlli il mittente: molti provider accettano solo un mittente o un dominio verificato.',
          'correo.plazo': 'Il server non ha risposto in tempo (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Aggiungere provider SMTP',
        editar: (n: string) => `Modificare ${n}`,
        preset: 'Provider',
        presetOtro: 'Altro (inserire i dati)',
        presetAyuda: 'Host e porta provengono dalla documentazione ufficiale di ciascun provider.',
        documentacion: 'Vedere documentazione',
        region: 'Regione',
        nombre: 'Nome',
        nombreObligatorio: 'Inserisca un nome.',
        host: 'Server (host)',
        hostAyuda: 'Solo il nome o l\'IP, senza smtp:// né porta.',
        hostObligatorio: 'Inserisca il server.',
        puerto: 'Porta',
        seguridad: 'Crittografia',
        seguridadAyuda:
          'È sempre richiesta una connessione cifrata con certificato valido: non si scende mai a testo in chiaro.',
        tls: 'TLS diretto (porta 465)',
        starttls: 'STARTTLS (porta 587)',
        usuario: 'Utente',
        usuarioObligatorio: 'Inserisca l\'utente.',
        usuarioFijoAyuda: 'Questo provider usa sempre questo utente; la password è quella del suo account.',
        clave: 'Password SMTP',
        claveGuardada: (f: string) => `Salvata: ••••${f}`,
        claveNueva: 'Inserisca la password per salvarla',
        claveAyuda:
          'Viene salvata cifrata su questo computer e non viene più mostrata. La lasci vuota per non modificarla.',
        remitente: 'Mittente del test (opzionale)',
        remitenteAyuda:
          'Molti provider inviano solo da un mittente o un dominio verificato. Se lo lascia vuoto, il mittente è lo stesso indirizzo di destinazione.',
        claveSinEspacios:
          'Incolli la password così come fornita dal provider: gli spazi interni vengono conservati.',
        borrarClave: 'Eliminare la password',
        borrarClaveTitulo: (n: string) => `Eliminare la password di ${n}?`,
        borrarClaveTexto: 'La password salvata viene eliminata. Il provider rimane nell\'elenco.',
        claveBorrada: 'Password eliminata',
        guardar: 'Salvare',
        guardado: (n: string) => `${n} salvato`,
        redLocalTitulo: 'Server su questo computer o sulla rete locale',
        redLocalTexto: (h: string) =>
          `${h} punta a questo computer o alla rete locale. WolfCore Dev si connette lì solo se Lei lo conferma. È un suo server?`,
        redLocalConfirmar: 'Sì, è mio',
        cambiaTitulo: 'Inviare la password a un altro server',
        cambiaTexto: (h: string) =>
          `Il provider ha una password salvata e ha cambiato il server o l'utente. La password verrà inviata a ${h}. Continuare?`,
        cambiaConfirmar: 'Sì, continuare',
      },
      env: {
        titulo: (n: string) => `Usare ${n} in un progetto`,
        proyecto: 'Progetto',
        sinProyectos: 'Non ci sono ancora progetti.',
        yaUsaSmtp: 'Questo progetto invia già tramite un provider SMTP.',
        volverCaptador: 'Tornare all\'intercettatore locale',
        volvio: (n: string) =>
          `${n} torna a inviare all'intercettatore locale, ma il suo file .env non è stato toccato: conserva le variabili MAIL_* del provider (e la sua password, se l'ha scritta). Riscriva il blocco della posta.`,
        incluirClave: 'Scrivere anche la password nel file .env',
        incluirClaveAyuda: 'Se non selezionato, il blocco non contiene MAIL_PASSWORD e la aggiunge manualmente.',
        sinClaveGuardada: 'Il provider non ha una password salvata.',
        vista: 'Modifiche al file .env (la password è mascherata)',
        textoPlano:
          'La password resterà in testo in chiaro nel file .env del progetto. Chiunque abbia accesso a quella cartella, o al suo repository se lo carica, potrà leggerla.',
        claveTitulo: 'Scrivere la password nel file .env',
        claveTexto:
          'La password viene salvata in testo in chiaro nel file .env del progetto. La usi solo se il progetto non viene caricato in un repository e la cartella è solo sua.',
        claveConfirmar: 'Ho capito, includere la password',
        agregarGitignore: 'Aggiungere .env al file .gitignore',
        gitignoreTitulo: 'Modificare .gitignore',
        gitignoreTexto:
          'Viene aggiunta la riga .env al file .gitignore del progetto (con una copia di backup preventiva).',
        gitignoreConfirmar: 'Aggiungere',
        versionadoTitulo: 'Git traccia già il file .env',
        versionadoTexto:
          'Il prossimo commit caricherebbe i suoi valori. Lo rimuova dall\'indice con git rm --cached .env.',
        desconocidoTitulo: 'Impossibile verificare git',
        desconocidoTexto: 'Impossibile determinare se git traccia il file .env di questo progetto.',
        aceptarVersionado: 'Scrivere comunque',
        aceptarTitulo: 'Scrivere in un file .env versionato',
        aceptarTexto:
          'Se git traccia il file .env, queste variabili possono finire nel repository. Scrivere comunque?',
        aceptarConfirmar: 'Scrivere comunque',
        confirmarTitulo: 'Scrivere nel file .env',
        confirmarTexto: (ruta: string) =>
          `Verrà salvata una copia di ${ruta} e saranno aggiunte le variabili MAIL_* senza la password.`,
        confirmarTextoClave: (ruta: string) =>
          `Verrà salvata una copia di ${ruta} e saranno aggiunte le variabili MAIL_*, con la password in testo in chiaro.`,
        confirmar: 'Scrivere',
        escribir: 'Scrivere nel file .env',
        escrito: (n: string) => `${n} ora invia tramite questo provider`,
      },
    },
    estado: 'Stato',
    smtp: 'SMTP',
    buzon: 'Casella web',
    abrirBuzon: 'Aprire casella',
    noLeidos: 'Non lette',
    noLeidosValor: (n: number) => plural(n, 'e-mail non letta', 'e-mail non lette'),
    noLeidosError: 'Impossibile leggere la casella',
    actualizar: 'Ricontare le e-mail',
    actualizaSolo: 'Si aggiorna ogni 15 secondi mentre questa schermata è aperta.',
    env: 'Blocco per il file .env di Laravel',
    envAyuda: (captador: string) =>
      `Lo incolli nel file .env del suo progetto. La posta resta in ${captador}, senza crittografia e senza utente.`,
    copiarEnv: 'Copiare blocco',
    irAServicios: 'Andare a Servizi',
    cargando: 'Lettura degli intercettatori in corso…',
    errorLista: 'Impossibile leggere l\'elenco degli intercettatori',
    captador: {
      opcional: 'Opzionale',
      elegido: 'Riceve la posta dei suoi progetti',
      noInstalado: 'Non installato',
      instalar: 'Installare',
      usar: 'Usare questo',
      apagar: 'Spegnere',
      iniciando: 'Avvio in corso…',
      avisoMantenimiento:
        'Questo intercettatore non riceve quasi più manutenzione. Preferisca Mailpit o smtp4dev.',
    },
    notaDescartados:
      'MailHog e MailDev non sono offerti: MailHog non pubblica un\'impronta con cui verificare il download e MailDev esiste solo su npm. Senza un\'impronta verificabile non viene scaricato nulla.',
    notaHost:
      'Le caselle web rispondono solo su 127.0.0.1, ma mentre un intercettatore è acceso una pagina web malevola potrebbe tentare di leggere la sua casella (DNS rebinding). smtp4dev e Papercut rifiutano intestazioni Host estranee; Mailpit serve la sua casella sotto un percorso segreto proprio di questo computer (WolfCore Dev apre quell\'indirizzo per Lei); Inbucket non ha alcuna protezione: lo spenga quando non lo usa.',
  },
  ia: {
    descripcion:
      'Provider di IA nel cloud e modelli locali con Ollama. Le chiavi vengono salvate cifrate su questo computer e non vengono mai mostrate.',
    nube: {
      titulo: 'IA nel cloud',
      agregar: 'Aggiungere provider',
      vacio:
        'Non ha ancora aggiunto alcun provider. Aggiunga OpenAI, Anthropic, Gemini, Hermes (Nous) o un provider compatibile con OpenAI.',
      errorLista: 'Impossibile leggere l\'elenco dei provider',
    },
    local: { titulo: 'IA locale (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Compatibile con OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Chiave',
      sinClave: 'Nessuna chiave',
      claveIlegible: 'Salvata (impossibile leggerla)',
      url: 'URL base',
      modeloPorDefecto: 'Modello predefinito',
      ninguno: 'Nessuno',
      probarConexion: 'Testare connessione',
      probarConexionAyuda: 'Elenca i modelli del provider. Non consuma token.',
      probando: 'Test in corso…',
      conectado: (ms: number, n: number) => `Connesso · ${ms} ms · ${n} modelli`,
      verModelos: (n: number) => `Vedere tutti i ${n} modelli`,
      soloGratuitos: 'Solo gratuiti',
      fallo: 'Impossibile connettersi',
      probarMensaje: 'Testare un messaggio',
      probarMensajeAyuda:
        'Invia un breve messaggio fisso per verificare che il modello risponda. Consuma pochi token.',
      elegirModelo: 'Modello per il messaggio',
      sinModelo: 'Testi la connessione o imposti un modello predefinito per sceglierne uno.',
      enviando: 'Invio in corso…',
      respuesta: (ms: number) => `Risposta in ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} token in ingresso, ${salida} in uscita`,
      usar: 'Usare in un progetto',
      editar: 'Modificare',
      borrar: 'Eliminare',
      acciones: (nombre: string) => `Azioni per ${nombre}`,
    },
    costo: {
      titulo: 'Testare un messaggio',
      texto: (modelo: string, proveedor: string) =>
        `Verrà inviato un breve messaggio fisso al modello ${modelo} di ${proveedor}. Consuma token del suo account: la risposta viene troncata a 16 token e di solito costa frazioni di centesimo.`,
      enviar: 'Inviare il messaggio',
    },
    dialogo: {
      nuevo: 'Aggiungere provider di IA',
      editar: (nombre: string) => `Modificare ${nombre}`,
      tipo: 'Tipo',
      preset: 'Provider compatibile',
      presetAyuda: 'Compila il nome e l\'URL; può modificarli.',
      presetOtro: 'Altro',
      documentacion: 'Vedere documentazione',
      nombre: 'Nome',
      urlBase: 'URL base',
      urlAyuda: 'Vuoto = quello ufficiale. Solo https://, oppure http:// verso 127.0.0.1 o [::1] (LM Studio).',
      urlObligatoria: 'Inserisca l\'URL base del provider compatibile.',
      modelo: 'Modello predefinito (opzionale)',
      modeloAyuda: 'Viene usato nel blocco .env (AI_MODEL) e nel messaggio di test.',
      clave: 'Chiave API',
      claveNueva: 'Incolli la chiave',
      claveGuardada: (final: string) =>
        `È presente una chiave salvata (${final}). Ne inserisca un'altra solo se desidera sostituirla.`,
      claveAyuda:
        'Viene salvata cifrata su questo computer e non viene più mostrata. Sono visibili solo gli ultimi 4 caratteri.',
      claveOpcional: 'Opzionale per server locali (LM Studio).',
      borrarClave: 'Eliminare la chiave',
      guardar: 'Salvare',
      guardado: (nombre: string) => `${nombre} salvato`,
      urlCambiaTitulo: 'La chiave verrà inviata a un altro URL',
      urlCambiaTexto: (url: string) =>
        `Questo provider ha una chiave salvata. D'ora in poi verrà inviata a ${url}. Confermi solo se si fida di quel server.`,
      urlCambiaConfirmar: 'Inviare la chiave al nuovo URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Eliminare la chiave di ${nombre}?`,
      claveTexto:
        'La chiave viene eliminata da questo computer. I file .env in cui l\'ha scritta non vengono toccati: la modifichi anche lì se la revoca.',
      proveedorTitulo: (nombre: string) => `Eliminare ${nombre}?`,
      proveedorTexto:
        'Vengono eliminati il provider e la sua chiave salvata. I file .env dei suoi progetti non vengono toccati.',
      respaldos: (n: number) =>
        n === 1
          ? 'Eliminare anche le copie del file .env di 1 progetto che contengono questa chiave in testo in chiaro'
          : `Eliminare anche le copie del file .env di ${n} progetti che contengono questa chiave in testo in chiaro`,
      respaldosAyuda:
        'WolfCore Dev salva copie del file .env prima di scriverlo, fuori dai progetti. L\'eliminazione non può essere annullata.',
      claveBorrada: 'Chiave eliminata',
      proveedorBorrado: (nombre: string) => `${nombre} eliminato`,
      respaldosBorrados: (n: number) => `Eliminate le copie del file .env di ${n} progetto/i`,
    },
    env: {
      titulo: (nombre: string) => `Usare ${nombre} in un progetto`,
      proyecto: 'Progetto',
      sinProyectos: 'Non ci sono progetti montati.',
      modelo: 'Modello (AI_MODEL)',
      modeloAyuda: 'Opzionale. Ne scelga uno dall\'elenco o lo scriva.',
      vista: 'Blocco che verrà scritto nel file .env (la chiave è mostrata mascherata)',
      cargando: 'Preparazione dell\'anteprima…',
      textoPlano:
        'La chiave resterà in testo in chiaro nel file .env del progetto. Chiunque abbia accesso a quella cartella potrà leggerla.',
      copiaPrevia:
        'Il file .env attuale viene copiato prima, fuori dal progetto (nella cartella dati di WolfCore Dev).',
      sinClave: 'Questo provider richiede una chiave: la salvi prima di usarlo in un progetto.',
      gitignoreFalta: 'Il file .gitignore del progetto non ignora il file .env.',
      gitignoreNoExiste: 'Il progetto non ha un file .gitignore.',
      gitignoreOk: 'Il file .gitignore ignora già il file .env.',
      agregarGitignore: 'Aggiungere .env al file .gitignore',
      gitignoreTitulo: 'Modificare .gitignore',
      gitignoreTexto:
        'Verrà aggiunta la riga .env al file .gitignore del progetto (o verrà creato il file), con una copia di backup preventiva.',
      gitignoreConfirmar: 'Aggiungere a .gitignore',
      versionadoTitulo: 'Git traccia già il file .env di questo progetto',
      versionadoTexto:
        'Anche se è in .gitignore, il prossimo commit caricherebbe la chiave. Prima di scriverla, lo rimuova dall\'indice ed esegua il commit:',
      desconocidoTitulo: 'Impossibile verificare se git traccia il file .env',
      desconocidoTexto:
        'Git non ha risposto (non è installato o la cartella non è fidata). Se il file .env è già nel repository, il prossimo commit caricherebbe la chiave. Verifichi con:',
      aceptarVersionado: 'Comprendo il rischio: scrivere comunque la chiave',
      aceptarTitulo: 'Scrivere anche se git potrebbe caricare la chiave',
      aceptarTexto:
        'Se il file .env è nel repository, la chiave resterà nel prossimo commit e nella cronologia. Lo faccia solo se ha già eseguito git rm --cached .env o se il repository è solo suo.',
      aceptarConfirmar: 'Accetto il rischio',
      conflictoTitulo: 'Il file .env definisce già queste variabili con un altro valore',
      reemplazar: (claves: string) => `Sostituire ${claves}`,
      reemplazarTitulo: 'Sostituire variabili del file .env',
      reemplazarTexto: (claves: string) =>
        `Verranno rimosse le righe di ${claves} già presenti nel file .env e resteranno quelle del blocco di WolfCore Dev. Il file .env precedente viene copiato prima.`,
      reemplazarConfirmar: 'Sostituire',
      escribir: 'Scrivere in .env',
      confirmarTitulo: 'Scrivere la chiave in testo in chiaro',
      confirmarTexto: (carpeta: string) =>
        `La chiave verrà scritta non cifrata in ${carpeta}. Non condivida quel file né lo carichi in un repository.`,
      confirmar: 'Scrivere la chiave',
      escrito: (proyecto: string) => `Blocco IA scritto nel file .env di ${proyecto}`,
      copiarComando: 'Copiare comando',
    },
  },
  iaLocal: {
    descripcion:
      'Modelli linguistici in esecuzione sul suo computer con Ollama. Li usi dai suoi progetti senza inviare dati su internet.',
    sinInstalarTitulo: 'Ollama non è installato',
    sinInstalar: 'Lo installi da Servizi per scaricare e usare modelli sul suo computer.',
    irAServicios: 'Andare a Servizi',
    apagadoTitulo: 'Ollama è spento',
    apagado: 'Lo avvii per vedere, scaricare e testare i modelli.',
    iniciando: 'Ollama si sta avviando…',
    errorTitulo: 'Impossibile avviare Ollama',
    encender: 'Avviare Ollama',
    verServicios: 'Vedere in Servizi',
    modelos: 'Modelli installati',
    sinModelos: 'Non ci sono ancora modelli. Ne scarichi uno qui sotto.',
    errorModelos: 'Impossibile leggere l\'elenco dei modelli',
    recargar: 'Ricaricare l\'elenco',
    total: (n: number) => plural(n, 'modello', 'modelli'),
    espacio: 'Spazio utilizzato',
    espacioAyuda: 'Lo spazio occupato da tutti i modelli nella cartella dati.',
    probarDe: (modelo: string) => `Testare ${modelo}`,
    borrarDe: (modelo: string) => `Eliminare ${modelo}`,
    borrarTitulo: (modelo: string) => `Eliminare il modello ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `Vengono liberati ${tamano} su disco. Per usarlo di nuovo dovrà scaricarlo un'altra volta.`,
    borrado: (modelo: string) => `Modello ${modelo} eliminato`,
    descargar: {
      titulo: 'Scaricare un modello',
      campo: 'Nome del modello',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Inserisca il nome usato da Ollama (ollama.com/library) o scelga un suggerimento.',
      sugerenciaAyuda: {
        'llama3.2': 'Chat generale, leggero',
        'qwen2.5-coder': 'Programmazione',
        mistral: 'Chat generale',
        'nomic-embed-text': 'Embedding per ricerche (bot)',
      } as Record<string, string>,
      boton: 'Scaricare',
      invalido: 'Usi lettere, numeri e . _ : / - (per esempio llama3.2)',
      yaInstalado: 'Quel modello è già installato',
      enCurso: 'Quel modello è già in fase di download',
      confirmarTitulo: (modelo: string) => `Scaricare ${modelo}?`,
      confirmarTexto:
        'I modelli occupano spesso diversi GB (da 1 a oltre 40 a seconda delle dimensioni). Ollama non comunica le dimensioni prima di iniziare: le vedrà nella barra di avanzamento e può annullare in qualsiasi momento.',
      confirmar: 'Scaricare',
    },
    progreso: {
      fases: {
        preparando: 'Preparazione…',
        descargando: 'Download in corso',
        verificando: 'Verifica in corso',
        guardando: 'Salvataggio in corso',
        listo: 'Pronto',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} di ${total}`,
      cancelarDe: (modelo: string) => `Annullare il download di ${modelo}`,
      cancelando: 'Annullamento…',
      listo: (modelo: string) => `${modelo} scaricato`,
      cancelado: (modelo: string) => `Download di ${modelo} annullato`,
      error: (modelo: string) => `Impossibile scaricare ${modelo}`,
      descartar: 'Ignorare',
      descartarDe: (modelo: string) => `Ignorare l'avviso di ${modelo}`,
    },
    prueba: {
      titulo: 'Testare un modello',
      modelo: 'Modello',
      elegir: 'Scelga un modello',
      prompt: 'Messaggio',
      placeholder: 'Scriva una breve domanda e prema Invio',
      enviar: 'Inviare',
      respuesta: 'Risposta',
      pensando: 'Il modello sta rispondendo… la prima volta può richiedere tempo mentre si carica.',
      vacia: '(Il modello non ha restituito testo.)',
      sinModelos: 'Scarichi un modello per testarlo.',
    },
    conexion: {
      titulo: 'Connessione dai suoi progetti',
      base: 'URL base di Ollama',
      openai: 'Endpoint compatibile con OpenAI',
      env: 'Blocco per il file .env',
      envAyuda:
        'Valido per Laravel o per un bot con FastAPI. WolfCore Dev non scrive nei suoi progetti.',
      copiarEnv: 'Copiare blocco',
      copiarDato: (dato: string) => `Copiare ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code e Codex potranno connettersi a questi modelli con un clic nella Fase B.',
  },
  proyectos: {
    titulo: 'Progetti',
    descripcion:
      'Ogni progetto è una cartella con il proprio sito .test, la propria ricetta di installazione e i propri processi.',
    agregar: 'Aggiungere progetto',
    vacioTitulo: 'Non ci sono ancora progetti',
    vacio:
      'Cloni un repository GitHub o scelga una cartella: WolfCore Dev rileva il tipo di progetto e lo prepara passo dopo passo.',
    pasos: {
      porTipo: {
        'composer-install': 'Installare le dipendenze PHP (composer install)',
        'env-crear': 'Creare il file .env',
        'key-generate': 'Generare la chiave dell\'applicazione',
        'bd-crear': 'Creare il database',
        'bd-restaurar': 'Ripristinare un backup',
        migrar: 'Eseguire le migrazioni del database',
        'storage-link': 'Collegare storage (storage:link)',
        'npm-ci': 'Installare le dipendenze Node (npm ci)',
        'npm-build': 'Compilare le risorse (npm run build)',
        'python-venv': 'Creare l\'ambiente virtuale (.venv)',
        'pip-install': 'Installare le dipendenze Python (pip)',
        'pgvector-activar': 'Attivare pgvector nel database',
        'sitio-crear': 'Creare il sito',
        comando: 'Comando del progetto',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Creare il sito ${dominio}` : 'Creare il sito'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Ripristinare il backup ${archivo}` : 'Ripristinare un backup',
      migrar: 'Eseguire le migrazioni del database',
      migrarSemilla: 'Eseguire le migrazioni del database e caricare dati di prova (--seed)',
      comando: (linea: string) => (linea ? `Eseguire: ${linea}` : 'Comando del progetto'),
    },
    estadoPaso: {
      pendiente: 'In attesa',
      corriendo: 'In corso',
      listo: 'Pronto',
      error: 'Errore',
      omitido: 'Saltato',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Non preparato',
      corriendo: 'Preparazione…',
      lista: 'Preparato',
      error: 'Un passaggio non è riuscito',
      cancelada: 'Preparazione annullata',
      incompleta: 'Preparazione incompleta',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Aggiungere progetto',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Cartella' },
      destino: 'Cartella di destinazione',
      destinoAyuda: (base: string) =>
        `Viene clonato in ${base}. Per un'altra posizione, usi "Scegliere cartella…".`,
      nombreCarpeta: 'Nome della cartella',
      nombrePlaceholder: 'mio-progetto',
      elegirDestino: 'Scegliere cartella…',
      destinoPorDefecto: 'Usare la cartella dei progetti',
      clonar: 'Clonare',
      clonando: 'Clonazione…',
      clonado: 'Repository clonato',
      errorClonar: 'Impossibile clonare il repository',
      sinCancelar:
        'La clonazione non può essere interrotta da qui: attenda il completamento (può richiedere diversi minuti).',
      sinGit: 'Git non è installato. Lo installi (git-scm.com) e riapra questa finestra.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Connesso con GitHub CLI come ${usuario}` : 'Connesso con GitHub CLI',
      estadoToken: 'Connesso con un token personale',
      estadoNinguna: 'Non connesso a GitHub',
      ayudaNinguna:
        'Acceda con GitHub CLI (consigliato) o usi un token personale granulare con permesso di lettura dei contenuti.',
      instalarGh: 'Installare GitHub CLI',
      instalandoGh: 'Installazione di GitHub CLI in corso…',
      ghInstalado: 'GitHub CLI installato. Ora effettui l\'accesso.',
      iniciarSesion: 'Accedi',
      sesionAbierta:
        'È stata aperta una finestra per effettuare l\'accesso. Al termine, prema "Controlla di nuovo".',
      comprobar: 'Controlla di nuovo',
      usarToken: 'Usa un token',
      token: 'Token personale di GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Viene salvato cifrato su questo computer e non viene mai più mostrato né scritto nei progetti.',
      guardarToken: 'Salva token',
      tokenGuardado: 'Token salvato',
      quitarToken: 'Rimuovi token',
      tokenQuitado: 'Token rimosso',
      buscar: 'Cerca repository',
      cargando: 'Caricamento repository…',
      sinRepos: 'Nessun repository trovato.',
      cargarMas: 'Carica altri',
      privado: 'Privato',
      yaClonado: 'Già clonato',
      yaClonadoAyuda: 'Esiste già un progetto con questo repository o nella sua cartella di destinazione.',
      actualizado: (fecha: string) => `Aggiornato ${fecha}`,
      elegir: 'Scegli',
      errorRepos: 'Impossibile leggere l\'elenco dei repository',
    },
    url: {
      etiqueta: 'URL del repository',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:percorso o utente/progetto (GitHub). Senza utente né password nell\'URL.',
      invalida: 'Usi https://…, git@host:percorso o utente/progetto',
    },
    carpeta: {
      titulo: 'Progetto già presente sul computer',
      texto: 'Scelga la cartella: viene rilevato il tipo di progetto e proposta la relativa ricetta.',
      elegir: 'Scegli cartella',
      manual: 'Aggiungi senza ricetta (configurazione manuale)',
      yaEsProyecto: (nombre: string) => `Questa cartella è già il progetto ${nombre}.`,
      vigilarTitulo: 'Cartella monitorata',
      vigilarTexto:
        'WolfCore Dev avvisa quando compare una nuova cartella che sembra un progetto. È anche la cartella in cui vengono clonati i repository.',
      vigilando: (carpeta: string) => `Monitoraggio di ${carpeta}`,
      sinVigilar: 'Nessuna cartella monitorata.',
      vigilar: 'Scegli cartella da monitorare',
      cambiarVigilada: 'Cambia',
      dejarDeVigilar: 'Interrompi monitoraggio',
    },
    asistente: {
      titulo: (nombre: string) => `Prepara ${nombre}`,
      cargando: 'Analisi del progetto in corso…',
      origenYml: 'La ricetta proviene dal file wolfcore.yml del repository.',
      origenDefecto: 'Ricetta proposta in base al tipo di progetto.',
      deteccion: 'Elementi rilevati',
      deteccionAyuda: 'Corregga se qualcosa non corrisponde al progetto.',
      tipo: 'Tipo',
      php: 'PHP',
      phpNinguno: 'Nessuno installato',
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
      versionAuto: 'Quella rilevata',
      servicios: 'Servizi',
      serviciosNinguno: 'Nessuno',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Rilevato: ${v}`,
      nodeInstalar: 'Node non è installato: lo installi in Servizi.',
      pythonInstalar: 'Python non è installato: lo installi in Servizi.',
      lenguajeInstalar: (nombre: string) => `${nombre} non è installato: lo installi in Servizi.`,
      dominio: 'Dominio',
      puertoProxy: 'Porta locale',
      puertoPlaceholder: '8000',
      receta: 'Passaggi',
      recetaAyuda:
        'Vengono eseguiti in ordine. Disattivi quelli che non desidera; quelli opzionali possono essere spostati.',
      subir: 'Sposta su',
      bajar: 'Sposta giù',
      fijo: 'Questo passaggio è necessario',
      restaurar: 'Ripristina un backup…',
      cambiarRespaldo: 'Cambia backup',
      quitarRespaldo: 'Rimuovi backup',
      sobrescribir: 'Sovrascrivi il database se contiene già tabelle',
      semilla: 'Carica dati di prova (--seed)',
      sinMotor:
        'Nessun database: scelga un motore in Servizi per crearlo o ripristinare un backup.',
      confio: 'Mi fido di questo repository: esegui i suoi passaggi di installazione',
      confioAyuda:
        'I passaggi eseguono programmi del progetto (composer, npm, pip, migrazioni) sul Suo computer. Lo selezioni solo se conosce il codice.',
      montar: 'Configura progetto',
      montando: 'Configurazione progetto…',
      reintentar: 'Riprova',
      omitir: 'Salta',
      cancelar: 'Annulla',
      cancelando: 'Annullamento…',
      cerrar: 'Chiudi',
      cerrarCorriendo: 'Nascondi (continua in background)',
      abrirSitio: 'Apri sito',
      verRegistro: 'Visualizza registro',
      ocultarRegistro: 'Nascondi registro',
      listo: 'Il progetto è pronto.',
      fallo: (paso: string) => `Errore: ${paso}. Riprovi, lo salti o annulli; nulla è stato annullato.`,
      cancelada: 'La preparazione è stata annullata. Può riprenderla dalla scheda del progetto.',
      incompleta: 'Restano passaggi da eseguire.',
      errorCrear: 'Impossibile creare il progetto',
      errorReceta: 'Impossibile leggere la ricetta',
      recetaCambio:
        'La ricetta del progetto (wolfcore.yml) è cambiata da quando ha accordato fiducia. Riprova usa la ricetta salvata l\'ultima volta.',
      recargar: 'Rivedi la nuova ricetta',
      seguirGuardada: 'Continua con quella salvata',
      soloLectura:
        'Tipo, PHP, dominio, versioni e porta sono quelli del progetto: li modifichi con Modifica.',
    },
    tarjeta: {
      receta: 'Preparazione',
      reinstalar: 'Reinstalla dipendenze',
      reinstalarTitulo: (nombre: string) => `Eseguire la ricetta di ${nombre}?`,
      reinstalarTexto:
        'Vengono ripetuti i passaggi dell\'ultima preparazione (quelli rivisti nella procedura guidata):',
      noRestaura: 'non viene ripristinato nuovamente',
      recetaCambio:
        'La ricetta del progetto (wolfcore.yml) è cambiata da quando ha accordato fiducia. Reinstalla ripete quella salvata; usi "Rivedi la ricetta" per controllare quella nuova.',
      revisarReceta: 'Rivedi la ricetta',
      preparar: 'Prepara…',
      ejecutar: 'Esegui',
      verPreparacion: 'Visualizza preparazione',
      sinConfianza:
        'Riveda la ricetta e selezioni "Mi fido di questo repository" nella procedura guidata per poterla eseguire.',
      runtimes: 'Avvisi sulle versioni',
      verRegistros: 'Visualizza registri',
      abrirAgente: 'Apri un agente IA',
      vscode: 'Editor',
      vscodeAyuda: 'Apri la cartella del progetto nell\'editor predefinito',
      vscodeError: 'Impossibile aprire l\'editor',
      baseDatos: 'Database',
      baseDatosAyuda: (base: string) =>
        `Apri il database «${base}» già autenticato (Adminer o phpMyAdmin)`,
      baseDatosSinDetectar: 'Apri il database del progetto (Adminer o phpMyAdmin)',
      sinBase: 'Il file .env del progetto non dichiara un database MySQL, MariaDB o PostgreSQL.',
      adminerNoListo: 'Adminer non è pronto',
      entradaAutomatica: 'Accesso già autenticato, senza inserire la password.',
      elegirBd: 'Scegli Adminer o phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (solo MySQL e MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin non è pronto',
      entroComoAdmin: (usuario: string) =>
        `Ha effettuato l'accesso come ${usuario}, l'amministratore del server, perché questo progetto non utilizza un utente dedicato. Nel gestore .env, «Usa utente dedicato» ne crea uno limitato al proprio database.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Ha effettuato l'accesso come ${usuario}, l'amministratore del server: la password dell'utente dedicato di questo progetto non è salvata su questo computer. Nel gestore .env, «Usa utente dedicato» ne genera una nuova.`,
      abrirSitio: 'Apri il sito nel browser',
      github: 'Repository',
      abrirRemoto: (url: string) => `Apri ${url}`,
      confiado: 'Attendibile',
      confiadoAyuda: 'I suoi passaggi di installazione possono essere eseguiti.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'HEAD scollegato',
      cambios: (n: number) => plural(n, 'modifica non salvata', 'modifiche non salvate'),
      limpio: 'Nessuna modifica',
      atras: (n: number) => `${n} da scaricare`,
      adelante: (n: number) => `${n} da caricare`,
      traer: 'Scarica modifiche',
      traerAyuda: 'git pull senza merge: se ci sono modifiche locali o rami divergenti non tocca nulla.',
      alDia: 'Era già aggiornato.',
      actualizado: 'Modifiche scaricate',
      sugeridosTitulo: 'Modifiche scaricate',
      sugeridosTexto: 'In base a ciò che è cambiato, conviene eseguire questi passaggi:',
      sugeridosNinguno: 'Non è necessario eseguire alcun passaggio.',
      migracionesNuevas: (n: number) => plural(n, 'nuova migrazione', 'nuove migrazioni'),
      ejecutarSugeridos: 'Esegui passaggi',
      corridaTitulo: 'Passaggi dopo lo scaricamento',
      corridaAyuda: 'Non modifica la ricetta salvata del progetto.',
      ahoraNo: 'Non ora',
      errorEstado: 'Impossibile leggere lo stato di Git',
      commitIa: {
        boton: 'Suggerisci commit',
        ayuda:
          'Propone tramite IA un messaggio per i file preparati (git add) ed esegue il commit se Lei lo accetta.',
        titulo: 'Commit con messaggio suggerito',
        proveedor: 'Fornitore IA',
        modelo: 'Modello',
        sinProveedores:
          'Configuri un fornitore IA nel cloud (schermata IA) per suggerire messaggi.',
        privacidad:
          'Al fornitore viene inviato il diff dei file preparati, senza .env, chiavi, certificati, file di credenziali né binari, e al massimo 20 000 caratteri. Consuma pochi token.',
        sugerir: 'Suggerisci messaggio',
        mensaje: 'Messaggio (può modificarlo)',
        commit: 'Esegui commit',
        commitAyuda: 'Solo i file preparati (git add): non aggiunge file né esegue push.',
        hecho: 'Commit eseguito con i file preparati.',
      },
    },
    procesos: {
      titulo: 'Processi',
      /** Messaggio del supervisore di un processo senza riavvio terminato con codice 0. */
      terminado: 'Terminato senza errori',
      ninguno: 'Nessun processo. Aggiunga npm run dev, queue:work, uvicorn…',
      agregar: 'Aggiungi processo',
      editar: 'Modifica processo',
      nuevo: 'Nuovo processo',
      interruptor: (nombre: string) => `Avvia o arresta ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx inoltra il sito a questo processo.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'riavvio', 'riavvii'),
      verLog: 'Visualizza log',
      ocultarLog: 'Nascondi log',
      logVacio: 'Nessun output al momento.',
      abrirCarpetaLog: 'Apri cartella del log',
      quitar: 'Rimuovi processo',
      quitarTitulo: (nombre: string) => `Rimuovere il processo ${nombre}?`,
      quitarTexto: 'Se è in esecuzione verrà arrestato.',
      nombre: 'Nome',
      nombrePlaceholder: 'Vite',
      comando: 'Comando',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Programma e argomenti, senza shell. Usi le virgolette per gli argomenti con spazi.',
      cwd: 'Cartella',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz o una sottocartella del progetto (ad esempio, frontend).',
      puertoCampo: 'Porta',
      puertoNinguno: 'Nessuna',
      puertoAyuda: 'Solo informativo, a meno che il processo non sia la destinazione del proxy.',
      autoIniciar: 'Avvia all\'avvio di WolfCore Dev',
      reiniciar: 'Riavvia in caso di arresto anomalo',
      esProxy: 'Destinazione del proxy Nginx',
      requiereReinicio:
        'Il processo è in esecuzione: le modifiche a comando, cartella o porta si applicano al riavvio.',
      reinicieAhora: 'Salvato. Arresti e riavvii il processo per applicare le modifiche.',
      guardado: 'Processo salvato',
      errores: {
        comando: 'Inserisca il comando',
        puerto: 'La porta deve essere compresa tra 1 e 65535',
        proxySinPuerto: 'La destinazione del proxy richiede una porta',
        cwd: 'Usi raiz o una sottocartella all\'interno del progetto',
        repetido: 'Esiste già un processo con questo nome',
      },
      estados: {
        encendido: 'Attivo',
        apagado: 'Arrestato',
        iniciando: 'Avvio in corso…',
        error: 'Errore',
        externo: 'Esterno',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Registri di ${nombre}`,
      fuente: 'Origine',
      ninguna: 'Questo progetto non ha ancora registri.',
      vacio: 'Il registro è vuoto.',
      actualizar: 'Aggiorna',
      abrirCarpeta: 'Apri cartella',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'C\'è una nuova cartella che sembra un progetto'
          : `Ci sono ${n} nuove cartelle che sembrano progetti`,
      montar: 'Prepara',
      ignorar: 'Ignora',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Email non lette',
    correoApagado: 'Mailpit arrestato',
    correoSinInstalar: 'Mailpit non installato',
    modelos: 'Modelli IA',
    iaApagada: 'Ollama arrestato',
    iaSinInstalar: 'Ollama non installato',
    sinLeer: 'Impossibile leggere',
    sinDato: '—',
  },
  /* ───────────── Pannello prestazioni, visualizzatore registri e MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'g',
    /** Worker N di un servizio (es. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Prestazioni',
    ventana: 'Ultimi 5 minuti',
    pausado: 'In pausa mentre la finestra è nascosta',
    esperando: 'In attesa del primo campione…',
    errorMuestreo: (detalle: string) => `Impossibile richiedere il campionamento delle prestazioni: ${detalle}`,
    cpu: 'CPU',
    ram: 'Memoria',
    disco: 'Disco dati',
    red: 'Rete',
    deTotal: (usado: string, total: string) => `${usado} di ${total}`,
    libre: (libre: string) => `${libre} liberi`,
    bajada: 'Download',
    subida: 'Upload',
    graficaCpu: (valor: string) => `Grafico CPU degli ultimi 5 minuti; ora ${valor}`,
    graficaRam: (valor: string) => `Grafico memoria degli ultimi 5 minuti; ora ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Grafico rete degli ultimi 5 minuti; download ${bajada}, upload ${subida}`,
    alertas: {
      titulo: 'Avvisi',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `La porta ${puerto} di ${servicio} è usata da un altro programma: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `La memoria del computer è al ${porcentaje} %. Arresti ciò che non utilizza per migliorare la reattività.`,
      huerfano: (pid: number, puertos: number[]) =>
        `È presente un php-cgi non appartenente a WolfCore Dev (PID ${pid}) in ascolto su ${puertos.join(', ')}: rimasto da una sessione precedente.`,
      finalizar: 'Termina processo',
      finalizarTitulo: 'Terminare questo processo?',
      finalizarTexto: (nombre: string, pid: number) =>
        `Verrà chiuso ${nombre} (PID ${pid}) senza salvare eventuali dati aperti. Lo utilizzi solo se ha certezza che il programma non serva.`,
      finalizado: (nombre: string) => `${nombre} terminato`,
      verPuertos: 'Visualizza porte',
      errorPuertos: 'Impossibile verificare quali programmi utilizzano le porte.',
    },
    procesos: {
      titulo: 'Servizi e processi',
      vacio: 'Nessun servizio o processo di progetto in esecuzione.',
      nombre: 'Nome',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Porta',
      encendido: 'Attivo',
      acciones: 'Azioni',
      detener: 'Arresta',
      registros: 'Visualizza registri',
      servicio: 'Servizio',
      proyecto: 'Progetto',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Registri',
    descripcion:
      'Segua in tempo reale i registri di Nginx, PHP, servizi, siti, processi di progetto e tunnel.',
    fuente: 'Origine',
    elegirFuente: 'Scelga un registro',
    sinFuentes:
      'Non ci sono ancora registri. Compaiono appena un servizio, un sito o un processo scrive il primo.',
    buscar: 'Filtra per testo',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Metti in pausa',
    reanudar: 'Riprendi',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 nuova riga in pausa' : `${n} nuove righe in pausa`,
    copiar: 'Copia visibili',
    copiadas: (n: number) => (n === 1 ? '1 riga copiata' : `${n} righe copiate`),
    limpiar: 'Pulisci',
    abrirCarpeta: 'Apri cartella',
    alFinal: 'Segui la fine',
    mostrarMas: 'Mostra altri',
    ocultas: (n: number) =>
      n === 1 ? '1 riga precedente non mostrata' : `${n} righe precedenti non mostrate`,
    vacio: 'Nessuna riga al momento. Le nuove righe appariranno qui appena vengono scritte.',
    sinCoincidencias: 'Nessuna riga corrisponde al filtro.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} righe` : `${visibles} di ${total} righe`,
    descartadas: (n: number) => `(si conservano le ultime 5000; ${n} più vecchie scartate)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Servizi',
      sitio: 'Siti',
      laravel: 'Laravel',
      proyecto: 'Processi di progetto',
      tunel: 'Tunnel',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (accessi)',
      nginxError: 'Nginx (errori)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (accessi)`,
      sitioError: (dominio: string) => `${dominio} (errori)`,
      tunel: (sitio: string) => `Tunnel di ${sitio}`,
      tunelSalida: (sitio: string) => `Tunnel di ${sitio} (output)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Apra un nuovo terminale per vedere la modifica: i terminali già aperti non la rilevano.',
    enPathSinCliente: 'Nel PATH, ma manca il comando',
    reparar: 'Ripara',
    repararTitulo: 'Riparare il comando wolf?',
    repararTexto:
      'wolf è nel PATH ma i suoi file non sono completi. Verranno copiati nuovamente nella cartella dati e verrà avviato il server locale, come durante l\'aggiunta.',
    titulo: 'Terminale: comando wolf',
    descripcion:
      'Gestisca WolfCore Dev da PowerShell, cmd o Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Funziona solo con l\'app aperta.',
    activo: 'Disponibile nel PATH',
    enPathSinServidor: 'Nel PATH, server arrestato',
    inactivo: 'Non presente nel PATH',
    agregarBoton: 'Aggiungi wolf al PATH',
    quitarBoton: 'Rimuovi wolf dal PATH',
    agregarTitulo: 'Aggiungere wolf al PATH dell\'utente?',
    agregarTexto:
      'Il comando wolf verrà copiato nella cartella dati di WolfCore Dev, tale cartella sarà aggiunta al PATH del Suo utente (viene salvata una copia del PATH originale) e verrà avviato un server locale su 127.0.0.1 che risponde solo a wolf con una chiave che cambia a ogni avvio. Pubblicare un sito su Internet o cambiare la versione di PHP per tutti i terminali richiede comunque conferma nella finestra dell\'app. Può rimuoverlo in qualsiasi momento.',
    agregar: 'Aggiungi',
    quitarTitulo: 'Rimuovere wolf dal PATH?',
    quitarTexto:
      'La cartella di wolf verrà rimossa dal PATH del Suo utente, il server locale sarà arrestato e il comando copiato verrà eliminato. I terminali aperti non cambiano.',
    quitar: 'Rimuovi',
    listoTitulo: 'Comando wolf aggiornato',
    ayuda: 'Apra un nuovo terminale dopo averlo aggiunto. Il server ascolta solo su 127.0.0.1.',
    aislado: 'Con una cartella dati di prova (WOLFCORE_DATOS) il PATH non viene modificato.',
    errorCargar: (detalle: string) => `Impossibile leggere lo stato di wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Server MCP',
    descripcion:
      'Consente a Claude Code e ad altri assistenti di gestire siti, servizi e database da questo computer. Ascolta solo su 127.0.0.1 e richiede un token.',
    estado: 'Stato',
    activo: 'Attivo',
    inactivo: 'Arrestato',
    activar: 'Attiva',
    detener: 'Arresta',
    activado: 'Server MCP attivo',
    detenido: 'Server MCP arrestato',
    direccion: 'Indirizzo',
    puerto: 'Porta',
    puertoAyuda: 'Tra 1024 e 65535. Se attivo, viene riavviato sulla nuova porta.',
    puertoRango: 'Usi un numero compreso tra 1024 e 65535',
    puertoGuardado: (p: number) => `Il server MCP utilizzerà la porta ${p}`,
    copiarConfig: 'Copia configurazione per Claude Code',
    copiarConfigAyuda:
      'Copia negli appunti la configurazione con il token. La incolli in Claude Code; il token non viene mostrato qui.',
    configCopiada: 'Configurazione copiata negli appunti',
    regenerar: 'Rigenera token',
    regenerarTitulo: 'Rigenerare il token del server MCP?',
    regenerarTexto:
      'Il token attuale smette di essere valido all\'istante: gli assistenti connessi dovranno utilizzare la nuova configurazione.',
    regenerado: 'Token rigenerato. Copi nuovamente la configurazione.',
    errorCargar: (detalle: string) => `Impossibile leggere lo stato del server MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Un assistente richiede conferma',
      herramienta: 'Strumento',
      pendientes: (actual: number, total: number) => `${actual} di ${total}`,
      aprobar: 'Approva',
      rechazar: 'Rifiuta',
      aprobada: 'Azione approvata',
      rechazada: 'Azione rifiutata',
      vencida: 'La richiesta non era più in sospeso.',
      descartadas: (n: number) =>
        n === 1
          ? 'e 1 altra che non è rientrata (scadrà automaticamente)'
          : `e altre ${n} che non sono rientrate (scadranno automaticamente)`,
      falloRespuesta: (detalle: string) =>
        `Impossibile inviare la risposta; la richiesta resta in sospeso. ${detalle}`,
      si: 'Sì',
      no: 'No',
      campos: {
        motor: 'Motore',
        base: 'Database',
        archivo: 'File',
        sobrescribir: 'Sovrascrivi',
        pid: 'PID',
        nombre: 'Processo',
        proyecto: 'Progetto',
        pasos: 'Passaggi',
        cantidad: 'Dump',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Utilità per il lavoro quotidiano. Funzionano offline e senza servizi esterni.',
    buscar: 'Cerca strumento…',
    sinResultados: 'Nessuno strumento corrisponde alla ricerca.',
    abrir: 'Apri',
    procesar: 'Elaborazione…',
    copiar: 'Copia',
    copiado: 'Copiato negli appunti',
    limpiar: 'Pulisci',
    pendienteApi: 'In sospeso: il nucleo non espone ancora queste informazioni all\'interfaccia.',
    lista: {
      qr: { nombre: 'Generatore QR', descripcion: 'Da un testo o dal link di un tunnel; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Formattare, validare e minificare, con vista ad albero.' },
      regex: {
        nombre: 'Espressioni regolari',
        descripcion: 'Strumento di test con corrispondenze, gruppi e guida rapida.',
      },
      diff: {
        nombre: 'Confronta testi',
        descripcion: 'Differenze affiancate, anche tra file.',
      },
      tiempo: { nombre: 'Tempo', descripcion: 'Timestamp ↔ data, con fuso orario.' },
      puertos: {
        nombre: 'Porte e processi',
        descripcion: 'Cosa è in ascolto su ciascuna porta e terminazione del processo.',
      },
      bom: { nombre: 'Pulizia BOM UTF-8', descripcion: 'Rimuove il BOM da file o cartelle.' },
      certificados: {
        nombre: 'Certificati',
        descripcion: 'Emette certificati con la CA di WolfCore Dev per qualsiasi nome.',
      },
      cripto: {
        nombre: 'Crittografia',
        descripcion: 'Hash, base64, URL, UUID, password e JWT.',
      },
      markdown: { nombre: 'Anteprima Markdown', descripcion: 'Scriva e visualizzi il risultato.' },
      entorno: { nombre: 'Ambiente di sistema', descripcion: 'PATH, versioni e variabili.' },
      buscar: {
        nombre: 'Cerca',
        descripcion: 'Testo nei nomi e nel contenuto di un progetto, una cartella o un file.',
      },
      infoArchivo: {
        nombre: 'Informazioni file',
        descripcion: 'Dimensione, tipo e hash di un file.',
      },
      websocket: { nombre: 'Client WebSocket', descripcion: 'Connettersi, inviare e visualizzare messaggi.' },
      contrasenas: {
        nombre: 'Password',
        descripcion: 'Valuta una password e controlla gli account deboli dei Suoi database.',
      },
      qrWifi: {
        nombre: 'QR Wi-Fi',
        descripcion: 'Codice QR per consentire ad altri di connettersi alla Sua rete.',
      },
      imagenes: {
        nombre: 'Immagini',
        descripcion: 'Converti in ICO o PNG e comprimi JPEG o WebP.',
      },
      comprimir: {
        nombre: 'ZIP e PDF',
        descripcion: 'Comprimi file e cartelle in ZIP e ottimizza PDF.',
      },
      conversor: {
        nombre: 'Convertitore di documenti',
        descripcion: 'Converti Word, Excel, PDF, CSV e Markdown senza uscire da questo computer.',
      },
    },
    errores: {
      jsonVacio: 'Scriva o incolli un JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `JSON non valido: controlli la riga ${linea}, colonna ${columna}.`,
      banderas: 'Flag non validi: usi solo d, g, i, m, s, u, v o y, senza ripetizioni.',
      regex: (detalle: string) => `Espressione non valida (${detalle}).`,
      trabajador: 'Impossibile eseguire l\'operazione in background.',
      diffLento: 'I testi sono troppo diversi per confrontarli in tempo utile.',
      base64: 'Base64 non valido.',
      utf8: 'Il contenuto decodificato non è testo UTF-8.',
      url: 'Sequenza URL non valida.',
      coste: (max: number) => `Il costo di bcrypt deve essere compreso tra 4 e ${max}.`,
      jwtPartes: 'Il JWT deve avere tre parti separate da un punto.',
      jwtCabecera: 'Impossibile leggere l\'intestazione del JWT.',
      jwtCarga: 'Impossibile leggere il payload del JWT.',
      longitud: 'La lunghezza deve essere compresa tra 4 e 256.',
      sinConjuntos: 'Selezioni almeno un tipo di carattere.',
      sinDominios: 'Inserisca almeno un nome o un indirizzo IP.',
      muchosDominios: (max: number) => `Al massimo ${max} nomi per certificato.`,
    },
    qr: {
      texto: 'Testo o URL',
      textoAyuda: 'Il codice QR viene generato su questo computer; nulla esce sulla rete.',
      tunel: 'Collegamento tunnel di un progetto',
      sinTuneles: 'Nessun tunnel attivo',
      descargar: 'Scarica PNG',
      vacio: 'Inserisca qualcosa per generare il codice.',
      largo: 'Il testo è troppo lungo per un codice QR.',
      descargado: 'Download avviato.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formatta',
      minificar: 'Minifica',
      validar: 'Convalida',
      valido: 'JSON valido.',
      resultado: 'Risultato',
      arbol: 'Albero',
      mas: (n: number) => `… altri ${n}`,
    },
    regex: {
      patron: 'Pattern',
      banderas: 'Flag',
      texto: 'Testo di prova',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'corrispondenza' : 'corrispondenze'}${truncado ? ' (si mostrano le prime)' : ''}`,
      sinCoincidencias: 'Nessuna corrispondenza.',
      tiempo: 'L\'espressione ha impiegato troppo tempo ed è stata interrotta (possibile backtracking catastrofico).',
      grupo: (n: number) => `Gruppo ${n}`,
      referencia: 'Riferimento rapido',
      tabla: [
        ['.', 'Qualsiasi carattere (eccetto a capo senza s)'],
        ['\\d \\w \\s', 'Cifra, lettera/numero/_ e spazio'],
        ['\\D \\W \\S', 'L\'opposto dei precedenti'],
        ['[abc] [^abc]', 'Uno dell\'elenco / nessuno dell\'elenco'],
        ['^ $', 'Inizio e fine (di riga con m)'],
        ['\\b', 'Confine di parola'],
        ['* + ?', 'Zero o più, uno o più, facoltativo'],
        ['{n,m}', 'Tra n e m ripetizioni'],
        ['*? +?', 'Versione pigra (lazy)'],
        ['(…) (?<nombre>…)', 'Gruppo di cattura e con nome'],
        ['(?:…)', 'Gruppo senza cattura'],
        ['(?=…) (?!…)', 'Seguito da / non seguito da'],
        ['a|b', 'Alternativa'],
        ['g i m s u y', 'Globale, ignora maiuscole, multiriga, punto totale, Unicode, sticky'],
      ] as [string, string][],
    },
    diff: {
      original: 'Originale',
      modificado: 'Modificato',
      cargarArchivo: 'Carica file',
      comparar: 'Confronta',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} righe`,
      iguales: 'I testi sono identici.',
      archivoGrande: 'Il file supera i 5 MB; ne scelga uno più piccolo.',
      textoGrande: 'Ogni testo può avere al massimo 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `Si mostrano le prime ${mostradas} di ${total} righe.`,
    },
    tiempo: {
      timestamp: 'Timestamp (secondi o millisecondi)',
      fecha: 'Data (AAAA-MM-GG HH:mm:ss)',
      zona: 'Fuso orario',
      ahora: 'Adesso',
      segundos: 'Secondi',
      milisegundos: 'Millisecondi',
      iso: 'ISO 8601 (UTC)',
      enZona: 'Nel fuso selezionato',
      desplazamiento: 'Scostamento',
      relativo: 'Relativo',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Letto in secondi' : 'Letto in millisecondi',
      timestampInvalido: 'Inserisca solo cifre (può includere il segno).',
      fechaInvalida: 'Usi il formato AAAA-MM-GG HH:mm[:ss] con una data reale.',
      zonaInvalida: 'Fuso orario sconosciuto.',
    },
    puertos: {
      filtro: 'Filtra per porta, PID o nome',
      actualizar: 'Aggiorna',
      columnas: {
        puerto: 'Porta',
        protocolo: 'Protocollo',
        proceso: 'Processo',
        pid: 'PID',
        direcciones: 'Indirizzi',
        acciones: 'Azioni',
      },
      propio: 'WolfCore Dev',
      sistema: 'Sistema',
      finalizar: 'Termina',
      noFinalizable: 'I processi di sistema e quelli di WolfCore Dev non possono essere terminati da qui.',
      confirmarTitulo: 'Termina processo',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) verrà chiuso senza salvare. Per confermare, digiti il nome del processo:`,
      finalizado: (nombre: string) => `${nombre} è stato terminato.`,
      vacio: 'Nessuna porta in uso o impossibile leggerle.',
    },
    bom: {
      explicacion:
        'Prima viene mostrato quali file contengono BOM; durante la pulizia viene salvata una copia .bak-bom di ciascuno. Vengono ignorati node_modules, vendor, .git e i file binari.',
      elegirArchivos: 'Seleziona file',
      elegirCarpeta: 'Seleziona cartella',
      seleccion: (n: number) => `${n} ${n === 1 ? 'percorso selezionato' : 'percorsi selezionati'}`,
      analizar: 'Analizza',
      limpiar: 'Rimuovi BOM',
      confirmar: (n: number) =>
        `Il BOM verrà rimosso da ${n} file (con copia). Continuare?`,
      conBom: (n: number) => `${n} file con BOM`,
      sinBom: 'Nessun file contiene BOM.',
      limpiados: (n: number) => `${n === 1 ? 'Pulito' : 'Puliti'} ${n} file.`,
      copia: 'Copia',
    },
    certificados: {
      explicacion:
        'Firma un certificato con la CA locale di WolfCore Dev. Il file .crt viene salvato dove sceglie e la chiave (.key) accanto ad esso; la chiave non passa mai attraverso l\'interfaccia.',
      dominios: 'Nomi o IP (separati da spazio, virgola o riga)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Emetti e salva',
      guardado: 'Certificato salvato',
      certificado: 'Certificato',
      clave: 'Chiave',
    },
    cripto: {
      texto: 'Testo',
      hash: 'Hash',
      calcular: 'Calcola',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Costo di bcrypt',
      bcryptTrunca: 'bcrypt utilizza solo i primi 72 byte del testo.',
      bcryptVerificar: 'Hash bcrypt da verificare',
      verificar: 'Verifica',
      coincide: 'Il testo corrisponde all\'hash.',
      noCoincide: 'Il testo non corrisponde all\'hash.',
      base64: 'Base64',
      base64Url: 'Variante URL',
      codificar: 'Codifica',
      decodificar: 'Decodifica',
      url: 'Codifica URL',
      decodificarUrl: 'Decodifica URL',
      codificarBase64: 'Codifica base64',
      decodificarBase64: 'Decodifica base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID e password',
      uuid: 'UUID v4',
      generar: 'Genera',
      generarDiez: 'Genera 10',
      contrasena: 'Password casuale',
      longitud: 'Lunghezza',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Simboli',
      jwt: 'Decodifica JWT',
      jwtToken: 'Token',
      cabecera: 'Intestazione',
      carga: 'Payload',
      firmaNoVerificada:
        'Firma non verificata: il contenuto è mostrato così com\'è e potrebbe essere stato alterato.',
      vencido: 'Il token è scaduto (exp).',
      vigente: 'Il token non è scaduto (exp).',
      salida: 'Risultato',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Anteprima',
      ejemplo:
        '# Titolo\n\nTesto con **grassetto**, _corsivo_ e un [collegamento](https://example.com).\n\n- Uno\n- Due\n\n```\ncodice\n```\n',
      seguro:
        'L\'HTML grezzo viene mostrato come testo, i collegamenti pericolosi vengono scartati e le immagini non vengono caricate.',
      imagenOmitida: (alt: string) => `[immagine${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Versione di WolfCore Dev',
      navegador: 'Motore dell\'interfaccia',
      plataforma: 'Piattaforma',
      idioma: 'Lingua',
      zona: 'Fuso orario',
      nucleos: 'Core logici',
      actualizar: 'Aggiorna',
      path: 'PATH',
      pathVacio: 'Il PATH è vuoto.',
      herramientas: 'Strumenti di WolfCore Dev',
      noInstalada: 'Non installato',
      sinRespuesta: 'Nessuna risposta in tempo',
      variables: 'Variabili d\'ambiente',
      filtro: 'Filtra variabili',
      enmascarada: 'Valore nascosto: il nome sembra appartenere a un segreto.',
    },
    busqueda: {
      explicacion:
        'Cerca nei nomi e nel contenuto, senza seguire collegamenti e senza leggere file binari. Per impostazione predefinita salta node_modules, vendor e .git.',
      origen: 'Dove cercare',
      proyecto: 'Progetto',
      elegirCarpeta: 'Seleziona cartella',
      elegirArchivo: 'Seleziona file',
      sinOrigen: 'Selezioni un progetto, una cartella o un file.',
      consulta: 'Testo da cercare',
      modoNombre: 'Nomi',
      modoContenido: 'Contenuto',
      modoAmbos: 'Entrambi',
      regex: 'Espressione regolare',
      mayusculas: 'Distingui maiuscole/minuscole',
      incluir: 'Solo file (separi con virgole, es. *.php)',
      excluir: 'Escludi (separi con virgole)',
      buscar: 'Cerca',
      cancelar: 'Annulla',
      buscando: 'Ricerca in corso…',
      sinResultados: 'Nessuna corrispondenza.',
      truncado: 'Ci sono più risultati di quelli mostrati: affini la ricerca.',
      cancelada: 'Ricerca annullata.',
      abrir: 'Apri nell\'editor',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'corrispondenza' : 'corrispondenze'}`,
      resumen: (archivos: number, examinados: number) =>
        `in ${archivos} file (${examinados} esaminati)`,
    },
    infoArchivo: {
      elegir: 'Seleziona file',
      ayuda: 'Viene letto su questo computer per calcolare gli hash (massimo 200 MB).',
      nombre: 'Nome',
      tamano: 'Dimensione',
      tipo: 'Tipo',
      modificado: 'Modificato',
      sinTipo: 'Sconosciuto',
      grande: 'Il file supera i 200 MB: vengono mostrati i dati senza hash.',
      calculando: 'Calcolo degli hash…',
    },
    websocket: {
      url: 'URL (ws:// o wss://)',
      conectar: 'Connetti',
      desconectar: 'Disconnetti',
      mensaje: 'Messaggio',
      enviar: 'Invia',
      urlInvalida: 'Inserisca un URL che inizi con ws:// o wss://.',
      conectando: 'Connessione in corso…',
      conectado: 'Connesso',
      desconectado: 'Disconnesso',
      error: 'Errore di connessione',
      cerrado: (codigo: number, motivo: string) =>
        `Chiuso (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Inviato',
      recibido: 'Ricevuto',
      binario: (n: number) => `[binario, ${n} byte]`,
      vacio: 'Nessun messaggio ancora.',
      tope: 'Vengono conservati gli ultimi 500 messaggi; ciascuno viene mostrato fino a 10 KB.',
    },
    qrWifi: {
      ssid: 'Nome della rete (SSID)',
      clave: 'Password',
      seguridad: 'Sicurezza',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Nessuna password',
      oculta: 'Rete nascosta',
      mostrar: 'Mostra',
      ocultar: 'Nascondi',
      aviso:
        'Il codice QR contiene la password in chiaro: chiunque lo veda o lo fotografi può connettersi alla Sua rete. Viene generato qui, non viene salvato e viene cancellato alla chiusura di questo pannello.',
      avisoPng:
        'Anche il file PNG scaricato contiene la password all\'interno del codice: lo conservi dove solo Lei può vederlo.',
      escribala:
        'La password viene inserita da Lei: WolfCore Dev non legge mai le password Wi-Fi salvate nel sistema.',
      errorSsid: 'Inserisca il nome della rete (fino a 32 caratteri).',
      errorClave: 'Inserisca la password.',
      errorClaveWpa: 'Una password WPA ha tra 8 e 63 caratteri.',
      vacio: 'Compili i dati per visualizzare il codice.',
      alt: 'Codice QR per connettersi alla rete Wi-Fi',
      descargar: 'Scarica PNG',
      descargado: 'QR salvato',
      largo: 'I dati sono troppo lunghi per un codice QR.',
    },
    imagenes: {
      elegir: 'Seleziona immagine',
      ayuda:
        'Viene elaborata su questo computer (fino a 30 MB e 12000 px per lato). L\'originale non viene modificato: il risultato è un nuovo file.',
      original: 'Originale',
      accion: 'Cosa fare',
      aIco: 'Converti in ICO',
      aPng: 'Converti in PNG',
      comprimir: 'Comprimi',
      tamanos: 'Dimensioni dell\'ICO',
      formato: 'Formato',
      calidad: 'Qualità',
      ladoMax: 'Lato massimo in px (vuoto = originale)',
      procesar: 'Elabora',
      procesando: 'Elaborazione…',
      guardar: 'Salva con nome…',
      antes: 'Prima',
      despues: 'Dopo',
      sinMejora: 'Il risultato non pesa meno dell\'originale: provi con un\'altra qualità o formato.',
      errorAbrir: 'Impossibile aprire l\'immagine su questo computer.',
      errorProcesar: 'Impossibile elaborare l\'immagine.',
      sufijoConvertida: '-convertita',
      sufijoComprimida: '-compressa',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % in meno`
          : porcentaje < 0
            ? `${-porcentaje} % in più`
            : 'nessuna variazione',
      guardado: (archivo: string) => `Salvato in ${archivo}`,
    },
    comprimir: {
      zip: 'Comprimi in ZIP',
      zipAyuda:
        'Selezioni file o cartelle. Non vengono seguiti collegamenti e lo ZIP è un file nuovo: non sovrascrive mai un file esistente.',
      agregarArchivos: 'Aggiungi file',
      agregarCarpeta: 'Aggiungi cartella',
      quitar: 'Rimuovi',
      vacio: 'Nessun elemento selezionato.',
      crearZip: 'Crea ZIP…',
      creando: 'Creazione in corso…',
      pdf: 'Ottimizza PDF',
      pdfAyuda:
        'Viene salvato nuovamente con flussi di oggetti, in un thread separato. Il file viene creato solo se pesa meno; non vengono aperti PDF protetti da password. L\'originale non viene toccato. Attenzione: risalvando si perdono le firme digitali e la conformità PDF/A.',
      elegirPdf: 'Seleziona PDF',
      optimizar: 'Ottimizza…',
      optimizando: 'Ottimizzazione…',
      antes: 'Prima',
      despues: 'Dopo',
      sinMejora: 'Il PDF non peserebbe meno dopo l\'ottimizzazione: non è stato creato alcun file.',
      sufijoOptimizado: '-ottimizzato',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'collegamento, cartella illeggibile o file speciale non è stato incluso' : 'collegamenti, cartelle illeggibili o file speciali non sono stati inclusi'}.`,
      archivos: (n: number) => `${n} file`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % in meno`
          : porcentaje < 0
            ? `${-porcentaje} % in più`
            : 'nessuna variazione',
      guardado: (archivo: string) => `Salvato in ${archivo}`,
    },
    conversor: {
      ayuda:
        'Viene convertito su questo computer: il documento non viene caricato da nessuna parte. L\'originale non viene modificato; il risultato è un nuovo file e non sovrascrive mai uno esistente.',
      elegir: 'Seleziona documento',
      tipoNoSoportado:
        'Non ci sono conversioni per questo tipo di file. Sono supportati docx, xlsx, csv, md, html e pdf (e odt, pptx e doc con LibreOffice).',
      convertirA: 'Converti in',
      convertir: 'Converti…',
      convirtiendo: 'Conversione…',
      avisoLibreOffice:
        'Questa conversione utilizza LibreOffice, già installato su questo computer. WolfCore Dev non lo installa né lo scarica: lo avvia senza finestra e con un profilo temporaneo.',
      sinLibreOffice:
        'Se installa LibreOffice potrà convertire anche odt, pptx e doc (WolfCore Dev non lo installa).',
      limites:
        'Per sicurezza esistono dei limiti: fino a 50 MB (10 MB per md e html), 120 s, 200 000 righe, 1000 colonne e 5 milioni di celle; i file che sembrano una ZIP bomb o contengono entità XML vengono rifiutati.',
      guardado: (archivo: string) => `Salvato in ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Sicurezza',
      pestanaAuditar: 'Verifica un database',
      fortaleza: {
        etiqueta: 'Password da valutare',
        marcador: 'Inserisca una password',
        privacidad: 'Viene valutata qui: nulla lascia il Suo computer né viene salvato.',
        mostrar: 'Mostra',
        ocultar: 'Nascondi',
        niveles: ['Molto debole', 'Debole', 'Discreta', 'Forte', 'Molto forte'],
        sinAvisos: 'Nessuna osservazione.',
        estimacion: 'È una stima, non una garanzia.',
        avisos: {
          straightRow: 'Una fila di tasti consecutivi è facile da indovinare.',
          keyPattern: 'Le sequenze brevi sulla tastiera sono facili da indovinare.',
          simpleRepeat: 'Ripetere un carattere o un gruppo la rafforza appena.',
          extendedRepeat: 'I gruppi ripetuti sono facili da indovinare.',
          sequences: 'Le sequenze come abc o 6543 sono facili da indovinare.',
          recentYears: 'Eviti anni recenti e date legate a Lei.',
          dates: 'Eviti le date: sono facili da indovinare.',
          topTen: 'È tra le dieci password più usate.',
          topHundred: 'È tra le cento password più usate.',
          common: 'È una password molto comune.',
          similarToCommon: 'Assomiglia a una password molto comune.',
          wordByItself: 'Una parola singola è facile da indovinare.',
          namesByThemselves: 'Un nome o cognome singolo è facile da indovinare.',
          commonNames: 'I nomi e cognomi comuni sono facili da indovinare.',
          userInputs: 'Non usi dati che altri conoscono di Lei.',
          l33t: 'Sostituire lettere con simboli prevedibili (@ per a) aiuta poco.',
          reverseWords: 'Scrivere le parole al contrario aiuta poco.',
          allUppercase: 'Scrivere tutto in maiuscolo aiuta poco.',
          capitalization: 'Mettere solo la prima lettera in maiuscolo aiuta poco.',
          associatedYears: 'Eviti anni associati a Lei.',
          repeated: 'Eviti parole e caratteri ripetuti.',
          longerKeyboardPattern: 'Usi una sequenza di tastiera più lunga e cambi direzione.',
          anotherWord: 'Aggiunga una o due parole in più; quelle poco comuni aiutano.',
          useWords: 'Più parole casuali formano una buona password.',
          noNeed: 'Si può essere sicuri senza simboli né numeri: ciò che conta è la lunghezza.',
        },
      },
      auditar: {
        limite:
          'Questo rileva solo password molto comuni: confronta ogni hash con un breve elenco di circa 200. Non è un attacco né un test di forza bruta. Se un account non viene segnalato non significa che la sua password sia sicura.',
        privacidad:
          'Non viene mai mostrato quale password ha corrisposto, e la lettura avviene con un utente temporaneo di sola lettura (in PostgreSQL, con la sessione in sola lettura). La usi solo sui propri database.',
        motor: 'Motore',
        base: 'Database',
        tabla: 'Tabella',
        columnaUsuario: 'Colonna utente',
        columnaHash: 'Colonna hash',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Avvii il server da Database per verificare i suoi database.',
        sinBases: 'Non ci sono database su questo server.',
        sinMotores: 'Non è presente un server MySQL, MariaDB o PostgreSQL locale.',
        revisar: 'Verifica',
        revisando: 'Verifica in corso…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'account verificato' : 'account verificati'} · ${d} ${d === 1 ? 'debole' : 'deboli'}`,
        sinDebiles: 'Nessun account verificato corrisponde a una password molto comune.',
        noRevisables: (n: number) =>
          `Impossibile verificare ${n} account:`,
        truncado:
          'La verifica è stata interrotta per il limite di 10 000 righe o di 60 secondi: alcuni account non sono stati verificati.',
        usuario: 'Utente',
        motivo: 'Motivo',
        accion: 'Azione',
        motivos: {
          comun: 'Password molto comune',
          formato_debil: 'Formato debole (md5 o sha1 senza salt)',
        },
        restablecer: 'Reimposta',
        mas: (n: number) => `e altri ${n} (si mostrano i primi 200)`,
        esquema: 'Schema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Annulla',
        cancelando: 'Annullamento…',
        cancelada: 'Verifica annullata.',
        progreso: (a: number, b: number) => `Verificati ${a} di ${b}`,
        tiposNoRevisables: {
          vacio: 'hash vuoto',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (non disponibile su questo computer o con parametri fuori limite)',
          bcrypt_otro: 'bcrypt con costo fuori intervallo o variante $2x$',
          pbkdf2_otro: 'PBKDF2 con parametri fuori limite',
          ldap: 'formato LDAP ({SHA}…)',
          otro: 'formato sconosciuto',
        },
        rlsActiva:
          'La tabella dispone di sicurezza a livello di riga (RLS): la verifica vede solo le righe consentite dalla policy al ruolo limitato, quindi potrebbe mancare qualche account.',
        falsoPositivo:
          'Un valore di 32 o 40 caratteri esadecimali viene considerato md5 o sha1, ma potrebbe essere qualcos\'altro (un token, ad esempio). Se la colonna non memorizza password, il risultato non è valido.',
      },
      restablecer: {
        titulo: (u: string) => `Reimpostare la password di ${u}`,
        ayuda:
          'Non è possibile recuperare una password: se ne imposta una nuova. Prima viene creata un\'istantanea del database e salvata una copia della riga.',
        cargando: 'Preparazione dell\'anteprima…',
        sentencia: 'Verrà eseguita (i valori sono separati e non vengono mostrati)',
        formatoActual: (f: string) => `Formato attuale: ${f}`,
        cambiaFormato:
          'L\'account passerà a bcrypt: l\'applicazione deve essere in grado di verificarlo (ad esempio con password_verify); altrimenti nessuno potrà accedere con quell\'account.',
        nueva: 'Nuova password',
        generar: 'Genera password',
        mostrar: 'Mostra',
        ocultar: 'Nascondi',
        anotar: 'La annoti ora: non verrà più mostrata né salvata.',
        escribaUsuario: (u: string) => `Per confermare, digiti l'utente: ${u}`,
        confirmar: 'Reimposta password',
        cancelar: 'Annulla',
        cerrar: 'Chiudi',
        hecho: 'Password reimpostata.',
        copiaFila: 'Copia della riga (identificativo e hash precedente, conservata per 30 giorni):',
        instantanea: 'Istantanea precedente del database:',
        instantaneaAyuda: 'È possibile ripristinarla da Database › Istantanee.',
        aBcrypt: 'Passa a bcrypt: solo se l\'applicazione usa password_verify o equivalente',
        avisoLegado:
          'Questo hash è md5 o sha1 senza salt e viene mantenuto in tale formato. Se l\'applicazione memorizza il salt separatamente (in un\'altra colonna o in una costante), l\'hash non può essere riprodotto e la nuova password non consentirebbe l\'accesso.',
        datosReales: {
          titulo: 'Database con dati reali',
          texto:
            'Questo database appartiene a un sito contrassegnato con dati reali di clienti: reimpostare una password modifica un account reale.',
          casilla: 'Comprendo che si tratta di dati reali e desidero reimpostare questa password',
        },
        rlsActiva:
          'La tabella dispone di sicurezza a livello di riga (RLS): se la policy nasconde questo account al ruolo limitato, non sarà possibile reimpostarlo.',
        copiaSinRestringir:
          'Impossibile limitare tale copia all\'utente di questo computer: verifichi i permessi della cartella.',
      },
    },
  },
  doctor: {
    descripcion:
      'Controlla porte, certificati, il file hosts, il PATH, Visual C++, l\'antivirus e i servizi, e propone come ripararli.',
    revisarAhora: 'Controlla ora',
    revisando: 'Controllo in corso…',
    sinRevision: 'Nessun controllo eseguito finora. Faccia clic su «Controlla ora».',
    sinHallazgos: 'Tutto in ordine: non sono stati trovati problemi.',
    gravedades: { error: 'Errori', aviso: 'Avvisi', info: 'Informazioni' },
    evidencia: 'Cosa è stato rilevato',
    requiereAdmin: 'Richiede permessi di amministratore',
    comandoManual: 'Comando per una console di amministratore (non viene eseguito automaticamente):',
    copiar: 'Copia comando',
    copiado: 'Comando copiato.',
    reparar: 'Ripara',
    alternativa: 'Sposta la porta di WolfCore Dev',
    soloInforma: 'WolfCore Dev non modifica questo elemento automaticamente: segua le indicazioni.',
    dialogo: {
      titulo: 'Conferma la riparazione',
      queHara: 'Ecco cosa verrà eseguito:',
      admin: 'Windows Le chiederà i permessi di amministratore.',
      puerto: (p: string | number) => `La nuova porta sarà ${p}.`,
      aplicar: 'Applica',
      cancelar: 'Annulla',
    },
    estados: {
      aplicando: 'Applicazione…',
      hecha: 'Riparazione applicata.',
      fallida: 'Impossibile riparare.',
    },
    revisiones: {
      puertos: 'Porte',
      'rangos-reservados': 'Intervalli riservati',
      ca: 'Autorità di certificazione',
      certificados: 'Certificati',
      confianza: 'Attendibilità della CA',
      hosts: 'File hosts',
      path: 'PATH utente',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Linker C++',
      antivirus: 'Antivirus',
      firewall: 'Firewall',
      servicios: 'Servizi',
    },
    reparaciones: {
      cambiar_puerto: 'Cambiare la porta di WolfCore Dev con una libera. L\'altro programma non viene toccato.',
      puerto_manual:
        'Spostare la porta di WolfCore Dev fuori dall\'intervallo riservato. Liberare l\'intervallo è una Sua decisione tramite il comando mostrato.',
      detener_iis:
        'Arrestare il servizio IIS (W3SVC) per liberare la porta. Non viene disabilitato: riparte al riavvio di Windows.',
      regenerar_ca:
        'Creare una nuova autorità di certificazione, renderla attendibile in Windows (Le verrà chiesta conferma), riemettere i certificati e rimuovere la precedente. Prima viene salvata una copia.',
      regenerar_certificados: 'Riemettere i certificati dei siti e ricaricare Nginx.',
      hosts_reescribir:
        'Riscrivere il blocco di WolfCore Dev nel file hosts in UTF-8, con una copia preventiva. Le righe esterne non vengono toccate.',
      hosts_solo_lectura: 'Rimuovere l\'attributo di sola lettura dal file hosts.',
      path_duplicados:
        'Rimuovere le voci duplicate di WolfCore Dev dal PATH utente, salvando una copia del valore precedente. Le voci esterne non vengono toccate.',
      path_ajeno:
        'Un altro strumento si trova prima nel PATH. WolfCore Dev non lo rimuove: lo sposti se necessario.',
      instalar_vcredist:
        'Installare Visual C++ 2015+ x64 con winget. Il programma di installazione di Microsoft richiede la propria autorizzazione.',
      instalar_build_tools:
        'Installi i Build Tools di Visual Studio (con gli strumenti C++) tramite il comando mostrato: occupano diversi GB e richiedono permessi di amministratore, quindi la scelta spetta a Lei.',
      antivirus:
        'Aggiungere la cartella dei dati alle esclusioni dell\'antivirus è una Sua decisione, tramite il comando mostrato.',
      firewall:
        'Rimuovere tali regole è una Sua decisione, tramite il comando mostrato, in una console di amministratore. WolfCore Dev non modifica mai il firewall.',
      reintentar_servicio: 'Riavviare il servizio.',
      firefox_confianza:
        'Aggiunge al file user.js di ogni profilo Firefox la preferenza per fidarsi dell’autorità di Windows, con una copia preventiva. prefs.js non viene toccato e i profili aperti vengono saltati.',
    },
    confianza: {
      titulo: 'Attendibilità della CA',
      texto:
        'Windows si fida già dell’autorità di WolfCore Dev; Node, Python e Firefox usano ciascuno il proprio archivio.',
      sinCa: 'Non esiste ancora alcuna autorità di certificazione. La crei da HTTPS per usare questa sezione.',
      node: {
        titulo: 'Node',
        proyectos:
          'I processi di progetto e il Terminale ricevono NODE_EXTRA_CA_CERTS con l’autorità.',
        ajena: 'Ha già una propria NODE_EXTRA_CA_CERTS: WolfCore Dev non la sostituisce.',
        global: 'Anche come variabile utente (per altri terminali e programmi)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS verrà impostata come variabile utente. Vale per i programmi aperti in seguito; viene rimossa disattivando questa opzione.',
        confirmarDesactivar: 'La variabile NODE_EXTRA_CA_CERTS impostata da WolfCore Dev verrà rimossa.',
      },
      python: {
        titulo: 'Python',
        texto:
          'I progetti con .venv ricevono REQUESTS_CA_BUNDLE e SSL_CERT_FILE con le radici di certifi (o di Windows) più l’autorità. Mai solo l’autorità.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Nessun profilo Firefox trovato.',
        activo: 'Attendibile',
        inactivo: 'Non attendibile',
        abierto: 'Aperto',
        fuera: 'Fuori dalla cartella di Firefox',
        avisoFuera: (lista: string) =>
          `Questi profili sono fuori dalla cartella di Firefox e non vengono modificati se non li seleziona: ${lista}.`,
        incluirFuera: 'Modifica anche i profili fuori dalla cartella di Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profilo fuori dalla cartella di Firefox non è stato toccato', 'profili fuori dalla cartella di Firefox non sono stati toccati')}.`,
        activar: 'Attiva in Firefox',
        quitar: 'Rimuovi da Firefox',
        confirmarActivar:
          'Verrà aggiunto security.enterprise_roots.enabled nel file user.js di ogni profilo, tra i marcatori di WolfCore Dev e con una copia preventiva in etc/respaldos. prefs.js non viene toccato. I profili con Firefox aperto vengono saltati: lo chiuda prima.',
        confirmarQuitar:
          'Verrà rimosso il blocco di WolfCore Dev dal file user.js di ogni profilo (con copia preventiva). Le altre preferenze restano invariate.',
        resultadoOk: (n: number) => `Fatto in ${plural(n, 'profilo', 'profili')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profilo è stato saltato', 'profili sono stati saltati')} perché Firefox è aperto. Lo chiuda e riprovi.`,
        resultadoError: (n: number) =>
          `Impossibile modificare ${plural(n, 'profilo', 'profili')}.`,
      },
      confirmar: 'Conferma',
      cancelar: 'Annulla',
    },
  },
  php: {
    descripcion:
      'php.ini ed estensioni di ogni versione di PHP installata. Prima di salvare viene mostrato il diff, testato con php -v e salvato un backup datato; se PHP non riparte, viene ripristinato il precedente.',
    rama: 'Versione di PHP',
    sinPhp: 'Nessun PHP installato. Lo installi da Servizi.',
    irServicios: 'Vai a Servizi',
    pestanas: { ini: 'php.ini', extensiones: 'Estensioni' },
    rapidosTitulo: 'Valori rapidi',
    rapidosAyuda: 'Si applicano al testo sotto; nulla viene salvato finché non conferma il diff.',
    aplicarRapidos: 'Applica al testo',
    sinValor: 'non definito',
    rapidos: {
      memory_limit: 'Memoria per script (memory_limit)',
      upload_max_filesize: 'Dimensione massima upload (upload_max_filesize)',
      post_max_size: 'Dimensione massima POST (post_max_size)',
      max_execution_time: 'Tempo massimo in secondi (max_execution_time)',
      display_errors: 'Mostra errori (display_errors)',
      error_reporting: 'Livello errori (error_reporting)',
      'date.timezone': 'Fuso orario (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Le righe che iniziano con ; sono commenti.',
    sinCambios: 'Nessuna modifica rispetto a quanto salvato.',
    descartar: 'Scarta modifiche',
    revisar: 'Rivedi e salva',
    diffTitulo: (rama: string) => `Modifiche al php.ini di PHP ${rama}`,
    diffAyuda:
      'Verrà salvato un backup datato, testato con php -v e, se PHP è acceso, verrà riavviato.',
    guardar: 'Salva e applica',
    cancelar: 'Annulla',
    guardado: (respaldo: string) => `php.ini salvato. Backup precedente: ${respaldo}`,
    respaldosTitulo: 'Backup datati',
    sinRespaldos: 'Nessun backup ancora.',
    restaurar: 'Ripristina',
    confirmarRestaurar: (nombre: string) =>
      `Ripristinare ${nombre}? Il php.ini attuale viene prima salvato come altro backup.`,
    restaurado: 'Backup ripristinato.',
    recargar: 'Rileggi',
    extensiones: {
      ayuda:
        'Si attivano solo le estensioni incluse in questa build in ext/. Quelle di terze parti si installano dal catalogo (variante compatibile e impronta SHA-256 verificata).',
      activa: 'Attiva',
      inactiva: 'Inattiva',
      falta: 'File mancante',
      catalogo: 'Catalogo',
      instalar: 'Installa',
      instalada: (nombre: string) => `${nombre} installata e attivata.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} attivata.` : `${nombre} disattivata.`,
      buscar: 'Cerca estensione',
      vacio: 'Nessuna estensione corrispondente.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI e Antigravity CLI: li rilevi o li installi e li apra in un progetto. Quelli supportati si collegano al server MCP di WolfCore Dev. Nessuno si avvia da solo.',
    recargar: 'Rileva di nuovo',
    notaMcp:
      'Il server MCP registrato si autentica solo quando l’agente viene aperto da WolfCore Dev ("Apri in un progetto"): il token passa tramite la variabile WOLFCORE_MCP_TOKEN di quel terminale e non viene mai scritto nella configurazione dell’agente. Aperto dall’esterno, l’agente vede la voce «wolfcore» ma non può connettersi.',
    sitioElegido: (nombre: string) => `Scelga un agente da aprire in ${nombre}.`,
    instalado: 'Installato',
    noInstalado: 'Non installato',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Versione sconosciuta',
    verVersion: 'Vedi versione',
    verVersionAyuda: 'Esegue il programma con --version (non viene eseguito automaticamente all’apertura).',
    origen: {
      propio: 'Installato da WolfCore Dev',
      'npm-usuario': 'npm globale dell’utente',
      ejecutable: 'Programma di sistema',
    },
    mcpRegistrado: 'MCP registrato',
    mcpSinRegistrar: 'MCP non registrato',
    tokenEscrito:
      'Il file dell’agente conteneva il token MCP scritto in chiaro: ora è stato rimosso e il backup precedente lo maschera (***). Valuti di rigenerare il token del server MCP.',
    mcpNoSoportado:
      'La sua documentazione non consente di leggere il token da una variabile d’ambiente: WolfCore Dev non registra l’MCP (il token non viene mai scritto su file).',
    instalar: 'Installa',
    instalando: 'Installazione…',
    guia: 'Guida di installazione',
    soloGuia:
      'WolfCore Dev non lo installa (il suo installer non ha un’impronta fissa): segua la guida ufficiale.',
    registrar: 'Registra MCP',
    quitar: 'Rimuovi MCP',
    abrir: 'Apri in un progetto',
    confirmarInstalar: {
      titulo: (nombre: string) => `Installare ${nombre}?`,
      texto: (paquete: string) =>
        `Installa l’ultima versione pubblicata di ${paquete} da registry.npmjs.org, usando il Node di WolfCore Dev nella sua cartella dati.`,
      aislado: 'Non usa la configurazione npm dell’utente né tocca npm globale. Può richiedere alcuni minuti.',
      aceptar: 'Installa',
      hecho: (nombre: string) => `${nombre} installato.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Registrare MCP in ${nombre}?`,
      texto:
        'Aggiunge (o aggiorna) solo la voce «wolfcore» in questo file; il resto rimane invariato:',
      aceptar: 'Registra',
      hecho: (nombre: string) => `MCP registrato in ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Rimuovere MCP da ${nombre}?`,
      texto: 'Rimuove solo la voce «wolfcore» da questo file; il resto rimane invariato:',
      aceptar: 'Rimuovi',
      hecho: (nombre: string) => `MCP rimosso da ${nombre}.`,
    },
    copiaPrevia:
      'Prima della modifica viene salvata una copia datata accanto al file (<archivo>.wolfcore-AAAAMMDD-HHmmss.bak); vengono conservate le 5 più recenti. Se l’agente è aperto, lo chiuda prima.',
    copiaHecha: (ruta: string) => `Copia precedente: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Apri ${nombre}`,
      proyecto: 'Progetto',
      sinProyectos: 'Nessun progetto ancora.',
      proveedor: 'Provider IA',
      proveedorPropio: 'Quello configurato nell’agente',
      proveedorAyuda:
        'Con un provider, la chiave resta solo nell’ambiente di quel terminale: non viene scritta su file né nella riga di comando.',
      aceptar: 'Apri terminale',
      hecho: (nombre: string) => `${nombre} aperto in un nuovo terminale.`,
    },
    costo: {
      titulo: 'Prima di aprire un agente',
      texto:
        'Un agente IA usa il suo account presso il provider: ogni richiesta consuma token e può comportare costi. Può inoltre leggere e modificare i file del progetto ed eseguire comandi.',
      nunca:
        'WolfCore Dev non apre mai un agente autonomamente: lo avvia sempre su sua richiesta. Questo avviso compare una sola volta.',
      aceptar: 'Ho capito, apri',
    },
  },
  depuracion: {
    descripcion:
      'Visualizzi qui i dump(), dd() e wd() dei suoi siti PHP e i wolfdump dei processi Python, con file e riga. La pagina continua a rispondere normalmente.',
    receptor: 'Cattura dump',
    escuchando: (direccion: string, puerto: number) => `In ascolto su ${direccion}:${puerto}`,
    apagado: 'Spenta',
    memoria:
      'I dump restano solo in memoria (gli ultimi 500) e si perdono alla chiusura. Possono contenere dati sensibili: alla copia le chiavi note vengono mascherate.',
    sitios: 'Siti',
    sinSitios: 'Nessun sito PHP o FastAPI.',
    sinPhp: 'Scelga prima una versione di PHP nel sito.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Riavvii i processi del sito affinché carichino wolfdump.',
    confirmarTitulo: (sitio: string) => `Attivare la cattura in ${sitio}`,
    confirmarPhp:
      'Il PHP di questo sito caricherà prima di ogni richiesta un file di WolfCore Dev (auto_prepend_file, solo su questo sito) che definisce dump(), dd() e wd() se non definiti dal progetto. Se il codice dichiara dump() o dd() senza verificare function_exists, PHP mostrerà un errore: in tal caso disattivi la cattura. Il sito passerà a usare il proprio PHP.',
    usoPhp:
      'Laravel e Symfony: dump($x) e dd($x) come sempre. CodeIgniter 3 e altri: wd($x) invia senza stampare nulla nella pagina.',
    confirmarPython:
      'I processi di questo sito avranno il modulo wolfdump nel proprio PYTHONPATH (non viene scritto nulla nel progetto). Vale dal prossimo avvio dei processi.',
    usoPython: 'from wolfdump import dump  →  dump(valore)',
    activar: 'Attiva cattura',
    cancelar: 'Annulla',
    filtroSitio: 'Tutti i siti',
    filtroOrigen: 'Ogni origine',
    buscar: 'Cerca nel testo, file o URL',
    limpiar: 'Pulisci',
    confirmarLimpiar: 'Eliminare tutti i dump dalla memoria?',
    vacio: 'Nessun dump ricevuto ancora.',
    vacioApagado: 'Attivi la cattura e avvii un sito per iniziare.',
    elegir: 'Scelga un dump dall’elenco.',
    copiar: 'Copia',
    copiado: 'Copiato (con chiavi mascherate)',
    sinSitio: 'nessun sito',
    total: (n: number) => `${n} in memoria`,
    archivo: 'File',
    url: 'URL',
    pestanaVolcados: 'Dump',
    pestanaErrores: 'Errori',
    erroresDescripcion:
      'Errori dai registri di PHP, Nginx, laravel.log, CodeIgniter 3 e Python, raggruppati: lo stesso errore ripetuto appare una volta con il suo contatore.',
    erroresVacio: 'Nessun errore nei registri. Appaiono qui appena vengono scritti.',
    erroresElegir: 'Scelga un errore dall’elenco.',
    actualizar: 'Aggiorna',
    abrirEditor: 'Apri nell’editor',
    abrirEditorSinSitio: 'Si aprono solo file presenti nella cartella di un sito.',
    veces: (n: number) => (n === 1 ? '1 volta' : `${n} volte`),
    primera: 'Prima volta',
    ultima: 'Ultima volta',
    fuente: 'Registro',
    traza: 'Stack trace (ultima volta)',
    sinTraza: 'Nessuna traccia.',
  },
  contenedores: {
    descripcion:
      'Visualizzi e controlli i container di Docker o Podman su questo computer. WolfCore Dev non crea, elimina né scarica container, immagini o volumi.',
    motor: 'Motore',
    refrescar: 'Aggiorna',
    detectando: 'Ricerca di Docker e Podman…',
    sinMotorTitulo: 'Né Docker né Podman trovati',
    sinMotor:
      'Docker e Podman non sono stati trovati su questo computer. WolfCore Dev non li installa: se le servono, ne installi uno dal sito ufficiale e prema Aggiorna.',
    instalarDocker: 'Installa Docker',
    instalarPodman: 'Installa Podman',
    apagadoTitulo: (m: string) => `${m} non risponde`,
    apagado: (m: string) =>
      `${m} è installato, ma il motore non risponde. Apra Docker Desktop (o avvii la macchina Podman con «podman machine start») e prema Aggiorna.`,
    remoto:
      'È stata ignorata una connessione remota (DOCKER_HOST, CONTAINER_HOST, un contesto o una connessione predefinita): WolfCore Dev usa solo il motore locale.',
    desdePath: 'Trovato nel PATH, non nella cartella di installazione abituale.',
    version: (v: string) => `Versione ${v}`,
    vacio: 'Nessun container.',
    columnas: {
      nombre: 'Nome',
      imagen: 'Immagine',
      estado: 'Stato',
      puertos: 'Porte',
      compose: 'Compose',
      acciones: 'Azioni',
    },
    estados: {
      corriendo: 'In esecuzione',
      detenido: 'Fermo',
      pausado: 'In pausa',
      otro: 'Altro',
    },
    codigoSalida: (n: number) => `codice ${n}`,
    iniciar: 'Avvia',
    detener: 'Ferma',
    reiniciar: 'Riavvia',
    registros: 'Registri',
    confirmarDetenerTitulo: 'Fermare il container?',
    confirmarDetener: (n: string) =>
      `Verrà fermato «${n}». I processi interni si interrompono (il motore attende alcuni secondi). Non viene eliminato nulla.`,
    confirmarReiniciarTitulo: 'Riavviare il container?',
    confirmarReiniciar: (n: string) =>
      `Verrà riavviato «${n}». I processi interni si interrompono e ripartono. Non viene eliminato nulla.`,
    confirmar: 'Conferma',
    cancelar: 'Annulla',
    hecho: {
      iniciar: (n: string) => `«${n}» avviato.`,
      detener: (n: string) => `«${n}» fermato.`,
      reiniciar: (n: string) => `«${n}» riavviato.`,
    },
    registroTitulo: (n: string) => `Registri di «${n}»`,
    registroEsperando: 'In attesa di righe…',
    registroFin: 'Il registro è terminato (container fermo o connessione chiusa dal motore).',
    cerrar: 'Chiudi',
  },
  versiones: {
    pestana: 'Versioni',
    pestanaServicios: 'Servizi',
    elegirServicio: 'Servizio',
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
        'Ogni versione principale (8.4, 17…) ha la propria istanza con cartella dati e porta dedicate: può avviarne più di una contemporaneamente. La stella indica quella usata dai nuovi progetti.',
      pool: 'Ogni versione di PHP accesa ha il proprio PHP; la stella indica quella dei nuovi progetti.',
      unica:
        'Può installare più versioni, ma solo una resta accesa: accenderne un’altra cambia quella attiva.',
      ninguno:
        'Nulla da avviare: i progetti usano la versione richiesta o quella predefinita (stella).',
    },
    filtroRama: 'Versione',
    todasRamas: 'Tutte le versioni',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Mostra tutte',
    origen: {
      vivo: 'Online',
      cache: (h: number) => (h < 1 ? 'Cache di meno di 1 h fa' : `Cache di ${h} h fa`),
      fija: 'Elenco offline',
    },
    actualizarLista: 'Aggiorna elenco',
    errorCarga: 'Impossibile leggere l’elenco delle versioni',
    vacio: 'Nessuna versione da mostrare.',
    soporte: { lts: 'LTS', actual: 'Attuale', fin: 'Fine supporto', preview: 'Preview' },
    finSoporte: (f: string) => `Supporto fino al ${f}`,
    finSoportePasado: (f: string) => `Senza supporto dal ${f}`,
    marcas: {
      instalada: 'Installata',
      encendida: 'Accesa',
      actualizacion: (v: string) => `Aggiornamento: ${v}`,
      bloqueada: 'Bloccata',
      sinHuella: 'Senza impronta pubblicata',
      huellaDebil: 'Solo impronta MD5',
      firmada: 'Con firma PGP',
    },
    ayudaFirmada:
      'La fonte ufficiale firma questo download con PGP: WolfCore Dev verifica la firma con le chiavi fissate nell’app prima di installare.',
    ayudaSinHuella:
      'La fonte ufficiale non pubblica un’impronta sicura (SHA-256 o SHA-512): il download non può essere verificato.',
    instalar: 'Installa',
    desinstalar: 'Disinstalla',
    encender: 'Avvia',
    apagar: 'Ferma',
    actualizar: 'Aggiorna',
    usarEsta: 'Usa questa versione',
    usarEstaAyuda: (id: string) =>
      `${id} usa un’altra versione di questo servizio: il cambio avviene con backup preventivo dei dati.`,
    predeterminada: 'Predefinita per i nuovi progetti',
    hacerPredeterminada: 'Usa per i nuovi progetti',
    predeterminadaHecha: (v: string) => `${v} impostata come predefinita.`,
    puerto: 'Porta',
    puertoDe: (id: string) => `Porta di ${id}`,
    cambiarPuerto: 'Cambia',
    puertoCambiado: (p: number) => `Porta cambiata in ${p}.`,
    puertoProyectosTitulo: 'Progetti con la porta precedente',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Questi progetti usano ancora la porta ${viejo} nel proprio .env (non modificato): ${lista}. La cambi in ${nuevo}.`,
    resolver: 'Risolvi',
    instalada: (v: string) => `${v} installato.`,
    selector: { etiqueta: 'Istanza', predeterminada: 'predefinita', apagada: 'spenta' },
    dialogoSinHuella: {
      titulo: (v: string) => `Installare ${v} senza impronta`,
      riesgo:
        'Questa versione non ha un’impronta pubblicata dalla fonte ufficiale: WolfCore Dev non può verificare che il file scaricato sia autentico.',
      explicacion:
        'Il download avviene comunque via HTTPS dal sito ufficiale, ma se quel sito o la connessione fossero compromessi non verrebbe rilevato. La installi solo se necessaria.',
      alternativa: (v: string) => `Esiste una versione verificata dello stesso servizio: ${v}.`,
      casilla: 'Comprendo il rischio e desidero installarla senza verifica',
      instalarVerificada: (v: string) => `Installa ${v} (verificata)`,
      instalarIgual: 'Installa senza verifica',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Aggiorna ${n}`,
      tituloRama: (v: string) => `Nuova versione: ${v}`,
      ninguna: 'nessuna',
      instancia: (id: string) => `Si aggiorna l’istanza ${id}. Prima di cambiare qualsiasi cosa:`,
      pasoInstalar: (v: string) => `viene installata ${v} accanto alla versione attuale (che non viene rimossa);`,
      pasoVolcados: 'viene eseguito il dump di ogni database con la versione attuale;',
      pasoCopia: 'viene fermata e copiata l’intera cartella dati (copia a freddo);',
      pasoArrancar: 'viene avviata la nuova versione e verificata la risposta;',
      pasoVuelta:
        'se non si avvia, torna alla versione precedente con i suoi dati e la copia rimane salvata.',
      datos: 'Dati:',
      respaldo: 'Backup in:',
      espacio: 'Spazio:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} liberi; necessari ${necesarios}`,
      datosQuedan:
        'I dati precedenti non vengono mai cancellati: copia e dump restano in Backup degli aggiornamenti finché non li elimina.',
      sinEspacio: 'Spazio insufficiente per il backup: liberi spazio e riprovi.',
      alLado: (v: string) =>
        `Viene installata ${v}. Le altre versioni installate non vengono toccate; i progetti che fissano un’altra versione continuano a usarla.`,
      ramaExplicacion:
        'Una nuova versione principale non sostituisce la precedente: crea una nuova istanza con propria cartella dati e porta. L’istanza attuale resta invariata.',
      copiarDesdeTitulo: 'Dati della nuova istanza',
      copiarDesde: (id: string) =>
        `Copia dati da ${id} (dump e ripristino; l’originale non viene toccato)`,
      vacia: 'Inizia vuota',
      ramaNota:
        'Gli utenti del database non vengono copiati; i progetti dovranno puntare alla porta della nuova istanza.',
      crearInstancia: 'Crea nuova istanza',
      confirmar: 'Aggiorna con backup',
      hecho: (v: string) => `${v} aggiornato.`,
      fallo: 'Impossibile aggiornare',
      ramaCreada: (id: string) => `Istanza ${id} creata.`,
      copiadas: (l: string) => `Copiate: ${l}.`,
      noCopiada: (b: string, m: string) => `Non copiata ${b}: ${m}`,
    },
    limpieza: {
      boton: 'Pulisci versioni inutilizzate…',
      titulo: 'Pulisci versioni inutilizzate',
      intro:
        'Rimuove solo i programmi di versioni non usate da nulla (la cartella bin). Non vengono mai toccati i dati dei database, le istanze né i progetti.',
      cargando: 'Ricerca versioni…',
      vacia: 'Nessuna versione installata.',
      sinLibres: 'Tutte le versioni installate sono in uso: nulla da pulire.',
      fallo: 'Impossibile pulire',
      fallaLista: 'Impossibile leggere l’elenco delle versioni',
      bloqueada: 'Non selezionabile',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'versione' : 'versioni'} · ${tam}`,
      destinoTitulo: 'Cosa farne',
      papelera: 'Sposta nel cestino: conservate per 7 giorni (occupano spazio fino ad allora)',
      definitivo: 'Elimina definitivamente: libera subito spazio, operazione irreversibile',
      avisoDefinitivo:
        'Eliminazione definitiva: per riavere queste versioni bisognerà scaricarle di nuovo.',
      instantanea:
        'Se sceglie l’eliminazione definitiva, prima viene salvata una copia della configurazione dell’ambiente; dal cestino sono recuperabili.',
      entiendo: 'Comprendo che l’operazione non è reversibile',
      confirmar: (n: number) => `Rimuovi ${n} ${n === 1 ? 'versione' : 'versioni'}`,
      motivos: {
        predeterminada: 'È quella predefinita',
        encendida: 'È accesa o in esecuzione',
        sitio: 'Usata da un progetto',
        instancia: 'Usata da un’istanza (anche se spenta)',
        plantilla: 'Usata da un modello',
        workspace: 'Usata da un workspace',
        runtime: 'Usata da un progetto',
        tarea: 'Usata da un progetto con attività pianificate',
        duda: 'Impossibile verificare: non viene toccata',
        datos: 'Contiene dati leggibili solo da questa versione',
        herramienta: 'Usata da phpMyAdmin o Adminer',
      },
      resultadoTitulo: 'Risultato',
      liberadas: (tam: string) => `Liberati ${tam}.`,
      enPapelera: (tam: string) => `${tam} nel cestino (rimossi dopo 7 giorni).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'versione è già fuori da bin ma restano residui' : 'versioni sono già fuori da bin ma restano residui'} che verranno ripuliti al prossimo avvio.`,
      instantaneaGuardada: 'Copia dell’ambiente salvata prima dell’eliminazione.',
      ajeno: (lista: string) =>
        `Contiene elementi installati da Lei: ${lista}. Rimuovendola andranno persi.`,
      incluirAjeno: 'Rimuovi anche se quei pacchetti andranno persi',
      sinCatalogo: 'Non è più nel catalogo: rimuovendola non potrà riscaricarla.',
      papeleraTitulo: 'Nel cestino',
      recuperar: 'Ripristina',
      recuperada: (v: string) => `${v} ripristinata.`,
      borradaEl: (f: string) => `Eliminata il ${f}`,
      fallaRecuperar: 'Impossibile ripristinare',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Disinstalla ${v}`,
      binario: 'Vengono rimossi solo i programmi di questa versione.',
      instancia: (id: string) =>
        `Usata dall’istanza ${id}: viene fermata e rimossa dall’elenco delle istanze.`,
      datosQuedan:
        'I suoi dati restano su disco: reinstallando questa versione, l’istanza li riaprirà.',
      borrarDatos: 'Elimina anche i dati',
      borrarAviso: (id: string) =>
        `Verrà eliminata la cartella dati di ${id} con tutti i suoi database. Non è reversibile. Digiti "${id}" per confermare.`,
      escriba: (id: string) => `Digiti ${id} per confermare`,
      desinstalar: 'Disinstalla',
      desinstalarYBorrar: 'Disinstalla ed elimina dati',
      unica:
        'È la versione attiva: se è l’unica installata può rimuoverla a servizio spento; se ce ne sono altre, imposti prima un’altra come attiva (stella).',
      predeterminada: (id: string) =>
        `${id} è l’istanza predefinita: Database, blocco .env e strumenti passeranno a un’altra istanza (con un’altra porta).`,
      hecho: (v: string) => `${v} disinstallato.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Risolvi ${id}`,
      explicacion:
        'Un aggiornamento non è riuscito e non è stato possibile ripristinare i dati di questa istanza, quindi non viene avviata finché non sceglie come procedere. Nulla viene eliminato.',
      fallida: 'Dati modificati:',
      respaldo: 'Backup:',
      opciones: 'Come procedere',
      devolver: (sello: string, tam: string) =>
        `Ripristinare il backup ${sello} (${tam}); la cartella attuale viene messa da parte, non eliminata`,
      usarActual: 'Usare la cartella dati attuale così com’è',
      notaActual:
        'Solo se la cartella attuale contiene dati completi; in caso contrario, scelga un backup.',
      notaDevolver: 'Il backup viene copiato, verificato e solo allora rimesso al suo posto.',
      escriba: (id: string) => `Scriva ${id} per confermare`,
      elegirVersion:
        'Impossibile leggere il contrassegno di blocco: scelga con quale versione aprire i dati (quella precedente all’aggiornamento).',
      version: 'Versione',
      confirmar: 'Risolvi',
      hecho: (id: string) => `${id} sbloccata. Ora può avviarla.`,
    },
    respaldos: {
      titulo: 'Backup degli aggiornamenti',
      descripcion:
        'Copie lasciate dagli aggiornamenti e dalle nuove versioni. La cartella dati usata da ciascuna istanza non compare mai qui.',
      vacio: 'Non ci sono copie.',
      tipos: {
        respaldo: 'Copia a freddo',
        volcados: 'Dump dei database',
        fallida: 'Dati di una versione non riuscita',
        restaurando: 'Ripristino incompleto',
        copia: 'Dump per una nuova versione',
      },
      archivos: (n: number) => (n === 1 ? '1 file' : `${n} file`),
      borrar: 'Elimina',
      borrarDe: (n: string) => `Elimina ${n}`,
      confirmarTitulo: 'Elimina copia',
      confirmar: (n: string, tam: string) =>
        `Verrà eliminata ${n} (${tam}). L’operazione non può essere annullata. I dati usati dalle istanze non vengono toccati.`,
      borrado: 'Copia eliminata.',
    },
  },
  navGrupos: {
    trabajo: 'Lavoro',
    entorno: 'Ambiente',
    utilidades: 'Utilità',
  },
  avisos: {
    campana: 'Avvisi',
    campanaConNuevos: (n: number) => `Avvisi: ${n} non letti`,
    titulo: 'Centro avvisi',
    vacio:
      'Non ci sono avvisi. Qui appariranno le interruzioni dei servizi, le porte occupate e i certificati in scadenza.',
    marcarTodos: 'Segna tutto come letto',
    limpiar: 'Cancella cronologia',
    ver: 'Visualizza',
    actualizar: 'Aggiorna',
    verVersiones: 'Vedi versioni',
    cerrar: 'Chiudi',
    niveles: { info: 'Informazione', aviso: 'Avviso', error: 'Errore' },
    sinLeer: 'Non letto',
  },
  barra: {
    paleta: 'Cerca o esegui un comando',
    atajoPaleta: 'Ctrl+K',
    tema: 'Cambia tema',
    idioma: 'Cambia lingua',
  },
  preferencias: {
    titulo: 'Aspetto e lingua',
    descripcion: 'Le modifiche vengono applicate all’istante e salvate su questo computer.',
    tema: 'Tema',
    temas: { sistema: 'Sistema', claro: 'Chiaro', oscuro: 'Scuro' },
    idioma: 'Lingua',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体' },
    acento: 'Colore principale',
    acentos: {
      indigo: 'Indaco',
      azul: 'Blu',
      verde: 'Verde',
      violeta: 'Viola',
      naranja: 'Arancione',
      rosa: 'Rosa',
    },
    acentoPropio: (color: string) => `Personalizzato (${color})`,
    errorGuardar: 'Impossibile salvare la preferenza',
    asistente: 'Procedura guidata iniziale',
    asistenteAyuda:
      'Ripercorra i passaggi iniziali: cartella dei progetti, strumenti di base, CA, GitHub e cartella monitorata.',
    asistenteAbrir: 'Apri la procedura guidata',
  },
  paleta: {
    titulo: 'Tavolozza comandi',
    placeholder: 'Cerchi una schermata, un servizio, un progetto o uno strumento…',
    sinResultados: 'Nessun comando corrisponde alla ricerca.',
    ayuda: '↑ ↓ per spostarsi · Enter per eseguire · Esc per chiudere',
    grupos: {
      navegacion: 'Vai a',
      servicios: 'Servizi',
      proyectos: 'Progetti',
      herramientas: 'Strumenti',
      github: 'GitHub',
      general: 'Generale',
    },
    irA: (pantalla: string) => `Vai a ${pantalla}`,
    encender: (servicio: string) => `Avvia ${servicio}`,
    apagar: (servicio: string) => `Arresta ${servicio}`,
    iniciarTodo: 'Avvia tutti i servizi',
    detenerTodo: 'Arresta tutti i servizi',
    iniciarWorkspace: (n: string) => `Avvia il workspace ${n}`,
    detenerWorkspace: (n: string) => `Arresta il workspace ${n}`,
    abrirSitio: (nombre: string) => `Apri ${nombre} nel browser`,
    traerCambios: (nombre: string) => `Scarica modifiche in ${nombre}`,
    abrirHerramienta: (nombre: string) => `Apri ${nombre}`,
    clonar: 'Clona un repository da GitHub',
    agregarProyecto: 'Aggiungi un progetto',
    nuevoProyecto: 'Crea un nuovo progetto',
    tema: (tema: string) => `Tema: ${tema}`,
    idioma: (idioma: string) => `Lingua: ${idioma}`,
    asistente: 'Apri la procedura guidata iniziale',
  },
  nuevoProyecto: {
    titulo: 'Nuovo progetto',
    boton: 'Nuovo progetto',
    descripcion:
      'Crei un progetto da zero: la cartella, il sito con HTTPS, il database e la relativa connessione.',
    pasos: { tipo: 'Tipo', datos: 'Dati', resumen: 'Riepilogo', crear: 'Creazione' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Con Composer; chiave dell’applicazione, database e migrazioni.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Appstarter ufficiale con il relativo .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Framework classico con database.php configurato.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Scheletro ufficiale (o webapp) con il relativo .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Ambiente virtuale, requirements.txt e processo uvicorn.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Download ufficiale con wp-config.php pronto.' },
      estatico: {
        nombre: 'Sito statico',
        descripcion: 'HTML e CSS serviti da Nginx, senza database.',
      },
    },
    campos: {
      nombre: 'Nome del progetto',
      nombrePlaceholder: 'mio-negozio',
      nombreAyuda: (dominio: string) => `Sarà ${dominio}: lettere minuscole, numeri e trattini.`,
      carpeta: 'Cartella superiore',
      elegirCarpeta: 'Scegli cartella…',
      cambiarCarpeta: 'Cambia cartella…',
      carpetaAyuda:
        'Il progetto viene creato in una nuova cartella con il suo nome all’interno di questa. Deve essere vuota o non esistere.',
      php: 'Versione di PHP',
      python: 'Versione di Python',
      sinInstalada: 'Nessuna installata: la installi da Servizi.',
      conBase: 'Crea un database per il progetto',
      sinBase: 'Senza database',
      instancia: 'Server del database',
      apagada: 'arrestata',
      apagadaAyuda:
        'Questo server è arrestato: lo avvii in Servizi prima di creare il progetto.',
      sinMotores: 'Non c’è alcun server di database installato per questo tipo di progetto.',
      nombreBase: 'Nome del database',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Nessuno', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Includi i pacchetti web (webapp)',
      pgvector: 'Attiva pgvector (ricerca vettoriale)',
    },
    huella: {
      titulo: 'WordPress pubblica solo un’impronta debole',
      riesgo:
        'L’impronta pubblicata è SHA-1, un algoritmo non più considerato sicuro, e proviene dallo stesso sito del file.',
      explicacion:
        'Se quel sito o la connessione fossero compromessi, un download alterato supererebbe la verifica. Il download avviene comunque tramite HTTPS da wordpress.org. Continui solo se si fida di questa fonte.',
      leyendo: 'Lettura dell’impronta pubblicata…',
      noDisponible:
        'Impossibile leggere l’impronta ora (connessione assente o fonte non raggiungibile); verrà letta nuovamente al momento della creazione.',
      fuente: 'Origine: wordpress.org',
      casilla: 'Comprendo che l’impronta è debole e desidero creare comunque il progetto',
    },
    resumen: {
      titulo: 'Verrà creato quanto segue',
      intro: 'Verifichi prima di iniziare.',
      tipo: 'Tipo',
      carpeta: 'Cartella',
      sitio: 'Sito',
      dominio: 'Dominio',
      https: 'Indirizzo con HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Database',
      env: 'Connessione scritta in',
      nota: 'Se un passaggio non riesce, nulla viene eliminato: vedrà cosa è stato creato e potrà riprovare.',
    },
    errores: {
      nombreVacio: 'Inserisca un nome per il progetto.',
      nombreInvalido:
        'Il nome può contenere solo lettere minuscole, numeri e trattini (fino a 40), senza iniziare né terminare con un trattino.',
      sinCarpeta: 'Scelga la cartella superiore del progetto.',
      sinPhp: 'Scelga una versione di PHP (la installi da Servizi se non ce n’è nessuna).',
      sinPython: 'Scelga una versione di Python (la installi da Servizi se non ce n’è nessuna).',
      sinInstancia: 'Scelga il server in cui creare il database oppure deselezioni il database.',
      baseInvalida: 'Il nome del database non è valido per questo motore.',
      motorNoVale: 'WordPress richiede MySQL o MariaDB.',
      pgvectorMotor: 'pgvector richiede PostgreSQL.',
      huellaDebil: 'Confermi di comprendere che l’impronta di WordPress è debole.',
    },
    acciones: {
      cambiarCarpeta: 'Scegli un’altra cartella',
      cambiarBase: 'Cambia il nome del database',
      cambiarNombre: 'Cambia il nome',
      reintentarPaso: 'Riprova il passaggio',
      servicios: 'Vai a Servizi',
      confirmarHuella: 'Controlla la conferma',
    },
    botones: {
      siguiente: 'Avanti',
      atras: 'Indietro',
      crear: 'Crea progetto',
      creando: 'Creazione…',
      cerrar: 'Chiudi',
      abrirEditor: 'Apri nell’editor',
      verSitio: 'Apri il sito',
      verProyecto: 'Vedi in Progetti',
    },
    progreso: {
      titulo: 'Creazione del progetto',
      listo: 'Progetto creato.',
      fallo: (paso: string) =>
        `Il passaggio «${paso}» non è riuscito. Nulla è stato eliminato: riprovi il passaggio oppure risolva il problema e ritenti.`,
      quedo: (partes: string) => `È stato creato: ${partes}.`,
      quedoCarpeta: 'la cartella',
      quedoBase: (nombre: string) => `il database ${nombre}`,
      quedoSitio: 'il sito',
      avisos: 'Avvisi',
      sinUsuarioPropio:
        'La cifratura di sistema non è disponibile: il progetto utilizza la connessione dell’amministratore del database. Quando sarà disponibile, usi "Usa utente dedicato" nel gestore di .env.',
      editorFallo: 'Impossibile aprire l’editor.',
    },
  },
  importar: {
    boton: 'Importa…',
    titulo: 'Importa da Laragon, XAMPP o Herd',
    intro:
      'I siti vengono collegati dove si trovano: nessuna cartella viene spostata, copiata o modificata. Se lo desidera, vengono copiati anche i relativi database. WolfCore Dev legge soltanto le installazioni degli altri programmi.',
    buscando: 'Ricerca delle installazioni…',
    nada: 'Non sono stati trovati Laragon, XAMPP né Herd nelle cartelle abituali.',
    errorVista: 'Impossibile cercare gli elementi importabili',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Siti',
      todos: 'Seleziona tutti',
      ninguno: 'Deseleziona tutti',
      dominio: (d: string) => `Dominio ${d}`,
      dominioPropuesto: (d: string) => `Dominio ${d} (proposto)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP non determinato',
      base: (nombre: string, motor: string) => `Database ${nombre} (${motor})`,
      yaVinculado: 'È già un sito di WolfCore Dev',
      dominioEnUso: 'Un altro sito utilizza già questo dominio',
    },
    avisos: {
      sin_dominio: 'Non ha un dominio nell’altro programma: ne viene proposto uno.',
      dominio_invalido: 'Il suo dominio non è valido: ne viene proposto uno.',
      sin_vhost: 'Non ha un host virtuale proprio: viene proposto un dominio.',
      php_desconocido: 'Non si conosce la versione di PHP utilizzata: ne viene scelta una installata.',
      base_no_local: 'Il suo database si trova su un altro server: non viene importato.',
      base_nombre_invalido: 'Il nome del suo database non è valido: non viene importato.',
      motor_no_soportado: 'Il suo database non è MySQL né MariaDB: non viene importato.',
    },
    problemas: {
      titulo: (n: number) => `${n} elementi sono stati scartati o non sono stati leggibili`,
    },
    bases: {
      titulo: 'Database',
      importarBases: 'Importa anche i database',
      ayuda:
        'Avvii il server di database dell’altro programma prima di proseguire: WolfCore Dev non avvia né arresta programmi esterni. La password viene usata solo per questa importazione e non viene salvata.',
      destino: 'Server di destinazione',
      apagada: 'arrestato',
      sinMotores:
        'Non ci sono MySQL né MariaDB installati: li installi da Servizi per importare i database.',
      puerto: 'Porta del server di origine',
      usuario: 'Utente',
      clave: 'Password',
      claveAyuda: 'La lasci vuota se l’utente non ha password (come root in Laragon o XAMPP).',
      existe: 'esiste già nella destinazione',
      reemplazar: 'Sostituisci (viene eseguita prima una copia)',
      noSeToca: 'Non viene toccato se non lo seleziona.',
    },
    pasos: { elegir: 'Scegli', confirmar: 'Conferma' },
    continuar: 'Continua',
    volver: 'Indietro',
    cancelar: 'Annulla',
    importar: 'Importa',
    cerrar: 'Chiudi',
    sinSeleccion: 'Scelga almeno un sito.',
    origenIncompleto: 'Indichi la porta e l’utente del server di origine.',
    confirmar: {
      titulo: 'Confermi l’importazione',
      sitios: (n: number) =>
        `${n === 1 ? `Verrà collegato ${n} sito` : `Verranno collegati ${n} siti`} nella cartella attuale. Nessun file viene spostato, copiato o modificato.`,
      sinConfianza:
        'Nessun sito importato esegue ricette finché non seleziona «Mi fido di questo repository».',
      hosts:
        'Verranno aggiornati Nginx e il file hosts (Windows potrebbe richiedere i privilegi di amministratore).',
      basesNuevas: (nombres: string) => `Verranno copiati i database: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Verranno sostituiti questi database, già esistenti: ${nombres}. Prima viene salvata una copia di ciascuno.`,
      basesSinTocar: (nombres: string) => `Non verranno toccati questi database, già esistenti: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Verranno esportati dal server dell’altro programma (127.0.0.1:${puerto}, utente ${usuario}). Lettura senza modifiche.`,
      sinBases: 'Non verrà importato alcun database.',
      proteccion:
        'La struttura di ciascun database viene verificata prima e i dati vengono inseriti con un utente limitato: in caso di errore, il database rimane com’era.',
    },
    resultado: {
      titulo: 'Risultato dell’importazione',
      importando: 'Importazione…',
      cancelar: 'Annulla importazione',
      restaurada: 'Il database originale è stato ripristinato automaticamente dalla sua copia: è rimasto com’era.',
      sitioOk: 'Importato',
      sitioFallo: 'Non importato',
      baseOk: (n: string) => `Database ${n} importato`,
      baseFallo: (n: string) => `Database ${n} non importato`,
      copiaPrevia: (ruta: string) => `Copia del database precedente: ${ruta}`,
      phpDistinto: (v: string) => `È stato utilizzato PHP ${v} (la versione originale non era installata).`,
      sinAplicar:
        'Nginx o il file hosts non sono stati aggiornati: controlli l’avviso in Progetti e riprovi.',
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'sito importato' : 'siti importati'}, ${b} ${b === 1 ? 'database importato' : 'database importati'}.`,
      errorImportar: 'Impossibile importare',
    },
  },
  plantillas: {
    guardarComo: 'Salva come modello…',
    dialogo: {
      titulo: (nombre: string) => `Salva «${nombre}» come modello`,
      intro:
        'Il modello salva la ricetta, le impostazioni di PHP e Nginx, le estensioni e lo schema del database (solo la struttura, senza alcuna riga). Non salva mai password, chiavi né dati del database.',
      nombre: 'Nome del modello',
      nombrePlaceholder: 'Il mio progetto base',
      conArchivos: 'Includi anche i file del progetto',
      conArchivosAyuda: 'Senza questa opzione vengono salvati solo la ricetta, le impostazioni e lo schema.',
      siempre: 'Esclusi sempre',
      siempreLista:
        '.env e .env.*, vendor, node_modules, .git, .venv, log, dump e database su file (*.sql, *.dump, *.sqlite), chiavi e certificati (*.pem, *.key, *.crt…), wp-config.php e wolfcore.yml. Anche qualsiasi file che contenga una chiave o una password viene escluso.',
      extra: 'Escludi inoltre (uno per riga)',
      extraAyuda: 'Nomi o percorsi relativi al progetto, ad esempio uploads o public/build.',
      vista: 'Cosa verrà salvato',
      calculando: 'Calcolo…',
      resumen: (archivos: number, tamano: string) => `${archivos} file · ${tamano}`,
      fuera: (n: number) => `${n} esclusi`,
      sinArchivos: 'Verranno salvati solo la ricetta, le impostazioni e lo schema; nessun file.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Verrà salvata solo la struttura del database ${nombre} (server ${servidor}), senza alcuna riga.`,
      sinBase: 'Il progetto non dichiara alcun database: non verrà salvato nessuno schema.',
      avisoMongodb: 'Questo progetto usa MongoDB: il suo schema (collezioni e indici) non viene salvato.',
      incluirDeTodosModos: 'Includi comunque',
      avisoIncluir: 'Se questo file contiene una chiave reale, rimarrà all’interno del modello.',
      guardar: 'Salva modello',
      guardada: (nombre: string) => `Modello «${nombre}» salvato.`,
      errorGuardar: 'Impossibile salvare il modello',
      errorVista: 'Impossibile calcolare l’anteprima',
      cancelar: 'Annulla',
    },
    lista: {
      titulo: 'I miei modelli',
      ayuda:
        'Inizi un nuovo progetto con la ricetta, le impostazioni e lo schema (senza dati) di uno già esistente.',
      vacia:
        'Non ci sono ancora modelli. Salvi un progetto come modello dal menu della sua scheda.',
      conArchivosEtiqueta: 'con file',
      soloEsquema: 'ricetta e schema',
      conBase: (motor: string) => `database ${motor} senza dati`,
      borrarEtiqueta: (nombre: string) => `Elimina il modello ${nombre}`,
      borrarTitulo: (nombre: string) => `Eliminare il modello ${nombre}?`,
      borrarTexto:
        'Viene eliminato solo il modello. I progetti creati con esso e il progetto originale non vengono toccati.',
      borrada: 'Modello eliminato.',
      errorBorrar: 'Impossibile eliminare il modello',
      errorLista: 'Impossibile leggere i modelli',
      desde: (nombre: string) => `Modello: ${nombre}`,
      avisoSinBase: 'Questo modello non include un database.',
      importadaEtiqueta: 'importato',
      avisoImportada:
        'Il modello proviene da terze parti: il progetto viene creato senza fiducia e senza avviare i suoi processi, e aprire il sito esegue il suo codice. Controlli prima i suoi file.',
      generadoresTitulo: 'Progetti da zero',
    },
  },
  env: {
    accion: 'Variabili .env…',
    titulo: (nombre: string) => `.env di ${nombre}`,
    intro:
      'I valori segreti vengono mostrati mascherati. Un valore completo appare solo se fa clic su «Mostra» per quella variabile e viene nuovamente nascosto dopo 30 secondi. Prima del salvataggio viene creata una copia datata del file .env attuale.',
    noExiste: 'Questo progetto non ha ancora un file .env: verrà creato al salvataggio.',
    tablaEtiqueta: 'Variabili di .env',
    sinVariables: 'Il file .env non contiene variabili.',
    secretaEtiqueta: 'segreta',
    duplicadaEtiqueta: 'duplicata',
    duplicadaAyuda:
      'Questa variabile compare più di una volta nel file .env: viene mostrata e modificata l’ultima occorrenza.',
    soloLecturaEtiqueta: 'più righe',
    soloLecturaAyuda: 'Occupa più righe: la modifichi manualmente nel file.',
    seQuitara: 'Verrà rimossa al salvataggio',
    valorNuevo: 'Nuovo valore',
    valorNuevoDe: (clave: string) => `Nuovo valore di ${clave}`,
    valorDe: (clave: string) => `Valore di ${clave}`,
    vacio: '(vuoto)',
    mostrar: 'Mostra',
    ocultar: 'Nascondi',
    mostrarEtiqueta: (clave: string) => `Mostra il valore di ${clave}`,
    ocultarEtiqueta: (clave: string) => `Nascondi il valore di ${clave}`,
    cambiar: 'Modifica',
    deshacer: 'Annulla',
    deshacerEtiqueta: (clave: string) => `Annulla la modifica di ${clave}`,
    quitar: 'Rimuovi',
    quitarEtiqueta: (clave: string) => `Rimuovi la variabile ${clave}`,
    errorRevelar: 'Impossibile mostrare il valore',
    agregarTitulo: 'Aggiungi una variabile',
    agregarNombre: 'NOME',
    agregarValor: 'valore',
    agregar: 'Aggiungi',
    nombreInvalido:
      'Utilizzi lettere, numeri, trattino basso e punto, senza iniziare con un numero; il nome non deve esistere già.',
    comparar: {
      titulo: 'Confronta con il file di esempio',
      sinEjemplo: 'Il progetto non dispone di un file .env.example per il confronto.',
      alDia: 'Il file .env contiene le stesse variabili dell’esempio.',
      faltan: (n: number) => `Mancano ${n}:`,
      sobran: (n: number) => `${n} in più (non presenti nell’esempio):`,
      distintas: (n: number) => `${n} con un valore diverso dall’esempio:`,
      agregarFaltantes: 'Aggiungi quelle mancanti',
    },
    bloques: {
      titulo: 'Aggiungi un blocco di variabili',
      ayuda:
        'Aggiunge solo le variabili di quell’ambito mancanti nel file .env (quelle già presenti non vengono toccate), senza password né chiavi; le completi poi nella tabella.',
      bd: 'Database',
      correo: 'Posta',
      ia: 'IA',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Usa utente dedicato',
      ayuda:
        'Crea un utente del database solo per questo progetto (con permessi esclusivamente sul proprio database, mai di amministratore) e lo scrive nel file .env. Attualmente funziona con MySQL e MariaDB di WolfCore Dev.',
      confirmarTitulo: 'Usare un utente dedicato per il database?',
      confirmarTexto:
        'Viene creato un nuovo utente con una password casuale, con permessi solo sul database di questo progetto, e vengono aggiornati l’utente e la password di connessione nel file .env. Prima viene salvata una copia del file .env attuale; la nuova password resta nel file .env del progetto e cifrata in WolfCore Dev.',
      confirmar: 'Crea e usa',
      hecho: (usuario: string) => `Il progetto ora usa l’utente ${usuario}.`,
      compartirTitulo: 'Condividere l’utente di un altro progetto?',
      compartirTexto: (base: string, proyecto: string) =>
        `Il database ${base} è utilizzato anche da ${proyecto}. Condividere il suo utente? Questo progetto utilizzerà lo stesso utente e la stessa password; la password non cambia, quindi ${proyecto} rimane connesso.`,
      compartir: 'Condividi l’utente',
      error: 'Impossibile cambiare l’utente del database',
    },
    copias: {
      titulo: 'Ripristina una copia',
      ninguna: 'Non ci sono ancora copie di questo file .env.',
      volver: 'Ripristina questa copia',
      confirmarTitulo: 'Ripristinare una copia del file .env?',
      confirmarTexto: (fecha: string) =>
        `Il file .env attuale viene sostituito dalla copia del ${fecha}. Prima viene salvata un’altra copia di quello attuale, quindi l’operazione può essere annullata.`,
      hecho: 'Copia ripristinata.',
      error: 'Impossibile ripristinare la copia',
    },
    cambiosPendientes: (n: number) => `${n} modifiche non salvate`,
    descartar: 'Scarta modifiche',
    guardar: 'Rivedi e salva…',
    cerrar: 'Chiudi',
    cerrarTitulo: 'Chiudere senza salvare?',
    cerrarTexto: (n: number) => `Ci sono ${n} modifiche non salvate. Se chiude, andranno perse.`,
    cerrarDescartar: 'Chiudi e scarta',
    seguirEditando: 'Continua a modificare',
    confirmar: {
      titulo: 'Salva le modifiche del file .env',
      texto:
        'Ecco cosa cambierà. I valori segreti vengono mostrati mascherati. Viene salvata una copia datata del file .env attuale e il file viene scritto in un’unica operazione.',
      sinCambios: 'Non ci sono modifiche da salvare.',
      agregarGitignore: 'Aggiungi .env al file .gitignore del progetto',
      aceptarVersionado: 'Comprendo il rischio e desidero salvare comunque',
      guardar: 'Salva modifiche',
      versionado:
        'Git sta già tracciando il file .env di questo progetto: il prossimo commit caricherebbe i suoi valori anche se è presente in .gitignore. Lo rimuova dall’indice con git rm --cached .env.',
      versionadoDesconocido:
        'Impossibile verificare se git stia tracciando il file .env di questo progetto; confermi separatamente per salvare.',
    },
    errorVistaPrevia: 'Impossibile preparare l’anteprima',
    errorGuardar: 'Impossibile salvare il file .env',
    guardado: 'Il file .env è stato salvato.',
    guardadoConCopia: 'Il file .env è stato salvato; la versione precedente è rimasta come copia.',
  },
  asistenteInicio: {
    titulo: 'Benvenuto in WolfCore Dev',
    subtitulo:
      'Cinque passaggi per preparare l’ambiente. Nulla viene installato né modificato finché non fa clic sul pulsante di ciascun passaggio.',
    paso: (n: number, total: number) => `Passaggio ${n} di ${total}`,
    anterior: 'Indietro',
    siguiente: 'Avanti',
    omitirTodo: 'Salta procedura guidata',
    terminar: 'Fine',
    hecho: 'Fatto',
    reabrir: 'Può riaprirla da Impostazioni.',
    pasos: {
      carpeta: {
        titulo: 'Cartella dei progetti',
        texto:
          'Dove salva i suoi progetti. Qui vengono clonati i nuovi repository ed è la cartella monitorata nell’ultimo passaggio.',
        elegir: 'Scegli cartella',
        actual: (ruta: string) => `Cartella scelta: ${ruta}`,
        guardada: (ruta: string) => `Cartella attuale: ${ruta}`,
        ninguna: 'Non scelta: viene usata C:\\Proyectos se esiste.',
      },
      basicos: {
        titulo: 'Installa gli strumenti di base',
        texto:
          'Nginx, PHP 8.4, Composer e Node LTS dalle rispettive fonti ufficiali, con impronta verificata. Ciascuno viene installato solo facendo clic sul relativo pulsante.',
        instalado: 'Installato',
        instalar: (version: string) => `Installa ${version}`,
        sinVersion: 'Nessuna versione nel catalogo',
        cargando: 'Ricerca versioni…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: "Considerare attendibile l'autorità locale",
        texto:
          "Affinché i siti .test si aprano in HTTPS senza avvisi, Windows deve considerare attendibile l'autorità di WolfCore Dev. Windows le chiederà conferma.",
        confiar: 'Rendi attendibile la CA',
        confiada: "Windows considera già attendibile l'autorità locale.",
      },
      github: {
        titulo: 'Connettere GitHub',
        texto:
          'Per visualizzare i suoi repository e clonarli con un clic. Utilizzi la sessione di GitHub CLI o un token personale, che viene salvato cifrato su questo computer.',
      },
      vigilar: {
        titulo: 'Monitorare la cartella',
        texto:
          'WolfCore Dev le suggerirà di configurare ogni nuova cartella che compare nella cartella dei progetti. Non viene configurato nulla senza la sua conferma.',
        activar: 'Monitora questa cartella',
        activa: (ruta: string) => `Monitoraggio di ${ruta}`,
        sinCarpeta: 'Scelga prima la cartella dei progetti (passaggio 1).',
      },
    },
  },
  /** Risultato dell'importazione o esportazione di un profilo (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Backup e profili',
      descripcion:
        'Un profilo porta il suo ambiente su un altro computer: siti, versioni, istanze, modelli e impostazioni. Non include mai chiavi, token né password.',
      aislado: {
        titulo: 'Cartella di prova',
        texto: (ruta: string) =>
          `WolfCore Dev usa una cartella di dati di prova (${ruta}). Ciò che fa qui non tocca la sua cartella reale né il suo computer: non viene scritto il file hosts né vengono installati certificati.`,
      },
      exportar: {
        titulo: "Esportare l'ambiente",
        texto:
          'Salva un file .wolfperfil con i suoi siti, versioni, istanze, modelli e impostazioni.',
        bases: 'Includere i database',
        basesAyuda:
          'I dump completi (con i dati dei suoi clienti) viaggiano cifrati con la frase.',
        ca: "Includere l'autorità di certificazione (CA)",
        caAyuda: 'Viene cifrata con la frase. La importi solo su un suo computer.',
        certificados: 'Includere i certificati dei siti',
        certificadosAyuda: 'Viaggiano solo insieme alla CA e cifrati con essa.',
        frase: 'Frase',
        fraseRepetir: 'Ripetere la frase',
        fraseAyuda: (minimo: number) =>
          `Almeno ${minimo} caratteri. Senza di essa non è possibile recuperare i database né la CA, e non viene salvata da nessuna parte.`,
        problemas: {
          frase_corta: (minimo: number) => `La frase deve avere almeno ${minimo} caratteri.`,
          frase_distinta: 'Le due frasi non coincidono.',
          certificados_sin_ca: 'I certificati viaggiano solo insieme alla CA.',
        },
        exportar: 'Esporta profilo…',
        nota: 'Il profilo non include mai chiavi, token né password, né le istantanee, il cestino, i backup o la cartella data.',
        listo: 'Profilo esportato',
        guardado: (archivo: string, tamano: string) => `Salvato in ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Importare un profilo',
        texto:
          'Scelga un file .wolfperfil. Prima di modificare qualsiasi cosa vedrà tutto ciò che viene sostituito, rimosso o lasciato in sospeso, e verrà salvata una copia di ciò che viene sostituito.',
        boton: 'Importa profilo…',
      },
      instantaneas: {
        titulo: "Istantanee dell'ambiente",
        texto:
          'Prima di aggiornare PHP o Nginx e prima di importare un profilo, WolfCore Dev salva una copia della sua configurazione, di Nginx e dei php.ini, senza chiavi né dati e solo per lei. Vengono conservate le ultime 10.',
        compartidas:
          'Le 10 istantanee sono condivise tra tutti i motivi: creandone una nuova viene sostituita la più vecchia, anche se creata manualmente.',
        tomar: 'Crea ora',
        tomada: 'Istantanea salvata.',
        sinNada: "Non c'è ancora nulla da copiare.",
        vacia: 'Non ci sono ancora istantanee.',
        motivos: {
          actualizar: "Prima dell'aggiornamento",
          'importar-perfil': 'Prima di importare un profilo',
          'limpiar-versiones': 'Prima di pulire le versioni',
          manual: 'Manuale',
        },
      },
    },
    reasignar: {
      titulo: 'Cartelle dei siti',
      texto:
        "Queste cartelle provengono dall'altro computer. Cerchi dove si trovano su questo oppure importi il sito come in sospeso: rimane senza cartella finché non la sceglie.",
      sitio: 'Sito',
      origen: 'Cartella nel profilo',
      destino: 'Cartella su questo computer',
      existe: 'Esiste',
      noExiste: 'Non esiste su questo computer',
      buscar: 'Cerca cartella…',
      cambiar: 'Cambia',
      comoPendiente: 'Importa comunque come in sospeso',
      prefijo: (viejo: string, nuevo: string) =>
        `Usa la stessa modifica per gli altri (${viejo} → ${nuevo})`,
      omitido: 'Non verrà importato',
    },
    asistente: {
      titulo: 'Importare un profilo',
      pasos: {
        archivo: 'File',
        revisar: 'Verifica',
        confirmar: 'Conferma',
        resultado: 'Risultato',
      },
      archivo: {
        texto:
          'Scelga il file .wolfperfil. Non viene ancora modificato nulla: prima vedrà ciò che verrà sostituito, rimosso o lasciato in sospeso.',
        elegir: 'Scegli file…',
        cambiar: 'Scegli un altro',
        ninguno: 'Nessun file scelto',
        leyendo: 'Lettura del profilo…',
        error: 'Impossibile leggere il profilo',
      },
      origen: (fecha: string, sistema: string) => `Creato il ${fecha} su ${sistema}.`,
      ignoradas: (n: number) => `${n} voci del file non appartengono a un profilo e vengono ignorate.`,
      reemplaza: {
        titulo: 'Ciò che viene sostituito',
        ninguno: "Non ci sono dati in questa cartella: l'importazione avviene su un'installazione pulita.",
        copia:
          "Prima di sostituire viene salvata una copia in respaldos/pre-perfil-… e viene creata un'istantanea dell'ambiente; ogni database sostituito ha la propria istantanea. La cartella data non viene mai eliminata.",
        config: 'La configurazione (config.json)',
        sitio: (id: string) => `Il sito ${id}`,
        base: (instancia: string, base: string) => `Il database ${base} (${instancia})`,
        plantilla: (id: string) => `Il modello ${id}`,
        ca: "L'autorità di certificazione (CA) di questo computer",
      },
      versiones: {
        titulo: 'Versioni',
        ninguna: 'Il profilo non contiene versioni.',
        instalada: 'Già installata',
        descargar: 'Verrà scaricata con impronta verificata',
        pendienteDebil: 'In sospeso: senza impronta forte, la installi manualmente',
        pendienteFuera: 'In sospeso: non è più nel catalogo',
        huellas: {
          fuerte: 'Impronta SHA-256 o SHA-512',
          firmada: 'Firmata',
          debil: 'Impronta debole',
          ninguna: 'Senza impronta',
        },
        descargas: (n: number) =>
          `Verranno scaricate ${n} versioni da siti ufficiali, ciascuna con impronta o firma verificata.`,
      },
      instancias: {
        titulo: 'Istanze di database',
        existente: 'Esiste già: viene conservata con la sua porta e la sua versione',
        nueva: (puerto: number) => `Viene creata con nuove credenziali sulla porta ${puerto}`,
        reasignada: (de: number, a: number) => `La porta ${de} è occupata: userà la ${a}`,
      },
      bases: {
        titulo: 'Database',
        ninguna: 'Il profilo non contiene database.',
        texto:
          'Vengono ripristinati con un utente limitato a ciascun database e solo con istruzioni consentite. Di quelli già esistenti viene fatto prima un backup.',
        omitir: 'Importa senza i database',
      },
      plantillas: {
        titulo: 'Modelli',
        existe: 'Esiste già: viene sostituito',
        nueva: 'Nuovo',
      },
      workspaces: {
        titulo: 'Workspace',
        texto:
          'Contengono solo riferimenti a database e servizi (i processi dei progetti non vengono trasferiti). Vengono convalidati rispetto a ciò che esiste qui e non si avviano mai automaticamente.',
        existe: 'Ne esiste già uno con lo stesso id: viene conservato il suo',
        nuevo: 'Nuovo',
        elementos: (n: number) => (n === 1 ? '1 elemento' : `${n} elementi`),
        invalidos: (n: number) => `${n} del profilo non sono validi e non vengono importati.`,
      },
      quitado: {
        titulo: 'Ciò che non viene preso dalla configurazione',
        texto:
          'Questa cartella di dati è pulita: dal profilo non viene importato ciò che punta fuori da questo computer.',
      },
      puertos: {
        titulo: 'Porte occupate',
        texto: (lista: string) =>
          `Queste porte del profilo sono già usate da un altro programma su questo computer: ${lista}. Le modifichi da Servizi dopo l'importazione.`,
      },
      ca: {
        titulo: 'Autorità di certificazione (CA)',
        texto:
          'Il profilo contiene una CA cifrata. La importi solo se è la sua: questo computer accetterebbe i certificati da essa firmati.',
        huella: 'Impronta SHA-256 della CA del profilo',
        comparar: 'La confronti con quella del suo computer di origine prima di accettarla.',
        importar: 'Importa la CA del profilo',
        noImportar: 'Senza importarla, questo computer usa la propria CA attuale o ne crea una nuova.',
        ajena:
          'Questa CA ha vincoli di nome diversi da quelli di WolfCore Dev: non può essere importata.',
        sinRestricciones:
          "Questa CA non ha vincoli di nome: può firmare certificati di qualsiasi sito web, inclusi banche e posta elettronica. La importi solo se è la sua e se l'impronta coincide.",
        aceptarSin: "Comprendo il rischio: è la mia CA e l'impronta coincide",
        reemplazaLocal:
          'Questo computer ha già una CA. Importare quella del profilo la sostituisce (resta una copia nel backup precedente).',
        reemplazar: 'Sostituisci la CA di questo computer',
        noSeInstala: "La CA non viene installata automaticamente nell'archivio certificati di sistema.",
      },
      frase: {
        titulo: 'Frase del profilo',
        texto: "Il profilo contiene database o la CA cifrati. Inserisca la frase scelta al momento dell'esportazione.",
        campo: 'Frase',
        omitirBases: 'Importa senza i database',
        nota: 'La frase viene usata solo in questa finestra: non viene salvata e viene cancellata al termine o alla chiusura.',
      },
      env: {
        titulo: 'Connessione dei progetti',
        texto:
          'Selezioni i progetti il cui .env deve puntare a un nuovo utente dedicato del relativo database (con copia preventiva del .env). Gli altri non vengono toccati e restano segnalati.',
      },
      confirmar: {
        titulo: "Confermare l'importazione",
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Verranno importati ${sitios} siti, ${versiones} versioni e ${bases} database.`,
        importar: 'Importa',
        revisar: 'Verifica',
        volver: 'Indietro',
        bloqueos: {
          sitios_sin_carpeta:
            'Scelga la cartella di ciascun sito oppure lo contrassegni per importarlo come in sospeso.',
          frase_requerida: 'Inserisca la frase del profilo oppure importi senza i database.',
          ca_ajena: 'La CA del profilo non può essere importata.',
          ca_sin_restricciones: 'Confermi separatamente di voler importare una CA senza vincoli.',
          reemplazar_ca: 'Confermi separatamente di voler sostituire la CA di questo computer.',
        },
      },
      progreso: 'Importazione del profilo in corso… Non chiuda la finestra: con database o download può richiedere tempo.',
      fases: {
        copia: 'Copia di ciò che viene sostituito',
        versiones: 'Installazione delle versioni',
        configuracion: 'Salvataggio della configurazione e dei siti',
        plantillas: 'Copia dei modelli',
        ca: 'Preparazione della CA e dei certificati',
        bases: 'Ripristino dei database',
        env: 'Riscrittura dei file .env',
      },
      avance: (paso: number, de: number) => `Passaggio ${paso} di ${de}`,
      resultado: {
        titulo: "Risultato dell'importazione",
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} importati, ${pendientes} in sospeso, ${omitidos} omessi e ${errores} con errore.`,
        respaldo: (ruta: string) => `Copia di ciò che è stato sostituito: ${ruta}`,
        pendientes: 'Ciò che è rimasto in sospeso può essere completato manualmente.',
        error: 'Impossibile importare il profilo',
        secciones: {
          sitios: 'Siti',
          versiones: 'Versioni',
          instancias: 'Istanze',
          bases: 'Database',
          plantillas: 'Modelli',
          workspaces: 'Workspace',
          env: 'File .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Importato',
          pendiente: 'In sospeso',
          omitido: 'Omesso',
          error: 'Errore',
          instalada: 'Installata',
          ya_instalada: 'Già presente',
          creada: 'Creata',
          existente: 'Già esistente',
          puerto_reasignado: 'Porta riassegnata',
          reescrito: 'Riscritto',
          sin_marcar: 'Non selezionato',
        },
        ca: {
          importada: 'CA importata',
          nueva: 'Nuova CA generata',
          sin_cambios: 'La CA non è cambiata',
        },
        quitarCa: {
          boton: 'Rimuovi la CA precedente…',
          titulo: 'Rimuovere la CA precedente dai certificati attendibili',
          texto:
            "Verrà rimossa dall'archivio certificati di sistema la CA che questo computer aveva prima. Windows potrebbe chiedere conferma. La nuova CA non viene installata automaticamente.",
          si: 'Rimuovi',
          hecho: 'CA precedente rimossa dai certificati attendibili.',
        },
        descartadosWorkspace: (lista: string) => `Non esiste qui ed è stato rimosso: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} workspace non validi non sono stati importati.`,
        puerto: (de: number, a: number) => `Porta ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Copia del .env: ${ruta}`,
      },
    },
    /** Avviso importante nell'anteprima: la CA del profilo non ha vincoli di nome. */
    caSinRestricciones:
      "Questa CA può firmare qualsiasi sito web; la importi solo se è la sua e confronti l'impronta.",
    motivos: {
      procesos_quitados: 'I suoi processi (comandi di un altro computer) non sono stati importati.',
      tareas_quitadas:
        'Le sue attività pianificate (comandi di un altro computer) non sono state importate. Le ricrei o le adotti da wolfcore.yml.',
      tunel_con_nombre: 'Il suo tunnel con nome non viene trasferito: torna al tunnel rapido.',
      php_ini: 'Alcune impostazioni di php.ini non sono state importate.',
      xdebug: 'La sua impostazione di Xdebug non era valida ed è stata rimossa.',
      nginx_desactivado:
        "Le sue regole di Nginx restano salvate ma non applicate: le verifichi nell'editor.",
      carpeta_no_existe: 'La sua cartella non esiste su questo computer: la cerchi.',
      correo_sin_proveedor: 'Il suo provider SMTP non è stato importato: usa il raccoglitore di posta.',
      sitio_invalido: 'Il sito non è valido.',
      dominio_invalido: 'Il suo dominio non è valido (deve terminare in .test).',
      ruta_protegida: 'La sua cartella è di sistema o di WolfCore Dev: non viene importata.',
      dominio_en_uso: 'Un altro sito di questo computer usa già quel dominio.',
      sitio_repetido: 'Il sito è duplicato nel profilo.',
      no_disponible: 'Quella versione non è più nel catalogo.',
      huella_debil: "Quella versione non ha un'impronta forte: la installi manualmente da Versioni.",
      tope_descargas:
        'Non è stata scaricata per non effettuare troppi download contemporaneamente: la installi da Versioni.',
      instancia_pendiente: 'La sua istanza è rimasta in sospeso.',
      motor_no_soportado: 'Quel motore non può essere importato da un profilo.',
      version_pendiente: 'La sua versione del motore è rimasta in sospeso.',
      danada: 'I suoi file nel profilo sono danneggiati.',
      bases_omitidas: 'Importato senza i database.',
      instancia_apagada: 'Non è stato possibile avviare la sua istanza.',
      sin_copia_previa: "Impossibile creare l'istantanea precedente: il database non è stato sostituito.",
      sin_base: 'Il suo .env non punta a un database locale.',
      base_no_resuelta: 'Non è stato possibile determinare a quale istanza appartenga il suo database.',
      error_inesperado: 'Si è verificato un errore.',
    },
    avisos: {
      ca_reemplazada:
        "La CA precedente di questo computer è ancora nell'archivio dei certificati attendibili di sistema e non viene più usata. Può rimuoverla da qui.",
      base_no_incluida: 'Il database {base} ({instancia}) non è stato incluso.',
      sin_ca: "Non c'è una CA su questo computer: il profilo viene esportato senza.",
      ca_no_importada: 'La CA del profilo non è stata importata: viene usata quella di questo computer o una nuova.',
      certificados: 'Impossibile preparare i certificati: {detalle}',
      aplicar:
        'I siti importati non sono stati applicati completamente (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Provider di IA {id}: usa un URL personalizzato.',
      smtp: 'Provider SMTP {id}: il suo host non appartiene a un provider noto o manca il nome utente.',
      puerto: 'Porta di {id}: fuori intervallo, torna a quella predefinita.',
      carpeta_vigilada: 'La cartella monitorata appartiene a un altro computer.',
    },
  },
};
