# WolfCore Dev — Etapa C: IA en la nube, agentes, depuración PHP y Doctor

Fecha: 2026-11-19 · Estado: borrador para revisión (el usuario delegó las decisiones) · Base: rama `feat/etapa-b` (Etapa B terminada) · Rama: `feat/etapa-c`

Insumos: [plan de etapas](../roadmap/2026-11-19-plan-etapas.md) (sección "Etapa C", matriz y notas) · [referentes](../roadmap/2026-11-18-referentes.md) · specs del [MVP](2026-11-17-proyectoentornolocal-design.md), [Etapa A](2026-11-18-etapa-a-design.md) y [Etapa B](2026-11-19-etapa-b-design.md).

## 1. Para qué

Con la Etapa B el usuario ya monta sus 6 proyectos (WolfCore System, Rents, Coffe, Diamantes, Dollar y el bot de FastAPI). Lo que le falta para trabajar **todo el día dentro de WolfCore Dev** es:

- **depurar PHP** sin herramientas externas: Xdebug por sitio, `php.ini` y extensiones, vhost de Nginx editable, `dump()`/`dd()` capturados y un visor de errores;
- **usar cualquier IA**, local o en la nube, en sus proyectos y desde agentes (Claude Code, Codex CLI, Hermes Agent) conectados al MCP de WolfCore Dev;
- **enterarse de lo que pasa** (notificaciones y centro de eventos) y **reparar el entorno** con un Doctor guiado;
- ver y controlar sus **contenedores** Docker o Podman sin salir del programa (mínimo, adelantado desde la Etapa F).

**Éxito:**

- Con un clic, Xdebug se activa en un sitio, VS Code se conecta con el `launch.json` generado y se detiene en un punto de interrupción. Ningún otro sitio se vuelve más lento.
- Un `dump($x)` en Laravel o CodeIgniter 3 aparece en la pantalla "Depuración" con archivo y línea, y la página sigue respondiendo igual.
- El usuario guarda su clave de Gemini, OpenAI, Anthropic, Nous (Hermes) o un compatible, la prueba sin gastar tokens y escribe el bloque `.env` de IA en un proyecto.
- Abre Claude Code en la carpeta de un proyecto con el MCP de WolfCore Dev registrado, sin copiar nada a mano.
- El Doctor encuentra un puerto 80 ocupado por IIS o un rango reservado por Hyper-V y guía la solución.

**Base técnica para D y E:** la tarea 1 crea la capa `Plataforma` completa (interfaz + Windows) y mueve detrás de ella todo lo que hoy depende de Windows. D y E no rehacen ese trabajo: E solo agrega Linux y macOS.

## 2. Decisiones de enfoque

