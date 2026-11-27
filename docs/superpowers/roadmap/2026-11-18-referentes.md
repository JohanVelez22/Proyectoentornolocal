# Referentes de entornos de desarrollo local: estudio de funciones para WolfCore Dev

Fecha: 2026-11-18. Alcance: estudio de funciones (no se copia código de nadie).

Fuentes y fiabilidad. Hubo acceso web (WebSearch/WebFetch). Verificado en web: ServBay (dashboard), Herd/Herd Pro (resumen), FlyEnv, EnvKit, Flock, Lerd. El resto (Laragon, DBngin, Local, WordPress Studio, MAMP, XAMPP, Valet y detalles finos de ServBay/Herd) viene "del conocimiento, sin verificar" y se marca con (cv). Los precios cambian: revisar antes de decidir nada.

---

## 1. Tabla por herramienta

### ServBay
| Aspecto | Detalle |
|---|---|
| Destacadas | Dashboard con gráficas de carga CPU, historial de uso de CPU, presión de memoria, memoria de la aplicación, memoria wired/comprimida, almacenamiento y red (verificado en docs/release 1.2.1). Es memoria/CPU del sistema y de ServBay en conjunto, no desglose por servicio (la doc no lo menciona). |
| | Panel de servicios con iniciar/detener por servicio y ver logs (verificado) |
| | Múltiples versiones de PHP, Node, Python, Go, Java, etc. simultáneas (cv) |
| | Muchas bases/servicios: MySQL, MariaDB, PostgreSQL, MongoDB, Redis, Memcached, Kafka, RabbitMQ, Elasticsearch… (cv) |
| | HTTPS con CA propia, DNS local, dominios personalizados y túneles/Cloudflare (cv) |
| | Copia de seguridad/restauración de todo el entorno y migración (cv) |
| | Config por sitio con "Website" y plantillas de proyecto (WordPress, Laravel…) (cv) |
| Licencia/precio | Gratis en edición Community; Pro/Teams de pago (cv) |
| Plataformas | macOS, Windows (desde 2025), Linux (cv) |

### FlyEnv (antes PhpWebStudy)
| Aspecto | Detalle |
|---|---|
| Destacadas | Módulos: Apache, Nginx, Caddy, Tomcat, PHP, Node, Bun, Deno, Python, Java, Go, Ruby, Rust, MySQL, PostgreSQL, MariaDB, MongoDB, Redis, RabbitMQ, Mailpit, Elasticsearch (verificado) |
| | Servidor DNS integrado para dominios personalizados + SSL de confianza automático (verificado) |
| | Aislamiento por proyecto y cambio automático de runtime (verificado) |
| | Gestor de versiones: instala/desinstala runtimes desde la app, también por Homebrew/Macports (cv) |
| | Herramientas integradas (formateadores, hash, base64, etc.), editor de archivos de config de cada servicio, "AI" integrado (cv) |
| | Multiplataforma sin Docker (verificado) |
| Licencia/precio | Código abierto BSD-3; versión gratuita con límite de ~3 sitios sin licencia (verificado en reseña) |
| Plataformas | Windows, macOS, Linux |

### Flock
| Aspecto | Detalle |
|---|---|
| Destacadas | Dominios .test con HTTPS de confianza, PHP por proyecto (desde 8.1), procesos nativos sin Docker (verificado) |
| | Servidor MCP para que agentes (Claude Code) lean sitios, correo, dumps y errores (verificado) |
| | Visor de dumps, correo y errores integrado (verificado, vía MCP) |
| | App de bandeja/barra de menú (verificado) |
| Licencia/precio | Gratis, AGPL-3.0, sin cuenta (verificado) |
| Plataformas | macOS 15+ Apple Silicon; Windows 10/11 x64 (verificado) |

