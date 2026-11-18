# EnvKit, "clonar de GitHub y montar" y pulido de interfaz

Fecha: 2026-11-18. Complementa `2026-11-18-referentes.md` (no repite su tabla de funciones).

Fiabilidad. Verificado en web/`gh`: README, releases (v0.33.0-beta.73 "clásico" y v0.34.0-beta.x "nuevo EnvKit"), envkit.net, envkit.net/docs, FlyEnv (README), ServBay (precios). Lo marcado (cv) viene del conocimiento, sin verificar. Los sitios de docs de otras herramientas no se pudieron leer a fondo.

---

## 1. EnvKit en detalle

### 1.1 Identidad
- Repo `Env-Kit/envkit-releases`: solo instaladores, docs y capturas. **Código privado, "free to use, not open source, all rights reserved"**. No hay código reutilizable; solo se estudian funciones y patrones.
- Gratis, sin cuenta, sin límite de sitios, beta pública. Equipo de 3 personas. Se financia con Ko-fi (meta: certificado de firma de código; la 0.34.0-beta.9 ya instala firmada con Certum).
- Windows 10/11 x64 y macOS 12+ Apple Silicon; la 0.34 añade Linux (.deb/.rpm/AppImage). Instalador ~100 MB; instalación por `irm ... | iex` en PowerShell, `curl | bash` en Mac y Homebrew cask.
- Dos líneas de producto: "EnvKit clásico" (0.33.x, final en beta.73) y "nuevo EnvKit" (0.34.x, motor reescrito, artefacto `latest-rust.json` sugiere motor en Rust). Migración con "Try the new EnvKit" y vuelta atrás con "Switch back to classic EnvKit" conservando datos. Patrón a imitar: **migración reversible con los mismos datos**.
- Ritmo: ~70 betas en 2 meses (casi diarias), autoactualización silenciosa con descargas diferenciales y notas antes de instalar.

### 1.2 Funciones (agrupadas)
**Sitios y dominios**
- `.test` automáticos con HTTPS de CA local; TLD configurable; DNS comodín para subdominios (Settings → Local DNS).
- Tipos: Laravel, WordPress, Bedrock, CodeIgniter, PHP simple, y dev servers Node/React/Next/Vite/Angular tras proxy HTTPS con hot reload y vista de la salida del dev server; proxy inverso a un puerto local.
- Alta de sitio: enlazar carpeta existente, **clonar de Git**, menú "Nuevo proyecto" (Laravel, WordPress, CodeIgniter, Bedrock, Node, PHP vacío, **desde un blueprint guardado**, proxy a puerto). Registro automático de carpetas nuevas dentro de la carpeta de proyectos.
- Grupos de sitios, favoritos (estrella), filtro por tecnología, búsqueda, apagar o "dormir" un sitio.
- Compartir público con un clic: `https://<nombre>.envkit.net` con botón Stop.
- Live reload (incluye otras pestañas tras guardar en admin de WP o formulario Laravel).
- "Branch as subdomain": sirve una rama como sitio propio con `git worktree` (con opciones de base de datos). Idea muy buena para revisar PRs.
- Ficha de sitio con menú lateral propio: Overview (carpeta servida, cambiar docroot), Run, Develop, Settings.

**PHP, servidores, runtimes**
- Varias versiones PHP (7.4 a 8.5) lado a lado, por sitio, Xdebug solo bajo demanda; defaults para PHP 8.5 nuevo.
- nginx, Apache, Caddy o FrankenPHP conmutables.
- Node con nvm (`.nvmrc`), npm/pnpm/yarn/bun; Python, Go, Deno, Rust a un clic. "Versiones personalizadas" escribiendo el número.
- **`envkit.json`** versionable (extensiones PHP y valores php.ini requeridos) + `envkit.local.json` por desarrollador (equivale a mi propuesta `wolfcore.yml`).

