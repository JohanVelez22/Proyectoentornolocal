import { IDIOMAS_UI, type IdiomaUi } from '@pel/core';

/** Textos del proceso principal (bandeja y diálogos nativos) en los idiomas de la interfaz. */
const TEXTOS = {
  es: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar todo',
    detenerTodo: 'Detener todo',
    salir: 'Salir',
    workspaces: 'Workspaces',
    workspaceParcial: 'parcial',
    preguntaApagar: '¿Apagar los servicios?',
    siApagar: 'Sí, apagar',
    noApagar: 'No, dejarlos encendidos',
    cancelar: 'Cancelar',
    sinGuardarTitulo: 'Cambios sin guardar',
    sinGuardarTexto: 'El editor de código tiene cambios sin guardar. Si sigue, se pierden.',
    sinGuardarSalir: 'Salir sin guardar',
    sinGuardarSeguir: 'Seguir editando',
    cliTitulo: 'Orden de la terminal (wolf)',
    cliTunelInternet:
      'Una orden de la terminal quiere publicar {dominio} en internet con {proveedor}. Cualquiera con el enlace podrá verlo.',
    cliTunelTailnet:
      'Una orden de la terminal quiere compartir {dominio} con los equipos de su tailnet ({proveedor}).',
    cliPublicoEn: 'Dirección pública: https://{publico}',
    cliDatosReales:
      'ATENCIÓN: {dominio} tiene DATOS REALES. Para continuar, elija abajo su dominio exacto. Si no pidió esto, cancele.',
    cliPublicar: 'Publicar',
    cliPhpGlobal:
      'Una orden de la terminal quiere cambiar el PHP de todas las terminales a la versión {version}.',
    cliCambiar: 'Cambiar',
    carpetaDatosAislada:
      'carpeta de datos de prueba, sin tocar hosts, PATH ni certificados del sistema',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS no es una carpeta de datos válida: debe ser absoluta, no del sistema y distinta de la carpeta real (y de la anterior). La app se cierra sin tocar nada.',
    capturaAtajoOcupado:
      'El atajo {atajo} ya lo usa otro programa y no se pisó. La captura de pantalla queda sin atajo global: elija otro en Ajustes.',
    capturaPermisoTitulo: 'Permiso para grabar la pantalla',
    capturaPermisoTexto:
      'Para capturar la pantalla, macOS pide que WolfCore Dev tenga el permiso de grabación de pantalla. Ábralo en Ajustes del Sistema (Privacidad y seguridad), active WolfCore Dev y vuelva a intentarlo. Nada de lo capturado sale de este equipo.',
    capturaAbrirPreferencias: 'Abrir los ajustes',
    capturaNoDisponible: 'La captura de pantalla no está disponible en este equipo.',
  },
  en: {
    abrir: 'Open',
    iniciarTodo: 'Start all',
    detenerTodo: 'Stop all',
    salir: 'Quit',
    workspaces: 'Workspaces',
    workspaceParcial: 'partial',
    preguntaApagar: 'Stop the services?',
    siApagar: 'Yes, stop them',
    noApagar: 'No, keep them running',
    cancelar: 'Cancel',
    sinGuardarTitulo: 'Unsaved changes',
    sinGuardarTexto: 'The code editor has unsaved changes. If you continue, they are lost.',
    sinGuardarSalir: 'Leave without saving',
    sinGuardarSeguir: 'Keep editing',
    cliTitulo: 'Terminal command (wolf)',
    cliTunelInternet:
      'A terminal command wants to publish {dominio} on the internet with {proveedor}. Anyone with the link will be able to see it.',
    cliTunelTailnet:
      'A terminal command wants to share {dominio} with the devices on your tailnet ({proveedor}).',
    cliPublicoEn: 'Public address: https://{publico}',
    cliDatosReales:
      'WARNING: {dominio} has REAL DATA. To continue, choose its exact domain below. If you did not ask for this, cancel.',
    cliPublicar: 'Publish',
    cliPhpGlobal:
      'A terminal command wants to change the PHP of all terminals to version {version}.',
    cliCambiar: 'Change',
    carpetaDatosAislada:
      'test data folder, without touching the system hosts, PATH or certificates',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS is not a valid data folder: it must be absolute, not a system folder and different from the real one (and the previous one). The app closes without touching anything.',
    capturaAtajoOcupado:
      'The shortcut {atajo} is already used by another program and was left alone. Screen capture has no global shortcut: choose another in Settings.',
    capturaPermisoTitulo: 'Screen recording permission',
    capturaPermisoTexto:
      'To capture the screen, macOS needs WolfCore Dev to have the screen recording permission. Open it in System Settings (Privacy & Security), turn on WolfCore Dev and try again. Nothing you capture leaves this computer.',
    capturaAbrirPreferencias: 'Open settings',
    capturaNoDisponible: 'Screen capture is not available on this computer.',
  },
  pt: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar tudo',
    detenerTodo: 'Parar tudo',
    salir: 'Sair',
    workspaces: 'Espaços de trabalho',
    workspaceParcial: 'em parte',
    preguntaApagar: 'Desligar os serviços?',
    siApagar: 'Sim, desligar',
    noApagar: 'Não, deixá-los ligados',
    cancelar: 'Cancelar',
    sinGuardarTitulo: 'Alterações não salvas',
    sinGuardarTexto: 'O editor de código tem alterações não salvas. Se continuar, elas se perdem.',
    sinGuardarSalir: 'Sair sem salvar',
    sinGuardarSeguir: 'Continuar editando',
    cliTitulo: 'Comando do terminal (wolf)',
    cliTunelInternet:
      'Um comando do terminal quer publicar {dominio} na internet com {proveedor}. Qualquer pessoa com o link poderá vê-lo.',
    cliTunelTailnet:
      'Um comando do terminal quer compartilhar {dominio} com os dispositivos da sua tailnet ({proveedor}).',
    cliPublicoEn: 'Endereço público: https://{publico}',
    cliDatosReales:
      'ATENÇÃO: {dominio} tem DADOS REAIS. Para continuar, escolha abaixo o domínio exato. Se não pediu isto, cancele.',
    cliPublicar: 'Tornar público',
    cliPhpGlobal:
      'Um comando do terminal quer mudar o PHP de todos os terminais para a versão {version}.',
    cliCambiar: 'Mudar',
    carpetaDatosAislada:
      'pasta de dados de teste, sem tocar o hosts, o PATH nem os certificados do sistema',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS não é uma pasta de dados válida: deve ser absoluta, não do sistema e diferente da pasta real (e da anterior). O app fecha sem tocar em nada.',
    capturaAtajoOcupado:
      'O atalho {atajo} já é usado por outro programa e não foi alterado. A captura de tela fica sem atalho global: escolha outro em Ajustes.',
    capturaPermisoTitulo: 'Permissão para gravar a tela',
    capturaPermisoTexto:
      'Para capturar a tela, o macOS exige que o WolfCore Dev tenha a permissão de gravação de tela. Abra-a em Ajustes do Sistema (Privacidade e segurança), ative o WolfCore Dev e tente de novo. Nada do que for capturado sai deste computador.',
    capturaAbrirPreferencias: 'Abrir os ajustes',
    capturaNoDisponible: 'A captura de tela não está disponível neste computador.',
  },
  fr: {
    abrir: 'Ouvrir',
    iniciarTodo: 'Tout démarrer',
    detenerTodo: 'Tout arrêter',
    salir: 'Quitter',
    workspaces: 'Espaces de travail',
    workspaceParcial: 'partiel',
    preguntaApagar: 'Arrêter les services ?',
    siApagar: 'Oui, les arrêter',
    noApagar: 'Non, les laisser actifs',
    cancelar: 'Annuler',
    sinGuardarTitulo: 'Modifications non enregistrées',
    sinGuardarTexto:
      'L’éditeur de code contient des modifications non enregistrées. Si vous continuez, elles sont perdues.',
    sinGuardarSalir: 'Quitter sans enregistrer',
    sinGuardarSeguir: 'Continuer à modifier',
    cliTitulo: 'Commande du terminal (wolf)',
    cliTunelInternet:
      'Une commande du terminal veut publier {dominio} sur internet avec {proveedor}. Toute personne ayant le lien pourra le voir.',
    cliTunelTailnet:
      'Une commande du terminal veut partager {dominio} avec les appareils de votre tailnet ({proveedor}).',
    cliPublicoEn: 'Adresse publique : https://{publico}',
    cliDatosReales:
      'ATTENTION : {dominio} contient des DONNÉES RÉELLES. Pour continuer, choisissez ci-dessous son domaine exact. Si ce n’était pas voulu, annulez.',
    cliPublicar: 'Publier',
    cliPhpGlobal:
      'Une commande du terminal veut changer le PHP de tous les terminaux vers la version {version}.',
    cliCambiar: 'Changer',
    carpetaDatosAislada:
      'dossier de données de test, sans toucher au hosts, au PATH ni aux certificats du système',
    carpetaDatosInvalida:
      "WOLFCORE_DATOS n'est pas un dossier de données valide : il doit être absolu, hors des dossiers système et différent du dossier réel (et du précédent). L'application se ferme sans rien toucher.",
    capturaAtajoOcupado:
      'Le raccourci {atajo} est déjà utilisé par un autre programme et n’a pas été modifié. La capture d’écran n’a plus de raccourci global : choisissez-en un autre dans les Réglages.',
    capturaPermisoTitulo: 'Autorisation d’enregistrer l’écran',
    capturaPermisoTexto:
      'Pour capturer l’écran, macOS exige que WolfCore Dev ait l’autorisation d’enregistrement de l’écran. Ouvrez-la dans les Réglages Système (Confidentialité et sécurité), activez WolfCore Dev et réessayez. Rien de ce qui est capturé ne quitte cet ordinateur.',
    capturaAbrirPreferencias: 'Ouvrir les réglages',
    capturaNoDisponible: 'La capture d’écran n’est pas disponible sur cet ordinateur.',
  },
  de: {
    abrir: 'Öffnen',
    iniciarTodo: 'Alle starten',
    detenerTodo: 'Alle stoppen',
    salir: 'Beenden',
    workspaces: 'Workspaces',
    workspaceParcial: 'teilweise',
    preguntaApagar: 'Dienste stoppen?',
    siApagar: 'Ja, stoppen',
    noApagar: 'Nein, weiterlaufen lassen',
    cancelar: 'Abbrechen',
    cliTitulo: 'Terminalbefehl (wolf)',
    cliTunelInternet:
      'Ein Terminalbefehl möchte {dominio} über {proveedor} im Internet veröffentlichen. Jeder mit dem Link kann die Website aufrufen.',
    cliTunelTailnet:
      'Ein Terminalbefehl möchte {dominio} mit den Geräten Ihres Tailnets ({proveedor}) teilen.',
    cliPublicoEn: 'Öffentliche Adresse: https://{publico}',
    cliDatosReales:
      'ACHTUNG: {dominio} enthält ECHTE DATEN. Wählen Sie zum Fortfahren unten die exakte Domain aus. Wenn Sie dies nicht angefordert haben, brechen Sie ab.',
    cliPublicar: 'Veröffentlichen',
    cliPhpGlobal:
      'Ein Terminalbefehl möchte die PHP-Version für alle Terminals auf {version} umstellen.',
    cliCambiar: 'Ändern',
    carpetaDatosAislada:
      'Testdatenordner, ohne hosts, PATH oder Systemzertifikate zu verändern',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS ist kein gültiger Datenordner: Er muss absolut sein, kein Systemordner und verschieden vom echten (und vorherigen) Ordner. Die App wird ohne Änderungen geschlossen.',
  },
  it: {
    abrir: 'Apri',
    iniciarTodo: 'Avvia tutto',
    detenerTodo: 'Ferma tutto',
    salir: 'Esci',
    workspaces: 'Workspaces',
    workspaceParcial: 'parziale',
    preguntaApagar: 'Fermare i servizi?',
    siApagar: 'Sì, ferma',
    noApagar: 'No, lasciali attivi',
    cancelar: 'Annulla',
    cliTitulo: 'Comando da terminale (wolf)',
    cliTunelInternet:
      'Un comando da terminale vuole pubblicare {dominio} su internet con {proveedor}. Chiunque abbia il link potrà vederlo.',
    cliTunelTailnet:
      'Un comando da terminale vuole condividere {dominio} con i dispositivi della sua tailnet ({proveedor}).',
    cliPublicoEn: 'Indirizzo pubblico: https://{publico}',
    cliDatosReales:
      'ATTENZIONE: {dominio} contiene DATI REALI. Per continuare, scelga sotto il dominio esatto. Se non ha richiesto questa operazione, annulli.',
    cliPublicar: 'Pubblica',
    cliPhpGlobal:
      'Un comando da terminale vuole cambiare il PHP di tutti i terminali alla versione {version}.',
    cliCambiar: 'Cambia',
    carpetaDatosAislada:
      'cartella dati di test, senza modificare hosts, PATH né certificati di sistema',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS non è una cartella dati valida: deve essere assoluta, non di sistema e diversa dalla cartella reale (e dalla precedente). L’app si chiude senza modificare nulla.',
  },
} satisfies Record<IdiomaUi, Record<string, string>>;

export type TextosMain = (typeof TEXTOS)['es'];

export function textosMain(idioma: IdiomaUi | null): TextosMain {
  return TEXTOS[idioma ?? 'es'];
}

/** Idioma de la interfaz para un locale del sistema (`es-CO` → `es`); inglés si no es de los cuatro. */
export function idiomaDeLocale(locale: string): IdiomaUi {
  const l = (locale || '').slice(0, 2).toLowerCase();
  return (IDIOMAS_UI as readonly string[]).includes(l) ? (l as IdiomaUi) : 'en';
}