### EnvKit
| Aspecto | Detalle |
|---|---|
| Destacadas | Nginx o Apache por sitio; PHP 7.4+ aislado por proyecto con Xdebug bajo demanda (verificado) |
| | MySQL/MariaDB, PostgreSQL, MongoDB, Redis con UIs de administración (phpMyAdmin, pgweb, mongo-express) (verificado) |
| | Inspección en vivo de dumps, consultas SQL y colas de jobs (verificado) |
| | Reverb, gestión de cron jobs, Node con hot reload, Mailpit (verificado) |
| | Servidor MCP propio para diagnóstico por IA (verificado) |
| | Importa proyectos de Laragon; autoactualización (verificado) |
| Licencia/precio | Gratis, propietario, beta, sin cuenta (verificado) |
| Plataformas | Windows 10/11; macOS 12+ Apple Silicon (verificado) |

### Laragon
| Aspecto | Detalle |
|---|---|
| Destacadas | Muy ligero y portable; arranque rápido; Apache/Nginx, MySQL/MariaDB/PostgreSQL, Redis, Mailpit (cv) |
| | Hosts virtuales automáticos `proyecto.test`; "Quick app": crea Laravel, WordPress, Symfony, Drupal, etc. con un clic (cv) |
| | Menú contextual de apps/PHP/Node/Python; terminal Cmder con PATH ya configurado (cv) |
| | Compartir sitio vía ngrok/Cloudflare, "Laragon Pro" para servicios (cv) |
| | Modular: añadir cualquier binario como servicio personalizado (cv) |
| Licencia/precio | Gratis (Full) con donación; Laragon Pro/Lifetime de pago (cv) |
| Plataformas | Windows |

### Laravel Herd (incl. Herd Pro)
| Aspecto | Detalle |
|---|---|
| Destacadas (gratis) | PHP, Nginx, DNS, Node, Composer, instalador Laravel, integración con Forge, Expose para compartir (verificado, con discrepancias entre fuentes) |
| Herd Pro | Dumps interceptados (dump/dd) en ventana propia (verificado) |
| | Servidor de correo local y visor de mail (verificado) |
| | Visor de logs (verificado) |
| | Servicios: MySQL, MariaDB, PostgreSQL, Redis, Typesense, Meilisearch, MinIO, Reverb (verificado) |
| | Herd Pro además: depuración Xdebug integrada, visor de consultas/ jobs/ HTTP (cv), perfilado (cv) |
| | Crear sitio nuevo con starter kits (Livewire, Inertia/React/Vue) desde la UI (cv) |
| | "Aislado" por sitio (PHP por sitio), `.herd.yml` por proyecto (cv) |
| Licencia/precio | Gratis + Pro de pago (~$99 primer año; fuentes discrepan, equipos $299/10 licencias) |
| Plataformas | macOS, Windows (Linux no) |

### Lerd
| Aspecto | Detalle |
|---|---|
| Destacadas | Nginx, PHP-FPM y servicios como contenedores Podman rootless (verificado) |
| | `lerd link` / `lerd park`: registrar un proyecto o una carpeta entera (verificado) |
| | PHP/Node por proyecto, TLS con un comando, FrankenPHP como alternativa a FPM (verificado) |
| | UI web, panel de terminal (TUI) y servidor MCP (verificado) |
| Licencia/precio | Código abierto (cv: MIT) |
| Plataformas | Linux, macOS; Windows vía WSL2 (beta) (verificado) |

### DBngin
| Aspecto | Detalle |
|---|---|
| Destacadas | Un clic para crear servidores MySQL, PostgreSQL, Redis (cv) |
| | Varias versiones en paralelo, puertos distintos por instancia (cv) |
| | Copias/restauración de instancias, "tomar un snapshot" (cv) |
| | Importación de datos y conexión directa a TablePlus (cv) |
| Licencia/precio | Gratis (cv) |
| Plataformas | macOS (cv; hay beta Windows) |

### Local (Local WP, WP Engine)
| Aspecto | Detalle |
|---|---|
| Destacadas | Crear sitio WordPress en minutos con asistente y plantillas ("Blueprints") (cv) |
| | Live Links (compartir por túnel), SSL de un clic, Mailpit, acceso a DB con Adminer (cv) |
| | Push/Pull con WP Engine/Flywheel, clonar sitio, exportar/importar ZIP (cv) |
| | Selección de PHP/MySQL/servidor web por sitio, Xdebug por sitio, WP-CLI en terminal (cv) |
| | Visor de logs de sitio y "Site Shell" (cv) |
| Licencia/precio | Gratis (cv) |
| Plataformas | Windows, macOS, Linux |

