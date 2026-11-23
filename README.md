# WolfCore Dev

WolfCore Dev es un reemplazo propio de FlyEnv y ServBay, para uso personal. Es una aplicación de escritorio (Electron + Vue 3 + TypeScript) que administra un entorno de desarrollo local en Windows: Nginx, varias versiones de PHP, dominios `.test` con HTTPS, túneles de Cloudflare, bases de datos (MySQL, MariaDB, PostgreSQL con pgvector, Redis y MongoDB), Composer, correo de prueba con Mailpit, FTP por sitio e IA local con Ollama.

**Cambio de nombre:** el programa se llamaba "Entorno Local" (Proyectoentornolocal). Ahora el nombre visible es **WolfCore Dev** (`appId` `com.johanvelez.wolfcoredev`). El repositorio y los paquetes npm conservan su nombre. La carpeta de datos pasó de `%LOCALAPPDATA%\Proyectoentornolocal` a `%LOCALAPPDATA%\WolfCoreDev`: si al iniciar existe la vieja y no la nueva, se renombra sola una vez (si el renombrado falla porque algo la tiene abierta, se usa la vieja esa vez, se avisa y se reintenta en el próximo inicio). El bloque del archivo hosts pasa a `# >>> WolfCore Dev (no editar a mano)` / `# <<< WolfCore Dev` en la siguiente sincronización.

**Desinstalar la app vieja "Entorno Local":** como cambió el `appId` (antes `com.johanvelez.entornolocal`), el instalador de WolfCore Dev **no reemplaza** a la versión anterior: las dos quedan instaladas, cada una con su acceso directo. Antes de abrir WolfCore Dev por primera vez:

1. Cierre "Entorno Local" desde su icono de la bandeja (**Salir** → **Sí, apagar**) para que suelte los puertos y la carpeta de datos (si sigue abierta, el renombrado de la carpeta falla y se reintenta en el siguiente inicio).
2. Desinstálela en **Configuración → Aplicaciones → Aplicaciones instaladas → Entorno Local → Desinstalar**. El desinstalador quita el programa, no la carpeta de datos: bases, sitios y certificados siguen en `%LOCALAPPDATA%\WolfCoreDev` (o en la vieja hasta que se renombre).
3. Si había agregado las herramientas al PATH con la versión vieja, esa entrada apunta a `%LOCALAPPDATA%\Proyectoentornolocal\tools\bin`, que tras el renombrado ya no existe: quítela a mano de las variables de entorno del usuario y use **Ajustes → PATH del usuario → Agregar al PATH del usuario** en WolfCore Dev.

Diseños: MVP en `docs/superpowers/specs/2026-11-17-proyectoentornolocal-design.md`, Etapa A en `docs/superpowers/specs/2026-11-18-etapa-a-design.md`, Etapa B en `docs/superpowers/specs/2026-11-19-etapa-b-design.md`.

## Qué trae

### Web (MVP)

- **Servicios:** instala Nginx, PHP (NTS x64, varias ramas a la vez) y cloudflared desde sus fuentes oficiales, verificando el SHA-256 antes de usarlos. Los enciende, los apaga y los vigila: un servicio está "encendido" solo si su proceso vive y su puerto responde. Si se caen, se reinician con espera creciente.
- **PHP por sitio:** cada rama corre como `php-cgi.exe -b 127.0.0.1:<puerto>` con 2 trabajadores (8.3 → 9830/9831, 8.4 → 9840/9841), sin chocar con los puertos 908x de FlyEnv.
- **Sitios `.test`:** detecta Laravel, CodeIgniter 3, estático, proxy (Vite, FastAPI, Node…) o personalizado. Genera el vhost con reglas de seguridad (bloqueo de `.env`, archivos ocultos y carpetas internas de CodeIgniter) y valida con `nginx -t` antes de recargar. Las rutas con espacios y tildes funcionan.
- **Archivo hosts:** escribe solo su propio bloque, pide permiso de administrador una vez por cambio y, si se cancela, ofrece el comando para pegar a mano. Avisa si un dominio ya estaba fuera del bloque (por ejemplo, escrito por FlyEnv).
- **Túneles rápidos de Cloudflare:** un interruptor por sitio abre `https://…trycloudflare.com` hacia el sitio, cambia la variable de URL base del `.env` mientras está abierto y la restaura al cerrarlo.
  - El `.env` se escribe siempre de forma atómica. Antes del primer cambio se guarda una copia en `run/urlbase-<id>.respaldo` dentro de la carpeta de datos del programa, **nunca en la carpeta del proyecto**.
  - Al cerrar, si nadie tocó el `.env` se devuelven sus bytes exactos. Si cambió mientras el túnel estaba abierto, se restaura solo la línea de la variable y la copia se conserva con fecha (la aplicación lo avisa).
  - Editar un sitio con el túnel abierto (carpeta, variable o dominio) cierra el túnel primero. Al cerrar sesión o apagar Windows, los `.env` se restauran antes de cerrar los procesos.
