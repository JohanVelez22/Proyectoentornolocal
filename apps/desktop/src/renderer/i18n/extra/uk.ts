import type { TextosParciales } from '../es';

const pr = new Intl.PluralRules('uk');
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
export const ukExtra: TextosParciales = {
  app: {
    lema: 'Ваше локальне середовище, готове до роботи',
  },
  resumenGlobal: {
    cortoApagado: 'Усе вимкнено',
    cortoEncendidos: (n: number) => `${n} запущено`,
    cortoErrores: (n: number) => plural(n, 'з помилкою', 'з помилками', 'з помилками'),
    cortoCargando: 'Підключення…',
    cortoSinConexion: "Немає зв'язку",
    irAServicios: 'Відкрити «Служби»',
  },
  acciones: {
    copiarCompleto: 'Копіювати весь текст',
  },
  errores: {
    codigos: {
      'servicios.no_encendio':
        '{nombre} не вдалося запустити. Перевірте розділ «Служби» та журнали служби.',
      'tuneles.sitio_no_confiable':
        'Сайту {dominio} ще не довіряють: позначте «Я довіряю цьому репозиторію» в проєкті, перш ніж його публікувати.',
      'clientehttp.peticion_invalida': 'Недопустимі дані в запиті: {campo}.',
      'clientehttp.variable_sin_definir': 'Змінну «{nombre}» не визначено в активному середовищі.',
      'clientehttp.secreto_faltante':
        'Відсутнє збережене секретне значення: введіть його знову та збережіть запит або середовище.',
      'clientehttp.secreto_no_guardado':
        'Не вдалося зберегти секретне значення: воно не може містити розривів рядків чи перевищувати 16 КБ, а шифрування системи має бути доступним.',
      'clientehttp.url_invalida': 'Недопустимий URL.',
      'clientehttp.url_con_credenciales':
        'В URL не можна вказувати користувача чи пароль: скористайтеся вкладкою автентифікації.',
      'clientehttp.protocolo': 'Приймаються лише URL з http:// та https://.',
      'clientehttp.cabecera_invalida': 'Недопустимий заголовок «{nombre}».',
      'clientehttp.cuerpo_grande': 'Тіло запиту перевищує 1 МБ.',
      'clientehttp.plazo': 'Запит перевищив тайм-аут {segundos} с.',
      'clientehttp.cancelado': 'Запит скасовано.',
      'clientehttp.sin_conexion':
        'Не вдалося підключитися ({motivo}). Перевірте адресу, порт і те, що сервер запущено.',
      'clientehttp.certificado': 'Не вдалося перевірити сертифікат сервера ({motivo}).',
      'clientehttp.demasiadas_redirecciones': 'Понад {max} перенаправлень поспіль.',
      'clientehttp.curl_invalido': 'Цей текст не є коректною командою curl.',
      'clientehttp.curl_grande': 'Текст curl завеликий (не більше 64 КБ).',
      'clientehttp.no_existe': 'Елемента більше не існує.',
      'clientehttp.limite': 'Досягнуто ліміту збережених елементів.',
      'ejemplohttp.no_arranca': 'Не вдалося запустити приклад сервера.',
      'laboratoriogit.sin_git': "На цьому комп'ютері не встановлено Git.",
      'laboratoriogit.orden_invalida': 'Цієї команди немає в списку лабораторії.',
      'laboratoriogit.nombre_invalido':
        'Назва може містити лише літери, цифри, дефіси та підкреслення (до 30 символів).',
      'laboratoriogit.mensaje_invalido':
        'Повідомлення має бути в один рядок, не довше 200 символів і не починатися з «-».',
      'laboratoriogit.archivo_invalido': 'Цей файл не належить до навчальних файлів.',
      'laboratoriogit.contenido_invalido': 'Вміст має бути текстом до 2000 символів.',
      'laboratoriogit.ruta_insegura':
        'Папка лабораторії не та, що очікувалася, тому її не чіпаємо.',
      'laboratoriogit.fallo_sistema':
        'Система не дозволила підготувати чи використати папку лабораторії. Спробуйте «Скинути лабораторію».',
      'buscar.ruta_vetada':
        'У цій папці зберігаються дані WolfCore Dev: пошук у ній не виконується.',
      'buscar.resultado_caducado': 'Цей результат більше недоступний: повторіть пошук.',
      'buscar.resultado_invalido': 'Цей результат не можна відкрити.',
      'diff.raiz_invalida': 'Виберіть дві наявні папки, які не є посиланнями.',
      'diff.ruta_vetada': 'У цій папці зберігаються дані WolfCore Dev: її не порівнюють.',
      'diff.cancelado': 'Порівняння скасовано.',
      'diff.plazo': 'Порівняння тривало понад {segundos} с і було скасовано.',
      'diff.memoria': "Для порівняння потрібно забагато пам'яті (понад {maximo}), його скасовано.",
      'diff.ocupado': 'Порівняння вже виконується: скасуйте його або зачекайте.',
      'diff.caducado': 'Це порівняння більше недоступне: виконайте його знову.',
      'diff.archivo_invalido': 'Цей файл більше не можна порівняти: він змінився або зник.',
      'diff.fallo': 'Порівняння завершилося помилкою.',
      'compartir.confirmacion_requerida':
        'Публікацію в інтернеті потрібно підтвердити у вікні WolfCore Dev.',
      'compartir.ocupado': 'Щось уже опубліковано: спочатку зупиніть спільний доступ.',
      'compartir.ruta_invalida': 'Виберіть наявну папку або файл.',
      'compartir.duracion_invalida': 'Виберіть 15 хвилин, 1 годину або 4 години.',
      'compartir.proveedor_invalido':
        'Цей тунель не підтримується: використовуйте Cloudflare або ngrok.',
      'compartir.raiz_unidad': 'Корінь диска не публікується. Виберіть папку всередині нього.',
      'compartir.carpeta_usuario':
        'Уся особиста папка (або папка, що її містить) не публікується. Виберіть вкладену папку.',
      'compartir.carpeta_datos': 'Папка даних WolfCore Dev не публікується.',
      'compartir.sitio_datos_reales':
        'Сайт зі справжніми даними (або будь-що всередині нього) не публікується.',
      'compartir.carpeta_secretos':
        'У цій папці зберігаються ключі (.ssh, .aws, .git…), вона не публікується.',
      'compartir.carpeta_sistema': 'Системні папки не публікуються.',
      'compartir.archivo_sensible':
        'Схоже, цей файл містить секрет або справжні дані, тому він не публікується.',
      'compartir.carpeta_perfil':
        'Дані програм користувача (AppData, .claude, .config…) не публікуються.',
      'compartir.archivo_grande':
        'Цей файл завеликий для перевірки та не є медіафайлом чи пакетом: він не публікується.',
      'compartir.tunel_sin_url':
        'Тунель не повідомив свою адресу за {segundos} с. Повторіть спробу.',
      'compartir.tunel_cerrado': 'Тунель закрився, не встигнувши відкритися.',
      'compartir.fallo': 'Не вдалося опублікувати.',
      'disco.raiz_invalida': 'Виберіть наявну папку або диск, доступні для читання.',
      'disco.cancelado': 'Аналіз скасовано.',
      'disco.plazo': 'Аналіз тривав понад {minutos} хв і був скасований.',
      'disco.memoria': "Для аналізу потрібно забагато пам'яті (понад {maximo}).",
      'disco.ocupado': 'Аналіз уже виконується: скасуйте його або зачекайте.',
      'disco.caducado': 'Цей аналіз більше недоступний: виконайте його знову.',
      'disco.entrada_invalida': 'Цієї папки вже немає або вона змінилася: виконайте аналіз знову.',
      'disco.fallo': 'Аналіз завершився помилкою.',
      'reverb.no_laravel': 'Reverb доступний лише в проєктах Laravel.',
      'reverb.no_confiado':
        'Позначте «Я довіряю цьому репозиторію» в проєкті, щоб увімкнути Reverb.',
      'reverb.sin_paquete':
        'Відсутній пакет laravel/reverb: встановіть його командою composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Підтвердьте, що хочете увімкнути Reverb.',
      'reverb.sin_activar': 'Спочатку ввімкніть Reverb у проєкті.',
      'env.meilisearch_no_disponible':
        'Meilisearch не встановлено: встановіть його в розділі «Служби».',
      'bd.lentas_confirmar':
        'Зміна журналу повільних запитів впливає на весь сервер: потрібне підтвердження. Нічого не змінено.',
      'bd.lentas_umbral_invalido': 'Час має бути від 0,1 до 60 секунд.',
      'bd.lentas_motor_no_soportado':
        'Повільні запити можна змінювати лише в MySQL, MariaDB і PostgreSQL, якими керує WolfCore Dev.',
      'bd.lentas_literal_no_permitido':
        'SQL не показується зі значеннями: у базі даних справжні дані або запит не можна віднести до відомої бази даних.',
      'bd.lentas_entrada_no_existe': 'Цього запиту вже немає в журналі. Прочитайте його знову.',
      'bd.lentas_fallo':
        'Не вдалося прочитати чи змінити журнал повільних запитів. Перевірте, що сервер запущено.',
      'bd.esquema_base_no_existe': 'Такої бази даних немає на цьому сервері.',
      'bd.esquema_motor_no_soportado':
        'Перегляд схеми призначений для MySQL, MariaDB і PostgreSQL.',
      'bd.esquema_lectura_fallo':
        'Не вдалося прочитати схему бази даних. Перевірте, що сервер запущено.',
      'captura.atajo_invalido':
        'Недопустиме поєднання клавіш: використовуйте Ctrl, Alt, Shift або Super з літерою, цифрою чи клавішею F.',
      'captura.atajo_no_permitido':
        'Це поєднання не дозволено: використовуйте Ctrl або Super з іншим модифікатором (Ctrl+Alt без Shift — це AltGr і заважає введенню @) та уникайте поширених поєднань, як-от Ctrl+C чи Alt+F4.',
      'captura.atajo_ocupado': 'Поєднання {atajo} уже використовує інша програма.',
      'captura.no_disponible': "Захоплення екрана недоступне на цьому комп'ютері.",
      'captura.permiso_denegado': 'Немає дозволу на запис екрана.',
      'captura.sin_imagen': 'Немає зображення для захоплення.',
      'captura.imagen_invalida': 'Недопустиме зображення захоплення.',
      'disco.sin_confirmar': 'Підтвердьте очищення в діалозі, перш ніж продовжити.',
      'disco.categoria_invalida': 'Такої категорії очищення не існує.',
      'disco.ruta_vetada':
        'Категорія зачіпає захищений шлях (дані, резервні копії, проєкти чи FlyEnv); нічого не очищено.',
      'disco.sin_analisis':
        'Виконайте аналіз знову перед очищенням: аналіз застарів або відсутній.',
      'disco.ocupada': 'Аналіз або очищення вже виконуються.',
      'disco.sin_registro': 'Не вдалося створити журнал очищення; нічого не видалено.',
      'editor.sin_confirmar': 'Підтвердьте збереження, перш ніж продовжити.',
      'editor.confirmacion_reforzada':
        'Схоже, цей файл містить секрети або належить сайту зі справжніми даними: для збереження підтвердьте додатковою перевіркою.',
      'editor.ruta_invalida': 'Недопустимий шлях до файлу.',
      'editor.no_existe': 'Файл не існує.',
      'editor.no_regular': 'Редагувати можна лише звичайні файли.',
      'editor.ruta_vetada':
        'Цей файл розташований у папці даних WolfCore Dev: його не можна відкрити чи зберегти з редактора.',
      'editor.archivo_env': 'Файлами .env керують через змінні проєкту, а не через редактор.',
      'editor.demasiado_grande': 'Файл завеликий для редактора (максимум {maximo}).',
      'editor.binario': 'Файл не є текстовим (він двійковий): тут його не можна редагувати.',
      'editor.codificacion':
        'Файл не в кодуванні UTF-8: редактор не відкриває його, щоб не пошкодити.',
      'editor.no_abierto':
        'Цей файл не було відкрито в редакторі (або його версія змінилася): відкрийте його знову.',
      'editor.eol_mixto':
        'У файлі змішані різні закінчення рядків: для збереження підтвердьте їх нормалізацію.',
      'editor.contenido_invalido': 'Вміст не є допустимим текстом.',
      'editor.huella_invalida': 'Відсутній відбиток відкритого файлу: відкрийте його знову.',
      'editor.archivo_cambiado':
        'Файл змінився поза редактором із моменту відкриття. Перезавантажте його або підтвердьте перезапис.',
      'editor.copia_fallo': 'Не вдалося створити резервну копію ({codigo}); нічого не збережено.',
      'editor.lectura_fallo': 'Не вдалося прочитати файл ({codigo}).',
      'editor.escritura_fallo': 'Не вдалося зберегти файл ({codigo}). Оригінал не чіпали.',
      'memoria.sin_confirmar': 'Підтвердьте дію в діалозі, перш ніж продовжити.',
      'memoria.modo_invalido': 'Такого режиму оптимізації не існує.',
      'memoria.plan_caducado':
        'Список застарів або перестав бути актуальним. Покажіть його знову перед застосуванням.',
      'memoria.no_disponible':
        "Оптимізатор пам'яті тут недоступний або не зміг прочитати дані системи.",
      'conversor.ocupado': 'Одне перетворення вже виконується, інше очікує: зачекайте завершення.',
      'doctor.firewall_reglas_acotadas':
        'Правил для програм WolfCore Dev, обмежених локальною мережею: {cantidad} (лише приватний профіль, локальна підмережа та певні порти), як ті, що застосунок сам рекомендує для публікації сайту. Їх лише показано: звідси вони не видаляються.',
      'doctor.firewall_almacen_inseguro':
        'Захищеній копії правил не можна довіряти (права або вміст відрізняються від показаного): жодного правила не створено й не змінено.',
      'doctor.firewall_quitadas':
        'Раніше WolfCore Dev видалив правила брандмауера ({cantidad}) і зберіг копію: за потреби їх можна створити знову.',
      'doctor.firewall_parcial':
        'Частину правил видалено, а інші ні: вони змінилися після показу списку, не належали WolfCore Dev або Windows не дозволила їх видалити. Перевірте список.',
      'doctor.firewall_sin_cambios':
        'Жодного правила не змінено: вони більше не збігаються з показаними або їх не вдалося змінити.',
      'doctor.firewall_registro_fallido':
        'Не вдалося зберегти копію правил у захищеному розділі реєстру HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos: нічого не змінено.',
      'catalogo.paquete_invalido':
        'Завантажений пакет небезпечний (шляхи поза папкою, посилання або надмірний розмір).',
      'catalogo.extraccion_fallo': 'Не вдалося прочитати чи розпакувати завантажений пакет .7z.',
      'runtimes.falta_runtime':
        '{nombre} не встановлено для цього проєкту: встановіть його в розділі «Служби».',
      'runtimes.falta_jdk':
        'Для цього проєкту не встановлено JDK: встановіть Java в розділі «Служби».',
      'runtimes.instalacion_incompleta':
        'Установлення {nombre} неповне: перевстановіть його в розділі «Служби».',
      'procesos.escucha_publica':
        'Процес слухає {direccion}:{puerto} ({programa}) і відкритий для мережі. Його зупинено: слухати можна лише 127.0.0.1.',
      'procesos.escucha_publica_livereload':
        'Процес слухає {direccion}:{puerto} ({programa}) і відкритий для мережі. Його зупинено: слухати можна лише 127.0.0.1. Це LiveReload зі Spring DevTools: вимкніть його через spring.devtools.livereload.enabled=false.',
      'procesos.escucha_publica_inspector':
        'Процес слухає {direccion}:{puerto} ({programa}) і відкритий для мережі. Його зупинено: слухати можна лише 127.0.0.1. Це інспектор Node: використовуйте --inspect=127.0.0.1.',
    },
  },
  inicio: {
    servicios: {
      irA: (nombre: string) => `Перейти до служби ${nombre}`,
    },
    tuneles: {
      irA: (nombre: string) => `Перейти до проєкту ${nombre}`,
    },
  },
  servicios: {
    borrarDatos: {
      que: {
        meilisearch: 'усі індекси Meilisearch',
      },
    },
    sinParaEncender: 'Немає встановлених служб для запуску',
    franjaExternos: {
      texto: 'Ви ще не встановили вебсервер або PHP. Зовнішні рушії виявлено автоматично.',
      accion: 'Встановити Nginx і PHP',
    },
    externos: {
      titulo: "Виявлено на вашому комп'ютері",
      ayuda: 'Ними керує інша програма; WolfCore Dev лише показує їх.',
    },
    ftp: {
      redLocalAyuda:
        "Коли вимкнено, підключитися можна лише з цього комп'ютера (127.0.0.1). Доступ кожного проєкту вмикається в розділі «Проєкти».",
      compartir: {
        enlace: 'Поділитися папкою або файлом…',
        ayuda:
          'FTP не публікується через тунель: він не зашифрований, а тунель передає лише HTTP. Щоб опублікувати щось в інтернеті, скористайтеся «Поділитися папкою або файлом» (HTTP, лише читання); FTP залишається в локальній мережі.',
      },
    },
    datosConexion: 'Дані підключення',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Підключення до Meilisearch',
      notaMeilisearch:
        "Щоб використовувати його в проєкті: «Змінні (.env)» → «Додати блок» → Meilisearch. Показується попередній перегляд із замаскованим ключем, потрібне підтвердження. Ключ належить лише цьому комп'ютеру.",
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Пошук для Laravel Scout (github.com/meilisearch)',
      },
    },
  },
  tunel: {
    sinConfianza:
      'Цьому проєкту не довіряють: позначте «Я довіряю цьому репозиторію», щоб його можна було опублікувати.',
  },
  tuneles: {
    irAProyectos: 'Перейти до проєктів',
    compartir: {
      enlace: 'Поділитися папкою або файлом…',
      ayuda: 'Публікує папку або один файл (лише читання) без потреби в сайті.',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'У процесу Reverb цього проєкту немає команди WolfCore Dev (інший хост, програма чи порт). Увімкнення замінить його стандартним, який слухає лише 127.0.0.1.',
    ayuda: 'Laravel WebSockets, лише на 127.0.0.1.',
    puerto: (p: number) => 'Порт {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) =>
      'Увімкнути чи вимкнути Reverb для {d}'.replace('{d}', dominio),
    activarTitulo: 'Увімкнути Reverb?',
    activarTexto: (dominio: string) =>
      'У {d} буде запущено команду «php artisan reverb:start», яка слухає лише 127.0.0.1 на вільному порту. Код проєкту виконується з його PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Вимкнути Reverb?',
    desactivarTexto:
      'Процес зупиняється й видаляється з проєкту. Змінні REVERB_* у .env не чіпаються.',
    activar: 'Увімкнути',
    desactivar: 'Вимкнути',
    proponer: 'Запропонувати змінні REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Зупинено',
      iniciando: 'Запускається',
      encendido: 'Працює',
      error: 'Збій',
    },
  },
  ftpSitio: {
    compartirNota:
      'FTP призначений лише для локальної мережі: він не публікується через тунель в інтернеті, бо передає пароль і файли без шифрування.',
    compartirIr: 'Поділитися папкою або файлом за тимчасовим посиланням',
  },
  ia: {
    pestanas: {
      etiqueta: 'Розділи ШІ',
      agentes: 'Агенти',
      nube: 'Хмара',
      local: 'Локальні моделі',
    },
  },
  iaLocal: {
    compat: {
      sugerenciaVram: 'Для вашого комп’ютера: моделі до ≈{b}B, що вміщуються в пам’ять відеокарти.',
      sugerenciaRam: 'Для вашого комп’ютера: моделі до ≈{b}B, що працюють в оперативній пам’яті.',
      sugerenciaPequena: 'Для вашого комп’ютера: лише дуже малі моделі (менше 1B).',
      sugerenciaDesconocida:
        'Не вдалося прочитати обладнання вашого комп’ютера, тому рекомендації немає.',
      aviso: 'Це лише орієнтир: ви можете завантажити будь-яку модель.',
      comprobando: 'Перевіряємо ваш комп’ютер…',
      niveles: {
        recomendado: 'Рекомендовано',
        lento: 'Може працювати повільно',
        'no-cabe': 'Не вміщується',
        desconocido: 'Немає даних',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'Вільно вміщується в пам’ять відеокарти (потрібно ≈{necesario} із {disponible}).',
        'justo-vram':
          'Вміщується у відеокарту, але впритул (потрібно ≈{necesario} із {disponible}).',
        'solo-ram':
          'Не вміщується у відеокарту й працюватиме в оперативній пам’яті (потрібно ≈{necesario} із {disponible} доступних): повільніше.',
        'cabe-ram':
          'Вільно вміщується в оперативну пам’ять (потрібно ≈{necesario} із {disponible} доступних).',
        'ram-justo':
          'Вміщується в оперативну пам’ять, але впритул (потрібно ≈{necesario} із {disponible} доступних): може працювати повільно.',
        'sin-memoria':
          'Потрібно ≈{necesario} пам’яті, а на вашому комп’ютері доступно ≈{disponible}.',
        'sin-disco':
          'На диску недостатньо вільного місця для завантаження (залишилось {disponible}).',
        'tamano-desconocido':
          'Не вдалося дізнатися розмір моделі (немає з’єднання з реєстром Ollama).',
        'equipo-desconocido': 'Не вдалося прочитати обсяг пам’яті вашого комп’ютера.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'Завантаження можна скасувати будь-коли; те, що вже завантажено, буде видалено.',
      tamano: (t: string) => `Розмір завантаження: ${t}.`,
      tamanoDesconocido:
        "Не вдалося визначити розмір (немає зв'язку з реєстром Ollama). Моделі зазвичай займають від 1 до понад 40 ГБ.",
      libre: (l: string) => `Вільне місце на диску моделей: ${l}.`,
      libreDesconocido: 'Не вдалося виміряти вільне місце на диску.',
      sinEspacio: (t: string, l: string) =>
        `Недостатньо місця: модель займає ${t}, а вільно лише ${l}. Звільніть місце або виберіть меншу модель.`,
    },
  },
  proyectos: {
    asistente: {
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    tarjeta: {
      verEnBases: 'Показати в «Базах даних»',
    },
  },
  panel: {
    insignias: {
      memoriaAlta: "Багато пам'яті",
    },
    discos: {
      titulo: 'Місце на дисках',
      leyendo: 'Читання дисків…',
      sistema: 'Система',
      datos: 'Дані WolfCore',
      ambos: 'Система й дані WolfCore',
      libre: (unidad: string, libre: string, pct: number) =>
        `${unidad} · вільно ${libre} (${pct} %)`,
      poco: 'Мало вільного місця',
      casiLleno: 'Місце майже закінчилося',
      liberar: 'Звільнити місце',
      versiones: 'Видалити невикористовувані версії',
      temporales: 'Очистити тимчасові файли й кеші WolfCore',
      ocupaMas: 'Подивитися, що займає найбільше місця',
    },
    alertas: {
      grupo: (n: number) => `Виявлено проблеми (${n})`,
      verTodos: (n: number) => `Показати всі (${n})`,
      verMenos: 'Показати менше',
      masAcciones: 'Інші дії',
    },
    procesos: {
      resto: 'Інші служби',
    },
  },
  captura: {
    barra: 'Інструменти малювання',
    herramientas: {
      recuadro: 'Рамка',
      flecha: 'Стрілка',
      linea: 'Лінія',
      resaltador: 'Маркер',
      texto: 'Текст',
      pixelar: 'Пікселізація',
      pixelarAyuda: 'Пікселізація (не захищає конфіденційні дані: використовуйте «Приховати»)',
      ocultar: 'Приховати',
      ocultarAyuda: 'Приховати суцільною заливкою (рекомендовано для конфіденційних даних)',
    },
    deshacer: 'Скасувати',
    rehacer: 'Повторити',
    copiar: 'Копіювати',
    copiarAyuda:
      'Копіювати в буфер обміну. Буфер обміну Windows може зберегти це в історії або синхронізувати з іншими пристроями.',
    guardar: 'Зберегти…',
    alConversor: 'Надіслати до конвертера зображень',
    cerrar: 'Скасувати (Esc)',
    nuevaSeleccion: 'Нове виділення',
    color: 'Колір',
    grosor: 'Товщина',
    formato: 'Формат',
    cargando: 'Підготовка знімка…',
    guiaRegion: 'Перетягніть, щоб вибрати область. Esc — скасування.',
    guiaVentana: 'Виберіть вікно для захоплення. Esc — скасування.',
    sinVentanas: 'Немає вікон, які можна захопити.',
    textoPlaceholder: 'Введіть текст і натисніть Enter',
    copiada: 'Скопійовано в буфер обміну',
    guardada: (archivo: string) => `Збережено в ${archivo}`,
    errorCargar: 'Не вдалося відкрити знімок.',
    errorCopiar: 'Не вдалося скопіювати зображення.',
    errorGuardar: 'Не вдалося зберегти зображення.',
    errorConversor: 'Не вдалося надіслати зображення до конвертера.',
    errorVentana: 'Не вдалося захопити це вікно.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} пікс.`,
    panel: {
      ayuda:
        "Усе відбувається на цьому комп'ютері: знімок не завантажується в жоден сервіс і не зберігається на диск, доки Ви його не збережете. Вікна WolfCore Dev на мить ховаються, щоб не потрапити на зображення.",
      region: 'Область',
      regionAyuda: 'Перетягніть по екрану, щоб вибрати область.',
      ventana: 'Вікно',
      ventanaAyuda: 'Виберіть одне з відкритих вікон.',
      pantalla: 'Весь екран',
      pantallaAyuda: 'Екран, на якому розташований курсор.',
      atajoActivo: (atajo: string) => `Глобальне поєднання клавіш активне: ${atajo} (область).`,
      atajoInactivo: 'Глобального поєднання клавіш немає. Увімкніть його в налаштуваннях.',
      noDisponible: "Захоплення екрана недоступне на цьому комп'ютері.",
      permisoDenegado:
        'Немає дозволу на запис екрана. Увімкніть його для WolfCore Dev у налаштуваннях системи.',
      ocupada: 'Захоплення вже виконується.',
    },
    ajustes: {
      titulo: 'Захоплення екрана',
      descripcion:
        'Область, вікно або весь екран зі швидким редактором. Усе працює локально: нічого не завантажується й не зберігається, доки Ви не вирішите.',
      activar: 'Глобальне поєднання клавіш',
      activarAyuda:
        'За замовчуванням вимкнено. Після ввімкнення воно реєструється, лише якщо його не використовує інша програма, і звільняється під час закриття WolfCore Dev.',
      atajo: 'Поєднання',
      grabar: 'Змінити',
      grabando: 'Натисніть поєднання клавіш…',
      grabandoAyuda:
        'Використовуйте Ctrl або Super з іншим модифікатором (наприклад, Ctrl+Alt+Shift) і літерою, цифрою чи клавішею F. Уникайте поширених поєднань, як-от Ctrl+C.',
      formato: 'Формат під час збереження',
      activado: (atajo: string) => `Поєднання ${atajo} увімкнено.`,
      desactivado: 'Поєднання вимкнено.',
      ocupado: (atajo: string) =>
        `Поєднання ${atajo} уже використовує інша програма, нічого не змінено. Спробуйте інше поєднання.`,
      ocupadoInicio:
        'Збережене поєднання вже використовує інша програма, і його не зареєстровано. Виберіть інше поєднання.',
      sinPermiso:
        'У macOS потрібен дозвіл на запис екрана; його запросять під час першого захоплення.',
      formatoGuardado: 'Формат збережено.',
    },
  },
  herramientas: {
    entorno: {
      equipo: {
        titulo: 'Мій комп’ютер',
        copiarResumen: 'Копіювати зведення',
        resumenCopiado: 'Зведення скопійовано',
        privacidad: 'У зведенні немає серійних номерів і унікальних ідентифікаторів.',
        desconocido: 'невідомо',
        sinGpu: 'Не виявлено',
        so: 'Операційна система',
        cpu: 'Процесор',
        ram: 'Оперативна пам’ять',
        gpu: 'Відеокарта',
        placa: 'Материнська плата',
        disco: 'Диск {u}',
        compilacion: 'збірка {n}',
        nucleosHilos: 'ядер: {n}, потоків: {h}',
        ramDetalle: 'усього {total}, вільно {libre}',
        vram: '{v} відеопам’яті',
        discoDetalle: 'вільно {libre} із {total}',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'Зведення про комп’ютер · WolfCore Dev {v}',
        resumenTituloSinVersion: 'Зведення про комп’ютер · WolfCore Dev',
      },
    },
    chmod: {
      permisos: 'Права доступу',
      propietario: 'Власник',
      grupo: 'Група',
      otros: 'Інші',
      leer: 'Читання (r)',
      escribir: 'Запис (w)',
      ejecutar: 'Виконання (x)',
      especiales: 'Спеціальні біти',
      setuid: 'setuid: запускається з правами власника',
      setgid: 'setgid: запускається з правами групи',
      sticky: 'sticky: у теці видаляти може лише власник',
      habituales: 'Поширені значення',
      octal: 'Вісімковий',
      simbolico: 'Символьний',
      octalInvalido: 'Введіть 3 або 4 цифри від 0 до 7 (наприклад, 755).',
      simbolicoInvalido: 'Введіть 9 символів, наприклад rwxr-xr-x.',
      ejemplo: 'Приклад',
      archivo: 'Назва файлу',
      nota: 'У Windows не застосовується; потрібне для серверів Linux і macOS.',
      avisoOtros:
        'Будь-який користувач сервера зможе його змінити: не надавайте право запису групі «інші».',
    },
    lista: {
      chmod: {
        nombre: 'Права chmod',
        descripcion: 'Прапорці, вісімковий і символьний запис, для серверів Linux і macOS.',
      },
      clienteHttp: {
        nombre: 'HTTP-клієнт',
        descripcion: 'Пробуйте API: запити, середовища, колекції та історія.',
      },
      captura: {
        nombre: 'Захоплення екрана',
        descripcion: 'Область, вікно або весь екран зі швидким редактором.',
      },
      guiaTuneles: {
        nombre: 'Посібник із тунелів',
        descripcion: 'Cloudflare і ngrok крок за кроком, з командами для копіювання.',
      },
      guiaHttp: {
        nombre: 'Посібник із HTTP',
        descripcion: 'Коди стану та методи, з пошуком і прикладами.',
      },
      guiaGit: {
        nombre: 'Посібник із Git і GitHub',
        descripcion: 'Команди та робочі процеси, з лабораторією для безпечної практики.',
      },
      limpiezaDisco: {
        nombre: 'Очищення диска',
        descripcion:
          'Аналіз і видалення тимчасових файлів та відновлюваних кешів із попереднім переглядом і підтвердженням.',
      },
      editor: {
        nombre: 'Редактор коду',
        descripcion:
          'Редагування текстових файлів із підсвічуванням, резервною копією та підтверджуваним збереженням.',
      },
      compartir: {
        nombre: 'Поділитися папкою або файлом',
        descripcion:
          'Публікація папки або файлу в інтернеті за тимчасовим посиланням, лише для читання.',
      },
      usoDisco: {
        nombre: 'Використання диска',
        descripcion:
          'Що займає місце на диску чи в папці: дерево, найбільші файли й папки, за розширеннями.',
      },
      diffCarpetas: {
        nombre: 'Порівняння папок',
        descripcion:
          'Порівнює дві папки: лише в одній, лише в іншій і відмінні, з відмінностями кожного файлу.',
      },
      grabarPantalla: {
        nombre: 'Запис екрана',
        descripcion: 'Відкриває програму запису, яка вже є у вашій системі.',
      },
    },
    secciones: {
      codigo: 'Код',
      red: 'Мережа',
      seguridad: 'Безпека',
      archivos: 'Файли та медіа',
      sistema: 'Система',
    },
    tarjetas: {
      comparar: {
        nombre: 'Порівняння',
        descripcion: 'Тексти та папки: відмінності поруч.',
      },
      qr: {
        nombre: 'QR',
        descripcion: 'З тексту чи посилання, а також щоб інші могли підключитися до вашого Wi-Fi.',
      },
      guias: {
        nombre: 'Посібники',
        descripcion: 'HTTP, тунелі та Git, з прикладами й командами для копіювання.',
      },
    },
    pestanas: {
      diff: 'Тексти',
      diffCarpetas: 'Папки',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'Тунелі',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'У WolfCore Dev немає власної програми запису: він відкриває ту, що вже є у вашій системі. Відео зберігається там, куди його зберігає цей інструмент.',
      abrir: 'Відкрити програму запису',
      abierta: 'Відкрито «Ножиці». Виберіть область екрана й натисніть «Почати».',
      noSePudo:
        'Не вдалося відкрити «Ножиці» звідси. Скористайтеся одним із поєднань клавіш із посібника.',
      guiaTitulo: 'Як записувати у вашій системі',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Натисніть Win + Shift + R, щоб записувати через «Ножиці».',
            'Якщо «Ножиці» не оновлено, натисніть Win + Alt + R, щоб записувати через ігрову панель Xbox.',
            "Зупиніть запис кнопкою на панелі, що з'явиться вгорі.",
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Натисніть Cmd + Shift + 5, щоб відкрити панель захоплення.',
            'Виберіть запис усього екрана або вибраної частини.',
            'Натисніть «Запис», а щоб завершити — кнопку зупинки в рядку меню.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'У кожному середовищі робочого столу є програма запису: у GNOME — Ctrl + Alt + Shift + R, у KDE — Spectacle.',
            'Якщо її немає, встановіть OBS Studio або SimpleScreenRecorder із менеджера пакетів.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle: string | null) =>
        detalle ? `Недопустимий вираз: ${detalle}` : 'Недопустимий вираз.',
      regexDetalle: {
        corchete: 'не закрито дужку «[».',
        parentesis: 'не закрито дужку «(».',
        parentesisSobra: 'у закривної дужки «)» немає відкривної.',
        nadaQueRepetir: 'у квантифікатора («*», «+», «?» або «{}») немає що повторювати.',
        barraAlFinal: 'шаблон не може закінчуватися зворотною похилою рискою.',
        rangoInvertido: 'діапазон у класі символів перевернуто (наприклад, «z-a»).',
        cuantificador: 'квантифікатор «{}» неповний або його числа переплутано.',
        grupo: 'недопустима назва чи вигляд групи.',
        escape: 'недопустима escape-послідовність зі зворотною похилою рискою.',
      },
    },
    busqueda: {
      excluir: 'Також пропускати (через кому)',
      incluirPesadas: 'Включати важкі папки (node_modules, vendor, .git…)',
      contexto: 'Рядки контексту',
      grupoNombres: (n: number) => `За назвою (${n})`,
      grupoContenido: (n: number) => `За вмістом (${n})`,
      carpeta: 'папка',
      listaAria: 'Результати пошуку',
      atajos:
        '↑ ↓ — переміщення, Enter — відкрити в редакторі, Esc — скасування або повернення до тексту.',
      sensible: (n: number) => `Конфіденційний файл: збіг у рядку ${n} (вміст не показується).`,
      mostrarMas: (n: number) => `Показати ще ${n}`,
      linea: (n: number) => `рядок ${n}`,
      sinGrupo: 'У цій групі немає результатів.',
      topeBytes: 'Досягнуто ліміту читання: звузьте пошук.',
    },
    compartir: {
      explicacion:
        "Публікує папку або файл із цього комп'ютера в інтернеті за тимчасовим посиланням. Лише для читання: будь-хто, у кого є посилання, може переглядати й завантажувати, але не вивантажувати чи змінювати. У посиланні є секретний код, воно спливає у вибраний вами час і закривається під час виходу з WolfCore Dev. Файли .env, ключі, папка .git і сайти зі справжніми даними ніколи не публікуються.",
      eleccion: 'Що опублікувати',
      elegirCarpeta: 'Вибрати папку…',
      elegirArchivo: 'Вибрати файл…',
      elegido: 'Вибрано',
      duracion: 'Припинити доступ через',
      duraciones: {
        m15: '15 хвилин',
        h1: '1 година',
        h4: '4 години',
      },
      tunel: 'Тунель',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (швидкий, без облікового запису)',
        ngrok: 'ngrok (з вашим токеном)',
      },
      ngrokSinToken: 'ngrok потрібен ваш токен: збережіть його в параметрах тунелю якогось сайту.',
      compartir: 'Поділитися…',
      sinFtp: 'FTP не публікується через тунель: він не зашифрований, а тунель передає лише HTTP.',
      vacio: {
        titulo: 'Нічого не опубліковано',
        texto:
          'Виберіть папку або файл, щоб отримати тимчасове публічне посилання. Нічого не публікується, доки Ви не підтвердите.',
      },
      grandes:
        'Текстові файли чи файли невідомого типу розміром понад 8 МБ не публікуються, бо їх неможливо повністю перевірити; зображення, аудіо, відео та пакети (zip, 7z, gz, pdf) публікуються. У списку вони позначені.',
      comprimidos:
        'Стиснений файл (.zip, .7z, .gz) публікується як є, без перегляду вмісту: якщо в ньому є файл .env або ключі, їх буде опубліковано.',
      confirmar: {
        titulo: 'Опублікувати в інтернеті',
        pregunta: 'Опублікувати це в інтернеті?',
        rutaReal: 'Реальний шлях (посилання розкрито)',
        ruta: 'Точний шлях',
        aviso: (dur: string) =>
          `Це буде загальнодоступним в інтернеті протягом ${dur} з моменту, коли посилання буде готове. Будь-хто, у кого є посилання, зможе переглядати й завантажувати опубліковане.`,
        boton: 'Опублікувати в інтернеті',
      },
      abriendo: 'Відкриття тунелю…',
      activa: 'Доступно',
      enlace: 'Публічне посилання',
      copiar: 'Копіювати посилання',
      qr: 'QR-код посилання',
      vence: (hasta: string, restan: string) => `Спливає о ${hasta} (${restan})`,
      restan: (min: number) => (min <= 1 ? 'менше 1 хвилини' : `${min} хв`),
      dejar: 'Припинити доступ',
      fin: {
        vencio: 'Час вичерпано: сервер і тунель закрито.',
        tunel: 'Тунель закрився, і доступ припинено.',
      },
      registro: {
        titulo: 'Звернення',
        ayuda: "Останні 200, лише в пам'яті. У них ніколи не показується секретний код посилання.",
        vacioTitulo: 'Звернень поки немає',
        vacioTexto: "Щоразу, коли хтось відкриє посилання, це з'явиться тут.",
        col: {
          hora: 'Час',
          ip: 'IP',
          ruta: 'Шлях',
          codigo: 'Код',
        },
        sinPermiso: '(без правильного коду)',
      },
    },
    usoDisco: {
      explicacion:
        "Показує, що займає місце на диску чи в папці. Читає лише назви й розміри (ніколи вміст), не переходить за посиланнями та точками з'єднання й працює в окремому процесі. Нічого не видаляє, не переміщує й не змінює.",
      unidades: 'Диски',
      unidad: (ruta: string, etiqueta: string) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre: string, total: string) => `вільно ${libre} із ${total}`,
      sinUnidades: 'Не вдалося прочитати список дисків. Ви можете вибрати папку.',
      elegirCarpeta: 'Вибрати папку…',
      analizando: 'Аналіз…',
      leyendo: 'Читання',
      progreso: (archivos: string, carpetas: string, bytes: string) =>
        `файлів: ${archivos} · папок: ${carpetas} · ${bytes}`,
      cancelar: 'Скасувати',
      cancelado: 'Аналіз скасовано.',
      resumen: (total: string, archivos: string, carpetas: string) =>
        `${total}; файлів: ${archivos}, папок: ${carpetas}`,
      duracion: (segundos: string) => `Тривало ${segundos} с.`,
      vistas: {
        arbol: 'Дерево',
        carpetas: 'Папки',
        archivos: 'Файли',
        extensiones: 'Розширення',
      },
      arbolAyuda:
        'Відсортовано за розміром. Показано лише папки й файли, які важать не менше 0,5 % від загального обсягу; решта підсумовується в «Інше».',
      carpetasAyuda:
        '50 папок із найбільшою власною вагою: скільки важать файли, що лежать безпосередньо в них, без урахування вкладених папок.',
      archivosAyuda: '50 найбільших файлів.',
      extensionesAyuda:
        '20 розширень, що займають найбільше місця; решта потрапляє в «Інші розширення».',
      col: {
        nombre: 'Назва',
        tamano: 'Розмір',
        porcentaje: 'Від загального',
        archivos: 'Файли',
        ruta: 'Шлях',
        extension: 'Розширення',
      },
      otros: (n: string) => `Інше (дрібних файлів: ${n})`,
      sinExtension: '(без розширення)',
      otrasExtensiones: 'Інші розширення',
      expandir: (nombre: string) => `Розгорнути ${nombre}`,
      contraer: (nombre: string) => `Згорнути ${nombre}`,
      abrir: 'Відкрити в провіднику',
      copiar: 'Копіювати шлях',
      denegada: 'Не вдалося прочитати',
      avisos: {
        enlaces: (n: number) =>
          `${plural(n, "посилання чи точку з'єднання не відстежено, і воно враховується", "посилання чи точки з'єднання не відстежено, і вони враховуються", "посилань чи точок з'єднання не відстежено, і вони враховуються")} як 0.`,
        denegados: (n: number) =>
          `${plural(n, 'елемент не вдалося прочитати', 'елементи не вдалося прочитати', 'елементів не вдалося прочитати')} (немає прав або він змінився під час аналізу). Без прав адміністратора деякі системні папки прочитати неможливо: цей інструмент їх не запитує.`,
        enlacesDuros: (n: number) =>
          `${plural(n, 'додаткову назву', 'додаткові назви', 'додаткових назв')} файлів із жорсткими посиланнями не враховано двічі.`,
        enlacesDurosIncompleto:
          'Жорстких посилань було так багато, що реєстр переповнився: у підсумку якийсь файл може бути врахований двічі.',
        truncado: 'Досягнуто максимальної глибини: деякі папки не враховано.',
        tamanoLogico:
          'Розміри логічні (те, що повідомляє кожен файл), а не зайняте на диску місце: файли OneDrive «лише в мережі», стиснуті та розріджені файли можуть відрізнятися.',
        verEnlaces: 'Показати посилання, за якими не переходили',
      },
      limpieza: {
        titulo: 'Звільнити місце',
        texto:
          'Цей інструмент лише вимірює. Щоб видалити тимчасові файли та відновлювані кеші чи невикористовувані версії служб, скористайтеся тим, що вже є:',
        temporales: 'Очищення диска',
        versiones: 'Невикористовувані версії (Служби)',
      },
      vacio: {
        titulo: 'Аналізу поки немає',
        texto: 'Виберіть диск або папку, щоб побачити, що займає місце. Нічого не змінюється.',
      },
      sinContenido: {
        titulo: 'Нічого рахувати',
        texto: 'У цій папці немає файлів, які можна прочитати.',
      },
    },
    diffCarpetas: {
      explicacion:
        'Порівнює дві папки, нічого в них не змінюючи: що є лише в одній, лише в іншій і що відрізняється. Не переходить за посиланнями й працює в окремому процесі.',
      carpetaA: 'Папка A',
      carpetaB: 'Папка B',
      elegir: 'Вибрати папку',
      sinElegir: 'Не вибрано',
      comparar: 'Порівняти',
      comparando: 'Порівняння…',
      cancelar: 'Скасувати',
      cancelada: 'Порівняння скасовано.',
      iguales: 'Дві папки однакові.',
      grupoSoloA: 'Лише в A',
      grupoSoloB: 'Лише в B',
      grupoDistintos: 'Відрізняються',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'Немає',
      resumen: (a: number, b: number, iguales: number) =>
        `A: файлів ${a} · B: файлів ${b} · однакових ${iguales}`,
      truncado: 'Досягнуто ліміту (файли, глибина чи розмір): список неповний.',
      recortado: (mostrados: number, total: number) =>
        `Файлів більше, ніж показано (${mostrados} із ${total}).`,
      sinComparar: (n: number) =>
        `${plural(n, 'великий файл', 'великі файли', 'великих файлів')} з однаковим розміром не порівнювалися за вмістом.`,
      omitidos: (n: number) =>
        `${plural(n, "посилання, точку з'єднання чи особливий елемент пропущено", "посилання, точки з'єднання чи особливі елементи пропущено", "посилань, точок з'єднання чи особливих елементів пропущено")}.`,
      motivoTamano: 'різний розмір',
      motivoContenido: 'той самий розмір, інший вміст',
      tamano: (a: string, b: string) => `A: ${a} · B: ${b}`,
      elegirArchivo:
        'Виберіть у списку файл із групи «Відрізняються», щоб побачити його відмінності.',
      soloEnUno: (lado: string) => `Цей файл існує лише в ${lado}.`,
      cargando: 'Читання файлів…',
      binario: 'Файли відрізняються, але не є текстовими: відмінності не показуються.',
      sensible:
        'Конфіденційний файл (.env, ключі чи справжні дані): він відрізняється, але його вміст не показується. Його можна відкрити в редакторі, який запросить посилене підтвердження.',
      tope: (kb: number) =>
        `Файли відрізняються, але перевищують ${kb} КБ: текстові відмінності не показуються.`,
      demasiadoDistinto: 'Файли настільки різні, що порядкові відмінності не показуються.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'змішані закінчення рядків',
        ninguno: 'без закінчень рядків',
      },
      saltosDistintos: (a: string, b: string) => `Закінчення рядків: у A — ${a}, у B — ${b}.`,
      soloSaltos:
        'Текст рядків однаковий: змінюються лише закінчення рядків (зокрема останнє в кінці файлу) або BOM.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${plural(agregadas, 'рядок додано', 'рядки додано', 'рядків додано')}, ${quitadas} видалено`,
      truncadoArchivo: 'Показано лише перші рядки.',
      lineasIguales: (n: number) => `… однакових рядків: ${n} …`,
      abrirA: 'Відкрити A в редакторі',
      abrirB: 'Відкрити B в редакторі',
      atajos: '↑ ↓ — переміщення, Enter — переглянути відмінності, Esc — скасування.',
      listaAria: (grupo: string) => `Файли: ${grupo}`,
      detalleAria: 'Відмінності файлів',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'Розділи HTTP-клієнта',
        peticion: 'Запит',
        coleccion: 'Колекція',
        historial: 'Історія',
        entornos: 'Середовища',
      },
      entorno: 'Середовище',
      sinEntorno: 'Без середовища',
      metodo: 'Метод',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path або {{base}}/path',
      enviar: 'Надіслати',
      enviarAtajo: 'Надіслати (Ctrl+Enter)',
      cancelar: 'Скасувати',
      nueva: 'Новий',
      guardar: 'Зберегти в колекцію',
      nombre: 'Назва',
      nombrePlaceholder: 'Назва запиту',
      guardada: 'Запит збережено',
      ayudaVariables: 'Використовуйте {{variable}}, щоб брати значення з вибраного середовища.',
      secciones: {
        params: 'Параметри',
        cabeceras: 'Заголовки',
        cuerpo: 'Тіло',
        auth: 'Автентифікація',
        opciones: 'Параметри запиту',
      },
      par: {
        clave: 'Назва',
        valor: 'Значення',
        agregar: 'Додати рядок',
        quitar: 'Видалити рядок',
        activa: 'Рядок увімкнено',
        falta: 'Секрет відсутній: введіть його, щоб можна було надіслати.',
      },
      cuerpo: {
        tipo: 'Тип тіла',
        ninguno: 'Немає',
        json: 'JSON',
        form: 'Форма (urlencoded)',
        multipart: 'Multipart (лише текст)',
        raw: 'Сирий текст',
        tipoContenido: 'Content-Type',
        texto: 'Вміст',
        multipartAyuda: 'Лише текстові поля: файли з диска не надсилаються.',
      },
      auth: {
        tipo: 'Тип',
        ninguna: 'Немає',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API-ключ',
        token: 'Токен',
        usuario: 'Користувач',
        clave: 'Пароль',
        nombre: 'Назва заголовка чи параметра',
        en: 'Надсилати в',
        cabecera: 'Заголовок',
        query: 'Рядок запиту',
        ayuda:
          'Значення зберігається в зашифрованому системою вигляді; колекція, історія та середовища зберігають лише посилання на нього.',
      },
      secreto: {
        guardado: 'Збережено (у зашифрованому вигляді). Введіть, щоб замінити.',
        mostrar: 'Показати',
        ocultar: 'Приховати',
        quitar: 'Видалити',
        valor: 'Збережене значення',
        porNombre: 'Воно буде збережене в зашифрованому вигляді, бо назва схожа на секрет.',
      },
      opciones: {
        plazo: 'Тайм-аут (секунди)',
        plazoAyuda: 'Від 1 до 120 секунд.',
        ignorarCert: 'Ігнорувати помилки сертифіката для цього запиту',
        ignorarAviso:
          "Небезпечно: з'єднання більше не перевіряється. Діє лише для цього запиту та його хоста. Сайти WolfCore .test уже перевіряються власним центром сертифікації.",
        limites:
          'Відповідь до 10 МБ і не більше 10 перенаправлень. Без збережених cookie та без системного проксі.',
      },
      respuesta: {
        enviando: 'Надсилання…',
        estado: 'Статус',
        tiempo: 'Час',
        tamano: 'Розмір',
        cuerpo: 'Тіло',
        cabeceras: 'Заголовки',
        redirecciones: 'Перенаправлення',
        vacioTitulo: 'Відповіді поки немає',
        vacioTexto: 'Введіть URL і натисніть «Надіслати». Запит надходить із WolfCore Dev.',
        binario: (bytes: number, tipo: string) =>
          `Двійкові дані, ${bytes} байт, тип ${tipo || 'невідомий'}.`,
        sinCuerpo: 'У відповіді немає тіла.',
        truncada: 'Відповідь перевищила 10 МБ: її обрізано, і вона неповна.',
        parcial: (mostrados: number) => `Показано перші ${mostrados} символів.`,
        sinRedirecciones: 'Перенаправлень не було.',
        salto: (n: number) => `Перехід ${n}`,
        urlFinal: 'Підсумковий URL',
        certIgnorado: 'Для цього запиту помилки сертифіката ігнорувалися.',
        caWolf: 'Перевірено центром сертифікації WolfCore Dev.',
        copiar: 'Копіювати тіло',
        copiado: 'Тіло скопійовано',
        formato: 'Відформатований JSON',
        crudo: 'Вихідний текст',
      },
      curl: {
        copiar: 'Копіювати як curl',
        incluir: 'Включити облікові дані',
        incluirAyuda:
          'Якщо не позначено, секретні значення виводяться як <secreto>. Якщо позначено, команда містить справжні облікові дані.',
        copiado: 'Команду curl скопійовано',
        importar: 'Імпорт curl',
        importarTitulo: 'Імпорт команди curl',
        importarAyuda:
          'Вставте команду curl. Вона читається лише як текст: нічого не виконується. Облікові дані потрапляють у зашифроване сховище.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'Імпортувати',
        importada: 'Запит імпортовано в колекцію',
        avisos: {
          opcion_ignorada: (d: string) => `Параметр проігноровано: ${d}`,
          archivo_ignorado: (d: string) => `Файли на диску не читаються: ${d}`,
          inseguro_ignorado:
            '-k/--insecure проігноровано. Якщо він потрібен, увімкніть вручну «Ігнорувати помилки сертифіката».',
          comando_cortado: 'Усе, що йде після оператора оболонки (|, ;, &, >), проігноровано.',
          sin_evaluar:
            'У тексті були $(…), зворотні лапки або змінні оболонки: вони не обчислюються й залишаються текстом.',
          url_sin_esquema: 'В URL не було схеми: використано http://.',
          varias_urls: (d: string) => `Зайвий аргумент проігноровано: ${d}`,
          cabecera_invalida: (d: string) => `Недопустимий заголовок проігноровано: ${d}`,
          secretos_guardados:
            'Імпортовані облікові дані збережено в зашифрованому вигляді; колекція зберігає лише посилання на них.',
        },
      },
      coleccion: {
        vacioTitulo: 'Колекція порожня',
        vacioTexto: 'Збережіть запит або імпортуйте команду curl, щоб він був під рукою.',
        abrir: 'Відкрити',
        borrar: 'Видалити',
        borrada: 'Запит видалено',
      },
      historial: {
        vacioTitulo: 'Історії немає',
        vacioTexto:
          'Тут залишаються останні 100 запитів без облікових даних: конфіденційні заголовки показуються як ***.',
        abrir: 'Відкрити',
        limpiar: 'Очистити історію',
        sinRespuesta: 'Немає відповіді',
      },
      entornos: {
        vacioTitulo: 'Середовищ немає',
        vacioTexto:
          'Середовище задає змінні, як-от {{base}} чи {{token}}. Позначені як секретні зберігаються в зашифрованому вигляді.',
        nuevo: 'Нове середовище',
        nombre: 'Назва середовища',
        variable: 'Змінна',
        valor: 'Значення',
        secreta: 'Секрет',
        agregar: 'Додати змінну',
        quitar: 'Видалити змінну',
        guardar: 'Зберегти середовище',
        guardado: 'Середовище збережено',
        borrar: 'Видалити середовище',
        borrado: 'Середовище видалено',
        usar: 'Використовувати це середовище',
        activo: 'Активне',
        sinNombre: 'Введіть назву середовища.',
      },
    },
    imagenes: {
      nombreCaptura: 'screenshot',
    },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'Порт {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'Порт {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'Зарезервований діапазон {desde}-{hasta} (містить {puerto})',
      ca_vencida: 'Термін дії центру сертифікації скінчився {dias} дн. тому',
      ca_por_vencer: 'Термін дії центру сертифікації спливає через {dias} дн.',
      certificado_vencido: 'Термін дії сертифіката для {dominio} скінчився {dias} дн. тому',
      certificado_por_vencer: 'Термін дії сертифіката для {dominio} спливає через {dias} дн.',
      firefox_perfiles: 'Профілі Firefox без довіри:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (відкрито)',
      firefox_perfil_fuera: '{perfil} (поза папкою Firefox)',
      hosts_ilegible: '{ruta}: не вдалося прочитати ({motivo})',
      hosts_codificacion: '{ruta}: кодування {codificacion}',
      hosts_bloques: '{ruta}: блоків WolfCore Dev — {bloques}',
      hosts_sin_cierre: '{ruta}: у блока WolfCore Dev немає закривного маркера',
      hosts_faltan: 'Відсутні в hosts: {dominios}',
      hosts_solo_lectura: '{ruta}: атрибут «лише читання»',
      path_repetidas: 'Повторюються: {entradas}',
      path_delante: '{entrada} стоїть перед інструментами WolfCore Dev і також містить {programa}',
      antivirus_sin_leer:
        'Антивірус активний; не вдалося прочитати його винятки (потрібні права адміністратора).',
      antivirus_sin_exclusion:
        'Антивірус активний, і папку даних WolfCore Dev не додано до винятків.',
      enlazador_ausente: 'Не знайдено інструментів C++ з Visual Studio Build Tools.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) не встановлено.',
      firewall_no_comprobado:
        'Не вдалося прочитати правила брандмауера (можливо, потрібні права адміністратора).',
      firewall_reglas: 'WolfCore Dev: {propias} · Залишки тестів WolfCore: {pruebas}',
      firewall_acotadas: 'Правила, обмежені локальною мережею:',
      firewall_ajenas: 'Правила інших програм:',
      firewall_quitadas: 'Видалені правила, які можна відновити:',
    },
    ver: 'Переглянути',
    verPuertos: 'Переглянути порти',
    dialogo: {
      reglas: 'Задіяні правила: зніміть позначки з тих, яких не потрібно чіпати.',
      sinSeleccion: 'Позначте принаймні одне правило, щоб продовжити.',
      reglasNota:
        'Нічого не зміниться без вашого підтвердження та дозволу адміністратора. Якщо правило змінилося після показу, його буде пропущено.',
    },
    reparaciones: {
      firewall:
        'Видалити ці вхідні правила брандмауера по одному та за їхньою точною назвою. Спочатку копію зберігають у захищеному розділі реєстру HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos, щоб їх можна було створити знову. Правила інших програм ніколи не чіпаються.',
      firewall_restaurar:
        'Створити знову позначені правила з тією самою програмою, профілем, протоколом, портами й адресами, що показані, із захищеної копії (а не з файлу в etc/). Ці програми знову зможуть приймати мережеві підключення.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev запускає Maven безпосередньо з JDK і з міркувань безпеки не читає .mvn/jvm.config та змінну MAVEN_OPTS. Якщо вони потрібні вашому проєкту, запускайте Maven із термінала.',
    avisoRuby:
      "Ruby встановлюється без Devkit (MSYS2), без зміни вашого PATH і реєстру Windows: інсталятора немає. Gem-пакетам із нативними розширеннями без готового бінарного файлу потрібен Devkit. Це ручний крок: відкрийте термінал із проєкту та виконайте «ridk install» (він встановлює MSYS2 на ваш комп'ютер і завантажує дані з інтернету).",
    avisoJdk:
      'Maven і Gradle працюють із JDK від WolfCore Dev, а жодного ще не встановлено. Встановіть Java (Temurin) зі списку служб.',
    avisoMeilisearch:
      'Кожна мінорна версія Meilisearch має власні дані. Якщо ви перейдете на іншу мінорну версію (наприклад, з 1.58 на 1.59), її індекси та MEILISEARCH_KEY будуть новими: потрібно буде переіндексувати й оновити .env ваших проєктів.',
    servicios: {
      meilisearch: 'Meilisearch',
      ruby: 'Ruby',
      maven: 'Maven',
      gradle: 'Gradle',
    },
    anteriores: (n: number) => `Попередні патчі (${n})`,
  },
  memoria: {
    boton: "Пам'ять",
    tituloBoton: "Оптимізувати пам'ять",
    titulo: "Оптимізатор пам'яті",
    intro:
      'Виберіть режим і перегляньте список. Нічого не закривається й не зупиняється, доки ви не підтвердите, і це ніколи не запускається саме.',
    modo: 'Режим',
    modos: {
      liviano: 'Легкий',
      moderado: 'Помірний',
      profundo: 'Глибокий',
    },
    descripciones: {
      liviano: 'Очищає кеш застосунку. Звільняє місце на диску; нічого не закриває й не зупиняє.',
      moderado:
        'Додатково пропонує залишити один робочий процес PHP і зупинити служби WolfCore Dev без активності та підключень. Служби спочатку не позначені.',
      profundo:
        "Додатково показує ваші власні програми, що споживають багато пам'яті, щоб ви могли попросити їх закрити вікно. Спочатку вони не позначені.",
    },
    ver: 'Показати список',
    revisando: 'Перевірка…',
    vacio: 'У цьому режимі нічого звільняти.',
    tipos: {
      'cache-app': 'Очистити кеш',
      'reducir-pool': 'Залишити один робочий процес',
      'detener-inactivo': 'Зупинити (простоює)',
      'cerrar-programa': 'Попросити закрити вікно',
    },
    caches: {
      sesion: 'HTTP-кеш сеансу застосунку',
    },
    estimado: (cantidad: string) => `Буде звільнено приблизно ${cantidad} ОЗП`,
    estimadoDisco: (cantidad: string) => `Плюс приблизно ${cantidad} на диску (кеш — це не ОЗП)`,
    marcadas: (n: number, total: number) => `Позначено ${n} із ${total}`,
    sinDatos:
      'Поки недостатньо даних про активність, щоб запропонувати зупинку служб чи зменшення PHP. Залиште «Головну» відкритою на кілька хвилин і подивіться знову.',
    listadoFallido:
      'Не вдалося прочитати список відкритих програм: цей список може бути неповним. Повторіть спробу.',
    avisoDetener:
      'Служби, що простоюють, спочатку не позначені: зупинка служби відключає все, що нею користується. У списку лише ті, у яких зараз немає підключень.',
    avisoCerrar:
      'Програмам лише пропонується закрити вікно, як під час натискання хрестика: вони можуть запитати, чи зберігати дані. Програма ніколи не закривається примусово.',
    protegidos:
      "Системні програми, служби Windows, програми з підвищеними правами, інші користувачі, FlyEnv, PhpWebStudy і WolfCore Dev (або все, що вони запускають) ніколи не з'являються.",
    aplicar: 'Застосувати позначене',
    confirmarTitulo: 'Застосувати ці дії?',
    confirmarTexto: (n: number) =>
      n === 1 ? 'Буде виконано 1 дію зі списку.' : `Буде виконано дій зі списку: ${n}.`,
    confirmarCerrar: (nombres: string) =>
      `Цим програмам буде запропоновано закрити вікно: ${nombres}.`,
    confirmarDetener: (nombres: string) => `Ці служби буде зупинено: ${nombres}.`,
    confirmar: 'Так, застосувати',
    cancelar: 'Скасувати',
    resultadoTitulo: 'Результат',
    liberado: (cantidad: string) => `Оцінка: звільнено приблизно ${cantidad} ОЗП`,
    liberadoDisco: (cantidad: string) => `Плюс приблизно ${cantidad} на диску`,
    notaPedido:
      'Очікує вас: вікну запропоновано закритися, а програма все ще відкрита (можливо, вона запитує, чи зберігати дані). Це не вважається звільненим.',
    estados: {
      hecho: 'Готово',
      pedido: 'Очікує вас',
      saltado: 'Пропущено',
      error: 'Збій',
    },
    motivos: {
      no_en_plan: 'Його не було в списку',
      protegido: 'Це захищена програма',
      cambio: 'Воно змінилося після показу списку',
      sin_ventana: 'У нього більше немає вікна, яке можна закрити',
      ya_apagado: 'Більше не було що зменшувати',
      ocupado: 'Воно було зайняте (є підключення)',
      no_se_pudo: 'Не вдалося надіслати запит на закриття (програма працює з підвищеними правами)',
    },
    otraVez: 'Почати знову',
  },
  guias: {
    tuneles: {
      titulo: 'Посібник із тунелів',
      copiar: 'Копіювати команду',
    },
    http: {
      buscar: 'Пошук за номером, назвою чи текстом',
      familia: 'Родина',
      todas: 'Усі',
      verMetodos: 'Методи',
      verCodigos: 'Коди стану',
      resultados: (n: number) => plural(n, 'результат', 'результати', 'результатів'),
      vacio: 'Нічого не відповідає пошуку.',
      seguro: 'Безпечний',
      noSeguro: 'Небезпечний',
      idempotente: 'Ідемпотентний',
      noIdempotente: 'Неідемпотентний',
      noEstandar: 'Нестандартний',
      broma: 'Жартівливий код (RFC 2324)',
      causas: 'Поширені причини',
      solucion: 'Як виправити',
      ejemplo: 'Приклад',
      copiarEjemplo: 'Копіювати приклад',
      probar: 'Спробувати',
      probarTitulo:
        'Спробуйте цей приклад в HTTP-клієнті (нічого не надсилається, доки ви не натиснете «Надіслати»)',
      servidorActivo: (puerto: number) =>
        `Приклад сервера працює за адресою 127.0.0.1:${puerto}, поки ви користуєтеся посібником чи HTTP-клієнтом. Він доступний лише з цього комп'ютера й зупиняється, коли ви йдете або через 10 хв без використання.`,
      sinTraduccion: 'Не перекладено цією мовою: показано англійською.',
      familias: {
        '1xx': '1xx Інформаційні',
        '2xx': '2xx Успішні',
        '3xx': '3xx Перенаправлення',
        '4xx': '4xx Помилка клієнта',
        '5xx': '5xx Помилка сервера',
      },
    },
    git: {
      buscar: 'Пошук теми чи команди',
      verGuia: 'Посібник',
      verLaboratorio: 'Лабораторія',
      todos: 'Усі',
      grupos: {
        basico: 'Основи',
        ramas: 'Гілки',
        deshacer: 'Скасування змін',
        remotos: 'Віддалені репозиторії та теги',
        github: 'GitHub',
      },
      resultados: (n: number) => plural(n, 'тема', 'теми', 'тем'),
      vacio: 'Нічого не відповідає пошуку.',
      ejemplo: 'Приклад',
      errores: 'Поширені помилки',
      copiarEjemplo: 'Копіювати приклад',
      peligroso: 'Небезпечно',
      sinTraduccion: 'Не перекладено цією мовою: показано англійською.',
      avisoGithub:
        'Ця частина має лише пояснювальний характер: WolfCore Dev не створює облікових записів, не входить у GitHub і не використовує токени з цього посібника. Назви та значення в прикладах вигадані.',
      irLaboratorio: 'Потренуватися в лабораторії',
      lab: {
        intro:
          'Навчальний репозиторій і локальний «віддалений репозиторій» у папці, що належить WolfCore Dev. Інтернет і GitHub не використовуються, ваші проєкти та налаштування git не зачіпаються.',
        sinGit: {
          titulo: 'Git не встановлено',
          texto:
            'Лабораторія використовує git вашої системи й без нього не відкриється. Встановіть Git і знову відкрийте цю вкладку; WolfCore Dev нічого не встановлює за вас.',
        },
        cargando: 'Підготовка лабораторії…',
        reiniciar: 'Скинути лабораторію',
        reiniciarAyuda: 'Видаляє лише навчальну папку й повертає її в початковий стан.',
        reiniciado: 'Лабораторію скинуто.',
        version: (v: string) => `git ${v}`,
        ordenes: 'Команди',
        mensaje: 'Повідомлення коміту',
        mensajePorDefecto: 'Навчальна зміна',
        rama: 'Гілка',
        etiqueta: 'Тег',
        archivo: 'Файл',
        grupos: {
          basico: 'Основи',
          ramas: 'Гілки',
          guardar: 'Збереження та скасування',
          remoto: 'Локальний віддалений репозиторій',
        },
        archivos: {
          titulo: 'Навчальні файли',
          ayuda: 'Можна редагувати лише ці файли, текстом до 2000 символів.',
          guardar: 'Зберегти файл',
          guardado: 'Файл збережено.',
          areaTexto: (n: string) => `Вміст ${n}`,
        },
        salida: 'Вивід',
        salidaVacia: 'Натисніть команду, щоб побачити тут відповідь git.',
        codigo: (n: number) => (n === 0 ? 'Завершено успішно' : `Завершено з кодом ${n}`),
        truncada: 'Вивід було обрізано.',
        historial: 'Історія',
        historialVacio: 'Комітів поки немає: виконайте git init, git add і git commit.',
        conflicto: {
          titulo: 'Вправа з підказками: конфлікт',
          intro:
            "Дві гілки змінюють той самий рядок. Ви побачите, як виникає конфлікт і як його розв'язати.",
          paso: (n: number, total: number) => `Крок ${n} із ${total}`,
          ejecutar: 'Виконати цей крок',
          hecho: 'Готово',
          reempezar: 'Почати знову',
          esperado: 'Git повідомив про конфлікт: на цьому кроці це очікувано.',
          elegir: {
            mia: 'Залишити версію з main (зелена)',
            otra: 'Залишити версію з rama-a (червона)',
            ambas: 'Залишити обидві',
          },
          final: "Готово: ви розв'язали конфлікт. Подивіться історію.",
          pasos: [
            {
              titulo: 'Підготувати лабораторію',
              texto: 'Лабораторію скидають і роблять перший коміт із colores.txt («color: azul»).',
            },
            {
              titulo: 'Змінити рядок у rama-a',
              texto: 'Створюється гілка rama-a, рядок стає «color: rojo», і робиться коміт.',
            },
            {
              titulo: 'Змінити той самий рядок у main',
              texto: 'Повернення в main, рядок стає «color: verde», і робиться коміт.',
            },
            {
              titulo: 'Спробувати злиття',
              texto:
                'rama-a зливається з main. Git не може визначити, який рядок залишити, і залишає конфлікт.',
            },
            {
              titulo: 'Вибрати версію',
              texto:
                'Виберіть, яку версію рядка залишити. У colores.txt тепер є маркери конфлікту.',
            },
            {
              titulo: "Підтвердити розв'язання",
              texto: 'colores.txt додається до індексу (add) і робиться коміт, що завершує злиття.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `Легкий редактор з підсвічуванням для текстових файлів до ${mb} МБ. Виберіть файл у системному діалозі; збереження завжди запитує підтвердження й спочатку залишає копію в папці даних WolfCore Dev.`,
    abrir: 'Відкрити файл…',
    abriendo: 'Відкриття…',
    guardar: 'Зберегти',
    guardando: 'Збереження…',
    recargar: 'Перезавантажити з диска',
    vacio: 'Відкрийте файл, щоб почати редагування.',
    sinCambios: 'Немає змін',
    conCambios: 'Є незбережені зміни',
    posicion: (linea: number, columna: number) => `Рядок ${linea}, стовпець ${columna}`,
    areaTexto: (nombre: string) => `Редактор коду: ${nombre}`,
    salirTeclado: 'Щоб вийти з редактора за допомогою клавіатури, натисніть Esc, а потім Tab.',
    guardado: 'Файл збережено.',
    copiaPrevia: (ruta: string) => `Резервна копія: ${ruta}`,
    cancelar: 'Скасувати',
    enlaceDuro:
      "У цього файлу на диску більше однієї назви (жорстке посилання). Збереження розриває цей зв'язок: інші назви збережуть попередній вміст.",
    saltosMixtos: {
      aviso:
        'У цьому файлі змішані різні закінчення рядків. Під час збереження всі вони будуть приведені до LF.',
      aceptar: 'Привести закінчення рядків до єдиного вигляду',
    },
    envGestor: {
      aviso:
        'Файли .env редагуються у змінних проєкту, з їхнім потоком роботи із секретами. Кнопка відкриває .env у корені проєкту, який може не збігатися з файлом, який ви намагалися відкрити.',
      boton: 'Відкрити .env у корені проєкту',
    },
    huellaPerdida: 'Збережено, але не вдалося прочитати новий відбиток: файл було перезавантажено.',
    confirmarGuardar: {
      titulo: 'Зберегти зміни',
      texto: (nombre: string) =>
        `Зараз буде записано файл ${nombre}. Спочатку копію того, що зараз на диску, зберігають у папці даних WolfCore Dev.`,
      boton: 'Зберегти з резервною копією',
    },
    refuerzo: {
      abrirTitulo: 'Конфіденційний файл',
      guardarTitulo: 'Збереження конфіденційного файлу',
      secreto:
        'Схоже, цей файл містить секрети (приватні ключі, токени чи облікові дані). Його вміст буде показано на екрані.',
      datosReales:
        'Цей файл належить сайту, позначеному як такий, що містить справжні дані. Помилкова зміна може зачепити справжню інформацію.',
      instruccion: (nombre: string) => `Щоб продовжити, введіть назву файлу: ${nombre}`,
      etiqueta: 'Назва файлу',
      abrirBoton: 'Усе одно відкрити',
      guardarBoton: 'Усе одно зберегти',
    },
    cambioExterno: {
      titulo: 'Файл змінено поза редактором',
      texto:
        'Інша програма змінила його після того, як ви його відкрили, тому нічого не збережено. Ви можете перезавантажити його (ваші зміни буде втрачено) або перезаписати тим, що у вас тут.',
      recargar: 'Перезавантажити й відкинути мої зміни',
      sobrescribir: 'Перезаписати…',
      sobrescribirTitulo: 'Перезапис файлу',
      sobrescribirTexto:
        'Зміни, зроблені іншою програмою, буде втрачено. Його поточний вміст залишиться в резервній копії.',
      sobrescribirBoton: 'Так, перезаписати',
      volver: 'Назад',
    },
    descartar: {
      titulo: 'Незбережені зміни',
      texto: 'У редакторі є незбережені зміни. Якщо продовжити, їх буде втрачено.',
      confirmar: 'Відкинути зміни',
      seguir: 'Продовжити редагування',
    },
    cm: {
      'Control character': 'Керівний символ',
      'Selection deleted': 'Виділення видалено',
      'Go to line': 'Перейти до рядка',
      go: 'перейти',
      Find: 'Знайти',
      Replace: 'Замінити',
      next: 'далі',
      previous: 'назад',
      all: 'усі',
      'match case': 'враховувати регістр',
      regexp: 'regexp',
      'by word': 'за словом',
      replace: 'замінити',
      'replace all': 'замінити всі',
      close: 'закрити',
      'current match': 'поточний збіг',
      'on line': 'у рядку',
      'replaced match on line $': 'замінено збіг у рядку $',
      'replaced $ matches': 'замінено збігів: $',
      'folded code': 'згорнутий код',
      unfold: 'розгорнути',
      to: 'до',
    },
  },
  limpiezaDisco: {
    intro:
      'Спочатку виконується аналіз, і показується, скільки займає кожен пункт. Нічого не видаляється, доки ви не підтвердите, і це ніколи не запускається саме чи у фоновому режимі.',
    analizar: 'Аналізувати',
    analizando: 'Аналіз…',
    cancelarAnalisis: 'Скасувати',
    vacio: 'Нічого очищати.',
    categorias: {
      temp: {
        nombre: 'Тимчасові файли',
        ayuda:
          'Файли у вашій папці TEMP, старші за 24 години. Видаляються безповоротно; створюються знову самі.',
      },
      'cache-chrome': {
        nombre: 'Кеш Google Chrome',
        ayuda: 'Лише папки кешу кожного профілю; ніколи cookie, паролі чи історія.',
      },
      'cache-edge': {
        nombre: 'Кеш Microsoft Edge',
        ayuda: 'Лише папки кешу кожного профілю; ніколи cookie, паролі чи історія.',
      },
      'cache-brave': {
        nombre: 'Кеш Brave',
        ayuda: 'Лише папки кешу кожного профілю; ніколи cookie, паролі чи історія.',
      },
      'cache-firefox': {
        nombre: 'Кеш Firefox',
        ayuda: 'Лише папка cache2 кожного профілю; ніколи cookie, паролі чи історія.',
      },
      'wolfcore-descargas': {
        nombre: 'Кешовані завантаження WolfCore Dev',
        ayuda: 'Окремі архіви, що більше не використовуються. Переміщуються до кошика.',
      },
      'wolfcore-registros': {
        nombre: 'Журнали WolfCore Dev',
        ayuda: 'Журнали старші за 30 днів. Переміщуються до кошика.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          "Необов'язково. Windows створює його знову, але для цього WolfCore Dev має працювати від імені адміністратора.",
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Браузер відкритий або працює у фоні: повністю закрийте його, щоб очистити кеш (в Edge також вимкніть пришвидшений запуск і фонові розширення)',
      'requiere-admin': 'Потрібен запуск WolfCore Dev від імені адміністратора',
      'ruta-vetada': 'Захищений шлях: не очищується',
      'temp-no-seguro':
        'Змінна TEMP вказує на папку, що не є тимчасовою папкою користувача (Документи, увесь диск, мережевий шлях…): не очищується',
    },
    borradoDefinitivo: 'Видаляються безповоротно (створюються знову самі)',
    borradoPapelera: 'Переміщуються до системного кошика',
    archivos: (n: number) => plural(n, 'файл', 'файли', 'файлів'),
    carpetas: 'За папками',
    truncado: 'Аналіз зупинено на граничній кількості файлів: насправді їх більше, ніж показано.',
    marcadas: (n: number, t: number) => `Вибрано категорій: ${n} із ${t}`,
    total: (b: string) => `Буде звільнено приблизно ${b}`,
    limpiar: 'Очистити вибране',
    confirmarTitulo: 'Очистити ці категорії?',
    confirmarTexto: (n: number) => `Буде очищено категорій: ${n}.`,
    confirmarDefinitivo: 'TEMP і кеші видаляються безповоротно (створюються знову самі).',
    confirmarPapelera: 'Журнали й завантаження WolfCore Dev потрапляють до кошика.',
    confirmarPrefetch:
      'Prefetch: Windows створює його знову, але перші запуски програм можуть бути трохи повільнішими.',
    confirmar: 'Так, очистити',
    cancelar: 'Скасувати',
    detener: 'Зупинити очищення',
    resultadoTitulo: 'Результат',
    liberado: (b: string) => `Звільнено: ${b}`,
    enPapelera: (b: string) =>
      `З них ${b} перебуває в кошику (місце повернеться, коли ви його очистите).`,
    saltados: (n: number) => `Пропущено файлів: ${n}`,
    cancelado: 'Очищення скасовано: те, що вже видалено, залишається видаленим.',
    topeEjecucion:
      'Досягнуто ліміту файлів за один запуск: виконайте аналіз і очищення знову, щоб продовжити.',
    registroFallido:
      'Не вдалося більше записувати журнал очищення, тому очищення зупинено: те, що було видалено, записано в журнал до цього моменту.',
    motivos: {
      'en-uso': 'Використовується',
      enlace: 'Посилання або точка повторного аналізу (не відстежується)',
      protegido: 'Захищено (.env, FlyEnv чи подібне)',
      cambio: 'Змінилося після аналізу',
      'sin-papelera': 'Кошик недоступний',
      ilegible: 'Не вдалося прочитати',
      error: 'Помилка під час видалення',
    },
    verRegistros: 'Переглянути журнали',
    registroEn: (r: string) => `Журнал цього очищення: ${r}`,
    otraVez: 'Почати знову',
    protegidas:
      'Ніколи не зачіпаються: дані, резервні копії, проєкти, бази даних і файли .env. Посилання не відстежуються, і нічого поза шляхами з цього списку не чіпається.',
  },
  preferencias: {
    asistente: 'Вітальний тур',
    asistenteAyuda:
      'Перегляньте тур основними екранами ще раз: служби, проєкти, бази даних, інструменти та Doctor.',
    asistenteAbrir: 'Переглянути тур',
    avanzadas: 'Показувати розширені розділи',
    avanzadasAyuda:
      'Додає на бічну панель рідко використовувані екрани, наприклад «Контейнери». Вони також доступні за Ctrl+K.',
  },
  paleta: {
    irAServicio: (nombre: string) => `Перейти до служби ${nombre}`,
    irAProyecto: (nombre: string) => `Перейти до проєкту ${nombre}`,
    versionesDe: (nombre: string) => `Версії ${nombre}`,
    asistente: 'Переглянути вітальний тур',
  },
  env: {
    bloques: {
      meilisearch: 'Meilisearch (з ключем)',
    },
  },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'Поки немає жодного рушія баз даних',
      texto:
        'Встановіть MySQL, MariaDB, PostgreSQL або MongoDB у розділі «Служби», щоб створювати бази даних своїх проєктів і керувати ними.',
      accion: 'Перейти до «Служб»',
    },
    serviciosVacio: {
      titulo: 'Служби поки не встановлено',
      texto:
        'Служби (Nginx, PHP, бази даних…) — це те, що змушує ваші сайти працювати. Почніть з Nginx і PHP або з бази даних.',
      accion: 'Встановити службу',
    },
    registrosSinFuentes: {
      titulo: 'Журналів поки немає',
      texto:
        "Журнали з'являються, щойно служба, сайт чи процес запише перший рядок. Увімкніть службу та поверніться.",
      accion: 'Перейти до «Служб»',
    },
    registrosElegir: {
      titulo: 'Виберіть журнал',
      texto: 'Виберіть джерело у списку вище, щоб стежити за його рядками в реальному часі.',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'Дампів поки немає',
      texto:
        "Коли сайт виконує dump(), dd() або wd(), дамп миттєво з'являється тут. Відкрийте свій сайт і запустіть цей код.",
      accion: '',
    },
    depuracionApagado: {
      titulo: 'Перехоплення вимкнено',
      texto:
        'Коли перехоплення ввімкнено, виклики dump() і dd() ваших сайтів надходять сюди, не зачіпаючи браузер. Увімкніть його та запустіть сайт.',
      accion: 'Увімкнути перехоплення',
    },
    depuracionElegir: {
      titulo: 'Виберіть дамп',
      texto: 'Виберіть дамп у списку, щоб побачити його вміст, файл і вихідний URL.',
      accion: '',
    },
    erroresVacio: {
      titulo: 'Помилок у журналах немає',
      texto:
        "Помилки PHP, Nginx і проєктів з'являються тут згрупованими одразу після запису. Порожній список — гарна новина.",
      accion: '',
    },
    erroresElegir: {
      titulo: 'Виберіть помилку',
      texto: 'Виберіть помилку у списку, щоб побачити її трасування й відкрити файл у редакторі.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'Перевірка ще не запускалася',
      texto:
        'Doctor перевіряє порти, hosts, сертифікати та версії й підказує, як виправити те, що не працює. Запустіть першу перевірку.',
      accion: 'Перевірити зараз',
    },
    doctorSinHallazgos: {
      titulo: 'Усе гаразд',
      texto:
        'Остання перевірка не виявила проблем. Перевірте знову, якщо щось перестане відповідати.',
      accion: 'Перевірити знову',
    },
    contenedoresVacio: {
      titulo: 'Контейнерів немає',
      texto:
        "Тут з'являються контейнери Docker або Podman на цьому комп'ютері. Створіть контейнер командою docker run або docker compose і натисніть «Оновити».",
      accion: 'Оновити',
    },
    avisos: {
      titulo: 'Сповіщень немає',
      texto: "Тут з'являтимуться збої служб, зайняті порти й сертифікати, що спливають.",
      accion: '',
    },
    instantaneas: {
      titulo: 'Знімків поки немає',
      texto:
        'Знімок зберігає стан цієї бази даних, щоб можна було повернутися, якщо щось піде не так. Створіть перший кнопкою вище.',
      accion: '',
    },
    basesSinBases: {
      titulo: 'На цьому сервері немає власних баз даних',
      texto: 'Створіть базу даних для проєкту або імпортуйте наявний дамп.',
      accion: 'Створити базу даних',
    },
    iaNube: {
      titulo: 'Постачальників ШІ поки немає',
      texto:
        "Постачальник (OpenAI, Anthropic, OpenRouter та інші) дає змогу вашим агентам використовувати хмарні моделі. Ключ зберігається в зашифрованому вигляді на цьому комп'ютері.",
      accion: 'Додати постачальника',
    },
    iaSinModelos: {
      titulo: 'Локальних моделей поки немає',
      texto: 'Завантажте модель зі списку нижче, щоб використовувати її без інтернету.',
      accion: '',
    },
    versiones: {
      titulo: 'Немає версій для показу',
      texto:
        'Список завантажується з офіційного каталогу. Перевірте підключення та оновіть список.',
      accion: 'Оновити список',
    },
    buscar: {
      titulo: 'Збігів немає',
      texto:
        'У папці немає нічого, що відповідає вашому пошуку. Спробуйте інші слова, зніміть позначку «Враховувати регістр» або перевірте фільтри файлів.',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'Вітальний тур',
    saltar: 'Пропуск',
    terminar: 'Почати роботу',
    cerrar: 'Закрити тур',
    reabrir:
      'Натисніть Esc, щоб вийти. Ви можете переглянути його знову в «Налаштування › Вигляд».',
    ir: (destino: string) => `Перейти: ${destino}`,
    pasos: {
      bienvenida: {
        titulo: 'Ласкаво просимо до WolfCore Dev',
        texto:
          "Ваше локальне середовище розробки в одному вікні: служби, сайти .test з HTTPS, бази даних, пошта та інструменти. Тур займе хвилину й нічого не змінює на вашому комп'ютері.",
      },
      servicios: {
        titulo: 'Служби',
        texto:
          'Тут перемикачем вмикаються Nginx, PHP і бази даних. Якщо їх ще не встановлено, вкладка «Версії» завантажить їх із перевіреною контрольною сумою.',
      },
      proyectos: {
        titulo: 'Проєкти',
        texto:
          'Створіть новий проєкт або імпортуйте папку чи репозиторій. Кожен сайт має власну адресу .test з HTTPS.',
      },
      bases: {
        titulo: 'Бази даних',
        texto:
          'Створюйте бази даних, імпортуйте й експортуйте дампи, робіть резервні копії та відновлюйте їх, не виходячи із застосунку.',
      },
      herramientas: {
        titulo: 'Інструменти та Ctrl+K',
        texto:
          'Редактор, пошук, порівняння, паролі, зображення й не лише, згруповані за розділами. Натисніть Ctrl+K на будь-якому екрані, щоб перейти до потрібного.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'Перевіряє порти, hosts, сертифікати та версії й підказує, як виправити те, що не працює. Відкривайте його, коли щось не відповідає.',
      },
      listo: {
        titulo: 'Усе готово',
        texto:
          'Почніть із ввімкнення служби або створення першого проєкту. Ви можете переглянути цей тур знову в «Налаштування › Вигляд».',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: {
        sustituida: (v: string) => `Її більше немає в каталозі: замість неї буде встановлено ${v}.`,
      },
      resultado: {
        sustituida: (v: string) => `Замість версії з профілю встановлено ${v}.`,
      },
    },
    motivos: {
      version_sustituida:
        'Цієї версії більше немає в каталозі: встановлено найновішу з тієї самої мінорної версії (наприклад, 8.3).',
    },
  },
  consultasLentas: {
    boton: 'Повільні запити',
    titulo: (motor: string) => `Повільні запити в ${motor}`,
    descripcion:
      'Запити, що виконуються довше за вибраний вами час, від найповільнішого до найшвидшого.',
    cargando: 'Завантаження повільних запитів…',
    estadoTitulo: 'Стан журналу',
    estadoActivo: (s: string) => `Журналювання ввімкнено: записуються запити довші за ${s} с.`,
    estadoApagado: 'Журналювання вимкнено.',
    noGestionada:
      'WolfCore Dev не керує цим сервером (наприклад, запущеним іншою програмою): тут його можна лише переглядати, але не змінювати.',
    umbral: 'Записувати запити довші за (секунд)',
    activar: 'Увімкнути журналювання',
    aplicarUmbral: 'Змінити час',
    desactivar: 'Вимкнути журналювання',
    actualizar: 'Прочитати журнал знову',
    confirmarTitulo: 'Зміна журналювання повільних запитів',
    confirmarActivar: (motor: string, s: string) =>
      `Журналювання буде ввімкнено для всього сервера ${motor} (запити довші за ${s} с) і збережено в його конфігурації. Це вплине на всі його бази даних.`,
    confirmarDesactivar: (motor: string) =>
      `Журналювання буде вимкнено для всього сервера ${motor} і збережено в його конфігурації. Уже записане зберігається.`,
    confirmarBoton: 'Підтвердити зміну',
    cancelar: 'Скасувати',
    activado: 'Журналювання повільних запитів увімкнено',
    desactivado: 'Журналювання повільних запитів вимкнено',
    privacidad:
      "SQL показується так, що його значення замінено на «?», оскільки він може містити справжні дані клієнтів. Ніщо з цього не залишає цей комп'ютер і не записується в журнали застосунку.",
    columnas: {
      duracion: 'Тривалість',
      filas: 'Переглянуто рядків',
      base: 'База даних',
      fecha: 'Дата',
      sql: 'Запит',
      acciones: 'Дії',
    },
    sinBase: 'Не визначено',
    verLiteral: 'Показати як є',
    ocultarLiteral: 'Приховати значення',
    literalAviso: 'SQL як є, зі значеннями',
    sqlOculto: 'SQL приховано',
    sqlOcultoAyuda:
      'Цей запит не можна показати без ризику для справжніх даних: на цьому сервері є бази даних зі справжніми даними або запит не можна надійно віднести до бази даних.',
    copiar: 'Копіювати',
    copiado: 'Запит скопійовано',
    truncado: (n: number) =>
      `Показано щонайбільше ${n} найповільніших запитів із кінця журналу (останні 5 МБ).`,
    vacioTitulo: 'Повільних запитів поки не записано',
    vacioTextoApagado:
      "Увімкніть журналювання й користуйтеся своїми сайтами: запити, що виконуються довше за вибраний час, з'являться тут.",
    vacioTextoActivo:
      'Поки жоден запит не перевищив вибраний час. Користуйтеся своїми сайтами й знову прочитайте журнал.',
  },
  esquemaBd: {
    boton: 'Перегляд схеми',
    titulo: (base: string) => `Схема ${base}`,
    descripcion:
      "Лише читання: таблиці, стовпці, ключі та зв'язки. Дані ваших таблиць не читаються.",
    cargando: 'Читання схеми…',
    error: 'Не вдалося прочитати схему бази даних.',
    reintentar: 'Повторити',
    buscar: 'Пошук таблиці',
    tablas: (n: number) => plural(n, 'таблиця', 'таблиці', 'таблиць'),
    vista: 'подання',
    truncado: (n: number) => `Список обрізано до ${n} таблиць: у базі даних їх більше.`,
    sinResultados: 'Жодна таблиця не відповідає пошуку.',
    elegir: "Виберіть таблицю у списку, щоб побачити її стовпці, ключі та зв'язки.",
    columnas: 'Стовпці',
    indices: 'Індекси',
    sinIndices: 'У цій таблиці немає індексів.',
    relaciones: "Зв'язки",
    sinRelaciones: "У цієї таблиці немає зв'язків з іншими.",
    salientes: 'Посилається на',
    entrantes: 'На неї посилаються',
    alBorrar: 'Під час видалення:',
    alActualizar: 'Під час оновлення:',
    irA: (tabla: string) => `Перейти до таблиці ${tabla}`,
    col: {
      nombre: 'Стовпець',
      tipo: 'Тип',
      nulo: 'Допускає NULL',
      defecto: 'Типове значення',
      clave: 'Ключ',
    },
    si: 'Так',
    no: 'Ні',
    pk: 'PK',
    unico: 'унікальний',
    vacioTitulo: 'У цій базі даних немає таблиць',
    vacioTexto:
      "Коли ви створите таблиці (наприклад, міграціями вашого проєкту), вони з'являться тут.",
  },
  sitios: {
    tipos: {
      rails: 'Rails (локальний порт)',
      springboot: 'Spring Boot (локальний порт)',
      aspnet: 'ASP.NET Core (локальний порт)',
    },
    tiposCortos: {
      rails: 'Rails',
      springboot: 'Spring Boot',
      aspnet: 'ASP.NET',
    },
  },
};
