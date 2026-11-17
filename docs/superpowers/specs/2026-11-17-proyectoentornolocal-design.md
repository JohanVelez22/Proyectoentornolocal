# Proyectoentornolocal — Diseño

Fecha: 2026-11-17 · Estado: aprobado por el usuario (2026-11-17)

## 1. Para qué y por qué

Programa de escritorio propio, para uso personal y sin fines comerciales, que administra el entorno de desarrollo local: servidores web, PHP, bases de datos, dominios `.test` y túneles públicos.

Nace porque las herramientas actuales se quedan cortas. **FlyEnv 4.20 gratis** solo admite 3 sitios, un único túnel de Cloudflare con nombre y ningún túnel rápido administrado desde el programa. Además, su lista de sitios no se refresca cuando hay cambios externos y su PostgreSQL no trae pgvector. **ServBay** gratis también es limitado. Mientras tanto, el usuario rota cupos con `C:\Proyectos\_herramientas\wolfcore.ps1`. Ese script es la especificación viva de los flujos que necesita: activar un sitio, abrir un enlace público, ajustar la URL base y cerrar.

Proyectos que debe servir desde el primer día:

| Proyecto | Tipo | PHP | BD |
|---|---|---|---|
| WolfCore System | Laravel 13 | 8.4 | MySQL |
| WolfCore Rents | Laravel 13 | 8.4 | MySQL |
| WolfCore Coffe | Laravel 13 | 8.4 | SQLite |
| WolfCore Diamantes | CodeIgniter 3 | 8.3 | PostgreSQL |
| WolfCore Dollar | CodeIgniter 3 | 8.3 | PostgreSQL |
| Asistente IA Wpp | FastAPI (Python) | — | PostgreSQL + pgvector |

**Éxito:** los 5 sitios están encendidos a la vez, cada uno con su versión de PHP y su `.test`, y cualquiera se publica con un interruptor que muestra su enlace. Todo eso sin scripts aparte y sin depender de FlyEnv.

### Metas
- Sitios ilimitados, cada uno con su versión de PHP y su plantilla (Laravel, CodeIgniter 3, estático o personalizada).
- Servicios: Nginx, PHP (varias versiones en paralelo), MySQL, PostgreSQL con pgvector, Redis, Node y Python. Se pueden instalar, encender y apagar, y se ve su estado.
- Dominios `.test` escritos en el archivo hosts con elevación, y un aviso claro cuando no hay permiso.
- Bases de datos: crear, restaurar respaldos de `pg_dump` y `mysqldump`, y ver los datos de conexión.
- Túneles de Cloudflare, uno por sitio: rápidos (`trycloudflare`) y con nombre (ApiToken y dominio propio). Cada uno con interruptor y un enlace que se abre con un clic.
- Servidor MCP para que un asistente controle el programa; Composer y otras herramientas.
- Multiplataforma: Windows primero, después macOS y Linux.

- **Contenedores** (pedido del usuario el 2026-11-17): administrar Podman, que ya está instalado (v6.1), y Docker si existe. Ver la sección *Contenedores*.

### Lo mejor de cada uno (y lo que se resuelve)

| Función | FlyEnv | ServBay | Entorno Local |
|---|---|---|---|
| Sitios | 3 gratis | limitados gratis | **ilimitados** |
| PHP en paralelo por sitio | sí | sí | sí, con grupo de trabajadores |
| Túnel por sitio | 1 con nombre | — | **rápido y con nombre por sitio, interruptor y enlace** |
| Refresco de estado | manual | sí | **por eventos + sondeo** |
| pgvector | no | sí (macOS) | sí (fase 2) |
| MCP / IA | sí | sí | sí, mismo núcleo que la UI |
| SSL local | sí | sí | sí (fase 3) |
| Correo de pruebas (MailPit) | sí | sí | sí (fase 3) |
| Modelos locales (Ollama) | sí | sí | opcional (fase 5) |
| Contenedores | no | no | **sí: Podman/Docker (fase 3)** |
| Respaldo y restauración de BD | parcial | sí | sí (fase 2) |
| Proyectos CodeIgniter 3 con reglas seguras | manual | manual | **plantilla integrada** |

