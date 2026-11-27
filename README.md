# WolfCore Dev

WolfCore Dev es un reemplazo propio de FlyEnv y ServBay, para uso personal. Es una aplicación de escritorio (Electron + Vue 3 + TypeScript) que administra un entorno de desarrollo local en Windows: Nginx, varias versiones de PHP, dominios `.test` con HTTPS, túneles de Cloudflare, bases de datos (MySQL, MariaDB, PostgreSQL con pgvector, Redis y MongoDB), Composer, correo de prueba con Mailpit, FTP por sitio e IA local con Ollama.

**Cambio de nombre:** el programa se llamaba "Entorno Local" (Proyectoentornolocal). Ahora el nombre visible es **WolfCore Dev** (`appId` `com.johanvelez.wolfcoredev`). El repositorio y los paquetes npm conservan su nombre. La carpeta de datos pasó de `%LOCALAPPDATA%\Proyectoentornolocal` a `%LOCALAPPDATA%\WolfCoreDev`: si al iniciar existe la vieja y no la nueva, se renombra sola una vez (si el renombrado falla porque algo la tiene abierta, se usa la vieja esa vez, se avisa y se reintenta en el próximo inicio). El bloque del archivo hosts pasa a `# >>> WolfCore Dev (no editar a mano)` / `# <<< WolfCore Dev` en la siguiente sincronización.

**Desinstalar la app vieja "Entorno Local":** como cambió el `appId` (antes `com.johanvelez.entornolocal`), el instalador de WolfCore Dev **no reemplaza** a la versión anterior: las dos quedan instaladas, cada una con su acceso directo. Antes de abrir WolfCore Dev por primera vez:

1. Cierre "Entorno Local" desde su icono de la bandeja (**Salir** → **Sí, apagar**) para que suelte los puertos y la carpeta de datos (si sigue abierta, el renombrado de la carpeta falla y se reintenta en el siguiente inicio).
2. Desinstálela en **Configuración → Aplicaciones → Aplicaciones instaladas → Entorno Local → Desinstalar**. El desinstalador quita el programa, no la carpeta de datos: bases, sitios y certificados siguen en `%LOCALAPPDATA%\WolfCoreDev` (o en la vieja hasta que se renombre).
3. Si había agregado las herramientas al PATH con la versión vieja, esa entrada apunta a `%LOCALAPPDATA%\Proyectoentornolocal\tools\bin`, que tras el renombrado ya no existe: quítela a mano de las variables de entorno del usuario y use **Ajustes → PATH del usuario → Agregar al PATH del usuario** en WolfCore Dev.

Diseños: MVP en `docs/superpowers/specs/2026-11-17-proyectoentornolocal-design.md`, Etapa A en `docs/superpowers/specs/2026-11-18-etapa-a-design.md`, Etapa B en `docs/superpowers/specs/2026-11-19-etapa-b-design.md`, Etapa C en `docs/superpowers/specs/2026-11-19-etapa-c-design.md`.

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

### IA en la nube (Etapa C)

