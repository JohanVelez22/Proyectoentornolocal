# 02 · Panel e Inicio y Servicios

## Para qué sirve

La pantalla **Inicio** ofrece una vista rápida del estado de todo el entorno (servicios, sitios, túneles, archivo `hosts`, correo, IA, rendimiento y workspaces). La pantalla **Servicios** permite instalar, encender, apagar y configurar el servidor web, PHP, las bases de datos y herramientas clave como Composer, Adminer y phpMyAdmin.

## Paso a paso

### 1. Leer el panel de Inicio

Al entrar en **Inicio** verá, de arriba hacia abajo:

1. El botón **Nuevo proyecto** para crear un proyecto desde cero sin cambiar de pantalla.
2. **Seis mosaicos de estado** (haga clic en cualquiera con destino para ir directo a su pantalla):
   - **Servicios:** muestra cuántos están encendidos sobre el total instalado.
   - **Sitios:** cantidad de proyectos registrados.
   - **Túneles:** cantidad de túneles activos en ese momento.
   - **Archivo hosts:** indica si está al día o si faltan dominios por aplicar.
   - **Correo:** cantidad de correos sin leer en Mailpit (si está instalado y encendido).
   - **Modelos de IA:** cantidad de modelos locales disponibles en Ollama (si está encendido).
3. **Avisos de hosts:** si algún dominio `.test` falta en el archivo `hosts` o aparece duplicado fuera del bloque de WolfCore Dev, se muestra una alerta con acceso para aplicarlo.
4. **Panel de rendimiento:** muestra en vivo CPU, RAM, disco y red del equipo y de cada servicio o proceso activo (se actualiza cada 3 segundos solo mientras la ventana está visible).
5. **Workspaces de arranque:** conjuntos personalizados de servicios, instancias y procesos que puede encender o apagar con un clic.
6. **Tarjetas de resumen de Servicios y Túneles:** lista rápida con el estado y los puertos de cada servicio y los enlaces activos con botones **Abrir** y **Copiar**.

[CAPTURA: Pantalla Inicio con los 6 mosaicos, el panel de rendimiento, un workspace creado y las tarjetas de Servicios y Túneles]

### 2. Crear y usar un workspace de arranque

Los workspaces le evitan encender 3 o 4 servicios uno por uno cada mañana:

1. En **Inicio**, dentro de la tarjeta **Workspaces**, pulse **Nuevo workspace** (o el botón **+** en la esquina superior derecha).
2. Escriba un nombre descriptivo (por ejemplo, `Tienda Laravel`).
3. Marque los servicios, instancias de bases de datos y procesos de proyecto que quiere agrupar.
4. Guarde el workspace.
5. Desde entonces, puede encenderlo o apagarlo con su botón en **Inicio**, desde el menú de la bandeja, desde la **Paleta de comandos** (`Ctrl+K`) o con `wolf start <workspace>`.

### 3. Encender y apagar servicios

1. Abra **Servicios** en la barra lateral (pestaña **Servicios**).
2. En la parte superior dispone de dos botones globales:
   - **Iniciar todo:** enciende en orden las versiones de PHP en uso, Nginx, las instancias de base de datos predeterminadas o usadas por proyectos (esperando a que respondan) y los procesos con inicio automático. **Nunca abre túneles públicos.**
   - **Detener todo:** apaga todos los servicios administrados y cierra los túneles activos.
3. Debajo encontrará las tarjetas agrupadas por categoría (**Web**, **PHP**, **Bases de datos**, **Correo**, **IA** y **Herramientas**, con utilidades como **Composer**, **Adminer** y **phpMyAdmin**).
4. Use el interruptor o botón de **Encender** / **Apagar** de cada tarjeta para controlar un servicio de forma individual.
5. Al final de la pantalla, la tarjeta de instalación rápida le permite instalar servicios web (`Nginx`, `PHP`), bases de datos (`MySQL`, `MariaDB`, `PostgreSQL`, `Redis`, `MongoDB`, `mongosh`) y otros (`Mailpit`, `smtp4dev`, `Inbucket`, `Papercut SMTP`, `Ollama`, `Meilisearch`, `cloudflared`).

