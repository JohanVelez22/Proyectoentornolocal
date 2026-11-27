/**
 * Türkçe arayüz metinleri (tr-TR). es.ts ile aynı anahtarlar ve işlev imzaları.
 * Sabit sözlük: hizmet, örnek, site, tünel, yedek, bildirim; Doctor ve WolfCore Dev
 * çevrilmez. Resmî 'siz' dili; Git dışında 'dal' yerine her zaman 'sürüm' kullanılır.
 */
import type { Textos } from './es';

const plural = (n: number, tekil: string, cogul: string): string => `${n} ${n === 1 ? tekil : cogul}`;

export const tr: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'Zahmetsiz PHP ve Nginx',
    version: 'Sürüm',
  },
  nav: {
    inicio: 'Başlangıç',
    proyectos: 'Projeler',
    agentes: 'Ajanlar',
    servicios: 'Hizmetler',
    basesDeDatos: 'Veritabanları',
    correo: 'E-posta',
    php: 'PHP',
    ia: 'Yapay Zekâ',
    tuneles: 'Tüneller',
    contenedores: 'Konteynerler',
    herramientas: 'Araçlar',
    doctor: 'Doctor',
    depuracion: 'Hata Ayıklama',
    registros: 'Kayıtlar',
    ajustes: 'Ayarlar',
    contraer: 'Menüyü daralt',
    expandir: 'Menüyü genişlet',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'aktif hizmet', 'aktif hizmet'),
    tuneles: (n: number) => plural(n, 'aktif tünel', 'aktif tünel'),
    cargando: 'Çekirdeğe bağlanılıyor…',
    conErrores: 'hatalı',
    sinConexion: 'Çekirdekle bağlantı yok',
  },
  estado: {
    encendido: 'Çalışıyor',
    apagado: 'Durduruldu',
    iniciando: 'Başlatılıyor…',
    error: 'Hata',
    externo: 'Harici',
    activo: 'Aktif',
    aviso: 'Dikkat',
  },
  acciones: {
    encender: 'Başlat',
    apagar: 'Durdur',
    iniciarTodo: 'Tümünü başlat',
    detenerTodo: 'Tümünü durdur',
    abrir: 'Aç',
    copiar: 'Kopyala',
    copiado: 'Panoya kopyalandı',
    guardar: 'Kaydet',
    cerrar: 'Kapat',
    abrirCarpeta: 'Klasörü aç',
    instalar: 'Yükle',
    reintentar: 'Yeniden dene',
    cancelar: 'İptal',
    borrar: 'Sil',
    editar: 'Düzenle',
    duplicar: 'Çoğalt',
    renovar: 'Yenile',
    masAcciones: 'Diğer işlemler',
    actualizar: 'Güncelle',
    quitar: 'Kaldır',
    reinstalar: 'Yeniden yükle',
  },
  errores: {
    titulo: 'İşlem tamamlanamadı',
    arranque: 'Ortam durumu okunamadı',
    desconocido: 'Beklenmeyen bir hata oluştu.',
    /** Detalles que el núcleo manda como código dentro de un error. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'kapatılmamış tırnak işareti',
      'sintaxis.tras_comillas': 'tırnaklardan sonra boşluk veya «;» eksik',
      'sintaxis.punto_y_coma_inesperado': 'yönergesiz «;»',
      'sintaxis.llave_inesperada': 'yönergesiz «{»',
      'sintaxis.falta_punto_y_coma': 'yönerge sonunda «;» eksik',
      'sintaxis.sobra_llave': 'fazla «}»',
      'sintaxis.falta_llave': 'eksik «}»',
    },
    codigos: {
      'git.cambios_locales':
        'Klasörde kaydedilmemiş değişiklikler var: değişiklikleri çekmeden önce commit edin veya geri alın. Hiçbir şeye dokunulmadı.',
      'git.divergencia':
        'Dal uzak depoyla ayrıştı (farklı yerel ve uzak commitler var): elle çözün. Hiçbir şeye dokunulmadı.',
      'git.sin_upstream':
        'Geçerli dal herhangi bir uzak dalı izlemiyor: değişiklik çekilecek yer yok.',
      'git.sin_rama': 'Depo bağımsız bir commit üzerinde (dal yok): hiçbir şeye dokunulmadı.',
      'git.no_repositorio': 'Klasör bir git deposu değil.',
      'git.destino_no_vacio': 'Hedef klasör boş değil.',
      'git.destino_es_archivo': 'Hedef bir klasör değil, dosya.',
      'git.no_encontrado': 'git bulunamadı: önce yükleyin.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) bulunamadı: önce yükleyin.',
      'git.plazo': 'Klonlama {minutos} dk sınırını aştı ve iptal edildi.',
      'git.token_invalido': 'GitHub belirteci geçerli değil.',
      'git.url_con_credenciales':
        'URL kullanıcı adı veya parola içermemelidir: belirteci ayrı kullanın.',
      'servicios.desconocido': 'Bilinmeyen hizmet: {id}.',
      'servicios.no_instalado': '{nombre} yüklü değil. Hizmetler bölümünden yükleyin.',
      'servicios.puerto_invalido': 'Bağlantı noktası 1024 ile 65535 arasında bir sayı olmalıdır.',
      'servicios.puerto_asignado': '{puerto} bağlantı noktası zaten {otro} için ayrılmış.',
      'servicios.puerto_ocupado':
        '{puerto} bağlantı noktasını {nombre} (PID {pid}) kullanıyor. Kapatın veya başka bir bağlantı noktası seçin.',
      'servicios.confirmacion_borrado': '{nombre} verilerini silmek için "{id}" yazın.',
      'servicios.ftp_no_disponible': 'FTP sunucusu kullanılamıyor.',
      'sistema.sin_cliente_ftp':
        'Bu bilgisayarda ilişkili bir FTP istemcisi yok. Bir tane yükleyin (ör. FileZilla) veya adresi kopyalayın.',
      'servicios.mailpit_no_responde': 'Mailpit yanıt vermiyor. Hizmetler bölümünden başlatın.',
      'servicios.iniciar_todo_fallos':
        'Tümünü başlat şu hizmetleri başlatamadı: {nombres}. Hizmetler ve kayıtları kontrol edin.',
      'servicios.respaldo_fallo':
        '{nombre} güncellenmedi: ön yedekleme başarısız oldu ve hiçbir şey değiştirilmedi.',
      'servicios.espacio_insuficiente':
        'Verileri kopyalamak için yeterli alan yok: {necesarios} MB gerekli, {libres} MB boş.',
      'servicios.actualizacion_revertida':
        '{version} sürümü başlatılamadı; {nombre}, {anterior} sürümüne döndü. Yedek korundu.',
      'servicios.restauracion_fallo':
        'Yeni sürüm başlatılamadı ve {nombre} verileri geri yüklenemedi. Hiçbir şey başlatılmadı: etkilenen veriler {fallida}, yedek {respaldo} konumunda.',
      'servicios.otra_rama':
        '{nombre} {version} farklı bir ana sürüme ait: bunu yeni bir örnek olarak oluşturun.',
      'servicios.misma_version': '{id} zaten {version} sürümünü kullanıyor.',
      'servicios.instancia_bloqueada':
        '{nombre} kilitli: bir güncelleme verileri geri yükleyemedi. Etkilenen veriler {fallida}, yedek {respaldo} konumunda. Başlatmadan önce Hizmetler → Sürümler bölümünde çözün.',
      'servicios.datos_apartados':
        '{nombre} klasöründe veri yok ancak bir güncellemeden ayrılmış veriler var: boş klasör oluşturulmadı. Hizmetler → Sürümler bölümünü kontrol edin.',
      'servicios.puerto_reservado':
        '{puerto} bağlantı noktası sistem tarafından ayrılmış ({desde}–{hasta}): başka bir tane seçin.',
      'servicios.borrado_con_bloqueo':
        '{nombre} bir güncelleme sonrasında kilitli bir örneğe sahip: verilerini silmeden önce kilidi çözün.',
      'servicios.config_no_revertida':
        '{nombre} {version} başlatılamadı ve yapılandırmada {anterior} sürümüne dönülemedi. Hizmetler → Sürümler bölümünde {anterior} sürümünü yeniden seçin.',
      'servicios.puerto_revertido_apagada':
        '{nombre} yeni bağlantı noktasında başlatılamadı; {anterior} değerine dönüldü ancak orada da başlatılamadı: {anterior} üzerinde durduruldu.',
      'servicios.puerto_no_revertido':
        '{nombre}, {nuevo} bağlantı noktasında başlatılamadı ve yapılandırma {anterior} değerine dönemedi: durdurulmuş olarak kaldı.',
      'instancias.id_invalido': 'Örnek kimliği geçerli değil.',
      'instancias.no_existe': '{id} örneği mevcut değil.',
      'instancias.existe': '{id} örneği zaten mevcut.',
      'instancias.una_sola': '{nombre} yalnızca tek bir örneği destekler.',
      'instancias.ultima': '{id} tek örnektir: kaldırılamaz.',
      'instancias.sin_puerto_libre': 'Örnek için boş bağlantı noktası bulunamadı.',
      'instancias.confirmacion': 'Devam etmek için "{id}" yazın.',
      'instancias.sin_datos': '{id} klasöründe veri yok: geri yüklemek için bir yedek seçin.',
      'instancias.respaldo_no_existe': '{id} için böyle bir yedek yok.',
      'instancias.respaldo_en_uso':
        'Bu kopya kilitli olan {id} için gereklidir: önce onu çözün.',
      'instancias.version_requerida':
        '{id} için hangi sürüme dönüleceği bilinmiyor: aynı ana sürümden yüklü bir sürüm seçin.',
      'instalador.version_en_uso':
        '{servicio} {version} kaldırılamaz: {instancia} örneği bunu kullanıyor.',
      'limpieza.sin_confirmar': 'Sürümleri temizlemek için onay gerekiyor.',
      'limpieza.seleccion_invalida': 'Sürüm seçimi geçerli değil.',
      'limpieza.en_curso': 'Zaten devam eden bir sürüm temizliği var.',
      'limpieza.no_existe': '{servicio} {version} artık yüklü değil.',
      'limpieza.en_uso': '{servicio} {version} kullanıma girdi: kaldırılmadı.',
      'limpieza.ruta_insegura':
        '{servicio} {version} klasörü güvenli değil (bağlantı veya bin dışında bir yol): dokunulmadı.',
      'limpieza.version_bloqueada':
        '{servicio} {version} dosyaları kullanımda veya kilitli: kaldırılmadı ve yarım bırakılmadı.',
      'limpieza.otro_volumen':
        '{servicio} {version} geçici veri klasöründen farklı bir diskte: tek parça taşınamadı ve dokunulmadı.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} sizin yüklediğiniz paketleri içeriyor (npm, pip…): kaldırmak için bunları kaybetmeyi onaylayın.',
      'limpieza.destino_ocupado':
        'bin içinde zaten bir {servicio} {version} klasörü var: üzerine yazılmaz. Diğerini kurtarmadan önce bunu kaldırın.',
      'bd.encender_servicio': 'Veritabanlarını yönetmek için {nombre} hizmetini başlatın.',
      'bd.sin_credenciales': '{nombre} için kayıtlı kimlik bilgisi yok.',
      'bd.confirmacion_borrado': '{nombre} veritabanını silmek için tam adını yazın.',
      'bd.usuario_privilegiado':
        '{usuario} kullanıcısı bir yönetici veya sistem rolüdür: proje için ayrı bir kullanıcı seçin.',
      'bd.usuario_en_uso':
        'Başka bir proje zaten {usuario} kullanıcısını kullanıyor: bağlantısını kesmemek için parolası değiştirilmedi. Hiçbir şey oluşturulmadı.',
      'bd.rol_sin_login':
        '{usuario} kullanıcısı mevcut ancak oturum açamıyor (LOGIN yetkisiz rol veya sunucu erişim kuralı). Hiçbir şey değiştirilmedi.',
      'bd.usuario_clave_distinta':
        '{usuario} kullanıcısı farklı bir parolayla zaten mevcut. Mevcut parolasını kullanın: diğer projelerin bağlantısını bozmamak için değiştirilmez.',
      'bd.mongosh_faltante': 'mongosh eksik: MongoDB yönetmek için Hizmetler bölümünden yükleyin.',
      'tuneles.sitio_no_encontrado': 'Proje bulunamadı.',
      'tuneles.confirmacion_requerida':
        '{dominio} sitesini internette yayınlamak WolfCore Dev içinde onay gerektirir.',
      'tuneles.confirmacion_obsoleta':
        '{dominio} tüneli onaylandıktan sonra değişti: yeniden onaylayın.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared yüklü değil. Hizmetler bölümünden yükleyin.',
      'tuneles.proveedor_no_disponible': '{proveedor} tünel sağlayıcısı kullanılamıyor.',
      'tuneles.cloudflare_sin_cuenta':
        'Önce tünel seçeneklerinden Cloudflare hesabınızı bağlayın.',
      'tuneles.cloudflare_sin_credencial':
        'Bu tünelin kayıtlı kimlik bilgisi yok: tünel seçeneklerinden yeniden oluşturun.',
      'tuneles.cloudflare_datos_invalidos':
        'Tünel adı (küçük harf, rakam ve tire) veya genel alan adı geçerli değil.',
      'tuneles.cloudflare_conexion_en_curso': 'Cloudflare bağlantısı zaten sürüyor.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare, {dominio} yerine {registrado} kaydetti: alan adı yetkilendirdiğiniz bölgeye ait değil. Bu kaydı Cloudflare panelinden silin.',
      'tuneles.cloudflare_conexiones_activas':
        '{nombre} tünelinde etkin bağlantılar var (cloudflared silmek için -f ister). Açık olduğu tüm bilgisayarlardan kapatıp tekrar deneyin veya «Yalnızca burada unut» seçeneğini kullanın.',
      'tuneles.nombre_en_uso': '{nombre} tüneli başka bir site tarafından kullanılıyor.',
      'tuneles.dominio_en_uso': '{dominio} alan adı başka bir site tarafından kullanılıyor.',
      'tuneles.confirmacion_olvidar': '{nombre} tünelini unutmak veya yeniden oluşturmak onay gerektirir.',
      'tuneles.cloudflare_fallo': 'cloudflared işlemi tamamlayamadı: {detalle}',
      'tuneles.credencial_no_protegida':
        'Kimlik bilgisi mevcut kullanıcıyla sınırlandırılamadığı için kullanılmadı.',
      'tuneles.sin_cifrado':
        'Sistem şifrelemesi kullanılamıyor: kimlik bilgileri kaydedilemiyor.',
      'tuneles.token_invalido':
        'Belirteç geçersiz: yalnızca harf, rakam ve _ . - (8–200 karakter). Tünel seçeneklerinden yeniden kaydedin.',
      'tuneles.ngrok_no_instalado':
        'Bu bilgisayarda ngrok yüklü değil. ngrok.com adresinden yükleyip tekrar deneyin.',
      'tuneles.ngrok_sin_token': 'ngrok belirteci eksik: tünel seçeneklerinden kaydedin.',
      'tuneles.expose_sin_token': 'Expose belirteci eksik: tünel seçeneklerinden kaydedin.',
      'tuneles.tailscale_no_instalado':
        'Bu bilgisayarda Tailscale yüklü değil. WolfCore Dev yüklemez: tailscale.com adresinden yükleyin.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale oturumu açık değil: Tailscale oturumu açıp tekrar deneyin.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale, HTTPS {puerto} bağlantı noktasında zaten bir şey yayınlıyor. WolfCore Dev üzerine yazmaz: Tailscale ile kaldırıp tekrar deneyin.',
      'lan.sitio_no_encontrado': 'Site bulunamadı.',
      'lan.confirmacion_requerida':
        '{dominio} sitesini yerel ağda paylaşmak WolfCore Dev içinde onay gerektirir.',
      'lan.datos_reales':
        '{dominio} gerçek müşteri verileri içeriyor: onayla bile yerel ağda paylaşılmaz. Müşteri verisi olmayan bir kopya kullanın.',
      'lan.sin_red':
        'Bağlı bir yerel ağ yok (Wi-Fi veya Ethernet). Bir ağa bağlanıp tekrar deneyin.',
      'lan.ip_no_valida':
        '{ip} adresi artık yerel ağınıza ait değil. Pencereyi yeniden açıp tekrar onaylayın.',
      'lan.requiere_https': '{dominio} HTTPS yönlendirmesi yapıyor: HTTPS seçeneğiyle paylaşın.',
      'lan.sin_puertos':
        'Yerel ağ için 8100–8199 arasında boş bağlantı noktası kalmadı (paylaşılan siteler ve CA bağlantısı bu aralığı kullanır). Bir paylaşımı durdurun veya CA penceresini kapatıp tekrar deneyin.',
      'tuneles.expose_no_instalado':
        'Expose yüklü değil. Windows üzerinde yalnızca expose.phar ile çalışır: {carpeta} içine koyun.',
      'tuneles.expose_datos_reales':
        'Expose gerçek verili sitelerle kullanılmaz: istek denetçisi tüm yerel ağda görünür. Başka bir sağlayıcı seçin.',
      'tuneles.confirmacion_requerida_tailnet':
        '{dominio} sitesini tailnet ağınızla paylaşmak WolfCore Dev içinde onay gerektirir.',
      'tuneles.tailscale_estado_ilegible':
        'Tailscale’in bu bilgisayarda neler yayınladığı okunamadığı için üzerine yazmamak adına hiçbir şey açılmadı. Tailscale’in çalıştığını doğrulayıp tekrar deneyin.',
      'tuneles.tailscale_no_habilitado':
        'Tailnet ağınızda Serve veya Funnel etkin değil. {enlace} üzerinden etkinleştirip tekrar deneyin.',
      'tuneles.ngrok_desactualizado':
        'ngrok sürümünüz eski ve WolfCore Dev için gereken özellikleri desteklemiyor. Güncelleyip (ngrok update) tekrar deneyin.',
      'hosts.dominio_invalido': 'Geçersiz bir alan adı var.',
      'hosts.tiempo_agotado':
        'Yönetici iznine {segundos} sn içinde yanıt verilmedi; hosts dosyası değişmeden kaldı.',
      'https.sin_dominio': 'Bir sertifika için en az bir alan adı gerekir.',
      'https.sin_autoridad':
        'WolfCore Dev sertifika otoritesi mevcut değil. Sertifika oluşturmadan önce HTTPS bölümünden CA yükleyin.',
      'herramientas.pid_invalido': 'PID geçerli değil.',
      'herramientas.pid_sistema': 'PID {pid} sisteme aittir ve sonlandırılamaz.',
      'herramientas.proceso_propio':
        'WolfCore Dev veya onu başlatan işlem sonlandırılamaz.',
      'herramientas.proceso_inexistente': '{pid} işlemi artık mevcut değil.',
      'herramientas.sin_editor':
        'Kod düzenleyici bulunamadı. Bir tane yükleyin (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} yüklü değil. Ayarlar bölümünden başka bir düzenleyici seçin.',
      'herramientas.editor_invalido': 'Bu düzenleyici geçerli değil.',
      'herramientas.carpeta_sitio_inexistente': 'Proje klasörü mevcut değil.',
      'herramientas.ruta_no_absoluta': 'Yol mutlak olmalıdır.',
      'herramientas.sin_seleccion': 'En az bir öğe seçin.',
      'herramientas.dominio_invalido': 'Geçersiz bir alan adı veya IP var.',
      'herramientas.demasiados_dominios':
        'Bir sertifika en fazla {maximo} alan adı veya IP destekler.',
      'buscar.consulta_invalida': 'Aranacak metni yazın (en fazla 500 karakter).',
      'buscar.raiz_invalida': 'Klasör veya dosya mevcut değil ya da geçersiz.',
      'buscar.regex_invalida': 'Düzenli ifade geçerli değil.',
      'buscar.regex_lenta':
        'Düzenli ifade çok uzun sürüyor: basitleştirin veya düz metin kullanın.',
      'buscar.demasiadas': 'Zaten {maximo} arama sürüyor: birini iptal edin veya bekleyin.',
      'terminal.no_abrio': 'Terminal açılamadı.',
      'terminal.no_instalada': '{nombre} yüklü değil. Ayarlar bölümünden başka bir terminal seçin.',
      'terminal.invalida': 'Bu terminal geçerli değil.',
      'terminal.powershell_restringido':
        'Bu bilgisayarda PowerShell kısıtlı dil modunda (kuruluş ilkesi veya AppLocker): WolfCore Dev terminali açamıyor. Proje klasöründe kendiniz açın.',
      'proyectos.no_existe': 'Proje mevcut değil.',
      'proyectos.no_confiado': 'Reçeteyi çalıştırmak için "Bu depoya güveniyorum" seçeneğini işaretleyin.',
      'proyectos.receta_en_curso': 'Bu proje için zaten devam eden bir reçete var.',
      'proyectos.paso_no_omitible': '"Siteyi oluştur" adımı atlanamaz.',
      'workspaces.no_existe': 'Bu çalışma alanı mevcut değil.',
      'workspaces.invalido': 'Çalışma alanı geçersiz: adını ve öğelerini kontrol edin.',
      'workspaces.captadores_exclusivos':
        'İki e-posta yakalayıcı aynı anda çalışamaz: yalnızca biri çalışır.',
      'workspaces.elemento_fallo':
        '{elemento} ile işlem tamamlanamadı. Hizmetler ve kayıtları kontrol edin.',
      'workspaces.base_no_responde':
        '{elemento} başlatılamadı çünkü bu projenin veritabanı yanıt vermiyor.',
      'tareas.cron_invalida':
        'Cron ifadesi geçersiz. 5 alan kullanın: dakika, saat, ayın günü, ay ve haftanın günü (ör. 0 3 * * *).',
      'tareas.comando_invalido':
        'Bu komuta izin verilmiyor. Satır içi kod (-r, -e, -c) olmadan bir proje dosyasıyla php, node, npm run veya python kullanın.',
      'tareas.invalida': 'Görev geçersiz: adı, zamanlamayı ve komutu kontrol edin.',
      'tareas.no_existe': 'Bu görev artık mevcut değil.',
      'tareas.sin_confirmar': 'Çalıştırabilmek için görevin komutunu onaylayın.',
      'tareas.sitio_no_confiado':
        'Görevlerini çalıştırmak için projede «Bu depoya güveniyorum» seçeneğini işaretleyin.',
      'tareas.receta_cambio':
        'Proje reçetesi güvendiğinizden beri değişti: inceleyip «Bu depoya güveniyorum» seçeneğini yeniden işaretleyin.',
      'tareas.aislado':
        'Bu bir test veri klasörüdür (WOLFCORE_DATOS): çalıştırmak için zamanlanmış görevlere izin verin.',
      'tareas.carpeta': 'Proje klasörü mevcut değil: görev çalıştırılamaz.',
      'tareas.en_curso': 'Görev zaten çalışıyor.',
      'tareas.demasiadas': 'Bu projede çok fazla görev var (en fazla {maximo}).',
      'cli.no_autorizado':
        'CLI komutu yetkilendirilmedi: WolfCore Dev uygulaması açıkken tekrar çalıştırın.',
      'cli.orden_desconocida': 'WolfCore Dev bu CLI komutunu tanımıyor.',
      'cli.argumentos_invalidos': 'Komut argümanları geçerli değil.',
      'cli.solicitud_grande': 'İstek çok büyük (en fazla {maximo} bayt).',
      'cli.formato_no_admitido': 'İstek CLI tarafından kabul edilen biçimde değil.',
      'cli.plazo':
        'Komut çok uzun sürdü: hâlâ sürüyor olabilir. Durumu WolfCore Dev içinde kontrol edin.',
      'cli.ocupado':
        'WolfCore Dev çok fazla CLI komutunu işliyor: bir süre bekleyin.',
      'cli.requiere_confirmacion':
        'Bu komut bir şey yayınlar veya değiştirir ve {sitio} için onay (--si) gerektirir.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} gerçek veriler içerir: komutun gerçek veri seçeneğiyle (sitenin alan adı) de onaylayın.',
      'cli.requiere_confirmacion_global':
        'Tüm terminallerin PHP sürümünü değiştirmek onay (--si) gerektirir.',
      'cli.confirmacion_rechazada':
        'WolfCore Dev penceresindeki onay reddedildi veya kullanılamadı: hiçbir şey yapılmadı.',
      'cli.confirmacion_vencida':
        'WolfCore Dev penceresinde zamanında onay verilmedi: hiçbir şey yapılmadı.',
      'cli.tunel_fallo': 'Tünel açılamadı. WolfCore Dev içindeki kaydını kontrol edin.',
      'cli.inicio_fallo':
        'İstenenlerin tümü başlatılamadı. WolfCore Dev içindeki kayıtları kontrol edin.',
      'cli.parada_fallo':
        'İstenenlerin tümü durdurulamadı. WolfCore Dev içindeki kayıtları kontrol edin.',
      'cli.interno': 'CLI sunucusunda dahili hata.',
      'cli.proveedor_distinto':
        'Site başka bir tünel sağlayıcısı ({proveedor}) kullanıyor. İnceleyip yeniden onaylayın.',
      'cli.sitio_no_encontrado': '{sitio} sitesi mevcut değil.',
      'cli.carpeta_invalida':
        'Klasör mevcut değil, sistem klasörü veya WolfCore Dev veri klasörü.',
      'cli.carpeta_sin_sitio':
        'Bu klasör herhangi bir WolfCore Dev sitesine ait değil: önce bağlayın.',
      'cli.ya_vinculada': 'Bu klasör zaten {sitio} sitesidir.',
      'cli.tipo_no_soportado':
        '{tipo} türündeki projeler WolfCore Dev arayüzünden oluşturulur.',
      'cli.sitio_sin_php': '{sitio} sitesi PHP kullanmıyor.',
      'cli.version_no_instalada':
        '{servicio} {version} yüklü değil. Hizmetler bölümünden yükleyin.',
      'cli.fuente_no_existe': 'Bu kayıt henüz mevcut değil.',
      'cli.token_no_protegido':
        'Belirteç dosyası mevcut kullanıcıyla sınırlandırılamadı: CLI etkinleştirilmiyor.',
      'cli.carpeta_ajena':
        'Veri klasöründeki run/ klasörü başka bir kullanıcıya ait: CLI etkinleştirilmiyor.',
      'cli.ruta_invalida': 'WolfCore Dev yolu wolf.cmd tarafından desteklenmeyen karakterler içeriyor.',
      'cli.path_aislado':
        'Test veri klasörüyle (WOLFCORE_DATOS) kullanıcı PATH değeri değiştirilmez.',
      'cli.sin_cliente': 'Bu WolfCore Dev sürümü wolf istemcisini içermiyor (derlenmemiş).',
      'cli.demasiados_dialogos':
        'Son bir dakikada çok fazla onay istendi: biraz bekleyip tekrar deneyin.',
      'cli.error': 'Komut tamamlanamadı: {detalle}',
      'proyectos.carpeta_no_vacia':
        'Proje klasöründe zaten dosyalar var: başka bir klasör seçin veya boşaltın.',
      'secretos.sin_cifrado':
        'Sistem şifrelemesi kullanılamıyor: özel kullanıcının parolası saklanamıyor. Hiçbir şey değiştirilmedi.',
      'proyectos.clave_bd_falta':
        '{usuario} kullanıcısının kayıtlı parolası eksik: hiçbir şey yazılmadı. .env yöneticisinde "Özel kullanıcı kullan" yeni bir parola oluşturur.',
      'env.archivo_grande': 'Değişken dosyası çok büyük (en fazla {maximo}).',
      'env.no_regular': '.env normal bir dosya değil: okunmaz ve değiştirilmez.',
      'env.clave_inexistente': '{clave} değişkeni mevcut değil.',
      'env.cambio_invalido': 'Bir .env değişikliği geçerli değil.',
      'env.variable_invalida': '{clave} değişkenindeki değişiklik geçerli değil.',
      'env.solo_lectura': '{clave} değişkeni birden fazla satır kaplıyor: dosyada elle düzenleyin.',
      'env.usuario_compartido':
        '{base} veritabanını {proyecto} projesi de kullanıyor: kullanıcısını paylaşmak istediğinizi onaylayın.',
      'env.cambio_externo':
        'Önizlemeden bu yana .env değişti: kaydetmeden önce yeniden inceleyin.',
      'env.sin_confirmar': '.env değişikliklerini kaydetmek istediğinizi onaylayın.',
      'env.versionado':
        'Git bu projenin .env dosyasını zaten izliyor: sonraki commit değerlerini yükler. Devam etmek için ayrıca onaylayın.',
      'env.versionado_desconocido':
        'Git’in bu projenin .env dosyasını izleyip izlemediği kontrol edilemedi: devam etmek için ayrıca onaylayın.',
      'env.copia_invalida': '.env yedeği geçersiz veya artık mevcut değil.',
      'env.sin_base': 'Bu projenin .env dosyasında veritabanı bağlantısı yok.',
      'env.base_no_resuelta':
        'Bu projenin veritabanı yerel bir WolfCore Dev sunucusuna ait değil: hiçbir şey değiştirilmedi.',
      'env.motor_no_soportado': 'Şimdilik "Özel kullanıcı kullan" yalnızca MySQL ve MariaDB ile çalışır.',
      'env.ya_usa_usuario_propio': 'Bu proje zaten özel kullanıcı kullanıyor.',
      'plantillas.id_invalido': 'Şablon kimliği geçerli değil.',
      'plantillas.no_existe': 'Şablon mevcut değil.',
      'plantillas.danada':
        'Şablon bozuk veya değiştirilmiş: kullanılmıyor. Silin ve yeniden kaydedin.',
      'plantillas.demasiado_grande':
        'Projede şablon olarak kaydetmek için çok fazla dosya var (en fazla {maximo} dosya). Büyük klasörleri hariç tutun.',
      'plantillas.demasiado_pesada':
        'Proje şablon olarak kaydetmek için çok büyük (en fazla {maximo}). Büyük klasörleri hariç tutun.',
      'plantillas.exclusion_invalida':
        'Hariç tutmalardan biri geçersiz (".." olmadan ad veya göreli yol kullanın).',
      'plantillas.nombre_invalido':
        'Şablon adı geçersiz (1–60 karakter).',
      'plantillas.esquema_fallo':
        'Proje veritabanı şeması okunamadı: hizmetinin çalıştığını doğrulayın.',
      'plantillas.base_no_resuelta':
        'Şablon kaydedilemiyor: veritabanı sunucusu uzak veya hiçbir yerel hizmet bu bağlantı noktasını kullanmıyor.',
      'plantillas.sin_generador_base':
        'Bu proje türünün temel oluşturucusu yok: şablon proje dosyalarını içermelidir.',
      'plantillas.exclusiones_nuevas':
        'Şablon artık hariç tutulan bir dosya içeriyor ({archivo}): projeden yeniden kaydedin veya silin.',
      'plantillas.motor_distinto':
        'Şablon şeması MySQL, seçilen sunucu MariaDB (veya tersi): farklar olabilir. Devam etmek istediğinizi onaylayın.',
      'bd.sql_no_permitido':
        'Şema yapısal olmayan bir ifade içeriyor ve hiçbir şey çalıştırılmadı: {sentencia}',
      'bd.extension_no_permitida':
        'Şema izinli listede olmayan {nombre} uzantısını istiyor: hiçbir şey geri yüklenmedi.',
      'bd.esquema_fallo': 'Şemanın tamamı geri yüklenemedi: hiçbir şey yarım bırakılmadı.',
      'bd.datos_no_permitidos':
        'Veri dökümü veri olmayan bir ifade içeriyor (yalnızca INSERT, LOCK TABLES ve SET kabul edilir): hiçbir şey içe aktarılmadı.',
      'bd.datos_fallo':
        'Veriler içe aktarılamadı: veritabanı olduğu gibi bırakıldı, hiçbir şey yarım kalmadı.',
      'perfiles.destino_invalido': 'Profilin kaydedileceği yeri seçin (bir .wolfperfil dosyası).',
      'perfiles.frase_debil': 'CA parolası en az {minimo} karakter olmalıdır.',
      'perfiles.frase_incorrecta': 'Parola doğru değil: hiçbir şey içe aktarılmadı.',
      'perfiles.certificados_sin_ca':
        'Site sertifikaları yalnızca şifreli CA ile birlikte taşınır: bir parolayla CA’yı da dahil edin.',
      'perfiles.no_existe': 'Profil dosyası mevcut değil.',
      'perfiles.danado': 'Profil bozuk veya değiştirilmiş: hiçbir şey içe aktarılmadı.',
      'perfiles.demasiado_grande': 'Profil çok büyük (en fazla {maximo}).',
      'perfiles.version_no_soportada':
        'Profil WolfCore Dev’in daha yeni bir sürümüne ait (biçim {version}): içe aktarmak için uygulamayı güncelleyin.',
      'perfiles.sin_confirmar': 'Profili içe aktarmak istediğinizi onaylayın.',
      'perfiles.vista_previa_vieja':
        'Önizlemeden bu yana veri klasörü veya profil değişti: yeniden inceleyin.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS geçerli bir veri klasörü değil: mutlak olmalı, sistem klasörü olmamalı ve gerçek klasörden farklı olmalıdır.',
      'perfiles.confirmar_reemplazar_ca':
        'Profil bir CA içeriyor ve bu bilgisayarda zaten kendi CA’sı var: parmak izini karşılaştırın ve değiştirmek istediğinizi ayrıca onaylayın (yalnızca kendi CA’nız ise).',
      'herramientas.imagen_tipo':
        'Bu dosya desteklenen bir görsel değil (PNG, JPG, WebP, GIF, BMP veya ICO) ya da içeriği türüyle eşleşmiyor.',
      'herramientas.imagen_grande': 'Görsel çok büyük (en fazla {maximo}).',
      'herramientas.imagen_dimensiones':
        'Görsel çok büyük ({ancho}×{alto} px; kenar başına en fazla {maximo} px) ve güvenlik nedeniyle açılmadı.',
      'herramientas.zip_sin_archivos': 'Sıkıştırılacak dosya yok (bağlantılar izlenmez).',
      'herramientas.zip_demasiados': 'Sıkıştırılacak çok fazla dosya var (en fazla {maximo}).',
      'herramientas.zip_grande': 'Sıkıştırılacak içerik çok büyük (en fazla {maximo}).',
      'herramientas.pdf_invalido': 'Dosya optimize edilebilecek bir PDF değil.',
      'herramientas.pdf_grande': 'PDF çok büyük (en fazla {maximo}).',
      'herramientas.pdf_cifrado': 'PDF parola korumalı ve optimize edilemez.',
      'herramientas.pdf_plazo': 'PDF {segundos} sn’den uzun sürdü ve iptal edildi.',
      'herramientas.salida_ocupada': 'Yeni dosya için uygun bir ad bulunamadı.',
      'conversor.formato': 'Bu dönüştürme kullanılamıyor.',
      'conversor.archivo_invalido':
        'Dosya bozuk veya uzantısının belirttiği türde değil.',
      'conversor.archivo_grande': 'Dosya çok büyük (en fazla {maximo}).',
      'conversor.archivo_peligroso':
        'Dosya bir ZIP bombasına benziyor veya kurcalanmış (aşırı içerik, XML varlıkları veya geçersiz adlar) ve güvenlik nedeniyle açılmadı.',
      'conversor.limite_filas': 'Tabloda çok fazla satır var (en fazla {maximo}).',
      'conversor.limite_columnas': 'Tabloda çok fazla sütun var (en fazla {maximo}).',
      'conversor.limite_paginas': 'PDF dosyasında çok fazla sayfa var (en fazla {maximo}).',
      'conversor.pdf_cifrado': 'PDF parola korumalı ve dönüştürülemez.',
      'conversor.plazo': 'Dönüştürme {segundos} sn’den uzun sürdü ve iptal edildi.',
      'conversor.cancelado': 'Dönüştürme iptal edildi.',
      'conversor.libreoffice_ausente':
        'Bu dönüştürme LibreOffice gerektirir ancak bu bilgisayarda yüklü değil (WolfCore Dev yüklemez).',
      'conversor.libreoffice_fallo': 'LibreOffice belgeyi dönüştüremedi.',
      'conversor.limite_celdas': 'Tabloda çok fazla hücre var (en fazla {maximo}).',
      'conversor.memoria': 'Dosya çok fazla bellek gerektiriyor ({maximo} sınırını aştı) ve iptal edildi.',
      'conversor.pdf_no_disponible': 'PDF olarak yazdırma şu anda kullanılamıyor.',
      'herramientas.imagen_pixeles':
        'Görselde toplam çok fazla piksel var ({ancho}×{alto} px; en fazla {maximo}) ve güvenlik nedeniyle açılmadı.',
      'herramientas.zip_cambio': 'Sıkıştırma sırasında bir dosya değişti: tekrar deneyin.',
      'herramientas.pdf_demasiado_complejo':
        'PDF çok karmaşık (izin verilenden fazla bellek kullanacak) ve iptal edildi.',
      'herramientas.salida_denegada':
        'Bu konuma yazılamıyor: izinleri veya klasörün var olduğunu kontrol edin.',
      'herramientas.fuera_de_la_ca':
        'WolfCore Dev CA yalnızca .test alan adlarını, localhost ve yerel adresleri imzalar: {dominio} eklenemez.',
      'perfiles.frase_requerida':
        'Veritabanlarını veya CA’yı içe aktarmak için profil parolasını yazın (veya veritabanları olmadan içe aktarın).',
      'perfiles.sin_espacio':
        'Profili içe aktarmak için yeterli boş alan yok: {necesarios} gerekli, {libres} mevcut.',
      'perfiles.ca_sin_restricciones':
        'Bu CA herhangi bir web sitesini imzalayabilir: yalnızca size aitse içe aktarın ve parmak izini karşılaştırın. Devam etmek için ayrıca onaylayın.',
      'perfiles.ca_restricciones_ajenas':
        'Profilin CA’sı WolfCore Dev’e ait olmayan ad kısıtlamalarına sahip: içe aktarılmaz.',
      'perfiles.instantanea_fallo':
        'Ortamın önceki anlık görüntüsü kaydedilemedi: hiçbir şey değiştirilmedi. Disk alanını ve veri klasörü izinlerini kontrol edin.',
      'perfiles.en_curso': 'Zaten bir profil içe aktarması sürüyor: bitmesini bekleyin.',
      'importar.origen_apagado':
        'Diğer programın veritabanı sunucusuna bağlanılamadı: o programdan başlatıp tekrar deneyin. Siteler yine de içe aktarıldı.',
      'importar.origen_no_local': 'Kaynak sunucu bu bilgisayarda olmalıdır (127.0.0.1).',
      'importar.origen_rechazado': 'Kaynak sunucu kullanıcı adını veya parolayı reddetti.',
      'importar.origen_version':
        'Kaynak sunucu sürümü WolfCore Dev’de yüklü bileşenlerle içe aktarılamıyor.',
      'importar.volcado_enorme':
        'Veritabanı verileri {maximo} MB’den büyük: tek seferde içe aktarılmaz.',
      'importar.motor_no_soportado':
        'Diğer programlardan yalnızca MySQL ve MariaDB veritabanları içe aktarılır.',
      'importar.ruta_fuera':
        'Kurulum dışına veya sistem klasörüne işaret eden bir klasör ya da dosya atlandı.',
      'importar.carpeta_invalida': 'Artık mevcut olmayan veya klasör olmayan bir öğe atlandı.',
      'importar.archivo_grande':
        'Bir yapılandırma dosyası {maximo} KB’den büyük olduğu için okunmadı.',
      'importar.archivo_ilegible': 'Bir yapılandırma dosyası metin değil veya okunamadı.',
      'importar.demasiados':
        'Çok fazla site veya yapılandırma dosyası var: yalnızca ilkleri okundu.',
      'importar.candidato_desconocido':
        'Bu site artık kaynak programda görünmüyor: yeniden arayın.',
      'importar.ya_vinculado': 'Bu klasör zaten bir WolfCore Dev sitesidir.',
      'importar.dominio_existe':
        '{dominio} alan adına sahip bir site zaten var: içe aktarmadan önce değiştirin.',
      'importar.sin_php':
        'Bu site PHP gerektiriyor ancak yüklü sürüm yok: Hizmetler bölümünden yükleyin.',
      'importar.base_existe':
        '{nombre} veritabanı hedefte zaten var ve dokunulmadı. İçe aktarmak için değiştirmeyi onaylayın (önce yedek alınır).',
      'importar.base_fallo':
        '{nombre} veritabanı içe aktarılamadı: olduğu gibi bırakıldı, hiçbir şey yarım kalmadı.',
      'importar.sitio_fallo': 'Site oluşturulamadı.',
      'importar.origen_invalido':
        'Kaynak sunucu bilgileri geçerli değil (kullanıcı, parola veya bağlantı noktası).',
      'importar.sin_seleccion': 'İçe aktarmak için en az bir site seçin.',
      'importar.en_curso': 'Zaten bir içe aktarma sürüyor: bitmesini bekleyin.',
      'importar.cancelado': 'İçe aktarma iptal edildi: aktarılmakta olanlar olduğu gibi bırakıldı.',
      'importar.origen_estancado':
        'Döküm sırasında diğer programın sunucusu yanıt vermeyi bıraktı: veritabanı içe aktarılmadı.',
      'importar.sin_espacio':
        'Veritabanını içe aktarmak için yeterli boş alan yok: yaklaşık {necesarios} MB gerekli, {libres} MB boş.',
      'importar.origen_fallo': 'Diğer programın veritabanı dökümü alınamadı.',
      'importar.clave_no_ascii':
        'Parola döküme aktarılamayan aksan veya simgeler içeriyor: yalnızca ASCII karakterli bir parola kullanın.',
      'plantillas.sin_esquema': 'Şablon bir veritabanı şeması içermiyor.',
      'proyectos.carpeta_invalida': 'Proje klasörü geçerli değil.',
      'proyectos.nombre_invalido':
        'Proje adı yalnızca küçük harf, rakam ve tire içerebilir (en fazla 40).',
      'proyectos.argumento_invalido': 'Bir proje değeri geçersiz (alan: {campo}).',
      'proyectos.base_existe': '{nombre} veritabanı zaten var: başka bir ad seçin.',
      'proyectos.dominio_existe': '{dominio} alan adına sahip bir site zaten var.',
      'proyectos.carpeta_de_otro_sitio':
        'Bu klasör {dominio} projesine ait veya onun içinde: başka bir tane seçin.',
      'proyectos.sin_python': 'Yüklü Python yok: Hizmetler bölümünden yükleyin.',
      'proyectos.venv_ajeno':
        'Proje kendi .venv klasörünü içeriyor ve WolfCore Dev yabancı bir depodaki Python’ı çalıştırmaz: silin ve ortamı yeniden oluşturun.',
      'proyectos.paso_base_no_omitible':
        'Yeni bir projede "Veritabanı oluştur" adımı atlanamaz.',
      'proyectos.sin_php': 'Yüklü PHP yok: Hizmetler bölümünden yükleyin.',
      'proyectos.php_no_instalado': 'PHP {version} yüklü değil: Hizmetler bölümünden yükleyin.',
      'proyectos.python_no_instalado':
        'Python {version} yüklü değil: Hizmetler bölümünden yükleyin.',
      'mcp.token_invalido': 'MCP sunucu belirteci geçerli değil.',
      'mcp.solicitud_cancelada': 'MCP istemcisi isteği iptal etti: işlem çalıştırılmadı.',
      'doctor.puerto_ocupado': '{servicio} için {puerto} bağlantı noktasını başka bir program ({proceso}) kullanıyor.',
      'doctor.puerto_iis': 'IIS ({programa}), {servicio} için {puerto} bağlantı noktasını kullanıyor.',
      'doctor.puerto_http_sys':
        'Bir Windows hizmeti ({programa}), {servicio} için {puerto} bağlantı noktasını kullanıyor.',
      'doctor.puerto_flyenv':
        '{programa}, {servicio} için {puerto} bağlantı noktasını kullanıyor. Kapatın veya WolfCore Dev bağlantı noktasını değiştirin.',
      'doctor.puerto_xampp': '{programa}, {servicio} için {puerto} bağlantı noktasını kullanıyor.',
      'doctor.puerto_skype': '{programa}, {servicio} için {puerto} bağlantı noktasını kullanıyor.',
      'doctor.puerto_reservado':
        '{servicio} için {puerto} bağlantı noktası Windows tarafından ayrılmış bir aralıkta ({desde}-{hasta}: Hyper-V, WSL veya Docker).',
      'doctor.ca_por_vencer': 'WolfCore Dev sertifika otoritesinin süresi {dias} gün içinde dolacak.',
      'doctor.ca_vencida': 'WolfCore Dev sertifika otoritesinin süresi doldu.',
      'doctor.certificado_por_vencer': '{dominio} sertifikasının süresi {dias} gün içinde dolacak.',
      'doctor.certificado_vencido': '{dominio} sertifikasının süresi doldu.',
      'doctor.hosts_ilegible': 'hosts dosyası okunamadı.',
      'doctor.hosts_utf16':
        'hosts dosyası UTF-16 olarak kaydedilmiş: Windows girdilerini okumayabilir.',
      'doctor.hosts_bloque_duplicado':
        'hosts dosyasında {bloques} adet WolfCore Dev bloğu var; yalnızca bir tane olmalıdır.',
      'doctor.hosts_bloque_sin_cierre':
        'hosts dosyasındaki bir WolfCore Dev bloğunun kapanış işareti eksik.',
      'doctor.hosts_dominios_faltantes':
        'hosts dosyasında sitelerinizden {cantidad} alan adı eksik.',
      'doctor.hosts_solo_lectura':
        'hosts dosyası salt okunur (genellikle bir antivirüs ayarlar). WolfCore Dev yine de yönetici izniyle yazabilir.',
      'doctor.path_duplicados':
        'Kullanıcı PATH değerinde {cantidad} adet yinelenen WolfCore Dev girdisi var.',
      'doctor.path_ajeno_delante':
        '{programa} içeren başka bir klasör ({origen}) PATH içinde WolfCore Dev’den önce geliyor: terminaller onu kullanacaktır.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) eksik: PHP ve diğer hizmetler onsuz başlamaz.',
      'doctor.enlazador_msvc_ausente':
        'Rust yüklü ancak Visual Studio Build Tools C++ araçları (MSVC bağlayıcı) eksik: cargo programları bağlayamaz.',
      'doctor.antivirus_sin_exclusion':
        'Antivirüs, WolfCore Dev veri klasörünü tarıyor: PHP ve hizmetler yavaş başlayabilir.',
      'doctor.firewall_reglas':
        'Windows, {perfiles} profillerinde WolfCore Dev programları (nginx, PHP veya veritabanları) için {cantidad} gelen ağ kuralına izin veriyor: bu programlar ağa açık durumda.',
      'doctor.firewall_no_comprobado':
        'Windows güvenlik duvarı kontrol edilemedi (yönetici hakları gerekebilir).',
      'doctor.firewall_reglas_ajenas':
        '{perfiles} profillerinde başka programlara (FlyEnv, Laragon, XAMPP vb.) ait nginx, PHP veya veritabanı için {cantidad} gelen kural var. WolfCore Dev’e ait değiller: yalnızca gösterilir, buradan asla kaldırılmazlar.',
      'doctor.servicio_en_error': '{servicio} hata durumunda.',
      'doctor.revision_fallida': '{revision} denetimi tamamlanamadı.',
      'doctor.confirmacion_requerida': 'Uygulamadan önce onarımı onaylayın.',
      'doctor.hallazgo_desconocido': 'Bu bulgu artık yok: yeniden denetleyin.',
      'doctor.solo_informa':
        'Bu bulgunun otomatik onarımı yok: yönergeleri izleyin.',
      'doctor.reparacion_fallida': 'Onarım uygulanamadı.',
      'doctor.reparacion_cancelada': 'Yönetici izni iptal edildi: hiçbir şey değiştirilmedi.',
      'doctor.reparacion_denegada': 'Windows veya antivirüs erişimi reddetti: hiçbir şey değiştirilmedi.',
      'doctor.ya_resuelto': 'Sorun zaten giderilmiş: değişiklik gerekmedi.',
      'doctor.ca_vieja_sin_quitar':
        'Yeni sertifika otoritesi kullanımda ancak eskisi Windows deposundan kaldırılamadı. HTTPS bölümünden kaldırabilirsiniz.',
      'doctor.sin_puerto_libre': 'Hizmeti taşımak için boş bağlantı noktası bulunamadı.',
      'doctor.ca_vuelta_atras_incompleta':
        'Yeni otorite uygulanamadı ve geri alma yarım kaldı. HTTPS bölümünü kontrol edin; etc/respaldos içinde tarihli bir kopya var.',
      'doctor.firefox_sin_confianza':
        'Firefox {cantidad} profilde WolfCore Dev otoritesine güvenmiyor (kendi deposunu kullanır).',
      'confianza.sin_ca': 'Henüz sertifika otoritesi yok: HTTPS bölümünden oluşturun.',
      'confianza.sin_raices':
        'Python için güvenilen kök sertifika bulunamadı (ne certifi ne de Windows): hiçbir şey değiştirilmedi.',
      'confianza.node_variable_ajena':
        'Zaten kendi NODE_EXTRA_CA_CERTS değişkeniniz var: WolfCore Dev üzerine yazmaz.',
      'confianza.variable_fallida': 'Kullanıcı değişkeni değiştirilemedi.',
      'firefox.abierto': 'Firefox açık: kapatıp tekrar deneyin.',
      'firefox.error': 'Bu profilin user.js dosyası değiştirilemedi; olduğu gibi bırakıldı.',
      'firefox.fuera':
        'Firefox klasörü dışında profiller var: bunları CA güveni bölümünden ayrı onayla etkinleştirin.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS artık WolfCore Dev otoritesine işaret etmiyor (elle değiştirilmiş): silinmedi.',
      'ia.clave_invalida': 'Sağlayıcı anahtarı reddetti: kontrol edin veya yeni bir anahtar oluşturun.',
      'ia.sin_saldo': 'Sağlayıcı hesabında bakiye veya kota kalmadı.',
      'ia.limite': 'Sağlayıcı istekleri sınırladı: bir süre bekleyip tekrar deneyin.',
      'ia.region': 'Sağlayıcı ülkenizde veya bölgenizde hizmet vermiyor.',
      'ia.sin_red': 'Sağlayıcıya bağlanılamadı: ağı veya temel URL’yi kontrol edin.',
      'ia.url_invalida':
        'Temel URL geçersiz: kullanıcı adı veya parola olmadan https:// (ya da yalnızca 127.0.0.1 / [::1] için http://) kullanın.',
      'ia.plazo': 'Sağlayıcı {segundos} sn içinde yanıt vermedi.',
      'ia.respuesta_rara': 'Sağlayıcı beklenmeyen bir yanıt döndürdü.',
      'ia.cancelado': 'Sağlayıcıya yapılan istek iptal edildi.',
      'ia.sin_clave': 'Bu sağlayıcı bir anahtar gerektirir: önce kaydedin.',
      'ia.clave_mal_formada':
        'Anahtar biçimi geçersiz (boşluk veya satır sonu olmamalı).',
      'ia.modelo_invalido': 'Model adı geçerli değil.',
      'ia.modelo_no_disponible': 'Model mevcut değil veya hesabınızın erişimi yok.',
      'ia.proveedor_invalido': 'Sağlayıcı ayarları geçerli değil.',
      'ia.env_conflicto':
        '.env dosyası {claves} değerini zaten başka bir değerle tanımlıyor: değiştirmek istediğinizi onaylayın.',
      'ia.env_sin_confirmar':
        'Anahtarı .env dosyasına yazmak istediğinizi onaylayın (düz metin olarak kalır).',
      'ia.env_versionado':
        'Git bu projenin .env dosyasını zaten izliyor: .gitignore içinde olsa bile sonraki commit anahtarı yükler. git rm --cached .env ile dizinden çıkarın.',
      'ia.env_versionado_desconocido':
        'Git’in bu projenin .env dosyasını izleyip izlemediği kontrol edilemedi: anahtarı yazmak için ayrıca onaylayın.',
      'ia.proveedor_no_existe': 'Yapay zekâ sağlayıcısı artık mevcut değil.',
      'ia.url_cambia_con_clave':
        'Sağlayıcının kayıtlı bir anahtarı var: yeni URL’ye göndermek istediğinizi onaylayın.',
      'ia.mensaje_sin_confirmar':
        'Test mesajının gönderimini onaylayın (hesabınızdan belirteç harcar).',
      'ia.clave_ilegible':
        'Sağlayıcının kayıtlı anahtarı okunamadı: silip yeniden kaydedin.',
      'ia.argumento_invalido': 'Geçersiz veri ({campo}).',
      'correo.auth': 'Sağlayıcı kullanıcı adını veya parolayı reddetti.',
      'correo.conexion': 'SMTP sunucusuna bağlanılamadı: sunucu ve bağlantı noktasını kontrol edin.',
      'correo.tls':
        'Sunucuyla geçerli bir şifreli bağlantı kurulamadı (sertifika, ad veya STARTTLS). Hiçbir şey gönderilmedi.',
      'correo.rechazado':
        'Sunucu iletiyi veya bir adresi reddetti. Göndereni kontrol edin: birçok sağlayıcı yalnızca doğrulanmış gönderen veya alan adını kabul eder.',
      'correo.plazo': 'Sunucu zamanında yanıt vermedi (20 sn).',
      'correo.host_invalido':
        'SMTP sunucusu şema, bağlantı noktası veya yol olmadan bir ana bilgisayar adı ya da IP olmalıdır.',
      'correo.host_local':
        'Bu sunucu bu bilgisayara veya yerel ağa işaret ediyor: kullanmak için onaylayın.',
      'correo.destinatario_invalido': 'Hedef adres geçerli değil.',
      'correo.proveedor_invalido': 'Sağlayıcı verileri geçerli değil.',
      'correo.proveedor_no_existe': 'E-posta sağlayıcısı artık mevcut değil.',
      'correo.sin_clave': 'Sağlayıcının kayıtlı bir anahtarı yok.',
      'correo.clave_ilegible':
        'Sağlayıcının kayıtlı anahtarı okunamadı: silip yeniden kaydedin.',
      'correo.cambia_con_clave':
        'Sağlayıcının kayıtlı bir anahtarı var: yeni sunucuya göndermek istediğinizi onaylayın.',
      'correo.env_sin_confirmar':
        'E-posta değişkenlerini .env dosyasına yazmak istediğinizi onaylayın.',
      'correo.ocupado': 'Zaten devam eden bir gönderim testi var.',
      'correo.limite': 'Yeni bir gönderim testinden önce {segundos} sn bekleyin.',
      'correo.clave_mal_formada':
        'Anahtar biçimi geçersiz: yalnızca yazdırılabilir karakterler, satır sonu yok ve en fazla 4096 karakter.',
      'correo.argumento_invalido': 'Geçersiz veri ({campo}).',
      'agentes.no_existe': 'Bu ajan desteklenmiyor.',
      'agentes.sin_confirmar': 'Devam etmeden önce penceredeki işlemi onaylayın.',
      'agentes.no_instalable':
        'Bu ajan WolfCore Dev içinden yüklenmez: resmi kılavuzu izleyin ({guia}).',
      'agentes.sin_node': 'Ajanı yükleyebilmek için Hizmetler bölümünden Node yükleyin.',
      'agentes.node_antiguo':
        '{agente} için Node {requerida} veya üzeri gerekir; şu an kullanılan {actual}. Hizmetler bölümünden daha yeni bir Node yükleyin.',
      'agentes.node_version_desconocida':
        'Node sürümü belirlenemedi ve {agente} için Node {requerida} veya üzeri gerekir. Hizmetler bölümünden Node’u kontrol edin.',
      'instalador.zip_demasiado_grande':
        'İndirilen paket çok büyük veya çok fazla dosya içeriyor: yüklenmedi.',
      'rust.rustup_init_fallo': 'rustup-init düzgün sonlanmadı (kod {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Rust {version} yüklenemedi (kod {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} kaldırılamadı: {detalle}',
      'rust.descarga_fallo': 'rustup indirilemedi (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Ajan yüklenemedi: {detalle}',
      'agentes.no_instalado': '{agente} yüklü değil.',
      'agentes.mcp_no_soportado':
        '{agente}, bir ortam değişkeninden belirteç okumayı belgelemiyor: MCP kaydedilmez.',
      'agentes.config_ilegible':
        '{archivo} ayrıştırılamadı; değiştirilmedi. Elle kontrol edin.',
      'agentes.config_en_uso':
        'WolfCore Dev düzenlerken {archivo} değişti: ajanı kapatıp tekrar deneyin. Değiştirilmedi.',
      'agentes.proveedor_incompatible': '{agente} bu yapay zekâ sağlayıcısını kullanamaz.',
      'agentes.sin_cambios_preparados': 'Açıklanacak hazırlanmış değişiklik (git add) yok.',
      'agentes.argumento_invalido': 'Geçersiz veri ({campo}).',
      'git.commit_fallo': 'Commit yapılamadı: {detalle}',
      'git.mensaje_invalido': 'Commit mesajı boş veya geçersiz.',
      'php.rama_no_instalada': 'PHP {rama} yüklü değil.',
      'php.argumento_invalido': 'Geçersiz veri ({campo}).',
      'php.valor_invalido': '{clave} değeri geçerli değil.',
      'php.ini_invalido': 'PHP bu php.ini ile başlamıyor; hiçbir şey kaydedilmedi. Çıktı: {salida}',
      'php.no_arranco':
        'PHP {rama} bu değişiklikle yeniden başlamadı; önceki hâli geri yüklendi ve eskisi gibi yanıt veriyor.',
      'php.caido_tras_restaurar':
        'PHP {rama} yeniden başlamadı; önceki hâli geri yüklendi ancak hâlâ yanıt vermiyor. Hizmetler ve PHP kayıtlarını kontrol edin.',
      'php.respaldo_no_existe': 'Bu php.ini yedeği mevcut değil.',
      'php.extension_no_existe': '{nombre} uzantısı bu sürümün ext klasöründe yok.',
      'php.extension_no_catalogo':
        '{nombre} uzantısı bu sürümün kataloğunda yok.',
      'php.variante_desconocida': 'Bu PHP’nin derleme türü belirlenemedi.',
      'php.sin_variante': 'Katalogda {variante} derlemesi için {nombre} yok.',
      'php.huella_distinta': 'İndirme yayınlanan özetle eşleşmiyor; hiçbir şey yüklenmedi.',
      'php.descarga_fallida': 'Uzantı indirilemedi: {detalle}',
      'php.extension_en_uso':
        '{nombre} DLL dosyası kullanımda. PHP {rama} hizmetini durdurup tekrar deneyin.',
      'php.extension_sin_dll':
        '{nombre} DLL dosyası değiştirilemedi ve PHP {rama} ext klasörü onsuz kaldı. PHP {rama} hizmetini durdurup tekrar deneyin: önceki dosya başlarken geri gelir.',
      'php.sitio_sin_php': 'Bu site PHP kullanmıyor.',
      'php.sitio_no_arranco':
        '{sitio} sitesinin özel PHP’si değişiklikle yanıt vermedi; önceki hâline dönüldü.',
      'php.sin_puertos_sitio': 'Sitelerin özel PHP’leri için boş bağlantı noktası kalmadı.',
      'xdebug.launch_invalido':
        'Projenin .vscode/launch.json dosyası ayrıştırılamıyor; hiçbir şey değiştirilmedi.',
      'xdebug.launch_no_seguro':
        '.vscode klasörü veya launch.json dosyası bir bağlantı ya da başka bir tür: buraya yazılmaz.',
      'xdebug.sin_configurar': 'launch.json oluşturmadan önce sitede Xdebug yapılandırın.',
      'nginx.sitio_no_existe': 'Bu site artık mevcut değil.',
      'nginx.texto_invalido':
        'vhost metni çok uzun, boş veya denetim karakterleri içeriyor.',
      'nginx.sintaxis': 'Satır {linea}: {detalle}. Hiçbir şey değiştirilmedi.',
      'nginx.directiva_prohibida':
        'Satır {linea}: «{directiva}» bir site vhost dosyasında yasaktır (diğer siteleri veya proje dışı dosyaları etkileyebilir). Hiçbir şey değiştirilmedi.',
      'nginx.ruta_fuera':
        'Satır {linea}: «{directiva}» proje klasörünün veya kayıt ve sertifikalarının dışına işaret ediyor. Hiçbir şey değiştirilmedi.',
      'nginx.fuera_de_server':
        'Satır {linea}: tam vhost yalnızca «server» blokları içerebilir; «{directiva}» dışarıda kalıyor. Hiçbir şey değiştirilmedi.',
      'nginx.dominio_ajeno':
        'Satır {linea}: «{nombre}» bu sitenin alan adı değil. Önce siteye takma ad olarak ekleyin.',
      'nginx.puerto_ajeno':
        'Satır {linea}: site yalnızca Ayarlar’da yapılandırılan Nginx bağlantı noktalarını dinleyebilir.',
      'nginx.version_no_existe': 'Bu vhost sürümü artık geçmişte yok.',
      'nginx.argumento_invalido': 'Geçersiz argüman: {campo}',
      'nginx.destino_interno':
        'Satır {linea}: «{directiva}» WolfCore Dev’in dahili bir hizmetine (Adminer, Mailpit, veritabanları, diğer sitelerin PHP’si…) işaret ediyor ve bunu ağa ve tünellere açar. Hiçbir şey değiştirilmedi.',
      'nginx.caido_tras_restaurar':
        'Nginx yanıt vermiyor: önceki vhost geri yüklendi ancak hâlâ yanıt vermiyor. Hizmetler ve Nginx kaydını kontrol edin. {salida}',
      'depuracion.puerto_ocupado':
        '{puerto} bağlantı noktası zaten kullanımda: dump yakalama dinleyemiyor. Kullanan programı kapatın (ör. Symfony server:dump).',
      'depuracion.no_iniciado': 'Dump yakalama kapalı.',
      'depuracion.tipo_no_soportado': 'Dump yakalama PHP ve FastAPI siteleri içindir.',
      'depuracion.confirmacion': 'Pencereden dump yakalamayı onaylayın.',
      'depuracion.argumento_invalido': 'Geçersiz argüman: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Bu dosya sitenin klasörü içinde değil: düzenleyicide açılmaz.',
      'contenedores.motor_invalido': 'Bilinmeyen konteyner motoru.',
      'contenedores.id_invalido': 'Konteyner kimliği geçerli değil.',
      'contenedores.argumento_invalido': 'Geçersiz argüman: {campo}',
      'contenedores.sin_motor': '{motor} bu bilgisayarda yüklü değil.',
      'contenedores.no_responde':
        '{motor} yanıt vermiyor. Docker Desktop uygulamasını açın veya Podman makinesini başlatıp tekrar deneyin.',
      'contenedores.remoto':
        '{motor} varsayılan bağlantısı başka bir bilgisayara işaret ediyor: WolfCore Dev yalnızca yerel motorları kullanır.',
      'contenedores.no_existe': 'Konteyner artık mevcut değil. Listeyi yenileyin.',
      'contenedores.accion_fallo': 'Motor bunu yapamadı: {detalle}',
      'contenedores.demasiados_registros':
        'Aynı anda en fazla {maximo} konteyner kaydı izlenebilir.',
      'contenedores.sin_confirmar': 'Penceredeki işlemi onaylayın.',
      'catalogo.indice_invalido':
        '{servicio} sürüm dizini doğrulamadan geçemedi; kayıtlı liste kullanılıyor.',
      'catalogo.sin_huella':
        '{servicio} {version} için yayınlanmış özet yok: pencereden yüklemeyi onaylayın.',
      'catalogo.huella_debil':
        '{servicio} {version} yalnızca zayıf bir özete sahip (MD5 veya SHA-1): pencereden yüklemeyi onaylayın.',
      'catalogo.huella_no_coincide': 'İndirme yayınlanan özetle eşleşmiyor.',
      'catalogo.redireccion_ajena': 'İndirme izin verilmeyen bir siteye ({host}) yönlendirmeyi denedi.',
      'catalogo.demasiadas_redirecciones':
        'İndirme çok fazla yönlendirme yaptı ({maximo} sınırını aştı).',
      'catalogo.respuesta_grande': 'Sunucu yanıtı çok büyük.',
      'catalogo.version_no_encontrada':
        '{servicio} için {version} sürümü katalogda yok.',
      'catalogo.huella_no_disponible':
        '{servicio} {version} özeti alınamadı (bağlantı yok veya kaynak yanıt vermedi). Tekrar deneyin.',
      'catalogo.firma_invalida':
        '{servicio} {version} PGP imzası geçersiz veya yayınlanmamış: hiçbir şey yüklenmedi.',
      'catalogo.firma_no_soportada':
        '{servicio} {version} PGP imzası WolfCore Dev’in doğrulamadığı bir biçim kullanıyor: hiçbir şey yüklenmedi.',
      'catalogo.clave_desconocida':
        '{servicio} {version} imzası uygulamanın sabit anahtarlarında bulunmayan bir anahtara ait: hiçbir şey yüklenmedi.',
      'catalogo.firma_vencida':
        '{servicio} {version} imzasının veya anahtarının süresi dolmuş: hiçbir şey yüklenmedi. Güncel anahtarlar için WolfCore Dev’i güncelleyin.',
      'catalogo.reloj_atrasado':
        '{servicio} {version} imzası ileri bir tarih taşıyor: bilgisayarınızın tarih ve saatini kontrol edip tekrar deneyin.',
      'acceso_bd.datos_invalidos': 'Veritabanı erişim bilgileri geçerli değil.',
      'acceso_bd.sin_base': 'Bu projenin .env dosyası bir veritabanına işaret etmiyor.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin yalnızca MySQL ve MariaDB veritabanlarını açar; PostgreSQL için Adminer kullanın.',
      'acceso_bd.servidor_no_resuelto':
        'Bu projenin veritabanı yerel bir WolfCore Dev sunucusuna ait değil.',
      'acceso_bd.no_listo':
        'Araç hazır değil: Hizmetler bölümünden yükleyin ve PHP’yi başlatın.',
      'auditoria.tabla_invalida': 'Tablo bu veritabanında mevcut değil.',
      'auditoria.columna_invalida':
        'Sütun bu tabloda mevcut değil (kullanıcı ve hash sütunları farklı olmalıdır).',
      'auditoria.usuario_no_encontrado': 'Bu kullanıcı adıyla hiçbir hesap yok.',
      'auditoria.usuario_repetido':
        'Bu kullanıcı adıyla birden fazla hesap var: yanlış hesaba dokunmamak için sıfırlanmaz.',
      'auditoria.formato_no_soportado':
        'Geçerli hash biçimi yeniden üretilemiyor: sıfırlanmaz.',
      'auditoria.clave_larga':
        'bcrypt parolanın yalnızca ilk 72 baytını kullanır: daha kısa bir parola seçin.',
      'auditoria.clave_invalida': 'Yeni parola geçerli değil.',
      'auditoria.sin_confirmar': 'Bu parolayı sıfırlamak istediğinizi onaylayın.',
      'auditoria.respaldo_previo_fallo':
        'Sıfırlamadan önce veritabanı yedeği kaydedilemedi: hiçbir şey değiştirilmedi.',
      'auditoria.copia_fallo': 'Satır kopyası kaydedilemedi: hiçbir şey değiştirilmedi.',
      'auditoria.motor_no_soportado':
        'Parola denetimi MySQL, MariaDB ve PostgreSQL içindir.',
      'auditoria.cancelada': 'Denetim iptal edildi.',
      'auditoria.usuario_invalido': 'Kullanıcı adı 1 ile 256 karakter arasında olmalıdır.',
      'auditoria.en_curso': 'Zaten bir denetim sürüyor: bitmesini bekleyin veya iptal edin.',
      'auditoria.base_sistema': 'Sistem veritabanı denetlenmez: bir proje veritabanı seçin.',
      'auditoria.esquema_invalido': 'Şema bu veritabanında mevcut değil.',
      'auditoria.fila_cambio':
        'Hesap bu sırada değişti: sıfırlanmadı. Tekrar deneyin.',
      'auditoria.verificacion_fallo':
        'Veritabanı parolayı beklendiği gibi kaydetmedi: değişiklik geri alındı.',
      'auditoria.columna_corta':
        'Hash sütunu {largo} karakter alıyor ancak yeni hash {necesario} gerektiriyor: hiçbir şey değiştirilmedi. Sütunu genişletin.',
      'auditoria.datos_reales_sin_confirmar':
        'Bu veritabanında gerçek müşteri verileri var: parola sıfırlamak güçlendirilmiş onay gerektirir.',
      'instantaneas.id_invalido': 'Anlık görüntü geçerli değil.',
      'instantaneas.no_encontrada': 'Anlık görüntü bulunamadı; silinmiş olabilir.',
      'instantaneas.otra_base': 'Bu anlık görüntü başka bir veritabanına ait: buraya uygulanamaz.',
      'instantaneas.sin_confirmar': 'Bu anlık görüntüye dönmek istediğinizi onaylayın.',
      'instantaneas.motor_no_soportado': 'Anlık görüntüler MySQL, MariaDB ve PostgreSQL içindir.',
      'instantaneas.demasiado_grande':
        'Veritabanı bir anlık görüntünün desteklediği {maximo} MB sınırından büyük.',
      'instantaneas.sin_espacio':
        'Anlık görüntü için yeterli boş alan yok: {necesarios} MB gerekli, {libres} MB boş.',
      'instantaneas.limite':
        'Bu veritabanı için zaten {maximo} anlık görüntü var: yenisini almak için birini silin.',
      'instantaneas.tomar_fallo': 'Anlık görüntü alınamadı. Veritabanına dokunulmadı.',
      'instantaneas.huella_no_coincide':
        'Anlık görüntü dosyası değişmiş veya bozulmuş: hiçbir şey geri yüklenmedi.',
      'instantaneas.respaldo_previo_fallo':
        'Veritabanının mevcut durumu kaydedilemedi: hiçbir şey geri yüklenmedi.',
      'instantaneas.restauracion_fallo':
        'Anlık görüntü geri yüklenemedi. Veritabanı önceki durumuna döndürüldü. Neden: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Anlık görüntü geri yüklenemedi ve önceki durum kaydedilmemişti: veritabanı boş veya yarım kalmış olabilir. Neden: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Anlık görüntü geri yüklenemedi ve önceki duruma da dönülemedi. Önceki durum {respaldo} otomatik anlık görüntüsünde kayıtlı: Anlık görüntüler bölümünden ona dönün.',
    },
  },
  instantaneas: {
    abrir: 'Anlık görüntüler',
    titulo: (base: string) => `${base} anlık görüntüleri`,
    ayuda:
      'Anlık görüntü veritabanını şu anki hâliyle saklar. İstediğiniz zaman ona dönebilirsiniz: dönmeden önce mevcut durumun otomatik anlık görüntüsü alınır.',
    ubicacion:
      'WolfCore Dev veri klasöründe yalnızca kullanıcınızca okunabilir biçimde saklanır. Hizmetlere ve verilerine dokunulmaz.',
    notaEtiqueta: 'Not (isteğe bağlı)',
    notaMarcador: 'Örneğin: geçiş öncesi',
    tomar: 'Anlık görüntü al',
    tomada: 'Anlık görüntü kaydedildi',
    cargando: 'Anlık görüntüler okunuyor…',
    vacio: 'Bu veritabanı için henüz anlık görüntü yok.',
    automatica: 'Otomatik',
    sinNota: 'Not yok',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} tablo · ${tamano}`,
    volver: 'Bu anlık görüntüye dön',
    borrar: 'Sil',
    borrada: 'Anlık görüntü çöp kutusuna taşındı',
    papelera:
      'Silinen anlık görüntüler WolfCore Dev çöp kutusundan 7 gün boyunca kurtarılabilir.',
    cerrar: 'Kapat',
    papeleraTitulo: 'Çöp kutusu',
    papeleraVacia: 'Çöp kutusunda anlık görüntü yok.',
    recuperar: 'Kurtar',
    recuperada: 'Anlık görüntü kurtarıldı',
    borradaEl: (fecha: string) => `${fecha} tarihinde silindi`,
    borrarPregunta: 'Bu anlık görüntü çöp kutusuna taşınsın mı?',
    borrarSi: 'Çöp kutusuna taşı',
    notaAutomatica: (fecha: string) =>
      `${fecha} tarihli anlık görüntüye dönmeden önce kaydedilen önceki durum`,
    notaAutomaticaSinOrigen: 'Başka bir anlık görüntüye dönmeden önce kaydedilen önceki durum',
    extensionesAviso: (lista: string) =>
      `Yalnızca bu bilgisayarın özet kaydıyla geri yüklenebilen PostgreSQL uzantıları içeriyor (${lista}).`,
    limites:
      'MySQL ve MariaDB’de yordamlar, tetikleyiciler ve olaylar da saklanır. PostgreSQL’de tek veritabanının sıkıştırılmış dökümüdür: sunucu rollerini veya kullanıcılarını içermez. Bu bilgisayara ait olduğu doğrulanamayan anlık görüntüler sınırlı kullanıcıyla geri yüklenir.',
    basesBorradas: 'Artık mevcut olmayan veritabanlarının anlık görüntüleri',
    basesBorradasAyuda: 'Anlık görüntüsünden yeniden oluşturmak için bir veritabanı seçin.',
    dialogoVolver: {
      titulo: (base: string) => `${base} anlık görüntüsüne dön`,
      cargando: 'Önizleme hazırlanıyor…',
      base: 'Veritabanı',
      instantanea: 'Anlık görüntü',
      ahora: 'Şimdi',
      tamano: 'Boyut',
      tablas: 'Tablolar',
      nota: 'Not',
      aviso: (base: string) =>
        `${base} veritabanı bu anlık görüntüyle tamamen değiştirilecektir: o zamandan beri yapılan değişiklikler kaybolur. Öncesinde mevcut durumun otomatik anlık görüntüsü alınır; bir hata olursa veritabanı kendiliğinden o duruma döner.`,
      pedir: (base: string) => `Onaylamak için ${base} yazın`,
      confirmar: 'Bu anlık görüntüye dön',
      trabajando: (base: string) => `${base} geri yükleniyor… Bitene kadar programı kapatmayın.`,
      hecho: (base: string) => `${base} veritabanı anlık görüntüye döndürüldü`,
      respaldoPrevio: 'Önceki durum şu tarihli otomatik anlık görüntüye kaydedildi:',
      advertencias: 'Geri yükleme uyarılarla tamamlandı:',
      hechoConAvisos: (base: string) => `${base} veritabanı uyarılarla anlık görüntüye döndürüldü`,
      baseVacia: 'Veritabanı mevcut değil veya boş: dönmeden önce kaydedilecek bir şey yok.',
      sinGuardarTitulo: 'Mevcut durum kaydedilemedi',
      sinGuardarTexto:
        'WolfCore Dev dönmeden önce veritabanının mevcut durumunu kaydedemedi. Kaydetmeden devam ederseniz ve geri yükleme başarısız olursa mevcut veriler kaybolur.',
      sinGuardarConfirmar: 'Mevcut veritabanı verilerinin kaybolacağını anlıyorum',
      sinGuardarBoton: 'Mevcut durumu kaydetmeden dön',
    },
  },
  avisoInicio: {
    titulo: 'WolfCore Dev bildirimi',
  },
  tareas: {
    titulo: 'Zamanlanmış görevler',
    resumen: (n: number) => (n === 0 ? 'Görev yok' : `${n} görev`),
    mostrar: 'Görevleri göster',
    ocultar: 'Gizle',
    cargando: 'Görevler yükleniyor',
    errorCargar: 'Görevler yüklenemedi',
    soloAbierta:
      'Görevler yalnızca WolfCore Dev açıkken çalışır. Windows Görev Zamanlayıcısı kullanılmaz: uygulama kapalıyken veya bilgisayar uykudayken çalışmaz ve kaçırılan çalıştırmalar telafi edilmez.',
    repoEjecuta:
      'Güvenilir bir projede depo içindeki dosyalar olduğu gibi çalıştırılır: görevin belirttiği dosya, `artisan`, `package.json` betikleri, `.venv`… `git pull` ile değişirlerse görev yeni sürümü çalıştırır.',
    vacio:
      'Bu projede zamanlanmış görev yok. Bir tane oluşturun (ör. bir Laravel projesinde her dakika «php artisan schedule:run»).',
    nueva: 'Yeni görev',
    pausada: 'duraklatıldı',
    enCurso: 'Çalışıyor…',
    nunca: 'Henüz çalıştırılmadı',
    ultima: (f: string) => `Son: ${f}`,
    proxima: (f: string) => `sonraki: ${f}`,
    codigo: (n: number) => `kod ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'burada yazıldı', 'wolfcore.yml': 'wolfcore.yml dosyasından' },
    describir: {
      cadaMinuto: 'Her dakika',
      cadaN: (n: number) => `Her ${n} dakikada bir`,
      cadaHora: 'Her saat başında',
      diaria: (h: string) => `Her gün ${h} saatinde`,
      laborables: (h: string) => `Pazartesi–Cuma ${h} saatinde`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Başarılı',
      fallo: 'Başarısız',
      tiempo: 'Süre sınırı aşıldı',
      cancelada: 'İptal edildi',
      omitida: 'Atlandı',
      bloqueada: 'Çalıştırılmadı',
    },
    motivo: {
      aislado:
        'Bu bir test veri klasörüdür (WOLFCORE_DATOS): bu oturumda görevlere izin vermeden çalışmaz.',
      no_confiado:
        'Proje güvenilir olarak işaretlenmemiş: çalışması için «Bu depoya güveniyorum» seçeneğini işaretleyin.',
      receta_cambio:
        'Proje reçetesi güvendiğinizden beri değişti: inceleyip «Bu depoya güveniyorum» seçeneğini yeniden işaretleyin.',
      sin_confirmar: 'Komutu henüz onaylanmadı: inceleyip onaylayana kadar çalışmaz.',
      comando_invalido: 'Komutuna izin verilmiyor (yalnızca php, node, npm run ve python).',
      cron_invalida: 'Zamanlaması geçerli bir cron ifadesi değil.',
      carpeta: 'Proje klasörü mevcut değil.',
      solapada: 'Önceki çalıştırma hâlâ sürüyordu: bu atlandı.',
      retraso: 'Geç kaldı (uygulama askıdaydı): telafi edilmez.',
      error: 'Program çalıştırılamadı.',
    },
    acciones: {
      ejecutar: 'Şimdi çalıştır',
      editar: 'Düzenle',
      borrar: 'Sil',
      verRegistro: 'Kaydı gör',
      revisarConfirmar: 'İncele ve onayla',
      activar: (n: string) => `${n} görevini etkinleştir`,
    },
    borrar: {
      titulo: (n: string) => `«${n}» silinsin mi?`,
      texto:
        'Görev ve geçmişi kaldırılır. Daha önce yaptıkları geri alınmaz ve proje dosyalarına dokunulmaz.',
      confirmar: 'Sil',
      hecho: (n: string) => `«${n}» görevi silindi.`,
    },
    aislado: {
      titulo: 'Test veri klasörü.',
      texto:
        'WOLFCORE_DATOS ile hiçbir görev kendiliğinden çalışmaz. Yalnızca bu oturumda test etmek istiyorsanız izin verin.',
      permitir: 'Bu oturumda izin ver',
      confirmarTitulo: 'Bu test klasöründe görevlere izin verilsin mi?',
      confirmarTexto:
        'Güvenilir projelerin etkin görevleri uygulamayı kapatana kadar çalışmaya başlayacaktır. Komutlar her projenin kendi gerçek klasöründe çalışır.',
      permitido: 'Bu oturumda görevlere izin verildi.',
    },
    yml: {
      titulo: 'wolfcore.yml önerileri',
      texto:
        'Proje dosyası bu görevleri öneriyor. Orada yazmasıyla hiçbir şey çalışmaz: benimsemek için komutu inceleyip onaylayın.',
      estado: { nueva: 'Yeni', adoptada: 'Benimsendi', cambiada: 'Değişti' },
      revisar: 'İncele ve benimse',
      cambiada:
        'Benimsediğinizden beri wolfcore.yml komutu değişti. Proje görevi onayladığınız komutla devam eder; tanıyorsanız yeni sürümü benimseyin.',
      guardarEn: 'wolfcore.yml içine kaydet',
      escribirTitulo: 'Görev wolfcore.yml dosyasına yazılsın mı?',
      escribirTexto:
        'Depoyla birlikte taşınması için görev proje dosyasına eklenir veya güncellenir (geri kalanına dokunulmaz). Klonlayan kişinin kendi bilgisayarında onaylaması gerekir.',
      escribir: 'Yaz',
      escrita: 'Görev wolfcore.yml içine kaydedildi.',
    },
    registro: {
      titulo: (n: string) => `«${n}» kaydı`,
      historial: 'Son çalıştırmalar',
      sinHistorial: 'Henüz çalıştırma yok.',
      salida: 'Son çalıştırma çıktısı',
      sinSalida: 'Kayıtlı çıktı yok.',
      enmascarado:
        'Kayıtlar parolaları ve anahtarları gizler, boyut sınırına sahiptir ve kendiliğinden döner.',
      origen: { programada: 'zamanlanmış', manual: 'elle' },
    },
    dialogo: {
      tituloNueva: 'Yeni zamanlanmış görev',
      tituloEditar: 'Zamanlanmış görevi düzenle',
      tituloAdoptar: 'wolfcore.yml görevini benimse',
      tituloConfirmar: 'Görev komutunu onayla',
      nombre: 'Ad',
      nombrePlaceholder: 'Laravel görevleri',
      horario: 'Ne zaman',
      preset: {
        cadaMinuto: 'Her dakika',
        cadaN: 'Birkaç dakikada bir',
        cadaHora: 'Saatlik',
        diaria: 'Her gün belirli saatte',
        laborables: 'Pazartesi–Cuma belirli saatte',
        personalizada: 'Özel cron ifadesi',
      },
      cadaNOpcion: (n: number) => `Her ${n} dakikada bir`,
      hora: 'Saat',
      horaPlaceholder: '03:00',
      horaInvalida: 'Geçerli bir saat yazın, örneğin 03:00.',
      expresion: 'Cron ifadesi',
      cronEquivale: 'Cron ifadesi:',
      expresionAyuda:
        '5 alan: dakika, saat, ayın günü, ay ve haftanın günü (* , - /). En sık dakikada bir.',
      proximas: 'Sonraki çalıştırmalar:',
      comando: 'Komut',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Yalnızca proje dosyasıyla php, node, npm run ve python. Kabuksuz ve satır içi kod olmadan (-r, -e, -c) proje klasöründe çalışır.',
      comandoFijo:
        'Bu komut metin olarak düzenlenemeyen tırnaklı argümanlar içeriyor: olduğu gibi korunur (değiştirmek için silip yenisini oluşturun).',
      argumentos: 'Şu argümanlarla çalıştırılacak:',
      comillasSinCerrar: 'Kapatılmamış tırnak işareti var.',
      tiempo: 'En fazla süre',
      minutos: 'dakika',
      tiempoAyuda: 'Daha uzun sürerse yalnızca bu işlem ve başlattıkları kendiliğinden durdurulur.',
      activa: 'Etkin (uygulama açıkken kendiliğinden çalışır)',
      advertencia:
        'Onaylayarak tam olarak bu komuta yetki verirsiniz: zamanı geldiğinde bu proje klasöründe kendiliğinden çalışır. Değiştirirseniz yeniden onaylamanız gerekir.',
      revise: 'Bu komutu inceledim ve tanıyorum.',
      guardar: 'Kaydet ve komutu onayla',
      adoptar: 'Onayla ve benimse',
      confirmar: 'Komutu onayla',
      guardada: 'Görev kaydedildi.',
      adoptada: 'Görev benimsendi.',
      confirmada: 'Komut onaylandı.',
    },
  },
  workspaces: {
    titulo: 'Çalışma alanları',
    descripcion:
      'Birlikte başlatılıp durdurulan veritabanı, hizmet ve işlem grupları.',
    nuevo: 'Yeni çalışma alanı',
    vacio:
      'Henüz çalışma alanı yok. Örneğin PostgreSQL, Redis, Ollama ve proje işleminizle «Bot FastAPI» oluşturun.',
    elementos: (n: number) => `${n} öğe`,
    sinElementos: 'Öğe yok',
    estado: { apagado: 'Kapalı', parcial: 'Kısmen', encendido: 'Açık' },
    acciones: {
      iniciar: 'Başlat',
      detener: 'Durdur',
      editar: 'Düzenle',
      borrar: 'Sil',
      cerrar: 'Kapat',
    },
    borrar: {
      titulo: (n: string) => `«${n}» silinsin mi?`,
      texto:
        'Çalışma alanını silmek hiçbir şeyi durdurmaz veya silmez: yalnızca grubu kaldırır. Çalışanlar çalışmaya devam eder.',
      confirmar: 'Sil',
      hecho: (n: string) => `«${n}» çalışma alanı silindi.`,
    },
    dialogo: {
      tituloNuevo: 'Yeni çalışma alanı',
      tituloEditar: 'Çalışma alanını düzenle',
      nombre: 'Ad',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Bir ad yazın.',
      aviso:
        'Çalışma alanı yalnızca nelerin başlatılacağını saklar. Tünel açmaz, yerel ağda paylaşmaz ve güvenmediğiniz bir projenin işlemlerini başlatmaz.',
      secciones: {
        instancias: 'Veritabanları',
        servicios: 'Hizmetler',
        procesos: 'Proje işlemleri',
      },
      sinOpciones: 'Burada seçilecek bir şey yok.',
      captadorUnico: 'Aynı anda yalnızca bir e-posta yakalayıcı: başka birini seçmek öncekini değiştirir.',
      yaNoExisten: (lista: string) => `Artık mevcut değil ve kaydederken kaldırılacak: ${lista}`,
      guardar: 'Kaydet',
      guardado: (n: string) => `«${n}» çalışma alanı kaydedildi.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: başlatma sonucu`,
      tituloDetener: (n: string) => `«${n}»: durdurma sonucu`,
      encendido: 'Başlatıldı',
      apagado: 'Durduruldu',
      yaEncendido: 'Zaten çalışıyordu',
      yaApagado: 'Zaten durdurulmuştu',
      noExiste: 'Artık mevcut değil: atlandı',
      compartido: 'Çalışmaya devam ediyor: başka bir etkin çalışma alanı kullanıyor',
      reemplaza: (otro: string) => `Başlatıldı; aynı e-posta grubundaki ${otro} durduruldu`,
      fallo: 'Başlatılamadı',
      falloApagar: 'Hâlâ çalışıyor',
      ok: (n: string) => `«${n}» hazır.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: ${total} öğeden ${encendidos} tanesi başlatıldı. Başlamayanları kontrol edin.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} öğe hâlâ çalışıyor. Durmayanları kontrol edin.`,
    },
  },
  inicio: {
    titulo: 'Başlangıç',
    bienvenida: 'Geliştirme ortamınız tek bakışta.',
    tiles: {
      servicios: 'Çalışan hizmetler',
      serviciosDe: (total: number) => `/ ${total}`,
      sitios: 'Projeler',
      tuneles: 'Aktif tüneller',
      hosts: 'Bekleyen hosts',
      hostsOk: 'Her şey yolunda',
      hostsFaltan: 'Dikkat gerekiyor',
    },
    hosts: {
      titulo: 'hosts dosyasında kayıtlı olmayan alan adları var',
      texto:
        'Bu alan adları henüz bilgisayarınıza işaret etmiyor. Düzeltirken Windows yönetici izni isteyecektir.',
      corregir: 'Bekleyen hosts girdilerini uygula',
      reintentarPermiso: 'İzinle yeniden dene',
      corregido: 'hosts dosyası güncellendi',
      fallo: 'hosts dosyası güncellenemedi',
      verInstrucciones: 'Yönergeleri gör',
      duplicados:
        'Bu alan adları hosts içinde WolfCore Dev bloğunun dışında zaten var (korunur):',
      motivos: {
        cancelado: 'Yönetici izni iptal edildi. hosts dosyası değişmeden kaldı.',
        tiempo:
          'Yönetici iznine zamanında yanıt verilmedi. Site kaydedildi; hosts değişmeden kaldı. Windows uyarısı hâlâ açıksa iptal edin ve bekleyenleri daha sonra tek seferde uygulayın.',
        denegado:
          'Windows hosts dosyasına yazmaya izin vermedi. Bir antivirüs engelliyor olabilir.',
      } as Record<string, string>,
      modalTitulo: 'hosts dosyasını elle düzelt',
      modalTexto:
        'PowerShell’i yönetici olarak açın (Başlat’a sağ tık → Terminal (Yönetici)), bu komutu yapıştırıp Enter’a basın.',
    },
    servicios: {
      titulo: 'Hizmetler',
      ver: 'Hizmetleri gör',
      vacio: 'Henüz yüklü hizmet yok.',
    },
    tuneles: {
      titulo: 'Aktif tüneller',
      vacio: 'Açık tünel yok. Projeler bölümünden bir tane açabilirsiniz.',
      sitioDesconocido: 'Adsız site',
    },
  },
  servicios: {
    titulo: 'Hizmetler',
    descripcion:
      'Web sunucusunu, PHP’yi, veritabanlarını ve araçları başlatıp durdurun. Durum otomatik güncellenir.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Veritabanları',
      correo: 'E-posta',
      ia: 'Yapay Zekâ',
      herramientas: 'Araçlar',
    },
    gruposAyuda: {
      web: '.test alan adlarını sunan sunucu.',
      php: 'Sürüm başına bir kurulum (8.3, 8.4…); her site kendisininkini kullanır.',
      bd: 'Yalnızca 127.0.0.1 üzerinde dinler.',
      correo: 'Projelerinizin gönderdiği e-postaları internete çıkmadan yakalar.',
      ia: 'Bilgisayarınızda çalışan dil modelleri.',
      herramientas: 'Günlük kullanım araçları.',
    },
    puerto: 'Bağlantı noktası',
    cambiarPuerto: 'Bağlantı noktasını değiştir',
    cambiarPuertoDe: (nombre: string) => `${nombre} bağlantı noktasını değiştir`,
    versionesDe: (nombre: string) => `${nombre} sürümleri`,
    instancias: (n: number, encendidas: number) => `${n} örnek, ${encendidas} çalışıyor`,
    usarPuerto: (p: number) => `${p} bağlantı noktasını kullan`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} artık ${p} bağlantı noktasını kullanıyor`,
    conflicto: 'Bağlantı noktası kullanımda',
    autoIniciar: 'WolfCore Dev açıldığında başlat',
    autoIniciarActivado: (nombre: string) => `${nombre}, WolfCore Dev açıldığında başlayacak`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} artık WolfCore Dev açıldığında başlamayacak`,
    dialogoPuerto: {
      titulo: (nombre: string) => `${nombre} bağlantı noktası`,
      etiqueta: 'Yeni bağlantı noktası',
      ayuda:
        '1024 ile 65535 arasında ve boş olmalı. Hizmet çalışıyorsa yeniden başlatılır. Projelerinizin .env dosyasını güncelleyin.',
      rango: '1024 ile 65535 arasında bir sayı kullanın',
      igual: 'Bu zaten geçerli bağlantı noktası',
      guardar: 'Değiştir',
    },
    borrarDatos: {
      opcion: 'Verileri sil',
      titulo: (nombre: string) => `${nombre} verilerini sil`,
      copias: (n: number, tam: string) =>
        `Güncellemelerden kalan ${n} yedek (${tam}) de silinecektir. Saklamak istiyorsanız önce veri klasöründen kopyalayın.`,
      /** Qué se pierde, según el servicio. */
      que: {
        mysql: 'tüm MySQL veritabanları ve kullanıcıları',
        mariadb: 'tüm MariaDB veritabanları ve kullanıcıları',
        postgresql: 'tüm PostgreSQL veritabanları ve kullanıcıları',
        redis: 'Redis’te saklanan tüm anahtarlar ve veriler',
        mongodb: 'tüm MongoDB veritabanları, koleksiyonları ve verileri',
        mailpit: 'Mailpit tarafından yakalanan tüm e-postalar',
        smtp4dev: 'smtp4dev tarafından yakalanan tüm e-postalar',
        inbucket: 'Inbucket tarafından yakalanan tüm e-postalar',
        papercut: 'Papercut SMTP tarafından yakalanan tüm e-postalar',
        ollama: 'indirilen tüm Ollama modelleri',
      } as Record<string, string>,
      texto: (que: string) =>
        `${que} silinecektir. Geri alınamaz. Program yüklü kalır.`,
      generico: (nombre: string) => `${nombre} verilerinin tamamı`,
      pedir: (id: string) => `Onaylamak için ${id} yazın`,
      boton: 'Verileri sil',
      hecho: (nombre: string) => `${nombre} verileri silindi`,
    },
    ftp: {
      interruptor: 'FTP sunucusu',
      redLocal: 'Yerel ağ bağlantısına izin ver',
      redLocalAyuda:
        'Kapalıyken yalnızca bu bilgisayar bağlanabilir (127.0.0.1). Her site kendi erişimini Siteler bölümünden açar.',
      avisoTitulo: 'FTP’yi yerel ağa aç',
      avisoTexto:
        'FTP kullanıcı adlarını, parolaları ve dosyaları şifresiz gönderir. Ağınızdaki herhangi bir cihaz bağlanmayı deneyebilir. Yalnızca güvendiğiniz bir ağda kullanın.',
      avisoConfirmar: 'İzin ver',
      redLocalActivada: 'FTP yerel ağdan gelen bağlantıları kabul ediyor',
      redLocalDesactivada: 'FTP yalnızca bu bilgisayardan gelen bağlantıları kabul ediyor',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'PHP bağımlılık yöneticisi',
      instalado: 'Yüklü',
      noInstalado: 'Yüklü değil',
      sinVersion: 'yüklü değil',
      uso: 'Kullanım',
      usoTexto: 'composer',
      ayuda: 'Bir projede «Terminal» kullanın veya Ayarlar bölümünden WolfCore Dev’i PATH’e ekleyin.',
      instaladoOk: 'Composer yüklendi',
      sinPhp: 'Önce PHP yükleyin',
      actualizado: (v: string) => `Composer güncellendi: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Web tabanlı veritabanı yöneticisi',
      direccion: 'Adres',
      disponible: 'Hazır',
      noInstalado: 'Yüklü değil',
      sinPhp: 'PHP eksik',
      abrir: 'Adminer’ı aç',
      instaladoOk: 'Adminer yüklendi',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'MySQL ve MariaDB web yöneticisi',
      direccion: 'Adres',
      disponible: 'Hazır',
      noInstalado: 'Yüklü değil',
      sinPhp: 'PHP eksik',
      abrirDesdeProyecto: 'Her proje kartından doğrudan oturum açılmış şekilde açılır.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} üzerinde ${ext} uzantısı etkin değil. PHP’yi yeniden başlatın veya php.ini dosyasından etkinleştirin.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin, PHP 8.3’e kadar destek beyan ediyor ve şu an PHP ${rama} kullanılıyor: hata verebilir. Sorun olursa PHP 7.2–8.3 arası bir sürüm başlatın.`,
      instalarPrimero: 'Kullanmak için phpMyAdmin yükleyin.',
      encenderPhp: 'phpMyAdmin kullanmak için PHP’yi başlatın.',
      instaladoOk: 'phpMyAdmin yüklendi',
    },
    puertos: 'Bağlantı noktaları',
    pid: 'PID',
    sinVersion: 'sürüm yok',
    sinPuertos: '—',
    terminado: 'Hatasız sonlandı',
    externo: 'WolfCore Dev dışında yönetiliyor',
    verDetalle: 'Hata ayrıntısını gör',
    vacioTitulo: 'Henüz hizmet yok',
    vacio:
      'Henüz yüklü hizmet yok. Siteleriniz için Nginx ve PHP ile ya da bir veritabanıyla başlayın.',
    irAInstalar: 'Yüklemeye git',
  },
  bd: {
    descripcion:
      'Projelerinizin veritabanlarını oluşturun, yedekleyin ve geri yükleyin. Sunucular yalnızca 127.0.0.1 üzerinde dinler.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Yeni veritabanı',
    restaurar: 'Yedeği geri yükle',
    importar: 'Başka sunucudan içe aktar',
    soloSql: 'MySQL, MariaDB ve PostgreSQL için kullanılabilir',
    enCursoAyuda: 'Devam eden işlemin bitmesini bekleyin',
    encenderPrimero: (motor: string) => `Önce ${motor} hizmetini başlatın`,
    cargando: 'Veritabanları yükleniyor…',
    recargar: 'Listeyi yeniden yükle',
    vacioTitulo: 'Yüklü veritabanı sunucusu yok',
    vacio:
      'Veritabanlarınızı yönetmek için Hizmetler bölümünden MySQL, MariaDB, PostgreSQL veya MongoDB yükleyin.',
    irAServicios: 'Hizmetlere git',
    apagado: {
      titulo: (motor: string) => `${motor} durduruldu`,
      texto: (motor: string) => `Veritabanlarını görmek ve yönetmek için ${motor} hizmetini başlatın.`,
      iniciando: (motor: string) => `${motor} başlatılıyor…`,
      error: (motor: string) => `${motor} başlatılamadı`,
      encender: (motor: string) => `${motor} başlat`,
      verServicios: 'Hizmetlerde gör',
    },
    errorLista: 'Veritabanı listesi okunamadı',
    sinBases: 'Bu sunucuda henüz kendi veritabanınız yok.',
    total: (n: number) => plural(n, 'veritabanı', 'veritabanı'),
    columnas: { nombre: 'Veritabanı', tamano: 'Boyut', acciones: 'İşlemler' },
    acciones: {
      respaldar: 'Yedekle',
      restaurarAqui: 'Buraya geri yükle',
      adminer: 'Adminer ile aç',
      conexion: 'Bağlantı bilgileri',
      vector: 'vector etkinleştir',
      borrar: 'Sil',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Açmak için Hizmetler bölümünden Adminer ve PHP yükleyin',
    vectorSinInstalar: 'Bir veritabanında etkinleştirmek için aşağıdan pgvector yükleyin',
    vectorActivado: (base: string) => `${base} içinde vector etkinleştirildi`,
    formatos: {
      sql: 'Düz SQL',
      pgdump: 'PostgreSQL yedeği (pg_dump özel biçim)',
      gz: 'Sıkıştırılmış SQL (.gz)',
      zip: '.zip arşivi (geri yüklemeden önce açılır)',
      rar: '.rar arşivi (Windows ile açılmaya çalışılır)',
      '7z': '.7z arşivi (Windows ile açılmaya çalışılır)',
      desconocido: 'Tanınmayan biçim',
    } as Record<string, string>,
    formatoDesconocido:
      'Biçim tanınmadı. Sıkıştırılmış bir dosyaysa açın ve içindeki .sql veya .dump dosyasını seçin.',
    formatoIncompatible:
      'Bu dosya bir PostgreSQL yedeğidir: PostgreSQL sekmesinden geri yükleyin.',
    nombre: {
      etiqueta: 'Veritabanı adı',
      vacio: 'Bir ad yazın',
      largo: 'Ad çok uzun',
      caracteres: {
        mysql: 'Yalnızca harf, rakam ve alt çizgi kullanın',
        mariadb: 'Yalnızca harf, rakam ve alt çizgi kullanın',
        postgresql: 'Küçük harf, rakam ve alt çizgi kullanın',
        mongodb: 'Yalnızca harf, rakam, tire ve alt çizgi kullanın',
      } as Record<string, string>,
      inicio: 'PostgreSQL’de ad rakamla başlayamaz',
    },
    reemplazo: {
      titulo: (base: string) => `${base} veritabanında zaten tablolar var`,
      texto: (base: string) =>
        `Devam ederseniz mevcut ${base} veritabanı tamamen DEĞİŞTİRİLECEKTİR. Önce otomatik bir yedek alınır; ardından veritabanı silinip yeni içerikle yeniden oluşturulur.`,
      donde: 'Yedek şuraya kaydedilir:',
      carpetaPorDefecto: 'Belgeler\\WolfCore Dev\\Respaldos',
      otraBase:
        'Değiştirmek istemiyorsanız geri dönüp başka bir ad seçin: yeni bir veritabanı oluşturulur.',
      pedir: (base: string) => `Onaylamak için ${base} yazın`,
      volver: 'Geri',
      confirmar: 'Veritabanını değiştir',
    },
    resultado: {
      restaurada: (base: string) => `${base} veritabanı geri yüklendi`,
      importada: (base: string) => `${base} veritabanı içe aktarıldı`,
      respaldada: (base: string) => `${base} yedeği kaydedildi`,
      archivo: 'Dosya',
      respaldoPrevio: 'Önceki veritabanı yedeği',
      advertencias: (n: number) => plural(n, 'uyarı', 'uyarı'),
      advertenciasAyuda:
        'İşlem tamamlandı. Bu uyarıları inceleyin; genellikle bu bilgisayarda bulunmayan roller veya izinlerdir.',
      fallo: {
        restaurar: 'Geri yüklenemedi',
        importar: 'İçe aktarılamadı',
        respaldar: 'Yedeklenemedi',
      } as Record<string, string>,
      trasReemplazo: 'Özgün veritabanı değiştirildi ancak geri yükleme tamamlanamadı',
      trasReemplazoAyuda:
        'Önceki verileriniz belirtilen yedekte duruyor. «Yedeği geri yükle» ile geri yükleyebilirsiniz.',
    },
    progreso: {
      titulo: 'Kayıt',
      corriendo: {
        restaurar: (base: string) => `${base} geri yükleniyor…`,
        importar: (base: string) => `${base} içe aktarılıyor…`,
        respaldar: (base: string) => `${base} yedekleniyor…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Araç çıktısı bekleniyor…',
      limitado: (n: number) => `Son ${n} satır gösteriliyor.`,
      noCierre:
        'Bitene kadar programı kapatmayın. Bu ekrandan çıkıp geri dönebilirsiniz: sonucu burada göreceksiniz.',
      otraEnCurso: 'Zaten devam eden bir işlem var; bitmesini bekleyin.',
      ver: 'Ayrıntıyı gör',
      descartar: 'Kapat',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `${motor} içine yedek geri yükle`,
      confianza:
        'Yalnızca güvendiğiniz yedekleri geri yükleyin: bir yedek sunucu üzerinde işlem çalıştırabilir.',
      archivo: 'Yedek dosyası',
      elegir: 'Dosya seç…',
      cambiar: 'Değiştir',
      sinArchivo: 'Dosya seçilmedi',
      formato: 'Algılanan biçim',
      detectando: 'Biçim algılanıyor…',
      destino: 'Hedef veritabanı',
      destinoAyuda:
        'Yoksa oluşturulur. Varsa ve boşsa kullanılır. Tablolar içeriyorsa onay istenir.',
      restaurar: 'Geri yükle',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Başka sunucudan ${motor} içine içe aktar`,
      soloLectura:
        'Kaynak sunucu yalnızca okunur: veritabanı bu bilgisayara kopyalanır ve kaynağa dokunulmaz.',
      detectado: (puerto: number) =>
        `${puerto} bağlantı noktasında başka bir sunucu algılandı (ör. FlyEnv).`,
      origen: 'Kaynak sunucu',
      host: 'Sunucu',
      puerto: 'Bağlantı noktası',
      usuario: 'Kullanıcı',
      clave: 'Parola',
      claveAyuda: 'Yalnızca bu kopyalama için kullanılır ve kaydedilmez.',
      baseOrigen: 'Kaynak veritabanı',
      destino: 'Bu bilgisayardaki hedef veritabanı',
      destinoAyuda:
        'Yoksa oluşturulur. Tablolar içeriyorsa değiştirmeden önce onay istenir.',
      faltaHost: 'Sunucuyu yazın',
      faltaPuerto: '1 ile 65535 arasında bir bağlantı noktası kullanın',
      faltaUsuario: 'Kullanıcıyı yazın',
      faltaBase: 'Kaynak veritabanını yazın',
      importar: 'İçe aktar',
    },
    dialogoNueva: {
      titulo: (motor: string) => `${motor} içinde yeni veritabanı`,
      codificacion: 'Kodlama',
      codificacionValor: {
        mysql: 'utf8mb4 (emoji ve tüm karakterleri destekler)',
        mariadb: 'utf8mb4 (emoji ve tüm karakterleri destekler)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Bu veritabanı için özel kullanıcı oluştur',
      usuarioPropioAyuda:
        'İsteğe bağlı. Seçilmezse projeler sunucu yönetici kullanıcısını kullanır.',
      usuario: 'Kullanıcı',
      clave: 'Parola',
      faltaClave: 'Bir parola yazın',
      crear: 'Veritabanı oluştur',
      creada: (base: string) => `${base} veritabanı oluşturuldu`,
      mongo: 'MongoDB’de veritabanı başlangıç koleksiyonuyla (_pel_init) oluşturulur.',
      cambiarClave: 'Parolayı değiştir',
      cambiarClaveTitulo: (u: string) => `${u} kullanıcısı başka bir parolayla zaten var`,
      cambiarClaveTexto: (u: string) =>
        `${u} parolasını değiştirirseniz, bunu kullanan projeler .env dosyaları güncellenene kadar bağlanamaz. Genellikle mevcut parola kullanılır. Yine de değiştirilsin mi?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `${base} veritabanı silinsin mi?`,
      texto: (base: string, motor: string) =>
        `${motor} üzerindeki ${base} veritabanı ve tüm verileri silinir. Geri alınamaz. Gerekliyse önce yedekleyin.`,
      pedir: (base: string) => `Onaylamak için ${base} yazın`,
      boton: 'Veritabanını sil',
      hecho: (base: string) => `${base} veritabanı silindi`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `${base} yedeğini al`,
      destino: 'Kaydedileceği yer',
      porDefecto: 'Belgeler\\WolfCore Dev\\Respaldos (varsayılan klasör)',
      porDefectoEn: (carpeta: string) => `${carpeta} (varsayılan klasör)`,
      cambiar: 'Başka klasör seç…',
      porDefectoVolver: 'Varsayılan klasörü kullan',
      formato: {
        mysql: '.sql dosyası (yordamlar ve tetikleyicilerle mysqldump)',
        mariadb: '.sql dosyası (yordamlar ve tetikleyicilerle mysqldump)',
        postgresql: '.dump dosyası (pg_dump özel biçim)',
      } as Record<string, string>,
      boton: 'Yedekle',
    },
    dialogoConexion: {
      sitio: 'Proje',
      sitioAyuda:
        'Mevcut değişken adlarını (ör. CodeIgniter 4) kullanmak için sitenin .env dosyası okunur. İçeriği gösterilmez ve kopyalanmaz.',
      generico: 'Genel (Laravel biçimi)',
      titulo: (base: string) => `${base} bağlantısı`,
      host: 'Sunucu',
      puerto: 'Bağlantı noktası',
      usuario: 'Kullanıcı',
      clave: 'Parola',
      base: 'Veritabanı',
      sinClave: 'Parolasız (yalnızca 127.0.0.1 üzerinde dinler)',
      mostrar: 'Parolayı göster',
      ocultar: 'Parolayı gizle',
      copiarDato: (dato: string) => `${dato} kopyala`,
      env: '.env dosyası için blok',
      envAyuda: 'Projenizin .env dosyasına yapıştırın. WolfCore Dev projelerinize yazmaz.',
      copiarEnv: 'Bloğu kopyala',
      cargando: 'Bağlantı bilgileri okunuyor…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Zaten devam eden bir pgvector kurulumu var.',
      descripcion:
        'PostgreSQL içinde benzerlik araması (embeddings). Resmi kaynak kodundan derlenir.',
      instalado: (v: string | null) => (v ? `Yüklü (sürüm ${v})` : 'Yüklü'),
      noInstalado: 'Yüklü değil',
      herramientas: 'Derleme araçları',
      herramientasSi: 'Hazır',
      herramientasNo: 'Eksik',
      instalar: 'pgvector yükle',
      reinstalar: 'Yeniden derle',
      instalarHerramientas: 'Derleme araçlarını yükle',
      dialogoHerramientasTitulo: 'Derleme araçlarını yükle',
      dialogoHerramientas:
        'pgvector derlemek için Visual Studio Build Tools gerekir. ~6 GB indirilir ve Windows yönetici izni ister. Uzun sürebilir; WolfCore Dev’i açık bırakın.',
      dialogoCompilarTitulo: 'pgvector derle ve yükle',
      dialogoCompilar:
        'Resmi pgvector kaynak kodu indirilir, derlenir ve PostgreSQL’e yüklenir. Uzantı kopyalanırken PostgreSQL birkaç saniye durur ve yeniden başlar.',
      continuar: 'Devam',
      instalando: 'Derleme araçları yükleniyor…',
      compilando: 'pgvector derleniyor…',
      herramientasOk: 'Derleme araçları yüklendi',
      instaladoOk: (v: string) => `pgvector ${v} yüklendi`,
      sinWinget:
        'Bu bilgisayarda winget yok. visualstudio.microsoft.com adresinden «C++ ile masaüstü geliştirme» iş yüküyle «Visual Studio 2022 Build Tools» yükleyip tekrar deneyin.',
      falloHerramientas: 'Derleme araçları yüklenemedi',
      activarAyuda: 'Ardından gereken her veritabanında «vector etkinleştir» seçeneğini kullanın.',
      errorEstado: 'pgvector durumu okunamadı',
    },
  },
  instalar: {
    titulo: 'Yükle',
    descripcion:
      'Resmi sürümleri indirin. Her dosya kullanılmadan önce SHA-256 özetiyle doğrulanır.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Web sunucusu (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Genel tüneller (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Veritabanı, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Veritabanı, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Veritabanı (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Bellek içi önbellek ve kuyruk (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Belge veritabanı (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB konsolu (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Test e-postası (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Test e-postası (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Test e-postası (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Test e-postası (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Yerel yapay zekâ (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'PHP bağımlılıkları (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Web veritabanı yöneticisi' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'MySQL web yöneticisi (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web ve PHP',
      bd: 'Veritabanları',
      otros: 'E-posta, YZ ve tüneller',
    },
    instalados: 'Yüklü',
    ninguno: 'Yüklü sürüm yok',
    elegir: 'Bir sürüm seçin',
    buscando: 'Sürümler aranıyor…',
    sinVersiones: 'Sürüm bulunamadı',
    rama: (rama: string) => rama,
    yaInstalada: 'zaten yüklü',
    fases: {
      descargando: 'İndiriliyor',
      verificando: 'SHA-256 doğrulanıyor',
      extrayendo: 'Çıkarılıyor',
      compilando: 'Derleniyor',
      listo: 'Yüklendi',
      error: 'Yükleme başarısız',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} yüklendi`,
  },
  sitios: {
    titulo: 'Siteler',
    descripcion: 'Her site kendi .test alan adında Nginx tarafından sunulan bir klasördür.',
    nuevo: 'Yeni site',
    buscar: 'Ada veya alan adına göre ara',
    sinResultados: (q: string) => `«${q}» ile eşleşen site yok.`,
    vacioTitulo: 'Henüz site yok',
    vacio:
      'Bir proje klasörü seçin; WolfCore Dev bunun Laravel, CodeIgniter veya statik olduğunu algılar.',
    agregar: 'Site ekle',
    total: (n: number) => plural(n, 'site', 'site'),
    abrirSitio: (dominio: string) => `${dominio} sitesini tarayıcıda aç`,
    carpeta: 'Klasör',
    abrirCarpeta: 'Proje klasörünü aç',
    alias: (n: number) => `+${plural(n, 'takma ad', 'takma ad')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statik',
      proxy: 'Vekil (yerel bağlantı noktası)',
      personalizado: 'Özel',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (yerel bağlantı noktası)',
      node: 'Node / Vite (yerel bağlantı noktası)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statik',
      proxy: 'Vekil',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Gerçek veriler',
    datosRealesAyuda: 'Gerçek müşteri verileri içerir: yayınlarken dikkatli olun.',
    faltaHosts: 'hosts eksik',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} henüz bu bilgisayara işaret etmiyor. Yukarıdaki bildirimle hosts dosyasını düzeltin.`,
    estado: {
      enLinea: 'Çevrimiçi',
      faltaHosts: 'hosts eksik',
      iniciando: 'Nginx başlıyor…',
      errorNginx: 'Nginx hatası',
      nginxExterno: 'Harici Nginx',
      nginxApagado: 'Nginx durduruldu',
    },
    borrar: {
      titulo: (nombre: string) => `${nombre} sitesi silinsin mi?`,
      texto: 'Proje klasörüne dokunulmaz.',
      hecho: (nombre: string) => `${nombre} sitesi silindi`,
      nginxFallo: 'Site silindi ancak Nginx yeni yapılandırmayı reddetti',
    },
  },
  formSitio: {
    tituloNuevo: 'Yeni site',
    tituloEditar: 'Siteyi düzenle',
    tituloDuplicar: 'Siteyi çoğalt',
    paso: 'Proje klasörüyle başlayın',
    pasoAyuda:
      'Proje türü, PHP sürümü ve önerilen alan adı algılanır. Sonrasında her şeyi değiştirebilirsiniz.',
    elegirCarpeta: 'Klasör seç',
    cambiarCarpeta: 'Değiştir',
    detectando: 'Proje inceleniyor…',
    detectado: (tipo: string) => `Algılandı: ${tipo}`,
    sinDeteccionAlEditar: 'Otomatik algılama yalnızca oluştururken geçerlidir; tür ve PHP’yi kontrol edin.',
    nombre: 'Ad',
    nombreAyuda: 'Yalnızca listede tanımak için.',
    nombreCopia: (nombre: string) => `${nombre} (kopya)`,
    duplicarProxy:
      'Kopya asıl siteyle aynı yerel bağlantı noktasına işaret eder ve işlemlerini kopyalamaz: bağlantı noktasını değiştirin veya kendi işlemini ekleyin.',
    dominio: 'Alan adı',
    dominioPlaceholder: 'projem',
    alias: 'Takma adlar',
    aliasAyuda: 'Aynı siteyi açan diğer .test alan adları. Yazıp Enter’a basın.',
    aliasAgregar: 'Takma ad ekle',
    carpeta: 'Proje klasörü',
    raizLaravel: 'Nginx, public/ alt klasörünü sunacaktır.',
    tipo: 'Proje türü',
    php: 'PHP sürümü',
    phpElegir: 'Bir sürüm seçin',
    phpNinguno: 'Yüklü PHP sürümü yok.',
    phpInstalar: 'PHP yükle',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Proje PHP ${pedida} istiyor ancak yüklü değil. PHP ${elegida} seçildi.`,
    puertoProxy: 'Yerel bağlantı noktası',
    puertoProxyAyuda:
      'Nginx istekleri http://127.0.0.1:<puerto> adresine yönlendirir (ör. Vite veya Node).',
    urlBaseVar: 'Temel URL değişkeni',
    urlBaseVarAyuda:
      'Tünel açıldığında genel bağlantı .env içindeki bu değişkene yazılır, kapatıldığında geri yüklenir.',
    urlBaseVarNinguna: 'Yok (.env dosyasına dokunma)',
    datosReales: 'Gerçek müşteri verileri içeriyor',
    datosRealesAyuda:
      'Listede işaretlenir ve tünelle yayınlamadan önce onay istenir.',
    avanzado: 'Gelişmiş',
    reglasExtra: 'Ek Nginx kuralları',
    reglasExtraAyuda:
      'server bloğunun içine eklenir (güvenlik başlıkları, özel deny kuralları…). Kaydederken nginx -t ile doğrulanır.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Not',
    notaPlaceholder: 'Bu siteyle ilgili hatırlamak istediğiniz bir şey',
    guardar: 'Siteyi kaydet',
    guardado: (nombre: string) => `${nombre} sitesi kaydedildi`,
    errorGuardar: 'Site kaydedilemedi',
    nginxFallo: 'Site kaydedildi ancak Nginx yapılandırmayı reddetti',
    nginxFalloAyuda:
      'Önceki Nginx yapılandırması geri yüklendi. Ek kuralları kontrol edip yeniden kaydedin.',
    errores: {
      carpeta: 'Proje klasörünü seçin',
      sufijo: 'Alan adı .test ile bitmelidir',
      caracteres: 'Yalnızca harf, rakam, tire ve nokta kullanın',
      aliasIgualDominio: (d: string) => `${d} takma adı sitenin alan adıyla aynı`,
      aliasRepetido: (d: string) => `${d} takma adı yineleniyor`,
      ocupado: (d: string) => `${d} alan adına sahip bir site zaten var`,
      puertoFalta: 'Vekil site için bir bağlantı noktası gerekir',
      puertoRango: 'Bağlantı noktası 1 ile 65535 arasında olmalıdır',
      php: 'Bu site için bir PHP sürümü seçin',
      urlBaseVar: 'Harf, rakam ve alt çizgi kullanın (ör. APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `${dominio} için genel tünel`,
    etiqueta: 'Tünel',
    apagadoAyuda: 'Bu siteyi geçici bir genel bağlantıyla paylaşın.',
    abriendo: 'Tünel açılıyor…',
    cerrando: 'Tünel kapatılıyor…',
    error: 'Tünel başarısız oldu',
    sinNginx: 'Önce Nginx’i başlatın',
    sinCloudflared: 'Hizmetler bölümünden cloudflared yükleyin',
    abrirUrl: 'Genel bağlantıyı aç',
    copiarUrl: 'Genel bağlantıyı kopyala',
    verQr: 'Bağlantının QR kodunu göster',
    qrTitulo: 'Bu sitenin genel bağlantısı',
    renovar: 'Yenile (yeni bağlantı)',
    cerrar: 'Tüneli kapat',
    confirmarTitulo: 'Gerçek verili bir siteyi yayınla',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} gerçek müşteri verileri içeriyor ve ${destino} ile internette yayınlanacak: açık kaldığı sürece bağlantıya sahip herkes görebilir. Yayınlansın mı?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio}, Expose ile internette yayınlanacak: açık kaldığı sürece bağlantıya sahip herkes girebilir. Ayrıca Expose istek denetçisi yerel ağınızdaki tüm cihazlara görünür. Yayınlansın mı?`,
    compartir: 'Paylaş',
    confirmar: 'Yayınla',
    confirmarPublicoTitulo: 'Siteyi internette yayınla',
    confirmarPublicoTexto: (dominio: string) =>
      `${dominio} için genel bir Cloudflare tüneli açılacak: açık kaldığı sürece bağlantıya sahip herkes girebilir. Yayınlansın mı?`,
    opciones: 'Tünel seçenekleri',
    opcionesDe: (dominio: string) => `${dominio} tünel seçenekleri`,
    proveedor: 'Sağlayıcı',
    proveedorRapido: 'Hızlı (hesapsız)',
    proveedorRapidoAyuda: 'Her açılışta değişen bir trycloudflare.com bağlantısı.',
    proveedorNombre: 'Adlı (kendi alan adınız)',
    proveedorNombreAyuda:
      'Cloudflare’deki kendi alan adınızda sabit bir bağlantı. Cloudflare hesabı gerekir.',
    cuentaConectada: 'Cloudflare hesabı bağlı.',
    cuentaSinConectar: 'Henüz bağlı bir Cloudflare hesabı yok.',
    conectar: 'Cloudflare’e bağlan',
    conectando: 'Tarayıcınızda yetkilendirme bekleniyor…',
    conectarAyuda:
      'WolfCore Dev’i hesabınızda yetkilendirmek için tarayıcınız açılır. Sertifika yalnızca veri klasörünüzde kalır.',
    autorizacion: 'Cloudflare yetkilendirmesi',
    abrirAutorizacion: 'Yetkilendirme sayfasını aç',
    copiarAutorizacion: 'Yetkilendirme bağlantısını kopyala',
    cancelarConexion: 'İptal',
    recrear: 'Tüneli yeniden oluştur',
    olvidar: 'Tüneli unut',
    recrearTitulo: 'Tüneli yeniden oluştur',
    recrearTexto: (n: string) =>
      `Cloudflare’deki «${n}» tüneli silinir ve aynı adla yenisi oluşturulur. Bunu kullanan siteler kapatılır.`,
    olvidarTitulo: 'Tüneli unut',
    olvidarTexto: (n: string) =>
      `Cloudflare’deki «${n}» tüneli ve kayıtlı kimlik bilgisi silinir. Bunu kullanan siteler hızlı tünele döner.`,
    olvidarAqui: 'Yalnızca burada unut',
    olvidarAquiTitulo: 'Tüneli yalnızca bu bilgisayarda unut',
    olvidarAquiTexto: (n: string) =>
      `«${n}» tünelinin bu bilgisayardaki kayıtlı kimlik bilgisi silinir; tünel Cloudflare’de var olmaya devam eder. Kullanan siteler hızlı tünele döner.`,
    desconectar: 'Bağlantıyı kes',
    nombreTunel: 'Tünel adı',
    nombreTunelAyuda: 'Küçük harfler, rakamlar ve tire.',
    dominioPublico: 'Genel alan adı',
    dominioPublicoAyuda:
      'Cloudflare’deki kendi alan adınızın bir alt alan adı, ör. demo.alanadim.com.',
    crear: 'Oluştur ve yönlendir',
    guardadoNombre: 'Adlı tünel hazır. Açarken onay istenecektir.',
    guardadoRapido: 'Bu site yeniden hızlı tüneli kullanıyor.',
    cambiarCierra: 'Sağlayıcı değiştirildiğinde bu sitenin açık tüneli kapanır.',
    usarRapido: 'Hızlı tüneli kullan',
    nombreActual: (nombre: string, dominio: string) => `${dominio} üzerinde «${nombre}» tüneli`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio}, bir Cloudflare tüneliyle ${publico} adresinde yayınlanacak: açık kaldığı sürece bağlantıya sahip herkes girebilir. Yayınlansın mı?`,
    proveedorNgrokAyuda:
      'ngrok hesabınızla. ngrok programının bu bilgisayarda yüklü olması gerekir.',
    proveedorExposeAyuda:
      'Expose hesabınızla. Expose yüklü olmalıdır; Windows’ta yalnızca expose.phar ile çalışır. Denetçisi yerel ağda görünür, bu nedenle gerçek verili sitelerde kullanılmaz.',
    proveedorTailscaleAyuda:
      'Özel Tailscale ağınız üzerinden. Tailscale yüklü ve oturumu açık olmalıdır.',
    tokenGuardado: (f: string) => `Belirteç kaydedildi (${f} ile bitiyor).`,
    tokenSinGuardar: 'Henüz kayıtlı belirteç yok.',
    tokenNgrok: 'ngrok belirteci',
    tokenExpose: 'Expose belirteci',
    tokenAyuda:
      'Bu bilgisayarda şifreli saklanır ve yalnızca tünel açılırken programa iletilir; asla gösterilmez.',
    tokenPlaceholder: 'Belirteci buraya yapıştırın',
    guardarToken: 'Belirteci kaydet',
    borrarToken: 'Belirteci sil',
    usarProveedor: 'Bu sağlayıcıyı kullan',
    guardadoProveedor: 'Sağlayıcı kaydedildi. Tünel açılırken onay istenecektir.',
    ngrokAyudaInstalacion:
      'ngrok bu bilgisayarda zaten yüklü olmalıdır (ngrok doğrulanabilir indirme yayınlamadığı için WolfCore Dev indirmez). Genel yapılandırmanıza dokunulmaz.',
    exposeAyudaInstalacion:
      'Expose yüklü olmalı veya expose.phar dosyası WolfCore Dev veri klasöründeki bin/expose içine konmalıdır (Windows’ta yalnızca phar çalışır). İstek denetçisi tüm yerel ağda görünür, bu yüzden gerçek verili sitelerde kullanılmaz. Genel yapılandırmanıza dokunulmaz.',
    tailscaleAlcance: 'Erişim kapsamı',
    tailscaleServe: 'Serve: yalnızca tailnet ağınız',
    tailscaleServeAyuda: 'Yalnızca Tailscale ağınızdaki cihazlar. İnternete açılmaz.',
    tailscaleFunnel: 'Funnel: tüm internet',
    tailscaleFunnelAyuda: 'Tailnet ağınızda olsun olmasın bağlantıya sahip herkes girebilir.',
    tailscaleFunnelAviso:
      'Funnel bu siteyi internette yayınlar: açık kaldığı sürece bağlantıya sahip herkes girebilir.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev, Tailscale’i yüklemez (sistem hizmetidir): yüklü ve oturumu açık olmalıdır. Tailscale ile zaten yayınladığınız hiçbir şey değiştirilmez; site HTTPS 8443 bağlantı noktasını kullanır.',
    confirmarTailnetTitulo: 'Tailnet ağınızla paylaş',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio}, Tailscale Serve ile paylaşılacak: yalnızca tailnet cihazlarınız girebilir, internette yayınlanmaz. Paylaşılsın mı?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} gerçek müşteri verileri içeriyor. Tailscale Serve ile yalnızca tailnet cihazlarınız görebilir (internette yayınlanmaz). Paylaşılsın mı?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio}, Tailscale Funnel ile internette yayınlanacak: açık kaldığı sürece bağlantıya sahip herkes girebilir. Yayınlansın mı?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio}, ${proveedor} ile internette yayınlanacak: açık kaldığı sürece bağlantıya sahip herkes girebilir. Yayınlansın mı?`,
    tituloError: 'Tünel açılamadı',
  },
  tuneles: {
    titulo: 'Tüneller',
    descripcion: 'Bir siteyi ağınız dışında göstermek için geçici genel Cloudflare bağlantıları.',
    explicacion:
      'Hızlı tüneller her açılışta veya yenilemede adres değiştirir ve yalnızca bu bilgisayar açıkken ve işlemleri çalışırken etkin kalır (WolfCore Dev’den açık bırakarak çıkarsanız çalışmaya devam eder).',
    columnas: { sitio: 'Site', estado: 'Durum', url: 'Bağlantı', acciones: 'İşlemler' },
    vacioTitulo: 'Açık tünel yok',
    vacio: 'Genel bir bağlantı almak için bir sitenin tünel anahtarını açın.',
    irASitios: 'Sitelere git',
    sinNombre: 'Silinmiş site',
  },
  ajustes: {
    titulo: 'Ayarlar',
    descripcion: 'Ortam tercihleri.',
    general: 'Genel',
    carpetaDatos: 'Veri klasörü',
    carpetaDatosAyuda: 'İkili dosyalar, yapılandırma ve kayıtlar. Açılabilir, değiştirilemez.',
    servicios: 'Hizmetler',
    puertoNginx: 'Nginx bağlantı noktası',
    puertoNginxAyuda:
      'Normalde 80. 80 değilse yerel URL’lerde bağlantı noktası yer alır. Açık tüneller eski bağlantı noktasında kalır: yenileyin.',
    trabajadores: 'PHP çalışanları',
    trabajadoresAyuda:
      'Sürüm başına php-cgi işlemleri. Daha fazla çalışan aynı anda daha çok isteğe yanıt verir.',
    nota: 'Kaydederken siteler yeni bağlantı noktasıyla yeniden oluşturulur. Nginx açıksa yeniden başlatılır (bağlantı noktası değişmediyse yeniden yüklenir), çalışan sayısı değişirse açık PHP sürümleri de yeniden başlatılır.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Ayarlar kaydedildi ve uygulandı. Yeniden başlatılan: ${reiniciados.join(', ')}.`
        : 'Ayarlar kaydedildi ve uygulandı.',
    errorAplicar: 'Ayarlar kaydedildi ancak tümü uygulanamadı',
    errorSeccion: (detalle: string) => `Bu veri okunamadı: ${detalle}`,
    acerca: 'Hakkında',
    avisos: {
      titulo: 'Bildirimler',
      descripcion:
        'Çanda hangi bildirimlerin saklanacağı ve pencere görünür değilken Windows bildirimi gösterilip gösterilmeyeceği.',
      nativas: 'Windows bildirimleri',
      nativasAyuda:
        'Yalnızca WolfCore Dev ön planda değilken; tür başına 5 dk’da en fazla bir kez.',
      tiposTitulo: 'Bildirim türleri',
      versionesTitulo: 'Hizmete göre yeni sürümler',
      versionesAyuda:
        'Yeni sürüm bildirimlerini almamak için bir hizmeti kapatın (Sürümler sekmesi güncellemeleri göstermeye devam eder).',
      versionesDe: (s: string) => `${s} yeni sürümlerini bildir`,
      tipos: {
        'servicio-caido': 'Bir hizmet hatayla durdu',
        'puerto-ocupado': 'Hizmet başlatılırken bağlantı noktası kullanımda',
        'certificado-por-vencer': 'Süresi dolmak üzere olan sertifikalar',
        'tunel-caido': 'Bir tünel kesildi',
        'proceso-error': 'Bir proje işlemi başarısız oldu',
        'proceso-terminado': 'Bir proje işlemi tamamlandı',
        'receta-terminada': 'Bir proje reçetesi tamamlandı',
        doctor: 'Tanılama (Doctor)',
        'contenedor-detenido': 'Bir konteyner durdu',
        'version-nueva': 'Yüklü bir hizmetin yeni sürümü var',
      } as Record<string, string>,
      errorGuardar: 'Bildirim ayarları kaydedilemedi',
    },
    versionPrograma: 'Program sürümü',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Yerel sertifika otoritesi',
      autoridadAyuda:
        'WolfCore Dev, .test sitelerinizin sertifikalarını kendi otoritesiyle imzalar. Yönetici izni olmadan Windows kullanıcı deponuza yüklenir.',
      instalada: 'Windows’ta yüklü',
      noInstalada: 'Yüklü değil',
      instalar: 'CA yükle',
      reinstalar: 'Yeniden yükle',
      quitar: 'Kaldır',
      instaladaOk: 'HTTPS CA yüklendi',
      quitadaOk: 'HTTPS CA kaldırıldı',
      cancelado: 'Windows onayı iptal edildi. Hiçbir şey değiştirilmedi.',
      fallo: 'HTTPS CA değiştirilemedi',
      quitarTitulo: 'HTTPS CA kaldırılsın mı?',
      quitarTexto:
        'Yeniden yükleyene kadar tarayıcılar .test sitelerinizin sertifikalarına güvenmeyecektir.',
      puerto: 'HTTPS bağlantı noktası',
      puertoAyuda:
        'Normalde 443. Başka bir program kullanıyorsa 1024–65535 arası seçin; URL’lerde bağlantı noktası yer alır.',
      puertoRango: '443 veya 1024 ile 65535 arasında bir sayı kullanın',
      puertoGuardado: (p: number) => `HTTPS artık ${p} bağlantı noktasını kullanıyor`,
      puertoAplicarFallo: 'Bağlantı noktası kaydedildi ancak Nginx yeni yapılandırmayı kabul etmedi',
      firefox:
        'Firefox kendi sertifika deposunu kullanır. Güvenmesi için about:config açın ve şunu etkinleştirin:',
    },
    herramientas: {
      titulo: 'Terminal ve araçlar',
      phpPorDefecto: 'Varsayılan PHP',
      phpPorDefectoAyuda:
        'Terminalde ve WolfCore Dev kısayollarındaki php ve composer sürümü. «Terminal» her projenin kendi PHP’sini kullanır.',
      phpMasReciente: 'Yüklü en yeni sürüm',
      phpSinInstalar: 'Sürüm seçmek için Hizmetler bölümünden PHP yükleyin',
      phpGuardado: 'Varsayılan PHP güncellendi',
      path: 'Kullanıcı PATH değeri',
      pathAyuda:
        'Herhangi bir terminalde kullanabilmek için WolfCore Dev php ve composer yolunu kullanıcı PATH’inize ekler.',
      pathActivo: 'PATH’e eklendi',
      pathInactivo: 'PATH içinde değil',
      pathAgregar: 'Kullanıcı PATH’ine ekle',
      pathQuitar: 'PATH’ten kaldır',
      pathTitulo: 'PATH güncellendi',
      pathAviso: 'Değişikliği görmek için yeni bir terminal açın: açık terminaller bunu görmez.',
      pathQuitarTitulo: 'WolfCore Dev, PATH’ten kaldırılsın mı?',
      pathQuitarTexto:
        'WolfCore Dev php ve composer yeni terminallerde artık kullanılamayacaktır. Açık terminaller değişmez.',
      adminer: 'Adminer bağlantı noktası',
      adminerAyuda: 'Adminer yalnızca bu bilgisayarda bu sabit adresten sunulur.',
      terminal: 'Varsayılan terminal',
      terminalSistema: 'Sistem varsayılanı (PowerShell)',
      terminalAyuda:
        'Projelerde «Terminal» tıklandığında açılır. Proje özel değişkenler gerektiriyorsa (PATH’te PHP’si, ajan anahtarı), «Windows Terminal» seçiliyken PowerShell varsayılan Windows terminalinde açılır: zaten açık olan Windows Terminal bu değişkenleri alamaz.',
      terminalGuardada: 'Varsayılan terminal güncellendi',
      editor: 'Varsayılan düzenleyici',
      editorPrimero: 'İlk algılanan',
      editorAyuda:
        'Projelerde «Düzenleyici» ve arama/hatalarda «Düzenleyicide aç» için kullanılır. VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed ve Notepad++ algılanır.',
      editorGuardado: 'Varsayılan düzenleyici güncellendi',
      editorNinguno: 'Hiçbir düzenleyici algılanmadı.',
    },
  },
  /* ───────────── HTTPS, terminal y FTP en sitios; Correo; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS etkin',
    candadoAyuda: 'Bu site ayrıca WolfCore Dev sertifikasıyla HTTPS üzerinden yanıt verir.',
    redirige: 'http → https yönlendirir',
    abrirHttp: (dominio: string) => `http://${dominio} adresini tarayıcıda aç`,
    abrirHttps: (url: string) => `${url} adresini tarayıcıda aç`,
    pendiente: (motivo: string) => `HTTPS bekliyor: ${motivo}`,
    pendienteCorto: 'HTTPS bekliyor',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `${puerto} bağlantı noktasını ${nombre} (PID ${pid}) kullanıyor.`,
    sinAutoridad: 'sertifika otoritesi eksik. Ayarlar bölümünden yükleyin.',
    pendienteAyuda:
      'Site HTTP üzerinden çalışmaya devam eder. O programı kapatın veya Ayarlar’dan başka bir HTTPS bağlantı noktası seçin.',
    sinConfianza: 'CA yüklü değil',
    sinConfianzaAyuda:
      'WolfCore Dev otoritesini yükleyene kadar (Ayarlar → HTTPS) tarayıcı güvenlik uyarısı gösterecektir.',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'HTTPS üzerinden de sun',
    httpsAyuda: 'Alan adı ve takma adları için WolfCore Dev tarafından imzalanmış özel sertifikayla.',
    redirigir: 'HTTPS’ye yönlendir',
    redirigirAyuda: 'http ziyaretleri https’ye yönlendirilir. Genel tüneller etkilenmez.',
    redirigirDeshabilitado: 'Önce HTTPS’yi etkinleştirin',
    sinAutoridadTitulo: 'HTTPS otoritesi yüklü değil',
    sinAutoridadTexto:
      'O olmadan tarayıcı güvenlik uyarısı gösterir. Windows kurulumu onaylamanızı ister.',
    instalar: 'CA yükle',
    instalada: 'HTTPS CA yüklendi',
    cancelado: 'Windows onayı iptal edildi. Hiçbir şey değiştirilmedi.',
    fallo: 'HTTPS CA yüklenemedi',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Proje klasöründe, kendi PHP ve Composer’ı PATH içinde olacak şekilde bir terminal açar.',
    elegir: 'Terminal seç',
    predeterminada: 'varsayılan',
  },
  editorSitio: {
    ayuda: 'Proje klasörünü varsayılan düzenleyicide açar.',
    elegir: 'Birlikte aç…',
    predeterminada: 'varsayılan',
    sustituido: (pred: string, usado: string) =>
      '{pred} yüklü değil: {usado} ile açıldı.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Düzenleyici açılamadı',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Paylaşılan PHP ${rama}`,
    propio: (rama: string) => `Bu siteye özel PHP ${rama}`,
    conXdebug: 'Xdebug etkin',
    mostrar: 'PHP ayarları',
    ocultar: 'PHP ayarlarını gizle',
    cargando: 'PHP ayarları okunuyor…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} kapalı: bu sitenin özel PHP’si onunla birlikte başlar.`,
    ajustesTitulo: 'Özel php.ini',
    ajustesAyuda: (rama: string) =>
      `Yalnızca bu site için PHP ${rama} php.ini dosyasına eklenir. Herhangi bir ayar (veya Xdebug) olduğunda site 1–2 işlemli kendi PHP’sini kullanır; diğer siteler değişmez.`,
    clave: 'Yönerge',
    valor: 'Değer',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `${clave || 'ayarı'} kaldır`,
    agregar: 'Ayar ekle',
    guardarAjustes: 'Test et ve kaydet',
    ajustesGuardados: 'Site PHP ayarları uygulandı',
    sinAjustes: 'Özel ayar yok: paylaşılan php.ini olduğu gibi kullanılır.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `${dominio} için Xdebug`,
    xdebugAyuda:
      'Yalnızca bu sitenin PHP’sine yüklenir, paylaşılan PHP’ye asla yüklenmez: diğer siteler aynı hızda kalır.',
    xdebugDescarga:
      'Bu PHP sürümünde Xdebug yüklü değil: katalogdan indirilecek (xdebug.org, SHA-256 doğrulamalı).',
    modo: 'Modlar',
    modos: {
      debug: 'debug (kesme noktaları)',
      develop: 'develop (gelişmiş hatalar)',
      coverage: 'coverage (kapsam)',
      profile: 'profile (profilleme)',
      trace: 'trace (izleme)',
    },
    puerto: 'Düzenleyici bağlantı noktası',
    inicio: 'Ne zaman bağlansın',
    inicioTrigger: 'Yalnızca XDEBUG_TRIGGER ile',
    inicioYes: 'Her istekte',
    inicioAyuda:
      '«Yalnızca XDEBUG_TRIGGER ile» seçeneğinde hata ayıklama, istekte çerez, GET/POST parametresi veya tarayıcı uzantısı (Xdebug Helper) olduğunda başlar.',
    guardarXdebug: 'Xdebug kaydet',
    xdebugPuertoEnUso: (puerto: number) =>
      `${puerto} bağlantı noktasını zaten bir PHP veya başka bir WolfCore Dev hizmeti kullanıyor: düzenleyiciniz dinleyemez. Başka bir tane seçin (9003 yaygındır).`,
    xdebugGuardado: 'Site Xdebug ayarları uygulandı',
    quitarXdebug: 'Xdebug kaldır',
    quitarXdebugTitulo: 'Bu siteden Xdebug kaldırılsın mı?',
    quitarXdebugTexto:
      'Yapılandırması silinir. Sitenin başka özel ayarı yoksa paylaşılan PHP’ye döner. Projenin launch.json dosyasına dokunulmaz.',
    xdebugQuitado: 'Xdebug siteden kaldırıldı',
    ide: 'Düzenleyici',
    generarLaunch: 'launch.json oluştur',
    launchTitulo: 'Projenin .vscode/launch.json dosyası',
    launchNuevo:
      'Bu yapılandırmayla .vscode/launch.json oluşturulacaktır (VS Code PHP Debug, yalnızca 127.0.0.1 dinler).',
    launchFusion:
      'Zaten bir launch.json var: yalnızca WolfCore yapılandırması eklenir (veya güncellenir); diğerleri ve yorumları kalır. Öncesinde veri klasörüne tarihli bir kopya kaydedilir.',
    launchSinCambios: 'launch.json bu yapılandırmayı zaten içeriyor.',
    launchEscribir: 'launch.json yaz',
    launchCreado: '.vscode içinde launch.json oluşturuldu',
    launchActualizado: (respaldo: string) => `launch.json güncellendi. Önceki kopya: ${respaldo}`,
    phpStorm: 'PhpStorm yapılandırması',
    copiarPhpStorm: 'PhpStorm yapılandırmasını kopyala',
    errorNginx: (salida: string) => `Nginx değişikliği kabul etmedi; önceki hâline dönüldü. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Otomatik oluşturulan vhost',
    conReglas: 'özel kurallarla',
    manualResumen: 'Elle yazılan vhost (yeniden oluşturulmaz)',
    mostrar: 'vhost düzenle',
    ocultar: 'vhost gizle',
    cargando: 'vhost okunuyor…',
    reglasTitulo: 'Özel kurallar',
    reglasAyuda:
      'Bu sitenin server bloğunun içine girer. Uygulamadan önce tüm yapılandırmanın bir kopyasında nginx -t ile test edilir; bir hata olursa her şey olduğu gibi kalır.',
    reglasEtiqueta: 'Özel Nginx kuralları',
    reglasPlaceholder: '# Örneğin: client_max_body_size 256m;',
    snippetsTitulo: 'Parçacıklar',
    insertar: (titulo: string) => `Ekle: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Statik önbellek',
      'limite-subida': 'Yükleme sınırı',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Güvenlik başlıkları',
      websocket: 'WebSocket vekili',
      gzip: 'gzip sıkıştırma',
      ocultos: 'Gizli dosyaları engelle',
    },
    aplicar: 'Test et ve uygula',
    descartar: 'Değişiklikleri iptal et',
    aplicado: 'vhost uygulandı ve Nginx yeniden yüklendi',
    aplicadoApagado: 'vhost kaydedildi; Nginx başlatıldığında kullanılacak',
    fallo: 'Nginx değişikliği kabul etmedi; vhost olduğu gibi kaldı',
    salidaTitulo: 'nginx -t çıktısı',
    desactivado:
      'Yapılandırma uygulanırken Nginx bu site için yazdığınız kuralları kabul etmedi ve vhost dışında bıraktı (kayıtlı duruyor). Düzeltip yeniden uygulayın.',
    avisoDestino: (destino: string, linea: number) =>
      `Satır ${linea}: trafik başka bir bilgisayara (${destino}) yönlendiriliyor. İstediğinizin bu olduğunu doğrulayın.`,
    generadoTitulo: 'Otomatik oluşturulan vhost (salt okunur)',
    avanzadoTitulo: 'Gelişmiş mod',
    avanzadoInterruptor: 'Tüm vhost dosyasını elle yaz',
    avanzadoAyuda:
      'Otomatik oluşturulan vhost’u değiştirir. WolfCore Dev artık yeniden oluşturmaz: alan adı, HTTPS, bağlantı noktaları veya klasör değişirse kendiniz düzenlemelisiniz. Yalnızca bu sitenin alan adları ve bağlantı noktaları kullanılabilir.',
    avanzadoActivarTitulo: 'vhost elle yazılsın mı?',
    avanzadoActivarTexto:
      'Mevcut otomatik vhost temel alınır. Etkin olduğu sürece site değişiklikleri (alan adı, HTTPS, PHP…) vhost’a yansımaz: kendiniz yapmalısınız.',
    avanzadoActivar: 'Elle yaz',
    manualEtiqueta: 'Sitenin tam vhost dosyası',
    aplicarManual: 'vhost test et ve uygula',
    volverGenerado: 'Otomatik vhost’a dön',
    volverGeneradoTitulo: 'Otomatik vhost’a dönülsün mü?',
    volverGeneradoTexto:
      'Elle yazılan vhost geçmişe kaydedilir ve WolfCore Dev siteninkini yeniden oluşturur (özel kurallarınızla birlikte).',
    historial: 'Geçmiş',
    historialTitulo: 'Önceki vhost sürümleri',
    historialVacio: 'Henüz önceki sürüm yok.',
    historialAyuda:
      'Her değişiklikten önce son 10 sürüm saklanır. Geri yükleme aynı nginx -t testinden geçer.',
    modoReglas: 'Kurallarla oluşturuldu',
    modoManual: 'Elle yazıldı',
    restaurar: 'Geri yükle',
    restaurarTitulo: 'Bu sürüm geri yüklensin mi?',
    restaurarTexto: (fecha: string) =>
      `vhost, ${fecha} tarihindeki durumuna döner. Mevcut sürüm geçmişte saklanır.`,
    restaurado: 'Sürüm geri yüklendi',
  },
  lan: {
    etiqueta: 'Yerel ağ',
    interruptor: (dominio: string) => `${dominio} sitesini yerel ağda paylaş`,
    apagadoAyuda: 'Bu siteyi telefonunuzdan veya aynı ağdaki başka bir cihazdan açın.',
    sinNginx: 'Siteyi yerel ağda paylaşmak için Nginx’i başlatın.',
    sinRed: 'Bağlı yerel ağ yok (Wi-Fi veya Ethernet).',
    activo: 'Yerel ağda görünür',
    abriendo: 'Paylaşılıyor…',
    cerrando: 'Paylaşım durduruluyor…',
    abrirUrl: 'Bu bilgisayarda aç',
    copiarUrl: 'Adresi kopyala',
    verQr: 'QR kodu göster',
    qrTitulo: (dominio: string) => `Yerel ağda ${dominio}`,
    qrAviso: 'Aynı ağa bağlı bir telefonla QR kodu okutun.',
    confirmarTitulo: 'Yerel ağda paylaş',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio}, bu bilgisayarla (${ip}) aynı ağa bağlı herhangi bir cihaz tarafından parolasız görülebilecek. Anahtar kapatıldığında, WolfCore Dev kapatıldığında veya yeniden başlatıldığında paylaşım sona erer.`,
    ipEtiqueta: 'Ağ (bu bilgisayarın IP’si)',
    https: 'HTTPS kullan',
    httpsAyuda:
      'HTTPS için telefon WolfCore Dev CA’sına güvenmelidir («CA’yı telefona yükle» düğmesi). Aksi hâlde site HTTP ile açılır.',
    httpsObligatorio: 'Bu site HTTPS’ye yönlendiriyor, dolayısıyla HTTPS ile paylaşılır.',
    compartir: 'Ağda paylaş',
    tituloError: 'Yerel ağda paylaşılamadı',
    caBoton: 'CA’yı telefona yükle',
    firewallTitulo: 'Telefonda açılmıyor mu?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} gerçek veriler içerir ve onayla bile yerel ağda paylaşılmaz.`,
    redPublica:
      'Bu ağ Windows’ta ortak olarak işaretli: güvenlik duvarı gelen bağlantıları engeller ve komut yalnızca özel ağları açar. Güvendiğiniz bir ağsa özel olarak işaretleyin.',
    firewallTexto:
      'WolfCore Dev güvenlik duvarını değiştirmez. Tüm program için Windows uyarısını onaylamayın: yönetici olarak PowerShell’de bu bağlantı noktası komutunu (yalnızca yerel alt ağ ve özel ağlar) çalıştırın. Ortak ağda açılmaz ve mevcut bir engelleme kuralı önceliklidir.',
    copiarComando: 'Komutu kopyala',
  },
  caMovil: {
    titulo: 'CA’yı telefona yükle',
    intro:
      'WolfCore Dev sertifika otoritesi sertifikasını indirmek için aynı ağdaki bir telefonla QR kodu okutun. Yalnızca bu dosya sunulur ve bağlantı kendiliğinden kapanır.',
    abriendo: 'Bağlantı açılıyor…',
    expira: (minutos: number) => `Bağlantı ${minutos} dk içinde kendiliğinden kapanır.`,
    expirado: 'Bağlantı kapandı.',
    reabrir: 'Yeniden aç',
    android: 'Android',
    ios: 'iPhone veya iPad',
    pasosAndroid: [
      'QR kodu okutun veya adresi telefon tarayıcısında açıp dosyayı indirin.',
      'Ayarlar > Güvenlik ve gizlilik > Diğer güvenlik ayarları > Şifreleme ve kimlik bilgileri > Sertifika yükle > CA sertifikası yolunu açın (adlar markaya göre değişir).',
      'Güvenmeden önce telefonda görünen SHA-256 parmak izini bu penceredekiyle karşılaştırın: eşleşmiyorsa yüklemeyin.',
      'İndirilen dosyayı seçin ve uyarıyı onaylayın: Android her CA için bu uyarıyı gösterir.',
    ],
    pasosIos: [
      'Adresi Safari’de açın ve profil indirmesine izin verin.',
      'Ayarlar > İndirilen Profil’i açın ve ayrıntıdaki SHA-1 parmak izini bu penceredekiyle karşılaştırın: eşleşmiyorsa yüklemeyin, eşleşiyorsa yükleyin.',
      'Ayarlar > Genel > Hakkında > Sertifika Güven Ayarları’nı açın ve WolfCore Dev CA için tam güveni etkinleştirin.',
    ],
    aviso:
      'Yüklü bir CA, o telefonda imzaladığı her şeye güven verir: yalnızca kendi cihazlarınıza yükleyin ve işiniz bitince kaldırın.',
    firewallAviso: (puerto: number) =>
      'Telefonun bağlantıya ulaşabilmesi için ' +
      puerto +
      ' bağlantı noktası açılmalıdır (yalnızca yerel alt ağ ve özel ağlar). Tüm program için Windows uyarısını onaylamayın: bu komutu yönetici olarak PowerShell’de çalıştırın. Ortak ağda açılmaz ve mevcut engelleme kuralı önceliklidir.',
    huellas: 'Sertifika parmak izleri',
    tituloError: 'CA bağlantısı açılamadı',
  },
  dialogoQr: {
    descargar: 'PNG indir',
    descargado: 'QR kaydedildi',
    largo: 'Metin bir QR kodu için çok uzun.',
    generando: 'QR kodu oluşturuluyor…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `${dominio} için FTP erişimi`,
    apagadoAyuda: 'Bu sitenin klasörüne FTP ile dosya yüklemeye izin verin.',
    activoAyuda: 'Erişim etkin.',
    soloLecturaEtiqueta: 'salt okunur',
    mostrarDatos: 'FTP bilgilerini göster',
    ocultarDatos: 'FTP bilgilerini gizle',
    host: 'Sunucu',
    puerto: 'Bağlantı noktası',
    usuario: 'Kullanıcı',
    clave: 'Parola',
    mostrarClave: 'Parolayı göster',
    ocultarClave: 'Parolayı gizle',
    copiarDato: (dato: string) => `${dato} kopyala`,
    cargando: 'FTP bilgileri okunuyor…',
    regenerar: 'Parolayı yeniden oluştur',
    regenerarTitulo: 'FTP parolası yeniden oluşturulsun mu?',
    regenerarTexto:
      'Mevcut parola çalışmayı durdurur ve bu sitenin açık bağlantıları kapanır. FTP istemcinizde güncellemeniz gerekir.',
    regenerada: 'FTP parolası yeniden oluşturuldu',
    soloLectura: 'Salt okunur',
    soloLecturaAyuda: 'İndirilebilir ancak dosya yüklenemez, değiştirilemez veya silinemez.',
    soloLecturaActivado: 'Bu sitenin FTP erişimi artık salt okunur',
    soloLecturaDesactivado: 'Bu sitenin FTP erişimi artık yazmaya izin veriyor',
    activado: 'FTP erişimi etkinleştirildi',
    desactivarTitulo: 'Bu sitenin FTP erişimi kaldırılsın mı?',
    desactivarTexto:
      'Parola silinir ve açık bağlantılar kapatılır. Site klasörüne dokunulmaz.',
    desactivar: 'Erişimi kaldır',
    desactivado: 'FTP erişimi kaldırıldı',
    redLocalAviso:
      'FTP yerel ağdan gelen bağlantıları kabul eder ve parolayı ile dosyaları şifresiz gönderir. Yalnızca güvendiğiniz bir ağda kullanın.',
    redLocalHost: 'veya ağınızdaki bu bilgisayarın IP’si',
    servidorApagado: 'FTP sunucusu kapalı: başlatana kadar kimse bağlanamaz.',
    encender: 'FTP’yi başlat',
    urlEtiqueta: 'Adres',
    urlAyuda: 'Adres parolayı içermez: bağlanırken istenir.',
    abrirUrl: 'FTP istemcisinde aç',
    copiarUrl: 'FTP adresini kopyala',
    verQr: 'Adresin QR kodunu göster',
    qrTitulo: 'Bu sitenin FTP adresi',
    qrAviso: 'Kod yalnızca adresi taşır, parolayı içermez.',
  },
  correo: {
    descripcion:
      'Yakalayıcılar, projelerinizin gönderdiği e-postaları internete çıkmadan inceleyebilmeniz için yakalar. Yalnızca bu bilgisayarı (127.0.0.1) dinlerler ve aynı anda sadece biri çalışır.',
    seccionCaptadores: 'Yerel yakalayıcılar',
    seccionProveedores: 'Uzak SMTP sağlayıcıları',
    proveedores: {
      descripcion:
        'Gerçek bir SMTP sağlayıcısı e-postayı gerçekten gönderir: projenizi yayınlamadan önce gönderimi test etmek için kullanın. Anahtar bu bilgisayarda şifreli saklanır ve asla gösterilmez.',
      agregar: 'Sağlayıcı ekle',
      vacio:
        'Henüz sağlayıcı eklemediniz. Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO veya Gmail seçin ya da kendinizinkini yazın.',
      errorLista: 'Sağlayıcı listesi okunamadı',
      tarjeta: {
        servidor: 'Sunucu',
        usuario: 'Kullanıcı',
        clave: 'Anahtar',
        sinClave: 'Anahtar yok',
        claveIlegible: 'Kayıtlı (okunamadı)',
        red: 'Ağ',
        redLocal: 'Bu bilgisayarın veya yerel ağın sunucusu (onaylandı)',
        editar: 'Düzenle',
        borrar: 'Sil',
        borrarTitulo: (n: string) => `${n} silinsin mi?`,
        borrarTexto:
          'Sağlayıcı ve kayıtlı anahtarı silinir. Kullanan projeler yerel yakalayıcıya döner ancak .env dosyalarına dokunulmaz: bu sağlayıcının MAIL_* değişkenlerini (ve yazdıysanız anahtarını) korurlar. Her .env içindeki e-posta bloğunu yeniden yazın.',
        borrado: (n: string) => `${n} silindi`,
        usar: 'Projede kullan',
        destino: 'Test hedef adresi',
        destinoPlaceholder: 'adresiniz@ornek.com',
        probar: 'Gönderimi test et',
        probando: 'Gönderiliyor…',
        probarAyuda:
          'Doğrulanmış şifreli bağlantıyla o adrese tek bir gerçek e-posta gönderir. En fazla 15 sn’de bir.',
        sinClaveParaProbar: 'Gönderimi test edebilmek için sağlayıcının anahtarını kaydedin.',
        hostLocal: 'Bu sunucu adı bu bilgisayara veya yerel ağa çözülüyor.',
        confirmarRed: 'Yerel ağı onayla',
        enviado: (para: string) => `${para} adresine e-posta gönderildi. Gelen kutunuzu kontrol edin.`,
        fallos: {
          'correo.auth': 'Sağlayıcı kullanıcı adını veya anahtarı reddetti.',
          'correo.conexion': 'Bağlanılamadı: sunucu ve bağlantı noktasını kontrol edin.',
          'correo.tls':
            'Şifreli bağlantı geçerli değil (sertifika, ad veya STARTTLS). Hiçbir şey gönderilmedi.',
          'correo.rechazado':
            'Sunucu iletiyi veya bir adresi reddetti. Göndereni kontrol edin: birçok sağlayıcı yalnızca doğrulanmış bir gönderen veya alan adını kabul eder.',
          'correo.plazo': 'Sunucu zamanında yanıt vermedi (20 sn).',
        },
      },
      dialogo: {
        nuevo: 'SMTP sağlayıcısı ekle',
        editar: (n: string) => `${n} düzenle`,
        preset: 'Sağlayıcı',
        presetOtro: 'Diğer (verileri elle girin)',
        presetAyuda: 'Sunucu ve bağlantı noktası her sağlayıcının resmi belgelerinden gelir.',
        documentacion: 'Belgeleri gör',
        region: 'Bölge',
        nombre: 'Ad',
        nombreObligatorio: 'Bir ad yazın.',
        host: 'Sunucu (host)',
        hostAyuda: 'Yalnızca ad veya IP; smtp:// veya bağlantı noktası olmadan.',
        hostObligatorio: 'Sunucuyu yazın.',
        puerto: 'Bağlantı noktası',
        seguridad: 'Şifreleme',
        seguridadAyuda:
          'Her zaman geçerli sertifikalı şifreli bağlantı zorunludur: asla düz metne düşmez.',
        tls: 'Doğrudan TLS (bağlantı noktası 465)',
        starttls: 'STARTTLS (bağlantı noktası 587)',
        usuario: 'Kullanıcı',
        usuarioObligatorio: 'Kullanıcıyı yazın.',
        usuarioFijoAyuda: 'Bu sağlayıcı her zaman bu kullanıcıyı kullanır; anahtar hesabınıza aittir.',
        clave: 'SMTP anahtarı',
        claveGuardada: (f: string) => `Kayıtlı: ••••${f}`,
        claveNueva: 'Kaydetmek için anahtarı yazın',
        claveAyuda:
          'Bu bilgisayarda şifreli saklanır ve bir daha gösterilmez. Değiştirmek istemiyorsanız boş bırakın.',
        remitente: 'Test göndereni (isteğe bağlı)',
        remitenteAyuda:
          'Birçok sağlayıcı yalnızca doğrulanmış gönderen veya alan adından gönderir. Boş bırakırsanız gönderen hedef adresin kendisi olur.',
        claveSinEspacios:
          'Anahtarı sağlayıcının verdiği gibi yapıştırın: iç boşluklar korunur.',
        borrarClave: 'Anahtarı sil',
        borrarClaveTitulo: (n: string) => `${n} anahtarı silinsin mi?`,
        borrarClaveTexto: 'Kayıtlı anahtar silinir. Sağlayıcı listede kalmaya devam eder.',
        claveBorrada: 'Anahtar silindi',
        guardar: 'Kaydet',
        guardado: (n: string) => `${n} kaydedildi`,
        redLocalTitulo: 'Bu bilgisayardaki veya yerel ağdaki sunucu',
        redLocalTexto: (h: string) =>
          `${h} bu bilgisayara veya yerel ağa işaret ediyor. WolfCore Dev yalnızca siz onaylarsanız bağlanır. Bu size ait bir sunucu mu?`,
        redLocalConfirmar: 'Evet, bana ait',
        cambiaTitulo: 'Anahtarı başka bir sunucuya gönder',
        cambiaTexto: (h: string) =>
          `Sağlayıcının kayıtlı bir anahtarı var ve sunucu ya da kullanıcı değişti. Anahtar ${h} adresine gönderilecek. Devam edilsin mi?`,
        cambiaConfirmar: 'Evet, devam et',
      },
      env: {
        titulo: (n: string) => `${n} sağlayıcısını bir projede kullan`,
        proyecto: 'Proje',
        sinProyectos: 'Henüz proje yok.',
        yaUsaSmtp: 'Bu proje zaten bir SMTP sağlayıcısıyla gönderiyor.',
        volverCaptador: 'Yerel yakalayıcıya dön',
        volvio: (n: string) =>
          `${n} yeniden yerel yakalayıcıya gönderiyor ancak .env dosyasına dokunulmadı: sağlayıcının MAIL_* değişkenlerini koruyor. E-posta bloğunu yeniden yazın.`,
        incluirClave: 'Anahtarı da .env dosyasına yaz',
        incluirClaveAyuda: 'İşaretlenmezse blok MAIL_PASSWORD içermez ve elle eklersiniz.',
        sinClaveGuardada: 'Sağlayıcının kayıtlı bir anahtarı yok.',
        vista: '.env değişiklikleri (anahtar maskeli)',
        textoPlano:
          'Anahtar projenin .env dosyasında düz metin olarak kalacaktır. Bu klasöre veya yüklerseniz deponuza erişen herkes okuyabilir.',
        claveTitulo: 'Anahtarı .env dosyasına yaz',
        claveTexto:
          'Anahtar projenin .env dosyasına düz metin olarak kaydedilir. Yalnızca proje bir depoya yüklenmiyorsa ve klasör sadece size aitse kullanın.',
        claveConfirmar: 'Anlıyorum, anahtarı ekle',
        agregarGitignore: '.env dosyasını .gitignore içine ekle',
        gitignoreTitulo: '.gitignore dosyasını değiştir',
        gitignoreTexto:
          'Projenin .gitignore dosyasına .env satırı eklenir (önceden yedek alınır).',
        gitignoreConfirmar: 'Ekle',
        versionadoTitulo: 'Git zaten .env dosyasını izliyor',
        versionadoTexto:
          'Sonraki commit değerlerini yükler. git rm --cached .env ile dizinden çıkarın.',
        desconocidoTitulo: 'git kontrol edilemedi',
        desconocidoTexto: 'git’in bu projenin .env dosyasını izleyip izlemediği belirlenemedi.',
        aceptarVersionado: 'Yine de yaz',
        aceptarTitulo: 'İzlenen bir .env dosyasına yaz',
        aceptarTexto:
          'git .env dosyasını izliyorsa bu değişkenler depoya gidebilir. Yine de yazılsın mı?',
        aceptarConfirmar: 'Yine de yaz',
        confirmarTitulo: '.env dosyasına yaz',
        confirmarTexto: (ruta: string) =>
          `${ruta} yedeği kaydedilecek ve anahtar olmadan MAIL_* değişkenleri eklenecektir.`,
        confirmarTextoClave: (ruta: string) =>
          `${ruta} yedeği kaydedilecek ve düz metin anahtarla birlikte MAIL_* değişkenleri eklenecektir.`,
        confirmar: 'Yaz',
        escribir: '.env dosyasına yaz',
        escrito: (n: string) => `${n} artık bu sağlayıcı üzerinden gönderiyor`,
      },
    },
    estado: 'Durum',
    smtp: 'SMTP',
    buzon: 'Web gelen kutusu',
    abrirBuzon: 'Gelen kutusunu aç',
    noLeidos: 'Okunmamış',
    noLeidosValor: (n: number) => plural(n, 'okunmamış e-posta', 'okunmamış e-posta'),
    noLeidosError: 'Gelen kutusu okunamadı',
    actualizar: 'E-postaları yeniden say',
    actualizaSolo: 'Bu ekran açıkken her 15 saniyede bir güncellenir.',
    env: 'Laravel .env bloğu',
    envAyuda: (captador: string) =>
      `Projenizin .env dosyasına yapıştırın. E-postalar şifresiz ve kullanıcısız olarak ${captador} içinde kalır.`,
    copiarEnv: 'Bloğu kopyala',
    irAServicios: 'Hizmetlere git',
    cargando: 'Yakalayıcılar okunuyor…',
    errorLista: 'Yakalayıcı listesi okunamadı',
    captador: {
      opcional: 'İsteğe bağlı',
      elegido: 'Projelerinizin e-postalarını alır',
      noInstalado: 'Yüklü değil',
      instalar: 'Yükle',
      usar: 'Bunu kullan',
      apagar: 'Durdur',
      iniciando: 'Başlatılıyor…',
      avisoMantenimiento:
        'Bu yakalayıcı neredeyse hiç güncellenmiyor. Mailpit veya smtp4dev tercih edin.',
    },
    notaDescartados:
      'MailHog ve MailDev sunulmuyor: MailHog indirmeyi doğrulayacak bir özet yayınlamıyor ve MailDev yalnızca npm üzerinde var. Doğrulanabilir özet olmadan hiçbir şey indirilmez.',
    notaHost:
      'Web gelen kutuları yalnızca 127.0.0.1 üzerinde yanıt verir ancak açıkken kötü amaçlı bir web sitesi DNS rebinding ile okumayı deneyebilir. smtp4dev ve Papercut yabancı Host başlıklarını reddeder; Mailpit bu bilgisayara özel gizli bir yoldan sunulur; Inbucket korumasızdır, kullanmadığınızda kapatın.',
  },
  ia: {
    descripcion:
      'Bulut yapay zekâ sağlayıcıları ve Ollama ile yerel modeller. Anahtarlar bu bilgisayarda şifreli saklanır ve asla gösterilmez.',
    nube: {
      titulo: 'Bulut yapay zekâ',
      agregar: 'Sağlayıcı ekle',
      vacio:
        'Henüz sağlayıcı eklemediniz. OpenAI, Anthropic, Gemini, Hermes (Nous) veya OpenAI uyumlu bir sağlayıcı ekleyin.',
      errorLista: 'Sağlayıcı listesi okunamadı',
    },
    local: { titulo: 'Yerel yapay zekâ (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'OpenAI uyumlu',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Anahtar',
      sinClave: 'Anahtar yok',
      claveIlegible: 'Kayıtlı (okunamadı)',
      url: 'Temel URL',
      modeloPorDefecto: 'Varsayılan model',
      ninguno: 'Yok',
      probarConexion: 'Bağlantıyı test et',
      probarConexionAyuda: 'Sağlayıcının modellerini listeler. Belirteç harcamaz.',
      probando: 'Test ediliyor…',
      conectado: (ms: number, n: number) => `Bağlandı · ${ms} ms · ${n} model`,
      verModelos: (n: number) => `${n} modeli gör`,
      soloGratuitos: 'Yalnızca ücretsizler',
      fallo: 'Bağlanılamadı',
      probarMensaje: 'Mesaj test et',
      probarMensajeAyuda:
        'Modelin yanıt verdiğini doğrulamak için kısa sabit bir mesaj gönderir. Az sayıda belirteç harcar.',
      elegirModelo: 'Mesaj için model',
      sinModelo: 'Bir model seçmek için bağlantıyı test edin veya varsayılan bir model belirleyin.',
      enviando: 'Gönderiliyor…',
      respuesta: (ms: number) => `${ms} ms içinde yanıt`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} giriş belirteci, ${salida} çıkış belirteci`,
      usar: 'Projede kullan',
      editar: 'Düzenle',
      borrar: 'Sil',
      acciones: (nombre: string) => `${nombre} işlemleri`,
    },
    costo: {
      titulo: 'Mesaj test et',
      texto: (modelo: string, proveedor: string) =>
        `${proveedor} sağlayıcısının ${modelo} modeline kısa ve sabit bir mesaj gönderilecektir. Hesabınızdan belirteç harcar: yanıt 16 belirteçle sınırlıdır ve genellikle kuruşun kesirleri kadar tutar.`,
      enviar: 'Mesajı gönder',
    },
    dialogo: {
      nuevo: 'Yapay zekâ sağlayıcısı ekle',
      editar: (nombre: string) => `${nombre} düzenle`,
      tipo: 'Tür',
      preset: 'Uyumlu sağlayıcı',
      presetAyuda: 'Ad ve URL’yi doldurur; değiştirebilirsiniz.',
      presetOtro: 'Diğer',
      documentacion: 'Belgeleri gör',
      nombre: 'Ad',
      urlBase: 'Temel URL',
      urlAyuda: 'Boş = resmi adres. Yalnızca https:// veya 127.0.0.1 / [::1] için http:// (LM Studio).',
      urlObligatoria: 'Uyumlu sağlayıcının temel URL’sini yazın.',
      modelo: 'Varsayılan model (isteğe bağlı)',
      modeloAyuda: '.env bloğunda (AI_MODEL) ve test mesajında kullanılır.',
      clave: 'API anahtarı',
      claveNueva: 'Anahtarı yapıştırın',
      claveGuardada: (final: string) =>
        `Kayıtlı bir anahtar var (${final}). Yalnızca değiştirmek istiyorsanız yenisini yazın.`,
      claveAyuda:
        'Bu bilgisayarda şifreli saklanır ve bir daha gösterilmez. Yalnızca son 4 karakter görünür.',
      claveOpcional: 'Yerel sunucular (LM Studio) için isteğe bağlıdır.',
      borrarClave: 'Anahtarı sil',
      guardar: 'Kaydet',
      guardado: (nombre: string) => `${nombre} kaydedildi`,
      urlCambiaTitulo: 'Anahtar başka bir URL’ye gidecek',
      urlCambiaTexto: (url: string) =>
        `Bu sağlayıcının kayıtlı bir anahtarı var ve artık ${url} adresine gönderilecek. Yalnızca o sunucuya güveniyorsanız onaylayın.`,
      urlCambiaConfirmar: 'Anahtarı yeni URL’ye gönder',
    },
    borrar: {
      claveTitulo: (nombre: string) => `${nombre} anahtarı silinsin mi?`,
      claveTexto:
        'Anahtar bu bilgisayardan silinir. Yazdığınız .env dosyalarına dokunulmaz: iptal ederseniz oralarda da değiştirin.',
      proveedorTitulo: (nombre: string) => `${nombre} silinsin mi?`,
      proveedorTexto:
        'Sağlayıcı ve kayıtlı anahtarı silinir. Projelerinizin .env dosyalarına dokunulmaz.',
      respaldos: (n: number) =>
        `Bu anahtarı düz metin içeren ${n} projenin .env yedeklerini de sil`,
      respaldosAyuda:
        'WolfCore Dev yazmadan önce projelerin dışında .env yedekleri tutar. Silmek geri alınamaz.',
      claveBorrada: 'Anahtar silindi',
      proveedorBorrado: (nombre: string) => `${nombre} silindi`,
      respaldosBorrados: (n: number) => `${n} projenin .env yedekleri silindi`,
    },
    env: {
      titulo: (nombre: string) => `${nombre} sağlayıcısını bir projede kullan`,
      proyecto: 'Proje',
      sinProyectos: 'Hazırlanmış proje yok.',
      modelo: 'Model (AI_MODEL)',
      modeloAyuda: 'İsteğe bağlı. Listeden seçin veya yazın.',
      vista: '.env dosyasına yazılacak blok (anahtar maskeli gösterilir)',
      cargando: 'Önizleme hazırlanıyor…',
      textoPlano:
        'Anahtar projenin .env dosyasında düz metin olarak kalacaktır. Bu klasöre erişen herkes okuyabilir.',
      copiaPrevia:
        'Mevcut .env öncesinde proje dışına (WolfCore Dev veri klasörüne) kopyalanır.',
      sinClave: 'Bu sağlayıcı bir anahtar gerektirir: projede kullanmadan önce kaydedin.',
      gitignoreFalta: 'Projenin .gitignore dosyası .env dosyasını yok saymıyor.',
      gitignoreNoExiste: 'Projenin .gitignore dosyası yok.',
      gitignoreOk: '.gitignore zaten .env dosyasını yok sayıyor.',
      agregarGitignore: '.env dosyasını .gitignore içine ekle',
      gitignoreTitulo: '.gitignore dosyasını değiştir',
      gitignoreTexto:
        'Projenin .gitignore dosyasına .env satırı eklenir (veya dosya oluşturulur), önceden kopya alınır.',
      gitignoreConfirmar: '.gitignore içine ekle',
      versionadoTitulo: 'Git bu projenin .env dosyasını zaten izliyor',
      versionadoTexto:
        '.gitignore içinde olsa bile sonraki commit anahtarı yükler. Yazmadan önce dizinden çıkarıp commit edin:',
      desconocidoTitulo: 'git’in .env dosyasını izleyip izlemediği kontrol edilemedi',
      desconocidoTexto:
        'Git yanıt vermedi (yüklü değil veya klasör güvenilir değil). .env zaten depodaysa sonraki commit anahtarı yükler. Şununla kontrol edin:',
      aceptarVersionado: 'Riski anlıyorum: anahtarı yine de yaz',
      aceptarTitulo: 'git anahtarı yükleyebilecek olsa da yaz',
      aceptarTexto:
        '.env depodaysa anahtar sonraki commit ve geçmişte yer alır. Yalnızca git rm --cached .env çalıştırdıysanız veya depo tamamen size aitse devam edin.',
      aceptarConfirmar: 'Riski kabul ediyorum',
      conflictoTitulo: '.env bu değişkenleri zaten başka bir değerle tanımlıyor',
      reemplazar: (claves: string) => `${claves} değiştir`,
      reemplazarTitulo: '.env değişkenlerini değiştir',
      reemplazarTexto: (claves: string) =>
        `.env içindeki mevcut ${claves} satırları kaldırılıp WolfCore Dev bloğu yazılacaktır. Önceki .env önceden kopyalanır.`,
      reemplazarConfirmar: 'Değiştir',
      escribir: '.env dosyasına yaz',
      confirmarTitulo: 'Anahtarı düz metin olarak yaz',
      confirmarTexto: (carpeta: string) =>
        `Anahtar şifresiz olarak ${carpeta} içine yazılacaktır. Bu dosyayı paylaşmayın ve bir depoya yüklemeyin.`,
      confirmar: 'Anahtarı yaz',
      escrito: (proyecto: string) => `Yapay zekâ bloğu ${proyecto} projesinin .env dosyasına yazıldı`,
      copiarComando: 'Komutu kopyala',
    },
  },
  iaLocal: {
    descripcion:
      'Ollama ile bilgisayarınızda çalışan dil modelleri. Verilerinizi internete göndermeden projelerinizde kullanın.',
    sinInstalarTitulo: 'Ollama yüklü değil',
    sinInstalar: 'Bilgisayarınızda model indirmek ve kullanmak için Hizmetler bölümünden yükleyin.',
    irAServicios: 'Hizmetlere git',
    apagadoTitulo: 'Ollama kapalı',
    apagado: 'Modelleri görmek, indirmek ve test etmek için başlatın.',
    iniciando: 'Ollama başlatılıyor…',
    errorTitulo: 'Ollama başlatılamadı',
    encender: 'Ollama’yı başlat',
    verServicios: 'Hizmetlerde gör',
    modelos: 'Yüklü modeller',
    sinModelos: 'Henüz model yok. Aşağıdan bir tane indirin.',
    errorModelos: 'Model listesi okunamadı',
    recargar: 'Listeyi yeniden yükle',
    total: (n: number) => plural(n, 'model', 'model'),
    espacio: 'Kullanılan alan',
    espacioAyuda: 'Tüm modellerin veri klasöründe kapladığı alan.',
    probarDe: (modelo: string) => `${modelo} test et`,
    borrarDe: (modelo: string) => `${modelo} sil`,
    borrarTitulo: (modelo: string) => `${modelo} modeli silinsin mi?`,
    borrarTexto: (tamano: string) =>
      `Diskte ${tamano} yer açılır. Yeniden kullanmak için tekrar indirmeniz gerekir.`,
    borrado: (modelo: string) => `${modelo} modeli silindi`,
    descargar: {
      titulo: 'Model indir',
      campo: 'Model adı',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Ollama’nın kullandığı adı (ollama.com/library) yazın veya bir öneri seçin.',
      sugerenciaAyuda: {
        'llama3.2': 'Genel sohbet, hafif',
        'qwen2.5-coder': 'Kodlama',
        mistral: 'Genel sohbet',
        'nomic-embed-text': 'Aramalar için embedding (botlar)',
      } as Record<string, string>,
      boton: 'İndir',
      invalido: 'Harf, rakam ve . _ : / - kullanın (ör. llama3.2)',
      yaInstalado: 'Bu model zaten yüklü',
      enCurso: 'Bu model zaten indiriliyor',
      confirmarTitulo: (modelo: string) => `${modelo} indirilsin mi?`,
      confirmarTexto:
        'Modeller genellikle birkaç GB boyutundadır (boyuta göre 1 GB’den 40 GB’nin üzerine). Ollama başlamadan boyutu bildirmez: ilerleme çubuğunda görebilir ve istediğiniz zaman iptal edebilirsiniz.',
      confirmar: 'İndir',
    },
    progreso: {
      fases: {
        preparando: 'Hazırlanıyor…',
        descargando: 'İndiriliyor',
        verificando: 'Doğrulanıyor',
        guardando: 'Kaydediliyor',
        listo: 'Hazır',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} / ${total}`,
      cancelarDe: (modelo: string) => `${modelo} indirmesini iptal et`,
      cancelando: 'İptal ediliyor…',
      listo: (modelo: string) => `${modelo} indirildi`,
      cancelado: (modelo: string) => `${modelo} indirmesi iptal edildi`,
      error: (modelo: string) => `${modelo} indirilemedi`,
      descartar: 'Kapat',
      descartarDe: (modelo: string) => `${modelo} bildirimini kapat`,
    },
    prueba: {
      titulo: 'Bir modeli test et',
      modelo: 'Model',
      elegir: 'Bir model seçin',
      prompt: 'Mesaj',
      placeholder: 'Kısa bir soru yazıp Enter’a basın',
      enviar: 'Gönder',
      respuesta: 'Yanıt',
      pensando: 'Model yanıt veriyor… ilk seferde yüklenirken biraz sürebilir.',
      vacia: '(Model metin döndürmedi.)',
      sinModelos: 'Test etmek için bir model indirin.',
    },
    conexion: {
      titulo: 'Projelerinizden bağlantı',
      base: 'Ollama temel URL',
      openai: 'OpenAI uyumlu uç nokta',
      env: '.env dosyası için blok',
      envAyuda:
        'Laravel veya FastAPI botu için uygundur. WolfCore Dev projelerinize yazmaz.',
      copiarEnv: 'Bloğu kopyala',
      copiarDato: (dato: string) => `${dato} kopyala`,
    },
    etapaB:
      'Hermes Agent, Claude Code ve Codex, Aşama B’de tek tıklamayla bu modellere bağlanabilecektir.',
  },
  proyectos: {
    titulo: 'Projeler',
    descripcion:
      'Her proje kendi .test sitesi, kurulum reçetesi ve işlemleri olan bir klasördür.',
    agregar: 'Proje ekle',
    vacioTitulo: 'Henüz proje yok',
    vacio:
      'Bir GitHub deposu klonlayın veya bir klasör seçin: WolfCore Dev proje türünü algılar ve adım adım hazırlar.',
    pasos: {
      porTipo: {
        'composer-install': 'PHP bağımlılıklarını yükle (composer install)',
        'env-crear': '.env dosyasını oluştur',
        'key-generate': 'Uygulama anahtarını oluştur',
        'bd-crear': 'Veritabanını oluştur',
        'bd-restaurar': 'Yedeği geri yükle',
        migrar: 'Veritabanı geçişlerini çalıştır',
        'storage-link': 'storage bağlantısını oluştur (storage:link)',
        'npm-ci': 'Node bağımlılıklarını yükle (npm ci)',
        'npm-build': 'Kaynakları derle (npm run build)',
        'python-venv': 'Sanal ortam oluştur (.venv)',
        'pip-install': 'Python bağımlılıklarını yükle (pip)',
        'pgvector-activar': 'Veritabanında pgvector etkinleştir',
        'sitio-crear': 'Siteyi oluştur',
        comando: 'Proje komutu',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `${dominio} sitesini oluştur` : 'Siteyi oluştur'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `${archivo} yedeğini geri yükle` : 'Yedeği geri yükle',
      migrar: 'Veritabanı geçişlerini çalıştır',
      migrarSemilla: 'Geçişleri çalıştır ve test verisi yükle (--seed)',
      comando: (linea: string) => (linea ? `Çalıştır: ${linea}` : 'Proje komutu'),
    },
    estadoPaso: {
      pendiente: 'Bekliyor',
      corriendo: 'Çalışıyor',
      listo: 'Hazır',
      error: 'Hata',
      omitido: 'Atlandı',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Hazırlanmadı',
      corriendo: 'Hazırlanıyor…',
      lista: 'Hazır',
      error: 'Bir adım başarısız oldu',
      cancelada: 'Hazırlık iptal edildi',
      incompleta: 'Hazırlık yarım kaldı',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Proje ekle',
      pestanas: { github: 'GitHub', url: 'Git URL', carpeta: 'Klasör' },
      destino: 'Hedef klasör',
      destinoAyuda: (base: string) =>
        `${base} içine klonlanır. Başka bir yer için "Klasör seç…" kullanın.`,
      nombreCarpeta: 'Klasör adı',
      nombrePlaceholder: 'projem',
      elegirDestino: 'Klasör seç…',
      destinoPorDefecto: 'Projeler klasörünü kullan',
      clonar: 'Klonla',
      clonando: 'Klonlanıyor…',
      clonado: 'Depo klonlandı',
      errorClonar: 'Depo klonlanamadı',
      sinCancelar:
        'Klonlama buradan kesilemez: bitmesini bekleyin (birkaç dakika sürebilir).',
      sinGit: 'Git yüklü değil. Yükleyin (git-scm.com) ve bu pencereyi yeniden açın.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `GitHub CLI ile ${usuario} olarak bağlı` : 'GitHub CLI ile bağlı',
      estadoToken: 'Kişisel belirteçle bağlı',
      estadoNinguna: 'GitHub bağlantısı yok',
      ayudaNinguna:
        'GitHub CLI ile oturum açın (önerilir) veya içerik okuma izinli kişisel belirteç kullanın.',
      instalarGh: 'GitHub CLI yükle',
      instalandoGh: 'GitHub CLI yükleniyor…',
      ghInstalado: 'GitHub CLI yüklendi. Şimdi oturum açın.',
      iniciarSesion: 'Oturum aç',
      sesionAbierta:
        'Oturum açmak için bir pencere açıldı. Bitirdiğinizde "Yeniden kontrol et" düğmesine basın.',
      comprobar: 'Yeniden kontrol et',
      usarToken: 'Belirteç kullan',
      token: 'GitHub kişisel belirteci',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Bu bilgisayarda şifreli saklanır, bir daha gösterilmez ve projelere yazılmaz.',
      guardarToken: 'Belirteci kaydet',
      tokenGuardado: 'Belirteç kaydedildi',
      quitarToken: 'Belirteci kaldır',
      tokenQuitado: 'Belirteç kaldırıldı',
      buscar: 'Depo ara',
      cargando: 'Depolar yükleniyor…',
      sinRepos: 'Depo bulunamadı.',
      cargarMas: 'Daha fazla yükle',
      privado: 'Özel',
      yaClonado: 'Zaten klonlandı',
      yaClonadoAyuda: 'Bu depoya veya hedef klasörüne ait bir proje zaten var.',
      actualizado: (fecha: string) => `Güncellendi: ${fecha}`,
      elegir: 'Seç',
      errorRepos: 'Depo listesi okunamadı',
    },
    url: {
      etiqueta: 'Depo URL’si',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:ruta veya usuario/proyecto (GitHub). URL’de kullanıcı adı veya parola olmasın.',
      invalida: 'https://…, git@host:ruta veya usuario/proyecto biçimini kullanın',
    },
    carpeta: {
      titulo: 'Bilgisayarda zaten bulunan proje',
      texto: 'Klasörü seçin: proje türü algılanır ve reçetesi önerilir.',
      elegir: 'Klasör seç',
      manual: 'Reçetesiz ekle (elle yapılandırma)',
      yaEsProyecto: (nombre: string) => `Bu klasör zaten ${nombre} projesidir.`,
      vigilarTitulo: 'İzlenen klasör',
      vigilarTexto:
        'Proje gibi görünen yeni bir klasör belirdiğinde WolfCore Dev sizi bilgilendirir. Depolar da buraya klonlanır.',
      vigilando: (carpeta: string) => `İzleniyor: ${carpeta}`,
      sinVigilar: 'Hiçbir klasör izlenmiyor.',
      vigilar: 'İzlenecek klasörü seç',
      cambiarVigilada: 'Değiştir',
      dejarDeVigilar: 'İzlemeyi bırak',
    },
    asistente: {
      titulo: (nombre: string) => `${nombre} projesini hazırla`,
      cargando: 'Proje inceleniyor…',
      origenYml: 'Reçete deponun wolfcore.yml dosyasından geliyor.',
      origenDefecto: 'Proje türüne göre önerilen reçete.',
      deteccion: 'Algılananlar',
      deteccionAyuda: 'Projeyle uyuşmayan bir şey varsa düzeltin.',
      tipo: 'Tür',
      php: 'PHP',
      phpNinguno: 'Yüklü yok',
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
      versionAuto: 'Algılanan',
      servicios: 'Hizmetler',
      serviciosNinguno: 'Yok',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Algılandı: ${v}`,
      nodeInstalar: 'Yüklü Node yok: Hizmetler bölümünden yükleyin.',
      pythonInstalar: 'Yüklü Python yok: Hizmetler bölümünden yükleyin.',
      lenguajeInstalar: (nombre: string) => `Yüklü ${nombre} yok: Hizmetler bölümünden yükleyin.`,
      dominio: 'Alan adı',
      puertoProxy: 'Yerel bağlantı noktası',
      puertoPlaceholder: '8000',
      receta: 'Adımlar',
      recetaAyuda:
        'Sırayla çalıştırılır. İstemediklerinizi kapatın; isteğe bağlı olanları taşıyabilirsiniz.',
      subir: 'Yukarı',
      bajar: 'Aşağı',
      fijo: 'Bu adım zorunludur',
      restaurar: 'Yedek geri yükle…',
      cambiarRespaldo: 'Yedeği değiştir',
      quitarRespaldo: 'Yedeği kaldır',
      sobrescribir: 'Zaten tabloları varsa veritabanının üzerine yaz',
      semilla: 'Test verileri yükle (--seed)',
      sinMotor:
        'Veritabanı yok: oluşturmak veya yedek geri yüklemek için Hizmetler bölümünden bir motor seçin.',
      confio: 'Bu depoya güveniyorum: kurulum adımlarını çalıştır',
      confioAyuda:
        'Adımlar bilgisayarınızda proje programlarını (composer, npm, pip, geçişler) çalıştırır. Yalnızca kodu tanıyorsanız işaretleyin.',
      montar: 'Projeyi kur',
      montando: 'Proje kuruluyor…',
      reintentar: 'Yeniden dene',
      omitir: 'Atla',
      cancelar: 'İptal',
      cancelando: 'İptal ediliyor…',
      cerrar: 'Kapat',
      cerrarCorriendo: 'Gizle (arka planda sürer)',
      abrirSitio: 'Siteyi aç',
      verRegistro: 'Kaydı gör',
      ocultarRegistro: 'Kaydı gizle',
      listo: 'Proje hazır.',
      fallo: (paso: string) => `Başarısız: ${paso}. Yeniden deneyin, atlayın veya iptal edin; hiçbir şey geri alınmadı.`,
      cancelada: 'Hazırlık iptal edildi. Proje kartından devam edebilirsiniz.',
      incompleta: 'Çalıştırılmamış adımlar kaldı.',
      errorCrear: 'Proje oluşturulamadı',
      errorReceta: 'Reçete okunamadı',
      recetaCambio:
        'Proje reçetesi (wolfcore.yml) güvendiğinizden beri değişti. Yeniden dene son kayıtlı reçeteyi kullanır.',
      recargar: 'Yeni reçeteyi incele',
      seguirGuardada: 'Kayıtlı olanla devam et',
      soloLectura:
        'Tür, PHP, alan adı, sürümler ve bağlantı noktası projeye aittir: Düzenle ile değiştirin.',
    },
    tarjeta: {
      receta: 'Hazırlık',
      reinstalar: 'Bağımlılıkları yeniden yükle',
      reinstalarTitulo: (nombre: string) => `${nombre} reçetesi çalıştırılsın mı?`,
      reinstalarTexto:
        'Son hazırlığın adımları (sihirbazda inceledikleriniz) tekrarlanır:',
      noRestaura: 'yeniden geri yüklenmez',
      recetaCambio:
        'Proje reçetesi (wolfcore.yml) güvendiğinizden beri değişti. Yeniden yükle kayıtlı olanı tekrarlar; yenisi için "Reçeteyi incele" kullanın.',
      revisarReceta: 'Reçeteyi incele',
      preparar: 'Hazırla…',
      ejecutar: 'Çalıştır',
      verPreparacion: 'Hazırlığı gör',
      sinConfianza:
        'Çalıştırmak için sihirbazda reçeteyi inceleyin ve "Bu depoya güveniyorum" seçeneğini işaretleyin.',
      runtimes: 'Sürüm bildirimleri',
      verRegistros: 'Kayıtları gör',
      abrirAgente: 'Yapay zekâ ajanı aç',
      vscode: 'Düzenleyici',
      vscodeAyuda: 'Proje klasörünü varsayılan düzenleyicide aç',
      vscodeError: 'Düzenleyici açılamadı',
      baseDatos: 'Veritabanı',
      baseDatosAyuda: (base: string) =>
        `«${base}» veritabanını oturumu açık şekilde aç (Adminer veya phpMyAdmin)`,
      baseDatosSinDetectar: 'Projenin veritabanını aç (Adminer veya phpMyAdmin)',
      sinBase: 'Projenin .env dosyası bir MySQL, MariaDB veya PostgreSQL veritabanı tanımlamıyor.',
      adminerNoListo: 'Adminer hazır değil',
      entradaAutomatica: 'Parola yazmadan doğrudan oturum açarak girer.',
      elegirBd: 'Adminer veya phpMyAdmin seç',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (yalnızca MySQL ve MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin hazır değil',
      entroComoAdmin: (usuario: string) =>
        `Bu proje özel kullanıcı kullanmadığı için sunucu yöneticisi ${usuario} olarak giriş yapıldı. .env yöneticisinde «Özel kullanıcı kullan» yalnızca bu veritabanına sınırlı bir kullanıcı oluşturur.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Sunucu yöneticisi ${usuario} olarak giriş yapıldı: bu projenin özel kullanıcı parolası bu bilgisayarda kayıtlı değil. .env yöneticisinde «Özel kullanıcı kullan» yeni bir tane oluşturur.`,
      abrirSitio: 'Siteyi tarayıcıda aç',
      github: 'Depo',
      abrirRemoto: (url: string) => `${url} aç`,
      confiado: 'Güvenilir',
      confiadoAyuda: 'Kurulum adımları çalıştırılabilir.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Ayrılmış HEAD',
      cambios: (n: number) => plural(n, 'kaydedilmemiş değişiklik', 'kaydedilmemiş değişiklik'),
      limpio: 'Değişiklik yok',
      atras: (n: number) => `${n} çekilecek`,
      adelante: (n: number) => `${n} gönderilecek`,
      traer: 'Değişiklikleri çek',
      traerAyuda: 'Birleştirmesiz git pull: yerel değişiklik veya ayrışmış dal varsa hiçbir şeye dokunmaz.',
      alDia: 'Zaten güncel.',
      actualizado: 'Değişiklikler çekildi',
      sugeridosTitulo: 'Değişiklikler çekildi',
      sugeridosTexto: 'Değişenlere göre şu adımları çalıştırmanız önerilir:',
      sugeridosNinguno: 'Hiçbir adım çalıştırmaya gerek yok.',
      migracionesNuevas: (n: number) => plural(n, 'yeni geçiş', 'yeni geçiş'),
      ejecutarSugeridos: 'Adımları çalıştır',
      corridaTitulo: 'Çekme sonrası adımlar',
      corridaAyuda: 'Projenin kayıtlı reçetesini değiştirmez.',
      ahoraNo: 'Şimdi değil',
      errorEstado: 'Git durumu okunamadı',
      commitIa: {
        boton: 'Commit öner',
        ayuda:
          'Hazırlanan değişiklikler (git add) için yapay zekâyla mesaj önerir ve onaylarsanız commit eder.',
        titulo: 'Önerilen mesajla commit',
        proveedor: 'Yapay zekâ sağlayıcısı',
        modelo: 'Model',
        sinProveedores:
          'Mesaj önermek için bir bulut yapay zekâ sağlayıcısı (Yapay Zekâ ekranı) yapılandırın.',
        privacidad:
          'Sağlayıcıya yalnızca hazırlananların farkı gönderilir (.env, anahtarlar, sertifikalar, kimlik dosyaları ve ikili dosyalar hariç; en fazla 20 000 karakter). Az belirteç harcar.',
        sugerir: 'Mesaj öner',
        mensaje: 'Mesaj (düzenleyebilirsiniz)',
        commit: 'Commit yap',
        commitAyuda: 'Yalnızca hazırlananlar (git add): dosya eklemez ve push yapmaz.',
        hecho: 'Hazırlanan değişikliklerle commit yapıldı.',
      },
    },
    procesos: {
      titulo: 'İşlemler',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Hatasız sonlandı',
      ninguno: 'İşlem yok. npm run dev, queue:work, uvicorn… ekleyin.',
      agregar: 'İşlem ekle',
      editar: 'İşlemi düzenle',
      nuevo: 'Yeni işlem',
      interruptor: (nombre: string) => `${nombre} başlat veya durdur`,
      proxy: 'Vekil',
      proxyAyuda: 'Nginx siteyi bu işleme yönlendirir.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'yeniden başlatma', 'yeniden başlatma'),
      verLog: 'Kaydı gör',
      ocultarLog: 'Kaydı gizle',
      logVacio: 'Henüz çıktı yok.',
      abrirCarpetaLog: 'Kayıt klasörünü aç',
      quitar: 'İşlemi kaldır',
      quitarTitulo: (nombre: string) => `${nombre} işlemi kaldırılsın mı?`,
      quitarTexto: 'Çalışıyorsa durdurulur.',
      nombre: 'Ad',
      nombrePlaceholder: 'Vite',
      comando: 'Komut',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Kabuksuz program ve argümanlar. Boşluklu argümanlar için tırnak kullanın.',
      cwd: 'Klasör',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz veya projenin bir alt klasörü (ör. frontend).',
      puertoCampo: 'Bağlantı noktası',
      puertoNinguno: 'Yok',
      puertoAyuda: 'İşlem vekil hedefi değilse yalnızca bilgi amaçlıdır.',
      autoIniciar: 'WolfCore Dev açıldığında başlat',
      reiniciar: 'Çökerse yeniden başlat',
      esProxy: 'Nginx vekil hedefi',
      requiereReinicio:
        'İşlem çalışıyor: komut, klasör veya bağlantı noktası değişiklikleri yeniden başlatınca uygulanır.',
      reinicieAhora: 'Kaydedildi. Değişiklikleri uygulamak için işlemi durdurup başlatın.',
      guardado: 'İşlem kaydedildi',
      errores: {
        comando: 'Komutu yazın',
        puerto: 'Bağlantı noktası 1 ile 65535 arasında olmalıdır',
        proxySinPuerto: 'Vekil hedefi için bir bağlantı noktası gerekir',
        cwd: 'raiz veya proje içinde bir alt klasör kullanın',
        repetido: 'Bu adda bir işlem zaten var',
      },
      estados: {
        encendido: 'Çalışıyor',
        apagado: 'Durduruldu',
        iniciando: 'Başlatılıyor…',
        error: 'Hata',
        externo: 'Harici',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `${nombre} kayıtları`,
      fuente: 'Kaynak',
      ninguna: 'Bu projenin henüz kaydı yok.',
      vacio: 'Kayıt boş.',
      actualizar: 'Yenile',
      abrirCarpeta: 'Klasörü aç',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Proje gibi görünen yeni bir klasör var'
          : `Proje gibi görünen ${n} yeni klasör var`,
      montar: 'Hazırla',
      ignorar: 'Yok say',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Okunmamış e-posta',
    correoApagado: 'Mailpit kapalı',
    correoSinInstalar: 'Mailpit yüklü değil',
    modelos: 'Yapay zekâ modelleri',
    iaApagada: 'Ollama kapalı',
    iaSinInstalar: 'Ollama yüklü değil',
    sinLeer: 'Okunamadı',
    sinDato: '—',
  },
  /* ───────────── Panel de rendimiento, visor de registros y MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/sn',
    porcentaje: '%',
    segundos: 'sn',
    minutos: 'dk',
    horas: 'sa',
    dias: 'g',
    /** Trabajador N de un servicio (p. ej. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Performans',
    ventana: 'Son 5 dakika',
    pausado: 'Pencere gizliyken duraklatıldı',
    esperando: 'İlk ölçüm bekleniyor…',
    errorMuestreo: (detalle: string) => `Performans ölçümü istenemedi: ${detalle}`,
    cpu: 'CPU',
    ram: 'Bellek',
    disco: 'Veri diski',
    red: 'Ağ',
    deTotal: (usado: string, total: string) => `${usado} / ${total}`,
    libre: (libre: string) => `${libre} boş`,
    bajada: 'İndirme',
    subida: 'Yükleme',
    graficaCpu: (valor: string) => `Son 5 dakikanın CPU grafiği; şu an ${valor}`,
    graficaRam: (valor: string) => `Son 5 dakikanın bellek grafiği; şu an ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Son 5 dakikanın ağ grafiği; indirme ${bajada}, yükleme ${subida}`,
    alertas: {
      titulo: 'Uyarılar',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `${servicio} için ${puerto} bağlantı noktasını başka bir program kullanıyor: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Bilgisayar belleği %${porcentaje} dolu. Daha iyi yanıt için kullanmadıklarınızı kapatın.`,
      huerfano: (pid: number, puertos: number[]) =>
        `WolfCore Dev’e ait olmayan bir php-cgi (PID ${pid}) ${puertos.join(', ')} üzerinde dinliyor: önceki oturumdan kalmış.`,
      finalizar: 'İşlemi sonlandır',
      finalizarTitulo: 'Bu işlem sonlandırılsın mı?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) açık verileri kaydetmeden kapatılacaktır. Yalnızca o programın gerekmediğinden eminseniz kullanın.`,
      finalizado: (nombre: string) => `${nombre} sonlandırıldı`,
      verPuertos: 'Bağlantı noktalarını gör',
      errorPuertos: 'Hangi programların bağlantı noktalarını kullandığı kontrol edilemedi.',
    },
    procesos: {
      titulo: 'Hizmetler ve işlemler',
      vacio: 'Çalışan hizmet veya proje işlemi yok.',
      nombre: 'Ad',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Bağlantı noktası',
      encendido: 'Çalışıyor',
      acciones: 'İşlemler',
      detener: 'Durdur',
      registros: 'Kayıtları gör',
      servicio: 'Hizmet',
      proyecto: 'Proje',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Kayıtlar',
    descripcion:
      'Nginx, PHP, hizmetler, siteler, proje işlemleri ve tünellerin kayıtlarını canlı izleyin.',
    fuente: 'Kaynak',
    elegirFuente: 'Bir kayıt seçin',
    sinFuentes:
      'Henüz kayıt yok. Bir hizmet, site veya işlem ilk satırı yazdığında görünürler.',
    buscar: 'Metne göre filtrele',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Duraklat',
    reanudar: 'Sürdür',
    pausadoNuevas: (n: number) => `Duraklatılmış ${n} yeni satır`,
    copiar: 'Görüneni kopyala',
    copiadas: (n: number) => `${n} satır kopyalandı`,
    limpiar: 'Temizle',
    abrirCarpeta: 'Klasörü aç',
    alFinal: 'Sonu izle',
    mostrarMas: 'Daha fazla göster',
    ocultas: (n: number) => `Gösterilmeyen ${n} önceki satır`,
    vacio: 'Henüz satır yok. Yenileri yazıldıkça burada görünür.',
    sinCoincidencias: 'Filtreyle eşleşen satır yok.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} satır` : `${total} satırdan ${visibles}`,
    descartadas: (n: number) => `(son 5000 tutulur; en eski ${n} satır atıldı)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Hizmetler',
      sitio: 'Siteler',
      laravel: 'Laravel',
      proyecto: 'Proje işlemleri',
      tunel: 'Tüneller',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (erişim)',
      nginxError: 'Nginx (hatalar)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (erişim)`,
      sitioError: (dominio: string) => `${dominio} (hatalar)`,
      tunel: (sitio: string) => `${sitio} tüneli`,
      tunelSalida: (sitio: string) => `${sitio} tüneli (çıktı)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Değişikliği görmek için yeni bir terminal açın: açık terminaller bunu görmez.',
    enPathSinCliente: 'PATH içinde ancak komut eksik',
    reparar: 'Onar',
    repararTitulo: 'wolf komutu onarılsın mı?',
    repararTexto:
      'wolf PATH içinde ancak dosyaları eksik. Veri klasörüne yeniden kopyalanacak ve yerel sunucu başlatılacaktır.',
    titulo: 'Terminal: wolf komutu',
    descripcion:
      'PowerShell, cmd veya Git Bash’ten WolfCore Dev’i yönetin: wolf status, wolf use php@8.4, wolf share, wolf logs. Yalnızca uygulama açıkken çalışır.',
    activo: 'PATH’te kullanılabilir',
    enPathSinServidor: 'PATH’te, sunucu kapalı',
    inactivo: 'PATH içinde değil',
    agregarBoton: 'wolf’u PATH’e ekle',
    quitarBoton: 'wolf’u PATH’ten kaldır',
    agregarTitulo: 'wolf kullanıcı PATH’ine eklensin mi?',
    agregarTexto:
      'wolf komutu WolfCore Dev veri klasörüne kopyalanır, bu klasör kullanıcı PATH’inize eklenir (önceki PATH yedeklenir) ve her başlangıçta değişen bir anahtarla yalnızca wolf’a hizmet veren 127.0.0.1 yerel sunucusu başlatılır. Bir siteyi internette yayınlamak veya tüm terminallerin PHP’sini değiştirmek her zaman uygulama penceresinde de onay ister. İstediğiniz zaman kaldırabilirsiniz.',
    agregar: 'Ekle',
    quitarTitulo: 'wolf PATH’ten kaldırılsın mı?',
    quitarTexto:
      'wolf klasörü kullanıcı PATH’inizden kaldırılır, yerel sunucu durdurulur ve kopyalanan komut silinir. Açık terminaller değişmez.',
    quitar: 'Kaldır',
    listoTitulo: 'wolf komutu güncellendi',
    ayuda: 'Ekledikten sonra yeni bir terminal açın. Sunucu yalnızca 127.0.0.1 dinler.',
    aislado: 'Test veri klasörüyle (WOLFCORE_DATOS) PATH değiştirilmez.',
    errorCargar: (detalle: string) => `wolf durumu okunamadı: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP sunucusu',
    descripcion:
      'Claude Code ve diğer asistanların bu bilgisayardaki sitelerinizi, hizmetlerinizi ve veritabanlarınızı yönetmesini sağlar. Yalnızca 127.0.0.1 dinler ve belirteç ister.',
    estado: 'Durum',
    activo: 'Aktif',
    inactivo: 'Durduruldu',
    activar: 'Etkinleştir',
    detener: 'Durdur',
    activado: 'MCP sunucusu etkin',
    detenido: 'MCP sunucusu durduruldu',
    direccion: 'Adres',
    puerto: 'Bağlantı noktası',
    puertoAyuda: '1024 ile 65535 arası. Etkinse yeni bağlantı noktasında yeniden başlar.',
    puertoRango: '1024 ile 65535 arasında bir sayı kullanın',
    puertoGuardado: (p: number) => `MCP sunucusu ${p} bağlantı noktasını kullanacak`,
    copiarConfig: 'Claude Code yapılandırmasını kopyala',
    copiarConfigAyuda:
      'Belirteçli yapılandırmayı panoya kopyalar. Claude Code içine yapıştırın; belirteç burada gösterilmez.',
    configCopiada: 'Yapılandırma panoya kopyalandı',
    regenerar: 'Belirteci yenile',
    regenerarTitulo: 'MCP sunucusu belirteci yenilensin mi?',
    regenerarTexto:
      'Mevcut belirteç anında geçersiz olur: bağlı asistanların yeni yapılandırmayı kullanması gerekir.',
    regenerado: 'Belirteç yenilendi. Yapılandırmayı yeniden kopyalayın.',
    errorCargar: (detalle: string) => `MCP sunucusu durumu okunamadı: ${detalle}`,
    confirmacion: {
      titulo: 'Bir asistan onay istiyor',
      herramienta: 'Araç',
      pendientes: (actual: number, total: number) => `${actual} / ${total}`,
      aprobar: 'Onayla',
      rechazar: 'Reddet',
      aprobada: 'İşlem onaylandı',
      rechazada: 'İşlem reddedildi',
      vencida: 'İstek artık beklemede değil.',
      descartadas: (n: number) => `ve sığmayan ${n} tane daha (kendiliğinden süresi dolacak)`,
      falloRespuesta: (detalle: string) =>
        `Yanıt gönderilemedi; istek hâlâ beklemede. ${detalle}`,
      si: 'Evet',
      no: 'Hayır',
      campos: {
        motor: 'Motor',
        base: 'Veritabanı',
        archivo: 'Dosya',
        sobrescribir: 'Üzerine yaz',
        pid: 'PID',
        nombre: 'İşlem',
        proyecto: 'Proje',
        pasos: 'Adımlar',
        cantidad: 'Dökümler',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Günlük kullanım araçları. Çevrimdışı ve harici hizmet olmadan çalışır.',
    buscar: 'Araç ara…',
    sinResultados: 'Aramayla eşleşen araç yok.',
    abrir: 'Aç',
    procesar: 'İşleniyor…',
    copiar: 'Kopyala',
    copiado: 'Panoya kopyalandı',
    limpiar: 'Temizle',
    pendienteApi: 'Beklemede: çekirdek bu bilgiyi henüz arayüze sunmuyor.',
    lista: {
      qr: { nombre: 'QR oluşturucu', descripcion: 'Metinden veya tünel bağlantısından PNG.' },
      json: { nombre: 'JSON', descripcion: 'Biçimlendir, doğrula, küçült ve ağaç görünümü.' },
      regex: {
        nombre: 'Düzenli ifadeler',
        descripcion: 'Eşleşmeler, gruplar ve hızlı başvuru ile test aracı.',
      },
      diff: {
        nombre: 'Metin karşılaştır',
        descripcion: 'Yan yana farklar, dosyalar için de.',
      },
      tiempo: { nombre: 'Zaman', descripcion: 'Zaman damgası ↔ tarih, saat dilimli.' },
      puertos: {
        nombre: 'Bağlantı noktaları ve işlemler',
        descripcion: 'Her bağlantı noktasını kimin dinlediğini görün ve işlemi sonlandırın.',
      },
      bom: { nombre: 'UTF-8 BOM temizliği', descripcion: 'Dosyalardan veya klasörlerden BOM kaldırır.' },
      certificados: {
        nombre: 'Sertifikalar',
        descripcion: 'Herhangi bir ad için WolfCore Dev CA ile sertifika verin.',
      },
      cripto: {
        nombre: 'Kripto',
        descripcion: 'Hash, Base64, URL, UUID, parolalar ve JWT.',
      },
      markdown: { nombre: 'Markdown önizleme', descripcion: 'Yazın ve sonucu anında görün.' },
      entorno: { nombre: 'Sistem ortamı', descripcion: 'PATH, sürümler ve değişkenler.' },
      buscar: {
        nombre: 'Ara',
        descripcion: 'Bir proje, klasör veya dosyanın adında ve içeriğinde metin arayın.',
      },
      infoArchivo: {
        nombre: 'Dosya bilgisi',
        descripcion: 'Bir dosyanın boyutu, türü ve özetleri.',
      },
      websocket: { nombre: 'WebSocket istemcisi', descripcion: 'Bağlanın, gönderin ve iletileri görün.' },
      contrasenas: {
        nombre: 'Parolalar',
        descripcion: 'Parola gücünü ölçün ve veritabanlarınızdaki zayıf hesapları denetleyin.',
      },
      qrWifi: {
        nombre: 'Wi-Fi QR',
        descripcion: 'Diğerlerinin ağınıza bağlanması için QR kodu.',
      },
      imagenes: {
        nombre: 'Görseller',
        descripcion: 'ICO veya PNG’ye dönüştürün, JPEG veya WebP sıkıştırın.',
      },
      comprimir: {
        nombre: 'ZIP ve PDF',
        descripcion: 'Dosya ve klasörleri ZIP’leyin, PDF’leri optimize edin.',
      },
      conversor: {
        nombre: 'Belge dönüştürücü',
        descripcion: 'Word, Excel, PDF, CSV ve Markdown’ı bu bilgisayardan çıkmadan dönüştürün.',
      },
    },
    errores: {
      jsonVacio: 'Bir JSON yazın veya yapıştırın.',
      jsonInvalido: (linea: number, columna: number) =>
        `Geçersiz JSON: satır ${linea}, sütun ${columna} konumunu kontrol edin.`,
      banderas: 'Geçersiz bayraklar: yalnızca tekrar etmeden d, g, i, m, s, u, v veya y kullanın.',
      regex: (detalle: string) => `Geçersiz ifade (${detalle}).`,
      trabajador: 'İşlem arka planda çalıştırılamadı.',
      diffLento: 'Metinler zamanında karşılaştırmak için fazla farklı.',
      base64: 'Geçersiz Base64.',
      utf8: 'Çözülen içerik geçerli UTF-8 metni değil.',
      url: 'Geçersiz URL dizisi.',
      coste: (max: number) => `bcrypt maliyeti 4 ile ${max} arasında olmalıdır.`,
      jwtPartes: 'JWT nokta ile ayrılmış üç parçadan oluşmalıdır.',
      jwtCabecera: 'JWT başlığı okunamadı.',
      jwtCarga: 'JWT yükü okunamadı.',
      longitud: 'Uzunluk 4 ile 256 arasında olmalıdır.',
      sinConjuntos: 'En az bir karakter türü seçin.',
      sinDominios: 'En az bir ad veya IP yazın.',
      muchosDominios: (max: number) => `Sertifika başına en fazla ${max} ad.`,
    },
    qr: {
      texto: 'Metin veya URL',
      textoAyuda: 'QR bu bilgisayarda oluşturulur; ağa hiçbir şey gönderilmez.',
      tunel: 'Bir projenin tünel bağlantısı',
      sinTuneles: 'Aktif tünel yok',
      descargar: 'PNG indir',
      vacio: 'Kod oluşturmak için bir şey yazın.',
      largo: 'Metin bir QR kodu için çok uzun.',
      descargado: 'İndirme başlatıldı.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Biçimlendir',
      minificar: 'Küçült',
      validar: 'Doğrula',
      valido: 'Geçerli JSON.',
      resultado: 'Sonuç',
      arbol: 'Ağaç',
      mas: (n: number) => `… ${n} tane daha`,
    },
    regex: {
      patron: 'Desen',
      banderas: 'Bayraklar',
      texto: 'Test metni',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} eşleşme${truncado ? ' (ilkleri gösteriliyor)' : ''}`,
      sinCoincidencias: 'Eşleşme yok.',
      tiempo: 'İfade çok uzun sürdü ve durduruldu (olası felaket geri izleme).',
      grupo: (n: number) => `Grup ${n}`,
      referencia: 'Hızlı başvuru',
      tabla: [
        ['.', 'Herhangi bir karakter (s olmadan satır sonu hariç)'],
        ['\\d \\w \\s', 'Rakam, harf/rakam/_ ve boşluk'],
        ['\\D \\W \\S', 'Yukarıdakilerin tersi'],
        ['[abc] [^abc]', 'Listeden biri / listeden hiçbiri'],
        ['^ $', 'Başlangıç ve bitiş (m ile satır)'],
        ['\\b', 'Sözcük sınırı'],
        ['* + ?', 'Sıfır veya daha fazla, bir veya daha fazla, isteğe bağlı'],
        ['{n,m}', 'n ile m arasında tekrar'],
        ['*? +?', 'Tembel (lazy) sürüm'],
        ['(…) (?<nombre>…)', 'Yakalama grubu ve adlı grup'],
        ['(?:…)', 'Yakalamasız grup'],
        ['(?=…) (?!…)', 'İzleyen / izlemeyen'],
        ['a|b', 'Seçenek'],
        ['g i m s u y', 'Genel, büyük/küçük duyarsız, çok satırlı, tam nokta, Unicode, yapışkan'],
      ] as [string, string][],
    },
    diff: {
      original: 'Özgün',
      modificado: 'Değiştirilmiş',
      cargarArchivo: 'Dosya yükle',
      comparar: 'Karşılaştır',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} satır`,
      iguales: 'Metinler aynı.',
      archivoGrande: 'Dosya 5 MB sınırını aşıyor; daha küçük bir dosya seçin.',
      textoGrande: 'Her metin en fazla 5 MB olabilir.',
      truncado: (mostradas: number, total: number) =>
        `${total} satırdan ilk ${mostradas} tanesi gösteriliyor.`,
    },
    tiempo: {
      timestamp: 'Zaman damgası (saniye veya milisaniye)',
      fecha: 'Tarih (YYYY-AA-GG SS:dd:sn)',
      zona: 'Saat dilimi',
      ahora: 'Şimdi',
      segundos: 'Saniye',
      milisegundos: 'Milisaniye',
      iso: 'ISO 8601 (UTC)',
      enZona: 'Seçilen saat diliminde',
      desplazamiento: 'Fark',
      relativo: 'Göreli',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Saniye olarak okundu' : 'Milisaniye olarak okundu',
      timestampInvalido: 'Yalnızca rakam yazın (işaret olabilir).',
      fechaInvalida: 'Gerçek bir tarihle YYYY-AA-GG SS:dd[:sn] biçimini kullanın.',
      zonaInvalida: 'Bilinmeyen saat dilimi.',
    },
    puertos: {
      filtro: 'Bağlantı noktası, PID veya ada göre filtrele',
      actualizar: 'Yenile',
      columnas: {
        puerto: 'Bağlantı noktası',
        protocolo: 'Protokol',
        proceso: 'İşlem',
        pid: 'PID',
        direcciones: 'Adresler',
        acciones: 'İşlemler',
      },
      propio: 'WolfCore Dev',
      sistema: 'Sistem',
      finalizar: 'Sonlandır',
      noFinalizable: 'Sistem işlemleri ve WolfCore Dev işlemleri buradan sonlandırılmaz.',
      confirmarTitulo: 'İşlemi sonlandır',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) kaydetmeden kapatılacak. Onaylamak için işlem adını yazın:`,
      finalizado: (nombre: string) => `${nombre} sonlandırıldı.`,
      vacio: 'Kullanımda bağlantı noktası yok veya okunamadı.',
    },
    bom: {
      explicacion:
        'Önce BOM içeren dosyalar gösterilir; temizlerken her birinin .bak-bom yedeği kaydedilir. node_modules, vendor, .git ve ikili dosyalar atlanır.',
      elegirArchivos: 'Dosyaları seç',
      elegirCarpeta: 'Klasör seç',
      seleccion: (n: number) => `${n} yol seçildi`,
      analizar: 'İncele',
      limpiar: 'BOM kaldır',
      confirmar: (n: number) =>
        `${n} dosyadan BOM kaldırılacak (yedekli). Devam edilsin mi?`,
      conBom: (n: number) => `BOM içeren ${n} dosya`,
      sinBom: 'Hiçbir dosyada BOM yok.',
      limpiados: (n: number) => `${n} dosya temizlendi.`,
      copia: 'Yedek',
    },
    certificados: {
      explicacion:
        'WolfCore Dev yerel CA’sı ile bir sertifika imzalar. .crt seçtiğiniz yere, anahtar (.key) yanına kaydedilir; anahtar asla arayüzden geçmez.',
      dominios: 'Adlar veya IP’ler (boşluk, virgül veya satırla ayrılmış)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Oluştur ve kaydet',
      guardado: 'Sertifika kaydedildi',
      certificado: 'Sertifika',
      clave: 'Anahtar',
    },
    cripto: {
      texto: 'Metin',
      hash: 'Hash',
      calcular: 'Hesapla',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt maliyeti',
      bcryptTrunca: 'bcrypt metnin yalnızca ilk 72 baytını kullanır.',
      bcryptVerificar: 'Doğrulanacak bcrypt hash',
      verificar: 'Doğrula',
      coincide: 'Metin hash ile eşleşiyor.',
      noCoincide: 'Metin hash ile eşleşmiyor.',
      base64: 'Base64',
      base64Url: 'URL çeşidi',
      codificar: 'Kodla',
      decodificar: 'Çöz',
      url: 'URL kodla',
      decodificarUrl: 'URL çöz',
      codificarBase64: 'Base64 kodla',
      decodificarBase64: 'Base64 çöz',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID ve parolalar',
      uuid: 'UUID v4',
      generar: 'Oluştur',
      generarDiez: '10 oluştur',
      contrasena: 'Rastgele parola',
      longitud: 'Uzunluk',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Simgeler',
      jwt: 'JWT çöz',
      jwtToken: 'Belirteç',
      cabecera: 'Başlık',
      carga: 'Yük',
      firmaNoVerificada:
        'İmza doğrulanmadı: içerik olduğu gibi gösteriliyor ve değiştirilmiş olabilir.',
      vencido: 'Belirtecin süresi dolmuş (exp).',
      vigente: 'Belirteç henüz geçerli (exp).',
      salida: 'Sonuç',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Önizleme',
      ejemplo:
        '# Başlık\n\n**Kalın**, _eğik_ ve bir [bağlantı](https://example.com) içeren metin.\n\n- Bir\n- İki\n\n```\nkod\n```\n',
      seguro:
        'Ham HTML metin olarak gösterilir, tehlikeli bağlantılar çıkarılır ve görseller yüklenmez.',
      imagenOmitida: (alt: string) => `[görsel${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'WolfCore Dev sürümü',
      navegador: 'Arayüz motoru',
      plataforma: 'Platform',
      idioma: 'Dil',
      zona: 'Saat dilimi',
      nucleos: 'Mantıksal çekirdekler',
      actualizar: 'Yenile',
      path: 'PATH',
      pathVacio: 'PATH boş.',
      herramientas: 'WolfCore Dev araçları',
      noInstalada: 'Yüklü değil',
      sinRespuesta: 'Zamanında yanıt vermedi',
      variables: 'Ortam değişkenleri',
      filtro: 'Değişkenleri filtrele',
      enmascarada: 'Değer gizlendi: ad bir gizli bilgi gibi görünüyor.',
    },
    busqueda: {
      explicacion:
        'Bağlantıları izlemeden ve ikili dosyaları okumadan adlarda ve içerikte arar. Varsayılan olarak node_modules, vendor ve .git atlanır.',
      origen: 'Nerede aranacak',
      proyecto: 'Proje',
      elegirCarpeta: 'Klasör seç',
      elegirArchivo: 'Dosya seç',
      sinOrigen: 'Bir proje, klasör veya dosya seçin.',
      consulta: 'Aranacak metin',
      modoNombre: 'Adlar',
      modoContenido: 'İçerik',
      modoAmbos: 'İkisi de',
      regex: 'Düzenli ifade',
      mayusculas: 'Büyük/küçük harf duyarlı',
      incluir: 'Yalnızca dosyalar (virgülle ayırın, ör. *.php)',
      excluir: 'Atla (virgülle ayırın)',
      buscar: 'Ara',
      cancelar: 'İptal',
      buscando: 'Aranıyor…',
      sinResultados: 'Eşleşme yok.',
      truncado: 'Gösterilenden fazla sonuç var: aramayı daraltın.',
      cancelada: 'Arama iptal edildi.',
      abrir: 'Düzenleyicide aç',
      coincidencias: (n: number) => `${n} eşleşme`,
      resumen: (archivos: number, examinados: number) =>
        `${archivos} dosyada (${examinados} incelendi)`,
    },
    infoArchivo: {
      elegir: 'Dosya seç',
      ayuda: 'Özetleri hesaplamak için bu bilgisayarda okunur (en fazla 200 MB).',
      nombre: 'Ad',
      tamano: 'Boyut',
      tipo: 'Tür',
      modificado: 'Değiştirilme',
      sinTipo: 'Bilinmiyor',
      grande: 'Dosya 200 MB’yi aşıyor: veriler özet olmadan gösteriliyor.',
      calculando: 'Özetler hesaplanıyor…',
    },
    websocket: {
      url: 'URL (ws:// veya wss://)',
      conectar: 'Bağlan',
      desconectar: 'Bağlantıyı kes',
      mensaje: 'İleti',
      enviar: 'Gönder',
      urlInvalida: 'ws:// veya wss:// ile başlayan bir URL yazın.',
      conectando: 'Bağlanıyor…',
      conectado: 'Bağlandı',
      desconectado: 'Bağlantı kesildi',
      error: 'Bağlantı hatası',
      cerrado: (codigo: number, motivo: string) =>
        `Kapandı (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Gönderildi',
      recibido: 'Alındı',
      binario: (n: number) => `[ikili, ${n} bayt]`,
      vacio: 'Henüz ileti yok.',
      tope: 'Son 500 ileti saklanır; her biri en fazla 10 KB gösterilir.',
    },
    qrWifi: {
      ssid: 'Ağ adı (SSID)',
      clave: 'Parola',
      seguridad: 'Güvenlik',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Parolasız',
      oculta: 'Gizli ağ',
      mostrar: 'Göster',
      ocultar: 'Gizle',
      aviso:
        'QR kodu parolayı olduğu gibi içerir: gören veya fotoğrafını çeken herkes ağınıza bağlanabilir. Burada oluşturulur, kaydedilmez ve panel kapanınca silinir.',
      avisoPng:
        'İndirilen PNG de parolayı kod içinde taşır: yalnızca sizin görebileceğiniz bir yerde saklayın.',
      escribala:
        'Parolayı siz yazarsınız: WolfCore Dev sistemde kayıtlı Wi-Fi parolalarını asla okumaz.',
      errorSsid: 'Ağ adını yazın (en fazla 32 karakter).',
      errorClave: 'Parolayı yazın.',
      errorClaveWpa: 'WPA parolası 8 ile 63 karakter arasında olmalıdır.',
      vacio: 'Kodu görmek için bilgileri doldurun.',
      alt: 'Wi-Fi ağına bağlanmak için QR kodu',
      descargar: 'PNG indir',
      descargado: 'QR kaydedildi',
      largo: 'Veriler bir QR kodu için çok uzun.',
    },
    imagenes: {
      elegir: 'Görsel seç',
      ayuda:
        'Bu bilgisayarda işlenir (en fazla 30 MB ve kenar başına 12000 px). Özgün dosya değişmez: sonuç yeni bir dosyadır.',
      original: 'Özgün',
      accion: 'İşlem',
      aIco: 'ICO’ya dönüştür',
      aPng: 'PNG’ye dönüştür',
      comprimir: 'Sıkıştır',
      tamanos: 'ICO boyutları',
      formato: 'Biçim',
      calidad: 'Kalite',
      ladoMax: 'En büyük kenar px (boş = özgün)',
      procesar: 'İşle',
      procesando: 'İşleniyor…',
      guardar: 'Farklı kaydet…',
      antes: 'Önce',
      despues: 'Sonra',
      sinMejora: 'Sonuç özgünden küçük değil: başka bir kalite veya biçim deneyin.',
      errorAbrir: 'Görsel bu bilgisayarda açılamadı.',
      errorProcesar: 'Görsel işlenemedi.',
      sufijoConvertida: '-donusturuldu',
      sufijoComprimida: '-sikistirildi',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `%${porcentaje} daha küçük`
          : porcentaje < 0
            ? `%${-porcentaje} daha büyük`
            : 'değişiklik yok',
      guardado: (archivo: string) => `${archivo} konumuna kaydedildi`,
    },
    comprimir: {
      zip: 'ZIP olarak sıkıştır',
      zipAyuda:
        'Dosya veya klasör seçin. Bağlantılar izlenmez ve ZIP yeni bir dosyadır: mevcut dosya asla üzerine yazılmaz.',
      agregarArchivos: 'Dosya ekle',
      agregarCarpeta: 'Klasör ekle',
      quitar: 'Kaldır',
      vacio: 'Henüz hiçbir şey seçilmedi.',
      crearZip: 'ZIP oluştur…',
      creando: 'Oluşturuluyor…',
      pdf: 'PDF optimize et',
      pdfAyuda:
        'Ayrı bir iş parçacığında nesne akışlarıyla yeniden kaydeder. Yalnızca daha küçükse dosya oluşturur; parola korumalı PDF açılmaz. Özgün dosyaya dokunulmaz. Dikkat: yeniden kaydetmek dijital imzaları ve PDF/A uyumluluğunu kaldırır.',
      elegirPdf: 'PDF seç',
      optimizar: 'Optimize et…',
      optimizando: 'Optimize ediliyor…',
      antes: 'Önce',
      despues: 'Sonra',
      sinMejora: 'PDF optimize edilince küçülmeyecekti: yeni dosya oluşturulmadı.',
      sufijoOptimizado: '-optimize',
      omitidos: (n: number) =>
        `${n} bağlantı, okunamayan klasör veya özel dosya dahil edilmedi.`,
      archivos: (n: number) => `${n} dosya`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `%${porcentaje} daha küçük`
          : porcentaje < 0
            ? `%${-porcentaje} daha büyük`
            : 'değişiklik yok',
      guardado: (archivo: string) => `${archivo} konumuna kaydedildi`,
    },
    conversor: {
      ayuda:
        'Bu bilgisayarda dönüştürülür: belge hiçbir yere yüklenmez. Özgün değişmez; yeni bir dosya oluşturulur ve mevcut üzerine yazılmaz.',
      elegir: 'Belge seç',
      tipoNoSoportado:
        'Bu dosya türü için dönüştürme yok. docx, xlsx, csv, md, html ve pdf desteklenir (LibreOffice ile odt, pptx ve doc).',
      convertirA: 'Şuna dönüştür',
      convertir: 'Dönüştür…',
      convirtiendo: 'Dönüştürülüyor…',
      avisoLibreOffice:
        'Bu dönüştürme bu bilgisayarda yüklü LibreOffice’i kullanır. WolfCore Dev onu yüklemez: penceresiz ve geçici profille açar.',
      sinLibreOffice:
        'LibreOffice yüklerseniz odt, pptx ve doc da dönüştürebilirsiniz (WolfCore Dev yüklemez).',
      limites:
        'Güvenlik sınırları: en fazla 50 MB (md ve html için 10 MB), 120 sn, 200 000 satır, 1000 sütun ve 5 milyon hücre; ZIP bombası veya XML varlığı şüphesi taşıyan dosyalar reddedilir.',
      guardado: (archivo: string) => `${archivo} konumuna kaydedildi`,
    },
    contrasenas: {
      pestanaFortaleza: 'Güç',
      pestanaAuditar: 'Veritabanı denetle',
      fortaleza: {
        etiqueta: 'Ölçülecek parola',
        marcador: 'Bir parola yazın',
        privacidad: 'Doğrudan burada ölçülür: bilgisayarınızdan çıkmaz ve kaydedilmez.',
        mostrar: 'Göster',
        ocultar: 'Gizle',
        niveles: ['Çok zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok güçlü'],
        sinAvisos: 'Uyarı yok.',
        estimacion: 'Bu bir tahmindir, garanti değildir.',
        avisos: {
          straightRow: 'Klavyede yan yana tuş dizileri kolay tahmin edilir.',
          keyPattern: 'Kısa klavye desenleri kolay tahmin edilir.',
          simpleRepeat: 'Bir karakteri veya grubu tekrarlamak neredeyse hiç güç katmaz.',
          extendedRepeat: 'Tekrarlanan gruplar kolay tahmin edilir.',
          sequences: 'abc veya 6543 gibi diziler kolay tahmin edilir.',
          recentYears: 'Yakın yıllardan ve size bağlı tarihlerden kaçının.',
          dates: 'Tarihlerden kaçının: kolay tahmin edilirler.',
          topTen: 'En çok kullanılan on parola arasında.',
          topHundred: 'En çok kullanılan yüz parola arasında.',
          common: 'Çok yaygın kullanılan bir parola.',
          similarToCommon: 'Çok yaygın bir parolaya benziyor.',
          wordByItself: 'Tek bir sözcük kolay tahmin edilir.',
          namesByThemselves: 'Tek başına ad veya soyad kolay tahmin edilir.',
          commonNames: 'Yaygın ad ve soyadlar kolay tahmin edilir.',
          userInputs: 'Başkalarının sizin hakkınızda bildiği bilgileri kullanmayın.',
          l33t: 'Tahmin edilebilir simge değişimleri (a yerine @) pek işe yaramaz.',
          reverseWords: 'Sözcükleri tersten yazmak pek işe yaramaz.',
          allUppercase: 'Tamamını büyük harf yapmak pek işe yaramaz.',
          capitalization: 'Yalnızca ilk harfi büyük yapmak pek işe yaramaz.',
          associatedYears: 'Sizinle ilişkili yıllardan kaçının.',
          repeated: 'Tekrarlanan sözcük ve karakterlerden kaçının.',
          longerKeyboardPattern: 'Daha uzun bir klavye deseni kullanın ve yön değiştirin.',
          anotherWord: 'Bir iki sözcük daha ekleyin; az kullanılanlar daha iyidir.',
          useWords: 'Rastgele birkaç sözcük güçlü bir parola oluşturur.',
          noNeed: 'Simge veya rakam olmadan da güvenli olunabilir: önemli olan uzunluktur.',
        },
      },
      auditar: {
        limite:
          'Bu araç yalnızca çok yaygın parolaları algılar: her hash’i yaklaşık 200’lük kısa bir listeyle karşılaştırır. Bir saldırı veya kaba kuvvet testi değildir. İşaretlenmemesi parolanın güçlü olduğu anlamına gelmez.',
        privacidad:
          'Eşleşen parola asla gösterilmez ve geçici salt okunur kullanıcıyla okunur (PostgreSQL’de salt okunur oturum). Yalnızca kendi veritabanlarınızda kullanın.',
        motor: 'Motor',
        base: 'Veritabanı',
        tabla: 'Tablo',
        columnaUsuario: 'Kullanıcı sütunu',
        columnaHash: 'Hash sütunu',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Veritabanlarını incelemek için Veritabanları bölümünden sunucuyu başlatın.',
        sinBases: 'Bu sunucuda veritabanı yok.',
        sinMotores: 'Kendi MySQL, MariaDB veya PostgreSQL sunucunuz yok.',
        revisar: 'İncele',
        revisando: 'İnceleniyor…',
        resumen: (r: number, d: number) =>
          `${r} hesap incelendi · ${d} zayıf`,
        sinDebiles: 'İncelenen hiçbir hesap çok yaygın bir parolayla eşleşmedi.',
        noRevisables: (n: number) => `${n} hesap incelenemedi:`,
        truncado:
          'İnceleme 10 000 satır veya 60 saniye sınırında kesildi: incelenmeyen hesaplar kaldı.',
        usuario: 'Kullanıcı',
        motivo: 'Neden',
        accion: 'İşlem',
        motivos: {
          comun: 'Çok yaygın parola',
          formato_debil: 'Zayıf biçim (tuzsuz md5 veya sha1)',
        },
        restablecer: 'Sıfırla',
        mas: (n: number) => `ve ${n} tane daha (ilk 200 gösteriliyor)`,
        esquema: 'Şema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'İptal',
        cancelando: 'İptal ediliyor…',
        cancelada: 'Denetim iptal edildi.',
        progreso: (a: number, b: number) => `${b} hesaptan ${a} incelendi`,
        tiposNoRevisables: {
          vacio: 'boş hash',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (bu bilgisayarda yok veya parametreler sınır dışı)',
          bcrypt_otro: 'aralık dışı maliyetli bcrypt veya $2x$ çeşidi',
          pbkdf2_otro: 'parametreleri sınır dışı PBKDF2',
          ldap: 'LDAP biçimi ({SHA}…)',
          otro: 'bilinmeyen biçim',
        },
        rlsActiva:
          'Tabloda satır düzeyi güvenlik (RLS) var: denetim yalnızca sınırlı role izin verilen satırları görür, bazı hesaplar eksik kalabilir.',
        falsoPositivo:
          '32 veya 40 onaltılık karakterlik bir değer md5 veya sha1 sanılır ama başka bir şey (ör. belirteç) olabilir. Sütun parola tutmuyorsa sonuç geçersizdir.',
      },
      restablecer: {
        titulo: (u: string) => `${u} parolasını sıfırla`,
        ayuda:
          'Bir parola kurtarılamaz: yerine yenisi konur. Öncesinde veritabanının anlık görüntüsü alınır ve satırın bir kopyası saklanır.',
        cargando: 'Önizleme hazırlanıyor…',
        sentencia: 'Çalıştırılacak ifade (değerler ayrı gider ve gösterilmez)',
        formatoActual: (f: string) => `Mevcut biçim: ${f}`,
        cambiaFormato:
          'Hesap bcrypt’e geçecektir: uygulama bunu doğrulayabilmelidir (ör. password_verify ile); yoksa kimse bu hesapla giriş yapamaz.',
        nueva: 'Yeni parola',
        generar: 'Oluştur',
        mostrar: 'Göster',
        ocultar: 'Gizle',
        anotar: 'Şimdi not alın: bir daha gösterilmez ve kaydedilmez.',
        escribaUsuario: (u: string) => `Onaylamak için kullanıcıyı yazın: ${u}`,
        confirmar: 'Parolayı sıfırla',
        cancelar: 'İptal',
        cerrar: 'Kapat',
        hecho: 'Parola sıfırlandı.',
        copiaFila: 'Satır kopyası (kimlik ve eski hash, 30 gün saklanır):',
        instantanea: 'Veritabanının önceki anlık görüntüsü:',
        instantaneaAyuda: 'Veritabanları › Anlık görüntüler bölümünden geri dönülebilir.',
        aBcrypt: 'bcrypt’e geç: yalnızca uygulama password_verify veya eşdeğerini kullanıyorsa',
        avisoLegado:
          'Bu hash tuzsuz md5 veya sha1’dir ve bu biçimde korunur. Uygulama tuzu ayrı saklıyorsa (başka sütun veya sabit), yeni parola girişte çalışmayacaktır.',
        datosReales: {
          titulo: 'Gerçek verili veritabanı',
          texto:
            'Bu veritabanı gerçek müşteri verileriyle işaretli bir siteye ait: parolayı sıfırlamak gerçek bir hesabı değiştirir.',
          casilla: 'Gerçek veriler olduğunu anlıyorum ve bu parolayı sıfırlamak istiyorum',
        },
        rlsActiva:
          'Tabloda satır düzeyi güvenlik (RLS) var: ilke bu hesabı sınırlı rolden gizliyorsa sıfırlanamaz.',
        copiaSinRestringir:
          'Bu kopya bu bilgisayarın kullanıcısıyla sınırlandırılamadı: klasör izinlerini kontrol edin.',
      },
    },
  },
  doctor: {
    descripcion:
      'Bağlantı noktalarını, sertifikaları, hosts dosyasını, PATH’i, Visual C++’ı, antivirüsü ve hizmetleri denetler ve onarım önerir.',
    revisarAhora: 'Şimdi denetle',
    revisando: 'Denetleniyor…',
    sinRevision: 'Henüz denetim yok. «Şimdi denetle» düğmesine basın.',
    sinHallazgos: 'Her şey yolunda: sorun bulunamadı.',
    gravedades: { error: 'Hatalar', aviso: 'Uyarılar', info: 'Bilgi' },
    evidencia: 'Görülenler',
    requiereAdmin: 'Yönetici izni ister',
    comandoManual: 'Yönetici konsolu için komut (kendiliğinden çalışmaz):',
    copiar: 'Komutu kopyala',
    copiado: 'Komut kopyalandı.',
    reparar: 'Onar',
    alternativa: 'WolfCore Dev bağlantı noktasını taşı',
    soloInforma: 'WolfCore Dev bunu kendiliğinden değiştirmez: yönergeleri izleyin.',
    dialogo: {
      titulo: 'Onarımı onayla',
      queHara: 'Yapılacak işlem:',
      admin: 'Windows sizden yönetici izni isteyecektir.',
      puerto: (p: string | number) => `Yeni bağlantı noktası ${p} olacaktır.`,
      aplicar: 'Uygula',
      cancelar: 'İptal',
    },
    estados: {
      aplicando: 'Uygulanıyor…',
      hecha: 'Onarım uygulandı.',
      fallida: 'Onarılamadı.',
    },
    revisiones: {
      puertos: 'Bağlantı noktaları',
      'rangos-reservados': 'Ayrılmış aralıklar',
      ca: 'Sertifika otoritesi',
      certificados: 'Sertifikalar',
      confianza: 'CA güveni',
      hosts: 'hosts dosyası',
      path: 'Kullanıcı PATH',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++ bağlayıcı',
      antivirus: 'Antivirüs',
      firewall: 'Güvenlik duvarı',
      servicios: 'Hizmetler',
    },
    reparaciones: {
      cambiar_puerto: 'WolfCore Dev bağlantı noktasını boş bir bağlantı noktasına taşıyın. Diğer programa dokunulmaz.',
      puerto_manual:
        'WolfCore Dev bağlantı noktasını ayrılmış aralığın dışına taşıyın. Aralığı serbest bırakmaya gösterilen komutla siz karar verirsiniz.',
      detener_iis:
        'Bağlantı noktasını serbest bırakmak için IIS hizmetini (W3SVC) durdurun. Devre dışı bırakılmaz: Windows yeniden başlayınca tekrar açılır.',
      regenerar_ca:
        'Yeni sertifika otoritesi oluşturun, Windows’ta güvenin (onay ister), sertifikaları yeniden verin ve eskisini kaldırın. Öncesinde kopya alınır.',
      regenerar_certificados: 'Sitelerin sertifikalarını yeniden verin ve Nginx’i yeniden yükleyin.',
      hosts_reescribir:
        'hosts dosyasındaki WolfCore Dev bloğunu önceden yedek alarak UTF-8 ile yeniden yazın. Diğer satırlara dokunulmaz.',
      hosts_solo_lectura: 'hosts dosyasının salt okunur özniteliğini kaldırın.',
      path_duplicados:
        'Kullanıcı PATH’inden yinelenen WolfCore Dev girdilerini (eski değer yedeklenerek) kaldırın. Diğerlerine dokunulmaz.',
      path_ajeno:
        'PATH içinde başka bir araç önde. WolfCore Dev kaldırmaz: gerekirse sırasını kendiniz değiştirin.',
      instalar_vcredist:
        'winget ile Visual C++ 2015+ x64 yükleyin. Microsoft yükleyicisi kendi iznini ister.',
      instalar_build_tools:
        'Gösterilen komutla Visual Studio Build Tools (C++ araçlarıyla) yükleyin: birkaç GB yer kaplar ve yönetici izni ister, kararı siz verirsiniz.',
      antivirus:
        'Veri klasörünü antivirüs dışlamalarına eklemeye gösterilen komutla siz karar verirsiniz.',
      firewall:
        'Bu kuralları kaldırmaya yönetici konsolunda gösterilen komutla siz karar verirsiniz. WolfCore Dev güvenlik duvarını asla değiştirmez.',
      reintentar_servicio: 'Hizmeti yeniden başlatın.',
      firefox_confianza:
        'Her Firefox profilinin user.js dosyasına, önceki bir yedekle birlikte Windows sertifika yetkilisine güvenme tercihini ekler. prefs.js dosyasına dokunulmaz ve açık profiller atlanır.',
    },
    confianza: {
      titulo: 'CA güveni',
      texto:
        'Windows, WolfCore Dev sertifika yetkilisine zaten güveniyor; Node, Python ve Firefox kendi sertifika depolarını kullanır.',
      sinCa: 'Henüz bir sertifika yetkilisi yok. Bu bölümü kullanmak için HTTPS bölümünden oluşturun.',
      node: {
        titulo: 'Node',
        proyectos:
          'Proje işlemleri ve Terminal, yetkili sertifikayla birlikte NODE_EXTRA_CA_CERTS değişkenini alır.',
        ajena: 'Zaten kendi NODE_EXTRA_CA_CERTS değişkeniniz var: WolfCore Dev bunu değiştirmez.',
        global: 'Kullanıcı ortam değişkeni olarak da ayarla (diğer terminaller ve programlar için)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS kullanıcı değişkeniniz olarak ayarlanacaktır. Daha sonra açacağınız programları etkiler; bu seçenek kapatıldığında kaldırılır.',
        confirmarDesactivar: 'WolfCore Dev tarafından eklenen NODE_EXTRA_CA_CERTS değişkeni kaldırılacaktır.',
      },
      python: {
        titulo: 'Python',
        texto:
          '.venv içeren projeler, certifi kökleriyle (veya Windows kökleriyle) birlikte sertifika yetkilisini içeren REQUESTS_CA_BUNDLE ve SSL_CERT_FILE değişkenlerini alır. Asla yalnızca yetkili verilmez.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Hiç Firefox profili bulunamadı.',
        activo: 'Güveniyor',
        inactivo: 'Güvenmiyor',
        abierto: 'Açık',
        fuera: 'Firefox klasörü dışında',
        avisoFuera: (lista: string) =>
          `Bu profiller Firefox klasörünün dışındadır ve işaretlemediğiniz sürece dokunulmaz: ${lista}.`,
        incluirFuera: 'Firefox klasörü dışındaki profilleri de değiştir',
        resultadoFuera: (n: number) =>
          `Firefox klasörü dışındaki ${n} profile dokunulmadı.`,
        activar: 'Firefox içinde etkinleştir',
        quitar: 'Firefox içinden kaldır',
        confirmarActivar:
          'Her profilin user.js dosyasına, WolfCore Dev işaretleri arasına ve etc/respaldos içinde bir yedek alınarak security.enterprise_roots.enabled eklenecektir. prefs.js dosyasına dokunulmaz. Firefox açıkken kullanılan profiller atlanır: önce kapatın.',
        confirmarQuitar:
          'Her profilin user.js dosyasından WolfCore Dev bloğu kaldırılacaktır (önce yedek alınır). Diğer tercihleriniz aynı kalır.',
        resultadoOk: (n: number) => `${n} profilde tamamlandı.`,
        resultadoAbiertos: (n: number) =>
          `Firefox açık olduğu için ${n} profil atlandı. Kapatıp tekrar deneyin.`,
        resultadoError: (n: number) =>
          `${n} profil değiştirilemedi.`,
      },
      confirmar: 'Onayla',
      cancelar: 'İptal',
    },
  },
  php: {
    descripcion:
      'Yüklü her PHP sürümü için php.ini ve eklentiler. Kaydetmeden önce diff gösterilir, php -v ile test edilir ve tarihli bir yedek kaydedilir; PHP yeniden başlamazsa önceki dosya geri yüklenir.',
    rama: 'PHP sürümü',
    sinPhp: 'Yüklü PHP yok. Hizmetler bölümünden yükleyin.',
    irServicios: 'Hizmetlere git',
    pestanas: { ini: 'php.ini', extensiones: 'Eklentiler' },
    rapidosTitulo: 'Hızlı değerler',
    rapidosAyuda: 'Aşağıdaki metne uygulanır; diff onaylanana kadar hiçbir şey kaydedilmez.',
    aplicarRapidos: 'Metne uygula',
    sinValor: 'tanımsız',
    rapidos: {
      memory_limit: 'Betik başına bellek (memory_limit)',
      upload_max_filesize: 'En fazla yükleme boyutu (upload_max_filesize)',
      post_max_size: 'En fazla POST boyutu (post_max_size)',
      max_execution_time: 'Saniye cinsinden en uzun süre (max_execution_time)',
      display_errors: 'Hataları göster (display_errors)',
      error_reporting: 'Hata düzeyi (error_reporting)',
      'date.timezone': 'Saat dilimi (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: '; ile başlayan satırlar yorum satırıdır.',
    sinCambios: 'Kaydedilene göre bir değişiklik yok.',
    descartar: 'Değişiklikleri at',
    revisar: 'İncele ve kaydet',
    diffTitulo: (rama: string) => `PHP ${rama} php.ini değişiklikleri`,
    diffAyuda:
      'Tarihli bir yedek kaydedilecek, php -v ile test edilecek ve PHP çalışıyorsa yeniden başlatılacaktır.',
    guardar: 'Kaydet ve uygula',
    cancelar: 'İptal',
    guardado: (respaldo: string) => `php.ini kaydedildi. Önceki yedek: ${respaldo}`,
    respaldosTitulo: 'Tarihli yedekler',
    sinRespaldos: 'Henüz yedek yok.',
    restaurar: 'Geri yükle',
    confirmarRestaurar: (nombre: string) =>
      `${nombre} geri yüklensin mi? Mevcut php.ini önce başka bir yedek olarak kaydedilir.`,
    restaurado: 'Yedek geri yüklendi.',
    recargar: 'Yeniden oku',
    extensiones: {
      ayuda:
        'Yalnızca bu derlemenin ext/ klasöründe bulunan eklentiler etkinleştirilir. Üçüncü taraf eklentiler katalogdan yüklenir (bu derlemeye uygun sürüm ve doğrulanmış SHA-256 özeti ile).',
      activa: 'Etkin',
      inactiva: 'Devre dışı',
      falta: 'Dosya eksik',
      catalogo: 'Katalog',
      instalar: 'Yükle',
      instalada: (nombre: string) => `${nombre} yüklendi ve etkinleştirildi.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} etkinleştirildi.` : `${nombre} devre dışı bırakıldı.`,
      buscar: 'Eklenti ara',
      vacio: 'Eşleşen eklenti yok.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI ve Antigravity CLI: algılayın veya yükleyin ve bir projede açın. Destekleyenler WolfCore Dev MCP sunucusuna bağlanır. Hiçbiri kendiliğinden açılmaz.',
    recargar: 'Yeniden algıla',
    notaMcp:
      'Kayıtlı MCP yalnızca aracı WolfCore Dev üzerinden ("Bir projede aç") başlatıldığında kimlik doğrular: belirteç yalnızca o terminalin WOLFCORE_MCP_TOKEN değişkeninde taşınır ve asla aracının yapılandırma dosyasına yazılmaz. Dışarıdan açıldığında aracı «wolfcore» girdisini görür ancak bağlanamaz.',
    sitioElegido: (nombre: string) => `${nombre} içinde açmak için bir aracı seçin.`,
    instalado: 'Yüklü',
    noInstalado: 'Yüklü değil',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Bilinmeyen sürüm',
    verVersion: 'Sürümü gör',
    verVersionAyuda: 'Programı --version ile çalıştırır (ekran açıldığında kendiliğinden yapılmaz).',
    origen: {
      propio: 'WolfCore Dev tarafından yüklendi',
      'npm-usuario': 'Kullanıcının genel npm kurulumu',
      ejecutable: 'Sistem programı',
    },
    mcpRegistrado: 'MCP kayıtlı',
    mcpSinRegistrar: 'MCP kayıtlı değil',
    tokenEscrito:
      'Aracı dosyasında yazılı bir MCP belirteci vardı: artık kaldırıldı ve önceki yedek belirteci maskelenmiş (***) olarak saklıyor. MCP sunucu belirtecini yeniden oluşturmayı düşünün.',
    mcpNoSoportado:
      'Belgeleri belirtecin ortam değişkeninden alınmasına izin vermiyor: WolfCore Dev bunun için MCP kaydetmez (belirteç asla dosyalara yazılmaz).',
    instalar: 'Yükle',
    instalando: 'Yükleniyor…',
    guia: 'Kurulum kılavuzu',
    soloGuia:
      'WolfCore Dev bunu yüklemez (yükleyicisinin sabit bir özeti yoktur): resmi kılavuzu izleyin.',
    registrar: 'MCP kaydet',
    quitar: 'MCP kaldır',
    abrir: 'Bir projede aç',
    confirmarInstalar: {
      titulo: (nombre: string) => `${nombre} yüklensin mi?`,
      texto: (paquete: string) =>
        `${paquete} paketinin yayımlanan en son sürümü registry.npmjs.org üzerinden, WolfCore Dev içindeki Node ile kendi veri klasörüne yüklenir.`,
      aislado: 'npm yapılandırmanızı kullanmaz ve genel npm kurulumunuza dokunmaz. Birkaç dakika sürebilir.',
      aceptar: 'Yükle',
      hecho: (nombre: string) => `${nombre} yüklendi.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `${nombre} için MCP kaydedilsin mi?`,
      texto:
        'Bu dosyada yalnızca «wolfcore» girdisi eklenir (veya güncellenir); geri kalan her şey aynı kalır:',
      aceptar: 'Kaydet',
      hecho: (nombre: string) => `${nombre} için MCP kaydedildi.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `${nombre} içinden MCP kaldırılsın mi?`,
      texto: 'Bu dosyadan yalnızca «wolfcore» girdisi kaldırılır; geri kalan her şey aynı kalır:',
      aceptar: 'Kaldır',
      hecho: (nombre: string) => `${nombre} içinden MCP kaldırıldı.`,
    },
    copiaPrevia:
      'Değişiklik yapılmadan önce dosyanın yanına tarihli bir yedek kaydedilir (<dosya>.wolfcore-YYYYAAGG-SSddsn.bak); en yeni 5 yedek saklanır. Aracı açıksa önce kapatın.',
    copiaHecha: (ruta: string) => `Önceki yedek: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `${nombre} aç`,
      proyecto: 'Proje',
      sinProyectos: 'Henüz proje yok.',
      proveedor: 'Yapay zeka sağlayıcısı',
      proveedorPropio: 'Aracının kendi yapılandırdığı sağlayıcı',
      proveedorAyuda:
        'Bir sağlayıcı seçildiğinde anahtarınız yalnızca o terminalin ortamında taşınır: dosyalara veya komut satırına yazılmaz.',
      aceptar: 'Terminali aç',
      hecho: (nombre: string) => `${nombre} yeni bir terminalde açıldı.`,
    },
    costo: {
      titulo: 'Bir aracıyı açmadan önce',
      texto:
        'Bir yapay zeka aracısı sağlayıcı hesabınızla çalışır: her istek token tüketir ve maliyete yol açabilir. Ayrıca proje dosyalarını okuyabilir, değiştirebilir ve komut çalıştırabilir.',
      nunca:
        'WolfCore Dev hiçbir aracıyı kendiliğinden açmaz: her zaman siz istersiniz. Bu uyarı yalnızca bir kez gösterilir.',
      aceptar: 'Anladım, aç',
    },
  },
  depuracion: {
    descripcion:
      'PHP sitelerinizdeki dump(), dd() ve wd() çıktılarını ve Python işlemlerinizdeki wolfdump çıktılarını dosya ve satır bilgisiyle burada görün. Sayfa normal yanıt vermeye devam eder.',
    receptor: 'Dump yakalama',
    escuchando: (direccion: string, puerto: number) => `${direccion}:${puerto} dinleniyor`,
    apagado: 'Kapalı',
    memoria:
      'Dökümler yalnızca bellekte tutulur (son 500 kayıt) ve uygulama kapatılınca silinir. Hassas veriler içerebilir: kopyalarken bilinen anahtarlar maskelenir.',
    sitios: 'Siteler',
    sinSitios: 'PHP veya FastAPI sitesi yok.',
    sinPhp: 'Önce sitede bir PHP sürümü seçin.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'wolfdump modülünün etkinleşmesi için site işlemlerini yeniden başlatın.',
    confirmarTitulo: (sitio: string) => `${sitio} için yakalamayı etkinleştir`,
    confirmarPhp:
      'Bu sitenin PHP kurulumu her istekten önce bir WolfCore Dev dosyası yükler (auto_prepend_file, yalnızca bu site için) ve proje tanımlamamışsa dump(), dd() ile wd() işlevlerini tanımlar. Dosyalarınız function_exists kontrolü yapmadan kendi dump() veya dd() işlevini tanımlıyorsa PHP hata verir: bu durumda yakalamayı kapatın. Site kendi PHP örneğini kullanmaya geçer.',
    usoPhp:
      'Laravel ve Symfony: her zamanki gibi dump($x) ve dd($x). CodeIgniter 3 ve diğerleri: wd($x) sayfada hiçbir şey göstermeden gönderir.',
    confirmarPython:
      'Bu sitenin işlemleri PYTHONPATH içinde wolfdump modülünü alır (projeye hiçbir şey yazılmaz). İşlemlerin bir sonraki başlatılışından itibaren geçerlidir.',
    usoPython: 'from wolfdump import dump  →  dump(valor)',
    activar: 'Yakalamayı etkinleştir',
    cancelar: 'İptal',
    filtroSitio: 'Tüm siteler',
    filtroOrigen: 'Tüm kaynaklar',
    buscar: 'Metin, dosya veya URL içinde ara',
    limpiar: 'Temizle',
    confirmarLimpiar: 'Bellekteki tüm dökümler silinsin mi?',
    vacio: 'Henüz hiçbir döküm gelmedi.',
    vacioApagado: 'Başlamak için yakalamayı etkinleştirin ve bir siteyi başlatın.',
    elegir: 'Listeden bir döküm seçin.',
    copiar: 'Kopyala',
    copiado: 'Kopyalandı (anahtarlar maskelendi)',
    sinSitio: 'sitesiz',
    total: (n: number) => `bellekte ${n}`,
    archivo: 'Dosya',
    url: 'URL',
    pestanaVolcados: 'Dökümler',
    pestanaErrores: 'Hatalar',
    erroresDescripcion:
      'PHP, Nginx, laravel.log, CodeIgniter 3 ve Python günlüklerindeki hatalar gruplanır: tekrarlanan aynı hata sayaçla birlikte bir kez görünür.',
    erroresVacio: 'Günlüklerde hata yok. Yazıldıkları anda burada görünürler.',
    erroresElegir: 'Listeden bir hata seçin.',
    actualizar: 'Yenile',
    abrirEditor: 'Düzenleyicide aç',
    abrirEditorSinSitio: 'Yalnızca bir sitenin klasöründeki dosyalar açılabilir.',
    veces: (n: number) => `${n} kez`,
    primera: 'İlk görülme',
    ultima: 'Son görülme',
    fuente: 'Günlük',
    traza: 'Yığın izi (son görülme)',
    sinTraza: 'Yığın izi yok.',
  },
  contenedores: {
    descripcion:
      'Bu bilgisayardaki Docker veya Podman kapsayıcılarını görüntüleyin ve denetleyin. WolfCore Dev kapsayıcı, imaj veya birim oluşturmaz, silmez ve indirmez.',
    motor: 'Motor',
    refrescar: 'Yenile',
    detectando: 'Docker ve Podman aranıyor…',
    sinMotorTitulo: 'Docker veya Podman bulunamadı',
    sinMotor:
      'Bu bilgisayarda Docker veya Podman bulunamadı. WolfCore Dev bunları yüklemez: gerekiyorsa resmi sitesinden birini yükleyin ve Yenile düğmesine basın.',
    instalarDocker: 'Docker yükle',
    instalarPodman: 'Podman yükle',
    apagadoTitulo: (m: string) => `${m} yanıt vermiyor`,
    apagado: (m: string) =>
      `${m} yüklü ancak motoru yanıt vermiyor. Docker Desktop uygulamasını açın (veya «podman machine start» ile Podman makinesini başlatın) ve Yenile düğmesine basın.`,
    remoto:
      'Uzak bir bağlantı yok sayıldı (DOCKER_HOST, CONTAINER_HOST, bir bağlam veya varsayılan bağlantı): WolfCore Dev yalnızca bu bilgisayardaki motoru kullanır.',
    desdePath: 'Alışılmış kurulum klasöründe değil, PATH içinde bulundu.',
    version: (v: string) => `Sürüm ${v}`,
    vacio: 'Kapsayıcı yok.',
    columnas: {
      nombre: 'Ad',
      imagen: 'İmaj',
      estado: 'Durum',
      puertos: 'Bağlantı noktaları',
      compose: 'Compose',
      acciones: 'İşlemler',
    },
    estados: {
      corriendo: 'Çalışıyor',
      detenido: 'Durduruldu',
      pausado: 'Duraklatıldı',
      otro: 'Diğer',
    },
    codigoSalida: (n: number) => `kod ${n}`,
    iniciar: 'Başlat',
    detener: 'Durdur',
    reiniciar: 'Yeniden başlat',
    registros: 'Günlükler',
    confirmarDetenerTitulo: 'Kapsayıcı durdurulsun mu?',
    confirmarDetener: (n: string) =>
      `«${n}» durdurulacaktır. İçinde çalışan işlemler sonlandırılır (motor kapanması için birkaç saniye bekler). Hiçbir şey silinmez.`,
    confirmarReiniciarTitulo: 'Kapsayıcı yeniden başlatılsın mı?',
    confirmarReiniciar: (n: string) =>
      `«${n}» yeniden başlatılacaktır. İçinde çalışan işlemler durdurulur ve yeniden başlar. Hiçbir şey silinmez.`,
    confirmar: 'Onayla',
    cancelar: 'İptal',
    hecho: {
      iniciar: (n: string) => `«${n}» başlatıldı.`,
      detener: (n: string) => `«${n}» durduruldu.`,
      reiniciar: (n: string) => `«${n}» yeniden başlatıldı.`,
    },
    registroTitulo: (n: string) => `«${n}» günlükleri`,
    registroEsperando: 'Satırlar bekleniyor…',
    registroFin: 'Günlük akışı sona erdi (kapsayıcı durdu veya motor bağlantıyı kesti).',
    cerrar: 'Kapat',
  },
  versiones: {
    pestana: 'Sürümler',
    pestanaServicios: 'Hizmetler',
    elegirServicio: 'Hizmet',
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
        'Her ana sürümün (8.4, 17…) kendi veri klasörü ve bağlantı noktasıyla ayrı bir örneği vardır: birden fazlasını aynı anda çalıştırabilirsiniz. Yıldız, yeni projelerin kullanacağı sürümü gösterir.',
      pool: 'Çalışan her PHP sürümünün kendi PHP havuzu vardır; yıldız yeni projelerin kullanacağı sürümü gösterir.',
      unica:
        'Birden fazla sürüm yükleyebilirsiniz ancak yalnızca biri açık kalır: başka birini açmak etkin sürümü değiştirir.',
      ninguno:
        'Başlatılacak bir hizmet yoktur: projeler istedikleri sürümü veya varsayılan (yıldızlı) sürümü kullanır.',
    },
    filtroRama: 'Sürüm',
    todasRamas: 'Tüm sürümler',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Tümünü göster',
    origen: {
      vivo: 'Çevrimiçi',
      cache: (h: number) => (h < 1 ? '1 saatten yeni önbellek' : `${h} saatlik önbellek`),
      fija: 'Çevrimdışı liste',
    },
    actualizarLista: 'Listeyi yenile',
    errorCarga: 'Sürüm listesi okunamadı',
    vacio: 'Gösterilecek sürüm yok.',
    soporte: { lts: 'LTS', actual: 'Güncel', fin: 'Desteksiz', preview: 'Önizleme' },
    finSoporte: (f: string) => `${f} tarihine kadar destekli`,
    finSoportePasado: (f: string) => `${f} tarihinden beri desteksiz`,
    marcas: {
      instalada: 'Yüklü',
      encendida: 'Çalışıyor',
      actualizacion: (v: string) => `Güncelleme: ${v}`,
      bloqueada: 'Engelli',
      sinHuella: 'Yayımlanmış özet yok',
      huellaDebil: 'Yalnızca MD5 özeti',
      firmada: 'PGP imzalı',
    },
    ayudaFirmada:
      'Resmi kaynak bu indirmeyi PGP ile imzalar: WolfCore Dev yüklemeden önce uygulamada sabitlenmiş anahtarlarla imzayı doğrular.',
    ayudaSinHuella:
      'Resmi kaynak güçlü bir özet (SHA-256 veya SHA-512) yayımlamıyor: indirme doğrulanamaz.',
    instalar: 'Yükle',
    desinstalar: 'Kaldır',
    encender: 'Başlat',
    apagar: 'Durdur',
    actualizar: 'Güncelle',
    usarEsta: 'Bu sürümü kullan',
    usarEstaAyuda: (id: string) =>
      `${id} bu hizmetin başka bir sürümünü kullanıyor: verilerinin yedeği alınarak değiştirilir.`,
    predeterminada: 'Yeni projeler için varsayılan',
    hacerPredeterminada: 'Yeni projeler için kullan',
    predeterminadaHecha: (v: string) => `${v} varsayılan olarak ayarlandı.`,
    puerto: 'Bağlantı noktası',
    puertoDe: (id: string) => `${id} bağlantı noktası`,
    cambiarPuerto: 'Değiştir',
    puertoCambiado: (p: number) => `Bağlantı noktası ${p} olarak değiştirildi.`,
    puertoProyectosTitulo: 'Önceki bağlantı noktasını kullanan projeler',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Bu projeler .env dosyasında hâlâ ${viejo} bağlantı noktasını kullanıyor (değiştirilmedi): ${lista}. Bunu ${nuevo} olarak güncelleyin.`,
    resolver: 'Çöz',
    instalada: (v: string) => `${v} yüklendi.`,
    selector: { etiqueta: 'Örnek', predeterminada: 'varsayılan', apagada: 'kapalı' },
    dialogoSinHuella: {
      titulo: (v: string) => `${v} sürümünü özet olmadan yükle`,
      riesgo:
        'Bu sürüm için resmi kaynağın yayımladığı bir özet yok: WolfCore Dev indirilen dosyanın özgün olduğunu doğrulayamaz.',
      explicacion:
        'İndirme yine resmi siteden HTTPS ile yapılır ancak site veya bağlantı ele geçirilmişse fark edilmez. Yalnızca ihtiyacınız varsa yükleyin.',
      alternativa: (v: string) => `Aynı hizmetin doğrulanmış bir sürümü var: ${v}.`,
      casilla: 'Riski anlıyorum ve doğrulamadan yüklemek istiyorum',
      instalarVerificada: (v: string) => `${v} sürümünü yükle (doğrulanmış)`,
      instalarIgual: 'Doğrulamadan yükle',
    },
    dialogoActualizar: {
      titulo: (n: string) => `${n} güncelle`,
      tituloRama: (v: string) => `Yeni sürüm: ${v}`,
      ninguna: 'yok',
      instancia: (id: string) => `${id} örneği güncellenecektir. Hiçbir şey değiştirilmeden önce:`,
      pasoInstalar: (v: string) => `mevcut sürümün yanına ${v} yüklenir (mevcut sürüm silinmez);`,
      pasoVolcados: 'her veritabanı mevcut sürümle dışa aktarılır;',
      pasoCopia: 'örnek durdurulur ve tüm veri klasörü kopyalanır (soğuk yedek);',
      pasoArrancar: 'yeni sürümle başlatılır ve yanıt verdiği doğrulanır;',
      pasoVuelta:
        'başlamazsa önceki sürüme ve verilerine geri dönülür, yedek saklanır.',
      datos: 'Veriler:',
      respaldo: 'Yedek konumu:',
      espacio: 'Alan:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} boş; ${necesarios} gerekli`,
      datosQuedan:
        'Önceki veriler asla silinmez: yedek ve dökümler siz silene kadar Güncelleme yedekleri bölümünde kalır.',
      sinEspacio: 'Yedek için yeterli alan yok: yer açıp tekrar deneyin.',
      alLado: (v: string) =>
        `${v} yüklenir. Yüklü diğer sürümlere dokunulmaz; başka sürümü sabitleyen projeler onu kullanmaya devam eder.`,
      ramaExplicacion:
        'Yeni bir ana sürüm eskisinin yerini almaz: kendi veri klasörü ve bağlantı noktasıyla yeni bir örnek oluşturulur. Mevcut örnek aynı kalır.',
      copiarDesdeTitulo: 'Yeni örneğin verileri',
      copiarDesde: (id: string) =>
        `${id} örneğinden verileri kopyala (dışa aktarılıp geri yüklenir; özgün örneğe dokunulmaz)`,
      vacia: 'Boş başlat',
      ramaNota:
        'Veritabanı kullanıcıları kopyalanmaz; projeler yeni örneğin bağlantı noktasına yönlendirilmelidir.',
      crearInstancia: 'Yeni örnek oluştur',
      confirmar: 'Yedek alarak güncelle',
      hecho: (v: string) => `${v} güncellendi.`,
      fallo: 'Güncellenemedi',
      ramaCreada: (id: string) => `${id} örneği oluşturuldu.`,
      copiadas: (l: string) => `Kopyalananlar: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} kopyalanamadı: ${m}`,
    },
    limpieza: {
      boton: 'Kullanılmayan sürümleri temizle…',
      titulo: 'Kullanılmayan sürümleri temizle',
      intro:
        'Yalnızca hiçbir yerin kullanmadığı sürümlerin program dosyaları kaldırılır (bin klasörü). Veritabanı verilerine, örneklere ve projelerinize asla dokunulmaz.',
      cargando: 'Sürümler aranıyor…',
      vacia: 'Yüklü sürüm yok.',
      sinLibres: 'Yüklü tüm sürümler kullanımda: temizlenecek bir şey yok.',
      fallo: 'Temizlenemedi',
      fallaLista: 'Sürüm listesi okunamadı',
      bloqueada: 'Seçilemez',
      marcadas: (n: number, tam: string) => `${n} sürüm · ${tam}`,
      destinoTitulo: 'Bunlarla ne yapılsın',
      papelera: 'Çöp kutusuna taşı: 7 gün saklanır ve o zamana kadar diskte yer kaplamaya devam eder',
      definitivo: 'Kalıcı olarak sil: alanı hemen boşaltır ve geri alınamaz',
      avisoDefinitivo:
        'Kalıcı silme: bu sürümlere tekrar sahip olmak için yeniden indirmeniz gerekir.',
      instantanea:
        'Kalıcı silmeyi seçerseniz öncesinde ortam yapılandırmasının bir kopyası kaydedilir; çöp kutusundakiler kurtarılabilir.',
      entiendo: 'Geri alınamayacağını anlıyorum',
      confirmar: (n: number) => `${n} sürümü kaldır`,
      motivos: {
        predeterminada: 'Varsayılan sürüm',
        encendida: 'Açık veya çalışıyor',
        sitio: 'Bir proje tarafından kullanılıyor',
        instancia: 'Bir örnek tarafından kullanılıyor (kapalı olsa bile)',
        plantilla: 'Bir şablon tarafından kullanılıyor',
        workspace: 'Bir çalışma alanı tarafından kullanılıyor',
        runtime: 'Bir proje tarafından kullanılıyor',
        tarea: 'Zamanlanmış görevleri olan bir proje tarafından kullanılıyor',
        duda: 'Doğrulanamadı: dokunulmaz',
        datos: 'Yalnızca bu sürümün açabileceği verilere sahip',
        herramienta: 'phpMyAdmin veya Adminer tarafından kullanılıyor',
      },
      resultadoTitulo: 'Sonuç',
      liberadas: (tam: string) => `${tam} alan açıldı.`,
      enPapelera: (tam: string) => `${tam} çöp kutusunda (7 gün sonra temizlenir).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} sürüm bin klasöründen çıkarıldı ancak kalan parçalar uygulama yeniden açıldığında tekrar temizlenecek.`,
      instantaneaGuardada: 'Silme öncesinde ortam yedeği kaydedildi.',
      ajeno: (lista: string) =>
        `İçine sizin yüklediğiniz öğeleri içeriyor: ${lista}. Kaldırıldığında bunlar kaybolur.`,
      incluirAjeno: 'Bunlar kaybolsa da kaldır',
      sinCatalogo: 'Artık katalogda yok: kaldırırsanız yeniden indiremezsiniz.',
      papeleraTitulo: 'Çöp kutusunda',
      recuperar: 'Kurtar',
      recuperada: (v: string) => `${v} kurtarıldı.`,
      borradaEl: (f: string) => `${f} tarihinde silindi`,
      fallaRecuperar: 'Kurtarılamadı',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `${v} sürümünü kaldır`,
      binario: 'Yalnızca bu sürümün program dosyaları kaldırılır.',
      instancia: (id: string) =>
        `${id} örneği bu sürümü kullanıyor: durdurulur ve örnek listesinden çıkarılır.`,
      datosQuedan:
        'Verileriniz diskte kalır: bu sürümü yeniden yüklerseniz örnek onları tekrar açar.',
      borrarDatos: 'Verileri de sil',
      borrarAviso: (id: string) =>
        `${id} veri klasörü ve tüm veritabanları silinecektir. Bu işlem geri alınamaz. Onaylamak için "${id}" yazın.`,
      escriba: (id: string) => `Onaylamak için ${id} yazın`,
      desinstalar: 'Kaldır',
      desinstalarYBorrar: 'Kaldır ve verileri sil',
      unica:
        'Bu etkin sürümdür: yüklü tek sürümse hizmet kapalıyken kaldırılabilir (yüklü sürüm kalmaz); başka sürümler varsa önce başka birini etkin (yıldızlı) yapın.',
      predeterminada: (id: string) =>
        `${id} varsayılan örnektir: Veritabanları, .env bloğu ve bu motoru kullanan araçlar başka bir örneğe (farklı bağlantı noktasına) geçecektir.`,
      hecho: (v: string) => `${v} kaldırıldı.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `${id} sorununu çöz`,
      explicacion:
        'Bir güncelleme başarısız oldu ve bu örneğin verileri geri döndürülemedi; ne yapılacağını siz seçene kadar başlatılmaz. Hiçbir şey silinmez.',
      fallida: 'Etkilenen veriler:',
      respaldo: 'Yedek:',
      opciones: 'Ne yapılsın',
      devolver: (sello: string, tam: string) =>
        `${sello} yedeğini geri yükle (${tam}); mevcut klasör kenara ayrılır, silinmez`,
      usarActual: 'Mevcut veri klasörünü olduğu gibi kullan',
      notaActual:
        'Yalnızca mevcut klasörde eksiksiz veriler varsa seçin; yoksa bir yedeği seçin.',
      notaDevolver: 'Yedek kopyalanır, doğrulanır ve ancak ondan sonra yerine konur.',
      escriba: (id: string) => `Onaylamak için ${id} yazın`,
      elegirVersion:
        'Kilit işareti okunamadı: verilerin hangi sürümle açılacağını seçin (güncellemeden önceki sürüm).',
      version: 'Sürüm',
      confirmar: 'Çöz',
      hecho: (id: string) => `${id} kilidi açıldı. Artık başlatabilirsiniz.`,
    },
    respaldos: {
      titulo: 'Güncelleme yedekleri',
      descripcion:
        'Güncellemelerden ve yeni sürümlerden kalan yedekler. Her örneğin kullandığı veri klasörü burada asla görünmez.',
      vacio: 'Yedek yok.',
      tipos: {
        respaldo: 'Soğuk yedek',
        volcados: 'Veritabanı dökümleri',
        fallida: 'Başarısız bir sürümün verileri',
        restaurando: 'Yarım kalmış geri yükleme',
        copia: 'Yeni bir sürüm için dökümler',
      },
      archivos: (n: number) => `${n} dosya`,
      borrar: 'Sil',
      borrarDe: (n: string) => `${n} yedeğini sil`,
      confirmarTitulo: 'Yedeği sil',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) silinecektir. Bu işlem geri alınamaz. Örneklerin kullandığı verilere dokunulmaz.`,
      borrado: 'Yedek silindi.',
    },
  },
  navGrupos: {
    trabajo: 'Çalışma',
    entorno: 'Ortam',
    utilidades: 'Yardımcı araçlar',
  },
  avisos: {
    campana: 'Bildirimler',
    campanaConNuevos: (n: number) => `Bildirimler: ${n} okunmamış`,
    titulo: 'Bildirim merkezi',
    vacio:
      'Bildirim yok. Hizmet kesintileri, meşgul bağlantı noktaları ve süresi yaklaşan sertifikalar burada görünür.',
    marcarTodos: 'Tümünü okundu olarak işaretle',
    limpiar: 'Geçmişi temizle',
    ver: 'Görüntüle',
    actualizar: 'Güncelle',
    verVersiones: 'Sürümleri gör',
    cerrar: 'Kapat',
    niveles: { info: 'Bilgi', aviso: 'Uyarı', error: 'Hata' },
    sinLeer: 'Okunmamış',
  },
  barra: {
    paleta: 'Komut ara veya çalıştır',
    atajoPaleta: 'Ctrl+K',
    tema: 'Temayı değiştir',
    idioma: 'Dili değiştir',
  },
  preferencias: {
    titulo: 'Görünüm ve dil',
    descripcion: 'Değişiklikler anında uygulanır ve bu bilgisayarda saklanır.',
    tema: 'Tema',
    temas: { sistema: 'Sistem', claro: 'Açık', oscuro: 'Koyu' },
    idioma: 'Dil',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語', ko: '한국어', hi: 'हिन्दी', tr: 'Türkçe', id: 'Bahasa Indonesia' },
    acento: 'Vurgu rengi',
    acentos: {
      indigo: 'Çivit',
      azul: 'Mavi',
      verde: 'Yeşil',
      violeta: 'Mor',
      naranja: 'Turuncu',
      rosa: 'Pembe',
    },
    acentoPropio: (color: string) => `Özel (${color})`,
    errorGuardar: 'Tercih kaydedilemedi',
    asistente: 'İlk kullanım sihirbazı',
    asistenteAyuda:
      'Başlangıç adımlarını yeniden gözden geçirin: proje klasörü, temel araçlar, CA, GitHub ve izlenen klasör.',
    asistenteAbrir: 'Sihirbazı aç',
  },
  paleta: {
    titulo: 'Komut paleti',
    placeholder: 'Bir ekran, hizmet, proje veya araç arayın…',
    sinResultados: 'Aramanızla eşleşen komut yok.',
    ayuda: 'Gezinmek için ↑ ↓ · Çalıştırmak için Enter · Kapatmak için Esc',
    grupos: {
      navegacion: 'Git',
      servicios: 'Hizmetler',
      proyectos: 'Projeler',
      herramientas: 'Araçlar',
      github: 'GitHub',
      general: 'Genel',
    },
    irA: (pantalla: string) => `${pantalla} ekranına git`,
    encender: (servicio: string) => `${servicio} hizmetini başlat`,
    apagar: (servicio: string) => `${servicio} hizmetini durdur`,
    iniciarTodo: 'Tüm hizmetleri başlat',
    detenerTodo: 'Tüm hizmetleri durdur',
    iniciarWorkspace: (n: string) => `${n} çalışma alanını başlat`,
    detenerWorkspace: (n: string) => `${n} çalışma alanını durdur`,
    abrirSitio: (nombre: string) => `${nombre} sitesini tarayıcıda aç`,
    traerCambios: (nombre: string) => `${nombre} projesinde değişiklikleri çek`,
    abrirHerramienta: (nombre: string) => `${nombre} aracını aç`,
    clonar: 'GitHub üzerinden bir depo klonla',
    agregarProyecto: 'Proje ekle',
    nuevoProyecto: 'Yeni proje oluştur',
    tema: (tema: string) => `Tema: ${tema}`,
    idioma: (idioma: string) => `Dil: ${idioma}`,
    asistente: 'İlk kullanım sihirbazını aç',
  },
  nuevoProyecto: {
    titulo: 'Yeni proje',
    boton: 'Yeni proje',
    descripcion:
      'Sıfırdan bir proje oluşturun: klasör, HTTPS destekli site, veritabanı ve bağlantısı.',
    pasos: { tipo: 'Tür', datos: 'Bilgiler', resumen: 'Özet', crear: 'Oluşturuluyor' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Composer ile; uygulama anahtarı, veritabanı ve migration işlemleri.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: '.env dosyasıyla resmi Appstarter.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'database.php yapılandırılmış klasik framework.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: '.env.local dosyasıyla resmi iskelet (veya webapp).',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Sanal ortam, requirements.txt ve uvicorn işlemi.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'wp-config.php hazır resmi indirme.' },
      estatico: {
        nombre: 'Statik site',
        descripcion: 'Veritabanı olmadan Nginx tarafından sunulan HTML ve CSS.',
      },
    },
    campos: {
      nombre: 'Proje adı',
      nombrePlaceholder: 'magazam',
      nombreAyuda: (dominio: string) => `${dominio} olacak: küçük harfler, rakamlar ve tire.`,
      carpeta: 'Üst klasör',
      elegirCarpeta: 'Klasör seç…',
      cambiarCarpeta: 'Klasörü değiştir…',
      carpetaAyuda:
        'Proje bu klasörün içinde kendi adıyla yeni bir klasörde oluşturulur. Boş olmalı veya henüz var olmamalıdır.',
      php: 'PHP sürümü',
      python: 'Python sürümü',
      sinInstalada: 'Yüklü sürüm yok: Hizmetler bölümünden yükleyin.',
      conBase: 'Proje için bir veritabanı oluştur',
      sinBase: 'Veritabanı olmadan',
      instancia: 'Veritabanı sunucusu',
      apagada: 'kapalı',
      apagadaAyuda:
        'Bu sunucu kapalı: projeyi oluşturmadan önce Hizmetler bölümünden başlatın.',
      sinMotores: 'Bu proje türü için yüklü bir veritabanı sunucusu yok.',
      nombreBase: 'Veritabanı adı',
      starterKit: 'Başlangıç kiti',
      starterKits: { ninguno: 'Yok', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Web paketlerini dahil et (webapp)',
      pgvector: 'pgvector etkinleştir (vektör araması)',
    },
    huella: {
      titulo: 'WordPress yalnızca zayıf bir özet yayımlıyor',
      riesgo:
        'Yayımlanan özet artık güvenli sayılmayan SHA-1 algoritmasını kullanır ve dosya ile aynı siteden gelir.',
      explicacion:
        'Site veya bağlantı ele geçirilmişse değiştirilmiş bir dosya doğrulamadan geçebilir. İndirme yine wordpress.org üzerinden HTTPS ile yapılır. Yalnızca bu kaynağa güveniyorsanız devam edin.',
      leyendo: 'Yayımlanan özet okunuyor…',
      noDisponible:
        'Özet şu anda okunamadı (bağlantı yok veya kaynak yanıt vermedi); oluşturma sırasında tekrar okunacaktır.',
      fuente: 'Kaynak: wordpress.org',
      casilla: 'Özetin zayıf olduğunu anlıyorum ve projeyi yine de oluşturmak istiyorum',
    },
    resumen: {
      titulo: 'Oluşturulacak öğeler',
      intro: 'Başlamadan önce kontrol edin.',
      tipo: 'Tür',
      carpeta: 'Klasör',
      sitio: 'Site',
      dominio: 'Alan adı',
      https: 'HTTPS adresi',
      php: 'PHP',
      python: 'Python',
      base: 'Veritabanı',
      env: 'Bağlantının yazılacağı dosya',
      nota: 'Bir adım başarısız olursa hiçbir şey silinmez: neyin oluşturulduğunu görür ve yeniden deneyebilirsiniz.',
    },
    errores: {
      nombreVacio: 'Proje için bir ad yazın.',
      nombreInvalido:
        'Ad yalnızca küçük harf, rakam ve tire içerebilir (en fazla 40), tire ile başlayıp bitemez.',
      sinCarpeta: 'Projenin üst klasörünü seçin.',
      sinPhp: 'Bir PHP sürümü seçin (yoksa Hizmetler bölümünden yükleyin).',
      sinPython: 'Bir Python sürümü seçin (yoksa Hizmetler bölümünden yükleyin).',
      sinInstancia: 'Veritabanının oluşturulacağı sunucuyu seçin veya veritabanı seçeneğini kaldırın.',
      baseInvalida: 'Veritabanı adı bu motor için geçerli değil.',
      motorNoVale: 'WordPress için MySQL veya MariaDB gerekir.',
      pgvectorMotor: 'pgvector için PostgreSQL gerekir.',
      huellaDebil: 'WordPress özetinin zayıf olduğunu anladığınızı onaylayın.',
    },
    acciones: {
      cambiarCarpeta: 'Başka klasör seç',
      cambiarBase: 'Veritabanı adını değiştir',
      cambiarNombre: 'Adı değiştir',
      reintentarPaso: 'Adımı yeniden dene',
      servicios: 'Hizmetlere git',
      confirmarHuella: 'Onayı gözden geçir',
    },
    botones: {
      siguiente: 'İleri',
      atras: 'Geri',
      crear: 'Projeyi oluştur',
      creando: 'Oluşturuluyor…',
      cerrar: 'Kapat',
      abrirEditor: 'Düzenleyicide aç',
      verSitio: 'Siteyi görüntüle',
      verProyecto: 'Projelerde gör',
    },
    progreso: {
      titulo: 'Proje oluşturuluyor',
      listo: 'Proje oluşturuldu.',
      fallo: (paso: string) =>
        `«${paso}» adımı başarısız oldu. Hiçbir şey silinmedi: adımı yeniden deneyin veya sorunu düzeltip tekrar deneyin.`,
      quedo: (partes: string) => `Oluşturulanlar: ${partes}.`,
      quedoCarpeta: 'klasör',
      quedoBase: (nombre: string) => `${nombre} veritabanı`,
      quedoSitio: 'site',
      avisos: 'Uyarılar',
      sinUsuarioPropio:
        'Sistem şifrelemesi kullanılamıyor: proje veritabanı yönetici bağlantısını kullanıyor. Kullanılabilir olduğunda .env yöneticisinde "Özel kullanıcı kullan" seçeneğini uygulayın.',
      editorFallo: 'Düzenleyici açılamadı.',
    },
  },
  importar: {
    boton: 'İçe aktar…',
    titulo: 'Laragon, XAMPP veya Herd içinden aktar',
    intro:
      'Siteler bulundukları yerde bağlanır: hiçbir klasör taşınmaz, kopyalanmaz veya değiştirilmez. İsterseniz veritabanları da kopyalanır. WolfCore Dev diğer programların kurulumlarını yalnızca okur.',
    buscando: 'Kurulumlar aranıyor…',
    nada: 'Alışılmış klasörlerde Laragon, XAMPP veya Herd bulunamadı.',
    errorVista: 'İçe aktarılabilecek öğeler aranamadı',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Siteler',
      todos: 'Tümünü seç',
      ninguno: 'Tümünü kaldır',
      dominio: (d: string) => `Alan adı ${d}`,
      dominioPropuesto: (d: string) => `Alan adı ${d} (önerilen)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP belirlenemedi',
      base: (nombre: string, motor: string) => `Veritabanı ${nombre} (${motor})`,
      yaVinculado: 'Zaten bir WolfCore Dev sitesi',
      dominioEnUso: 'Başka bir site bu alan adını kullanıyor',
    },
    avisos: {
      sin_dominio: 'Diğer programda alan adı yok: bir tane öneriliyor.',
      dominio_invalido: 'Alan adı geçerli değil: bir tane öneriliyor.',
      sin_vhost: 'Kendi sanal sunucusu yok: bir alan adı öneriliyor.',
      php_desconocido: 'Hangi PHP sürümünü kullandığı bilinmiyor: yüklü bir sürüm seçiliyor.',
      base_no_local: 'Veritabanı başka bir sunucuda: içe aktarılmaz.',
      base_nombre_invalido: 'Veritabanı adı geçerli değil: içe aktarılmaz.',
      motor_no_soportado: 'Veritabanı MySQL veya MariaDB değil: içe aktarılmaz.',
    },
    problemas: {
      titulo: (n: number) => `${n} öğe atlandı veya okunamadı`,
    },
    bases: {
      titulo: 'Veritabanları',
      importarBases: 'Veritabanlarını da içe aktar',
      ayuda:
        'Devam etmeden önce diğer programın veritabanı sunucusunu başlatın: WolfCore Dev harici programları başlatmaz veya durdurmaz. Parola yalnızca bu aktarımda kullanılır ve kaydedilmez.',
      destino: 'Hedef sunucu',
      apagada: 'kapalı',
      sinMotores:
        'Yüklü MySQL veya MariaDB yok: veritabanı aktarmak için Hizmetler bölümünden yükleyin.',
      puerto: 'Kaynak sunucu bağlantı noktası',
      usuario: 'Kullanıcı',
      clave: 'Parola',
      claveAyuda: 'Kullanıcının parolası yoksa boş bırakın (Laragon veya XAMPP içindeki root gibi).',
      existe: 'hedefte zaten var',
      reemplazar: 'Değiştir (öncesinde yedek alınır)',
      noSeToca: 'İşaretlemezseniz dokunulmaz.',
    },
    pasos: { elegir: 'Seç', confirmar: 'Onayla' },
    continuar: 'Devam et',
    volver: 'Geri',
    cancelar: 'İptal',
    importar: 'İçe aktar',
    cerrar: 'Kapat',
    sinSeleccion: 'En az bir site seçin.',
    origenIncompleto: 'Kaynak sunucunun bağlantı noktasını ve kullanıcısını belirtin.',
    confirmar: {
      titulo: 'İçe aktarmayı onaylayın',
      sitios: (n: number) =>
        `${n} site mevcut klasöründe bağlanacaktır. Hiçbir dosya taşınmaz, kopyalanmaz veya değiştirilmez.`,
      sinConfianza:
        'İçe aktarılan hiçbir site siz «Bu depoya güveniyorum» seçeneğini işaretleyene kadar tarif çalıştırmaz.',
      hosts:
        'Nginx ve hosts dosyası güncellenecektir (Windows yönetici izni isteyebilir).',
      basesNuevas: (nombres: string) => `Kopyalanacak veritabanları: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Zaten var olan bu veritabanları değiştirilecektir: ${nombres}. Öncesinde her birinin yedeği kaydedilir.`,
      basesSinTocar: (nombres: string) => `Zaten var olan bu veritabanlarına dokunulmayacaktır: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Diğer programın sunucusundan aktarılacaktır (127.0.0.1:${puerto}, kullanıcı ${usuario}). Değiştirilmeden okunur.`,
      sinBases: 'Hiçbir veritabanı içe aktarılmayacak.',
      proteccion:
        'Her veritabanının yapısı önceden denetlenir ve veriler kısıtlı bir kullanıcıyla aktarılır: bir hata olursa veritabanı olduğu gibi kalır.',
    },
    resultado: {
      titulo: 'İçe aktarma sonucu',
      importando: 'İçe aktarılıyor…',
      cancelar: 'İçe aktarmayı iptal et',
      restaurada: 'Özgün veritabanı yedeğinden otomatik olarak geri yüklendi: olduğu gibi kaldı.',
      sitioOk: 'İçe aktarıldı',
      sitioFallo: 'İçe aktarılamadı',
      baseOk: (n: string) => `${n} veritabanı içe aktarıldı`,
      baseFallo: (n: string) => `${n} veritabanı içe aktarılamadı`,
      copiaPrevia: (ruta: string) => `Önceki veritabanı yedeği: ${ruta}`,
      phpDistinto: (v: string) => `PHP ${v} kullanıldı (özgün sürüm yüklü değildi).`,
      sinAplicar:
        'Nginx veya hosts dosyası tam güncellenmedi: Projeler bölümündeki uyarıyı inceleyip yeniden deneyin.',
      resumen: (s: number, b: number) =>
        `${s} site içe aktarıldı, ${b} veritabanı içe aktarıldı.`,
      errorImportar: 'İçe aktarılamadı',
    },
  },
  plantillas: {
    guardarComo: 'Şablon olarak kaydet…',
    dialogo: {
      titulo: (nombre: string) => `«${nombre}» projesini şablon olarak kaydet`,
      intro:
        'Şablon; tarifi, PHP ve Nginx ayarlarını, eklentileri ve veritabanı şemasını (hiç satır olmadan yalnızca yapı) kaydeder. Asla parola, anahtar veya veritabanı verisi kaydetmez.',
      nombre: 'Şablon adı',
      nombrePlaceholder: 'Temel projem',
      conArchivos: 'Proje dosyalarını da dahil et',
      conArchivosAyuda: 'Bunu seçmezseniz yalnızca tarif, ayarlar ve şema kaydedilir.',
      siempre: 'Her zaman hariç tutulanlar',
      siempreLista:
        '.env ve .env.*, vendor, node_modules, .git, .venv, günlükler, dökümler ve dosya veritabanları (*.sql, *.dump, *.sqlite), anahtarlar ve sertifikalar (*.pem, *.key, *.crt…), wp-config.php ve wolfcore.yml. Anahtar veya parola içeren bir dosya da hariç tutulur.',
      extra: 'Ayrıca hariç tut (satır başına bir tane)',
      extraAyuda: 'Projeye göre göreceli adlar veya yollar, örneğin uploads veya public/build.',
      vista: 'Kaydedilecek öğeler',
      calculando: 'Hesaplanıyor…',
      resumen: (archivos: number, tamano: string) => `${archivos} dosya · ${tamano}`,
      fuera: (n: number) => `${n} hariç tutuldu`,
      sinArchivos: 'Yalnızca tarif, ayarlar ve şema kaydedilecek; hiçbir dosya eklenmeyecek.',
      baseVolcado: (nombre: string, servidor: string) =>
        `${nombre} veritabanının (sunucu ${servidor}) yalnızca yapısı kaydedilecek, hiçbir satır eklenmeyecek.`,
      sinBase: 'Proje bir veritabanı bildirmiyor: hiçbir şema kaydedilmeyecek.',
      avisoMongodb: 'Bu proje MongoDB kullanıyor: şeması (koleksiyonlar ve dizinler) kaydedilmez.',
      incluirDeTodosModos: 'Yine de dahil et',
      avisoIncluir: 'Bu dosya gerçek bir anahtar içeriyorsa şablonun içinde kalacaktır.',
      guardar: 'Şablonu kaydet',
      guardada: (nombre: string) => `«${nombre}» şablonu kaydedildi.`,
      errorGuardar: 'Şablon kaydedilemedi',
      errorVista: 'Önizleme hesaplanamadı',
      cancelar: 'İptal',
    },
    lista: {
      titulo: 'Şablonlarım',
      ayuda:
        'Mevcut bir projenizin tarifi, ayarları ve şemasıyla (veri olmadan) yeni bir proje başlatın.',
      vacia:
        'Henüz şablon yok. Bir projeyi kart menüsünden şablon olarak kaydedin.',
      conArchivosEtiqueta: 'dosyalarla',
      soloEsquema: 'tarif ve şema',
      conBase: (motor: string) => `verisiz ${motor} veritabanı`,
      borrarEtiqueta: (nombre: string) => `${nombre} şablonunu sil`,
      borrarTitulo: (nombre: string) => `${nombre} şablonu silinsin mi?`,
      borrarTexto:
        'Yalnızca şablon silinir. Onunla oluşturulan projelere ve özgün projeye dokunulmaz.',
      borrada: 'Şablon silindi.',
      errorBorrar: 'Şablon silinemedi',
      errorLista: 'Şablonlar okunamadı',
      desde: (nombre: string) => `Şablon: ${nombre}`,
      avisoSinBase: 'Bu şablonda veritabanı yok.',
      importadaEtiqueta: 'içe aktarılmış',
      avisoImportada:
        'Şablon üçüncü bir taraftan geliyor: proje güvensiz olarak ve işlemleri başlatılmadan oluşturulur; siteyi açmak kodunu çalıştırır. Önce dosyalarını inceleyin.',
      generadoresTitulo: 'Sıfırdan projeler',
    },
  },
  env: {
    accion: '.env değişkenleri…',
    titulo: (nombre: string) => `${nombre} .env dosyası`,
    intro:
      'Gizli değerler maskelenmiş olarak gösterilir. Tam değer yalnızca o değişkende «Göster» düğmesine bastığınızda görünür ve 30 saniye sonra yeniden gizlenir. Kaydetmeden önce mevcut .env dosyasının tarihli bir yedeği alınır.',
    noExiste: 'Bu projenin henüz bir .env dosyası yok: kaydettiğinizde oluşturulacak.',
    tablaEtiqueta: '.env değişkenleri',
    sinVariables: '.env dosyasında değişken yok.',
    secretaEtiqueta: 'gizli',
    duplicadaEtiqueta: 'yinelenen',
    duplicadaAyuda:
      'Bu değişken .env dosyasında birden fazla kez geçiyor: sonuncusu gösterilir ve değiştirilir.',
    soloLecturaEtiqueta: 'çok satırlı',
    soloLecturaAyuda: 'Birden fazla satıra yayılıyor: dosyada elle düzenleyin.',
    seQuitara: 'Kaydedince kaldırılacak',
    valorNuevo: 'Yeni değer',
    valorNuevoDe: (clave: string) => `${clave} için yeni değer`,
    valorDe: (clave: string) => `${clave} değeri`,
    vacio: '(boş)',
    mostrar: 'Göster',
    ocultar: 'Gizle',
    mostrarEtiqueta: (clave: string) => `${clave} değerini göster`,
    ocultarEtiqueta: (clave: string) => `${clave} değerini gizle`,
    cambiar: 'Değiştir',
    deshacer: 'Geri al',
    deshacerEtiqueta: (clave: string) => `${clave} değişikliğini geri al`,
    quitar: 'Kaldır',
    quitarEtiqueta: (clave: string) => `${clave} değişkenini kaldır`,
    errorRevelar: 'Değer gösterilemedi',
    agregarTitulo: 'Değişken ekle',
    agregarNombre: 'AD',
    agregarValor: 'değer',
    agregar: 'Ekle',
    nombreInvalido:
      'Rakamla başlamadan harf, rakam, alt çizgi ve nokta kullanın; ve bu ad zaten var olmamalıdır.',
    comparar: {
      titulo: 'Örnek dosyayla karşılaştır',
      sinEjemplo: 'Projede karşılaştırılacak bir .env.example dosyası yok.',
      alDia: '.env dosyası örnek dosyayla aynı değişkenlere sahip.',
      faltan: (n: number) => `${n} eksik:`,
      sobran: (n: number) => `${n} fazladan (örnekte yok):`,
      distintas: (n: number) => `Örnekten farklı değere sahip ${n} değişken:`,
      agregarFaltantes: 'Eksikleri ekle',
    },
    bloques: {
      titulo: 'Değişken bloğu ekle',
      ayuda:
        'Bu konudan .env dosyasında eksik olan değişkenleri ekler (mevcut olanlara dokunulmaz), parola veya anahtar içermez; sonra tabloda tamamlayın.',
      bd: 'Veritabanı',
      correo: 'E-posta',
      ia: 'Yapay zeka',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Özel kullanıcı kullan',
      ayuda:
        'Yalnızca bu proje için (sadece kendi veritabanında yetkili, asla yönetici olmayan) bir veritabanı kullanıcısı oluşturur ve .env dosyasına yazar. Şu anda WolfCore Dev MySQL ve MariaDB ile çalışır.',
      confirmarTitulo: 'Veritabanı için özel kullanıcı kullanılsın mı?',
      confirmarTexto:
        'Yalnızca bu projenin veritabanında yetkili, rastgele parolalı yeni bir kullanıcı oluşturulur ve .env içindeki bağlantı kullanıcısı ile parolası değiştirilir. Öncesinde mevcut .env yedeklenir; yeni parola projenin .env dosyasında ve WolfCore Dev içinde şifreli olarak saklanır.',
      confirmar: 'Oluştur ve kullan',
      hecho: (usuario: string) => `Proje artık ${usuario} kullanıcısını kullanıyor.`,
      compartirTitulo: 'Başka bir projenin kullanıcısı paylaşılsın mı?',
      compartirTexto: (base: string, proyecto: string) =>
        `${base} veritabanını ${proyecto} da kullanıyor. Kullanıcısı paylaşılsın mı? Bu proje aynı kullanıcıyı ve parolayı kullanır; parola değişmez, bu nedenle ${proyecto} bağlı kalmaya devam eder.`,
      compartir: 'Kullanıcıyı paylaş',
      error: 'Veritabanı kullanıcısı değiştirilemedi',
    },
    copias: {
      titulo: 'Bir yedeğe dön',
      ninguna: 'Bu .env dosyasının henüz yedeği yok.',
      volver: 'Bu yedeğe dön',
      confirmarTitulo: 'Bir .env yedeğine dönülsün mü?',
      confirmarTexto: (fecha: string) =>
        `Mevcut .env dosyası ${fecha} tarihli yedekle değiştirilecektir. Öncesinde mevcut dosyanın başka bir yedeği kaydedilir, böylece bu işlem de geri alınabilir.`,
      hecho: 'Yedeğe dönüldü.',
      error: 'Yedeğe dönülemedi',
    },
    cambiosPendientes: (n: number) => `${n} kaydedilmemiş değişiklik`,
    descartar: 'Değişiklikleri at',
    guardar: 'İncele ve kaydet…',
    cerrar: 'Kapat',
    cerrarTitulo: 'Kaydetmeden kapatılsın mı?',
    cerrarTexto: (n: number) => `${n} kaydedilmemiş değişiklik var. Kapatırsanız kaybolurlar.`,
    cerrarDescartar: 'Kapat ve at',
    seguirEditando: 'Düzenlemeye devam et',
    confirmar: {
      titulo: '.env değişikliklerini kaydet',
      texto:
        'Değişecek öğeler bunlardır. Gizli değerler maskelenmiş olarak gösterilir. Mevcut .env dosyasının tarihli bir yedeği kaydedilir ve dosya tek seferde yazılır.',
      sinCambios: 'Kaydedilecek değişiklik yok.',
      agregarGitignore: '.env dosyasını projenin .gitignore dosyasına ekle',
      aceptarVersionado: 'Riski anlıyorum ve yine de kaydetmek istiyorum',
      guardar: 'Değişiklikleri kaydet',
      versionado:
        'Git bu projenin .env dosyasını zaten izliyor: .gitignore içinde olsa bile bir sonraki commit değerlerini gönderecektir. git rm --cached .env ile dizinden çıkarın.',
      versionadoDesconocido:
        'Git tarafından bu projenin .env dosyasının izlenip izlenmediği doğrulanamadı; kaydetmek için ayrıca onaylayın.',
    },
    errorVistaPrevia: 'Önizleme hazırlanamadı',
    errorGuardar: '.env kaydedilemedi',
    guardado: '.env kaydedildi.',
    guardadoConCopia: '.env kaydedildi; önceki sürüm yedek olarak saklandı.',
  },
  asistenteInicio: {
    titulo: 'WolfCore Dev hoş geldiniz',
    subtitulo:
      'Ortamınızı hazırlamak için beş adım. Siz ilgili adımın düğmesine basana kadar hiçbir şey yüklenmez veya değiştirilmez.',
    paso: (n: number, total: number) => `Adım ${n} / ${total}`,
    anterior: 'Önceki',
    siguiente: 'Sonraki',
    omitirTodo: 'Sihirbazı atla',
    terminar: 'Bitir',
    hecho: 'Tamamlandı',
    reabrir: 'Ayarlar bölümünden tekrar açabilirsiniz.',
    pasos: {
      carpeta: {
        titulo: 'Proje klasörü',
        texto:
          'Projelerinizi sakladığınız yer. Yeni depolar buraya klonlanır ve son adımda izlenen klasör burasıdır.',
        elegir: 'Klasör seç',
        actual: (ruta: string) => `Seçilen klasör: ${ruta}`,
        guardada: (ruta: string) => `Mevcut klasör: ${ruta}`,
        ninguna: 'Seçilmedi: varsa C:\\Proyectos kullanılır.',
      },
      basicos: {
        titulo: 'Temel araçları yükle',
        texto:
          'Resmi kaynaklarından doğrulanmış özetle Nginx, PHP 8.4, Composer ve Node LTS. Her biri yalnızca kendi düğmesine bastığınızda yüklenir.',
        instalado: 'Yüklü',
        instalar: (version: string) => `${version} yükle`,
        sinVersion: 'Katalogda sürüm yok',
        cargando: 'Sürümler aranıyor…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'Yerel sertifika yetkilisine güven',
        texto:
          '.test sitelerinin HTTPS üzerinden uyarı vermeden açılması için Windows, WolfCore Dev yetkilisine güvenmelidir. Windows sizden onay isteyecektir.',
        confiar: 'CA yetkilisine güven',
        confiada: 'Windows yerel yetkiliye zaten güveniyor.',
      },
      github: {
        titulo: 'GitHub bağla',
        texto:
          'Depolarınızı görmek ve tek tıklamayla klonlamak için. GitHub CLI oturumunu veya bu bilgisayarda şifreli saklanan kişisel bir belirteci kullanın.',
      },
      vigilar: {
        titulo: 'Klasörü izle',
        texto:
          'WolfCore Dev, proje klasöründe beliren her yeni klasörü site olarak kurmanızı önerir. Onayınız olmadan hiçbir şey kurulmaz.',
        activar: 'Bu klasörü izle',
        activa: (ruta: string) => `${ruta} izleniyor`,
        sinCarpeta: 'Önce proje klasörünü seçin (adım 1).',
      },
    },
  },
  /** Bir profili içe veya dışa aktarma sonucu (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Yedekleme ve profiller',
      descripcion:
        'Bir profil ortamınızı başka bir bilgisayara taşır: siteler, sürümler, örnekler, şablonlar ve ayarlar. Asla anahtar, belirteç veya parola içermez.',
      aislado: {
        titulo: 'Deneme klasörü',
        texto: (ruta: string) =>
          `WolfCore Dev bir deneme veri klasörü kullanıyor (${ruta}). Burada yaptıklarınız gerçek klasörünüze veya bilgisayarınıza dokunmaz: hosts dosyası yazılmaz ve sertifika yüklenmez.`,
      },
      exportar: {
        titulo: 'Ortamı dışa aktar',
        texto:
          'Siteleriniz, sürümleriniz, örnekleriniz, şablonlarınız ve ayarlarınızla bir .wolfperfil dosyası kaydeder.',
        bases: 'Veritabanlarını dahil et',
        basesAyuda:
          'Tam dökümler (müşteri verilerinizle birlikte) parola cümlesiyle şifrelenerek taşınır.',
        ca: 'Sertifika yetkilisini (CA) dahil et',
        caAyuda: 'Parola cümlesiyle şifrelenir. Yalnızca kendi bilgisayarınıza içe aktarın.',
        certificados: 'Site sertifikalarını dahil et',
        certificadosAyuda: 'Yalnızca CA ile birlikte ve onunla şifrelenerek taşınır.',
        frase: 'Parola cümlesi',
        fraseRepetir: 'Parola cümlesini tekrarla',
        fraseAyuda: (minimo: number) =>
          `En az ${minimo} karakter. Olmadan veritabanları ve CA kurtarılamaz; hiçbir yerde saklanmaz.`,
        problemas: {
          frase_corta: (minimo: number) => `Parola cümlesi en az ${minimo} karakter olmalıdır.`,
          frase_distinta: 'İki parola cümlesi eşleşmiyor.',
          certificados_sin_ca: 'Sertifikalar yalnızca CA ile birlikte taşınır.',
        },
        exportar: 'Profili dışa aktar…',
        nota: 'Profil asla anahtar, belirteç veya parola içermez; anlık görüntüler, çöp kutusu, yedekler ve data klasörü de dahil edilmez.',
        listo: 'Profil dışa aktarıldı',
        guardado: (archivo: string, tamano: string) => `${archivo} konumuna kaydedildi (${tamano}).`,
      },
      importar: {
        titulo: 'Profil içe aktar',
        texto:
          'Bir .wolfperfil dosyası seçin. Hiçbir şey değiştirilmeden önce nelerin değiştirileceğini, kaldırılacağını veya beklemede kalacağını görürsünüz; değiştirilen öğelerin yedeği alınır.',
        boton: 'Profil içe aktar…',
      },
      instantaneas: {
        titulo: 'Ortam anlık görüntüleri',
        texto:
          'PHP veya Nginx güncellenmeden ve bir profil içe aktarılmadan önce WolfCore Dev; yapılandırmanızın, Nginx ayarlarının ve php.ini dosyalarının anahtarsız ve verisiz, yalnızca size özel bir yedeğini alır. Son 10 kayıt saklanır.',
        compartidas:
          'Bu 10 kayıt tüm nedenler arasında paylaşılır: yeni biri alındığında elle alınmış olsa bile en eskisi değiştirilir.',
        tomar: 'Şimdi bir tane al',
        tomada: 'Anlık görüntü kaydedildi.',
        sinNada: 'Henüz kopyalanacak bir şey yok.',
        vacia: 'Henüz anlık görüntü yok.',
        motivos: {
          actualizar: 'Güncelleme öncesi',
          'importar-perfil': 'Profil içe aktarma öncesi',
          'limpiar-versiones': 'Sürüm temizleme öncesi',
          manual: 'Elle',
        },
      },
    },
    reasignar: {
      titulo: 'Site klasörleri',
      texto:
        'Bu klasörler diğer bilgisayardan geliyor. Bu bilgisayardaki yerlerini bulun veya siteyi beklemede olarak aktarın: siz klasörü seçene kadar klasörsüz kalır.',
      sitio: 'Site',
      origen: 'Profildeki klasör',
      destino: 'Bu bilgisayardaki klasör',
      existe: 'Var',
      noExiste: 'Bu bilgisayarda yok',
      buscar: 'Klasör ara…',
      cambiar: 'Değiştir',
      comoPendiente: 'Yine de beklemede olarak aktar',
      prefijo: (viejo: string, nuevo: string) =>
        `Diğerleri için de aynı değişikliği kullan (${viejo} → ${nuevo})`,
      omitido: 'İçe aktarılmayacak',
    },
    asistente: {
      titulo: 'Profil içe aktar',
      pasos: {
        archivo: 'Dosya',
        revisar: 'İncele',
        confirmar: 'Onayla',
        resultado: 'Sonuç',
      },
      archivo: {
        texto:
          '.wolfperfil dosyasını seçin. Henüz hiçbir şey değişmez: önce nelerin değiştirileceğini, kaldırılacağını veya beklemede bırakılacağını görürsünüz.',
        elegir: 'Dosya seç…',
        cambiar: 'Başka seç',
        ninguno: 'Dosya seçilmedi',
        leyendo: 'Profil okunuyor…',
        error: 'Profil okunamadı',
      },
      origen: (fecha: string, sistema: string) => `${fecha} tarihinde ${sistema} üzerinde oluşturuldu.`,
      ignoradas: (n: number) => `Dosyadaki ${n} girdi profile ait değil ve yok sayılıyor.`,
      reemplaza: {
        titulo: 'Değiştirilecek öğeler',
        ninguno: 'Bu klasörde veri yok: temiz bir kurulum üzerine içe aktarılıyor.',
        copia:
          'Değiştirmeden önce respaldos/pre-perfil-… klasörüne yedeklenir ve ortamın anlık görüntüsü alınır; değiştirilen her veritabanının kendi anlık görüntüsü alınır. data klasörü asla silinmez.',
        config: 'Yapılandırma (config.json)',
        sitio: (id: string) => `${id} sitesi`,
        base: (instancia: string, base: string) => `${base} veritabanı (${instancia})`,
        plantilla: (id: string) => `${id} şablonu`,
        ca: 'Bu bilgisayarın sertifika yetkilisi (CA)',
      },
      versiones: {
        titulo: 'Sürümler',
        ninguna: 'Profilde sürüm yok.',
        instalada: 'Zaten yüklü',
        descargar: 'Doğrulanmış özetle indirilecek',
        pendienteDebil: 'Beklemede: güçlü özet yok, elle yükleyin',
        pendienteFuera: 'Beklemede: artık katalogda yok',
        huellas: {
          fuerte: 'SHA-256 veya SHA-512 özeti',
          firmada: 'İmzalı',
          debil: 'Zayıf özet',
          ninguna: 'Özet yok',
        },
        descargas: (n: number) =>
          `Resmi sitelerden, her biri doğrulanmış özet veya imzayla ${n} sürüm indirilecektir.`,
      },
      instancias: {
        titulo: 'Veritabanı örnekleri',
        existente: 'Zaten var: bağlantı noktası ve sürümüyle korunur',
        nueva: (puerto: number) => `${puerto} bağlantı noktasında yeni kimlik bilgileriyle oluşturulur`,
        reasignada: (de: number, a: number) => `${de} bağlantı noktası meşgul: ${a} kullanılacak`,
      },
      bases: {
        titulo: 'Veritabanları',
        ninguna: 'Profilde veritabanı yok.',
        texto:
          'Her veritabanına kısıtlı bir kullanıcıyla ve yalnızca izin verilen deyimlerle geri yüklenir. Zaten var olanlar öncesinde yedeklenir.',
        omitir: 'Veritabanları olmadan aktar',
      },
      plantillas: {
        titulo: 'Şablonlar',
        existe: 'Zaten var: değiştirilir',
        nueva: 'Yeni',
      },
      workspaces: {
        titulo: 'Çalışma alanları',
        texto:
          'Yalnızca veritabanı ve hizmet başvurularını taşırlar (proje işlemleri taşınmaz). Burada var olanlarla doğrulanırlar ve asla kendiliğinden başlamazlar.',
        existe: 'Aynı kimlikle sizde zaten var: sizinki korunur',
        nuevo: 'Yeni',
        elementos: (n: number) => `${n} öğe`,
        invalidos: (n: number) => `Profildeki ${n} öğe geçersiz ve içe aktarılmıyor.`,
      },
      quitado: {
        titulo: 'Yapılandırmadan alınmayan öğeler',
        texto:
          'Bu veri klasörü temiz: profilden bu bilgisayarın dışına işaret eden öğeler alınmaz.',
      },
      puertos: {
        titulo: 'Meşgul bağlantı noktaları',
        texto: (lista: string) =>
          `Profildeki bu bağlantı noktaları bu bilgisayarda başka bir program tarafından kullanılıyor: ${lista}. İçe aktarmadan sonra Hizmetler bölümünden değiştirin.`,
      },
      ca: {
        titulo: 'Sertifika yetkilisi (CA)',
        texto:
          'Profil şifreli bir CA içeriyor. Yalnızca size aitse içe aktarın: bu bilgisayar onun imzaladığı sertifikaları kabul edecektir.',
        huella: 'Profil CA SHA-256 özeti',
        comparar: 'Kabul etmeden önce kaynak bilgisayarınızdaki özetle karşılaştırın.',
        importar: 'Profil CA yetkilisini içe aktar',
        noImportar: 'İçe aktarmazsanız bu bilgisayar mevcut CA yetkilisini kullanır veya yeni bir tane oluşturur.',
        ajena:
          'Bu CA, WolfCore Dev kısıtlamalarıyla eşleşmeyen ad kısıtlamalarına sahip: içe aktarılamaz.',
        sinRestricciones:
          'Bu CA yetkilisinde ad kısıtlaması yoktur: bankalar ve e-posta dahil herhangi bir web sitesi için sertifika imzalayabilir. Yalnızca size aitse ve özet eşleşiyorsa içe aktarın.',
        aceptarSin: 'Riski anlıyorum: bu benim CA yetkilim ve özet eşleşiyor',
        reemplazaLocal:
          'Bu bilgisayarda zaten bir CA var. Profildekini içe aktarmak mevcut olanı değiştirir (önceki yedekte kopyası kalır).',
        reemplazar: 'Bu bilgisayarın CA yetkilisini değiştir',
        noSeInstala: 'CA sistemin sertifika deposuna kendiliğinden yüklenmez.',
      },
      frase: {
        titulo: 'Profil parola cümlesi',
        texto: 'Profil şifreli veritabanları veya CA içeriyor. Dışa aktarırken seçtiğiniz parola cümlesini yazın.',
        campo: 'Parola cümlesi',
        omitirBases: 'Veritabanları olmadan aktar',
        nota: 'Parola cümlesi yalnızca bu pencerede kullanılır: kaydedilmez ve bitince veya pencere kapanınca silinir.',
      },
      env: {
        titulo: 'Proje bağlantıları',
        texto:
          '.env dosyası veritabanı için yeni bir özel kullanıcıya yönlendirilecek projeleri işaretleyin (.env önce yedeklenir). Diğerlerine dokunulmaz ve bilgi verilir.',
      },
      confirmar: {
        titulo: 'İçe aktarmayı onaylayın',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `${sitios} site, ${versiones} sürüm ve ${bases} veritabanı içe aktarılacaktır.`,
        importar: 'İçe aktar',
        revisar: 'İncele',
        volver: 'Geri',
        bloqueos: {
          sitios_sin_carpeta:
            'Her sitenin klasörünü seçin veya beklemede olarak aktarılmak üzere işaretleyin.',
          frase_requerida: 'Profil parola cümlesini yazın veya veritabanları olmadan aktarın.',
          ca_ajena: 'Profil CA yetkilisi içe aktarılamaz.',
          ca_sin_restricciones: 'Kısıtlamasız bir CA içe aktarmak istediğinizi ayrıca onaylayın.',
          reemplazar_ca: 'Bu bilgisayarın CA yetkilisini değiştirmek istediğinizi ayrıca onaylayın.',
        },
      },
      progreso: 'Profil içe aktarılıyor… Pencereyi kapatmayın: veritabanları veya indirmelerle zaman alabilir.',
      fases: {
        copia: 'Değiştirilecek öğeler yedekleniyor',
        versiones: 'Sürümler yükleniyor',
        configuracion: 'Yapılandırma ve siteler kaydediliyor',
        plantillas: 'Şablonlar kopyalanıyor',
        ca: 'CA ve sertifikalar hazırlanıyor',
        bases: 'Veritabanları geri yükleniyor',
        env: '.env dosyaları yeniden yazılıyor',
      },
      avance: (paso: number, de: number) => `Adım ${paso} / ${de}`,
      resultado: {
        titulo: 'İçe aktarma sonucu',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} içe aktarıldı, ${pendientes} beklemede, ${omitidos} atlandı ve ${errores} hatalı.`,
        respaldo: (ruta: string) => `Değiştirilen öğelerin yedeği: ${ruta}`,
        pendientes: 'Beklemede kalan öğeler elle tamamlanabilir.',
        error: 'Profil içe aktarılamadı',
        secciones: {
          sitios: 'Siteler',
          versiones: 'Sürümler',
          instancias: 'Örnekler',
          bases: 'Veritabanları',
          plantillas: 'Şablonlar',
          workspaces: 'Çalışma alanları',
          env: '.env dosyaları',
          ca: 'CA',
        },
        estados: {
          importado: 'İçe aktarıldı',
          pendiente: 'Beklemede',
          omitido: 'Atlandı',
          error: 'Hata',
          instalada: 'Yüklendi',
          ya_instalada: 'Zaten vardı',
          creada: 'Oluşturuldu',
          existente: 'Zaten vardı',
          puerto_reasignado: 'Bağlantı noktası yeniden atandı',
          reescrito: 'Yeniden yazıldı',
          sin_marcar: 'Seçilmedi',
        },
        ca: {
          importada: 'CA içe aktarıldı',
          nueva: 'Yeni CA oluşturuldu',
          sin_cambios: 'CA değişmedi',
        },
        quitarCa: {
          boton: 'Önceki CA yetkilisini kaldır…',
          titulo: 'Önceki CA yetkilisini güvenden kaldır',
          texto:
            'Bu bilgisayarın daha önce sahip olduğu CA sistem sertifika deposundan kaldırılacaktır. Windows onay isteyebilir. Yeni CA kendiliğinden yüklenmez.',
          si: 'Kaldır',
          hecho: 'Önceki CA güvenden kaldırıldı.',
        },
        descartadosWorkspace: (lista: string) => `Burada yok ve çıkarıldı: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} geçersiz çalışma alanı içe aktarılmadı.`,
        puerto: (de: number, a: number) => `Bağlantı noktası ${de} → ${a}`,
        copiaEnv: (ruta: string) => `.env yedeği: ${ruta}`,
      },
    },
    /** Önizleme güçlü uyarısı: profil CA yetkilisinde ad kısıtlaması yok. */
    caSinRestricciones:
      'Bu CA herhangi bir web sitesini imzalayabilir; yalnızca size aitse içe aktarın, özeti karşılaştırın.',
    motivos: {
      procesos_quitados: 'İşlemleri (başka bir bilgisayardan komutlar) içe aktarılmadı.',
      tareas_quitadas:
        'Zamanlanmış görevleri (başka bir bilgisayardan komutlar) içe aktarılmadı. Yeniden oluşturun veya wolfcore.yml dosyasından alın.',
      tunel_con_nombre: 'Adlandırılmış tüneli taşınmaz: hızlı tünele döner.',
      php_ini: 'Bazı php.ini ayarları içe aktarılmadı.',
      xdebug: 'Xdebug ayarı geçersizdi ve kaldırıldı.',
      nginx_desactivado:
        'Nginx kuralları kaydedildi ancak uygulanmadı: düzenleyicide inceleyin.',
      carpeta_no_existe: 'Klasörü bu bilgisayarda yok: konumunu bulun.',
      correo_sin_proveedor: 'SMTP sağlayıcısı içe aktarılmadı: e-posta yakalayıcıyı kullanır.',
      sitio_invalido: 'Site geçerli değil.',
      dominio_invalido: 'Alan adı geçerli değil (.test ile bitmelidir).',
      ruta_protegida: 'Klasörü sistem veya WolfCore Dev klasörüdür: içe aktarılmaz.',
      dominio_en_uso: 'Bu bilgisayardaki başka bir site bu alan adını kullanıyor.',
      sitio_repetido: 'Site profilde yineleniyor.',
      no_disponible: 'Bu sürüm artık katalogda yok.',
      huella_debil: 'Bu sürümün güçlü bir özeti yok: Sürümler bölümünden elle yükleyin.',
      tope_descargas:
        'Aynı anda çok fazla indirme yapmamak için indirilmedi: Sürümler bölümünden yükleyin.',
      instancia_pendiente: 'Örneği beklemede kaldı.',
      motor_no_soportado: 'Bu motor bir profilden içe aktarılmaz.',
      version_pendiente: 'Motor sürümü beklemede kaldı.',
      danada: 'Profildeki dosyaları bozuk.',
      bases_omitidas: 'Veritabanları olmadan içe aktarıldı.',
      instancia_apagada: 'Örneği başlatılamadı.',
      sin_copia_previa: 'Önceki anlık görüntü alınamadı: veritabanı değiştirilmedi.',
      sin_base: '.env dosyası yerel bir veritabanına işaret etmiyor.',
      base_no_resuelta: 'Veritabanının hangi örneğe ait olduğu belirlenemedi.',
      error_inesperado: 'Bir hata oluştu.',
    },
    avisos: {
      ca_reemplazada:
        'Bu bilgisayarın önceki CA yetkilisi hâlâ sistem güven deposunda duruyor ve artık kullanılmıyor. Buradan kaldırabilirsiniz.',
      base_no_incluida: '{base} veritabanı ({instancia}) dahil edilmedi.',
      sin_ca: 'Bu bilgisayarda CA yok: profil onsuz dışa aktarılıyor.',
      ca_no_importada: 'Profil CA yetkilisi içe aktarılmadı: bu bilgisayarın CA yetkilisi veya yeni bir tane kullanılıyor.',
      certificados: 'Sertifikalar hazırlanamadı: {detalle}',
      aplicar:
        'İçe aktarılan siteler tam olarak uygulanamadı (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Yapay zeka sağlayıcısı {id}: özel bir URL kullanıyor.',
      smtp: 'SMTP sağlayıcısı {id}: sunucusu bilinen bir sağlayıcıya ait değil veya kullanıcısı eksik.',
      puerto: '{id} bağlantı noktası: aralık dışında, varsayılana dönüyor.',
      carpeta_vigilada: 'İzlenen klasör başka bir bilgisayara ait.',
    },
  },
};