### Fuera de alcance
- Construir un motor de contenedores propio o reemplazar a Podman o Docker. El programa solo los administra.
- Apache, Caddy y los otros 80 módulos de FlyEnv. Se añaden solo si hacen falta.
- Distribuir el programa a terceros, cuentas, licencias o cobros.

### Lo que lo haría un fracaso aunque funcione
- Que exija abrir una terminal para tareas comunes, como pasa hoy con `wolfcore.ps1`.
- Que muestre un estado falso: un servicio marcado como encendido cuando no responde, o una lista sin refrescar. Es justo uno de los dolores de FlyEnv.
- Que toque el archivo hosts fuera de su propio bloque, o que falle en silencio cuando no hay permisos.
- Que copie código de terceros sin respetar su licencia.

## 2. Referencias y licencias

- **FlyEnv** (`xpf0000/FlyEnv`): licencia **BSD-3-Clause**. Se puede leer y reutilizar si se conserva su aviso de copyright. **Decisión: no se copia código.** Se toman como referencia sus funciones y flujos: módulos por servicio, un ayudante con privilegios para hosts y certificados, y su servidor MCP. Si algún día se adapta un fragmento concreto, se registra en `THIRD_PARTY_NOTICES.md` con su aviso BSD-3.
- **ServBay** (`ServBay/ServBay`): el repositorio solo publica el README en varios idiomas. No hay código fuente ni licencia, y sus compilaciones portátiles casi nunca declaran licencia. **No se usa nada de ahí.** Solo sirve como referencia de funciones: sitios, base de datos, SSL y modelos locales.
- **Binarios de terceros:** se descargan en tiempo de ejecución desde las fuentes oficiales y nunca se incluyen en el repositorio. Cada uno conserva su propia licencia (PHP License, BSD-2 de Nginx, GPL de MySQL, PostgreSQL License, Apache-2.0 de cloudflared).
- **Licencia de Proyectoentornolocal:** MIT.

## 3. Enfoques considerados

| Opción | Ventajas | En contra |
|---|---|---|
| **Electron + Vue 3 + TypeScript** (elegido) | Node 26 ya está instalado. Es TypeScript de punta a punta. Vue le resulta familiar a un desarrollador Laravel. Ecosistema enorme (`@modelcontextprotocol/sdk`, electron-builder) y ruta probada: FlyEnv usa este mismo stack en las 3 plataformas. | Instalador de unos 100 MB y más memoria en reposo. Es irrelevante para uso personal. |
| Tauri 2 (Rust + web) | Binario chico y backend en Rust muy robusto. | Hay que instalar Rust y aprenderlo. Mantenerlo sería difícil para alguien que trabaja en PHP y Python. |
| Wails (Go + web) | Un solo binario y Go es bueno para manejar procesos. | Hay que instalar Go y aprenderlo. Comunidad y ecosistema MCP más chicos. |

Las prioridades del usuario son flexibilidad, intuitividad, robustez, multiplataforma y mantenimiento. Electron gana sobre todo en mantenimiento, porque el usuario podrá leer y cambiar el código, y en lo multiplataforma. La robustez se consigue con la arquitectura (sección 4), no con el lenguaje.

## 4. Arquitectura

