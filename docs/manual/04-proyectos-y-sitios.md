# 04 · Proyectos y sitios

## Para qué sirve

La pantalla **Proyectos** centraliza todos sus sitios locales `.test`: crear proyectos desde cero, importar o clonar repositorios, vincular instalaciones de Laragon, XAMPP o Herd, guardar plantillas reutilizables, configurar HTTPS, Xdebug, reglas de Nginx y acceso FTP.

## Paso a paso

### 1. Crear un proyecto desde cero (`Nuevo proyecto`)

1. Abra **Proyectos** en la barra lateral y pulse **Nuevo proyecto** (también disponible desde **Inicio** o con `Ctrl+K`).
2. **Paso 1 · Tipo:** elija un generador (**Laravel**, **CodeIgniter 4**, **CodeIgniter 3**, **Symfony**, **FastAPI**, **WordPress** o **Sitio estático**) o una de **Mis plantillas** si ya guardó alguna.
3. **Paso 2 · Datos:**
   - Escriba el **Nombre del proyecto** (minúsculas, números y guiones, por ejemplo `mi-tienda`; el dominio será `mi-tienda.test`).
   - Elija la **Carpeta padre** (el proyecto se crea en una subcarpeta nueva que debe estar vacía o no existir).
   - Seleccione la **Versión de PHP** o **Versión de Python** instalada.
   - Si aplica, marque **Crear una base de datos para el proyecto**, elija el **Servidor de la base** (debe estar encendido) y el **Nombre de la base**.
   - Opciones según el tipo: **Starter kit** en Laravel (`Ninguno`, `React`, `Vue`, `Livewire`), **Incluir los paquetes web (webapp)** en Symfony, o **Activar pgvector** en FastAPI con PostgreSQL.
   - Para **WordPress**, revise el aviso sobre su huella SHA-1 y marque la casilla de confirmación antes de continuar.
4. **Paso 3 · Resumen:** verifique tipo, carpeta, dominio, dirección con HTTPS, versión y base de datos.
5. **Paso 4 · Creando:** pulse **Crear proyecto**. Si algún paso falla, no se borra nada: podrá pulsar **Reintentar el paso**. Al terminar, use **Abrir en el editor**, **Ver el sitio** o **Ver en Proyectos**.

[CAPTURA: Asistente Nuevo proyecto en el paso Tipo mostrando Laravel, CodeIgniter 4, Symfony, FastAPI, WordPress y Sitio estático]

### 2. Agregar un proyecto existente o clonar desde GitHub

1. En **Proyectos**, pulse **Agregar proyecto** (o **Nuevo** según el estado de la lista).
2. Elija una de las tres vías:
   - **GitHub:** conecte con GitHub CLI (`gh`) o con un token personal (guardado cifrado con `safeStorage`, nunca en la URL ni en `.git/config`) y elija el repositorio a clonar.
   - **URL de git:** pegue la URL de un repositorio remoto sin usuario ni contraseña en la URL.
   - **Carpeta existente:** elija la carpeta del proyecto en su disco, o pulse la opción para **agregar sin receta** con el formulario manual.
3. Si activó una **carpeta vigilada** (por ejemplo `C:\Proyectos`), las subcarpetas nuevas que parezcan proyectos aparecen como sugerencias arriba de la lista para vincularlas con un clic.

### 3. Recetas, confianza en el repositorio y `wolfcore.yml`

Al detectar un proyecto (Laravel, CodeIgniter 3/4, Symfony, FastAPI, Node, WordPress o estático), WolfCore Dev propone una **receta** de pasos editable (Composer, `.env`, `key:generate`, crear o restaurar base, migraciones, `storage:link`, `npm ci` / `build`, `.venv` / `pip`, sitio HTTPS):

1. Revise cada paso propuesto antes de ejecutar.
2. Marque **Confío en este repositorio**. Sin esa marca, WolfCore Dev nunca ejecuta comandos, recetas ni procesos del proyecto.
3. Si el repositorio incluye un archivo `wolfcore.yml` en la raíz (que fija tipo, dominio, versiones de PHP/Node/Python, procesos o tareas) y la receta cambia después de haber confiado, la tarjeta le avisa para **Revisar la receta** antes de volver a correrla.
4. Puede usar **Traer cambios** en el panel Git de la tarjeta para hacer `git fetch` y avance rápido seguro (si hay cambios locales o ramas divergentes, no toca nada y avisa).

### 4. Importar desde Laragon, XAMPP o Herd

1. En **Proyectos**, pulse **Importar…**.
2. WolfCore Dev busca instalaciones conocidas de **Laragon**, **XAMPP** y **Herd** en modo de solo lectura.
3. Marque los sitios que quiere vincular. **Ninguna carpeta se mueve, copia ni modifica**: los sitios se vinculan en su ubicación actual y nacen sin la marca de confianza hasta que usted los revise.
4. Si también desea copiar sus bases de datos MySQL/MariaDB, marque **Importar también las bases de datos**, encienda antes el servidor de bases del otro programa, elija el **Servidor de destino** e indique puerto, usuario y clave de origen (la clave solo se usa durante la importación y no se guarda).
5. Revise el resumen en el paso **Confirmar** y pulse **Importar**.

