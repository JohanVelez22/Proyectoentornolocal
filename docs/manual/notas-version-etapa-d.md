# Notas de la versión — Etapa D

## Novedades

- **Interfaz en 16 idiomas**
  - Español, English, Português, Français, Deutsch, Italiano, Русский, 简体中文, 日本語, 한국어, हिन्दी, Türkçe, Bahasa Indonesia, Polski, Nederlands y Українська.
  - El selector (en **Ajustes → Apariencia e idioma** y en la barra superior) muestra cada idioma con su nombre nativo. Los doce que no son español, inglés, portugués ni francés llevan el aviso «Traducción automática revisada»; si falta algún texto, se ve en inglés.
  - El menú de la bandeja, los diálogos y los avisos de Windows también cambian de idioma. La ayuda de `wolf` sigue disponible solo en español, inglés, portugués y francés.

- **Inicio más claro**
  - Los avisos del panel se juntan en una sola tarjeta plegable, «Problemas detectados», que muestra los dos primeros y se despliega con «Ver los N».
  - «Finalizar proceso» pasa a un menú con confirmación y la memoria alta se ve como una insignia en su tarjeta, no como un aviso.
  - Nueva tarjeta «Espacio en disco» con el espacio libre del sistema y de los datos de WolfCore, que se pone ámbar o roja si queda poco. Su botón «Liberar espacio» ofrece limpiar versiones sin uso, limpiar temporales y cachés, o ver qué ocupa más.
  - Una sola tarjeta, «Servicios y procesos», reúne lo que está en marcha con su uso de CPU y memoria y, debajo, el resto de los servicios.

- **Pastilla de estado de la barra superior**
  - Siempre muestra un texto corto («Todo apagado», «3 encendidos», «1 con error», «Conectando…» o «Sin conexión») y, al pulsarla, abre Servicios.

- **Servicios con motores externos aparte**
  - Los motores que administra otro programa (por ejemplo, un MySQL o un Nginx instalados por su cuenta) salen en su propia franja, «Detectados en su equipo», solo para consulta. No cuentan entre los servicios encendidos ni los toca «Iniciar todo». Si solo hay externos, una franja le invita a instalar Nginx y PHP.

- **Navegación reorganizada**
  - Herramientas se divide en 5 secciones (Código, Red, Seguridad, Archivos y medios y Sistema), con Comparar, QR y Guías como pestañas. PHP queda dentro de Servicios y Agentes dentro de IA; Contenedores aparece con «Mostrar secciones avanzadas». El asistente de inicio se sustituye por un recorrido de bienvenida de 7 pasos.

- **Proyectos nuevos, plantillas e importación**
  - Crear un proyecto desde cero (carpeta, sitio con HTTPS, base y conexión) para Laravel, CodeIgniter 3 y 4, Symfony, FastAPI, WordPress y sitio estático. También hay recetas para Rails, Spring Boot, ASP.NET y Node.
  - Guardar un proyecto como plantilla (receta, ajustes de PHP y Nginx, extensiones y esquema de la base, solo la estructura) y crear proyectos nuevos a partir de ella.
  - Importar sitios desde Laragon, XAMPP o Herd: se vinculan donde están, sin mover ni modificar carpetas, y se pueden copiar sus bases.
  - Editor de variables `.env` con valores secretos enmascarados, copia previa con fecha y bloques de conexión (base, correo, IA, Meilisearch) con vista previa.
  - Workspaces con nombre (bases, servicios y procesos que se encienden y apagan juntos) y tareas programadas por proyecto.
  - Reverb por proyecto (WebSockets de Laravel) y Meilisearch como servicio con datos por versión menor.

- **Versiones de lenguajes y herramientas**
  - Instalar varias versiones de Node, Python, Java (Temurin), .NET, Go, Rust, Bun, Deno, Zig, Kotlin, Dart, Ruby, Maven y Gradle sin tocar el PATH del sistema. Cada descarga se verifica con su huella.

- **Bases de datos**
  - Instantáneas de una base con restauración (se guarda antes una del estado actual) y papelera de 7 días.
  - Auditoría de contraseñas (compara hashes con unas 200 contraseñas comunes; no es fuerza bruta).
  - phpMyAdmin y Adminer desde el botón de base de cada proyecto.
  - Consultas lentas (MySQL, MariaDB y PostgreSQL) con registro en el servidor y valores ocultos.
  - Visor de esquema (tablas, columnas, índices, relaciones) solo lectura.
  - Perfiles `.wolfperfil` para llevar sitios, versiones, instancias, plantillas y ajustes a otro equipo; bases y CA solo cifradas con una frase.

