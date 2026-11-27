import type { TextosParciales } from '../es';

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const jaExtra: TextosParciales = {
  app: { lema: 'すぐに使えるローカル環境' },
  resumenGlobal: {
    cortoApagado: 'すべて停止中',
    cortoEncendidos: (n) => `${n} 件が稼働中`,
    cortoErrores: (n) => `${n} 件でエラー`,
    cortoCargando: '接続中…',
    cortoSinConexion: 'オフライン',
    irAServicios: 'サービスを開く',
  },
  acciones: { copiarCompleto: '全文をコピー' },
  errores: {
    codigos: {
      'servicios.no_encendio':
        '{nombre} を起動できませんでした。サービスとそのログを確認してください。',
      'tuneles.sitio_no_confiable':
        '{dominio} はまだ信頼されていません。公開する前に、プロジェクトで「このリポジトリを信頼する」にチェックを入れてください。',
      'clientehttp.peticion_invalida': 'リクエストのデータが無効です: {campo}。',
      'clientehttp.variable_sin_definir': '変数「{nombre}」は、現在の環境で定義されていません。',
      'clientehttp.secreto_faltante':
        '保存されたシークレット値がありません。もう一度入力して、リクエストまたは環境を保存してください。',
      'clientehttp.secreto_no_guardado':
        'シークレット値を保存できませんでした。改行を含めることや 16 KB を超えることはできず、システムの暗号化が利用可能である必要があります。',
      'clientehttp.url_invalida': 'URL が無効です。',
      'clientehttp.url_con_credenciales':
        'URL にユーザー名やパスワードを含めることはできません。認証タブを使用してください。',
      'clientehttp.protocolo': 'http:// と https:// の URL のみ使用できます。',
      'clientehttp.cabecera_invalida': 'ヘッダー「{nombre}」が無効です。',
      'clientehttp.cuerpo_grande': 'リクエスト本文が 1 MB を超えています。',
      'clientehttp.plazo': 'リクエストが {segundos} 秒のタイムアウトを超えました。',
      'clientehttp.cancelado': 'リクエストをキャンセルしました。',
      'clientehttp.sin_conexion':
        '接続できませんでした（{motivo}）。アドレスとポートを確認し、サーバーが起動していることを確かめてください。',
      'clientehttp.certificado': 'サーバー証明書を検証できませんでした（{motivo}）。',
      'clientehttp.demasiadas_redirecciones': 'リダイレクトが {max} 回を超えて連続しています。',
      'clientehttp.curl_invalido': 'このテキストは有効な curl コマンドではありません。',
      'clientehttp.curl_grande': 'curl のテキストが大きすぎます（最大 64 KB）。',
      'clientehttp.no_existe': 'この項目はもう存在しません。',
      'clientehttp.limite': '保存できる項目数の上限に達しました。',
      'ejemplohttp.no_arranca': 'サンプルサーバーを起動できませんでした。',
      'laboratoriogit.sin_git': 'このコンピューターには Git がインストールされていません。',
      'laboratoriogit.orden_invalida': 'そのコマンドはラボの一覧にありません。',
      'laboratoriogit.nombre_invalido':
        '名前に使用できるのは、英字、数字、ハイフン、アンダースコアのみです（30 文字まで）。',
      'laboratoriogit.mensaje_invalido':
        'メッセージは 1 行で、200 文字以内にし、「-」で始めないでください。',
      'laboratoriogit.archivo_invalido': 'そのファイルは練習用ファイルではありません。',
      'laboratoriogit.contenido_invalido': '内容は 2000 文字以内のテキストにしてください。',
      'laboratoriogit.ruta_insegura':
        'ラボのフォルダーが想定されたものではないため、操作しません。',
      'laboratoriogit.fallo_sistema':
        'システムがラボのフォルダーの準備または使用を許可しませんでした。「ラボをリセット」をお試しください。',
      'buscar.ruta_vetada': 'そのフォルダーには WolfCore Dev のデータがあるため、検索されません。',
      'buscar.resultado_caducado': 'その結果はもう利用できません。もう一度検索してください。',
      'buscar.resultado_invalido': 'その結果を開けません。',
      'diff.raiz_invalida': '存在し、リンクではない 2 つのフォルダーを選択してください。',
      'diff.ruta_vetada': 'そのフォルダーには WolfCore Dev のデータがあるため、比較されません。',
      'diff.cancelado': '比較をキャンセルしました。',
      'diff.plazo': '比較に {segundos} 秒を超える時間がかかったため、キャンセルしました。',
      'diff.memoria': '比較に必要なメモリが多すぎる（{maximo} 超）ため、キャンセルしました。',
      'diff.ocupado': '比較がすでに実行中です。キャンセルするか、終わるまでお待ちください。',
      'diff.caducado': 'その比較はもう利用できません。もう一度比較してください。',
      'diff.archivo_invalido': 'そのファイルはもう比較できません。変更されたか、なくなっています。',
      'diff.fallo': '比較に失敗しました。',
      'compartir.confirmacion_requerida':
        'インターネットでの共有は、WolfCore Dev のウィンドウで確認する必要があります。',
      'compartir.ocupado': 'すでに何かを共有中です。先に共有を停止してください。',
      'compartir.ruta_invalida': '存在するフォルダーまたはファイルを選択してください。',
      'compartir.duracion_invalida': '15 分、1 時間、4 時間のいずれかを選択してください。',
      'compartir.proveedor_invalido':
        'そのトンネルには対応していません。Cloudflare または ngrok を使用してください。',
      'compartir.raiz_unidad':
        'ドライブのルートは共有されません。その中のフォルダーを選択してください。',
      'compartir.carpeta_usuario':
        '個人フォルダー全体（またはそれを含むフォルダー）は共有されません。サブフォルダーを選択してください。',
      'compartir.carpeta_datos': 'WolfCore Dev のデータフォルダーは共有されません。',
      'compartir.sitio_datos_reales':
        '実データを持つサイト（またはその中のもの）は共有されません。',
      'compartir.carpeta_secretos':
        'そのフォルダーには鍵（.ssh、.aws、.git など）があるため、共有されません。',
      'compartir.carpeta_sistema': 'システムフォルダーは共有されません。',
      'compartir.archivo_sensible':
        'そのファイルはシークレットや実データを含んでいる可能性があるため、共有されません。',
      'compartir.carpeta_perfil':
        'ユーザーのプログラムのデータ（AppData、.claude、.config など）は共有されません。',
      'compartir.archivo_grande':
        'そのファイルは大きすぎて確認できず、メディアファイルでもパッケージでもないため、共有されません。',
      'compartir.tunel_sin_url':
        'トンネルが {segundos} 秒以内にアドレスを返しませんでした。もう一度お試しください。',
      'compartir.tunel_cerrado': 'トンネルは、開き終わる前に閉じました。',
      'compartir.fallo': '共有できませんでした。',
      'disco.raiz_invalida': '存在して読み取れるフォルダーまたはドライブを選択してください。',
      'disco.cancelado': '分析をキャンセルしました。',
      'disco.plazo': '分析に {minutos} 分を超える時間がかかったため、キャンセルしました。',
      'disco.memoria': '分析に必要なメモリが多すぎます（{maximo} 超）。',
      'disco.ocupado': '分析がすでに実行中です。キャンセルするか、終わるまでお待ちください。',
      'disco.caducado': 'その分析はもう利用できません。もう一度分析してください。',
      'disco.entrada_invalida':
        'そのフォルダーはもう存在しないか、変更されています。もう一度分析してください。',
      'disco.fallo': '分析に失敗しました。',
      'reverb.no_laravel': 'Reverb は Laravel プロジェクトでのみ利用できます。',
      'reverb.no_confiado':
        'Reverb を有効にするには、プロジェクトで「このリポジトリを信頼する」にチェックを入れてください。',
      'reverb.sin_paquete':
        'laravel/reverb パッケージがありません。composer require laravel/reverb でインストールしてください。',
      'reverb.sin_confirmar': 'Reverb を有効にすることを確認してください。',
      'reverb.sin_activar': '先にプロジェクトで Reverb を有効にしてください。',
      'env.meilisearch_no_disponible':
        'Meilisearch がインストールされていません。サービスからインストールしてください。',
      'bd.lentas_confirmar':
        'スロークエリログの変更はサーバー全体に影響するため、確認が必要です。何も変更していません。',
      'bd.lentas_umbral_invalido': '時間は 0.1 秒から 60 秒の間で指定してください。',
      'bd.lentas_motor_no_soportado':
        'スロークエリを変更できるのは、WolfCore Dev が管理する MySQL、MariaDB、PostgreSQL のみです。',
      'bd.lentas_literal_no_permitido':
        'SQL は値付きでは表示されません。データベースに実データがあるか、クエリを既知のデータベースに結び付けられません。',
      'bd.lentas_entrada_no_existe':
        'そのクエリはもうログにありません。もう一度読み込んでください。',
      'bd.lentas_fallo':
        'スロークエリログを読み取れないか、変更できませんでした。サーバーが起動していることを確認してください。',
      'bd.esquema_base_no_existe': 'そのサーバーにデータベースが存在しません。',
      'bd.esquema_motor_no_soportado': 'スキーマビューアーは MySQL、MariaDB、PostgreSQL 用です。',
      'bd.esquema_lectura_fallo':
        'データベースのスキーマを読み取れませんでした。サーバーが起動していることを確認してください。',
      'captura.atajo_invalido':
        'そのショートカットは無効です。Ctrl、Alt、Shift、Super のいずれかを、英字、数字、F キーと組み合わせてください。',
      'captura.atajo_no_permitido':
        'そのショートカットは使用できません。Ctrl または Super を別の修飾キーと組み合わせてください（Shift なしの Ctrl+Alt は AltGr となり @ の入力に支障が出ます）。Ctrl+C や Alt+F4 などの一般的なショートカットは避けてください。',
      'captura.atajo_ocupado': 'ショートカット {atajo} はすでに別のプログラムで使用されています。',
      'captura.no_disponible': 'このコンピューターでは画面キャプチャを利用できません。',
      'captura.permiso_denegado': '画面録画の権限がありません。',
      'captura.sin_imagen': 'キャプチャする画像がありません。',
      'captura.imagen_invalida': 'キャプチャ画像が無効です。',
      'disco.sin_confirmar': '続行する前に、ダイアログでクリーンアップを確認してください。',
      'disco.categoria_invalida': 'そのクリーンアップのカテゴリは存在しません。',
      'disco.ruta_vetada':
        'このカテゴリは保護されたパス（データ、バックアップ、プロジェクト、FlyEnv）に触れるため、何もクリーンアップしていません。',
      'disco.sin_analisis':
        'クリーンアップの前にもう一度分析してください。分析の期限が切れたか、見つかりません。',
      'disco.ocupada': '分析またはクリーンアップがすでに実行中です。',
      'disco.sin_registro': 'クリーンアップのログを作成できなかったため、何も削除していません。',
      'editor.sin_confirmar': '続行する前に保存を確認してください。',
      'editor.confirmacion_reforzada':
        'このファイルはシークレットを含んでいるか、実データを持つサイトのものです。追加の確認を行って保存してください。',
      'editor.ruta_invalida': 'ファイルのパスが無効です。',
      'editor.no_existe': 'ファイルが存在しません。',
      'editor.no_regular': '編集できるのは通常のファイルのみです。',
      'editor.ruta_vetada':
        'そのファイルは WolfCore Dev のデータフォルダー内にあるため、エディターで開いたり保存したりできません。',
      'editor.archivo_env': '.env ファイルはエディターではなく、プロジェクトの変数から管理します。',
      'editor.demasiado_grande': 'ファイルがエディターで扱うには大きすぎます（最大 {maximo}）。',
      'editor.binario': 'ファイルはテキストではなくバイナリのため、ここでは編集できません。',
      'editor.codificacion':
        'ファイルが UTF-8 ではないため、破損を避けるためエディターでは開きません。',
      'editor.no_abierto':
        'そのファイルはエディターで開かれていません（またはバージョンが変わりました）。もう一度開いてください。',
      'editor.eol_mixto':
        'ファイルに複数の改行コードが混在しています。保存するには、改行コードの統一を確認してください。',
      'editor.contenido_invalido': '内容が有効なテキストではありません。',
      'editor.huella_invalida':
        '開いているファイルのフィンガープリントがありません。もう一度開いてください。',
      'editor.archivo_cambiado':
        'ファイルを開いた後、エディターの外で変更されました。再読み込みするか、上書きを確認してください。',
      'editor.copia_fallo':
        'バックアップコピーを作成できなかったため（{codigo}）、何も保存していません。',
      'editor.lectura_fallo': 'ファイルを読み取れませんでした（{codigo}）。',
      'editor.escritura_fallo':
        'ファイルを保存できませんでした（{codigo}）。元のファイルには手を加えていません。',
      'memoria.sin_confirmar': '続行する前に、ダイアログで操作を確認してください。',
      'memoria.modo_invalido': 'その最適化モードは存在しません。',
      'memoria.plan_caducado':
        '一覧の期限が切れたか、最新のものではありません。適用する前にもう一度表示してください。',
      'memoria.no_disponible':
        'ここではメモリ最適化を利用できないか、システムを読み取れませんでした。',
      'conversor.ocupado':
        '変換がすでに実行中で、もう 1 件が待機中です。終わるまでお待ちください。',
      'doctor.firewall_reglas_acotadas':
        'WolfCore Dev のプログラム用のルールが {cantidad} 件あり、ローカルネットワークに限定されています（プライベートプロファイルのみ、ローカルサブネット、特定のポート）。サイトを共有するためにアプリ自身が推奨するルールと同じものです。表示のみで、ここからは削除されません。',
      'doctor.firewall_almacen_inseguro':
        'ルールの保護されたコピーを信頼できません（権限または内容が表示時と異なります）。ルールは作成も変更もされていません。',
      'doctor.firewall_quitadas':
        'WolfCore Dev は以前に {cantidad} 件のファイアウォールルールを削除し、コピーを保存しました。必要な場合は再作成できます。',
      'doctor.firewall_parcial':
        '一部のルールは削除されましたが、そうでないものもあります。一覧の表示後に変更された、WolfCore Dev のものではない、または Windows が削除を許可しませんでした。一覧を確認してください。',
      'doctor.firewall_sin_cambios':
        'ルールは変更されていません。表示された内容と一致しなくなったか、変更できませんでした。',
      'doctor.firewall_registro_fallido':
        'ルールのコピーを etc/cortafuegos-quitadas.json に保存できなかったため、何も変更していません。',
      'catalogo.paquete_invalido':
        'ダウンロードしたパッケージは安全ではありません（フォルダー外のパス、リンク、または過大なサイズ）。',
      'catalogo.extraccion_fallo':
        'ダウンロードした .7z パッケージを読み取れないか、展開できませんでした。',
      'runtimes.falta_runtime':
        'このプロジェクト用に {nombre} がインストールされていません。サービスからインストールしてください。',
      'runtimes.falta_jdk':
        'このプロジェクト用の JDK がインストールされていません。サービスから Java をインストールしてください。',
      'runtimes.instalacion_incompleta':
        '{nombre} のインストールが不完全です。サービスから再インストールしてください。',
      'procesos.escucha_publica':
        'このプロセスは {direccion}:{puerto}（{programa}）で待ち受けており、ネットワークに公開されています。127.0.0.1 でのみ待ち受けられるため、停止しました。',
      'procesos.escucha_publica_livereload':
        'このプロセスは {direccion}:{puerto}（{programa}）で待ち受けており、ネットワークに公開されています。127.0.0.1 でのみ待ち受けられるため、停止しました。これは Spring DevTools の LiveReload です。spring.devtools.livereload.enabled=false で無効にしてください。',
      'procesos.escucha_publica_inspector':
        'このプロセスは {direccion}:{puerto}（{programa}）で待ち受けており、ネットワークに公開されています。127.0.0.1 でのみ待ち受けられるため、停止しました。これは Node のインスペクターです。--inspect=127.0.0.1 を使用してください。',
    },
  },
  inicio: {
    servicios: { irA: (nombre) => `${nombre} サービスへ移動` },
    tuneles: { irA: (nombre) => `${nombre} プロジェクトへ移動` },
  },
  servicios: {
    sinParaEncender: '起動できるインストール済みのサービスがありません',
    franjaExternos: {
      texto:
        'Web サーバーと PHP はまだインストールされていません。外部のエンジンを自動的に検出しました。',
      accion: 'Nginx と PHP をインストール',
    },
    externos: {
      titulo: 'お使いのコンピューターで検出',
      ayuda: '別のプログラムが管理しているため、WolfCore Dev は表示のみ行います。',
    },
    borrarDatos: { que: { meilisearch: 'Meilisearch のすべてのインデックス' } },
    ftp: {
      redLocalAyuda:
        'オフの間は、このコンピューターからのみ接続できます（127.0.0.1）。各プロジェクトのアクセスは、プロジェクト画面で有効にします。',
      compartir: {
        enlace: 'フォルダーまたはファイルを共有…',
        ayuda:
          'FTP はトンネル経由では共有されません。暗号化されておらず、トンネルは HTTP のみを通すためです。インターネットで公開するには「フォルダーまたはファイルを共有」（HTTP、読み取り専用）を使用してください。FTP はローカルネットワーク内に限られます。',
      },
    },
    datosConexion: '接続情報',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Meilisearch への接続',
      notaMeilisearch:
        'プロジェクトで使うには、変数 (.env) → ブロックを追加 → Meilisearch の順に操作します。キーを伏せたプレビューが表示され、確認が必要です。このキーはこのコンピューター専用です。',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Laravel Scout 向けの検索（github.com/meilisearch）',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails（ローカルポート）',
      springboot: 'Spring Boot（ローカルポート）',
      aspnet: 'ASP.NET Core（ローカルポート）',
    },
    tiposCortos: { rails: 'Rails', springboot: 'Spring Boot', aspnet: 'ASP.NET' },
  },
  tunel: {
    sinConfianza:
      'このプロジェクトは信頼されていません。公開するには「このリポジトリを信頼する」にチェックを入れてください。',
  },
  tuneles: {
    irAProyectos: 'プロジェクトへ移動',
    compartir: {
      enlace: 'フォルダーまたはファイルを共有…',
      ayuda: 'サイトを作らずに、フォルダーまたは 1 つのファイルを公開します（読み取り専用）。',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'このプロジェクトの Reverb プロセスには WolfCore Dev のコマンドがありません（別のホスト、プログラム、ポート）。有効にすると、127.0.0.1 のみで待ち受ける標準のものに置き換わります。',
    ayuda: 'Laravel WebSockets（127.0.0.1 のみ）。',
    puerto: (p) => `ポート ${p}`,
    interruptor: (dominio) => `${dominio} の Reverb をオンまたはオフにする`,
    activarTitulo: 'Reverb を有効にしますか？',
    activarTexto: (dominio) =>
      `${dominio} で「php artisan reverb:start」を実行します。空いているポートの 127.0.0.1 のみで待ち受けます。プロジェクトのコードは、そのプロジェクトの PHP で実行されます。`,
    desactivarTitulo: 'Reverb を無効にしますか？',
    desactivarTexto:
      'プロセスを停止し、プロジェクトから削除します。.env の REVERB_* 変数は変更されません。',
    activar: '有効にする',
    desactivar: '無効にする',
    proponer: 'REVERB_* 変数を提案',
    tituloError: 'Reverb',
    estados: { apagado: '停止中', iniciando: '起動中', encendido: '稼働中', error: '失敗' },
  },
  ftpSitio: {
    compartirNota:
      'FTP はローカルネットワーク専用です。パスワードとファイルを暗号化せずに送るため、インターネットのトンネルでは共有されません。',
    compartirIr: 'フォルダーまたはファイルを一時リンクで共有',
  },
  ia: {
    pestanas: {
      etiqueta: 'AI のセクション',
      agentes: 'エージェント',
      nube: 'クラウド',
      local: 'ローカルモデル',
    },
  },
  iaLocal: {
    descargar: {
      confirmarTexto:
        'ダウンロードはいつでもキャンセルできます。ダウンロード済みの分は破棄されます。',
      tamano: (t) => `ダウンロードサイズ: ${t}。`,
      tamanoDesconocido:
        'サイズを確認できませんでした（Ollama のレジストリに接続できません）。モデルは通常 1 GB から 40 GB 以上です。',
      libre: (l) => `モデル用ディスクの空き容量: ${l}。`,
      libreDesconocido: 'ディスクの空き容量を測定できませんでした。',
      sinEspacio: (t, l) =>
        `空き容量が足りません。モデルには ${t} が必要ですが、空きは ${l} だけです。容量を空けるか、より小さいモデルを選んでください。`,
    },
  },
  proyectos: {
    asistente: { ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    tarjeta: { verEnBases: 'データベースで表示' },
  },
  panel: {
    insignias: { memoriaAlta: 'メモリ使用量が多い' },
    discos: {
      titulo: 'ディスク容量',
      leyendo: 'ディスクを読み取り中…',
      sistema: 'システム',
      datos: 'WolfCore のデータ',
      ambos: 'システムと WolfCore のデータ',
      libre: (unidad, libre, pct) => `${unidad} · 空き ${libre}（${pct} %）`,
      poco: '空き容量が少なくなっています',
      casiLleno: '空き容量がほとんどありません',
      liberar: '容量を空ける',
      versiones: '未使用のバージョンを整理',
      temporales: 'WolfCore の一時ファイルとキャッシュを整理',
      ocupaMas: '容量を多く使っているものを確認',
    },
    alertas: {
      grupo: (n) => `見つかった問題（${n}）`,
      verTodos: (n) => `${n} 件すべてを表示`,
      verMenos: '表示を減らす',
      masAcciones: 'その他の操作',
    },
    procesos: { resto: 'その他のサービス' },
  },
  captura: {
    barra: '描画ツール',
    herramientas: {
      recuadro: '四角形',
      flecha: '矢印',
      linea: '線',
      resaltador: '蛍光ペン',
      texto: 'テキスト',
      pixelar: 'モザイク',
      pixelarAyuda: 'モザイク（機密データには不向きです。「塗りつぶし」を使用してください）',
      ocultar: '塗りつぶし',
      ocultarAyuda: '単色で塗りつぶして隠す（機密データにはこちらを推奨）',
    },
    deshacer: '元に戻す',
    rehacer: 'やり直す',
    copiar: 'コピー',
    copiarAyuda:
      'クリップボードにコピーします。Windows のクリップボードは、履歴に残したり他のデバイスに同期したりすることがあります。',
    guardar: '保存…',
    alConversor: '画像コンバーターに送る',
    cerrar: 'キャンセル（Esc）',
    nuevaSeleccion: '選択し直す',
    color: '色',
    grosor: '太さ',
    formato: '形式',
    cargando: 'キャプチャを準備中…',
    guiaRegion: 'ドラッグして範囲を選択します。Esc でキャンセルします。',
    guiaVentana: 'キャプチャするウィンドウを選択してください。Esc でキャンセルします。',
    sinVentanas: 'キャプチャできるウィンドウがありません。',
    textoPlaceholder: '入力して Enter を押してください',
    copiada: 'クリップボードにコピーしました',
    guardada: (archivo) => `${archivo} に保存しました`,
    errorCargar: 'キャプチャを開けませんでした。',
    errorCopiar: '画像をコピーできませんでした。',
    errorGuardar: '画像を保存できませんでした。',
    errorConversor: '画像をコンバーターに送れませんでした。',
    errorVentana: 'そのウィンドウをキャプチャできませんでした。',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'すべての処理はこのコンピューター上で行われます。キャプチャはどのサービスにもアップロードされず、保存するまでディスクにも書き込まれません。WolfCore Dev のウィンドウは、画像に写らないよう一時的に隠れます。',
      region: '範囲',
      regionAyuda: '画面上をドラッグして範囲を選択します。',
      ventana: 'ウィンドウ',
      ventanaAyuda: '開いているウィンドウから 1 つ選びます。',
      pantalla: '全画面',
      pantallaAyuda: 'カーソルがある画面です。',
      atajoActivo: (atajo) => `グローバルショートカットが有効です: ${atajo}（範囲）。`,
      atajoInactivo: 'グローバルショートカットはありません。設定で有効にしてください。',
      noDisponible: 'このコンピューターでは画面キャプチャを利用できません。',
      permisoDenegado:
        '画面録画の権限がありません。システム設定で WolfCore Dev に対して有効にしてください。',
      ocupada: 'すでにキャプチャを実行中です。',
    },
    ajustes: {
      titulo: '画面キャプチャ',
      descripcion:
        '範囲、ウィンドウ、全画面を、簡易エディターでキャプチャします。完全にローカルで動作し、ユーザーが決めるまで何もアップロードも保存もされません。',
      activar: 'グローバルショートカット',
      activarAyuda:
        '既定ではオフです。オンにすると、他のプログラムが使用していない場合にのみ登録され、WolfCore Dev を閉じると解除されます。',
      atajo: 'キーの組み合わせ',
      grabar: '変更',
      grabando: 'キーの組み合わせを押してください…',
      grabandoAyuda:
        'Ctrl または Super を別の修飾キー（例: Ctrl+Alt+Shift）と、英字、数字、F キーのいずれかと組み合わせてください。Ctrl+C などの一般的なショートカットは避けてください。',
      formato: '保存時の形式',
      activado: (atajo) => `ショートカット ${atajo} を有効にしました。`,
      desactivado: 'ショートカットを無効にしました。',
      ocupado: (atajo) =>
        `ショートカット ${atajo} はすでに別のプログラムで使用されているため、何も変更していません。別の組み合わせをお試しください。`,
      ocupadoInicio:
        '保存されたショートカットはすでに別のプログラムで使用されており、登録されませんでした。別の組み合わせを選んでください。',
      sinPermiso:
        'macOS では画面録画の権限が必要です。初めてキャプチャするときに確認が表示されます。',
      formatoGuardado: '形式を保存しました。',
    },
  },
  herramientas: {
    lista: {
      clienteHttp: {
        nombre: 'HTTP クライアント',
        descripcion: 'API を試せます。リクエスト、環境、コレクション、履歴。',
      },
      captura: {
        nombre: '画面キャプチャ',
        descripcion: '範囲、ウィンドウ、全画面を、簡易エディターでキャプチャ。',
      },
      guiaTuneles: {
        nombre: 'トンネルガイド',
        descripcion: 'Cloudflare と ngrok を順を追って解説。コピーできるコマンド付き。',
      },
      guiaHttp: {
        nombre: 'HTTP ガイド',
        descripcion: 'ステータスコードとメソッド。検索と例付き。',
      },
      guiaGit: {
        nombre: 'Git と GitHub のガイド',
        descripcion: 'コマンドとワークフロー。安全に練習できるラボ付き。',
      },
      limpiezaDisco: {
        nombre: 'ディスククリーンアップ',
        descripcion:
          '一時ファイルと再生成できるキャッシュを分析して削除します。プレビューと確認付き。',
      },
      editor: {
        nombre: 'コードエディター',
        descripcion:
          'テキストファイルを編集します。ハイライト、バックアップコピー、確認付きの保存に対応。',
      },
      compartir: {
        nombre: 'フォルダーまたはファイルを共有',
        descripcion:
          'フォルダーまたはファイルを、読み取り専用の一時リンクでインターネットに公開します。',
      },
      usoDisco: {
        nombre: 'ディスク使用量',
        descripcion:
          'ドライブやフォルダーで容量を使っているもの。ツリー、大きいファイルとフォルダー、拡張子別。',
      },
      diffCarpetas: {
        nombre: 'フォルダー比較',
        descripcion:
          '2 つのフォルダーを比較します。片方のみにあるもの、もう片方のみにあるもの、内容が異なるものを、ファイルごとの差分付きで表示。',
      },
      grabarPantalla: {
        nombre: '画面録画',
        descripcion: 'システムに標準で付属しているレコーダーを開きます。',
      },
    },
    secciones: {
      codigo: 'コード',
      red: 'ネットワーク',
      seguridad: 'セキュリティ',
      archivos: 'ファイルとメディア',
      sistema: 'システム',
    },
    tarjetas: {
      comparar: { nombre: '比較', descripcion: 'テキストとフォルダー。違いを並べて表示します。' },
      qr: {
        nombre: 'QR',
        descripcion:
          'テキストやリンクから作成します。ほかの人があなたの Wi-Fi に参加するときにも使えます。',
      },
      guias: {
        nombre: 'ガイド',
        descripcion: 'HTTP、トンネル、Git。例とコピーできるコマンド付き。',
      },
    },
    pestanas: {
      diff: 'テキスト',
      diffCarpetas: 'フォルダー',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'トンネル',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev には独自のレコーダーはありません。システムに標準で付属しているものを開きます。動画は、そのツールが保存する場所に保存されます。',
      abrir: 'レコーダーを開く',
      abierta: 'Snipping Tool を開きました。画面の範囲を選んで「開始」を押してください。',
      noSePudo:
        'ここから Snipping Tool を開けませんでした。ガイドのショートカットのいずれかを使用してください。',
      guiaTitulo: 'お使いのシステムでの録画方法',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Win + Shift + R を押すと、Snipping Tool で録画できます。',
            'Snipping Tool が最新でない場合は、Win + Alt + R を押して Xbox Game Bar で録画します。',
            '録画は、上部に表示されるバーのボタンで停止します。',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Cmd + Shift + 5 を押してキャプチャバーを開きます。',
            '画面全体と選択した部分のどちらを録画するかを選びます。',
            '「収録」を押し、終了するときはメニューバーの停止ボタンを押します。',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            '各デスクトップにはレコーダーが付属しています。GNOME では Ctrl + Alt + Shift + R、KDE では Spectacle を使います。',
            '何もない場合は、パッケージマネージャーから OBS Studio または SimpleScreenRecorder をインストールしてください。',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `無効な式です: ${detalle}` : '無効な式です。'),
      regexDetalle: {
        corchete: '角かっこ「[」が閉じられていません。',
        parentesis: 'かっこ「(」が閉じられていません。',
        parentesisSobra: '閉じかっこ「)」に対応する開きかっこがありません。',
        nadaQueRepetir: '量指定子（「*」、「+」、「?」、「{}」）の前に繰り返す対象がありません。',
        barraAlFinal: 'パターンの末尾にバックスラッシュは置けません。',
        rangoInvertido: '文字クラスの範囲の順序が逆です（例: 「z-a」）。',
        cuantificador: '量指定子「{}」が不完全か、数値の順序が逆です。',
        grupo: 'グループの名前または形式が無効です。',
        escape: 'バックスラッシュのエスケープシーケンスが無効です。',
      },
    },
    busqueda: {
      excluir: 'さらに除外（カンマ区切り）',
      incluirPesadas: '重いフォルダーを含める（node_modules、vendor、.git など）',
      contexto: '前後の行数',
      grupoNombres: (n) => `名前で検索（${n}）`,
      grupoContenido: (n) => `内容で検索（${n}）`,
      carpeta: 'フォルダー',
      listaAria: '検索結果',
      atajos: '↑ ↓ で移動、Enter でエディターで開く、Esc でキャンセルまたはテキスト欄に戻ります。',
      sensible: (n) => `機密ファイル: ${n} 行目に一致があります（内容は表示されません）。`,
      mostrarMas: (n) => `さらに ${n} 件を表示`,
      linea: (n) => `${n} 行目`,
      sinGrupo: 'このグループには結果がありません。',
      topeBytes: '読み取りの上限に達しました。検索範囲を絞ってください。',
    },
    compartir: {
      explicacion:
        'このコンピューター上のフォルダーまたはファイルを、一時リンクでインターネットに公開します。読み取り専用で、リンクを知っている人は誰でも閲覧とダウンロードができますが、アップロードや変更はできません。リンクには秘密のコードが含まれ、指定した時刻に失効し、WolfCore Dev を終了すると閉じられます。.env ファイル、鍵、.git フォルダー、実データを持つサイトは共有されません。',
      eleccion: '共有するもの',
      elegirCarpeta: 'フォルダーを選択…',
      elegirArchivo: 'ファイルを選択…',
      elegido: '選択済み',
      duracion: '共有を停止するまでの時間',
      duraciones: { m15: '15 分', h1: '1 時間', h4: '4 時間' },
      tunel: 'トンネル',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare（クイック、アカウント不要）',
        ngrok: 'ngrok（ご自身のトークンを使用）',
      },
      ngrokSinToken:
        'ngrok にはご自身のトークンが必要です。サイトのトンネルオプションで保存してください。',
      compartir: '共有…',
      sinFtp:
        'FTP はトンネル経由では共有されません。暗号化されておらず、トンネルは HTTP のみを通すためです。',
      vacio: {
        titulo: '共有中のものはありません',
        texto:
          'フォルダーまたはファイルを選ぶと、一時的な公開リンクが発行されます。確認するまでは何も公開されません。',
      },
      grandes:
        '8 MB を超えるテキストファイルや種類不明のファイルは、完全に確認できないため共有されません。画像、音声、動画、パッケージ（zip、7z、gz、pdf）は共有されます。一覧では印が付きます。',
      comprimidos:
        '圧縮ファイル（.zip、.7z、.gz）は中身を確認せず、そのまま共有されます。.env ファイルや鍵が含まれている場合は、それらも公開されます。',
      confirmar: {
        titulo: 'インターネットで共有',
        pregunta: 'これをインターネットで公開しますか？',
        rutaReal: '実際のパス（リンクを解決済み）',
        ruta: '正確なパス',
        aviso: (dur) =>
          `リンクの準備ができてから ${dur} の間、インターネットで公開されます。リンクを知っている人は誰でも、共有された内容を閲覧しダウンロードできます。`,
        boton: 'インターネットで共有',
      },
      abriendo: 'トンネルを開いています…',
      activa: '共有中',
      enlace: '公開リンク',
      copiar: 'リンクをコピー',
      qr: 'リンクの QR コード',
      vence: (hasta, restan) => `${hasta} に失効（${restan}）`,
      restan: (min) => (min <= 1 ? '残り 1 分未満' : `残り ${min} 分`),
      dejar: '共有を停止',
      fin: {
        vencio: '時間になりました。サーバーとトンネルを閉じました。',
        tunel: 'トンネルが閉じ、共有が停止しました。',
      },
      registro: {
        titulo: 'アクセス履歴',
        ayuda: '最新の 200 件をメモリ内にのみ保持します。リンクの秘密のコードは表示されません。',
        vacioTitulo: 'アクセスはまだありません',
        vacioTexto: '誰かがリンクを開くたびに、ここに表示されます。',
        col: { hora: '時刻', ip: 'IP', ruta: 'パス', codigo: 'コード' },
        sinPermiso: '（正しいコードなし）',
      },
    },
    usoDisco: {
      explicacion:
        'ドライブやフォルダーで容量を使っているものを表示します。読み取るのは名前とサイズのみ（内容は読み取りません）で、リンクやジャンクションは辿らず、別のプロセスで動作します。何も削除、移動、変更しません。',
      unidades: 'ドライブ',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${total} 中 ${libre} が空き`,
      sinUnidades: 'ドライブの一覧を読み取れませんでした。フォルダーを選択できます。',
      elegirCarpeta: 'フォルダーを選択…',
      analizando: '分析中…',
      leyendo: '読み取り中',
      progreso: (archivos, carpetas, bytes) =>
        `${archivos} 個のファイル · ${carpetas} 個のフォルダー · ${bytes}`,
      cancelar: 'キャンセル',
      cancelado: '分析をキャンセルしました。',
      resumen: (total, archivos, carpetas) =>
        `${total}（${archivos} 個のファイルと ${carpetas} 個のフォルダー）`,
      duracion: (segundos) => `${segundos} 秒かかりました。`,
      vistas: {
        arbol: 'ツリー',
        carpetas: 'フォルダー',
        archivos: 'ファイル',
        extensiones: '拡張子',
      },
      arbolAyuda:
        'サイズ順に並べています。合計の 0.5% 以上を占めるフォルダーとファイルのみ表示し、残りは「その他」にまとめています。',
      carpetasAyuda:
        '自身のサイズが大きい上位 50 個のフォルダーです。直下のファイルのサイズで、サブフォルダーは含みません。',
      archivosAyuda: '大きい順の上位 50 個のファイルです。',
      extensionesAyuda:
        '容量を多く使っている上位 20 個の拡張子です。残りは「その他の拡張子」にまとめます。',
      col: {
        nombre: '名前',
        tamano: 'サイズ',
        porcentaje: '全体に占める割合',
        archivos: 'ファイル数',
        ruta: 'パス',
        extension: '拡張子',
      },
      otros: (n) => `その他（小さなファイル ${n} 個）`,
      sinExtension: '（拡張子なし）',
      otrasExtensiones: 'その他の拡張子',
      expandir: (nombre) => `${nombre} を展開`,
      contraer: (nombre) => `${nombre} を折りたたむ`,
      abrir: 'エクスプローラーで開く',
      copiar: 'パスをコピー',
      denegada: '読み取れませんでした',
      avisos: {
        enlaces: (n) => `${n} 個のリンクまたはジャンクションは辿らず、0 として数えています。`,
        denegados: (n) =>
          `${n} 個の項目を読み取れませんでした（権限がないか、分析中に変更されました）。管理者権限がないと読み取れないシステムフォルダーがあります。このツールは管理者権限を要求しません。`,
        enlacesDuros: (n) =>
          `ハードリンクされたファイルの追加の名前 ${n} 個は、二重に数えていません。`,
        enlacesDurosIncompleto:
          'ハードリンクが多すぎて登録簿がいっぱいになりました。合計で一部のファイルが二重に数えられている可能性があります。',
        truncado: '最大の深さに達しました。数えられていないフォルダーがあります。',
        tamanoLogico:
          'サイズは論理サイズ（各ファイルが報告する値）で、ディスク上の実使用量ではありません。オンライン専用の OneDrive ファイル、圧縮ファイル、スパースファイルは異なる場合があります。',
        verEnlaces: '辿らなかったリンクを表示',
      },
      limpieza: {
        titulo: '容量を空ける',
        texto:
          'このツールは計測のみを行います。一時ファイルや再生成できるキャッシュ、未使用のサービスのバージョンを削除するには、既存の機能を使用してください。',
        temporales: 'ディスククリーンアップ',
        versiones: '未使用のバージョン（サービス）',
      },
      vacio: {
        titulo: '分析はまだありません',
        texto:
          'ドライブまたはフォルダーを選ぶと、容量を使っているものを確認できます。何も変更されません。',
      },
      sinContenido: {
        titulo: '数えるものがありません',
        texto: 'そのフォルダーには読み取れるファイルがありません。',
      },
    },
    diffCarpetas: {
      explicacion:
        '2 つのフォルダーを、中身を変更せずに比較します。片方のみにあるもの、もう片方のみにあるもの、内容が異なるものを表示します。リンクは辿らず、別のプロセスで動作します。',
      carpetaA: 'フォルダー A',
      carpetaB: 'フォルダー B',
      elegir: 'フォルダーを選択',
      sinElegir: '未選択',
      comparar: '比較',
      comparando: '比較中…',
      cancelar: 'キャンセル',
      cancelada: '比較をキャンセルしました。',
      iguales: '2 つのフォルダーは同じです。',
      grupoSoloA: 'A のみ',
      grupoSoloB: 'B のみ',
      grupoDistintos: '相違あり',
      grupo: (nombre, n) => `${nombre}（${n}）`,
      vacio: 'なし',
      resumen: (a, b, iguales) =>
        `A: ${a} 個のファイル · B: ${b} 個のファイル · ${iguales} 個が同一`,
      truncado: '上限（ファイル数、深さ、サイズ）に達しました。一覧は完全ではありません。',
      recortado: (mostrados, total) =>
        `表示されている数より多くのファイルがあります（${total} 個中 ${mostrados} 個を表示）。`,
      sinComparar: (n) => `サイズが同じ大きなファイル ${n} 個は、内容を比較していません。`,
      omitidos: (n) => `リンク、ジャンクション、特殊な項目 ${n} 個をスキップしました。`,
      motivoTamano: 'サイズが異なる',
      motivoContenido: 'サイズは同じで内容が異なる',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: '一覧から「相違あり」のファイルを選ぶと、その差分を確認できます。',
      soloEnUno: (lado) => `このファイルは ${lado} にのみ存在します。`,
      cargando: 'ファイルを読み取り中…',
      binario: 'ファイルは異なりますが、テキストではないため差分は表示されません。',
      sensible:
        '機密ファイル（.env、鍵、実データ）です。内容は異なりますが、表示はされません。エディターで開くことはできますが、強化された確認が求められます。',
      tope: (kb) =>
        `ファイルは異なりますが、${kb} KB を超えているため、テキストの差分は表示されません。`,
      demasiadoDistinto: 'ファイルの違いが大きすぎるため、行ごとの差分は表示されません。',
      saltos: { lf: 'LF', crlf: 'CRLF', mixto: '改行コードが混在', ninguno: '改行なし' },
      saltosDistintos: (a, b) => `改行コード: A は ${a}、B は ${b} を使用しています。`,
      soloSaltos:
        '各行のテキストは同じです。改行コード（ファイル末尾のものを含む）または BOM のみが異なります。',
      resumenArchivo: (agregadas, quitadas) => `${agregadas} 行追加、${quitadas} 行削除`,
      truncadoArchivo: '最初の行のみ表示しています。',
      lineasIguales: (n) => `… 同一の ${n} 行 …`,
      abrirA: 'A をエディターで開く',
      abrirB: 'B をエディターで開く',
      atajos: '↑ ↓ で移動、Enter で差分を表示、Esc でキャンセルします。',
      listaAria: (grupo) => `ファイル: ${grupo}`,
      detalleAria: 'ファイルの差分',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'HTTP クライアントのセクション',
        peticion: 'リクエスト',
        coleccion: 'コレクション',
        historial: '履歴',
        entornos: '環境',
      },
      entorno: '環境',
      sinEntorno: '環境なし',
      metodo: 'メソッド',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path または {{base}}/path',
      enviar: '送信',
      enviarAtajo: '送信（Ctrl+Enter）',
      cancelar: 'キャンセル',
      nueva: '新規',
      guardar: 'コレクションに保存',
      nombre: '名前',
      nombrePlaceholder: 'リクエスト名',
      guardada: 'リクエストを保存しました',
      ayudaVariables: '{{variable}} を使うと、選択した環境の値を取り込めます。',
      secciones: {
        params: 'パラメーター',
        cabeceras: 'ヘッダー',
        cuerpo: '本文',
        auth: '認証',
        opciones: 'オプション',
      },
      par: {
        clave: '名前',
        valor: '値',
        agregar: '行を追加',
        quitar: '行を削除',
        activa: '行を有効にする',
        falta: 'シークレットがありません。送信するには入力してください。',
      },
      cuerpo: {
        tipo: '本文の種類',
        ninguno: 'なし',
        json: 'JSON',
        form: 'フォーム（urlencoded）',
        multipart: 'Multipart（テキストのみ）',
        raw: 'プレーンテキスト',
        tipoContenido: 'Content-Type',
        texto: '内容',
        multipartAyuda: 'テキストフィールドのみです。ディスク上のファイルは送信されません。',
      },
      auth: {
        tipo: '種類',
        ninguna: 'なし',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API キー',
        token: 'トークン',
        usuario: 'ユーザー',
        clave: 'パスワード',
        nombre: 'ヘッダーまたはパラメーターの名前',
        en: '送信先',
        cabecera: 'ヘッダー',
        query: 'クエリ文字列',
        ayuda:
          '値はシステムによって暗号化して保存されます。コレクション、履歴、環境には参照のみが残ります。',
      },
      secreto: {
        guardado: '保存済み（暗号化）。入力すると置き換えられます。',
        mostrar: '表示',
        ocultar: '非表示',
        quitar: '削除',
        valor: '保存された値',
        porNombre: '名前がシークレットのように見えるため、暗号化して保存されます。',
      },
      opciones: {
        plazo: 'タイムアウト（秒）',
        plazoAyuda: '1 秒から 120 秒です。',
        ignorarCert: 'このリクエストでは証明書エラーを無視する',
        ignorarAviso:
          '危険: 接続が検証されなくなります。このリクエストとそのホストにのみ適用されます。WolfCore の .test サイトは、独自の CA ですでに検証されています。',
        limites:
          'レスポンスは最大 10 MB、リダイレクトは最大 10 回です。Cookie は保存せず、システムのプロキシも使用しません。',
      },
      respuesta: {
        enviando: '送信中…',
        estado: 'ステータス',
        tiempo: '所要時間',
        tamano: 'サイズ',
        cuerpo: '本文',
        cabeceras: 'ヘッダー',
        redirecciones: 'リダイレクト',
        vacioTitulo: 'レスポンスはまだありません',
        vacioTexto:
          'URL を入力して「送信」を押してください。リクエストは WolfCore Dev から送信されます。',
        binario: (bytes, tipo) => `${bytes} バイトのバイナリ、種類: ${tipo || '不明'}。`,
        sinCuerpo: 'レスポンスに本文がありません。',
        truncada: 'レスポンスが 10 MB を超えたため、途中で切り捨てられ、不完全です。',
        parcial: (mostrados) => `最初の ${mostrados} 文字を表示しています。`,
        sinRedirecciones: 'リダイレクトはありませんでした。',
        salto: (n) => `${n} 回目`,
        urlFinal: '最終 URL',
        certIgnorado: 'このリクエストでは証明書エラーを無視しました。',
        caWolf: 'WolfCore Dev の CA で検証されました。',
        copiar: '本文をコピー',
        copiado: '本文をコピーしました',
        formato: '整形した JSON',
        crudo: '元のテキスト',
      },
      curl: {
        copiar: 'curl としてコピー',
        incluir: '認証情報を含める',
        incluirAyuda:
          'オフの場合、シークレット値は <secreto> と出力されます。オンの場合、コマンドに実際の認証情報が含まれます。',
        copiado: 'curl コマンドをコピーしました',
        importar: 'curl をインポート',
        importarTitulo: 'curl コマンドをインポート',
        importarAyuda:
          'curl コマンドを貼り付けてください。テキストとして読み取るだけで、何も実行されません。認証情報は暗号化ストアに保存されます。',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'インポート',
        importada: 'リクエストをコレクションにインポートしました',
        avisos: {
          opcion_ignorada: (d) => `無視したオプション: ${d}`,
          archivo_ignorado: (d) => `ディスク上のファイルは読み取りません: ${d}`,
          inseguro_ignorado:
            '-k/--insecure は無視しました。必要な場合は、手動で「証明書エラーを無視する」をオンにしてください。',
          comando_cortado: 'シェル演算子（|、;、&、>）以降は無視しました。',
          sin_evaluar:
            'テキストに $(…)、バッククォート、シェル変数が含まれていました。これらは評価されず、テキストのまま残ります。',
          url_sin_esquema: 'URL にスキームがなかったため、http:// を使用しました。',
          varias_urls: (d) => `余分な引数を無視しました: ${d}`,
          cabecera_invalida: (d) => `無効なヘッダーを無視しました: ${d}`,
          secretos_guardados:
            'インポートした認証情報は暗号化して保存しました。コレクションには参照のみが残ります。',
        },
      },
      coleccion: {
        vacioTitulo: 'コレクションは空です',
        vacioTexto: 'リクエストを保存するか curl コマンドをインポートすると、手元に残せます。',
        abrir: '開く',
        borrar: '削除',
        borrada: 'リクエストを削除しました',
      },
      historial: {
        vacioTitulo: '履歴はありません',
        vacioTexto:
          '直近 100 件のリクエストがここに残ります。認証情報は含まれず、機密性の高いヘッダーは *** と表示されます。',
        abrir: '開く',
        limpiar: '履歴を消去',
        sinRespuesta: 'レスポンスなし',
      },
      entornos: {
        vacioTitulo: '環境はありません',
        vacioTexto:
          '環境では {{base}} や {{token}} などの変数を定義します。シークレットとして指定したものは暗号化して保存されます。',
        nuevo: '新しい環境',
        nombre: '環境名',
        variable: '変数',
        valor: '値',
        secreta: 'シークレット',
        agregar: '変数を追加',
        quitar: '変数を削除',
        guardar: '環境を保存',
        guardado: '環境を保存しました',
        borrar: '環境を削除',
        borrado: '環境を削除しました',
        usar: 'この環境を使用',
        activo: '使用中',
        sinNombre: '環境の名前を入力してください。',
      },
    },
    imagenes: { nombreCaptura: 'スクリーンショット' },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'ポート {puerto}: {proceso}（PID {pid}）',
      puerto_dueno_exe: 'ポート {puerto}: {proceso}（PID {pid}）— {ejecutable}',
      rango_reservado: '予約済みの範囲 {desde}-{hasta}（{puerto} を含む）',
      ca_vencida: 'CA の有効期限が {dias} 日前に切れました',
      ca_por_vencer: 'CA の有効期限は {dias} 日後に切れます',
      certificado_vencido: '{dominio} の証明書の有効期限が {dias} 日前に切れました',
      certificado_por_vencer: '{dominio} の証明書の有効期限は {dias} 日後に切れます',
      firefox_perfiles: '信頼が設定されていない Firefox プロファイル:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil}（起動中）',
      firefox_perfil_fuera: '{perfil}（Firefox のフォルダー外）',
      hosts_ilegible: '{ruta}: 読み取れませんでした（{motivo}）',
      hosts_codificacion: '{ruta}: {codificacion} エンコード',
      hosts_bloques: '{ruta}: WolfCore Dev のブロックが {bloques} 個',
      hosts_sin_cierre: '{ruta}: WolfCore Dev のブロックに終了マーカーがありません',
      hosts_faltan: 'hosts にないもの: {dominios}',
      hosts_solo_lectura: '{ruta}: 読み取り専用属性',
      path_repetidas: '重複: {entradas}',
      path_delante: '{entrada} は WolfCore Dev のツールより前にあり、{programa} も含まれています',
      antivirus_sin_leer:
        'ウイルス対策ソフトが有効です。除外設定を読み取れませんでした（管理者権限が必要です）。',
      antivirus_sin_exclusion:
        'ウイルス対策ソフトが有効で、WolfCore Dev のデータフォルダーが除外されていません。',
      enlazador_ausente: 'Visual Studio Build Tools の C++ ツールが見つかりませんでした。',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022（x64）がインストールされていません。',
      firewall_no_comprobado:
        'ファイアウォールのルールを読み取れませんでした（管理者権限が必要な場合があります）。',
      firewall_reglas: 'WolfCore Dev: {propias} · WolfCore のテストの残り: {pruebas}',
      firewall_acotadas: 'ローカルネットワークに限定されたルール:',
      firewall_ajenas: '他のプログラムのルール:',
      firewall_quitadas: '復元できる削除済みのルール:',
    },
    ver: '表示',
    verPuertos: 'ポートを表示',
    dialogo: {
      reglas: '対象のルール: 変更したくないものはチェックを外してください。',
      sinSeleccion: '続行するには、ルールを 1 つ以上選択してください。',
      reglasNota:
        '確認と管理者権限がなければ、何も変更されません。表示後に変更されたルールはスキップされます。',
    },
    reparaciones: {
      firewall:
        'これらの受信ファイアウォールルールを、正確な名前で 1 件ずつ削除します。先に etc/cortafuegos-quitadas.json にコピーを保存するため、再作成できます。他のプログラムのルールには一切触れません。',
      firewall_restaurar:
        '選択したルールを、保護されたコピー（etc/ のファイルではありません）から、表示されているものと同じプログラム、プロファイル、プロトコル、ポート、アドレスで再作成します。それらのプログラムは、再びネットワーク接続を受け付けられるようになります。',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev は JDK で Maven を直接起動し、セキュリティのため .mvn/jvm.config や MAVEN_OPTS 変数は読み込みません。プロジェクトで必要な場合は、ターミナルから Maven を実行してください。',
    avisoRuby:
      'Ruby は Devkit（MSYS2）なしでインストールされ、PATH や Windows レジストリには触れません。インストーラーはありません。ビルド済みバイナリのないネイティブ拡張付きの gem には Devkit が必要です。これは手動の手順です。プロジェクトからターミナルを開き、「ridk install」を実行してください（コンピューターに MSYS2 をインストールし、インターネットからダウンロードします）。',
    avisoJdk:
      'Maven と Gradle は WolfCore Dev の JDK で動作しますが、まだインストールされていません。サービス一覧から Java（Temurin）をインストールしてください。',
    avisoMeilisearch:
      'Meilisearch はマイナーバージョンごとに独自のデータを持ちます。別のマイナーバージョンに切り替えると（例: 1.58 から 1.59）、インデックスと MEILISEARCH_KEY が新しくなります。再インデックスを行い、プロジェクトの .env を更新する必要があります。',
    servicios: { meilisearch: 'Meilisearch', ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    anteriores: (n) => `以前のパッチ（${n}）`,
  },
  memoria: {
    boton: 'メモリ',
    tituloBoton: 'メモリを最適化',
    titulo: 'メモリ最適化',
    intro:
      'モードを選んで一覧を確認してください。確認するまでは何も終了も停止もされず、自動で実行されることもありません。',
    modo: 'モード',
    modos: { liviano: '軽量', moderado: '標準', profundo: '徹底' },
    descripciones: {
      liviano: 'アプリのキャッシュを消去します。ディスク容量が空き、何も終了や停止はしません。',
      moderado:
        'さらに、PHP ワーカーを 1 つにする操作と、アクティビティも接続もない WolfCore Dev のサービスを停止する操作を提案します。サービスは最初はチェックされていません。',
      profundo:
        'さらに、メモリを多く使うご自身のプログラムを一覧表示し、ウィンドウを閉じるよう要求できます。最初はチェックされていません。',
    },
    ver: '一覧を表示',
    revisando: '確認中…',
    vacio: 'このモードで解放できるものはありません。',
    tipos: {
      'cache-app': 'キャッシュを消去',
      'reducir-pool': 'ワーカーを 1 つにする',
      'detener-inactivo': '停止（アイドル）',
      'cerrar-programa': 'ウィンドウを閉じるよう要求',
    },
    caches: { sesion: 'アプリセッションの HTTP キャッシュ' },
    estimado: (cantidad) => `約 ${cantidad} のメモリを解放できます`,
    estimadoDisco: (cantidad) =>
      `さらに約 ${cantidad} のディスク容量（キャッシュはメモリではありません）`,
    marcadas: (n, total) => `${total} 件中 ${n} 件を選択`,
    sinDatos:
      'サービスの停止や PHP の削減を提案するには、アクティビティのデータがまだ足りません。ホームを数分間開いたままにして、もう一度確認してください。',
    listadoFallido:
      '開いているプログラムの一覧を読み取れなかったため、この一覧は不完全な可能性があります。もう一度お試しください。',
    avisoDetener:
      'アイドル状態のサービスは最初はチェックされていません。停止すると、それを使っているものが切断されます。現在接続のないものだけを表示しています。',
    avisoCerrar:
      'プログラムには、X をクリックするのと同じようにウィンドウを閉じるよう要求するだけです。保存するかどうかを尋ねられる場合があります。プログラムを強制終了することはありません。',
    protegidos:
      'システムプログラム、Windows サービス、昇格されたプログラム、他のユーザーのプログラム、FlyEnv、PhpWebStudy、WolfCore Dev（およびそれらが起動するもの）は表示されません。',
    aplicar: '選択した項目を適用',
    confirmarTitulo: 'これらの操作を適用しますか？',
    confirmarTexto: (n) => `一覧の ${n} 件の操作を実行します。`,
    confirmarCerrar: (nombres) => `次のプログラムにウィンドウを閉じるよう要求します: ${nombres}。`,
    confirmarDetener: (nombres) => `次のサービスを停止します: ${nombres}。`,
    confirmar: 'はい、適用する',
    cancelar: 'キャンセル',
    resultadoTitulo: '結果',
    liberado: (cantidad) => `推定: 約 ${cantidad} のメモリを解放`,
    liberadoDisco: (cantidad) => `さらに約 ${cantidad} のディスク容量`,
    notaPedido:
      '操作待ち: ウィンドウを閉じるよう要求しましたが、プログラムはまだ開いています（保存するか尋ねている可能性があります）。解放した分には含まれません。',
    estados: { hecho: '完了', pedido: '操作待ち', saltado: 'スキップ', error: '失敗' },
    motivos: {
      no_en_plan: '一覧にありませんでした',
      protegido: '保護されたプログラムです',
      cambio: '一覧の表示後に変更されました',
      sin_ventana: '閉じるウィンドウがなくなりました',
      ya_apagado: '削減するものが残っていませんでした',
      ocupado: '使用中でした（接続があります）',
      no_se_pudo: '閉じる要求を送信できませんでした（プログラムが昇格した権限で動作しています）',
    },
    otraVez: 'やり直す',
  },
  guias: {
    tuneles: { titulo: 'トンネルガイド', copiar: 'コマンドをコピー' },
    http: {
      buscar: '番号、名前、テキストで検索',
      familia: '分類',
      todas: 'すべて',
      verMetodos: 'メソッド',
      verCodigos: 'ステータスコード',
      resultados: (n) => `${n} 件の結果`,
      vacio: '検索に一致するものはありません。',
      seguro: '安全',
      noSeguro: '安全でない',
      idempotente: '冪等',
      noIdempotente: '冪等でない',
      noEstandar: '非標準',
      broma: 'ジョークコード（RFC 2324）',
      causas: 'よくある原因',
      solucion: '対処方法',
      ejemplo: '例',
      copiarEjemplo: '例をコピー',
      probar: '試す',
      probarTitulo: 'この例を HTTP クライアントで試す（「送信」を押すまで何も送信されません）',
      servidorActivo: (puerto) =>
        `ガイドまたは HTTP クライアントを使用している間、サンプルサーバーが 127.0.0.1:${puerto} で動作します。このコンピューターからのみアクセスでき、画面を離れるか、10 分間使われないと停止します。`,
      sinTraduccion: 'この言語には翻訳されていません。英語で表示しています。',
      familias: {
        '1xx': '1xx 情報レスポンス',
        '2xx': '2xx 成功',
        '3xx': '3xx リダイレクト',
        '4xx': '4xx クライアントエラー',
        '5xx': '5xx サーバーエラー',
      },
    },
    git: {
      buscar: 'トピックまたはコマンドを検索',
      verGuia: 'ガイド',
      verLaboratorio: 'ラボ',
      todos: 'すべて',
      grupos: {
        basico: '基本',
        ramas: 'ブランチ',
        deshacer: '取り消し',
        remotos: 'リモートとタグ',
        github: 'GitHub',
      },
      resultados: (n) => `${n} 件のトピック`,
      vacio: '検索に一致するものはありません。',
      ejemplo: '例',
      errores: 'よくある間違い',
      copiarEjemplo: '例をコピー',
      peligroso: '危険',
      sinTraduccion: 'この言語には翻訳されていません。英語で表示しています。',
      avisoGithub:
        'この部分は説明のみです。WolfCore Dev は、このガイドからアカウントの作成、GitHub へのサインイン、トークンの使用を行いません。例の名前や値は架空のものです。',
      irLaboratorio: 'ラボで練習する',
      lab: {
        intro:
          '練習用のリポジトリとローカルの「リモート」を、WolfCore Dev のフォルダー内に用意します。インターネットや GitHub は使用せず、プロジェクトや git の設定にも触れません。',
        sinGit: {
          titulo: 'Git がインストールされていません',
          texto:
            'ラボはお使いのシステムの git を使用するため、git がないと開けません。Git をインストールしてから、このタブを開き直してください。WolfCore Dev が代わりにインストールすることはありません。',
        },
        cargando: 'ラボを準備中…',
        reiniciar: 'ラボをリセット',
        reiniciarAyuda: '練習用フォルダーだけを削除し、新品の状態に戻します。',
        reiniciado: 'ラボをリセットしました。',
        version: (v) => `git ${v}`,
        ordenes: 'コマンド',
        mensaje: 'コミットメッセージ',
        mensajePorDefecto: '練習用の変更',
        rama: 'ブランチ',
        etiqueta: 'タグ',
        archivo: 'ファイル',
        grupos: {
          basico: '基本',
          ramas: 'ブランチ',
          guardar: '保存と取り消し',
          remoto: 'ローカルのリモート',
        },
        archivos: {
          titulo: '練習用ファイル',
          ayuda: '編集できるのはこれらのファイルのみで、テキストは 2000 文字までです。',
          guardar: 'ファイルを保存',
          guardado: 'ファイルを保存しました。',
          areaTexto: (n) => `${n} の内容`,
        },
        salida: '出力',
        salidaVacia: 'コマンドを押すと、git の応答がここに表示されます。',
        codigo: (n) => (n === 0 ? '正常に終了しました' : `コード ${n} で終了しました`),
        truncada: '出力が途中で切り捨てられました。',
        historial: '履歴',
        historialVacio:
          'コミットはまだありません。git init、git add、git commit を実行してください。',
        conflicto: {
          titulo: 'ガイド付き演習: コンフリクト',
          intro:
            '2 つのブランチが同じ行を変更します。コンフリクトがどのように現れ、どう解決するかを確認します。',
          paso: (n, total) => `ステップ ${n} / ${total}`,
          ejecutar: 'このステップを実行',
          hecho: '完了',
          reempezar: 'やり直す',
          esperado: 'Git がコンフリクトを報告しました。このステップでは想定どおりの結果です。',
          elegir: {
            mia: 'main のものを残す（緑）',
            otra: 'rama-a のものを残す（赤）',
            ambas: '両方を残す',
          },
          final: '完了: コンフリクトを解決しました。履歴を確認してみましょう。',
          pasos: [
            {
              titulo: 'ラボを準備する',
              texto:
                'ラボをリセットし、colores.txt（「color: azul」）で最初のコミットを作成します。',
            },
            {
              titulo: 'rama-a で行を変更する',
              texto: 'rama-a ブランチを作成し、行を「color: rojo」に変更してコミットします。',
            },
            {
              titulo: 'main で同じ行を変更する',
              texto: 'main に戻り、行を「color: verde」に変更してコミットします。',
            },
            {
              titulo: 'マージを試す',
              texto:
                'rama-a を main にマージします。Git はどちらの行を残すか判断できず、コンフリクトが残ります。',
            },
            {
              titulo: 'バージョンを選ぶ',
              texto:
                '行のどちらのバージョンを残すかを選びます。colores.txt にはコンフリクトマーカーが入った状態になります。',
            },
            {
              titulo: '解決を確定する',
              texto: 'colores.txt をステージ（add）し、マージを完了させるコミットを作成します。',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `最大 ${mb} MB のテキストファイルに対応した、ハイライト付きの軽量エディターです。ファイルはシステムのダイアログで選択します。保存の際は必ず確認が表示され、先に WolfCore Dev のデータフォルダーにコピーを残します。`,
    abrir: 'ファイルを開く…',
    abriendo: '開いています…',
    guardar: '保存',
    guardando: '保存中…',
    recargar: 'ディスクから再読み込み',
    vacio: 'ファイルを開くと編集を始められます。',
    sinCambios: '変更なし',
    conCambios: '未保存の変更あり',
    posicion: (linea, columna) => `${linea} 行、${columna} 列`,
    areaTexto: (nombre) => `コードエディター: ${nombre}`,
    salirTeclado: 'キーボードでエディターから抜けるには、Esc を押してから Tab を押します。',
    guardado: 'ファイルを保存しました。',
    copiaPrevia: (ruta) => `バックアップコピー: ${ruta}`,
    cancelar: 'キャンセル',
    enlaceDuro:
      'このファイルはディスク上で複数の名前を持っています（ハードリンク）。保存するとそのリンクが切れ、他の名前には古い内容が残ります。',
    saltosMixtos: {
      aviso:
        'このファイルには複数の改行コードが混在しています。保存すると、すべて LF に統一されます。',
      aceptar: '改行コードの統一に同意します',
    },
    envGestor: {
      aviso:
        '.env ファイルは、シークレット用のフローを備えたプロジェクトの変数で編集します。このボタンはプロジェクトのルートにある .env を開きますが、開こうとしたファイルとは別のものかもしれません。',
      boton: 'プロジェクトのルートの .env を開く',
    },
    huellaPerdida:
      '保存しましたが、新しいフィンガープリントを読み取れなかったため、ファイルを再読み込みしました。',
    confirmarGuardar: {
      titulo: '変更を保存',
      texto: (nombre) =>
        `${nombre} を書き込もうとしています。その前に、ディスク上の現在の内容のコピーを WolfCore Dev のデータフォルダーに保存します。`,
      boton: 'バックアップコピーを作成して保存',
    },
    refuerzo: {
      abrirTitulo: '機密ファイル',
      guardarTitulo: '機密ファイルを保存',
      secreto:
        'このファイルにはシークレット（秘密鍵、トークン、認証情報）が含まれている可能性があります。内容が画面に表示されます。',
      datosReales:
        'このファイルは、実データを持つとマークされたサイトのものです。誤った変更は実際の情報に影響する可能性があります。',
      instruccion: (nombre) => `続行するには、ファイル名を入力してください: ${nombre}`,
      etiqueta: 'ファイル名',
      abrirBoton: 'このまま開く',
      guardarBoton: 'このまま保存',
    },
    cambioExterno: {
      titulo: 'ファイルがエディターの外で変更されました',
      texto:
        '開いた後に別のプログラムが変更したため、何も保存していません。再読み込みする（変更は失われます）か、ここにある内容で上書きできます。',
      recargar: '再読み込みして変更を破棄',
      sobrescribir: '上書き…',
      sobrescribirTitulo: 'ファイルを上書き',
      sobrescribirTexto:
        '別のプログラムによる変更は失われます。現在の内容はバックアップコピーに残ります。',
      sobrescribirBoton: 'はい、上書きする',
      volver: '戻る',
    },
    descartar: {
      titulo: '未保存の変更',
      texto: 'エディターに未保存の変更があります。続行すると失われます。',
      confirmar: '変更を破棄',
      seguir: '編集を続ける',
    },
    cm: {
      'Control character': '制御文字',
      'Selection deleted': '選択範囲を削除しました',
      'Go to line': '行へ移動',
      go: '移動',
      Find: '検索',
      Replace: '置換',
      next: '次へ',
      previous: '前へ',
      all: 'すべて',
      'match case': '大文字と小文字を区別',
      regexp: '正規表現',
      'by word': '単語単位',
      replace: '置換',
      'replace all': 'すべて置換',
      close: '閉じる',
      'current match': '現在の一致',
      'on line': '行',
      'replaced match on line $': '$ 行目の一致を置換しました',
      'replaced $ matches': '$ 件の一致を置換しました',
      'folded code': '折りたたまれたコード',
      unfold: '展開',
      to: '〜',
    },
  },
  limpiezaDisco: {
    intro:
      'まず分析して、各項目のサイズを表示します。確認するまでは何も削除されず、自動で、またはバックグラウンドで実行されることもありません。',
    analizar: '分析',
    analizando: '分析中…',
    cancelarAnalisis: 'キャンセル',
    vacio: 'クリーンアップするものはありません。',
    categorias: {
      temp: {
        nombre: '一時ファイル',
        ayuda:
          'TEMP フォルダー内の、24 時間より古いファイルです。完全に削除されますが、自動的に再生成されます。',
      },
      'cache-chrome': {
        nombre: 'Google Chrome のキャッシュ',
        ayuda:
          '各プロファイルのキャッシュフォルダーのみが対象です。Cookie、パスワード、履歴には触れません。',
      },
      'cache-edge': {
        nombre: 'Microsoft Edge のキャッシュ',
        ayuda:
          '各プロファイルのキャッシュフォルダーのみが対象です。Cookie、パスワード、履歴には触れません。',
      },
      'cache-brave': {
        nombre: 'Brave のキャッシュ',
        ayuda:
          '各プロファイルのキャッシュフォルダーのみが対象です。Cookie、パスワード、履歴には触れません。',
      },
      'cache-firefox': {
        nombre: 'Firefox のキャッシュ',
        ayuda:
          '各プロファイルの cache2 フォルダーのみが対象です。Cookie、パスワード、履歴には触れません。',
      },
      'wolfcore-descargas': {
        nombre: 'WolfCore Dev のダウンロードキャッシュ',
        ayuda: '使われなくなった単体のアーカイブです。ごみ箱に移動します。',
      },
      'wolfcore-registros': {
        nombre: 'WolfCore Dev のログ',
        ayuda: '30 日より古いログです。ごみ箱に移動します。',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          '任意です。Windows が再生成しますが、WolfCore Dev を管理者として実行する必要があります。',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'ブラウザーが開いているか、バックグラウンドで動作しています。キャッシュを消去するには完全に終了してください（Edge では、スタートアップ ブーストとバックグラウンド拡張機能もオフにしてください）',
      'requiere-admin': 'WolfCore Dev を管理者として実行する必要があります',
      'ruta-vetada': '保護されたパスのため、クリーンアップしません',
      'temp-no-seguro':
        'TEMP 変数が、ユーザーの一時フォルダーではないフォルダー（ドキュメント、ドライブ全体、ネットワークパスなど）を指しています。クリーンアップしません',
    },
    borradoDefinitivo: '完全に削除されます（自動的に再生成されます）',
    borradoPapelera: 'システムのごみ箱に移動します',
    archivos: (n) => `${n} 個のファイル`,
    carpetas: 'フォルダー別',
    truncado: '分析はファイル数の上限で停止しました。表示されている以上にあります。',
    marcadas: (n, t) => `${t} 件中 ${n} 件のカテゴリを選択`,
    total: (b) => `約 ${b} を解放できます`,
    limpiar: '選択した項目をクリーンアップ',
    confirmarTitulo: 'これらのカテゴリをクリーンアップしますか？',
    confirmarTexto: (n) => `${n} 件のカテゴリをクリーンアップします。`,
    confirmarDefinitivo: 'TEMP とキャッシュは完全に削除されます（自動的に再生成されます）。',
    confirmarPapelera: 'WolfCore Dev のログとダウンロードはごみ箱に移動します。',
    confirmarPrefetch:
      'Prefetch: Windows が再生成しますが、最初の数回はプログラムの起動が少し遅くなる場合があります。',
    confirmar: 'はい、クリーンアップする',
    cancelar: 'キャンセル',
    detener: 'クリーンアップを停止',
    resultadoTitulo: '結果',
    liberado: (b) => `解放: ${b}`,
    enPapelera: (b) => `そのうち ${b} はごみ箱にあります（ごみ箱を空にすると容量が戻ります）。`,
    saltados: (n) => `${n} 個のファイルをスキップしました`,
    cancelado: 'クリーンアップをキャンセルしました。すでに削除されたものは元に戻りません。',
    topeEjecucion:
      '1 回の実行あたりのファイル数の上限に達しました。続けるには、もう一度分析してクリーンアップしてください。',
    registroFallido:
      'クリーンアップのログに書き込めなくなったため、クリーンアップを停止しました。削除されたものは、その時点までログに記録されています。',
    motivos: {
      'en-uso': '使用中',
      enlace: 'リンクまたはリパースポイント（辿りません）',
      protegido: '保護されています（.env、FlyEnv など）',
      cambio: '分析後に変更されました',
      'sin-papelera': '利用できるごみ箱がありません',
      ilegible: '読み取れませんでした',
      error: '削除中にエラーが発生しました',
    },
    verRegistros: 'ログを表示',
    registroEn: (r) => `このクリーンアップのログ: ${r}`,
    otraVez: 'やり直す',
    protegidas:
      'データ、バックアップ、プロジェクト、データベース、.env ファイルには一切触れません。リンクは辿らず、この一覧のパス以外にも触れません。',
  },
  preferencias: {
    asistente: 'ウェルカムツアー',
    asistenteAyuda:
      '主な画面（サービス、プロジェクト、データベース、ツール、Doctor）のツアーをもう一度見ます。',
    asistenteAbrir: 'ツアーを見る',
    avanzadas: '詳細セクションを表示',
    avanzadasAyuda:
      'コンテナーなど、あまり使わない画面をサイドバーに追加します。Ctrl+K でも開けます。',
  },
  paleta: {
    irAServicio: (nombre) => `${nombre} サービスへ移動`,
    irAProyecto: (nombre) => `${nombre} プロジェクトへ移動`,
    versionesDe: (nombre) => `${nombre} のバージョン`,
    asistente: 'ウェルカムツアーを見る',
  },
  env: { bloques: { meilisearch: 'Meilisearch（キー付き）' } },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'データベースエンジンがまだありません',
      texto:
        'サービスから MySQL、MariaDB、PostgreSQL、MongoDB をインストールすると、プロジェクトのデータベースを作成して管理できます。',
      accion: 'サービスへ移動',
    },
    serviciosVacio: {
      titulo: 'インストール済みのサービスがありません',
      texto:
        'サービス（Nginx、PHP、データベースなど）が、サイトを動かすものです。まず Nginx と PHP、またはデータベースから始めましょう。',
      accion: 'サービスをインストール',
    },
    registrosSinFuentes: {
      titulo: 'ログはまだありません',
      texto:
        'サービス、サイト、プロセスが最初の 1 行を書き込むと、ログが表示されます。サービスを起動してから戻ってきてください。',
      accion: 'サービスへ移動',
    },
    registrosElegir: {
      titulo: 'ログを選択',
      texto: '上のセレクターでソースを選ぶと、その内容をリアルタイムで追えます。',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'ダンプはまだ届いていません',
      texto:
        'サイトが dump()、dd()、wd() を実行すると、ダンプがすぐにここに表示されます。サイトを開いて、そのコードを実行してください。',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'キャプチャはオフです',
      texto:
        'キャプチャをオンにすると、サイトの dump() や dd() の呼び出しが、ブラウザーを使わずにここに届きます。オンにして、サイトを起動してください。',
      accion: 'キャプチャをオンにする',
    },
    depuracionElegir: {
      titulo: 'ダンプを選択',
      texto: '一覧からダンプを選ぶと、その内容、ファイル、送信元 URL を確認できます。',
      accion: '',
    },
    erroresVacio: {
      titulo: 'ログにエラーはありません',
      texto:
        'PHP、Nginx、プロジェクトのエラーは、書き込まれ次第ここにまとめて表示されます。一覧が空なのは良い知らせです。',
      accion: '',
    },
    erroresElegir: {
      titulo: 'エラーを選択',
      texto: '一覧からエラーを選ぶと、そのトレースを確認し、ファイルをエディターで開けます。',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'チェックはまだ実行されていません',
      texto:
        'Doctor はポート、hosts、証明書、バージョンをチェックし、問題の直し方を案内します。最初のチェックを実行してください。',
      accion: '今すぐチェック',
    },
    doctorSinHallazgos: {
      titulo: '問題ありません',
      texto:
        '前回のチェックでは問題が見つかりませんでした。応答しなくなったものがある場合は、もう一度チェックしてください。',
      accion: 'もう一度チェック',
    },
    contenedoresVacio: {
      titulo: 'コンテナーはありません',
      texto:
        'このコンピューター上の Docker または Podman のコンテナーがここに表示されます。docker run または docker compose で作成してから、「更新」を押してください。',
      accion: '更新',
    },
    avisos: {
      titulo: '通知はありません',
      texto: 'サービスの停止、使用中のポート、期限が近い証明書などがここに表示されます。',
      accion: '',
    },
    instantaneas: {
      titulo: 'スナップショットはまだありません',
      texto:
        'スナップショットはこのデータベースの状態を保存し、問題が起きたときに元に戻せるようにします。上のボタンで最初のものを作成してください。',
      accion: '',
    },
    basesSinBases: {
      titulo: 'このサーバーには独自のデータベースがありません',
      texto: 'プロジェクト用のデータベースを作成するか、既存のダンプをインポートしてください。',
      accion: 'データベースを作成',
    },
    iaNube: {
      titulo: 'AI プロバイダーがまだありません',
      texto:
        'プロバイダー（OpenAI、Anthropic、OpenRouter など）を追加すると、エージェントがクラウドのモデルを使えます。キーはこのコンピューターに暗号化して保存されます。',
      accion: 'プロバイダーを追加',
    },
    iaSinModelos: {
      titulo: 'ローカルモデルがまだありません',
      texto: '下の一覧からモデルをダウンロードすると、オフラインで使用できます。',
      accion: '',
    },
    versiones: {
      titulo: '表示できるバージョンがありません',
      texto: '一覧は公式カタログからダウンロードされます。接続を確認して、一覧を更新してください。',
      accion: '一覧を更新',
    },
    buscar: {
      titulo: '一致するものがありません',
      texto:
        'フォルダー内に検索に一致するものがありません。別の言葉を試すか、「大文字と小文字を区別」のチェックを外すか、ファイルのフィルターを確認してください。',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'ウェルカムツアー',
    saltar: 'スキップ',
    terminar: '始める',
    cerrar: 'ツアーを閉じる',
    reabrir: 'Esc を押すと終了します。「設定 › 外観」からもう一度見られます。',
    ir: (destino) => `${destino} へ移動`,
    pasos: {
      bienvenida: {
        titulo: 'WolfCore Dev へようこそ',
        texto:
          'ローカル開発環境を 1 つのウィンドウに集約しました。サービス、HTTPS 対応の .test サイト、データベース、メール、ツールを扱えます。このツアーは 1 分ほどで、コンピューターには何も変更を加えません。',
      },
      servicios: {
        titulo: 'サービス',
        texto:
          'ここで Nginx、PHP、データベースをスイッチで起動します。まだインストールされていない場合は、「バージョン」タブでチェックサムを検証しながらダウンロードします。',
      },
      proyectos: {
        titulo: 'プロジェクト',
        texto:
          '新しいプロジェクトを作成するか、フォルダーやリポジトリをインポートします。各サイトには、HTTPS 対応の専用の .test アドレスが付きます。',
      },
      bases: {
        titulo: 'データベース',
        texto:
          'データベースの作成、ダンプのインポートとエクスポート、バックアップと復元を、アプリを離れずに行えます。',
      },
      herramientas: {
        titulo: 'ツールと Ctrl+K',
        texto:
          'エディター、検索、比較、パスワード、画像などを、セクションごとにまとめています。どの画面でも Ctrl+K を押すと、必要なものにすぐ移動できます。',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'ポート、hosts、証明書、バージョンをチェックし、問題の直し方を提案します。何かが応答しないときに開いてください。',
      },
      listo: {
        titulo: '準備完了',
        texto:
          'まずサービスを起動するか、最初のプロジェクトを作成しましょう。このツアーは「設定 › 外観」からもう一度見られます。',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v) => `カタログにはなくなったため、代わりに ${v} をインストールします。`,
      },
      resultado: {
        sustituida: (v) => `プロファイルのバージョンの代わりに ${v} をインストールしました。`,
      },
    },
    motivos: {
      version_sustituida:
        'そのバージョンはカタログにはなくなったため、同じマイナーバージョン（例: 8.3）の最新のものをインストールしました。',
    },
  },
  consultasLentas: {
    boton: 'スロークエリ',
    titulo: (motor) => `${motor} のスロークエリ`,
    descripcion: '指定した時間より長くかかったクエリを、遅い順に表示します。',
    cargando: 'スロークエリを読み込み中…',
    estadoTitulo: 'ログの状態',
    estadoActivo: (s) => `ログ記録はオンです。${s} 秒を超えるクエリを記録します。`,
    estadoApagado: 'ログ記録はオフです。',
    noGestionada:
      'このサーバーは WolfCore Dev が管理していません（例: 別のプログラムが起動したもの）。ここでは表示のみで、変更はできません。',
    umbral: '記録するクエリの時間（秒）',
    activar: 'ログ記録をオンにする',
    aplicarUmbral: '時間を変更',
    desactivar: 'ログ記録をオフにする',
    actualizar: 'ログを再読み込み',
    confirmarTitulo: 'スロークエリログを変更',
    confirmarActivar: (motor, s) =>
      `${motor} サーバー全体でログ記録をオンにし（${s} 秒を超えるクエリ）、設定に保存します。サーバー上のすべてのデータベースに影響します。`,
    confirmarDesactivar: (motor) =>
      `${motor} サーバー全体でログ記録をオフにし、設定に保存します。すでに記録されたものは保持されます。`,
    confirmarBoton: '変更を確定',
    cancelar: 'キャンセル',
    activado: 'スロークエリのログ記録をオンにしました',
    desactivado: 'スロークエリのログ記録をオフにしました',
    privacidad:
      'SQL は、実際の顧客データを含む可能性があるため、値を「?」に置き換えて表示します。これらはこのコンピューターの外に出ることはなく、アプリケーションのログにも書き込まれません。',
    columnas: {
      duracion: '所要時間',
      filas: '検査した行数',
      base: 'データベース',
      fecha: '日付',
      sql: 'クエリ',
      acciones: '操作',
    },
    sinBase: '紐付けなし',
    verLiteral: 'リテラルを表示',
    ocultarLiteral: 'リテラルを隠す',
    literalAviso: '値を含む SQL そのまま',
    sqlOculto: 'SQL は非表示です',
    sqlOcultoAyuda:
      '実データを危険にさらさずに、このクエリを表示することはできません。このサーバーには実データを持つデータベースがあるか、クエリを安全にデータベースへ紐付けられません。',
    copiar: 'コピー',
    copiado: 'クエリをコピーしました',
    truncado: (n) => `ログの末尾（直近の 5 MB）から、最も遅いクエリを最大 ${n} 件まで表示します。`,
    vacioTitulo: 'スロークエリはまだ記録されていません',
    vacioTextoApagado:
      'ログ記録をオンにしてサイトを使うと、指定した時間より長くかかったクエリがここに表示されます。',
    vacioTextoActivo:
      'これまでのところ、指定した時間を超えたクエリはありません。サイトを使ってから、ログを再読み込みしてください。',
  },
  esquemaBd: {
    boton: 'スキーマを表示',
    titulo: (base) => `${base} のスキーマ`,
    descripcion:
      '読み取り専用です。テーブル、カラム、キー、リレーションを表示します。テーブルのデータは読み取りません。',
    cargando: 'スキーマを読み取り中…',
    error: 'データベースのスキーマを読み取れませんでした。',
    reintentar: '再試行',
    buscar: 'テーブルを検索',
    tablas: (n) => `${n} 個のテーブル`,
    vista: 'ビュー',
    truncado: (n) => `一覧を ${n} 個のテーブルに絞りました。データベースにはさらにあります。`,
    sinResultados: '検索に一致するテーブルはありません。',
    elegir: '一覧からテーブルを選ぶと、カラム、キー、リレーションを確認できます。',
    columnas: 'カラム',
    indices: 'インデックス',
    sinIndices: 'このテーブルにはインデックスがありません。',
    relaciones: 'リレーション',
    sinRelaciones: 'このテーブルには他のテーブルとのリレーションがありません。',
    salientes: '参照先',
    entrantes: '参照元',
    alBorrar: '削除時:',
    alActualizar: '更新時:',
    irA: (tabla) => `テーブル ${tabla} へ移動`,
    col: { nombre: 'カラム', tipo: '型', nulo: 'NULL 可', defecto: '既定値', clave: 'キー' },
    si: 'はい',
    no: 'いいえ',
    pk: 'PK',
    unico: 'ユニーク',
    vacioTitulo: 'このデータベースにはテーブルがありません',
    vacioTexto:
      'テーブルを作成すると（たとえばプロジェクトのマイグレーションで）、ここに表示されます。',
  },
};