| Tema | Elegido | Por qué | Quién |
|---|---|---|---|
| Orden de etapas | C → D → E → F | Primero lo que el usuario nota cada día en Windows. | Usuario (delegó; plan de etapas aprobado) |
| Alcance de C | IA en la nube + agentes + depuración PHP + Doctor y notificaciones, **más contenedores mínimos** (adelantados de F) **y la capa `Plataforma`** como tarea 1. | Los contenedores mínimos son baratos y el usuario los pide; `Plataforma` evita pagar dos veces la multiplataforma. | Controlador |
| Contenedores | Detectar motor (Docker o Podman), listar, iniciar, detener, reiniciar y ver registros. **Sin** editar compose, sin `pull`, sin borrar. | Cubre el uso diario sin convertir WolfCore Dev en un Docker Desktop. | Controlador |
| Proveedores de IA | Ollama (ya), **Hermes** = Nous Research por API compatible con OpenAI y URL base editable, **Google Gemini**, **OpenAI**, **Anthropic Claude** y **compatibles con OpenAI** (OpenRouter, Groq, Mistral, DeepSeek, LM Studio) con URL base editable. | Lo pidió el usuario; los compatibles cubren el resto con un solo cliente. | Usuario |
| Claves de IA | `safeStorage` solo en main, como el token de GitHub. El renderer ve "configurada sí/no" y los 4 últimos caracteres. Nunca en `config.json`, logs, URLs ni eventos. | Mismo modelo de amenaza que ya se validó en la Etapa B. | Usuario |
| Probar conexión | Listar modelos (no gasta tokens), con latencia y error concreto (clave inválida, sin saldo, límite, región, sin red). | Es la prueba gratuita que piden. | Usuario |
| Mensaje de prueba | **Se incluye**, opcional: botón "Probar un mensaje" por proveedor, con clic explícito, aviso de costo estimado y respuesta máxima de 16 tokens. **No hay chat.** | Listar modelos no detecta "sin saldo" ni "modelo sin acceso" en varios proveedores (OpenAI y Anthropic listan con saldo cero). Un mensaje mínimo es la única forma de saber si el proyecto podrá llamar al modelo; cuesta fracciones de centavo y nunca corre solo. | Constructor (para revisar) |
| Bloque `.env` de IA | Por proyecto y para cualquier proveedor. Pide confirmación, avisa que la clave queda en texto plano y revisa que `.env` esté en `.gitignore` (ofrece agregarlo). | Es inevitable si el código lee la clave del `.env`. | Usuario |
| Agentes | Detectar o instalar Claude Code, Codex CLI y Hermes Agent; registrar el MCP de WolfCore Dev en su configuración (con confirmación y copia de respaldo del archivo); abrir el agente en la carpeta del proyecto con la clave solo en ese proceso; **nunca se lanzan solos**. | Los agentes gastan mucho y actúan sobre el código: siempre por decisión del usuario. | Usuario |
| PHP | Xdebug por sitio (modo, puerto, `launch.json`), editor de `php.ini` por versión con diff y valores rápidos, gestor de extensiones (activar/desactivar; DLL NTS en Windows), ini aislado por sitio. Nginx: editor de vhost con `nginx -t` y vuelta atrás automática. | Paridad con EnvKit/Herd Pro en lo que el usuario usa a diario. | Usuario |
| `dump()`/`dd()` | Captura por `auto_prepend_file` que instala un manejador de VarDumper y envía cada volcado (ya renderizado en PHP) a un receptor local de WolfCore Dev. Equivalentes: `wd()` para CodeIgniter 3 sin VarDumper y `wolfdump` para Python. | Ver "Decisiones del constructor" sobre por qué no se usa el protocolo binario del `server:dump` de Symfony. | Usuario (función) / Constructor (mecanismo) |
| Notificaciones | Nativas (`Notification` de Electron) + centro de eventos en la app, con historial. | Paridad con Herd/ServBay/EnvKit. | Usuario |
| Doctor | Puertos (IIS, FlyEnv, Hyper-V/WSL con rangos reservados), CA por vencer, hosts dañado, PATH duplicado, VC++ ausente, avisos de antivirus; cada hallazgo con reparación guiada. Confianza de la CA en Node, Python y Firefox. | Es la fuente principal de "no me anda" en Windows. | Usuario |
| Pendientes de la Etapa B | Errores del núcleo con **código** traducido en el renderer; **un solo oyente IPC** multiplexado en preload; métricas de uvicorn con **procesos hijos** incluidos. | Se arrastran desde la revisión de B. | Usuario |
| Orden de tareas | **Rebanadas verticales por área** (núcleo + IPC + interfaz en la misma tarea o en dos seguidas), después de dos tareas de base (Plataforma y errores/IPC). | En B, separar núcleo, IPC e interfaz obligó a una tarea de IPC enorme. Con áreas independientes, cada tarea termina con algo usable y CI en verde. | Constructor (para revisar) |

## 3. Diseño

### 3.1 Capa `Plataforma` (base para D y E)

Hoy ya existe la interfaz `Plataforma` (hosts, puertos, certificados, procesos) con `PlataformaWindows`. Queda código de Windows fuera de ella: rutas de datos (`rutas.ts`), PATH del usuario (`pathUsuario.ts`, registro), terminal (`wt.exe`), editor (`%LOCALAPPDATA%`), lanzador oculto (`supervisor.ts`), variantes del catálogo (`nts-vs17-x64`) y nombres `.exe`.