> Un servicio solo se marca como **Encendido** cuando su proceso está vivo **y** su puerto responde. Si un servicio se cae de forma inesperada, el supervisor lo reinicia con espera creciente y envía un aviso a la campana.

[CAPTURA: Pantalla Servicios en la pestaña Servicios con botones Iniciar todo y Detener todo, tarjetas de Nginx, PHP y MySQL y sección de instalación]

### 4. Configurar `php.ini` y extensiones (pestaña PHP)

Dentro de **Servicios**, abra la pestaña **PHP** (también accesible desde `Ctrl+K` escribiendo `PHP`):

1. Seleccione la **Versión de PHP** que desea editar en el desplegable superior.
2. En la pestaña **php.ini**:
   - Puede ajustar **Valores rápidos** (`memory_limit`, `upload_max_filesize`, `post_max_size`, `max_execution_time`, `display_errors`, `error_reporting`, `date.timezone`, `opcache.enable`) y pulsar **Aplicar al texto**.
   - También puede editar el archivo directamente en el editor inferior (las líneas que empiezan con `;` son comentarios).
   - Pulse **Revisar y guardar** para ver el diff exacto de sus cambios.
   - Pulse **Guardar y aplicar**. WolfCore Dev guarda una copia con fecha en **Copias con fecha**, valida el archivo con `php -v` y reinicia PHP si está encendido. Si la validación falla o PHP no arranca, se restaura automáticamente la versión anterior.
3. En la pestaña **Extensiones**:
   - Use el buscador **Buscar extensión** para encontrar una extensión incluida en `ext/` y active o desactive su interruptor.
   - Para extensiones de terceros del catálogo (como Xdebug), pulse **Instalar**: WolfCore Dev descarga la compilación compatible con esa versión de PHP verificando su huella SHA-256.

[CAPTURA: Pestaña Servicios → PHP mostrando Valores rápidos, el editor de php.ini y la lista de Copias con fecha]

## Ejemplo

Quiere subir archivos de hasta 64 MB en su proyecto PHP 8.4 y arrancar cada día solo Nginx, PHP 8.4 y MySQL:

1. Vaya a **Servicios → PHP**, elija **PHP 8.4**.
2. En **Valores rápidos**, cambie `upload_max_filesize` a `64M` y `post_max_size` a `64M`.
3. Pulse **Aplicar al texto**, luego **Revisar y guardar** y confirme con **Guardar y aplicar**.
4. Vaya a **Inicio**, pulse **Nuevo workspace**, nómbrelo `Trabajo PHP`, seleccione **Nginx**, **PHP 8.4** y **MySQL 8.4**, y guarde.

## Si algo falla

- **Un servicio dice que el puerto está ocupado:** la tarjeta y el aviso muestran qué programa usa ese puerto y su PID (por ejemplo, FlyEnv o IIS). Cierre ese programa o pulse **Usar otro puerto** para mover el servicio de WolfCore Dev (por ejemplo, MySQL a `3308` o PostgreSQL a `5433`).
- **`php.ini` se rechaza al guardar:** significa que algún valor tiene sintaxis inválida (por ejemplo, `memory_limit = abc`) o una extensión no cargó en la prueba `php -v`. Corrija el valor señalado y vuelva a pulsar **Revisar y guardar**; el archivo anterior no se dañó.
- **Quiere volver a un `php.ini` anterior:** en **Servicios → PHP**, baje hasta **Copias con fecha** y pulse **Restaurar** en la copia deseada.
- **Un servicio de base de datos se encendió con «Iniciar todo» sin que usted lo use:** **Iniciar todo** enciende la instancia predeterminada de cada base instalada. Si no usa ese motor, desinstálelo desde **Servicios → Versiones**.