**Datos y servicios**
- MySQL/MariaDB, PostgreSQL, Redis, MongoDB, Memcached, Meilisearch, MinIO, Mailpit; phpMyAdmin, Adminer, pgAdmin/pgweb, mongo-express.
- Copias y restauración por sitio; importaciones grandes sin "Lost connection"; **diagrama ER** (MySQL/PG) local y abrible en navegador; protección: nunca reinicializa un datadir con bases; si hay dos carpetas con datos pregunta cuál usar.
- Mover la carpeta de datos con reversión si falla un paso.

**Depuración y herramientas**
- Dashboard con aviso de puertos en uso (nombra el proceso y botón Detener), diagnóstico y autorreparación (puertos, PID obsoletos, configs rotas; si un puerto está ocupado, usa uno libre).
- Dumps (`dump()`/`dd()`), logs de todo, pestaña Debug: N+1 y queries lentas, mail, vistas, eventos, jobs, HTTP saliente, por sitio y por rama (Laravel y Symfony).
- Cron con plantillas (Laravel, Node, NestJS), Reverb, queue workers y scheduler.
- Pestaña Git por sitio: rama, fetch/pull/push, commit con **mensaje sugerido por IA**, commits recientes. Git y `gh` incluidos.
- PATH limpio: pone php/composer/node/mysql y retira Laragon/XAMPP/WAMP/MAMP/Herd.
- MCP propio (Settings → AI → "Set up AI clients"): registra Claude Code/Desktop, Cursor, Windsurf, VS Code, Zed, OpenCode, Gemini CLI, PhpStorm. Solo 127.0.0.1, token bearer, apagado por defecto.
- Transparencia: README lista todo lo que cambia en el sistema (exclusiones de Defender, CA, hosts, PATH; sin servicios de Windows ni reglas de firewall).

### 1.3 UI/UX
- **Navegación**: barra lateral con Dashboard, Sites, Services, Databases, Tools, Debug, Logs, Dumps, Mailpit, Automation (Cron), AI, Settings. App de bandeja (tray) con mini ventana; doble clic abre la principal.
- **Dashboard**: salud del stack, "Start all / Stop all", lista de sitios con versión PHP/Node, tabla de servicios con estado y puertos, aviso de puertos ocupados.
- **Tarjetas de sitio**: framework, versión PHP, carpeta, uso de recursos, botón "Start dev".
- **Tema**: Claro/Oscuro/Sistema (nuevo en la última 0.33), selector en la barra de título; ventana "glass" y **Lite mode** (Settings → Performance: reducir efectos, memoria, sugerencias de sueño) que desactiva animaciones.
- **i18n**: 6 idiomas (English, العربية, Deutsch, فارسی, Español, Bahasa Indonesia) con RTL; selector de idioma en la barra de título; docs sobre cómo traducir la app.
- **Onboarding**: asistente de primer arranque con dos caminos ("Cargar desde Laragon" / XAMPP, o "Empezar de cero" eligiendo stack) que termina con un sitio funcionando abierto en el navegador por HTTPS; si algo lo bloquea, el asistente dice qué es y ofrece el arreglo.
- Toasts que se cierran solos, diálogo de actualización con error + Reintentar, mensajes de error muy concretos (p. ej. PostgreSQL pide contraseña: explica que hay otro PG en el mismo puerto o cambió `pg_hba.conf`).
- Settings en secciones: General, Paths, Startup, Performance, Local DNS, Services, Ports, Web server, HTTPS, Environment, AI, Updates.

### 1.4 GitHub en EnvKit (verificado)
No hay integración OAuth ni lista de repos. Solo "Clonar de Git" (URL) y la pestaña Git; `gh` va incluido para que el usuario se autentique por su cuenta. Es decir: **WolfCore puede superar a EnvKit** aquí (ver sección 2). Los pasos tras clonar (composer install, .env, key:generate) no están documentados; el clonado de blueprints cubre parte.