```
┌──────────── Electron ─────────────┐
│ Ventana (Vue 3 + Naive UI)        │   ← solo interfaz; habla por IPC tipado
│        │ preload/contextBridge    │
│ Proceso principal                 │
│   └── Núcleo  (@pel/core, TS puro, sin Electron)
│         ├─ Catalogo / Instalador  (descarga, verifica, descomprime)
│         ├─ Servicios             (Nginx, PHP, MySQL, Postgres, Redis…)
│         ├─ Supervisor            (procesos hijos, PID, puerto, reinicio)
│         ├─ Sitios + GeneradorNginx
│         ├─ Hosts                 (bloque propio + elevación por SO)
│         ├─ Tuneles               (cloudflared rápido / con nombre)
│         ├─ BasesDeDatos
│         ├─ Eventos               (bus → la UI se refresca sola)
│         └─ Almacen               (JSON validado con zod)
│   ├── Servidor MCP (HTTP 127.0.0.1 + token) → usa el mismo Núcleo
│   └── Bandeja del sistema
└───────────────────────────────────┘
CLI `pel` (fase 3) → usa el mismo Núcleo
```

Principios:
1. **Un solo núcleo, varias puertas.** La interfaz, el servidor MCP y la CLI llaman a las mismas funciones del núcleo. Lo que hace un botón también lo puede hacer el asistente.
2. **El núcleo no conoce Electron.** Es TypeScript puro y se prueba con Vitest sin abrir ventanas. Las diferencias entre sistemas operativos quedan detrás de una interfaz `Plataforma` con implementaciones `win`, `mac` y `linux`.
3. **El estado se observa, no se supone.** Un servicio cuenta como "encendido" solo si su PID existe **y** su puerto responde. Un vigilante revisa cada 3 s y emite eventos. Así la interfaz siempre se refresca, también cuando alguien mata un proceso desde fuera.
4. **Configuración generada y propia.** Cada `nginx.conf`, vhost y `php.ini` se genera desde plantillas y se escribe en la carpeta de datos del programa. Nunca se editan archivos del sistema, salvo el bloque marcado dentro de hosts.

### Carpetas (Windows: `%LOCALAPPDATA%\Proyectoentornolocal`; macOS: `~/Library/Application Support/...`; Linux: `~/.local/share/...`)

```
bin/<servicio>/<version>/      binarios descargados
etc/nginx/nginx.conf           generado
etc/nginx/sites/<sitio>.conf   generado por sitio
etc/php/<version>/php.ini      generado desde php.ini-development
data/mysql/<version>/, data/postgres/<version>/
logs/<servicio>/, logs/sitios/<sitio>.access.log|error.log, logs/tuneles/<sitio>.log
run/estado.json                PIDs de procesos vivos (para recuperarlos al reabrir)
config.json                    sitios, servicios, ajustes (validado con zod, con versión de esquema)
```

### Servicios y procesos
- **Supervisor:** lanza los procesos hijos sin ventana, guarda su PID en `run/estado.json` y vuelca stdout y stderr a los logs. Si un proceso muere sin que se haya pedido, lo reinicia con espera creciente: hasta 5 intentos y después lo marca en error. Al reabrir el programa vuelve a tomar los procesos vivos por PID y nombre de ejecutable, sin duplicarlos.
- **Cerrar la ventana** minimiza a la bandeja y los servicios siguen corriendo. **Salir** desde la bandeja pregunta si se apagan los servicios; por defecto sí.
- **PHP en Windows:** no existe php-fpm, así que se usa `php-cgi.exe -b 127.0.0.1:<puerto>`. Cada versión tiene un **grupo de N trabajadores** (2 por defecto, configurable) en puertos consecutivos, por ejemplo 9084 y 9085 para la 8.4, y Nginx los usa como `upstream php84`. Se define `PHP_FCGI_MAX_REQUESTS=0` para que no mueran cada 500 peticiones, y el supervisor los revive si caen. En macOS y Linux se usa php-fpm.
- **Puertos:** antes de arrancar se comprueba que el puerto esté libre. Si está ocupado, el aviso dice **qué proceso lo tiene**, por ejemplo: "El puerto 80 lo usa nginx.exe (FlyEnv)". El usuario puede elegir otro puerto o cerrar ese proceso. Durante la transición, FlyEnv y este programa no pueden compartir el puerto 80.

