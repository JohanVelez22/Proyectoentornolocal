# WolfCore Dev — Etapa D: proyectos, compartir, respaldo del entorno, CLI y utilidades del equipo

Fecha: 2026-11-24 · Estado: borrador para revisión (el usuario delegó las decisiones y el orden: "no omitas etapas, solo ordénalas para que una pueda seguir con la otra") · Base: rama `feat/etapa-c` (Etapa C cerrada con QA 3, último commit `bb6951f`) · Rama: se sigue en `feat/etapa-c`; no se fusiona con `main`

Insumos: [plan de etapas](../roadmap/2026-11-19-plan-etapas.md) (§2 "Etapa D", §4 pedidos y §4.1 arrastre de C) · [referentes](../roadmap/2026-11-18-referentes.md) · specs del [MVP](2026-11-17-proyectoentornolocal-design.md), [Etapa A](2026-11-18-etapa-a-design.md), [Etapa B](2026-11-19-etapa-b-design.md) y [Etapa C](2026-11-19-etapa-c-design.md).

Las decisiones que tomó el constructor sin consultar al usuario se marcan **(decisión propia)** y se repiten juntas en §7.

## 1. Para qué

Con la Etapa C el usuario depura PHP, usa IA local o en la nube, registra agentes con el MCP, recibe avisos, repara el entorno con el Doctor e instala cualquier versión publicada de cada servicio. Lo que le falta para **no tener que salir de WolfCore Dev** en todo el ciclo de un proyecto es:

- **empezar, traer y mover proyectos** en pocos clics: proyecto nuevo con su base, `.env` y HTTPS; plantillas propias; importar lo que tiene en Laragon, XAMPP o Herd; un gestor de `.env` que no muestre secretos sin pedirlo;
- **compartirlos**: túneles de Cloudflare con dominio propio, ngrok, Expose o Tailscale, y la red local con un QR para el móvil;
- **llevarse el entorno a otro equipo** (perfil exportado e importado) y volver atrás con instantáneas de las bases;
- **manejarlo desde la terminal** con la CLI `wolf`;
- tener a mano **las utilidades del día** que hoy busca en otros programas: buscar texto en carpetas, convertir documentos e imágenes, capturar la pantalla, liberar RAM y disco, auditar contraseñas de sus propias bases, elegir su editor y su gestor de base de datos;
- y cerrar lo que quedó **pendiente de C**: presets de IA, agentes nuevos, portugués y francés, Java/.NET/Go/Rust y el aviso al terminar un proceso, más el **pulido** de la interfaz que pidió (solo versiones, desplegables hacia abajo, aspecto general).

**Éxito (los criterios de la aceptación final):**

- El usuario crea un Laravel nuevo con un clic: queda el sitio `.test` con HTTPS, la base creada en la instancia predeterminada, el `.env` con la conexión y el editor abierto en la carpeta.
- Importa un sitio de Laragon con su base: la carpeta no se mueve, el sitio responde en WolfCore Dev y la base trae las mismas filas.
- Abre un proyecto en el móvil por la red local escaneando un QR, y lo comparte por un túnel con nombre de su dominio.
- Desde PowerShell: `wolf status`, `wolf use php@8.4`, `wolf share <sitio>` y `wolf logs <sitio>` funcionan con la app abierta.
- Los **6 proyectos reales** del usuario (WolfCore System, Rents, Coffe, Diamantes, Dollar y el bot de FastAPI) siguen funcionando igual después de toda la etapa.
- **"PC nuevo":** exporta su perfil, lo importa en una carpeta de datos limpia (otra `WOLFCORE_DATOS`) y, tras descargar las versiones con huella verificada, los 6 proyectos vuelven a responder sin pasos a mano salvo volver a escribir sus claves secretas (que nunca viajan en el perfil).

## 2. Metas, no-metas y anti-metas

**Metas**

1. Todo lo marcado D en el plan de etapas (§2 y §4) y el arrastre de C (§4.1), sin omitir ninguno.
2. Cada bloque de tareas deja algo usable y se acepta por separado; CI en verde en los tres sistemas en cada tarea.
3. Lo nuevo pasa por la capa `Plataforma` (Windows ya; Linux y macOS en E) y por `ErrorWolf` con código traducido.
4. La interfaz queda revisada por un agente de diseño dos veces (al inicio y al cierre) y con el patrón de foco visual aplicado.

**No-metas (se hacen en otra etapa)**

- Implementaciones Linux/macOS de lo nuevo: E (aquí solo la interfaz `Plataforma` y la versión Windows; la falsa para pruebas).
- Visor de esquema de la base: F (lo dice el roadmap).
- Apache/Caddy: siguen en F; se evaluaron para D y no se adelantan (§7).
- Ruby, Perl y Erlang/Elixir en el catálogo: F, porque no publican para Windows un `.zip` oficial con huella fuerte (§3.2).
- Mailcatcher: F o nunca (necesita Ruby).
- WordPress completo (plugins, multisite, WP-CLI): F; aquí solo el arranque básico.

**Anti-metas (nunca)**

- Exportar secretos en un perfil, plantilla, respaldo o log.
- Mostrar una contraseña de usuario de una base, o descifrarla; la auditoría solo marca "débil" y ofrece restablecer.
- Fuerza bruta o listas grandes de contraseñas.
- Cerrar o matar procesos del sistema, de FlyEnv o de otros usuarios; borrar archivos fuera de rutas conocidas y seguras.
- Subir capturas, documentos o datos a cualquier servicio externo.
- Lanzar agentes, túneles o limpiezas de forma automática o programada sin una orden explícita del usuario (las tareas programadas por sitio son comandos del propio proyecto que el usuario escribe).

