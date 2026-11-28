import type { TextosParciales } from '../es';

const pr = new Intl.PluralRules('pl');
/** Plural con el número delante, según la regla del idioma (uno / pocos / muchos). */
const plural = (n: number, one: string, few: string, many: string): string => {
  const cat = pr.select(n);
  return `${n} ${cat === 'one' ? one : cat === 'few' ? few : many}`;
};

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const plExtra: TextosParciales = {
  app: {
    lema: 'Lokalne środowisko, gotowe do pracy',
  },
  resumenGlobal: {
    cortoApagado: 'Wszystko wył.',
    cortoEncendidos: (n: number) => `${n} uruchomione`,
    cortoErrores: (n: number) => plural(n, 'z błędem', 'z błędami', 'z błędami'),
    cortoCargando: 'Łączenie…',
    cortoSinConexion: 'Brak łączności',
    irAServicios: 'Otwórz Usługi',
  },
  acciones: {
    copiarCompleto: 'Kopiuj cały tekst',
  },
  errores: {
    codigos: {
      'asistentes.no_existe': 'Ten asystent nie jest obsługiwany.',
      'asistentes.no_instalado': '{asistente} nie jest zainstalowany.',
      'asistentes.no_compatible': '{asistente} nie może jeszcze zostać połączony.',
      'asistentes.enlace_rechazado':
        '{archivo} jest dowiązaniem (symbolicznym lub złączem): nie został zmieniony.',
      'asistentes.vista_desfasada':
        'Plik zmienił się po podglądzie. Proszę sprawdzić podgląd ponownie.',
      'asistentes.sin_carpeta': 'Folder konfiguracji programu {asistente} nie istnieje.',
      'asistentes.entrada_no_editable':
        'Wpis wolfcore w pliku {archivo} ma format, którego nie można bezpiecznie edytować; proszę edytować go ręcznie.',
      'discos.sin_lectura': 'Nie udało się odczytać kondycji dysków. Proszę spróbować ponownie.',
      'discos.sin_eventos': 'Nie udało się odczytać zdarzeń dysku.',
      'discos.admin_cancelado': 'Anulowano zgodę administratora: nic nie odczytano.',
      'discos.admin_fallo':
        'Nie udało się odczytać kondycji dysków z uprawnieniami administratora.',
      'doctor.disco_atencion': 'Dysk {modelo} wymaga uwagi.',
      'doctor.disco_critico':
        'Dysk {modelo} jest w stanie krytycznym: proszę jak najszybciej wykonać kopię zapasową.',
      'servicios.no_encendio':
        'Nie udało się uruchomić: {nombre}. Należy sprawdzić Usługi i ich dzienniki.',
      'tuneles.sitio_no_confiable':
        'Strona {dominio} nie jest jeszcze zaufana: przed publikacją należy zaznaczyć w projekcie „Ufam temu repozytorium”.',
      'clientehttp.peticion_invalida': 'Nieprawidłowe dane w żądaniu: {campo}.',
      'clientehttp.variable_sin_definir':
        'Zmienna „{nombre}” nie jest zdefiniowana w aktywnym środowisku.',
      'clientehttp.secreto_faltante':
        'Brakuje zapisanej wartości tajnej: należy wpisać ją ponownie i zapisać żądanie lub środowisko.',
      'clientehttp.secreto_no_guardado':
        'Nie udało się zapisać wartości tajnej: nie może zawierać podziałów wiersza ani przekraczać 16 KB, a szyfrowanie systemowe musi być dostępne.',
      'clientehttp.url_invalida': 'Adres URL jest nieprawidłowy.',
      'clientehttp.url_con_credenciales':
        'Adres URL nie może zawierać użytkownika ani hasła: należy użyć karty uwierzytelniania.',
      'clientehttp.protocolo': 'Akceptowane są tylko adresy URL z http:// i https://.',
      'clientehttp.cabecera_invalida': 'Nagłówek „{nombre}” jest nieprawidłowy.',
      'clientehttp.cuerpo_grande': 'Treść żądania jest większa niż 1 MB.',
      'clientehttp.plazo': 'Żądanie przekroczyło limit czasu {segundos} s.',
      'clientehttp.cancelado': 'Żądanie anulowane.',
      'clientehttp.sin_conexion':
        'Nie udało się połączyć ({motivo}). Należy sprawdzić adres, port i czy serwer działa.',
      'clientehttp.certificado': 'Nie udało się zweryfikować certyfikatu serwera ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Więcej niż {max} przekierowań z rzędu.',
      'clientehttp.curl_invalido': 'Ten tekst nie jest prawidłowym poleceniem curl.',
      'clientehttp.curl_grande': 'Tekst curl jest zbyt duży (maksymalnie 64 KB).',
      'clientehttp.no_existe': 'Element już nie istnieje.',
      'clientehttp.limite': 'Osiągnięto limit zapisanych elementów.',
      'ejemplohttp.no_arranca': 'Nie udało się uruchomić przykładowego serwera.',
      'laboratoriogit.sin_git': 'Git nie jest zainstalowany na tym komputerze.',
      'laboratoriogit.orden_invalida': 'Tego polecenia nie ma na liście laboratorium.',
      'laboratoriogit.nombre_invalido':
        'Nazwa może zawierać tylko litery, cyfry, myślniki i podkreślenia (do 30 znaków).',
      'laboratoriogit.mensaje_invalido':
        'Komunikat musi mieć jeden wiersz, do 200 znaków i nie może zaczynać się od „-”.',
      'laboratoriogit.archivo_invalido': 'Ten plik nie należy do plików ćwiczeniowych.',
      'laboratoriogit.contenido_invalido': 'Zawartość musi być tekstem do 2000 znaków.',
      'laboratoriogit.ruta_insegura':
        'Folder laboratorium nie jest tym oczekiwanym, więc nie jest ruszany.',
      'laboratoriogit.fallo_sistema':
        'System nie pozwolił przygotować ani użyć folderu laboratorium. Należy spróbować „Zresetuj laboratorium”.',
      'buscar.ruta_vetada': 'Ten folder zawiera dane WolfCore Dev: nie jest przeszukiwany.',
      'buscar.resultado_caducado': 'Ten wynik nie jest już dostępny: wyszukaj ponownie.',
      'buscar.resultado_invalido': 'Tego wyniku nie można otworzyć.',
      'diff.raiz_invalida': 'Należy wybrać dwa istniejące foldery, które nie są dowiązaniami.',
      'diff.ruta_vetada': 'Ten folder zawiera dane WolfCore Dev: nie jest porównywany.',
      'diff.cancelado': 'Porównanie anulowane.',
      'diff.plazo': 'Porównanie trwało dłużej niż {segundos} s i zostało anulowane.',
      'diff.memoria': 'Porównanie wymaga zbyt dużo pamięci (ponad {maximo}) i zostało anulowane.',
      'diff.ocupado': 'Porównanie już trwa: należy anulować je lub poczekać.',
      'diff.caducado': 'To porównanie nie jest już dostępne: porównaj ponownie.',
      'diff.archivo_invalido': 'Tego pliku nie można już porównać: zmienił się lub zniknął.',
      'diff.fallo': 'Porównanie nie powiodło się.',
      'red.sin_confirmar':
        'Proszę potwierdzić akcję w oknie dialogowym, zanim przejdą Państwo dalej.',
      'red.rango_no_permitido':
        'Przeszukiwane są tylko sieci prywatne (10.x, od 172.16 do 172.31 i 192.168.x) do 254 urządzeń.',
      'red.sin_adaptador': 'Brak aktywnej sieci do przeszukania.',
      'red.red_publica': 'W sieciach publicznych inne urządzenia nie są przeszukiwane.',
      'red.perfil_desconocido':
        'Nie udało się sprawdzić, czy sieć jest prywatna, czy publiczna, więc inne urządzenia nie są przeszukiwane.',
      'red.ocupado': 'Trwa już inna operacja w Mojej sieci: proszę poczekać na jej zakończenie.',
      'red.equipo_no_valido': 'Akceptowane są tylko prywatne adresy IPv4 sieci lokalnej.',
      'red.equipo_desconocido': 'Tego urządzenia nie ma na liście: proszę ponownie odczytać sieć.',
      'red.recurso_no_valido': 'Tego zasobu nie ma na liście urządzenia.',
      'red.carpeta_no_valida': 'Tego udostępnionego folderu nie można stąd usunąć.',
      'red.lectura_fallo': 'Nie udało się odczytać sieci tego komputera.',
      'red.quitar_fallo': 'Nie udało się zakończyć udostępniania folderu.',
      'red.velocidad_fallo': 'Nie udało się zmierzyć szybkości: proszę sprawdzić połączenie.',
      'compartir.confirmacion_requerida':
        'Udostępnienie w internecie trzeba potwierdzić w oknie WolfCore Dev.',
      'compartir.ocupado': 'Coś jest już udostępnione: najpierw zatrzymaj udostępnianie.',
      'compartir.ruta_invalida': 'Należy wybrać istniejący folder lub plik.',
      'compartir.duracion_invalida': 'Należy wybrać 15 minut, 1 godzinę lub 4 godziny.',
      'compartir.proveedor_invalido':
        'Ten tunel nie jest obsługiwany: należy użyć Cloudflare lub ngrok.',
      'compartir.raiz_unidad':
        'Katalog główny dysku nie jest udostępniany. Należy wybrać folder wewnątrz niego.',
      'compartir.carpeta_usuario':
        'Cały folder osobisty (ani folder, który go zawiera) nie jest udostępniany. Należy wybrać podfolder.',
      'compartir.carpeta_datos': 'Folder danych WolfCore Dev nie jest udostępniany.',
      'compartir.sitio_datos_reales':
        'Strona z prawdziwymi danymi (ani nic w jej wnętrzu) nie jest udostępniana.',
      'compartir.carpeta_secretos':
        'Ten folder zawiera klucze (.ssh, .aws, .git…) i nie jest udostępniany.',
      'compartir.carpeta_sistema': 'Foldery systemowe nie są udostępniane.',
      'compartir.archivo_sensible':
        'Ten plik wygląda na zawierający sekret lub prawdziwe dane i nie jest udostępniany.',
      'compartir.carpeta_perfil':
        'Dane programów użytkownika (AppData, .claude, .config…) nie są udostępniane.',
      'compartir.archivo_grande':
        'Ten plik jest zbyt duży, by go sprawdzić, i nie jest plikiem multimedialnym ani pakietem: nie jest udostępniany.',
      'compartir.tunel_sin_url':
        'Tunel nie podał swojego adresu w ciągu {segundos} s. Należy spróbować ponownie.',
      'compartir.tunel_cerrado': 'Tunel zamknął się, zanim zdążył się otworzyć.',
      'compartir.fallo': 'Nie udało się udostępnić.',
      'disco.raiz_invalida': 'Należy wybrać istniejący folder lub dysk, który można odczytać.',
      'disco.cancelado': 'Analiza anulowana.',
      'info.ruta_invalida': 'Ścieżka jest nieprawidłowa: musi być bezwzględna i lokalna.',
      'info.no_existe': 'Plik lub folder nie istnieje.',
      'info.sin_ruta':
        'Ten element nie jest plikiem na dysku (na przykład załącznikiem lub czymś wewnątrz archiwum zip): proszę najpierw zapisać go w folderze.',
      'info.enlace': 'To jest łącze: proszę wybrać plik lub folder docelowy.',
      'info.hash_grande': 'Plik przekracza {maximo} MB: skróty nie są obliczane.',
      'disco.plazo': 'Analiza trwała dłużej niż {minutos} min i została anulowana.',
      'disco.memoria': 'Analiza wymaga zbyt dużo pamięci (ponad {maximo}).',
      'disco.ocupado': 'Analiza już trwa: należy anulować ją lub poczekać.',
      'disco.caducado': 'Ta analiza nie jest już dostępna: przeanalizuj ponownie.',
      'disco.entrada_invalida': 'Tego folderu już nie ma lub się zmienił: przeanalizuj ponownie.',
      'disco.fallo': 'Analiza nie powiodła się.',
      'reverb.no_laravel': 'Reverb jest dostępny tylko w projektach Laravel.',
      'reverb.no_confiado':
        'Należy zaznaczyć w projekcie „Ufam temu repozytorium”, aby włączyć Reverb.',
      'reverb.sin_paquete':
        'Brakuje pakietu laravel/reverb: należy zainstalować go poleceniem composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Należy potwierdzić włączenie Reverb.',
      'reverb.sin_activar': 'Najpierw włącz Reverb w projekcie.',
      'env.meilisearch_no_disponible':
        'Meilisearch nie jest zainstalowany: należy zainstalować go w Usługach.',
      'bd.lentas_confirmar':
        'Zmiana rejestrowania wolnych zapytań wpływa na cały serwer: trzeba ją potwierdzić. Nic nie zmieniono.',
      'bd.lentas_umbral_invalido': 'Czas musi mieścić się między 0,1 a 60 sekundami.',
      'bd.lentas_motor_no_soportado':
        'Wolne zapytania można zmieniać tylko w MySQL, MariaDB i PostgreSQL zarządzanych przez WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        'SQL nie jest pokazywany z wartościami: baza danych zawiera prawdziwe dane lub zapytania nie da się przypisać do znanej bazy danych.',
      'bd.lentas_entrada_no_existe': 'Tego zapytania nie ma już w dzienniku. Odczytaj je ponownie.',
      'bd.lentas_fallo':
        'Nie udało się odczytać ani zmienić dziennika wolnych zapytań. Należy sprawdzić, czy serwer działa.',
      'bd.esquema_base_no_existe': 'Ta baza danych nie istnieje na tym serwerze.',
      'bd.esquema_motor_no_soportado':
        'Podgląd schematu jest przeznaczony dla MySQL, MariaDB i PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Nie udało się odczytać schematu bazy danych. Należy sprawdzić, czy serwer działa.',
      'captura.atajo_invalido':
        'Ten skrót jest nieprawidłowy: należy użyć Ctrl, Alt, Shift lub Super z literą, cyfrą albo klawiszem F.',
      'captura.atajo_no_permitido':
        'Ten skrót jest niedozwolony: należy użyć Ctrl lub Super z innym modyfikatorem (Ctrl+Alt bez Shift to AltGr i psuje pisanie @) i unikać popularnych skrótów, takich jak Ctrl+C czy Alt+F4.',
      'captura.atajo_ocupado': 'Skrót {atajo} jest już używany przez inny program.',
      'captura.no_disponible': 'Przechwytywanie ekranu nie jest dostępne na tym komputerze.',
      'captura.permiso_denegado': 'Brakuje uprawnienia do nagrywania ekranu.',
      'captura.sin_imagen': 'Brak obrazu do przechwycenia.',
      'captura.imagen_invalida': 'Obraz przechwycenia jest nieprawidłowy.',
      'disco.sin_confirmar':
        'Przed kontynuowaniem należy potwierdzić czyszczenie w oknie dialogowym.',
      'disco.categoria_invalida': 'Taka kategoria czyszczenia nie istnieje.',
      'disco.ruta_vetada':
        'Kategoria dotyka chronionej ścieżki (dane, kopie zapasowe, projekty lub FlyEnv); nic nie wyczyszczono.',
      'disco.sin_analisis':
        'Przeanalizuj ponownie przed czyszczeniem: analiza wygasła lub jej brakuje.',
      'disco.ocupada': 'Analiza lub czyszczenie już trwa.',
      'disco.sin_registro': 'Nie udało się utworzyć dziennika czyszczenia; nic nie usunięto.',
      'editor.sin_confirmar': 'Przed kontynuowaniem należy potwierdzić zapis.',
      'editor.confirmacion_reforzada':
        'Ten plik wygląda na zawierający sekrety lub należący do strony z prawdziwymi danymi: aby go zapisać, należy potwierdzić dodatkową kontrolą.',
      'editor.ruta_invalida': 'Ścieżka pliku jest nieprawidłowa.',
      'editor.no_existe': 'Plik nie istnieje.',
      'editor.no_regular': 'Można edytować tylko zwykłe pliki.',
      'editor.ruta_vetada':
        'Ten plik znajduje się w folderze danych WolfCore Dev: nie można go otworzyć ani zapisać z edytora.',
      'editor.archivo_env': 'Plikami .env zarządza się ze zmiennych projektu, a nie z edytora.',
      'editor.demasiado_grande': 'Plik jest zbyt duży dla edytora (maksymalnie {maximo}).',
      'editor.binario': 'Plik nie jest tekstowy (jest binarny): nie można go tu edytować.',
      'editor.codificacion':
        'Plik nie jest w kodowaniu UTF-8: edytor go nie otwiera, aby go nie uszkodzić.',
      'editor.no_abierto':
        'Ten plik nie został otwarty w edytorze (lub jego wersja się zmieniła): należy otworzyć go ponownie.',
      'editor.eol_mixto':
        'Plik miesza różne zakończenia wierszy: aby zapisać, należy potwierdzić ich ujednolicenie.',
      'editor.contenido_invalido': 'Zawartość nie jest prawidłowym tekstem.',
      'editor.huella_invalida': 'Brakuje odcisku otwartego pliku: należy otworzyć go ponownie.',
      'editor.archivo_cambiado':
        'Plik zmienił się poza edytorem od chwili otwarcia. Należy wczytać go ponownie lub potwierdzić nadpisanie.',
      'editor.copia_fallo': 'Nie udało się wykonać kopii zapasowej ({codigo}); nic nie zapisano.',
      'editor.lectura_fallo': 'Nie udało się odczytać pliku ({codigo}).',
      'editor.escritura_fallo':
        'Nie udało się zapisać pliku ({codigo}). Oryginał nie został tknięty.',
      'memoria.sin_confirmar':
        'Przed kontynuowaniem należy potwierdzić działanie w oknie dialogowym.',
      'memoria.modo_invalido': 'Taki tryb optymalizacji nie istnieje.',
      'memoria.plan_caducado':
        'Lista wygasła lub nie jest już aktualna. Należy pokazać ją ponownie przed zastosowaniem.',
      'memoria.no_disponible':
        'Optymalizator pamięci nie jest tu dostępny lub nie mógł odczytać systemu.',
      'conversor.ocupado':
        'Jedna konwersja już trwa, a kolejna czeka: należy poczekać, aż się zakończy.',
      'doctor.firewall_reglas_acotadas':
        'Liczba reguł dla programów WolfCore Dev ograniczonych do sieci lokalnej: {cantidad} (tylko profil prywatny, podsieć lokalna i określone porty), takich jak te, które aplikacja sama zaleca do udostępniania strony. Są tylko pokazane: stąd nie są usuwane.',
      'doctor.firewall_almacen_inseguro':
        'Chronionej kopii reguł nie można ufać (uprawnienia lub zawartość różnią się od pokazanych): żadna reguła nie została utworzona ani zmieniona.',
      'doctor.firewall_quitadas':
        'WolfCore Dev usunął wcześniej reguły zapory ({cantidad}) i zachował kopię: w razie potrzeby można je utworzyć ponownie.',
      'doctor.firewall_parcial':
        'Część reguł usunięto, a inne nie: zmieniły się od pokazania listy, nie należały do WolfCore Dev lub Windows nie pozwolił ich usunąć. Należy sprawdzić listę.',
      'doctor.firewall_sin_cambios':
        'Żadna reguła nie została zmieniona: nie zgadzają się już z pokazanymi lub nie udało się ich zmienić.',
      'doctor.firewall_registro_fallido':
        'Nie udało się zapisać kopii reguł w chronionym kluczu rejestru HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos: nic nie zmieniono.',
      'catalogo.paquete_invalido':
        'Pobrany pakiet nie jest bezpieczny (ścieżki poza folderem, dowiązania lub nadmierny rozmiar).',
      'catalogo.extraccion_fallo': 'Nie udało się odczytać ani wypakować pobranego pakietu .7z.',
      'runtimes.falta_runtime':
        '{nombre} nie jest zainstalowany dla tego projektu: należy zainstalować go w Usługach.',
      'runtimes.falta_jdk':
        'Dla tego projektu nie zainstalowano JDK: należy zainstalować Javę w Usługach.',
      'runtimes.instalacion_incompleta':
        'Instalacja {nombre} jest niekompletna: należy zainstalować ją ponownie w Usługach.',
      'procesos.escucha_publica':
        'Proces nasłuchuje na {direccion}:{puerto} ({programa}) i jest otwarty na sieć. Został zatrzymany: może nasłuchiwać tylko na 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'Proces nasłuchuje na {direccion}:{puerto} ({programa}) i jest otwarty na sieć. Został zatrzymany: może nasłuchiwać tylko na 127.0.0.1. To LiveReload ze Spring DevTools: należy wyłączyć go przez spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'Proces nasłuchuje na {direccion}:{puerto} ({programa}) i jest otwarty na sieć. Został zatrzymany: może nasłuchiwać tylko na 127.0.0.1. To inspektor Node: należy użyć --inspect=127.0.0.1.',
    },
  },
  inicio: {
    servicios: {
      irA: (nombre: string) => `Przejdź do usługi ${nombre}`,
    },
    tuneles: {
      irA: (nombre: string) => `Przejdź do projektu ${nombre}`,
    },
  },
  servicios: {
    borrarDatos: {
      que: {
        meilisearch: 'wszystkie indeksy Meilisearch',
      },
    },
    sinParaEncender: 'Brak zainstalowanych usług do uruchomienia',
    franjaExternos: {
      texto:
        'Nie zainstalowano jeszcze serwera WWW ani PHP. Zewnętrzne silniki wykryto automatycznie.',
      accion: 'Zainstaluj Nginx i PHP',
    },
    externos: {
      titulo: 'Wykryto na tym komputerze',
      ayuda: 'Zarządza nimi inny program; WolfCore Dev tylko je pokazuje.',
    },
    ftp: {
      redLocalAyuda:
        'Po wyłączeniu połączyć się można tylko z tego komputera (127.0.0.1). Dostęp każdego projektu włącza się w Projektach.',
      compartir: {
        enlace: 'Udostępnij folder lub plik…',
        ayuda:
          'FTP nie jest udostępniany przez tunel: jest niezaszyfrowany, a tunel przenosi tylko HTTP. Aby opublikować coś w internecie, należy użyć „Udostępnij folder lub plik” (HTTP, tylko do odczytu); FTP pozostaje w sieci lokalnej.',
      },
    },
    datosConexion: 'Dane połączenia',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Połączenie z Meilisearch',
      notaMeilisearch:
        'Aby użyć go w projekcie: Zmienne (.env) → Dodaj blok → Meilisearch. Wyświetlany jest podgląd z zamaskowanym kluczem i wymagane jest potwierdzenie. Klucz należy tylko do tego komputera.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Wyszukiwanie dla Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  tunel: {
    sinConfianza:
      'Ten projekt nie jest zaufany: należy zaznaczyć „Ufam temu repozytorium”, aby móc go opublikować.',
  },
  tuneles: {
    irAProyectos: 'Przejdź do Projektów',
    compartir: {
      enlace: 'Udostępnij folder lub plik…',
      ayuda:
        'Publikuje folder lub pojedynczy plik (tylko do odczytu), bez potrzeby posiadania strony.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'Proces Reverb tego projektu nie ma polecenia WolfCore Dev (inny host, program lub port). Włączenie zastąpi go standardowym, który nasłuchuje tylko na 127.0.0.1.',
    ayuda: 'Laravel WebSockets, tylko na 127.0.0.1.',
    puerto: (p: number) => 'Port {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) => 'Włącz lub wyłącz Reverb dla {d}'.replace('{d}', dominio),
    activarTitulo: 'Włączyć Reverb?',
    activarTexto: (dominio: string) =>
      'W {d} zostanie uruchomione „php artisan reverb:start”, nasłuchujące tylko na 127.0.0.1 na wolnym porcie. Kod projektu działa z jego PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Wyłączyć Reverb?',
    desactivarTexto:
      'Proces zostaje zatrzymany i usunięty z projektu. Zmienne REVERB_* w .env nie są ruszane.',
    activar: 'Włącz',
    desactivar: 'Wyłącz',
    proponer: 'Zaproponuj zmienne REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Zatrzymany',
      iniciando: 'Uruchamianie',
      encendido: 'Działa',
      error: 'Awaria',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP jest tylko dla sieci lokalnej: nie jest udostępniany przez tunel internetowy, ponieważ przesyła hasło i pliki bez szyfrowania.',
    compartirIr: 'Udostępnij folder lub plik tymczasowym linkiem',
  },
  ia: {
    pestanas: {
      etiqueta: 'Sekcje AI',
      agentes: 'Agenci',
      nube: 'Chmura',
      local: 'Modele lokalne',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram:
        'Dla tego komputera: modele do ≈{b}B, mieszczące się w pamięci karty graficznej.',
      sugerenciaRam: 'Dla tego komputera: modele do ≈{b}B, działające w pamięci RAM.',
      sugerenciaPequena: 'Dla tego komputera: tylko bardzo małe modele (poniżej 1B).',
      sugerenciaDesconocida: 'Nie udało się odczytać sprzętu tego komputera, więc nie ma zaleceń.',
      aviso: 'To tylko wskazówka: można pobrać dowolny model.',
      comprobando: 'Sprawdzanie komputera…',
      niveles: {
        recomendado: 'Zalecany',
        lento: 'Może działać wolno',
        'no-cabe': 'Nie mieści się',
        desconocido: 'Brak danych',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Mieści się swobodnie w pamięci karty graficznej (potrzeba ≈{necesario} z {disponible}).',
        'justo-vram':
          'Mieści się w karcie graficznej, ale na styk (potrzeba ≈{necesario} z {disponible}).',
        'solo-ram':
          'Nie mieści się w karcie graficznej i będzie działać w pamięci RAM (potrzeba ≈{necesario} z {disponible} dostępnych): wolniej.',
        'cabe-ram':
          'Mieści się swobodnie w pamięci RAM (potrzeba ≈{necesario} z {disponible} dostępnych).',
        'ram-justo':
          'Mieści się w pamięci RAM, ale na styk (potrzeba ≈{necesario} z {disponible} dostępnych): może działać wolno.',
        'sin-memoria': 'Potrzeba ≈{necesario} pamięci, a komputer dysponuje ≈{disponible}.',
        'sin-disco':
          'Brak wystarczającej ilości wolnego miejsca na dysku, aby pobrać model (zostało {disponible}).',
        'tamano-desconocido':
          'Nie udało się sprawdzić rozmiaru modelu (brak połączenia z rejestrem Ollama).',
        'equipo-desconocido': 'Nie udało się odczytać pamięci komputera.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'Pobieranie można anulować w dowolnej chwili; to, co już pobrano, zostanie odrzucone.',
      tamano: (t: string) => `Rozmiar pobierania: ${t}.`,
      tamanoDesconocido:
        'Nie udało się sprawdzić rozmiaru (brak połączenia z rejestrem Ollama). Modele zwykle zajmują od 1 do ponad 40 GB.',
      libre: (l: string) => `Wolne miejsce na dysku modeli: ${l}.`,
      libreDesconocido: 'Nie udało się zmierzyć wolnego miejsca na dysku.',
      sinEspacio: (t: string, l: string) =>
        `Za mało miejsca: model zajmuje ${t}, a wolne jest tylko ${l}. Należy zwolnić miejsce lub wybrać mniejszy model.`,
    },
  },
  proyectos: {
    asistente: {
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    tarjeta: {
      verEnBases: 'Pokaż w Bazach danych',
    },
  },
  panel: {
    insignias: {
      memoriaAlta: 'Dużo pamięci',
    },
    discos: {
      titulo: 'Miejsce na dyskach',
      leyendo: 'Odczytywanie dysków…',
      sistema: 'System',
      datos: 'Dane WolfCore',
      ambos: 'System i dane WolfCore',
      libre: (unidad: string, libre: string, pct: number) =>
        `${unidad} · wolne ${libre} (${pct} %)`,
      poco: 'Mało wolnego miejsca',
      casiLleno: 'Miejsce prawie się skończyło',
      liberar: 'Zwolnij miejsce',
      versiones: 'Wyczyść nieużywane wersje',
      temporales: 'Wyczyść pliki tymczasowe i pamięci podręczne WolfCore',
      ocupaMas: 'Zobacz, co zajmuje najwięcej miejsca',
    },
    alertas: {
      grupo: (n: number) => `Wykryto problemy (${n})`,
      verTodos: (n: number) => `Pokaż wszystkie (${n})`,
      verMenos: 'Pokaż mniej',
      masAcciones: 'Więcej działań',
    },
    procesos: {
      resto: 'Pozostałe usługi',
    },
  },
  captura: {
    barra: 'Narzędzia rysowania',
    herramientas: {
      recuadro: 'Ramka',
      flecha: 'Strzałka',
      linea: 'Linia',
      resaltador: 'Zakreślacz',
      texto: 'Tekst',
      pixelar: 'Pikseluj',
      pixelarAyuda: 'Pikselowanie (niebezpieczne dla danych wrażliwych: użyj „Ukryj”)',
      ocultar: 'Ukryj',
      ocultarAyuda: 'Ukryj pełnym wypełnieniem (zalecane dla danych wrażliwych)',
    },
    deshacer: 'Cofnij',
    rehacer: 'Ponów',
    copiar: 'Kopiuj',
    copiarAyuda:
      'Kopiuj do schowka. Schowek Windows może zachować to w historii lub zsynchronizować z innymi urządzeniami.',
    guardar: 'Zapisz…',
    alConversor: 'Wyślij do konwertera obrazów',
    cerrar: 'Anuluj (Esc)',
    nuevaSeleccion: 'Nowe zaznaczenie',
    color: 'Kolor',
    grosor: 'Grubość',
    formato: 'Format',
    cargando: 'Przygotowywanie przechwycenia…',
    guiaRegion: 'Przeciągnij, aby wybrać obszar. Esc anuluje.',
    guiaVentana: 'Należy wybrać okno do przechwycenia. Esc anuluje.',
    sinVentanas: 'Brak okien, które można przechwycić.',
    textoPlaceholder: 'Wpisz tekst i naciśnij Enter',
    copiada: 'Skopiowano do schowka',
    guardada: (archivo: string) => `Zapisano w ${archivo}`,
    errorCargar: 'Nie udało się otworzyć przechwycenia.',
    errorCopiar: 'Nie udało się skopiować obrazu.',
    errorGuardar: 'Nie udało się zapisać obrazu.',
    errorConversor: 'Nie udało się wysłać obrazu do konwertera.',
    errorVentana: 'Nie udało się przechwycić tego okna.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Wszystko dzieje się na tym komputerze: przechwycenie nie jest wysyłane do żadnej usługi i nie jest zapisywane na dysku, dopóki nie zostanie zapisane. Okna WolfCore Dev na chwilę się chowają, by nie pojawiły się na obrazie.',
      region: 'Obszar',
      regionAyuda: 'Przeciągnij po ekranie, aby wybrać obszar.',
      ventana: 'Okno',
      ventanaAyuda: 'Należy wybrać jedno z otwartych okien.',
      pantalla: 'Cały ekran',
      pantallaAyuda: 'Ekran, na którym znajduje się kursor.',
      atajoActivo: (atajo: string) => `Skrót globalny aktywny: ${atajo} (obszar).`,
      atajoInactivo: 'Brak skrótu globalnego. Należy włączyć go w Ustawieniach.',
      noDisponible: 'Przechwytywanie ekranu nie jest dostępne na tym komputerze.',
      permisoDenegado:
        'Brakuje uprawnienia do nagrywania ekranu. Należy włączyć je dla WolfCore Dev w ustawieniach systemu.',
      ocupada: 'Przechwytywanie już trwa.',
    },
    ajustes: {
      titulo: 'Przechwytywanie ekranu',
      descripcion:
        'Obszar, okno lub cały ekran z szybkim edytorem. Działa w 100% lokalnie: nic nie jest wysyłane ani zapisywane, dopóki nie zapadnie decyzja.',
      activar: 'Skrót globalny',
      activarAyuda:
        'Domyślnie wyłączony. Po włączeniu jest rejestrowany tylko wtedy, gdy nie używa go inny program, i jest zwalniany przy zamknięciu WolfCore Dev.',
      atajo: 'Kombinacja',
      grabar: 'Zmień',
      grabando: 'Naciśnij kombinację…',
      grabandoAyuda:
        'Należy użyć Ctrl lub Super z innym modyfikatorem (na przykład Ctrl+Alt+Shift) i literą, cyfrą lub klawiszem F. Należy unikać popularnych skrótów, takich jak Ctrl+C.',
      formato: 'Format przy zapisie',
      activado: (atajo: string) => `Skrót ${atajo} włączony.`,
      desactivado: 'Skrót wyłączony.',
      ocupado: (atajo: string) =>
        `Skrót ${atajo} jest już używany przez inny program i nic nie zmieniono. Należy spróbować innej kombinacji.`,
      ocupadoInicio:
        'Zapisany skrót jest już używany przez inny program i nie został zarejestrowany. Należy wybrać inną kombinację.',
      sinPermiso:
        'W macOS wymagane jest uprawnienie do nagrywania ekranu; system poprosi o nie przy pierwszym przechwyceniu.',
      formatoGuardado: 'Format zapisany.',
    },
  },
  ajustes: {
    avisos: {
      tipos: {
        'salud-disco': 'Powiadomienia o kondycji dysku',
      },
    },
  },
  avisos: {
    hacerRespaldo: 'Wykonaj kopię zapasową teraz',
  },
  herramientas: {
    entorno: {
      discos: {
        titulo: 'Kondycja dysków',
        intro:
          'Stan każdego dysku według systemu Windows, bez instalowania czegokolwiek. Tylko odczyt: na dyskach nic nie jest zmieniane.',
        actualizar: 'Odśwież',
        leerAdmin: 'Odczytaj z uprawnieniami administratora',
        leerAdminAyuda:
          'System Windows poprosi o Pana/Pani zgodę (UAC) tylko po naciśnięciu tego przycisku. Odczytuje wyłącznie dane i nigdy nie uruchamia się samoczynnie.',
        sinDiscos: 'System Windows nie zgłosił żadnego dysku fizycznego.',
        numeroDisco: 'Dysk {n}',
        unidades: 'Dyski logiczne: {u}',
        sinUnidades: 'Bez litery dysku',
        datosWolf: 'Dane WolfCore Dev',
        proyectos: 'Projekty',
        tipoDesconocido: 'Typ nieznany',
        veredictos: {
          bien: 'Dobry',
          atencion: 'Uwaga',
          critico: 'Krytyczny',
          no_disponible: 'Niedostępne',
        },
        motivos: {
          estado_warning: 'System Windows zgłasza stan „Warning” (ostrzeżenie).',
          estado_unhealthy: 'System Windows zgłasza stan „Unhealthy” (uszkodzony).',
          estado_operacional: 'Stan operacyjny wskazuje na awarię ({estado}).',
          errores_sin_corregir: 'Są nieskorygowane błędy (odczyt: {lectura}, zapis: {escritura}).',
          prediccion_fallo: 'Dysk przewiduje awarię (SMART).',
          desgaste: 'Zużycie {desgaste}% (próg: {umbral}%).',
          temperatura: 'Temperatura {temperatura} °C (limit: {limite} °C).',
          errores_corregidos_suben:
            'Skorygowane błędy odczytu wzrosły względem poprzedniego odczytu (łącznie {cantidad}).',
        },
        contadores: {
          temperatura: 'Temperatura',
          desgaste: 'Zużycie',
          lecturaCorregidos: 'Skorygowane błędy odczytu',
          lecturaNoCorregidos: 'Nieskorygowane błędy odczytu',
          escrituraCorregidos: 'Skorygowane błędy zapisu',
          escrituraNoCorregidos: 'Nieskorygowane błędy zapisu',
          horas: 'Godziny pracy',
          prediccion: 'Przewidywanie awarii',
        },
        noDisponible: 'Niedostępne',
        noDisponibleMotivo: 'Niedostępne ({motivo})',
        motivoSin: {
          admin: 'wymaga uprawnień administratora',
          bus: 'ten rodzaj połączenia (USB lub RAID) nie udostępnia liczników',
          no_soportado: 'dysk lub jego kontroler ich nie obsługuje',
          no_leidos: 'system Windows nie zwrócił wartości',
        },
        prediccionSin: {
          sin_acceso: 'wymaga uprawnień administratora',
          no_disponible: 'ten komputer jej nie oferuje',
        },
        prediccionSinFallo: 'Awaria nie jest przewidywana',
        prediccionFallo: 'Przewidywana awaria',
        bienSoloEstado: 'Dobrze (tylko stan zgłaszany przez system Windows)',
        noAplicaHdd: 'Nie dotyczy (HDD)',
        ultimoDatoAdmin: 'Ostatnie dane z uprawnieniami administratora: {fecha}',
        ultimoDatoContadores: 'Ostatnie dane z liczników: {fecha}',
        horasValor: '{n} godz.',
        criterios: {
          titulo: 'Jak ustalana jest ocena?',
          critico:
            'Krytyczny: system Windows zgłasza stan Warning lub Unhealthy albo awarię operacyjną, są nieskorygowane błędy lub dysk przewiduje awarię.',
          atencion:
            'Uwaga: zużycie od {desgaste}%, temperatura powyżej maksimum podanego przez producenta (bez niego od {ssd} °C w dyskach SSD i NVMe lub od {hdd} °C w dyskach HDD) albo skorygowane błędy odczytu rosnące względem poprzedniego odczytu.',
          bien: 'Dobry: stan Healthy i żadna z powyższych sytuacji.',
          noDisponible: 'Niedostępne: system Windows nie podał wystarczających danych o tym dysku.',
        },
        leidoAdmin: 'Dane odczytano z uprawnieniami administratora.',
        requiereAdminAviso:
          'Niektóre dane wymagają uprawnień administratora. Może Pan/Pani je odczytać przyciskiem powyżej: system Windows poprosi o zgodę dopiero wtedy.',
        nota: 'Ten odczyt ma charakter orientacyjny i niczego nie gwarantuje: dobry wynik nie zapobiega awarii. Proszę przechowywać kopie zapasowe ważnych danych.',
        privacidad:
          'Numery seryjne ani unikalne identyfikatory nie są odczytywane ani wyświetlane.',
      },
      eventosDisco: {
        titulo: 'Zdarzenia dysku',
        intro:
          'Wpisy dziennika System systemu Windows dotyczące dysków z ostatnich {dias} dni. Tylko odczyt.',
        actualizar: 'Odśwież zdarzenia',
        copiar: 'Kopiuj zdarzenia',
        copiado: 'Skopiowano zdarzenia',
        vacio: 'W ciągu ostatnich {dias} dni nie było zdarzeń dysku.',
        sinDisco: 'Dysk nie został wskazany',
        disco: 'Dysk {n}',
        unidad: 'Dysk logiczny {u}',
        gravedad: {
          info: 'Informacja',
          aviso: 'Ostrzeżenie',
          critico: 'Krytyczny',
        },
        explicaciones: {
          disco_7: 'Dysk ma uszkodzony blok.',
          disco_11: 'Kontroler wykrył błąd dysku.',
          disco_51: 'Wystąpił błąd dysku podczas operacji stronicowania.',
          disco_52: 'Dysk przewiduje, że ulegnie awarii.',
          disco_55: 'Wykryto uszkodzenie systemu plików dysku logicznego.',
          disco_129: 'System Windows musiał zresetować kontroler dysku, ponieważ nie odpowiadał.',
          disco_98: 'System Windows sprawdził wolumin i jest on w dobrym stanie.',
          disco_140:
            'System nie mógł zapisać danych w dzienniku transakcji woluminu; może dojść do uszkodzenia danych.',
          disco_153: 'Operacja na dysku nie powiodła się i została ponowiona.',
          disco_157: 'Dysk został nieoczekiwanie odłączony.',
        },
        tope: 'Wyświetlanych jest najwyżej {n} zdarzeń.',
        cabeceraCopia: 'Zdarzenia dysku (ostatnie {dias} dni)',
      },
      equipo: {
        titulo: 'Ten komputer',
        copiarResumen: 'Kopiuj podsumowanie',
        resumenCopiado: 'Skopiowano podsumowanie',
        privacidad: 'Podsumowanie nie zawiera numerów seryjnych ani unikalnych identyfikatorów.',
        desconocido: 'nieznane',
        sinGpu: 'Nie wykryto',
        so: 'System operacyjny',
        cpu: 'Procesor',
        ram: 'Pamięć RAM',
        gpu: 'Karta graficzna',
        placa: 'Płyta główna',
        disco: 'Dysk {u}',
        compilacion: 'kompilacja {n}',
        nucleosHilos: 'rdzenie: {n}, wątki: {h}',
        ramDetalle: 'razem {total}, wolne {libre}',
        vram: '{v} VRAM',
        discoDetalle: 'wolne {libre} z {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Podsumowanie komputera · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Podsumowanie komputera · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: 'Proszę upuścić tutaj plik lub folder, aby zobaczyć informacje o nim. Dane są tylko odczytywane: nic nie jest zmieniane.',
      soltarEnVentana: 'Proszę upuścić, aby zobaczyć informacje',
      ruta: 'Ścieżka',
      mime: 'Typ MIME',
      creado: 'Utworzono',
      accedido: 'Ostatni dostęp',
      atributos: 'Atrybuty',
      soloLectura: 'Tylko do odczytu',
      oculto: 'Ukryty',
      ninguno: 'Brak',
      dimensiones: 'Wymiary',
      sensible: 'Plik poufny: wyświetlane są jego dane, nigdy zawartość.',
      esArchivo: 'Plik',
      esCarpeta: 'Folder',
      tamanoTotal: 'Łączny rozmiar',
      archivos: 'Pliki',
      carpetas: 'Podfoldery',
      analizando: 'Analizowanie folderu…',
      cancelar: 'Anuluj',
      cancelado: 'Analiza anulowana.',
      abrirDisco: 'Otwórz w narzędziu „Użycie dysku”',
      incompleto:
        'Niektóre elementy nie zostały policzone: łącza, odmowa dostępu lub zbyt duże foldery.',
      raizUnidadTitulo: 'Przeanalizować cały dysk?',
      raizUnidadTexto:
        'Za chwilę zostanie przeanalizowany {ruta} — cały dysk. Może to trwać bardzo długo, ponieważ przeglądana jest cała zawartość. Kontynuować?',
      raizUnidadAnalizar: 'Analizuj',
    },
    chmod: {
      permisos: 'Uprawnienia',
      propietario: 'Właściciel',
      grupo: 'Grupa',
      otros: 'Inni',
      leer: 'Odczyt (r)',
      escribir: 'Zapis (w)',
      ejecutar: 'Wykonanie (x)',
      especiales: 'Bity specjalne',
      setuid: 'setuid: uruchamia się z uprawnieniami właściciela',
      setgid:
        'setgid: uruchamia się z uprawnieniami grupy; w folderze wszystko, co zostanie w nim utworzone, dziedziczy grupę',
      sticky: 'sticky: w katalogu usuwać może tylko właściciel',
      habituales: 'Typowe wartości',
      octal: 'Ósemkowo',
      simbolico: 'Symbolicznie',
      octalInvalido: 'Należy wpisać 3 lub 4 cyfry od 0 do 7 (na przykład 755).',
      simbolicoInvalido: 'Należy wpisać 9 znaków, na przykład rwxr-xr-x.',
      ejemplo: 'Przykład',
      archivo: 'Nazwa pliku',
      archivoPorDefecto: 'plik',
      nota: 'W systemie Windows nie ma zastosowania; służy do serwerów Linux i macOS.',
      avisoOtros:
        'Dowolny użytkownik serwera mógłby go zmienić: lepiej nie nadawać zapisu grupie „inni”.',
    },
    lista: {
      chmod: {
        nombre: 'Uprawnienia chmod',
        descripcion: 'Pola wyboru, zapis ósemkowy i symboliczny, dla serwerów Linux i macOS.',
      },
      clienteHttp: {
        nombre: 'Klient HTTP',
        descripcion: 'Wypróbowywanie API: żądania, środowiska, kolekcje i historia.',
      },
      captura: {
        nombre: 'Przechwytywanie ekranu',
        descripcion: 'Obszar, okno lub cały ekran, z szybkim edytorem.',
      },
      guiaTuneles: {
        nombre: 'Przewodnik po tunelach',
        descripcion: 'Cloudflare i ngrok krok po kroku, z poleceniami do skopiowania.',
      },
      guiaHttp: {
        nombre: 'Przewodnik po HTTP',
        descripcion: 'Kody stanu i metody, z wyszukiwaniem i przykładami.',
      },
      guiaGit: {
        nombre: 'Przewodnik po Git i GitHub',
        descripcion: 'Polecenia i procesy pracy, z laboratorium do bezpiecznych ćwiczeń.',
      },
      limpiezaDisco: {
        nombre: 'Czyszczenie dysku',
        descripcion:
          'Analizuje i usuwa pliki tymczasowe oraz odtwarzalne pamięci podręczne, z podglądem i potwierdzeniem.',
      },
      editor: {
        nombre: 'Edytor kodu',
        descripcion:
          'Edytuje pliki tekstowe z podświetlaniem składni, kopią zapasową i potwierdzanym zapisem.',
      },
      compartir: {
        nombre: 'Udostępnij folder lub plik',
        descripcion: 'Publikuje folder lub plik w internecie tymczasowym linkiem tylko do odczytu.',
      },
      miRed: {
        nombre: 'Moja sieć',
        descripcion:
          'Foldery udostępniane przez ten komputer, urządzenia w sieci lokalnej i test szybkości. Bez zdalnego sterowania.',
      },
      usoDisco: {
        nombre: 'Użycie dysku',
        descripcion:
          'Co zajmuje miejsce na dysku lub w folderze: drzewo, największe pliki i foldery, według rozszerzeń.',
      },
      diffCarpetas: {
        nombre: 'Porównanie folderów',
        descripcion:
          'Porównuje dwa foldery: tylko w jednym, tylko w drugim i różniące się, z różnicami każdego pliku.',
      },
      grabarPantalla: {
        nombre: 'Nagrywanie ekranu',
        descripcion: 'Otwiera nagrywarkę, którą system już zawiera.',
      },
    },
    secciones: {
      codigo: 'Kod',
      red: 'Sieć',
      seguridad: 'Bezpieczeństwo',
      archivos: 'Pliki i multimedia',
      sistema: 'System',
    },
    tarjetas: {
      comparar: {
        nombre: 'Porównaj',
        descripcion: 'Teksty i foldery: różnice obok siebie.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'Z tekstu lub linku albo aby inni mogli dołączyć do sieci Wi-Fi.',
      },
      guias: {
        nombre: 'Przewodniki',
        descripcion: 'HTTP, tunele i Git, z przykładami i poleceniami do skopiowania.',
      },
    },
    pestanas: {
      diff: 'Teksty',
      diffCarpetas: 'Foldery',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Tunele',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev nie ma własnej nagrywarki: otwiera tę, którą system już zawiera. Wideo zapisuje się tam, gdzie zapisuje je to narzędzie.',
      abrir: 'Otwórz nagrywarkę',
      abierta: 'Otwarto Narzędzie do wycinania. Należy wybrać obszar ekranu i nacisnąć Rozpocznij.',
      noSePudo:
        'Nie udało się stąd otworzyć Narzędzia do wycinania. Należy użyć jednego ze skrótów z przewodnika.',
      guiaTitulo: 'Jak nagrywać w systemie',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Należy nacisnąć Win + Shift + R, aby nagrywać Narzędziem do wycinania.',
            'Jeśli Narzędzie do wycinania nie jest aktualne, należy nacisnąć Win + Alt + R, aby nagrywać paskiem gier Xbox.',
            'Należy zatrzymać nagrywanie przyciskiem na pasku, który pojawi się u góry.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Należy nacisnąć Cmd + Shift + 5, aby otworzyć pasek przechwytywania.',
            'Należy wybrać nagrywanie całego ekranu lub zaznaczonego fragmentu.',
            'Należy nacisnąć Nagraj, a aby zakończyć — przycisk zatrzymania na pasku menu.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'Każde środowisko graficzne ma nagrywarkę: w GNOME Ctrl + Alt + Shift + R, w KDE Spectacle.',
            'Jeśli żadna nie jest dostępna, należy zainstalować OBS Studio lub SimpleScreenRecorder z menedżera pakietów.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle: string | null) =>
        detalle ? `Nieprawidłowe wyrażenie: ${detalle}` : 'Nieprawidłowe wyrażenie.',
      regexDetalle: {
        corchete: 'nawias „[” nie jest zamknięty.',
        parentesis: 'nawias „(” nie jest zamknięty.',
        parentesisSobra: 'nawias zamykający „)” nie ma otwierającego.',
        nadaQueRepetir: 'kwantyfikator („*”, „+”, „?” lub „{}”) nie ma czego powtarzać.',
        barraAlFinal: 'wzorzec nie może kończyć się ukośnikiem odwrotnym.',
        rangoInvertido: 'zakres w klasie znaków jest odwrócony (na przykład „z-a”).',
        cuantificador: 'kwantyfikator „{}” jest niekompletny lub jego liczby są odwrócone.',
        grupo: 'nazwa lub postać grupy jest nieprawidłowa.',
        escape: 'sekwencja ucieczki z ukośnikiem odwrotnym jest nieprawidłowa.',
      },
    },
    busqueda: {
      excluir: 'Pomiń także (oddzielone przecinkami)',
      incluirPesadas: 'Uwzględnij ciężkie foldery (node_modules, vendor, .git…)',
      contexto: 'Wiersze kontekstu',
      grupoNombres: (n: number) => `Według nazwy (${n})`,
      grupoContenido: (n: number) => `Według zawartości (${n})`,
      carpeta: 'folder',
      listaAria: 'Wyniki wyszukiwania',
      atajos:
        '↑ ↓ — przesuwanie, Enter — otwarcie w edytorze, Esc — anulowanie lub powrót do tekstu.',
      sensible: (n: number) =>
        `Plik wrażliwy: dopasowanie w wierszu ${n} (jego zawartość nie jest pokazywana).`,
      mostrarMas: (n: number) => `Pokaż jeszcze ${n}`,
      linea: (n: number) => `wiersz ${n}`,
      sinGrupo: 'Brak wyników w tej grupie.',
      topeBytes: 'Osiągnięto limit odczytu: zawęź wyszukiwanie.',
    },
    compartir: {
      explicacion:
        'Publikuje folder lub plik z tego komputera w internecie tymczasowym linkiem. Tylko do odczytu: każdy, kto ma link, może przeglądać i pobierać, ale nie przesyłać ani niczego zmieniać. Link zawiera tajny kod, wygasa o wybranej porze i zamyka się po zamknięciu WolfCore Dev. Pliki .env, klucze, folder .git i strony z prawdziwymi danymi nigdy nie są udostępniane.',
      eleccion: 'Co udostępnić',
      elegirCarpeta: 'Wybierz folder…',
      elegirArchivo: 'Wybierz plik…',
      elegido: 'Wybrano',
      duracion: 'Zakończ udostępnianie za',
      duraciones: {
        m15: '15 minut',
        h1: '1 godzinę',
        h4: '4 godziny',
      },
      tunel: 'Tunel',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (szybki, bez konta)',
        ngrok: 'ngrok (z tokenem)',
      },
      ngrokSinToken: 'ngrok potrzebuje tokenu: należy zapisać go w opcjach tunelu jakiejś strony.',
      compartir: 'Udostępnij…',
      sinFtp:
        'FTP nie jest udostępniany przez tunel: jest niezaszyfrowany, a tunel przenosi tylko HTTP.',
      vacio: {
        titulo: 'Nic nie jest udostępnione',
        texto:
          'Należy wybrać folder lub plik, aby otrzymać tymczasowy link publiczny. Nic nie jest publikowane, dopóki nie zostanie to potwierdzone.',
      },
      grandes:
        'Pliki tekstowe lub pliki nieznanego typu większe niż 8 MB nie są udostępniane, ponieważ nie da się ich w pełni sprawdzić; obrazy, dźwięk, wideo i pakiety (zip, 7z, gz, pdf) są. Na liście są oznaczone.',
      comprimidos:
        'Plik skompresowany (.zip, .7z, .gz) jest udostępniany takim, jaki jest, bez zaglądania do środka: jeśli zawiera plik .env lub klucze, zostaną opublikowane.',
      confirmar: {
        titulo: 'Udostępnij w internecie',
        pregunta: 'Opublikować to w internecie?',
        rutaReal: 'Rzeczywista ścieżka (dowiązania rozwiązane)',
        ruta: 'Dokładna ścieżka',
        aviso: (dur: string) =>
          `Będzie publicznie dostępne w internecie przez ${dur} od chwili, gdy link będzie gotowy. Każdy, kto ma link, będzie mógł przeglądać i pobierać udostępnione elementy.`,
        boton: 'Udostępnij w internecie',
      },
      abriendo: 'Otwieranie tunelu…',
      activa: 'Udostępnianie',
      enlace: 'Link publiczny',
      copiar: 'Kopiuj link',
      qr: 'Kod QR linku',
      vence: (hasta: string, restan: string) => `Wygasa o ${hasta} (${restan})`,
      restan: (min: number) => (min <= 1 ? 'mniej niż 1 minuta' : `${min} min`),
      dejar: 'Zakończ udostępnianie',
      fin: {
        vencio: 'Czas minął: serwer i tunel zostały zamknięte.',
        tunel: 'Tunel się zamknął i udostępnianie zakończono.',
      },
      registro: {
        titulo: 'Dostępy',
        ayuda: 'Ostatnie 200, tylko w pamięci. Nigdy nie pokazują tajnego kodu linku.',
        vacioTitulo: 'Brak dostępów',
        vacioTexto: 'Za każdym razem, gdy ktoś otworzy link, pojawi się tutaj.',
        col: {
          hora: 'Godzina',
          ip: 'IP',
          ruta: 'Ścieżka',
          codigo: 'Kod',
        },
        sinPermiso: '(bez właściwego kodu)',
      },
    },
    miRed: {
      explicacion:
        'Proszę zobaczyć swoją sieć bez sterowania żadnym urządzeniem: foldery udostępniane przez ten komputer, urządzenia w sieci lokalnej i test szybkości. Aplikacja tylko odczytuje i odpytuje: nie ma zdalnego sterowania, pulpitu zdalnego ani uruchamiania na innych urządzeniach.',
      carpetas: {
        titulo: 'Foldery udostępniane przez ten komputer',
        ayuda:
          'To, co inne urządzenia w sieci mogą otworzyć na tym komputerze. Udziały administracyjne systemu Windows (C$, ADMIN$, IPC$) są ukryte i nie można ich stąd usunąć.',
        mostrarAdministrativas: 'Pokaż udziały administracyjne',
        administrativa: 'Administracyjny',
        col: {
          nombre: 'Nazwa',
          ruta: 'Folder',
          descripcion: 'Opis',
          usuarios: 'Połączenia',
          acciones: 'Akcje',
        },
        dejar: 'Zakończ udostępnianie',
        vacioTitulo: 'Brak udostępnianych folderów',
        vacioTexto: 'Żaden folder tego komputera nie jest udostępniany w sieci.',
        confirmar: {
          titulo: 'Zakończenie udostępniania folderu',
          pregunta: (nombre: string) => `Zakończyć udostępnianie „${nombre}”?`,
          efecto:
            'Inne urządzenia przestaną widzieć ten folder. Jego pliki nie są usuwane ani przenoszone.',
          uac: 'Wymaga to uprawnień administratora: system Windows wyświetli monit Kontroli konta użytkownika (UAC), który trzeba zaakceptować. Jeśli Państwo go anulują lub nie odpowiedzą na czas, nic nie zostanie zmienione.',
          entiendo:
            'Rozumiem, że zostaną wymagane uprawnienia administratora i że folder przestanie być udostępniany.',
          boton: 'Kontynuuj',
        },
        resultado: {
          quitada: (nombre: string) => `Folder „${nombre}” nie jest już udostępniany.`,
          cancelado: 'Monit systemu Windows został anulowany: nic nie zmieniono.',
          tiempo: 'Upłynął czas na zaakceptowanie monitu systemu Windows: nic nie zmieniono.',
        },
      },
      equipos: {
        titulo: 'Urządzenia w sieci lokalnej',
        ayuda:
          'Odczyt korzysta z tablicy ARP tego komputera (urządzeń, z którymi już się komunikował): jest natychmiastowy i nic nie wysyła do sieci.',
        leer: 'Odczytaj sieć',
        redActiva: 'Aktywna sieć',
        perfil: {
          privado: 'sieć prywatna',
          publico: 'sieć publiczna',
          dominio: 'sieć domenowa',
          desconocido: 'nieznany profil',
        },
        publica:
          'W sieciach publicznych inne urządzenia nie są przeszukiwane. Aby zmienić sieć na prywatną w systemie Windows: Ustawienia › Sieć i Internet › Właściwości › Profil sieci.',
        tunel: 'Aktywna sieć to VPN lub tunel, więc inne urządzenia nie są przeszukiwane.',
        ipEsteEquipo: 'IP tego urządzenia',
        perfilDesconocido:
          'Nie udało się sprawdzić, czy sieć jest prywatna, czy publiczna, więc inne urządzenia nie są przeszukiwane.',
        sinRed: 'Brak aktywnej sieci prywatnej do przeszukania.',
        escanear: 'Szukaj urządzeń',
        progreso: (hechos: number, total: number) => `Sprawdzono ${hechos} z ${total} adresów…`,
        escaneoListo: (cantidad: number, red: string) =>
          `Wyszukiwanie w ${red} zakończone: ${cantidad} urządzeń na liście.`,
        escaneoCancelado: (hechos: number, total: number) =>
          `Wyszukiwanie anulowano po sprawdzeniu ${hechos} z ${total} adresów.`,
        vacioTitulo: 'Brak urządzeń do pokazania',
        vacioTexto:
          'Proszę kliknąć „Odczytaj sieć”, aby zobaczyć urządzenia, które ten komputer już zna, bez wysyłania czegokolwiek do sieci. Jeśli już to zrobiono, proszę spróbować „Szukaj urządzeń”.',
        col: {
          ip: 'Adres IP',
          nombre: 'Nazwa',
          mac: 'MAC',
          fabricante: 'Producent',
          ping: 'Ostatni ping',
        },
        ping: 'Wyślij ping',
        verCarpetas: 'Pokaż foldery',
        confirmar: {
          titulo: 'Wyszukiwanie urządzeń w Państwa sieci',
          texto: (red: string, cantidad: number) =>
            `Ping zostanie wysłany pod każdy z ${cantidad} adresów w ${red}, jeden po drugim i z ograniczoną szybkością, aby znaleźć urządzenia.`,
          adaptador: (nombre: string) => `Karta sieciowa: ${nombre}.`,
          limites:
            'Przeszukiwana jest tylko Państwa aktywna sieć prywatna (najwyżej 254 adresy). Nie są testowane porty ani nie ma dostępu do żadnego urządzenia. Można anulować w dowolnej chwili.',
          boton: 'Szukaj urządzeń',
        },
      },
      ping: {
        resultado: (recibidos: number, enviados: number, media: number) =>
          `${recibidos} z ${enviados} odpowiedzi · średnio ${media} ms`,
        sinRespuesta: (enviados: number) => `0 z ${enviados} · brak odpowiedzi`,
      },
      recursos: {
        titulo: (ip: string) => `Foldery udostępniane przez ${ip}`,
        vacio: 'To urządzenie nie udostępnia widocznych folderów.',
        ayuda:
          'Otwierają się w Eksploratorze plików. Jeśli urządzenie prosi o nazwę użytkownika i hasło, prosi o nie system Windows, a nie ta aplikacja.',
        abrir: 'Otwórz',
        fallo: {
          denegado: 'Urządzenie nie pokazuje swoich folderów bez poświadczeń.',
          inaccesible: 'Nie udało się połączyć z urządzeniem.',
          error: 'Nie udało się odpytać folderów tego urządzenia.',
        },
      },
      velocidad: {
        titulo: 'Test szybkości',
        ayuda: (mb: number) =>
          `Mierzy opóźnienie oraz szybkość pobierania i wysyłania Państwa połączenia z internetem. Zużywa około ${mb} MB danych.`,
        medir: 'Zmierz szybkość',
        fases: {
          latencia: 'Pomiar opóźnienia…',
          bajada: 'Pomiar pobierania…',
          subida: 'Pomiar wysyłania…',
        },
        latencia: 'Opóźnienie',
        bajada: 'Pobieranie',
        subida: 'Wysyłanie',
        cancelada: 'Pomiar anulowany: pokazano to, co zmierzono do tej pory.',
        incompleta: 'Jeden z pomiarów osiągnął limit czasu: ta wartość jest przybliżona.',
        confirmar: {
          titulo: 'Pomiar szybkości',
          texto: (bajada: number, subida: number, total: number) =>
            `Zostanie pobranych około ${bajada} MB i wysłanych około ${subida} MB do Cloudflare (speed.cloudflare.com): łącznie około ${total} MB danych. Jeśli połączenie ma limit danych, proszę uwzględnić to zużycie.`,
          privacidad:
            'Żadne Państwa dane nie są wysyłane: wysyłane są same zera. Można anulować w dowolnej chwili.',
          boton: 'Zmierz',
        },
      },
    },
    usoDisco: {
      explicacion:
        'Pokazuje, co zajmuje miejsce na dysku lub w folderze. Odczytuje tylko nazwy i rozmiary (nigdy zawartość), nie podąża za dowiązaniami ani punktami połączenia i działa w osobnym procesie. Niczego nie usuwa, nie przenosi ani nie zmienia.',
      unidades: 'Dyski',
      unidad: (ruta: string, etiqueta: string) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre: string, total: string) => `wolne ${libre} z ${total}`,
      sinUnidades: 'Nie udało się odczytać listy dysków. Można wybrać folder.',
      elegirCarpeta: 'Wybierz folder…',
      analizando: 'Analizowanie…',
      leyendo: 'Odczyt',
      progreso: (archivos: string, carpetas: string, bytes: string) =>
        `plików: ${archivos} · folderów: ${carpetas} · ${bytes}`,
      cancelar: 'Anuluj',
      cancelado: 'Analiza anulowana.',
      resumen: (total: string, archivos: string, carpetas: string) =>
        `${total}; plików: ${archivos}, folderów: ${carpetas}`,
      duracion: (segundos: string) => `Zajęło ${segundos} s.`,
      vistas: {
        arbol: 'Drzewo',
        carpetas: 'Foldery',
        archivos: 'Pliki',
        extensiones: 'Rozszerzenia',
      },
      arbolAyuda:
        'Posortowane według rozmiaru. Pokazano tylko foldery i pliki ważące co najmniej 0,5% całości; reszta jest zsumowana w „Pozostałe”.',
      carpetasAyuda:
        '50 folderów o największej wadze własnej: ile ważą pliki znajdujące się bezpośrednio w nich, bez podfolderów.',
      archivosAyuda: '50 największych plików.',
      extensionesAyuda:
        '20 rozszerzeń zajmujących najwięcej; reszta trafia do „Pozostałe rozszerzenia”.',
      col: {
        nombre: 'Nazwa',
        tamano: 'Rozmiar',
        porcentaje: 'Z całości',
        archivos: 'Pliki',
        ruta: 'Ścieżka',
        extension: 'Rozszerzenie',
      },
      otros: (n: string) => `Pozostałe (małych plików: ${n})`,
      sinExtension: '(bez rozszerzenia)',
      otrasExtensiones: 'Pozostałe rozszerzenia',
      expandir: (nombre: string) => `Rozwiń ${nombre}`,
      contraer: (nombre: string) => `Zwiń ${nombre}`,
      abrir: 'Otwórz w Eksploratorze',
      copiar: 'Kopiuj ścieżkę',
      denegada: 'Nie udało się odczytać',
      avisos: {
        enlaces: (n: number) =>
          `${plural(n, 'dowiązanie lub punkt połączenia nie został prześledzony i liczy się', 'dowiązania lub punkty połączenia nie zostały prześledzone i liczą się', 'dowiązań lub punktów połączenia nie prześledzono i liczą się')} jako 0.`,
        denegados: (n: number) =>
          `${plural(n, 'element nie mógł zostać odczytany', 'elementy nie mogły zostać odczytane', 'elementów nie mogło zostać odczytanych')} (brak uprawnień lub zmiana w trakcie analizy). Bez uprawnień administratora niektórych folderów systemowych nie da się odczytać: to narzędzie ich nie żąda.`,
        enlacesDuros: (n: number) =>
          `${plural(n, 'dodatkowa nazwa', 'dodatkowe nazwy', 'dodatkowych nazw')} plików z twardymi dowiązaniami nie została policzona dwukrotnie.`,
        enlacesDurosIncompleto:
          'Twardych dowiązań było tak wiele, że rejestr się zapełnił: w sumie jakiś plik może być policzony dwa razy.',
        truncado: 'Osiągnięto maksymalną głębokość: niektóre foldery nie zostały policzone.',
        tamanoLogico:
          'Rozmiary są logiczne (to, co zgłasza każdy plik), a nie zajęte miejsce na dysku: pliki OneDrive tylko online, pliki skompresowane i rzadkie mogą się różnić.',
        verEnlaces: 'Pokaż dowiązania, za którymi nie podążono',
      },
      limpieza: {
        titulo: 'Zwolnij miejsce',
        texto:
          'To narzędzie tylko mierzy. Aby usunąć pliki tymczasowe i odtwarzalne pamięci podręczne lub nieużywane wersje usług, należy skorzystać z tego, co już istnieje:',
        temporales: 'Czyszczenie dysku',
        versiones: 'Nieużywane wersje (Usługi)',
      },
      vacio: {
        titulo: 'Brak analizy',
        texto:
          'Należy wybrać dysk lub folder, aby zobaczyć, co zajmuje miejsce. Nic nie jest zmieniane.',
      },
      sinContenido: {
        titulo: 'Nie ma czego liczyć',
        texto: 'Ten folder nie zawiera plików, które można odczytać.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Porównuje dwa foldery, niczego w nich nie zmieniając: co jest tylko w jednym, tylko w drugim i co się różni. Nie podąża za dowiązaniami i działa w osobnym procesie.',
      carpetaA: 'Folder A',
      carpetaB: 'Folder B',
      elegir: 'Wybierz folder',
      sinElegir: 'Nie wybrano',
      comparar: 'Porównaj',
      comparando: 'Porównywanie…',
      cancelar: 'Anuluj',
      cancelada: 'Porównanie anulowane.',
      iguales: 'Oba foldery są takie same.',
      grupoSoloA: 'Tylko w A',
      grupoSoloB: 'Tylko w B',
      grupoDistintos: 'Różne',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'Brak',
      resumen: (a: number, b: number, iguales: number) =>
        `A: plików ${a} · B: plików ${b} · identycznych ${iguales}`,
      truncado: 'Osiągnięto limit (pliki, głębokość lub rozmiar): lista nie jest kompletna.',
      recortado: (mostrados: number, total: number) =>
        `Plików jest więcej, niż pokazano (${mostrados} z ${total}).`,
      sinComparar: (n: number) =>
        `${plural(n, 'duży plik', 'duże pliki', 'dużych plików')} o tym samym rozmiarze nie porównano według zawartości.`,
      omitidos: (n: number) =>
        `${plural(n, 'dowiązanie, punkt połączenia lub element specjalny pominięto', 'dowiązania, punkty połączenia lub elementy specjalne pominięto', 'dowiązań, punktów połączenia lub elementów specjalnych pominięto')}.`,
      motivoTamano: 'inny rozmiar',
      motivoContenido: 'ten sam rozmiar, inna zawartość',
      tamano: (a: string, b: string) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Należy wybrać z listy plik „różny”, aby zobaczyć jego różnicę.',
      soloEnUno: (lado: string) => `Ten plik istnieje tylko w ${lado}.`,
      cargando: 'Odczytywanie plików…',
      binario: 'Pliki są różne, ale nie są tekstowe: różnica nie jest pokazywana.',
      sensible:
        'Plik wrażliwy (.env, klucze lub prawdziwe dane): jest inny, ale jego zawartość nie jest pokazywana. Można go otworzyć w edytorze, który poprosi o wzmocnione potwierdzenie.',
      tope: (kb: number) =>
        `Pliki są różne, ale przekraczają ${kb} KB: różnica tekstowa nie jest pokazywana.`,
      demasiadoDistinto:
        'Pliki różnią się tak bardzo, że różnica wiersz po wierszu nie jest pokazywana.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'mieszane zakończenia wierszy',
        ninguno: 'bez zakończeń wierszy',
      },
      saltosDistintos: (a: string, b: string) =>
        `Zakończenia wierszy: A używa ${a}, a B używa ${b}.`,
      soloSaltos:
        'Tekst wierszy jest taki sam: zmieniają się tylko zakończenia wierszy (także to na końcu pliku) lub BOM.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${plural(agregadas, 'wiersz dodany', 'wiersze dodane', 'wierszy dodanych')}, ${quitadas} usuniętych`,
      truncadoArchivo: 'Pokazano tylko pierwsze wiersze.',
      lineasIguales: (n: number) => `… identycznych wierszy: ${n} …`,
      abrirA: 'Otwórz A w edytorze',
      abrirB: 'Otwórz B w edytorze',
      atajos: '↑ ↓ — przesuwanie, Enter — zobacz różnicę, Esc — anulowanie.',
      listaAria: (grupo: string) => `Pliki: ${grupo}`,
      detalleAria: 'Różnice plików',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Sekcje klienta HTTP',
        peticion: 'Żądanie',
        coleccion: 'Kolekcja',
        historial: 'Historia',
        entornos: 'Środowiska',
      },
      entorno: 'Środowisko',
      sinEntorno: 'Bez środowiska',
      metodo: 'Metoda',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path lub {{base}}/path',
      enviar: 'Wyślij',
      enviarAtajo: 'Wyślij (Ctrl+Enter)',
      cancelar: 'Anuluj',
      nueva: 'Nowe',
      guardar: 'Zapisz w kolekcji',
      nombre: 'Nazwa',
      nombrePlaceholder: 'Nazwa żądania',
      guardada: 'Żądanie zapisane',
      ayudaVariables: 'Należy użyć {{variable}}, aby pobierać wartości z wybranego środowiska.',
      secciones: {
        params: 'Parametry',
        cabeceras: 'Nagłówki',
        cuerpo: 'Treść',
        auth: 'Uwierzytelnianie',
        opciones: 'Opcje',
      },
      par: {
        clave: 'Nazwa',
        valor: 'Wartość',
        agregar: 'Dodaj wiersz',
        quitar: 'Usuń wiersz',
        activa: 'Wiersz włączony',
        falta: 'Brakuje sekretu: należy wpisać go, aby móc wysłać.',
      },
      cuerpo: {
        tipo: 'Typ treści',
        ninguno: 'Brak',
        json: 'JSON',
        form: 'Formularz (urlencoded)',
        multipart: 'Multipart (tylko tekst)',
        raw: 'Surowy tekst',
        tipoContenido: 'Content-Type',
        texto: 'Zawartość',
        multipartAyuda: 'Tylko pola tekstowe: pliki z dysku nie są wysyłane.',
      },
      auth: {
        tipo: 'Typ',
        ninguna: 'Brak',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'Klucz API',
        token: 'Token',
        usuario: 'Użytkownik',
        clave: 'Hasło',
        nombre: 'Nazwa nagłówka lub parametru',
        en: 'Wyślij w',
        cabecera: 'Nagłówku',
        query: 'Ciągu zapytania',
        ayuda:
          'Wartość jest przechowywana zaszyfrowana przez system; kolekcja, historia i środowiska zachowują tylko odwołanie do niej.',
      },
      secreto: {
        guardado: 'Zapisano (zaszyfrowane). Należy wpisać, aby zastąpić.',
        mostrar: 'Pokaż',
        ocultar: 'Ukryj',
        quitar: 'Usuń',
        valor: 'Zapisana wartość',
        porNombre: 'Zostanie zapisana zaszyfrowana, ponieważ nazwa wygląda na sekret.',
      },
      opciones: {
        plazo: 'Limit czasu (sekundy)',
        plazoAyuda: 'Od 1 do 120 sekund.',
        ignorarCert: 'Ignoruj błędy certyfikatu dla tego żądania',
        ignorarAviso:
          'Niebezpieczne: połączenie nie jest już weryfikowane. Dotyczy tylko tego żądania i jego hosta. Strony WolfCore .test są już weryfikowane własnym urzędem certyfikacji.',
        limites:
          'Odpowiedź do 10 MB i najwyżej 10 przekierowań. Bez zapisanych plików cookie i bez proxy systemowego.',
      },
      respuesta: {
        enviando: 'Wysyłanie…',
        estado: 'Status',
        tiempo: 'Czas',
        tamano: 'Rozmiar',
        cuerpo: 'Treść',
        cabeceras: 'Nagłówki',
        redirecciones: 'Przekierowania',
        vacioTitulo: 'Brak odpowiedzi',
        vacioTexto: 'Należy wpisać adres URL i nacisnąć Wyślij. Żądanie wychodzi z WolfCore Dev.',
        binario: (bytes: number, tipo: string) =>
          `Dane binarne, ${bytes} bajtów, typ ${tipo || 'nieznany'}.`,
        sinCuerpo: 'Odpowiedź nie ma treści.',
        truncada: 'Odpowiedź przekroczyła 10 MB: została obcięta i jest niekompletna.',
        parcial: (mostrados: number) => `Pokazano pierwsze ${mostrados} znaków.`,
        sinRedirecciones: 'Nie było przekierowań.',
        salto: (n: number) => `Przeskok ${n}`,
        urlFinal: 'Końcowy URL',
        certIgnorado: 'Błędy certyfikatu zostały zignorowane dla tego żądania.',
        caWolf: 'Zweryfikowano urzędem certyfikacji WolfCore Dev.',
        copiar: 'Kopiuj treść',
        copiado: 'Treść skopiowana',
        formato: 'Sformatowany JSON',
        crudo: 'Tekst oryginalny',
      },
      curl: {
        copiar: 'Kopiuj jako curl',
        incluir: 'Dołącz dane uwierzytelniające',
        incluirAyuda:
          'Bez zaznaczenia wartości tajne wychodzą jako <secreto>. Po zaznaczeniu polecenie zawiera prawdziwe dane uwierzytelniające.',
        copiado: 'Polecenie curl skopiowane',
        importar: 'Importuj curl',
        importarTitulo: 'Importuj polecenie curl',
        importarAyuda:
          'Należy wkleić polecenie curl. Jest czytane tylko jako tekst: nic nie jest uruchamiane. Dane uwierzytelniające trafiają do zaszyfrowanego magazynu.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'Importuj',
        importada: 'Żądanie zaimportowane do kolekcji',
        avisos: {
          opcion_ignorada: (d: string) => `Opcja zignorowana: ${d}`,
          archivo_ignorado: (d: string) => `Pliki z dysku nie są odczytywane: ${d}`,
          inseguro_ignorado:
            '-k/--insecure zignorowano. Jeśli jest potrzebna, należy włączyć ręcznie „Ignoruj błędy certyfikatu”.',
          comando_cortado:
            'Wszystko, co następuje po operatorze powłoki (|, ;, &, >), zostało zignorowane.',
          sin_evaluar:
            'Tekst zawierał $(…), odwrócone apostrofy lub zmienne powłoki: nie są wartościowane i pozostają tekstem.',
          url_sin_esquema: 'Adres URL nie miał schematu: użyto http://.',
          varias_urls: (d: string) => `Zignorowano dodatkowy argument: ${d}`,
          cabecera_invalida: (d: string) => `Zignorowano nieprawidłowy nagłówek: ${d}`,
          secretos_guardados:
            'Zaimportowane dane uwierzytelniające zapisano zaszyfrowane; kolekcja zachowuje tylko odwołanie do nich.',
        },
      },
      coleccion: {
        vacioTitulo: 'Kolekcja jest pusta',
        vacioTexto: 'Należy zapisać żądanie lub zaimportować polecenie curl, aby mieć je pod ręką.',
        abrir: 'Otwórz',
        borrar: 'Usuń',
        borrada: 'Żądanie usunięte',
      },
      historial: {
        vacioTitulo: 'Brak historii',
        vacioTexto:
          'Ostatnie 100 żądań zostaje tutaj, bez danych uwierzytelniających: nagłówki wrażliwe pokazują się jako ***.',
        abrir: 'Otwórz',
        limpiar: 'Wyczyść historię',
        sinRespuesta: 'Brak odpowiedzi',
      },
      entornos: {
        vacioTitulo: 'Brak środowisk',
        vacioTexto:
          'Środowisko definiuje zmienne, takie jak {{base}} czy {{token}}. Oznaczone jako tajne są przechowywane zaszyfrowane.',
        nuevo: 'Nowe środowisko',
        nombre: 'Nazwa środowiska',
        variable: 'Zmienna',
        valor: 'Wartość',
        secreta: 'Tajna',
        agregar: 'Dodaj zmienną',
        quitar: 'Usuń zmienną',
        guardar: 'Zapisz środowisko',
        guardado: 'Środowisko zapisane',
        borrar: 'Usuń środowisko',
        borrado: 'Środowisko usunięte',
        usar: 'Użyj tego środowiska',
        activo: 'Aktywne',
        sinNombre: 'Należy wpisać nazwę środowiska.',
      },
    },
    imagenes: {
      nombreCaptura: 'screenshot',
    },
  },
  doctor: {
    revisiones: {
      discos: 'Kondycja dysków',
    },
    evidencias: {
      disco_modelo: '{modelo} (dysk {numero})',
      disco_estado: 'System Windows zgłasza stan {estado}.',
      disco_operacional: 'Stan operacyjny: {estado}.',
      disco_errores: 'Nieskorygowane błędy: {lectura} odczytu i {escritura} zapisu.',
      disco_prediccion: 'Dysk przewiduje awarię (SMART).',
      disco_desgaste: 'Zużycie {desgaste}% (próg: {umbral}%).',
      disco_temperatura: 'Temperatura {temperatura} °C (limit: {limite} °C).',
      disco_corregidos: 'Skorygowane błędy odczytu wzrosły (łącznie {cantidad}).',
      texto: '{texto}',
      puerto_dueno: 'Port {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Port {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Zarezerwowany zakres {desde}-{hasta} (obejmuje {puerto})',
      ca_vencida: 'Urząd certyfikacji wygasł {dias} dni temu',
      ca_por_vencer: 'Urząd certyfikacji wygasa za {dias} dni',
      certificado_vencido: 'Certyfikat dla {dominio} wygasł {dias} dni temu',
      certificado_por_vencer: 'Certyfikat dla {dominio} wygasa za {dias} dni',
      firefox_perfiles: 'Profile Firefoksa bez zaufania:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (otwarty)',
      firefox_perfil_fuera: '{perfil} (poza folderem Firefoksa)',
      hosts_ilegible: '{ruta}: nie udało się odczytać ({motivo})',
      hosts_codificacion: '{ruta}: kodowanie {codificacion}',
      hosts_bloques: '{ruta}: bloków WolfCore Dev — {bloques}',
      hosts_sin_cierre: '{ruta}: blok WolfCore Dev nie ma znacznika zamykającego',
      hosts_faltan: 'Brakuje w hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: atrybut tylko do odczytu',
      path_repetidas: 'Powtórzone: {entradas}',
      path_delante: '{entrada} występuje przed narzędziami WolfCore Dev i zawiera także {programa}',
      antivirus_sin_leer:
        'Antywirus jest aktywny; nie udało się odczytać jego wykluczeń (potrzebny administrator).',
      antivirus_sin_exclusion:
        'Antywirus jest aktywny, a folder danych WolfCore Dev nie jest wykluczony.',
      enlazador_ausente: 'Nie znaleziono narzędzi C++ z Visual Studio Build Tools.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) nie jest zainstalowany.',
      firewall_no_comprobado:
        'Nie udało się odczytać reguł zapory (może być potrzebny administrator).',
      firewall_reglas: 'WolfCore Dev: {propias} · Pozostałości po testach WolfCore: {pruebas}',
      firewall_acotadas: 'Reguły ograniczone do sieci lokalnej:',
      firewall_ajenas: 'Reguły innych programów:',
      firewall_quitadas: 'Usunięte reguły, które można przywrócić:',
    },
    ver: 'Zobacz',
    verPuertos: 'Zobacz porty',
    dialogo: {
      reglas: 'Dotknięte reguły: należy odznaczyć te, których nie należy ruszać.',
      sinSeleccion: 'Należy zaznaczyć co najmniej jedną regułę, aby kontynuować.',
      reglasNota:
        'Nic się nie zmieni bez potwierdzenia i uprawnienia administratora. Jeśli reguła zmieniła się po pokazaniu, zostanie pominięta.',
    },
    reparaciones: {
      firewall:
        'Usuń te przychodzące reguły zapory, jedna po drugiej, według ich dokładnej nazwy. Najpierw kopia jest zapisywana w chronionym kluczu rejestru HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos, aby można je było utworzyć ponownie. Reguły innych programów nigdy nie są ruszane.',
      firewall_restaurar:
        'Utwórz ponownie zaznaczone reguły z tym samym programem, profilem, protokołem, portami i adresami, które są pokazane, z chronionej kopii (a nie z pliku w etc/). Te programy znów będą mogły przyjmować połączenia sieciowe.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev uruchamia Mavena bezpośrednio z JDK i ze względów bezpieczeństwa nie czyta .mvn/jvm.config ani zmiennej MAVEN_OPTS. Jeśli projekt ich potrzebuje, należy uruchomić Mavena z terminala.',
    avisoRuby:
      'Ruby jest instalowany bez Devkit (MSYS2) i bez ruszania PATH ani rejestru Windows: nie ma instalatora. Gemy z rozszerzeniami natywnymi bez gotowego pliku binarnego wymagają Devkit. To krok ręczny: należy otworzyć terminal z projektu i uruchomić „ridk install” (instaluje MSYS2 na tym komputerze i pobiera dane z internetu).',
    avisoJdk:
      'Maven i Gradle działają z JDK od WolfCore Dev, a żadne nie jest jeszcze zainstalowane. Należy zainstalować Javę (Temurin) z listy usług.',
    avisoMeilisearch:
      'Każda wersja minor Meilisearch ma własne dane. Po przełączeniu na inną wersję minor (na przykład z 1.58 na 1.59), jej indeksy i MEILISEARCH_KEY będą nowe: trzeba będzie ponownie zaindeksować i zaktualizować .env projektów.',
    servicios: {
      meilisearch: 'Meilisearch',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    anteriores: (n: number) => `Wcześniejsze poprawki (${n})`,
  },
  memoria: {
    boton: 'Pamięć',
    tituloBoton: 'Optymalizuj pamięć',
    titulo: 'Optymalizator pamięci',
    intro:
      'Należy wybrać tryb i przejrzeć listę. Nic nie jest zamykane ani zatrzymywane, dopóki nie zostanie to potwierdzone, i nigdy nie działa samo.',
    modo: 'Tryb',
    modos: {
      liviano: 'Lekki',
      moderado: 'Umiarkowany',
      profundo: 'Głęboki',
    },
    descripciones: {
      liviano:
        'Czyści pamięć podręczną aplikacji. Zwalnia miejsce na dysku; niczego nie zamyka ani nie zatrzymuje.',
      moderado:
        'Dodatkowo proponuje pozostawienie jednego procesu roboczego PHP i zatrzymanie usług WolfCore Dev bez aktywności i połączeń. Usługi są początkowo niezaznaczone.',
      profundo:
        'Dodatkowo wyświetla własne programy zużywające dużo pamięci, aby można było poprosić je o zamknięcie okna. Są początkowo niezaznaczone.',
    },
    ver: 'Pokaż listę',
    revisando: 'Sprawdzanie…',
    vacio: 'W tym trybie nie ma nic do zwolnienia.',
    tipos: {
      'cache-app': 'Wyczyść pamięć podręczną',
      'reducir-pool': 'Pozostaw jeden proces roboczy',
      'detener-inactivo': 'Zatrzymaj (bezczynny)',
      'cerrar-programa': 'Poproś o zamknięcie okna',
    },
    caches: {
      sesion: 'Pamięć podręczna HTTP sesji aplikacji',
    },
    estimado: (cantidad: string) => `Zwolnione zostałoby około ${cantidad} pamięci RAM`,
    estimadoDisco: (cantidad: string) =>
      `Plus około ${cantidad} na dysku (pamięć podręczna to nie RAM)`,
    marcadas: (n: number, total: number) => `Zaznaczono ${n} z ${total}`,
    sinDatos:
      'Nie ma jeszcze dość danych o aktywności, aby zaproponować zatrzymanie usług lub zmniejszenie PHP. Należy zostawić Start otwarty na kilka minut i spojrzeć ponownie.',
    listadoFallido:
      'Nie udało się odczytać listy otwartych programów: ta lista może być niekompletna. Należy spróbować ponownie.',
    avisoDetener:
      'Bezczynne usługi są początkowo niezaznaczone: zatrzymanie usługi odcina wszystko, co z niej korzysta. Wymienione są tylko te, które w tej chwili nie mają połączeń.',
    avisoCerrar:
      'Programy są jedynie proszone o zamknięcie okna, jak po kliknięciu X: mogą zapytać, czy zapisać dane. Program nigdy nie jest zamykany siłą ani przerywany.',
    protegidos:
      'Programy systemowe, usługi Windows, programy z podwyższonymi uprawnieniami, inni użytkownicy, FlyEnv, PhpWebStudy i WolfCore Dev (lub cokolwiek, co uruchamiają) nigdy się nie pojawiają.',
    aplicar: 'Zastosuj zaznaczone',
    confirmarTitulo: 'Zastosować te działania?',
    confirmarTexto: (n: number) =>
      n === 1
        ? 'Zostanie wykonane 1 działanie z listy.'
        : `Zostanie wykonanych działań z listy: ${n}.`,
    confirmarCerrar: (nombres: string) =>
      `Te programy zostaną poproszone o zamknięcie okna: ${nombres}.`,
    confirmarDetener: (nombres: string) => `Te usługi zostaną zatrzymane: ${nombres}.`,
    confirmar: 'Tak, zastosuj',
    cancelar: 'Anuluj',
    resultadoTitulo: 'Wynik',
    liberado: (cantidad: string) => `Szacunkowo: zwolniono około ${cantidad} pamięci RAM`,
    liberadoDisco: (cantidad: string) => `Plus około ${cantidad} na dysku`,
    notaPedido:
      'Oczekuje na reakcję: okno poproszono o zamknięcie, a program nadal jest otwarty (może pytać, czy zapisać dane). Nie jest liczone jako zwolnione.',
    estados: {
      hecho: 'Gotowe',
      pedido: 'Oczekuje na reakcję',
      saltado: 'Pominięto',
      error: 'Niepowodzenie',
    },
    motivos: {
      no_en_plan: 'Nie było go na liście',
      protegido: 'To program chroniony',
      cambio: 'Zmienił się od pokazania listy',
      sin_ventana: 'Nie ma już okna do zamknięcia',
      ya_apagado: 'Nie było już nic do zmniejszenia',
      ocupado: 'Był zajęty (ma połączenia)',
      no_se_pudo:
        'Nie udało się wysłać prośby o zamknięcie (program działa z podwyższonymi uprawnieniami)',
    },
    otraVez: 'Zacznij od nowa',
  },
  guias: {
    tuneles: {
      titulo: 'Przewodnik po tunelach',
      copiar: 'Kopiuj polecenie',
    },
    http: {
      buscar: 'Szukaj według numeru, nazwy lub tekstu',
      familia: 'Rodzina',
      todas: 'Wszystkie',
      verMetodos: 'Metody',
      verCodigos: 'Kody stanu',
      resultados: (n: number) => plural(n, 'wynik', 'wyniki', 'wyników'),
      vacio: 'Nic nie pasuje do wyszukiwania.',
      seguro: 'Bezpieczna',
      noSeguro: 'Niebezpieczna',
      idempotente: 'Idempotentna',
      noIdempotente: 'Nieidempotentna',
      noEstandar: 'Niestandardowy',
      broma: 'Kod żartobliwy (RFC 2324)',
      causas: 'Częste przyczyny',
      solucion: 'Jak to naprawić',
      ejemplo: 'Przykład',
      copiarEjemplo: 'Kopiuj przykład',
      probar: 'Wypróbuj',
      probarTitulo:
        'Wypróbuj ten przykład w kliencie HTTP (nic nie jest wysyłane, dopóki nie zostanie naciśnięty Wyślij)',
      servidorActivo: (puerto: number) =>
        `Przykładowy serwer działa pod adresem 127.0.0.1:${puerto}, dopóki używany jest przewodnik lub klient HTTP. Jest dostępny tylko z tego komputera i zatrzymuje się po wyjściu lub po 10 min bez użycia.`,
      sinTraduccion: 'Nieprzetłumaczone na ten język: pokazano po angielsku.',
      familias: {
        '1xx': '1xx Informacyjne',
        '2xx': '2xx Powodzenie',
        '3xx': '3xx Przekierowanie',
        '4xx': '4xx Błąd klienta',
        '5xx': '5xx Błąd serwera',
      },
    },
    git: {
      buscar: 'Szukaj tematu lub polecenia',
      verGuia: 'Przewodnik',
      verLaboratorio: 'Laboratorium',
      todos: 'Wszystkie',
      grupos: {
        basico: 'Podstawy',
        ramas: 'Gałęzie',
        deshacer: 'Cofanie zmian',
        remotos: 'Zdalne repozytoria i tagi',
        github: 'GitHub',
      },
      resultados: (n: number) => plural(n, 'temat', 'tematy', 'tematów'),
      vacio: 'Nic nie pasuje do wyszukiwania.',
      ejemplo: 'Przykład',
      errores: 'Częste błędy',
      copiarEjemplo: 'Kopiuj przykład',
      peligroso: 'Niebezpieczne',
      sinTraduccion: 'Nieprzetłumaczone na ten język: pokazano po angielsku.',
      avisoGithub:
        'Ta część ma charakter wyłącznie objaśniający: WolfCore Dev nie zakłada kont, nie loguje się do GitHuba ani nie używa tokenów z tego przewodnika. Nazwy i wartości w przykładach są zmyślone.',
      irLaboratorio: 'Poćwicz w laboratorium',
      lab: {
        intro:
          'Repozytorium ćwiczeniowe i lokalne „zdalne repozytorium” w folderze należącym do WolfCore Dev. Nie korzysta z internetu ani GitHuba i nie rusza projektów ani ustawień git.',
        sinGit: {
          titulo: 'Git nie jest zainstalowany',
          texto:
            'Laboratorium używa git z systemu i bez niego się nie otworzy. Należy zainstalować Git i ponownie otworzyć tę kartę; WolfCore Dev niczego nie instaluje samodzielnie.',
        },
        cargando: 'Przygotowywanie laboratorium…',
        reiniciar: 'Zresetuj laboratorium',
        reiniciarAyuda: 'Usuwa tylko folder ćwiczeniowy i przywraca go do stanu jak nowy.',
        reiniciado: 'Laboratorium zresetowane.',
        version: (v: string) => `git ${v}`,
        ordenes: 'Polecenia',
        mensaje: 'Komunikat commitu',
        mensajePorDefecto: 'Zmiana ćwiczeniowa',
        rama: 'Gałąź',
        etiqueta: 'Tag',
        archivo: 'Plik',
        grupos: {
          basico: 'Podstawy',
          ramas: 'Gałęzie',
          guardar: 'Zapis i cofanie',
          remoto: 'Lokalne repozytorium zdalne',
        },
        archivos: {
          titulo: 'Pliki ćwiczeniowe',
          ayuda: 'Można edytować tylko te pliki, tekstem do 2000 znaków.',
          guardar: 'Zapisz plik',
          guardado: 'Plik zapisany.',
          areaTexto: (n: string) => `Zawartość ${n}`,
        },
        salida: 'Wynik',
        salidaVacia: 'Należy nacisnąć polecenie, aby zobaczyć tutaj odpowiedź git.',
        codigo: (n: number) => (n === 0 ? 'Zakończono pomyślnie' : `Zakończono z kodem ${n}`),
        truncada: 'Wynik został obcięty.',
        historial: 'Historia',
        historialVacio: 'Nie ma jeszcze commitów: należy uruchomić git init, git add i git commit.',
        conflicto: {
          titulo: 'Ćwiczenie z przewodnikiem: konflikt',
          intro:
            'Dwie gałęzie zmieniają ten sam wiersz. Widać, jak powstaje konflikt i jak go rozwiązać.',
          paso: (n: number, total: number) => `Krok ${n} z ${total}`,
          ejecutar: 'Wykonaj ten krok',
          hecho: 'Gotowe',
          reempezar: 'Zacznij od nowa',
          esperado: 'Git zgłosił konflikt: na tym kroku jest to oczekiwane.',
          elegir: {
            mia: 'Zachowaj ten z main (zielony)',
            otra: 'Zachowaj ten z rama-a (czerwony)',
            ambas: 'Zachowaj oba',
          },
          final: 'Gotowe: konflikt rozwiązano. Można obejrzeć historię.',
          pasos: [
            {
              titulo: 'Przygotuj laboratorium',
              texto:
                'Laboratorium jest resetowane i wykonywany jest pierwszy commit z colores.txt („color: azul”).',
            },
            {
              titulo: 'Zmień wiersz w rama-a',
              texto:
                'Tworzona jest gałąź rama-a, wiersz zmienia się na „color: rojo” i jest commitowany.',
            },
            {
              titulo: 'Zmień ten sam wiersz w main',
              texto: 'Powrót do main, wiersz zmienia się na „color: verde” i jest commitowany.',
            },
            {
              titulo: 'Spróbuj scalenia',
              texto:
                'rama-a jest scalana z main. Git nie wie, który wiersz zachować, i zostawia konflikt.',
            },
            {
              titulo: 'Wybierz wersję',
              texto:
                'Należy wybrać, którą wersję wiersza zachować. colores.txt zawiera teraz znaczniki konfliktu.',
            },
            {
              titulo: 'Potwierdź rozwiązanie',
              texto:
                'colores.txt trafia do poczekalni (add) i wykonywany jest commit kończący scalenie.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `Lekki edytor z podświetlaniem dla plików tekstowych do ${mb} MB. Należy wybrać plik w oknie systemowym; zapis zawsze prosi o potwierdzenie i najpierw zostawia kopię w folderze danych WolfCore Dev.`,
    abrir: 'Otwórz plik…',
    abriendo: 'Otwieranie…',
    guardar: 'Zapisz',
    guardando: 'Zapisywanie…',
    recargar: 'Wczytaj ponownie z dysku',
    vacio: 'Należy otworzyć plik, aby zacząć edycję.',
    sinCambios: 'Bez zmian',
    conCambios: 'Niezapisane zmiany',
    posicion: (linea: number, columna: number) => `Wiersz ${linea}, kolumna ${columna}`,
    areaTexto: (nombre: string) => `Edytor kodu: ${nombre}`,
    salirTeclado: 'Aby opuścić edytor klawiaturą, należy nacisnąć Esc, a potem Tab.',
    guardado: 'Plik zapisany.',
    copiaPrevia: (ruta: string) => `Kopia zapasowa: ${ruta}`,
    cancelar: 'Anuluj',
    enlaceDuro:
      'Ten plik ma na dysku więcej niż jedną nazwę (twarde dowiązanie). Zapis przerywa to powiązanie: pozostałe nazwy zachowają starą zawartość.',
    saltosMixtos: {
      aviso: 'Ten plik miesza różne zakończenia wierszy. Zapis ujednolici je wszystkie do LF.',
      aceptar: 'Zgadzam się na ujednolicenie zakończeń wierszy',
    },
    envGestor: {
      aviso:
        'Pliki .env edytuje się w zmiennych projektu, z ich przepływem obsługi sekretów. Przycisk otwiera .env w katalogu głównym projektu, który może nie być plikiem, który próbowano otworzyć.',
      boton: 'Otwórz .env w katalogu głównym projektu',
    },
    huellaPerdida:
      'Zapisano, ale nie udało się odczytać nowego odcisku: plik został wczytany ponownie.',
    confirmarGuardar: {
      titulo: 'Zapisz zmiany',
      texto: (nombre: string) =>
        `Za chwilę zostanie zapisany plik ${nombre}. Najpierw kopia tego, co jest teraz na dysku, zostaje zapisana w folderze danych WolfCore Dev.`,
      boton: 'Zapisz z kopią zapasową',
    },
    refuerzo: {
      abrirTitulo: 'Plik wrażliwy',
      guardarTitulo: 'Zapis pliku wrażliwego',
      secreto:
        'Ten plik wygląda na zawierający sekrety (klucze prywatne, tokeny lub dane uwierzytelniające). Jego zawartość zostanie pokazana na ekranie.',
      datosReales:
        'Ten plik należy do strony oznaczonej jako zawierająca prawdziwe dane. Błędna zmiana może wpłynąć na prawdziwe informacje.',
      instruccion: (nombre: string) => `Aby kontynuować, należy wpisać nazwę pliku: ${nombre}`,
      etiqueta: 'Nazwa pliku',
      abrirBoton: 'Otwórz mimo to',
      guardarBoton: 'Zapisz mimo to',
    },
    cambioExterno: {
      titulo: 'Plik zmienił się poza edytorem',
      texto:
        'Inny program zmodyfikował go od chwili otwarcia, więc nic nie zapisano. Można wczytać go ponownie (zmiany zostaną utracone) lub nadpisać tym, co jest w edytorze.',
      recargar: 'Wczytaj ponownie i odrzuć moje zmiany',
      sobrescribir: 'Nadpisz…',
      sobrescribirTitulo: 'Nadpisz plik',
      sobrescribirTexto:
        'Zmiany wprowadzone przez inny program zostaną utracone. Jego bieżąca zawartość pozostanie w kopii zapasowej.',
      sobrescribirBoton: 'Tak, nadpisz',
      volver: 'Wróć',
    },
    descartar: {
      titulo: 'Niezapisane zmiany',
      texto: 'W edytorze są niezapisane zmiany. Kontynuowanie spowoduje ich utratę.',
      confirmar: 'Odrzuć zmiany',
      seguir: 'Kontynuuj edycję',
    },
    cm: {
      'Control character': 'Znak sterujący',
      'Selection deleted': 'Zaznaczenie usunięte',
      'Go to line': 'Przejdź do wiersza',
      go: 'przejdź',
      Find: 'Znajdź',
      Replace: 'Zamień',
      next: 'dalej',
      previous: 'wstecz',
      all: 'wszystkie',
      'match case': 'rozróżniaj wielkość liter',
      regexp: 'regexp',
      'by word': 'według słowa',
      replace: 'zamień',
      'replace all': 'zamień wszystkie',
      close: 'zamknij',
      'current match': 'bieżące dopasowanie',
      'on line': 'w wierszu',
      'replaced match on line $': 'zamieniono dopasowanie w wierszu $',
      'replaced $ matches': 'zamieniono dopasowań: $',
      'folded code': 'zwinięty kod',
      unfold: 'rozwiń',
      to: 'do',
    },
  },
  limpiezaDisco: {
    intro:
      'Najpierw analizuje i pokazuje, ile zajmuje każda pozycja. Nic nie jest usuwane, dopóki nie zostanie to potwierdzone, i nigdy nie działa samo ani w tle.',
    analizar: 'Analizuj',
    analizando: 'Analizowanie…',
    cancelarAnalisis: 'Anuluj',
    vacio: 'Nie ma nic do wyczyszczenia.',
    categorias: {
      temp: {
        nombre: 'Pliki tymczasowe',
        ayuda:
          'Pliki w folderze TEMP starsze niż 24 godziny. Usuwane na stałe; tworzą się ponownie same.',
      },
      'cache-chrome': {
        nombre: 'Pamięć podręczna Google Chrome',
        ayuda:
          'Tylko foldery pamięci podręcznej każdego profilu; nigdy pliki cookie, hasła ani historia.',
      },
      'cache-edge': {
        nombre: 'Pamięć podręczna Microsoft Edge',
        ayuda:
          'Tylko foldery pamięci podręcznej każdego profilu; nigdy pliki cookie, hasła ani historia.',
      },
      'cache-brave': {
        nombre: 'Pamięć podręczna Brave',
        ayuda:
          'Tylko foldery pamięci podręcznej każdego profilu; nigdy pliki cookie, hasła ani historia.',
      },
      'cache-firefox': {
        nombre: 'Pamięć podręczna Firefoksa',
        ayuda: 'Tylko folder cache2 każdego profilu; nigdy pliki cookie, hasła ani historia.',
      },
      'wolfcore-descargas': {
        nombre: 'Pobrane pliki w pamięci podręcznej WolfCore Dev',
        ayuda: 'Luźne archiwa, które nie są już używane. Przenoszone do kosza.',
      },
      'wolfcore-registros': {
        nombre: 'Dzienniki WolfCore Dev',
        ayuda: 'Dzienniki starsze niż 30 dni. Przenoszone do kosza.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          'Opcjonalne. Windows tworzy go ponownie, ale wymaga to uruchomienia WolfCore Dev jako administrator.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Przeglądarka jest otwarta lub działa w tle: zamknij ją całkowicie, aby wyczyścić jej pamięć podręczną (w Edge wyłącz też przyspieszone uruchamianie i rozszerzenia w tle)',
      'requiere-admin': 'Wymaga uruchomienia WolfCore Dev jako administrator',
      'ruta-vetada': 'Ścieżka chroniona: nie jest czyszczona',
      'temp-no-seguro':
        'Zmienna TEMP wskazuje folder, który nie jest tymczasowym folderem użytkownika (Dokumenty, cały dysk, ścieżka sieciowa…): nie jest czyszczona',
    },
    borradoDefinitivo: 'Usuwane na stałe (tworzą się ponownie same)',
    borradoPapelera: 'Przenoszone do kosza systemowego',
    archivos: (n: number) => plural(n, 'plik', 'pliki', 'plików'),
    carpetas: 'Według folderów',
    truncado: 'Analiza zatrzymała się na limicie plików: jest ich więcej, niż pokazano.',
    marcadas: (n: number, t: number) => `Wybrano kategorii: ${n} z ${t}`,
    total: (b: string) => `Zwolnione zostałoby około ${b}`,
    limpiar: 'Wyczyść zaznaczone',
    confirmarTitulo: 'Wyczyścić te kategorie?',
    confirmarTexto: (n: number) => `Zostanie wyczyszczonych kategorii: ${n}.`,
    confirmarDefinitivo: 'TEMP i pamięci podręczne są usuwane na stałe (tworzą się ponownie same).',
    confirmarPapelera: 'Dzienniki i pobrane pliki WolfCore Dev trafiają do kosza.',
    confirmarPrefetch:
      'Prefetch: Windows tworzy go ponownie, ale pierwsze uruchomienia programów mogą być nieco wolniejsze.',
    confirmar: 'Tak, wyczyść',
    cancelar: 'Anuluj',
    detener: 'Zatrzymaj czyszczenie',
    resultadoTitulo: 'Wynik',
    liberado: (b: string) => `Zwolniono: ${b}`,
    enPapelera: (b: string) =>
      `Z tego ${b} znajduje się w koszu (miejsce wróci po jego opróżnieniu).`,
    saltados: (n: number) => `Pominięto plików: ${n}`,
    cancelado: 'Czyszczenie anulowane: to, co już usunięto, pozostaje usunięte.',
    topeEjecucion:
      'Osiągnięto limit plików na jedno uruchomienie: aby kontynuować, należy ponownie przeanalizować i wyczyścić.',
    registroFallido:
      'Nie udało się już zapisywać dziennika czyszczenia, więc czyszczenie zatrzymano: to, co usunięto, jest zapisane w dzienniku do tego momentu.',
    motivos: {
      'en-uso': 'W użyciu',
      enlace: 'Dowiązanie lub punkt ponownej analizy (nie jest śledzony)',
      protegido: 'Chronione (.env, FlyEnv lub podobne)',
      cambio: 'Zmieniło się od analizy',
      'sin-papelera': 'Kosz niedostępny',
      ilegible: 'Nie udało się odczytać',
      error: 'Błąd podczas usuwania',
    },
    verRegistros: 'Zobacz dzienniki',
    registroEn: (r: string) => `Dziennik tego czyszczenia: ${r}`,
    otraVez: 'Zacznij od nowa',
    protegidas:
      'Nigdy nie są ruszane: dane, kopie zapasowe, projekty, bazy danych ani pliki .env. Dowiązania nie są śledzone i nic poza ścieżkami z tej listy nie jest ruszane.',
  },
  preferencias: {
    asistente: 'Wycieczka powitalna',
    asistenteAyuda:
      'Obejrzyj ponownie wycieczkę po głównych ekranach: usługi, projekty, bazy danych, narzędzia i Doctor.',
    asistenteAbrir: 'Obejrzyj wycieczkę',
    avanzadas: 'Pokaż sekcje zaawansowane',
    avanzadasAyuda:
      'Dodaje do paska bocznego rzadko używane ekrany, takie jak Kontenery. Są też dostępne przez Ctrl+K.',
    animacionInicio: 'Animacja startowa',
    animacionInicioAyuda:
      'Rysuje logo świecącą kreską po otwarciu aplikacji. Można ją pominąć kliknięciem lub klawiszem Esc. Jeśli system Windows wymaga ograniczenia ruchu, pojawi się tylko krótkie wygaszenie.',
  },
  paleta: {
    irAServicio: (nombre: string) => `Przejdź do usługi ${nombre}`,
    irAProyecto: (nombre: string) => `Przejdź do projektu ${nombre}`,
    versionesDe: (nombre: string) => `Wersje ${nombre}`,
    asistente: 'Obejrzyj wycieczkę powitalną',
  },
  env: {
    bloques: {
      meilisearch: 'Meilisearch (z kluczem)',
    },
  },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Brak jeszcze silnika baz danych',
      texto:
        'Należy zainstalować MySQL, MariaDB, PostgreSQL lub MongoDB w Usługach, aby tworzyć bazy danych swoich projektów i nimi zarządzać.',
      accion: 'Przejdź do Usług',
    },
    serviciosVacio: {
      titulo: 'Nie zainstalowano jeszcze żadnych usług',
      texto:
        'Usługi (Nginx, PHP, bazy danych…) sprawiają, że strony działają. Należy zacząć od Nginx i PHP lub od bazy danych.',
      accion: 'Zainstaluj usługę',
    },
    registrosSinFuentes: {
      titulo: 'Brak dzienników',
      texto:
        'Dzienniki pojawiają się, gdy tylko usługa, strona lub proces zapisze pierwszy wiersz. Należy włączyć usługę i wrócić.',
      accion: 'Przejdź do Usług',
    },
    registrosElegir: {
      titulo: 'Wybierz dziennik',
      texto: 'Należy wybrać źródło w selektorze powyżej, aby śledzić jego wiersze na żywo.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Nie nadeszły jeszcze żadne zrzuty',
      texto:
        'Gdy strona wykonuje dump(), dd() lub wd(), zrzut pojawia się tutaj natychmiast. Należy otworzyć swoją stronę i uruchomić ten kod.',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Przechwytywanie jest wyłączone',
      texto:
        'Przy włączonym przechwytywaniu wywołania dump() i dd() stron trafiają tutaj bez ruszania przeglądarki. Należy włączyć je i uruchomić stronę.',
      accion: 'Włącz przechwytywanie',
    },
    depuracionElegir: {
      titulo: 'Wybierz zrzut',
      texto: 'Należy wybrać zrzut z listy, aby zobaczyć jego zawartość, plik i źródłowy adres URL.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Brak błędów w dziennikach',
      texto:
        'Błędy PHP, Nginx i projektów pojawiają się tutaj pogrupowane, gdy tylko zostaną zapisane. Pusta lista to dobra wiadomość.',
      accion: '',
    },
    erroresElegir: {
      titulo: 'Wybierz błąd',
      texto: 'Należy wybrać błąd z listy, aby zobaczyć jego ślad i otworzyć plik w edytorze.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Nie uruchomiono jeszcze żadnej kontroli',
      texto:
        'Doctor sprawdza porty, hosts, certyfikaty i wersje oraz podpowiada, jak naprawić to, co nie działa. Należy uruchomić pierwszą kontrolę.',
      accion: 'Sprawdź teraz',
    },
    doctorSinHallazgos: {
      titulo: 'Wszystko w porządku',
      texto:
        'Ostatnia kontrola nie wykryła problemów. Należy sprawdzić ponownie, jeśli coś przestanie odpowiadać.',
      accion: 'Sprawdź ponownie',
    },
    contenedoresVacio: {
      titulo: 'Brak kontenerów',
      texto:
        'Kontenery Docker lub Podman z tego komputera pojawiają się tutaj. Należy utworzyć kontener poleceniem docker run lub docker compose i nacisnąć Odśwież.',
      accion: 'Odśwież',
    },
    avisos: {
      titulo: 'Brak powiadomień',
      texto: 'Tutaj pojawią się awarie usług, zajęte porty i wygasające certyfikaty.',
      accion: '',
    },
    instantaneas: {
      titulo: 'Brak migawek',
      texto:
        'Migawka zapisuje stan tej bazy danych, aby można było do niego wrócić, jeśli coś pójdzie nie tak. Pierwszą można utworzyć przyciskiem powyżej.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'Ten serwer nie ma własnych baz danych',
      texto: 'Należy utworzyć bazę danych dla swojego projektu lub zaimportować istniejący zrzut.',
      accion: 'Utwórz bazę danych',
    },
    iaNube: {
      titulo: 'Brak dostawców AI',
      texto:
        'Dostawca (OpenAI, Anthropic, OpenRouter i inni) pozwala agentom korzystać z modeli w chmurze. Klucz jest przechowywany zaszyfrowany na tym komputerze.',
      accion: 'Dodaj dostawcę',
    },
    iaSinModelos: {
      titulo: 'Brak modeli lokalnych',
      texto: 'Należy pobrać model z listy poniżej, aby używać go offline.',
      accion: '',
    },
    versiones: {
      titulo: 'Brak wersji do pokazania',
      texto:
        'Lista jest pobierana z oficjalnego katalogu. Należy sprawdzić połączenie i odświeżyć listę.',
      accion: 'Odśwież listę',
    },
    buscar: {
      titulo: 'Brak dopasowań',
      texto:
        'Nic w folderze nie pasuje do wyszukiwania. Należy spróbować innych słów, odznaczyć „Rozróżniaj wielkość liter” lub sprawdzić filtry plików.',
      accion: '',
    },
  },
  asistenteInicio: {
    animacionNota:
      'Jeśli nie chcą Państwo animacji logo przy otwarciu, można ją wyłączyć w Ustawienia › Wygląd.',
    titulo: 'Wycieczka powitalna',
    saltar: 'Pomiń',
    terminar: 'Zaczynamy',
    cerrar: 'Zamknij wycieczkę',
    reabrir: 'Należy nacisnąć Esc, aby wyjść. Można ją obejrzeć ponownie w Ustawienia › Wygląd.',
    ir: (destino: string) => `Przejdź: ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Witamy w WolfCore Dev',
        texto:
          'Lokalne środowisko programistyczne w jednym oknie: usługi, strony .test z HTTPS, bazy danych, poczta i narzędzia. Wycieczka trwa minutę i niczego nie zmienia na tym komputerze.',
      },
      servicios: {
        titulo: 'Usługi',
        texto:
          'Tutaj przełącznikiem włącza się Nginx, PHP i bazy danych. Jeśli nie są jeszcze zainstalowane, karta Wersje pobierze je ze zweryfikowaną sumą kontrolną.',
      },
      proyectos: {
        titulo: 'Projekty',
        texto:
          'Należy utworzyć nowy projekt lub zaimportować folder albo repozytorium. Każda strona dostaje własny adres .test z HTTPS.',
      },
      bases: {
        titulo: 'Bazy danych',
        texto:
          'Tworzenie baz danych, import i eksport zrzutów oraz kopie zapasowe i ich przywracanie bez wychodzenia z aplikacji.',
      },
      herramientas: {
        titulo: 'Narzędzia i Ctrl+K',
        texto:
          'Edytor, wyszukiwanie, porównywanie, hasła, obrazy i więcej, pogrupowane według sekcji. Należy nacisnąć Ctrl+K na dowolnym ekranie, aby przejść do tego, czego potrzebujesz.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Sprawdza porty, hosts, certyfikaty i wersje oraz podpowiada, jak naprawić to, co nie działa. Należy otworzyć go, gdy coś nie odpowiada.',
      },
      listo: {
        titulo: 'Wszystko gotowe',
        texto:
          'Należy zacząć od włączenia usługi lub utworzenia pierwszego projektu. Tę wycieczkę można obejrzeć ponownie w Ustawienia › Wygląd.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v: string) =>
          `Nie ma jej już w katalogu: zamiast niej zostanie zainstalowana ${v}.`,
      },
      resultado: {
        sustituida: (v: string) => `Zamiast wersji z profilu zainstalowano ${v}.`,
      },
    },
    motivos: {
      version_sustituida:
        'Tej wersji nie ma już w katalogu: zainstalowano najnowszą z tej samej wersji minor (na przykład 8.3).',
    },
  },
  consultasLentas: {
    boton: 'Wolne zapytania',
    titulo: (motor: string) => `Wolne zapytania w ${motor}`,
    descripcion: 'Zapytania trwające dłużej niż wybrany czas, od najwolniejszego do najszybszego.',
    cargando: 'Wczytywanie wolnych zapytań…',
    estadoTitulo: 'Stan dziennika',
    estadoActivo: (s: string) =>
      `Rejestrowanie jest włączone: zapytania dłuższe niż ${s} s są zapisywane.`,
    estadoApagado: 'Rejestrowanie jest wyłączone.',
    noGestionada:
      'WolfCore Dev nie zarządza tym serwerem (na przykład uruchomionym przez inny program): tutaj można go tylko przeglądać, nie zmieniać.',
    umbral: 'Zapisuj zapytania dłuższe niż (sekundy)',
    activar: 'Włącz rejestrowanie',
    aplicarUmbral: 'Zmień czas',
    desactivar: 'Wyłącz rejestrowanie',
    actualizar: 'Odczytaj dziennik ponownie',
    confirmarTitulo: 'Zmień rejestrowanie wolnych zapytań',
    confirmarActivar: (motor: string, s: string) =>
      `Rejestrowanie zostanie włączone dla całego serwera ${motor} (zapytania dłuższe niż ${s} s) i zapisane w jego konfiguracji. Dotyczy wszystkich jego baz danych.`,
    confirmarDesactivar: (motor: string) =>
      `Rejestrowanie zostanie wyłączone dla całego serwera ${motor} i zapisane w jego konfiguracji. To, co już zapisano, zostaje zachowane.`,
    confirmarBoton: 'Potwierdź zmianę',
    cancelar: 'Anuluj',
    activado: 'Rejestrowanie wolnych zapytań włączone',
    desactivado: 'Rejestrowanie wolnych zapytań wyłączone',
    privacidad:
      'SQL jest pokazywany z wartościami zastąpionymi przez „?”, ponieważ może zawierać prawdziwe dane klientów. Nic z tego nie opuszcza tego komputera ani nie jest zapisywane w dziennikach aplikacji.',
    columnas: {
      duracion: 'Czas trwania',
      filas: 'Przejrzane wiersze',
      base: 'Baza danych',
      fecha: 'Data',
      sql: 'Zapytanie',
      acciones: 'Działania',
    },
    sinBase: 'Nieprzypisane',
    verLiteral: 'Pokaż dosłownie',
    ocultarLiteral: 'Ukryj wartości',
    literalAviso: 'SQL taki, jaki jest, z wartościami',
    sqlOculto: 'SQL ukryty',
    sqlOcultoAyuda:
      'Tego zapytania nie można pokazać bez ryzyka dla prawdziwych danych: ten serwer ma bazy danych z prawdziwymi danymi lub zapytania nie da się bezpiecznie przypisać do bazy danych.',
    copiar: 'Kopiuj',
    copiado: 'Zapytanie skopiowane',
    truncado: (n: number) =>
      `Pokazano co najwyżej ${n} najwolniejszych zapytań z końca dziennika (ostatnie 5 MB).`,
    vacioTitulo: 'Nie zapisano jeszcze wolnych zapytań',
    vacioTextoApagado:
      'Należy włączyć rejestrowanie i korzystać ze swoich stron: zapytania trwające dłużej niż wybrany czas pojawią się tutaj.',
    vacioTextoActivo:
      'Jak dotąd żadne zapytanie nie przekroczyło wybranego czasu. Należy korzystać ze stron i ponownie odczytać dziennik.',
  },
  esquemaBd: {
    boton: 'Zobacz schemat',
    titulo: (base: string) => `Schemat ${base}`,
    descripcion:
      'Tylko do odczytu: tabele, kolumny, klucze i relacje. Dane z tabel nie są odczytywane.',
    cargando: 'Odczytywanie schematu…',
    error: 'Nie udało się odczytać schematu bazy danych.',
    reintentar: 'Spróbuj ponownie',
    buscar: 'Szukaj tabeli',
    tablas: (n: number) => plural(n, 'tabela', 'tabele', 'tabel'),
    vista: 'widok',
    truncado: (n: number) => `Listę obcięto do ${n} tabel: baza danych ma ich więcej.`,
    sinResultados: 'Żadna tabela nie pasuje do wyszukiwania.',
    elegir: 'Należy wybrać tabelę z listy, aby zobaczyć jej kolumny, klucze i relacje.',
    columnas: 'Kolumny',
    indices: 'Indeksy',
    sinIndices: 'Ta tabela nie ma indeksów.',
    relaciones: 'Relacje',
    sinRelaciones: 'Ta tabela nie ma relacji z innymi.',
    salientes: 'Odwołuje się do',
    entrantes: 'Odwołują się do niej',
    alBorrar: 'Przy usuwaniu:',
    alActualizar: 'Przy aktualizacji:',
    irA: (tabla: string) => `Przejdź do tabeli ${tabla}`,
    col: {
      nombre: 'Kolumna',
      tipo: 'Typ',
      nulo: 'Dopuszcza NULL',
      defecto: 'Domyślnie',
      clave: 'Klucz',
    },
    si: 'Tak',
    no: 'Nie',
    pk: 'PK',
    unico: 'unikalny',
    vacioTitulo: 'Ta baza danych nie ma tabel',
    vacioTexto: 'Po utworzeniu tabel (na przykład migracjami swojego projektu), pojawią się tutaj.',
  },
  sitios: {
    tipos: {
      rails: 'Rails (port lokalny)',
      springboot: 'Spring Boot (port lokalny)',
      aspnet: 'ASP.NET Core (port lokalny)',
    },
    tiposCortos: {
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    },
  },
  asistentes: {
    pestana: 'Połącz asystentów',
    explicacion:
      'Po połączeniu asystent AI (Claude, Codex…) może przeglądać usługi WolfCore Dev i nimi zarządzać; każda wrażliwa operacja zawsze wymaga potwierdzenia.',
    alcance:
      'WolfCore Dev dodaje lub usuwa tylko własny wpis „wolfcore” w konfiguracji każdego programu, wcześniej zapisuje kopię z datą i nigdy nie zapisuje tokenu w tych plikach.',
    notaVariable:
      'Aby działało, proszę otworzyć asystenta z poziomu WolfCore Dev (AI › Agenci › „Otwórz w projekcie”).',
    recargar: 'Wykryj ponownie',
    conectado: 'Połączony: proszę otworzyć go z WolfCore Dev (AI › Agenci)',
    conectadoAppGrafica: 'Proszę otworzyć go z WolfCore Dev (AI › Agenci), aby mógł się połączyć',
    noSePudoLeer: 'Nie można odczytać',
    instalado: 'Zainstalowany, niepołączony',
    noInstalado: 'Niezainstalowany',
    noCompatible: 'Jeszcze nieobsługiwany',
    motivoLocales:
      'Wymagałoby to zapisania tokenu jawnym tekstem; pojawi się razem z bezpiecznym pośrednikiem.',
    motivoAppGrafica:
      'To aplikacja graficzna, a AI › Agenci nie potrafi jeszcze otworzyć jej z tokenem: „Połącz” pozostaje wyłączone, dopóki nie będzie to możliwe.',
    motivoIlegible: {
      invalido:
        'Jego konfiguracja jest nieprawidłowa; WolfCore Dev jej nie rusza. Proszę ją poprawić lub przywrócić z kopii.',
      demasiado_grande:
        'Plik przekracza 5 MB i nie wygląda na konfigurację; WolfCore Dev go nie rusza.',
      sin_acceso: 'Nie udało się otworzyć pliku (uprawnienia lub to nie jest zwykły plik).',
    },
    conectar: 'Połącz',
    quitar: 'Usuń',
    copiar: 'Kopiuj konfigurację',
    carpeta: 'Otwórz folder konfiguracji',
    archivo: 'Plik konfiguracji',
    cambios: 'To zmieni się w pliku:',
    omitidas: (n: number) => `… ${n} niezmienionych wierszy …`,
    titulo: (n: string) => `Połącz ${n}`,
    tituloQuitar: (n: string) => `Usuń połączenie z ${n}`,
    aceptarConectar: 'Połącz',
    aceptarQuitar: 'Usuń połączenie',
    preparando: 'Przygotowywanie podglądu…',
    archivoNuevo: 'Plik jeszcze nie istnieje: zostanie utworzony.',
    sinCambios: 'Nie ma nic do zmiany: już tak jest.',
    copiaPrevia:
      'Przed zapisem obok pliku zapisywana jest kopia z datą (zachowywanych jest ostatnich 5).',
    comentarios:
      'Uwaga: komentarze wewnątrz wpisu „wolfcore” zostaną utracone. Reszta pliku się nie zmienia.',
    finalesMezclados:
      'Uwaga: plik miesza zakończenia wierszy (CRLF i LF), a ponieważ jest zapisywany w całości, zostaną ujednolicone.',
    hConectado: (n: string) => `${n} połączony.`,
    hQuitado: (n: string) => `Usunięto połączenie z ${n}.`,
    hSinCambios: 'Nic się nie zmieniło.',
    hCopia: (n: string) => `Zapisano kopię: ${n}`,
    hTokenEscrito:
      'Plik zawierał token jawnym tekstem: kopia go ukrywa, a plik już go nie zawiera.',
    hTokenSigue: (donde: string) =>
      `Token nadal jest zapisany jawnym tekstem w innym miejscu pliku („${donde}”) i nie został ruszony: proszę usunąć go ręcznie. Poprzednia kopia przechowuje go zamaskowany (***).`,
    hCopiada: 'Skopiowano konfigurację (bez tokenu).',
  },
};