- La pantalla **IA** reúne Ollama (como antes) y los proveedores en la nube: **OpenAI**, **Anthropic**, **Gemini**, **Hermes** (Nous Research) y cualquier servicio **compatible con OpenAI** (OpenRouter, Groq, LM Studio…), varios con nombre propio.
- La configuración que no es secreta (tipo, nombre, URL base, modelo por defecto) va en `config.json`. **La clave nunca:** se guarda cifrada con `safeStorage` en `etc/secretos/` y la interfaz solo ve si está puesta y sus 4 últimos caracteres. Tampoco sale en registros, errores ni URLs (Gemini usa la cabecera `x-goog-api-key`, nunca `?key=`).
- **Probar conexión** es gratis: solo lista los modelos y mide la latencia. **Probar un mensaje** gasta tokens, así que pide confirmación y manda un texto fijo y corto.
- La URL base solo acepta `https://`, o `http://` hacia `127.0.0.1`/`localhost`, sin usuario ni clave en la URL. Cambiar la URL de un proveedor que ya tiene clave pide confirmación aparte, porque la clave iría a otro servidor.
- **Usar en un proyecto** escribe el bloque `.env` del proveedor (`OPENAI_API_KEY`/`OPENAI_BASE_URL`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_HOST`, `AI_MODEL`):
  - antes lo muestra con la clave enmascarada y pide confirmar, porque en el `.env` la clave queda en texto plano;
  - deja una copia previa fuera del proyecto y ofrece agregar `.env` al `.gitignore`;
  - si git ya sigue el `.env`, se niega hasta que confirme aparte o lo saque del índice con `git rm --cached .env`.

### Agentes (Etapa C)

- La pantalla **Agentes** muestra **Claude Code**, **Codex CLI** y **Hermes Agent**: si están instalados (lo de WolfCore Dev, el npm global del usuario o el PATH), su versión y si ya tienen el MCP de WolfCore Dev.
- **Instalar** (con confirmación) usa `npm install -g` desde `registry.npmjs.org` con el Node de WolfCore Dev, dentro de su carpeta de datos, sin tocar el npm global del usuario.
- **Registrar el MCP:** primero con la CLI del propio agente y, si no la tiene, editando su archivo (`~/.claude.json`, `~/.codex/config.toml` o la configuración de Hermes):
  - solo agrega o reemplaza la entrada `wolfcore` y siempre deja antes una copia con fecha;
  - si el archivo no se puede interpretar, no lo toca;
  - el token del MCP no se escribe: el agente lo lee de `WOLFCORE_MCP_TOKEN`.
- **Abrir en un proyecto:** abre una terminal visible en la carpeta del proyecto con el agente. La clave del proveedor elegido y `WOLFCORE_MCP_TOKEN` van solo en el entorno de ese proceso.
- **Mensaje de commit sugerido** (panel Git del proyecto): manda al proveedor elegido lo preparado con `git diff --cached`, sin archivos `.env*`, claves ni binarios, y hasta 20 000 caracteres. Muestra la propuesta para editarla. **Hacer commit** solo confirma lo preparado; nunca hace `add` ni `push`.

### PHP: `php.ini`, extensiones y Xdebug (Etapa C)

- **Editor de `php.ini` por rama:** texto con diff contra lo guardado y valores rápidos (`memory_limit`, `upload_max_filesize`, `post_max_size`, `max_execution_time`, `display_errors`, `error_reporting`, `date.timezone`, `opcache.enable`).
  - Antes de escribir, prueba el texto con `php -c <ini> -v`, con los errores de arranque forzados a la salida aunque el ini los oculte. Un valor inválido (por ejemplo `memory_limit = abc`) se rechaza y el archivo no cambia.
  - Al guardar deja una copia con fecha (byte a byte) y reinicia el pool. Si el pool no vuelve a responder, se restaura el archivo anterior.
- **Extensiones:** lista los `.dll` de `ext/` y las activa o desactiva con la misma prueba y vuelta atrás. Las de terceros (Xdebug…) salen **solo del catálogo**, con la variante NTS-VS16/VS17-x64 de la rama y SHA-256 fijado.
- **Ajustes por sitio:** un sitio puede tener su propio `php.ini` (valores sobre el de la rama). Con ajustes propios o con Xdebug, ese sitio corre en un **pool propio** de `php-cgi`; los demás siguen en el compartido.
- **Xdebug por sitio:** modo (`debug`, `develop`, `coverage`, `profile`, `trace`), puerto (9003 por defecto) e inicio `trigger` o `yes`, siempre con `client_host=127.0.0.1`.
  - Activarlo instala la DLL del catálogo si falta, pero **no** la activa en la rama: solo la carga el pool del sitio.
  - Ofrece escribir `.vscode/launch.json`: lo fusiona por nombre con el que haya y deja una copia fuera del proyecto. Para PhpStorm muestra la configuración a copiar.

### Nginx: editor de vhost por sitio (Etapa C)

- Muestra el vhost generado y un área de **reglas propias** con snippets (CORS, caché de estáticos, límite de subida, SPA, cabeceras de seguridad, WebSocket). En modo avanzado se puede reemplazar el vhost completo, que entonces deja de regenerarse.
- **Aplicar** prueba primero con `nginx -t` sobre una copia temporal de toda la configuración. Solo si pasa deja una copia con fecha (historial de 10 versiones), escribe, recarga y comprueba que Nginx responde. Si la recarga falla, todo vuelve a lo anterior. Una regla rota nunca tumba el Nginx en marcha.
- El editor rechaza lo que saldría del sitio: módulos, `include` ajenos, `root`/`alias` fuera de la carpeta, rutas con `..`, otro `SCRIPT_FILENAME`, `proxy_pass` a los servicios internos de WolfCore Dev, puertos o dominios de otros sitios y similares.

### Doctor (Etapa C)

- **Doctor** revisa el entorno al iniciar (en segundo plano) y con **Revisar ahora**:
  - puertos ocupados (reconoce IIS, FlyEnv, Skype, XAMPP) y rangos reservados por Hyper-V/WSL/Docker;
  - la CA y los certificados (vencidos o por vencer), y la confianza en Node, Python y Firefox;
  - el archivo `hosts`: bloque duplicado o sin cierre, UTF-16, solo lectura o dominios faltantes;
  - PATH duplicado o roto, VC++ ausente, antivirus sin exclusión y servicios en error.
- Cada hallazgo trae evidencia y una **reparación guiada**. La reparación dice qué hará y **solo corre con su confirmación**; las que tocan el sistema piden administrador y dejan copia (por ejemplo, reescribir el bloque del hosts conserva las líneas ajenas).
- Nunca actúa sobre programas ajenos: con FlyEnv en un puerto, ofrece mover el de WolfCore Dev. Lo del antivirus y los rangos reservados solo se informa, con el comando para hacerlo a mano.
- **Confianza de la CA fuera de Windows:**
  - **Node:** los procesos y la terminal reciben `NODE_EXTRA_CA_CERTS`; también se puede fijar como variable del usuario, con confirmación.
  - **Python:** reciben un paquete propio con las raíces de `certifi` más la CA (nunca solo la CA).
  - **Firefox:** se activa `security.enterprise_roots.enabled` en `user.js` de cada perfil, con copia y con Firefox cerrado.

### Avisos (Etapa C)

- La campana de la barra reúne los avisos: servicios caídos, hallazgos del Doctor, contenedores que se detienen solos y **versiones nuevas** (como mucho uno por servicio y día). También pueden salir como notificación nativa de Windows.
- Cada aviso lleva a su pantalla; el de una versión nueva abre el diálogo de actualizar, nunca actualiza solo. En **Ajustes → Avisos** se apagan las notificaciones nativas o tipos de aviso, y los de versiones nuevas se silencian por servicio.

### Catálogo en vivo, versiones e instancias (Etapa C)

- **Servicios → Versiones** muestra, para los 13 servicios (PHP, MySQL, MariaDB, PostgreSQL, Redis, MongoDB, Node, Python, Nginx, Composer, Mailpit, Ollama y cloudflared), las versiones publicadas **agrupadas por rama**. Cada rama trae su soporte y su fin de soporte; cada fila, sus marcas instalada, encendida y con actualización, y los botones Instalar, Desinstalar, Encender y Predeterminada. **Mostrar todas** suma las previews y las ramas sin soporte.
- **Fuentes oficiales, sin comodines:** `releases.json` de windows.php.net, `index.json` y `SHASUMS256.txt` de nodejs.org, NuGet (Python), la REST de MariaDB, `versions.json` de postgresql.org con los binarios de EnterpriseDB, `full.json` de MongoDB, `getcomposer.org/versions`, nginx.org, sondeos `HEAD` en `cdn.mysql.com` y la API de GitHub (Redis, mongosh, Mailpit, Ollama, cloudflared).
  - Cada redirección se revisa salto a salto contra la lista de hosts permitidos.
  - Los índices se guardan 6 h en `run/catalogo/`.
  - Un índice con **una sola** entrada rara se descarta entero. Entonces se usa la caché válida o, sin ella, la **lista fija** de `catalogo.json`, que también es la lista sin conexión. La pantalla dice de dónde salió la lista: en línea, caché o sin conexión.
- **Huellas:** se verifica la huella **oficial** de cada descarga: SHA-256 o SHA-512 (fuertes) y MD5 (se comprueba, pero cuenta como débil). Las firmas PGP quedan para la Etapa D.
- **Quién no publica huella y por qué se pide confirmar:**
  - **PostgreSQL:** EnterpriseDB no publica sumas de sus zip de Windows.
  - **Nginx:** nginx.org solo publica firmas PGP, que todavía no se verifican.
  - **MySQL:** Oracle solo muestra un MD5 en su página de descargas, que además suele rechazar a clientes automáticos.

  Sin una huella fuerte no se puede comprobar que el archivo es el oficial. Por eso esas versiones muestran una advertencia y solo se instalan si confirma en un diálogo que explica el riesgo. Ningún camino automático las instala, ni siquiera "Actualizar" desde un aviso. La excepción son las versiones de la lista fija: traen el SHA-256 calculado al armar el catálogo y no piden confirmación.

- **Instancias paralelas** de MySQL, MariaDB, PostgreSQL, Redis y MongoDB: varias ramas encendidas a la vez (`postgresql@16` y `postgresql@17`, `mysql@8.0` y `mysql@8.4`).
  - Cada instancia tiene su puerto, su carpeta `data/<servicio>/<rama>` y sus propias credenciales.
  - La **predeterminada** (estrella) es la que usan las recetas, los proyectos nuevos y el MCP cuando no se indica otra.
  - **Bases de datos** tiene un selector de instancia: crear, respaldar, restaurar, importar y el bloque `.env` actúan sobre la elegida.
- **Migración automática:** al abrir esta versión, cada servicio con la forma vieja de `config.json` pasa a una instancia con **el mismo puerto, la misma carpeta de datos y las mismas credenciales**, así que los `.env` de los proyectos siguen funcionando.
  - Antes se copian `config.json`, `credenciales.json` y `run/estado.json` a `etc/respaldos/pre-instancias-<fecha>/`.
  - No se mueve ni se borra ninguna carpeta de datos.
- **Actualizar un parche** (MySQL 8.4.13 → 8.4.14) instala la versión nueva junto a la anterior y **respalda primero**: vuelca cada base (MySQL, MariaDB, PostgreSQL) y hace una copia en frío de la carpeta de datos (`<rama>.respaldo-<fecha>`). Antes mide la carpeta y comprueba que hay espacio libre.
  - Si la versión nueva no arranca, se vuelve a la anterior con la copia: la carpeta tocada queda apartada (`.fallida-<fecha>`) y el respaldo siempre se conserva.
  - Si los datos no se pudieran devolver, la instancia queda **bloqueada** hasta que usted decida, y nada arranca encima de datos dudosos.
- **Una rama nueva** (PostgreSQL 17 → 18) nunca actualiza en el sitio: es una instancia nueva, con la opción de **copiar las bases** de la vieja, que queda intacta.
- **Desinstalar** una versión quita solo `bin/`. Borrar la carpeta de datos de una instancia es otra acción, que pide escribir su id. Las copias de las actualizaciones se ven y se borran aparte.

### Depuración: `dump()`/`dd()` (Etapa C)

- **Depuración** enciende un receptor local (`127.0.0.1:9912`, con un token aleatorio en cada sesión que solo leen los sitios con la captura) y muestra en vivo los volcados con sitio, archivo, línea y URL, con filtro por sitio, origen y texto. Quedan **solo en memoria** (los últimos 500) y **Copiar** enmascara las claves conocidas.
- La captura se enciende **por sitio** y pide confirmación; apagar el receptor la apaga en todos. Nunca toca el `php.ini` de la rama ni escribe en el proyecto.
- **PHP** (Laravel, CodeIgniter 3 y 4, WordPress, personalizado): el PHP propio del sitio carga `etc/php/wolfcore-prepend.php` (`auto_prepend_file`), que define `wd()` y, si el proyecto no los define, `dump()` y `dd()`. Laravel y Symfony siguen mostrando el volcado en la página como siempre; en CodeIgniter 3 u otros sin VarDumper, `dump($x)` muestra un `print_r` y `wd($x)` solo lo envía a WolfCore Dev. Si el receptor no responde, no pasa nada visible y la petición no tarda más de 200 ms extra; `dd()` sigue deteniendo. Un `auto_prepend_file` anterior se sigue cargando. Si el proyecto declara su propia función `dump()` o `dd()` sin `function_exists`, PHP dará error: desactive la captura en ese sitio.
- **Python** (FastAPI): los procesos del sitio reciben `etc/python` en el `PYTHONPATH` (desde su próximo arranque): `from wolfdump import dump` y `dump(valor)` (devuelve el valor y no imprime nada).
- **El token** vive en `run/depuracion.json` solo mientras el receptor escucha: en Windows el archivo queda solo para el usuario actual (`icacls`, sin permisos heredados) y en macOS/Linux con modo 600. Lleva el PID del receptor y su fecha se renueva cada 15 s: con un archivo sin renovar desde hace más de 60 s (la app se cortó) no se envía nada, y Python (en todos los sistemas) y PHP con `posix` o `/proc` tampoco envían a un PID muerto. **Riesgo residual:** en el minuto que sigue a un cierre forzado, otro programa que ocupe el puerto 9912 podría recibir volcados (en Windows, PHP no puede preguntar barato si el PID vive); al volver a abrir WolfCore Dev el archivo viejo se borra. El token nunca pasa como argumento en el prepend (no sale en trazas con argumentos), pero `xdebug.mode=trace` registra los argumentos de las funciones internas y puede dejarlo en su archivo de traza: no use la captura y el modo `trace` a la vez si eso le preocupa.
- En memoria se cuentan 2 bytes por carácter (UTF-16): el tope de 32 MiB son unos 16 millones de caracteres.
- **Errores** (pestaña de Depuración): lee los registros que ya sigue **Registros** (log de PHP, log de errores de Nginx con los mensajes de PHP que llegan por FastCGI, `laravel.log`, `application/logs/log-*.php` de CodeIgniter 3 y los tracebacks de Python de los procesos de proyecto) y agrupa cada error por tipo, mensaje (sin números, ids ni rutas temporales) y archivo:línea, con contador, primera y última vez y la traza de la última vez. **Abrir en el editor** abre VS Code en esa línea, solo si el archivo está dentro de la carpeta del sitio. La comprobación usa la ruta real; entre ella y la apertura queda una ventana breve en la que un enlace creado en el proyecto podría hacer que el editor abra otro archivo (solo para leer, con su mismo usuario). Los mensajes y trazas van con las claves conocidas enmascaradas.

### Contenedores Docker/Podman (Etapa C, mínimo)

- **Contenedores** detecta Docker y Podman, dice si el motor responde y su versión, y lista los contenedores (nombre, imagen, estado, puertos y proyecto de compose) con refresco cada 5 s solo con la pantalla a la vista. Permite **iniciar**, **detener** y **reiniciar** (detener y reiniciar piden confirmación) y ver los **registros** en vivo (`logs -f --tail 500`, con las claves conocidas enmascaradas). Si no hay motor, explica cómo instalarlo y enlaza a la página oficial: WolfCore Dev no instala Docker ni Podman.
- Nunca crea, borra ni descarga contenedores, imágenes ni volúmenes, y no toca compose. Usa la CLI sin shell y con plazo en cada llamada; el ejecutable se busca primero donde lo deja el instalador oficial (Docker Desktop según `HKLM\SOFTWARE\Docker Inc.\Docker\1.0`, `Program Files\Docker\Docker\resources\bin`, `Program Files\RedHat\Podman`, `%LOCALAPPDATA%\Programs\Podman`) y solo si no está, en las carpetas absolutas del PATH (un `docker` puesto antes en el PATH correría con sus permisos, igual que en una terminal; la pantalla avisa cuando sale del PATH). Solo motores **locales**, con el destino fijado al detectar y pasado en cada llamada (un cambio de contexto después no manda un `stop` a otro equipo): Docker con `-H` a una tubería `npipe:////./pipe/…` o un socket `unix:///…` (el `DOCKER_HOST` local, el contexto actual si es local o el `default`) y Podman con `--connection` a su máquina local (`IsMachine`). Un host, contexto o conexión remotos se ignoran o dejan el motor sin usar, con aviso.
- Si un contenedor que estaba en marcha aparece detenido sin pedirlo, llega un aviso al centro de avisos (solo se vigilan los motores que ya mostraron contenedores en marcha en la sesión).

### MCP para Claude Code (Etapa B)

- **Ajustes → Servidor MCP** lo activa en `http://127.0.0.1:7790/mcp` (puerto configurable) con un token Bearer aleatorio. **Copiar configuración para Claude Code** deja en el portapapeles el comando `claude mcp add --transport http wolfcore …` y el bloque para `.mcp.json`; **Regenerar token** invalida el anterior.
- Herramientas: estado general, proyectos, servicios (iniciar y detener), bases (listar, crear, respaldar, restaurar, borrar), túneles, ejecutar la receta, traer cambios, leer registros y finalizar procesos. Las acciones destructivas y las recetas piden confirmación en la ventana de WolfCore Dev.
- Depuración (Etapa C): `listar_dumps`, `leer_dump` (hasta 64 KiB de texto), `listar_errores` y `leer_error` son de solo lectura, con los secretos enmascarados y las salidas acotadas; `limpiar_dumps` pide confirmación en la ventana.

### Iniciar todo y línea de órdenes

- **Iniciar todo** (botón de Servicios, bandeja y paleta) enciende, en orden: el PHP de las ramas en uso y Nginx; luego la **instancia predeterminada de cada base instalada**, las que tienen _Iniciar con WolfCore Dev_ y las que usan los proyectos según su `.env` (motor y puerto), y espera a que respondan; por último los procesos de proyecto con _autoiniciar_, solo si responde la base que usan. Ojo: una base instalada que nunca se usó también se enciende, y la primera vez se inicializa (crea su carpeta en `data\` y sus credenciales); si no la quiere, desinstálela. Si algo falla, el error y un aviso dicen qué no arrancó. **Nunca abre túneles**: un túnel solo se abre con el interruptor de su sitio, y siempre pide confirmar que el sitio queda público.
- Desde la línea de órdenes de la aplicación (el comando `wolf` completo se describe más abajo):

  ```powershell
  & "$env:LOCALAPPDATA\Programs\WolfCore Dev\WolfCore Dev.exe" --iniciar-todo
  & "$env:LOCALAPPDATA\Programs\WolfCore Dev\WolfCore Dev.exe" --detener-todo
  ```

  Si WolfCore Dev ya está abierto, la orden se le pasa a esa instancia (si acaba de abrirse, espera a que termine su arranque automático); si no, la app arranca y la ejecuta en cuanto carga. Hacen exactamente lo mismo que los botones. El resultado queda en `run\ultima-orden.json` de la carpeta de datos (`orden`, `inicio`, `fin`, `ok` y, si falló, `error`). No hay más órdenes: cualquier otro argumento se ignora.

- **Salir** (bandeja) pregunta si se apagan los servicios con un diálogo de la ventana, que se trae al frente y queda encima de todo. Si la ventana ya no existe (caso raro), sale **apagando todo sin preguntar**.

### Interfaz (Etapa B)

- Tema **claro, oscuro o del sistema** (también la barra de título), color de acento e idioma (**español, inglés, francés o portugués**), en caliente.
- **Ctrl+K** abre la paleta de comandos: ir a cualquier pantalla, encender o apagar todo, agregar o clonar proyectos y cambiar tema o idioma.
- **Recorrido de bienvenida** de 7 pasos (servicios, proyectos, bases de datos, herramientas y Ctrl+K, Doctor): no cambia nada en el equipo, se cierra con Esc y se puede volver a ver desde **Ajustes › Apariencia**.

## Etapa D: proyectos, datos, herramientas y compartir

### Proyectos nuevos, plantillas e importación

- **Nuevo proyecto** crea desde cero la carpeta, el sitio con HTTPS, la base y su conexión: Laravel, CodeIgniter 3 y 4, Symfony, FastAPI, WordPress y sitio estático. También hay recetas para Rails, Spring Boot, ASP.NET y Node: los servidores arrancan con `HOST=127.0.0.1`, y WolfCore Dev comprueba tras el arranque que el proceso no escuche en toda la red (si lo hace, lo detiene y avisa).
- **Guardar como plantilla:** un proyecto se guarda con su receta, los ajustes de PHP y Nginx, las extensiones y el **esquema** de su base (solo la estructura, ninguna fila). Nunca guarda `.env`, `vendor`, `node_modules`, `.git`, volcados, claves ni certificados, y un archivo que parezca contener una clave también se deja fuera. Desde la plantilla se crean proyectos nuevos.
- **Importar desde Laragon, XAMPP o Herd:** los sitios se vinculan donde están (no se mueve ni se modifica ninguna carpeta) y, si usted quiere, se copian sus bases. Solo lee las instalaciones de los otros programas y ningún sitio importado ejecuta recetas hasta que se marque «Confío en este repositorio».
- **Variables `.env`:** tabla con los valores secretos enmascarados; un valor solo se ve al pulsar «Mostrar» (y se oculta a los 30 s). Antes de guardar se hace una copia con fecha. Los bloques de conexión (base, correo, IA, Meilisearch) se agregan con vista previa y confirmación.
- **Workspaces y tareas:** un workspace es un conjunto con nombre de bases, servicios y procesos que se enciende y se apaga junto. Las **tareas programadas** de un proyecto (por ejemplo `php artisan schedule:run` cada minuto) corren solo mientras WolfCore Dev está abierto; no usan el Programador de tareas de Windows.
- **Reverb y Meilisearch:** Reverb (WebSockets de Laravel) se enciende por proyecto, solo en `127.0.0.1` y en un puerto libre, y propone las variables `REVERB_*`. Meilisearch se instala desde **Servicios**; cada versión menor tiene sus propios datos (cambiar de menor obliga a reindexar y a actualizar la clave).

### Versiones de lenguajes y herramientas

- **Servicios → Versiones** instala, sin tocar el PATH del sistema, varias versiones de Node, Python, Java (Temurin), .NET, Go, Rust, Bun, Deno, Zig, Kotlin, Dart, **Ruby** (por `.7z`, sin Devkit: las gemas con extensiones nativas necesitan «ridk install», un paso manual), **Maven** y **Gradle** (se ejecutan con un JDK de WolfCore Dev). Cada descarga se verifica con su huella; solo las firmadas con PGP (Node, Nginx, phpMyAdmin y Composer) llevan el escudo verde.
- Maven se lanza directamente con el JDK y, por seguridad, no lee `.mvn/jvm.config` ni `MAVEN_OPTS`.

### Bases de datos

- **Instantáneas:** guardan una base tal como está y se pueden restaurar (antes de volver se guarda sola una del estado actual); las borradas se recuperan durante 7 días desde la papelera.
- **Auditoría de contraseñas** (Herramientas → Contraseñas → Auditar una base): compara los hashes de una tabla con una lista corta de unas 200 contraseñas muy comunes. **Su límite:** solo detecta contraseñas comunes; no es un ataque de fuerza bruta, y que una cuenta no salga marcada no significa que su contraseña sea buena. Nunca muestra cuál contraseña coincidió y lee con un usuario temporal de solo lectura.
- **phpMyAdmin y Adminer:** el botón de base de cada proyecto abre el cliente con el usuario del proyecto.
- **Consultas lentas** (MySQL, MariaDB y PostgreSQL): activa el registro en todo el servidor con confirmación y lista las consultas más lentas, ocultando los valores literales para no exponer datos.
- **Visor de esquema:** tablas, columnas, índices y relaciones, solo lectura; no lee ningún dato de las tablas.
- **Perfiles:** **Respaldo y perfiles** exporta un archivo `.wolfperfil` con sitios, versiones, instancias, plantillas y ajustes, y lo importa en otro equipo mostrando antes todo lo que se reemplaza. Las bases y la CA viajan solo cifradas con una frase que elige el usuario; nunca viajan claves, tokens ni contraseñas.

### Herramientas

La pantalla **Herramientas** se agrupa en cinco secciones (Código, Red, Seguridad, Archivos y medios, Sistema) y tiene buscador. Además de las de la Etapa B:

- **Editor de código:** archivos de texto con resaltado, copia previa y guardado confirmado; los archivos sensibles (`.env`, claves) piden una confirmación reforzada.
- **Buscar:** texto en nombres y contenido de un proyecto, una carpeta o un archivo.
- **Comparar:** diff de textos y **Diff de carpetas** (solo en A, solo en B y distintos), sin cambiar nada y sin mostrar el contenido de archivos sensibles.
- **Cliente HTTP:** peticiones con entornos, colección e historial. Se envía desde el proceso principal (con plazo, tope de 10 MB y redirecciones manuales); los valores secretos (cabeceras de autorización, claves de API) se guardan en el almacén cifrado, no en la colección ni en el historial. La CA de WolfCore Dev solo se acepta para dominios `.test` y de sus sitios.
- **Guías:** HTTP (códigos y métodos con buscador), túneles (Cloudflare y ngrok) y Git/GitHub. En la guía HTTP, el botón **Probar** arranca un servidor de ejemplo en `127.0.0.1` (puerto aleatorio, se apaga a los 10 minutos) y abre el cliente con la petición rellena; no la envía solo. El **laboratorio de Git** es un repositorio de práctica con un remoto local en una carpeta propia de WolfCore Dev: no usa internet ni GitHub y no toca sus proyectos ni su configuración de git.
- **Uso del disco:** qué ocupa espacio en una unidad o carpeta (árbol, 50 carpetas y archivos mayores, por extensión). Solo lee nombres y tamaños, no sigue enlaces ni uniones, no pide administrador y no borra nada; para liberar espacio enlaza con la limpieza de disco y de versiones.
- **Compartir carpeta o archivo:** ver la sección siguiente.
- **Grabar pantalla** abre la grabadora que ya trae Windows.

### Compartir carpeta o archivo por un túnel

Herramientas → **Compartir carpeta o archivo** publica en internet, con un enlace temporal, una carpeta o un archivo suelto, de solo lectura:

1. Se elige la carpeta o el archivo en el diálogo de Windows, la duración (15 minutos, 1 hora o 4 horas) y el túnel (Cloudflare rápido, sin cuenta, o ngrok con su token).
2. Una confirmación muestra la **ruta exacta** (y la real, si hay enlaces) y avisa de que quedará público.
3. El enlace lleva un código secreto de 128 bits; sin él, la respuesta es un 404 vacío. Se muestra con su QR y un **registro de accesos** (los últimos 200, en memoria, sin el código).
4. Se cierran el servidor y el túnel al vencer el plazo, al pulsar **Dejar de compartir**, si el túnel cae y al salir de WolfCore Dev. Solo hay una compartición a la vez.

El FTP no se comparte por túnel: va sin cifrar y el túnel solo deja pasar HTTP; el FTP es solo para la red local.

### Línea de órdenes `wolf`

**Ajustes → Terminal: comando wolf** agrega `wolf` al PATH del usuario (con copia del PATH original) y enciende un servidor local en `127.0.0.1` que solo atiende a `wolf`, con una clave que cambia en cada arranque. Solo funciona con la aplicación abierta (`--abrir` la abre).

```text
wolf status                  Estado de sitios, servicios y túneles
wolf link [carpeta]          Vincula una carpeta como sitio
wolf park [carpeta]          Carpeta vigilada de proyectos
wolf use php@8.4 [--global]  PHP del sitio (o de las terminales)
wolf use node@22             También python, java, dotnet, go y rust
wolf secure <sitio>          Activa HTTPS
wolf share <sitio>           Publica el sitio en internet (pide confirmar)
wolf open <sitio>            Abre el sitio
wolf logs <sitio> [-f]       Registros
wolf doctor                  Revisa el entorno (solo informa)
wolf start|stop [workspace|servicio]
```

Todas aceptan `--json`. Publicar un sitio o cambiar el PHP de todas las terminales se confirma además en la ventana de la aplicación. Con una carpeta de datos de prueba (`WOLFCORE_DATOS`) el PATH no se toca.

### Red local y cortafuegos

- **Compartir un sitio en la red local** (interruptor por sitio, con confirmación): lo hace visible a los demás dispositivos de la misma red, sin contraseña, con QR y con la opción de instalar la CA en el móvil. No se comparten sitios con datos reales, ni con confirmación.
- WolfCore Dev **no cambia el cortafuegos de Windows**: muestra un comando (solo subred local y solo redes privadas) para pegar en PowerShell como administrador. El **Doctor** revisa las reglas de entrada: las de programas de WolfCore Dev abiertas a toda la red se pueden quitar con confirmación (guardando una copia); las de otros programas (FlyEnv, Laragon, XAMPP…) solo se muestran.

### Seguridad: qué se publica y qué no

| Función                   | Qué queda accesible y para quién                                                                                     | Qué nunca se publica                                                                                                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sitios `.test`            | Solo este equipo (Nginx en `127.0.0.1`, por nombre de sitio).                                                        | `.env`, archivos ocultos y carpetas internas de los frameworks (reglas del vhost).                                                                                                                                                          |
| Túnel de un sitio         | Internet, mientras el interruptor esté encendido y tras confirmar. Quien tenga la URL ve el sitio.                   | Un sitio con datos reales pide una confirmación aparte; un sitio importado de un perfil sin confiar en él no abre túnel.                                                                                                                    |
| Compartir carpeta/archivo | Internet, solo lectura, con un enlace con código secreto que vence a los 15 min, 1 h o 4 h.                          | `.env*`, claves, `.git`, `.ssh`, `.aws`…, datos de programas (`AppData`, perfiles de navegador), archivos con secretos, sitios con datos reales, la carpeta de datos de WolfCore Dev, la raíz de una unidad y la carpeta de usuario entera. |
| Red local                 | Los dispositivos de su misma red, sin contraseña, mientras el interruptor esté encendido.                            | Sitios con datos reales. Nunca se abre el cortafuegos por su cuenta.                                                                                                                                                                        |
| FTP                       | Solo la red local, si se activa; sin cifrar.                                                                         | Nada fuera de la carpeta del sitio.                                                                                                                                                                                                         |
| `wolf` y MCP              | Solo `127.0.0.1`, con una clave (la de `wolf` cambia en cada arranque; la del MCP se regenera cuando usted lo pide). | Los secretos salen enmascarados; publicar o cambiar el PHP global se confirma en la ventana.                                                                                                                                                |
| Perfiles `.wolfperfil`    | Un archivo que usted guarda y mueve.                                                                                 | Claves, tokens y contraseñas. Las bases y la CA van solo cifradas con su frase.                                                                                                                                                             |

**Aviso:** un archivo comprimido (`.zip`, `.7z`, `.gz`) se comparte tal cual, sin mirar lo que lleva dentro: si dentro hay un `.env` o claves, se publican. Los archivos de texto o de tipo desconocido de más de 8 MB tampoco se comparten, porque no se pueden revisar por completo.

## Carpeta de datos

`%LOCALAPPDATA%\WolfCoreDev`:

- `bin/<servicio>/<versión>/`: binarios descargados.
- `data/<servicio>/<rama>/`: datos de cada instancia (bases, Mailpit y modelos de Ollama); al lado, las copias de las actualizaciones (`<rama>.respaldo-<fecha>`, `.volcados`, `.fallida-<fecha>`).
- `etc/`: `nginx.conf`, vhosts, `php.ini`, `my.ini`, `redis.conf`, `credenciales.json`, `secretos/` (claves de IA y token de GitHub, cifrados) y `respaldos/` (copias con fecha de vhosts, `.env`, `.gitignore`, `launch.json` y de la migración a instancias; las de `php.ini` van en `etc/php/<rama>/respaldos/` y las de la configuración de un agente, junto a su archivo).
- `ca/` y `certs/`: autoridad y certificados HTTPS.
- `tools/`: `bin` (atajos `php.cmd` y `composer.cmd`) y `adminer`.
- `logs/`, `run/` (estado, avisos y la caché del catálogo en `run/catalogo/`), `tmp/` y `config.json`.

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
npm run test:win            # integración real en Windows (MVP y Etapas A, B, C y D)
npm run test:win:pgvector   # pgvector real: instala Build Tools (UAC, ~6 GB)
```

`npm run test:win` trabaja en una carpeta temporal y en **puertos altos**, para convivir con FlyEnv encendido (Nginx 18089, HTTPS 18443, MySQL 13306, MariaDB 13307, PostgreSQL 15432, Redis 16379, MongoDB 27117, Mailpit 11025/8025, Ollama 21434, FTP 12121 con pasivos 52000–52020, Adminer 8090):

- MVP: Nginx 8089, PHP 8.4 y cloudflared; sitios estático, Laravel (ruta con espacio y Ñ) y CodeIgniter 3; reglas de seguridad y un túnel rápido (si Cloudflare no responde, ese paso se omite).
- Etapa A: instala todos los servicios; en MySQL, MariaDB y PostgreSQL crea una base con datos (incluido `O'Brien` y una rutina), la respalda, la restaura en otra base, comprueba que una base con tablas se rechaza sin confirmar y se reemplaza (con copia previa) al confirmar, e importa desde el servidor; restaura un `pg_dump -Fc` guardado como `.sql` y un volcado plano; Redis `PING`, MongoDB con mongosh, un correo SMTP leído por la API de Mailpit, un sitio HTTPS verificado contra la CA temporal (y sin redirección cuando llega `Cf-Connecting-Ip`), FTP (subir, bajar y PORT rechazado), Composer por el atajo, el bloque `.env` leído con PHP real por phpdotenv, CodeIgniter 4 y el lector de CodeIgniter 3 de los proyectos WolfCore, Adminer, Ollama (`/api/tags`, **sin descargar modelos**), que ningún servicio abra ventanas de consola (ni con varias conexiones a PostgreSQL abiertas) y el apagado sin procesos huérfanos.
- Etapa B (Nginx 18189, HTTPS 18543, MySQL 13406, MCP 17790): instala Node LTS y Python 3.12 desde el catálogo; clona `laravel/laravel` con git y corre su receta completa (Composer, `.env`, clave, MySQL, migrate, `storage:link`, `npm ci` y `build`, sitio HTTPS) hasta un 200 por HTTPS; un FastAPI mínimo con `venv`, `pip`, `uvicorn` supervisado y sitio proxy que responde 200; **Traer cambios** sobre un repositorio local que recibe un `composer.lock`; el MCP (lista de herramientas, rechazo sin token y `estado_general`); una muestra de métricas con los PID de los servicios y del proceso; y, al final, sin ventanas visibles ni procesos de la carpeta temporal. Las cachés de Composer, npm y pip van a la carpeta de caché de las pruebas.

- Etapa C (Nginx 18289, MCP 17890, receptor de dumps 19912, Xdebug 19003, PostgreSQL 15516/15517/15518, MariaDB 13507), en `etapa-c.int.test.ts`:
  - PHP 8.4 y Xdebug del catálogo; un cliente DBGp mínimo recibe el `init` al pedir la página con `XDEBUG_TRIGGER`.
  - `memory_limit = abc` se rechaza con el archivo intacto y el sitio respondiendo 200.
  - Una regla rota en el vhost (`nginx -t` falla) deja el archivo y Nginx como estaban.
  - `dump()` llega al receptor; con el receptor detenido la página responde 200 sin demora apreciable.
  - Un proveedor `compatible` contra un servidor OpenAI falso: modelos y latencia, y el `.env` solo con confirmación.
  - El MCP se registra en un `config.toml` de Codex de prueba (en una carpeta de inicio temporal), con copia y sin perder lo que había.
  - El Doctor encuentra y repara un hosts de prueba dañado, con confirmación y conservando las líneas ajenas.
  - En las métricas, un proceso de proyecto suma la RAM de su hijo.
  - Catálogo en vivo (solo con red): Node, Composer y Mailpit con huella fuerte, y un Node de una rama que no está en la lista fija verificado contra `SHASUMS256.txt`. Con un servidor falso, un índice manipulado cae a la lista fija y una huella cambiada no instala nada.
  - PostgreSQL 16 y 17 encendidos a la vez, cada uno con sus credenciales y sus bases.
  - La migración de una carpeta de datos con la forma vieja: mismo puerto, credenciales y fila.
  - Actualizar MariaDB 11.4.13 → 11.4.14 con copia y volcado, y con un arranque forzado a fallar volver a la anterior con los datos intactos.
  - Desinstalar la versión de una instancia apagada sin tocar su carpeta de datos.
  - Al final, sin ventanas ni procesos.

- Etapa D (`etapa-d.int.test.ts`, en una carpeta de datos temporal fuera de `AppData` y con puertos altos): flujos de proyectos, plantillas, importación desde un Laragon de prueba, instantáneas, auditoría, perfiles, órdenes `wolf`, red local y limpieza, más el servidor de ejemplo de la guía HTTP, el laboratorio de Git, Uso del disco, Compartir con un túnel simulado (sirve un archivo y da 404 sin el código) y el cliente HTTP contra un servidor local. Los escenarios que necesitan red se omiten sin ella. Nunca se abre un túnel real.

Nunca instala la CA en el almacén real, no toca el archivo hosts, el PATH, las variables ni la carpeta de inicio del usuario (las configuraciones de agentes son de prueba) y al final borra la carpeta temporal. Ninguna prueba gasta tokens: los proveedores de IA son servidores locales falsos. Los paquetes descargados quedan en `%TEMP%\pel-etapa-a-cache` para no volver a bajarlos (otra carpeta con `PEL_INT_CACHE`; `PEL_INT_CONSERVAR=1` conserva la carpeta temporal para revisarla). La primera vez descarga unos 3,5 GB.

`npm run test:win:pgvector` instala las Build Tools con winget si faltan (acepte el aviso de Windows), compila pgvector contra un PostgreSQL 17 temporal y prueba `CREATE EXTENSION vector` y una distancia. Córrala solo cuando quiera instalar las Build Tools en el equipo.

## Instalador

```bash
npm run dist:win -w @pel/desktop
```

Genera el instalador NSIS en `apps/desktop/release/` (`WolfCore Dev Setup <versión>.exe`), con el icono del lobo, y la app sin instalar en `release/win-unpacked`. Es por usuario y permite elegir la carpeta. No está firmado, así que Windows SmartScreen puede pedir confirmación la primera vez.

La **prueba de humo** (`npm run humo -w @pel/desktop`) arranca el ejecutable empaquetado de `win-unpacked`, sin instalarlo, con una carpeta de datos temporal propia, y recorre las vistas principales comprobando que ninguna queda vacía ni deja errores en la consola.

## Transición desde FlyEnv

1. **Puertos:** FlyEnv usa 80 y 443 (Nginx), 3306 (MySQL) y 5432 (PostgreSQL). Mientras conviven, apague el servicio en FlyEnv o use en WolfCore Dev el puerto alternativo que ofrece el aviso (**Usar otro puerto**: 3308, 5433, 6380, 27018) o cambie el puerto de Nginx y de HTTPS en Ajustes. PHP no choca: FlyEnv usa 908x y WolfCore Dev 98xx.
2. **Traer las bases de FlyEnv**, de una de dos formas:
   - **Desde sus respaldos** (recomendado si FlyEnv está apagado): en **Bases de datos → Restaurar respaldo**, elija el `.sql`, `.dump`, `.gz`, `.zip` o `.rar` (por ejemplo los de `C:\Proyectos\_respaldos\flyenv-<fecha>`) y una base nueva. Los `pg_dump` en formato custom se reconocen aunque tengan extensión `.sql`.
   - **Importar desde otro servidor** (con **FlyEnv encendido**): en **Bases de datos → Importar desde otro servidor**, escriba host `127.0.0.1`, el puerto de FlyEnv (3306 o 5432), usuario, clave y la base de origen. WolfCore Dev solo lee del origen (`mysqldump --single-transaction` / `pg_dump`) y restaura en una base local nueva; nunca escribe en FlyEnv. Para esto el servicio propio de WolfCore Dev debe estar en el puerto alternativo (3308 o 5433). Si el servidor de FlyEnv es más nuevo que las herramientas locales, se avisa qué versión hace falta.
3. **pgvector:** después de restaurar la base del bot, use **Instalar pgvector** y **Activar vector** en esa base.
4. **`.env` de los proyectos:** copie el bloque de **Datos de conexión** (puerto y clave de WolfCore Dev).
5. **Archivo hosts:** si FlyEnv ya escribió los mismos dominios, se conservan y la aplicación lo avisa. Quítelos de FlyEnv cuando ya no lo use.
6. **Sitios:** se crean de nuevo en **Sitios → Nuevo**, eligiendo la carpeta del proyecto (el tipo se detecta solo); active HTTPS donde lo necesite.

## Probado con claves y cuentas reales

Las pruebas automáticas nunca usan claves reales ni gastan tokens (los proveedores y los agentes son falsos). Lo que sigue lo prueba **el usuario** con sus propias cuentas; la columna se completa al hacerlo.

| Qué                                         | Cómo se prueba                                                | Resultado           |
| ------------------------------------------- | ------------------------------------------------------------- | ------------------- |
| OpenAI                                      | IA → proveedor OpenAI → Probar conexión y Probar un mensaje   | Pendiente (usuario) |
| Anthropic                                   | Igual, con un proveedor Anthropic                             | Pendiente (usuario) |
| Gemini                                      | Igual (la clave va en `x-goog-api-key`)                       | Pendiente (usuario) |
| Hermes (Nous Research)                      | Igual, con la URL base por defecto                            | Pendiente (usuario) |
| Compatible (OpenRouter, Groq, LM Studio…)   | Igual, con su URL base                                        | Pendiente (usuario) |
| Bloque `.env` de IA en un proyecto real     | IA → Usar en un proyecto (revisar el `.gitignore` y la copia) | Pendiente (usuario) |
| Claude Code                                 | Agentes → Registrar MCP y Abrir en un proyecto                | Pendiente (usuario) |
| Codex CLI (`--bearer-token-env-var`)        | Agentes → Registrar MCP y Abrir en un proyecto                | Pendiente (usuario) |
| Hermes Agent                                | Agentes → detección y guía oficial                            | Pendiente (usuario) |
| Mensaje de commit sugerido                  | Panel Git de un proyecto con cambios preparados               | Pendiente (usuario) |
| GitHub con token (repositorio privado)      | Proyectos → Nuevo → GitHub                                    | Pendiente (usuario) |
| Compartir por túnel de Cloudflare           | Herramientas → Compartir, con una carpeta vacía de prueba     | [ ]                 |
| Compartir por túnel de ngrok                | Igual, con el token de ngrok                                  | [ ]                 |
| Túnel de un sitio (Cloudflare)              | Interruptor de túnel de un sitio de prueba                    | [ ]                 |
| Red local desde un móvil                    | Compartir un sitio en la red y abrir el QR                    | [ ]                 |
| Importar desde Laragon, XAMPP o Herd reales | Proyectos → Importar…                                         | [ ]                 |
| Perfil exportado e importado                | Respaldo y perfiles, en otra carpeta de datos                 | [ ]                 |
| Modelo de Ollama (qwen2.5:0.5b)             | IA → Modelos locales: aviso de tamaño, descarga y chat        | [ ]                 |
| Instalador en un equipo limpio              | Instalar `WolfCore Dev Setup`, abrir y crear un sitio         | [ ]                 |

## Hoja de ruta

| Etapa | Contenido                                                                                                                        | Estado                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| MVP   | Windows: Nginx, PHP, sitios, hosts, túneles rápidos e interfaz                                                                   | Hecha                                                                                               |
| A     | HTTPS, MySQL, MariaDB, PostgreSQL + pgvector, Redis, MongoDB, módulo de bases de datos, Adminer, Composer, Mailpit, FTP, Ollama  | Hecha                                                                                               |
| B     | Proyectos desde GitHub, recetas y `wolfcore.yml`, Node y Python, procesos, panel, registros, herramientas, MCP, temas e idiomas  | Terminada (el montaje de los 6 proyectos reales lo hace el usuario)                                 |
| C     | IA en la nube y Hermes, agentes, depuración de PHP, Doctor, avisos, catálogo en vivo, instancias paralelas; Podman/Docker mínimo | En cierre (falta instalarla sobre los datos reales y probar las claves reales)                      |
| D     | Proyectos, compartir y respaldo del entorno                                                                                      | Implementada (falta la aceptación con los datos reales: `docs/superpowers/aceptacion-d40-lista.md`) |
| E     | Multiplataforma (macOS y Linux), instaladores y CI                                                                               | Pendiente                                                                                           |
| F     | Resto de paridad con los referentes y mejoras propias                                                                            | Pendiente                                                                                           |

Plan aprobado de las etapas C a F: `docs/superpowers/roadmap/2026-11-19-plan-etapas.md`.

## Licencia

MIT. FlyEnv (BSD-3) y ServBay se usaron solo como referencia de producto; no se copió código de ninguno de los dos.
