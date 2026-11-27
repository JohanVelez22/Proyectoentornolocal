/**
 * Teks antarmuka Bahasa Indonesia (id-ID). Kunci dan tanda tangan fungsi sama dengan es.ts.
 * Glosarium tetap: layanan, instans, situs, terowongan, cadangan, pemberitahuan; Doctor dan
 * WolfCore Dev tidak diterjemahkan. Nada formal dan netral; di luar Git selalu 'versi'.
 */
import type { TextosParciales } from './es';

const plural = (n: number, texto: string): string => `${n} ${texto}`;

export const id: TextosParciales = {
  app: {
    nombre: 'WolfCore Dev',
    version: 'Versi',
  },
  nav: {
    inicio: 'Beranda',
    proyectos: 'Proyek',
    agentes: 'Agen',
    servicios: 'Layanan',
    basesDeDatos: 'Basis data',
    correo: 'Email',
    php: 'PHP',
    ia: 'AI',
    tuneles: 'Terowongan',
    contenedores: 'Kontainer',
    herramientas: 'Alat',
    doctor: 'Doctor',
    depuracion: 'Debugging',
    registros: 'Log',
    ajustes: 'Pengaturan',
    contraer: 'Ciutkan menu',
    expandir: 'Luaskan menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'layanan aktif'),
    tuneles: (n: number) => plural(n, 'terowongan aktif'),
    cargando: 'Menghubungkan ke inti…',
    conErrores: 'dengan kesalahan',
    sinConexion: 'Tidak ada koneksi ke inti',
  },
  estado: {
    encendido: 'Aktif',
    apagado: 'Mati',
    iniciando: 'Memulai…',
    error: 'Kesalahan',
    externo: 'Eksternal',
    activo: 'Aktif',
    aviso: 'Perhatian',
  },
  acciones: {
    encender: 'Nyalakan',
    apagar: 'Matikan',
    iniciarTodo: 'Mulai semua',
    detenerTodo: 'Hentikan semua',
    abrir: 'Buka',
    copiar: 'Salin',
    copiado: 'Disalin ke papan klip',
    guardar: 'Simpan',
    cerrar: 'Tutup',
    abrirCarpeta: 'Buka folder',
    instalar: 'Pasang',
    reintentar: 'Coba lagi',
    cancelar: 'Batal',
    borrar: 'Hapus',
    editar: 'Edit',
    duplicar: 'Duplikat',
    renovar: 'Perbarui',
    masAcciones: 'Tindakan lainnya',
    actualizar: 'Perbarui',
    quitar: 'Hapus',
    reinstalar: 'Pasang ulang',
  },
  errores: {
    titulo: 'Tindakan tidak dapat diselesaikan',
    arranque: 'Status lingkungan tidak dapat dibaca',
    desconocido: 'Terjadi kesalahan tak terduga.',
    /** Detail yang dikirim inti sebagai kode di dalam kesalahan. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'tanda kutip tidak ditutup',
      'sintaxis.tras_comillas': 'kurang spasi atau «;» setelah tanda kutip',
      'sintaxis.punto_y_coma_inesperado': '«;» tanpa direktif',
      'sintaxis.llave_inesperada': '«{» tanpa direktif',
      'sintaxis.falta_punto_y_coma': 'kurang «;» di akhir direktif',
      'sintaxis.sobra_llave': 'kelebihan «}»',
      'sintaxis.falta_llave': 'kurang «}»',
    },
    codigos: {
      'git.cambios_locales':
        'Ada perubahan yang belum disimpan di folder: simpan (commit) atau buang sebelum menarik perubahan. Tidak ada yang diubah.',
      'git.divergencia':
        'Cabang menyimpang dari remote (terdapat commit lokal dan remote yang berbeda): selesaikan secara manual. Tidak ada yang diubah.',
      'git.sin_upstream':
        'Cabang saat ini tidak mengikuti cabang remote mana pun: tidak ada sumber untuk menarik perubahan.',
      'git.sin_rama': 'Repositori berada pada commit lepas (detached): tidak ada yang diubah.',
      'git.no_repositorio': 'Folder ini bukan repositori git.',
      'git.destino_no_vacio': 'Folder tujuan tidak kosong.',
      'git.destino_es_archivo': 'Tujuan adalah file, bukan folder.',
      'git.no_encontrado': 'git tidak ditemukan: pasang terlebih dahulu.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) tidak ditemukan: pasang terlebih dahulu.',
      'git.plazo': 'Kloning melebihi batas waktu {minutos} menit dan dibatalkan.',
      'git.token_invalido': 'Token GitHub tidak valid.',
      'git.url_con_credenciales':
        'URL tidak boleh menyertakan nama pengguna atau kata sandi: gunakan token secara terpisah.',
      'servicios.desconocido': 'Layanan tidak dikenal: {id}.',
      'servicios.no_instalado': '{nombre} belum terpasang. Pasang melalui Layanan.',
      'servicios.puerto_invalido': 'Port harus berupa angka antara 1024 dan 65535.',
      'servicios.puerto_asignado': 'Port {puerto} sudah ditetapkan ke {otro}.',
      'servicios.puerto_ocupado':
        'Port {puerto} digunakan oleh {nombre} (PID {pid}). Tutup program tersebut atau pilih port lain.',
      'servicios.confirmacion_borrado': 'Untuk menghapus data {nombre}, ketik "{id}".',
      'servicios.ftp_no_disponible': 'Server FTP tidak tersedia.',
      'sistema.sin_cliente_ftp':
        'Tidak ada klien FTP yang terkait di komputer ini. Pasang satu (misalnya FileZilla) atau salin alamatnya.',
      'servicios.mailpit_no_responde': 'Mailpit tidak merespons. Jalankan melalui Layanan.',
      'servicios.iniciar_todo_fallos':
        'Mulai semua gagal menyalakan: {nombres}. Periksa Layanan dan log-nya.',
      'servicios.respaldo_fallo':
        '{nombre} tidak diperbarui: cadangan sebelumnya gagal dan tidak ada yang diubah.',
      'servicios.espacio_insuficiente':
        'Ruang tidak cukup untuk menyalin data: diperlukan {necesarios} MB dan tersisa {libres} MB.',
      'servicios.actualizacion_revertida':
        'Versi {version} gagal berjalan; {nombre} kembali ke {anterior}. Cadangan tetap disimpan.',
      'servicios.restauracion_fallo':
        'Versi baru gagal berjalan dan data {nombre} tidak dapat dikembalikan. Tidak ada yang dijalankan: data yang tersentuh ada di {fallida} dan cadangan di {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} berasal dari versi utama yang berbeda: buat sebagai instans baru.',
      'servicios.misma_version': '{id} sudah menggunakan versi {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} diblokir: pembaruan gagal mengembalikan datanya. Data yang tersentuh ada di {fallida} dan cadangan di {respaldo}. Selesaikan di Layanan → Versi sebelum menyalakannya.',
      'servicios.datos_apartados':
        '{nombre} tidak memiliki data di foldernya, tetapi ada data yang dipisahkan dari pembaruan: folder kosong tidak dibuat. Periksa Layanan → Versi.',
      'servicios.puerto_reservado':
        'Port {puerto} dicadangkan oleh sistem ({desde}–{hasta}): pilih port lain.',
      'servicios.borrado_con_bloqueo':
        '{nombre} memiliki instans yang diblokir setelah pembaruan: selesaikan sebelum menghapus datanya.',
      'servicios.config_no_revertida':
        '{nombre} {version} gagal berjalan dan tidak dapat dikembalikan ke {anterior} di konfigurasi. Pilih kembali {anterior} di Layanan → Versi.',
      'servicios.puerto_revertido_apagada':
        '{nombre} gagal berjalan di port baru; dikembalikan ke {anterior}, tetapi juga gagal di sana: dibiarkan mati di port {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} gagal berjalan di port {nuevo} dan tidak dapat dikembalikan ke {anterior} di konfigurasi: dibiarkan mati.',
      'instancias.id_invalido': 'Pengenal instans tidak valid.',
      'instancias.no_existe': 'Instans {id} tidak ada.',
      'instancias.existe': 'Instans {id} sudah ada.',
      'instancias.una_sola': '{nombre} hanya mendukung satu instans.',
      'instancias.ultima': '{id} adalah satu-satunya instans: tidak dapat dihapus.',
      'instancias.sin_puerto_libre': 'Tidak ditemukan port kosong untuk instans.',
      'instancias.confirmacion': 'Untuk melanjutkan, ketik "{id}".',
      'instancias.sin_datos':
        '{id} tidak memiliki data di foldernya: pilih cadangan untuk dikembalikan.',
      'instancias.respaldo_no_existe': 'Cadangan tersebut untuk {id} tidak ada.',
      'instancias.respaldo_en_uso':
        'Salinan tersebut dibutuhkan oleh {id} yang sedang diblokir: selesaikan terlebih dahulu.',
      'instancias.version_requerida':
        'Tidak diketahui versi tujuan pemulihan {id}: pilih versi terpasang dari versi utama yang sama.',
      'instalador.version_en_uso':
        '{servicio} {version} tidak dapat dihapus pemasangannya: sedang digunakan oleh instans {instancia}.',
      'limpieza.sin_confirmar': 'Konfirmasi diperlukan untuk membersihkan versi.',
      'limpieza.seleccion_invalida': 'Pilihan versi tidak valid.',
      'limpieza.en_curso': 'Pembersihan versi sedang berlangsung.',
      'limpieza.no_existe': '{servicio} {version} sudah tidak terpasang.',
      'limpieza.en_uso': '{servicio} {version} sedang digunakan kembali: tidak dihapus.',
      'limpieza.ruta_insegura':
        'Folder {servicio} {version} tidak aman (tautan atau jalur di luar bin): tidak disentuh.',
      'limpieza.version_bloqueada':
        '{servicio} {version} memiliki file yang sedang dipakai atau terkunci: tidak dihapus maupun ditinggalkan setengah jalan.',
      'limpieza.otro_volumen':
        '{servicio} {version} berada di drive lain dari folder data sementara: tidak dapat dipindahkan seluruhnya dan tidak disentuh.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} berisi paket yang Anda pasang sendiri (npm, pip…): Anda harus menyetujui kehilangannya untuk menghapusnya.',
      'limpieza.destino_ocupado':
        'Sudah ada folder {servicio} {version} di bin: tidak ditimpa. Hapus terlebih dahulu sebelum memulihkan yang lain.',
      'bd.encender_servicio': 'Nyalakan {nombre} untuk mengelola basis datanya.',
      'bd.sin_credenciales': 'Tidak ada kredensial tersimpan untuk {nombre}.',
      'bd.confirmacion_borrado': 'Untuk menghapus basis data {nombre}, ketik nama persisnya.',
      'bd.usuario_privilegiado':
        'Pengguna {usuario} adalah administrator atau peran sistem: pilih pengguna khusus untuk proyek.',
      'bd.usuario_en_uso':
        'Proyek lain sudah menggunakan pengguna {usuario}: kata sandinya tidak diubah agar koneksinya tidak putus. Tidak ada yang dibuat.',
      'bd.rol_sin_login':
        'Pengguna {usuario} ada tetapi tidak dapat masuk (peran tanpa LOGIN atau aturan akses server). Tidak ada yang diubah.',
      'bd.usuario_clave_distinta':
        'Pengguna {usuario} sudah ada dengan kata sandi lain. Gunakan kata sandinya saat ini: tidak diubah agar tidak memutus proyek lain.',
      'bd.mongosh_faltante': 'mongosh belum ada: pasang melalui Layanan untuk mengelola MongoDB.',
      'tuneles.sitio_no_encontrado': 'Proyek tidak ditemukan.',
      'tuneles.confirmacion_requerida':
        'Memublikasikan {dominio} ke internet memerlukan konfirmasi di WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Terowongan untuk {dominio} berubah sejak dikonfirmasi: konfirmasi ulang.',
      'tuneles.cloudflared_no_instalado': 'cloudflared belum terpasang. Pasang melalui Layanan.',
      'tuneles.proveedor_no_disponible': 'Penyedia terowongan {proveedor} tidak tersedia.',
      'tuneles.cloudflare_sin_cuenta':
        'Hubungkan akun Cloudflare Anda terlebih dahulu di opsi terowongan.',
      'tuneles.cloudflare_sin_credencial':
        'Terowongan ini tidak memiliki kredensial tersimpan: buat ulang di opsi terowongan.',
      'tuneles.cloudflare_datos_invalidos':
        'Nama terowongan (huruf kecil, angka, dan tanda hubung) atau domain publik tidak valid.',
      'tuneles.cloudflare_conexion_en_curso': 'Koneksi ke Cloudflare sedang berlangsung.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare mendaftarkan {registrado} alih-alih {dominio}: domain bukan milik zona yang Anda otorisasi. Hapus entri tersebut di panel Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'Terowongan {nombre} memiliki koneksi aktif (cloudflared memerlukan -f untuk menghapusnya). Tutup di semua perangkat tempat terowongan terbuka lalu coba lagi, atau gunakan «Lupakan di sini saja».',
      'tuneles.nombre_en_uso': 'Terowongan {nombre} sudah digunakan oleh situs lain.',
      'tuneles.dominio_en_uso': 'Domain {dominio} sudah digunakan oleh situs lain.',
      'tuneles.confirmacion_olvidar':
        'Melupakan atau membuat ulang terowongan {nombre} memerlukan konfirmasi.',
      'tuneles.cloudflare_fallo': 'cloudflared tidak dapat menyelesaikan operasi: {detalle}',
      'tuneles.credencial_no_protegida':
        'Kredensial tidak dapat dibatasi hanya untuk pengguna saat ini, sehingga tidak digunakan.',
      'tuneles.sin_cifrado': 'Enkripsi sistem tidak tersedia: kredensial tidak dapat disimpan.',
      'tuneles.token_invalido':
        'Token tidak valid: hanya huruf, angka, dan _ . - (8 hingga 200 karakter). Simpan ulang di opsi terowongan.',
      'tuneles.ngrok_no_instalado':
        'ngrok belum terpasang di komputer ini. Pasang dari ngrok.com lalu coba lagi.',
      'tuneles.ngrok_sin_token': 'Token ngrok belum ada: simpan di opsi terowongan.',
      'tuneles.expose_sin_token': 'Token Expose belum ada: simpan di opsi terowongan.',
      'tuneles.tailscale_no_instalado':
        'Tailscale belum terpasang di komputer ini. WolfCore Dev tidak memasangnya: pasang dari tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale belum masuk sesi: masuk ke Tailscale lalu coba lagi.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale sudah memublikasikan sesuatu di port HTTPS {puerto}. WolfCore Dev tidak menimpanya: hentikan melalui Tailscale lalu coba lagi.',
      'lan.sitio_no_encontrado': 'Situs tidak ditemukan.',
      'lan.confirmacion_requerida':
        'Membagikan {dominio} di jaringan lokal memerlukan konfirmasi di WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} berisi data nyata: tidak dibagikan di jaringan lokal, bahkan dengan konfirmasi. Gunakan salinan tanpa data pelanggan.',
      'lan.sin_red':
        'Tidak ada jaringan lokal yang terhubung (Wi-Fi atau Ethernet). Hubungkan ke jaringan lalu coba lagi.',
      'lan.ip_no_valida':
        'Alamat {ip} bukan lagi alamat di jaringan lokal Anda. Buka kembali dialog dan konfirmasi ulang.',
      'lan.requiere_https': '{dominio} mengalihkan ke HTTPS: bagikan dengan opsi HTTPS.',
      'lan.sin_puertos':
        'Tidak ada port kosong antara 8100 dan 8199 untuk jaringan lokal (situs yang dibagikan dan tautan CA menggunakan rentang tersebut). Hentikan berbagi suatu situs atau tutup dialog CA lalu coba lagi.',
      'tuneles.expose_no_instalado':
        'Expose belum terpasang. Di Windows hanya berfungsi dengan expose.phar: letakkan di {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose tidak digunakan untuk situs dengan data nyata: inspektor permintaannya terlihat di seluruh jaringan lokal. Gunakan penyedia lain.',
      'tuneles.confirmacion_requerida_tailnet':
        'Membagikan {dominio} ke tailnet Anda memerlukan konfirmasi di WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Tidak dapat membaca apa yang sudah dipublikasikan Tailscale di komputer ini, sehingga tidak ada yang dibuka agar tidak menimpanya. Pastikan Tailscale berjalan lalu coba lagi.',
      'tuneles.tailscale_no_habilitado':
        'Serve atau Funnel belum diaktifkan di tailnet Anda. Aktifkan melalui {enlace} lalu coba lagi.',
      'tuneles.ngrok_desactualizado':
        'Versi ngrok Anda terlalu lama dan tidak mendukung kebutuhan WolfCore Dev. Perbarui (ngrok update) lalu coba lagi.',
      'hosts.dominio_invalido': 'Terdapat domain yang tidak valid.',
      'hosts.tiempo_agotado':
        'Tidak ada respons untuk izin administrator dalam {segundos} detik; file hosts tetap sama.',
      'https.sin_dominio': 'Sertifikat memerlukan setidaknya satu domain.',
      'https.sin_autoridad':
        'Otoritas sertifikat WolfCore Dev tidak ada. Pasang CA melalui bagian HTTPS sebelum menerbitkan sertifikat.',
      'herramientas.pid_invalido': 'PID tidak valid.',
      'herramientas.pid_sistema': 'PID {pid} adalah proses sistem dan tidak dapat dihentikan.',
      'herramientas.proceso_propio':
        'WolfCore Dev maupun proses yang memulainya tidak dapat dihentikan.',
      'herramientas.proceso_inexistente': 'Proses {pid} sudah tidak ada.',
      'herramientas.sin_editor':
        'Tidak ditemukan editor kode. Pasang satu (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} belum terpasang. Pilih editor lain di Pengaturan.',
      'herramientas.editor_invalido': 'Editor tersebut tidak valid.',
      'herramientas.carpeta_sitio_inexistente': 'Folder proyek tidak ada.',
      'herramientas.ruta_no_absoluta': 'Jalur harus berupa jalur absolut.',
      'herramientas.sin_seleccion': 'Pilih setidaknya satu item.',
      'herramientas.dominio_invalido': 'Terdapat domain atau IP yang tidak valid.',
      'herramientas.demasiados_dominios':
        'Satu sertifikat mendukung maksimal {maximo} domain atau IP.',
      'buscar.consulta_invalida': 'Ketik apa yang ingin dicari (maksimal 500 karakter).',
      'buscar.raiz_invalida': 'Folder atau file tidak ada atau tidak valid.',
      'buscar.regex_invalida': 'Ekspresi reguler tidak valid.',
      'buscar.regex_lenta':
        'Ekspresi reguler memakan waktu terlalu lama: sederhanakan atau gunakan teks biasa.',
      'buscar.demasiadas': 'Sudah ada {maximo} pencarian berlangsung: batalkan satu atau tunggu.',
      'terminal.no_abrio': 'Terminal tidak dapat dibuka.',
      'terminal.no_instalada': '{nombre} belum terpasang. Pilih terminal lain di Pengaturan.',
      'terminal.invalida': 'Terminal tersebut tidak valid.',
      'terminal.powershell_restringido':
        'PowerShell berada dalam mode bahasa terbatas di komputer ini (kebijakan organisasi atau AppLocker): WolfCore Dev tidak dapat membuka terminal. Buka sendiri di folder proyek.',
      'proyectos.no_existe': 'Proyek tidak ada.',
      'proyectos.no_confiado': 'Centang "Saya memercayai repositori ini" untuk menjalankan resep.',
      'proyectos.receta_en_curso': 'Sudah ada resep yang sedang berjalan untuk proyek ini.',
      'proyectos.paso_no_omitible': 'Langkah "Buat situs" tidak dapat dilewati.',
      'workspaces.no_existe': 'Workspace tersebut tidak ada.',
      'workspaces.invalido': 'Workspace tidak valid: periksa nama dan elemennya.',
      'workspaces.captadores_exclusivos':
        'Dua penangkap email tidak dapat aktif bersamaan: hanya satu yang berjalan.',
      'workspaces.elemento_fallo':
        'Operasi dengan {elemento} tidak dapat diselesaikan. Periksa Layanan dan log-nya.',
      'workspaces.base_no_responde':
        '{elemento} tidak dimulai karena basis data proyek tersebut tidak merespons.',
      'tareas.cron_invalida':
        'Ekspresi cron tidak valid. Gunakan 5 bidang: menit, jam, hari dalam bulan, bulan, dan hari dalam minggu (misalnya 0 3 * * *).',
      'tareas.comando_invalido':
        'Perintah tidak diizinkan. Gunakan php, node, npm run, atau python dengan file proyek, tanpa kode sebaris (-r, -e, -c).',
      'tareas.invalida': 'Tugas tidak valid: periksa nama, jadwal, dan perintahnya.',
      'tareas.no_existe': 'Tugas tersebut sudah tidak ada.',
      'tareas.sin_confirmar': 'Konfirmasi perintah tugas agar dapat dijalankan.',
      'tareas.sitio_no_confiado':
        'Centang «Saya memercayai repositori ini» pada proyek untuk menjalankan tugasnya.',
      'tareas.receta_cambio':
        'Resep proyek berubah sejak Anda memercayainya: tinjau kembali lalu centang ulang «Saya memercayai repositori ini».',
      'tareas.aislado':
        'Ini adalah folder data uji coba (WOLFCORE_DATOS): izinkan tugas terjadwal agar dapat dijalankan.',
      'tareas.carpeta': 'Folder proyek tidak ada: tugas tidak dapat dijalankan.',
      'tareas.en_curso': 'Tugas sudah sedang berjalan.',
      'tareas.demasiadas': 'Terlalu banyak tugas pada proyek ini (maksimal {maximo}).',
      'cli.no_autorizado':
        'Perintah CLI tidak diotorisasi: jalankan kembali saat aplikasi WolfCore Dev terbuka.',
      'cli.orden_desconocida': 'WolfCore Dev tidak mengenal perintah CLI tersebut.',
      'cli.argumentos_invalidos': 'Argumen perintah tidak valid.',
      'cli.solicitud_grande': 'Permintaan terlalu besar (maksimal {maximo} byte).',
      'cli.formato_no_admitido': 'Format permintaan tidak diterima oleh CLI.',
      'cli.plazo':
        'Perintah memakan waktu terlalu lama: mungkin masih berjalan. Periksa statusnya di WolfCore Dev.',
      'cli.ocupado': 'WolfCore Dev sedang menangani terlalu banyak perintah CLI: tunggu sebentar.',
      'cli.requiere_confirmacion':
        'Perintah ini memublikasikan atau mengubah sesuatu dan memerlukan konfirmasi (--si) pada {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} berisi data nyata: konfirmasi juga dengan opsi data nyata pada perintah (domain situs).',
      'cli.requiere_confirmacion_global':
        'Mengubah PHP untuk semua terminal memerlukan konfirmasi (--si).',
      'cli.confirmacion_rechazada':
        'Konfirmasi di jendela WolfCore Dev ditolak atau tidak tersedia: tidak ada yang dilakukan.',
      'cli.confirmacion_vencida':
        'Tidak ada yang mengonfirmasi di jendela WolfCore Dev tepat waktu: tidak ada yang dilakukan.',
      'cli.tunel_fallo': 'Terowongan gagal dibuka. Periksa log-nya di WolfCore Dev.',
      'cli.inicio_fallo': 'Tidak semua yang diminta dapat dimulai. Periksa log di WolfCore Dev.',
      'cli.parada_fallo': 'Tidak semua yang diminta dapat dihentikan. Periksa log di WolfCore Dev.',
      'cli.interno': 'Kesalahan internal server CLI.',
      'cli.proveedor_distinto':
        'Situs menggunakan penyedia terowongan lain ({proveedor}). Periksa lalu konfirmasi ulang.',
      'cli.sitio_no_encontrado': 'Situs {sitio} tidak ada.',
      'cli.carpeta_invalida':
        'Folder tidak ada, merupakan folder sistem, atau merupakan folder data WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Folder tersebut bukan milik situs WolfCore Dev mana pun: tautkan terlebih dahulu.',
      'cli.ya_vinculada': 'Folder tersebut sudah menjadi situs {sitio}.',
      'cli.tipo_no_soportado': 'Proyek bertipe {tipo} dibuat melalui antarmuka WolfCore Dev.',
      'cli.sitio_sin_php': 'Situs {sitio} tidak menggunakan PHP.',
      'cli.version_no_instalada': '{servicio} {version} belum terpasang. Pasang melalui Layanan.',
      'cli.fuente_no_existe': 'Log tersebut belum ada.',
      'cli.token_no_protegido':
        'File token tidak dapat dibatasi hanya untuk pengguna saat ini: CLI tidak diaktifkan.',
      'cli.carpeta_ajena':
        'Folder run/ di dalam folder data milik pengguna lain: CLI tidak diaktifkan.',
      'cli.ruta_invalida': 'Jalur WolfCore Dev berisi karakter yang tidak didukung wolf.cmd.',
      'cli.path_aislado':
        'Dengan folder data uji coba (WOLFCORE_DATOS), PATH pengguna tidak diubah.',
      'cli.sin_cliente': 'Versi WolfCore Dev ini tidak menyertakan klien wolf (belum dikompilasi).',
      'cli.demasiados_dialogos':
        'Terlalu banyak konfirmasi dalam satu menit terakhir: tunggu sebentar lalu coba lagi.',
      'cli.error': 'Perintah tidak dapat diselesaikan: {detalle}',
      'proyectos.carpeta_no_vacia':
        'Folder proyek sudah berisi file: pilih folder lain atau kosongkan.',
      'secretos.sin_cifrado':
        'Enkripsi sistem tidak tersedia: kata sandi pengguna khusus tidak dapat disimpan. Tidak ada yang diubah.',
      'proyectos.clave_bd_falta':
        'Kata sandi tersimpan untuk pengguna {usuario} tidak ada: tidak ada yang ditulis. Di pengelola .env, "Gunakan pengguna khusus" membuat kata sandi baru.',
      'env.archivo_grande': 'File variabel terlalu besar (maksimal {maximo}).',
      'env.no_regular': 'File .env bukan file biasa: tidak dibaca maupun diubah.',
      'env.clave_inexistente': 'Variabel {clave} tidak ada.',
      'env.cambio_invalido': 'Salah satu perubahan .env tidak valid.',
      'env.variable_invalida': 'Perubahan pada variabel {clave} tidak valid.',
      'env.solo_lectura': 'Variabel {clave} terdiri dari beberapa baris: edit langsung di file.',
      'env.usuario_compartido':
        'Basis data {base} juga digunakan oleh proyek {proyecto}: konfirmasi jika Anda ingin berbagi penggunanya.',
      'env.cambio_externo':
        '.env berubah sejak pratinjau ditampilkan: tinjau kembali sebelum menyimpan.',
      'env.sin_confirmar': 'Konfirmasi bahwa Anda ingin menyimpan perubahan .env.',
      'env.versionado':
        'Git sudah melacak .env proyek ini: commit berikutnya akan mengunggah nilainya. Konfirmasi terpisah untuk melanjutkan.',
      'env.versionado_desconocido':
        'Tidak dapat memeriksa apakah git melacak .env proyek ini: konfirmasi terpisah untuk melanjutkan.',
      'env.copia_invalida': 'Salinan .env tidak valid atau sudah tidak ada.',
      'env.sin_base': '.env proyek ini tidak memiliki koneksi basis data.',
      'env.base_no_resuelta':
        'Basis data proyek ini bukan milik server lokal WolfCore Dev: tidak ada yang diubah.',
      'env.motor_no_soportado':
        'Saat ini "Gunakan pengguna khusus" berfungsi untuk MySQL dan MariaDB.',
      'env.ya_usa_usuario_propio': 'Proyek ini sudah menggunakan pengguna khusus.',
      'plantillas.id_invalido': 'Pengenal templat tidak valid.',
      'plantillas.no_existe': 'Templat tidak ada.',
      'plantillas.danada':
        'Templat rusak atau telah dimodifikasi: tidak digunakan. Hapus lalu simpan ulang.',
      'plantillas.demasiado_grande':
        'Proyek memiliki terlalu banyak file atau terlalu besar untuk disimpan sebagai templat (maksimal {maximo} file). Kecualikan folder besar.',
      'plantillas.demasiado_pesada':
        'Proyek terlalu besar untuk disimpan sebagai templat (maksimal {maximo}). Kecualikan folder besar.',
      'plantillas.exclusion_invalida':
        'Salah satu pengecualian tidak valid (gunakan nama atau jalur relatif tanpa "..").',
      'plantillas.nombre_invalido': 'Nama templat tidak valid (1 hingga 60 karakter).',
      'plantillas.esquema_fallo':
        'Skema basis data proyek tidak dapat dibaca: pastikan layanannya sedang aktif.',
      'plantillas.base_no_resuelta':
        'Templat tidak dapat disimpan: server basis data bersifat remote atau tidak ada layanan lokal yang menggunakan port tersebut.',
      'plantillas.sin_generador_base':
        'Jenis proyek ini tidak memiliki generator dasar: templat harus menyertakan file proyek.',
      'plantillas.exclusiones_nuevas':
        'Templat memuat file yang kini dikecualikan ({archivo}): simpan ulang dari proyek atau hapus.',
      'plantillas.motor_distinto':
        'Skema templat berasal dari MySQL sementara server yang dipilih adalah MariaDB (atau sebaliknya): mungkin ada perbedaan. Konfirmasi jika ingin melanjutkan.',
      'bd.sql_no_permitido':
        'Skema memuat pernyataan non-struktur dan tidak ada yang dijalankan: {sentencia}',
      'bd.extension_no_permitida':
        'Skema meminta ekstensi {nombre} yang tidak ada dalam daftar yang diizinkan: tidak ada yang dipulihkan.',
      'bd.esquema_fallo':
        'Skema lengkap tidak dapat dipulihkan: tidak ada yang ditinggalkan setengah jalan.',
      'bd.datos_no_permitidos':
        'Dump data berisi perintah yang bukan data (hanya INSERT, LOCK TABLES, dan SET yang diterima): tidak ada yang diimpor.',
      'bd.datos_fallo':
        'Data tidak dapat diimpor: basis data tetap seperti semula, tanpa perubahan setengah jadi.',
      'perfiles.destino_invalido': 'Pilih lokasi untuk menyimpan profil (file .wolfperfil).',
      'perfiles.frase_debil': 'Frasa sandi CA harus terdiri dari minimal {minimo} karakter.',
      'perfiles.frase_incorrecta': 'Frasa sandi tidak benar: tidak ada yang diimpor.',
      'perfiles.certificados_sin_ca':
        'Sertifikat situs hanya dapat disertakan bersama CA yang terenkripsi: sertakan CA dengan frasa sandi.',
      'perfiles.no_existe': 'File profil tidak ada.',
      'perfiles.danado': 'Profil rusak atau telah dimodifikasi: tidak ada yang diimpor.',
      'perfiles.demasiado_grande': 'Profil terlalu besar (maksimal {maximo}).',
      'perfiles.version_no_soportada':
        'Profil berasal dari versi WolfCore Dev yang lebih baru (format {version}): perbarui aplikasi untuk mengimpornya.',
      'perfiles.sin_confirmar': 'Konfirmasikan bahwa Anda ingin mengimpor profil.',
      'perfiles.vista_previa_vieja':
        'Folder data atau profil berubah sejak pratinjau: periksa kembali.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS bukan folder data yang valid: harus berupa jalur absolut, bukan folder sistem, dan berbeda dari folder asli.',
      'perfiles.confirmar_reemplazar_ca':
        'Profil membawa CA dan komputer ini sudah memiliki CA sendiri: bandingkan sidik jarinya dan konfirmasikan secara terpisah bahwa Anda ingin menggantinya (hanya jika itu CA Anda sendiri).',
      'herramientas.imagen_tipo':
        'File tersebut bukan gambar yang didukung (PNG, JPG, WebP, GIF, BMP, atau ICO) atau isinya tidak sesuai dengan tipenya.',
      'herramientas.imagen_grande': 'Ukuran gambar terlalu besar (maksimal {maximo}).',
      'herramientas.imagen_dimensiones':
        'Dimensi gambar terlalu besar ({ancho}×{alto} px; maksimal {maximo} px per sisi) dan tidak dibuka demi keamanan.',
      'herramientas.zip_sin_archivos':
        'Tidak ada file untuk dikompresi (tautan simbolis tidak diikuti).',
      'herramientas.zip_demasiados': 'Terlalu banyak file untuk dikompresi (maksimal {maximo}).',
      'herramientas.zip_grande':
        'Ukuran total yang akan dikompresi terlalu besar (maksimal {maximo}).',
      'herramientas.pdf_invalido': 'File bukan PDF yang dapat dioptimalkan.',
      'herramientas.pdf_grande': 'Ukuran PDF terlalu besar (maksimal {maximo}).',
      'herramientas.pdf_cifrado': 'PDF dilindungi kata sandi dan tidak dapat dioptimalkan.',
      'herramientas.pdf_plazo':
        'Proses PDF memakan waktu lebih dari {segundos} dtk dan dibatalkan.',
      'herramientas.salida_ocupada': 'Tidak ditemukan nama yang tersedia untuk file baru.',
      'conversor.formato': 'Konversi tersebut tidak tersedia.',
      'conversor.archivo_invalido':
        'File rusak atau tidak sesuai dengan tipe yang ditunjukkan ekstensinya.',
      'conversor.archivo_grande': 'Ukuran file terlalu besar (maksimal {maximo}).',
      'conversor.archivo_peligroso':
        'File tampak seperti bom ZIP atau telah dimanipulasi (isi terlalu besar, entitas XML, atau nama tidak valid) dan tidak dibuka demi keamanan.',
      'conversor.limite_filas': 'Tabel memiliki terlalu banyak baris (maksimal {maximo}).',
      'conversor.limite_columnas': 'Tabel memiliki terlalu banyak kolom (maksimal {maximo}).',
      'conversor.limite_paginas': 'PDF memiliki terlalu banyak halaman (maksimal {maximo}).',
      'conversor.pdf_cifrado': 'PDF dilindungi kata sandi dan tidak dapat dikonversi.',
      'conversor.plazo': 'Konversi memakan waktu lebih dari {segundos} dtk dan dibatalkan.',
      'conversor.cancelado': 'Konversi dibatalkan.',
      'conversor.libreoffice_ausente':
        'Konversi tersebut memerlukan LibreOffice yang tidak terinstal di komputer ini (WolfCore Dev tidak menginstalnya).',
      'conversor.libreoffice_fallo': 'LibreOffice tidak dapat mengonversi dokumen.',
      'conversor.limite_celdas': 'Tabel memiliki terlalu banyak sel (maksimal {maximo}).',
      'conversor.memoria':
        'File memerlukan terlalu banyak memori (lebih dari {maximo}) dan dibatalkan.',
      'conversor.pdf_no_disponible': 'Pencetakan ke PDF sedang tidak tersedia saat ini.',
      'herramientas.imagen_pixeles':
        'Gambar memiliki terlalu banyak piksel secara total ({ancho}×{alto} px; maksimal {maximo}) dan tidak dibuka demi keamanan.',
      'herramientas.zip_cambio': 'Sebuah file berubah saat sedang dikompresi: coba lagi.',
      'herramientas.pdf_demasiado_complejo':
        'PDF terlalu kompleks (akan menggunakan memori melebihi batas yang diizinkan) dan dibatalkan.',
      'herramientas.salida_denegada':
        'Tidak dapat menulis di lokasi tersebut: periksa izin atau pastikan foldernya ada.',
      'herramientas.fuera_de_la_ca':
        'CA WolfCore Dev hanya menandatangani domain .test, localhost, dan alamat lokal: {dominio} tidak dapat disertakan.',
      'perfiles.frase_requerida':
        'Masukkan frasa sandi profil untuk mengimpor basis data atau CA-nya (atau impor tanpa basis data).',
      'perfiles.sin_espacio':
        'Ruang penyimpanan tidak cukup untuk mengimpor profil: dibutuhkan {necesarios} dan tersedia {libres}.',
      'perfiles.ca_sin_restricciones':
        'CA ini dapat menandatangani situs web mana pun: impor hanya jika itu milik Anda dan bandingkan sidik jarinya. Konfirmasikan secara terpisah untuk melanjutkan.',
      'perfiles.ca_restricciones_ajenas':
        'CA profil memiliki batasan nama yang bukan milik WolfCore Dev: tidak diimpor.',
      'perfiles.instantanea_fallo':
        'Tidak dapat menyimpan salinan cadangan lingkungan sebelumnya: tidak ada yang diubah. Periksa ruang disk dan izin folder data.',
      'perfiles.en_curso': 'Impor profil sedang berlangsung: tunggu hingga selesai.',
      'importar.origen_apagado':
        'Tidak dapat terhubung ke server basis data program lain: nyalakan dari program tersebut lalu coba lagi. Situs sudah berhasil diimpor.',
      'importar.origen_no_local': 'Server sumber harus berada di komputer ini (127.0.0.1).',
      'importar.origen_rechazado': 'Server sumber menolak nama pengguna atau kata sandi.',
      'importar.origen_version':
        'Versi server sumber tidak dapat diimpor dengan komponen yang terinstal di WolfCore Dev.',
      'importar.volcado_enorme':
        'Data basis data berukuran lebih dari {maximo} MB: tidak diimpor sekaligus.',
      'importar.motor_no_soportado':
        'Hanya basis data MySQL dan MariaDB yang dapat diimpor dari program lain.',
      'importar.ruta_fuera':
        'Folder atau file yang mengarah keluar dari instalasi atau ke folder sistem telah diabaikan.',
      'importar.carpeta_invalida':
        'Folder yang sudah tidak ada atau bukan merupakan folder telah diabaikan.',
      'importar.archivo_grande':
        'File konfigurasi berukuran lebih dari {maximo} KB dan tidak dibaca.',
      'importar.archivo_ilegible': 'File konfigurasi bukan berupa teks atau tidak dapat dibaca.',
      'importar.demasiados':
        'Terlalu banyak situs atau file konfigurasi: hanya sebagian pertama yang dibaca.',
      'importar.candidato_desconocido':
        'Situs tersebut tidak lagi muncul di program sumber: cari kembali.',
      'importar.ya_vinculado': 'Folder tersebut sudah menjadi situs WolfCore Dev.',
      'importar.dominio_existe':
        'Sudah ada situs dengan domain {dominio}: ubah terlebih dahulu sebelum mengimpor.',
      'importar.sin_php':
        'Situs ini memerlukan PHP dan belum ada versi yang terinstal: instal dari Layanan.',
      'importar.base_existe':
        'Basis data {nombre} sudah ada di tujuan dan tidak disentuh. Konfirmasikan penggantian untuk mengimpornya (cadangan akan dibuat sebelumnya).',
      'importar.base_fallo':
        'Tidak dapat mengimpor basis data {nombre}: tetap seperti semula, tanpa perubahan setengah jadi.',
      'importar.sitio_fallo': 'Tidak dapat membuat situs.',
      'importar.origen_invalido':
        'Data server sumber tidak valid (pengguna, kata sandi, atau port).',
      'importar.sin_seleccion': 'Pilih minimal satu situs untuk diimpor.',
      'importar.en_curso': 'Impor sedang berlangsung: tunggu hingga selesai.',
      'importar.cancelado': 'Impor dibatalkan: data yang sedang diimpor tetap seperti semula.',
      'importar.origen_estancado':
        'Server program lain berhenti merespons selama proses dump: basis data tidak diimpor.',
      'importar.sin_espacio':
        'Ruang penyimpanan tidak cukup untuk mengimpor basis data: dibutuhkan sekitar {necesarios} MB dan tersedia {libres} MB.',
      'importar.origen_fallo': 'Tidak dapat melakukan dump basis data dari program lain.',
      'importar.clave_no_ascii':
        'Kata sandi mengandung aksen atau simbol yang tidak dapat diteruskan ke dump: gunakan kata sandi dengan karakter ASCII saja.',
      'plantillas.sin_esquema': 'Templat tidak menyertakan skema basis data.',
      'proyectos.carpeta_invalida': 'Folder proyek tidak valid.',
      'proyectos.nombre_invalido':
        'Nama proyek hanya boleh berisi huruf kecil, angka, dan tanda hubung (maksimal 40 karakter).',
      'proyectos.argumento_invalido': 'Data proyek tidak valid (bidang: {campo}).',
      'proyectos.base_existe': 'Basis data {nombre} sudah ada: pilih nama lain.',
      'proyectos.dominio_existe': 'Sudah ada situs dengan domain {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Folder tersebut adalah milik proyek {dominio} atau berada di dalamnya: pilih folder lain.',
      'proyectos.sin_python': 'Python belum terinstal: instal dari Layanan.',
      'proyectos.venv_ajeno':
        'Proyek ini membawa .venv sendiri dan WolfCore Dev tidak menjalankan Python dari repositori luar: hapus lalu buat ulang lingkungannya.',
      'proyectos.paso_base_no_omitible':
        'Langkah "Buat basis data" pada proyek baru tidak dapat dilewati.',
      'proyectos.sin_php': 'PHP belum terinstal: instal dari Layanan.',
      'proyectos.php_no_instalado': 'PHP {version} belum terinstal: instal dari Layanan.',
      'proyectos.python_no_instalado': 'Python {version} belum terinstal: instal dari Layanan.',
      'mcp.token_invalido': 'Token server MCP tidak valid.',
      'mcp.solicitud_cancelada': 'Klien MCP membatalkan permintaan: tindakan tidak dijalankan.',
      'doctor.puerto_ocupado':
        'Port {puerto} milik {servicio} digunakan oleh program lain ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) menggunakan port {puerto} milik {servicio}.',
      'doctor.puerto_http_sys':
        'Layanan Windows ({programa}) menggunakan port {puerto} milik {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} menggunakan port {puerto} milik {servicio}. Tutup program tersebut atau ubah port WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} menggunakan port {puerto} milik {servicio}.',
      'doctor.puerto_skype': '{programa} menggunakan port {puerto} milik {servicio}.',
      'doctor.puerto_reservado':
        'Port {puerto} milik {servicio} berada dalam rentang yang dicadangkan oleh Windows ({desde}-{hasta}: Hyper-V, WSL, atau Docker).',
      'doctor.ca_por_vencer':
        'Otoritas sertifikat WolfCore Dev akan kedaluwarsa dalam {dias} hari.',
      'doctor.ca_vencida': 'Otoritas sertifikat WolfCore Dev telah kedaluwarsa.',
      'doctor.certificado_por_vencer': 'Sertifikat {dominio} akan kedaluwarsa dalam {dias} hari.',
      'doctor.certificado_vencido': 'Sertifikat {dominio} telah kedaluwarsa.',
      'doctor.hosts_ilegible': 'Tidak dapat membaca file hosts.',
      'doctor.hosts_utf16':
        'File hosts disimpan dalam format UTF-16: Windows mungkin tidak dapat membaca entrinya.',
      'doctor.hosts_bloque_duplicado':
        'File hosts memiliki {bloques} blok WolfCore Dev; seharusnya hanya ada satu.',
      'doctor.hosts_bloque_sin_cierre':
        'Sebuah blok WolfCore Dev di file hosts tidak memiliki penanda penutup.',
      'doctor.hosts_dominios_faltantes':
        'Ada {cantidad} domain dari situs Anda yang tidak ditemukan di file hosts.',
      'doctor.hosts_solo_lectura':
        'File hosts bersifat baca-saja (biasanya diatur oleh antivirus). WolfCore Dev tetap dapat menulisnya dengan izin administrator.',
      'doctor.path_duplicados':
        'PATH pengguna memiliki {cantidad} entri WolfCore Dev yang duplikat.',
      'doctor.path_ajeno_delante':
        'Folder lain berisi {programa} ({origen}) berada sebelum WolfCore Dev di PATH: terminal akan menggunakan folder tersebut.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64) tidak ditemukan: PHP dan layanan lain tidak dapat berjalan tanpanya.',
      'doctor.enlazador_msvc_ausente':
        'Rust terinstal tetapi alat C++ dari Visual Studio Build Tools (linker MSVC) tidak ditemukan: cargo tidak akan dapat menautkan program.',
      'doctor.antivirus_sin_exclusion':
        'Antivirus memindai folder data WolfCore Dev: PHP dan layanan dapat berjalan lambat saat dimulai.',
      'doctor.firewall_reglas':
        'Windows mengizinkan akses masuk dari jaringan pada {cantidad} aturan untuk program WolfCore Dev (nginx, PHP, atau basis data) di profil {perfiles}: program tersebut terbuka ke jaringan.',
      'doctor.firewall_no_comprobado':
        'Tidak dapat memeriksa firewall Windows (mungkin memerlukan izin administrator).',
      'doctor.firewall_reglas_ajenas':
        'Terdapat {cantidad} aturan masuk dari program lain (FlyEnv, Laragon, XAMPP, atau lainnya) dengan nginx, PHP, atau basis data di profil {perfiles}. Aturan tersebut bukan milik WolfCore Dev: hanya ditampilkan, tidak pernah dihapus dari sini.',
      'doctor.servicio_en_error': '{servicio} dalam status galat.',
      'doctor.revision_fallida': 'Tidak dapat menyelesaikan pemeriksaan {revision}.',
      'doctor.confirmacion_requerida': 'Konfirmasikan perbaikan sebelum menerapkannya.',
      'doctor.hallazgo_desconocido': 'Temuan tersebut sudah tidak ada: periksa kembali.',
      'doctor.solo_informa':
        'Temuan ini tidak memiliki perbaikan otomatis: ikuti petunjuk yang diberikan.',
      'doctor.reparacion_fallida': 'Tidak dapat menerapkan perbaikan.',
      'doctor.reparacion_cancelada': 'Izin administrator dibatalkan: tidak ada yang diubah.',
      'doctor.reparacion_denegada': 'Windows atau antivirus menolak akses: tidak ada yang diubah.',
      'doctor.ya_resuelto': 'Masalah sudah tidak ada: tidak perlu mengubah apa pun.',
      'doctor.ca_vieja_sin_quitar':
        'Otoritas sertifikat baru sudah digunakan, tetapi yang lama tidak dapat dihapus dari penyimpanan Windows. Anda dapat menghapusnya dari bagian HTTPS.',
      'doctor.sin_puerto_libre': 'Tidak ditemukan port kosong untuk memindahkan layanan.',
      'doctor.ca_vuelta_atras_incompleta':
        'Otoritas baru tidak dapat diterapkan dan pengembalian tidak selesai sepenuhnya. Periksa bagian HTTPS; terdapat cadangan bertanggal di etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox tidak mempercayai otoritas WolfCore Dev pada {cantidad} profil (menggunakan penyimpanan sendiri).',
      'confianza.sin_ca': 'Belum ada otoritas sertifikat: buat dari bagian HTTPS.',
      'confianza.sin_raices':
        'Tidak ditemukan sertifikat akar tepercaya untuk Python (baik certifi maupun milik Windows): tidak ada yang diubah.',
      'confianza.node_variable_ajena':
        'Anda sudah memiliki NODE_EXTRA_CA_CERTS sendiri: WolfCore Dev tidak menggantinya.',
      'confianza.variable_fallida': 'Tidak dapat mengubah variabel pengguna.',
      'firefox.abierto': 'Firefox sedang terbuka: tutup lalu coba lagi.',
      'firefox.error':
        'Tidak dapat mengubah user.js pada profil tersebut; file tetap seperti semula.',
      'firefox.fuera':
        'Ada profil di luar folder Firefox: aktifkan dari Kepercayaan CA, dengan konfirmasi terpisah.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS tidak lagi mengarah ke otoritas WolfCore Dev (diubah secara manual): tidak dihapus.',
      'ia.clave_invalida': 'Penyedia menolak kunci: periksa kembali atau buat kunci baru.',
      'ia.sin_saldo': 'Akun penyedia tidak memiliki saldo atau kuota yang tersedia.',
      'ia.limite': 'Penyedia membatasi permintaan: tunggu sebentar lalu coba lagi.',
      'ia.region': 'Penyedia tidak melayani negara atau wilayah Anda.',
      'ia.sin_red': 'Tidak dapat terhubung ke penyedia: periksa jaringan atau URL dasar.',
      'ia.url_invalida':
        'URL dasar tidak valid: gunakan https:// (atau http:// hanya ke 127.0.0.1 atau [::1]), tanpa nama pengguna atau kata sandi.',
      'ia.plazo': 'Penyedia tidak merespons dalam {segundos} dtk.',
      'ia.respuesta_rara': 'Penyedia mengembalikan respons yang tidak terduga.',
      'ia.cancelado': 'Permintaan ke penyedia dibatalkan.',
      'ia.sin_clave': 'Penyedia ini memerlukan kunci: simpan terlebih dahulu.',
      'ia.clave_mal_formada': 'Format kunci tidak valid (tanpa spasi atau jeda baris).',
      'ia.modelo_invalido': 'Nama model tidak valid.',
      'ia.modelo_no_disponible':
        'Model tidak ada atau akun Anda tidak memiliki akses ke model tersebut.',
      'ia.proveedor_invalido': 'Konfigurasi penyedia tidak valid.',
      'ia.env_conflicto':
        '.env sudah mendefinisikan {claves} dengan nilai lain: konfirmasikan jika Anda ingin menggantinya.',
      'ia.env_sin_confirmar':
        'Konfirmasikan bahwa Anda ingin menulis kunci ke dalam .env (disimpan dalam teks biasa).',
      'ia.env_versionado':
        'Git sudah melacak .env proyek ini: commit berikutnya akan mengunggah kunci tersebut meskipun ada di .gitignore. Hapus dari indeks dengan git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Tidak dapat memeriksa apakah git sudah melacak .env proyek ini: konfirmasikan secara terpisah bahwa Anda ingin menulis kunci.',
      'ia.proveedor_no_existe': 'Penyedia AI sudah tidak ada.',
      'ia.url_cambia_con_clave':
        'Penyedia memiliki kunci tersimpan: konfirmasikan bahwa Anda ingin mengirimkannya ke URL baru.',
      'ia.mensaje_sin_confirmar':
        'Konfirmasikan pengiriman pesan uji (menggunakan token akun Anda).',
      'ia.clave_ilegible':
        'Tidak dapat membaca kunci penyedia yang tersimpan: hapus lalu simpan kembali.',
      'ia.argumento_invalido': 'Data tidak valid ({campo}).',
      'correo.auth': 'Penyedia menolak nama pengguna atau kata sandi.',
      'correo.conexion': 'Tidak dapat terhubung ke server SMTP: periksa host dan port.',
      'correo.tls':
        'Tidak dapat membuat koneksi terenkripsi yang valid dengan server (sertifikat, nama, atau STARTTLS). Tidak ada yang dikirim.',
      'correo.rechazado':
        'Server menolak pesan atau salah satu alamat. Periksa pengirim: banyak penyedia hanya menerima pengirim atau domain yang terverifikasi.',
      'correo.plazo': 'Server tidak merespons tepat waktu (20 dtk).',
      'correo.host_invalido':
        'Server SMTP harus berupa nama host atau IP, tanpa skema, port, atau jalur.',
      'correo.host_local':
        'Server tersebut mengarah ke komputer ini atau jaringan lokal: konfirmasikan untuk menggunakannya.',
      'correo.destinatario_invalido': 'Alamat tujuan tidak valid.',
      'correo.proveedor_invalido': 'Data penyedia tidak valid.',
      'correo.proveedor_no_existe': 'Penyedia email sudah tidak ada.',
      'correo.sin_clave': 'Penyedia tidak memiliki kata sandi tersimpan.',
      'correo.clave_ilegible':
        'Tidak dapat membaca kata sandi penyedia yang tersimpan: hapus lalu simpan kembali.',
      'correo.cambia_con_clave':
        'Penyedia memiliki kata sandi tersimpan: konfirmasikan bahwa Anda ingin mengirimkannya ke server baru.',
      'correo.env_sin_confirmar':
        'Konfirmasikan bahwa Anda ingin menulis variabel email ke dalam .env.',
      'correo.ocupado': 'Pengujian pengiriman sedang berlangsung.',
      'correo.limite': 'Tunggu {segundos} dtk sebelum pengujian pengiriman berikutnya.',
      'correo.clave_mal_formada':
        'Format kata sandi tidak valid: hanya karakter yang dapat dicetak, tanpa jeda baris, dan maksimal 4096 karakter.',
      'correo.argumento_invalido': 'Data tidak valid ({campo}).',
      'agentes.no_existe': 'Agen tersebut tidak didukung.',
      'agentes.sin_confirmar': 'Konfirmasikan tindakan di dialog sebelum melanjutkan.',
      'agentes.no_instalable':
        'Agen ini tidak diinstal dari WolfCore Dev: ikuti panduan resmi ({guia}).',
      'agentes.sin_node': 'Instal Node dari Layanan untuk dapat menginstal agen.',
      'agentes.node_antiguo':
        '{agente} memerlukan Node {requerida} atau lebih baru, sedangkan yang akan digunakan adalah {actual}. Instal Node yang lebih baru dari Layanan.',
      'agentes.node_version_desconocida':
        'Tidak dapat mengetahui versi Node dan {agente} memerlukan Node {requerida} atau lebih baru. Periksa Node di Layanan.',
      'instalador.zip_demasiado_grande':
        'Paket yang diunduh terlalu besar atau berisi terlalu banyak file: tidak diinstal.',
      'rust.rustup_init_fallo': 'rustup-init tidak selesai dengan baik (kode {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Tidak dapat menginstal Rust {version} (kode {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Tidak dapat menghapus instalasi Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Tidak dapat mengunduh rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Tidak dapat menginstal agen: {detalle}',
      'agentes.no_instalado': '{agente} belum terinstal.',
      'agentes.mcp_no_soportado':
        '{agente} tidak mendokumentasikan cara mengambil token dari variabel lingkungan: MCP tidak didaftarkan untuknya.',
      'agentes.config_ilegible':
        'Tidak dapat memproses {archivo}; tidak diubah. Periksa secara manual.',
      'agentes.config_en_uso':
        '{archivo} berubah saat WolfCore Dev mengeditnya: tutup agen lalu coba lagi. Tidak ada yang diubah.',
      'agentes.proveedor_incompatible': '{agente} tidak dapat menggunakan penyedia AI tersebut.',
      'agentes.sin_cambios_preparados':
        'Tidak ada perubahan yang disiapkan (git add) untuk dideskripsikan.',
      'agentes.argumento_invalido': 'Data tidak valid ({campo}).',
      'git.commit_fallo': 'Tidak dapat membuat commit: {detalle}',
      'git.mensaje_invalido': 'Pesan commit kosong atau tidak valid.',
      'php.rama_no_instalada': 'PHP {rama} belum terinstal.',
      'php.argumento_invalido': 'Data tidak valid ({campo}).',
      'php.valor_invalido': 'Nilai untuk {clave} tidak valid.',
      'php.ini_invalido':
        'PHP tidak dapat dijalankan dengan php.ini tersebut; tidak ada yang disimpan. Keluaran: {salida}',
      'php.no_arranco':
        'PHP {rama} gagal dimulai ulang dengan perubahan tersebut; konfigurasi sebelumnya dipulihkan dan merespons seperti semula.',
      'php.caido_tras_restaurar':
        'PHP {rama} gagal dimulai ulang; konfigurasi sebelumnya telah dipulihkan, tetapi masih belum merespons. Periksa Layanan dan log PHP.',
      'php.respaldo_no_existe': 'Cadangan php.ini tersebut tidak ada.',
      'php.extension_no_existe': 'Ekstensi {nombre} tidak ada di folder ext pada versi ini.',
      'php.extension_no_catalogo': 'Ekstensi {nombre} tidak ada di katalog untuk versi ini.',
      'php.variante_desconocida': 'Tidak dapat mengetahui cara kompilasi PHP ini.',
      'php.sin_variante': 'Katalog tidak memiliki {nombre} untuk kompilasi {variante}.',
      'php.huella_distinta':
        'Unduhan tidak cocok dengan sidik jari yang dipublikasikan; tidak ada yang diinstal.',
      'php.descarga_fallida': 'Tidak dapat mengunduh ekstensi: {detalle}',
      'php.extension_en_uso': 'DLL {nombre} sedang digunakan. Hentikan PHP {rama} lalu coba lagi.',
      'php.extension_sin_dll':
        'Tidak dapat mengganti DLL {nombre} dan folder ext milik PHP {rama} tidak memilikinya. Hentikan PHP {rama} lalu coba lagi: DLL sebelumnya akan kembali ke tempatnya saat dijalankan.',
      'php.sitio_sin_php': 'Situs tersebut tidak menggunakan PHP.',
      'php.sitio_no_arranco':
        'PHP khusus milik {sitio} tidak merespons perubahan tersebut; dikembalikan ke konfigurasi sebelumnya.',
      'php.sin_puertos_sitio': 'Tidak ada lagi port kosong untuk PHP khusus milik situs.',
      'xdebug.launch_invalido':
        '.vscode/launch.json milik proyek tidak dapat diproses; tidak ada yang diubah.',
      'xdebug.launch_no_seguro':
        'Folder .vscode atau launch.json di dalamnya adalah tautan simbolis atau jenis lain: tidak ditulis di sana.',
      'xdebug.sin_configurar': 'Konfigurasikan Xdebug pada situs sebelum membuat launch.json.',
      'nginx.sitio_no_existe': 'Situs tersebut sudah tidak ada.',
      'nginx.texto_invalido':
        'Teks vhost terlalu panjang, kosong, atau mengandung karakter kontrol.',
      'nginx.sintaxis': 'Baris {linea}: {detalle}. Tidak ada yang diubah.',
      'nginx.directiva_prohibida':
        'Baris {linea}: "{directiva}" tidak diizinkan dalam vhost situs (dapat memengaruhi situs lain atau file di luar proyek). Tidak ada yang diubah.',
      'nginx.ruta_fuera':
        'Baris {linea}: "{directiva}" mengarah ke luar folder proyek atau log dan sertifikatnya. Tidak ada yang diubah.',
      'nginx.fuera_de_server':
        'Baris {linea}: vhost lengkap hanya boleh berisi blok "server"; "{directiva}" berada di luar. Tidak ada yang diubah.',
      'nginx.dominio_ajeno':
        'Baris {linea}: "{nombre}" bukan domain dari situs ini. Tambahkan sebagai alias situs terlebih dahulu.',
      'nginx.puerto_ajeno':
        'Baris {linea}: situs hanya dapat mendengarkan pada port Nginx yang dikonfigurasi di Pengaturan.',
      'nginx.version_no_existe': 'Versi vhost tersebut sudah tidak ada di riwayat.',
      'nginx.argumento_invalido': 'Argumen tidak valid: {campo}',
      'nginx.destino_interno':
        'Baris {linea}: "{directiva}" mengarah ke layanan internal WolfCore Dev (Adminer, Mailpit, basis data, PHP situs lain…) dan akan mengeksposnya ke jaringan serta terowongan. Tidak ada yang diubah.',
      'nginx.caido_tras_restaurar':
        'Nginx gagal merespons kembali: vhost sebelumnya telah dipulihkan, tetapi masih belum merespons. Periksa Layanan dan log Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'Port {puerto} sudah digunakan: penangkap dump tidak dapat mendengarkan. Tutup program yang menggunakannya (misalnya server:dump dari Symfony).',
      'depuracion.no_iniciado': 'Penangkap dump sedang mati.',
      'depuracion.tipo_no_soportado': 'Perekaman dump hanya untuk situs PHP dan FastAPI.',
      'depuracion.confirmacion': 'Konfirmasikan perekaman dump di kotak dialog.',
      'depuracion.argumento_invalido': 'Argumen tidak valid: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'File tersebut tidak berada di dalam folder situs: tidak dibuka di editor.',
      'contenedores.motor_invalido': 'Mesin kontainer tidak dikenal.',
      'contenedores.id_invalido': 'ID kontainer tidak valid.',
      'contenedores.argumento_invalido': 'Argumen tidak valid: {campo}',
      'contenedores.sin_motor': '{motor} tidak terpasang di komputer ini.',
      'contenedores.no_responde':
        '{motor} tidak merespons. Buka Docker Desktop atau jalankan mesin Podman lalu coba lagi.',
      'contenedores.remoto':
        'Koneksi bawaan {motor} mengarah ke komputer lain: WolfCore Dev hanya menggunakan mesin lokal.',
      'contenedores.no_existe': 'Kontainer sudah tidak ada. Segarkan daftar.',
      'contenedores.accion_fallo': 'Mesin tidak dapat melakukannya: {detalle}',
      'contenedores.demasiados_registros':
        'Anda dapat mengikuti maksimal {maximo} log kontainer secara bersamaan.',
      'contenedores.sin_confirmar': 'Konfirmasikan tindakan di kotak dialog.',
      'catalogo.indice_invalido':
        'Indeks versi {servicio} gagal divalidasi; daftar tersimpan digunakan.',
      'catalogo.sin_huella':
        '{servicio} {version} tidak memiliki checksum yang dipublikasikan: konfirmasikan pemasangan di kotak dialog.',
      'catalogo.huella_debil':
        '{servicio} {version} hanya memiliki checksum lemah (MD5 atau SHA-1): konfirmasikan pemasangan di kotak dialog.',
      'catalogo.huella_no_coincide': 'Unduhan tidak cocok dengan checksum yang dipublikasikan.',
      'catalogo.redireccion_ajena':
        'Unduhan mencoba mengarah ke situs yang tidak diizinkan ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Unduhan melakukan terlalu banyak pengalihan (lebih dari {maximo}).',
      'catalogo.respuesta_grande': 'Respons server terlalu besar.',
      'catalogo.version_no_encontrada': 'Versi {version} dari {servicio} tidak ada di katalog.',
      'catalogo.huella_no_disponible':
        'Tidak dapat memperoleh checksum {servicio} {version} (tanpa koneksi atau sumber tidak merespons). Coba lagi.',
      'catalogo.firma_invalida':
        'Tanda tangan PGP {servicio} {version} tidak valid atau tidak dipublikasikan: tidak ada yang dipasang.',
      'catalogo.firma_no_soportada':
        'Tanda tangan PGP {servicio} {version} menggunakan format yang tidak diverifikasi oleh WolfCore Dev: tidak ada yang dipasang.',
      'catalogo.clave_desconocida':
        'Tanda tangan {servicio} {version} berasal dari kunci yang tidak ada dalam kunci tersemat aplikasi: tidak ada yang dipasang.',
      'catalogo.firma_vencida':
        'Tanda tangan {servicio} {version} atau kuncinya sudah kedaluwarsa: tidak ada yang dipasang. Perbarui WolfCore Dev untuk mendapatkan kunci terbaru.',
      'catalogo.reloj_atrasado':
        'Tanda tangan {servicio} {version} bertanggal di masa depan: periksa tanggal dan waktu komputer Anda lalu coba lagi.',
      'acceso_bd.datos_invalidos': 'Data akses basis data tidak valid.',
      'acceso_bd.sin_base': 'File .env proyek ini tidak mengarah ke basis data.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin hanya membuka basis data MySQL dan MariaDB; gunakan Adminer untuk PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'Basis data proyek ini bukan berasal dari server lokal WolfCore Dev.',
      'acceso_bd.no_listo': 'Alat belum siap: pasang melalui Layanan dan nyalakan PHP.',
      'auditoria.tabla_invalida': 'Tabel tidak ada di basis data tersebut.',
      'auditoria.columna_invalida':
        'Kolom tidak ada di tabel tersebut (dan kolom pengguna serta kolom hash harus berbeda).',
      'auditoria.usuario_no_encontrado': 'Tidak ada akun dengan pengguna tersebut.',
      'auditoria.usuario_repetido':
        'Ada lebih dari satu akun dengan pengguna tersebut: tidak diatur ulang agar tidak mengubah akun yang salah.',
      'auditoria.formato_no_soportado':
        'Format hash saat ini tidak dapat direproduksi: tidak diatur ulang.',
      'auditoria.clave_larga':
        'bcrypt hanya menggunakan 72 byte pertama dari kata sandi: pilih kata sandi yang lebih pendek.',
      'auditoria.clave_invalida': 'Kata sandi baru tidak valid.',
      'auditoria.sin_confirmar': 'Konfirmasikan bahwa Anda ingin mengatur ulang kata sandi ini.',
      'auditoria.respaldo_previo_fallo':
        'Tidak dapat menyimpan salinan basis data sebelum pengaturan ulang: tidak ada yang diubah.',
      'auditoria.copia_fallo': 'Tidak dapat menyimpan salinan baris: tidak ada yang diubah.',
      'auditoria.motor_no_soportado':
        'Audit kata sandi hanya untuk MySQL, MariaDB, dan PostgreSQL.',
      'auditoria.cancelada': 'Audit dibatalkan.',
      'auditoria.usuario_invalido': 'Pengguna harus terdiri dari 1 hingga 256 karakter.',
      'auditoria.en_curso':
        'Sudah ada audit yang sedang berlangsung: tunggu hingga selesai atau batalkan.',
      'auditoria.base_sistema': 'Basis data sistem tidak diaudit: pilih basis data proyek.',
      'auditoria.esquema_invalido': 'Skema tidak ada di basis data tersebut.',
      'auditoria.fila_cambio': 'Akun berubah sementara itu: tidak diatur ulang. Coba lagi.',
      'auditoria.verificacion_fallo':
        'Basis data tidak menyimpan kata sandi sesuai yang diharapkan: perubahan dibatalkan.',
      'auditoria.columna_corta':
        'Kolom hash menampung {largo} karakter dan hash baru membutuhkan {necesario}: tidak ada yang diubah. Perbesar ukuran kolom.',
      'auditoria.datos_reales_sin_confirmar':
        'Basis data ini berisi data asli pelanggan: pengaturan ulang kata sandi memerlukan konfirmasi tambahan.',
      'instantaneas.id_invalido': 'Snapshot tidak valid.',
      'instantaneas.no_encontrada': 'Snapshot tidak ditemukan; mungkin sudah dihapus.',
      'instantaneas.otra_base':
        'Snapshot ini milik basis data lain: tidak dapat diterapkan ke basis data ini.',
      'instantaneas.sin_confirmar': 'Konfirmasikan bahwa Anda ingin kembali ke snapshot ini.',
      'instantaneas.motor_no_soportado': 'Snapshot hanya untuk MySQL, MariaDB, dan PostgreSQL.',
      'instantaneas.demasiado_grande':
        'Ukuran basis data lebih dari {maximo} MB, batas maksimum yang dapat disimpan oleh snapshot.',
      'instantaneas.sin_espacio':
        'Ruang kosong tidak mencukupi untuk snapshot: dibutuhkan {necesarios} MB dan tersedia {libres} MB.',
      'instantaneas.limite':
        'Sudah ada {maximo} snapshot untuk basis data ini: hapus salah satu untuk mengambil yang baru.',
      'instantaneas.tomar_fallo': 'Tidak dapat mengambil snapshot. Basis data tidak diubah.',
      'instantaneas.huella_no_coincide':
        'File snapshot telah berubah atau rusak: tidak ada yang dipulihkan.',
      'instantaneas.respaldo_previo_fallo':
        'Tidak dapat menyimpan kondisi basis data saat ini: tidak ada yang dipulihkan.',
      'instantaneas.restauracion_fallo':
        'Tidak dapat memulihkan snapshot. Basis data dikembalikan ke kondisi sebelumnya. Alasan: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Tidak dapat memulihkan snapshot dan kondisi sebelumnya tidak sempat disimpan: basis data mungkin kosong atau tidak lengkap. Alasan: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Tidak dapat memulihkan snapshot maupun kembali ke kondisi sebelumnya. Kondisi tersebut tersimpan di snapshot otomatis {respaldo}: pulihkan dari menu Snapshot.',
    },
  },
  instantaneas: {
    abrir: 'Snapshot',
    titulo: (base: string) => `Snapshot dari ${base}`,
    ayuda:
      'Snapshot menyimpan kondisi basis data saat ini. Anda dapat kembali ke kondisi tersebut kapan saja: sebelum kembali, snapshot dari kondisi saat ini akan disimpan secara otomatis.',
    ubicacion:
      'Disimpan di folder data WolfCore Dev, hanya dapat dibaca oleh pengguna Anda. Layanan dan datanya tidak diubah.',
    notaEtiqueta: 'Catatan (opsional)',
    notaMarcador: 'Misalnya: sebelum migrasi',
    tomar: 'Ambil snapshot',
    tomada: 'Snapshot tersimpan',
    cargando: 'Membaca snapshot…',
    vacio: 'Belum ada snapshot untuk basis data ini.',
    automatica: 'Otomatis',
    sinNota: 'Tanpa catatan',
    detalle: (tablas: number, tamano: string) => `${tablas} tabel · ${tamano}`,
    volver: 'Kembali ke snapshot ini',
    borrar: 'Hapus',
    borrada: 'Snapshot dipindahkan ke tempat sampah',
    papelera:
      'Snapshot yang dihapus dapat dipulihkan selama 7 hari dari tempat sampah WolfCore Dev.',
    cerrar: 'Tutup',
    papeleraTitulo: 'Tempat sampah',
    papeleraVacia: 'Tidak ada snapshot di tempat sampah.',
    recuperar: 'Pulihkan',
    recuperada: 'Snapshot dipulihkan',
    borradaEl: (fecha: string) => `Dihapus pada ${fecha}`,
    borrarPregunta: 'Pindahkan snapshot ini ke tempat sampah?',
    borrarSi: 'Pindahkan ke tempat sampah',
    notaAutomatica: (fecha: string) =>
      `Kondisi sebelumnya, disimpan sebelum kembali ke snapshot tanggal ${fecha}`,
    notaAutomaticaSinOrigen: 'Kondisi sebelumnya, disimpan sebelum kembali ke snapshot lain',
    extensionesAviso: (lista: string) =>
      `Memuat ekstensi PostgreSQL (${lista}) yang hanya dipulihkan dengan catatan checksum komputer ini.`,
    limites:
      'Di MySQL dan MariaDB, rutinitas, pemicu, dan event juga ikut disimpan. Di PostgreSQL, ini adalah dump terkompresi dari satu basis data saja: tidak mencakup peran maupun pengguna server. Snapshot yang tidak dapat diverifikasi sebagai milik komputer ini akan dipulihkan dengan pengguna yang terbatas pada basis data, sehingga tidak mendukung view, rutinitas, maupun pemicu milik pengguna lain.',
    basesBorradas: 'Snapshot basis data yang sudah tidak ada',
    basesBorradasAyuda: 'Pilih basis data untuk membuatnya kembali dari snapshot-nya.',
    dialogoVolver: {
      titulo: (base: string) => `Kembali ke snapshot ${base}`,
      cargando: 'Menyiapkan pratinjau…',
      base: 'Basis data',
      instantanea: 'Snapshot',
      ahora: 'Sekarang',
      tamano: 'Ukuran',
      tablas: 'Tabel',
      nota: 'Catatan',
      aviso: (base: string) =>
        `Basis data ${base} akan diganti sepenuhnya oleh snapshot ini: semua perubahan sejak saat itu akan hilang dari basis data. Sebelumnya, snapshot otomatis dari kondisi saat ini akan disimpan; jika terjadi kegagalan, basis data akan otomatis kembali ke kondisi tersebut.`,
      pedir: (base: string) => `Untuk mengonfirmasi, ketik ${base}`,
      confirmar: 'Kembali ke snapshot ini',
      trabajando: (base: string) => `Memulihkan ${base}… Jangan tutup program hingga selesai.`,
      hecho: (base: string) => `Basis data ${base} telah kembali ke snapshot`,
      respaldoPrevio: 'Kondisi sebelumnya tersimpan di snapshot otomatis tanggal',
      advertencias: 'Pemulihan selesai dengan pemberitahuan:',
      hechoConAvisos: (base: string) =>
        `Basis data ${base} kembali ke snapshot, dengan pemberitahuan`,
      baseVacia: 'Basis data tidak ada atau kosong: tidak ada yang perlu disimpan sebelum kembali.',
      sinGuardarTitulo: 'Tidak dapat menyimpan kondisi saat ini',
      sinGuardarTexto:
        'WolfCore Dev tidak dapat menyimpan kondisi basis data saat ini sebelum kembali. Jika Anda melanjutkan TANPA menyimpannya dan pemulihan gagal, data basis data saat ini akan hilang.',
      sinGuardarConfirmar: 'Saya memahami bahwa data basis data saat ini akan hilang',
      sinGuardarBoton: 'Kembali tanpa menyimpan kondisi saat ini',
    },
  },
  avisoInicio: {
    titulo: 'Pemberitahuan WolfCore Dev',
  },
  tareas: {
    titulo: 'Tugas terjadwal',
    resumen: (n: number) => (n === 0 ? 'Tidak ada tugas' : `${n} tugas`),
    mostrar: 'Lihat tugas',
    ocultar: 'Sembunyikan',
    cargando: 'Memuat tugas',
    errorCargar: 'Tidak dapat memuat tugas',
    soloAbierta:
      'Tugas hanya berjalan selama WolfCore Dev terbuka. Tugas tidak menggunakan Penjadwal Tugas Windows: saat aplikasi ditutup atau komputer dalam mode tidur, tugas tidak dijalankan, dan eksekusi yang terlewat tidak akan dijalankan ulang.',
    repoEjecuta:
      'Pada proyek tepercaya, apa yang ada di dalam repositori dijalankan apa adanya: file yang disebutkan oleh tugas, `artisan`, skrip `package.json`, `.venv`… Jika berubah saat `git pull`, tugas akan menjalankan versi baru.',
    vacio:
      'Proyek ini belum memiliki tugas terjadwal. Buat satu (misalnya "php artisan schedule:run" setiap menit pada proyek Laravel).',
    nueva: 'Tugas baru',
    pausada: 'dijeda',
    enCurso: 'Sedang berjalan…',
    nunca: 'Belum pernah dijalankan',
    ultima: (f: string) => `Terakhir: ${f}`,
    proxima: (f: string) => `berikutnya: ${f}`,
    codigo: (n: number) => `kode ${n}`,
    resultadoTitulo: (n: string) => `"${n}"`,
    origen: { usuario: 'ditulis di sini', 'wolfcore.yml': 'dari wolfcore.yml' },
    describir: {
      cadaMinuto: 'Setiap menit',
      cadaN: (n: number) => `Setiap ${n} menit`,
      cadaHora: 'Setiap jam, tepat waktu',
      diaria: (h: string) => `Setiap hari pukul ${h}`,
      laborables: (h: string) => `Senin hingga Jumat pukul ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Berhasil',
      fallo: 'Gagal',
      tiempo: 'Melebihi batas waktu',
      cancelada: 'Dibatalkan',
      omitida: 'Dilewati',
      bloqueada: 'Tidak dijalankan',
    },
    motivo: {
      aislado:
        'Ini adalah folder data uji (WOLFCORE_DATOS): tidak berjalan hingga Anda mengizinkan tugas pada sesi ini.',
      no_confiado:
        'Proyek tidak ditandai sebagai tepercaya: centang "Saya memercayai repositori ini" agar dapat berjalan.',
      receta_cambio:
        'Resep proyek berubah sejak Anda memercayainya: tinjau kembali lalu centang ulang "Saya memercayai repositori ini".',
      sin_confirmar:
        'Perintahnya belum dikonfirmasi: tidak dijalankan hingga Anda meninjau dan mengonfirmasinya.',
      comando_invalido: 'Perintahnya tidak diizinkan (hanya php, node, npm run, dan python).',
      cron_invalida: 'Jadwalnya bukan ekspresi cron yang valid.',
      carpeta: 'Folder proyek tidak ada.',
      solapada: 'Eksekusi sebelumnya masih berjalan: eksekusi ini dilewati.',
      retraso: 'Terlambat (aplikasi sedang ditangguhkan): tidak dijalankan ulang.',
      error: 'Tidak dapat menjalankan program.',
    },
    acciones: {
      ejecutar: 'Jalankan sekarang',
      editar: 'Edit',
      borrar: 'Hapus',
      verRegistro: 'Lihat log',
      revisarConfirmar: 'Tinjau dan konfirmasi',
      activar: (n: string) => `Aktifkan tugas ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Hapus "${n}"?`,
      texto:
        'Tugas dan riwayatnya akan dihapus. Apa yang sudah dijalankan tidak dibatalkan dan file proyek tidak diubah.',
      confirmar: 'Hapus',
      hecho: (n: string) => `Tugas "${n}" dihapus.`,
    },
    aislado: {
      titulo: 'Folder data uji.',
      texto:
        'Dengan WOLFCORE_DATOS, tidak ada tugas yang berjalan otomatis. Izinkan hanya jika Anda ingin mengujinya pada sesi ini.',
      permitir: 'Izinkan pada sesi ini',
      confirmarTitulo: 'Izinkan tugas di folder uji ini?',
      confirmarTexto:
        'Tugas aktif dari proyek tepercaya akan mulai berjalan hingga Anda menutup aplikasi. Perintah berasal dari masing-masing proyek dan berjalan di folder aslinya.',
      permitido: 'Tugas diizinkan pada sesi ini.',
    },
    yml: {
      titulo: 'Usulan dari wolfcore.yml',
      texto:
        'File proyek mengusulkan tugas-tugas ini. Tidak ada yang berjalan hanya karena tertulis di sana: tinjau perintahnya dan konfirmasikan untuk mengadopsinya.',
      estado: { nueva: 'Baru', adoptada: 'Diadopsi', cambiada: 'Berubah' },
      revisar: 'Tinjau dan adopsi',
      cambiada:
        'Perintah di wolfcore.yml berubah sejak Anda mengadopsinya. Tugas proyek tetap menggunakan perintah yang Anda konfirmasi; adopsi versi baru jika Anda mengenalinya.',
      guardarEn: 'Simpan ke wolfcore.yml',
      escribirTitulo: 'Tulis tugas ke wolfcore.yml?',
      escribirTexto:
        'Tugas akan ditambahkan atau diperbarui di file proyek (tanpa mengubah bagian lain) agar ikut bersama repositori. Siapa pun yang mengkloningnya harus mengonfirmasinya di komputernya.',
      escribir: 'Tulis',
      escrita: 'Tugas disimpan ke wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Log "${n}"`,
      historial: 'Eksekusi terakhir',
      sinHistorial: 'Belum ada eksekusi.',
      salida: 'Keluaran eksekusi terakhir',
      sinSalida: 'Tidak ada keluaran yang tersimpan.',
      enmascarado:
        'Log menyembunyikan kata sandi dan kunci, memiliki ukuran maksimum, dan berotasi otomatis.',
      origen: { programada: 'terjadwal', manual: 'manual' },
    },
    dialogo: {
      tituloNueva: 'Tugas terjadwal baru',
      tituloEditar: 'Edit tugas terjadwal',
      tituloAdoptar: 'Adopsi tugas dari wolfcore.yml',
      tituloConfirmar: 'Konfirmasi perintah tugas',
      nombre: 'Nama',
      nombrePlaceholder: 'Tugas Laravel',
      horario: 'Kapan',
      preset: {
        cadaMinuto: 'Setiap menit',
        cadaN: 'Setiap beberapa menit',
        cadaHora: 'Setiap jam',
        diaria: 'Setiap hari pada jam tertentu',
        laborables: 'Senin hingga Jumat pada jam tertentu',
        personalizada: 'Ekspresi cron khusus',
      },
      cadaNOpcion: (n: number) => `Setiap ${n} menit`,
      hora: 'Jam',
      horaPlaceholder: '03:00',
      horaInvalida: 'Masukkan jam yang valid, misalnya 03:00.',
      expresion: 'Ekspresi cron',
      cronEquivale: 'Ekspresi cron:',
      expresionAyuda:
        '5 bidang: menit, jam, hari dalam bulan, bulan, dan hari dalam minggu (* , - /). Minimum, satu kali per menit.',
      proximas: 'Eksekusi berikutnya:',
      comando: 'Perintah',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Hanya php, node, npm run, dan python, dengan file dari proyek. Berjalan di folder proyek, tanpa shell dan tanpa kode sebaris (-r, -e, -c).',
      comandoFijo:
        'Perintah ini memiliki argumen bertanda kutip yang tidak dapat ditulis sebagai teks: dipertahankan apa adanya dan tidak dapat diedit di sini (hapus lalu buat baru jika perlu mengubahnya).',
      argumentos: 'Akan dijalankan dengan argumen berikut:',
      comillasSinCerrar: 'Ada tanda kutip yang belum ditutup.',
      tiempo: 'Batas waktu',
      minutos: 'menit',
      tiempoAyuda:
        'Jika berjalan lebih lama, akan dihentikan otomatis (hanya proses tersebut dan proses turunannya).',
      activa: 'Aktif (berjalan otomatis selama aplikasi terbuka)',
      advertencia:
        'Dengan menyetujui, Anda mengizinkan perintah persis ini: perintah akan berjalan otomatis di folder proyek ini setiap kali jadwal tiba. Jika Anda mengubahnya, Anda harus mengonfirmasinya kembali.',
      revise: 'Saya telah meninjau perintah ini dan mengenalinya.',
      guardar: 'Simpan dan konfirmasi perintah',
      adoptar: 'Konfirmasi dan adopsi',
      confirmar: 'Konfirmasi perintah',
      guardada: 'Tugas tersimpan.',
      adoptada: 'Tugas diadopsi.',
      confirmada: 'Perintah dikonfirmasi.',
    },
  },
  workspaces: {
    titulo: 'Workspace',
    descripcion:
      'Kumpulan bernama berisi basis data, layanan, dan proses yang dinyalakan dan dimatikan secara bersamaan.',
    nuevo: 'Workspace baru',
    vacio:
      'Belum ada workspace. Buat satu, misalnya "Bot FastAPI" dengan PostgreSQL, Redis, Ollama, dan proses proyek Anda.',
    elementos: (n: number) => `${n} elemen`,
    sinElementos: 'Tanpa elemen',
    estado: { apagado: 'Nonaktif', parcial: 'Sebagian', encendido: 'Aktif' },
    acciones: {
      iniciar: 'Nyalakan',
      detener: 'Matikan',
      editar: 'Edit',
      borrar: 'Hapus',
      cerrar: 'Tutup',
    },
    borrar: {
      titulo: (n: string) => `Hapus "${n}"?`,
      texto:
        'Menghapus workspace tidak mematikan atau menghapus apa pun: hanya menghapus kumpulan tersebut. Apa yang sedang menyala tetap menyala.',
      confirmar: 'Hapus',
      hecho: (n: string) => `Workspace "${n}" dihapus.`,
    },
    dialogo: {
      tituloNuevo: 'Workspace baru',
      tituloEditar: 'Edit workspace',
      nombre: 'Nama',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Masukkan nama.',
      aviso:
        'Workspace hanya menyimpan apa yang perlu dinyalakan. Tidak membuka terowongan, tidak berbagi di jaringan lokal, dan tidak menyalakan proses dari proyek yang tidak Anda percayai.',
      secciones: {
        instancias: 'Basis data',
        servicios: 'Layanan',
        procesos: 'Proses proyek',
      },
      sinOpciones: 'Tidak ada yang dapat dipilih di sini.',
      captadorUnico:
        'Hanya satu penangkap email dalam satu waktu: memilih yang lain akan menggantikan yang sebelumnya.',
      yaNoExisten: (lista: string) => `Sudah tidak ada dan akan dihapus saat disimpan: ${lista}`,
      guardar: 'Simpan',
      guardado: (n: string) => `Workspace "${n}" tersimpan.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `"${n}": hasil saat menyalakan`,
      tituloDetener: (n: string) => `"${n}": hasil saat mematikan`,
      encendido: 'Menyala',
      apagado: 'Mati',
      yaEncendido: 'Sudah menyala',
      yaApagado: 'Sudah mati',
      noExiste: 'Sudah tidak ada: diabaikan',
      compartido: 'Tetap menyala: digunakan oleh workspace lain yang aktif',
      reemplaza: (otro: string) => `Menyala; mematikan ${otro}, dari grup email yang sama`,
      fallo: 'Gagal menyala',
      falloApagar: 'Tetap menyala',
      ok: (n: string) => `"${n}" siap.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `"${n}": ${encendidos} dari ${total} menyala. Periksa yang gagal berjalan.`,
      parcialApagar: (n: string, siguen: number) =>
        `"${n}": ${siguen} masih menyala. Periksa yang gagal dimatikan.`,
    },
  },
  inicio: {
    titulo: 'Beranda',
    bienvenida: 'Lingkungan pengembangan Anda, sekilas pandang.',
    tiles: {
      servicios: 'Layanan aktif',
      serviciosDe: (total: number) => `dari ${total}`,
      sitios: 'Proyek',
      tuneles: 'Terowongan aktif',
      hosts: 'Hosts tertunda',
      hostsOk: 'Semua beres',
      hostsFaltan: 'Perlu perhatian',
    },
    hosts: {
      titulo: 'Ada domain yang belum terdaftar di file hosts',
      texto:
        'Domain ini belum mengarah ke komputer Anda. Saat memperbaikinya, Windows akan meminta izin administrator.',
      corregir: 'Terapkan hosts tertunda',
      reintentarPermiso: 'Coba lagi dengan izin',
      corregido: 'File hosts diperbarui',
      fallo: 'Tidak dapat memperbarui file hosts',
      verInstrucciones: 'Lihat petunjuk',
      duplicados: 'Domain ini sudah ada di hosts di luar blok WolfCore Dev (tetap dipertahankan):',
      motivos: {
        cancelado: 'Izin administrator dibatalkan. File hosts tidak berubah.',
        tiempo:
          'Tidak ada yang merespons izin administrator tepat waktu. Situs telah disimpan; file hosts tidak berubah. Jika Anda masih melihat pemberitahuan Windows, batalkan saja (tidak akan berpengaruh lagi). Terapkan yang tertunda saat Anda sempat (satu izin untuk semua).',
        denegado:
          'Windows tidak mengizinkan penulisan file hosts. Kemungkinan diblokir oleh antivirus.',
      } as Record<string, string>,
      modalTitulo: 'Perbaiki hosts secara manual',
      modalTexto:
        'Buka PowerShell sebagai administrator (klik kanan pada Start → Terminal (Administrator)), tempel perintah ini, lalu tekan Enter.',
    },
    servicios: {
      titulo: 'Layanan',
      ver: 'Lihat layanan',
      vacio: 'Belum ada layanan yang terpasang.',
    },
    tuneles: {
      titulo: 'Terowongan aktif',
      vacio: 'Tidak ada terowongan yang terbuka. Anda dapat membukanya dari Proyek.',
      sitioDesconocido: 'Situs tanpa nama',
    },
  },
  servicios: {
    titulo: 'Layanan',
    descripcion:
      'Nyalakan dan matikan server web, PHP, basis data, dan alat lainnya. Status diperbarui secara otomatis.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Basis data',
      correo: 'Email',
      ia: 'AI',
      herramientas: 'Alat',
    },
    gruposAyuda: {
      web: 'Server yang melayani domain .test.',
      php: 'Satu pemasangan per versi (8.3, 8.4…); setiap situs menggunakan versinya sendiri.',
      bd: 'Hanya mendengarkan di 127.0.0.1.',
      correo: 'Menangkap email yang dikirim proyek Anda, tanpa keluar ke internet.',
      ia: 'Model bahasa di komputer Anda.',
      herramientas: 'Utilitas untuk kebutuhan sehari-hari.',
    },
    puerto: 'Port',
    cambiarPuerto: 'Ubah port',
    cambiarPuertoDe: (nombre: string) => `Ubah port ${nombre}`,
    versionesDe: (nombre: string) => `Versi ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instans, ${encendidas} aktif`,
    usarPuerto: (p: number) => `Gunakan port ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} sekarang menggunakan port ${p}`,
    conflicto: 'Port sedang digunakan',
    autoIniciar: 'Nyalakan saat WolfCore Dev dimulai',
    autoIniciarActivado: (nombre: string) => `${nombre} akan menyala saat WolfCore Dev dimulai`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} tidak lagi menyala saat WolfCore Dev dimulai`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Port ${nombre}`,
      etiqueta: 'Port baru',
      ayuda:
        'Antara 1024 dan 65535 serta tidak sedang digunakan. Jika layanan aktif, layanan akan dimulai ulang. Perbarui .env proyek Anda.',
      rango: 'Gunakan angka antara 1024 dan 65535',
      igual: 'Ini adalah port saat ini',
      guardar: 'Ubah port',
    },
    borrarDatos: {
      opcion: 'Hapus data',
      titulo: (nombre: string) => `Hapus data ${nombre}`,
      copias: (n: number, tam: string) =>
        `${n} salinan pembaruan (${tam}) juga akan dihapus. Jika Anda ingin menyimpannya, salin terlebih dahulu dari folder data.`,
      /** Apa yang akan hilang, bergantung pada layanan. */
      que: {
        mysql: 'semua basis data dan pengguna MySQL',
        mariadb: 'semua basis data dan pengguna MariaDB',
        postgresql: 'semua basis data dan pengguna PostgreSQL',
        redis: 'semua kunci dan data yang tersimpan di Redis',
        mongodb: 'semua basis data, koleksi, dan data MongoDB',
        mailpit: 'semua email yang ditangkap oleh Mailpit',
        smtp4dev: 'semua email yang ditangkap oleh smtp4dev',
        inbucket: 'semua email yang ditangkap oleh Inbucket',
        papercut: 'semua email yang ditangkap oleh Papercut SMTP',
        ollama: 'semua model yang diunduh oleh Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `${que} akan dihapus. Tindakan ini tidak dapat dibatalkan. Program tetap terpasang.`,
      generico: (nombre: string) => `semua data ${nombre}`,
      pedir: (id: string) => `Untuk mengonfirmasi, ketik ${id}`,
      boton: 'Hapus data',
      hecho: (nombre: string) => `Data ${nombre} telah dihapus`,
    },
    ftp: {
      interruptor: 'Server FTP',
      redLocal: 'Izinkan koneksi dari jaringan lokal',
      avisoTitulo: 'Buka FTP ke jaringan lokal',
      avisoTexto:
        'FTP mengirim nama pengguna, kata sandi, dan file tanpa enkripsi. Perangkat apa pun di jaringan Anda dapat mencoba terhubung. Gunakan hanya di jaringan tepercaya.',
      avisoConfirmar: 'Izinkan',
      redLocalActivada: 'FTP menerima koneksi dari jaringan lokal',
      redLocalDesactivada: 'FTP hanya menerima koneksi dari perangkat ini',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Pengelola dependensi PHP',
      instalado: 'Terpasang',
      noInstalado: 'Belum terpasang',
      sinVersion: 'belum terpasang',
      uso: 'Penggunaan',
      usoTexto: 'composer',
      ayuda:
        'Gunakan "Terminal" di dalam proyek, atau tambahkan WolfCore Dev ke PATH di Pengaturan.',
      instaladoOk: 'Composer terpasang',
      sinPhp: 'Pasang PHP terlebih dahulu',
      actualizado: (v: string) => `Composer diperbarui: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Pengelola basis data berbasis web',
      direccion: 'Alamat',
      disponible: 'Siap',
      noInstalado: 'Belum terpasang',
      sinPhp: 'PHP belum tersedia',
      abrir: 'Buka Adminer',
      instaladoOk: 'Adminer terpasang',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Pengelola web untuk MySQL dan MariaDB',
      direccion: 'Alamat',
      disponible: 'Siap',
      noInstalado: 'Belum terpasang',
      sinPhp: 'PHP belum tersedia',
      abrirDesdeProyecto: 'Dibuka dari kartu setiap proyek, dalam keadaan sudah terautentikasi.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} tidak mengaktifkan ekstensi ${ext}. Mulai ulang PHP atau aktifkan di php.ini Anda.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin mendukung hingga PHP 8.3 dan saat ini menggunakan PHP ${rama}: kesalahan mungkin muncul. Nyalakan versi PHP 7.2 hingga 8.3 jika terjadi masalah.`,
      instalarPrimero: 'Pasang phpMyAdmin untuk menggunakannya.',
      encenderPhp: 'Nyalakan PHP untuk menggunakan phpMyAdmin.',
      instaladoOk: 'phpMyAdmin terpasang',
    },
    puertos: 'Port',
    pid: 'PID',
    sinVersion: 'tanpa versi',
    sinPuertos: '—',
    terminado: 'Selesai tanpa kesalahan',
    externo: 'Dikelola di luar WolfCore Dev',
    verDetalle: 'Lihat detail kesalahan',
    vacioTitulo: 'Belum ada layanan',
    vacio:
      'Belum ada layanan yang terpasang. Mulailah dengan Nginx dan PHP untuk situs Anda, atau dengan basis data.',
    irAInstalar: 'Ke halaman Pasang',
  },
  bd: {
    descripcion:
      'Buat, cadangkan, dan pulihkan basis data proyek Anda. Server hanya mendengarkan pada 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Basis data baru',
    restaurar: 'Pulihkan cadangan',
    importar: 'Impor dari server lain',
    soloSql: 'Tersedia di MySQL, MariaDB, dan PostgreSQL',
    enCursoAyuda: 'Tunggu hingga operasi yang sedang berlangsung selesai',
    encenderPrimero: (motor: string) => `Nyalakan ${motor} terlebih dahulu`,
    cargando: 'Memuat basis data…',
    recargar: 'Muat ulang daftar',
    vacioTitulo: 'Belum ada server basis data yang terpasang',
    vacio:
      'Pasang MySQL, MariaDB, PostgreSQL, atau MongoDB dari Layanan untuk mengelola basis data Anda.',
    irAServicios: 'Ke Layanan',
    apagado: {
      titulo: (motor: string) => `${motor} tidak aktif`,
      texto: (motor: string) => `Nyalakan ${motor} untuk melihat dan mengelola basis data Anda.`,
      iniciando: (motor: string) => `${motor} sedang dinyalakan…`,
      error: (motor: string) => `${motor} gagal dinyalakan`,
      encender: (motor: string) => `Nyalakan ${motor}`,
      verServicios: 'Lihat di Layanan',
    },
    errorLista: 'Gagal membaca daftar basis data',
    sinBases: 'Server ini belum memiliki basis data sendiri.',
    total: (n: number) => plural(n, 'basis data'),
    columnas: { nombre: 'Basis data', tamano: 'Ukuran', acciones: 'Tindakan' },
    acciones: {
      respaldar: 'Cadangkan',
      restaurarAqui: 'Pulihkan di sini',
      adminer: 'Buka di Adminer',
      conexion: 'Detail koneksi',
      vector: 'Aktifkan vektor',
      borrar: 'Hapus',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Pasang Adminer dan PHP di Layanan untuk membukanya',
    vectorSinInstalar: 'Pasang pgvector di bawah ini untuk mengaktifkannya pada basis data',
    vectorActivado: (base: string) => `Vektor diaktifkan di ${base}`,
    formatos: {
      sql: 'SQL biasa',
      pgdump: 'Cadangan PostgreSQL (pg_dump, format khusus)',
      gz: 'SQL terkompresi (.gz)',
      zip: 'File .zip (diekstrak sebelum dipulihkan)',
      rar: 'File .rar (dicoba diekstrak dengan Windows)',
      '7z': 'File .7z (dicoba diekstrak dengan Windows)',
      desconocido: 'Format tidak dikenali',
    } as Record<string, string>,
    formatoDesconocido:
      'Format tidak dikenali. Jika berupa file terkompresi, ekstrak terlebih dahulu lalu pilih file .sql atau .dump di dalamnya.',
    formatoIncompatible: 'File ini adalah cadangan PostgreSQL: pulihkan di tab PostgreSQL.',
    nombre: {
      etiqueta: 'Nama basis data',
      vacio: 'Masukkan nama',
      largo: 'Nama terlalu panjang',
      caracteres: {
        mysql: 'Gunakan hanya huruf, angka, dan garis bawah',
        mariadb: 'Gunakan hanya huruf, angka, dan garis bawah',
        postgresql: 'Gunakan huruf kecil, angka, dan garis bawah',
        mongodb: 'Gunakan hanya huruf, angka, tanda hubung, dan garis bawah',
      } as Record<string, string>,
      inicio: 'Di PostgreSQL, nama tidak boleh diawali dengan angka',
    },
    reemplazo: {
      titulo: (base: string) => `Basis data ${base} sudah memiliki tabel`,
      texto: (base: string) =>
        `Jika Anda melanjutkan, basis data ${base} saat ini akan DIGANTI seluruhnya. Salinan cadangan otomatis akan disimpan terlebih dahulu; setelah itu basis data dihapus dan dibuat ulang dengan konten baru.`,
      donde: 'Salinan cadangan disimpan di',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'Jika Anda tidak ingin menggantinya, kembali dan pilih nama lain: basis data baru akan dibuat.',
      pedir: (base: string) => `Untuk mengonfirmasi, ketik ${base}`,
      volver: 'Kembali',
      confirmar: 'Ganti basis data',
    },
    resultado: {
      restaurada: (base: string) => `Basis data ${base} dipulihkan`,
      importada: (base: string) => `Basis data ${base} diimpor`,
      respaldada: (base: string) => `Cadangan ${base} disimpan`,
      archivo: 'File',
      respaldoPrevio: 'Salinan cadangan dari basis data sebelumnya',
      advertencias: (n: number) => plural(n, 'peringatan'),
      advertenciasAyuda:
        'Operasi selesai. Periksa pemberitahuan ini; biasanya terkait peran atau izin yang tidak ada di perangkat ini.',
      fallo: {
        restaurar: 'Gagal memulihkan',
        importar: 'Gagal mengimpor',
        respaldar: 'Gagal mencadangkan',
      } as Record<string, string>,
      trasReemplazo: 'Basis data asli telah diganti dan pemulihan tidak selesai',
      trasReemplazoAyuda:
        'Data Anda sebelumnya tersimpan di salinan cadangan yang tertera. Anda dapat memulihkannya dengan "Pulihkan cadangan".',
    },
    progreso: {
      titulo: 'Log',
      corriendo: {
        restaurar: (base: string) => `Memulihkan ${base}…`,
        importar: (base: string) => `Mengimpor ${base}…`,
        respaldar: (base: string) => `Mencadangkan ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Menunggu keluaran dari alat…',
      limitado: (n: number) => `Menampilkan ${n} baris terakhir.`,
      noCierre:
        'Jangan tutup program hingga selesai. Anda dapat meninggalkan layar ini dan kembali lagi: hasilnya akan terlihat di sini.',
      otraEnCurso: 'Sudah ada operasi yang sedang berlangsung; tunggu hingga selesai.',
      ver: 'Lihat detail',
      descartar: 'Tutup',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Pulihkan cadangan ke ${motor}`,
      confianza:
        'Hanya pulihkan cadangan dari sumber tepercaya: file cadangan dapat menjalankan perintah pada server.',
      archivo: 'File cadangan',
      elegir: 'Pilih file…',
      cambiar: 'Ubah',
      sinArchivo: 'Belum ada file dipilih',
      formato: 'Format terdeteksi',
      detectando: 'Mendeteksi format…',
      destino: 'Basis data tujuan',
      destinoAyuda:
        'Jika belum ada, akan dibuat. Jika sudah ada dan kosong, akan digunakan. Jika sudah memiliki tabel, Anda akan dimintai konfirmasi.',
      restaurar: 'Pulihkan',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Impor ke ${motor} dari server lain`,
      soloLectura:
        'Server asal hanya dibaca: basis data Anda disalin ke perangkat ini dan server asal tidak diubah.',
      detectado: (puerto: number) =>
        `Terdeteksi server lain pada port ${puerto} (misalnya, dari FlyEnv).`,
      origen: 'Server asal',
      host: 'Server',
      puerto: 'Port',
      usuario: 'Pengguna',
      clave: 'Kata sandi',
      claveAyuda: 'Hanya digunakan untuk penyalinan ini dan tidak disimpan.',
      baseOrigen: 'Basis data asal',
      destino: 'Basis data tujuan di perangkat ini',
      destinoAyuda:
        'Jika belum ada, akan dibuat. Jika sudah memiliki tabel, Anda akan dimintai konfirmasi sebelum menggantinya.',
      faltaHost: 'Masukkan alamat server',
      faltaPuerto: 'Gunakan port antara 1 dan 65535',
      faltaUsuario: 'Masukkan nama pengguna',
      faltaBase: 'Masukkan basis data asal',
      importar: 'Impor',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Basis data baru di ${motor}`,
      codificacion: 'Pengodean',
      codificacionValor: {
        mysql: 'utf8mb4 (mendukung emoji dan semua karakter aksen)',
        mariadb: 'utf8mb4 (mendukung emoji dan semua karakter aksen)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Buat pengguna khusus untuk basis data ini',
      usuarioPropioAyuda:
        'Opsional. Jika tidak, proyek Anda akan menggunakan pengguna administrator server.',
      usuario: 'Pengguna',
      clave: 'Kata sandi',
      faltaClave: 'Masukkan kata sandi',
      crear: 'Buat basis data',
      creada: (base: string) => `Basis data ${base} dibuat`,
      mongo: 'Di MongoDB, basis data dibuat dengan koleksi awal (_pel_init).',
      cambiarClave: 'Ubah kata sandi',
      cambiarClaveTitulo: (u: string) => `Pengguna ${u} sudah ada dengan kata sandi lain`,
      cambiarClaveTexto: (u: string) =>
        `Jika Anda mengubah kata sandi ${u}, proyek yang sudah menggunakannya tidak akan dapat terhubung hingga Anda memperbarui file .env miliknya. Sebaiknya gunakan kata sandi saat ini. Tetap ubah?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Hapus basis data ${base}?`,
      texto: (base: string, motor: string) =>
        `Basis data ${base} di ${motor} beserta seluruh datanya akan dihapus. Tindakan ini tidak dapat dibatalkan. Jika masih diperlukan, cadangkan terlebih dahulu.`,
      pedir: (base: string) => `Untuk mengonfirmasi, ketik ${base}`,
      boton: 'Hapus basis data',
      hecho: (base: string) => `Basis data ${base} telah dihapus`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Cadangkan ${base}`,
      destino: 'Akan disimpan di',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (folder bawaan)',
      porDefectoEn: (carpeta: string) => `${carpeta} (folder bawaan)`,
      cambiar: 'Pilih folder lain…',
      porDefectoVolver: 'Gunakan folder bawaan',
      formato: {
        mysql: 'File .sql (mysqldump beserta rutin dan pemicu)',
        mariadb: 'File .sql (mysqldump beserta rutin dan pemicu)',
        postgresql: 'File .dump (pg_dump, format khusus)',
      } as Record<string, string>,
      boton: 'Cadangkan',
    },
    dialogoConexion: {
      sitio: 'Proyek',
      sitioAyuda:
        'File .env situs dibaca untuk menggunakan variabel yang sudah ada (misalnya, CodeIgniter 4). Isinya tidak ditampilkan maupun disalin.',
      generico: 'Umum (format Laravel)',
      titulo: (base: string) => `Koneksi ke ${base}`,
      host: 'Server',
      puerto: 'Port',
      usuario: 'Pengguna',
      clave: 'Kata sandi',
      base: 'Basis data',
      sinClave: 'Tanpa kata sandi (hanya mendengarkan di 127.0.0.1)',
      mostrar: 'Tampilkan kata sandi',
      ocultar: 'Sembunyikan kata sandi',
      copiarDato: (dato: string) => `Salin ${dato}`,
      env: 'Blok untuk file .env',
      envAyuda: 'Tempelkan ke file .env proyek Anda. WolfCore Dev tidak mengubah file proyek Anda.',
      copiarEnv: 'Salin blok',
      cargando: 'Membaca detail koneksi…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Pemasangan pgvector sedang berlangsung.',
      descripcion:
        'Pencarian kemiripan (embeddings) di dalam PostgreSQL. Dikompilasi dari kode sumber resmi.',
      instalado: (v: string | null) => (v ? `Terpasang (versi ${v})` : 'Terpasang'),
      noInstalado: 'Belum terpasang',
      herramientas: 'Alat kompilasi',
      herramientasSi: 'Siap',
      herramientasNo: 'Belum tersedia',
      instalar: 'Pasang pgvector',
      reinstalar: 'Kompilasi ulang',
      instalarHerramientas: 'Pasang alat kompilasi',
      dialogoHerramientasTitulo: 'Pasang alat kompilasi',
      dialogoHerramientas:
        'Untuk mengompilasi pgvector, diperlukan Build Tools untuk Visual Studio. Sekitar ~6 GB akan diunduh dan Windows akan meminta izin administrator. Proses ini dapat memakan waktu cukup lama; biarkan WolfCore Dev tetap terbuka.',
      dialogoCompilarTitulo: 'Kompilasi dan pasang pgvector',
      dialogoCompilar:
        'Kode sumber resmi pgvector akan diunduh, dikompilasi, dan dipasang ke PostgreSQL Anda. PostgreSQL akan berhenti beberapa detik saat ekstensi disalin lalu menyala kembali.',
      continuar: 'Lanjutkan',
      instalando: 'Memasang alat kompilasi…',
      compilando: 'Mengompilasi pgvector…',
      herramientasOk: 'Alat kompilasi terpasang',
      instaladoOk: (v: string) => `pgvector ${v} terpasang`,
      sinWinget:
        'Perangkat ini tidak memiliki winget. Pasang "Build Tools for Visual Studio 2022" dari visualstudio.microsoft.com dengan beban kerja "Desktop development with C++" lalu coba lagi.',
      falloHerramientas: 'Gagal memasang alat kompilasi',
      activarAyuda:
        'Setelahnya, gunakan "Aktifkan vektor" di setiap basis data yang membutuhkannya.',
      errorEstado: 'Gagal membaca status pgvector',
    },
  },
  instalar: {
    titulo: 'Pasang',
    descripcion:
      'Unduh versi resmi. Setiap file diverifikasi dengan hash SHA-256 sebelum digunakan.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Server web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Terowongan publik (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Basis data, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Basis data, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Basis data (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Cache dan antrean dalam memori (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Basis data dokumen (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Konsol MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Email pengujian (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Email pengujian (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Email pengujian (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Email pengujian (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'AI lokal (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'Dependensi PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Pengelola basis data berbasis web' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Pengelola web MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web dan PHP',
      bd: 'Basis data',
      otros: 'Email, AI, dan terowongan',
    },
    instalados: 'Terpasang',
    ninguno: 'Belum ada versi terpasang',
    elegir: 'Pilih versi',
    buscando: 'Mencari versi…',
    sinVersiones: 'Tidak ada versi yang ditemukan',
    rama: (rama: string) => rama,
    yaInstalada: 'sudah terpasang',
    fases: {
      descargando: 'Mengunduh',
      verificando: 'Memverifikasi SHA-256',
      extrayendo: 'Mengekstrak',
      compilando: 'Mengompilasi',
      listo: 'Terpasang',
      error: 'Pemasangan gagal',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} terpasang`,
  },
  sitios: {
    titulo: 'Situs',
    descripcion:
      'Setiap situs adalah folder yang dilayani oleh Nginx pada domain .test miliknya sendiri.',
    nuevo: 'Situs baru',
    buscar: 'Cari berdasarkan nama atau domain',
    sinResultados: (q: string) => `Tidak ada situs yang cocok dengan "${q}".`,
    vacioTitulo: 'Belum ada situs',
    vacio:
      'Pilih folder proyek dan WolfCore Dev akan mendeteksi apakah proyek tersebut Laravel, CodeIgniter, atau statis.',
    agregar: 'Tambah situs',
    total: (n: number) => plural(n, 'situs'),
    abrirSitio: (dominio: string) => `Buka ${dominio} di browser`,
    carpeta: 'Folder',
    abrirCarpeta: 'Buka folder proyek',
    alias: (n: number) => `+${plural(n, 'alias')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statis',
      proxy: 'Proxy (port lokal)',
      personalizado: 'Kustom',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (port lokal)',
      node: 'Node / Vite (port lokal)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statis',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Data asli',
    datosRealesAyuda: 'Berisi data asli pelanggan: berhati-hatilah saat memublikasikannya.',
    faltaHosts: 'Belum ada di hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} belum mengarah ke perangkat ini. Perbaiki file hosts melalui pemberitahuan di atas.`,
    estado: {
      enLinea: 'Daring',
      faltaHosts: 'Belum ada di hosts',
      iniciando: 'Nginx sedang dimulai…',
      errorNginx: 'Kesalahan pada Nginx',
      nginxExterno: 'Nginx eksternal',
      nginxApagado: 'Nginx tidak aktif',
    },
    borrar: {
      titulo: (nombre: string) => `Hapus situs ${nombre}?`,
      texto: 'Folder proyek tidak akan diubah.',
      hecho: (nombre: string) => `Situs ${nombre} telah dihapus`,
      nginxFallo: 'Situs telah dihapus, tetapi Nginx menolak konfigurasi baru',
    },
  },
  formSitio: {
    tituloNuevo: 'Situs baru',
    tituloEditar: 'Edit situs',
    tituloDuplicar: 'Duplikasi situs',
    paso: 'Mulai dengan memilih folder proyek',
    pasoAyuda:
      'Jenis proyek, versi PHP, dan domain yang disarankan akan dideteksi otomatis. Anda dapat mengubah semuanya setelahnya.',
    elegirCarpeta: 'Pilih folder',
    cambiarCarpeta: 'Ubah',
    detectando: 'Menganalisis proyek…',
    detectado: (tipo: string) => `Terdeteksi: ${tipo}`,
    sinDeteccionAlEditar:
      'Deteksi otomatis hanya berlaku saat membuat situs baru; periksa jenis proyek dan versi PHP.',
    nombre: 'Nama',
    nombreAyuda: 'Hanya untuk mengenalinya di dalam daftar.',
    nombreCopia: (nombre: string) => `${nombre} (salinan)`,
    duplicarProxy:
      'Salinan mengarah ke port lokal yang sama dengan aslinya dan tidak menyalin prosesnya: ubah port atau tambahkan proses tersendiri.',
    dominio: 'Domain',
    dominioPlaceholder: 'proyek-saya',
    alias: 'Alias',
    aliasAyuda: 'Domain .test lain yang membuka situs yang sama. Ketik lalu tekan Enter.',
    aliasAgregar: 'Tambah alias',
    carpeta: 'Folder proyek',
    raizLaravel: 'Nginx akan melayani subfolder public/.',
    tipo: 'Jenis proyek',
    php: 'Versi PHP',
    phpElegir: 'Pilih versi',
    phpNinguno: 'Belum ada versi PHP yang terpasang.',
    phpInstalar: 'Pasang PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Proyek memerlukan PHP ${pedida}, yang belum terpasang. PHP ${elegida} dipilih sebagai gantinya.`,
    puertoProxy: 'Port lokal',
    puertoProxyAyuda:
      'Nginx akan meneruskan permintaan ke http://127.0.0.1:<port> (misalnya, Vite atau Node).',
    urlBaseVar: 'Variabel URL dasar',
    urlBaseVarAyuda:
      'Saat membuka terowongan, tautan publik ditulis ke variabel .env ini, dan dipulihkan kembali saat terowongan ditutup.',
    urlBaseVarNinguna: 'Tidak ada (jangan ubah .env)',
    datosReales: 'Memiliki data asli pelanggan',
    datosRealesAyuda:
      'Ditandai di daftar dan meminta konfirmasi sebelum dipublikasikan melalui terowongan.',
    avanzado: 'Lanjutan',
    reglasExtra: 'Aturan tambahan Nginx',
    reglasExtraAyuda:
      'Disisipkan di dalam blok server (header keamanan, aturan deny khusus…). Divalidasi dengan nginx -t saat disimpan.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Catatan',
    notaPlaceholder: 'Hal yang ingin Anda ingat tentang situs ini',
    guardar: 'Simpan situs',
    guardado: (nombre: string) => `Situs ${nombre} disimpan`,
    errorGuardar: 'Gagal menyimpan situs',
    nginxFallo: 'Situs disimpan, tetapi Nginx menolak konfigurasi',
    nginxFalloAyuda:
      'Konfigurasi Nginx sebelumnya telah dipulihkan. Periksa aturan tambahan lalu simpan kembali.',
    errores: {
      carpeta: 'Pilih folder proyek',
      sufijo: 'Domain harus diakhiri dengan .test',
      caracteres: 'Gunakan hanya huruf, angka, tanda hubung, dan titik',
      aliasIgualDominio: (d: string) => `Alias ${d} sama dengan domain situs`,
      aliasRepetido: (d: string) => `Alias ${d} sudah ada`,
      ocupado: (d: string) => `Sudah ada situs dengan domain ${d}`,
      puertoFalta: 'Situs proxy memerlukan port',
      puertoRango: 'Port harus berada di antara 1 dan 65535',
      php: 'Pilih versi PHP untuk situs ini',
      urlBaseVar: 'Gunakan huruf, angka, dan garis bawah (misalnya, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Terowongan publik untuk ${dominio}`,
    etiqueta: 'Terowongan',
    apagadoAyuda: 'Bagikan situs ini dengan tautan publik sementara.',
    abriendo: 'Membuka terowongan…',
    cerrando: 'Menutup terowongan…',
    error: 'Terowongan gagal',
    sinNginx: 'Nyalakan Nginx terlebih dahulu',
    sinCloudflared: 'Pasang cloudflared di Layanan',
    abrirUrl: 'Buka tautan publik',
    copiarUrl: 'Salin tautan publik',
    verQr: 'Tampilkan kode QR tautan',
    qrTitulo: 'Tautan publik untuk situs ini',
    renovar: 'Perbarui (tautan baru)',
    cerrar: 'Tutup terowongan',
    confirmarTitulo: 'Publikasikan situs dengan data asli',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} berisi data asli pelanggan dan akan dipublikasikan ke internet melalui ${destino}: siapa pun yang memiliki tautannya dapat melihatnya selama masih terbuka. Publikasikan?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} akan dipublikasikan ke internet melalui Expose: siapa pun yang memiliki tautannya dapat mengaksesnya selama masih terbuka. Selain itu, inspektor permintaan Expose akan terlihat oleh perangkat apa pun di jaringan lokal Anda. Publikasikan?`,
    compartir: 'Bagikan',
    confirmar: 'Publikasikan',
    confirmarPublicoTitulo: 'Publikasikan situs ke internet',
    confirmarPublicoTexto: (dominio: string) =>
      `Terowongan publik Cloudflare akan dibuka untuk ${dominio}: siapa pun yang memiliki tautannya dapat mengaksesnya selama masih terbuka. Publikasikan?`,
    opciones: 'Opsi terowongan',
    opcionesDe: (dominio: string) => `Opsi terowongan untuk ${dominio}`,
    proveedor: 'Penyedia',
    proveedorRapido: 'Cepat (tanpa akun)',
    proveedorRapidoAyuda: 'Tautan trycloudflare.com yang berubah setiap kali dibuka.',
    proveedorNombre: 'Bernama (domain Anda)',
    proveedorNombreAyuda:
      'Tautan tetap pada domain Cloudflare milik Anda. Memerlukan akun Cloudflare.',
    cuentaConectada: 'Akun Cloudflare terhubung.',
    cuentaSinConectar: 'Belum ada akun Cloudflare yang terhubung.',
    conectar: 'Hubungkan ke Cloudflare',
    conectando: 'Menunggu otorisasi di browser Anda…',
    conectarAyuda:
      'Browser Anda akan dibuka untuk mengotorisasi WolfCore Dev pada akun Anda. Sertifikat hanya disimpan di folder data Anda.',
    autorizacion: 'Otorisasi Cloudflare',
    abrirAutorizacion: 'Buka halaman otorisasi',
    copiarAutorizacion: 'Salin tautan otorisasi',
    cancelarConexion: 'Batal',
    recrear: 'Buat ulang terowongan',
    olvidar: 'Lupakan terowongan',
    recrearTitulo: 'Buat ulang terowongan',
    recrearTexto: (n: string) =>
      `Terowongan "${n}" di Cloudflare akan dihapus dan terowongan baru dengan nama yang sama akan dibuat. Situs yang menggunakannya akan ditutup.`,
    olvidarTitulo: 'Lupakan terowongan',
    olvidarTexto: (n: string) =>
      `Terowongan "${n}" di Cloudflare dan kredensial tersimpannya akan dihapus. Situs yang menggunakannya akan kembali ke terowongan cepat.`,
    olvidarAqui: 'Lupakan hanya di sini',
    olvidarAquiTitulo: 'Lupakan terowongan hanya di perangkat ini',
    olvidarAquiTexto: (n: string) =>
      `Kredensial terowongan "${n}" yang tersimpan di perangkat ini akan dihapus; terowongan tersebut tetap ada di Cloudflare. Situs yang menggunakannya akan kembali ke terowongan cepat.`,
    desconectar: 'Putuskan sambungan',
    nombreTunel: 'Nama terowongan',
    nombreTunelAyuda: 'Huruf kecil, angka, dan tanda hubung.',
    dominioPublico: 'Domain publik',
    dominioPublicoAyuda: 'Subdomain dari domain Anda di Cloudflare, misalnya demo.domainanda.com.',
    crear: 'Buat dan rutekan',
    guardadoNombre: 'Terowongan bernama siap digunakan. Konfirmasi akan diminta saat membukanya.',
    guardadoRapido: 'Situs ini kembali menggunakan terowongan cepat.',
    cambiarCierra:
      'Mengganti penyedia akan menutup terowongan yang sedang terbuka untuk situs ini.',
    usarRapido: 'Gunakan terowongan cepat',
    nombreActual: (nombre: string, dominio: string) => `Terowongan "${nombre}" di ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} akan dipublikasikan di ${publico} menggunakan terowongan Cloudflare: siapa pun yang memiliki tautan dapat mengaksesnya selama masih terbuka. Publikasikan?`,
    proveedorNgrokAyuda:
      'Dengan akun ngrok Anda. Program ngrok harus sudah terpasang di perangkat ini.',
    proveedorExposeAyuda:
      'Dengan akun Expose Anda. Expose harus sudah terpasang di perangkat ini; di Windows hanya berfungsi dengan expose.phar. Inspektornya terlihat di jaringan lokal, sehingga tidak digunakan untuk situs dengan data asli.',
    proveedorTailscaleAyuda:
      'Melalui jaringan privat Tailscale Anda. Tailscale harus sudah terpasang dan masuk ke akun.',
    tokenGuardado: (f: string) => `Token tersimpan (berakhiran ${f}).`,
    tokenSinGuardar: 'Belum ada token yang tersimpan.',
    tokenNgrok: 'Token ngrok',
    tokenExpose: 'Token Expose',
    tokenAyuda:
      'Disimpan terenkripsi di perangkat ini dan hanya diberikan ke program saat membuka terowongan; tidak pernah ditampilkan.',
    tokenPlaceholder: 'Tempel token di sini',
    guardarToken: 'Simpan token',
    borrarToken: 'Hapus token',
    usarProveedor: 'Gunakan penyedia ini',
    guardadoProveedor: 'Penyedia tersimpan. Konfirmasi akan diminta saat membuka terowongan.',
    ngrokAyudaInstalacion:
      'ngrok harus sudah terpasang di perangkat ini (WolfCore Dev tidak mengunduhnya karena ngrok tidak menerbitkan unduhan yang dapat diverifikasi). Konfigurasi global Anda tidak diubah.',
    exposeAyudaInstalacion:
      'Expose harus sudah terpasang atau memiliki file expose.phar di folder bin/expose pada data WolfCore Dev (di Windows hanya berfungsi dengan phar; tidak ada unduhan dengan sidik jari). Inspektor permintaannya terlihat di seluruh jaringan lokal, oleh karena itu tidak digunakan untuk situs dengan data asli. Konfigurasi global Anda tidak diubah.',
    tailscaleAlcance: 'Jangkauan akses',
    tailscaleServe: 'Serve: hanya tailnet Anda',
    tailscaleServeAyuda:
      'Hanya perangkat di jaringan Tailscale Anda. Tidak dipublikasikan ke internet.',
    tailscaleFunnel: 'Funnel: seluruh internet',
    tailscaleFunnelAyuda:
      'Siapa pun yang memiliki tautan dapat mengaksesnya, baik berada di tailnet Anda maupun tidak.',
    tailscaleFunnelAviso:
      'Funnel memublikasikan situs ini ke internet: siapa pun yang memiliki tautan dapat mengaksesnya selama masih terbuka.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev tidak memasang Tailscale (ini adalah layanan sistem): Tailscale harus sudah terpasang dan masuk ke akun. Tidak ada yang diubah dari layanan yang sudah Anda publikasikan dengan Tailscale; situs ini menggunakan port HTTPS 8443.',
    confirmarTailnetTitulo: 'Bagikan ke tailnet Anda',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} akan dibagikan melalui Tailscale Serve: hanya perangkat di tailnet Anda yang dapat mengaksesnya; tidak dipublikasikan ke internet. Bagikan?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} berisi data pelanggan asli. Dengan Tailscale Serve, hanya perangkat di tailnet Anda yang dapat melihatnya (tidak dipublikasikan ke internet). Bagikan?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} akan dipublikasikan ke internet melalui Tailscale Funnel: siapa pun yang memiliki tautan dapat mengaksesnya selama masih terbuka. Publikasikan?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} akan dipublikasikan ke internet melalui ${proveedor}: siapa pun yang memiliki tautan dapat mengaksesnya selama masih terbuka. Publikasikan?`,
    tituloError: 'Tidak dapat membuka terowongan',
  },
  tuneles: {
    titulo: 'Terowongan',
    descripcion:
      'Tautan publik sementara dari Cloudflare untuk menampilkan situs di luar jaringan Anda.',
    explicacion:
      'Terowongan cepat mengubah alamat setiap kali dibuka atau diperbarui, dan hanya berfungsi selama perangkat ini menyala dan prosesnya tetap berjalan (jika Anda keluar dari WolfCore Dev dengan membiarkannya menyala, terowongan tetap aktif).',
    columnas: { sitio: 'Situs', estado: 'Status', url: 'Tautan', acciones: 'Tindakan' },
    vacioTitulo: 'Tidak ada terowongan yang terbuka',
    vacio: 'Aktifkan sakelar terowongan pada suatu situs untuk mendapatkan tautan publik.',
    sinNombre: 'Situs dihapus',
  },
  ajustes: {
    titulo: 'Pengaturan',
    descripcion: 'Preferensi lingkungan.',
    general: 'Umum',
    carpetaDatos: 'Folder data',
    carpetaDatosAyuda: 'Biner, konfigurasi, dan log. Dapat dibuka, tidak dapat diubah.',
    servicios: 'Layanan',
    puertoNginx: 'Port Nginx',
    puertoNginxAyuda:
      'Biasanya 80. Jika bukan 80, URL lokal akan menyertakan nomor port. Terowongan yang terbuka tetap menggunakan port sebelumnya: perbarui terowongan tersebut.',
    trabajadores: 'Worker PHP',
    trabajadoresAyuda:
      'Proses php-cgi per versi. Lebih banyak worker menangani lebih banyak permintaan secara bersamaan.',
    nota: 'Saat menyimpan, situs akan dibuat ulang dengan port baru. Jika Nginx menyala, Nginx akan dimulai ulang (atau dimuat ulang jika port tidak berubah), dan versi PHP yang menyala akan dimulai ulang jika jumlah worker berubah.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Pengaturan disimpan dan diterapkan. Dimulai ulang: ${reiniciados.join(', ')}.`
        : 'Pengaturan disimpan dan diterapkan.',
    errorAplicar: 'Pengaturan tersimpan, tetapi tidak dapat diterapkan sepenuhnya',
    errorSeccion: (detalle: string) => `Tidak dapat membaca data ini: ${detalle}`,
    acerca: 'Tentang',
    avisos: {
      titulo: 'Pemberitahuan',
      descripcion:
        'Pemberitahuan apa saja yang disimpan di lonceng dan apakah Windows menampilkan notifikasi saat jendela tidak terlihat.',
      nativas: 'Notifikasi Windows',
      nativasAyuda:
        'Hanya saat WolfCore Dev tidak berada di latar depan; maksimal satu per jenis setiap 5 menit.',
      tiposTitulo: 'Jenis pemberitahuan',
      versionesTitulo: 'Versi baru per layanan',
      versionesAyuda:
        'Nonaktifkan suatu layanan agar tidak menerima pemberitahuan versi barunya (tab Versi tetap menandai pembaruan).',
      versionesDe: (s: string) => `Beri tahu versi baru untuk ${s}`,
      tipos: {
        'servicio-caido': 'Suatu layanan berhenti dengan kesalahan',
        'puerto-ocupado': 'Port sedang digunakan saat memulai layanan',
        'certificado-por-vencer': 'Sertifikat akan segera kedaluwarsa',
        'tunel-caido': 'Terowongan terputus',
        'proceso-error': 'Proses proyek gagal',
        'proceso-terminado': 'Proses proyek selesai',
        'receta-terminada': 'Resep proyek selesai',
        doctor: 'Diagnostik (Doctor)',
        'contenedor-detenido': 'Kontainer berhenti',
        'version-nueva': 'Tersedia versi baru untuk layanan yang terpasang',
      } as Record<string, string>,
      errorGuardar: 'Tidak dapat menyimpan pemberitahuan',
    },
    versionPrograma: 'Versi program',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Otoritas lokal',
      autoridadAyuda:
        'WolfCore Dev menandatangani sertifikat situs .test Anda dengan otoritasnya sendiri. Otoritas ini dipasang di penyimpanan pengguna Windows Anda, tanpa izin administrator.',
      instalada: 'Terpasang di Windows',
      noInstalada: 'Belum terpasang',
      instalar: 'Pasang otoritas',
      reinstalar: 'Pasang ulang',
      quitar: 'Hapus',
      instaladaOk: 'Otoritas HTTPS terpasang',
      quitadaOk: 'Otoritas HTTPS dihapus',
      cancelado: 'Konfirmasi Windows dibatalkan. Tidak ada yang diubah.',
      fallo: 'Tidak dapat mengubah otoritas HTTPS',
      quitarTitulo: 'Hapus otoritas HTTPS?',
      quitarTexto:
        'Browser tidak akan lagi memercayai sertifikat situs .test Anda hingga Anda memasangnya kembali.',
      puerto: 'Port HTTPS',
      puertoAyuda:
        'Biasanya 443. Jika digunakan program lain, pilih antara 1024 dan 65535; URL akan menyertakan nomor port.',
      puertoRango: 'Gunakan 443 atau angka antara 1024 dan 65535',
      puertoGuardado: (p: number) => `HTTPS sekarang menggunakan port ${p}`,
      puertoAplicarFallo: 'Port tersimpan, tetapi Nginx menolak konfigurasi baru',
      firefox:
        'Firefox menggunakan penyimpanan sertifikatnya sendiri. Agar memercayai otoritas ini, buka about:config dan aktifkan',
    },
    herramientas: {
      titulo: 'Terminal dan alat',
      phpPorDefecto: 'PHP bawaan',
      phpPorDefectoAyuda:
        'Versi php dan composer di terminal serta pintasan WolfCore Dev. "Terminal" menggunakan PHP masing-masing proyek.',
      phpMasReciente: 'Versi terbaru yang terpasang',
      phpSinInstalar: 'Pasang PHP di Layanan untuk memilih versi',
      phpGuardado: 'PHP bawaan diperbarui',
      path: 'PATH pengguna',
      pathAyuda:
        'Menambahkan php dan composer milik WolfCore Dev ke PATH pengguna Anda agar dapat digunakan di terminal mana pun.',
      pathActivo: 'Ditambahkan ke PATH',
      pathInactivo: 'Tidak ada di PATH',
      pathAgregar: 'Tambahkan ke PATH pengguna',
      pathQuitar: 'Hapus dari PATH',
      pathTitulo: 'PATH diperbarui',
      pathAviso:
        'Buka terminal baru untuk melihat perubahan: terminal yang sudah terbuka tidak melihatnya.',
      pathQuitarTitulo: 'Hapus WolfCore Dev dari PATH?',
      pathQuitarTexto:
        'php dan composer milik WolfCore Dev tidak akan lagi tersedia di terminal baru. Terminal yang sudah terbuka tidak berubah.',
      adminer: 'Port Adminer',
      adminerAyuda: 'Adminer hanya dilayani di perangkat ini, pada alamat tetap ini.',
      terminal: 'Terminal bawaan',
      terminalSistema: 'Bawaan sistem (PowerShell)',
      terminalAyuda:
        'Terminal yang dibuka oleh "Terminal" di proyek. Jika proyek membutuhkan variabel sendiri (PHP-nya di PATH, kunci agen), dengan "Windows Terminal" akan dibuka PowerShell di dalam terminal bawaan Windows: jendela Windows Terminal yang sudah terbuka tidak akan menerima variabel tersebut.',
      terminalGuardada: 'Terminal bawaan diperbarui',
      editor: 'Editor bawaan',
      editorPrimero: 'Yang pertama terdeteksi',
      editorAyuda:
        'Editor yang dibuka oleh "Editor" di proyek dan "Buka di editor" pada pencarian serta kesalahan. Mendeteksi VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed, dan Notepad++.',
      editorGuardado: 'Editor bawaan diperbarui',
      editorNinguno: 'Tidak ada editor yang terdeteksi.',
    },
  },
  /* ───────────── HTTPS, terminal, dan FTP di situs; Surel; AI lokal ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS aktif',
    candadoAyuda: 'Situs ini juga melayani melalui HTTPS dengan sertifikat dari WolfCore Dev.',
    redirige: 'Mengalihkan http → https',
    abrirHttp: (dominio: string) => `Buka http://${dominio} di browser`,
    abrirHttps: (url: string) => `Buka ${url} di browser`,
    pendiente: (motivo: string) => `HTTPS tertunda: ${motivo}`,
    pendienteCorto: 'HTTPS tertunda',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `port ${puerto} digunakan oleh ${nombre} (PID ${pid}).`,
    sinAutoridad: 'otoritas sertifikat belum ada. Pasang di Pengaturan.',
    pendienteAyuda:
      'Situs tetap berjalan melalui HTTP. Tutup program tersebut atau pilih port HTTPS lain di Pengaturan.',
    sinConfianza: 'Otoritas belum terpasang',
    sinConfianzaAyuda:
      'Browser akan menampilkan peringatan keamanan hingga Anda memasang otoritas WolfCore Dev (Pengaturan → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Layani juga melalui HTTPS',
    httpsAyuda:
      'Dengan sertifikat khusus untuk domain dan aliasnya, ditandatangani oleh WolfCore Dev.',
    redirigir: 'Alihkan ke HTTPS',
    redirigirAyuda:
      'Kunjungan melalui http dialihkan ke https. Terowongan publik tidak terpengaruh.',
    redirigirDeshabilitado: 'Aktifkan HTTPS terlebih dahulu',
    sinAutoridadTitulo: 'Otoritas HTTPS belum terpasang',
    sinAutoridadTexto:
      'Tanpa otoritas ini, browser akan menampilkan peringatan keamanan. Windows akan meminta Anda mengonfirmasi pemasangan.',
    instalar: 'Pasang otoritas',
    instalada: 'Otoritas HTTPS terpasang',
    cancelado: 'Konfirmasi Windows dibatalkan. Tidak ada yang diubah.',
    fallo: 'Tidak dapat memasang otoritas HTTPS',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Membuka terminal di folder proyek, dengan PHP dan Composer miliknya di PATH.',
    elegir: 'Pilih terminal',
    predeterminada: 'bawaan',
  },
  editorSitio: {
    ayuda: 'Membuka folder proyek di editor bawaan.',
    elegir: 'Buka dengan…',
    predeterminada: 'bawaan',
    sustituido: (pred: string, usado: string) =>
      '{pred} tidak terpasang: dibuka dengan {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Tidak dapat membuka editor',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `PHP ${rama} bersama`,
    propio: (rama: string) => `PHP ${rama} khusus untuk situs ini`,
    conXdebug: 'Xdebug aktif',
    mostrar: 'Pengaturan PHP',
    ocultar: 'Sembunyikan pengaturan PHP',
    cargando: 'Membaca pengaturan PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} sedang mati: PHP khusus situs ini akan menyala bersamanya.`,
    ajustesTitulo: 'php.ini khusus',
    ajustesAyuda: (rama: string) =>
      `Ditambahkan ke php.ini milik PHP ${rama} hanya untuk situs ini. Jika ada pengaturan khusus (atau Xdebug), situs ini menggunakan PHP sendiri dengan 1 atau 2 proses; situs lain tidak berubah.`,
    clave: 'Direktif',
    valor: 'Nilai',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Hapus ${clave || 'pengaturan'}`,
    agregar: 'Tambah pengaturan',
    guardarAjustes: 'Uji dan simpan',
    ajustesGuardados: 'Pengaturan PHP situs diterapkan',
    sinAjustes: 'Tanpa pengaturan khusus: menggunakan php.ini bersama apa adanya.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug untuk ${dominio}`,
    xdebugAyuda:
      'Hanya dimuat di PHP situs ini, tidak pernah di PHP bersama: situs lain tetap sama cepatnya.',
    xdebugDescarga:
      'Xdebug belum terpasang pada versi PHP ini: akan diunduh dari katalog (xdebug.org, sidik jari SHA-256 terverifikasi).',
    modo: 'Mode',
    modos: {
      debug: 'debug (breakpoint)',
      develop: 'develop (pesan kesalahan lebih baik)',
      coverage: 'coverage (cakupan)',
      profile: 'profile (pemrofilan)',
      trace: 'trace (pelacakan)',
    },
    puerto: 'Port editor',
    inicio: 'Kapan terhubung',
    inicioTrigger: 'Hanya dengan XDEBUG_TRIGGER',
    inicioYes: 'Pada setiap permintaan',
    inicioAyuda:
      'Dengan "Hanya dengan XDEBUG_TRIGGER", debugging dimulai saat permintaan menyertakan cookie, parameter GET/POST, atau ekstensi browser (Xdebug Helper).',
    guardarXdebug: 'Simpan Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Port ${puerto} sudah digunakan oleh PHP atau layanan WolfCore Dev lainnya: editor Anda tidak akan dapat mendengarkannya. Pilih port lain (9003 adalah yang umum).`,
    xdebugGuardado: 'Xdebug situs diterapkan',
    quitarXdebug: 'Hapus Xdebug',
    quitarXdebugTitulo: 'Hapus Xdebug dari situs ini?',
    quitarXdebugTexto:
      'Konfigurasinya akan dihapus. Jika situs tidak memiliki pengaturan lain, situs akan kembali ke PHP bersama. File launch.json proyek tidak diubah.',
    xdebugQuitado: 'Xdebug dihapus dari situs',
    ide: 'Editor',
    generarLaunch: 'Buat launch.json',
    launchTitulo: '.vscode/launch.json proyek',
    launchNuevo:
      'File .vscode/launch.json akan dibuat dengan konfigurasi ini (PHP Debug untuk VS Code, hanya mendengarkan di 127.0.0.1).',
    launchFusion:
      'File launch.json sudah ada: hanya konfigurasi WolfCore yang ditambahkan (atau diperbarui); konfigurasi lain beserta komentarnya tetap dipertahankan. Sebelumnya, cadangan bertanggal disimpan di folder data WolfCore Dev.',
    launchSinCambios: 'File launch.json sudah memiliki konfigurasi ini.',
    launchEscribir: 'Tulis launch.json',
    launchCreado: 'launch.json dibuat di .vscode',
    launchActualizado: (respaldo: string) =>
      `launch.json diperbarui. Cadangan sebelumnya: ${respaldo}`,
    phpStorm: 'Konfigurasi untuk PhpStorm',
    copiarPhpStorm: 'Salin konfigurasi PhpStorm',
    errorNginx: (salida: string) =>
      `Nginx menolak perubahan; dikembalikan ke sebelumnya. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Vhost otomatis',
    conReglas: 'dengan aturan khusus',
    manualResumen: 'Vhost ditulis manual (tidak dibuat ulang)',
    mostrar: 'Edit vhost',
    ocultar: 'Sembunyikan vhost',
    cargando: 'Membaca vhost…',
    reglasTitulo: 'Aturan khusus',
    reglasAyuda:
      'Ditempatkan di dalam blok server situs ini. Sebelum diterapkan, aturan diuji dengan nginx -t pada salinan seluruh konfigurasi; jika gagal, semuanya tetap seperti semula.',
    reglasEtiqueta: 'Aturan khusus Nginx',
    reglasPlaceholder: '# Misalnya: client_max_body_size 256m;',
    snippetsTitulo: 'Cuplikan',
    insertar: (titulo: string) => `Sisipkan: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache file statis',
      'limite-subida': 'Batas unggahan',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Header keamanan',
      websocket: 'Proxy WebSocket',
      gzip: 'Kompresi gzip',
      ocultos: 'Tolak file tersembunyi',
    },
    aplicar: 'Uji dan terapkan',
    descartar: 'Buang perubahan',
    aplicado: 'Vhost diterapkan dan Nginx dimuat ulang',
    aplicadoApagado: 'Vhost tersimpan; akan digunakan saat Nginx dinyalakan',
    fallo: 'Nginx menolak perubahan; vhost tetap seperti semula',
    salidaTitulo: 'Keluaran nginx -t',
    desactivado:
      'Nginx menolak aturan yang Anda tulis untuk situs ini saat menerapkan konfigurasi sehingga dikeluarkan dari vhost (tetap tersimpan). Perbaiki dan terapkan lagi untuk menggunakannya kembali.',
    avisoDestino: (destino: string, linea: number) =>
      `Baris ${linea}: lalu lintas dikirim ke perangkat lain (${destino}). Pastikan hal tersebut memang Anda inginkan.`,
    generadoTitulo: 'Vhost otomatis (hanya baca)',
    avanzadoTitulo: 'Mode lanjutan',
    avanzadoInterruptor: 'Tulis seluruh vhost secara manual',
    avanzadoAyuda:
      'Menggantikan vhost otomatis. WolfCore Dev tidak akan lagi membuatnya ulang: jika Anda mengubah domain, HTTPS, port, atau folder, Anda harus menyesuaikannya sendiri. Hanya boleh menggunakan domain dan port milik situs ini.',
    avanzadoActivarTitulo: 'Tulis vhost secara manual?',
    avanzadoActivarTexto:
      'Dimulai dari vhost otomatis saat ini. Selama aktif, perubahan pada situs (domain, HTTPS, PHP…) tidak tercermin di vhost: Anda harus melakukannya sendiri.',
    avanzadoActivar: 'Tulis manual',
    manualEtiqueta: 'Vhost lengkap situs',
    aplicarManual: 'Uji dan terapkan vhost',
    volverGenerado: 'Kembali ke vhost otomatis',
    volverGeneradoTitulo: 'Kembali ke vhost otomatis?',
    volverGeneradoTexto:
      'Vhost yang ditulis manual akan disimpan di riwayat dan WolfCore Dev akan kembali membuat vhost situs secara otomatis (beserta aturan khusus Anda).',
    historial: 'Riwayat',
    historialTitulo: 'Versi vhost sebelumnya',
    historialVacio: 'Belum ada versi sebelumnya.',
    historialAyuda:
      'Menyimpan 10 versi terakhir sebelum setiap perubahan. Pemulihan melewati pengujian nginx -t yang sama.',
    modoReglas: 'Otomatis dengan aturan',
    modoManual: 'Ditulis manual',
    restaurar: 'Pulihkan',
    restaurarTitulo: 'Pulihkan versi ini?',
    restaurarTexto: (fecha: string) =>
      `Vhost akan dikembalikan ke kondisi pada ${fecha}. Versi saat ini tetap tersimpan di riwayat.`,
    restaurado: 'Versi dipulihkan',
  },
  lan: {
    etiqueta: 'Jaringan lokal',
    interruptor: (dominio: string) => `Bagikan ${dominio} di jaringan lokal`,
    apagadoAyuda: 'Buka situs ini dari ponsel Anda atau perangkat lain di jaringan yang sama.',
    sinNginx: 'Nyalakan Nginx untuk membagikan situs di jaringan lokal.',
    sinRed: 'Tidak ada jaringan lokal yang terhubung (Wi-Fi atau Ethernet).',
    activo: 'Terlihat di jaringan lokal',
    abriendo: 'Membagikan…',
    cerrando: 'Menghentikan berbagi…',
    abrirUrl: 'Buka di perangkat ini',
    copiarUrl: 'Salin alamat',
    verQr: 'Tampilkan QR',
    qrTitulo: (dominio: string) => `${dominio} di jaringan lokal`,
    qrAviso: 'Pindai QR menggunakan ponsel yang terhubung ke jaringan yang sama.',
    confirmarTitulo: 'Bagikan di jaringan lokal',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} akan terlihat oleh perangkat mana pun yang terhubung ke jaringan yang sama dengan perangkat ini (${ip}), tanpa meminta kata sandi. Berbagi akan berhenti saat sakelar dimatikan, saat WolfCore Dev ditutup, dan saat dijalankan kembali.`,
    ipEtiqueta: 'Jaringan (IP perangkat ini)',
    https: 'Gunakan HTTPS',
    httpsAyuda:
      'Dengan HTTPS, ponsel harus memercayai CA WolfCore Dev (tombol "Pasang CA di ponsel"). Tanpa itu, situs berjalan melalui HTTP.',
    httpsObligatorio: 'Situs ini mengalihkan ke HTTPS, sehingga dibagikan menggunakan HTTPS.',
    compartir: 'Bagikan di jaringan',
    tituloError: 'Tidak dapat membagikan di jaringan lokal',
    caBoton: 'Pasang CA di ponsel',
    firewallTitulo: 'Tidak dapat dibuka di ponsel?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} berisi data asli dan tidak dapat dibagikan di jaringan lokal, bahkan dengan konfirmasi.`,
    redPublica:
      'Jaringan ini ditandai sebagai publik di Windows: firewall akan memblokir koneksi masuk dan perintah ini hanya membuka jaringan privat. Tandai sebagai privat jika ini adalah jaringan tepercaya Anda.',
    firewallTexto:
      'WolfCore Dev tidak mengubah firewall. Jangan setujui pemberitahuan Windows untuk seluruh program: jalankan perintah untuk port ini (hanya subnet lokal dan hanya jaringan privat) di PowerShell sebagai administrator. Pada jaringan publik tidak akan terbuka, dan aturan pemblokiran yang sudah ada memiliki prioritas di atas aturan izin.',
    copiarComando: 'Salin perintah',
  },
  caMovil: {
    titulo: 'Pasang CA di ponsel',
    intro:
      'Pindai QR menggunakan ponsel yang terhubung ke jaringan yang sama untuk mengunduh sertifikat otoritas WolfCore Dev. Hanya file tersebut yang dikirimkan dan tautan akan tertutup otomatis.',
    abriendo: 'Membuka tautan…',
    expira: (minutos: number) => `Tautan akan tertutup otomatis dalam ${minutos} menit.`,
    expirado: 'Tautan telah ditutup.',
    reabrir: 'Buka lagi',
    android: 'Android',
    ios: 'iPhone atau iPad',
    pasosAndroid: [
      'Pindai QR atau buka alamatnya di browser ponsel lalu unduh filenya.',
      'Buka Setelan > Keamanan & privasi > Keamanan lainnya > Enkripsi & kredensial > Pasang sertifikat > Sertifikat CA (nama menu dapat berbeda tergantung merek).',
      'Sebelum memercayai, bandingkan sidik jari SHA-256 sertifikat yang ditampilkan ponsel dengan yang ada di dialog ini: jika tidak cocok, jangan pasang.',
      'Pilih file yang diunduh dan terima peringatannya: hal ini normal, Android selalu memberi peringatan untuk setiap CA.',
    ],
    pasosIos: [
      'Buka alamatnya di Safari dan izinkan pengunduhan profil.',
      'Buka Pengaturan > Profil Diunduh dan bandingkan sidik jari SHA-1 pada detailnya dengan yang ada di dialog ini: jika tidak cocok, jangan pasang. Kemudian pasang profilnya.',
      'Buka Pengaturan > Umum > Mengenai > Pengaturan Kepercayaan Sertifikat dan aktifkan kepercayaan penuh untuk CA WolfCore Dev.',
    ],
    aviso:
      'CA yang terpasang memberikan kepercayaan pada semua yang ditandatanganinya di ponsel tersebut: pasang hanya di perangkat Anda sendiri dan hapus setelah selesai.',
    firewallAviso: (puerto: number) =>
      'Agar ponsel dapat menjangkau tautan, port ' +
      puerto +
      ' perlu dibuka (hanya subnet lokal dan jaringan privat). Jangan setujui pemberitahuan Windows untuk seluruh program: jalankan perintah ini di PowerShell sebagai administrator. Pada jaringan publik tidak akan terbuka, dan aturan pemblokiran yang sudah ada memiliki prioritas.',
    huellas: 'Sidik jari sertifikat',
    tituloError: 'Tidak dapat membuka tautan CA',
  },
  dialogoQr: {
    descargar: 'Unduh PNG',
    descargado: 'QR tersimpan',
    largo: 'Teks terlalu panjang untuk kode QR.',
    generando: 'Membuat kode QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Akses FTP untuk ${dominio}`,
    apagadoAyuda: 'Izinkan pengunggahan file ke folder situs ini melalui FTP.',
    activoAyuda: 'Akses aktif.',
    soloLecturaEtiqueta: 'hanya baca',
    mostrarDatos: 'Tampilkan data FTP',
    ocultarDatos: 'Sembunyikan data FTP',
    host: 'Server',
    puerto: 'Port',
    usuario: 'Pengguna',
    clave: 'Kata sandi',
    mostrarClave: 'Tampilkan kata sandi',
    ocultarClave: 'Sembunyikan kata sandi',
    copiarDato: (dato: string) => `Salin ${dato}`,
    cargando: 'Membaca data FTP…',
    regenerar: 'Buat ulang kata sandi',
    regenerarTitulo: 'Buat ulang kata sandi FTP?',
    regenerarTexto:
      'Kata sandi saat ini tidak lagi berfungsi dan koneksi yang terbuka untuk situs ini akan ditutup. Anda harus memperbaruinya di klien FTP Anda.',
    regenerada: 'Kata sandi FTP dibuat ulang',
    soloLectura: 'Hanya baca',
    soloLecturaAyuda: 'File dapat diunduh, tetapi tidak dapat diunggah, diubah, atau dihapus.',
    soloLecturaActivado: 'FTP untuk situs ini sekarang hanya-baca',
    soloLecturaDesactivado: 'FTP untuk situs ini sekarang mengizinkan penulisan',
    activado: 'Akses FTP diaktifkan',
    desactivarTitulo: 'Hapus akses FTP dari situs ini?',
    desactivarTexto:
      'Kata sandi akan dihapus dan koneksi yang terbuka akan ditutup. Folder situs tidak disentuh.',
    desactivar: 'Hapus akses',
    desactivado: 'Akses FTP dihapus',
    redLocalAviso:
      'FTP menerima koneksi dari jaringan lokal dan mengirim kata sandi serta file tanpa enkripsi. Gunakan hanya di jaringan tepercaya.',
    redLocalHost: 'atau IP perangkat ini di jaringan Anda',
    servidorApagado:
      'Server FTP sedang mati: tidak ada yang dapat terhubung sebelum Anda menyalakannya.',
    encender: 'Nyalakan FTP',
    urlEtiqueta: 'Alamat',
    urlAyuda: 'Alamat ini tidak menyertakan kata sandi: kata sandi akan diminta saat terhubung.',
    abrirUrl: 'Buka di klien FTP',
    copiarUrl: 'Salin alamat FTP',
    verQr: 'Tampilkan kode QR alamat',
    qrTitulo: 'Alamat FTP situs ini',
    qrAviso: 'Kode ini hanya berisi alamat, bukan kata sandi.',
  },
  correo: {
    descripcion:
      'Penangkap email menahan email yang dikirim oleh proyek Anda agar dapat diperiksa tanpa terkirim ke internet. Penangkap hanya mendengarkan di perangkat ini (127.0.0.1) dan hanya satu yang menyala pada satu waktu.',
    seccionCaptadores: 'Penangkap lokal',
    seccionProveedores: 'Penyedia SMTP jarak jauh',
    proveedores: {
      descripcion:
        'Penyedia SMTP sungguhan benar-benar mengirim email: gunakan untuk menguji pengiriman proyek Anda sebelum dipublikasikan. Kata sandi disimpan terenkripsi di perangkat ini dan tidak pernah ditampilkan.',
      agregar: 'Tambah penyedia',
      vacio:
        'Anda belum menambahkan penyedia. Pilih Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO, atau Gmail, atau masukkan penyedia Anda sendiri.',
      errorLista: 'Gagal membaca daftar penyedia',
      tarjeta: {
        servidor: 'Server',
        usuario: 'Pengguna',
        clave: 'Kata sandi',
        sinClave: 'Tanpa kata sandi',
        claveIlegible: 'Tersimpan (gagal dibaca)',
        red: 'Jaringan',
        redLocal: 'Server di perangkat ini atau jaringan lokal (dikonfirmasi)',
        editar: 'Edit',
        borrar: 'Hapus',
        borrarTitulo: (n: string) => `Hapus ${n}?`,
        borrarTexto:
          'Penyedia dan kata sandinya yang tersimpan akan dihapus. Proyek yang menggunakannya kembali ke penangkap lokal, tetapi file .env tidak disentuh: variabel MAIL_* dari penyedia ini (dan kata sandinya, jika Anda menuliskannya) tetap ada. Tulis ulang blok email di setiap .env.',
        borrado: (n: string) => `${n} dihapus`,
        usar: 'Gunakan di proyek',
        destino: 'Alamat tujuan pengujian',
        destinoPlaceholder: 'alamat-anda@contoh.com',
        probar: 'Uji pengiriman',
        probando: 'Mengirim…',
        probarAyuda:
          'Mengirim satu email sungguhan ke alamat tersebut dengan koneksi terenkripsi terverifikasi. Maksimal satu setiap 15 dtk.',
        sinClaveParaProbar: 'Simpan kata sandi penyedia terlebih dahulu untuk menguji pengiriman.',
        hostLocal: 'Nama server ini mengarah ke perangkat ini atau jaringan lokal.',
        confirmarRed: 'Konfirmasi jaringan lokal',
        enviado: (para: string) => `Email terkirim ke ${para}. Periksa kotak masuk Anda.`,
        fallos: {
          'correo.auth': 'Penyedia menolak nama pengguna atau kata sandi.',
          'correo.conexion': 'Gagal terhubung: periksa host dan port.',
          'correo.tls':
            'Koneksi terenkripsi tidak valid (sertifikat, nama host, atau STARTTLS). Tidak ada yang dikirim.',
          'correo.rechazado':
            'Server menolak pesan atau alamat. Periksa pengirim: banyak penyedia hanya menerima pengirim atau domain terverifikasi.',
          'correo.plazo': 'Server tidak merespons tepat waktu (20 dtk).',
        },
      },
      dialogo: {
        nuevo: 'Tambah penyedia SMTP',
        editar: (n: string) => `Edit ${n}`,
        preset: 'Penyedia',
        presetOtro: 'Lainnya (masukkan data sendiri)',
        presetAyuda: 'Host dan port diambil dari dokumentasi resmi masing-masing penyedia.',
        documentacion: 'Lihat dokumentasi',
        region: 'Wilayah',
        nombre: 'Nama',
        nombreObligatorio: 'Masukkan nama.',
        host: 'Server (host)',
        hostAyuda: 'Hanya nama host atau IP, tanpa smtp:// atau port.',
        hostObligatorio: 'Masukkan server.',
        puerto: 'Port',
        seguridad: 'Enkripsi',
        seguridadAyuda:
          'Koneksi terenkripsi dengan sertifikat yang valid selalu diwajibkan: tidak pernah turun ke teks biasa.',
        tls: 'TLS langsung (port 465)',
        starttls: 'STARTTLS (port 587)',
        usuario: 'Pengguna',
        usuarioObligatorio: 'Masukkan pengguna.',
        usuarioFijoAyuda:
          'Penyedia ini selalu menggunakan pengguna ini; kata sandinya adalah milik akun Anda.',
        clave: 'Kata sandi SMTP',
        claveGuardada: (f: string) => `Tersimpan: ••••${f}`,
        claveNueva: 'Masukkan kata sandi untuk menyimpannya',
        claveAyuda:
          'Disimpan terenkripsi di perangkat ini dan tidak akan ditampilkan lagi. Biarkan kosong jika tidak ingin mengubahnya.',
        remitente: 'Pengirim pengujian (opsional)',
        remitenteAyuda:
          'Banyak penyedia hanya mengirim dari pengirim atau domain terverifikasi. Jika dibiarkan kosong, pengirim akan menggunakan alamat tujuan itu sendiri.',
        claveSinEspacios:
          'Tempel kata sandi persis seperti yang diberikan penyedia: spasi di bagian dalam akan dipertahankan.',
        borrarClave: 'Hapus kata sandi',
        borrarClaveTitulo: (n: string) => `Hapus kata sandi ${n}?`,
        borrarClaveTexto: 'Kata sandi yang tersimpan akan dihapus. Penyedia tetap ada di daftar.',
        claveBorrada: 'Kata sandi dihapus',
        guardar: 'Simpan',
        guardado: (n: string) => `${n} disimpan`,
        redLocalTitulo: 'Server di perangkat ini atau jaringan lokal',
        redLocalTexto: (h: string) =>
          `${h} mengarah ke perangkat ini atau jaringan lokal. WolfCore Dev hanya akan terhubung jika Anda mengonfirmasinya. Apakah ini server milik Anda?`,
        redLocalConfirmar: 'Ya, milik saya',
        cambiaTitulo: 'Kirim kata sandi ke server lain',
        cambiaTexto: (h: string) =>
          `Penyedia ini memiliki kata sandi tersimpan dan server atau penggunanya berubah. Kata sandi akan dikirim ke ${h}. Lanjutkan?`,
        cambiaConfirmar: 'Ya, lanjutkan',
      },
      env: {
        titulo: (n: string) => `Gunakan ${n} di proyek`,
        proyecto: 'Proyek',
        sinProyectos: 'Belum ada proyek.',
        yaUsaSmtp: 'Proyek ini sudah mengirim melalui penyedia SMTP.',
        volverCaptador: 'Kembali ke penangkap lokal',
        volvio: (n: string) =>
          `${n} kembali mengirim ke penangkap lokal, tetapi file .env tidak disentuh: variabel MAIL_* dari penyedia (dan kata sandinya, jika Anda menuliskannya) tetap ada. Tulis ulang blok emailnya.`,
        incluirClave: 'Tulis juga kata sandi ke dalam .env',
        incluirClaveAyuda:
          'Jika tidak dicentang, blok tidak menyertakan MAIL_PASSWORD dan Anda menambahkannya sendiri.',
        sinClaveGuardada: 'Penyedia ini belum memiliki kata sandi tersimpan.',
        vista: 'Perubahan pada .env (kata sandi disamarkan)',
        textoPlano:
          'Kata sandi akan tersimpan dalam teks biasa di .env proyek. Siapa pun yang memiliki akses ke folder tersebut, atau ke repositori jika diunggah, dapat membacanya.',
        claveTitulo: 'Tulis kata sandi ke dalam .env',
        claveTexto:
          'Kata sandi akan disimpan dalam teks biasa di file .env proyek. Gunakan hanya jika proyek tidak diunggah ke repositori dan folder hanya milik Anda.',
        claveConfirmar: 'Saya mengerti, sertakan kata sandi',
        agregarGitignore: 'Tambahkan .env ke .gitignore',
        gitignoreTitulo: 'Ubah .gitignore',
        gitignoreTexto:
          'Baris .env akan ditambahkan ke .gitignore proyek (dengan salinan cadangan terlebih dahulu).',
        gitignoreConfirmar: 'Tambahkan',
        versionadoTitulo: 'Git sudah melacak .env',
        versionadoTexto:
          'Commit berikutnya akan mengunggah nilai-nilai Anda. Hapus dari indeks dengan git rm --cached .env.',
        desconocidoTitulo: 'Gagal memeriksa git',
        desconocidoTexto: 'Tidak dapat memastikan apakah git melacak .env proyek ini.',
        aceptarVersionado: 'Tetap tulis',
        aceptarTitulo: 'Tulis ke .env yang dilacak git',
        aceptarTexto: 'Jika git melacak .env, variabel ini dapat masuk ke repositori. Tetap tulis?',
        aceptarConfirmar: 'Tetap tulis',
        confirmarTitulo: 'Tulis ke .env',
        confirmarTexto: (ruta: string) =>
          `Salinan dari ${ruta} akan disimpan dan variabel MAIL_* akan ditambahkan tanpa kata sandi.`,
        confirmarTextoClave: (ruta: string) =>
          `Salinan dari ${ruta} akan disimpan dan variabel MAIL_* akan ditambahkan bersama kata sandi dalam teks biasa.`,
        confirmar: 'Tulis',
        escribir: 'Tulis ke .env',
        escrito: (n: string) => `${n} sekarang mengirim melalui penyedia ini`,
      },
    },
    estado: 'Status',
    smtp: 'SMTP',
    buzon: 'Kotak masuk web',
    abrirBuzon: 'Buka kotak masuk',
    noLeidos: 'Belum dibaca',
    noLeidosValor: (n: number) => plural(n, 'email belum dibaca'),
    noLeidosError: 'Gagal membaca kotak masuk',
    actualizar: 'Hitung ulang email',
    actualizaSolo: 'Diperbarui setiap 15 detik selama layar ini terbuka.',
    env: 'Blok untuk .env Laravel',
    envAyuda: (captador: string) =>
      `Tempelkan ke .env proyek Anda. Email tetap berada di ${captador}, tanpa enkripsi dan tanpa pengguna.`,
    copiarEnv: 'Salin blok',
    irAServicios: 'Buka Layanan',
    cargando: 'Membaca penangkap email…',
    errorLista: 'Gagal membaca daftar penangkap email',
    captador: {
      opcional: 'Opsional',
      elegido: 'Menerima email dari proyek Anda',
      noInstalado: 'Belum terpasang',
      instalar: 'Pasang',
      usar: 'Gunakan ini',
      apagar: 'Matikan',
      iniciando: 'Menyalakan…',
      avisoMantenimiento:
        'Penangkap ini hampir tidak mendapat pemeliharaan. Sebaiknya gunakan Mailpit atau smtp4dev.',
    },
    notaDescartados:
      'MailHog dan MailDev tidak disediakan: MailHog tidak menerbitkan hash untuk memverifikasi unduhan dan MailDev hanya tersedia di npm. Tanpa hash yang dapat diverifikasi, tidak ada yang diunduh.',
    notaHost:
      'Kotak masuk web hanya merespons di 127.0.0.1, tetapi saat penangkap menyala, situs web berbahaya dapat mencoba membaca kotak masuk Anda (DNS rebinding). smtp4dev dan Papercut menolak header Host asing; Mailpit menyajikan kotak masuknya melalui jalur rahasia khusus perangkat ini (WolfCore Dev membuka alamat tersebut untuk Anda); Inbucket tidak memiliki perlindungan apa pun: matikan saat tidak digunakan.',
  },
  ia: {
    descripcion:
      'Penyedia AI cloud dan model lokal dengan Ollama. Kunci disimpan terenkripsi di perangkat ini dan tidak pernah ditampilkan.',
    nube: {
      titulo: 'AI cloud',
      agregar: 'Tambah penyedia',
      vacio:
        'Anda belum menambahkan penyedia. Tambahkan OpenAI, Anthropic, Gemini, Hermes (Nous), atau penyedia yang kompatibel dengan OpenAI.',
      errorLista: 'Gagal membaca daftar penyedia',
    },
    local: { titulo: 'AI lokal (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Kompatibel dengan OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Kunci',
      sinClave: 'Tanpa kunci',
      claveIlegible: 'Tersimpan (gagal dibaca)',
      url: 'URL dasar',
      modeloPorDefecto: 'Model default',
      ninguno: 'Tidak ada',
      probarConexion: 'Uji koneksi',
      probarConexionAyuda: 'Menampilkan daftar model penyedia. Tidak menghabiskan token.',
      probando: 'Menguji…',
      conectado: (ms: number, n: number) => `Terhubung · ${ms} ms · ${n} model`,
      verModelos: (n: number) => `Lihat ${n} model`,
      soloGratuitos: 'Hanya gratis',
      fallo: 'Gagal terhubung',
      probarMensaje: 'Uji pesan',
      probarMensajeAyuda:
        'Mengirim pesan singkat tetap untuk memastikan model merespons. Menghabiskan sedikit token.',
      elegirModelo: 'Model untuk pesan',
      sinModelo: 'Uji koneksi atau tetapkan model default untuk memilih salah satunya.',
      enviando: 'Mengirim…',
      respuesta: (ms: number) => `Respons dalam ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} token masukan, ${salida} token keluaran`,
      usar: 'Gunakan di proyek',
      editar: 'Edit',
      borrar: 'Hapus',
      acciones: (nombre: string) => `Tindakan untuk ${nombre}`,
    },
    costo: {
      titulo: 'Uji pesan',
      texto: (modelo: string, proveedor: string) =>
        `Pesan singkat tetap akan dikirim ke model ${modelo} dari ${proveedor}. Ini menggunakan token akun Anda: respons dibatasi hingga 16 token dan biasanya hanya memakan sebagian kecil dari satu sen.`,
      enviar: 'Kirim pesan',
    },
    dialogo: {
      nuevo: 'Tambah penyedia AI',
      editar: (nombre: string) => `Edit ${nombre}`,
      tipo: 'Tipe',
      preset: 'Penyedia yang kompatibel',
      presetAyuda: 'Mengisi nama dan URL secara otomatis; Anda dapat mengubahnya.',
      presetOtro: 'Lainnya',
      documentacion: 'Lihat dokumentasi',
      nombre: 'Nama',
      urlBase: 'URL dasar',
      urlAyuda: 'Kosong = resmi. Hanya https://, atau http:// ke 127.0.0.1 atau [::1] (LM Studio).',
      urlObligatoria: 'Masukkan URL dasar penyedia yang kompatibel.',
      modelo: 'Model default (opsional)',
      modeloAyuda: 'Digunakan pada blok .env (AI_MODEL) dan pada pesan pengujian.',
      clave: 'Kunci API',
      claveNueva: 'Tempel kunci',
      claveGuardada: (final: string) =>
        `Sudah ada kunci tersimpan (${final}). Masukkan kunci lain hanya jika ingin menggantinya.`,
      claveAyuda:
        'Disimpan terenkripsi di perangkat ini dan tidak akan ditampilkan lagi. Hanya 4 karakter terakhir yang terlihat.',
      claveOpcional: 'Opsional untuk server lokal (LM Studio).',
      borrarClave: 'Hapus kunci',
      guardar: 'Simpan',
      guardado: (nombre: string) => `${nombre} disimpan`,
      urlCambiaTitulo: 'Kunci akan dikirim ke URL lain',
      urlCambiaTexto: (url: string) =>
        `Penyedia ini memiliki kunci tersimpan. Mulai sekarang kunci akan dikirim ke ${url}. Konfirmasi hanya jika Anda memercayai server tersebut.`,
      urlCambiaConfirmar: 'Kirim kunci ke URL baru',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Hapus kunci ${nombre}?`,
      claveTexto:
        'Kunci akan dihapus dari perangkat ini. File .env tempat kunci pernah ditulis tidak disentuh: ubah juga di sana jika Anda mencabutnya.',
      proveedorTitulo: (nombre: string) => `Hapus ${nombre}?`,
      proveedorTexto:
        'Penyedia dan kuncinya yang tersimpan akan dihapus. File .env proyek Anda tidak disentuh.',
      respaldos: (n: number) =>
        n === 1
          ? 'Hapus juga salinan .env dari 1 proyek yang menyimpan kunci ini dalam teks biasa'
          : `Hapus juga salinan .env dari ${n} proyek yang menyimpan kunci ini dalam teks biasa`,
      respaldosAyuda:
        'WolfCore Dev menyimpan salinan .env sebelum menuliskannya, di luar folder proyek. Penghapusan ini tidak dapat dibatalkan.',
      claveBorrada: 'Kunci dihapus',
      proveedorBorrado: (nombre: string) => `${nombre} dihapus`,
      respaldosBorrados: (n: number) => `Salinan .env dari ${n} proyek telah dihapus`,
    },
    env: {
      titulo: (nombre: string) => `Gunakan ${nombre} di proyek`,
      proyecto: 'Proyek',
      sinProyectos: 'Tidak ada proyek yang terpasang.',
      modelo: 'Model (AI_MODEL)',
      modeloAyuda: 'Opsional. Pilih dari daftar atau ketik sendiri.',
      vista: 'Blok yang akan ditulis ke .env (kunci ditampilkan tersamar)',
      cargando: 'Menyiapkan pratinjau…',
      textoPlano:
        'Kunci akan tersimpan dalam teks biasa di .env proyek. Siapa pun yang memiliki akses ke folder tersebut dapat membacanya.',
      copiaPrevia:
        'File .env saat ini akan disalin terlebih dahulu di luar proyek (di folder data WolfCore Dev).',
      sinClave:
        'Penyedia ini memerlukan kunci: simpan terlebih dahulu sebelum menggunakannya di proyek.',
      gitignoreFalta: 'File .gitignore proyek tidak mengabaikan .env.',
      gitignoreNoExiste: 'Proyek tidak memiliki .gitignore.',
      gitignoreOk: 'File .gitignore sudah mengabaikan .env.',
      agregarGitignore: 'Tambahkan .env ke .gitignore',
      gitignoreTitulo: 'Ubah .gitignore',
      gitignoreTexto:
        'Baris .env akan ditambahkan ke .gitignore proyek (atau file akan dibuat), dengan salinan cadangan terlebih dahulu.',
      gitignoreConfirmar: 'Tambahkan ke .gitignore',
      versionadoTitulo: 'Git sudah melacak .env proyek ini',
      versionadoTexto:
        'Meskipun ada di .gitignore, commit berikutnya akan mengunggah kunci. Sebelum menulisnya, hapus dari indeks dan lakukan commit:',
      desconocidoTitulo: 'Gagal memeriksa apakah git melacak .env',
      desconocidoTexto:
        'Git tidak merespons (belum terpasang atau folder tidak tepercaya). Jika .env sudah ada di repositori, commit berikutnya akan mengunggah kunci. Periksa dengan:',
      aceptarVersionado: 'Saya memahami risikonya: tetap tulis kunci',
      aceptarTitulo: 'Tulis meskipun git dapat mengunggah kunci',
      aceptarTexto:
        'Jika .env ada di repositori, kunci akan masuk ke commit berikutnya dan riwayat repositori. Lakukan hanya jika Anda sudah menjalankan git rm --cached .env atau jika repositori hanya milik Anda.',
      aceptarConfirmar: 'Saya menerima risikonya',
      conflictoTitulo: 'File .env sudah mendefinisikan variabel ini dengan nilai lain',
      reemplazar: (claves: string) => `Ganti ${claves}`,
      reemplazarTitulo: 'Ganti variabel .env',
      reemplazarTexto: (claves: string) =>
        `Baris ${claves} yang sudah ada di .env akan dihapus dan diganti dengan blok dari WolfCore Dev. File .env sebelumnya disalin terlebih dahulu.`,
      reemplazarConfirmar: 'Ganti',
      escribir: 'Tulis ke .env',
      confirmarTitulo: 'Tulis kunci dalam teks biasa',
      confirmarTexto: (carpeta: string) =>
        `Kunci akan ditulis tanpa enkripsi di ${carpeta}. Jangan bagikan file tersebut atau mengunggahnya ke repositori.`,
      confirmar: 'Tulis kunci',
      escrito: (proyecto: string) => `Blok AI ditulis ke .env milik ${proyecto}`,
      copiarComando: 'Salin perintah',
    },
  },
  iaLocal: {
    descripcion:
      'Model bahasa yang berjalan di perangkat Anda dengan Ollama. Gunakan dari proyek Anda tanpa mengirim data ke internet.',
    sinInstalarTitulo: 'Ollama belum terpasang',
    sinInstalar: 'Pasang dari Layanan untuk mengunduh dan menggunakan model di perangkat Anda.',
    irAServicios: 'Buka Layanan',
    apagadoTitulo: 'Ollama sedang mati',
    apagado: 'Nyalakan untuk melihat, mengunduh, dan menguji model.',
    iniciando: 'Ollama sedang menyala…',
    errorTitulo: 'Ollama gagal menyala',
    encender: 'Nyalakan Ollama',
    verServicios: 'Lihat di Layanan',
    modelos: 'Model terpasang',
    sinModelos: 'Belum ada model. Unduh satu di bawah ini.',
    errorModelos: 'Gagal membaca daftar model',
    recargar: 'Muat ulang daftar',
    total: (n: number) => plural(n, 'model'),
    espacio: 'Ruang terpakai',
    espacioAyuda: 'Total ruang yang digunakan semua model di folder data.',
    probarDe: (modelo: string) => `Uji ${modelo}`,
    borrarDe: (modelo: string) => `Hapus ${modelo}`,
    borrarTitulo: (modelo: string) => `Hapus model ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `Ruang disk sebesar ${tamano} akan dibebaskan. Untuk menggunakannya lagi, Anda harus mengunduhnya kembali.`,
    borrado: (modelo: string) => `Model ${modelo} dihapus`,
    descargar: {
      titulo: 'Unduh model',
      campo: 'Nama model',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Masukkan nama yang digunakan Ollama (ollama.com/library) atau pilih saran.',
      sugerenciaAyuda: {
        'llama3.2': 'Obrolan umum, ringan',
        'qwen2.5-coder': 'Pemrograman',
        mistral: 'Obrolan umum',
        'nomic-embed-text': 'Embedding untuk pencarian (bot)',
      } as Record<string, string>,
      boton: 'Unduh',
      invalido: 'Gunakan huruf, angka, dan . _ : / - (misalnya llama3.2)',
      yaInstalado: 'Model tersebut sudah terpasang',
      enCurso: 'Model tersebut sedang diunduh',
      confirmarTitulo: (modelo: string) => `Unduh ${modelo}?`,
      confirmar: 'Unduh',
    },
    progreso: {
      fases: {
        preparando: 'Menyiapkan…',
        descargando: 'Mengunduh',
        verificando: 'Memverifikasi',
        guardando: 'Menyimpan',
        listo: 'Selesai',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} dari ${total}`,
      cancelarDe: (modelo: string) => `Batalkan pengunduhan ${modelo}`,
      cancelando: 'Membatalkan…',
      listo: (modelo: string) => `${modelo} selesai diunduh`,
      cancelado: (modelo: string) => `Pengunduhan ${modelo} dibatalkan`,
      error: (modelo: string) => `Gagal mengunduh ${modelo}`,
      descartar: 'Tutup',
      descartarDe: (modelo: string) => `Tutup pemberitahuan untuk ${modelo}`,
    },
    prueba: {
      titulo: 'Uji model',
      modelo: 'Model',
      elegir: 'Pilih model',
      prompt: 'Pesan',
      placeholder: 'Tulis pertanyaan singkat lalu tekan Enter',
      enviar: 'Kirim',
      respuesta: 'Respons',
      pensando:
        'Model sedang merespons… pertama kali mungkin memerlukan waktu lebih lama saat dimuat.',
      vacia: '(Model tidak mengembalikan teks.)',
      sinModelos: 'Unduh model terlebih dahulu untuk mengujinya.',
    },
    conexion: {
      titulo: 'Koneksi dari proyek Anda',
      base: 'URL dasar Ollama',
      openai: 'Endpoint kompatibel OpenAI',
      env: 'Blok untuk file .env',
      envAyuda:
        'Cocok untuk Laravel atau bot dengan FastAPI. WolfCore Dev tidak menulis ke proyek Anda.',
      copiarEnv: 'Salin blok',
      copiarDato: (dato: string) => `Salin ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code, dan Codex akan dapat terhubung ke model ini dengan satu klik pada Tahap B.',
  },
  proyectos: {
    titulo: 'Proyek',
    descripcion:
      'Setiap proyek adalah folder dengan situs .test, resep pemasangan, dan prosesnya sendiri.',
    agregar: 'Tambah proyek',
    vacioTitulo: 'Belum ada proyek',
    vacio:
      'Klon repositori GitHub atau pilih folder: WolfCore Dev mendeteksi jenis proyek dan menyiapkannya langkah demi langkah.',
    pasos: {
      porTipo: {
        'composer-install': 'Pasang dependensi PHP (composer install)',
        'env-crear': 'Buat file .env',
        'key-generate': 'Buat kunci aplikasi',
        'bd-crear': 'Buat basis data',
        'bd-restaurar': 'Pulihkan cadangan',
        migrar: 'Migrasikan basis data',
        'storage-link': 'Tautkan storage (storage:link)',
        'npm-ci': 'Pasang dependensi Node (npm ci)',
        'npm-build': 'Kompilasi aset (npm run build)',
        'python-venv': 'Buat lingkungan virtual (.venv)',
        'pip-install': 'Pasang dependensi Python (pip)',
        'pgvector-activar': 'Aktifkan pgvector di basis data',
        'sitio-crear': 'Buat situs',
        comando: 'Perintah proyek',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Buat situs ${dominio}` : 'Buat situs'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Pulihkan cadangan ${archivo}` : 'Pulihkan cadangan',
      migrar: 'Migrasikan basis data',
      migrarSemilla: 'Migrasikan basis data dan muat data uji (--seed)',
      comando: (linea: string) => (linea ? `Jalankan: ${linea}` : 'Perintah proyek'),
    },
    estadoPaso: {
      pendiente: 'Menunggu',
      corriendo: 'Sedang berjalan',
      listo: 'Selesai',
      error: 'Gagal',
      omitido: 'Dilewati',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Belum disiapkan',
      corriendo: 'Menyiapkan…',
      lista: 'Siap',
      error: 'Ada langkah yang gagal',
      cancelada: 'Penyiapan dibatalkan',
      incompleta: 'Penyiapan belum lengkap',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Tambah proyek',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Folder' },
      destino: 'Folder tujuan',
      destinoAyuda: (base: string) =>
        `Diklon ke ${base}. Untuk lokasi lain, gunakan "Pilih folder…".`,
      nombreCarpeta: 'Nama folder',
      nombrePlaceholder: 'proyek-saya',
      elegirDestino: 'Pilih folder…',
      destinoPorDefecto: 'Gunakan folder proyek',
      clonar: 'Klon',
      clonando: 'Mengklon…',
      clonado: 'Repositori berhasil diklon',
      errorClonar: 'Gagal mengklon repositori',
      sinCancelar:
        'Proses klon tidak dapat dihentikan dari sini: tunggu hingga selesai (mungkin memakan waktu beberapa menit).',
      sinGit:
        'Git belum terpasang. Pasang terlebih dahulu (git-scm.com) lalu buka kembali dialog ini.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Terhubung dengan GitHub CLI sebagai ${usuario}` : 'Terhubung dengan GitHub CLI',
      estadoToken: 'Terhubung dengan token pribadi',
      estadoNinguna: 'Tidak terhubung ke GitHub',
      ayudaNinguna:
        'Masuk dengan GitHub CLI (disarankan) atau gunakan fine-grained personal access token dengan izin baca konten.',
      instalarGh: 'Pasang GitHub CLI',
      instalandoGh: 'Menginstal GitHub CLI…',
      ghInstalado: 'GitHub CLI terinstal. Sekarang masuklah ke akun Anda.',
      iniciarSesion: 'Masuk',
      sesionAbierta: 'Jendela untuk masuk telah dibuka. Setelah selesai, tekan "Periksa lagi".',
      comprobar: 'Periksa lagi',
      usarToken: 'Gunakan token',
      token: 'Token pribadi GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Disimpan terenkripsi di perangkat ini dan tidak pernah ditampilkan lagi atau ditulis ke dalam proyek.',
      guardarToken: 'Simpan token',
      tokenGuardado: 'Token disimpan',
      quitarToken: 'Hapus token',
      tokenQuitado: 'Token dihapus',
      buscar: 'Cari repositori',
      cargando: 'Memuat repositori…',
      sinRepos: 'Tidak ada repositori yang ditemukan.',
      cargarMas: 'Muat lebih banyak',
      privado: 'Privat',
      yaClonado: 'Sudah dikloning',
      yaClonadoAyuda: 'Sudah ada proyek dengan repositori ini atau di folder tujuannya.',
      actualizado: (fecha: string) => `Diperbarui ${fecha}`,
      elegir: 'Pilih',
      errorRepos: 'Tidak dapat membaca daftar repositori',
    },
    url: {
      etiqueta: 'URL repositori',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:path, atau pengguna/proyek (GitHub). Tanpa nama pengguna atau kata sandi di URL.',
      invalida: 'Gunakan https://…, git@host:path, atau pengguna/proyek',
    },
    carpeta: {
      titulo: 'Proyek yang sudah ada di perangkat',
      texto: 'Pilih folder: jenis proyek akan dideteksi dan resepnya akan disarankan.',
      elegir: 'Pilih folder',
      manual: 'Tambahkan tanpa resep (konfigurasi manual)',
      yaEsProyecto: (nombre: string) => `Folder tersebut sudah menjadi proyek ${nombre}.`,
      vigilarTitulo: 'Folder yang dipantau',
      vigilarTexto:
        'WolfCore Dev memberi tahu saat muncul folder baru yang tampak seperti proyek. Ini juga lokasi tempat repositori dikloning.',
      vigilando: (carpeta: string) => `Memantau ${carpeta}`,
      sinVigilar: 'Tidak ada folder yang dipantau.',
      vigilar: 'Pilih folder untuk dipantau',
      cambiarVigilada: 'Ubah',
      dejarDeVigilar: 'Berhenti memantau',
    },
    asistente: {
      titulo: (nombre: string) => `Siapkan ${nombre}`,
      cargando: 'Menganalisis proyek…',
      origenYml: 'Resep berasal dari wolfcore.yml di repositori.',
      origenDefecto: 'Resep disarankan berdasarkan jenis proyek.',
      deteccion: 'Yang terdeteksi',
      deteccionAyuda: 'Perbaiki jika ada yang tidak sesuai dengan proyek.',
      tipo: 'Jenis',
      php: 'PHP',
      phpNinguno: 'Tidak ada yang terinstal',
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
      versionAuto: 'Sesuai yang terdeteksi',
      servicios: 'Layanan',
      serviciosNinguno: 'Tidak ada',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Terdeteksi: ${v}`,
      nodeInstalar: 'Node belum terinstal: instal di Layanan.',
      pythonInstalar: 'Python belum terinstal: instal di Layanan.',
      lenguajeInstalar: (nombre: string) => `${nombre} belum terinstal: instal di Layanan.`,
      dominio: 'Domain',
      puertoProxy: 'Port lokal',
      puertoPlaceholder: '8000',
      receta: 'Langkah-langkah',
      recetaAyuda:
        'Dijalankan secara berurutan. Nonaktifkan yang tidak diinginkan; langkah opsional dapat dipindahkan.',
      subir: 'Naikkan',
      bajar: 'Turunkan',
      fijo: 'Langkah ini wajib',
      restaurar: 'Pulihkan cadangan…',
      cambiarRespaldo: 'Ubah cadangan',
      quitarRespaldo: 'Hapus cadangan',
      sobrescribir: 'Timpa basis data jika sudah memiliki tabel',
      semilla: 'Muat data uji (--seed)',
      sinMotor:
        'Tanpa basis data: pilih mesin di Layanan untuk membuatnya atau memulihkan cadangan.',
      confio: 'Saya mempercayai repositori ini: jalankan langkah instalasinya',
      confioAyuda:
        'Langkah-langkah ini menjalankan program proyek (composer, npm, pip, migrasi) di perangkat Anda. Centang hanya jika Anda mengenal kodenya.',
      montar: 'Siapkan proyek',
      montando: 'Menyiapkan proyek…',
      reintentar: 'Coba lagi',
      omitir: 'Lewati',
      cancelar: 'Batal',
      cancelando: 'Membatalkan…',
      cerrar: 'Tutup',
      cerrarCorriendo: 'Sembunyikan (tetap berjalan di latar belakang)',
      abrirSitio: 'Buka situs',
      verRegistro: 'Lihat log',
      ocultarRegistro: 'Sembunyikan log',
      listo: 'Proyek sudah siap.',
      fallo: (paso: string) =>
        `Gagal: ${paso}. Coba lagi, lewati, atau batalkan; tidak ada yang dibatalkan.`,
      cancelada: 'Persiapan dibatalkan. Anda dapat melanjutkannya dari kartu proyek.',
      incompleta: 'Masih ada langkah yang belum dijalankan.',
      errorCrear: 'Tidak dapat membuat proyek',
      errorReceta: 'Tidak dapat membaca resep',
      recetaCambio:
        'Resep proyek (wolfcore.yml) telah berubah sejak Anda mempercayainya. Coba lagi menggunakan resep yang tersimpan dari terakhir kali.',
      recargar: 'Tinjau resep baru',
      seguirGuardada: 'Lanjutkan dengan yang tersimpan',
      soloLectura: 'Jenis, PHP, domain, versi, dan port mengikuti proyek: ubah melalui Edit.',
    },
    tarjeta: {
      receta: 'Persiapan',
      reinstalar: 'Instal ulang dependensi',
      reinstalarTitulo: (nombre: string) => `Jalankan resep untuk ${nombre}?`,
      reinstalarTexto:
        'Langkah-langkah dari persiapan terakhir (yang Anda tinjau di asisten) akan diulang:',
      noRestaura: 'tidak dipulihkan ulang',
      recetaCambio:
        'Resep proyek (wolfcore.yml) telah berubah sejak Anda mempercayainya. Instal ulang akan mengulang resep yang tersimpan; gunakan "Tinjau resep" untuk memeriksa yang baru.',
      revisarReceta: 'Tinjau resep',
      preparar: 'Siapkan…',
      ejecutar: 'Jalankan',
      verPreparacion: 'Lihat persiapan',
      sinConfianza:
        'Tinjau resep dan centang "Saya mempercayai repositori ini" di asisten agar dapat menjalankannya.',
      runtimes: 'Pemberitahuan versi',
      verRegistros: 'Lihat log',
      abrirAgente: 'Buka agen AI',
      vscode: 'Editor',
      vscodeAyuda: 'Buka folder proyek di editor bawaan',
      vscodeError: 'Tidak dapat membuka editor',
      baseDatos: 'Basis data',
      baseDatosAyuda: (base: string) =>
        `Buka basis data "${base}" yang sudah terautentikasi (Adminer atau phpMyAdmin)`,
      baseDatosSinDetectar: 'Buka basis data proyek (Adminer atau phpMyAdmin)',
      sinBase: 'File .env proyek tidak mendeklarasikan basis data MySQL, MariaDB, atau PostgreSQL.',
      adminerNoListo: 'Adminer belum siap',
      entradaAutomatica: 'Masuk sudah terautentikasi, tanpa mengetik kata sandi.',
      elegirBd: 'Pilih Adminer atau phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (khusus MySQL dan MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin belum siap',
      entroComoAdmin: (usuario: string) =>
        `Masuk sebagai ${usuario}, administrator server, karena proyek ini tidak menggunakan pengguna khusus. Di pengelola .env, "Gunakan pengguna khusus" membuat pengguna yang terbatas pada basis datanya.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Masuk sebagai ${usuario}, administrator server: kata sandi pengguna khusus proyek ini tidak tersimpan di perangkat ini. Di pengelola .env, "Gunakan pengguna khusus" akan membuat yang baru.`,
      abrirSitio: 'Buka situs di browser',
      github: 'Repositori',
      abrirRemoto: (url: string) => `Buka ${url}`,
      confiado: 'Tepercaya',
      confiadoAyuda: 'Langkah instalasinya dapat dijalankan.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'HEAD terlepas',
      cambios: (n: number) => plural(n, 'perubahan belum disimpan'),
      limpio: 'Tidak ada perubahan',
      atras: (n: number) => `${n} untuk ditarik`,
      adelante: (n: number) => `${n} untuk diunggah`,
      traer: 'Tarik perubahan',
      traerAyuda:
        'git pull tanpa penggabungan: jika ada perubahan lokal atau cabang divergen, tidak ada yang diubah.',
      alDia: 'Sudah terbaru.',
      actualizado: 'Perubahan ditarik',
      sugeridosTitulo: 'Perubahan ditarik',
      sugeridosTexto: 'Berdasarkan apa yang berubah, sebaiknya jalankan langkah-langkah ini:',
      sugeridosNinguno: 'Tidak perlu menjalankan langkah apa pun.',
      migracionesNuevas: (n: number) => plural(n, 'migrasi baru'),
      ejecutarSugeridos: 'Jalankan langkah',
      corridaTitulo: 'Langkah setelah menarik perubahan',
      corridaAyuda: 'Tidak mengubah resep proyek yang tersimpan.',
      ahoraNo: 'Jangan sekarang',
      errorEstado: 'Tidak dapat membaca status Git',
      commitIa: {
        boton: 'Sarankan commit',
        ayuda:
          'Mengusulkan pesan dengan AI untuk perubahan yang disiapkan (git add) dan melakukan commit jika Anda menyetujuinya.',
        titulo: 'Commit dengan pesan yang disarankan',
        proveedor: 'Penyedia AI',
        modelo: 'Model',
        sinProveedores: 'Konfigurasikan penyedia AI cloud (layar AI) untuk menyarankan pesan.',
        privacidad:
          'Diff dari perubahan yang disiapkan dikirim ke penyedia, tanpa .env, kunci, sertifikat, file kredensial, atau biner, dan maksimal 20.000 karakter. Menggunakan sedikit token.',
        sugerir: 'Sarankan pesan',
        mensaje: 'Pesan (dapat diedit)',
        commit: 'Lakukan commit',
        commitAyuda:
          'Hanya yang sudah disiapkan (git add): tidak menambahkan file atau melakukan push.',
        hecho: 'Commit selesai dengan perubahan yang disiapkan.',
      },
    },
    procesos: {
      titulo: 'Proses',
      /** Pesan supervisor untuk proses tanpa mulai ulang yang keluar dengan kode 0. */
      terminado: 'Selesai tanpa kesalahan',
      ninguno: 'Belum ada proses. Tambahkan npm run dev, queue:work, uvicorn…',
      agregar: 'Tambah proses',
      editar: 'Edit proses',
      nuevo: 'Proses baru',
      interruptor: (nombre: string) => `Nyalakan atau matikan ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx meneruskan situs ke proses ini.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'mulai ulang'),
      verLog: 'Lihat log',
      ocultarLog: 'Sembunyikan log',
      logVacio: 'Belum ada keluaran.',
      abrirCarpetaLog: 'Buka folder log',
      quitar: 'Hapus proses',
      quitarTitulo: (nombre: string) => `Hapus proses ${nombre}?`,
      quitarTexto: 'Jika sedang berjalan, proses akan dihentikan.',
      nombre: 'Nama',
      nombrePlaceholder: 'Vite',
      comando: 'Perintah',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda:
        'Program dan argumen, tanpa shell. Gunakan tanda kutip untuk argumen dengan spasi.',
      cwd: 'Folder',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz atau subfolder proyek (misalnya, frontend).',
      puertoCampo: 'Port',
      puertoNinguno: 'Tidak ada',
      puertoAyuda: 'Hanya sebagai informasi, kecuali proses ini menjadi tujuan proxy.',
      autoIniciar: 'Nyalakan saat WolfCore Dev dimulai',
      reiniciar: 'Mulai ulang jika berhenti mendadak',
      esProxy: 'Tujuan proxy Nginx',
      requiereReinicio:
        'Proses sedang berjalan: perubahan perintah, folder, atau port akan diterapkan saat dimulai ulang.',
      reinicieAhora: 'Disimpan. Matikan dan nyalakan kembali proses untuk menerapkan perubahan.',
      guardado: 'Proses disimpan',
      errores: {
        comando: 'Masukkan perintah',
        puerto: 'Port harus antara 1 dan 65535',
        proxySinPuerto: 'Tujuan proxy memerlukan port',
        cwd: 'Gunakan raiz atau subfolder di dalam proyek',
        repetido: 'Sudah ada proses dengan nama tersebut',
      },
      estados: {
        encendido: 'Aktif',
        apagado: 'Mati',
        iniciando: 'Memulai…',
        error: 'Kesalahan',
        externo: 'Eksternal',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Log ${nombre}`,
      fuente: 'Sumber',
      ninguna: 'Proyek ini belum memiliki log.',
      vacio: 'Log kosong.',
      actualizar: 'Segarkan',
      abrirCarpeta: 'Buka folder',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Ada satu folder baru yang tampak seperti proyek'
          : `Ada ${n} folder baru yang tampak seperti proyek`,
      montar: 'Siapkan',
      ignorar: 'Abaikan',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Email belum dibaca',
    correoApagado: 'Mailpit mati',
    correoSinInstalar: 'Mailpit belum terinstal',
    modelos: 'Model AI',
    iaApagada: 'Ollama mati',
    iaSinInstalar: 'Ollama belum terinstal',
    sinLeer: 'Tidak dapat membaca',
    sinDato: '—',
  },
  /* ───────────── Panel performa, penampil log, dan MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 'dtk',
    minutos: 'mnt',
    horas: 'j',
    dias: 'h',
    /** Worker N dari sebuah layanan (mis. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Performa',
    ventana: '5 menit terakhir',
    pausado: 'Dijeda saat jendela disembunyikan',
    esperando: 'Menunggu sampel pertama…',
    errorMuestreo: (detalle: string) => `Tidak dapat meminta sampel performa: ${detalle}`,
    cpu: 'CPU',
    ram: 'Memori',
    disco: 'Disk data',
    red: 'Jaringan',
    deTotal: (usado: string, total: string) => `${usado} dari ${total}`,
    libre: (libre: string) => `${libre} tersedia`,
    bajada: 'Unduh',
    subida: 'Unggah',
    graficaCpu: (valor: string) => `Grafik CPU 5 menit terakhir; saat ini ${valor}`,
    graficaRam: (valor: string) => `Grafik memori 5 menit terakhir; saat ini ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Grafik jaringan 5 menit terakhir; unduh ${bajada}, unggah ${subida}`,
    alertas: {
      titulo: 'Peringatan',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Port ${puerto} milik ${servicio} digunakan oleh program lain: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Memori perangkat mencapai ${porcentaje}%. Matikan yang tidak digunakan agar semuanya lebih responsif.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Ada php-cgi yang bukan milik WolfCore Dev (PID ${pid}) yang mendengarkan di ${puertos.join(', ')}: tersisa dari sesi sebelumnya.`,
      finalizar: 'Akhiri proses',
      finalizarTitulo: 'Akhiri proses ini?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) akan ditutup tanpa menyimpan apa pun yang sedang terbuka. Gunakan hanya jika Anda yakin program tersebut tidak diperlukan.`,
      finalizado: (nombre: string) => `${nombre} diakhiri`,
      verPuertos: 'Lihat port',
      errorPuertos: 'Tidak dapat memeriksa program yang menggunakan port.',
    },
    procesos: {
      titulo: 'Layanan dan proses',
      vacio: 'Tidak ada layanan atau proses proyek yang sedang berjalan.',
      nombre: 'Nama',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Port',
      encendido: 'Aktif',
      acciones: 'Tindakan',
      detener: 'Hentikan',
      registros: 'Lihat log',
      servicio: 'Layanan',
      proyecto: 'Proyek',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Log',
    descripcion:
      'Pantau log secara langsung untuk Nginx, PHP, layanan, situs, proses proyek, dan terowongan.',
    fuente: 'Sumber',
    elegirFuente: 'Pilih log',
    sinFuentes:
      'Belum ada log. Log akan muncul saat layanan, situs, atau proses menulis entri pertamanya.',
    buscar: 'Filter berdasarkan teks',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Jeda',
    reanudar: 'Lanjutkan',
    pausadoNuevas: (n: number) => (n === 1 ? '1 baris baru dijeda' : `${n} baris baru dijeda`),
    copiar: 'Salin yang terlihat',
    copiadas: (n: number) => (n === 1 ? '1 baris disalin' : `${n} baris disalin`),
    limpiar: 'Bersihkan',
    abrirCarpeta: 'Buka folder',
    alFinal: 'Ikuti bagian akhir',
    mostrarMas: 'Tampilkan lebih banyak',
    ocultas: (n: number) =>
      n === 1 ? '1 baris sebelumnya tidak ditampilkan' : `${n} baris sebelumnya tidak ditampilkan`,
    vacio: 'Belum ada baris. Baris baru akan muncul di sini segera setelah ditulis.',
    sinCoincidencias: 'Tidak ada baris yang cocok dengan filter.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} baris` : `${visibles} dari ${total} baris`,
    descartadas: (n: number) => `(5000 baris terakhir disimpan; ${n} baris terlama dibuang)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Layanan',
      sitio: 'Situs',
      laravel: 'Laravel',
      proyecto: 'Proses proyek',
      tunel: 'Terowongan',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (akses)',
      nginxError: 'Nginx (kesalahan)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (akses)`,
      sitioError: (dominio: string) => `${dominio} (kesalahan)`,
      tunel: (sitio: string) => `Terowongan ${sitio}`,
      tunelSalida: (sitio: string) => `Terowongan ${sitio} (keluaran)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Buka terminal baru untuk melihat perubahan: terminal yang sudah terbuka tidak melihatnya.',
    enPathSinCliente: 'Ada di PATH, tetapi perintahnya hilang',
    reparar: 'Perbaiki',
    repararTitulo: 'Perbaiki perintah wolf?',
    repararTexto:
      'wolf ada di PATH tetapi file-filenya tidak lengkap. File akan disalin ulang ke folder data dan server lokal akan dinyalakan, seperti saat menambahkannya.',
    titulo: 'Terminal: perintah wolf',
    descripcion:
      'Kelola WolfCore Dev dari PowerShell, cmd, atau Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Hanya berfungsi saat aplikasi terbuka.',
    activo: 'Tersedia di PATH',
    enPathSinServidor: 'Di PATH, server mati',
    inactivo: 'Tidak ada di PATH',
    agregarBoton: 'Tambahkan wolf ke PATH',
    quitarBoton: 'Hapus wolf dari PATH',
    agregarTitulo: 'Tambahkan wolf ke PATH pengguna?',
    agregarTexto:
      'Perintah wolf akan disalin ke folder data WolfCore Dev, folder tersebut akan ditambahkan ke PATH pengguna Anda (salinan PATH asli disimpan), dan server lokal akan dijalankan di 127.0.0.1 yang hanya melayani wolf dengan kunci yang berubah setiap kali dijalankan. Mempublikasikan situs ke internet atau mengganti PHP untuk semua terminal juga selalu meminta konfirmasi di jendela aplikasi. Anda dapat menghapusnya kapan saja.',
    agregar: 'Tambahkan',
    quitarTitulo: 'Hapus wolf dari PATH?',
    quitarTexto:
      'Folder wolf akan dihapus dari PATH pengguna Anda, server lokal akan dimatikan, dan salinan perintah akan dihapus. Terminal yang sedang terbuka tidak berubah.',
    quitar: 'Hapus',
    listoTitulo: 'Perintah wolf diperbarui',
    ayuda: 'Buka terminal baru setelah menambahkannya. Server hanya mendengarkan di 127.0.0.1.',
    aislado: 'Dengan folder data uji (WOLFCORE_DATOS), PATH tidak diubah.',
    errorCargar: (detalle: string) => `Tidak dapat membaca status wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Server MCP',
    descripcion:
      'Memungkinkan Claude Code dan asisten lainnya mengelola situs, layanan, dan basis data Anda dari perangkat ini. Hanya mendengarkan di 127.0.0.1 dan memerlukan token.',
    estado: 'Status',
    activo: 'Aktif',
    inactivo: 'Dihentikan',
    activar: 'Aktifkan',
    detener: 'Hentikan',
    activado: 'Server MCP aktif',
    detenido: 'Server MCP dihentikan',
    direccion: 'Alamat',
    puerto: 'Port',
    puertoAyuda: 'Antara 1024 dan 65535. Jika aktif, server akan dimulai ulang pada port baru.',
    puertoRango: 'Gunakan angka antara 1024 dan 65535',
    puertoGuardado: (p: number) => `Server MCP akan menggunakan port ${p}`,
    copiarConfig: 'Salin konfigurasi untuk Claude Code',
    copiarConfigAyuda:
      'Menyalin konfigurasi beserta token ke papan klip. Tempelkan di Claude Code; token tidak ditampilkan di sini.',
    configCopiada: 'Konfigurasi disalin ke papan klip',
    regenerar: 'Buat ulang token',
    regenerarTitulo: 'Buat ulang token server MCP?',
    regenerarTexto:
      'Token saat ini akan langsung tidak berlaku: asisten yang terhubung harus menggunakan konfigurasi baru.',
    regenerado: 'Token dibuat ulang. Salin konfigurasi kembali.',
    errorCargar: (detalle: string) => `Tidak dapat membaca status server MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Asisten meminta konfirmasi',
      herramienta: 'Alat',
      pendientes: (actual: number, total: number) => `${actual} dari ${total}`,
      aprobar: 'Setujui',
      rechazar: 'Tolak',
      aprobada: 'Tindakan disetujui',
      rechazada: 'Tindakan ditolak',
      vencida: 'Permintaan sudah tidak tertunda lagi.',
      descartadas: (n: number) =>
        n === 1
          ? 'dan 1 lagi yang tidak muat (akan kedaluwarsa otomatis)'
          : `dan ${n} lagi yang tidak muat (akan kedaluwarsa otomatis)`,
      falloRespuesta: (detalle: string) =>
        `Tidak dapat mengirim respons; permintaan masih tertunda. ${detalle}`,
      si: 'Ya',
      no: 'Tidak',
      campos: {
        motor: 'Mesin',
        base: 'Basis data',
        archivo: 'File',
        sobrescribir: 'Timpa',
        pid: 'PID',
        nombre: 'Proses',
        proyecto: 'Proyek',
        pasos: 'Langkah',
        cantidad: 'Dump',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion:
      'Utilitas untuk kebutuhan sehari-hari. Berfungsi offline dan tanpa layanan eksternal.',
    buscar: 'Cari alat…',
    sinResultados: 'Tidak ada alat yang cocok dengan pencarian.',
    abrir: 'Buka',
    procesar: 'Memproses…',
    copiar: 'Salin',
    copiado: 'Disalin ke papan klip',
    limpiar: 'Bersihkan',
    pendienteApi: 'Tertunda: inti belum mengekspos informasi ini ke antarmuka.',
    lista: {
      qr: { nombre: 'Generator QR', descripcion: 'Dari teks atau tautan terowongan; PNG.' },
      json: {
        nombre: 'JSON',
        descripcion: 'Format, validasi, dan minifikasi, dengan tampilan pohon.',
      },
      regex: {
        nombre: 'Ekspresi reguler',
        descripcion: 'Penguji dengan kecocokan, grup, dan referensi.',
      },
      diff: {
        nombre: 'Bandingkan teks',
        descripcion: 'Perbedaan berdampingan, juga untuk file.',
      },
      tiempo: { nombre: 'Waktu', descripcion: 'Timestamp ↔ tanggal, dengan zona waktu.' },
      puertos: {
        nombre: 'Port dan proses',
        descripcion: 'Lihat apa yang mendengarkan di setiap port dan akhiri prosesnya.',
      },
      bom: { nombre: 'Pembersihan BOM UTF-8', descripcion: 'Menghapus BOM dari file atau folder.' },
      certificados: {
        nombre: 'Sertifikat',
        descripcion: 'Terbitkan dengan CA WolfCore Dev untuk nama apa pun.',
      },
      cripto: {
        nombre: 'Kripto',
        descripcion: 'Hash, base64, URL, UUID, kata sandi, dan JWT.',
      },
      markdown: { nombre: 'Pratinjau Markdown', descripcion: 'Tulis dan lihat hasilnya.' },
      entorno: { nombre: 'Lingkungan sistem', descripcion: 'PATH, versi, dan variabel.' },
      buscar: {
        nombre: 'Cari',
        descripcion: 'Teks dalam nama dan isi proyek, folder, atau file.',
      },
      infoArchivo: {
        nombre: 'Informasi file',
        descripcion: 'Ukuran, jenis, dan hash dari sebuah file.',
      },
      websocket: { nombre: 'Klien WebSocket', descripcion: 'Hubungkan, kirim, dan lihat pesan.' },
      contrasenas: {
        nombre: 'Kata sandi',
        descripcion: 'Ukur kekuatan kata sandi dan periksa akun lemah pada basis data Anda.',
      },
      qrWifi: {
        nombre: 'QR Wi-Fi',
        descripcion: 'Kode QR agar orang lain dapat terhubung ke jaringan Anda.',
      },
      imagenes: {
        nombre: 'Gambar',
        descripcion: 'Konversi ke ICO atau PNG serta kompres JPEG atau WebP.',
      },
      comprimir: {
        nombre: 'ZIP dan PDF',
        descripcion: 'Kompres file dan folder ke ZIP serta optimalkan PDF.',
      },
      conversor: {
        nombre: 'Konverter dokumen',
        descripcion:
          'Konversi Word, Excel, PDF, CSV, dan Markdown tanpa meninggalkan perangkat ini.',
      },
    },
    errores: {
      jsonVacio: 'Tulis atau tempelkan JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `JSON tidak valid: periksa baris ${linea}, kolom ${columna}.`,
      banderas: 'Flag tidak valid: gunakan hanya d, g, i, m, s, u, v, atau y, tanpa pengulangan.',
      trabajador: 'Tidak dapat menjalankan operasi di latar belakang.',
      diffLento: 'Teks terlalu berbeda untuk dibandingkan tepat waktu.',
      base64: 'Base64 tidak valid.',
      utf8: 'Konten yang didekode bukan teks UTF-8.',
      url: 'Urutan URL tidak valid.',
      coste: (max: number) => `Biaya bcrypt harus antara 4 dan ${max}.`,
      jwtPartes: 'JWT harus memiliki tiga bagian yang dipisahkan oleh titik.',
      jwtCabecera: 'Tidak dapat membaca header JWT.',
      jwtCarga: 'Tidak dapat membaca payload JWT.',
      longitud: 'Panjang harus antara 4 dan 256.',
      sinConjuntos: 'Pilih setidaknya satu jenis karakter.',
      sinDominios: 'Masukkan setidaknya satu nama atau IP.',
      muchosDominios: (max: number) => `Maksimal ${max} nama per sertifikat.`,
    },
    qr: {
      texto: 'Teks atau URL',
      textoAyuda: 'QR dibuat secara lokal di perangkat ini; tidak ada yang dikirim ke jaringan.',
      tunel: 'Tautan terowongan dari proyek',
      sinTuneles: 'Tidak ada terowongan aktif',
      descargar: 'Unduh PNG',
      vacio: 'Tulis sesuatu untuk membuat kode.',
      largo: 'Teks terlalu panjang untuk kode QR.',
      descargado: 'Unduhan dimulai.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Format',
      minificar: 'Minifikasi',
      validar: 'Validasi',
      valido: 'JSON valid.',
      resultado: 'Hasil',
      arbol: 'Pohon',
      mas: (n: number) => `… ${n} lainnya`,
    },
    regex: {
      patron: 'Pola',
      banderas: 'Flag',
      texto: 'Teks uji',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} kecocokan${truncado ? ' (hanya menampilkan yang pertama)' : ''}`,
      sinCoincidencias: 'Tidak ada kecocokan.',
      tiempo:
        'Ekspresi berjalan terlalu lama dan dihentikan (kemungkinan catastrophic backtracking).',
      grupo: (n: number) => `Grup ${n}`,
      referencia: 'Referensi cepat',
      tabla: [
        ['.', 'Karakter apa pun (kecuali baris baru tanpa s)'],
        ['\\d \\w \\s', 'Digit, huruf/angka/_, dan spasi'],
        ['\\D \\W \\S', 'Kebalikan dari yang di atas'],
        ['[abc] [^abc]', 'Salah satu dari daftar / bukan dari daftar'],
        ['^ $', 'Awal dan akhir (baris dengan m)'],
        ['\\b', 'Batas kata'],
        ['* + ?', 'Nol atau lebih, satu atau lebih, opsional'],
        ['{n,m}', 'Antara n dan m pengulangan'],
        ['*? +?', 'Versi malas (lazy)'],
        ['(…) (?<nama>…)', 'Grup penangkap dan bernama'],
        ['(?:…)', 'Grup tanpa penangkapan'],
        ['(?=…) (?!…)', 'Diikuti oleh / tidak diikuti oleh'],
        ['a|b', 'Alternatif'],
        ['g i m s u y', 'Global, abaikan huruf besar/kecil, multibaris, dotAll, Unicode, sticky'],
      ] as [string, string][],
    },
    diff: {
      original: 'Asli',
      modificado: 'Diubah',
      cargarArchivo: 'Muat file',
      comparar: 'Bandingkan',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} baris`,
      iguales: 'Kedua teks identik.',
      archivoGrande: 'Ukuran file melebihi 5 MB; pilih file yang lebih kecil.',
      textoGrande: 'Setiap teks maksimal berukuran 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `Menampilkan ${mostradas} baris pertama dari ${total} baris.`,
    },
    tiempo: {
      timestamp: 'Timestamp (detik atau milidetik)',
      fecha: 'Tanggal (YYYY-MM-DD HH:mm:ss)',
      zona: 'Zona waktu',
      ahora: 'Sekarang',
      segundos: 'Detik',
      milisegundos: 'Milidetik',
      iso: 'ISO 8601 (UTC)',
      enZona: 'Di zona waktu terpilih',
      desplazamiento: 'Offset',
      relativo: 'Relatif',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Dibaca dalam detik' : 'Dibaca dalam milidetik',
      timestampInvalido: 'Masukkan angka saja (boleh diawali tanda).',
      fechaInvalida: 'Gunakan format YYYY-MM-DD HH:mm[:ss] dengan tanggal yang valid.',
      zonaInvalida: 'Zona waktu tidak dikenal.',
    },
    puertos: {
      filtro: 'Filter berdasarkan port, PID, atau nama',
      actualizar: 'Perbarui',
      columnas: {
        puerto: 'Port',
        protocolo: 'Protokol',
        proceso: 'Proses',
        pid: 'PID',
        direcciones: 'Alamat',
        acciones: 'Tindakan',
      },
      propio: 'WolfCore Dev',
      sistema: 'Sistem',
      finalizar: 'Akhiri',
      noFinalizable: 'Proses sistem dan proses WolfCore Dev tidak dapat diakhiri dari sini.',
      confirmarTitulo: 'Akhiri proses',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) akan ditutup tanpa menyimpan. Untuk mengonfirmasi, ketik nama proses:`,
      finalizado: (nombre: string) => `${nombre} telah diakhiri.`,
      vacio: 'Tidak ada port yang digunakan atau tidak dapat dibaca.',
    },
    bom: {
      explicacion:
        'Pertama ditampilkan file mana saja yang memiliki BOM; saat dibersihkan, salinan cadangan .bak-bom disimpan untuk masing-masing file. node_modules, vendor, .git, dan file biner dilewati.',
      elegirArchivos: 'Pilih file',
      elegirCarpeta: 'Pilih folder',
      seleccion: (n: number) => `${n} jalur dipilih`,
      analizar: 'Analisis',
      limpiar: 'Hapus BOM',
      confirmar: (n: number) =>
        `BOM akan dihapus dari ${n} file (dengan salinan cadangan). Lanjutkan?`,
      conBom: (n: number) => `${n} file dengan BOM`,
      sinBom: 'Tidak ada file yang memiliki BOM.',
      limpiados: (n: number) => `${n} file dibersihkan.`,
      copia: 'Salinan',
    },
    certificados: {
      explicacion:
        'Menandatangani sertifikat dengan CA lokal WolfCore Dev. File .crt disimpan di lokasi pilihan Anda dan kuncinya (.key) disimpan di sebelahnya; kunci tidak pernah melewati antarmuka.',
      dominios: 'Nama atau IP (dipisahkan spasi, koma, atau baris baru)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Terbitkan dan simpan',
      guardado: 'Sertifikat disimpan',
      certificado: 'Sertifikat',
      clave: 'Kunci',
    },
    cripto: {
      texto: 'Teks',
      hash: 'Hash',
      calcular: 'Hitung',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Biaya bcrypt',
      bcryptTrunca: 'bcrypt hanya menggunakan 72 byte pertama dari teks.',
      bcryptVerificar: 'Hash bcrypt untuk diverifikasi',
      verificar: 'Verifikasi',
      coincide: 'Teks cocok dengan hash.',
      noCoincide: 'Teks tidak cocok dengan hash.',
      base64: 'Base64',
      base64Url: 'Varian URL',
      codificar: 'Enkode',
      decodificar: 'Dekode',
      url: 'Enkode URL',
      decodificarUrl: 'Dekode URL',
      codificarBase64: 'Enkode base64',
      decodificarBase64: 'Dekode base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID dan kata sandi',
      uuid: 'UUID v4',
      generar: 'Buat',
      generarDiez: 'Buat 10',
      contrasena: 'Kata sandi acak',
      longitud: 'Panjang',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Simbol',
      jwt: 'Dekode JWT',
      jwtToken: 'Token',
      cabecera: 'Header',
      carga: 'Payload',
      firmaNoVerificada:
        'Tanda tangan tidak diverifikasi: konten ditampilkan apa adanya dan mungkin telah diubah.',
      vencido: 'Token sudah kedaluwarsa (exp).',
      vigente: 'Token belum kedaluwarsa (exp).',
      salida: 'Hasil',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Pratinjau',
      ejemplo:
        '# Judul\n\nTeks dengan **tebal**, _miring_, dan sebuah [tautan](https://example.com).\n\n- Satu\n- Dua\n\n```\nkode\n```\n',
      seguro:
        'HTML mentah ditampilkan sebagai teks, tautan berbahaya dibuang, dan gambar tidak dimuat.',
      imagenOmitida: (alt: string) => `[gambar${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Versi WolfCore Dev',
      navegador: 'Mesin antarmuka',
      plataforma: 'Platform',
      idioma: 'Bahasa',
      zona: 'Zona waktu',
      nucleos: 'Core logis',
      actualizar: 'Perbarui',
      path: 'PATH',
      pathVacio: 'PATH kosong.',
      herramientas: 'Alat WolfCore Dev',
      noInstalada: 'Tidak terpasang',
      sinRespuesta: 'Tidak merespons tepat waktu',
      variables: 'Variabel lingkungan',
      filtro: 'Filter variabel',
      enmascarada: 'Nilai disembunyikan: nama terlihat seperti rahasia.',
    },
    busqueda: {
      explicacion:
        'Mencari pada nama dan konten, tanpa mengikuti tautan dan tanpa membaca file biner. Secara default melewati node_modules, vendor, dan .git.',
      origen: 'Lokasi pencarian',
      proyecto: 'Proyek',
      elegirCarpeta: 'Pilih folder',
      elegirArchivo: 'Pilih file',
      sinOrigen: 'Pilih proyek, folder, atau file.',
      consulta: 'Teks yang dicari',
      modoNombre: 'Nama',
      modoContenido: 'Konten',
      modoAmbos: 'Keduanya',
      regex: 'Ekspresi reguler',
      mayusculas: 'Bedakan huruf besar/kecil',
      incluir: 'Hanya file (pisahkan dengan koma, mis. *.php)',
      buscar: 'Cari',
      cancelar: 'Batal',
      buscando: 'Mencari…',
      sinResultados: 'Tidak ada kecocokan.',
      truncado: 'Masih ada lebih banyak hasil daripada yang ditampilkan: persempit pencarian Anda.',
      cancelada: 'Pencarian dibatalkan.',
      abrir: 'Buka di editor',
      coincidencias: (n: number) => `${n} kecocokan`,
      resumen: (archivos: number, examinados: number) =>
        `di ${archivos} file (${examinados} diperiksa)`,
    },
    infoArchivo: {
      elegir: 'Pilih file',
      ayuda: 'Dibaca secara lokal di perangkat ini untuk menghitung hash (maksimal 200 MB).',
      nombre: 'Nama',
      tamano: 'Ukuran',
      tipo: 'Jenis',
      modificado: 'Diubah',
      sinTipo: 'Tidak dikenal',
      grande: 'Ukuran file melebihi 200 MB: data ditampilkan tanpa hash.',
      calculando: 'Menghitung hash…',
    },
    websocket: {
      url: 'URL (ws:// atau wss://)',
      conectar: 'Hubungkan',
      desconectar: 'Putuskan',
      mensaje: 'Pesan',
      enviar: 'Kirim',
      urlInvalida: 'Masukkan URL yang diawali dengan ws:// atau wss://.',
      conectando: 'Menghubungkan…',
      conectado: 'Terhubung',
      desconectado: 'Terputus',
      error: 'Kesalahan koneksi',
      cerrado: (codigo: number, motivo: string) =>
        `Ditutup (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Terkirim',
      recibido: 'Diterima',
      binario: (n: number) => `[biner, ${n} byte]`,
      vacio: 'Belum ada pesan.',
      tope: 'Menyimpan 500 pesan terakhir; masing-masing ditampilkan hingga 10 KB.',
    },
    qrWifi: {
      ssid: 'Nama jaringan (SSID)',
      clave: 'Kata sandi',
      seguridad: 'Keamanan',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Tanpa kata sandi',
      oculta: 'Jaringan tersembunyi',
      mostrar: 'Tampilkan',
      ocultar: 'Sembunyikan',
      aviso:
        'Kode QR berisi kata sandi apa adanya: siapa pun yang melihat atau memotretnya dapat terhubung ke jaringan Anda. Kode dibuat di sini, tidak disimpan, dan dihapus saat panel ini ditutup.',
      avisoPng:
        'File PNG yang diunduh juga memuat kata sandi di dalam kodenya: simpan di tempat yang hanya dapat Anda lihat.',
      escribala:
        'Anda sendiri yang memasukkan kata sandinya: WolfCore Dev tidak pernah membaca kata sandi Wi-Fi yang tersimpan di sistem.',
      errorSsid: 'Masukkan nama jaringan (maksimal 32 karakter).',
      errorClave: 'Masukkan kata sandi.',
      errorClaveWpa: 'Kata sandi WPA harus terdiri dari 8 hingga 63 karakter.',
      vacio: 'Lengkapi data untuk melihat kode.',
      alt: 'Kode QR untuk terhubung ke jaringan Wi-Fi',
      descargar: 'Unduh PNG',
      descargado: 'QR disimpan',
      largo: 'Data terlalu panjang untuk kode QR.',
    },
    imagenes: {
      elegir: 'Pilih gambar',
      ayuda:
        'Diproses di perangkat ini (hingga 30 MB dan 12000 px per sisi). File asli tidak diubah: hasilnya adalah file baru.',
      original: 'Asli',
      accion: 'Tindakan',
      aIco: 'Konversi ke ICO',
      aPng: 'Konversi ke PNG',
      comprimir: 'Kompres',
      tamanos: 'Ukuran ICO',
      formato: 'Format',
      calidad: 'Kualitas',
      ladoMax: 'Sisi maksimum dalam px (kosong = ukuran asli)',
      procesar: 'Proses',
      procesando: 'Memproses…',
      guardar: 'Simpan sebagai…',
      antes: 'Sebelum',
      despues: 'Sesudah',
      sinMejora: 'Ukuran hasil tidak lebih kecil dari aslinya: coba kualitas atau format lain.',
      errorAbrir: 'Tidak dapat membuka gambar di perangkat ini.',
      errorProcesar: 'Tidak dapat memproses gambar.',
      sufijoConvertida: '-dikonversi',
      sufijoComprimida: '-dikompresi',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % lebih kecil`
          : porcentaje < 0
            ? `${-porcentaje} % lebih besar`
            : 'tidak berubah',
      guardado: (archivo: string) => `Disimpan di ${archivo}`,
    },
    comprimir: {
      zip: 'Kompres ke ZIP',
      zipAyuda:
        'Pilih file atau folder. Tautan tidak diikuti dan ZIP adalah file baru: tidak pernah menimpa file yang sudah ada.',
      agregarArchivos: 'Tambah file',
      agregarCarpeta: 'Tambah folder',
      quitar: 'Hapus',
      vacio: 'Belum ada yang dipilih.',
      crearZip: 'Buat ZIP…',
      creando: 'Membuat…',
      pdf: 'Optimalkan PDF',
      pdfAyuda:
        'Disimpan ulang dengan aliran objek, di thread terpisah. File hanya dibuat jika ukurannya lebih kecil; PDF yang dilindungi kata sandi tidak dibuka. File asli tidak disentuh. Perhatian: penyimpanan ulang akan menghilangkan tanda tangan digital dan kepatuhan PDF/A.',
      elegirPdf: 'Pilih PDF',
      optimizar: 'Optimalkan…',
      optimizando: 'Mengoptimalkan…',
      antes: 'Sebelum',
      despues: 'Sesudah',
      sinMejora:
        'Ukuran PDF tidak menjadi lebih kecil setelah dioptimalkan: tidak ada file yang dibuat.',
      sufijoOptimizado: '-dioptimalkan',
      omitidos: (n: number) =>
        `${n} tautan, folder tidak terbaca, atau file khusus tidak disertakan.`,
      archivos: (n: number) => `${n} file`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % lebih kecil`
          : porcentaje < 0
            ? `${-porcentaje} % lebih besar`
            : 'tidak berubah',
      guardado: (archivo: string) => `Disimpan di ${archivo}`,
    },
    conversor: {
      ayuda:
        'Dikonversi di perangkat ini: dokumen tidak diunggah ke mana pun. File asli tidak diubah; hasilnya adalah file baru dan tidak pernah menimpa file yang sudah ada.',
      elegir: 'Pilih dokumen',
      tipoNoSoportado:
        'Tidak ada konversi untuk jenis file tersebut. Didukung docx, xlsx, csv, md, html, dan pdf (serta odt, pptx, dan doc dengan LibreOffice).',
      convertirA: 'Konversi ke',
      convertir: 'Konversi…',
      convirtiendo: 'Mengonversi…',
      avisoLibreOffice:
        'Konversi ini menggunakan LibreOffice yang sudah terpasang di perangkat ini. WolfCore Dev tidak memasang atau mengunduhnya: membukanya tanpa jendela dan dengan profil sementara.',
      sinLibreOffice:
        'Jika Anda memasang LibreOffice, Anda juga dapat mengonversi odt, pptx, dan doc (WolfCore Dev tidak memasangnya).',
      limites:
        'Demi keamanan, ada batasan: hingga 50 MB (10 MB untuk md dan html), 120 dtk, 200 000 baris, 1000 kolom, dan 5 juta sel; file yang menyerupai bom ZIP atau berisi entitas XML akan ditolak.',
      guardado: (archivo: string) => `Disimpan di ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Kekuatan',
      pestanaAuditar: 'Audit basis data',
      fortaleza: {
        etiqueta: 'Kata sandi yang akan diukur',
        marcador: 'Masukkan kata sandi',
        privacidad:
          'Diukur langsung di sini: tidak ada yang keluar dari perangkat Anda atau disimpan.',
        mostrar: 'Tampilkan',
        ocultar: 'Sembunyikan',
        niveles: ['Sangat lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat'],
        sinAvisos: 'Tidak ada catatan.',
        estimacion: 'Ini adalah perkiraan, bukan jaminan.',
        avisos: {
          straightRow: 'Barisan tombol yang berurutan mudah ditebak.',
          keyPattern: 'Pola papan ketik pendek mudah ditebak.',
          simpleRepeat: 'Mengulang karakter atau grup hampir tidak memperkuat kata sandi.',
          extendedRepeat: 'Grup karakter berulang mudah ditebak.',
          sequences: 'Urutan seperti abc atau 6543 mudah ditebak.',
          recentYears: 'Hindari tahun-tahun terakhir dan tanggal yang berkaitan dengan Anda.',
          dates: 'Hindari tanggal: mudah ditebak.',
          topTen: 'Termasuk dalam sepuluh kata sandi paling sering digunakan.',
          topHundred: 'Termasuk dalam seratus kata sandi paling sering digunakan.',
          common: 'Ini adalah kata sandi yang sangat sering digunakan.',
          similarToCommon: 'Mirip dengan kata sandi yang sangat sering digunakan.',
          wordByItself: 'Satu kata saja mudah ditebak.',
          namesByThemselves: 'Nama depan atau nama belakang saja mudah ditebak.',
          commonNames: 'Nama dan marga yang umum mudah ditebak.',
          userInputs: 'Jangan gunakan data pribadi yang diketahui orang lain tentang Anda.',
          l33t: 'Mengganti huruf dengan simbol yang mudah ditebak (@ untuk a) tidak banyak membantu.',
          reverseWords: 'Menulis kata secara terbalik tidak banyak membantu.',
          allUppercase: 'Menggunakan huruf besar semua tidak banyak membantu.',
          capitalization: 'Mengkapitalkan huruf pertama saja tidak banyak membantu.',
          associatedYears: 'Hindari tahun yang berkaitan dengan Anda.',
          repeated: 'Hindari kata dan karakter yang berulang.',
          longerKeyboardPattern: 'Gunakan pola papan ketik yang lebih panjang dan ubah arahnya.',
          anotherWord:
            'Tambahkan satu atau dua kata lagi; kata yang jarang dipakai lebih membantu.',
          useWords: 'Beberapa kata acak membentuk kata sandi yang kuat.',
          noNeed:
            'Kata sandi bisa tetap aman tanpa simbol atau angka: yang terpenting adalah panjangnya.',
        },
      },
      auditar: {
        limite:
          'Alat ini hanya mendeteksi kata sandi yang sangat umum: membandingkan setiap hash dengan daftar pendek berisi sekitar 200 kata sandi. Ini bukan serangan atau uji brute force. Akun yang tidak ditandai bukan berarti kata sandinya kuat.',
        privacidad:
          'Kata sandi yang cocok tidak pernah ditampilkan, dan pembacaan dilakukan dengan pengguna sementara khusus baca-saja (di PostgreSQL, dengan sesi baca-saja). Gunakan hanya pada basis data milik Anda sendiri.',
        motor: 'Mesin',
        base: 'Basis data',
        tabla: 'Tabel',
        columnaUsuario: 'Kolom pengguna',
        columnaHash: 'Kolom hash',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Nyalakan server dari Basis data untuk memeriksa basis data Anda.',
        sinBases: 'Tidak ada basis data di server ini.',
        sinMotores: 'Tidak ada server MySQL, MariaDB, atau PostgreSQL milik sendiri.',
        revisar: 'Periksa',
        revisando: 'Memeriksa…',
        resumen: (r: number, d: number) => `${r} akun diperiksa · ${d} lemah`,
        sinDebiles: 'Tidak ada akun yang diperiksa cocok dengan kata sandi sangat umum.',
        noRevisables: (n: number) => `${n} akun tidak dapat diperiksa:`,
        truncado:
          'Pemeriksaan dihentikan karena batas 10 000 baris atau 60 detik: masih ada akun yang belum diperiksa.',
        usuario: 'Pengguna',
        motivo: 'Alasan',
        accion: 'Tindakan',
        motivos: {
          comun: 'Kata sandi sangat umum',
          formato_debil: 'Format lemah (md5 atau sha1 tanpa salt)',
        },
        restablecer: 'Atur ulang',
        mas: (n: number) => `dan ${n} lainnya (menampilkan 200 pertama)`,
        esquema: 'Skema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Batal',
        cancelando: 'Membatalkan…',
        cancelada: 'Audit dibatalkan.',
        progreso: (a: number, b: number) => `Diperiksa ${a} dari ${b}`,
        tiposNoRevisables: {
          vacio: 'hash kosong',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (tidak tersedia di perangkat ini atau parameter melebihi batas)',
          bcrypt_otro: 'bcrypt dengan biaya di luar rentang atau varian $2x$',
          pbkdf2_otro: 'PBKDF2 dengan parameter melebihi batas',
          ldap: 'format LDAP ({SHA}…)',
          otro: 'format tidak dikenal',
        },
        rlsActiva:
          'Tabel memiliki keamanan tingkat baris (RLS): audit hanya melihat baris yang diizinkan kebijakan untuk peran terbatas, sehingga beberapa akun mungkin tidak terlihat.',
        falsoPositivo:
          'Nilai 32 atau 40 karakter heksadesimal dianggap sebagai md5 atau sha1, tetapi bisa jadi hal lain (misalnya token). Jika kolom tidak menyimpan kata sandi, hasilnya tidak berlaku.',
      },
      restablecer: {
        titulo: (u: string) => `Atur ulang kata sandi untuk ${u}`,
        ayuda:
          'Kata sandi tidak dapat dipulihkan: kata sandi baru akan ditetapkan. Sebelumnya akan dibuat snapshot basis data dan disimpan salinan barisnya.',
        cargando: 'Menyiapkan pratinjau…',
        sentencia: 'Akan dijalankan (nilai dikirim terpisah dan tidak ditampilkan)',
        formatoActual: (f: string) => `Format saat ini: ${f}`,
        cambiaFormato:
          'Akun akan beralih ke bcrypt: aplikasi harus dapat memverifikasinya (misalnya dengan password_verify); jika tidak, tidak ada yang dapat masuk dengan akun tersebut.',
        nueva: 'Kata sandi baru',
        generar: 'Buat baru',
        mostrar: 'Tampilkan',
        ocultar: 'Sembunyikan',
        anotar: 'Catat sekarang: tidak akan ditampilkan lagi dan tidak disimpan.',
        escribaUsuario: (u: string) => `Untuk mengonfirmasi, ketik nama pengguna: ${u}`,
        confirmar: 'Atur ulang kata sandi',
        cancelar: 'Batal',
        cerrar: 'Tutup',
        hecho: 'Kata sandi telah diatur ulang.',
        copiaFila: 'Salinan baris (identitas dan hash sebelumnya, disimpan 30 hari):',
        instantanea: 'Snapshot basis data sebelumnya:',
        instantaneaAyuda: 'Anda dapat kembali ke sana dari Basis data › Snapshot.',
        aBcrypt: 'Ubah ke bcrypt: hanya jika aplikasi menggunakan password_verify atau yang setara',
        avisoLegado:
          'Hash ini adalah md5 atau sha1 tanpa salt dan tetap dipertahankan dalam format tersebut. Jika aplikasi menyimpan salt secara terpisah (di kolom lain atau konstanta), hash tidak dapat direproduksi dan kata sandi baru tidak akan berfungsi untuk masuk.',
        datosReales: {
          titulo: 'Basis data berisi data nyata',
          texto:
            'Basis data ini berasal dari situs yang ditandai berisi data nyata pelanggan: mengatur ulang kata sandi akan mengubah akun yang sebenarnya.',
          casilla: 'Saya memahami ini adalah data nyata dan ingin mengatur ulang kata sandi ini',
        },
        rlsActiva:
          'Tabel memiliki keamanan tingkat baris (RLS): jika kebijakan menyembunyikan akun ini dari peran terbatas, kata sandi tidak dapat diatur ulang.',
        copiaSinRestringir:
          'Tidak dapat membatasi salinan tersebut hanya untuk pengguna perangkat ini: periksa izin folder.',
      },
    },
  },
  doctor: {
    descripcion:
      'Memeriksa port, sertifikat, file hosts, PATH, Visual C++, antivirus, dan layanan, lalu menyarankan cara memperbaikinya.',
    revisarAhora: 'Periksa sekarang',
    revisando: 'Memeriksa…',
    sinRevision: 'Belum ada pemeriksaan. Klik «Periksa sekarang».',
    sinHallazgos: 'Semua beres: tidak ditemukan masalah.',
    gravedades: { error: 'Kesalahan', aviso: 'Pemberitahuan', info: 'Informasi' },
    evidencia: 'Yang ditemukan',
    requiereAdmin: 'Memerlukan izin administrator',
    comandoManual: 'Perintah untuk konsol administrator (tidak dijalankan otomatis):',
    copiar: 'Salin perintah',
    copiado: 'Perintah disalin.',
    reparar: 'Perbaiki',
    alternativa: 'Pindahkan port WolfCore Dev',
    soloInforma: 'WolfCore Dev tidak mengubah ini secara otomatis: ikuti petunjuk yang diberikan.',
    dialogo: {
      titulo: 'Konfirmasi perbaikan',
      queHara: 'Berikut yang akan dilakukan:',
      admin: 'Windows akan meminta izin administrator.',
      puerto: (p: string | number) => `Port baru akan menjadi ${p}.`,
      aplicar: 'Terapkan',
      cancelar: 'Batal',
    },
    estados: {
      aplicando: 'Menerapkan…',
      hecha: 'Perbaikan diterapkan.',
      fallida: 'Tidak dapat diperbaiki.',
    },
    revisiones: {
      puertos: 'Port',
      'rangos-reservados': 'Rentang cadangan',
      ca: 'Otoritas sertifikat',
      certificados: 'Sertifikat',
      confianza: 'Kepercayaan CA',
      hosts: 'File hosts',
      path: 'PATH pengguna',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Linker C++',
      antivirus: 'Antivirus',
      firewall: 'Firewall',
      servicios: 'Layanan',
    },
    reparaciones: {
      cambiar_puerto:
        'Mengubah port WolfCore Dev ke port yang kosong. Program lain tidak disentuh.',
      puerto_manual:
        'Memindahkan port WolfCore Dev keluar dari rentang cadangan. Membebaskan rentang tersebut sepenuhnya keputusan Anda menggunakan perintah yang ditampilkan.',
      detener_iis:
        'Menghentikan layanan IIS (W3SVC) untuk membebaskan port. Layanan tidak dinonaktifkan: akan menyala kembali saat Windows dimulai ulang.',
      regenerar_ca:
        'Membuat otoritas sertifikat baru, memercayainya di Windows (akan meminta konfirmasi), menerbitkan ulang sertifikat, dan menghapus yang lama. Salinan cadangan disimpan terlebih dahulu.',
      regenerar_certificados: 'Menerbitkan ulang sertifikat situs dan memuat ulang Nginx.',
      hosts_reescribir:
        'Menulis ulang blok WolfCore Dev di file hosts dalam UTF-8, dengan salinan cadangan sebelumnya. Baris milik program lain tidak disentuh.',
      hosts_solo_lectura: 'Menghapus atribut baca-saja dari file hosts.',
      path_duplicados:
        'Menghapus entri duplikat WolfCore Dev dari PATH pengguna, dengan salinan cadangan nilai sebelumnya. Entri milik program lain tidak disentuh.',
      path_ajeno:
        'Alat lain berada lebih dulu di PATH. WolfCore Dev tidak menghapusnya: pindahkan urutannya jika perlu.',
      instalar_vcredist:
        'Memasang Visual C++ 2015+ x64 dengan winget. Pemasang Microsoft akan meminta izinnya sendiri.',
      instalar_build_tools:
        'Pasang Visual Studio Build Tools (beserta alat C++) dengan perintah yang ditampilkan: ukurannya beberapa GB dan meminta izin administrator, jadi sepenuhnya keputusan Anda.',
      antivirus:
        'Menambahkan folder data ke pengecualian antivirus sepenuhnya keputusan Anda, menggunakan perintah yang ditampilkan.',
      reintentar_servicio: 'Memulai ulang layanan.',
      firefox_confianza:
        'Menambahkan preferensi di user.js pada setiap profil Firefox agar memercayai otoritas Windows, dengan salinan cadangan terlebih dahulu. prefs.js tidak disentuh dan profil yang terbuka dilewati.',
    },
    confianza: {
      titulo: 'Kepercayaan CA',
      texto:
        'Windows sudah memercayai otoritas WolfCore Dev; Node, Python, dan Firefox menggunakan penyimpanan sertifikatnya sendiri.',
      sinCa: 'Belum ada otoritas sertifikat. Buat melalui HTTPS untuk menggunakan bagian ini.',
      node: {
        titulo: 'Node',
        proyectos:
          'Proses proyek dan Terminal menerima NODE_EXTRA_CA_CERTS yang memuat otoritas tersebut.',
        ajena: 'Anda sudah memiliki NODE_EXTRA_CA_CERTS sendiri: WolfCore Dev tidak menggantinya.',
        global: 'Juga sebagai variabel pengguna (untuk terminal dan program lain)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS akan ditetapkan sebagai variabel pengguna Anda. Berlaku untuk program yang dibuka setelahnya; akan dihapus saat opsi ini dimatikan.',
        confirmarDesactivar:
          'Variabel NODE_EXTRA_CA_CERTS yang ditambahkan WolfCore Dev akan dihapus.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Proyek dengan .venv menerima REQUESTS_CA_BUNDLE dan SSL_CERT_FILE berisi sertifikat akar certifi (atau Windows) ditambah otoritas lokal. Tidak pernah hanya otoritas lokal saja.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Tidak ditemukan profil Firefox.',
        activo: 'Dipercaya',
        inactivo: 'Tidak dipercaya',
        abierto: 'Terbuka',
        fuera: 'Di luar folder Firefox',
        avisoFuera: (lista: string) =>
          `Profil ini berada di luar folder Firefox dan tidak disentuh kecuali Anda mencentangnya: ${lista}.`,
        incluirFuera: 'Ubah juga profil di luar folder Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profil di luar folder Firefox tidak disentuh')}.`,
        activar: 'Aktifkan di Firefox',
        quitar: 'Hapus dari Firefox',
        confirmarActivar:
          'security.enterprise_roots.enabled akan ditambahkan ke user.js pada setiap profil, di antara penanda WolfCore Dev dengan salinan cadangan di etc/respaldos. prefs.js tidak disentuh. Profil dengan Firefox terbuka dilewati: tutup terlebih dahulu.',
        confirmarQuitar:
          'Blok WolfCore Dev akan dihapus dari user.js pada setiap profil (dengan salinan cadangan sebelumnya). Preferensi Anda yang lain tetap sama.',
        resultadoOk: (n: number) => `Selesai pada ${plural(n, 'profil')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profil dilewati')} karena Firefox sedang terbuka. Tutup lalu coba lagi.`,
        resultadoError: (n: number) => `${plural(n, 'profil tidak dapat diubah')}.`,
      },
      confirmar: 'Konfirmasi',
      cancelar: 'Batal',
    },
  },
  php: {
    descripcion:
      'php.ini dan ekstensi untuk setiap versi PHP terpasang. Sebelum menyimpan, diff ditampilkan, diuji dengan php -v, dan salinan bertanggal disimpan; jika PHP gagal berjalan kembali, versi sebelumnya dipulihkan.',
    rama: 'Versi PHP',
    sinPhp: 'Belum ada PHP yang terpasang. Pasang melalui Layanan.',
    irServicios: 'Buka Layanan',
    pestanas: { ini: 'php.ini', extensiones: 'Ekstensi' },
    rapidosTitulo: 'Nilai cepat',
    rapidosAyuda:
      'Diterapkan ke teks di bawah; tidak ada yang disimpan sampai Anda mengonfirmasi diff.',
    aplicarRapidos: 'Terapkan ke teks',
    sinValor: 'belum diatur',
    rapidos: {
      memory_limit: 'Memori per skrip (memory_limit)',
      upload_max_filesize: 'Ukuran unggahan maksimal (upload_max_filesize)',
      post_max_size: 'Ukuran POST maksimal (post_max_size)',
      max_execution_time: 'Waktu maksimal dalam detik (max_execution_time)',
      display_errors: 'Tampilkan kesalahan (display_errors)',
      error_reporting: 'Tingkat kesalahan (error_reporting)',
      'date.timezone': 'Zona waktu (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Baris yang diawali ; adalah komentar.',
    sinCambios: 'Tidak ada perubahan dibanding yang tersimpan.',
    descartar: 'Buang perubahan',
    revisar: 'Tinjau dan simpan',
    diffTitulo: (rama: string) => `Perubahan pada php.ini milik PHP ${rama}`,
    diffAyuda:
      'Salinan bertanggal akan disimpan, diuji dengan php -v, dan jika PHP aktif akan dimulai ulang.',
    guardar: 'Simpan dan terapkan',
    cancelar: 'Batal',
    guardado: (respaldo: string) => `php.ini disimpan. Salinan sebelumnya: ${respaldo}`,
    respaldosTitulo: 'Salinan bertanggal',
    sinRespaldos: 'Belum ada salinan.',
    restaurar: 'Pulihkan',
    confirmarRestaurar: (nombre: string) =>
      `Pulihkan ${nombre}? php.ini saat ini disimpan terlebih dahulu sebagai salinan lain.`,
    restaurado: 'Salinan dipulihkan.',
    recargar: 'Baca ulang',
    extensiones: {
      ayuda:
        'Hanya ekstensi yang disertakan build ini di ext/ yang dapat diaktifkan. Ekstensi pihak ketiga dipasang dari katalog (varian build ini dengan hash SHA-256 terverifikasi).',
      activa: 'Aktif',
      inactiva: 'Nonaktif',
      falta: 'File tidak ada',
      catalogo: 'Katalog',
      instalar: 'Pasang',
      instalada: (nombre: string) => `${nombre} dipasang dan diaktifkan.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} diaktifkan.` : `${nombre} dinonaktifkan.`,
      buscar: 'Cari ekstensi',
      vacio: 'Tidak ada ekstensi yang cocok.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI, dan Antigravity CLI: deteksi atau pasang lalu buka di proyek. Yang mendukung akan terhubung ke MCP WolfCore Dev. Tidak ada yang terbuka sendiri.',
    recargar: 'Deteksi ulang',
    notaMcp:
      'MCP terdaftar hanya mengautentikasi ketika agen dibuka dari WolfCore Dev ("Buka di proyek"): token dikirim melalui variabel WOLFCORE_MCP_TOKEN pada terminal tersebut dan tidak pernah ditulis ke konfigurasi agen. Jika dibuka dari luar, agen melihat entri «wolfcore» tetapi tidak dapat terhubung.',
    sitioElegido: (nombre: string) => `Pilih agen untuk dibuka di ${nombre}.`,
    instalado: 'Terpasang',
    noInstalado: 'Belum terpasang',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Versi tidak diketahui',
    verVersion: 'Lihat versi',
    verVersionAyuda:
      'Menjalankan program dengan --version (tidak dijalankan otomatis saat layar dibuka).',
    origen: {
      propio: 'Dipasang oleh WolfCore Dev',
      'npm-usuario': 'npm global pengguna',
      ejecutable: 'Program sistem',
    },
    mcpRegistrado: 'MCP terdaftar',
    mcpSinRegistrar: 'MCP belum terdaftar',
    tokenEscrito:
      'File agen sebelumnya berisi token MCP yang tertulis: kini sudah dihapus dan salinan cadangannya menyembunyikannya (***). Pertimbangkan membuat ulang token server MCP.',
    mcpNoSoportado:
      'Dokumentasinya tidak mendukung pengambilan token dari variabel lingkungan: WolfCore Dev tidak mendaftarkan MCP untuknya (token tidak pernah ditulis ke file).',
    instalar: 'Pasang',
    instalando: 'Memasang…',
    guia: 'Panduan pemasangan',
    soloGuia:
      'WolfCore Dev tidak memasangnya (pemasangnya tidak memiliki hash tetap): ikuti panduan resmi.',
    registrar: 'Daftarkan MCP',
    quitar: 'Hapus MCP',
    abrir: 'Buka di proyek',
    confirmarInstalar: {
      titulo: (nombre: string) => `Pasang ${nombre}?`,
      texto: (paquete: string) =>
        `Versi terbaru ${paquete} yang diterbitkan akan dipasang dari registry.npmjs.org menggunakan Node milik WolfCore Dev di dalam folder datanya.`,
      aislado:
        'Tidak menggunakan konfigurasi npm Anda dan tidak menyentuh npm global Anda. Dapat memakan waktu beberapa menit.',
      aceptar: 'Pasang',
      hecho: (nombre: string) => `${nombre} berhasil dipasang.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Daftarkan MCP di ${nombre}?`,
      texto:
        'Hanya entri «wolfcore» yang ditambahkan (atau diperbarui) pada file ini; sisanya tetap sama:',
      aceptar: 'Daftarkan',
      hecho: (nombre: string) => `MCP terdaftar di ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Hapus MCP dari ${nombre}?`,
      texto: 'Hanya entri «wolfcore» yang dihapus dari file ini; sisanya tetap sama:',
      aceptar: 'Hapus',
      hecho: (nombre: string) => `MCP dihapus dari ${nombre}.`,
    },
    copiaPrevia:
      'Sebelum diubah, salinan bertanggal disimpan di samping file (<file>.wolfcore-TTTTBBHH-JJmmd.bak); 5 salinan terbaru disimpan. Jika agen sedang terbuka, tutup terlebih dahulu.',
    copiaHecha: (ruta: string) => `Salinan sebelumnya: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Buka ${nombre}`,
      proyecto: 'Proyek',
      sinProyectos: 'Belum ada proyek.',
      proveedor: 'Penyedia AI',
      proveedorPropio: 'Yang sudah dikonfigurasi di agen',
      proveedorAyuda:
        'Dengan penyedia, kunci Anda hanya masuk ke lingkungan terminal tersebut: tidak ditulis ke file maupun baris perintah.',
      aceptar: 'Buka terminal',
      hecho: (nombre: string) => `${nombre} dibuka di terminal baru.`,
    },
    costo: {
      titulo: 'Sebelum membuka agen',
      texto:
        'Agen AI bekerja menggunakan akun penyedia Anda: setiap permintaan memakai token dan dapat menimbulkan biaya. Agen juga dapat membaca dan mengubah file proyek serta menjalankan perintah.',
      nunca:
        'WolfCore Dev tidak pernah membuka agen sendiri: selalu atas permintaan Anda. Pemberitahuan ini hanya ditampilkan sekali.',
      aceptar: 'Mengerti, buka',
    },
  },
  depuracion: {
    descripcion:
      'Lihat di sini dump(), dd(), dan wd() dari situs PHP Anda serta wolfdump dari proses Python Anda, lengkap dengan file dan baris. Halaman tetap merespons seperti biasa.',
    receptor: 'Penangkap dump',
    escuchando: (direccion: string, puerto: number) => `Mendengarkan di ${direccion}:${puerto}`,
    apagado: 'Mati',
    memoria:
      'Dump hanya disimpan di memori (500 terakhir) dan hilang saat ditutup. Dapat berisi data sensitif: saat menyalin, kunci yang dikenal akan disembunyikan.',
    sitios: 'Situs',
    sinSitios: 'Tidak ada situs PHP maupun FastAPI.',
    sinPhp: 'Pilih versi PHP pada situs terlebih dahulu.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Mulai ulang proses situs agar menggunakan wolfdump.',
    confirmarTitulo: (sitio: string) => `Aktifkan penangkapan di ${sitio}`,
    confirmarPhp:
      'PHP situs ini akan memuat file WolfCore Dev sebelum setiap permintaan (auto_prepend_file, hanya untuk situs ini) yang mendefinisikan dump(), dd(), dan wd() jika proyek belum mendefinisikannya. Jika file Anda mendeklarasikan fungsi dump() atau dd() sendiri tanpa memeriksa function_exists, PHP akan menampilkan kesalahan: matikan penangkapan dalam kasus tersebut. Situs akan beralih ke PHP miliknya sendiri.',
    usoPhp:
      'Laravel dan Symfony: dump($x) dan dd($x) seperti biasa. CodeIgniter 3 dan lainnya: wd($x) mengirim tanpa menampilkan apa pun di halaman.',
    confirmarPython:
      'Proses situs ini akan menerima modul wolfdump di PYTHONPATH (tidak ada yang ditulis ke proyek). Berlaku mulai pengaktifan proses berikutnya.',
    usoPython: 'from wolfdump import dump  →  dump(valor)',
    activar: 'Aktifkan penangkapan',
    cancelar: 'Batal',
    filtroSitio: 'Semua situs',
    filtroOrigen: 'Semua sumber',
    buscar: 'Cari di teks, file, atau URL',
    limpiar: 'Bersihkan',
    confirmarLimpiar: 'Hapus semua dump dari memori?',
    vacio: 'Belum ada dump yang masuk.',
    vacioApagado: 'Aktifkan penangkapan lalu nyalakan situs untuk memulai.',
    elegir: 'Pilih satu dump dari daftar.',
    copiar: 'Salin',
    copiado: 'Disalin (dengan kunci disembunyikan)',
    sinSitio: 'tanpa situs',
    total: (n: number) => `${n} di memori`,
    archivo: 'File',
    url: 'URL',
    pestanaVolcados: 'Dump',
    pestanaErrores: 'Kesalahan',
    erroresDescripcion:
      'Kesalahan dari log PHP, Nginx, laravel.log, CodeIgniter 3, dan Python yang dikelompokkan: kesalahan yang sama tampil sekali dengan jumlah kemunculannya.',
    erroresVacio:
      'Tidak ada kesalahan di log. Kesalahan akan muncul di sini segera setelah ditulis.',
    erroresElegir: 'Pilih satu kesalahan dari daftar.',
    actualizar: 'Perbarui',
    abrirEditor: 'Buka di editor',
    abrirEditorSinSitio: 'Hanya file di dalam folder situs yang dapat dibuka.',
    veces: (n: number) => `${n} kali`,
    primera: 'Pertama kali',
    ultima: 'Terakhir kali',
    fuente: 'Log',
    traza: 'Jejak tumpukan (terakhir kali)',
    sinTraza: 'Tidak ada jejak tumpukan.',
  },
  contenedores: {
    descripcion:
      'Lihat dan kendalikan kontainer Docker atau Podman di komputer ini. WolfCore Dev tidak membuat, menghapus, atau mengunduh kontainer, image, maupun volume.',
    motor: 'Mesin',
    refrescar: 'Segarkan',
    detectando: 'Mencari Docker dan Podman…',
    sinMotorTitulo: 'Tidak ada Docker maupun Podman',
    sinMotor:
      'Docker maupun Podman tidak ditemukan di komputer ini. WolfCore Dev tidak memasangnya: jika perlu, pasang dari situs resminya lalu tekan Segarkan.',
    instalarDocker: 'Pasang Docker',
    instalarPodman: 'Pasang Podman',
    apagadoTitulo: (m: string) => `${m} tidak merespons`,
    apagado: (m: string) =>
      `${m} terpasang, tetapi mesinnya tidak merespons. Buka Docker Desktop (atau jalankan mesin Podman dengan «podman machine start») lalu tekan Segarkan.`,
    remoto:
      'Koneksi jarak jauh diabaikan (DOCKER_HOST, CONTAINER_HOST, konteks, atau koneksi bawaan): WolfCore Dev hanya menggunakan mesin di komputer ini.',
    desdePath: 'Ditemukan di PATH, bukan di folder pemasangan biasa.',
    version: (v: string) => `Versi ${v}`,
    vacio: 'Tidak ada kontainer.',
    columnas: {
      nombre: 'Nama',
      imagen: 'Image',
      estado: 'Status',
      puertos: 'Port',
      compose: 'Compose',
      acciones: 'Tindakan',
    },
    estados: {
      corriendo: 'Berjalan',
      detenido: 'Berhenti',
      pausado: 'Dijeda',
      otro: 'Lainnya',
    },
    codigoSalida: (n: number) => `kode ${n}`,
    iniciar: 'Mulai',
    detener: 'Hentikan',
    reiniciar: 'Mulai ulang',
    registros: 'Log',
    confirmarDetenerTitulo: 'Hentikan kontainer?',
    confirmarDetener: (n: string) =>
      `«${n}» akan dihentikan. Proses di dalamnya akan berhenti (mesin menunggu beberapa detik hingga selesai). Tidak ada yang dihapus.`,
    confirmarReiniciarTitulo: 'Mulai ulang kontainer?',
    confirmarReiniciar: (n: string) =>
      `«${n}» akan dimulai ulang. Proses di dalamnya dihentikan lalu dimulai kembali. Tidak ada yang dihapus.`,
    confirmar: 'Konfirmasi',
    cancelar: 'Batal',
    hecho: {
      iniciar: (n: string) => `«${n}» dimulai.`,
      detener: (n: string) => `«${n}» dihentikan.`,
      reiniciar: (n: string) => `«${n}» dimulai ulang.`,
    },
    registroTitulo: (n: string) => `Log «${n}»`,
    registroEsperando: 'Menunggu baris…',
    registroFin: 'Log berakhir (kontainer berhenti atau mesin memutus aliran).',
    cerrar: 'Tutup',
  },
  versiones: {
    pestana: 'Versi',
    pestanaServicios: 'Layanan',
    elegirServicio: 'Layanan',
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
        'Setiap versi utama (8.4, 17…) memiliki instansnya sendiri dengan folder data dan port tersendiri: Anda dapat menjalankan beberapa sekaligus. Bintang menandai versi untuk proyek baru.',
      pool: 'Setiap versi PHP yang aktif memiliki PHP-nya sendiri; bintang menandai versi untuk proyek baru.',
      unica:
        'Anda dapat memasang beberapa versi, tetapi hanya satu yang aktif: menyalakan versi lain akan mengganti versi aktif.',
      ninguno:
        'Tidak ada yang perlu dinyalakan: proyek menggunakan versi yang diminta atau versi bawaan (bintang).',
    },
    filtroRama: 'Versi',
    todasRamas: 'Semua versi',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Tampilkan semua',
    origen: {
      vivo: 'Daring',
      cache: (h: number) => (h < 1 ? 'Cache kurang dari 1 jam lalu' : `Cache dari ${h} jam lalu`),
      fija: 'Daftar luring',
    },
    actualizarLista: 'Perbarui daftar',
    errorCarga: 'Daftar versi tidak dapat dibaca',
    vacio: 'Tidak ada versi untuk ditampilkan.',
    soporte: { lts: 'LTS', actual: 'Terkini', fin: 'Tanpa dukungan', preview: 'Pratinjau' },
    finSoporte: (f: string) => `Didukung hingga ${f}`,
    finSoportePasado: (f: string) => `Tanpa dukungan sejak ${f}`,
    marcas: {
      instalada: 'Terpasang',
      encendida: 'Aktif',
      actualizacion: (v: string) => `Pembaruan: ${v}`,
      bloqueada: 'Diblokir',
      sinHuella: 'Tanpa hash resmi',
      huellaDebil: 'Hanya hash MD5',
      firmada: 'Dengan tanda tangan PGP',
    },
    ayudaFirmada:
      'Sumber resmi menandatangani unduhan ini dengan PGP: WolfCore Dev memverifikasi tanda tangan dengan kunci yang disematkan di aplikasi sebelum memasang.',
    ayudaSinHuella:
      'Sumber resmi tidak memublikasikan hash kuat (SHA-256 atau SHA-512): unduhan tidak dapat diverifikasi.',
    instalar: 'Pasang',
    desinstalar: 'Hapus pemasangan',
    encender: 'Nyalakan',
    apagar: 'Matikan',
    actualizar: 'Perbarui',
    usarEsta: 'Gunakan versi ini',
    usarEstaAyuda: (id: string) =>
      `${id} menggunakan versi lain layanan ini: penggantian dilakukan dengan cadangan data terlebih dahulu.`,
    predeterminada: 'Bawaan untuk proyek baru',
    hacerPredeterminada: 'Gunakan untuk proyek baru',
    predeterminadaHecha: (v: string) => `${v} ditetapkan sebagai bawaan.`,
    puerto: 'Port',
    puertoDe: (id: string) => `Port ${id}`,
    cambiarPuerto: 'Ubah',
    puertoCambiado: (p: number) => `Port diubah ke ${p}.`,
    puertoProyectosTitulo: 'Proyek dengan port sebelumnya',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Proyek ini masih menggunakan port ${viejo} di .env (tidak diubah): ${lista}. Ubah ke ${nuevo}.`,
    resolver: 'Selesaikan',
    instalada: (v: string) => `${v} terpasang.`,
    selector: { etiqueta: 'Instans', predeterminada: 'bawaan', apagada: 'mati' },
    dialogoSinHuella: {
      titulo: (v: string) => `Pasang ${v} tanpa hash`,
      riesgo:
        'Versi ini tidak memiliki hash resmi dari sumbernya: WolfCore Dev tidak dapat memastikan file yang diunduh adalah asli.',
      explicacion:
        'Unduhan tetap melalui HTTPS dari situs resmi, tetapi jika situs atau koneksi disusupi, hal itu tidak akan terdeteksi. Pasang hanya jika Anda membutuhkannya.',
      alternativa: (v: string) => `Tersedia versi terverifikasi dari layanan yang sama: ${v}.`,
      casilla: 'Saya memahami risikonya dan tetap ingin memasang tanpa verifikasi',
      instalarVerificada: (v: string) => `Pasang ${v} (terverifikasi)`,
      instalarIgual: 'Pasang tanpa verifikasi',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Perbarui ${n}`,
      tituloRama: (v: string) => `Versi baru: ${v}`,
      ninguna: 'tidak ada',
      instancia: (id: string) => `Instans ${id} akan diperbarui. Sebelum mengubah apa pun:`,
      pasoInstalar: (v: string) =>
        `${v} dipasang berdampingan dengan versi saat ini (yang tidak dihapus);`,
      pasoVolcados: 'setiap basis data dicadangkan (dump) menggunakan versi saat ini;',
      pasoCopia: 'instans dihentikan dan seluruh folder data disalin (cadangan dingin);',
      pasoArrancar: 'dijalankan dengan versi baru dan diperiksa apakah merespons;',
      pasoVuelta:
        'jika gagal berjalan, kembali ke versi sebelumnya beserta datanya dan cadangan tetap disimpan.',
      datos: 'Data:',
      respaldo: 'Cadangan di:',
      espacio: 'Ruang:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} kosong; diperlukan ${necesarios}`,
      datosQuedan:
        'Data sebelumnya tidak pernah dihapus: cadangan dan dump tetap berada di Cadangan pembaruan hingga Anda menghapusnya.',
      sinEspacio: 'Ruang tidak cukup untuk cadangan: kosongkan ruang lalu coba lagi.',
      alLado: (v: string) =>
        `${v} akan dipasang. Versi terpasang lainnya tidak disentuh; proyek yang menetapkan versi lain tetap menggunakannya.`,
      ramaExplicacion:
        'Versi utama baru tidak menggantikan versi lama: instans baru dibuat dengan folder data dan port tersendiri. Instans saat ini tetap sama.',
      copiarDesdeTitulo: 'Data instans baru',
      copiarDesde: (id: string) =>
        `Salin data dari ${id} (di-dump lalu dipulihkan; aslinya tidak disentuh)`,
      vacia: 'Mulai kosong',
      ramaNota: 'Pengguna basis data tidak disalin; proyek harus diarahkan ke port instans baru.',
      crearInstancia: 'Buat instans baru',
      confirmar: 'Perbarui dengan cadangan',
      hecho: (v: string) => `${v} diperbarui.`,
      fallo: 'Gagal memperbarui',
      ramaCreada: (id: string) => `Instans ${id} dibuat.`,
      copiadas: (l: string) => `Disalin: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} gagal disalin: ${m}`,
    },
    limpieza: {
      boton: 'Bersihkan versi tidak terpakai…',
      titulo: 'Bersihkan versi tidak terpakai',
      intro:
        'Hanya program dari versi yang tidak digunakan di mana pun yang dihapus (folder bin). Data basis data, instans, dan proyek Anda tidak pernah disentuh.',
      cargando: 'Mencari versi…',
      vacia: 'Tidak ada versi terpasang.',
      sinLibres: 'Semua versi terpasang sedang digunakan: tidak ada yang perlu dibersihkan.',
      fallo: 'Gagal membersihkan',
      fallaLista: 'Daftar versi tidak dapat dibaca',
      bloqueada: 'Tidak dapat dicentang',
      marcadas: (n: number, tam: string) => `${n} versi · ${tam}`,
      destinoTitulo: 'Tindakan untuk versi ini',
      papelera:
        'Pindahkan ke tempat sampah: disimpan 7 hari dan tetap memakai ruang disk hingga saat itu',
      definitivo: 'Hapus permanen: langsung membebaskan ruang dan tidak dapat dibatalkan',
      avisoDefinitivo:
        'Penghapusan permanen: untuk memakai versi ini lagi, Anda harus mengunduhnya kembali.',
      instantanea:
        'Jika memilih penghapusan permanen, salinan konfigurasi lingkungan disimpan sebelumnya; di tempat sampah versi masih dapat dipulihkan.',
      entiendo: 'Saya memahami tindakan ini tidak dapat dibatalkan',
      confirmar: (n: number) => `Hapus ${n} versi`,
      motivos: {
        predeterminada: 'Merupakan versi bawaan',
        encendida: 'Sedang aktif atau berjalan',
        sitio: 'Digunakan oleh proyek',
        instancia: 'Digunakan oleh instans (meski sedang mati)',
        plantilla: 'Digunakan oleh templat',
        workspace: 'Digunakan oleh workspace',
        runtime: 'Digunakan oleh proyek',
        tarea: 'Digunakan oleh proyek dengan tugas terjadwal',
        duda: 'Tidak dapat diverifikasi: tidak disentuh',
        datos: 'Memiliki data yang hanya dapat dibuka versi ini',
        herramienta: 'Digunakan oleh phpMyAdmin atau Adminer',
      },
      resultadoTitulo: 'Hasil',
      liberadas: (tam: string) => `${tam} berhasil dibebaskan.`,
      enPapelera: (tam: string) =>
        `${tam} berada di tempat sampah (dihapus otomatis setelah 7 hari).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} versi sudah keluar dari bin tetapi masih ada sisa file yang akan dicoba hapus lagi saat aplikasi dibuka.`,
      instantaneaGuardada: 'Salinan lingkungan disimpan sebelum menghapus.',
      ajeno: (lista: string) =>
        `Berisi paket yang Anda pasang di dalamnya: ${lista}. Akan hilang jika dihapus.`,
      incluirAjeno: 'Tetap hapus meski paket tersebut hilang',
      sinCatalogo:
        'Sudah tidak ada di katalog: jika dihapus, Anda tidak dapat mengunduhnya kembali.',
      papeleraTitulo: 'Di tempat sampah',
      recuperar: 'Pulihkan',
      recuperada: (v: string) => `${v} dipulihkan.`,
      borradaEl: (f: string) => `Dihapus pada ${f}`,
      fallaRecuperar: 'Gagal memulihkan',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Hapus pemasangan ${v}`,
      binario: 'Hanya file program dari versi ini yang dihapus.',
      instancia: (id: string) =>
        `Digunakan oleh instans ${id}: instans dihentikan dan dihapus dari daftar instans.`,
      datosQuedan:
        'Data Anda tetap di disk: jika Anda memasang versi ini lagi, instans akan membukanya kembali.',
      borrarDatos: 'Hapus juga datanya',
      borrarAviso: (id: string) =>
        `Folder data ${id} beserta semua basis datanya akan dihapus. Tidak dapat dibatalkan. Ketik "${id}" untuk mengonfirmasi.`,
      escriba: (id: string) => `Ketik ${id} untuk mengonfirmasi`,
      desinstalar: 'Hapus pemasangan',
      desinstalarYBorrar: 'Hapus pemasangan dan data',
      unica:
        'Ini adalah versi aktif: jika satu-satunya yang terpasang, dapat dihapus saat layanan mati (menjadi belum terpasang); jika ada versi lain, pilih versi lain sebagai aktif (bintang) terlebih dahulu.',
      predeterminada: (id: string) =>
        `${id} adalah instans bawaan: Basis data, blok .env, dan alat yang menggunakan mesin ini akan berpindah ke instans lain (dengan port lain).`,
      hecho: (v: string) => `${v} dihapus pemasangannya.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Selesaikan ${id}`,
      explicacion:
        'Pembaruan gagal dan data instans ini tidak dapat dikembalikan, sehingga tidak dinyalakan sampai Anda memilih tindakannya. Tidak ada yang dihapus.',
      fallida: 'Data yang tersentuh:',
      respaldo: 'Cadangan:',
      opciones: 'Tindakan',
      devolver: (sello: string, tam: string) =>
        `Kembalikan cadangan ${sello} (${tam}); folder saat ini dipisahkan, tidak dihapus`,
      usarActual: 'Gunakan folder data saat ini apa adanya',
      notaActual:
        'Hanya jika folder saat ini berisi data lengkap; jika tidak, pilih sebuah cadangan.',
      notaDevolver: 'Cadangan disalin, diperiksa, lalu barulah ditempatkan pada posisinya.',
      escriba: (id: string) => `Ketik ${id} untuk mengonfirmasi`,
      elegirVersion:
        'Tanda kunci tidak dapat dibaca: pilih versi yang digunakan untuk membuka data (versi sebelum pembaruan).',
      version: 'Versi',
      confirmar: 'Selesaikan',
      hecho: (id: string) => `${id} dibuka blokirnya. Anda kini dapat menyalakannya.`,
    },
    respaldos: {
      titulo: 'Cadangan pembaruan',
      descripcion:
        'Salinan yang tersisa dari pembaruan dan versi baru. Folder data aktif milik setiap instans tidak pernah muncul di sini.',
      vacio: 'Tidak ada salinan.',
      tipos: {
        respaldo: 'Cadangan dingin',
        volcados: 'Dump basis data',
        fallida: 'Data versi yang gagal',
        restaurando: 'Pemulihan terhenti',
        copia: 'Dump untuk versi baru',
      },
      archivos: (n: number) => `${n} file`,
      borrar: 'Hapus',
      borrarDe: (n: string) => `Hapus ${n}`,
      confirmarTitulo: 'Hapus salinan',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) akan dihapus. Tidak dapat dibatalkan. Data yang digunakan instans tidak disentuh.`,
      borrado: 'Salinan dihapus.',
    },
  },
  navGrupos: {
    trabajo: 'Kerja',
    entorno: 'Lingkungan',
    utilidades: 'Utilitas',
  },
  avisos: {
    campana: 'Pemberitahuan',
    campanaConNuevos: (n: number) => `Pemberitahuan: ${n} belum dibaca`,
    titulo: 'Pusat pemberitahuan',
    vacio:
      'Tidak ada pemberitahuan. Layanan yang berhenti, port yang terpakai, dan sertifikat yang segera kedaluwarsa akan muncul di sini.',
    marcarTodos: 'Tandai semua sudah dibaca',
    limpiar: 'Bersihkan riwayat',
    ver: 'Lihat',
    actualizar: 'Perbarui',
    verVersiones: 'Lihat versi',
    cerrar: 'Tutup',
    niveles: { info: 'Informasi', aviso: 'Peringatan', error: 'Kesalahan' },
    sinLeer: 'Belum dibaca',
  },
  barra: {
    paleta: 'Cari atau jalankan perintah',
    atajoPaleta: 'Ctrl+K',
    tema: 'Ubah tema',
    idioma: 'Ubah bahasa',
  },
  preferencias: {
    titulo: 'Tampilan dan bahasa',
    descripcion: 'Perubahan langsung diterapkan dan disimpan di komputer ini.',
    tema: 'Tema',
    temas: { sistema: 'Sistem', claro: 'Terang', oscuro: 'Gelap' },
    idioma: 'Bahasa',
    idiomas: {
      es: 'Español',
      en: 'English',
      pt: 'Português',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      ru: 'Русский',
      zh: '中文 简体',
      ja: '日本語',
      ko: '한국어',
      hi: 'हिन्दी',
      tr: 'Türkçe',
      id: 'Bahasa Indonesia',
      pl: 'Polski',
      nl: 'Nederlands',
      uk: 'Українська',
    },
    /** Aviso junto a los idiomas que no son es, en, pt ni fr (la traducción es automática y revisada). */
    traduccionAutomatica: 'Terjemahan mesin, telah ditinjau',
    acento: 'Warna aksen',
    acentos: {
      indigo: 'Indigo',
      azul: 'Biru',
      verde: 'Hijau',
      violeta: 'Ungu',
      naranja: 'Oranye',
      rosa: 'Merah muda',
    },
    acentoPropio: (color: string) => `Kustom (${color})`,
    errorGuardar: 'Preferensi tidak dapat disimpan',
  },
  paleta: {
    titulo: 'Palet perintah',
    placeholder: 'Cari layar, layanan, proyek, atau alat…',
    sinResultados: 'Tidak ada perintah yang cocok dengan pencarian.',
    ayuda: '↑ ↓ untuk berpindah · Enter untuk menjalankan · Esc untuk menutup',
    grupos: {
      navegacion: 'Buka',
      servicios: 'Layanan',
      proyectos: 'Proyek',
      herramientas: 'Alat',
      github: 'GitHub',
      general: 'Umum',
    },
    irA: (pantalla: string) => `Buka ${pantalla}`,
    encender: (servicio: string) => `Nyalakan ${servicio}`,
    apagar: (servicio: string) => `Matikan ${servicio}`,
    iniciarTodo: 'Mulai semua layanan',
    detenerTodo: 'Hentikan semua layanan',
    iniciarWorkspace: (n: string) => `Nyalakan workspace ${n}`,
    detenerWorkspace: (n: string) => `Matikan workspace ${n}`,
    abrirSitio: (nombre: string) => `Buka ${nombre} di peramban`,
    traerCambios: (nombre: string) => `Tarik perubahan di ${nombre}`,
    abrirHerramienta: (nombre: string) => `Buka ${nombre}`,
    clonar: 'Kloning repositori dari GitHub',
    agregarProyecto: 'Tambah proyek',
    nuevoProyecto: 'Buat proyek baru',
    tema: (tema: string) => `Tema: ${tema}`,
    idioma: (idioma: string) => `Bahasa: ${idioma}`,
  },
  nuevoProyecto: {
    titulo: 'Proyek baru',
    boton: 'Proyek baru',
    descripcion: 'Buat proyek dari awal: folder, situs dengan HTTPS, basis data, dan koneksinya.',
    pasos: { tipo: 'Jenis', datos: 'Data', resumen: 'Ringkasan', crear: 'Membuat' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Dengan Composer; kunci aplikasi, basis data, dan migrasi.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Appstarter resmi dengan .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Framework klasik dengan database.php terkonfigurasi.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Kerangka resmi (atau webapp) dengan .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Lingkungan virtual, requirements.txt, dan proses uvicorn.',
      },
      wordpress: {
        nombre: 'WordPress',
        descripcion: 'Unduhan resmi dengan wp-config.php siap pakai.',
      },
      estatico: {
        nombre: 'Situs statis',
        descripcion: 'HTML dan CSS dilayani Nginx, tanpa basis data.',
      },
    },
    campos: {
      nombre: 'Nama proyek',
      nombrePlaceholder: 'toko-saya',
      nombreAyuda: (dominio: string) =>
        `Akan menjadi ${dominio}: huruf kecil, angka, dan tanda hubung.`,
      carpeta: 'Folder induk',
      elegirCarpeta: 'Pilih folder…',
      cambiarCarpeta: 'Ubah folder…',
      carpetaAyuda:
        'Proyek dibuat di folder baru sesuai namanya di dalam folder ini. Folder harus kosong atau belum ada.',
      php: 'Versi PHP',
      python: 'Versi Python',
      sinInstalada: 'Belum ada yang terpasang: pasang melalui Layanan.',
      conBase: 'Buat basis data untuk proyek ini',
      sinBase: 'Tanpa basis data',
      instancia: 'Server basis data',
      apagada: 'mati',
      apagadaAyuda: 'Server tersebut sedang mati: nyalakan di Layanan sebelum membuat proyek.',
      sinMotores: 'Tidak ada server basis data terpasang untuk jenis proyek ini.',
      nombreBase: 'Nama basis data',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Tidak ada', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Sertakan paket web (webapp)',
      pgvector: 'Aktifkan pgvector (pencarian vektor)',
    },
    huella: {
      titulo: 'WordPress hanya menerbitkan hash lemah',
      riesgo:
        'Hash yang diterbitkan adalah SHA-1, algoritma yang tidak lagi dianggap aman, dan berasal dari situs yang sama dengan file.',
      explicacion:
        'Jika situs atau koneksi tersebut disusupi, unduhan yang dimodifikasi dapat lolos verifikasi. Unduhan tetap melalui HTTPS dari wordpress.org. Lanjutkan hanya jika Anda memercayai sumber tersebut.',
      leyendo: 'Membaca hash yang diterbitkan…',
      noDisponible:
        'Hash tidak dapat dibaca saat ini (luring atau sumber tidak merespons); akan dibaca ulang saat membuat proyek.',
      fuente: 'Sumber: wordpress.org',
      casilla: 'Saya memahami hash ini lemah dan tetap ingin membuat proyek',
    },
    resumen: {
      titulo: 'Yang akan dibuat',
      intro: 'Periksa sebelum memulai.',
      tipo: 'Jenis',
      carpeta: 'Folder',
      sitio: 'Situs',
      dominio: 'Domain',
      https: 'Alamat HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Basis data',
      env: 'Koneksi ditulis ke',
      nota: 'Jika satu langkah gagal, tidak ada yang dihapus: Anda akan melihat apa yang sudah terbuat dan dapat mencoba lagi.',
    },
    errores: {
      nombreVacio: 'Masukkan nama proyek.',
      nombreInvalido:
        'Nama hanya boleh berisi huruf kecil, angka, dan tanda hubung (hingga 40), tanpa diawali atau diakhiri tanda hubung.',
      sinCarpeta: 'Pilih folder induk proyek.',
      sinPhp: 'Pilih versi PHP (pasang melalui Layanan jika belum ada).',
      sinPython: 'Pilih versi Python (pasang melalui Layanan jika belum ada).',
      sinInstancia: 'Pilih server tempat membuat basis data, atau hapus centang basis data.',
      baseInvalida: 'Nama basis data tidak valid untuk mesin ini.',
      motorNoVale: 'WordPress memerlukan MySQL atau MariaDB.',
      pgvectorMotor: 'pgvector memerlukan PostgreSQL.',
      huellaDebil: 'Konfirmasi bahwa Anda memahami hash WordPress lemah.',
    },
    acciones: {
      cambiarCarpeta: 'Pilih folder lain',
      cambiarBase: 'Ubah nama basis data',
      cambiarNombre: 'Ubah nama',
      reintentarPaso: 'Coba ulang langkah',
      servicios: 'Buka Layanan',
      confirmarHuella: 'Tinjau konfirmasi',
    },
    botones: {
      siguiente: 'Berikutnya',
      atras: 'Kembali',
      crear: 'Buat proyek',
      creando: 'Membuat…',
      cerrar: 'Tutup',
      abrirEditor: 'Buka di editor',
      verSitio: 'Lihat situs',
      verProyecto: 'Lihat di Proyek',
    },
    progreso: {
      titulo: 'Membuat proyek',
      listo: 'Proyek dibuat.',
      fallo: (paso: string) =>
        `Langkah «${paso}» gagal. Tidak ada yang dihapus: coba ulang langkah tersebut atau perbaiki lalu coba lagi.`,
      quedo: (partes: string) => `Yang sudah dibuat: ${partes}.`,
      quedoCarpeta: 'folder',
      quedoBase: (nombre: string) => `basis data ${nombre}`,
      quedoSitio: 'situs',
      avisos: 'Pemberitahuan',
      sinUsuarioPropio:
        'Enkripsi sistem tidak tersedia: proyek menggunakan koneksi administrator basis data. Jika sudah tersedia, gunakan "Gunakan pengguna khusus" di pengelola .env.',
      editorFallo: 'Editor tidak dapat dibuka.',
    },
  },
  importar: {
    boton: 'Impor…',
    titulo: 'Impor dari Laragon, XAMPP, atau Herd',
    intro:
      'Situs ditautkan di lokasinya saat ini: tidak ada folder yang dipindahkan, disalin, atau diubah. Jika mau, basis datanya juga dapat disalin. WolfCore Dev hanya membaca pemasangan program lain.',
    buscando: 'Mencari pemasangan…',
    nada: 'Laragon, XAMPP, maupun Herd tidak ditemukan di folder yang umum.',
    errorVista: 'Tidak dapat mencari item yang dapat diimpor',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Situs',
      todos: 'Pilih semua',
      ninguno: 'Hapus semua pilihan',
      dominio: (d: string) => `Domain ${d}`,
      dominioPropuesto: (d: string) => `Domain ${d} (diusulkan)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP belum ditentukan',
      base: (nombre: string, motor: string) => `Basis data ${nombre} (${motor})`,
      yaVinculado: 'Sudah menjadi situs WolfCore Dev',
      dominioEnUso: 'Situs lain sudah menggunakan domain ini',
    },
    avisos: {
      sin_dominio: 'Tidak memiliki domain di program lain: diusulkan satu.',
      dominio_invalido: 'Domain tidak valid: diusulkan satu.',
      sin_vhost: 'Tidak memiliki virtual host sendiri: diusulkan satu domain.',
      php_desconocido: 'Versi PHP yang digunakan tidak diketahui: dipilih satu yang terpasang.',
      base_no_local: 'Basis datanya berada di server lain: tidak diimpor.',
      base_nombre_invalido: 'Nama basis datanya tidak valid: tidak diimpor.',
      motor_no_soportado: 'Basis datanya bukan MySQL atau MariaDB: tidak diimpor.',
    },
    problemas: {
      titulo: (n: number) => `${n} item dilewati atau tidak dapat dibaca`,
    },
    bases: {
      titulo: 'Basis data',
      importarBases: 'Impor juga basis datanya',
      ayuda:
        'Nyalakan server basis data dari program lain sebelum melanjutkan: WolfCore Dev tidak menyalakan atau mematikan program lain. Kata sandi hanya digunakan pada impor ini dan tidak disimpan.',
      destino: 'Server tujuan',
      apagada: 'mati',
      sinMotores:
        'Tidak ada MySQL atau MariaDB terpasang: pasang melalui Layanan untuk mengimpor basis data.',
      puerto: 'Port server sumber',
      usuario: 'Pengguna',
      clave: 'Kata sandi',
      claveAyuda:
        'Kosongkan jika pengguna tidak memiliki kata sandi (seperti root di Laragon atau XAMPP).',
      existe: 'sudah ada di tujuan',
      reemplazar: 'Ganti (dibuat cadangan sebelumnya)',
      noSeToca: 'Tidak disentuh jika tidak dicentang.',
    },
    pasos: { elegir: 'Pilih', confirmar: 'Konfirmasi' },
    continuar: 'Lanjutkan',
    volver: 'Kembali',
    cancelar: 'Batal',
    importar: 'Impor',
    cerrar: 'Tutup',
    sinSeleccion: 'Pilih setidaknya satu situs.',
    origenIncompleto: 'Masukkan port dan pengguna server sumber.',
    confirmar: {
      titulo: 'Konfirmasi impor',
      sitios: (n: number) =>
        `${n} situs akan ditautkan di foldernya saat ini. Tidak ada file yang dipindahkan, disalin, atau diubah.`,
      sinConfianza:
        'Tidak ada situs impor yang menjalankan resep hingga Anda mencentang «Saya memercayai repositori ini».',
      hosts: 'Nginx dan file hosts akan diperbarui (Windows mungkin meminta izin administrator).',
      basesNuevas: (nombres: string) => `Basis data yang akan disalin: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Basis data berikut yang sudah ada akan diganti: ${nombres}. Sebelumnya dibuat cadangan masing-masing.`,
      basesSinTocar: (nombres: string) =>
        `Basis data berikut yang sudah ada tidak akan disentuh: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Akan di-dump dari server program lain (127.0.0.1:${puerto}, pengguna ${usuario}). Dibaca tanpa mengubahnya.`,
      sinBases: 'Tidak ada basis data yang akan diimpor.',
      proteccion:
        'Struktur setiap basis data diperiksa sebelumnya dan data dimasukkan dengan pengguna terbatas: jika terjadi kesalahan, basis data tetap seperti semula.',
    },
    resultado: {
      titulo: 'Hasil impor',
      importando: 'Mengimpor…',
      cancelar: 'Batalkan impor',
      restaurada: 'Basis data asli dipulihkan otomatis dari cadangannya: tetap seperti semula.',
      sitioOk: 'Diimpor',
      sitioFallo: 'Tidak diimpor',
      baseOk: (n: string) => `Basis data ${n} diimpor`,
      baseFallo: (n: string) => `Basis data ${n} tidak diimpor`,
      copiaPrevia: (ruta: string) => `Cadangan basis data sebelumnya: ${ruta}`,
      phpDistinto: (v: string) => `Menggunakan PHP ${v} (versi asli tidak terpasang).`,
      sinAplicar:
        'Nginx atau file hosts belum sepenuhnya diperbarui: periksa pemberitahuan di Proyek lalu coba lagi.',
      resumen: (s: number, b: number) => `${s} situs diimpor, ${b} basis data diimpor.`,
      errorImportar: 'Gagal mengimpor',
    },
  },
  plantillas: {
    guardarComo: 'Simpan sebagai templat…',
    dialogo: {
      titulo: (nombre: string) => `Simpan «${nombre}» sebagai templat`,
      intro:
        'Templat menyimpan resep, pengaturan PHP dan Nginx, ekstensi, serta skema basis data (hanya struktur, tanpa baris data). Tidak pernah menyimpan kata sandi, kunci, atau isi data.',
      nombre: 'Nama templat',
      nombrePlaceholder: 'Proyek dasar saya',
      conArchivos: 'Sertakan juga file proyek',
      conArchivosAyuda: 'Tanpa opsi ini hanya resep, pengaturan, dan skema yang disimpan.',
      siempre: 'Selalu dikecualikan',
      siempreLista:
        '.env dan .env.*, vendor, node_modules, .git, .venv, log, dump dan basis data file (*.sql, *.dump, *.sqlite), kunci dan sertifikat (*.pem, *.key, *.crt…), wp-config.php, dan wolfcore.yml. File yang berisi kunci atau kata sandi juga dikecualikan.',
      extra: 'Kecualikan tambahan (satu per baris)',
      extraAyuda: 'Nama atau jalur relatif terhadap proyek, misalnya uploads atau public/build.',
      vista: 'Yang akan disimpan',
      calculando: 'Menghitung…',
      resumen: (archivos: number, tamano: string) => `${archivos} file · ${tamano}`,
      fuera: (n: number) => `${n} dikecualikan`,
      sinArchivos: 'Hanya resep, pengaturan, dan skema yang disimpan; tanpa file.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Hanya struktur basis data ${nombre} (server ${servidor}) yang disimpan, tanpa baris data.`,
      sinBase: 'Proyek tidak mendeklarasikan basis data: tidak ada skema yang disimpan.',
      avisoMongodb: 'Proyek ini menggunakan MongoDB: skemanya (koleksi dan indeks) tidak disimpan.',
      incluirDeTodosModos: 'Tetap sertakan',
      avisoIncluir:
        'Jika file tersebut berisi kunci asli, kunci itu akan tersimpan di dalam templat.',
      guardar: 'Simpan templat',
      guardada: (nombre: string) => `Templat «${nombre}» disimpan.`,
      errorGuardar: 'Templat tidak dapat disimpan',
      errorVista: 'Pratinjau tidak dapat dihitung',
      cancelar: 'Batal',
    },
    lista: {
      titulo: 'Templat saya',
      ayuda:
        'Mulai proyek baru menggunakan resep, pengaturan, dan skema (tanpa data) dari proyek yang sudah Anda miliki.',
      vacia: 'Belum ada templat. Simpan proyek sebagai templat melalui menu pada kartunya.',
      conArchivosEtiqueta: 'dengan file',
      soloEsquema: 'resep dan skema',
      conBase: (motor: string) => `basis data ${motor} tanpa data`,
      borrarEtiqueta: (nombre: string) => `Hapus templat ${nombre}`,
      borrarTitulo: (nombre: string) => `Hapus templat ${nombre}?`,
      borrarTexto:
        'Hanya templat yang dihapus. Proyek yang dibuat darinya dan proyek aslinya tidak disentuh.',
      borrada: 'Templat dihapus.',
      errorBorrar: 'Templat tidak dapat dihapus',
      errorLista: 'Templat tidak dapat dibaca',
      desde: (nombre: string) => `Templat: ${nombre}`,
      avisoSinBase: 'Templat ini tidak menyertakan basis data.',
      importadaEtiqueta: 'diimpor',
      avisoImportada:
        'Templat ini berasal dari pihak ketiga: proyek dibuat tanpa status tepercaya dan tanpa menjalankan prosesnya, dan membuka situs akan menjalankan kodenya. Periksa filenya terlebih dahulu.',
      generadoresTitulo: 'Proyek dari awal',
    },
  },
  env: {
    accion: 'Variabel .env…',
    titulo: (nombre: string) => `.env milik ${nombre}`,
    intro:
      'Nilai rahasia ditampilkan tersamar. Nilai penuh hanya muncul jika Anda menekan «Tampilkan» pada variabel tersebut dan otomatis disembunyikan kembali setelah 30 detik. Sebelum menyimpan, dibuat salinan bertanggal dari .env saat ini.',
    noExiste: 'Proyek ini belum memiliki file .env: akan dibuat saat Anda menyimpan.',
    tablaEtiqueta: 'Variabel .env',
    sinVariables: '.env tidak memiliki variabel.',
    secretaEtiqueta: 'rahasia',
    duplicadaEtiqueta: 'ganda',
    duplicadaAyuda:
      'Variabel ini muncul lebih dari sekali di .env: kemunculan terakhir yang ditampilkan dan diubah.',
    soloLecturaEtiqueta: 'multibaris',
    soloLecturaAyuda: 'Memanjang beberapa baris: edit secara manual di file.',
    seQuitara: 'Akan dihapus saat disimpan',
    valorNuevo: 'Nilai baru',
    valorNuevoDe: (clave: string) => `Nilai baru untuk ${clave}`,
    valorDe: (clave: string) => `Nilai ${clave}`,
    vacio: '(kosong)',
    mostrar: 'Tampilkan',
    ocultar: 'Sembunyikan',
    mostrarEtiqueta: (clave: string) => `Tampilkan nilai ${clave}`,
    ocultarEtiqueta: (clave: string) => `Sembunyikan nilai ${clave}`,
    cambiar: 'Ubah',
    deshacer: 'Urungkan',
    deshacerEtiqueta: (clave: string) => `Urungkan perubahan ${clave}`,
    quitar: 'Hapus',
    quitarEtiqueta: (clave: string) => `Hapus variabel ${clave}`,
    errorRevelar: 'Nilai tidak dapat ditampilkan',
    agregarTitulo: 'Tambah variabel',
    agregarNombre: 'NAMA',
    agregarValor: 'nilai',
    agregar: 'Tambah',
    nombreInvalido:
      'Gunakan huruf, angka, garis bawah, dan titik tanpa diawali angka; serta belum ada sebelumnya.',
    comparar: {
      titulo: 'Bandingkan dengan file contoh',
      sinEjemplo: 'Proyek tidak memiliki .env.example untuk dibandingkan.',
      alDia: '.env memiliki variabel yang sama dengan file contoh.',
      faltan: (n: number) => `Kurang ${n}:`,
      sobran: (n: number) => `Lebih ${n} (tidak ada di contoh):`,
      distintas: (n: number) => `${n} dengan nilai berbeda dari contoh:`,
      agregarFaltantes: 'Tambahkan yang kurang',
    },
    bloques: {
      titulo: 'Tambah blok variabel',
      ayuda:
        'Hanya menambahkan variabel topik tersebut yang belum ada di .env (yang sudah ada tidak disentuh), tanpa kata sandi atau kunci; lengkapi nanti di tabel.',
      bd: 'Basis data',
      correo: 'Email',
      ia: 'AI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Gunakan pengguna khusus',
      ayuda:
        'Membuat pengguna basis data khusus untuk proyek ini (hanya berizin pada basis datanya, tidak pernah administrator) dan menuliskannya ke .env. Saat ini berfungsi dengan MySQL dan MariaDB milik WolfCore Dev.',
      confirmarTitulo: 'Gunakan pengguna khusus untuk basis data?',
      confirmarTexto:
        'Pengguna baru dengan kata sandi acak akan dibuat hanya dengan izin pada basis data proyek ini, lalu pengguna dan kata sandi koneksi di .env diubah. Salinan .env saat ini disimpan sebelumnya; kata sandi baru tersimpan di .env proyek dan terenkripsi di WolfCore Dev.',
      confirmar: 'Buat dan gunakan',
      hecho: (usuario: string) => `Proyek kini menggunakan pengguna ${usuario}.`,
      compartirTitulo: 'Berbagi pengguna proyek lain?',
      compartirTexto: (base: string, proyecto: string) =>
        `Basis data ${base} juga digunakan oleh ${proyecto}. Berbagi penggunanya? Proyek ini akan memakai pengguna dan kata sandi yang sama; kata sandi tidak berubah sehingga ${proyecto} tetap terhubung.`,
      compartir: 'Bagikan pengguna',
      error: 'Pengguna basis data tidak dapat diubah',
    },
    copias: {
      titulo: 'Kembali ke salinan',
      ninguna: 'Belum ada salinan untuk .env ini.',
      volver: 'Kembali ke salinan ini',
      confirmarTitulo: 'Kembali ke salinan .env?',
      confirmarTexto: (fecha: string) =>
        `.env saat ini akan diganti dengan salinan tanggal ${fecha}. Salinan lain dari .env saat ini disimpan terlebih dahulu sehingga perubahan ini juga dapat diurungkan.`,
      hecho: 'Dikembalikan ke salinan.',
      error: 'Tidak dapat kembali ke salinan',
    },
    cambiosPendientes: (n: number) => `${n} perubahan belum disimpan`,
    descartar: 'Buang perubahan',
    guardar: 'Tinjau dan simpan…',
    cerrar: 'Tutup',
    cerrarTitulo: 'Tutup tanpa menyimpan?',
    cerrarTexto: (n: number) =>
      `Ada ${n} perubahan yang belum disimpan. Jika ditutup, perubahan akan hilang.`,
    cerrarDescartar: 'Tutup dan buang',
    seguirEditando: 'Lanjut mengedit',
    confirmar: {
      titulo: 'Simpan perubahan .env',
      texto:
        'Berikut yang akan berubah. Nilai rahasia ditampilkan tersamar. Salinan bertanggal dari .env saat ini akan disimpan dan file ditulis sekaligus.',
      sinCambios: 'Tidak ada perubahan untuk disimpan.',
      agregarGitignore: 'Tambahkan .env ke .gitignore proyek',
      aceptarVersionado: 'Saya memahami risikonya dan tetap ingin menyimpan',
      guardar: 'Simpan perubahan',
      versionado:
        'Git sudah melacak .env proyek ini: commit berikutnya akan mengunggah nilainya meski ada di .gitignore. Keluarkan dari indeks dengan git rm --cached .env.',
      versionadoDesconocido:
        'Tidak dapat memeriksa apakah git melacak .env proyek ini; konfirmasi terpisah untuk menyimpan.',
    },
    errorVistaPrevia: 'Pratinjau tidak dapat disiapkan',
    errorGuardar: '.env tidak dapat disimpan',
    guardado: '.env disimpan.',
    guardadoConCopia: '.env disimpan; versi sebelumnya disimpan sebagai salinan.',
  },
  asistenteInicio: {
    paso: (n: number, total: number) => `Langkah ${n} dari ${total}`,
    anterior: 'Sebelumnya',
    siguiente: 'Berikutnya',
  },
  /** Hasil impor atau ekspor profil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Cadangan dan profil',
      descripcion:
        'Profil membawa lingkungan Anda ke komputer lain: situs, versi, instans, templat, dan pengaturan. Tidak pernah membawa kunci, token, atau kata sandi.',
      aislado: {
        titulo: 'Folder uji coba',
        texto: (ruta: string) =>
          `WolfCore Dev menggunakan folder data uji coba (${ruta}). Apa yang Anda lakukan di sini tidak menyentuh folder asli maupun komputer Anda: file hosts tidak ditulis dan sertifikat tidak dipasang.`,
      },
      exportar: {
        titulo: 'Ekspor lingkungan',
        texto:
          'Menyimpan file .wolfperfil berisi situs, versi, instans, templat, dan pengaturan Anda.',
        bases: 'Sertakan basis data',
        basesAyuda:
          'Dump lengkap (beserta data pelanggan Anda) dikirim terenkripsi dengan frasa sandi.',
        ca: 'Sertakan otoritas sertifikat (CA)',
        caAyuda: 'Terenkripsi dengan frasa sandi. Impor hanya di komputer milik Anda sendiri.',
        certificados: 'Sertakan sertifikat situs',
        certificadosAyuda: 'Hanya disertakan bersama CA dan terenkripsi bersamanya.',
        frase: 'Frasa sandi',
        fraseRepetir: 'Ulangi frasa sandi',
        fraseAyuda: (minimo: number) =>
          `Minimal ${minimo} karakter. Tanpanya basis data dan CA tidak dapat dipulihkan, dan frasa tidak disimpan di mana pun.`,
        problemas: {
          frase_corta: (minimo: number) => `Frasa sandi harus memiliki minimal ${minimo} karakter.`,
          frase_distinta: 'Kedua frasa sandi tidak cocok.',
          certificados_sin_ca: 'Sertifikat hanya dapat disertakan bersama CA.',
        },
        exportar: 'Ekspor profil…',
        nota: 'Profil tidak pernah memuat kunci, token, atau kata sandi, maupun snapshot, tempat sampah, cadangan, atau folder data.',
        listo: 'Profil diekspor',
        guardado: (archivo: string, tamano: string) => `Disimpan ke ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Impor profil',
        texto:
          'Pilih file .wolfperfil. Sebelum ada yang berubah, Anda akan melihat semua yang diganti, dihapus, atau tertunda, serta salinan dari yang diganti akan disimpan.',
        boton: 'Impor profil…',
      },
      instantaneas: {
        titulo: 'Snapshot lingkungan',
        texto:
          'Sebelum memperbarui PHP atau Nginx dan sebelum mengimpor profil, WolfCore Dev menyimpan salinan konfigurasi, Nginx, dan php.ini Anda tanpa kunci maupun data, hanya untuk Anda. 10 terakhir disimpan.',
        compartidas:
          '10 slot ini digunakan bersama semua pemicu: saat mengambil yang baru, yang paling lama diganti, termasuk yang diambil manual.',
        tomar: 'Ambil sekarang',
        tomada: 'Snapshot disimpan.',
        sinNada: 'Belum ada yang dapat disalin.',
        vacia: 'Belum ada snapshot.',
        motivos: {
          actualizar: 'Sebelum pembaruan',
          'importar-perfil': 'Sebelum impor profil',
          'limpiar-versiones': 'Sebelum pembersihan versi',
          manual: 'Manual',
        },
      },
    },
    reasignar: {
      titulo: 'Folder situs',
      texto:
        'Folder ini berasal dari komputer lain. Cari lokasinya di komputer ini atau impor situs sebagai tertunda: situs dibiarkan tanpa folder hingga Anda memilihnya.',
      sitio: 'Situs',
      origen: 'Folder di profil',
      destino: 'Folder di komputer ini',
      existe: 'Ada',
      noExiste: 'Tidak ada di komputer ini',
      buscar: 'Cari folder…',
      cambiar: 'Ubah',
      comoPendiente: 'Tetap impor sebagai tertunda',
      prefijo: (viejo: string, nuevo: string) =>
        `Gunakan perubahan yang sama untuk lainnya (${viejo} → ${nuevo})`,
      omitido: 'Tidak akan diimpor',
    },
    asistente: {
      titulo: 'Impor profil',
      pasos: {
        archivo: 'File',
        revisar: 'Tinjau',
        confirmar: 'Konfirmasi',
        resultado: 'Hasil',
      },
      archivo: {
        texto:
          'Pilih file .wolfperfil. Belum ada yang berubah: Anda akan melihat terlebih dahulu apa yang akan diganti, dihapus, atau ditunda.',
        elegir: 'Pilih file…',
        cambiar: 'Pilih lainnya',
        ninguno: 'Belum ada file dipilih',
        leyendo: 'Membaca profil…',
        error: 'Profil tidak dapat dibaca',
      },
      origen: (fecha: string, sistema: string) => `Dibuat pada ${fecha} di ${sistema}.`,
      ignoradas: (n: number) => `${n} entri dalam file bukan bagian profil dan diabaikan.`,
      reemplaza: {
        titulo: 'Yang akan diganti',
        ninguno: 'Tidak ada data di folder ini: diimpor ke pemasangan bersih.',
        copia:
          'Sebelum mengganti, salinan disimpan di respaldos/pre-perfil-… dan snapshot lingkungan diambil; setiap basis data yang diganti memiliki snapshot sendiri. Folder data tidak pernah dihapus.',
        config: 'Konfigurasi (config.json)',
        sitio: (id: string) => `Situs ${id}`,
        base: (instancia: string, base: string) => `Basis data ${base} (${instancia})`,
        plantilla: (id: string) => `Templat ${id}`,
        ca: 'Otoritas sertifikat (CA) komputer ini',
      },
      versiones: {
        titulo: 'Versi',
        ninguna: 'Profil tidak memuat versi.',
        instalada: 'Sudah terpasang',
        descargar: 'Akan diunduh dengan hash terverifikasi',
        pendienteDebil: 'Tertunda: tanpa hash kuat, pasang secara manual',
        pendienteFuera: 'Tertunda: sudah tidak ada di katalog',
        huellas: {
          fuerte: 'Hash SHA-256 atau SHA-512',
          firmada: 'Bertanda tangan',
          debil: 'Hash lemah',
          ninguna: 'Tanpa hash',
        },
        descargas: (n: number) =>
          `${n} versi akan diunduh dari situs resmi, masing-masing dengan hash atau tanda tangan terverifikasi.`,
      },
      instancias: {
        titulo: 'Instans basis data',
        existente: 'Sudah ada: dipertahankan dengan port dan versinya',
        nueva: (puerto: number) => `Dibuat dengan kredensial baru di port ${puerto}`,
        reasignada: (de: number, a: number) => `Port ${de} sedang digunakan: akan memakai ${a}`,
      },
      bases: {
        titulo: 'Basis data',
        ninguna: 'Profil tidak memuat basis data.',
        texto:
          'Dipulihkan menggunakan pengguna terbatas untuk setiap basis data dan hanya dengan pernyataan yang diizinkan. Yang sudah ada dicadangkan terlebih dahulu.',
        omitir: 'Impor tanpa basis data',
      },
      plantillas: {
        titulo: 'Templat',
        existe: 'Sudah ada: akan diganti',
        nueva: 'Baru',
      },
      workspaces: {
        titulo: 'Workspace',
        texto:
          'Hanya memuat referensi basis data dan layanan (proses proyek tidak ikut). Divalidasi terhadap yang ada di sini dan tidak pernah berjalan otomatis.',
        existe: 'Sudah ada dengan id yang sama: milik Anda dipertahankan',
        nuevo: 'Baru',
        elementos: (n: number) => `${n} elemen`,
        invalidos: (n: number) => `${n} dari profil tidak valid dan tidak diimpor.`,
      },
      quitado: {
        titulo: 'Yang tidak diambil dari konfigurasi',
        texto:
          'Folder data ini bersih: pengaturan dari profil yang menunjuk ke luar komputer ini tidak diambil.',
      },
      puertos: {
        titulo: 'Port sedang digunakan',
        texto: (lista: string) =>
          `Port dari profil ini sudah digunakan program lain di komputer ini: ${lista}. Ubah melalui Layanan setelah impor.`,
      },
      ca: {
        titulo: 'Otoritas sertifikat (CA)',
        texto:
          'Profil memuat CA terenkripsi. Impor hanya jika milik Anda: komputer ini akan menerima sertifikat yang ditandatanganinya.',
        huella: 'Hash SHA-256 dari CA profil',
        comparar: 'Bandingkan dengan hash di komputer asal sebelum menerimanya.',
        importar: 'Impor CA dari profil',
        noImportar: 'Tanpa mengimpornya, komputer ini memakai CA saat ini atau membuat yang baru.',
        ajena: 'CA ini memiliki batasan nama yang bukan milik WolfCore Dev: tidak dapat diimpor.',
        sinRestricciones:
          'CA ini tidak memiliki batasan nama: dapat menandatangani sertifikat untuk situs web mana pun, termasuk bank dan email. Impor hanya jika milik Anda dan hash-nya cocok.',
        aceptarSin: 'Saya memahami risikonya: ini CA saya dan hash-nya cocok',
        reemplazaLocal:
          'Komputer ini sudah memiliki CA. Mengimpor dari profil akan menggantinya (salinan tersimpan di cadangan sebelumnya).',
        reemplazar: 'Ganti CA komputer ini',
        noSeInstala: 'CA tidak dipasang otomatis ke penyimpanan sertifikat sistem.',
      },
      frase: {
        titulo: 'Frasa sandi profil',
        texto:
          'Profil memuat basis data atau CA terenkripsi. Masukkan frasa sandi yang Anda pilih saat mengekspor.',
        campo: 'Frasa sandi',
        omitirBases: 'Impor tanpa basis data',
        nota: 'Frasa sandi hanya dipakai di jendela ini: tidak disimpan dan dihapus setelah selesai atau ditutup.',
      },
      env: {
        titulo: 'Koneksi proyek',
        texto:
          'Centang proyek yang file .env-nya perlu diarahkan ke pengguna khusus baru untuk basis datanya (dengan salinan .env sebelumnya). Lainnya tidak disentuh dan dilaporkan.',
      },
      confirmar: {
        titulo: 'Konfirmasi impor',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `${sitios} situs, ${versiones} versi, dan ${bases} basis data akan diimpor.`,
        importar: 'Impor',
        revisar: 'Tinjau',
        volver: 'Kembali',
        bloqueos: {
          sitios_sin_carpeta:
            'Pilih folder untuk setiap situs atau tandai untuk diimpor sebagai tertunda.',
          frase_requerida: 'Masukkan frasa sandi profil atau impor tanpa basis data.',
          ca_ajena: 'CA dari profil tidak dapat diimpor.',
          ca_sin_restricciones: 'Konfirmasi terpisah bahwa Anda ingin mengimpor CA tanpa batasan.',
          reemplazar_ca: 'Konfirmasi terpisah bahwa Anda ingin mengganti CA komputer ini.',
        },
      },
      progreso:
        'Mengimpor profil… Jangan tutup jendela: dengan basis data atau unduhan dapat memakan waktu.',
      fases: {
        copia: 'Menyalin item yang akan diganti',
        versiones: 'Memasang versi',
        configuracion: 'Menyimpan konfigurasi dan situs',
        plantillas: 'Menyalin templat',
        ca: 'Menyiapkan CA dan sertifikat',
        bases: 'Memulihkan basis data',
        env: 'Menulis ulang file .env',
      },
      avance: (paso: number, de: number) => `Langkah ${paso} dari ${de}`,
      resultado: {
        titulo: 'Hasil impor',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} diimpor, ${pendientes} tertunda, ${omitidos} dilewati, dan ${errores} gagal.`,
        respaldo: (ruta: string) => `Salinan item yang diganti: ${ruta}`,
        pendientes: 'Item yang tertunda dapat dilengkapi secara manual.',
        error: 'Profil tidak dapat diimpor',
        secciones: {
          sitios: 'Situs',
          versiones: 'Versi',
          instancias: 'Instans',
          bases: 'Basis data',
          plantillas: 'Templat',
          workspaces: 'Workspace',
          env: 'File .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Diimpor',
          pendiente: 'Tertunda',
          omitido: 'Dilewati',
          error: 'Kesalahan',
          instalada: 'Terpasang',
          ya_instalada: 'Sudah ada',
          creada: 'Dibuat',
          existente: 'Sudah ada',
          puerto_reasignado: 'Port dialihkan',
          reescrito: 'Ditulis ulang',
          sin_marcar: 'Tidak dicentang',
        },
        ca: {
          importada: 'CA diimpor',
          nueva: 'CA baru dibuat',
          sin_cambios: 'CA tidak berubah',
        },
        quitarCa: {
          boton: 'Hapus CA sebelumnya…',
          titulo: 'Hapus CA sebelumnya dari kepercayaan',
          texto:
            'CA yang sebelumnya dimiliki komputer ini akan dihapus dari penyimpanan sertifikat sistem. Windows mungkin meminta konfirmasi. CA baru tidak dipasang otomatis.',
          si: 'Hapus',
          hecho: 'CA sebelumnya dihapus dari kepercayaan.',
        },
        descartadosWorkspace: (lista: string) => `Tidak ada di sini dan dihapus: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} workspace tidak valid tidak diimpor.`,
        puerto: (de: number, a: number) => `Port ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Salinan .env: ${ruta}`,
      },
    },
    /** Peringatan kuat di pratinjau: CA profil tidak memiliki batasan nama. */
    caSinRestricciones:
      'CA ini dapat menandatangani situs web mana pun; impor hanya jika milik Anda, bandingkan hash-nya.',
    motivos: {
      procesos_quitados: 'Prosesnya (perintah dari komputer lain) tidak diimpor.',
      tareas_quitadas:
        'Tugas terjadwalnya (perintah dari komputer lain) tidak diimpor. Buat ulang atau adopsi dari wolfcore.yml.',
      tunel_con_nombre: 'Terowongan bernama tidak ikut: kembali ke terowongan cepat.',
      php_ini: 'Beberapa pengaturan php.ini tidak diimpor.',
      xdebug: 'Pengaturan Xdebug tidak valid dan dihapus.',
      nginx_desactivado: 'Aturan Nginx tersimpan tetapi belum diterapkan: tinjau di editor.',
      carpeta_no_existe: 'Foldernya tidak ada di komputer ini: cari lokasinya.',
      correo_sin_proveedor: 'Penyedia SMTP tidak diimpor: menggunakan penangkap email.',
      sitio_invalido: 'Situs tidak valid.',
      dominio_invalido: 'Domain tidak valid (harus berakhiran .test).',
      ruta_protegida: 'Foldernya adalah folder sistem atau WolfCore Dev: tidak diimpor.',
      dominio_en_uso: 'Situs lain di komputer ini sudah menggunakan domain tersebut.',
      sitio_repetido: 'Situs tercatat ganda dalam profil.',
      no_disponible: 'Versi tersebut sudah tidak ada di katalog.',
      huella_debil: 'Versi tersebut tidak memiliki hash kuat: pasang manual melalui Versi.',
      tope_descargas:
        'Tidak diunduh agar tidak terlalu banyak unduhan bersamaan: pasang melalui Versi.',
      instancia_pendiente: 'Instansnya tertunda.',
      motor_no_soportado: 'Mesin tersebut tidak diimpor dari profil.',
      version_pendiente: 'Versi mesinnya tertunda.',
      danada: 'Filenya dalam profil rusak.',
      bases_omitidas: 'Diimpor tanpa basis data.',
      instancia_apagada: 'Instansnya gagal dinyalakan.',
      sin_copia_previa: 'Snapshot sebelumnya gagal diambil: basis data tidak diganti.',
      sin_base: '.env tidak menunjuk ke basis data lokal.',
      base_no_resuelta: 'Instans dari basis data ini tidak diketahui.',
      error_inesperado: 'Terjadi kesalahan.',
    },
    avisos: {
      ca_reemplazada:
        'CA sebelumnya dari komputer ini masih berada di penyimpanan kepercayaan sistem dan tidak lagi digunakan. Anda dapat menghapusnya dari sini.',
      base_no_incluida: 'Basis data {base} ({instancia}) tidak disertakan.',
      sin_ca: 'Tidak ada CA di komputer ini: profil diekspor tanpanya.',
      ca_no_importada: 'CA dari profil tidak diimpor: menggunakan CA komputer ini atau CA baru.',
      certificados: 'Sertifikat tidak dapat disiapkan: {detalle}',
      aplicar: 'Situs yang diimpor belum sepenuhnya diterapkan (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Penyedia AI {id}: menggunakan URL kustom.',
      smtp: 'Penyedia SMTP {id}: host bukan dari penyedia dikenal atau penggunanya kosong.',
      puerto: 'Port {id}: di luar rentang, kembali ke nilai biasa.',
      carpeta_vigilada: 'Folder terpantau berasal dari komputer lain.',
    },
  },
};