- **La interfaz se amplía** con: carpeta de datos, carpeta de configuración de herramientas del usuario (`~/.claude`, `~/.codex`…), PATH del usuario (leer/escribir con respaldo), variables de entorno del usuario, abrir terminal visible con entorno extra, buscar ejecutables (PATH + rutas conocidas), lanzar oculto, sufijo de ejecutables, identificador de catálogo (`win-x64`), confiar la CA en otros almacenes (Firefox), árbol de procesos (hijos de un PID) y diagnósticos de bajo nivel (rangos de puertos reservados, servicios del sistema, VC++).
- **Migración sin cambio de comportamiento:** las pruebas existentes pasan sin tocarse; las rutas de datos no cambian.
- `crearPlataforma()` en Linux/macOS sigue lanzando "aún no soportada" (la implementan en E). Las pruebas específicas de Windows usan `describe.skipIf(process.platform !== 'win32')`.
- Regla desde aquí: **ningún módulo nuevo** usa `process.platform`, `path.win32`, PowerShell ni el registro fuera de `plataforma/`.

### 3.2 Base transversal: errores con código, oyente único y eventos

- **Errores con código:** `ErrorWolf` con `codigo` (p. ej. `ia.clave_invalida`, `nginx.prueba_fallo`) y `datos` (valores para interpolar, nunca secretos). El IPC los serializa como `{codigo, datos, mensaje}`; el renderer traduce `errores.<codigo>` con vue-i18n y, si falta la clave, muestra el mensaje. Se migran los errores que llegan al usuario por IPC; una prueba exige que cada código tenga texto en `es` y `en`.
- **Oyente único en preload:** un solo `ipcRenderer.on` reparte los eventos a los suscriptores por nombre. Se acaba el `MaxListenersExceededWarning`.
- **Centro de eventos:** el núcleo emite `aviso` con `{id, nivel, tipo, titulo (código), datos, fecha, accion?}`. Fuentes: servicio caído o en error, puerto ocupado al iniciar, certificado o CA por vencer (30 días), túnel caído, proceso de proyecto en error, Doctor con hallazgos nuevos, contenedor detenido inesperadamente.
  - Historial de 200 avisos en `run/avisos.json`; se marcan leídos.
  - Main muestra la **notificación nativa** si la ventana no tiene el foco, con límite (máximo 1 por tipo y fuente cada 5 min). Ajustes: activar o desactivar por tipo.
  - Interfaz: campana en la barra superior con contador, panel con la lista y la acción sugerida ("Ver registro", "Abrir Doctor", "Reiniciar").

### 3.3 Doctor

Pantalla "Doctor" con "Revisar ahora" (también al iniciar, en segundo plano y sin bloquear). Cada **hallazgo** tiene gravedad, explicación, evidencia y una **reparación guiada** que siempre muestra qué hará y pide confirmación.

