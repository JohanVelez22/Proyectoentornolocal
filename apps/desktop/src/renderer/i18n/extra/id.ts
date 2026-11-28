import type { TextosParciales } from '../es';

const plural = (n: number, texto: string): string => `${n} ${texto}`;

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const idExtra: TextosParciales = {
  app: { lema: 'Lingkungan lokal Anda, siap dipakai' },
  resumenGlobal: {
    cortoApagado: 'Semua mati',
    cortoEncendidos: (n) => `${n} berjalan`,
    cortoErrores: (n) => plural(n, 'bermasalah'),
    cortoCargando: 'Menyambung…',
    cortoSinConexion: 'Luring',
    irAServicios: 'Buka Layanan',
  },
  acciones: { copiarCompleto: 'Salin seluruh teks' },
  errores: {
    codigos: {
      'asistentes.no_existe': 'Asisten itu tidak didukung.',
      'asistentes.no_instalado': '{asistente} belum terpasang.',
      'asistentes.no_compatible': '{asistente} belum dapat dihubungkan.',
      'asistentes.enlace_rechazado':
        '{archivo} adalah tautan (simbolis atau junction): tidak diubah.',
      'asistentes.vista_desfasada':
        'Berkas berubah setelah pratinjau. Mohon tinjau pratinjau sekali lagi.',
      'asistentes.sin_carpeta': 'Folder konfigurasi {asistente} tidak ada.',
      'discos.sin_lectura': 'Kesehatan disk tidak dapat dibaca. Silakan coba lagi.',
      'discos.sin_eventos': 'Peristiwa disk tidak dapat dibaca.',
      'discos.admin_cancelado': 'Izin administrator dibatalkan: tidak ada yang dibaca.',
      'discos.admin_fallo': 'Kesehatan disk tidak dapat dibaca dengan izin administrator.',
      'doctor.disco_atencion': 'Disk {modelo} perlu perhatian.',
      'doctor.disco_critico': 'Disk {modelo} dalam kondisi kritis: segera buat cadangan.',
      'servicios.no_encendio': '{nombre} gagal dijalankan. Periksa Layanan dan lognya.',
      'tuneles.sitio_no_confiable':
        '{dominio} belum dipercaya: centang «Saya percaya repositori ini» di proyek sebelum memublikasikannya.',
      'clientehttp.peticion_invalida': 'Data tidak valid dalam permintaan: {campo}.',
      'clientehttp.variable_sin_definir':
        'Variabel “{nombre}” tidak didefinisikan di lingkungan aktif.',
      'clientehttp.secreto_faltante':
        'Nilai rahasia yang tersimpan hilang: ketik ulang dan simpan permintaan atau lingkungannya.',
      'clientehttp.secreto_no_guardado':
        'Nilai rahasia tidak dapat disimpan: tidak boleh berisi pemisah baris atau melebihi 16 KB, dan enkripsi sistem harus tersedia.',
      'clientehttp.url_invalida': 'URL tidak valid.',
      'clientehttp.url_con_credenciales':
        'URL tidak boleh memuat pengguna atau kata sandi: gunakan tab autentikasi.',
      'clientehttp.protocolo': 'Hanya URL http:// dan https:// yang diterima.',
      'clientehttp.cabecera_invalida': 'Header “{nombre}” tidak valid.',
      'clientehttp.cuerpo_grande': 'Isi permintaan lebih besar dari 1 MB.',
      'clientehttp.plazo': 'Permintaan melewati batas waktu {segundos} dtk.',
      'clientehttp.cancelado': 'Permintaan dibatalkan.',
      'clientehttp.sin_conexion':
        'Tidak dapat tersambung ({motivo}). Periksa alamat, port, dan apakah server berjalan.',
      'clientehttp.certificado': 'Sertifikat server tidak dapat diverifikasi ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Lebih dari {max} pengalihan berturut-turut.',
      'clientehttp.curl_invalido': 'Teks ini bukan perintah curl yang valid.',
      'clientehttp.curl_grande': 'Teks curl terlalu besar (maksimal 64 KB).',
      'clientehttp.no_existe': 'Item tidak ada lagi.',
      'clientehttp.limite': 'Batas jumlah item tersimpan telah tercapai.',
      'ejemplohttp.no_arranca': 'Server contoh tidak dapat dijalankan.',
      'laboratoriogit.sin_git': 'Git tidak terpasang di komputer ini.',
      'laboratoriogit.orden_invalida': 'Perintah itu tidak ada dalam daftar lab.',
      'laboratoriogit.nombre_invalido':
        'Nama hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah (maksimal 30 karakter).',
      'laboratoriogit.mensaje_invalido':
        'Pesan harus satu baris, maksimal 200 karakter, dan tidak diawali “-”.',
      'laboratoriogit.archivo_invalido': 'Berkas itu bukan salah satu berkas latihan.',
      'laboratoriogit.contenido_invalido': 'Isi harus berupa teks maksimal 2000 karakter.',
      'laboratoriogit.ruta_insegura': 'Folder lab bukan folder yang diharapkan, jadi dibiarkan.',
      'laboratoriogit.fallo_sistema':
        'Sistem tidak mengizinkan folder lab disiapkan atau digunakan. Coba «Reset lab».',
      'buscar.ruta_vetada': 'Folder itu berisi data WolfCore Dev: tidak ditelusuri.',
      'buscar.resultado_caducado': 'Hasil itu tidak tersedia lagi: cari ulang.',
      'buscar.resultado_invalido': 'Hasil itu tidak dapat dibuka.',
      'diff.raiz_invalida': 'Pilih dua folder yang ada dan bukan tautan.',
      'diff.ruta_vetada': 'Folder itu berisi data WolfCore Dev: tidak dibandingkan.',
      'diff.cancelado': 'Perbandingan dibatalkan.',
      'diff.plazo': 'Perbandingan memakan waktu lebih dari {segundos} dtk dan dibatalkan.',
      'diff.memoria':
        'Perbandingan membutuhkan terlalu banyak memori (lebih dari {maximo}) dan dibatalkan.',
      'diff.ocupado': 'Sebuah perbandingan sedang berjalan: batalkan atau tunggu.',
      'diff.caducado': 'Perbandingan itu tidak tersedia lagi: bandingkan ulang.',
      'diff.archivo_invalido': 'Berkas itu tidak dapat dibandingkan lagi: berubah atau hilang.',
      'diff.fallo': 'Perbandingan gagal.',
      'red.sin_confirmar': 'Konfirmasikan tindakan di dialog sebelum melanjutkan.',
      'red.rango_no_permitido':
        'Hanya jaringan pribadi (10.x, 172.16 hingga 172.31, dan 192.168.x) dengan paling banyak 254 perangkat yang dijelajahi.',
      'red.sin_adaptador': 'Tidak ada jaringan aktif untuk dijelajahi.',
      'red.red_publica': 'Di jaringan publik, perangkat lain tidak dijelajahi.',
      'red.perfil_desconocido':
        'Tidak dapat memeriksa apakah jaringan ini pribadi atau publik, sehingga perangkat lain tidak dijelajahi.',
      'red.ocupado': 'Operasi Jaringan saya yang lain sedang berjalan: tunggu hingga selesai.',
      'red.equipo_no_valido': 'Hanya alamat IPv4 pribadi dari jaringan lokal yang diterima.',
      'red.equipo_desconocido': 'Perangkat itu tidak ada dalam daftar: baca jaringan lagi.',
      'red.recurso_no_valido': 'Sumber daya itu tidak ada dalam daftar perangkat.',
      'red.carpeta_no_valida': 'Folder bersama itu tidak dapat dihapus dari sini.',
      'red.lectura_fallo': 'Jaringan komputer ini tidak dapat dibaca.',
      'red.quitar_fallo': 'Berbagi folder tidak dapat dihentikan.',
      'red.velocidad_fallo': 'Kecepatan tidak dapat diukur: periksa koneksi.',
      'compartir.confirmacion_requerida':
        'Berbagi di internet harus dikonfirmasi di jendela WolfCore Dev.',
      'compartir.ocupado': 'Sesuatu sedang dibagikan: hentikan dulu pembagiannya.',
      'compartir.ruta_invalida': 'Pilih folder atau berkas yang ada.',
      'compartir.duracion_invalida': 'Pilih 15 menit, 1 jam, atau 4 jam.',
      'compartir.proveedor_invalido':
        'Terowongan itu tidak didukung: gunakan Cloudflare atau ngrok.',
      'compartir.raiz_unidad': 'Akar drive tidak dibagikan. Pilih folder di dalamnya.',
      'compartir.carpeta_usuario':
        'Seluruh folder pribadi (atau folder yang memuatnya) tidak dibagikan. Pilih subfolder.',
      'compartir.carpeta_datos': 'Folder data WolfCore Dev tidak dibagikan.',
      'compartir.sitio_datos_reales':
        'Situs dengan data nyata (atau apa pun di dalamnya) tidak dibagikan.',
      'compartir.carpeta_secretos':
        'Folder itu berisi kunci (.ssh, .aws, .git…) dan tidak dibagikan.',
      'compartir.carpeta_sistema': 'Folder sistem tidak dibagikan.',
      'compartir.archivo_sensible':
        'Berkas itu tampaknya berisi rahasia atau data nyata dan tidak dibagikan.',
      'compartir.carpeta_perfil':
        'Data program milik pengguna (AppData, .claude, .config…) tidak dibagikan.',
      'compartir.archivo_grande':
        'Berkas itu terlalu besar untuk diperiksa dan bukan berkas media atau paket: tidak dibagikan.',
      'compartir.tunel_sin_url':
        'Terowongan tidak memberikan alamatnya dalam {segundos} dtk. Coba lagi.',
      'compartir.tunel_cerrado': 'Terowongan tertutup sebelum selesai dibuka.',
      'compartir.fallo': 'Tidak dapat dibagikan.',
      'disco.raiz_invalida': 'Pilih folder atau drive yang ada dan dapat dibaca.',
      'disco.cancelado': 'Analisis dibatalkan.',
      'info.ruta_invalida': 'Jalur tidak valid: harus absolut dan lokal.',
      'info.no_existe': 'File atau folder tidak ada.',
      'info.sin_ruta':
        'Item ini bukan file di disk (misalnya lampiran atau sesuatu di dalam zip): simpan dahulu ke sebuah folder.',
      'info.enlace': 'Ini adalah tautan: silakan pilih file atau folder tujuannya.',
      'info.hash_grande': 'Ukuran file melebihi {maximo} MB: hash tidak dihitung.',
      'disco.plazo': 'Analisis memakan waktu lebih dari {minutos} menit dan dibatalkan.',
      'disco.memoria': 'Analisis membutuhkan terlalu banyak memori (lebih dari {maximo}).',
      'disco.ocupado': 'Sebuah analisis sedang berjalan: batalkan atau tunggu.',
      'disco.caducado': 'Analisis itu tidak tersedia lagi: analisis ulang.',
      'disco.entrada_invalida': 'Folder itu sudah tidak ada atau berubah: analisis ulang.',
      'disco.fallo': 'Analisis gagal.',
      'reverb.no_laravel': 'Reverb hanya tersedia di proyek Laravel.',
      'reverb.no_confiado':
        'Centang “Saya percaya repositori ini” pada proyek untuk menyalakan Reverb.',
      'reverb.sin_paquete':
        'Paket laravel/reverb tidak ada: pasang dengan composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Konfirmasikan bahwa Anda ingin menyalakan Reverb.',
      'reverb.sin_activar': 'Nyalakan Reverb di proyek terlebih dahulu.',
      'env.meilisearch_no_disponible': 'Meilisearch belum terpasang: pasang di Layanan.',
      'bd.lentas_confirmar':
        'Mengubah pencatatan kueri lambat memengaruhi seluruh server: harus dikonfirmasi. Tidak ada yang diubah.',
      'bd.lentas_umbral_invalido': 'Waktu harus antara 0,1 dan 60 detik.',
      'bd.lentas_motor_no_soportado':
        'Kueri lambat hanya dapat diubah pada MySQL, MariaDB, dan PostgreSQL yang dikelola WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        'SQL tidak ditampilkan beserta nilainya: basis data berisi data nyata atau kueri tidak dapat dikaitkan dengan basis data yang dikenal.',
      'bd.lentas_entrada_no_existe': 'Kueri itu tidak ada lagi di log. Baca ulang.',
      'bd.lentas_fallo':
        'Log kueri lambat tidak dapat dibaca atau diubah. Periksa apakah server berjalan.',
      'bd.esquema_base_no_existe': 'Basis data itu tidak ada di server tersebut.',
      'bd.esquema_motor_no_soportado':
        'Penampil skema ditujukan untuk MySQL, MariaDB, dan PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Skema basis data tidak dapat dibaca. Periksa apakah server berjalan.',
      'captura.atajo_invalido':
        'Pintasan itu tidak valid: gunakan Ctrl, Alt, Shift, atau Super dengan huruf, angka, atau tombol F.',
      'captura.atajo_no_permitido':
        'Pintasan itu tidak diizinkan: gunakan Ctrl atau Super dengan pengubah lain (Ctrl+Alt tanpa Shift adalah AltGr dan mengganggu pengetikan @) dan hindari pintasan umum seperti Ctrl+C atau Alt+F4.',
      'captura.atajo_ocupado': 'Pintasan {atajo} sudah dipakai program lain.',
      'captura.no_disponible': 'Tangkapan layar tidak tersedia di komputer ini.',
      'captura.permiso_denegado': 'Izin perekaman layar belum diberikan.',
      'captura.sin_imagen': 'Tidak ada gambar untuk ditangkap.',
      'captura.imagen_invalida': 'Gambar tangkapan tidak valid.',
      'disco.sin_confirmar': 'Konfirmasikan pembersihan di dialog sebelum melanjutkan.',
      'disco.categoria_invalida': 'Kategori pembersihan itu tidak ada.',
      'disco.ruta_vetada':
        'Kategori menyentuh jalur yang dilindungi (data, cadangan, proyek, atau FlyEnv); tidak ada yang dibersihkan.',
      'disco.sin_analisis':
        'Analisis ulang sebelum membersihkan: analisis kedaluwarsa atau tidak ada.',
      'disco.ocupada': 'Sebuah analisis atau pembersihan sedang berjalan.',
      'disco.sin_registro': 'Log pembersihan tidak dapat dibuat; tidak ada yang dihapus.',
      'editor.sin_confirmar': 'Konfirmasikan penyimpanan sebelum melanjutkan.',
      'editor.confirmacion_reforzada':
        'Berkas ini tampaknya berisi rahasia atau milik situs dengan data nyata: konfirmasikan dengan pemeriksaan tambahan untuk menyimpannya.',
      'editor.ruta_invalida': 'Jalur berkas tidak valid.',
      'editor.no_existe': 'Berkas tidak ada.',
      'editor.no_regular': 'Hanya berkas biasa yang dapat diedit.',
      'editor.ruta_vetada':
        'Berkas itu berada di dalam folder data WolfCore Dev: tidak dapat dibuka atau disimpan dari editor.',
      'editor.archivo_env': 'Berkas .env dikelola dari variabel proyek, bukan dari editor.',
      'editor.demasiado_grande': 'Berkas terlalu besar untuk editor (maksimal {maximo}).',
      'editor.binario': 'Berkas bukan teks (biner): tidak dapat diedit di sini.',
      'editor.codificacion': 'Berkas bukan UTF-8: editor tidak membukanya agar tidak merusaknya.',
      'editor.no_abierto': 'Berkas itu tidak dibuka di editor (atau versinya berubah): buka ulang.',
      'editor.eol_mixto': 'Berkas mencampur akhir baris: konfirmasikan penormalan untuk menyimpan.',
      'editor.contenido_invalido': 'Isi bukan teks yang valid.',
      'editor.huella_invalida': 'Sidik jari berkas yang terbuka hilang: buka ulang.',
      'editor.archivo_cambiado':
        'Berkas berubah di luar editor sejak dibuka. Muat ulang atau konfirmasikan penimpaan.',
      'editor.copia_fallo':
        'Salinan cadangan tidak dapat dibuat ({codigo}); tidak ada yang disimpan.',
      'editor.lectura_fallo': 'Berkas tidak dapat dibaca ({codigo}).',
      'editor.escritura_fallo':
        'Berkas tidak dapat disimpan ({codigo}). Berkas asli tidak disentuh.',
      'memoria.sin_confirmar': 'Konfirmasikan tindakan di dialog sebelum melanjutkan.',
      'memoria.modo_invalido': 'Mode optimasi itu tidak ada.',
      'memoria.plan_caducado':
        'Daftar kedaluwarsa atau bukan lagi yang terkini. Tampilkan ulang sebelum menerapkan.',
      'memoria.no_disponible':
        'Pengoptimal memori tidak tersedia di sini atau tidak dapat membaca sistem.',
      'conversor.ocupado':
        'Sebuah konversi sedang berjalan dan satu lagi menunggu: tunggu hingga selesai.',
      'doctor.firewall_reglas_acotadas':
        'Ada {cantidad} aturan untuk program WolfCore Dev yang dibatasi ke jaringan lokal (hanya profil pribadi, subnet lokal, dan port tertentu), seperti yang direkomendasikan aplikasi sendiri untuk berbagi situs. Aturan ini hanya ditampilkan: tidak dihapus dari sini.',
      'doctor.firewall_almacen_inseguro':
        'Salinan aturan yang dilindungi tidak dapat dipercaya (izin atau isinya berbeda dari yang ditampilkan): tidak ada aturan yang dibuat atau diubah.',
      'doctor.firewall_quitadas':
        'WolfCore Dev sebelumnya menghapus {cantidad} aturan firewall dan menyimpan salinannya: Anda dapat membuatnya kembali jika perlu.',
      'doctor.firewall_parcial':
        'Beberapa aturan dihapus, tetapi yang lain tidak: berubah sejak daftar ditampilkan, bukan milik WolfCore Dev, atau Windows tidak mengizinkannya dihapus. Periksa daftarnya.',
      'doctor.firewall_sin_cambios':
        'Tidak ada aturan yang diubah: tidak lagi sesuai dengan yang ditampilkan, atau tidak dapat diubah.',
      'doctor.firewall_registro_fallido':
        'Salinan aturan tidak dapat disimpan ke kunci registri terlindungi HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos: tidak ada yang diubah.',
      'catalogo.paquete_invalido':
        'Paket yang diunduh tidak aman (jalur di luar folder, tautan, atau ukuran berlebihan).',
      'catalogo.extraccion_fallo': 'Paket .7z yang diunduh tidak dapat dibaca atau diekstrak.',
      'runtimes.falta_runtime': '{nombre} belum terpasang untuk proyek ini: pasang dari Layanan.',
      'runtimes.falta_jdk': 'Tidak ada JDK terpasang untuk proyek ini: pasang Java dari Layanan.',
      'runtimes.instalacion_incompleta':
        'Pemasangan {nombre} tidak lengkap: pasang ulang dari Layanan.',
      'procesos.escucha_publica':
        'Proses mendengarkan di {direccion}:{puerto} ({programa}), terbuka ke jaringan. Proses dihentikan: hanya boleh mendengarkan di 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'Proses mendengarkan di {direccion}:{puerto} ({programa}), terbuka ke jaringan. Proses dihentikan: hanya boleh mendengarkan di 127.0.0.1. Ini adalah LiveReload Spring DevTools: matikan dengan spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'Proses mendengarkan di {direccion}:{puerto} ({programa}), terbuka ke jaringan. Proses dihentikan: hanya boleh mendengarkan di 127.0.0.1. Ini adalah inspektur Node: gunakan --inspect=127.0.0.1.',
    },
  },
  inicio: {
    servicios: { irA: (nombre) => `Buka layanan ${nombre}` },
    tuneles: { irA: (nombre) => `Buka proyek ${nombre}` },
  },
  servicios: {
    sinParaEncender: 'Tidak ada layanan terpasang untuk dinyalakan',
    franjaExternos: {
      texto: 'Anda belum memasang server web atau PHP. Mesin eksternal terdeteksi secara otomatis.',
      accion: 'Pasang Nginx dan PHP',
    },
    externos: {
      titulo: 'Terdeteksi di komputer Anda',
      ayuda: 'Program lain yang mengelolanya; WolfCore Dev hanya menampilkannya.',
    },
    borrarDatos: { que: { meilisearch: 'semua indeks Meilisearch' } },
    ftp: {
      redLocalAyuda:
        'Saat mati, hanya komputer ini yang dapat tersambung (127.0.0.1). Setiap proyek mengaktifkan aksesnya di Proyek.',
      compartir: {
        enlace: 'Bagikan folder atau berkas…',
        ayuda:
          'FTP tidak dibagikan melalui terowongan: tidak terenkripsi dan terowongan hanya membawa HTTP. Untuk memublikasikan sesuatu di internet gunakan “Bagikan folder atau berkas” (HTTP, hanya baca); FTP tetap di jaringan lokal.',
      },
    },
    datosConexion: 'Detail koneksi',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Koneksi ke Meilisearch',
      notaMeilisearch:
        'Untuk memakainya di proyek: Variabel (.env) → Tambah blok → Meilisearch. Pratinjau dengan kunci tersamarkan ditampilkan dan konfirmasi diperlukan. Kunci ini hanya milik komputer ini.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Pencarian untuk Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (port lokal)',
      springboot: 'Spring Boot (port lokal)',
      aspnet: 'ASP.NET Core (port lokal)',
    },
    tiposCortos: { rails: 'Rails', springboot: 'Spring Boot', aspnet: 'ASP.NET' },
  },
  tunel: {
    sinConfianza:
      'Proyek ini tidak dipercaya: centang «Saya percaya repositori ini» agar dapat dipublikasikan.',
  },
  tuneles: {
    irAProyectos: 'Buka Proyek',
    compartir: {
      enlace: 'Bagikan folder atau berkas…',
      ayuda: 'Memublikasikan folder atau satu berkas (hanya baca), tanpa memerlukan situs.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Proses Reverb proyek ini tidak memiliki perintah WolfCore Dev (host, program, atau port lain). Menyalakannya menggantinya dengan yang standar, yang hanya mendengarkan di 127.0.0.1.',
    ayuda: 'Laravel WebSockets, hanya di 127.0.0.1.',
    puerto: (p) => 'Port {p}'.replace('{p}', String(p)),
    interruptor: (dominio) => 'Nyalakan atau matikan Reverb untuk {d}'.replace('{d}', dominio),
    activarTitulo: 'Nyalakan Reverb?',
    activarTexto: (dominio) =>
      '“php artisan reverb:start” akan berjalan di {d}, mendengarkan hanya di 127.0.0.1 pada port yang bebas. Kode proyek berjalan dengan PHP-nya sendiri.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Matikan Reverb?',
    desactivarTexto:
      'Proses dihentikan dan dihapus dari proyek. Variabel REVERB_* di .env tidak disentuh.',
    activar: 'Nyalakan',
    desactivar: 'Matikan',
    proponer: 'Sarankan variabel REVERB_*',
    tituloError: 'Reverb',
    estados: { apagado: 'Berhenti', iniciando: 'Memulai', encendido: 'Berjalan', error: 'Gagal' },
  },
  ftpSitio: {
    compartirNota:
      'FTP hanya untuk jaringan lokal: tidak dibagikan melalui terowongan internet karena mengirim kata sandi dan berkas tanpa enkripsi.',
    compartirIr: 'Bagikan folder atau berkas dengan tautan sementara',
  },
  ia: { pestanas: { etiqueta: 'Bagian AI', agentes: 'Agen', nube: 'Cloud', local: 'Model lokal' } },
  iaLocal: {
    compat: {
      sugerenciaVram: 'Untuk komputer Anda: model hingga ≈{b}B, yang muat di memori kartu grafis.',
      sugerenciaRam: 'Untuk komputer Anda: model hingga ≈{b}B, yang berjalan di RAM.',
      sugerenciaPequena: 'Untuk komputer Anda: hanya model yang sangat kecil (di bawah 1B).',
      sugerenciaDesconocida:
        'Perangkat keras komputer Anda tidak dapat dibaca, sehingga tidak ada rekomendasi.',
      aviso: 'Ini hanya panduan: Anda dapat mengunduh model apa pun.',
      comprobando: 'Memeriksa komputer Anda…',
      niveles: {
        recomendado: 'Disarankan',
        lento: 'Mungkin lambat',
        'no-cabe': 'Tidak muat',
        desconocido: 'Tidak ada data',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Muat dengan lega di memori kartu grafis (butuh ≈{necesario} dari {disponible}).',
        'justo-vram':
          'Muat di kartu grafis, tetapi pas-pasan (butuh ≈{necesario} dari {disponible}).',
        'solo-ram':
          'Tidak muat di kartu grafis dan akan berjalan di RAM (butuh ≈{necesario} dari {disponible} yang dapat dipakai): lebih lambat.',
        'cabe-ram':
          'Muat dengan lega di RAM (butuh ≈{necesario} dari {disponible} yang dapat dipakai).',
        'ram-justo':
          'Muat di RAM, tetapi pas-pasan (butuh ≈{necesario} dari {disponible} yang dapat dipakai): mungkin lambat.',
        'sin-memoria': 'Butuh memori ≈{necesario}, sedangkan komputer Anda memiliki ≈{disponible}.',
        'sin-disco': 'Ruang kosong di disk tidak cukup untuk mengunduhnya (tersisa {disponible}).',
        'tamano-desconocido':
          'Ukuran model tidak dapat diperiksa (tidak ada koneksi ke registri Ollama).',
        'equipo-desconocido': 'Memori komputer Anda tidak dapat dibaca.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'Anda dapat membatalkan unduhan kapan saja; bagian yang sudah diunduh akan dibuang.',
      tamano: (t) => `Ukuran unduhan: ${t}.`,
      tamanoDesconocido:
        'Ukuran tidak dapat diperiksa (tidak ada koneksi ke registri Ollama). Model biasanya berukuran 1 hingga lebih dari 40 GB.',
      libre: (l) => `Ruang kosong di disk model: ${l}.`,
      libreDesconocido: 'Ruang disk yang kosong tidak dapat diukur.',
      sinEspacio: (t, l) =>
        `Ruang tidak cukup: model membutuhkan ${t} dan hanya ${l} yang kosong. Kosongkan sebagian ruang atau pilih model yang lebih kecil.`,
    },
  },
  proyectos: {
    asistente: { ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    tarjeta: { verEnBases: 'Lihat di Basis data' },
  },
  panel: {
    insignias: { memoriaAlta: 'Memori tinggi' },
    discos: {
      titulo: 'Ruang disk',
      leyendo: 'Membaca disk…',
      sistema: 'Sistem',
      datos: 'Data WolfCore',
      ambos: 'Sistem dan data WolfCore',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} kosong (${pct} %)`,
      poco: 'Ruang kosong sedikit',
      casiLleno: 'Ruang hampir habis',
      liberar: 'Kosongkan ruang',
      versiones: 'Bersihkan versi yang tidak terpakai',
      temporales: 'Bersihkan berkas sementara dan cache WolfCore',
      ocupaMas: 'Lihat apa yang paling banyak memakan ruang',
    },
    alertas: {
      grupo: (n) => `Masalah ditemukan (${n})`,
      verTodos: (n) => `Tampilkan semua ${n}`,
      verMenos: 'Tampilkan lebih sedikit',
      masAcciones: 'Tindakan lainnya',
    },
    procesos: { resto: 'Layanan lainnya' },
  },
  captura: {
    barra: 'Alat gambar',
    herramientas: {
      recuadro: 'Kotak',
      flecha: 'Panah',
      linea: 'Garis',
      resaltador: 'Stabilo',
      texto: 'Teks',
      pixelar: 'Pikselasi',
      pixelarAyuda: 'Pikselasi (tidak aman untuk data sensitif: gunakan Sembunyikan)',
      ocultar: 'Sembunyikan',
      ocultarAyuda: 'Sembunyikan dengan isian solid (disarankan untuk data sensitif)',
    },
    deshacer: 'Urungkan',
    rehacer: 'Ulangi',
    copiar: 'Salin',
    copiarAyuda:
      'Salin ke papan klip. Papan klip Windows dapat menyimpannya dalam riwayatnya atau menyinkronkannya ke perangkat lain.',
    guardar: 'Simpan…',
    alConversor: 'Kirim ke pengonversi gambar',
    cerrar: 'Batal (Esc)',
    nuevaSeleccion: 'Pilihan baru',
    color: 'Warna',
    grosor: 'Ketebalan',
    formato: 'Format',
    cargando: 'Menyiapkan tangkapan…',
    guiaRegion: 'Seret untuk memilih area. Esc membatalkan.',
    guiaVentana: 'Pilih jendela yang ingin Anda tangkap. Esc membatalkan.',
    sinVentanas: 'Tidak ada jendela yang dapat ditangkap.',
    textoPlaceholder: 'Ketik lalu tekan Enter',
    copiada: 'Disalin ke papan klip',
    guardada: (archivo) => `Disimpan ke ${archivo}`,
    errorCargar: 'Tangkapan tidak dapat dibuka.',
    errorCopiar: 'Gambar tidak dapat disalin.',
    errorGuardar: 'Gambar tidak dapat disimpan.',
    errorConversor: 'Gambar tidak dapat dikirim ke pengonversi.',
    errorVentana: 'Jendela itu tidak dapat ditangkap.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Semuanya terjadi di komputer ini: tangkapan tidak diunggah ke layanan mana pun dan tidak disimpan ke disk sampai Anda menyimpannya. Jendela WolfCore Dev disembunyikan sesaat agar tidak muncul di gambar.',
      region: 'Wilayah',
      regionAyuda: 'Seret di layar untuk memilih area.',
      ventana: 'Jendela',
      ventanaAyuda: 'Pilih salah satu jendela yang terbuka.',
      pantalla: 'Layar penuh',
      pantallaAyuda: 'Layar tempat kursor berada.',
      atajoActivo: (atajo) => `Pintasan global aktif: ${atajo} (wilayah).`,
      atajoInactivo: 'Tidak ada pintasan global. Nyalakan di Pengaturan.',
      noDisponible: 'Tangkapan layar tidak tersedia di komputer ini.',
      permisoDenegado:
        'Izin perekaman layar belum diberikan. Aktifkan untuk WolfCore Dev di pengaturan sistem.',
      ocupada: 'Sebuah tangkapan sedang berlangsung.',
    },
    ajustes: {
      titulo: 'Tangkapan layar',
      descripcion:
        'Wilayah, jendela, atau layar penuh dengan editor cepat. 100% lokal: tidak ada yang diunggah atau disimpan sampai Anda memutuskan.',
      activar: 'Pintasan global',
      activarAyuda:
        'Mati secara bawaan. Saat dinyalakan, pintasan hanya didaftarkan jika tidak dipakai program lain, dan dilepas saat WolfCore Dev ditutup.',
      atajo: 'Kombinasi',
      grabar: 'Ubah',
      grabando: 'Tekan kombinasinya…',
      grabandoAyuda:
        'Gunakan Ctrl atau Super dengan pengubah lain (misalnya Ctrl+Alt+Shift) dan huruf, angka, atau tombol F. Hindari pintasan umum seperti Ctrl+C.',
      formato: 'Format saat menyimpan',
      activado: (atajo) => `Pintasan ${atajo} dinyalakan.`,
      desactivado: 'Pintasan dimatikan.',
      ocupado: (atajo) =>
        `Pintasan ${atajo} sudah dipakai program lain dan tidak ada yang diubah. Coba kombinasi lain.`,
      ocupadoInicio:
        'Pintasan yang tersimpan sudah dipakai program lain dan tidak didaftarkan. Pilih kombinasi lain.',
      sinPermiso:
        'Di macOS izin perekaman layar diperlukan; Anda akan ditanya saat pertama kali menangkap.',
      formatoGuardado: 'Format disimpan.',
    },
  },
  ajustes: {
    avisos: {
      tipos: {
        'salud-disco': 'Peringatan kesehatan disk',
      },
    },
  },
  avisos: {
    hacerRespaldo: 'Buat cadangan sekarang',
  },
  herramientas: {
    entorno: {
      discos: {
        titulo: 'Kesehatan disk',
        intro:
          'Kondisi setiap disk menurut Windows, tanpa memasang apa pun. Hanya baca: tidak ada yang diubah pada disk.',
        actualizar: 'Muat ulang',
        leerAdmin: 'Baca dengan izin administrator',
        leerAdminAyuda:
          'Windows akan meminta izin Anda (UAC) hanya saat Anda menekan tombol ini. Tombol ini hanya membaca data dan tidak pernah berjalan sendiri.',
        sinDiscos: 'Windows tidak melaporkan disk fisik apa pun.',
        numeroDisco: 'Disk {n}',
        unidades: 'Drive: {u}',
        sinUnidades: 'Tanpa huruf drive',
        datosWolf: 'Data WolfCore Dev',
        proyectos: 'Proyek',
        tipoDesconocido: 'Jenis tidak dilaporkan',
        veredictos: {
          bien: 'Baik',
          atencion: 'Perlu perhatian',
          critico: 'Kritis',
          no_disponible: 'Tidak tersedia',
        },
        motivos: {
          estado_warning: 'Windows melaporkan status “Warning” (peringatan).',
          estado_unhealthy: 'Windows melaporkan status “Unhealthy” (bermasalah).',
          estado_operacional: 'Status operasional menunjukkan adanya kegagalan ({estado}).',
          errores_sin_corregir:
            'Ada galat yang belum dikoreksi (baca: {lectura}, tulis: {escritura}).',
          prediccion_fallo: 'Disk memprediksi akan gagal (SMART).',
          desgaste: 'Keausan {desgaste}% (ambang: {umbral}%).',
          temperatura: 'Suhu {temperatura} °C (batas: {limite} °C).',
          errores_corregidos_suben:
            'Galat baca yang dikoreksi meningkat dibandingkan pembacaan sebelumnya (total {cantidad}).',
        },
        contadores: {
          temperatura: 'Suhu',
          desgaste: 'Keausan',
          lecturaCorregidos: 'Galat baca yang dikoreksi',
          lecturaNoCorregidos: 'Galat baca yang belum dikoreksi',
          escrituraCorregidos: 'Galat tulis yang dikoreksi',
          escrituraNoCorregidos: 'Galat tulis yang belum dikoreksi',
          horas: 'Jam menyala',
          prediccion: 'Prediksi kegagalan',
        },
        noDisponible: 'Tidak tersedia',
        noDisponibleMotivo: 'Tidak tersedia ({motivo})',
        motivoSin: {
          admin: 'memerlukan izin administrator',
          bus: 'jenis koneksi ini (USB atau RAID) tidak menyediakan penghitung',
          no_soportado: 'disk atau pengendalinya tidak mendukungnya',
          no_leidos: 'Windows tidak mengembalikan nilai',
        },
        prediccionSin: {
          sin_acceso: 'memerlukan izin administrator',
          no_disponible: 'komputer ini tidak menyediakannya',
        },
        prediccionSinFallo: 'Tidak ada kegagalan yang diperkirakan',
        prediccionFallo: 'Kegagalan diperkirakan',
        bienSoloEstado: 'Baik (hanya status yang dilaporkan Windows)',
        noAplicaHdd: 'Tidak berlaku (HDD)',
        ultimoDatoAdmin: 'Data terakhir dengan izin administrator: {fecha}',
        ultimoDatoContadores: 'Data terakhir dari penghitung: {fecha}',
        horasValor: '{n} jam',
        criterios: {
          titulo: 'Bagaimana penilaian ditentukan?',
          critico:
            'Kritis: Windows melaporkan status Warning atau Unhealthy atau kegagalan operasional, ada galat yang belum dikoreksi, atau disk memprediksi kegagalan.',
          atencion:
            'Perlu perhatian: keausan {desgaste}% atau lebih, suhu di atas batas maksimum pabrikan (jika tidak ada, {ssd} °C atau lebih pada SSD dan NVMe, {hdd} °C atau lebih pada HDD), atau galat baca yang dikoreksi meningkat dibandingkan pembacaan sebelumnya.',
          bien: 'Baik: status Healthy dan tidak ada hal di atas.',
          noDisponible:
            'Tidak tersedia: Windows tidak memberikan data yang cukup tentang disk tersebut.',
        },
        leidoAdmin: 'Data dibaca dengan izin administrator.',
        requiereAdminAviso:
          'Sebagian data memerlukan izin administrator. Anda dapat membacanya dengan tombol di atas: Windows baru akan meminta izin Anda saat itu.',
        nota: 'Pembacaan ini hanya panduan, bukan jaminan: tanda yang baik tidak mencegah kegagalan. Simpan cadangan untuk data yang penting.',
        privacidad: 'Nomor seri dan pengenal unik tidak dibaca maupun ditampilkan.',
      },
      eventosDisco: {
        titulo: 'Peristiwa disk',
        intro: 'Catatan log System Windows tentang disk dalam {dias} hari terakhir. Hanya baca.',
        actualizar: 'Muat ulang peristiwa',
        copiar: 'Salin peristiwa',
        copiado: 'Peristiwa disalin',
        vacio: 'Tidak ada peristiwa disk dalam {dias} hari terakhir.',
        sinDisco: 'Disk tidak disebutkan',
        disco: 'Disk {n}',
        unidad: 'Drive {u}',
        gravedad: {
          info: 'Informasi',
          aviso: 'Peringatan',
          critico: 'Kritis',
        },
        explicaciones: {
          disco_7: 'Disk memiliki blok yang rusak.',
          disco_11: 'Pengendali mendeteksi galat pada disk.',
          disco_51: 'Terjadi galat pada disk saat operasi paging.',
          disco_52: 'Disk memprediksi bahwa ia akan gagal.',
          disco_55: 'Kerusakan terdeteksi pada sistem berkas sebuah drive.',
          disco_129: 'Windows harus mengatur ulang pengendali disk karena tidak merespons.',
          disco_98: 'Windows memeriksa volume dan kondisinya baik.',
          disco_140: 'Sistem tidak dapat menulis data ke log transaksi volume; data dapat rusak.',
          disco_153: 'Sebuah operasi disk gagal dan dicoba ulang.',
          disco_157: 'Disk terlepas secara tak terduga.',
        },
        tope: 'Paling banyak {n} peristiwa ditampilkan.',
        cabeceraCopia: 'Peristiwa disk ({dias} hari terakhir)',
      },
      equipo: {
        titulo: 'Komputer saya',
        copiarResumen: 'Salin ringkasan',
        resumenCopiado: 'Ringkasan disalin',
        privacidad: 'Ringkasan tidak memuat nomor seri atau pengenal unik.',
        desconocido: 'tidak diketahui',
        sinGpu: 'Tidak terdeteksi',
        so: 'Sistem operasi',
        cpu: 'Prosesor',
        ram: 'Memori RAM',
        gpu: 'Kartu grafis',
        placa: 'Motherboard',
        disco: 'Drive {u}',
        compilacion: 'build {n}',
        nucleosHilos: '{n} inti, {h} thread',
        ramDetalle: 'total {total}, kosong {libre}',
        vram: '{v} VRAM',
        discoDetalle: '{libre} kosong dari {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Ringkasan komputer · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Ringkasan komputer · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: 'Letakkan file atau folder di sini untuk melihat informasinya. Hanya dibaca: tidak ada yang diubah.',
      soltarEnVentana: 'Lepaskan untuk melihat informasinya',
      ruta: 'Jalur',
      mime: 'Jenis MIME',
      creado: 'Dibuat',
      accedido: 'Terakhir diakses',
      atributos: 'Atribut',
      soloLectura: 'Hanya-baca',
      oculto: 'Tersembunyi',
      ninguno: 'Tidak ada',
      dimensiones: 'Dimensi',
      sensible: 'File sensitif: rinciannya ditampilkan, isinya tidak pernah.',
      esArchivo: 'File',
      esCarpeta: 'Folder',
      tamanoTotal: 'Ukuran total',
      archivos: 'File',
      carpetas: 'Subfolder',
      analizando: 'Menganalisis folder…',
      cancelar: 'Batal',
      cancelado: 'Analisis dibatalkan.',
      abrirDisco: 'Buka di Penggunaan disk',
      incompleto:
        'Beberapa item tidak dihitung: tautan, akses ditolak, atau folder yang terlalu besar.',
      raizUnidadTitulo: 'Analisis seluruh drive?',
      raizUnidadTexto:
        'Anda akan menganalisis {ruta}, yaitu satu drive penuh. Prosesnya bisa memakan waktu lama karena membaca seluruh isinya. Lanjutkan?',
      raizUnidadAnalizar: 'Analisis',
    },
    chmod: {
      permisos: 'Izin',
      propietario: 'Pemilik',
      grupo: 'Grup',
      otros: 'Lainnya',
      leer: 'Baca (r)',
      escribir: 'Tulis (w)',
      ejecutar: 'Eksekusi (x)',
      especiales: 'Bit khusus',
      setuid: 'setuid: berjalan dengan izin pemilik',
      setgid:
        'setgid: berjalan dengan izin grup; pada folder, apa pun yang baru dibuat di dalamnya mewarisi grup',
      sticky: 'sticky: hanya pemilik yang dapat menghapus di dalam folder',
      habituales: 'Nilai umum',
      octal: 'Oktal',
      simbolico: 'Simbolis',
      octalInvalido: 'Masukkan 3 atau 4 digit dari 0 sampai 7 (misalnya 755).',
      simbolicoInvalido: 'Masukkan 9 karakter seperti rwxr-xr-x.',
      ejemplo: 'Contoh',
      archivo: 'Nama berkas',
      archivoPorDefecto: 'file',
      nota: 'Tidak berlaku di Windows; berguna untuk server Linux dan macOS.',
      avisoOtros:
        'Pengguna mana pun di server dapat mengubahnya: hindari memberi izin tulis kepada «lainnya».',
    },
    lista: {
      chmod: {
        nombre: 'Izin chmod',
        descripcion: 'Kotak centang, oktal, dan simbolis, untuk server Linux dan macOS.',
      },
      clienteHttp: {
        nombre: 'Klien HTTP',
        descripcion: 'Coba API: permintaan, lingkungan, koleksi, dan riwayat.',
      },
      captura: {
        nombre: 'Tangkapan layar',
        descripcion: 'Wilayah, jendela, atau layar penuh, dengan editor cepat.',
      },
      guiaTuneles: {
        nombre: 'Panduan terowongan',
        descripcion:
          'Cloudflare dan ngrok langkah demi langkah, dengan perintah yang dapat disalin.',
      },
      guiaHttp: {
        nombre: 'Panduan HTTP',
        descripcion: 'Kode status dan metode, dengan pencarian dan contoh.',
      },
      guiaGit: {
        nombre: 'Panduan Git dan GitHub',
        descripcion: 'Perintah dan alur kerja, dengan lab untuk berlatih dengan aman.',
      },
      limpiezaDisco: {
        nombre: 'Pembersihan disk',
        descripcion:
          'Analisis dan hapus berkas sementara serta cache yang dapat dibuat ulang, dengan pratinjau dan konfirmasi.',
      },
      editor: {
        nombre: 'Editor kode',
        descripcion:
          'Edit berkas teks dengan penyorotan sintaks, salinan cadangan, dan penyimpanan terkonfirmasi.',
      },
      compartir: {
        nombre: 'Bagikan folder atau berkas',
        descripcion:
          'Publikasikan folder atau berkas di internet dengan tautan sementara yang hanya baca.',
      },
      miRed: {
        nombre: 'Jaringan saya',
        descripcion:
          'Folder yang dibagikan komputer ini, perangkat di jaringan lokal, dan uji kecepatan. Tanpa kendali jarak jauh.',
      },
      usoDisco: {
        nombre: 'Penggunaan disk',
        descripcion:
          'Apa yang memakan ruang di drive atau folder: pohon, berkas dan folder terbesar, menurut ekstensi.',
      },
      diffCarpetas: {
        nombre: 'Perbandingan folder',
        descripcion:
          'Membandingkan dua folder: hanya di satu, hanya di yang lain, dan berbeda, dengan diff tiap berkas.',
      },
      grabarPantalla: {
        nombre: 'Rekam layar',
        descripcion: 'Membuka perekam yang sudah ada di sistem Anda.',
      },
    },
    secciones: {
      codigo: 'Kode',
      red: 'Jaringan',
      seguridad: 'Keamanan',
      archivos: 'Berkas dan media',
      sistema: 'Sistem',
    },
    tarjetas: {
      comparar: {
        nombre: 'Bandingkan',
        descripcion: 'Teks dan folder: perbedaannya berdampingan.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'Dari teks atau tautan, atau agar orang lain dapat bergabung ke Wi-Fi Anda.',
      },
      guias: {
        nombre: 'Panduan',
        descripcion: 'HTTP, terowongan, dan Git, dengan contoh dan perintah yang dapat disalin.',
      },
    },
    pestanas: {
      diff: 'Teks',
      diffCarpetas: 'Folder',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Terowongan',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev tidak punya perekam sendiri: ia membuka perekam yang sudah ada di sistem Anda. Video disimpan di tempat alat itu menyimpannya.',
      abrir: 'Buka perekam',
      abierta: 'Snipping Tool terbuka. Pilih area layar lalu tekan Mulai.',
      noSePudo:
        'Snipping Tool tidak dapat dibuka dari sini. Gunakan salah satu pintasan di panduan.',
      guiaTitulo: 'Cara merekam di sistem Anda',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Tekan Win + Shift + R untuk merekam dengan Snipping Tool.',
            'Jika Snipping Tool Anda belum diperbarui, tekan Win + Alt + R untuk merekam dengan Xbox Game Bar.',
            'Hentikan rekaman dengan tombol pada bilah yang muncul di bagian atas.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Tekan Cmd + Shift + 5 untuk membuka bilah tangkapan.',
            'Pilih untuk merekam seluruh layar atau bagian yang dipilih.',
            'Tekan Rekam dan, untuk mengakhiri, tombol berhenti di bilah menu.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Setiap desktop menyertakan perekam: di GNOME, Ctrl + Alt + Shift + R; di KDE, Spectacle.',
            'Jika tidak ada, pasang OBS Studio atau SimpleScreenRecorder dari pengelola paket Anda.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `Ekspresi tidak valid: ${detalle}` : 'Ekspresi tidak valid.'),
      regexDetalle: {
        corchete: 'tanda kurung siku “[” tidak ditutup.',
        parentesis: 'tanda kurung “(” tidak ditutup.',
        parentesisSobra: 'tanda kurung tutup “)” tidak memiliki pembuka.',
        nadaQueRepetir:
          'sebuah pengukur (“*”, “+”, “?”, atau “{}”) tidak memiliki apa pun untuk diulang.',
        barraAlFinal: 'pola tidak boleh diakhiri garis miring terbalik.',
        rangoInvertido: 'rentang dalam kelas karakter terbalik (misalnya “z-a”).',
        cuantificador: 'pengukur “{}” tidak lengkap atau angkanya terbalik.',
        grupo: 'nama atau bentuk grup tidak valid.',
        escape: 'urutan escape garis miring terbalik tidak valid.',
      },
    },
    busqueda: {
      excluir: 'Lewati juga (pisahkan dengan koma)',
      incluirPesadas: 'Sertakan folder berat (node_modules, vendor, .git…)',
      contexto: 'Baris konteks',
      grupoNombres: (n) => `Menurut nama (${n})`,
      grupoContenido: (n) => `Menurut isi (${n})`,
      carpeta: 'folder',
      listaAria: 'Hasil pencarian',
      atajos:
        '↑ ↓ untuk berpindah, Enter untuk membuka di editor, Esc untuk membatalkan atau kembali ke teks.',
      sensible: (n) => `Berkas sensitif: kecocokan di baris ${n} (isinya tidak ditampilkan).`,
      mostrarMas: (n) => `Tampilkan ${n} lagi`,
      linea: (n) => `baris ${n}`,
      sinGrupo: 'Tidak ada hasil di grup ini.',
      topeBytes: 'Batas pembacaan tercapai: persempit pencarian.',
    },
    compartir: {
      explicacion:
        'Memublikasikan folder atau berkas dari komputer ini di internet dengan tautan sementara. Hanya baca: siapa pun yang memiliki tautan dapat melihat dan mengunduh, tetapi tidak dapat mengunggah atau mengubah apa pun. Tautan membawa kode rahasia, kedaluwarsa pada waktu yang Anda pilih, dan ditutup saat Anda keluar dari WolfCore Dev. Berkas .env, kunci, folder .git, dan situs dengan data nyata tidak pernah dibagikan.',
      eleccion: 'Yang dibagikan',
      elegirCarpeta: 'Pilih folder…',
      elegirArchivo: 'Pilih berkas…',
      elegido: 'Terpilih',
      duracion: 'Hentikan berbagi dalam',
      duraciones: { m15: '15 menit', h1: '1 jam', h4: '4 jam' },
      tunel: 'Terowongan',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (cepat, tanpa akun)',
        ngrok: 'ngrok (dengan token Anda)',
      },
      ngrokSinToken: 'ngrok membutuhkan token Anda: simpan di opsi terowongan sebuah situs.',
      compartir: 'Bagikan…',
      sinFtp:
        'FTP tidak dibagikan melalui terowongan: tidak terenkripsi dan terowongan hanya membawa HTTP.',
      vacio: {
        titulo: 'Tidak ada yang dibagikan',
        texto:
          'Pilih folder atau berkas untuk mendapatkan tautan publik sementara. Tidak ada yang dipublikasikan sampai Anda mengonfirmasinya.',
      },
      grandes:
        'Berkas teks atau berkas bertipe tidak dikenal yang lebih besar dari 8 MB tidak dibagikan karena tidak dapat diperiksa sepenuhnya; gambar, audio, video, dan paket (zip, 7z, gz, pdf) dibagikan. Ditandai pada daftar.',
      comprimidos:
        'Berkas terkompresi (.zip, .7z, .gz) dibagikan apa adanya, tanpa melihat isinya: jika berisi berkas .env atau kunci, semuanya ikut dipublikasikan.',
      confirmar: {
        titulo: 'Bagikan di internet',
        pregunta: 'Publikasikan ini di internet?',
        rutaReal: 'Jalur sebenarnya (tautan diselesaikan)',
        ruta: 'Jalur persis',
        aviso: (dur) =>
          `Ini akan publik di internet selama ${dur} sejak tautan siap. Siapa pun yang memiliki tautan dapat melihat dan mengunduh apa yang dibagikan.`,
        boton: 'Bagikan di internet',
      },
      abriendo: 'Membuka terowongan…',
      activa: 'Sedang dibagikan',
      enlace: 'Tautan publik',
      copiar: 'Salin tautan',
      qr: 'Kode QR tautan',
      vence: (hasta, restan) => `Kedaluwarsa pada ${hasta} (${restan})`,
      restan: (min) => (min <= 1 ? 'kurang dari 1 menit' : `${min} mnt`),
      dejar: 'Hentikan berbagi',
      fin: {
        vencio: 'Waktu habis: server dan terowongan ditutup.',
        tunel: 'Terowongan tertutup dan pembagian berhenti.',
      },
      registro: {
        titulo: 'Akses',
        ayuda: '200 terbaru, hanya di memori. Tidak pernah menampilkan kode rahasia tautan.',
        vacioTitulo: 'Belum ada akses',
        vacioTexto: 'Setiap kali seseorang membuka tautan, akan muncul di sini.',
        col: { hora: 'Waktu', ip: 'IP', ruta: 'Jalur', codigo: 'Kode' },
        sinPermiso: '(tanpa kode yang benar)',
      },
    },
    miRed: {
      explicacion:
        'Lihat jaringan Anda tanpa mengendalikan perangkat apa pun: folder yang dibagikan komputer ini, perangkat di jaringan lokal, dan uji kecepatan. Hanya membaca dan menanyakan: tidak ada kendali jarak jauh, desktop jarak jauh, atau eksekusi di perangkat lain.',
      carpetas: {
        titulo: 'Folder yang dibagikan komputer ini',
        ayuda:
          'Apa yang dapat dibuka perangkat lain di jaringan pada komputer ini. Berbagi administratif Windows (C$, ADMIN$, IPC$) disembunyikan dan tidak dapat dihapus dari sini.',
        mostrarAdministrativas: 'Tampilkan berbagi administratif',
        administrativa: 'Administratif',
        col: {
          nombre: 'Nama',
          ruta: 'Folder',
          descripcion: 'Deskripsi',
          usuarios: 'Koneksi',
          acciones: 'Tindakan',
        },
        dejar: 'Hentikan berbagi',
        vacioTitulo: 'Tidak ada folder yang dibagikan',
        vacioTexto: 'Tidak ada folder di komputer ini yang dibagikan di jaringan.',
        confirmar: {
          titulo: 'Hentikan berbagi folder',
          pregunta: (nombre: string) => `Hentikan berbagi “${nombre}”?`,
          efecto:
            'Perangkat lain tidak akan lagi melihat folder ini. File di dalamnya tidak dihapus atau dipindahkan.',
          uac: 'Memerlukan izin administrator: Windows akan menampilkan pemberitahuan Kontrol Akun Pengguna (UAC) yang harus Anda setujui. Jika Anda membatalkannya atau tidak menjawab tepat waktu, tidak ada yang diubah.',
          entiendo:
            'Saya memahami bahwa izin administrator akan diminta dan folder tidak akan dibagikan lagi.',
          boton: 'Lanjutkan',
        },
        resultado: {
          quitada: (nombre: string) => `“${nombre}” tidak lagi dibagikan.`,
          cancelado: 'Pemberitahuan Windows dibatalkan: tidak ada yang diubah.',
          tiempo: 'Waktu untuk menyetujui pemberitahuan Windows habis: tidak ada yang diubah.',
        },
      },
      equipos: {
        titulo: 'Perangkat di jaringan lokal',
        ayuda:
          'Pembacaan menggunakan tabel ARP komputer ini (perangkat yang sudah pernah berkomunikasi dengannya): berlangsung seketika dan tidak mengirim apa pun ke jaringan.',
        leer: 'Baca jaringan',
        redActiva: 'Jaringan aktif',
        perfil: {
          privado: 'jaringan pribadi',
          publico: 'jaringan publik',
          dominio: 'jaringan domain',
          desconocido: 'profil tidak diketahui',
        },
        publica:
          'Di jaringan publik, perangkat lain tidak dijelajahi. Untuk mengubah jaringan menjadi Pribadi di Windows: Pengaturan › Jaringan & internet › Properti › Profil jaringan.',
        tunel:
          'Jaringan aktif adalah VPN atau terowongan, sehingga perangkat lain tidak dijelajahi.',
        ipEsteEquipo: 'IP perangkat ini',
        perfilDesconocido:
          'Tidak dapat memeriksa apakah jaringan ini pribadi atau publik, sehingga perangkat lain tidak dijelajahi.',
        sinRed: 'Tidak ada jaringan pribadi aktif untuk dijelajahi.',
        escanear: 'Cari perangkat',
        progreso: (hechos: number, total: number) =>
          `${hechos} dari ${total} alamat telah diperiksa…`,
        escaneoListo: (cantidad: number, red: string) =>
          `Pencarian di ${red} selesai: ${cantidad} perangkat dalam daftar.`,
        escaneoCancelado: (hechos: number, total: number) =>
          `Pencarian dibatalkan setelah memeriksa ${hechos} dari ${total} alamat.`,
        vacioTitulo: 'Tidak ada perangkat untuk ditampilkan',
        vacioTexto:
          'Klik “Baca jaringan” untuk melihat perangkat yang sudah dikenal komputer ini tanpa mengirim apa pun ke jaringan. Jika sudah membacanya, coba “Cari perangkat”.',
        col: {
          ip: 'Alamat IP',
          nombre: 'Nama',
          mac: 'MAC',
          fabricante: 'Produsen',
          ping: 'Ping terakhir',
        },
        ping: 'Kirim ping',
        verCarpetas: 'Lihat folder',
        confirmar: {
          titulo: 'Cari perangkat di jaringan Anda',
          texto: (red: string, cantidad: number) =>
            `Satu ping akan dikirim ke masing-masing dari ${cantidad} alamat di ${red}, satu per satu dan dengan kecepatan terbatas, untuk menemukan perangkat.`,
          adaptador: (nombre: string) => `Adapter jaringan: ${nombre}.`,
          limites:
            'Hanya jaringan pribadi aktif Anda yang dijelajahi (paling banyak 254 alamat). Tidak ada port yang diuji dan tidak ada perangkat yang diakses. Anda dapat membatalkan kapan saja.',
          boton: 'Cari perangkat',
        },
      },
      ping: {
        resultado: (recibidos: number, enviados: number, media: number) =>
          `${recibidos} dari ${enviados} balasan · rata-rata ${media} md`,
        sinRespuesta: (enviados: number) => `0 dari ${enviados} · tidak ada balasan`,
      },
      recursos: {
        titulo: (ip: string) => `Folder yang dibagikan ${ip}`,
        vacio: 'Perangkat ini tidak membagikan folder yang terlihat.',
        ayuda:
          'Folder dibuka di File Explorer. Jika perangkat meminta nama pengguna dan kata sandi, yang memintanya adalah Windows, bukan aplikasi ini.',
        abrir: 'Buka',
        fallo: {
          denegado: 'Perangkat tidak menampilkan foldernya tanpa kredensial.',
          inaccesible: 'Tidak dapat terhubung ke perangkat.',
          error: 'Folder perangkat tersebut tidak dapat ditanyakan.',
        },
      },
      velocidad: {
        titulo: 'Uji kecepatan',
        ayuda: (mb: number) =>
          `Mengukur latensi, kecepatan unduh, dan kecepatan unggah koneksi internet Anda. Menggunakan sekitar ${mb} MB data.`,
        medir: 'Ukur kecepatan',
        fases: {
          latencia: 'Mengukur latensi…',
          bajada: 'Mengukur kecepatan unduh…',
          subida: 'Mengukur kecepatan unggah…',
        },
        latencia: 'Latensi',
        bajada: 'Unduh',
        subida: 'Unggah',
        cancelada: 'Pengukuran dibatalkan: yang ditampilkan adalah hasil hingga saat itu.',
        incompleta: 'Salah satu pengukuran mencapai batas waktu: nilai tersebut hanya perkiraan.',
        confirmar: {
          titulo: 'Ukur kecepatan',
          texto: (bajada: number, subida: number, total: number) =>
            `Sekitar ${bajada} MB akan diunduh dan sekitar ${subida} MB akan diunggah ke Cloudflare (speed.cloudflare.com): total sekitar ${total} MB data. Jika koneksi Anda memiliki batas kuota, perhatikan pemakaian ini.`,
          privacidad:
            'Tidak ada data Anda yang dikirim: yang diunggah hanyalah angka nol. Anda dapat membatalkan kapan saja.',
          boton: 'Ukur',
        },
      },
    },
    usoDisco: {
      explicacion:
        'Menampilkan apa yang memakan ruang di drive atau folder. Hanya membaca nama dan ukuran (tidak pernah isinya), tidak mengikuti tautan atau junction, dan berjalan di proses terpisah. Tidak menghapus, memindahkan, atau mengubah apa pun.',
      unidades: 'Drive',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${libre} kosong dari ${total}`,
      sinUnidades: 'Daftar drive tidak dapat dibaca. Anda dapat memilih folder.',
      elegirCarpeta: 'Pilih folder…',
      analizando: 'Menganalisis…',
      leyendo: 'Membaca',
      progreso: (archivos, carpetas, bytes) => `${archivos} berkas · ${carpetas} folder · ${bytes}`,
      cancelar: 'Batal',
      cancelado: 'Analisis dibatalkan.',
      resumen: (total, archivos, carpetas) =>
        `${total} dalam ${archivos} berkas dan ${carpetas} folder`,
      duracion: (segundos) => `Memakan waktu ${segundos} dtk.`,
      vistas: { arbol: 'Pohon', carpetas: 'Folder', archivos: 'Berkas', extensiones: 'Ekstensi' },
      arbolAyuda:
        'Diurutkan menurut ukuran. Hanya folder dan berkas yang beratnya setidaknya 0,5% dari total yang ditampilkan; sisanya dijumlahkan di “Lainnya”.',
      carpetasAyuda:
        '50 folder dengan bobot sendiri terbesar: bobot berkas yang dimuat langsung, tidak termasuk subfoldernya.',
      archivosAyuda: '50 berkas terbesar.',
      extensionesAyuda:
        '20 ekstensi yang paling banyak memakan ruang; sisanya masuk ke “Ekstensi lain”.',
      col: {
        nombre: 'Nama',
        tamano: 'Ukuran',
        porcentaje: 'Dari total',
        archivos: 'Berkas',
        ruta: 'Jalur',
        extension: 'Ekstensi',
      },
      otros: (n) => `Lainnya (${n} berkas kecil)`,
      sinExtension: '(tanpa ekstensi)',
      otrasExtensiones: 'Ekstensi lain',
      expandir: (nombre) => `Bentangkan ${nombre}`,
      contraer: (nombre) => `Ciutkan ${nombre}`,
      abrir: 'Buka di Explorer',
      copiar: 'Salin jalur',
      denegada: 'Tidak dapat dibaca',
      avisos: {
        enlaces: (n) => `${n} tautan atau junction tidak diikuti dan dihitung sebagai 0.`,
        denegados: (n) =>
          `${n} item tidak dapat dibaca (tanpa izin, atau berubah saat analisis). Tanpa hak administrator beberapa folder sistem tidak dapat dibaca: alat ini tidak memintanya.`,
        enlacesDuros: (n) => `${n} nama tambahan dari berkas hard link tidak dihitung dua kali.`,
        enlacesDurosIncompleto:
          'Hard link-nya begitu banyak hingga registri penuh: total mungkin menghitung sebuah berkas dua kali.',
        truncado: 'Kedalaman maksimum tercapai: beberapa folder tidak dihitung.',
        tamanoLogico:
          'Ukuran bersifat logis (yang dilaporkan tiap berkas), bukan ruang yang dipakai di disk: berkas OneDrive khusus daring, berkas terkompresi, dan berkas jarang dapat berbeda.',
        verEnlaces: 'Tampilkan tautan yang tidak diikuti',
      },
      limpieza: {
        titulo: 'Kosongkan ruang',
        texto:
          'Alat ini hanya mengukur. Untuk menghapus berkas sementara dan cache yang dapat dibuat ulang, atau versi layanan yang tidak terpakai, gunakan yang sudah ada:',
        temporales: 'Pembersihan disk',
        versiones: 'Versi tidak terpakai (Layanan)',
      },
      vacio: {
        titulo: 'Belum ada analisis',
        texto:
          'Pilih drive atau folder untuk melihat apa yang memakan ruang. Tidak ada yang diubah.',
      },
      sinContenido: {
        titulo: 'Tidak ada yang dihitung',
        texto: 'Folder itu tidak memiliki berkas yang dapat dibaca.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Membandingkan dua folder tanpa mengubah apa pun di dalamnya: apa yang hanya ada di satu, hanya di yang lain, dan apa yang berbeda. Tidak mengikuti tautan dan berjalan di proses terpisah.',
      carpetaA: 'Folder A',
      carpetaB: 'Folder B',
      elegir: 'Pilih folder',
      sinElegir: 'Belum dipilih',
      comparar: 'Bandingkan',
      comparando: 'Membandingkan…',
      cancelar: 'Batal',
      cancelada: 'Perbandingan dibatalkan.',
      iguales: 'Kedua folder sama.',
      grupoSoloA: 'Hanya di A',
      grupoSoloB: 'Hanya di B',
      grupoDistintos: 'Berbeda',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'Tidak ada',
      resumen: (a, b, iguales) => `A: ${a} berkas · B: ${b} berkas · ${iguales} identik`,
      truncado: 'Suatu batas tercapai (berkas, kedalaman, atau ukuran): daftar tidak lengkap.',
      recortado: (mostrados, total) =>
        `Ada lebih banyak berkas daripada yang ditampilkan (${mostrados} dari ${total}).`,
      sinComparar: (n) => `${n} berkas besar dengan ukuran sama tidak dibandingkan menurut isinya.`,
      omitidos: (n) => `${n} tautan, junction, atau item khusus dilewati.`,
      motivoTamano: 'ukuran berbeda',
      motivoContenido: 'ukuran sama, isi berbeda',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Pilih berkas “berbeda” dari daftar untuk melihat perbedaannya.',
      soloEnUno: (lado) => `Berkas ini hanya ada di ${lado}.`,
      cargando: 'Membaca berkas…',
      binario: 'Berkas berbeda, tetapi bukan teks: diff tidak ditampilkan.',
      sensible:
        'Berkas sensitif (.env, kunci, atau data nyata): berbeda, tetapi isinya tidak ditampilkan. Anda dapat membukanya di editor, yang meminta konfirmasi yang diperkuat.',
      tope: (kb) => `Berkas berbeda, tetapi lebih dari ${kb} KB: diff teks tidak ditampilkan.`,
      demasiadoDistinto: 'Berkas begitu berbeda sehingga diff baris demi baris tidak ditampilkan.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'akhir baris campuran',
        ninguno: 'tanpa akhir baris',
      },
      saltosDistintos: (a, b) => `Akhir baris: A memakai ${a} dan B memakai ${b}.`,
      soloSaltos:
        'Teks baris sama: hanya akhir baris (termasuk yang di akhir berkas) atau BOM yang berubah.',
      resumenArchivo: (agregadas, quitadas) =>
        `${agregadas} baris ditambahkan, ${quitadas} dihapus`,
      truncadoArchivo: 'Hanya baris pertama yang ditampilkan.',
      lineasIguales: (n) => `… ${n} baris identik …`,
      abrirA: 'Buka A di editor',
      abrirB: 'Buka B di editor',
      atajos: '↑ ↓ untuk berpindah, Enter untuk melihat perbedaan, Esc untuk membatalkan.',
      listaAria: (grupo) => `Berkas: ${grupo}`,
      detalleAria: 'Perbedaan berkas',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Bagian klien HTTP',
        peticion: 'Permintaan',
        coleccion: 'Koleksi',
        historial: 'Riwayat',
        entornos: 'Lingkungan',
      },
      entorno: 'Lingkungan',
      sinEntorno: 'Tanpa lingkungan',
      metodo: 'Metode',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path atau {{base}}/path',
      enviar: 'Kirim',
      enviarAtajo: 'Kirim (Ctrl+Enter)',
      cancelar: 'Batal',
      nueva: 'Baru',
      guardar: 'Simpan ke koleksi',
      nombre: 'Nama',
      nombrePlaceholder: 'Nama permintaan',
      guardada: 'Permintaan disimpan',
      ayudaVariables: 'Gunakan {{variable}} untuk mengambil nilai dari lingkungan yang dipilih.',
      secciones: {
        params: 'Parameter',
        cabeceras: 'Header',
        cuerpo: 'Isi',
        auth: 'Autentikasi',
        opciones: 'Opsi',
      },
      par: {
        clave: 'Nama',
        valor: 'Nilai',
        agregar: 'Tambah baris',
        quitar: 'Hapus baris',
        activa: 'Baris aktif',
        falta: 'Nilai rahasia hilang: ketik agar dapat dikirim.',
      },
      cuerpo: {
        tipo: 'Jenis isi',
        ninguno: 'Tidak ada',
        json: 'JSON',
        form: 'Formulir (urlencoded)',
        multipart: 'Multipart (hanya teks)',
        raw: 'Teks mentah',
        tipoContenido: 'Content-Type',
        texto: 'Isi',
        multipartAyuda: 'Hanya kolom teks: tidak ada berkas dari disk yang dikirim.',
      },
      auth: {
        tipo: 'Jenis',
        ninguna: 'Tidak ada',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'Kunci API',
        token: 'Token',
        usuario: 'Pengguna',
        clave: 'Kata sandi',
        nombre: 'Nama header atau parameter',
        en: 'Kirim di',
        cabecera: 'Header',
        query: 'String kueri',
        ayuda:
          'Nilai disimpan terenkripsi oleh sistem; koleksi, riwayat, dan lingkungan hanya menyimpan referensinya.',
      },
      secreto: {
        guardado: 'Tersimpan (terenkripsi). Ketik untuk menggantinya.',
        mostrar: 'Tampilkan',
        ocultar: 'Sembunyikan',
        quitar: 'Hapus',
        valor: 'Nilai tersimpan',
        porNombre: 'Akan disimpan terenkripsi karena namanya tampak seperti rahasia.',
      },
      opciones: {
        plazo: 'Batas waktu (detik)',
        plazoAyuda: 'Dari 1 hingga 120 detik.',
        ignorarCert: 'Abaikan kesalahan sertifikat untuk permintaan ini',
        ignorarAviso:
          'Berbahaya: koneksi tidak lagi diverifikasi. Hanya berlaku untuk permintaan ini dan hostnya. Situs .test WolfCore sudah diverifikasi dengan CA-nya sendiri.',
        limites:
          'Respons hingga 10 MB dan paling banyak 10 pengalihan. Tanpa cookie tersimpan dan tanpa proksi sistem.',
      },
      respuesta: {
        enviando: 'Mengirim…',
        estado: 'Status',
        tiempo: 'Waktu',
        tamano: 'Ukuran',
        cuerpo: 'Isi',
        cabeceras: 'Header',
        redirecciones: 'Pengalihan',
        vacioTitulo: 'Belum ada respons',
        vacioTexto: 'Ketik URL lalu tekan Kirim. Permintaan keluar dari WolfCore Dev.',
        binario: (bytes, tipo) => `Biner ${bytes} byte, jenis ${tipo || 'tidak diketahui'}.`,
        sinCuerpo: 'Respons tidak memiliki isi.',
        truncada: 'Respons melebihi 10 MB: dipotong dan tidak lengkap.',
        parcial: (mostrados) => `Menampilkan ${mostrados} karakter pertama.`,
        sinRedirecciones: 'Tidak ada pengalihan.',
        salto: (n) => `Lompatan ${n}`,
        urlFinal: 'URL akhir',
        certIgnorado: 'Kesalahan sertifikat diabaikan untuk permintaan ini.',
        caWolf: 'Diverifikasi dengan CA WolfCore Dev.',
        copiar: 'Salin isi',
        copiado: 'Isi disalin',
        formato: 'JSON terformat',
        crudo: 'Teks asli',
      },
      curl: {
        copiar: 'Salin sebagai curl',
        incluir: 'Sertakan kredensial',
        incluirAyuda:
          'Jika tidak dicentang, nilai rahasia keluar sebagai <secreto>. Jika dicentang, perintah membawa kredensial yang sebenarnya.',
        copiado: 'Perintah curl disalin',
        importar: 'Impor curl',
        importarTitulo: 'Impor perintah curl',
        importarAyuda:
          'Tempel perintah curl. Hanya dibaca sebagai teks: tidak ada yang dijalankan. Kredensial masuk ke penyimpanan terenkripsi.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'Impor',
        importada: 'Permintaan diimpor ke koleksi',
        avisos: {
          opcion_ignorada: (d) => `Opsi diabaikan: ${d}`,
          archivo_ignorado: (d) => `Berkas di disk tidak dibaca: ${d}`,
          inseguro_ignorado:
            '-k/--insecure diabaikan. Jika Anda membutuhkannya, nyalakan «Abaikan kesalahan sertifikat» secara manual.',
          comando_cortado: 'Apa pun setelah operator shell (|, ;, &, >) diabaikan.',
          sin_evaluar:
            'Teks memuat $(…), backtick, atau variabel shell: tidak dievaluasi dan tetap berupa teks.',
          url_sin_esquema: 'URL tidak memiliki skema: http:// digunakan.',
          varias_urls: (d) => `Satu argumen tambahan diabaikan: ${d}`,
          cabecera_invalida: (d) => `Header tidak valid diabaikan: ${d}`,
          secretos_guardados:
            'Kredensial yang diimpor disimpan terenkripsi; koleksi hanya menyimpan referensinya.',
        },
      },
      coleccion: {
        vacioTitulo: 'Koleksi kosong',
        vacioTexto: 'Simpan permintaan atau impor perintah curl agar mudah dijangkau.',
        abrir: 'Buka',
        borrar: 'Hapus',
        borrada: 'Permintaan dihapus',
      },
      historial: {
        vacioTitulo: 'Tanpa riwayat',
        vacioTexto:
          '100 permintaan terakhir tersimpan di sini, tanpa kredensial: header sensitif tampil sebagai ***.',
        abrir: 'Buka',
        limpiar: 'Hapus riwayat',
        sinRespuesta: 'Tanpa respons',
      },
      entornos: {
        vacioTitulo: 'Tanpa lingkungan',
        vacioTexto:
          'Lingkungan mendefinisikan variabel seperti {{base}} atau {{token}}. Yang ditandai rahasia disimpan terenkripsi.',
        nuevo: 'Lingkungan baru',
        nombre: 'Nama lingkungan',
        variable: 'Variabel',
        valor: 'Nilai',
        secreta: 'Rahasia',
        agregar: 'Tambah variabel',
        quitar: 'Hapus variabel',
        guardar: 'Simpan lingkungan',
        guardado: 'Lingkungan disimpan',
        borrar: 'Hapus lingkungan',
        borrado: 'Lingkungan dihapus',
        usar: 'Gunakan lingkungan ini',
        activo: 'Aktif',
        sinNombre: 'Ketik nama untuk lingkungan.',
      },
    },
    imagenes: { nombreCaptura: 'tangkapan-layar' },
  },
  doctor: {
    revisiones: {
      discos: 'Kesehatan disk',
    },
    evidencias: {
      disco_modelo: '{modelo} (disk {numero})',
      disco_estado: 'Windows melaporkan status {estado}.',
      disco_operacional: 'Status operasional: {estado}.',
      disco_errores: 'Galat yang belum dikoreksi: {lectura} baca dan {escritura} tulis.',
      disco_prediccion: 'Disk memprediksi akan gagal (SMART).',
      disco_desgaste: 'Keausan {desgaste}% (ambang: {umbral}%).',
      disco_temperatura: 'Suhu {temperatura} °C (batas: {limite} °C).',
      disco_corregidos: 'Galat baca yang dikoreksi meningkat (total {cantidad}).',
      texto: '{texto}',
      puerto_dueno: 'Port {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Port {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Rentang dicadangkan {desde}-{hasta} (termasuk {puerto})',
      ca_vencida: 'CA kedaluwarsa {dias} hari yang lalu',
      ca_por_vencer: 'CA kedaluwarsa dalam {dias} hari',
      certificado_vencido: 'Sertifikat untuk {dominio} kedaluwarsa {dias} hari yang lalu',
      certificado_por_vencer: 'Sertifikat untuk {dominio} kedaluwarsa dalam {dias} hari',
      firefox_perfiles: 'Profil Firefox tanpa kepercayaan:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (terbuka)',
      firefox_perfil_fuera: '{perfil} (di luar folder Firefox)',
      hosts_ilegible: '{ruta}: tidak dapat dibaca ({motivo})',
      hosts_codificacion: '{ruta}: pengodean {codificacion}',
      hosts_bloques: '{ruta}: {bloques} blok WolfCore Dev',
      hosts_sin_cierre: '{ruta}: sebuah blok WolfCore Dev tidak memiliki penanda penutup',
      hosts_faltan: 'Tidak ada di hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: atribut hanya-baca',
      path_repetidas: 'Berulang: {entradas}',
      path_delante: '{entrada} berada sebelum alat WolfCore Dev dan juga memiliki {programa}',
      antivirus_sin_leer:
        'Antivirus aktif; pengecualiannya tidak dapat dibaca (perlu administrator).',
      antivirus_sin_exclusion: 'Antivirus aktif dan folder data WolfCore Dev tidak dikecualikan.',
      enlazador_ausente: 'Alat C++ dari Visual Studio Build Tools tidak ditemukan.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) belum terpasang.',
      firewall_no_comprobado: 'Aturan firewall tidak dapat dibaca (mungkin perlu administrator).',
      firewall_reglas: 'WolfCore Dev: {propias} · Sisa dari uji WolfCore: {pruebas}',
      firewall_acotadas: 'Aturan yang dibatasi ke jaringan lokal:',
      firewall_ajenas: 'Aturan dari program lain:',
      firewall_quitadas: 'Aturan yang dihapus dan dapat dipulihkan:',
    },
    ver: 'Lihat',
    verPuertos: 'Lihat port',
    dialogo: {
      reglas: 'Aturan terdampak: hapus centang pada yang tidak ingin Anda sentuh.',
      sinSeleccion: 'Centang setidaknya satu aturan untuk melanjutkan.',
      reglasNota:
        'Tidak ada yang berubah tanpa konfirmasi Anda dan izin administrator. Jika sebuah aturan berubah setelah ditampilkan, aturan itu dilewati.',
    },
    reparaciones: {
      firewall:
        'Hapus aturan firewall masuk tersebut, satu per satu dan menurut nama persisnya. Salinan disimpan lebih dulu di kunci registri terlindungi HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos agar dapat dibuat ulang. Aturan program lain tidak pernah disentuh.',
      firewall_restaurar:
        'Buat ulang aturan yang Anda centang, dengan program, profil, protokol, port, dan alamat yang sama seperti yang ditampilkan, dari salinan terlindungi (bukan dari berkas di etc/). Program-program itu akan dapat menerima koneksi jaringan lagi.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev menjalankan Maven langsung dengan JDK dan, demi keamanan, tidak membaca .mvn/jvm.config atau variabel MAVEN_OPTS. Jika proyek Anda membutuhkannya, jalankan Maven dari terminal.',
    avisoRuby:
      'Ruby dipasang tanpa Devkit (MSYS2) dan tanpa menyentuh PATH atau registri Windows Anda: tidak ada pemasang. Gem dengan ekstensi native yang tidak memiliki biner terkompilasi memerlukan Devkit. Ini langkah manual: buka terminal dari proyek dan jalankan "ridk install" (memasang MSYS2 di komputer Anda dan mengunduh dari Internet).',
    avisoJdk:
      'Maven dan Gradle berjalan dengan JDK WolfCore Dev, dan belum ada yang terpasang. Pasang Java (Temurin) dari daftar layanan.',
    avisoMeilisearch:
      'Setiap versi minor Meilisearch memiliki datanya sendiri. Jika Anda beralih ke versi minor lain (misalnya, dari 1.58 ke 1.59), indeks dan MEILISEARCH_KEY-nya akan baru: Anda perlu mengindeks ulang dan memperbarui .env proyek Anda.',
    servicios: { meilisearch: 'Meilisearch', ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    anteriores: (n) => `Patch sebelumnya (${n})`,
  },
  memoria: {
    boton: 'Memori',
    tituloBoton: 'Optimalkan memori',
    titulo: 'Pengoptimal memori',
    intro:
      'Pilih mode dan tinjau daftarnya. Tidak ada yang ditutup atau dihentikan sampai Anda mengonfirmasi, dan tidak pernah berjalan sendiri.',
    modo: 'Mode',
    modos: { liviano: 'Ringan', moderado: 'Sedang', profundo: 'Mendalam' },
    descripciones: {
      liviano:
        'Membersihkan cache aplikasi. Membebaskan ruang disk; tidak menutup atau menghentikan apa pun.',
      moderado:
        'Juga menawarkan untuk menyisakan satu worker PHP dan menghentikan layanan WolfCore Dev tanpa aktivitas atau koneksi. Layanan dimulai tanpa dicentang.',
      profundo:
        'Juga mendaftar program Anda sendiri yang boros memori agar Anda dapat meminta mereka menutup jendelanya. Dimulai tanpa dicentang.',
    },
    ver: 'Tampilkan daftar',
    revisando: 'Memeriksa…',
    vacio: 'Tidak ada yang dapat dibebaskan dalam mode ini.',
    tipos: {
      'cache-app': 'Bersihkan cache',
      'reducir-pool': 'Sisakan satu worker',
      'detener-inactivo': 'Hentikan (menganggur)',
      'cerrar-programa': 'Minta menutup jendelanya',
    },
    caches: { sesion: 'Cache HTTP sesi aplikasi' },
    estimado: (cantidad) => `Sekitar ${cantidad} RAM akan dibebaskan`,
    estimadoDisco: (cantidad) => `Ditambah sekitar ${cantidad} disk (cache bukan RAM)`,
    marcadas: (n, total) => `${n} dari ${total} dicentang`,
    sinDatos:
      'Belum ada cukup data aktivitas untuk menawarkan penghentian layanan atau pengurangan PHP. Biarkan Beranda terbuka beberapa menit lalu lihat lagi.',
    listadoFallido:
      'Daftar program yang terbuka tidak dapat dibaca: daftar ini mungkin tidak lengkap. Coba lagi.',
    avisoDetener:
      'Layanan yang menganggur dimulai tanpa dicentang: menghentikan satu layanan memutus apa pun yang memakainya. Hanya yang tanpa koneksi saat ini yang didaftar.',
    avisoCerrar:
      'Program hanya diminta menutup jendelanya, seperti mengeklik X: mereka mungkin menanyakan apakah akan menyimpan. Program tidak pernah dipaksa atau dihentikan.',
    protegidos:
      'Program sistem, layanan Windows, program dengan hak tinggi, pengguna lain, FlyEnv, PhpWebStudy, dan WolfCore Dev (atau apa pun yang mereka jalankan) tidak pernah muncul.',
    aplicar: 'Terapkan yang dicentang',
    confirmarTitulo: 'Terapkan tindakan ini?',
    confirmarTexto: (n) =>
      n === 1
        ? '1 tindakan dari daftar akan dijalankan.'
        : `${n} tindakan dari daftar akan dijalankan.`,
    confirmarCerrar: (nombres) => `Program ini akan diminta menutup jendelanya: ${nombres}.`,
    confirmarDetener: (nombres) => `Layanan ini akan dihentikan: ${nombres}.`,
    confirmar: 'Ya, terapkan',
    cancelar: 'Batal',
    resultadoTitulo: 'Hasil',
    liberado: (cantidad) => `Perkiraan: sekitar ${cantidad} RAM dibebaskan`,
    liberadoDisco: (cantidad) => `Ditambah sekitar ${cantidad} disk`,
    notaPedido:
      'Menunggu Anda: jendela diminta untuk ditutup dan program masih terbuka (mungkin menanyakan apakah akan menyimpan). Tidak dihitung sebagai dibebaskan.',
    estados: { hecho: 'Selesai', pedido: 'Menunggu Anda', saltado: 'Dilewati', error: 'Gagal' },
    motivos: {
      no_en_plan: 'Tidak ada dalam daftar',
      protegido: 'Program yang dilindungi',
      cambio: 'Berubah sejak daftar ditampilkan',
      sin_ventana: 'Tidak lagi memiliki jendela untuk ditutup',
      ya_apagado: 'Tidak ada lagi yang dapat dikurangi',
      ocupado: 'Sedang sibuk (memiliki koneksi)',
      no_se_pudo: 'Permintaan penutupan tidak dapat dikirim (program berjalan dengan hak tinggi)',
    },
    otraVez: 'Mulai dari awal',
  },
  guias: {
    tuneles: { titulo: 'Panduan terowongan', copiar: 'Salin perintah' },
    http: {
      buscar: 'Cari menurut nomor, nama, atau teks',
      familia: 'Keluarga',
      todas: 'Semua',
      verMetodos: 'Metode',
      verCodigos: 'Kode status',
      resultados: (n) => `${n} hasil`,
      vacio: 'Tidak ada yang cocok dengan pencarian.',
      seguro: 'Aman',
      noSeguro: 'Tidak aman',
      idempotente: 'Idempoten',
      noIdempotente: 'Tidak idempoten',
      noEstandar: 'Non-standar',
      broma: 'Kode lelucon (RFC 2324)',
      causas: 'Penyebab umum',
      solucion: 'Cara memperbaikinya',
      ejemplo: 'Contoh',
      copiarEjemplo: 'Salin contoh',
      probar: 'Coba',
      probarTitulo:
        'Coba contoh ini di klien HTTP (tidak ada yang dikirim sampai Anda menekan Kirim)',
      servidorActivo: (puerto) =>
        `Server contoh berjalan di 127.0.0.1:${puerto} selama Anda memakai panduan atau klien HTTP. Hanya dapat diakses dari komputer ini dan berhenti saat Anda keluar atau setelah 10 mnt tidak dipakai.`,
      sinTraduccion: 'Belum diterjemahkan ke bahasa ini: ditampilkan dalam bahasa Inggris.',
      familias: {
        '1xx': '1xx Informasi',
        '2xx': '2xx Berhasil',
        '3xx': '3xx Pengalihan',
        '4xx': '4xx Kesalahan klien',
        '5xx': '5xx Kesalahan server',
      },
    },
    git: {
      buscar: 'Cari topik atau perintah',
      verGuia: 'Panduan',
      verLaboratorio: 'Lab',
      todos: 'Semua',
      grupos: {
        basico: 'Dasar-dasar',
        ramas: 'Cabang',
        deshacer: 'Membatalkan',
        remotos: 'Remote dan tag',
        github: 'GitHub',
      },
      resultados: (n) => `${n} topik`,
      vacio: 'Tidak ada yang cocok dengan pencarian.',
      ejemplo: 'Contoh',
      errores: 'Kesalahan umum',
      copiarEjemplo: 'Salin contoh',
      peligroso: 'Berbahaya',
      sinTraduccion: 'Belum diterjemahkan ke bahasa ini: ditampilkan dalam bahasa Inggris.',
      avisoGithub:
        'Bagian ini hanya penjelasan: WolfCore Dev tidak membuat akun, masuk ke GitHub, atau memakai token dari panduan ini. Nama dan nilai dalam contoh hanyalah rekaan.',
      irLaboratorio: 'Berlatih di lab',
      lab: {
        intro:
          'Repositori latihan dan “remote” lokal, dalam folder milik WolfCore Dev. Tidak memakai internet atau GitHub, dan tidak menyentuh proyek atau pengaturan git Anda.',
        sinGit: {
          titulo: 'Git belum terpasang',
          texto:
            'Lab memakai git milik sistem Anda dan tidak dapat dibuka tanpanya. Pasang Git lalu buka kembali tab ini; WolfCore Dev tidak memasang apa pun untuk Anda.',
        },
        cargando: 'Menyiapkan lab…',
        reiniciar: 'Reset lab',
        reiniciarAyuda: 'Hanya menghapus folder latihan dan mengembalikannya seperti baru.',
        reiniciado: 'Lab direset.',
        version: (v) => `git ${v}`,
        ordenes: 'Perintah',
        mensaje: 'Pesan commit',
        mensajePorDefecto: 'Perubahan latihan',
        rama: 'Cabang',
        etiqueta: 'Tag',
        archivo: 'Berkas',
        grupos: {
          basico: 'Dasar-dasar',
          ramas: 'Cabang',
          guardar: 'Simpan dan batalkan',
          remoto: 'Remote lokal',
        },
        archivos: {
          titulo: 'Berkas latihan',
          ayuda: 'Hanya berkas ini yang dapat diedit, dengan teks hingga 2000 karakter.',
          guardar: 'Simpan berkas',
          guardado: 'Berkas disimpan.',
          areaTexto: (n) => `Isi ${n}`,
        },
        salida: 'Keluaran',
        salidaVacia: 'Tekan sebuah perintah untuk melihat jawaban git di sini.',
        codigo: (n) => (n === 0 ? 'Selesai dengan baik' : `Selesai dengan kode ${n}`),
        truncada: 'Keluaran dipotong.',
        historial: 'Riwayat',
        historialVacio: 'Belum ada commit: jalankan git init, git add, dan git commit.',
        conflicto: {
          titulo: 'Latihan terpandu: sebuah konflik',
          intro:
            'Dua cabang mengubah baris yang sama. Anda akan melihat bagaimana konflik muncul dan cara menyelesaikannya.',
          paso: (n, total) => `Langkah ${n} dari ${total}`,
          ejecutar: 'Jalankan langkah ini',
          hecho: 'Selesai',
          reempezar: 'Mulai dari awal',
          esperado: 'Git melaporkan konflik: itu yang diharapkan pada langkah ini.',
          elegir: {
            mia: 'Pertahankan yang dari main (hijau)',
            otra: 'Pertahankan yang dari rama-a (merah)',
            ambas: 'Pertahankan keduanya',
          },
          final: 'Selesai: Anda menyelesaikan sebuah konflik. Lihat riwayatnya.',
          pasos: [
            {
              titulo: 'Siapkan lab',
              texto: 'Lab direset dan commit pertama dibuat dengan colores.txt (“color: azul”).',
            },
            {
              titulo: 'Ubah baris di rama-a',
              texto: 'Cabang rama-a dibuat, barisnya menjadi “color: rojo”, lalu di-commit.',
            },
            {
              titulo: 'Ubah baris yang sama di main',
              texto: 'Kembali ke main, barisnya menjadi “color: verde”, lalu di-commit.',
            },
            {
              titulo: 'Coba merge',
              texto:
                'rama-a di-merge ke main. Git tidak tahu baris mana yang harus dipertahankan dan meninggalkan konflik.',
            },
            {
              titulo: 'Pilih satu versi',
              texto:
                'Pilih versi baris mana yang dipertahankan. colores.txt sekarang memuat penanda konflik.',
            },
            {
              titulo: 'Konfirmasikan penyelesaian',
              texto: 'colores.txt di-stage (add) dan commit yang menutup merge dibuat.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `Editor ringan dengan penyorotan sintaks untuk berkas teks hingga ${mb} MB. Pilih berkas di dialog sistem; penyimpanan selalu meminta konfirmasi dan lebih dulu meninggalkan salinan di folder data WolfCore Dev.`,
    abrir: 'Buka berkas…',
    abriendo: 'Membuka…',
    guardar: 'Simpan',
    guardando: 'Menyimpan…',
    recargar: 'Muat ulang dari disk',
    vacio: 'Buka berkas untuk mulai mengedit.',
    sinCambios: 'Tanpa perubahan',
    conCambios: 'Perubahan belum disimpan',
    posicion: (linea, columna) => `Baris ${linea}, kolom ${columna}`,
    areaTexto: (nombre) => `Editor kode: ${nombre}`,
    salirTeclado: 'Untuk keluar dari editor dengan papan ketik, tekan Esc lalu Tab.',
    guardado: 'Berkas disimpan.',
    copiaPrevia: (ruta) => `Salinan cadangan: ${ruta}`,
    cancelar: 'Batal',
    enlaceDuro:
      'Berkas ini memiliki lebih dari satu nama di disk (hard link). Menyimpannya memutus tautan itu: nama lain tetap memuat isi lama.',
    saltosMixtos: {
      aviso: 'Berkas ini mencampur akhir baris. Menyimpan menormalkan semuanya menjadi LF.',
      aceptar: 'Saya setuju akhir baris dinormalkan',
    },
    envGestor: {
      aviso:
        'Berkas .env diedit di variabel proyek, dengan alur rahasianya. Tombol ini membuka .env di akar proyek, yang mungkin bukan berkas yang Anda coba buka.',
      boton: 'Buka .env di akar proyek',
    },
    huellaPerdida: 'Tersimpan, tetapi sidik jari baru tidak dapat dibaca: berkas dimuat ulang.',
    confirmarGuardar: {
      titulo: 'Simpan perubahan',
      texto: (nombre) =>
        `${nombre} akan ditulis. Sebelumnya, salinan isi yang ada di disk saat ini disimpan di folder data WolfCore Dev.`,
      boton: 'Simpan dengan salinan cadangan',
    },
    refuerzo: {
      abrirTitulo: 'Berkas sensitif',
      guardarTitulo: 'Simpan berkas sensitif',
      secreto:
        'Berkas ini tampaknya berisi rahasia (kunci privat, token, atau kredensial). Isinya akan ditampilkan di layar.',
      datosReales:
        'Berkas ini milik situs yang ditandai memuat data nyata. Perubahan yang salah dapat memengaruhi informasi nyata.',
      instruccion: (nombre) => `Untuk melanjutkan, ketik nama berkas: ${nombre}`,
      etiqueta: 'Nama berkas',
      abrirBoton: 'Tetap buka',
      guardarBoton: 'Tetap simpan',
    },
    cambioExterno: {
      titulo: 'Berkas berubah di luar editor',
      texto:
        'Program lain mengubahnya sejak Anda membukanya, jadi tidak ada yang disimpan. Anda dapat memuat ulang (perubahan Anda hilang) atau menimpanya dengan yang Anda miliki di sini.',
      recargar: 'Muat ulang dan buang perubahan saya',
      sobrescribir: 'Timpa…',
      sobrescribirTitulo: 'Timpa berkas',
      sobrescribirTexto:
        'Perubahan yang dibuat program lain akan hilang. Isinya saat ini akan tetap ada di salinan cadangan.',
      sobrescribirBoton: 'Ya, timpa',
      volver: 'Kembali',
    },
    descartar: {
      titulo: 'Perubahan belum disimpan',
      texto:
        'Ada perubahan yang belum disimpan di editor. Jika Anda melanjutkan, perubahan itu hilang.',
      confirmar: 'Buang perubahan',
      seguir: 'Lanjutkan mengedit',
    },
    cm: {
      'Control character': 'Karakter kontrol',
      'Selection deleted': 'Pilihan dihapus',
      'Go to line': 'Ke baris',
      go: 'pergi',
      Find: 'Cari',
      Replace: 'Ganti',
      next: 'berikutnya',
      previous: 'sebelumnya',
      all: 'semua',
      'match case': 'cocokkan huruf besar/kecil',
      regexp: 'regexp',
      'by word': 'per kata',
      replace: 'ganti',
      'replace all': 'ganti semua',
      close: 'tutup',
      'current match': 'kecocokan saat ini',
      'on line': 'di baris',
      'replaced match on line $': 'kecocokan di baris $ diganti',
      'replaced $ matches': '$ kecocokan diganti',
      'folded code': 'kode terlipat',
      unfold: 'buka lipatan',
      to: 'sampai',
    },
  },
  limpiezaDisco: {
    intro:
      'Pertama menganalisis dan menampilkan berapa banyak yang dimakan tiap item. Tidak ada yang dihapus sampai Anda mengonfirmasi, dan tidak pernah berjalan sendiri atau di latar belakang.',
    analizar: 'Analisis',
    analizando: 'Menganalisis…',
    cancelarAnalisis: 'Batal',
    vacio: 'Tidak ada yang perlu dibersihkan.',
    categorias: {
      temp: {
        nombre: 'Berkas sementara',
        ayuda:
          'Berkas di folder TEMP Anda yang berusia lebih dari 24 jam. Dihapus permanen; akan dibuat ulang dengan sendirinya.',
      },
      'cache-chrome': {
        nombre: 'Cache Google Chrome',
        ayuda: 'Hanya folder cache tiap profil; tidak pernah cookie, kata sandi, atau riwayat.',
      },
      'cache-edge': {
        nombre: 'Cache Microsoft Edge',
        ayuda: 'Hanya folder cache tiap profil; tidak pernah cookie, kata sandi, atau riwayat.',
      },
      'cache-brave': {
        nombre: 'Cache Brave',
        ayuda: 'Hanya folder cache tiap profil; tidak pernah cookie, kata sandi, atau riwayat.',
      },
      'cache-firefox': {
        nombre: 'Cache Firefox',
        ayuda: 'Hanya folder cache2 tiap profil; tidak pernah cookie, kata sandi, atau riwayat.',
      },
      'wolfcore-descargas': {
        nombre: 'Unduhan tersimpan WolfCore Dev',
        ayuda: 'Arsip lepas yang tidak dipakai lagi. Dikirim ke tempat sampah.',
      },
      'wolfcore-registros': {
        nombre: 'Log WolfCore Dev',
        ayuda: 'Log yang berusia lebih dari 30 hari. Dikirim ke tempat sampah.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          'Opsional. Windows membuatnya ulang, tetapi memerlukan WolfCore Dev berjalan sebagai administrator.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Peramban terbuka atau berjalan di latar belakang: tutup sepenuhnya untuk membersihkan cache-nya (di Edge, matikan juga dorongan startup dan ekstensi latar belakang)',
      'requiere-admin': 'Memerlukan WolfCore Dev berjalan sebagai administrator',
      'ruta-vetada': 'Jalur dilindungi: tidak dibersihkan',
      'temp-no-seguro':
        'Variabel TEMP mengarah ke folder yang bukan folder sementara pengguna (Dokumen, seluruh drive, jalur jaringan…): tidak dibersihkan',
    },
    borradoDefinitivo: 'Dihapus permanen (dibuat ulang dengan sendirinya)',
    borradoPapelera: 'Dikirim ke tempat sampah sistem',
    archivos: (n) => (n === 1 ? '1 berkas' : `${n} berkas`),
    carpetas: 'Menurut folder',
    truncado: 'Analisis berhenti pada batas berkas: ada lebih banyak daripada yang ditampilkan.',
    marcadas: (n, t) => `${n} dari ${t} kategori dipilih`,
    total: (b) => `Sekitar ${b} akan dibebaskan`,
    limpiar: 'Bersihkan yang dipilih',
    confirmarTitulo: 'Bersihkan kategori ini?',
    confirmarTexto: (n) => `${n} kategori akan dibersihkan.`,
    confirmarDefinitivo: 'TEMP dan cache dihapus permanen (dibuat ulang dengan sendirinya).',
    confirmarPapelera: 'Log dan unduhan WolfCore Dev masuk ke tempat sampah.',
    confirmarPrefetch:
      'Prefetch: Windows membuatnya ulang, tetapi peluncuran pertama program mungkin sedikit lebih lambat.',
    confirmar: 'Ya, bersihkan',
    cancelar: 'Batal',
    detener: 'Hentikan pembersihan',
    resultadoTitulo: 'Hasil',
    liberado: (b) => `Dibebaskan: ${b}`,
    enPapelera: (b) =>
      `Dari jumlah itu, ${b} ada di tempat sampah (ruang kembali saat Anda mengosongkannya).`,
    saltados: (n) => `${n} berkas dilewati`,
    cancelado: 'Pembersihan dibatalkan: yang sudah dihapus tetap terhapus.',
    topeEjecucion:
      'Batas berkas per proses tercapai: analisis dan bersihkan lagi untuk melanjutkan.',
    registroFallido:
      'Log pembersihan tidak dapat ditulis lagi, jadi pembersihan berhenti: yang dihapus dicatat hingga titik itu.',
    motivos: {
      'en-uso': 'Sedang dipakai',
      enlace: 'Tautan atau titik reparse (tidak diikuti)',
      protegido: 'Dilindungi (.env, FlyEnv, atau sejenisnya)',
      cambio: 'Berubah sejak analisis',
      'sin-papelera': 'Tempat sampah tidak tersedia',
      ilegible: 'Tidak dapat dibaca',
      error: 'Kesalahan saat menghapus',
    },
    verRegistros: 'Lihat log',
    registroEn: (r) => `Log pembersihan ini: ${r}`,
    otraVez: 'Mulai dari awal',
    protegidas:
      'Tidak pernah disentuh: data, cadangan, proyek, basis data, atau berkas .env. Tautan tidak diikuti dan tidak ada yang di luar jalur dalam daftar ini yang disentuh.',
  },
  preferencias: {
    asistente: 'Tur selamat datang',
    asistenteAyuda: 'Tonton lagi tur layar utama: layanan, proyek, basis data, alat, dan Doctor.',
    asistenteAbrir: 'Tonton tur',
    avanzadas: 'Tampilkan bagian lanjutan',
    avanzadasAyuda:
      'Menambahkan layar yang jarang dipakai ke bilah samping, seperti Kontainer. Juga dapat dijangkau dengan Ctrl+K.',
    animacionInicio: 'Animasi awal',
    animacionInicioAyuda:
      'Menggambar logo dengan goresan bercahaya saat aplikasi dibuka. Klik atau tekan Esc untuk melewatinya. Jika Windows meminta pengurangan gerakan, hanya pudar singkat yang ditampilkan.',
  },
  paleta: {
    irAServicio: (nombre) => `Buka layanan ${nombre}`,
    irAProyecto: (nombre) => `Buka proyek ${nombre}`,
    versionesDe: (nombre) => `Versi ${nombre}`,
    asistente: 'Tonton tur selamat datang',
  },
  env: { bloques: { meilisearch: 'Meilisearch (dengan kuncinya)' } },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Belum ada mesin basis data',
      texto:
        'Pasang MySQL, MariaDB, PostgreSQL, atau MongoDB dari Layanan untuk membuat dan mengelola basis data proyek Anda.',
      accion: 'Buka Layanan',
    },
    serviciosVacio: {
      titulo: 'Belum ada layanan terpasang',
      texto:
        'Layanan (Nginx, PHP, basis data…) adalah yang menjalankan situs Anda. Mulailah dengan Nginx dan PHP, atau dengan basis data.',
      accion: 'Pasang layanan',
    },
    registrosSinFuentes: {
      titulo: 'Belum ada log',
      texto:
        'Log muncul begitu layanan, situs, atau proses menulis baris pertamanya. Nyalakan layanan lalu kembali.',
      accion: 'Buka Layanan',
    },
    registrosElegir: {
      titulo: 'Pilih log',
      texto: 'Pilih sumber di pemilih di atas untuk mengikuti barisnya secara langsung.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Belum ada dump yang masuk',
      texto:
        'Saat situs menjalankan dump(), dd(), atau wd(), dump-nya langsung muncul di sini. Buka situs Anda dan jalankan kode itu.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Penangkapan mati',
      texto:
        'Dengan penangkapan menyala, panggilan dump() dan dd() situs Anda tiba di sini tanpa menyentuh peramban. Nyalakan dan jalankan sebuah situs.',
      accion: 'Nyalakan penangkapan',
    },
    depuracionElegir: {
      titulo: 'Pilih dump',
      texto: 'Pilih dump dari daftar untuk melihat isi, berkas, dan URL sumbernya.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Tidak ada kesalahan di log',
      texto:
        'Kesalahan PHP, Nginx, dan proyek muncul di sini, dikelompokkan, begitu ditulis. Daftar kosong adalah kabar baik.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Pilih kesalahan',
      texto: 'Pilih kesalahan dari daftar untuk melihat jejaknya dan membuka berkas di editor.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Belum ada pemeriksaan',
      texto:
        'Doctor memeriksa port, hosts, sertifikat, dan versi, dan memberi tahu cara memperbaiki yang gagal. Jalankan pemeriksaan pertama.',
      accion: 'Periksa sekarang',
    },
    doctorSinHallazgos: {
      titulo: 'Semua baik',
      texto:
        'Pemeriksaan terakhir tidak menemukan masalah. Periksa lagi jika ada yang berhenti merespons.',
      accion: 'Periksa lagi',
    },
    contenedoresVacio: {
      titulo: 'Tidak ada kontainer',
      texto:
        'Kontainer Docker atau Podman di komputer ini muncul di sini. Buat satu dengan docker run atau docker compose lalu tekan Segarkan.',
      accion: 'Segarkan',
    },
    avisos: {
      titulo: 'Tidak ada pemberitahuan',
      texto:
        'Gangguan layanan, port yang sibuk, dan sertifikat yang akan kedaluwarsa akan muncul di sini.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Belum ada snapshot',
      texto:
        'Snapshot menyimpan keadaan basis data ini agar Anda dapat kembali jika terjadi masalah. Buat yang pertama dengan tombol di atas.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Server ini tidak memiliki basis data sendiri',
      texto: 'Buat basis data untuk proyek Anda atau impor dump yang ada.',
      accion: 'Buat basis data',
    },
    iaNube: {
      titulo: 'Belum ada penyedia AI',
      texto:
        'Penyedia (OpenAI, Anthropic, OpenRouter, dan lainnya) memungkinkan agen Anda memakai model cloud. Kunci disimpan terenkripsi di komputer ini.',
      accion: 'Tambah penyedia',
    },
    iaSinModelos: {
      titulo: 'Belum ada model lokal',
      texto: 'Unduh model dari daftar di bawah untuk memakainya secara luring.',
      accion: '',
    },
    versiones: {
      titulo: 'Tidak ada versi untuk ditampilkan',
      texto: 'Daftar diunduh dari katalog resmi. Periksa koneksi Anda dan segarkan daftar.',
      accion: 'Segarkan daftar',
    },
    buscar: {
      titulo: 'Tidak ada kecocokan',
      texto:
        'Tidak ada di folder yang cocok dengan pencarian Anda. Coba kata lain, hapus centang “Cocokkan huruf besar/kecil”, atau tinjau filter berkas.',
      accion: '',
    },
  },
  asistenteInicio: {
    animacionNota:
      'Jika Anda tidak ingin animasi logo saat aplikasi dibuka, matikan di Pengaturan › Tampilan.',
    titulo: 'Tur selamat datang',
    saltar: 'Lewati',
    terminar: 'Mulai',
    cerrar: 'Tutup tur',
    reabrir: 'Tekan Esc untuk keluar. Anda dapat menontonnya lagi dari Pengaturan › Tampilan.',
    ir: (destino) => `Buka ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Selamat datang di WolfCore Dev',
        texto:
          'Lingkungan pengembangan lokal Anda dalam satu jendela: layanan, situs .test dengan HTTPS, basis data, email, dan alat. Tur ini hanya semenit dan tidak mengubah apa pun di komputer Anda.',
      },
      servicios: {
        titulo: 'Layanan',
        texto:
          'Nyalakan Nginx, PHP, dan basis data di sini dengan sebuah sakelar. Jika belum terpasang, tab Versi mengunduhnya dengan checksum yang terverifikasi.',
      },
      proyectos: {
        titulo: 'Proyek',
        texto:
          'Buat proyek baru atau impor folder atau repositori. Setiap situs mendapat alamat .test sendiri dengan HTTPS.',
      },
      bases: {
        titulo: 'Basis data',
        texto:
          'Buat basis data, impor dan ekspor dump, serta cadangkan dan pulihkan tanpa meninggalkan aplikasi.',
      },
      herramientas: {
        titulo: 'Alat dan Ctrl+K',
        texto:
          'Editor, pencarian, perbandingan, kata sandi, gambar, dan lainnya, dikelompokkan per bagian. Tekan Ctrl+K di layar mana pun untuk melompat ke yang Anda butuhkan.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Memeriksa port, hosts, sertifikat, dan versi, serta menyarankan cara memperbaiki yang gagal. Buka saat ada yang tidak merespons.',
      },
      listo: {
        titulo: 'Semua siap',
        texto:
          'Mulailah dengan menyalakan layanan atau membuat proyek pertama Anda. Anda dapat menonton tur ini lagi dari Pengaturan › Tampilan.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v) => `Tidak ada lagi di katalog: ${v} akan dipasang sebagai gantinya.`,
      },
      resultado: { sustituida: (v) => `${v} dipasang sebagai pengganti versi profil.` },
    },
    motivos: {
      version_sustituida:
        'Versi itu tidak ada lagi di katalog: versi terbaru dari versi minor yang sama (misalnya, 8.3) dipasang.',
    },
  },
  consultasLentas: {
    boton: 'Kueri lambat',
    titulo: (motor) => `Kueri lambat di ${motor}`,
    descripcion:
      'Kueri yang memakan waktu lebih lama dari waktu yang Anda pilih, dari yang paling lambat hingga yang paling cepat.',
    cargando: 'Memuat kueri lambat…',
    estadoTitulo: 'Status log',
    estadoActivo: (s) => `Pencatatan menyala: kueri di atas ${s} dtk dicatat.`,
    estadoApagado: 'Pencatatan mati.',
    noGestionada:
      'WolfCore Dev tidak mengelola server ini (misalnya, yang dijalankan program lain): Anda hanya dapat melihatnya di sini, tidak dapat mengubahnya.',
    umbral: 'Catat kueri di atas (detik)',
    activar: 'Nyalakan pencatatan',
    aplicarUmbral: 'Ubah waktu',
    desactivar: 'Matikan pencatatan',
    actualizar: 'Baca log lagi',
    confirmarTitulo: 'Ubah pencatatan kueri lambat',
    confirmarActivar: (motor, s) =>
      `Pencatatan akan dinyalakan untuk seluruh server ${motor} (kueri di atas ${s} dtk) dan disimpan di konfigurasinya. Memengaruhi semua basis datanya.`,
    confirmarDesactivar: (motor) =>
      `Pencatatan akan dimatikan untuk seluruh server ${motor} dan disimpan di konfigurasinya. Yang sudah tercatat tetap disimpan.`,
    confirmarBoton: 'Konfirmasikan perubahan',
    cancelar: 'Batal',
    activado: 'Pencatatan kueri lambat dinyalakan',
    desactivado: 'Pencatatan kueri lambat dimatikan',
    privacidad:
      'SQL ditampilkan dengan nilainya diganti “?”, karena dapat berisi data pelanggan yang nyata. Tidak ada dari ini yang keluar dari komputer ini atau ditulis ke log aplikasi.',
    columnas: {
      duracion: 'Durasi',
      filas: 'Baris diperiksa',
      base: 'Basis data',
      fecha: 'Tanggal',
      sql: 'Kueri',
      acciones: 'Tindakan',
    },
    sinBase: 'Tidak dikaitkan',
    verLiteral: 'Tampilkan literal',
    ocultarLiteral: 'Sembunyikan literal',
    literalAviso: 'SQL apa adanya, dengan nilainya',
    sqlOculto: 'SQL disembunyikan',
    sqlOcultoAyuda:
      'Kueri ini tidak dapat ditampilkan tanpa mempertaruhkan data nyata: server ini memiliki basis data dengan data nyata atau kueri tidak dapat dikaitkan dengan aman ke sebuah basis data.',
    copiar: 'Salin',
    copiado: 'Kueri disalin',
    truncado: (n) =>
      `Paling banyak ${n} kueri paling lambat dari ujung log (5 MB terakhir) yang ditampilkan.`,
    vacioTitulo: 'Belum ada kueri lambat yang tercatat',
    vacioTextoApagado:
      'Nyalakan pencatatan dan gunakan situs Anda: kueri yang memakan waktu lebih lama dari waktu yang dipilih akan muncul di sini.',
    vacioTextoActivo:
      'Sejauh ini belum ada kueri yang melewati waktu yang dipilih. Gunakan situs Anda dan baca log lagi.',
  },
  esquemaBd: {
    boton: 'Lihat skema',
    titulo: (base) => `Skema ${base}`,
    descripcion:
      'Hanya baca: tabel, kolom, kunci, dan relasi. Tidak ada data dari tabel Anda yang dibaca.',
    cargando: 'Membaca skema…',
    error: 'Skema basis data tidak dapat dibaca.',
    reintentar: 'Coba lagi',
    buscar: 'Cari tabel',
    tablas: (n) => plural(n, 'tabel'),
    vista: 'tampilan',
    truncado: (n) => `Daftar dipotong menjadi ${n} tabel: basis data memiliki lebih banyak.`,
    sinResultados: 'Tidak ada tabel yang cocok dengan pencarian.',
    elegir: 'Pilih tabel dari daftar untuk melihat kolom, kunci, dan relasinya.',
    columnas: 'Kolom',
    indices: 'Indeks',
    sinIndices: 'Tabel ini tidak memiliki indeks.',
    relaciones: 'Relasi',
    sinRelaciones: 'Tabel ini tidak memiliki relasi dengan tabel lain.',
    salientes: 'Mereferensikan',
    entrantes: 'Direferensikan oleh',
    alBorrar: 'Saat dihapus:',
    alActualizar: 'Saat diperbarui:',
    irA: (tabla) => `Buka tabel ${tabla}`,
    col: {
      nombre: 'Kolom',
      tipo: 'Jenis',
      nulo: 'Boleh kosong',
      defecto: 'Bawaan',
      clave: 'Kunci',
    },
    si: 'Ya',
    no: 'Tidak',
    pk: 'PK',
    unico: 'unik',
    vacioTitulo: 'Basis data ini tidak memiliki tabel',
    vacioTexto:
      'Saat Anda membuat tabel (misalnya, dengan migrasi proyek Anda), tabel itu akan muncul di sini.',
  },
  asistentes: {
    pestana: 'Hubungkan asisten',
    explicacion:
      'Menghubungkan asisten memungkinkan asisten AI Anda (Claude, Codex…) melihat dan mengelola layanan WolfCore Dev Anda: melihat status, menyalakan, dan membaca log. Hal yang sensitif selalu meminta konfirmasi Anda.',
    alcance:
      'WolfCore Dev hanya menambahkan atau menghapus entri “wolfcore” miliknya sendiri di konfigurasi setiap program, menyimpan salinan bertanggal terlebih dahulu, dan tidak pernah menulis token Anda di berkas tersebut.',
    notaVariable:
      'Asisten membaca token dari variabel lingkungan WOLFCORE_MCP_TOKEN, yang hanya ditetapkan WolfCore Dev saat Anda membukanya dari AI › Agen › “Buka di proyek”. Cursor harus dijalankan dengan variabel tersebut sudah ditetapkan.',
    recargar: 'Deteksi ulang',
    conectado: 'Terhubung',
    instalado: 'Terpasang, belum terhubung',
    noInstalado: 'Belum terpasang',
    noCompatible: 'Belum didukung',
    motivoLocales:
      'Program ini hanya menerima server lokal di berkasnya dan WolfCore Dev tidak pernah menulis token sebagai teks biasa, sehingga belum dapat dihubungkan.',
    conectar: 'Hubungkan',
    quitar: 'Hapus',
    copiar: 'Salin konfigurasi',
    carpeta: 'Buka folder konfigurasi',
    archivo: 'Berkas konfigurasi',
    cambios: 'Inilah yang akan berubah di berkas:',
    titulo: (n: string) => `Hubungkan ${n}`,
    tituloQuitar: (n: string) => `Hapus koneksi ${n}`,
    aceptarConectar: 'Hubungkan',
    aceptarQuitar: 'Hapus koneksi',
    preparando: 'Menyiapkan pratinjau…',
    archivoNuevo: 'Berkas belum ada: akan dibuat.',
    sinCambios: 'Tidak ada yang perlu diubah: sudah seperti ini.',
    copiaPrevia:
      'Sebelum menulis, salinan bertanggal disimpan di samping berkas (5 salinan terakhir dipertahankan).',
    comentarios:
      'Perhatian: komentar di dalam entri “wolfcore” akan hilang. Bagian berkas lainnya tidak berubah.',
    hConectado: (n: string) => `${n} terhubung.`,
    hQuitado: (n: string) => `Koneksi ${n} dihapus.`,
    hSinCambios: 'Tidak ada yang berubah.',
    hCopia: (n: string) => `Salinan disimpan: ${n}`,
    hTokenEscrito:
      'Berkas berisi token sebagai teks biasa: salinan menyembunyikannya dan berkas tidak lagi memilikinya.',
    hCopiada: 'Konfigurasi disalin (tanpa token).',
  },
};
