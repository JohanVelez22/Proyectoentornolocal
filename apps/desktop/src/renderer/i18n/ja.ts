/**
 * 日本語 UI テキスト (ja-JP)。es.ts と同じキー・関数シグネチャを維持します。
 * 固定用語集：サービス、インスタンス、サイト、トンネル、バックアップ、通知；Doctor と
 * WolfCore Dev は翻訳しません。です・ます調；Git 以外では「ブランチ」ではなく「バージョン」を使用。
 */
import type { Textos } from './es';

const plural = (n: number, texto: string): string => `${n}${texto}`;

export const ja: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP と Nginx をシンプルに',
    version: 'バージョン',
  },
  nav: {
    inicio: 'ホーム',
    proyectos: 'プロジェクト',
    agentes: 'エージェント',
    servicios: 'サービス',
    basesDeDatos: 'データベース',
    correo: 'メール',
    php: 'PHP',
    ia: 'AI',
    tuneles: 'トンネル',
    contenedores: 'コンテナ',
    herramientas: 'ツール',
    doctor: 'Doctor',
    depuracion: 'デバッグ',
    registros: 'ログ',
    ajustes: '設定',
    contraer: 'メニューを折りたたむ',
    expandir: 'メニューを展開する',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, '件のサービスが起動中'),
    tuneles: (n: number) => plural(n, '件のトンネルが有効'),
    cargando: 'コアに接続しています…',
    conErrores: 'エラーあり',
    sinConexion: 'コアに接続されていません',
  },
  estado: {
    encendido: '起動中',
    apagado: '停止中',
    iniciando: '起動しています…',
    error: 'エラー',
    externo: '外部',
    activo: '有効',
    aviso: '注意',
  },
  acciones: {
    encender: '起動',
    apagar: '停止',
    iniciarTodo: 'すべて起動',
    detenerTodo: 'すべて停止',
    abrir: '開く',
    copiar: 'コピー',
    copiado: 'クリップボードにコピーしました',
    guardar: '保存',
    cerrar: '閉じる',
    abrirCarpeta: 'フォルダーを開く',
    instalar: 'インストール',
    reintentar: '再試行',
    cancelar: 'キャンセル',
    borrar: '削除',
    editar: '編集',
    duplicar: '複製',
    renovar: '更新',
    masAcciones: 'その他の操作',
    actualizar: 'アップデート',
    quitar: '取り除く',
    reinstalar: '再インストール',
  },
  errores: {
    titulo: '操作を完了できませんでした',
    arranque: '環境の状態を読み取れませんでした',
    desconocido: '予期しないエラーが発生しました。',
    /** コアがエラー内のコードとして返す詳細情報。 */
    detalles: {
      'sintaxis.comillas_sin_cerrar': '引用符が閉じられていません',
      'sintaxis.tras_comillas': '引用符の後にスペースまたは「;」がありません',
      'sintaxis.punto_y_coma_inesperado': 'ディレクティブのない「;」があります',
      'sintaxis.llave_inesperada': 'ディレクティブのない「{」があります',
      'sintaxis.falta_punto_y_coma': 'ディレクティブの末尾に「;」がありません',
      'sintaxis.sobra_llave': '余分な「}」があります',
      'sintaxis.falta_llave': '「}」が不足しています',
    },
    codigos: {
      'git.cambios_locales':
        'フォルダー内に未保存の変更があります。変更を取り込む前にコミットするか破棄してください。ファイルは変更されていません。',
      'git.divergencia':
        'ブランチがリモートと分岐しています（ローカルとリモートに異なるコミットがあります）。手動で解決してください。ファイルは変更されていません。',
      'git.sin_upstream':
        '現在のブランチはどのリモートブランチも追跡していないため、変更を取り込めません。',
      'git.sin_rama': 'リポジトリが detached HEAD 状態（ブランチなし）のため、変更は行われていません。',
      'git.no_repositorio': 'このフォルダーは git リポジトリではありません。',
      'git.destino_no_vacio': '出力先フォルダーが空ではありません。',
      'git.destino_es_archivo': '出力先はフォルダーではなくファイルです。',
      'git.no_encontrado': 'git が見つかりません。先にインストールしてください。',
      'git.gh_no_encontrado': 'GitHub CLI (gh) が見つかりません。先にインストールしてください。',
      'git.plazo': 'クローンがタイムアウト（{minutos} 分）したためキャンセルされました。',
      'git.token_invalido': 'GitHub トークンが無効です。',
      'git.url_con_credenciales':
        'URL にユーザー名やパスワードを含めないでください。トークンを別途使用してください。',
      'servicios.desconocido': '不明なサービスです: {id}。',
      'servicios.no_instalado': '{nombre} はインストールされていません。「サービス」からインストールしてください。',
      'servicios.puerto_invalido': 'ポートは 1024 から 65535 の間の数値である必要があります。',
      'servicios.puerto_asignado': 'ポート {puerto} はすでに {otro} に割り当てられています。',
      'servicios.puerto_ocupado':
        'ポート {puerto} は {nombre}（PID {pid}）が使用しています。プロセスを終了するか別のポートを選択してください。',
      'servicios.confirmacion_borrado': '{nombre} のデータを削除するには "{id}" と入力してください。',
      'servicios.ftp_no_disponible': 'FTP サーバーは利用できません。',
      'sistema.sin_cliente_ftp':
        'この端末に関連付けられた FTP クライアントがありません。FileZilla などをインストールするか、アドレスをコピーしてください。',
      'servicios.mailpit_no_responde': 'Mailpit が応答しません。「サービス」から起動してください。',
      'servicios.iniciar_todo_fallos':
        '「すべて起動」で次のサービスを起動できませんでした: {nombres}。「サービス」とログを確認してください。',
      'servicios.respaldo_fallo':
        '{nombre} はアップデートされませんでした。事前バックアップに失敗したため、変更は行われていません。',
      'servicios.espacio_insuficiente':
        'データをコピーするための空き容量が不足しています（必要: {necesarios} MB、空き: {libres} MB）。',
      'servicios.actualizacion_revertida':
        'バージョン {version} が起動しなかったため、{nombre} を {anterior} に戻しました。バックアップは保持されています。',
      'servicios.restauracion_fallo':
        '新しいバージョンが起動せず、{nombre} のデータを復元できませんでした。サービスは起動されていません。変更されたデータは {fallida} に、バックアップは {respaldo} にあります。',
      'servicios.otra_rama':
        '{nombre} {version} は異なるメジャーバージョンです。新しいインスタンスとして作成してください。',
      'servicios.misma_version': '{id} はすでにバージョン {version} を使用しています。',
      'servicios.instancia_bloqueada':
        '{nombre} はロックされています。アップデート時にデータを復元できませんでした。変更されたデータは {fallida} に、バックアップは {respaldo} にあります。起動する前に「サービス」→「バージョン」で解決してください。',
      'servicios.datos_apartados':
        '{nombre} のフォルダーにデータがありませんが、アップデート時に退避されたデータが存在するため空のフォルダーは作成しません。「サービス」→「バージョン」を確認してください。',
      'servicios.puerto_reservado':
        'ポート {puerto} はシステムによって予約されています（{desde}–{hasta}）。別のポートを選択してください。',
      'servicios.borrado_con_bloqueo':
        '{nombre} にはアップデート後にロックされたインスタンスがあります。データを削除する前に解決してください。',
      'servicios.config_no_revertida':
        '{nombre} {version} が起動せず、設定を {anterior} に戻せませんでした。「サービス」→「バージョン」で {anterior} を再度選択してください。',
      'servicios.puerto_revertido_apagada':
        '{nombre} は新しいポートで起動しませんでした。{anterior} に戻しましたがそこでも起動しなかったため、ポート {anterior} のまま停止状態です。',
      'servicios.puerto_no_revertido':
        '{nombre} はポート {nuevo} で起動せず、設定を {anterior} に戻せませんでした。停止状態です。',
      'instancias.id_invalido': 'インスタンスの識別子が無効です。',
      'instancias.no_existe': 'インスタンス {id} は存在しません。',
      'instancias.existe': 'インスタンス {id} はすでに存在します。',
      'instancias.una_sola': '{nombre} はインスタンスを 1 つだけ作成できます。',
      'instancias.ultima': '{id} は唯一のインスタンスのため取り除けません。',
      'instancias.sin_puerto_libre': 'インスタンス用の空きポートが見つかりませんでした。',
      'instancias.confirmacion': '続行するには "{id}" と入力してください。',
      'instancias.sin_datos': '{id} のフォルダーにデータがありません。復元するバックアップを選択してください。',
      'instancias.respaldo_no_existe': '{id} の該当バックアップは存在しません。',
      'instancias.respaldo_en_uso':
        'このバックアップはロック中の {id} に必要です。先にロックを解決してください。',
      'instancias.version_requerida':
        '{id} をどのバージョンに戻すか判定できません。同じメジャーバージョンのインストール済みバージョンを選択してください。',
      'instalador.version_en_uso':
        '{servicio} {version} はインスタンス {instancia} が使用中のためアンインストールできません。',
      'limpieza.sin_confirmar': 'バージョン整理の確認が不足しています。',
      'limpieza.seleccion_invalida': '選択されたバージョンが無効です。',
      'limpieza.en_curso': 'バージョンの整理はすでに実行中です。',
      'limpieza.no_existe': '{servicio} {version} はすでにインストールされていません。',
      'limpieza.en_uso': '{servicio} {version} が使用中になったため取り除かれませんでした。',
      'limpieza.ruta_insegura':
        '{servicio} {version} のフォルダーが安全ではないため（リンクまたは bin 外のパス）、変更されませんでした。',
      'limpieza.version_bloqueada':
        '{servicio} {version} に使用中またはロックされたファイルがあるため、取り除きを中止しました。',
      'limpieza.otro_volumen':
        '{servicio} {version} は一時データフォルダーとは別のディスク上にあるため一括移動できず、変更されませんでした。',
      'limpieza.contenido_ajeno':
        '{servicio} {version} にはご自身でインストールしたパッケージ（npm、pip など）が含まれています。取り除くにはそれらが失われることに同意する必要があります。',
      'limpieza.destino_ocupado':
        'bin 内にすでに {servicio} {version} のフォルダーが存在するため上書きしません。復元する前にもう一方を取り除いてください。',
      'bd.encender_servicio': 'データベースを管理するには {nombre} を起動してください。',
      'bd.sin_credenciales': '{nombre} の保存済み認証情報がありません。',
      'bd.confirmacion_borrado': 'データベース {nombre} を削除するには、正確な名前を入力してください。',
      'bd.usuario_privilegiado':
        'ユーザー {usuario} は管理者またはシステムロールです。プロジェクト専用のユーザーを選択してください。',
      'bd.usuario_en_uso':
        '別のプロジェクトがすでにユーザー {usuario} を使用しています。接続が切れないようパスワードは変更せず、何も作成しませんでした。',
      'bd.rol_sin_login':
        'ユーザー {usuario} は存在しますがログインできません（LOGIN 権限のないロール、またはサーバーのアクセス規則）。変更は行われていません。',
      'bd.usuario_clave_distinta':
        'ユーザー {usuario} は別のパスワードで既に存在します。他のプロジェクトの接続を切らないためパスワードは変更しません。現在のパスワードを使用してください。',
      'bd.mongosh_faltante': 'mongosh が見つかりません。MongoDB を管理するには「サービス」からインストールしてください。',
      'tuneles.sitio_no_encontrado': 'プロジェクトが見つかりませんでした。',
      'tuneles.confirmacion_requerida':
        '{dominio} をインターネットに公開するには、WolfCore Dev での確認が必要です。',
      'tuneles.confirmacion_obsoleta':
        '確認後に {dominio} のトンネル設定が変更されました。もう一度確認してください。',
      'tuneles.cloudflared_no_instalado':
        'cloudflared はインストールされていません。「サービス」からインストールしてください。',
      'tuneles.proveedor_no_disponible': 'トンネルプロバイダー {proveedor} は利用できません。',
      'tuneles.cloudflare_sin_cuenta':
        '先にトンネルのオプションから Cloudflare アカウントを接続してください。',
      'tuneles.cloudflare_sin_credencial':
        'このトンネルには保存された認証情報がありません。トンネルのオプションから再作成してください。',
      'tuneles.cloudflare_datos_invalidos':
        'トンネル名（小文字、数字、ハイフン）または公開ドメインが無効です。',
      'tuneles.cloudflare_conexion_en_curso': 'Cloudflare への接続処理がすでに進行中です。',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare は {dominio} ではなく {registrado} を登録しました。このドメインは認可されたゾーンに属していません。Cloudflare の管理画面で該当レコードを削除してください。',
      'tuneles.cloudflare_conexiones_activas':
        'トンネル {nombre} にはアクティブな接続があります（削除には cloudflared で -f が必要です）。開いているすべての端末でトンネルを閉じて再試行するか、「ここでのみ忘れる」を使用してください。',
      'tuneles.nombre_en_uso': 'トンネル {nombre} はすでに別のサイトで使用されています。',
      'tuneles.dominio_en_uso': 'ドメイン {dominio} はすでに別のサイトで使用されています。',
      'tuneles.confirmacion_olvidar': 'トンネル {nombre} を忘れる、または再作成するには確認が必要です。',
      'tuneles.cloudflare_fallo': 'cloudflared が操作を完了できませんでした: {detalle}',
      'tuneles.credencial_no_protegida':
        '認証情報へのアクセスを現在のユーザーに制限できなかったため、使用されませんでした。',
      'tuneles.sin_cifrado':
        'システムの暗号化機能が利用できないため、認証情報を保存できません。',
      'tuneles.token_invalido':
        'トークンが無効です。英数字と _ . - のみ使用できます（8〜200 文字）。トンネルのオプションで再度保存してください。',
      'tuneles.ngrok_no_instalado':
        'この端末に ngrok がインストールされていません。ngrok.com からインストールして再試行してください。',
      'tuneles.ngrok_sin_token': 'ngrok のトークンがありません。トンネルのオプションで保存してください。',
      'tuneles.expose_sin_token': 'Expose のトークンがありません。トンネルのオプションで保存してください。',
      'tuneles.tailscale_no_instalado':
        'この端末に Tailscale がインストールされていません。WolfCore Dev ではインストールしないため、tailscale.com からインストールしてください。',
      'tuneles.tailscale_sin_sesion':
        'Tailscale にサインインしていません。Tailscale にサインインしてから再試行してください。',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale がすでに HTTPS ポート {puerto} で別の公開を行っています。WolfCore Dev は上書きしないため、Tailscale 側で解除してから再試行してください。',
      'lan.sitio_no_encontrado': 'サイトが見つかりませんでした。',
      'lan.confirmacion_requerida':
        '{dominio} をローカルネットワークで共有するには、WolfCore Dev での確認が必要です。',
      'lan.datos_reales':
        '{dominio} には実データが含まれているため、確認を行ってもローカルネットワークでは共有できません。顧客データを含まないコピーを使用してください。',
      'lan.sin_red':
        'ローカルネットワーク（Wi-Fi または Ethernet）に接続されていません。ネットワークに接続して再試行してください。',
      'lan.ip_no_valida':
        'アドレス {ip} は現在のローカルネットワークのものではなくなりました。ダイアログを開き直して再度確認してください。',
      'lan.requiere_https': '{dominio} は HTTPS にリダイレクトされます。HTTPS オプションで共有してください。',
      'lan.sin_puertos':
        'ローカルネットワーク用の 8100〜8199 の範囲に空きポートがありません（共有サイトと CA リンクがこの範囲を使用します）。サイトの共有を停止するか CA ダイアログを閉じて再試行してください。',
      'tuneles.expose_no_instalado':
        'Expose はインストールされていません。Windows では expose.phar のみ動作するため、{carpeta} に配置してください。',
      'tuneles.expose_datos_reales':
        '実データを含むサイトでは Expose を使用できません。リクエストインスペクターがローカルネットワーク全体に公開されるため、別のプロバイダーを使用してください。',
      'tuneles.confirmacion_requerida_tailnet':
        '{dominio} を tailnet で共有するには、WolfCore Dev での確認が必要です。',
      'tuneles.tailscale_estado_ilegible':
        'この端末で Tailscale がすでに公開している内容を読み取れなかったため、上書きを防ぐため何も開始しませんでした。Tailscale が起動しているか確認して再試行してください。',
      'tuneles.tailscale_no_habilitado':
        'お使いの tailnet で Serve または Funnel が有効になっていません。{enlace} から有効にして再試行してください。',
      'tuneles.ngrok_desactualizado':
        'お使いの ngrok は古いバージョンのため、WolfCore Dev に必要な機能に対応していません。アップデート（ngrok update）してから再試行してください。',
      'hosts.dominio_invalido': '無効なドメインが含まれています。',
      'hosts.tiempo_agotado':
        '管理者権限の許可が {segundos} 秒以内に得られなかったため、hosts ファイルは変更されませんでした。',
      'https.sin_dominio': '証明書には少なくとも 1 つのドメインが必要です。',
      'https.sin_autoridad':
        'WolfCore Dev の認証局（CA）が存在しません。証明書を発行する前に HTTPS セクションから CA をインストールしてください。',
      'herramientas.pid_invalido': 'PID が無効です。',
      'herramientas.pid_sistema': 'PID {pid} はシステムプロセスのため終了できません。',
      'herramientas.proceso_propio':
        'WolfCore Dev やそれを起動したプロセスは終了できません。',
      'herramientas.proceso_inexistente': 'プロセス {pid} はすでに存在しません。',
      'herramientas.sin_editor':
        'コードエディターが見つかりません。VS Code、Cursor、PhpStorm、Sublime Text などをインストールしてください。',
      'herramientas.editor_no_instalado':
        '{nombre} はインストールされていません。「設定」から別のエディターを選択してください。',
      'herramientas.editor_invalido': 'このエディターは無効です。',
      'herramientas.carpeta_sitio_inexistente': 'プロジェクトフォルダーが存在しません。',
      'herramientas.ruta_no_absoluta': 'パスは絶対パスである必要があります。',
      'herramientas.sin_seleccion': '少なくとも 1 つの項目を選択してください。',
      'herramientas.dominio_invalido': '無効なドメインまたは IP が含まれています。',
      'herramientas.demasiados_dominios':
        '1 つの証明書に含められるドメインまたは IP は最大 {maximo} 件です。',
      'buscar.consulta_invalida': '検索語を入力してください（最大 500 文字）。',
      'buscar.raiz_invalida': 'フォルダーまたはファイルが存在しないか無効です。',
      'buscar.regex_invalida': '正規表現が無効です。',
      'buscar.regex_lenta':
        '正規表現の処理に時間がかかりすぎています。簡略化するか通常のテキスト検索を使用してください。',
      'buscar.demasiadas': 'すでに {maximo} 件の検索が実行中です。いずれかをキャンセルするか完了をお待ちください。',
      'terminal.no_abrio': 'ターミナルを開けませんでした。',
      'terminal.no_instalada': '{nombre} はインストールされていません。「設定」から別のターミナルを選択してください。',
      'terminal.invalida': 'このターミナルは無効です。',
      'terminal.powershell_restringido':
        'この端末では PowerShell が制限付き言語モードになっています（組織ポリシーまたは AppLocker）。WolfCore Dev からターミナルを開けないため、プロジェクトフォルダーでご自身で開いてください。',
      'proyectos.no_existe': 'プロジェクトが存在しません。',
      'proyectos.no_confiado': 'レシピを実行するには「このリポジトリを信頼する」にチェックを入れてください。',
      'proyectos.receta_en_curso': 'このプロジェクトではすでにレシピが実行中です。',
      'proyectos.paso_no_omitible': '「サイトを作成」ステップはスキップできません。',
      'workspaces.no_existe': 'このワークスペースは存在しません。',
      'workspaces.invalido': 'ワークスペースが無効です。名前と項目を確認してください。',
      'workspaces.captadores_exclusivos':
        '2 つのメールキャッチャーを同時に起動することはできません。1 つだけ起動できます。',
      'workspaces.elemento_fallo':
        '{elemento} に対する操作を完了できませんでした。「サービス」とログを確認してください。',
      'workspaces.base_no_responde':
        'このプロジェクトのデータベースが応答しないため、{elemento} を起動できませんでした。',
      'tareas.cron_invalida':
        'cron 式が無効です。分・時・日・月・曜日の 5 フィールドで指定してください（例: 0 3 * * *）。',
      'tareas.comando_invalido':
        'このコマンドは許可されていません。インラインコード（-r、-e、-c）を使わずに、php、node、npm run、または python でプロジェクト内のファイルを実行してください。',
      'tareas.invalida': 'タスクが無効です。名前、スケジュール、コマンドを確認してください。',
      'tareas.no_existe': 'このタスクはすでに存在しません。',
      'tareas.sin_confirmar': 'タスクを実行するにはコマンドを確認してください。',
      'tareas.sitio_no_confiado':
        'タスクを実行するにはプロジェクトで「このリポジトリを信頼する」にチェックを入れてください。',
      'tareas.receta_cambio':
        '信頼した後にプロジェクトのレシピが変更されました。内容を確認し、「このリポジトリを信頼する」に再度チェックを入れてください。',
      'tareas.aislado':
        'テスト用データフォルダー（WOLFCORE_DATOS）を使用しています。実行するにはスケジュールタスクを許可してください。',
      'tareas.carpeta': 'プロジェクトフォルダーが存在しないため、タスクを実行できません。',
      'tareas.en_curso': 'タスクはすでに実行中です。',
      'tareas.demasiadas': 'このプロジェクトのタスクが多すぎます（最大 {maximo} 件）。',
      'cli.no_autorizado':
        'CLI コマンドが認証されていません。WolfCore Dev アプリを開いた状態で再実行してください。',
      'cli.orden_desconocida': 'WolfCore Dev はこの CLI コマンドを認識できません。',
      'cli.argumentos_invalidos': 'コマンドの引数が無効です。',
      'cli.solicitud_grande': 'リクエストが大きすぎます（最大 {maximo} バイト）。',
      'cli.formato_no_admitido': 'リクエストの形式が CLI でサポートされていません。',
      'cli.plazo':
        'コマンドがタイムアウトしましたが、まだ実行中の可能性があります。WolfCore Dev で状態を確認してください。',
      'cli.ocupado':
        'WolfCore Dev が多数の CLI コマンドを処理中です。しばらくお待ちください。',
      'cli.requiere_confirmacion':
        'このコマンドは公開または変更を行うため、{sitio} での確認（--si）が必要です。',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} には実データが含まれています。コマンドの実データ用オプション（サイトのドメイン）でも確認してください。',
      'cli.requiere_confirmacion_global':
        'すべてのターミナルの PHP を変更するには確認（--si）が必要です。',
      'cli.confirmacion_rechazada':
        'WolfCore Dev ウィンドウでの確認が拒否されたか利用できなかったため、何も実行されませんでした。',
      'cli.confirmacion_vencida':
        'WolfCore Dev ウィンドウで時間内に確認されなかったため、何も実行されませんでした。',
      'cli.tunel_fallo': 'トンネルを開けませんでした。WolfCore Dev でログを確認してください。',
      'cli.inicio_fallo':
        '要求されたすべてを起動できませんでした。WolfCore Dev でログを確認してください。',
      'cli.parada_fallo':
        '要求されたすべてを停止できませんでした。WolfCore Dev でログを確認してください。',
      'cli.interno': 'CLI サーバーで内部エラーが発生しました。',
      'cli.proveedor_distinto':
        'このサイトは別のトンネルプロバイダー（{proveedor}）を使用しています。確認してから再度実行してください。',
      'cli.sitio_no_encontrado': 'サイト {sitio} は存在しません。',
      'cli.carpeta_invalida':
        'フォルダーが存在しないか、システムフォルダーまたは WolfCore Dev のデータフォルダーです。',
      'cli.carpeta_sin_sitio':
        'このフォルダーはどの WolfCore Dev サイトにも属していません。先にリンクしてください。',
      'cli.ya_vinculada': 'このフォルダーはすでにサイト {sitio} として登録されています。',
      'cli.tipo_no_soportado':
        '{tipo} タイプのプロジェクトは WolfCore Dev の画面から作成してください。',
      'cli.sitio_sin_php': 'サイト {sitio} は PHP を使用していません。',
      'cli.version_no_instalada':
        '{servicio} {version} はインストールされていません。「サービス」からインストールしてください。',
      'cli.fuente_no_existe': 'このログはまだ存在しません。',
      'cli.token_no_protegido':
        'トークンファイルへのアクセスを現在のユーザーに制限できなかったため、CLI は有効化されません。',
      'cli.carpeta_ajena':
        'データフォルダー内の run/ フォルダーが別ユーザーの所有のため、CLI は有効化されません。',
      'cli.ruta_invalida': 'WolfCore Dev のパスに wolf.cmd が対応していない文字が含まれています。',
      'cli.path_aislado':
        'テスト用データフォルダー（WOLFCORE_DATOS）を使用している場合、ユーザーの PATH は変更されません。',
      'cli.sin_cliente': 'このバージョンの WolfCore Dev には wolf クライアントが含まれていません（未ビルド）。',
      'cli.demasiados_dialogos':
        '直近 1 分間の確認回数が多すぎます。しばらく待ってから再試行してください。',
      'cli.error': 'コマンドを完了できませんでした: {detalle}',
      'proyectos.carpeta_no_vacia':
        'プロジェクトフォルダーにすでにファイルがあります。別のフォルダーを選ぶか空にしてください。',
      'secretos.sin_cifrado':
        'システムの暗号化機能が利用できないため、専用ユーザーのパスワードを保存できません。変更は行われていません。',
      'proyectos.clave_bd_falta':
        'ユーザー {usuario} の保存済みパスワードがないため何も書き込まれませんでした。.env マネージャーの「専用ユーザーを使用」で新しいパスワードを生成できます。',
      'env.archivo_grande': '環境変数ファイルが大きすぎます（最大 {maximo}）。',
      'env.no_regular': '.env ファイルは通常ファイルではないため、読み取り・変更を行いません。',
      'env.clave_inexistente': '変数 {clave} は存在しません。',
      'env.cambio_invalido': '.env の変更内容が無効です。',
      'env.variable_invalida': '変数 {clave} の変更内容が無効です。',
      'env.solo_lectura': '変数 {clave} は複数行にわたるため、ファイルを手動で編集してください。',
      'env.usuario_compartido':
        'データベース {base} はプロジェクト {proyecto} でも使用されています。ユーザーを共有してよいか確認してください。',
      'env.cambio_externo':
        'プレビュー表示後に .env が変更されました。保存する前に内容を再度確認してください。',
      'env.sin_confirmar': '.env の変更を保存することを確認してください。',
      'env.versionado':
        'このプロジェクトの .env はすでに Git で追跡されています。次回のコミットで値が送信されるため、別途確認してから続行してください。',
      'env.versionado_desconocido':
        'このプロジェクトの .env が git で追跡されているか確認できませんでした。別途確認してから続行してください。',
      'env.copia_invalida': '.env のバックアップが無効か、すでに存在しません。',
      'env.sin_base': 'このプロジェクトの .env にはデータベース接続設定がありません。',
      'env.base_no_resuelta':
        'このプロジェクトのデータベースは WolfCore Dev のローカルサーバーではないため、変更は行われていません。',
      'env.motor_no_soportado': '現在「専用ユーザーを使用」は MySQL と MariaDB に対応しています。',
      'env.ya_usa_usuario_propio': 'このプロジェクトはすでに専用ユーザーを使用しています。',
      'plantillas.id_invalido': 'テンプレートの識別子が無効です。',
      'plantillas.no_existe': 'テンプレートが存在しません。',
      'plantillas.danada':
        'テンプレートが破損または改変されているため使用できません。削除して再度保存してください。',
      'plantillas.demasiado_grande':
        'プロジェクトのファイル数またはサイズが大きすぎるためテンプレートとして保存できません（最大 {maximo} ファイル）。大きなフォルダーを除外してください。',
      'plantillas.demasiado_pesada':
        'プロジェクトのサイズが大きすぎるためテンプレートとして保存できません（最大 {maximo}）。大きなフォルダーを除外してください。',
      'plantillas.exclusion_invalida':
        '除外指定のいずれかが無効です（「..」を含まない名前または相対パスを使用してください）。',
      'plantillas.nombre_invalido':
        'テンプレート名が無効です（1〜60 文字で入力してください）。',
      'plantillas.esquema_fallo':
        'プロジェクトのデータベーススキーマを読み取れませんでした。該当サービスが起動しているか確認してください。',
      'plantillas.base_no_resuelta':
        'テンプレートを保存できません。データベースサーバーがリモートであるか、そのポートを使用するローカルサービスがありません。',
      'plantillas.sin_generador_base':
        'このプロジェクトタイプにはベースジェネレーターがないため、テンプレートにプロジェクトファイルを含める必要があります。',
      'plantillas.exclusiones_nuevas':
        'テンプレートに現在除外対象となっているファイル（{archivo}）が含まれています。プロジェクトから再保存するか削除してください。',
      'plantillas.motor_distinto':
        'テンプレートのスキーマは MySQL 用で選択したサーバーは MariaDB（またはその逆）のため、差異が生じる可能性があります。続行してよいか確認してください。',
      'bd.sql_no_permitido':
        'スキーマに構造定義以外のステートメントが含まれていたため、何も実行されませんでした: {sentencia}',
      'bd.extension_no_permitida':
        'スキーマが許可リストにない拡張機能 {nombre} を要求しているため、何も復元されませんでした。',
      'bd.esquema_fallo': 'スキーマ全体を復元できなかったため、中途半端な状態を残さず中止しました。',
      'bd.datos_no_permitidos':
        'データダンプにデータ以外の内容が含まれています（INSERT、LOCK TABLES、SET のみ許可されます）。何もインポートされませんでした。',
      'bd.datos_fallo':
        'データをインポートできませんでした。データベースは元の状態のまま変更されていません。',
      'perfiles.destino_invalido':
        'プロファイルの保存先を選択してください（.wolfperfil ファイル）。',
      'perfiles.frase_debil': 'CA のパスフレーズは {minimo} 文字以上にしてください。',
      'perfiles.frase_incorrecta': 'パスフレーズが正しくありません。何もインポートされませんでした。',
      'perfiles.certificados_sin_ca':
        'サイトの証明書は暗号化された CA と一緒にのみ移行できます。パスフレーズを設定して CA を含めてください。',
      'perfiles.no_existe': 'プロファイルファイルが存在しません。',
      'perfiles.danado':
        'プロファイルが破損しているか改ざんされています。何もインポートされませんでした。',
      'perfiles.demasiado_grande': 'プロファイルのサイズが大きすぎます（最大 {maximo}）。',
      'perfiles.version_no_soportada':
        'このプロファイルは新しいバージョンの WolfCore Dev（形式 {version}）で作成されています。インポートするにはアプリを更新してください。',
      'perfiles.sin_confirmar': 'プロファイルをインポートすることを確認してください。',
      'perfiles.vista_previa_vieja':
        'プレビュー後にデータフォルダーまたはプロファイルが変更されました。もう一度プレビューを確認してください。',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS は有効なデータフォルダーではありません。絶対パスであり、システムフォルダーではなく、実際のフォルダーとは別の場所を指定してください。',
      'perfiles.confirmar_reemplazar_ca':
        'プロファイルには CA が含まれており、この PC にはすでに独自の CA があります。フィンガープリントを比較し、置き換えてよいか別途確認してください（ご自身の CA の場合のみ）。',
      'herramientas.imagen_tipo':
        'このファイルは対応している画像形式（PNG、JPG、WebP、GIF、BMP、ICO）ではないか、内容が形式と一致しません。',
      'herramientas.imagen_grande': '画像のサイズが大きすぎます（最大 {maximo}）。',
      'herramientas.imagen_dimensiones':
        '画像の解像度が大きすぎるため（{ancho}×{alto} px、1辺あたり最大 {maximo} px）、安全のため開きません。',
      'herramientas.zip_sin_archivos':
        '圧縮するファイルがありません（シンボリックリンクは追跡されません）。',
      'herramientas.zip_demasiados': '圧縮するファイルが多すぎます（最大 {maximo} 件）。',
      'herramientas.zip_grande': '圧縮対象の合計サイズが大きすぎます（最大 {maximo}）。',
      'herramientas.pdf_invalido': 'このファイルは最適化できる PDF ではありません。',
      'herramientas.pdf_grande': 'PDF のサイズが大きすぎます（最大 {maximo}）。',
      'herramientas.pdf_cifrado': 'PDF はパスワードで保護されているため最適化できません。',
      'herramientas.pdf_plazo': 'PDF の処理が {segundos} 秒を超えたためキャンセルされました。',
      'herramientas.salida_ocupada': '新しいファイルに使用できる空きファイル名が見つかりませんでした。',
      'conversor.formato': 'その変換は利用できません。',
      'conversor.archivo_invalido':
        'ファイルが破損しているか、拡張子が示す形式ではありません。',
      'conversor.archivo_grande': 'ファイルのサイズが大きすぎます（最大 {maximo}）。',
      'conversor.archivo_peligroso':
        'ZIP 爆弾または細工されたファイル（過剰なコンテンツ、XML エンティティ、不正な名前など）の可能性があるため、安全のため開きません。',
      'conversor.limite_filas': '表の行数が多すぎます（最大 {maximo} 行）。',
      'conversor.limite_columnas': '表の列数が多すぎます（最大 {maximo} 列）。',
      'conversor.limite_paginas': 'PDF のページ数が多すぎます（最大 {maximo} ページ）。',
      'conversor.pdf_cifrado': 'PDF はパスワードで保護されているため変換できません。',
      'conversor.plazo': '変換が {segundos} 秒を超えたためキャンセルされました。',
      'conversor.cancelado': '変換がキャンセルされました。',
      'conversor.libreoffice_ausente':
        'この変換には LibreOffice が必要ですが、この PC にインストールされていません（WolfCore Dev は LibreOffice をインストールしません）。',
      'conversor.libreoffice_fallo': 'LibreOffice でドキュメントを変換できませんでした。',
      'conversor.limite_celdas': '表のセル数が多すぎます（最大 {maximo} セル）。',
      'conversor.memoria':
        'ファイルの処理にメモリが必要すぎるため（{maximo} 超）、キャンセルされました。',
      'conversor.pdf_no_disponible': '現在、PDF への印刷は利用できません。',
      'herramientas.imagen_pixeles':
        '画像の総ピクセル数が多すぎるため（{ancho}×{alto} px、最大 {maximo}）、安全のため開きません。',
      'herramientas.zip_cambio': '圧縮中にファイルが変更されました。もう一度お試しください。',
      'herramientas.pdf_demasiado_complejo':
        'PDF が複雑すぎるため（許容メモリ量を超過）、キャンセルされました。',
      'herramientas.salida_denegada':
        'その場所には書き込めません。アクセス権またはフォルダーの存在を確認してください。',
      'herramientas.fuera_de_la_ca':
        'WolfCore Dev の CA は .test ドメイン、localhost、ローカルアドレスのみに署名します。{dominio} は含められません。',
      'perfiles.frase_requerida':
        'データベースまたは CA をインポートするにはプロファイルのパスフレーズを入力してください（またはデータベースなしでインポートしてください）。',
      'perfiles.sin_espacio':
        'プロファイルをインポートするための空き容量が不足しています（必要: {necesarios}、空き: {libres}）。',
      'perfiles.ca_sin_restricciones':
        'この CA はあらゆる Web サイトに署名できます。ご自身の CA の場合のみフィンガープリントを比較したうえでインポートしてください。続行するには別途確認が必要です。',
      'perfiles.ca_restricciones_ajenas':
        'プロファイルの CA には WolfCore Dev のものではない名前制約が設定されているため、インポートしません。',
      'perfiles.instantanea_fallo':
        '環境の事前バックアップを保存できなかったため、何も変更していません。ディスクの空き容量とデータフォルダーのアクセス権を確認してください。',
      'perfiles.en_curso': 'すでにプロファイルのインポートが進行中です。完了までお待ちください。',
      'importar.origen_apagado':
        '移行元アプリのデータベースサーバーに接続できませんでした。移行元アプリから起動してもう一度お試しください。サイト自体はインポートされました。',
      'importar.origen_no_local': '移行元サーバーはこの PC 上（127.0.0.1）にある必要があります。',
      'importar.origen_rechazado': '移行元サーバーによりユーザー名またはパスワードが拒否されました。',
      'importar.origen_version':
        '移行元サーバーのバージョンは、WolfCore Dev にインストールされている環境ではインポートできません。',
      'importar.volcado_enorme':
        'データベースのデータが {maximo} MB を超えているため、一度にインポートできません。',
      'importar.motor_no_soportado':
        '他のアプリからインポートできるデータベースは MySQL と MariaDB のみです。',
      'importar.ruta_fuera':
        'インストール先外部またはシステムフォルダーを指すフォルダーやファイルは除外されました。',
      'importar.carpeta_invalida': '存在しないかフォルダーではないパスは除外されました。',
      'importar.archivo_grande':
        '設定ファイルが {maximo} KB を超えているため読み込まれませんでした。',
      'importar.archivo_ilegible': '設定ファイルがテキストではないか、読み込めませんでした。',
      'importar.demasiados':
        'サイトまたは設定ファイルが多すぎるため、先頭の一部のみ読み込みました。',
      'importar.candidato_desconocido':
        'そのサイトは移行元アプリに見つからなくなりました。再検索してください。',
      'importar.ya_vinculado': 'そのフォルダーはすでに WolfCore Dev のサイトとして登録されています。',
      'importar.dominio_existe':
        'ドメイン {dominio} のサイトはすでに存在します。インポート前に変更してください。',
      'importar.sin_php':
        'このサイトには PHP が必要ですが、どのバージョンもインストールされていません。サービスからインストールしてください。',
      'importar.base_existe':
        'データベース {nombre} は移行先にすでに存在するため変更していません。インポートするには上書きを確認してください（事前にバックアップを作成します）。',
      'importar.base_fallo':
        'データベース {nombre} をインポートできませんでした。元の状態のまま変更されていません。',
      'importar.sitio_fallo': 'サイトを作成できませんでした。',
      'importar.origen_invalido':
        '移行元サーバーの情報（ユーザー名、パスワード、またはポート）が無効です。',
      'importar.sin_seleccion': 'インポートするサイトを1つ以上選択してください。',
      'importar.en_curso': 'すでにインポートが進行中です。完了までお待ちください。',
      'importar.cancelado': 'インポートがキャンセルされました。処理中だった内容は元のままです。',
      'importar.origen_estancado':
        'ダンプ中に移行元アプリのサーバーが応答しなくなったため、データベースはインポートされませんでした。',
      'importar.sin_espacio':
        'データベースをインポートするための空き容量が不足しています（約 {necesarios} MB 必要、空き {libres} MB）。',
      'importar.origen_fallo': '移行元アプリのデータベースをダンプできませんでした。',
      'importar.clave_no_ascii':
        'パスワードにダンプへ渡せないアクセント記号や記号が含まれています。ASCII 文字のみのパスワードを使用してください。',
      'plantillas.sin_esquema': 'このテンプレートにはデータベーススキーマが含まれていません。',
      'proyectos.carpeta_invalida': 'プロジェクトのフォルダーが無効です。',
      'proyectos.nombre_invalido':
        'プロジェクト名には小文字、数字、ハイフンのみ使用できます（最大 40 文字）。',
      'proyectos.argumento_invalido': 'プロジェクトの入力値が無効です（項目: {campo}）。',
      'proyectos.base_existe': 'データベース {nombre} はすでに存在します。別の名前を選んでください。',
      'proyectos.dominio_existe': 'ドメイン {dominio} のサイトはすでに存在します。',
      'proyectos.carpeta_de_otro_sitio':
        'そのフォルダーはプロジェクト {dominio} のフォルダーであるか、その内部にあります。別のフォルダーを選んでください。',
      'proyectos.sin_python': 'Python がインストールされていません。サービスからインストールしてください。',
      'proyectos.venv_ajeno':
        'プロジェクトに独自の .venv が含まれています。WolfCore Dev は外部リポジトリの Python を実行しません。削除してから環境を作り直してください。',
      'proyectos.paso_base_no_omitible':
        '新規プロジェクトの「データベースを作成」ステップは省略できません。',
      'proyectos.sin_php': 'PHP がインストールされていません。サービスからインストールしてください。',
      'proyectos.php_no_instalado':
        'PHP {version} はインストールされていません。サービスからインストールしてください。',
      'proyectos.python_no_instalado':
        'Python {version} はインストールされていません。サービスからインストールしてください。',
      'mcp.token_invalido': 'MCP サーバーのトークンが無効です。',
      'mcp.solicitud_cancelada':
        'MCP クライアントがリクエストをキャンセルしたため、操作は実行されませんでした。',
      'doctor.puerto_ocupado':
        '{servicio} のポート {puerto} は別のプログラム（{proceso}）が使用しています。',
      'doctor.puerto_iis': 'IIS（{programa}）が {servicio} のポート {puerto} を使用しています。',
      'doctor.puerto_http_sys':
        'Windows のサービス（{programa}）が {servicio} のポート {puerto} を使用しています。',
      'doctor.puerto_flyenv':
        '{programa} が {servicio} のポート {puerto} を使用しています。終了するか、WolfCore Dev のポートを変更してください。',
      'doctor.puerto_xampp': '{programa} が {servicio} のポート {puerto} を使用しています。',
      'doctor.puerto_skype': '{programa} が {servicio} のポート {puerto} を使用しています。',
      'doctor.puerto_reservado':
        '{servicio} のポート {puerto} は Windows の予約範囲（{desde}-{hasta}: Hyper-V、WSL、または Docker）に含まれています。',
      'doctor.ca_por_vencer': 'WolfCore Dev の認証局の有効期限まであと {dias} 日です。',
      'doctor.ca_vencida': 'WolfCore Dev の認証局の有効期限が切れています。',
      'doctor.certificado_por_vencer': '{dominio} の証明書の有効期限まであと {dias} 日です。',
      'doctor.certificado_vencido': '{dominio} の証明書の有効期限が切れています。',
      'doctor.hosts_ilegible': 'hosts ファイルを読み込めませんでした。',
      'doctor.hosts_utf16':
        'hosts ファイルが UTF-16 で保存されているため、Windows がエントリを読み取れない可能性があります。',
      'doctor.hosts_bloque_duplicado':
        'hosts ファイルに WolfCore Dev のブロックが {bloques} 件あります。1 件のみにしてください。',
      'doctor.hosts_bloque_sin_cierre':
        'hosts ファイル内の WolfCore Dev ブロックに終了マーカーがありません。',
      'doctor.hosts_dominios_faltantes':
        'サイトのドメイン {cantidad} 件が hosts ファイルに登録されていません。',
      'doctor.hosts_solo_lectura':
        'hosts ファイルが読み取り専用になっています（ウイルス対策ソフトによる設定が一般的です）。WolfCore Dev は管理者権限があれば書き込み可能です。',
      'doctor.path_duplicados':
        'ユーザーの PATH に WolfCore Dev の重複エントリが {cantidad} 件あります。',
      'doctor.path_ajeno_delante':
        'PATH で {programa} を含む別のフォルダー（{origen}）が WolfCore Dev より前にあるため、ターミナルではそちらが使用されます。',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) が見つかりません。これがないと PHP やその他のサービスを起動できません。',
      'doctor.enlazador_msvc_ausente':
        'Rust はインストールされていますが、Visual Studio Build Tools の C++ ツール（MSVC リンカー）が不足しているため、cargo でプログラムをリンクできません。',
      'doctor.antivirus_sin_exclusion':
        'ウイルス対策ソフトが WolfCore Dev のデータフォルダーをスキャンしているため、PHP やサービスの起動が遅くなることがあります。',
      'doctor.firewall_reglas':
        'Windows ファイアウォールで WolfCore Dev のプログラム（Nginx、PHP、データベース）に対する受信ルール {cantidad} 件がプロファイル {perfiles} で許可されており、ネットワークに公開されています。',
      'doctor.firewall_no_comprobado':
        'Windows ファイアウォールを確認できませんでした（管理者権限が必要な場合があります）。',
      'doctor.firewall_reglas_ajenas':
        '他のプログラム（FlyEnv、Laragon、XAMPP など）の Nginx、PHP、データベースに関する受信ルールがプロファイル {perfiles} に {cantidad} 件あります。WolfCore Dev のものではないため表示のみ行い、ここからは削除しません。',
      'doctor.servicio_en_error': '{servicio} でエラーが発生しています。',
      'doctor.revision_fallida': 'チェック {revision} を完了できませんでした。',
      'doctor.confirmacion_requerida': '修復を適用する前に確認してください。',
      'doctor.hallazgo_desconocido': 'その検出項目はすでに存在しません。もう一度チェックしてください。',
      'doctor.solo_informa': 'この検出項目には自動修復がありません。案内に従って対応してください。',
      'doctor.reparacion_fallida': '修復を適用できませんでした。',
      'doctor.reparacion_cancelada': '管理者権限がキャンセルされたため、何も変更していません。',
      'doctor.reparacion_denegada':
        'Windows またはウイルス対策ソフトによりアクセスが拒否されたため、何も変更していません。',
      'doctor.ya_resuelto': '問題はすでに解消されていたため、変更は不要でした。',
      'doctor.ca_vieja_sin_quitar':
        '新しい認証局は使用可能ですが、古い認証局を Windows のストアから削除できませんでした。HTTPS セクションから削除できます。',
      'doctor.sin_puerto_libre': 'サービスを移動できる空きポートが見つかりませんでした。',
      'doctor.ca_vuelta_atras_incompleta':
        '新しい認証局を適用できず、ロールバックも完了しませんでした。HTTPS セクションを確認してください。日付付きのバックアップが etc/respaldos にあります。',
      'doctor.firefox_sin_confianza':
        'Firefox の {cantidad} 件のプロファイルで WolfCore Dev の認証局が信頼されていません（独自の証明書ストアを使用しています）。',
      'confianza.sin_ca': '認証局がまだありません。HTTPS から作成してください。',
      'confianza.sin_raices':
        'Python 用の信頼されたルート証明書（certifi および Windows のストア）が見つからなかったため、何も変更していません。',
      'confianza.node_variable_ajena':
        'すでに独自の NODE_EXTRA_CA_CERTS が設定されているため、WolfCore Dev は上書きしません。',
      'confianza.variable_fallida': 'ユーザー環境変数を変更できませんでした。',
      'firefox.abierto': 'Firefox が起動しています。閉じてからもう一度お試しください。',
      'firefox.error': 'そのプロファイルの user.js を変更できませんでした。元の状態のままです。',
      'firefox.fuera':
        'Firefox フォルダー外にプロファイルがあります。「CA の信頼設定」から別途確認のうえ有効にしてください。',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS が手動で変更され、WolfCore Dev の認証局を指していないため削除しませんでした。',
      'ia.clave_invalida': 'プロバイダーにより API キーが拒否されました。確認するか新しく生成してください。',
      'ia.sin_saldo': 'プロバイダーのアカウントに残高または利用枠がありません。',
      'ia.limite': 'プロバイダーによりリクエストが制限されました。少し待ってからもう一度お試しください。',
      'ia.region': 'お使いの国または地域ではこのプロバイダーのサービスを利用できません。',
      'ia.sin_red': 'プロバイダーに接続できませんでした。ネットワークまたはベース URL を確認してください。',
      'ia.url_invalida':
        'ベース URL が無効です。https://（または 127.0.0.1 / [::1] のみ http://）を使用し、ユーザー名やパスワードを含めないでください。',
      'ia.plazo': 'プロバイダーから {segundos} 秒以内に応答がありませんでした。',
      'ia.respuesta_rara': 'プロバイダーから予期しない応答が返されました。',
      'ia.cancelado': 'プロバイダーへのリクエストがキャンセルされました。',
      'ia.sin_clave': 'このプロバイダーには API キーが必要です。先に保存してください。',
      'ia.clave_mal_formada': 'API キーの形式が無効です（スペースや改行を含めないでください）。',
      'ia.modelo_invalido': 'モデル名が無効です。',
      'ia.modelo_no_disponible': 'モデルが存在しないか、アカウントにアクセス権がありません。',
      'ia.proveedor_invalido': 'プロバイダーの設定が無効です。',
      'ia.env_conflicto':
        '.env にすでに {claves} が別の値で定義されています。上書きするか確認してください。',
      'ia.env_sin_confirmar':
        'キーを .env に書き込むことを確認してください（平文で保存されます）。',
      'ia.env_versionado':
        'このプロジェクトの .env はすでに Git で追跡されています。.gitignore に含まれていても次のコミットでキーが送信されます。git rm --cached .env でインデックスから除外してください。',
      'ia.env_versionado_desconocido':
        'このプロジェクトの .env が Git で追跡されているか確認できませんでした。キーを書き込むことを別途確認してください。',
      'ia.proveedor_no_existe': 'この AI プロバイダーはすでに存在しません。',
      'ia.url_cambia_con_clave':
        'プロバイダーには保存済みのキーがあります。新しい URL へ送信してよいか確認してください。',
      'ia.mensaje_sin_confirmar':
        'テストメッセージの送信を確認してください（アカウントのトークンを消費します）。',
      'ia.clave_ilegible':
        '保存済みのプロバイダーキーを読み込めませんでした。削除してから保存し直してください。',
      'ia.argumento_invalido': '無効な値です（{campo}）。',
      'correo.auth': 'プロバイダーによりユーザー名またはパスワードが拒否されました。',
      'correo.conexion': 'SMTP サーバーに接続できませんでした。ホストとポートを確認してください。',
      'correo.tls':
        'サーバーとの有効な暗号化接続（証明書、ホスト名、または STARTTLS）を確立できませんでした。何も送信されていません。',
      'correo.rechazado':
        'サーバーによりメッセージまたはアドレスが拒否されました。送信元を確認してください。多くのプロバイダーは認証済みの送信元またはドメインのみ受け付けます。',
      'correo.plazo': 'サーバーが時間内（20 秒）に応答しませんでした。',
      'correo.host_invalido':
        'SMTP サーバーには、スキーム・ポート・パスを含まないホスト名または IP を指定してください。',
      'correo.host_local':
        'このサーバーはこの PC またはローカルネットワークを指しています。使用する場合は確認してください。',
      'correo.destinatario_invalido': '宛先メールアドレスが無効です。',
      'correo.proveedor_invalido': 'プロバイダーの情報が無効です。',
      'correo.proveedor_no_existe': 'このメールプロバイダーはすでに存在しません。',
      'correo.sin_clave': 'プロバイダーにパスワードが保存されていません。',
      'correo.clave_ilegible':
        '保存済みのプロバイダーキーを読み込めませんでした。削除してから保存し直してください。',
      'correo.cambia_con_clave':
        'プロバイダーには保存済みのキーがあります。新しいサーバーへ送信してよいか確認してください。',
      'correo.env_sin_confirmar': 'メール設定の環境変数を .env に書き込むことを確認してください。',
      'correo.ocupado': 'すでにテスト送信が進行中です。',
      'correo.limite': '次のテスト送信まで {segundos} 秒お待ちください。',
      'correo.clave_mal_formada':
        'キーの形式が無効です。改行を含まない印字可能文字のみで、4096 文字以内にしてください。',
      'correo.argumento_invalido': '無効な値です（{campo}）。',
      'agentes.no_existe': 'そのエージェントはサポートされていません。',
      'agentes.sin_confirmar': '続行する前にダイアログで操作を確認してください。',
      'agentes.no_instalable':
        'このエージェントは WolfCore Dev からはインストールできません。公式ガイド（{guia}）に従ってください。',
      'agentes.sin_node': 'エージェントをインストールするには、サービスから Node をインストールしてください。',
      'agentes.node_antiguo':
        '{agente} には Node {requerida} 以上が必要ですが、現在使用されるのは {actual} です。サービスから新しい Node をインストールしてください。',
      'agentes.node_version_desconocida':
        'Node のバージョンを確認できませんでした。{agente} には Node {requerida} 以上が必要です。サービスで Node を確認してください。',
      'instalador.zip_demasiado_grande':
        'ダウンロードしたパッケージが大きすぎるかファイル数が多すぎるため、インストールしません。',
      'rust.rustup_init_fallo': 'rustup-init が正常に終了しませんでした（コード {codigo}）: {detalle}',
      'rust.toolchain_fallo': 'Rust {version} をインストールできませんでした（コード {codigo}）: {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} をアンインストールできませんでした: {detalle}',
      'rust.descarga_fallo': 'rustup をダウンロードできませんでした（HTTP {estado}）。',
      'agentes.instalacion_fallo': 'エージェントをインストールできませんでした: {detalle}',
      'agentes.no_instalado': '{agente} はインストールされていません。',
      'agentes.mcp_no_soportado':
        '{agente} は環境変数からトークンを読み取る方法が文書化されていないため、MCP を登録しません。',
      'agentes.config_ilegible':
        '{archivo} を解析できなかったため変更していません。手動で確認してください。',
      'agentes.config_en_uso':
        'WolfCore Dev の編集中に {archivo} が変更されました。エージェントを閉じてからもう一度お試しください。変更は保存されていません。',
      'agentes.proveedor_incompatible': '{agente} はこの AI プロバイダーを使用できません。',
      'agentes.sin_cambios_preparados': '説明対象のステージ済み変更（git add）がありません。',
      'agentes.argumento_invalido': '無効な値です（{campo}）。',
      'git.commit_fallo': 'コミットできませんでした: {detalle}',
      'git.mensaje_invalido': 'コミットメッセージが空または無効です。',
      'php.rama_no_instalada': 'PHP {rama} はインストールされていません。',
      'php.argumento_invalido': '無効な値です（{campo}）。',
      'php.valor_invalido': '{clave} の値が無効です。',
      'php.ini_invalido': 'この php.ini では PHP を起動できないため保存しませんでした。出力: {salida}',
      'php.no_arranco':
        '変更後に PHP {rama} を再起動できなかったため、以前の設定に戻しました。現在は正常に応答しています。',
      'php.caido_tras_restaurar':
        'PHP {rama} を再起動できず、以前の設定に戻しましたが応答しません。サービスと PHP のログを確認してください。',
      'php.respaldo_no_existe': 'その php.ini のバックアップは存在しません。',
      'php.extension_no_existe': '拡張機能 {nombre} はこのバージョンの ext フォルダーにありません。',
      'php.extension_no_catalogo':
        '拡張機能 {nombre} はこのバージョンのカタログにありません。',
      'php.variante_desconocida': 'この PHP のビルド構成を判別できませんでした。',
      'php.sin_variante': 'カタログにビルド {variante} 向けの {nombre} がありません。',
      'php.huella_distinta':
        'ダウンロードしたファイルが公開ハッシュと一致しないため、何もインストールしませんでした。',
      'php.descarga_fallida': '拡張機能をダウンロードできませんでした: {detalle}',
      'php.extension_en_uso':
        '{nombre} の DLL が使用中です。PHP {rama} を停止してからもう一度お試しください。',
      'php.extension_sin_dll':
        '{nombre} の DLL を置き換えられず、PHP {rama} の ext フォルダーから DLL がなくなった状態です。PHP {rama} を停止してからもう一度お試しください。起動時に以前の DLL が復元されます。',
      'php.sitio_sin_php': 'このサイトは PHP を使用していません。',
      'php.sitio_no_arranco':
        '変更後に {sitio} 専用の PHP が応答しなかったため、以前の設定に戻しました。',
      'php.sin_puertos_sitio': 'サイト専用 PHP に割り当てられる空きポートが残っていません。',
      'xdebug.launch_invalido':
        'プロジェクトの .vscode/launch.json を解析できなかったため、何も変更していません。',
      'xdebug.launch_no_seguro':
        '.vscode フォルダーまたは launch.json がシンボリックリンク等のため、ここには書き込みません。',
      'xdebug.sin_configurar': 'launch.json を生成する前に、サイトで Xdebug を設定してください。',
      'nginx.sitio_no_existe': 'そのサイトはすでに存在しません。',
      'nginx.texto_invalido':
        'vhost のテキストが長すぎるか、空であるか、制御文字が含まれています。',
      'nginx.sintaxis': '{linea} 行目: {detalle}。何も変更していません。',
      'nginx.directiva_prohibida':
        '{linea} 行目: 「{directiva}」はサイトの vhost では許可されていません（他のサイトやプロジェクト外のファイルに影響する可能性があります）。何も変更していません。',
      'nginx.ruta_fuera':
        '{linea} 行目: 「{directiva}」はプロジェクトフォルダーまたはそのログ・証明書以外の場所を指しています。何も変更していません。',
      'nginx.fuera_de_server':
        '{linea} 行目: vhost 全体には「server」ブロックのみ記述できます。「{directiva}」がブロック外にあります。何も変更していません。',
      'nginx.dominio_ajeno':
        '{linea} 行目: 「{nombre}」はこのサイトのドメインではありません。先にサイトのエイリアスとして追加してください。',
      'nginx.puerto_ajeno':
        '{linea} 行目: サイトは「設定」で構成された Nginx ポートでのみ待機できます。',
      'nginx.version_no_existe': 'そのバージョンの vhost は履歴に残っていません。',
      'nginx.argumento_invalido': '無効な引数です: {campo}',
      'nginx.destino_interno':
        '{linea} 行目: 「{directiva}」は WolfCore Dev の内部サービス（Adminer、Mailpit、データベース、他サイトの PHP など）を指しており、ネットワークやトンネルへ公開されてしまいます。何も変更していません。',
      'nginx.caido_tras_restaurar':
        'Nginx が応答しなくなったため以前の vhost を復元しましたが、まだ応答しません。サービスと Nginx のログを確認してください。{salida}',
      'depuracion.puerto_ocupado':
        'ポート {puerto} がすでに使用中のため、ダンプキャプチャで待機できません。使用しているプログラム（Symfony の server:dump など）を終了してください。',
      'depuracion.no_iniciado': 'ダンプキャプチャは停止しています。',
      'depuracion.tipo_no_soportado': 'ダンプのキャプチャは PHP および FastAPI サイト専用です。',
      'depuracion.confirmacion': 'ダイアログでダンプのキャプチャを確定してください。',
      'depuracion.argumento_invalido': '無効な引数です：{campo}',
      'depuracion.archivo_fuera_del_sitio':
        'このファイルはサイトフォルダー内にないため、エディターで開きません。',
      'contenedores.motor_invalido': '不明なコンテナエンジンです。',
      'contenedores.id_invalido': 'コンテナ ID が無効です。',
      'contenedores.argumento_invalido': '無効な引数です：{campo}',
      'contenedores.sin_motor': '{motor} はこの PC にインストールされていません。',
      'contenedores.no_responde':
        '{motor} が応答しません。Docker Desktop を開くか、Podman マシンを起動してからもう一度お試しください。',
      'contenedores.remoto':
        '{motor} の既定の接続先が別のマシンを指しています。WolfCore Dev はローカルエンジンのみを使用します。',
      'contenedores.no_existe': 'コンテナはもう存在しません。一覧を更新してください。',
      'contenedores.accion_fallo': 'エンジンで処理を実行できませんでした：{detalle}',
      'contenedores.demasiados_registros':
        '同時に追跡できるコンテナログは最大 {maximo} 件までです。',
      'contenedores.sin_confirmar': 'ダイアログで操作を確定してください。',
      'catalogo.indice_invalido':
        '{servicio} のバージョン一覧の検証に失敗したため、保存済みの一覧を使用します。',
      'catalogo.sin_huella':
        '{servicio} {version} には公開チェックサムがありません。ダイアログでインストールを確定してください。',
      'catalogo.huella_debil':
        '{servicio} {version} には脆弱なチェックサム（MD5 または SHA-1）しかありません。ダイアログでインストールを確定してください。',
      'catalogo.huella_no_coincide': 'ダウンロードしたファイルが公開チェックサムと一致しません。',
      'catalogo.redireccion_ajena': 'ダウンロードが許可されていないサイト（{host}）へリダイレクトしようとしました。',
      'catalogo.demasiadas_redirecciones':
        'ダウンロードのリダイレクト回数が多すぎます（{maximo} 回超）。',
      'catalogo.respuesta_grande': 'サーバーの応答サイズが大きすぎます。',
      'catalogo.version_no_encontrada':
        '{servicio} のバージョン {version} はカタログに見つかりません。',
      'catalogo.huella_no_disponible':
        '{servicio} {version} のチェックサムを取得できませんでした（オフラインまたは配信元が応答しません）。もう一度お試しください。',
      'catalogo.firma_invalida':
        '{servicio} {version} の PGP 署名が無効か公開されていないため、インストールを中止しました。',
      'catalogo.firma_no_soportada':
        '{servicio} {version} の PGP 署名は WolfCore Dev が検証に対応していない形式のため、インストールを中止しました。',
      'catalogo.clave_desconocida':
        '{servicio} {version} の署名はアプリに固定された鍵に含まれていない鍵によるもののため、インストールを中止しました。',
      'catalogo.firma_vencida':
        '{servicio} {version} の署名または鍵の有効期限が切れているため、インストールを中止しました。鍵を最新にするには WolfCore Dev を更新してください。',
      'catalogo.reloj_atrasado':
        '{servicio} {version} の署名の日時が未来になっています。PC の日付と時刻を確認してもう一度お試しください。',
      'acceso_bd.datos_invalidos': 'データベースの接続情報が無効です。',
      'acceso_bd.sin_base': 'このプロジェクトの .env にはデータベースが指定されていません。',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin で開けるのは MySQL と MariaDB のデータベースのみです。PostgreSQL には Adminer を使用してください。',
      'acceso_bd.servidor_no_resuelto':
        'このプロジェクトのデータベースは WolfCore Dev のローカルサーバー上のものではありません。',
      'acceso_bd.no_listo':
        'ツールの準備ができていません。「サービス」からインストールし、PHP を起動してください。',
      'auditoria.tabla_invalida': 'そのデータベースに該当するテーブルは存在しません。',
      'auditoria.columna_invalida':
        'そのテーブルに該当するカラムが存在しません（ユーザー用カラムとハッシュ用カラムは別である必要があります）。',
      'auditoria.usuario_no_encontrado': 'そのユーザーのアカウントは見つかりません。',
      'auditoria.usuario_repetido':
        'そのユーザーのアカウントが複数存在するため、誤ったアカウントを変更しないようリセットしません。',
      'auditoria.formato_no_soportado':
        '現在のハッシュ形式を再現できないため、リセットできません。',
      'auditoria.clave_larga':
        'bcrypt ではパスワードの先頭 72 バイトのみが使用されます。より短いパスワードを指定してください。',
      'auditoria.clave_invalida': '新しいパスワードが無効です。',
      'auditoria.sin_confirmar': 'このパスワードをリセットすることを確定してください。',
      'auditoria.respaldo_previo_fallo':
        'リセット前にデータベースのバックアップを保存できなかったため、変更は行いませんでした。',
      'auditoria.copia_fallo': '対象行のバックアップを保存できなかったため、変更は行いませんでした。',
      'auditoria.motor_no_soportado':
        'パスワード監査は MySQL、MariaDB、PostgreSQL に対応しています。',
      'auditoria.cancelada': '監査をキャンセルしました。',
      'auditoria.usuario_invalido': 'ユーザー名は 1〜256 文字で入力してください。',
      'auditoria.en_curso': '別の監査が進行中です。完了を待つかキャンセルしてください。',
      'auditoria.base_sistema': 'システムデータベースは監査できません。プロジェクトのデータベースを選択してください。',
      'auditoria.esquema_invalido': 'そのデータベースに該当するスキーマは存在しません。',
      'auditoria.fila_cambio':
        '処理中にアカウントが変更されたため、リセットしませんでした。もう一度お試しください。',
      'auditoria.verificacion_fallo':
        'データベースにパスワードが期待どおりに保存されなかったため、変更を元に戻しました。',
      'auditoria.columna_corta':
        'ハッシュ用カラムの上限は {largo} 文字ですが、新しいハッシュには {necesario} 文字必要です。変更は行いませんでした。カラム長を拡張してください。',
      'auditoria.datos_reales_sin_confirmar':
        'このデータベースには実際の顧客データが含まれています。パスワードのリセットには追加の確認が必要です。',
      'instantaneas.id_invalido': '無効なスナップショットです。',
      'instantaneas.no_encontrada': 'スナップショットが見つかりません。すでに削除された可能性があります。',
      'instantaneas.otra_base': 'このスナップショットは別のデータベースのものです。このデータベースには適用できません。',
      'instantaneas.sin_confirmar': 'このスナップショットに戻すことを確定してください。',
      'instantaneas.motor_no_soportado': 'スナップショットは MySQL、MariaDB、PostgreSQL に対応しています。',
      'instantaneas.demasiado_grande':
        'データベースのサイズがスナップショットの上限（{maximo} MB）を超えています。',
      'instantaneas.sin_espacio':
        'スナップショット作成に必要な空き容量が不足しています（必要：{necesarios} MB、空き：{libres} MB）。',
      'instantaneas.limite':
        'このデータベースのスナップショットはすでに {maximo} 件あります。新しく作成するにはいずれかを削除してください。',
      'instantaneas.tomar_fallo': 'スナップショットを作成できませんでした。データベースは変更されていません。',
      'instantaneas.huella_no_coincide':
        'スナップショットファイルが変更されているか破損しているため、復元しませんでした。',
      'instantaneas.respaldo_previo_fallo':
        '現在のデータベース状態を保存できなかったため、復元しませんでした。',
      'instantaneas.restauracion_fallo':
        'スナップショットを復元できませんでした。データベースは元の状態に戻されました。理由：{detalle}',
      'instantaneas.restauracion_sin_copia':
        'スナップショットを復元できず、事前の状態も保存されていませんでした。データベースが空または不完全な状態になっている可能性があります。理由：{detalle}',
      'instantaneas.restauracion_sin_revertir':
        'スナップショットの復元にも元の状態への復帰にも失敗しました。元の状態は自動スナップショット「{respaldo}」に保存されています。「スナップショット」から復元してください。',
    },
  },
  instantaneas: {
    abrir: 'スナップショット',
    titulo: (base: string) => `${base} のスナップショット`,
    ayuda:
      'スナップショットは現在のデータベースの状態をそのまま保存します。いつでもその時点に戻せます。戻す前には現在の状態の自動スナップショットが保存されます。',
    ubicacion:
      'WolfCore Dev のデータフォルダー内に保存され、ご自身のユーザーのみが読み取れます。サービス本体やそのデータには影響しません。',
    notaEtiqueta: 'メモ（任意）',
    notaMarcador: '例：マイグレーション前',
    tomar: 'スナップショットを作成',
    tomada: 'スナップショットを保存しました',
    cargando: 'スナップショットを読み込み中…',
    vacio: 'このデータベースのスナップショットはまだありません。',
    automatica: '自動',
    sinNota: 'メモなし',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} テーブル · ${tamano}`,
    volver: 'このスナップショットに戻す',
    borrar: '削除',
    borrada: 'スナップショットをゴミ箱に移動しました',
    papelera:
      '削除したスナップショットは 7 日間、WolfCore Dev のゴミ箱から復元できます。',
    cerrar: '閉じる',
    papeleraTitulo: 'ゴミ箱',
    papeleraVacia: 'ゴミ箱にスナップショットはありません。',
    recuperar: '復元',
    recuperada: 'スナップショットを復元しました',
    borradaEl: (fecha: string) => `削除日時：${fecha}`,
    borrarPregunta: 'このスナップショットをゴミ箱に移動しますか？',
    borrarSi: 'ゴミ箱に移動',
    notaAutomatica: (fecha: string) =>
      `${fecha} のスナップショットへ戻す前に保存された元の状態`,
    notaAutomaticaSinOrigen: '別のスナップショットへ戻す前に保存された元の状態',
    extensionesAviso: (lista: string) =>
      `PostgreSQL 拡張機能（${lista}）が含まれており、この PC のチェックサム記録がある場合のみ復元されます。`,
    limites:
      'MySQL と MariaDB ではルーチン、トリガー、イベントも保存されます。PostgreSQL では単一データベースの圧縮ダンプとなり、サーバーのロールやユーザーは含まれません。この PC で作成されたと検証できないスナップショットは、そのデータベースに限定されたユーザーで復元されるため、他ユーザーのビュー・ルーチン・トリガーは適用されません。',
    basesBorradas: '存在しないデータベースのスナップショット',
    basesBorradasAyuda: 'スナップショットから再作成するデータベースを選択してください。',
    dialogoVolver: {
      titulo: (base: string) => `${base} のスナップショットに戻す`,
      cargando: 'プレビューを準備中…',
      base: 'データベース',
      instantanea: 'スナップショット',
      ahora: '現在',
      tamano: 'サイズ',
      tablas: 'テーブル数',
      nota: 'メモ',
      aviso: (base: string) =>
        `データベース「${base}」はこのスナップショットで完全に置き換えられ、それ以降の変更はすべて失われます。復元前に現在の状態の自動スナップショットが保存され、失敗した場合は自動的にその状態へ戻ります。`,
      pedir: (base: string) => `確認のため「${base}」と入力してください`,
      confirmar: 'このスナップショットに戻す',
      trabajando: (base: string) => `${base} を復元中… 完了するまでアプリを閉じないでください。`,
      hecho: (base: string) => `データベース「${base}」をスナップショットに戻しました`,
      respaldoPrevio: '元の状態は次の自動スナップショットに保存されました：',
      advertencias: '復元は通知付きで完了しました：',
      hechoConAvisos: (base: string) => `データベース「${base}」をスナップショットに戻しました（通知あり）`,
      baseVacia: 'データベースが存在しないか空のため、復元前に保存するデータはありません。',
      sinGuardarTitulo: '現在の状態を保存できませんでした',
      sinGuardarTexto:
        'WolfCore Dev は復元前にデータベースの現在の状態を保存できませんでした。保存せずに続行して復元が失敗した場合、現在のデータベースのデータは失われます。',
      sinGuardarConfirmar: '現在のデータベースのデータが失われる可能性があることを理解しました',
      sinGuardarBoton: '現在の状態を保存せずに戻す',
    },
  },
  avisoInicio: {
    titulo: 'WolfCore Dev からの通知',
  },
  tareas: {
    titulo: 'スケジュールタスク',
    resumen: (n: number) => (n === 0 ? 'タスクなし' : `${n} 件のタスク`),
    mostrar: 'タスクを表示',
    ocultar: '非表示',
    cargando: 'タスクを読み込み中',
    errorCargar: 'タスクを読み込めませんでした',
    soloAbierta:
      'タスクは WolfCore Dev が起動している間のみ実行されます。Windows タスクスケジューラは使用しません。アプリ終了中や PC スリープ中は実行されず、逃した実行は後から補完されません。',
    repoEjecuta:
      '信頼済みプロジェクトでは、リポジトリ内のファイル（タスクで指定したファイル、`artisan`、`package.json` のスクリプト、`.venv` など）がそのまま実行されます。`git pull` で変更された場合、次回は新しいバージョンが実行されます。',
    vacio:
      'このプロジェクトにはスケジュールタスクがありません。新しく作成してください（例：Laravel で毎分「php artisan schedule:run」を実行）。',
    nueva: '新しいタスク',
    pausada: '一時停止中',
    enCurso: '実行中…',
    nunca: '未実行',
    ultima: (f: string) => `前回：${f}`,
    proxima: (f: string) => `次回：${f}`,
    codigo: (n: number) => `終了コード ${n}`,
    resultadoTitulo: (n: string) => `「${n}」`,
    origen: { usuario: 'ここで作成', 'wolfcore.yml': 'wolfcore.yml 由来' },
    describir: {
      cadaMinuto: '毎分',
      cadaN: (n: number) => `${n} 分ごと`,
      cadaHora: '毎時 0 分',
      diaria: (h: string) => `毎日 ${h}`,
      laborables: (h: string) => `月〜金曜の ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: '成功',
      fallo: '失敗',
      tiempo: 'タイムアウト',
      cancelada: 'キャンセル済み',
      omitida: 'スキップ',
      bloqueada: '未実行',
    },
    motivo: {
      aislado:
        'テスト用データフォルダー（WOLFCORE_DATOS）のため、このセッションでタスクを許可するまで実行されません。',
      no_confiado:
        'このプロジェクトは信頼済みではありません。実行するには「このリポジトリを信頼する」を有効にしてください。',
      receta_cambio:
        '信頼後にプロジェクトのレシピが変更されました。内容を確認し、「このリポジトリを信頼する」を再度有効にしてください。',
      sin_confirmar: 'コマンドの確認が未完了です。確認して確定するまで実行されません。',
      comando_invalido: '許可されていないコマンドです（php、node、npm run、python のみ使用できます）。',
      cron_invalida: 'スケジュールが有効な cron 式ではありません。',
      carpeta: 'プロジェクトフォルダーが存在しません。',
      solapada: '前回の実行が継続中だったため、今回はスキップされました。',
      retraso: '予定時刻を過ぎたため（アプリが一時停止中でした）、補完実行されませんでした。',
      error: 'プログラムを実行できませんでした。',
    },
    acciones: {
      ejecutar: '今すぐ実行',
      editar: '編集',
      borrar: '削除',
      verRegistro: 'ログを表示',
      revisarConfirmar: '確認して確定',
      activar: (n: string) => `タスク「${n}」を有効化`,
    },
    borrar: {
      titulo: (n: string) => `「${n}」を削除しますか？`,
      texto:
        'タスクと実行履歴が削除されます。すでに実行された内容は元に戻らず、プロジェクトファイルにも影響しません。',
      confirmar: '削除',
      hecho: (n: string) => `タスク「${n}」を削除しました。`,
    },
    aislado: {
      titulo: 'テスト用データフォルダーです。',
      texto:
        'WOLFCORE_DATOS 使用時はタスクが自動実行されません。このセッションでテストしたい場合のみ許可してください。',
      permitir: 'このセッションで許可',
      confirmarTitulo: 'このテストフォルダーでタスクを許可しますか？',
      confirmarTexto:
        'アプリを閉じるまで、信頼済みプロジェクトの有効なタスクが実行されます。コマンドは各プロジェクトのもので、実際のプロジェクトフォルダー内で実行されます。',
      permitido: 'このセッションでタスクを許可しました。',
    },
    yml: {
      titulo: 'wolfcore.yml からの提案',
      texto:
        'プロジェクトファイルに以下のタスクが定義されています。記述されているだけでは実行されません。コマンドを確認して確定すると取り込まれます。',
      estado: { nueva: '新規', adoptada: '取り込み済み', cambiada: '変更あり' },
      revisar: '確認して取り込む',
      cambiada:
        '取り込み後に wolfcore.yml のコマンドが変更されました。プロジェクトのタスクは確定済みのコマンドのままです。内容に問題がなければ新しいバージョンを取り込んでください。',
      guardarEn: 'wolfcore.yml に保存',
      escribirTitulo: 'このタスクを wolfcore.yml に書き込みますか？',
      escribirTexto:
        '他の内容には触れず、プロジェクトファイルにこのタスクを追加または更新してリポジトリで共有できるようにします。クローンしたユーザーは各自の PC で確認する必要があります。',
      escribir: '書き込む',
      escrita: 'タスクを wolfcore.yml に保存しました。',
    },
    registro: {
      titulo: (n: string) => `「${n}」のログ`,
      historial: '最近の実行履歴',
      sinHistorial: 'まだ実行履歴がありません。',
      salida: '最終実行の出力',
      sinSalida: '保存された出力はありません。',
      enmascarado:
        'ログ内のパスワードや鍵はマスクされ、上限サイズに達すると自動でローテーションされます。',
      origen: { programada: 'スケジュール', manual: '手動' },
    },
    dialogo: {
      tituloNueva: '新しいスケジュールタスク',
      tituloEditar: 'スケジュールタスクを編集',
      tituloAdoptar: 'wolfcore.yml のタスクを取り込む',
      tituloConfirmar: 'タスクのコマンドを確認',
      nombre: '名前',
      nombrePlaceholder: 'Laravel スケジューラ',
      horario: '実行タイミング',
      preset: {
        cadaMinuto: '毎分',
        cadaN: '数分ごと',
        cadaHora: '毎時',
        diaria: '毎日（時刻指定）',
        laborables: '月〜金曜（時刻指定）',
        personalizada: 'カスタム cron 式',
      },
      cadaNOpcion: (n: number) => `${n} 分ごと`,
      hora: '時刻',
      horaPlaceholder: '03:00',
      horaInvalida: '有効な時刻を入力してください（例：03:00）。',
      expresion: 'Cron 式',
      cronEquivale: 'Cron 式：',
      expresionAyuda:
        '5 フィールド：分、時、日、月、曜日（* , - /）。最短間隔は 1 分ごとです。',
      proximas: '次回の実行予定：',
      comando: 'コマンド',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'プロジェクト内のファイルを指定した php、node、npm run、python のみ使用できます。シェルを介さずプロジェクトフォルダーで実行され、インラインコード（-r、-e、-c）は禁止されています。',
      comandoFijo:
        'このコマンドにはテキストとして編集できない引用符付き引数が含まれているため、そのまま保持されます（変更が必要な場合は削除して新しく作成してください）。',
      argumentos: '次の引数で実行されます：',
      comillasSinCerrar: '閉じられていない引用符があります。',
      tiempo: 'タイムアウト',
      minutos: '分',
      tiempoAyuda: 'この時間を超えると自動的に停止します（対象プロセスとその子プロセスのみ）。',
      activa: '有効（アプリ起動中に自動実行する）',
      advertencia:
        '確定すると、この正確なコマンドが予定時刻ごとにプロジェクトフォルダー内で自動実行されることを許可します。変更した場合は再確認が必要です。',
      revise: 'このコマンドを確認し、内容を理解しました。',
      guardar: '保存してコマンドを確定',
      adoptar: '確定して取り込む',
      confirmar: 'コマンドを確定',
      guardada: 'タスクを保存しました。',
      adoptada: 'タスクを取り込みました。',
      confirmada: 'コマンドを確定しました。',
    },
  },
  workspaces: {
    titulo: 'ワークスペース',
    descripcion:
      'データベース、サービス、プロセスをまとめて起動・停止できる名前付きグループです。',
    nuevo: '新しいワークスペース',
    vacio:
      'ワークスペースはまだありません。たとえば PostgreSQL、Redis、Ollama とプロジェクトのプロセスをまとめた「Bot FastAPI」などを作成できます。',
    elementos: (n: number) => `${n} 件の項目`,
    sinElementos: '項目なし',
    estado: { apagado: '停止中', parcial: '一部起動中', encendido: '起動中' },
    acciones: {
      iniciar: '起動',
      detener: '停止',
      editar: '編集',
      borrar: '削除',
      cerrar: '閉じる',
    },
    borrar: {
      titulo: (n: string) => `「${n}」を削除しますか？`,
      texto:
        'ワークスペースを削除してもサービスやデータは停止・削除されず、グループ定義のみが消去されます。起動中の項目はそのまま動作し続けます。',
      confirmar: '削除',
      hecho: (n: string) => `ワークスペース「${n}」を削除しました。`,
    },
    dialogo: {
      tituloNuevo: '新しいワークスペース',
      tituloEditar: 'ワークスペースを編集',
      nombre: '名前',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: '名前を入力してください。',
      aviso:
        'ワークスペースは起動対象のみを保存します。トンネルを開いたり、ローカルネットワークに公開したり、信頼していないプロジェクトのプロセスを起動したりすることはありません。',
      secciones: {
        instancias: 'データベース',
        servicios: 'サービス',
        procesos: 'プロジェクトプロセス',
      },
      sinOpciones: '選択できる項目はありません。',
      captadorUnico: 'メールキャッチャーは同時に 1 つのみ選択できます。別のものを選択すると切り替わります。',
      yaNoExisten: (lista: string) => `すでに存在しないため、保存時に除外されます：${lista}`,
      guardar: '保存',
      guardado: (n: string) => `ワークスペース「${n}」を保存しました。`,
    },
    resultado: {
      tituloIniciar: (n: string) => `「${n}」：起動結果`,
      tituloDetener: (n: string) => `「${n}」：停止結果`,
      encendido: '起動しました',
      apagado: '停止しました',
      yaEncendido: 'すでに起動中でした',
      yaApagado: 'すでに停止中でした',
      noExiste: '存在しないためスキップしました',
      compartido: '起動中のまま維持（別の起動中ワークスペースが使用中）',
      reemplaza: (otro: string) => `起動しました（同じメールグループの ${otro} を停止）`,
      fallo: '起動できませんでした',
      falloApagar: '停止できませんでした',
      ok: (n: string) => `「${n}」が完了しました。`,
      parcial: (n: string, encendidos: number, total: number) =>
        `「${n}」：${total} 件中 ${encendidos} 件が起動しました。起動しなかった項目を確認してください。`,
      parcialApagar: (n: string, siguen: number) =>
        `「${n}」：${siguen} 件が起動中のままです。停止しなかった項目を確認してください。`,
    },
  },
  inicio: {
    titulo: 'ホーム',
    bienvenida: '開発環境の状態を一目で確認できます。',
    tiles: {
      servicios: '起動中のサービス',
      serviciosDe: (total: number) => `/ ${total}`,
      sitios: 'プロジェクト',
      tuneles: 'アクティブなトンネル',
      hosts: '未反映の hosts',
      hostsOk: '問題なし',
      hostsFaltan: '要対応',
    },
    hosts: {
      titulo: 'hosts ファイルに未登録のドメインがあります',
      texto:
        'これらのドメインはまだこの PC を指していません。修正時に Windows の管理者権限の許可が求められます。',
      corregir: '未反映の hosts を適用',
      reintentarPermiso: '権限を付与して再試行',
      corregido: 'hosts ファイルを更新しました',
      fallo: 'hosts ファイルを更新できませんでした',
      verInstrucciones: '手順を表示',
      duplicados:
        '以下のドメインは WolfCore Dev 管理ブロック外の hosts にすでに存在するため、そのまま保持されます：',
      motivos: {
        cancelado: '管理者権限の許可がキャンセルされました。hosts ファイルは変更されていません。',
        tiempo:
          '管理者権限の許可が時間内に応答されませんでした。サイトは保存されましたが、hosts ファイルは変更されていません。Windows の確認画面が残っている場合はキャンセルしてください（処理は実行されません）。都合のよいときに未反映分を一括適用してください。',
        denegado:
          'Windows により hosts ファイルへの書き込みが拒否されました。ウイルス対策ソフトがブロックしている可能性があります。',
      } as Record<string, string>,
      modalTitulo: 'hosts を手動で修正',
      modalTexto:
        'PowerShell を管理者として開き（スタートを右クリック → ターミナル (管理者)）、このコマンドを貼り付けて Enter キーを押してください。',
    },
    servicios: {
      titulo: 'サービス',
      ver: 'サービスを表示',
      vacio: 'まだサービスがインストールされていません。',
    },
    tuneles: {
      titulo: 'アクティブなトンネル',
      vacio: '開いているトンネルはありません。「プロジェクト」から作成できます。',
      sitioDesconocido: '名称未設定のサイト',
    },
  },
  servicios: {
    titulo: 'サービス',
    descripcion:
      'Web サーバー、PHP、データベース、各種ツールの起動と停止を行います。状態は自動で更新されます。',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'データベース',
      correo: 'メール',
      ia: 'AI',
      herramientas: 'ツール',
    },
    gruposAyuda: {
      web: '.test ドメインを処理するサーバーです。',
      php: 'バージョンごとにインストールでき（8.3、8.4…）、サイトごとに使い分けられます。',
      bd: '127.0.0.1 のみで待ち受けます。',
      correo: 'プロジェクトから送信されるメールを外部に出さずに捕捉します。',
      ia: 'この PC 上で動作する言語モデルです。',
      herramientas: '日常の開発に役立つユーティリティです。',
    },
    puerto: 'ポート',
    cambiarPuerto: 'ポートを変更',
    cambiarPuertoDe: (nombre: string) => `${nombre} のポートを変更`,
    versionesDe: (nombre: string) => `${nombre} のバージョン`,
    instancias: (n: number, encendidas: number) => `${n} インスタンス、${encendidas} 起動中`,
    usarPuerto: (p: number) => `ポート ${p} を使用`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} はポート ${p} を使用するようになりました`,
    conflicto: 'ポート競合',
    autoIniciar: 'WolfCore Dev 起動時に自動起動する',
    autoIniciarActivado: (nombre: string) => `${nombre} は WolfCore Dev 起動時に自動起動します`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} は WolfCore Dev 起動時に自動起動しません`,
    dialogoPuerto: {
      titulo: (nombre: string) => `${nombre} のポート`,
      etiqueta: '新しいポート',
      ayuda:
        '1024〜65535 の空きポートを指定してください。サービスが起動中の場合は再起動されます。プロジェクトの .env も更新してください。',
      rango: '1024〜65535 の数値を入力してください',
      igual: '現在のポートと同じです',
      guardar: 'ポートを変更',
    },
    borrarDatos: {
      opcion: 'データを削除',
      titulo: (nombre: string) => `${nombre} のデータを削除`,
      copias: (n: number, tam: string) =>
        `アップデートのバックアップ ${n} 件（${tam}）も削除されます。残したい場合は、事前にデータフォルダーからコピーしてください。`,
      /** サービスごとに失われるデータ */
      que: {
        mysql: 'MySQL のすべてのデータベースとユーザー',
        mariadb: 'MariaDB のすべてのデータベースとユーザー',
        postgresql: 'PostgreSQL のすべてのデータベースとユーザー',
        redis: 'Redis に保存されているすべてのキーとデータ',
        mongodb: 'MongoDB のすべてのデータベース、コレクション、データ',
        mailpit: 'Mailpit で捕捉されたすべてのメール',
        smtp4dev: 'smtp4dev で捕捉されたすべてのメール',
        inbucket: 'Inbucket で捕捉されたすべてのメール',
        papercut: 'Papercut SMTP で捕捉されたすべてのメール',
        ollama: 'Ollama でダウンロード済みのすべてのモデル',
      } as Record<string, string>,
      texto: (que: string) =>
        `${que}が削除されます。元に戻せません。プログラム自体はインストールされたままです。`,
      generico: (nombre: string) => `${nombre}のすべてのデータ`,
      pedir: (id: string) => `確認のため ${id} と入力してください`,
      boton: 'データを削除',
      hecho: (nombre: string) => `${nombre}のデータを削除しました`,
    },
    ftp: {
      interruptor: 'FTPサーバー',
      redLocal: 'ローカルネットワークからの接続を許可',
      redLocalAyuda:
        'オフの場合、このPC（127.0.0.1）からのみ接続できます。各サイトのアクセスは「サイト」で有効化します。',
      avisoTitulo: 'FTPをローカルネットワークに公開',
      avisoTexto:
        'FTPはユーザー名・パスワード・ファイルを暗号化せずに送信します。同じネットワーク上の端末から接続を試行できます。信頼できるネットワークでのみ使用してください。',
      avisoConfirmar: '許可する',
      redLocalActivada: 'FTPはローカルネットワークからの接続を受け付けます',
      redLocalDesactivada: 'FTPはこのPCからの接続のみを受け付けます',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'PHP依存関係マネージャー',
      instalado: 'インストール済み',
      noInstalado: '未インストール',
      sinVersion: '未インストール',
      uso: '使い方',
      usoTexto: 'composer',
      ayuda: 'プロジェクトの「ターミナル」を使うか、「設定」でWolfCore DevをPATHに追加してください。',
      instaladoOk: 'Composerをインストールしました',
      sinPhp: '先にPHPをインストールしてください',
      actualizado: (v: string) => `Composerを更新しました: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Webデータベース管理ツール',
      direccion: 'アドレス',
      disponible: '準備完了',
      noInstalado: '未インストール',
      sinPhp: 'PHPが必要',
      abrir: 'Adminerを開く',
      instaladoOk: 'Adminerをインストールしました',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'MySQL / MariaDB Web管理ツール',
      direccion: 'アドレス',
      disponible: '準備完了',
      noInstalado: '未インストール',
      sinPhp: 'PHPが必要',
      abrirDesdeProyecto: '各プロジェクトカードから認証済みで開きます。',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} で拡張機能 ${ext} が有効になっていません。PHPを再起動するか php.ini で有効にしてください。`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin の対応範囲は PHP 8.3 までですが、現在 PHP ${rama} が使われています。問題が起きる場合は PHP 7.2〜8.3 を起動してください。`,
      instalarPrimero: '使用するには phpMyAdmin をインストールしてください。',
      encenderPhp: 'phpMyAdmin を使うには PHP を起動してください。',
      instaladoOk: 'phpMyAdminをインストールしました',
    },
    puertos: 'ポート',
    pid: 'PID',
    sinVersion: 'バージョンなし',
    sinPuertos: '—',
    terminado: 'エラーなしで終了しました',
    externo: 'WolfCore Dev 外で管理されています',
    verDetalle: 'エラー詳細を見る',
    vacioTitulo: 'サービスがまだありません',
    vacio:
      'インストール済みのサービスがありません。サイト用に Nginx と PHP、またはデータベースから始めてください。',
    irAInstalar: 'インストールへ',
  },
  bd: {
    descripcion:
      'プロジェクトのデータベースを作成・バックアップ・復元できます。サーバーは 127.0.0.1 のみで待ち受けます。',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: '新規データベース',
    restaurar: 'バックアップを復元',
    importar: '別サーバーからインポート',
    soloSql: 'MySQL、MariaDB、PostgreSQL で利用可能',
    enCursoAyuda: '実行中の処理が終わるまでお待ちください',
    encenderPrimero: (motor: string) => `先に ${motor} を起動してください`,
    cargando: 'データベースを読み込み中…',
    recargar: '一覧を再読み込み',
    vacioTitulo: 'データベースサーバーがインストールされていません',
    vacio:
      'データベースを管理するには「サービス」から MySQL、MariaDB、PostgreSQL または MongoDB をインストールしてください。',
    irAServicios: 'サービスへ移動',
    apagado: {
      titulo: (motor: string) => `${motor} は停止中です`,
      texto: (motor: string) => `データベースを表示・管理するには ${motor} を起動してください。`,
      iniciando: (motor: string) => `${motor} を起動中…`,
      error: (motor: string) => `${motor} を起動できませんでした`,
      encender: (motor: string) => `${motor} を起動`,
      verServicios: 'サービスで表示',
    },
    errorLista: 'データベース一覧を読み取れませんでした',
    sinBases: 'このサーバーにはまだデータベースがありません。',
    total: (n: number) => plural(n, '件のデータベース'),
    columnas: { nombre: 'データベース', tamano: 'サイズ', acciones: '操作' },
    acciones: {
      respaldar: 'バックアップ',
      restaurarAqui: 'ここに復元',
      adminer: 'Adminerで開く',
      conexion: '接続情報',
      vector: 'vectorを有効化',
      borrar: '削除',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: '開くには「サービス」で Adminer と PHP をインストールしてください',
    vectorSinInstalar: 'データベースで有効化するには下で pgvector をインストールしてください',
    vectorActivado: (base: string) => `${base} で vector を有効化しました`,
    formatos: {
      sql: 'プレーンSQL',
      pgdump: 'PostgreSQLバックアップ (pg_dump カスタム形式)',
      gz: '圧縮SQL (.gz)',
      zip: '.zip アーカイブ（復元前に展開されます）',
      rar: '.rar アーカイブ（Windowsで展開を試行します）',
      '7z': '.7z アーカイブ（Windowsで展開を試行します）',
      desconocido: '認識できない形式',
    } as Record<string, string>,
    formatoDesconocido:
      '形式を認識できません。圧縮ファイルの場合は展開してから中の .sql または .dump を選択してください。',
    formatoIncompatible:
      'このファイルは PostgreSQL のバックアップです。PostgreSQL タブから復元してください。',
    nombre: {
      etiqueta: 'データベース名',
      vacio: '名前を入力してください',
      largo: '名前が長すぎます',
      caracteres: {
        mysql: '英数字とアンダースコアのみ使用してください',
        mariadb: '英数字とアンダースコアのみ使用してください',
        postgresql: '小文字英字、数字、アンダースコアのみ使用してください',
        mongodb: '英数字、ハイフン、アンダースコアのみ使用してください',
      } as Record<string, string>,
      inicio: 'PostgreSQL では名前を数字で始められません',
    },
    reemplazo: {
      titulo: (base: string) => `データベース ${base} にはすでにテーブルがあります`,
      texto: (base: string) =>
        `続行すると、現在のデータベース ${base} は完全に置き換えられます。最初に自動バックアップを保存した後、データベースを削除して新しい内容で再作成します。`,
      donde: 'バックアップの保存先',
      carpetaPorDefecto: 'ドキュメント\\WolfCore Dev\\Respaldos',
      otraBase:
        '置き換えたくない場合は戻って別の名前を指定してください。新しいデータベースが作成されます。',
      pedir: (base: string) => `確認のため ${base} と入力してください`,
      volver: '戻る',
      confirmar: 'データベースを置換',
    },
    resultado: {
      restaurada: (base: string) => `データベース ${base} を復元しました`,
      importada: (base: string) => `データベース ${base} をインポートしました`,
      respaldada: (base: string) => `${base} のバックアップを保存しました`,
      archivo: 'ファイル',
      respaldoPrevio: '置換前のデータベースバックアップ',
      advertencias: (n: number) => plural(n, '件の警告'),
      advertenciasAyuda:
        '処理は完了しました。警告を確認してください。通常はこのPCに存在しないロールや権限に関するものです。',
      fallo: {
        restaurar: '復元に失敗しました',
        importar: 'インポートに失敗しました',
        respaldar: 'バックアップに失敗しました',
      } as Record<string, string>,
      trasReemplazo: '元のデータベースは置換されましたが、復元が完了しませんでした',
      trasReemplazoAyuda:
        '以前のデータは上記のバックアップに保存されています。「バックアップを復元」から戻せます。',
    },
    progreso: {
      titulo: 'ログ',
      corriendo: {
        restaurar: (base: string) => `${base} を復元中…`,
        importar: (base: string) => `${base} をインポート中…`,
        respaldar: (base: string) => `${base} をバックアップ中…`,
      } as Record<string, (base: string) => string>,
      vacio: 'ツールの出力を待機中…',
      limitado: (n: number) => `最新の ${n} 行を表示しています。`,
      noCierre:
        '完了するまでアプリを閉じないでください。別画面に移動してから戻っても結果を確認できます。',
      otraEnCurso: '別の操作が実行中です。完了までお待ちください。',
      ver: '詳細を見る',
      descartar: '閉じる',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `${motor} にバックアップを復元`,
      confianza:
        '信頼できるバックアップのみ復元してください。バックアップはサーバー上で処理を実行できます。',
      archivo: 'バックアップファイル',
      elegir: 'ファイルを選択…',
      cambiar: '変更',
      sinArchivo: 'ファイル未選択',
      formato: '検出された形式',
      detectando: '形式を検出中…',
      destino: '復元先データベース',
      destinoAyuda:
        '存在しない場合は作成されます。空の場合はそのまま使われます。テーブルがある場合は確認を求めます。',
      restaurar: '復元',
    },
    dialogoImportar: {
      titulo: (motor: string) => `別サーバーから ${motor} へインポート`,
      soloLectura:
        '移行元サーバーは読み取り専用です。データベースはこのPCへコピーされ、移行元は変更されません。',
      detectado: (puerto: number) =>
        `ポート ${puerto} で別のサーバー（例: FlyEnv）が検出されました。`,
      origen: '移行元サーバー',
      host: 'ホスト',
      puerto: 'ポート',
      usuario: 'ユーザー',
      clave: 'パスワード',
      claveAyuda: 'このコピーのみに使用され、保存されません。',
      baseOrigen: '移行元データベース',
      destino: 'このPC上の移行先データベース',
      destinoAyuda:
        '存在しない場合は作成されます。テーブルがある場合は置換前に確認を求めます。',
      faltaHost: 'ホストを入力してください',
      faltaPuerto: '1〜65535 のポートを指定してください',
      faltaUsuario: 'ユーザーを入力してください',
      faltaBase: '移行元データベースを入力してください',
      importar: 'インポート',
    },
    dialogoNueva: {
      titulo: (motor: string) => `${motor} の新規データベース`,
      codificacion: '文字コード',
      codificacionValor: {
        mysql: 'utf8mb4（絵文字や多言語文字に対応）',
        mariadb: 'utf8mb4（絵文字や多言語文字に対応）',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'このデータベース専用のユーザーを作成',
      usuarioPropioAyuda:
        '任意です。作成しない場合、プロジェクトはサーバー管理者ユーザーを使用します。',
      usuario: 'ユーザー',
      clave: 'パスワード',
      faltaClave: 'パスワードを入力してください',
      crear: 'データベースを作成',
      creada: (base: string) => `データベース ${base} を作成しました`,
      mongo: 'MongoDB では初期コレクション (_pel_init) 付きで作成されます。',
      cambiarClave: 'パスワードを変更',
      cambiarClaveTitulo: (u: string) => `ユーザー ${u} は別のパスワードで既に存在します`,
      cambiarClaveTexto: (u: string) =>
        `${u} のパスワードを変更すると、既に使用しているプロジェクトは .env を更新するまで接続できなくなります。通常は現在のパスワードを使います。それでも変更しますか？`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `データベース ${base} を削除しますか？`,
      texto: (base: string, motor: string) =>
        `${motor} のデータベース ${base} とすべてのデータが削除されます。元に戻せません。必要な場合は事前にバックアップしてください。`,
      pedir: (base: string) => `確認のため ${base} と入力してください`,
      boton: 'データベースを削除',
      hecho: (base: string) => `データベース ${base} を削除しました`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `${base} をバックアップ`,
      destino: '保存先',
      porDefecto: 'ドキュメント\\WolfCore Dev\\Respaldos（既定のフォルダ）',
      porDefectoEn: (carpeta: string) => `${carpeta}（既定のフォルダ）`,
      cambiar: '別のフォルダを選択…',
      porDefectoVolver: '既定のフォルダを使う',
      formato: {
        mysql: '.sql ファイル（ルーチン・トリガー含む mysqldump）',
        mariadb: '.sql ファイル（ルーチン・トリガー含む mysqldump）',
        postgresql: '.dump ファイル（pg_dump カスタム形式）',
      } as Record<string, string>,
      boton: 'バックアップ',
    },
    dialogoConexion: {
      sitio: 'プロジェクト',
      sitioAyuda:
        'サイトの .env を読み取り、既存の変数形式（例: CodeIgniter 4）に合わせます。内容は表示・コピーされません。',
      generico: '汎用（Laravel形式）',
      titulo: (base: string) => `${base} への接続`,
      host: 'ホスト',
      puerto: 'ポート',
      usuario: 'ユーザー',
      clave: 'パスワード',
      base: 'データベース',
      sinClave: 'パスワードなし（127.0.0.1 のみで待ち受け）',
      mostrar: 'パスワードを表示',
      ocultar: 'パスワードを隠す',
      copiarDato: (dato: string) => `${dato}をコピー`,
      env: '.env ファイル用ブロック',
      envAyuda: 'プロジェクトの .env に貼り付けてください。WolfCore Dev はプロジェクトを書き換えません。',
      copiarEnv: 'ブロックをコピー',
      cargando: '接続情報を読み込み中…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'pgvector のインストールがすでに実行中です。',
      descripcion:
        'PostgreSQL 内での類似度検索（埋め込みベクトル）。公式ソースからビルドします。',
      instalado: (v: string | null) => (v ? `インストール済み（バージョン ${v}）` : 'インストール済み'),
      noInstalado: '未インストール',
      herramientas: 'ビルドツール',
      herramientasSi: '準備完了',
      herramientasNo: '不足',
      instalar: 'pgvector をインストール',
      reinstalar: '再ビルド',
      instalarHerramientas: 'ビルドツールをインストール',
      dialogoHerramientasTitulo: 'ビルドツールをインストール',
      dialogoHerramientas:
        'pgvector のビルドには Visual Studio Build Tools が必要です。約 6 GB ダウンロードされ、Windows が管理者権限を求めます。時間がかかるため WolfCore Dev を開いたままにしてください。',
      dialogoCompilarTitulo: 'pgvector をビルドしてインストール',
      dialogoCompilar:
        '公式ソースをダウンロードしてビルドし、PostgreSQL にインストールします。拡張をコピーする間 PostgreSQL が数秒停止し、自動で再起動します。',
      continuar: '続行',
      instalando: 'ビルドツールをインストール中…',
      compilando: 'pgvector をビルド中…',
      herramientasOk: 'ビルドツールをインストールしました',
      instaladoOk: (v: string) => `pgvector ${v} をインストールしました`,
      sinWinget:
        'このPCには winget がありません。visualstudio.microsoft.com から「Build Tools for Visual Studio 2022」の「C++ によるデスクトップ開発」をインストールして再試行してください。',
      falloHerramientas: 'ビルドツールをインストールできませんでした',
      activarAyuda: 'インストール後、必要なデータベースで「vectorを有効化」を実行してください。',
      errorEstado: 'pgvector の状態を読み取れませんでした',
    },
  },
  instalar: {
    titulo: 'インストール',
    descripcion:
      '公式バージョンをダウンロードします。すべてのファイルは使用前に SHA-256 チェックサムで検証されます。',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Webサーバー (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: '公開トンネル (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'データベース 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'データベース 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'データベース (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'インメモリキャッシュ・キュー (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'ドキュメントデータベース (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB シェル (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'テストメール (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'テストメール (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'テストメール (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'テストメール (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'ローカルAI (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'PHP依存関係 (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Webデータベース管理ツール' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'MySQL Web管理ツール (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web と PHP',
      bd: 'データベース',
      otros: 'メール・AI・トンネル',
    },
    instalados: 'インストール済み',
    ninguno: 'インストール済みバージョンなし',
    elegir: 'バージョンを選択',
    buscando: 'バージョンを検索中…',
    sinVersiones: 'バージョンが見つかりませんでした',
    rama: (rama: string) => rama,
    yaInstalada: 'インストール済み',
    fases: {
      descargando: 'ダウンロード中',
      verificando: 'SHA-256 を検証中',
      extrayendo: '展開中',
      compilando: 'ビルド中',
      listo: 'インストール済み',
      error: 'インストールに失敗しました',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} をインストールしました`,
  },
  sitios: {
    titulo: 'サイト',
    descripcion: '各サイトは独自の .test ドメインで Nginx から配信されるフォルダです。',
    nuevo: '新規サイト',
    buscar: '名前またはドメインで検索',
    sinResultados: (q: string) => `「${q}」に一致するサイトはありません。`,
    vacioTitulo: 'サイトがまだありません',
    vacio:
      'プロジェクトフォルダを選ぶと、WolfCore Dev が Laravel、CodeIgniter、静的サイトなどを自動判定します。',
    agregar: 'サイトを追加',
    total: (n: number) => plural(n, '件のサイト'),
    abrirSitio: (dominio: string) => `${dominio} をブラウザで開く`,
    carpeta: 'フォルダ',
    abrirCarpeta: 'プロジェクトフォルダを開く',
    alias: (n: number) => `+${plural(n, '件のエイリアス')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: '静的',
      proxy: 'プロキシ（ローカルポート）',
      personalizado: 'カスタム',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI（ローカルポート）',
      node: 'Node / Vite（ローカルポート）',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: '静的',
      proxy: 'プロキシ',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: '実データあり',
    datosRealesAyuda: '実際の顧客データを含みます。公開時は十分にご注意ください。',
    faltaHosts: 'hosts未登録',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} はまだこのPCを指していません。上部の通知から hosts ファイルを更新してください。`,
    estado: {
      enLinea: 'オンライン',
      faltaHosts: 'hosts未登録',
      iniciando: 'Nginx 起動中…',
      errorNginx: 'Nginx エラー',
      nginxExterno: '外部 Nginx',
      nginxApagado: 'Nginx 停止中',
    },
    borrar: {
      titulo: (nombre: string) => `サイト ${nombre} を削除しますか？`,
      texto: 'プロジェクトフォルダ自体は変更されません。',
      hecho: (nombre: string) => `サイト ${nombre} を削除しました`,
      nginxFallo: 'サイトは削除されましたが、Nginx が新しい設定を拒否しました',
    },
  },
  formSitio: {
    tituloNuevo: '新規サイト',
    tituloEditar: 'サイトを編集',
    tituloDuplicar: 'サイトを複製',
    paso: 'まずプロジェクトフォルダを選択してください',
    pasoAyuda:
      'プロジェクト種別、PHPバージョン、推奨ドメインが自動検出されます。後からすべて変更できます。',
    elegirCarpeta: 'フォルダを選択',
    cambiarCarpeta: '変更',
    detectando: 'プロジェクトを解析中…',
    detectado: (tipo: string) => `検出: ${tipo}`,
    sinDeteccionAlEditar: '自動検出は作成時のみ適用されます。種別とPHPを確認してください。',
    nombre: '名前',
    nombreAyuda: '一覧で識別するための表示名です。',
    nombreCopia: (nombre: string) => `${nombre}（コピー）`,
    duplicarProxy:
      '複製先は元のサイトと同じローカルポートを指し、プロセスはコピーされません。ポートを変更するか専用プロセスを追加してください。',
    dominio: 'ドメイン',
    dominioPlaceholder: 'my-project',
    alias: 'エイリアス',
    aliasAyuda: '同じサイトを開く追加の .test ドメイン。入力して Enter を押します。',
    aliasAgregar: 'エイリアスを追加',
    carpeta: 'プロジェクトフォルダ',
    raizLaravel: 'Nginx は public/ サブフォルダを配信します。',
    tipo: 'プロジェクト種別',
    php: 'PHP バージョン',
    phpElegir: 'バージョンを選択',
    phpNinguno: 'PHP がインストールされていません。',
    phpInstalar: 'PHP をインストール',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `プロジェクトは PHP ${pedida} を要求していますが未インストールのため、PHP ${elegida} を選択しました。`,
    puertoProxy: 'ローカルポート',
    puertoProxyAyuda:
      'Nginx が http://127.0.0.1:<puerto>（例: Vite や Node）へ転送します。',
    urlBaseVar: 'ベースURL変数',
    urlBaseVarAyuda:
      'トンネルを開くと .env のこの変数に公開URLを書き込み、閉じると元に戻します。',
    urlBaseVarNinguna: 'なし（.env を変更しない）',
    datosReales: '実際の顧客データを含む',
    datosRealesAyuda:
      '一覧に目印を付け、トンネル公開時に確認を求めます。',
    avanzado: '詳細設定',
    reglasExtra: '追加の Nginx ルール',
    reglasExtraAyuda:
      'server ブロック内に挿入されます（セキュリティヘッダーや deny など）。保存時に nginx -t で検証されます。',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'メモ',
    notaPlaceholder: 'このサイトに関するメモ',
    guardar: 'サイトを保存',
    guardado: (nombre: string) => `サイト ${nombre} を保存しました`,
    errorGuardar: 'サイトを保存できませんでした',
    nginxFallo: 'サイトは保存されましたが、Nginx が設定を拒否しました',
    nginxFalloAyuda:
      '以前の Nginx 設定に戻しました。追加ルールを確認して再度保存してください。',
    errores: {
      carpeta: 'プロジェクトフォルダを選択してください',
      sufijo: 'ドメインは .test で終わる必要があります',
      caracteres: '英数字、ハイフン、ドットのみ使用してください',
      aliasIgualDominio: (d: string) => `エイリアス ${d} がサイトのドメインと同じです`,
      aliasRepetido: (d: string) => `エイリアス ${d} が重複しています`,
      ocupado: (d: string) => `ドメイン ${d} のサイトは既に存在します`,
      puertoFalta: 'プロキシサイトにはポートが必要です',
      puertoRango: 'ポートは 1〜65535 の範囲で指定してください',
      php: 'このサイトの PHP バージョンを選択してください',
      urlBaseVar: '英数字とアンダースコアのみ使用してください（例: APP_URL）',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `${dominio} の公開トンネル`,
    etiqueta: 'トンネル',
    apagadoAyuda: '一時的な公開リンクでこのサイトを共有します。',
    abriendo: 'トンネルを開いています…',
    cerrando: 'トンネルを閉じています…',
    error: 'トンネルでエラーが発生しました',
    sinNginx: '先に Nginx を起動してください',
    sinCloudflared: '「サービス」で cloudflared をインストールしてください',
    abrirUrl: '公開リンクを開く',
    copiarUrl: '公開リンクをコピー',
    verQr: 'リンクのQRコードを表示',
    qrTitulo: 'このサイトの公開リンク',
    renovar: '更新（新しいリンク）',
    cerrar: 'トンネルを閉じる',
    confirmarTitulo: '実データを含むサイトを公開',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} には実際の顧客データが含まれており、${destino} 経由でインターネットに公開されます。開いている間、リンクを知る誰でも閲覧できます。公開しますか？`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} を Expose 経由でインターネットに公開します。開いている間、リンクを知る誰でもアクセスできます。さらに Expose のリクエストインスペクターはローカルネットワーク全体に公開されます。公開しますか？`,
    compartir: '共有',
    confirmar: '公開する',
    confirmarPublicoTitulo: 'サイトをインターネットに公開',
    confirmarPublicoTexto: (dominio: string) =>
      `${dominio} の Cloudflare 公開トンネルを開きます。開いている間、リンクを知る誰でもアクセスできます。公開しますか？`,
    opciones: 'トンネル設定',
    opcionesDe: (dominio: string) => `${dominio} のトンネル設定`,
    proveedor: 'プロバイダー',
    proveedorRapido: 'クイック（アカウント不要）',
    proveedorRapidoAyuda: '開くたびに変わる trycloudflare.com のリンクです。',
    proveedorNombre: '名前付き（独自ドメイン）',
    proveedorNombreAyuda:
      'Cloudflare 管理下の独自ドメインで固定リンクを使用します。Cloudflare アカウントが必要です。',
    cuentaConectada: 'Cloudflare アカウントが接続されています。',
    cuentaSinConectar: 'Cloudflare アカウントはまだ接続されていません。',
    conectar: 'Cloudflare と接続',
    conectando: 'ブラウザでの認証を待機中…',
    conectarAyuda:
      'ブラウザが開き、アカウントへの WolfCore Dev のアクセスを許可します。証明書はデータフォルダのみに保存されます。',
    autorizacion: 'Cloudflare 認証',
    abrirAutorizacion: '認証ページを開く',
    copiarAutorizacion: '認証リンクをコピー',
    cancelarConexion: 'キャンセル',
    recrear: 'トンネルを再作成',
    olvidar: 'トンネルを忘れる',
    recrearTitulo: 'トンネルを再作成',
    recrearTexto: (n: string) =>
      `Cloudflare 上のトンネル「${n}」を削除し、同じ名前で新規作成します。使用中のサイトは閉じられます。`,
    olvidarTitulo: 'トンネルを忘れる',
    olvidarTexto: (n: string) =>
      `Cloudflare 上のトンネル「${n}」と保存済み認証情報を削除します。使用中のサイトはクイックトンネルに戻ります。`,
    olvidarAqui: 'このPCのみ忘れる',
    olvidarAquiTitulo: 'このPC上でのみトンネルを忘れる',
    olvidarAquiTexto: (n: string) =>
      `このPCに保存されているトンネル「${n}」の認証情報を削除します。Cloudflare 上のトンネルは残ります。使用中のサイトはクイックトンネルに戻ります。`,
    desconectar: '接続解除',
    nombreTunel: 'トンネル名',
    nombreTunelAyuda: '小文字英字、数字、ハイフン。',
    dominioPublico: '公開ドメイン',
    dominioPublicoAyuda:
      'Cloudflare 上のご自身のドメインのサブドメイン（例: demo.mydomain.com）。',
    crear: '作成してルート設定',
    guardadoNombre: '名前付きトンネルの準備ができました。開く際に確認を求めます。',
    guardadoRapido: 'このサイトはクイックトンネルに戻りました。',
    cambiarCierra: 'プロバイダーを切り替えると、このサイトの開いているトンネルは閉じます。',
    usarRapido: 'クイックトンネルを使用',
    nombreActual: (nombre: string, dominio: string) => `トンネル「${nombre}」(${dominio})`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `Cloudflare トンネルで ${dominio} を ${publico} に公開します。開いている間、リンクを知る誰でもアクセスできます。公開しますか？`,
    proveedorNgrokAyuda:
      'ngrok アカウントを使用します。このPCに ngrok がインストールされている必要があります。',
    proveedorExposeAyuda:
      'Expose アカウントを使用します。Expose のインストールが必要です（Windows では expose.phar のみ対応）。インスペクターがローカルネットワークに公開されるため、実データを含むサイトでは使用できません。',
    proveedorTailscaleAyuda:
      'プライベートな Tailscale ネットワーク経由。Tailscale がインストールされ、サインイン済みである必要があります。',
    tokenGuardado: (f: string) => `トークン保存済み（末尾 ${f}）。`,
    tokenSinGuardar: 'トークンはまだ保存されていません。',
    tokenNgrok: 'ngrok トークン',
    tokenExpose: 'Expose トークン',
    tokenAyuda:
      'このPCに暗号化して保存され、トンネルを開くときだけプログラムに渡されます。表示はされません。',
    tokenPlaceholder: 'ここにトークンを貼り付け',
    guardarToken: 'トークンを保存',
    borrarToken: 'トークンを削除',
    usarProveedor: 'このプロバイダーを使用',
    guardadoProveedor: 'プロバイダーを保存しました。トンネルを開く際に確認を求めます。',
    ngrokAyudaInstalacion:
      'このPCに ngrok がインストールされている必要があります（検証可能なチェックサムが公開されていないため WolfCore Dev はダウンロードしません）。グローバル設定は変更されません。',
    exposeAyudaInstalacion:
      'Expose をインストールするか、WolfCore Dev データフォルダの bin/expose に expose.phar を配置してください（Windows では phar のみ対応）。リクエストインスペクターがローカルネットワーク全体に公開されるため、実データサイトでは使用不可です。グローバル設定は変更されません。',
    tailscaleAlcance: '公開範囲',
    tailscaleServe: 'Serve: ご自身の tailnet のみ',
    tailscaleServeAyuda: 'Tailscale ネットワーク上の端末のみ。インターネットには公開されません。',
    tailscaleFunnel: 'Funnel: インターネット全体',
    tailscaleFunnelAyuda: 'tailnet 外を含め、リンクを知る誰でもアクセスできます。',
    tailscaleFunnelAviso:
      'Funnel はこのサイトをインターネットに公開します。開いている間、リンクを知る誰でもアクセスできます。',
    tailscaleAyudaInstalacion:
      'WolfCore Dev は Tailscale をインストールしません（システムサービスのため）。インストールおよびサインインが必要です。既存の Tailscale 公開設定は変更せず、HTTPS ポート 8443 を使用します。',
    confirmarTailnetTitulo: 'tailnet で共有',
    confirmarTailnetTexto: (dominio: string) =>
      `Tailscale Serve で ${dominio} を共有します。tailnet 内の端末のみアクセス可能で、インターネットには公開されません。共有しますか？`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} には実際の顧客データが含まれます。Tailscale Serve では tailnet 内の端末のみ閲覧可能です（インターネット非公開）。共有しますか？`,
    confirmarFunnelTexto: (dominio: string) =>
      `Tailscale Funnel で ${dominio} をインターネットに公開します。開いている間、リンクを知る誰でもアクセスできます。公開しますか？`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${proveedor} で ${dominio} をインターネットに公開します。開いている間、リンクを知る誰でもアクセスできます。公開しますか？`,
    tituloError: 'トンネルを開けませんでした',
  },
  tuneles: {
    titulo: 'トンネル',
    descripcion: 'ネットワーク外からサイトを確認するための Cloudflare 一時公開リンクです。',
    explicacion:
      'クイックトンネルは開くたび・更新するたびにURLが変わり、このPCが起動中でプロセスが生きている間だけ機能します（WolfCore Dev を終了してもプロセスを残せば継続します）。',
    columnas: { sitio: 'サイト', estado: '状態', url: 'リンク', acciones: '操作' },
    vacioTitulo: '開いているトンネルはありません',
    vacio: 'サイトのトンネルスイッチをオンにすると公開リンクを取得できます。',
    irASitios: 'サイトへ移動',
    sinNombre: '削除済みサイト',
  },
  ajustes: {
    titulo: '設定',
    descripcion: '環境の設定を行います。',
    general: '一般',
    carpetaDatos: 'データフォルダ',
    carpetaDatosAyuda: 'バイナリ、設定、ログの保存先です。開くことはできますが変更できません。',
    servicios: 'サービス',
    puertoNginx: 'Nginx ポート',
    puertoNginxAyuda:
      '通常は 80 です。80 以外にするとローカルURLにポートが付きます。開いているトンネルは旧ポートのままのため更新してください。',
    trabajadores: 'PHP ワーカー数',
    trabajadoresAyuda:
      'バージョンごとの php-cgi プロセス数。増やすと同時リクエストの処理性能が上がります。',
    nota: '保存すると新しいポートでサイト設定が再生成されます。Nginx が起動中なら再起動（ポート変更なしならリロード）され、ワーカー数が変わった場合は起動中の PHP も再起動します。',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `設定を保存して適用しました。再起動: ${reiniciados.join('、')}。`
        : '設定を保存して適用しました。',
    errorAplicar: '設定は保存されましたが、一部を適用できませんでした',
    errorSeccion: (detalle: string) => `この項目を読み取れませんでした: ${detalle}`,
    acerca: 'バージョン情報',
    avisos: {
      titulo: '通知',
      descripcion:
        'ベルに保存する通知の種類と、ウィンドウが非表示のときに Windows 通知を出すか設定します。',
      nativas: 'Windows 通知',
      nativasAyuda:
        'WolfCore Dev が前面にないときのみ表示。同じ種類は最大5分に1回です。',
      tiposTitulo: '通知の種類',
      versionesTitulo: 'サービス別の新バージョン通知',
      versionesAyuda:
        'オフにしたサービスの新バージョン通知は停止します（「バージョン」タブには引き続き更新が表示されます）。',
      versionesDe: (s: string) => `${s} の新バージョンを通知`,
      tipos: {
        'servicio-caido': 'サービスがエラーで停止したとき',
        'puerto-ocupado': 'サービス起動時にポートが使用中だったとき',
        'certificado-por-vencer': '証明書の有効期限が近いとき',
        'tunel-caido': 'トンネルが切断されたとき',
        'proceso-error': 'プロジェクトプロセスが失敗したとき',
        'proceso-terminado': 'プロジェクトプロセスが終了したとき',
        'receta-terminada': 'プロジェクトレシピが完了したとき',
        doctor: '診断 (Doctor)',
        'contenedor-detenido': 'コンテナが停止したとき',
        'version-nueva': 'インストール済みサービスに新バージョンがあるとき',
      } as Record<string, string>,
      errorGuardar: '通知設定を保存できませんでした',
    },
    versionPrograma: 'アプリバージョン',
    https: {
      titulo: 'HTTPS',
      autoridad: 'ローカル認証局 (CA)',
      autoridadAyuda:
        'WolfCore Dev は独自の認証局で .test サイトの証明書に署名します。管理者権限なしで Windows ユーザーストアにインストールされます。',
      instalada: 'Windows にインストール済み',
      noInstalada: '未インストール',
      instalar: 'CA をインストール',
      reinstalar: '再インストール',
      quitar: '削除',
      instaladaOk: 'HTTPS CA をインストールしました',
      quitadaOk: 'HTTPS CA を削除しました',
      cancelado: 'Windows の確認がキャンセルされました。変更はありません。',
      fallo: 'HTTPS CA を変更できませんでした',
      quitarTitulo: 'HTTPS CA を削除しますか？',
      quitarTexto:
        '再インストールするまで、ブラウザは .test サイトの証明書を信頼しなくなります。',
      puerto: 'HTTPS ポート',
      puertoAyuda:
        '通常は 443 です。他プログラムが使用中の場合は 1024〜65535 を指定してください（URL にポートが付きます）。',
      puertoRango: '443 または 1024〜65535 の数値を指定してください',
      puertoGuardado: (p: number) => `HTTPS はポート ${p} を使用するようになりました`,
      puertoAplicarFallo: 'ポートは保存されましたが、Nginx が新設定を拒否しました',
      firefox:
        'Firefox は独自の証明書ストアを使います。CA を信頼させるには about:config を開いて次を有効にしてください:',
    },
    herramientas: {
      titulo: 'ターミナルとツール',
      phpPorDefecto: '既定の PHP',
      phpPorDefectoAyuda:
        'ターミナルおよび WolfCore Dev ショートカットで使う php と composer のバージョン。「ターミナル」は各プロジェクトの PHP を使います。',
      phpMasReciente: 'インストール済みの最新バージョン',
      phpSinInstalar: 'バージョンを選ぶには「サービス」で PHP をインストールしてください',
      phpGuardado: '既定の PHP を更新しました',
      path: 'ユーザー PATH',
      pathAyuda:
        'WolfCore Dev の php と composer をユーザー PATH に追加し、どのターミナルからでも使えるようにします。',
      pathActivo: 'PATH に追加済み',
      pathInactivo: 'PATH 未登録',
      pathAgregar: 'ユーザー PATH に追加',
      pathQuitar: 'PATH から削除',
      pathTitulo: 'PATH を更新しました',
      pathAviso: '変更を反映するには新しいターミナルを開いてください（開いているターミナルには反映されません）。',
      pathQuitarTitulo: 'WolfCore Dev を PATH から削除しますか？',
      pathQuitarTexto:
        '新しいターミナルでは WolfCore Dev の php と composer が使えなくなります。開いているターミナルは変わりません。',
      adminer: 'Adminer ポート',
      adminerAyuda: 'Adminer はこのPC上のみ、この固定アドレスで提供されます。',
      terminal: '既定のターミナル',
      terminalSistema: 'システム既定 (PowerShell)',
      terminalAyuda:
        'プロジェクトの「ターミナル」で開きます。プロジェクト固有の環境変数（PHP の PATH やエージェントのキー）が必要な場合、「Windows Terminal」を選ぶと既定ターミナル内で PowerShell を起動します（既に開いている Windows Terminal には変数が渡りません）。',
      terminalGuardada: '既定のターミナルを更新しました',
      editor: '既定のエディター',
      editorPrimero: '最初に検出されたエディター',
      editorAyuda:
        'プロジェクトの「エディター」や検索・エラーの「エディターで開く」で使います。VS Code、Cursor、Windsurf、PhpStorm、Sublime Text、Zed、Notepad++ を自動検出します。',
      editorGuardado: '既定のエディターを更新しました',
      editorNinguno: 'エディターが検出されませんでした。',
    },
  },
  /* ───────────── HTTPS, terminal y FTP en sitios; Correo; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS 有効',
    candadoAyuda: 'このサイトは WolfCore Dev の証明書で HTTPS にも応答します。',
    redirige: 'http → https へリダイレクト',
    abrirHttp: (dominio: string) => `http://${dominio} をブラウザで開く`,
    abrirHttps: (url: string) => `${url} をブラウザで開く`,
    pendiente: (motivo: string) => `HTTPS 保留中: ${motivo}`,
    pendienteCorto: 'HTTPS 保留中',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `ポート ${puerto} は ${nombre} (PID ${pid}) が使用中です。`,
    sinAutoridad: '認証局がありません。「設定」からインストールしてください。',
    pendienteAyuda:
      'サイトは引き続き HTTP で動作します。そのプログラムを終了するか、「設定」で別の HTTPS ポートを選択してください。',
    sinConfianza: 'CA 未インストール',
    sinConfianzaAyuda:
      'WolfCore Dev の認証局をインストール（設定 → HTTPS）するまでブラウザにセキュリティ警告が表示されます。',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'HTTPS でも配信する',
    httpsAyuda: 'ドメインとエイリアス用に WolfCore Dev が署名した証明書を使用します。',
    redirigir: 'HTTPS へリダイレクト',
    redirigirAyuda: 'http へのアクセスを https へ転送します。公開トンネルには影響しません。',
    redirigirDeshabilitado: '先に HTTPS を有効にしてください',
    sinAutoridadTitulo: 'HTTPS 認証局が未インストールです',
    sinAutoridadTexto:
      '未インストールの場合、ブラウザにセキュリティ警告が表示されます。Windows がインストール確認を求めます。',
    instalar: 'CA をインストール',
    instalada: 'HTTPS CA をインストールしました',
    cancelado: 'Windows の確認がキャンセルされました。変更はありません。',
    fallo: 'HTTPS CA をインストールできませんでした',
  },
  terminalSitio: {
    boton: 'ターミナル',
    ayuda: 'プロジェクトの PHP と Composer を PATH に含めてフォルダ内でターミナルを開きます。',
    elegir: 'ターミナルを選択',
    predeterminada: '既定',
  },
  editorSitio: {
    ayuda: '既定のエディターでプロジェクトフォルダを開きます。',
    elegir: 'アプリを指定して開く…',
    predeterminada: '既定',
    sustituido: (pred: string, usado: string) =>
      '{pred} は未インストールのため {usado} で開きました。'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'エディターを開けませんでした',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `共有 PHP ${rama}`,
    propio: (rama: string) => `このサイト専用の PHP ${rama}`,
    conXdebug: 'Xdebug 有効',
    mostrar: 'PHP 設定',
    ocultar: 'PHP 設定を隠す',
    cargando: 'PHP 設定を読み込み中…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} は停止中です。このサイト専用の PHP も連動して起動します。`,
    ajustesTitulo: '専用 php.ini',
    ajustesAyuda: (rama: string) =>
      `このサイトのみ PHP ${rama} の php.ini に追加されます。設定がある（または Xdebug 有効）場合、このサイトは 1〜2 プロセスの専用 PHP を使い、他のサイトは変わりません。`,
    clave: 'ディレクティブ',
    valor: '値',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `${clave || '設定'}を削除`,
    agregar: '設定を追加',
    guardarAjustes: 'テストして保存',
    ajustesGuardados: 'サイトの PHP 設定を適用しました',
    sinAjustes: '専用設定なし: 共有 php.ini をそのまま使用します。',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `${dominio} の Xdebug`,
    xdebugAyuda:
      'このサイト専用の PHP のみに読み込まれ、共有 PHP には読み込まれないため他のサイトの速度に影響しません。',
    xdebugDescarga:
      'この PHP バージョンには Xdebug が未インストールです。カタログからダウンロードされます (xdebug.org、SHA-256 検証済み)。',
    modo: 'モード',
    modos: {
      debug: 'debug（ブレークポイント）',
      develop: 'develop（詳細なエラー）',
      coverage: 'coverage（カバレッジ）',
      profile: 'profile（プロファイル）',
      trace: 'trace（トレース）',
    },
    puerto: 'エディターポート',
    inicio: '接続タイミング',
    inicioTrigger: 'XDEBUG_TRIGGER 時のみ',
    inicioYes: 'すべてのリクエスト',
    inicioAyuda:
      '「XDEBUG_TRIGGER 時のみ」では、Cookie・GET/POST パラメーター・ブラウザ拡張 (Xdebug Helper) がある場合にのみデバッグを開始します。',
    guardarXdebug: 'Xdebug を保存',
    xdebugPuertoEnUso: (puerto: number) =>
      `ポート ${puerto} は WolfCore Dev の PHP または他サービスが使用中です。エディターが待ち受けできないため別のポート（通常 9003）を選んでください。`,
    xdebugGuardado: 'サイトの Xdebug を適用しました',
    quitarXdebug: 'Xdebug を削除',
    quitarXdebugTitulo: 'このサイトから Xdebug を削除しますか？',
    quitarXdebugTexto:
      '設定が削除されます。他に専用設定がなければ共有 PHP に戻ります。プロジェクトの launch.json は変更されません。',
    xdebugQuitado: 'サイトから Xdebug を削除しました',
    ide: 'エディター',
    generarLaunch: 'launch.json を生成',
    launchTitulo: 'プロジェクトの .vscode/launch.json',
    launchNuevo:
      'この設定で .vscode/launch.json を作成します（VS Code PHP Debug 用、127.0.0.1 のみ待ち受け）。',
    launchFusion:
      '既存の launch.json があります。WolfCore の設定のみ追加または更新し、他設定とコメントは維持します。事前にデータフォルダへ日付付きバックアップを保存します。',
    launchSinCambios: 'launch.json にはすでにこの設定が含まれています。',
    launchEscribir: 'launch.json を書き込む',
    launchCreado: '.vscode に launch.json を作成しました',
    launchActualizado: (respaldo: string) => `launch.json を更新しました。直前のコピー: ${respaldo}`,
    phpStorm: 'PhpStorm 向け設定',
    copiarPhpStorm: 'PhpStorm 設定をコピー',
    errorNginx: (salida: string) => `Nginx が変更を拒否したため元に戻しました。${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: '自動生成 vhost',
    conReglas: 'カスタムルールあり',
    manualResumen: '手動記述 vhost（自動再生成されません）',
    mostrar: 'vhost を編集',
    ocultar: 'vhost を隠す',
    cargando: 'vhost を読み込み中…',
    reglasTitulo: 'カスタムルール',
    reglasAyuda:
      'このサイトの server ブロック内に挿入されます。適用前に設定全体のコピーで nginx -t を実行し、失敗した場合は変更しません。',
    reglasEtiqueta: 'Nginx カスタムルール',
    reglasPlaceholder: '# 例: client_max_body_size 256m;',
    snippetsTitulo: 'スニペット',
    insertar: (titulo: string) => `挿入: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': '静的ファイルキャッシュ',
      'limite-subida': 'アップロード上限',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'セキュリティヘッダー',
      websocket: 'WebSocket プロキシ',
      gzip: 'gzip 圧縮',
      ocultos: '隠しファイルを拒否',
    },
    aplicar: 'テストして適用',
    descartar: '変更を破棄',
    aplicado: 'vhost を適用し Nginx をリロードしました',
    aplicadoApagado: 'vhost を保存しました。Nginx 起動時に適用されます',
    fallo: 'Nginx が変更を拒否したため vhost は変更されませんでした',
    salidaTitulo: 'nginx -t の出力',
    desactivado:
      '設定適用時に Nginx がこのサイトのカスタムルールを拒否したため vhost から除外されました（内容は保存されています）。修正して再適用してください。',
    avisoDestino: (destino: string, linea: number) =>
      `${linea} 行目: トラフィックが別ホスト（${destino}）へ送信されます。意図どおりか確認してください。`,
    generadoTitulo: '自動生成 vhost（読み取り専用）',
    avanzadoTitulo: '詳細モード',
    avanzadoInterruptor: 'vhost 全体を手動で記述する',
    avanzadoAyuda:
      '自動生成 vhost を置き換えます。以降 WolfCore Dev は再生成しないため、ドメイン・HTTPS・ポート・フォルダの変更時は手動調整が必要です。このサイトのドメインとポートのみ使用できます。',
    avanzadoActivarTitulo: 'vhost を手動記述にしますか？',
    avanzadoActivarTexto:
      '現在の自動生成 vhost をベースにします。有効中はサイト変更（ドメイン、HTTPS、PHP など）が vhost に反映されません。',
    avanzadoActivar: '手動記述にする',
    manualEtiqueta: 'サイトの完全な vhost',
    aplicarManual: 'vhost をテストして適用',
    volverGenerado: '自動生成 vhost に戻す',
    volverGeneradoTitulo: '自動生成 vhost に戻しますか？',
    volverGeneradoTexto:
      '手動記述した vhost は履歴に保存され、WolfCore Dev がカスタムルール込みで vhost を再生成します。',
    historial: '履歴',
    historialTitulo: 'vhost の過去バージョン',
    historialVacio: '過去バージョンはまだありません。',
    historialAyuda:
      '変更前の最新 10 バージョンを保存します。復元時も nginx -t で検証されます。',
    modoReglas: 'ルール付き自動生成',
    modoManual: '手動記述',
    restaurar: '復元',
    restaurarTitulo: 'このバージョンを復元しますか？',
    restaurarTexto: (fecha: string) =>
      `vhost を ${fecha} の状態に戻します。現在のバージョンは履歴に残ります。`,
    restaurado: 'バージョンを復元しました',
  },
  lan: {
    etiqueta: 'ローカルネットワーク',
    interruptor: (dominio: string) => `${dominio} をローカルネットワークで共有`,
    apagadoAyuda: 'スマートフォンや同じネットワーク内の別端末からこのサイトを開けます。',
    sinNginx: 'ローカルネットワークで共有するには Nginx を起動してください。',
    sinRed: 'ローカルネットワーク（Wi-Fi または有線LAN）に接続されていません。',
    activo: 'ローカルネットワークで公開中',
    abriendo: '共有を開始中…',
    cerrando: '共有を停止中…',
    abrirUrl: 'このPCで開く',
    copiarUrl: 'アドレスをコピー',
    verQr: 'QRコードを表示',
    qrTitulo: (dominio: string) => `ローカルネットワーク上の ${dominio}`,
    qrAviso: '同じネットワークに接続したスマートフォンでQRコードをスキャンしてください。',
    confirmarTitulo: 'ローカルネットワークで共有',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} はこのPC（${ip}）と同じネットワーク上の任意の端末からパスワードなしで閲覧可能になります。スイッチをオフにするか、WolfCore Dev を終了・再起動すると共有は終了します。`,
    ipEtiqueta: 'ネットワーク（このPCのIP）',
    https: 'HTTPS を使用',
    httpsAyuda:
      'HTTPS を使うにはスマートフォンで WolfCore Dev の CA を信頼する必要があります（「スマホに CA をインストール」）。オフの場合は HTTP です。',
    httpsObligatorio: 'このサイトは HTTPS へリダイレクトするため HTTPS で共有されます。',
    compartir: 'ネットワークで共有',
    tituloError: 'ローカルネットワークで共有できませんでした',
    caBoton: 'スマホに CA をインストール',
    firewallTitulo: 'スマートフォンで開けませんか？',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} には実データが含まれるため、確認してもローカルネットワークでは共有できません。`,
    redPublica:
      'このネットワークは Windows で「パブリック」に設定されています。ファイアウォールが接続を遮断し、コマンドもプライベートネットワークのみ開きます。信頼できるネットワークならプライベートに変更してください。',
    firewallTexto:
      'WolfCore Dev はファイアウォールを変更しません。プログラム全体を許可する Windows の警告は承認せず、管理者権限の PowerShell でこのポート専用コマンド（ローカルサブネット・プライベートのみ）を実行してください。パブリックネットワークでは開かず、既存のブロックルールが優先されます。',
    copiarComando: 'コマンドをコピー',
  },
  caMovil: {
    titulo: 'スマホに CA をインストール',
    intro:
      '同じネットワーク上のスマートフォンでQRコードをスキャンし、WolfCore Dev 認証局の証明書をダウンロードしてください。このファイルのみ配信され、リンクは自動で閉じます。',
    abriendo: 'リンクを開いています…',
    expira: (minutos: number) => `リンクは ${minutos} 分後に自動で閉じます。`,
    expirado: 'リンクは閉じられました。',
    reabrir: 'もう一度開く',
    android: 'Android',
    ios: 'iPhone / iPad',
    pasosAndroid: [
      'QRコードをスキャンするかスマホのブラウザでアドレスを開き、ファイルをダウンロードします。',
      '設定 > セキュリティとプライバシー > その他のセキュリティ設定 > 暗号化と認証情報 > 証明書のインストール > CA 証明書 を開きます（機種により名称が異なります）。',
      '信頼する前に、スマホに表示される SHA-256 フィンガープリントとこの画面の値を照合してください。一致しない場合はインストールしないでください。',
      'ダウンロードしたファイルを選び警告を承認します（Android ではすべての CA で表示される通常の警告です）。',
    ],
    pasosIos: [
      'Safari でアドレスを開き、プロファイルのダウンロードを許可します。',
      '設定 > ダウンロード済みのプロファイル を開き、詳細の SHA-1 フィンガープリントとこの画面を照合してください。一致しない場合はインストールしないでください。一致すればインストールします。',
      '設定 > 一般 > 情報 > 証明書信頼設定 を開き、WolfCore Dev CA の完全な信頼をオンにします。',
    ],
    aviso:
      'CA をインストールすると、その CA が署名したすべての証明書をスマホが信頼します。ご自身の端末のみに入れ、不要になったら削除してください。',
    firewallAviso: (puerto: number) =>
      'スマートフォンからリンクへ接続するにはポート ' +
      puerto +
      ' を開く必要があります（ローカルサブネット・プライベートネットワークのみ）。Windows の全体許可は承認せず、管理者 PowerShell でこのコマンドを実行してください。パブリックネットワークでは開かず、既存のブロックルールが優先されます。',
    huellas: '証明書のフィンガープリント',
    tituloError: 'CA リンクを開けませんでした',
  },
  dialogoQr: {
    descargar: 'PNG をダウンロード',
    descargado: 'QRコードを保存しました',
    largo: 'テキストが長すぎてQRコードにできません。',
    generando: 'QRコードを生成中…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `${dominio} の FTP アクセス`,
    apagadoAyuda: 'FTP でこのサイトのフォルダへファイルをアップロードできるようにします。',
    activoAyuda: 'アクセス有効。',
    soloLecturaEtiqueta: '読み取り専用',
    mostrarDatos: 'FTP 情報を表示',
    ocultarDatos: 'FTP 情報を隠す',
    host: 'サーバー',
    puerto: 'ポート',
    usuario: 'ユーザー',
    clave: 'パスワード',
    mostrarClave: 'パスワードを表示',
    ocultarClave: 'パスワードを隠す',
    copiarDato: (dato: string) => `${dato}をコピー`,
    cargando: 'FTP 情報を読み込み中…',
    regenerar: 'パスワードを再生成',
    regenerarTitulo: 'FTP パスワードを再生成しますか？',
    regenerarTexto:
      '現在のパスワードは使えなくなり、このサイトの接続は切断されます。FTP クライアント側で更新してください。',
    regenerada: 'FTP パスワードを再生成しました',
    soloLectura: '読み取り専用',
    soloLecturaAyuda: 'ダウンロードは可能ですが、ファイルのアップロード・変更・削除はできません。',
    soloLecturaActivado: 'このサイトの FTP は読み取り専用になりました',
    soloLecturaDesactivado: 'このサイトの FTP は書き込み可能になりました',
    activado: 'FTP アクセスを有効にしました',
    desactivarTitulo: 'このサイトの FTP アクセスを削除しますか？',
    desactivarTexto:
      'パスワードが削除され、開いている接続は閉じられます。サイトのフォルダは変更されません。',
    desactivar: 'アクセスを削除',
    desactivado: 'FTP アクセスを削除しました',
    redLocalAviso:
      'FTP はローカルネットワークからの接続を受け付け、パスワードとファイルを暗号化せずに送信します。信頼できるネットワークでのみ使用してください。',
    redLocalHost: 'またはネットワーク上のこのPCのIP',
    servidorApagado: 'FTP サーバーが停止中です。起動するまで誰も接続できません。',
    encender: 'FTP を起動',
    urlEtiqueta: 'アドレス',
    urlAyuda: 'アドレスにパスワードは含まれません。接続時に入力します。',
    abrirUrl: 'FTP クライアントで開く',
    copiarUrl: 'FTP アドレスをコピー',
    verQr: 'アドレスのQRコードを表示',
    qrTitulo: 'このサイトの FTP アドレス',
    qrAviso: 'QRコードにはアドレスのみが含まれ、パスワードは含まれません。',
  },
  correo: {
    descripcion:
      'キャッチャーはプロジェクトが送信するメールを捕捉し、外部へ送信せずに確認できるようにします。このPC（127.0.0.1）のみで待ち受け、同時に起動できるのは1つだけです。',
    seccionCaptadores: 'ローカルキャッチャー',
    seccionProveedores: 'リモート SMTP プロバイダー',
    proveedores: {
      descripcion:
        '実際の SMTP プロバイダーは本物のメールを送信します。公開前の送信テストに使用してください。キーはこのPCに暗号化して保存され、表示されません。',
      agregar: 'プロバイダーを追加',
      vacio:
        'プロバイダーはまだ追加されていません。Mailtrap、Resend、Brevo、Mailgun、SendGrid、Postmark、Amazon SES、SMTP2GO、Gmail から選ぶか独自に入力してください。',
      errorLista: 'プロバイダー一覧を読み取れませんでした',
      tarjeta: {
        servidor: 'サーバー',
        usuario: 'ユーザー',
        clave: 'キー',
        sinClave: 'キーなし',
        claveIlegible: '保存済み（読み取り不可）',
        red: 'ネットワーク',
        redLocal: 'このPCまたはローカルネットワークのサーバー（確認済み）',
        editar: '編集',
        borrar: '削除',
        borrarTitulo: (n: string) => `${n} を削除しますか？`,
        borrarTexto:
          'プロバイダーと保存済みキーが削除されます。使用中のプロジェクトはローカルキャッチャーに戻りますが、.env は変更されないため MAIL_* 変数（およびキー）は残ります。各 .env のメール設定を書き換えてください。',
        borrado: (n: string) => `${n} を削除しました`,
        usar: 'プロジェクトで使用',
        destino: 'テスト送信先アドレス',
        destinoPlaceholder: 'your-address@example.com',
        probar: '送信テスト',
        probando: '送信中…',
        probarAyuda:
          '検証済みの暗号化接続で実際のメールを1通だけ送信します（最大15秒に1回）。',
        sinClaveParaProbar: '送信テストを行うにはプロバイダーのキーを保存してください。',
        hostLocal: 'このサーバー名はこのPCまたはローカルネットワークに解決されます。',
        confirmarRed: 'ローカルネットワークを確認',
        enviado: (para: string) => `${para} にメールを送信しました。受信箱を確認してください。`,
        fallos: {
          'correo.auth': 'プロバイダーがユーザーまたはキーを拒否しました。',
          'correo.conexion': '接続できませんでした。ホストとポートを確認してください。',
          'correo.tls':
            '暗号化接続が無効です（証明書・ホスト名・STARTTLS）。メールは送信されていません。',
          'correo.rechazado':
            'サーバーがメッセージまたはアドレスを拒否しました。送信元を確認してください（多くのプロバイダーは検証済みの送信元・ドメインのみ受け付けます）。',
          'correo.plazo': 'サーバーが時間内に応答しませんでした（20秒）。',
        },
      },
      dialogo: {
        nuevo: 'SMTP プロバイダーを追加',
        editar: (n: string) => `${n} を編集`,
        preset: 'プロバイダー',
        presetOtro: 'その他（手動入力）',
        presetAyuda: 'ホストとポートは各プロバイダーの公式ドキュメントに基づいています。',
        documentacion: 'ドキュメントを見る',
        region: 'リージョン',
        nombre: '名前',
        nombreObligatorio: '名前を入力してください。',
        host: 'サーバー (ホスト)',
        hostAyuda: 'ホスト名または IP のみ（smtp:// やポートは不要）。',
        hostObligatorio: 'サーバーを入力してください。',
        puerto: 'ポート',
        seguridad: '暗号化',
        seguridadAyuda:
          '常に有効な証明書による暗号化接続を必須とし、平文へダウングレードしません。',
        tls: '直接 TLS（ポート 465）',
        starttls: 'STARTTLS（ポート 587）',
        usuario: 'ユーザー',
        usuarioObligatorio: 'ユーザーを入力してください。',
        usuarioFijoAyuda: 'このプロバイダーは常にこのユーザーを使用します。キーはご自身のアカウントのものです。',
        clave: 'SMTP キー',
        claveGuardada: (f: string) => `保存済み: ••••${f}`,
        claveNueva: '保存するキーを入力してください',
        claveAyuda:
          'このPCに暗号化して保存され、再表示はされません。変更しない場合は空欄にしてください。',
        remitente: 'テスト送信元（任意）',
        remitenteAyuda:
          '多くのプロバイダーは検証済みの送信元やドメインのみ許可します。空欄の場合は送信先アドレス自体が送信元になります。',
        claveSinEspacios:
          'プロバイダーから発行されたキーをそのまま貼り付けてください（内部の空白は保持されます）。',
        borrarClave: 'キーを削除',
        borrarClaveTitulo: (n: string) => `${n} のキーを削除しますか？`,
        borrarClaveTexto: '保存済みキーが削除されます。プロバイダー自体は一覧に残ります。',
        claveBorrada: 'キーを削除しました',
        guardar: '保存',
        guardado: (n: string) => `${n} を保存しました`,
        redLocalTitulo: 'このPCまたはローカルネットワーク上のサーバー',
        redLocalTexto: (h: string) =>
          `${h} はこのPCまたはローカルネットワークを指しています。確認された場合のみ接続します。ご自身のサーバーですか？`,
        redLocalConfirmar: 'はい、自分のサーバーです',
        cambiaTitulo: '別のサーバーへキーを送信',
        cambiaTexto: (h: string) =>
          `このプロバイダーには保存済みキーがあり、サーバーまたはユーザーが変更されました。キーは ${h} へ送信されます。続行しますか？`,
        cambiaConfirmar: 'はい、続行する',
      },
      env: {
        titulo: (n: string) => `プロジェクトで ${n} を使用`,
        proyecto: 'プロジェクト',
        sinProyectos: 'プロジェクトがまだありません。',
        yaUsaSmtp: 'このプロジェクトはすでに SMTP プロバイダーを使用しています。',
        volverCaptador: 'ローカルキャッチャーに戻す',
        volvio: (n: string) =>
          `${n} はローカルキャッチャーに戻りましたが、.env は変更されていないためプロバイダーの MAIL_* 変数（およびキー）は残っています。メール設定を書き換えてください。`,
        incluirClave: 'キーも .env に書き込む',
        incluirClaveAyuda: '未選択の場合、MAIL_PASSWORD は含まれず手動で追記します。',
        sinClaveGuardada: 'プロバイダーにキーが保存されていません。',
        vista: '.env への変更（キーはマスク表示）',
        textoPlano:
          'キーはプロジェクトの .env に平文で保存されます。このフォルダやリポジトリへアクセスできる誰もが閲覧できます。',
        claveTitulo: 'キーを .env に書き込む',
        claveTexto:
          'キーはプロジェクトの .env に平文で書き込まれます。リポジトリに公開せず自分専用のフォルダである場合のみ使用してください。',
        claveConfirmar: '理解しました、キーを含める',
        agregarGitignore: '.env を .gitignore に追加',
        gitignoreTitulo: '.gitignore を変更',
        gitignoreTexto:
          'プロジェクトの .gitignore に .env 行を追加します（事前バックアップを作成）。',
        gitignoreConfirmar: '追加する',
        versionadoTitulo: 'Git が .env を追跡しています',
        versionadoTexto:
          '次のコミットで値がアップロードされる恐れがあります。git rm --cached .env で追跡を外してください。',
        desconocidoTitulo: 'Git の状態を確認できませんでした',
        desconocidoTexto: 'このプロジェクトの .env が Git で追跡されているか確認できませんでした。',
        aceptarVersionado: 'それでも書き込む',
        aceptarTitulo: '追跡中の .env に書き込む',
        aceptarTexto:
          'Git が .env を追跡している場合、これらの変数がリポジトリに含まれる可能性があります。書き込みますか？',
        aceptarConfirmar: 'それでも書き込む',
        confirmarTitulo: '.env に書き込む',
        confirmarTexto: (ruta: string) =>
          `${ruta} のバックアップを保存し、キーなしで MAIL_* 変数を追加します。`,
        confirmarTextoClave: (ruta: string) =>
          `${ruta} のバックアップを保存し、平文のキーを含む MAIL_* 変数を追加します。`,
        confirmar: '書き込む',
        escribir: '.env に書き込む',
        escrito: (n: string) => `${n} はこのプロバイダーで送信するようになりました`,
      },
    },
    estado: '状態',
    smtp: 'SMTP',
    buzon: 'Web受信箱',
    abrirBuzon: '受信箱を開く',
    noLeidos: '未読',
    noLeidosValor: (n: number) => plural(n, '件の未読メール'),
    noLeidosError: '受信箱を読み取れませんでした',
    actualizar: 'メール数を再取得',
    actualizaSolo: 'この画面が開いている間、15秒ごとに自動更新されます。',
    env: 'Laravel 用 .env ブロック',
    envAyuda: (captador: string) =>
      `プロジェクトの .env に貼り付けてください。メールは暗号化・認証なしで ${captador} に届きます。`,
    copiarEnv: 'ブロックをコピー',
    irAServicios: 'サービスへ移動',
    cargando: 'キャッチャーを読み込み中…',
    errorLista: 'キャッチャー一覧を読み取れませんでした',
    captador: {
      opcional: '任意',
      elegido: 'プロジェクトのメールを受信中',
      noInstalado: '未インストール',
      instalar: 'インストール',
      usar: 'これを使う',
      apagar: '停止',
      iniciando: '起動中…',
      avisoMantenimiento:
        'このキャッチャーはメンテナンスがほぼ止まっています。Mailpit または smtp4dev を推奨します。',
    },
    notaDescartados:
      'MailHog と MailDev は提供していません。MailHog はダウンロード検証用チェックサムを公開しておらず、MailDev は npm のみのためです。検証できないファイルはダウンロードしません。',
    notaHost:
      'Web受信箱は 127.0.0.1 のみで応答しますが、起動中は悪意あるWebサイトから DNS リバインディングで読み取られる恐れがあります。smtp4dev と Papercut は不正な Host ヘッダーを拒否し、Mailpit は専用シークレットパスで保護されます。Inbucket には保護がないため未使用時は停止してください。',
  },
  ia: {
    descripcion:
      'クラウド AI プロバイダーと Ollama によるローカルモデルを管理します。キーはこのPCに暗号化保存され、表示されません。',
    nube: {
      titulo: 'クラウド AI',
      agregar: 'プロバイダーを追加',
      vacio:
        'プロバイダーはまだ追加されていません。OpenAI、Anthropic、Gemini、Hermes (Nous) または OpenAI 互換プロバイダーを追加してください。',
      errorLista: 'プロバイダー一覧を読み取れませんでした',
    },
    local: { titulo: 'ローカル AI (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'OpenAI 互換',
    } as Record<string, string>,
    tarjeta: {
      clave: 'キー',
      sinClave: 'キーなし',
      claveIlegible: '保存済み（読み取り不可）',
      url: 'ベースURL',
      modeloPorDefecto: '既定のモデル',
      ninguno: 'なし',
      probarConexion: '接続テスト',
      probarConexionAyuda: 'プロバイダーのモデル一覧を取得します。トークンは消費しません。',
      probando: 'テスト中…',
      conectado: (ms: number, n: number) => `接続済み · ${ms} ms · ${n} モデル`,
      verModelos: (n: number) => `${n} モデルを表示`,
      soloGratuitos: '無料のみ',
      fallo: '接続できませんでした',
      probarMensaje: 'メッセージをテスト',
      probarMensajeAyuda:
        'モデルが応答するか確認するため短い固定メッセージを送信します。少量のトークンを消費します。',
      elegirModelo: 'テスト用モデル',
      sinModelo: 'モデルを選ぶには接続テストを行うか既定モデルを設定してください。',
      enviando: '送信中…',
      respuesta: (ms: number) => `${ms} ms で応答`,
      tokens: (entrada: number, salida: number) =>
        `入力 ${entrada} トークン、出力 ${salida} トークン`,
      usar: 'プロジェクトで使用',
      editar: '編集',
      borrar: '削除',
      acciones: (nombre: string) => `${nombre} の操作`,
    },
    costo: {
      titulo: 'メッセージをテスト',
      texto: (modelo: string, proveedor: string) =>
        `${proveedor} のモデル ${modelo} に短い固定メッセージを送信します。アカウントのトークンを消費します（応答は 16 トークンで打ち切られ、通常はごくわずかです）。`,
      enviar: 'メッセージを送信',
    },
    dialogo: {
      nuevo: 'AI プロバイダーを追加',
      editar: (nombre: string) => `${nombre} を編集`,
      tipo: '種別',
      preset: '互換プロバイダー',
      presetAyuda: '名前とURLを自動入力します（変更可能です）。',
      presetOtro: 'その他',
      documentacion: 'ドキュメントを見る',
      nombre: '名前',
      urlBase: 'ベースURL',
      urlAyuda: '空欄 = 公式URL。https:// のみ、または 127.0.0.1 / [::1] 向け http:// (LM Studio)。',
      urlObligatoria: '互換プロバイダーのベースURLを入力してください。',
      modelo: '既定のモデル（任意）',
      modeloAyuda: '.env ブロック (AI_MODEL) とテストメッセージで使用されます。',
      clave: 'API キー',
      claveNueva: 'キーを貼り付け',
      claveGuardada: (final: string) =>
        `キーが保存されています (${final})。置き換える場合のみ入力してください。`,
      claveAyuda:
        'このPCに暗号化保存され、再表示されません。末尾4文字のみ確認できます。',
      claveOpcional: 'ローカルサーバー (LM Studio) では任意です。',
      borrarClave: 'キーを削除',
      guardar: '保存',
      guardado: (nombre: string) => `${nombre} を保存しました`,
      urlCambiaTitulo: 'キーが別の URL に送信されます',
      urlCambiaTexto: (url: string) =>
        `このプロバイダーには保存済みキーがあり、今後は ${url} へ送信されます。信頼できるサーバーの場合のみ確認してください。`,
      urlCambiaConfirmar: '新しい URL にキーを送信する',
    },
    borrar: {
      claveTitulo: (nombre: string) => `${nombre} のキーを削除しますか？`,
      claveTexto:
        'このPCからキーが削除されます。書き込んだ .env は変更されないため、キーを失効させた場合は各ファイルも更新してください。',
      proveedorTitulo: (nombre: string) => `${nombre} を削除しますか？`,
      proveedorTexto:
        'プロバイダーと保存済みキーが削除されます。プロジェクトの .env は変更されません。',
      respaldos: (n: number) =>
        `このキーが平文で残っている ${n} 件のプロジェクトの .env バックアップも削除する`,
      respaldosAyuda:
        'WolfCore Dev は書き込み前にプロジェクト外へ .env バックアップを保存します。削除は元に戻せません。',
      claveBorrada: 'キーを削除しました',
      proveedorBorrado: (nombre: string) => `${nombre} を削除しました`,
      respaldosBorrados: (n: number) => `${n} 件のプロジェクトの .env バックアップを削除しました`,
    },
    env: {
      titulo: (nombre: string) => `プロジェクトで ${nombre} を使用`,
      proyecto: 'プロジェクト',
      sinProyectos: '構成済みのプロジェクトがありません。',
      modelo: 'モデル (AI_MODEL)',
      modeloAyuda: '任意です。一覧から選ぶか入力してください。',
      vista: '.env に書き込まれるブロック（キーはマスク表示）',
      cargando: 'プレビューを準備中…',
      textoPlano:
        'キーはプロジェクトの .env に平文で保存されます。このフォルダにアクセスできる誰もが閲覧できます。',
      copiaPrevia:
        '書き込み前に現在の .env がプロジェクト外（WolfCore Dev のデータフォルダ）へバックアップされます。',
      sinClave: 'このプロバイダーにはキーが必要です。プロジェクトで使う前に保存してください。',
      gitignoreFalta: 'プロジェクトの .gitignore に .env が含まれていません。',
      gitignoreNoExiste: 'プロジェクトに .gitignore がありません。',
      gitignoreOk: '.gitignore は .env を無視しています。',
      agregarGitignore: '.env を .gitignore に追加',
      gitignoreTitulo: '.gitignore を変更',
      gitignoreTexto:
        'プロジェクトの .gitignore に .env 行を追加（または新規作成）します（事前バックアップあり）。',
      gitignoreConfirmar: '.gitignore に追加',
      versionadoTitulo: 'Git がこのプロジェクトの .env を追跡しています',
      versionadoTexto:
        '.gitignore に書いても次のコミットでキーがアップロードされます。書き込む前に追跡を解除してコミットしてください:',
      desconocidoTitulo: 'Git が .env を追跡しているか確認できませんでした',
      desconocidoTexto:
        'Git が応答しませんでした（未インストールまたは未信頼フォルダ）。既にリポジトリに含まれている場合、次のコミットでキーが公開されます。次で確認してください:',
      aceptarVersionado: 'リスクを理解した上でキーを書き込む',
      aceptarTitulo: 'Git がキーを公開する可能性がある状態で書き込む',
      aceptarTexto:
        '.env がリポジトリに含まれる場合、次のコミットと履歴にキーが残ります。git rm --cached .env を実行済みか個人専用リポジトリの場合のみ続行してください。',
      aceptarConfirmar: 'リスクを承知して続行',
      conflictoTitulo: '.env には別の値で次の変数が定義されています',
      reemplazar: (claves: string) => `${claves} を置換`,
      reemplazarTitulo: '.env の変数を置換',
      reemplazarTexto: (claves: string) =>
        `.env 内の既存の ${claves} 行を削除し、WolfCore Dev のブロックに置き換えます。事前に現在の .env がバックアップされます。`,
      reemplazarConfirmar: '置換する',
      escribir: '.env に書き込む',
      confirmarTitulo: 'キーを平文で書き込む',
      confirmarTexto: (carpeta: string) =>
        `キーが暗号化されずに ${carpeta} へ書き込まれます。このファイルを共有したりリポジトリにアップロードしないでください。`,
      confirmar: 'キーを書き込む',
      escrito: (proyecto: string) => `${proyecto} の .env に AI ブロックを書き込みました`,
      copiarComando: 'コマンドをコピー',
    },
  },
  iaLocal: {
    descripcion:
      'Ollama を使ってこのPC上で動作する言語モデルです。データを外部に送信せずプロジェクトから利用できます。',
    sinInstalarTitulo: 'Ollama がインストールされていません',
    sinInstalar: 'このPCでモデルをダウンロードして使うには「サービス」からインストールしてください。',
    irAServicios: 'サービスへ移動',
    apagadoTitulo: 'Ollama は停止中です',
    apagado: 'モデルの表示・ダウンロード・テストを行うには起動してください。',
    iniciando: 'Ollama を起動中…',
    errorTitulo: 'Ollama を起動できませんでした',
    encender: 'Ollama を起動',
    verServicios: 'サービスで表示',
    modelos: 'インストール済みモデル',
    sinModelos: 'モデルはまだありません。下からダウンロードしてください。',
    errorModelos: 'モデル一覧を読み取れませんでした',
    recargar: '一覧を再読み込み',
    total: (n: number) => plural(n, '件のモデル'),
    espacio: '使用容量',
    espacioAyuda: 'データフォルダ内で全モデルが占める容量です。',
    probarDe: (modelo: string) => `${modelo} をテスト`,
    borrarDe: (modelo: string) => `${modelo} を削除`,
    borrarTitulo: (modelo: string) => `モデル ${modelo} を削除しますか？`,
    borrarTexto: (tamano: string) =>
      `ディスク容量 ${tamano} が解放されます。再度使う場合は再ダウンロードが必要です。`,
    borrado: (modelo: string) => `モデル ${modelo} を削除しました`,
    descargar: {
      titulo: 'モデルをダウンロード',
      campo: 'モデル名',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Ollama のモデル名 (ollama.com/library) を入力するか候補から選んでください。',
      sugerenciaAyuda: {
        'llama3.2': '汎用チャット・軽量',
        'qwen2.5-coder': 'プログラミング向け',
        mistral: '汎用チャット',
        'nomic-embed-text': '検索用埋め込み（ボット向け）',
      } as Record<string, string>,
      boton: 'ダウンロード',
      invalido: '英数字と . _ : / - のみ使用してください（例: llama3.2）',
      yaInstalado: 'そのモデルは既にインストールされています',
      enCurso: 'そのモデルは現在ダウンロード中です',
      confirmarTitulo: (modelo: string) => `${modelo} をダウンロードしますか？`,
      confirmarTexto:
        'モデルは数 GB（サイズにより 1 GB〜40 GB 超）になります。Ollama は開始前に容量を通知しませんが、進捗バーで確認できいつでもキャンセルできます。',
      confirmar: 'ダウンロード',
    },
    progreso: {
      fases: {
        preparando: '準備中…',
        descargando: 'ダウンロード中',
        verificando: '検証中',
        guardando: '保存中',
        listo: '完了',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} / ${total}`,
      cancelarDe: (modelo: string) => `${modelo} のダウンロードをキャンセル`,
      cancelando: 'キャンセル中…',
      listo: (modelo: string) => `${modelo} をダウンロードしました`,
      cancelado: (modelo: string) => `${modelo} のダウンロードをキャンセルしました`,
      error: (modelo: string) => `${modelo} をダウンロードできませんでした`,
      descartar: '閉じる',
      descartarDe: (modelo: string) => `${modelo} の通知を閉じる`,
    },
    prueba: {
      titulo: 'モデルをテスト',
      modelo: 'モデル',
      elegir: 'モデルを選択',
      prompt: 'メッセージ',
      placeholder: '短い質問を入力して Enter を押してください',
      enviar: '送信',
      respuesta: '応答',
      pensando: 'モデルが応答を生成中… 初回は読み込みのため時間がかかることがあります。',
      vacia: '（モデルからテキストが返りませんでした。）',
      sinModelos: 'テストするにはモデルをダウンロードしてください。',
    },
    conexion: {
      titulo: 'プロジェクトからの接続',
      base: 'Ollama ベースURL',
      openai: 'OpenAI 互換エンドポイント',
      env: '.env ファイル用ブロック',
      envAyuda:
        'Laravel や FastAPI ボットで利用できます。WolfCore Dev はプロジェクトを書き換えません。',
      copiarEnv: 'ブロックをコピー',
      copiarDato: (dato: string) => `${dato}をコピー`,
    },
    etapaB:
      'Hermes Agent、Claude Code、Codex はステージBでワンクリック接続できるようになります。',
  },
  proyectos: {
    titulo: 'プロジェクト',
    descripcion:
      '各プロジェクトは独自の .test サイト、セットアップレシピ、プロセスを持つフォルダです。',
    agregar: 'プロジェクトを追加',
    vacioTitulo: 'プロジェクトがまだありません',
    vacio:
      'GitHub リポジトリをクローンするかフォルダを選択してください。WolfCore Dev が種別を検出して段階的にセットアップします。',
    pasos: {
      porTipo: {
        'composer-install': 'PHP 依存関係をインストール (composer install)',
        'env-crear': '.env ファイルを作成',
        'key-generate': 'アプリケーションキーを生成',
        'bd-crear': 'データベースを作成',
        'bd-restaurar': 'バックアップを復元',
        migrar: 'データベースをマイグレーション',
        'storage-link': 'storage をリンク (storage:link)',
        'npm-ci': 'Node 依存関係をインストール (npm ci)',
        'npm-build': 'アセットをビルド (npm run build)',
        'python-venv': '仮想環境を作成 (.venv)',
        'pip-install': 'Python 依存関係をインストール (pip)',
        'pgvector-activar': 'データベースで pgvector を有効化',
        'sitio-crear': 'サイトを作成',
        comando: 'プロジェクトコマンド',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `サイト ${dominio} を作成` : 'サイトを作成'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `バックアップ ${archivo} を復元` : 'バックアップを復元',
      migrar: 'データベースをマイグレーション',
      migrarSemilla: 'マイグレーションとテストデータ投入 (--seed)',
      comando: (linea: string) => (linea ? `実行: ${linea}` : 'プロジェクトコマンド'),
    },
    estadoPaso: {
      pendiente: '待機中',
      corriendo: '実行中',
      listo: '完了',
      error: 'エラー',
      omitido: 'スキップ',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: '未セットアップ',
      corriendo: 'セットアップ中…',
      lista: '準備完了',
      error: '手順が失敗しました',
      cancelada: 'セットアップ中止',
      incompleta: 'セットアップ未完了',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'プロジェクトを追加',
      pestanas: { github: 'GitHub', url: 'Git URL', carpeta: 'フォルダ' },
      destino: '保存先フォルダ',
      destinoAyuda: (base: string) =>
        `${base} にクローンされます。別の場所にするには「フォルダを選択…」を使います。`,
      nombreCarpeta: 'フォルダ名',
      nombrePlaceholder: 'my-project',
      elegirDestino: 'フォルダを選択…',
      destinoPorDefecto: 'プロジェクトフォルダを使用',
      clonar: 'クローン',
      clonando: 'クローン中…',
      clonado: 'リポジトリをクローンしました',
      errorClonar: 'リポジトリをクローンできませんでした',
      sinCancelar:
        'クローンはここからは中断できません。完了までお待ちください（数分かかることがあります）。',
      sinGit: 'Git がインストールされていません。git-scm.com からインストールして再度開いてください。',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `GitHub CLI で ${usuario} として接続済み` : 'GitHub CLI で接続済み',
      estadoToken: 'パーソナルトークンで接続済み',
      estadoNinguna: 'GitHub 未接続',
      ayudaNinguna:
        'GitHub CLI でログイン（推奨）するか、コンテンツ読み取り権限のあるファイングレイントークンを使用してください。',
      instalarGh: 'GitHub CLI をインストール',
      instalandoGh: 'GitHub CLI をインストール中…',
      ghInstalado: 'GitHub CLI をインストールしました。ログインしてください。',
      iniciarSesion: 'ログイン',
      sesionAbierta:
        'ログインウィンドウが開きました。完了したら「再確認」を押してください。',
      comprobar: '再確認',
      usarToken: 'トークンを使用',
      token: 'GitHub パーソナルトークン',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'このPCに暗号化して保存され、再表示やプロジェクトへの書き込みは行われません。',
      guardarToken: 'トークンを保存',
      tokenGuardado: 'トークンを保存しました',
      quitarToken: 'トークンを削除',
      tokenQuitado: 'トークンを削除しました',
      buscar: 'リポジトリを検索',
      cargando: 'リポジトリを読み込み中…',
      sinRepos: 'リポジトリが見つかりませんでした。',
      cargarMas: 'さらに読み込む',
      privado: 'プライベート',
      yaClonado: 'クローン済み',
      yaClonadoAyuda: 'このリポジトリまたは保存先フォルダのプロジェクトは既に存在します。',
      actualizado: (fecha: string) => `更新: ${fecha}`,
      elegir: '選択',
      errorRepos: 'リポジトリ一覧を読み取れませんでした',
    },
    url: {
      etiqueta: 'リポジトリ URL',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…、git@host:ruta または usuario/proyecto (GitHub)。URL にユーザーやパスワードを含めないでください。',
      invalida: 'https://…、git@host:ruta または usuario/proyecto の形式で入力してください',
    },
    carpeta: {
      titulo: 'このPCにある既存プロジェクト',
      texto: 'フォルダを選択するとプロジェクト種別を自動検出し、レシピを提案します。',
      elegir: 'フォルダを選択',
      manual: 'レシピなしで追加（手動設定）',
      yaEsProyecto: (nombre: string) => `このフォルダは既にプロジェクト ${nombre} です。`,
      vigilarTitulo: '監視フォルダ',
      vigilarTexto:
        'プロジェクトと思われる新しいフォルダが現れると WolfCore Dev が通知します。リポジトリのクローン先にもなります。',
      vigilando: (carpeta: string) => `監視中: ${carpeta}`,
      sinVigilar: '監視中のフォルダはありません。',
      vigilar: '監視するフォルダを選択',
      cambiarVigilada: '変更',
      dejarDeVigilar: '監視を停止',
    },
    asistente: {
      titulo: (nombre: string) => `${nombre} をセットアップ`,
      cargando: 'プロジェクトを解析中…',
      origenYml: 'リポジトリの wolfcore.yml から読み込んだレシピです。',
      origenDefecto: 'プロジェクト種別から提案されたレシピです。',
      deteccion: '検出結果',
      deteccionAyuda: 'プロジェクトと合わない点があれば修正してください。',
      tipo: '種別',
      php: 'PHP',
      phpNinguno: '未インストール',
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
      versionAuto: '自動検出',
      servicios: 'サービス',
      serviciosNinguno: 'なし',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `検出: ${v}`,
      nodeInstalar: 'Node が未インストールです。「サービス」でインストールしてください。',
      pythonInstalar: 'Python が未インストールです。「サービス」でインストールしてください。',
      lenguajeInstalar: (nombre: string) => `${nombre} が未インストールです。「サービス」でインストールしてください。`,
      dominio: 'ドメイン',
      puertoProxy: 'ローカルポート',
      puertoPlaceholder: '8000',
      receta: '手順',
      recetaAyuda:
        '上から順に実行されます。不要な手順はオフにでき、任意の手順は並び替えできます。',
      subir: '上へ',
      bajar: '下へ',
      fijo: 'この手順は必須です',
      restaurar: 'バックアップを復元…',
      cambiarRespaldo: 'バックアップを変更',
      quitarRespaldo: 'バックアップを解除',
      sobrescribir: '既にテーブルがある場合もデータベースを上書き',
      semilla: 'テストデータを投入 (--seed)',
      sinMotor:
        'データベースなし: 作成や復元を行うには「サービス」でエンジンをインストールしてください。',
      confio: 'このリポジトリを信頼してセットアップ手順を実行する',
      confioAyuda:
        'プロジェクトのプログラム (composer、npm、pip、マイグレーション) をこのPCで実行します。コードを理解している場合のみチェックしてください。',
      montar: 'セットアップ開始',
      montando: 'セットアップ中…',
      reintentar: '再試行',
      omitir: 'スキップ',
      cancelar: 'キャンセル',
      cancelando: 'キャンセル中…',
      cerrar: '閉じる',
      cerrarCorriendo: '隠す（バックグラウンドで継続）',
      abrirSitio: 'サイトを開く',
      verRegistro: 'ログを表示',
      ocultarRegistro: 'ログを隠す',
      listo: 'プロジェクトの準備が整いました。',
      fallo: (paso: string) => `失敗: ${paso}。再試行・スキップ・キャンセルを選択できます（実行済み内容は保持されます）。`,
      cancelada: 'セットアップを中止しました。プロジェクトカードから再開できます。',
      incompleta: '未実行の手順が残っています。',
      errorCrear: 'プロジェクトを作成できませんでした',
      errorReceta: 'レシピを読み取れませんでした',
      recetaCambio:
        '信頼後にプロジェクトのレシピ (wolfcore.yml) が変更されました。再試行では前回保存したレシピを使用します。',
      recargar: '新しいレシピを確認',
      seguirGuardada: '保存済みのまま続行',
      soloLectura:
        '種別・PHP・ドメイン・バージョン・ポートはプロジェクト設定の値です。「編集」から変更できます。',
    },
    tarjeta: {
      receta: 'セットアップ',
      reinstalar: '依存関係を再インストール',
      reinstalarTitulo: (nombre: string) => `${nombre} のレシピを実行しますか？`,
      reinstalarTexto:
        '前回のセットアップ手順（ウィザードで確認したもの）を再実行します:',
      noRestaura: '復元は再実行されません',
      recetaCambio:
        '信頼後にプロジェクトのレシピ (wolfcore.yml) が変更されました。再インストールは保存済みレシピを実行します。新しい内容は「レシピを確認」で見てください。',
      revisarReceta: 'レシピを確認',
      preparar: 'セットアップ…',
      ejecutar: '実行',
      verPreparacion: 'セットアップを表示',
      sinConfianza:
        '実行するにはウィザードでレシピを確認し「このリポジトリを信頼する」にチェックを入れてください。',
      runtimes: 'バージョン通知',
      verRegistros: 'ログを見る',
      abrirAgente: 'AI エージェントを開く',
      vscode: 'エディター',
      vscodeAyuda: '既定のエディターでプロジェクトフォルダを開く',
      vscodeError: 'エディターを開けませんでした',
      baseDatos: 'データベース',
      baseDatosAyuda: (base: string) =>
        `認証済みでデータベース「${base}」を開く (Adminer または phpMyAdmin)`,
      baseDatosSinDetectar: 'プロジェクトのデータベースを開く (Adminer または phpMyAdmin)',
      sinBase: 'プロジェクトの .env に MySQL、MariaDB、PostgreSQL データベースが定義されていません。',
      adminerNoListo: 'Adminer の準備ができていません',
      entradaAutomatica: 'パスワード入力なしで認証済みで開きます。',
      elegirBd: 'Adminer または phpMyAdmin を選択',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin（MySQL / MariaDB のみ）',
      phpMyAdminNoListo: 'phpMyAdmin の準備ができていません',
      entroComoAdmin: (usuario: string) =>
        `このプロジェクトに専用ユーザーがないため、サーバー管理者 ${usuario} でログインしました。.env マネージャーの「専用ユーザーを使う」でこのDB限定のユーザーを作成できます。`,
      entroComoAdminSinClave: (usuario: string) =>
        `専用ユーザーのパスワードがこのPCに保存されていないため、サーバー管理者 ${usuario} でログインしました。.env マネージャーの「専用ユーザーを使う」で新しいパスワードを生成できます。`,
      abrirSitio: 'ブラウザでサイトを開く',
      github: 'リポジトリ',
      abrirRemoto: (url: string) => `${url} を開く`,
      confiado: '信頼済み',
      confiadoAyuda: 'セットアップ手順の実行が許可されています。',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: '切り離された HEAD',
      cambios: (n: number) => plural(n, '件の未保存の変更'),
      limpio: '変更なし',
      atras: (n: number) => `未取得 ${n} 件`,
      adelante: (n: number) => `未送信 ${n} 件`,
      traer: '変更を取得',
      traerAyuda: 'マージなしの git pull。ローカル変更や分岐がある場合は何も変更しません。',
      alDia: 'すでに最新です。',
      actualizado: '変更を取得しました',
      sugeridosTitulo: '変更を取得しました',
      sugeridosTexto: '変更内容に基づき、次の手順の実行をおすすめします:',
      sugeridosNinguno: '追加で実行すべき手順はありません。',
      migracionesNuevas: (n: number) => plural(n, '件の新しいマイグレーション'),
      ejecutarSugeridos: '手順を実行',
      corridaTitulo: '取得後の推奨手順',
      corridaAyuda: 'プロジェクトに保存済みのレシピは変更されません。',
      ahoraNo: '今はしない',
      errorEstado: 'Git の状態を読み取れませんでした',
      commitIa: {
        boton: 'コミット案を作成',
        ayuda:
          'ステージ済み変更 (git add) に対するコミットメッセージを AI で提案し、承認後にコミットします。',
        titulo: '提案メッセージでコミット',
        proveedor: 'AI プロバイダー',
        modelo: 'モデル',
        sinProveedores:
          'メッセージを提案するにはクラウド AI プロバイダー（AI 画面）を設定してください。',
        privacidad:
          'ステージ済みの差分のみプロバイダーへ送信されます（.env、キー、証明書、認証ファイル、バイナリは除外、最大 20,000 文字）。少量のトークンを消費します。',
        sugerir: 'メッセージを提案',
        mensaje: 'メッセージ（編集可能）',
        commit: 'コミットする',
        commitAyuda: 'ステージ済み (git add) のみ対象。ファイル追加やプッシュは行いません。',
        hecho: 'ステージ済みの変更をコミットしました。',
      },
    },
    procesos: {
      titulo: 'プロセス',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'エラーなしで終了しました',
      ninguno: 'プロセスがありません。npm run dev、queue:work、uvicorn などを追加してください。',
      agregar: 'プロセスを追加',
      editar: 'プロセスを編集',
      nuevo: '新規プロセス',
      interruptor: (nombre: string) => `${nombre} を起動または停止`,
      proxy: 'プロキシ',
      proxyAyuda: 'Nginx がサイトのリクエストをこのプロセスへ転送します。',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, '回の再起動'),
      verLog: 'ログを見る',
      ocultarLog: 'ログを隠す',
      logVacio: 'まだ出力がありません。',
      abrirCarpetaLog: 'ログフォルダを開く',
      quitar: 'プロセスを削除',
      quitarTitulo: (nombre: string) => `プロセス ${nombre} を削除しますか？`,
      quitarTexto: '実行中の場合は停止されます。',
      nombre: '名前',
      nombrePlaceholder: 'Vite',
      comando: 'コマンド',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'シェルを介さずプログラムと引数を指定します。空白を含む引数は引用符で囲んでください。',
      cwd: 'フォルダ',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz またはプロジェクト内のサブフォルダ（例: frontend）。',
      puertoCampo: 'ポート',
      puertoNinguno: 'なし',
      puertoAyuda: 'プロキシ先でない場合は情報表示用です。',
      autoIniciar: 'WolfCore Dev 起動時に開始',
      reiniciar: '終了時に自動再起動',
      esProxy: 'Nginx プロキシの転送先にする',
      requiereReinicio:
        'プロセスは実行中です。コマンド・フォルダ・ポートの変更は再起動後に反映されます。',
      reinicieAhora: '保存しました。変更を反映するにはプロセスを停止して再起動してください。',
      guardado: 'プロセスを保存しました',
      errores: {
        comando: 'コマンドを入力してください',
        puerto: 'ポートは 1〜65535 の範囲で指定してください',
        proxySinPuerto: 'プロキシ先にはポートが必要です',
        cwd: 'raiz またはプロジェクト内のサブフォルダを指定してください',
        repetido: '同じ名前のプロセスが既にあります',
      },
      estados: {
        encendido: '実行中',
        apagado: '停止中',
        iniciando: '起動中…',
        error: 'エラー',
        externo: '外部',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `${nombre} のログ`,
      fuente: 'ソース',
      ninguna: 'このプロジェクトにはまだログがありません。',
      vacio: 'ログは空です。',
      actualizar: '更新',
      abrirCarpeta: 'フォルダを開く',
    },
    sugerencias: {
      titulo: (n: number) => `プロジェクトと思われる新しいフォルダが ${n} 件あります`,
      montar: 'セットアップ',
      ignorar: '無視',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: '未読メール',
    correoApagado: 'Mailpit 停止中',
    correoSinInstalar: 'Mailpit 未インストール',
    modelos: 'AI モデル',
    iaApagada: 'Ollama 停止中',
    iaSinInstalar: 'Ollama 未インストール',
    sinLeer: '読み取れませんでした',
    sinDato: '—',
  },
  /* ───────────── Panel de rendimiento, visor de registros y MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: '秒',
    minutos: '分',
    horas: '時間',
    dias: '日',
    /** Trabajador N de un servicio (p. ej. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'パフォーマンス',
    ventana: '直近5分間',
    pausado: 'ウィンドウ非表示のため一時停止中',
    esperando: '最初の計測を待機中…',
    errorMuestreo: (detalle: string) => `パフォーマンス計測を開始できませんでした: ${detalle}`,
    cpu: 'CPU',
    ram: 'メモリ',
    disco: 'データディスク',
    red: 'ネットワーク',
    deTotal: (usado: string, total: string) => `${usado} / ${total}`,
    libre: (libre: string) => `空き ${libre}`,
    bajada: '受信',
    subida: '送信',
    graficaCpu: (valor: string) => `直近5分間の CPU グラフ。現在 ${valor}`,
    graficaRam: (valor: string) => `直近5分間のメモリグラフ。現在 ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `直近5分間のネットワークグラフ。受信 ${bajada}、送信 ${subida}`,
    alertas: {
      titulo: 'アラート',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `${servicio} のポート ${puerto} は別プログラム ${programa} (PID ${pid}) が使用中です。`,
      ramAlta: (porcentaje: number) =>
        `PCのメモリ使用率が ${porcentaje}% です。不要なサービスを停止すると応答が改善します。`,
      huerfano: (pid: number, puertos: number[]) =>
        `WolfCore Dev 管理外の php-cgi (PID ${pid}) が ${puertos.join(', ')} で待ち受けています（前回セッションの残り）。`,
      finalizar: 'プロセスを終了',
      finalizarTitulo: 'このプロセスを終了しますか？',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) を保存せずに強制終了します。不要なプログラムと確信できる場合のみ実行してください。`,
      finalizado: (nombre: string) => `${nombre} を終了しました`,
      verPuertos: 'ポートを表示',
      errorPuertos: 'ポート使用中のプログラムを確認できませんでした。',
    },
    procesos: {
      titulo: 'サービスとプロセス',
      vacio: '実行中のサービスやプロジェクトプロセスはありません。',
      nombre: '名前',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'ポート',
      encendido: '稼働',
      acciones: '操作',
      detener: '停止',
      registros: 'ログを見る',
      servicio: 'サービス',
      proyecto: 'プロジェクト',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'ログ',
    descripcion:
      'Nginx、PHP、サービス、サイト、プロジェクトプロセス、トンネルのログをリアルタイムで追跡します。',
    fuente: 'ソース',
    elegirFuente: 'ログを選択',
    sinFuentes:
      'ログがまだありません。サービス、サイト、またはプロセスが出力すると表示されます。',
    buscar: 'テキストで絞り込み',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: '一時停止',
    reanudar: '再開',
    pausadoNuevas: (n: number) => `一時停止中に新着 ${n} 行`,
    copiar: '表示分をコピー',
    copiadas: (n: number) => `${n} 行をコピーしました`,
    limpiar: 'クリア',
    abrirCarpeta: 'フォルダを開く',
    alFinal: '末尾を追従',
    mostrarMas: 'さらに表示',
    ocultas: (n: number) => `過去の ${n} 行を非表示`,
    vacio: 'まだログ行がありません。書き込まれるとここに表示されます。',
    sinCoincidencias: 'フィルターに一致する行はありません。',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} 行` : `${visibles} / ${total} 行`,
    descartadas: (n: number) => `（最新 5000 行を保持。古い ${n} 行は破棄）`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'サービス',
      sitio: 'サイト',
      laravel: 'Laravel',
      proyecto: 'プロジェクトプロセス',
      tunel: 'トンネル',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (アクセス)',
      nginxError: 'Nginx (エラー)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (アクセス)`,
      sitioError: (dominio: string) => `${dominio} (エラー)`,
      tunel: (sitio: string) => `${sitio} のトンネル`,
      tunelSalida: (sitio: string) => `${sitio} のトンネル (出力)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      '変更を反映するには新しいターミナルを開いてください（既存のターミナルには反映されません）。',
    enPathSinCliente: 'PATH に登録済みですがコマンドが不足しています',
    reparar: '修復',
    repararTitulo: 'wolf コマンドを修復しますか？',
    repararTexto:
      'wolf は PATH にありますがファイルが不完全です。データフォルダへ再コピーし、ローカルサーバーを起動します。',
    titulo: 'ターミナル: wolf コマンド',
    descripcion:
      'PowerShell、cmd、Git Bash から WolfCore Dev を操作できます（wolf status、wolf use php@8.4、wolf share、wolf logs）。アプリ起動中のみ動作します。',
    activo: 'PATH で利用可能',
    enPathSinServidor: 'PATH に登録済み（サーバー停止中）',
    inactivo: 'PATH 未登録',
    agregarBoton: 'wolf を PATH に追加',
    quitarBoton: 'wolf を PATH から削除',
    agregarTitulo: 'wolf をユーザー PATH に追加しますか？',
    agregarTexto:
      'wolf コマンドを WolfCore Dev のデータフォルダへコピーしてユーザー PATH に追加し（元の PATH のバックアップを保存）、起動ごとに変わるキーで wolf のみ受け付ける 127.0.0.1 専用ローカルサーバーを開始します。インターネット公開や全ターミナルの PHP 変更は常にアプリ画面でも確認を求めます。いつでも削除できます。',
    agregar: '追加する',
    quitarTitulo: 'wolf を PATH から削除しますか？',
    quitarTexto:
      'ユーザー PATH から wolf フォルダを削除し、ローカルサーバーを停止してコピー済みコマンドを削除します。開いているターミナルは変わりません。',
    quitar: '削除する',
    listoTitulo: 'wolf コマンドを更新しました',
    ayuda: '追加後に新しいターミナルを開いてください。サーバーは 127.0.0.1 のみで待ち受けます。',
    aislado: 'テスト用データフォルダ (WOLFCORE_DATOS) では PATH は変更されません。',
    errorCargar: (detalle: string) => `wolf の状態を読み取れませんでした: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP サーバー',
    descripcion:
      'Claude Code などのアシスタントからこのPC上のサイト・サービス・データベースを操作できるようにします。127.0.0.1 のみ待ち受け、トークンが必要です。',
    estado: '状態',
    activo: '有効',
    inactivo: '停止中',
    activar: '有効化',
    detener: '停止',
    activado: 'MCP サーバーを有効にしました',
    detenido: 'MCP サーバーを停止しました',
    direccion: 'アドレス',
    puerto: 'ポート',
    puertoAyuda: '1024〜65535。有効な場合は新しいポートで再起動します。',
    puertoRango: '1024〜65535 の数値を指定してください',
    puertoGuardado: (p: number) => `MCP サーバーはポート ${p} を使用します`,
    copiarConfig: 'Claude Code 用設定をコピー',
    copiarConfigAyuda:
      'トークン付きの設定をクリップボードへコピーします。Claude Code に貼り付けてください（トークンは画面に表示されません）。',
    configCopiada: '設定をクリップボードにコピーしました',
    regenerar: 'トークンを再生成',
    regenerarTitulo: 'MCP サーバーのトークンを再生成しますか？',
    regenerarTexto:
      '現在のトークンは直ちに無効になります。接続済みのアシスタントは新しい設定へ更新してください。',
    regenerado: 'トークンを再生成しました。設定を再度コピーしてください。',
    errorCargar: (detalle: string) => `MCP サーバーの状態を読み取れませんでした: ${detalle}`,
    confirmacion: {
      titulo: 'アシスタントが確認を求めています',
      herramienta: 'ツール',
      pendientes: (actual: number, total: number) => `${actual} / ${total}`,
      aprobar: '承認',
      rechazar: '拒否',
      aprobada: '操作を承認しました',
      rechazada: '操作を拒否しました',
      vencida: 'リクエストは既に保留中ではありません。',
      descartadas: (n: number) => `ほか ${n} 件は表示枠外（自動期限切れ）`,
      falloRespuesta: (detalle: string) =>
        `応答を送信できませんでした。リクエストは保留のままです。${detalle}`,
      si: 'はい',
      no: 'いいえ',
      campos: {
        motor: 'エンジン',
        base: 'データベース',
        archivo: 'ファイル',
        sobrescribir: '上書き',
        pid: 'PID',
        nombre: 'プロセス',
        proyecto: 'プロジェクト',
        pasos: '手順',
        cantidad: 'ダンプ数',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: '日々の開発に役立つツール集です。オフラインかつ外部サービスなしで動作します。',
    buscar: 'ツールを検索…',
    sinResultados: '一致するツールがありません。',
    abrir: '開く',
    procesar: '処理中…',
    copiar: 'コピー',
    copiado: 'クリップボードにコピーしました',
    limpiar: 'クリア',
    pendienteApi: '未対応: コアがこの情報をまだUIへ公開していません。',
    lista: {
      qr: { nombre: 'QRコード生成', descripcion: 'テキストやトンネルURLから PNG を生成します。' },
      json: { nombre: 'JSON', descripcion: '整形・検証・圧縮とツリー表示。' },
      regex: {
        nombre: '正規表現',
        descripcion: '一致・グループ確認とクイックリファレンス。',
      },
      diff: {
        nombre: 'テキスト比較',
        descripcion: '並列の差分比較（ファイルにも対応）。',
      },
      tiempo: { nombre: '日時変換', descripcion: 'タイムスタンプ ↔ 日時（タイムゾーン対応）。' },
      puertos: {
        nombre: 'ポートとプロセス',
        descripcion: '各ポートの待ち受け状況を確認し、プロセスを終了します。',
      },
      bom: { nombre: 'UTF-8 BOM 除去', descripcion: 'ファイルやフォルダから BOM を削除します。' },
      certificados: {
        nombre: '証明書',
        descripcion: 'WolfCore Dev の CA で任意の名前の証明書を発行します。',
      },
      cripto: {
        nombre: '暗号ツール',
        descripcion: 'ハッシュ、Base64、URL、UUID、パスワード、JWT。',
      },
      markdown: { nombre: 'Markdown プレビュー', descripcion: '入力しながらリアルタイムで確認できます。' },
      entorno: { nombre: 'システム環境', descripcion: 'PATH、バージョン、環境変数を確認。' },
      buscar: {
        nombre: '検索',
        descripcion: 'プロジェクト・フォルダ・ファイルの名前と内容を検索します。',
      },
      infoArchivo: {
        nombre: 'ファイル情報',
        descripcion: 'サイズ、種類、ハッシュ値を確認します。',
      },
      websocket: { nombre: 'WebSocket クライアント', descripcion: '接続・送信・受信ログを確認します。' },
      contrasenas: {
        nombre: 'パスワード',
        descripcion: '強度測定とデータベース内の弱いパスワード監査。',
      },
      qrWifi: {
        nombre: 'Wi-Fi QR',
        descripcion: '他端末が Wi-Fi に接続するためのQRコードを作成します。',
      },
      imagenes: {
        nombre: '画像処理',
        descripcion: 'ICO・PNG 変換と JPEG・WebP 圧縮。',
      },
      comprimir: {
        nombre: 'ZIP と PDF',
        descripcion: 'ファイル・フォルダの ZIP 圧縮と PDF 最適化。',
      },
      conversor: {
        nombre: 'ドキュメント変換',
        descripcion: 'Word・Excel・PDF・CSV・Markdown をこのPC内で変換します。',
      },
    },
    errores: {
      jsonVacio: 'JSON を入力または貼り付けてください。',
      jsonInvalido: (linea: number, columna: number) =>
        `無効な JSON です: ${linea} 行目、${columna} 列目を確認してください。`,
      banderas: '無効なフラグです: d, g, i, m, s, u, v, y を重複なく指定してください。',
      regex: (detalle: string) => `無効な正規表現です (${detalle})。`,
      trabajador: 'バックグラウンド処理を実行できませんでした。',
      diffLento: 'テキストの差分が大きすぎて時間内に比較できませんでした。',
      base64: '無効な Base64 です。',
      utf8: 'デコード結果は有効な UTF-8 テキストではありません。',
      url: '無効な URL エンコード列です。',
      coste: (max: number) => `bcrypt コストは 4〜${max} の範囲で指定してください。`,
      jwtPartes: 'JWT はドット区切りの3パートである必要があります。',
      jwtCabecera: 'JWT ヘッダーを読み取れませんでした。',
      jwtCarga: 'JWT ペイロードを読み取れませんでした。',
      longitud: '長さは 4〜256 の範囲で指定してください。',
      sinConjuntos: '少なくとも1種類の文字種を選択してください。',
      sinDominios: '名前または IP を少なくとも1つ入力してください。',
      muchosDominios: (max: number) => `1つの証明書に最大 ${max} 件まで指定できます。`,
    },
    qr: {
      texto: 'テキストまたは URL',
      textoAyuda: 'QRコードはこのPC内で生成され、外部へ送信されません。',
      tunel: 'プロジェクトのトンネルリンク',
      sinTuneles: '稼働中のトンネルはありません',
      descargar: 'PNG をダウンロード',
      vacio: 'コードを生成するテキストを入力してください。',
      largo: 'テキストが長すぎてQRコードにできません。',
      descargado: 'ダウンロードを開始しました。',
    },
    json: {
      entrada: 'JSON',
      formatear: '整形',
      minificar: '圧縮',
      validar: '検証',
      valido: '有効な JSON です。',
      resultado: '結果',
      arbol: 'ツリー',
      mas: (n: number) => `… ほか ${n} 件`,
    },
    regex: {
      patron: 'パターン',
      banderas: 'フラグ',
      texto: 'テスト文字列',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} 件の一致${truncado ? '（先頭のみ表示）' : ''}`,
      sinCoincidencias: '一致なし。',
      tiempo: '処理時間が長すぎたため中断しました（破滅的バックトラッキングの可能性）。',
      grupo: (n: number) => `グループ ${n}`,
      referencia: 'クイックリファレンス',
      tabla: [
        ['.', '任意の1文字（s なしでは改行を除く）'],
        ['\\d \\w \\s', '数字、英数字/_、空白'],
        ['\\D \\W \\S', '上記の否定'],
        ['[abc] [^abc]', 'いずれか1文字 / いずれにも該当しない'],
        ['^ $', '先頭と末尾（m ありで行単位）'],
        ['\\b', '単語境界'],
        ['* + ?', '0回以上、1回以上、0または1回'],
        ['{n,m}', 'n〜m 回の繰り返し'],
        ['*? +?', '最短一致（非貪欲）'],
        ['(…) (?<nombre>…)', 'キャプチャグループ / 名前付きグループ'],
        ['(?:…)', '非キャプチャグループ'],
        ['(?=…) (?!…)', '肯定先読み / 否定先読み'],
        ['a|b', '選択（または）'],
        ['g i m s u y', '全体、大小無視、複数行、ドット改行一致、Unicode、sticky'],
      ] as [string, string][],
    },
    diff: {
      original: '変更前',
      modificado: '変更後',
      cargarArchivo: 'ファイルを読み込む',
      comparar: '比較',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} 行`,
      iguales: 'テキストは同一です。',
      archivoGrande: 'ファイルが 5 MB を超えています。より小さいファイルを選んでください。',
      textoGrande: '各テキストの上限は 5 MB です。',
      truncado: (mostradas: number, total: number) =>
        `全 ${total} 行のうち最初の ${mostradas} 行を表示しています。`,
    },
    tiempo: {
      timestamp: 'タイムスタンプ（秒またはミリ秒）',
      fecha: '日時 (YYYY-MM-DD HH:mm:ss)',
      zona: 'タイムゾーン',
      ahora: '現在時刻',
      segundos: '秒',
      milisegundos: 'ミリ秒',
      iso: 'ISO 8601 (UTC)',
      enZona: '選択したタイムゾーン',
      desplazamiento: 'オフセット',
      relativo: '相対表示',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? '秒として読み取りました' : 'ミリ秒として読み取りました',
      timestampInvalido: '数字のみ入力してください（符号可）。',
      fechaInvalida: '実在する日時を YYYY-MM-DD HH:mm[:ss] 形式で入力してください。',
      zonaInvalida: '不明なタイムゾーンです。',
    },
    puertos: {
      filtro: 'ポート、PID、名前で絞り込み',
      actualizar: '更新',
      columnas: {
        puerto: 'ポート',
        protocolo: 'プロトコル',
        proceso: 'プロセス',
        pid: 'PID',
        direcciones: 'アドレス',
        acciones: '操作',
      },
      propio: 'WolfCore Dev',
      sistema: 'システム',
      finalizar: '終了',
      noFinalizable: 'システムプロセスおよび WolfCore Dev のプロセスはここから終了できません。',
      confirmarTitulo: 'プロセスを終了',
      confirmarTexto: (nombre: string, pid: number) =>
        `「${nombre}」(PID ${pid}) を保存せずに強制終了します。確認のためプロセス名を入力してください:`,
      finalizado: (nombre: string) => `${nombre} を終了しました。`,
      vacio: '使用中のポートがないか読み取れませんでした。',
    },
    bom: {
      explicacion:
        '最初に BOM を含むファイルを表示します。除去時には各ファイルの .bak-bom バックアップを作成します。node_modules、vendor、.git、バイナリは除外されます。',
      elegirArchivos: 'ファイルを選択',
      elegirCarpeta: 'フォルダを選択',
      seleccion: (n: number) => `${n} 件のパスを選択済み`,
      analizar: '解析',
      limpiar: 'BOM を除去',
      confirmar: (n: number) =>
        `${n} 件のファイルから BOM を除去します（バックアップ作成）。続行しますか？`,
      conBom: (n: number) => `BOM あり: ${n} 件`,
      sinBom: 'BOM を含むファイルはありません。',
      limpiados: (n: number) => `${n} 件のファイルを処理しました。`,
      copia: 'バックアップ',
    },
    certificados: {
      explicacion:
        'WolfCore Dev のローカル CA で証明書に署名します。.crt は指定先へ、秘密鍵 (.key) は同じ場所へ保存されます（秘密鍵はUIを経由しません）。',
      dominios: '名前または IP（空白・カンマ・改行区切り）',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: '発行して保存',
      guardado: '証明書を保存しました',
      certificado: '証明書',
      clave: '秘密鍵',
    },
    cripto: {
      texto: 'テキスト',
      hash: 'ハッシュ',
      calcular: '計算',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt コスト',
      bcryptTrunca: 'bcrypt は先頭 72 バイトのみ使用します。',
      bcryptVerificar: '検証する bcrypt ハッシュ',
      verificar: '検証',
      coincide: 'テキストはハッシュと一致します。',
      noCoincide: 'テキストはハッシュと一致しません。',
      base64: 'Base64',
      base64Url: 'URL セーフ版',
      codificar: 'エンコード',
      decodificar: 'デコード',
      url: 'URL エンコード',
      decodificarUrl: 'URL デコード',
      codificarBase64: 'Base64 エンコード',
      decodificarBase64: 'Base64 デコード',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID とパスワード',
      uuid: 'UUID v4',
      generar: '生成',
      generarDiez: '10件生成',
      contrasena: 'ランダムパスワード',
      longitud: '長さ',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: '記号',
      jwt: 'JWT デコード',
      jwtToken: 'トークン',
      cabecera: 'ヘッダー',
      carga: 'ペイロード',
      firmaNoVerificada:
        '署名は検証されていません。内容は改ざんされている可能性があります。',
      vencido: 'トークンは期限切れです (exp)。',
      vigente: 'トークンは有効期限内です (exp)。',
      salida: '結果',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'プレビュー',
      ejemplo:
        '# 見出し\n\n**太字**、_斜体_、[リンク](https://example.com) の例です。\n\n- 項目1\n- 項目2\n\n```\nコード\n```\n',
      seguro:
        '生の HTML はテキストとして表示され、危険なリンクは無効化され、画像は読み込まれません。',
      imagenOmitida: (alt: string) => `[画像${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'WolfCore Dev バージョン',
      navegador: 'UI エンジン',
      plataforma: 'プラットフォーム',
      idioma: '言語',
      zona: 'タイムゾーン',
      nucleos: '論理コア数',
      actualizar: '更新',
      path: 'PATH',
      pathVacio: 'PATH は空です。',
      herramientas: 'WolfCore Dev のツール',
      noInstalada: '未インストール',
      sinRespuesta: '時間内に応答しませんでした',
      variables: '環境変数',
      filtro: '変数を絞り込み',
      enmascarada: '値を非表示: 機密情報と思われる変数名です。',
    },
    busqueda: {
      explicacion:
        'シンボリックリンクやバイナリを除き、ファイル名と内容を検索します。既定で node_modules、vendor、.git を除外します。',
      origen: '検索対象',
      proyecto: 'プロジェクト',
      elegirCarpeta: 'フォルダを選択',
      elegirArchivo: 'ファイルを選択',
      sinOrigen: 'プロジェクト、フォルダ、またはファイルを選択してください。',
      consulta: '検索文字列',
      modoNombre: 'ファイル名',
      modoContenido: '内容',
      modoAmbos: '両方',
      regex: '正規表現',
      mayusculas: '大文字・小文字を区別',
      incluir: '対象ファイルのみ（カンマ区切り、例: *.php）',
      excluir: '除外（カンマ区切り）',
      buscar: '検索',
      cancelar: 'キャンセル',
      buscando: '検索中…',
      sinResultados: '一致なし。',
      truncado: '表示件数を超える結果があります。条件を絞り込んでください。',
      cancelada: '検索をキャンセルしました。',
      abrir: 'エディターで開く',
      coincidencias: (n: number) => `${n} 件の一致`,
      resumen: (archivos: number, examinados: number) =>
        `${archivos} ファイル中（${examinados} 件を検査）`,
    },
    infoArchivo: {
      elegir: 'ファイルを選択',
      ayuda: 'このPC上で読み取りハッシュを計算します（最大 200 MB）。',
      nombre: '名前',
      tamano: 'サイズ',
      tipo: '種類',
      modificado: '更新日時',
      sinTipo: '不明',
      grande: 'ファイルが 200 MB を超えるためハッシュを除いて表示します。',
      calculando: 'ハッシュを計算中…',
    },
    websocket: {
      url: 'URL (ws:// または wss://)',
      conectar: '接続',
      desconectar: '切断',
      mensaje: 'メッセージ',
      enviar: '送信',
      urlInvalida: 'ws:// または wss:// で始まる URL を入力してください。',
      conectando: '接続中…',
      conectado: '接続済み',
      desconectado: '未接続',
      error: '接続エラー',
      cerrado: (codigo: number, motivo: string) =>
        `切断 (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: '送信',
      recibido: '受信',
      binario: (n: number) => `[バイナリ、${n} バイト]`,
      vacio: 'メッセージはまだありません。',
      tope: '最新 500 件を保持し、各メッセージは最大 10 KB まで表示します。',
    },
    qrWifi: {
      ssid: 'ネットワーク名 (SSID)',
      clave: 'パスワード',
      seguridad: 'セキュリティ',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'パスワードなし',
      oculta: 'ステルスネットワーク',
      mostrar: '表示',
      ocultar: '隠す',
      aviso:
        'QRコードにはパスワードがそのまま含まれます。見たり撮影したりした人は誰でも接続できます。このPC内で生成され、保存されずパネルを閉じると消去されます。',
      avisoPng:
        'ダウンロードした PNG にもパスワードが含まれます。安全な場所に保管してください。',
      escribala:
        'パスワードは手動入力します。WolfCore Dev はシステムに保存された Wi-Fi パスワードを読み取りません。',
      errorSsid: 'ネットワーク名を入力してください（最大 32 文字）。',
      errorClave: 'パスワードを入力してください。',
      errorClaveWpa: 'WPA パスワードは 8〜63 文字です。',
      vacio: 'コードを表示するには情報を入力してください。',
      alt: 'Wi-Fi ネットワーク接続用QRコード',
      descargar: 'PNG をダウンロード',
      descargado: 'QRコードを保存しました',
      largo: 'データが長すぎてQRコードにできません。',
    },
    imagenes: {
      elegir: '画像を選択',
      ayuda:
        'このPC内で処理されます（最大 30 MB、1辺 12000 px まで）。元画像は変更されず新しいファイルを作成します。',
      original: '元画像',
      accion: '処理内容',
      aIco: 'ICO に変換',
      aPng: 'PNG に変換',
      comprimir: '圧縮',
      tamanos: 'ICO サイズ',
      formato: '形式',
      calidad: '品質',
      ladoMax: '最大辺 px（空欄 = 元のまま）',
      procesar: '処理する',
      procesando: '処理中…',
      guardar: '名前を付けて保存…',
      antes: '処理前',
      despues: '処理後',
      sinMejora: '元のサイズより小さくなりませんでした。別の品質や形式をお試しください。',
      errorAbrir: 'このPCで画像を開けませんでした。',
      errorProcesar: '画像を処理できませんでした。',
      sufijoConvertida: '-converted',
      sufijoComprimida: '-compressed',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% 削減`
          : porcentaje < 0
            ? `${-porcentaje}% 増加`
            : '変化なし',
      guardado: (archivo: string) => `${archivo} に保存しました`,
    },
    comprimir: {
      zip: 'ZIP に圧縮',
      zipAyuda:
        'ファイルやフォルダを選択します。リンクは辿らず、既存ファイルを上書きせず新しい ZIP を作成します。',
      agregarArchivos: 'ファイルを追加',
      agregarCarpeta: 'フォルダを追加',
      quitar: '削除',
      vacio: 'まだ何も選択されていません。',
      crearZip: 'ZIP を作成…',
      creando: '作成中…',
      pdf: 'PDF を最適化',
      pdfAyuda:
        '別スレッドでオブジェクトストリーム付きで再保存します。小さくなる場合のみ保存し、パスワード保護 PDF は開きません。元ファイルは変更しません。注意: 再保存により電子署名と PDF/A 準拠は失われます。',
      elegirPdf: 'PDF を選択',
      optimizar: '最適化…',
      optimizando: '最適化中…',
      antes: '処理前',
      despues: '処理後',
      sinMejora: '最適化しても小さくならないためファイルを作成しませんでした。',
      sufijoOptimizado: '-optimized',
      omitidos: (n: number) =>
        `リンク・読み取り不可フォルダ・特殊ファイル ${n} 件を除外しました。`,
      archivos: (n: number) => `${n} ファイル`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% 削減`
          : porcentaje < 0
            ? `${-porcentaje}% 増加`
            : '変化なし',
      guardado: (archivo: string) => `${archivo} に保存しました`,
    },
    conversor: {
      ayuda:
        'このPC内で変換します（外部へアップロードしません）。元ファイルは変更せず、上書きせずに新しいファイルを作成します。',
      elegir: 'ドキュメントを選択',
      tipoNoSoportado:
        'この形式の変換は未対応です。docx、xlsx、csv、md、html、pdf に対応しています（LibreOffice があれば odt、pptx、doc も可）。',
      convertirA: '変換先形式',
      convertir: '変換…',
      convirtiendo: '変換中…',
      avisoLibreOffice:
        'この変換はPCにインストール済みの LibreOffice を使用します。WolfCore Dev はインストールせず、一時プロファイルでヘッドレス実行します。',
      sinLibreOffice:
        'LibreOffice をインストールすると odt、pptx、doc も変換できます（WolfCore Dev はインストールしません）。',
      limites:
        '安全上の制限: 最大 50 MB（md/html は 10 MB）、120秒、200,000 行、1000 列、500万セル。ZIP 爆弾や危険な XML エンティティを含むファイルは拒否されます。',
      guardado: (archivo: string) => `${archivo} に保存しました`,
    },
    contrasenas: {
      pestanaFortaleza: '強度チェック',
      pestanaAuditar: 'データベース監査',
      fortaleza: {
        etiqueta: '測定するパスワード',
        marcador: 'パスワードを入力',
        privacidad: 'このPC内でのみ測定され、送信や保存は一切行われません。',
        mostrar: '表示',
        ocultar: '隠す',
        niveles: ['非常に弱い', '弱い', '普通', '強い', '非常に強い'],
        sinAvisos: '指摘事項はありません。',
        estimacion: 'これは推定値であり保証ではありません。',
        avisos: {
          straightRow: 'キーボードの連続した並びは推測されやすいです。',
          keyPattern: '短いキーボードパターンは推測されやすいです。',
          simpleRepeat: '同じ文字やグループの繰り返しは強化になりません。',
          extendedRepeat: '繰り返しのパターンは推測されやすいです。',
          sequences: 'abc や 6543 のような連続列は推測されやすいです。',
          recentYears: '最近の年号や個人に紐づく日付は避けてください。',
          dates: '日付は推測されやすいため避けてください。',
          topTen: '最もよく使われるパスワード上位10件に入っています。',
          topHundred: '最もよく使われるパスワード上位100件に入っています。',
          common: '非常にありふれたパスワードです。',
          similarToCommon: '非常によく使われるパスワードに似ています。',
          wordByItself: '単語1つだけは推測されやすいです。',
          namesByThemselves: '名前や苗字だけでは推測されやすいです。',
          commonNames: 'よくある人名は推測されやすいです。',
          userInputs: '他人に知られている個人情報は使わないでください。',
          l33t: '予測しやすい記号置換（a→@ など）はほとんど効果がありません。',
          reverseWords: '単語を逆順に書くだけではほとんど効果がありません。',
          allUppercase: 'すべて大文字にしてもほとんど効果がありません。',
          capitalization: '先頭1文字を大文字にしてもほとんど効果がありません。',
          associatedYears: 'ご自身に関連する年号は避けてください。',
          repeated: '繰り返しの単語や文字は避けてください。',
          longerKeyboardPattern: 'より長いキーボードパターンを使い方向を変えてください。',
          anotherWord: 'あまり一般的でない単語を1〜2語追加してください。',
          useWords: 'ランダムな複数単語の組み合わせが強力です。',
          noNeed: '記号や数字がなくても長くすることで安全にできます。',
        },
      },
      auditar: {
        limite:
          '約200件のよくあるパスワード一覧とハッシュを照合する簡易検査です。総当たり攻撃ではありません。検出されなくても強いパスワードとは限りません。',
        privacidad:
          '一致したパスワード文字列は一切表示せず、一時的な読み取り専用ユーザーで読み取ります（PostgreSQL は読み取り専用セッション）。必ずご自身のデータベースのみに使用してください。',
        motor: 'エンジン',
        base: 'データベース',
        tabla: 'テーブル',
        columnaUsuario: 'ユーザー列',
        columnaHash: 'ハッシュ列',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: '検査するには「データベース」からサーバーを起動してください。',
        sinBases: 'このサーバーにはデータベースがありません。',
        sinMotores: '管理下の MySQL、MariaDB、PostgreSQL サーバーがありません。',
        revisar: '検査',
        revisando: '検査中…',
        resumen: (r: number, d: number) => `${r} 件を検査 · 弱いアカウント ${d} 件`,
        sinDebiles: 'よくあるパスワードに一致するアカウントは見つかりませんでした。',
        noRevisables: (n: number) => `${n} 件のアカウントは検査できませんでした:`,
        truncado:
          '10,000 行または 60 秒の上限に達したため中断しました（未検査のアカウントが残っています）。',
        usuario: 'ユーザー',
        motivo: '理由',
        accion: '操作',
        motivos: {
          comun: '非常にありふれたパスワード',
          formato_debil: '弱い形式（ソルトなし md5 または sha1）',
        },
        restablecer: 'リセット',
        mas: (n: number) => `ほか ${n} 件（先頭 200 件を表示）`,
        esquema: 'スキーマ (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'キャンセル',
        cancelando: 'キャンセル中…',
        cancelada: '監査をキャンセルしました。',
        progreso: (a: number, b: number) => `${a} / ${b} 件を検査済み`,
        tiposNoRevisables: {
          vacio: '空のハッシュ',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2（このPCで非対応またはパラメーター上限超過）',
          bcrypt_otro: '範囲外コストの bcrypt または $2x$ 形式',
          pbkdf2_otro: 'パラメーター上限超過の PBKDF2',
          ldap: 'LDAP 形式 ({SHA}…)',
          otro: '不明な形式',
        },
        rlsActiva:
          'テーブルに行レベルセキュリティ (RLS) が有効です。制限ロールに許可された行のみ検査されるため一部アカウントが漏れる場合があります。',
        falsoPositivo:
          '32 または 40 文字の16進文字列は md5/sha1 と判定されますが、トークンなど別の値の可能性もあります。パスワード列でない場合は結果が無効です。',
      },
      restablecer: {
        titulo: (u: string) => `${u} のパスワードをリセット`,
        ayuda:
          '既存パスワードの復元はできません。新しいパスワードを設定します。事前にデータベースのスナップショットと行コピーを保存します。',
        cargando: 'プレビューを準備中…',
        sentencia: '実行されるクエリ（値は別渡しで非表示）',
        formatoActual: (f: string) => `現在の形式: ${f}`,
        cambiaFormato:
          'アカウントは bcrypt へ移行されます。アプリが検証に対応している必要があります（例: password_verify）。非対応の場合ログインできなくなります。',
        nueva: '新しいパスワード',
        generar: '生成',
        mostrar: '表示',
        ocultar: '隠す',
        anotar: '今すぐ控えてください。再表示も保存も行われません。',
        escribaUsuario: (u: string) => `確認のためユーザー名を入力してください: ${u}`,
        confirmar: 'パスワードをリセット',
        cancelar: 'キャンセル',
        cerrar: '閉じる',
        hecho: 'パスワードをリセットしました。',
        copiaFila: '行コピー（識別子と旧ハッシュ、30日間保存）:',
        instantanea: '実行前のデータベーススナップショット:',
        instantaneaAyuda: 'データベース › スナップショット から元に戻せます。',
        aBcrypt: 'bcrypt に移行（アプリが password_verify 等に対応している場合のみ）',
        avisoLegado:
          'このハッシュはソルトなし md5 または sha1 のまま維持されます。アプリが別列や定数でソルトを付加している場合、新しいパスワードではログインできません。',
        datosReales: {
          titulo: '実データを含むデータベース',
          texto:
            'このデータベースは実顧客データありのサイトに属しています。リセットすると実アカウントが変更されます。',
          casilla: '実データであることを理解した上でこのパスワードをリセットする',
        },
        rlsActiva:
          '行レベルセキュリティ (RLS) が有効です。制限ロールからこのアカウントが隠されている場合はリセットできません。',
        copiaSinRestringir:
          'このコピーへのアクセスを現在のユーザーに制限できませんでした。フォルダ権限を確認してください。',
      },
    },
  },
  doctor: {
    descripcion:
      'ポート、証明書、hosts ファイル、PATH、Visual C++、ウイルス対策ソフト、サービスを診断し、修復方法を提案します。',
    revisarAhora: '今すぐ診断',
    revisando: '診断中…',
    sinRevision: 'まだ診断を実行していません。「今すぐ診断」を押してください。',
    sinHallazgos: 'すべて正常です。問題は見つかりませんでした。',
    gravedades: { error: 'エラー', aviso: '警告', info: '情報' },
    evidencia: '検出内容',
    requiereAdmin: '管理者権限が必要',
    comandoManual: '管理者コンソール用コマンド（自動実行されません）:',
    copiar: 'コマンドをコピー',
    copiado: 'コマンドをコピーしました。',
    reparar: '修復',
    alternativa: 'WolfCore Dev のポートを変更',
    soloInforma: 'WolfCore Dev はこれを自動変更しません。案内に従ってください。',
    dialogo: {
      titulo: '修復の確認',
      queHara: '次の処理を行います:',
      admin: 'Windows が管理者権限の確認を求めます。',
      puerto: (p: string | number) => `新しいポートは ${p} になります。`,
      aplicar: '適用',
      cancelar: 'キャンセル',
    },
    estados: {
      aplicando: '適用中…',
      hecha: '修復を適用しました。',
      fallida: '修復できませんでした。',
    },
    revisiones: {
      puertos: 'ポート',
      'rangos-reservados': '予約ポート範囲',
      ca: '認証局 (CA)',
      certificados: '証明書',
      confianza: 'CA の信頼',
      hosts: 'hosts ファイル',
      path: 'ユーザー PATH',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++ リンカー',
      antivirus: 'ウイルス対策',
      firewall: 'ファイアウォール',
      servicios: 'サービス',
    },
    reparaciones: {
      cambiar_puerto: 'WolfCore Dev のポートを空きポートへ変更します。他プログラムには触れません。',
      puerto_manual:
        'WolfCore Dev のポートを予約範囲外へ移動します。予約範囲を解放するかは表示コマンドで判断してください。',
      detener_iis:
        'ポートを解放するため IIS サービス (W3SVC) を停止します。無効化はせず Windows 再起動時に戻ります。',
      regenerar_ca:
        '新しい認証局を作成し Windows で信頼（確認あり）、証明書を再発行して旧 CA を削除します（事前バックアップあり）。',
      regenerar_certificados: 'サイトの証明書を再発行して Nginx をリロードします。',
      hosts_reescribir:
        'hosts ファイルの WolfCore Dev ブロックを UTF-8 で書き直します（事前バックアップあり）。他行は変更しません。',
      hosts_solo_lectura: 'hosts ファイルの読み取り専用属性を解除します。',
      path_duplicados:
        'ユーザー PATH から重複した WolfCore Dev エントリを削除します（元の値をバックアップ）。他エントリは変更しません。',
      path_ajeno:
        '別のツールが PATH の先頭にあります。WolfCore Dev は削除しませんので必要に応じ順序を変更してください。',
      instalar_vcredist:
        'winget で Visual C++ 2015+ x64 をインストールします。Microsoft インストーラーが権限を求めます。',
      instalar_build_tools:
        '表示されたコマンドで Visual Studio Build Tools（C++ ツール込み）をインストールしてください。数 GB あり管理者権限が必要なため手動実行となります。',
      antivirus:
        'データフォルダをウイルス対策の除外に追加するかは、表示コマンドを用いてご判断ください。',
      firewall:
        'これらのルールを削除するかは管理者コンソールで表示コマンドを実行してご判断ください。WolfCore Dev はファイアウォールを変更しません。',
      reintentar_servicio: 'サービスを再起動します。',
      firefox_confianza:
        '各 Firefox プロファイルの user.js に Windows 認証局を信頼する設定を追加します（事前バックアップあり）。prefs.js は変更せず、開いているプロファイルはスキップします。',
    },
    confianza: {
      titulo: 'CA の信頼',
      texto:
        'Windows は既に WolfCore Dev の認証局を信頼していますが、Node・Python・Firefox はそれぞれ独自のストアを使用します。',
      sinCa: '認証局がまだありません。この機能を使うには HTTPS セクションで作成してください。',
      node: {
        titulo: 'Node',
        proyectos:
          'プロジェクトプロセスとターミナルは CA を含む NODE_EXTRA_CA_CERTS を受け取ります。',
        ajena: '独自の NODE_EXTRA_CA_CERTS が設定済みのため WolfCore Dev は置き換えません。',
        global: 'ユーザー環境変数にも設定する（他のターミナルやプログラム向け）',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS をユーザー環境変数に設定します。以降に起動するプログラムへ適用され、オフにすると削除されます。',
        confirmarDesactivar: 'WolfCore Dev が設定した NODE_EXTRA_CA_CERTS 変数を削除します。',
      },
      python: {
        titulo: 'Python',
        texto:
          '.venv を持つプロジェクトには certifi（または Windows）のルート証明書と本 CA を合わせた REQUESTS_CA_BUNDLE と SSL_CERT_FILE を渡します。本 CA のみにはしません。',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Firefox のプロファイルが見つかりませんでした。',
        activo: '信頼済み',
        inactivo: '未信頼',
        abierto: '起動中',
        fuera: 'Firefox フォルダ外',
        avisoFuera: (lista: string) =>
          `次のプロファイルは Firefox フォルダ外にあり、チェックしない限り変更されません: ${lista}。`,
        incluirFuera: 'Firefox フォルダ外のプロファイルも変更する',
        resultadoFuera: (n: number) =>
          `Firefox フォルダ外の ${plural(n, '件のプロファイルは変更されませんでした')}。`,
        activar: 'Firefox で有効化',
        quitar: 'Firefox から削除',
        confirmarActivar:
          '各プロファイルの user.js に WolfCore Dev の区切り付きで security.enterprise_roots.enabled を追加します（etc/respaldos に事前バックアップ保存）。prefs.js は変更しません。起動中のプロファイルはスキップされるため事前に Firefox を閉じてください。',
        confirmarQuitar:
          '各プロファイルの user.js から WolfCore Dev のブロックを削除します（事前バックアップあり）。他の設定は維持されます。',
        resultadoOk: (n: number) => `${plural(n, '件のプロファイル')}で完了しました。`,
        resultadoAbiertos: (n: number) =>
          `Firefox が起動中のため ${plural(n, '件のプロファイル')}をスキップしました。閉じて再試行してください。`,
        resultadoError: (n: number) =>
          `${plural(n, '件のプロファイル')}を変更できませんでした。`,
      },
      confirmar: '確認',
      cancelar: 'キャンセル',
    },
  },
  php: {
    descripcion:
      'インストール済みの各 PHP バージョンの php.ini と拡張機能を管理します。保存前に差分表示・php -v 検証・日付付きバックアップを行い、再起動に失敗した場合は元に戻します。',
    rama: 'PHP バージョン',
    sinPhp: 'PHP がインストールされていません。「サービス」からインストールしてください。',
    irServicios: 'サービスへ移動',
    pestanas: { ini: 'php.ini', extensiones: '拡張機能' },
    rapidosTitulo: 'クイック設定',
    rapidosAyuda: '下のテキストに反映されます。差分を確認するまで保存されません。',
    aplicarRapidos: 'テキストに反映',
    sinValor: '未定義',
    rapidos: {
      memory_limit: 'スクリプトあたりのメモリ上限 (memory_limit)',
      upload_max_filesize: '最大アップロードサイズ (upload_max_filesize)',
      post_max_size: '最大 POST サイズ (post_max_size)',
      max_execution_time: '最大実行時間・秒 (max_execution_time)',
      display_errors: 'エラーを表示 (display_errors)',
      error_reporting: 'エラー報告レベル (error_reporting)',
      'date.timezone': 'タイムゾーン (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: '; で始まる行はコメントです。',
    sinCambios: '保存済み内容からの変更はありません。',
    descartar: '変更を破棄',
    revisar: '確認して保存',
    diffTitulo: (rama: string) => `PHP ${rama} の php.ini 変更内容`,
    diffAyuda:
      '日付付きバックアップを保存し、php -v で検証したうえで PHP が起動中なら再起動します。',
    guardar: '保存して適用',
    cancelar: 'キャンセル',
    guardado: (respaldo: string) => `php.ini を保存しました。以前のバックアップ: ${respaldo}`,
    respaldosTitulo: '日付付きバックアップ',
    sinRespaldos: 'バックアップはまだありません。',
    restaurar: '復元',
    confirmarRestaurar: (nombre: string) =>
      `${nombre} を復元しますか？現在の php.ini も先にバックアップされます。`,
    restaurado: 'バックアップを復元しました。',
    recargar: '再読み込み',
    extensiones: {
      ayuda:
        'このビルドの ext/ フォルダに含まれる拡張のみ有効化できます。サードパーティ拡張はカタログからインストールします（一致ビルドかつ SHA-256 検証済み）。',
      activa: '有効',
      inactiva: '無効',
      falta: 'ファイル不足',
      catalogo: 'カタログ',
      instalar: 'インストール',
      instalada: (nombre: string) => `${nombre} をインストールして有効化しました。`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} を有効化しました。` : `${nombre} を無効化しました。`,
      buscar: '拡張機能を検索',
      vacio: '一致する拡張機能はありません。',
    },
  },
  agentes: {
    descripcion:
      'Claude Code、Codex CLI、Hermes Agent、Opencode、Gemini CLI、Qwen Code、GitHub Copilot CLI、Antigravity CLI を検出・インストールし、プロジェクトで開けます。対応エージェントは WolfCore Dev の MCP に接続できます。自動で起動することはありません。',
    recargar: '再検出',
    notaMcp:
      '登録された MCP は WolfCore Dev からエージェントを開いた（「プロジェクトで開く」）ときのみ認証されます。トークンはそのターミナルの WOLFCORE_MCP_TOKEN で渡され、設定ファイルには書き込まれません。外部から起動した場合、「wolfcore」項目は見えても接続できません。',
    sitioElegido: (nombre: string) => `${nombre} で開くエージェントを選択してください。`,
    instalado: 'インストール済み',
    noInstalado: '未インストール',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'バージョン不明',
    verVersion: 'バージョン確認',
    verVersionAyuda: '--version を実行します（画面表示時には自動実行されません）。',
    origen: {
      propio: 'WolfCore Dev によるインストール',
      'npm-usuario': 'ユーザーのグローバル npm',
      ejecutable: 'システムプログラム',
    },
    mcpRegistrado: 'MCP 登録済み',
    mcpSinRegistrar: 'MCP 未登録',
    tokenEscrito:
      'エージェントの設定ファイルに MCP トークンが平文で含まれていたため削除し、直前のバックアップではマスク (***) しました。MCP サーバーのトークン再生成をおすすめします。',
    mcpNoSoportado:
      '環境変数からトークンを読み取る方法が公式ドキュメントにないため MCP を登録しません（トークンをファイルに書き込むことはありません）。',
    instalar: 'インストール',
    instalando: 'インストール中…',
    guia: 'インストールガイド',
    soloGuia:
      'インストーラーに固定チェックサムがないため WolfCore Dev からはインストールしません。公式ガイドを参照してください。',
    registrar: 'MCP を登録',
    quitar: 'MCP を削除',
    abrir: 'プロジェクトで開く',
    confirmarInstalar: {
      titulo: (nombre: string) => `${nombre} をインストールしますか？`,
      texto: (paquete: string) =>
        `WolfCore Dev の Node を使用し、registry.npmjs.org から ${paquete} の最新版をデータフォルダにインストールします。`,
      aislado: 'お客様の npm 設定やグローバル npm には影響しません。数分かかることがあります。',
      aceptar: 'インストール',
      hecho: (nombre: string) => `${nombre} をインストールしました。`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `${nombre} に MCP を登録しますか？`,
      texto:
        'このファイルの「wolfcore」項目のみ追加または更新します（その他は変更しません）:',
      aceptar: '登録する',
      hecho: (nombre: string) => `${nombre} に MCP を登録しました。`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `${nombre} から MCP を削除しますか？`,
      texto: 'このファイルの「wolfcore」項目のみ削除します（その他は変更しません）:',
      aceptar: '削除する',
      hecho: (nombre: string) => `${nombre} から MCP を削除しました。`,
    },
    copiaPrevia:
      '変更前に同じ場所へ日付付きバックアップ (<archivo>.wolfcore-AAAAMMDD-HHmmss.bak) を最大5件保存します。エージェントが起動中なら先に閉じてください。',
    copiaHecha: (ruta: string) => `事前バックアップ: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `${nombre} を開く`,
      proyecto: 'プロジェクト',
      sinProyectos: 'プロジェクトがまだありません。',
      proveedor: 'AI プロバイダー',
      proveedorPropio: 'エージェント自身の設定を使用',
      proveedorAyuda:
        'プロバイダーを選ぶとキーはそのターミナル環境のみに渡され、ファイルやコマンドラインには書かれません。',
      aceptar: 'ターミナルを開く',
      hecho: (nombre: string) => `新しいターミナルで ${nombre} を開きました。`,
    },
    costo: {
      titulo: 'エージェントを開く前に',
      texto:
        'AI エージェントはプロバイダーのアカウントを使用するため、リクエストごとにトークンを消費し課金される場合があります。またプロジェクトファイルの読み書きやコマンド実行も行えます。',
      nunca:
        'WolfCore Dev が自動でエージェントを起動することはありません。必ずご自身の操作で起動されます。この案内は1回のみ表示されます。',
      aceptar: '理解しました、開く',
    },
  },
  depuracion: {
    descripcion:
      'PHP サイトの dump()・dd()・wd() や Python プロセスの wolfdump をファイル名・行番号付きで確認できます。ページの応答は通常通り続行します。',
    receptor: 'ダンプキャプチャ',
    escuchando: (direccion: string, puerto: number) => `${direccion}:${puerto} で待ち受け中`,
    apagado: '停止中',
    memoria:
      'ダンプはメモリ内のみ（最新 500 件）に保持され、終了時に消去されます。機密情報を含む場合があるため、コピー時に既知のキーはマスクされます。',
    sitios: 'サイト',
    sinSitios: 'PHP または FastAPI のサイトがありません。',
    sinPhp: '先にサイトで PHP バージョンを選択してください。',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'wolfdump を反映するためサイトのプロセスを再起動してください。',
    confirmarTitulo: (sitio: string) => `${sitio} でキャプチャを有効化`,
    confirmarPhp:
      'このサイトの PHP は各リクエスト前に WolfCore Dev のファイル (auto_prepend_file、このサイト限定) を読み込み、未定義なら dump()・dd()・wd() を提供します。独自に function_exists なしで dump()/dd() を定義している場合はエラーになるためキャプチャをオフにしてください。サイトは専用 PHP に切り替わります。',
    usoPhp:
      'Laravel / Symfony: 従来どおり dump($x) や dd($x)。CodeIgniter 3 その他: wd($x) で画面出力せずに送信します。',
    confirmarPython:
      'このサイトのプロセスでは PYTHONPATH に wolfdump モジュールが追加されます（プロジェクトには何も書き込まれません）。次回プロセス起動時から有効です。',
    usoPython: 'from wolfdump import dump  →  dump(値)',
    activar: 'キャプチャを有効化',
    cancelar: 'キャンセル',
    filtroSitio: 'すべてのサイト',
    filtroOrigen: 'すべてのソース',
    buscar: 'テキスト、ファイル、URL を検索',
    limpiar: 'クリア',
    confirmarLimpiar: 'メモリ内のすべてのダンプを消去しますか？',
    vacio: 'まだダンプを受信していません。',
    vacioApagado: '開始するにはキャプチャを有効化し、サイトを起動してください。',
    elegir: '一覧からダンプを選択してください。',
    copiar: 'コピー',
    copiado: 'コピーしました（キーはマスク済み）',
    sinSitio: 'サイトなし',
    total: (n: number) => `メモリ内 ${n} 件`,
    archivo: 'ファイル',
    url: 'URL',
    pestanaVolcados: 'ダンプ',
    pestanaErrores: 'エラー',
    erroresDescripcion:
      'PHP、Nginx、laravel.log、CodeIgniter 3、Python のログエラーをまとめて表示します（同一エラーは件数付きで集約）。',
    erroresVacio: 'ログにエラーはありません。書き込まれるとすぐここに表示されます。',
    erroresElegir: '一覧からエラーを選択してください。',
    actualizar: '更新',
    abrirEditor: 'エディターで開く',
    abrirEditorSinSitio: 'サイトフォルダ内のファイルのみ開けます。',
    veces: (n: number) => `${n} 回`,
    primera: '初回発生',
    ultima: '最終発生',
    fuente: 'ログ',
    traza: 'スタックトレース（最新）',
    sinTraza: 'トレースなし。',
  },
  contenedores: {
    descripcion:
      'このPC上の Docker または Podman コンテナを表示・操作します。WolfCore Dev はコンテナ・イメージ・ボリュームの作成・削除・取得を行いません。',
    motor: 'エンジン',
    refrescar: '更新',
    detectando: 'Docker と Podman を検出中…',
    sinMotorTitulo: 'Docker / Podman が見つかりません',
    sinMotor:
      'このPCに Docker または Podman が見つかりませんでした。WolfCore Dev はインストールしません。必要な場合は公式サイトからインストールして「更新」を押してください。',
    instalarDocker: 'Docker をインストール',
    instalarPodman: 'Podman をインストール',
    apagadoTitulo: (m: string) => `${m} が応答しません`,
    apagado: (m: string) =>
      `${m} はインストールされていますがエンジンが応答しません。Docker Desktop を開くか（「podman machine start」で起動し）「更新」を押してください。`,
    remoto:
      'リモート接続（DOCKER_HOST、CONTAINER_HOST、コンテキスト、既定接続）は無視されました。WolfCore Dev はこのPCのエンジンのみを使用します。',
    desdePath: '通常のインストール先ではなく PATH から検出されました。',
    version: (v: string) => `バージョン ${v}`,
    vacio: 'コンテナはありません。',
    columnas: {
      nombre: '名前',
      imagen: 'イメージ',
      estado: '状態',
      puertos: 'ポート',
      compose: 'Compose',
      acciones: '操作',
    },
    estados: {
      corriendo: '実行中',
      detenido: '停止中',
      pausado: '一時停止',
      otro: 'その他',
    },
    codigoSalida: (n: number) => `コード ${n}`,
    iniciar: '起動',
    detener: '停止',
    reiniciar: '再起動',
    registros: 'ログ',
    confirmarDetenerTitulo: 'コンテナを停止しますか？',
    confirmarDetener: (n: string) =>
      `「${n}」を停止します。内部のプロセスは終了します（エンジンが数秒待機します）。データは削除されません。`,
    confirmarReiniciarTitulo: 'コンテナを再起動しますか？',
    confirmarReiniciar: (n: string) =>
      `「${n}」を再起動します。内部のプロセスは終了して再起動されます。データは削除されません。`,
    confirmar: '確認',
    cancelar: 'キャンセル',
    hecho: {
      iniciar: (n: string) => `「${n}」を起動しました。`,
      detener: (n: string) => `「${n}」を停止しました。`,
      reiniciar: (n: string) => `「${n}」を再起動しました。`,
    },
    registroTitulo: (n: string) => `「${n}」のログ`,
    registroEsperando: 'ログ行を待機中…',
    registroFin: 'ログが終了しました（コンテナ停止またはエンジン切断）。',
    cerrar: '閉じる',
  },
  versiones: {
    pestana: 'バージョン',
    pestanaServicios: 'サービス',
    elegirServicio: 'サービス',
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
        '各メジャーバージョン (8.4, 17…) は独自のデータフォルダとポートを持つインスタンスとなり、複数同時起動できます。星印は新規プロジェクトの既定を示します。',
      pool: '起動中の各 PHP バージョンは独立して動作します。星印は新規プロジェクトの既定です。',
      unica:
        '複数バージョンをインストールできますが、同時に起動できるのは1つのみです。別バージョンを起動すると切り替わります。',
      ninguno:
        '起動不要です。プロジェクトは指定バージョンまたは既定バージョン（星印）を使用します。',
    },
    filtroRama: 'バージョン',
    todasRamas: 'すべてのバージョン',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'すべて表示',
    origen: {
      vivo: 'オンライン',
      cache: (h: number) => (h < 1 ? '1時間以内のキャッシュ' : `${h}時間前のキャッシュ`),
      fija: 'オフライン一覧',
    },
    actualizarLista: '一覧を更新',
    errorCarga: 'バージョン一覧を読み取れませんでした',
    vacio: '表示するバージョンがありません。',
    soporte: { lts: 'LTS', actual: '現行', fin: 'サポート終了', preview: 'プレビュー' },
    finSoporte: (f: string) => `${f} までサポート`,
    finSoportePasado: (f: string) => `${f} にサポート終了`,
    marcas: {
      instalada: 'インストール済み',
      encendida: '稼働中',
      actualizacion: (v: string) => `更新: ${v}`,
      bloqueada: 'ロック中',
      sinHuella: '公開チェックサムなし',
      huellaDebil: 'MD5 のみ',
      firmada: 'PGP 署名あり',
    },
    ayudaFirmada:
      '公式配布元が PGP 署名しています。インストール前にアプリ内蔵の公開鍵で検証します。',
    ayudaSinHuella:
      '公式配布元が強いチェックサム (SHA-256 / SHA-512) を公開していないため検証できません。',
    instalar: 'インストール',
    desinstalar: 'アンインストール',
    encender: '起動',
    apagar: '停止',
    actualizar: '更新',
    usarEsta: 'このバージョンを使う',
    usarEstaAyuda: (id: string) =>
      `${id} はこのサービスの別バージョンを使用しています。切り替え前にデータをバックアップします。`,
    predeterminada: '新規プロジェクトの既定',
    hacerPredeterminada: '新規プロジェクトの既定にする',
    predeterminadaHecha: (v: string) => `${v} を既定に設定しました。`,
    puerto: 'ポート',
    puertoDe: (id: string) => `${id} のポート`,
    cambiarPuerto: '変更',
    puertoCambiado: (p: number) => `ポートを ${p} に変更しました。`,
    puertoProyectosTitulo: '旧ポートを使用中のプロジェクト',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `次のプロジェクトの .env が旧ポート ${viejo} のままです（自動変更されません）: ${lista}。${nuevo} に変更してください。`,
    resolver: '解決',
    instalada: (v: string) => `${v} をインストールしました。`,
    selector: { etiqueta: 'インスタンス', predeterminada: '既定', apagada: '停止中' },
    dialogoSinHuella: {
      titulo: (v: string) => `チェックサムなしで ${v} をインストール`,
      riesgo:
        '公式配布元がこのバージョンのチェックサムを公開していないため、ダウンロードの改ざん有無を検証できません。',
      explicacion:
        '公式サイトから HTTPS でダウンロードしますが、サイトや通信が侵害された場合は検知できません。必要な場合のみインストールしてください。',
      alternativa: (v: string) => `同じサービスの検証済みバージョンがあります: ${v}。`,
      casilla: 'リスクを理解した上で検証なしでインストールする',
      instalarVerificada: (v: string) => `${v}（検証済み）をインストール`,
      instalarIgual: '検証なしでインストール',
    },
    dialogoActualizar: {
      titulo: (n: string) => `${n} を更新`,
      tituloRama: (v: string) => `新しいバージョン: ${v}`,
      ninguna: 'なし',
      instancia: (id: string) => `インスタンス ${id} を更新します。変更前に次を行います:`,
      pasoInstalar: (v: string) => `現在のバージョンを残したまま ${v} を並行インストールします。`,
      pasoVolcados: '現在のバージョンで各データベースをダンプします。',
      pasoCopia: '停止してデータフォルダ全体をコピーします（コールドバックアップ）。',
      pasoArrancar: '新しいバージョンで起動し、応答を確認します。',
      pasoVuelta:
        '起動に失敗した場合は元のバージョンとデータへ自動的に戻り、バックアップも残ります。',
      datos: 'データ:',
      respaldo: 'バックアップ先:',
      espacio: '空き容量:',
      espacioLibre: (libres: string, necesarios: string) =>
        `空き ${libres} / 必要 ${necesarios}`,
      datosQuedan:
        '以前のデータは削除されません。コピーとダンプは手動削除するまで「更新バックアップ」に残ります。',
      sinEspacio: 'バックアップに必要な空き容量が足りません。容量を空けて再試行してください。',
      alLado: (v: string) =>
        `${v} をインストールします。他のインストール済みバージョンは変更されず、指定しているプロジェクトもそのまま動作します。`,
      ramaExplicacion:
        '新しいメジャーバージョンは既存を置き換えず、専用のデータフォルダとポートを持つ新規インスタンスとして作成されます。既存インスタンスはそのまま残ります。',
      copiarDesdeTitulo: '新インスタンスのデータ',
      copiarDesde: (id: string) =>
        `${id} からデータをコピー（ダンプと復元。元は変更しません）`,
      vacia: '空の状態で開始',
      ramaNota:
        'データベースユーザーはコピーされません。プロジェクトは新インスタンスのポートを指定してください。',
      crearInstancia: '新規インスタンスを作成',
      confirmar: 'バックアップして更新',
      hecho: (v: string) => `${v} を更新しました。`,
      fallo: '更新できませんでした',
      ramaCreada: (id: string) => `インスタンス ${id} を作成しました。`,
      copiadas: (l: string) => `コピー済み: ${l}。`,
      noCopiada: (b: string, m: string) => `${b} をコピーできませんでした: ${m}`,
    },
    limpieza: {
      boton: '未使用バージョンを整理…',
      titulo: '未使用バージョンを整理',
      intro:
        'どこからも使用されていないバージョンのプログラム（bin フォルダ）のみを削除します。データベース、インスタンス、プロジェクトには一切触れません。',
      cargando: 'バージョンを検索中…',
      vacia: 'インストール済みのバージョンがありません。',
      sinLibres: 'インストール済みのバージョンはすべて使用中です。整理対象はありません。',
      fallo: '整理できませんでした',
      fallaLista: 'バージョン一覧を読み取れませんでした',
      bloqueada: '選択不可',
      marcadas: (n: number, tam: string) => `${n} バージョン · ${tam}`,
      destinoTitulo: '処理方法',
      papelera: 'ゴミ箱へ移動: 7日間保持（その間ディスク容量を消費します）',
      definitivo: '完全に削除: 今すぐ容量を解放（元に戻せません）',
      avisoDefinitivo:
        '完全削除: これらのバージョンを再度使うには再ダウンロードが必要です。',
      instantanea:
        '完全削除を選んだ場合、実行前に環境設定のスナップショットを保存します。ゴミ箱からは復元可能です。',
      entiendo: '元に戻せないことを理解しました',
      confirmar: (n: number) => `${n} バージョンを削除`,
      motivos: {
        predeterminada: '既定のバージョン',
        encendida: '起動中または実行中',
        sitio: 'プロジェクトで使用中',
        instancia: 'インスタンスで使用中（停止中を含む）',
        plantilla: 'テンプレートで使用中',
        workspace: 'ワークスペースで使用中',
        runtime: 'プロジェクトで使用中',
        tarea: 'スケジュールタスクのあるプロジェクトで使用中',
        duda: '確認できなかったため変更しません',
        datos: 'このバージョンでのみ開けるデータがあります',
        herramienta: 'phpMyAdmin または Adminer で使用中',
      },
      resultadoTitulo: '結果',
      liberadas: (tam: string) => `${tam} を解放しました。`,
      enPapelera: (tam: string) => `${tam} をゴミ箱へ移動しました（7日後に完全消去）。`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} バージョンは bin から移動済みですが一部残骸があり、次回起動時に再試行します。`,
      instantaneaGuardada: '削除前に環境スナップショットを保存しました。',
      ajeno: (lista: string) =>
        `ご自身でインストールしたパッケージを含みます: ${lista}。削除すると失われます。`,
      incluirAjeno: 'それらが失われても削除する',
      sinCatalogo: 'カタログに存在しないため、削除すると再ダウンロードできません。',
      papeleraTitulo: 'ゴミ箱',
      recuperar: '復元',
      recuperada: (v: string) => `${v} を復元しました。`,
      borradaEl: (f: string) => `削除日: ${f}`,
      fallaRecuperar: '復元できませんでした',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `${v} をアンインストール`,
      binario: 'このバージョンのプログラムファイルのみ削除します。',
      instancia: (id: string) =>
        `インスタンス ${id} が使用中です。停止してインスタンス一覧から削除します。`,
      datosQuedan:
        'データはディスクに残ります。このバージョンを再インストールすれば再び開けます。',
      borrarDatos: 'データも一緒に削除する',
      borrarAviso: (id: string) =>
        `${id} のデータフォルダとすべてのデータベースを削除します。元に戻せません。確認のため "${id}" と入力してください。`,
      escriba: (id: string) => `確認のため ${id} と入力してください`,
      desinstalar: 'アンインストール',
      desinstalarYBorrar: 'アンインストールしてデータ削除',
      unica:
        '現在アクティブなバージョンです。唯一のインストール済みバージョンなら停止後に削除できます。他がある場合は先に別のバージョンを既定（星印）にしてください。',
      predeterminada: (id: string) =>
        `${id} は既定のインスタンスです。データベース、.env ブロック、ツールは別のインスタンス（別ポート）へ切り替わります。`,
      hecho: (v: string) => `${v} をアンインストールしました。`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `${id} のロックを解決`,
      explicacion:
        '更新が失敗しデータを自動で戻せなかったため、対処を選ぶまで起動しません。データは何も削除されていません。',
      fallida: '影響を受けたデータ:',
      respaldo: 'バックアップ:',
      opciones: '対処方法',
      devolver: (sello: string, tam: string) =>
        `バックアップ ${sello} (${tam}) を復元する（現在のフォルダは削除せず退避します）`,
      usarActual: '現在のデータフォルダをそのまま使用する',
      notaActual:
        '現在のフォルダに完全なデータがある場合のみ選択してください。不完全な場合はバックアップを選んでください。',
      notaDevolver: 'バックアップをコピー・検証してから元の位置へ戻します。',
      escriba: (id: string) => `確認のため ${id} と入力してください`,
      elegirVersion:
        'ロック情報を読み取れませんでした。データを開くバージョン（更新前のバージョン）を選択してください。',
      version: 'バージョン',
      confirmar: '解決する',
      hecho: (id: string) => `${id} のロックを解除しました。起動できるようになりました。`,
    },
    respaldos: {
      titulo: '更新時のバックアップ',
      descripcion:
        '更新や新バージョン導入時に作成されたコピーです。各インスタンスが現在使用中のデータフォルダは表示されません。',
      vacio: 'バックアップはありません。',
      tipos: {
        respaldo: 'コールドバックアップ',
        volcados: 'データベースダンプ',
        fallida: '失敗したバージョンのデータ',
        restaurando: '未完了の復元',
        copia: '新バージョン用ダンプ',
      },
      archivos: (n: number) => `${n} ファイル`,
      borrar: '削除',
      borrarDe: (n: string) => `${n} を削除`,
      confirmarTitulo: 'バックアップを削除',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) を削除します。元に戻せません。インスタンスが使用中のデータには触れません。`,
      borrado: 'バックアップを削除しました。',
    },
  },
  navGrupos: {
    trabajo: '作業',
    entorno: '環境',
    utilidades: 'ユーティリティ',
  },
  avisos: {
    campana: '通知',
    campanaConNuevos: (n: number) => `通知: 未読 ${n} 件`,
    titulo: '通知センター',
    vacio:
      '通知はありません。サービスの停止、ポート競合、証明書の期限通知などがここに表示されます。',
    marcarTodos: 'すべて既読にする',
    limpiar: '履歴をクリア',
    ver: '表示',
    actualizar: '更新',
    verVersiones: 'バージョンを見る',
    cerrar: '閉じる',
    niveles: { info: '情報', aviso: '警告', error: 'エラー' },
    sinLeer: '未読',
  },
  barra: {
    paleta: 'コマンドを検索または実行',
    atajoPaleta: 'Ctrl+K',
    tema: 'テーマを切り替え',
    idioma: '言語を切り替え',
  },
  preferencias: {
    titulo: '外観と言語',
    descripcion: '変更は即座に適用され、このPCに保存されます。',
    tema: 'テーマ',
    temas: { sistema: 'システム', claro: 'ライト', oscuro: 'ダーク' },
    idioma: '言語',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語' },
    acento: 'アクセントカラー',
    acentos: {
      indigo: 'インディゴ',
      azul: 'ブルー',
      verde: 'グリーン',
      violeta: 'バイオレット',
      naranja: 'オレンジ',
      rosa: 'ピンク',
    },
    acentoPropio: (color: string) => `カスタム (${color})`,
    errorGuardar: '設定を保存できませんでした',
    asistente: '初期セットアップウィザード',
    asistenteAyuda:
      '初期手順をやり直します: プロジェクトフォルダ、基本ツール、CA、GitHub、監視フォルダ。',
    asistenteAbrir: 'ウィザードを開く',
  },
  paleta: {
    titulo: 'コマンドパレット',
    placeholder: '画面、サービス、プロジェクト、ツールを検索…',
    sinResultados: '一致するコマンドがありません。',
    ayuda: '↑ ↓ 移動 · Enter 実行 · Esc 閉じる',
    grupos: {
      navegacion: '移動',
      servicios: 'サービス',
      proyectos: 'プロジェクト',
      herramientas: 'ツール',
      github: 'GitHub',
      general: '一般',
    },
    irA: (pantalla: string) => `${pantalla} へ移動`,
    encender: (servicio: string) => `${servicio} を起動`,
    apagar: (servicio: string) => `${servicio} を停止`,
    iniciarTodo: 'すべてのサービスを起動',
    detenerTodo: 'すべてのサービスを停止',
    iniciarWorkspace: (n: string) => `ワークスペース ${n} を起動`,
    detenerWorkspace: (n: string) => `ワークスペース ${n} を停止`,
    abrirSitio: (nombre: string) => `${nombre} をブラウザで開く`,
    traerCambios: (nombre: string) => `${nombre} の変更を取得`,
    abrirHerramienta: (nombre: string) => `${nombre} を開く`,
    clonar: 'GitHub からリポジトリをクローン',
    agregarProyecto: 'プロジェクトを追加',
    nuevoProyecto: '新規プロジェクトを作成',
    tema: (tema: string) => `テーマ: ${tema}`,
    idioma: (idioma: string) => `言語: ${idioma}`,
    asistente: '初期セットアップウィザードを開く',
  },
  nuevoProyecto: {
    titulo: '新規プロジェクト',
    boton: '新規プロジェクト',
    descripcion:
      'ゼロからプロジェクトを作成します: フォルダ、HTTPS サイト、データベース、接続設定。',
    pasos: { tipo: '種別', datos: '詳細', resumen: '確認', crear: '作成中' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Composer で作成。アプリキー、データベース、マイグレーション付き。',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: '公式 Appstarter と .env 設定。' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'database.php 設定済みの定番フレームワーク。',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: '公式スケルトン（または webapp）と .env.local。',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: '仮想環境、requirements.txt、uvicorn プロセス。',
      },
      wordpress: { nombre: 'WordPress', descripcion: '公式版ダウンロードと wp-config.php 設定済み。' },
      estatico: {
        nombre: '静的サイト',
        descripcion: 'Nginx で配信する HTML/CSS（データベース不要）。',
      },
    },
    campos: {
      nombre: 'プロジェクト名',
      nombrePlaceholder: 'my-shop',
      nombreAyuda: (dominio: string) => `${dominio} になります（小文字英字・数字・ハイフン）。`,
      carpeta: '親フォルダ',
      elegirCarpeta: 'フォルダを選択…',
      cambiarCarpeta: 'フォルダを変更…',
      carpetaAyuda:
        'このフォルダ内にプロジェクト名の新しいフォルダを作成します。空または未存在である必要があります。',
      php: 'PHP バージョン',
      python: 'Python バージョン',
      sinInstalada: '未インストール: 先に「サービス」でインストールしてください。',
      conBase: 'プロジェクト用データベースを作成',
      sinBase: 'データベースなし',
      instancia: 'データベースサーバー',
      apagada: '停止中',
      apagadaAyuda:
        'このサーバーは停止中です。作成前に「サービス」で起動してください。',
      sinMotores: 'このプロジェクト種別に対応したデータベースサーバーがインストールされていません。',
      nombreBase: 'データベース名',
      starterKit: 'スターターキット',
      starterKits: { ninguno: 'なし', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Web パッケージを含める (webapp)',
      pgvector: 'pgvector（ベクトル検索）を有効化',
    },
    huella: {
      titulo: 'WordPress は弱いチェックサムのみ公開しています',
      riesgo:
        '公開されているハッシュは安全性が低い SHA-1 であり、アーカイブと同じサイトから提供されます。',
      explicacion:
        'サイトや通信が侵害された場合、改ざんされたファイルが検証を通過する可能性があります。wordpress.org から HTTPS で取得しますが、信頼できる場合のみ続行してください。',
      leyendo: '公開チェックサムを読み込み中…',
      noDisponible:
        '現在チェックサムを読み取れませんでした（オフラインまたは応答なし）。作成時に再取得します。',
      fuente: '配布元: wordpress.org',
      casilla: 'チェックサムが弱いことを理解した上でプロジェクトを作成する',
    },
    resumen: {
      titulo: '作成される内容',
      intro: '開始前に確認してください。',
      tipo: '種別',
      carpeta: 'フォルダ',
      sitio: 'サイト',
      dominio: 'ドメイン',
      https: 'HTTPS アドレス',
      php: 'PHP',
      python: 'Python',
      base: 'データベース',
      env: '接続の書き込み先',
      nota: '手順が失敗しても作成済みのものは削除されません。状況を確認して再試行できます。',
    },
    errores: {
      nombreVacio: 'プロジェクト名を入力してください。',
      nombreInvalido:
        '小文字英字・数字・ハイフン（最大 40 文字）のみ使用でき、先頭・末尾のハイフンは不可です。',
      sinCarpeta: 'プロジェクトの親フォルダを選択してください。',
      sinPhp: 'PHP バージョンを選択してください（未インストールなら「サービス」から導入）。',
      sinPython: 'Python バージョンを選択してください（未インストールなら「サービス」から導入）。',
      sinInstancia: 'データベース作成先サーバーを選ぶか、データベース作成をオフにしてください。',
      baseInvalida: 'このエンジンでは無効なデータベース名です。',
      motorNoVale: 'WordPress には MySQL または MariaDB が必要です。',
      pgvectorMotor: 'pgvector には PostgreSQL が必要です。',
      huellaDebil: 'WordPress のチェックサムが弱いことへの確認が必要です。',
    },
    acciones: {
      cambiarCarpeta: '別のフォルダを選択',
      cambiarBase: 'データベース名を変更',
      cambiarNombre: '名前を変更',
      reintentarPaso: '手順を再試行',
      servicios: 'サービスへ移動',
      confirmarHuella: '確認事項を見直す',
    },
    botones: {
      siguiente: '次へ',
      atras: '戻る',
      crear: 'プロジェクトを作成',
      creando: '作成中…',
      cerrar: '閉じる',
      abrirEditor: 'エディターで開く',
      verSitio: 'サイトを表示',
      verProyecto: 'プロジェクトで表示',
    },
    progreso: {
      titulo: 'プロジェクトを作成中',
      listo: 'プロジェクトを作成しました。',
      fallo: (paso: string) =>
        `手順「${paso}」が失敗しました。何も削除されていません。再試行するか原因を修正してください。`,
      quedo: (partes: string) => `作成済み: ${partes}。`,
      quedoCarpeta: 'フォルダ',
      quedoBase: (nombre: string) => `データベース ${nombre}`,
      quedoSitio: 'サイト',
      avisos: '通知',
      sinUsuarioPropio:
        'システム暗号化が利用できないため管理者接続を使用しました。利用可能になったら .env マネージャーの「専用ユーザーを使う」を実行してください。',
      editorFallo: 'エディターを開けませんでした。',
    },
  },
  importar: {
    boton: 'インポート…',
    titulo: 'Laragon、XAMPP、Herd からインポート',
    intro:
      'サイトは現在の場所のまま関連付けられます。フォルダの移動・コピー・変更は行いません。必要に応じてデータベースもコピーできます。他プログラムの環境は読み取りのみ行います。',
    buscando: 'インストールを検索中…',
    nada: '通常のフォルダに Laragon、XAMPP、Herd は見つかりませんでした。',
    errorVista: 'インポート対象を検索できませんでした',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'サイト',
      todos: 'すべて選択',
      ninguno: '選択を解除',
      dominio: (d: string) => `ドメイン ${d}`,
      dominioPropuesto: (d: string) => `ドメイン ${d}（提案）`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP 未確定',
      base: (nombre: string, motor: string) => `データベース ${nombre} (${motor})`,
      yaVinculado: '既に WolfCore Dev のサイトです',
      dominioEnUso: '別のサイトがこのドメインを使用中です',
    },
    avisos: {
      sin_dominio: '元プログラムにドメインがないため提案しました。',
      dominio_invalido: '元のドメインが無効なため提案しました。',
      sin_vhost: '専用の仮想ホストがないためドメインを提案しました。',
      php_desconocido: '使用中の PHP バージョンが不明なためインストール済みから選択しました。',
      base_no_local: 'データベースが別サーバーにあるためインポートしません。',
      base_nombre_invalido: 'データベース名が無効なためインポートしません。',
      motor_no_soportado: 'MySQL / MariaDB 以外のデータベースはインポートしません。',
    },
    problemas: {
      titulo: (n: number) => `${n} 件を除外または読み取り不可`,
    },
    bases: {
      titulo: 'データベース',
      importarBases: 'データベースもインポートする',
      ayuda:
        '続行前に元プログラムのデータベースサーバーを起動してください（WolfCore Dev は外部プログラムを起動・停止しません）。パスワードは今回のみ使用し保存しません。',
      destino: 'インポート先サーバー',
      apagada: '停止中',
      sinMotores:
        'MySQL または MariaDB が未インストールです。「サービス」からインストールしてください。',
      puerto: '移行元サーバーのポート',
      usuario: 'ユーザー',
      clave: 'パスワード',
      claveAyuda: 'パスワードがない場合（Laragon や XAMPP の root など）は空欄にしてください。',
      existe: '移行先に既に存在します',
      reemplazar: '置換する（事前にバックアップ作成）',
      noSeToca: 'チェックしない場合は変更しません。',
    },
    pasos: { elegir: '選択', confirmar: '確認' },
    continuar: '続行',
    volver: '戻る',
    cancelar: 'キャンセル',
    importar: 'インポート',
    cerrar: '閉じる',
    sinSeleccion: 'サイトを少なくとも1つ選択してください。',
    origenIncompleto: '移行元サーバーのポートとユーザーを指定してください。',
    confirmar: {
      titulo: 'インポートの確認',
      sitios: (n: number) =>
        `${n} 件のサイトを現在のフォルダのまま関連付けます。ファイルの移動・コピー・変更は行いません。`,
      sinConfianza:
        '「このリポジトリを信頼する」にチェックするまで、インポートしたサイトでレシピは実行されません。',
      hosts:
        'Nginx と hosts ファイルを更新します（Windows が管理者権限を求める場合があります）。',
      basesNuevas: (nombres: string) => `次のデータベースをコピーします: ${nombres}。`,
      basesReemplazo: (nombres: string) =>
        `既存の次のデータベースを置換します: ${nombres}。事前にそれぞれバックアップします。`,
      basesSinTocar: (nombres: string) => `既存の次のデータベースは変更しません: ${nombres}。`,
      origen: (puerto: number, usuario: string) =>
        `元プログラムのサーバー (127.0.0.1:${puerto}、ユーザー ${usuario}) から読み取り専用でダンプします。`,
      sinBases: 'データベースはインポートされません。',
      proteccion:
        '各データベースの構造を事前検証し、制限付きユーザーでデータを取り込みます。失敗時は元の状態のまま保たれます。',
    },
    resultado: {
      titulo: 'インポート結果',
      importando: 'インポート中…',
      cancelar: 'インポートをキャンセル',
      restaurada: '元のデータベースはバックアップから自動復元され、元の状態に戻りました。',
      sitioOk: 'インポート済み',
      sitioFallo: 'インポート失敗',
      baseOk: (n: string) => `データベース ${n} をインポートしました`,
      baseFallo: (n: string) => `データベース ${n} をインポートできませんでした`,
      copiaPrevia: (ruta: string) => `元のデータベースのバックアップ: ${ruta}`,
      phpDistinto: (v: string) => `PHP ${v} を使用しました（元のバージョンが未インストールのため）。`,
      sinAplicar:
        'Nginx または hosts ファイルが反映されませんでした。「プロジェクト」の通知から再試行してください。',
      resumen: (s: number, b: number) =>
        `サイト ${s} 件、データベース ${b} 件をインポートしました。`,
      errorImportar: 'インポートできませんでした',
    },
  },
  plantillas: {
    guardarComo: 'テンプレートとして保存…',
    dialogo: {
      titulo: (nombre: string) => `「${nombre}」をテンプレートとして保存`,
      intro:
        'テンプレートにはレシピ、PHP・Nginx 設定、拡張機能、データベース構造（テーブル定義のみでデータ行なし）を保存します。パスワード、キー、データは一切保存しません。',
      nombre: 'テンプレート名',
      nombrePlaceholder: 'マイベースプロジェクト',
      conArchivos: 'プロジェクトファイルも含める',
      conArchivosAyuda: 'オフの場合はレシピ、設定、スキーマのみ保存されます。',
      siempre: '常に除外される項目',
      siempreLista:
        '.env、.env.*、vendor、node_modules、.git、.venv、ログ、ダンプ、ファイルDB (*.sql, *.dump, *.sqlite)、鍵・証明書 (*.pem, *.key, *.crt…)、wp-config.php、wolfcore.yml。キーやパスワードを含むファイルも除外されます。',
      extra: '追加の除外項目（1行に1つ）',
      extraAyuda: 'プロジェクト内の名前または相対パス（例: uploads や public/build）。',
      vista: '保存される内容',
      calculando: '計算中…',
      resumen: (archivos: number, tamano: string) => `${archivos} ファイル · ${tamano}`,
      fuera: (n: number) => `${n} 件を除外`,
      sinArchivos: 'レシピ、設定、スキーマのみ保存されます（ファイルなし）。',
      baseVolcado: (nombre: string, servidor: string) =>
        `データベース ${nombre}（サーバー ${servidor}）の構造のみ保存します（データ行なし）。`,
      sinBase: 'プロジェクトにデータベース設定がないためスキーマは保存しません。',
      avisoMongodb: 'MongoDB のスキーマ（コレクション・インデックス）は保存されません。',
      incluirDeTodosModos: 'それでも含める',
      avisoIncluir: 'このファイルに実際のキーが含まれている場合、テンプレートに格納されます。',
      guardar: 'テンプレートを保存',
      guardada: (nombre: string) => `テンプレート「${nombre}」を保存しました。`,
      errorGuardar: 'テンプレートを保存できませんでした',
      errorVista: 'プレビューを計算できませんでした',
      cancelar: 'キャンセル',
    },
    lista: {
      titulo: 'マイテンプレート',
      ayuda:
        '既存プロジェクトのレシピ・設定・構造（データなし）から新しいプロジェクトを開始できます。',
      vacia:
        'テンプレートはまだありません。プロジェクトカードのメニューから保存できます。',
      conArchivosEtiqueta: 'ファイルあり',
      soloEsquema: 'レシピと構造',
      conBase: (motor: string) => `${motor} スキーマのみ`,
      borrarEtiqueta: (nombre: string) => `テンプレート ${nombre} を削除`,
      borrarTitulo: (nombre: string) => `テンプレート ${nombre} を削除しますか？`,
      borrarTexto:
        'テンプレートのみ削除されます。これから作成したプロジェクトや元のプロジェクトには影響しません。',
      borrada: 'テンプレートを削除しました。',
      errorBorrar: 'テンプレートを削除できませんでした',
      errorLista: 'テンプレート一覧を読み取れませんでした',
      desde: (nombre: string) => `テンプレート: ${nombre}`,
      avisoSinBase: 'このテンプレートにはデータベースが含まれていません。',
      importadaEtiqueta: 'インポート済み',
      avisoImportada:
        '第三者由来のテンプレートです。プロジェクトは未信頼状態で作成されプロセスも起動しません。サイトを開くとコードが実行されるため事前にファイルを確認してください。',
      generadoresTitulo: 'ゼロから作成',
    },
  },
  env: {
    accion: '.env 変数…',
    titulo: (nombre: string) => `${nombre} の .env`,
    intro:
      '機密値はマスクして表示されます。「表示」を押すと30秒間だけ全文を表示します。保存前に現在の .env の日付付きバックアップを作成します。',
    noExiste: 'このプロジェクトにはまだ .env がありません。保存時に作成されます。',
    tablaEtiqueta: '.env 変数一覧',
    sinVariables: '.env に変数がありません。',
    secretaEtiqueta: '機密',
    duplicadaEtiqueta: '重複',
    duplicadaAyuda:
      'この変数は .env 内に複数回定義されています。最後の定義を表示・編集します。',
    soloLecturaEtiqueta: '複数行',
    soloLecturaAyuda: '複数行にわたるため、ファイル上で直接編集してください。',
    seQuitara: '保存時に削除されます',
    valorNuevo: '新しい値',
    valorNuevoDe: (clave: string) => `${clave} の新しい値`,
    valorDe: (clave: string) => `${clave} の値`,
    vacio: '（空）',
    mostrar: '表示',
    ocultar: '隠す',
    mostrarEtiqueta: (clave: string) => `${clave} の値を表示`,
    ocultarEtiqueta: (clave: string) => `${clave} の値を隠す`,
    cambiar: '変更',
    deshacer: '元に戻す',
    deshacerEtiqueta: (clave: string) => `${clave} の変更を元に戻す`,
    quitar: '削除',
    quitarEtiqueta: (clave: string) => `変数 ${clave} を削除`,
    errorRevelar: '値を表示できませんでした',
    agregarTitulo: '変数を追加',
    agregarNombre: '変数名',
    agregarValor: '値',
    agregar: '追加',
    nombreInvalido:
      '英数字・アンダースコア・ドットを使用してください（数字開始不可、重複不可）。',
    comparar: {
      titulo: 'サンプルファイルと比較',
      sinEjemplo: '比較用の .env.example がありません。',
      alDia: '.env にはサンプルと同じ変数が揃っています。',
      faltan: (n: number) => `不足 ${n} 件:`,
      sobran: (n: number) => `余剰 ${n} 件（サンプルにない項目）:`,
      distintas: (n: number) => `サンプルと値が異なる項目 ${n} 件:`,
      agregarFaltantes: '不足分を追加',
    },
    bloques: {
      titulo: '変数ブロックを追加',
      ayuda:
        'そのカテゴリのうち .env に不足している変数のみ追加します（既存変数は変更せず、パスワードやキーも空です）。追加後に表で入力してください。',
      bd: 'データベース',
      correo: 'メール',
      ia: 'AI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: '専用ユーザーを使う',
      ayuda:
        'このプロジェクトのデータベース専用ユーザー（管理者権限なし）を作成して .env に書き込みます。現在 WolfCore Dev の MySQL / MariaDB に対応しています。',
      confirmarTitulo: 'データベースに専用ユーザーを使用しますか？',
      confirmarTexto:
        'ランダムなパスワードとこのデータベース限定の権限を持つ新ユーザーを作成し、.env の接続情報を更新します。事前に .env をバックアップし、新パスワードは .env と WolfCore Dev 内に暗号化保存します。',
      confirmar: '作成して使用',
      hecho: (usuario: string) => `プロジェクトはユーザー ${usuario} を使用するようになりました。`,
      compartirTitulo: '別プロジェクトのユーザーを共有しますか？',
      compartirTexto: (base: string, proyecto: string) =>
        `データベース ${base} は ${proyecto} でも使用中です。同じユーザーを共有しますか？パスワードは変更しないため ${proyecto} の接続は維持されます。`,
      compartir: 'ユーザーを共有',
      error: 'データベースユーザーを変更できませんでした',
    },
    copias: {
      titulo: 'バックアップに戻す',
      ninguna: 'この .env のバックアップはまだありません。',
      volver: 'このバックアップに戻す',
      confirmarTitulo: '.env のバックアップに戻しますか？',
      confirmarTexto: (fecha: string) =>
        `現在の .env を ${fecha} のバックアップで置き換えます。事前に現在の内容もバックアップされるため元に戻せます。`,
      hecho: 'バックアップを復元しました。',
      error: 'バックアップに戻せませんでした',
    },
    cambiosPendientes: (n: number) => `未保存の変更 ${n} 件`,
    descartar: '変更を破棄',
    guardar: '確認して保存…',
    cerrar: '閉じる',
    cerrarTitulo: '保存せずに閉じますか？',
    cerrarTexto: (n: number) => `未保存の変更が ${n} 件あります。閉じると失われます。`,
    cerrarDescartar: '保存せずに閉じる',
    seguirEditando: '編集を続ける',
    confirmar: {
      titulo: '.env の変更を保存',
      texto:
        '次の内容が変更されます（機密値はマスク表示）。現在の .env を日付付きでバックアップしてから一括書き込みします。',
      sinCambios: '保存する変更はありません。',
      agregarGitignore: 'プロジェクトの .gitignore に .env を追加する',
      aceptarVersionado: 'リスクを理解した上で保存する',
      guardar: '変更を保存',
      versionado:
        'Git がこのプロジェクトの .env を追跡しています。.gitignore にあっても次のコミットで値が送信されます。git rm --cached .env で追跡を外してください。',
      versionadoDesconocido:
        'Git が .env を追跡しているか確認できませんでした。保存するには別途確認してください。',
    },
    errorVistaPrevia: 'プレビューを準備できませんでした',
    errorGuardar: '.env を保存できませんでした',
    guardado: '.env を保存しました。',
    guardadoConCopia: '.env を保存しました（以前のバージョンをバックアップ済み）。',
  },
  asistenteInicio: {
    titulo: 'WolfCore Dev へようこそ',
    subtitulo:
      '5つのステップで環境を整えます。各ステップのボタンを押すまで何もインストール・変更されません。',
    paso: (n: number, total: number) => `ステップ ${n} / ${total}`,
    anterior: '戻る',
    siguiente: '次へ',
    omitirTodo: 'ウィザードをスキップ',
    terminar: '完了',
    hecho: '完了',
    reabrir: '「設定」からいつでも再度開けます。',
    pasos: {
      carpeta: {
        titulo: 'プロジェクトフォルダ',
        texto:
          'プロジェクトの保存先です。新規リポジトリのクローン先となり、最後のステップで監視対象になります。',
        elegir: 'フォルダを選択',
        actual: (ruta: string) => `選択済みフォルダ: ${ruta}`,
        guardada: (ruta: string) => `現在のフォルダ: ${ruta}`,
        ninguna: '未選択: C:\\Proyectos があれば使用されます。',
      },
      basicos: {
        titulo: '基本ツールのインストール',
        texto:
          'Nginx、PHP 8.4、Composer、Node LTS を公式配布元からチェックサム検証付きで導入します。ボタンを押したものだけインストールされます。',
        instalado: 'インストール済み',
        instalar: (version: string) => `${version} をインストール`,
        sinVersion: 'カタログにバージョンがありません',
        cargando: 'バージョンを検索中…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'ローカル認証局を信頼する',
        texto:
          '.test サイトを警告なしで HTTPS 表示するため、Windows で WolfCore Dev の認証局を信頼します。Windows が確認画面を表示します。',
        confiar: 'CA を信頼する',
        confiada: 'Windows は既にローカル認証局を信頼しています。',
      },
      github: {
        titulo: 'GitHub に接続',
        texto:
          'リポジトリの一覧表示とワンクリッククローンができます。GitHub CLI でログインするか、このPCに暗号化保存されるパーソナルトークンを使います。',
      },
      vigilar: {
        titulo: 'フォルダを監視',
        texto:
          'プロジェクトフォルダに新しいフォルダが現れるとセットアップを提案します。確認なしで自動構築されることはありません。',
        activar: 'このフォルダを監視する',
        activa: (ruta: string) => `監視中: ${ruta}`,
        sinCarpeta: '先にプロジェクトフォルダを選択してください（ステップ1）。',
      },
    },
  },
  /** Resultado de importar o exportar un perfil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'バックアップとプロファイル',
      descripcion:
        'プロファイルを使うと、サイト・バージョン・インスタンス・テンプレート・設定を別PCへ移行できます。キー、トークン、パスワードは一切含まれません。',
      aislado: {
        titulo: 'テストフォルダ',
        texto: (ruta: string) =>
          `WolfCore Dev はテスト用データフォルダ (${ruta}) を使用中です。ここでの操作は本番フォルダやシステムに影響せず、hosts 書き換えや証明書インストールも行いません。`,
      },
      exportar: {
        titulo: '環境をエクスポート',
        texto:
          'サイト、バージョン、インスタンス、テンプレート、設定を .wolfperfil ファイルに保存します。',
        bases: 'データベースを含める',
        basesAyuda:
          '完全なダンプ（顧客データを含む）がパスフレーズで暗号化されて含まれます。',
        ca: '認証局 (CA) を含める',
        caAyuda: 'パスフレーズで暗号化されます。必ずご自身の別PCのみにインポートしてください。',
        certificados: 'サイトの証明書を含める',
        certificadosAyuda: '暗号化された CA と一緒の場合のみ含められます。',
        frase: 'パスフレーズ',
        fraseRepetir: 'パスフレーズを再入力',
        fraseAyuda: (minimo: number) =>
          `${minimo} 文字以上。これがないとデータベースや CA を復元できず、どこにも保存されません。`,
        problemas: {
          frase_corta: (minimo: number) => `パスフレーズは ${minimo} 文字以上必要です。`,
          frase_distinta: '2つのパスフレーズが一致しません。',
          certificados_sin_ca: '証明書は CA と一緒の場合のみ含められます。',
        },
        exportar: 'プロファイルをエクスポート…',
        nota: 'プロファイルにキー・トークン・パスワード・スナップショット・ゴミ箱・バックアップ・data フォルダは一切含まれません。',
        listo: 'プロファイルをエクスポートしました',
        guardado: (archivo: string, tamano: string) => `${archivo} に保存しました (${tamano})。`,
      },
      importar: {
        titulo: 'プロファイルをインポート',
        texto:
          '.wolfperfil ファイルを選択してください。変更前に置換・除外・保留になる内容をすべて確認でき、置換対象は事前バックアップされます。',
        boton: 'プロファイルをインポート…',
      },
      instantaneas: {
        titulo: '環境スナップショット',
        texto:
          'PHP や Nginx の更新前、およびプロファイルのインポート前に、設定・Nginx・php.ini のコピー（キーやデータなし、本人のみ読取可）を最大10件保存します。',
        compartidas:
          '最大10件はすべての理由で共有され、新しく作成すると手動作成を含め最も古いものが置き換わります。',
        tomar: '今すぐ作成',
        tomada: 'スナップショットを保存しました。',
        sinNada: 'コピー対象がまだありません。',
        vacia: 'スナップショットはまだありません。',
        motivos: {
          actualizar: '更新前',
          'importar-perfil': 'プロファイルインポート前',
          'limpiar-versiones': 'バージョン整理前',
          manual: '手動',
        },
      },
    },
    reasignar: {
      titulo: 'サイトのフォルダ',
      texto:
        'これらのフォルダは移行元PCのパスです。このPC上の場所を指定するか、後で設定する保留サイトとしてインポートしてください。',
      sitio: 'サイト',
      origen: 'プロファイル内のフォルダ',
      destino: 'このPCのフォルダ',
      existe: '存在します',
      noExiste: 'このPCに存在しません',
      buscar: 'フォルダを選択…',
      cambiar: '変更',
      comoPendiente: '保留としてインポート',
      prefijo: (viejo: string, nuevo: string) =>
        `残りにも同じパス置換を適用 (${viejo} → ${nuevo})`,
      omitido: 'インポートしません',
    },
    asistente: {
      titulo: 'プロファイルをインポート',
      pasos: {
        archivo: 'ファイル',
        revisar: '確認',
        confirmar: '確定',
        resultado: '結果',
      },
      archivo: {
        texto:
          '.wolfperfil ファイルを選択してください。まだ何も変更されず、置換・除外・保留になる内容を確認できます。',
        elegir: 'ファイルを選択…',
        cambiar: '別のファイルを選択',
        ninguno: 'ファイル未選択',
        leyendo: 'プロファイルを読み込み中…',
        error: 'プロファイルを読み取れませんでした',
      },
      origen: (fecha: string, sistema: string) => `${fecha} に ${sistema} で作成。`,
      ignoradas: (n: number) => `プロファイルに関係ない ${n} 件のエントリは無視されます。`,
      reemplaza: {
        titulo: '置換される項目',
        ninguno: 'このフォルダに既存データはありません。新規環境としてインポートされます。',
        copia:
          '置換前に respaldos/pre-perfil-… へコピーし環境スナップショットを保存します。置換される各データベースも個別にスナップショットを取ります。data フォルダは削除しません。',
        config: '設定 (config.json)',
        sitio: (id: string) => `サイト ${id}`,
        base: (instancia: string, base: string) => `データベース ${base} (${instancia})`,
        plantilla: (id: string) => `テンプレート ${id}`,
        ca: 'このPCの認証局 (CA)',
      },
      versiones: {
        titulo: 'バージョン',
        ninguna: 'プロファイルにバージョン情報は含まれていません。',
        instalada: 'インストール済み',
        descargar: 'チェックサム検証付きでダウンロードされます',
        pendienteDebil: '保留: 強いチェックサムがないため手動インストールしてください',
        pendienteFuera: '保留: カタログに存在しません',
        huellas: {
          fuerte: 'SHA-256 / SHA-512 ハッシュ',
          firmada: '署名済み',
          debil: '弱いハッシュ',
          ninguna: 'ハッシュなし',
        },
        descargas: (n: number) =>
          `公式サイトから ${n} 件のバージョンをハッシュまたは署名検証付きでダウンロードします。`,
      },
      instancias: {
        titulo: 'データベースインスタンス',
        existente: '既存あり: 現在のポートとバージョンを維持します',
        nueva: (puerto: number) => `新しい認証情報でポート ${puerto} に作成されます`,
        reasignada: (de: number, a: number) => `ポート ${de} が使用中のため ${a} を使用します`,
      },
      bases: {
        titulo: 'データベース',
        ninguna: 'プロファイルにデータベースは含まれていません。',
        texto:
          '各データベース限定の制限ユーザーと許可済みSQLのみで復元します。既存DBは事前にバックアップします。',
        omitir: 'データベースなしでインポート',
      },
      plantillas: {
        titulo: 'テンプレート',
        existe: '既存あり: 置換されます',
        nueva: '新規',
      },
      workspaces: {
        titulo: 'ワークスペース',
        texto:
          'データベースとサービスの参照のみ移行されます（プロジェクトプロセスは含まれません）。このPC上の構成で検証され、自動起動はしません。',
        existe: '同じ ID が既に存在するため既存のものを維持します',
        nuevo: '新規',
        elementos: (n: number) => `${n} 項目`,
        invalidos: (n: number) => `プロファイル内の無効な ${n} 件はインポートしません。`,
      },
      quitado: {
        titulo: '設定から取り込まれない項目',
        texto:
          'このデータフォルダはクリーンです。外部を指す設定はプロファイルから取り込まれません。',
      },
      puertos: {
        titulo: '使用中のポート',
        texto: (lista: string) =>
          `プロファイルの次のポートは別プログラムが使用中です: ${lista}。インポート後に「サービス」から変更してください。`,
      },
      ca: {
        titulo: '認証局 (CA)',
        texto:
          'プロファイルに暗号化された CA が含まれます。ご自身の CA の場合のみインポートしてください（このPCがその CA の署名を信頼するようになります）。',
        huella: 'プロファイル CA の SHA-256 フィンガープリント',
        comparar: '受け入れる前に移行元PCのフィンガープリントと照合してください。',
        importar: 'プロファイルの CA をインポート',
        noImportar: 'インポートしない場合、現在の CA または新規 CA を使用します。',
        ajena:
          'この CA には WolfCore Dev 以外の名前制限があるためインポートできません。',
        sinRestricciones:
          'この CA には名前制限がなく、銀行やメールを含む任意のサイトに署名できます。ご自身の CA でフィンガープリントが一致する場合のみインポートしてください。',
        aceptarSin: 'リスクを理解しています。自分の CA でありフィンガープリントも一致しています',
        reemplazaLocal:
          'このPCには既に CA があります。インポートすると置換されます（事前バックアップにコピーを残します）。',
        reemplazar: 'このPCの CA を置換する',
        noSeInstala: 'CA はシステムの証明書ストアへ自動インストールされません。',
      },
      frase: {
        titulo: 'プロファイルのパスフレーズ',
        texto: 'プロファイルには暗号化されたデータベースまたは CA が含まれます。エクスポート時のパスフレーズを入力してください。',
        campo: 'パスフレーズ',
        omitirBases: 'データベースなしでインポート',
        nota: 'パスフレーズはこの画面でのみ使用され、保存されず完了時・終了時に消去されます。',
      },
      env: {
        titulo: 'プロジェクトの接続設定',
        texto:
          '.env を新しい専用データベースユーザーへ向けたいプロジェクトにチェックを入れてください（.env は事前バックアップされます）。その他は変更せず通知のみ行います。',
      },
      confirmar: {
        titulo: 'インポートの確定',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `サイト ${sitios} 件、バージョン ${versiones} 件、データベース ${bases} 件をインポートします。`,
        importar: 'インポート',
        revisar: '確認',
        volver: '戻る',
        bloqueos: {
          sitios_sin_carpeta:
            '各サイトのフォルダを選択するか、保留としてインポートする設定にしてください。',
          frase_requerida: 'パスフレーズを入力するか、データベースなしでインポートしてください。',
          ca_ajena: 'プロファイルの CA はインポートできません。',
          ca_sin_restricciones: '制限なし CA をインポートする確認を別途行ってください。',
          reemplazar_ca: 'このPCの CA を置換する確認を別途行ってください。',
        },
      },
      progreso: 'プロファイルをインポート中… データベースやダウンロードにより時間がかかるためウィンドウを閉じないでください。',
      fases: {
        copia: '置換対象をバックアップ中',
        versiones: 'バージョンをインストール中',
        configuracion: '設定とサイトを保存中',
        plantillas: 'テンプレートをコピー中',
        ca: 'CA と証明書を準備中',
        bases: 'データベースを復元中',
        env: '.env ファイルを更新中',
      },
      avance: (paso: number, de: number) => `ステップ ${paso} / ${de}`,
      resultado: {
        titulo: 'インポート結果',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `インポート済み ${importados}、保留 ${pendientes}、スキップ ${omitidos}、エラー ${errores}。`,
        respaldo: (ruta: string) => `置換前のバックアップ: ${ruta}`,
        pendientes: '保留になった項目は手動で完了できます。',
        error: 'プロファイルをインポートできませんでした',
        secciones: {
          sitios: 'サイト',
          versiones: 'バージョン',
          instancias: 'インスタンス',
          bases: 'データベース',
          plantillas: 'テンプレート',
          workspaces: 'ワークスペース',
          env: '.env ファイル',
          ca: 'CA',
        },
        estados: {
          importado: 'インポート済み',
          pendiente: '保留',
          omitido: 'スキップ',
          error: 'エラー',
          instalada: 'インストール済み',
          ya_instalada: '導入済み',
          creada: '作成済み',
          existente: '既存',
          puerto_reasignado: 'ポート再割当',
          reescrito: '更新済み',
          sin_marcar: '未選択',
        },
        ca: {
          importada: 'CA をインポートしました',
          nueva: '新しい CA を生成しました',
          sin_cambios: 'CA は変更されませんでした',
        },
        quitarCa: {
          boton: '旧 CA を削除…',
          titulo: '信頼ストアから旧 CA を削除',
          texto:
            'このPCに以前入っていた CA をシステム証明書ストアから削除します。Windows が確認を求める場合があります。新しい CA は自動インストールされません。',
          si: '削除する',
          hecho: '旧 CA を信頼ストアから削除しました。',
        },
        descartadosWorkspace: (lista: string) => `このPCに存在しないため除外: ${lista}`,
        workspacesInvalidos: (n: number) => `無効なワークスペース ${n} 件はインポートしませんでした。`,
        puerto: (de: number, a: number) => `ポート ${de} → ${a}`,
        copiaEnv: (ruta: string) => `.env バックアップ: ${ruta}`,
      },
    },
    /** Aviso fuerte de la vista previa: la CA del perfil no tiene restricciones de nombre. */
    caSinRestricciones:
      'この CA はあらゆるサイトに署名できます。ご自身の CA の場合のみ、フィンガープリントを照合してインポートしてください。',
    motivos: {
      procesos_quitados: 'プロセス（別PCのコマンド）はインポートしませんでした。',
      tareas_quitadas:
        'スケジュールタスク（別PCのコマンド）はインポートしませんでした。再作成するか wolfcore.yml から取り込んでください。',
      tunel_con_nombre: '名前付きトンネルは移行されないためクイックトンネルに戻りました。',
      php_ini: '一部の php.ini 設定はインポートされませんでした。',
      xdebug: 'Xdebug 設定が無効だったため削除しました。',
      nginx_desactivado:
        'Nginx ルールは保存されましたが未適用です。エディターで確認してください。',
      carpeta_no_existe: 'フォルダがこのPCに存在しません。指定してください。',
      correo_sin_proveedor: 'SMTP プロバイダーは移行されないためローカルキャッチャーを使用します。',
      sitio_invalido: 'サイトが無効です。',
      dominio_invalido: 'ドメインが無効です（.test で終わる必要があります）。',
      ruta_protegida: 'システムフォルダまたは WolfCore Dev のフォルダのためインポートしません。',
      dominio_en_uso: 'このPCの別サイトが同じドメインを使用しています。',
      sitio_repetido: 'プロファイル内でサイトが重複しています。',
      no_disponible: 'このバージョンはカタログにありません。',
      huella_debil: '強いチェックサムがないため「バージョン」から手動インストールしてください。',
      tope_descargas:
        '同時ダウンロード数上限のため未取得です。「バージョン」からインストールしてください。',
      instancia_pendiente: 'インスタンスが保留になりました。',
      motor_no_soportado: 'このエンジンはプロファイルからインポートできません。',
      version_pendiente: 'エンジンのバージョンが保留になりました。',
      danada: 'プロファイル内のファイルが破損しています。',
      bases_omitidas: 'データベースなしでインポートされました。',
      instancia_apagada: 'インスタンスを起動できませんでした。',
      sin_copia_previa: '事前スナップショットを作成できなかったためデータベースは置換されませんでした。',
      sin_base: '.env がローカルデータベースを指していません。',
      base_no_resuelta: 'どのインスタンスのデータベースか特定できませんでした。',
      error_inesperado: 'エラーが発生しました。',
    },
    avisos: {
      ca_reemplazada:
        '以前の CA がシステム信頼ストアに残っています（現在は未使用）。ここから削除できます。',
      base_no_incluida: 'データベース {base} ({instancia}) は含まれませんでした。',
      sin_ca: 'このPCに CA がないため CA なしでエクスポートされます。',
      ca_no_importada: 'プロファイルの CA はインポートされませんでした。現在の CA または新規 CA を使用します。',
      certificados: '証明書を準備できませんでした: {detalle}',
      aplicar:
        'インポートしたサイトが完全に適用されませんでした (Nginx: {nginx}、hosts: {hosts})。',
    },
    quitado: {
      ia: 'AI プロバイダー {id}: 独自 URL を使用しています。',
      smtp: 'SMTP プロバイダー {id}: 既知のホストでないかユーザーが不足しています。',
      puerto: '{id} のポート: 範囲外のため既定値に戻しました。',
      carpeta_vigilada: '監視フォルダが別PCのパスです。',
    },
  },
};