### 1.5 Qué le falta a WolfCore Dev frente a EnvKit
Contrastado con el repo (vistas: Inicio, Sitios, Servicios, BasesDeDatos, Correo, IaLocal, Tuneles, Ajustes; tema ya sigue el SO vía `useOsTheme`, un único `i18n/es.ts`):
1. Asistente de primer arranque con importación (Laragon/XAMPP) y "sitio funcionando al final".
2. "Nuevo proyecto" con plantillas + **clonar de Git** + blueprints + auto-registro de carpeta de proyectos.
3. Pestaña Git por sitio (rama, pull/push, commit) y "rama como subdominio" con worktree.
4. Dumps, logs unificados, panel Debug, cron/queue/Reverb.
5. Diagnóstico con autorreparación de puertos y botón "Detener proceso".
6. Selector de tema manual (Sistema/Claro/Oscuro) y de idioma; Lite mode.
7. `envkit.json`-equivalente versionable; extensiones/php.ini por sitio.
8. Compartir con un clic (ya hay túneles; falta botón por sitio y Stop).
9. Diagrama ER; ficha de sitio con submenú (Overview/Run/Develop/Settings).
10. Transparencia de "qué cambia en mi sistema" en README/Ajustes.
Ventajas actuales de WolfCore: pgvector, Ollama, FTP, panel MySQL propio, CA propia, español nativo, sin telemetría.

---

## 2. "Clonar de GitHub y montar como sitio"

### 2.1 Cómo lo hacen otros
| Herramienta | Flujo real |
|---|---|
| Laravel Herd | **No tiene** "desde URL de GitHub". Doc oficial: `git clone` y luego Site Wizard → "Link existing project" (o `herd link`); instalación y `.env` a mano según el README del repo. Herd Pro solo añade starter kits al crear (verificado por búsqueda). |
| Local WP | Sin clonado nativo; patrón de la comunidad: crear sitio, vaciar `public`, `git clone`, composer, importar BD a mano. Integración con GitHub por docs (necesita git local). Import por ZIP/WP Migrate. |
| WordPress Studio | Importa ZIP/backups y sincroniza con WordPress.com/Pressable; sin clon Git genérico (cv). |
| ServBay | Plantillas de proyecto (Laravel, WP…) y creación de sitio; clonado Git no documentado en lo leído (cv). Gratis limitado a 5 sitios; Pro 59 USD/año (verificado). |
| FlyEnv | Crea proyectos y los vincula; no hay clon desde GitHub en su README (verificado: solo cita sus propios pasos de desarrollo). |
| Laragon | "Quick app" crea Laravel/WP/etc. con composer; clonar es manual (cv). |
| Lerd | `lerd link` / `park` sobre una carpeta ya clonada (verificado). |
| EnvKit | "Clone from Git" por URL en Sitios (verificado), sin lista de repos ni pasos de setup documentados; blueprints y `envkit.json`. |
| DDEV / Lando (ref.) | `ddev config` (autodetecta tipo de proyecto, PHP, docroot) + `ddev composer install` + `ddev import-db`; Lando con `.lando.yml` y "recipes" (cv). Sirven de modelo para el "recipe". |

Conclusión: **ninguna herramienta ofrece el ciclo completo** "login GitHub, lista de mis repos privados, clonar, instalar, crear BD, montar .test, abrir". Es un diferenciador real para el usuario.

### 2.2 Flujo recomendado para este usuario
1. **Autenticación** (elegir una, en este orden):
   a. **`gh` CLI ya autenticado** (`gh auth status`, `gh auth token`): cero configuración; EnvKit lo incluye para eso. Usar `gh repo list --json name,nameWithOwner,isPrivate,description,pushedAt,defaultBranchRef --limit 200` (incluye privados y organizaciones).
   b. **Device flow de GitHub OAuth App** (`POST https://github.com/login/device/code` y sondeo a `/login/oauth/access_token`): ideal para app de escritorio sin servidor ni client secret; el usuario ve un código y pulsa un enlace. Scopes mínimos: `repo` (privados) y `read:org`. Requiere registrar una OAuth App con "Enable Device Flow".
   c. **Token personal (fine-grained PAT)** pegado una vez, como respaldo.
