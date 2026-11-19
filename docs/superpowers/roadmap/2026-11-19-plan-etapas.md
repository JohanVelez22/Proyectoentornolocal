# WolfCore Dev — Plan de etapas después de la Etapa B

Fecha: 2026-11-19 · Estado: **aprobado (el usuario delegó el orden, 2026-11-19): C → D → E → F** · Base: rama `feat/etapa-b` (tareas 1-14 hechas, 15 en curso, 16 pendiente)

Insumos: [referentes](2026-11-18-referentes.md) (48 funciones candidatas) · [EnvKit, GitHub y UI](2026-11-18-envkit-github-ui.md) · specs del [MVP](../specs/2026-11-17-proyectoentornolocal-design.md), [Etapa A](../specs/2026-11-18-etapa-a-design.md) y [Etapa B](../specs/2026-11-19-etapa-b-design.md) · README.

Requisitos nuevos que se incorporan: **(a)** proveedores de IA además de Ollama; **(b)** multiplataforma real (Windows, Linux, macOS); **(c)** cubrir los MUST pendientes de los referentes y superarlos.

---

## 1. Matriz de cobertura

**Leyenda.** Referentes: **Sí** = verificado en el doc de referentes · **Sí\*** = del conocimiento, sin verificar (cv) · **Pro** = solo en la versión de pago · **No** = consta que no · **?** = el doc no lo dice (no se inventa) · **n/a** = no es ese tipo de herramienta.
WolfCore Dev: **Tiene** = hecho (MVP, A o B) · **Etapa X** = planificado · **No (motivo)**. El número entre paréntesis es el de la lista de 48 candidatas.

### 1.1 Servidores, PHP y depuración

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Varias versiones de PHP, por sitio (13) | Sí\* | Sí | Sí | Sí | Sí\* | Sí | Sí | n/a | Sí\* | Sí\* | **Tiene** (pool php-cgi por rama); ini por sitio: **Etapa C** |
| Nginx | ? | Sí | ? | Sí | Sí\* | Sí | Sí | n/a | Sí\* | Sí\* | **Tiene** |
| Apache / Caddy alternativos (14) | ? | Sí | ? | Sí | Sí\* | ? | ? | n/a | Sí\* | Sí\* | **Etapa F** |
| FrankenPHP / Octane (12) | ? | ? | ? | Sí | ? | ? | Sí | n/a | ? | ? | **Etapa F** |
| `.test` con HTTPS de CA propia | Sí\* | Sí | Sí | Sí | Sí\* | Sí | Sí | n/a | Sí\* | Pro\* | **Tiene** |
| DNS propio / comodín `*.proyecto.test` (45) | Sí\* | Sí | ? | Sí | ? | Sí | ? | n/a | ? | Pro\* | **Etapa F** |
| CA confiable en Node/Python/Firefox (44) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Etapa C** (hoy Firefox es manual) |
| Xdebug por sitio con interruptor (5) | ? | ? | ? | Sí | ? | Pro | ? | n/a | Sí\* | ? | **Etapa C** |
| Editor de `php.ini` por versión (9) | Sí\* | Sí\* | ? | Sí | Sí\* | ? | ? | n/a | ? | Pro\* | **Etapa C** |
| Gestor de extensiones PHP (10) | Sí\* | Sí\* | ? | Sí | Sí\* | ? | ? | n/a | ? | Sí\* | **Etapa C** |
| Editor Nginx por sitio con `nginx -t` y vuelta atrás (11) | Sí\* | Sí\* | ? | ? | ? | ? | ? | n/a | ? | Pro\* | **Etapa C** (hoy `nginx -t` interno y tipo "personalizado") |
| Captura de `dump()`/`dd()` (3) | ? | ? | Sí | Sí | ? | Pro | ? | n/a | ? | ? | **Etapa C** (+ Python y CI3) |
| Visor de errores PHP (7) | ? | ? | Sí | Sí | ? | ? | ? | n/a | ? | ? | **Etapa C** |
| Visor de registros unificado (2) | Sí | ? | Sí | Sí | ? | Pro | ? | n/a | Sí\* | ? | **Tiene** (B) |
| Panel de recursos por servicio (1) | Sí (global) | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Tiene** (B, por servicio y proceso) |
| Inspector de SQL, jobs y HTTP (4) | ? | ? | ? | Sí | ? | Pro\* | ? | n/a | ? | ? | **Etapa F** |
| Perfilado (6) | ? | ? | ? | ? | ? | Pro\* | ? | n/a | ? | ? | **Etapa F** |