- **Host desconocido:** Nginx responde 404 con una página breve "Sitio no encontrado en WolfCore Dev".
- **Ajustes:** el puerto de Nginx y los trabajadores de PHP se aplican al guardar (regenera vhosts y reinicia o recarga lo necesario).
- **Reapertura segura:** al reabrir la aplicación con servicios corriendo, los reutiliza por PID y ejecutable en lugar de duplicarlos.
- **Sin ventanas:** los servidores arrancan en una consola oculta (también los procesos que crean, como cada conexión de PostgreSQL) y siguen corriendo si cierra la aplicación.

### HTTPS local (Etapa A)

- Al activar HTTPS en un sitio por primera vez, WolfCore Dev crea su propia autoridad de certificados (`ca/wolfcore-dev-ca.crt`, RSA 3072, 10 años) y emite un certificado por sitio (dominio + alias, 825 días; se renueva solo 30 días antes de vencer o si cambian los dominios).
- **Ajustes → HTTPS → Instalar autoridad** la agrega al almacén raíz **de su usuario** (`certutil -user -addstore Root`). No pide administrador; Windows muestra su propia confirmación. Chrome y Edge confían de inmediato.
- **Firefox** usa su propio almacén: abra `about:config` y active `security.enterprise_roots.enabled` (Ajustes lo recuerda).
- Cada sitio tiene los interruptores **HTTPS** y **Redirigir a HTTPS**. La redirección se omite si la petición llega por un túnel (cabecera `Cf-Connecting-Ip` o `X-Forwarded-Proto: https`), así el túnel nunca entra en bucle.
- El puerto HTTPS es 443 por defecto y se cambia en Ajustes. Si otro programa lo ocupa (por ejemplo el Nginx de FlyEnv), los sitios siguen sirviendo por HTTP y muestran "HTTPS pendiente" con el programa y su PID.

### Bases de datos (Etapa A)

| Servicio          | Versión  | Puerto (alternativo si FlyEnv ocupa el estándar) | Acceso                                |
| ----------------- | -------- | ------------------------------------------------ | ------------------------------------- |
| MySQL             | 8.4 LTS  | 3306 (3308)                                      | `root` con clave aleatoria            |
| MariaDB           | 11.4 LTS | 3307 (3309)                                      | `root` con clave aleatoria            |
| PostgreSQL        | 17       | 5432 (5433)                                      | `postgres` con clave aleatoria, SCRAM |
| Redis             | 8        | 6379 (6380)                                      | sin clave, solo 127.0.0.1             |
| MongoDB + mongosh | 8        | 27017 (27018)                                    | sin autenticación, solo 127.0.0.1     |