### WordPress Studio (Automattic)
| Aspecto | Detalle |
|---|---|
| Destacadas | Sitios WP muy rápidos con PHP WASM / SQLite (sin servidor DB) (cv) |
| | Sitios de vista previa (preview sites) subidos a WordPress.com para compartir (cv) |
| | Sincronización con WordPress.com/Pressable, importar/exportar (cv) |
| | CLI y asistente IA integrado, integración con Blueprints (cv) |
| Licencia/precio | Gratis, código abierto GPL (cv) |
| Plataformas | macOS, Windows, Linux |

### MAMP / MAMP PRO
| Aspecto | Detalle |
|---|---|
| Destacadas | Apache/Nginx + MySQL + PHP con múltiples versiones (cv) |
| | PRO: hosts virtuales ilimitados, DNS dinámico local, SSL, Postfix (correo), cambio rápido de PHP por host (cv) |
| | PRO: editor de plantillas de configuración (httpd.conf/php.ini/my.cnf) con variables, "snapshots" de configuración (cv) |
| | PRO: acceso desde otros dispositivos de la LAN, túnel (cv) |
| Licencia/precio | MAMP gratis; PRO de pago (~$80) (cv) |
| Plataformas | macOS, Windows |

### XAMPP
| Aspecto | Detalle |
|---|---|
| Destacadas | Apache, MariaDB, PHP, Perl, phpMyAdmin, FileZilla FTP, Mercury/ Tomcat (cv) |
| | Panel de control simple con botones Start/Stop, Config y Logs por servicio (cv) |
| | Editor rápido de php.ini/httpd.conf/my.ini desde el panel (cv) |
| Licencia/precio | Gratis (GPL) (cv) |
| Plataformas | Windows, macOS, Linux |

### Laravel Valet
| Aspecto | Detalle |
|---|---|
| Destacadas | `valet park`/`link`, dominios `.test` con dnsmasq (cv) |
| | `valet secure` (TLS), `valet share` (Expose/ngrok/Cloudflare), `valet isolate` PHP por sitio (cv) |
| | Drivers personalizados para frameworks (Laravel, WordPress, CodeIgniter, Symfony…) (cv) |
| | `valet use php@x`, `valet open`, `valet which`, `valet paths`, `valet log` (cv) |
| Licencia/precio | Gratis, MIT (cv) |
| Plataformas | macOS (Linux/Windows no oficiales: Valet Linux, Laravel Valet para Windows) |

---

## 2. Funciones candidatas (deduplicadas) que WolfCore Dev NO tiene ni planifica

Leyenda: Esfuerzo S/M/L. Etapa propuesta B, C o D (nueva). Prioridad: **MUST** (imprescindible para este usuario) o NICE.

### 2.1 Observabilidad y depuración