## 3. Diseño por bloques

### Bloque 1 — Pulido temprano y arrastre de C (D1–D8)

**Comprobado en el código antes de planificar:** los pedidos "QA, al retomar" de §4 ya se hicieron en C y no se repiten: el botón se llama "Terminal" y abre en la app instalada, la terminal es configurable (`Plataforma.terminalesInstaladas`, terminal predeterminada en Ajustes y menú para elegir otra en la tarjeta) y las acciones de la tarjeta son íconos con tooltip (`BotonIcono.vue`). El botón de base de la tarjeta ya abre Adminer; **phpMyAdmin** y el acceso ya autenticado quedan para D18. El diálogo de Salir ya es modal y al frente (`main/salida.ts`); en D1 solo se verifica a mano.

**D1 · Pulido temprano y auditoría de diseño.**
- **Solo versiones:** en la interfaz desaparece la palabra "rama" (y "branch" en inglés) fuera de Git. Las cabeceras de la pestaña Versiones dicen `PHP 8.4`, `PostgreSQL 17`; los selectores, `8.4`; los textos de error hablan de "versión". El código interno conserva `rama` (no se renombra nada en el núcleo ni en el IPC). **(decisión propia)** Una prueba guardián recorre los diccionarios y falla si aparece `rama`/`branch` fuera de las claves de Git.
- **Desplegables hacia abajo:** todos los `NSelect`, `NDropdown`, `NAutoComplete` y `NDatePicker` se abren hacia abajo. Se crean dos envoltorios, `Desplegable.vue` (sobre `NSelect`) y `MenuDesplegable.vue` (sobre `NDropdown`), con `placement="bottom-start"` y sin volteo; si no hay espacio abajo, el menú se acorta y hace scroll en lugar de subir. Una prueba guardián prohíbe usar `NSelect`/`NDropdown` directamente fuera de los envoltorios. **(decisión propia)**
- **Auditoría de diseño grande** con un agente especializado (skills `design:design-critique` y `design:accessibility-review`) sobre todas las pantallas en tema claro y oscuro: alineación, espaciado, jerarquía, contraste AA, tamaños de toque, foco de teclado. El informe se guarda en `docs/superpowers/auditorias/2026-11-24-diseno-d1.md` con cada hallazgo clasificado (alto/medio/bajo). D1 corrige los **altos**; los medios y bajos pasan a D38.
- **Verificación manual del diálogo de Salir** con otra ventana encima (el arreglo se hizo en C): la app queda al frente, el diálogo modal tiene el foco y "Cancelar" deja la app abierta. Se anota el resultado en la auditoría.
- **Repaso analítico de los referentes** (tarea de bajo costo de §4.1): la matriz de §1 del plan de etapas se pone al día con lo hecho en B y C.

**D2 · Presets de IA:** Kilo, OmniRouter y FreeLLMAPI se suman a `PRESETS_COMPATIBLES`. Cada preset lleva su URL base y el enlace a su documentación oficial; la tarea **verifica la URL compatible con OpenAI en la documentación oficial** antes de agregarlo, y un preset cuya URL no se pueda verificar no se agrega (se informa). **(decisión propia)** Para los modelos gratuitos, el listado de modelos gana un filtro "Solo gratuitos" que reconoce el sufijo `:free` y el precio cero cuando el proveedor lo publica.

**D3 · Agentes:** a Claude Code, Codex y Hermes se suman **Opencode** (pedido de C), **Antigravity CLI** (pedido nuevo) y los CLIs comunes que cumplan los criterios de viabilidad. Criterios **(decisión propia)**: (1) paquete o instalador oficial del fabricante (npm de su organización o binario de su sitio); (2) corre nativo en Windows; (3) admite un servidor MCP remoto por HTTP con cabecera de autorización tomada de una variable de entorno (el token nunca queda escrito); (4) archivo de configuración JSON, JSONC o TOML documentado. Candidatos a verificar en la tarea: Gemini CLI, Qwen Code y GitHub Copilot CLI. Un candidato que falle (2)–(4) queda solo con detección y guía, como Hermes en C; uno que falle (1) no se agrega. Antigravity se agrega con detección y guía si su CLI no tiene instalador oficial de línea de órdenes.

**D4 · Idiomas:** portugués (**pt-BR**, decisión propia: el público hispanohablante de la región está junto a Brasil) y francés (fr-FR). El sistema queda "listo para más": un registro `IDIOMAS` con `{id, nombreNativo, localeIntl}` del que salen el selector, `localeIntl`, la detección del idioma del sistema, los textos del proceso principal (`main/textos.ts`) y los de avisos (`shared/textosAvisos.ts`). Una prueba exige la misma forma en todos los diccionarios y texto para cada `CodigoError` en todos los idiomas. Desde D4, toda cadena nueva va en es, en, pt y fr.

**D5 · Java, .NET, Go y Rust** en el catálogo en vivo y como runtimes por proyecto (como Node y Python):

| Lenguaje | Índice oficial | Huella | Descarga |
|---|---|---|---|
| Java (Temurin) | `api.adoptium.net/v3/…` (versiones LTS y actuales) | SHA-256 del índice | `github.com/adoptium/temurin<N>-binaries/releases/download/…` (redirige a `release-assets.githubusercontent.com`) |
| .NET SDK | `builds.dotnet.microsoft.com/dotnet/release-metadata/releases-index.json` y `<canal>/releases.json` | SHA-512 del índice | `builds.dotnet.microsoft.com` |
| Go | `go.dev/dl/?mode=json&include=all` | SHA-256 del índice | `go.dev/dl/…` → `dl.google.com` |
| Rust | Versiones estables desde la API de GitHub de `rust-lang/rust` | `rustup-init.exe.sha256` de `static.rust-lang.org`; rustup verifica cada componente con el manifiesto del canal | `rustup-init.exe` en la carpeta de datos con `RUSTUP_HOME`/`CARGO_HOME` propios; `rustup toolchain install <versión>` |

