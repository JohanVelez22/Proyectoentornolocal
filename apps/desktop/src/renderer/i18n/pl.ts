/**
 * Teksty interfejsu po polsku (pl-PL). Te same klucze i sygnatury funkcji co w es.ts.
 * Stały słownik: usługa, instancja, strona, tunel, kopia zapasowa, powiadomienie; Doctor i
 * WolfCore Dev nie są tłumaczone. Ton formalny i neutralny; poza Git zawsze „wersja”.
 */
import type { Textos } from './es';

const prPl = new Intl.PluralRules('pl');
const plural = (n: number, one: string, few: string, many: string): string => {
  const cat = prPl.select(n);
  return `${n} ${cat === 'one' ? one : cat === 'few' ? few : many}`;
};

export const pl: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP i Nginx bez komplikacji',
    version: 'Wersja',
  },
  nav: {
    inicio: 'Start',
    proyectos: 'Projekty',
    agentes: 'Agenci',
    servicios: 'Usługi',
    basesDeDatos: 'Bazy danych',
    correo: 'Poczta',
    php: 'PHP',
    ia: 'AI',
    tuneles: 'Tunele',
    contenedores: 'Kontenery',
    herramientas: 'Narzędzia',
    doctor: 'Doctor',
    depuracion: 'Debugowanie',
    registros: 'Logi',
    ajustes: 'Ustawienia',
    contraer: 'Zwiń menu',
    expandir: 'Rozwiń menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'uruchomiona usługa', 'uruchomione usługi', 'uruchomionych usług'),
    tuneles: (n: number) => plural(n, 'aktywny tunel', 'aktywne tunele', 'aktywnych tuneli'),
    cargando: 'Łączenie z jądrem…',
    conErrores: 'z błędami',
    sinConexion: 'Brak połączenia z jądrem',
  },
  estado: {
    encendido: 'Uruchomiono',
    apagado: 'Zatrzymano',
    iniciando: 'Uruchamianie…',
    error: 'Błąd',
    externo: 'Zewnętrzna',
    activo: 'Aktywny',
    aviso: 'Uwaga',
  },
  acciones: {
    encender: 'Uruchom',
    apagar: 'Zatrzymaj',
    iniciarTodo: 'Uruchom wszystko',
    detenerTodo: 'Zatrzymaj wszystko',
    abrir: 'Otwórz',
    copiar: 'Kopiuj',
    copiado: 'Skopiowano do schowka',
    guardar: 'Zapisz',
    cerrar: 'Zamknij',
    abrirCarpeta: 'Otwórz folder',
    instalar: 'Zainstaluj',
    reintentar: 'Ponów',
    cancelar: 'Anuluj',
    borrar: 'Usuń',
    editar: 'Edytuj',
    duplicar: 'Duplikuj',
    renovar: 'Odnów',
    masAcciones: 'Więcej akcji',
    actualizar: 'Aktualizuj',
    quitar: 'Usuń',
    reinstalar: 'Zainstaluj ponownie',
  },
  errores: {
    titulo: 'Nie udało się wykonać akcji',
    arranque: 'Nie udało się odczytać stanu środowiska',
    desconocido: 'Wystąpił nieoczekiwany błąd.',
    /** Szczegóły przesyłane przez jądro jako kod wewnątrz błędu. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'niedomknięty cudzysłów',
      'sintaxis.tras_comillas': 'brak spacji lub „;” po cudzysłowie',
      'sintaxis.punto_y_coma_inesperado': '„;” bez dyrektywy',
      'sintaxis.llave_inesperada': '„{” bez dyrektywy',
      'sintaxis.falta_punto_y_coma': 'brak „;” na końcu dyrektywy',
      'sintaxis.sobra_llave': 'nadmiarowy znak „}”',
      'sintaxis.falta_llave': 'brak znaku „}”',
    },
    codigos: {
      'git.cambios_locales':
        'W folderze znajdują się niezapisane zmiany: przed pobraniem zmian należy je zatwierdzić (commit) lub odrzucić. Nic nie zostało zmienione.',
      'git.divergencia':
        'Gałąź rozeszła się ze zdalną (istnieją różne commity lokalne i zdalne): należy rozwiązać konflikt ręcznie. Nic nie zostało zmienione.',
      'git.sin_upstream':
        'Bieżąca gałąź nie śledzi żadnej gałęzi zdalnej: brak źródła do pobrania zmian.',
      'git.sin_rama': 'Repozytorium znajduje się na odłączonym commicie (bez gałęzi): nic nie zostało zmienione.',
      'git.no_repositorio': 'Ten folder nie jest repozytorium git.',
      'git.destino_no_vacio': 'Folder docelowy nie jest pusty.',
      'git.destino_es_archivo': 'Miejsce docelowe jest plikiem, a nie folderem.',
      'git.no_encontrado': 'Nie znaleziono narzędzia git: należy je najpierw zainstalować.',
      'git.gh_no_encontrado': 'Nie znaleziono GitHub CLI (gh): należy je najpierw zainstalować.',
      'git.plazo': 'Klonowanie przekroczyło limit czasu {minutos} min i zostało anulowane.',
      'git.token_invalido': 'Token GitHub jest nieprawidłowy.',
      'git.url_con_credenciales':
        'Adres URL nie powinien zawierać nazwy użytkownika ani hasła: należy użyć osobnego tokenu.',
      'servicios.desconocido': 'Nieznana usługa: {id}.',
      'servicios.no_instalado': 'Usługa {nombre} nie jest zainstalowana. Należy ją zainstalować w sekcji Usługi.',
      'servicios.puerto_invalido': 'Port musi być liczbą z zakresu od 1024 do 65535.',
      'servicios.puerto_asignado': 'Port {puerto} jest już przypisany do {otro}.',
      'servicios.puerto_ocupado':
        'Port {puerto} jest używany przez {nombre} (PID {pid}). Należy zamknąć ten proces lub wybrać inny port.',
      'servicios.confirmacion_borrado': 'Aby usunąć dane usługi {nombre}, należy wpisać „{id}”.',
      'servicios.ftp_no_disponible': 'Serwer FTP jest niedostępny.',
      'sistema.sin_cliente_ftp':
        'Na tym komputerze nie ma skojarzonego klienta FTP. Należy go zainstalować (na przykład FileZilla) lub skopiować adres.',
      'servicios.mailpit_no_responde': 'Mailpit nie odpowiada. Należy uruchomić go w sekcji Usługi.',
      'servicios.iniciar_todo_fallos':
        'Funkcja „Uruchom wszystko” nie mogła włączyć: {nombres}. Należy sprawdzić sekcję Usługi oraz logi.',
      'servicios.respaldo_fallo':
        'Nie zaktualizowano {nombre}: nie powiodło się utworzenie kopii zapasowej i nic nie zostało zmienione.',
      'servicios.espacio_insuficiente':
        'Brak miejsca na skopiowanie danych: wymagane jest {necesarios} MB, a wolne pozostaje {libres} MB.',
      'servicios.actualizacion_revertida':
        'Wersja {version} nie uruchomiła się; {nombre} przywrócono do wersji {anterior}. Kopia zapasowa została zachowana.',
      'servicios.restauracion_fallo':
        'Nowa wersja nie uruchomiła się i nie udało się przywrócić danych usługi {nombre}. Nic nie zostało uruchomione: zmodyfikowane dane znajdują się w {fallida}, a kopia zapasowa w {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} należy do innej wersji głównej: należy utworzyć ją jako nową instancję.',
      'servicios.misma_version': 'Instancja {id} korzysta już z wersji {version}.',
      'servicios.instancia_bloqueada':
        'Instancja {nombre} jest zablokowana: podczas aktualizacji nie udało się przywrócić jej danych. Zmodyfikowane dane znajdują się w {fallida}, a kopia zapasowa w {respaldo}. Przed uruchomieniem należy rozwiązać ten problem w sekcji Usługi → Wersje.',
      'servicios.datos_apartados':
        'Instancja {nombre} nie ma danych w swoim folderze, ale istnieją odłożone dane z aktualizacji: pusty folder nie zostanie utworzony. Należy sprawdzić sekcję Usługi → Wersje.',
      'servicios.puerto_reservado':
        'Port {puerto} jest zarezerwowany przez system ({desde}–{hasta}): należy wybrać inny.',
      'servicios.borrado_con_bloqueo':
        'Usługa {nombre} ma zablokowaną instancję po aktualizacji: przed usunięciem jej danych należy rozwiązać ten problem.',
      'servicios.config_no_revertida':
        '{nombre} {version} nie uruchomiła się i nie udało się przywrócić wersji {anterior} w konfiguracji. Należy ponownie wybrać wersję {anterior} w sekcji Usługi → Wersje.',
      'servicios.puerto_revertido_apagada':
        'Usługa {nombre} nie uruchomiła się na nowym porcie; przywrócono port {anterior}, ale tam również nie uruchomiła się: pozostała zatrzymana na porcie {anterior}.',
      'servicios.puerto_no_revertido':
        'Usługa {nombre} nie uruchomiła się na porcie {nuevo} i nie udało się przywrócić portu {anterior} w konfiguracji: pozostała zatrzymana.',
      'instancias.id_invalido': 'Identyfikator instancji jest nieprawidłowy.',
      'instancias.no_existe': 'Instancja {id} nie istnieje.',
      'instancias.existe': 'Instancja {id} już istnieje.',
      'instancias.una_sola': 'Usługa {nombre} obsługuje tylko jedną instancję.',
      'instancias.ultima': '{id} to jedyna instancja: nie można jej usunąć.',
      'instancias.sin_puerto_libre': 'Nie znaleziono wolnego portu dla instancji.',
      'instancias.confirmacion': 'Aby kontynuować, należy wpisać „{id}”.',
      'instancias.sin_datos': 'Instancja {id} nie ma danych w swoim folderze: należy wybrać kopię zapasową do przywrócenia.',
      'instancias.respaldo_no_existe': 'Taka kopia zapasowa dla instancji {id} nie istnieje.',
      'instancias.respaldo_en_uso':
        'Ta kopia jest potrzebna zablokowanej instancji {id}: należy najpierw rozwiązać jej problem.',
      'instancias.version_requerida':
        'Nie wiadomo, do której wersji przywrócić instancję {id}: należy wybrać zainstalowaną wersję z tej samej wersji głównej.',
      'instalador.version_en_uso':
        'Nie można odinstalować {servicio} {version}: jest używana przez instancję {instancia}.',
      'limpieza.sin_confirmar': 'Brak potwierdzenia czyszczenia wersji.',
      'limpieza.seleccion_invalida': 'Wybór wersji jest nieprawidłowy.',
      'limpieza.en_curso': 'Czyszczenie wersji jest już w toku.',
      'limpieza.no_existe': '{servicio} {version} nie jest już zainstalowana.',
      'limpieza.en_uso': '{servicio} {version} zaczęła być używana: nie została usunięta.',
      'limpieza.ruta_insegura':
        'Folder dla {servicio} {version} jest niebezpieczny (dowiązanie lub ścieżka spoza bin): nic nie zostało zmienione.',
      'limpieza.version_bloqueada':
        '{servicio} {version} ma używane lub zablokowane pliki: nie została usunięta ani pozostawiona w stanie częściowym.',
      'limpieza.otro_volumen':
        '{servicio} {version} znajduje się na innym dysku niż tymczasowy folder danych: nie można jej przenieść w całości, więc nic nie zostało zmienione.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} zawiera pakiety zainstalowane przez użytkownika (npm, pip…): aby ją usunąć, należy zaakceptować ich utratę.',
      'limpieza.destino_ocupado':
        'W katalogu bin istnieje już folder {servicio} {version}: nie zostanie nadpisany. Przed przywróceniem drugiego należy go usunąć.',
      'bd.encender_servicio': 'Aby zarządzać bazami danych, należy uruchomić usługę {nombre}.',
      'bd.sin_credenciales': 'Brak zapisanych poświadczeń dla {nombre}.',
      'bd.confirmacion_borrado': 'Aby usunąć bazę danych {nombre}, należy wpisać jej dokładną nazwę.',
      'bd.usuario_privilegiado':
        'Użytkownik {usuario} jest administratorem lub rolą systemową: należy wybrać dedykowanego użytkownika dla projektu.',
      'bd.usuario_en_uso':
        'Inny projekt używa już użytkownika {usuario}: hasło nie zostanie zmienione, aby nie utracił on połączenia. Nic nie zostało utworzone.',
      'bd.rol_sin_login':
        'Użytkownik {usuario} istnieje, ale nie może się zalogować (rola bez uprawnienia LOGIN lub reguła dostępu serwera). Nic nie zostało zmienione.',
      'bd.usuario_clave_distinta':
        'Użytkownik {usuario} już istnieje z innym hasłem. Należy użyć jego obecnego hasła: nie zostanie zmienione, aby nie odłączyć innych projektów.',
      'bd.mongosh_faltante': 'Brak narzędzia mongosh: aby zarządzać MongoDB, należy je zainstalować w sekcji Usługi.',
      'tuneles.sitio_no_encontrado': 'Nie znaleziono projektu.',
      'tuneles.confirmacion_requerida':
        'Udostępnienie domeny {dominio} w internecie wymaga potwierdzenia w WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Tunel dla {dominio} zmienił się od czasu potwierdzenia: należy potwierdzić ponownie.',
      'tuneles.cloudflared_no_instalado':
        'Narzędzie cloudflared nie jest zainstalowane. Należy je zainstalować w sekcji Usługi.',
      'tuneles.proveedor_no_disponible': 'Dostawca tuneli {proveedor} jest niedostępny.',
      'tuneles.cloudflare_sin_cuenta':
        'Należy najpierw połączyć konto Cloudflare w opcjach tunelu.',
      'tuneles.cloudflare_sin_credencial':
        'Ten tunel nie ma zapisanych poświadczeń: należy utworzyć go ponownie w opcjach tunelu.',
      'tuneles.cloudflare_datos_invalidos':
        'Nazwa tunelu (małe litery, cyfry i myślniki) lub domena publiczna jest nieprawidłowa.',
      'tuneles.cloudflare_conexion_en_curso': 'Łączenie z Cloudflare jest już w toku.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare zarejestrował {registrado} zamiast {dominio}: domena nie należy do autoryzowanej strefy. Należy usunąć ten rekord w panelu Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'Tunel {nombre} ma aktywne połączenia (cloudflared wymaga flagi -f do usunięcia). Należy zamknąć go na wszystkich urządzeniach, na których jest otwarty, i spróbować ponownie lub użyć opcji „Zapomnij tylko tutaj”.',
      'tuneles.nombre_en_uso': 'Tunel {nombre} jest już używany przez inną stronę.',
      'tuneles.dominio_en_uso': 'Domena {dominio} jest już używana przez inną stronę.',
      'tuneles.confirmacion_olvidar': 'Zapomnienie lub ponowne utworzenie tunelu {nombre} wymaga potwierdzenia.',
      'tuneles.cloudflare_fallo': 'Narzędzie cloudflared nie mogło ukończyć operacji: {detalle}',
      'tuneles.credencial_no_protegida':
        'Nie udało się ograniczyć dostępu do poświadczeń tylko do użytkownika, więc nie zostały użyte.',
      'tuneles.sin_cifrado':
        'Szyfrowanie systemowe jest niedostępne: nie można zapisać poświadczeń.',
      'tuneles.token_invalido':
        'Token jest nieprawidłowy: dozwolone są tylko litery, cyfry oraz znaki _ . - (od 8 do 200 znaków). Należy zapisać go ponownie w opcjach tunelu.',
      'tuneles.ngrok_no_instalado':
        'Narzędzie ngrok nie jest zainstalowane na tym komputerze. Należy je zainstalować ze strony ngrok.com i spróbować ponownie.',
      'tuneles.ngrok_sin_token': 'Brak tokenu ngrok: należy zapisać go w opcjach tunelu.',
      'tuneles.expose_sin_token': 'Brak tokenu Expose: należy zapisać go w opcjach tunelu.',
      'tuneles.tailscale_no_instalado':
        'Tailscale nie jest zainstalowany na tym komputerze. WolfCore Dev go nie instaluje: należy go zainstalować ze strony tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale nie jest zalogowany: należy zalogować się w Tailscale i spróbować ponownie.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale publikuje już zasób na porcie HTTPS {puerto}. WolfCore Dev go nie nadpisze: należy go wycofać w Tailscale i spróbować ponownie.',
      'lan.sitio_no_encontrado': 'Nie znaleziono strony.',
      'lan.confirmacion_requerida':
        'Udostępnienie domeny {dominio} w sieci lokalnej wymaga potwierdzenia w WolfCore Dev.',
      'lan.datos_reales':
        'Strona {dominio} zawiera rzeczywiste dane: nie może zostać udostępniona w sieci lokalnej, nawet za potwierdzeniem. Należy użyć kopii bez danych klientów.',
      'lan.sin_red':
        'Brak połączenia z siecią lokalną (Wi-Fi lub Ethernet). Należy połączyć się z siecią i spróbować ponownie.',
      'lan.ip_no_valida':
        'Adres {ip} nie należy już do sieci lokalnej. Należy ponownie otworzyć okno dialogowe i potwierdzić.',
      'lan.requiere_https': 'Strona {dominio} przekierowuje na HTTPS: należy udostępnić ją z opcją HTTPS.',
      'lan.sin_puertos':
        'Brak wolnych portów w zakresie 8100–8199 dla sieci lokalnej (zakres ten jest używany przez udostępnione strony oraz łącze CA). Należy przestać udostępniać jedną ze stron lub zamknąć okno dialogowe CA i spróbować ponownie.',
      'tuneles.expose_no_instalado':
        'Expose nie jest zainstalowane. W systemie Windows działa wyłącznie z plikiem expose.phar: należy umieścić go w {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose nie jest używane ze stronami zawierającymi rzeczywiste dane: jego inspektor żądań jest widoczny w całej sieci lokalnej. Należy wybrać innego dostawcę.',
      'tuneles.confirmacion_requerida_tailnet':
        'Udostępnienie domeny {dominio} w sieci tailnet wymaga potwierdzenia w WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Nie udało się odczytać zasobów publikowanych już przez Tailscale na tym komputerze, więc nic nie zostało otwarte, aby ich nie nadpisać. Należy sprawdzić, czy Tailscale działa, i spróbować ponownie.',
      'tuneles.tailscale_no_habilitado':
        'Serve lub Funnel nie jest włączony w sieci tailnet. Należy go włączyć pod adresem {enlace} i spróbować ponownie.',
      'tuneles.ngrok_desactualizado':
        'Zainstalowana wersja ngrok jest zbyt stara i nie obsługuje funkcji wymaganych przez WolfCore Dev. Należy ją zaktualizować (ngrok update) i spróbować ponownie.',
      'hosts.dominio_invalido': 'Podano nieprawidłową domenę.',
      'hosts.tiempo_agotado':
        'Brak odpowiedzi na prośbę o uprawnienia administratora w ciągu {segundos} s; plik hosts pozostał bez zmian.',
      'https.sin_dominio': 'Certyfikat wymaga co najmniej jednej domeny.',
      'https.sin_autoridad':
        'Urząd certyfikacji WolfCore Dev nie istnieje. Przed wystawieniem certyfikatów należy zainstalować CA w sekcji HTTPS.',
      'herramientas.pid_invalido': 'Identyfikator PID jest nieprawidłowy.',
      'herramientas.pid_sistema': 'PID {pid} należy do procesu systemowego i nie można go zakończyć.',
      'herramientas.proceso_propio':
        'Nie można zakończyć WolfCore Dev ani procesu, który go uruchomił.',
      'herramientas.proceso_inexistente': 'Proces {pid} już nie istnieje.',
      'herramientas.sin_editor':
        'Nie znaleziono żadnego edytora kodu. Należy go zainstalować (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        'Edytor {nombre} nie jest zainstalowany. Należy wybrać inny edytor w Ustawieniach.',
      'herramientas.editor_invalido': 'Ten edytor jest nieprawidłowy.',
      'herramientas.carpeta_sitio_inexistente': 'Folder projektu nie istnieje.',
      'herramientas.ruta_no_absoluta': 'Ścieżka musi być bezwzględna.',
      'herramientas.sin_seleccion': 'Należy wybrać co najmniej jeden element.',
      'herramientas.dominio_invalido': 'Podano nieprawidłową domenę lub adres IP.',
      'herramientas.demasiados_dominios':
        'Certyfikat obsługuje maksymalnie {maximo} domen lub adresów IP.',
      'buscar.consulta_invalida': 'Należy wpisać wyszukiwaną frazę (do 500 znaków).',
      'buscar.raiz_invalida': 'Folder lub plik nie istnieje albo jest nieprawidłowy.',
      'buscar.regex_invalida': 'Wyrażenie regularne jest nieprawidłowe.',
      'buscar.regex_lenta':
        'Wyrażenie regularne działa zbyt wolno: należy je uprościć lub użyć zwykłego tekstu.',
      'buscar.demasiadas': 'W toku jest już {maximo} wyszukiwań: należy anulować jedno z nich lub poczekać.',
      'terminal.no_abrio': 'Nie udało się otworzyć terminala.',
      'terminal.no_instalada': 'Terminal {nombre} nie jest zainstalowany. Należy wybrać inny terminal w Ustawieniach.',
      'terminal.invalida': 'Ten terminal jest nieprawidłowy.',
      'terminal.powershell_restringido':
        'PowerShell działa na tym komputerze w trybie ograniczonego języka (zasady organizacji lub AppLocker): WolfCore Dev nie może otworzyć terminala. Należy otworzyć go ręcznie w folderze projektu.',
      'proyectos.no_existe': 'Projekt nie istnieje.',
      'proyectos.no_confiado': 'Aby uruchomić przepis, należy zaznaczyć opcję „Ufam temu repozytorium”.',
      'proyectos.receta_en_curso': 'Dla tego projektu trwa już wykonywanie przepisu.',
      'proyectos.paso_no_omitible': 'Kroku „Utwórz stronę” nie można pominąć.',
      'workspaces.no_existe': 'Taka przestrzeń robocza nie istnieje.',
      'workspaces.invalido': 'Przestrzeń robocza jest nieprawidłowa: należy sprawdzić jej nazwę i elementy.',
      'workspaces.captadores_exclusivos':
        'Dwa narzędzia do przechwytywania poczty nie mogą być uruchomione jednocześnie: może działać tylko jedno.',
      'workspaces.elemento_fallo':
        'Nie udało się ukończyć operacji dla {elemento}. Należy sprawdzić sekcję Usługi oraz logi.',
      'workspaces.base_no_responde':
        'Element {elemento} nie został uruchomiony, ponieważ baza danych tego projektu nie odpowiada.',
      'tareas.cron_invalida':
        'Wyrażenie cron jest nieprawidłowe. Należy użyć 5 pól: minuta, godzina, dzień miesiąca, miesiąc i dzień tygodnia (na przykład 0 3 * * *).',
      'tareas.comando_invalido':
        'To polecenie nie jest dozwolone. Należy użyć php, node, npm run lub python z plikiem projektu, bez kodu w wierszu poleceń (-r, -e, -c).',
      'tareas.invalida': 'Zadanie jest nieprawidłowe: należy sprawdzić nazwę, harmonogram i polecenie.',
      'tareas.no_existe': 'To zadanie już nie istnieje.',
      'tareas.sin_confirmar': 'Aby uruchomić zadanie, należy potwierdzić jego polecenie.',
      'tareas.sitio_no_confiado':
        'Aby uruchamiać zadania projektu, należy zaznaczyć w nim opcję „Ufam temu repozytorium”.',
      'tareas.receta_cambio':
        'Przepis projektu zmienił się od czasu nadania zaufania: należy go przejrzeć i ponownie zaznaczyć „Ufam temu repozytorium”.',
      'tareas.aislado':
        'To jest testowy folder danych (WOLFCORE_DATOS): aby uruchamiać zaplanowane zadania, należy na nie zezwolić.',
      'tareas.carpeta': 'Folder projektu nie istnieje: nie można uruchomić zadania.',
      'tareas.en_curso': 'Zadanie jest już uruchomione.',
      'tareas.demasiadas': 'W tym projekcie jest zbyt wiele zadań (maksymalnie {maximo}).',
      'cli.no_autorizado':
        'Polecenie CLI nie ma autoryzacji: należy uruchomić je ponownie przy otwartej aplikacji WolfCore Dev.',
      'cli.orden_desconocida': 'WolfCore Dev nie rozpoznaje tego polecenia CLI.',
      'cli.argumentos_invalidos': 'Argumenty polecenia są nieprawidłowe.',
      'cli.solicitud_grande': 'Żądanie jest zbyt duże (maksymalnie {maximo} bajtów).',
      'cli.formato_no_admitido': 'Żądanie ma format nieobsługiwany przez CLI.',
      'cli.plazo':
        'Polecenie trwało zbyt długo: być może nadal się wykonuje. Należy sprawdzić stan w WolfCore Dev.',
      'cli.ocupado':
        'WolfCore Dev obsługuje zbyt wiele poleceń CLI naraz: proszę chwilę poczekać.',
      'cli.requiere_confirmacion':
        'To polecenie publikuje lub wprowadza zmiany i wymaga potwierdzenia (--si) dla strony {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        'Strona {sitio} zawiera rzeczywiste dane: należy potwierdzić również opcją rzeczywistych danych w poleceniu (domeną strony).',
      'cli.requiere_confirmacion_global':
        'Zmiana wersji PHP we wszystkich terminalach wymaga potwierdzenia (--si).',
      'cli.confirmacion_rechazada':
        'Potwierdzenie w oknie WolfCore Dev zostało odrzucone lub było niedostępne: nic nie zostało zmienione.',
      'cli.confirmacion_vencida':
        'Nie udzielono potwierdzenia w oknie WolfCore Dev na czas: nic nie zostało zmienione.',
      'cli.tunel_fallo': 'Nie udało się otworzyć tunelu. Należy sprawdzić jego log w WolfCore Dev.',
      'cli.inicio_fallo':
        'Nie udało się uruchomić wszystkich żądanych elementów. Należy sprawdzić logi w WolfCore Dev.',
      'cli.parada_fallo':
        'Nie udało się zatrzymać wszystkich żądanych elementów. Należy sprawdzić logi w WolfCore Dev.',
      'cli.interno': 'Wewnętrzny błąd serwera CLI.',
      'cli.proveedor_distinto':
        'Strona używa innego dostawcy tunelu ({proveedor}). Należy sprawdzić ustawienia i potwierdzić ponownie.',
      'cli.sitio_no_encontrado': 'Strona {sitio} nie istnieje.',
      'cli.carpeta_invalida':
        'Folder nie istnieje, jest folderem systemowym lub folderem danych WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Ten folder nie należy do żadnej strony WolfCore Dev: należy go najpierw powiązać.',
      'cli.ya_vinculada': 'Ten folder jest już stroną {sitio}.',
      'cli.tipo_no_soportado':
        'Projekty typu {tipo} tworzy się w interfejsie WolfCore Dev.',
      'cli.sitio_sin_php': 'Strona {sitio} nie używa PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} nie jest zainstalowana. Należy zainstalować ją w sekcji Usługi.',
      'cli.fuente_no_existe': 'Ten log jeszcze nie istnieje.',
      'cli.token_no_protegido':
        'Nie udało się ograniczyć pliku tokenu do bieżącego użytkownika: CLI nie zostanie uruchomione.',
      'cli.carpeta_ajena':
        'Folder run/ w katalogu danych należy do innego użytkownika: CLI nie zostanie uruchomione.',
      'cli.ruta_invalida': 'Ścieżka WolfCore Dev zawiera znaki nieobsługiwane przez wolf.cmd.',
      'cli.path_aislado':
        'W przypadku testowego folderu danych (WOLFCORE_DATOS) zmienna PATH użytkownika nie jest modyfikowana.',
      'cli.sin_cliente': 'Ta wersja WolfCore Dev nie zawiera klienta wolf (brak skompilowanego pliku).',
      'cli.demasiados_dialogos':
        'Zbyt wiele potwierdzeń w ciągu ostatniej minuty: proszę chwilę poczekać i spróbować ponownie.',
      'cli.error': 'Nie udało się wykonać polecenia: {detalle}',
      'proyectos.carpeta_no_vacia':
        'Folder projektu zawiera już pliki: należy wybrać inny lub go opróżnić.',
      'secretos.sin_cifrado':
        'Szyfrowanie systemowe jest niedostępne: nie można zapisać hasła dedykowanego użytkownika. Nic nie zostało zmienione.',
      'proyectos.clave_bd_falta':
        'Brak zapisanego hasła dla użytkownika {usuario}: nic nie zostało zapisane. W menedżerze .env opcja „Użyj dedykowanego użytkownika” generuje nowe hasło.',
      'env.archivo_grande': 'Plik zmiennych jest zbyt duży (maksymalnie {maximo}).',
      'env.no_regular': 'Plik .env nie jest zwykłym plikiem: nie jest odczytywany ani modyfikowany.',
      'env.clave_inexistente': 'Zmienna {clave} nie istnieje.',
      'env.cambio_invalido': 'Jedna ze zmian w pliku .env jest nieprawidłowa.',
      'env.variable_invalida': 'Zmiana zmiennej {clave} jest nieprawidłowa.',
      'env.solo_lectura': 'Zmienna {clave} zajmuje wiele wierszy: należy ją edytować ręcznie w pliku.',
      'env.usuario_compartido':
        'Z bazy danych {base} korzysta także projekt {proyecto}: należy potwierdzić współdzielenie użytkownika.',
      'env.cambio_externo':
        'Plik .env zmienił się od momentu wyświetlenia podglądu: należy go ponownie przejrzeć przed zapisaniem.',
      'env.sin_confirmar': 'Należy potwierdzić zapisanie zmian w pliku .env.',
      'env.versionado':
        'Git śledzi już plik .env tego projektu: następny commit wyśle jego wartości. Aby kontynuować, należy udzielić osobnego potwierdzenia.',
      'env.versionado_desconocido':
        'Nie udało się sprawdzić, czy git śledzi plik .env tego projektu: aby kontynuować, należy udzielić osobnego potwierdzenia.',
      'env.copia_invalida': 'Kopia pliku .env jest nieprawidłowa lub już nie istnieje.',
      'env.sin_base': 'Plik .env tego projektu nie zawiera połączenia z bazą danych.',
      'env.base_no_resuelta':
        'Baza danych tego projektu nie pochodzi z lokalnego serwera WolfCore Dev: nic nie zostało zmienione.',
      'env.motor_no_soportado': 'Obecnie opcja „Użyj dedykowanego użytkownika” działa z MySQL i MariaDB.',
      'env.ya_usa_usuario_propio': 'Ten projekt korzysta już z dedykowanego użytkownika.',
      'plantillas.id_invalido': 'Identyfikator szablonu jest nieprawidłowy.',
      'plantillas.no_existe': 'Szablon nie istnieje.',
      'plantillas.danada':
        'Szablon jest uszkodzony lub został zmodyfikowany: nie zostanie użyty. Należy go usunąć i zapisać ponownie.',
      'plantillas.demasiado_grande':
        'Projekt ma zbyt wiele plików lub zbyt duży rozmiar, aby zapisać go jako szablon (do {maximo} plików). Należy wykluczyć duże foldery.',
      'plantillas.demasiado_pesada':
        'Projekt ma zbyt duży rozmiar, aby zapisać go jako szablon (do {maximo}). Należy wykluczyć duże foldery.',
      'plantillas.exclusion_invalida':
        'Jedno z wykluczeń jest nieprawidłowe (należy użyć nazw lub ścieżek względnych, bez „..”).',
      'plantillas.nombre_invalido':
        'Nazwa szablonu jest nieprawidłowa (od 1 do 60 znaków).',
      'plantillas.esquema_fallo':
        'Nie udało się odczytać schematu bazy danych projektu: należy sprawdzić, czy jej usługa jest uruchomiona.',
      'plantillas.base_no_resuelta':
        'Nie można zapisać szablonu: serwer bazy danych jest zdalny lub żadna z lokalnych usług nie korzysta z tego portu.',
      'plantillas.sin_generador_base':
        'Ten typ projektu nie ma bazowego generatora: szablon musi zawierać pliki projektu.',
      'plantillas.exclusiones_nuevas':
        'Szablon zawiera plik, który jest teraz wykluczony ({archivo}): należy zapisać go ponownie z projektu lub usunąć.',
      'plantillas.motor_distinto':
        'Schemat szablonu pochodzi z MySQL, a wybrany serwer to MariaDB (lub odwrotnie): mogą wystąpić różnice. Należy potwierdzić chęć kontynuacji.',
      'bd.sql_no_permitido':
        'Schemat zawiera instrukcję, która nie dotyczy struktury, więc nic nie zostało wykonane: {sentencia}',
      'bd.extension_no_permitida':
        'Schemat wymaga rozszerzenia {nombre}, które nie znajduje się na liście dozwolonych: nic nie zostało przywrócone.',
      'bd.esquema_fallo': 'Nie udało się przywrócić pełnego schematu: nie pozostawiono żadnych zmian częściowych.',
      'bd.datos_no_permitidos':
        'Zrzut danych zawiera elementy niebędące danymi (akceptowane są wyłącznie INSERT, LOCK TABLES i SET): nic nie zaimportowano.',
      'bd.datos_fallo':
        'Nie udało się zaimportować danych: baza pozostała w dotychczasowym stanie, bez częściowych zmian.',
      'perfiles.destino_invalido': 'Proszę wybrać miejsce zapisu profilu (plik .wolfperfil).',
      'perfiles.frase_debil': 'Hasło urzędu certyfikacji (CA) musi mieć co najmniej {minimo} znaków.',
      'perfiles.frase_incorrecta': 'Hasło jest nieprawidłowe: nic nie zaimportowano.',
      'perfiles.certificados_sin_ca':
        'Certyfikaty stron są eksportowane wyłącznie razem z zaszyfrowanym CA: należy dołączyć CA wraz z hasłem.',
      'perfiles.no_existe': 'Plik profilu nie istnieje.',
      'perfiles.danado': 'Profil jest uszkodzony lub został zmodyfikowany: nic nie zaimportowano.',
      'perfiles.demasiado_grande': 'Profil jest zbyt duży (maksymalnie {maximo}).',
      'perfiles.version_no_soportada':
        'Profil pochodzi z nowszej wersji WolfCore Dev (format {version}): należy zaktualizować aplikację, aby go zaimportować.',
      'perfiles.sin_confirmar': 'Proszę potwierdzić chęć zaimportowania profilu.',
      'perfiles.vista_previa_vieja':
        'Folder danych lub profil uległ zmianie od czasu podglądu: proszę sprawdzić podgląd ponownie.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS nie jest prawidłowym folderem danych: ścieżka musi być bezwzględna, spoza folderów systemowych i inna niż rzeczywisty folder danych.',
      'perfiles.confirmar_reemplazar_ca':
        'Profil zawiera urząd certyfikacji (CA), a na tym komputerze istnieje już własny CA: należy porównać odcisk palca i osobno potwierdzić jego zastąpienie (wyłącznie jeśli jest to własny CA).',
      'herramientas.imagen_tipo':
        'Ten plik nie jest obsługiwanym obrazem (PNG, JPG, WebP, GIF, BMP lub ICO) lub jego zawartość nie odpowiada typowi.',
      'herramientas.imagen_grande': 'Obraz jest zbyt duży (maksymalnie {maximo}).',
      'herramientas.imagen_dimensiones':
        'Obraz ma zbyt duże wymiary ({ancho}×{alto} px; maksymalnie {maximo} px na bok) i ze względów bezpieczeństwa nie zostanie otwarty.',
      'herramientas.zip_sin_archivos': 'Brak plików do skompresowania (dowiązania nie są podążane).',
      'herramientas.zip_demasiados': 'Zbyt wiele plików do skompresowania (maksymalnie {maximo}).',
      'herramientas.zip_grande': 'Dane przeznaczone do kompresji są zbyt duże (maksymalnie {maximo}).',
      'herramientas.pdf_invalido': 'Plik nie jest dokumentem PDF możliwym do zoptymalizowania.',
      'herramientas.pdf_grande': 'Plik PDF jest zbyt duży (maksymalnie {maximo}).',
      'herramientas.pdf_cifrado': 'Plik PDF jest chroniony hasłem i nie można go zoptymalizować.',
      'herramientas.pdf_plazo': 'Przetwarzanie PDF przekroczyło {segundos} s i zostało anulowane.',
      'herramientas.salida_ocupada': 'Nie znaleziono wolnej nazwy dla nowego pliku.',
      'conversor.formato': 'Ta konwersja nie jest dostępna.',
      'conversor.archivo_invalido':
        'Plik jest uszkodzony lub nie odpowiada typowi wskazanemu przez rozszerzenie.',
      'conversor.archivo_grande': 'Plik jest zbyt duży (maksymalnie {maximo}).',
      'conversor.archivo_peligroso':
        'Plik wygląda na bombę ZIP lub został zmanipulowany (zbyt duża zawartość, encje XML lub nieprawidłowe nazwy) i ze względów bezpieczeństwa nie zostanie otwarty.',
      'conversor.limite_filas': 'Tabela ma zbyt wiele wierszy (maksymalnie {maximo}).',
      'conversor.limite_columnas': 'Tabela ma zbyt wiele kolumn (maksymalnie {maximo}).',
      'conversor.limite_paginas': 'Plik PDF ma zbyt wiele stron (maksymalnie {maximo}).',
      'conversor.pdf_cifrado': 'Plik PDF jest chroniony hasłem i nie można go przekonwertować.',
      'conversor.plazo': 'Konwersja trwała dłużej niż {segundos} s i została anulowana.',
      'conversor.cancelado': 'Konwersja została anulowana.',
      'conversor.libreoffice_ausente':
        'Ta konwersja wymaga programu LibreOffice, który nie jest zainstalowany na tym komputerze (WolfCore Dev go nie instaluje).',
      'conversor.libreoffice_fallo': 'LibreOffice nie zdołał przekonwertować dokumentu.',
      'conversor.limite_celdas': 'Tabela ma zbyt wiele komórek (maksymalnie {maximo}).',
      'conversor.memoria': 'Plik wymaga zbyt dużo pamięci (ponad {maximo}) i operacja została anulowana.',
      'conversor.pdf_no_disponible': 'Drukowanie do PDF jest obecnie niedostępne.',
      'herramientas.imagen_pixeles':
        'Obraz ma łącznie zbyt wiele pikseli ({ancho}×{alto} px; maksymalnie {maximo}) i ze względów bezpieczeństwa nie zostanie otwarty.',
      'herramientas.zip_cambio': 'Jeden z plików uległ zmianie podczas kompresji: proszę spróbować ponownie.',
      'herramientas.pdf_demasiado_complejo':
        'Plik PDF jest zbyt złożony (przekroczyłby dozwolony limit pamięci) i operacja została anulowana.',
      'herramientas.salida_denegada':
        'Nie można zapisać w tej lokalizacji: należy sprawdzić uprawnienia lub upewnić się, że folder istnieje.',
      'herramientas.fuera_de_la_ca':
        'CA w WolfCore Dev podpisuje wyłącznie domeny .test, localhost oraz adresy lokalne: nie można uwzględnić {dominio}.',
      'perfiles.frase_requerida':
        'Proszę podać hasło profilu, aby zaimportować jego bazy danych lub CA (albo zaimportować bez baz danych).',
      'perfiles.sin_espacio':
        'Brak wystarczającej ilości wolnego miejsca do zaimportowania profilu: wymagane {necesarios}, dostępne {libres}.',
      'perfiles.ca_sin_restricciones':
        'Ten urząd certyfikacji (CA) może podpisywać dowolne witryny internetowe: należy zaimportować go wyłącznie wtedy, gdy jest to własny CA, oraz porównać odcisk palca. Wymagane jest osobne potwierdzenie, aby kontynuować.',
      'perfiles.ca_restricciones_ajenas':
        'CA z profilu posiada ograniczenia nazw niezgodne z WolfCore Dev: nie zostanie zaimportowany.',
      'perfiles.instantanea_fallo':
        'Nie udało się zapisać kopii zapasowej środowiska przed zmianami: nic nie zmieniono. Należy sprawdzić wolne miejsce na dysku oraz uprawnienia folderu danych.',
      'perfiles.en_curso': 'Import profilu jest już w toku: proszę poczekać na jego zakończenie.',
      'importar.origen_apagado':
        'Nie udało się połączyć z serwerem baz danych drugiego programu: należy go uruchomić w tym programie i spróbować ponownie. Strony zostały zaimportowane.',
      'importar.origen_no_local': 'Serwer źródłowy musi znajdować się na tym komputerze (127.0.0.1).',
      'importar.origen_rechazado': 'Serwer źródłowy odrzucił nazwę użytkownika lub hasło.',
      'importar.origen_version':
        'Wersja serwera źródłowego nie może zostać zaimportowana za pomocą komponentów zainstalowanych w WolfCore Dev.',
      'importar.volcado_enorme':
        'Dane bazy przekraczają {maximo} MB: nie mogą zostać zaimportowane jednorazowo.',
      'importar.motor_no_soportado':
        'Z innych programów obsługiwany jest wyłącznie import baz danych MySQL i MariaDB.',
      'importar.ruta_fuera':
        'Pominięto folder lub plik wskazujący poza instalację lub na folder systemowy.',
      'importar.carpeta_invalida': 'Pominięto folder, który już nie istnieje lub nie jest folderem.',
      'importar.archivo_grande':
        'Plik konfiguracyjny przekracza {maximo} KB i nie został odczytany.',
      'importar.archivo_ilegible': 'Plik konfiguracyjny nie jest plikiem tekstowym lub nie udało się go odczytać.',
      'importar.demasiados':
        'Zbyt wiele stron lub plików konfiguracyjnych: odczytano wyłącznie początkowe pozycje.',
      'importar.candidato_desconocido':
        'Ta strona nie występuje już w programie źródłowym: proszę wyszukać ponownie.',
      'importar.ya_vinculado': 'Ten folder jest już stroną w WolfCore Dev.',
      'importar.dominio_existe':
        'Istnieje już strona z domeną {dominio}: należy ją zmienić przed importem.',
      'importar.sin_php':
        'Ta strona wymaga PHP, a żadna wersja nie jest zainstalowana: należy zainstalować PHP w sekcji Usługi.',
      'importar.base_existe':
        'Baza {nombre} już istnieje w miejscu docelowym i nie została zmieniona. Proszę potwierdzić zastąpienie, aby ją zaimportować (wcześniej zostanie utworzona kopia zapasowa).',
      'importar.base_fallo':
        'Nie udało się zaimportować bazy {nombre}: pozostała w dotychczasowym stanie, bez częściowych zmian.',
      'importar.sitio_fallo': 'Nie udało się utworzyć strony.',
      'importar.origen_invalido':
        'Dane serwera źródłowego są nieprawidłowe (użytkownik, hasło lub port).',
      'importar.sin_seleccion': 'Proszę wybrać co najmniej jedną stronę do zaimportowania.',
      'importar.en_curso': 'Import jest już w toku: proszę poczekać na jego zakończenie.',
      'importar.cancelado': 'Import został anulowany: importowane elementy pozostały w dotychczasowym stanie.',
      'importar.origen_estancado':
        'Serwer drugiego programu przestał odpowiadać podczas zrzutu: baza nie została zaimportowana.',
      'importar.sin_espacio':
        'Brak wystarczającej ilości wolnego miejsca do zaimportowania bazy: wymagane ok. {necesarios} MB, dostępne {libres} MB.',
      'importar.origen_fallo': 'Nie udało się wykonać zrzutu bazy danych z drugiego programu.',
      'importar.clave_no_ascii':
        'Hasło zawiera znaki diakrytyczne lub symbole, których nie można przekazać do zrzutu: należy użyć hasła składającego się wyłącznie ze znaków ASCII.',
      'plantillas.sin_esquema': 'Szablon nie zawiera schematu bazy danych.',
      'proyectos.carpeta_invalida': 'Folder projektu jest nieprawidłowy.',
      'proyectos.nombre_invalido':
        'Nazwa projektu może zawierać wyłącznie małe litery, cyfry i myślniki (maksymalnie 40 znaków).',
      'proyectos.argumento_invalido': 'Podana wartość dla projektu jest nieprawidłowa (pole: {campo}).',
      'proyectos.base_existe': 'Baza {nombre} już istnieje: proszę wybrać inną nazwę.',
      'proyectos.dominio_existe': 'Istnieje już strona z domeną {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Ten folder należy do projektu {dominio} lub znajduje się wewnątrz niego: proszę wybrać inny.',
      'proyectos.sin_python': 'Python nie jest zainstalowany: należy go zainstalować w sekcji Usługi.',
      'proyectos.venv_ajeno':
        'Projekt zawiera własny folder .venv, a WolfCore Dev nie uruchamia interpretera Python z obcego repozytorium: należy go usunąć i ponownie utworzyć środowisko.',
      'proyectos.paso_base_no_omitible':
        'Kroku „Utwórz bazę danych” dla nowego projektu nie można pominąć.',
      'proyectos.sin_php': 'PHP nie jest zainstalowane: należy je zainstalować w sekcji Usługi.',
      'proyectos.php_no_instalado': 'PHP {version} nie jest zainstalowane: należy je zainstalować w sekcji Usługi.',
      'proyectos.python_no_instalado':
        'Python {version} nie jest zainstalowany: należy go zainstalować w sekcji Usługi.',
      'mcp.token_invalido': 'Token serwera MCP jest nieprawidłowy.',
      'mcp.solicitud_cancelada': 'Klient MCP anulował żądanie: akcja nie została wykonana.',
      'doctor.puerto_ocupado': 'Port {puerto} usługi {servicio} jest używany przez inny program ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) zajmuje port {puerto} usługi {servicio}.',
      'doctor.puerto_http_sys':
        'Usługa systemu Windows ({programa}) zajmuje port {puerto} usługi {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} zajmuje port {puerto} usługi {servicio}. Należy go zamknąć lub zmienić port w WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} zajmuje port {puerto} usługi {servicio}.',
      'doctor.puerto_skype': '{programa} zajmuje port {puerto} usługi {servicio}.',
      'doctor.puerto_reservado':
        'Port {puerto} usługi {servicio} znajduje się w zakresie zarezerwowanym przez system Windows ({desde}-{hasta}: Hyper-V, WSL lub Docker).',
      'doctor.ca_por_vencer': 'Urząd certyfikacji WolfCore Dev wygasa za {dias} dni.',
      'doctor.ca_vencida': 'Urząd certyfikacji WolfCore Dev wygasł.',
      'doctor.certificado_por_vencer': 'Certyfikat dla {dominio} wygasa za {dias} dni.',
      'doctor.certificado_vencido': 'Certyfikat dla {dominio} wygasł.',
      'doctor.hosts_ilegible': 'Nie udało się odczytać pliku hosts.',
      'doctor.hosts_utf16':
        'Plik hosts jest zapisany w kodowaniu UTF-16: system Windows może nie odczytywać jego wpisów.',
      'doctor.hosts_bloque_duplicado':
        'Plik hosts zawiera zbyt wiele bloków WolfCore Dev ({bloques}); powinien występować tylko jeden.',
      'doctor.hosts_bloque_sin_cierre':
        'Blok WolfCore Dev w pliku hosts nie posiada znacznika zamykającego.',
      'doctor.hosts_dominios_faltantes':
        'W pliku hosts brakuje domen skonfigurowanych stron ({cantidad}).',
      'doctor.hosts_solo_lectura':
        'Plik hosts ma atrybut tylko do odczytu (często ustawiany przez program antywirusowy). WolfCore Dev nadal może go zapisać z uprawnieniami administratora.',
      'doctor.path_duplicados':
        'Zmienna PATH użytkownika zawiera zduplikowane wpisy WolfCore Dev ({cantidad}).',
      'doctor.path_ajeno_delante':
        'Inny folder zawierający {programa} ({origen}) znajduje się przed WolfCore Dev w zmiennej PATH: w terminalach będzie używana tamta wersja.',
      'doctor.vcredist_ausente':
        'Brak pakietu Microsoft Visual C++ 2015-2022 (x64): PHP oraz inne usługi nie uruchomią się bez niego.',
      'doctor.enlazador_msvc_ausente':
        'Rust jest zainstalowany, ale brakuje narzędzi C++ z pakietu Visual Studio Build Tools (konsolidatora MSVC): cargo nie będzie w stanie konsolidować programów.',
      'doctor.antivirus_sin_exclusion':
        'Program antywirusowy skanuje folder danych WolfCore Dev: PHP i usługi mogą uruchamiać się wolno.',
      'doctor.firewall_reglas':
        'System Windows zezwala na połączenia przychodzące z sieci dla reguł programów WolfCore Dev ({cantidad}; nginx, PHP lub bazy danych) w profilach {perfiles}: te programy pozostają otwarte na sieć.',
      'doctor.firewall_no_comprobado':
        'Nie udało się sprawdzić Zapory systemu Windows (mogą być wymagane uprawnienia administratora).',
      'doctor.firewall_reglas_ajenas':
        'Wykryto reguły przychodzące innych programów ({cantidad}; FlyEnv, Laragon, XAMPP lub innych) dla nginx, PHP lub baz danych w profilach {perfiles}. Nie należą one do WolfCore Dev: są wyłącznie wyświetlane i nigdy nie są stąd usuwane.',
      'doctor.servicio_en_error': 'Usługa {servicio} zgłasza błąd.',
      'doctor.revision_fallida': 'Nie udało się ukończyć sprawdzenia {revision}.',
      'doctor.confirmacion_requerida': 'Proszę potwierdzić naprawę przed jej zastosowaniem.',
      'doctor.hallazgo_desconocido': 'Ten problem już nie występuje: proszę uruchomić sprawdzanie ponownie.',
      'doctor.solo_informa':
        'Ten problem nie ma automatycznej naprawy: należy postępować zgodnie ze wskazówkami.',
      'doctor.reparacion_fallida': 'Nie udało się zastosować naprawy.',
      'doctor.reparacion_cancelada': 'Anulowano uprawnienia administratora: nic nie zmieniono.',
      'doctor.reparacion_denegada': 'System Windows lub program antywirusowy odmówił dostępu: nic nie zmieniono.',
      'doctor.ya_resuelto': 'Problem już nie występował: żadne zmiany nie były potrzebne.',
      'doctor.ca_vieja_sin_quitar':
        'Nowy urząd certyfikacji jest już w użyciu, ale nie udało się usunąć poprzedniego z magazynu systemu Windows. Można go usunąć w sekcji HTTPS.',
      'doctor.sin_puerto_libre': 'Nie znaleziono wolnego portu do przeniesienia usługi.',
      'doctor.ca_vuelta_atras_incompleta':
        'Nie udało się zastosować nowego urzędu certyfikacji, a wycofanie zmian było niepełne. Należy sprawdzić sekcję HTTPS; kopia zapasowa z datą znajduje się w etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox nie ufa urzędowi certyfikacji WolfCore Dev w części profili ({cantidad}; korzysta z własnego magazynu).',
      'confianza.sin_ca': 'Brak urzędu certyfikacji: należy go utworzyć w sekcji HTTPS.',
      'confianza.sin_raices':
        'Nie znaleziono zaufanych certyfikatów głównych dla Pythona (ani certifi, ani magazynu Windows): nic nie zmieniono.',
      'confianza.node_variable_ajena':
        'Zmienna NODE_EXTRA_CA_CERTS jest już zdefiniowana przez użytkownika: WolfCore Dev jej nie nadpisuje.',
      'confianza.variable_fallida': 'Nie udało się zmienić zmiennej środowiskowej użytkownika.',
      'firefox.abierto': 'Firefox jest uruchomiony: należy go zamknąć i spróbować ponownie.',
      'firefox.error': 'Nie udało się zmodyfikować pliku user.js tego profilu; pozostał bez zmian.',
      'firefox.fuera':
        'Wykryto profile poza folderem Firefoksa: należy je aktywować w sekcji Zaufanie CA z osobnym potwierdzeniem.',
      'confianza.node_variable_cambiada':
        'Zmienna NODE_EXTRA_CA_CERTS nie wskazuje już na urząd certyfikacji WolfCore Dev (została zmieniona ręcznie): nie została usunięta.',
      'ia.clave_invalida': 'Dostawca odrzucił klucz: należy go sprawdzić lub wygenerować nowy.',
      'ia.sin_saldo': 'Konto u dostawcy nie ma wystarczających środków lub dostępnego limitu.',
      'ia.limite': 'Dostawca ograniczył liczbę żądań: proszę chwilę poczekać i spróbować ponownie.',
      'ia.region': 'Dostawca nie świadczy usług w tym kraju lub regionie.',
      'ia.sin_red': 'Nie udało się połączyć z dostawcą: należy sprawdzić połączenie sieciowe lub bazowy adres URL.',
      'ia.url_invalida':
        'Bazowy adres URL jest nieprawidłowy: należy użyć https:// (lub http:// wyłącznie dla 127.0.0.1 albo [::1]), bez nazwy użytkownika i hasła.',
      'ia.plazo': 'Dostawca nie odpowiedział w ciągu {segundos} s.',
      'ia.respuesta_rara': 'Dostawca zwrócił nieoczekiwaną odpowiedź.',
      'ia.cancelado': 'Żądanie do dostawcy zostało anulowane.',
      'ia.sin_clave': 'Ten dostawca wymaga klucza: należy go najpierw zapisać.',
      'ia.clave_mal_formada':
        'Klucz ma nieprawidłowy format (bez spacji ani znaków nowej linii).',
      'ia.modelo_invalido': 'Nazwa modelu jest nieprawidłowa.',
      'ia.modelo_no_disponible': 'Model nie istnieje lub konto nie ma do niego dostępu.',
      'ia.proveedor_invalido': 'Konfiguracja dostawcy jest nieprawidłowa.',
      'ia.env_conflicto':
        'Plik .env definiuje już {claves} z inną wartością: proszę potwierdzić, czy zastąpić wpis.',
      'ia.env_sin_confirmar':
        'Proszę potwierdzić zapisanie klucza w pliku .env (zostanie zapisany otwartym tekstem).',
      'ia.env_versionado':
        'Git już śledzi plik .env tego projektu: następny commit wyśle klucz mimo wpisu w .gitignore. Należy usunąć go z indeksu poleceniem git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Nie udało się sprawdzić, czy git śledzi już plik .env tego projektu: wymagane jest osobne potwierdzenie zapisu klucza.',
      'ia.proveedor_no_existe': 'Dostawca AI już nie istnieje.',
      'ia.url_cambia_con_clave':
        'Dostawca ma zapisany klucz: proszę potwierdzić chęć wysłania go pod nowy adres URL.',
      'ia.mensaje_sin_confirmar':
        'Proszę potwierdzić wysłanie wiadomości testowej (zużywa tokeny z konta).',
      'ia.clave_ilegible':
        'Nie udało się odczytać zapisanego klucza dostawcy: należy go usunąć i zapisać ponownie.',
      'ia.argumento_invalido': 'Nieprawidłowa wartość ({campo}).',
      'correo.auth': 'Dostawca odrzucił nazwę użytkownika lub hasło.',
      'correo.conexion': 'Nie udało się połączyć z serwerem SMTP: należy sprawdzić host i port.',
      'correo.tls':
        'Nie udało się nawiązać zaszyfrowanego i prawidłowego połączenia z serwerem (certyfikat, nazwa lub STARTTLS). Nic nie wysłano.',
      'correo.rechazado':
        'Serwer odrzucił wiadomość lub adres. Należy sprawdzić nadawcę: wielu dostawców akceptuje wyłącznie zweryfikowanego nadawcę lub domenę.',
      'correo.plazo': 'Serwer nie odpowiedział na czas (20 s).',
      'correo.host_invalido':
        'Serwer SMTP musi być nazwą hosta lub adresem IP, bez schematu, portu ani ścieżki.',
      'correo.host_local':
        'Ten serwer wskazuje na ten komputer lub sieć lokalną: wymagane jest potwierdzenie, aby go użyć.',
      'correo.destinatario_invalido': 'Adres odbiorcy jest nieprawidłowy.',
      'correo.proveedor_invalido': 'Dane dostawcy są nieprawidłowe.',
      'correo.proveedor_no_existe': 'Dostawca poczty już nie istnieje.',
      'correo.sin_clave': 'Dostawca nie ma zapisanego klucza.',
      'correo.clave_ilegible':
        'Nie udało się odczytać zapisanego klucza dostawcy: należy go usunąć i zapisać ponownie.',
      'correo.cambia_con_clave':
        'Dostawca ma zapisany klucz: proszę potwierdzić chęć wysłania go na nowy serwer.',
      'correo.env_sin_confirmar':
        'Proszę potwierdzić zapisanie zmiennych poczty w pliku .env.',
      'correo.ocupado': 'Próba wysyłki testowej jest już w toku.',
      'correo.limite': 'Proszę odczekać {segundos} s przed kolejną próbą wysyłki.',
      'correo.clave_mal_formada':
        'Klucz ma nieprawidłowy format: wyłącznie znaki drukowalne, bez znaków nowej linii i maksymalnie 4096 znaków.',
      'correo.argumento_invalido': 'Nieprawidłowa wartość ({campo}).',
      'agentes.no_existe': 'Ten agent nie jest obsługiwany.',
      'agentes.sin_confirmar': 'Proszę potwierdzić operację w oknie dialogowym, aby kontynuować.',
      'agentes.no_instalable':
        'Ten agent nie jest instalowany z poziomu WolfCore Dev: należy skorzystać z oficjalnego przewodnika ({guia}).',
      'agentes.sin_node': 'Należy zainstalować Node w sekcji Usługi, aby móc zainstalować agenta.',
      'agentes.node_antiguo':
        '{agente} wymaga Node {requerida} lub nowszego, a aktualnie używana byłaby wersja {actual}. Należy zainstalować nowszą wersję Node w sekcji Usługi.',
      'agentes.node_version_desconocida':
        'Nie udało się ustalić wersji Node, a {agente} wymaga Node {requerida} lub nowszego. Należy sprawdzić Node w sekcji Usługi.',
      'instalador.zip_demasiado_grande':
        'Pobrany pakiet jest zbyt duży lub zawiera zbyt wiele plików: nie zostanie zainstalowany.',
      'rust.rustup_init_fallo': 'Program rustup-init zakończył się błędem (kod {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Nie udało się zainstalować Rust {version} (kod {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Nie udało się odinstalować Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Nie udało się pobrać rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Nie udało się zainstalować agenta: {detalle}',
      'agentes.no_instalado': '{agente} nie jest zainstalowany.',
      'agentes.mcp_no_soportado':
        '{agente} nie dokumentuje sposobu pobierania tokenu ze zmiennej środowiskowej: MCP nie zostanie dla niego zarejestrowany.',
      'agentes.config_ilegible':
        'Nie udało się zinterpretować pliku {archivo}; nie został zmodyfikowany. Należy sprawdzić go ręcznie.',
      'agentes.config_en_uso':
        'Plik {archivo} uległ zmianie podczas edycji przez WolfCore Dev: należy zamknąć agenta i spróbować ponownie. Nie wprowadzono zmian.',
      'agentes.proveedor_incompatible': '{agente} nie obsługuje tego dostawcy AI.',
      'agentes.sin_cambios_preparados': 'Brak przygotowanych zmian (git add) do opisania.',
      'agentes.argumento_invalido': 'Nieprawidłowa wartość ({campo}).',
      'git.commit_fallo': 'Nie udało się wykonać commita: {detalle}',
      'git.mensaje_invalido': 'Komunikat commita jest pusty lub nieprawidłowy.',
      'php.rama_no_instalada': 'PHP {rama} nie jest zainstalowane.',
      'php.argumento_invalido': 'Nieprawidłowa wartość ({campo}).',
      'php.valor_invalido': 'Wartość dla {clave} jest nieprawidłowa.',
      'php.ini_invalido': 'PHP nie uruchamia się z tym plikiem php.ini; nic nie zapisano. Wynik: {salida}',
      'php.no_arranco':
        'PHP {rama} nie uruchomiło się ponownie po zmianie; przywrócono poprzednią konfigurację i działa jak wcześniej.',
      'php.caido_tras_restaurar':
        'PHP {rama} nie uruchomiło się ponownie; przywrócono poprzednią konfigurację, ale nadal nie odpowiada. Należy sprawdzić sekcję Usługi oraz dzienniki PHP.',
      'php.respaldo_no_existe': 'Ta kopia zapasowa pliku php.ini nie istnieje.',
      'php.extension_no_existe': 'Rozszerzenie {nombre} nie znajduje się w folderze ext tej wersji.',
      'php.extension_no_catalogo':
        'Rozszerzenie {nombre} nie występuje w katalogu dla tej wersji.',
      'php.variante_desconocida': 'Nie udało się ustalić sposobu kompilacji tej wersji PHP.',
      'php.sin_variante': 'Katalog nie zawiera {nombre} dla kompilacji {variante}.',
      'php.huella_distinta': 'Pobrany plik nie zgadza się z opublikowanym skrótem; nic nie zainstalowano.',
      'php.descarga_fallida': 'Nie udało się pobrać rozszerzenia: {detalle}',
      'php.extension_en_uso':
        'Biblioteka DLL rozszerzenia {nombre} jest w użyciu. Należy zatrzymać PHP {rama} i spróbować ponownie.',
      'php.extension_sin_dll':
        'Nie udało się podmienić biblioteki DLL dla {nombre}, przez co folder ext wersji PHP {rama} pozostał bez niej. Należy zatrzymać PHP {rama} i spróbować ponownie: poprzednia wersja wróci na swoje miejsce przy uruchomieniu.',
      'php.sitio_sin_php': 'Ta strona nie korzysta z PHP.',
      'php.sitio_no_arranco':
        'Dedykowane PHP dla strony {sitio} nie odpowiedziało po zmianie; przywrócono poprzednią konfigurację.',
      'php.sin_puertos_sitio': 'Brak wolnych portów dla dedykowanych instancji PHP stron.',
      'xdebug.launch_invalido':
        'Nie można zinterpretować pliku .vscode/launch.json projektu; nic nie zmieniono.',
      'xdebug.launch_no_seguro':
        'Folder .vscode lub jego plik launch.json jest dowiązaniem albo innym obiektem: zapis w tym miejscu jest zablokowany.',
      'xdebug.sin_configurar': 'Należy skonfigurować Xdebug na stronie przed wygenerowaniem launch.json.',
      'nginx.sitio_no_existe': 'Ta strona już nie istnieje.',
      'nginx.texto_invalido':
        'Treść konfiguracji vhost jest zbyt długa, pusta lub zawiera znaki sterujące.',
      'nginx.sintaxis': 'Linia {linea}: {detalle}. Nic nie zmieniono.',
      'nginx.directiva_prohibida':
        'Linia {linea}: dyrektywa „{directiva}” nie jest dozwolona w konfiguracji vhost strony (mogłaby wpływać na inne strony lub pliki spoza projektu). Nic nie zmieniono.',
      'nginx.ruta_fuera':
        'Linia {linea}: dyrektywa „{directiva}” wskazuje poza folder projektu lub poza jego dzienniki i certyfikaty. Nic nie zmieniono.',
      'nginx.fuera_de_server':
        'Linia {linea}: pełny plik vhost może zawierać wyłącznie bloki „server”; „{directiva}” znajduje się poza nimi. Nic nie zmieniono.',
      'nginx.dominio_ajeno':
        'Linia {linea}: „{nombre}” nie jest domeną tej strony. Należy najpierw dodać ją jako alias strony.',
      'nginx.puerto_ajeno':
        'Linia {linea}: strona może nasłuchiwać wyłącznie na portach Nginx skonfigurowanych w Ustawieniach.',
      'nginx.version_no_existe': 'Ta wersja konfiguracji vhost nie znajduje się już w historii.',
      'nginx.argumento_invalido': 'Nieprawidłowy argument: {campo}',
      'nginx.destino_interno':
        'Linia {linea}: dyrektywa „{directiva}” wskazuje na wewnętrzną usługę WolfCore Dev (Adminer, Mailpit, bazy danych, PHP innych stron…) i wystawiłaby ją w sieci oraz w tunelach. Nic nie zmieniono.',
      'nginx.caido_tras_restaurar':
        'Nginx nie wznowił działania: przywrócono poprzednią konfigurację vhost, ale nadal nie odpowiada. Należy sprawdzić sekcję Usługi oraz dziennik Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'Port {puerto} jest już w użyciu: przechwytywanie zrzutów nie może nasłuchiwać. Należy zamknąć program, który go zajmuje (np. server:dump z Symfony).',
      'depuracion.no_iniciado': 'Przechwytywanie zrzutów jest wyłączone.',
      'depuracion.tipo_no_soportado': 'Przechwytywanie zrzutów jest dostępne dla stron PHP i FastAPI.',
      'depuracion.confirmacion': 'Proszę potwierdzić przechwytywanie zrzutów w oknie dialogowym.',
      'depuracion.argumento_invalido': 'Nieprawidłowy argument: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Ten plik nie znajduje się w folderze strony: nie zostanie otwarty w edytorze.',
      'contenedores.motor_invalido': 'Nieznany silnik kontenerów.',
      'contenedores.id_invalido': 'Identyfikator kontenera jest nieprawidłowy.',
      'contenedores.argumento_invalido': 'Nieprawidłowy argument: {campo}',
      'contenedores.sin_motor': 'Program {motor} nie jest zainstalowany na tym komputerze.',
      'contenedores.no_responde':
        'Program {motor} nie odpowiada. Proszę uruchomić Docker Desktop lub maszynę Podman i spróbować ponownie.',
      'contenedores.remoto':
        'Domyślne połączenie {motor} wskazuje na inny komputer: WolfCore Dev korzysta wyłącznie z silników lokalnych.',
      'contenedores.no_existe': 'Kontener już nie istnieje. Proszę odświeżyć listę.',
      'contenedores.accion_fallo': 'Silnik nie mógł wykonać tej operacji: {detalle}',
      'contenedores.demasiados_registros':
        'Można śledzić jednocześnie maksymalnie {maximo} dzienników kontenerów.',
      'contenedores.sin_confirmar': 'Proszę potwierdzić działanie w oknie dialogowym.',
      'catalogo.indice_invalido':
        'Indeks wersji usługi {servicio} nie przeszedł weryfikacji; używana jest zapisana lista.',
      'catalogo.sin_huella':
        'Usługa {servicio} {version} nie ma opublikowanej sumy kontrolnej: proszę potwierdzić instalację w oknie dialogowym.',
      'catalogo.huella_debil':
        'Usługa {servicio} {version} ma jedynie słabą sumę kontrolną (MD5 lub SHA-1): proszę potwierdzić instalację w oknie dialogowym.',
      'catalogo.huella_no_coincide': 'Pobrany plik nie zgadza się z opublikowaną sumą kontrolną.',
      'catalogo.redireccion_ajena': 'Pobieranie próbowało przekierować do niedozwolonej witryny ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Pobieranie wykonało zbyt wiele przekierowań (ponad {maximo}).',
      'catalogo.respuesta_grande': 'Odpowiedź serwera jest zbyt duża.',
      'catalogo.version_no_encontrada':
        'Wersja {version} usługi {servicio} nie znajduje się w katalogu.',
      'catalogo.huella_no_disponible':
        'Nie udało się pobrać sumy kontrolnej dla {servicio} {version} (brak połączenia lub źródło nie odpowiedziało). Proszę spróbować ponownie.',
      'catalogo.firma_invalida':
        'Podpis PGP dla {servicio} {version} jest nieprawidłowy lub nie został opublikowany: nic nie zostało zainstalowane.',
      'catalogo.firma_no_soportada':
        'Podpis PGP dla {servicio} {version} używa formatu, którego WolfCore Dev nie weryfikuje: nic nie zostało zainstalowane.',
      'catalogo.clave_desconocida':
        'Podpis dla {servicio} {version} pochodzi z klucza, którego nie ma na liście przypiętych kluczy aplikacji: nic nie zostało zainstalowane.',
      'catalogo.firma_vencida':
        'Podpis dla {servicio} {version} lub jego klucz wygasł: nic nie zostało zainstalowane. Proszę zaktualizować WolfCore Dev, aby mieć aktualne klucze.',
      'catalogo.reloj_atrasado':
        'Podpis dla {servicio} {version} ma przyszłą datę: proszę sprawdzić datę i godzinę systemu i spróbować ponownie.',
      'acceso_bd.datos_invalidos': 'Dane dostępowe do bazy danych są nieprawidłowe.',
      'acceso_bd.sin_base': 'Plik .env tego projektu nie wskazuje na żadną bazę danych.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin otwiera tylko bazy MySQL i MariaDB; dla PostgreSQL należy użyć Adminer.',
      'acceso_bd.servidor_no_resuelto':
        'Baza danych tego projektu nie pochodzi z lokalnego serwera WolfCore Dev.',
      'acceso_bd.no_listo':
        'Narzędzie nie jest gotowe: proszę zainstalować je w sekcji Usługi i uruchomić PHP.',
      'auditoria.tabla_invalida': 'Tabela nie istnieje w tej bazie danych.',
      'auditoria.columna_invalida':
        'Kolumna nie istnieje w tej tabeli (kolumny użytkownika i skrótu muszą być różne).',
      'auditoria.usuario_no_encontrado': 'Nie znaleziono konta dla tego użytkownika.',
      'auditoria.usuario_repetido':
        'Istnieje więcej niż jedno konto o tej nazwie użytkownika: resetowanie zostało przerwane, aby nie zmienić niewłaściwego konta.',
      'auditoria.formato_no_soportado':
        'Format bieżącego skrótu nie może zostać odtworzony: resetowanie zostało przerwane.',
      'auditoria.clave_larga':
        'bcrypt używa tylko pierwszych 72 bajtów hasła: proszę wybrać krótsze hasło.',
      'auditoria.clave_invalida': 'Nowe hasło jest nieprawidłowe.',
      'auditoria.sin_confirmar': 'Proszę potwierdzić resetowanie tego hasła.',
      'auditoria.respaldo_previo_fallo':
        'Nie udało się zapisać kopii zapasowej bazy przed resetowaniem: nie wprowadzono żadnych zmian.',
      'auditoria.copia_fallo': 'Nie udało się zapisać kopii wiersza: nie wprowadzono żadnych zmian.',
      'auditoria.motor_no_soportado':
        'Audyt haseł jest dostępny dla MySQL, MariaDB i PostgreSQL.',
      'auditoria.cancelada': 'Audyt został anulowany.',
      'auditoria.usuario_invalido': 'Nazwa użytkownika musi mieć od 1 do 256 znaków.',
      'auditoria.en_curso': 'Audyt jest już w toku: proszę poczekać na jego zakończenie lub go anulować.',
      'auditoria.base_sistema': 'Bazy systemowe nie podlegają audytowi: proszę wybrać bazę projektu.',
      'auditoria.esquema_invalido': 'Schemat nie istnieje w tej bazie danych.',
      'auditoria.fila_cambio':
        'Konto uległo zmianie w międzyczasie: hasło nie zostało zresetowane. Proszę spróbować ponownie.',
      'auditoria.verificacion_fallo':
        'Baza danych nie zapisała hasła zgodnie z oczekiwaniami: zmiana została cofnięta.',
      'auditoria.columna_corta':
        'Kolumna skrótu mieści {largo} znaków, a nowy skrót wymaga {necesario}: nie wprowadzono żadnych zmian. Należy poszerzyć kolumnę.',
      'auditoria.datos_reales_sin_confirmar':
        'Ta baza danych zawiera rzeczywiste dane klientów: zresetowanie hasła wymaga wzmocnionego potwierdzenia.',
      'instantaneas.id_invalido': 'Migawka jest nieprawidłowa.',
      'instantaneas.no_encontrada': 'Nie znaleziono migawki; mogła zostać już usunięta.',
      'instantaneas.otra_base': 'Ta migawka należy do innej bazy danych: nie można jej zastosować tutaj.',
      'instantaneas.sin_confirmar': 'Proszę potwierdzić przywrócenie tej migawki.',
      'instantaneas.motor_no_soportado': 'Migawki są dostępne dla MySQL, MariaDB i PostgreSQL.',
      'instantaneas.demasiado_grande':
        'Rozmiar bazy przekracza {maximo} MB — maksymalny limit dla jednej migawki.',
      'instantaneas.sin_espacio':
        'Za mało wolnego miejsca na migawkę: wymagane jest {necesarios} MB, a dostępne jest {libres} MB.',
      'instantaneas.limite':
        'Osiągnięto limit {maximo} migawek dla tej bazy: należy usunąć jedną z nich, aby utworzyć nową.',
      'instantaneas.tomar_fallo': 'Nie udało się utworzyć migawki. Baza danych pozostała bez zmian.',
      'instantaneas.huella_no_coincide':
        'Plik migawki uległ zmianie lub jest uszkodzony: nic nie zostało przywrócone.',
      'instantaneas.respaldo_previo_fallo':
        'Nie udało się zapisać bieżącego stanu bazy danych: nic nie zostało przywrócone.',
      'instantaneas.restauracion_fallo':
        'Nie udało się przywrócić migawki. Baza wróciła do poprzedniego stanu. Powód: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Nie udało się przywrócić migawki, a poprzedni stan nie został zapisany: baza może być pusta lub niekompletna. Powód: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Nie udało się przywrócić migawki ani wrócić do poprzedniego stanu. Ten stan został zapisany w automatycznej migawce {respaldo}: można do niej wrócić w sekcji Migawki.',
    },
  },
  instantaneas: {
    abrir: 'Migawki',
    titulo: (base: string) => `Migawki bazy ${base}`,
    ayuda:
      'Migawka zapisuje bazę danych w jej bieżącym stanie. Można do niej wrócić w dowolnym momencie: przed przywróceniem automatycznie zapisywana jest migawka bieżącego stanu.',
    ubicacion:
      'Migawki są zapisywane w folderze danych WolfCore Dev i są dostępne do odczytu wyłącznie dla bieżącego użytkownika. Usługi i ich dane pozostają nienaruszone.',
    notaEtiqueta: 'Notatka (opcjonalnie)',
    notaMarcador: 'Na przykład: przed migracją',
    tomar: 'Utwórz migawkę',
    tomada: 'Migawka została zapisana',
    cargando: 'Wczytywanie migawek…',
    vacio: 'Ta baza danych nie ma jeszcze żadnych migawek.',
    automatica: 'Automatyczna',
    sinNota: 'Bez notatki',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${plural(tablas, 'tabela', 'tabele', 'tabel')} · ${tamano}`,
    volver: 'Przywróć tę migawkę',
    borrar: 'Usuń',
    borrada: 'Migawka została przeniesiona do kosza',
    papelera:
      'Usunięte migawki można odzyskać w ciągu 7 dni z kosza WolfCore Dev.',
    cerrar: 'Zamknij',
    papeleraTitulo: 'Kosz',
    papeleraVacia: 'Brak migawek w koszu.',
    recuperar: 'Odzyskaj',
    recuperada: 'Migawka została odzyskana',
    borradaEl: (fecha: string) => `Usunięta ${fecha}`,
    borrarPregunta: 'Przenieść tę migawkę do kosza?',
    borrarSi: 'Przenieś do kosza',
    notaAutomatica: (fecha: string) =>
      `Poprzedni stan, zapisany przed powrotem do migawki z ${fecha}`,
    notaAutomaticaSinOrigen: 'Poprzedni stan, zapisany przed powrotem do innej migawki',
    extensionesAviso: (lista: string) =>
      `Zawiera rozszerzenia PostgreSQL (${lista}), które są przywracane wyłącznie z rejestrem sum kontrolnych tego komputera.`,
    limites:
      'W MySQL i MariaDB zapisywane są również procedury, wyzwalacze i zdarzenia. W PostgreSQL jest to skompresowany zrzut pojedynczej bazy danych: nie obejmuje ról ani użytkowników serwera. Migawka, której pochodzenia z tego komputera nie można zweryfikować, jest przywracana przez użytkownika ograniczonego do tej bazy, bez obsługi widoków, procedur i wyzwalaczy innych użytkowników.',
    basesBorradas: 'Migawki baz danych, które już nie istnieją',
    basesBorradasAyuda: 'Proszę wybrać bazę danych, aby odtworzyć ją z jej migawki.',
    dialogoVolver: {
      titulo: (base: string) => `Przywrócenie migawki bazy ${base}`,
      cargando: 'Przygotowywanie podglądu…',
      base: 'Baza',
      instantanea: 'Migawka',
      ahora: 'Teraz',
      tamano: 'Rozmiar',
      tablas: 'Tabele',
      nota: 'Notatka',
      aviso: (base: string) =>
        `Baza danych ${base} zostanie w całości zastąpiona tą migawką: wszystkie późniejsze zmiany w bazie zostaną utracone. Wcześniej zostanie zapisana automatyczna migawka bieżącego stanu; w razie błędu baza sama wróci do tego stanu.`,
      pedir: (base: string) => `Aby potwierdzić, proszę wpisać ${base}`,
      confirmar: 'Przywróć tę migawkę',
      trabajando: (base: string) => `Przywracanie ${base}… Proszę nie zamykać programu do zakończenia operacji.`,
      hecho: (base: string) => `Baza ${base} została przywrócona do migawki`,
      respaldoPrevio: 'Poprzedni stan został zapisany w automatycznej migawce z',
      advertencias: 'Przywracanie zakończyło się z ostrzeżeniami:',
      hechoConAvisos: (base: string) => `Baza ${base} została przywrócona do migawki z ostrzeżeniami`,
      baseVacia: 'Baza danych nie istnieje lub jest pusta: nie ma nic do zapisania przed przywróceniem.',
      sinGuardarTitulo: 'Nie udało się zapisać bieżącego stanu',
      sinGuardarTexto:
        'WolfCore Dev nie zdołał zapisać bieżącego stanu bazy danych przed przywróceniem. Kontynuowanie BEZ zapisania kopii w przypadku błędu przywracania spowoduje utratę bieżących danych bazy.',
      sinGuardarConfirmar: 'Rozumiem, że bieżące dane bazy zostaną utracone',
      sinGuardarBoton: 'Przywróć bez zapisywania bieżącego stanu',
    },
  },
  avisoInicio: {
    titulo: 'Powiadomienie WolfCore Dev',
  },
  tareas: {
    titulo: 'Zadania zaplanowane',
    resumen: (n: number) => (n === 0 ? 'Brak zadań' : `${n} ${plural(n, 'zadanie', 'zadania', 'zadań')}`),
    mostrar: 'Pokaż zadania',
    ocultar: 'Ukryj',
    cargando: 'Wczytywanie zadań',
    errorCargar: 'Nie udało się wczytać zadań',
    soloAbierta:
      'Zadania działają wyłącznie, gdy aplikacja WolfCore Dev jest otwarta. Nie korzystają z Harmonogramu zadań systemu Windows: gdy aplikacja jest zamknięta lub komputer jest uśpiony, zadania nie są uruchamiane, a pominięte uruchomienia nie są nadrabiane.',
    repoEjecuta:
      'W zaufanym projekcie kod z repozytorium jest wykonywany bezpośrednio: plik wskazany w zadaniu, `artisan`, skrypty z `package.json`, `.venv`… Jeśli ulegną zmianie po `git pull`, zadanie uruchomi nową wersję.',
    vacio:
      'Ten projekt nie ma zaplanowanych zadań. Można utworzyć nowe (na przykład „php artisan schedule:run” co minutę w projekcie Laravel).',
    nueva: 'Nowe zadanie',
    pausada: 'wstrzymane',
    enCurso: 'Wykonywanie…',
    nunca: 'Jeszcze nie uruchomiono',
    ultima: (f: string) => `Ostatnie: ${f}`,
    proxima: (f: string) => `następne: ${f}`,
    codigo: (n: number) => `kod ${n}`,
    resultadoTitulo: (n: string) => `„${n}”`,
    origen: { usuario: 'utworzone tutaj', 'wolfcore.yml': 'z wolfcore.yml' },
    describir: {
      cadaMinuto: 'Co minutę',
      cadaN: (n: number) => `Co ${n} ${plural(n, 'minutę', 'minuty', 'minut')}`,
      cadaHora: 'Co godzinę, o pełnej godzinie',
      diaria: (h: string) => `Codziennie o ${h}`,
      laborables: (h: string) => `Od poniedziałku do piątku o ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Powodzenie',
      fallo: 'Błąd',
      tiempo: 'Przekroczono limit czasu',
      cancelada: 'Anulowane',
      omitida: 'Pominięte',
      bloqueada: 'Nie uruchomiono',
    },
    motivo: {
      aislado:
        'To jest testowy folder danych (WOLFCORE_DATOS): zadania nie działają do czasu zezwolenia na nie w tej sesji.',
      no_confiado:
        'Projekt nie jest oznaczony jako zaufany: należy zaznaczyć opcję „Ufam temu repozytorium”, aby uruchomić zadanie.',
      receta_cambio:
        'Konfiguracja projektu zmieniła się od czasu udzielenia zaufania: proszę ją przejrzeć i ponownie zaznaczyć „Ufam temu repozytorium”.',
      sin_confirmar: 'Polecenie wymaga potwierdzenia: nie zostanie uruchomione do czasu jego sprawdzenia i potwierdzenia.',
      comando_invalido: 'To polecenie jest niedozwolone (dozwolone są wyłącznie php, node, npm run i python).',
      cron_invalida: 'Harmonogram nie jest prawidłowym wyrażeniem cron.',
      carpeta: 'Folder projektu nie istnieje.',
      solapada: 'Poprzednie uruchomienie nadal trwa: to zostało pominięte.',
      retraso: 'Uruchomienie było opóźnione (aplikacja była wstrzymana): nie zostanie nadrobione.',
      error: 'Nie udało się uruchomić programu.',
    },
    acciones: {
      ejecutar: 'Uruchom teraz',
      editar: 'Edytuj',
      borrar: 'Usuń',
      verRegistro: 'Pokaż dziennik',
      revisarConfirmar: 'Sprawdź i potwierdź',
      activar: (n: string) => `Aktywuj zadanie ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Usunąć „${n}”?`,
      texto:
        'Zadanie i jego historia zostaną usunięte. Dotychczasowe efekty uruchomień nie zostaną cofnięte, a pliki projektu pozostaną bez zmian.',
      confirmar: 'Usuń',
      hecho: (n: string) => `Usunięto zadanie „${n}”.`,
    },
    aislado: {
      titulo: 'Testowy folder danych.',
      texto:
        'Przy ustawionym WOLFCORE_DATOS żadne zadanie nie uruchamia się automatycznie. Należy zezwolić na zadania wyłącznie w celu ich przetestowania w tej sesji.',
      permitir: 'Zezwól w tej sesji',
      confirmarTitulo: 'Zezwolić na zadania w tym folderze testowym?',
      confirmarTexto:
        'Aktywne zadania zaufanych projektów zaczną się uruchamiać aż do zamknięcia aplikacji. Polecenia pochodzą z poszczególnych projektów i są wykonywane w ich rzeczywistych folderach.',
      permitido: 'Zezwolono na zadania w tej sesji.',
    },
    yml: {
      titulo: 'Propozycje z wolfcore.yml',
      texto:
        'Plik projektu proponuje poniższe zadania. Samo zapisanie ich w pliku nie powoduje ich uruchomienia: należy sprawdzić polecenie i potwierdzić jego przyjęcie.',
      estado: { nueva: 'Nowe', adoptada: 'Przyjęte', cambiada: 'Zmienione' },
      revisar: 'Sprawdź i przyjmij',
      cambiada:
        'Polecenie w wolfcore.yml zmieniło się od czasu przyjęcia zadania. Zadanie projektu nadal używa wcześniej potwierdzonego polecenia; można przyjąć nową wersję, jeśli jest rozpoznawalna.',
      guardarEn: 'Zapisz w wolfcore.yml',
      escribirTitulo: 'Zapisać zadanie w wolfcore.yml?',
      escribirTexto:
        'Zadanie zostanie dodane lub zaktualizowane w pliku projektu (bez modyfikowania pozostałej zawartości), aby było przechowywane w repozytorium. Każda osoba klonująca repozytorium będzie musiała je potwierdzić na swoim komputerze.',
      escribir: 'Zapisz',
      escrita: 'Zadanie zostało zapisane w wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Dziennik zadania „${n}”`,
      historial: 'Ostatnie uruchomienia',
      sinHistorial: 'Brak dotychczasowych uruchomień.',
      salida: 'Wynik ostatniego uruchomienia',
      sinSalida: 'Brak zapisanego wyniku.',
      enmascarado:
        'Dzienniki ukrywają hasła i klucze, mają ograniczony rozmiar i są automatycznie rotowane.',
      origen: { programada: 'zaplanowane', manual: 'ręczne' },
    },
    dialogo: {
      tituloNueva: 'Nowe zadanie zaplanowane',
      tituloEditar: 'Edytuj zadanie zaplanowane',
      tituloAdoptar: 'Przyjmij zadanie z wolfcore.yml',
      tituloConfirmar: 'Potwierdź polecenie zadania',
      nombre: 'Nazwa',
      nombrePlaceholder: 'Zadania Laravel',
      horario: 'Kiedy',
      preset: {
        cadaMinuto: 'Co minutę',
        cadaN: 'Co kilka minut',
        cadaHora: 'Co godzinę',
        diaria: 'Codziennie o wybranej godzinie',
        laborables: 'Od poniedziałku do piątku o wybranej godzinie',
        personalizada: 'Własne wyrażenie cron',
      },
      cadaNOpcion: (n: number) => `Co ${n} ${plural(n, 'minutę', 'minuty', 'minut')}`,
      hora: 'Godzina',
      horaPlaceholder: '03:00',
      horaInvalida: 'Proszę podać prawidłową godzinę, na przykład 03:00.',
      expresion: 'Wyrażenie cron',
      cronEquivale: 'Wyrażenie cron:',
      expresionAyuda:
        '5 pól: minuta, godzina, dzień miesiąca, miesiąc i dzień tygodnia (* , - /). Minimum raz na minutę.',
      proximas: 'Najbliższe uruchomienia:',
      comando: 'Polecenie',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Wyłącznie php, node, npm run oraz python z plikiem z projektu. Wykonywane w folderze projektu, bez powłoki i bez kodu w linii poleceń (-r, -e, -c).',
      comandoFijo:
        'To polecenie zawiera argumenty w cudzysłowach, których nie można zapisać jako zwykły tekst: zostało zachowane bez zmian i nie podlega edycji (aby je zmienić, należy usunąć zadanie i utworzyć nowe).',
      argumentos: 'Zostanie uruchomione z następującymi argumentami:',
      comillasSinCerrar: 'Brakuje zamknięcia cudzysłowu.',
      tiempo: 'Limit czasu',
      minutos: 'min',
      tiempoAyuda: 'Po przekroczeniu tego czasu zadanie zatrzyma się samo (wyłącznie ten proces i jego procesy potomne).',
      activa: 'Aktywne (działa automatycznie, gdy aplikacja jest otwarta)',
      advertencia:
        'Zatwierdzenie oznacza autoryzację dokładnie tego polecenia: będzie ono uruchamiane automatycznie w folderze tego projektu zgodnie z harmonogramem. Każda zmiana wymaga ponownego potwierdzenia.',
      revise: 'Polecenie zostało sprawdzone i jest znane.',
      guardar: 'Zapisz i potwierdź polecenie',
      adoptar: 'Potwierdź i przyjmij',
      confirmar: 'Potwierdź polecenie',
      guardada: 'Zadanie zostało zapisane.',
      adoptada: 'Zadanie zostało przyjęte.',
      confirmada: 'Polecenie zostało potwierdzone.',
    },
  },
  workspaces: {
    titulo: 'Obszary robocze',
    descripcion:
      'Nazwane zestawy baz danych, usług i procesów uruchamiane i zatrzymywane razem.',
    nuevo: 'Nowy obszar roboczy',
    vacio:
      'Brak obszarów roboczych. Można utworzyć pierwszy, na przykład „Bot FastAPI” z PostgreSQL, Redis, Ollama oraz procesem projektu.',
    elementos: (n: number) => `${n} ${plural(n, 'element', 'elementy', 'elementów')}`,
    sinElementos: 'Brak elementów',
    estado: { apagado: 'Zatrzymany', parcial: 'Częściowo', encendido: 'Uruchomiony' },
    acciones: {
      iniciar: 'Uruchom',
      detener: 'Zatrzymaj',
      editar: 'Edytuj',
      borrar: 'Usuń',
      cerrar: 'Zamknij',
    },
    borrar: {
      titulo: (n: string) => `Usunąć „${n}”?`,
      texto:
        'Usunięcie obszaru roboczego nic nie zatrzymuje ani nie usuwa: usuwa jedynie sam zestaw. Działające elementy pozostają uruchomione.',
      confirmar: 'Usuń',
      hecho: (n: string) => `Usunięto obszar roboczy „${n}”.`,
    },
    dialogo: {
      tituloNuevo: 'Nowy obszar roboczy',
      tituloEditar: 'Edytuj obszar roboczy',
      nombre: 'Nazwa',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Proszę podać nazwę.',
      aviso:
        'Obszar roboczy zapisuje wyłącznie listę elementów do uruchomienia. Nie otwiera tuneli, nie udostępnia w sieci lokalnej i nie uruchamia procesów niezaufanych projektów.',
      secciones: {
        instancias: 'Bazy danych',
        servicios: 'Usługi',
        procesos: 'Procesy projektów',
      },
      sinOpciones: 'Brak elementów do wyboru.',
      captadorUnico: 'Jednocześnie może działać tylko jeden przechwytujący serwer poczty: wybór innego zastępuje poprzedni.',
      yaNoExisten: (lista: string) => `Już nie istnieją i zostaną usunięte przy zapisie: ${lista}`,
      guardar: 'Zapisz',
      guardado: (n: string) => `Zapisano obszar roboczy „${n}”.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `„${n}”: wynik uruchamiania`,
      tituloDetener: (n: string) => `„${n}”: wynik zatrzymywania`,
      encendido: 'Uruchomiono',
      apagado: 'Zatrzymano',
      yaEncendido: 'Już działało',
      yaApagado: 'Już było zatrzymane',
      noExiste: 'Już nie istnieje: pominięto',
      compartido: 'Nadal działa: używane przez inny uruchomiony obszar roboczy',
      reemplaza: (otro: string) => `Uruchomiono; zatrzymano ${otro} z tej samej grupy poczty`,
      fallo: 'Nie udało się uruchomić',
      falloApagar: 'Nadal działa',
      ok: (n: string) => `„${n}” gotowe.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `„${n}”: uruchomiono ${encendidos} z ${total}. Proszę sprawdzić, co się nie uruchomiło.`,
      parcialApagar: (n: string, siguen: number) =>
        `„${n}”: ${siguen} ${plural(siguen, 'element nadal działa', 'elementy nadal działają', 'elementów nadal działa')}. Proszę sprawdzić, co się nie zatrzymało.`,
    },
  },
  inicio: {
    titulo: 'Start',
    bienvenida: 'Środowisko programistyczne w jednym miejscu.',
    tiles: {
      servicios: 'Uruchomione usługi',
      serviciosDe: (total: number) => `z ${total}`,
      sitios: 'Projekty',
      tuneles: 'Aktywne tunele',
      hosts: 'Oczekujące wpisy hosts',
      hostsOk: 'Wszystko w porządku',
      hostsFaltan: 'Wymaga uwagi',
    },
    hosts: {
      titulo: 'Niektóre domeny nie są zapisane w pliku hosts',
      texto:
        'Te domeny nie wskazują jeszcze na ten komputer. Podczas aktualizacji system Windows poprosi o uprawnienia administratora.',
      corregir: 'Zastosuj oczekujące wpisy hosts',
      reintentarPermiso: 'Ponów z uprawnieniami',
      corregido: 'Plik hosts został zaktualizowany',
      fallo: 'Nie udało się zaktualizować pliku hosts',
      verInstrucciones: 'Pokaż instrukcje',
      duplicados:
        'Te domeny znajdują się już w pliku hosts poza blokiem WolfCore Dev (zostaną zachowane):',
      motivos: {
        cancelado: 'Anulowano uprawnienia administratora. Plik hosts pozostał bez zmian.',
        tiempo:
          'Nie potwierdzono uprawnień administratora na czas. Strona została zapisana, ale plik hosts pozostał bez zmian. Jeśli powiadomienie systemu Windows jest nadal widoczne, należy je anulować (nie przyniesie już efektu). Oczekujące wpisy można zastosować później (jedno potwierdzenie dla wszystkich).',
        denegado:
          'System Windows nie zezwolił na zapis do pliku hosts. Możliwe, że blokuje go program antywirusowy.',
      } as Record<string, string>,
      modalTitulo: 'Ręczna aktualizacja pliku hosts',
      modalTexto:
        'Proszę otworzyć PowerShell jako administrator (prawy przycisk myszy na Start → Terminal (administrator)), wkleić poniższe polecenie i nacisnąć Enter.',
    },
    servicios: {
      titulo: 'Usługi',
      ver: 'Pokaż usługi',
      vacio: 'Nie zainstalowano jeszcze żadnych usług.',
    },
    tuneles: {
      titulo: 'Aktywne tunele',
      vacio: 'Brak otwartych tuneli. Tunel można otworzyć w sekcji Projekty.',
      sitioDesconocido: 'Strona bez nazwy',
    },
  },
  servicios: {
    titulo: 'Usługi',
    descripcion:
      'Uruchamianie i zatrzymywanie serwera WWW, PHP, baz danych oraz narzędzi. Stan odświeża się automatycznie.',
    grupos: {
      web: 'WWW',
      php: 'PHP',
      bd: 'Bazy danych',
      correo: 'Poczta',
      ia: 'AI',
      herramientas: 'Narzędzia',
    },
    gruposAyuda: {
      web: 'Serwer obsługujący domeny .test.',
      php: 'Jedna instalacja na wersję (8.3, 8.4…); każda strona używa własnej.',
      bd: 'Nasłuchują wyłącznie na adresie 127.0.0.1.',
      correo: 'Przechwytuje wiadomości e-mail wysyłane przez projekty, bez wysyłania ich do internetu.',
      ia: 'Lokalne modele językowe na tym komputerze.',
      herramientas: 'Narzędzia do codziennej pracy.',
    },
    puerto: 'Port',
    cambiarPuerto: 'Zmień port',
    cambiarPuertoDe: (nombre: string) => `Zmień port usługi ${nombre}`,
    versionesDe: (nombre: string) => `Wersje usługi ${nombre}`,
    instancias: (n: number, encendidas: number) =>
      `${n} ${plural(n, 'instancja', 'instancje', 'instancji')}, ${encendidas} ${plural(encendidas, 'uruchomiona', 'uruchomione', 'uruchomionych')}`,
    usarPuerto: (p: number) => `Użyj portu ${p}`,
    puertoCambiado: (nombre: string, p: number) => `Usługa ${nombre} używa teraz portu ${p}`,
    conflicto: 'Port zajęty',
    autoIniciar: 'Uruchamiaj przy starcie WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `Usługa ${nombre} będzie uruchamiana przy starcie WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `Usługa ${nombre} nie będzie już uruchamiana przy starcie WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Port usługi ${nombre}`,
      etiqueta: 'Nowy port',
      ayuda:
        'Wolny port z zakresu od 1024 do 65535. Jeśli usługa jest uruchomiona, zostanie uruchomiona ponownie. Należy zaktualizować plik .env w projektach.',
      rango: 'Proszę podać liczbę z zakresu od 1024 do 65535',
      igual: 'To jest bieżący port',
      guardar: 'Zmień port',
    },
    borrarDatos: {
      opcion: 'Usuń dane',
      titulo: (nombre: string) => `Usuń dane usługi ${nombre}`,
      copias: (n: number, tam: string) =>
        `${plural(n, 'Zostanie również usunięta 1 kopia zapasowa', `Zostaną również usunięte ${n} kopie zapasowe`, `Zostanie również usuniętych ${n} kopii zapasowych`)} z aktualizacji (${tam}). Aby zachować te pliki, należy je wcześniej skopiować z folderu danych.`,
      /** Co zostaje usunięte, zależnie od usługi. */
      que: {
        mysql: 'wszystkie bazy danych i użytkownicy MySQL',
        mariadb: 'wszystkie bazy danych i użytkownicy MariaDB',
        postgresql: 'wszystkie bazy danych i użytkownicy PostgreSQL',
        redis: 'wszystkie klucze i dane zapisane w Redis',
        mongodb: 'wszystkie bazy danych, kolekcje i dane MongoDB',
        mailpit: 'wszystkie wiadomości przechwycone przez Mailpit',
        smtp4dev: 'wszystkie wiadomości przechwycone przez smtp4dev',
        inbucket: 'wszystkie wiadomości przechwycone przez Inbucket',
        papercut: 'wszystkie wiadomości przechwycone przez Papercut SMTP',
        ollama: 'wszystkie pobrane modele Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `Zostaną usunięte: ${que}. Tej operacji nie można cofnąć. Program pozostanie zainstalowany.`,
      generico: (nombre: string) => `wszystkie dane usługi ${nombre}`,
      pedir: (id: string) => `Aby potwierdzić, proszę wpisać ${id}`,
      boton: 'Usunąć dane',
      hecho: (nombre: string) => `Dane usługi ${nombre} zostały usunięte`,
    },
    ftp: {
      interruptor: 'Serwer FTP',
      redLocal: 'Zezwolić na połączenia z sieci lokalnej',
      redLocalAyuda:
        'Gdy wyłączone, łączyć się może tylko ten komputer (127.0.0.1). Każda strona włącza dostęp w sekcji Strony.',
      avisoTitulo: 'Otwarcie FTP dla sieci lokalnej',
      avisoTexto:
        'Protokół FTP przesyła nazwy użytkowników, hasła i pliki bez szyfrowania. Każdy komputer w sieci lokalnej będzie mógł próbować się połączyć. Należy używać tej opcji wyłącznie w zaufanej sieci.',
      avisoConfirmar: 'Zezwolić',
      redLocalActivada: 'FTP akceptuje połączenia z sieci lokalnej',
      redLocalDesactivada: 'FTP akceptuje połączenia tylko z tego komputera',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Menedżer zależności PHP',
      instalado: 'Zainstalowano',
      noInstalado: 'Nie zainstalowano',
      sinVersion: 'niezainstalowany',
      uso: 'Użycie',
      usoTexto: 'composer',
      ayuda: 'Proszę użyć opcji „Terminal” w projekcie lub dodać WolfCore Dev do zmiennej PATH w Ustawieniach.',
      instaladoOk: 'Zainstalowano Composer',
      sinPhp: 'Najpierw należy zainstalować PHP',
      actualizado: (v: string) => `Zaktualizowano Composer: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Webowy panel administracyjny baz danych',
      direccion: 'Adres',
      disponible: 'Gotowe',
      noInstalado: 'Nie zainstalowano',
      sinPhp: 'Brak PHP',
      abrir: 'Otworzyć Adminer',
      instaladoOk: 'Zainstalowano Adminer',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Webowy panel administracyjny MySQL i MariaDB',
      direccion: 'Adres',
      disponible: 'Gotowe',
      noInstalado: 'Nie zainstalowano',
      sinPhp: 'Brak PHP',
      abrirDesdeProyecto: 'Otwierane z karty każdego projektu, już po uwierzytelnieniu.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} nie ma włączonego rozszerzenia ${ext}. Proszę uruchomić ponownie PHP lub włączyć je w pliku php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin deklaruje wsparcie do PHP 8.3, a obecnie używana jest wersja PHP ${rama}: mogą wystąpić błędy. W razie problemów proszę uruchomić wersję PHP od 7.2 do 8.3.`,
      instalarPrimero: 'Aby używać phpMyAdmin, należy go najpierw zainstalować.',
      encenderPhp: 'Aby używać phpMyAdmin, należy uruchomić PHP.',
      instaladoOk: 'Zainstalowano phpMyAdmin',
    },
    puertos: 'Porty',
    pid: 'PID',
    sinVersion: 'brak wersji',
    sinPuertos: '—',
    terminado: 'Zakończono bez błędów',
    externo: 'Zarządzane poza WolfCore Dev',
    verDetalle: 'Wyświetlić szczegóły błędu',
    vacioTitulo: 'Brak usług',
    vacio:
      'Nie zainstalowano jeszcze żadnych usług. Warto zacząć od Nginx i PHP dla swoich stron albo od bazy danych.',
    irAInstalar: 'Przejść do instalacji',
  },
  bd: {
    descripcion:
      'Tworzenie, tworzenie kopii zapasowych i przywracanie baz danych projektów. Serwery nasłuchują wyłącznie na 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Nowa baza',
    restaurar: 'Przywrócić kopię zapasową',
    importar: 'Importować z innego serwera',
    soloSql: 'Dostępne w MySQL, MariaDB i PostgreSQL',
    enCursoAyuda: 'Proszę poczekać na zakończenie bieżącej operacji',
    encenderPrimero: (motor: string) => `Najpierw należy uruchomić ${motor}`,
    cargando: 'Ładowanie baz danych…',
    recargar: 'Odświeżyć listę',
    vacioTitulo: 'Nie zainstalowano żadnego serwera baz danych',
    vacio:
      'Aby zarządzać bazami danych, należy zainstalować MySQL, MariaDB, PostgreSQL lub MongoDB w sekcji Usługi.',
    irAServicios: 'Przejść do Usług',
    apagado: {
      titulo: (motor: string) => `${motor} jest wyłączony`,
      texto: (motor: string) => `Należy uruchomić ${motor}, aby przeglądać i zarządzać bazami danych.`,
      iniciando: (motor: string) => `Uruchamianie ${motor}…`,
      error: (motor: string) => `Nie udało się uruchomić ${motor}`,
      encender: (motor: string) => `Uruchomić ${motor}`,
      verServicios: 'Wyświetlić w Usługach',
    },
    errorLista: 'Nie udało się odczytać listy baz danych',
    sinBases: 'Ten serwer nie ma jeszcze własnych baz danych.',
    total: (n: number) => plural(n, 'baza', 'bazy', 'baz'),
    columnas: { nombre: 'Baza', tamano: 'Rozmiar', acciones: 'Akcje' },
    acciones: {
      respaldar: 'Utworzyć kopię zapasową',
      restaurarAqui: 'Przywrócić tutaj',
      adminer: 'Otworzyć w Adminer',
      conexion: 'Dane połączenia',
      vector: 'Włączyć vector',
      borrar: 'Usunąć',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Aby otworzyć, należy zainstalować Adminer i PHP w Usługach',
    vectorSinInstalar: 'Aby włączyć w bazie, należy najpierw zainstalować pgvector poniżej',
    vectorActivado: (base: string) => `Włączono vector w bazie ${base}`,
    formatos: {
      sql: 'Zwykły plik SQL',
      pgdump: 'Kopia zapasowa PostgreSQL (pg_dump, format niestandardowy)',
      gz: 'Skompresowany SQL (.gz)',
      zip: 'Plik .zip (rozpakowywany przed przywróceniem)',
      rar: 'Plik .rar (próba rozpakowania przez Windows)',
      '7z': 'Plik .7z (próba rozpakowania przez Windows)',
      desconocido: 'Nierozpoznany format',
    } as Record<string, string>,
    formatoDesconocido:
      'Nie rozpoznano formatu. Jeśli jest to plik skompresowany, proszę go rozpakować i wybrać zawarty w nim plik .sql lub .dump.',
    formatoIncompatible:
      'Ten plik jest kopią zapasową PostgreSQL: należy przywrócić go na karcie PostgreSQL.',
    nombre: {
      etiqueta: 'Nazwa bazy',
      vacio: 'Proszę wpisać nazwę',
      largo: 'Nazwa jest za długa',
      caracteres: {
        mysql: 'Dozwolone są wyłącznie litery, cyfry i podkreślenie',
        mariadb: 'Dozwolone są wyłącznie litery, cyfry i podkreślenie',
        postgresql: 'Dozwolone są małe litery, cyfry i podkreślenie',
        mongodb: 'Dozwolone są wyłącznie litery, cyfry, myślnik i podkreślenie',
      } as Record<string, string>,
      inicio: 'W PostgreSQL nazwa nie może zaczynać się od cyfry',
    },
    reemplazo: {
      titulo: (base: string) => `Baza ${base} zawiera już tabele`,
      texto: (base: string) =>
        `Kontynuacja spowoduje całkowite ZASTĄPIENIE obecnej bazy ${base}. Najpierw zostanie zapisana automatyczna kopia zapasowa, a następnie baza zostanie usunięta i utworzona ponownie z nową zawartością.`,
      donde: 'Kopia zapasowa zostanie zapisana w',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'Aby uniknąć zastąpienia, proszę wrócić i wybrać inną nazwę — zostanie utworzona nowa baza.',
      pedir: (base: string) => `Aby potwierdzić, proszę wpisać ${base}`,
      volver: 'Wrócić',
      confirmar: 'Zastąpić bazę',
    },
    resultado: {
      restaurada: (base: string) => `Przywrócono bazę ${base}`,
      importada: (base: string) => `Zaimportowano bazę ${base}`,
      respaldada: (base: string) => `Zapisano kopię zapasową bazy ${base}`,
      archivo: 'Plik',
      respaldoPrevio: 'Kopia zapasowa poprzedniej bazy',
      advertencias: (n: number) => plural(n, 'ostrzeżenie', 'ostrzeżenia', 'ostrzeżeń'),
      advertenciasAyuda:
        'Operacja zakończona. Proszę przejrzeć te powiadomienia — zazwyczaj dotyczą ról lub uprawnień nieistniejących na tym komputerze.',
      fallo: {
        restaurar: 'Nie udało się przywrócić',
        importar: 'Nie udało się zaimportować',
        respaldar: 'Nie udało się utworzyć kopii zapasowej',
      } as Record<string, string>,
      trasReemplazo: 'Oryginalna baza została zastąpiona, a przywracanie nie zostało ukończone',
      trasReemplazoAyuda:
        'Poprzednie dane znajdują się we wskazanej kopii zapasowej. Można ją przywrócić za pomocą opcji „Przywrócić kopię zapasową”.',
    },
    progreso: {
      titulo: 'Dziennik',
      corriendo: {
        restaurar: (base: string) => `Przywracanie ${base}…`,
        importar: (base: string) => `Importowanie ${base}…`,
        respaldar: (base: string) => `Tworzenie kopii zapasowej ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Oczekiwanie na dane wyjściowe narzędzia…',
      limitado: (n: number) => `Wyświetlono ostatnie ${n} linii.`,
      noCierre:
        'Nie należy zamykać programu do zakończenia operacji. Można opuścić ten ekran i wrócić później — wynik będzie widoczny tutaj.',
      otraEnCurso: 'Trwa już inna operacja; proszę poczekać na jej zakończenie.',
      ver: 'Wyświetlić szczegóły',
      descartar: 'Odrzucić',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Przywracanie kopii zapasowej w ${motor}`,
      confianza:
        'Należy przywracać wyłącznie zaufane kopie zapasowe: kopia zapasowa może wykonywać polecenia na serwerze.',
      archivo: 'Plik kopii zapasowej',
      elegir: 'Wybrać plik…',
      cambiar: 'Zmienić',
      sinArchivo: 'Nie wybrano pliku',
      formato: 'Wykryty format',
      detectando: 'Wykrywanie formatu…',
      destino: 'Baza docelowa',
      destinoAyuda:
        'Jeśli nie istnieje, zostanie utworzona. Jeśli istnieje i jest pusta, zostanie użyta. Jeśli zawiera tabele, wymagane będzie potwierdzenie.',
      restaurar: 'Przywrócić',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Import do ${motor} z innego serwera`,
      soloLectura:
        'Serwer źródłowy jest wyłącznie odczytywany: baza zostaje skopiowana na ten komputer bez modyfikowania źródła.',
      detectado: (puerto: number) =>
        `Wykryto inny serwer na porcie ${puerto} (na przykład z FlyEnv).`,
      origen: 'Serwer źródłowy',
      host: 'Serwer',
      puerto: 'Port',
      usuario: 'Użytkownik',
      clave: 'Hasło',
      claveAyuda: 'Używane wyłącznie do tej kopii i nie jest zapisywane.',
      baseOrigen: 'Baza źródłowa',
      destino: 'Baza docelowa na tym komputerze',
      destinoAyuda:
        'Jeśli nie istnieje, zostanie utworzona. Jeśli zawiera tabele, wymagane będzie potwierdzenie przed jej zastąpieniem.',
      faltaHost: 'Proszę wpisać adres serwera',
      faltaPuerto: 'Proszę użyć portu z zakresu od 1 do 65535',
      faltaUsuario: 'Proszę wpisać nazwę użytkownika',
      faltaBase: 'Proszę wpisać nazwę bazy źródłowej',
      importar: 'Importować',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Nowa baza w ${motor}`,
      codificacion: 'Kodowanie',
      codificacionValor: {
        mysql: 'utf8mb4 (obsługuje emoji i wszystkie znaki diakrytyczne)',
        mariadb: 'utf8mb4 (obsługuje emoji i wszystkie znaki diakrytyczne)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Utworzyć dedykowanego użytkownika dla tej bazy',
      usuarioPropioAyuda:
        'Opcjonalne. W przeciwnym razie projekty korzystają z konta administratora serwera.',
      usuario: 'Użytkownik',
      clave: 'Hasło',
      faltaClave: 'Proszę wpisać hasło',
      crear: 'Utworzyć bazę',
      creada: (base: string) => `Utworzono bazę ${base}`,
      mongo: 'W MongoDB baza jest tworzona z początkową kolekcją (_pel_init).',
      cambiarClave: 'Zmienić hasło',
      cambiarClaveTitulo: (u: string) => `Użytkownik ${u} już istnieje z innym hasłem`,
      cambiarClaveTexto: (u: string) =>
        `Zmiana hasła użytkownika ${u} spowoduje, że projekty, które już z niego korzystają, utracą połączenie do czasu aktualizacji pliku .env. Zazwyczaj lepiej użyć obecnego hasła. Czy mimo to zmienić hasło?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Czy usunąć bazę ${base}?`,
      texto: (base: string, motor: string) =>
        `Baza ${base} w ${motor} oraz wszystkie jej dane zostaną usunięte. Tej operacji nie można cofnąć. W razie potrzeby należy wcześniej utworzyć kopię zapasową.`,
      pedir: (base: string) => `Aby potwierdzić, proszę wpisać ${base}`,
      boton: 'Usunąć bazę',
      hecho: (base: string) => `Usunięto bazę ${base}`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Kopia zapasowa ${base}`,
      destino: 'Zostanie zapisana w',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (folder domyślny)',
      porDefectoEn: (carpeta: string) => `${carpeta} (folder domyślny)`,
      cambiar: 'Wybrać inny folder…',
      porDefectoVolver: 'Użyć folderu domyślnego',
      formato: {
        mysql: 'Plik .sql (mysqldump z procedurami i wyzwalaczami)',
        mariadb: 'Plik .sql (mysqldump z procedurami i wyzwalaczami)',
        postgresql: 'Plik .dump (pg_dump, format niestandardowy)',
      } as Record<string, string>,
      boton: 'Utworzyć kopię zapasową',
    },
    dialogoConexion: {
      sitio: 'Projekt',
      sitioAyuda:
        'Plik .env strony jest odczytywany w celu użycia istniejących zmiennych (na przykład CodeIgniter 4). Jego zawartość nie jest wyświetlana ani kopiowana.',
      generico: 'Ogólny (format Laravel)',
      titulo: (base: string) => `Połączenie z ${base}`,
      host: 'Serwer',
      puerto: 'Port',
      usuario: 'Użytkownik',
      clave: 'Hasło',
      base: 'Baza',
      sinClave: 'Brak hasła (nasłuchuje tylko na 127.0.0.1)',
      mostrar: 'Pokazać hasło',
      ocultar: 'Ukryć hasło',
      copiarDato: (dato: string) => `Kopiować: ${dato}`,
      env: 'Blok do pliku .env',
      envAyuda: 'Należy wkleić do pliku .env projektu. WolfCore Dev nie zapisuje zmian w plikach projektów.',
      copiarEnv: 'Kopiować blok',
      cargando: 'Odczytywanie danych połączenia…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Instalacja pgvector jest już w toku.',
      descripcion:
        'Wyszukiwanie podobieństwa (embeddings) w PostgreSQL. Kompilowane z oficjalnego kodu źródłowego.',
      instalado: (v: string | null) => (v ? `Zainstalowano (wersja ${v})` : 'Zainstalowano'),
      noInstalado: 'Nie zainstalowano',
      herramientas: 'Narzędzia kompilacji',
      herramientasSi: 'Gotowe',
      herramientasNo: 'Brak',
      instalar: 'Zainstalować pgvector',
      reinstalar: 'Skompilować ponownie',
      instalarHerramientas: 'Zainstalować narzędzia kompilacji',
      dialogoHerramientasTitulo: 'Instalacja narzędzi kompilacji',
      dialogoHerramientas:
        'Do kompilacji pgvector wymagane są Visual Studio Build Tools. Pobrane zostanie ok. 6 GB danych, a system Windows poprosi o uprawnienia administratora. Może to potrwać dłuższą chwilę; proszę pozostawić WolfCore Dev otwarty.',
      dialogoCompilarTitulo: 'Kompilacja i instalacja pgvector',
      dialogoCompilar:
        'Zostanie pobrany oficjalny kod pgvector, skompilowany i zainstalowany w PostgreSQL. PostgreSQL zatrzyma się na kilka sekund podczas kopiowania rozszerzenia, a następnie uruchomi się ponownie.',
      continuar: 'Kontynuować',
      instalando: 'Instalowanie narzędzi kompilacji…',
      compilando: 'Kompilowanie pgvector…',
      herramientasOk: 'Zainstalowano narzędzia kompilacji',
      instaladoOk: (v: string) => `Zainstalowano pgvector ${v}`,
      sinWinget:
        'Na tym komputerze brakuje narzędzia winget. Proszę zainstalować „Build Tools dla Visual Studio 2022” ze strony visualstudio.microsoft.com wraz z obciążeniem „Programowanie aplikacji klasycznych w języku C++” i spróbować ponownie.',
      falloHerramientas: 'Nie udało się zainstalować narzędzi kompilacji',
      activarAyuda: 'Następnie należy użyć opcji „Włączyć vector” w każdej bazie, która tego wymaga.',
      errorEstado: 'Nie udało się odczytać stanu pgvector',
    },
  },
  instalar: {
    titulo: 'Instalacja',
    descripcion:
      'Pobieranie oficjalnych wersji. Każdy plik jest weryfikowany za pomocą sumy kontrolnej SHA-256 przed użyciem.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Serwer WWW (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Tunele publiczne (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Baza danych, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Baza danych, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Baza danych (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Pamięć podręczna i kolejki w pamięci (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Dokumentowa baza danych (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Konsola MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Poczta testowa (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Poczta testowa (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Poczta testowa (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Poczta testowa (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Lokalna AI (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'Zależności PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Webowy panel administracyjny baz danych' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Webowy panel administracyjny MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'WWW i PHP',
      bd: 'Bazy danych',
      otros: 'Poczta, AI i tunele',
    },
    instalados: 'Zainstalowano',
    ninguno: 'Brak zainstalowanej wersji',
    elegir: 'Proszę wybrać wersję',
    buscando: 'Wyszukiwanie wersji…',
    sinVersiones: 'Nie znaleziono wersji',
    rama: (rama: string) => rama,
    yaInstalada: 'już zainstalowana',
    fases: {
      descargando: 'Pobieranie',
      verificando: 'Weryfikowanie SHA-256',
      extrayendo: 'Rozpakowywanie',
      compilando: 'Kompilowanie',
      listo: 'Zainstalowano',
      error: 'Instalacja nie powiodła się',
    },
    exito: (nombre: string, version: string) => `Zainstalowano ${nombre} ${version}`,
  },
  sitios: {
    titulo: 'Strony',
    descripcion: 'Każda strona to folder obsługiwany przez Nginx pod własną domeną .test.',
    nuevo: 'Nowa strona',
    buscar: 'Szukać według nazwy lub domeny',
    sinResultados: (q: string) => `Żadna strona nie pasuje do zapytania „${q}”.`,
    vacioTitulo: 'Brak stron',
    vacio:
      'Proszę wybrać folder projektu — WolfCore Dev automatycznie rozpozna, czy to Laravel, CodeIgniter czy strona statyczna.',
    agregar: 'Dodać stronę',
    total: (n: number) => plural(n, 'strona', 'strony', 'stron'),
    abrirSitio: (dominio: string) => `Otworzyć ${dominio} w przeglądarce`,
    carpeta: 'Folder',
    abrirCarpeta: 'Otworzyć folder projektu',
    alias: (n: number) => `+${plural(n, 'alias', 'aliasy', 'aliasów')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Statyczna',
      proxy: 'Proxy (port lokalny)',
      personalizado: 'Niestandardowa',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (port lokalny)',
      node: 'Node / Vite (port lokalny)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Statyczna',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Prawdziwe dane',
    datosRealesAyuda: 'Zawiera prawdziwe dane klientów: należy zachować ostrożność przy publikowaniu.',
    faltaHosts: 'Brak w pliku hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} nie wskazuje jeszcze na ten komputer. Proszę naprawić plik hosts za pomocą powyższego powiadomienia.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Brak w pliku hosts',
      iniciando: 'Uruchamianie Nginx…',
      errorNginx: 'Błąd Nginx',
      nginxExterno: 'Zewnętrzny Nginx',
      nginxApagado: 'Nginx wyłączony',
    },
    borrar: {
      titulo: (nombre: string) => `Czy usunąć stronę ${nombre}?`,
      texto: 'Folder projektu pozostanie nienaruszony.',
      hecho: (nombre: string) => `Usunięto stronę ${nombre}`,
      nginxFallo: 'Strona została usunięta, ale Nginx odrzucił nową konfigurację',
    },
  },
  formSitio: {
    tituloNuevo: 'Nowa strona',
    tituloEditar: 'Edycja strony',
    tituloDuplicar: 'Duplikowanie strony',
    paso: 'Proszę zacząć od wyboru folderu projektu',
    pasoAyuda:
      'Wykrywany jest typ projektu, wersja PHP oraz sugerowana domena. Później wszystko można zmienić.',
    elegirCarpeta: 'Wybrać folder',
    cambiarCarpeta: 'Zmienić',
    detectando: 'Analizowanie projektu…',
    detectado: (tipo: string) => `Wykryto: ${tipo}`,
    sinDeteccionAlEditar: 'Automatyczne wykrywanie działa tylko przy tworzeniu; proszę sprawdzić typ i PHP.',
    nombre: 'Nazwa',
    nombreAyuda: 'Wyłącznie do rozpoznawania na liście.',
    nombreCopia: (nombre: string) => `${nombre} (kopia)`,
    duplicarProxy:
      'Kopia wskazuje na ten sam port lokalny co oryginał i nie kopiuje jego procesów: należy zmienić port lub dodać własny proces.',
    dominio: 'Domena',
    dominioPlaceholder: 'moj-projekt',
    alias: 'Aliasy',
    aliasAyuda: 'Inne domeny .test otwierające tę samą stronę. Proszę wpisać i nacisnąć Enter.',
    aliasAgregar: 'Dodać alias',
    carpeta: 'Folder projektu',
    raizLaravel: 'Nginx będzie obsługiwać podfolder public/.',
    tipo: 'Typ projektu',
    php: 'Wersja PHP',
    phpElegir: 'Proszę wybrać wersję',
    phpNinguno: 'Nie zainstalowano żadnej wersji PHP.',
    phpInstalar: 'Zainstalować PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Projekt wymaga PHP ${pedida}, które nie jest zainstalowane. Wybrano PHP ${elegida}.`,
    puertoProxy: 'Port lokalny',
    puertoProxyAyuda:
      'Nginx przekaże żądania na adres http://127.0.0.1:<port> (na przykład Vite lub Node).',
    urlBaseVar: 'Zmienna bazowego adresu URL',
    urlBaseVarAyuda:
      'Po otwarciu tunelu publiczny link jest zapisywany w tej zmiennej pliku .env, a po jego zamknięciu przywracany.',
    urlBaseVarNinguna: 'Brak (nie modyfikować .env)',
    datosReales: 'Zawiera prawdziwe dane klientów',
    datosRealesAyuda:
      'Oznaczane na liście i wymagające potwierdzenia przed opublikowaniem przez tunel.',
    avanzado: 'Zaawansowane',
    reglasExtra: 'Dodatkowe reguły Nginx',
    reglasExtraAyuda:
      'Wstawiane wewnątrz bloku server (nagłówki bezpieczeństwa, własne reguły deny…). Walidowane poleceniem nginx -t przy zapisie.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Notatka',
    notaPlaceholder: 'Ważne informacje do zapamiętania o tej stronie',
    guardar: 'Zapisać stronę',
    guardado: (nombre: string) => `Zapisano stronę ${nombre}`,
    errorGuardar: 'Nie udało się zapisać strony',
    nginxFallo: 'Strona została zapisana, ale Nginx odrzucił konfigurację',
    nginxFalloAyuda:
      'Przywrócono poprzednią konfigurację Nginx. Proszę sprawdzić dodatkowe reguły i zapisać ponownie.',
    errores: {
      carpeta: 'Proszę wybrać folder projektu',
      sufijo: 'Domena musi kończyć się na .test',
      caracteres: 'Dozwolone są wyłącznie litery, cyfry, myślniki i kropki',
      aliasIgualDominio: (d: string) => `Alias ${d} jest taki sam jak domena strony`,
      aliasRepetido: (d: string) => `Alias ${d} jest zduplikowany`,
      ocupado: (d: string) => `Istnieje już strona z domeną ${d}`,
      puertoFalta: 'Strona typu proxy wymaga podania portu',
      puertoRango: 'Port musi mieścić się w zakresie od 1 do 65535',
      php: 'Proszę wybrać wersję PHP dla tej strony',
      urlBaseVar: 'Dozwolone są litery, cyfry i podkreślenie (na przykład APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Publiczny tunel dla ${dominio}`,
    etiqueta: 'Tunel',
    apagadoAyuda: 'Udostępnienie tej strony za pomocą tymczasowego publicznego linku.',
    abriendo: 'Otwieranie tunelu…',
    cerrando: 'Zamykanie tunelu…',
    error: 'Błąd tunelu',
    sinNginx: 'Najpierw należy uruchomić Nginx',
    sinCloudflared: 'Należy zainstalować cloudflared w Usługach',
    abrirUrl: 'Otworzyć publiczny link',
    copiarUrl: 'Kopiować publiczny link',
    verQr: 'Wyświetlić kod QR linku',
    qrTitulo: 'Publiczny link do tej strony',
    renovar: 'Odnowić (nowy link)',
    cerrar: 'Zamknąć tunel',
    confirmarTitulo: 'Publikacja strony z prawdziwymi danymi',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `Strona ${dominio} zawiera prawdziwe dane klientów i zostanie opublikowana w internecie przez ${destino}: każda osoba posiadająca link będzie mogła ją zobaczyć, dopóki tunel pozostanie otwarty. Czy opublikować?`,
    confirmarExposeTexto: (dominio: string) =>
      `Strona ${dominio} zostanie opublikowana w internecie przez Expose: każda osoba posiadająca link będzie mogła uzyskać do niej dostęp, dopóki tunel pozostanie otwarty. Ponadto inspektor żądań Expose będzie widoczny dla każdego komputera w sieci lokalnej. Czy opublikować?`,
    compartir: 'Udostępnić',
    confirmar: 'Opublikować',
    confirmarPublicoTitulo: 'Publikacja strony w internecie',
    confirmarPublicoTexto: (dominio: string) =>
      `Zostanie otwarty publiczny tunel Cloudflare dla ${dominio}: każda osoba posiadająca link będzie mogła uzyskać dostęp, dopóki tunel pozostanie otwarty. Czy opublikować?`,
    opciones: 'Opcje tunelu',
    opcionesDe: (dominio: string) => `Opcje tunelu dla ${dominio}`,
    proveedor: 'Dostawca',
    proveedorRapido: 'Szybki (bez konta)',
    proveedorRapidoAyuda: 'Link w domenie trycloudflare.com, który zmienia się przy każdym otwarciu.',
    proveedorNombre: 'Nazwany (własna domena)',
    proveedorNombreAyuda:
      'Stały link we własnej domenie w Cloudflare. Wymaga konta Cloudflare.',
    cuentaConectada: 'Konto Cloudflare jest połączone.',
    cuentaSinConectar: 'Nie połączono jeszcze żadnego konta Cloudflare.',
    conectar: 'Połączyć z Cloudflare',
    conectando: 'Oczekiwanie na autoryzację w przeglądarce…',
    conectarAyuda:
      'Otworzy się przeglądarka, aby autoryzować WolfCore Dev na koncie. Certyfikat jest zapisywany wyłącznie w lokalnym folderze danych.',
    autorizacion: 'Autoryzacja Cloudflare',
    abrirAutorizacion: 'Otworzyć stronę autoryzacji',
    copiarAutorizacion: 'Kopiować link autoryzacji',
    cancelarConexion: 'Anulować',
    recrear: 'Odtworzyć tunel',
    olvidar: 'Zapomnieć tunel',
    recrearTitulo: 'Odtworzenie tunelu',
    recrearTexto: (n: string) =>
      `Tunel „${n}” w Cloudflare zostanie usunięty i utworzony ponownie pod tą samą nazwą. Strony korzystające z niego zostaną zamknięte.`,
    olvidarTitulo: 'Zapomnienie tunelu',
    olvidarTexto: (n: string) =>
      `Tunel „${n}” w Cloudflare oraz zapisane dane uwierzytelniające zostaną usunięte. Strony korzystające z niego powrócą do szybkiego tunelu.`,
    olvidarAqui: 'Zapomnij tylko tutaj',
    olvidarAquiTitulo: 'Zapomnieć tunel tylko na tym komputerze',
    olvidarAquiTexto: (n: string) =>
      `Zapisane poświadczenie tunelu „${n}” na tym komputerze zostanie usunięte; tunel nadal będzie istnieć w Cloudflare. Strony korzystające z niego powrócą do szybkiego tunelu.`,
    desconectar: 'Rozłącz',
    nombreTunel: 'Nazwa tunelu',
    nombreTunelAyuda: 'Małe litery, cyfry i myślniki.',
    dominioPublico: 'Domena publiczna',
    dominioPublicoAyuda:
      'Subdomena własnej domeny w Cloudflare, np. demo.mojadomena.com.',
    crear: 'Utwórz i przekieruj',
    guardadoNombre: 'Tunel nazwany jest gotowy. Przy jego otwarciu wymagane będzie potwierdzenie.',
    guardadoRapido: 'Ta strona ponownie korzysta z szybkiego tunelu.',
    cambiarCierra: 'Zmiana dostawcy zamyka otwarty tunel tej strony.',
    usarRapido: 'Użyj szybkiego tunelu',
    nombreActual: (nombre: string, dominio: string) => `Tunel „${nombre}” w ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `Domena ${dominio} zostanie opublikowana pod adresem ${publico} przez tunel Cloudflare: każda osoba posiadająca link będzie mogła uzyskać dostęp, dopóki tunel pozostanie otwarty. Opublikować?`,
    proveedorNgrokAyuda:
      'Z wykorzystaniem konta ngrok. Wymaga zainstalowanego programu ngrok na tym komputerze.',
    proveedorExposeAyuda:
      'Z wykorzystaniem konta Expose. Wymaga zainstalowanego programu Expose na tym komputerze; w systemie Windows działa wyłącznie z expose.phar. Jego inspektor jest widoczny w sieci lokalnej, dlatego nie należy go używać ze stronami zawierającymi prawdziwe dane.',
    proveedorTailscaleAyuda:
      'Przez prywatną sieć Tailscale. Wymaga zainstalowanego i zalogowanego programu Tailscale.',
    tokenGuardado: (f: string) => `Token zapisany (kończy się na ${f}).`,
    tokenSinGuardar: 'Nie zapisano jeszcze żadnego tokenu.',
    tokenNgrok: 'Token ngrok',
    tokenExpose: 'Token Expose',
    tokenAyuda:
      'Jest przechowywany w postaci zaszyfrowanej na tym komputerze i przekazywany do programu wyłącznie podczas otwierania tunelu; nigdy nie jest wyświetlany.',
    tokenPlaceholder: 'Wklej token tutaj',
    guardarToken: 'Zapisz token',
    borrarToken: 'Usuń token',
    usarProveedor: 'Użyj tego dostawcy',
    guardadoProveedor: 'Dostawca zapisany. Przy otwieraniu tunelu wymagane będzie potwierdzenie.',
    ngrokAyudaInstalacion:
      'Program ngrok musi być już zainstalowany na tym komputerze (WolfCore Dev go nie pobiera, ponieważ ngrok nie udostępnia weryfikowalnego pliku instalacyjnego). Globalna konfiguracja nie jest modyfikowana.',
    exposeAyudaInstalacion:
      'Program Expose musi być już zainstalowany lub plik expose.phar musi znajdować się w folderze bin/expose danych WolfCore Dev (w systemie Windows działa wyłącznie z plikiem phar; brak pliku do pobrania z sumą kontrolną). Jego inspektor żądań jest widoczny w całej sieci lokalnej, dlatego nie należy go używać ze stronami zawierającymi prawdziwe dane. Globalna konfiguracja nie jest modyfikowana.',
    tailscaleAlcance: 'Zasięg udostępniania',
    tailscaleServe: 'Serve: tylko własna sieć tailnet',
    tailscaleServeAyuda: 'Tylko komputery w prywatnej sieci Tailscale. Bez dostępu z internetu.',
    tailscaleFunnel: 'Funnel: cały internet',
    tailscaleFunnelAyuda: 'Każda osoba posiadająca link może uzyskać dostęp, niezależnie od przynależności do sieci tailnet.',
    tailscaleFunnelAviso:
      'Funnel publikuje tę stronę w internecie: każda osoba posiadająca link będzie mogła uzyskać dostęp, dopóki tunel pozostanie otwarty.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev nie instaluje programu Tailscale (jest to usługa systemowa): musi być zainstalowany i zalogowany. Dotychczas publikowane zasoby w Tailscale nie ulegają zmianie; strona korzysta z portu HTTPS 8443.',
    confirmarTailnetTitulo: 'Udostępnij w sieci tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `Domena ${dominio} zostanie udostępniona przez Tailscale Serve: dostęp będą miały wyłącznie komputery w sieci tailnet; strona nie jest publikowana w internecie. Udostępnić?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `Domena ${dominio} zawiera prawdziwe dane klientów. Przez Tailscale Serve będzie widoczna wyłącznie dla komputerów w sieci tailnet (nie jest publikowana w internecie). Udostępnić?`,
    confirmarFunnelTexto: (dominio: string) =>
      `Domena ${dominio} zostanie opublikowana w internecie przez Tailscale Funnel: każda osoba posiadająca link będzie mogła uzyskać dostęp, dopóki tunel pozostanie otwarty. Opublikować?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `Domena ${dominio} zostanie opublikowana w internecie za pomocą ${proveedor}: każda osoba posiadająca link będzie mogła uzyskać dostęp, dopóki tunel pozostanie otwarty. Opublikować?`,
    tituloError: 'Nie udało się otworzyć tunelu',
  },
  tuneles: {
    titulo: 'Tunele',
    descripcion: 'Tymczasowe publiczne linki Cloudflare do udostępniania strony poza własną siecią.',
    explicacion:
      'Szybkie tunele zmieniają adres przy każdym otwarciu lub odnowieniu i działają wyłącznie wtedy, gdy ten komputer jest włączony, a ich procesy pozostają aktywne (po zamknięciu WolfCore Dev z pozostawionymi włączonymi tunelami pozostają one aktywne).',
    columnas: { sitio: 'Strona', estado: 'Stan', url: 'Link', acciones: 'Akcje' },
    vacioTitulo: 'Brak otwartych tuneli',
    vacio: 'Włączenie przełącznika tunelu dla strony pozwala uzyskać publiczny link.',
    irASitios: 'Przejdź do Stron',
    sinNombre: 'Usunięta strona',
  },
  ajustes: {
    titulo: 'Ustawienia',
    descripcion: 'Preferencje środowiska.',
    general: 'Ogólne',
    carpetaDatos: 'Folder danych',
    carpetaDatosAyuda: 'Pliki binarne, konfiguracja i dzienniki. Można otworzyć, bez możliwości zmiany.',
    servicios: 'Usługi',
    puertoNginx: 'Port Nginx',
    puertoNginxAyuda:
      'Zazwyczaj 80. Jeśli jest inny niż 80, lokalne adresy URL będą zawierać numer portu. Otwarte tunele nadal korzystają z poprzedniego portu: należy je odnowić.',
    trabajadores: 'Procesy robocze PHP',
    trabajadoresAyuda:
      'Procesy php-cgi na wersję. Większa liczba procesów obsługuje więcej żądań jednocześnie.',
    nota: 'Zapisanie powoduje ponowne wygenerowanie stron z nowym portem. Jeśli Nginx jest uruchomiony, zostanie zrestartowany (lub przeładowany, jeśli port nie uległ zmianie), a uruchomione wersje PHP zostaną zrestartowane w przypadku zmiany liczby procesów roboczych.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Ustawienia zapisane i zastosowane. Zrestartowano: ${reiniciados.join(', ')}.`
        : 'Ustawienia zapisane i zastosowane.',
    errorAplicar: 'Ustawienia zostały zapisane, ale nie udało się ich w pełni zastosować',
    errorSeccion: (detalle: string) => `Nie udało się odczytać tej wartości: ${detalle}`,
    acerca: 'O programie',
    avisos: {
      titulo: 'Powiadomienia',
      descripcion:
        'Jakie powiadomienia są zapisywane w dzwonku oraz czy system Windows wyświetla powiadomienie, gdy okno nie jest widoczne.',
      nativas: 'Powiadomienia systemu Windows',
      nativasAyuda:
        'Tylko gdy WolfCore Dev nie jest na pierwszym planie; maksymalnie jedno na typ co 5 min.',
      tiposTitulo: 'Typy powiadomień',
      versionesTitulo: 'Nowe wersje według usługi',
      versionesAyuda:
        'Wyłączenie usługi wstrzymuje powiadomienia o jej nowych wersjach (karta Wersje nadal oznacza dostępne aktualizacje).',
      versionesDe: (s: string) => `Powiadamiaj o nowych wersjach usługi ${s}`,
      tipos: {
        'servicio-caido': 'Usługa zatrzymała się z błędem',
        'puerto-ocupado': 'Port zajęty podczas uruchamiania usługi',
        'certificado-por-vencer': 'Certyfikaty wkrótce wygasną',
        'tunel-caido': 'Tunel przestał działać',
        'proceso-error': 'Proces projektu zakończył się błędem',
        'proceso-terminado': 'Proces projektu został zakończony',
        'receta-terminada': 'Przepis projektu został zakończony',
        doctor: 'Diagnostyka (Doctor)',
        'contenedor-detenido': 'Kontener został zatrzymany',
        'version-nueva': 'Dostępna jest nowa wersja zainstalowanej usługi',
      } as Record<string, string>,
      errorGuardar: 'Nie udało się zapisać ustawień powiadomień',
    },
    versionPrograma: 'Wersja programu',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Lokalny urząd certyfikacji',
      autoridadAyuda:
        'WolfCore Dev podpisuje certyfikaty stron .test własnym urzędem certyfikacji. Jest on instalowany w magazynie certyfikatów użytkownika Windows, bez uprawnień administratora.',
      instalada: 'Zainstalowany w systemie Windows',
      noInstalada: 'Niezainstalowany',
      instalar: 'Zainstaluj urząd',
      reinstalar: 'Zainstaluj ponownie',
      quitar: 'Usuń',
      instaladaOk: 'Urząd certyfikacji HTTPS został zainstalowany',
      quitadaOk: 'Urząd certyfikacji HTTPS został usunięty',
      cancelado: 'Potwierdzenie systemu Windows zostało anulowane. Nie wprowadzono żadnych zmian.',
      fallo: 'Nie udało się zmienić urzędu certyfikacji HTTPS',
      quitarTitulo: 'Usunąć urząd certyfikacji HTTPS?',
      quitarTexto:
        'Przeglądarki przestaną ufać certyfikatom stron .test do czasu ponownej instalacji urzędu.',
      puerto: 'Port HTTPS',
      puertoAyuda:
        'Zazwyczaj 443. Jeśli port jest używany przez inny program, należy wybrać numer z zakresu 1024–65535; adresy URL będą zawierać ten port.',
      puertoRango: 'Należy użyć portu 443 lub liczby z zakresu 1024–65535',
      puertoGuardado: (p: number) => `HTTPS korzysta teraz z portu ${p}`,
      puertoAplicarFallo: 'Port został zapisany, ale Nginx odrzucił nową konfigurację',
      firefox:
        'Firefox korzysta z własnego magazynu certyfikatów. Aby zaufał urzędowi, należy otworzyć about:config i włączyć',
    },
    herramientas: {
      titulo: 'Terminal i narzędzia',
      phpPorDefecto: 'Domyślny PHP',
      phpPorDefectoAyuda:
        'Wersja php i composer używana w terminalu i skrótach WolfCore Dev. „Terminal” korzysta z wersji PHP przypisanej do danego projektu.',
      phpMasReciente: 'Najnowsza zainstalowana',
      phpSinInstalar: 'Należy zainstalować PHP w sekcji Usługi, aby wybrać wersję',
      phpGuardado: 'Domyślny PHP został zaktualizowany',
      path: 'Zmienna PATH użytkownika',
      pathAyuda:
        'Dodaje php i composer z WolfCore Dev do zmiennej PATH użytkownika, aby można było ich używać w dowolnym terminalu.',
      pathActivo: 'Dodano do PATH',
      pathInactivo: 'Brak w PATH',
      pathAgregar: 'Dodaj do PATH użytkownika',
      pathQuitar: 'Usuń z PATH',
      pathTitulo: 'Zaktualizowano PATH',
      pathAviso: 'Należy otworzyć nowy terminal, aby zobaczyć zmianę: otwarte terminale jej nie uwzględniają.',
      pathQuitarTitulo: 'Usunąć WolfCore Dev z PATH?',
      pathQuitarTexto:
        'Polecenia php i composer z WolfCore Dev przestaną być dostępne w nowych terminalach. Otwarte terminale pozostają bez zmian.',
      adminer: 'Port Adminer',
      adminerAyuda: 'Adminer jest udostępniany wyłącznie na tym komputerze, pod tym stałym adresem.',
      terminal: 'Domyślny terminal',
      terminalSistema: 'Systemowy (PowerShell)',
      terminalAyuda:
        'Terminal otwierany przez „Terminal” w projektach. Jeśli projekt wymaga własnych zmiennych środowiskowych (własnego PHP w PATH, klucza agenta), przy opcji „Windows Terminal” uruchamiany jest PowerShell w domyślnym terminalu Windows: już otwarte okno Windows Terminal nie otrzyma tych zmiennych.',
      terminalGuardada: 'Domyślny terminal został zaktualizowany',
      editor: 'Domyślny edytor',
      editorPrimero: 'Pierwszy wykryty',
      editorAyuda:
        'Edytor otwierany przez „Edytor” w projektach oraz „Otwórz w edytorze” w wynikach wyszukiwania i błędach. Wykrywane są VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed oraz Notepad++.',
      editorGuardado: 'Domyślny edytor został zaktualizowany',
      editorNinguno: 'Nie wykryto żadnego edytora.',
    },
  },
  /* ───────────── HTTPS, terminal i FTP dla stron; Poczta; Lokalna AI ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS aktywny',
    candadoAyuda: 'Ta strona odpowiada również przez HTTPS z certyfikatem WolfCore Dev.',
    redirige: 'Przekierowuje http → https',
    abrirHttp: (dominio: string) => `Otwórz http://${dominio} w przeglądarce`,
    abrirHttps: (url: string) => `Otwórz ${url} w przeglądarce`,
    pendiente: (motivo: string) => `HTTPS oczekujący: ${motivo}`,
    pendienteCorto: 'HTTPS oczekujący',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `port ${puerto} jest używany przez ${nombre} (PID ${pid}).`,
    sinAutoridad: 'brak urzędu certyfikacji. Należy go zainstalować w Ustawieniach.',
    pendienteAyuda:
      'Strona nadal działa przez HTTP. Należy zamknąć ten program lub wybrać inny port HTTPS w Ustawieniach.',
    sinConfianza: 'Urząd niezainstalowany',
    sinConfianzaAyuda:
      'Przeglądarka będzie wyświetlać ostrzeżenie bezpieczeństwa do czasu zainstalowania urzędu certyfikacji WolfCore Dev (Ustawienia → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Udostępniaj również przez HTTPS',
    httpsAyuda: 'Z własnym certyfikatem dla domeny i jej aliasów, podpisanym przez WolfCore Dev.',
    redirigir: 'Przekieruj na HTTPS',
    redirigirAyuda: 'Odwiedziny przez http są kierowane na https. Nie wpływa to na publiczne tunele.',
    redirigirDeshabilitado: 'Najpierw należy włączyć HTTPS',
    sinAutoridadTitulo: 'Urząd certyfikacji HTTPS nie jest zainstalowany',
    sinAutoridadTexto:
      'Bez niego przeglądarka wyświetli ostrzeżenie bezpieczeństwa. System Windows poprosi o potwierdzenie instalacji.',
    instalar: 'Zainstaluj urząd',
    instalada: 'Urząd certyfikacji HTTPS został zainstalowany',
    cancelado: 'Potwierdzenie systemu Windows zostało anulowane. Nie wprowadzono żadnych zmian.',
    fallo: 'Nie udało się zainstalować urzędu certyfikacji HTTPS',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Otwiera terminal w folderze projektu z jego wersją PHP i Composer w zmiennej PATH.',
    elegir: 'Wybierz terminal',
    predeterminada: 'domyślny',
  },
  editorSitio: {
    ayuda: 'Otwiera folder projektu w domyślnym edytorze.',
    elegir: 'Otwórz za pomocą…',
    predeterminada: 'domyślny',
    sustituido: (pred: string, usado: string) =>
      '{pred} nie jest zainstalowany: otwarto za pomocą {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Nie udało się otworzyć edytora',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Współdzielony PHP ${rama}`,
    propio: (rama: string) => `Własny PHP ${rama} tej strony`,
    conXdebug: 'Xdebug aktywny',
    mostrar: 'Ustawienia PHP',
    ocultar: 'Ukryj ustawienia PHP',
    cargando: 'Odczytywanie ustawień PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} jest wyłączony: własny PHP tej strony uruchamia się razem z nim.`,
    ajustesTitulo: 'Własny php.ini',
    ajustesAyuda: (rama: string) =>
      `Dodawane do pliku php.ini wersji PHP ${rama} wyłącznie dla tej strony. Z dowolnym ustawieniem (lub z Xdebug) strona korzysta z własnego PHP z 1 lub 2 procesami; pozostałe strony pozostają bez zmian.`,
    clave: 'Dyrektywa',
    valor: 'Wartość',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Usuń ${clave || 'ustawienie'}`,
    agregar: 'Dodaj ustawienie',
    guardarAjustes: 'Przetestuj i zapisz',
    ajustesGuardados: 'Zastosowano ustawienia PHP strony',
    sinAjustes: 'Brak własnych ustawień: używany jest współdzielony php.ini bez zmian.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug dla ${dominio}`,
    xdebugAyuda:
      'Jest ładowany wyłącznie w PHP tej strony, nigdy we współdzielonym PHP: pozostałe strony działają równie szybko.',
    xdebugDescarga:
      'Xdebug nie jest zainstalowany w tej wersji PHP: zostanie pobrany z katalogu (xdebug.org, weryfikacja sumy kontrolnej SHA-256).',
    modo: 'Tryby',
    modos: {
      debug: 'debug (punkty przerwania)',
      develop: 'develop (lepsze komunikaty błędów)',
      coverage: 'coverage (pokrycie kodu)',
      profile: 'profile (profilowanie)',
      trace: 'trace (śledzenie)',
    },
    puerto: 'Port edytora',
    inicio: 'Kiedy się łączy',
    inicioTrigger: 'Tylko z XDEBUG_TRIGGER',
    inicioYes: 'Przy każdym żądaniu',
    inicioAyuda:
      'W trybie „Tylko z XDEBUG_TRIGGER” debugowanie rozpoczyna się, gdy żądanie zawiera plik cookie, parametr GET/POST lub używa rozszerzenia przeglądarki (Xdebug Helper).',
    guardarXdebug: 'Zapisz Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Port ${puerto} jest już używany przez PHP lub inną usługę WolfCore Dev: edytor nie będzie mógł na nim nasłuchiwać. Należy wybrać inny (standardowo 9003).`,
    xdebugGuardado: 'Zastosowano Xdebug dla strony',
    quitarXdebug: 'Usuń Xdebug',
    quitarXdebugTitulo: 'Usunąć Xdebug z tej strony?',
    quitarXdebugTexto:
      'Konfiguracja zostanie usunięta. Jeśli strona nie ma innych ustawień, powróci do współdzielonego PHP. Plik launch.json projektu pozostaje bez zmian.',
    xdebugQuitado: 'Xdebug został usunięty ze strony',
    ide: 'Edytor',
    generarLaunch: 'Wygeneruj launch.json',
    launchTitulo: 'Plik .vscode/launch.json projektu',
    launchNuevo:
      'Zostanie utworzony plik .vscode/launch.json z tą konfiguracją (PHP Debug dla VS Code, nasłuchujący wyłącznie na 127.0.0.1).',
    launchFusion:
      'Plik launch.json już istnieje: zostanie dodana (lub zaktualizowana) wyłącznie konfiguracja WolfCore; pozostałe konfiguracje i komentarze zostaną zachowane. Wcześniej zapisywana jest kopia zapasowa z datą w folderze danych WolfCore Dev.',
    launchSinCambios: 'Plik launch.json zawiera już tę konfigurację.',
    launchEscribir: 'Zapisz launch.json',
    launchCreado: 'Utworzono launch.json w .vscode',
    launchActualizado: (respaldo: string) => `Zaktualizowano launch.json. Poprzednia kopia zapasowa: ${respaldo}`,
    phpStorm: 'Konfiguracja dla PhpStorm',
    copiarPhpStorm: 'Kopiuj konfigurację PhpStorm',
    errorNginx: (salida: string) => `Nginx odrzucił zmianę; przywrócono poprzedni stan. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Wygenerowany vhost',
    conReglas: 'z własnymi regułami',
    manualResumen: 'Vhost napisany ręcznie (nie jest regenerowany)',
    mostrar: 'Edytuj vhost',
    ocultar: 'Ukryj vhost',
    cargando: 'Odczytywanie vhosta…',
    reglasTitulo: 'Własne reguły',
    reglasAyuda:
      'Trafiają wewnątrz bloku server tej strony. Przed zastosowaniem są testowane za pomocą nginx -t na kopii całej konfiguracji; w razie błędu wszystko pozostaje bez zmian.',
    reglasEtiqueta: 'Własne reguły Nginx',
    reglasPlaceholder: '# Na przykład: client_max_body_size 256m;',
    snippetsTitulo: 'Fragmenty',
    insertar: (titulo: string) => `Wstaw: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Pamięć podręczna plików statycznych',
      'limite-subida': 'Limit przesyłania',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Nagłówki bezpieczeństwa',
      websocket: 'Proxy WebSocket',
      gzip: 'Kompresja gzip',
      ocultos: 'Blokuj ukryte pliki',
    },
    aplicar: 'Przetestuj i zastosuj',
    descartar: 'Odrzuć zmiany',
    aplicado: 'Zastosowano vhost i przeładowano Nginx',
    aplicadoApagado: 'Vhost zapisany; zostanie użyty po uruchomieniu Nginx',
    fallo: 'Nginx odrzucił zmianę; vhost pozostał bez zmian',
    salidaTitulo: 'Wynik polecenia nginx -t',
    desactivado:
      'Nginx odrzucił wpisane reguły dla tej strony podczas stosowania konfiguracji i zostały one pominięte w vhoście (nadal są zapisane). Należy je poprawić i zastosować ponownie, aby znów z nich korzystać.',
    avisoDestino: (destino: string, linea: number) =>
      `Linia ${linea}: ruch jest przekierowywany na inny komputer (${destino}). Należy sprawdzić, czy jest to zamierzone.`,
    generadoTitulo: 'Wygenerowany vhost (tylko do odczytu)',
    avanzadoTitulo: 'Tryb zaawansowany',
    avanzadoInterruptor: 'Napisz pełny vhost ręcznie',
    avanzadoAyuda:
      'Zastępuje wygenerowany vhost. WolfCore Dev nie będzie go już regenerować: w przypadku zmiany domeny, HTTPS, portów lub folderu konieczna będzie ręczna aktualizacja. Można używać wyłącznie domen i portów tej strony.',
    avanzadoActivarTitulo: 'Napisać vhost ręcznie?',
    avanzadoActivarTexto:
      'Punktem wyjścia jest bieżący wygenerowany vhost. Dopóki ten tryb jest aktywny, zmiany w ustawieniach strony (domena, HTTPS, PHP…) nie będą odzwierciedlane w vhoście: konieczne będzie ich ręczne wprowadzenie.',
    avanzadoActivar: 'Napisz ręcznie',
    manualEtiqueta: 'Pełny vhost strony',
    aplicarManual: 'Przetestuj i zastosuj vhost',
    volverGenerado: 'Wróć do wygenerowanego vhosta',
    volverGeneradoTitulo: 'Wrócić do wygenerowanego vhosta?',
    volverGeneradoTexto:
      'Vhost napisany ręcznie zostanie zapisany w historii, a WolfCore Dev ponownie wygeneruje vhost strony (wraz z własnymi regułami).',
    historial: 'Historia',
    historialTitulo: 'Poprzednie wersje vhosta',
    historialVacio: 'Nie ma jeszcze poprzednich wersji.',
    historialAyuda:
      'Zapisywane jest 10 ostatnich wersji przed każdą zmianą. Przywracanie przechodzi przez ten sam test za pomocą nginx -t.',
    modoReglas: 'Wygenerowany z regułami',
    modoManual: 'Napisany ręcznie',
    restaurar: 'Przywróć',
    restaurarTitulo: 'Przywrócić tę wersję?',
    restaurarTexto: (fecha: string) =>
      `Vhost powróci do stanu z dnia ${fecha}. Bieżąca wersja zostanie zachowana w historii.`,
    restaurado: 'Wersja została przywrócona',
  },
  lan: {
    etiqueta: 'Sieć lokalna',
    interruptor: (dominio: string) => `Udostępnij ${dominio} w sieci lokalnej`,
    apagadoAyuda: 'Pozwala otworzyć tę stronę na telefonie lub innym komputerze w tej samej sieci.',
    sinNginx: 'Należy uruchomić Nginx, aby udostępnić stronę w sieci lokalnej.',
    sinRed: 'Brak połączonej sieci lokalnej (Wi-Fi lub Ethernet).',
    activo: 'Widoczna w sieci lokalnej',
    abriendo: 'Udostępnianie…',
    cerrando: 'Zatrzymywanie udostępniania…',
    abrirUrl: 'Otwórz na tym komputerze',
    copiarUrl: 'Kopiuj adres',
    verQr: 'Pokaż kod QR',
    qrTitulo: (dominio: string) => `${dominio} w sieci lokalnej`,
    qrAviso: 'Należy zeskanować kod QR telefonem podłączonym do tej samej sieci.',
    confirmarTitulo: 'Udostępnij w sieci lokalnej',
    confirmarTexto: (dominio: string, ip: string) =>
      `Domena ${dominio} stanie się widoczna dla każdego urządzenia podłączonego do tej samej sieci co ten komputer (${ip}), bez pytania o hasło. Udostępnianie kończy się po wyłączeniu przełącznika, po zamknięciu WolfCore Dev oraz po jego ponownym uruchomieniu.`,
    ipEtiqueta: 'Sieć (IP tego komputera)',
    https: 'Użyj HTTPS',
    httpsAyuda:
      'W przypadku HTTPS telefon musi ufać urzędowi CA WolfCore Dev (przycisk „Zainstaluj CA na telefonie”). Bez tego strona działa przez HTTP.',
    httpsObligatorio: 'Ta strona przekierowuje na HTTPS, dlatego jest udostępniana przez HTTPS.',
    compartir: 'Udostępnij w sieci',
    tituloError: 'Nie udało się udostępnić w sieci lokalnej',
    caBoton: 'Zainstaluj CA na telefonie',
    firewallTitulo: 'Nie otwiera się na telefonie?',
    datosRealesBloqueado: (dominio: string) =>
      `Domena ${dominio} zawiera prawdziwe dane i nie jest udostępniana w sieci lokalnej, nawet po potwierdzeniu.`,
    redPublica:
      'Ta sieć jest oznaczona w systemie Windows jako publiczna: zapora sieciowa zablokuje połączenie, a polecenie otwiera wyłącznie sieci prywatne. Jeśli jest to zaufana sieć, należy oznaczyć ją jako prywatną.',
    firewallTexto:
      'WolfCore Dev nie zmienia ustawień zapory sieciowej. Nie należy akceptować monitu systemu Windows dla całego programu: zamiast tego należy uruchomić poniższe polecenie dla tego portu (wyłącznie podsieć lokalna i wyłącznie sieci prywatne) w programie PowerShell jako administrator. W sieci publicznej dostęp pozostanie zablokowany, a istniejąca reguła blokująca ma pierwszeństwo przed regułą zezwalającą.',
    copiarComando: 'Kopiuj polecenie',
  },
  caMovil: {
    titulo: 'Zainstaluj CA na telefonie',
    intro:
      'Należy zeskanować kod QR telefonem podłączonym do tej samej sieci, aby pobrać certyfikat urzędu WolfCore Dev. Udostępniany jest wyłącznie ten plik, a link zamyka się automatycznie.',
    abriendo: 'Otwieranie linku…',
    expira: (minutos: number) => `Link zamknie się automatycznie za ${minutos} min.`,
    expirado: 'Link został zamknięty.',
    reabrir: 'Otwórz ponownie',
    android: 'Android',
    ios: 'iPhone lub iPad',
    pasosAndroid: [
      'Zeskanować kod QR lub otworzyć adres w przeglądarce telefonu i pobrać plik.',
      'Otworzyć Ustawienia > Bezpieczeństwo i prywatność > Więcej ustawień zabezpieczeń > Szyfrowanie i dane logowania > Zainstaluj certyfikat > Certyfikat CA (nazwy mogą się różnić w zależności od producenta).',
      'Przed udzieleniem zaufania porównać odcisk SHA-256 certyfikatu wyświetlany na telefonie z wartością w tym oknie: jeśli nie są zgodne, nie instalować certyfikatu.',
      'Wybrać pobrany plik i zaakceptować ostrzeżenie: jest to normalne, Android wyświetla je dla każdego urzędu CA.',
    ],
    pasosIos: [
      'Otworzyć adres w przeglądarce Safari i zezwolić na pobranie profilu.',
      'Otworzyć Ustawienia > Pobrany profil i porównać odcisk SHA-1 w szczegółach z wartością w tym oknie: jeśli nie są zgodne, nie instalować profilu. Następnie zainstalować profil.',
      'Otworzyć Ustawienia > Ogólne > To urządzenie > Ustawienia zaufania certyfikatów i włączyć pełne zaufanie dla urzędu CA WolfCore Dev.',
    ],
    aviso:
      'Zainstalowany urząd CA nadaje zaufanie wszystkiemu, co podpisze na tym telefonie: należy go instalować wyłącznie na własnych urządzeniach i usunąć po zakończeniu.',
    firewallAviso: (puerto: number) =>
      'Aby telefon mógł połączyć się z linkiem, konieczne jest otwarcie portu ' +
      puerto +
      ' (wyłącznie podsieć lokalna i sieci prywatne). Nie należy akceptować monitu systemu Windows dla całego programu: zamiast tego należy uruchomić to polecenie w programie PowerShell jako administrator. W sieci publicznej dostęp pozostanie zablokowany, a istniejąca reguła blokująca ma pierwszeństwo.',
    huellas: 'Odciski certyfikatu',
    tituloError: 'Nie udało się otworzyć linku do CA',
  },
  dialogoQr: {
    descargar: 'Pobierz PNG',
    descargado: 'Kod QR zapisany',
    largo: 'Tekst jest zbyt długi dla kodu QR.',
    generando: 'Generowanie kodu QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Dostęp FTP dla ${dominio}`,
    apagadoAyuda: 'Pozwala przesyłać pliki do folderu tej strony przez FTP.',
    activoAyuda: 'Dostęp aktywny.',
    soloLecturaEtiqueta: 'tylko do odczytu',
    mostrarDatos: 'Pokaż dane FTP',
    ocultarDatos: 'Ukryj dane FTP',
    host: 'Serwer',
    puerto: 'Port',
    usuario: 'Użytkownik',
    clave: 'Hasło',
    mostrarClave: 'Pokaż hasło',
    ocultarClave: 'Ukryj hasło',
    copiarDato: (dato: string) => `Kopiuj ${dato}`,
    cargando: 'Odczytywanie danych FTP…',
    regenerar: 'Wygeneruj nowe hasło',
    regenerarTitulo: 'Wygenerować nowe hasło FTP?',
    regenerarTexto:
      'Obecne hasło przestanie działać, a otwarte połączenia dla tej strony zostaną zamknięte. Konieczna będzie jego aktualizacja w kliencie FTP.',
    regenerada: 'Wygenerowano nowe hasło FTP',
    soloLectura: 'Tylko do odczytu',
    soloLecturaAyuda: 'Można pobierać pliki, ale nie można ich przesyłać, zmieniać ani usuwać.',
    soloLecturaActivado: 'FTP tej strony działa teraz w trybie tylko do odczytu',
    soloLecturaDesactivado: 'FTP tej strony zezwala teraz na zapis',
    activado: 'Dostęp FTP został włączony',
    desactivarTitulo: 'Usunąć dostęp FTP dla tej strony?',
    desactivarTexto:
      'Hasło zostanie usunięte, a otwarte połączenia zamknięte. Folder strony pozostanie nienaruszony.',
    desactivar: 'Usuń dostęp',
    desactivado: 'Dostęp FTP został usunięty',
    redLocalAviso:
      'FTP akceptuje połączenia z sieci lokalnej i przesyła hasło oraz pliki bez szyfrowania. Należy używać go wyłącznie w zaufanej sieci.',
    redLocalHost: 'lub adres IP tego komputera w sieci lokalnej',
    servidorApagado: 'Serwer FTP jest wyłączony — nikt nie będzie mógł się połączyć, dopóki nie zostanie uruchomiony.',
    encender: 'Uruchom FTP',
    urlEtiqueta: 'Adres',
    urlAyuda: 'Adres nie zawiera hasła — jest ono wymagane przy nawiązywaniu połączenia.',
    abrirUrl: 'Otwórz w kliencie FTP',
    copiarUrl: 'Kopiuj adres FTP',
    verQr: 'Pokaż kod QR adresu',
    qrTitulo: 'Adres FTP tej strony',
    qrAviso: 'Kod zawiera wyłącznie adres, bez hasła.',
  },
  correo: {
    descripcion:
      'Przechwytywacze zatrzymują wiadomości e-mail wysyłane przez projekty, umożliwiając ich podgląd bez wysyłania do internetu. Nasłuchują wyłącznie na tym komputerze (127.0.0.1), a jednocześnie uruchomiony jest tylko jeden.',
    seccionCaptadores: 'Lokalne przechwytywacze',
    seccionProveedores: 'Zdalni dostawcy SMTP',
    proveedores: {
      descripcion:
        'Prawdziwy dostawca SMTP wysyła rzeczywiste wiadomości e-mail — służy do testowania wysyłki w projekcie przed publikacją. Hasło jest zapisywane w postaci zaszyfrowanej na tym komputerze i nigdy nie jest wyświetlane.',
      agregar: 'Dodaj dostawcę',
      vacio:
        'Nie dodano jeszcze żadnego dostawcy. Proszę wybrać Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO lub Gmail albo wpisać własne dane.',
      errorLista: 'Nie udało się odczytać listy dostawców',
      tarjeta: {
        servidor: 'Serwer',
        usuario: 'Użytkownik',
        clave: 'Hasło',
        sinClave: 'Brak hasła',
        claveIlegible: 'Zapisane (nie udało się odczytać)',
        red: 'Sieć',
        redLocal: 'Serwer na tym komputerze lub w sieci lokalnej (potwierdzony)',
        editar: 'Edytuj',
        borrar: 'Usuń',
        borrarTitulo: (n: string) => `Usunąć ${n}?`,
        borrarTexto:
          'Dostawca oraz zapisane hasło zostaną usunięte. Projekty, które z niego korzystają, wrócą do lokalnego przechwytywacza, ale ich pliki .env nie zostaną zmienione — zachowają zmienne MAIL_* tego dostawcy (oraz jego hasło, jeśli zostało zapisane). Należy nadpisać blok poczty w każdym pliku .env.',
        borrado: (n: string) => `Usunięto ${n}`,
        usar: 'Użyj w projekcie',
        destino: 'Docelowy adres testowy',
        destinoPlaceholder: 'adres@przyklad.pl',
        probar: 'Przetestuj wysyłkę',
        probando: 'Wysyłanie…',
        probarAyuda:
          'Wysyła jedną rzeczywistą wiadomość e-mail na ten adres przez zweryfikowane szyfrowane połączenie. Maksymalnie jedna co 15 s.',
        sinClaveParaProbar: 'Należy zapisać hasło dostawcy, aby móc przetestować wysyłkę.',
        hostLocal: 'Nazwa tego serwera wskazuje na ten komputer lub sieć lokalną.',
        confirmarRed: 'Potwierdź sieć lokalną',
        enviado: (para: string) => `Wiadomość e-mail wysłana na adres ${para}. Proszę sprawdzić skrzynkę.`,
        fallos: {
          'correo.auth': 'Dostawca odrzucił nazwę użytkownika lub hasło.',
          'correo.conexion': 'Nie udało się połączyć: proszę sprawdzić host i port.',
          'correo.tls':
            'Szyfrowane połączenie jest nieprawidłowe (certyfikat, nazwa lub STARTTLS). Nic nie zostało wysłane.',
          'correo.rechazado':
            'Serwer odrzucił wiadomość lub adres. Proszę sprawdzić nadawcę: wielu dostawców akceptuje wyłącznie zweryfikowanego nadawcę lub domenę.',
          'correo.plazo': 'Serwer nie odpowiedział na czas (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Dodaj dostawcę SMTP',
        editar: (n: string) => `Edytuj ${n}`,
        preset: 'Dostawca',
        presetOtro: 'Inny (wpisanie danych ręcznie)',
        presetAyuda: 'Host i port pochodzą z oficjalnej dokumentacji każdego dostawcy.',
        documentacion: 'Zobacz dokumentację',
        region: 'Region',
        nombre: 'Nazwa',
        nombreObligatorio: 'Proszę wpisać nazwę.',
        host: 'Serwer (host)',
        hostAyuda: 'Wyłącznie nazwa lub adres IP, bez smtp:// i bez portu.',
        hostObligatorio: 'Proszę wpisać serwer.',
        puerto: 'Port',
        seguridad: 'Szyfrowanie',
        seguridadAyuda:
          'Zawsze wymagane jest szyfrowane połączenie z ważnym certyfikatem — nigdy nie następuje przejście na czysty tekst.',
        tls: 'Bezpośredni TLS (port 465)',
        starttls: 'STARTTLS (port 587)',
        usuario: 'Użytkownik',
        usuarioObligatorio: 'Proszę wpisać nazwę użytkownika.',
        usuarioFijoAyuda: 'Ten dostawca zawsze używa tej nazwy użytkownika; hasło pochodzi z konta dostawcy.',
        clave: 'Hasło SMTP',
        claveGuardada: (f: string) => `Zapisane: ••••${f}`,
        claveNueva: 'Proszę wpisać hasło, aby je zapisać',
        claveAyuda:
          'Jest zapisywane w postaci zaszyfrowanej na tym komputerze i nigdy więcej nie jest wyświetlane. Pozostawienie pustego pola zachowuje obecne hasło.',
        remitente: 'Nadawca testu (opcjonalnie)',
        remitenteAyuda:
          'Wielu dostawców wysyła wiadomości wyłącznie ze zweryfikowanego nadawcy lub domeny. Jeśli pole pozostanie puste, nadawcą będzie sam adres docelowy.',
        claveSinEspacios:
          'Proszę wkleić hasło dokładnie w takiej postaci, w jakiej przekazał je dostawca — wewnętrzne spacje są zachowywane.',
        borrarClave: 'Usuń hasło',
        borrarClaveTitulo: (n: string) => `Usunąć hasło dla ${n}?`,
        borrarClaveTexto: 'Zapisane hasło zostanie usunięte. Dostawca pozostanie na liście.',
        claveBorrada: 'Hasło zostało usunięte',
        guardar: 'Zapisz',
        guardado: (n: string) => `Zapisano ${n}`,
        redLocalTitulo: 'Serwer na tym komputerze lub w sieci lokalnej',
        redLocalTexto: (h: string) =>
          `${h} wskazuje na ten komputer lub sieć lokalną. WolfCore Dev połączy się z nim wyłącznie po potwierdzeniu. Czy jest to własny serwer?`,
        redLocalConfirmar: 'Tak, potwierdzam',
        cambiaTitulo: 'Wysłanie hasła na inny serwer',
        cambiaTexto: (h: string) =>
          `Ten dostawca ma zapisane hasło, a serwer lub użytkownik zostały zmienione. Hasło zostanie wysłane do ${h}. Kontynuować?`,
        cambiaConfirmar: 'Tak, kontynuuj',
      },
      env: {
        titulo: (n: string) => `Użyj ${n} w projekcie`,
        proyecto: 'Projekt',
        sinProyectos: 'Nie ma jeszcze żadnych projektów.',
        yaUsaSmtp: 'Ten projekt już wysyła pocztę przez dostawcę SMTP.',
        volverCaptador: 'Wróć do lokalnego przechwytywacza',
        volvio: (n: string) =>
          `Projekt ${n} ponownie wysyła pocztę do lokalnego przechwytywacza, ale jego plik .env nie został zmieniony — zachowuje zmienne MAIL_* dostawcy (oraz jego hasło, jeśli zostało zapisane). Należy nadpisać blok poczty.`,
        incluirClave: 'Zapisz również hasło w pliku .env',
        incluirClaveAyuda: 'Bez zaznaczenia blok nie zawiera MAIL_PASSWORD i hasło należy dopisać ręcznie.',
        sinClaveGuardada: 'Ten dostawca nie ma zapisanego hasła.',
        vista: 'Zmiany w pliku .env (hasło jest zamaskowane)',
        textoPlano:
          'Hasło zostanie zapisane w postaci jawnego tekstu w pliku .env projektu. Każdy, kto ma dostęp do tego folderu lub do repozytorium po jego wypchnięciu, będzie mógł je odczytać.',
        claveTitulo: 'Zapisanie hasła w pliku .env',
        claveTexto:
          'Hasło zostanie zapisane w postaci jawnego tekstu w pliku .env projektu. Należy używać tej opcji wyłącznie wtedy, gdy projekt nie jest wysyłany do repozytorium, a dostęp do folderu jest prywatny.',
        claveConfirmar: 'Rozumiem, dołącz hasło',
        agregarGitignore: 'Dodaj .env do .gitignore',
        gitignoreTitulo: 'Modyfikacja .gitignore',
        gitignoreTexto:
          'Linia .env zostanie dodana do pliku .gitignore projektu (z wcześniejszą kopią zapasową).',
        gitignoreConfirmar: 'Dodaj',
        versionadoTitulo: 'Git już śledzi plik .env',
        versionadoTexto:
          'Następny commit wyśle zapisane wartości. Należy usunąć plik z indeksu poleceniem git rm --cached .env.',
        desconocidoTitulo: 'Nie udało się sprawdzić git',
        desconocidoTexto: 'Nie udało się ustalić, czy git śledzi plik .env tego projektu.',
        aceptarVersionado: 'Zapisz mimo to',
        aceptarTitulo: 'Zapis w śledzonym pliku .env',
        aceptarTexto:
          'Jeśli git śledzi plik .env, te zmienne mogą trafić do repozytorium. Zapisać mimo to?',
        aceptarConfirmar: 'Zapisz mimo to',
        confirmarTitulo: 'Zapisanie w pliku .env',
        confirmarTexto: (ruta: string) =>
          `Zostanie utworzona kopia pliku ${ruta}, a następnie dodane zostaną zmienne MAIL_* bez hasła.`,
        confirmarTextoClave: (ruta: string) =>
          `Zostanie utworzona kopia pliku ${ruta}, a następnie dodane zostaną zmienne MAIL_* wraz z hasłem w postaci jawnego tekstu.`,
        confirmar: 'Zapisz',
        escribir: 'Zapisz w pliku .env',
        escrito: (n: string) => `Projekt ${n} wysyła teraz pocztę przez tego dostawcę`,
      },
    },
    estado: 'Stan',
    smtp: 'SMTP',
    buzon: 'Skrzynka webowa',
    abrirBuzon: 'Otwórz skrzynkę',
    noLeidos: 'Nieprzeczytane',
    noLeidosValor: (n: number) =>
      plural(n, 'nieprzeczytana wiadomość', 'nieprzeczytane wiadomości', 'nieprzeczytanych wiadomości'),
    noLeidosError: 'Nie udało się odczytać skrzynki',
    actualizar: 'Policz wiadomości ponownie',
    actualizaSolo: 'Odświeżane co 15 sekund, gdy ten ekran jest otwarty.',
    env: 'Blok dla pliku .env Laravel',
    envAyuda: (captador: string) =>
      `Proszę wkleić w pliku .env projektu. Poczta trafia do ${captador}, bez szyfrowania i bez nazwy użytkownika.`,
    copiarEnv: 'Kopiuj blok',
    irAServicios: 'Przejdź do Usług',
    cargando: 'Wczytywanie przechwytywaczy…',
    errorLista: 'Nie udało się odczytać listy przechwytywaczy',
    captador: {
      opcional: 'Opcjonalny',
      elegido: 'Odbiera pocztę z projektów',
      noInstalado: 'Nie zainstalowano',
      instalar: 'Zainstaluj',
      usar: 'Użyj tego',
      apagar: 'Wyłącz',
      iniciando: 'Uruchamianie…',
      avisoMantenimiento:
        'Ten przechwytywacz prawie nie jest już utrzymywany. Zaleca się użycie Mailpit lub smtp4dev.',
    },
    notaDescartados:
      'MailHog i MailDev nie są oferowane: MailHog nie publikuje sumy kontrolnej pozwalającej zweryfikować pobieranie, a MailDev istnieje wyłącznie w npm. Bez weryfikowalnej sumy kontrolnej nic nie jest pobierane.',
    notaHost:
      'Skrzynki webowe odpowiadają wyłącznie na 127.0.0.1, ale gdy przechwytywacz jest uruchomiony, złośliwa strona internetowa mogłaby spróbować odczytać skrzynkę (DNS rebinding). smtp4dev i Papercut odrzucają obce nagłówki Host; Mailpit udostępnia skrzynkę pod tajną ścieżką przypisaną do tego komputera (WolfCore Dev otwiera ten adres automatycznie); Inbucket nie ma żadnego zabezpieczenia — należy go wyłączyć, gdy nie jest używany.',
  },
  ia: {
    descripcion:
      'Dostawcy AI w chmurze oraz lokalne modele z Ollama. Klucze są zapisywane w postaci zaszyfrowanej na tym komputerze i nigdy nie są wyświetlane.',
    nube: {
      titulo: 'AI w chmurze',
      agregar: 'Dodaj dostawcę',
      vacio:
        'Nie dodano jeszcze żadnego dostawcy. Proszę dodać OpenAI, Anthropic, Gemini, Hermes (Nous) lub dostawcę zgodnego z OpenAI.',
      errorLista: 'Nie udało się odczytać listy dostawców',
    },
    local: { titulo: 'Lokalne AI (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Zgodny z OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Klucz',
      sinClave: 'Brak klucza',
      claveIlegible: 'Zapisany (nie udało się odczytać)',
      url: 'Bazowy adres URL',
      modeloPorDefecto: 'Domyślny model',
      ninguno: 'Brak',
      probarConexion: 'Przetestuj połączenie',
      probarConexionAyuda: 'Pobiera listę modeli dostawcy. Nie zużywa tokenów.',
      probando: 'Testowanie…',
      conectado: (ms: number, n: number) => `Połączono · ${ms} ms · ${plural(n, 'model', 'modele', 'modeli')}`,
      verModelos: (n: number) => `Pokaż ${plural(n, 'model', 'modele', 'modeli')}`,
      soloGratuitos: 'Tylko darmowe',
      fallo: 'Nie udało się połączyć',
      probarMensaje: 'Przetestuj wiadomość',
      probarMensajeAyuda:
        'Wysyła krótką, stałą wiadomość, aby sprawdzić, czy model odpowiada. Zużywa niewielką liczbę tokenów.',
      elegirModelo: 'Model dla wiadomości',
      sinModelo: 'Należy przetestować połączenie lub ustawić domyślny model, aby dokonać wyboru.',
      enviando: 'Wysyłanie…',
      respuesta: (ms: number) => `Odpowiedź w ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} tokenów wejściowych, ${salida} wyjściowych`,
      usar: 'Użyj w projekcie',
      editar: 'Edytuj',
      borrar: 'Usuń',
      acciones: (nombre: string) => `Akcje dla ${nombre}`,
    },
    costo: {
      titulo: 'Przetestuj wiadomość',
      texto: (modelo: string, proveedor: string) =>
        `Zostanie wysłana krótka, stała wiadomość do modelu ${modelo} dostawcy ${proveedor}. Zużywa to tokeny z konta: odpowiedź jest ucinana po 16 tokenach i zazwyczaj kosztuje ułamek centa.`,
      enviar: 'Wyślij wiadomość',
    },
    dialogo: {
      nuevo: 'Dodaj dostawcę AI',
      editar: (nombre: string) => `Edytuj ${nombre}`,
      tipo: 'Typ',
      preset: 'Zgodny dostawca',
      presetAyuda: 'Uzupełnia nazwę i adres URL; wartości można zmienić.',
      presetOtro: 'Inny',
      documentacion: 'Zobacz dokumentację',
      nombre: 'Nazwa',
      urlBase: 'Bazowy adres URL',
      urlAyuda: 'Puste = oficjalny adres. Wyłącznie https:// lub http:// dla 127.0.0.1 albo [::1] (LM Studio).',
      urlObligatoria: 'Proszę wpisać bazowy adres URL zgodnego dostawcy.',
      modelo: 'Domyślny model (opcjonalnie)',
      modeloAyuda: 'Używany w bloku .env (AI_MODEL) oraz w wiadomości testowej.',
      clave: 'Klucz API',
      claveNueva: 'Proszę wkleić klucz',
      claveGuardada: (final: string) =>
        `Zapisano klucz (${final}). Nowy klucz należy wpisać wyłącznie w celu jego zastąpienia.`,
      claveAyuda:
        'Jest zapisywany w postaci zaszyfrowanej na tym komputerze i nigdy więcej nie jest wyświetlany. Widoczne są wyłącznie 4 ostatnie znaki.',
      claveOpcional: 'Opcjonalne dla lokalnych serwerów (LM Studio).',
      borrarClave: 'Usuń klucz',
      guardar: 'Zapisz',
      guardado: (nombre: string) => `Zapisano ${nombre}`,
      urlCambiaTitulo: 'Klucz zostanie wysłany na inny adres URL',
      urlCambiaTexto: (url: string) =>
        `Ten dostawca ma zapisany klucz. Od teraz będzie on wysyłany pod adres ${url}. Należy potwierdzić wyłącznie w przypadku zaufania temu serwerowi.`,
      urlCambiaConfirmar: 'Wyślij klucz na nowy URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Usunąć klucz dla ${nombre}?`,
      claveTexto:
        'Klucz zostanie usunięty z tego komputera. Pliki .env, w których został zapisany, pozostaną bez zmian — w przypadku jego unieważnienia należy go tam również zmienić.',
      proveedorTitulo: (nombre: string) => `Usunąć ${nombre}?`,
      proveedorTexto:
        'Dostawca oraz zapisany klucz zostaną usunięte. Pliki .env projektów pozostaną bez zmian.',
      respaldos: (n: number) =>
        n === 1
          ? 'Usuń również kopie pliku .env z 1 projektu zawierające ten klucz w postaci jawnego tekstu'
          : `Usuń również kopie pliku .env z ${n} projektów zawierające ten klucz w postaci jawnego tekstu`,
      respaldosAyuda:
        'WolfCore Dev zapisuje kopie pliku .env przed jego nadpisaniem, poza folderami projektów. Ich usunięcia nie można cofnąć.',
      claveBorrada: 'Klucz został usunięty',
      proveedorBorrado: (nombre: string) => `Usunięto ${nombre}`,
      respaldosBorrados: (n: number) =>
        `Usunięto kopie pliku .env z ${plural(n, 'projektu', 'projektów', 'projektów')}`,
    },
    env: {
      titulo: (nombre: string) => `Użyj ${nombre} w projekcie`,
      proyecto: 'Projekt',
      sinProyectos: 'Brak zamontowanych projektów.',
      modelo: 'Model (AI_MODEL)',
      modeloAyuda: 'Opcjonalnie. Proszę wybrać z listy lub wpisać ręcznie.',
      vista: 'Blok, który zostanie zapisany w .env (klucz jest zamaskowany)',
      cargando: 'Przygotowywanie podglądu…',
      textoPlano:
        'Klucz zostanie zapisany w postaci jawnego tekstu w pliku .env projektu. Każdy, kto ma dostęp do tego folderu, będzie mógł go odczytać.',
      copiaPrevia:
        'Bieżący plik .env zostanie wcześniej skopiowany poza projekt (do folderu danych WolfCore Dev).',
      sinClave: 'Ten dostawca wymaga klucza — należy go zapisać przed użyciem w projekcie.',
      gitignoreFalta: 'Plik .gitignore projektu nie ignoruje .env.',
      gitignoreNoExiste: 'Projekt nie ma pliku .gitignore.',
      gitignoreOk: 'Plik .gitignore już ignoruje .env.',
      agregarGitignore: 'Dodaj .env do .gitignore',
      gitignoreTitulo: 'Modyfikacja .gitignore',
      gitignoreTexto:
        'Linia .env zostanie dodana do pliku .gitignore projektu (lub plik zostanie utworzony), z wcześniejszą kopią zapasową.',
      gitignoreConfirmar: 'Dodaj do .gitignore',
      versionadoTitulo: 'Git już śledzi plik .env tego projektu',
      versionadoTexto:
        'Mimo wpisu w .gitignore następny commit wyśle klucz. Przed jego zapisaniem należy usunąć plik z indeksu i wykonać commit:',
      desconocidoTitulo: 'Nie udało się sprawdzić, czy git śledzi .env',
      desconocidoTexto:
        'Git nie odpowiedział (nie jest zainstalowany lub folder nie jest zaufany). Jeśli .env znajduje się już w repozytorium, następny commit wyśle klucz. Można to sprawdzić poleceniem:',
      aceptarVersionado: 'Rozumiem ryzyko: zapisz klucz mimo to',
      aceptarTitulo: 'Zapis mimo ryzyka wysłania klucza przez git',
      aceptarTexto:
        'Jeśli plik .env znajduje się w repozytorium, klucz trafi do następnego commitu oraz do historii. Należy to zrobić wyłącznie po wykonaniu git rm --cached .env lub gdy repozytorium jest prywatne.',
      aceptarConfirmar: 'Akceptuję ryzyko',
      conflictoTitulo: 'Plik .env definiuje już te zmienne z inną wartością',
      reemplazar: (claves: string) => `Zastąp ${claves}`,
      reemplazarTitulo: 'Zastąpienie zmiennych w .env',
      reemplazarTexto: (claves: string) =>
        `Istniejące linie ${claves} w pliku .env zostaną usunięte i zastąpione blokiem WolfCore Dev. Poprzedni plik .env zostanie wcześniej skopiowany.`,
      reemplazarConfirmar: 'Zastąp',
      escribir: 'Zapisz w .env',
      confirmarTitulo: 'Zapisanie klucza w postaci jawnego tekstu',
      confirmarTexto: (carpeta: string) =>
        `Klucz zostanie zapisany bez szyfrowania w ${carpeta}. Nie należy udostępniać tego pliku ani wysyłać go do repozytorium.`,
      confirmar: 'Zapisz klucz',
      escrito: (proyecto: string) => `Blok AI został zapisany w pliku .env projektu ${proyecto}`,
      copiarComando: 'Kopiuj polecenie',
    },
  },
  iaLocal: {
    descripcion:
      'Modele językowe działające lokalnie na tym komputerze za pomocą Ollama. Można z nich korzystać w projektach bez wysyłania danych do internetu.',
    sinInstalarTitulo: 'Ollama nie jest zainstalowana',
    sinInstalar: 'Należy zainstalować ją w sekcji Usługi, aby pobierać i uruchamiać modele lokalnie.',
    irAServicios: 'Przejdź do Usług',
    apagadoTitulo: 'Ollama jest wyłączona',
    apagado: 'Należy ją uruchomić, aby przeglądać, pobierać i testować modele.',
    iniciando: 'Uruchamianie Ollama…',
    errorTitulo: 'Nie udało się uruchomić Ollama',
    encender: 'Uruchom Ollama',
    verServicios: 'Zobacz w Usługach',
    modelos: 'Zainstalowane modele',
    sinModelos: 'Brak modeli. Proszę pobrać model poniżej.',
    errorModelos: 'Nie udało się odczytać listy modeli',
    recargar: 'Odśwież listę',
    total: (n: number) => plural(n, 'model', 'modele', 'modeli'),
    espacio: 'Zajęte miejsce',
    espacioAyuda: 'Miejsce zajmowane przez wszystkie modele w folderze danych.',
    probarDe: (modelo: string) => `Przetestuj ${modelo}`,
    borrarDe: (modelo: string) => `Usuń ${modelo}`,
    borrarTitulo: (modelo: string) => `Usunąć model ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `Zwolni to ${tamano} miejsca na dysku. Aby użyć go ponownie, konieczne będzie ponowne pobranie.`,
    borrado: (modelo: string) => `Model ${modelo} został usunięty`,
    descargar: {
      titulo: 'Pobierz model',
      campo: 'Nazwa modelu',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Proszę wpisać nazwę używaną w Ollama (ollama.com/library) lub wybrać sugestię.',
      sugerenciaAyuda: {
        'llama3.2': 'Ogólny czat, lekki',
        'qwen2.5-coder': 'Programowanie',
        mistral: 'Ogólny czat',
        'nomic-embed-text': 'Osadzenia (embeddings) do wyszukiwania (boty)',
      } as Record<string, string>,
      boton: 'Pobierz',
      invalido: 'Dozwolone są litery, cyfry oraz znaki . _ : / - (na przykład llama3.2)',
      yaInstalado: 'Ten model jest już zainstalowany',
      enCurso: 'Ten model jest już pobierany',
      confirmarTitulo: (modelo: string) => `Pobrać ${modelo}?`,
      confirmarTexto:
        'Modele zazwyczaj zajmują kilka GB (od 1 do ponad 40 w zależności od rozmiaru). Ollama nie podaje rozmiaru przed rozpoczęciem — będzie widoczny na pasku postępu, a pobieranie można w dowolnym momencie anulować.',
      confirmar: 'Pobierz',
    },
    progreso: {
      fases: {
        preparando: 'Przygotowywanie…',
        descargando: 'Pobieranie',
        verificando: 'Weryfikowanie',
        guardando: 'Zapisywanie',
        listo: 'Gotowe',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} z ${total}`,
      cancelarDe: (modelo: string) => `Anuluj pobieranie ${modelo}`,
      cancelando: 'Anulowanie…',
      listo: (modelo: string) => `Pobrano ${modelo}`,
      cancelado: (modelo: string) => `Anulowano pobieranie ${modelo}`,
      error: (modelo: string) => `Nie udało się pobrać ${modelo}`,
      descartar: 'Odrzuć',
      descartarDe: (modelo: string) => `Odrzuć powiadomienie dla ${modelo}`,
    },
    prueba: {
      titulo: 'Przetestuj model',
      modelo: 'Model',
      elegir: 'Wybór modelu',
      prompt: 'Wiadomość',
      placeholder: 'Proszę wpisać krótkie pytanie i nacisnąć Enter',
      enviar: 'Wyślij',
      respuesta: 'Odpowiedź',
      pensando: 'Model generuje odpowiedź… za pierwszym razem ładowanie może chwilę potrwać.',
      vacia: '(Model nie zwrócił żadnego tekstu.)',
      sinModelos: 'Należy pobrać model, aby go przetestować.',
    },
    conexion: {
      titulo: 'Połączenie z projektów',
      base: 'Bazowy adres URL Ollama',
      openai: 'Endpoint zgodny z OpenAI',
      env: 'Blok dla pliku .env',
      envAyuda:
        'Sprawdza się w Laravel lub w bocie z FastAPI. WolfCore Dev nie zapisuje zmian w projektach.',
      copiarEnv: 'Kopiuj blok',
      copiarDato: (dato: string) => `Kopiuj ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code i Codex będzie można połączyć z tymi modelami jednym kliknięciem w Etapie B.',
  },
  proyectos: {
    titulo: 'Projekty',
    descripcion:
      'Każdy projekt to folder ze stroną .test, instrukcją instalacji i procesami.',
    agregar: 'Dodaj projekt',
    vacioTitulo: 'Brak projektów',
    vacio:
      'Proszę sklonować repozytorium z GitHub lub wybrać folder: WolfCore Dev rozpozna typ projektu i przygotuje go krok po kroku.',
    pasos: {
      porTipo: {
        'composer-install': 'Zainstaluj zależności PHP (composer install)',
        'env-crear': 'Utwórz plik .env',
        'key-generate': 'Wygeneruj klucz aplikacji',
        'bd-crear': 'Utwórz bazę danych',
        'bd-restaurar': 'Przywróć kopię zapasową',
        migrar: 'Przeprowadź migrację bazy danych',
        'storage-link': 'Utwórz dowiązanie storage (storage:link)',
        'npm-ci': 'Zainstaluj zależności Node (npm ci)',
        'npm-build': 'Skompiluj zasoby (npm run build)',
        'python-venv': 'Utwórz środowisko wirtualne (.venv)',
        'pip-install': 'Zainstaluj zależności Python (pip)',
        'pgvector-activar': 'Włącz pgvector w bazie danych',
        'sitio-crear': 'Utwórz stronę',
        comando: 'Polecenie projektu',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Utwórz stronę ${dominio}` : 'Utwórz stronę'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Przywróć kopię zapasową ${archivo}` : 'Przywróć kopię zapasową',
      migrar: 'Przeprowadź migrację bazy danych',
      migrarSemilla: 'Przeprowadź migrację bazy danych i załaduj dane testowe (--seed)',
      comando: (linea: string) => (linea ? `Uruchom: ${linea}` : 'Polecenie projektu'),
    },
    estadoPaso: {
      pendiente: 'Oczekuje',
      corriendo: 'W trakcie',
      listo: 'Gotowe',
      error: 'Błąd',
      omitido: 'Pominięto',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Nieprzygotowany',
      corriendo: 'Przygotowywanie…',
      lista: 'Przygotowany',
      error: 'Jeden z kroków zakończył się błędem',
      cancelada: 'Przygotowanie anulowane',
      incompleta: 'Przygotowanie niekompletne',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Dodaj projekt',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Folder' },
      destino: 'Folder docelowy',
      destinoAyuda: (base: string) =>
        `Klonowanie nastąpi do ${base}. Aby wybrać inną lokalizację, należy użyć opcji „Wybierz folder…”.`,
      nombreCarpeta: 'Nazwa folderu',
      nombrePlaceholder: 'nazwa-projektu',
      elegirDestino: 'Wybierz folder…',
      destinoPorDefecto: 'Użyj folderu projektów',
      clonar: 'Sklonuj',
      clonando: 'Klonowanie…',
      clonado: 'Repozytorium zostało sklonowane',
      errorClonar: 'Nie udało się sklonować repozytorium',
      sinCancelar:
        'Klonowania nie można przerwać z tego poziomu — należy poczekać na jego zakończenie (może to potrwać kilka minut).',
      sinGit: 'Git nie jest zainstalowany. Należy go zainstalować (git-scm.com) i ponownie otworzyć to okno.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Połączono z GitHub CLI jako ${usuario}` : 'Połączono z GitHub CLI',
      estadoToken: 'Połączono za pomocą tokena osobistego',
      estadoNinguna: 'Brak połączenia z GitHub',
      ayudaNinguna:
        'Proszę zalogować się za pomocą GitHub CLI (zalecane) lub użyć szczegółowego tokena osobistego z uprawnieniem odczytu zawartości.',
      instalarGh: 'Zainstaluj GitHub CLI',
      instalandoGh: 'Instalowanie GitHub CLI…',
      ghInstalado: 'GitHub CLI zostało zainstalowane. Proszę się teraz zalogować.',
      iniciarSesion: 'Zaloguj się',
      sesionAbierta:
        'Otwarto okno logowania. Po zakończeniu należy kliknąć „Sprawdź ponownie”.',
      comprobar: 'Sprawdź ponownie',
      usarToken: 'Użyj tokenu',
      token: 'Osobisty token GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Zostaje zapisany w formie zaszyfrowanej na tym komputerze i nigdy nie jest ponownie wyświetlany ani zapisywany w projektach.',
      guardarToken: 'Zapisz token',
      tokenGuardado: 'Token zapisany',
      quitarToken: 'Usuń token',
      tokenQuitado: 'Token usunięty',
      buscar: 'Szukaj repozytoriów',
      cargando: 'Ładowanie repozytoriów…',
      sinRepos: 'Nie znaleziono repozytoriów.',
      cargarMas: 'Załaduj więcej',
      privado: 'Prywatne',
      yaClonado: 'Już sklonowane',
      yaClonadoAyuda: 'Istnieje już projekt z tym repozytorium lub w jego folderze docelowym.',
      actualizado: (fecha: string) => `Zaktualizowano ${fecha}`,
      elegir: 'Wybierz',
      errorRepos: 'Nie udało się odczytać listy repozytoriów',
    },
    url: {
      etiqueta: 'Adres URL repozytorium',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:ścieżka lub użytkownik/projekt (GitHub). Bez nazwy użytkownika ani hasła w adresie URL.',
      invalida: 'Należy użyć formatu https://…, git@host:ścieżka lub użytkownik/projekt',
    },
    carpeta: {
      titulo: 'Projekt znajdujący się już na komputerze',
      texto: 'Proszę wybrać folder: typ projektu zostanie wykryty i zaproponowana zostanie jego receptura.',
      elegir: 'Wybierz folder',
      manual: 'Dodaj bez receptury (konfiguracja ręczna)',
      yaEsProyecto: (nombre: string) => `Ten folder jest już projektem ${nombre}.`,
      vigilarTitulo: 'Monitorowany folder',
      vigilarTexto:
        'WolfCore Dev wysyła powiadomienie, gdy pojawi się nowy folder wyglądający jak projekt. To także miejsce, do którego klonowane są repozytoria.',
      vigilando: (carpeta: string) => `Monitorowanie: ${carpeta}`,
      sinVigilar: 'Żaden folder nie jest monitorowany.',
      vigilar: 'Wybierz folder do monitorowania',
      cambiarVigilada: 'Zmień',
      dejarDeVigilar: 'Przestań monitorować',
    },
    asistente: {
      titulo: (nombre: string) => `Przygotowanie: ${nombre}`,
      cargando: 'Analizowanie projektu…',
      origenYml: 'Receptura pochodzi z pliku wolfcore.yml w repozytorium.',
      origenDefecto: 'Receptura zaproponowana na podstawie typu projektu.',
      deteccion: 'Wykryte ustawienia',
      deteccionAyuda: 'Proszę poprawić, jeśli coś nie zgadza się z projektem.',
      tipo: 'Typ',
      php: 'PHP',
      phpNinguno: 'Brak zainstalowanych wersji',
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
      versionAuto: 'Wykryta automatycznie',
      servicios: 'Usługi',
      serviciosNinguno: 'Brak',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Wykryto: ${v}`,
      nodeInstalar: 'Node nie jest zainstalowany: należy go zainstalować w sekcji Usługi.',
      pythonInstalar: 'Python nie jest zainstalowany: należy go zainstalować w sekcji Usługi.',
      lenguajeInstalar: (nombre: string) =>
        `${nombre} nie jest zainstalowany: należy go zainstalować w sekcji Usługi.`,
      dominio: 'Domena',
      puertoProxy: 'Port lokalny',
      puertoPlaceholder: '8000',
      receta: 'Kroki',
      recetaAyuda:
        'Wykonywane w kolejności. Niechciane kroki można wyłączyć; kroki opcjonalne można przesuwać.',
      subir: 'W górę',
      bajar: 'W dół',
      fijo: 'Ten krok jest wymagany',
      restaurar: 'Przywróć kopię zapasową…',
      cambiarRespaldo: 'Zmień kopię zapasową',
      quitarRespaldo: 'Usuń kopię zapasową',
      sobrescribir: 'Nadpisz bazę danych, jeśli zawiera już tabele',
      semilla: 'Załaduj dane testowe (--seed)',
      sinMotor:
        'Brak bazy danych: należy wybrać silnik w sekcji Usługi, aby ją utworzyć lub przywrócić kopię zapasową.',
      confio: 'Ufam temu repozytorium: uruchom kroki instalacji',
      confioAyuda:
        'Kroki uruchamiają programy projektu (composer, npm, pip, migracje) na tym komputerze. Należy zaznaczyć tylko w przypadku znajomości kodu.',
      montar: 'Skonfiguruj projekt',
      montando: 'Konfigurowanie projektu…',
      reintentar: 'Ponów',
      omitir: 'Pomiń',
      cancelar: 'Anuluj',
      cancelando: 'Anulowanie…',
      cerrar: 'Zamknij',
      cerrarCorriendo: 'Ukryj (działa w tle)',
      abrirSitio: 'Otwórz stronę',
      verRegistro: 'Pokaż log',
      ocultarRegistro: 'Ukryj log',
      listo: 'Projekt jest gotowy.',
      fallo: (paso: string) =>
        `Błąd w kroku: ${paso}. Można ponowić, pominąć lub anulować; żadne zmiany nie zostały cofnięte.`,
      cancelada: 'Przygotowanie zostało anulowane. Można je wznowić z poziomu karty projektu.',
      incompleta: 'Pozostały niewykonane kroki.',
      errorCrear: 'Nie udało się utworzyć projektu',
      errorReceta: 'Nie udało się odczytać receptury',
      recetaCambio:
        'Receptura projektu (wolfcore.yml) zmieniła się od czasu udzielenia zaufania. Ponowienie używa ostatnio zapisanej receptury.',
      recargar: 'Sprawdź nową recepturę',
      seguirGuardada: 'Kontynuuj z zapisaną',
      soloLectura:
        'Typ, PHP, domena, wersje i port są przypisane do projektu: można je zmienić w opcji Edytuj.',
    },
    tarjeta: {
      receta: 'Przygotowanie',
      reinstalar: 'Zainstaluj ponownie zależności',
      reinstalarTitulo: (nombre: string) => `Uruchomić recepturę projektu ${nombre}?`,
      reinstalarTexto:
        'Zostaną powtórzone kroki z ostatniego przygotowania (te, które zatwierdzono w kreatorze):',
      noRestaura: 'nie jest ponownie przywracana',
      recetaCambio:
        'Receptura projektu (wolfcore.yml) zmieniła się od czasu udzielenia zaufania. Ponowna instalacja powtarza zapisaną wersję; należy użyć „Sprawdź recepturę”, aby przejrzeć nową.',
      revisarReceta: 'Sprawdź recepturę',
      preparar: 'Przygotuj…',
      ejecutar: 'Uruchom',
      verPreparacion: 'Pokaż przygotowanie',
      sinConfianza:
        'Należy przejrzeć recepturę i zaznaczyć „Ufam temu repozytorium” w kreatorze, aby móc ją uruchomić.',
      runtimes: 'Powiadomienia o wersjach',
      verRegistros: 'Pokaż logi',
      abrirAgente: 'Otwórz agenta AI',
      vscode: 'Edytor',
      vscodeAyuda: 'Otwórz folder projektu w domyślnym edytorze',
      vscodeError: 'Nie udało się otworzyć edytora',
      baseDatos: 'Baza danych',
      baseDatosAyuda: (base: string) =>
        `Otwórz bazę „${base}” z automatycznym logowaniem (Adminer lub phpMyAdmin)`,
      baseDatosSinDetectar: 'Otwórz bazę danych projektu (Adminer lub phpMyAdmin)',
      sinBase: 'Plik .env projektu nie deklaruje bazy MySQL, MariaDB ani PostgreSQL.',
      adminerNoListo: 'Adminer nie jest gotowy',
      entradaAutomatica: 'Automatyczne logowanie bez wpisywania hasła.',
      elegirBd: 'Wybierz Adminer lub phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (tylko MySQL i MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin nie jest gotowy',
      entroComoAdmin: (usuario: string) =>
        `Zalogowano jako ${usuario}, administrator serwera, ponieważ ten projekt nie używa własnego użytkownika. W menedżerze .env opcja „Użyj własnego użytkownika” tworzy konto ograniczone do tej bazy.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Zalogowano jako ${usuario}, administrator serwera: hasło własnego użytkownika tego projektu nie jest zapisane na tym komputerze. W menedżerze .env opcja „Użyj własnego użytkownika” generuje nowe.`,
      abrirSitio: 'Otwórz stronę w przeglądarce',
      github: 'Repozytorium',
      abrirRemoto: (url: string) => `Otwórz ${url}`,
      confiado: 'Zaufane',
      confiadoAyuda: 'Kroki instalacji mogą być uruchamiane.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Odłączony HEAD',
      cambios: (n: number) => plural(n, 'niezapisana zmiana', 'niezapisane zmiany', 'niezapisanych zmian'),
      limpio: 'Brak zmian',
      atras: (n: number) => `${n} do pobrania`,
      adelante: (n: number) => `${n} do wysłania`,
      traer: 'Pobierz zmiany',
      traerAyuda: 'git pull bez scalania: w przypadku lokalnych zmian lub rozbieżnych gałęzi nic nie jest modyfikowane.',
      alDia: 'Repozytorium jest już aktualne.',
      actualizado: 'Pobrano zmiany',
      sugeridosTitulo: 'Pobrano zmiany',
      sugeridosTexto: 'Na podstawie wprowadzonych zmian warto wykonać następujące kroki:',
      sugeridosNinguno: 'Nie trzeba wykonywać żadnych kroków.',
      migracionesNuevas: (n: number) => plural(n, 'nowa migracja', 'nowe migracje', 'nowych migracji'),
      ejecutarSugeridos: 'Wykonaj kroki',
      corridaTitulo: 'Kroki po pobraniu zmian',
      corridaAyuda: 'Nie zmienia zapisanej receptury projektu.',
      ahoraNo: 'Nie teraz',
      errorEstado: 'Nie udało się odczytać statusu Git',
      commitIa: {
        boton: 'Zaproponuj commit',
        ayuda:
          'Proponuje za pomocą AI komunikat dla zmian w poczekalni (git add) i wykonuje commit po zatwierdzeniu.',
        titulo: 'Commit z sugerowanym komunikatem',
        proveedor: 'Dostawca AI',
        modelo: 'Model',
        sinProveedores:
          'Należy skonfigurować dostawcę AI w chmurze (ekran AI), aby sugerować komunikaty.',
        privacidad:
          'Do dostawcy wysyłany jest wyłącznie diff ze zmian w poczekalni, bez plików .env, haseł, certyfikatów, plików poświadczeń ani plików binarnych, maksymalnie 20 000 znaków. Zużywa niewiele tokenów.',
        sugerir: 'Zaproponuj komunikat',
        mensaje: 'Komunikat (można edytować)',
        commit: 'Wykonaj commit',
        commitAyuda: 'Tylko zmiany w poczekalni (git add): nie dodaje plików ani nie wykonuje push.',
        hecho: 'Commit został wykonany dla zmian w poczekalni.',
      },
    },
    procesos: {
      titulo: 'Procesy',
      /** Komunikat nadzorcy procesu bez ponownego uruchamiania, który zakończył się kodem 0. */
      terminado: 'Zakończono bez błędów',
      ninguno: 'Brak procesów. Można dodać npm run dev, queue:work, uvicorn…',
      agregar: 'Dodaj proces',
      editar: 'Edytuj proces',
      nuevo: 'Nowy proces',
      interruptor: (nombre: string) => `Włącz lub wyłącz ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'Nginx kieruje stronę do tego procesu.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'restart', 'restarty', 'restartów'),
      verLog: 'Pokaż log',
      ocultarLog: 'Ukryj log',
      logVacio: 'Brak danych wyjściowych.',
      abrirCarpetaLog: 'Otwórz folder logów',
      quitar: 'Usuń proces',
      quitarTitulo: (nombre: string) => `Usunąć proces ${nombre}?`,
      quitarTexto: 'Jeśli jest uruchomiony, zostanie zatrzymany.',
      nombre: 'Nazwa',
      nombrePlaceholder: 'Vite',
      comando: 'Polecenie',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Program i argumenty bez powłoki. Dla argumentów ze spacjami należy użyć cudzysłowu.',
      cwd: 'Folder',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz lub podfolder projektu (na przykład frontend).',
      puertoCampo: 'Port',
      puertoNinguno: 'Brak',
      puertoAyuda: 'Tylko informacyjnie, chyba że proces jest celem proxy.',
      autoIniciar: 'Uruchom przy starcie WolfCore Dev',
      reiniciar: 'Uruchom ponownie w razie awarii',
      esProxy: 'Cel proxy Nginx',
      requiereReinicio:
        'Proces jest uruchomiony: zmiany polecenia, folderu lub portu zostaną zastosowane po jego ponownym uruchomieniu.',
      reinicieAhora: 'Zapisano. Należy wyłączyć i włączyć proces, aby zastosować zmiany.',
      guardado: 'Proces zapisany',
      errores: {
        comando: 'Proszę wpisać polecenie',
        puerto: 'Port musi być z zakresu od 1 do 65535',
        proxySinPuerto: 'Cel proxy wymaga podania portu',
        cwd: 'Należy użyć raiz lub podfolderu wewnątrz projektu',
        repetido: 'Istnieje już proces o takiej nazwie',
      },
      estados: {
        encendido: 'Włączony',
        apagado: 'Wyłączony',
        iniciando: 'Uruchamianie…',
        error: 'Błąd',
        externo: 'Zewnętrzny',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Logi projektu ${nombre}`,
      fuente: 'Źródło',
      ninguna: 'Ten projekt nie ma jeszcze żadnych logów.',
      vacio: 'Log jest pusty.',
      actualizar: 'Odśwież',
      abrirCarpeta: 'Otwórz folder',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Znaleziono nowy folder, który wygląda jak projekt'
          : `Znaleziono ${plural(n, 'nowy folder, który wygląda jak projekt', 'nowe foldery, które wyglądają jak projekty', 'nowych folderów, które wyglądają jak projekty')}`,
      montar: 'Przygotuj',
      ignorar: 'Ignoruj',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Nieprzeczytane wiadomości',
    correoApagado: 'Mailpit wyłączony',
    correoSinInstalar: 'Mailpit niezainstalowany',
    modelos: 'Modele AI',
    iaApagada: 'Ollama wyłączona',
    iaSinInstalar: 'Ollama niezainstalowana',
    sinLeer: 'Nie udało się odczytać',
    sinDato: '—',
  },
  /* ───────────── Panel wydajności, przeglądarka logów i MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'd',
    /** Proces roboczy N usługi (np. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Wydajność',
    ventana: 'Ostatnie 5 minut',
    pausado: 'Wstrzymano, gdy okno jest ukryte',
    esperando: 'Oczekiwanie na pierwszą próbkę…',
    errorMuestreo: (detalle: string) => `Nie udało się uruchomić próbkowania wydajności: ${detalle}`,
    cpu: 'CPU',
    ram: 'Pamięć',
    disco: 'Dysk danych',
    red: 'Sieć',
    deTotal: (usado: string, total: string) => `${usado} z ${total}`,
    libre: (libre: string) => `${libre} wolne`,
    bajada: 'Pobieranie',
    subida: 'Wysyłanie',
    graficaCpu: (valor: string) => `Wykres CPU z ostatnich 5 minut; obecnie ${valor}`,
    graficaRam: (valor: string) => `Wykres pamięci z ostatnich 5 minut; obecnie ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Wykres sieci z ostatnich 5 minut; pobieranie ${bajada}, wysyłanie ${subida}`,
    alertas: {
      titulo: 'Alerty',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Port ${puerto} usługi ${servicio} jest używany przez inny program: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Zużycie pamięci komputera wynosi ${porcentaje}%. Warto wyłączyć nieużywane elementy, aby poprawić płynność działania.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Proces php-cgi spoza WolfCore Dev (PID ${pid}) nasłuchuje na portach ${puertos.join(', ')}: pozostał po poprzedniej sesji.`,
      finalizar: 'Zakończ proces',
      finalizarTitulo: 'Zakończyć ten proces?',
      finalizarTexto: (nombre: string, pid: number) =>
        `Proces ${nombre} (PID ${pid}) zostanie zamknięty bez zapisania otwartych danych. Należy użyć tej opcji wyłącznie wtedy, gdy program nie jest potrzebny.`,
      finalizado: (nombre: string) => `Zakończono: ${nombre}`,
      verPuertos: 'Pokaż porty',
      errorPuertos: 'Nie udało się sprawdzić, które programy używają portów.',
    },
    procesos: {
      titulo: 'Usługi i procesy',
      vacio: 'Brak uruchomionych usług i procesów projektów.',
      nombre: 'Nazwa',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Port',
      encendido: 'Czas pracy',
      acciones: 'Akcje',
      detener: 'Zatrzymaj',
      registros: 'Pokaż logi',
      servicio: 'Usługa',
      proyecto: 'Projekt',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Logi',
    descripcion:
      'Śledzenie na żywo logów Nginx, PHP, usług, stron, procesów projektów oraz tuneli.',
    fuente: 'Źródło',
    elegirFuente: 'Wybierz log',
    sinFuentes:
      'Nie ma jeszcze żadnych logów. Pojawią się, gdy usługa, strona lub proces zapisze pierwszy wpis.',
    buscar: 'Filtruj według tekstu',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Wstrzymaj',
    reanudar: 'Wznów',
    pausadoNuevas: (n: number) =>
      `${plural(n, 'nowa linia', 'nowe linie', 'nowych linii')} (wstrzymano)`,
    copiar: 'Kopiuj widoczne',
    copiadas: (n: number) => `Skopiowano ${plural(n, 'linię', 'linie', 'linii')}`,
    limpiar: 'Wyczyść',
    abrirCarpeta: 'Otwórz folder',
    alFinal: 'Śledź koniec',
    mostrarMas: 'Pokaż więcej',
    ocultas: (n: number) =>
      `${plural(n, 'poprzednia ukryta linia', 'poprzednie ukryte linie', 'poprzednich ukrytych linii')}`,
    vacio: 'Brak linii. Nowe wpisy pojawią się tutaj zaraz po zapisaniu.',
    sinCoincidencias: 'Żadna linia nie pasuje do filtra.',
    cuenta: (visibles: number, total: number) =>
      visibles === total
        ? plural(total, 'linia', 'linie', 'linii')
        : `${visibles} z ${total} linii`,
    descartadas: (n: number) =>
      `(przechowywane jest ostatnie 5000; odrzucono ${plural(n, 'starszą linię', 'starsze linie', 'starszych linii')})`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Usługi',
      sitio: 'Strony',
      laravel: 'Laravel',
      proyecto: 'Procesy projektów',
      tunel: 'Tunele',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (dostęp)',
      nginxError: 'Nginx (błędy)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (dostęp)`,
      sitioError: (dominio: string) => `${dominio} (błędy)`,
      tunel: (sitio: string) => `Tunel strony ${sitio}`,
      tunelSalida: (sitio: string) => `Tunel strony ${sitio} (wyjście)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Aby zobaczyć zmianę, należy otworzyć nowy terminal: już otwarte terminale jej nie widzą.',
    enPathSinCliente: 'W zmiennej PATH, ale brakuje polecenia',
    reparar: 'Napraw',
    repararTitulo: 'Naprawić polecenie wolf?',
    repararTexto:
      'Polecenie wolf znajduje się w zmiennej PATH, ale jego pliki są niekompletne. Zostaną ponownie skopiowane do folderu danych, a lokalny serwer zostanie uruchomiony, tak jak podczas dodawania.',
    titulo: 'Terminal: polecenie wolf',
    descripcion:
      'Zarządzanie WolfCore Dev z poziomu PowerShell, cmd lub Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Działa tylko przy otwartej aplikacji.',
    activo: 'Dostępne w PATH',
    enPathSinServidor: 'W PATH, serwer wyłączony',
    inactivo: 'Brak w PATH',
    agregarBoton: 'Dodaj wolf do PATH',
    quitarBoton: 'Usuń wolf z PATH',
    agregarTitulo: 'Dodać wolf do zmiennej PATH użytkownika?',
    agregarTexto:
      'Polecenie wolf zostanie skopiowane do folderu danych WolfCore Dev, folder ten zostanie dodany do zmiennej PATH użytkownika (zapisywana jest kopia oryginalnej zmiennej PATH), a na adresie 127.0.0.1 zostanie uruchomiony lokalny serwer obsługujący wyłącznie wolf przy użyciu klucza zmienianego przy każdym uruchomieniu. Opublikowanie strony w internecie lub zmiana wersji PHP we wszystkich terminalach wymaga dodatkowo potwierdzenia w oknie aplikacji. Opcję tę można usunąć w dowolnym momencie.',
    agregar: 'Dodaj',
    quitarTitulo: 'Usunąć wolf ze zmiennej PATH?',
    quitarTexto:
      'Folder wolf zostanie usunięty ze zmiennej PATH użytkownika, lokalny serwer zostanie zatrzymany, a skopiowane polecenie usunięte. Otwarte terminale pozostają bez zmian.',
    quitar: 'Usuń',
    listoTitulo: 'Polecenie wolf zaktualizowane',
    ayuda: 'Po dodaniu należy otworzyć nowy terminal. Serwer nasłuchuje wyłącznie na 127.0.0.1.',
    aislado: 'W przypadku testowego folderu danych (WOLFCORE_DATOS) zmienna PATH nie jest modyfikowana.',
    errorCargar: (detalle: string) => `Nie udało się odczytać stanu polecenia wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Serwer MCP',
    descripcion:
      'Pozwala Claude Code i innym asystentom zarządzać stronami, usługami i bazami danych z tego komputera. Nasłuchuje wyłącznie na 127.0.0.1 i wymaga tokenu.',
    estado: 'Stan',
    activo: 'Aktywny',
    inactivo: 'Zatrzymany',
    activar: 'Włącz',
    detener: 'Zatrzymaj',
    activado: 'Serwer MCP aktywny',
    detenido: 'Serwer MCP zatrzymany',
    direccion: 'Adres',
    puerto: 'Port',
    puertoAyuda: 'Od 1024 do 65535. Jeśli serwer jest aktywny, zostanie uruchomiony ponownie na nowym porcie.',
    puertoRango: 'Należy podać liczbę z zakresu od 1024 do 65535',
    puertoGuardado: (p: number) => `Serwer MCP będzie używał portu ${p}`,
    copiarConfig: 'Kopiuj konfigurację dla Claude Code',
    copiarConfigAyuda:
      'Kopiuje do schowka konfigurację wraz z tokenem. Należy ją wkleić w Claude Code; token nie jest tutaj wyświetlany.',
    configCopiada: 'Konfiguracja skopiowana do schowka',
    regenerar: 'Wygeneruj nowy token',
    regenerarTitulo: 'Wygenerować nowy token serwera MCP?',
    regenerarTexto:
      'Obecny token natychmiast straci ważność: połączone asystenty będą musiały użyć nowej konfiguracji.',
    regenerado: 'Token został wygenerowany ponownie. Należy ponownie skopiować konfigurację.',
    errorCargar: (detalle: string) => `Nie udało się odczytać stanu serwera MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Asystent prosi o potwierdzenie',
      herramienta: 'Narzędzie',
      pendientes: (actual: number, total: number) => `${actual} z ${total}`,
      aprobar: 'Zatwierdź',
      rechazar: 'Odrzuć',
      aprobada: 'Akcja zatwierdzona',
      rechazada: 'Akcja odrzucona',
      vencida: 'Żądanie nie jest już oczekujące.',
      descartadas: (n: number) =>
        `oraz ${plural(n, 'kolejne, które się nie zmieściło (wygaśnie automatycznie)', 'kolejne, które się nie zmieściły (wygasną automatycznie)', 'kolejnych, które się nie zmieściły (wygasną automatycznie)')}`,
      falloRespuesta: (detalle: string) =>
        `Nie udało się wysłać odpowiedzi; żądanie pozostaje oczekujące. ${detalle}`,
      si: 'Tak',
      no: 'Nie',
      campos: {
        motor: 'Silnik',
        base: 'Baza danych',
        archivo: 'Plik',
        sobrescribir: 'Nadpisz',
        pid: 'PID',
        nombre: 'Proces',
        proyecto: 'Projekt',
        pasos: 'Kroki',
        cantidad: 'Zrzuty',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Narzędzia do codziennej pracy. Działają w trybie offline i bez usług zewnętrznych.',
    buscar: 'Szukaj narzędzia…',
    sinResultados: 'Żadne narzędzie nie pasuje do wyszukiwania.',
    abrir: 'Otwórz',
    procesar: 'Przetwarzanie…',
    copiar: 'Kopiuj',
    copiado: 'Skopiowano do schowka',
    limpiar: 'Wyczyść',
    pendienteApi: 'Oczekujące: rdzeń nie udostępnia jeszcze tej informacji w interfejsie.',
    lista: {
      qr: { nombre: 'Generator QR', descripcion: 'Z tekstu lub linku do tunelu; format PNG.' },
      json: { nombre: 'JSON', descripcion: 'Formatowanie, walidacja i minifikacja, z widokiem drzewa.' },
      regex: {
        nombre: 'Wyrażenia regularne',
        descripcion: 'Tester z dopasowaniami, grupami i dokumentacją podręczną.',
      },
      diff: {
        nombre: 'Porównywanie tekstów',
        descripcion: 'Różnice obok siebie, również dla plików.',
      },
      tiempo: { nombre: 'Czas', descripcion: 'Znacznik czasu ↔ data, ze strefą czasową.' },
      puertos: {
        nombre: 'Porty i procesy',
        descripcion: 'Podgląd nasłuchiwania na portach oraz kończenie procesów.',
      },
      bom: { nombre: 'Czyszczenie BOM UTF-8', descripcion: 'Usuwa znacznik BOM z plików lub folderów.' },
      certificados: {
        nombre: 'Certyfikaty',
        descripcion: 'Wystawianie za pomocą urzędu CA WolfCore Dev dla dowolnej nazwy.',
      },
      cripto: {
        nombre: 'Kryptografia',
        descripcion: 'Skróty (hash), base64, URL, UUID, hasła i JWT.',
      },
      markdown: { nombre: 'Podgląd Markdown', descripcion: 'Wpisanie treści i podgląd wyniku.' },
      entorno: { nombre: 'Środowisko systemowe', descripcion: 'PATH, wersje i zmienne.' },
      buscar: {
        nombre: 'Szukaj',
        descripcion: 'Tekst w nazwach i zawartości projektu, folderu lub pliku.',
      },
      infoArchivo: {
        nombre: 'Informacje o pliku',
        descripcion: 'Rozmiar, typ i skróty (hash) pliku.',
      },
      websocket: { nombre: 'Klient WebSocket', descripcion: 'Łączenie, wysyłanie i podgląd wiadomości.' },
      contrasenas: {
        nombre: 'Hasła',
        descripcion: 'Ocena siły hasła oraz sprawdzanie słabych kont w bazach danych.',
      },
      qrWifi: {
        nombre: 'QR Wi-Fi',
        descripcion: 'Kod QR umożliwiający połączenie z siecią.',
      },
      imagenes: {
        nombre: 'Obrazy',
        descripcion: 'Konwersja do ICO lub PNG oraz kompresja JPEG lub WebP.',
      },
      comprimir: {
        nombre: 'ZIP i PDF',
        descripcion: 'Kompresja plików i folderów do ZIP oraz optymalizacja PDF.',
      },
      conversor: {
        nombre: 'Konwerter dokumentów',
        descripcion: 'Konwersja Word, Excel, PDF, CSV i Markdown lokalnie na tym komputerze.',
      },
    },
    errores: {
      jsonVacio: 'Proszę wpisać lub wkleić kod JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `Nieprawidłowy JSON: proszę sprawdzić wiersz ${linea}, kolumnę ${columna}.`,
      banderas: 'Nieprawidłowe flagi: można użyć wyłącznie d, g, i, m, s, u, v lub y, bez powtórzeń.',
      regex: (detalle: string) => `Nieprawidłowe wyrażenie (${detalle}).`,
      trabajador: 'Nie udało się wykonać operacji w tle.',
      diffLento: 'Teksty zbyt mocno się różnią, aby porównać je w wyznaczonym czasie.',
      base64: 'Nieprawidłowy ciąg Base64.',
      utf8: 'Zdekodowana zawartość nie jest tekstem UTF-8.',
      url: 'Nieprawidłowa sekwencja URL.',
      coste: (max: number) => `Koszt bcrypt musi wynosić od 4 do ${max}.`,
      jwtPartes: 'Token JWT musi składać się z trzech części oddzielonych kropką.',
      jwtCabecera: 'Nie udało się odczytać nagłówka JWT.',
      jwtCarga: 'Nie udało się odczytać ładunku JWT.',
      longitud: 'Długość musi wynosić od 4 do 256.',
      sinConjuntos: 'Proszę wybrać co najmniej jeden typ znaków.',
      sinDominios: 'Proszę wpisać co najmniej jedną nazwę lub adres IP.',
      muchosDominios: (max: number) => `Maksymalnie ${max} nazw na certyfikat.`,
    },
    qr: {
      texto: 'Tekst lub URL',
      textoAyuda: 'Kod QR jest generowany lokalnie na tym komputerze; nic nie trafia do sieci.',
      tunel: 'Link tunelu projektu',
      sinTuneles: 'Brak aktywnych tuneli',
      descargar: 'Pobierz PNG',
      vacio: 'Proszę wpisać treść, aby wygenerować kod.',
      largo: 'Tekst jest zbyt długi dla kodu QR.',
      descargado: 'Rozpoczęto pobieranie.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formatuj',
      minificar: 'Minifikuj',
      validar: 'Sprawdź',
      valido: 'Poprawny JSON.',
      resultado: 'Wynik',
      arbol: 'Drzewo',
      mas: (n: number) => `… jeszcze ${n}`,
    },
    regex: {
      patron: 'Wzorzec',
      banderas: 'Flagi',
      texto: 'Tekst testowy',
      coincidencias: (n: number, truncado: boolean) =>
        `${plural(n, 'dopasowanie', 'dopasowania', 'dopasowań')}${truncado ? ' (wyświetlono pierwsze)' : ''}`,
      sinCoincidencias: 'Brak dopasowań.',
      tiempo: 'Wyrażenie wykonywało się zbyt długo i zostało zatrzymane (możliwe katastrofalne nawroty).',
      grupo: (n: number) => `Grupa ${n}`,
      referencia: 'Skrócona ściągawka',
      tabla: [
        ['.', 'Dowolny znak (poza znakiem nowej linii bez flagi s)'],
        ['\\d \\w \\s', 'Cyfra, litera/cyfra/_ oraz spacja'],
        ['\\D \\W \\S', 'Przeciwieństwo powyższych'],
        ['[abc] [^abc]', 'Jeden znak z listy / żaden z listy'],
        ['^ $', 'Początek i koniec (linii z flagą m)'],
        ['\\b', 'Granica słowa'],
        ['* + ?', 'Zero lub więcej, jeden lub więcej, opcjonalnie'],
        ['{n,m}', 'Od n do m powtórzeń'],
        ['*? +?', 'Wersja leniwa'],
        ['(…) (?<nombre>…)', 'Grupa przechwytująca i nazwana'],
        ['(?:…)', 'Grupa nieprzechwytująca'],
        ['(?=…) (?!…)', 'Poprzedzające / niepoprzedzające'],
        ['a|b', 'Alternatywa'],
        ['g i m s u y', 'Globalnie, bez wielkości liter, wieloliniowo, pełna kropka, Unicode, przyklejone'],
      ] as [string, string][],
    },
    diff: {
      original: 'Oryginał',
      modificado: 'Zmodyfikowany',
      cargarArchivo: 'Wczytaj plik',
      comparar: 'Porównaj',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} linii`,
      iguales: 'Teksty są identyczne.',
      archivoGrande: 'Plik przekracza 5 MB; proszę wybrać mniejszy.',
      textoGrande: 'Każdy tekst może mieć maksymalnie 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `Wyświetlono pierwsze ${mostradas} z ${total} wierszy.`,
    },
    tiempo: {
      timestamp: 'Timestamp (sekundy lub milisekundy)',
      fecha: 'Data (RRRR-MM-DD HH:mm:ss)',
      zona: 'Strefa czasowa',
      ahora: 'Teraz',
      segundos: 'Sekundy',
      milisegundos: 'Milisekundy',
      iso: 'ISO 8601 (UTC)',
      enZona: 'W wybranej strefie',
      desplazamiento: 'Przesunięcie',
      relativo: 'Względnie',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Odczytano w sekundach' : 'Odczytano w milisekundach',
      timestampInvalido: 'Proszę wpisać same cyfry (może mieć znak minus).',
      fechaInvalida: 'Proszę użyć formatu RRRR-MM-DD HH:mm[:ss] z prawdziwą datą.',
      zonaInvalida: 'Nieznana strefa czasowa.',
    },
    puertos: {
      filtro: 'Filtruj po porcie, PID lub nazwie',
      actualizar: 'Odśwież',
      columnas: {
        puerto: 'Port',
        protocolo: 'Protokół',
        proceso: 'Proces',
        pid: 'PID',
        direcciones: 'Adresy',
        acciones: 'Akcje',
      },
      propio: 'WolfCore Dev',
      sistema: 'System',
      finalizar: 'Zakończ',
      noFinalizable: 'Procesów systemowych oraz procesów WolfCore Dev nie można kończyć z tego miejsca.',
      confirmarTitulo: 'Zakończ proces',
      confirmarTexto: (nombre: string, pid: number) =>
        `Proces „${nombre}” (PID ${pid}) zostanie zamknięty bez zapisywania. Aby potwierdzić, proszę wpisać nazwę procesu:`,
      finalizado: (nombre: string) => `Zakończono ${nombre}.`,
      vacio: 'Brak używanych portów lub nie udało się ich odczytać.',
    },
    bom: {
      explicacion:
        'Najpierw wyświetlane są pliki zawierające BOM; podczas czyszczenia tworzona jest kopia .bak-bom każdego z nich. Pomijane są node_modules, vendor, .git i pliki binarne.',
      elegirArchivos: 'Wybierz pliki',
      elegirCarpeta: 'Wybierz folder',
      seleccion: (n: number) => plural(n, 'wybrana ścieżka', 'wybrane ścieżki', 'wybranych ścieżek'),
      analizar: 'Analizuj',
      limpiar: 'Usuń BOM',
      confirmar: (n: number) =>
        `BOM zostanie usunięty z ${plural(n, 'pliku', 'plików', 'plików')} (z kopią). Kontynuować?`,
      conBom: (n: number) => plural(n, 'plik z BOM', 'pliki z BOM', 'plików z BOM'),
      sinBom: 'Żaden plik nie zawiera BOM.',
      limpiados: (n: number) => `Wyczyszczono ${plural(n, 'plik', 'pliki', 'plików')}.`,
      copia: 'Kopia',
    },
    certificados: {
      explicacion:
        'Podpisuje certyfikat lokalnym urzędem CA WolfCore Dev. Plik .crt jest zapisywany w wybranym miejscu, a klucz (.key) obok niego; klucz nigdy nie przechodzi przez interfejs.',
      dominios: 'Nazwy lub adresy IP (rozdzielone spacją, przecinkiem lub nową linią)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Wystaw i zapisz',
      guardado: 'Zapisano certyfikat',
      certificado: 'Certyfikat',
      clave: 'Klucz',
    },
    cripto: {
      texto: 'Tekst',
      hash: 'Hash',
      calcular: 'Oblicz',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Koszt bcrypt',
      bcryptTrunca: 'bcrypt używa wyłącznie pierwszych 72 bajtów tekstu.',
      bcryptVerificar: 'Hash bcrypt do sprawdzenia',
      verificar: 'Sprawdź',
      coincide: 'Tekst zgadza się z hashem.',
      noCoincide: 'Tekst nie zgadza się z hashem.',
      base64: 'Base64',
      base64Url: 'Wariant URL',
      codificar: 'Koduj',
      decodificar: 'Dekoduj',
      url: 'Koduj URL',
      decodificarUrl: 'Dekoduj URL',
      codificarBase64: 'Koduj base64',
      decodificarBase64: 'Dekoduj base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID i hasła',
      uuid: 'UUID v4',
      generar: 'Generuj',
      generarDiez: 'Generuj 10',
      contrasena: 'Losowe hasło',
      longitud: 'Długość',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Symbole',
      jwt: 'Dekoduj JWT',
      jwtToken: 'Token',
      cabecera: 'Nagłówek',
      carga: 'Ładunek',
      firmaNoVerificada:
        'Podpis niezweryfikowany: zawartość jest wyświetlana w oryginalnej postaci i mogła zostać zmodyfikowana.',
      vencido: 'Token wygasł (exp).',
      vigente: 'Token nie wygasł (exp).',
      salida: 'Wynik',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Podgląd',
      ejemplo:
        '# Tytuł\n\nTekst z **pogrubieniem**, _kursywą_ i [linkiem](https://example.com).\n\n- Jeden\n- Dwa\n\n```\nkod\n```\n',
      seguro:
        'Surowy HTML jest wyświetlany jako tekst, niebezpieczne linki są odrzucane, a obrazy nie są ładowane.',
      imagenOmitida: (alt: string) => `[obraz${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Wersja WolfCore Dev',
      navegador: 'Silnik interfejsu',
      plataforma: 'Platforma',
      idioma: 'Język',
      zona: 'Strefa czasowa',
      nucleos: 'Rdzenie logiczne',
      actualizar: 'Odśwież',
      path: 'PATH',
      pathVacio: 'Zmienna PATH jest pusta.',
      herramientas: 'Narzędzia WolfCore Dev',
      noInstalada: 'Nie zainstalowano',
      sinRespuesta: 'Brak odpowiedzi w wyznaczonym czasie',
      variables: 'Zmienne środowiskowe',
      filtro: 'Filtruj zmienne',
      enmascarada: 'Wartość ukryta: nazwa wskazuje na tajny klucz.',
    },
    busqueda: {
      explicacion:
        'Wyszukuje w nazwach i zawartości, bez podążania za dowiązaniami i bez czytania plików binarnych. Domyślnie pomija node_modules, vendor i .git.',
      origen: 'Gdzie szukać',
      proyecto: 'Projekt',
      elegirCarpeta: 'Wybierz folder',
      elegirArchivo: 'Wybierz plik',
      sinOrigen: 'Proszę wybrać projekt, folder lub plik.',
      consulta: 'Szukany tekst',
      modoNombre: 'Nazwy',
      modoContenido: 'Zawartość',
      modoAmbos: 'Oba',
      regex: 'Wyrażenie regularne',
      mayusculas: 'Rozróżniaj wielkość liter',
      incluir: 'Tylko pliki (rozdziel przecinkami, np. *.php)',
      excluir: 'Pomiń (rozdziel przecinkami)',
      buscar: 'Szukaj',
      cancelar: 'Anuluj',
      buscando: 'Wyszukiwanie…',
      sinResultados: 'Brak dopasowań.',
      truncado: 'Istnieje więcej wyników niż wyświetlono: proszę zawęzić wyszukiwanie.',
      cancelada: 'Wyszukiwanie anulowane.',
      abrir: 'Otwórz w edytorze',
      coincidencias: (n: number) => plural(n, 'dopasowanie', 'dopasowania', 'dopasowań'),
      resumen: (archivos: number, examinados: number) =>
        `w ${plural(archivos, 'pliku', 'plikach', 'plikach')} (sprawdzono ${examinados})`,
    },
    infoArchivo: {
      elegir: 'Wybierz plik',
      ayuda: 'Plik jest odczytywany lokalnie w celu obliczenia skrótów (maksymalnie 200 MB).',
      nombre: 'Nazwa',
      tamano: 'Rozmiar',
      tipo: 'Typ',
      modificado: 'Zmodyfikowano',
      sinTipo: 'Nieznany',
      grande: 'Plik przekracza 200 MB: wyświetlane są dane bez skrótów.',
      calculando: 'Obliczanie skrótów…',
    },
    websocket: {
      url: 'URL (ws:// lub wss://)',
      conectar: 'Połącz',
      desconectar: 'Rozłącz',
      mensaje: 'Wiadomość',
      enviar: 'Wyślij',
      urlInvalida: 'Proszę wpisać adres URL zaczynający się od ws:// lub wss://.',
      conectando: 'Łączenie…',
      conectado: 'Połączono',
      desconectado: 'Rozłączono',
      error: 'Błąd połączenia',
      cerrado: (codigo: number, motivo: string) =>
        `Zamknięto (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Wysłano',
      recibido: 'Odebrano',
      binario: (n: number) => `[binarne, ${n} B]`,
      vacio: 'Brak wiadomości.',
      tope: 'Zapisywanych jest ostatnich 500 wiadomości; każda wyświetlana do 10 KB.',
    },
    qrWifi: {
      ssid: 'Nazwa sieci (SSID)',
      clave: 'Hasło',
      seguridad: 'Zabezpieczenia',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Bez hasła',
      oculta: 'Sieć ukryta',
      mostrar: 'Pokaż',
      ocultar: 'Ukryj',
      aviso:
        'Kod QR zawiera hasło w postaci jawnej: każdy, kto go zobaczy lub sfotografuje, może połączyć się z siecią. Jest generowany lokalnie, nie jest zapisywany i znika po zamknięciu tego panelu.',
      avisoPng:
        'Pobierany plik PNG również zawiera hasło w kodzie: proszę zapisać go w miejscu dostępnym tylko dla Państwa.',
      escribala:
        'Hasło wpisują Państwo samodzielnie: WolfCore Dev nigdy nie odczytuje haseł Wi-Fi zapisanych w systemie.',
      errorSsid: 'Proszę wpisać nazwę sieci (do 32 znaków).',
      errorClave: 'Proszę wpisać hasło.',
      errorClaveWpa: 'Hasło WPA musi mieć od 8 do 63 znaków.',
      vacio: 'Proszę uzupełnić dane, aby zobaczyć kod.',
      alt: 'Kod QR do połączenia z siecią Wi-Fi',
      descargar: 'Pobierz PNG',
      descargado: 'Zapisano QR',
      largo: 'Dane są zbyt długie dla kodu QR.',
    },
    imagenes: {
      elegir: 'Wybierz obraz',
      ayuda:
        'Przetwarzanie odbywa się lokalnie na tym komputerze (do 30 MB i 12000 px na bok). Oryginał nie jest modyfikowany: wynikiem jest nowy plik.',
      original: 'Oryginał',
      accion: 'Co zrobić',
      aIco: 'Konwertuj na ICO',
      aPng: 'Konwertuj na PNG',
      comprimir: 'Kompresuj',
      tamanos: 'Rozmiary ICO',
      formato: 'Format',
      calidad: 'Jakość',
      ladoMax: 'Maksymalny bok w px (puste = oryginał)',
      procesar: 'Przetwórz',
      procesando: 'Przetwarzanie…',
      guardar: 'Zapisz jako…',
      antes: 'Przed',
      despues: 'Po',
      sinMejora: 'Wynik nie jest mniejszy od oryginału: proszę spróbować innej jakości lub formatu.',
      errorAbrir: 'Nie udało się otworzyć obrazu na tym komputerze.',
      errorProcesar: 'Nie udało się przetworzyć obrazu.',
      sufijoConvertida: '-konwertowany',
      sufijoComprimida: '-skompresowany',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % mniej`
          : porcentaje < 0
            ? `${-porcentaje} % więcej`
            : 'bez zmian',
      guardado: (archivo: string) => `Zapisano w ${archivo}`,
    },
    comprimir: {
      zip: 'Kompresuj do ZIP',
      zipAyuda:
        'Proszę wybrać pliki lub foldery. Dowiązania nie są śledzone, a ZIP jest nowym plikiem: nigdy nie nadpisuje istniejącego.',
      agregarArchivos: 'Dodaj pliki',
      agregarCarpeta: 'Dodaj folder',
      quitar: 'Usuń',
      vacio: 'Nic jeszcze nie wybrano.',
      crearZip: 'Utwórz ZIP…',
      creando: 'Tworzenie…',
      pdf: 'Optymalizuj PDF',
      pdfAyuda:
        'Plik jest ponownie zapisywany ze strumieniami obiektów w osobnym wątku. Nowy plik powstaje tylko wtedy, gdy jest mniejszy; pliki PDF chronione hasłem nie są otwierane. Oryginał pozostaje nietknięty. Uwaga: ponowne zapisanie usuwa podpisy cyfrowe i zgodność z PDF/A.',
      elegirPdf: 'Wybierz PDF',
      optimizar: 'Optymalizuj…',
      optimizando: 'Optymalizacja…',
      antes: 'Przed',
      despues: 'Po',
      sinMejora: 'Optymalizacja nie zmniejszyłaby rozmiaru PDF: nie utworzono nowego pliku.',
      sufijoOptimizado: '-zoptymalizowany',
      omitidos: (n: number) =>
        `Pominięto ${plural(n, 'dowiązanie, nieczytelny katalog lub plik specjalny', 'dowiązania, nieczytelne katalogi lub pliki specjalne', 'dowiązań, nieczytelnych katalogów lub plików specjalnych')}.`,
      archivos: (n: number) => plural(n, 'plik', 'pliki', 'plików'),
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % mniej`
          : porcentaje < 0
            ? `${-porcentaje} % więcej`
            : 'bez zmian',
      guardado: (archivo: string) => `Zapisano w ${archivo}`,
    },
    conversor: {
      ayuda:
        'Konwersja odbywa się lokalnie na tym komputerze: dokument nie jest nigdzie wysyłany. Oryginał pozostaje nietknięty; wynikiem jest nowy plik i nigdy nie nadpisuje istniejącego.',
      elegir: 'Wybierz dokument',
      tipoNoSoportado:
        'Brak konwersji dla tego typu pliku. Obsługiwane są docx, xlsx, csv, md, html i pdf (oraz odt, pptx i doc przy użyciu LibreOffice).',
      convertirA: 'Konwertuj na',
      convertir: 'Konwertuj…',
      convirtiendo: 'Konwertowanie…',
      avisoLibreOffice:
        'Ta konwersja korzysta z LibreOffice zainstalowanego już na tym komputerze. WolfCore Dev nie instaluje go ani nie pobiera: uruchamia go bez okna i z tymczasowym profilem.',
      sinLibreOffice:
        'Po zainstalowaniu LibreOffice można również konwertować pliki odt, pptx i doc (WolfCore Dev go nie instaluje).',
      limites:
        'Ze względów bezpieczeństwa obowiązują limity: do 50 MB (10 MB dla md i html), 120 s, 200 000 wierszy, 1000 kolumn i 5 milionów komórek; pliki przypominające bombę ZIP lub zawierające encje XML są odrzucane.',
      guardado: (archivo: string) => `Zapisano w ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Siła hasła',
      pestanaAuditar: 'Audyt bazy danych',
      fortaleza: {
        etiqueta: 'Hasło do sprawdzenia',
        marcador: 'Proszę wpisać hasło',
        privacidad: 'Sprawdzanie odbywa się lokalnie: nic nie opuszcza komputera ani nie jest zapisywane.',
        mostrar: 'Pokaż',
        ocultar: 'Ukryj',
        niveles: ['Bardzo słabe', 'Słabe', 'Średnie', 'Silne', 'Bardzo silne'],
        sinAvisos: 'Brak uwag.',
        estimacion: 'To jest szacunek, a nie gwarancja.',
        avisos: {
          straightRow: 'Rząd kolejnych klawiszy jest łatwy do odgadnięcia.',
          keyPattern: 'Krótkie wzorce na klawiaturze są łatwe do odgadnięcia.',
          simpleRepeat: 'Powtarzanie znaku lub grupy znaków prawie nie wzmacnia hasła.',
          extendedRepeat: 'Powtarzane grupy znaków są łatwe do odgadnięcia.',
          sequences: 'Sekwencje takie jak abc lub 6543 są łatwe do odgadnięcia.',
          recentYears: 'Proszę unikać niedawnych lat i dat powiązanych z Państwem.',
          dates: 'Proszę unikać dat: są łatwe do odgadnięcia.',
          topTen: 'To jedno z dziesięciu najczęściej używanych haseł.',
          topHundred: 'To jedno ze stu najczęściej używanych haseł.',
          common: 'To bardzo popularne hasło.',
          similarToCommon: 'Przypomina bardzo popularne hasło.',
          wordByItself: 'Pojedyncze słowo jest łatwe do odgadnięcia.',
          namesByThemselves: 'Pojedyncze imię lub nazwisko jest łatwe do odgadnięcia.',
          commonNames: 'Popularne imiona i nazwiska są łatwe do odgadnięcia.',
          userInputs: 'Proszę nie używać danych, które inne osoby mogą o Państwu znać.',
          l33t: 'Zamiana liter na przewidywalne symbole (@ zamiast a) niewiele pomaga.',
          reverseWords: 'Pisanie słów od tyłu niewiele pomaga.',
          allUppercase: 'Zapisanie wszystkiego wielkimi literami niewiele pomaga.',
          capitalization: 'Wielka pierwsza litera niewiele pomaga.',
          associatedYears: 'Proszę unikać lat powiązanych z Państwem.',
          repeated: 'Proszę unikać powtarzanych słów i znaków.',
          longerKeyboardPattern: 'Proszę użyć dłuższego wzorca na klawiaturze i zmieniać kierunek.',
          anotherWord: 'Proszę dodać jeszcze jedno lub dwa słowa; mniej popularne pomagają.',
          useWords: 'Kilka losowych słów tworzy dobre hasło.',
          noNeed: 'Hasło może być bezpieczne bez symboli i cyfr: najważniejsza jest długość.',
        },
      },
      auditar: {
        limite:
          'To narzędzie wykrywa wyłącznie bardzo popularne hasła: porównuje każdy hash z krótką listą około 200 haseł. To nie jest atak ani test brute-force. Brak oznaczenia konta nie oznacza, że jego hasło jest silne.',
        privacidad:
          'Nigdy nie jest wyświetlane, które hasło pasowało, a odczyt odbywa się przez tymczasowego użytkownika tylko do odczytu (w PostgreSQL w sesji tylko do odczytu). Proszę używać wyłącznie na własnych bazach.',
        motor: 'Silnik',
        base: 'Baza danych',
        tabla: 'Tabela',
        columnaUsuario: 'Kolumna użytkownika',
        columnaHash: 'Kolumna hasha',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Proszę uruchomić serwer w sekcji Bazy danych, aby sprawdzić bazy.',
        sinBases: 'Brak baz danych na tym serwerze.',
        sinMotores: 'Brak własnego serwera MySQL, MariaDB lub PostgreSQL.',
        revisar: 'Sprawdź',
        revisando: 'Sprawdzanie…',
        resumen: (r: number, d: number) =>
          `${plural(r, 'sprawdzone konto', 'sprawdzone konta', 'sprawdzonych kont')} · ${plural(d, 'słabe', 'słabe', 'słabych')}`,
        sinDebiles: 'Żadne sprawdzone konto nie pasuje do bardzo popularnego hasła.',
        noRevisables: (n: number) =>
          `Nie udało się sprawdzić ${plural(n, 'konta', 'kont', 'kont')}:`,
        truncado:
          'Sprawdzanie zostało przerwane po osiągnięciu limitu 10 000 wierszy lub 60 sekund: część kont pozostała niesprawdzona.',
        usuario: 'Użytkownik',
        motivo: 'Powód',
        accion: 'Akcja',
        motivos: {
          comun: 'Bardzo popularne hasło',
          formato_debil: 'Słaby format (md5 lub sha1 bez soli)',
        },
        restablecer: 'Resetuj',
        mas: (n: number) => `i jeszcze ${n} (wyświetlono pierwsze 200)`,
        esquema: 'Schemat (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Anuluj',
        cancelando: 'Anulowanie…',
        cancelada: 'Audyt anulowany.',
        progreso: (a: number, b: number) => `Sprawdzono ${a} z ${b}`,
        tiposNoRevisables: {
          vacio: 'pusty hash',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (niedostępny na tym komputerze lub parametry poza limitem)',
          bcrypt_otro: 'bcrypt z kosztem poza zakresem lub wariant $2x$',
          pbkdf2_otro: 'PBKDF2 z parametrami poza limitem',
          ldap: 'format LDAP ({SHA}…)',
          otro: 'nieznany format',
        },
        rlsActiva:
          'Tabela ma włączone zabezpieczenia na poziomie wiersza (RLS): audyt widzi wyłącznie wiersze dozwolone przez politykę dla ograniczonej roli, więc część kont może zostać pominięta.',
        falsoPositivo:
          'Wartość 32 lub 40 znaków szesnastkowych jest traktowana jako md5 lub sha1, ale może być czymś innym (np. tokenem). Jeśli kolumna nie przechowuje haseł, wynik nie jest miarodajny.',
      },
      restablecer: {
        titulo: (u: string) => `Resetowanie hasła użytkownika ${u}`,
        ayuda:
          'Hasła nie można odzyskać: ustawiane jest nowe. Wcześniej tworzona jest migawka bazy oraz zapisywana kopia wiersza.',
        cargando: 'Przygotowywanie podglądu…',
        sentencia: 'Zostanie wykonane (wartości są przekazywane osobno i nie są wyświetlane)',
        formatoActual: (f: string) => `Bieżący format: ${f}`,
        cambiaFormato:
          'Konto zostanie przełączone na bcrypt: aplikacja musi umieć go weryfikować (np. przez password_verify); w przeciwnym razie nikt nie zaloguje się na to konto.',
        nueva: 'Nowe hasło',
        generar: 'Wygeneruj',
        mostrar: 'Pokaż',
        ocultar: 'Ukryj',
        anotar: 'Proszę zapisać je teraz: nie zostanie ponownie pokazane ani zapisane.',
        escribaUsuario: (u: string) => `Aby potwierdzić, proszę wpisać użytkownika: ${u}`,
        confirmar: 'Resetuj hasło',
        cancelar: 'Anuluj',
        cerrar: 'Zamknij',
        hecho: 'Hasło zostało zresetowane.',
        copiaFila: 'Kopia wiersza (identyfikator i poprzedni hash, przechowywana przez 30 dni):',
        instantanea: 'Poprzednia migawka bazy:',
        instantaneaAyuda: 'Można do niej wrócić w sekcji Bazy danych › Migawki.',
        aBcrypt: 'Przełącz na bcrypt: tylko jeśli aplikacja używa password_verify lub odpowiednika',
        avisoLegado:
          'Ten hash to md5 lub sha1 bez soli i zostaje zachowany w tym formacie. Jeśli aplikacja przechowuje sól osobno (w innej kolumnie lub stałej), hasha nie można odtworzyć i nowe hasło nie pozwoli na logowanie.',
        datosReales: {
          titulo: 'Baza z prawdziwymi danymi',
          texto:
            'Ta baza należy do strony oznaczonej jako zawierająca prawdziwe dane klientów: zresetowanie hasła zmienia prawdziwe konto.',
          casilla: 'Rozumiem, że to prawdziwe dane i chcę zresetować to hasło',
        },
        rlsActiva:
          'Tabela ma włączone zabezpieczenia na poziomie wiersza (RLS): jeśli polityka ukrywa to konto przed ograniczoną rolą, reset nie będzie możliwy.',
        copiaSinRestringir:
          'Nie udało się ograniczyć dostępu do tej kopii wyłącznie do użytkownika tego komputera: proszę sprawdzić uprawnienia folderu.',
      },
    },
  },
  doctor: {
    descripcion:
      'Sprawdza porty, certyfikaty, plik hosts, PATH, Visual C++, program antywirusowy oraz usługi i proponuje sposób naprawy.',
    revisarAhora: 'Sprawdź teraz',
    revisando: 'Sprawdzanie…',
    sinRevision: 'Nie przeprowadzono jeszcze sprawdzenia. Proszę kliknąć „Sprawdź teraz”.',
    sinHallazgos: 'Wszystko w porządku: nie znaleziono problemów.',
    gravedades: { error: 'Błędy', aviso: 'Powiadomienia', info: 'Informacje' },
    evidencia: 'Co wykryto',
    requiereAdmin: 'Wymaga uprawnień administratora',
    comandoManual: 'Polecenie do konsoli administratora (nie uruchamia się automatycznie):',
    copiar: 'Kopiuj polecenie',
    copiado: 'Skopiowano polecenie.',
    reparar: 'Napraw',
    alternativa: 'Przenieś port WolfCore Dev',
    soloInforma: 'WolfCore Dev nie zmienia tego automatycznie: proszę postępować zgodnie ze wskazówkami.',
    dialogo: {
      titulo: 'Potwierdź naprawę',
      queHara: 'Zostaną wykonane następujące czynności:',
      admin: 'Windows poprosi o uprawnienia administratora.',
      puerto: (p: string | number) => `Nowy port to ${p}.`,
      aplicar: 'Zastosuj',
      cancelar: 'Anuluj',
    },
    estados: {
      aplicando: 'Stosowanie…',
      hecha: 'Naprawa została zastosowana.',
      fallida: 'Nie udało się naprawić.',
    },
    revisiones: {
      puertos: 'Porty',
      'rangos-reservados': 'Zarezerwowane zakresy',
      ca: 'Urząd certyfikacji',
      certificados: 'Certyfikaty',
      confianza: 'Zaufanie do CA',
      hosts: 'Plik hosts',
      path: 'PATH użytkownika',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Linker C++',
      antivirus: 'Antywirus',
      firewall: 'Zapora sieciowa',
      servicios: 'Usługi',
    },
    reparaciones: {
      cambiar_puerto: 'Zmień port WolfCore Dev na wolny. Drugi program pozostaje nietknięty.',
      puerto_manual:
        'Przenieś port WolfCore Dev poza zarezerwowany zakres. O zwolnieniu zakresu decydują Państwo za pomocą pokazanego polecenia.',
      detener_iis:
        'Zatrzymaj usługę IIS (W3SVC), aby zwolnić port. Nie jest wyłączana: uruchomi się ponownie po restarcie Windows.',
      regenerar_ca:
        'Utwórz nowy urząd certyfikacji, dodaj go do zaufanych w Windows (pojawi się prośba o potwierdzenie), wystaw ponownie certyfikaty i usuń poprzedni. Wcześniej zapisywana jest kopia zapasowa.',
      regenerar_certificados: 'Wystaw ponownie certyfikaty stron i przeładuj Nginx.',
      hosts_reescribir:
        'Zapisz ponownie blok WolfCore Dev w pliku hosts w UTF-8, z wcześniejszą kopią zapasową. Obce linie pozostają nietknięte.',
      hosts_solo_lectura: 'Usuń atrybut tylko do odczytu z pliku hosts.',
      path_duplicados:
        'Usuń powtarzające się wpisy WolfCore Dev z PATH użytkownika, z kopią zapasową poprzedniej wartości. Obce wpisy pozostają nietknięte.',
      path_ajeno:
        'Inne narzędzie znajduje się wcześniej w PATH. WolfCore Dev go nie usuwa: proszę zmienić kolejność w razie potrzeby.',
      instalar_vcredist:
        'Zainstaluj Visual C++ 2015+ x64 przez winget. Instalator Microsoft poprosi o własne potwierdzenie.',
      instalar_build_tools:
        'Proszę zainstalować Build Tools dla Visual Studio (z narzędziami C++) za pomocą pokazanego polecenia: zajmują kilka GB i wymagają uprawnień administratora, więc decyzja należy do Państwa.',
      antivirus:
        'O dodaniu folderu danych do wyjątków antywirusa decydują Państwo za pomocą pokazanego polecenia.',
      firewall:
        'O usunięciu tych reguł decydują Państwo za pomocą pokazanego polecenia w konsoli administratora. WolfCore Dev nigdy nie zmienia zapory sieciowej.',
      reintentar_servicio: 'Uruchom ponownie usługę.',
      firefox_confianza:
        'Dodanie do pliku user.js każdego profilu Firefox preferencji ufającej urzędowi certyfikacji systemu Windows, z wcześniejszą kopią zapasową. Plik prefs.js nie jest modyfikowany, a otwarte profile są pomijane.',
    },
    confianza: {
      titulo: 'Zaufanie urzędu CA',
      texto:
        'System Windows już ufa urzędowi certyfikacji WolfCore Dev; Node, Python i Firefox korzystają z własnego magazynu certyfikatów.',
      sinCa: 'Nie ma jeszcze urzędu certyfikacji. Należy utworzyć go w sekcji HTTPS, aby korzystać z tej części.',
      node: {
        titulo: 'Node',
        proyectos:
          'Procesy projektów oraz Terminal otrzymują zmienną NODE_EXTRA_CA_CERTS z urzędem certyfikacji.',
        ajena: 'Zmienna NODE_EXTRA_CA_CERTS jest już ustawiona: WolfCore Dev jej nie nadpisuje.',
        global: 'Również jako zmienna użytkownika (dla innych terminali i programów)',
        confirmarActivar:
          'Zmienna NODE_EXTRA_CA_CERTS zostanie ustawiona jako zmienna użytkownika. Dotyczy to programów otwieranych później; zostanie usunięta po wyłączeniu tej opcji.',
        confirmarDesactivar: 'Zmienna NODE_EXTRA_CA_CERTS ustawiona przez WolfCore Dev zostanie usunięta.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Projekty z .venv otrzymują zmienne REQUESTS_CA_BUNDLE i SSL_CERT_FILE z certyfikatami głównymi certifi (lub systemu Windows) oraz urzędem certyfikacji. Nigdy samego urzędu certyfikacji.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Nie znaleziono profili Firefox.',
        activo: 'Ufa',
        inactivo: 'Nie ufa',
        abierto: 'Otwarty',
        fuera: 'Poza folderem Firefox',
        avisoFuera: (lista: string) =>
          `Te profile znajdują się poza folderem Firefox i nie zostaną zmodyfikowane, chyba że zostanie to zaznaczone: ${lista}.`,
        incluirFuera: 'Zmodyfikuj także profile poza folderem Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'profil spoza folderu Firefox pozostał bez zmian', 'profile spoza folderu Firefox pozostały bez zmian', 'profili spoza folderu Firefox pozostało bez zmian')}.`,
        activar: 'Włącz w Firefox',
        quitar: 'Usuń z Firefox',
        confirmarActivar:
          'Do pliku user.js każdego profilu zostanie dodana opcja security.enterprise_roots.enabled między znacznikami WolfCore Dev, z wcześniejszą kopią zapasową w etc/respaldos. Plik prefs.js nie jest modyfikowany. Profile z otwartym programem Firefox są pomijane: należy go wcześniej zamknąć.',
        confirmarQuitar:
          'Blok WolfCore Dev zostanie usunięty z pliku user.js każdego profilu (z wcześniejszą kopią zapasową). Pozostałe preferencje pozostają bez zmian.',
        resultadoOk: (n: number) => `Gotowe w ${plural(n, 'profilu', 'profilach', 'profilach')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'profil został pominięty', 'profile zostały pominięte', 'profili zostało pominiętych')}, ponieważ Firefox jest otwarty. Należy go zamknąć i spróbować ponownie.`,
        resultadoError: (n: number) =>
          `Nie udało się zmienić ${plural(n, 'profilu', 'profili', 'profili')}.`,
      },
      confirmar: 'Potwierdź',
      cancelar: 'Anuluj',
    },
  },
  php: {
    descripcion:
      'Plik php.ini i rozszerzenia dla każdej zainstalowanej wersji PHP. Przed zapisaniem wyświetlany jest diff, wykonywany jest test php -v i zapisywana jest kopia zapasowa z datą; jeśli PHP nie uruchomi się ponownie, przywracana jest poprzednia wersja.',
    rama: 'Wersja PHP',
    sinPhp: 'PHP nie jest zainstalowane. Należy zainstalować je w sekcji Usługi.',
    irServicios: 'Przejdź do Usług',
    pestanas: { ini: 'php.ini', extensiones: 'Rozszerzenia' },
    rapidosTitulo: 'Szybkie ustawienia',
    rapidosAyuda: 'Zostają zastosowane w tekście poniżej; nic nie jest zapisywane do momentu potwierdzenia diffu.',
    aplicarRapidos: 'Zastosuj do tekstu',
    sinValor: 'nie zdefiniowano',
    rapidos: {
      memory_limit: 'Pamięć na skrypt (memory_limit)',
      upload_max_filesize: 'Maksymalny rozmiar wysyłanego pliku (upload_max_filesize)',
      post_max_size: 'Maksymalny rozmiar POST (post_max_size)',
      max_execution_time: 'Maksymalny czas w sekundach (max_execution_time)',
      display_errors: 'Wyświetlanie błędów (display_errors)',
      error_reporting: 'Poziom raportowania błędów (error_reporting)',
      'date.timezone': 'Strefa czasowa (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Linie zaczynające się od ; to komentarze.',
    sinCambios: 'Brak zmian względem zapisanej wersji.',
    descartar: 'Odrzuć zmiany',
    revisar: 'Przejrzyj i zapisz',
    diffTitulo: (rama: string) => `Zmiany w pliku php.ini dla PHP ${rama}`,
    diffAyuda:
      'Zostanie zapisana kopia zapasowa z datą, wykonany test php -v, a jeśli PHP jest uruchomione, zostanie zrestartowane.',
    guardar: 'Zapisz i zastosuj',
    cancelar: 'Anuluj',
    guardado: (respaldo: string) => `Zapisano php.ini. Poprzednia kopia zapasowa: ${respaldo}`,
    respaldosTitulo: 'Kopie zapasowe z datą',
    sinRespaldos: 'Nie ma jeszcze kopii zapasowych.',
    restaurar: 'Przywróć',
    confirmarRestaurar: (nombre: string) =>
      `Przywrócić ${nombre}? Bieżący plik php.ini zostanie wcześniej zapisany jako kolejna kopia zapasowa.`,
    restaurado: 'Kopia zapasowa została przywrócona.',
    recargar: 'Wczytaj ponownie',
    extensiones: {
      ayuda:
        'Włączane są wyłącznie rozszerzenia zawarte w tej kompilacji w katalogu ext/. Rozszerzenia firm trzecich są instalowane z katalogu (wariant dla tej kompilacji ze zweryfikowaną sumą SHA-256).',
      activa: 'Aktywne',
      inactiva: 'Nieaktywne',
      falta: 'Brak pliku',
      catalogo: 'Katalog',
      instalar: 'Zainstaluj',
      instalada: (nombre: string) => `Rozszerzenie ${nombre} zostało zainstalowane i włączone.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `Rozszerzenie ${nombre} zostało włączone.` : `Rozszerzenie ${nombre} zostało wyłączone.`,
      buscar: 'Szukaj rozszerzenia',
      vacio: 'Brak pasujących rozszerzeń.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI i Antigravity CLI: wykrywanie, instalacja i otwieranie w projekcie. Obsługiwane narzędzia łączą się z MCP WolfCore Dev. Żadne nie uruchamia się samoczynnie.',
    recargar: 'Wykryj ponownie',
    notaMcp:
      'Zarejestrowany serwer MCP uwierzytelnia się wyłącznie wtedy, gdy agent jest uruchamiany z WolfCore Dev („Otwórz w projekcie”): token trafia do zmiennej WOLFCORE_MCP_TOKEN w tym terminalu i nigdy nie jest zapisywany w konfiguracji agenta. Uruchomiony z zewnątrz agent widzi wpis „wolfcore”, ale nie może się połączyć.',
    sitioElegido: (nombre: string) => `Należy wybrać agenta do otwarcia w ${nombre}.`,
    instalado: 'Zainstalowany',
    noInstalado: 'Niezainstalowany',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Nieznana wersja',
    verVersion: 'Sprawdź wersję',
    verVersionAyuda: 'Uruchamia program z parametrem --version (nie wykonuje się automatycznie po otwarciu ekranu).',
    origen: {
      propio: 'Zainstalowany przez WolfCore Dev',
      'npm-usuario': 'Globalny npm użytkownika',
      ejecutable: 'Program systemowy',
    },
    mcpRegistrado: 'MCP zarejestrowany',
    mcpSinRegistrar: 'MCP niezarejestrowany',
    tokenEscrito:
      'Plik agenta zawierał zapisany token MCP: został już usunięty, a w poprzedniej kopii zapasowej jest zamaskowany (***). Warto rozważyć ponowne wygenerowanie tokenu serwera MCP.',
    mcpNoSoportado:
      'Dokumentacja tego narzędzia nie pozwala pobierać tokenu ze zmiennej środowiskowej: WolfCore Dev nie rejestruje dla niego MCP (token nigdy nie jest zapisywany w plikach).',
    instalar: 'Zainstaluj',
    instalando: 'Instalowanie…',
    guia: 'Instrukcja instalacji',
    soloGuia:
      'WolfCore Dev nie instaluje tego narzędzia (jego instalator nie ma stałej sumy kontrolnej): należy postępować zgodnie z oficjalną instrukcją.',
    registrar: 'Zarejestruj MCP',
    quitar: 'Usuń MCP',
    abrir: 'Otwórz w projekcie',
    confirmarInstalar: {
      titulo: (nombre: string) => `Zainstalować ${nombre}?`,
      texto: (paquete: string) =>
        `Zostanie zainstalowana najnowsza opublikowana wersja pakietu ${paquete} z registry.npmjs.org przy użyciu Node z WolfCore Dev w jego folderze danych.`,
      aislado: 'Nie korzysta z konfiguracji npm użytkownika ani nie modyfikuje globalnego npm. Może to potrwać kilka minut.',
      aceptar: 'Zainstaluj',
      hecho: (nombre: string) => `${nombre} został zainstalowany.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Zarejestrować MCP w ${nombre}?`,
      texto:
        'Dodany (lub zaktualizowany) zostanie wyłącznie wpis „wolfcore” w tym pliku; reszta pozostaje bez zmian:',
      aceptar: 'Zarejestruj',
      hecho: (nombre: string) => `Zarejestrowano MCP w ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Usunąć MCP z ${nombre}?`,
      texto: 'Usunięty zostanie wyłącznie wpis „wolfcore” z tego pliku; reszta pozostaje bez zmian:',
      aceptar: 'Usuń',
      hecho: (nombre: string) => `Usunięto MCP z ${nombre}.`,
    },
    copiaPrevia:
      'Przed modyfikacją zapisywana jest kopia zapasowa z datą obok pliku (<plik>.wolfcore-RRRRMMDD-HHmmss.bak); zachowywanych jest 5 najnowszych kopii. Jeśli agent jest otwarty, należy go wcześniej zamknąć.',
    copiaHecha: (ruta: string) => `Poprzednia kopia zapasowa: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Otwórz ${nombre}`,
      proyecto: 'Projekt',
      sinProyectos: 'Nie ma jeszcze projektów.',
      proveedor: 'Dostawca AI',
      proveedorPropio: 'Skonfigurowany w agencie',
      proveedorAyuda:
        'Po wybraniu dostawcy klucz trafia wyłącznie do środowiska tego terminala: nie jest zapisywany w plikach ani w wierszu poleceń.',
      aceptar: 'Otwórz terminal',
      hecho: (nombre: string) => `${nombre} został otwarty w nowym terminalu.`,
    },
    costo: {
      titulo: 'Przed otwarciem agenta',
      texto:
        'Agent AI korzysta z konta użytkownika u dostawcy: każde żądanie zużywa tokeny i może generować koszty. Może również odczytywać i modyfikować pliki projektu oraz wykonywać polecenia.',
      nunca:
        'WolfCore Dev nigdy nie uruchamia agenta samodzielnie: zawsze odbywa się to na żądanie użytkownika. To powiadomienie wyświetla się tylko raz.',
      aceptar: 'Rozumiem, otwórz',
    },
  },
  depuracion: {
    descripcion:
      'Podgląd wywołań dump(), dd() i wd() ze stron PHP oraz wolfdump z procesów Python, wraz z plikiem i numerem linii. Strona odpowiada bez zakłóceń.',
    receptor: 'Przechwytywanie zrzutów',
    escuchando: (direccion: string, puerto: number) => `Nasłuchiwanie na ${direccion}:${puerto}`,
    apagado: 'Wyłączone',
    memoria:
      'Zrzuty są przechowywane wyłącznie w pamięci (ostatnie 500) i znikają po zamknięciu. Mogą zawierać wrażliwe dane: podczas kopiowania znane klucze są maskowane.',
    sitios: 'Strony',
    sinSitios: 'Brak stron PHP i FastAPI.',
    sinPhp: 'Należy najpierw wybrać wersję PHP dla strony.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Należy zrestartować procesy strony, aby załadowały wolfdump.',
    confirmarTitulo: (sitio: string) => `Włącz przechwytywanie na stronie ${sitio}`,
    confirmarPhp:
      'PHP tej strony załaduje przed każdym żądaniem plik WolfCore Dev (auto_prepend_file, tylko dla tej strony), który definiuje dump(), dd() i wd(), jeśli projekt ich nie definiuje. Jeśli pliki projektu deklarują własną funkcję dump() lub dd() bez sprawdzenia function_exists, PHP zgłosi błąd — w takim przypadku należy wyłączyć przechwytywanie. Strona przejdzie na własną instancję PHP.',
    usoPhp:
      'Laravel i Symfony: dump($x) oraz dd($x) jak zwykle. CodeIgniter 3 i inne: wd($x) wysyła dane bez wyświetlania niczego na stronie.',
    confirmarPython:
      'Procesy tej strony otrzymają moduł wolfdump w zmiennej PYTHONPATH (w projekcie nic nie jest zapisywane). Zmiana obowiązuje od następnego uruchomienia procesów.',
    usoPython: 'from wolfdump import dump  →  dump(wartość)',
    activar: 'Włącz przechwytywanie',
    cancelar: 'Anuluj',
    filtroSitio: 'Wszystkie strony',
    filtroOrigen: 'Wszystkie źródła',
    buscar: 'Szukaj w tekście, pliku lub adresie URL',
    limpiar: 'Wyczyść',
    confirmarLimpiar: 'Usunąć wszystkie zrzuty z pamięci?',
    vacio: 'Nie dotarł jeszcze żaden zrzut.',
    vacioApagado: 'Należy włączyć przechwytywanie i uruchomić stronę, aby rozpocząć.',
    elegir: 'Należy wybrać zrzut z listy.',
    copiar: 'Kopiuj',
    copiado: 'Skopiowano (z zamaskowanymi kluczami)',
    sinSitio: 'bez strony',
    total: (n: number) => `${n} w pamięci`,
    archivo: 'Plik',
    url: 'URL',
    pestanaVolcados: 'Zrzuty',
    pestanaErrores: 'Błędy',
    erroresDescripcion:
      'Błędy z dzienników PHP, Nginx, laravel.log, CodeIgniter 3 i Python, pogrupowane: powtarzający się błąd pojawia się raz z licznikiem.',
    erroresVacio: 'Brak błędów w dziennikach. Pojawiają się tutaj natychmiast po zapisaniu.',
    erroresElegir: 'Należy wybrać błąd z listy.',
    actualizar: 'Odśwież',
    abrirEditor: 'Otwórz w edytorze',
    abrirEditorSinSitio: 'Otwierane są wyłącznie pliki z folderu strony.',
    veces: (n: number) => plural(n, 'raz', 'razy', 'razy'),
    primera: 'Pierwszy raz',
    ultima: 'Ostatni raz',
    fuente: 'Dziennik',
    traza: 'Ślad stosu (ostatni raz)',
    sinTraza: 'Brak śladu stosu.',
  },
  contenedores: {
    descripcion:
      'Podgląd i sterowanie kontenerami Docker lub Podman na tym komputerze. WolfCore Dev nie tworzy, nie usuwa ani nie pobiera kontenerów, obrazów ani wolumenów.',
    motor: 'Silnik',
    refrescar: 'Odśwież',
    detectando: 'Wyszukiwanie Docker i Podman…',
    sinMotorTitulo: 'Brak Docker i Podman',
    sinMotor:
      'Nie znaleziono Docker ani Podman na tym komputerze. WolfCore Dev ich nie instaluje: w razie potrzeby należy zainstalować jeden z nich z oficjalnej strony i kliknąć Odśwież.',
    instalarDocker: 'Zainstaluj Docker',
    instalarPodman: 'Zainstaluj Podman',
    apagadoTitulo: (m: string) => `${m} nie odpowiada`,
    apagado: (m: string) =>
      `${m} jest zainstalowany, ale jego silnik nie odpowiada. Należy uruchomić Docker Desktop (lub maszynę Podman poleceniem „podman machine start”) i kliknąć Odśwież.`,
    remoto:
      'Zignorowano połączenie zdalne (DOCKER_HOST, CONTAINER_HOST, kontekst lub połączenie domyślne): WolfCore Dev korzysta wyłącznie z lokalnego silnika.',
    desdePath: 'Znaleziono w zmiennej PATH, poza domyślnym folderem instalacji.',
    version: (v: string) => `Wersja ${v}`,
    vacio: 'Brak kontenerów.',
    columnas: {
      nombre: 'Nazwa',
      imagen: 'Obraz',
      estado: 'Stan',
      puertos: 'Porty',
      compose: 'Compose',
      acciones: 'Akcje',
    },
    estados: {
      corriendo: 'Uruchomiony',
      detenido: 'Zatrzymany',
      pausado: 'Wstrzymany',
      otro: 'Inny',
    },
    codigoSalida: (n: number) => `kod ${n}`,
    iniciar: 'Uruchom',
    detener: 'Zatrzymaj',
    reiniciar: 'Uruchom ponownie',
    registros: 'Logi',
    confirmarDetenerTitulo: 'Zatrzymać kontener?',
    confirmarDetener: (n: string) =>
      `Kontener „${n}” zostanie zatrzymany. Działające w nim procesy zostaną przerwane (silnik poczeka kilka sekund na ich zakończenie). Nic nie zostanie usunięte.`,
    confirmarReiniciarTitulo: 'Uruchomić kontener ponownie?',
    confirmarReiniciar: (n: string) =>
      `Kontener „${n}” zostanie uruchomiony ponownie. Działające w nim procesy zostaną przerwane i uruchomione od nowa. Nic nie zostanie usunięte.`,
    confirmar: 'Potwierdź',
    cancelar: 'Anuluj',
    hecho: {
      iniciar: (n: string) => `Uruchomiono „${n}”.`,
      detener: (n: string) => `Zatrzymano „${n}”.`,
      reiniciar: (n: string) => `Uruchomiono ponownie „${n}”.`,
    },
    registroTitulo: (n: string) => `Logi kontenera „${n}”`,
    registroEsperando: 'Oczekiwanie na linie…',
    registroFin: 'Zapis logów zakończył się (kontener został zatrzymany lub silnik zamknął strumień).',
    cerrar: 'Zamknij',
  },
  versiones: {
    pestana: 'Wersje',
    pestanaServicios: 'Usługi',
    elegirServicio: 'Usługa',
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
        'Każda wersja główna (8.4, 17…) ma własną instancję, folder danych i port: można uruchomić kilka jednocześnie. Gwiazdka oznacza wersję używaną przez nowe projekty.',
      pool: 'Każda uruchomiona wersja PHP ma własny proces PHP; gwiazdka oznacza wersję używaną przez nowe projekty.',
      unica:
        'Można zainstalować kilka wersji, ale aktywna pozostaje tylko jedna: uruchomienie innej zmienia aktywną wersję.',
      ninguno:
        'Nie ma usługi do uruchomienia: projekty korzystają z wymaganej wersji lub wersji domyślnej (gwiazdka).',
    },
    filtroRama: 'Wersja',
    todasRamas: 'Wszystkie wersje',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Pokaż wszystkie',
    origen: {
      vivo: 'Online',
      cache: (h: number) => (h < 1 ? 'Pamięć podręczna sprzed mniej niż 1 godz.' : `Pamięć podręczna sprzed ${h} godz.`),
      fija: 'Lista offline',
    },
    actualizarLista: 'Odśwież listę',
    errorCarga: 'Nie udało się wczytać listy wersji',
    vacio: 'Brak wersji do wyświetlenia.',
    soporte: { lts: 'LTS', actual: 'Bieżąca', fin: 'Bez wsparcia', preview: 'Preview' },
    finSoporte: (f: string) => `Wsparcie do ${f}`,
    finSoportePasado: (f: string) => `Bez wsparcia od ${f}`,
    marcas: {
      instalada: 'Zainstalowana',
      encendida: 'Uruchomiona',
      actualizacion: (v: string) => `Aktualizacja: ${v}`,
      bloqueada: 'Zablokowana',
      sinHuella: 'Brak opublikowanej sumy kontrolnej',
      huellaDebil: 'Tylko suma MD5',
      firmada: 'Z podpisem PGP',
    },
    ayudaFirmada:
      'Oficjalne źródło podpisuje ten plik za pomocą PGP: WolfCore Dev sprawdza podpis przed instalacją, używając kluczy wbudowanych w aplikację.',
    ayudaSinHuella:
      'Oficjalne źródło nie publikuje silnej sumy kontrolnej (SHA-256 lub SHA-512): nie można zweryfikować pobranego pliku.',
    instalar: 'Zainstaluj',
    desinstalar: 'Odinstaluj',
    encender: 'Uruchom',
    apagar: 'Zatrzymaj',
    actualizar: 'Aktualizuj',
    usarEsta: 'Użyj tej wersji',
    usarEstaAyuda: (id: string) =>
      `Instancja ${id} używa innej wersji tej usługi: zmiana nastąpi po utworzeniu kopii zapasowej danych.`,
    predeterminada: 'Domyślna dla nowych projektów',
    hacerPredeterminada: 'Ustaw dla nowych projektów',
    predeterminadaHecha: (v: string) => `Wersja ${v} została ustawiona jako domyślna.`,
    puerto: 'Port',
    puertoDe: (id: string) => `Port instancji ${id}`,
    cambiarPuerto: 'Zmień',
    puertoCambiado: (p: number) => `Port został zmieniony na ${p}.`,
    puertoProyectosTitulo: 'Projekty z poprzednim portem',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Te projekty nadal używają portu ${viejo} w pliku .env (nie zostały zmienione): ${lista}. Należy zmienić go na ${nuevo}.`,
    resolver: 'Rozwiąż',
    instalada: (v: string) => `Zainstalowano ${v}.`,
    selector: { etiqueta: 'Instancja', predeterminada: 'domyślna', apagada: 'wyłączona' },
    dialogoSinHuella: {
      titulo: (v: string) => `Zainstaluj ${v} bez sumy kontrolnej`,
      riesgo:
        'Ta wersja nie ma sumy kontrolnej opublikowanej przez oficjalne źródło: WolfCore Dev nie może sprawdzić, czy pobrany plik jest oryginalny.',
      explicacion:
        'Pobieranie nadal odbywa się przez HTTPS z oficjalnej strony, jednak w razie naruszenia bezpieczeństwa tej strony lub połączenia nie zostanie to wykryte. Należy instalować wyłącznie w razie konieczności.',
      alternativa: (v: string) => `Dostępna jest zweryfikowana wersja tej samej usługi: ${v}.`,
      casilla: 'Rozumiem ryzyko i chcę zainstalować bez weryfikacji',
      instalarVerificada: (v: string) => `Zainstaluj ${v} (zweryfikowana)`,
      instalarIgual: 'Zainstaluj bez weryfikacji',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Aktualizuj ${n}`,
      tituloRama: (v: string) => `Nowa wersja: ${v}`,
      ninguna: 'brak',
      instancia: (id: string) => `Instancja ${id} zostanie zaktualizowana. Zanim cokolwiek ulegnie zmianie:`,
      pasoInstalar: (v: string) => `zostanie zainstalowana wersja ${v} obok obecnej (która nie jest usuwana);`,
      pasoVolcados: 'każda baza danych zostanie zrzucona przy użyciu bieżącej wersji;',
      pasoCopia: 'folder danych zostanie zatrzymany i skopiowany w całości (kopia na zimno);',
      pasoArrancar: 'usługa uruchomi się w nowej wersji i zostanie sprawdzone, czy odpowiada;',
      pasoVuelta:
        'jeśli nie uruchomi się, nastąpi powrót do poprzedniej wersji z jej danymi, a kopia zapasowa pozostanie zapisana.',
      datos: 'Dane:',
      respaldo: 'Kopia zapasowa w:',
      espacio: 'Miejsce:',
      espacioLibre: (libres: string, necesarios: string) =>
        `wolne: ${libres}; wymagane: ${necesarios}`,
      datosQuedan:
        'Poprzednie dane nigdy nie są usuwane: kopia zapasowa i zrzuty pozostają w sekcji Kopie zapasowe aktualizacji do momentu ich usunięcia.',
      sinEspacio: 'Brak wystarczającego miejsca na kopię zapasową: należy zwolnić miejsce i spróbować ponownie.',
      alLado: (v: string) =>
        `Zostanie zainstalowana wersja ${v}. Pozostałe zainstalowane wersje pozostają bez zmian; projekty przypięte do innej wersji nadal z niej korzystają.`,
      ramaExplicacion:
        'Nowa wersja główna nie zastępuje poprzedniej: tworzona jest nowa instancja z własnym folderem danych i portem. Obecna instancja pozostaje bez zmian.',
      copiarDesdeTitulo: 'Dane nowej instancji',
      copiarDesde: (id: string) =>
        `Skopiuj dane z ${id} (zostaną zrzucone i przywrócone; oryginał pozostaje bez zmian)`,
      vacia: 'Rozpocznij od pustej',
      ramaNota:
        'Użytkownicy baz danych nie są kopiowani; projekty muszą wskazywać port nowej instancji.',
      crearInstancia: 'Utwórz nową instancję',
      confirmar: 'Aktualizuj z kopią zapasową',
      hecho: (v: string) => `Zaktualizowano ${v}.`,
      fallo: 'Nie udało się zaktualizować',
      ramaCreada: (id: string) => `Utworzono instancję ${id}.`,
      copiadas: (l: string) => `Skopiowano: ${l}.`,
      noCopiada: (b: string, m: string) => `Nie skopiowano ${b}: ${m}`,
    },
    limpieza: {
      boton: 'Wyczyść nieużywane wersje…',
      titulo: 'Wyczyść nieużywane wersje',
      intro:
        'Usuwane są wyłącznie pliki wykonywalne wersji, które nie są nigdzie używane (folder bin). Dane baz danych, instancje ani projekty nigdy nie są naruszane.',
      cargando: 'Wyszukiwanie wersji…',
      vacia: 'Brak zainstalowanych wersji.',
      sinLibres: 'Wszystkie zainstalowane wersje są w użyciu: nie ma nic do wyczyszczenia.',
      fallo: 'Nie udało się wyczyścić',
      fallaLista: 'Nie udało się wczytać listy wersji',
      bloqueada: 'Nie można zaznaczyć',
      marcadas: (n: number, tam: string) => `${plural(n, 'wersja', 'wersje', 'wersji')} · ${tam}`,
      destinoTitulo: 'Co z nimi zrobić',
      papelera: 'Przenieś do kosza: zachowywane przez 7 dni i do tego czasu nadal zajmują miejsce na dysku',
      definitivo: 'Usuń trwale: natychmiast zwalnia miejsce i nie można tego cofnąć',
      avisoDefinitivo:
        'Trwałe usunięcie: aby ponownie korzystać z tych wersji, trzeba będzie pobrać je od nowa.',
      instantanea:
        'W przypadku trwałego usunięcia wcześniej zapisywana jest kopia konfiguracji środowiska; z kosza można je przywrócić.',
      entiendo: 'Rozumiem, że tej operacji nie można cofnąć',
      confirmar: (n: number) => `Usuń ${plural(n, 'wersję', 'wersje', 'wersji')}`,
      motivos: {
        predeterminada: 'Jest wersją domyślną',
        encendida: 'Jest uruchomiona lub działa',
        sitio: 'Używana przez projekt',
        instancia: 'Używana przez instancję (nawet jeśli jest wyłączona)',
        plantilla: 'Używana przez szablon',
        workspace: 'Używana przez obszar roboczy',
        runtime: 'Używana przez projekt',
        tarea: 'Używana przez projekt z zaplanowanymi zadaniami',
        duda: 'Nie udało się sprawdzić: pozostaje bez zmian',
        datos: 'Zawiera dane, które potrafi otworzyć tylko ta wersja',
        herramienta: 'Używana przez phpMyAdmin lub Adminer',
      },
      resultadoTitulo: 'Wynik',
      liberadas: (tam: string) => `Zwolniono ${tam}.`,
      enPapelera: (tam: string) => `${tam} znajduje się w koszu (usunięcie po 7 dniach).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${plural(n, 'wersja została już usunięta z bin, ale pozostały resztki', 'wersje zostały już usunięte z bin, ale pozostały resztki', 'wersji zostało już usuniętych z bin, ale pozostały resztki')}, których usunięcie zostanie ponowione przy uruchomieniu aplikacji.`,
      instantaneaGuardada: 'Kopia konfiguracji środowiska została zapisana przed usunięciem.',
      ajeno: (lista: string) =>
        `Zawiera elementy zainstalowane przez użytkownika: ${lista}. Usunięcie spowoduje ich utratę.`,
      incluirAjeno: 'Usuń mimo utraty tych elementów',
      sinCatalogo: 'Nie ma jej już w katalogu: po usunięciu nie będzie można jej ponownie pobrać.',
      papeleraTitulo: 'W koszu',
      recuperar: 'Przywróć',
      recuperada: (v: string) => `Przywrócono ${v}.`,
      borradaEl: (f: string) => `Usunięto ${f}`,
      fallaRecuperar: 'Nie udało się przywrócić',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Odinstaluj ${v}`,
      binario: 'Usuwane są wyłącznie pliki wykonywalne tej wersji.',
      instancia: (id: string) =>
        `Używana przez instancję ${id}: zostanie zatrzymana i usunięta z listy instancji.`,
      datosQuedan:
        'Dane pozostają na dysku: po ponownym zainstalowaniu tej wersji instancja otworzy je z powrotem.',
      borrarDatos: 'Usuń również dane',
      borrarAviso: (id: string) =>
        `Folder danych instancji ${id} wraz ze wszystkimi bazami zostanie usunięty. Tej operacji nie można cofnąć. Aby potwierdzić, należy wpisać "${id}".`,
      escriba: (id: string) => `Proszę wpisać ${id}, aby potwierdzić`,
      desinstalar: 'Odinstaluj',
      desinstalarYBorrar: 'Odinstaluj i usuń dane',
      unica:
        'Jest to aktywna wersja: jeśli jest jedyną zainstalowaną, można ją usunąć po zatrzymaniu usługi (pozostanie niezainstalowana); jeśli są inne, należy najpierw wybrać inną jako aktywną (gwiazdka).',
      predeterminada: (id: string) =>
        `${id} jest instancją domyślną: Bazy danych, blok .env oraz narzędzia korzystające z silnika przejdą na inną instancję (z innym portem).`,
      hecho: (v: string) => `Odinstalowano ${v}.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Rozwiąż problem z ${id}`,
      explicacion:
        'Aktualizacja nie powiodła się i nie udało się przywrócić danych tej instancji, dlatego nie zostanie uruchomiona do czasu wybrania dalszego działania. Nic nie zostanie usunięte.',
      fallida: 'Zmodyfikowane dane:',
      respaldo: 'Kopia zapasowa:',
      opciones: 'Dalsze działanie',
      devolver: (sello: string, tam: string) =>
        `Przywróć kopię zapasową ${sello} (${tam}); bieżący folder zostanie odłożony na bok, a nie usunięty`,
      usarActual: 'Użyj bieżącego folderu danych w obecnej postaci',
      notaActual:
        'Wyłącznie jeśli bieżący folder zawiera kompletne dane; w przeciwnym razie należy wybrać kopię zapasową.',
      notaDevolver:
        'Kopia zapasowa jest kopiowana, weryfikowana i dopiero wtedy umieszczana na właściwym miejscu.',
      escriba: (id: string) => `Proszę wpisać ${id}, aby potwierdzić`,
      elegirVersion:
        'Nie udało się odczytać znacznika blokady: proszę wybrać wersję, za pomocą której dane mają zostać otwarte (wersję sprzed aktualizacji).',
      version: 'Wersja',
      confirmar: 'Rozwiąż',
      hecho: (id: string) => `Instancja ${id} została odblokowana. Można ją teraz uruchomić.`,
    },
    respaldos: {
      titulo: 'Kopie zapasowe z aktualizacji',
      descripcion:
        'Kopie pozostawione przez aktualizacje i nowe wersje. Folder danych używany przez każdą instancję nigdy się tu nie pojawia.',
      vacio: 'Brak kopii.',
      tipos: {
        respaldo: 'Kopia na zimno',
        volcados: 'Zrzuty baz danych',
        fallida: 'Dane z nieudanej wersji',
        restaurando: 'Przerwane przywracanie',
        copia: 'Zrzuty dla nowej wersji',
      },
      archivos: (n: number) => `${n} ${plural(n, 'plik', 'pliki', 'plików')}`,
      borrar: 'Usuń',
      borrarDe: (n: string) => `Usuń ${n}`,
      confirmarTitulo: 'Usuń kopię',
      confirmar: (n: string, tam: string) =>
        `Element ${n} (${tam}) zostanie usunięty. Tej operacji nie można cofnąć. Dane używane przez instancje pozostaną nietknięte.`,
      borrado: 'Kopia została usunięta.',
    },
  },
  navGrupos: {
    trabajo: 'Praca',
    entorno: 'Środowisko',
    utilidades: 'Narzędzia',
  },
  avisos: {
    campana: 'Powiadomienia',
    campanaConNuevos: (n: number) =>
      `Powiadomienia: ${n} ${plural(n, 'nieprzeczytane', 'nieprzeczytane', 'nieprzeczytanych')}`,
    titulo: 'Centrum powiadomień',
    vacio:
      'Brak powiadomień. Pojawią się tutaj informacje o awariach usług, zajętych portach i wygasających certyfikatach.',
    marcarTodos: 'Oznacz wszystkie jako przeczytane',
    limpiar: 'Wyczyść historię',
    ver: 'Pokaż',
    actualizar: 'Aktualizuj',
    verVersiones: 'Pokaż wersje',
    cerrar: 'Zamknij',
    niveles: { info: 'Informacja', aviso: 'Powiadomienie', error: 'Błąd' },
    sinLeer: 'Nieprzeczytane',
  },
  barra: {
    paleta: 'Wyszukaj lub uruchom polecenie',
    atajoPaleta: 'Ctrl+K',
    tema: 'Zmień motyw',
    idioma: 'Zmień język',
  },
  preferencias: {
    titulo: 'Wygląd i język',
    descripcion: 'Zmiany są stosowane natychmiast i zapisywane na tym komputerze.',
    tema: 'Motyw',
    temas: { sistema: 'Systemowy', claro: 'Jasny', oscuro: 'Ciemny' },
    idioma: 'Język',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語', ko: '한국어', hi: 'हिन्दी', tr: 'Türkçe', id: 'Bahasa Indonesia', pl: 'Polski', nl: 'Nederlands', uk: 'Українська' },
    acento: 'Kolor akcentu',
    acentos: {
      indigo: 'Indygo',
      azul: 'Niebieski',
      verde: 'Zielony',
      violeta: 'Fioletowy',
      naranja: 'Pomarańczowy',
      rosa: 'Różowy',
    },
    acentoPropio: (color: string) => `Własny (${color})`,
    errorGuardar: 'Nie udało się zapisać preferencji',
    asistente: 'Kreator pierwszego uruchomienia',
    asistenteAyuda:
      'Ponowne przejście przez kroki początkowe: folder projektów, podstawowe składniki, urząd certyfikacji (CA), GitHub i monitorowany folder.',
    asistenteAbrir: 'Otwórz kreator',
  },
  paleta: {
    titulo: 'Paleta poleceń',
    placeholder: 'Wyszukaj ekran, usługę, projekt lub narzędzie…',
    sinResultados: 'Żadne polecenie nie pasuje do wyszukiwania.',
    ayuda: '↑ ↓ nawigacja · Enter uruchom · Esc zamknij',
    grupos: {
      navegacion: 'Przejdź do',
      servicios: 'Usługi',
      proyectos: 'Projekty',
      herramientas: 'Narzędzia',
      github: 'GitHub',
      general: 'Ogólne',
    },
    irA: (pantalla: string) => `Przejdź do: ${pantalla}`,
    encender: (servicio: string) => `Uruchom: ${servicio}`,
    apagar: (servicio: string) => `Zatrzymaj: ${servicio}`,
    iniciarTodo: 'Uruchom wszystkie usługi',
    detenerTodo: 'Zatrzymaj wszystkie usługi',
    iniciarWorkspace: (n: string) => `Uruchom obszar roboczy ${n}`,
    detenerWorkspace: (n: string) => `Zatrzymaj obszar roboczy ${n}`,
    abrirSitio: (nombre: string) => `Otwórz ${nombre} w przeglądarce`,
    traerCambios: (nombre: string) => `Pobierz zmiany w ${nombre}`,
    abrirHerramienta: (nombre: string) => `Otwórz ${nombre}`,
    clonar: 'Sklonuj repozytorium z GitHub',
    agregarProyecto: 'Dodaj projekt',
    nuevoProyecto: 'Utwórz nowy projekt',
    tema: (tema: string) => `Motyw: ${tema}`,
    idioma: (idioma: string) => `Język: ${idioma}`,
    asistente: 'Otwórz kreator pierwszego uruchomienia',
  },
  nuevoProyecto: {
    titulo: 'Nowy projekt',
    boton: 'Nowy projekt',
    descripcion:
      'Utworzenie projektu od podstaw: folder, strona z HTTPS, baza danych oraz jej połączenie.',
    pasos: { tipo: 'Typ', datos: 'Dane', resumen: 'Podsumowanie', crear: 'Tworzenie' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Z Composer; klucz aplikacji, baza danych i migracje.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Oficjalny appstarter z plikiem .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Klasyczny framework ze skonfigurowanym plikiem database.php.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Oficjalny szkielet (lub webapp) z plikiem .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Środowisko wirtualne, requirements.txt i proces uvicorn.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Oficjalny pakiet z gotowym wp-config.php.' },
      estatico: {
        nombre: 'Strona statyczna',
        descripcion: 'HTML i CSS obsługiwane przez Nginx, bez bazy danych.',
      },
    },
    campos: {
      nombre: 'Nazwa projektu',
      nombrePlaceholder: 'moj-sklep',
      nombreAyuda: (dominio: string) => `Adres strony: ${dominio} (małe litery, cyfry i myślniki).`,
      carpeta: 'Folder nadrzędny',
      elegirCarpeta: 'Wybierz folder…',
      cambiarCarpeta: 'Zmień folder…',
      carpetaAyuda:
        'Projekt zostanie utworzony w nowym folderze o tej nazwie wewnątrz wskazanego katalogu. Folder musi być pusty lub nie istnieć.',
      php: 'Wersja PHP',
      python: 'Wersja Python',
      sinInstalada: 'Brak zainstalowanych wersji: należy zainstalować wersję w sekcji Usługi.',
      conBase: 'Utwórz bazę danych dla projektu',
      sinBase: 'Bez bazy danych',
      instancia: 'Serwer bazy danych',
      apagada: 'wyłączony',
      apagadaAyuda:
        'Ten serwer jest wyłączony: należy go uruchomić w sekcji Usługi przed utworzeniem projektu.',
      sinMotores: 'Brak zainstalowanego serwera bazy danych dla tego typu projektu.',
      nombreBase: 'Nazwa bazy danych',
      starterKit: 'Zestaw startowy',
      starterKits: { ninguno: 'Brak', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Dołącz pakiety webowe (webapp)',
      pgvector: 'Włącz pgvector (wyszukiwanie wektorowe)',
    },
    huella: {
      titulo: 'WordPress publikuje jedynie słabą sumę kontrolną',
      riesgo:
        'Opublikowana suma kontrolna to SHA-1 — algorytm, który nie jest już uznawany za bezpieczny — i pochodzi z tej samej witryny co sam plik.',
      explicacion:
        'Jeśli ta witryna lub połączenie zostaną przejęte, zmodyfikowany plik przejdzie weryfikację. Pobieranie nadal odbywa się przez HTTPS z wordpress.org. Należy kontynuować wyłącznie w przypadku zaufania temu źródłu.',
      leyendo: 'Odczytywanie opublikowanej sumy kontrolnej…',
      noDisponible:
        'Nie udało się teraz odczytać sumy kontrolnej (brak połączenia lub brak odpowiedzi ze źródła); odczyt zostanie ponowiony podczas tworzenia.',
      fuente: 'Źródło: wordpress.org',
      casilla: 'Rozumiem, że suma kontrolna jest słaba, i mimo to chcę utworzyć projekt',
    },
    resumen: {
      titulo: 'Zostaną utworzone następujące elementy',
      intro: 'Proszę sprawdzić przed rozpoczęciem.',
      tipo: 'Typ',
      carpeta: 'Folder',
      sitio: 'Strona',
      dominio: 'Domena',
      https: 'Adres z HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Baza danych',
      env: 'Połączenie zapisane w',
      nota: 'W razie niepowodzenia któregoś kroku nic nie zostanie usunięte: wyświetlone zostaną utworzone elementy i będzie można ponowić próbę.',
    },
    errores: {
      nombreVacio: 'Proszę podać nazwę projektu.',
      nombreInvalido:
        'Nazwa może zawierać wyłącznie małe litery, cyfry i myślniki (maksymalnie 40 znaków) i nie może zaczynać ani kończyć się myślnikiem.',
      sinCarpeta: 'Proszę wybrać folder nadrzędny projektu.',
      sinPhp: 'Proszę wybrać wersję PHP (w razie braku należy zainstalować ją w sekcji Usługi).',
      sinPython:
        'Proszę wybrać wersję Python (w razie braku należy zainstalować ją w sekcji Usługi).',
      sinInstancia:
        'Proszę wybrać serwer do utworzenia bazy danych lub odznaczyć tworzenie bazy.',
      baseInvalida: 'Nazwa bazy danych jest nieprawidłowa dla tego silnika.',
      motorNoVale: 'WordPress wymaga MySQL lub MariaDB.',
      pgvectorMotor: 'pgvector wymaga PostgreSQL.',
      huellaDebil: 'Proszę potwierdzić zrozumienie ryzyka związanego ze słabą sumą kontrolną WordPress.',
    },
    acciones: {
      cambiarCarpeta: 'Wybierz inny folder',
      cambiarBase: 'Zmień nazwę bazy danych',
      cambiarNombre: 'Zmień nazwę',
      reintentarPaso: 'Ponów krok',
      servicios: 'Przejdź do Usług',
      confirmarHuella: 'Sprawdź potwierdzenie',
    },
    botones: {
      siguiente: 'Dalej',
      atras: 'Wstecz',
      crear: 'Utwórz projekt',
      creando: 'Tworzenie…',
      cerrar: 'Zamknij',
      abrirEditor: 'Otwórz w edytorze',
      verSitio: 'Otwórz stronę',
      verProyecto: 'Pokaż w Projektach',
    },
    progreso: {
      titulo: 'Tworzenie projektu',
      listo: 'Projekt został utworzony.',
      fallo: (paso: string) =>
        `Krok „${paso}” nie powiódł się. Nic nie zostało usunięte: należy ponowić krok lub rozwiązać problem i spróbować ponownie.`,
      quedo: (partes: string) => `Utworzono: ${partes}.`,
      quedoCarpeta: 'folder',
      quedoBase: (nombre: string) => `bazę danych ${nombre}`,
      quedoSitio: 'stronę',
      avisos: 'Powiadomienia',
      sinUsuarioPropio:
        'Szyfrowanie systemowe jest niedostępne: projekt używa połączenia administratora bazy danych. Gdy szyfrowanie będzie dostępne, należy użyć opcji „Użyj własnego użytkownika” w menedżerze .env.',
      editorFallo: 'Nie udało się otworzyć edytora.',
    },
  },
  importar: {
    boton: 'Importuj…',
    titulo: 'Importuj z Laragon, XAMPP lub Herd',
    intro:
      'Strony są powiązywane w ich obecnej lokalizacji: żaden folder nie jest przenoszony, kopiowany ani modyfikowany. Opcjonalnie można również skopiować bazy danych. WolfCore Dev wyłącznie odczytuje instalacje innych programów.',
    buscando: 'Wyszukiwanie instalacji…',
    nada: 'Nie znaleziono Laragon, XAMPP ani Herd w standardowych folderach.',
    errorVista: 'Nie udało się wyszukać elementów do zaimportowania',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Strony',
      todos: 'Zaznacz wszystkie',
      ninguno: 'Odznacz wszystkie',
      dominio: (d: string) => `Domena ${d}`,
      dominioPropuesto: (d: string) => `Domena ${d} (proponowana)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'Nieokreślona wersja PHP',
      base: (nombre: string, motor: string) => `Baza ${nombre} (${motor})`,
      yaVinculado: 'Jest już stroną w WolfCore Dev',
      dominioEnUso: 'Inna strona już używa tej domeny',
    },
    avisos: {
      sin_dominio: 'Brak domeny w drugim programie: zaproponowano nową.',
      dominio_invalido: 'Domena jest nieprawidłowa: zaproponowano nową.',
      sin_vhost: 'Brak własnego hosta wirtualnego: zaproponowano domenę.',
      php_desconocido: 'Nieznana wersja PHP: wybrano jedną z zainstalowanych.',
      base_no_local: 'Baza znajduje się na innym serwerze: nie zostanie zaimportowana.',
      base_nombre_invalido: 'Nazwa bazy jest nieprawidłowa: nie zostanie zaimportowana.',
      motor_no_soportado: 'Baza nie jest typu MySQL ani MariaDB: nie zostanie zaimportowana.',
    },
    problemas: {
      titulo: (n: number) =>
        `${n} ${plural(n, 'element został odrzucony lub nie udało się go odczytać', 'elementy zostały odrzucone lub nie udało się ich odczytać', 'elementów zostało odrzuconych lub nie udało się ich odczytać')}`,
    },
    bases: {
      titulo: 'Bazy danych',
      importarBases: 'Zaimportuj również bazy danych',
      ayuda:
        'Przed kontynuacją należy uruchomić serwer baz danych drugiego programu: WolfCore Dev nie uruchamia ani nie zatrzymuje zewnętrznych programów. Hasło jest używane wyłącznie podczas tego importu i nie jest zapisywane.',
      destino: 'Serwer docelowy',
      apagada: 'wyłączony',
      sinMotores:
        'Brak zainstalowanego MySQL ani MariaDB: aby zaimportować bazy, należy je zainstalować w sekcji Usługi.',
      puerto: 'Port serwera źródłowego',
      usuario: 'Użytkownik',
      clave: 'Hasło',
      claveAyuda: 'Pozostawić puste, jeśli użytkownik nie ma hasła (np. root w Laragon lub XAMPP).',
      existe: 'już istnieje na serwerze docelowym',
      reemplazar: 'Zastąp (wcześniej zostanie utworzona kopia zapasowa)',
      noSeToca: 'Pozostanie bez zmian, jeśli nie zostanie zaznaczona.',
    },
    pasos: { elegir: 'Wybór', confirmar: 'Potwierdzenie' },
    continuar: 'Kontynuuj',
    volver: 'Wstecz',
    cancelar: 'Anuluj',
    importar: 'Importuj',
    cerrar: 'Zamknij',
    sinSeleccion: 'Proszę wybrać co najmniej jedną stronę.',
    origenIncompleto: 'Proszę podać port i użytkownika serwera źródłowego.',
    confirmar: {
      titulo: 'Potwierdź import',
      sitios: (n: number) =>
        `${plural(n, 'Zostanie powiązana', 'Zostaną powiązane', 'Zostanie powiązanych')} ${n} ${plural(n, 'strona', 'strony', 'stron')} w bieżącym folderze. Żadne pliki nie są przenoszone, kopiowane ani modyfikowane.`,
      sinConfianza:
        'Żadna zaimportowana strona nie uruchamia receptur, dopóki nie zostanie zaznaczona opcja „Ufam temu repozytorium”.',
      hosts:
        'Zostaną zaktualizowane Nginx oraz plik hosts (Windows może poprosić o uprawnienia administratora).',
      basesNuevas: (nombres: string) => `Zostaną skopiowane bazy danych: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Zostaną zastąpione istniejące bazy danych: ${nombres}. Wcześniej zostanie zapisana kopia zapasowa każdej z nich.`,
      basesSinTocar: (nombres: string) =>
        `Istniejące bazy danych pozostaną bez zmian: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Zrzut zostanie wykonany z serwera drugiego programu (127.0.0.1:${puerto}, użytkownik ${usuario}). Odczyt odbywa się bez modyfikacji.`,
      sinBases: 'Nie zostanie zaimportowana żadna baza danych.',
      proteccion:
        'Struktura każdej bazy jest wcześniej sprawdzana, a dane są wprowadzane przez użytkownika z ograniczonymi uprawnieniami: w razie błędu baza pozostanie w pierwotnym stanie.',
    },
    resultado: {
      titulo: 'Wynik importu',
      importando: 'Importowanie…',
      cancelar: 'Anuluj import',
      restaurada:
        'Oryginalna baza została automatycznie przywrócona z kopii zapasowej i pozostała w pierwotnym stanie.',
      sitioOk: 'Zaimportowano',
      sitioFallo: 'Nie zaimportowano',
      baseOk: (n: string) => `Baza ${n} zaimportowana`,
      baseFallo: (n: string) => `Baza ${n} nie została zaimportowana`,
      copiaPrevia: (ruta: string) => `Kopia zapasowa poprzedniej bazy: ${ruta}`,
      phpDistinto: (v: string) =>
        `Użyto PHP ${v} (pierwotna wersja nie była zainstalowana).`,
      sinAplicar:
        'Nginx lub plik hosts nie zostały zaktualizowane: należy sprawdzić powiadomienie w Projektach i spróbować ponownie.',
      resumen: (s: number, b: number) =>
        `${s} ${plural(s, 'zaimportowana strona', 'zaimportowane strony', 'zaimportowanych stron')}, ${b} ${plural(b, 'zaimportowana baza', 'zaimportowane bazy', 'zaimportowanych baz')}.`,
      errorImportar: 'Nie udało się zaimportować',
    },
  },
  plantillas: {
    guardarComo: 'Zapisz jako szablon…',
    dialogo: {
      titulo: (nombre: string) => `Zapisz „${nombre}” jako szablon`,
      intro:
        'Szablon zapisuje recepturę, ustawienia PHP i Nginx, rozszerzenia oraz schemat bazy danych (wyłącznie strukturę, bez żadnych wierszy). Nigdy nie zapisuje haseł, kluczy ani danych z bazy.',
      nombre: 'Nazwa szablonu',
      nombrePlaceholder: 'Mój projekt bazowy',
      conArchivos: 'Dołącz również pliki projektu',
      conArchivosAyuda: 'Bez tej opcji zapisywane są wyłącznie receptura, ustawienia i schemat.',
      siempre: 'Zawsze pomijane',
      siempreLista:
        '.env i .env.*, vendor, node_modules, .git, .venv, logi, zrzuty i bazy plikowe (*.sql, *.dump, *.sqlite), klucze i certyfikaty (*.pem, *.key, *.crt…), wp-config.php oraz wolfcore.yml. Plik zawierający klucz lub hasło również jest pomijany.',
      extra: 'Dodatkowo wyklucz (jeden wpis na wiersz)',
      extraAyuda: 'Nazwy lub ścieżki względem projektu, na przykład uploads lub public/build.',
      vista: 'Co zostanie zapisane',
      calculando: 'Obliczanie…',
      resumen: (archivos: number, tamano: string) =>
        `${archivos} ${plural(archivos, 'plik', 'pliki', 'plików')} · ${tamano}`,
      fuera: (n: number) => `${n} ${plural(n, 'pominięty', 'pominięte', 'pominiętych')}`,
      sinArchivos: 'Zostaną zapisane wyłącznie receptura, ustawienia i schemat; bez żadnych plików.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Zostanie zapisana wyłącznie struktura bazy ${nombre} (serwer ${servidor}), bez żadnych wierszy.`,
      sinBase: 'Projekt nie deklaruje bazy danych: żaden schemat nie zostanie zapisany.',
      avisoMongodb:
        'Ten projekt używa MongoDB: jego schemat (kolekcje i indeksy) nie jest zapisywany.',
      incluirDeTodosModos: 'Dołącz mimo to',
      avisoIncluir: 'Jeśli ten plik zawiera prawdziwy klucz, znajdzie się on wewnątrz szablonu.',
      guardar: 'Zapisz szablon',
      guardada: (nombre: string) => `Szablon „${nombre}” został zapisany.`,
      errorGuardar: 'Nie udało się zapisać szablonu',
      errorVista: 'Nie udało się wygenerować podglądu',
      cancelar: 'Anuluj',
    },
    lista: {
      titulo: 'Moje szablony',
      ayuda:
        'Rozpoczęcie nowego projektu z recepturą, ustawieniami i schematem (bez danych) istniejącego projektu.',
      vacia:
        'Brak szablonów. Projekt można zapisać jako szablon w menu jego karty.',
      conArchivosEtiqueta: 'z plikami',
      soloEsquema: 'receptura i schemat',
      conBase: (motor: string) => `baza ${motor} bez danych`,
      borrarEtiqueta: (nombre: string) => `Usuń szablon ${nombre}`,
      borrarTitulo: (nombre: string) => `Usunąć szablon ${nombre}?`,
      borrarTexto:
        'Usuwany jest wyłącznie szablon. Projekty utworzone na jego podstawie oraz projekt źródłowy pozostają nietknięte.',
      borrada: 'Szablon został usunięty.',
      errorBorrar: 'Nie udało się usunąć szablonu',
      errorLista: 'Nie udało się odczytać szablonów',
      desde: (nombre: string) => `Szablon: ${nombre}`,
      avisoSinBase: 'Ten szablon nie zawiera bazy danych.',
      importadaEtiqueta: 'zaimportowany',
      avisoImportada:
        'Szablon pochodzi od osoby trzeciej: projekt jest tworzony jako niezaufany i bez uruchamiania jego procesów, a otwarcie strony powoduje wykonanie jej kodu. Przed otwarciem należy sprawdzić jego pliki.',
      generadoresTitulo: 'Projekty od podstaw',
    },
  },
  env: {
    accion: 'Zmienne .env…',
    titulo: (nombre: string) => `Plik .env projektu ${nombre}`,
    intro:
      'Wartości poufne są wyświetlane w postaci zamaskowanej. Pełna wartość pojawia się dopiero po kliknięciu „Pokaż” przy danej zmiennej i zostaje ponownie ukryta po 30 sekundach. Przed zapisaniem tworzona jest kopia zapasowa bieżącego pliku .env z datą.',
    noExiste: 'Ten projekt nie ma jeszcze pliku .env: zostanie utworzony przy zapisie.',
    tablaEtiqueta: 'Zmienne pliku .env',
    sinVariables: 'Plik .env nie zawiera zmiennych.',
    secretaEtiqueta: 'poufna',
    duplicadaEtiqueta: 'powtórzona',
    duplicadaAyuda:
      'Ta zmienna występuje w pliku .env więcej niż raz: wyświetlana i zmieniana jest jej ostatnia wartość.',
    soloLecturaEtiqueta: 'wielowierszowa',
    soloLecturaAyuda: 'Zajmuje kilka wierszy: należy edytować ją ręcznie w pliku.',
    seQuitara: 'Zostanie usunięta przy zapisie',
    valorNuevo: 'Nowa wartość',
    valorNuevoDe: (clave: string) => `Nowa wartość zmiennej ${clave}`,
    valorDe: (clave: string) => `Wartość zmiennej ${clave}`,
    vacio: '(puste)',
    mostrar: 'Pokaż',
    ocultar: 'Ukryj',
    mostrarEtiqueta: (clave: string) => `Pokaż wartość zmiennej ${clave}`,
    ocultarEtiqueta: (clave: string) => `Ukryj wartość zmiennej ${clave}`,
    cambiar: 'Zmień',
    deshacer: 'Cofnij',
    deshacerEtiqueta: (clave: string) => `Cofnij zmianę zmiennej ${clave}`,
    quitar: 'Usuń',
    quitarEtiqueta: (clave: string) => `Usuń zmienną ${clave}`,
    errorRevelar: 'Nie udało się wyświetlić wartości',
    agregarTitulo: 'Dodaj zmienną',
    agregarNombre: 'NAZWA',
    agregarValor: 'wartość',
    agregar: 'Dodaj',
    nombreInvalido:
      'Dozwolone są litery, cyfry, podkreślenie i kropka; nazwa nie może zaczynać się od cyfry ani już istnieć.',
    comparar: {
      titulo: 'Porównaj z plikiem przykładowym',
      sinEjemplo: 'Projekt nie ma pliku .env.example do porównania.',
      alDia: 'Plik .env zawiera te same zmienne co plik przykładowy.',
      faltan: (n: number) => `Brakuje ${n}:`,
      sobran: (n: number) =>
        `${n} ${plural(n, 'nadmiarowa (brak w pliku przykładowym)', 'nadmiarowe (brak w pliku przykładowym)', 'nadmiarowych (brak w pliku przykładowym)')}:`,
      distintas: (n: number) =>
        `${n} ${plural(n, 'zmienna', 'zmienne', 'zmiennych')} z wartością inną niż w pliku przykładowym:`,
      agregarFaltantes: 'Dodaj brakujące',
    },
    bloques: {
      titulo: 'Dodaj blok zmiennych',
      ayuda:
        'Dodaje wyłącznie brakujące zmienne z danej kategorii (istniejące pozostają bez zmian), bez haseł i kluczy; wartości należy uzupełnić później w tabeli.',
      bd: 'Baza danych',
      correo: 'Poczta',
      ia: 'AI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Użyj własnego użytkownika',
      ayuda:
        'Tworzy użytkownika bazy danych wyłącznie dla tego projektu (z uprawnieniami jedynie do jego bazy, nigdy administratora) i zapisuje go w .env. Obecnie działa z MySQL i MariaDB w WolfCore Dev.',
      confirmarTitulo: 'Użyć własnego użytkownika bazy danych?',
      confirmarTexto:
        'Zostanie utworzony nowy użytkownik z losowym hasłem i uprawnieniami wyłącznie do bazy tego projektu, a dane połączenia w pliku .env zostaną zaktualizowane. Wcześniej zostanie zapisana kopia zapasowa bieżącego pliku .env; nowe hasło zostanie zapisane w .env projektu oraz w postaci zaszyfrowanej w WolfCore Dev.',
      confirmar: 'Utwórz i użyj',
      hecho: (usuario: string) => `Projekt używa teraz użytkownika ${usuario}.`,
      compartirTitulo: 'Współdzielić użytkownika z innym projektem?',
      compartirTexto: (base: string, proyecto: string) =>
        `Z bazy ${base} korzysta również projekt ${proyecto}. Czy współdzielić jego użytkownika? Ten projekt użyje tej samej nazwy użytkownika i hasła; hasło nie ulegnie zmianie, więc ${proyecto} zachowa połączenie.`,
      compartir: 'Współdziel użytkownika',
      error: 'Nie udało się zmienić użytkownika bazy danych',
    },
    copias: {
      titulo: 'Przywróć kopię zapasową',
      ninguna: 'Brak kopii zapasowych tego pliku .env.',
      volver: 'Przywróć tę kopię',
      confirmarTitulo: 'Przywrócić kopię zapasową pliku .env?',
      confirmarTexto: (fecha: string) =>
        `Bieżący plik .env zostanie zastąpiony kopią z dnia ${fecha}. Wcześniej zostanie zapisana kolejna kopia bieżącego pliku, więc operację można cofnąć.`,
      hecho: 'Przywrócono kopię zapasową.',
      error: 'Nie udało się przywrócić kopii zapasowej',
    },
    cambiosPendientes: (n: number) =>
      `${n} ${plural(n, 'niezapisana zmiana', 'niezapisane zmiany', 'niezapisanych zmian')}`,
    descartar: 'Odrzuć zmiany',
    guardar: 'Sprawdź i zapisz…',
    cerrar: 'Zamknij',
    cerrarTitulo: 'Zamknąć bez zapisywania?',
    cerrarTexto: (n: number) =>
      `${plural(n, 'Pozostała', 'Pozostały', 'Pozostało')} ${n} ${plural(n, 'niezapisana zmiana', 'niezapisane zmiany', 'niezapisanych zmian')}. Zamknięcie spowoduje ich utratę.`,
    cerrarDescartar: 'Zamknij i odrzuć',
    seguirEditando: 'Kontynuuj edycję',
    confirmar: {
      titulo: 'Zapisz zmiany w pliku .env',
      texto:
        'Poniżej znajduje się lista zmian. Wartości poufne są wyświetlane w postaci zamaskowanej. Tworzona jest kopia zapasowa bieżącego pliku .env z datą, a plik jest zapisywany atomowo.',
      sinCambios: 'Brak zmian do zapisania.',
      agregarGitignore: 'Dodaj .env do pliku .gitignore projektu',
      aceptarVersionado: 'Rozumiem ryzyko i mimo to chcę zapisać',
      guardar: 'Zapisz zmiany',
      versionado:
        'Git już śledzi plik .env tego projektu: kolejny commit wyśle jego wartości, nawet jeśli znajduje się w .gitignore. Należy usunąć go z indeksu poleceniem git rm --cached .env.',
      versionadoDesconocido:
        'Nie udało się sprawdzić, czy Git śledzi plik .env tego projektu; aby zapisać, wymagane jest osobne potwierdzenie.',
    },
    errorVistaPrevia: 'Nie udało się przygotować podglądu',
    errorGuardar: 'Nie udało się zapisać pliku .env',
    guardado: 'Plik .env został zapisany.',
    guardadoConCopia: 'Plik .env został zapisany; poprzednia wersja została zachowana jako kopia zapasowa.',
  },
  asistenteInicio: {
    titulo: 'Witamy w WolfCore Dev',
    subtitulo:
      'Pięć kroków do przygotowania środowiska. Nic nie zostanie zainstalowane ani zmienione do momentu kliknięcia przycisku w danym kroku.',
    paso: (n: number, total: number) => `Krok ${n} z ${total}`,
    anterior: 'Poprzedni',
    siguiente: 'Następny',
    omitirTodo: 'Pomiń kreator',
    terminar: 'Zakończ',
    hecho: 'Gotowe',
    reabrir: 'Kreator można ponownie otworzyć w Ustawieniach.',
    pasos: {
      carpeta: {
        titulo: 'Folder projektów',
        texto:
          'Miejsce przechowywania projektów. Tutaj są klonowane nowe repozytoria i ten folder jest monitorowany w ostatnim kroku.',
        elegir: 'Wybierz folder',
        actual: (ruta: string) => `Wybrany folder: ${ruta}`,
        guardada: (ruta: string) => `Bieżący folder: ${ruta}`,
        ninguna: 'Nie wybrano: zostanie użyty folder C:\\Proyectos, jeśli istnieje.',
      },
      basicos: {
        titulo: 'Zainstaluj podstawowe składniki',
        texto:
          'Nginx, PHP 8.4, Composer i Node LTS z oficjalnych źródeł, z weryfikacją sumy kontrolnej. Każdy składnik jest instalowany dopiero po kliknięciu jego przycisku.',
        instalado: 'Zainstalowano',
        instalar: (version: string) => `Zainstaluj ${version}`,
        sinVersion: 'Brak wersji w katalogu',
        cargando: 'Wyszukiwanie wersji…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'Zaufanie lokalnemu urzędowi certyfikacji',
        texto:
          'Aby strony .test otwierały się przez HTTPS bez powiadomień, system Windows musi ufać urzędowi certyfikacji WolfCore Dev. Windows poprosi o potwierdzenie.',
        confiar: 'Zaufaj CA',
        confiada: 'Windows ufa już lokalnemu urzędowi certyfikacji.',
      },
      github: {
        titulo: 'Połącz z GitHub',
        texto:
          'Aby przeglądać repozytoria i klonować je jednym kliknięciem. Należy użyć sesji GitHub CLI lub tokenu osobistego, który jest przechowywany w postaci zaszyfrowanej na tym komputerze.',
      },
      vigilar: {
        titulo: 'Monitorowanie folderu',
        texto:
          'WolfCore Dev zasugeruje podłączenie każdego nowego folderu pojawiającego się w folderze projektów. Nic nie jest podłączane bez potwierdzenia.',
        activar: 'Monitoruj ten folder',
        activa: (ruta: string) => `Monitorowanie ${ruta}`,
        sinCarpeta: 'Najpierw należy wybrać folder projektów (krok 1).',
      },
    },
  },
  /** Wynik importu lub eksportu profilu (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Kopie zapasowe i profile',
      descripcion:
        'Profil przenosi środowisko na inny komputer: strony, wersje, instancje, szablony i ustawienia. Nigdy nie zawiera kluczy, tokenów ani haseł.',
      aislado: {
        titulo: 'Folder testowy',
        texto: (ruta: string) =>
          `WolfCore Dev używa testowego folderu danych (${ruta}). Operacje wykonywane tutaj nie zmieniają rzeczywistego folderu ani systemu: plik hosts nie jest modyfikowany, a certyfikaty nie są instalowane.`,
      },
      exportar: {
        titulo: 'Eksport środowiska',
        texto:
          'Zapisuje plik .wolfperfil ze stronami, wersjami, instancjami, szablonami i ustawieniami.',
        bases: 'Dołącz bazy danych',
        basesAyuda:
          'Pełne zrzuty (wraz z danymi klientów) są przesyłane zaszyfrowane przy użyciu frazy.',
        ca: 'Dołącz urząd certyfikacji (CA)',
        caAyuda: 'Jest szyfrowany przy użyciu frazy. Należy go importować wyłącznie na własnym komputerze.',
        certificados: 'Dołącz certyfikaty stron',
        certificadosAyuda: 'Są przenoszone wyłącznie razem z CA i szyfrowane razem z nim.',
        frase: 'Fraza',
        fraseRepetir: 'Powtórz frazę',
        fraseAyuda: (minimo: number) =>
          `Co najmniej ${minimo} ${plural(minimo, 'znak', 'znaki', 'znaków')}. Bez niej nie można odzyskać baz danych ani CA, a fraza nie jest nigdzie zapisywana.`,
        problemas: {
          frase_corta: (minimo: number) =>
            `Fraza musi mieć co najmniej ${minimo} ${plural(minimo, 'znak', 'znaki', 'znaków')}.`,
          frase_distinta: 'Obie frazy nie są identyczne.',
          certificados_sin_ca: 'Certyfikaty są przenoszone wyłącznie razem z CA.',
        },
        exportar: 'Eksportuj profil…',
        nota: 'Profil nigdy nie zawiera kluczy, tokenów ani haseł, a także migawek, kosza, kopii zapasowych ani folderu data.',
        listo: 'Profil wyeksportowany',
        guardado: (archivo: string, tamano: string) => `Zapisano w ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Import profilu',
        texto:
          'Należy wybrać plik .wolfperfil. Przed wprowadzeniem jakichkolwiek zmian zostanie wyświetlone wszystko, co zostanie zastąpione, usunięte lub pozostanie oczekujące, a zastępowane elementy zostaną zapisane w kopii zapasowej.',
        boton: 'Importuj profil…',
      },
      instantaneas: {
        titulo: 'Migawki środowiska',
        texto:
          'Przed aktualizacją PHP lub Nginx oraz przed importem profilu WolfCore Dev zapisuje kopię zapasową konfiguracji, Nginx oraz plików php.ini — bez kluczy i danych, wyłącznie lokalnie. Przechowywanych jest 10 ostatnich migawek.',
        compartidas:
          'Wszystkie powody dzielą limit 10 migawek: utworzenie nowej zastępuje najstarszą, również jeśli była utworzona ręcznie.',
        tomar: 'Utwórz teraz',
        tomada: 'Migawka zapisana.',
        sinNada: 'Nie ma jeszcze nic do skopiowania.',
        vacia: 'Brak migawek.',
        motivos: {
          actualizar: 'Przed aktualizacją',
          'importar-perfil': 'Przed importem profilu',
          'limpiar-versiones': 'Przed czyszczeniem wersji',
          manual: 'Ręcznie',
        },
      },
    },
    reasignar: {
      titulo: 'Foldery stron',
      texto:
        'Te foldery pochodzą z innego komputera. Należy wskazać ich lokalizację na tym komputerze lub zaimportować stronę jako oczekującą — pozostanie bez folderu do czasu jego wyboru.',
      sitio: 'Strona',
      origen: 'Folder w profilu',
      destino: 'Folder na tym komputerze',
      existe: 'Istnieje',
      noExiste: 'Nie istnieje na tym komputerze',
      buscar: 'Wybierz folder…',
      cambiar: 'Zmień',
      comoPendiente: 'Importuj mimo to jako oczekującą',
      prefijo: (viejo: string, nuevo: string) =>
        `Zastosuj tę samą zamianę dla pozostałych (${viejo} → ${nuevo})`,
      omitido: 'Nie zostanie zaimportowana',
    },
    asistente: {
      titulo: 'Import profilu',
      pasos: {
        archivo: 'Plik',
        revisar: 'Przegląd',
        confirmar: 'Potwierdzenie',
        resultado: 'Wynik',
      },
      archivo: {
        texto:
          'Należy wybrać plik .wolfperfil. Nic nie jest jeszcze zmieniane: najpierw zostanie pokazane, co zostanie zastąpione, usunięte lub pozostawione jako oczekujące.',
        elegir: 'Wybierz plik…',
        cambiar: 'Wybierz inny',
        ninguno: 'Nie wybrano pliku',
        leyendo: 'Odczytywanie profilu…',
        error: 'Nie udało się odczytać profilu',
      },
      origen: (fecha: string, sistema: string) => `Utworzono ${fecha} w systemie ${sistema}.`,
      ignoradas: (n: number) =>
        `${n} ${plural(n, 'wpis w pliku nie należy do profilu i zostanie zignorowany', 'wpisy w pliku nie należą do profilu i zostaną zignorowane', 'wpisów w pliku nie należy do profilu i zostanie zignorowanych')}.`,
      reemplaza: {
        titulo: 'Elementy do zastąpienia',
        ninguno: 'Brak danych w tym folderze: import odbędzie się na czystej instalacji.',
        copia:
          'Przed zastąpieniem wykonywana jest kopia zapasowa w respaldos/pre-perfil-… oraz migawka środowiska; każda zastępowana baza danych otrzymuje własną migawkę. Folder data nigdy nie jest usuwany.',
        config: 'Konfiguracja (config.json)',
        sitio: (id: string) => `Strona ${id}`,
        base: (instancia: string, base: string) => `Baza ${base} (${instancia})`,
        plantilla: (id: string) => `Szablon ${id}`,
        ca: 'Urząd certyfikacji (CA) tego komputera',
      },
      versiones: {
        titulo: 'Wersje',
        ninguna: 'Profil nie zawiera wersji.',
        instalada: 'Już zainstalowana',
        descargar: 'Zostanie pobrana ze zweryfikowanym skrótem',
        pendienteDebil: 'Oczekująca: brak silnego skrótu, należy zainstalować ręcznie',
        pendienteFuera: 'Oczekująca: brak w katalogu',
        huellas: {
          fuerte: 'Skrót SHA-256 lub SHA-512',
          firmada: 'Podpisana',
          debil: 'Słaby skrót',
          ninguna: 'Brak skrótu',
        },
        descargas: (n: number) =>
          `${plural(n, `Zostanie pobrana ${n} wersja`, `Zostaną pobrane ${n} wersje`, `Zostanie pobranych ${n} wersji`)} z oficjalnych stron, z weryfikacją skrótu lub podpisu.`,
      },
      instancias: {
        titulo: 'Instancje baz danych',
        existente: 'Już istnieje: zostanie zachowana z obecnym portem i wersją',
        nueva: (puerto: number) => `Zostanie utworzona z nowymi danymi logowania na porcie ${puerto}`,
        reasignada: (de: number, a: number) => `Port ${de} jest zajęty: zostanie użyty port ${a}`,
      },
      bases: {
        titulo: 'Bazy danych',
        ninguna: 'Profil nie zawiera baz danych.',
        texto:
          'Są przywracane przy użyciu użytkownika ograniczonego do danej bazy i wyłącznie z dozwolonymi instrukcjami. Istniejące bazy otrzymują wcześniej kopię zapasową.',
        omitir: 'Importuj bez baz danych',
      },
      plantillas: {
        titulo: 'Szablony',
        existe: 'Już istnieje: zostanie zastąpiony',
        nueva: 'Nowy',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Zawierają wyłącznie odniesienia do baz danych i usług (procesy projektów nie są przenoszone). Są weryfikowane względem zasobów na tym komputerze i nigdy nie uruchamiają się automatycznie.',
        existe: 'Istnieje już element o tym samym identyfikatorze: zostanie zachowany lokalny',
        nuevo: 'Nowy',
        elementos: (n: number) => `${n} ${plural(n, 'element', 'elementy', 'elementów')}`,
        invalidos: (n: number) =>
          `${n} ${plural(n, 'element z profilu jest nieprawidłowy i nie zostanie zaimportowany', 'elementy z profilu są nieprawidłowe i nie zostaną zaimportowane', 'elementów z profilu jest nieprawidłowych i nie zostanie zaimportowanych')}.`,
      },
      quitado: {
        titulo: 'Elementy pominięte z konfiguracji',
        texto:
          'Ten folder danych jest czysty: z profilu pomijane jest wszystko, co wskazuje poza ten komputer.',
      },
      puertos: {
        titulo: 'Zajęte porty',
        texto: (lista: string) =>
          `Te porty z profilu są już używane przez inny program na tym komputerze: ${lista}. Można je zmienić w sekcji Usługi po zakończeniu importu.`,
      },
      ca: {
        titulo: 'Urząd certyfikacji (CA)',
        texto:
          'Profil zawiera zaszyfrowany CA. Należy go zaimportować wyłącznie jeśli jest własny: ten komputer zaakceptuje podpisywane przez niego certyfikaty.',
        huella: 'Skrót SHA-256 urzędu CA z profilu',
        comparar: 'Przed akceptacją należy porównać go ze skrótem na komputerze źródłowym.',
        importar: 'Importuj CA z profilu',
        noImportar: 'Bez importu ten komputer użyje obecnego CA lub utworzy nowy.',
        ajena:
          'Ten CA ma ograniczenia nazw inne niż WolfCore Dev: nie można go zaimportować.',
        sinRestricciones:
          'Ten CA nie ma ograniczeń nazw: może podpisywać certyfikaty dowolnej witryny internetowej, w tym banków i poczty. Należy go zaimportować wyłącznie, jeśli jest własny i skrót się zgadza.',
        aceptarSin: 'Rozumiem ryzyko: to mój CA i skrót się zgadza',
        reemplazaLocal:
          'Ten komputer ma już CA. Import CA z profilu zastąpi go (kopia pozostanie w kopii zapasowej sprzed importu).',
        reemplazar: 'Zastąp CA tego komputera',
        noSeInstala: 'CA nie jest instalowany automatycznie w systemowym magazynie certyfikatów.',
      },
      frase: {
        titulo: 'Fraza profilu',
        texto: 'Profil zawiera zaszyfrowane bazy danych lub CA. Należy wpisać frazę wybraną podczas eksportu.',
        campo: 'Fraza',
        omitirBases: 'Importuj bez baz danych',
        nota: 'Fraza jest używana wyłącznie w tym oknie: nie jest zapisywana i zostaje usunięta po zakończeniu lub zamknięciu.',
      },
      env: {
        titulo: 'Połączenie projektów',
        texto:
          'Należy zaznaczyć projekty, których plik .env ma wskazywać na nowego własnego użytkownika ich bazy danych (z wcześniejszą kopią pliku .env). Pozostałe nie są zmieniane i zostaną wykazane w raporcie.',
      },
      confirmar: {
        titulo: 'Potwierdzenie importu',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Do zaimportowania: ${sitios} ${plural(sitios, 'strona', 'strony', 'stron')}, ${versiones} ${plural(versiones, 'wersja', 'wersje', 'wersji')} i ${bases} ${plural(bases, 'baza danych', 'bazy danych', 'baz danych')}.`,
        importar: 'Importuj',
        revisar: 'Sprawdź',
        volver: 'Wstecz',
        bloqueos: {
          sitios_sin_carpeta:
            'Należy wybrać folder dla każdej strony lub zaznaczyć ją do importu jako oczekującą.',
          frase_requerida: 'Należy wpisać frazę profilu lub zaimportować bez baz danych.',
          ca_ajena: 'Nie można zaimportować CA z profilu.',
          ca_sin_restricciones: 'Należy osobno potwierdzić import CA bez ograniczeń.',
          reemplazar_ca: 'Należy osobno potwierdzić zastąpienie CA tego komputera.',
        },
      },
      progreso: 'Importowanie profilu… Nie należy zamykać okna: w przypadku baz danych lub pobierania może to chwilę potrwać.',
      fases: {
        copia: 'Kopiowanie zastępowanych elementów',
        versiones: 'Instalowanie wersji',
        configuracion: 'Zapisywanie konfiguracji i stron',
        plantillas: 'Kopiowanie szablonów',
        ca: 'Przygotowywanie CA i certyfikatów',
        bases: 'Przywracanie baz danych',
        env: 'Przepisywanie plików .env',
      },
      avance: (paso: number, de: number) => `Krok ${paso} z ${de}`,
      resultado: {
        titulo: 'Wynik importu',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} ${plural(importados, 'zaimportowany', 'zaimportowane', 'zaimportowanych')}, ${pendientes} ${plural(pendientes, 'oczekujący', 'oczekujące', 'oczekujących')}, ${omitidos} ${plural(omitidos, 'pominięty', 'pominięte', 'pominiętych')} i ${errores} z ${plural(errores, 'błędem', 'błędami', 'błędami')}.`,
        respaldo: (ruta: string) => `Kopia zapasowa zastąpionych elementów: ${ruta}`,
        pendientes: 'Elementy oczekujące można uzupełnić ręcznie.',
        error: 'Nie udało się zaimportować profilu',
        secciones: {
          sitios: 'Strony',
          versiones: 'Wersje',
          instancias: 'Instancje',
          bases: 'Bazy danych',
          plantillas: 'Szablony',
          workspaces: 'Workspaces',
          env: 'Pliki .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Zaimportowano',
          pendiente: 'Oczekujące',
          omitido: 'Pominięto',
          error: 'Błąd',
          instalada: 'Zainstalowano',
          ya_instalada: 'Już zainstalowana',
          creada: 'Utworzono',
          existente: 'Już istniała',
          puerto_reasignado: 'Zmieniono port',
          reescrito: 'Przepisano',
          sin_marcar: 'Niezaznaczone',
        },
        ca: {
          importada: 'Zaimportowano CA',
          nueva: 'Wygenerowano nowy CA',
          sin_cambios: 'CA bez zmian',
        },
        quitarCa: {
          boton: 'Usuń poprzedni CA…',
          titulo: 'Usunięcie poprzedniego CA z zaufanych',
          texto:
            'Z systemowego magazynu certyfikatów zostanie usunięty poprzedni CA tego komputera. Windows może poprosić o potwierdzenie. Nowy CA nie jest instalowany automatycznie.',
          si: 'Usuń',
          hecho: 'Poprzedni CA został usunięty z zaufanych.',
        },
        descartadosWorkspace: (lista: string) => `Nie istnieje na tym komputerze i zostało usunięte: ${lista}`,
        workspacesInvalidos: (n: number) =>
          `${n} ${plural(n, 'nieprawidłowy workspace nie został zaimportowany', 'nieprawidłowe workspace’y nie zostały zaimportowane', 'nieprawidłowych workspace’ów nie zostało zaimportowanych')}.`,
        puerto: (de: number, a: number) => `Port ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Kopia pliku .env: ${ruta}`,
      },
    },
    /** Silne ostrzeżenie w podglądzie: CA z profilu nie ma ograniczeń nazw. */
    caSinRestricciones:
      'Ten CA może podpisywać dowolną witrynę internetową; należy go zaimportować wyłącznie jeśli jest własny i po porównaniu skrótu.',
    motivos: {
      procesos_quitados: 'Procesy (polecenia z innego komputera) nie zostały zaimportowane.',
      tareas_quitadas:
        'Zaplanowane zadania (polecenia z innego komputera) nie zostały zaimportowane. Należy je utworzyć ponownie lub przejąć z pliku wolfcore.yml.',
      tunel_con_nombre: 'Tunel nazwany nie jest przenoszony: przywrócono szybki tunel.',
      php_ini: 'Niektóre ustawienia php.ini nie zostały zaimportowane.',
      xdebug: 'Ustawienie Xdebug było nieprawidłowe i zostało usunięte.',
      nginx_desactivado:
        'Reguły Nginx zostały zapisane, ale nie zastosowane: należy je sprawdzić w edytorze.',
      carpeta_no_existe: 'Folder nie istnieje na tym komputerze: należy go wskazać.',
      correo_sin_proveedor: 'Dostawca SMTP nie został zaimportowany: używany jest przechwytujący serwer poczty.',
      sitio_invalido: 'Strona jest nieprawidłowa.',
      dominio_invalido: 'Domena jest nieprawidłowa (musi kończyć się na .test).',
      ruta_protegida: 'Folder należy do systemu lub do WolfCore Dev: nie jest importowany.',
      dominio_en_uso: 'Inna strona na tym komputerze używa już tej domeny.',
      sitio_repetido: 'Strona powtarza się w profilu.',
      no_disponible: 'Ta wersja nie znajduje się już w katalogu.',
      huella_debil: 'Ta wersja nie ma silnego skrótu: należy ją zainstalować ręcznie w sekcji Wersje.',
      tope_descargas:
        'Nie pobrano, aby uniknąć zbyt wielu jednoczesnych pobrań: należy ją zainstalować w sekcji Wersje.',
      instancia_pendiente: 'Instancja pozostała oczekująca.',
      motor_no_soportado: 'Ten silnik nie jest importowany z profilu.',
      version_pendiente: 'Wersja silnika pozostała oczekująca.',
      danada: 'Pliki w profilu są uszkodzone.',
      bases_omitidas: 'Zaimportowano bez baz danych.',
      instancia_apagada: 'Nie udało się uruchomić instancji.',
      sin_copia_previa: 'Nie udało się utworzyć wcześniejszej migawki: baza danych nie została zastąpiona.',
      sin_base: 'Plik .env nie wskazuje na lokalną bazę danych.',
      base_no_resuelta: 'Nie udało się ustalić, do której instancji należy baza danych.',
      error_inesperado: 'Wystąpił błąd.',
    },
    avisos: {
      ca_reemplazada:
        'Poprzedni CA tego komputera nadal znajduje się w systemowym magazynie zaufanych certyfikatów i nie jest już używany. Można go stąd usunąć.',
      base_no_incluida: 'Nie dołączono bazy {base} ({instancia}).',
      sin_ca: 'Na tym komputerze nie ma CA: profil nie będzie go zawierać.',
      ca_no_importada: 'CA z profilu nie został zaimportowany: używany jest lokalny lub nowy.',
      certificados: 'Nie udało się przygotować certyfikatów: {detalle}',
      aplicar:
        'Zaimportowane strony nie zostały w pełni zastosowane (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Dostawca AI {id}: używa własnego adresu URL.',
      smtp: 'Dostawca SMTP {id}: host nie należy do znanego dostawcy lub brakuje użytkownika.',
      puerto: 'Port dla {id}: poza zakresem, przywrócono domyślny.',
      carpeta_vigilada: 'Monitorowany folder pochodzi z innego komputera.',
    },
  },
};
