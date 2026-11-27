import type { TextosParciales } from '../es';

const plural = (n: number, tekil: string, cogul: string): string =>
  `${n} ${n === 1 ? tekil : cogul}`;

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const trExtra: TextosParciales = {
  app: { lema: 'Yerel geliştirme ortamınız, çalışmaya hazır' },
  resumenGlobal: {
    cortoApagado: 'Hepsi kapalı',
    cortoEncendidos: (n) => `${n} çalışıyor`,
    cortoErrores: (n) => plural(n, 'hatalı', 'hatalı'),
    cortoCargando: 'Bağlanıyor…',
    cortoSinConexion: 'Çevrimdışı',
    irAServicios: 'Hizmetleri aç',
  },
  acciones: { copiarCompleto: 'Metnin tamamını kopyala' },
  errores: {
    codigos: {
      'servicios.no_encendio':
        '{nombre} başlatılamadı. Hizmetler bölümünü ve günlüklerini kontrol edin.',
      'tuneles.sitio_no_confiable':
        '{dominio} henüz güvenilir değil: yayınlamadan önce projede «Bu depoya güveniyorum» seçeneğini işaretleyin.',
      'clientehttp.peticion_invalida': 'İstekte geçersiz veri: {campo}.',
      'clientehttp.variable_sin_definir': '“{nombre}” değişkeni etkin ortamda tanımlı değil.',
      'clientehttp.secreto_faltante':
        'Saklanan bir gizli değer eksik: yeniden yazın ve isteği veya ortamı kaydedin.',
      'clientehttp.secreto_no_guardado':
        "Bir gizli değer saklanamadı: satır sonu içeremez, 16 KB'ı aşamaz ve sistem şifrelemesi kullanılabilir olmalıdır.",
      'clientehttp.url_invalida': 'URL geçerli değil.',
      'clientehttp.url_con_credenciales':
        'URL kullanıcı adı veya parola içeremez: kimlik doğrulama sekmesini kullanın.',
      'clientehttp.protocolo': "Yalnızca http:// ve https:// URL'leri kabul edilir.",
      'clientehttp.cabecera_invalida': '“{nombre}” başlığı geçerli değil.',
      'clientehttp.cuerpo_grande': "İstek gövdesi 1 MB'tan büyük.",
      'clientehttp.plazo': 'İstek {segundos} sn zaman aşımını aştı.',
      'clientehttp.cancelado': 'İstek iptal edildi.',
      'clientehttp.sin_conexion':
        'Bağlanılamadı ({motivo}). Adresi, bağlantı noktasını ve sunucunun çalıştığını kontrol edin.',
      'clientehttp.certificado': 'Sunucu sertifikası doğrulanamadı ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Art arda {max} yönlendirmeden fazlası.',
      'clientehttp.curl_invalido': 'Metin geçerli bir curl komutu değil.',
      'clientehttp.curl_grande': 'curl metni çok büyük (en fazla 64 KB).',
      'clientehttp.no_existe': 'Öğe artık mevcut değil.',
      'clientehttp.limite': 'Saklanabilecek öğe sınırına ulaşıldı.',
      'ejemplohttp.no_arranca': 'Örnek sunucu başlatılamadı.',
      'laboratoriogit.sin_git': 'Bu bilgisayarda Git yüklü değil.',
      'laboratoriogit.orden_invalida': 'Bu komut laboratuvar listesinde yok.',
      'laboratoriogit.nombre_invalido':
        'Ad yalnızca harf, rakam, tire ve alt çizgi içerebilir (en fazla 30 karakter).',
      'laboratoriogit.mensaje_invalido':
        'İleti tek satır olmalı, en fazla 200 karakter içermeli ve “-” ile başlamamalıdır.',
      'laboratoriogit.archivo_invalido': 'Bu dosya alıştırma dosyalarından biri değil.',
      'laboratoriogit.contenido_invalido': 'İçerik en fazla 2000 karakterlik bir metin olmalıdır.',
      'laboratoriogit.ruta_insegura':
        'Laboratuvar klasörü beklenen klasör değil, bu yüzden dokunulmadı.',
      'laboratoriogit.fallo_sistema':
        'Sistem, laboratuvar klasörünün hazırlanmasına veya kullanılmasına izin vermedi. «Laboratuvarı sıfırla» seçeneğini deneyin.',
      'buscar.ruta_vetada': 'Bu klasör WolfCore Dev verilerini içeriyor: aranmaz.',
      'buscar.resultado_caducado': 'Bu sonuç artık kullanılamıyor: yeniden arayın.',
      'buscar.resultado_invalido': 'Bu sonuç açılamıyor.',
      'diff.raiz_invalida': 'Var olan ve bağlantı olmayan iki klasör seçin.',
      'diff.ruta_vetada': 'Bu klasör WolfCore Dev verilerini içeriyor: karşılaştırılmaz.',
      'diff.cancelado': 'Karşılaştırma iptal edildi.',
      'diff.plazo': "Karşılaştırma {segundos} sn'den uzun sürdü ve iptal edildi.",
      'diff.memoria':
        'Karşılaştırma çok fazla bellek gerektiriyor ({maximo} üzeri) ve iptal edildi.',
      'diff.ocupado': 'Bir karşılaştırma zaten çalışıyor: iptal edin veya bekleyin.',
      'diff.caducado': 'Bu karşılaştırma artık kullanılamıyor: yeniden karşılaştırın.',
      'diff.archivo_invalido': 'Bu dosya artık karşılaştırılamıyor: değişti veya kayboldu.',
      'diff.fallo': 'Karşılaştırma başarısız oldu.',
      'compartir.confirmacion_requerida':
        'İnternette paylaşım WolfCore Dev penceresinde onaylanmalıdır.',
      'compartir.ocupado': 'Zaten bir şey paylaşılıyor: önce paylaşımı durdurun.',
      'compartir.ruta_invalida': 'Var olan bir klasör veya dosya seçin.',
      'compartir.duracion_invalida': '15 dakika, 1 saat veya 4 saat seçin.',
      'compartir.proveedor_invalido': 'Bu tünel desteklenmiyor: Cloudflare veya ngrok kullanın.',
      'compartir.raiz_unidad': 'Sürücünün kök dizini paylaşılmaz. İçindeki bir klasörü seçin.',
      'compartir.carpeta_usuario':
        'Kişisel klasörün tamamı (veya onu içeren bir klasör) paylaşılmaz. Bir alt klasör seçin.',
      'compartir.carpeta_datos': 'WolfCore Dev veri klasörü paylaşılmaz.',
      'compartir.sitio_datos_reales':
        'Gerçek veri içeren bir site (veya içindeki herhangi bir şey) paylaşılmaz.',
      'compartir.carpeta_secretos':
        'Bu klasör anahtarlar içeriyor (.ssh, .aws, .git…) ve paylaşılmaz.',
      'compartir.carpeta_sistema': 'Sistem klasörleri paylaşılmaz.',
      'compartir.archivo_sensible':
        'Bu dosya bir gizli bilgi veya gerçek veri içeriyor gibi görünüyor ve paylaşılmaz.',
      'compartir.carpeta_perfil':
        'Kullanıcının programlarının verileri (AppData, .claude, .config…) paylaşılmaz.',
      'compartir.archivo_grande':
        'Bu dosya denetlenemeyecek kadar büyük ve bir medya dosyası veya paket değil: paylaşılmaz.',
      'compartir.tunel_sin_url': 'Tünel adresini {segundos} sn içinde vermedi. Yeniden deneyin.',
      'compartir.tunel_cerrado': 'Tünel açılmayı bitirmeden kapandı.',
      'compartir.fallo': 'Paylaşılamadı.',
      'disco.raiz_invalida': 'Var olan ve okunabilen bir klasör veya sürücü seçin.',
      'disco.cancelado': 'Çözümleme iptal edildi.',
      'info.ruta_invalida': 'Yol geçerli değil: mutlak ve yerel olmalıdır.',
      'info.no_existe': 'Dosya veya klasör yok.',
      'info.enlace': 'Bu bir bağlantıdır: lütfen bunun yerine hedef dosyayı veya klasörü seçin.',
      'info.hash_grande': 'Dosya {maximo} MB’ı aşıyor: karmalar hesaplanmaz.',
      'disco.plazo': "Çözümleme {minutos} dk'dan uzun sürdü ve iptal edildi.",
      'disco.memoria': 'Çözümleme çok fazla bellek gerektiriyor ({maximo} üzeri).',
      'disco.ocupado': 'Bir çözümleme zaten çalışıyor: iptal edin veya bekleyin.',
      'disco.caducado': 'Bu çözümleme artık kullanılamıyor: yeniden çözümleyin.',
      'disco.entrada_invalida': 'Bu klasör artık yok veya değişti: yeniden çözümleyin.',
      'disco.fallo': 'Çözümleme başarısız oldu.',
      'reverb.no_laravel': 'Reverb yalnızca Laravel projelerinde kullanılabilir.',
      'reverb.no_confiado':
        "Reverb'i açmak için projede “Bu depoya güveniyorum” seçeneğini işaretleyin.",
      'reverb.sin_paquete':
        'laravel/reverb paketi eksik: composer require laravel/reverb ile yükleyin.',
      'reverb.sin_confirmar': "Reverb'i açmak istediğinizi onaylayın.",
      'reverb.sin_activar': "Önce projede Reverb'i açın.",
      'env.meilisearch_no_disponible': 'Meilisearch yüklü değil: Hizmetler bölümünden yükleyin.',
      'bd.lentas_confirmar':
        'Yavaş sorgu günlüğünü değiştirmek tüm sunucuyu etkiler: onaylanması gerekir. Hiçbir şey değiştirilmedi.',
      'bd.lentas_umbral_invalido': 'Süre 0,1 ile 60 saniye arasında olmalıdır.',
      'bd.lentas_motor_no_soportado':
        'Yavaş sorgular yalnızca WolfCore Dev tarafından yönetilen MySQL, MariaDB ve PostgreSQL üzerinde değiştirilebilir.',
      'bd.lentas_literal_no_permitido':
        'SQL değerleriyle birlikte gösterilmez: veritabanı gerçek veri içeriyor veya sorgu bilinen bir veritabanına atfedilemiyor.',
      'bd.lentas_entrada_no_existe': 'Bu sorgu artık günlükte yok. Yeniden okuyun.',
      'bd.lentas_fallo':
        'Yavaş sorgu günlüğü okunamadı veya değiştirilemedi. Sunucunun çalıştığını kontrol edin.',
      'bd.esquema_base_no_existe': 'Veritabanı o sunucuda mevcut değil.',
      'bd.esquema_motor_no_soportado': 'Şema görüntüleyici MySQL, MariaDB ve PostgreSQL içindir.',
      'bd.esquema_lectura_fallo':
        'Veritabanı şeması okunamadı. Sunucunun çalıştığını kontrol edin.',
      'captura.atajo_invalido':
        'Bu kısayol geçerli değil: Ctrl, Alt, Shift veya Super ile bir harf, rakam veya F tuşu kullanın.',
      'captura.atajo_no_permitido':
        "Bu kısayola izin verilmiyor: Ctrl veya Super ile başka bir değiştirici tuş kullanın (Shift olmadan Ctrl+Alt aslında AltGr'dir ve @ yazmayı bozar) ve Ctrl+C veya Alt+F4 gibi yaygın kısayollardan kaçının.",
      'captura.atajo_ocupado': '{atajo} kısayolu başka bir program tarafından zaten kullanılıyor.',
      'captura.no_disponible': 'Ekran yakalama bu bilgisayarda kullanılamıyor.',
      'captura.permiso_denegado': 'Ekran kaydı izni eksik.',
      'captura.sin_imagen': 'Yakalanacak bir görüntü yok.',
      'captura.imagen_invalida': 'Yakalanan görüntü geçerli değil.',
      'disco.sin_confirmar': 'Devam etmeden önce temizliği iletişim kutusunda onaylayın.',
      'disco.categoria_invalida': 'Bu temizlik kategorisi mevcut değil.',
      'disco.ruta_vetada':
        'Kategori korumalı bir yola dokunuyor (veriler, yedekler, projeler veya FlyEnv); hiçbir şey temizlenmedi.',
      'disco.sin_analisis':
        'Temizlemeden önce yeniden çözümleyin: çözümlemenin süresi dolmuş veya yok.',
      'disco.ocupada': 'Bir çözümleme veya temizlik zaten çalışıyor.',
      'disco.sin_registro': 'Temizlik günlüğü oluşturulamadı; hiçbir şey silinmedi.',
      'editor.sin_confirmar': 'Devam etmeden önce kaydetmeyi onaylayın.',
      'editor.confirmacion_reforzada':
        'Bu dosya gizli bilgiler içeriyor veya gerçek veri içeren bir siteye ait gibi görünüyor: kaydetmek için ek denetimle onaylayın.',
      'editor.ruta_invalida': 'Dosya yolu geçerli değil.',
      'editor.no_existe': 'Dosya mevcut değil.',
      'editor.no_regular': 'Yalnızca normal dosyalar düzenlenebilir.',
      'editor.ruta_vetada':
        'Bu dosya WolfCore Dev veri klasörünün içinde: düzenleyiciden açılamaz veya kaydedilemez.',
      'editor.archivo_env':
        '.env dosyaları düzenleyiciden değil, projenin değişkenlerinden yönetilir.',
      'editor.demasiado_grande': 'Dosya düzenleyici için çok büyük (en fazla {maximo}).',
      'editor.binario': 'Dosya metin değil (ikili): burada düzenlenemez.',
      'editor.codificacion': 'Dosya UTF-8 değil: düzenleyici zarar vermemek için onu açmaz.',
      'editor.no_abierto':
        'Bu dosya düzenleyicide açılmamıştı (veya sürümü değişti): yeniden açın.',
      'editor.eol_mixto':
        'Dosyada karışık satır sonları var: kaydetmek için bunların normalleştirilmesini onaylayın.',
      'editor.contenido_invalido': 'İçerik geçerli bir metin değil.',
      'editor.huella_invalida': 'Açık dosyanın parmak izi eksik: yeniden açın.',
      'editor.archivo_cambiado':
        'Dosya açıldığından beri düzenleyicinin dışında değişti. Yeniden yükleyin veya üzerine yazmayı onaylayın.',
      'editor.copia_fallo': 'Yedek kopya oluşturulamadı ({codigo}); hiçbir şey kaydedilmedi.',
      'editor.lectura_fallo': 'Dosya okunamadı ({codigo}).',
      'editor.escritura_fallo': 'Dosya kaydedilemedi ({codigo}). Asıl dosyaya dokunulmadı.',
      'memoria.sin_confirmar': 'Devam etmeden önce işlemi iletişim kutusunda onaylayın.',
      'memoria.modo_invalido': 'Bu en iyileştirme modu mevcut değil.',
      'memoria.plan_caducado':
        'Listenin süresi doldu veya artık güncel değil. Uygulamadan önce yeniden gösterin.',
      'memoria.no_disponible': 'Bellek iyileştirici burada kullanılamıyor veya sistemi okuyamadı.',
      'conversor.ocupado':
        'Bir dönüştürme zaten çalışıyor ve bir diğeri bekliyor: bitmesini bekleyin.',
      'doctor.firewall_reglas_acotadas':
        'WolfCore Dev programları için yerel ağla sınırlı {cantidad} kural var (yalnızca özel profil, yerel alt ağ ve belirli bağlantı noktaları); uygulamanın bir siteyi paylaşmak için kendisinin önerdiği kurallarla aynı. Yalnızca gösterilirler: buradan kaldırılmazlar.',
      'doctor.firewall_almacen_inseguro':
        'Kuralların korumalı kopyasına güvenilemez (izinler veya içerik gösterilenden farklı): hiçbir kural oluşturulmadı veya değiştirilmedi.',
      'doctor.firewall_quitadas':
        'WolfCore Dev daha önce {cantidad} güvenlik duvarı kuralını kaldırdı ve bir kopyasını sakladı: gerekirse yeniden oluşturabilirsiniz.',
      'doctor.firewall_parcial':
        "Bazı kurallar kaldırıldı, bazıları kaldırılmadı: liste gösterildikten sonra değişmiş, WolfCore Dev'e ait olmamış veya Windows kaldırılmalarına izin vermemiş olabilir. Listeyi kontrol edin.",
      'doctor.firewall_sin_cambios':
        'Hiçbir kural değiştirilmedi: artık gösterilenle eşleşmiyorlar veya değiştirilemediler.',
      'doctor.firewall_registro_fallido':
        'Kuralların kopyası HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos korumalı kayıt defteri anahtarına kaydedilemedi: hiçbir şey değiştirilmedi.',
      'catalogo.paquete_invalido':
        'İndirilen paket güvenli değil (klasör dışındaki yollar, bağlantılar veya aşırı boyut).',
      'catalogo.extraccion_fallo': 'İndirilen .7z paketi okunamadı veya çıkarılamadı.',
      'runtimes.falta_runtime':
        'Bu proje için {nombre} yüklü değil: Hizmetler bölümünden yükleyin.',
      'runtimes.falta_jdk':
        "Bu proje için hiçbir JDK yüklü değil: Java'yı Hizmetler bölümünden yükleyin.",
      'runtimes.instalacion_incompleta':
        '{nombre} kurulumu eksik: Hizmetler bölümünden yeniden yükleyin.',
      'procesos.escucha_publica':
        'İşlem {direccion}:{puerto} ({programa}) adresinde dinliyor ve ağa açık. Durduruldu: yalnızca 127.0.0.1 üzerinde dinleyebilir.',
      'procesos.escucha_publica_livereload':
        'İşlem {direccion}:{puerto} ({programa}) adresinde dinliyor ve ağa açık. Durduruldu: yalnızca 127.0.0.1 üzerinde dinleyebilir. Bu, Spring DevTools LiveReload: spring.devtools.livereload.enabled=false ile kapatın.',
      'procesos.escucha_publica_inspector':
        'İşlem {direccion}:{puerto} ({programa}) adresinde dinliyor ve ağa açık. Durduruldu: yalnızca 127.0.0.1 üzerinde dinleyebilir. Bu, Node denetçisi: --inspect=127.0.0.1 kullanın.',
    },
  },
  inicio: {
    servicios: { irA: (nombre) => `${nombre} hizmetine git` },
    tuneles: { irA: (nombre) => `${nombre} projesine git` },
  },
  servicios: {
    sinParaEncender: 'Başlatılacak yüklü hizmet yok',
    franjaExternos: {
      texto:
        "Henüz web sunucusunu veya PHP'yi yüklemediniz. Harici motorlar otomatik olarak algılandı.",
      accion: "Nginx ve PHP'yi yükle",
    },
    externos: {
      titulo: 'Bilgisayarınızda algılananlar',
      ayuda: 'Bunları başka bir program yönetir; WolfCore Dev yalnızca gösterir.',
    },
    borrarDatos: { que: { meilisearch: 'tüm Meilisearch dizinleri' } },
    ftp: {
      redLocalAyuda:
        'Kapalıyken yalnızca bu bilgisayar bağlanabilir (127.0.0.1). Her proje erişimini Projeler bölümünde etkinleştirir.',
      compartir: {
        enlace: 'Klasör veya dosya paylaş…',
        ayuda:
          'FTP bir tünel üzerinden paylaşılmaz: şifrelenmemiştir ve tünel yalnızca HTTP taşır. İnternette bir şey yayınlamak için “Klasör veya dosya paylaş” seçeneğini (HTTP, salt okunur) kullanın; FTP yerel ağda kalır.',
      },
    },
    datosConexion: 'Bağlantı bilgileri',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Meilisearch bağlantısı',
      notaMeilisearch:
        'Bir projede kullanmak için: Değişkenler (.env) → Blok ekle → Meilisearch. Anahtarı gizlenmiş bir önizleme gösterilir ve onay gerekir. Anahtar yalnızca bu bilgisayara aittir.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Laravel Scout için arama (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (yerel bağlantı noktası)',
      springboot: 'Spring Boot (yerel bağlantı noktası)',
      aspnet: 'ASP.NET Core (yerel bağlantı noktası)',
    },
    tiposCortos: { rails: 'Rails', springboot: 'Spring Boot', aspnet: 'ASP.NET' },
  },
  tunel: {
    sinConfianza:
      'Bu projeye güvenilmiyor: yayınlayabilmek için «Bu depoya güveniyorum» seçeneğini işaretleyin.',
  },
  tuneles: {
    irAProyectos: 'Projelere git',
    compartir: {
      enlace: 'Klasör veya dosya paylaş…',
      ayuda: 'Bir site gerektirmeden bir klasörü veya tek bir dosyayı (salt okunur) yayınlar.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      "Bu projenin Reverb işleminde WolfCore Dev'in komutu yok (başka bir ana makine, program veya bağlantı noktası). Açmak onu yalnızca 127.0.0.1 üzerinde dinleyen standart işlemle değiştirir.",
    ayuda: 'Laravel WebSockets, yalnızca 127.0.0.1 üzerinde.',
    puerto: (p) => 'Bağlantı noktası {p}'.replace('{p}', String(p)),
    interruptor: (dominio) => "{d} için Reverb'i aç veya kapat".replace('{d}', dominio),
    activarTitulo: 'Reverb açılsın mı?',
    activarTexto: (dominio) =>
      "{d} içinde “php artisan reverb:start” çalışacak ve boş bir bağlantı noktasında yalnızca 127.0.0.1 üzerinde dinleyecek. Projenin kodu kendi PHP'si ile çalışır.".replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Reverb kapatılsın mı?',
    desactivarTexto:
      'İşlem durdurulur ve projeden kaldırılır. .env içindeki REVERB_* değişkenlerine dokunulmaz.',
    activar: 'Aç',
    desactivar: 'Kapat',
    proponer: 'REVERB_* değişkenlerini öner',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Durduruldu',
      iniciando: 'Başlıyor',
      encendido: 'Çalışıyor',
      error: 'Başarısız',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP yalnızca yerel ağ içindir: parolayı ve dosyaları şifresiz gönderdiği için bir internet tüneli üzerinden paylaşılmaz.',
    compartirIr: 'Bir klasörü veya dosyayı geçici bir bağlantıyla paylaş',
  },
  ia: {
    pestanas: {
      etiqueta: 'Yapay zekâ bölümleri',
      agentes: 'Ajanlar',
      nube: 'Bulut',
      local: 'Yerel modeller',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram: 'Bilgisayarınız için: ≈{b}B’ye kadar modeller, ekran kartı belleğine sığar.',
      sugerenciaRam: 'Bilgisayarınız için: ≈{b}B’ye kadar modeller, RAM’de çalışır.',
      sugerenciaPequena: 'Bilgisayarınız için: yalnızca çok küçük modeller (1B’den az).',
      sugerenciaDesconocida: 'Bilgisayarınızın donanımı okunamadı, bu yüzden öneri yok.',
      aviso: 'Bu yalnızca bir yönlendirmedir: istediğiniz modeli indirebilirsiniz.',
      comprobando: 'Bilgisayarınız denetleniyor…',
      niveles: {
        recomendado: 'Önerilir',
        lento: 'Yavaş olabilir',
        'no-cabe': 'Sığmaz',
        desconocido: 'Veri yok',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Ekran kartı belleğine rahatça sığar (≈{necesario} gerekir, {disponible} var).',
        'justo-vram': 'Ekran kartına sığar ama zar zor (≈{necesario} gerekir, {disponible} var).',
        'solo-ram':
          'Ekran kartına sığmaz ve RAM’de çalışır (≈{necesario} gerekir, {disponible} kullanılabilir): daha yavaş.',
        'cabe-ram': 'RAM’e rahatça sığar (≈{necesario} gerekir, {disponible} kullanılabilir).',
        'ram-justo':
          'RAM’e sığar ama zar zor (≈{necesario} gerekir, {disponible} kullanılabilir): yavaş olabilir.',
        'sin-memoria': '≈{necesario} bellek gerekir, bilgisayarınızda ≈{disponible} var.',
        'sin-disco': 'İndirmek için diskte yeterli boş alan yok ({disponible} kaldı).',
        'tamano-desconocido': 'Modelin boyutu sorgulanamadı (Ollama kayıt defterine bağlantı yok).',
        'equipo-desconocido': 'Bilgisayarınızın belleği okunamadı.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'İndirmeyi istediğiniz zaman iptal edebilirsiniz; o ana kadar indirilenler atılır.',
      tamano: (t) => `İndirme boyutu: ${t}.`,
      tamanoDesconocido:
        "Boyut denetlenemedi (Ollama kayıt defterine bağlantı yok). Modeller genellikle 1 ile 40 GB'ın üzerinde yer kaplar.",
      libre: (l) => `Modeller diskindeki boş alan: ${l}.`,
      libreDesconocido: 'Boş disk alanı ölçülemedi.',
      sinEspacio: (t, l) =>
        `Yeterli alan yok: model ${t} kaplıyor ve yalnızca ${l} boş. Biraz yer açın veya daha küçük bir model seçin.`,
    },
  },
  proyectos: {
    asistente: { ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    tarjeta: { verEnBases: 'Veritabanlarında görüntüle' },
  },
  panel: {
    insignias: { memoriaAlta: 'Yüksek bellek' },
    discos: {
      titulo: 'Disk alanı',
      leyendo: 'Diskler okunuyor…',
      sistema: 'Sistem',
      datos: 'WolfCore verileri',
      ambos: 'Sistem ve WolfCore verileri',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} boş (%${pct})`,
      poco: 'Boş alan az',
      casiLleno: 'Alan neredeyse bitti',
      liberar: 'Yer aç',
      versiones: 'Kullanılmayan sürümleri temizle',
      temporales: 'WolfCore geçici dosyalarını ve önbelleklerini temizle',
      ocupaMas: 'En çok yeri neyin kapladığını gör',
    },
    alertas: {
      grupo: (n) => `Bulunan sorunlar (${n})`,
      verTodos: (n) => `${n} öğenin tümünü göster`,
      verMenos: 'Daha az göster',
      masAcciones: 'Diğer işlemler',
    },
    procesos: { resto: 'Diğer hizmetler' },
  },
  captura: {
    barra: 'Çizim araçları',
    herramientas: {
      recuadro: 'Kutu',
      flecha: 'Ok',
      linea: 'Çizgi',
      resaltador: 'Vurgulayıcı',
      texto: 'Metin',
      pixelar: 'Pikselleştir',
      pixelarAyuda: "Pikselleştir (hassas veriler için güvenli değil: Gizle'yi kullanın)",
      ocultar: 'Gizle',
      ocultarAyuda: 'Düz dolguyla gizle (hassas veriler için önerilir)',
    },
    deshacer: 'Geri al',
    rehacer: 'Yinele',
    copiar: 'Kopyala',
    copiarAyuda:
      'Panoya kopyala. Windows panosu bunu geçmişinde tutabilir veya diğer cihazlarla eşitleyebilir.',
    guardar: 'Kaydet…',
    alConversor: 'Görüntü dönüştürücüye gönder',
    cerrar: 'İptal (Esc)',
    nuevaSeleccion: 'Yeni seçim',
    color: 'Renk',
    grosor: 'Kalınlık',
    formato: 'Biçim',
    cargando: 'Yakalama hazırlanıyor…',
    guiaRegion: 'Alanı seçmek için sürükleyin. Esc iptal eder.',
    guiaVentana: 'Yakalamak istediğiniz pencereyi seçin. Esc iptal eder.',
    sinVentanas: 'Yakalanabilecek pencere yok.',
    textoPlaceholder: "Yazın ve Enter'a basın",
    copiada: 'Panoya kopyalandı',
    guardada: (archivo) => `${archivo} konumuna kaydedildi`,
    errorCargar: 'Yakalama açılamadı.',
    errorCopiar: 'Görüntü kopyalanamadı.',
    errorGuardar: 'Görüntü kaydedilemedi.',
    errorConversor: 'Görüntü dönüştürücüye gönderilemedi.',
    errorVentana: 'Bu pencere yakalanamadı.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Her şey bu bilgisayarda gerçekleşir: yakalama hiçbir hizmete yüklenmez ve siz kaydedene kadar diske kaydedilmez. WolfCore Dev pencereleri görüntüde görünmesin diye bir an gizlenir.',
      region: 'Bölge',
      regionAyuda: 'Alanı seçmek için ekranda sürükleyin.',
      ventana: 'Pencere',
      ventanaAyuda: 'Açık pencerelerden birini seçin.',
      pantalla: 'Tam ekran',
      pantallaAyuda: 'İmlecin bulunduğu ekran.',
      atajoActivo: (atajo) => `Genel kısayol etkin: ${atajo} (bölge).`,
      atajoInactivo: "Genel kısayol yok. Ayarlar'dan açın.",
      noDisponible: 'Ekran yakalama bu bilgisayarda kullanılamıyor.',
      permisoDenegado: 'Ekran kaydı izni eksik. Sistem ayarlarından WolfCore Dev için açın.',
      ocupada: 'Bir yakalama zaten sürüyor.',
    },
    ajustes: {
      titulo: 'Ekran yakalama',
      descripcion:
        'Bölge, pencere veya tam ekran; hızlı bir düzenleyiciyle. %100 yereldir: siz karar verene kadar hiçbir şey yüklenmez veya kaydedilmez.',
      activar: 'Genel kısayol',
      activarAyuda:
        'Varsayılan olarak kapalı. Açıldığında yalnızca başka bir program kullanmıyorsa kaydedilir ve WolfCore Dev kapanınca serbest bırakılır.',
      atajo: 'Tuş birleşimi',
      grabar: 'Değiştir',
      grabando: 'Tuş birleşimine basın…',
      grabandoAyuda:
        'Ctrl veya Super ile başka bir değiştirici tuş (örneğin Ctrl+Alt+Shift) ve bir harf, rakam veya F tuşu kullanın. Ctrl+C gibi yaygın kısayollardan kaçının.',
      formato: 'Kaydederken biçim',
      activado: (atajo) => `${atajo} kısayolu açıldı.`,
      desactivado: 'Kısayol kapatıldı.',
      ocupado: (atajo) =>
        `${atajo} kısayolu başka bir program tarafından zaten kullanılıyor ve hiçbir şey değiştirilmedi. Başka bir tuş birleşimi deneyin.`,
      ocupadoInicio:
        'Kayıtlı kısayol başka bir program tarafından zaten kullanılıyor ve kaydedilmedi. Başka bir tuş birleşimi seçin.',
      sinPermiso: "macOS'ta ekran kaydı izni gereklidir; ilk yakalamanızda sorulacaksınız.",
      formatoGuardado: 'Biçim kaydedildi.',
    },
  },
  herramientas: {
    entorno: {
      equipo: {
        titulo: 'Bilgisayarım',
        copiarResumen: 'Özeti kopyala',
        resumenCopiado: 'Özet kopyalandı',
        privacidad: 'Özet seri numarası veya benzersiz tanımlayıcı içermez.',
        desconocido: 'bilinmiyor',
        sinGpu: 'Algılanmadı',
        so: 'İşletim sistemi',
        cpu: 'İşlemci',
        ram: 'Bellek (RAM)',
        gpu: 'Ekran kartı',
        placa: 'Anakart',
        disco: 'Sürücü {u}',
        compilacion: 'derleme {n}',
        nucleosHilos: '{n} çekirdek, {h} iş parçacığı',
        ramDetalle: 'toplam {total}, boş {libre}',
        vram: '{v} VRAM',
        discoDetalle: '{total} içinde {libre} boş',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Bilgisayar özeti · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Bilgisayar özeti · WolfCore Dev',
      },
    },
    chmod: {
      permisos: 'İzinler',
      propietario: 'Sahip',
      grupo: 'Grup',
      otros: 'Diğerleri',
      leer: 'Okuma (r)',
      escribir: 'Yazma (w)',
      ejecutar: 'Çalıştırma (x)',
      especiales: 'Özel bitler',
      setuid: 'setuid: sahibin izinleriyle çalışır',
      setgid: 'setgid: grubun izinleriyle çalışır',
      sticky: 'sticky: klasörde yalnızca sahibi silebilir',
      habituales: 'Sık kullanılan değerler',
      octal: 'Sekizlik (octal)',
      simbolico: 'Sembolik',
      octalInvalido: '0 ile 7 arasında 3 veya 4 rakam girin (örneğin 755).',
      simbolicoInvalido: 'rwxr-xr-x gibi 9 karakter girin.',
      ejemplo: 'Örnek',
      archivo: 'Dosya adı',
      nota: 'Windows’ta geçerli değildir; Linux ve macOS sunucuları içindir.',
      avisoOtros:
        'Sunucudaki herhangi bir kullanıcı bunu değiştirebilir: «diğerleri» için yazma izni vermekten kaçının.',
    },
    lista: {
      chmod: {
        nombre: 'chmod izinleri',
        descripcion:
          'Onay kutuları, sekizlik ve sembolik gösterim; Linux ve macOS sunucuları için.',
      },
      clienteHttp: {
        nombre: 'HTTP istemcisi',
        descripcion: "API'leri deneyin: istekler, ortamlar, koleksiyonlar ve geçmiş.",
      },
      captura: {
        nombre: 'Ekran yakalama',
        descripcion: 'Bölge, pencere veya tam ekran; hızlı bir düzenleyiciyle.',
      },
      guiaTuneles: {
        nombre: 'Tünel kılavuzu',
        descripcion: 'Cloudflare ve ngrok adım adım, kopyalanabilir komutlarla.',
      },
      guiaHttp: {
        nombre: 'HTTP kılavuzu',
        descripcion: 'Durum kodları ve yöntemler; arama ve örneklerle.',
      },
      guiaGit: {
        nombre: 'Git ve GitHub kılavuzu',
        descripcion:
          'Komutlar ve iş akışları; güvenle alıştırma yapabileceğiniz bir laboratuvarla.',
      },
      limpiezaDisco: {
        nombre: 'Disk temizliği',
        descripcion:
          'Geçici dosyaları ve yeniden üretilebilir önbellekleri çözümleyin ve silin; önizleme ve onayla.',
      },
      editor: {
        nombre: 'Kod düzenleyici',
        descripcion:
          'Metin dosyalarını söz dizimi vurgulama, yedek kopya ve onaylı kaydetmeyle düzenleyin.',
      },
      compartir: {
        nombre: 'Klasör veya dosya paylaş',
        descripcion:
          'Bir klasörü veya dosyayı geçici, salt okunur bir bağlantıyla internette yayınlayın.',
      },
      usoDisco: {
        nombre: 'Disk kullanımı',
        descripcion:
          'Bir sürücüde veya klasörde yeri neyin kapladığı: ağaç, en büyük dosyalar ve klasörler, uzantıya göre.',
      },
      diffCarpetas: {
        nombre: 'Klasör karşılaştırma',
        descripcion:
          'İki klasörü karşılaştırır: yalnızca birinde olanlar, yalnızca diğerinde olanlar ve farklı olanlar; her dosyanın farkıyla.',
      },
      grabarPantalla: {
        nombre: 'Ekranı kaydet',
        descripcion: 'Sisteminizde zaten bulunan kaydediciyi açar.',
      },
    },
    secciones: {
      codigo: 'Kod',
      red: 'Ağ',
      seguridad: 'Güvenlik',
      archivos: 'Dosyalar ve medya',
      sistema: 'Sistem',
    },
    tarjetas: {
      comparar: { nombre: 'Karşılaştır', descripcion: 'Metinler ve klasörler: farklar yan yana.' },
      qr: {
        nombre: 'QR',
        descripcion:
          'Bir metinden veya bağlantıdan ya da başkalarının Wi-Fi ağınıza katılabilmesi için.',
      },
      guias: {
        nombre: 'Kılavuzlar',
        descripcion: 'HTTP, tüneller ve Git; örnekler ve kopyalanabilir komutlarla.',
      },
    },
    pestanas: {
      diff: 'Metinler',
      diffCarpetas: 'Klasörler',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tüneller',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        "WolfCore Dev'in kendi kaydedicisi yoktur: sisteminizde zaten bulunanı açar. Video, o aracın kaydettiği yere kaydedilir.",
      abrir: 'Kaydediciyi aç',
      abierta: "Ekran Alıntısı Aracı açıldı. Ekran alanını seçin ve Başlat'a basın.",
      noSePudo:
        'Ekran Alıntısı Aracı buradan açılamadı. Kılavuzdaki kısayollardan birini kullanın.',
      guiaTitulo: 'Sisteminizde nasıl kayıt yapılır',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Ekran Alıntısı Aracı ile kayıt yapmak için Win + Shift + R tuşlarına basın.',
            'Ekran Alıntısı Aracınız güncel değilse, Xbox Game Bar ile kayıt yapmak için Win + Alt + R tuşlarına basın.',
            'Kaydı, üstte beliren çubuktaki düğmeyle durdurun.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Yakalama çubuğunu açmak için Cmd + Shift + 5 tuşlarına basın.',
            'Tüm ekranı veya seçili bir bölümü kaydetmeyi seçin.',
            "Kaydet'e basın ve bitirmek için menü çubuğundaki durdurma düğmesine basın.",
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            "Her masaüstünde bir kaydedici bulunur: GNOME'da Ctrl + Alt + Shift + R; KDE'de Spectacle.",
            'Hiçbiri yoksa paket yöneticinizden OBS Studio veya SimpleScreenRecorder yükleyin.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `Geçersiz ifade: ${detalle}` : 'Geçersiz ifade.'),
      regexDetalle: {
        corchete: 'bir köşeli ayraç “[” kapatılmamış.',
        parentesis: 'bir parantez “(” kapatılmamış.',
        parentesisSobra: 'kapatan bir parantez “)” için açan parantez yok.',
        nadaQueRepetir: 'bir niceleyicinin (“*”, “+”, “?” veya “{}”) tekrarlayacağı bir şey yok.',
        barraAlFinal: 'desen ters eğik çizgiyle bitemez.',
        rangoInvertido: 'bir karakter sınıfındaki aralık ters (örneğin “z-a”).',
        cuantificador: '“{}” niceleyicisi eksik veya sayıları ters.',
        grupo: 'bir grubun adı veya biçimi geçerli değil.',
        escape: 'bir ters eğik çizgi kaçış dizisi geçerli değil.',
      },
    },
    busqueda: {
      excluir: 'Şunları da atla (virgülle ayırın)',
      incluirPesadas: 'Ağır klasörleri dahil et (node_modules, vendor, .git…)',
      contexto: 'Bağlam satırları',
      grupoNombres: (n) => `Ada göre (${n})`,
      grupoContenido: (n) => `İçeriğe göre (${n})`,
      carpeta: 'klasör',
      listaAria: 'Arama sonuçları',
      atajos:
        '↑ ↓ ile gezinin, düzenleyicide açmak için Enter, iptal etmek veya metne dönmek için Esc.',
      sensible: (n) => `Hassas dosya: ${n}. satırda eşleşme (içeriği gösterilmez).`,
      mostrarMas: (n) => `${n} tane daha göster`,
      linea: (n) => `satır ${n}`,
      sinGrupo: 'Bu grupta sonuç yok.',
      topeBytes: 'Okuma sınırına ulaşıldı: aramayı daraltın.',
    },
    compartir: {
      explicacion:
        "Bu bilgisayardaki bir klasörü veya dosyayı geçici bir bağlantıyla internette yayınlar. Salt okunurdur: bağlantıya sahip herkes görüntüleyip indirebilir, ancak yükleyemez veya bir şeyi değiştiremez. Bağlantı gizli bir kod taşır, seçtiğiniz zamanda sona erer ve WolfCore Dev'den çıktığınızda kapanır. .env dosyaları, anahtarlar, .git klasörü ve gerçek veri içeren siteler asla paylaşılmaz.",
      eleccion: 'Ne paylaşılacak',
      elegirCarpeta: 'Klasör seç…',
      elegirArchivo: 'Dosya seç…',
      elegido: 'Seçilen',
      duracion: 'Paylaşımı durdur',
      duraciones: { m15: '15 dakika', h1: '1 saat', h4: '4 saat' },
      tunel: 'Tünel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (hızlı, hesapsız)',
        ngrok: 'ngrok (sizin belirtecinizle)',
      },
      ngrokSinToken: 'ngrok belirtecinizi gerektirir: bir sitenin tünel seçeneklerine kaydedin.',
      compartir: 'Paylaş…',
      sinFtp: 'FTP bir tünel üzerinden paylaşılmaz: şifrelenmemiştir ve tünel yalnızca HTTP taşır.',
      vacio: {
        titulo: 'Hiçbir şey paylaşılmıyor',
        texto:
          'Geçici bir herkese açık bağlantı almak için bir klasör veya dosya seçin. Siz onaylayana kadar hiçbir şey yayınlanmaz.',
      },
      grandes:
        "8 MB'tan büyük metin dosyaları veya türü bilinmeyen dosyalar tam olarak denetlenemediği için paylaşılmaz; görüntüler, ses, video ve paketler (zip, 7z, gz, pdf) paylaşılır. Listede işaretli görünürler.",
      comprimidos:
        'Sıkıştırılmış bir dosya (.zip, .7z, .gz) içine bakılmadan olduğu gibi paylaşılır: içinde bir .env dosyası veya anahtarlar varsa yayınlanırlar.',
      confirmar: {
        titulo: 'İnternette paylaş',
        pregunta: 'Bu internette yayınlansın mı?',
        rutaReal: 'Gerçek yol (bağlantılar çözümlenmiş)',
        ruta: 'Tam yol',
        aviso: (dur) =>
          `Bağlantı hazır olduğu andan itibaren ${dur} boyunca internette herkese açık olacak. Bağlantıya sahip herkes paylaşılanı görüntüleyip indirebilecek.`,
        boton: 'İnternette paylaş',
      },
      abriendo: 'Tünel açılıyor…',
      activa: 'Paylaşılıyor',
      enlace: 'Herkese açık bağlantı',
      copiar: 'Bağlantıyı kopyala',
      qr: 'Bağlantının QR kodu',
      vence: (hasta, restan) => `${hasta} saatinde sona erer (${restan})`,
      restan: (min) => (min <= 1 ? '1 dakikadan az' : `${min} dk`),
      dejar: 'Paylaşımı durdur',
      fin: {
        vencio: 'Süre doldu: sunucu ve tünel kapatıldı.',
        tunel: 'Tünel kapandı ve paylaşım durdu.',
      },
      registro: {
        titulo: 'Erişimler',
        ayuda: 'Son 200, yalnızca bellekte. Bağlantının gizli kodunu asla göstermezler.',
        vacioTitulo: 'Henüz erişim yok',
        vacioTexto: 'Biri bağlantıyı her açtığında burada görünecek.',
        col: { hora: 'Saat', ip: 'IP', ruta: 'Yol', codigo: 'Kod' },
        sinPermiso: '(doğru kod olmadan)',
      },
    },
    usoDisco: {
      explicacion:
        'Bir sürücüde veya klasörde yeri neyin kapladığını gösterir. Yalnızca adları ve boyutları okur (içeriği asla), bağlantıları veya birleşim noktalarını izlemez ve ayrı bir işlemde çalışır. Hiçbir şeyi silmez, taşımaz veya değiştirmez.',
      unidades: 'Sürücüler',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${total} içinden ${libre} boş`,
      sinUnidades: 'Sürücü listesi okunamadı. Bir klasör seçebilirsiniz.',
      elegirCarpeta: 'Klasör seç…',
      analizando: 'Çözümleniyor…',
      leyendo: 'Okunuyor',
      progreso: (archivos, carpetas, bytes) => `${archivos} dosya · ${carpetas} klasör · ${bytes}`,
      cancelar: 'İptal',
      cancelado: 'Çözümleme iptal edildi.',
      resumen: (total, archivos, carpetas) => `${archivos} dosya ve ${carpetas} klasörde ${total}`,
      duracion: (segundos) => `${segundos} sn sürdü.`,
      vistas: {
        arbol: 'Ağaç',
        carpetas: 'Klasörler',
        archivos: 'Dosyalar',
        extensiones: 'Uzantılar',
      },
      arbolAyuda:
        "Boyuta göre sıralı. Yalnızca toplamın en az %0,5'i ağırlığındaki klasörler ve dosyalar gösterilir; geri kalanı “Diğerleri” içinde toplanır.",
      carpetasAyuda:
        'Kendi ağırlığı en fazla olan 50 klasör: doğrudan içerdikleri dosyaların ağırlığı, alt klasörleri saymadan.',
      archivosAyuda: 'En büyük 50 dosya.',
      extensionesAyuda: 'En çok yer kaplayan 20 uzantı; geri kalanı “Diğer uzantılar” içine girer.',
      col: {
        nombre: 'Ad',
        tamano: 'Boyut',
        porcentaje: 'Toplamdaki payı',
        archivos: 'Dosyalar',
        ruta: 'Yol',
        extension: 'Uzantı',
      },
      otros: (n) => `Diğerleri (${n} küçük dosya)`,
      sinExtension: '(uzantısız)',
      otrasExtensiones: 'Diğer uzantılar',
      expandir: (nombre) => `${nombre} öğesini genişlet`,
      contraer: (nombre) => `${nombre} öğesini daralt`,
      abrir: "Gezgin'de aç",
      copiar: 'Yolu kopyala',
      denegada: 'Okunamadı',
      avisos: {
        enlaces: (n) => `${n} bağlantı veya birleşim noktası izlenmedi ve 0 sayıldı.`,
        denegados: (n) =>
          `${n} öğe okunamadı (izin yok veya çözümleme sırasında değişti). Yönetici hakları olmadan bazı sistem klasörleri okunamaz: bu araç bunları istemez.`,
        enlacesDuros: (n) => `Sabit bağlantılı dosyaların ${n} ek adı iki kez sayılmadı.`,
        enlacesDurosIncompleto:
          'O kadar çok sabit bağlantı vardı ki kayıt doldu: toplam bazı dosyaları iki kez sayıyor olabilir.',
        truncado: 'En büyük derinliğe ulaşıldı: bazı klasörler sayılmadı.',
        tamanoLogico:
          'Boyutlar mantıksaldır (her dosyanın bildirdiği), diskte kullanılan alan değil: yalnızca çevrimiçi OneDrive dosyaları, sıkıştırılmış dosyalar ve seyrek dosyalar farklı olabilir.',
        verEnlaces: 'İzlenmeyen bağlantıları göster',
      },
      limpieza: {
        titulo: 'Yer aç',
        texto:
          'Bu araç yalnızca ölçer. Geçici dosyaları ve yeniden üretilebilir önbellekleri veya kullanılmayan hizmet sürümlerini silmek için zaten var olanları kullanın:',
        temporales: 'Disk temizliği',
        versiones: 'Kullanılmayan sürümler (Hizmetler)',
      },
      vacio: {
        titulo: 'Henüz çözümleme yok',
        texto:
          'Yeri neyin kapladığını görmek için bir sürücü veya klasör seçin. Hiçbir şey değiştirilmez.',
      },
      sinContenido: {
        titulo: 'Sayılacak bir şey yok',
        texto: 'Bu klasörde okunabilecek dosya yok.',
      },
    },
    diffCarpetas: {
      explicacion:
        'İki klasörü, içlerinde hiçbir şeyi değiştirmeden karşılaştırır: yalnızca birinde olanlar, yalnızca diğerinde olanlar ve farklı olanlar. Bağlantıları izlemez ve ayrı bir işlemde çalışır.',
      carpetaA: 'A klasörü',
      carpetaB: 'B klasörü',
      elegir: 'Klasör seç',
      sinElegir: 'Seçilmedi',
      comparar: 'Karşılaştır',
      comparando: 'Karşılaştırılıyor…',
      cancelar: 'İptal',
      cancelada: 'Karşılaştırma iptal edildi.',
      iguales: 'İki klasör aynı.',
      grupoSoloA: "Yalnızca A'da",
      grupoSoloB: "Yalnızca B'de",
      grupoDistintos: 'Farklı',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'Yok',
      resumen: (a, b, iguales) => `A: ${a} dosya · B: ${b} dosya · ${iguales} özdeş`,
      truncado: 'Bir sınıra ulaşıldı (dosyalar, derinlik veya boyut): liste eksik.',
      recortado: (mostrados, total) =>
        `Gösterilenden daha fazla dosya var (${total} içinden ${mostrados}).`,
      sinComparar: (n) => `Aynı boyuttaki ${n} büyük dosya içeriğe göre karşılaştırılmadı.`,
      omitidos: (n) => `${n} bağlantı, birleşim noktası veya özel öğe atlandı.`,
      motivoTamano: 'farklı boyut',
      motivoContenido: 'aynı boyut, farklı içerik',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Farkını görmek için listeden “farklı” bir dosya seçin.',
      soloEnUno: (lado) => `Bu dosya yalnızca ${lado} içinde var.`,
      cargando: 'Dosyalar okunuyor…',
      binario: 'Dosyalar farklı ama metin değil: fark gösterilmez.',
      sensible:
        'Hassas dosya (.env, anahtarlar veya gerçek veri): farklı ama içeriği gösterilmez. Güçlendirilmiş onay isteyen düzenleyicide açabilirsiniz.',
      tope: (kb) => `Dosyalar farklı ama ${kb} KB'ı aşıyor: metin farkı gösterilmez.`,
      demasiadoDistinto: 'Dosyalar o kadar farklı ki satır satır fark gösterilmez.',
      saltos: { lf: 'LF', crlf: 'CRLF', mixto: 'karışık satır sonları', ninguno: 'satır sonu yok' },
      saltosDistintos: (a, b) => `Satır sonları: A ${a}, B ${b} kullanıyor.`,
      soloSaltos:
        'Satırların metni aynı: yalnızca satır sonları (dosya sonundaki dahil) veya BOM değişti.',
      resumenArchivo: (agregadas, quitadas) =>
        `${agregadas} satır eklendi, ${quitadas} satır silindi`,
      truncadoArchivo: 'Yalnızca ilk satırlar gösteriliyor.',
      lineasIguales: (n) => `… ${n} özdeş satır …`,
      abrirA: "A'yı düzenleyicide aç",
      abrirB: "B'yi düzenleyicide aç",
      atajos: '↑ ↓ ile gezinin, farkı görmek için Enter, iptal etmek için Esc.',
      listaAria: (grupo) => `Dosyalar: ${grupo}`,
      detalleAria: 'Dosya farkları',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'HTTP istemcisi bölümleri',
        peticion: 'İstek',
        coleccion: 'Koleksiyon',
        historial: 'Geçmiş',
        entornos: 'Ortamlar',
      },
      entorno: 'Ortam',
      sinEntorno: 'Ortam yok',
      metodo: 'Yöntem',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path veya {{base}}/path',
      enviar: 'Gönder',
      enviarAtajo: 'Gönder (Ctrl+Enter)',
      cancelar: 'İptal',
      nueva: 'Yeni',
      guardar: 'Koleksiyona kaydet',
      nombre: 'Ad',
      nombrePlaceholder: 'İstek adı',
      guardada: 'İstek kaydedildi',
      ayudaVariables: 'Seçili ortamdan değer almak için {{variable}} kullanın.',
      secciones: {
        params: 'Parametreler',
        cabeceras: 'Başlıklar',
        cuerpo: 'Gövde',
        auth: 'Kimlik doğrulama',
        opciones: 'Seçenekler',
      },
      par: {
        clave: 'Ad',
        valor: 'Değer',
        agregar: 'Satır ekle',
        quitar: 'Satırı kaldır',
        activa: 'Satır etkin',
        falta: 'Gizli değer eksik: gönderebilmek için yazın.',
      },
      cuerpo: {
        tipo: 'Gövde türü',
        ninguno: 'Yok',
        json: 'JSON',
        form: 'Form (urlencoded)',
        multipart: 'Multipart (yalnızca metin)',
        raw: 'Ham metin',
        tipoContenido: 'Content-Type',
        texto: 'İçerik',
        multipartAyuda: 'Yalnızca metin alanları: diskten dosya gönderilmez.',
      },
      auth: {
        tipo: 'Tür',
        ninguna: 'Yok',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API anahtarı',
        token: 'Belirteç',
        usuario: 'Kullanıcı',
        clave: 'Parola',
        nombre: 'Başlık veya parametre adı',
        en: 'Şuraya gönder',
        cabecera: 'Başlık',
        query: 'Sorgu dizesi',
        ayuda:
          'Değer sistem tarafından şifrelenmiş olarak saklanır; koleksiyon, geçmiş ve ortamlar yalnızca bir başvuru tutar.',
      },
      secreto: {
        guardado: 'Saklandı (şifreli). Değiştirmek için yazın.',
        mostrar: 'Göster',
        ocultar: 'Gizle',
        quitar: 'Kaldır',
        valor: 'Saklanan değer',
        porNombre: 'Ad bir gizli değere benzediği için şifreli olarak saklanacak.',
      },
      opciones: {
        plazo: 'Zaman aşımı (saniye)',
        plazoAyuda: '1 ile 120 saniye arası.',
        ignorarCert: 'Bu istek için sertifika hatalarını yok say',
        ignorarAviso:
          "Tehlikeli: bağlantı artık doğrulanmaz. Yalnızca bu istek ve ana makinesi için geçerlidir. WolfCore .test siteleri zaten kendi CA'sıyla doğrulanır.",
        limites:
          "En fazla 10 MB yanıt ve en fazla 10 yönlendirme. Saklanan çerez ve sistem proxy'si yok.",
      },
      respuesta: {
        enviando: 'Gönderiliyor…',
        estado: 'Durum',
        tiempo: 'Süre',
        tamano: 'Boyut',
        cuerpo: 'Gövde',
        cabeceras: 'Başlıklar',
        redirecciones: 'Yönlendirmeler',
        vacioTitulo: 'Henüz yanıt yok',
        vacioTexto: "Bir URL yazın ve Gönder'e basın. İstek WolfCore Dev'den çıkar.",
        binario: (bytes, tipo) => `${bytes} baytlık ikili veri, tür ${tipo || 'bilinmiyor'}.`,
        sinCuerpo: 'Yanıtın gövdesi yok.',
        truncada: "Yanıt 10 MB'ı aştı: kesildi ve eksik.",
        parcial: (mostrados) => `İlk ${mostrados} karakter gösteriliyor.`,
        sinRedirecciones: 'Yönlendirme olmadı.',
        salto: (n) => `Atlama ${n}`,
        urlFinal: 'Son URL',
        certIgnorado: 'Bu istek için sertifika hataları yok sayıldı.',
        caWolf: "WolfCore Dev CA'sıyla doğrulandı.",
        copiar: 'Gövdeyi kopyala',
        copiado: 'Gövde kopyalandı',
        formato: 'Biçimlendirilmiş JSON',
        crudo: 'Özgün metin',
      },
      curl: {
        copiar: 'curl olarak kopyala',
        incluir: 'Kimlik bilgilerini dahil et',
        incluirAyuda:
          'İşaretli değilken gizli değerler <secreto> olarak çıkar. İşaretliyken komut gerçek kimlik bilgilerini taşır.',
        copiado: 'curl komutu kopyalandı',
        importar: 'curl içe aktar',
        importarTitulo: 'Bir curl komutunu içe aktar',
        importarAyuda:
          'Bir curl komutu yapıştırın. Yalnızca metin olarak okunur: hiçbir şey çalıştırılmaz. Kimlik bilgileri şifreli depoya gider.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'İçe aktar',
        importada: 'İstek koleksiyona aktarıldı',
        avisos: {
          opcion_ignorada: (d) => `Seçenek yok sayıldı: ${d}`,
          archivo_ignorado: (d) => `Diskteki dosyalar okunmaz: ${d}`,
          inseguro_ignorado:
            '-k/--insecure yok sayıldı. Gerekiyorsa «Sertifika hatalarını yok say» seçeneğini elle açın.',
          comando_cortado: 'Bir kabuk işlecinden (|, ;, &, >) sonra gelen her şey yok sayıldı.',
          sin_evaluar:
            'Metinde $(…), ters tırnak veya kabuk değişkenleri vardı: değerlendirilmezler ve metin olarak kalırlar.',
          url_sin_esquema: "URL'de şema yoktu: http:// kullanıldı.",
          varias_urls: (d) => `Fazladan bir bağımsız değişken yok sayıldı: ${d}`,
          cabecera_invalida: (d) => `Geçersiz bir başlık yok sayıldı: ${d}`,
          secretos_guardados:
            'İçe aktarılan kimlik bilgileri şifreli olarak saklandı; koleksiyon yalnızca başvurularını tutar.',
        },
      },
      coleccion: {
        vacioTitulo: 'Koleksiyon boş',
        vacioTexto:
          'Elinizin altında tutmak için bir isteği kaydedin veya bir curl komutu içe aktarın.',
        abrir: 'Aç',
        borrar: 'Sil',
        borrada: 'İstek silindi',
      },
      historial: {
        vacioTitulo: 'Geçmiş yok',
        vacioTexto:
          'Son 100 istek burada kimlik bilgileri olmadan kalır: hassas başlıklar *** olarak görünür.',
        abrir: 'Aç',
        limpiar: 'Geçmişi temizle',
        sinRespuesta: 'Yanıt yok',
      },
      entornos: {
        vacioTitulo: 'Ortam yok',
        vacioTexto:
          'Bir ortam {{base}} veya {{token}} gibi değişkenleri tanımlar. Gizli olarak işaretlenenler şifreli olarak saklanır.',
        nuevo: 'Yeni ortam',
        nombre: 'Ortam adı',
        variable: 'Değişken',
        valor: 'Değer',
        secreta: 'Gizli',
        agregar: 'Değişken ekle',
        quitar: 'Değişkeni kaldır',
        guardar: 'Ortamı kaydet',
        guardado: 'Ortam kaydedildi',
        borrar: 'Ortamı sil',
        borrado: 'Ortam silindi',
        usar: 'Bu ortamı kullan',
        activo: 'Etkin',
        sinNombre: 'Ortam için bir ad yazın.',
      },
    },
    imagenes: { nombreCaptura: 'ekran-goruntusu' },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Bağlantı noktası {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Bağlantı noktası {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Ayrılmış aralık {desde}-{hasta} ({puerto} dahil)',
      ca_vencida: "CA'nın süresi {dias} gün önce doldu",
      ca_por_vencer: "CA'nın süresi {dias} gün içinde dolacak",
      certificado_vencido: '{dominio} sertifikasının süresi {dias} gün önce doldu',
      certificado_por_vencer: '{dominio} sertifikasının süresi {dias} gün içinde dolacak',
      firefox_perfiles: 'Güveni olmayan Firefox profilleri:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (açık)',
      firefox_perfil_fuera: '{perfil} (Firefox klasörünün dışında)',
      hosts_ilegible: '{ruta}: okunamadı ({motivo})',
      hosts_codificacion: '{ruta}: {codificacion} kodlaması',
      hosts_bloques: '{ruta}: {bloques} WolfCore Dev bloğu',
      hosts_sin_cierre: '{ruta}: bir WolfCore Dev bloğunun kapanış işareti yok',
      hosts_faltan: 'hosts içinde eksik: {dominios}',
      hosts_solo_lectura: '{ruta}: salt okunur özniteliği',
      path_repetidas: 'Tekrarlananlar: {entradas}',
      path_delante:
        '{entrada}, WolfCore Dev araçlarından önce geliyor ve ayrıca {programa} içeriyor',
      antivirus_sin_leer: 'Antivirüs etkin; dışlamaları okunamadı (yönetici gerekir).',
      antivirus_sin_exclusion: 'Antivirüs etkin ve WolfCore Dev veri klasörü dışlanmamış.',
      enlazador_ausente: "Visual Studio Build Tools'un C++ araçları bulunamadı.",
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) yüklü değil.',
      firewall_no_comprobado: 'Güvenlik duvarı kuralları okunamadı (yönetici gerekebilir).',
      firewall_reglas: 'WolfCore Dev: {propias} · WolfCore testlerinden kalanlar: {pruebas}',
      firewall_acotadas: 'Yerel ağla sınırlı kurallar:',
      firewall_ajenas: 'Diğer programların kuralları:',
      firewall_quitadas: 'Geri yüklenebilecek kaldırılmış kurallar:',
    },
    ver: 'Görüntüle',
    verPuertos: 'Bağlantı noktalarını görüntüle',
    dialogo: {
      reglas: 'Etkilenen kurallar: dokunmak istemediklerinizin işaretini kaldırın.',
      sinSeleccion: 'Devam etmek için en az bir kural işaretleyin.',
      reglasNota:
        'Onayınız ve yönetici izni olmadan hiçbir şey değişmez. Bir kural gösterildikten sonra değiştiyse atlanır.',
    },
    reparaciones: {
      firewall:
        'Bu gelen trafik güvenlik duvarı kurallarını tek tek ve tam adlarıyla kaldırın. Yeniden oluşturulabilmeleri için önce HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos korumalı kayıt defteri anahtarının içine bir kopya kaydedilir. Diğer programların kurallarına asla dokunulmaz.',
      firewall_restaurar:
        'İşaretlediğiniz kuralları, korumalı kopyadan (etc/ içindeki dosyadan değil) gösterilenle aynı program, profil, protokol, bağlantı noktaları ve adreslerle yeniden oluşturun. Bu programlar yeniden ağ bağlantılarını kabul edebilecek.',
    },
  },
  versiones: {
    avisoMaven:
      "WolfCore Dev, Maven'i doğrudan JDK ile başlatır ve güvenlik için .mvn/jvm.config dosyasını veya MAVEN_OPTS değişkenini okumaz. Projeniz bunlara ihtiyaç duyuyorsa Maven'i bir terminalden çalıştırın.",
    avisoRuby:
      'Ruby, Devkit (MSYS2) olmadan ve PATH\'inize veya Windows kayıt defterine dokunmadan yüklenir: bir yükleyici yoktur. Önceden derlenmiş ikili dosyası olmayan yerel uzantılı gem\'ler Devkit gerektirir. Bu elle yapılan bir adımdır: projeden bir terminal açın ve "ridk install" komutunu çalıştırın (bilgisayarınıza MSYS2 yükler ve internetten indirir).',
    avisoJdk:
      "Maven ve Gradle bir WolfCore Dev JDK'sı ile çalışır ve henüz hiçbiri yüklü değil. Hizmet listesinden Java'yı (Temurin) yükleyin.",
    avisoMeilisearch:
      "Her Meilisearch ikincil sürümünün kendi verisi vardır. Başka bir ikincil sürüme geçerseniz (örneğin 1.58'den 1.59'a), dizinleri ve MEILISEARCH_KEY yeni olur: yeniden dizinlemeniz ve projelerinizin .env dosyasını güncellemeniz gerekir.",
    servicios: { meilisearch: 'Meilisearch', ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    anteriores: (n) => `Önceki yamalar (${n})`,
  },
  memoria: {
    boton: 'Bellek',
    tituloBoton: 'Belleği en iyileştir',
    titulo: 'Bellek iyileştirici',
    intro:
      'Bir mod seçin ve listeyi gözden geçirin. Siz onaylayana kadar hiçbir şey kapatılmaz veya durdurulmaz ve kendiliğinden asla çalışmaz.',
    modo: 'Mod',
    modos: { liviano: 'Hafif', moderado: 'Orta', profundo: 'Derin' },
    descripciones: {
      liviano:
        'Uygulama önbelleğini temizler. Disk alanı açar; hiçbir şeyi kapatmaz veya durdurmaz.',
      moderado:
        'Ayrıca tek bir PHP işçisi bırakmayı ve etkinliği veya bağlantısı olmayan WolfCore Dev hizmetlerini durdurmayı önerir. Hizmetler işaretsiz başlar.',
      profundo:
        'Ayrıca belleği çok kullanan kendi programlarınızı listeler; böylece pencerelerini kapatmalarını isteyebilirsiniz. İşaretsiz başlarlar.',
    },
    ver: 'Listeyi göster',
    revisando: 'Denetleniyor…',
    vacio: 'Bu modda boşaltılacak bir şey yok.',
    tipos: {
      'cache-app': 'Önbelleği temizle',
      'reducir-pool': 'Tek bir işçi bırak',
      'detener-inactivo': 'Durdur (boşta)',
      'cerrar-programa': 'Penceresini kapatmasını iste',
    },
    caches: { sesion: 'Uygulama oturumunun HTTP önbelleği' },
    estimado: (cantidad) => `Yaklaşık ${cantidad} RAM boşaltılacak`,
    estimadoDisco: (cantidad) => `Ayrıca yaklaşık ${cantidad} disk (önbellek RAM değildir)`,
    marcadas: (n, total) => `${total} içinden ${n} işaretli`,
    sinDatos:
      "Hizmetleri durdurmayı veya PHP'yi azaltmayı önermek için henüz yeterli etkinlik verisi yok. Başlangıç sayfasını birkaç dakika açık bırakın ve yeniden bakın.",
    listadoFallido:
      'Açık programların listesi okunamadı: bu liste eksik olabilir. Yeniden deneyin.',
    avisoDetener:
      'Boştaki hizmetler işaretsiz başlar: bir hizmeti durdurmak onu kullanan her şeyi keser. Yalnızca şu anda bağlantısı olmayanlar listelenir.',
    avisoCerrar:
      "Programlardan yalnızca pencerelerini kapatmaları istenir, X'e tıklamak gibi: kaydetmek isteyip istemediğinizi sorabilirler. Hiçbir program zorla kapatılmaz veya sonlandırılmaz.",
    protegidos:
      'Sistem programları, Windows hizmetleri, yükseltilmiş programlar, diğer kullanıcılar, FlyEnv, PhpWebStudy ve WolfCore Dev (veya başlattıkları herhangi bir şey) asla görünmez.',
    aplicar: 'İşaretlileri uygula',
    confirmarTitulo: 'Bu işlemler uygulansın mı?',
    confirmarTexto: (n) =>
      n === 1 ? 'Listeden 1 işlem çalıştırılacak.' : `Listeden ${n} işlem çalıştırılacak.`,
    confirmarCerrar: (nombres) =>
      `Bu programlardan pencerelerini kapatmaları istenecek: ${nombres}.`,
    confirmarDetener: (nombres) => `Bu hizmetler durdurulacak: ${nombres}.`,
    confirmar: 'Evet, uygula',
    cancelar: 'İptal',
    resultadoTitulo: 'Sonuç',
    liberado: (cantidad) => `Tahmini: yaklaşık ${cantidad} RAM boşaltıldı`,
    liberadoDisco: (cantidad) => `Ayrıca yaklaşık ${cantidad} disk`,
    notaPedido:
      'Sizi bekliyor: pencerenin kapatılması istendi ve program hâlâ açık (kaydetmek isteyip istemediğinizi soruyor olabilir). Boşaltılmış sayılmaz.',
    estados: { hecho: 'Tamam', pedido: 'Sizi bekliyor', saltado: 'Atlandı', error: 'Başarısız' },
    motivos: {
      no_en_plan: 'Listede yoktu',
      protegido: 'Korumalı bir program',
      cambio: 'Liste gösterildikten sonra değişti',
      sin_ventana: 'Artık kapatılacak penceresi yok',
      ya_apagado: 'Azaltılacak bir şey kalmamıştı',
      ocupado: 'Meşguldü (bağlantıları var)',
      no_se_pudo: 'Kapatma isteği gönderilemedi (program yükseltilmiş haklarla çalışıyor)',
    },
    otraVez: 'Baştan başla',
  },
  guias: {
    tuneles: { titulo: 'Tünel kılavuzu', copiar: 'Komutu kopyala' },
    http: {
      buscar: 'Numaraya, ada veya metne göre ara',
      familia: 'Aile',
      todas: 'Tümü',
      verMetodos: 'Yöntemler',
      verCodigos: 'Durum kodları',
      resultados: (n) => `${n} sonuç`,
      vacio: 'Aramayla eşleşen bir şey yok.',
      seguro: 'Güvenli',
      noSeguro: 'Güvenli değil',
      idempotente: 'Eşgüçlü (idempotent)',
      noIdempotente: 'Eşgüçlü değil',
      noEstandar: 'Standart dışı',
      broma: 'Şaka kodu (RFC 2324)',
      causas: 'Yaygın nedenler',
      solucion: 'Nasıl düzeltilir',
      ejemplo: 'Örnek',
      copiarEjemplo: 'Örneği kopyala',
      probar: 'Dene',
      probarTitulo:
        "Bu örneği HTTP istemcisinde deneyin (Gönder'e basana kadar hiçbir şey gönderilmez)",
      servidorActivo: (puerto) =>
        `Kılavuzu veya HTTP istemcisini kullanırken örnek sunucu 127.0.0.1:${puerto} adresinde çalışıyor. Yalnızca bu bilgisayardan erişilebilir ve siz ayrıldığınızda ya da 10 dk kullanılmazsa durur.`,
      sinTraduccion: 'Bu dile çevrilmedi: İngilizce gösteriliyor.',
      familias: {
        '1xx': '1xx Bilgilendirme',
        '2xx': '2xx Başarı',
        '3xx': '3xx Yönlendirme',
        '4xx': '4xx İstemci hatası',
        '5xx': '5xx Sunucu hatası',
      },
    },
    git: {
      buscar: 'Bir konu veya komut ara',
      verGuia: 'Kılavuz',
      verLaboratorio: 'Laboratuvar',
      todos: 'Tümü',
      grupos: {
        basico: 'Temel bilgiler',
        ramas: 'Dallar',
        deshacer: 'Geri alma',
        remotos: 'Uzak depolar ve etiketler',
        github: 'GitHub',
      },
      resultados: (n) => `${n} konu`,
      vacio: 'Aramayla eşleşen bir şey yok.',
      ejemplo: 'Örnek',
      errores: 'Sık yapılan hatalar',
      copiarEjemplo: 'Örneği kopyala',
      peligroso: 'Tehlikeli',
      sinTraduccion: 'Bu dile çevrilmedi: İngilizce gösteriliyor.',
      avisoGithub:
        "Bu bölüm yalnızca açıklamadır: WolfCore Dev bu kılavuzdan hesap oluşturmaz, GitHub'da oturum açmaz veya belirteç kullanmaz. Örneklerdeki adlar ve değerler uydurmadır.",
      irLaboratorio: 'Laboratuvarda alıştırma yap',
      lab: {
        intro:
          "WolfCore Dev'e ait bir klasörde bir alıştırma deposu ve yerel bir “uzak depo”. İnterneti veya GitHub'ı kullanmaz, projelerinize veya git ayarlarınıza dokunmaz.",
        sinGit: {
          titulo: 'Git yüklü değil',
          texto:
            "Laboratuvar sisteminizdeki git'i kullanır ve onsuz açılamaz. Git'i yükleyin ve bu sekmeyi yeniden açın; WolfCore Dev sizin için hiçbir şey yüklemez.",
        },
        cargando: 'Laboratuvar hazırlanıyor…',
        reiniciar: 'Laboratuvarı sıfırla',
        reiniciarAyuda: 'Yalnızca alıştırma klasörünü siler ve yeni gibi bırakır.',
        reiniciado: 'Laboratuvar sıfırlandı.',
        version: (v) => `git ${v}`,
        ordenes: 'Komutlar',
        mensaje: 'Commit iletisi',
        mensajePorDefecto: 'Alıştırma değişikliği',
        rama: 'Dal',
        etiqueta: 'Etiket',
        archivo: 'Dosya',
        grupos: {
          basico: 'Temel bilgiler',
          ramas: 'Dallar',
          guardar: 'Kaydetme ve geri alma',
          remoto: 'Yerel uzak depo',
        },
        archivos: {
          titulo: 'Alıştırma dosyaları',
          ayuda: 'Yalnızca bu dosyalar düzenlenebilir, en fazla 2000 karakterlik metinle.',
          guardar: 'Dosyayı kaydet',
          guardado: 'Dosya kaydedildi.',
          areaTexto: (n) => `${n} içeriği`,
        },
        salida: 'Çıktı',
        salidaVacia: "git'in yanıtını burada görmek için bir komuta basın.",
        codigo: (n) => (n === 0 ? 'Sorunsuz tamamlandı' : `${n} koduyla tamamlandı`),
        truncada: 'Çıktı kesildi.',
        historial: 'Geçmiş',
        historialVacio: 'Henüz commit yok: git init, git add ve git commit çalıştırın.',
        conflicto: {
          titulo: 'Yönlendirmeli alıştırma: bir çakışma',
          intro:
            'İki dal aynı satırı değiştirir. Çakışmanın nasıl göründüğünü ve nasıl çözüldüğünü göreceksiniz.',
          paso: (n, total) => `Adım ${n} / ${total}`,
          ejecutar: 'Bu adımı çalıştır',
          hecho: 'Tamam',
          reempezar: 'Baştan başla',
          esperado: 'Git çakışmayı bildirdi: bu adımda beklenen budur.',
          elegir: {
            mia: "main'dekini koru (yeşil)",
            otra: "rama-a'dakini koru (kırmızı)",
            ambas: 'İkisini de koru',
          },
          final: 'Tamam: bir çakışmayı çözdünüz. Geçmişe bakın.',
          pasos: [
            {
              titulo: 'Laboratuvarı hazırla',
              texto:
                'Laboratuvar sıfırlanır ve colores.txt (“color: azul”) ile ilk commit yapılır.',
            },
            {
              titulo: 'Satırı rama-a üzerinde değiştir',
              texto: 'rama-a dalı oluşturulur, satır “color: rojo” olur ve commit edilir.',
            },
            {
              titulo: 'Aynı satırı main üzerinde değiştir',
              texto: 'main dalına dönülür, satır “color: verde” olur ve commit edilir.',
            },
            {
              titulo: 'Birleştirmeyi dene',
              texto:
                'rama-a, main ile birleştirilir. Git hangi satırı koruyacağını bilemez ve bir çakışma bırakır.',
            },
            {
              titulo: 'Bir sürüm seç',
              texto:
                'Satırın hangi sürümünü koruyacağınızı seçin. colores.txt artık çakışma işaretlerini içerir.',
            },
            {
              titulo: 'Çözümü onayla',
              texto: 'colores.txt hazırlanır (add) ve birleştirmeyi kapatan commit yapılır.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `En fazla ${mb} MB'a kadar metin dosyaları için söz dizimi vurgulamalı hafif bir düzenleyici. Dosyayı sistem iletişim kutusunda seçin; kaydetme her zaman onay ister ve önce WolfCore Dev veri klasörüne bir kopya bırakır.`,
    abrir: 'Dosya aç…',
    abriendo: 'Açılıyor…',
    guardar: 'Kaydet',
    guardando: 'Kaydediliyor…',
    recargar: 'Diskten yeniden yükle',
    vacio: 'Düzenlemeye başlamak için bir dosya açın.',
    sinCambios: 'Değişiklik yok',
    conCambios: 'Kaydedilmemiş değişiklikler',
    posicion: (linea, columna) => `Satır ${linea}, sütun ${columna}`,
    areaTexto: (nombre) => `Kod düzenleyici: ${nombre}`,
    salirTeclado: "Düzenleyiciden klavyeyle çıkmak için Esc'e, ardından Tab'a basın.",
    guardado: 'Dosya kaydedildi.',
    copiaPrevia: (ruta) => `Yedek kopya: ${ruta}`,
    cancelar: 'İptal',
    enlaceDuro:
      'Bu dosyanın diskte birden fazla adı var (sabit bağlantı). Kaydetmek bu bağlantıyı koparır: diğer adlar eski içeriği korur.',
    saltosMixtos: {
      aviso: "Bu dosyada karışık satır sonları var. Kaydetmek hepsini LF'ye normalleştirir.",
      aceptar: 'Satır sonlarının normalleştirilmesini kabul ediyorum',
    },
    envGestor: {
      aviso:
        '.env dosyaları, gizli değer akışıyla birlikte proje değişkenlerinde düzenlenir. Düğme, projenin kök dizinindeki .env dosyasını açar; bu, açmaya çalıştığınız dosya olmayabilir.',
      boton: 'Projenin kök dizinindeki .env dosyasını aç',
    },
    huellaPerdida: 'Kaydedildi, ancak yeni parmak izi okunamadı: dosya yeniden yüklendi.',
    confirmarGuardar: {
      titulo: 'Değişiklikleri kaydet',
      texto: (nombre) =>
        `${nombre} yazılmak üzere. Önce, diskte şu an bulunanın bir kopyası WolfCore Dev veri klasörüne kaydedilir.`,
      boton: 'Yedek kopyayla kaydet',
    },
    refuerzo: {
      abrirTitulo: 'Hassas dosya',
      guardarTitulo: 'Hassas bir dosyayı kaydet',
      secreto:
        'Bu dosya gizli bilgiler (özel anahtarlar, belirteçler veya kimlik bilgileri) içeriyor gibi görünüyor. İçeriği ekranda gösterilecek.',
      datosReales:
        'Bu dosya, gerçek veri içerdiği işaretlenmiş bir siteye ait. Yanlış bir değişiklik gerçek bilgileri etkileyebilir.',
      instruccion: (nombre) => `Devam etmek için dosya adını yazın: ${nombre}`,
      etiqueta: 'Dosya adı',
      abrirBoton: 'Yine de aç',
      guardarBoton: 'Yine de kaydet',
    },
    cambioExterno: {
      titulo: 'Dosya düzenleyicinin dışında değişti',
      texto:
        'Siz açtığınızdan beri başka bir program onu değiştirdi, bu yüzden hiçbir şey kaydedilmedi. Yeniden yükleyebilirsiniz (değişiklikleriniz kaybolur) veya buradakilerle üzerine yazabilirsiniz.',
      recargar: 'Yeniden yükle ve değişikliklerimi at',
      sobrescribir: 'Üzerine yaz…',
      sobrescribirTitulo: 'Dosyanın üzerine yaz',
      sobrescribirTexto:
        'Diğer programın yaptığı değişiklikler kaybolacak. Şu anki içeriği yedek kopyada kalacak.',
      sobrescribirBoton: 'Evet, üzerine yaz',
      volver: 'Geri dön',
    },
    descartar: {
      titulo: 'Kaydedilmemiş değişiklikler',
      texto: 'Düzenleyicide kaydedilmemiş değişiklikler var. Devam ederseniz kaybolurlar.',
      confirmar: 'Değişiklikleri at',
      seguir: 'Düzenlemeye devam et',
    },
    cm: {
      'Control character': 'Denetim karakteri',
      'Selection deleted': 'Seçim silindi',
      'Go to line': 'Satıra git',
      go: 'git',
      Find: 'Bul',
      Replace: 'Değiştir',
      next: 'sonraki',
      previous: 'önceki',
      all: 'tümü',
      'match case': 'büyük/küçük harf',
      regexp: 'düzenli ifade',
      'by word': 'sözcüğe göre',
      replace: 'değiştir',
      'replace all': 'tümünü değiştir',
      close: 'kapat',
      'current match': 'geçerli eşleşme',
      'on line': 'satırda',
      'replaced match on line $': '$. satırdaki eşleşme değiştirildi',
      'replaced $ matches': '$ eşleşme değiştirildi',
      'folded code': 'katlanmış kod',
      unfold: 'katlamayı aç',
      to: '-',
    },
  },
  limpiezaDisco: {
    intro:
      'Önce çözümler ve her öğenin ne kadar yer kapladığını gösterir. Siz onaylayana kadar hiçbir şey silinmez ve kendiliğinden veya arka planda asla çalışmaz.',
    analizar: 'Çözümle',
    analizando: 'Çözümleniyor…',
    cancelarAnalisis: 'İptal',
    vacio: 'Temizlenecek bir şey yok.',
    categorias: {
      temp: {
        nombre: 'Geçici dosyalar',
        ayuda:
          'TEMP klasörünüzdeki 24 saatten eski dosyalar. Kalıcı olarak silinir; kendiliğinden yeniden oluşurlar.',
      },
      'cache-chrome': {
        nombre: 'Google Chrome önbelleği',
        ayuda: 'Yalnızca her profilin önbellek klasörleri; çerezler, parolalar veya geçmiş asla.',
      },
      'cache-edge': {
        nombre: 'Microsoft Edge önbelleği',
        ayuda: 'Yalnızca her profilin önbellek klasörleri; çerezler, parolalar veya geçmiş asla.',
      },
      'cache-brave': {
        nombre: 'Brave önbelleği',
        ayuda: 'Yalnızca her profilin önbellek klasörleri; çerezler, parolalar veya geçmiş asla.',
      },
      'cache-firefox': {
        nombre: 'Firefox önbelleği',
        ayuda: 'Yalnızca her profilin cache2 klasörü; çerezler, parolalar veya geçmiş asla.',
      },
      'wolfcore-descargas': {
        nombre: 'WolfCore Dev önbelleğe alınmış indirmeleri',
        ayuda: 'Artık kullanılmayan başıboş arşivler. Geri dönüşüm kutusuna gönderilir.',
      },
      'wolfcore-registros': {
        nombre: 'WolfCore Dev günlükleri',
        ayuda: '30 günden eski günlükler. Geri dönüşüm kutusuna gönderilir.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          "İsteğe bağlı. Windows onu yeniden oluşturur, ancak WolfCore Dev'in yönetici olarak çalışmasını gerektirir.",
      },
    },
    bloqueos: {
      'navegador-abierto':
        "Tarayıcı açık veya arka planda çalışıyor: önbelleğini temizlemek için tamamen kapatın (Edge'de başlangıç hızlandırmasını ve arka plan uzantılarını da kapatın)",
      'requiere-admin': "WolfCore Dev'in yönetici olarak çalıştırılmasını gerektirir",
      'ruta-vetada': 'Korumalı yol: temizlenmedi',
      'temp-no-seguro':
        'TEMP değişkeni kullanıcının geçici klasörü olmayan bir klasöre işaret ediyor (Belgeler, bir sürücünün tamamı, bir ağ yolu…): temizlenmedi',
    },
    borradoDefinitivo: 'Kalıcı olarak silinir (kendiliğinden yeniden oluşurlar)',
    borradoPapelera: 'Sistem geri dönüşüm kutusuna gönderilir',
    archivos: (n) => (n === 1 ? '1 dosya' : `${n} dosya`),
    carpetas: 'Klasöre göre',
    truncado: 'Çözümleme dosya sınırında durdu: gösterilenden fazlası var.',
    marcadas: (n, t) => `${t} kategoriden ${n} tanesi seçili`,
    total: (b) => `Yaklaşık ${b} boşaltılacak`,
    limpiar: 'Seçilenleri temizle',
    confirmarTitulo: 'Bu kategoriler temizlensin mi?',
    confirmarTexto: (n) => `${n} kategori temizlenecek.`,
    confirmarDefinitivo:
      'TEMP ve önbellekler kalıcı olarak silinir (kendiliğinden yeniden oluşurlar).',
    confirmarPapelera: 'WolfCore Dev günlükleri ve indirmeleri geri dönüşüm kutusuna gider.',
    confirmarPrefetch:
      'Prefetch: Windows onu yeniden oluşturur, ancak programların ilk açılışları biraz daha yavaş olabilir.',
    confirmar: 'Evet, temizle',
    cancelar: 'İptal',
    detener: 'Temizliği durdur',
    resultadoTitulo: 'Sonuç',
    liberado: (b) => `Boşaltılan: ${b}`,
    enPapelera: (b) =>
      `Bunun ${b} kadarı geri dönüşüm kutusunda (boşalttığınızda alan geri gelir).`,
    saltados: (n) => `${n} dosya atlandı`,
    cancelado: 'Temizlik iptal edildi: zaten silinenler silinmiş kalır.',
    topeEjecucion:
      'Çalıştırma başına dosya sınırına ulaşıldı: devam etmek için yeniden çözümleyin ve temizleyin.',
    registroFallido:
      'Temizlik günlüğü artık yazılamadı, bu yüzden temizlik durdu: silinenler o noktaya kadar günlüğe kaydedildi.',
    motivos: {
      'en-uso': 'Kullanımda',
      enlace: 'Bağlantı veya yeniden ayrıştırma noktası (izlenmedi)',
      protegido: 'Korumalı (.env, FlyEnv veya benzeri)',
      cambio: 'Çözümlemeden sonra değişti',
      'sin-papelera': 'Geri dönüşüm kutusu kullanılamıyor',
      ilegible: 'Okunamadı',
      error: 'Silinirken hata',
    },
    verRegistros: 'Günlükleri görüntüle',
    registroEn: (r) => `Bu temizliğin günlüğü: ${r}`,
    otraVez: 'Baştan başla',
    protegidas:
      'Asla dokunulmaz: veriler, yedekler, projeler, veritabanları veya .env dosyaları. Bağlantılar izlenmez ve bu listedeki yolların dışındaki hiçbir şeye dokunulmaz.',
  },
  preferencias: {
    asistente: 'Karşılama turu',
    asistenteAyuda:
      'Ana ekranların turunu yeniden izleyin: hizmetler, projeler, veritabanları, araçlar ve Doctor.',
    asistenteAbrir: 'Turu izle',
    avanzadas: 'Gelişmiş bölümleri göster',
    avanzadasAyuda:
      'Kenar çubuğuna Kapsayıcılar gibi nadiren kullanılan ekranları ekler. Ctrl+K ile de erişilebilirler.',
  },
  paleta: {
    irAServicio: (nombre) => `${nombre} hizmetine git`,
    irAProyecto: (nombre) => `${nombre} projesine git`,
    versionesDe: (nombre) => `${nombre} sürümleri`,
    asistente: 'Karşılama turunu izle',
  },
  env: { bloques: { meilisearch: 'Meilisearch (anahtarıyla birlikte)' } },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Henüz veritabanı motoru yok',
      texto:
        'Projelerinizin veritabanlarını oluşturmak ve yönetmek için Hizmetler bölümünden MySQL, MariaDB, PostgreSQL veya MongoDB yükleyin.',
      accion: 'Hizmetlere git',
    },
    serviciosVacio: {
      titulo: 'Henüz yüklü hizmet yok',
      texto:
        'Hizmetler (Nginx, PHP, veritabanları…) sitelerinizi çalıştıran şeylerdir. Nginx ve PHP ile veya bir veritabanıyla başlayın.',
      accion: 'Hizmet yükle',
    },
    registrosSinFuentes: {
      titulo: 'Henüz günlük yok',
      texto:
        'Bir hizmet, site veya işlem ilk satırını yazar yazmaz günlükler görünür. Bir hizmeti açın ve geri dönün.',
      accion: 'Hizmetlere git',
    },
    registrosElegir: {
      titulo: 'Bir günlük seçin',
      texto: 'Satırlarını canlı izlemek için yukarıdaki seçiciden bir kaynak seçin.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Henüz döküm gelmedi',
      texto:
        'Bir site dump(), dd() veya wd() çalıştırdığında döküm burada anında görünür. Sitenizi açın ve o kodu çalıştırın.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Yakalama kapalı',
      texto:
        'Yakalama açıkken sitelerinizin dump() ve dd() çağrıları tarayıcıya dokunmadan buraya ulaşır. Açın ve bir site başlatın.',
      accion: 'Yakalamayı aç',
    },
    depuracionElegir: {
      titulo: 'Bir döküm seçin',
      texto: "İçeriğini, dosyasını ve kaynak URL'sini görmek için listeden bir döküm seçin.",
      accion: '',
    },
    erroresVacio: {
      titulo: 'Günlüklerde hata yok',
      texto:
        'PHP, Nginx ve proje hataları yazılır yazılmaz burada gruplanmış olarak görünür. Boş liste iyi haberdir.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Bir hata seçin',
      texto: 'İzini görmek ve dosyayı düzenleyicide açmak için listeden bir hata seçin.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Henüz denetim yapılmadı',
      texto:
        'Doctor bağlantı noktalarını, hosts dosyasını, sertifikaları ve sürümleri denetler ve başarısız olanın nasıl düzeltileceğini söyler. İlk denetimi çalıştırın.',
      accion: 'Şimdi denetle',
    },
    doctorSinHallazgos: {
      titulo: 'Her şey yolunda',
      texto: 'Son denetimde sorun bulunmadı. Bir şey yanıt vermeyi bırakırsa yeniden denetleyin.',
      accion: 'Yeniden denetle',
    },
    contenedoresVacio: {
      titulo: 'Kapsayıcı yok',
      texto:
        "Bu bilgisayardaki Docker veya Podman kapsayıcıları burada görünür. docker run veya docker compose ile bir tane oluşturun ve Yenile'ye basın.",
      accion: 'Yenile',
    },
    avisos: {
      titulo: 'Bildirim yok',
      texto:
        'Hizmet kesintileri, meşgul bağlantı noktaları ve süresi dolmak üzere olan sertifikalar burada görünecek.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Henüz anlık görüntü yok',
      texto:
        'Anlık görüntü, bir şeyler ters giderse geri dönebilmeniz için bu veritabanının durumunu kaydeder. İlkini yukarıdaki düğmeyle alın.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Bu sunucunun kendine ait veritabanı yok',
      texto: 'Projeniz için bir veritabanı oluşturun veya mevcut bir dökümü içe aktarın.',
      accion: 'Veritabanı oluştur',
    },
    iaNube: {
      titulo: 'Henüz yapay zekâ sağlayıcısı yok',
      texto:
        'Bir sağlayıcı (OpenAI, Anthropic, OpenRouter ve diğerleri) ajanlarınızın bulut modellerini kullanmasını sağlar. Anahtar bu bilgisayarda şifreli olarak saklanır.',
      accion: 'Sağlayıcı ekle',
    },
    iaSinModelos: {
      titulo: 'Henüz yerel model yok',
      texto: 'Çevrimdışı kullanmak için aşağıdaki listeden bir model indirin.',
      accion: '',
    },
    versiones: {
      titulo: 'Gösterilecek sürüm yok',
      texto: 'Liste resmî katalogdan indirilir. Bağlantınızı denetleyin ve listeyi yenileyin.',
      accion: 'Listeyi yenile',
    },
    buscar: {
      titulo: 'Eşleşme yok',
      texto:
        'Klasörde aramanızla eşleşen bir şey yok. Başka sözcükler deneyin, “Büyük/küçük harf” işaretini kaldırın veya dosya süzgeçlerini gözden geçirin.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Karşılama turu',
    saltar: 'Atla',
    terminar: 'Başla',
    cerrar: 'Turu kapat',
    reabrir: "Çıkmak için Esc'e basın. Ayarlar › Görünüm bölümünden yeniden izleyebilirsiniz.",
    ir: (destino) => `${destino} bölümüne git`,
    pasos: {
      bienvenida: {
        titulo: "WolfCore Dev'e hoş geldiniz",
        texto:
          "Yerel geliştirme ortamınız tek bir pencerede: hizmetler, HTTPS'li .test siteleri, veritabanları, e-posta ve araçlar. Bu tur bir dakika sürer ve bilgisayarınızda hiçbir şeyi değiştirmez.",
      },
      servicios: {
        titulo: 'Hizmetler',
        texto:
          'Nginx, PHP ve veritabanlarını buradan bir anahtarla açın. Henüz yüklü değillerse Sürümler sekmesi onları doğrulanmış bir sağlama toplamıyla indirir.',
      },
      proyectos: {
        titulo: 'Projeler',
        texto:
          "Yeni bir proje oluşturun veya bir klasörü ya da depoyu içe aktarın. Her site HTTPS'li kendi .test adresini alır.",
      },
      bases: {
        titulo: 'Veritabanları',
        texto:
          'Uygulamadan çıkmadan veritabanları oluşturun, dökümleri içe ve dışa aktarın, yedekleyin ve geri yükleyin.',
      },
      herramientas: {
        titulo: 'Araçlar ve Ctrl+K',
        texto:
          "Düzenleyici, arama, karşılaştırma, parolalar, görüntüler ve daha fazlası, bölümlere göre gruplanmış. İhtiyacınız olana atlamak için herhangi bir ekranda Ctrl+K'ye basın.",
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Bağlantı noktalarını, hosts dosyasını, sertifikaları ve sürümleri denetler ve başarısız olanın nasıl düzeltileceğini önerir. Bir şey yanıt vermediğinde açın.',
      },
      listo: {
        titulo: 'Hepsi hazır',
        texto:
          'Bir hizmeti açarak veya ilk projenizi oluşturarak başlayın. Bu turu Ayarlar › Görünüm bölümünden yeniden izleyebilirsiniz.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: { sustituida: (v) => `Artık katalogda yok: yerine ${v} yüklenecek.` },
      resultado: { sustituida: (v) => `Profildeki sürüm yerine ${v} yüklendi.` },
    },
    motivos: {
      version_sustituida:
        'Bu sürüm artık katalogda yok: aynı ikincil sürümün (örneğin 8.3) en yenisi yüklendi.',
    },
  },
  consultasLentas: {
    boton: 'Yavaş sorgular',
    titulo: (motor) => `${motor} üzerindeki yavaş sorgular`,
    descripcion: 'Seçtiğiniz süreden uzun süren sorgular, en yavaştan en hızlıya.',
    cargando: 'Yavaş sorgular yükleniyor…',
    estadoTitulo: 'Günlük durumu',
    estadoActivo: (s) => `Günlük kaydı açık: ${s} sn'yi aşan sorgular kaydedilir.`,
    estadoApagado: 'Günlük kaydı kapalı.',
    noGestionada:
      'WolfCore Dev bu sunucuyu yönetmiyor (örneğin başka bir programın başlattığı): burada yalnızca görüntüleyebilir, değiştiremezsiniz.',
    umbral: 'Şundan uzun süren sorguları kaydet (saniye)',
    activar: 'Günlük kaydını aç',
    aplicarUmbral: 'Süreyi değiştir',
    desactivar: 'Günlük kaydını kapat',
    actualizar: 'Günlüğü yeniden oku',
    confirmarTitulo: 'Yavaş sorgu günlüğünü değiştir',
    confirmarActivar: (motor, s) =>
      `Günlük kaydı tüm ${motor} sunucusu için açılacak (${s} sn'yi aşan sorgular) ve yapılandırmasına kaydedilecek. Tüm veritabanlarını etkiler.`,
    confirmarDesactivar: (motor) =>
      `Günlük kaydı tüm ${motor} sunucusu için kapatılacak ve yapılandırmasına kaydedilecek. Daha önce kaydedilenler saklanır.`,
    confirmarBoton: 'Değişikliği onayla',
    cancelar: 'İptal',
    activado: 'Yavaş sorgu günlüğü açıldı',
    desactivado: 'Yavaş sorgu günlüğü kapatıldı',
    privacidad:
      'SQL, değerleri “?” ile değiştirilmiş olarak gösterilir, çünkü gerçek müşteri verileri içerebilir. Bunların hiçbiri bu bilgisayardan çıkmaz veya uygulama günlüklerine yazılmaz.',
    columnas: {
      duracion: 'Süre',
      filas: 'İncelenen satırlar',
      base: 'Veritabanı',
      fecha: 'Tarih',
      sql: 'Sorgu',
      acciones: 'İşlemler',
    },
    sinBase: 'Atfedilmedi',
    verLiteral: 'Değişmezi göster',
    ocultarLiteral: 'Değişmezi gizle',
    literalAviso: 'SQL olduğu gibi, değerleriyle',
    sqlOculto: 'SQL gizli',
    sqlOcultoAyuda:
      'Bu sorgu gerçek verileri riske atmadan gösterilemez: bu sunucuda gerçek veri içeren veritabanları var veya sorgu güvenle bir veritabanına atfedilemiyor.',
    copiar: 'Kopyala',
    copiado: 'Sorgu kopyalandı',
    truncado: (n) => `Günlüğün sonundan (son 5 MB) en fazla ${n} en yavaş sorgu gösteriliyor.`,
    vacioTitulo: 'Henüz yavaş sorgu kaydedilmedi',
    vacioTextoApagado:
      'Günlük kaydını açın ve sitelerinizi kullanın: seçilen süreden uzun süren sorgular burada görünecek.',
    vacioTextoActivo:
      'Şimdiye kadar hiçbir sorgu seçilen süreyi aşmadı. Sitelerinizi kullanın ve günlüğü yeniden okuyun.',
  },
  esquemaBd: {
    boton: 'Şemayı görüntüle',
    titulo: (base) => `${base} şeması`,
    descripcion:
      'Salt okunur: tablolar, sütunlar, anahtarlar ve ilişkiler. Tablolarınızdaki hiçbir veri okunmaz.',
    cargando: 'Şema okunuyor…',
    error: 'Veritabanı şeması okunamadı.',
    reintentar: 'Yeniden dene',
    buscar: 'Bir tablo ara',
    tablas: (n) => plural(n, 'tablo', 'tablo'),
    vista: 'görünüm',
    truncado: (n) => `Liste ${n} tabloya kısaltıldı: veritabanında daha fazlası var.`,
    sinResultados: 'Aramayla eşleşen tablo yok.',
    elegir: 'Sütunlarını, anahtarlarını ve ilişkilerini görmek için listeden bir tablo seçin.',
    columnas: 'Sütunlar',
    indices: 'Dizinler',
    sinIndices: 'Bu tablonun dizini yok.',
    relaciones: 'İlişkiler',
    sinRelaciones: 'Bu tablonun diğerleriyle ilişkisi yok.',
    salientes: 'Başvurduğu',
    entrantes: 'Başvurulan',
    alBorrar: 'Silindiğinde:',
    alActualizar: 'Güncellendiğinde:',
    irA: (tabla) => `${tabla} tablosuna git`,
    col: {
      nombre: 'Sütun',
      tipo: 'Tür',
      nulo: 'Boş olabilir',
      defecto: 'Varsayılan',
      clave: 'Anahtar',
    },
    si: 'Evet',
    no: 'Hayır',
    pk: 'PK',
    unico: 'benzersiz',
    vacioTitulo: 'Bu veritabanında tablo yok',
    vacioTexto: 'Tablolar oluşturduğunuzda (örneğin proje geçişlerinizle) burada görünecek.',
  },
};