2. **Listado**: tarjetas con buscador, filtro "privado/org/recientes", rama por defecto, último push; indicar "ya clonado en C:\Proyectos\x" si existe.
3. **Clonar**: destino por defecto `C:\Proyectos\<repo>` editable; `git clone` con progreso en streaming (`--progress`), rama elegible, `--depth` opcional. Autenticar con `GIT_ASKPASS`/credential helper efímero (no incrustar el token en la URL ni en `.git/config`).
4. **Autodetección** (leer archivos, sin ejecutar nada): `artisan` + `laravel/framework` = Laravel; `system/CodeIgniter.php` o `app/Config/App.php` = CI3/CI4; `wp-config*.php`/`wp-content` = WordPress; `pyproject.toml`/`requirements.txt` con fastapi/uvicorn = FastAPI (proceso supervisado, no sitio PHP); `package.json` con vite/next = dev server; `composer.json` → `require.php` y `config.platform.php` para la versión; docroot `public/`, `public_html/`, `web/`, o raíz.
5. **Receta de preparación** (lista de pasos con casillas, mostrados antes de ejecutar y con log por paso):
   - PHP: elegir la versión instalada más alta que cumpla `require.php` (si falta, ofrecer instalarla).
   - `composer install` (con `--no-interaction`; si falla por extensión faltante, indicar cuál y ofrecer activarla; usar `auth.json` solo si hay repos privados).
   - `npm ci`/`pnpm i` + `npm run build` (opcional; casilla).
   - `.env`: copiar `.env.example`, ajustar `APP_URL=https://<sitio>.test`, `DB_*`, `MAIL_*` (Mailpit), `REDIS_*`; **crear la BD** con el servicio activo y credenciales gestionadas por WolfCore.
   - `php artisan key:generate`, `migrate` (y `--seed` opcional), `storage:link`; para CI4 `php spark migrate`; CI3: `application/config/database.php` desde plantilla.
   - BD desde volcado: si el repo trae `*.sql`/`database/*.sql` o el usuario elige un `.sql`/`.sql.gz`, restaurar con el flujo ya existente de respaldo/restauración.
   - Crear sitio `.test` + vhost + pool PHP + certificado (opcional) y abrir en el navegador.
6. **Receta por proyecto** (`.wolfcore/setup.json` o `wolfcore.yml`, versionable): pasos personalizados, versión PHP, extensiones, servicios requeridos, plantilla de `.env`. Se genera sola la primera vez (a partir de lo detectado) y se reutiliza en re-montajes y en otros equipos. Inspiración: `envkit.json`, `.herd.yml` (cv), `.ddev/config.yaml`.
7. **Actualizar (pull)**: botón "Actualizar" por sitio: `git fetch`, mostrar commits entrantes, `pull --ff-only`; si cambió `composer.lock`/`package-lock.json`/`migrations`, proponer `composer install`/`npm ci`/`migrate`. Avisar de cambios locales sin commit (no pisar). Más adelante: rama como subdominio con worktree (idea de EnvKit).
8. **Repos sin red/privados de otras cuentas**: si `git clone` falla por auth, mostrar causa concreta (no tienes acceso / token sin scope / SSO de la organización pendiente de autorizar).

### 2.3 Seguridad
- **Nunca** guardar tokens en `config.json`, `.env`, URL de remotos ni logs. Usar Electron `safeStorage` (DPAPI en Windows) y guardar el blob cifrado; descifrar solo en el proceso principal; el renderer nunca ve el token (solo "conectado como @usuario").
- Preferir `gh` ya logueado (el token queda en el llavero de `gh`); no copiarlo.
- Scopes mínimos; botón "Desconectar" que borra el blob y ejecuta revocación si es OAuth.
- Enmascarar secretos en logs de pasos (`***`); `GIT_TERMINAL_PROMPT=0` para que git no se cuelgue.
- Clonar contenido de terceros y ejecutar `composer install` y scripts de `package.json` ejecuta código arbitrario (hooks `post-install-cmd`, `postinstall`): **mostrar aviso y casilla "confiar en este repo"**; opción `--no-scripts` para repos ajenos.
- Validar la ruta destino (dentro de la carpeta de proyectos, sin `..`, sin sobrescribir carpetas con contenido) y el nombre de sitio (regex segura) antes de tocar hosts/vhosts.
- No ejecutar `.env` ni volcados SQL sin mostrar resumen; los volcados pueden traer datos reales (aviso RGPD en repos de clientes).

