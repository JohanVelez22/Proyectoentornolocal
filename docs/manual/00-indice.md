# Manual de usuario de WolfCore Dev

## Para qué sirve

Este manual explica cómo instalar, configurar y usar **WolfCore Dev**, el entorno de desarrollo local para Windows que reúne servidores web (Nginx, PHP), bases de datos, correo de prueba, túneles públicos, herramientas diarias, agentes de IA y la terminal `wolf` en una sola aplicación.

## Índice de capítulos

| Capítulo | Contenido principal |
| --- | --- |
| [01 · Primeros pasos](01-primeros-pasos.md) | Requisitos, instalación, carpeta de datos, recorrido de bienvenida, barra lateral, barra superior (con la pastilla de estado) y paleta `Ctrl+K`. |
| [02 · Panel e Inicio y Servicios](02-panel-y-servicios.md) | Mosaicos de Inicio, avisos agrupados, rendimiento en vivo (con espacio en disco y la tarjeta Servicios y procesos), workspaces de arranque, encender/apagar servicios, motores externos y ajustes de PHP (`php.ini` y extensiones). |
| [03 · Versiones e instancias](03-versiones.md) | Catálogo en vivo, huellas y firmas PGP, instancias paralelas, actualizar con respaldo, limpieza de versiones sin uso y respaldos de actualización. |
| [04 · Proyectos y sitios](04-proyectos-y-sitios.md) | Nuevo proyecto, agregar carpeta o clonar desde GitHub, recetas por tipo (Laravel, FastAPI, Node, Rails, Spring Boot, ASP.NET Core…) y `wolfcore.yml`, importar desde Laragon/XAMPP/Herd, plantillas, HTTPS, Xdebug, vhost de Nginx y FTP. |
| [05 · Bases de datos](05-bases-de-datos.md) | MySQL, MariaDB, PostgreSQL (con pgvector), Redis y MongoDB; crear, respaldar, restaurar, importar, instantáneas, ver esquema, consultas lentas y Adminer/phpMyAdmin. |
| [06 · Entorno y archivos `.env`](06-entorno-env.md) | Gestor visual de `.env`, secretos enmascarados, comparar con `.env.example`, bloques rápidos, usuario propio de base de datos y copias anteriores. |
| [07 · Túneles y compartir](07-tuneles-y-compartir.md) | Cloudflare rápido y con nombre, ngrok, Expose, Tailscale (Serve y Funnel), acceso en red local con QR, instalación de la CA en el móvil y compartir una carpeta o un archivo suelto. |
| [08 · Correo de prueba](08-correo-de-prueba.md) | Captadores locales (Mailpit, smtp4dev, Inbucket, Papercut SMTP) y proveedores SMTP remotos con prueba de envío. |
| [09 · Procesos y tareas programadas](09-procesos-y-tareas.md) | Procesos supervisados por proyecto (`npm run dev`, `queue:work`, `uvicorn`, Reverb) y tareas cron programadas con historial. |
| [10 · Herramientas](10-herramientas.md) | Las 26 tarjetas de las 5 secciones (Código, Red, Seguridad, Archivos y medios y Sistema): Editor de código, buscador, comparador, Cliente HTTP, WebSocket, compartir carpeta o archivo, guías de HTTP, túneles y Git (con laboratorio), contraseñas, cripto, imágenes, ZIP/PDF, conversor de documentos, uso del disco, captura y grabación de pantalla y limpieza de disco. |
| [11 · Agentes e IA](11-agentes-ia.md) | IA local con Ollama, proveedores en la nube, registro de agentes de IA con el servidor MCP y sugerencias de commit. |
| [12 · CLI `wolf`](12-cli-wolf.md) | Activar el comando `wolf` en el PATH, órdenes disponibles (`status`, `link`, `park`, `use`, `secure`, `share`, `open`, `logs`, `doctor`, `start`, `stop`), `--json` y confirmaciones. |
| [13 · Perfiles y ajustes](13-perfiles-y-ajustes.md) | Apariencia e idioma (16 idiomas), avisos, puertos web, HTTPS, editor y terminal predeterminados, optimizador de memoria, respaldos y perfiles `.wolfperfil`. |
| [14 · Doctor, Depuración y problemas](14-doctor-y-problemas.md) | Diagnóstico automático con Doctor, reparaciones guiadas, revisión del cortafuegos y eliminación de reglas peligrosas, confianza de la CA en Node/Python/Firefox, Depuración (`dump()`/`dd()`/errores) y Registros en vivo. |
| [15 · Seguridad](15-seguridad.md) | Modelo de seguridad local, almacenamiento cifrado de secretos, confianza en repositorios, sitios con datos reales, verificación de descargas y reglas de red. |
| [16 · Glosario](16-glosario.md) | Definiciones breves y claras de los términos que aparecen en WolfCore Dev. |
| [Notas de la versión de la Etapa D](notas-version-etapa-d.md) | Qué hay de nuevo, mejoras de seguridad y correcciones, escrito para usuarios. |

## Paso a paso para empezar hoy

1. Lea [01 · Primeros pasos](01-primeros-pasos.md) para abrir la aplicación y entender la barra lateral.
2. En [02 · Panel e Inicio y Servicios](02-panel-y-servicios.md) y [03 · Versiones e instancias](03-versiones.md), instale y encienda **Nginx**, **PHP** y el motor de base de datos que necesite.
3. Pase a [04 · Proyectos y sitios](04-proyectos-y-sitios.md) para crear su primer sitio `.test` con HTTPS.
4. Consulte [14 · Doctor, Depuración y problemas](14-doctor-y-problemas.md) si algún puerto o certificado presenta un aviso.

## Ejemplo

Si quiere levantar un proyecto Laravel desde cero y verlo en `https://mi-tienda.test`:

1. Abra **Servicios** → **Versiones** e instale **Nginx**, **PHP 8.4**, **Composer** y **MySQL 8.4**.
2. En **Servicios**, pulse **Iniciar todo**.
3. En **Proyectos**, pulse **Nuevo proyecto**, elija **Laravel**, escriba `mi-tienda` y siga los pasos.
4. Al terminar, pulse **Ver el sitio**.

[CAPTURA: Pantalla principal de Inicio de WolfCore Dev con la barra lateral agrupada en Trabajo, Entorno, Utilidades y Ajustes]

## Si algo falla

- **No encuentra una pantalla mencionada en el manual:** pulse `Ctrl+K` para abrir la **Paleta de comandos** y escriba su nombre. Las pantallas menos frecuentes (como **Contenedores**) están ocultas en la barra lateral salvo que active **Mostrar secciones avanzadas** en **Ajustes → Apariencia e idioma**.
- **Un servicio no arranca al principio:** abra **Doctor** en la barra lateral y pulse **Revisar ahora** para detectar puertos ocupados o dependencias faltantes.
- **Convive con FlyEnv, XAMPP o Laragon:** revise la sección de puertos en [02 · Panel e Inicio y Servicios](02-panel-y-servicios.md) y la importación en [04 · Proyectos y sitios](04-proyectos-y-sitios.md).
