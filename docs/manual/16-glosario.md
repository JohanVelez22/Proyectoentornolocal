# 16 · Glosario

## Para qué sirve

Este glosario explica en palabras sencillas los términos técnicos que aparecen en los botones, avisos y pantallas de **WolfCore Dev**.

## Términos de A a Z

- **Archivo `hosts`:** archivo de Windows (`C:\Windows\System32\drivers\etc\hosts`) que asocia sus dominios locales `.test` con `127.0.0.1` para que el navegador abra sus proyectos sin internet. WolfCore Dev edita únicamente su propio bloque delimitado.
- **Autoridad de certificación (CA):** certificado raíz local creado por WolfCore Dev para firmar los certificados HTTPS de sus sitios `.test`. Cuando Windows (o su móvil) confía en la CA, el navegador muestra el candado sin advertencias.
- **Captador de correo:** servidor SMTP local (`127.0.0.1`) que atrapa los correos salientes de sus proyectos y los muestra en un buzón web sin enviarlos a internet (como Mailpit o smtp4dev).
- **Carpeta de datos:** carpeta `%LOCALAPPDATA%\WolfCoreDev` donde WolfCore Dev guarda binarios (`bin/`), bases de datos (`data/`), configuraciones (`etc/`), certificados (`ca/`, `certs/`), registros (`logs/`) y temporales. Sus proyectos nunca se mueven aquí.
- **Carpeta vigilada:** carpeta de su disco (por ejemplo `C:\Proyectos`) que WolfCore Dev observa para sugerirle montar nuevas subcarpetas como proyectos, siempre esperando su confirmación.
- **CLI (`wolf`):** herramienta de terminal que envía órdenes a WolfCore Dev desde PowerShell, `cmd` o Git Bash.
- **Copia en frío:** respaldo completo de la carpeta de datos de una base realizado mientras el servidor está detenido, para garantizar que los archivos queden íntegros.
- **Cron (expresión cron):** formato de 5 campos (`minuto hora día-mes mes día-semana`) que indica cuándo ejecutar una tarea programada (por ejemplo `0 3 * * *` significa todos los días a las 03:00).
- **Datos reales:** marca de seguridad en un sitio que indica que contiene información real de clientes o de producción, activando bloqueos y confirmaciones reforzadas.
- **Diff:** comparación línea por línea entre el contenido anterior y el nuevo de un archivo (por ejemplo en `php.ini`, `.env` o la herramienta **Comparar**).
- **Doctor:** herramienta de diagnóstico integrada en WolfCore Dev que revisa puertos, `hosts`, certificados, PATH, Visual C++, cortafuegos y servicios, ofreciendo reparaciones guiadas.
- **Dominio `.test`:** dominio reservado oficialmente para desarrollo local (por ejemplo `mi-tienda.test`), que nunca choca con dominios reales de internet.
- **Huella (SHA-256 / SHA-512) y firma PGP:** códigos criptográficos que verifican que un archivo descargado coincide exactamente con el original publicado por su fabricante.
- **Instancia:** instalación independiente de una versión principal de un motor de base de datos (por ejemplo `postgresql@16` y `postgresql@17`), con su propia carpeta de datos, credenciales y puerto.
- **Instantánea:** copia rápida del estado actual de una base de datos o de la configuración del entorno que permite volver atrás con un clic.
- **MCP (Model Context Protocol):** protocolo local (`127.0.0.1`) que permite a agentes de IA como Claude Code o Codex CLI consultar el estado, logs y proyectos de WolfCore Dev y solicitar acciones con confirmación.
- **Perfil (`.wolfperfil`):** archivo ZIP exportado desde **Ajustes → Respaldo y perfiles** para trasladar sitios, versiones, instancias, plantillas y ajustes a otro equipo sin incluir secretos.
- **Pool de PHP:** grupo de procesos `php-cgi` que atienden las peticiones de una versión de PHP (o de un sitio concreto cuando usa Xdebug o ajustes propios).
- **Proxy inverso:** configuración de Nginx que reenvía las peticiones de un dominio `.test` hacia un proceso local de Node, Vite o FastAPI en otro puerto.
- **Receta (`wolfcore.yml`):** conjunto de pasos de preparación de un proyecto (dependencias, `.env`, base de datos, migraciones, procesos) que solo corre cuando usted confía en el repositorio.
- **Runtime:** lenguaje o entorno de ejecución asignado a un proyecto (Node.js, Python, Java, .NET, Go, Rust, Bun, Deno, Zig, Kotlin o Dart) sin alterar el PATH global del sistema.
- **Tailnet:** red privada creada con Tailscale entre sus propios dispositivos.
- **Túnel:** conexión segura que expone temporalmente un sitio local a internet (Cloudflare, ngrok, Expose, Tailscale Funnel) o a su red privada (Tailscale Serve).
- **Vhost (Virtual Host):** archivo de configuración de Nginx que define cómo responder a un dominio `.test` concreto (carpeta raíz, versión de PHP, HTTPS y reglas propias).
- **Volcado (dump):** puede referirse a un archivo exportado de una base de datos (`mysqldump`, `pg_dump`) o a una salida de depuración enviada con `dump()`, `dd()`, `wd()` o `wolfdump`.
- **Workspace:** grupo con nombre de servicios, instancias y procesos que se encienden o apagan juntos desde **Inicio**, la bandeja, `Ctrl+K` o `wolf`.

## Paso a paso para consultar un término dentro de la app

1. Pulse `Ctrl+K` en cualquier pantalla para buscar directamente una herramienta, pantalla o acción por su nombre.
2. Para términos de red y desarrollo web, abra **Herramientas → Red → Guías** (**HTTP**, **Túneles** y **Git**).

## Ejemplo

Si un aviso dice: *«La instancia `postgresql@17` está bloqueada tras una actualización; revise el respaldo en frío en Servicios → Versiones»*, consulte en este glosario **Instancia** y **Copia en frío**, y siga las indicaciones de [03 · Versiones e instancias](03-versiones.md).

[CAPTURA: Pantalla Herramientas → Red → Guías mostrando las pestañas HTTP, Túneles y Git]

## Si algo falla

- **Encuentra un término en la interfaz que no aparece aquí:** búsquelo en el [Índice de capítulos](00-indice.md) o en las guías integradas dentro de **Herramientas → Red → Guías**.