### Catálogo e instalación
- `catalogo.json` vive en el repositorio y lista las versiones de cada servicio con su URL oficial, su SHA-256 cuando la fuente lo publica y el tipo de archivo. Para PHP se consulta en vivo `windows.php.net/downloads/releases/releases.json`, que publica los SHA-256. En la fase 1 la búsqueda en vivo es solo para PHP. Las versiones nuevas de los demás servicios se agregan editando el catálogo.
- Fuentes: PHP en windows.php.net (builds NTS x64), Nginx en nginx.org, cloudflared en las releases de GitHub de `cloudflare/cloudflared`, MySQL en dev.mysql.com (zip), PostgreSQL con los binarios zip de EDB, Node en nodejs.org, Python en python.org o el paquete NuGet `python`, y Composer en getcomposer.org.
- Flujo: descarga con barra de progreso, verificación del hash, descompresión en una carpeta temporal, y solo entonces se mueve a `bin/` (paso atómico). Si algo falla no quedan instalaciones a medias.
- **pgvector en Windows:** no existe un binario oficial. Plan (fase 2): un instalador que compile pgvector contra el PostgreSQL elegido con las Build Tools de Visual Studio, si están, guiando al usuario para instalarlas. En macOS y Linux se compila con `make`. *Antes de la fase 2 se investiga si hay una compilación confiable y verificable que evite pedir las Build Tools.*
- **Redis en Windows:** tampoco hay binario oficial. En la fase 2 se evalúa un port mantenido (por ejemplo `redis-windows`) o Memurai Developer. Se decide con una investigación corta antes de esa fase.

### Sitios
Modelo: `{ id, nombre, dominio (*.test), alias[], carpeta, tipo: laravel|codeigniter3|estatico|proxy|personalizado, puertoProxy?, datosReales: bool, raiz (calculada: laravel → carpeta/public), php: "8.4", reglasExtra (texto nginx), urlBaseVar?: "APP_URL"|"APP_BASE_URL"|null, nota }`.

- Sin límite de cantidad. Crear, editar, duplicar y borrar. Borrar un sitio nunca toca la carpeta del proyecto.
- **Plantillas Nginx** propias (inspiradas en `_herramientas/nginx-*.conf`):
  - Laravel: `try_files $uri $uri/ /index.php?$query_string;` y PHP solo por `index.php`.
  - CodeIgniter 3: raíz = carpeta del proyecto. `location ^~` con `deny all` para `application/`, `system/`, `sql/`, `docs/`, `tests/` y archivos ocultos `/\.`. Extensiones sensibles bloqueadas (`sql|md|log|ini|bak|lock|...`). Desde `vendor/` se sirven estáticos, pero nunca PHP. **Solo `index.php` se ejecuta como PHP.**
  - En "reglas extra" van las del proyecto, como las cabeceras de seguridad o los `deny` propios de Diamantes.
- **Detección automática** al elegir una carpeta: si existe `artisan`, es Laravel y la versión de PHP se toma de `composer.json`, `require.php`. Si existen `application/` y `system/core/CodeIgniter.php`, es CodeIgniter 3.
- Al guardar se genera el vhost, se valida con `nginx -t` (si falla, se revierte y se muestra el error) y Nginx se recarga en caliente.
- **URL base durante un túnel** (opcional por sitio): al abrir el túnel se reescribe esa variable del `.env` con el enlace público, y al cerrarlo se restaura el valor anterior. Antes de cambiar se guarda una copia en `.env.pel-respaldo`. Es lo que hoy hace `wolfcore.ps1` para CodeIgniter.

### Archivo hosts
- Solo se administra un bloque:
  ```
  # >>> Proyectoentornolocal (no editar a mano)
  127.0.0.1  wolfcore-system.test
  ::1        wolfcore-system.test
  # <<< Proyectoentornolocal
  ```
  El resto del archivo nunca se toca.