| Revisión | Cómo se detecta | Reparación guiada |
|---|---|---|
| Puertos 80/443/3306/5432… ocupados | `duenosDePuertos`; se reconocen IIS (`W3SVC`, `http.sys`), FlyEnv, Skype, XAMPP | Apagar el servicio de Windows **solo con confirmación y elevación**, o cambiar el puerto en WolfCore Dev. FlyEnv nunca se toca: se indica cerrarlo. |
| Rangos reservados (Hyper-V/WSL/Docker) | `netsh interface ipv4 show excludedportrange protocol=tcp` | Proponer otro puerto fuera de los rangos; mostrar el comando de administrador para liberar el rango (no se ejecuta solo). |
| CA o certificados por vencer o vencidos | Fecha de la CA y de cada certificado | Regenerar certificados; regenerar la CA con aviso (hay que volver a confiarla). |
| CA no confiada en Node, Python o Firefox | Ver 3.4 | Activar la confianza correspondiente. |
| `hosts` dañado | Bloque de WolfCore Dev duplicado o sin cierre, UTF-16, solo lectura, dominios `.test` faltantes | Reescribir el bloque con `escribirComoAdmin` y copia previa. |
| PATH duplicado o roto | Entradas repetidas de PHP/Node de WolfCore Dev u otras herramientas (FlyEnv, XAMPP) delante | Quitar duplicados propios con copia del valor anterior; las ajenas solo se informan. |
| VC++ ausente | Registro de `VC\Runtimes\x64`; `php -v` falla con error de DLL | Instalar con `winget install Microsoft.VCRedist.2015+.x64` (con confirmación). |
| Antivirus | Defender activo sin exclusión para la carpeta de datos; arranques lentos de `php-cgi` | **Solo informa** y muestra el comando para agregar la exclusión; nunca cambia la seguridad del equipo. |
| Servicios en error | Estado del supervisor y final del log | "Ver registro" y "Reintentar". |

### 3.4 Confianza de la CA fuera del almacén de Windows

- **Node:** los procesos de proyecto y la "Terminal aquí" reciben `NODE_EXTRA_CA_CERTS=<ca.crt>`. Opción en Ajustes para fijarlo como variable del usuario (con confirmación; se revierte al desactivar).
- **Python:** se genera `etc/ca/python-bundle.pem` = raíces de `certifi` del venv del proyecto + la CA de WolfCore Dev; los procesos del proyecto reciben `REQUESTS_CA_BUNDLE` y `SSL_CERT_FILE` apuntando a él. Si el proyecto no tiene `certifi`, se usan las raíces exportadas del almacén de Windows. Nunca se reemplaza la confianza con solo nuestra CA.
- **Firefox:** en cada perfil de `profiles.ini` se agrega `user_pref("security.enterprise_roots.enabled", true);` en `user.js`, entre marcas de WolfCore Dev, con copia previa. Firefox debe estar cerrado (se detecta y se avisa). Firefox confía entonces en la CA que ya está en el almacén del usuario. Sin cambios en `Program Files`.

### 3.5 IA en la nube

- **Proveedores** (`ProveedorIa`): `ollama`, `hermes`, `gemini`, `openai`, `anthropic`, `compatible`. Varios `compatible` con nombre propio (OpenRouter, Groq…). Configuración no secreta en `config.json` (`ia.proveedores[]`: id, tipo, nombre, URL base, modelo por defecto); la clave solo en el almacén de secretos.
- **Clientes:** uno por familia con `fetch`, plazo y cancelación.
  - OpenAI y compatibles (incluye Hermes, URL base por defecto `https://inference-api.nousresearch.com/v1`): `GET {base}/models`; mensaje con `POST {base}/chat/completions`.
  - Anthropic: `GET /v1/models` y `POST /v1/messages` con `x-api-key` y `anthropic-version`.
  - Gemini: `GET /v1beta/models` y `generateContent` con la cabecera `x-goog-api-key` (**nunca `?key=` en la URL**).
  - Ollama: el cliente actual.