### 5. Guardar un proyecto como plantilla

1. Abra el menú de acciones (`…`) de la tarjeta del proyecto y elija **Guardar como plantilla…**.
2. Escriba el **Nombre de la plantilla**.
3. Opcionalmente marque **Incluir también los archivos del proyecto** y añada exclusiones extra (una por línea, por ejemplo `uploads`).
4. Siempre se excluyen `.env`, `.env.*`, `vendor`, `node_modules`, `.git`, `.venv`, volcados (`*.sql`, `*.dump`, `*.sqlite`), claves y certificados (`*.pem`, `*.key`, `*.crt`), `wp-config.php`, `wolfcore.yml` y archivos que contengan secretos. La base de datos se guarda **solo como esquema sin filas**.
5. Pulse **Guardar plantilla**. Aparecerá en **Nuevo proyecto → Mis plantillas**.

### 6. Acciones diarias en la tarjeta del proyecto

Cada tarjeta en **Proyectos** ofrece acciones rápidas y paneles desplegables:

- **Abrir el sitio:** abre `http://` o `https://<dominio>.test` en el navegador.
- **Editor / Abrir con…:** abre la carpeta en su editor predeterminado (VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed o Notepad++).
- **Terminal:** abre una terminal en la carpeta del proyecto con la versión de PHP y Composer de ese proyecto primero en el PATH.
- **Base de datos:** abre Adminer o phpMyAdmin autenticado con un token de un solo uso (la contraseña nunca va en la URL).
- **HTTPS y Redirigir a HTTPS:** emite un certificado local para el dominio y sus alias (renovado automáticamente 30 días antes de vencer). La redirección se omite cuando el tráfico llega por un túnel para evitar bucles.
- **PHP por sitio y Xdebug:** permite fijar valores de `php.ini` exclusivos del sitio y activar Xdebug (`debug`, `develop`, `coverage`, `profile`, `trace`, puerto `9003` por defecto, `client_host=127.0.0.1`) en un pool propio, con opción de generar o fusionar `.vscode/launch.json`.
- **Editor de vhost de Nginx:** muestra el vhost generado, permite añadir **reglas propias** con fragmentos listos (CORS, caché de estáticos, límite de subida, SPA, cabeceras de seguridad, WebSocket) o editar en modo avanzado. Antes de aplicar, valida con `nginx -t` en una copia temporal y conserva historial de 10 copias.
- **FTP por sitio:** activa el acceso FTP encerrado en la carpeta del sitio (puerto `2121`, solo modo pasivo), con opción de **Solo lectura**, **Regenerar clave**, copiar la dirección `ftp://<usuario>@<host>:<puerto>/` (sin contraseña) y código QR.
- **Menú (`…`):** **Editar**, **Duplicar**, **Ver registros**, **Variables .env…**, **Guardar como plantilla…**, **Abrir agente** y **Borrar** (quitar un sitio de WolfCore Dev nunca borra su carpeta del disco).

[CAPTURA: Tarjeta de un proyecto en Proyectos mostrando enlaces HTTPS, botones de Editor/Terminal/Base, interruptores de Túnel/Red local y menú de acciones]

## Ejemplo

Quiere migrar un proyecto existente en `C:\Proyectos\mi-portal` desde Laragon y probarlo con Xdebug en VS Code:

1. Pulse **Proyectos → Importar…**, marque `mi-portal.test` y complete la importación.
2. En la tarjeta de `mi-portal.test`, abra la sección de **PHP**, active **Xdebug** en modo `debug` y pulse la opción para escribir `.vscode/launch.json`.
3. Pulse **Editor** para abrir el proyecto en VS Code y empiece a depurar en `https://mi-portal.test`.

## Si algo falla

- **El dominio `.test` no resuelve en el navegador:** revise si hay un aviso de **Archivo hosts** arriba de **Proyectos** y pulse **Reintentar** aceptando el permiso de administrador, o copie el comando manual que se ofrece si canceló el aviso UAC.
- **Aparece «HTTPS pendiente» en la tarjeta:** otro programa ocupa el puerto `443`. Cierre ese programa o cambie el **Puerto HTTPS** en **Ajustes → HTTPS**.
- **Una regla propia de Nginx no se aplica:** revise el error de `nginx -t` que muestra el editor. Además, por seguridad se rechazan directivas que salgan de la carpeta del sitio (`..`, `root`/`alias` externos, `include` ajenos o `proxy_pass` hacia servicios internos de WolfCore Dev).
- **El botón de FTP avisa que el servidor está apagado:** pulse **Encender FTP** directamente en la sección FTP de la tarjeta o enciéndalo desde **Servicios**.