1. **Panel de recursos/rendimiento (ServBay)**. Qué es: dashboard con CPU global, memoria, disco y red, más CPU/RAM/puertos/PID/uptime por servicio y por pool php-cgi gestionado por WolfCore (esto último supera a ServBay, que según su doc solo muestra la memoria de ServBay en conjunto, no por servicio). Con histórico corto (sparklines), alertas de umbral y botón "reiniciar servicio pesado". Qué muestra ServBay: carga CPU, historial CPU, presión de memoria, memoria de la app, wired/comprimida, almacenamiento, red. Herramientas: ServBay (verificado), XAMPP (solo estado). Valor: alto, ve de un vistazo cuánto consumen Postgres, Ollama, MySQL y los php-cgi. Esfuerzo M. Etapa B. **MUST**. Rationale: ya se gestionan los procesos, solo hay que muestrearlos (pidusage/systeminformation).
2. **Visor de logs unificado**. Qué es: leer en vivo los logs de Nginx, PHP, servicios, laravel.log, ci logs y de cada túnel, con filtros por nivel/sitio, buscar, "seguir cola" y abrir archivo. Herramientas: Herd Pro, Local, XAMPP, ServBay, EnvKit. Valor: alto. Esfuerzo S-M. Etapa B. **MUST**.
3. **Captura de dump()/dd()/var-dumper (Herd Pro/Flock/EnvKit)**. Qué es: interceptar `dump()` mediante auto_prepend/ VarDumper server (`VAR_DUMPER_FORMAT=server`) y mostrar en una ventana con estructura, archivo y línea. Debe incluir un equivalente para Python (print/ `icecream`) y CI3 (helper). Valor: alto. Esfuerzo M. Etapa B. **MUST**.
4. **Inspector de consultas SQL, jobs/colas y peticiones HTTP (EnvKit, Herd Pro)**. Qué es: listar queries lentas con tiempos, jobs encolados/fallidos y requests recibidos. Valor: medio-alto en Laravel. Esfuerzo L (requiere paquete/auto-prepend por framework). Etapa D. NICE.
5. **Xdebug por sitio con interruptor (EnvKit, Local, Herd Pro)**. Qué es: activar/desactivar Xdebug por sitio y versión de PHP desde la UI, con modo (debug/profile/coverage), puerto y generación de launch.json para VS Code/PhpStorm. Valor: alto. Esfuerzo S-M. Etapa B. **MUST**.
6. **Perfilado (Xdebug profiler / SPX / Blackfire-like) con visor de cascada (Herd Pro cv)**. Esfuerzo L. Etapa D. NICE.
7. **Visor de errores de PHP y página de error propia**. Qué es: recolectar errores/excepciones por sitio con notificación en bandeja. Herramientas: Flock, EnvKit. Esfuerzo S (se apoya en el visor de logs). Etapa B. NICE.
8. **Notificaciones nativas y centro de eventos** (servicio caído, puerto ocupado, certificado por caducar, túnel caído). Herramientas: ServBay, Herd. Esfuerzo S. Etapa B. **MUST** (barato y evita fallos silenciosos).

### 2.2 Configuración de PHP y servidores

9. **Editor de php.ini por versión con plantillas y validación**. Qué es: editar `php.ini` (con diff respecto al por defecto), cambios rápidos de memory_limit, upload_max_filesize, max_execution_time, timezone, errores, y reinicio de pools. Herramientas: XAMPP, MAMP PRO, Laragon, FlyEnv, ServBay. Esfuerzo S. Etapa B. **MUST**.
10. **Gestor de extensiones PHP**. Qué es: activar/desactivar extensiones por versión (pdo_pgsql, intl, gd, imagick, redis, xdebug, sqlsrv, opcache/JIT) e instalar DLLs desde PECL/ binarios compatibles (TS/NTS). Herramientas: ServBay, Laragon, MAMP, FlyEnv. Esfuerzo M. Etapa B. **MUST** (CI3/legacy necesita extensiones concretas).
11. **Editor de configuración Nginx por sitio con vista previa y prueba (`nginx -t`)**, snippets reutilizables, plantilla de vhost, rollback. Herramientas: MAMP PRO (plantillas), FlyEnv, ServBay. Esfuerzo M. Etapa B. NICE-MUST (los sitios "custom" ya existen).
12. **PHP-FPM/FrankenPHP/Octane como modo de ejecución** (Lerd: FrankenPHP; Laravel Octane en Herd/ Laragon). Valor: medio. Esfuerzo M-L. Etapa C. NICE.
13. **Aislamiento de sitio (site isolation)**: PHP-versión, php.ini, variables de entorno, open_basedir y pool/usuario separados por sitio; `.test` solo accesible en loopback. Herramientas: Valet (isolate), Herd, EnvKit, FlyEnv. Esfuerzo S-M (ya hay pool por sitio; añadir ini por pool). Etapa B. **MUST**.
14. **Apache/Caddy** ya en C; añadir **soporte para Apache `.htaccess` real** en sitios CI/WordPress vía Apache opcional. Esfuerzo L. Etapa C. NICE.
15. **Variables de entorno por sitio y globales (gestor `.env`)**: ver/editar `.env` con enmascarado de secretos, plantillas `.env.example`, diff, y variables inyectadas a php-cgi/terminal. Herramientas: Herd, EnvKit, FlyEnv. Esfuerzo S-M. Etapa B. **MUST**.

