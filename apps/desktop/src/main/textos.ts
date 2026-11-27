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
    carpetaDatosAislada: 'Testdatenordner, ohne hosts, PATH oder Systemzertifikate zu verändern',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS ist kein gültiger Datenordner: Er muss absolut sein, kein Systemordner und verschieden vom echten (und vorherigen) Ordner. Die App wird ohne Änderungen geschlossen.',
    sinGuardarTitulo: 'Nicht gespeicherte Änderungen',
    sinGuardarTexto:
      'Der Code-Editor hat nicht gespeicherte Änderungen. Wenn Sie fortfahren, gehen sie verloren.',
    sinGuardarSalir: 'Ohne Speichern beenden',
    sinGuardarSeguir: 'Weiter bearbeiten',
    capturaAtajoOcupado:
      'Das Tastenkürzel {atajo} wird bereits von einem anderen Programm verwendet und wurde nicht überschrieben. Die Bildschirmaufnahme hat kein globales Tastenkürzel: Wählen Sie in den Einstellungen ein anderes.',
    capturaPermisoTitulo: 'Berechtigung zur Bildschirmaufzeichnung',
    capturaPermisoTexto:
      'Zum Aufnehmen des Bildschirms verlangt macOS, dass WolfCore Dev die Berechtigung zur Bildschirmaufzeichnung hat. Öffnen Sie sie in den Systemeinstellungen (Datenschutz & Sicherheit), aktivieren Sie WolfCore Dev und versuchen Sie es erneut. Nichts von dem, was Sie aufnehmen, verlässt diesen Computer.',
    capturaAbrirPreferencias: 'Einstellungen öffnen',
    capturaNoDisponible: 'Die Bildschirmaufnahme ist auf diesem Computer nicht verfügbar.',
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
    sinGuardarTitulo: 'Modifiche non salvate',
    sinGuardarTexto: "L'editor di codice ha modifiche non salvate. Se continua, andranno perse.",
    sinGuardarSalir: 'Esci senza salvare',
    sinGuardarSeguir: 'Continua a modificare',
    capturaAtajoOcupado:
      "La scorciatoia {atajo} è già usata da un altro programma e non è stata sovrascritta. L'acquisizione dello schermo resta senza scorciatoia globale: ne scelga un'altra in Impostazioni.",
    capturaPermisoTitulo: 'Autorizzazione per la registrazione dello schermo',
    capturaPermisoTexto:
      "Per acquisire lo schermo, macOS richiede che WolfCore Dev abbia l'autorizzazione per la registrazione dello schermo. La apra in Impostazioni di Sistema (Privacy e sicurezza), attivi WolfCore Dev e riprovi. Nulla di ciò che acquisisce lascia questo computer.",
    capturaAbrirPreferencias: 'Apri le impostazioni',
    capturaNoDisponible: "L'acquisizione dello schermo non è disponibile su questo computer.",
  },
  ru: {
    abrir: 'Открыть',
    iniciarTodo: 'Запустить всё',
    detenerTodo: 'Остановить всё',
    salir: 'Выход',
    workspaces: 'Workspaces',
    workspaceParcial: 'частично',
    preguntaApagar: 'Остановить службы?',
    siApagar: 'Да, остановить',
    noApagar: 'Нет, оставить работать',
    cancelar: 'Отмена',
    cliTitulo: 'Команда терминала (wolf)',
    cliTunelInternet:
      'Команда терминала хочет опубликовать {dominio} в интернете через {proveedor}. Любой, у кого есть ссылка, сможет открыть сайт.',
    cliTunelTailnet:
      'Команда терминала хочет открыть доступ к {dominio} для устройств вашей tailnet ({proveedor}).',
    cliPublicoEn: 'Публичный адрес: https://{publico}',
    cliDatosReales:
      'ВНИМАНИЕ: {dominio} содержит РЕАЛЬНЫЕ ДАННЫЕ. Чтобы продолжить, выберите ниже его точный домен. Если вы этого не запрашивали, нажмите «Отмена».',
    cliPublicar: 'Опубликовать',
    cliPhpGlobal: 'Команда терминала хочет переключить PHP во всех терминалах на версию {version}.',
    cliCambiar: 'Изменить',
    carpetaDatosAislada: 'тестовая папка данных без изменения hosts, PATH и системных сертификатов',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS не является допустимой папкой данных: путь должен быть абсолютным, не системным и отличным от основной (и предыдущей) папки. Приложение закрывается без изменений.',
    sinGuardarTitulo: 'Несохранённые изменения',
    sinGuardarTexto:
      'В редакторе кода есть несохранённые изменения. Если вы продолжите, они будут потеряны.',
    sinGuardarSalir: 'Выйти без сохранения',
    sinGuardarSeguir: 'Продолжить редактирование',
    capturaAtajoOcupado:
      'Сочетание клавиш {atajo} уже используется другой программой и не было изменено. У захвата экрана нет глобального сочетания: выберите другое в настройках.',
    capturaPermisoTitulo: 'Разрешение на запись экрана',
    capturaPermisoTexto:
      'Чтобы захватывать экран, macOS требует, чтобы у WolfCore Dev было разрешение на запись экрана. Откройте его в «Системных настройках» (Конфиденциальность и безопасность), включите WolfCore Dev и повторите попытку. Ничто из захваченного не покидает этот компьютер.',
    capturaAbrirPreferencias: 'Открыть настройки',
    capturaNoDisponible: 'Захват экрана недоступен на этом компьютере.',
  },
  zh: {
    abrir: '打开',
    iniciarTodo: '全部启动',
    detenerTodo: '全部停止',
    salir: '退出',
    workspaces: '工作区',
    workspaceParcial: '部分运行',
    preguntaApagar: '是否停止所有服务？',
    siApagar: '是，停止',
    noApagar: '否，保持运行',
    cancelar: '取消',
    cliTitulo: '终端命令 (wolf)',
    cliTunelInternet:
      '有一条终端命令希望通过 {proveedor} 将 {dominio} 发布到互联网。任何持有链接的人都可以访问。',
    cliTunelTailnet: '有一条终端命令希望将 {dominio} 共享给您 tailnet 中的设备（{proveedor}）。',
    cliPublicoEn: '公开地址：https://{publico}',
    cliDatosReales:
      '警告：{dominio} 包含真实数据。若要继续，请在下方选择其准确域名。若非您本人请求，请取消。',
    cliPublicar: '发布',
    cliPhpGlobal: '有一条终端命令希望将所有终端的 PHP 切换为版本 {version}。',
    cliCambiar: '切换',
    carpetaDatosAislada: '测试数据文件夹，不修改系统 hosts、PATH 或证书',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS 不是有效的数据文件夹：必须为绝对路径、非系统目录且不同于真实（及先前的）文件夹。应用将关闭且不做任何更改。',
    sinGuardarTitulo: '有未保存的更改',
    sinGuardarTexto: '代码编辑器中有未保存的更改。如果继续，这些更改将丢失。',
    sinGuardarSalir: '不保存并退出',
    sinGuardarSeguir: '继续编辑',
    capturaAtajoOcupado:
      '快捷键 {atajo} 已被其他程序占用，未作更改。屏幕截图目前没有全局快捷键：请在设置中选择其他快捷键。',
    capturaPermisoTitulo: '屏幕录制权限',
    capturaPermisoTexto:
      '要截取屏幕，macOS 需要 WolfCore Dev 拥有屏幕录制权限。请在“系统设置”（隐私与安全性）中打开该权限，启用 WolfCore Dev 后重试。您截取的任何内容都不会离开此电脑。',
    capturaAbrirPreferencias: '打开设置',
    capturaNoDisponible: '此电脑无法使用屏幕截图。',
  },
  ja: {
    abrir: '開く',
    iniciarTodo: 'すべて起動',
    detenerTodo: 'すべて停止',
    salir: '終了',
    workspaces: 'ワークスペース',
    workspaceParcial: '一部起動',
    preguntaApagar: 'サービスを停止しますか？',
    siApagar: 'はい、停止する',
    noApagar: 'いいえ、起動したままにする',
    cancelar: 'キャンセル',
    cliTitulo: 'ターミナルコマンド (wolf)',
    cliTunelInternet:
      'ターミナルコマンドが {proveedor} を使って {dominio} をインターネットに公開しようとしています。リンクを知る誰でも閲覧できます。',
    cliTunelTailnet:
      'ターミナルコマンドが {dominio} を tailnet 上の端末（{proveedor}）と共有しようとしています。',
    cliPublicoEn: '公開アドレス: https://{publico}',
    cliDatosReales:
      '警告: {dominio} には実データが含まれています。続行するには下で正確なドメインを選択してください。心当たりがない場合はキャンセルしてください。',
    cliPublicar: '公開する',
    cliPhpGlobal:
      'ターミナルコマンドがすべてのターミナルの PHP をバージョン {version} に変更しようとしています。',
    cliCambiar: '変更する',
    carpetaDatosAislada: 'テスト用データフォルダ（システムの hosts・PATH・証明書は変更されません）',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS は有効なデータフォルダではありません。絶対パスであり、システムフォルダでなく、本来の（および以前の）フォルダと異なる必要があります。何も変更せず終了します。',
    sinGuardarTitulo: '未保存の変更',
    sinGuardarTexto: 'コードエディターに未保存の変更があります。続行すると失われます。',
    sinGuardarSalir: '保存せずに終了',
    sinGuardarSeguir: '編集を続ける',
    capturaAtajoOcupado:
      'ショートカット {atajo} は他のプログラムで使用されているため、変更されませんでした。画面キャプチャにはグローバルショートカットがありません。設定で別のものを選んでください。',
    capturaPermisoTitulo: '画面収録の権限',
    capturaPermisoTexto:
      '画面をキャプチャするには、macOS で WolfCore Dev に画面収録の権限が必要です。システム設定（プライバシーとセキュリティ）で権限を開き、WolfCore Dev をオンにして、もう一度お試しください。キャプチャした内容がこのコンピューターの外に出ることはありません。',
    capturaAbrirPreferencias: '設定を開く',
    capturaNoDisponible: 'このコンピューターでは画面キャプチャを利用できません。',
  },
  ko: {
    abrir: '열기',
    iniciarTodo: '모두 시작',
    detenerTodo: '모두 중지',
    salir: '종료',
    workspaces: '워크스페이스',
    workspaceParcial: '부분 실행',
    preguntaApagar: '서비스를 중지하시겠습니까?',
    siApagar: '예, 중지합니다',
    noApagar: '아니요, 실행 상태로 둡니다',
    cancelar: '취소',
    cliTitulo: '터미널 명령 (wolf)',
    cliTunelInternet:
      '터미널 명령이 {proveedor}을(를) 통해 {dominio}을(를) 인터넷에 공개하려고 합니다. 링크가 있는 누구나 볼 수 있습니다.',
    cliTunelTailnet:
      '터미널 명령이 {dominio}을(를) tailnet 기기와 공유하려고 합니다 ({proveedor}).',
    cliPublicoEn: '공개 주소: https://{publico}',
    cliDatosReales:
      '주의: {dominio}에는 실제 데이터가 있습니다. 계속하려면 아래에서 정확한 도메인을 선택하십시오. 요청한 작업이 아니라면 취소하십시오.',
    cliPublicar: '공개',
    cliPhpGlobal: '터미널 명령이 모든 터미널의 PHP를 버전 {version}(으)로 변경하려고 합니다.',
    cliCambiar: '변경',
    carpetaDatosAislada:
      '테스트 데이터 폴더입니다. 시스템 hosts, PATH 및 인증서는 변경하지 않습니다',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS가 올바른 데이터 폴더가 아닙니다. 절대 경로여야 하며, 시스템 폴더가 아니어야 하고, 실제 데이터 폴더(및 이전 폴더)와 달라야 합니다. 아무것도 변경하지 않고 앱을 종료합니다.',
    sinGuardarTitulo: '저장되지 않은 변경 사항',
    sinGuardarTexto:
      '코드 편집기에 저장되지 않은 변경 사항이 있습니다. 계속하면 변경 사항이 사라집니다.',
    sinGuardarSalir: '저장하지 않고 나가기',
    sinGuardarSeguir: '계속 편집',
    capturaAtajoOcupado:
      '단축키 {atajo}은(는) 이미 다른 프로그램에서 사용 중이라 변경하지 않았습니다. 화면 캡처에는 전역 단축키가 없습니다. 설정에서 다른 단축키를 선택하세요.',
    capturaPermisoTitulo: '화면 기록 권한',
    capturaPermisoTexto:
      '화면을 캡처하려면 macOS에서 WolfCore Dev에 화면 기록 권한이 필요합니다. 시스템 설정(개인정보 보호 및 보안)에서 권한을 열고 WolfCore Dev를 켠 다음 다시 시도하세요. 캡처한 내용은 이 컴퓨터를 벗어나지 않습니다.',
    capturaAbrirPreferencias: '설정 열기',
    capturaNoDisponible: '이 컴퓨터에서는 화면 캡처를 사용할 수 없습니다.',
  },
  hi: {
    abrir: 'खोलें',
    iniciarTodo: 'सभी शुरू करें',
    detenerTodo: 'सभी बंद करें',
    salir: 'बाहर निकलें',
    workspaces: 'वर्कस्पेस',
    workspaceParcial: 'आंशिक',
    preguntaApagar: 'क्या सेवाएँ बंद करें?',
    siApagar: 'हाँ, बंद करें',
    noApagar: 'नहीं, चालू रहने दें',
    cancelar: 'रद्द करें',
    cliTitulo: 'टर्मिनल कमांड (wolf)',
    cliTunelInternet:
      'एक टर्मिनल कमांड {proveedor} के माध्यम से {dominio} को इंटरनेट पर प्रकाशित करना चाहता है। लिंक वाला कोई भी व्यक्ति इसे देख सकेगा।',
    cliTunelTailnet:
      'एक टर्मिनल कमांड {dominio} को आपके tailnet के उपकरणों के साथ साझा करना चाहता है ({proveedor})।',
    cliPublicoEn: 'सार्वजनिक पता: https://{publico}',
    cliDatosReales:
      'चेतावनी: {dominio} में वास्तविक डेटा है। जारी रखने के लिए, नीचे इसका सटीक डोमेन चुनें। यदि आपने यह अनुरोध नहीं किया था, तो रद्द करें।',
    cliPublicar: 'प्रकाशित करें',
    cliPhpGlobal: 'एक टर्मिनल कमांड सभी टर्मिनलों का PHP संस्करण {version} में बदलना चाहता है।',
    cliCambiar: 'बदलें',
    carpetaDatosAislada: 'परीक्षण डेटा फ़ोल्डर, बिना hosts, PATH या सिस्टम प्रमाणपत्रों में बदलाव किए',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS एक मान्य डेटा फ़ोल्डर नहीं है: यह पूर्ण पथ होना चाहिए, सिस्टम फ़ोल्डर नहीं होना चाहिए और वास्तविक फ़ोल्डर (तथा पिछले फ़ोल्डर) से भिन्न होना चाहिए। ऐप बिना किसी बदलाव के बंद हो रहा है।',
    sinGuardarTitulo: 'बिना सहेजे बदलाव',
    sinGuardarTexto: 'कोड एडिटर में बिना सहेजे बदलाव हैं। यदि आप आगे बढ़ते हैं, तो वे खो जाएँगे।',
    sinGuardarSalir: 'बिना सहेजे बाहर निकलें',
    sinGuardarSeguir: 'संपादन जारी रखें',
    capturaAtajoOcupado:
      'शॉर्टकट {atajo} का उपयोग पहले से किसी अन्य प्रोग्राम द्वारा किया जा रहा है, इसलिए उसे नहीं बदला गया। स्क्रीन कैप्चर के लिए कोई ग्लोबल शॉर्टकट नहीं है: सेटिंग्स में कोई दूसरा चुनें।',
    capturaPermisoTitulo: 'स्क्रीन रिकॉर्डिंग की अनुमति',
    capturaPermisoTexto:
      'स्क्रीन कैप्चर करने के लिए macOS में WolfCore Dev को स्क्रीन रिकॉर्डिंग की अनुमति चाहिए। इसे सिस्टम सेटिंग्स (गोपनीयता और सुरक्षा) में खोलें, WolfCore Dev चालू करें और फिर से प्रयास करें। आप जो कुछ कैप्चर करते हैं, वह इस कंप्यूटर से बाहर नहीं जाता।',
    capturaAbrirPreferencias: 'सेटिंग्स खोलें',
    capturaNoDisponible: 'इस कंप्यूटर पर स्क्रीन कैप्चर उपलब्ध नहीं है।',
  },
  tr: {
    abrir: 'Aç',
    iniciarTodo: 'Tümünü başlat',
    detenerTodo: 'Tümünü durdur',
    salir: 'Çık',
    workspaces: 'Çalışma alanları',
    workspaceParcial: 'kısmi',
    preguntaApagar: 'Hizmetler durdurulsun mu?',
    siApagar: 'Evet, durdur',
    noApagar: 'Hayır, çalışır bırak',
    cancelar: 'İptal',
    cliTitulo: 'Terminal komutu (wolf)',
    cliTunelInternet:
      'Bir terminal komutu {dominio} sitesini {proveedor} ile internette yayınlamak istiyor. Bağlantıya sahip herkes görebilir.',
    cliTunelTailnet:
      'Bir terminal komutu {dominio} sitesini tailnet cihazlarınızla ({proveedor}) paylaşmak istiyor.',
    cliPublicoEn: 'Genel adres: https://{publico}',
    cliDatosReales:
      'DİKKAT: {dominio} GERÇEK VERİLER içeriyor. Devam etmek için aşağıdan tam alan adını seçin. Bunu siz istemediyseniz iptal edin.',
    cliPublicar: 'Yayınla',
    cliPhpGlobal:
      'Bir terminal komutu tüm terminallerin PHP sürümünü {version} olarak değiştirmek istiyor.',
    cliCambiar: 'Değiştir',
    carpetaDatosAislada: 'test veri klasörü; hosts, PATH ve sistem sertifikalarına dokunulmaz',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS geçerli bir veri klasörü değil: mutlak olmalı, sistem klasörü olmamalı ve gerçek (ve önceki) klasörden farklı olmalıdır. Uygulama hiçbir şeye dokunmadan kapanıyor.',
    sinGuardarTitulo: 'Kaydedilmemiş değişiklikler',
    sinGuardarTexto:
      'Kod düzenleyicide kaydedilmemiş değişiklikler var. Devam ederseniz kaybolurlar.',
    sinGuardarSalir: 'Kaydetmeden çık',
    sinGuardarSeguir: 'Düzenlemeye devam et',
    capturaAtajoOcupado:
      '{atajo} kısayolu zaten başka bir program tarafından kullanılıyor ve değiştirilmedi. Ekran yakalamanın genel bir kısayolu yok: Ayarlar’dan başka bir tane seçin.',
    capturaPermisoTitulo: 'Ekran kaydı izni',
    capturaPermisoTexto:
      'Ekranı yakalamak için macOS, WolfCore Dev’in ekran kaydı iznine sahip olmasını ister. İzni Sistem Ayarları’nda (Gizlilik ve Güvenlik) açın, WolfCore Dev’i etkinleştirin ve yeniden deneyin. Yakaladığınız hiçbir şey bu bilgisayardan çıkmaz.',
    capturaAbrirPreferencias: 'Ayarları aç',
    capturaNoDisponible: 'Ekran yakalama bu bilgisayarda kullanılamıyor.',
  },
  id: {
    abrir: 'Buka',
    iniciarTodo: 'Mulai semua',
    detenerTodo: 'Hentikan semua',
    salir: 'Keluar',
    workspaces: 'Workspace',
    workspaceParcial: 'sebagian',
    preguntaApagar: 'Hentikan semua layanan?',
    siApagar: 'Ya, hentikan',
    noApagar: 'Tidak, biarkan berjalan',
    cancelar: 'Batal',
    cliTitulo: 'Perintah terminal (wolf)',
    cliTunelInternet:
      'Sebuah perintah terminal ingin memublikasikan {dominio} ke internet menggunakan {proveedor}. Siapa pun yang memiliki tautan dapat melihatnya.',
    cliTunelTailnet:
      'Sebuah perintah terminal ingin membagikan {dominio} ke perangkat di tailnet Anda ({proveedor}).',
    cliPublicoEn: 'Alamat publik: https://{publico}',
    cliDatosReales:
      'PERHATIAN: {dominio} berisi DATA NYATA. Untuk melanjutkan, pilih domain persisnya di bawah ini. Jika Anda tidak meminta ini, batalkan.',
    cliPublicar: 'Publikasikan',
    cliPhpGlobal:
      'Sebuah perintah terminal ingin mengubah PHP di semua terminal ke versi {version}.',
    cliCambiar: 'Ubah',
    carpetaDatosAislada:
      'folder data uji coba, tanpa mengubah hosts, PATH, maupun sertifikat sistem',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS bukan folder data yang valid: harus berupa jalur absolut, bukan folder sistem, dan berbeda dari folder data asli (maupun sebelumnya). Aplikasi ditutup tanpa mengubah apa pun.',
    sinGuardarTitulo: 'Perubahan belum disimpan',
    sinGuardarTexto:
      'Editor kode memiliki perubahan yang belum disimpan. Jika Anda melanjutkan, perubahan itu akan hilang.',
    sinGuardarSalir: 'Keluar tanpa menyimpan',
    sinGuardarSeguir: 'Lanjutkan mengedit',
    capturaAtajoOcupado:
      'Pintasan {atajo} sudah dipakai program lain dan tidak diubah. Tangkapan layar tidak memiliki pintasan global: pilih pintasan lain di Pengaturan.',
    capturaPermisoTitulo: 'Izin perekaman layar',
    capturaPermisoTexto:
      'Untuk menangkap layar, macOS mengharuskan WolfCore Dev memiliki izin perekaman layar. Buka izin tersebut di Pengaturan Sistem (Privasi & Keamanan), aktifkan WolfCore Dev, lalu coba lagi. Tidak ada hasil tangkapan yang keluar dari komputer ini.',
    capturaAbrirPreferencias: 'Buka pengaturan',
    capturaNoDisponible: 'Tangkapan layar tidak tersedia di komputer ini.',
  },
  pl: {
    abrir: 'Otwórz',
    iniciarTodo: 'Uruchom wszystko',
    detenerTodo: 'Zatrzymaj wszystko',
    salir: 'Zakończ',
    workspaces: 'Przestrzenie robocze',
    workspaceParcial: 'częściowo',
    preguntaApagar: 'Czy zatrzymać usługi?',
    siApagar: 'Tak, zatrzymaj',
    noApagar: 'Nie, pozostaw uruchomione',
    cancelar: 'Anuluj',
    cliTitulo: 'Polecenie terminala (wolf)',
    cliTunelInternet:
      'Polecenie terminala chce opublikować {dominio} w internecie za pomocą {proveedor}. Każda osoba z linkiem będzie mogła uzyskać dostęp.',
    cliTunelTailnet:
      'Polecenie terminala chce udostępnić {dominio} urządzeniom w sieci tailnet ({proveedor}).',
    cliPublicoEn: 'Adres publiczny: https://{publico}',
    cliDatosReales:
      'UWAGA: {dominio} zawiera RZECZYWISTE DANE. Aby kontynuować, wybierz poniżej dokładną domenę. Jeśli to nie było zamierzone, anuluj.',
    cliPublicar: 'Opublikuj',
    cliPhpGlobal:
      'Polecenie terminala chce zmienić wersję PHP we wszystkich terminalach na {version}.',
    cliCambiar: 'Zmień',
    carpetaDatosAislada:
      'testowy folder danych — bez modyfikowania pliku hosts, PATH ani certyfikatów systemowych',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS nie jest prawidłowym folderem danych: ścieżka musi być bezwzględna, nie może być folderem systemowym i musi różnić się od rzeczywistego (oraz poprzedniego) folderu. Aplikacja zamknie się bez wprowadzania zmian.',
    sinGuardarTitulo: 'Niezapisane zmiany',
    sinGuardarTexto:
      'Edytor kodu zawiera niezapisane zmiany. Jeśli kontynuujesz, zostaną utracone.',
    sinGuardarSalir: 'Wyjdź bez zapisywania',
    sinGuardarSeguir: 'Kontynuuj edycję',
    capturaAtajoOcupado:
      'Skrót {atajo} jest już używany przez inny program i nie został zmieniony. Przechwytywanie ekranu nie ma globalnego skrótu: wybierz inny w Ustawieniach.',
    capturaPermisoTitulo: 'Uprawnienie do nagrywania ekranu',
    capturaPermisoTexto:
      'Aby przechwytywać ekran, macOS wymaga, aby WolfCore Dev miał uprawnienie do nagrywania ekranu. Otwórz je w Ustawieniach systemowych (Prywatność i ochrona), włącz WolfCore Dev i spróbuj ponownie. Nic z tego, co przechwycisz, nie opuszcza tego komputera.',
    capturaAbrirPreferencias: 'Otwórz ustawienia',
    capturaNoDisponible: 'Przechwytywanie ekranu nie jest dostępne na tym komputerze.',
  },
  nl: {
    abrir: 'Openen',
    iniciarTodo: 'Alles starten',
    detenerTodo: 'Alles stoppen',
    salir: 'Afsluiten',
    workspaces: 'Workspaces',
    workspaceParcial: 'gedeeltelijk',
    preguntaApagar: 'De diensten stoppen?',
    siApagar: 'Ja, stoppen',
    noApagar: 'Nee, actief laten',
    cancelar: 'Annuleren',
    cliTitulo: 'Terminalopdracht (wolf)',
    cliTunelInternet:
      'Een terminalopdracht wil {dominio} op internet publiceren met {proveedor}. Iedereen met de link kan dit bekijken.',
    cliTunelTailnet:
      'Een terminalopdracht wil {dominio} delen met de apparaten op uw tailnet ({proveedor}).',
    cliPublicoEn: 'Openbaar adres: https://{publico}',
    cliDatosReales:
      'LET OP: {dominio} bevat ECHTE GEGEVENS. Kies hieronder uw exacte domein om door te gaan. Als u dit niet heeft aangevraagd, annuleer dan.',
    cliPublicar: 'Publiceren',
    cliPhpGlobal:
      'Een terminalopdracht wil de PHP-versie voor alle terminals wijzigen naar versie {version}.',
    cliCambiar: 'Wijzigen',
    carpetaDatosAislada: 'testgegevensmap, zonder hosts, PATH of systeemcertificaten aan te raken',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS is geen geldige gegevensmap: deze moet absoluut zijn, geen systeemmap zijn en verschillen van de echte map (en de vorige). De app sluit af zonder iets te wijzigen.',
    sinGuardarTitulo: 'Niet-opgeslagen wijzigingen',
    sinGuardarTexto:
      'De code-editor heeft niet-opgeslagen wijzigingen. Als u doorgaat, gaan ze verloren.',
    sinGuardarSalir: 'Afsluiten zonder opslaan',
    sinGuardarSeguir: 'Verder bewerken',
    capturaAtajoOcupado:
      'De sneltoets {atajo} wordt al door een ander programma gebruikt en is met rust gelaten. Schermopname heeft geen globale sneltoets: kies een andere bij Instellingen.',
    capturaPermisoTitulo: 'Toestemming voor schermopname',
    capturaPermisoTexto:
      'Om het scherm vast te leggen vereist macOS dat WolfCore Dev toestemming voor schermopname heeft. Open die bij Systeeminstellingen (Privacy en beveiliging), schakel WolfCore Dev in en probeer het opnieuw. Niets van wat u vastlegt verlaat deze computer.',
    capturaAbrirPreferencias: 'Instellingen openen',
    capturaNoDisponible: 'Schermopname is niet beschikbaar op deze computer.',
  },
  uk: {
    abrir: 'Відкрити',
    iniciarTodo: 'Запустити все',
    detenerTodo: 'Зупинити все',
    salir: 'Вийти',
    workspaces: 'Робочі простори',
    workspaceParcial: 'частково',
    preguntaApagar: 'Зупинити служби?',
    siApagar: 'Так, зупинити',
    noApagar: 'Ні, залишити запущеними',
    cancelar: 'Скасувати',
    cliTitulo: 'Команда з термінала (wolf)',
    cliTunelInternet:
      'Команда з термінала хоче опублікувати {dominio} в інтернеті за допомогою {proveedor}. Будь-хто з посиланням зможе переглянути його.',
    cliTunelTailnet:
      'Команда з термінала хоче надати доступ до {dominio} для пристроїв вашої мережі tailnet ({proveedor}).',
    cliPublicoEn: 'Публічна адреса: https://{publico}',
    cliDatosReales:
      'УВАГА: {dominio} містить РЕАЛЬНІ ДАНІ. Щоб продовжити, оберіть нижче його точний домен. Якщо ви цього не запитували, скасуйте.',
    cliPublicar: 'Опублікувати',
    cliPhpGlobal: 'Команда з термінала хоче змінити PHP для всіх терміналів на версію {version}.',
    cliCambiar: 'Змінити',
    carpetaDatosAislada: 'тестова папка даних, без змін у hosts, PATH чи системних сертифікатах',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS не є дійсною папкою даних: шлях має бути абсолютним, не системним і відрізнятися від основної папки (та від попередньої). Програма закриється, нічого не змінюючи.',
    sinGuardarTitulo: 'Незбережені зміни',
    sinGuardarTexto: 'У редакторі коду є незбережені зміни. Якщо ви продовжите, їх буде втрачено.',
    sinGuardarSalir: 'Вийти без збереження',
    sinGuardarSeguir: 'Продовжити редагування',
    capturaAtajoOcupado:
      'Комбінацію клавіш {atajo} уже використовує інша програма, і її не було змінено. Для захоплення екрана немає глобальної комбінації: виберіть іншу в налаштуваннях.',
    capturaPermisoTitulo: 'Дозвіл на запис екрана',
    capturaPermisoTexto:
      'Щоб захоплювати екран, macOS вимагає, щоб WolfCore Dev мав дозвіл на запис екрана. Відкрийте його в «Системних налаштуваннях» (Конфіденційність і безпека), увімкніть WolfCore Dev і спробуйте ще раз. Ніщо із захопленого не залишає цей комп’ютер.',
    capturaAbrirPreferencias: 'Відкрити налаштування',
    capturaNoDisponible: 'Захоплення екрана недоступне на цьому комп’ютері.',
  },
} satisfies Record<IdiomaUi, Record<string, string>>;

