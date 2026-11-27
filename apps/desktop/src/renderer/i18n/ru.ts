/**
 * Тексты интерфейса на русском языке (ru-RU). Те же ключи и сигнатуры функций, что в es.ts.
 * Глоссарий: служба, экземпляр, сайт, туннель, резервная копия, уведомление; Doctor и
 * WolfCore Dev не переводятся. Обращение на «вы»; вне Git всегда «версия», не «ветка».
 */
import type { Textos } from './es';

const prRu = new Intl.PluralRules('ru');
const plural = (n: number, one: string, few: string, many: string): string => {
  const cat = prRu.select(n);
  return `${n} ${cat === 'one' ? one : cat === 'few' ? few : many}`;
};

export const ru: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP и Nginx без лишних сложностей',
    version: 'Версия',
  },
  nav: {
    inicio: 'Главная',
    proyectos: 'Проекты',
    agentes: 'Агенты',
    servicios: 'Службы',
    basesDeDatos: 'Базы данных',
    correo: 'Почта',
    php: 'PHP',
    ia: 'ИИ',
    tuneles: 'Туннели',
    contenedores: 'Контейнеры',
    herramientas: 'Инструменты',
    doctor: 'Doctor',
    depuracion: 'Отладка',
    registros: 'Журналы',
    ajustes: 'Настройки',
    contraer: 'Свернуть меню',
    expandir: 'Развернуть меню',
  },
  resumenGlobal: {
    servicios: (n: number) =>
      plural(n, 'работающая служба', 'работающие службы', 'работающих служб'),
    tuneles: (n: number) => plural(n, 'активный туннель', 'активных туннеля', 'активных туннелей'),
    cargando: 'Подключение к ядру…',
    conErrores: 'с ошибками',
    sinConexion: 'Нет связи с ядром',
  },
  estado: {
    encendido: 'Запущено',
    apagado: 'Остановлено',
    iniciando: 'Запуск…',
    error: 'Ошибка',
    externo: 'Внешняя',
    activo: 'Активно',
    aviso: 'Внимание',
  },
  acciones: {
    encender: 'Запустить',
    apagar: 'Остановить',
    iniciarTodo: 'Запустить всё',
    detenerTodo: 'Остановить всё',
    abrir: 'Открыть',
    copiar: 'Копировать',
    copiado: 'Скопировано в буфер обмена',
    guardar: 'Сохранить',
    cerrar: 'Закрыть',
    abrirCarpeta: 'Открыть папку',
    instalar: 'Установить',
    reintentar: 'Повторить',
    cancelar: 'Отмена',
    borrar: 'Удалить',
    editar: 'Изменить',
    duplicar: 'Дублировать',
    renovar: 'Обновить',
    masAcciones: 'Ещё действия',
    actualizar: 'Обновить',
    quitar: 'Убрать',
    reinstalar: 'Переустановить',
  },
  errores: {
    titulo: 'Не удалось выполнить действие',
    arranque: 'Не удалось прочитать состояние среды',
    desconocido: 'Произошла непредвиденная ошибка.',
    /** Detalles que el núcleo manda como código dentro de un error. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'незакрытые кавычки',
      'sintaxis.tras_comillas': 'отсутствует пробел или «;» после кавычек',
      'sintaxis.punto_y_coma_inesperado': '«;» без директивы',
      'sintaxis.llave_inesperada': '«{» без директивы',
      'sintaxis.falta_punto_y_coma': 'отсутствует «;» в конце директивы',
      'sintaxis.sobra_llave': 'лишняя «}»',
      'sintaxis.falta_llave': 'отсутствует «}»',
    },
    codigos: {
      'git.cambios_locales':
        'В папке есть несохранённые изменения: зафиксируйте их (commit) или отмените перед загрузкой изменений. Ничего не изменено.',
      'git.divergencia':
        'Ветка разошлась с удалённой (есть разные локальные и удалённые коммиты): разрешите конфликт вручную. Ничего не изменено.',
      'git.sin_upstream':
        'Текущая ветка не отслеживает удалённую ветку: неоткуда загрузить изменения.',
      'git.sin_rama': 'Репозиторий находится на отсоединённом коммите (без ветки): ничего не изменено.',
      'git.no_repositorio': 'Эта папка не является репозиторием git.',
      'git.destino_no_vacio': 'Целевая папка не пуста.',
      'git.destino_es_archivo': 'Целевой путь указывает на файл, а не на папку.',
      'git.no_encontrado': 'git не найден: сначала установите его.',
      'git.gh_no_encontrado': 'GitHub CLI (gh) не найден: сначала установите его.',
      'git.plazo': 'Клонирование превысило лимит {minutos} мин и было отменено.',
      'git.token_invalido': 'Токен GitHub недействителен.',
      'git.url_con_credenciales':
        'URL не должен содержать имя пользователя или пароль: используйте токен отдельно.',
      'servicios.desconocido': 'Неизвестная служба: {id}.',
      'servicios.no_instalado': '{nombre} не установлен. Установите его в разделе Службы.',
      'servicios.puerto_invalido': 'Порт должен быть числом от 1024 до 65535.',
      'servicios.puerto_asignado': 'Порт {puerto} уже назначен {otro}.',
      'servicios.puerto_ocupado':
        'Порт {puerto} используется {nombre} (PID {pid}). Закройте его или выберите другой порт.',
      'servicios.confirmacion_borrado': 'Чтобы удалить данные {nombre}, введите "{id}".',
      'servicios.ftp_no_disponible': 'FTP-сервер недоступен.',
      'sistema.sin_cliente_ftp':
        'На этом компьютере нет назначенного FTP-клиента. Установите его (например, FileZilla) или скопируйте адрес.',
      'servicios.mailpit_no_responde': 'Mailpit не отвечает. Запустите его в разделе Службы.',
      'servicios.iniciar_todo_fallos':
        'Команда «Запустить всё» не смогла запустить: {nombres}. Проверьте Службы и их журналы.',
      'servicios.respaldo_fallo':
        '{nombre} не обновлён: не удалось создать предварительную резервную копию, ничего не изменено.',
      'servicios.espacio_insuficiente':
        'Недостаточно места для копирования данных: требуется {necesarios} MB, свободно {libres} MB.',
      'servicios.actualizacion_revertida':
        'Версия {version} не запустилась; {nombre} вернулся к {anterior}. Резервная копия сохранена.',
      'servicios.restauracion_fallo':
        'Новая версия не запустилась и не удалось вернуть данные {nombre}. Ничего не запущено: затронутые данные в {fallida}, резервная копия в {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} относится к другой основной версии: создайте её как новый экземпляр.',
      'servicios.misma_version': '{id} уже использует версию {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} заблокирован: обновление не смогло восстановить данные. Затронутые данные в {fallida}, резервная копия в {respaldo}. Решите это в Службы → Версии перед запуском.',
      'servicios.datos_apartados':
        'У {nombre} нет данных в папке, но есть данные, отложенные при обновлении: пустая папка не создаётся. Проверьте Службы → Версии.',
      'servicios.puerto_reservado':
        'Порт {puerto} зарезервирован системой ({desde}–{hasta}): выберите другой.',
      'servicios.borrado_con_bloqueo':
        'У {nombre} есть экземпляр, заблокированный после обновления: разблокируйте его перед удалением данных.',
      'servicios.config_no_revertida':
        '{nombre} {version} не запустился и не удалось вернуть {anterior} в конфигурации. Снова выберите {anterior} в Службы → Версии.',
      'servicios.puerto_revertido_apagada':
        '{nombre} не запустился на новом порту; был выполнен возврат на {anterior}, но там он тоже не запустился и остался остановлен на порту {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} не запустился на порту {nuevo} и не удалось вернуть порт {anterior} в конфигурации: служба осталась остановленной.',
      'instancias.id_invalido': 'Идентификатор экземпляра недействителен.',
      'instancias.no_existe': 'Экземпляр {id} не существует.',
      'instancias.existe': 'Экземпляр {id} уже существует.',
      'instancias.una_sola': '{nombre} поддерживает только один экземпляр.',
      'instancias.ultima': '{id} — единственный экземпляр: его нельзя удалить.',
      'instancias.sin_puerto_libre': 'Не найден свободный порт для экземпляра.',
      'instancias.confirmacion': 'Чтобы продолжить, введите "{id}".',
      'instancias.sin_datos': 'В папке {id} нет данных: выберите резервную копию для восстановления.',
      'instancias.respaldo_no_existe': 'Такой резервной копии для {id} не существует.',
      'instancias.respaldo_en_uso':
        'Эта копия нужна заблокированному экземпляру {id}: сначала разблокируйте его.',
      'instancias.version_requerida':
        'Неизвестно, к какой версии вернуть {id}: выберите установленную версию той же основной линии.',
      'instalador.version_en_uso':
        'Нельзя удалить {servicio} {version}: её использует экземпляр {instancia}.',
      'limpieza.sin_confirmar': 'Требуется подтверждение для очистки версий.',
      'limpieza.seleccion_invalida': 'Выбор версий недействителен.',
      'limpieza.en_curso': 'Очистка версий уже выполняется.',
      'limpieza.no_existe': '{servicio} {version} уже не установлена.',
      'limpieza.en_uso': '{servicio} {version} снова используется: не удалена.',
      'limpieza.ruta_insegura':
        'Папка {servicio} {version} небезопасна (ссылка или путь вне bin): не изменена.',
      'limpieza.version_bloqueada':
        'Файлы {servicio} {version} используются или заблокированы: не удалена и не повреждена.',
      'limpieza.otro_volumen':
        '{servicio} {version} находится на другом диске, чем временная папка данных: не удалось переместить целиком, оставлена без изменений.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} содержит установленные вами пакеты (npm, pip…): нужно подтвердить их потерю для удаления.',
      'limpieza.destino_ocupado':
        'В bin уже есть папка {servicio} {version}: перезапись не выполняется. Удалите её перед восстановлением другой.',
      'bd.encender_servicio': 'Запустите {nombre}, чтобы управлять его базами данных.',
      'bd.sin_credenciales': 'Нет сохранённых учётных данных для {nombre}.',
      'bd.confirmacion_borrado': 'Чтобы удалить базу {nombre}, введите её точное имя.',
      'bd.usuario_privilegiado':
        'Пользователь {usuario} — администратор или системная роль: выберите отдельного пользователя для проекта.',
      'bd.usuario_en_uso':
        'Другой проект уже использует пользователя {usuario}: его пароль не меняется, чтобы не нарушить подключение. Ничего не создано.',
      'bd.rol_sin_login':
        'Пользователь {usuario} существует, но не может войти (роль без LOGIN или правило доступа сервера). Ничего не изменено.',
      'bd.usuario_clave_distinta':
        'Пользователь {usuario} уже существует с другим паролем. Используйте его текущий пароль: он не меняется, чтобы не отключить другие проекты.',
      'bd.mongosh_faltante': 'Отсутствует mongosh: установите его в разделе Службы для управления MongoDB.',
      'tuneles.sitio_no_encontrado': 'Проект не найден.',
      'tuneles.confirmacion_requerida':
        'Публикация {dominio} в интернете требует подтверждения в WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'Туннель для {dominio} изменился после подтверждения: подтвердите снова.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared не установлен. Установите его в разделе Службы.',
      'tuneles.proveedor_no_disponible': 'Провайдер туннелей {proveedor} недоступен.',
      'tuneles.cloudflare_sin_cuenta':
        'Сначала подключите учётную запись Cloudflare в параметрах туннеля.',
      'tuneles.cloudflare_sin_credencial':
        'У этого туннеля нет сохранённых учётных данных: создайте его заново в параметрах туннеля.',
      'tuneles.cloudflare_datos_invalidos':
        'Имя туннеля (строчные буквы, цифры и дефисы) или публичный домен недействительны.',
      'tuneles.cloudflare_conexion_en_curso': 'Подключение к Cloudflare уже выполняется.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare зарегистрировал {registrado} вместо {dominio}: домен не относится к авторизованной зоне. Удалите эту запись в панели Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'У туннеля {nombre} есть активные подключения (cloudflared требует -f для удаления). Закройте его на всех компьютерах и повторите попытку или используйте «Забыть только здесь».',
      'tuneles.nombre_en_uso': 'Туннель {nombre} уже используется другим сайтом.',
      'tuneles.dominio_en_uso': 'Домен {dominio} уже используется другим сайтом.',
      'tuneles.confirmacion_olvidar': 'Забывание или пересоздание туннеля {nombre} требует подтверждения.',
      'tuneles.cloudflare_fallo': 'cloudflared не смог выполнить операцию: {detalle}',
      'tuneles.credencial_no_protegida':
        'Не удалось ограничить доступ к учётным данным текущим пользователем, поэтому они не использованы.',
      'tuneles.sin_cifrado':
        'Системное шифрование недоступно: невозможно сохранить учётные данные.',
      'tuneles.token_invalido':
        'Недействительный токен: допустимы только буквы, цифры и _ . - (от 8 до 200 символов). Сохраните его снова в параметрах туннеля.',
      'tuneles.ngrok_no_instalado':
        'ngrok не установлен на этом компьютере. Установите его с ngrok.com и повторите попытку.',
      'tuneles.ngrok_sin_token': 'Отсутствует токен ngrok: сохраните его в параметрах туннеля.',
      'tuneles.expose_sin_token': 'Отсутствует токен Expose: сохраните его в параметрах туннеля.',
      'tuneles.tailscale_no_instalado':
        'Tailscale не установлен на этом компьютере. WolfCore Dev не устанавливает его: скачайте с tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'В Tailscale не выполнен вход: войдите в Tailscale и повторите попытку.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale уже публикует сервис на HTTPS-порту {puerto}. WolfCore Dev не перезаписывает его: уберите его в Tailscale и повторите попытку.',
      'lan.sitio_no_encontrado': 'Сайт не найден.',
      'lan.confirmacion_requerida':
        'Открытие доступа к {dominio} в локальной сети требует подтверждения в WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} содержит реальные данные: доступ в локальной сети запрещён даже с подтверждением. Используйте копию без данных клиентов.',
      'lan.sin_red':
        'Нет подключения к локальной сети (Wi-Fi или Ethernet). Подключитесь к сети и повторите попытку.',
      'lan.ip_no_valida':
        'Адрес {ip} больше не относится к вашей локальной сети. Откройте диалог снова и подтвердите заново.',
      'lan.requiere_https': '{dominio} перенаправляет на HTTPS: откройте доступ с параметром HTTPS.',
      'lan.sin_puertos':
        'Нет свободных портов от 8100 до 8199 для локальной сети (этот диапазон используют открытые сайты и ссылка CA). Закройте доступ к сайту или диалог CA и повторите попытку.',
      'tuneles.expose_no_instalado':
        'Expose не установлен. В Windows он работает только через expose.phar: поместите его в {carpeta}.',
      'tuneles.expose_datos_reales':
        'Expose нельзя использовать с сайтами с реальными данными: его инспектор запросов виден всей локальной сети. Выберите другого провайдера.',
      'tuneles.confirmacion_requerida_tailnet':
        'Открытие доступа к {dominio} для вашей tailnet требует подтверждения в WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Не удалось прочитать текущие публикации Tailscale на этом компьютере, поэтому ничего не открыто во избежание перезаписи. Проверьте работу Tailscale и повторите попытку.',
      'tuneles.tailscale_no_habilitado':
        'Serve или Funnel не включены в вашей tailnet. Включите их по адресу {enlace} и повторите попытку.',
      'tuneles.ngrok_desactualizado':
        'Установлена устаревшая версия ngrok, не поддерживающая функции WolfCore Dev. Обновите её (ngrok update) и повторите попытку.',
      'hosts.dominio_invalido': 'Указан недопустимый домен.',
      'hosts.tiempo_agotado':
        'Запрос прав администратора не получил ответа за {segundos} с; файл hosts остался без изменений.',
      'https.sin_dominio': 'Для сертификата нужен хотя бы один домен.',
      'https.sin_autoridad':
        'Центр сертификации WolfCore Dev отсутствует. Установите CA в разделе HTTPS перед выпуском сертификатов.',
      'herramientas.pid_invalido': 'Недопустимый PID.',
      'herramientas.pid_sistema': 'PID {pid} является системным и не может быть завершён.',
      'herramientas.proceso_propio':
        'Нельзя завершить WolfCore Dev или процесс, который его запустил.',
      'herramientas.proceso_inexistente': 'Процесс {pid} больше не существует.',
      'herramientas.sin_editor':
        'Редактор кода не найден. Установите один из них (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} не установлен. Выберите другой редактор в Настройках.',
      'herramientas.editor_invalido': 'Этот редактор недопустим.',
      'herramientas.carpeta_sitio_inexistente': 'Папка проекта не существует.',
      'herramientas.ruta_no_absoluta': 'Путь должен быть абсолютным.',
      'herramientas.sin_seleccion': 'Выберите хотя бы один элемент.',
      'herramientas.dominio_invalido': 'Указан недопустимый домен или IP.',
      'herramientas.demasiados_dominios':
        'Сертификат поддерживает не более {maximo} доменов или IP.',
      'buscar.consulta_invalida': 'Введите текст для поиска (до 500 символов).',
      'buscar.raiz_invalida': 'Папка или файл не существует или недопустим.',
      'buscar.regex_invalida': 'Недопустимое регулярное выражение.',
      'buscar.regex_lenta':
        'Регулярное выражение выполняется слишком долго: упростите его или используйте обычный текст.',
      'buscar.demasiadas': 'Уже выполняется {maximo} поисков: отмените один или подождите.',
      'terminal.no_abrio': 'Не удалось открыть терминал.',
      'terminal.no_instalada': '{nombre} не установлен. Выберите другой терминал в Настройках.',
      'terminal.invalida': 'Этот терминал недопустим.',
      'terminal.powershell_restringido':
        'PowerShell работает в ограниченном режиме языка на этом компьютере (политика организации или AppLocker): WolfCore Dev не может открыть терминал. Откройте его вручную в папке проекта.',
      'proyectos.no_existe': 'Проект не существует.',
      'proyectos.no_confiado': 'Отметьте «Я доверяю этому репозиторию», чтобы выполнить рецепт.',
      'proyectos.receta_en_curso': 'Для этого проекта уже выполняется рецепт.',
      'proyectos.paso_no_omitible': 'Шаг «Создать сайт» нельзя пропустить.',
      'workspaces.no_existe': 'Такого workspace не существует.',
      'workspaces.invalido': 'Недопустимый workspace: проверьте его имя и элементы.',
      'workspaces.captadores_exclusivos':
        'Два перехватчика почты не могут работать одновременно: работает только один.',
      'workspaces.elemento_fallo':
        'Не удалось выполнить операцию для {elemento}. Проверьте Службы и их журналы.',
      'workspaces.base_no_responde':
        '{elemento} не запущен, так как база данных этого проекта не отвечает.',
      'tareas.cron_invalida':
        'Недопустимое выражение cron. Используйте 5 полей: минута, час, день месяца, месяц и день недели (например, 0 3 * * *).',
      'tareas.comando_invalido':
        'Эта команда не разрешена. Используйте php, node, npm run или python с файлом проекта без встроенного кода (-r, -e, -c).',
      'tareas.invalida': 'Задача недопустима: проверьте имя, расписание и команду.',
      'tareas.no_existe': 'Эта задача больше не существует.',
      'tareas.sin_confirmar': 'Подтвердите команду задачи, чтобы её можно было выполнять.',
      'tareas.sitio_no_confiado':
        'Отметьте «Я доверяю этому репозиторию» в проекте для выполнения его задач.',
      'tareas.receta_cambio':
        'Рецепт проекта изменился после вашего подтверждения доверия: проверьте его и снова отметьте «Я доверяю этому репозиторию».',
      'tareas.aislado':
        'Это тестовая папка данных (WOLFCORE_DATOS): разрешите запланированные задачи для их запуска.',
      'tareas.carpeta': 'Папка проекта не существует: задача не может быть выполнена.',
      'tareas.en_curso': 'Задача уже выполняется.',
      'tareas.demasiadas': 'Слишком много задач в этом проекте (максимум {maximo}).',
      'cli.no_autorizado':
        'Команда CLI не авторизована: выполните её снова при открытом приложении WolfCore Dev.',
      'cli.orden_desconocida': 'WolfCore Dev не знает эту команду CLI.',
      'cli.argumentos_invalidos': 'Аргументы команды недействительны.',
      'cli.solicitud_grande': 'Запрос слишком большой (максимум {maximo} байт).',
      'cli.formato_no_admitido': 'Запрос имеет формат, не поддерживаемый CLI.',
      'cli.plazo':
        'Команда выполнялась слишком долго: возможно, она всё ещё работает. Проверьте статус в WolfCore Dev.',
      'cli.ocupado':
        'WolfCore Dev обрабатывает слишком много команд CLI: подождите немного.',
      'cli.requiere_confirmacion':
        'Эта команда публикует или изменяет данные и требует подтверждения (--si) для {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} содержит реальные данные: подтвердите также параметром реальных данных (доменом сайта).',
      'cli.requiere_confirmacion_global':
        'Смена PHP для всех терминалов требует подтверждения (--si).',
      'cli.confirmacion_rechazada':
        'Подтверждение в окне WolfCore Dev отклонено или недоступно: ничего не сделано.',
      'cli.confirmacion_vencida':
        'Подтверждение в окне WolfCore Dev не было получено вовремя: ничего не сделано.',
      'cli.tunel_fallo': 'Не удалось открыть туннель. Проверьте его журнал в WolfCore Dev.',
      'cli.inicio_fallo':
        'Не удалось запустить всё запрошенное. Проверьте журналы в WolfCore Dev.',
      'cli.parada_fallo':
        'Не удалось остановить всё запрошенное. Проверьте журналы в WolfCore Dev.',
      'cli.interno': 'Внутренняя ошибка сервера CLI.',
      'cli.proveedor_distinto':
        'Сайт использует другого провайдера туннелей ({proveedor}). Проверьте и подтвердите снова.',
      'cli.sitio_no_encontrado': 'Сайт {sitio} не существует.',
      'cli.carpeta_invalida':
        'Папка не существует, является системной или папкой данных WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Эта папка не относится ни к одному сайту WolfCore Dev: сначала привяжите её.',
      'cli.ya_vinculada': 'Эта папка уже является сайтом {sitio}.',
      'cli.tipo_no_soportado':
        'Проекты типа {tipo} создаются через интерфейс WolfCore Dev.',
      'cli.sitio_sin_php': 'Сайт {sitio} не использует PHP.',
      'cli.version_no_instalada':
        '{servicio} {version} не установлен. Установите его в разделе Службы.',
      'cli.fuente_no_existe': 'Этот журнал ещё не существует.',
      'cli.token_no_protegido':
        'Не удалось ограничить доступ к файлу токена текущим пользователем: CLI не активирован.',
      'cli.carpeta_ajena':
        'Папка run/ в папке данных принадлежит другому пользователю: CLI не активирован.',
      'cli.ruta_invalida': 'Путь WolfCore Dev содержит символы, недопустимые для wolf.cmd.',
      'cli.path_aislado':
        'При использовании тестовой папки данных (WOLFCORE_DATOS) PATH пользователя не изменяется.',
      'cli.sin_cliente': 'В этой сборке WolfCore Dev отсутствует клиент wolf (не скомпилирован).',
      'cli.demasiados_dialogos':
        'Слишком много подтверждений за последнюю минуту: подождите немного и повторите попытку.',
      'cli.error': 'Не удалось выполнить команду: {detalle}',
      'proyectos.carpeta_no_vacia':
        'В папке проекта уже есть файлы: выберите другую или очистите её.',
      'secretos.sin_cifrado':
        'Системное шифрование недоступно: невозможно сохранить пароль отдельного пользователя. Ничего не изменено.',
      'proyectos.clave_bd_falta':
        'Отсутствует сохранённый пароль пользователя {usuario}: ничего не записано. В менеджере .env кнопка «Использовать своего пользователя» создаст новый пароль.',
      'env.archivo_grande': 'Файл переменных слишком большой (максимум {maximo}).',
      'env.no_regular': 'Файл .env не является обычным файлом: он не читается и не изменяется.',
      'env.clave_inexistente': 'Переменная {clave} не существует.',
      'env.cambio_invalido': 'Изменение в .env недопустимо.',
      'env.variable_invalida': 'Изменение переменной {clave} недопустимо.',
      'env.solo_lectura': 'Переменная {clave} занимает несколько строк: отредактируйте её вручную в файле.',
      'env.usuario_compartido':
        'Базу {base} также использует проект {proyecto}: подтвердите совместное использование его пользователя.',
      'env.cambio_externo':
        'Файл .env изменился после показа предварительного просмотра: проверьте его снова перед сохранением.',
      'env.sin_confirmar': 'Подтвердите сохранение изменений в .env.',
      'env.versionado':
        'Git уже отслеживает .env этого проекта: следующий коммит отправит его значения. Подтвердите отдельно для продолжения.',
      'env.versionado_desconocido':
        'Не удалось проверить, отслеживает ли git .env этого проекта: подтвердите отдельно для продолжения.',
      'env.copia_invalida': 'Копия .env недействительна или больше не существует.',
      'env.sin_base': 'В .env этого проекта нет подключения к базе данных.',
      'env.base_no_resuelta':
        'База этого проекта не принадлежит локальному серверу WolfCore Dev: ничего не изменено.',
      'env.motor_no_soportado': 'Пока «Использовать своего пользователя» работает с MySQL и MariaDB.',
      'env.ya_usa_usuario_propio': 'Этот проект уже использует собственного пользователя.',
      'plantillas.id_invalido': 'Идентификатор шаблона недействителен.',
      'plantillas.no_existe': 'Шаблон не существует.',
      'plantillas.danada':
        'Шаблон повреждён или изменён: он не используется. Удалите и сохраните его заново.',
      'plantillas.demasiado_grande':
        'В проекте слишком много файлов для сохранения в шаблон (до {maximo} файлов). Исключите крупные папки.',
      'plantillas.demasiado_pesada':
        'Проект слишком велик для сохранения в шаблон (до {maximo}). Исключите крупные папки.',
      'plantillas.exclusion_invalida':
        'Одно из исключений недопустимо (используйте имена или относительные пути без "..").',
      'plantillas.nombre_invalido':
        'Имя шаблона недопустимо (от 1 до 60 символов).',
      'plantillas.esquema_fallo':
        'Не удалось прочитать схему базы проекта: проверьте, что служба запущена.',
      'plantillas.base_no_resuelta':
        'Нельзя сохранить шаблон: сервер базы удалённый или ни одна локальная служба не использует этот порт.',
      'plantillas.sin_generador_base':
        'Для этого типа проекта нет базового генератора: шаблон должен включать файлы проекта.',
      'plantillas.exclusiones_nuevas':
        'Шаблон содержит файл, который теперь исключается ({archivo}): сохраните его заново из проекта или удалите.',
      'plantillas.motor_distinto':
        'Схема шаблона из MySQL, а выбранный сервер — MariaDB (или наоборот): возможны различия. Подтвердите продолжение.',
      'bd.sql_no_permitido':
        'Схема содержит инструкцию, не относящуюся к структуре, ничего не выполнено: {sentencia}',
      'bd.extension_no_permitida':
        'Схема требует расширение {nombre}, которого нет в разрешённом списке: ничего не восстановлено.',
      'bd.esquema_fallo': 'Не удалось полностью восстановить схему: всё осталось без изменений.',
      'bd.datos_no_permitidos':
        'Дамп данных содержит недопустимые инструкции (разрешены только INSERT, LOCK TABLES и SET): ничего не импортировано.',
      'bd.datos_fallo':
        'Не удалось импортировать данные: база осталась в исходном состоянии.',
      'perfiles.destino_invalido': 'Выберите место сохранения профиля (файл .wolfperfil).',
      'perfiles.frase_debil': 'Кодовая фраза CA должна содержать не менее {minimo} символов.',
      'perfiles.frase_incorrecta': 'Неверная кодовая фраза: ничего не импортировано.',
      'perfiles.certificados_sin_ca':
        'Сертификаты сайтов переносятся только вместе с зашифрованной CA: включите CA с кодовой фразой.',
      'perfiles.no_existe': 'Файл профиля не существует.',
      'perfiles.danado': 'Профиль повреждён или изменён: ничего не импортировано.',
      'perfiles.demasiado_grande': 'Профиль слишком большой (до {maximo}).',
      'perfiles.version_no_soportada':
        'Профиль создан в более новой версии WolfCore Dev (формат {version}): обновите приложение для импорта.',
      'perfiles.sin_confirmar': 'Подтвердите импорт профиля.',
      'perfiles.vista_previa_vieja':
        'Папка данных или профиль изменились после предпросмотра: проверьте ещё раз.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS не является допустимой папкой данных: путь должен быть абсолютным, не системным и отличным от основной папки.',
      'perfiles.confirmar_reemplazar_ca':
        'Профиль содержит CA, и на этом компьютере уже есть своя: сравните отпечаток и отдельно подтвердите замену (только если это ваша CA).',
      'herramientas.imagen_tipo':
        'Этот файл не является поддерживаемым изображением (PNG, JPG, WebP, GIF, BMP или ICO) или его содержимое не соответствует типу.',
      'herramientas.imagen_grande': 'Изображение слишком большое (до {maximo}).',
      'herramientas.imagen_dimensiones':
        'Изображение слишком велико ({ancho}×{alto} px; максимум {maximo} px по стороне) и не открывается в целях безопасности.',
      'herramientas.zip_sin_archivos': 'Нет файлов для сжатия (ссылки не обходятся).',
      'herramientas.zip_demasiados': 'Слишком много файлов для сжатия (до {maximo}).',
      'herramientas.zip_grande': 'Слишком большой объём для сжатия (до {maximo}).',
      'herramientas.pdf_invalido': 'Этот файл не является PDF, который можно оптимизировать.',
      'herramientas.pdf_grande': 'PDF слишком большой (до {maximo}).',
      'herramientas.pdf_cifrado': 'PDF защищён паролем и не может быть оптимизирован.',
      'herramientas.pdf_plazo': 'Обработка PDF заняла больше {segundos} с и была отменена.',
      'herramientas.salida_ocupada': 'Не удалось подобрать свободное имя для нового файла.',
      'conversor.formato': 'Эта конвертация недоступна.',
      'conversor.archivo_invalido':
        'Файл повреждён или не соответствует типу своего расширения.',
      'conversor.archivo_grande': 'Файл слишком большой (до {maximo}).',
      'conversor.archivo_peligroso':
        'Файл похож на ZIP-бомбу или подделан (слишком большой объём, XML-сущности или недопустимые имена) и не открывается в целях безопасности.',
      'conversor.limite_filas': 'В таблице слишком много строк (до {maximo}).',
      'conversor.limite_columnas': 'В таблице слишком много столбцов (до {maximo}).',
      'conversor.limite_paginas': 'В PDF слишком много страниц (до {maximo}).',
      'conversor.pdf_cifrado': 'PDF защищён паролем и не может быть конвертирован.',
      'conversor.plazo': 'Конвертация заняла больше {segundos} с и была отменена.',
      'conversor.cancelado': 'Конвертация отменена.',
      'conversor.libreoffice_ausente':
        'Для этой конвертации нужен LibreOffice, но он не установлен на этом компьютере (WolfCore Dev не устанавливает его).',
      'conversor.libreoffice_fallo': 'LibreOffice не смог конвертировать документ.',
      'conversor.limite_celdas': 'В таблице слишком много ячеек (до {maximo}).',
      'conversor.memoria': 'Файлу требуется слишком много памяти (более {maximo}), операция отменена.',
      'conversor.pdf_no_disponible': 'Печать в PDF сейчас недоступна.',
      'herramientas.imagen_pixeles':
        'В изображении слишком много пикселей ({ancho}×{alto} px; максимум {maximo}), оно не открывается в целях безопасности.',
      'herramientas.zip_cambio': 'Файл изменился во время сжатия: повторите попытку.',
      'herramientas.pdf_demasiado_complejo':
        'PDF слишком сложный (превышает лимит памяти) и был отменён.',
      'herramientas.salida_denegada':
        'Нельзя записать в это расположение: проверьте права или наличие папки.',
      'herramientas.fuera_de_la_ca':
        'CA WolfCore Dev подписывает только домены .test, localhost и локальные адреса: {dominio} нельзя включить.',
      'perfiles.frase_requerida':
        'Введите кодовую фразу профиля для импорта баз или CA (либо импортируйте без баз).',
      'perfiles.sin_espacio':
        'Недостаточно свободного места для импорта профиля: требуется {necesarios}, доступно {libres}.',
      'perfiles.ca_sin_restricciones':
        'Эта CA может подписывать любые веб-сайты: импортируйте её только если она ваша и сравните отпечаток. Подтвердите отдельно для продолжения.',
      'perfiles.ca_restricciones_ajenas':
        'CA профиля имеет ограничения имён, отличные от WolfCore Dev: импорт отклонён.',
      'perfiles.instantanea_fallo':
        'Не удалось сохранить предварительный снимок среды: ничего не изменено. Проверьте место на диске и права на папку данных.',
      'perfiles.en_curso': 'Импорт профиля уже выполняется: дождитесь его завершения.',
      'importar.origen_apagado':
        'Не удалось подключиться к серверу баз данных другой программы: запустите его там и повторите попытку. Сайты при этом импортированы.',
      'importar.origen_no_local': 'Исходный сервер должен находиться на этом компьютере (127.0.0.1).',
      'importar.origen_rechazado': 'Исходный сервер отклонил имя пользователя или пароль.',
      'importar.origen_version':
        'Версия исходного сервера не может быть импортирована с установленными в WolfCore Dev компонентами.',
      'importar.volcado_enorme':
        'Данные базы превышают {maximo} MB: за один раз они не импортируются.',
      'importar.motor_no_soportado':
        'Из других программ импортируются только базы MySQL и MariaDB.',
      'importar.ruta_fuera':
        'Пропущена папка или файл, указывающие за пределы установки или на системную папку.',
      'importar.carpeta_invalida': 'Пропущена несуществующая или недопустимая папка.',
      'importar.archivo_grande':
        'Файл конфигурации превышает {maximo} KB и не был прочитан.',
      'importar.archivo_ilegible': 'Файл конфигурации не является текстовым или не читается.',
      'importar.demasiados':
        'Слишком много сайтов или файлов конфигурации: прочитаны только первые.',
      'importar.candidato_desconocido':
        'Этот сайт больше не отображается в исходной программе: выполните поиск заново.',
      'importar.ya_vinculado': 'Эта папка уже является сайтом WolfCore Dev.',
      'importar.dominio_existe':
        'Сайт с доменом {dominio} уже существует: измените его перед импортом.',
      'importar.sin_php':
        'Этому сайту нужен PHP, но ни одна версия не установлена: установите её в разделе Службы.',
      'importar.base_existe':
        'База {nombre} уже существует в целевом сервере и не была изменена. Подтвердите замену для импорта (перед этим создаётся копия).',
      'importar.base_fallo':
        'Не удалось импортировать базу {nombre}: она осталась в исходном состоянии.',
      'importar.sitio_fallo': 'Не удалось создать сайт.',
      'importar.origen_invalido':
        'Параметры исходного сервера недействительны (пользователь, пароль или порт).',
      'importar.sin_seleccion': 'Выберите хотя бы один сайт для импорта.',
      'importar.en_curso': 'Импорт уже выполняется: дождитесь его завершения.',
      'importar.cancelado': 'Импорт отменён: всё осталось в исходном состоянии.',
      'importar.origen_estancado':
        'Сервер другой программы перестал отвечать во время дампа: база не импортирована.',
      'importar.sin_espacio':
        'Недостаточно свободного места для импорта базы: нужно около {necesarios} MB, свободно {libres} MB.',
      'importar.origen_fallo': 'Не удалось создать дамп базы другой программы.',
      'importar.clave_no_ascii':
        'Пароль содержит символы не ASCII, которые нельзя передать при дампе: используйте пароль только из символов ASCII.',
      'plantillas.sin_esquema': 'В шаблоне нет схемы базы данных.',
      'proyectos.carpeta_invalida': 'Папка проекта недопустима.',
      'proyectos.nombre_invalido':
        'Имя проекта может содержать только строчные буквы, цифры и дефисы (до 40).',
      'proyectos.argumento_invalido': 'Недопустимый параметр проекта (поле: {campo}).',
      'proyectos.base_existe': 'База {nombre} уже существует: выберите другое имя.',
      'proyectos.dominio_existe': 'Сайт с доменом {dominio} уже существует.',
      'proyectos.carpeta_de_otro_sitio':
        'Эта папка принадлежит проекту {dominio} или находится внутри него: выберите другую.',
      'proyectos.sin_python': 'Python не установлен: установите его в разделе Службы.',
      'proyectos.venv_ajeno':
        'В проекте уже есть свой .venv, а WolfCore Dev не запускает Python из чужого репозитория: удалите его и создайте окружение заново.',
      'proyectos.paso_base_no_omitible':
        'Шаг «Создать базу данных» для нового проекта нельзя пропустить.',
      'proyectos.sin_php': 'PHP не установлен: установите его в разделе Службы.',
      'proyectos.php_no_instalado': 'PHP {version} не установлен: установите его в разделе Службы.',
      'proyectos.python_no_instalado':
        'Python {version} не установлен: установите его в разделе Службы.',
      'mcp.token_invalido': 'Недействительный токен MCP-сервера.',
      'mcp.solicitud_cancelada': 'MCP-клиент отменил запрос: действие не выполнено.',
      'doctor.puerto_ocupado': 'Порт {puerto} службы {servicio} занят другой программой ({proceso}).',
      'doctor.puerto_iis': 'IIS ({programa}) занимает порт {puerto} службы {servicio}.',
      'doctor.puerto_http_sys':
        'Служба Windows ({programa}) занимает порт {puerto} службы {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} занимает порт {puerto} службы {servicio}. Закройте её или смените порт в WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} занимает порт {puerto} службы {servicio}.',
      'doctor.puerto_skype': '{programa} занимает порт {puerto} службы {servicio}.',
      'doctor.puerto_reservado':
        'Порт {puerto} службы {servicio} входит в зарезервированный Windows диапазон ({desde}-{hasta}: Hyper-V, WSL или Docker).',
      'doctor.ca_por_vencer': 'Срок действия центра сертификации WolfCore Dev истекает через {dias} дн.',
      'doctor.ca_vencida': 'Срок действия центра сертификации WolfCore Dev истёк.',
      'doctor.certificado_por_vencer': 'Срок действия сертификата {dominio} истекает через {dias} дн.',
      'doctor.certificado_vencido': 'Срок действия сертификата {dominio} истёк.',
      'doctor.hosts_ilegible': 'Не удалось прочитать файл hosts.',
      'doctor.hosts_utf16':
        'Файл hosts сохранён в UTF-16: Windows может не распознавать его записи.',
      'doctor.hosts_bloque_duplicado':
        'В файле hosts {bloques} блоков WolfCore Dev; должен быть один.',
      'doctor.hosts_bloque_sin_cierre':
        'Блок WolfCore Dev в файле hosts остался без закрывающей метки.',
      'doctor.hosts_dominios_faltantes':
        'В файле hosts отсутствуют {cantidad} доменов ваших сайтов.',
      'doctor.hosts_solo_lectura':
        'Файл hosts открыт только для чтения (часто из-за антивируса). WolfCore Dev всё равно может записать его с правами администратора.',
      'doctor.path_duplicados':
        'В пользовательском PATH есть {cantidad} повторяющихся записей WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Другая папка с {programa} ({origen}) стоит перед WolfCore Dev в PATH: в терминалах будет использоваться она.',
      'doctor.vcredist_ausente':
        'Отсутствует Microsoft Visual C++ 2015-2022 (x64): без него PHP и другие службы не запустятся.',
      'doctor.enlazador_msvc_ausente':
        'Rust установлен, но отсутствуют инструменты C++ из Visual Studio Build Tools (компоновщик MSVC): cargo не сможет скомпоновать программы.',
      'doctor.antivirus_sin_exclusion':
        'Антивирус сканирует папку данных WolfCore Dev: PHP и службы могут запускаться медленнее.',
      'doctor.firewall_reglas':
        'Windows разрешает входящие сетевые подключения для {cantidad} правил программ WolfCore Dev (nginx, PHP или баз данных) в профилях {perfiles}: эти программы открыты для сети.',
      'doctor.firewall_no_comprobado':
        'Не удалось проверить брандмауэр Windows (возможно, нужны права администратора).',
      'doctor.firewall_reglas_ajenas':
        'Есть {cantidad} входящих правил других программ (FlyEnv, Laragon, XAMPP и др.) для nginx, PHP или баз данных в профилях {perfiles}. Они не принадлежат WolfCore Dev: они только отображаются и никогда не удаляются отсюда.',
      'doctor.servicio_en_error': 'Служба {servicio} в состоянии ошибки.',
      'doctor.revision_fallida': 'Не удалось завершить проверку {revision}.',
      'doctor.confirmacion_requerida': 'Подтвердите исправление перед применением.',
      'doctor.hallazgo_desconocido': 'Это замечание уже отсутствует: выполните проверку заново.',
      'doctor.solo_informa':
        'Для этого замечания нет автоматического исправления: следуйте инструкциям.',
      'doctor.reparacion_fallida': 'Не удалось применить исправление.',
      'doctor.reparacion_cancelada': 'Запрос прав администратора отменён: ничего не изменено.',
      'doctor.reparacion_denegada': 'Windows или антивирус запретили доступ: ничего не изменено.',
      'doctor.ya_resuelto': 'Проблема уже устранена: изменения не потребовались.',
      'doctor.ca_vieja_sin_quitar':
        'Новый центр сертификации уже используется, но старый не удалось удалить из хранилища Windows. Его можно удалить в разделе HTTPS.',
      'doctor.sin_puerto_libre': 'Не найден свободный порт для переноса службы.',
      'doctor.ca_vuelta_atras_incompleta':
        'Не удалось применить новый центр сертификации, и откат прошёл не полностью. Проверьте раздел HTTPS; резервная копия с датой лежит в etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'Firefox не доверяет центру сертификации WolfCore Dev в {cantidad} профилях (использует собственное хранилище).',
      'confianza.sin_ca': 'Центр сертификации ещё не создан: создайте его в разделе HTTPS.',
      'confianza.sin_raices':
        'Не найдены доверенные корневые сертификаты для Python (ни certifi, ни Windows): ничего не изменено.',
      'confianza.node_variable_ajena':
        'У вас уже задана собственная NODE_EXTRA_CA_CERTS: WolfCore Dev не заменяет её.',
      'confianza.variable_fallida': 'Не удалось изменить переменную пользователя.',
      'firefox.abierto': 'Firefox открыт: закройте его и повторите попытку.',
      'firefox.error': 'Не удалось изменить user.js этого профиля; он остался без изменений.',
      'firefox.fuera':
        'Есть профили вне папки Firefox: включите их в разделе Доверие к CA с отдельным подтверждением.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS больше не указывает на CA WolfCore Dev (изменена вручную): не удалена.',
      'ia.clave_invalida': 'Провайдер отклонил ключ: проверьте его или создайте новый.',
      'ia.sin_saldo': 'На счёте провайдера нет средств или доступной квоты.',
      'ia.limite': 'Провайдер ограничил частоту запросов: подождите немного и повторите попытку.',
      'ia.region': 'Провайдер не обслуживает вашу страну или регион.',
      'ia.sin_red': 'Не удалось подключиться к провайдеру: проверьте сеть или базовый URL.',
      'ia.url_invalida':
        'Базовый URL недействителен: используйте https:// (или http:// только для 127.0.0.1 и [::1]), без имени пользователя и пароля.',
      'ia.plazo': 'Провайдер не ответил за {segundos} с.',
      'ia.respuesta_rara': 'Провайдер вернул неожиданный ответ.',
      'ia.cancelado': 'Запрос к провайдеру отменён.',
      'ia.sin_clave': 'Этому провайдеру нужен ключ: сначала сохраните его.',
      'ia.clave_mal_formada':
        'Неверный формат ключа (без пробелов и переносов строк).',
      'ia.modelo_invalido': 'Недопустимое имя модели.',
      'ia.modelo_no_disponible': 'Модель не существует или у вашей учётной записи нет к ней доступа.',
      'ia.proveedor_invalido': 'Настройки провайдера недействительны.',
      'ia.env_conflicto':
        'В .env уже заданы {claves} с другим значением: подтвердите замену.',
      'ia.env_sin_confirmar':
        'Подтвердите запись ключа в .env (он сохранится в открытом виде).',
      'ia.env_versionado':
        'Git уже отслеживает .env этого проекта: следующий коммит отправит ключ, даже если файл в .gitignore. Уберите его из индекса командой git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Не удалось проверить, отслеживает ли git .env этого проекта: подтвердите отдельно запись ключа.',
      'ia.proveedor_no_existe': 'Провайдер ИИ больше не существует.',
      'ia.url_cambia_con_clave':
        'У провайдера есть сохранённый ключ: подтвердите его отправку на новый URL.',
      'ia.mensaje_sin_confirmar':
        'Подтвердите отправку тестового сообщения (расходует токены вашей учётной записи).',
      'ia.clave_ilegible':
        'Не удалось прочитать сохранённый ключ провайдера: удалите и сохраните его заново.',
      'ia.argumento_invalido': 'Недопустимое значение ({campo}).',
      'correo.auth': 'Провайдер отклонил имя пользователя или пароль.',
      'correo.conexion': 'Не удалось подключиться к SMTP-серверу: проверьте хост и порт.',
      'correo.tls':
        'Не удалось установить проверенное шифрованное соединение с сервером (сертификат, имя или STARTTLS). Ничего не отправлено.',
      'correo.rechazado':
        'Сервер отклонил сообщение или адрес. Проверьте отправителя: многие провайдеры принимают только подтверждённый адрес или домен.',
      'correo.plazo': 'Сервер не ответил вовремя (20 с).',
      'correo.host_invalido':
        'SMTP-сервер должен быть именем хоста или IP-адресом без схемы, порта и пути.',
      'correo.host_local':
        'Этот сервер указывает на текущий компьютер или локальную сеть: подтвердите его использование.',
      'correo.destinatario_invalido': 'Адрес получателя недействителен.',
      'correo.proveedor_invalido': 'Данные провайдера недействительны.',
      'correo.proveedor_no_existe': 'Почтовый провайдер больше не существует.',
      'correo.sin_clave': 'У провайдера нет сохранённого ключа.',
      'correo.clave_ilegible':
        'Не удалось прочитать сохранённый ключ провайдера: удалите и сохраните его заново.',
      'correo.cambia_con_clave':
        'У провайдера есть сохранённый ключ: подтвердите его отправку на новый сервер.',
      'correo.env_sin_confirmar':
        'Подтвердите запись почтовых переменных в .env.',
      'correo.ocupado': 'Тестовая отправка уже выполняется.',
      'correo.limite': 'Подождите {segundos} с перед следующей тестовой отправкой.',
      'correo.clave_mal_formada':
        'Неверный формат ключа: только печатные символы без переносов строк, до 4096 символов.',
      'correo.argumento_invalido': 'Недопустимое значение ({campo}).',
      'agentes.no_existe': 'Этот агент не поддерживается.',
      'agentes.sin_confirmar': 'Подтвердите действие в диалоге перед продолжением.',
      'agentes.no_instalable':
        'Этот агент не устанавливается из WolfCore Dev: следуйте официальному руководству ({guia}).',
      'agentes.sin_node': 'Установите Node в разделе Службы, чтобы установить агента.',
      'agentes.node_antiguo':
        '{agente} требует Node {requerida} или выше, а используется {actual}. Установите более новую версию Node в разделе Службы.',
      'agentes.node_version_desconocida':
        'Не удалось определить версию Node, а {agente} требует Node {requerida} или выше. Проверьте Node в разделе Службы.',
      'instalador.zip_demasiado_grande':
        'Скачанный пакет слишком велик или содержит слишком много файлов: установка отменена.',
      'rust.rustup_init_fallo': 'rustup-init завершился с ошибкой (код {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Не удалось установить Rust {version} (код {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Не удалось удалить Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Не удалось скачать rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Не удалось установить агента: {detalle}',
      'agentes.no_instalado': '{agente} не установлен.',
      'agentes.mcp_no_soportado':
        '{agente} не документирует чтение токена из переменной среды: MCP не регистрируется.',
      'agentes.config_ilegible':
        'Не удалось разобрать {archivo}; файл не изменён. Проверьте его вручную.',
      'agentes.config_en_uso':
        '{archivo} изменился во время редактирования WolfCore Dev: закройте агента и повторите попытку. Файл не изменён.',
      'agentes.proveedor_incompatible': '{agente} не может использовать этого провайдера ИИ.',
      'agentes.sin_cambios_preparados': 'Нет подготовленных изменений (git add) для описания.',
      'agentes.argumento_invalido': 'Недопустимое значение ({campo}).',
      'git.commit_fallo': 'Не удалось создать коммит: {detalle}',
      'git.mensaje_invalido': 'Сообщение коммита пустое или недопустимо.',
      'php.rama_no_instalada': 'PHP {rama} не установлен.',
      'php.argumento_invalido': 'Недопустимое значение ({campo}).',
      'php.valor_invalido': 'Значение {clave} недопустимо.',
      'php.ini_invalido': 'PHP не запускается с этим php.ini; ничего не сохранено. Вывод: {salida}',
      'php.no_arranco':
        'PHP {rama} не перезапустился с новым изменением; восстановлен предыдущий файл, служба работает как раньше.',
      'php.caido_tras_restaurar':
        'PHP {rama} не перезапустился; восстановлен предыдущий файл, но служба всё ещё не отвечает. Проверьте Службы и журналы PHP.',
      'php.respaldo_no_existe': 'Такой резервной копии php.ini не существует.',
      'php.extension_no_existe': 'Расширение {nombre} отсутствует в папке ext этой версии.',
      'php.extension_no_catalogo':
        'Расширения {nombre} нет в каталоге для этой версии.',
      'php.variante_desconocida': 'Не удалось определить вариант сборки этого PHP.',
      'php.sin_variante': 'В каталоге нет {nombre} для сборки {variante}.',
      'php.huella_distinta': 'Скачанный файл не совпадает с опубликованным хэшем; ничего не установлено.',
      'php.descarga_fallida': 'Не удалось скачать расширение: {detalle}',
      'php.extension_en_uso':
        'DLL-файл {nombre} используется. Остановите PHP {rama} и повторите попытку.',
      'php.extension_sin_dll':
        'Не удалось заменить DLL {nombre}, и папка ext PHP {rama} осталась без него. Остановите PHP {rama} и повторите попытку: прежний файл вернётся при запуске.',
      'php.sitio_sin_php': 'Этот сайт не использует PHP.',
      'php.sitio_no_arranco':
        'Собственный PHP сайта {sitio} не ответил после изменения; восстановлено прежнее состояние.',
      'php.sin_puertos_sitio': 'Не осталось свободных портов для собственных PHP сайтов.',
      'xdebug.launch_invalido':
        'Не удалось разобрать .vscode/launch.json проекта; ничего не изменено.',
      'xdebug.launch_no_seguro':
        'Папка .vscode или её файл launch.json является ссылкой или специальным объектом: запись не выполняется.',
      'xdebug.sin_configurar': 'Сначала настройте Xdebug для сайта перед созданием launch.json.',
      'nginx.sitio_no_existe': 'Этот сайт больше не существует.',
      'nginx.texto_invalido':
        'Текст vhost слишком длинный, пустой или содержит управляющие символы.',
      'nginx.sintaxis': 'Строка {linea}: {detalle}. Ничего не изменено.',
      'nginx.directiva_prohibida':
        'Строка {linea}: «{directiva}» запрещена в vhost сайта (может затронуть другие сайты или файлы вне проекта). Ничего не изменено.',
      'nginx.ruta_fuera':
        'Строка {linea}: «{directiva}» указывает вне папки проекта или его журналов и сертификатов. Ничего не изменено.',
      'nginx.fuera_de_server':
        'Строка {linea}: полный vhost может содержать только блоки «server»; «{directiva}» находится снаружи. Ничего не изменено.',
      'nginx.dominio_ajeno':
        'Строка {linea}: «{nombre}» не является доменом этого сайта. Сначала добавьте его как псевдоним сайта.',
      'nginx.puerto_ajeno':
        'Строка {linea}: сайт может слушать только порты Nginx, заданные в Настройках.',
      'nginx.version_no_existe': 'Этой версии vhost больше нет в истории.',
      'nginx.argumento_invalido': 'Недопустимый аргумент: {campo}',
      'nginx.destino_interno':
        'Строка {linea}: «{directiva}» указывает на внутреннюю службу WolfCore Dev (Adminer, Mailpit, базы данных, PHP других сайтов…) и открыла бы её в сеть и туннели. Ничего не изменено.',
      'nginx.caido_tras_restaurar':
        'Nginx перестал отвечать: восстановлен прежний vhost, но служба всё ещё не отвечает. Проверьте Службы и журнал Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'Порт {puerto} уже занят: захват дампов не может слушать. Закройте программу, занимающую порт (например, Symfony server:dump).',
      'depuracion.no_iniciado': 'Захват дампов выключен.',
      'depuracion.tipo_no_soportado': 'Захват дампов поддерживается для сайтов PHP и FastAPI.',
      'depuracion.confirmacion': 'Подтвердите захват дампов в диалоговом окне.',
      'depuracion.argumento_invalido': 'Недопустимый аргумент: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Этот файл находится за пределами папки сайта: он не будет открыт в редакторе.',
      'contenedores.motor_invalido': 'Неизвестный движок контейнеров.',
      'contenedores.id_invalido': 'Недопустимый идентификатор контейнера.',
      'contenedores.argumento_invalido': 'Недопустимый аргумент: {campo}',
      'contenedores.sin_motor': '{motor} не установлен на этом компьютере.',
      'contenedores.no_responde':
        '{motor} не отвечает. Откройте Docker Desktop или запустите машину Podman и повторите попытку.',
      'contenedores.remoto':
        'Подключение {motor} по умолчанию указывает на другой компьютер: WolfCore Dev использует только локальные движки.',
      'contenedores.no_existe': 'Контейнер больше не существует. Обновите список.',
      'contenedores.accion_fallo': 'Движку не удалось выполнить действие: {detalle}',
      'contenedores.demasiados_registros':
        'Одновременно можно отслеживать не более {maximo} журналов контейнеров.',
      'contenedores.sin_confirmar': 'Подтвердите действие в диалоговом окне.',
      'catalogo.indice_invalido':
        'Индекс версий службы {servicio} не прошёл проверку; используется сохранённый список.',
      'catalogo.sin_huella':
        'Для {servicio} {version} не опубликована контрольная сумма: подтвердите установку в диалоговом окне.',
      'catalogo.huella_debil':
        'Для {servicio} {version} доступна только слабая контрольная сумма (MD5 или SHA-1): подтвердите установку в диалоговом окне.',
      'catalogo.huella_no_coincide': 'Загруженный файл не совпадает с опубликованной контрольной суммой.',
      'catalogo.redireccion_ajena': 'Загрузка попыталась перейти на неразрешённый сайт ({host}).',
      'catalogo.demasiadas_redirecciones':
        'Слишком много перенаправлений при загрузке (больше {maximo}).',
      'catalogo.respuesta_grande': 'Ответ сервера слишком большой.',
      'catalogo.version_no_encontrada':
        'Версия {version} службы {servicio} отсутствует в каталоге.',
      'catalogo.huella_no_disponible':
        'Не удалось получить контрольную сумму для {servicio} {version} (нет подключения или источник не ответил). Повторите попытку.',
      'catalogo.firma_invalida':
        'Подпись PGP для {servicio} {version} недействительна или не опубликована: ничего не установлено.',
      'catalogo.firma_no_soportada':
        'Подпись PGP для {servicio} {version} использует формат, который WolfCore Dev не проверяет: ничего не установлено.',
      'catalogo.clave_desconocida':
        'Подпись для {servicio} {version} создана ключом, которого нет среди закреплённых ключей приложения: ничего не установлено.',
      'catalogo.firma_vencida':
        'Срок действия подписи для {servicio} {version} или её ключа истёк: ничего не установлено. Обновите WolfCore Dev, чтобы получить актуальные ключи.',
      'catalogo.reloj_atrasado':
        'Подпись для {servicio} {version} имеет дату из будущего: проверьте дату и время на компьютере и повторите попытку.',
      'acceso_bd.datos_invalidos': 'Данные для доступа к базе данных недействительны.',
      'acceso_bd.sin_base': 'Файл .env этого проекта не указывает на базу данных.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin открывает только базы MySQL и MariaDB; используйте Adminer для PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'База данных этого проекта не принадлежит локальному серверу WolfCore Dev.',
      'acceso_bd.no_listo':
        'Инструмент не готов: установите его в разделе «Службы» и запустите PHP.',
      'auditoria.tabla_invalida': 'Таблица не существует в этой базе данных.',
      'auditoria.columna_invalida':
        'Столбец не существует в этой таблице (и столбцы пользователя и хеша должны быть разными).',
      'auditoria.usuario_no_encontrado': 'Нет учётной записи с таким именем пользователя.',
      'auditoria.usuario_repetido':
        'Найдено более одной учётной записи с таким именем пользователя: сброс не выполнен, чтобы не затронуть другую запись.',
      'auditoria.formato_no_soportado':
        'Формат текущего хеша невозможно воспроизвести: сброс не выполнен.',
      'auditoria.clave_larga':
        'bcrypt использует только первые 72 байта пароля: выберите более короткий пароль.',
      'auditoria.clave_invalida': 'Новый пароль недействителен.',
      'auditoria.sin_confirmar': 'Подтвердите, что хотите сбросить этот пароль.',
      'auditoria.respaldo_previo_fallo':
        'Не удалось сохранить резервную копию базы данных перед сбросом: ничего не изменено.',
      'auditoria.copia_fallo': 'Не удалось сохранить копию строки: ничего не изменено.',
      'auditoria.motor_no_soportado':
        'Аудит паролей поддерживается для MySQL, MariaDB и PostgreSQL.',
      'auditoria.cancelada': 'Аудит отменён.',
      'auditoria.usuario_invalido': 'Имя пользователя должно содержать от 1 до 256 символов.',
      'auditoria.en_curso': 'Аудит уже выполняется: дождитесь его завершения или отмените его.',
      'auditoria.base_sistema': 'Системную базу данных проверять нельзя: выберите базу проекта.',
      'auditoria.esquema_invalido': 'Схема не существует в этой базе данных.',
      'auditoria.fila_cambio':
        'Учётная запись тем временем изменилась: сброс не выполнен. Повторите попытку.',
      'auditoria.verificacion_fallo':
        'База данных сохранила пароль не так, как ожидалось: изменение отменено.',
      'auditoria.columna_corta':
        'Столбец хеша вмещает {largo} символов, а новому хешу требуется {necesario}: ничего не изменено. Увеличьте размер столбца.',
      'auditoria.datos_reales_sin_confirmar':
        'Эта база содержит реальные данные клиентов: для сброса пароля требуется усиленное подтверждение.',
      'instantaneas.id_invalido': 'Снимок недействителен.',
      'instantaneas.no_encontrada': 'Снимок не найден; возможно, он уже был удалён.',
      'instantaneas.otra_base': 'Этот снимок относится к другой базе: его нельзя применить к текущей.',
      'instantaneas.sin_confirmar': 'Подтвердите, что хотите вернуться к этому снимку.',
      'instantaneas.motor_no_soportado': 'Снимки поддерживаются для MySQL, MariaDB и PostgreSQL.',
      'instantaneas.demasiado_grande':
        'Размер базы превышает {maximo} МБ — максимальный размер для сохранения снимка.',
      'instantaneas.sin_espacio':
        'Недостаточно свободного места для снимка: требуется {necesarios} МБ, доступно {libres} МБ.',
      'instantaneas.limite':
        'Для этой базы уже создано {maximo} снимков: удалите какой-нибудь, чтобы сделать новый.',
      'instantaneas.tomar_fallo': 'Не удалось создать снимок. База данных не затронута.',
      'instantaneas.huella_no_coincide':
        'Файл снимка был изменён или повреждён: ничего не восстановлено.',
      'instantaneas.respaldo_previo_fallo':
        'Не удалось сохранить текущее состояние базы данных: ничего не восстановлено.',
      'instantaneas.restauracion_fallo':
        'Не удалось восстановить снимок. База вернулась в прежнее состояние. Причина: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Не удалось восстановить снимок, а предыдущее состояние не было сохранено: база могла остаться пустой или частично восстановленной. Причина: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Не удалось ни восстановить снимок, ни вернуться к прежнему состоянию. Прежнее состояние сохранено в автоматическом снимке {respaldo}: вернитесь к нему в разделе «Снимки».',
    },
  },
  instantaneas: {
    abrir: 'Снимки',
    titulo: (base: string) => `Снимки базы ${base}`,
    ayuda:
      'Снимок сохраняет базу данных в её текущем состоянии. Вы можете вернуться к нему в любой момент: перед восстановлением автоматически сохраняется снимок текущего состояния.',
    ubicacion:
      'Снимки хранятся в папке данных WolfCore Dev и доступны для чтения только вашему пользователю. Службы и их данные не затрагиваются.',
    notaEtiqueta: 'Заметка (необязательно)',
    notaMarcador: 'Например: перед миграцией',
    tomar: 'Создать снимок',
    tomada: 'Снимок сохранён',
    cargando: 'Загрузка снимков…',
    vacio: 'У этой базы данных пока нет снимков.',
    automatica: 'Автоматический',
    sinNota: 'Без заметки',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${plural(tablas, 'таблица', 'таблицы', 'таблиц')} · ${tamano}`,
    volver: 'Вернуться к этому снимку',
    borrar: 'Удалить',
    borrada: 'Снимок перемещён в корзину',
    papelera:
      'Удалённые снимки можно восстановить в течение 7 дней из корзины WolfCore Dev.',
    cerrar: 'Закрыть',
    papeleraTitulo: 'Корзина',
    papeleraVacia: 'В корзине нет снимков.',
    recuperar: 'Восстановить',
    recuperada: 'Снимок восстановлен',
    borradaEl: (fecha: string) => `Удалён ${fecha}`,
    borrarPregunta: 'Переместить этот снимок в корзину?',
    borrarSi: 'Переместить в корзину',
    notaAutomatica: (fecha: string) =>
      `Предыдущее состояние, сохранено перед возвратом к снимку от ${fecha}`,
    notaAutomaticaSinOrigen: 'Предыдущее состояние, сохранено перед возвратом к другому снимку',
    extensionesAviso: (lista: string) =>
      `Содержит расширения PostgreSQL (${lista}), которые восстанавливаются только с реестром контрольных сумм этого компьютера.`,
    limites:
      'В MySQL и MariaDB также сохраняются процедуры, триггеры и события. В PostgreSQL создаётся сжатый дамп одной базы: роли и пользователи сервера не включаются. Снимок, принадлежность которого этому компьютеру невозможно проверить, восстанавливается пользователем с правами только на эту базу, который не допускает представлений, процедур и триггеров других пользователей.',
    basesBorradas: 'Снимки удалённых баз данных',
    basesBorradasAyuda: 'Выберите базу, чтобы воссоздать её из снимка.',
    dialogoVolver: {
      titulo: (base: string) => `Возврат к снимку базы ${base}`,
      cargando: 'Подготовка предпросмотра…',
      base: 'База',
      instantanea: 'Снимок',
      ahora: 'Сейчас',
      tamano: 'Размер',
      tablas: 'Таблицы',
      nota: 'Заметка',
      aviso: (base: string) =>
        `База ${base} будет полностью заменена этим снимком: все изменения, сделанные после него, будут потеряны. Предварительно создаётся автоматический снимок текущего состояния; в случае ошибки база автоматически вернётся к нему.`,
      pedir: (base: string) => `Для подтверждения введите ${base}`,
      confirmar: 'Вернуться к этому снимку',
      trabajando: (base: string) => `Восстановление ${base}… Не закрывайте программу до завершения.`,
      hecho: (base: string) => `База ${base} возвращена к снимку`,
      respaldoPrevio: 'Предыдущее состояние сохранено в автоматическом снимке от',
      advertencias: 'Восстановление завершилось с уведомлениями:',
      hechoConAvisos: (base: string) => `База ${base} возвращена к снимку с уведомлениями`,
      baseVacia: 'База не существует или пуста: перед возвратом нечего сохранять.',
      sinGuardarTitulo: 'Не удалось сохранить текущее состояние',
      sinGuardarTexto:
        'WolfCore Dev не удалось сохранить текущее состояние базы перед возвратом. Если продолжить БЕЗ сохранения и восстановление завершится ошибкой, текущие данные базы будут потеряны.',
      sinGuardarConfirmar: 'Я понимаю, что текущие данные базы будут потеряны',
      sinGuardarBoton: 'Вернуться без сохранения текущего состояния',
    },
  },
  avisoInicio: {
    titulo: 'Уведомление WolfCore Dev',
  },
  tareas: {
    titulo: 'Запланированные задачи',
    resumen: (n: number) =>
      n === 0 ? 'Нет задач' : `${n} ${plural(n, 'задача', 'задачи', 'задач')}`,
    mostrar: 'Показать задачи',
    ocultar: 'Скрыть',
    cargando: 'Загрузка задач',
    errorCargar: 'Не удалось загрузить задачи',
    soloAbierta:
      'Задачи выполняются только пока открыт WolfCore Dev. Они не используют Планировщик заданий Windows: при закрытом приложении или в спящем режиме задачи не запускаются, а пропущенные запуски не выполняются задним числом.',
    repoEjecuta:
      'В доверенном проекте содержимое репозитория выполняется напрямую: файл, указанный в задаче, `artisan`, скрипты из `package.json`, `.venv`… Если они изменятся после `git pull`, задача запустит новую версию.',
    vacio:
      'У этого проекта нет запланированных задач. Создайте задачу (например, «php artisan schedule:run» каждую минуту для Laravel).',
    nueva: 'Новая задача',
    pausada: 'приостановлена',
    enCurso: 'Выполняется…',
    nunca: 'Ещё не запускалась',
    ultima: (f: string) => `Последний: ${f}`,
    proxima: (f: string) => `следующий: ${f}`,
    codigo: (n: number) => `код ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'создана здесь', 'wolfcore.yml': 'из wolfcore.yml' },
    describir: {
      cadaMinuto: 'Каждую минуту',
      cadaN: (n: number) => `Каждые ${n} ${plural(n, 'минуту', 'минуты', 'минут')}`,
      cadaHora: 'Каждый час, ровно в :00',
      diaria: (h: string) => `Ежедневно в ${h}`,
      laborables: (h: string) => `С понедельника по пятницу в ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Успешно',
      fallo: 'Ошибка',
      tiempo: 'Превышено время ожидания',
      cancelada: 'Отменена',
      omitida: 'Пропущена',
      bloqueada: 'Не выполнялась',
    },
    motivo: {
      aislado:
        'Это тестовая папка данных (WOLFCORE_DATOS): задача не запустится, пока вы не разрешите задачи в этой сессии.',
      no_confiado:
        'Проект не отмечен как доверенный: установите флажок «Я доверяю этому репозиторию», чтобы задача запускалась.',
      receta_cambio:
        'Конфигурация проекта изменилась с момента подтверждения доверия: проверьте её и снова отметьте «Я доверяю этому репозиторию».',
      sin_confirmar: 'Команда не подтверждена: задача не запустится, пока вы её не проверите и не подтвердите.',
      comando_invalido: 'Команда не разрешена (допускаются только php, node, npm run и python).',
      cron_invalida: 'Расписание не является допустимым выражением cron.',
      carpeta: 'Папка проекта не существует.',
      solapada: 'Предыдущий запуск ещё не завершился: этот запуск пропущен.',
      retraso: 'Запуск опоздал (приложение было приостановлено): пропущенные запуски не выполняются.',
      error: 'Не удалось запустить программу.',
    },
    acciones: {
      ejecutar: 'Запустить сейчас',
      editar: 'Изменить',
      borrar: 'Удалить',
      verRegistro: 'Показать журнал',
      revisarConfirmar: 'Проверить и подтвердить',
      activar: (n: string) => `Включить задачу ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Удалить «${n}»?`,
      texto:
        'Задача и её история будут удалены. Уже выполненные действия не отменяются, а файлы проекта не затрагиваются.',
      confirmar: 'Удалить',
      hecho: (n: string) => `Задача «${n}» удалена.`,
    },
    aislado: {
      titulo: 'Тестовая папка данных.',
      texto:
        'При использовании WOLFCORE_DATOS задачи не запускаются автоматически. Разрешите их только если хотите протестировать их в этой сессии.',
      permitir: 'Разрешить в этой сессии',
      confirmarTitulo: 'Разрешить задачи в этой тестовой папке?',
      confirmarTexto:
        'Активные задачи доверенных проектов начнут выполняться до закрытия приложения. Команды принадлежат самим проектам и запускаются в их реальных папках.',
      permitido: 'Задачи разрешены в этой сессии.',
    },
    yml: {
      titulo: 'Предложения из wolfcore.yml',
      texto:
        'Файл проекта предлагает эти задачи. Они не запускаются автоматически: проверьте команду и подтвердите её, чтобы принять задачу.',
      estado: { nueva: 'Новая', adoptada: 'Принята', cambiada: 'Изменилась' },
      revisar: 'Проверить и принять',
      cambiada:
        'Команда в wolfcore.yml изменилась с момента принятия. Задача проекта продолжает использовать подтверждённую ранее команду; примите новую версию, если доверяете ей.',
      guardarEn: 'Сохранить в wolfcore.yml',
      escribirTitulo: 'Записать задачу в wolfcore.yml?',
      escribirTexto:
        'Задача будет добавлена или обновлена в файле проекта (остальное содержимое не изменится), чтобы передаваться вместе с репозиторием. Каждому, кто клонирует репозиторий, потребуется подтвердить её на своём компьютере.',
      escribir: 'Записать',
      escrita: 'Задача сохранена в wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Журнал «${n}»`,
      historial: 'Последние запуски',
      sinHistorial: 'Запусков пока нет.',
      salida: 'Вывод последнего запуска',
      sinSalida: 'Сохранённого вывода нет.',
      enmascarado:
        'Журналы скрывают пароли и ключи, имеют ограниченный размер и автоматически ротируются.',
      origen: { programada: 'по расписанию', manual: 'вручную' },
    },
    dialogo: {
      tituloNueva: 'Новая запланированная задача',
      tituloEditar: 'Изменить запланированную задачу',
      tituloAdoptar: 'Принять задачу из wolfcore.yml',
      tituloConfirmar: 'Подтвердить команду задачи',
      nombre: 'Название',
      nombrePlaceholder: 'Задачи Laravel',
      horario: 'Когда',
      preset: {
        cadaMinuto: 'Каждую минуту',
        cadaN: 'Каждые несколько минут',
        cadaHora: 'Каждый час',
        diaria: 'Ежедневно в указанное время',
        laborables: 'С понедельника по пятницу в указанное время',
        personalizada: 'Собственное выражение cron',
      },
      cadaNOpcion: (n: number) => `Каждые ${n} ${plural(n, 'минуту', 'минуты', 'минут')}`,
      hora: 'Время',
      horaPlaceholder: '03:00',
      horaInvalida: 'Введите корректное время, например 03:00.',
      expresion: 'Выражение cron',
      cronEquivale: 'Выражение cron:',
      expresionAyuda:
        '5 полей: минута, час, день месяца, месяц и день недели (* , - /). Минимум — раз в минуту.',
      proximas: 'Ближайшие запуски:',
      comando: 'Команда',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Только php, node, npm run и python с файлом проекта. Запускается в папке проекта без оболочки и без встроенного кода в аргументах (-r, -e, -c).',
      comandoFijo:
        'Эта команда содержит аргументы с кавычками, которые нельзя представить в виде обычного текста: она сохраняется как есть и не редактируется здесь (удалите задачу и создайте новую, если нужно её изменить).',
      argumentos: 'Будет выполнена со следующими аргументами:',
      comillasSinCerrar: 'Не закрыты кавычки.',
      tiempo: 'Максимальное время',
      minutos: 'мин.',
      tiempoAyuda: 'Если выполнение длится дольше, задача останавливается сама (только этот процесс и его дочерние процессы).',
      activa: 'Активна (выполняется автоматически, пока открыто приложение)',
      advertencia:
        'Нажимая «Подтвердить», вы разрешаете именно эту команду: она будет автоматически выполняться в папке проекта по расписанию. При изменении команды потребуется повторное подтверждение.',
      revise: 'Я проверил эту команду и доверяю ей.',
      guardar: 'Сохранить и подтвердить команду',
      adoptar: 'Подтвердить и принять',
      confirmar: 'Подтвердить команду',
      guardada: 'Задача сохранена.',
      adoptada: 'Задача принята.',
      confirmada: 'Команда подтверждена.',
    },
  },
  workspaces: {
    titulo: 'Рабочие пространства',
    descripcion:
      'Именованные наборы баз данных, служб и процессов, которые запускаются и останавливаются вместе.',
    nuevo: 'Новое рабочее пространство',
    vacio:
      'Рабочих пространств пока нет. Создайте первое — например, «Bot FastAPI» с PostgreSQL, Redis, Ollama и процессом вашего проекта.',
    elementos: (n: number) => `${n} ${plural(n, 'элемент', 'элемента', 'элементов')}`,
    sinElementos: 'Нет элементов',
    estado: { apagado: 'Остановлено', parcial: 'Частично', encendido: 'Запущено' },
    acciones: {
      iniciar: 'Запустить',
      detener: 'Остановить',
      editar: 'Изменить',
      borrar: 'Удалить',
      cerrar: 'Закрыть',
    },
    borrar: {
      titulo: (n: string) => `Удалить «${n}»?`,
      texto:
        'Удаление рабочего пространства ничего не останавливает и не удаляет: убирается только сам набор. Запущенные элементы продолжат работать.',
      confirmar: 'Удалить',
      hecho: (n: string) => `Рабочее пространство «${n}» удалено.`,
    },
    dialogo: {
      tituloNuevo: 'Новое рабочее пространство',
      tituloEditar: 'Изменить рабочее пространство',
      nombre: 'Название',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Введите название.',
      aviso:
        'Рабочее пространство сохраняет только список запускаемых элементов. Оно не открывает туннели, не предоставляет доступ в локальной сети и не запускает процессы недоверенных проектов.',
      secciones: {
        instancias: 'Базы данных',
        servicios: 'Службы',
        procesos: 'Процессы проектов',
      },
      sinOpciones: 'Здесь нечего выбрать.',
      captadorUnico: 'Одновременно может работать только один перехватчик почты: выбор другого заменит текущий.',
      yaNoExisten: (lista: string) => `Больше не существуют и будут удалены при сохранении: ${lista}`,
      guardar: 'Сохранить',
      guardado: (n: string) => `Рабочее пространство «${n}» сохранено.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: результат запуска`,
      tituloDetener: (n: string) => `«${n}»: результат остановки`,
      encendido: 'Запущено',
      apagado: 'Остановлено',
      yaEncendido: 'Уже было запущено',
      yaApagado: 'Уже было остановлено',
      noExiste: 'Больше не существует: пропущено',
      compartido: 'Остаётся запущенным: используется другим активным рабочим пространством',
      reemplaza: (otro: string) => `Запущено; остановлена служба ${otro} из той же почтовой группы`,
      fallo: 'Не удалось запустить',
      falloApagar: 'Всё ещё работает',
      ok: (n: string) => `«${n}» готово.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: запущено ${encendidos} из ${total}. Проверьте, что не удалось запустить.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} всё ещё ${plural(siguen, 'работает', 'работают', 'работают')}. Проверьте, что не удалось остановить.`,
    },
  },
  inicio: {
    titulo: 'Главная',
    bienvenida: 'Ваша среда разработки — как на ладони.',
    tiles: {
      servicios: 'Запущенные службы',
      serviciosDe: (total: number) => `из ${total}`,
      sitios: 'Проекты',
      tuneles: 'Активные туннели',
      hosts: 'Ожидающие записи hosts',
      hostsOk: 'Всё в порядке',
      hostsFaltan: 'Требует внимания',
    },
    hosts: {
      titulo: 'Есть домены, не добавленные в файл hosts',
      texto:
        'Эти домены ещё не указывают на ваш компьютер. При исправлении Windows запросит права администратора.',
      corregir: 'Применить записи hosts',
      reintentarPermiso: 'Повторить с правами администратора',
      corregido: 'Файл hosts обновлён',
      fallo: 'Не удалось обновить файл hosts',
      verInstrucciones: 'Показать инструкцию',
      duplicados:
        'Эти домены уже есть в файле hosts вне блока WolfCore Dev (они будут сохранены):',
      motivos: {
        cancelado: 'Запрос прав администратора отменён. Файл hosts не изменился.',
        tiempo:
          'Никто не подтвердил права администратора вовремя. Сайт сохранён; файл hosts остался без изменений. Если вы всё ещё видите уведомление Windows, отмените его (оно уже ничего не сделает). Примените ожидающие записи позже (одного подтверждения хватит для всех).',
        denegado:
          'Windows не разрешила запись в файл hosts. Возможно, доступ блокирует антивирус.',
      } as Record<string, string>,
      modalTitulo: 'Исправить hosts вручную',
      modalTexto:
        'Откройте PowerShell от имени администратора (правый клик по «Пуск» → Терминал (администратор)), вставьте эту команду и нажмите Enter.',
    },
    servicios: {
      titulo: 'Службы',
      ver: 'Открыть службы',
      vacio: 'Установленных служб пока нет.',
    },
    tuneles: {
      titulo: 'Активные туннели',
      vacio: 'Открытых туннелей нет. Вы можете открыть туннель в разделе «Проекты».',
      sitioDesconocido: 'Сайт без названия',
    },
  },
  servicios: {
    titulo: 'Службы',
    descripcion:
      'Запускайте и останавливайте веб-сервер, PHP, базы данных и инструменты. Состояние обновляется автоматически.',
    grupos: {
      web: 'Веб',
      php: 'PHP',
      bd: 'Базы данных',
      correo: 'Почта',
      ia: 'ИИ',
      herramientas: 'Инструменты',
    },
    gruposAyuda: {
      web: 'Сервер, обслуживающий домены .test.',
      php: 'Отдельная установка на каждую версию (8.3, 8.4…); каждый сайт использует свою.',
      bd: 'Прослушивают только 127.0.0.1.',
      correo: 'Перехватывает письма, отправляемые вашими проектами, не выпуская их в интернет.',
      ia: 'Языковые модели на вашем компьютере.',
      herramientas: 'Утилиты для повседневной работы.',
    },
    puerto: 'Порт',
    cambiarPuerto: 'Изменить порт',
    cambiarPuertoDe: (nombre: string) => `Изменить порт для ${nombre}`,
    versionesDe: (nombre: string) => `Версии ${nombre}`,
    instancias: (n: number, encendidas: number) =>
      `${n} ${plural(n, 'экземпляр', 'экземпляра', 'экземпляров')}, ${encendidas} ${plural(encendidas, 'запущен', 'запущены', 'запущено')}`,
    usarPuerto: (p: number) => `Использовать порт ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} теперь использует порт ${p}`,
    conflicto: 'Порт занят',
    autoIniciar: 'Запускать вместе с WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} будет запускаться вместе с WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} больше не будет запускаться вместе с WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Порт ${nombre}`,
      etiqueta: 'Новый порт',
      ayuda:
        'Свободный порт от 1024 до 65535. Если служба запущена, она будет перезапущена. Обновите файл .env ваших проектов.',
      rango: 'Укажите число от 1024 до 65535',
      igual: 'Это текущий порт',
      guardar: 'Изменить порт',
    },
    borrarDatos: {
      opcion: 'Удалить данные',
      titulo: (nombre: string) => `Удалить данные ${nombre}`,
      copias: (n: number, tam: string) =>
        `Также ${n === 1 ? 'будет удалена одна копия' : `${plural(n, 'будет удалена', 'будут удалены', 'будет удалено')} ${n} ${plural(n, 'копия', 'копии', 'копий')}`} обновлений (${tam}). Если вы хотите сохранить их, скопируйте их заранее из папки данных.`,
      /** Что будет потеряно, в зависимости от службы. */
      que: {
        mysql: 'все базы данных и пользователи MySQL',
        mariadb: 'все базы данных и пользователи MariaDB',
        postgresql: 'все базы данных и пользователи PostgreSQL',
        redis: 'все ключи и данные, сохранённые в Redis',
        mongodb: 'все базы данных, коллекции и данные MongoDB',
        mailpit: 'все письма, перехваченные Mailpit',
        smtp4dev: 'все письма, перехваченные smtp4dev',
        inbucket: 'все письма, перехваченные Inbucket',
        papercut: 'все письма, перехваченные Papercut SMTP',
        ollama: 'все загруженные модели Ollama',
      } as Record<string, string>,
      texto: (que: string) =>
        `Будут удалены ${que}. Это действие нельзя отменить. Программа останется установленной.`,
      generico: (nombre: string) => `все данные ${nombre}`,
      pedir: (id: string) => `Для подтверждения введите ${id}`,
      boton: 'Удалить данные',
      hecho: (nombre: string) => `Данные ${nombre} удалены`,
    },
    ftp: {
      interruptor: 'FTP-сервер',
      redLocal: 'Разрешить подключения из локальной сети',
      redLocalAyuda:
        'Когда выключено, подключаться может только этот компьютер (127.0.0.1). Доступ для каждого сайта включается в разделе «Сайты».',
      avisoTitulo: 'Открыть FTP для локальной сети',
      avisoTexto:
        'FTP передаёт имена пользователей, пароли и файлы в незашифрованном виде. Любой компьютер в вашей сети сможет попытаться подключиться. Используйте только в доверенной сети.',
      avisoConfirmar: 'Разрешить',
      redLocalActivada: 'FTP принимает подключения из локальной сети',
      redLocalDesactivada: 'FTP принимает подключения только с этого компьютера',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Менеджер зависимостей PHP',
      instalado: 'Установлено',
      noInstalado: 'Не установлено',
      sinVersion: 'не установлено',
      uso: 'Использование',
      usoTexto: 'composer',
      ayuda: 'Используйте «Терминал» в проекте или добавьте WolfCore Dev в PATH в разделе «Настройки».',
      instaladoOk: 'Composer установлен',
      sinPhp: 'Сначала установите PHP',
      actualizado: (v: string) => `Composer обновлён: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Веб-менеджер баз данных',
      direccion: 'Адрес',
      disponible: 'Готово',
      noInstalado: 'Не установлено',
      sinPhp: 'Нет PHP',
      abrir: 'Открыть Adminer',
      instaladoOk: 'Adminer установлен',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Веб-менеджер MySQL и MariaDB',
      direccion: 'Адрес',
      disponible: 'Готово',
      noInstalado: 'Не установлено',
      sinPhp: 'Нет PHP',
      abrirDesdeProyecto: 'Открывается из карточки каждого проекта, уже с выполненным входом.',
      faltaExtension: (ext: string, rama: string) =>
        `В PHP ${rama} не включено расширение ${ext}. Перезапустите PHP или включите его в вашем php.ini.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin заявляет поддержку до PHP 8.3, а используется PHP ${rama}: возможны ошибки. Включите версию PHP от 7.2 до 8.3, если что-то пойдёт не так.`,
      instalarPrimero: 'Установите phpMyAdmin, чтобы использовать его.',
      encenderPhp: 'Включите PHP, чтобы использовать phpMyAdmin.',
      instaladoOk: 'phpMyAdmin установлен',
    },
    puertos: 'Порты',
    pid: 'PID',
    sinVersion: 'без версии',
    sinPuertos: '—',
    terminado: 'Завершено без ошибок',
    externo: 'Управляется вне WolfCore Dev',
    verDetalle: 'Показать подробности ошибки',
    vacioTitulo: 'Служб пока нет',
    vacio:
      'Установленных служб пока нет. Начните с Nginx и PHP для ваших сайтов или с базы данных.',
    irAInstalar: 'Перейти к установке',
  },
  bd: {
    descripcion:
      'Создавайте, делайте резервные копии и восстанавливайте базы ваших проектов. Серверы слушают только на 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Новая база',
    restaurar: 'Восстановить копию',
    importar: 'Импорт с другого сервера',
    soloSql: 'Доступно в MySQL, MariaDB и PostgreSQL',
    enCursoAyuda: 'Дождитесь завершения текущей операции',
    encenderPrimero: (motor: string) => `Сначала включите ${motor}`,
    cargando: 'Загрузка баз…',
    recargar: 'Обновить список',
    vacioTitulo: 'Не установлен ни один сервер баз данных',
    vacio:
      'Установите MySQL, MariaDB, PostgreSQL или MongoDB в разделе «Службы», чтобы управлять базами.',
    irAServicios: 'Перейти в «Службы»',
    apagado: {
      titulo: (motor: string) => `${motor} выключен`,
      texto: (motor: string) => `Включите ${motor}, чтобы просматривать и управлять базами.`,
      iniciando: (motor: string) => `${motor} запускается…`,
      error: (motor: string) => `Не удалось запустить ${motor}`,
      encender: (motor: string) => `Включить ${motor}`,
      verServicios: 'Открыть в «Службах»',
    },
    errorLista: 'Не удалось прочитать список баз',
    sinBases: 'На этом сервере пока нет пользовательских баз.',
    total: (n: number) => plural(n, 'база', 'базы', 'баз'),
    columnas: { nombre: 'База', tamano: 'Размер', acciones: 'Действия' },
    acciones: {
      respaldar: 'Резервная копия',
      restaurarAqui: 'Восстановить сюда',
      adminer: 'Открыть в Adminer',
      conexion: 'Данные подключения',
      vector: 'Включить vector',
      borrar: 'Удалить',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Установите Adminer и PHP в разделе «Службы», чтобы открыть его',
    vectorSinInstalar: 'Установите pgvector ниже, чтобы включить его в базе',
    vectorActivado: (base: string) => `Расширение vector включено в ${base}`,
    formatos: {
      sql: 'Обычный SQL',
      pgdump: 'Резервная копия PostgreSQL (pg_dump, пользовательский формат)',
      gz: 'Сжатый SQL (.gz)',
      zip: 'Архив .zip (распаковывается перед восстановлением)',
      rar: 'Архив .rar (попытка распаковки средствами Windows)',
      '7z': 'Архив .7z (попытка распаковки средствами Windows)',
      desconocido: 'Нераспознанный формат',
    } as Record<string, string>,
    formatoDesconocido:
      'Формат не распознан. Если это архив, распакуйте его и выберите содержащийся в нём файл .sql или .dump.',
    formatoIncompatible:
      'Этот файл является резервной копией PostgreSQL: восстановите его на вкладке PostgreSQL.',
    nombre: {
      etiqueta: 'Имя базы',
      vacio: 'Введите имя',
      largo: 'Имя слишком длинное',
      caracteres: {
        mysql: 'Используйте только буквы, цифры и подчёркивание',
        mariadb: 'Используйте только буквы, цифры и подчёркивание',
        postgresql: 'Используйте строчные буквы, цифры и подчёркивание',
        mongodb: 'Используйте только буквы, цифры, дефис и подчёркивание',
      } as Record<string, string>,
      inicio: 'В PostgreSQL имя не может начинаться с цифры',
    },
    reemplazo: {
      titulo: (base: string) => `В базе ${base} уже есть таблицы`,
      texto: (base: string) =>
        `Если вы продолжите, текущая база ${base} будет ПОЛНОСТЬЮ ЗАМЕНЕНА. Сначала автоматически сохраняется резервная копия; затем база удаляется и создаётся заново с новым содержимым.`,
      donde: 'Резервная копия сохраняется в',
      carpetaPorDefecto: 'Документы\\WolfCore Dev\\Respaldos',
      otraBase:
        'Если вы не хотите её заменять, вернитесь назад и выберите другое имя: будет создана новая база.',
      pedir: (base: string) => `Для подтверждения введите ${base}`,
      volver: 'Назад',
      confirmar: 'Заменить базу',
    },
    resultado: {
      restaurada: (base: string) => `База ${base} восстановлена`,
      importada: (base: string) => `База ${base} импортирована`,
      respaldada: (base: string) => `Резервная копия ${base} сохранена`,
      archivo: 'Файл',
      respaldoPrevio: 'Резервная копия предыдущей базы',
      advertencias: (n: number) => plural(n, 'предупреждение', 'предупреждения', 'предупреждений'),
      advertenciasAyuda:
        'Операция завершена. Проверьте эти уведомления; обычно это роли или права, которых нет на этом компьютере.',
      fallo: {
        restaurar: 'Не удалось восстановить',
        importar: 'Не удалось импортировать',
        respaldar: 'Не удалось создать резервную копию',
      } as Record<string, string>,
      trasReemplazo: 'Исходная база была заменена, но восстановление не завершилось',
      trasReemplazoAyuda:
        'Ваши прежние данные находятся в указанной резервной копии. Вы можете восстановить её с помощью «Восстановить копию».',
    },
    progreso: {
      titulo: 'Журнал',
      corriendo: {
        restaurar: (base: string) => `Восстановление ${base}…`,
        importar: (base: string) => `Импорт ${base}…`,
        respaldar: (base: string) => `Создание резервной копии ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Ожидание вывода инструмента…',
      limitado: (n: number) => `Показаны последние ${n} строк.`,
      noCierre:
        'Не закрывайте программу до завершения. Вы можете перейти на другой экран и вернуться: результат будет здесь.',
      otraEnCurso: 'Уже выполняется другая операция; дождитесь её завершения.',
      ver: 'Подробнее',
      descartar: 'Закрыть',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Восстановить резервную копию в ${motor}`,
      confianza:
        'Восстанавливайте только доверенные резервные копии: резервная копия может выполнять действия на сервере.',
      archivo: 'Файл резервной копии',
      elegir: 'Выбрать файл…',
      cambiar: 'Изменить',
      sinArchivo: 'Файл не выбран',
      formato: 'Определённый формат',
      detectando: 'Определение формата…',
      destino: 'Целевая база',
      destinoAyuda:
        'Если база не существует, она будет создана. Если существует и пуста — использована. Если в ней есть таблицы, потребуется подтверждение.',
      restaurar: 'Восстановить',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Импортировать в ${motor} с другого сервера`,
      soloLectura:
        'Исходный сервер используется только для чтения: ваша база копируется на этот компьютер, а источник не изменяется.',
      detectado: (puerto: number) =>
        `Обнаружен другой сервер на порту ${puerto} (например, от FlyEnv).`,
      origen: 'Исходный сервер',
      host: 'Сервер',
      puerto: 'Порт',
      usuario: 'Пользователь',
      clave: 'Пароль',
      claveAyuda: 'Используется только для этого копирования и не сохраняется.',
      baseOrigen: 'Исходная база',
      destino: 'Целевая база на этом компьютере',
      destinoAyuda:
        'Если база не существует, она будет создана. Если в ней есть таблицы, перед заменой потребуется подтверждение.',
      faltaHost: 'Введите сервер',
      faltaPuerto: 'Используйте порт от 1 до 65535',
      faltaUsuario: 'Введите пользователя',
      faltaBase: 'Введите исходную базу',
      importar: 'Импортировать',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Новая база в ${motor}`,
      codificacion: 'Кодировка',
      codificacionValor: {
        mysql: 'utf8mb4 (поддерживает эмодзи и все диакритические знаки)',
        mariadb: 'utf8mb4 (поддерживает эмодзи и все диакритические знаки)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Создать отдельного пользователя для этой базы',
      usuarioPropioAyuda:
        'Необязательно. В противном случае ваши проекты используют пользователя-администратора сервера.',
      usuario: 'Пользователь',
      clave: 'Пароль',
      faltaClave: 'Введите пароль',
      crear: 'Создать базу',
      creada: (base: string) => `База ${base} создана`,
      mongo: 'В MongoDB база создаётся с начальной коллекцией (_pel_init).',
      cambiarClave: 'Изменить пароль',
      cambiarClaveTitulo: (u: string) => `Пользователь ${u} уже существует с другим паролем`,
      cambiarClaveTexto: (u: string) =>
        `Если изменить пароль пользователя ${u}, проекты, которые уже его используют, перестанут подключаться, пока вы не обновите их .env. Обычно следует использовать текущий пароль. Всё равно изменить?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Удалить базу ${base}?`,
      texto: (base: string, motor: string) =>
        `Будут удалены база ${base} в ${motor} и все её данные. Это действие нельзя отменить. Если она вам нужна, сначала сделайте резервную копию.`,
      pedir: (base: string) => `Для подтверждения введите ${base}`,
      boton: 'Удалить базу',
      hecho: (base: string) => `База ${base} удалена`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Резервная копия ${base}`,
      destino: 'Будет сохранено в',
      porDefecto: 'Документы\\WolfCore Dev\\Respaldos (папка по умолчанию)',
      porDefectoEn: (carpeta: string) => `${carpeta} (папка по умолчанию)`,
      cambiar: 'Выбрать другую папку…',
      porDefectoVolver: 'Использовать папку по умолчанию',
      formato: {
        mysql: 'Файл .sql (mysqldump с процедурами и триггерами)',
        mariadb: 'Файл .sql (mysqldump с процедурами и триггерами)',
        postgresql: 'Файл .dump (pg_dump, пользовательский формат)',
      } as Record<string, string>,
      boton: 'Создать копию',
    },
    dialogoConexion: {
      sitio: 'Проект',
      sitioAyuda:
        'Считывается файл .env сайта, чтобы использовать уже имеющиеся в нём переменные (например, CodeIgniter 4). Его содержимое не отображается и не копируется.',
      generico: 'Общий (формат Laravel)',
      titulo: (base: string) => `Подключение к ${base}`,
      host: 'Сервер',
      puerto: 'Порт',
      usuario: 'Пользователь',
      clave: 'Пароль',
      base: 'База',
      sinClave: 'Без пароля (слушает только на 127.0.0.1)',
      mostrar: 'Показать пароль',
      ocultar: 'Скрыть пароль',
      copiarDato: (dato: string) => `Копировать: ${dato}`,
      env: 'Блок для файла .env',
      envAyuda: 'Вставьте его в .env вашего проекта. WolfCore Dev не изменяет файлы ваших проектов.',
      copiarEnv: 'Копировать блок',
      cargando: 'Чтение данных подключения…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Установка pgvector уже выполняется.',
      descripcion:
        'Поиск по сходству (эмбеддинги) внутри PostgreSQL. Компилируется из официального исходного кода.',
      instalado: (v: string | null) => (v ? `Установлено (версия ${v})` : 'Установлено'),
      noInstalado: 'Не установлено',
      herramientas: 'Инструменты сборки',
      herramientasSi: 'Готовы',
      herramientasNo: 'Отсутствуют',
      instalar: 'Установить pgvector',
      reinstalar: 'Пересобрать',
      instalarHerramientas: 'Установить инструменты сборки',
      dialogoHerramientasTitulo: 'Установить инструменты сборки',
      dialogoHerramientas:
        'Для компиляции pgvector требуются Build Tools для Visual Studio. Будет загружено около 6 ГБ, и Windows запросит права администратора. Это может занять много времени; не закрывайте WolfCore Dev.',
      dialogoCompilarTitulo: 'Скомпилировать и установить pgvector',
      dialogoCompilar:
        'Загружается официальный исходный код pgvector, компилируется и устанавливается в ваш PostgreSQL. PostgreSQL остановится на несколько секунд во время копирования расширения и снова запустится.',
      continuar: 'Продолжить',
      instalando: 'Установка инструментов сборки…',
      compilando: 'Компиляция pgvector…',
      herramientasOk: 'Инструменты сборки установлены',
      instaladoOk: (v: string) => `pgvector ${v} установлен`,
      sinWinget:
        'На этом компьютере нет winget. Установите «Build Tools для Visual Studio 2022» с visualstudio.microsoft.com с рабочей нагрузкой «Разработка классических приложений на C++» и попробуйте снова.',
      falloHerramientas: 'Не удалось установить инструменты сборки',
      activarAyuda: 'Затем нажмите «Включить vector» для каждой базы, которой это нужно.',
      errorEstado: 'Не удалось прочитать состояние pgvector',
    },
  },
  instalar: {
    titulo: 'Установить',
    descripcion:
      'Загружайте официальные версии. Каждый файл проверяется по контрольной сумме SHA-256 перед использованием.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Веб-сервер (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Публичные туннели (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'База данных, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'База данных, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'База данных (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Кэш и очереди в памяти (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Документная база данных (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Консоль MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'Тестовая почта (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'Тестовая почта (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'Тестовая почта (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'Тестовая почта (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'Локальный ИИ (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'Зависимости PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Веб-менеджер баз данных' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Веб-менеджер MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Веб и PHP',
      bd: 'Базы данных',
      otros: 'Почта, ИИ и туннели',
    },
    instalados: 'Установлено',
    ninguno: 'Ни одна версия не установлена',
    elegir: 'Выберите версию',
    buscando: 'Поиск версий…',
    sinVersiones: 'Версии не найдены',
    rama: (rama: string) => rama,
    yaInstalada: 'уже установлена',
    fases: {
      descargando: 'Загрузка',
      verificando: 'Проверка SHA-256',
      extrayendo: 'Распаковка',
      compilando: 'Компиляция',
      listo: 'Установлено',
      error: 'Ошибка установки',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} установлен`,
  },
  sitios: {
    titulo: 'Сайты',
    descripcion: 'Каждый сайт — это папка, обслуживаемая Nginx на собственном домене .test.',
    nuevo: 'Новый сайт',
    buscar: 'Поиск по имени или домену',
    sinResultados: (q: string) => `Ни один сайт не соответствует запросу «${q}».`,
    vacioTitulo: 'Сайтов пока нет',
    vacio:
      'Выберите папку проекта, и WolfCore Dev определит, является ли он Laravel, CodeIgniter или статическим.',
    agregar: 'Добавить сайт',
    total: (n: number) => plural(n, 'сайт', 'сайта', 'сайтов'),
    abrirSitio: (dominio: string) => `Открыть ${dominio} в браузере`,
    carpeta: 'Папка',
    abrirCarpeta: 'Открыть папку проекта',
    alias: (n: number) => `+${plural(n, 'псевдоним', 'псевдонима', 'псевдонимов')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Статический',
      proxy: 'Прокси (локальный порт)',
      personalizado: 'Пользовательский',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (локальный порт)',
      node: 'Node / Vite (локальный порт)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Статика',
      proxy: 'Прокси',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Реальные данные',
    datosRealesAyuda: 'Содержит реальные данные клиентов: будьте осторожны при публикации.',
    faltaHosts: 'Нет в hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} пока не указывает на этот компьютер. Исправьте файл hosts с помощью уведомления выше.`,
    estado: {
      enLinea: 'В сети',
      faltaHosts: 'Нет в hosts',
      iniciando: 'Запуск Nginx…',
      errorNginx: 'Ошибка Nginx',
      nginxExterno: 'Внешний Nginx',
      nginxApagado: 'Nginx выключен',
    },
    borrar: {
      titulo: (nombre: string) => `Удалить сайт ${nombre}?`,
      texto: 'Папка проекта не будет затронута.',
      hecho: (nombre: string) => `Сайт ${nombre} удалён`,
      nginxFallo: 'Сайт удалён, но Nginx не принял новую конфигурацию',
    },
  },
  formSitio: {
    tituloNuevo: 'Новый сайт',
    tituloEditar: 'Редактировать сайт',
    tituloDuplicar: 'Дублировать сайт',
    paso: 'Начните с папки проекта',
    pasoAyuda:
      'Определяются тип проекта, версия PHP и рекомендуемый домен. После этого вы сможете изменить всё.',
    elegirCarpeta: 'Выбрать папку',
    cambiarCarpeta: 'Изменить',
    detectando: 'Анализ проекта…',
    detectado: (tipo: string) => `Определено: ${tipo}`,
    sinDeteccionAlEditar: 'Автоопределение работает только при создании; проверьте тип и версию PHP.',
    nombre: 'Имя',
    nombreAyuda: 'Только для отображения в списке.',
    nombreCopia: (nombre: string) => `${nombre} (копия)`,
    duplicarProxy:
      'Копия указывает на тот же локальный порт, что и оригинал, и не копирует его процессы: измените порт или добавьте собственный процесс.',
    dominio: 'Домен',
    dominioPlaceholder: 'my-project',
    alias: 'Псевдонимы',
    aliasAyuda: 'Другие домены .test, открывающие этот же сайт. Введите и нажмите Enter.',
    aliasAgregar: 'Добавить псевдоним',
    carpeta: 'Папка проекта',
    raizLaravel: 'Nginx будет обслуживать подпапку public/.',
    tipo: 'Тип проекта',
    php: 'Версия PHP',
    phpElegir: 'Выберите версию',
    phpNinguno: 'Не установлена ни одна версия PHP.',
    phpInstalar: 'Установить PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `Проект требует PHP ${pedida}, который не установлен. Выбран PHP ${elegida}.`,
    puertoProxy: 'Локальный порт',
    puertoProxyAyuda:
      'Nginx будет перенаправлять запросы на http://127.0.0.1:<порт> (например, Vite или Node).',
    urlBaseVar: 'Переменная базового URL',
    urlBaseVarAyuda:
      'При открытии туннеля публичная ссылка записывается в эту переменную в .env, а при закрытии восстанавливается прежнее значение.',
    urlBaseVarNinguna: 'Нет (не изменять .env)',
    datosReales: 'Содержит реальные данные клиентов',
    datosRealesAyuda:
      'Отмечается в списке и запрашивает подтверждение перед публикацией через туннель.',
    avanzado: 'Дополнительно',
    reglasExtra: 'Дополнительные правила Nginx',
    reglasExtraAyuda:
      'Вставляются внутрь блока server (заголовки безопасности, собственные правила deny…). Проверяются командой nginx -t при сохранении.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Заметка',
    notaPlaceholder: 'То, что вы хотите запомнить об этом сайте',
    guardar: 'Сохранить сайт',
    guardado: (nombre: string) => `Сайт ${nombre} сохранён`,
    errorGuardar: 'Не удалось сохранить сайт',
    nginxFallo: 'Сайт сохранён, но Nginx отклонил конфигурацию',
    nginxFalloAyuda:
      'Предыдущая конфигурация Nginx восстановлена. Проверьте дополнительные правила и сохраните снова.',
    errores: {
      carpeta: 'Выберите папку проекта',
      sufijo: 'Домен должен заканчиваться на .test',
      caracteres: 'Используйте только буквы, цифры, дефисы и точки',
      aliasIgualDominio: (d: string) => `Псевдоним ${d} совпадает с доменом сайта`,
      aliasRepetido: (d: string) => `Псевдоним ${d} уже добавлен`,
      ocupado: (d: string) => `Уже существует сайт с доменом ${d}`,
      puertoFalta: 'Для прокси-сайта необходимо указать порт',
      puertoRango: 'Порт должен быть в диапазоне от 1 до 65535',
      php: 'Выберите версию PHP для этого сайта',
      urlBaseVar: 'Используйте буквы, цифры и подчёркивание (например, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Публичный туннель для ${dominio}`,
    etiqueta: 'Туннель',
    apagadoAyuda: 'Поделитесь этим сайтом по временной публичной ссылке.',
    abriendo: 'Открытие туннеля…',
    cerrando: 'Закрытие туннеля…',
    error: 'Ошибка туннеля',
    sinNginx: 'Сначала включите Nginx',
    sinCloudflared: 'Установите cloudflared в разделе «Службы»',
    abrirUrl: 'Открыть публичную ссылку',
    copiarUrl: 'Копировать публичную ссылку',
    verQr: 'Показать QR-код ссылки',
    qrTitulo: 'Публичная ссылка этого сайта',
    renovar: 'Обновить (новая ссылка)',
    cerrar: 'Закрыть туннель',
    confirmarTitulo: 'Публикация сайта с реальными данными',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} содержит реальные данные клиентов и будет опубликован в интернете через ${destino}: любой, у кого есть ссылка, сможет открыть его, пока туннель открыт. Опубликовать?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} будет опубликован в интернете через Expose: любой, у кого есть ссылка, сможет зайти, пока туннель открыт. Кроме того, инспектор запросов Expose будет виден любому компьютеру в вашей локальной сети. Опубликовать?`,
    compartir: 'Поделиться',
    confirmar: 'Опубликовать',
    confirmarPublicoTitulo: 'Опубликовать сайт в интернете',
    confirmarPublicoTexto: (dominio: string) =>
      `Будет открыт публичный туннель Cloudflare для ${dominio}: любой, у кого есть ссылка, сможет зайти, пока туннель открыт. Опубликовать?`,
    opciones: 'Параметры туннеля',
    opcionesDe: (dominio: string) => `Параметры туннеля для ${dominio}`,
    proveedor: 'Провайдер',
    proveedorRapido: 'Быстрый (без аккаунта)',
    proveedorRapidoAyuda: 'Ссылка trycloudflare.com, которая меняется при каждом открытии.',
    proveedorNombre: 'Именованный (ваш домен)',
    proveedorNombreAyuda:
      'Постоянная ссылка на вашем домене в Cloudflare. Требуется аккаунт Cloudflare.',
    cuentaConectada: 'Аккаунт Cloudflare подключён.',
    cuentaSinConectar: 'Аккаунт Cloudflare ещё не подключён.',
    conectar: 'Подключить Cloudflare',
    conectando: 'Ожидание авторизации в вашем браузере…',
    conectarAyuda:
      'Откроется ваш браузер для авторизации WolfCore Dev в вашем аккаунте. Сертификат хранится только в вашей папке данных.',
    autorizacion: 'Авторизация Cloudflare',
    abrirAutorizacion: 'Открыть страницу авторизации',
    copiarAutorizacion: 'Копировать ссылку авторизации',
    cancelarConexion: 'Отмена',
    recrear: 'Пересоздать туннель',
    olvidar: 'Забыть туннель',
    recrearTitulo: 'Пересоздать туннель',
    recrearTexto: (n: string) =>
      `Туннель «${n}» в Cloudflare будет удалён, и вместо него будет создан новый с тем же именем. Использующие его сайты будут закрыты.`,
    olvidarTitulo: 'Забыть туннель',
    olvidarTexto: (n: string) =>
      `Туннель «${n}» в Cloudflare и его сохранённые учётные данные будут удалены. Использующие его сайты вернутся к быстрому туннелю.`,
    olvidarAqui: 'Забыть только здесь',
    olvidarAquiTitulo: 'Забыть туннель только на этом компьютере',
    olvidarAquiTexto: (n: string) =>
      `Сохранённые учётные данные туннеля «${n}» на этом компьютере будут удалены; сам туннель останется в Cloudflare. Использующие его сайты вернутся к быстрому туннелю.`,
    desconectar: 'Отключить',
    nombreTunel: 'Имя туннеля',
    nombreTunelAyuda: 'Строчные буквы, цифры и дефисы.',
    dominioPublico: 'Публичный домен',
    dominioPublicoAyuda:
      'Поддомен вашего домена в Cloudflare, например demo.mydomain.com.',
    crear: 'Создать и направить',
    guardadoNombre: 'Именованный туннель готов. При открытии потребуется подтверждение.',
    guardadoRapido: 'Этот сайт снова использует быстрый туннель.',
    cambiarCierra: 'При смене провайдера открытый туннель этого сайта закрывается.',
    usarRapido: 'Использовать быстрый туннель',
    nombreActual: (nombre: string, dominio: string) => `Туннель «${nombre}» на ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} будет опубликован на ${publico} через туннель Cloudflare: любой, у кого есть ссылка, сможет открыть его, пока туннель активен. Опубликовать?`,
    proveedorNgrokAyuda:
      'С вашей учётной записью ngrok. Программа ngrok должна быть установлена на этом компьютере.',
    proveedorExposeAyuda:
      'С вашей учётной записью Expose. Expose должен быть установлен; в Windows работает только expose.phar. Его инспектор виден в локальной сети, поэтому не используется для сайтов с реальными данными.',
    proveedorTailscaleAyuda:
      'Через вашу приватную сеть Tailscale. Tailscale должен быть установлен и авторизован.',
    tokenGuardado: (f: string) => `Токен сохранён (оканчивается на ${f}).`,
    tokenSinGuardar: 'Токен ещё не сохранён.',
    tokenNgrok: 'Токен ngrok',
    tokenExpose: 'Токен Expose',
    tokenAyuda:
      'Хранится в зашифрованном виде на этом компьютере и передаётся программе только при открытии туннеля; никогда не отображается.',
    tokenPlaceholder: 'Вставьте токен сюда',
    guardarToken: 'Сохранить токен',
    borrarToken: 'Удалить токен',
    usarProveedor: 'Использовать этого провайдера',
    guardadoProveedor: 'Провайдер сохранён. При открытии туннеля потребуется подтверждение.',
    ngrokAyudaInstalacion:
      'ngrok уже должен быть установлен на этом компьютере (WolfCore Dev не скачивает его, так как нет проверяемого хэша). Ваша глобальная конфигурация не затрагивается.',
    exposeAyudaInstalacion:
      'Expose должен быть установлен либо expose.phar должен находиться в папке bin/expose данных WolfCore Dev (в Windows работает только phar; проверяемой загрузки нет). Его инспектор запросов виден всей локальной сети, поэтому он не используется для сайтов с реальными данными. Ваша глобальная конфигурация не затрагивается.',
    tailscaleAlcance: 'Область доступа',
    tailscaleServe: 'Serve: только ваша tailnet',
    tailscaleServeAyuda: 'Только устройства вашей сети Tailscale. Не выходит в интернет.',
    tailscaleFunnel: 'Funnel: весь интернет',
    tailscaleFunnelAyuda: 'Любой со ссылкой может зайти, даже вне вашей tailnet.',
    tailscaleFunnelAviso:
      'Funnel публикует этот сайт в интернете: любой, у кого есть ссылка, сможет открыть его, пока туннель активен.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev не устанавливает Tailscale (это системная служба): он должен быть установлен и авторизован. Существующие публикации Tailscale не изменяются; сайт использует HTTPS-порт 8443.',
    confirmarTailnetTitulo: 'Открыть доступ для tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `Доступ к ${dominio} будет открыт через Tailscale Serve: зайти смогут только устройства вашей tailnet; публикации в интернете нет. Поделиться?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} содержит реальные данные клиентов. Через Tailscale Serve его увидят только устройства вашей tailnet (не публикуется в интернете). Поделиться?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} будет опубликован в интернете через Tailscale Funnel: любой со ссылкой сможет открыть его, пока он активен. Опубликовать?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} будет опубликован в интернете через ${proveedor}: любой со ссылкой сможет открыть его, пока он активен. Опубликовать?`,
    tituloError: 'Не удалось открыть туннель',
  },
  tuneles: {
    titulo: 'Туннели',
    descripcion: 'Временные публичные ссылки Cloudflare для показа сайта за пределами вашей сети.',
    explicacion:
      'Быстрые туннели меняют адрес при каждом открытии или обновлении и работают только пока включён этот компьютер и активны их процессы (если вы выйдете из WolfCore Dev, оставив их запущенными, они продолжат работать).',
    columnas: { sitio: 'Сайт', estado: 'Состояние', url: 'Ссылка', acciones: 'Действия' },
    vacioTitulo: 'Нет открытых туннелей',
    vacio: 'Включите переключатель туннеля у сайта, чтобы получить публичную ссылку.',
    irASitios: 'Перейти к сайтам',
    sinNombre: 'Удалённый сайт',
  },
  ajustes: {
    titulo: 'Настройки',
    descripcion: 'Параметры среды.',
    general: 'Общие',
    carpetaDatos: 'Папка данных',
    carpetaDatosAyuda: 'Исполняемые файлы, конфигурация и журналы. Можно открыть, но не изменить.',
    servicios: 'Службы',
    puertoNginx: 'Порт Nginx',
    puertoNginxAyuda:
      'Обычно 80. Если порт не 80, локальные URL будут содержать порт. Открытые туннели остаются на старом порту: обновите их.',
    trabajadores: 'Рабочие процессы PHP',
    trabajadoresAyuda:
      'Процессы php-cgi на версию. Большее количество обрабатывает больше одновременных запросов.',
    nota: 'При сохранении сайты перегенерируются с новым портом. Если Nginx запущен, он перезапускается (или перезагружается, если порт не менялся), а запущенные версии PHP перезапускаются при изменении числа процессов.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Настройки сохранены и применены. Перезапущено: ${reiniciados.join(', ')}.`
        : 'Настройки сохранены и применены.',
    errorAplicar: 'Настройки сохранены, но не все удалось применить',
    errorSeccion: (detalle: string) => `Не удалось прочитать параметр: ${detalle}`,
    acerca: 'О программе',
    avisos: {
      titulo: 'Уведомления',
      descripcion:
        'Какие уведомления сохраняются в колокольчике и показывает ли Windows системное уведомление, когда окно скрыто.',
      nativas: 'Уведомления Windows',
      nativasAyuda:
        'Только когда WolfCore Dev не на переднем плане; не чаще одного раза в 5 мин для каждого типа.',
      tiposTitulo: 'Типы уведомлений',
      versionesTitulo: 'Новые версии по службам',
      versionesAyuda:
        'Отключите службу, чтобы не получать уведомления о новых версиях (вкладка Версии по-прежнему отмечает обновления).',
      versionesDe: (s: string) => `Уведомлять о новых версиях ${s}`,
      tipos: {
        'servicio-caido': 'Служба остановилась с ошибкой',
        'puerto-ocupado': 'Порт занят при запуске службы',
        'certificado-por-vencer': 'Истекающие сертификаты',
        'tunel-caido': 'Туннель оборвался',
        'proceso-error': 'Процесс проекта завершился с ошибкой',
        'proceso-terminado': 'Процесс проекта завершился',
        'receta-terminada': 'Рецепт проекта завершён',
        doctor: 'Диагностика (Doctor)',
        'contenedor-detenido': 'Контейнер остановлен',
        'version-nueva': 'Доступна новая версия установленной службы',
      } as Record<string, string>,
      errorGuardar: 'Не удалось сохранить настройки уведомлений',
    },
    versionPrograma: 'Версия программы',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Локальный центр сертификации',
      autoridadAyuda:
        'WolfCore Dev подписывает сертификаты ваших сайтов .test собственным центром сертификации. Он устанавливается в хранилище пользователя Windows без прав администратора.',
      instalada: 'Установлен в Windows',
      noInstalada: 'Не установлен',
      instalar: 'Установить CA',
      reinstalar: 'Переустановить',
      quitar: 'Удалить',
      instaladaOk: 'HTTPS CA установлен',
      quitadaOk: 'HTTPS CA удалён',
      cancelado: 'Подтверждение Windows отменено. Ничего не изменено.',
      fallo: 'Не удалось изменить HTTPS CA',
      quitarTitulo: 'Удалить HTTPS CA?',
      quitarTexto:
        'Браузеры перестанут доверять сертификатам ваших сайтов .test, пока вы не установите его снова.',
      puerto: 'Порт HTTPS',
      puertoAyuda:
        'Обычно 443. Если он занят другой программой, выберите порт от 1024 до 65535; URL будут включать порт.',
      puertoRango: 'Используйте 443 или число от 1024 до 65535',
      puertoGuardado: (p: number) => `HTTPS теперь использует порт ${p}`,
      puertoAplicarFallo: 'Порт сохранён, но Nginx отклонил новую конфигурацию',
      firefox:
        'Firefox использует собственное хранилище сертификатов. Чтобы он доверял CA, откройте about:config и включите',
    },
    herramientas: {
      titulo: 'Терминал и инструменты',
      phpPorDefecto: 'PHP по умолчанию',
      phpPorDefectoAyuda:
        'Версия php и composer в терминале и командах WolfCore Dev. Кнопка «Терминал» использует PHP конкретного проекта.',
      phpMasReciente: 'Последняя установленная',
      phpSinInstalar: 'Установите PHP в разделе Службы, чтобы выбрать версию',
      phpGuardado: 'PHP по умолчанию обновлён',
      path: 'PATH пользователя',
      pathAyuda:
        'Добавляет php и composer из WolfCore Dev в PATH вашего пользователя для использования в любом терминале.',
      pathActivo: 'Добавлено в PATH',
      pathInactivo: 'Не в PATH',
      pathAgregar: 'Добавить в PATH пользователя',
      pathQuitar: 'Убрать из PATH',
      pathTitulo: 'PATH обновлён',
      pathAviso: 'Откройте новый терминал, чтобы увидеть изменения: уже открытые терминалы их не увидят.',
      pathQuitarTitulo: 'Убрать WolfCore Dev из PATH?',
      pathQuitarTexto:
        'php и composer из WolfCore Dev перестанут быть доступны в новых терминалах. Открытые терминалы не изменятся.',
      adminer: 'Порт Adminer',
      adminerAyuda: 'Adminer доступен только на этом компьютере по этому фиксированному адресу.',
      terminal: 'Терминал по умолчанию',
      terminalSistema: 'Системный (PowerShell)',
      terminalAyuda:
        'Открывается по кнопке «Терминал» в проектах. Если проекту нужны собственные переменные (его PHP в PATH, ключ агента), при выборе «Windows Terminal» открывается PowerShell в терминале Windows по умолчанию: уже открытый Windows Terminal не получит эти переменные.',
      terminalGuardada: 'Терминал по умолчанию обновлён',
      editor: 'Редактор по умолчанию',
      editorPrimero: 'Первый обнаруженный',
      editorAyuda:
        'Открывается по кнопке «Редактор» в проектах и «Открыть в редакторе» при поиске и ошибках. Определяются VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed и Notepad++.',
      editorGuardado: 'Редактор по умолчанию обновлён',
      editorNinguno: 'Редакторы не обнаружены.',
    },
  },
  /* ───────────── HTTPS, terminal y FTP en sitios; Correo; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS активен',
    candadoAyuda: 'Этот сайт также отвечает по HTTPS с сертификатом WolfCore Dev.',
    redirige: 'Перенаправляет http → https',
    abrirHttp: (dominio: string) => `Открыть http://${dominio} в браузере`,
    abrirHttps: (url: string) => `Открыть ${url} в браузере`,
    pendiente: (motivo: string) => `HTTPS ожидает: ${motivo}`,
    pendienteCorto: 'HTTPS ожидает',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `порт ${puerto} занят ${nombre} (PID ${pid}).`,
    sinAutoridad: 'отсутствует центр сертификации. Установите его в Настройках.',
    pendienteAyuda:
      'Сайт продолжает работать по HTTP. Закройте эту программу или выберите другой порт HTTPS в Настройках.',
    sinConfianza: 'CA не установлен',
    sinConfianzaAyuda:
      'Браузер будет показывать предупреждение безопасности, пока вы не установите CA WolfCore Dev (Настройки → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Также обслуживать по HTTPS',
    httpsAyuda: 'С собственным сертификатом для домена и его псевдонимов, подписанным WolfCore Dev.',
    redirigir: 'Перенаправлять на HTTPS',
    redirigirAyuda: 'Переходы по http перенаправляются на https. Публичные туннели не затрагиваются.',
    redirigirDeshabilitado: 'Сначала включите HTTPS',
    sinAutoridadTitulo: 'HTTPS CA не установлен',
    sinAutoridadTexto:
      'Без него браузер покажет предупреждение безопасности. Windows попросит подтвердить установку.',
    instalar: 'Установить CA',
    instalada: 'HTTPS CA установлен',
    cancelado: 'Подтверждение Windows отменено. Ничего не изменено.',
    fallo: 'Не удалось установить HTTPS CA',
  },
  terminalSitio: {
    boton: 'Терминал',
    ayuda: 'Открывает терминал в папке проекта с его PHP и Composer в PATH.',
    elegir: 'Выбрать терминал',
    predeterminada: 'по умолчанию',
  },
  editorSitio: {
    ayuda: 'Открывает папку проекта в редакторе по умолчанию.',
    elegir: 'Открыть с помощью…',
    predeterminada: 'по умолчанию',
    sustituido: (pred: string, usado: string) =>
      '{pred} не установлен: открыто в {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Не удалось открыть редактор',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `Общий PHP ${rama}`,
    propio: (rama: string) => `Собственный PHP ${rama} этого сайта`,
    conXdebug: 'Xdebug активен',
    mostrar: 'Настройки PHP',
    ocultar: 'Скрыть настройки PHP',
    cargando: 'Чтение настроек PHP…',
    apagadoRama: (rama: string) =>
      `PHP ${rama} остановлен: собственный PHP этого сайта запускается вместе с ним.`,
    ajustesTitulo: 'Собственный php.ini',
    ajustesAyuda: (rama: string) =>
      `Добавляются к php.ini для PHP ${rama} только для этого сайта. При наличии настроек (или Xdebug) сайт использует собственный PHP из 1–2 процессов; остальные сайты не меняются.`,
    clave: 'Директива',
    valor: 'Значение',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Убрать ${clave || 'параметр'}`,
    agregar: 'Добавить параметр',
    guardarAjustes: 'Проверить и сохранить',
    ajustesGuardados: 'Настройки PHP сайта применены',
    sinAjustes: 'Без собственных настроек: используется общий php.ini как есть.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug для ${dominio}`,
    xdebugAyuda:
      'Загружается только в PHP этого сайта, никогда в общем PHP: остальные сайты работают так же быстро.',
    xdebugDescarga:
      'Xdebug не установлен для этой версии PHP: он будет загружен из каталога (xdebug.org, проверенный SHA-256).',
    modo: 'Режимы',
    modos: {
      debug: 'debug (точки останова)',
      develop: 'develop (улучшенные ошибки)',
      coverage: 'coverage (покрытие кода)',
      profile: 'profile (профилирование)',
      trace: 'trace (трассировка)',
    },
    puerto: 'Порт редактора',
    inicio: 'Когда подключаться',
    inicioTrigger: 'Только при XDEBUG_TRIGGER',
    inicioYes: 'На каждый запрос',
    inicioAyuda:
      'В режиме «Только при XDEBUG_TRIGGER» отладка запускается при наличии cookie, GET/POST-параметра или расширения браузера (Xdebug Helper).',
    guardarXdebug: 'Сохранить Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `Порт ${puerto} уже используется PHP или другой службой WolfCore Dev: редактор не сможет его прослушивать. Выберите другой (обычно 9003).`,
    xdebugGuardado: 'Xdebug для сайта применён',
    quitarXdebug: 'Убрать Xdebug',
    quitarXdebugTitulo: 'Убрать Xdebug с этого сайта?',
    quitarXdebugTexto:
      'Его конфигурация будет удалена. Если у сайта нет других настроек, он вернётся к общему PHP. Файл launch.json проекта не затрагивается.',
    xdebugQuitado: 'Xdebug убран с сайта',
    ide: 'Редактор',
    generarLaunch: 'Создать launch.json',
    launchTitulo: '.vscode/launch.json проекта',
    launchNuevo:
      'Будет создан файл .vscode/launch.json с этой конфигурацией (PHP Debug для VS Code, слушает только 127.0.0.1).',
    launchFusion:
      'Файл launch.json уже существует: добавится (или обновится) только конфигурация WolfCore; остальные записи и комментарии сохранятся. Предварительно сохраняется копия с датой в папке данных.',
    launchSinCambios: 'В launch.json уже есть эта конфигурация.',
    launchEscribir: 'Записать launch.json',
    launchCreado: 'launch.json создан в .vscode',
    launchActualizado: (respaldo: string) => `launch.json обновлён. Предыдущая копия: ${respaldo}`,
    phpStorm: 'Конфигурация для PhpStorm',
    copiarPhpStorm: 'Копировать настройки PhpStorm',
    errorNginx: (salida: string) => `Nginx не принял изменение; восстановлено прежнее состояние. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Сгенерированный vhost',
    conReglas: 'со своими правилами',
    manualResumen: 'Vhost, написанный вручную (не перегенерируется)',
    mostrar: 'Изменить vhost',
    ocultar: 'Скрыть vhost',
    cargando: 'Чтение vhost…',
    reglasTitulo: 'Собственные правила',
    reglasAyuda:
      'Размещаются внутри блока server этого сайта. Перед применением проверяются через nginx -t на копии всей конфигурации; при ошибке всё остаётся как было.',
    reglasEtiqueta: 'Собственные правила Nginx',
    reglasPlaceholder: '# Например: client_max_body_size 256m;',
    snippetsTitulo: 'Фрагменты',
    insertar: (titulo: string) => `Вставить: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Кэш статики',
      'limite-subida': 'Лимит загрузки',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Заголовки безопасности',
      websocket: 'Прокси WebSocket',
      gzip: 'Сжатие gzip',
      ocultos: 'Запрет скрытых файлов',
    },
    aplicar: 'Проверить и применить',
    descartar: 'Отменить изменения',
    aplicado: 'Vhost применён, Nginx перезагружен',
    aplicadoApagado: 'Vhost сохранён; будет использован при запуске Nginx',
    fallo: 'Nginx отклонил изменение; vhost остался без изменений',
    salidaTitulo: 'Вывод nginx -t',
    desactivado:
      'Nginx не принял ваши правила для этого сайта; они были исключены из vhost (но сохранены). Исправьте и примените снова.',
    avisoDestino: (destino: string, linea: number) =>
      `Строка ${linea}: трафик направляется на другой компьютер (${destino}). Убедитесь, что это намеренно.`,
    generadoTitulo: 'Сгенерированный vhost (только чтение)',
    avanzadoTitulo: 'Расширенный режим',
    avanzadoInterruptor: 'Написать полный vhost вручную',
    avanzadoAyuda:
      'Заменяет сгенерированный vhost. WolfCore Dev больше не будет его обновлять: изменения домена, HTTPS, портов или папки нужно вносить вручную. Разрешены только домены и порты этого сайта.',
    avanzadoActivarTitulo: 'Написать vhost вручную?',
    avanzadoActivarTexto:
      'За основу берётся текущий сгенерированный vhost. Пока режим активен, изменения сайта (домен, HTTPS, PHP…) не отражаются в vhost автоматически.',
    avanzadoActivar: 'Писать вручную',
    manualEtiqueta: 'Полный vhost сайта',
    aplicarManual: 'Проверить и применить vhost',
    volverGenerado: 'Вернуться к сгенерированному vhost',
    volverGeneradoTitulo: 'Вернуться к сгенерированному vhost?',
    volverGeneradoTexto:
      'Ручной vhost сохранится в истории, а WolfCore Dev снова начнёт генерировать vhost сайта (включая ваши правила).',
    historial: 'История',
    historialTitulo: 'Предыдущие версии vhost',
    historialVacio: 'Предыдущих версий пока нет.',
    historialAyuda:
      'Сохраняются последние 10 версий перед каждым изменением. Восстановление проходит ту же проверку nginx -t.',
    modoReglas: 'Сгенерирован с правилами',
    modoManual: 'Написан вручную',
    restaurar: 'Восстановить',
    restaurarTitulo: 'Восстановить эту версию?',
    restaurarTexto: (fecha: string) =>
      `Vhost вернётся к состоянию от ${fecha}. Текущая версия останется в истории.`,
    restaurado: 'Версия восстановлена',
  },
  lan: {
    etiqueta: 'Локальная сеть',
    interruptor: (dominio: string) => `Открыть ${dominio} в локальной сети`,
    apagadoAyuda: 'Откройте этот сайт с телефона или другого устройства в той же сети.',
    sinNginx: 'Запустите Nginx, чтобы открыть сайт в локальной сети.',
    sinRed: 'Нет подключения к локальной сети (Wi-Fi или Ethernet).',
    activo: 'Виден в локальной сети',
    abriendo: 'Открытие доступа…',
    cerrando: 'Закрытие доступа…',
    abrirUrl: 'Открыть на этом компьютере',
    copiarUrl: 'Копировать адрес',
    verQr: 'Показать QR-код',
    qrTitulo: (dominio: string) => `${dominio} в локальной сети`,
    qrAviso: 'Отсканируйте QR-код с телефона, подключённого к той же сети.',
    confirmarTitulo: 'Открыть доступ в локальной сети',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} станет доступен без пароля любому устройству в той же сети, что и этот компьютер (${ip}). Доступ прекращается при выключении переключателя, закрытии и перезапуске WolfCore Dev.`,
    ipEtiqueta: 'Сеть (IP этого компьютера)',
    https: 'Использовать HTTPS',
    httpsAyuda:
      'Для HTTPS телефон должен доверять CA WolfCore Dev (кнопка «Установить CA на телефон»). Без этого сайт работает по HTTP.',
    httpsObligatorio: 'Этот сайт перенаправляет на HTTPS, поэтому доступ открывается по HTTPS.',
    compartir: 'Открыть в сети',
    tituloError: 'Не удалось открыть доступ в локальной сети',
    caBoton: 'Установить CA на телефон',
    firewallTitulo: 'Не открывается на телефоне?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} содержит реальные данные и не открывается в локальной сети даже с подтверждением.`,
    redPublica:
      'Эта сеть отмечена в Windows как общедоступная: брандмауэр блокирует входящие подключения, а команда открывает только частные сети. Переведите её в частную, если доверяете ей.',
    firewallTexto:
      'WolfCore Dev не меняет настройки брандмауэра. Не разрешайте доступ всей программе в окне Windows: выполните команду для этого порта (только локальная подсеть и частные сети) в PowerShell от имени администратора. В общедоступной сети порт не откроется, а существующее правило блокировки имеет приоритет.',
    copiarComando: 'Копировать команду',
  },
  caMovil: {
    titulo: 'Установить CA на телефон',
    intro:
      'Отсканируйте QR-код с телефона в той же сети, чтобы скачать сертификат центра сертификации WolfCore Dev. Передаётся только этот файл, а ссылка закроется автоматически.',
    abriendo: 'Открытие ссылки…',
    expira: (minutos: number) => `Ссылка закроется автоматически через ${minutos} мин.`,
    expirado: 'Ссылка закрыта.',
    reabrir: 'Открыть снова',
    android: 'Android',
    ios: 'iPhone или iPad',
    pasosAndroid: [
      'Отсканируйте QR-код или откройте адрес в браузере телефона и скачайте файл.',
      'Откройте Настройки > Безопасность и конфиденциальность > Дополнительные настройки безопасности > Шифрование и учётные данные > Установить сертификат > Сертификат ЦС (названия зависят от производителя).',
      'Перед подтверждением сравните отпечаток SHA-256 на телефоне с отпечатком в этом окне: при несовпадении не устанавливайте.',
      'Выберите скачанный файл и примите предупреждение: Android всегда предупреждает при установке ЦС.',
    ],
    pasosIos: [
      'Откройте адрес в Safari и разрешите загрузку профиля.',
      'Откройте Настройки > Профиль загружен и сравните отпечаток SHA-1 в сведениях с этим окном: при несовпадении не устанавливайте. Затем установите профиль.',
      'Откройте Настройки > Основные > Об этом устройстве > Доверие сертификатам и включите полное доверие для CA WolfCore Dev.',
    ],
    aviso:
      'Установленный ЦС даёт доверие всему, что им подписано на этом телефоне: устанавливайте его только на свои устройства и удаляйте после работы.',
    firewallAviso: (puerto: number) =>
      'Чтобы телефон смог открыть ссылку, нужно открыть порт ' +
      puerto +
      ' (только локальная подсеть и частные сети). Не разрешайте доступ всей программе в окне Windows: выполните эту команду в PowerShell от имени администратора. В общедоступной сети порт не откроется, а существующее правило блокировки имеет приоритет.',
    huellas: 'Отпечатки сертификата',
    tituloError: 'Не удалось открыть ссылку CA',
  },
  dialogoQr: {
    descargar: 'Скачать PNG',
    descargado: 'QR-код сохранён',
    largo: 'Текст слишком длинный для QR-кода.',
    generando: 'Создание QR-кода…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `FTP-доступ для ${dominio}`,
    apagadoAyuda: 'Позволяет загружать файлы в папку этого сайта по FTP.',
    activoAyuda: 'Доступ активен.',
    soloLecturaEtiqueta: 'только чтение',
    mostrarDatos: 'Показать данные FTP',
    ocultarDatos: 'Скрыть данные FTP',
    host: 'Сервер',
    puerto: 'Порт',
    usuario: 'Пользователь',
    clave: 'Пароль',
    mostrarClave: 'Показать пароль',
    ocultarClave: 'Скрыть пароль',
    copiarDato: (dato: string) => `Копировать ${dato}`,
    cargando: 'Чтение данных FTP…',
    regenerar: 'Пересоздать пароль',
    regenerarTitulo: 'Пересоздать пароль FTP?',
    regenerarTexto:
      'Текущий пароль перестанет работать, а открытые подключения к этому сайту закроются. Его нужно будет обновить в вашем FTP-клиенте.',
    regenerada: 'Пароль FTP пересоздан',
    soloLectura: 'Только чтение',
    soloLecturaAyuda: 'Можно скачивать файлы, но нельзя загружать, изменять или удалять их.',
    soloLecturaActivado: 'FTP для этого сайта теперь доступен только для чтения',
    soloLecturaDesactivado: 'FTP для этого сайта теперь разрешает запись',
    activado: 'Доступ по FTP включён',
    desactivarTitulo: 'Отключить доступ по FTP для этого сайта?',
    desactivarTexto:
      'Пароль будет удалён, а открытые подключения закрыты. Папка сайта останется нетронутой.',
    desactivar: 'Отключить доступ',
    desactivado: 'Доступ по FTP отключён',
    redLocalAviso:
      'FTP принимает подключения из локальной сети и передаёт пароль и файлы без шифрования. Используйте его только в доверенной сети.',
    redLocalHost: 'или IP-адрес этого компьютера в вашей сети',
    servidorApagado: 'FTP-сервер выключен: никто не сможет подключиться, пока вы его не включите.',
    encender: 'Включить FTP',
    urlEtiqueta: 'Адрес',
    urlAyuda: 'Адрес не включает пароль: он запрашивается при подключении.',
    abrirUrl: 'Открыть в FTP-клиенте',
    copiarUrl: 'Скопировать FTP-адрес',
    verQr: 'Показать QR-код адреса',
    qrTitulo: 'FTP-адрес этого сайта',
    qrAviso: 'QR-код содержит только адрес, без пароля.',
  },
  correo: {
    descripcion:
      'Перехватчики почты улавливают письма, отправляемые вашими проектами, чтобы вы могли проверить их без отправки в интернет. Они слушают только этот компьютер (127.0.0.1), и одновременно может работать только один.',
    seccionCaptadores: 'Локальные перехватчики',
    seccionProveedores: 'Удалённые SMTP-провайдеры',
    proveedores: {
      descripcion:
        'Настоящий SMTP-провайдер отправляет реальные письма: используйте его, чтобы проверить отправку почты в проекте перед публикацией. Пароль хранится в зашифрованном виде на этом компьютере и никогда не отображается.',
      agregar: 'Добавить провайдера',
      vacio:
        'Вы ещё не добавили ни одного провайдера. Выберите Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO или Gmail либо укажите свой.',
      errorLista: 'Не удалось прочитать список провайдеров',
      tarjeta: {
        servidor: 'Сервер',
        usuario: 'Пользователь',
        clave: 'Пароль',
        sinClave: 'Без пароля',
        claveIlegible: 'Сохранён (не удалось прочитать)',
        red: 'Сеть',
        redLocal: 'Сервер на этом компьютере или в локальной сети (подтверждено)',
        editar: 'Изменить',
        borrar: 'Удалить',
        borrarTitulo: (n: string) => `Удалить ${n}?`,
        borrarTexto:
          'Провайдер и его сохранённый пароль будут удалены. Использующие его проекты вернутся к локальному перехватчику, но их файлы .env не изменятся: в них останутся переменные MAIL_* этого провайдера (и его пароль, если вы его записывали). Перезапишите блок почты в каждом .env.',
        borrado: (n: string) => `${n} удалён`,
        usar: 'Использовать в проекте',
        destino: 'Адрес получателя для проверки',
        destinoPlaceholder: 'vash-adres@example.com',
        probar: 'Проверить отправку',
        probando: 'Отправка…',
        probarAyuda:
          'Отправляет одно настоящее письмо на этот адрес по проверенному зашифрованному соединению. Не чаще одного раза в 15 с.',
        sinClaveParaProbar: 'Сохраните пароль провайдера, чтобы проверить отправку.',
        hostLocal: 'Имя этого сервера указывает на этот компьютер или локальную сеть.',
        confirmarRed: 'Подтвердить локальную сеть',
        enviado: (para: string) => `Письмо отправлено на ${para}. Проверьте входящие.`,
        fallos: {
          'correo.auth': 'Провайдер отклонил имя пользователя или пароль.',
          'correo.conexion': 'Не удалось подключиться: проверьте хост и порт.',
          'correo.tls':
            'Зашифрованное соединение недействительно (сертификат, имя хоста или STARTTLS). Ничего не отправлено.',
          'correo.rechazado':
            'Сервер отклонил сообщение или адрес. Проверьте отправителя: многие провайдеры принимают только подтверждённого отправителя или домен.',
          'correo.plazo': 'Сервер не ответил вовремя (20 с).',
        },
      },
      dialogo: {
        nuevo: 'Добавить SMTP-провайдера',
        editar: (n: string) => `Изменить ${n}`,
        preset: 'Провайдер',
        presetOtro: 'Другой (указать данные вручную)',
        presetAyuda: 'Хост и порт взяты из официальной документации каждого провайдера.',
        documentacion: 'Открыть документацию',
        region: 'Регион',
        nombre: 'Название',
        nombreObligatorio: 'Введите название.',
        host: 'Сервер (хост)',
        hostAyuda: 'Только доменное имя или IP-адрес, без smtp:// и порта.',
        hostObligatorio: 'Введите адрес сервера.',
        puerto: 'Порт',
        seguridad: 'Шифрование',
        seguridadAyuda:
          'Всегда требуется зашифрованное соединение с действительным сертификатом: переход на открытый текст никогда не выполняется.',
        tls: 'Прямой TLS (порт 465)',
        starttls: 'STARTTLS (порт 587)',
        usuario: 'Пользователь',
        usuarioObligatorio: 'Введите имя пользователя.',
        usuarioFijoAyuda: 'Этот провайдер всегда использует данного пользователя; пароль — от вашей учётной записи.',
        clave: 'Пароль SMTP',
        claveGuardada: (f: string) => `Сохранён: ••••${f}`,
        claveNueva: 'Введите пароль для сохранения',
        claveAyuda:
          'Хранится в зашифрованном виде на этом компьютере и больше никогда не отображается. Оставьте поле пустым, чтобы не менять его.',
        remitente: 'Отправитель для проверки (необязательно)',
        remitenteAyuda:
          'Многие провайдеры отправляют письма только от подтверждённого отправителя или домена. Если оставить поле пустым, в качестве отправителя будет использован адрес получателя.',
        claveSinEspacios:
          'Вставьте пароль точно так, как его выдал провайдер: внутренние пробелы сохраняются.',
        borrarClave: 'Удалить пароль',
        borrarClaveTitulo: (n: string) => `Удалить пароль для ${n}?`,
        borrarClaveTexto: 'Сохранённый пароль будет удалён. Провайдер останется в списке.',
        claveBorrada: 'Пароль удалён',
        guardar: 'Сохранить',
        guardado: (n: string) => `${n} сохранён`,
        redLocalTitulo: 'Сервер на этом компьютере или в локальной сети',
        redLocalTexto: (h: string) =>
          `${h} указывает на этот компьютер или локальную сеть. WolfCore Dev подключится к нему только после вашего подтверждения. Это ваш сервер?`,
        redLocalConfirmar: 'Да, это мой сервер',
        cambiaTitulo: 'Отправка пароля на другой сервер',
        cambiaTexto: (h: string) =>
          `У провайдера есть сохранённый пароль, но изменился сервер или пользователь. Пароль будет отправлен на ${h}. Продолжить?`,
        cambiaConfirmar: 'Да, продолжить',
      },
      env: {
        titulo: (n: string) => `Использовать ${n} в проекте`,
        proyecto: 'Проект',
        sinProyectos: 'Проектов пока нет.',
        yaUsaSmtp: 'Этот проект уже отправляет почту через SMTP-провайдера.',
        volverCaptador: 'Вернуться к локальному перехватчику',
        volvio: (n: string) =>
          `${n} снова отправляет почту на локальный перехватчик, но его .env не изменён: в нём остались переменные MAIL_* провайдера (и его пароль, если вы его записывали). Перезапишите блок почты.`,
        incluirClave: 'Также записать пароль в .env',
        incluirClaveAyuda: 'Если не отмечено, блок не содержит MAIL_PASSWORD, и вы добавите его вручную.',
        sinClaveGuardada: 'У провайдера нет сохранённого пароля.',
        vista: 'Изменения в .env (пароль замаскирован)',
        textoPlano:
          'Пароль будет записан в открытом виде в .env проекта. Любой, у кого есть доступ к этой папке или к вашему репозиторию (если вы его опубликуете), сможет его прочитать.',
        claveTitulo: 'Записать пароль в .env',
        claveTexto:
          'Пароль сохраняется в открытом виде в файле .env проекта. Используйте этот вариант, только если проект не публикуется в репозитории и папка доступна только вам.',
        claveConfirmar: 'Понятно, включить пароль',
        agregarGitignore: 'Добавить .env в .gitignore',
        gitignoreTitulo: 'Изменить .gitignore',
        gitignoreTexto:
          'В .gitignore проекта будет добавлена строка .env (с предварительным созданием резервной копии).',
        gitignoreConfirmar: 'Добавить',
        versionadoTitulo: 'Git уже отслеживает .env',
        versionadoTexto:
          'Следующий коммит отправит ваши значения в репозиторий. Уберите файл из индекса командой git rm --cached .env.',
        desconocidoTitulo: 'Не удалось проверить Git',
        desconocidoTexto: 'Не удалось определить, отслеживает ли Git файл .env этого проекта.',
        aceptarVersionado: 'Записать всё равно',
        aceptarTitulo: 'Запись в отслеживаемый .env',
        aceptarTexto:
          'Если Git отслеживает .env, эти переменные могут попасть в репозиторий. Записать всё равно?',
        aceptarConfirmar: 'Записать всё равно',
        confirmarTitulo: 'Записать в .env',
        confirmarTexto: (ruta: string) =>
          `Будет сохранена резервная копия ${ruta}, и добавлены переменные MAIL_* без пароля.`,
        confirmarTextoClave: (ruta: string) =>
          `Будет сохранена резервная копия ${ruta}, и добавлены переменные MAIL_* вместе с паролем в открытом виде.`,
        confirmar: 'Записать',
        escribir: 'Записать в .env',
        escrito: (n: string) => `${n} теперь отправляет почту через этого провайдера`,
      },
    },
    estado: 'Состояние',
    smtp: 'SMTP',
    buzon: 'Веб-почта',
    abrirBuzon: 'Открыть ящик',
    noLeidos: 'Непрочитанные',
    noLeidosValor: (n: number) =>
      plural(n, 'непрочитанное письмо', 'непрочитанных письма', 'непрочитанных писем'),
    noLeidosError: 'Не удалось прочитать почтовый ящик',
    actualizar: 'Пересчитать письма',
    actualizaSolo: 'Обновляется каждые 15 секунд, пока открыт этот экран.',
    env: 'Блок для файла .env в Laravel',
    envAyuda: (captador: string) =>
      `Вставьте его в .env вашего проекта. Почта попадёт в ${captador}, без шифрования и без имени пользователя.`,
    copiarEnv: 'Скопировать блок',
    irAServicios: 'Перейти к службам',
    cargando: 'Загрузка перехватчиков…',
    errorLista: 'Не удалось прочитать список перехватчиков',
    captador: {
      opcional: 'Необязательно',
      elegido: 'Принимает почту ваших проектов',
      noInstalado: 'Не установлено',
      instalar: 'Установить',
      usar: 'Использовать этот',
      apagar: 'Выключить',
      iniciando: 'Запуск…',
      avisoMantenimiento:
        'Этот перехватчик почти не поддерживается. Лучше выберите Mailpit или smtp4dev.',
    },
    notaDescartados:
      'MailHog и MailDev не предлагаются: MailHog не публикует контрольную сумму для проверки загрузки, а MailDev доступен только через npm. Без проверяемой контрольной суммы ничего не загружается.',
    notaHost:
      'Веб-ящики отвечают только на 127.0.0.1, но пока перехватчик включён, вредоносная веб-страница может попытаться прочитать ваш ящик (DNS rebinding). smtp4dev и Papercut отклоняют сторонние заголовки Host; Mailpit обслуживает ящик по секретному пути, уникальному для этого компьютера (WolfCore Dev открывает этот адрес за вас); у Inbucket защиты нет — выключайте его, когда он не используется.',
  },
  ia: {
    descripcion:
      'Облачные провайдеры ИИ и локальные модели через Ollama. Ключи хранятся в зашифрованном виде на этом компьютере и никогда не отображаются.',
    nube: {
      titulo: 'Облачный ИИ',
      agregar: 'Добавить провайдера',
      vacio:
        'Вы ещё не добавили ни одного провайдера. Добавьте OpenAI, Anthropic, Gemini, Hermes (Nous) или совместимого с OpenAI провайдера.',
      errorLista: 'Не удалось прочитать список провайдеров',
    },
    local: { titulo: 'Локальный ИИ (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Совместимый с OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Ключ',
      sinClave: 'Без ключа',
      claveIlegible: 'Сохранён (не удалось прочитать)',
      url: 'Базовый URL',
      modeloPorDefecto: 'Модель по умолчанию',
      ninguno: 'Не выбрана',
      probarConexion: 'Проверить подключение',
      probarConexionAyuda: 'Запрашивает список моделей провайдера. Не расходует токены.',
      probando: 'Проверка…',
      conectado: (ms: number, n: number) =>
        `Подключено · ${ms} мс · ${plural(n, 'модель', 'модели', 'моделей')}`,
      verModelos: (n: number) => `Показать модели (${n})`,
      soloGratuitos: 'Только бесплатные',
      fallo: 'Не удалось подключиться',
      probarMensaje: 'Проверить сообщением',
      probarMensajeAyuda:
        'Отправляет короткое фиксированное сообщение, чтобы проверить ответ модели. Расходует несколько токенов.',
      elegirModelo: 'Модель для сообщения',
      sinModelo: 'Проверьте подключение или задайте модель по умолчанию, чтобы выбрать её.',
      enviando: 'Отправка…',
      respuesta: (ms: number) => `Ответ за ${ms} мс`,
      tokens: (entrada: number, salida: number) =>
        `Входных токенов: ${entrada}, выходных: ${salida}`,
      usar: 'Использовать в проекте',
      editar: 'Изменить',
      borrar: 'Удалить',
      acciones: (nombre: string) => `Действия для ${nombre}`,
    },
    costo: {
      titulo: 'Проверить сообщением',
      texto: (modelo: string, proveedor: string) =>
        `Модели ${modelo} провайдера ${proveedor} будет отправлено короткое фиксированное сообщение. Это расходует токены вашей учётной записи: ответ ограничен 16 токенами и обычно стоит доли цента.`,
      enviar: 'Отправить сообщение',
    },
    dialogo: {
      nuevo: 'Добавить провайдера ИИ',
      editar: (nombre: string) => `Изменить ${nombre}`,
      tipo: 'Тип',
      preset: 'Совместимый провайдер',
      presetAyuda: 'Заполняет название и URL; вы можете их изменить.',
      presetOtro: 'Другой',
      documentacion: 'Открыть документацию',
      nombre: 'Название',
      urlBase: 'Базовый URL',
      urlAyuda: 'Пусто = официальный. Только https:// либо http:// для 127.0.0.1 или [::1] (LM Studio).',
      urlObligatoria: 'Введите базовый URL совместимого провайдера.',
      modelo: 'Модель по умолчанию (необязательно)',
      modeloAyuda: 'Используется в блоке .env (AI_MODEL) и для проверочного сообщения.',
      clave: 'API-ключ',
      claveNueva: 'Вставьте ключ',
      claveGuardada: (final: string) =>
        `Ключ уже сохранён (${final}). Введите другой, только если хотите заменить его.`,
      claveAyuda:
        'Хранится в зашифрованном виде на этом компьютере и больше никогда не отображается. Видны только последние 4 символа.',
      claveOpcional: 'Необязательно для локальных серверов (LM Studio).',
      borrarClave: 'Удалить ключ',
      guardar: 'Сохранить',
      guardado: (nombre: string) => `${nombre} сохранён`,
      urlCambiaTitulo: 'Ключ будет отправляться на другой URL',
      urlCambiaTexto: (url: string) =>
        `У этого провайдера есть сохранённый ключ. Теперь он будет отправляться на ${url}. Подтвердите, только если доверяете этому серверу.`,
      urlCambiaConfirmar: 'Отправлять ключ на новый URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Удалить ключ для ${nombre}?`,
      claveTexto:
        'Ключ будет удалён с этого компьютера. Файлы .env, куда вы его записали, не изменятся: замените его и там, если отзываете ключ.',
      proveedorTitulo: (nombre: string) => `Удалить ${nombre}?`,
      proveedorTexto:
        'Провайдер и его сохранённый ключ будут удалены. Файлы .env ваших проектов останутся нетронутыми.',
      respaldos: (n: number) =>
        `Также удалить резервные копии .env для ${plural(n, 'проекта', 'проектов', 'проектов')}, содержащие этот ключ в открытом виде`,
      respaldosAyuda:
        'WolfCore Dev сохраняет резервные копии .env перед записью за пределами проектов. Их удаление необратимо.',
      claveBorrada: 'Ключ удалён',
      proveedorBorrado: (nombre: string) => `${nombre} удалён`,
      respaldosBorrados: (n: number) =>
        `Удалены резервные копии .env для ${plural(n, 'проекта', 'проектов', 'проектов')}`,
    },
    env: {
      titulo: (nombre: string) => `Использовать ${nombre} в проекте`,
      proyecto: 'Проект',
      sinProyectos: 'Нет подключённых проектов.',
      modelo: 'Модель (AI_MODEL)',
      modeloAyuda: 'Необязательно. Выберите из списка или введите вручную.',
      vista: 'Блок, который будет записан в .env (ключ показан замаскированным)',
      cargando: 'Подготовка предпросмотра…',
      textoPlano:
        'Ключ будет записан в открытом виде в .env проекта. Любой, у кого есть доступ к этой папке, сможет его прочитать.',
      copiaPrevia:
        'Текущий файл .env предварительно копируется за пределы проекта (в папку данных WolfCore Dev).',
      sinClave: 'Этому провайдеру нужен ключ: сохраните его перед использованием в проекте.',
      gitignoreFalta: 'Файл .gitignore проекта не игнорирует .env.',
      gitignoreNoExiste: 'В проекте нет файла .gitignore.',
      gitignoreOk: 'Файл .gitignore уже игнорирует .env.',
      agregarGitignore: 'Добавить .env в .gitignore',
      gitignoreTitulo: 'Изменить .gitignore',
      gitignoreTexto:
        'Строка .env будет добавлена в .gitignore проекта (или будет создан новый файл) с предварительным созданием резервной копии.',
      gitignoreConfirmar: 'Добавить в .gitignore',
      versionadoTitulo: 'Git уже отслеживает .env этого проекта',
      versionadoTexto:
        'Даже если файл указан в .gitignore, следующий коммит отправит ключ в репозиторий. Перед записью уберите его из индекса и сделайте коммит:',
      desconocidoTitulo: 'Не удалось проверить, отслеживает ли Git файл .env',
      desconocidoTexto:
        'Git не ответил (он не установлен или папка не является доверенной). Если .env уже есть в репозитории, следующий коммит отправит ключ. Проверьте командой:',
      aceptarVersionado: 'Понимаю риск: всё равно записать ключ',
      aceptarTitulo: 'Записать, даже если Git может отправить ключ',
      aceptarTexto:
        'Если .env находится в репозитории, ключ попадёт в следующий коммит и в историю. Делайте это, только если вы уже выполнили git rm --cached .env или репозиторий доступен только вам.',
      aceptarConfirmar: 'Принимаю риск',
      conflictoTitulo: 'В .env уже заданы эти переменные с другим значением',
      reemplazar: (claves: string) => `Заменить ${claves}`,
      reemplazarTitulo: 'Заменить переменные в .env',
      reemplazarTexto: (claves: string) =>
        `Существующие строки ${claves} в .env будут удалены и заменены блоком WolfCore Dev. Предыдущий .env предварительно сохраняется в резервную копию.`,
      reemplazarConfirmar: 'Заменить',
      escribir: 'Записать в .env',
      confirmarTitulo: 'Записать ключ в открытом виде',
      confirmarTexto: (carpeta: string) =>
        `Ключ будет записан без шифрования в ${carpeta}. Не передавайте этот файл и не публикуйте его в репозитории.`,
      confirmar: 'Записать ключ',
      escrito: (proyecto: string) => `Блок ИИ записан в .env проекта ${proyecto}`,
      copiarComando: 'Скопировать команду',
    },
  },
  iaLocal: {
    descripcion:
      'Языковые модели, работающие на вашем компьютере через Ollama. Используйте их в своих проектах без отправки данных в интернет.',
    sinInstalarTitulo: 'Ollama не установлена',
    sinInstalar: 'Установите её в разделе «Службы», чтобы скачивать и использовать модели на этом компьютере.',
    irAServicios: 'Перейти к службам',
    apagadoTitulo: 'Ollama выключена',
    apagado: 'Включите её, чтобы просматривать, скачивать и проверять модели.',
    iniciando: 'Ollama запускается…',
    errorTitulo: 'Не удалось запустить Ollama',
    encender: 'Включить Ollama',
    verServicios: 'Открыть в службах',
    modelos: 'Установленные модели',
    sinModelos: 'Моделей пока нет. Скачайте одну ниже.',
    errorModelos: 'Не удалось прочитать список моделей',
    recargar: 'Обновить список',
    total: (n: number) => plural(n, 'модель', 'модели', 'моделей'),
    espacio: 'Занято места',
    espacioAyuda: 'Сколько места занимают все модели в папке данных.',
    probarDe: (modelo: string) => `Проверить ${modelo}`,
    borrarDe: (modelo: string) => `Удалить ${modelo}`,
    borrarTitulo: (modelo: string) => `Удалить модель ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `На диске освободится ${tamano}. Чтобы снова использовать модель, её придётся скачать заново.`,
    borrado: (modelo: string) => `Модель ${modelo} удалена`,
    descargar: {
      titulo: 'Скачать модель',
      campo: 'Название модели',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Введите название из каталога Ollama (ollama.com/library) или выберите вариант из подсказок.',
      sugerenciaAyuda: {
        'llama3.2': 'Общий чат, лёгкая модель',
        'qwen2.5-coder': 'Программирование',
        mistral: 'Общий чат',
        'nomic-embed-text': 'Эмбеддинги для поиска (боты)',
      } as Record<string, string>,
      boton: 'Скачать',
      invalido: 'Используйте буквы, цифры и символы . _ : / - (например, llama3.2)',
      yaInstalado: 'Эта модель уже установлена',
      enCurso: 'Эта модель уже скачивается',
      confirmarTitulo: (modelo: string) => `Скачать ${modelo}?`,
      confirmarTexto:
        'Модели обычно занимают несколько ГБ (от 1 до более 40 ГБ в зависимости от размера). Ollama не сообщает размер до начала загрузки: вы увидите его на индикаторе прогресса и сможете отменить загрузку в любой момент.',
      confirmar: 'Скачать',
    },
    progreso: {
      fases: {
        preparando: 'Подготовка…',
        descargando: 'Загрузка',
        verificando: 'Проверка',
        guardando: 'Сохранение',
        listo: 'Готово',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} из ${total}`,
      cancelarDe: (modelo: string) => `Отменить загрузку ${modelo}`,
      cancelando: 'Отмена…',
      listo: (modelo: string) => `Модель ${modelo} загружена`,
      cancelado: (modelo: string) => `Загрузка ${modelo} отменена`,
      error: (modelo: string) => `Не удалось загрузить ${modelo}`,
      descartar: 'Скрыть',
      descartarDe: (modelo: string) => `Скрыть уведомление о ${modelo}`,
    },
    prueba: {
      titulo: 'Проверить модель',
      modelo: 'Модель',
      elegir: 'Выберите модель',
      prompt: 'Сообщение',
      placeholder: 'Введите короткий вопрос и нажмите Enter',
      enviar: 'Отправить',
      respuesta: 'Ответ',
      pensando: 'Модель отвечает… в первый раз это может занять больше времени, пока она загружается.',
      vacia: '(Модель не вернула текст.)',
      sinModelos: 'Скачайте модель, чтобы проверить её.',
    },
    conexion: {
      titulo: 'Подключение из ваших проектов',
      base: 'Базовый URL Ollama',
      openai: 'Конечная точка, совместимая с OpenAI',
      env: 'Блок для файла .env',
      envAyuda:
        'Подходит для Laravel или бота на FastAPI. WolfCore Dev не изменяет файлы ваших проектов.',
      copiarEnv: 'Скопировать блок',
      copiarDato: (dato: string) => `Скопировать ${dato}`,
    },
    etapaB:
      'Hermes Agent, Claude Code и Codex смогут подключаться к этим моделям в один клик на этапе B.',
  },
  proyectos: {
    titulo: 'Проекты',
    descripcion:
      'Каждый проект — это папка со своим сайтом .test, сценарием настройки и процессами.',
    agregar: 'Добавить проект',
    vacioTitulo: 'Проектов пока нет',
    vacio:
      'Клонируйте репозиторий с GitHub или выберите папку: WolfCore Dev определит тип проекта и настроит его шаг за шагом.',
    pasos: {
      porTipo: {
        'composer-install': 'Установить зависимости PHP (composer install)',
        'env-crear': 'Создать файл .env',
        'key-generate': 'Сгенерировать ключ приложения',
        'bd-crear': 'Создать базу данных',
        'bd-restaurar': 'Восстановить резервную копию',
        migrar: 'Выполнить миграции базы данных',
        'storage-link': 'Связать storage (storage:link)',
        'npm-ci': 'Установить зависимости Node (npm ci)',
        'npm-build': 'Собрать ресурсы (npm run build)',
        'python-venv': 'Создать виртуальное окружение (.venv)',
        'pip-install': 'Установить зависимости Python (pip)',
        'pgvector-activar': 'Включить pgvector в базе данных',
        'sitio-crear': 'Создать сайт',
        comando: 'Команда проекта',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Создать сайт ${dominio}` : 'Создать сайт'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Восстановить резервную копию ${archivo}` : 'Восстановить резервную копию',
      migrar: 'Выполнить миграции базы данных',
      migrarSemilla: 'Выполнить миграции базы данных и загрузить тестовые данные (--seed)',
      comando: (linea: string) => (linea ? `Выполнить: ${linea}` : 'Команда проекта'),
    },
    estadoPaso: {
      pendiente: 'Ожидание',
      corriendo: 'Выполняется',
      listo: 'Готово',
      error: 'Ошибка',
      omitido: 'Пропущено',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Не подготовлен',
      corriendo: 'Подготовка…',
      lista: 'Готов',
      error: 'Ошибка на одном из шагов',
      cancelada: 'Подготовка отменена',
      incompleta: 'Подготовка не завершена',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Добавить проект',
      pestanas: { github: 'GitHub', url: 'URL Git', carpeta: 'Папка' },
      destino: 'Папка назначения',
      destinoAyuda: (base: string) =>
        `Клонируется в ${base}. Для другого расположения нажмите «Выбрать папку…».`,
      nombreCarpeta: 'Имя папки',
      nombrePlaceholder: 'moy-proekt',
      elegirDestino: 'Выбрать папку…',
      destinoPorDefecto: 'Использовать папку проектов',
      clonar: 'Клонировать',
      clonando: 'Клонирование…',
      clonado: 'Репозиторий клонирован',
      errorClonar: 'Не удалось клонировать репозиторий',
      sinCancelar:
        'Клонирование нельзя прервать отсюда: дождитесь его завершения (это может занять несколько минут).',
      sinGit: 'Git не установлен. Установите его (git-scm.com) и снова откройте это окно.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Подключено через GitHub CLI как ${usuario}` : 'Подключено через GitHub CLI',
      estadoToken: 'Подключено с персональным токеном',
      estadoNinguna: 'Нет подключения к GitHub',
      ayudaNinguna:
        'Войдите через GitHub CLI (рекомендуется) или используйте детальный персональный токен с правом чтения содержимого.',
      instalarGh: 'Установить GitHub CLI',
      instalandoGh: 'Установка GitHub CLI…',
      ghInstalado: 'GitHub CLI установлен. Теперь выполните вход.',
      iniciarSesion: 'Войти',
      sesionAbierta:
        'Открыто окно для входа. Когда закончите, нажмите «Проверить снова».',
      comprobar: 'Проверить снова',
      usarToken: 'Использовать токен',
      token: 'Персональный токен GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'Хранится в зашифрованном виде на этом компьютере, никогда больше не показывается и не записывается в проекты.',
      guardarToken: 'Сохранить токен',
      tokenGuardado: 'Токен сохранён',
      quitarToken: 'Удалить токен',
      tokenQuitado: 'Токен удалён',
      buscar: 'Поиск репозиториев',
      cargando: 'Загрузка репозиториев…',
      sinRepos: 'Репозитории не найдены.',
      cargarMas: 'Загрузить ещё',
      privado: 'Приватный',
      yaClonado: 'Уже клонирован',
      yaClonadoAyuda: 'Проект с этим репозиторием или в этой целевой папке уже существует.',
      actualizado: (fecha: string) => `Обновлено ${fecha}`,
      elegir: 'Выбрать',
      errorRepos: 'Не удалось прочитать список репозиториев',
    },
    url: {
      etiqueta: 'URL репозитория',
      placeholder: 'https://github.com/usuario/proyecto.git',
      ayuda:
        'https://…, git@host:ruta или usuario/proyecto (GitHub). Без логина и пароля в URL.',
      invalida: 'Используйте https://…, git@host:ruta или usuario/proyecto',
    },
    carpeta: {
      titulo: 'Проект уже есть на компьютере',
      texto: 'Выберите папку: тип проекта определится автоматически и будет предложен рецепт.',
      elegir: 'Выбрать папку',
      manual: 'Добавить без рецепта (ручная настройка)',
      yaEsProyecto: (nombre: string) => `Эта папка уже является проектом ${nombre}.`,
      vigilarTitulo: 'Отслеживаемая папка',
      vigilarTexto:
        'WolfCore Dev уведомляет, когда появляется новая папка, похожая на проект. Сюда же клонируются репозитории.',
      vigilando: (carpeta: string) => `Отслеживается ${carpeta}`,
      sinVigilar: 'Ни одна папка не отслеживается.',
      vigilar: 'Выбрать папку для отслеживания',
      cambiarVigilada: 'Изменить',
      dejarDeVigilar: 'Прекратить отслеживание',
    },
    asistente: {
      titulo: (nombre: string) => `Подготовка ${nombre}`,
      cargando: 'Анализ проекта…',
      origenYml: 'Рецепт взят из wolfcore.yml репозитория.',
      origenDefecto: 'Рецепт предложен по типу проекта.',
      deteccion: 'Что обнаружено',
      deteccionAyuda: 'Исправьте, если что-то не совпадает с проектом.',
      tipo: 'Тип',
      php: 'PHP',
      phpNinguno: 'Не установлено',
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
      versionAuto: 'Определять автоматически',
      servicios: 'Службы',
      serviciosNinguno: 'Нет',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Обнаружено: ${v}`,
      nodeInstalar: 'Node не установлен: установите его в разделе Службы.',
      pythonInstalar: 'Python не установлен: установите его в разделе Службы.',
      lenguajeInstalar: (nombre: string) => `${nombre} не установлен: установите его в разделе Службы.`,
      dominio: 'Домен',
      puertoProxy: 'Локальный порт',
      puertoPlaceholder: '8000',
      receta: 'Шаги',
      recetaAyuda:
        'Выполняются по порядку. Отключите ненужные; необязательные можно переставлять.',
      subir: 'Выше',
      bajar: 'Ниже',
      fijo: 'Этот шаг обязателен',
      restaurar: 'Восстановить резервную копию…',
      cambiarRespaldo: 'Изменить копию',
      quitarRespaldo: 'Убрать копию',
      sobrescribir: 'Перезаписать базу, если в ней уже есть таблицы',
      semilla: 'Загрузить тестовые данные (--seed)',
      sinMotor:
        'Нет базы данных: выберите СУБД в разделе Службы, чтобы создать или восстановить копию.',
      confio: 'Я доверяю этому репозиторию: выполнить шаги установки',
      confioAyuda:
        'Шаги запускают программы проекта (composer, npm, pip, миграции) на вашем компьютере. Отмечайте только если знаете код.',
      montar: 'Развернуть проект',
      montando: 'Развёртывание проекта…',
      reintentar: 'Повторить',
      omitir: 'Пропустить',
      cancelar: 'Отмена',
      cancelando: 'Отмена…',
      cerrar: 'Закрыть',
      cerrarCorriendo: 'Скрыть (продолжит в фоне)',
      abrirSitio: 'Открыть сайт',
      verRegistro: 'Показать журнал',
      ocultarRegistro: 'Скрыть журнал',
      listo: 'Проект готов.',
      fallo: (paso: string) => `Сбой: ${paso}. Повторите, пропустите или отмените; ничего не откатывалось.`,
      cancelada: 'Подготовка отменена. Вы можете продолжить её с карточки проекта.',
      incompleta: 'Остались невыполненные шаги.',
      errorCrear: 'Не удалось создать проект',
      errorReceta: 'Не удалось прочитать рецепт',
      recetaCambio:
        'Рецепт проекта (wolfcore.yml) изменился с момента подтверждения доверия. Повтор использует прошлый сохранённый рецепт.',
      recargar: 'Проверить новый рецепт',
      seguirGuardada: 'Продолжить со старым',
      soloLectura:
        'Тип, PHP, домен, версии и порт принадлежат проекту: измените их через «Изменить».',
    },
    tarjeta: {
      receta: 'Подготовка',
      reinstalar: 'Переустановить зависимости',
      reinstalarTitulo: (nombre: string) => `Выполнить рецепт для ${nombre}?`,
      reinstalarTexto:
        'Будут повторены шаги последней подготовки (которые вы проверили в мастере):',
      noRestaura: 'повторно не восстанавливается',
      recetaCambio:
        'Рецепт проекта (wolfcore.yml) изменился с момента подтверждения доверия. Переустановка повторит сохранённый; используйте «Проверить рецепт» для нового.',
      revisarReceta: 'Проверить рецепт',
      preparar: 'Подготовить…',
      ejecutar: 'Выполнить',
      verPreparacion: 'Показать подготовку',
      sinConfianza:
        'Проверьте рецепт и отметьте «Я доверяю этому репозиторию» в мастере, чтобы выполнить его.',
      runtimes: 'Уведомления о версиях',
      verRegistros: 'Показать журналы',
      abrirAgente: 'Открыть ИИ-агента',
      vscode: 'Редактор',
      vscodeAyuda: 'Открыть папку проекта в редакторе по умолчанию',
      vscodeError: 'Не удалось открыть редактор',
      baseDatos: 'База данных',
      baseDatosAyuda: (base: string) =>
        `Открыть базу «${base}» сразу с входом (Adminer или phpMyAdmin)`,
      baseDatosSinDetectar: 'Открыть базу данных проекта (Adminer или phpMyAdmin)',
      sinBase: 'В .env проекта не указана база MySQL, MariaDB или PostgreSQL.',
      adminerNoListo: 'Adminer не готов',
      entradaAutomatica: 'Открывается сразу с авторизацией, без ввода пароля.',
      elegirBd: 'Выбрать Adminer или phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (только MySQL и MariaDB)',
      phpMyAdminNoListo: 'phpMyAdmin не готов',
      entroComoAdmin: (usuario: string) =>
        `Вход выполнен как администратор сервера ${usuario}, так как у этого проекта нет собственного пользователя. В менеджере .env кнопка «Использовать своего пользователя» создаст пользователя только для этой базы.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Вход выполнен как администратор сервера ${usuario}: пароль собственного пользователя этого проекта не сохранён на этом компьютере. В менеджере .env кнопка «Использовать своего пользователя» создаст новый.`,
      abrirSitio: 'Открыть сайт в браузере',
      github: 'Репозиторий',
      abrirRemoto: (url: string) => `Открыть ${url}`,
      confiado: 'Доверенный',
      confiadoAyuda: 'Шаги установки разрешено выполнять.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'Отсоединённый HEAD',
      cambios: (n: number) =>
        plural(n, 'несохранённое изменение', 'несохранённых изменения', 'несохранённых изменений'),
      limpio: 'Нет изменений',
      atras: (n: number) => `${n} для получения`,
      adelante: (n: number) => `${n} для отправки`,
      traer: 'Получить изменения',
      traerAyuda: 'git pull без слияния: при локальных изменениях или расхождении веток ничего не трогает.',
      alDia: 'Уже актуально.',
      actualizado: 'Изменения получены',
      sugeridosTitulo: 'Изменения получены',
      sugeridosTexto: 'С учётом изменений рекомендуется выполнить эти шаги:',
      sugeridosNinguno: 'Выполнять дополнительные шаги не нужно.',
      migracionesNuevas: (n: number) =>
        plural(n, 'новая миграция', 'новые миграции', 'новых миграций'),
      ejecutarSugeridos: 'Выполнить шаги',
      corridaTitulo: 'Шаги после получения изменений',
      corridaAyuda: 'Не изменяет сохранённый рецепт проекта.',
      ahoraNo: 'Не сейчас',
      errorEstado: 'Не удалось прочитать статус Git',
      commitIa: {
        boton: 'Предложить коммит',
        ayuda:
          'Предлагает с помощью ИИ сообщение для индексированных изменений (git add) и делает коммит при вашем согласии.',
        titulo: 'Коммит с предложенным сообщением',
        proveedor: 'Провайдер ИИ',
        modelo: 'Модель',
        sinProveedores:
          'Настройте облачного провайдера ИИ (экран ИИ), чтобы предлагать сообщения.',
        privacidad:
          'Провайдеру отправляется diff индексированных изменений без .env, ключей, сертификатов, файлов учётных данных и бинарных файлов, максимум 20 000 символов. Расходует мало токенов.',
        sugerir: 'Предложить сообщение',
        mensaje: 'Сообщение (можно изменить)',
        commit: 'Сделать коммит',
        commitAyuda: 'Только индексированное (git add): не добавляет файлы и не делает push.',
        hecho: 'Коммит создан из индексированных изменений.',
      },
    },
    procesos: {
      titulo: 'Процессы',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Завершён без ошибок',
      ninguno: 'Нет процессов. Добавьте npm run dev, queue:work, uvicorn…',
      agregar: 'Добавить процесс',
      editar: 'Изменить процесс',
      nuevo: 'Новый процесс',
      interruptor: (nombre: string) => `Запустить или остановить ${nombre}`,
      proxy: 'Прокси',
      proxyAyuda: 'Nginx направляет сайт на этот процесс.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'перезапуск', 'перезапуска', 'перезапусков'),
      verLog: 'Показать лог',
      ocultarLog: 'Скрыть лог',
      logVacio: 'Вывода пока нет.',
      abrirCarpetaLog: 'Открыть папку логов',
      quitar: 'Убрать процесс',
      quitarTitulo: (nombre: string) => `Убрать процесс ${nombre}?`,
      quitarTexto: 'Если он запущен, он будет остановлен.',
      nombre: 'Имя',
      nombrePlaceholder: 'Vite',
      comando: 'Команда',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Программа и аргументы без оболочки. Используйте кавычки для аргументов с пробелами.',
      cwd: 'Папка',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz или подпапка проекта (например, frontend).',
      puertoCampo: 'Порт',
      puertoNinguno: 'Нет',
      puertoAyuda: 'Только справочно, если процесс не является целью прокси.',
      autoIniciar: 'Запускать при старте WolfCore Dev',
      reiniciar: 'Перезапускать при сбое',
      esProxy: 'Цель прокси Nginx',
      requiereReinicio:
        'Процесс запущен: изменения команды, папки или порта применятся после перезапуска.',
      reinicieAhora: 'Сохранено. Остановите и снова запустите процесс для применения изменений.',
      guardado: 'Процесс сохранён',
      errores: {
        comando: 'Введите команду',
        puerto: 'Порт должен быть от 1 до 65535',
        proxySinPuerto: 'Для цели прокси нужен порт',
        cwd: 'Укажите raiz или подпапку внутри проекта',
        repetido: 'Процесс с таким именем уже существует',
      },
      estados: {
        encendido: 'Запущен',
        apagado: 'Остановлен',
        iniciando: 'Запуск…',
        error: 'Ошибка',
        externo: 'Внешний',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Журналы ${nombre}`,
      fuente: 'Источник',
      ninguna: 'У этого проекта ещё нет журналов.',
      vacio: 'Журнал пуст.',
      actualizar: 'Обновить',
      abrirCarpeta: 'Открыть папку',
    },
    sugerencias: {
      titulo: (n: number) =>
        `${plural(n, 'новая папка похожа на проект', 'новые папки похожи на проекты', 'новых папок похожи на проекты')}`,
      montar: 'Подготовить',
      ignorar: 'Игнорировать',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'Непрочитанные письма',
    correoApagado: 'Mailpit остановлен',
    correoSinInstalar: 'Mailpit не установлен',
    modelos: 'Модели ИИ',
    iaApagada: 'Ollama остановлена',
    iaSinInstalar: 'Ollama не установлена',
    sinLeer: 'Не удалось прочитать',
    sinDato: '—',
  },
  /* ───────────── Panel de rendimiento, visor de registros y MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/с',
    porcentaje: '%',
    segundos: 'с',
    minutos: 'мин',
    horas: 'ч',
    dias: 'д',
    /** Trabajador N de un servicio (p. ej. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Производительность',
    ventana: 'Последние 5 минут',
    pausado: 'На паузе, пока окно скрыто',
    esperando: 'Ожидание первого замера…',
    errorMuestreo: (detalle: string) => `Не удалось запросить замер производительности: ${detalle}`,
    cpu: 'CPU',
    ram: 'Память',
    disco: 'Диск данных',
    red: 'Сеть',
    deTotal: (usado: string, total: string) => `${usado} из ${total}`,
    libre: (libre: string) => `${libre} свободно`,
    bajada: 'Приём',
    subida: 'Отдача',
    graficaCpu: (valor: string) => `График CPU за последние 5 минут; сейчас ${valor}`,
    graficaRam: (valor: string) => `График памяти за последние 5 минут; сейчас ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `График сети за последние 5 минут; приём ${bajada}, отдача ${subida}`,
    alertas: {
      titulo: 'Предупреждения',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `Порт ${puerto} службы ${servicio} занят другой программой: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `Память компьютера занята на ${porcentaje} %. Остановите неиспользуемое для лучшей отзывчивости.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Обнаружен сторонний php-cgi (PID ${pid}), слушающий ${puertos.join(', ')}: остался от предыдущего сеанса.`,
      finalizar: 'Завершить процесс',
      finalizarTitulo: 'Завершить этот процесс?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) будет закрыт без сохранения открытых данных. Используйте только если уверены, что программа не нужна.`,
      finalizado: (nombre: string) => `${nombre} завершён`,
      verPuertos: 'Показать порты',
      errorPuertos: 'Не удалось проверить, какие программы используют порты.',
    },
    procesos: {
      titulo: 'Службы и процессы',
      vacio: 'Нет запущенных служб или процессов проектов.',
      nombre: 'Имя',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Порт',
      encendido: 'Запущено',
      acciones: 'Действия',
      detener: 'Остановить',
      registros: 'Журналы',
      servicio: 'Служба',
      proyecto: 'Проект',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Журналы',
    descripcion:
      'Отслеживайте в реальном времени журналы Nginx, PHP, служб, сайтов, процессов проектов и туннелей.',
    fuente: 'Источник',
    elegirFuente: 'Выберите журнал',
    sinFuentes:
      'Журналов пока нет. Они появятся, как только служба, сайт или процесс запишет первую строку.',
    buscar: 'Фильтр по тексту',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Пауза',
    reanudar: 'Продолжить',
    pausadoNuevas: (n: number) =>
      plural(n, 'новая строка на паузе', 'новые строки на паузе', 'новых строк на паузе'),
    copiar: 'Копировать видимое',
    copiadas: (n: number) =>
      plural(n, 'строка скопирована', 'строки скопированы', 'строк скопировано'),
    limpiar: 'Очистить',
    abrirCarpeta: 'Открыть папку',
    alFinal: 'Следить за концом',
    mostrarMas: 'Показать ещё',
    ocultas: (n: number) =>
      plural(n, 'предыдущая строка скрыта', 'предыдущие строки скрыты', 'предыдущих строк скрыто'),
    vacio: 'Строк пока нет. Новые появятся здесь сразу после записи.',
    sinCoincidencias: 'Ни одна строка не соответствует фильтру.',
    cuenta: (visibles: number, total: number) =>
      visibles === total
        ? plural(total, 'строка', 'строки', 'строк')
        : `${visibles} из ${plural(total, 'строки', 'строк', 'строк')}`,
    descartadas: (n: number) => `(хранятся последние 5000; более старых отброшено: ${n})`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Службы',
      sitio: 'Сайты',
      laravel: 'Laravel',
      proyecto: 'Процессы проектов',
      tunel: 'Туннели',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (доступ)',
      nginxError: 'Nginx (ошибки)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (доступ)`,
      sitioError: (dominio: string) => `${dominio} (ошибки)`,
      tunel: (sitio: string) => `Туннель ${sitio}`,
      tunelSalida: (sitio: string) => `Туннель ${sitio} (вывод)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Откройте новый терминал, чтобы увидеть изменения: уже открытые терминалы их не увидят.',
    enPathSinCliente: 'В PATH, но команда отсутствует',
    reparar: 'Восстановить',
    repararTitulo: 'Восстановить команду wolf?',
    repararTexto:
      'wolf есть в PATH, но его файлы неполны. Они будут снова скопированы в папку данных, а локальный сервер запущен.',
    titulo: 'Терминал: команда wolf',
    descripcion:
      'Управляйте WolfCore Dev из PowerShell, cmd или Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Работает только при открытом приложении.',
    activo: 'Доступна в PATH',
    enPathSinServidor: 'В PATH, сервер остановлен',
    inactivo: 'Не в PATH',
    agregarBoton: 'Добавить wolf в PATH',
    quitarBoton: 'Убрать wolf из PATH',
    agregarTitulo: 'Добавить wolf в PATH пользователя?',
    agregarTexto:
      'Команда wolf будет скопирована в папку данных WolfCore Dev, эта папка добавится в PATH вашего пользователя (сохранится копия прежнего PATH), и запустится локальный сервер на 127.0.0.1, принимающий wolf только с ключом, меняющимся при каждом запуске. Публикация сайта в интернете или смена PHP во всех терминалах всегда дополнительно подтверждается в окне приложения. Вы можете убрать команду в любой момент.',
    agregar: 'Добавить',
    quitarTitulo: 'Убрать wolf из PATH?',
    quitarTexto:
      'Папка wolf будет удалена из PATH вашего пользователя, локальный сервер остановлен, а скопированная команда удалена. Открытые терминалы не изменятся.',
    quitar: 'Убрать',
    listoTitulo: 'Команда wolf обновлена',
    ayuda: 'Откройте новый терминал после добавления. Сервер слушает только 127.0.0.1.',
    aislado: 'С тестовой папкой данных (WOLFCORE_DATOS) PATH не изменяется.',
    errorCargar: (detalle: string) => `Не удалось прочитать статус wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP-сервер',
    descripcion:
      'Позволяет Claude Code и другим ассистентам управлять вашими сайтами, службами и базами на этом компьютере. Слушает только 127.0.0.1 и требует токен.',
    estado: 'Состояние',
    activo: 'Активен',
    inactivo: 'Остановлен',
    activar: 'Включить',
    detener: 'Остановить',
    activado: 'MCP-сервер включён',
    detenido: 'MCP-сервер остановлен',
    direccion: 'Адрес',
    puerto: 'Порт',
    puertoAyuda: 'От 1024 до 65535. Если активен, перезапустится на новом порту.',
    puertoRango: 'Используйте число от 1024 до 65535',
    puertoGuardado: (p: number) => `MCP-сервер будет использовать порт ${p}`,
    copiarConfig: 'Копировать конфигурацию для Claude Code',
    copiarConfigAyuda:
      'Копирует конфигурацию с токеном в буфер обмена. Вставьте её в Claude Code; токен здесь не показывается.',
    configCopiada: 'Конфигурация скопирована в буфер обмена',
    regenerar: 'Пересоздать токен',
    regenerarTitulo: 'Пересоздать токен MCP-сервера?',
    regenerarTexto:
      'Текущий токен сразу перестанет действовать: подключённым ассистентам понадобится новая конфигурация.',
    regenerado: 'Токен пересоздан. Скопируйте конфигурацию заново.',
    errorCargar: (detalle: string) => `Не удалось прочитать состояние MCP-сервера: ${detalle}`,
    confirmacion: {
      titulo: 'Ассистент запрашивает подтверждение',
      herramienta: 'Инструмент',
      pendientes: (actual: number, total: number) => `${actual} из ${total}`,
      aprobar: 'Одобрить',
      rechazar: 'Отклонить',
      aprobada: 'Действие одобрено',
      rechazada: 'Действие отклонено',
      vencida: 'Запрос уже не ожидает подтверждения.',
      descartadas: (n: number) =>
        `и ещё ${plural(n, 'запрос не поместился (истечёт сам)', 'запроса не поместились (истекут сами)', 'запросов не поместились (истекут сами)')}`,
      falloRespuesta: (detalle: string) =>
        `Не удалось отправить ответ; запрос всё ещё ожидает. ${detalle}`,
      si: 'Да',
      no: 'Нет',
      campos: {
        motor: 'СУБД',
        base: 'База данных',
        archivo: 'Файл',
        sobrescribir: 'Перезаписать',
        pid: 'PID',
        nombre: 'Процесс',
        proyecto: 'Проект',
        pasos: 'Шаги',
        cantidad: 'Дампы',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: 'Утилиты на каждый день. Работают офлайн и без внешних сервисов.',
    buscar: 'Поиск инструмента…',
    sinResultados: 'Ни один инструмент не соответствует поиску.',
    abrir: 'Открыть',
    procesar: 'Обработка…',
    copiar: 'Копировать',
    copiado: 'Скопировано в буфер обмена',
    limpiar: 'Очистить',
    pendienteApi: 'Ожидается: ядро пока не предоставляет эти данные интерфейсу.',
    lista: {
      qr: { nombre: 'Генератор QR', descripcion: 'Из текста или ссылки туннеля; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Форматирование, проверка и минификация с деревом.' },
      regex: {
        nombre: 'Регулярные выражения',
        descripcion: 'Проверка совпадений, групп и краткая справка.',
      },
      diff: {
        nombre: 'Сравнение текстов',
        descripcion: 'Отличия рядом, включая файлы.',
      },
      tiempo: { nombre: 'Время', descripcion: 'Timestamp ↔ дата с часовым поясом.' },
      puertos: {
        nombre: 'Порты и процессы',
        descripcion: 'Что слушает каждый порт, и завершение процессов.',
      },
      bom: { nombre: 'Очистка BOM UTF-8', descripcion: 'Удаляет BOM из файлов или папок.' },
      certificados: {
        nombre: 'Сертификаты',
        descripcion: 'Выпуск через CA WolfCore Dev для любых имён.',
      },
      cripto: {
        nombre: 'Крипто',
        descripcion: 'Хэш, Base64, URL, UUID, пароли и JWT.',
      },
      markdown: { nombre: 'Предпросмотр Markdown', descripcion: 'Пишите и сразу смотрите результат.' },
      entorno: { nombre: 'Среда системы', descripcion: 'PATH, версии и переменные.' },
      buscar: {
        nombre: 'Поиск',
        descripcion: 'Текст в именах и содержимом проекта, папки или файла.',
      },
      infoArchivo: {
        nombre: 'Сведения о файле',
        descripcion: 'Размер, тип и хэши файла.',
      },
      websocket: { nombre: 'Клиент WebSocket', descripcion: 'Подключение, отправка и просмотр сообщений.' },
      contrasenas: {
        nombre: 'Пароли',
        descripcion: 'Оценка надёжности пароля и поиск слабых учётных записей в базах.',
      },
      qrWifi: {
        nombre: 'QR для Wi-Fi',
        descripcion: 'QR-код для подключения других устройств к вашей сети.',
      },
      imagenes: {
        nombre: 'Изображения',
        descripcion: 'Конвертация в ICO или PNG и сжатие JPEG или WebP.',
      },
      comprimir: {
        nombre: 'ZIP и PDF',
        descripcion: 'Архивация файлов и папок в ZIP и оптимизация PDF.',
      },
      conversor: {
        nombre: 'Конвертер документов',
        descripcion: 'Конвертация Word, Excel, PDF, CSV и Markdown локально на этом компьютере.',
      },
    },
    errores: {
      jsonVacio: 'Введите или вставьте JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `Недопустимый JSON: проверьте строку ${linea}, столбец ${columna}.`,
      banderas: 'Недопустимые флаги: используйте только d, g, i, m, s, u, v или y без повторов.',
      regex: (detalle: string) => `Недопустимое выражение (${detalle}).`,
      trabajador: 'Не удалось выполнить операцию в фоновом потоке.',
      diffLento: 'Тексты слишком сильно различаются для своевременного сравнения.',
      base64: 'Недопустимый Base64.',
      utf8: 'Декодированное содержимое не является текстом UTF-8.',
      url: 'Недопустимая последовательность URL.',
      coste: (max: number) => `Стоимость bcrypt должна быть от 4 до ${max}.`,
      jwtPartes: 'JWT должен состоять из трёх частей, разделённых точкой.',
      jwtCabecera: 'Не удалось прочитать заголовок JWT.',
      jwtCarga: 'Не удалось прочитать полезную нагрузку JWT.',
      longitud: 'Длина должна быть от 4 до 256.',
      sinConjuntos: 'Выберите хотя бы один тип символов.',
      sinDominios: 'Введите хотя бы одно имя или IP-адрес.',
      muchosDominios: (max: number) => `Максимум ${max} ${plural(max, 'имя', 'имени', 'имён')} на сертификат.`,
    },
    qr: {
      texto: 'Текст или URL',
      textoAyuda: 'QR-код создаётся на этом компьютере; ничего не отправляется в сеть.',
      tunel: 'Ссылка туннеля проекта',
      sinTuneles: 'Нет активных туннелей',
      descargar: 'Скачать PNG',
      vacio: 'Введите текст, чтобы создать код.',
      largo: 'Текст слишком длинный для QR-кода.',
      descargado: 'Загрузка начата.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Форматировать',
      minificar: 'Минифицировать',
      validar: 'Проверить',
      valido: 'Корректный JSON.',
      resultado: 'Результат',
      arbol: 'Дерево',
      mas: (n: number) => `… ещё ${n}`,
    },
    regex: {
      patron: 'Шаблон',
      banderas: 'Флаги',
      texto: 'Проверочный текст',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${plural(n, 'совпадение', 'совпадения', 'совпадений')}${truncado ? ' (показаны первые)' : ''}`,
      sinCoincidencias: 'Совпадений нет.',
      tiempo: 'Выражение выполнялось слишком долго и было остановлено (возможен катастрофический возврат).',
      grupo: (n: number) => `Группа ${n}`,
      referencia: 'Краткая справка',
      tabla: [
        ['.', 'Любой символ (кроме переноса строки без s)'],
        ['\\d \\w \\s', 'Цифра, буква/цифра/_ и пробельный символ'],
        ['\\D \\W \\S', 'Противоположное предыдущему'],
        ['[abc] [^abc]', 'Один из списка / ни один из списка'],
        ['^ $', 'Начало и конец (строки при флаге m)'],
        ['\\b', 'Граница слова'],
        ['* + ?', 'Ноль или более, один или более, необязательно'],
        ['{n,m}', 'От n до m повторений'],
        ['*? +?', 'Ленивая версия'],
        ['(…) (?<nombre>…)', 'Захватывающая и именованная группа'],
        ['(?:…)', 'Незахватывающая группа'],
        ['(?=…) (?!…)', 'За которым следует / не следует'],
        ['a|b', 'Альтернатива'],
        ['g i m s u y', 'Глобальный, без учёта регистра, многострочный, точка включает перенос, Unicode, привязка к позиции'],
      ] as [string, string][],
    },
    diff: {
      original: 'Исходный',
      modificado: 'Изменённый',
      cargarArchivo: 'Загрузить файл',
      comparar: 'Сравнить',
      resumen: (mas: number, menos: number) => `Строк: +${mas} · −${menos}`,
      iguales: 'Тексты совпадают.',
      archivoGrande: 'Размер файла превышает 5 МБ; выберите файл поменьше.',
      textoGrande: 'Максимальный размер каждого текста — 5 МБ.',
      truncado: (mostradas: number, total: number) =>
        `Показаны первые ${mostradas} из ${total} ${plural(total, 'строки', 'строк', 'строк')}.`,
    },
    tiempo: {
      timestamp: 'Timestamp (секунды или миллисекунды)',
      fecha: 'Дата (ГГГГ-ММ-ДД ЧЧ:мм:сс)',
      zona: 'Часовой пояс',
      ahora: 'Сейчас',
      segundos: 'Секунды',
      milisegundos: 'Миллисекунды',
      iso: 'ISO 8601 (UTC)',
      enZona: 'В выбранном поясе',
      desplazamiento: 'Смещение',
      relativo: 'Относительно',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Распознано в секундах' : 'Распознано в миллисекундах',
      timestampInvalido: 'Введите только цифры (допускается знак).',
      fechaInvalida: 'Используйте формат ГГГГ-ММ-ДД ЧЧ:мм[:сс] с корректной датой.',
      zonaInvalida: 'Неизвестный часовой пояс.',
    },
    puertos: {
      filtro: 'Фильтр по порту, PID или имени',
      actualizar: 'Обновить',
      columnas: {
        puerto: 'Порт',
        protocolo: 'Протокол',
        proceso: 'Процесс',
        pid: 'PID',
        direcciones: 'Адреса',
        acciones: 'Действия',
      },
      propio: 'WolfCore Dev',
      sistema: 'Система',
      finalizar: 'Завершить',
      noFinalizable: 'Системные процессы и процессы WolfCore Dev нельзя завершать отсюда.',
      confirmarTitulo: 'Завершить процесс',
      confirmarTexto: (nombre: string, pid: number) =>
        `Процесс "${nombre}" (PID ${pid}) будет завершён без сохранения. Для подтверждения введите имя процесса:`,
      finalizado: (nombre: string) => `Процесс ${nombre} завершён.`,
      vacio: 'Нет занятых портов или не удалось их прочитать.',
    },
    bom: {
      explicacion:
        'Сначала показывается, в каких файлах есть BOM; при очистке для каждого сохраняется резервная копия .bak-bom. Каталоги node_modules, vendor, .git и двоичные файлы пропускаются.',
      elegirArchivos: 'Выбрать файлы',
      elegirCarpeta: 'Выбрать папку',
      seleccion: (n: number) => `Выбрано: ${n} ${plural(n, 'путь', 'пути', 'путей')}`,
      analizar: 'Анализировать',
      limpiar: 'Удалить BOM',
      confirmar: (n: number) =>
        `BOM будет удалён из ${n} ${plural(n, 'файла', 'файлов', 'файлов')} (с резервной копией). Продолжить?`,
      conBom: (n: number) => `${n} ${plural(n, 'файл', 'файла', 'файлов')} с BOM`,
      sinBom: 'Ни в одном файле нет BOM.',
      limpiados: (n: number) =>
        `${plural(n, 'Очищен', 'Очищено', 'Очищено')} ${n} ${plural(n, 'файл', 'файла', 'файлов')}.`,
      copia: 'Резервная копия',
    },
    certificados: {
      explicacion:
        'Подписывает сертификат локальным центром сертификации WolfCore Dev. Файл .crt сохраняется в выбранное место, а ключ (.key) — рядом с ним; ключ никогда не передаётся в интерфейс.',
      dominios: 'Имена или IP-адреса (через пробел, запятую или с новой строки)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: 'Выпустить и сохранить',
      guardado: 'Сертификат сохранён',
      certificado: 'Сертификат',
      clave: 'Ключ',
    },
    cripto: {
      texto: 'Текст',
      hash: 'Хеш',
      calcular: 'Вычислить',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Сложность bcrypt',
      bcryptTrunca: 'bcrypt использует только первые 72 байта текста.',
      bcryptVerificar: 'Хеш bcrypt для проверки',
      verificar: 'Проверить',
      coincide: 'Текст соответствует хешу.',
      noCoincide: 'Текст не соответствует хешу.',
      base64: 'Base64',
      base64Url: 'Вариант для URL',
      codificar: 'Кодировать',
      decodificar: 'Декодировать',
      url: 'Кодировать URL',
      decodificarUrl: 'Декодировать URL',
      codificarBase64: 'Кодировать Base64',
      decodificarBase64: 'Декодировать Base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID и пароли',
      uuid: 'UUID v4',
      generar: 'Сгенерировать',
      generarDiez: 'Сгенерировать 10',
      contrasena: 'Случайный пароль',
      longitud: 'Длина',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Символы',
      jwt: 'Декодировать JWT',
      jwtToken: 'Токен',
      cabecera: 'Заголовок',
      carga: 'Полезная нагрузка',
      firmaNoVerificada:
        'Подпись не проверена: содержимое отображается как есть и может быть изменено.',
      vencido: 'Срок действия токена истёк (exp).',
      vigente: 'Срок действия токена не истёк (exp).',
      salida: 'Результат',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Предпросмотр',
      ejemplo:
        '# Заголовок\n\nТекст с **жирным**, _курсивом_ и [ссылкой](https://example.com).\n\n- Раз\n- Два\n\n```\nкод\n```\n',
      seguro:
        'Сырой HTML отображается как текст, опасные ссылки отбрасываются, а изображения не загружаются.',
      imagenOmitida: (alt: string) => `[изображение${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Версия WolfCore Dev',
      navegador: 'Движок интерфейса',
      plataforma: 'Платформа',
      idioma: 'Язык',
      zona: 'Часовой пояс',
      nucleos: 'Логические ядра',
      actualizar: 'Обновить',
      path: 'PATH',
      pathVacio: 'Переменная PATH пуста.',
      herramientas: 'Инструменты WolfCore Dev',
      noInstalada: 'Не установлен',
      sinRespuesta: 'Не ответил вовремя',
      variables: 'Переменные окружения',
      filtro: 'Фильтр переменных',
      enmascarada: 'Значение скрыто: имя похоже на секрет.',
    },
    busqueda: {
      explicacion:
        'Ищет по именам и содержимому, не переходя по ссылкам и не читая двоичные файлы. По умолчанию пропускает node_modules, vendor и .git.',
      origen: 'Где искать',
      proyecto: 'Проект',
      elegirCarpeta: 'Выбрать папку',
      elegirArchivo: 'Выбрать файл',
      sinOrigen: 'Выберите проект, папку или файл.',
      consulta: 'Текст для поиска',
      modoNombre: 'Имена',
      modoContenido: 'Содержимое',
      modoAmbos: 'И то, и другое',
      regex: 'Регулярное выражение',
      mayusculas: 'Учитывать регистр',
      incluir: 'Только файлы (через запятую, например *.php)',
      excluir: 'Пропустить (через запятую)',
      buscar: 'Искать',
      cancelar: 'Отмена',
      buscando: 'Поиск…',
      sinResultados: 'Совпадений нет.',
      truncado: 'Результатов больше, чем показано: уточните поиск.',
      cancelada: 'Поиск отменён.',
      abrir: 'Открыть в редакторе',
      coincidencias: (n: number) => `${n} ${plural(n, 'совпадение', 'совпадения', 'совпадений')}`,
      resumen: (archivos: number, examinados: number) =>
        `в ${archivos} ${plural(archivos, 'файле', 'файлах', 'файлах')} (проверено ${examinados})`,
    },
    infoArchivo: {
      elegir: 'Выбрать файл',
      ayuda: 'Файл читается локально для вычисления хешей (максимум 200 МБ).',
      nombre: 'Имя',
      tamano: 'Размер',
      tipo: 'Тип',
      modificado: 'Изменён',
      sinTipo: 'Неизвестно',
      grande: 'Размер файла превышает 200 МБ: показаны сведения без хешей.',
      calculando: 'Вычисление хешей…',
    },
    websocket: {
      url: 'URL (ws:// или wss://)',
      conectar: 'Подключиться',
      desconectar: 'Отключиться',
      mensaje: 'Сообщение',
      enviar: 'Отправить',
      urlInvalida: 'Введите URL, начинающийся с ws:// или wss://.',
      conectando: 'Подключение…',
      conectado: 'Подключено',
      desconectado: 'Отключено',
      error: 'Ошибка подключения',
      cerrado: (codigo: number, motivo: string) =>
        `Закрыто (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Отправлено',
      recibido: 'Получено',
      binario: (n: number) => `[двоичные данные, ${n} ${plural(n, 'байт', 'байта', 'байт')}]`,
      vacio: 'Сообщений пока нет.',
      tope: 'Хранятся последние 500 сообщений; для каждого отображается до 10 КБ.',
    },
    qrWifi: {
      ssid: 'Имя сети (SSID)',
      clave: 'Пароль',
      seguridad: 'Защита',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Без пароля',
      oculta: 'Скрытая сеть',
      mostrar: 'Показать',
      ocultar: 'Скрыть',
      aviso:
        'QR-код содержит пароль в открытом виде: любой, кто его увидит или сфотографирует, сможет подключиться к вашей сети. Он создаётся локально, не сохраняется и удаляется при закрытии этой панели.',
      avisoPng:
        'Скачиваемый PNG-файл также содержит пароль внутри кода: храните его там, где его видите только вы.',
      escribala:
        'Пароль вводите вы сами: WolfCore Dev никогда не считывает пароли Wi-Fi, сохранённые в системе.',
      errorSsid: 'Введите имя сети (до 32 символов).',
      errorClave: 'Введите пароль.',
      errorClaveWpa: 'Пароль WPA должен содержать от 8 до 63 символов.',
      vacio: 'Заполните данные, чтобы увидеть код.',
      alt: 'QR-код для подключения к сети Wi-Fi',
      descargar: 'Скачать PNG',
      descargado: 'QR-код сохранён',
      largo: 'Данные слишком длинные для QR-кода.',
    },
    imagenes: {
      elegir: 'Выбрать изображение',
      ayuda:
        'Обработка выполняется на этом компьютере (до 30 МБ и 12000 px по стороне). Исходный файл не изменяется: создаётся новый файл.',
      original: 'Исходное',
      accion: 'Действие',
      aIco: 'Конвертировать в ICO',
      aPng: 'Конвертировать в PNG',
      comprimir: 'Сжать',
      tamanos: 'Размеры ICO',
      formato: 'Формат',
      calidad: 'Качество',
      ladoMax: 'Макс. сторона в px (пусто = исходный размер)',
      procesar: 'Обработать',
      procesando: 'Обработка…',
      guardar: 'Сохранить как…',
      antes: 'До',
      despues: 'После',
      sinMejora: 'Результат не меньше исходного файла: попробуйте другое качество или формат.',
      errorAbrir: 'Не удалось открыть изображение на этом компьютере.',
      errorProcesar: 'Не удалось обработать изображение.',
      sufijoConvertida: '-конвертировано',
      sufijoComprimida: '-сжато',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `на ${porcentaje} % меньше`
          : porcentaje < 0
            ? `на ${-porcentaje} % больше`
            : 'без изменений',
      guardado: (archivo: string) => `Сохранено в ${archivo}`,
    },
    comprimir: {
      zip: 'Сжать в ZIP',
      zipAyuda:
        'Выберите файлы или папки. Ссылки не обходятся, а ZIP создаётся как новый файл: существующий файл никогда не перезаписывается.',
      agregarArchivos: 'Добавить файлы',
      agregarCarpeta: 'Добавить папку',
      quitar: 'Убрать',
      vacio: 'Пока ничего не выбрано.',
      crearZip: 'Создать ZIP…',
      creando: 'Создание…',
      pdf: 'Оптимизировать PDF',
      pdfAyuda:
        'Файл пересохраняется с потоками объектов в отдельном потоке. Новый файл создаётся только если он меньше исходного; защищённые паролем PDF не открываются. Исходный файл не изменяется. Внимание: при пересохранении теряются цифровые подписи и соответствие PDF/A.',
      elegirPdf: 'Выбрать PDF',
      optimizar: 'Оптимизировать…',
      optimizando: 'Оптимизация…',
      antes: 'До',
      despues: 'После',
      sinMejora: 'После оптимизации PDF не станет меньше: файл не создан.',
      sufijoOptimizado: '-оптимизировано',
      omitidos: (n: number) =>
        `${n} ${plural(n, 'элемент (ссылка, нечитаемая папка или специальный файл) не включён', 'элемента (ссылки, нечитаемые папки или специальные файлы) не включены', 'элементов (ссылки, нечитаемые папки или специальные файлы) не включены')}.`,
      archivos: (n: number) => `${n} ${plural(n, 'файл', 'файла', 'файлов')}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `на ${porcentaje} % меньше`
          : porcentaje < 0
            ? `на ${-porcentaje} % больше`
            : 'без изменений',
      guardado: (archivo: string) => `Сохранено в ${archivo}`,
    },
    conversor: {
      ayuda:
        'Конвертация выполняется на этом компьютере: документ никуда не загружается. Исходный файл не изменяется; результат сохраняется в новый файл без перезаписи существующих.',
      elegir: 'Выбрать документ',
      tipoNoSoportado:
        'Для этого типа файлов конвертация не поддерживается. Поддерживаются docx, xlsx, csv, md, html и pdf (а также odt, pptx и doc с помощью LibreOffice).',
      convertirA: 'Конвертировать в',
      convertir: 'Конвертировать…',
      convirtiendo: 'Конвертация…',
      avisoLibreOffice:
        'Для этой конвертации используется LibreOffice, уже установленный на этом компьютере. WolfCore Dev не устанавливает и не скачивает его: запуск выполняется без окна и с временным профилем.',
      sinLibreOffice:
        'Если установить LibreOffice, можно также конвертировать odt, pptx и doc (WolfCore Dev не устанавливает его).',
      limites:
        'В целях безопасности действуют ограничения: до 50 МБ (10 МБ для md и html), 120 с, 200 000 строк, 1000 столбцов и 5 млн ячеек; файлы, похожие на ZIP-бомбу или содержащие XML-сущности, отклоняются.',
      guardado: (archivo: string) => `Сохранено в ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Надёжность',
      pestanaAuditar: 'Аудит базы',
      fortaleza: {
        etiqueta: 'Пароль для проверки',
        marcador: 'Введите пароль',
        privacidad: 'Проверка выполняется здесь же: ничего не покидает ваш компьютер и не сохраняется.',
        mostrar: 'Показать',
        ocultar: 'Скрыть',
        niveles: ['Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Очень надёжный'],
        sinAvisos: 'Замечаний нет.',
        estimacion: 'Это оценка, а не гарантия.',
        avisos: {
          straightRow: 'Ряд соседних клавиш легко угадать.',
          keyPattern: 'Короткие клавиатурные комбинации легко угадать.',
          simpleRepeat: 'Повторение одного символа или группы почти не усиливает пароль.',
          extendedRepeat: 'Повторяющиеся группы символов легко угадать.',
          sequences: 'Последовательности вроде abc или 6543 легко угадать.',
          recentYears: 'Избегайте недавних лет и дат, связанных с вами.',
          dates: 'Избегайте дат: их легко угадать.',
          topTen: 'Этот пароль входит в десятку самых распространённых.',
          topHundred: 'Этот пароль входит в сотню самых распространённых.',
          common: 'Это очень распространённый пароль.',
          similarToCommon: 'Похож на очень распространённый пароль.',
          wordByItself: 'Отдельное слово легко угадать.',
          namesByThemselves: 'Отдельное имя или фамилию легко угадать.',
          commonNames: 'Распространённые имена и фамилии легко угадать.',
          userInputs: 'Не используйте данные, которые о вас знают другие.',
          l33t: 'Предсказуемая замена букв на символы (@ вместо a) мало помогает.',
          reverseWords: 'Написание слов задом наперёд мало помогает.',
          allUppercase: 'Написание одними заглавными буквами мало помогает.',
          capitalization: 'Заглавная первая буква мало помогает.',
          associatedYears: 'Избегайте лет, связанных с вами.',
          repeated: 'Избегайте повторяющихся слов и символов.',
          longerKeyboardPattern: 'Используйте более длинную клавиатурную комбинацию и меняйте направление.',
          anotherWord: 'Добавьте ещё одно-два слова; редкие слова усиливают пароль.',
          useWords: 'Несколько случайных слов образуют хороший пароль.',
          noNeed: 'Пароль может быть надёжным и без символов или цифр: главное — длина.',
        },
      },
      auditar: {
        limite:
          'Эта проверка выявляет только очень распространённые пароли: каждый хеш сравнивается с коротким списком примерно из 200 паролей. Это не атака и не перебор. Если учётная запись не отмечена, это не означает, что её пароль надёжен.',
        privacidad:
          'Совпавший пароль никогда не отображается, а чтение выполняется от временного пользователя только для чтения (в PostgreSQL — в сессии только для чтения). Используйте только для собственных баз данных.',
        motor: 'СУБД',
        base: 'База данных',
        tabla: 'Таблица',
        columnaUsuario: 'Столбец пользователя',
        columnaHash: 'Столбец хеша',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Запустите сервер в разделе «Базы данных», чтобы проверить его базы.',
        sinBases: 'На этом сервере нет баз данных.',
        sinMotores: 'Нет собственного сервера MySQL, MariaDB или PostgreSQL.',
        revisar: 'Проверить',
        revisando: 'Проверка…',
        resumen: (r: number, d: number) =>
          `${plural(r, 'Проверена', 'Проверены', 'Проверено')} ${r} ${plural(r, 'учётная запись', 'учётные записи', 'учётных записей')} · ${d} ${plural(d, 'слабая', 'слабые', 'слабых')}`,
        sinDebiles: 'Ни одна из проверенных учётных записей не совпала с распространённым паролем.',
        noRevisables: (n: number) =>
          `Не удалось проверить ${n} ${plural(n, 'учётную запись', 'учётные записи', 'учётных записей')}:`,
        truncado:
          'Проверка прервана из-за лимита в 10 000 строк или 60 секунд: часть учётных записей не проверена.',
        usuario: 'Пользователь',
        motivo: 'Причина',
        accion: 'Действие',
        motivos: {
          comun: 'Очень распространённый пароль',
          formato_debil: 'Слабый формат (md5 или sha1 без соли)',
        },
        restablecer: 'Сбросить',
        mas: (n: number) => `и ещё ${n} (показаны первые 200)`,
        esquema: 'Схема (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Отмена',
        cancelando: 'Отмена…',
        cancelada: 'Аудит отменён.',
        progreso: (a: number, b: number) => `Проверено ${a} из ${b}`,
        tiposNoRevisables: {
          vacio: 'пустой хеш',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (недоступно на этом компьютере или параметры превышают лимит)',
          bcrypt_otro: 'bcrypt со сложностью вне диапазона или вариант $2x$',
          pbkdf2_otro: 'PBKDF2 с параметрами вне лимита',
          ldap: 'формат LDAP ({SHA}…)',
          otro: 'неизвестный формат',
        },
        rlsActiva:
          'Для таблицы включена защита на уровне строк (RLS): аудит видит только строки, разрешённые политикой для ограниченной роли, поэтому часть учётных записей может отсутствовать.',
        falsoPositivo:
          'Значение из 32 или 40 шестнадцатеричных символов принимается за md5 или sha1, но может быть чем-то другим (например, токеном). Если в столбце хранятся не пароли, результат неинформативен.',
      },
      restablecer: {
        titulo: (u: string) => `Сброс пароля для ${u}`,
        ayuda:
          'Восстановить пароль невозможно: задаётся новый. Перед этим создаётся снимок базы данных и сохраняется резервная копия строки.',
        cargando: 'Подготовка предпросмотра…',
        sentencia: 'Будет выполнено (значения передаются отдельно и не отображаются)',
        formatoActual: (f: string) => `Текущий формат: ${f}`,
        cambiaFormato:
          'Учётная запись перейдёт на bcrypt: приложение должно уметь проверять его (например, через password_verify), иначе войти под этой учётной записью не получится.',
        nueva: 'Новый пароль',
        generar: 'Сгенерировать',
        mostrar: 'Показать',
        ocultar: 'Скрыть',
        anotar: 'Запишите его сейчас: он больше не будет показан и нигде не сохраняется.',
        escribaUsuario: (u: string) => `Для подтверждения введите имя пользователя: ${u}`,
        confirmar: 'Сбросить пароль',
        cancelar: 'Отмена',
        cerrar: 'Закрыть',
        hecho: 'Пароль сброшен.',
        copiaFila: 'Копия строки (идентификатор и прежний хеш, хранится 30 дней):',
        instantanea: 'Предыдущий снимок базы данных:',
        instantaneaAyuda: 'К нему можно вернуться в разделе «Базы данных › Снимки».',
        aBcrypt: 'Перевести на bcrypt: только если приложение использует password_verify или аналог',
        avisoLegado:
          'Этот хеш использует md5 или sha1 без соли и сохраняется в том же формате. Если приложение хранит соль отдельно (в другом столбце или константе), воспроизвести хеш невозможно и новый пароль не подойдёт для входа.',
        datosReales: {
          titulo: 'База с реальными данными',
          texto:
            'Эта база данных относится к сайту, отмеченному как содержащий реальные данные клиентов: сброс пароля изменит настоящую учётную запись.',
          casilla: 'Я понимаю, что это реальные данные, и хочу сбросить этот пароль',
        },
        rlsActiva:
          'Для таблицы включена защита на уровне строк (RLS): если политика скрывает эту учётную запись от ограниченной роли, сбросить пароль не удастся.',
        copiaSinRestringir:
          'Не удалось ограничить доступ к этой копии текущим пользователем компьютера: проверьте права доступа к папке.',
      },
    },
  },
  doctor: {
    descripcion:
      'Проверяет порты, сертификаты, файл hosts, PATH, Visual C++, антивирус и службы и предлагает способы исправления.',
    revisarAhora: 'Проверить сейчас',
    revisando: 'Проверка…',
    sinRevision: 'Проверка ещё не выполнялась. Нажмите «Проверить сейчас».',
    sinHallazgos: 'Всё в порядке: проблем не обнаружено.',
    gravedades: { error: 'Ошибки', aviso: 'Уведомления', info: 'Информация' },
    evidencia: 'Что обнаружено',
    requiereAdmin: 'Требуются права администратора',
    comandoManual: 'Команда для консоли администратора (автоматически не выполняется):',
    copiar: 'Копировать команду',
    copiado: 'Команда скопирована.',
    reparar: 'Исправить',
    alternativa: 'Сменить порт WolfCore Dev',
    soloInforma: 'WolfCore Dev не изменяет это самостоятельно: следуйте инструкциям.',
    dialogo: {
      titulo: 'Подтвердить исправление',
      queHara: 'Будет выполнено следующее:',
      admin: 'Windows запросит права администратора.',
      puerto: (p: string | number) => `Новый порт: ${p}.`,
      aplicar: 'Применить',
      cancelar: 'Отмена',
    },
    estados: {
      aplicando: 'Применение…',
      hecha: 'Исправление применено.',
      fallida: 'Не удалось исправить.',
    },
    revisiones: {
      puertos: 'Порты',
      'rangos-reservados': 'Зарезервированные диапазоны',
      ca: 'Центр сертификации',
      certificados: 'Сертификаты',
      confianza: 'Доверие к ЦС',
      hosts: 'Файл hosts',
      path: 'PATH пользователя',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Компоновщик C++',
      antivirus: 'Антивирус',
      firewall: 'Брандмауэр',
      servicios: 'Службы',
    },
    reparaciones: {
      cambiar_puerto: 'Сменить порт WolfCore Dev на свободный. Другая программа не затрагивается.',
      puerto_manual:
        'Перенести порт WolfCore Dev за пределы зарезервированного диапазона. Освобождать ли диапазон — решаете вы с помощью показанной команды.',
      detener_iis:
        'Остановить службу IIS (W3SVC), чтобы освободить порт. Она не отключается и снова запустится после перезагрузки Windows.',
      regenerar_ca:
        'Создать новый центр сертификации, добавить его в доверенные в Windows (потребуется подтверждение), перевыпустить сертификаты и удалить прежний. Предварительно сохраняется резервная копия.',
      regenerar_certificados: 'Перевыпустить сертификаты сайтов и перезагрузить Nginx.',
      hosts_reescribir:
        'Перезаписать блок WolfCore Dev в файле hosts в кодировке UTF-8 с предварительной резервной копией. Чужие строки не затрагиваются.',
      hosts_solo_lectura: 'Снять атрибут «только для чтения» с файла hosts.',
      path_duplicados:
        'Удалить повторяющиеся записи WolfCore Dev из PATH пользователя с сохранением резервной копии прежнего значения. Чужие записи не затрагиваются.',
      path_ajeno:
        'Другой инструмент стоит раньше в PATH. WolfCore Dev не удаляет его: при необходимости измените порядок вручную.',
      instalar_vcredist:
        'Установить Visual C++ 2015+ x64 через winget. Установщик Microsoft запросит отдельное подтверждение.',
      instalar_build_tools:
        'Установите Build Tools для Visual Studio (с инструментами C++) с помощью показанной команды: они занимают несколько ГБ и требуют прав администратора, поэтому решение за вами.',
      antivirus:
        'Добавить папку данных в исключения антивируса — решение за вами, с помощью показанной команды.',
      firewall:
        'Удалить эти правила — решение за вами, с помощью показанной команды в консоли администратора. WolfCore Dev никогда не изменяет брандмауэр.',
      reintentar_servicio: 'Запустить службу повторно.',
      firefox_confianza:
        'Добавить в user.js каждого профиля Firefox параметр доверия к центру сертификации Windows с предварительным созданием резервной копии. Файл prefs.js не изменяется, а открытые профили пропускаются.',
    },
    confianza: {
      titulo: 'Доверие к ЦС',
      texto:
        'Windows уже доверяет центру сертификации WolfCore Dev; Node, Python и Firefox используют собственное хранилище.',
      sinCa: 'Центр сертификации ещё не создан. Создайте его в разделе HTTPS, чтобы использовать этот раздел.',
      node: {
        titulo: 'Node',
        proyectos:
          'Процессы проектов и Терминал получают переменную NODE_EXTRA_CA_CERTS с центром сертификации.',
        ajena: 'У вас уже задана собственная переменная NODE_EXTRA_CA_CERTS: WolfCore Dev не перезаписывает её.',
        global: 'Также как переменную пользователя (для других терминалов и программ)',
        confirmarActivar:
          'Переменная NODE_EXTRA_CA_CERTS будет задана для вашего пользователя. Это повлияет на программы, запущенные после этого; переменная удаляется при отключении параметра.',
        confirmarDesactivar: 'Переменная NODE_EXTRA_CA_CERTS, добавленная WolfCore Dev, будет удалена.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Проекты с .venv получают REQUESTS_CA_BUNDLE и SSL_CERT_FILE с корневыми сертификатами certifi (или Windows) плюс центр сертификации. Никогда не только один центр сертификации.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Профили Firefox не найдены.',
        activo: 'Доверяет',
        inactivo: 'Не доверяет',
        abierto: 'Открыт',
        fuera: 'Вне папки Firefox',
        avisoFuera: (lista: string) =>
          `Эти профили находятся вне папки Firefox и не будут затронуты, если вы не отметите этот параметр: ${lista}.`,
        incluirFuera: 'Также изменять профили вне папки Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'профиль вне папки Firefox не был затронут', 'профиля вне папки Firefox не были затронуты', 'профилей вне папки Firefox не были затронуты')}.`,
        activar: 'Включить в Firefox',
        quitar: 'Удалить из Firefox',
        confirmarActivar:
          'Параметр security.enterprise_roots.enabled будет добавлен в user.js каждого профиля между метками WolfCore Dev с предварительным созданием резервной копии в etc/respaldos. Файл prefs.js не изменяется. Профили с открытым Firefox пропускаются: закройте его заранее.',
        confirmarQuitar:
          'Блок WolfCore Dev будет удалён из user.js каждого профиля (с предварительным созданием резервной копии). Остальные ваши настройки не изменятся.',
        resultadoOk: (n: number) => `Применено: ${plural(n, 'профиль', 'профиля', 'профилей')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'профиль пропущен', 'профиля пропущены', 'профилей пропущены')}, так как Firefox открыт. Закройте его и повторите попытку.`,
        resultadoError: (n: number) =>
          `Не удалось изменить ${plural(n, 'профиль', 'профиля', 'профилей')}.`,
      },
      confirmar: 'Подтвердить',
      cancelar: 'Отмена',
    },
  },
  php: {
    descripcion:
      'php.ini и расширения каждой установленной версии PHP. Перед сохранением показывается diff, выполняется проверка через php -v и сохраняется резервная копия с датой; если PHP не запустится снова, восстанавливается предыдущий файл.',
    rama: 'Версия PHP',
    sinPhp: 'PHP не установлен. Установите его в разделе «Службы».',
    irServicios: 'Перейти к службам',
    pestanas: { ini: 'php.ini', extensiones: 'Расширения' },
    rapidosTitulo: 'Быстрые параметры',
    rapidosAyuda: 'Применяются к тексту ниже; ничего не сохраняется до подтверждения diff.',
    aplicarRapidos: 'Применить к тексту',
    sinValor: 'не задано',
    rapidos: {
      memory_limit: 'Память на скрипт (memory_limit)',
      upload_max_filesize: 'Макс. размер загрузки (upload_max_filesize)',
      post_max_size: 'Макс. размер POST (post_max_size)',
      max_execution_time: 'Макс. время в секундах (max_execution_time)',
      display_errors: 'Показывать ошибки (display_errors)',
      error_reporting: 'Уровень ошибок (error_reporting)',
      'date.timezone': 'Часовой пояс (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'Строки, начинающиеся с ;, являются комментариями.',
    sinCambios: 'Изменений по сравнению с сохранённой версией нет.',
    descartar: 'Отменить изменения',
    revisar: 'Проверить и сохранить',
    diffTitulo: (rama: string) => `Изменения в php.ini для PHP ${rama}`,
    diffAyuda:
      'Будет сохранена резервная копия с датой, выполнена проверка через php -v и, если PHP запущен, он будет перезапущен.',
    guardar: 'Сохранить и применить',
    cancelar: 'Отмена',
    guardado: (respaldo: string) => `Файл php.ini сохранён. Предыдущая резервная копия: ${respaldo}`,
    respaldosTitulo: 'Резервные копии с датой',
    sinRespaldos: 'Резервных копий пока нет.',
    restaurar: 'Восстановить',
    confirmarRestaurar: (nombre: string) =>
      `Восстановить ${nombre}? Текущий php.ini будет предварительно сохранён как ещё одна резервная копия.`,
    restaurado: 'Резервная копия восстановлена.',
    recargar: 'Перечитать',
    extensiones: {
      ayuda:
        'Включаются только расширения, входящие в эту сборку в папке ext/. Сторонние устанавливаются из каталога (вариант для этой сборки с проверенной контрольной суммой SHA-256).',
      activa: 'Активно',
      inactiva: 'Неактивно',
      falta: 'Файл отсутствует',
      catalogo: 'Каталог',
      instalar: 'Установить',
      instalada: (nombre: string) => `Расширение ${nombre} установлено и активировано.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `Расширение ${nombre} активировано.` : `Расширение ${nombre} отключено.`,
      buscar: 'Поиск расширения',
      vacio: 'Подходящих расширений нет.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI и Antigravity CLI: обнаруживайте или устанавливайте их и открывайте в проекте. Поддерживаемые агенты подключаются к MCP WolfCore Dev. Ни один агент не открывается сам.',
    recargar: 'Найти снова',
    notaMcp:
      'Зарегистрированный MCP проходит аутентификацию только при открытии агента из WolfCore Dev («Открыть в проекте»): токен передаётся в переменной WOLFCORE_MCP_TOKEN этого терминала и никогда не записывается в конфигурацию агента. При запуске извне агент видит запись «wolfcore», но не может подключиться.',
    sitioElegido: (nombre: string) => `Выберите агента, чтобы открыть его в ${nombre}.`,
    instalado: 'Установлен',
    noInstalado: 'Не установлен',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Неизвестная версия',
    verVersion: 'Показать версию',
    verVersionAyuda: 'Запускает программу с флагом --version (не выполняется автоматически при открытии экрана).',
    origen: {
      propio: 'Установлен через WolfCore Dev',
      'npm-usuario': 'Глобальный npm пользователя',
      ejecutable: 'Системная программа',
    },
    mcpRegistrado: 'MCP зарегистрирован',
    mcpSinRegistrar: 'MCP не зарегистрирован',
    tokenEscrito:
      'В файле агента был записан токен MCP: он уже удалён, а в резервной копии он замаскирован (***). Рекомендуется пересоздать токен сервера MCP.',
    mcpNoSoportado:
      'Документация агента не позволяет брать токен из переменной окружения: WolfCore Dev не регистрирует для него MCP (токен никогда не записывается в файлы).',
    instalar: 'Установить',
    instalando: 'Установка…',
    guia: 'Руководство по установке',
    soloGuia:
      'WolfCore Dev не устанавливает его (у установщика нет фиксированной контрольной суммы): следуйте официальному руководству.',
    registrar: 'Зарегистрировать MCP',
    quitar: 'Удалить MCP',
    abrir: 'Открыть в проекте',
    confirmarInstalar: {
      titulo: (nombre: string) => `Установить ${nombre}?`,
      texto: (paquete: string) =>
        `Будет установлена последняя опубликованная версия ${paquete} из registry.npmjs.org с использованием Node из WolfCore Dev и в его папке данных.`,
      aislado: 'Не использует вашу конфигурацию npm и не затрагивает глобальный npm. Это может занять несколько минут.',
      aceptar: 'Установить',
      hecho: (nombre: string) => `${nombre} установлен.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Зарегистрировать MCP в ${nombre}?`,
      texto:
        'В этот файл добавляется (или обновляется) только запись «wolfcore»; всё остальное остаётся без изменений:',
      aceptar: 'Зарегистрировать',
      hecho: (nombre: string) => `MCP зарегистрирован в ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Удалить MCP из ${nombre}?`,
      texto: 'Из этого файла удаляется только запись «wolfcore»; всё остальное остаётся без изменений:',
      aceptar: 'Удалить',
      hecho: (nombre: string) => `MCP удалён из ${nombre}.`,
    },
    copiaPrevia:
      'Перед изменением рядом с файлом сохраняется резервная копия с датой (<файл>.wolfcore-YYYYMMDD-HHmmss.bak); хранятся 5 последних копий. Если агент открыт, закройте его заранее.',
    copiaHecha: (ruta: string) => `Предыдущая резервная копия: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Открыть ${nombre}`,
      proyecto: 'Проект',
      sinProyectos: 'Проектов пока нет.',
      proveedor: 'Поставщик ИИ',
      proveedorPropio: 'Настроенный в самом агенте',
      proveedorAyuda:
        'При выборе поставщика ваш ключ передаётся только в окружении этого терминала: он не записывается в файлы и не передаётся в командной строке.',
      aceptar: 'Открыть терминал',
      hecho: (nombre: string) => `${nombre} открыт в новом терминале.`,
    },
    costo: {
      titulo: 'Перед открытием агента',
      texto:
        'ИИ-агент работает с вашей учётной записью поставщика: каждый запрос расходует токены и может быть платным. Он также может читать и изменять файлы проекта и выполнять команды.',
      nunca:
        'WolfCore Dev никогда не открывает агента сам: его всегда запускаете вы. Это уведомление показывается один раз.',
      aceptar: 'Понятно, открыть',
    },
  },
  depuracion: {
    descripcion:
      'Просматривайте здесь вызовы dump(), dd() и wd() ваших PHP-сайтов и wolfdump процессов Python с указанием файла и строки. Страница продолжает отвечать как обычно.',
    receptor: 'Перехват дампов',
    escuchando: (direccion: string, puerto: number) => `Прослушивание ${direccion}:${puerto}`,
    apagado: 'Выключен',
    memoria:
      'Дампы хранятся только в памяти (последние 500) и теряются при закрытии. Они могут содержать конфиденциальные данные: при копировании известные ключи маскируются.',
    sitios: 'Сайты',
    sinSitios: 'Нет сайтов PHP или FastAPI.',
    sinPhp: 'Сначала выберите версию PHP для сайта.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Перезапустите процессы сайта, чтобы они подхватили wolfdump.',
    confirmarTitulo: (sitio: string) => `Включить перехват для ${sitio}`,
    confirmarPhp:
      'PHP этого сайта будет загружать перед каждым запросом файл WolfCore Dev (auto_prepend_file, только для этого сайта), который определяет dump(), dd() и wd(), если проект их не определяет. Если ваши файлы объявляют собственную функцию dump() или dd() без проверки function_exists, PHP выдаст ошибку: в этом случае отключите перехват. Сайт перейдёт на использование собственного PHP.',
    usoPhp:
      'Laravel и Symfony: dump($x) и dd($x) как обычно. CodeIgniter 3 и другие: wd($x) отправляет дамп без вывода на страницу.',
    confirmarPython:
      'Процессы этого сайта получат модуль wolfdump в своём PYTHONPATH (в проект ничего не записывается). Действует со следующего запуска его процессов.',
    usoPython: 'from wolfdump import dump  →  dump(значение)',
    activar: 'Включить перехват',
    cancelar: 'Отмена',
    filtroSitio: 'Все сайты',
    filtroOrigen: 'Все источники',
    buscar: 'Поиск по тексту, файлу или URL',
    limpiar: 'Очистить',
    confirmarLimpiar: 'Удалить все дампы из памяти?',
    vacio: 'Дампы пока не поступали.',
    vacioApagado: 'Включите перехват и запустите сайт, чтобы начать.',
    elegir: 'Выберите дамп из списка.',
    copiar: 'Копировать',
    copiado: 'Скопировано (ключи замаскированы)',
    sinSitio: 'без сайта',
    total: (n: number) => `${n} в памяти`,
    archivo: 'Файл',
    url: 'URL',
    pestanaVolcados: 'Дампы',
    pestanaErrores: 'Ошибки',
    erroresDescripcion:
      'Ошибки из журналов PHP, Nginx, laravel.log, CodeIgniter 3 и Python, сгруппированные по совпадению: повторяющаяся ошибка показывается один раз со счётчиком.',
    erroresVacio: 'Ошибок в журналах нет. Они появятся здесь сразу после записи.',
    erroresElegir: 'Выберите ошибку из списка.',
    actualizar: 'Обновить',
    abrirEditor: 'Открыть в редакторе',
    abrirEditorSinSitio: 'Открываются только файлы из папки сайта.',
    veces: (n: number) => plural(n, 'раз', 'раза', 'раз'),
    primera: 'Первый раз',
    ultima: 'Последний раз',
    fuente: 'Журнал',
    traza: 'Трассировка (последний раз)',
    sinTraza: 'Без трассировки.',
  },
  contenedores: {
    descripcion:
      'Просматривайте и управляйте контейнерами Docker или Podman на этом компьютере. WolfCore Dev не создаёт, не удаляет и не загружает контейнеры, образы или тома.',
    motor: 'Движок',
    refrescar: 'Обновить',
    detectando: 'Поиск Docker и Podman…',
    sinMotorTitulo: 'Docker и Podman не найдены',
    sinMotor:
      'На этом компьютере не найдены Docker или Podman. WolfCore Dev не устанавливает их: если они вам нужны, установите один из них с официального сайта и нажмите «Обновить».',
    instalarDocker: 'Установить Docker',
    instalarPodman: 'Установить Podman',
    apagadoTitulo: (m: string) => `${m} не отвечает`,
    apagado: (m: string) =>
      `${m} установлен, но его движок не отвечает. Откройте Docker Desktop (или запустите машину Podman командой «podman machine start») и нажмите «Обновить».`,
    remoto:
      'Удалённое подключение проигнорировано (DOCKER_HOST, CONTAINER_HOST, контекст или подключение по умолчанию): WolfCore Dev использует только локальный движок этого компьютера.',
    desdePath: 'Найден в PATH, а не в стандартной папке установки.',
    version: (v: string) => `Версия ${v}`,
    vacio: 'Контейнеров нет.',
    columnas: {
      nombre: 'Имя',
      imagen: 'Образ',
      estado: 'Состояние',
      puertos: 'Порты',
      compose: 'Compose',
      acciones: 'Действия',
    },
    estados: {
      corriendo: 'Запущен',
      detenido: 'Остановлен',
      pausado: 'На паузе',
      otro: 'Другое',
    },
    codigoSalida: (n: number) => `код ${n}`,
    iniciar: 'Запустить',
    detener: 'Остановить',
    reiniciar: 'Перезапустить',
    registros: 'Журналы',
    confirmarDetenerTitulo: 'Остановить контейнер?',
    confirmarDetener: (n: string) =>
      `Контейнер «${n}» будет остановлен. Выполняющиеся внутри процессы будут прерваны (движок подождёт несколько секунд для завершения). Ничего не удаляется.`,
    confirmarReiniciarTitulo: 'Перезапустить контейнер?',
    confirmarReiniciar: (n: string) =>
      `Контейнер «${n}» будет перезапущен. Выполняющиеся внутри процессы будут прерваны и запущены заново. Ничего не удаляется.`,
    confirmar: 'Подтвердить',
    cancelar: 'Отмена',
    hecho: {
      iniciar: (n: string) => `Контейнер «${n}» запущен.`,
      detener: (n: string) => `Контейнер «${n}» остановлен.`,
      reiniciar: (n: string) => `Контейнер «${n}» перезапущен.`,
    },
    registroTitulo: (n: string) => `Журналы «${n}»`,
    registroEsperando: 'Ожидание строк…',
    registroFin: 'Журнал завершён (контейнер остановлен или движок прервал поток).',
    cerrar: 'Закрыть',
  },
  versiones: {
    pestana: 'Версии',
    pestanaServicios: 'Службы',
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
        'У каждой основной версии (8.4, 17…) есть свой экземпляр со своей папкой данных и портом: можно запускать несколько одновременно. Звёздочка отмечает версию для новых проектов.',
      pool: 'У каждой запущенной версии PHP свой процесс PHP; звёздочка отмечает версию для новых проектов.',
      unica:
        'Можно установить несколько версий, но запущенной остаётся только одна: запуск другой переключает активную.',
      ninguno:
        'Запускать ничего не нужно: проекты используют запрошенную версию или версию по умолчанию (звёздочка).',
    },
    filtroRama: 'Версия',
    todasRamas: 'Все версии',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Показать все',
    origen: {
      vivo: 'В сети',
      cache: (h: number) => (h < 1 ? 'Кэш менее 1 ч назад' : `Кэш ${h} ч назад`),
      fija: 'Автономный список',
    },
    actualizarLista: 'Обновить список',
    errorCarga: 'Не удалось загрузить список версий',
    vacio: 'Нет версий для отображения.',
    soporte: { lts: 'LTS', actual: 'Актуальная', fin: 'Без поддержки', preview: 'Preview' },
    finSoporte: (f: string) => `Поддержка до ${f}`,
    finSoportePasado: (f: string) => `Без поддержки с ${f}`,
    marcas: {
      instalada: 'Установлена',
      encendida: 'Запущена',
      actualizacion: (v: string) => `Обновление: ${v}`,
      bloqueada: 'Заблокирована',
      sinHuella: 'Без опубликованной контрольной суммы',
      huellaDebil: 'Только контрольная сумма MD5',
      firmada: 'С подписью PGP',
    },
    ayudaFirmada:
      'Официальный источник подписывает эту загрузку с помощью PGP: WolfCore Dev проверяет подпись по встроенным в приложение ключам перед установкой.',
    ayudaSinHuella:
      'Официальный источник не публикует надёжную контрольную сумму (SHA-256 или SHA-512): загрузку невозможно проверить.',
    instalar: 'Установить',
    desinstalar: 'Удалить',
    encender: 'Запустить',
    apagar: 'Остановить',
    actualizar: 'Обновить',
    usarEsta: 'Использовать эту версию',
    usarEstaAyuda: (id: string) =>
      `Экземпляр ${id} использует другую версию этой службы: переключение выполняется с предварительной резервной копией его данных.`,
    predeterminada: 'По умолчанию для новых проектов',
    hacerPredeterminada: 'Использовать для новых проектов',
    predeterminadaHecha: (v: string) => `Версия ${v} назначена по умолчанию.`,
    puerto: 'Порт',
    puertoDe: (id: string) => `Порт ${id}`,
    cambiarPuerto: 'Изменить',
    puertoCambiado: (p: number) => `Порт изменён на ${p}.`,
    puertoProyectosTitulo: 'Проекты со старым портом',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Эти проекты всё ещё используют порт ${viejo} в своём .env (они не были изменены): ${lista}. Измените его на ${nuevo}.`,
    resolver: 'Решить',
    instalada: (v: string) => `${v} установлена.`,
    selector: { etiqueta: 'Экземпляр', predeterminada: 'по умолчанию', apagada: 'остановлен' },
    dialogoSinHuella: {
      titulo: (v: string) => `Установить ${v} без проверки суммы`,
      riesgo:
        'У этой версии нет опубликованной контрольной суммы от официального источника: WolfCore Dev не может проверить подлинность загруженного файла.',
      explicacion:
        'Загрузка всё равно идёт по HTTPS с официального сайта, но если сайт или соединение скомпрометированы, это останется незамеченным. Устанавливайте только при необходимости.',
      alternativa: (v: string) => `Доступна проверенная версия этой же службы: ${v}.`,
      casilla: 'Я понимаю риск и хочу установить без проверки',
      instalarVerificada: (v: string) => `Установить ${v} (проверенную)`,
      instalarIgual: 'Установить без проверки',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Обновить ${n}`,
      tituloRama: (v: string) => `Новая версия: ${v}`,
      ninguna: 'нет',
      instancia: (id: string) => `Обновляется экземпляр ${id}. Перед внесением изменений:`,
      pasoInstalar: (v: string) => `устанавливается ${v} рядом с текущей версией (текущая не удаляется);`,
      pasoVolcados: 'создаётся дамп каждой базы данных текущей версией;',
      pasoCopia: 'служба останавливается и полностью копируется папка данных (холодная копия);',
      pasoArrancar: 'выполняется запуск с новой версией и проверка отклика;',
      pasoVuelta:
        'если запуск не удастся, выполняется возврат к предыдущей версии с её данными, а резервная копия сохраняется.',
      datos: 'Данные:',
      respaldo: 'Копия в:',
      espacio: 'Место:',
      espacioLibre: (libres: string, necesarios: string) =>
        `свободно ${libres}; требуется ${necesarios}`,
      datosQuedan:
        'Предыдущие данные никогда не удаляются: копия и дампы остаются в резервных копиях обновлений, пока вы их не удалите.',
      sinEspacio: 'Недостаточно места для резервной копии: освободите место и повторите попытку.',
      alLado: (v: string) =>
        `Устанавливается ${v}. Остальные установленные версии не затрагиваются; проекты с закреплённой другой версией продолжают её использовать.`,
      ramaExplicacion:
        'Новая основная версия не заменяет предыдущую: создаётся новый экземпляр со своей папкой данных и портом. Текущий экземпляр остаётся без изменений.',
      copiarDesdeTitulo: 'Данные нового экземпляра',
      copiarDesde: (id: string) =>
        `Скопировать данные из ${id} (создаётся дамп и выполняется восстановление; оригинал не затрагивается)`,
      vacia: 'Начать с пустой базы',
      ramaNota:
        'Пользователи базы данных не копируются; проекты нужно перенастроить на порт нового экземпляра.',
      crearInstancia: 'Создать новый экземпляр',
      confirmar: 'Обновить с резервной копией',
      hecho: (v: string) => `${v} обновлена.`,
      fallo: 'Не удалось обновить',
      ramaCreada: (id: string) => `Экземпляр ${id} создан.`,
      copiadas: (l: string) => `Скопированы: ${l}.`,
      noCopiada: (b: string, m: string) => `Не удалось скопировать ${b}: ${m}`,
    },
    limpieza: {
      boton: 'Очистить неиспользуемые версии…',
      titulo: 'Очистить неиспользуемые версии',
      intro:
        'Удаляются только программы версий, которые нигде не используются (папка bin). Данные баз, экземпляры и ваши проекты никогда не затрагиваются.',
      cargando: 'Поиск версий…',
      vacia: 'Установленных версий нет.',
      sinLibres: 'Все установленные версии используются: очищать нечего.',
      fallo: 'Не удалось выполнить очистку',
      fallaLista: 'Не удалось загрузить список версий',
      bloqueada: 'Невозможно выбрать',
      marcadas: (n: number, tam: string) => `${plural(n, 'версия', 'версии', 'версий')} · ${tam}`,
      destinoTitulo: 'Что с ними сделать',
      papelera: 'Переместить в корзину: хранятся 7 дней и до тех пор продолжают занимать место на диске',
      definitivo: 'Удалить навсегда: освобождает место сразу и не подлежит отмене',
      avisoDefinitivo:
        'Безвозвратное удаление: чтобы вернуть эти версии, их придётся загрузить заново.',
      instantanea:
        'При безвозвратном удалении предварительно сохраняется резервная копия конфигурации окружения; из корзины версии можно восстановить.',
      entiendo: 'Я понимаю, что это действие нельзя отменить',
      confirmar: (n: number) => `Удалить ${plural(n, 'версию', 'версии', 'версий')}`,
      motivos: {
        predeterminada: 'Выбрана по умолчанию',
        encendida: 'Запущена или выполняется',
        sitio: 'Используется проектом',
        instancia: 'Используется экземпляром (даже если он остановлен)',
        plantilla: 'Используется шаблоном',
        workspace: 'Используется рабочим пространством',
        runtime: 'Используется проектом',
        tarea: 'Используется проектом с запланированными задачами',
        duda: 'Не удалось проверить: не затрагивается',
        datos: 'Содержит данные, которые может открыть только эта версия',
        herramienta: 'Используется phpMyAdmin или Adminer',
      },
      resultadoTitulo: 'Результат',
      liberadas: (tam: string) => `Освобождено ${tam}.`,
      enPapelera: (tam: string) => `${tam} перемещено в корзину (очищается через 7 дней).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${plural(n, 'версия уже удалена из bin, но остались файлы', 'версии уже удалены из bin, но остались файлы', 'версий уже удалены из bin, но остались файлы')} — удаление будет повторено при следующем запуске приложения.`,
      instantaneaGuardada: 'Резервная копия окружения сохранена перед удалением.',
      ajeno: (lista: string) =>
        `Содержит установленные вами компоненты: ${lista}. При удалении они будут потеряны.`,
      incluirAjeno: 'Удалить даже с потерей этих данных',
      sinCatalogo: 'Этой версии больше нет в каталоге: после удаления её нельзя будет загрузить снова.',
      papeleraTitulo: 'В корзине',
      recuperar: 'Восстановить',
      recuperada: (v: string) => `${v} восстановлена.`,
      borradaEl: (f: string) => `Удалена ${f}`,
      fallaRecuperar: 'Не удалось восстановить',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Удалить ${v}`,
      binario: 'Удаляются только программы этой версии.',
      instancia: (id: string) =>
        `Используется экземпляром ${id}: он будет остановлен и удалён из списка экземпляров.`,
      datosQuedan:
        'Ваши данные останутся на диске: если вы снова установите эту версию, экземпляр откроет их заново.',
      borrarDatos: 'Также удалить данные',
      borrarAviso: (id: string) =>
        `Папка данных ${id} со всеми её базами будет удалена. Это действие нельзя отменить. Введите "${id}" для подтверждения.`,
      escriba: (id: string) => `Введите ${id} для подтверждения`,
      desinstalar: 'Удалить',
      desinstalarYBorrar: 'Удалить вместе с данными',
      unica:
        'Это активная версия: если она единственная установленная, её можно удалить при остановленной службе (служба останется неустановленной); если есть другие, сначала выберите другую версию как активную (звёздочка).',
      predeterminada: (id: string) =>
        `${id} — экземпляр по умолчанию: «Базы данных», блок .env и инструменты, использующие этот движок, перейдут на другой экземпляр (с другим портом).`,
      hecho: (v: string) => `${v} удалена.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Разблокировать ${id}`,
      explicacion:
        'Обновление завершилось неудачей и данные этого экземпляра не удалось вернуть, поэтому он не запускается, пока вы не выберете действие. Ничего не удалено.',
      fallida: 'Затронутые данные:',
      respaldo: 'Резервная копия:',
      opciones: 'Что сделать',
      devolver: (sello: string, tam: string) =>
        `Восстановить резервную копию ${sello} (${tam}); текущая папка будет отложена, не удалена`,
      usarActual: 'Использовать текущую папку данных как есть',
      notaActual:
        'Только если в текущей папке полные данные; иначе выберите резервную копию.',
      notaDevolver: 'Копия переносится, проверяется и только затем ставится на место.',
      escriba: (id: string) => `Введите ${id} для подтверждения`,
      elegirVersion:
        'Не удалось прочитать метку блокировки: выберите версию, с которой открывать данные (ту, что была до обновления).',
      version: 'Версия',
      confirmar: 'Разблокировать',
      hecho: (id: string) => `${id} разблокирован. Теперь его можно запустить.`,
    },
    respaldos: {
      titulo: 'Резервные копии обновлений',
      descripcion:
        'Копии, оставшиеся после обновлений и новых версий. Рабочая папка данных каждого экземпляра здесь никогда не отображается.',
      vacio: 'Копий нет.',
      tipos: {
        respaldo: 'Холодная копия',
        volcados: 'Дампы баз данных',
        fallida: 'Данные неудачной версии',
        restaurando: 'Незавершённое восстановление',
        copia: 'Дампы для новой версии',
      },
      archivos: (n: number) => plural(n, 'файл', 'файла', 'файлов'),
      borrar: 'Удалить',
      borrarDe: (n: string) => `Удалить ${n}`,
      confirmarTitulo: 'Удалить копию',
      confirmar: (n: string, tam: string) =>
        `Будет удалено: ${n} (${tam}). Это действие нельзя отменить. Рабочие данные экземпляров не затрагиваются.`,
      borrado: 'Копия удалена.',
    },
  },
  navGrupos: {
    trabajo: 'Работа',
    entorno: 'Среда',
    utilidades: 'Утилиты',
  },
  avisos: {
    campana: 'Уведомления',
    campanaConNuevos: (n: number) => `Уведомления: ${n} непрочит.`,
    titulo: 'Центр уведомлений',
    vacio:
      'Уведомлений нет. Здесь появятся сбои служб, занятые порты и истекающие сертификаты.',
    marcarTodos: 'Отметить всё прочитанным',
    limpiar: 'Очистить историю',
    ver: 'Открыть',
    actualizar: 'Обновить',
    verVersiones: 'Показать версии',
    cerrar: 'Закрыть',
    niveles: { info: 'Информация', aviso: 'Уведомление', error: 'Ошибка' },
    sinLeer: 'Непрочитано',
  },
  barra: {
    paleta: 'Найти или выполнить команду',
    atajoPaleta: 'Ctrl+K',
    tema: 'Сменить тему',
    idioma: 'Сменить язык',
  },
  preferencias: {
    titulo: 'Оформление и язык',
    descripcion: 'Изменения применяются сразу и сохраняются на этом компьютере.',
    tema: 'Тема',
    temas: { sistema: 'Системная', claro: 'Светлая', oscuro: 'Тёмная' },
    idioma: 'Язык',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語' },
    acento: 'Акцентный цвет',
    acentos: {
      indigo: 'Индиго',
      azul: 'Синий',
      verde: 'Зелёный',
      violeta: 'Фиолетовый',
      naranja: 'Оранжевый',
      rosa: 'Розовый',
    },
    acentoPropio: (color: string) => `Свой (${color})`,
    errorGuardar: 'Не удалось сохранить настройку',
    asistente: 'Мастер первоначальной настройки',
    asistenteAyuda:
      'Повторно пройдите начальные шаги: папка проектов, базовые службы, CA, GitHub и отслеживаемая папка.',
    asistenteAbrir: 'Открыть мастер',
  },
  paleta: {
    titulo: 'Палитра команд',
    placeholder: 'Найдите экран, службу, проект или инструмент…',
    sinResultados: 'Ни одна команда не соответствует поиску.',
    ayuda: '↑ ↓ навигация · Enter выполнить · Esc закрыть',
    grupos: {
      navegacion: 'Перейти',
      servicios: 'Службы',
      proyectos: 'Проекты',
      herramientas: 'Инструменты',
      github: 'GitHub',
      general: 'Общие',
    },
    irA: (pantalla: string) => `Перейти: ${pantalla}`,
    encender: (servicio: string) => `Запустить ${servicio}`,
    apagar: (servicio: string) => `Остановить ${servicio}`,
    iniciarTodo: 'Запустить все службы',
    detenerTodo: 'Остановить все службы',
    iniciarWorkspace: (n: string) => `Запустить workspace ${n}`,
    detenerWorkspace: (n: string) => `Остановить workspace ${n}`,
    abrirSitio: (nombre: string) => `Открыть ${nombre} в браузере`,
    traerCambios: (nombre: string) => `Получить изменения в ${nombre}`,
    abrirHerramienta: (nombre: string) => `Открыть ${nombre}`,
    clonar: 'Клонировать репозиторий из GitHub',
    agregarProyecto: 'Добавить проект',
    nuevoProyecto: 'Создать новый проект',
    tema: (tema: string) => `Тема: ${tema}`,
    idioma: (idioma: string) => `Язык: ${idioma}`,
    asistente: 'Открыть мастер первоначальной настройки',
  },
  nuevoProyecto: {
    titulo: 'Новый проект',
    boton: 'Новый проект',
    descripcion:
      'Создайте проект с нуля: папку, сайт с HTTPS, базу данных и её подключение.',
    pasos: { tipo: 'Тип', datos: 'Данные', resumen: 'Итог', crear: 'Создание' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Через Composer; ключ приложения, база и миграции.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Официальный Appstarter с .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Классический фреймворк с настроенным database.php.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Официальный скелет (или webapp) с .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Виртуальное окружение, requirements.txt и процесс uvicorn.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Официальная сборка с готовым wp-config.php.' },
      estatico: {
        nombre: 'Статический сайт',
        descripcion: 'HTML и CSS через Nginx, без базы данных.',
      },
    },
    campos: {
      nombre: 'Имя проекта',
      nombrePlaceholder: 'my-shop',
      nombreAyuda: (dominio: string) => `Будет ${dominio}: строчные буквы, цифры и дефисы.`,
      carpeta: 'Родительская папка',
      elegirCarpeta: 'Выбрать папку…',
      cambiarCarpeta: 'Изменить папку…',
      carpetaAyuda:
        'Проект создаётся в новой папке с его именем внутри выбранной. Она должна быть пустой или не существовать.',
      php: 'Версия PHP',
      python: 'Версия Python',
      sinInstalada: 'Ни одной не установлено: установите в разделе Службы.',
      conBase: 'Создать базу данных для проекта',
      sinBase: 'Без базы данных',
      instancia: 'Сервер базы данных',
      apagada: 'остановлен',
      apagadaAyuda:
        'Этот сервер остановлен: запустите его в разделе Службы перед созданием проекта.',
      sinMotores: 'Нет установленного сервера баз данных для этого типа проекта.',
      nombreBase: 'Имя базы данных',
      starterKit: 'Стартовый набор',
      starterKits: { ninguno: 'Нет', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Включить веб-пакеты (webapp)',
      pgvector: 'Включить pgvector (векторный поиск)',
    },
    huella: {
      titulo: 'WordPress публикует только слабый хэш',
      riesgo:
        'Опубликованный хэш использует SHA-1 — устаревший алгоритм, и поступает с того же сайта, что и архив.',
      explicacion:
        'Если этот сайт или соединение скомпрометированы, подменённый файл пройдёт проверку. Загрузка всё равно идёт по HTTPS с wordpress.org. Продолжайте, только если доверяете источнику.',
      leyendo: 'Чтение опубликованного хэша…',
      noDisponible:
        'Сейчас не удалось прочитать хэш (нет сети или источник не ответил); он будет проверен снова при создании.',
      fuente: 'Источник: wordpress.org',
      casilla: 'Я понимаю, что хэш слабый, и всё равно хочу создать проект',
    },
    resumen: {
      titulo: 'Будет создано',
      intro: 'Проверьте перед началом.',
      tipo: 'Тип',
      carpeta: 'Папка',
      sitio: 'Сайт',
      dominio: 'Домен',
      https: 'Адрес HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'База данных',
      env: 'Подключение записано в',
      nota: 'При сбое шага ничего не удаляется: вы увидите, что создано, и сможете повторить.',
    },
    errores: {
      nombreVacio: 'Введите имя проекта.',
      nombreInvalido:
        'Имя может содержать только строчные буквы, цифры и дефисы (до 40), не начинаясь и не заканчиваясь дефисом.',
      sinCarpeta: 'Выберите родительскую папку проекта.',
      sinPhp: 'Выберите версию PHP (установите в разделе Службы, если нет ни одной).',
      sinPython: 'Выберите версию Python (установите в разделе Службы, если нет ни одной).',
      sinInstancia: 'Выберите сервер для создания базы данных или снимите флажок базы.',
      baseInvalida: 'Имя базы недопустимо для этой СУБД.',
      motorNoVale: 'WordPress требует MySQL или MariaDB.',
      pgvectorMotor: 'pgvector требует PostgreSQL.',
      huellaDebil: 'Подтвердите, что понимаете слабость хэша WordPress.',
    },
    acciones: {
      cambiarCarpeta: 'Выбрать другую папку',
      cambiarBase: 'Изменить имя базы',
      cambiarNombre: 'Изменить имя',
      reintentarPaso: 'Повторить шаг',
      servicios: 'Перейти в Службы',
      confirmarHuella: 'Проверить подтверждение',
    },
    botones: {
      siguiente: 'Далее',
      atras: 'Назад',
      crear: 'Создать проект',
      creando: 'Создание…',
      cerrar: 'Закрыть',
      abrirEditor: 'Открыть в редакторе',
      verSitio: 'Открыть сайт',
      verProyecto: 'Открыть в Проектах',
    },
    progreso: {
      titulo: 'Создание проекта',
      listo: 'Проект создан.',
      fallo: (paso: string) =>
        `Шаг «${paso}» завершился ошибкой. Ничего не удалено: повторите шаг или исправьте причину.`,
      quedo: (partes: string) => `Создано: ${partes}.`,
      quedoCarpeta: 'папка',
      quedoBase: (nombre: string) => `база ${nombre}`,
      quedoSitio: 'сайт',
      avisos: 'Уведомления',
      sinUsuarioPropio:
        'Системное шифрование недоступно: проект использует администратора базы данных. Когда оно станет доступно, используйте «Использовать своего пользователя» в менеджере .env.',
      editorFallo: 'Не удалось открыть редактор.',
    },
  },
  importar: {
    boton: 'Импорт…',
    titulo: 'Импорт из Laragon, XAMPP или Herd',
    intro:
      'Сайты привязываются на месте: папки не перемещаются, не копируются и не изменяются. При желании можно скопировать и их базы данных. WolfCore Dev только читает установки других программ.',
    buscando: 'Поиск установок…',
    nada: 'Laragon, XAMPP и Herd не найдены в стандартных папках.',
    errorVista: 'Не удалось найти доступные для импорта элементы',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Сайты',
      todos: 'Выбрать все',
      ninguno: 'Снять все',
      dominio: (d: string) => `Домен ${d}`,
      dominioPropuesto: (d: string) => `Домен ${d} (предложен)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP не определён',
      base: (nombre: string, motor: string) => `База ${nombre} (${motor})`,
      yaVinculado: 'Уже является сайтом WolfCore Dev',
      dominioEnUso: 'Другой сайт уже использует этот домен',
    },
    avisos: {
      sin_dominio: 'В другой программе нет домена: предложен новый.',
      dominio_invalido: 'Домен недопустим: предложен новый.',
      sin_vhost: 'Нет собственного виртуального хоста: предложен домен.',
      php_desconocido: 'Версия PHP неизвестна: выбрана установленная.',
      base_no_local: 'База находится на другом сервере: не импортируется.',
      base_nombre_invalido: 'Имя базы недопустимо: не импортируется.',
      motor_no_soportado: 'База не является MySQL или MariaDB: не импортируется.',
    },
    problemas: {
      titulo: (n: number) =>
        `${plural(n, 'элемент пропущен или не прочитан', 'элемента пропущены или не прочитаны', 'элементов пропущены или не прочитаны')}`,
    },
    bases: {
      titulo: 'Базы данных',
      importarBases: 'Импортировать также базы данных',
      ayuda:
        'Сначала запустите сервер баз данных другой программы: WolfCore Dev не запускает и не останавливает чужие программы. Пароль используется только для этого импорта и не сохраняется.',
      destino: 'Целевой сервер',
      apagada: 'остановлен',
      sinMotores:
        'Не установлены MySQL или MariaDB: установите их в разделе Службы для импорта баз.',
      puerto: 'Порт исходного сервера',
      usuario: 'Пользователь',
      clave: 'Пароль',
      claveAyuda: 'Оставьте пустым, если у пользователя нет пароля (как у root в Laragon или XAMPP).',
      existe: 'уже существует на целевом сервере',
      reemplazar: 'Заменить (предварительно создаётся копия)',
      noSeToca: 'Не изменяется, если не отмечено.',
    },
    pasos: { elegir: 'Выбор', confirmar: 'Подтверждение' },
    continuar: 'Продолжить',
    volver: 'Назад',
    cancelar: 'Отмена',
    importar: 'Импортировать',
    cerrar: 'Закрыть',
    sinSeleccion: 'Выберите хотя бы один сайт.',
    origenIncompleto: 'Укажите порт и пользователя исходного сервера.',
    confirmar: {
      titulo: 'Подтвердите импорт',
      sitios: (n: number) =>
        `Будет привязано ${plural(n, 'сайт', 'сайта', 'сайтов')} в текущей папке. Файлы не перемещаются, не копируются и не изменяются.`,
      sinConfianza:
        'Ни один импортированный сайт не запускает рецепты, пока вы не отметите «Я доверяю этому репозиторию».',
      hosts:
        'Будут обновлены Nginx и файл hosts (Windows может запросить права администратора).',
      basesNuevas: (nombres: string) => `Будут скопированы базы: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Будут заменены существующие базы: ${nombres}. Перед этим сохраняется резервная копия каждой.`,
      basesSinTocar: (nombres: string) => `Существующие базы останутся без изменений: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Дампы будут сняты с сервера другой программы (127.0.0.1:${puerto}, пользователь ${usuario}). Источник только читается.`,
      sinBases: 'Базы данных не будут импортированы.',
      proteccion:
        'Структура каждой базы проверяется заранее, а данные загружаются ограниченным пользователем: при сбое база останется как была.',
    },
    resultado: {
      titulo: 'Результат импорта',
      importando: 'Импорт…',
      cancelar: 'Отменить импорт',
      restaurada: 'Исходная база автоматически восстановлена из копии: всё осталось как было.',
      sitioOk: 'Импортирован',
      sitioFallo: 'Не импортирован',
      baseOk: (n: string) => `База ${n} импортирована`,
      baseFallo: (n: string) => `База ${n} не импортирована`,
      copiaPrevia: (ruta: string) => `Резервная копия предыдущей базы: ${ruta}`,
      phpDistinto: (v: string) => `Использован PHP ${v} (исходная версия не установлена).`,
      sinAplicar:
        'Nginx или файл hosts не удалось обновить: проверьте уведомление в Проектах и повторите.',
      resumen: (s: number, b: number) =>
        `Импортировано: ${plural(s, 'сайт', 'сайта', 'сайтов')}, ${plural(b, 'база', 'базы', 'баз')}.`,
      errorImportar: 'Не удалось выполнить импорт',
    },
  },
  plantillas: {
    guardarComo: 'Сохранить как шаблон…',
    dialogo: {
      titulo: (nombre: string) => `Сохранить «${nombre}» как шаблон`,
      intro:
        'Шаблон сохраняет рецепт, настройки PHP и Nginx, расширения и схему базы (только структуру, без строк данных). Пароли, ключи и данные базы никогда не сохраняются.',
      nombre: 'Имя шаблона',
      nombrePlaceholder: 'Мой базовый проект',
      conArchivos: 'Включить также файлы проекта',
      conArchivosAyuda: 'Без этого сохраняются только рецепт, настройки и схема.',
      siempre: 'Всегда исключаются',
      siempreLista:
        '.env и .env.*, vendor, node_modules, .git, .venv, журналы, дампы и файловые базы (*.sql, *.dump, *.sqlite), ключи и сертификаты (*.pem, *.key, *.crt…), wp-config.php и wolfcore.yml. Файл с ключом или паролем также исключается.',
      extra: 'Дополнительно исключить (по одному в строке)',
      extraAyuda: 'Имена или относительные пути в проекте, например uploads или public/build.',
      vista: 'Что будет сохранено',
      calculando: 'Подсчёт…',
      resumen: (archivos: number, tamano: string) =>
        `${plural(archivos, 'файл', 'файла', 'файлов')} · ${tamano}`,
      fuera: (n: number) => `исключено: ${n}`,
      sinArchivos: 'Сохранятся только рецепт, настройки и схема; без файлов.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Будет сохранена только структура базы ${nombre} (сервер ${servidor}), без строк данных.`,
      sinBase: 'В проекте не указана база данных: схема сохраняться не будет.',
      avisoMongodb: 'Этот проект использует MongoDB: его схема (коллекции и индексы) не сохраняется.',
      incluirDeTodosModos: 'Всё равно включить',
      avisoIncluir: 'Если этот файл содержит реальный ключ, он попадёт в шаблон.',
      guardar: 'Сохранить шаблон',
      guardada: (nombre: string) => `Шаблон «${nombre}» сохранён.`,
      errorGuardar: 'Не удалось сохранить шаблон',
      errorVista: 'Не удалось подготовить предпросмотр',
      cancelar: 'Отмена',
    },
    lista: {
      titulo: 'Мои шаблоны',
      ayuda:
        'Начните новый проект с рецептом, настройками и схемой (без данных) уже существующего.',
      vacia:
        'Шаблонов пока нет. Сохраните проект как шаблон через меню на его карточке.',
      conArchivosEtiqueta: 'с файлами',
      soloEsquema: 'рецепт и схема',
      conBase: (motor: string) => `база ${motor} без данных`,
      borrarEtiqueta: (nombre: string) => `Удалить шаблон ${nombre}`,
      borrarTitulo: (nombre: string) => `Удалить шаблон ${nombre}?`,
      borrarTexto:
        'Удаляется только шаблон. Созданные по нему проекты и исходный проект не затрагиваются.',
      borrada: 'Шаблон удалён.',
      errorBorrar: 'Не удалось удалить шаблон',
      errorLista: 'Не удалось прочитать шаблоны',
      desde: (nombre: string) => `Шаблон: ${nombre}`,
      avisoSinBase: 'Этот шаблон не содержит базы данных.',
      importadaEtiqueta: 'импортирован',
      avisoImportada:
        'Шаблон получен от третьей стороны: проект создаётся без доверия и без запуска процессов, а открытие сайта выполнит его код. Сначала проверьте файлы.',
      generadoresTitulo: 'Проекты с нуля',
    },
  },
  env: {
    accion: 'Переменные .env…',
    titulo: (nombre: string) => `.env проекта ${nombre}`,
    intro:
      'Секретные значения скрыты. Полное значение показывается только при нажатии «Показать» и снова скрывается через 30 секунд. Перед сохранением создаётся датированная копия текущего .env.',
    noExiste: 'У этого проекта ещё нет файла .env: он будет создан при сохранении.',
    tablaEtiqueta: 'Переменные .env',
    sinVariables: 'В .env нет переменных.',
    secretaEtiqueta: 'секрет',
    duplicadaEtiqueta: 'дубликат',
    duplicadaAyuda:
      'Эта переменная встречается в .env более одного раза: отображается и изменяется последняя.',
    soloLecturaEtiqueta: 'многострочная',
    soloLecturaAyuda: 'Занимает несколько строк: отредактируйте её вручную в файле.',
    seQuitara: 'Будет удалена при сохранении',
    valorNuevo: 'Новое значение',
    valorNuevoDe: (clave: string) => `Новое значение для ${clave}`,
    valorDe: (clave: string) => `Значение ${clave}`,
    vacio: '(пусто)',
    mostrar: 'Показать',
    ocultar: 'Скрыть',
    mostrarEtiqueta: (clave: string) => `Показать значение ${clave}`,
    ocultarEtiqueta: (clave: string) => `Скрыть значение ${clave}`,
    cambiar: 'Изменить',
    deshacer: 'Отменить',
    deshacerEtiqueta: (clave: string) => `Отменить изменение ${clave}`,
    quitar: 'Убрать',
    quitarEtiqueta: (clave: string) => `Убрать переменную ${clave}`,
    errorRevelar: 'Не удалось показать значение',
    agregarTitulo: 'Добавить переменную',
    agregarNombre: 'ИМЯ',
    agregarValor: 'значение',
    agregar: 'Добавить',
    nombreInvalido:
      'Используйте буквы, цифры, подчёркивание и точку (не с цифры); имя не должно повторяться.',
    comparar: {
      titulo: 'Сравнить с файлом примера',
      sinEjemplo: 'В проекте нет .env.example для сравнения.',
      alDia: 'В .env те же переменные, что и в примере.',
      faltan: (n: number) => `Не хватает (${n}):`,
      sobran: (n: number) => `Лишние (${n}, отсутствуют в примере):`,
      distintas: (n: number) => `С другим значением (${n}):`,
      agregarFaltantes: 'Добавить недостающие',
    },
    bloques: {
      titulo: 'Добавить блок переменных',
      ayuda:
        'Добавляет только отсутствующие в .env переменные этой темы (существующие не трогает), без паролей и ключей; заполните их позже в таблице.',
      bd: 'База данных',
      correo: 'Почта',
      ia: 'ИИ',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: 'Использовать своего пользователя',
      ayuda:
        'Создаёт пользователя базы данных только для этого проекта (с правами лишь на его базу, без прав администратора) и записывает его в .env. Сейчас работает с MySQL и MariaDB в WolfCore Dev.',
      confirmarTitulo: 'Использовать отдельного пользователя базы?',
      confirmarTexto:
        'Создаётся новый пользователь со случайным паролем и правами только на базу этого проекта, а логин и пароль обновляются в .env. Предварительно сохраняется копия текущего .env; новый пароль сохраняется в .env проекта и в зашифрованном виде в WolfCore Dev.',
      confirmar: 'Создать и использовать',
      hecho: (usuario: string) => `Теперь проект использует пользователя ${usuario}.`,
      compartirTitulo: 'Использовать пользователя другого проекта?',
      compartirTexto: (base: string, proyecto: string) =>
        `Базу ${base} также использует ${proyecto}. Использовать его пользователя совместно? Этот проект получит те же логин и пароль; пароль не меняется, поэтому ${proyecto} сохранит подключение.`,
      compartir: 'Использовать совместно',
      error: 'Не удалось сменить пользователя базы данных',
    },
    copias: {
      titulo: 'Вернуться к копии',
      ninguna: 'Копий этого .env пока нет.',
      volver: 'Вернуться к этой копии',
      confirmarTitulo: 'Вернуться к копии .env?',
      confirmarTexto: (fecha: string) =>
        `Текущий .env будет заменён копией от ${fecha}. Перед этим сохранится копия текущего файла, так что действие можно отменить.`,
      hecho: 'Копия восстановлена.',
      error: 'Не удалось вернуться к копии',
    },
    cambiosPendientes: (n: number) =>
      plural(n, 'несохранённое изменение', 'несохранённых изменения', 'несохранённых изменений'),
    descartar: 'Отменить изменения',
    guardar: 'Проверить и сохранить…',
    cerrar: 'Закрыть',
    cerrarTitulo: 'Закрыть без сохранения?',
    cerrarTexto: (n: number) =>
      `Есть ${plural(n, 'несохранённое изменение', 'несохранённых изменения', 'несохранённых изменений')}. При закрытии они будут потеряны.`,
    cerrarDescartar: 'Закрыть без сохранения',
    seguirEditando: 'Продолжить редактирование',
    confirmar: {
      titulo: 'Сохранить изменения .env',
      texto:
        'Вот что изменится. Секретные значения скрыты. Перед записью создаётся датированная копия текущего .env, а файл записывается целиком.',
      sinCambios: 'Нет изменений для сохранения.',
      agregarGitignore: 'Добавить .env в .gitignore проекта',
      aceptarVersionado: 'Я понимаю риск и всё равно хочу сохранить',
      guardar: 'Сохранить изменения',
      versionado:
        'Git уже отслеживает .env этого проекта: следующий коммит отправит его значения, даже если он в .gitignore. Уберите его из индекса: git rm --cached .env.',
      versionadoDesconocido:
        'Не удалось проверить, отслеживает ли git .env этого проекта; подтвердите отдельно для сохранения.',
    },
    errorVistaPrevia: 'Не удалось подготовить предпросмотр',
    errorGuardar: 'Не удалось сохранить .env',
    guardado: 'Файл .env сохранён.',
    guardadoConCopia: 'Файл .env сохранён; предыдущая версия оставлена как копия.',
  },
  asistenteInicio: {
    titulo: 'Добро пожаловать в WolfCore Dev',
    subtitulo:
      'Пять шагов для подготовки среды. Ничего не устанавливается и не меняется, пока вы не нажмёте кнопку на соответствующем шаге.',
    paso: (n: number, total: number) => `Шаг ${n} из ${total}`,
    anterior: 'Назад',
    siguiente: 'Далее',
    omitirTodo: 'Пропустить мастер',
    terminar: 'Готово',
    hecho: 'Готово',
    reabrir: 'Вы можете открыть его снова в Настройках.',
    pasos: {
      carpeta: {
        titulo: 'Папка проектов',
        texto:
          'Где хранятся ваши проекты. Сюда клонируются новые репозитории, и эта папка отслеживается на последнем шаге.',
        elegir: 'Выбрать папку',
        actual: (ruta: string) => `Выбрана папка: ${ruta}`,
        guardada: (ruta: string) => `Текущая папка: ${ruta}`,
        ninguna: 'Не выбрана: используется C:\\Proyectos, если существует.',
      },
      basicos: {
        titulo: 'Установить базовое',
        texto:
          'Nginx, PHP 8.4, Composer и Node LTS из официальных источников с проверкой хэша. Каждый компонент устанавливается только по нажатию кнопки.',
        instalado: 'Установлено',
        instalar: (version: string) => `Установить ${version}`,
        sinVersion: 'Нет версии в каталоге',
        cargando: 'Поиск версий…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'Доверять локальному центру сертификации',
        texto:
          'Чтобы сайты .test открывались по HTTPS без уведомлений, Windows должна доверять центру сертификации WolfCore Dev. Windows запросит ваше подтверждение.',
        confiar: 'Доверять CA',
        confiada: 'Windows уже доверяет локальному центру сертификации.',
      },
      github: {
        titulo: 'Подключить GitHub',
        texto:
          'Чтобы просматривать ваши репозитории и клонировать их в один клик. Используйте сессию GitHub CLI или персональный токен, который хранится на этом компьютере в зашифрованном виде.',
      },
      vigilar: {
        titulo: 'Отслеживать папку',
        texto:
          'WolfCore Dev будет предлагать подключить каждую новую папку, появившуюся в папке проектов. Ничего не подключается без вашего подтверждения.',
        activar: 'Отслеживать эту папку',
        activa: (ruta: string) => `Отслеживается ${ruta}`,
        sinCarpeta: 'Сначала выберите папку проектов (шаг 1).',
      },
    },
  },
  /** Результат импорта или экспорта профиля (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Резервные копии и профили',
      descripcion:
        'Профиль переносит ваше окружение на другой компьютер: сайты, версии, экземпляры, шаблоны и настройки. Он никогда не содержит ключи, токены и пароли.',
      aislado: {
        titulo: 'Тестовая папка',
        texto: (ruta: string) =>
          `WolfCore Dev использует тестовую папку данных (${ruta}). Всё, что вы делаете здесь, не затрагивает вашу реальную папку и компьютер: файл hosts не изменяется, а сертификаты не устанавливаются.`,
      },
      exportar: {
        titulo: 'Экспорт окружения',
        texto:
          'Сохраняет файл .wolfperfil с вашими сайтами, версиями, экземплярами, шаблонами и настройками.',
        bases: 'Включить базы данных',
        basesAyuda:
          'Полные дампы (включая данные ваших клиентов) передаются в зашифрованном виде с использованием этой фразы.',
        ca: 'Включить центр сертификации (CA)',
        caAyuda: 'Шифруется с помощью фразы. Импортируйте его только на свой компьютер.',
        certificados: 'Включить сертификаты сайтов',
        certificadosAyuda: 'Передаются только вместе с CA и шифруются вместе с ним.',
        frase: 'Фраза',
        fraseRepetir: 'Повторите фразу',
        fraseAyuda: (minimo: number) =>
          `Минимум ${plural(minimo, 'символ', 'символа', 'символов')}. Без неё невозможно восстановить базы данных и CA, и она нигде не сохраняется.`,
        problemas: {
          frase_corta: (minimo: number) =>
            `Фраза должна содержать не менее ${plural(minimo, 'символа', 'символов', 'символов')}.`,
          frase_distinta: 'Фразы не совпадают.',
          certificados_sin_ca: 'Сертификаты передаются только вместе с CA.',
        },
        exportar: 'Экспортировать профиль…',
        nota: 'Профиль никогда не содержит ключи, токены, пароли, снимки, корзину, резервные копии и папку data.',
        listo: 'Профиль экспортирован',
        guardado: (archivo: string, tamano: string) => `Сохранено в ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Импорт профиля',
        texto:
          'Выберите файл .wolfperfil. Перед внесением каких-либо изменений вы увидите всё, что будет заменено, исключено или отложено, а для заменяемых данных будет создана резервная копия.',
        boton: 'Импортировать профиль…',
      },
      instantaneas: {
        titulo: 'Снимки окружения',
        texto:
          'Перед обновлением PHP или Nginx и перед импортом профиля WolfCore Dev сохраняет копию вашей конфигурации, настроек Nginx и файлов php.ini — без ключей и данных, только для вас. Хранятся последние 10 снимков.',
        compartidas:
          'Все 10 слотов общие для всех причин: при создании нового снимка самый старый заменяется, даже если он был создан вручную.',
        tomar: 'Создать сейчас',
        tomada: 'Снимок сохранён.',
        sinNada: 'Пока нечего копировать.',
        vacia: 'Снимков пока нет.',
        motivos: {
          actualizar: 'Перед обновлением',
          'importar-perfil': 'Перед импортом профиля',
          'limpiar-versiones': 'Перед очисткой версий',
          manual: 'Вручную',
        },
      },
    },
    reasignar: {
      titulo: 'Папки сайтов',
      texto:
        'Эти папки перенесены с другого компьютера. Укажите, где они находятся на этом компьютере, или импортируйте сайт как отложенный: он останется без папки, пока вы её не выберете.',
      sitio: 'Сайт',
      origen: 'Папка в профиле',
      destino: 'Папка на этом компьютере',
      existe: 'Существует',
      noExiste: 'Не существует на этом компьютере',
      buscar: 'Выбрать папку…',
      cambiar: 'Изменить',
      comoPendiente: 'Импортировать как отложенный',
      prefijo: (viejo: string, nuevo: string) =>
        `Применить ту же замену к остальным (${viejo} → ${nuevo})`,
      omitido: 'Не будет импортирован',
    },
    asistente: {
      titulo: 'Импорт профиля',
      pasos: {
        archivo: 'Файл',
        revisar: 'Проверка',
        confirmar: 'Подтверждение',
        resultado: 'Результат',
      },
      archivo: {
        texto:
          'Выберите файл .wolfperfil. Пока ничего не изменяется: сначала вы увидите, что будет заменено, исключено или отложено.',
        elegir: 'Выбрать файл…',
        cambiar: 'Выбрать другой',
        ninguno: 'Файл не выбран',
        leyendo: 'Чтение профиля…',
        error: 'Не удалось прочитать профиль',
      },
      origen: (fecha: string, sistema: string) => `Создано ${fecha} в ${sistema}.`,
      ignoradas: (n: number) =>
        `${plural(n, 'запись файла не относится к профилю и будет пропущена', 'записи файла не относятся к профилю и будут пропущены', 'записей файла не относятся к профилю и будут пропущены')}.`,
      reemplaza: {
        titulo: 'Что будет заменено',
        ninguno: 'В этой папке нет данных: импорт выполняется на чистую установку.',
        copia:
          'Перед заменой данные копируются в respaldos/pre-perfil-… и создаётся снимок окружения; для каждой заменяемой базы данных делается отдельный снимок. Папка data никогда не удаляется.',
        config: 'Конфигурация (config.json)',
        sitio: (id: string) => `Сайт ${id}`,
        base: (instancia: string, base: string) => `База данных ${base} (${instancia})`,
        plantilla: (id: string) => `Шаблон ${id}`,
        ca: 'Центр сертификации (CA) этого компьютера',
      },
      versiones: {
        titulo: 'Версии',
        ninguna: 'Профиль не содержит версий.',
        instalada: 'Уже установлена',
        descargar: 'Будет загружена с проверкой отпечатка',
        pendienteDebil: 'Отложено: нет надёжного отпечатка, установите вручную',
        pendienteFuera: 'Отложено: больше нет в каталоге',
        huellas: {
          fuerte: 'Отпечаток SHA-256 или SHA-512',
          firmada: 'Подписано',
          debil: 'Слабый отпечаток',
          ninguna: 'Без отпечатка',
        },
        descargas: (n: number) =>
          `${plural(n, 'версия будет загружена', 'версии будут загружены', 'версий будут загружены')} с официальных сайтов, каждая с проверкой отпечатка или подписи.`,
      },
      instancias: {
        titulo: 'Экземпляры баз данных',
        existente: 'Уже существует: сохраняется со своим портом и версией',
        nueva: (puerto: number) => `Будет создан с новыми учётными данными на порту ${puerto}`,
        reasignada: (de: number, a: number) => `Порт ${de} занят: будет использован порт ${a}`,
      },
      bases: {
        titulo: 'Базы данных',
        ninguna: 'Профиль не содержит баз данных.',
        texto:
          'Восстанавливаются под пользователем, ограниченным конкретной базой, и только с разрешёнными инструкциями. Для уже существующих баз предварительно создаётся резервная копия.',
        omitir: 'Импортировать без баз данных',
      },
      plantillas: {
        titulo: 'Шаблоны',
        existe: 'Уже существует: будет заменён',
        nueva: 'Новый',
      },
      workspaces: {
        titulo: 'Рабочие пространства',
        texto:
          'Содержат только ссылки на базы данных и службы (процессы проектов не переносятся). Проверяются на соответствие существующим здесь ресурсам и никогда не запускаются автоматически.',
        existe: 'У вас уже есть рабочее пространство с таким же id: сохраняется ваше',
        nuevo: 'Новое',
        elementos: (n: number) => plural(n, 'элемент', 'элемента', 'элементов'),
        invalidos: (n: number) =>
          `${plural(n, 'рабочее пространство из профиля некорректно и не будет импортировано', 'рабочих пространства из профиля некорректны и не будут импортированы', 'рабочих пространств из профиля некорректны и не будут импортированы')}.`,
      },
      quitado: {
        titulo: 'Что не берётся из конфигурации',
        texto:
          'Эта папка данных чиста: из профиля не берутся настройки, указывающие за пределы этого компьютера.',
      },
      puertos: {
        titulo: 'Занятые порты',
        texto: (lista: string) =>
          `Эти порты из профиля уже используются другой программой на этом компьютере: ${lista}. Измените их в разделе «Службы» после импорта.`,
      },
      ca: {
        titulo: 'Центр сертификации (CA)',
        texto:
          'Профиль содержит зашифрованный CA. Импортируйте его, только если он ваш: этот компьютер будет доверять сертификатам, подписанным им.',
        huella: 'Отпечаток SHA-256 центра сертификации (CA) профиля',
        comparar: 'Сравните его с отпечатком на исходном компьютере перед принятием.',
        importar: 'Импортировать CA из профиля',
        noImportar: 'Без импорта этот компьютер использует свой текущий CA или создаст новый.',
        ajena:
          'У этого CA ограничения по именам не принадлежат WolfCore Dev: его нельзя импортировать.',
        sinRestricciones:
          'У этого CA нет ограничений по именам: он может подписывать сертификаты для любых веб-сайтов, включая банки и почту. Импортируйте его, только если он ваш и отпечаток совпадает.',
        aceptarSin: 'Я понимаю риск: это мой CA и отпечаток совпадает',
        reemplazaLocal:
          'На этом компьютере уже есть CA. Импорт CA из профиля заменит его (копия сохранится в предварительной резервной копии).',
        reemplazar: 'Заменить CA на этом компьютере',
        noSeInstala: 'CA не устанавливается автоматически в системное хранилище сертификатов.',
      },
      frase: {
        titulo: 'Фраза профиля',
        texto: 'Профиль содержит зашифрованные базы данных или CA. Введите фразу, выбранную при экспорте.',
        campo: 'Фраза',
        omitirBases: 'Импортировать без баз данных',
        nota: 'Фраза используется только в этом окне: она не сохраняется и стирается после завершения или закрытия.',
      },
      env: {
        titulo: 'Подключение проектов',
        texto:
          'Отметьте проекты, чей .env должен указывать на нового отдельного пользователя их базы данных (с предварительным созданием копии .env). Остальные не изменяются и остаются в отчёте.',
      },
      confirmar: {
        titulo: 'Подтверждение импорта',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Будет импортировано: ${plural(sitios, 'сайт', 'сайта', 'сайтов')}, ${plural(versiones, 'версия', 'версии', 'версий')} и ${plural(bases, 'база данных', 'базы данных', 'баз данных')}.`,
        importar: 'Импортировать',
        revisar: 'Проверить',
        volver: 'Назад',
        bloqueos: {
          sitios_sin_carpeta:
            'Выберите папку для каждого сайта или отметьте его для импорта как отложенного.',
          frase_requerida: 'Введите фразу профиля или выполните импорт без баз данных.',
          ca_ajena: 'CA из профиля невозможно импортировать.',
          ca_sin_restricciones: 'Подтвердите отдельно, что хотите импортировать CA без ограничений.',
          reemplazar_ca: 'Подтвердите отдельно, что хотите заменить CA этого компьютера.',
        },
      },
      progreso: 'Импорт профиля… Не закрывайте окно: при наличии баз данных или загрузок это может занять время.',
      fases: {
        copia: 'Копирование заменяемых данных',
        versiones: 'Установка версий',
        configuracion: 'Сохранение конфигурации и сайтов',
        plantillas: 'Копирование шаблонов',
        ca: 'Подготовка CA и сертификатов',
        bases: 'Восстановление баз данных',
        env: 'Перезапись файлов .env',
      },
      avance: (paso: number, de: number) => `Шаг ${paso} из ${de}`,
      resultado: {
        titulo: 'Результат импорта',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `Импортировано: ${importados}, в ожидании: ${pendientes}, пропущено: ${omitidos}, с ошибкой: ${errores}.`,
        respaldo: (ruta: string) => `Резервная копия заменённых данных: ${ruta}`,
        pendientes: 'Отложенные элементы можно завершить вручную.',
        error: 'Не удалось импортировать профиль',
        secciones: {
          sitios: 'Сайты',
          versiones: 'Версии',
          instancias: 'Экземпляры',
          bases: 'Базы данных',
          plantillas: 'Шаблоны',
          workspaces: 'Рабочие пространства',
          env: 'Файлы .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Импортировано',
          pendiente: 'В ожидании',
          omitido: 'Пропущено',
          error: 'Ошибка',
          instalada: 'Установлена',
          ya_instalada: 'Уже была установлена',
          creada: 'Создан',
          existente: 'Уже существовал',
          puerto_reasignado: 'Порт переназначен',
          reescrito: 'Перезаписан',
          sin_marcar: 'Не отмечено',
        },
        ca: {
          importada: 'CA импортирован',
          nueva: 'Создан новый CA',
          sin_cambios: 'CA не изменился',
        },
        quitarCa: {
          boton: 'Удалить прежний CA…',
          titulo: 'Удалить прежний CA из доверенных',
          texto:
            'Прежний CA этого компьютера будет удалён из системного хранилища сертификатов. Windows может запросить подтверждение. Новый CA не устанавливается автоматически.',
          si: 'Удалить',
          hecho: 'Прежний CA удалён из доверенных.',
        },
        descartadosWorkspace: (lista: string) => `Не существует здесь и удалено: ${lista}`,
        workspacesInvalidos: (n: number) =>
          `${plural(n, 'некорректное рабочее пространство не было импортировано', 'некорректных рабочих пространства не были импортированы', 'некорректных рабочих пространств не было импортировано')}.`,
        puerto: (de: number, a: number) => `Порт ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Копия .env: ${ruta}`,
      },
    },
    /** Строгое уведомление предпросмотра: у CA профиля нет ограничений по именам. */
    caSinRestricciones:
      'Этот CA может подписывать сертификаты для любого веб-сайта; импортируйте его, только если он ваш, и сверьте отпечаток.',
    motivos: {
      procesos_quitados: 'Ваши процессы (команды с другого компьютера) не были импортированы.',
      tareas_quitadas:
        'Ваши запланированные задачи (команды с другого компьютера) не были импортированы. Создайте их заново или импортируйте из wolfcore.yml.',
      tunel_con_nombre: 'Ваш именованный туннель не переносится: используется быстрый туннель.',
      php_ini: 'Некоторые настройки php.ini не были импортированы.',
      xdebug: 'Ваша настройка Xdebug была некорректной и была удалена.',
      nginx_desactivado:
        'Ваши правила Nginx сохранены, но не применены: проверьте их в редакторе.',
      carpeta_no_existe: 'Эта папка не существует на данном компьютере: укажите её расположение.',
      correo_sin_proveedor: 'Ваш SMTP-провайдер не был импортирован: используется перехватчик почты.',
      sitio_invalido: 'Сайт некорректен.',
      dominio_invalido: 'Домен некорректен (должен заканчиваться на .test).',
      ruta_protegida: 'Папка является системной или принадлежит WolfCore Dev: не импортируется.',
      dominio_en_uso: 'Другой сайт на этом компьютере уже использует этот домен.',
      sitio_repetido: 'Сайт дублируется в профиле.',
      no_disponible: 'Эта версия больше отсутствует в каталоге.',
      huella_debil: 'У этой версии нет надёжного отпечатка: установите её вручную в разделе «Версии».',
      tope_descargas:
        'Загрузка не выполнена, чтобы не запускать слишком много загрузок одновременно: установите её в разделе «Версии».',
      instancia_pendiente: 'Экземпляр остался в ожидании.',
      motor_no_soportado: 'Этот движок не импортируется из профиля.',
      version_pendiente: 'Версия движка осталась в ожидании.',
      danada: 'Файлы в профиле повреждены.',
      bases_omitidas: 'Импортировано без баз данных.',
      instancia_apagada: 'Не удалось запустить экземпляр.',
      sin_copia_previa: 'Не удалось создать предварительный снимок: база данных не была заменена.',
      sin_base: 'Ваш .env не указывает на локальную базу данных.',
      base_no_resuelta: 'Не удалось определить, какому экземпляру принадлежит база данных.',
      error_inesperado: 'Произошла ошибка.',
    },
    avisos: {
      ca_reemplazada:
        'Прежний CA этого компьютера всё ещё находится в системном хранилище доверенных сертификатов и больше не используется. Вы можете удалить его отсюда.',
      base_no_incluida: 'База данных {base} ({instancia}) не была включена.',
      sin_ca: 'На этом компьютере нет CA: профиль сохраняется без него.',
      ca_no_importada: 'CA из профиля не был импортирован: используется CA этого компьютера или создаётся новый.',
      certificados: 'Не удалось подготовить сертификаты: {detalle}',
      aplicar:
        'Импортированные сайты были применены не полностью (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Провайдер ИИ {id}: использует собственный URL.',
      smtp: 'SMTP-провайдер {id}: его хост не принадлежит известному провайдеру или отсутствует имя пользователя.',
      puerto: 'Порт {id}: вне допустимого диапазона, возвращён стандартный.',
      carpeta_vigilada: 'Отслеживаемая папка относится к другому компьютеру.',
    },
  },
};