- Los hosts nuevos entran a `HOSTS_INDICE`/`HOSTS_PERMITIDOS` uno por uno, sin comodines.
- `TipoRuntime` pasa de `node | python` a `node | python | java | dotnet | go | rust`; el entorno de un proceso de proyecto recibe `JAVA_HOME`, `DOTNET_ROOT` (+ `DOTNET_CLI_TELEMETRY_OPTOUT=1`), `GOROOT`/`GOPATH` y `RUSTUP_HOME`/`CARGO_HOME`, además del PATH.
- La detección reconoce `pom.xml`/`build.gradle(.kts)`, `*.csproj`/`*.sln`/`global.json`, `go.mod` y `Cargo.toml`/`rust-toolchain(.toml)`, y propone la versión que pida el archivo.
- Rust MSVC necesita el enlazador de Visual Studio Build Tools: el Doctor suma una revisión que lo informa con el comando `winget` (solo informa). **(decisión propia)**

**D6 · Avisos de procesos:** cuando un proceso de proyecto sin reinicio termina, **código 0 = terminó bien** (estado `apagado`, aviso `proceso-terminado` de nivel `info`) y **otro código = falló** (estado `error`, aviso `proceso-error` con el código de salida). Hoy cualquier salida sin reinicio queda en `error`. **(decisión propia)** Lo mismo para las recetas: al terminar una receta larga llega un aviso de éxito o fallo. La notificación nativa sigue la regla de C (solo sin foco, límite por tipo y fuente) y el tipo se puede desactivar en Ajustes.

**D7 · URL de FTP:** la sección FTP del sitio muestra `ftp://<usuario>@<host>:<puerto>/` **sin contraseña** (host `127.0.0.1` o la IP local si "red local" está activa), con **Copiar**, **Abrir** (el sistema elige el cliente FTP) y **QR**, igual que el túnel. `sistema.abrirUrl` acepta `ftp://` solo con esa forma exacta.

**D8 · Búsqueda por palabra clave** en un archivo o una carpeta, en nombres y en contenido: herramienta nueva "Buscar" con texto literal o expresión regular, mayúsculas, incluir/excluir por patrón, y por defecto sin `node_modules`, `vendor`, `.git` ni binarios. Corre en el núcleo, por flujo y cancelable, con límites (10 000 archivos con resultado, 2 000 coincidencias, 5 MB por archivo, sin seguir enlaces). La carpeta sale de un diálogo o de un proyecto (por id); los resultados abren el archivo en la línea con el editor elegido (D17).

**Aceptación del bloque 1:** las pantallas tocadas se ven bien en los dos temas y los cuatro idiomas; ninguna dice "rama"; los desplegables abren hacia abajo; Opencode se registra y abre en un proyecto; un proyecto Go y uno Java arrancan con su runtime; un proceso que termina avisa.

### Bloque 2 — Bases para lo que sigue (D9–D11)

**D9 · Navegación con foco visual:** composable `useFoco()` y parámetro de ruta `?foco=<id>`. Al llegar, la vista hace scroll al elemento con `data-foco="<id>"` y lo resalta 2,5 s con un halo según tema y acento; con `prefers-reduced-motion`, un borde estático breve. Se aplica a avisos (abrir el aviso lleva al servicio, sitio o hallazgo), Doctor, panel de inicio y proyectos. Va antes de las pantallas nuevas para que todas lo usen.