- **Resultado de la prueba:** `{ok, latenciaMs, modelos[], error?: {codigo}}` con códigos `ia.clave_invalida`, `ia.sin_saldo`, `ia.limite`, `ia.region`, `ia.sin_red`, `ia.url_invalida`, `ia.plazo`, `ia.respuesta_rara`. Los cuerpos de error se resumen sin repetir la clave.
- **URL base editable:** solo `https://`, o `http://` a `127.0.0.1`/`localhost` (LM Studio, Ollama). Sin credenciales en la URL.
- **Bloque `.env` de IA por proyecto:** variables por proveedor (`OPENAI_API_KEY`/`OPENAI_BASE_URL`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_HOST`, `OPENAI_*` para Hermes y compatibles) y `AI_MODEL` opcional. Va entre marcas propias como el bloque de conexión de BD, se previsualiza **con la clave enmascarada**, pide confirmación, avisa del texto plano y revisa `.gitignore`.
- **Pantalla "IA"** (sustituye a "IA local"): Ollama como hasta ahora + tarjetas de proveedores con estado, últimos 4 caracteres, "Probar conexión", "Probar un mensaje" y "Usar en un proyecto".

### 3.6 Agentes

- **Agentes soportados:** Claude Code, Codex CLI y Hermes Agent.
- **Detección:** ejecutable en PATH o rutas conocidas (por la capa `Plataforma`), versión y si su configuración ya tiene el MCP de WolfCore Dev.
- **Instalación** (con confirmación, nunca sola): Claude Code y Codex CLI con `npm install -g` de los paquetes oficiales desde `registry.npmjs.org`, usando el Node de WolfCore Dev. Hermes Agent: si su instalador oficial no soporta Windows nativo, solo detección y un enlace a la guía oficial (se verifica en la tarea).
- **Registrar el MCP:** primero la CLI del propio agente (`claude mcp add --transport http …`, `codex mcp add …`). Si no existe, se edita el archivo (`~/.claude.json`, `~/.codex/config.toml`, configuración de Hermes) **con copia de respaldo con fecha**, solo agregando o reemplazando la entrada `wolfcore`, y negándose si el archivo no se puede interpretar. Donde el agente lo permita, el token del MCP se pasa por variable de entorno (`WOLFCORE_MCP_TOKEN`) en lugar de quedar escrito.
- **Abrir en un proyecto:** terminal visible en la carpeta del proyecto con el agente y, solo en ese proceso, la clave del proveedor elegido (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`…) y `WOLFCORE_MCP_TOKEN`. Si el agente usa su propia sesión (p. ej. suscripción de Claude), no se inyecta clave. Aviso de costo la primera vez.
- **Mensaje de commit sugerido** en el panel Git del proyecto: toma `git diff --cached` (hasta 20 000 caracteres, sin archivos `.env*`, claves ni binarios), lo envía al proveedor elegido y muestra la propuesta editable. "Hacer commit" ejecuta `git commit -F -` **solo sobre lo preparado**; nunca hace `add` ni `push`.

### 3.7 PHP: `php.ini`, extensiones, Xdebug e ini por sitio

- **Editor de `php.ini` por versión:** texto con resaltado, **diff** contra lo guardado antes de aplicar, y **valores rápidos** (`memory_limit`, `upload_max_filesize`, `post_max_size`, `max_execution_time`, `display_errors`, `error_reporting`, `date.timezone`, `opcache.enable`). Al guardar: copia con fecha en `etc/php/<rama>/respaldos/`, `php -c <ini> -v` como prueba y reinicio del pool; si la prueba falla, se restaura la copia.
- **Gestor de extensiones:** lista los `.dll` de `ext/` con estado (activa, inactiva, falta). Activar o desactivar edita el ini con la misma prueba y vuelta atrás. Extensiones de terceros (Xdebug, redis, imagick…) **solo desde el catálogo**, con la variante NTS-VS16/VS17-x64 que corresponda a la versión instalada, de host permitido y con SHA-256 fijado.
- **Ini por sitio (aislamiento):** un sitio puede tener ajustes propios (`sitio.phpIni: Record<string,string>`) y Xdebug. Si los tiene, usa un **pool propio** de `php-cgi` (1–2 procesos) con su ini = ini de la rama + ajustes del sitio, y su `upstream` en Nginx. Los demás sitios siguen en el pool compartido, sin costo extra.
- **Xdebug por sitio:** interruptor con modo (`debug`, `develop`, `coverage`, `profile`, `trace`), puerto (9003 por defecto), `start_with_request` (`trigger` o `yes`) y `client_host=127.0.0.1`. Al activarlo: instala Xdebug del catálogo si falta, crea el pool aislado y ofrece **generar `.vscode/launch.json`** (fusiona con uno existente con copia; `pathMappings` no hace falta porque es local). Para PhpStorm se muestra la configuración a copiar.

### 3.8 Nginx: editor de vhost por sitio