- Se instalan desde sus fuentes oficiales (dev.mysql.com, archive.mariadb.org, EnterpriseDB, github.com/redis-windows, fastdl.mongodb.org) con SHA-256 verificado. Todos escuchan solo en 127.0.0.1.
- Los datos viven en `data/<servicio>/<versión>/`. Desinstalar nunca borra datos; **Borrar datos** pide escribir el nombre del servicio. Las claves se guardan en `etc/credenciales.json` (fuera de `config.json`) y se ven en **Datos de conexión**.
- Si un puerto está ocupado, el aviso dice qué programa lo usa y su PID y ofrece **Usar otro puerto**.
- Pantalla **Bases de datos**: crear (con usuario propio opcional), borrar (pide el nombre exacto), **Respaldar** (`mysqldump --single-transaction --routines --triggers` o `pg_dump -Fc`, por defecto en `Documentos\WolfCore Dev\Respaldos`), **Restaurar respaldo** (`.sql`, `pg_dump` custom aunque tenga extensión `.sql`, `.gz`, `.zip`, `.rar`/`.7z` con el `tar.exe` de Windows), **Importar desde otro servidor**, **Datos de conexión** con el bloque `.env` listo para copiar y **Abrir en Adminer**.
- **Restaurar siempre va a una base nueva o vacía.** Si la base destino tiene tablas, pide confirmar; al confirmar, primero se guarda una copia de seguridad de esa base (`<base>-antes-de-sobrescribir-<fecha>`) y luego se reemplaza por completo (nunca se mezclan datos). Restaure solo respaldos de confianza: un respaldo puede ejecutar acciones en el servidor.
- **Bloque `.env`:** usa las variables del proyecto (Laravel `DB_*`, CodeIgniter `DB_*` o `database.default.*`). Los valores con espacios, `#`, `$`, `"` o `\` van entre **comillas simples** (literales; una ruta como `C:\Program Files\…` no rompe phpdotenv). Solo si el valor tiene una comilla simple se usan comillas dobles, escapadas según el lector del proyecto (phpdotenv, CodeIgniter 4 o el lector propio de CodeIgniter 3 de los proyectos WolfCore, que no admite comillas al principio ni al final del valor).
- **Adminer** se sirve en `http://127.0.0.1:8090` (solo local) con el PHP más reciente encendido. "Abrir en Adminer" pone servidor y usuario; la clave nunca va en la URL.

### pgvector

PostgreSQL usa pgvector compilado una vez en su equipo:

1. **Bases de datos → Instalar pgvector.** Si faltan las herramientas de compilación, instala `Microsoft.VisualStudio.2022.BuildTools` (carga VCTools) con `winget`. Windows pide permiso de administrador y descarga unos 6 GB; las Build Tools quedan instaladas en el equipo.
2. Descarga el código oficial de pgvector (versión fijada por SHA-256), lo compila con `nmake /F Makefile.win` y lo instala en la carpeta de su PostgreSQL (lo apaga durante la copia y lo vuelve a encender).
3. En cada base que lo necesite, use **Activar vector** (`CREATE EXTENSION IF NOT EXISTS vector`).

### Composer y terminal

- Instala `composer.phar` (getcomposer.org, SHA-256 verificado) y crea los atajos `php.cmd` y `composer.cmd` en `tools/bin`, con el PHP por defecto de Ajustes y su `php.ini`.
- **Terminal aquí** (en cada sitio) abre una terminal en la carpeta del sitio con el PHP de ese sitio y Composer primero en el PATH.
- **Agregar al PATH del usuario** (Ajustes) es opcional, no pide administrador y se puede quitar.

### Correo (Mailpit)