**D10 · Firmas PGP de las descargas** (aplazado desde C §3.11): se verifican `SHASUMS256.txt.sig` de Node, `composer.phar.asc` de Composer y los `.asc` de Nginx con **un verificador mínimo propio de firmas OpenPGP v4 separadas sobre `node:crypto`** (RSA PKCS#1 v1.5 con SHA-256/SHA-512 y EdDSA Ed25519), con anillos de claves fijados en la app (`catalogo/claves/<fuente>.asc`) y probado con vectores reales de cada fuente. **(decisión propia)** Motivos: `openpgp` es LGPL-3.0; `kbpgp` arrastra criptografía antigua; el subconjunto necesario (paquete de firma v4, subpaquetes de fecha e id de emisor, clave pública RSA/EdDSA, hash con el trailer v4) es pequeño y se puede probar exhaustivamente.
- **Falla cerrado:** firma ausente cuando la fuente la publica, clave desconocida, firma inválida o paquete no soportado = error `catalogo.firma_invalida`, sin instalar. Una firma válida de Nginx convierte su fila de "sin huella" en "firma verificada" (ya no pide confirmación).
- Las claves se actualizan con un script (`scripts/actualizar-claves-pgp.mjs`) que baja los anillos oficiales y muestra el diff; nunca se actualizan solas desde la app.

**D11 · Más lenguajes:** Bun (`oven-sh/bun`, `SHASUMS256.txt`), Deno (`denoland/deno`, `.sha256sum`), Zig (`ziglang.org/download/index.json`, SHA-256), Kotlin (`JetBrains/kotlin`, `.sha256`; usa el Java de D5) y Dart (`storage.googleapis.com/dart-archive`, `.sha256sum`). Misma infraestructura que D5. Ruby, Perl y Erlang/Elixir quedan fuera (§2).

**Aceptación del bloque 2:** un aviso lleva al elemento resaltado; instalar Node y Composer verifica la firma (y una firma alterada se rechaza); Bun y Deno se instalan con huella.

### Bloque 3 — Proyectos: crear, plantillas, importar y `.env` (D12–D16)

**D12 · Nuevo proyecto (núcleo):** generadores declarativos que reutilizan el motor de recetas de B. Cada generador es una lista de pasos (los tipos existentes más `crear-desde-composer`, `descargar-plantilla` y `copiar-plantilla-interna`):

| Tipo | Origen | Notas |
|---|---|---|
| Laravel | `composer create-project laravel/laravel` | starter kits oficiales como opción (`laravel/<kit>-starter-kit`); `key:generate`, migraciones |
| CodeIgniter 4 | `composer create-project codeigniter4/appstarter` | `.env` estilo CI4 |
| CodeIgniter 3 | `composer create-project codeigniter/framework` | `database.php` con el bloque literal de B |
| Symfony | `composer create-project symfony/skeleton` (o `webapp`) | |
| FastAPI | plantilla interna (venv, `requirements.txt`, `main.py`), opción pgvector | proceso uvicorn de B |
| WordPress básico | `wordpress.org/wordpress-<v>.zip` con su `.sha1` | SHA-1 cuenta como **débil**: pide la confirmación de C **(decisión propia)**; `wp-config.php` con la conexión |
| Estático | plantilla interna | |

Crea el sitio, la base en la instancia predeterminada, el `.env`, el certificado y abre el editor. La carpeta destino debe estar vacía o no existir; si falla a medias, no se borra lo creado (se informa qué quedó).

**D13 · Asistente "Nuevo proyecto":** tipo, nombre, carpeta (diálogo), versión de PHP/Python, motor e instancia de base, starter kit; resumen antes de crear, progreso por paso (el de recetas) y "Abrir" al terminar.

**D14 · Plantillas:** "Guardar como plantilla" en un proyecto guarda en `<datos>/plantillas/<id>/` la receta (`wolfcore.yml`), extensiones PHP y ajustes por sitio, runtimes, snippets de Nginx y el **esquema de la base sin datos** (volcado solo de estructura). Opcionalmente, archivos del proyecto con una lista de exclusión obligatoria (`.env*`, `vendor`, `node_modules`, `.git`, `storage/logs`). Nunca se guardan datos de filas ni secretos. "Nuevo proyecto" muestra las plantillas propias junto a los generadores.

**D15 · Importar desde Laragon, XAMPP y Herd:** detecta instalaciones en sus rutas conocidas (por `Plataforma`): carpetas `www`/`htdocs`/`Herd`, vhosts de Apache/Nginx y la configuración de Valet de Herd. Muestra una **vista previa** (sitio, carpeta, dominio, PHP, base) y el usuario elige qué importar.
- Los sitios se **vinculan en su lugar**: nunca se mueven ni se copian carpetas.
- Las bases se copian con un volcado de solo lectura desde el MySQL/MariaDB de origen, **que el usuario enciende** (WolfCore Dev no arranca ni detiene programas ajenos), y se restauran en la instancia elegida con la protección de B (base existente = confirmación de reemplazo y respaldo previo).
- Los archivos de origen se leen con límites (tamaño, UTF-8/UTF-16, rutas dentro de la instalación) y nunca se modifican.

**D16 · Gestor de `.env`:** pantalla por proyecto con las variables en tabla, **valores secretos enmascarados** (por `patronesSecretos` y por nombre: `*_KEY`, `*_SECRET`, `*_PASSWORD`, `*_TOKEN`), "Mostrar" por variable con clic explícito, **diff contra `.env.example`** (faltan, sobran, distintas), "Agregar las que faltan" con los valores del ejemplo, y plantillas de bloques (BD, correo, IA, Redis). Guardar = vista previa del diff con secretos enmascarados, copia con fecha y escritura atómica; conserva comentarios, orden y comillas. Los valores revelados nunca pasan por logs ni eventos.

**Aceptación del bloque 3:** crear un Laravel y un FastAPI nuevos que responden con HTTPS; guardar uno como plantilla y crear otro desde ella; importar un sitio y una base de un Laragon de prueba; editar un `.env` y volver a la copia.

### Bloque 4 — Editor, bases de datos y correo (D17–D22)

**D17 · Elegir editor:** detecta VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed y Notepad++ (por `Plataforma`: PATH y rutas conocidas), fija uno predeterminado en Ajustes y ofrece "Abrir con…" en la tarjeta del proyecto. "Abrir en la línea" usa los argumentos de cada editor (`-g archivo:línea`, `--line`, `archivo:línea`).

**D18 · phpMyAdmin y botón de base por proyecto:** phpMyAdmin se instala del catálogo (`files.phpmyadmin.net`, SHA-256 publicado) y se sirve como Adminer. El botón de base de la tarjeta (ya existe para Adminer) ofrece Adminer o phpMyAdmin **con la base del proyecto ya autenticada** mediante un **token de un solo uso** (60 s, aleatorio de 32 bytes) que el script de entrada de WolfCore Dev canjea en el servidor por las credenciales: la contraseña nunca va en la URL, el historial ni los logs. **(decisión propia)** phpMyAdmin usa `auth_type = signon`; Adminer, un plugin de inicio de sesión propio.

**D19 · Instantáneas de base con un clic:** "Tomar instantánea" de una base (volcado lógico con `Respaldos`, nombre con fecha y nota) y "Volver a esta instantánea" con vista previa (tamaño, fecha, tablas), confirmación y **respaldo automático del estado actual antes de restaurar**. Lista por base, con borrar (a la papelera de WolfCore Dev, recuperable 7 días).

**D20 · Auditoría de contraseñas** (decidido en el roadmap):
1. **Medidor de fortaleza** local para una contraseña escrita (en el renderer, nada sale del equipo).
2. **Revisión de hashes** de una tabla de usuarios de una base montada: el usuario elige tabla y columnas; se compara cada hash contra una **lista corta embebida de 200 contraseñas muy comunes**. Formatos: bcrypt (`$2a/$2b/$2y`), PBKDF2 de Django, MD5 y SHA-1 sin sal (legado, se marcan además como "formato débil") y Argon2 solo si `node:crypto` lo ofrece; otros = "no revisable". El resultado marca la cuenta como **débil sin mostrar nunca cuál contraseña coincidió**. Límite de 10 000 filas y tiempo máximo por revisión. Solo lectura.
3. **Restablecer** la contraseña de una cuenta (nunca recuperarla): nueva contraseña escrita por el usuario, hasheada con el mismo formato, vista previa de la sentencia sin el valor, confirmación y **copia de la fila** antes de escribir.
La interfaz explica el límite: no es un ataque, solo detecta contraseñas muy comunes.

**D21 · Correo A, captadores locales:** la pantalla Correo pasa a dos secciones. Captadores instalables, solo en `127.0.0.1`, de fuente oficial con huella cuando exista: **Mailpit** (ya), **smtp4dev** (`rnwood/smtp4dev`, prioridad alta), **MailHog** (opcional, aviso de "sin mantenimiento"), **MailDev** (npm oficial), **Papercut SMTP** e **Inbucket** (opcionales). Mailcatcher queda fuera (Ruby). Uno encendido a la vez en el puerto SMTP elegido.

**D22 · Correo B, proveedores SMTP remotos:** formulario genérico (host, puerto, TLS/STARTTLS, usuario, clave en `AlmacenSecretos` con id `smtp:<id>`) con presets Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO y Gmail; **"Probar envío"** a una dirección que escribe el usuario (con `nodemailer`, MIT); cada proyecto elige captador o proveedor y escribe su bloque `MAIL_*` (la clave al `.env` solo con la confirmación y el aviso de texto plano de C).

**Aceptación del bloque 4:** abrir un proyecto en Cursor en una línea; entrar a phpMyAdmin con la base del proyecto sin escribir la clave; instantánea y vuelta atrás; auditoría que marca una cuenta con `password` sin mostrarla y la restablece; un correo del proyecto llega a smtp4dev; "Probar envío" contra un SMTP falso.

### Bloque 5 — Compartir (D23–D25)

**D23 · Túneles de Cloudflare con nombre:** "Conectar con Cloudflare" ejecuta `cloudflared tunnel login` (abre el navegador del usuario; el `cert.pem` queda en `<datos>/etc/cloudflared/`, restringido al usuario); crear el túnel con nombre, enrutar un subdominio de su dominio (`tunnel route dns`) y arrancarlo con un `config.yml` por sitio. La misma garantía de C: el `.env` (`APP_URL`, etc.) se cambia con copia y se restaura al cerrar o si la app se cae (restauración al arrancar).

**D24 · Túneles alternativos:** proveedor por sitio entre Cloudflare rápido (ya), Cloudflare con nombre, **ngrok** (binario oficial con huella si se publica; si no, confirmación de C; authtoken en `AlmacenSecretos` y pasado por variable de entorno), **Expose** (phar oficial de `beyondcode/expose`, con el PHP de WolfCore Dev; token en el almacén) y **Tailscale Serve/Funnel** (solo si Tailscale ya está instalado y con sesión: WolfCore Dev no lo instala porque es un servicio del sistema). Interfaz común `ProveedorTunel` con `abrir`, `cerrar`, `estado` y `url`.

**D25 · Acceso por la red local con QR:** interruptor por sitio "Ver en la red local". Se asigna un **puerto LAN propio por sitio** (desde 8100, sin chocar con nada, fuera de rangos reservados) con un `server` de Nginx que escucha en ese puerto, porque el `Host` del móvil será la IP y no el dominio `.test`. **(decisión propia)** QR con `http://<ip-local>:<puerto>`; HTTPS opcional con un certificado que incluye la IP como SAN. "Instalar la CA en el móvil": servidor temporal de un solo archivo (`ca.crt`, nunca la clave) en la LAN mientras el diálogo está abierto, con su QR y guía por sistema (Android/iOS). Aviso claro de que el sitio queda visible en la red; se apaga al salir de la app. La regla del cortafuegos de Windows se muestra como comando de administrador (no se ejecuta sola).

**Aceptación del bloque 5:** un sitio abre en el móvil del usuario escaneando el QR (lo hace el usuario); túnel con nombre en su dominio y ngrok con su cuenta (con su permiso); el `.env` vuelve a su valor al cerrar cada túnel.

### Bloque 6 — Entorno portátil y automatización (D26–D30)

**D26 · Perfiles del entorno (núcleo):** exportar a un archivo `.wolfperfil` (ZIP con `manifiesto.json` versionado y validado con `zod`):
- **Siempre:** configuración (`config.json` sin nada secreto), sitios y sus ajustes (PHP por sitio, Xdebug, reglas de Nginx, runtimes, túneles sin tokens), versiones instaladas por servicio (lista con huella, **no** los binarios), instancias con puertos, plantillas, workspaces y tareas programadas.
- **Opcional:** bases de datos (volcados lógicos por instancia), certificados de sitios y la **CA con su clave privada solo cifrada** con una frase que elige el usuario (scrypt + AES-256-GCM de `node:crypto`). **(decisión propia)** Sin la CA, al importar se genera una nueva y se regeneran los certificados.
- **Nunca:** claves de IA, token de GitHub, claves SMTP, tokens de túneles, token del MCP y de la CLI, contraseñas de bases (se regeneran al importar y se reescriben los bloques `.env` con confirmación).
- **Importar** en una carpeta de datos: vista previa de lo que se creará; si la carpeta no está vacía, se respalda lo que se reemplaza; **las rutas de los proyectos se reasignan** (otra unidad u otro usuario) con un paso de "buscar carpeta" para las que no existan, que quedan marcadas y no bloquean el resto; las versiones se descargan del catálogo con su huella; los volcados se restauran en instancias nuevas.
- **Otra carpeta de datos:** la app acepta la variable `WOLFCORE_DATOS=<carpeta>` para arrancar con otra carpeta (prueba de "PC nuevo" y pruebas manuales). Con ella, la carpeta real no se lee ni se escribe, y se usa un `userData` de Electron propio dentro de esa carpeta. **(decisión propia)** Hoy `Nucleo.crear({base})` ya lo admite; falta llevarlo al proceso principal.

**D27 · Perfiles (interfaz) e instantánea automática:** pantalla "Respaldo y perfiles" en Ajustes con exportar e importar (asistente con la vista previa y la reasignación de rutas). **Instantánea automática** de la configuración (y de los vhosts e ini) antes de actualizar una versión de PHP o Nginx o de importar un perfil, en `<datos>/respaldos/entorno/`, con las 10 últimas.

**D28 · Workspaces de arranque:** conjuntos con nombre de instancias, servicios y procesos de proyecto ("Bot FastAPI": PostgreSQL 17 + Redis + Ollama + uvicorn) para encender y apagar juntos, desde Inicio, la bandeja, la paleta Ctrl+K y la CLI. Encender respeta el orden de dependencias del supervisor.

**D29 · Tareas programadas por sitio:** expresión cron de 5 campos (con ayudas: "cada minuto", "cada hora", "a las 3:00") y un comando del proyecto (lista de argumentos, sin shell; p. ej. `php artisan schedule:run`), con historial de las 50 últimas ejecuciones, registro y aviso al fallar (D6). Solo corren con la app abierta; se pueden pausar. Se guardan en el sitio (y en `wolfcore.yml` si el usuario lo pide). Intérprete cron propio y pequeño, probado con casos de borde. **(decisión propia)**

**D30 · Limpieza de versiones sin uso:** lista de versiones instaladas que ningún sitio, instancia, predeterminada, plantilla ni workspace usa, con tamaño en disco; vista previa, confirmación y borrado solo de `bin/<servicio>/<versión>`, **nunca de `data/`**. La predeterminada y las versiones encendidas no se pueden marcar.

**Aceptación del bloque 6:** exportar el perfil del usuario y verlo importado en una carpeta temporal con la vista previa correcta; un workspace enciende y apaga su conjunto; `schedule:run` corre cada minuto y su fallo avisa; limpiar una versión sin uso libera espacio y no toca datos.

### Bloque 7 — CLI `wolf` (D31–D32)

**D31 · Servidor de órdenes en la app:** HTTP en `127.0.0.1` y puerto aleatorio con un **token** de 32 bytes, escritos en `<datos>/run/cli.json` restringido al usuario (`Plataforma.restringirAlUsuario`); se regenera en cada arranque. Mismo patrón que el MCP de B, pero con una lista blanca propia de órdenes y validación `zod` de cada argumento. Las órdenes que cambian algo pasan por las mismas confirmaciones que la interfaz cuando la interfaz las pide (p. ej. `share` muestra el aviso de exposición y requiere `--si`). **(decisión propia: HTTP local con token y no una tubería con nombre, para reutilizar lo probado en el MCP y servir igual en Linux y macOS.)**

**D32 · Cliente `wolf`:** script Node empaquetado con la app que se ejecuta con el Electron de la app como Node (`ELECTRON_RUN_AS_NODE=1`) mediante `wolf.cmd` en `<datos>/bin/cli/` (agregado al PATH del usuario con confirmación, como php y composer). Órdenes: `status`, `link [carpeta]`, `park [carpeta]`, `use php@<v>` (en la carpeta actual o `--global`), `secure <sitio>`, `share <sitio> [--proveedor]`, `open <sitio>`, `logs <sitio> [-f]`, `doctor`, `start|stop [workspace|servicio]`. Salida legible y `--json`; códigos de salida estables; textos en el idioma de la app. Si la app no está abierta, lo dice y ofrece `--abrir` (lanza la app con `--iniciar-todo`, que ya existe).

**Aceptación del bloque 7:** las órdenes de §1 funcionan desde PowerShell y Git Bash; sin token o con uno viejo, error claro; ninguna orden imprime secretos.

### Bloque 8 — Utilidades del equipo (D33–D37)

**D33 · Herramientas pequeñas:** QR de Wi-Fi (`WIFI:T:WPA;S:…;P:…;;`, con el aviso de que el QR contiene la clave), imagen → `.ico` (varios tamaños, PNG dentro de ICO) y → `.png`, comprimir imágenes (JPEG/WebP con calidad), comprimir carpeta o archivos a `.zip` (con `yazl`, MIT) y "optimizar PDF" (re-guardar con `pdf-lib`, MIT, flujos de objetos). Todas muestran **peso antes y después** y nunca sobrescriben el original (archivo nuevo junto a él).

**D34 · Conversor de documentos local:** docx → HTML/Markdown (`mammoth`, BSD-2), xlsx ↔ csv (`exceljs`, MIT), md → HTML/PDF (markdown-it + `printToPDF` de Electron), pdf → texto (`pdfjs-dist`, Apache-2.0), HTML → PDF. Formatos que solo LibreOffice convierte bien (odt, pptx, doc) aparecen **solo si LibreOffice está instalado**, con aviso; WolfCore Dev no lo instala. Límites contra archivos maliciosos (tamaño, entradas del ZIP, tiempo) y conversión en un proceso aparte (`utilityProcess`) para no colgar la app. Nada sale del equipo.

**D35 · Captura de pantalla:** atajo global configurable (por defecto `Ctrl+Shift+S`, se puede desactivar), región, ventana o pantalla completa con `desktopCapturer`; editor rápido (recuadro, flecha, línea, resaltador, texto, pixelar, deshacer); copiar, guardar PNG/JPG y "Enviar al conversor de imágenes" (D33). 100 % local, sin subida ni telemetría. El acceso a la captura pasa por un método de `Plataforma` (`capturaDisponible()`) porque en macOS (E) hace falta un permiso.

**D36 · Optimizador de RAM** en la barra superior, con tres modos que siempre **muestran la lista antes de actuar**:
- **Liviano:** reduce lo propio que se puede reducir sin cortar nada: vacía cachés de la app (sesión de Electron, cachés del núcleo) y baja a 1 el pool de PHP de las ramas sin peticiones en 10 min.
- **Moderado:** además propone **detener** servicios, instancias y procesos de proyecto de WolfCore Dev inactivos (sin conexiones ni peticiones en 15 min), marcados uno por uno.
- **Profunda:** además lista los programas del usuario que más memoria usan y ofrece **pedirles que se cierren** (cerrar la ventana principal, como al pulsar la X), uno por uno y con confirmación. **Nunca** procesos del sistema, de servicios de Windows, de otros usuarios, de FlyEnv, del antivirus ni de WolfCore Dev; nunca se matan. **(decisión propia: no se usa `EmptyWorkingSet` ni "limpiadores" de memoria del sistema, que solo mueven páginas a disco y empeoran el rendimiento.)**

**D37 · Limpieza de disco:** categorías con vista previa, tamaño y confirmación, solo **rutas seguras conocidas** (vía `Plataforma.rutasLimpieza()`): `%TEMP%` del usuario (archivos de más de 24 h y no en uso), cachés de Chrome, Edge, Brave y Firefox (**solo con el navegador cerrado**; nunca perfiles, cookies, contraseñas ni historial), cachés y descargas de WolfCore Dev, registros rotados de más de 30 días. **Prefetch** opcional, apagado por defecto, con aviso y elevación. No se borra nada fuera de las rutas listadas; los enlaces y uniones no se siguen; un archivo en uso se salta.

**Aceptación del bloque 8:** cada utilidad probada con archivos de muestra; el optimizador nunca lista un proceso del sistema ni de FlyEnv; la limpieza de disco con el navegador abierto salta su caché.

### Bloque 9 — Cierre de la etapa (D38–D40)

**D38 · Pulido general y segunda auditoría de diseño:** se aplican los hallazgos medios y bajos de D1, el agente de diseño revisa todas las pantallas nuevas de D en los dos temas y los cuatro idiomas (el francés y el portugués alargan los botones: se revisa que nada se corte ni se superponga), estados vacíos y de error en todas las vistas nuevas, y robustez (errores de red, permisos, disco lleno) en los flujos de D.

**D39 · Integración real, instalador y README:** pruebas de integración reales de la etapa en Windows, instalador NSIS probado instalado, README al día.

**D40 · Aceptación con los 6 proyectos y "PC nuevo":** recorrido de los 6 proyectos reales del usuario con todo lo nuevo, y la prueba de "PC nuevo": exportar el perfil real (sin secretos), importarlo con `WOLFCORE_DATOS` apuntando a una carpeta limpia, descargar versiones con huella, y comprobar que los 6 responden. La carpeta real `%LOCALAPPDATA%\WolfCoreDev` solo se lee durante la exportación; nunca se escribe.

## 4. Restricciones

- **CI** en verde en Windows, macOS y Ubuntu para cerrar cada tarea.
- **Repo público:** nunca se confirman `.env`, respaldos, perfiles exportados, datos de clientes ni claves reales; las claves de prueba son obviamente falsas (`sk-prueba-falsa-0000…`).
- **Secretos** (token de GitHub, claves de IA, claves SMTP, tokens de túneles): solo en `AlmacenSecretos` (`safeStorage`); nunca en config, perfiles, plantillas, URLs, logs, eventos ni el renderer (que solo ve "configurada" y los 4 últimos caracteres). Nunca se imprimen.
- **Pruebas:** nunca tocan el `hosts` real, el almacén de certificados, el PATH del usuario, la carpeta de datos real, los perfiles reales de navegadores ni procesos reales ajenos.
- **FlyEnv:** nunca se detienen, matan ni reconfiguran sus procesos.
- **Datos reales** en `%LOCALAPPDATA%\WolfCoreDev`: nunca se pierden. Toda operación sobre bases o datos (restablecer contraseñas, importar, restaurar instantáneas, limpieza de disco, limpieza de versiones, optimizador de RAM, importar perfil) muestra antes una vista previa, pide confirmación y hace copia cuando corresponde.
- **Descargas** de fuentes oficiales, con huella verificada (o firma desde D10), redirecciones validadas en cada salto y hosts explícitos sin comodines.
- **Textos** en todos los idiomas soportados: es y en hasta D4; es, en, pt y fr desde D4.
- **Plataforma:** lo nuevo dependiente del SO va detrás de `Plataforma` (la prueba guardián de C sigue vigente).
- **Rama:** todo en `feat/etapa-c`; nada se fusiona a `main`.

## 5. Enfoques considerados

| Enfoque | A favor | En contra | Elegido |
|---|---|---|---|
| **A. Bloques por dependencia y valor, con D1–D8 primero** (pulido y arrastre de C; luego bases transversales; luego proyectos; editor/BD/correo; compartir; entorno; CLI; utilidades; cierre) | Respeta la numeración del roadmap; las bases (foco visual, PGP) llegan antes que las pantallas y descargas que las usan; la CLI llega cuando ya existen workspaces y túneles nuevos; cada bloque se acepta solo | Las utilidades del equipo (muy pedidas) llegan tarde | **Sí** |
| B. Por capa (todo el núcleo, después todo el IPC, después la interfaz) | Revisión del núcleo concentrada | En B ya obligó a una tarea de IPC enorme; nada usable hasta el final | No |
| C. Utilidades primero (RAM, disco, captura, conversor) | Lo más visible para el usuario | Son las de más riesgo (procesos y disco) y no dependen de nada: se revisan mejor cuando el patrón de vista previa y confirmación ya está asentado en importar, instantáneas y limpieza de versiones | No |
| D. Partir D en dos etapas (D y D') | Etapas más cortas | El usuario pidió no omitir ni partir etapas, solo ordenarlas; los bloques dan el mismo punto de revisión | No |

## 6. Calidad

- Rebanadas verticales (núcleo + IPC + interfaz) como en C; donde una tarea sería demasiado grande, núcleo e interfaz en dos tareas seguidas.
- Servidores HTTP, SMTP, FTP y CLI falsos en las pruebas; ninguna prueba descarga de sitios oficiales salvo las de integración marcadas `skipIf` sin red.
- **Revisión opus completa** en las tareas de descargas, hashes y firmas, datos, seguridad, disco y procesos del sistema; **revisión ligera** en el resto (la lista está en el plan).
- Cada bloque cierra con su aceptación (recorrido en dev en los dos temas, pruebas del bloque y CI); la etapa cierra con D39 y D40.

## 7. Decisiones propias (para revisar)

1. **Orden en 9 bloques** (§5, enfoque A), manteniendo D1–D8 del roadmap.
2. **"Solo versiones":** la palabra "rama" desaparece de la interfaz fuera de Git; el código interno no cambia.
3. **Desplegables:** envoltorios `Desplegable.vue` y `MenuDesplegable.vue` sin volteo y prueba guardián.
4. **Presets de IA** solo con URL compatible verificada en la documentación oficial; filtro "Solo gratuitos".
5. **Criterios de viabilidad de agentes** (oficial, Windows nativo, MCP HTTP con token por variable, configuración documentada).
6. **Portugués de Brasil** (pt-BR) y francés de Francia (fr-FR).
7. **Rust con rustup** en la carpeta de datos; el Doctor informa si falta el enlazador MSVC.
8. **Ruby, Perl y Erlang/Elixir a F** por no tener `.zip` oficial con huella fuerte para Windows.
9. **Salida con código 0 = terminó bien** (estado `apagado` y aviso `proceso-terminado`), en vez de `error`.
10. **Foco visual (D9) y firmas PGP (D10) antes** de las pantallas y descargas nuevas.
11. **Verificador OpenPGP v4 propio y mínimo** sobre `node:crypto`, falla cerrado, claves fijadas y script de actualización.
12. **WordPress con SHA-1** tratado como huella débil (pide confirmación).
13. **Plantillas** con esquema sin datos y exclusiones obligatorias.
14. **Importar** vincula en su lugar y vuelca bases desde un servidor que enciende el usuario.
15. **Acceso a Adminer/phpMyAdmin con token de un solo uso** canjeado en el servidor.
16. **Auditoría de contraseñas** con 200 contraseñas comunes embebidas y formatos limitados; nunca se muestra cuál coincidió.
17. **SMTP con `nodemailer`**; Mailcatcher fuera.
18. **Tailscale solo si ya está instalado**; WolfCore Dev no instala servicios del sistema.
19. **LAN con puerto propio por sitio** y servidor temporal solo para `ca.crt`.
20. **Perfil sin secretos**; CA opcional y cifrada con frase (scrypt + AES-256-GCM).
21. **Intérprete cron propio** pequeño y probado.
22. **CLI por HTTP local con token** (como el MCP) y `wolf.cmd` sobre el Electron de la app.
23. **Optimizador de RAM sin "limpiadores" de memoria** y sin matar procesos: solo cerrar con confirmación.
24. **Apache y Caddy siguen en F:** el roadmap pedía evaluar adelantarlos; D ya tiene 40 tareas y ninguno de los 6 proyectos del usuario depende de `.htaccess` (todos usan Nginx desde B).
25. **`WOLFCORE_DATOS`** para arrancar con otra carpeta de datos (y otro `userData`), sin tocar la real.
26. **Nombre de la carpeta de auditorías:** `docs/superpowers/auditorias/` (se confirma en el repo porque no contiene datos privados; las capturas de pantalla, si las hay, no se confirman).