### 2.3 Proyectos, plantillas y configuración

16. **Archivo de configuración por proyecto (`wolfcore.yml` / `.herd.yml`)**: versión de PHP, Node/Python, servicios requeridos, hosts adicionales, `.env` de plantilla, tareas al abrir (queue:work, npm run dev), tipo de sitio. Se versiona en Git y permite reproducir el entorno en otro equipo. Herramientas: Herd (.herd.yml, cv), Lando/DDEV (referencia), Valet (.valetrc, cv), FlyEnv (cv). Esfuerzo M. Etapa B. **MUST**.
17. **Creación con un clic de proyectos Laravel/WordPress/CI/FastAPI (Quick app / starter kits)**. Qué es: asistente "Nuevo proyecto": Laravel (con starter kit Livewire/Inertia/Breeze), WordPress (descarga + wp-cli + DB + usuario admin), CodeIgniter 3/4, FastAPI (venv + uvicorn + Postgres+pgvector), Symfony, static. Crea sitio, base de datos, `.env`, HTTPS, y abre el IDE. Herramientas: Laragon, Herd, Local, ServBay, FlyEnv. Esfuerzo M. Etapa B. **MUST**.
18. **Plantillas de sitio (site templates/blueprints)**: guardar un sitio existente como plantilla (config + esquema DB + extensiones) y crear nuevos a partir de ella. Herramientas: Local (Blueprints), WordPress Studio, MAMP PRO. Esfuerzo M. Etapa B/C. **MUST** (para repetir arranques).
19. **Importar proyectos desde Laragon/XAMPP/Herd/Valet/MAMP** (detectar carpetas `www`, vhosts, DBs). Herramientas: EnvKit (Laragon). Esfuerzo S-M. Etapa B. NICE-MUST (usuario Windows con historial).
20. **Acciones rápidas por sitio**: abrir en IDE (VS Code/PhpStorm/Cursor), carpeta, terminal, navegador, DB; "park" de una carpeta (todos los subdirectorios son sitios automáticos, como Valet/Herd/Lerd `park`). Esfuerzo S. Etapa B. **MUST** el park/autodetección; el resto NICE.
21. **Soporte completo WordPress** (wp-cli, búsqueda/reemplazo de URLs en DB al cambiar dominio/túnel, clonar sitio, export/import ZIP, multisitio). Herramientas: Local, WordPress Studio, Laragon, ServBay, MAMP. Valor: bajo para este usuario salvo clientes WP. Esfuerzo M. Etapa D. NICE.
22. **Detección de framework y "drivers"** extensibles (Valet): reglas por tipo de sitio como plugin/JSON. Esfuerzo M. Etapa C. NICE.

### 2.4 Datos y servicios