- **Herramientas nuevas**
  - Editor de código con resaltado, copia previa y guardado confirmado; archivos sensibles piden confirmación reforzada.
  - Buscar texto en nombres y contenido.
  - Comparar textos y diff de carpetas (solo lectura, sin mostrar archivos sensibles).
  - Cliente HTTP con entornos, colección e historial, secretos en almacén cifrado.
  - Guías de HTTP, túneles y Git/GitHub, con laboratorio de Git (repositorio de práctica, sin internet).
  - Uso del disco (árbol, archivos mayores, por extensión), solo lectura.
  - Compartir carpeta o archivo por un enlace temporal con código secreto.
  - Grabar pantalla (abre la grabadora de Windows).

- **Compartir y red**
  - Compartir un sitio en la red local con QR e instalación de la CA en el móvil.
  - Compartir carpeta o archivo por túnel (Cloudflare o ngrok) con enlace que vence a los 15 min, 1 h o 4 h.
  - Línea de órdenes `wolf` (estado, vincular carpetas, usar versiones, abrir sitios, registros, doctor, iniciar/detener).
  - El Doctor revisa las reglas del cortafuegos de entrada y permite quitar las de WolfCore Dev con confirmación.

## Mejoras de seguridad

- Los runtimes de Node y Python por proyecto se instalan en Servicios y se verifican con su huella; cada proyecto usa la versión que pide.
- Los servidores de las recetas (Rails, Spring Boot, ASP.NET, Express/Nest) arrancan en `127.0.0.1` y se comprueba que no escuchen en toda la red.
- Maven se lanza con el JDK propio y no lee `.mvn/jvm.config` ni `MAVEN_OPTS`.
- Las consultas lentas ocultan los valores literales para no exponer datos.
- El editor de código pide confirmación reforzada para archivos sensibles (`.env`, claves).
- El diff de carpetas no muestra el contenido de archivos sensibles.
- El cliente HTTP guarda los secretos en el almacén cifrado, no en la colección ni en el historial; la CA de WolfCore Dev solo se acepta para dominios `.test` y de sus sitios.
- Compartir carpeta o archivo rechaza `.env*`, claves, `.git`, `.ssh`, datos de programas, archivos con secretos, la carpeta de datos de WolfCore Dev, la raíz de una unidad y la carpeta de usuario entera.
- Un archivo comprimido se comparte tal cual, sin revisar su interior; se avisa de ello.
- El `wolf` y el servidor MCP solo atienden en `127.0.0.1` con una clave (la de `wolf` cambia en cada arranque).
- Los perfiles no llevan claves, tokens ni contraseñas; las bases y la CA viajan solo cifradas con una frase elegida por el usuario.
- El Doctor nunca cambia el cortafuegos por su cuenta: solo quita las reglas que usted marca, después de confirmar y con el permiso de administrador de Windows, y guarda una copia protegida para poder restaurarlas.

## Correcciones

- «Servicios encendidos: N de M» cuenta solo los servicios propios: ya no suman los motores externos ni el FTP apagado, así que el número nunca pasa del total.
- La pastilla y los avisos de Inicio vuelven a ver los procesos de proyecto y ya no dan un aviso falso de «Nginx sin instalar».
- La tarjeta de disco ya no se queda en «—» si falla una lectura y redondea hacia abajo, de modo que el color y el porcentaje coinciden.
- El foco del teclado se ve en todos los controles y los botones pequeños tienen una zona de clic más grande.
- La barra superior ya no se solapa a ningún ancho de ventana y el lema de la barra lateral no se corta a mitad de palabra en chino y japonés.
- Las versiones de lenguajes se instalan sin tocar el PATH del sistema.
- La migración automática a instancias paralelas conserva puerto, carpeta de datos y credenciales, con copia previa de la configuración.
- Actualizar un parche respalda primero (volcado de bases y copia en frío) y vuelve a la versión anterior si la nueva no arranca.
- Desinstalar una versión quita solo los binarios; borrar datos es una acción aparte que pide el id.
- Las instantáneas borradas se recuperan durante 7 días desde la papelera.
- El laboratorio de Git usa un remoto local en una carpeta propia y no toca sus proyectos ni su configuración de git.
- Compartir por túnel se cierra al vencer el plazo, al pulsar "Dejar de compartir", si el túnel cae y al salir de WolfCore Dev; solo hay una compartición a la vez.
- Los archivos de texto o tipo desconocido de más de 8 MB no se comparten, porque no se pueden revisar por completo.
