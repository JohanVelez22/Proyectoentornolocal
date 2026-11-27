/**
 * Тексти інтерфейсу українською мовою (uk-UA). Ті самі ключі та сигнатури функцій, що й у es.ts.
 * Словник: служба, екземпляр, сайт, тунель, резервна копія, сповіщення; Doctor і
 * WolfCore Dev не перекладаються. Звертання на «Ви»; поза Git завжди «версія», не «гілка».
 */
import type { TextosParciales } from './es';

const prUk = new Intl.PluralRules('uk');
const plural = (n: number, one: string, few: string, many: string): string => {
  const cat = prUk.select(n);
  return `${n} ${cat === 'one' ? one : cat === 'few' ? few : many}`;
};

export const uk: TextosParciales = {
  app: {
    nombre: 'WolfCore Dev',
    version: 'Версія',
  },
  nav: {
    inicio: 'Головна',
    proyectos: 'Проєкти',
    agentes: 'Агенти',
    servicios: 'Служби',
    basesDeDatos: 'Бази даних',
    correo: 'Пошта',
    php: 'PHP',
    ia: 'ШІ',
    tuneles: 'Тунелі',
    contenedores: 'Контейнери',
    herramientas: 'Інструменти',
    doctor: 'Doctor',
    depuracion: 'Налагодження',
    registros: 'Журнали',
    ajustes: 'Налаштування',
    contraer: 'Згорнути меню',
    expandir: 'Розгорнути меню',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'увімкнена служба', 'увімкнені служби', 'увімкнених служб'),
    tuneles: (n: number) => plural(n, 'активний тунель', 'активні тунелі', 'активних тунелів'),
    cargando: 'Підключення до ядра…',
    conErrores: 'з помилками',
    sinConexion: "Немає з'єднання з ядром",
  },
  estado: {
    encendido: 'Увімкнено',
    apagado: 'Вимкнено',
    iniciando: 'Запуск…',
    error: 'Помилка',
    externo: 'Зовнішній',
    activo: 'Активний',
    aviso: 'Увага',
  },
  acciones: {
    encender: 'Увімкнути',
    apagar: 'Вимкнути',
    iniciarTodo: 'Запустити все',
    detenerTodo: 'Зупинити все',
    abrir: 'Відкрити',
    copiar: 'Копіювати',
    copiado: 'Скопійовано до буфера обміну',
    guardar: 'Зберегти',
    cerrar: 'Закрити',
    abrirCarpeta: 'Відкрити папку',
    instalar: 'Встановити',
    reintentar: 'Повторити',
    cancelar: 'Скасувати',
    borrar: 'Видалити',
    editar: 'Редагувати',
    duplicar: 'Дублювати',
    renovar: 'Поновити',
    masAcciones: 'Більше дій',
    actualizar: 'Оновити',
    quitar: 'Прибрати',
    reinstalar: 'Перевстановити',
  },
  errores: {
    titulo: 'Не вдалося виконати дію',
    arranque: 'Не вдалося прочитати стан середовища',
    desconocido: 'Сталася неочікувана помилка.',
    /** Деталі, які ядро надсилає як код у межах помилки. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'незакриті лапки',
      'sintaxis.tras_comillas': 'бракує пробілу або «;» після лапок',
      'sintaxis.punto_y_coma_inesperado': '«;» без директиви',
      'sintaxis.llave_inesperada': '«{» без директиви',
      'sintaxis.falta_punto_y_coma': 'бракує «;» у кінці директиви',
      'sintaxis.sobra_llave': 'зайва «}»',
      'sintaxis.falta_llave': 'бракує «}»',
    },
    codigos: {
      'git.cambios_locales':
        'У папці є незбережені зміни: збережіть їх (commit) або скасуйте перед отриманням змін. Нічого не змінено.',
      'git.divergencia':
        'Гілка розійшлася з віддаленою (є різні локальні та віддалені коміти): вирішіть це вручну. Нічого не змінено.',
      'git.sin_upstream':
        'Поточна гілка не відстежує жодну віддалену гілку: немає звідки отримати зміни.',
      'git.sin_rama': 'Репозиторій перебуває на окремому коміті (без гілки): нічого не змінено.',
      'git.no_repositorio': 'Ця папка не є репозиторієм git.',
      'git.destino_no_vacio': 'Цільова папка не порожня.',
      'git.destino_es_archivo': 'Цільовий шлях є файлом, а не папкою.',
      'git.no_encontrado': 'git не знайдено: спочатку встановіть його.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) не знайдено: спочатку встановіть його.',
      'git.plazo': 'Клонування перевищило ліміт {minutos} хв і було скасовано.',
      'git.token_invalido': 'Токен GitHub недійсний.',
      'git.url_con_credenciales':
        "URL не повинен містити ім'я користувача чи пароль: використовуйте токен окремо.",
      'servicios.desconocido': 'Невідома служба: {id}.',
      'servicios.no_instalado': '{nombre} не встановлено. Встановіть її в розділі «Служби».',
      'servicios.puerto_invalido': 'Порт має бути числом від 1024 до 65535.',
      'servicios.puerto_asignado': 'Порт {puerto} уже призначено для {otro}.',
      'servicios.puerto_ocupado':
        'Порт {puerto} використовується процесом {nombre} (PID {pid}). Закрийте його або виберіть інший порт.',
      'servicios.confirmacion_borrado': 'Щоб видалити дані {nombre}, введіть "{id}".',
      'servicios.ftp_no_disponible': 'FTP-сервер недоступний.',
      'sistema.sin_cliente_ftp':
        "На цьому комп'ютері немає пов'язаного FTP-клієнта. Встановіть його (наприклад, FileZilla) або скопіюйте адресу.",
      'servicios.mailpit_no_responde': 'Mailpit не відповідає. Запустіть його в розділі «Служби».',
      'servicios.iniciar_todo_fallos':
        '«Запустити все» не змогло увімкнути: {nombres}. Перевірте розділ «Служби» та його журнали.',
      'servicios.respaldo_fallo':
        '{nombre} не оновлено: не вдалося створити попередню резервну копію, тому нічого не змінено.',
      'servicios.espacio_insuficiente':
        'Недостатньо місця для копіювання даних: потрібно {necesarios} MB, а вільно {libres} MB.',
      'servicios.actualizacion_revertida':
        'Версія {version} не запустилася; {nombre} повернуто до {anterior}. Резервну копію збережено.',
      'servicios.restauracion_fallo':
        'Нова версія не запустилася, і не вдалося повернути дані {nombre}. Нічого не увімкнено: змінені дані містяться в {fallida}, а резервна копія — у {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} належить до іншої основної версії: створіть її як новий екземпляр.',
      'servicios.misma_version': '{id} уже використовує версію {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} заблоковано: під час оновлення не вдалося повернути її дані. Змінені дані містяться в {fallida}, а резервна копія — у {respaldo}. Вирішіть це в «Служби → Версії», перш ніж увімкнути її.',
      'servicios.datos_apartados':
        '{nombre} не має даних у своїй папці, але є відкладені дані після оновлення: порожня папка не створюється. Перевірте «Служби → Версії».',
      'servicios.puerto_reservado':
        'Порт {puerto} зарезервований системою ({desde}–{hasta}): виберіть інший.',
      'servicios.borrado_con_bloqueo':
        '{nombre} має заблокований екземпляр після оновлення: розблокуйте його перед видаленням даних.',
      'servicios.config_no_revertida':
        '{nombre} {version} не запустилася, і не вдалося повернути {anterior} у конфігурації. Виберіть {anterior} повторно в «Служби → Версії».',
      'servicios.puerto_revertido_apagada':
        '{nombre} не запустилася на новому порту; повернуто порт {anterior}, але там вона теж не запустилася: службу залишено вимкненою на порту {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} не запустилася на порту {nuevo}, і не вдалося повернути {anterior} у конфігурації: службу залишено вимкненою.',
      'instancias.id_invalido': 'Ідентифікатор екземпляра недійсний.',
      'instancias.no_existe': 'Екземпляр {id} не існує.',
      'instancias.existe': 'Екземпляр {id} уже існує.',
      'instancias.una_sola': '{nombre} підтримує лише один екземпляр.',
      'instancias.ultima': '{id} — єдиний екземпляр: його не можна прибрати.',
      'instancias.sin_puerto_libre': 'Не знайдено вільного порту для екземпляра.',
      'instancias.confirmacion': 'Щоб продовжити, введіть "{id}".',
      'instancias.sin_datos':
        '{id} не має даних у своїй папці: виберіть резервну копію для відновлення.',
      'instancias.respaldo_no_existe': 'Цієї резервної копії для {id} не існує.',
      'instancias.respaldo_en_uso':
        'Ця резервна копія потрібна екземпляру {id}, який заблоковано: спочатку вирішіть цю проблему.',
      'instancias.version_requerida':
        'Невідомо, до якої версії повернути {id}: виберіть установлену версію тієї самої основної версії.',
      'instalador.version_en_uso':
        'Не можна видалити {servicio} {version}: її використовує екземпляр {instancia}.',
      'limpieza.sin_confirmar': 'Бракує підтвердження для очищення версій.',
      'limpieza.seleccion_invalida': 'Вибір версій недійсний.',
      'limpieza.en_curso': 'Очищення версій уже виконується.',
      'limpieza.no_existe': '{servicio} {version} уже не встановлено.',
      'limpieza.en_uso': '{servicio} {version} почала використовуватися: її не прибрано.',
      'limpieza.ruta_insegura':
        'Папка {servicio} {version} небезпечна (символічне посилання або шлях поза bin): її не зачеплено.',
      'limpieza.version_bloqueada':
        '{servicio} {version} має файли, які використовуються або заблоковані: її не прибрано й не залишено частково видаленою.',
      'limpieza.otro_volumen':
        '{servicio} {version} розташована на іншому диску, ніж тимчасова папка даних: не вдалося перемістити її цілком, тому її не зачеплено.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} містить установлені вами пакети (npm, pip…): потрібно погодитися з їх втратою, щоб прибрати цю версію.',
      'limpieza.destino_ocupado':
        'У bin уже є папка {servicio} {version}: її не буде перезаписано. Приберіть її перед відновленням іншої.',
      'bd.encender_servicio': 'Увімкніть {nombre}, щоб керувати її базами даних.',
      'bd.sin_credenciales': 'Немає збережених облікових даних для {nombre}.',
      'bd.confirmacion_borrado': 'Щоб видалити базу даних {nombre}, введіть її точну назву.',
      'bd.usuario_privilegiado':
        'Користувач {usuario} є адміністратором або системною роллю: виберіть власного користувача для проєкту.',
      'bd.usuario_en_uso':
        'Інший проєкт уже використовує користувача {usuario}: його пароль не змінюється, щоб не залишити той проєкт без підключення. Нічого не створено.',
      'bd.rol_sin_login':
        'Користувач {usuario} існує, але не може входити (роль без LOGIN або правило доступу сервера). Нічого не змінено.',
      'bd.usuario_clave_distinta':
        'Користувач {usuario} уже існує з іншим паролем. Використовуйте його поточний пароль: він не змінюється, щоб не залишити інші проєкти без підключення.',
      'bd.mongosh_faltante':
        'Бракує mongosh: встановіть його в розділі «Служби», щоб керувати MongoDB.',
      'tuneles.sitio_no_encontrado': 'Проєкт не знайдено.',
      'tuneles.confirmacion_requerida':
        'Публікація {dominio} в інтернеті вимагає підтвердження в WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Тунель для {dominio} змінився після підтвердження: підтвердьте ще раз.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared не встановлено. Встановіть його в розділі «Служби».',
      'tuneles.proveedor_no_disponible': 'Провайдер тунелів {proveedor} недоступний.',
      'tuneles.cloudflare_sin_cuenta':
        'Спочатку підключіть свій обліковий запис Cloudflare у параметрах тунелю.',
      'tuneles.cloudflare_sin_credencial':
        'Цей тунель не має збережених облікових даних: створіть його знову в параметрах тунелю.',
      'tuneles.cloudflare_datos_invalidos':
        'Назва тунелю (малі літери, цифри та дефіси) або публічний домен недійсні.',
      'tuneles.cloudflare_conexion_en_curso': 'Підключення до Cloudflare уже триває.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare зареєстрував {registrado} замість {dominio}: домен не належить до авторизованої вами зони. Видаліть цей запис у панелі Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        "Тунель {nombre} має активні з'єднання (cloudflared вимагає -f для видалення). Закрийте його на всіх комп'ютерах, де він відкритий, і спробуйте ще раз, або скористайтеся «Забути лише тут».",
      'tuneles.nombre_en_uso': 'Тунель {nombre} уже використовується іншим сайтом.',
      'tuneles.dominio_en_uso': 'Домен {dominio} уже використовується іншим сайтом.',
      'tuneles.confirmacion_olvidar':
        'Щоб забути або перестворити тунель {nombre}, потрібне підтвердження.',
      'tuneles.cloudflare_fallo': 'cloudflared не зміг виконати операцію: {detalle}',
      'tuneles.credencial_no_protegida':
        'Не вдалося обмежити доступ до облікових даних лише поточним користувачем, тому їх не використано.',
      'tuneles.sin_cifrado': 'Системне шифрування недоступне: зберегти облікові дані неможливо.',
      'tuneles.token_invalido':
        'Токен недійсний: дозволено лише літери, цифри та _ . - (від 8 до 200 символів). Збережіть його ще раз у параметрах тунелю.',
      'tuneles.ngrok_no_instalado':
        "ngrok не встановлено на цьому комп'ютері. Встановіть його з ngrok.com і спробуйте ще раз.",
      'tuneles.ngrok_sin_token': 'Бракує токена ngrok: збережіть його в параметрах тунелю.',
      'tuneles.expose_sin_token': 'Бракує токена Expose: збережіть його в параметрах тунелю.',
      'tuneles.tailscale_no_instalado':
        "Tailscale не встановлено на цьому комп'ютері. WolfCore Dev не встановлює його: встановіть із tailscale.com.",
      'tuneles.tailscale_sin_sesion':
        'У Tailscale не виконано вхід: увійдіть у Tailscale і спробуйте ще раз.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale уже публікує ресурс на HTTPS-порту {puerto}. WolfCore Dev не перезаписує його: приберіть його в Tailscale і спробуйте ще раз.',
      'lan.sitio_no_encontrado': 'Сайт не знайдено.',
      'lan.confirmacion_requerida':
        'Надання доступу до {dominio} у локальній мережі вимагає підтвердження в WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} містить реальні дані: його не можна відкривати в локальній мережі навіть із підтвердженням. Використовуйте копію без даних клієнтів.',
      'lan.sin_red':
        'Немає підключеної локальної мережі (Wi-Fi або Ethernet). Підключіться до мережі та спробуйте ще раз.',
      'lan.ip_no_valida':
        'Адреса {ip} більше не належить до вашої локальної мережі. Відкрийте діалогове вікно повторно й підтвердьте ще раз.',
      'lan.requiere_https': '{dominio} перенаправляє на HTTPS: надайте доступ із параметром HTTPS.',
      'lan.sin_puertos':
        'Немає вільних портів у діапазоні 8100–8199 для локальної мережі (цей діапазон використовують спільні сайти та посилання CA). Припиніть спільний доступ до сайту або закрийте діалог CA і спробуйте ще раз.',
      'tuneles.expose_no_instalado':
        'Expose не встановлено. У Windows він працює лише з expose.phar: помістіть його в {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose не використовується для сайтів із реальними даними: його інспектор запитів видно в усій локальній мережі. Використовуйте іншого провайдера.',
      'tuneles.confirmacion_requerida_tailnet':
        'Надання доступу до {dominio} у вашій tailnet вимагає підтвердження в WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        "Не вдалося прочитати, що Tailscale уже публікує на цьому комп'ютері, тому нічого не відкрито, щоб не перезаписати налаштування. Перевірте, що Tailscale працює, і спробуйте ще раз.",
      'tuneles.tailscale_no_habilitado':
        'Serve або Funnel не ввімкнено у вашій tailnet. Увімкніть їх за посиланням {enlace} і спробуйте ще раз.',
      'tuneles.ngrok_desactualizado':
        'У вас застаріла версія ngrok, яка не підтримує можливості, потрібні WolfCore Dev. Оновіть її (ngrok update) і спробуйте ще раз.',
      'hosts.dominio_invalido': 'Указано недійсний домен.',
      'hosts.tiempo_agotado':
        'Не отримано відповіді на запит прав адміністратора за {segundos} с; файл hosts залишився без змін.',
      'https.sin_dominio': 'Для сертифіката потрібен щонайменше один домен.',
      'https.sin_autoridad':
        'Центр сертифікації WolfCore Dev не існує. Встановіть CA у розділі HTTPS перед випуском сертифікатів.',
      'herramientas.pid_invalido': 'PID недійсний.',
      'herramientas.pid_sistema': 'PID {pid} є системним процесом, і його не можна завершити.',
      'herramientas.proceso_propio':
        'Не можна завершити WolfCore Dev або процес, який його запустив.',
      'herramientas.proceso_inexistente': 'Процес {pid} уже не існує.',
      'herramientas.sin_editor':
        'Не знайдено жодного редактора коду. Встановіть редактор (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} не встановлено. Виберіть інший редактор у розділі «Налаштування».',
      'herramientas.editor_invalido': 'Цей редактор недійсний.',
      'herramientas.carpeta_sitio_inexistente': 'Папка проєкту не існує.',
      'herramientas.ruta_no_absoluta': 'Шлях має бути абсолютним.',
      'herramientas.sin_seleccion': 'Виберіть щонайменше один елемент.',
      'herramientas.dominio_invalido': 'Указано недійсний домен або IP.',
      'herramientas.demasiados_dominios':
        'Сертифікат підтримує щонайбільше {maximo} доменів або IP.',
      'buscar.consulta_invalida': 'Введіть пошуковий запит (до 500 символів).',
      'buscar.raiz_invalida': 'Папка або файл не існує чи є недійсним.',
      'buscar.regex_invalida': 'Регулярний вираз недійсний.',
      'buscar.regex_lenta':
        'Регулярний вираз виконується занадто довго: спростіть його або використайте звичайний текст.',
      'buscar.demasiadas': 'Уже виконується {maximo} пошуків: скасуйте один або зачекайте.',
      'terminal.no_abrio': 'Не вдалося відкрити термінал.',
      'terminal.no_instalada':
        '{nombre} не встановлено. Виберіть інший термінал у розділі «Налаштування».',
      'terminal.invalida': 'Цей термінал недійсний.',
      'terminal.powershell_restringido':
        "PowerShell працює в режимі обмеженої мови на цьому комп'ютері (політика організації або AppLocker): WolfCore Dev не може відкрити термінал. Відкрийте його самостійно в папці проєкту.",
      'proyectos.no_existe': 'Проєкт не існує.',
      'proyectos.no_confiado': 'Позначте "Я довіряю цьому репозиторію", щоб виконати рецепт.',
      'proyectos.receta_en_curso': 'Для цього проєкту вже виконується рецепт.',
      'proyectos.paso_no_omitible': 'Крок "Створити сайт" не можна пропустити.',
      'workspaces.no_existe': 'Цього workspace не існує.',
      'workspaces.invalido': 'Workspace недійсний: перевірте його назву та елементи.',
      'workspaces.captadores_exclusivos':
        'Два перехоплювачі пошти не можуть бути увімкнені одночасно: працює лише один.',
      'workspaces.elemento_fallo':
        'Не вдалося завершити операцію з {elemento}. Перевірте розділ «Служби» та його журнали.',
      'workspaces.base_no_responde':
        '{elemento} не запущено, оскільки база даних цього проєкту не відповідає.',
      'tareas.cron_invalida':
        'Вираз cron недійсний. Використовуйте 5 полів: хвилина, година, день місяця, місяць і день тижня (наприклад, 0 3 * * *).',
      'tareas.comando_invalido':
        'Команда заборонена. Використовуйте php, node, npm run або python із файлом проєкту, без коду в рядку (-r, -e, -c).',
      'tareas.invalida': 'Завдання недійсне: перевірте назву, розклад і команду.',
      'tareas.no_existe': 'Це завдання вже не існує.',
      'tareas.sin_confirmar': 'Підтвердьте команду завдання, щоб мати змогу його виконати.',
      'tareas.sitio_no_confiado':
        'Позначте «Я довіряю цьому репозиторію» у проєкті, щоб виконувати його завдання.',
      'tareas.receta_cambio':
        'Рецепт проєкту змінився відтоді, як ви йому довірили: перевірте його й знову позначте «Я довіряю цьому репозиторію».',
      'tareas.aislado':
        'Це тестова папка даних (WOLFCORE_DATOS): дозвольте заплановані завдання, щоб їх виконувати.',
      'tareas.carpeta': 'Папка проєкту не існує: завдання неможливо виконати.',
      'tareas.en_curso': 'Завдання вже виконується.',
      'tareas.demasiadas': 'У цьому проєкті занадто багато завдань (максимум {maximo}).',
      'cli.no_autorizado':
        'Команду CLI не авторизовано: виконайте її ще раз, коли відкрито програму WolfCore Dev.',
      'cli.orden_desconocida': 'WolfCore Dev не знає такої команди CLI.',
      'cli.argumentos_invalidos': 'Аргументи команди недійсні.',
      'cli.solicitud_grande': 'Запит занадто великий (максимум {maximo} байтів).',
      'cli.formato_no_admitido': 'Запит має формат, який не підтримується CLI.',
      'cli.plazo':
        'Команда виконувалася занадто довго: можливо, вона ще триває. Перевірте стан у WolfCore Dev.',
      'cli.ocupado': 'WolfCore Dev обробляє занадто багато команд CLI: зачекайте мить.',
      'cli.requiere_confirmacion':
        'Ця команда публікує або змінює дані та вимагає підтвердження (--si) для {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} містить реальні дані: також підтвердьте параметром реальних даних команди (доменом сайту).',
      'cli.requiere_confirmacion_global':
        'Зміна версії PHP для всіх терміналів вимагає підтвердження (--si).',
      'cli.confirmacion_rechazada':
        'Підтвердження у вікні WolfCore Dev було відхилено або недоступне: нічого не зроблено.',
      'cli.confirmacion_vencida':
        'Ніхто не підтвердив дію у вікні WolfCore Dev вчасно: нічого не зроблено.',
      'cli.tunel_fallo': 'Не вдалося відкрити тунель. Перевірте його журнал у WolfCore Dev.',
      'cli.inicio_fallo': 'Не вдалося запустити все запитане. Перевірте журнали в WolfCore Dev.',
      'cli.parada_fallo': 'Не вдалося зупинити все запитане. Перевірте журнали в WolfCore Dev.',
      'cli.interno': 'Внутрішня помилка сервера CLI.',
      'cli.proveedor_distinto':
        'Сайт використовує іншого провайдера тунелів ({proveedor}). Перевірте й підтвердьте ще раз.',
      'cli.sitio_no_encontrado': 'Сайт {sitio} не існує.',
      'cli.carpeta_invalida': 'Папка не існує, є системною або є папкою даних WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        "Ця папка не належить до жодного сайту WolfCore Dev: спочатку прив'яжіть її.",
      'cli.ya_vinculada': 'Ця папка вже є сайтом {sitio}.',
      'cli.tipo_no_soportado': 'Проєкти типу {tipo} створюються через інтерфейс WolfCore Dev.',
      'cli.sitio_sin_php': 'Сайт {sitio} не використовує PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} не встановлено. Встановіть її в розділі «Служби».',
      'cli.fuente_no_existe': 'Цього журналу ще не існує.',
      'cli.token_no_protegido':
        'Не вдалося обмежити доступ до файлу токена лише поточним користувачем: CLI не активовано.',
      'cli.carpeta_ajena':
        'Папка run/ у папці даних належить іншому користувачу: CLI не активовано.',
      'cli.ruta_invalida': 'Шлях до WolfCore Dev містить символи, які wolf.cmd не підтримує.',
      'cli.path_aislado':
        'Із тестовою папкою даних (WOLFCORE_DATOS) змінна PATH користувача не змінюється.',
      'cli.sin_cliente':
        'Ця версія WolfCore Dev не містить клієнта wolf (його потрібно скомпілювати).',
      'cli.demasiados_dialogos':
        'Занадто багато підтверджень за останню хвилину: зачекайте мить і спробуйте ще раз.',
      'cli.error': 'Не вдалося виконати команду: {detalle}',
      'proyectos.carpeta_no_vacia':
        'Папка проєкту вже містить файли: виберіть іншу або очистьте її.',
      'secretos.sin_cifrado':
        'Системне шифрування недоступне: неможливо зберегти пароль власного користувача. Нічого не змінено.',
      'proyectos.clave_bd_falta':
        'Бракує збереженого пароля користувача {usuario}: нічого не записано. У менеджері .env функція "Використовувати власного користувача" створює новий пароль.',
      'env.archivo_grande': 'Файл змінних занадто великий (максимум {maximo}).',
      'env.no_regular': 'Файл .env не є звичайним файлом: його не можна читати чи змінювати.',
      'env.clave_inexistente': 'Змінна {clave} не існує.',
      'env.cambio_invalido': 'Одна зі змін у .env недійсна.',
      'env.variable_invalida': 'Зміна змінної {clave} недійсна.',
      'env.solo_lectura': 'Змінна {clave} займає кілька рядків: відредагуйте її вручну у файлі.',
      'env.usuario_compartido':
        'Базу даних {base} також використовує проєкт {proyecto}: підтвердьте, чи хочете ви спільно використовувати його користувача.',
      'env.cambio_externo':
        'Файл .env змінився після показу попереднього перегляду: перевірте його знову перед збереженням.',
      'env.sin_confirmar': 'Підтвердьте, що хочете зберегти зміни в .env.',
      'env.versionado':
        'Git уже відстежує .env цього проєкту: наступний коміт завантажить його значення. Підтвердьте окремо, щоб продовжити.',
      'env.versionado_desconocido':
        'Не вдалося перевірити, чи відстежує git файл .env цього проєкту: підтвердьте окремо, щоб продовжити.',
      'env.copia_invalida': 'Копія .env недійсна або більше не існує.',
      'env.sin_base': 'Файл .env цього проєкту не містить підключення до бази даних.',
      'env.base_no_resuelta':
        'База даних цього проєкту не належить до локального сервера WolfCore Dev: нічого не змінено.',
      'env.motor_no_soportado':
        'Наразі "Використовувати власного користувача" працює з MySQL і MariaDB.',
      'env.ya_usa_usuario_propio': 'Цей проєкт уже використовує власного користувача.',
      'plantillas.id_invalido': 'Ідентифікатор шаблону недійсний.',
      'plantillas.no_existe': 'Шаблон не існує.',
      'plantillas.danada':
        'Шаблон пошкоджено або змінено: його не буде використано. Видаліть його й збережіть ще раз.',
      'plantillas.demasiado_grande':
        'Проєкт містить занадто багато файлів або має занадто великий розмір для збереження як шаблон (до {maximo} файлів). Виключіть великі папки.',
      'plantillas.demasiado_pesada':
        'Проєкт має занадто великий розмір для збереження як шаблон (до {maximo}). Виключіть великі папки.',
      'plantillas.exclusion_invalida':
        'Одне з виключень недійсне (використовуйте назви або відносні шляхи без "..").',
      'plantillas.nombre_invalido': 'Назва шаблону недійсна (від 1 до 60 символів).',
      'plantillas.esquema_fallo':
        'Не вдалося прочитати схему бази даних проєкту: перевірте, чи увімкнена її служба.',
      'plantillas.base_no_resuelta':
        'Неможливо зберегти шаблон: сервер бази даних віддалений або жодна з локальних служб не використовує цей порт.',
      'plantillas.sin_generador_base':
        'Цей тип проєкту не має базового генератора: шаблон повинен містити файли проєкту.',
      'plantillas.exclusiones_nuevas':
        'Шаблон містить файл, який тепер виключено ({archivo}): збережіть шаблон повторно з проєкту або видаліть його.',
      'plantillas.motor_distinto':
        'Схема шаблону створена для MySQL, а вибраний сервер — MariaDB (або навпаки): можливі відмінності. Підтвердьте, що хочете продовжити.',
      'bd.sql_no_permitido':
        'Схема містить інструкцію, яка не стосується структури, тому нічого не виконано: {sentencia}',
      'bd.extension_no_permitida':
        'Схема вимагає розширення {nombre}, якого немає у дозволеному списку: нічого не відновлено.',
      'bd.esquema_fallo': 'Не вдалося відновити повну схему: нічого не залишено наполовину.',
      'bd.datos_no_permitidos':
        'Дамп даних містить елементи, що не є даними (приймаються лише INSERT, LOCK TABLES і SET): нічого не імпортовано.',
      'bd.datos_fallo':
        'Не вдалося імпортувати дані: базу залишено без змін, без часткового запису.',
      'perfiles.destino_invalido': 'Виберіть, куди зберегти профіль (файл .wolfperfil).',
      'perfiles.frase_debil': 'Парольна фраза CA має містити щонайменше {minimo} символів.',
      'perfiles.frase_incorrecta': 'Неправильна парольна фраза: нічого не імпортовано.',
      'perfiles.certificados_sin_ca':
        'Сертифікати сайтів переносяться лише разом із зашифрованим CA: додайте CA з парольною фразою.',
      'perfiles.no_existe': 'Файл профілю не існує.',
      'perfiles.danado': 'Профіль пошкоджено або змінено: нічого не імпортовано.',
      'perfiles.demasiado_grande': 'Профіль занадто великий (до {maximo}).',
      'perfiles.version_no_soportada':
        'Профіль створено новішою версією WolfCore Dev (формат {version}): оновіть застосунок, щоб імпортувати його.',
      'perfiles.sin_confirmar': 'Підтвердьте, що Ви хочете імпортувати профіль.',
      'perfiles.vista_previa_vieja':
        'Папка даних або профіль змінилися після попереднього перегляду: перевірте ще раз.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS не є дійсною папкою даних: шлях має бути абсолютним, не системним і відмінним від основної папки.',
      'perfiles.confirmar_reemplazar_ca':
        'Профіль містить CA, а на цьому комп’ютері вже є власний: порівняйте відбиток і окремо підтвердьте заміну (лише якщо це Ваш власний CA).',
      'herramientas.imagen_tipo':
        'Цей файл не є підтримуваним зображенням (PNG, JPG, WebP, GIF, BMP або ICO), або його вміст не відповідає типу.',
      'herramientas.imagen_grande': 'Зображення занадто велике (до {maximo}).',
      'herramientas.imagen_dimensiones':
        'Зображення занадто велике ({ancho}×{alto} px; до {maximo} px на сторону) і не відкривається з міркувань безпеки.',
      'herramientas.zip_sin_archivos': 'Немає файлів для стиснення (посилання не відстежуються).',
      'herramientas.zip_demasiados': 'Забагато файлів для стиснення (до {maximo}).',
      'herramientas.zip_grande': 'Обсяг даних для стиснення занадто великий (до {maximo}).',
      'herramientas.pdf_invalido': 'Файл не є PDF, який можна оптимізувати.',
      'herramientas.pdf_grande': 'PDF занадто великий (до {maximo}).',
      'herramientas.pdf_cifrado': 'PDF захищено паролем, тому його не можна оптимізувати.',
      'herramientas.pdf_plazo': 'Оброблення PDF тривало понад {segundos} с і було скасовано.',
      'herramientas.salida_ocupada': 'Не вдалося знайти вільну назву для нового файлу.',
      'conversor.formato': 'Це перетворення недоступне.',
      'conversor.archivo_invalido':
        'Файл пошкоджено або він не відповідає типу, зазначеному в розширенні.',
      'conversor.archivo_grande': 'Файл занадто великий (до {maximo}).',
      'conversor.archivo_peligroso':
        'Файл схожий на ZIP-бомбу або пошкоджений (забагато вмісту, XML-сутності або неприпустимі назви) і не відкривається з міркувань безпеки.',
      'conversor.limite_filas': 'У таблиці забагато рядків (до {maximo}).',
      'conversor.limite_columnas': 'У таблиці забагато стовпців (до {maximo}).',
      'conversor.limite_paginas': 'У PDF забагато сторінок (до {maximo}).',
      'conversor.pdf_cifrado': 'PDF захищено паролем, тому його не можна перетворити.',
      'conversor.plazo': 'Перетворення тривало понад {segundos} с і було скасовано.',
      'conversor.cancelado': 'Перетворення скасовано.',
      'conversor.libreoffice_ausente':
        'Для цього перетворення потрібен LibreOffice, який не встановлено на цьому комп’ютері (WolfCore Dev не встановлює його).',
      'conversor.libreoffice_fallo': 'LibreOffice не вдалося перетворити документ.',
      'conversor.limite_celdas': 'У таблиці забагато клітинок (до {maximo}).',
      'conversor.memoria':
        'Файл потребує занадто багато пам’яті (понад {maximo}) і перетворення скасовано.',
      'conversor.pdf_no_disponible': 'Друк у PDF наразі недоступний.',
      'herramientas.imagen_pixeles':
        'Зображення містить забагато пікселів загалом ({ancho}×{alto} px; до {maximo}) і не відкривається з міркувань безпеки.',
      'herramientas.zip_cambio': 'Файл змінився під час стиснення: спробуйте ще раз.',
      'herramientas.pdf_demasiado_complejo':
        'PDF занадто складний (перевищує допустиме використання пам’яті) і його скасовано.',
      'herramientas.salida_denegada':
        'Неможливо записати в це розташування: перевірте дозволи або наявність папки.',
      'herramientas.fuera_de_la_ca':
        'CA WolfCore Dev підписує лише домени .test, localhost і локальні адреси: {dominio} не можна додати.',
      'perfiles.frase_requerida':
        'Введіть парольну фразу профілю, щоб імпортувати його бази або CA (або імпортуйте без баз).',
      'perfiles.sin_espacio':
        'Недостатньо вільного місця для імпорту профілю: потрібно {necesarios}, доступно {libres}.',
      'perfiles.ca_sin_restricciones':
        'Цей CA може підписувати будь-який вебсайт: імпортуйте його лише якщо це Ваш власний CA, і порівняйте відбиток. Підтвердьте окремо, щоб продовжити.',
      'perfiles.ca_restricciones_ajenas':
        'CA профілю має обмеження імен, які не належать WolfCore Dev: імпорт скасовано.',
      'perfiles.instantanea_fallo':
        'Не вдалося зберегти попередню копію середовища: нічого не змінено. Перевірте місце на диску та дозволи папки даних.',
      'perfiles.en_curso': 'Імпорт профілю вже виконується: дочекайтеся завершення.',
      'importar.origen_apagado':
        'Не вдалося підключитися до сервера баз даних іншої програми: запустіть його в тій програмі та спробуйте ще раз. Сайти імпортовано.',
      'importar.origen_no_local': 'Сервер-джерело має бути на цьому комп’ютері (127.0.0.1).',
      'importar.origen_rechazado': 'Сервер-джерело відхилив користувача або пароль.',
      'importar.origen_version':
        'Версію сервера-джерела не можна імпортувати за допомогою того, що встановлено в WolfCore Dev.',
      'importar.volcado_enorme':
        'Дані бази важать понад {maximo} MB: вони не імпортуються за один раз.',
      'importar.motor_no_soportado': 'З інших програм імпортуються лише бази MySQL і MariaDB.',
      'importar.ruta_fuera':
        'Відхилено папку або файл, що вказує поза межі встановлення або на системну папку.',
      'importar.carpeta_invalida': 'Відхилено папку, яка більше не існує або не є папкою.',
      'importar.archivo_grande': 'Файл конфігурації важить понад {maximo} KB і не був прочитаний.',
      'importar.archivo_ilegible':
        'Файл конфігурації не є текстовим або його не вдалося прочитати.',
      'importar.demasiados': 'Забагато сайтів або файлів конфігурації: прочитано лише перші.',
      'importar.candidato_desconocido':
        'Цей сайт більше не відображається в початковій програмі: виконайте пошук ще раз.',
      'importar.ya_vinculado': 'Ця папка вже є сайтом WolfCore Dev.',
      'importar.dominio_existe':
        'Вже існує сайт із доменом {dominio}: змініть його перед імпортом.',
      'importar.sin_php':
        'Цьому сайту потрібен PHP, але жодна версія не встановлена: встановіть її в розділі Служби.',
      'importar.base_existe':
        'База {nombre} вже існує в місці призначення і не була змінена. Підтвердьте заміну для імпорту (попередньо буде створено копію).',
      'importar.base_fallo':
        'Не вдалося імпортувати базу {nombre}: її залишено як було, без часткових змін.',
      'importar.sitio_fallo': 'Не вдалося створити сайт.',
      'importar.origen_invalido': 'Дані сервера-джерела недійсні (користувач, пароль або порт).',
      'importar.sin_seleccion': 'Виберіть щонайменше один сайт для імпорту.',
      'importar.en_curso': 'Імпорт вже виконується: дочекайтеся завершення.',
      'importar.cancelado': 'Імпорт скасовано: об’єкти, що імпортувалися, залишено без змін.',
      'importar.origen_estancado':
        'Сервер іншої програми перестав відповідати під час створення дампу: базу не імпортовано.',
      'importar.sin_espacio':
        'Недостатньо вільного місця для імпорту бази: потрібно приблизно {necesarios} MB, доступно {libres} MB.',
      'importar.origen_fallo': 'Не вдалося створити дамп бази іншої програми.',
      'importar.clave_no_ascii':
        'Пароль містить акценти або символи, які не можна передати до дампу: використовуйте пароль лише з символів ASCII.',
      'plantillas.sin_esquema': 'Шаблон не містить схеми бази даних.',
      'proyectos.carpeta_invalida': 'Папка проєкту недійсна.',
      'proyectos.nombre_invalido':
        'Назва проєкту може містити лише малі літери, цифри та дефіси (до 40).',
      'proyectos.argumento_invalido': 'Дані проєкту недійсні (поле: {campo}).',
      'proyectos.base_existe': 'База {nombre} вже існує: виберіть іншу назву.',
      'proyectos.dominio_existe': 'Вже існує сайт із доменом {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Ця папка належить проєкту {dominio} або міститься в ньому: виберіть іншу.',
      'proyectos.sin_python': 'Python не встановлено: встановіть його в розділі Служби.',
      'proyectos.venv_ajeno':
        'Проєкт містить власний .venv, а WolfCore Dev не запускає Python зі стороннього репозиторію: видаліть його та створіть середовище заново.',
      'proyectos.paso_base_no_omitible':
        'Крок "Створити базу даних" для нового проєкту не можна пропустити.',
      'proyectos.sin_php': 'PHP не встановлено: встановіть його в розділі Служби.',
      'proyectos.php_no_instalado':
        'PHP {version} не встановлено: встановіть його в розділі Служби.',
      'proyectos.python_no_instalado':
        'Python {version} не встановлено: встановіть його в розділі Служби.',
      'mcp.token_invalido': 'Токен MCP-сервера недійсний.',
      'mcp.solicitud_cancelada': 'Клієнт MCP скасував запит: дію не виконано.',
      'doctor.puerto_ocupado':
        'Порт {puerto} служби {servicio} зайнятий іншою програмою ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) займає порт {puerto} служби {servicio}.',
      'doctor.puerto_http_sys':
        'Служба Windows ({programa}) займає порт {puerto} служби {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} займає порт {puerto} служби {servicio}. Закрийте її або змініть порт WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} займає порт {puerto} служби {servicio}.',
      'doctor.puerto_skype': '{programa} займає порт {puerto} служби {servicio}.',
      'doctor.puerto_reservado':
        'Порт {puerto} служби {servicio} перебуває в діапазоні, зарезервованому Windows ({desde}-{hasta}: Hyper-V, WSL або Docker).',
      'doctor.ca_por_vencer':
        'Термін дії центру сертифікації WolfCore Dev спливає через {dias} дн.',
      'doctor.ca_vencida': 'Термін дії центру сертифікації WolfCore Dev сплив.',
      'doctor.certificado_por_vencer': 'Термін дії сертифіката {dominio} спливає через {dias} дн.',
      'doctor.certificado_vencido': 'Термін дії сертифіката {dominio} сплив.',
      'doctor.hosts_ilegible': 'Не вдалося прочитати файл hosts.',
      'doctor.hosts_utf16': 'Файл hosts збережено в UTF-16: Windows може не читати його записи.',
      'doctor.hosts_bloque_duplicado':
        'Файл hosts містить {bloques} блоків WolfCore Dev; має бути один.',
      'doctor.hosts_bloque_sin_cierre':
        'Блок WolfCore Dev у файлі hosts залишився без закривальної позначки.',
      'doctor.hosts_dominios_faltantes': 'У файлі hosts бракує {cantidad} доменів Ваших сайтів.',
      'doctor.hosts_solo_lectura':
        'Файл hosts має атрибут «лише для читання» (часто встановлюється антивірусом). WolfCore Dev все одно може записати його з правами адміністратора.',
      'doctor.path_duplicados':
        'У PATH користувача є {cantidad} повторюваних записів WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Інша папка з {programa} ({origen}) стоїть перед WolfCore Dev у PATH: у терміналах використовуватиметься вона.',
      'doctor.vcredist_ausente':
        'Бракує Microsoft Visual C++ 2015-2022 (x64): PHP та інші служби не запустяться без нього.',
      'doctor.enlazador_msvc_ausente':
        'Rust встановлено, але бракує інструментів C++ із Visual Studio Build Tools (компонувальника MSVC): cargo не зможе скомпілювати програми.',
      'doctor.antivirus_sin_exclusion':
        'Антивірус перевіряє папку даних WolfCore Dev: PHP і служби можуть запускатися повільно.',
      'doctor.firewall_reglas':
        'Windows дозволяє вхідний доступ із мережі для {cantidad} правил програм WolfCore Dev (nginx, PHP або баз даних) у профілях {perfiles}: ці програми відкриті для мережі.',
      'doctor.firewall_no_comprobado':
        'Не вдалося перевірити брандмауер Windows (можуть знадобитися права адміністратора).',
      'doctor.firewall_reglas_ajenas':
        'Є {cantidad} вхідних правил інших програм (FlyEnv, Laragon, XAMPP тощо) з nginx, PHP або базами даних у профілях {perfiles}. Вони не належать WolfCore Dev: лише відображаються, ніколи не видаляються звідси.',
      'doctor.servicio_en_error': 'Служба {servicio} у стані помилки.',
      'doctor.revision_fallida': 'Не вдалося завершити перевірку {revision}.',
      'doctor.confirmacion_requerida': 'Підтвердьте виправлення перед його застосуванням.',
      'doctor.hallazgo_desconocido': 'Цього виявлення більше немає: виконайте перевірку ще раз.',
      'doctor.solo_informa':
        'Для цього виявлення немає автоматичного виправлення: дотримуйтеся інструкцій.',
      'doctor.reparacion_fallida': 'Не вдалося застосувати виправлення.',
      'doctor.reparacion_cancelada': 'Запит прав адміністратора скасовано: нічого не змінено.',
      'doctor.reparacion_denegada': 'Windows або антивірус заборонили доступ: нічого не змінено.',
      'doctor.ya_resuelto': 'Проблеми вже немає: зміни не знадобилися.',
      'doctor.ca_vieja_sin_quitar':
        'Новий центр сертифікації вже використовується, але попередній не вдалося видалити зі сховища Windows. Ви можете видалити його в розділі HTTPS.',
      'doctor.sin_puerto_libre': 'Не знайдено вільного порту для перенесення служби.',
      'doctor.ca_vuelta_atras_incompleta':
        'Не вдалося застосувати новий центр сертифікації, і відкат завершився неповністю. Перевірте розділ HTTPS; копія з датою зберігається в etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox не довіряє центру сертифікації WolfCore Dev у {cantidad} профілях (він використовує власне сховище).',
      'confianza.sin_ca': 'Центру сертифікації ще немає: створіть його в розділі HTTPS.',
      'confianza.sin_raices':
        'Не знайдено кореневих сертифікатів довіри для Python (ні certifi, ні Windows): нічого не змінено.',
      'confianza.node_variable_ajena':
        'У Вас уже є власна змінна NODE_EXTRA_CA_CERTS: WolfCore Dev не замінює її.',
      'confianza.variable_fallida': 'Не вдалося змінити змінну користувача.',
      'firefox.abierto': 'Firefox відкритий: закрийте його та спробуйте ще раз.',
      'firefox.error': 'Не вдалося змінити user.js цього профілю; його залишено без змін.',
      'firefox.fuera':
        'Є профілі поза папкою Firefox: увімкніть їх у розділі «Довіра до CA» з окремим підтвердженням.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS більше не вказує на центр сертифікації WolfCore Dev (змінено вручну): не видалено.',
      'ia.clave_invalida': 'Провайдер відхилив ключ: перевірте його або створіть новий.',
      'ia.sin_saldo': 'На обліковому записі провайдера немає доступного балансу або квоти.',
      'ia.limite': 'Провайдер обмежив запити: зачекайте трохи та спробуйте ще раз.',
      'ia.region': 'Провайдер не надає послуги у Вашій країні чи регіоні.',
      'ia.sin_red': 'Не вдалося підключитися до провайдера: перевірте мережу або базовий URL.',
      'ia.url_invalida':
        'Базовий URL недійсний: використовуйте https:// (або http:// лише для 127.0.0.1 чи [::1]), без користувача й пароля.',
      'ia.plazo': 'Провайдер не відповів за {segundos} с.',
      'ia.respuesta_rara': 'Провайдер повернув неочікувану відповідь.',
      'ia.cancelado': 'Запит до провайдера скасовано.',
      'ia.sin_clave': 'Цьому провайдеру потрібен ключ: спочатку збережіть його.',
      'ia.clave_mal_formada': 'Ключ має недійсний формат (без пробілів і переносів рядків).',
      'ia.modelo_invalido': 'Назва моделі недійсна.',
      'ia.modelo_no_disponible': 'Модель не існує або Ваш обліковий запис не має до неї доступу.',
      'ia.proveedor_invalido': 'Конфігурація провайдера недійсна.',
      'ia.env_conflicto':
        'У .env уже визначено {claves} з іншим значенням: підтвердьте, чи хочете замінити його.',
      'ia.env_sin_confirmar':
        'Підтвердьте, що хочете записати ключ у .env (він зберігається у відкритому тексті).',
      'ia.env_versionado':
        'Git вже відстежує .env цього проєкту: наступний commit завантажить ключ, навіть якщо файл у .gitignore. Видаліть його з індексу командою git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Не вдалося перевірити, чи відстежує git .env цього проєкту: окремо підтвердьте запис ключа.',
      'ia.proveedor_no_existe': 'Провайдер ШІ більше не існує.',
      'ia.url_cambia_con_clave':
        'Провайдер має збережений ключ: підтвердьте, що хочете надсилати його на новий URL.',
      'ia.mensaje_sin_confirmar':
        'Підтвердьте надсилання тестового повідомлення (витрачає токени Вашого облікового запису).',
      'ia.clave_ilegible':
        'Не вдалося прочитати збережений ключ провайдера: видаліть його та збережіть заново.',
      'ia.argumento_invalido': 'Недійсні дані ({campo}).',
      'correo.auth': 'Провайдер відхилив користувача або пароль.',
      'correo.conexion': 'Не вдалося підключитися до SMTP-сервера: перевірте хост і порт.',
      'correo.tls':
        'Не вдалося встановити зашифроване й дійсне з’єднання з сервером (сертифікат, ім’я або STARTTLS). Нічого не надіслано.',
      'correo.rechazado':
        'Сервер відхилив повідомлення або адресу. Перевірте відправника: багато провайдерів приймають лише підтвердженого відправника або домен.',
      'correo.plazo': 'Сервер не відповів вчасно (20 с).',
      'correo.host_invalido':
        'SMTP-сервер має бути іменем хоста або IP-адресою без схеми, порту чи шляху.',
      'correo.host_local':
        'Цей сервер вказує на цей комп’ютер або локальну мережу: підтвердьте його використання.',
      'correo.destinatario_invalido': 'Адреса отримувача недійсна.',
      'correo.proveedor_invalido': 'Дані провайдера недійсні.',
      'correo.proveedor_no_existe': 'Поштовий провайдер більше не існує.',
      'correo.sin_clave': 'У провайдера немає збереженого ключа.',
      'correo.clave_ilegible':
        'Не вдалося прочитати збережений ключ провайдера: видаліть його та збережіть заново.',
      'correo.cambia_con_clave':
        'У провайдера є збережений ключ: підтвердьте, що хочете надсилати його на новий сервер.',
      'correo.env_sin_confirmar': 'Підтвердьте, що хочете записати поштові змінні в .env.',
      'correo.ocupado': 'Тестове надсилання вже виконується.',
      'correo.limite': 'Зачекайте {segundos} с перед наступним тестовим надсиланням.',
      'correo.clave_mal_formada':
        'Ключ має недійсний формат: лише друковані символи, без переносів рядків, до 4096 символів.',
      'correo.argumento_invalido': 'Недійсні дані ({campo}).',
      'agentes.no_existe': 'Цей агент не підтримується.',
      'agentes.sin_confirmar': 'Підтвердьте дію в діалоговому вікні перед продовженням.',
      'agentes.no_instalable':
        'Цей агент не встановлюється з WolfCore Dev: дотримуйтеся офіційної інструкції ({guia}).',
      'agentes.sin_node': 'Встановіть Node у розділі Служби, щоб мати змогу встановити агента.',
      'agentes.node_antiguo':
        '{agente} потребує Node {requerida} або новішої версії, а поточна — {actual}. Встановіть новішу версію Node у розділі Служби.',
      'agentes.node_version_desconocida':
        'Не вдалося визначити версію Node, а {agente} потребує Node {requerida} або новішої. Перевірте Node у розділі Служби.',
      'instalador.zip_demasiado_grande':
        'Завантажений пакунок занадто великий або містить забагато файлів: встановлення скасовано.',
      'rust.rustup_init_fallo': 'rustup-init завершився з помилкою (код {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Не вдалося встановити Rust {version} (код {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Не вдалося видалити Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Не вдалося завантажити rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Не вдалося встановити агента: {detalle}',
      'agentes.no_instalado': '{agente} не встановлено.',
      'agentes.mcp_no_soportado':
        '{agente} не документує спосіб отримання токена зі змінної середовища: MCP для нього не реєструється.',
      'agentes.config_ilegible':
        'Не вдалося розібрати {archivo}; файл не змінено. Перевірте його вручну.',
      'agentes.config_en_uso':
        '{archivo} змінився, поки WolfCore Dev редагував його: закрийте агента та спробуйте ще раз. Файл не змінено.',
      'agentes.proveedor_incompatible': '{agente} не може використовувати цього провайдера ШІ.',
      'agentes.sin_cambios_preparados': 'Немає індексованих змін (git add) для опису.',
      'agentes.argumento_invalido': 'Недійсні дані ({campo}).',
      'git.commit_fallo': 'Не вдалося виконати commit: {detalle}',
      'git.mensaje_invalido': 'Повідомлення commit порожнє або недійсне.',
      'php.rama_no_instalada': 'PHP {rama} не встановлено.',
      'php.argumento_invalido': 'Недійсні дані ({campo}).',
      'php.valor_invalido': 'Значення {clave} недійсне.',
      'php.ini_invalido': 'PHP не запускається з цим php.ini; нічого не збережено. Вивід: {salida}',
      'php.no_arranco':
        'PHP {rama} не запустився після змін; відновлено попередню конфігурацію, і він працює як раніше.',
      'php.caido_tras_restaurar':
        'PHP {rama} не запустився; попередню конфігурацію відновлено, але він досі не відповідає. Перевірте Служби та журнали PHP.',
      'php.respaldo_no_existe': 'Цієї резервної копії php.ini не існує.',
      'php.extension_no_existe': 'Розширення {nombre} відсутнє в папці ext цієї версії.',
      'php.extension_no_catalogo': 'Розширення {nombre} відсутнє в каталозі для цієї версії.',
      'php.variante_desconocida': 'Не вдалося визначити, як скомпільовано цей PHP.',
      'php.sin_variante': 'У каталозі немає {nombre} для збірки {variante}.',
      'php.huella_distinta':
        'Завантаження не збігається з опублікованим відбитком; нічого не встановлено.',
      'php.descarga_fallida': 'Не вдалося завантажити розширення: {detalle}',
      'php.extension_en_uso':
        'DLL-файл {nombre} зараз використовується. Зупиніть PHP {rama} і спробуйте ще раз.',
      'php.extension_sin_dll':
        'Не вдалося замінити DLL {nombre}, і папка ext PHP {rama} залишилася без неї. Зупиніть PHP {rama} і спробуйте ще раз: попередня версія повернеться під час запуску.',
      'php.sitio_sin_php': 'Цей сайт не використовує PHP.',
      'php.sitio_no_arranco':
        'Власний PHP сайту {sitio} не відповів після змін; повернено попередні налаштування.',
      'php.sin_puertos_sitio': 'Не залишилося вільних портів для власних PHP-процесів сайтів.',
      'xdebug.launch_invalido':
        'Не вдалося розібрати .vscode/launch.json проєкту; нічого не змінено.',
      'xdebug.launch_no_seguro':
        'Папка .vscode або її launch.json є посиланням чи іншим об’єктом: запис туди заборонено.',
      'xdebug.sin_configurar': 'Налаштуйте Xdebug на сайті перед створенням launch.json.',
      'nginx.sitio_no_existe': 'Цей сайт більше не існує.',
      'nginx.texto_invalido': 'Текст vhost занадто довгий, порожній або містить керівні символи.',
      'nginx.sintaxis': 'Рядок {linea}: {detalle}. Нічого не змінено.',
      'nginx.directiva_prohibida':
        'Рядок {linea}: «{directiva}» не дозволяється у vhost сайту (може вплинути на інші сайти або файли поза проєктом). Нічого не змінено.',
      'nginx.ruta_fuera':
        'Рядок {linea}: «{directiva}» вказує поза межі папки проєкту або його журналів і сертифікатів. Нічого не змінено.',
      'nginx.fuera_de_server':
        'Рядок {linea}: повний vhost може містити лише блоки «server»; «{directiva}» знаходиться поза ними. Нічого не змінено.',
      'nginx.dominio_ajeno':
        'Рядок {linea}: «{nombre}» не є доменом цього сайту. Спочатку додайте його як псевдонім сайту.',
      'nginx.puerto_ajeno':
        'Рядок {linea}: сайт може прослуховувати лише порти Nginx, налаштовані в Налаштуваннях.',
      'nginx.version_no_existe': 'Цієї версії vhost більше немає в історії.',
      'nginx.argumento_invalido': 'Недійсний аргумент: {campo}',
      'nginx.destino_interno':
        'Рядок {linea}: «{directiva}» вказує на внутрішню службу WolfCore Dev (Adminer, Mailpit, бази даних, PHP інших сайтів…) і відкриє її для мережі та тунелів. Нічого не змінено.',
      'nginx.caido_tras_restaurar':
        'Nginx не відповів: попередній vhost відновлено, але він досі не відповідає. Перевірте Служби та журнал Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'Порт {puerto} уже зайнятий: перехоплення дампів не може прослуховувати його. Закрийте програму, яка його використовує (наприклад, Symfony server:dump).',
      'depuracion.no_iniciado': 'Перехоплення дампів вимкнено.',
      'depuracion.tipo_no_soportado': 'Перехоплення дампів доступне для сайтів PHP і FastAPI.',
      'depuracion.confirmacion': 'Підтвердьте перехоплення дампів у діалоговому вікні.',
      'depuracion.argumento_invalido': 'Неприпустимий аргумент: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Цей файл розташовано поза папкою сайту: його не буде відкрито в редакторі.',
      'contenedores.motor_invalido': 'Невідомий рушій контейнерів.',
      'contenedores.id_invalido': 'Ідентифікатор контейнера неприпустимий.',
      'contenedores.argumento_invalido': 'Неприпустимий аргумент: {campo}',
      'contenedores.sin_motor': "На цьому комп'ютері не встановлено {motor}.",
      'contenedores.no_responde':
        '{motor} не відповідає. Відкрийте Docker Desktop або запустіть машину Podman і спробуйте ще раз.',
      'contenedores.remoto':
        "Типове підключення {motor} вказує на інший комп'ютер: WolfCore Dev використовує лише локальні рушії.",
      'contenedores.no_existe': 'Контейнер більше не існує. Оновіть список.',
      'contenedores.accion_fallo': 'Рушію не вдалося виконати дію: {detalle}',
      'contenedores.demasiados_registros':
        'Можна відстежувати щонайбільше {maximo} журналів контейнерів одночасно.',
      'contenedores.sin_confirmar': 'Підтвердьте дію в діалоговому вікні.',
      'catalogo.indice_invalido':
        'Індекс версій служби {servicio} не пройшов перевірку; використовується збережений список.',
      'catalogo.sin_huella':
        '{servicio} {version} не має опублікованого відбитка: підтвердьте встановлення в діалоговому вікні.',
      'catalogo.huella_debil':
        '{servicio} {version} має лише слабкий відбиток (MD5 або SHA-1): підтвердьте встановлення в діалоговому вікні.',
      'catalogo.huella_no_coincide': 'Завантажений файл не відповідає опублікованому відбитку.',
      'catalogo.redireccion_ajena': 'Завантаження спробувало перейти на заборонений сайт ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Під час завантаження відбулося забагато перенаправлень (понад {maximo}).',
      'catalogo.respuesta_grande': 'Відповідь сервера занадто велика.',
      'catalogo.version_no_encontrada': 'Версії {version} служби {servicio} немає в каталозі.',
      'catalogo.huella_no_disponible':
        "Не вдалося отримати відбиток для {servicio} {version} (немає з'єднання або джерело не відповіло). Спробуйте ще раз.",
      'catalogo.firma_invalida':
        'PGP-підпис {servicio} {version} недійсний або не опублікований: нічого не встановлено.',
      'catalogo.firma_no_soportada':
        'PGP-підпис {servicio} {version} використовує формат, який WolfCore Dev не перевіряє: нічого не встановлено.',
      'catalogo.clave_desconocida':
        'Підпис {servicio} {version} створено ключем, якого немає серед закріплених ключів застосунку: нічого не встановлено.',
      'catalogo.firma_vencida':
        'Термін дії підпису {servicio} {version} або його ключа минув: нічого не встановлено. Оновіть WolfCore Dev, щоб мати актуальні ключі.',
      'catalogo.reloj_atrasado':
        "Підпис {servicio} {version} має дату з майбутнього: перевірте дату й час на комп'ютері та спробуйте ще раз.",
      'acceso_bd.datos_invalidos': 'Облікові дані для доступу до бази неприпустимі.',
      'acceso_bd.sin_base': 'Файл .env цього проєкту не вказує на базу даних.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin відкриває лише бази MySQL і MariaDB; для PostgreSQL скористайтеся Adminer.',
      'acceso_bd.servidor_no_resuelto':
        'База цього проєкту не належить до локального сервера WolfCore Dev.',
      'acceso_bd.no_listo':
        'Інструмент не готовий: встановіть його в розділі «Служби» та увімкніть PHP.',
      'auditoria.tabla_invalida': 'Таблиця не існує в цій базі.',
      'auditoria.columna_invalida':
        'Стовпець не існує в цій таблиці (і стовпці користувача та хешу мають бути різними).',
      'auditoria.usuario_no_encontrado': 'Облікового запису з таким користувачем не знайдено.',
      'auditoria.usuario_repetido':
        'Існує кілька облікових записів із цим користувачем: скидання не виконано, щоб не змінити чужий запис.',
      'auditoria.formato_no_soportado':
        'Формат поточного хешу неможливо відтворити: скидання не виконано.',
      'auditoria.clave_larga':
        'bcrypt використовує лише перші 72 байти пароля: оберіть коротший пароль.',
      'auditoria.clave_invalida': 'Новий пароль неприпустимий.',
      'auditoria.sin_confirmar': 'Підтвердьте, що хочете скинути цей пароль.',
      'auditoria.respaldo_previo_fallo':
        'Не вдалося зберегти резервну копію бази перед скиданням: нічого не змінено.',
      'auditoria.copia_fallo': 'Не вдалося зберегти копію рядка: нічого не змінено.',
      'auditoria.motor_no_soportado': 'Аудит паролів доступний для MySQL, MariaDB і PostgreSQL.',
      'auditoria.cancelada': 'Аудит скасовано.',
      'auditoria.usuario_invalido': "Ім'я користувача має містити від 1 до 256 символів.",
      'auditoria.en_curso': 'Аудит уже триває: дочекайтеся завершення або скасуйте його.',
      'auditoria.base_sistema': 'Системна база не підлягає аудиту: оберіть базу проєкту.',
      'auditoria.esquema_invalido': 'Схема не існує в цій базі.',
      'auditoria.fila_cambio':
        'Обліковий запис тим часом змінився: скидання не виконано. Спробуйте ще раз.',
      'auditoria.verificacion_fallo': 'База не зберегла пароль належним чином: зміну скасовано.',
      'auditoria.columna_corta':
        'Стовпець хешу вміщує {largo} символів, а для нового хешу потрібно {necesario}: нічого не змінено. Розширте стовпець.',
      'auditoria.datos_reales_sin_confirmar':
        'Ця база містить реальні дані клієнтів: скидання пароля вимагає посиленого підтвердження.',
      'instantaneas.id_invalido': 'Знімок неприпустимий.',
      'instantaneas.no_encontrada': 'Знімок не знайдено; можливо, його вже видалено.',
      'instantaneas.otra_base':
        'Цей знімок належить іншій базі: його не можна застосувати до цієї.',
      'instantaneas.sin_confirmar': 'Підтвердьте, що хочете повернутися до цього знімка.',
      'instantaneas.motor_no_soportado': 'Знімки підтримуються для MySQL, MariaDB і PostgreSQL.',
      'instantaneas.demasiado_grande':
        'Розмір бази перевищує {maximo} MB — максимальний обсяг, який зберігає знімок.',
      'instantaneas.sin_espacio':
        'Недостатньо вільного місця для знімка: потрібно {necesarios} MB, а доступно {libres} MB.',
      'instantaneas.limite':
        'Для цієї бази вже є {maximo} знімків: видаліть якийсь із них, щоб створити новий.',
      'instantaneas.tomar_fallo': 'Не вдалося створити знімок. Базу не змінено.',
      'instantaneas.huella_no_coincide':
        'Файл знімка змінився або пошкоджений: нічого не відновлено.',
      'instantaneas.respaldo_previo_fallo':
        'Не вдалося зберегти поточний стан бази: нічого не відновлено.',
      'instantaneas.restauracion_fallo':
        'Не вдалося відновити знімок. Базу повернуто до попереднього стану. Причина: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Не вдалося відновити знімок, а попередній стан не було збережено: база може бути порожньою або неповною. Причина: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Не вдалося ні відновити знімок, ні повернутися до попереднього стану. Цей стан збережено в автоматичному знімку {respaldo}: поверніться до нього в розділі «Знімки».',
    },
  },
  instantaneas: {
    abrir: 'Знімки',
    titulo: (base: string) => `Знімки бази ${base}`,
    ayuda:
      'Знімок зберігає базу в її поточному стані. Ви можете повернутися до нього будь-коли: перед поверненням автоматично створюється знімок поточного стану.',
    ubicacion:
      'Знімки зберігаються в папці даних WolfCore Dev і доступні для читання лише Вашому користувачеві. Служби та їхні дані не змінюються.',
    notaEtiqueta: "Примітка (необов'язково)",
    notaMarcador: 'Наприклад: перед міграцією',
    tomar: 'Створити знімок',
    tomada: 'Знімок збережено',
    cargando: 'Читання знімків…',
    vacio: 'Для цієї бази ще немає знімків.',
    automatica: 'Автоматичний',
    sinNota: 'Без примітки',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${plural(tablas, 'таблиця', 'таблиці', 'таблиць')} · ${tamano}`,
    volver: 'Повернутися до цього знімка',
    borrar: 'Видалити',
    borrada: 'Знімок переміщено до кошика',
    papelera: 'Видалені знімки можна відновити протягом 7 днів із кошика WolfCore Dev.',
    cerrar: 'Закрити',
    papeleraTitulo: 'Кошик',
    papeleraVacia: 'У кошику немає знімків.',
    recuperar: 'Відновити',
    recuperada: 'Знімок відновлено',
    borradaEl: (fecha: string) => `Видалено ${fecha}`,
    borrarPregunta: 'Перемістити цей знімок до кошика?',
    borrarSi: 'Перемістити до кошика',
    notaAutomatica: (fecha: string) =>
      `Попередній стан, збережений перед поверненням до знімка від ${fecha}`,
    notaAutomaticaSinOrigen: 'Попередній стан, збережений перед поверненням до іншого знімка',
    extensionesAviso: (lista: string) =>
      `Містить розширення PostgreSQL (${lista}), які відновлюються лише за наявності реєстру відбитків цього комп'ютера.`,
    limites:
      "У MySQL і MariaDB також зберігаються процедури, тригери та події. У PostgreSQL це стиснутий дамп однієї бази: він не містить ролей і користувачів сервера. Знімок, походження якого з цього комп'ютера неможливо підтвердити, відновлюється під користувачем, обмеженим цією базою, що не підтримує представлення, процедури чи тригери інших користувачів.",
    basesBorradas: 'Знімки баз, яких більше не існує',
    basesBorradasAyuda: 'Оберіть базу, щоб створити її знову зі знімка.',
    dialogoVolver: {
      titulo: (base: string) => `Повернення до знімка бази ${base}`,
      cargando: 'Підготовка попереднього перегляду…',
      base: 'База',
      instantanea: 'Знімок',
      ahora: 'Зараз',
      tamano: 'Розмір',
      tablas: 'Таблиці',
      nota: 'Примітка',
      aviso: (base: string) =>
        `Базу ${base} буде повністю замінено цим знімком: усі зміни, зроблені після нього, буде втрачено з бази. Перед цим автоматично зберігається знімок поточного стану; якщо щось піде не так, база автоматично повернеться до цього стану.`,
      pedir: (base: string) => `Для підтвердження введіть ${base}`,
      confirmar: 'Повернутися до цього знімка',
      trabajando: (base: string) => `Відновлення ${base}… Не закривайте програму до завершення.`,
      hecho: (base: string) => `Базу ${base} повернуто до знімка`,
      respaldoPrevio: 'Попередній стан збережено в автоматичному знімку від',
      advertencias: 'Відновлення завершилося зі сповіщеннями:',
      hechoConAvisos: (base: string) => `Базу ${base} повернуто до знімка зі сповіщеннями`,
      baseVacia: 'База не існує або порожня: перед поверненням немає чого зберігати.',
      sinGuardarTitulo: 'Не вдалося зберегти поточний стан',
      sinGuardarTexto:
        'WolfCore Dev не зміг зберегти поточний стан бази перед поверненням. Якщо Ви продовжите БЕЗ збереження і відновлення не вдасться, поточні дані бази буде втрачено.',
      sinGuardarConfirmar: 'Я розумію, що поточні дані бази буде втрачено',
      sinGuardarBoton: 'Повернутися без збереження поточного стану',
    },
  },
  avisoInicio: {
    titulo: 'Сповіщення WolfCore Dev',
  },
  tareas: {
    titulo: 'Заплановані завдання',
    resumen: (n: number) =>
      n === 0 ? 'Немає завдань' : `${n} ${plural(n, 'завдання', 'завдання', 'завдань')}`,
    mostrar: 'Переглянути завдання',
    ocultar: 'Сховати',
    cargando: 'Завантаження завдань',
    errorCargar: 'Не вдалося завантажити завдання',
    soloAbierta:
      "Завдання виконуються лише тоді, коли WolfCore Dev відкритий. Вони не використовують Планувальник завдань Windows: коли застосунок закрито або комп'ютер у режимі сну, вони не запускаються, а пропущені запуски не надолужуються.",
    repoEjecuta:
      'У довіреному проєкті все, що є в репозиторії, виконується як є: файл, указаний у завданні, `artisan`, скрипти з `package.json`, `.venv`… Якщо вони зміняться після `git pull`, завдання запустить нову версію.',
    vacio:
      'У цьому проєкті немає запланованих завдань. Створіть нове (наприклад, «php artisan schedule:run» щохвилини для Laravel).',
    nueva: 'Нове завдання',
    pausada: 'призупинено',
    enCurso: 'Виконується…',
    nunca: 'Ще не виконувалося',
    ultima: (f: string) => `Останній запуск: ${f}`,
    proxima: (f: string) => `наступний: ${f}`,
    codigo: (n: number) => `код ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'створено тут', 'wolfcore.yml': 'з wolfcore.yml' },
    describir: {
      cadaMinuto: 'Щохвилини',
      cadaN: (n: number) => `Кожні ${n} ${plural(n, 'хвилину', 'хвилини', 'хвилин')}`,
      cadaHora: 'Щогодини, рівно о :00',
      diaria: (h: string) => `Щодня о ${h}`,
      laborables: (h: string) => `З понеділка по п'ятницю о ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Успішно',
      fallo: 'Помилка',
      tiempo: 'Перевищено ліміт часу',
      cancelada: 'Скасовано',
      omitida: 'Пропущено',
      bloqueada: 'Не виконано',
    },
    motivo: {
      aislado:
        'Це тестова папка даних (WOLFCORE_DATOS): завдання не запускається, доки Ви не дозволите завдання в цій сесії.',
      no_confiado:
        'Проєкт не позначено як довірений: позначте «Я довіряю цьому репозиторію», щоб завдання запускалося.',
      receta_cambio:
        'Рецепт проєкту змінився відтоді, як Ви йому довірили: перегляньте його та знову позначте «Я довіряю цьому репозиторію».',
      sin_confirmar:
        'Потрібно підтвердити команду: завдання не запускається, доки Ви не перевірите та не підтвердите її.',
      comando_invalido: 'Команда не дозволена (лише php, node, npm run та python).',
      cron_invalida: 'Розклад не є коректним виразом cron.',
      carpeta: 'Папка проєкту не існує.',
      solapada: 'Попередній запуск ще тривав: цей пропущено.',
      retraso: 'Запізнення (застосунок був призупинений): запуск не надолужується.',
      error: 'Не вдалося запустити програму.',
    },
    acciones: {
      ejecutar: 'Запустити зараз',
      editar: 'Редагувати',
      borrar: 'Видалити',
      verRegistro: 'Переглянути журнал',
      revisarConfirmar: 'Перевірити й підтвердити',
      activar: (n: string) => `Увімкнути завдання ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Видалити «${n}»?`,
      texto:
        'Завдання та його історію буде видалено. Уже виконані дії не скасовуються, а файли проєкту не змінюються.',
      confirmar: 'Видалити',
      hecho: (n: string) => `Завдання «${n}» видалено.`,
    },
    aislado: {
      titulo: 'Тестова папка даних.',
      texto:
        'З WOLFCORE_DATOS жодне завдання не запускається автоматично. Дозволяйте їх лише якщо хочете протестувати в цій сесії.',
      permitir: 'Дозволити в цій сесії',
      confirmarTitulo: 'Дозволити завдання в цій тестовій папці?',
      confirmarTexto:
        'Активні завдання довірених проєктів почнуть виконуватися, доки Ви не закриєте застосунок. Команди належать відповідним проєктам і виконуються в їхніх реальних папках.',
      permitido: 'Завдання дозволено в цій сесії.',
    },
    yml: {
      titulo: 'Пропозиції з wolfcore.yml',
      texto:
        'Файл проєкту пропонує ці завдання. Нічого не виконується автоматично лише через наявність запису: перевірте команду й підтвердьте її, щоб прийняти завдання.',
      estado: { nueva: 'Нове', adoptada: 'Прийнято', cambiada: 'Змінилося' },
      revisar: 'Перевірити й прийняти',
      cambiada:
        'Команда у wolfcore.yml змінилася після того, як Ви її прийняли. Завдання проєкту досі використовує підтверджену команду; прийміть нову версію, якщо впізнаєте її.',
      guardarEn: 'Зберегти у wolfcore.yml',
      escribirTitulo: 'Записати завдання у wolfcore.yml?',
      escribirTexto:
        "Завдання буде додано або оновлено у файлі проєкту (не зачіпаючи решту), щоб воно передавалося разом із репозиторієм. Кожен, хто клонує репозиторій, повинен буде підтвердити його на своєму комп'ютері.",
      escribir: 'Записати',
      escrita: 'Завдання збережено у wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Журнал «${n}»`,
      historial: 'Останні запуски',
      sinHistorial: 'Запусків ще не було.',
      salida: 'Вивід останнього запуску',
      sinSalida: 'Збереженого виводу немає.',
      enmascarado:
        'Журнали приховують паролі й ключі, мають обмежений розмір і автоматично ротуються.',
      origen: { programada: 'за розкладом', manual: 'вручну' },
    },
    dialogo: {
      tituloNueva: 'Нове заплановане завдання',
      tituloEditar: 'Редагувати заплановане завдання',
      tituloAdoptar: 'Прийняти завдання з wolfcore.yml',
      tituloConfirmar: 'Підтвердити команду завдання',
      nombre: 'Назва',
      nombrePlaceholder: 'Завдання Laravel',
      horario: 'Коли',
      preset: {
        cadaMinuto: 'Щохвилини',
        cadaN: 'Кожні кілька хвилин',
        cadaHora: 'Щогодини',
        diaria: 'Щодня у певний час',
        laborables: "З понеділка по п'ятницю у певний час",
        personalizada: 'Власний вираз cron',
      },
      cadaNOpcion: (n: number) => `Кожні ${n} ${plural(n, 'хвилину', 'хвилини', 'хвилин')}`,
      hora: 'Час',
      horaPlaceholder: '03:00',
      horaInvalida: 'Введіть коректний час, наприклад 03:00.',
      expresion: 'Вираз cron',
      cronEquivale: 'Вираз cron:',
      expresionAyuda:
        '5 полів: хвилина, година, день місяця, місяць і день тижня (* , - /). Мінімум — раз на хвилину.',
      proximas: 'Наступні запуски:',
      comando: 'Команда',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Лише php, node, npm run та python із файлом проєкту. Виконується в папці проєкту без оболонки та без коду в рядку (-r, -e, -c).',
      comandoFijo:
        'Ця команда містить аргументи в лапках, які не можна записати як текст: вона зберігається як є і не редагується тут (видаліть її та створіть нову, якщо потрібно змінити).',
      argumentos: 'Буде виконано з такими аргументами:',
      comillasSinCerrar: 'Незакриті лапки.',
      tiempo: 'Максимальний час',
      minutos: 'хвилин',
      tiempoAyuda:
        'Якщо триває довше, зупиняється автоматично (лише цей процес і запущені ним процеси).',
      activa: 'Активне (виконується автоматично, поки застосунок відкритий)',
      advertencia:
        'Приймаючи, Ви дозволяєте саме цю команду: вона виконуватиметься автоматично в папці цього проєкту за розкладом. Якщо зміните її, знадобиться нове підтвердження.',
      revise: 'Я перевірив(-ла) цю команду та впізнаю її.',
      guardar: 'Зберегти й підтвердити команду',
      adoptar: 'Підтвердити й прийняти',
      confirmar: 'Підтвердити команду',
      guardada: 'Завдання збережено.',
      adoptada: 'Завдання прийнято.',
      confirmada: 'Команду підтверджено.',
    },
  },
  workspaces: {
    titulo: 'Робочі простори',
    descripcion:
      'Іменовані набори баз даних, служб і процесів, які вмикаються та вимикаються разом.',
    nuevo: 'Новий робочий простір',
    vacio:
      'Робочих просторів ще немає. Створіть один, наприклад «Bot FastAPI» із PostgreSQL, Redis, Ollama та процесом Вашого проєкту.',
    elementos: (n: number) => `${n} ${plural(n, 'елемент', 'елементи', 'елементів')}`,
    sinElementos: 'Немає елементів',
    estado: { apagado: 'Вимкнено', parcial: 'Частково', encendido: 'Увімкнено' },
    acciones: {
      iniciar: 'Увімкнути',
      detener: 'Вимкнути',
      editar: 'Редагувати',
      borrar: 'Видалити',
      cerrar: 'Закрити',
    },
    borrar: {
      titulo: (n: string) => `Видалити «${n}»?`,
      texto:
        'Видалення робочого простору нічого не вимикає й не стирає: видаляється лише сам набір. Усе, що увімкнено, продовжить працювати.',
      confirmar: 'Видалити',
      hecho: (n: string) => `Робочий простір «${n}» видалено.`,
    },
    dialogo: {
      tituloNuevo: 'Новий робочий простір',
      tituloEditar: 'Редагувати робочий простір',
      nombre: 'Назва',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Введіть назву.',
      aviso:
        'Робочий простір лише зберігає список того, що потрібно увімкнути. Він не відкриває тунелі, не надає доступ у локальній мережі й не запускає процеси проєкту, якому Ви не довіряєте.',
      secciones: {
        instancias: 'Бази даних',
        servicios: 'Служби',
        procesos: 'Процеси проєктів',
      },
      sinOpciones: 'Тут немає з чого обрати.',
      captadorUnico:
        'Одночасно може працювати лише один перехоплювач пошти: вибір іншого замінить попередній.',
      yaNoExisten: (lista: string) =>
        `Більше не існують і будуть прибрані під час збереження: ${lista}`,
      guardar: 'Зберегти',
      guardado: (n: string) => `Робочий простір «${n}» збережено.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: результат увімкнення`,
      tituloDetener: (n: string) => `«${n}»: результат вимкнення`,
      encendido: 'Увімкнено',
      apagado: 'Вимкнено',
      yaEncendido: 'Уже було увімкнено',
      yaApagado: 'Уже було вимкнено',
      noExiste: 'Більше не існує: пропущено',
      compartido: 'Залишається увімкненим: використовується іншим активним робочим простором',
      reemplaza: (otro: string) => `Увімкнено; вимкнуто ${otro} з тієї самої поштової групи`,
      fallo: 'Не вдалося увімкнути',
      falloApagar: 'Досі увімкнено',
      ok: (n: string) => `«${n}» готово.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: увімкнено ${encendidos} із ${total}. Перевірте, що не запустилося.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} досі ${plural(siguen, 'працює', 'працюють', 'працюють')}. Перевірте, що не вимкнулося.`,
    },
  },
  inicio: {
    titulo: 'Головна',
    bienvenida: 'Ваше середовище розробки як на долоні.',
    tiles: {
      servicios: 'Увімкнені служби',
      serviciosDe: (total: number) => `із ${total}`,
      sitios: 'Проєкти',
      tuneles: 'Активні тунелі',
      hosts: 'Очікують у hosts',
      hostsOk: 'Усе гаразд',
      hostsFaltan: 'Потребує уваги',
    },
    hosts: {
      titulo: 'Є домени, не зареєстровані у файлі hosts',
      texto:
        "Ці домени ще не вказують на Ваш комп'ютер. Для виправлення Windows запитає права адміністратора.",
      corregir: 'Застосувати зміни до hosts',
      reintentarPermiso: 'Повторити з правами адміністратора',
      corregido: 'Файл hosts оновлено',
      fallo: 'Не вдалося оновити файл hosts',
      verInstrucciones: 'Переглянути інструкцію',
      duplicados: 'Ці домени вже є в hosts поза блоком WolfCore Dev (їх буде збережено):',
      motivos: {
        cancelado: 'Запит прав адміністратора скасовано. Файл hosts залишився без змін.',
        tiempo:
          'Ніхто не підтвердив права адміністратора вчасно. Сайт збережено; файл hosts залишився без змін. Якщо Ви ще бачите сповіщення Windows, скасуйте його (воно вже нічого не зробить). Застосуйте очікувані зміни, коли буде зручно (один дозвіл для всіх).',
        denegado: 'Windows не дозволила записати файл hosts. Можливо, його блокує антивірус.',
      } as Record<string, string>,
      modalTitulo: 'Виправити hosts вручну',
      modalTexto:
        'Відкрийте PowerShell від імені адміністратора (клацніть правою кнопкою на «Пуск» → «Термінал (адміністратор)»), вставте цю команду й натисніть Enter.',
    },
    servicios: {
      titulo: 'Служби',
      ver: 'Переглянути служби',
      vacio: 'Служб ще не встановлено.',
    },
    tuneles: {
      titulo: 'Активні тунелі',
      vacio: 'Відкритих тунелів немає. Ви можете відкрити тунель у розділі «Проєкти».',
      sitioDesconocido: 'Сайт без назви',
    },
  },
  servicios: {
    titulo: 'Служби',
    descripcion:
      'Вмикайте та вимикайте вебсервер, PHP, бази даних та інструменти. Стан оновлюється автоматично.',
    grupos: {
      web: 'Веб',
      php: 'PHP',
      bd: 'Бази даних',
      correo: 'Пошта',
      ia: 'ШІ',
      herramientas: 'Інструменти',
    },
    gruposAyuda: {
      web: 'Сервер, який обслуговує домени .test.',
      php: 'Окреме встановлення для кожної версії (8.3, 8.4…); кожен сайт використовує свою.',
      bd: 'Прослуховують лише 127.0.0.1.',
      correo: 'Перехоплює листи, які надсилають Ваші проєкти, не випускаючи їх в інтернет.',
      ia: "Мовні моделі на Вашому комп'ютері.",
      herramientas: 'Утиліти для щоденної роботи.',
    },
    puerto: 'Порт',
    cambiarPuerto: 'Змінити порт',
    cambiarPuertoDe: (nombre: string) => `Змінити порт для ${nombre}`,
    versionesDe: (nombre: string) => `Версії ${nombre}`,
    instancias: (n: number, encendidas: number) =>
      `${n} ${plural(n, 'екземпляр', 'екземпляри', 'екземплярів')}, увімкнено: ${encendidas}`,
    usarPuerto: (p: number) => `Використовувати порт ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} тепер використовує порт ${p}`,
    conflicto: 'Порт зайнятий',
    autoIniciar: 'Умикати під час запуску WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} вмикатиметься під час запуску WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} більше не вмикатиметься під час запуску WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Порт ${nombre}`,
      etiqueta: 'Новий порт',
      ayuda:
        'Від 1024 до 65535 і вільний. Якщо служба увімкнена, вона перезапуститься. Оновіть .env Ваших проєктів.',
      rango: 'Використовуйте число від 1024 до 65535',
      igual: 'Це поточний порт',
      guardar: 'Змінити порт',
    },
    borrarDatos: {
      opcion: 'Видалити дані',
      titulo: (nombre: string) => `Видалити дані ${nombre}`,
      copias: (n: number, tam: string) =>
        `Також буде видалено ${n} ${plural(n, 'копію', 'копії', 'копій')} від оновлень (${tam}). Якщо Ви хочете зберегти їх, скопіюйте їх заздалегідь із папки даних.`,
      /** Що буде втрачено, залежно від служби. */
      que: {
        mysql: 'усі бази даних і користувачі MySQL',
        mariadb: 'усі бази даних і користувачі MariaDB',
        postgresql: 'усі бази даних і користувачі PostgreSQL',
        redis: 'усі ключі та дані, збережені в Redis',
        mongodb: 'усі бази даних, колекції та дані MongoDB',
        mailpit: 'усі листи, перехоплені Mailpit',
        smtp4dev: 'усі листи, перехоплені smtp4dev',
        inbucket: 'усі листи, перехоплені Inbucket',
        papercut: 'усі листи, перехоплені Papercut SMTP',
        ollama: 'усі завантажені моделі Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `Буде видалено ${que}. Цю дію неможливо скасувати. Програма залишиться встановленою.`,
      generico: (nombre: string) => `усі дані ${nombre}`,
      pedir: (id: string) => `Для підтвердження введіть ${id}`,
      boton: 'Видалити дані',
      hecho: (nombre: string) => `Дані ${nombre} видалено`,
    },
    ftp: {
      interruptor: 'FTP-сервер',
      redLocal: 'Дозволити підключення з локальної мережі',
      avisoTitulo: 'Відкрити FTP для локальної мережі',
      avisoTexto:
        'FTP передає імена користувачів, паролі та файли без шифрування. Будь-який комп’ютер у вашій мережі зможе спробувати підключитися. Використовуйте це лише в довіреній мережі.',
      avisoConfirmar: 'Дозволити',
      redLocalActivada: 'FTP приймає підключення з локальної мережі',
      redLocalDesactivada: 'FTP приймає підключення лише з цього комп’ютера',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Менеджер залежностей PHP',
      instalado: 'Встановлено',
      noInstalado: 'Не встановлено',
      sinVersion: 'не встановлено',
      uso: 'Використання',
      usoTexto: 'composer',
      ayuda:
        'Використовуйте «Термінал» у проєкті або додайте WolfCore Dev до PATH у Налаштуваннях.',
      instaladoOk: 'Composer встановлено',
      sinPhp: 'Спочатку встановіть PHP',
      actualizado: (v: string) => `Composer оновлено: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Вебінтерфейс керування базами даних',
      direccion: 'Адреса',
      disponible: 'Готово',
      noInstalado: 'Не встановлено',
      sinPhp: 'Бракує PHP',
      abrir: 'Відкрити Adminer',
      instaladoOk: 'Adminer встановлено',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Вебінтерфейс керування MySQL і MariaDB',
      direccion: 'Адреса',
      disponible: 'Готово',
      noInstalado: 'Не встановлено',
      sinPhp: 'Бракує PHP',
      abrirDesdeProyecto: 'Відкривається з картки кожного проєкту вже з виконаним входом.',
      faltaExtension: (ext: string, rama: string) =>
        `У PHP ${rama} не активовано розширення ${ext}. Перезапустіть PHP або увімкніть його у вашому php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin підтримує версії до PHP 8.3, а зараз використовується PHP ${rama}: можуть виникати помилки. Увімкніть версію PHP від 7.2 до 8.3, якщо щось не працює.`,
      instalarPrimero: 'Встановіть phpMyAdmin, щоб користуватися ним.',
      encenderPhp: 'Увімкніть PHP, щоб користуватися phpMyAdmin.',
      instaladoOk: 'phpMyAdmin встановлено',
    },
    puertos: 'Порти',
    pid: 'PID',
    sinVersion: 'без версії',
    sinPuertos: '—',
    terminado: 'Завершено без помилок',
    externo: 'Керується поза WolfCore Dev',
    verDetalle: 'Переглянути деталі помилки',
    vacioTitulo: 'Служб ще немає',
    vacio: 'Служби ще не встановлено. Почніть із Nginx і PHP для ваших сайтів або з бази даних.',
    irAInstalar: 'Перейти до встановлення',
  },
  bd: {
    descripcion:
      'Створюйте, створюйте резервні копії та відновлюйте бази даних ваших проєктів. Сервери слухають лише на 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Нова база',
    restaurar: 'Відновити резервну копію',
    importar: 'Імпортувати з іншого сервера',
    soloSql: 'Доступно для MySQL, MariaDB і PostgreSQL',
    enCursoAyuda: 'Зачекайте завершення поточної операції',
    encenderPrimero: (motor: string) => `Спочатку увімкніть ${motor}`,
    cargando: 'Завантаження баз…',
    recargar: 'Оновити список',
    vacioTitulo: 'Жодного сервера баз даних не встановлено',
    vacio:
      'Встановіть MySQL, MariaDB, PostgreSQL або MongoDB у розділі «Служби», щоб керувати базами даних.',
    irAServicios: 'Перейти до Служб',
    apagado: {
      titulo: (motor: string) => `${motor} вимкнено`,
      texto: (motor: string) => `Увімкніть ${motor}, щоб переглядати бази даних і керувати ними.`,
      iniciando: (motor: string) => `${motor} запускається…`,
      error: (motor: string) => `Не вдалося запустити ${motor}`,
      encender: (motor: string) => `Увімкнути ${motor}`,
      verServicios: 'Переглянути у Службах',
    },
    errorLista: 'Не вдалося прочитати список баз даних',
    sinBases: 'На цьому сервері ще немає власних баз даних.',
    total: (n: number) => plural(n, 'база', 'бази', 'баз'),
    columnas: { nombre: 'База', tamano: 'Розмір', acciones: 'Дії' },
    acciones: {
      respaldar: 'Резервна копія',
      restaurarAqui: 'Відновити сюди',
      adminer: 'Відкрити в Adminer',
      conexion: 'Дані підключення',
      vector: 'Увімкнути vector',
      borrar: 'Видалити',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Встановіть Adminer і PHP у розділі «Служби», щоб відкрити його',
    vectorSinInstalar: 'Встановіть pgvector нижче, щоб активувати його в базі даних',
    vectorActivado: (base: string) => `Vector активовано в ${base}`,
    formatos: {
      sql: 'Звичайний SQL',
      pgdump: 'Резервна копія PostgreSQL (pg_dump, власний формат)',
      gz: 'Стиснутий SQL (.gz)',
      zip: 'Архів .zip (розпаковується перед відновленням)',
      rar: 'Архів .rar (спроба розпакування засобами Windows)',
      '7z': 'Архів .7z (спроба розпакування засобами Windows)',
      desconocido: 'Невідомий формат',
    } as Record<string, string>,
    formatoDesconocido:
      'Формат не розпізнано. Якщо це стиснутий архів, розпакуйте його та виберіть файл .sql або .dump усередині.',
    formatoIncompatible:
      'Цей файл є резервною копією PostgreSQL: відновіть його на вкладці PostgreSQL.',
    nombre: {
      etiqueta: 'Назва бази даних',
      vacio: 'Введіть назву',
      largo: 'Назва занадто довга',
      caracteres: {
        mysql: 'Використовуйте лише літери, цифри та підкреслення',
        mariadb: 'Використовуйте лише літери, цифри та підкреслення',
        postgresql: 'Використовуйте малі літери, цифри та підкреслення',
        mongodb: 'Використовуйте лише літери, цифри, дефіс і підкреслення',
      } as Record<string, string>,
      inicio: 'У PostgreSQL назва не може починатися з цифри',
    },
    reemplazo: {
      titulo: (base: string) => `База ${base} уже містить таблиці`,
      texto: (base: string) =>
        `Якщо ви продовжите, поточну базу ${base} буде ПОВНІСТЮ ЗАМІНЕНО. Спочатку автоматично збережеться резервна копія; потім базу буде видалено та створено заново з новим вмістом.`,
      donde: 'Резервна копія зберігається в',
      carpetaPorDefecto: 'Документи\\WolfCore Dev\\Резервні копії',
      otraBase:
        'Якщо ви не хочете її замінювати, поверніться назад і виберіть іншу назву: буде створено нову базу.',
      pedir: (base: string) => `Для підтвердження введіть ${base}`,
      volver: 'Назад',
      confirmar: 'Замінити базу',
    },
    resultado: {
      restaurada: (base: string) => `Базу ${base} відновлено`,
      importada: (base: string) => `Базу ${base} імпортовано`,
      respaldada: (base: string) => `Резервну копію ${base} збережено`,
      archivo: 'Файл',
      respaldoPrevio: 'Резервна копія попередньої бази',
      advertencias: (n: number) => plural(n, 'попередження', 'попередження', 'попереджень'),
      advertenciasAyuda:
        'Операцію завершено. Перевірте ці сповіщення; зазвичай це ролі або дозволи, яких немає на цьому комп’ютері.',
      fallo: {
        restaurar: 'Не вдалося відновити',
        importar: 'Не вдалося імпортувати',
        respaldar: 'Не вдалося створити резервну копію',
      } as Record<string, string>,
      trasReemplazo: 'Початкову базу було замінено, але відновлення не завершилося',
      trasReemplazoAyuda:
        'Ваші попередні дані збережено у вказаній резервній копії. Ви можете відновити її через «Відновити резервну копію».',
    },
    progreso: {
      titulo: 'Журнал',
      corriendo: {
        restaurar: (base: string) => `Відновлення ${base}…`,
        importar: (base: string) => `Імпортування ${base}…`,
        respaldar: (base: string) => `Створення резервної копії ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Очікування виводу інструмента…',
      limitado: (n: number) => `Показано останні ${n} рядків.`,
      noCierre:
        'Не закривайте програму до завершення. Ви можете залишити цей екран і повернутися пізніше: результат буде тут.',
      otraEnCurso: 'Інша операція вже виконується; зачекайте її завершення.',
      ver: 'Переглянути деталі',
      descartar: 'Приховати',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Відновити резервну копію в ${motor}`,
      confianza:
        'Відновлюйте лише довірені резервні копії: файл резервної копії може виконувати дії на сервері.',
      archivo: 'Файл резервної копії',
      elegir: 'Вибрати файл…',
      cambiar: 'Змінити',
      sinArchivo: 'Файл не вибрано',
      formato: 'Визначений формат',
      detectando: 'Визначення формату…',
      destino: 'Цільова база',
      destinoAyuda:
        'Якщо її не існує, вона буде створена. Якщо вона існує і порожня — використана. Якщо в ній є таблиці, з’явиться запит на підтвердження.',
      restaurar: 'Відновити',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Імпортувати до ${motor} з іншого сервера`,
      soloLectura:
        'Виконується лише читання з вихідного сервера: ваша база копіюється на цей комп’ютер, а джерело не змінюється.',
      detectado: (puerto: number) =>
        `Виявлено інший сервер на порту ${puerto} (наприклад, сервер FlyEnv).`,
      origen: 'Вихідний сервер',
      host: 'Сервер',
      puerto: 'Порт',
      usuario: 'Користувач',
      clave: 'Пароль',
      claveAyuda: 'Використовується лише для цього копіювання і не зберігається.',
      baseOrigen: 'Вихідна база',
      destino: 'Цільова база на цьому комп’ютері',
      destinoAyuda:
        'Якщо її не існує, вона буде створена. Якщо в ній є таблиці, перед заміною з’явиться запит на підтвердження.',
      faltaHost: 'Введіть сервер',
      faltaPuerto: 'Вкажіть порт від 1 до 65535',
      faltaUsuario: 'Введіть користувача',
      faltaBase: 'Введіть вихідну базу',
      importar: 'Імпортувати',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Нова база в ${motor}`,
      codificacion: 'Кодування',
      codificacionValor: {
        mysql: 'utf8mb4 (підтримує емодзі та всі символи)',
        mariadb: 'utf8mb4 (підтримує емодзі та всі символи)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Створити окремого користувача для цієї бази',
      usuarioPropioAyuda:
        'Необов’язково. Інакше ваші проєкти використовуватимуть адміністратора сервера.',
      usuario: 'Користувач',
      clave: 'Пароль',
      faltaClave: 'Введіть пароль',
      crear: 'Створити базу',
      creada: (base: string) => `Базу ${base} створено`,
      mongo: 'У MongoDB база створюється з початковою колекцією (_pel_init).',
      cambiarClave: 'Змінити пароль',
      cambiarClaveTitulo: (u: string) => `Користувач ${u} уже існує з іншим паролем`,
      cambiarClaveTexto: (u: string) =>
        `Якщо змінити пароль для ${u}, проєкти, які вже його використовують, втратять підключення, доки ви не оновите їхній .env. Зазвичай краще використовувати поточний пароль. Все одно змінити?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Видалити базу ${base}?`,
      texto: (base: string, motor: string) =>
        `Буде видалено базу ${base} у ${motor} та всі її дані. Цю дію неможливо скасувати. Якщо вона вам потрібна, спершу створіть резервну копію.`,
      pedir: (base: string) => `Для підтвердження введіть ${base}`,
      boton: 'Видалити базу',
      hecho: (base: string) => `Базу ${base} видалено`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Резервна копія ${base}`,
      destino: 'Буде збережено в',
      porDefecto: 'Документи\\WolfCore Dev\\Резервні копії (папка за замовчуванням)',
      porDefectoEn: (carpeta: string) => `${carpeta} (папка за замовчуванням)`,
      cambiar: 'Вибрати іншу папку…',
      porDefectoVolver: 'Використовувати папку за замовчуванням',
      formato: {
        mysql: 'Файл .sql (mysqldump із процедурами та тригерами)',
        mariadb: 'Файл .sql (mysqldump із процедурами та тригерами)',
        postgresql: 'Файл .dump (pg_dump, власний формат)',
      } as Record<string, string>,
      boton: 'Створити копію',
    },
    dialogoConexion: {
      sitio: 'Проєкт',
      sitioAyuda:
        'Читається файл .env сайту, щоб використати наявні змінні (наприклад, CodeIgniter 4). Його вміст не відображається і не копіюється.',
      generico: 'Загальний (формат Laravel)',
      titulo: (base: string) => `Підключення до ${base}`,
      host: 'Сервер',
      puerto: 'Порт',
      usuario: 'Користувач',
      clave: 'Пароль',
      base: 'База',
      sinClave: 'Без пароля (слухає лише на 127.0.0.1)',
      mostrar: 'Показати пароль',
      ocultar: 'Сховати пароль',
      copiarDato: (dato: string) => `Скопіювати ${dato}`,
      env: 'Блок для файлу .env',
      envAyuda: 'Вставте його у .env вашого проєкту. WolfCore Dev не змінює файли ваших проєктів.',
      copiarEnv: 'Скопіювати блок',
      cargando: 'Читання даних підключення…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Встановлення pgvector уже триває.',
      descripcion:
        'Пошук за схожістю (ембединги) всередині PostgreSQL. Компілюється з офіційного вихідного коду.',
      instalado: (v: string | null) => (v ? `Встановлено (версія ${v})` : 'Встановлено'),
      noInstalado: 'Не встановлено',
      herramientas: 'Інструменти компіляції',
      herramientasSi: 'Готові',
      herramientasNo: 'Відсутні',
      instalar: 'Встановити pgvector',
      reinstalar: 'Скомпілювати знову',
      instalarHerramientas: 'Встановити інструменти компіляції',
      dialogoHerramientasTitulo: 'Встановити інструменти компіляції',
      dialogoHerramientas:
        'Для компіляції pgvector потрібні Build Tools для Visual Studio. Буде завантажено ~6 ГБ, і Windows запитає права адміністратора. Це може тривати довго; не закривайте WolfCore Dev.',
      dialogoCompilarTitulo: 'Скомпілювати та встановити pgvector',
      dialogoCompilar:
        'Завантажується офіційний код pgvector, компілюється та встановлюється у ваш PostgreSQL. PostgreSQL зупиниться на кілька секунд під час копіювання розширення, а потім знову запуститься.',
      continuar: 'Продовжити',
      instalando: 'Встановлення інструментів компіляції…',
      compilando: 'Компіляція pgvector…',
      herramientasOk: 'Інструменти компіляції встановлено',
      instaladoOk: (v: string) => `pgvector ${v} встановлено`,
      sinWinget:
        'На цьому комп’ютері немає winget. Встановіть «Build Tools для Visual Studio 2022» із visualstudio.microsoft.com із навантаженням «Розробка класичних програм на C++» і повторіть спробу.',
      falloHerramientas: 'Не вдалося встановити інструменти компіляції',
      activarAyuda: 'Після цього натисніть «Увімкнути vector» для кожної бази, якій це потрібно.',
      errorEstado: 'Не вдалося прочитати стан pgvector',
    },
  },
  instalar: {
    titulo: 'Встановити',
    descripcion:
      'Завантажуйте офіційні версії. Кожен файл перевіряється за контрольним хешем SHA-256 перед використанням.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Вебсервер (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Публічні тунелі (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'База даних, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'База даних, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'База даних (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Кеш і черги в пам’яті (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Документна база даних (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Консоль MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Тестова пошта (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Тестова пошта (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Тестова пошта (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Тестова пошта (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Локальний ШІ (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'Залежності PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Вебінтерфейс керування базами даних' },
      phpmyadmin: {
        nombre: 'phpMyAdmin',
        detalle: 'Вебінтерфейс керування MySQL (phpmyadmin.net)',
      },
    },
    grupos: {
      web: 'Веб і PHP',
      bd: 'Бази даних',
      otros: 'Пошта, ШІ та тунелі',
    },
    instalados: 'Встановлено',
    ninguno: 'Жодної версії не встановлено',
    elegir: 'Виберіть версію',
    buscando: 'Пошук версій…',
    sinVersiones: 'Версій не знайдено',
    rama: (rama: string) => rama,
    yaInstalada: 'уже встановлено',
    fases: {
      descargando: 'Завантаження',
      verificando: 'Перевірка SHA-256',
      extrayendo: 'Розпакування',
      compilando: 'Компіляція',
      listo: 'Встановлено',
      error: 'Помилка встановлення',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} встановлено`,
  },
  sitios: {
    titulo: 'Сайти',
    descripcion: 'Кожен сайт — це папка, яку обслуговує Nginx на власному домені .test.',
    nuevo: 'Новий сайт',
    buscar: 'Пошук за назвою або доменом',
    sinResultados: (q: string) => `Жоден сайт не відповідає запиту «${q}».`,
    vacioTitulo: 'Сайтів ще немає',
    vacio:
      'Виберіть папку проєкту, і WolfCore Dev визначить, чи це Laravel, CodeIgniter або статичний сайт.',
    agregar: 'Додати сайт',
    total: (n: number) => plural(n, 'сайт', 'сайти', 'сайтів'),
    abrirSitio: (dominio: string) => `Відкрити ${dominio} у браузері`,
    carpeta: 'Папка',
    abrirCarpeta: 'Відкрити папку проєкту',
    alias: (n: number) => `+${plural(n, 'псевдонім', 'псевдоніми', 'псевдонімів')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Статичний',
      proxy: 'Проксі (локальний порт)',
      personalizado: 'Власний',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (локальний порт)',
      node: 'Node / Vite (локальний порт)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Статичний',
      proxy: 'Проксі',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Реальні дані',
    datosRealesAyuda: 'Містить реальні дані клієнтів: будьте обережні під час публікації.',
    faltaHosts: 'Немає в hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} ще не вказує на цей комп’ютер. Виправте файл hosts за допомогою сповіщення вище.`,
    estado: {
      enLinea: 'У мережі',
      faltaHosts: 'Немає в hosts',
      iniciando: 'Запуск Nginx…',
      errorNginx: 'Помилка Nginx',
      nginxExterno: 'Зовнішній Nginx',
      nginxApagado: 'Nginx вимкнено',
    },
    borrar: {
      titulo: (nombre: string) => `Видалити сайт ${nombre}?`,
      texto: 'Папка проєкту залишиться без змін.',
      hecho: (nombre: string) => `Сайт ${nombre} видалено`,
      nginxFallo: 'Сайт видалено, але Nginx не прийняв нову конфігурацію',
    },
  },
  formSitio: {
    tituloNuevo: 'Новий сайт',
    tituloEditar: 'Редагувати сайт',
    tituloDuplicar: 'Дублювати сайт',
    paso: 'Почніть із папки проєкту',
    pasoAyuda:
      'Визначається тип проєкту, версія PHP і рекомендований домен. Потім усе можна змінити.',
    elegirCarpeta: 'Вибрати папку',
    cambiarCarpeta: 'Змінити',
    detectando: 'Аналіз проєкту…',
    detectado: (tipo: string) => `Визначено: ${tipo}`,
    sinDeteccionAlEditar:
      'Автоматичне визначення працює лише під час створення; перевірте тип і PHP.',
    nombre: 'Назва',
    nombreAyuda: 'Лише для розпізнавання у списку.',
    nombreCopia: (nombre: string) => `${nombre} (копія)`,
    duplicarProxy:
      'Копія вказує на той самий локальний порт, що й оригінал, і не копіює його процеси: змініть порт або додайте власний процес.',
    dominio: 'Домен',
    dominioPlaceholder: 'my-project',
    alias: 'Псевдоніми',
    aliasAyuda: 'Інші домени .test, які відкривають цей самий сайт. Введіть і натисніть Enter.',
    aliasAgregar: 'Додати псевдонім',
    carpeta: 'Папка проєкту',
    raizLaravel: 'Nginx обслуговуватиме підпапку public/.',
    tipo: 'Тип проєкту',
    php: 'Версія PHP',
    phpElegir: 'Виберіть версію',
    phpNinguno: 'Жодної версії PHP не встановлено.',
    phpInstalar: 'Встановити PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Проєкт вимагає PHP ${pedida}, який не встановлено. Вибрано PHP ${elegida}.`,
    puertoProxy: 'Локальний порт',
    puertoProxyAyuda:
      'Nginx перенаправлятиме запити на http://127.0.0.1:<порт> (наприклад, Vite або Node).',
    urlBaseVar: 'Змінна базового URL',
    urlBaseVarAyuda:
      'Під час відкриття тунелю публічне посилання записується в цю змінну .env, а після закриття відновлюється попереднє значення.',
    urlBaseVarNinguna: 'Жодна (не змінювати .env)',
    datosReales: 'Містить реальні дані клієнтів',
    datosRealesAyuda:
      'Позначається у списку та вимагає підтвердження перед публікацією через тунель.',
    avanzado: 'Додатково',
    reglasExtra: 'Додаткові правила Nginx',
    reglasExtraAyuda:
      'Вставляються всередину блока server (заголовки безпеки, власні правила deny…). Перевіряються командою nginx -t під час збереження.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Примітка',
    notaPlaceholder: 'Щось, що варто пам’ятати про цей сайт',
    guardar: 'Зберегти сайт',
    guardado: (nombre: string) => `Сайт ${nombre} збережено`,
    errorGuardar: 'Не вдалося зберегти сайт',
    nginxFallo: 'Сайт збережено, але Nginx відхилив конфігурацію',
    nginxFalloAyuda:
      'Попередню конфігурацію Nginx відновлено. Перевірте додаткові правила та збережіть знову.',
    errores: {
      carpeta: 'Виберіть папку проєкту',
      sufijo: 'Домен має закінчуватися на .test',
      caracteres: 'Використовуйте лише літери, цифри, дефіси та крапки',
      aliasIgualDominio: (d: string) => `Псевдонім ${d} збігається з доменом сайту`,
      aliasRepetido: (d: string) => `Псевдонім ${d} повторюється`,
      ocupado: (d: string) => `Сайт із доменом ${d} уже існує`,
      puertoFalta: 'Для проксі-сайту потрібен порт',
      puertoRango: 'Порт має бути в межах від 1 до 65535',
      php: 'Виберіть версію PHP для цього сайту',
      urlBaseVar: 'Використовуйте літери, цифри та підкреслення (наприклад, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Публічний тунель для ${dominio}`,
    etiqueta: 'Тунель',
    apagadoAyuda: 'Поділіться цим сайтом через тимчасове публічне посилання.',
    abriendo: 'Відкриття тунелю…',
    cerrando: 'Закриття тунелю…',
    error: 'Помилка тунелю',
    sinNginx: 'Спочатку увімкніть Nginx',
    sinCloudflared: 'Встановіть cloudflared у розділі «Служби»',
    abrirUrl: 'Відкрити публічне посилання',
    copiarUrl: 'Скопіювати публічне посилання',
    verQr: 'Показати QR-код посилання',
    qrTitulo: 'Публічне посилання на цей сайт',
    renovar: 'Оновити (нове посилання)',
    cerrar: 'Закрити тунель',
    confirmarTitulo: 'Опублікувати сайт із реальними даними',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} містить реальні дані клієнтів і буде опублікований в інтернеті через ${destino}: кожен, хто має посилання, зможе переглядати його, доки тунель відкритий. Опублікувати?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} буде опубліковано в інтернеті через Expose: кожен, хто має посилання, зможе зайти, доки тунель відкритий. Крім того, інспектор запитів Expose буде доступний для будь-якого комп’ютера у вашій локальній мережі. Опублікувати?`,
    compartir: 'Поділитися',
    confirmar: 'Опублікувати',
    confirmarPublicoTitulo: 'Опублікувати сайт в інтернеті',
    confirmarPublicoTexto: (dominio: string) =>
      `Буде відкрито публічний тунель Cloudflare для ${dominio}: кожен, хто має посилання, зможе зайти, доки тунель відкритий. Опублікувати?`,
    opciones: 'Параметри тунелю',
    opcionesDe: (dominio: string) => `Параметри тунелю для ${dominio}`,
    proveedor: 'Провайдер',
    proveedorRapido: 'Швидкий (без облікового запису)',
    proveedorRapidoAyuda: 'Посилання trycloudflare.com, яке змінюється під час кожного відкриття.',
    proveedorNombre: 'Іменований (ваш домен)',
    proveedorNombreAyuda:
      'Постійне посилання на вашому домені в Cloudflare. Потрібен обліковий запис Cloudflare.',
    cuentaConectada: 'Обліковий запис Cloudflare підключено.',
    cuentaSinConectar: 'Обліковий запис Cloudflare ще не підключено.',
    conectar: 'Підключити Cloudflare',
    conectando: 'Очікування авторизації у вашому браузері…',
    conectarAyuda:
      'Відкриється ваш браузер для авторизації WolfCore Dev у вашому обліковому записі. Сертифікат зберігається лише у вашій папці даних.',
    autorizacion: 'Авторизація Cloudflare',
    abrirAutorizacion: 'Відкрити сторінку авторизації',
    copiarAutorizacion: 'Скопіювати посилання авторизації',
    cancelarConexion: 'Скасувати',
    recrear: 'Перестворити тунель',
    olvidar: 'Забути тунель',
    recrearTitulo: 'Перестворити тунель',
    recrearTexto: (n: string) =>
      `Тунель «${n}» у Cloudflare буде видалено та створено заново з тією самою назвою. Сайти, які його використовують, буде закрито.`,
    olvidarTitulo: 'Забути тунель',
    olvidarTexto: (n: string) =>
      `Тунель «${n}» у Cloudflare та його збережені облікові дані буде видалено. Сайти, які його використовують, повернуться до швидкого тунелю.`,
    olvidarAqui: 'Забути лише тут',
    olvidarAquiTitulo: 'Забути тунель лише на цьому комп’ютері',
    olvidarAquiTexto: (n: string) =>
      `Збережені облікові дані тунелю «${n}» буде видалено з цього комп’ютера; сам тунель залишиться в Cloudflare. Сайти, які його використовують, повернуться до швидкого тунелю.`,
    desconectar: 'Від’єднати',
    nombreTunel: 'Назва тунелю',
    nombreTunelAyuda: 'Малі літери, цифри та дефіси.',
    dominioPublico: 'Публічний домен',
    dominioPublicoAyuda: 'Піддомен вашого домену в Cloudflare, напр. demo.midominio.com.',
    crear: 'Створити та спрямувати',
    guardadoNombre: 'Іменований тунель готовий. Під час відкриття буде запитано підтвердження.',
    guardadoRapido: 'Цей сайт знову використовує швидкий тунель.',
    cambiarCierra: 'Зміна провайдера закриває відкритий тунель цього сайту.',
    usarRapido: 'Використовувати швидкий тунель',
    nombreActual: (nombre: string, dominio: string) => `Тунель «${nombre}» на ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `Сайт ${dominio} буде опубліковано за адресою ${publico} через тунель Cloudflare: будь-хто з посиланням зможе зайти, доки тунель відкритий. Опублікувати?`,
    proveedorNgrokAyuda:
      'Із вашим обліковим записом ngrok. Потрібно, щоб програма ngrok уже була встановлена на цьому комп’ютері.',
    proveedorExposeAyuda:
      'Із вашим обліковим записом Expose. Потрібно, щоб Expose уже був встановлений на цьому комп’ютері; у Windows працює лише з expose.phar. Його інспектор видимий у локальній мережі, тому він не використовується для сайтів із реальними даними.',
    proveedorTailscaleAyuda:
      'Через вашу приватну мережу Tailscale. Потрібно, щоб Tailscale був встановлений і в ньому було виконано вхід.',
    tokenGuardado: (f: string) => `Токен збережено (закінчується на ${f}).`,
    tokenSinGuardar: 'Збереженого токена ще немає.',
    tokenNgrok: 'Токен ngrok',
    tokenExpose: 'Токен Expose',
    tokenAyuda:
      'Зберігається в зашифрованому вигляді на цьому комп’ютері та передається програмі лише під час відкриття тунелю; ніколи не відображається.',
    tokenPlaceholder: 'Вставте токен сюди',
    guardarToken: 'Зберегти токен',
    borrarToken: 'Видалити токен',
    usarProveedor: 'Використовувати цього провайдера',
    guardadoProveedor:
      'Провайдера збережено. Під час відкриття тунелю буде запитано підтвердження.',
    ngrokAyudaInstalacion:
      'ngrok уже має бути встановлений на цьому комп’ютері (WolfCore Dev не завантажує його, оскільки ngrok не публікує завантаження з перевіркою цілісності). Ваша глобальна конфігурація не змінюється.',
    exposeAyudaInstalacion:
      'Expose уже має бути встановлений або його файл expose.phar має міститися в папці bin/expose даних WolfCore Dev (у Windows працює лише з phar; завантаження з відбитком відсутнє). Його інспектор запитів видимий у всій локальній мережі, тому він не використовується для сайтів із реальними даними. Ваша глобальна конфігурація не змінюється.',
    tailscaleAlcance: 'Межі доступу',
    tailscaleServe: 'Serve: лише ваш tailnet',
    tailscaleServeAyuda: 'Лише пристрої у вашій мережі Tailscale. Не виходить в інтернет.',
    tailscaleFunnel: 'Funnel: увесь інтернет',
    tailscaleFunnelAyuda:
      'Будь-хто з посиланням може зайти, незалежно від того, чи є він у вашому tailnet.',
    tailscaleFunnelAviso:
      'Funnel публікує цей сайт в інтернеті: будь-хто з посиланням зможе зайти, доки він відкритий.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev не встановлює Tailscale (це системна служба): він має бути встановлений і з виконаним входом. Нічого з того, що ви вже публікуєте через Tailscale, не змінюється; сайт використовує порт HTTPS 8443.',
    confirmarTailnetTitulo: 'Надати доступ у вашому tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `Доступ до ${dominio} буде надано через Tailscale Serve: зайти зможуть лише пристрої у вашому tailnet; в інтернеті сайт не публікується. Надати доступ?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} містить реальні дані клієнтів. Через Tailscale Serve його зможуть бачити лише пристрої у вашому tailnet (в інтернеті не публікується). Надати доступ?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} буде опубліковано в інтернеті через Tailscale Funnel: будь-хто з посиланням зможе зайти, доки тунель відкритий. Опублікувати?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} буде опубліковано в інтернеті через ${proveedor}: будь-хто з посиланням зможе зайти, доки тунель відкритий. Опублікувати?`,
    tituloError: 'Не вдалося відкрити тунель',
  },
  tuneles: {
    titulo: 'Тунелі',
    descripcion: 'Тимчасові публічні посилання Cloudflare для показу сайту за межами вашої мережі.',
    explicacion:
      'Швидкі тунелі змінюють адресу щоразу під час відкриття або оновлення й працюють лише доки цей комп’ютер увімкнений і їхні процеси активні (якщо ви вийдете з WolfCore Dev, залишивши їх увімкненими, вони продовжать працювати).',
    columnas: { sitio: 'Сайт', estado: 'Стан', url: 'Посилання', acciones: 'Дії' },
    vacioTitulo: 'Немає відкритих тунелів',
    vacio: 'Увімкніть перемикач тунелю для сайту, щоб отримати публічне посилання.',
    sinNombre: 'Видалений сайт',
  },
  ajustes: {
    titulo: 'Налаштування',
    descripcion: 'Параметри середовища.',
    general: 'Загальні',
    carpetaDatos: 'Папка даних',
    carpetaDatosAyuda: 'Виконувані файли, конфігурація та журнали. Можна відкрити, але не змінити.',
    servicios: 'Служби',
    puertoNginx: 'Порт Nginx',
    puertoNginxAyuda:
      'Зазвичай 80. Якщо не 80, локальні URL міститимуть порт. Відкриті тунелі залишаються на попередньому порту: оновіть їх.',
    trabajadores: 'Робочі процеси PHP',
    trabajadoresAyuda:
      'Процеси php-cgi на версію. Більша кількість робочих процесів обробляє більше запитів одночасно.',
    nota: 'Під час збереження сайти перегенеровуються з новим портом. Якщо Nginx увімкнений, його буде перезапущено (або перезавантажено, якщо порт не змінився), а увімкнені версії PHP буде перезапущено, якщо змінилася кількість робочих процесів.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Налаштування збережено та застосовано. Перезапущено: ${reiniciados.join(', ')}.`
        : 'Налаштування збережено та застосовано.',
    errorAplicar: 'Налаштування збережено, але застосувати їх повністю не вдалося',
    errorSeccion: (detalle: string) => `Не вдалося прочитати ці дані: ${detalle}`,
    acerca: 'Про програму',
    avisos: {
      titulo: 'Сповіщення',
      descripcion:
        'Які сповіщення зберігаються у дзвіночку та чи показує Windows системне сповіщення, коли вікно поза полем зору.',
      nativas: 'Сповіщення Windows',
      nativasAyuda:
        'Лише коли WolfCore Dev не на передньому плані; щонайбільше одне кожного типу раз на 5 хв.',
      tiposTitulo: 'Типи сповіщень',
      versionesTitulo: 'Нові версії за службами',
      versionesAyuda:
        'Вимкніть службу, щоб не отримувати сповіщення про її нові версії (вкладка «Версії» і далі позначатиме оновлення).',
      versionesDe: (s: string) => `Сповіщати про нові версії ${s}`,
      tipos: {
        'servicio-caido': 'Служба зупинилася з помилкою',
        'puerto-ocupado': 'Порт зайнятий під час запуску служби',
        'certificado-por-vencer': 'Сертифікати, термін дії яких спливає',
        'tunel-caido': 'Тунель обірвався',
        'proceso-error': 'Процес проєкту завершився з помилкою',
        'proceso-terminado': 'Процес проєкту завершився',
        'receta-terminada': 'Рецепт проєкту завершився',
        doctor: 'Діагностика (Doctor)',
        'contenedor-detenido': 'Контейнер зупинився',
        'version-nueva': 'Є нова версія встановленої служби',
      } as Record<string, string>,
      errorGuardar: 'Не вдалося зберегти налаштування сповіщень',
    },
    versionPrograma: 'Версія програми',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Локальний центр сертифікації',
      autoridadAyuda:
        'WolfCore Dev підписує сертифікати ваших сайтів .test власним центром сертифікації. Він встановлюється у сховище вашого користувача Windows без прав адміністратора.',
      instalada: 'Встановлено у Windows',
      noInstalada: 'Не встановлено',
      instalar: 'Встановити центр сертифікації',
      reinstalar: 'Перевстановити',
      quitar: 'Видалити',
      instaladaOk: 'Центр сертифікації HTTPS встановлено',
      quitadaOk: 'Центр сертифікації HTTPS видалено',
      cancelado: 'Підтвердження Windows скасовано. Нічого не змінено.',
      fallo: 'Не вдалося змінити центр сертифікації HTTPS',
      quitarTitulo: 'Видалити центр сертифікації HTTPS?',
      quitarTexto:
        'Браузери перестануть довіряти сертифікатам ваших сайтів .test, доки ви не встановите його знову.',
      puerto: 'Порт HTTPS',
      puertoAyuda:
        'Зазвичай 443. Якщо його використовує інша програма, оберіть порт від 1024 до 65535; URL міститимуть порт.',
      puertoRango: 'Використовуйте 443 або число від 1024 до 65535',
      puertoGuardado: (p: number) => `HTTPS тепер використовує порт ${p}`,
      puertoAplicarFallo: 'Порт збережено, але Nginx не прийняв нову конфігурацію',
      firefox:
        'Firefox використовує власне сховище сертифікатів. Щоб він довіряв центру сертифікації, відкрийте about:config і увімкніть',
    },
    herramientas: {
      titulo: 'Термінал та інструменти',
      phpPorDefecto: 'PHP за замовчуванням',
      phpPorDefectoAyuda:
        'Версія php і composer у терміналі та в ярликах WolfCore Dev. «Термінал» використовує PHP відповідного проєкту.',
      phpMasReciente: 'Найновіша встановлена',
      phpSinInstalar: 'Встановіть PHP у розділі «Служби», щоб обрати версію',
      phpGuardado: 'PHP за замовчуванням оновлено',
      path: 'PATH користувача',
      pathAyuda:
        'Додає php і composer із WolfCore Dev до PATH вашого користувача для використання в будь-якому терміналі.',
      pathActivo: 'Додано до PATH',
      pathInactivo: 'Немає в PATH',
      pathAgregar: 'Додати до PATH користувача',
      pathQuitar: 'Видалити з PATH',
      pathTitulo: 'PATH оновлено',
      pathAviso:
        'Відкрийте новий термінал, щоб побачити зміни: уже відкриті термінали їх не бачать.',
      pathQuitarTitulo: 'Видалити WolfCore Dev із PATH?',
      pathQuitarTexto:
        'php і composer із WolfCore Dev більше не будуть доступні в нових терміналах. Уже відкриті термінали не зміняться.',
      adminer: 'Порт Adminer',
      adminerAyuda: 'Adminer обслуговується лише на цьому комп’ютері за цією фіксованою адресою.',
      terminal: 'Термінал за замовчуванням',
      terminalSistema: 'Системний (PowerShell)',
      terminalAyuda:
        'Той, який відкриває «Термінал» у проєктах. Якщо проєкту потрібні власні змінні (його PHP у PATH, ключ агента), у режимі «Windows Terminal» відкривається PowerShell у стандартному терміналі Windows: уже відкритий Windows Terminal не отримає ці змінні.',
      terminalGuardada: 'Термінал за замовчуванням оновлено',
      editor: 'Редактор за замовчуванням',
      editorPrimero: 'Перший виявлений',
      editorAyuda:
        'Той, який відкриває «Редактор» у проєктах і «Відкрити в редакторі» під час пошуку та перегляду помилок. Виявляються VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed і Notepad++.',
      editorGuardado: 'Редактор за замовчуванням оновлено',
      editorNinguno: 'Жодного редактора не виявлено.',
    },
  },
  /* ───────────── HTTPS, термінал і FTP для сайтів; Пошта; локальний ШІ ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS активний',
    candadoAyuda: 'Цей сайт також відповідає через HTTPS із сертифікатом WolfCore Dev.',
    redirige: 'Перенаправляє http → https',
    abrirHttp: (dominio: string) => `Відкрити http://${dominio} у браузері`,
    abrirHttps: (url: string) => `Відкрити ${url} у браузері`,
    pendiente: (motivo: string) => `HTTPS очікує: ${motivo}`,
    pendienteCorto: 'HTTPS очікує',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `порт ${puerto} використовує ${nombre} (PID ${pid}).`,
    sinAutoridad: 'бракує центру сертифікації. Встановіть його в Налаштуваннях.',
    pendienteAyuda:
      'Сайт і далі працює через HTTP. Закрийте цю програму або оберіть інший порт HTTPS у Налаштуваннях.',
    sinConfianza: 'Центр сертифікації не встановлено',
    sinConfianzaAyuda:
      'Браузер показуватиме попередження безпеки, доки ви не встановите центр сертифікації WolfCore Dev (Налаштування → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Також обслуговувати через HTTPS',
    httpsAyuda: 'Із власним сертифікатом для домену та його псевдонімів, підписаним WolfCore Dev.',
    redirigir: 'Перенаправляти на HTTPS',
    redirigirAyuda:
      'Відвідування через http переходять на https. На публічні тунелі це не впливає.',
    redirigirDeshabilitado: 'Спочатку увімкніть HTTPS',
    sinAutoridadTitulo: 'Центр сертифікації HTTPS не встановлено',
    sinAutoridadTexto:
      'Без нього браузер показуватиме попередження безпеки. Windows попросить підтвердити встановлення.',
    instalar: 'Встановити центр сертифікації',
    instalada: 'Центр сертифікації HTTPS встановлено',
    cancelado: 'Підтвердження Windows скасовано. Нічого не змінено.',
    fallo: 'Не вдалося встановити центр сертифікації HTTPS',
  },
  terminalSitio: {
    boton: 'Термінал',
    ayuda: 'Відкриває термінал у папці проєкту з його PHP і Composer у PATH.',
    elegir: 'Обрати термінал',
    predeterminada: 'за замовчуванням',
  },
  editorSitio: {
    ayuda: 'Відкриває папку проєкту в редакторі за замовчуванням.',
    elegir: 'Відкрити за допомогою…',
    predeterminada: 'за замовчуванням',
    sustituido: (pred: string, usado: string) =>
      '{pred} не встановлено: відкрито за допомогою {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Не вдалося відкрити редактор',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Спільний PHP ${rama}`,
    propio: (rama: string) => `Власний PHP ${rama} цього сайту`,
    conXdebug: 'Xdebug активний',
    mostrar: 'Налаштування PHP',
    ocultar: 'Сховати налаштування PHP',
    cargando: 'Читання налаштувань PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} вимкнено: власний PHP цього сайту запускається разом із ним.`,
    ajustesTitulo: 'Власний php.ini',
    ajustesAyuda: (rama: string) =>
      `Додаються до php.ini версії PHP ${rama} лише для цього сайту. Якщо задано бодай одне налаштування (або Xdebug), сайт використовує власний PHP на 1 або 2 процеси; інші сайти не змінюються.`,
    clave: 'Директива',
    valor: 'Значення',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Видалити ${clave || 'налаштування'}`,
    agregar: 'Додати налаштування',
    guardarAjustes: 'Перевірити й зберегти',
    ajustesGuardados: 'Налаштування PHP сайту застосовано',
    sinAjustes: 'Без власних налаштувань: використовується спільний php.ini без змін.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug для ${dominio}`,
    xdebugAyuda:
      'Завантажується лише у власний PHP цього сайту, ніколи у спільний PHP: інші сайти залишаються такими ж швидкими.',
    xdebugDescarga:
      'Xdebug не встановлено для цієї версії PHP: його буде завантажено з каталогу (xdebug.org, відбиток SHA-256 перевірено).',
    modo: 'Режими',
    modos: {
      debug: 'debug (точки зупинки)',
      develop: 'develop (кращі повідомлення про помилки)',
      coverage: 'coverage (покриття)',
      profile: 'profile (профілювання)',
      trace: 'trace (трасування)',
    },
    puerto: 'Порт редактора',
    inicio: 'Коли підключається',
    inicioTrigger: 'Лише з XDEBUG_TRIGGER',
    inicioYes: 'На кожному запиті',
    inicioAyuda:
      'У режимі «Лише з XDEBUG_TRIGGER» налагодження починається, коли запит містить cookie, параметр GET/POST або розширення браузера (Xdebug Helper).',
    guardarXdebug: 'Зберегти Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Порт ${puerto} уже використовується PHP або іншою службою WolfCore Dev: ваш редактор не зможе його прослуховувати. Оберіть інший (зазвичай 9003).`,
    xdebugGuardado: 'Xdebug сайту застосовано',
    quitarXdebug: 'Видалити Xdebug',
    quitarXdebugTitulo: 'Видалити Xdebug із цього сайту?',
    quitarXdebugTexto:
      'Його конфігурацію буде видалено. Якщо сайт не має інших налаштувань, він повернеться до спільного PHP. Файл launch.json проєкту не змінюється.',
    xdebugQuitado: 'Xdebug видалено із сайту',
    ide: 'Редактор',
    generarLaunch: 'Згенерувати launch.json',
    launchTitulo: '.vscode/launch.json проєкту',
    launchNuevo:
      'Буде створено .vscode/launch.json із цією конфігурацією (PHP Debug для VS Code, прослуховує лише 127.0.0.1).',
    launchFusion:
      'Файл launch.json уже існує: додається (або оновлюється) лише конфігурація WolfCore; решта записів і коментарів залишаються. Попередньо зберігається резервна копія з датою в папці даних WolfCore Dev.',
    launchSinCambios: 'У launch.json уже є ця конфігурація.',
    launchEscribir: 'Записати launch.json',
    launchCreado: 'launch.json створено в .vscode',
    launchActualizado: (respaldo: string) =>
      `launch.json оновлено. Попередня резервна копія: ${respaldo}`,
    phpStorm: 'Конфігурація для PhpStorm',
    copiarPhpStorm: 'Копіювати конфігурацію PhpStorm',
    errorNginx: (salida: string) => `Nginx не прийняв зміни; повернуто попередній стан. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Згенерований vhost',
    conReglas: 'із власними правилами',
    manualResumen: 'Vhost, написаний вручну (не перегенеровується)',
    mostrar: 'Редагувати vhost',
    ocultar: 'Сховати vhost',
    cargando: 'Читання vhost…',
    reglasTitulo: 'Власні правила',
    reglasAyuda:
      'Розміщуються всередині блока server цього сайту. Перед застосуванням перевіряються за допомогою nginx -t на копії всієї конфігурації; у разі помилки все залишається як було.',
    reglasEtiqueta: 'Власні правила Nginx',
    reglasPlaceholder: '# Наприклад: client_max_body_size 256m;',
    snippetsTitulo: 'Фрагменти',
    insertar: (titulo: string) => `Вставити: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Кешування статики',
      'limite-subida': 'Ліміт завантаження',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Заголовки безпеки',
      websocket: 'Проксі WebSocket',
      gzip: 'Стиснення gzip',
      ocultos: 'Заборонити приховані файли',
    },
    aplicar: 'Перевірити й застосувати',
    descartar: 'Скасувати зміни',
    aplicado: 'Vhost застосовано, Nginx перезавантажено',
    aplicadoApagado: 'Vhost збережено; використовуватиметься після запуску Nginx',
    fallo: 'Nginx не прийняв зміни; vhost залишився без змін',
    salidaTitulo: 'Вивід nginx -t',
    desactivado:
      'Nginx не прийняв написані вами правила для цього сайту під час застосування конфігурації, тому їх виключено з vhost (вони залишилися збереженими). Виправте їх і застосуйте знову, щоб повернути в дію.',
    avisoDestino: (destino: string, linea: number) =>
      `Рядок ${linea}: трафік спрямовується на інший комп’ютер (${destino}). Перевірте, чи це саме те, що вам потрібно.`,
    generadoTitulo: 'Згенерований vhost (лише читання)',
    avanzadoTitulo: 'Розширений режим',
    avanzadoInterruptor: 'Написати повний vhost вручну',
    avanzadoAyuda:
      'Замінює згенерований vhost. WolfCore Dev більше не перегенеровує його: якщо ви зміните домен, HTTPS, порти або папку, доведеться оновити його самостійно. Можна використовувати лише домени та порти цього сайту.',
    avanzadoActivarTitulo: 'Написати vhost вручну?',
    avanzadoActivarTexto:
      'За основу береться поточний згенерований vhost. Доки цей режим активний, зміни сайту (домен, HTTPS, PHP…) не відображаються у vhost: їх доведеться вносити самостійно.',
    avanzadoActivar: 'Написати вручну',
    manualEtiqueta: 'Повний vhost сайту',
    aplicarManual: 'Перевірити й застосувати vhost',
    volverGenerado: 'Повернутися до згенерованого vhost',
    volverGeneradoTitulo: 'Повернутися до згенерованого vhost?',
    volverGeneradoTexto:
      'Написаний вручну vhost зберігається в історії, а WolfCore Dev знову генерує vhost сайту (із вашими власними правилами).',
    historial: 'Історія',
    historialTitulo: 'Попередні версії vhost',
    historialVacio: 'Попередніх версій ще немає.',
    historialAyuda:
      'Зберігаються 10 останніх версій перед кожною зміною. Відновлення проходить таку саму перевірку за допомогою nginx -t.',
    modoReglas: 'Згенерований із правилами',
    modoManual: 'Написаний вручну',
    restaurar: 'Відновити',
    restaurarTitulo: 'Відновити цю версію?',
    restaurarTexto: (fecha: string) =>
      `Vhost повернеться до стану на ${fecha}. Поточна версія залишиться в історії.`,
    restaurado: 'Версію відновлено',
  },
  lan: {
    etiqueta: 'Локальна мережа',
    interruptor: (dominio: string) => `Надати доступ до ${dominio} у локальній мережі`,
    apagadoAyuda: 'Відкрийте цей сайт зі смартфона або іншого комп’ютера в тій самій мережі.',
    sinNginx: 'Увімкніть Nginx, щоб надати доступ до сайту в локальній мережі.',
    sinRed: 'Немає підключеної локальної мережі (Wi-Fi або Ethernet).',
    activo: 'Видимий у локальній мережі',
    abriendo: 'Надання доступу…',
    cerrando: 'Закриття доступу…',
    abrirUrl: 'Відкрити на цьому комп’ютері',
    copiarUrl: 'Копіювати адресу',
    verQr: 'Показати QR',
    qrTitulo: (dominio: string) => `${dominio} у локальній мережі`,
    qrAviso: 'Відскануйте QR-код зі смартфона, підключеного до тієї самої мережі.',
    confirmarTitulo: 'Надати доступ у локальній мережі',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} стане видимим для будь-якого пристрою, підключеного до тієї самої мережі, що й цей комп’ютер (${ip}), без запиту пароля. Доступ припиняється після вимкнення перемикача, закриття WolfCore Dev і його повторного запуску.`,
    ipEtiqueta: 'Мережа (IP цього комп’ютера)',
    https: 'Використовувати HTTPS',
    httpsAyuda:
      'Для HTTPS смартфон має довіряти CA WolfCore Dev (кнопка «Встановити CA на смартфоні»). Без цього сайт відкривається через HTTP.',
    httpsObligatorio: 'Цей сайт перенаправляє на HTTPS, тому доступ надається через HTTPS.',
    compartir: 'Надати доступ у мережі',
    tituloError: 'Не вдалося надати доступ у локальній мережі',
    caBoton: 'Встановити CA на смартфоні',
    firewallTitulo: 'Не відкривається на смартфоні?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} містить реальні дані й не відкривається для доступу в локальній мережі навіть із підтвердженням.`,
    redPublica:
      'Ця мережа позначена у Windows як загальнодоступна: брандмауер блокуватиме вхідні підключення, а команда відкриває лише приватні мережі. Позначте її як приватну, якщо це ваша довірена мережа.',
    firewallTexto:
      'WolfCore Dev не змінює правила брандмауера. Не приймайте запит Windows для всієї програми: виконайте команду для цього порту (лише локальна підмережа та лише приватні мережі) у PowerShell від імені адміністратора. У загальнодоступній мережі порт не відкриється, а наявне правило блокування має пріоритет над правилом дозволу.',
    copiarComando: 'Копіювати команду',
  },
  caMovil: {
    titulo: 'Встановити CA на смартфоні',
    intro:
      'Відскануйте QR-код зі смартфона, підключеного до тієї самої мережі, щоб завантажити сертифікат центру сертифікації WolfCore Dev. Передається лише цей файл, а посилання закривається автоматично.',
    abriendo: 'Відкриття посилання…',
    expira: (minutos: number) => `Посилання автоматично закриється через ${minutos} хв.`,
    expirado: 'Посилання закрито.',
    reabrir: 'Відкрити знову',
    android: 'Android',
    ios: 'iPhone або iPad',
    pasosAndroid: [
      'Відскануйте QR-код або відкрийте адресу в браузері смартфона та завантажте файл.',
      'Відкрийте Налаштування > Безпека та конфіденційність > Додаткова безпека > Шифрування та облікові дані > Встановити сертифікат > Сертифікат CA (назви залежать від виробника).',
      'Перш ніж довіряти, порівняйте відбиток SHA-256 сертифіката на смартфоні з відбитком у цьому вікні: якщо вони не збігаються, не встановлюйте його.',
      'Оберіть завантажений файл і прийміть попередження: це нормально, Android попереджає про будь-який CA.',
    ],
    pasosIos: [
      'Відкрийте адресу в Safari та дозвольте завантаження профілю.',
      'Відкрийте Налаштування > Завантажений профіль і порівняйте відбиток SHA-1 у деталях із відбитком у цьому вікні: якщо вони не збігаються, не встановлюйте його. Потім встановіть профіль.',
      'Відкрийте Налаштування > Загальні > Про пристрій > Довіра до сертифікатів і увімкніть повну довіру для CA WolfCore Dev.',
    ],
    aviso:
      'Встановлений CA надає довіру всьому, що він підписує на цьому смартфоні: встановлюйте його лише на власні пристрої та видаліть після завершення.',
    firewallAviso: (puerto: number) =>
      'Щоб смартфон міг відкрити посилання, потрібно відкрити порт ' +
      puerto +
      ' (лише локальна підмережа та приватні мережі). Не приймайте запит Windows для всієї програми: виконайте цю команду в PowerShell від імені адміністратора. У загальнодоступній мережі порт не відкриється, а наявне правило блокування має пріоритет.',
    huellas: 'Відбитки сертифіката',
    tituloError: 'Не вдалося відкрити посилання CA',
  },
  dialogoQr: {
    descargar: 'Завантажити PNG',
    descargado: 'QR збережено',
    largo: 'Текст занадто довгий для QR-коду.',
    generando: 'Генерація QR-коду…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Доступ FTP для ${dominio}`,
    apagadoAyuda: 'Дозвольте завантажувати файли в папку цього сайту через FTP.',
    activoAyuda: 'Доступ активний.',
    soloLecturaEtiqueta: 'лише читання',
    mostrarDatos: 'Показати дані FTP',
    ocultarDatos: 'Сховати дані FTP',
    host: 'Сервер',
    puerto: 'Порт',
    usuario: 'Користувач',
    clave: 'Пароль',
    mostrarClave: 'Показати пароль',
    ocultarClave: 'Сховати пароль',
    copiarDato: (dato: string) => `Копіювати ${dato}`,
    cargando: 'Читання даних FTP…',
    regenerar: 'Згенерувати новий пароль',
    regenerarTitulo: 'Згенерувати новий пароль FTP?',
    regenerarTexto:
      'Поточний пароль перестане працювати, а відкриті з’єднання цього сайту буде закрито. Вам доведеться оновити його у своєму FTP-клієнті.',
    regenerada: 'Пароль FTP оновлено',
    soloLectura: 'Лише читання',
    soloLecturaAyuda:
      'Можна завантажувати файли, але не можна вивантажувати, змінювати чи видаляти їх.',
    soloLecturaActivado: 'FTP цього сайту тепер доступний лише для читання',
    soloLecturaDesactivado: 'FTP цього сайту тепер дозволяє запис',
    activado: 'Доступ FTP увімкнено',
    desactivarTitulo: 'Прибрати доступ FTP для цього сайту?',
    desactivarTexto:
      'Пароль буде видалено, а відкриті з’єднання закрито. Папку сайту не буде змінено.',
    desactivar: 'Прибрати доступ',
    desactivado: 'Доступ FTP прибрано',
    redLocalAviso:
      'FTP приймає підключення з локальної мережі та передає пароль і файли без шифрування. Використовуйте його лише в довіреній мережі.',
    redLocalHost: 'або IP-адреса цього комп’ютера у вашій мережі',
    servidorApagado: 'FTP-сервер вимкнено: ніхто не зможе підключитися, доки ви його не ввімкнете.',
    encender: 'Увімкнути FTP',
    urlEtiqueta: 'Адреса',
    urlAyuda: 'Адреса не містить пароля: його буде запитано під час підключення.',
    abrirUrl: 'Відкрити у FTP-клієнті',
    copiarUrl: 'Скопіювати FTP-адресу',
    verQr: 'Показати QR-код адреси',
    qrTitulo: 'FTP-адреса цього сайту',
    qrAviso: 'Код містить лише адресу, без пароля.',
  },
  correo: {
    descripcion:
      'Перехоплювачі затримують листи, які надсилають ваші проєкти, щоб ви могли перевірити їх без виходу в інтернет. Вони слухають лише на цьому комп’ютері (127.0.0.1), і одночасно працює лише один із них.',
    seccionCaptadores: 'Локальні перехоплювачі',
    seccionProveedores: 'Віддалені SMTP-провайдери',
    proveedores: {
      descripcion:
        'Справжній SMTP-провайдер надсилає реальні листи: використовуйте його, щоб перевірити надсилання пошти з вашого проєкту перед публікацією. Пароль зберігається зашифрованим на цьому комп’ютері та ніколи не відображається.',
      agregar: 'Додати провайдера',
      vacio:
        'Ви ще не додали жодного провайдера. Оберіть Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO або Gmail, чи введіть власні дані.',
      errorLista: 'Не вдалося прочитати список провайдерів',
      tarjeta: {
        servidor: 'Сервер',
        usuario: 'Користувач',
        clave: 'Пароль',
        sinClave: 'Без пароля',
        claveIlegible: 'Збережено (не вдалося прочитати)',
        red: 'Мережа',
        redLocal: 'Сервер на цьому комп’ютері або в локальній мережі (підтверджено)',
        editar: 'Редагувати',
        borrar: 'Видалити',
        borrarTitulo: (n: string) => `Видалити ${n}?`,
        borrarTexto:
          'Провайдера та його збережений пароль буде видалено. Проєкти, які його використовують, повернуться до локального перехоплювача, але їхні файли .env не змінюються: у них залишаться змінні MAIL_* цього провайдера (і його пароль, якщо ви його записали). Перезапишіть блок пошти в кожному .env.',
        borrado: (n: string) => `${n} видалено`,
        usar: 'Використати в проєкті',
        destino: 'Адреса отримувача для тесту',
        destinoPlaceholder: 'vasha-adresa@example.com',
        probar: 'Перевірити надсилання',
        probando: 'Надсилання…',
        probarAyuda:
          'Надсилає один справжній лист на цю адресу через перевірене зашифроване з’єднання. Не частіше одного разу на 15 с.',
        sinClaveParaProbar: 'Збережіть пароль провайдера, щоб перевірити надсилання.',
        hostLocal: 'Ім’я цього сервера вказує на цей комп’ютер або локальну мережу.',
        confirmarRed: 'Підтвердити локальну мережу',
        enviado: (para: string) => `Лист надіслано на ${para}. Перевірте вашу скриньку.`,
        fallos: {
          'correo.auth': 'Провайдер відхилив ім’я користувача або пароль.',
          'correo.conexion': 'Не вдалося підключитися: перевірте хост і порт.',
          'correo.tls':
            'Зашифроване з’єднання недійсне (сертифікат, ім’я або STARTTLS). Нічого не надіслано.',
          'correo.rechazado':
            'Сервер відхилив повідомлення або адресу. Перевірте відправника: багато провайдерів приймають лише підтвердженого відправника або домен.',
          'correo.plazo': 'Сервер не відповів вчасно (20 с).',
        },
      },
      dialogo: {
        nuevo: 'Додати SMTP-провайдера',
        editar: (n: string) => `Редагувати ${n}`,
        preset: 'Провайдер',
        presetOtro: 'Інший (ввести дані вручну)',
        presetAyuda: 'Хост і порт взято з офіційної документації кожного провайдера.',
        documentacion: 'Переглянути документацію',
        region: 'Регіон',
        nombre: 'Назва',
        nombreObligatorio: 'Введіть назву.',
        host: 'Сервер (хост)',
        hostAyuda: 'Лише ім’я або IP-адреса, без smtp:// і порту.',
        hostObligatorio: 'Введіть сервер.',
        puerto: 'Порт',
        seguridad: 'Шифрування',
        seguridadAyuda:
          'Завжди вимагається зашифроване з’єднання з дійсним сертифікатом: перехід на відкритий текст ніколи не допускається.',
        tls: 'Прямий TLS (порт 465)',
        starttls: 'STARTTLS (порт 587)',
        usuario: 'Користувач',
        usuarioObligatorio: 'Введіть користувача.',
        usuarioFijoAyuda:
          'Цей провайдер завжди використовує цього користувача; пароль — від вашого облікового запису.',
        clave: 'Пароль SMTP',
        claveGuardada: (f: string) => `Збережено: ••••${f}`,
        claveNueva: 'Введіть пароль, щоб зберегти його',
        claveAyuda:
          'Зберігається зашифрованим на цьому комп’ютері та більше ніколи не відображається. Залиште поле порожнім, щоб не змінювати його.',
        remitente: 'Відправник для тесту (необов’язково)',
        remitenteAyuda:
          'Багато провайдерів надсилають листи лише від підтвердженого відправника або домену. Якщо залишити поле порожнім, відправником буде сама адреса отримувача.',
        claveSinEspacios:
          'Вставте пароль саме так, як його надає провайдер: внутрішні пробіли зберігаються.',
        borrarClave: 'Видалити пароль',
        borrarClaveTitulo: (n: string) => `Видалити пароль для ${n}?`,
        borrarClaveTexto: 'Збережений пароль буде видалено. Провайдер залишиться у списку.',
        claveBorrada: 'Пароль видалено',
        guardar: 'Зберегти',
        guardado: (n: string) => `${n} збережено`,
        redLocalTitulo: 'Сервер на цьому комп’ютері або в локальній мережі',
        redLocalTexto: (h: string) =>
          `${h} вказує на цей комп’ютер або локальну мережу. WolfCore Dev підключається туди лише після вашого підтвердження. Це ваш сервер?`,
        redLocalConfirmar: 'Так, це мій сервер',
        cambiaTitulo: 'Надіслати пароль на інший сервер',
        cambiaTexto: (h: string) =>
          `У цього провайдера є збережений пароль, але сервер або користувача було змінено. Пароль буде надіслано на ${h}. Продовжити?`,
        cambiaConfirmar: 'Так, продовжити',
      },
      env: {
        titulo: (n: string) => `Використати ${n} у проєкті`,
        proyecto: 'Проєкт',
        sinProyectos: 'Проєктів ще немає.',
        yaUsaSmtp: 'Цей проєкт уже надсилає пошту через SMTP-провайдера.',
        volverCaptador: 'Повернутися до локального перехоплювача',
        volvio: (n: string) =>
          `${n} знову надсилає листи до локального перехоплювача, але його .env не змінено: у ньому залишилися змінні MAIL_* провайдера (і його пароль, якщо ви його записали). Перезапишіть блок пошти.`,
        incluirClave: 'Також записати пароль у .env',
        incluirClaveAyuda:
          'Якщо не позначено, блок не міститиме MAIL_PASSWORD і ви додасте його вручну.',
        sinClaveGuardada: 'У цього провайдера немає збереженого пароля.',
        vista: 'Зміни у .env (пароль приховано)',
        textoPlano:
          'Пароль буде збережено у відкритому тексті у файлі .env проєкту. Будь-хто, хто має доступ до цієї папки або до вашого репозиторію, якщо ви його опублікуєте, зможе його прочитати.',
        claveTitulo: 'Записати пароль у .env',
        claveTexto:
          'Пароль зберігається у відкритому тексті у файлі .env проєкту. Використовуйте це лише якщо проєкт не завантажується до репозиторію, а папка належить лише вам.',
        claveConfirmar: 'Розумію, додати пароль',
        agregarGitignore: 'Додати .env до .gitignore',
        gitignoreTitulo: 'Змінити .gitignore',
        gitignoreTexto:
          'До файлу .gitignore проєкту буде додано рядок .env (із попередньою резервною копією).',
        gitignoreConfirmar: 'Додати',
        versionadoTitulo: 'Git уже відстежує .env',
        versionadoTexto:
          'Наступний коміт завантажить ваші значення. Приберіть файл з індексу командою git rm --cached .env.',
        desconocidoTitulo: 'Не вдалося перевірити git',
        desconocidoTexto: 'Не вдалося визначити, чи відстежує git файл .env цього проєкту.',
        aceptarVersionado: 'Усе одно записати',
        aceptarTitulo: 'Записати у відстежуваний .env',
        aceptarTexto:
          'Якщо git відстежує .env, ці змінні можуть потрапити до репозиторію. Усе одно записати?',
        aceptarConfirmar: 'Усе одно записати',
        confirmarTitulo: 'Записати у .env',
        confirmarTexto: (ruta: string) =>
          `Буде збережено копію ${ruta} і додано змінні MAIL_* без пароля.`,
        confirmarTextoClave: (ruta: string) =>
          `Буде збережено копію ${ruta} і додано змінні MAIL_* разом із паролем у відкритому тексті.`,
        confirmar: 'Записати',
        escribir: 'Записати у .env',
        escrito: (n: string) => `${n} тепер надсилає пошту через цього провайдера`,
      },
    },
    estado: 'Стан',
    smtp: 'SMTP',
    buzon: 'Вебскринька',
    abrirBuzon: 'Відкрити скриньку',
    noLeidos: 'Непрочитані',
    noLeidosValor: (n: number) =>
      plural(n, 'непрочитаний лист', 'непрочитані листи', 'непрочитаних листів'),
    noLeidosError: 'Не вдалося прочитати скриньку',
    actualizar: 'Перерахувати листи',
    actualizaSolo: 'Оновлюється кожні 15 секунд, доки відкрито цей екран.',
    env: 'Блок для .env у Laravel',
    envAyuda: (captador: string) =>
      `Вставте у .env вашого проєкту. Листи залишаються в ${captador}, без шифрування та без користувача.`,
    copiarEnv: 'Скопіювати блок',
    irAServicios: 'Перейти до Служб',
    cargando: 'Зчитування перехоплювачів…',
    errorLista: 'Не вдалося прочитати список перехоплювачів',
    captador: {
      opcional: 'Необов’язково',
      elegido: 'Приймає пошту ваших проєктів',
      noInstalado: 'Не встановлено',
      instalar: 'Встановити',
      usar: 'Використати цей',
      apagar: 'Вимкнути',
      iniciando: 'Запуск…',
      avisoMantenimiento:
        'Цей перехоплювач майже не підтримується. Краще оберіть Mailpit або smtp4dev.',
    },
    notaDescartados:
      'MailHog і MailDev не пропонуються: MailHog не публікує контрольну суму для перевірки завантаження, а MailDev існує лише в npm. Без перевіреної контрольної суми нічого не завантажується.',
    notaHost:
      'Вебскриньки відповідають лише на 127.0.0.1, але поки перехоплювач увімкнено, шкідлива вебсторінка може спробувати прочитати вашу скриньку (DNS rebinding). smtp4dev і Papercut відхиляють сторонні заголовки Host; Mailpit обслуговує скриньку за секретним шляхом, унікальним для цього комп’ютера (WolfCore Dev відкриває цю адресу за вас); Inbucket не має жодного захисту — вимикайте його, коли не використовуєте.',
  },
  ia: {
    descripcion:
      'Хмарні ШІ-провайдери та локальні моделі з Ollama. Ключі зберігаються зашифрованими на цьому комп’ютері та ніколи не відображаються.',
    nube: {
      titulo: 'Хмарний ШІ',
      agregar: 'Додати провайдера',
      vacio:
        'Ви ще не додали жодного провайдера. Додайте OpenAI, Anthropic, Gemini, Hermes (Nous) або провайдера, сумісного з OpenAI.',
      errorLista: 'Не вдалося прочитати список провайдерів',
    },
    local: { titulo: 'Локальний ШІ (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Сумісний з OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Ключ',
      sinClave: 'Без ключа',
      claveIlegible: 'Збережено (не вдалося прочитати)',
      url: 'Базова URL-адреса',
      modeloPorDefecto: 'Модель за замовчуванням',
      ninguno: 'Немає',
      probarConexion: 'Перевірити з’єднання',
      probarConexionAyuda: 'Отримує список моделей провайдера. Не витрачає токени.',
      probando: 'Перевірка…',
      conectado: (ms: number, n: number) =>
        `Підключено · ${ms} мс · ${plural(n, 'модель', 'моделі', 'моделей')}`,
      verModelos: (n: number) => `Переглянути ${plural(n, 'модель', 'моделі', 'моделей')}`,
      soloGratuitos: 'Лише безкоштовні',
      fallo: 'Не вдалося підключитися',
      probarMensaje: 'Надіслати тестове повідомлення',
      probarMensajeAyuda:
        'Надсилає коротке фіксоване повідомлення, щоб переконатися, що модель відповідає. Витрачає кілька токенів.',
      elegirModelo: 'Модель для повідомлення',
      sinModelo: 'Перевірте з’єднання або задайте модель за замовчуванням, щоб обрати її.',
      enviando: 'Надсилання…',
      respuesta: (ms: number) => `Відповідь за ${ms} мс`,
      tokens: (entrada: number, salida: number) =>
        `${plural(entrada, 'вхідний токен', 'вхідні токени', 'вхідних токенів')}, ${plural(salida, 'вихідний', 'вихідні', 'вихідних')}`,
      usar: 'Використати в проєкті',
      editar: 'Редагувати',
      borrar: 'Видалити',
      acciones: (nombre: string) => `Дії для ${nombre}`,
    },
    costo: {
      titulo: 'Надіслати тестове повідомлення',
      texto: (modelo: string, proveedor: string) =>
        `Буде надіслано коротке фіксоване повідомлення до моделі ${modelo} провайдера ${proveedor}. Це витрачає токени вашого облікового запису: відповідь обмежено 16 токенами, що зазвичай коштує частки цента.`,
      enviar: 'Надіслати повідомлення',
    },
    dialogo: {
      nuevo: 'Додати ШІ-провайдера',
      editar: (nombre: string) => `Редагувати ${nombre}`,
      tipo: 'Тип',
      preset: 'Сумісний провайдер',
      presetAyuda: 'Заповнює назву та URL; ви можете змінити їх.',
      presetOtro: 'Інший',
      documentacion: 'Переглянути документацію',
      nombre: 'Назва',
      urlBase: 'Базова URL-адреса',
      urlAyuda: 'Порожньо = офіційна. Лише https:// або http:// на 127.0.0.1 чи [::1] (LM Studio).',
      urlObligatoria: 'Введіть базову URL-адресу сумісного провайдера.',
      modelo: 'Модель за замовчуванням (необов’язково)',
      modeloAyuda: 'Використовується в блоці .env (AI_MODEL) і для тестового повідомлення.',
      clave: 'API-ключ',
      claveNueva: 'Вставте ключ',
      claveGuardada: (final: string) =>
        `Ключ уже збережено (${final}). Введіть інший лише якщо хочете замінити його.`,
      claveAyuda:
        'Зберігається зашифрованим на цьому комп’ютері та більше ніколи не відображається. Видно лише останні 4 символи.',
      claveOpcional: 'Необов’язково для локальних серверів (LM Studio).',
      borrarClave: 'Видалити ключ',
      guardar: 'Зберегти',
      guardado: (nombre: string) => `${nombre} збережено`,
      urlCambiaTitulo: 'Ключ буде надіслано на іншу URL-адресу',
      urlCambiaTexto: (url: string) =>
        `У цього провайдера є збережений ключ. Відтепер він надсилатиметься на ${url}. Підтвердьте лише якщо довіряєте цьому серверу.`,
      urlCambiaConfirmar: 'Надіслати ключ на нову URL-адресу',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Видалити ключ для ${nombre}?`,
      claveTexto:
        'Ключ буде видалено з цього комп’ютера. Файли .env, у які ви його записали, не змінюються: оновіть його там також, якщо відкликаєте ключ.',
      proveedorTitulo: (nombre: string) => `Видалити ${nombre}?`,
      proveedorTexto:
        'Провайдера та його збережений ключ буде видалено. Файли .env ваших проєктів не змінюються.',
      respaldos: (n: number) =>
        `Також видалити копії .env ${plural(n, 'проєкту', 'проєктів', 'проєктів')}, які містять цей ключ у відкритому тексті`,
      respaldosAyuda:
        'WolfCore Dev зберігає резервні копії .env перед записом за межами проєктів. Їх видалення неможливо скасувати.',
      claveBorrada: 'Ключ видалено',
      proveedorBorrado: (nombre: string) => `${nombre} видалено`,
      respaldosBorrados: (n: number) =>
        `Видалено копії .env ${plural(n, 'проєкту', 'проєктів', 'проєктів')}`,
    },
    env: {
      titulo: (nombre: string) => `Використати ${nombre} у проєкті`,
      proyecto: 'Проєкт',
      sinProyectos: 'Немає доданих проєктів.',
      modelo: 'Модель (AI_MODEL)',
      modeloAyuda: 'Необов’язково. Оберіть зі списку або введіть вручну.',
      vista: 'Блок, який буде записано у .env (ключ приховано)',
      cargando: 'Підготовка попереднього перегляду…',
      textoPlano:
        'Ключ буде збережено у відкритому тексті у файлі .env проєкту. Будь-хто з доступом до цієї папки зможе його прочитати.',
      copiaPrevia:
        'Поточний .env попередньо копіюється за межі проєкту (у папку даних WolfCore Dev).',
      sinClave: 'Цьому провайдеру потрібен ключ: збережіть його перед використанням у проєкті.',
      gitignoreFalta: 'Файл .gitignore проєкту не ігнорує .env.',
      gitignoreNoExiste: 'У проєкті немає файлу .gitignore.',
      gitignoreOk: 'Файл .gitignore уже ігнорує .env.',
      agregarGitignore: 'Додати .env до .gitignore',
      gitignoreTitulo: 'Змінити .gitignore',
      gitignoreTexto:
        'До .gitignore проєкту буде додано рядок .env (або створено цей файл) із попередньою резервною копією.',
      gitignoreConfirmar: 'Додати до .gitignore',
      versionadoTitulo: 'Git уже відстежує .env цього проєкту',
      versionadoTexto:
        'Навіть якщо файл є в .gitignore, наступний коміт завантажить ключ. Перед записом приберіть його з індексу та зробіть коміт:',
      desconocidoTitulo: 'Не вдалося перевірити, чи відстежує git файл .env',
      desconocidoTexto:
        'Git не відповів (не встановлено або папка не є довіреною). Якщо .env уже в репозиторії, наступний коміт завантажить ключ. Перевірте командою:',
      aceptarVersionado: 'Я розумію ризик: усе одно записати ключ',
      aceptarTitulo: 'Записати, навіть якщо git може завантажити ключ',
      aceptarTexto:
        'Якщо .env є в репозиторії, ключ потрапить у наступний коміт та історію змін. Робіть це лише якщо ви вже виконали git rm --cached .env або репозиторій належить лише вам.',
      aceptarConfirmar: 'Приймаю ризик',
      conflictoTitulo: 'Файл .env уже визначає ці змінні з іншими значеннями',
      reemplazar: (claves: string) => `Замінити ${claves}`,
      reemplazarTitulo: 'Замінити змінні у .env',
      reemplazarTexto: (claves: string) =>
        `Рядки ${claves}, які вже є у .env, буде видалено, а натомість залишаться значення з блоку WolfCore Dev. Попередній .env буде збережено як копію.`,
      reemplazarConfirmar: 'Замінити',
      escribir: 'Записати у .env',
      confirmarTitulo: 'Записати ключ у відкритому тексті',
      confirmarTexto: (carpeta: string) =>
        `Ключ буде записано без шифрування в ${carpeta}. Не діліться цим файлом і не завантажуйте його в репозиторій.`,
      confirmar: 'Записати ключ',
      escrito: (proyecto: string) => `Блок ШІ записано у .env проєкту ${proyecto}`,
      copiarComando: 'Скопіювати команду',
    },
  },
  iaLocal: {
    descripcion:
      'Мовні моделі, які працюють на вашому комп’ютері через Ollama. Використовуйте їх у своїх проєктах без передавання даних в інтернет.',
    sinInstalarTitulo: 'Ollama не встановлено',
    sinInstalar:
      'Встановіть його в розділі Служби, щоб завантажувати та використовувати моделі на своєму комп’ютері.',
    irAServicios: 'Перейти до Служб',
    apagadoTitulo: 'Ollama вимкнено',
    apagado: 'Увімкніть його, щоб переглядати, завантажувати та тестувати моделі.',
    iniciando: 'Ollama запускається…',
    errorTitulo: 'Не вдалося запустити Ollama',
    encender: 'Увімкнути Ollama',
    verServicios: 'Переглянути у Службах',
    modelos: 'Встановлені моделі',
    sinModelos: 'Моделей ще немає. Завантажте одну нижче.',
    errorModelos: 'Не вдалося прочитати список моделей',
    recargar: 'Оновити список',
    total: (n: number) => plural(n, 'модель', 'моделі', 'моделей'),
    espacio: 'Використаний простір',
    espacioAyuda: 'Скільки місця займають усі моделі в папці даних.',
    probarDe: (modelo: string) => `Перевірити ${modelo}`,
    borrarDe: (modelo: string) => `Видалити ${modelo}`,
    borrarTitulo: (modelo: string) => `Видалити модель ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `Звільниться ${tamano} на диску. Щоб знову її використовувати, доведеться завантажити її повторно.`,
    borrado: (modelo: string) => `Модель ${modelo} видалено`,
    descargar: {
      titulo: 'Завантажити модель',
      campo: 'Назва моделі',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda:
        'Введіть назву, яку використовує Ollama (ollama.com/library), або оберіть одну з пропозицій.',
      sugerenciaAyuda: {
        'llama3.2': 'Загальний чат, легка',
        'qwen2.5-coder': 'Програмування',
        mistral: 'Загальний чат',
        'nomic-embed-text': 'Ембединги для пошуку (боти)',
      } as Record<string, string>,
      boton: 'Завантажити',
      invalido: 'Використовуйте літери, цифри та символи . _ : / - (наприклад, llama3.2)',
      yaInstalado: 'Цю модель уже встановлено',
      enCurso: 'Ця модель уже завантажується',
      confirmarTitulo: (modelo: string) => `Завантажити ${modelo}?`,
      confirmar: 'Завантажити',
    },
    progreso: {
      fases: {
        preparando: 'Підготовка…',
        descargando: 'Завантаження',
        verificando: 'Перевірка',
        guardando: 'Збереження',
        listo: 'Готово',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} із ${total}`,
      cancelarDe: (modelo: string) => `Скасувати завантаження ${modelo}`,
      cancelando: 'Скасування…',
      listo: (modelo: string) => `${modelo} завантажено`,
      cancelado: (modelo: string) => `Завантаження ${modelo} скасовано`,
      error: (modelo: string) => `Не вдалося завантажити ${modelo}`,
      descartar: 'Приховати',
      descartarDe: (modelo: string) => `Приховати сповіщення для ${modelo}`,
    },
    prueba: {
      titulo: 'Перевірити модель',
      modelo: 'Модель',
      elegir: 'Оберіть модель',
      prompt: 'Повідомлення',
      placeholder: 'Введіть коротке запитання та натисніть Enter',
      enviar: 'Надіслати',
      respuesta: 'Відповідь',
      pensando:
        'Модель відповідає… першого разу це може зайняти трохи часу під час завантаження в пам’ять.',
      vacia: '(Модель не повернула текст.)',
      sinModelos: 'Завантажте модель, щоб перевірити її.',
    },
    conexion: {
      titulo: 'Підключення з ваших проєктів',
      base: 'Базова URL-адреса Ollama',
      openai: 'Кінцева точка, сумісна з OpenAI',
      env: 'Блок для файлу .env',
      envAyuda:
        'Підходить для Laravel або бота на FastAPI. WolfCore Dev не змінює файли ваших проєктів.',
      copiarEnv: 'Скопіювати блок',
      copiarDato: (dato: string) => `Скопіювати ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code і Codex зможуть підключатися до цих моделей в один клік на Етапі B.',
  },
  proyectos: {
    titulo: 'Проєкти',
    descripcion:
      'Кожен проєкт — це папка зі своїм сайтом .test, сценарієм встановлення та процесами.',
    agregar: 'Додати проєкт',
    vacioTitulo: 'Проєктів ще немає',
    vacio:
      'Клонуйте репозиторій із GitHub або оберіть папку: WolfCore Dev визначить тип проєкту та підготує його крок за кроком.',
    pasos: {
      porTipo: {
        'composer-install': 'Встановити залежності PHP (composer install)',
        'env-crear': 'Створити файл .env',
        'key-generate': 'Згенерувати ключ застосунку',
        'bd-crear': 'Створити базу даних',
        'bd-restaurar': 'Відновити резервну копію',
        migrar: 'Виконати міграції бази даних',
        'storage-link': 'Створити посилання storage (storage:link)',
        'npm-ci': 'Встановити залежності Node (npm ci)',
        'npm-build': 'Зібрати ресурси (npm run build)',
        'python-venv': 'Створити віртуальне середовище (.venv)',
        'pip-install': 'Встановити залежності Python (pip)',
        'pgvector-activar': 'Увімкнути pgvector у базі даних',
        'sitio-crear': 'Створити сайт',
        comando: 'Команда проєкту',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Створити сайт ${dominio}` : 'Створити сайт'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Відновити резервну копію ${archivo}` : 'Відновити резервну копію',
      migrar: 'Виконати міграції бази даних',
      migrarSemilla: 'Виконати міграції бази даних і завантажити тестові дані (--seed)',
      comando: (linea: string) => (linea ? `Виконати: ${linea}` : 'Команда проєкту'),
    },
    estadoPaso: {
      pendiente: 'Очікує',
      corriendo: 'Виконується',
      listo: 'Готово',
      error: 'Помилка',
      omitido: 'Пропущено',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Не підготовлено',
      corriendo: 'Підготовка…',
      lista: 'Підготовлено',
      error: 'Один із кроків завершився з помилкою',
      cancelada: 'Підготовку скасовано',
      incompleta: 'Підготовку не завершено',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Додати проєкт',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Папка' },
      destino: 'Папка призначення',
      destinoAyuda: (base: string) =>
        `Клонується в ${base}. Для іншого розташування скористайтеся «Обрати папку…».`,
      nombreCarpeta: 'Назва папки',
      nombrePlaceholder: 'miy-proyekt',
      elegirDestino: 'Обрати папку…',
      destinoPorDefecto: 'Використати папку проєктів',
      clonar: 'Клонувати',
      clonando: 'Клонування…',
      clonado: 'Репозиторій клоновано',
      errorClonar: 'Не вдалося клонувати репозиторій',
      sinCancelar:
        'Клонування не можна перервати звідси: дочекайтеся завершення (це може зайняти кілька хвилин).',
      sinGit: 'Git не встановлено. Встановіть його (git-scm.com) і знову відкрийте це вікно.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Підключено через GitHub CLI як ${usuario}` : 'Підключено через GitHub CLI',
      estadoToken: 'Підключено за допомогою персонального токена',
      estadoNinguna: 'Немає підключення до GitHub',
      ayudaNinguna:
        'Увійдіть через GitHub CLI (рекомендовано) або використайте персональний токен із точними правами на читання вмісту.',
      instalarGh: 'Встановити GitHub CLI',
      instalandoGh: 'Встановлення GitHub CLI…',
      ghInstalado: 'GitHub CLI встановлено. Тепер увійдіть у систему.',
      iniciarSesion: 'Увійти',
      sesionAbierta: 'Відкрито вікно для входу. Після завершення натисніть «Перевірити знову».',
      comprobar: 'Перевірити знову',
      usarToken: 'Використати токен',
      token: 'Персональний токен GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Зберігається в зашифрованому вигляді на цьому комп’ютері й ніколи більше не показується та не записується у проєкти.',
      guardarToken: 'Зберегти токен',
      tokenGuardado: 'Токен збережено',
      quitarToken: 'Видалити токен',
      tokenQuitado: 'Токен видалено',
      buscar: 'Пошук репозиторіїв',
      cargando: 'Завантаження репозиторіїв…',
      sinRepos: 'Репозиторіїв не знайдено.',
      cargarMas: 'Завантажити ще',
      privado: 'Приватний',
      yaClonado: 'Уже клоновано',
      yaClonadoAyuda: 'Уже існує проєкт із цим репозиторієм або в його цільовій папці.',
      actualizado: (fecha: string) => `Оновлено ${fecha}`,
      elegir: 'Обрати',
      errorRepos: 'Не вдалося прочитати список репозиторіїв',
    },
    url: {
      etiqueta: 'URL репозиторію',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:шлях або користувач/проєкт (GitHub). Без імені користувача й пароля в URL.',
      invalida: 'Використовуйте https://…, git@host:шлях або користувач/проєкт',
    },
    carpeta: {
      titulo: 'Проєкт, який уже є на комп’ютері',
      texto: 'Оберіть папку: тип проєкту визначиться автоматично, і буде запропоновано рецепт.',
      elegir: 'Обрати папку',
      manual: 'Додати без рецепта (ручне налаштування)',
      yaEsProyecto: (nombre: string) => `Ця папка вже є проєктом ${nombre}.`,
      vigilarTitulo: 'Папка під наглядом',
      vigilarTexto:
        'WolfCore Dev сповіщає, коли з’являється нова папка, схожа на проєкт. Також сюди клонуються репозиторії.',
      vigilando: (carpeta: string) => `Під наглядом: ${carpeta}`,
      sinVigilar: 'Жодна папка не перебуває під наглядом.',
      vigilar: 'Обрати папку для нагляду',
      cambiarVigilada: 'Змінити',
      dejarDeVigilar: 'Припинити нагляд',
    },
    asistente: {
      titulo: (nombre: string) => `Підготувати ${nombre}`,
      cargando: 'Аналіз проєкту…',
      origenYml: 'Рецепт узято з wolfcore.yml у репозиторії.',
      origenDefecto: 'Рецепт запропоновано відповідно до типу проєкту.',
      deteccion: 'Що виявлено',
      deteccionAyuda: 'Виправте, якщо щось не відповідає проєкту.',
      tipo: 'Тип',
      php: 'PHP',
      phpNinguno: 'Жодного не встановлено',
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
      versionAuto: 'Виявлена автоматично',
      servicios: 'Служби',
      serviciosNinguno: 'Жодної',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Виявлено: ${v}`,
      nodeInstalar: 'Node не встановлено: встановіть його в розділі «Служби».',
      pythonInstalar: 'Python не встановлено: встановіть його в розділі «Служби».',
      lenguajeInstalar: (nombre: string) =>
        `${nombre} не встановлено: встановіть у розділі «Служби».`,
      dominio: 'Домен',
      puertoProxy: 'Локальний порт',
      puertoPlaceholder: '8000',
      receta: 'Кроки',
      recetaAyuda:
        'Виконуються по черзі. Вимкніть непотрібні; необов’язкові кроки можна переміщувати.',
      subir: 'Угору',
      bajar: 'Униз',
      fijo: 'Цей крок є обов’язковим',
      restaurar: 'Відновити з резервної копії…',
      cambiarRespaldo: 'Змінити резервну копію',
      quitarRespaldo: 'Прибрати резервну копію',
      sobrescribir: 'Перезаписати базу даних, якщо вона вже містить таблиці',
      semilla: 'Завантажити тестові дані (--seed)',
      sinMotor:
        'Немає бази даних: оберіть рушій у розділі «Служби», щоб створити її або відновити з резервної копії.',
      confio: 'Я довіряю цьому репозиторію: виконати його кроки встановлення',
      confioAyuda:
        'Кроки запускають програми проєкту (composer, npm, pip, міграції) на вашому комп’ютері. Позначайте лише якщо знаєте цей код.',
      montar: 'Розгорнути проєкт',
      montando: 'Розгортання проєкту…',
      reintentar: 'Повторити',
      omitir: 'Пропустити',
      cancelar: 'Скасувати',
      cancelando: 'Скасування…',
      cerrar: 'Закрити',
      cerrarCorriendo: 'Сховати (продовжує роботу у фоні)',
      abrirSitio: 'Відкрити сайт',
      verRegistro: 'Переглянути журнал',
      ocultarRegistro: 'Сховати журнал',
      listo: 'Проєкт готовий до роботи.',
      fallo: (paso: string) =>
        `Помилка: ${paso}. Повторіть спробу, пропустіть крок або скасуйте; нічого не було скасовано.`,
      cancelada: 'Підготовку скасовано. Ви можете продовжити її з картки проєкту.',
      incompleta: 'Залишилися невиконані кроки.',
      errorCrear: 'Не вдалося створити проєкт',
      errorReceta: 'Не вдалося прочитати рецепт',
      recetaCambio:
        'Рецепт проєкту (wolfcore.yml) змінився відтоді, як ви йому довірили. «Повторити» використає збережений рецепт із минулого разу.',
      recargar: 'Переглянути новий рецепт',
      seguirGuardada: 'Продовжити зі збереженим',
      soloLectura:
        'Тип, PHP, домен, версії та порт належать проєкту: змініть їх через «Редагувати».',
    },
    tarjeta: {
      receta: 'Підготовка',
      reinstalar: 'Перевстановити залежності',
      reinstalarTitulo: (nombre: string) => `Виконати рецепт для ${nombre}?`,
      reinstalarTexto:
        'Повторюються кроки останньої підготовки (ті, які ви переглядали в майстрі):',
      noRestaura: 'повторно не відновлюється',
      recetaCambio:
        'Рецепт проєкту (wolfcore.yml) змінився відтоді, як ви йому довірили. «Перевстановити» повторює збережений; натисніть «Переглянути рецепт», щоб перевірити новий.',
      revisarReceta: 'Переглянути рецепт',
      preparar: 'Підготувати…',
      ejecutar: 'Виконати',
      verPreparacion: 'Переглянути підготовку',
      sinConfianza:
        'Перегляньте рецепт і позначте «Я довіряю цьому репозиторію» в майстрі, щоб виконати його.',
      runtimes: 'Сповіщення про версії',
      verRegistros: 'Переглянути журнали',
      abrirAgente: 'Відкрити ШІ-агента',
      vscode: 'Редактор',
      vscodeAyuda: 'Відкрити папку проєкту в редакторі за замовчуванням',
      vscodeError: 'Не вдалося відкрити редактор',
      baseDatos: 'База даних',
      baseDatosAyuda: (base: string) =>
        `Відкрити базу «${base}» з автоматичним входом (Adminer або phpMyAdmin)`,
      baseDatosSinDetectar: 'Відкрити базу даних проєкту (Adminer або phpMyAdmin)',
      sinBase: 'У .env проєкту не вказано базу MySQL, MariaDB або PostgreSQL.',
      adminerNoListo: 'Adminer не готовий',
      entradaAutomatica: 'Вхід виконується автоматично, без введення пароля.',
      elegirBd: 'Обрати Adminer або phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (лише MySQL і MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin не готовий',
      entroComoAdmin: (usuario: string) =>
        `Вхід виконано як ${usuario} (адміністратор сервера), оскільки цей проєкт не використовує власного користувача. У менеджері .env опція «Використовувати власного користувача» створить обліковий запис, обмежений його базою.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Вхід виконано як ${usuario} (адміністратор сервера): пароль власного користувача цього проєкту не збережено на цьому комп’ютері. У менеджері .env опція «Використовувати власного користувача» згенерує новий.`,
      abrirSitio: 'Відкрити сайт у браузері',
      github: 'Репозиторій',
      abrirRemoto: (url: string) => `Відкрити ${url}`,
      confiado: 'Довірений',
      confiadoAyuda: 'Його кроки встановлення можна виконувати.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'від’єднаний HEAD',
      cambios: (n: number) =>
        plural(n, 'незбережена зміна', 'незбережені зміни', 'незбережених змін'),
      limpio: 'Без змін',
      atras: (n: number) => `${n} до отримання`,
      adelante: (n: number) => `${n} до надсилання`,
      traer: 'Отримати зміни',
      traerAyuda:
        'git pull без злиття: якщо є локальні зміни або розбіжні гілки, нічого не змінює.',
      alDia: 'Уже актуально.',
      actualizado: 'Зміни отримано',
      sugeridosTitulo: 'Зміни отримано',
      sugeridosTexto: 'З огляду на зміни, варто виконати такі кроки:',
      sugeridosNinguno: 'Жодних додаткових кроків виконувати не потрібно.',
      migracionesNuevas: (n: number) =>
        plural(n, 'нова міграція', 'нові міграції', 'нових міграцій'),
      ejecutarSugeridos: 'Виконати кроки',
      corridaTitulo: 'Кроки після отримання змін',
      corridaAyuda: 'Не змінює збережений рецепт проєкту.',
      ahoraNo: 'Не зараз',
      errorEstado: 'Не вдалося прочитати стан Git',
      commitIa: {
        boton: 'Запропонувати коміт',
        ayuda:
          'Пропонує за допомогою ШІ повідомлення для підготовлених змін (git add) і виконує коміт, якщо ви погодитеся.',
        titulo: 'Коміт із запропонованим повідомленням',
        proveedor: 'Постачальник ШІ',
        modelo: 'Модель',
        sinProveedores:
          'Налаштуйте хмарного постачальника ШІ (екран «ШІ»), щоб отримувати пропозиції повідомлень.',
        privacidad:
          'Постачальнику надсилається diff підготовлених змін без .env, ключів, сертифікатів, файлів облікових даних і бінарних файлів, максимум 20 000 символів. Витрачає небагато токенів.',
        sugerir: 'Запропонувати повідомлення',
        mensaje: 'Повідомлення (можна відредагувати)',
        commit: 'Зробити коміт',
        commitAyuda: 'Лише підготовлені зміни (git add): файли не додаються і push не виконується.',
        hecho: 'Коміт створено з підготовлених змін.',
      },
    },
    procesos: {
      titulo: 'Процеси',
      /** Повідомлення супервізора для процесу без перезапуску, який завершився з кодом 0. */
      terminado: 'Завершився без помилок',
      ninguno: 'Немає процесів. Додайте npm run dev, queue:work, uvicorn…',
      agregar: 'Додати процес',
      editar: 'Редагувати процес',
      nuevo: 'Новий процес',
      interruptor: (nombre: string) => `Увімкнути або вимкнути ${nombre}`,
      proxy: 'Проксі',
      proxyAyuda: 'Nginx спрямовує сайт на цей процес.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'перезапуск', 'перезапуски', 'перезапусків'),
      verLog: 'Переглянути лог',
      ocultarLog: 'Сховати лог',
      logVacio: 'Виводу ще немає.',
      abrirCarpetaLog: 'Відкрити папку логів',
      quitar: 'Видалити процес',
      quitarTitulo: (nombre: string) => `Видалити процес ${nombre}?`,
      quitarTexto: 'Якщо він запущений, його буде зупинено.',
      nombre: 'Назва',
      nombrePlaceholder: 'Vite',
      comando: 'Команда',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda:
        'Програма й аргументи, без оболонки. Для аргументів із пробілами використовуйте лапки.',
      cwd: 'Папка',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz або підпапка проєкту (наприклад, frontend).',
      puertoCampo: 'Порт',
      puertoNinguno: 'Немає',
      puertoAyuda: 'Лише для інформації, якщо процес не є призначенням проксі.',
      autoIniciar: 'Запускати під час старту WolfCore Dev',
      reiniciar: 'Перезапускати в разі збою',
      esProxy: 'Призначення проксі Nginx',
      requiereReinicio:
        'Процес запущено: зміни команди, папки або порту набудуть чинності після перезапуску.',
      reinicieAhora: 'Збережено. Вимкніть і знову увімкніть процес, щоб застосувати зміни.',
      guardado: 'Процес збережено',
      errores: {
        comando: 'Введіть команду',
        puerto: 'Порт має бути в межах від 1 до 65535',
        proxySinPuerto: 'Для призначення проксі потрібен порт',
        cwd: 'Вкажіть raiz або підпапку в межах проєкту',
        repetido: 'Процес із такою назвою вже існує',
      },
      estados: {
        encendido: 'Увімкнено',
        apagado: 'Вимкнено',
        iniciando: 'Запуск…',
        error: 'Помилка',
        externo: 'Зовнішній',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Журнали ${nombre}`,
      fuente: 'Джерело',
      ninguna: 'Цей проєкт ще не має журналів.',
      vacio: 'Журнал порожній.',
      actualizar: 'Оновити',
      abrirCarpeta: 'Відкрити папку',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Є нова папка, схожа на проєкт'
          : `Є ${plural(n, 'нова папка, схожа на проєкт', 'нові папки, схожі на проєкти', 'нових папок, схожих на проєкти')}`,
      montar: 'Підготувати',
      ignorar: 'Ігнорувати',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Непрочитані листи',
    correoApagado: 'Mailpit вимкнено',
    correoSinInstalar: 'Mailpit не встановлено',
    modelos: 'Моделі ШІ',
    iaApagada: 'Ollama вимкнено',
    iaSinInstalar: 'Ollama не встановлено',
    sinLeer: 'Не вдалося прочитати',
    sinDato: '—',
  },
  /* ───────────── Панель продуктивності, переглядач журналів і MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'],
    porSegundo: '/с',
    porcentaje: '%',
    segundos: 'с',
    minutos: 'хв',
    horas: 'год',
    dias: 'д',
    /** Робітник N служби (напр., PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Продуктивність',
    ventana: 'Останні 5 хвилин',
    pausado: 'На паузі, доки вікно приховане',
    esperando: 'Очікування першого заміру…',
    errorMuestreo: (detalle: string) => `Не вдалося запросити вибірку продуктивності: ${detalle}`,
    cpu: 'CPU',
    ram: 'Пам’ять',
    disco: 'Диск даних',
    red: 'Мережа',
    deTotal: (usado: string, total: string) => `${usado} із ${total}`,
    libre: (libre: string) => `${libre} вільно`,
    bajada: 'Завантаження',
    subida: 'Відвантаження',
    graficaCpu: (valor: string) => `Графік CPU за останні 5 хвилин; зараз ${valor}`,
    graficaRam: (valor: string) => `Графік пам’яті за останні 5 хвилин; зараз ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Графік мережі за останні 5 хвилин; завантаження ${bajada}, відвантаження ${subida}`,
    alertas: {
      titulo: 'Сповіщення',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Порт ${puerto} служби ${servicio} зайнятий іншою програмою: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Пам’ять комп’ютера завантажена на ${porcentaje} %. Вимкніть те, чим не користуєтеся, щоб система працювала швидше.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Виявлено php-cgi, що не належить WolfCore Dev (PID ${pid}), на портах ${puertos.join(', ')}: залишився від попереднього сеансу.`,
      finalizar: 'Завершити процес',
      finalizarTitulo: 'Завершити цей процес?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) буде закрито без збереження відкритих даних. Використовуйте лише якщо впевнені, що ця програма не потрібна.`,
      finalizado: (nombre: string) => `${nombre} завершено`,
      verPuertos: 'Переглянути порти',
      errorPuertos: 'Не вдалося перевірити, які програми використовують порти.',
    },
    procesos: {
      titulo: 'Служби та процеси',
      vacio: 'Немає запущених служб або процесів проєктів.',
      nombre: 'Назва',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Порт',
      encendido: 'Час роботи',
      acciones: 'Дії',
      detener: 'Зупинити',
      registros: 'Переглянути журнали',
      servicio: 'Служба',
      proyecto: 'Проєкт',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Журнали',
    descripcion:
      'Стежте в реальному часі за журналами Nginx, PHP, служб, сайтів, процесів проєктів і тунелів.',
    fuente: 'Джерело',
    elegirFuente: 'Оберіть журнал',
    sinFuentes:
      'Журналів ще немає. Вони з’являться, щойно служба, сайт або процес запише перший рядок.',
    buscar: 'Фільтрувати за текстом',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Пауза',
    reanudar: 'Продовжити',
    pausadoNuevas: (n: number) =>
      plural(n, 'новий рядок на паузі', 'нові рядки на паузі', 'нових рядків на паузі'),
    copiar: 'Скопіювати видиме',
    copiadas: (n: number) =>
      plural(n, 'рядок скопійовано', 'рядки скопійовано', 'рядків скопійовано'),
    limpiar: 'Очистити',
    abrirCarpeta: 'Відкрити папку',
    alFinal: 'Стежити за кінцем',
    mostrarMas: 'Показати ще',
    ocultas: (n: number) =>
      plural(
        n,
        'попередній рядок приховано',
        'попередні рядки приховано',
        'попередніх рядків приховано',
      ),
    vacio: 'Рядків ще немає. Нові з’являтимуться тут одразу після запису.',
    sinCoincidencias: 'Жоден рядок не відповідає фільтру.',
    cuenta: (visibles: number, total: number) =>
      visibles === total
        ? plural(total, 'рядок', 'рядки', 'рядків')
        : `${visibles} із ${plural(total, 'рядка', 'рядків', 'рядків')}`,
    descartadas: (n: number) =>
      `(зберігаються останні 5000; ${plural(n, 'старіший відкинуто', 'старіші відкинуто', 'старіших відкинуто')})`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Служби',
      sitio: 'Сайти',
      laravel: 'Laravel',
      proyecto: 'Процеси проєктів',
      tunel: 'Тунелі',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (доступ)',
      nginxError: 'Nginx (помилки)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (доступ)`,
      sitioError: (dominio: string) => `${dominio} (помилки)`,
      tunel: (sitio: string) => `Тунель ${sitio}`,
      tunelSalida: (sitio: string) => `Тунель ${sitio} (вивід)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Відкрийте новий термінал, щоб побачити зміни: уже відкриті термінали їх не бачать.',
    enPathSinCliente: 'У PATH, але бракує команди',
    reparar: 'Виправити',
    repararTitulo: 'Виправити команду wolf?',
    repararTexto:
      'wolf є в PATH, але його файли неповні. Їх буде повторно скопійовано до папки даних і запущено локальний сервер, як під час додавання.',
    titulo: 'Термінал: команда wolf',
    descripcion:
      'Керуйте WolfCore Dev із PowerShell, cmd або Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Працює лише коли програму відкрито.',
    activo: 'Доступно в PATH',
    enPathSinServidor: 'У PATH, сервер вимкнено',
    inactivo: 'Немає в PATH',
    agregarBoton: 'Додати wolf до PATH',
    quitarBoton: 'Видалити wolf із PATH',
    agregarTitulo: 'Додати wolf до PATH користувача?',
    agregarTexto:
      'Команду wolf буде скопійовано до папки даних WolfCore Dev, цю папку буде додано до PATH вашого користувача (зберігається копія початкового PATH) і запущено локальний сервер на 127.0.0.1, який обслуговує лише wolf за ключем, що змінюється під час кожного запуску. Публікація сайту в інтернеті або зміна PHP для всіх терміналів завжди додатково підтверджується у вікні програми. Ви можете видалити її будь-коли.',
    agregar: 'Додати',
    quitarTitulo: 'Видалити wolf із PATH?',
    quitarTexto:
      'Папку wolf буде видалено з PATH вашого користувача, локальний сервер буде зупинено, а скопійовану команду видалено. Відкриті термінали не зміняться.',
    quitar: 'Видалити',
    listoTitulo: 'Команду wolf оновлено',
    ayuda: 'Відкрийте новий термінал після додавання. Сервер прослуховує лише 127.0.0.1.',
    aislado: 'Із тестовою папкою даних (WOLFCORE_DATOS) PATH не змінюється.',
    errorCargar: (detalle: string) => `Не вдалося прочитати стан wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Сервер MCP',
    descripcion:
      'Дозволяє Claude Code та іншим асистентам керувати вашими сайтами, службами й базами даних на цьому комп’ютері. Прослуховує лише 127.0.0.1 і вимагає токен.',
    estado: 'Стан',
    activo: 'Активний',
    inactivo: 'Зупинено',
    activar: 'Увімкнути',
    detener: 'Зупинити',
    activado: 'Сервер MCP активний',
    detenido: 'Сервер MCP зупинено',
    direccion: 'Адреса',
    puerto: 'Порт',
    puertoAyuda: 'Від 1024 до 65535. Якщо активний, перезапуститься на новому порту.',
    puertoRango: 'Вкажіть число від 1024 до 65535',
    puertoGuardado: (p: number) => `Сервер MCP використовуватиме порт ${p}`,
    copiarConfig: 'Скопіювати конфігурацію для Claude Code',
    copiarConfigAyuda:
      'Копіює до буфера обміну конфігурацію з токеном. Вставте її в Claude Code; токен тут не показується.',
    configCopiada: 'Конфігурацію скопійовано до буфера обміну',
    regenerar: 'Перегенерувати токен',
    regenerarTitulo: 'Перегенерувати токен сервера MCP?',
    regenerarTexto:
      'Поточний токен миттєво стане недійсним: підключеним асистентам доведеться використати нову конфігурацію.',
    regenerado: 'Токен перегенеровано. Скопіюйте конфігурацію знову.',
    errorCargar: (detalle: string) => `Не вдалося прочитати стан сервера MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Асистент запитує підтвердження',
      herramienta: 'Інструмент',
      pendientes: (actual: number, total: number) => `${actual} із ${total}`,
      aprobar: 'Схвалити',
      rechazar: 'Відхилити',
      aprobada: 'Дію схвалено',
      rechazada: 'Дію відхилено',
      vencida: 'Запит уже не очікує підтвердження.',
      descartadas: (n: number) =>
        `та ще ${plural(n, 'запит не вмістився (термін дії мине автоматично)', 'запити не вмістилися (термін дії мине автоматично)', 'запитів не вмістилося (термін дії мине автоматично)')}`,
      falloRespuesta: (detalle: string) =>
        `Не вдалося надіслати відповідь; запит досі очікує підтвердження. ${detalle}`,
      si: 'Так',
      no: 'Ні',
      campos: {
        motor: 'Рушій',
        base: 'База даних',
        archivo: 'Файл',
        sobrescribir: 'Перезаписати',
        pid: 'PID',
        nombre: 'Процес',
        proyecto: 'Проєкт',
        pasos: 'Кроки',
        cantidad: 'Дампи',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Утиліти для щоденної роботи. Працюють офлайн і без зовнішніх служб.',
    buscar: 'Пошук інструмента…',
    sinResultados: 'Жоден інструмент не відповідає пошуковому запиту.',
    abrir: 'Відкрити',
    procesar: 'Обробка…',
    copiar: 'Скопіювати',
    copiado: 'Скопійовано до буфера обміну',
    limpiar: 'Очистити',
    pendienteApi: 'Очікується: ядро ще не надає цю інформацію інтерфейсу.',
    lista: {
      qr: { nombre: 'Генератор QR', descripcion: 'Із тексту або посилання тунелю; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Форматування, перевірка та мініфікація з деревом.' },
      regex: {
        nombre: 'Регулярні вирази',
        descripcion: 'Тестер зі збігами, групами та довідником.',
      },
      diff: {
        nombre: 'Порівняння текстів',
        descripcion: 'Відмінності поруч, зокрема для файлів.',
      },
      tiempo: { nombre: 'Час', descripcion: 'Timestamp ↔ дата, із часовим поясом.' },
      puertos: {
        nombre: 'Порти й процеси',
        descripcion: 'Що прослуховує кожен порт, і завершення процесу.',
      },
      bom: { nombre: 'Очищення BOM UTF-8', descripcion: 'Видаляє BOM із файлів або папок.' },
      certificados: {
        nombre: 'Сертифікати',
        descripcion: 'Випуск через CA WolfCore Dev для будь-якого імені.',
      },
      cripto: {
        nombre: 'Криптографія',
        descripcion: 'Хеш, base64, URL, UUID, паролі та JWT.',
      },
      markdown: { nombre: 'Перегляд Markdown', descripcion: 'Пишіть і одразу бачте результат.' },
      entorno: { nombre: 'Системне середовище', descripcion: 'PATH, версії та змінні.' },
      buscar: {
        nombre: 'Пошук',
        descripcion: 'Текст у назвах і вмісті проєкту, папки або файлу.',
      },
      infoArchivo: {
        nombre: 'Інформація про файл',
        descripcion: 'Розмір, тип і хеші файлу.',
      },
      websocket: {
        nombre: 'Клієнт WebSocket',
        descripcion: 'Підключення, надсилання та перегляд повідомлень.',
      },
      contrasenas: {
        nombre: 'Паролі',
        descripcion: 'Оцінка надійності пароля й перевірка слабких облікових записів у базах.',
      },
      qrWifi: {
        nombre: 'QR для Wi-Fi',
        descripcion: 'QR-код, щоб інші могли підключитися до вашої мережі.',
      },
      imagenes: {
        nombre: 'Зображення',
        descripcion: 'Конвертація в ICO або PNG і стиснення JPEG чи WebP.',
      },
      comprimir: {
        nombre: 'ZIP і PDF',
        descripcion: 'Стиснення файлів і папок у ZIP та оптимізація PDF.',
      },
      conversor: {
        nombre: 'Конвертер документів',
        descripcion: 'Конвертація Word, Excel, PDF, CSV і Markdown локально на цьому комп’ютері.',
      },
    },
    errores: {
      jsonVacio: 'Введіть або вставте JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `Некоректний JSON: перевірте рядок ${linea}, стовпець ${columna}.`,
      banderas: 'Некоректні прапорці: використовуйте лише d, g, i, m, s, u, v або y без повторів.',
      trabajador: 'Не вдалося виконати операцію у фоновому режимі.',
      diffLento: 'Тексти надто відрізняються, щоб встигнути їх порівняти.',
      base64: 'Некоректний Base64.',
      utf8: 'Декодований вміст не є текстом UTF-8.',
      url: 'Некоректна послідовність URL.',
      coste: (max: number) => `Вартість bcrypt має бути в межах від 4 до ${max}.`,
      jwtPartes: 'JWT має складатися з трьох частин, розділених крапкою.',
      jwtCabecera: 'Не вдалося прочитати заголовок JWT.',
      jwtCarga: 'Не вдалося прочитати корисне навантаження JWT.',
      longitud: 'Довжина має бути від 4 до 256.',
      sinConjuntos: 'Оберіть принаймні один тип символів.',
      sinDominios: "Введіть принаймні одне ім'я або IP-адресу.",
      muchosDominios: (max: number) => `Максимум ${max} імен на сертифікат.`,
    },
    qr: {
      texto: 'Текст або URL',
      textoAyuda: "QR-код створюється на цьому комп'ютері; нічого не передається в мережу.",
      tunel: 'Посилання тунелю проєкту',
      sinTuneles: 'Немає активних тунелів',
      descargar: 'Завантажити PNG',
      vacio: 'Введіть щось, щоб створити код.',
      largo: 'Текст занадто довгий для QR-коду.',
      descargado: 'Завантаження розпочато.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Форматувати',
      minificar: 'Мініфікувати',
      validar: 'Перевірити',
      valido: 'Коректний JSON.',
      resultado: 'Результат',
      arbol: 'Дерево',
      mas: (n: number) => `… ще ${n}`,
    },
    regex: {
      patron: 'Шаблон',
      banderas: 'Прапорці',
      texto: 'Тестовий текст',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${plural(n, 'збіг', 'збіги', 'збігів')}${truncado ? ' (показано перші)' : ''}`,
      sinCoincidencias: 'Збігів немає.',
      tiempo: 'Вираз виконувався занадто довго і був зупинений (можливий катастрофічний відкат).',
      grupo: (n: number) => `Група ${n}`,
      referencia: 'Швидка довідка',
      tabla: [
        ['.', 'Будь-який символ (крім переносу рядка без s)'],
        ['\\d \\w \\s', 'Цифра, літера/цифра/_ та пробіл'],
        ['\\D \\W \\S', 'Протилежне до попереднього'],
        ['[abc] [^abc]', 'Один зі списку / жодного зі списку'],
        ['^ $', 'Початок і кінець (рядка з m)'],
        ['\\b', 'Межа слова'],
        ['* + ?', "Нуль або більше, один або більше, необов'язково"],
        ['{n,m}', 'Від n до m повторень'],
        ['*? +?', 'Лінива версія'],
        ['(…) (?<nombre>…)', 'Група захоплення та іменована група'],
        ['(?:…)', 'Група без захоплення'],
        ['(?=…) (?!…)', 'За яким іде / не іде'],
        ['a|b', 'Альтернатива'],
        [
          'g i m s u y',
          'Глобальний, без урахування регістру, багаторядковий, крапка для всіх, Unicode, фіксований',
        ],
      ] as [string, string][],
    },
    diff: {
      original: 'Оригінал',
      modificado: 'Змінений',
      cargarArchivo: 'Завантажити файл',
      comparar: 'Порівняти',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} рядків`,
      iguales: 'Тексти однакові.',
      archivoGrande: 'Файл перевищує 5 МБ; оберіть менший.',
      textoGrande: 'Кожен текст може мати максимум 5 МБ.',
      truncado: (mostradas: number, total: number) =>
        `Показано перші ${mostradas} із ${total} рядків.`,
    },
    tiempo: {
      timestamp: 'Timestamp (секунди або мілісекунди)',
      fecha: 'Дата (РРРР-ММ-ДД ГГ:хв:сс)',
      zona: 'Часовий пояс',
      ahora: 'Зараз',
      segundos: 'Секунди',
      milisegundos: 'Мілісекунди',
      iso: 'ISO 8601 (UTC)',
      enZona: 'В обраному поясі',
      desplazamiento: 'Зміщення',
      relativo: 'Відносно',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Прочитано в секундах' : 'Прочитано в мілісекундах',
      timestampInvalido: 'Введіть лише цифри (можна зі знаком).',
      fechaInvalida: 'Використовуйте формат РРРР-ММ-ДД ГГ:хв[:сс] із реальною датою.',
      zonaInvalida: 'Невідомий часовий пояс.',
    },
    puertos: {
      filtro: 'Фільтрувати за портом, PID або назвою',
      actualizar: 'Оновити',
      columnas: {
        puerto: 'Порт',
        protocolo: 'Протокол',
        proceso: 'Процес',
        pid: 'PID',
        direcciones: 'Адреси',
        acciones: 'Дії',
      },
      propio: 'WolfCore Dev',
      sistema: 'Система',
      finalizar: 'Завершити',
      noFinalizable: 'Системні процеси та процеси WolfCore Dev не завершуються звідси.',
      confirmarTitulo: 'Завершити процес',
      confirmarTexto: (nombre: string, pid: number) =>
        `Процес "${nombre}" (PID ${pid}) буде закрито без збереження. Щоб підтвердити, введіть назву процесу:`,
      finalizado: (nombre: string) => `Завершено ${nombre}.`,
      vacio: 'Немає зайнятих портів або не вдалося їх прочитати.',
    },
    bom: {
      explicacion:
        'Спочатку показуються файли з BOM; під час очищення для кожного створюється копія .bak-bom. node_modules, vendor, .git та двійкові файли пропускаються.',
      elegirArchivos: 'Обрати файли',
      elegirCarpeta: 'Обрати папку',
      seleccion: (n: number) =>
        `${n} ${plural(n, 'обраний шлях', 'обрані шляхи', 'обраних шляхів')}`,
      analizar: 'Аналізувати',
      limpiar: 'Видалити BOM',
      confirmar: (n: number) =>
        `Буде видалено BOM із ${n} ${plural(n, 'файлу', 'файлів', 'файлів')} (зі створенням копії). Продовжити?`,
      conBom: (n: number) => `${n} ${plural(n, 'файл із BOM', 'файли з BOM', 'файлів із BOM')}`,
      sinBom: 'Жоден файл не містить BOM.',
      limpiados: (n: number) => `Очищено ${n} ${plural(n, 'файл', 'файли', 'файлів')}.`,
      copia: 'Копія',
    },
    certificados: {
      explicacion:
        'Підписує сертифікат локальним центром сертифікації (CA) WolfCore Dev. Файл .crt зберігається там, де Ви оберете, а ключ (.key) — поруч із ним; ключ ніколи не проходить через інтерфейс.',
      dominios: 'Імена або IP (через пробіл, кому або з нового рядка)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Видати та зберегти',
      guardado: 'Сертифікат збережено',
      certificado: 'Сертифікат',
      clave: 'Ключ',
    },
    cripto: {
      texto: 'Текст',
      hash: 'Хеш',
      calcular: 'Обчислити',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Вартість bcrypt',
      bcryptTrunca: 'bcrypt використовує лише перші 72 байти тексту.',
      bcryptVerificar: 'Хеш bcrypt для перевірки',
      verificar: 'Перевірити',
      coincide: 'Текст збігається з хешем.',
      noCoincide: 'Текст не збігається з хешем.',
      base64: 'Base64',
      base64Url: 'Варіант URL',
      codificar: 'Кодувати',
      decodificar: 'Декодувати',
      url: 'Кодувати URL',
      decodificarUrl: 'Декодувати URL',
      codificarBase64: 'Кодувати Base64',
      decodificarBase64: 'Декодувати Base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID і паролі',
      uuid: 'UUID v4',
      generar: 'Згенерувати',
      generarDiez: 'Згенерувати 10',
      contrasena: 'Випадковий пароль',
      longitud: 'Довжина',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Символи',
      jwt: 'Декодувати JWT',
      jwtToken: 'Токен',
      cabecera: 'Заголовок',
      carga: 'Корисне навантаження',
      firmaNoVerificada: 'Підпис не перевірено: вміст показано як є, і він може бути змінений.',
      vencido: 'Термін дії токена закінчився (exp).',
      vigente: 'Токен ще дійсний (exp).',
      salida: 'Результат',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Попередній перегляд',
      ejemplo:
        '# Заголовок\n\nТекст із **жирним**, _курсивом_ і [посиланням](https://example.com).\n\n- Один\n- Два\n\n```\nкод\n```\n',
      seguro:
        'Сирий HTML показується як текст, небезпечні посилання відкидаються, а зображення не завантажуються.',
      imagenOmitida: (alt: string) => `[зображення${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Версія WolfCore Dev',
      navegador: 'Рушій інтерфейсу',
      plataforma: 'Платформа',
      idioma: 'Мова',
      zona: 'Часовий пояс',
      nucleos: 'Логічні ядра',
      actualizar: 'Оновити',
      path: 'PATH',
      pathVacio: 'PATH порожній.',
      herramientas: 'Інструменти WolfCore Dev',
      noInstalada: 'Не встановлено',
      sinRespuesta: 'Не відповіло вчасно',
      variables: 'Змінні середовища',
      filtro: 'Фільтрувати змінні',
      enmascarada: 'Значення приховано: назва схожа на секрет.',
    },
    busqueda: {
      explicacion:
        'Шукає в назвах і вмісті, не переходить за посиланнями та не читає двійкові файли. За замовчуванням пропускає node_modules, vendor і .git.',
      origen: 'Де шукати',
      proyecto: 'Проєкт',
      elegirCarpeta: 'Обрати папку',
      elegirArchivo: 'Обрати файл',
      sinOrigen: 'Оберіть проєкт, папку або файл.',
      consulta: 'Текст для пошуку',
      modoNombre: 'Назви',
      modoContenido: 'Вміст',
      modoAmbos: 'Обидва',
      regex: 'Регулярний вираз',
      mayusculas: 'Враховувати регістр',
      incluir: 'Лише файли (через кому, напр. *.php)',
      buscar: 'Шукати',
      cancelar: 'Скасувати',
      buscando: 'Пошук…',
      sinResultados: 'Збігів немає.',
      truncado: 'Результатів більше, ніж показано: уточніть пошук.',
      cancelada: 'Пошук скасовано.',
      abrir: 'Відкрити в редакторі',
      coincidencias: (n: number) => `${n} ${plural(n, 'збіг', 'збіги', 'збігів')}`,
      resumen: (archivos: number, examinados: number) =>
        `у ${archivos} ${plural(archivos, 'файлі', 'файлах', 'файлах')} (перевірено ${examinados})`,
    },
    infoArchivo: {
      elegir: 'Обрати файл',
      ayuda: "Читається на цьому комп'ютері для обчислення хешів (максимум 200 МБ).",
      nombre: 'Назва',
      tamano: 'Розмір',
      tipo: 'Тип',
      modificado: 'Змінено',
      sinTipo: 'Невідомо',
      grande: 'Файл перевищує 200 МБ: показано дані без хешів.',
      calculando: 'Обчислення хешів…',
    },
    websocket: {
      url: 'URL (ws:// або wss://)',
      conectar: 'Підключитися',
      desconectar: 'Відключитися',
      mensaje: 'Повідомлення',
      enviar: 'Надіслати',
      urlInvalida: 'Введіть URL, що починається з ws:// або wss://.',
      conectando: 'Підключення…',
      conectado: 'Підключено',
      desconectado: 'Відключено',
      error: 'Помилка підключення',
      cerrado: (codigo: number, motivo: string) =>
        `Закрито (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Надіслано',
      recibido: 'Отримано',
      binario: (n: number) => `[двійкові дані, ${n} ${plural(n, 'байт', 'байти', 'байтів')}]`,
      vacio: 'Повідомлень ще немає.',
      tope: 'Зберігаються останні 500 повідомлень; кожне показується до 10 КБ.',
    },
    qrWifi: {
      ssid: 'Назва мережі (SSID)',
      clave: 'Пароль',
      seguridad: 'Безпека',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Без пароля',
      oculta: 'Прихована мережа',
      mostrar: 'Показати',
      ocultar: 'Приховати',
      aviso:
        'QR-код містить пароль у відкритому вигляді: кожен, хто його побачить або сфотографує, зможе підключитися до Вашої мережі. Він створюється тут, не зберігається і видаляється після закриття цієї панелі.',
      avisoPng:
        'Завантажений PNG-файл також містить пароль у коді: зберігайте його там, де його бачите лише Ви.',
      escribala:
        'Пароль вводите Ви: WolfCore Dev ніколи не читає паролі Wi-Fi, збережені в системі.',
      errorSsid: 'Введіть назву мережі (до 32 символів).',
      errorClave: 'Введіть пароль.',
      errorClaveWpa: 'Пароль WPA має містити від 8 до 63 символів.',
      vacio: 'Заповніть дані, щоб побачити код.',
      alt: 'QR-код для підключення до мережі Wi-Fi',
      descargar: 'Завантажити PNG',
      descargado: 'QR-код збережено',
      largo: 'Дані занадто довгі для QR-коду.',
    },
    imagenes: {
      elegir: 'Обрати зображення',
      ayuda:
        "Обробляється на цьому комп'ютері (до 30 МБ і 12000 px на сторону). Оригінал не змінюється: результат — новий файл.",
      original: 'Оригінал',
      accion: 'Що зробити',
      aIco: 'Конвертувати в ICO',
      aPng: 'Конвертувати в PNG',
      comprimir: 'Стиснути',
      tamanos: 'Розміри ICO',
      formato: 'Формат',
      calidad: 'Якість',
      ladoMax: 'Макс. сторона в px (порожньо = оригінал)',
      procesar: 'Обробити',
      procesando: 'Обробка…',
      guardar: 'Зберегти як…',
      antes: 'До',
      despues: 'Після',
      sinMejora: 'Результат не менший за оригінал: спробуйте іншу якість або формат.',
      errorAbrir: "Не вдалося відкрити зображення на цьому комп'ютері.",
      errorProcesar: 'Не вдалося обробити зображення.',
      sufijoConvertida: '-конвертовано',
      sufijoComprimida: '-стиснуто',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `на ${porcentaje} % менше`
          : porcentaje < 0
            ? `на ${-porcentaje} % більше`
            : 'без змін',
      guardado: (archivo: string) => `Збережено у ${archivo}`,
    },
    comprimir: {
      zip: 'Стиснути в ZIP',
      zipAyuda:
        'Оберіть файли або папки. Посилання не переходяться, а ZIP — це новий файл: наявний файл ніколи не перезаписується.',
      agregarArchivos: 'Додати файли',
      agregarCarpeta: 'Додати папку',
      quitar: 'Прибрати',
      vacio: 'Поки що нічого не обрано.',
      crearZip: 'Створити ZIP…',
      creando: 'Створення…',
      pdf: 'Оптимізувати PDF',
      pdfAyuda:
        "Перезберігається з потоками об'єктів в окремому потоці. Файл створюється лише якщо він менший; PDF із паролем не відкриваються. Оригінал не змінюється. Увага: під час перезбереження втрачаються цифрові підписи та сумісність із PDF/A.",
      elegirPdf: 'Обрати PDF',
      optimizar: 'Оптимізувати…',
      optimizando: 'Оптимізація…',
      antes: 'До',
      despues: 'Після',
      sinMejora: 'Оптимізований PDF не був би меншим: файл не створено.',
      sufijoOptimizado: '-оптимізовано',
      omitidos: (n: number) =>
        `${n} ${plural(n, 'посилання, нечитабельну папку або спеціальний файл не включено', 'посилання, нечитабельні папки або спеціальні файли не включено', 'посилань, нечитабельних папок або спеціальних файлів не включено')}.`,
      archivos: (n: number) => `${n} ${plural(n, 'файл', 'файли', 'файлів')}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `на ${porcentaje} % менше`
          : porcentaje < 0
            ? `на ${-porcentaje} % більше`
            : 'без змін',
      guardado: (archivo: string) => `Збережено у ${archivo}`,
    },
    conversor: {
      ayuda:
        "Конвертується на цьому комп'ютері: документ нікуди не завантажується. Оригінал не змінюється; результат — новий файл, і наявний ніколи не перезаписується.",
      elegir: 'Обрати документ',
      tipoNoSoportado:
        'Для цього типу файлів конвертація недоступна. Підтримуються docx, xlsx, csv, md, html та pdf (а також odt, pptx і doc із LibreOffice).',
      convertirA: 'Конвертувати в',
      convertir: 'Конвертувати…',
      convirtiendo: 'Конвертація…',
      avisoLibreOffice:
        "Ця конвертація використовує LibreOffice, який уже встановлено на цьому комп'ютері. WolfCore Dev не встановлює та не завантажує його: запускає без вікна з тимчасовим профілем.",
      sinLibreOffice:
        'Якщо Ви встановите LibreOffice, також зможете конвертувати odt, pptx і doc (WolfCore Dev його не встановлює).',
      limites:
        'З міркувань безпеки діють обмеження: до 50 МБ (10 МБ для md і html), 120 с, 200 000 рядків, 1000 стовпців і 5 мільйонів клітинок; файли, схожі на ZIP-бомбу або з XML-сутностями, відхиляються.',
      guardado: (archivo: string) => `Збережено у ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Надійність',
      pestanaAuditar: 'Аудит бази',
      fortaleza: {
        etiqueta: 'Пароль для оцінки',
        marcador: 'Введіть пароль',
        privacidad: "Оцінюється тут же: нічого не покидає Ваш комп'ютер і не зберігається.",
        mostrar: 'Показати',
        ocultar: 'Приховати',
        niveles: ['Дуже слабкий', 'Слабкий', 'Середній', 'Надійний', 'Дуже надійний'],
        sinAvisos: 'Без зауважень.',
        estimacion: 'Це оцінка, а не гарантія.',
        avisos: {
          straightRow: 'Ряд сусідніх клавіш легко вгадати.',
          keyPattern: 'Короткі клавіатурні шаблони легко вгадати.',
          simpleRepeat: 'Повторення символу або групи майже не підсилює пароль.',
          extendedRepeat: 'Повторювані групи легко вгадати.',
          sequences: 'Послідовності на кшталт abc або 6543 легко вгадати.',
          recentYears: "Уникайте недавніх років і дат, пов'язаних із Вами.",
          dates: 'Уникайте дат: їх легко вгадати.',
          topTen: 'Входить до десятки найпоширеніших паролів.',
          topHundred: 'Входить до сотні найпоширеніших паролів.',
          common: 'Це дуже поширений пароль.',
          similarToCommon: 'Схожий на дуже поширений пароль.',
          wordByItself: 'Окреме слово легко вгадати.',
          namesByThemselves: "Окреме ім'я або прізвище легко вгадати.",
          commonNames: 'Поширені імена та прізвища легко вгадати.',
          userInputs: 'Не використовуйте дані, які інші знають про Вас.',
          l33t: 'Заміна літер на передбачувані символи (@ замість a) мало допомагає.',
          reverseWords: 'Написання слів задом наперед мало допомагає.',
          allUppercase: 'Написання всього великими літерами мало допомагає.',
          capitalization: 'Велика перша літера мало допомагає.',
          associatedYears: "Уникайте років, пов'язаних із Вами.",
          repeated: 'Уникайте повторюваних слів і символів.',
          longerKeyboardPattern: 'Використовуйте довший клавіатурний шаблон і змінюйте напрямок.',
          anotherWord: 'Додайте ще одне або два слова; рідкісні слова допомагають.',
          useWords: 'Кілька випадкових слів утворюють хороший пароль.',
          noNeed: 'Пароль може бути надійним без символів і цифр: головне — довжина.',
        },
      },
      auditar: {
        limite:
          'Це виявляє лише дуже поширені паролі: кожен хеш порівнюється з коротким списком приблизно з 200 паролів. Це не атака і не підбір силою. Якщо обліковий запис не позначено, це не означає, що його пароль надійний.',
        privacidad:
          'Ніколи не показується, який саме пароль збігся, а читання виконується тимчасовим користувачем лише для читання (у PostgreSQL — у сесії лише для читання). Використовуйте лише для власних баз.',
        motor: 'Рушій',
        base: 'База даних',
        tabla: 'Таблиця',
        columnaUsuario: 'Стовпець користувача',
        columnaHash: 'Стовпець хешу',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Увімкніть сервер у розділі «Бази даних», щоб перевірити його бази.',
        sinBases: 'На цьому сервері немає баз.',
        sinMotores: 'Немає власного сервера MySQL, MariaDB або PostgreSQL.',
        revisar: 'Перевірити',
        revisando: 'Перевірка…',
        resumen: (r: number, d: number) =>
          `${r} ${plural(r, 'перевірений обліковий запис', 'перевірені облікові записи', 'перевірених облікових записів')} · ${d} ${plural(d, 'слабкий', 'слабкі', 'слабких')}`,
        sinDebiles: 'Жоден перевірений обліковий запис не збігається з дуже поширеним паролем.',
        noRevisables: (n: number) =>
          `${n} ${plural(n, 'обліковий запис не вдалося перевірити', 'облікові записи не вдалося перевірити', 'облікових записів не вдалося перевірити')}:`,
        truncado:
          'Перевірку зупинено через обмеження 10 000 рядків або 60 секунд: частина облікових записів залишилася неперевіреною.',
        usuario: 'Користувач',
        motivo: 'Причина',
        accion: 'Дія',
        motivos: {
          comun: 'Дуже поширений пароль',
          formato_debil: 'Слабкий формат (md5 або sha1 без солі)',
        },
        restablecer: 'Скинути',
        mas: (n: number) => `і ще ${n} (показано перші 200)`,
        esquema: 'Схема (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Скасувати',
        cancelando: 'Скасування…',
        cancelada: 'Аудит скасовано.',
        progreso: (a: number, b: number) => `Перевірено ${a} із ${b}`,
        tiposNoRevisables: {
          vacio: 'порожній хеш',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: "Argon2 (недоступно на цьому комп'ютері або параметри поза межами)",
          bcrypt_otro: 'bcrypt із вартістю поза діапазоном або варіант $2x$',
          pbkdf2_otro: 'PBKDF2 із параметрами поза межами',
          ldap: 'формат LDAP ({SHA}…)',
          otro: 'невідомий формат',
        },
        rlsActiva:
          'У таблиці увімкнено захист на рівні рядків (RLS): аудит бачить лише ті рядки, які політика дозволяє обмеженій ролі, тому деякі облікові записи можуть бути пропущені.',
        falsoPositivo:
          'Значення з 32 або 40 шістнадцяткових символів сприймається як md5 або sha1, але може бути чимось іншим (наприклад, токеном). Якщо стовпець не зберігає паролі, результат недійсний.',
      },
      restablecer: {
        titulo: (u: string) => `Скидання пароля для ${u}`,
        ayuda:
          'Пароль неможливо відновити: встановлюється новий. Перед цим створюється знімок бази та зберігається копія рядка.',
        cargando: 'Підготовка попереднього перегляду…',
        sentencia: 'Буде виконано (значення передаються окремо і не показуються)',
        formatoActual: (f: string) => `Поточний формат: ${f}`,
        cambiaFormato:
          'Обліковий запис перейде на bcrypt: застосунок має вміти його перевіряти (наприклад, через password_verify); інакше ніхто не зможе увійти в цей обліковий запис.',
        nueva: 'Новий пароль',
        generar: 'Згенерувати',
        mostrar: 'Показати',
        ocultar: 'Приховати',
        anotar: 'Запишіть його зараз: він більше не показуватиметься і не зберігається.',
        escribaUsuario: (u: string) => `Щоб підтвердити, введіть користувача: ${u}`,
        confirmar: 'Скинути пароль',
        cancelar: 'Скасувати',
        cerrar: 'Закрити',
        hecho: 'Пароль скинуто.',
        copiaFila: 'Копія рядка (ідентифікатор і попередній хеш, зберігається 30 днів):',
        instantanea: 'Попередній знімок бази:',
        instantaneaAyuda: 'До нього можна повернутися в розділі Бази даних › Знімки.',
        aBcrypt: 'Перейти на bcrypt: лише якщо застосунок використовує password_verify або аналог',
        avisoLegado:
          'Цей хеш має формат md5 або sha1 без солі і зберігається в такому форматі. Якщо застосунок зберігає сіль окремо (в іншому стовпці або константі), хеш неможливо відтворити, і новий пароль не підійде для входу.',
        datosReales: {
          titulo: 'База з реальними даними',
          texto:
            'Ця база належить сайту, позначеному як такий, що містить реальні дані клієнтів: скидання пароля змінює справжній обліковий запис.',
          casilla: 'Я розумію, що це реальні дані, і хочу скинути цей пароль',
        },
        rlsActiva:
          'У таблиці увімкнено захист на рівні рядків (RLS): якщо політика приховує цей обліковий запис від обмеженої ролі, скинути його не вдасться.',
        copiaSinRestringir:
          "Не вдалося обмежити доступ до цієї копії лише для користувача цього комп'ютера: перевірте права доступу до папки.",
      },
    },
  },
  doctor: {
    descripcion:
      'Перевіряє порти, сертифікати, файл hosts, PATH, Visual C++, антивірус і служби та пропонує способи виправлення.',
    revisarAhora: 'Перевірити зараз',
    revisando: 'Перевірка…',
    sinRevision: 'Перевірку ще не виконано. Натисніть «Перевірити зараз».',
    sinHallazgos: 'Усе гаразд: проблем не виявлено.',
    gravedades: { error: 'Помилки', aviso: 'Сповіщення', info: 'Інформація' },
    evidencia: 'Що виявлено',
    requiereAdmin: 'Потрібні права адміністратора',
    comandoManual: 'Команда для консолі адміністратора (не виконується автоматично):',
    copiar: 'Копіювати команду',
    copiado: 'Команду скопійовано.',
    reparar: 'Виправити',
    alternativa: 'Змінити порт WolfCore Dev',
    soloInforma: 'WolfCore Dev не змінює це самостійно: дотримуйтеся інструкцій.',
    dialogo: {
      titulo: 'Підтвердити виправлення',
      queHara: 'Ось що буде зроблено:',
      admin: 'Windows запросить дозвіл адміністратора.',
      puerto: (p: string | number) => `Новим портом буде ${p}.`,
      aplicar: 'Застосувати',
      cancelar: 'Скасувати',
    },
    estados: {
      aplicando: 'Застосування…',
      hecha: 'Виправлення застосовано.',
      fallida: 'Не вдалося виправити.',
    },
    revisiones: {
      puertos: 'Порти',
      'rangos-reservados': 'Зарезервовані діапазони',
      ca: 'Центр сертифікації',
      certificados: 'Сертифікати',
      confianza: 'Довіра до CA',
      hosts: 'Файл hosts',
      path: 'PATH користувача',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Компонувальник C++',
      antivirus: 'Антивірус',
      firewall: 'Брандмауер',
      servicios: 'Служби',
    },
    reparaciones: {
      cambiar_puerto: 'Змінити порт WolfCore Dev на вільний. Інша програма не зачіпається.',
      puerto_manual:
        'Перенести порт WolfCore Dev за межі зарезервованого діапазону. Звільняти діапазон чи ні — вирішуєте Ви за допомогою наведеної команди.',
      detener_iis:
        'Зупинити службу IIS (W3SVC), щоб звільнити порт. Вона не вимикається: знову запуститься після перезавантаження Windows.',
      regenerar_ca:
        'Створити новий центр сертифікації, додати його в довірені у Windows (знадобиться підтвердження), перевидати сертифікати та видалити попередній. Перед цим зберігається копія.',
      regenerar_certificados: 'Перевидати сертифікати сайтів і перезавантажити Nginx.',
      hosts_reescribir:
        'Перезаписати блок WolfCore Dev у файлі hosts у кодуванні UTF-8 із попереднім збереженням копії. Чужі рядки не зачіпаються.',
      hosts_solo_lectura: 'Зняти атрибут «лише для читання» з файлу hosts.',
      path_duplicados:
        'Видалити повторювані записи WolfCore Dev із PATH користувача зі збереженням копії попереднього значення. Чужі записи не зачіпаються.',
      path_ajeno:
        'Інший інструмент стоїть раніше в PATH. WolfCore Dev його не видаляє: змініть порядок за потреби.',
      instalar_vcredist:
        'Встановити Visual C++ 2015+ x64 за допомогою winget. Інсталятор Microsoft запитує власний дозвіл.',
      instalar_build_tools:
        'Встановіть Build Tools для Visual Studio (з інструментами C++) за допомогою наведеної команди: вони займають кілька ГБ і потребують прав адміністратора, тому рішення за Вами.',
      antivirus:
        'Додавати папку даних до винятків антивіруса — вирішуєте Ви за допомогою наведеної команди.',
      reintentar_servicio: 'Запустити службу повторно.',
      firefox_confianza:
        'Додати у файл user.js кожного профілю Firefox параметр довіри до центру сертифікації Windows із попереднім створенням копії. Файл prefs.js не змінюється, а відкриті профілі пропускаються.',
    },
    confianza: {
      titulo: 'Довіра до ЦС',
      texto:
        'Windows уже довіряє центру сертифікації WolfCore Dev; Node, Python і Firefox використовують власне сховище.',
      sinCa:
        'Центр сертифікації ще не створено. Створіть його в розділі HTTPS, щоб користуватися цією секцією.',
      node: {
        titulo: 'Node',
        proyectos:
          'Процеси проєкту та Термінал отримують змінну NODE_EXTRA_CA_CERTS із центром сертифікації.',
        ajena: 'У вас уже задано власну змінну NODE_EXTRA_CA_CERTS: WolfCore Dev її не замінює.',
        global: 'Також як змінну користувача (для інших терміналів і програм)',
        confirmarActivar:
          'Змінну NODE_EXTRA_CA_CERTS буде встановлено для вашого користувача. Це вплине на програми, запущені пізніше; змінну буде видалено після вимкнення цієї опції.',
        confirmarDesactivar:
          'Змінну NODE_EXTRA_CA_CERTS, яку встановив WolfCore Dev, буде видалено.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Проєкти з .venv отримують змінні REQUESTS_CA_BUNDLE та SSL_CERT_FILE із кореневими сертифікатами certifi (або Windows) плюс центр сертифікації. Ніколи лише один центр сертифікації.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Профілі Firefox не знайдено.',
        activo: 'Довіряє',
        inactivo: 'Не довіряє',
        abierto: 'Відкритий',
        fuera: 'Поза папкою Firefox',
        avisoFuera: (lista: string) =>
          `Ці профілі розташовані поза папкою Firefox і не змінюватимуться, доки ви не позначите відповідний пункт: ${lista}.`,
        incluirFuera: 'Також змінювати профілі поза папкою Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'профіль поза папкою Firefox не змінено', 'профілі поза папкою Firefox не змінено', 'профілів поза папкою Firefox не змінено')}.`,
        activar: 'Увімкнути у Firefox',
        quitar: 'Видалити з Firefox',
        confirmarActivar:
          'У файл user.js кожного профілю буде додано параметр security.enterprise_roots.enabled між мітками WolfCore Dev із попередньою резервною копією в etc/respaldos. Файл prefs.js не змінюється. Профілі з відкритим Firefox пропускаються: закрийте його заздалегідь.',
        confirmarQuitar:
          'Блок WolfCore Dev буде видалено з файлу user.js кожного профілю (із попередньою копією). Інші ваші налаштування залишаться без змін.',
        resultadoOk: (n: number) => `Готово у ${plural(n, 'профілі', 'профілях', 'профілях')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'профіль пропущено', 'профілі пропущено', 'профілів пропущено')}, оскільки Firefox відкритий. Закрийте його та спробуйте ще раз.`,
        resultadoError: (n: number) =>
          `${plural(n, 'профіль не вдалося', 'профілі не вдалося', 'профілів не вдалося')} змінити.`,
      },
      confirmar: 'Підтвердити',
      cancelar: 'Скасувати',
    },
  },
  php: {
    descripcion:
      'php.ini та розширення для кожної встановленої версії PHP. Перед збереженням показується diff, виконується перевірка через php -v і зберігається копія з датою; якщо PHP не запуститься знову, відновлюється попередня конфігурація.',
    rama: 'Версія PHP',
    sinPhp: 'PHP не встановлено. Встановіть його в розділі «Служби».',
    irServicios: 'Перейти до Служб',
    pestanas: { ini: 'php.ini', extensiones: 'Розширення' },
    rapidosTitulo: 'Швидкі параметри',
    rapidosAyuda:
      'Застосовуються до тексту нижче; нічого не зберігається, доки ви не підтвердите diff.',
    aplicarRapidos: 'Застосувати до тексту',
    sinValor: 'не задано',
    rapidos: {
      memory_limit: 'Пам’ять на скрипт (memory_limit)',
      upload_max_filesize: 'Макс. розмір завантаження (upload_max_filesize)',
      post_max_size: 'Макс. розмір POST (post_max_size)',
      max_execution_time: 'Макс. час у секундах (max_execution_time)',
      display_errors: 'Показувати помилки (display_errors)',
      error_reporting: 'Рівень помилок (error_reporting)',
      'date.timezone': 'Часовий пояс (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Рядки, що починаються з ;, є коментарями.',
    sinCambios: 'Немає змін порівняно зі збереженою версією.',
    descartar: 'Скасувати зміни',
    revisar: 'Переглянути й зберегти',
    diffTitulo: (rama: string) => `Зміни у php.ini для PHP ${rama}`,
    diffAyuda:
      'Буде збережено копію з датою, виконано перевірку через php -v і, якщо PHP запущено, його буде перезапущено.',
    guardar: 'Зберегти й застосувати',
    cancelar: 'Скасувати',
    guardado: (respaldo: string) => `php.ini збережено. Попередня копія: ${respaldo}`,
    respaldosTitulo: 'Резервні копії з датою',
    sinRespaldos: 'Резервних копій ще немає.',
    restaurar: 'Відновити',
    confirmarRestaurar: (nombre: string) =>
      `Відновити ${nombre}? Поточний php.ini попередньо буде збережено як окрему копію.`,
    restaurado: 'Копію відновлено.',
    recargar: 'Перечитати',
    extensiones: {
      ayuda:
        'Активуються лише розширення, що входять до цієї збірки в ext/. Сторонні встановлюються з каталогу (варіант для цієї збірки та перевірений хеш SHA-256).',
      activa: 'Активне',
      inactiva: 'Неактивне',
      falta: 'Файл відсутній',
      catalogo: 'Каталог',
      instalar: 'Встановити',
      instalada: (nombre: string) => `${nombre} встановлено й активовано.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} активовано.` : `${nombre} вимкнено.`,
      buscar: 'Пошук розширення',
      vacio: 'Немає розширень, що відповідають запиту.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI та Antigravity CLI: знаходьте або встановлюйте їх і відкривайте у проєкті. Ті, що підтримують це, підключаються до MCP WolfCore Dev. Жоден не запускається самостійно.',
    recargar: 'Знайти знову',
    notaMcp:
      'Зареєстрований MCP автентифікується лише тоді, коли агент відкрито з WolfCore Dev («Відкрити у проєкті»): токен передається у змінній WOLFCORE_MCP_TOKEN цього термінала й ніколи не записується в конфігурацію агента. Якщо відкрити ззовні, агент бачить запис «wolfcore», але не може підключитися.',
    sitioElegido: (nombre: string) => `Виберіть агента, щоб відкрити його в ${nombre}.`,
    instalado: 'Встановлено',
    noInstalado: 'Не встановлено',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Невідома версія',
    verVersion: 'Переглянути версію',
    verVersionAyuda:
      'Запускає програму з прапорцем --version (не виконується автоматично під час відкриття екрана).',
    origen: {
      propio: 'Встановлено WolfCore Dev',
      'npm-usuario': 'Глобальний npm користувача',
      ejecutable: 'Системна програма',
    },
    mcpRegistrado: 'MCP зареєстровано',
    mcpSinRegistrar: 'MCP не зареєстровано',
    tokenEscrito:
      'У файлі агента було записано токен MCP: тепер його там немає, а в попередній копії він замаскований (***). Рекомендуємо перегенерувати токен сервера MCP.',
    mcpNoSoportado:
      'Його документація не дозволяє отримувати токен зі змінної середовища: WolfCore Dev не реєструє для нього MCP (токен ніколи не записується у файли).',
    instalar: 'Встановити',
    instalando: 'Встановлення…',
    guia: 'Посібник зі встановлення',
    soloGuia:
      'WolfCore Dev не встановлює його (у його інсталятора немає фіксованого хешу): дотримуйтесь офіційного посібника.',
    registrar: 'Зареєструвати MCP',
    quitar: 'Видалити MCP',
    abrir: 'Відкрити у проєкті',
    confirmarInstalar: {
      titulo: (nombre: string) => `Встановити ${nombre}?`,
      texto: (paquete: string) =>
        `Встановлюється остання опублікована версія ${paquete} з registry.npmjs.org за допомогою Node від WolfCore Dev у його папку даних.`,
      aislado:
        'Не використовує вашу конфігурацію npm і не змінює глобальний npm. Це може тривати кілька хвилин.',
      aceptar: 'Встановити',
      hecho: (nombre: string) => `${nombre} встановлено.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Зареєструвати MCP у ${nombre}?`,
      texto:
        'Додається (або оновлюється) лише запис «wolfcore» у цьому файлі; решта залишається без змін:',
      aceptar: 'Зареєструвати',
      hecho: (nombre: string) => `MCP зареєстровано в ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Видалити MCP із ${nombre}?`,
      texto: 'Видаляється лише запис «wolfcore» із цього файлу; решта залишається без змін:',
      aceptar: 'Видалити',
      hecho: (nombre: string) => `MCP видалено з ${nombre}.`,
    },
    copiaPrevia:
      'Перед внесенням змін поруч із файлом зберігається копія з датою (<файл>.wolfcore-YYYYMMDD-HHmmss.bak); зберігаються 5 найновіших. Якщо агент відкритий, закрийте його перед цим.',
    copiaHecha: (ruta: string) => `Попередня копія: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Відкрити ${nombre}`,
      proyecto: 'Проєкт',
      sinProyectos: 'Проєктів ще немає.',
      proveedor: 'Постачальник ШІ',
      proveedorPropio: 'Той, що налаштований в агенті',
      proveedorAyuda:
        'Якщо вибрано постачальника, його ключ передається лише в середовищі цього термінала: він не записується у файли чи командний рядок.',
      aceptar: 'Відкрити термінал',
      hecho: (nombre: string) => `${nombre} відкрито в новому терміналі.`,
    },
    costo: {
      titulo: 'Перед відкриттям агента',
      texto:
        'ШІ-агент працює через ваш обліковий запис постачальника: кожен запит витрачає токени й може коштувати грошей. Він також може читати й змінювати файли проєкту та виконувати команди.',
      nunca:
        'WolfCore Dev ніколи не відкриває агента самостійно: це завжди робите ви. Це сповіщення показується лише один раз.',
      aceptar: 'Зрозуміло, відкрити',
    },
  },
  depuracion: {
    descripcion:
      'Переглядайте тут виклики dump(), dd() та wd() ваших PHP-сайтів і wolfdump ваших процесів Python із зазначенням файлу та рядка. Сторінка продовжує відповідати як зазвичай.',
    receptor: 'Захоплення дампів',
    escuchando: (direccion: string, puerto: number) => `Прослуховування на ${direccion}:${puerto}`,
    apagado: 'Вимкнено',
    memoria:
      'Дампи зберігаються лише в пам’яті (останні 500) і втрачаються після закриття. Вони можуть містити чутливі дані: під час копіювання відомі ключі маскуються.',
    sitios: 'Сайти',
    sinSitios: 'Немає сайтів PHP або FastAPI.',
    sinPhp: 'Спочатку виберіть версію PHP для сайту.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Перезапустіть процеси сайту, щоб вони підхопили wolfdump.',
    confirmarTitulo: (sitio: string) => `Увімкнути захоплення для ${sitio}`,
    confirmarPhp:
      'PHP цього сайту перед кожним запитом завантажуватиме файл WolfCore Dev (auto_prepend_file, лише для цього сайту), який визначає dump(), dd() та wd(), якщо їх не визначено у проєкті. Якщо ваші файли оголошують власну функцію dump() або dd() без перевірки function_exists, PHP покаже помилку: у такому разі вимкніть захоплення. Сайт переходить на власний PHP.',
    usoPhp:
      'Laravel і Symfony: dump($x) та dd($x) як зазвичай. CodeIgniter 3 та інші: wd($x) надсилає дані, нічого не виводячи на сторінку.',
    confirmarPython:
      'Процеси цього сайту матимуть модуль wolfdump у своєму PYTHONPATH (у проєкт нічого не записується). Почне діяти з наступного запуску процесів.',
    usoPython: 'from wolfdump import dump  →  dump(значення)',
    activar: 'Увімкнути захоплення',
    cancelar: 'Скасувати',
    filtroSitio: 'Усі сайти',
    filtroOrigen: 'Усі джерела',
    buscar: 'Пошук у тексті, файлі або URL',
    limpiar: 'Очистити',
    confirmarLimpiar: 'Видалити всі дампи з пам’яті?',
    vacio: 'Жодного дампу ще не надійшло.',
    vacioApagado: 'Увімкніть захоплення та запустіть сайт, щоб почати.',
    elegir: 'Виберіть дамп зі списку.',
    copiar: 'Копіювати',
    copiado: 'Скопійовано (ключі замасковано)',
    sinSitio: 'без сайту',
    total: (n: number) => `${n} у пам’яті`,
    archivo: 'Файл',
    url: 'URL',
    pestanaVolcados: 'Дампи',
    pestanaErrores: 'Помилки',
    erroresDescripcion:
      'Помилки з журналів PHP, Nginx, laravel.log, CodeIgniter 3 і Python, згруповані: одна й та сама повторювана помилка відображається один раз із лічильником.',
    erroresVacio: 'Помилок у журналах немає. Вони з’являться тут одразу після запису.',
    erroresElegir: 'Виберіть помилку зі списку.',
    actualizar: 'Оновити',
    abrirEditor: 'Відкрити в редакторі',
    abrirEditorSinSitio: 'Відкриваються лише файли з папки сайту.',
    veces: (n: number) => plural(n, 'раз', 'рази', 'разів'),
    primera: 'Уперше',
    ultima: 'Востаннє',
    fuente: 'Журнал',
    traza: 'Трасування (востаннє)',
    sinTraza: 'Без трасування.',
  },
  contenedores: {
    descripcion:
      'Переглядайте та керуйте контейнерами Docker або Podman на цьому комп’ютері. WolfCore Dev не створює, не видаляє і не завантажує контейнери, образи чи томи.',
    motor: 'Рушій',
    refrescar: 'Оновити',
    detectando: 'Пошук Docker і Podman…',
    sinMotorTitulo: 'Немає Docker або Podman',
    sinMotor:
      'На цьому комп’ютері не знайдено Docker або Podman. WolfCore Dev їх не встановлює: якщо вони вам потрібні, встановіть один із них з офіційного сайту та натисніть «Оновити».',
    instalarDocker: 'Встановити Docker',
    instalarPodman: 'Встановити Podman',
    apagadoTitulo: (m: string) => `${m} не відповідає`,
    apagado: (m: string) =>
      `${m} встановлено, але його рушій не відповідає. Відкрийте Docker Desktop (або запустіть машину Podman командою «podman machine start») і натисніть «Оновити».`,
    remoto:
      'Віддалене підключення проігноровано (DOCKER_HOST, CONTAINER_HOST, контекст або підключення за замовчуванням): WolfCore Dev використовує лише локальний рушій цього комп’ютера.',
    desdePath: 'Знайдено в PATH, а не у стандартній папці встановлення.',
    version: (v: string) => `Версія ${v}`,
    vacio: 'Контейнерів немає.',
    columnas: {
      nombre: 'Назва',
      imagen: 'Образ',
      estado: 'Стан',
      puertos: 'Порти',
      compose: 'Compose',
      acciones: 'Дії',
    },
    estados: {
      corriendo: 'Працює',
      detenido: 'Зупинено',
      pausado: 'Призупинено',
      otro: 'Інше',
    },
    codigoSalida: (n: number) => `код ${n}`,
    iniciar: 'Запустити',
    detener: 'Зупинити',
    reiniciar: 'Перезапустити',
    registros: 'Журнали',
    confirmarDetenerTitulo: 'Зупинити контейнер?',
    confirmarDetener: (n: string) =>
      `Контейнер «${n}» буде зупинено. Процеси всередині перервуться (рушій зачекає кілька секунд на завершення). Нічого не видаляється.`,
    confirmarReiniciarTitulo: 'Перезапустити контейнер?',
    confirmarReiniciar: (n: string) =>
      `Контейнер «${n}» буде перезапущено. Процеси всередині перервуться й запустяться знову. Нічого не видаляється.`,
    confirmar: 'Підтвердити',
    cancelar: 'Скасувати',
    hecho: {
      iniciar: (n: string) => `«${n}» запущено.`,
      detener: (n: string) => `«${n}» зупинено.`,
      reiniciar: (n: string) => `«${n}» перезапущено.`,
    },
    registroTitulo: (n: string) => `Журнали «${n}»`,
    registroEsperando: 'Очікування рядків…',
    registroFin: 'Журнал завершено (контейнер зупинився або рушій розірвав з’єднання).',
    cerrar: 'Закрити',
  },
  versiones: {
    pestana: 'Версії',
    pestanaServicios: 'Служби',
    elegirServicio: 'Служба',
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
        'Кожна основна версія (8.4, 17…) має власний екземпляр зі своєю папкою даних і портом: можна запустити кілька одночасно. Зірочка позначає версію для нових проєктів.',
      pool: 'Кожна запущена версія PHP має власний процес PHP; зірочка позначає версію для нових проєктів.',
      unica:
        'Можна встановити кілька версій, але запущеною залишається лише одна: запуск іншої змінює активну.',
      ninguno:
        'Нічого запускати не потрібно: проєкти використовують потрібну їм версію або версію за замовчуванням (зірочка).',
    },
    filtroRama: 'Версія',
    todasRamas: 'Усі версії',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Показати всі',
    origen: {
      vivo: 'Онлайн',
      cache: (h: number) => (h < 1 ? 'Кеш менш ніж 1 год тому' : `Кеш ${h} год тому`),
      fija: 'Офлайн-список',
    },
    actualizarLista: 'Оновити список',
    errorCarga: 'Не вдалося прочитати список версій',
    vacio: 'Немає версій для відображення.',
    soporte: { lts: 'LTS', actual: 'Актуальна', fin: 'Без підтримки', preview: 'Preview' },
    finSoporte: (f: string) => `Підтримка до ${f}`,
    finSoportePasado: (f: string) => `Без підтримки з ${f}`,
    marcas: {
      instalada: 'Встановлено',
      encendida: 'Запущено',
      actualizacion: (v: string) => `Оновлення: ${v}`,
      bloqueada: 'Заблоковано',
      sinHuella: 'Без опублікованого хешу',
      huellaDebil: 'Лише хеш MD5',
      firmada: 'З підписом PGP',
    },
    ayudaFirmada:
      'Офіційне джерело підписує це завантаження ключем PGP: перед встановленням WolfCore Dev перевіряє підпис за допомогою вбудованих у програму ключів.',
    ayudaSinHuella:
      'Офіційне джерело не публікує надійний хеш (SHA-256 або SHA-512): завантаження неможливо перевірити.',
    instalar: 'Встановити',
    desinstalar: 'Видалити',
    encender: 'Запустити',
    apagar: 'Зупинити',
    actualizar: 'Оновити',
    usarEsta: 'Використати цю версію',
    usarEstaAyuda: (id: string) =>
      `${id} використовує іншу версію цієї служби: перемикання відбудеться з попереднім створенням резервної копії даних.`,
    predeterminada: 'За замовчуванням для нових проєктів',
    hacerPredeterminada: 'Використовувати для нових проєктів',
    predeterminadaHecha: (v: string) => `${v} встановлено за замовчуванням.`,
    puerto: 'Порт',
    puertoDe: (id: string) => `Порт ${id}`,
    cambiarPuerto: 'Змінити',
    puertoCambiado: (p: number) => `Порт змінено на ${p}.`,
    puertoProyectosTitulo: 'Проєкти зі старим портом',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Ці проєкти все ще використовують порт ${viejo} у своєму .env (їх не змінювали): ${lista}. Змініть його на ${nuevo}.`,
    resolver: 'Вирішити',
    instalada: (v: string) => `${v} встановлено.`,
    selector: { etiqueta: 'Екземпляр', predeterminada: 'за замовчуванням', apagada: 'зупинено' },
    dialogoSinHuella: {
      titulo: (v: string) => `Встановити ${v} без перевірки хешу`,
      riesgo:
        'Для цієї версії офіційне джерело не опублікувало хеш: WolfCore Dev не може перевірити, що завантажений файл є оригінальним.',
      explicacion:
        'Завантаження все одно відбувається через HTTPS з офіційного сайту, але якщо цей сайт або з’єднання скомпрометовано, це залишиться непоміченим. Встановлюйте її лише за нагальної потреби.',
      alternativa: (v: string) => `Є перевірена версія цієї самої служби: ${v}.`,
      casilla: 'Я розумію ризик і хочу встановити без перевірки',
      instalarVerificada: (v: string) => `Встановити ${v} (перевірену)`,
      instalarIgual: 'Встановити без перевірки',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Оновити ${n}`,
      tituloRama: (v: string) => `Нова версія: ${v}`,
      ninguna: 'жодної',
      instancia: (id: string) => `Оновлюється екземпляр ${id}. Перш ніж щось змінювати:`,
      pasoInstalar: (v: string) =>
        `встановлюється ${v} поруч із поточною версією (яка не видаляється);`,
      pasoVolcados: 'створюється дамп кожної бази даних поточною версією;',
      pasoCopia: 'екземпляр зупиняється і повністю копіюється папка даних (холодна копія);',
      pasoArrancar: 'запускається нова версія та перевіряється її відповідь;',
      pasoVuelta:
        'якщо запуск не вдасться, відбудеться повернення до попередньої версії з її даними, а резервна копія збережеться.',
      datos: 'Дані:',
      respaldo: 'Копія в:',
      espacio: 'Місце:',
      espacioLibre: (libres: string, necesarios: string) =>
        `вільно ${libres}; потрібно ${necesarios}`,
      datosQuedan:
        'Попередні дані ніколи не видаляються: копія та дампи залишаються в «Резервних копіях оновлень», доки ви самі їх не видалите.',
      sinEspacio: 'Недостатньо місця для резервної копії: звільніть місце та спробуйте ще раз.',
      alLado: (v: string) =>
        `Встановлюється ${v}. Інші встановлені версії не змінюються; проєкти, що закріплюють іншу версію, продовжують її використовувати.`,
      ramaExplicacion:
        'Нова основна версія не замінює попередню: створюється новий екземпляр із власною папкою даних і портом. Поточний екземпляр залишається без змін.',
      copiarDesdeTitulo: 'Дані нового екземпляра',
      copiarDesde: (id: string) =>
        `Скопіювати дані з ${id} (створюється дамп і відновлюється; оригінал не змінюється)`,
      vacia: 'Почати з порожньої',
      ramaNota:
        'Користувачі бази даних не копіюються; проєкти потрібно переналаштувати на порт нового екземпляра.',
      crearInstancia: 'Створити новий екземпляр',
      confirmar: 'Оновити з резервною копією',
      hecho: (v: string) => `${v} оновлено.`,
      fallo: 'Не вдалося оновити',
      ramaCreada: (id: string) => `Екземпляр ${id} створено.`,
      copiadas: (l: string) => `Скопійовано: ${l}.`,
      noCopiada: (b: string, m: string) => `Не вдалося скопіювати ${b}: ${m}`,
    },
    limpieza: {
      boton: 'Очистити невикористовувані версії…',
      titulo: 'Очистити невикористовувані версії',
      intro:
        'Видаляються лише виконувані файли версій, які ніде не використовуються (папка bin). Дані баз, екземпляри та ваші проєкти ніколи не зачіпаються.',
      cargando: 'Пошук версій…',
      vacia: 'Немає встановлених версій.',
      sinLibres: 'Усі встановлені версії використовуються: очищати нічого.',
      fallo: 'Не вдалося очистити',
      fallaLista: 'Не вдалося прочитати список версій',
      bloqueada: 'Не можна позначити',
      marcadas: (n: number, tam: string) => `${plural(n, 'версія', 'версії', 'версій')} · ${tam}`,
      destinoTitulo: 'Що з ними зробити',
      papelera:
        'Перемістити в кошик: зберігаються 7 днів і доти продовжують займати місце на диску',
      definitivo: 'Видалити остаточно: звільняє місце негайно, дію неможливо скасувати',
      avisoDefinitivo:
        'Остаточне видалення: щоб знову мати ці версії, їх доведеться завантажувати повторно.',
      instantanea:
        'Якщо ви виберете остаточне видалення, перед цим збережеться копія конфігурації середовища; із кошика версії можна відновити.',
      entiendo: 'Я розумію, що цю дію неможливо скасувати',
      confirmar: (n: number) => `Видалити ${plural(n, 'версію', 'версії', 'версій')}`,
      motivos: {
        predeterminada: 'Версія за замовчуванням',
        encendida: 'Запущена або виконується',
        sitio: 'Використовується проєктом',
        instancia: 'Використовується екземпляром (навіть якщо він зупинений)',
        plantilla: 'Використовується шаблоном',
        workspace: 'Використовується workspace',
        runtime: 'Використовується проєктом',
        tarea: 'Використовується проєктом із запланованими завданнями',
        duda: 'Не вдалося перевірити: не видаляється',
        datos: 'Містить дані, які може відкрити лише ця версія',
        herramienta: 'Використовується phpMyAdmin або Adminer',
      },
      resultadoTitulo: 'Результат',
      liberadas: (tam: string) => `Звільнено ${tam}.`,
      enPapelera: (tam: string) => `${tam} переміщено в кошик (очищається через 7 днів).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${plural(n, 'версія вже видалена з bin, але залишилися фрагменти', 'версії вже видалені з bin, але залишилися фрагменти', 'версій уже видалено з bin, але залишилися фрагменти')}, які буде повторно видалено під час запуску програми.`,
      instantaneaGuardada: 'Копію середовища збережено перед видаленням.',
      ajeno: (lista: string) =>
        `Містить те, що ви встановили всередині: ${lista}. Після видалення це буде втрачено.`,
      incluirAjeno: 'Видалити попри втрату цих даних',
      sinCatalogo:
        'Її більше немає в каталозі: після видалення ви не зможете завантажити її знову.',
      papeleraTitulo: 'У кошику',
      recuperar: 'Відновити',
      recuperada: (v: string) => `${v} відновлено.`,
      borradaEl: (f: string) => `Видалено ${f}`,
      fallaRecuperar: 'Не вдалося відновити',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Видалити ${v}`,
      binario: 'Видаляються лише виконувані файли цієї версії.',
      instancia: (id: string) =>
        `Її використовує екземпляр ${id}: його буде зупинено та видалено зі списку екземплярів.`,
      datosQuedan:
        'Ваші дані залишаються на диску: якщо ви знову встановите цю версію, екземпляр знову їх відкриє.',
      borrarDatos: 'Також видалити дані',
      borrarAviso: (id: string) =>
        `Папку даних ${id} разом з усіма її базами буде видалено. Цю дію неможливо скасувати. Введіть "${id}" для підтвердження.`,
      escriba: (id: string) => `Введіть ${id} для підтвердження`,
      desinstalar: 'Видалити',
      desinstalarYBorrar: 'Видалити разом із даними',
      unica:
        'Це активна версія: якщо вона єдина встановлена, її можна видалити за зупиненої служби (служба залишиться невстановленою); якщо є інші, спочатку виберіть іншу як активну (зірочка).',
      predeterminada: (id: string) =>
        `${id} — екземпляр за замовчуванням: Бази даних, блок .env та інструменти, що використовують цей рушій, перейдуть на інший екземпляр (з іншим портом).`,
      hecho: (v: string) => `${v} видалено.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Вирішити ${id}`,
      explicacion:
        'Оновлення завершилося з помилкою, і дані цього екземпляра не вдалося повернути, тому він не запускається, доки Ви не виберете, що робити. Нічого не видаляється.',
      fallida: 'Змінені дані:',
      respaldo: 'Резервна копія:',
      opciones: 'Що робити',
      devolver: (sello: string, tam: string) =>
        `Повернути резервну копію ${sello} (${tam}); поточну папку буде відкладено, а не видалено`,
      usarActual: 'Використовувати поточну папку даних як є',
      notaActual: 'Лише якщо поточна папка містить повні дані; якщо ні — виберіть резервну копію.',
      notaDevolver:
        'Резервна копія копіюється, перевіряється і лише після цього встановлюється на місце.',
      escriba: (id: string) => `Введіть ${id} для підтвердження`,
      elegirVersion:
        'Не вдалося прочитати позначку блокування: виберіть версію, якою відкриватимуться дані (ту, що була до оновлення).',
      version: 'Версія',
      confirmar: 'Вирішити',
      hecho: (id: string) => `${id} розблоковано. Тепер можна запустити.`,
    },
    respaldos: {
      titulo: 'Резервні копії оновлень',
      descripcion:
        'Копії, що залишилися після оновлень і нових версій. Папка даних, яку використовує кожен екземпляр, тут ніколи не відображається.',
      vacio: 'Копій немає.',
      tipos: {
        respaldo: 'Холодна копія',
        volcados: 'Дампи баз даних',
        fallida: 'Дані версії, що завершилася з помилкою',
        restaurando: 'Незавершене відновлення',
        copia: 'Дампи для нової версії',
      },
      archivos: (n: number) => plural(n, 'файл', 'файли', 'файлів'),
      borrar: 'Видалити',
      borrarDe: (n: string) => `Видалити ${n}`,
      confirmarTitulo: 'Видалити копію',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) буде видалено. Цю дію не можна скасувати. Дані, якими користуються екземпляри, не змінюються.`,
      borrado: 'Копію видалено.',
    },
  },
  navGrupos: {
    trabajo: 'Робота',
    entorno: 'Середовище',
    utilidades: 'Утиліти',
  },
  avisos: {
    campana: 'Сповіщення',
    campanaConNuevos: (n: number) => `Сповіщення: ${n} непрочитаних`,
    titulo: 'Центр сповіщень',
    vacio:
      'Сповіщень немає. Тут з’являтимуться збої служб, зайняті порти та сертифікати, термін дії яких спливає.',
    marcarTodos: 'Позначити все як прочитане',
    limpiar: 'Очистити історію',
    ver: 'Переглянути',
    actualizar: 'Оновити',
    verVersiones: 'Переглянути версії',
    cerrar: 'Закрити',
    niveles: { info: 'Інформація', aviso: 'Сповіщення', error: 'Помилка' },
    sinLeer: 'Непрочитано',
  },
  barra: {
    paleta: 'Знайти або виконати команду',
    atajoPaleta: 'Ctrl+K',
    tema: 'Змінити тему',
    idioma: 'Змінити мову',
  },
  preferencias: {
    titulo: 'Зовнішній вигляд і мова',
    descripcion: 'Зміни застосовуються миттєво та зберігаються на цьому комп’ютері.',
    tema: 'Тема',
    temas: { sistema: 'Системна', claro: 'Світла', oscuro: 'Темна' },
    idioma: 'Мова',
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
    traduccionAutomatica: 'Машинний переклад, перевірено',
    acento: 'Колір акценту',
    acentos: {
      indigo: 'Індиго',
      azul: 'Синій',
      verde: 'Зелений',
      violeta: 'Фіолетовий',
      naranja: 'Помаранчевий',
      rosa: 'Рожевий',
    },
    acentoPropio: (color: string) => `Власний (${color})`,
    errorGuardar: 'Не вдалося зберегти налаштування',
  },
  paleta: {
    titulo: 'Палітра команд',
    placeholder: 'Знайдіть екран, службу, проєкт або інструмент…',
    sinResultados: 'Жодна команда не відповідає пошуковому запиту.',
    ayuda: '↑ ↓ для переміщення · Enter для виконання · Esc для закриття',
    grupos: {
      navegacion: 'Перейти до',
      servicios: 'Служби',
      proyectos: 'Проєкти',
      herramientas: 'Інструменти',
      github: 'GitHub',
      general: 'Загальне',
    },
    irA: (pantalla: string) => `Перейти до ${pantalla}`,
    encender: (servicio: string) => `Запустити ${servicio}`,
    apagar: (servicio: string) => `Зупинити ${servicio}`,
    iniciarTodo: 'Запустити всі служби',
    detenerTodo: 'Зупинити всі служби',
    iniciarWorkspace: (n: string) => `Запустити workspace ${n}`,
    detenerWorkspace: (n: string) => `Зупинити workspace ${n}`,
    abrirSitio: (nombre: string) => `Відкрити ${nombre} у браузері`,
    traerCambios: (nombre: string) => `Отримати зміни в ${nombre}`,
    abrirHerramienta: (nombre: string) => `Відкрити ${nombre}`,
    clonar: 'Клонувати репозиторій із GitHub',
    agregarProyecto: 'Додати проєкт',
    nuevoProyecto: 'Створити новий проєкт',
    tema: (tema: string) => `Тема: ${tema}`,
    idioma: (idioma: string) => `Мова: ${idioma}`,
  },
  nuevoProyecto: {
    titulo: 'Новий проєкт',
    boton: 'Новий проєкт',
    descripcion: 'Створіть проєкт з нуля: папку, сайт із HTTPS, базу даних та її підключення.',
    pasos: { tipo: 'Тип', datos: 'Дані', resumen: 'Підсумок', crear: 'Створення' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Із Composer; ключ застосунку, база та міграції.',
      },
      codeigniter4: {
        nombre: 'CodeIgniter 4',
        descripcion: 'Офіційний appstarter із власним .env.',
      },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Класичний фреймворк із налаштованим database.php.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Офіційний каркас (або webapp) із власним .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Віртуальне середовище, requirements.txt і процес uvicorn.',
      },
      wordpress: {
        nombre: 'WordPress',
        descripcion: 'Офіційне завантаження з готовим wp-config.php.',
      },
      estatico: {
        nombre: 'Статичний сайт',
        descripcion: 'HTML і CSS через Nginx, без бази даних.',
      },
    },
    campos: {
      nombre: 'Назва проєкту',
      nombrePlaceholder: 'miy-mahazyn',
      nombreAyuda: (dominio: string) => `Буде ${dominio}: малі літери, цифри та дефіси.`,
      carpeta: 'Батьківська папка',
      elegirCarpeta: 'Вибрати папку…',
      cambiarCarpeta: 'Змінити папку…',
      carpetaAyuda:
        'Проєкт створюється в новій папці з його назвою всередині цієї папки. Вона має бути порожньою або не існувати.',
      php: 'Версія PHP',
      python: 'Версія Python',
      sinInstalada: 'Нічого не встановлено: встановіть у розділі Служби.',
      conBase: 'Створити базу даних для проєкту',
      sinBase: 'Без бази даних',
      instancia: 'Сервер бази даних',
      apagada: 'вимкнено',
      apagadaAyuda:
        'Цей сервер вимкнено: запустіть його в розділі Служби перед створенням проєкту.',
      sinMotores: 'Для цього типу проєкту не встановлено жодного сервера баз даних.',
      nombreBase: 'Назва бази',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Жодного', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Додати вебпакунки (webapp)',
      pgvector: 'Увімкнути pgvector (векторний пошук)',
    },
    huella: {
      titulo: 'WordPress публікує лише слабкий відбиток',
      riesgo:
        'Опублікований відбиток — це SHA-1, алгоритм, який більше не вважається надійним, і він надходить із того самого сайту, що й файл.',
      explicacion:
        'Якщо цей сайт або з’єднання буде скомпрометовано, підмінений файл пройде перевірку. Завантаження все одно відбувається через HTTPS із wordpress.org. Продовжуйте лише якщо довіряєте цьому джерелу.',
      leyendo: 'Читання опублікованого відбитка…',
      noDisponible:
        'Зараз не вдалося прочитати відбиток (немає з’єднання або джерело не відповіло); його буде прочитано повторно під час створення.',
      fuente: 'Джерело: wordpress.org',
      casilla: 'Я розумію, що відбиток слабкий, і все одно хочу створити проєкт',
    },
    resumen: {
      titulo: 'Буде створено',
      intro: 'Перевірте перед початком.',
      tipo: 'Тип',
      carpeta: 'Папка',
      sitio: 'Сайт',
      dominio: 'Домен',
      https: 'Адреса з HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'База даних',
      env: 'Підключення записано в',
      nota: 'Якщо якийсь крок завершиться з помилкою, нічого не видаляється: Ви побачите, що вже створено, і зможете повторити спробу.',
    },
    errores: {
      nombreVacio: 'Введіть назву проєкту.',
      nombreInvalido:
        'Назва може містити лише малі літери, цифри та дефіси (до 40), не починаючись і не закінчуючись дефісом.',
      sinCarpeta: 'Виберіть батьківську папку проєкту.',
      sinPhp: 'Виберіть версію PHP (встановіть її в розділі Служби, якщо жодної немає).',
      sinPython: 'Виберіть версію Python (встановіть її в розділі Служби, якщо жодної немає).',
      sinInstancia: 'Виберіть сервер для створення бази даних або зніміть позначку бази.',
      baseInvalida: 'Назва бази недійсна для цієї СУБД.',
      motorNoVale: 'Для WordPress потрібні MySQL або MariaDB.',
      pgvectorMotor: 'Для pgvector потрібен PostgreSQL.',
      huellaDebil: 'Підтвердьте, що Ви розумієте, що відбиток WordPress слабкий.',
    },
    acciones: {
      cambiarCarpeta: 'Вибрати іншу папку',
      cambiarBase: 'Змінити назву бази',
      cambiarNombre: 'Змінити назву',
      reintentarPaso: 'Повторити крок',
      servicios: 'Перейти до Служб',
      confirmarHuella: 'Перевірити підтвердження',
    },
    botones: {
      siguiente: 'Далі',
      atras: 'Назад',
      crear: 'Створити проєкт',
      creando: 'Створення…',
      cerrar: 'Закрити',
      abrirEditor: 'Відкрити в редакторі',
      verSitio: 'Переглянути сайт',
      verProyecto: 'Переглянути в Проєктах',
    },
    progreso: {
      titulo: 'Створення проєкту',
      listo: 'Проєкт створено.',
      fallo: (paso: string) =>
        `Крок «${paso}» завершився з помилкою. Нічого не видалено: повторіть крок або виправте проблему та спробуйте ще раз.`,
      quedo: (partes: string) => `Створено: ${partes}.`,
      quedoCarpeta: 'папку',
      quedoBase: (nombre: string) => `базу ${nombre}`,
      quedoSitio: 'сайт',
      avisos: 'Сповіщення',
      sinUsuarioPropio:
        'Системне шифрування недоступне: проєкт використовує підключення адміністратора бази. Коли воно стане доступним, скористайтеся «Використовувати власного користувача» в менеджері .env.',
      editorFallo: 'Не вдалося відкрити редактор.',
    },
  },
  importar: {
    boton: 'Імпортувати…',
    titulo: 'Імпорт із Laragon, XAMPP або Herd',
    intro:
      'Сайти прив’язуються на своїх поточних місцях: жодна папка не переміщується, не копіюється і не змінюється. За бажанням також копіюються їхні бази даних. WolfCore Dev лише читає встановлення інших програм.',
    buscando: 'Пошук встановлень…',
    nada: 'Laragon, XAMPP і Herd не знайдено у звичних папках.',
    errorVista: 'Не вдалося знайти дані для імпорту',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Сайти',
      todos: 'Вибрати всі',
      ninguno: 'Зняти вибір',
      dominio: (d: string) => `Домен ${d}`,
      dominioPropuesto: (d: string) => `Домен ${d} (запропоновано)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP не визначено',
      base: (nombre: string, motor: string) => `База ${nombre} (${motor})`,
      yaVinculado: 'Вже є сайтом WolfCore Dev',
      dominioEnUso: 'Інший сайт уже використовує цей домен',
    },
    avisos: {
      sin_dominio: 'Немає домену в іншій програмі: запропоновано новий.',
      dominio_invalido: 'Домен недійсний: запропоновано новий.',
      sin_vhost: 'Немає власного віртуального хоста: запропоновано домен.',
      php_desconocido: 'Невідомо, яка версія PHP використовується: вибрано встановлену.',
      base_no_local: 'База знаходиться на іншому сервері: не імпортується.',
      base_nombre_invalido: 'Назва бази недійсна: не імпортується.',
      motor_no_soportado: 'База не є MySQL або MariaDB: не імпортується.',
    },
    problemas: {
      titulo: (n: number) =>
        `${plural(n, 'елемент', 'елементи', 'елементів')} відхилено або не вдалося прочитати`,
    },
    bases: {
      titulo: 'Бази даних',
      importarBases: 'Також імпортувати бази даних',
      ayuda:
        'Запустіть сервер баз даних іншої програми перед продовженням: WolfCore Dev не запускає і не зупиняє сторонні програми. Пароль використовується лише для цього імпорту й не зберігається.',
      destino: 'Цільовий сервер',
      apagada: 'вимкнено',
      sinMotores:
        'MySQL або MariaDB не встановлено: встановіть їх у розділі Служби, щоб імпортувати бази.',
      puerto: 'Порт сервера-джерела',
      usuario: 'Користувач',
      clave: 'Пароль',
      claveAyuda: 'Залиште порожнім, якщо користувач не має пароля (як root у Laragon або XAMPP).',
      existe: 'вже існує на призначенні',
      reemplazar: 'Замінити (попередньо створюється копія)',
      noSeToca: 'Не змінюється, якщо не позначити.',
    },
    pasos: { elegir: 'Вибір', confirmar: 'Підтвердження' },
    continuar: 'Продовжити',
    volver: 'Назад',
    cancelar: 'Скасувати',
    importar: 'Імпортувати',
    cerrar: 'Закрити',
    sinSeleccion: 'Виберіть щонайменше один сайт.',
    origenIncompleto: 'Вкажіть порт і користувача сервера-джерела.',
    confirmar: {
      titulo: 'Підтвердьте імпорт',
      sitios: (n: number) =>
        `Буде прив’язано ${plural(n, 'сайт', 'сайти', 'сайтів')} у поточній папці. Жоден файл не переміщується, не копіюється і не змінюється.`,
      sinConfianza:
        'Жоден імпортований сайт не запускає рецепти, доки Ви не позначите «Довіряю цьому репозиторію».',
      hosts: 'Буде оновлено Nginx і файл hosts (Windows може запросити права адміністратора).',
      basesNuevas: (nombres: string) => `Буде скопійовано бази: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Буде замінено ці бази, що вже існують: ${nombres}. Попередньо буде збережено копію кожної з них.`,
      basesSinTocar: (nombres: string) =>
        `Ці бази, що вже існують, не змінюватимуться: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Буде знято дамп із сервера іншої програми (127.0.0.1:${puerto}, користувач ${usuario}). Читання без змін.`,
      sinBases: 'Жодна база даних не імпортуватиметься.',
      proteccion:
        'Структура кожної бази перевіряється заздалегідь, а дані записуються обмеженим користувачем: якщо виникне помилка, база залишиться як була.',
    },
    resultado: {
      titulo: 'Результат імпорту',
      importando: 'Імпортування…',
      cancelar: 'Скасувати імпорт',
      restaurada: 'Початкову базу автоматично відновлено з її копії: вона залишилася як була.',
      sitioOk: 'Імпортовано',
      sitioFallo: 'Не імпортовано',
      baseOk: (n: string) => `Базу ${n} імпортовано`,
      baseFallo: (n: string) => `Базу ${n} не імпортовано`,
      copiaPrevia: (ruta: string) => `Копія попередньої бази: ${ruta}`,
      phpDistinto: (v: string) => `Використано PHP ${v} (початкова версія не була встановлена).`,
      sinAplicar:
        'Nginx або файл hosts не оновлено: перевірте сповіщення в Проєктах і повторіть спробу.',
      resumen: (s: number, b: number) =>
        `${plural(s, 'імпортований сайт', 'імпортовані сайти', 'імпортованих сайтів')}, ${plural(b, 'імпортована база', 'імпортовані бази', 'імпортованих баз')}.`,
      errorImportar: 'Не вдалося імпортувати',
    },
  },
  plantillas: {
    guardarComo: 'Зберегти як шаблон…',
    dialogo: {
      titulo: (nombre: string) => `Зберегти «${nombre}» як шаблон`,
      intro:
        'Шаблон зберігає рецепт, налаштування PHP і Nginx, розширення та схему бази (лише структуру, без жодного рядка даних). Ніколи не зберігає паролі, ключі чи дані бази.',
      nombre: 'Назва шаблону',
      nombrePlaceholder: 'Мій базовий проєкт',
      conArchivos: 'Також додати файли проєкту',
      conArchivosAyuda: 'Без цього зберігаються лише рецепт, налаштування та схема.',
      siempre: 'Завжди виключаються',
      siempreLista:
        '.env та .env.*, vendor, node_modules, .git, .venv, журнали, дампи й файлові бази (*.sql, *.dump, *.sqlite), ключі та сертифікати (*.pem, *.key, *.crt…), wp-config.php і wolfcore.yml. Файл, що містить ключ або пароль, також виключається.',
      extra: 'Додатково виключити (по одному на рядок)',
      extraAyuda: 'Назви або шляхи відносно проєкту, наприклад uploads або public/build.',
      vista: 'Що буде збережено',
      calculando: 'Обчислення…',
      resumen: (archivos: number, tamano: string) =>
        `${plural(archivos, 'файл', 'файли', 'файлів')} · ${tamano}`,
      fuera: (n: number) => `${n} виключено`,
      sinArchivos: 'Будуть збережені лише рецепт, налаштування та схема; без файлів.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Буде збережено лише структуру бази ${nombre} (сервер ${servidor}), без жодного рядка даних.`,
      sinBase: 'Проєкт не оголошує базу даних: жодна схема не зберігатиметься.',
      avisoMongodb:
        'Цей проєкт використовує MongoDB: його схема (колекції та індекси) не зберігається.',
      incluirDeTodosModos: 'Додати все одно',
      avisoIncluir: 'Якщо цей файл містить справжній ключ, він потрапить до шаблону.',
      guardar: 'Зберегти шаблон',
      guardada: (nombre: string) => `Шаблон «${nombre}» збережено.`,
      errorGuardar: 'Не вдалося зберегти шаблон',
      errorVista: 'Не вдалося обчислити попередній перегляд',
      cancelar: 'Скасувати',
    },
    lista: {
      titulo: 'Мої шаблони',
      ayuda:
        'Почніть новий проєкт із рецептом, налаштуваннями та схемою (без даних) уже наявного проєкту.',
      vacia: 'Шаблонів ще немає. Збережіть проєкт як шаблон через меню його картки.',
      conArchivosEtiqueta: 'із файлами',
      soloEsquema: 'рецепт і схема',
      conBase: (motor: string) => `база ${motor} без даних`,
      borrarEtiqueta: (nombre: string) => `Видалити шаблон ${nombre}`,
      borrarTitulo: (nombre: string) => `Видалити шаблон ${nombre}?`,
      borrarTexto:
        'Видаляється лише шаблон. Проєкти, створені з нього, та вихідний проєкт не змінюються.',
      borrada: 'Шаблон видалено.',
      errorBorrar: 'Не вдалося видалити шаблон',
      errorLista: 'Не вдалося прочитати шаблони',
      desde: (nombre: string) => `Шаблон: ${nombre}`,
      avisoSinBase: 'Цей шаблон не містить бази даних.',
      importadaEtiqueta: 'імпортований',
      avisoImportada:
        'Шаблон походить від третьої сторони: проєкт створюється без довіри й без запуску його процесів, а відкриття сайту виконує його код. Перевірте файли заздалегідь.',
      generadoresTitulo: 'Проєкти з нуля',
    },
  },
  env: {
    accion: 'Змінні .env…',
    titulo: (nombre: string) => `.env проєкту ${nombre}`,
    intro:
      'Секретні значення відображаються прихованими. Повне значення з’являється лише після натискання «Показати» біля відповідної змінної та знову ховається через 30 секунд. Перед збереженням створюється копія поточного .env із датою.',
    noExiste: 'Цей проєкт ще не має файлу .env: його буде створено під час збереження.',
    tablaEtiqueta: 'Змінні .env',
    sinVariables: 'У .env немає змінних.',
    secretaEtiqueta: 'секретна',
    duplicadaEtiqueta: 'дублікат',
    duplicadaAyuda:
      'Ця змінна зустрічається в .env більше одного разу: відображається і змінюється остання.',
    soloLecturaEtiqueta: 'кілька рядків',
    soloLecturaAyuda: 'Займає кілька рядків: відредагуйте її вручну у файлі.',
    seQuitara: 'Буде видалено під час збереження',
    valorNuevo: 'Нове значення',
    valorNuevoDe: (clave: string) => `Нове значення ${clave}`,
    valorDe: (clave: string) => `Значення ${clave}`,
    vacio: '(порожньо)',
    mostrar: 'Показати',
    ocultar: 'Сховати',
    mostrarEtiqueta: (clave: string) => `Показати значення ${clave}`,
    ocultarEtiqueta: (clave: string) => `Сховати значення ${clave}`,
    cambiar: 'Змінити',
    deshacer: 'Скасувати зміну',
    deshacerEtiqueta: (clave: string) => `Скасувати зміну ${clave}`,
    quitar: 'Видалити',
    quitarEtiqueta: (clave: string) => `Видалити змінну ${clave}`,
    errorRevelar: 'Не вдалося показати значення',
    agregarTitulo: 'Додати змінну',
    agregarNombre: 'НАЗВА',
    agregarValor: 'значення',
    agregar: 'Додати',
    nombreInvalido:
      'Використовуйте літери, цифри, підкреслення й крапку, не починаючи з цифри; назва не повинна вже існувати.',
    comparar: {
      titulo: 'Порівняти з файлом-прикладом',
      sinEjemplo: 'У проєкті немає .env.example для порівняння.',
      alDia: 'У .env ті самі змінні, що й у прикладі.',
      faltan: (n: number) => `Бракує ${n}:`,
      sobran: (n: number) => `Зайвих ${n} (немає в прикладі):`,
      distintas: (n: number) => `${n} мають значення, відмінне від прикладу:`,
      agregarFaltantes: 'Додати відсутні',
    },
    bloques: {
      titulo: 'Додати блок змінних',
      ayuda:
        'Додає в .env лише ті змінні цієї теми, яких бракує (наявні не змінюються), без паролів і ключів; заповніть їх згодом у таблиці.',
      bd: 'База даних',
      correo: 'Пошта',
      ia: 'ШІ',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Використовувати власного користувача',
      ayuda:
        'Створює користувача бази лише для цього проєкту (з правами тільки на його базу, ніколи не адміністратора) і записує його в .env. Наразі працює з MySQL і MariaDB у WolfCore Dev.',
      confirmarTitulo: 'Використовувати власного користувача для бази?',
      confirmarTexto:
        'Створюється новий користувач із випадковим паролем і правами лише на базу цього проєкту, а користувач і пароль підключення в .env оновлюються. Попередньо зберігається копія поточного .env; новий пароль записується в .env проєкту та зберігається зашифрованим у WolfCore Dev.',
      confirmar: 'Створити й використати',
      hecho: (usuario: string) => `Тепер проєкт використовує користувача ${usuario}.`,
      compartirTitulo: 'Поділитися користувачем іншого проєкту?',
      compartirTexto: (base: string, proyecto: string) =>
        `Базу ${base} також використовує ${proyecto}. Поділитися його користувачем? Цей проєкт використовуватиме того самого користувача і пароль; пароль не змінюється, тому ${proyecto} залишається підключеним.`,
      compartir: 'Поділитися користувачем',
      error: 'Не вдалося змінити користувача бази',
    },
    copias: {
      titulo: 'Повернутися до копії',
      ninguna: 'Копій цього .env ще немає.',
      volver: 'Повернутися до цієї копії',
      confirmarTitulo: 'Повернутися до копії .env?',
      confirmarTexto: (fecha: string) =>
        `Поточний .env буде замінено копією від ${fecha}. Попередньо зберігається ще одна копія поточного файлу, тож дію також можна скасувати.`,
      hecho: 'Повернуто до копії.',
      error: 'Не вдалося повернутися до копії',
    },
    cambiosPendientes: (n: number) =>
      plural(n, 'незбережена зміна', 'незбережені зміни', 'незбережених змін'),
    descartar: 'Відхилити зміни',
    guardar: 'Перевірити й зберегти…',
    cerrar: 'Закрити',
    cerrarTitulo: 'Закрити без збереження?',
    cerrarTexto: (n: number) =>
      `Є ${plural(n, 'незбережена зміна', 'незбережені зміни', 'незбережених змін')}. Якщо закрити, їх буде втрачено.`,
    cerrarDescartar: 'Закрити й відхилити',
    seguirEditando: 'Продовжити редагування',
    confirmar: {
      titulo: 'Зберегти зміни .env',
      texto:
        'Ось що зміниться. Секретні значення відображаються прихованими. Зберігається копія поточного .env із датою, а файл записується за один раз.',
      sinCambios: 'Немає змін для збереження.',
      agregarGitignore: 'Додати .env до .gitignore проєкту',
      aceptarVersionado: 'Я розумію ризик і все одно хочу зберегти',
      guardar: 'Зберегти зміни',
      versionado:
        'Git уже відстежує .env цього проєкту: наступний commit завантажить його значення, навіть якщо файл є в .gitignore. Видаліть його з індексу командою git rm --cached .env.',
      versionadoDesconocido:
        'Не вдалося перевірити, чи відстежує git .env цього проєкту; окремо підтвердьте збереження.',
    },
    errorVistaPrevia: 'Не вдалося підготувати попередній перегляд',
    errorGuardar: 'Не вдалося зберегти .env',
    guardado: 'Файл .env збережено.',
    guardadoConCopia: 'Файл .env збережено; попередню версію збережено як копію.',
  },
  asistenteInicio: {
    paso: (n: number, total: number) => `Крок ${n} із ${total}`,
    anterior: 'Назад',
    siguiente: 'Далі',
  },
  /** Результат імпорту або експорту профілю (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Резервні копії та профілі',
      descripcion:
        'Профіль переносить Ваше середовище на інший компʼютер: сайти, версії, екземпляри, шаблони та налаштування. Він ніколи не містить ключів, токенів чи паролів.',
      aislado: {
        titulo: 'Тестова тека',
        texto: (ruta: string) =>
          `WolfCore Dev використовує тестову теку даних (${ruta}). Усе, що Ви робите тут, не зачіпає Вашу основну теку та систему: файл hosts не змінюється, а сертифікати не встановлюються.`,
      },
      exportar: {
        titulo: 'Експортувати середовище',
        texto:
          'Зберігає файл .wolfperfil із Вашими сайтами, версіями, екземплярами, шаблонами та налаштуваннями.',
        bases: 'Включити бази даних',
        basesAyuda:
          'Повні дампи (разом із даними Ваших клієнтів) передаються зашифрованими цією фразою.',
        ca: 'Включити центр сертифікації (CA)',
        caAyuda: 'Шифрується цією фразою. Імпортуйте його лише на власному компʼютері.',
        certificados: 'Включити сертифікати сайтів',
        certificadosAyuda: 'Передаються лише разом із CA та шифруються разом із ним.',
        frase: 'Фраза',
        fraseRepetir: 'Повторити фразу',
        fraseAyuda: (minimo: number) =>
          `Щонайменше ${minimo} ${plural(minimo, 'символ', 'символи', 'символів')}. Без неї неможливо відновити бази даних або CA, і вона ніде не зберігається.`,
        problemas: {
          frase_corta: (minimo: number) =>
            `Фраза має містити щонайменше ${minimo} ${plural(minimo, 'символ', 'символи', 'символів')}.`,
          frase_distinta: 'Обидві фрази не збігаються.',
          certificados_sin_ca: 'Сертифікати можна передавати лише разом із CA.',
        },
        exportar: 'Експортувати профіль…',
        nota: 'Профіль ніколи не містить ключів, токенів чи паролів, а також знімків, кошика, резервних копій або теки data.',
        listo: 'Профіль експортовано',
        guardado: (archivo: string, tamano: string) => `Збережено у ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Імпортувати профіль',
        texto:
          'Виберіть файл .wolfperfil. Перш ніж щось змінювати, Ви побачите все, що буде замінено, вилучено або залишено в очікуванні, а для всього заміненого буде створено резервну копію.',
        boton: 'Імпортувати профіль…',
      },
      instantaneas: {
        titulo: 'Знімки середовища',
        texto:
          'Перед оновленням PHP або Nginx і перед імпортом профілю WolfCore Dev зберігає копію Вашої конфігурації, Nginx та файлів php.ini без ключів і даних — лише для Вас. Зберігаються останні 10 знімків.',
        compartidas:
          'Усі 10 слотів спільні для всіх причин: під час створення нового знімка найстаріший замінюється, навіть якщо його було створено вручну.',
        tomar: 'Створити зараз',
        tomada: 'Знімок збережено.',
        sinNada: 'Поки що немає чого копіювати.',
        vacia: 'Знімків ще немає.',
        motivos: {
          actualizar: 'Перед оновленням',
          'importar-perfil': 'Перед імпортом профілю',
          'limpiar-versiones': 'Перед очищенням версій',
          manual: 'Вручну',
        },
      },
    },
    reasignar: {
      titulo: 'Теки сайтів',
      texto:
        'Ці теки перенесено з іншого компʼютера. Вкажіть, де вони розташовані на цьому компʼютері, або імпортуйте сайт у статусі очікування: він залишиться без теки, доки Ви її не виберете.',
      sitio: 'Сайт',
      origen: 'Тека у профілі',
      destino: 'Тека на цьому компʼютері',
      existe: 'Існує',
      noExiste: 'Не існує на цьому компʼютері',
      buscar: 'Вибрати теку…',
      cambiar: 'Змінити',
      comoPendiente: 'Усе одно імпортувати в очікуванні',
      prefijo: (viejo: string, nuevo: string) =>
        `Застосувати цю ж заміну до решти (${viejo} → ${nuevo})`,
      omitido: 'Не імпортуватиметься',
    },
    asistente: {
      titulo: 'Імпортувати профіль',
      pasos: {
        archivo: 'Файл',
        revisar: 'Перегляд',
        confirmar: 'Підтвердження',
        resultado: 'Результат',
      },
      archivo: {
        texto:
          'Виберіть файл .wolfperfil. Поки що нічого не змінюється: спершу Ви побачите, що саме буде замінено, вилучено або залишено в очікуванні.',
        elegir: 'Вибрати файл…',
        cambiar: 'Вибрати інший',
        ninguno: 'Файл не вибрано',
        leyendo: 'Читання профілю…',
        error: 'Не вдалося прочитати профіль',
      },
      origen: (fecha: string, sistema: string) => `Створено ${fecha} у ${sistema}.`,
      ignoradas: (n: number) =>
        `${n} ${plural(n, 'запис файлу не належить до профілю та ігнорується', 'записи файлу не належать до профілю та ігноруються', 'записів файлу не належать до профілю та ігноруються')}.`,
      reemplaza: {
        titulo: 'Що буде замінено',
        ninguno: 'У цій теці немає даних: імпорт виконується на чисте встановлення.',
        copia:
          'Перед заміною створюється копія в respaldos/pre-perfil-… та знімок середовища; кожна база даних, що замінюється, отримує власний знімок. Тека data ніколи не видаляється.',
        config: 'Конфігурація (config.json)',
        sitio: (id: string) => `Сайт ${id}`,
        base: (instancia: string, base: string) => `База даних ${base} (${instancia})`,
        plantilla: (id: string) => `Шаблон ${id}`,
        ca: 'Центр сертифікації (CA) цього компʼютера',
      },
      versiones: {
        titulo: 'Версії',
        ninguna: 'Профіль не містить версій.',
        instalada: 'Уже встановлено',
        descargar: 'Буде завантажено з перевіреним відбитком',
        pendienteDebil: 'Очікує: немає надійного відбитка, встановіть вручну',
        pendienteFuera: 'Очікує: більше немає в каталозі',
        huellas: {
          fuerte: 'Відбиток SHA-256 або SHA-512',
          firmada: 'Підписано',
          debil: 'Слабкий відбиток',
          ninguna: 'Без відбитка',
        },
        descargas: (n: number) =>
          `Буде завантажено ${n} ${plural(n, 'версію', 'версії', 'версій')} з офіційних сайтів, кожну з перевіреним відбитком або підписом.`,
      },
      instancias: {
        titulo: 'Екземпляри баз даних',
        existente: 'Уже існує: зберігається зі своїм портом і версією',
        nueva: (puerto: number) => `Створюється з новими обліковими даними на порту ${puerto}`,
        reasignada: (de: number, a: number) => `Порт ${de} зайнятий: використовуватиметься ${a}`,
      },
      bases: {
        titulo: 'Бази даних',
        ninguna: 'Профіль не містить баз даних.',
        texto:
          'Відновлюються користувачем з правами, обмеженими кожною базою, і лише дозволеними інструкціями. Для наявних баз попередньо створюється резервна копія.',
        omitir: 'Імпортувати без баз даних',
      },
      plantillas: {
        titulo: 'Шаблони',
        existe: 'Уже існує: буде замінено',
        nueva: 'Новий',
      },
      workspaces: {
        titulo: 'Робочі простори',
        texto:
          'Містять лише посилання на бази даних і служби (процеси проєктів не переносяться). Перевіряються на відповідність тому, що є тут, і ніколи не запускаються автоматично.',
        existe: 'Уже є робочий простір із таким самим id: зберігається Ваш',
        nuevo: 'Новий',
        elementos: (n: number) => `${n} ${plural(n, 'елемент', 'елементи', 'елементів')}`,
        invalidos: (n: number) =>
          `${n} ${plural(n, 'робочий простір із профілю недійсний і не імпортується', 'робочі простори з профілю недійсні й не імпортуються', 'робочих просторів із профілю недійсні й не імпортуються')}.`,
      },
      quitado: {
        titulo: 'Що не береться з конфігурації',
        texto:
          'Ця тека даних чиста: із профілю не береться нічого, що вказує за межі цього компʼютера.',
      },
      puertos: {
        titulo: 'Зайняті порти',
        texto: (lista: string) =>
          `Ці порти з профілю вже використовуються іншою програмою на цьому компʼютері: ${lista}. Змініть їх у розділі «Служби» після імпорту.`,
      },
      ca: {
        titulo: 'Центр сертифікації (CA)',
        texto:
          'Профіль містить зашифрований CA. Імпортуйте його лише якщо він Ваш: цей компʼютер прийматиме сертифікати, які він підписує.',
        huella: 'Відбиток SHA-256 для CA з профілю',
        comparar: 'Порівняйте його з відбитком на вихідному компʼютері перед підтвердженням.',
        importar: 'Імпортувати CA з профілю',
        noImportar: 'Без імпорту цей компʼютер використає поточний CA або створить новий.',
        ajena:
          'Цей CA має обмеження за іменами, що не належать WolfCore Dev: його не можна імпортувати.',
        sinRestricciones:
          'Цей CA не має обмежень за іменами: він може підписувати сертифікати для будь-яких вебсайтів, включно з банками та поштою. Імпортуйте його лише якщо він Ваш і відбиток збігається.',
        aceptarSin: 'Я розумію ризик: це мій CA і відбиток збігається',
        reemplazaLocal:
          'На цьому компʼютері вже є CA. Імпорт CA з профілю замінить його (копія збережеться у попередній резервній копії).',
        reemplazar: 'Замінити CA цього компʼютера',
        noSeInstala: 'CA не встановлюється автоматично в системне сховище сертифікатів.',
      },
      frase: {
        titulo: 'Фраза профілю',
        texto:
          'Профіль містить зашифровані бази даних або CA. Введіть фразу, яку Ви задали під час експорту.',
        campo: 'Фраза',
        omitirBases: 'Імпортувати без баз даних',
        nota: 'Фраза використовується лише в цьому вікні: вона не зберігається й очищається після завершення або закриття.',
      },
      env: {
        titulo: 'Підключення проєктів',
        texto:
          'Позначте проєкти, чий файл .env має вказувати на нового окремого користувача їхньої бази даних (із попередньою копією .env). Інші не змінюються та відображаються у звіті.',
      },
      confirmar: {
        titulo: 'Підтвердити імпорт',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Буде імпортовано ${sitios} ${plural(sitios, 'сайт', 'сайти', 'сайтів')}, ${versiones} ${plural(versiones, 'версію', 'версії', 'версій')} і ${bases} ${plural(bases, 'базу даних', 'бази даних', 'баз даних')}.`,
        importar: 'Імпортувати',
        revisar: 'Переглянути',
        volver: 'Назад',
        bloqueos: {
          sitios_sin_carpeta:
            'Виберіть теку для кожного сайту або позначте його для імпорту в статусі очікування.',
          frase_requerida: 'Введіть фразу профілю або імпортуйте без баз даних.',
          ca_ajena: 'CA з профілю не можна імпортувати.',
          ca_sin_restricciones: 'Окремо підтвердіть, що бажаєте імпортувати CA без обмежень.',
          reemplazar_ca: 'Окремо підтвердіть, що бажаєте замінити CA цього компʼютера.',
        },
      },
      progreso:
        'Імпорт профілю… Не закривайте вікно: за наявності баз даних або завантажень це може тривати певний час.',
      fases: {
        copia: 'Копіювання елементів, що замінюються',
        versiones: 'Встановлення версій',
        configuracion: 'Збереження конфігурації та сайтів',
        plantillas: 'Копіювання шаблонів',
        ca: 'Підготовка CA та сертифікатів',
        bases: 'Відновлення баз даних',
        env: 'Оновлення файлів .env',
      },
      avance: (paso: number, de: number) => `Крок ${paso} із ${de}`,
      resultado: {
        titulo: 'Результат імпорту',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `Імпортовано: ${importados}, в очікуванні: ${pendientes}, пропущено: ${omitidos}, із помилкою: ${errores}.`,
        respaldo: (ruta: string) => `Резервна копія заміненого: ${ruta}`,
        pendientes: 'Те, що залишилося в очікуванні, можна завершити вручну.',
        error: 'Не вдалося імпортувати профіль',
        secciones: {
          sitios: 'Сайти',
          versiones: 'Версії',
          instancias: 'Екземпляри',
          bases: 'Бази даних',
          plantillas: 'Шаблони',
          workspaces: 'Робочі простори',
          env: 'Файли .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Імпортовано',
          pendiente: 'Очікує',
          omitido: 'Пропущено',
          error: 'Помилка',
          instalada: 'Встановлено',
          ya_instalada: 'Уже було',
          creada: 'Створено',
          existente: 'Уже існувало',
          puerto_reasignado: 'Порт змінено',
          reescrito: 'Перезаписано',
          sin_marcar: 'Не позначено',
        },
        ca: {
          importada: 'CA імпортовано',
          nueva: 'Згенеровано новий CA',
          sin_cambios: 'CA не змінився',
        },
        quitarCa: {
          boton: 'Видалити попередній CA…',
          titulo: 'Видалити попередній CA із довірених',
          texto:
            'Із системного сховища сертифікатів буде видалено CA, який був на цьому компʼютері раніше. Windows може запросити підтвердження. Новий CA не встановлюється автоматично.',
          si: 'Видалити',
          hecho: 'Попередній CA видалено із довірених.',
        },
        descartadosWorkspace: (lista: string) => `Тут не існує, тому вилучено: ${lista}`,
        workspacesInvalidos: (n: number) =>
          `Не імпортовано ${n} ${plural(n, 'недійсний робочий простір', 'недійсні робочі простори', 'недійсних робочих просторів')}.`,
        puerto: (de: number, a: number) => `Порт ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Копія .env: ${ruta}`,
      },
    },
    /** Важливе попередження попереднього перегляду: CA профілю не має обмежень за іменами. */
    caSinRestricciones:
      'Цей CA може підписувати будь-які вебсайти; імпортуйте його лише якщо він Ваш, і порівняйте відбиток.',
    motivos: {
      procesos_quitados: 'Ваші процеси (команди з іншого компʼютера) не імпортовано.',
      tareas_quitadas:
        'Ваші заплановані завдання (команди з іншого компʼютера) не імпортовано. Створіть їх знову або підключіть із wolfcore.yml.',
      tunel_con_nombre: 'Ваш іменований тунель не переноситься: повернено до швидкого тунелю.',
      php_ini: 'Деякі налаштування php.ini не імпортовано.',
      xdebug: 'Ваше налаштування Xdebug було недійсним і його вилучено.',
      nginx_desactivado:
        'Ваші правила Nginx збережено, але не застосовано: перевірте їх у редакторі.',
      carpeta_no_existe: 'Вашої теки не існує на цьому компʼютері: знайдіть її.',
      correo_sin_proveedor:
        'Вашого SMTP-провайдера не імпортовано: використовується перехоплювач пошти.',
      sitio_invalido: 'Сайт недійсний.',
      dominio_invalido: 'Ваш домен недійсний (має закінчуватися на .test).',
      ruta_protegida: 'Ваша тека є системною або належить WolfCore Dev: не імпортується.',
      dominio_en_uso: 'Інший сайт на цьому компʼютері вже використовує цей домен.',
      sitio_repetido: 'Сайт дублюється у профілі.',
      no_disponible: 'Цієї версії більше немає в каталозі.',
      huella_debil: 'Ця версія не має надійного відбитка: встановіть її вручну з розділу «Версії».',
      tope_descargas:
        'Не завантажено, щоб уникнути надмірної кількості одночасних завантажень: встановіть із розділу «Версії».',
      instancia_pendiente: 'Ваш екземпляр залишився в очікуванні.',
      motor_no_soportado: 'Цей рушій не імпортується з профілю.',
      version_pendiente: 'Ваша версія рушія залишилася в очікуванні.',
      danada: 'Ваші файли у профілі пошкоджено.',
      bases_omitidas: 'Імпортовано без баз даних.',
      instancia_apagada: 'Не вдалося запустити Ваш екземпляр.',
      sin_copia_previa: 'Не вдалося створити попередній знімок: базу даних не замінено.',
      sin_base: 'Ваш файл .env не вказує на локальну базу даних.',
      base_no_resuelta: 'Не вдалося визначити, до якого екземпляра належить Ваша база даних.',
      error_inesperado: 'Сталася помилка.',
    },
    avisos: {
      ca_reemplazada:
        'Попередній CA цього компʼютера досі перебуває в системному сховищі довірених сертифікатів і більше не використовується. Ви можете видалити його звідси.',
      base_no_incluida: 'Базу даних {base} ({instancia}) не включено.',
      sin_ca: 'На цьому компʼютері немає CA: профіль передається без нього.',
      ca_no_importada:
        'CA з профілю не імпортовано: використовується CA цього компʼютера або створюється новий.',
      certificados: 'Не вдалося підготувати сертифікати: {detalle}',
      aplicar: 'Імпортовані сайти застосовано не повністю (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Провайдер ШІ {id}: використовує власний URL.',
      smtp: 'SMTP-провайдер {id}: його хост не належить відомому провайдеру або відсутній користувач.',
      puerto: 'Порт {id}: поза допустимим діапазоном, повернуто типове значення.',
      carpeta_vigilada: 'Відстежувана тека належить іншому компʼютеру.',
    },
  },
};