23. **Perfiles/respaldos del entorno completo**: exportar/importar toda la configuración (sitios, versiones, certificados, `.env`, config de servicios, opcionalmente DBs) como un archivo para migrar de PC o volver atrás; snapshots antes de actualizar versiones. Herramientas: ServBay (backup/migración), MAMP PRO (snapshots de config), DBngin (snapshots de instancias), FlyEnv (cv). Esfuerzo M. Etapa B. **MUST**.
24. **Perfiles/escenarios de arranque ("workspaces")**: conjuntos de servicios+sitios que se encienden juntos (p.ej. "Bot FastAPI": Postgres+Redis+Ollama; "Cliente Laravel": MySQL+Mailpit). Menos RAM. Herramientas: Laragon (menú), FlyEnv (cv). Esfuerzo S-M. Etapa B. **MUST**.
25. **Múltiples instancias/versiones de un servicio en paralelo con puertos distintos** (MySQL 8.0 y 8.4; Postgres 16 y 17) y migración entre ellas. Herramientas: DBngin, ServBay, FlyEnv, Herd. Esfuerzo M. Etapa B/C. NICE-MUST.
26. **Snapshots de bases de datos** (copia instantánea antes de migrar, rollback con un clic). Herramientas: DBngin (cv), Local. Esfuerzo M (ya hay backup/restore). Etapa B. NICE.
27. **Visor/Explorador de datos propio (más ligero que Adminer)**: tablas, consultas, EXPLAIN, vectores de pgvector. Herramientas: EnvKit (pgweb, mongo-express), Herd Pro. Esfuerzo L. Etapa D. NICE.
28. **Servicios adicionales**: Meilisearch, Typesense, MinIO, RabbitMQ, Elasticsearch/OpenSearch, Memcached, Kafka, Reverb (WebSocket), Soketi. Herramientas: Herd Pro, ServBay, FlyEnv. Ya parte en C; añadir Reverb (Laravel) y RabbitMQ. Esfuerzo S-M cada uno con un instalador genérico. Etapa C. NICE (Reverb: MUST si usa broadcasting).
29. **Gestor de colas/cron/scheduler**: ejecutar `schedule:run` cada minuto, `queue:work`/Horizon como proceso supervisado con reinicio automático, cron jobs editables por sitio. Herramientas: EnvKit, Laragon (Pro, cv), Herd (cv). Esfuerzo M. Etapa B. **MUST** (Laravel).
30. **Procesos de usuario supervisados ("services personalizados")**: añadir cualquier comando (uvicorn del bot, npm run dev, Celery) como servicio con auto-reinicio, logs y puerto. Herramientas: Laragon (binarios), Valet (no), Lerd, FlyEnv. Esfuerzo M. Etapa B. **MUST** (el bot FastAPI).

### 2.5 Compartir y red

31. **Compartir sitio con otros túneles**: ngrok, Expose (Beyond Code), localtunnel, Tailscale Funnel/Serve, bore/frp, además de Cloudflare ya existente; con proveedor seleccionable por sitio. Herramientas: Herd (Expose), Laragon (ngrok), Valet (share), Local (Live Links), Studio (preview sites). Esfuerzo S-M por proveedor. Etapa B (junto a nombrados de Cloudflare). **MUST** (el usuario pidió "sharing via other tunnels").
32. **Acceso desde LAN / dispositivos móviles**: abrir el sitio con IP local + QR, con certificado instalable en el móvil; pruebas responsive reales. Herramientas: MAMP PRO, Valet (no), Herd (cv), Local (cv). Esfuerzo S-M. Etapa B/C. NICE (el generador de QR ya está en Herramientas).
33. **Inspector de webhooks/peticiones entrantes** (como ngrok inspect / Expose dashboard): ver y reenviar peticiones que llegan por el túnel. Esfuerzo M. Etapa D. NICE.
34. **Servidor de correo SMTP local avanzado**: ya está Mailpit; añadir envío de prueba, captura por sitio y atajo `MAIL_*` automático en `.env`. Esfuerzo S. Etapa B. NICE.
35. **Integración con Forge y con VPS/despliegue** (Herd): listar servidores, desplegar, ver logs, sincronizar `.env`; despliegue SFTP/rsync/Git. Esfuerzo L. Etapa D. NICE.

### 2.6 Experiencia, mantenimiento y diagnóstico