- Elevación por sistema. **Windows:** el contenido final se escribe en un archivo temporal y se lanza **un solo** PowerShell elevado (`Start-Process -Verb RunAs`, una ventana de UAC) que lo copia, conserva la codificación y ejecuta `ipconfig /flushdns`. **macOS:** `osascript ... with administrator privileges`. **Linux:** `pkexec`.
- Si el usuario cancela la ventana de UAC o falla la escritura, aparece un aviso visible y persistente: "El dominio wolfcore-x.test no está en hosts. [Reintentar con permiso] [Ver instrucciones]". En las instrucciones va el comando para pegar en una terminal de administrador. El sitio queda marcado con ⚠ hasta que el hosts coincida, y el programa lo comprueba leyendo el archivo.
- Los cambios de varios sitios se juntan en una sola petición de permiso.

### Túneles (uno por sitio)
- **Rápido:** `cloudflared tunnel --no-autoupdate --url http://127.0.0.1:<puertoNginx> --http-host-header <dominio> --logfile logs/tuneles/<sitio>.log`. La URL `https://*.trycloudflare.com` se lee de la salida con una expresión regular y un tiempo máximo de 30 s. En la fila del sitio aparece un **interruptor** y, al encenderse, el **enlace con botones para abrir y copiar**. El programa detecta si el túnel muere o caduca ("Tunnel not found") y lo marca. Hay un botón "Renovar". Si el sitio tiene datos reales, se avisa antes de publicar (marca "datos reales" en el sitio).
- **Con nombre** (fase 3): el usuario guarda su ApiToken de Cloudflare, cifrado con `safeStorage` de Electron, y elige su dominio. Por cada sitio, el programa usa la API de Cloudflare para crear el túnel, definir su ingress (`subdominio.dominio → http://127.0.0.1:80` con la cabecera Host del sitio) y crear el CNAME. Después lo corre con `cloudflared tunnel run --token`. La URL es fija. Tiene el mismo interruptor que el rápido.
- Los túneles se pueden reabrir solos al iniciar el programa (opción por sitio, apagada por defecto).

### Bases de datos (fase 2)
- MySQL 8.4: al instalar, `mysqld --initialize-insecure` y luego una clave de root generada y guardada (visible en la interfaz). PostgreSQL 17: `initdb` con superusuario `postgres` y `trust` local.
- Acciones: crear base de datos (y usuario), listar, borrar con confirmación, **restaurar**: `.sql` plano por `mysql` o `psql`, formato custom de `pg_dump` por `pg_restore`, detectado por su encabezado `PGDMP`. Así se cubre el respaldo de Diamantes, que viene en formato custom con extensión `.sql`. Botón "Datos de conexión" con host, puerto, usuario, clave y un bloque `.env` listo para copiar.
- `CREATE EXTENSION vector` disponible si pgvector está instalado.

### Interfaz
Barra lateral: **Inicio** (panel), **Sitios**, **Servicios**, **Bases de datos**, **Túneles**, **Herramientas**, **Ajustes**. Tema oscuro y claro según el sistema, en español, con los textos centralizados en un archivo para traducirlos después.

```
Sitios                                              [+ Nuevo sitio]
┌──────────────────────────────────────────────────────────────────┐
│ ● wolfcore-system.test   Laravel · PHP 8.4   [Abrir] [Carpeta] ⋯ │
│   Túnel ◯ apagado                                               │
│ ● wolfcore-diamantes.test  CI3 · PHP 8.3 ⚠ datos reales         │
│   Túnel ● https://abc-def.trycloudflare.com  [Abrir] [Copiar] ↻ │
└──────────────────────────────────────────────────────────────────┘
Servicios:  Nginx 1.28 ● 80   PHP 8.3 ● 9083-84   PHP 8.4 ● 9084-85 …
```

Cada error se dice en lenguaje claro, con su causa y la acción que lo resuelve. Nunca se muestra solo una traza.