- Muestra el vhost generado y un área de **reglas propias** (lo que hoy es `reglasExtra` y el tipo "personalizado"), con **snippets** (CORS, caché de estáticos, límite de subida, `try_files` de SPA, cabeceras de seguridad, proxy WebSocket).
- Modo avanzado: reemplazar el vhost completo (`sitio.vhostManual`), con aviso de que WolfCore Dev ya no lo regenera.
- **Aplicar:** escribe, ejecuta `nginx -t`; si falla, **restaura el anterior** y muestra la salida; si pasa, recarga Nginx. Historial de las últimas 10 versiones por sitio.

### 3.9 Captura de `dump()`/`dd()` y visor de errores

- **Receptor local:** servidor HTTP en `127.0.0.1:<puerto>` (9912 por defecto) con token, que guarda los volcados en memoria (últimos 500) y en `run/dumps.jsonl` (rota a 5 MB).
- **PHP:** `auto_prepend_file=<datos>/etc/php/wolfcore-prepend.php` en los ini que WolfCore Dev genera, **solo si la captura está activa**. El prepend:
  - si existe `Symfony\Component\VarDumper\VarDumper`, instala un manejador que renderiza con `HtmlDumper` y `CliDumper`, agrega archivo, línea, URL y sitio, y envía JSON con un plazo de 200 ms;
  - define `wd()` (y `dump()`/`dd()` si no existen) para proyectos sin VarDumper como CodeIgniter 3;
  - si el receptor no responde, no hace nada visible y sigue (la página nunca se rompe ni se demora más del plazo); `dd()` sigue deteniendo la ejecución.
- **Python:** módulo `wolfdump` (`from wolfdump import dump`) que los procesos del proyecto encuentran por `PYTHONPATH`; usa `pprint`/`repr` y el mismo receptor.
- **Pantalla "Depuración":** lista en vivo con filtro por sitio, origen y texto; HTML del volcado en un `iframe` aislado (`sandbox` sin scripts); limpiar.
- **Visor de errores** sobre `Registros`: interpreta el log de errores de PHP, `laravel.log` (con traza), los logs de CodeIgniter 3 y las trazas de Python de los procesos de proyecto. Agrupa por huella (tipo + mensaje normalizado + archivo:línea), con contador, primera y última vez, y "Abrir en el editor" en la línea.
- **MCP:** herramientas nuevas `listar_dumps`, `leer_dump`, `limpiar_dumps`, `listar_errores` y `leer_error`. Ninguna es destructiva salvo `limpiar_dumps`, que pide confirmación en la ventana.

### 3.10 Contenedores (mínimo)

- **Motor:** detecta `docker` y `podman` (CLI en PATH y si el demonio o la máquina responden). Si no hay motor, la pantalla lo explica y enlaza a la instalación oficial; WolfCore Dev no los instala.
- **Lista:** `ps -a --format json` (nombre, imagen, estado, puertos, proyecto de compose), refresco cada 5 s solo con la pantalla visible.
- **Acciones:** iniciar, detener, reiniciar y registros en vivo (`logs -f --tail 500`, por el `Lanzador` y cancelables). Los ids se validan con una expresión estricta; nunca se pasa texto libre al shell.
- **Fuera:** compose, imágenes, volúmenes, `pull`, borrar, crear.

## 4. Calidad