### 1.2 Proyectos

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Clonar desde GitHub (lista de repos) + receta completa | ? | No | ? | No (solo URL) | No\* | No | No | n/a | No | ? | **Tiene** (B) — ninguno lo ofrece entero |
| Config por proyecto versionable (16) | ? | ? | ? | Sí (`envkit.json`) | ? | Sí\* (`.herd.yml`) | ? | n/a | ? | ? | **Tiene** (`wolfcore.yml`) |
| `park` / vigilar carpeta (20) | ? | ? | ? | Sí | ? | Sí\* | Sí | n/a | ? | ? | **Tiene** (B) |
| Node / Python por proyecto | Sí\* | Sí | ? | Sí | Sí\* | Sí (Node) | Sí (Node) | n/a | ? | ? | **Tiene** (B) |
| Procesos supervisados: queue, scheduler, uvicorn (29, 30) | ? | ? | ? | Sí | Sí\* | ? | ? | n/a | ? | ? | **Tiene** (B); cron editable: **Etapa D** |
| Nuevo proyecto con un clic / starter kits (17) | Sí\* | Sí\* | ? | Sí | Sí\* | Pro\* | ? | n/a | Sí\* (WP) | ? | **Etapa D** |
| Plantillas / blueprints (18) | Sí\* | ? | ? | Sí | ? | ? | ? | n/a | Sí\* | ? | **Etapa D** |
| Importar desde Laragon/XAMPP/Herd (19) | ? | ? | ? | Sí (Laragon) | n/a | ? | ? | n/a | ? | ? | **Etapa D** |
| Gestor `.env` con secretos enmascarados (15) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Etapa D** (hoy bloque `.env` de conexión) |
| Rama como subdominio (`git worktree`) | ? | ? | ? | Sí | ? | ? | ? | n/a | ? | ? | **Etapa F** |
| WordPress completo (21) | ? | ? | ? | Sí | Sí\* | ? | ? | n/a | Sí\* | ? | **Etapa F** |
| Pruebas y calidad por sitio (43) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Etapa F** |

### 1.3 Datos y servicios

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MySQL/MariaDB/PostgreSQL/Redis/MongoDB | Sí\* | Sí | ? | Sí | Sí\* (parcial) | Pro | Sí | Sí\* (sin Mongo) | Sí\* (MySQL) | Sí\* (MySQL) | **Tiene** |
| pgvector listo para usar | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | **Tiene** |
| Pantalla de BD, respaldo/restauración, Adminer | Sí\* | ? | ? | Sí | ? | ? | ? | Sí\* | Sí\* | ? | **Tiene** |
| Mailpit / correo local | ? | Sí | Sí | Sí | Sí\* | Pro | ? | n/a | Sí\* | Pro\* | **Tiene** |
| FTP por sitio | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Tiene** (diferenciador) |
| Respaldo y perfiles del entorno completo (23) | Sí\* | ? | ? | ? | ? | ? | ? | Sí\* (instancias) | Sí\* (ZIP) | Pro\* | **Etapa D** |
| Workspaces de arranque (24) | ? | ? | ? | ? | Sí\* | ? | ? | n/a | ? | ? | **Etapa D** |
| Snapshots de BD con un clic (26) | ? | ? | ? | ? | ? | ? | ? | Sí\* | ? | ? | **Etapa D** |
| Instancias paralelas de un servicio (25) | Sí\* | ? | ? | ? | ? | ? | ? | Sí\* | ? | ? | **Etapa C** (adelantado de F a pedido del usuario) |
| Meilisearch, MinIO, RabbitMQ, Reverb… (28) | Sí\* | Sí | ? | Sí | ? | Pro | ? | n/a | ? | ? | **Etapa F** |
| Contenedores Podman/Docker (46) | ? | No | No | ? | ? | ? | Sí | n/a | ? | ? | **Etapa F** |