---

## 3. Referencias de interfaz y recomendaciones para Naive UI

### 3.1 Patrones de las mejores
| Herramienta | Qué hacen bien |
|---|---|
| Laravel Herd | Minimalismo: casi todo desde la barra de menú; lista de sitios con interruptor y chips (PHP, HTTPS); acento rojo/naranja Laravel; mucho espacio en blanco; tema sigue al SO (cv). |
| ServBay | Dashboard con gráficas (CPU, memoria, disco, red), lista de servicios con Start/Stop y logs; lateral con iconos; muchas funciones pero ordenadas por secciones; interfaz en varios idiomas incluido chino/inglés/japonés (cv). |
| Local WP | Tarjetas de sitio en lista lateral con estado (punto verde/gris), asistente de creación en 3 pasos ("Blueprints"), estados vacíos con ilustración y llamada a la acción (cv). |
| WordPress Studio | Muy limpio, pocos botones, pestañas por sitio (Overview, Settings, Sync, Import/Export), tema claro/oscuro (cv). |
| EnvKit | Lateral de 12 secciones con iconos, dashboard denso pero legible, ficha de sitio con submenú, selector de tema e idioma en la barra de título, tema Sistema/Claro/Oscuro, Lite mode, RTL, 6 idiomas (verificado). Acento verde azulado (menta `#2dd4aa` y teal `#0d9488` en sus badges). |
| FlyEnv | Lateral por módulos (cada servicio su pestaña con versiones, configuración y logs), Tailwind, claro/oscuro; muchos idiomas (cv). |

Patrones comunes: (1) lateral izquierdo estrecho con iconos + etiqueta, colapsable; (2) "punto de estado" + chips pequeños para versión/puerto/HTTPS; (3) un botón primario por pantalla; (4) tarjetas con acciones al pasar el ratón; (5) estados vacíos que ofrecen la acción; (6) tema que sigue al SO con selector explícito; (7) bandeja del sistema como superficie principal; (8) asistente de primer arranque que termina en algo funcionando; (9) toasts breves y errores accionables.

### 3.2 Recomendaciones concretas (Naive UI, estado actual del repo)
Estado: `App.vue` ya usa `useOsTheme()` con `darkTheme` y overrides (`tema.ts`: índigo `#4f5bd5`, Segoe UI Variable), textos centralizados en `i18n/es.ts`, `vue-i18n` no instalado.