36. **Verificación de salud / "Doctor"**: detectar puertos 80/443/3306/5432 ocupados (IIS, Skype, otro XAMPP), antivirus, certificados caducados, hosts corrupto, PATH duplicado, VC++ redistributable ausente, WSL/Hyper-V reservando puertos; reparaciones guiadas. Herramientas: Herd (cv), Flock (aviso de puertos), Laragon. Esfuerzo M. Etapa B. **MUST** (Windows).
37. **Gestor de versiones de runtimes con descarga desde la app** (PHP, Node, Python, Composer, extensiones) con verificación SHA y limpieza de versiones no usadas; actualizaciones de servicios con respaldo previo. Herramientas: FlyEnv, ServBay, Herd. Esfuerzo M. Etapa B (ya parcialmente por Node/Python). **MUST**.
38. **Línea de comandos `wolf` (CLI)** equivalente a `valet`/`lerd`: `wolf link`, `park`, `use php@8.3`, `secure`, `share`, `open`, `logs`, `status`; hablando con la app por IPC. Herramientas: Valet, Herd, Lerd, Flock/Studio (CLI). Esfuerzo M. Etapa B. **MUST** (se usa desde la terminal por sitio).
39. **Servidor MCP ampliado**: la B ya planea MCP; añadir herramientas de lectura de dumps/logs/errores/mail/queries y de escritura (crear sitio, activar Xdebug). Herramientas: Flock, EnvKit, Lerd. Esfuerzo M. Etapa B. NICE (ya planificado, solo ampliar).
40. **Paleta de comandos global (Ctrl+K) y atajos globales**; búsqueda de sitios, servicios y acciones. Esfuerzo S. Etapa B. NICE.
41. **Modo portable / ejecución desde carpeta (Laragon, XAMPP)** y "limpiar al desinstalar" (revertir hosts, CA, PATH). Esfuerzo M. Etapa C. NICE (la reversión limpia es recomendable).
42. **Presets de recursos/ahorro de energía**: detener servicios inactivos tras N minutos, arranque perezoso de Postgres/MySQL al primer uso, límites de memoria por proceso. Herramientas: ServBay (control), Laragon (ligereza). Esfuerzo M. Etapa C. NICE.
43. **Pruebas y calidad por sitio**: ejecutar PHPUnit/Pest/pytest con salida en panel, cobertura con Xdebug, PHPStan/Pint/Rector, `composer audit`. Herramientas: Herd (cv), EnvKit (cv). Esfuerzo M. Etapa D. NICE.
44. **Importación de certificados de confianza para Firefox/Node/Python/Java** (CA propia: truststore NSS, `NODE_EXTRA_CA_CERTS`, `REQUESTS_CA_BUNDLE`). Esfuerzo S-M. Etapa B. **MUST** (el bot FastAPI llamando a `https://*.test`).
45. **Wildcard/subdominios y multi-tenant (`*.proyecto.test`)** con certificado comodín; ya cubierto en parte por DNS de C, pero conviene anticipar el soporte de subdominios por sitio. Herramientas: Herd, Valet, FlyEnv. Esfuerzo S-M. Etapa B. NICE (MUST para multi-tenant Laravel).
46. **Docker/Podman de Lerd-style**: servicios en contenedores como alternativa a binarios nativos para lo difícil (Elasticsearch). Ya en C.
47. **Sincronización de configuración entre equipos** (Git/ nube privada) y "repara mi entorno desde un perfil". Se apoya en la función 23. Esfuerzo M. Etapa D. NICE.
48. **Plantilla de IA/Ollama integrada con el panel**: seleccionar modelo por proyecto, RAG sobre el repo con pgvector local. Esfuerzo L. Etapa D. NICE (diferenciador propio, no de los referentes).

Total: 48 candidatas (las 46-47 se consideran absorbidas en C/D; 46 ya está planificada y se deja solo como nota).

### Resumen de MUST-HAVES
Panel de recursos (1), visor de logs (2), captura de dump (3), Xdebug (5), notificaciones (8), editor de php.ini (9), extensiones PHP (10), aislamiento por sitio (13), gestor `.env` (15), config por proyecto (16), nuevo proyecto con un clic (17), plantillas de sitio (18), `park`/autodetección (20), respaldo/perfiles del entorno (23), workspaces de arranque (24), cron/queue/scheduler (29), procesos personalizados supervisados (30), túneles alternativos (31), Doctor (36), gestor de versiones (37), CLI `wolf` (38), confianza de la CA en Node/Python/Firefox (44).

---

## 3. Qué muestra el panel de ServBay y cómo lo cubrimos