### 1.4 Compartir y red

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Túnel rápido por sitio | Sí\* | ? | ? | Sí | Sí\* | Sí (Expose) | ? | n/a | Sí\* | Pro\* | **Tiene** (Cloudflare rápido, `.env` restaurado) |
| Túneles Cloudflare con nombre | Sí\* | ? | ? | ? | Sí\* | ? | ? | n/a | ? | ? | **Etapa D** |
| Túneles alternativos: ngrok, Expose, Tailscale (31) | ? | ? | ? | ? | Sí\* | Sí | ? | n/a | ? | ? | **Etapa D** |
| Acceso LAN con QR (32) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | Pro\* | **Etapa D** |
| Inspector de webhooks (33) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Etapa F** |
| Forge / despliegue (35) | ? | ? | ? | ? | ? | Sí | ? | n/a | Sí\* | ? | **No** (depende de cuentas de terceros; se reevalúa tras F) |

### 1.5 IA y agentes

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| IA local (Ollama) integrada | ? | Sí\* ("AI") | ? | ? | ? | ? | ? | n/a | ? | ? | **Tiene** |
| Proveedores en la nube (Gemini, OpenAI, Claude, compatibles) | ? | ? | ? | ? | ? | ? | ? | n/a | ? | ? | **Etapa C** |
| Servidor MCP local (39) | ? | ? | Sí | Sí | ? | ? | Sí | n/a | ? | ? | **Tiene** (B); herramientas de dumps/errores: **Etapa C** |
| Registrar clientes y lanzar agentes (Claude Code, Codex, Hermes) | ? | ? | ? | Sí (registra clientes MCP) | ? | ? | ? | n/a | ? | ? | **Etapa C** |
| Mensaje de commit sugerido por IA | ? | ? | ? | Sí | ? | ? | ? | n/a | ? | ? | **Etapa C** |

### 1.6 Experiencia, mantenimiento y plataformas

| Función | ServBay | FlyEnv | Flock | EnvKit | Laragon | Herd | Lerd | DBngin | Local | MAMP | **WolfCore Dev** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Tema, idiomas, Ctrl+K, asistente de primer uso (40) | ? | ? | ? | Sí (sin Ctrl+K) | ? | ? | ? | ? | ? | ? | **Etapa B** (tarea 15, en curso) |
| App de bandeja | ? | ? | Sí | Sí | ? | ? | ? | ? | ? | ? | **Tiene** |
| Notificaciones nativas (8) | Sí\* | ? | ? | Sí (toasts) | ? | Sí\* | ? | ? | ? | ? | **Etapa C** |
| Doctor con reparaciones (36) | ? | ? | Sí (puertos) | Sí | Sí\* | Sí\* | ? | ? | ? | ? | **Etapa C** (hoy aviso de puerto con PID) |
| Gestor de versiones con descarga y SHA (37) | Sí\* | Sí\* | ? | Sí | ? | Sí | ? | Sí\* | ? | ? | **Tiene** (catálogo con SHA-256); catálogo en vivo de todos los servicios con huella oficial y cualquier versión por rama: **Etapa C** (adelantado); limpieza de versiones: **Etapa D** |
| CLI `wolf` (38) | ? | ? | ? | ? | ? | Sí\* | Sí | ? | ? | ? | **Etapa D** |
| Autoactualización | ? | ? | ? | Sí | ? | ? | ? | ? | ? | ? | **Etapa E** |
| Desinstalación limpia (hosts, CA, PATH) (41) | ? | ? | ? | Sí (transparencia) | ? | ? | ? | ? | ? | ? | **Etapa E**; modo portable: **Etapa F** |
| Ahorro de recursos / arranque perezoso (42) | Sí\* | ? | ? | Sí (Lite, dormir sitio) | Sí\* | ? | ? | ? | ? | ? | **Etapa F** |
| Sincronizar entre equipos (47) | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | **Etapa F** |
| Windows | Sí\* | Sí | Sí | Sí | Sí | Sí | WSL2 beta | Beta\* | Sí\* | Sí\* | **Tiene** |
| macOS | Sí\* | Sí | Sí (15+, ARM) | Sí (12+, ARM) | No | Sí | Sí | Sí\* | Sí\* | Sí\* | **Etapa E** (`.dmg` sin firmar) |
| Linux | Sí\* | Sí | No | Sí (0.34) | No | No | Sí | No\* | Sí\* | No\* | **Etapa E** (AppImage y `.deb`) |
| Gratis y completo | Community/Pro | Límite ~3 sitios | Sí (AGPL) | Sí (beta) | Gratis/Pro | Gratis/Pro | Sí (OSS) | Sí\* | Sí\* | Gratis/PRO | **Sí**, sin telemetría |