1. **Selector de tema Sistema/Claro/Oscuro** (S). Estado `preferencia: 'sistema'|'claro'|'oscuro'` en un store Pinia persistido (en el proceso principal, `settings.json`, o `localStorage` como mínimo). `oscuro = pref==='sistema' ? osTheme==='dark' : pref==='oscuro'`. Control `NRadioGroup`/`NSelect` en Ajustes y un botón sol/luna/monitor en la barra superior del `Marco`. Aplicar también `document.documentElement.dataset.tema` y `color-scheme` para scrollbars y controles nativos; en Electron, `nativeTheme.themeSource` para que ventana y barra de título coincidan. Cargar la preferencia antes de montar para evitar el parpadeo.
2. **i18n español + inglés con `vue-i18n` v10/11** (M). Convertir `i18n/es.ts` a mensajes `{ es, en }` (la estructura anidada ya existe; las funciones `plural` pasan a pluralización ICU de vue-i18n: `"{n} sitio | {n} sitios"`). `legacy: false`, `locale` por defecto del SO (`app.getLocale()`), fallback `es`; `NConfigProvider :locale="esES|enUS" :date-locale`. Selector en Ajustes y barra superior. Regla de lint: prohibir literales en `.vue` (ya hay disciplina de texto centralizado). Dejar el diseño preparado para añadir más idiomas (EnvKit usa 6; con RTL solo si se necesita).
3. **Tipografía** (S). Mantener Segoe UI Variable como UI y Cascadia Mono para código (ya definidos). Escala: 12 px auxiliar, 13 px tabla/chips, 14 px base, 16 px subtítulos, 20 px título de página; pesos 400/500/600; `font-variant-numeric: tabular-nums` en puertos, PID, uso de CPU/RAM; títulos con `letter-spacing: -0.01em`. No más de dos pesos por pantalla.
4. **Espaciado y densidad** (S). Rejilla de 4/8 px con tokens CSS (`--esp-1..6`); radio 8 px (ya); padding de tarjeta 16; separación entre tarjetas 12-16. Opción "Densidad: cómoda/compacta" (tamaño `small` de Naive en tablas y botones) como en EnvKit "Lite". Respetar `prefers-reduced-motion` y añadir "Reducir efectos" (desactiva transiciones de `NConfigProvider` y blur).
5. **Acento y paleta** (S). Un solo acento (índigo actual) más semánticos: verde éxito/en marcha, ámbar aviso, rojo error, gris detenido. Permitir **elegir acento** entre 5-6 preajustes (índigo, teal, verde, naranja, rosa, rojo lobo) generando `primaryColor*` a partir de un tono; comprobar contraste AA (4.5:1) en ambos temas. Superficies en 3 niveles (fondo, tarjeta, elevado) con bordes de 1 px en lugar de sombras duras.
6. **Chips de estado y puntos** (S). Componente único `EstadoChip` (ya existe `EstadoPunto.vue`): punto + etiqueta ("En marcha", "Detenido", "Error", "Iniciando" con pulso), siempre con texto además del color (accesibilidad). Chips pequeños para PHP 8.3, HTTPS, puerto, framework.
7. **Dashboard con panel de recursos** (M). Fila superior de 4 tarjetas (CPU, RAM, disco de datos, estado de servicios) con sparkline de 5-10 min (SVG propio o `echarts` mínimo; Naive no trae gráficos); bajo ellas dos columnas: "Sitios" (tarjeta: nombre, chip framework, PHP, HTTPS, abrir/IDE/carpeta) y "Servicios" (tabla con estado, puerto, PID, CPU, RAM, uptime, acciones). Botones "Iniciar todo / Detener todo" y aviso de puertos ocupados con "Detener proceso" (como EnvKit). Muestreo cada 2-3 s solo con la ventana visible (`document.visibilityState`) vía `pidusage`/`systeminformation` en el proceso principal.
8. **Estados vacíos** (S). `NEmpty` personalizado con icono, una frase y un botón primario ("Aún no tienes sitios. Clonar de GitHub / Enlazar carpeta / Crear proyecto"). Esqueletos (`NSkeleton`) al cargar.
9. **Paleta de comandos Ctrl+K** (S-M). `NModal` + `NInput` + lista filtrada (sitios, servicios, acciones, rutas, "cambiar tema", "cambiar idioma"); registrar acciones en un registro central para no duplicar.
10. **Asistente de primer arranque** (M). 4 pasos: (1) idioma y tema, (2) detectar/importar (Laragon, XAMPP, carpeta `C:\Proyectos`), (3) elegir stack (PHP, DB, Redis, Mailpit) con instalación y progreso, (4) montar el primer sitio (o clonar de GitHub) y abrirlo por HTTPS; si falla, mostrar causa y arreglo. `NSteps` + `NCard`.
11. **Iconos** (S). Una sola familia coherente: `@vicons/tabler` o `lucide-vue-next` (trazo 1.5-2 px, tamaño 18-20); evitar mezclar con Ionicons. Logo propio en el lateral.
12. **Lateral y marco** (S). Ancho 220/64 px (ya contraíble); sección activa con barra de acento a la izquierda; grupos separados ("Entorno": Inicio, Sitios, Servicios, BD; "Herramientas": Correo, IA local, Túneles; "Sistema": Ajustes). Barra superior con búsqueda (Ctrl+K), selector de tema e idioma, estado global del stack y botón "Iniciar todo". Ficha de sitio con submenú (Resumen, Ejecutar, Desarrollo, Ajustes) como EnvKit.
13. **Accesibilidad y calidad** (S). Foco visible, navegación por teclado, `aria-label` en iconos, textos mínimos 12 px; pruebas visuales de ambos temas (captura con Playwright) antes de cada release.