### Contenedores (fase 3)
- Motor detectado automáticamente: Podman (`podman machine` en Windows/macOS, nativo en Linux) o Docker. Se habla con la **API compatible con Docker** (`dockerode`) por el socket o named pipe que reporte `podman machine inspect` / `docker context`, y la CLI queda como respaldo para `compose`.
- Pantalla **Contenedores**: estado de la máquina Podman (iniciar/detener), lista de contenedores (estado, puertos, imagen), iniciar, detener, reiniciar, borrar, ver logs en vivo, abrir terminal (`exec`) y ver imágenes y volúmenes.
- **Proyectos compose:** se registra una carpeta con `compose.yaml` y se levanta o detiene completa con `podman compose` / `docker compose`.
- **Integración con sitios:** un sitio de tipo `proxy` puede apuntar al puerto publicado de un contenedor, con su `.test` y su túnel. Por ejemplo, un contenedor `pgvector/pgvector:pg17` puede servir como PostgreSQL con pgvector, una vía alternativa a la compilación en Windows.
- **Plantillas de servicio por contenedor:** con un clic se crea Redis, PostgreSQL+pgvector, MailPit o Meilisearch como contenedor, con volumen persistente y datos de conexión visibles. Es la alternativa a instalar binarios cuando no hay versión nativa para Windows.

### Servidor MCP (fase 3)
HTTP en `127.0.0.1:<puerto>`, con transporte Streamable HTTP del SDK oficial `@modelcontextprotocol/sdk` y un token Bearer guardado en Ajustes. Herramientas: `listar_sitios`, `crear_sitio`, `editar_sitio`, `estado_servicios`, `iniciar_servicio`, `detener_servicio`, `abrir_tunel`, `cerrar_tunel`, `crear_bd`, `restaurar_bd`, `datos_conexion`. Opcionalmente las acciones de escritura piden confirmación en la ventana, con una casilla para recordar la decisión por sesión. Un botón copia la configuración lista para Claude Code.

### Calidad
- TypeScript estricto, ESLint y Prettier.
- Vitest para el núcleo: generador Nginx (contenido exacto por plantilla), bloque de hosts (insertar, actualizar, quitar y conservar el resto), lectura de URL de cloudflared, detección del tipo de proyecto, catálogo y verificación de hash, y máquina de estados del supervisor (con procesos falsos).
- Pruebas de integración en Windows marcadas aparte (`npm run test:win`): descargan Nginx y PHP reales en una carpeta temporal, levantan un sitio y le hacen una petición.
- GitHub Actions: lint y pruebas en Windows, macOS y Linux. Empaquetado con electron-builder (NSIS en Windows) en las etiquetas `v*`.
- Commits pequeños en español, siguiendo el formato `tipo: descripción`.

## 5. Fases

**Fase 0 — Base:** repositorio, estructura (monorepo npm workspaces: `packages/core`, `apps/desktop`), lint, pruebas, CI y este documento.

**Fase 1 — MVP (Windows):**
1. Catálogo e instalador para Nginx, PHP (8.3 y 8.4) y cloudflared.
2. Supervisor de procesos: encender, apagar y estado real de Nginx y de los grupos de PHP.
3. Sitios ilimitados: Laravel, CodeIgniter 3 y estático, con detección automática, generación de vhost, `nginx -t` y recarga.
4. Hosts con bloque propio, elevación UAC y aviso cuando falta permiso.
5. Túnel rápido por sitio con interruptor, enlace, abrir y copiar, y URL base opcional en `.env`.
6. Interfaz: Inicio, Sitios, Servicios y Túneles; bandeja del sistema; refresco por eventos.
**Hecho cuando:** los 5 proyectos WolfCore responden en su `.test` al mismo tiempo, con las bases de datos de FlyEnv como servicio externo, y cualquiera se publica con un clic. Coffe funciona de punta a punta sin FlyEnv.