- SMTP en `127.0.0.1:1025` y buzón web en `http://127.0.0.1:8025`. Ningún correo sale a internet.
- La pantalla **Correo** muestra el bloque `.env` de Laravel (`MAIL_MAILER=smtp`, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`) e Inicio cuenta los correos sin leer.

### FTP por sitio

- Servidor FTP integrado (puerto 2121, pasivos 30000–30100, fuera de los puertos efímeros de Windows). Cada sitio tiene su interruptor **FTP**: crea el usuario `<id del sitio>` con clave aleatoria, encerrado en la carpeta del sitio, con opción de solo lectura y de regenerar la clave.
- Solo modo pasivo (PORT/EPRT rechazados). Por defecto solo escucha en 127.0.0.1.
- **Aviso:** "Permitir conexiones de la red local" abre el FTP a su red y **el FTP no cifra nada** (usuarios, claves y archivos viajan en claro). Úselo solo en una red de confianza. No hay FTPS ni SFTP en esta etapa.

### IA local (Ollama)

- Instala Ollama desde su zip oficial (unos 1,6 GB) y lo corre en `127.0.0.1:11434`, con los modelos en `data/ollama/actual/models` (no en su perfil).
- Pantalla **IA local**: modelos instalados, descarga con progreso (sugerencias: llama3.2, qwen2.5-coder, mistral, nomic-embed-text), borrar, probar con un mensaje y espacio usado. Los modelos pesan de 1 a más de 40 GB y solo se descargan cuando usted lo pide.
- Datos de conexión: `http://127.0.0.1:11434` y el endpoint compatible con OpenAI `http://127.0.0.1:11434/v1`, con un bloque `.env` de ejemplo.

### Proyectos (Etapa B)

- **Agregar un proyecto** desde **Proyectos → Nuevo** de tres formas: un repositorio de **GitHub** (lista sus repos con `gh` o con un token que se guarda cifrado con `safeStorage`; nunca va en la URL, en `.git/config` ni en los registros), una **URL** de git cualquiera o una **carpeta** que ya existe. La **carpeta vigilada** (por ejemplo `C:\Proyectos`) sugiere sola las subcarpetas que parecen proyectos.
- **Detección y recetas:** reconoce Laravel, CodeIgniter 3 y 4, FastAPI, Node, WordPress y estático, con sus versiones y servicios (lee `.env.example`). Propone una receta editable: Composer, `.env` (con la conexión a la base y Mailpit), `key:generate`, crear o restaurar la base, migraciones, `storage:link`, `npm ci` y `build`, `venv` y `pip`, y el sitio con HTTPS. Solo corre con **Confío en este repositorio** marcado; cada paso se puede reintentar, omitir o cancelar, y nunca pisa un `.env` existente sin confirmación.
- **`wolfcore.yml`** en la raíz del proyecto fija tipo, dominio, versiones (PHP, Node, Python), variables extra del `.env`, procesos y una receta propia. Si la receta cambia después de confiar, se avisa antes de volver a correrla.
- **Node y Python por proyecto:** Node (desde nodejs.org, verificado con `SHASUMS256`) y Python (paquete oficial de NuGet, con huella) se instalan en **Servicios**, varias versiones a la vez, sin tocar el PATH del sistema. Cada proyecto usa la que pide (`wolfcore.yml`, `.nvmrc`, `engines`, `.python-version`, `requires-python`) y su `.venv`.
- **Procesos de proyecto** (`npm run dev`, `queue:work`, `uvicorn`…): supervisados con la consola oculta, con su log, reinicio con espera creciente y puerto libre automático. Un sitio FastAPI o Node envía su tráfico por proxy al proceso marcado.
- **Traer cambios:** `git fetch` y avance rápido; con cambios locales o ramas divergentes no toca nada y avisa. Si llegan `composer.lock`, `package-lock.json`, migraciones o `requirements.txt`, ofrece los pasos que conviene correr.

### Panel, registros y herramientas (Etapa B)

- **Inicio:** servicios encendidos, proyectos, túneles y hosts de un vistazo, con CPU, RAM, disco y red del equipo y de cada servicio o proceso (se mide cada 3 s solo con la ventana visible).
- **Registros:** sigue en vivo los logs de Nginx, PHP, los servicios, los sitios (también `storage/logs/laravel.log`), los procesos de proyecto y los túneles, con filtro por texto y nivel, pausa y **Abrir carpeta**.
- **Herramientas** (sin conexión): QR, JSON, expresiones regulares, comparar textos, tiempo, puertos y procesos (finalizar con confirmación), limpieza del BOM de UTF-8, certificados con la CA local, cripto (hash, base64, URL, UUID, contraseñas, JWT), Markdown, entorno del sistema (PATH, versiones y variables con secretos ocultos), información de archivo y cliente WebSocket.

### Depuración: `dump()`/`dd()` (Etapa C)

- **Depuración** enciende un receptor local (`127.0.0.1:9912`, con un token aleatorio en cada sesión que solo leen los sitios con la captura) y muestra en vivo los volcados con sitio, archivo, línea y URL, con filtro por sitio, origen y texto. Quedan **solo en memoria** (los últimos 500) y **Copiar** enmascara las claves conocidas.
- La captura se enciende **por sitio** y pide confirmación; apagar el receptor la apaga en todos. Nunca toca el `php.ini` de la rama ni escribe en el proyecto.
- **PHP** (Laravel, CodeIgniter 3 y 4, WordPress, personalizado): el PHP propio del sitio carga `etc/php/wolfcore-prepend.php` (`auto_prepend_file`), que define `wd()` y, si el proyecto no los define, `dump()` y `dd()`. Laravel y Symfony siguen mostrando el volcado en la página como siempre; en CodeIgniter 3 u otros sin VarDumper, `dump($x)` muestra un `print_r` y `wd($x)` solo lo envía a WolfCore Dev. Si el receptor no responde, no pasa nada visible y la petición no tarda más de 200 ms extra; `dd()` sigue deteniendo. Un `auto_prepend_file` anterior se sigue cargando. Si el proyecto declara su propia función `dump()` o `dd()` sin `function_exists`, PHP dará error: desactive la captura en ese sitio.
- **Python** (FastAPI): los procesos del sitio reciben `etc/python` en el `PYTHONPATH` (desde su próximo arranque): `from wolfdump import dump` y `dump(valor)` (devuelve el valor y no imprime nada).
- **El token** vive en `run/depuracion.json` solo mientras el receptor escucha: en Windows el archivo queda solo para el usuario actual (`icacls`, sin permisos heredados) y en macOS/Linux con modo 600. Lleva el PID del receptor y su fecha se renueva cada 15 s: con un archivo sin renovar desde hace más de 60 s (la app se cortó) no se envía nada, y Python (en todos los sistemas) y PHP con `posix` o `/proc` tampoco envían a un PID muerto. **Riesgo residual:** en el minuto que sigue a un cierre forzado, otro programa que ocupe el puerto 9912 podría recibir volcados (en Windows, PHP no puede preguntar barato si el PID vive); al volver a abrir WolfCore Dev el archivo viejo se borra. El token nunca pasa como argumento en el prepend (no sale en trazas con argumentos), pero `xdebug.mode=trace` registra los argumentos de las funciones internas y puede dejarlo en su archivo de traza: no use la captura y el modo `trace` a la vez si eso le preocupa.
- En memoria se cuentan 2 bytes por carácter (UTF-16): el tope de 32 MiB son unos 16 millones de caracteres.
- **Errores** (pestaña de Depuración): lee los registros que ya sigue **Registros** (log de PHP, log de errores de Nginx con los mensajes de PHP que llegan por FastCGI, `laravel.log`, `application/logs/log-*.php` de CodeIgniter 3 y los tracebacks de Python de los procesos de proyecto) y agrupa cada error por tipo, mensaje (sin números, ids ni rutas temporales) y archivo:línea, con contador, primera y última vez y la traza de la última vez. **Abrir en el editor** abre VS Code en esa línea, solo si el archivo está dentro de la carpeta del sitio. La comprobación usa la ruta real; entre ella y la apertura queda una ventana breve en la que un enlace creado en el proyecto podría hacer que el editor abra otro archivo (solo para leer, con su mismo usuario). Los mensajes y trazas van con las claves conocidas enmascaradas.

### MCP para Claude Code (Etapa B)

- **Ajustes → Servidor MCP** lo activa en `http://127.0.0.1:7790/mcp` (puerto configurable) con un token Bearer aleatorio. **Copiar configuración para Claude Code** deja en el portapapeles el comando `claude mcp add --transport http wolfcore …` y el bloque para `.mcp.json`; **Regenerar token** invalida el anterior.
- Herramientas: estado general, proyectos, servicios (iniciar y detener), bases (listar, crear, respaldar, restaurar, borrar), túneles, ejecutar la receta, traer cambios, leer registros y finalizar procesos. Las acciones destructivas y las recetas piden confirmación en la ventana de WolfCore Dev.
- Depuración (Etapa C): `listar_dumps`, `leer_dump` (hasta 64 KiB de texto), `listar_errores` y `leer_error` son de solo lectura, con los secretos enmascarados y las salidas acotadas; `limpiar_dumps` pide confirmación en la ventana.

### Interfaz (Etapa B)

- Tema **claro, oscuro o del sistema** (también la barra de título), color de acento e idioma **español o inglés**, en caliente.
- **Ctrl+K** abre la paleta de comandos: ir a cualquier pantalla, encender o apagar todo, agregar o clonar proyectos y cambiar tema o idioma.
- **Asistente de primer uso:** carpeta de proyectos, lo básico (Nginx, PHP 8.4, Composer y Node LTS), la CA de HTTPS, GitHub y la carpeta vigilada. Se puede repetir desde **Ajustes**.

## Carpeta de datos

`%LOCALAPPDATA%\WolfCoreDev`:

- `bin/<servicio>/<versión>/`: binarios descargados.
- `data/<servicio>/<versión>/`: datos de las bases, Mailpit y modelos de Ollama.
- `etc/`: `nginx.conf`, vhosts, `php.ini`, `my.ini`, `redis.conf` y `credenciales.json`.
- `ca/` y `certs/`: autoridad y certificados HTTPS.
- `tools/`: `bin` (atajos `php.cmd` y `composer.cmd`) y `adminer`.
- `logs/`, `run/`, `tmp/` y `config.json`.

Los proyectos nunca se mueven ni se borran.

## Requisitos

- Windows 10 u 11 de 64 bits (los `.rar`/`.7z` necesitan el `tar.exe` de Windows 11).
- Para desarrollar: Node 22.12 o superior y npm.
- Conexión a internet para descargar los binarios, los túneles y los modelos de IA.

## Estructura

- `packages/core` (`@pel/core`): lógica en TypeScript puro, sin Electron. Cada acción es un método de `Nucleo`; el servidor MCP publica esos mismos métodos.
- `apps/desktop` (`@pel/desktop`): la aplicación de escritorio (Electron + Vue 3 + Naive UI).

## Desarrollo

```bash
npm install
npm run dev         # abre la aplicación con recarga en caliente
npm run lint        # ESLint y Prettier
npm run typecheck   # TypeScript estricto
```

## Pruebas

```bash
npm test                    # pruebas unitarias (sin red ni procesos reales)
npm run test:win            # integración real en Windows (MVP, Etapa A y Etapa B)
npm run test:win:pgvector   # pgvector real: instala Build Tools (UAC, ~6 GB)
```

`npm run test:win` trabaja en una carpeta temporal y en **puertos altos**, para convivir con FlyEnv encendido (Nginx 18089, HTTPS 18443, MySQL 13306, MariaDB 13307, PostgreSQL 15432, Redis 16379, MongoDB 27117, Mailpit 11025/8025, Ollama 21434, FTP 12121 con pasivos 52000–52020, Adminer 8090):

- MVP: Nginx 8089, PHP 8.4 y cloudflared; sitios estático, Laravel (ruta con espacio y Ñ) y CodeIgniter 3; reglas de seguridad y un túnel rápido (si Cloudflare no responde, ese paso se omite).
- Etapa A: instala todos los servicios; en MySQL, MariaDB y PostgreSQL crea una base con datos (incluido `O'Brien` y una rutina), la respalda, la restaura en otra base, comprueba que una base con tablas se rechaza sin confirmar y se reemplaza (con copia previa) al confirmar, e importa desde el servidor; restaura un `pg_dump -Fc` guardado como `.sql` y un volcado plano; Redis `PING`, MongoDB con mongosh, un correo SMTP leído por la API de Mailpit, un sitio HTTPS verificado contra la CA temporal (y sin redirección cuando llega `Cf-Connecting-Ip`), FTP (subir, bajar y PORT rechazado), Composer por el atajo, el bloque `.env` leído con PHP real por phpdotenv, CodeIgniter 4 y el lector de CodeIgniter 3 de los proyectos WolfCore, Adminer, Ollama (`/api/tags`, **sin descargar modelos**), que ningún servicio abra ventanas de consola (ni con varias conexiones a PostgreSQL abiertas) y el apagado sin procesos huérfanos.
- Etapa B (Nginx 18189, HTTPS 18543, MySQL 13406, MCP 17790): instala Node LTS y Python 3.12 desde el catálogo; clona `laravel/laravel` con git y corre su receta completa (Composer, `.env`, clave, MySQL, migrate, `storage:link`, `npm ci` y `build`, sitio HTTPS) hasta un 200 por HTTPS; un FastAPI mínimo con `venv`, `pip`, `uvicorn` supervisado y sitio proxy que responde 200; **Traer cambios** sobre un repositorio local que recibe un `composer.lock`; el MCP (lista de herramientas, rechazo sin token y `estado_general`); una muestra de métricas con los PID de los servicios y del proceso; y, al final, sin ventanas visibles ni procesos de la carpeta temporal. Las cachés de Composer, npm y pip van a la carpeta de caché de las pruebas.

Nunca instala la CA en el almacén real, no toca el archivo hosts ni el PATH del usuario y al final borra la carpeta temporal. Los paquetes descargados quedan en `%TEMP%\pel-etapa-a-cache` para no volver a bajarlos (otra carpeta con `PEL_INT_CACHE`; `PEL_INT_CONSERVAR=1` conserva la carpeta temporal para revisarla). La primera vez descarga unos 3,5 GB.

`npm run test:win:pgvector` instala las Build Tools con winget si faltan (acepte el aviso de Windows), compila pgvector contra un PostgreSQL 17 temporal y prueba `CREATE EXTENSION vector` y una distancia. Córrala solo cuando quiera instalar las Build Tools en el equipo.

## Instalador

```bash
npm run dist:win -w @pel/desktop
```

Genera el instalador NSIS en `apps/desktop/release/` (`WolfCore Dev Setup <versión>.exe`), con el icono del lobo. Es por usuario y permite elegir la carpeta. No está firmado, así que Windows SmartScreen puede pedir confirmación la primera vez.

## Transición desde FlyEnv

1. **Puertos:** FlyEnv usa 80 y 443 (Nginx), 3306 (MySQL) y 5432 (PostgreSQL). Mientras conviven, apague el servicio en FlyEnv o use en WolfCore Dev el puerto alternativo que ofrece el aviso (**Usar otro puerto**: 3308, 5433, 6380, 27018) o cambie el puerto de Nginx y de HTTPS en Ajustes. PHP no choca: FlyEnv usa 908x y WolfCore Dev 98xx.
2. **Traer las bases de FlyEnv**, de una de dos formas:
   - **Desde sus respaldos** (recomendado si FlyEnv está apagado): en **Bases de datos → Restaurar respaldo**, elija el `.sql`, `.dump`, `.gz`, `.zip` o `.rar` (por ejemplo los de `C:\Proyectos\_respaldos\flyenv-<fecha>`) y una base nueva. Los `pg_dump` en formato custom se reconocen aunque tengan extensión `.sql`.
   - **Importar desde otro servidor** (con **FlyEnv encendido**): en **Bases de datos → Importar desde otro servidor**, escriba host `127.0.0.1`, el puerto de FlyEnv (3306 o 5432), usuario, clave y la base de origen. WolfCore Dev solo lee del origen (`mysqldump --single-transaction` / `pg_dump`) y restaura en una base local nueva; nunca escribe en FlyEnv. Para esto el servicio propio de WolfCore Dev debe estar en el puerto alternativo (3308 o 5433). Si el servidor de FlyEnv es más nuevo que las herramientas locales, se avisa qué versión hace falta.
3. **pgvector:** después de restaurar la base del bot, use **Instalar pgvector** y **Activar vector** en esa base.
4. **`.env` de los proyectos:** copie el bloque de **Datos de conexión** (puerto y clave de WolfCore Dev).
5. **Archivo hosts:** si FlyEnv ya escribió los mismos dominios, se conservan y la aplicación lo avisa. Quítelos de FlyEnv cuando ya no lo use.
6. **Sitios:** se crean de nuevo en **Sitios → Nuevo**, eligiendo la carpeta del proyecto (el tipo se detecta solo); active HTTPS donde lo necesite.

## Hoja de ruta

| Etapa | Contenido                                                                                                                       | Estado                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| MVP   | Windows: Nginx, PHP, sitios, hosts, túneles rápidos e interfaz                                                                  | Hecha                                                               |
| A     | HTTPS, MySQL, MariaDB, PostgreSQL + pgvector, Redis, MongoDB, módulo de bases de datos, Adminer, Composer, Mailpit, FTP, Ollama | Hecha                                                               |
| B     | Proyectos desde GitHub, recetas y `wolfcore.yml`, Node y Python, procesos, panel, registros, herramientas, MCP, temas e idiomas | Terminada (el montaje de los 6 proyectos reales lo hace el usuario) |
| C     | IA en la nube y Hermes, agentes, depuración de PHP; Podman/Docker mínimo (detectar, listar, encender y apagar)                  | Pendiente                                                           |
| D     | Proyectos, compartir y respaldo del entorno                                                                                     | Pendiente                                                           |
| E     | Multiplataforma (macOS y Linux), instaladores y CI                                                                              | Pendiente                                                           |
| F     | Resto de paridad con los referentes y mejoras propias                                                                           | Pendiente                                                           |

Plan aprobado de las etapas C a F: `docs/superpowers/roadmap/2026-11-19-plan-etapas.md`.

## Licencia

MIT. FlyEnv (BSD-3) y ServBay se usaron solo como referencia de producto; no se copió código de ninguno de los dos.