---

## 4. Propuesta para la Etapa B (prioridad: poder montar ya los proyectos del usuario)

Orden por prioridad. S = menos de 1 día, M = 2-4 días, L = 1-2 semanas.

| # | Función | Esfuerzo | Nota |
|---|---|---|---|
| 1 | **Enlazar carpeta existente** + `park` de `C:\Proyectos` con autodetección de framework (Laravel, CI3/CI4, WordPress, plain PHP, FastAPI, Vite) y docroot | M | Permite tener ya todos los proyectos como `.test` sin clonar. |
| 2 | **Versión de PHP por proyecto** desde `composer.json` + extensiones/php.ini por sitio, con aviso de extensión faltante | M | Imprescindible para CI3 legado y Laravel moderno. |
| 3 | **Gestor `.env` por sitio** (copiar `.env.example`, ajustar APP_URL/DB/MAIL, enmascarar secretos) + crear BD y restaurar volcado | M | Reutiliza respaldo/restauración y Mailpit. |
| 4 | **Clonar de Git por URL** con progreso, destino `C:\Proyectos`, y **receta de preparación** (composer install, npm ci/build, key:generate, migrate/seed, storage:link) con log por paso y casilla "confiar en el repo" | L | Núcleo del pedido. |
| 5 | **Conexión a GitHub** (primero `gh` si está logueado; luego device flow; PAT de respaldo) con token en `safeStorage` + listado de repos propios y privados con búsqueda | M | Diferenciador frente a EnvKit/Herd. |
| 6 | **Archivo de proyecto `wolfcore.yml`/`.wolfcore/setup.json`** (PHP, extensiones, servicios, pasos de setup, plantilla `.env`) generado al autodetectar | M | Hace la receta reproducible y versionable. |
| 7 | **Procesos supervisados** (uvicorn del bot FastAPI, queue:work, npm run dev) con logs y auto-reinicio | M | Para el bot y Laravel. |
| 8 | **Actualizar (pull)** por sitio con aviso de cambios y propuesta de composer/npm/migrate | S-M | Cierra el ciclo clon-actualizar. |
| 9 | **Selector de tema Sistema/Claro/Oscuro** (+ `nativeTheme`) | S | Rápido y visible. |
| 10 | **i18n con vue-i18n (es + en)** y selector de idioma | M | La estructura de textos ya está centralizada. |
| 11 | **Dashboard con panel de recursos** + aviso de puertos ocupados con "Detener proceso" | M | Prioridad alta del roadmap anterior. |
| 12 | **Visor de logs unificado** (nginx, PHP, laravel.log, CI logs, pasos de receta) | S-M | Necesario para depurar montajes fallidos. |
| 13 | **Estados vacíos + paleta Ctrl+K + acciones rápidas** (IDE, carpeta, terminal, navegador) | S-M | Pulido de uso diario. |
| 14 | **Asistente de primer arranque** con importación de Laragon/XAMPP | M | Para instalación en otros equipos. |
| 15 | **Ficha de sitio con submenú** y pestaña Git básica (rama, estado, pull/push) | M | Antes de worktrees. |
| 16 | **Blueprints/plantillas de sitio** (guardar un sitio montado y recrearlo) | M | Después de que la receta sea estable. |
| 17 | **Rama como subdominio** con `git worktree` (idea de EnvKit) | L | Revisión de PRs; Etapa C. |
| 18 | Acento elegible, densidad, "Reducir efectos", iconos unificados | S | Pulido gradual. |

Criterio: del 1 al 8 se llega a "clono mi repo privado de GitHub, se instala solo y abre en `https://proyecto.test`"; 9 al 12 son pulido y observabilidad de bajo coste; 13 en adelante, comodidad.

Notas finales: no copiar textos ni código de EnvKit (propietario). El esquema de `wolfcore.yml` debe ser propio. Revisar los datos (cv) antes de usarlos como argumento.