Según su documentación (verificado): CPU load, historial de uso de CPU, presión de memoria, memoria de la aplicación, memoria wired y comprimida, almacenamiento (uso/espacio) y red (tráfico), con control de iniciar/detener por servicio y logs. Propuesta para WolfCore Dev (Windows):
- Tarjetas: CPU total, RAM (usada/disponible, "memoria de WolfCore"), disco de datos del entorno, red.
- Tabla por servicio/pool: estado, PID, puerto, CPU %, RAM, uptime, hilos, botón reiniciar/detener/logs.
- Sparklines de los últimos 5-10 minutos (muestreo cada 2-3 s solo con la ventana visible).
- Alertas: RAM > umbral, puerto en conflicto, proceso zombi, php-cgi huérfano.
- Extras sobre ServBay: top de sitios por consumo, tamaño de cada base de datos, conexiones activas a MySQL/Postgres, uso de GPU/VRAM de Ollama.

---

## 4. Hoja de ruta propuesta

### Etapa A (en curso, sin cambios)
- Cambio de nombre, HTTPS con CA propia, MySQL/MariaDB/PostgreSQL+pgvector/Redis/MongoDB, administración de DBs, Adminer, Composer + terminal por sitio + PATH, Mailpit, Ollama, FTP.
- Añadir de baja carga: Doctor básico de puertos (36, parte), importación de la CA a Node/Python (44).

### Etapa B (núcleo "mejor del mundo" para este usuario)
Bloque B1, observabilidad:
- Panel de recursos por servicio (1), visor de logs unificado (2), notificaciones y centro de eventos (8), visor de errores (7).
- Captura de dump()/var-dumper (3) y MCP ampliado (39).

Bloque B2, PHP y sitios:
- Xdebug por sitio (5), editor de php.ini (9), gestor de extensiones (10), aislamiento por sitio (13), gestor de `.env` (15), editor Nginx con `nginx -t` (11), subdominios/wildcard (45).

Bloque B3, proyectos:
- Config por proyecto `wolfcore.yml` (16), nuevo proyecto con un clic Laravel/CI/FastAPI/WordPress básico (17), plantillas de sitio (18), importación Laragon/XAMPP/Herd (19), `park` y acciones rápidas (20).
- CLI `wolf` (38), paleta de comandos (40).

Bloque B4, procesos y servicios:
- Procesos personalizados supervisados (30), cron/scheduler/queue (29), workspaces de arranque (24), versiones de runtimes con descarga (37), Doctor completo (36).

Bloque B5, ya planificado en B:
- MCP + agentes (Hermes, Claude Code, Codex), Node/Python por proyecto, panel Git + autoactualización, túneles Cloudflare nombrados, módulo Herramientas.
- Además: túneles alternativos ngrok/Expose/Tailscale (31) y respaldo/perfiles del entorno (23).

### Etapa C
- Contenedores (Podman/Docker + compose), servidor DNS (*.test sin hosts), más lenguajes, Apache/Caddy, copias programadas, servicios de búsqueda/almacenamiento (Meilisearch, MinIO…).
- Añadir: instancias paralelas de un mismo servicio (25), Reverb/RabbitMQ y servicios extra (28), FrankenPHP/Octane (12), acceso LAN con QR (32), drivers/plugins de framework (22), ahorro de recursos y arranque perezoso (42), modo portable y desinstalación limpia (41), `.htaccess` real con Apache (14).

### Etapa D (nueva, diferenciadores)
- Inspector de consultas SQL, jobs y HTTP (4), perfilado (6), inspector de webhooks (33), Forge/despliegue (35), explorador de datos propio con pgvector (27), pruebas/calidad por sitio (43), sincronización entre equipos (47), IA local por proyecto (48), WordPress completo (21).

### Criterio de orden
1. Primero lo que reduce fricción diaria y es barato: logs, php.ini, extensiones, Xdebug, `.env`, panel de recursos.
2. Después lo que aporta reproducibilidad: `wolfcore.yml`, plantillas, perfiles, nuevo proyecto.
3. Al final lo que exige infraestructura pesada (contenedores, perfilado, inspector de queries).

---

## 5. Advertencias
- Herd Pro, Laragon Pro, MAMP PRO y ServBay Pro cobran por funciones que aquí se pueden ofrecer gratis; no hace falta replicar licencias.
- No copiar código ni textos de interfaz de ningún referente; EnvKit es propietario y Flock es AGPL-3.0 (no incorporar su código).
- Las filas marcadas (cv) deben verificarse antes de usarlas como argumento de producto.