**Fase 2 — Datos:** MySQL, PostgreSQL con pgvector, Redis; módulo de bases de datos (crear, restaurar y conexión); Composer por versión de PHP (`composer` usa el PHP del sitio); visor de logs.

**Fase 3 — Integración:** túneles con nombre (API de Cloudflare), servidor MCP, Node y Python (versiones y entorno virtual para el bot), CLI `pel`, importación de sitios desde FlyEnv, HTTPS local con CA propia, **contenedores (Podman/Docker y compose)** y MailPit.

**Fase 5 — Extras:** Ollama y modelos locales, más servicios del catálogo según se necesiten.

**Fase 4 — Multiplataforma:** implementaciones `mac` y `linux` de `Plataforma` (php-fpm, osascript y pkexec, fuentes de binarios por SO), instaladores dmg y AppImage, y pruebas en CI.

## 6. Decisiones que tomé (revisar)
- Electron + Vue 3 + TypeScript + Naive UI. Naive UI y no Element Plus, para no calcar la apariencia de FlyEnv y porque está escrita en TypeScript.
- Binarios desde fuentes oficiales y en su propia carpeta, sin depender de FlyEnv.
- Nombre visible del programa: "Entorno Local". El repositorio y el paquete se llaman `Proyectoentornolocal`.
- Puerto 80 para Nginx. Si FlyEnv lo ocupa, se avisa y no se pelea.
- Repositorio **privado** en GitHub, porque es para uso personal. Se puede volver público cuando quieras.
- Proyecto local en `C:\Proyectos\Proyectoentornolocal`.
- Licencia MIT.

- **Bases de datos en la fase 1 (transición):** mientras llega la fase 2, MySQL y PostgreSQL siguen siendo los de FlyEnv. Se apaga solo el Nginx de FlyEnv para liberar el puerto 80. El panel de Servicios detecta los puertos 3306 y 5432 ocupados y los muestra como **"externo"**: en verde si responden, sin botones de encender o apagar. Coffe usa SQLite, así que funciona completo sin depender de nada.
- **Bot FastAPI:** sí es un sitio. Desde la fase 1 el modelo tiene el tipo `proxy`: `bot.test` → `proxy_pass http://127.0.0.1:<puerto>`, con encabezados para websockets. Así puede tener su túnel para el webhook de WhatsApp. El tipo `proxy` sirve también para Vite o cualquier servidor de Node. En la fase 1, uvicorn lo arranca el usuario. En la fase 3 el sitio gana un "comando de arranque" opcional que el supervisor maneja como un proceso más.
- **Migración desde FlyEnv:** siempre es una instalación limpia más la restauración de un respaldo (`mysqldump`/`pg_dump`), con un asistente guiado en la fase 2. No se reutilizan las carpetas de datos de FlyEnv. La importación de la lista de sitios de FlyEnv (fase 3) es solo lectura.
- **Arranque con Windows:** es una opción apagada por defecto (fase 2). Al arrancar con el sistema, los PIDs guardados se descartan si el proceso no existe o su ejecutable no coincide. Después se encienden los servicios marcados como "encender al iniciar".
- **URL base en Laravel:** igual que `wolfcore.ps1`, solo se reescribe la variable configurada (`APP_BASE_URL` en CI3, `APP_URL` en Laravel), y nada más. En Laravel, si existe `bootstrap/cache/config.php`, se ejecuta `php artisan config:clear` con el PHP del sitio después de escribir y después de restaurar. Laravel necesita confiar en el proxy (`TrustProxies`) para generar URLs `https`. El programa avisa de esto si lo detecta, pero no modifica el código del proyecto.

## 7. Lo que queda a criterio de quien construya
Nombres internos, estructura fina de componentes, estilos visuales dentro de Naive UI, intervalos exactos de sondeo y estrategia de reintentos, siempre que cumplan las reglas de arriba.