export type TextosMain = (typeof TEXTOS)['es'];

/** es, en, pt y fr son completos y obligatorios: el compilador lo exige aquí. */
export const COMPLETOS: Record<'es' | 'en' | 'pt' | 'fr', TextosMain> = TEXTOS;

const completados = new Map<IdiomaUi, TextosMain>();

/**
 * Textos del proceso principal en el idioma pedido (español si es `null`). Los idiomas que no
 * son es, en, pt ni fr pueden dejar claves sin traducir: lo que falte sale en inglés.
 */
export function textosMain(idioma: IdiomaUi | null): TextosMain {
  const i = idioma ?? 'es';
  let t = completados.get(i);
  if (!t) {
    t = { ...TEXTOS.en, ...(TEXTOS[i] as Partial<TextosMain>) };
    completados.set(i, t);
  }
  return t;
}

/** Claves de `textosMain` que cada idioma no tiene propias (las que salen en inglés). */
export function clavesSinTraducirMain(idioma: IdiomaUi): string[] {
  const propio = TEXTOS[idioma] as Record<string, string>;
  return Object.keys(TEXTOS.es).filter((k) => !(k in propio));
}

/** Idioma de la interfaz para un locale del sistema (`es-CO` → `es`); inglés si no es de los cuatro. */
export function idiomaDeLocale(locale: string): IdiomaUi {
  const l = (locale || '').slice(0, 2).toLowerCase();
  return (IDIOMAS_UI as readonly string[]).includes(l) ? (l as IdiomaUi) : 'en';
}