---

## 2. Plan de etapas

**Cambio propuesto respecto al boceto original.** El boceto de C juntaba IA, agentes, depuración PHP, túneles, contenedores, DNS y multiplataforma: no cabe en 16 tareas. Se propone partirlo en **cuatro etapas de ~16 tareas** (como las existentes) en este orden: primero lo que el usuario nota cada día en Windows con sus 6 proyectos (C y D), después llevarlo a tres sistemas (E) y al final el resto de paridad (F).

Para no pagar dos veces la multiplataforma, **la tarea 1 de C crea la capa `Plataforma`** (hosts, elevación, lanzar oculto, rutas de datos, confiar CA, catálogo por SO). Todo lo nuevo de C y D pasa por ella; en Windows se implementa ya, y E solo agrega las versiones Linux y macOS.

**Alternativa:** si macOS/Linux urge más que los MUST de proyectos, se intercambian D y E. Costo: las funciones de D nacerían en tres sistemas y cada tarea crecería ~30 %.

### Etapa C — IA en la nube, agentes y depuración PHP (~20 tareas)

**Meta:** depurar cualquier proyecto PHP sin salir de WolfCore Dev y usar cualquier IA (local o nube) en los proyectos y desde agentes.

- **Capa `Plataforma`** (interfaz + implementación Windows) y migración del código existente a ella.
- **Proveedores de IA:** Ollama (ya), Hermes (Nous Research, API compatible con OpenAI; confirmar cuál usa el usuario), Google Gemini, OpenAI, Anthropic Claude y compatibles con OpenAI con URL base editable (OpenRouter, Groq, Mistral, DeepSeek, LM Studio).
  - Claves cifradas con `safeStorage` en main, igual que el token de GitHub. Nunca en `config.json`, en logs, en la URL ni en eventos al renderer (solo "configurada sí/no" y los 4 últimos caracteres).
  - **Probar conexión** por proveedor: listar modelos (no gasta tokens) y mostrar latencia y error concreto (clave inválida, sin saldo, región).
  - **Bloque `.env` de IA por proyecto** para cualquier proveedor (`OPENAI_API_KEY`/`OPENAI_BASE_URL`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_HOST`…). Escribirlo pide confirmación, avisa de que el `.env` queda en texto plano en el proyecto y comprueba que `.env` esté en `.gitignore`.
- **Módulo de agentes:** detectar o instalar Claude Code, Codex CLI y Hermes Agent; registrar el MCP de WolfCore Dev en sus configuraciones; abrir el agente en la carpeta del proyecto con la clave inyectada solo en ese proceso. Mensaje de commit sugerido por IA en el panel Git.
- **PHP:** Xdebug por sitio (modo, puerto, `launch.json` para VS Code/PhpStorm), editor de `php.ini` por versión con diff y valores rápidos, gestor de extensiones (activar/desactivar; DLL TS/NTS en Windows), ini por sitio (aislamiento).
- **Nginx:** editor de vhost por sitio con `nginx -t`, snippets y vuelta atrás automática si falla.
- **Captura de `dump()`/`dd()`** (VarDumper en modo servidor + `auto_prepend_file`), con equivalentes para CI3 y Python; visor de errores sobre el visor de registros; herramientas MCP nuevas para dumps y errores.
- **Notificaciones nativas** y centro de eventos (servicio caído, puerto ocupado, certificado por vencer, túnel caído).
- **Doctor:** puertos (IIS, FlyEnv, Hyper-V/WSL reservando rangos), CA vencida, hosts dañado, PATH duplicado, VC++ ausente, antivirus; cada hallazgo con su reparación guiada. Confianza de la CA en Node, Python y Firefox (44).
- **Catálogo en vivo** (adelantado a pedido del usuario): todos los servicios consultan su fuente oficial de versiones, como PHP con `releases.json`; cualquier versión publicada con filtro por rama; huella oficial verificada y, si la fuente no la publica, advertencia y confirmación; avisos de versiones nuevas con "Actualizar" (respaldo antes y sin borrar los datos de la versión anterior); la lista fija queda como respaldo sin conexión.
- **Instancias paralelas de un servicio (25)** (adelantado de la Etapa F): varias versiones del mismo servicio de datos a la vez, cada una con su puerto, carpeta de datos y credenciales; la pantalla Bases de datos elige la instancia; pestaña "Versiones" por servicio como FlyEnv/ServBay.

**Verificable aquí (Windows):** todo. Las pruebas de proveedores en la nube usan servidores falsos en las pruebas automáticas; la prueba real con cada proveedor necesita las claves del usuario y la hace él (o con su permiso).

### Etapa D — Proyectos, compartir y respaldo del entorno (~16 tareas)

**Meta:** empezar, traer, compartir y mover proyectos en pocos clics, también desde la terminal.

- **Nuevo proyecto con un clic:** Laravel (starter kits), CodeIgniter 3/4, FastAPI (+pgvector), WordPress básico, Symfony, estático. Crea sitio, base, `.env`, HTTPS y abre el editor. Reutiliza el motor de recetas de B.
- **Plantillas:** guardar un proyecto como plantilla (receta, extensiones, esquema de BD) y crear otros a partir de ella.
- **Importar** desde Laragon, XAMPP y Herd: carpetas `www`, vhosts y bases.
- **Gestor `.env`** con secretos enmascarados, diff contra `.env.example` y plantillas.
- **CLI `wolf`:** `link`, `park`, `use php@8.4`, `secure`, `share`, `open`, `logs`, `status`, `doctor`, hablando con la app por IPC local con token.
- **Túneles:** Cloudflare con nombre (dominio propio), ngrok, Expose y Tailscale Serve/Funnel; proveedor por sitio; misma garantía de restaurar el `.env`.
- **Acceso LAN con QR:** IP local, QR con la URL e instalación de la CA en el móvil; aviso claro de que expone el sitio a la red.
- **Respaldo y perfiles del entorno:** exportar e importar sitios, versiones, certificados, configuración y, si se quiere, bases; snapshot automático antes de actualizar versiones. Snapshots de BD con un clic.
- **Workspaces de arranque** ("Bot FastAPI": Postgres + Redis + Ollama) y cron editable por sitio; limpieza de versiones sin uso.
- **Cierre de etapa:** aceptación con los 6 proyectos del usuario y una prueba de "PC nuevo" (perfil exportado e importado en una carpeta de datos limpia).

**Verificable aquí:** todo menos túneles con cuentas reales (Cloudflare con nombre, ngrok y Tailscale necesitan cuenta del usuario; se prueban con su permiso) y la LAN desde un móvil real (la hace el usuario).

### Etapa E — Multiplataforma, instaladores y CI (~16 tareas)

**Meta:** el mismo WolfCore Dev en Windows, Linux y macOS, con instaladores generados en CI.

- **Capa `Plataforma` para Linux y macOS:**
  - **Hosts y elevación:** UAC (Windows), `pkexec` con caída a `sudo` en terminal (Linux), `osascript … with administrator privileges` (macOS).
  - **Confianza de la CA:** almacén de usuario (Windows); `update-ca-certificates`/`trust` y NSS (Linux); llavero (macOS).
  - **Puertos 80/443:** en Linux, `setcap cap_net_bind_service` o puertos altos con aviso; en macOS se pueden usar sin root.
  - **Procesos:** lanzar en segundo plano sin consola y cerrar al apagar el equipo (señales en lugar del lanzador oculto).
- **Catálogo de binarios por SO** (sistema, arquitectura x64/arm64 y hash; las fuentes en vivo de la Etapa C ya reciben el `idCatalogo`, E agrega los archivos de cada SO):
  - MySQL, MariaDB, Ollama, Node, Mailpit y cloudflared publican binarios oficiales.
  - PHP y Nginx no los publican para macOS/Linux: se usan compilaciones estáticas de terceros (static-php-cli) verificadas por hash, o paquetes del sistema como alternativa.
  - pgvector se compila con `make`.
- **Instaladores:** NSIS (ya), AppImage y `.deb` (Linux), `.dmg` x64 y arm64 (macOS). Autoactualización con `electron-updater` desde GitHub Releases. Desinstalación limpia (revierte hosts, CA y PATH) en los tres.
- **`safeStorage` en Linux:** si no hay llavero (libsecret/kwallet), Electron guarda en texto casi plano; se detecta y se ofrece no guardar la clave o pedirla en cada sesión.
- **CI:** el `ci.yml` actual ya corre lint, tipos y pruebas en los tres SO; se agrega un flujo de *release* que construye los tres instaladores y una prueba de humo por SO (instalar Nginx + PHP, sitio, `fetch` 200; escribir hosts con el `sudo` sin clave de los runners).

**Verificable aquí:** Windows completo. **Linux:** núcleo y pruebas de integración en WSL2 (Ubuntu), y la app con WSLg. Pero WSL no es una distro de escritorio real (sin agente polkit, systemd y red distintos), así que `pkexec` y el llavero no quedan probados. **macOS: solo en CI.** No hay Mac disponible, así que la interfaz, el llavero y el diálogo de `osascript` nunca se ven en una máquina real; el `.dmg` se entrega **sin firmar ni notarizar** y Gatekeeper lo bloquea la primera vez (clic derecho → Abrir o `xattr -d com.apple.quarantine`).

### Etapa F — Resto de paridad y superación (~16 tareas, se puede partir)

DNS propio y comodín `*.proyecto.test` (45); Apache/Caddy y `.htaccess` real (14); FrankenPHP/Octane (12); contenedores Podman/Docker (46); Meilisearch, MinIO, RabbitMQ y Reverb (28); inspector de SQL, jobs y HTTP (4); perfilado (6); inspector de webhooks (33); rama como subdominio con `git worktree`; WordPress completo (21); pruebas y calidad por sitio (43); ahorro de recursos y arranque perezoso (42); modo portable (41); sincronizar entre equipos (47); RAG local por proyecto con pgvector (48); restos técnicos: restauración con rol limitado, FTP pasivo por subred, FTPS/SFTP, *name constraints* en la CA.

**Verificable aquí:** casi todo en Windows; los contenedores necesitan Docker Desktop o Podman instalados (con permiso del usuario).

---

## 3. Notas honestas

- **Firma de código:** sin certificado, Windows muestra SmartScreen (ya pasa hoy) y macOS bloquea con Gatekeeper. Firmar cuesta dinero cada año: certificado OV/EV en Windows y Apple Developer en macOS (~99 USD/año). Además, la notarización exige firma. Queda **fuera** mientras el usuario no compre los certificados. En macOS, la autoactualización sin firma es frágil y puede requerir reinstalar a mano.
- **macOS sin probar en máquina real:** CI comprueba que compila, que las pruebas pasan y que un sitio responde; no comprueba la experiencia. Hasta que alguien lo pruebe en un Mac, se publica como "experimental".
- **Variedad de Linux:** se apunta a Ubuntu/Debian (`.deb`) y a cualquier distro con AppImage (necesita FUSE en algunas). Fedora/Arch (`.rpm`, AUR), Wayland frente a X11 y distros sin systemd o polkit quedan como "mejor esfuerzo". SELinux/AppArmor pueden bloquear que Nginx lea carpetas de `/home`.
- **Binarios de terceros:** PHP y Nginx en macOS/Linux dependen de compilaciones no oficiales (o de Homebrew/apt). Es el mayor riesgo técnico de E: si falla, se usa el paquete del sistema y WolfCore Dev solo lo gestiona.
- **Costos de IA en la nube:** cada llamada la paga el usuario con su clave. La prueba de conexión no gasta tokens. Los agentes (Claude Code, Codex) pueden gastar mucho en poco tiempo: se muestra el aviso y nunca se lanzan solos. WolfCore Dev no hace de intermediario ni guarda historiales en la nube.
- **Claves en `.env`:** el bloque de IA por proyecto pone la clave en texto plano dentro del proyecto. Es inevitable si el código la lee de `.env`; por eso se confirma y se revisa `.gitignore`.
- **Hermes:** se asume Nous Research (modelos Hermes y Hermes Agent). Hay que confirmarlo con el usuario antes de la tarea.
- **Fuera por ahora:** Forge y despliegue a servidores, sincronizar en la nube de terceros, tienda de plugins.
- **Fiabilidad de la matriz:** las celdas con \* vienen del conocimiento sin verificar y los "?" solo dicen que el doc de referentes no lo menciona. Antes de usarla como argumento comercial, hay que verificarlas.

## 4. Pedidos del 2026-11-19 (pendientes de ubicar en las tareas al retomar)

Ubicación propuesta; se confirma y se convierte en tareas al retomar la Etapa C.

| Pedido | Etapa |
|---|---|
| "Terminal aquí" no abre en la app instalada (fallo real) | QA, primero al retomar |
| Revisión de diseño de la interfaz (alineación, espaciados, coherencia) con un agente especializado al cierre de cada etapa; auditoría grande | Cierre de cada etapa; grande en D |
| Presets de IA: OpenRouter, Groq, Kilo, OmniRouter, LM Studio y modelos gratuitos de FreeLLMAPI | C |
| Agente Opencode junto a Claude Code, Codex y Hermes | C |
| Avisar cuando un proceso de proyecto termina (éxito o fallo), no solo cuando cae | C |
| Idiomas: portugués y francés, sistema listo para más | C |
| Java, .NET, Go y Rust en el catálogo, instalables por versión | C (con el catálogo en vivo) o D si no cabe |
| Apache y Caddy: evaluar adelantarlos de F | Evaluar en C/D |
| Optimizador de RAM en la barra superior (Liviano / Moderado / Profunda): lista antes de actuar, nunca procesos del sistema ni de WolfCore sin confirmar | D |
| Limpieza de disco (%TEMP%, cachés de navegadores; Prefetch opcional, apagado por defecto y con aviso): vista previa, tamaño y confirmación, solo rutas seguras conocidas | D |
| Elegir editor (VS Code, Cursor, PhpStorm, Sublime, Windsurf…) y fijar uno predeterminado | D |
| Botón por proyecto a Adminer y phpMyAdmin (u otra) con la base del proyecto ya autenticada | D |
| Tareas programadas por sitio; túneles ngrok/Expose/Tailscale (ya estaban) | D |
| Herramientas: QR de WiFi; imagen → .ico/.png; buscar texto en carpeta/archivo; comprimir PDF/imágenes/zip con peso antes y después | D |
| Auditoría de contraseñas (decidido): (1) medidor de fortaleza para una contraseña escrita, en local; (2) revisar los hashes de usuarios de una base montada contra una lista corta de contraseñas muy comunes y marcar las cuentas débiles **sin mostrar la contraseña**; (3) para una contraseña olvidada de la propia base, ofrecer **restablecerla** (nueva contraseña, con confirmación y copia previa) en vez de recuperarla. Sin fuerza bruta ni listas grandes; el límite se explica en la interfaz | D |
| Tarjeta del proyecto: "Terminal aquí" pasa a "Terminal"; acciones como íconos con tooltip (claro y oscuro); botón de base de datos (Adminer y phpMyAdmin con la base del proyecto) | QA, al retomar, junto al fallo de "Terminal" |
| Terminal configurable: detectar PowerShell, Windows Terminal, cmd, Git Bash, pwsh (y la del sistema en Linux/macOS) y elegir o fijar una predeterminada | QA, al retomar |
| Conversor de documentos local (docx, xlsx, pptx, pdf, csv, md, odt) con librerías de licencia permisiva; herramientas pesadas como LibreOffice solo opcionales y con aviso; nada sale del equipo | D |
| Visor de esquema/diagrama de la base (tablas, relaciones, PK/FK) | F |
| Repaso analítico de ServBay, FlyEnv, Flock, EnvKit, Laragon, Herd, Lerd, DBngin, Local y MAMP; actualizar la matriz | Tarea de bajo costo al retomar |