- Pruebas unitarias en cada módulo del núcleo; los proveedores de IA y los agentes se prueban contra **servidores HTTP falsos** y **CLI falsas**; ninguna prueba automática usa claves reales ni gasta tokens.
- Ninguna prueba toca FlyEnv, el `hosts` real, el almacén de certificados real, el PATH real del usuario, los archivos de configuración reales de los agentes ni los perfiles reales de Firefox: todo en carpetas temporales y con la `Plataforma` falsa.
- **CI en verde en Windows, macOS y Ubuntu** para cerrar cada tarea. Lo exclusivo de Windows va detrás de `Plataforma` y sus pruebas usan `skipIf` con la condición explícita.
- Prueba de integración real ampliada (Windows): Xdebug en un sitio con un cliente DBGp mínimo que recibe la conexión; `php.ini` con un valor inválido vuelve atrás; vhost con error vuelve atrás y Nginx sigue respondiendo; `dump()` llega al receptor; prueba de conexión contra un servidor OpenAI falso; Doctor sobre un `hosts` de prueba dañado.
- **Ningún dato real del cliente se pierde:** todo archivo de usuario que WolfCore Dev edita (`php.ini`, vhost, `.env`, `launch.json`, configuración de agentes, `user.js`, `hosts`) tiene copia previa y vuelta atrás.
- Cierre de etapa: instalador NSIS actualizado y probado instalado, y README al día. Solo se publica la rama `feat/etapa-c`; no se fusiona con `main`.
- Prueba real con cada proveedor y agente: la hace el usuario con sus claves, o el controlador con su permiso explícito.

## 5. Fuera de alcance (→ Etapas D, E y F)

- **Etapa D:** nuevo proyecto con un clic, plantillas, importar de Laragon/XAMPP/Herd, gestor `.env` completo con secretos enmascarados, CLI `wolf`, túneles con nombre y alternativos, LAN con QR, respaldo y perfiles del entorno, snapshots de BD, workspaces, cron editable, limpieza de versiones.
- **Etapa E:** implementaciones Linux y macOS de `Plataforma`, catálogo por SO, instaladores AppImage/`.deb`/`.dmg`, autoactualización, desinstalación limpia, `safeStorage` sin llavero en Linux.
- **Etapa F:** compose, imágenes y volúmenes de contenedores; DNS propio; Apache/Caddy; FrankenPHP; inspector de SQL/jobs/HTTP; perfilado (más allá de `xdebug.mode=profile`, el visor de cachegrind queda en F); webhooks; RAG local; el resto de la lista.
- **No se hace:** chat de IA, historial de conversaciones, intermediar llamadas de IA, lanzar agentes de forma automática o programada.

## 6. Decisiones del constructor (para revisar)

- **"Probar un mensaje" sí se incluye** (opcional, clic explícito, aviso de costo, 16 tokens máximo). Motivo: listar modelos no revela falta de saldo ni de acceso al modelo en OpenAI ni en Anthropic.
- **Captura de dumps por JSON propio, no por el protocolo de `server:dump`:** ese protocolo envía objetos PHP serializados (`Data` de VarDumper) que solo PHP sabe reconstruir; interpretarlos en Node sería frágil. El prepend renderiza en PHP y manda HTML + texto. Con esto también funciona en proyectos sin Symfony (CI3).
- **Ini por sitio con pool propio** solo para los sitios que lo piden (Xdebug o ajustes propios). `PHP_VALUE` por `fastcgi_param` no lo respeta `php-cgi` y Xdebug no se puede cargar por `.user.ini`.
- **Xdebug y extensiones de terceros solo del catálogo con SHA-256**, como los demás binarios; se agrega `xdebug.org` (y el host de PECL de Windows si hace falta) a `HOSTS_PERMITIDOS`.
- **Firefox por `user.js` por perfil** (`security.enterprise_roots.enabled`), no por `policies.json`: no necesita administrador y se revierte quitando el bloque.
- **Antivirus y rangos reservados solo informan**: cambiar la seguridad o la red del equipo lo hace el usuario con el comando que se le muestra.
- **Rebanadas verticales por área** en lugar de "todo el núcleo, luego todo el IPC, luego toda la interfaz".
- **Pantalla "IA local" pasa a "IA"**; "Depuración", "Doctor" y "Contenedores" son pantallas nuevas en el grupo Entorno/Utilidades de la barra lateral.
- **Hermes Agent en Windows:** si no tiene instalador nativo, se ofrece solo detección y guía; no se instala dentro de WSL de forma automática.
- **Mensaje de commit:** "Hacer commit" solo sobre lo preparado, sin `add` ni `push`.
