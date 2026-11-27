# 13 · Perfiles y ajustes

## Para qué sirve

La pantalla **Ajustes** reúne todas las preferencias del entorno (tema, idioma, avisos, puertos web, HTTPS, editor y terminal predeterminados, CLI `wolf`, captura de pantalla, servidor MCP) y la sección **Respaldo y perfiles** para llevar su entorno a otro equipo o restaurar instantáneas de configuración. Además, la barra superior incluye el **Optimizador de memoria**.

## Paso a paso

### 1. Personalizar apariencia, idioma y avisos

1. Abra **Ajustes** en la parte inferior de la barra lateral.
2. En **Apariencia e idioma**:
   - Elija **Tema** (**Sistema**, **Claro** u **Oscuro**), **Idioma** y **Color de acento** (**Índigo**, **Azul**, **Verde**, **Violeta**, **Naranja**, **Rosa** o personalizado). Los cambios se aplican al instante.
   - Pulse **Ver el recorrido** para repetir el **Recorrido de bienvenida**.
   - Active **Mostrar secciones avanzadas** si desea ver en la barra lateral pantallas menos habituales como **Contenedores**.
3. En **Avisos**:
   - Active o desactive las **Notificaciones de Windows** (solo aparecen cuando WolfCore Dev no está en primer plano, como máximo una por tipo cada 5 minutos).
   - Active o desactive cada tipo de aviso (servicio caído, puerto ocupado, certificados, túnel caído, procesos, recetas, Doctor, contenedores, versiones nuevas) o silencie avisos de nuevas versiones por servicio.

### 2. Configurar servicios, HTTPS, editor, terminal y PATH

En las tarjetas centrales de **Ajustes**:

- **General:** muestra la **Carpeta de datos** (`%LOCALAPPDATA%\WolfCoreDev`) con el botón **Abrir carpeta**.
- **Servicios:** configure el **Puerto de Nginx** (por defecto `80`) y los **Trabajadores PHP** (`1` a `8`, por defecto `2`). Al pulsar **Guardar**, se regeneran los vhosts y se reinicia o recarga lo necesario.
- **HTTPS:** muestra el estado de la **Autoridad local** con botones **Instalar autoridad**, **Reinstalar** y **Quitar**, y permite cambiar el **Puerto HTTPS** (`443` o `1024–65535`).
- **Terminal y herramientas:**
  - **PHP por defecto** para los atajos de terminal.
  - **Puerto de Adminer** (dirección fija `127.0.0.1:8090`).
  - **Terminal predeterminada** (PowerShell u otra terminal instalada) y **Editor predeterminado** (VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed o Notepad++).
  - **PATH del usuario:** pulse **Agregar al PATH del usuario** para exponer `php` y `composer` de WolfCore Dev en cualquier terminal nueva (sin requerir administrador).
- **Terminal: comando wolf**, **Captura de pantalla** y **Servidor MCP:** controlan la CLI `wolf`, el atajo global de captura y el servidor MCP.

[CAPTURA: Pantalla Ajustes mostrando Apariencia e idioma, HTTPS, Terminal y herramientas y Respaldo y perfiles]

### 3. Exportar e importar un perfil (`.wolfperfil`)

La tarjeta **Respaldo y perfiles** permite mover su entorno a otro equipo sin exponer secretos:

- **Exportar el entorno:**
  1. En **Respaldo y perfiles**, marque opcionalmente **Incluir las bases de datos**, **Incluir la autoridad de certificación (CA)** e **Incluir los certificados de los sitios** (solo viajan junto con la CA).
  2. Si incluyó bases de datos o la CA, escriba y repita una **Frase** de cifrado (no se guarda en ningún sitio; sin ella no podrán descifrarse).
  3. Pulse **Exportar perfil…** y elija dónde guardar el archivo `.wolfperfil`.
  4. **Nunca se exportan** claves de IA, token de GitHub, claves SMTP, tokens de túneles/MCP/CLI, contraseñas de bases, instantáneas, papelera ni la carpeta `data`.
- **Importar un perfil:**
  1. Pulse **Importar perfil…** y seleccione el archivo `.wolfperfil`.
  2. **Paso Revisar:** WolfCore Dev muestra todo lo que se reemplazará (guardando antes una copia en `respaldos/pre-perfil-…` y una instantánea del entorno), las versiones que se descargarán con huella verificada, los puertos ocupados y **Carpetas de los sitios** para reasignar rutas que cambiaron de unidad o usuario (o importarlas como pendientes).
  3. Si el perfil trae CA o bases cifradas, escriba la **Frase** y compare la huella SHA-256 de la CA antes de aceptarla (nunca se instala sola en el almacén del sistema).
  4. En **Confirmar**, pulse **Importar**.
- **Instantáneas del entorno:** antes de actualizar PHP/Nginx, limpiar versiones definitivamente o importar un perfil, WolfCore Dev guarda una copia de la configuración, Nginx y `php.ini` (se conservan las últimas 10). También puede pulsar **Tomar una ahora** manualmente.

> **Carpeta de datos de prueba (`WOLFCORE_DATOS`):** puede abrir WolfCore Dev con la variable de entorno `WOLFCORE_DATOS=<carpeta>` para probar un perfil en una carpeta aislada sin tocar su carpeta real, ni el archivo `hosts`, ni el PATH ni los certificados del sistema.

### 4. Usar el Optimizador de memoria

1. En la barra superior derecha, pulse **Memoria**.
2. Elija un modo y pulse **Ver la lista** (nada se detiene ni se cierra sin su confirmación):
   - **Liviano:** vacía la caché HTTP de la sesión de la aplicación (libera disco; no detiene servicios).
   - **Moderado:** además propone reducir a un solo trabajador PHP y detener servicios inactivos sin conexiones (aparecen desmarcados por defecto).
   - **Profundo:** además lista programas abiertos suyos con alto consumo de RAM para **pedirles que cierren su ventana** (como pulsar la `X`, nunca se matan ni se listan procesos del sistema, FlyEnv, antivirus ni WolfCore Dev).
3. Marque solo lo que desee y pulse **Aplicar lo marcado**.

## Ejemplo

Va a cambiar de computadora y quiere llevar su entorno de desarrollo:

1. En el equipo actual, abra **Ajustes → Respaldo y perfiles**, marque **Incluir las bases de datos**, escriba una frase segura y pulse **Exportar perfil…** para generar `mi-entorno.wolfperfil`.
2. En el equipo nuevo, instale WolfCore Dev, abra **Ajustes → Respaldo y perfiles → Importar perfil…**, elija `mi-entorno.wolfperfil`, reasigne la ruta de sus carpetas de proyectos (por ejemplo `D:\Proyectos` → `C:\Proyectos`) y confirme.
3. Por último, vuelva a introducir sus claves de IA o tokens en el equipo nuevo y confíe en la CA desde **Ajustes → HTTPS**.

## Si algo falla

- **Olvidó la frase de un archivo `.wolfperfil`:** no es posible recuperar las bases ni la CA cifradas sin esa frase; aun así puede marcar **Importar sin las bases** para importar sitios, versiones, plantillas y ajustes.
- **Al cambiar el puerto de Nginx los túneles abiertos dejaron de responder:** los túneles ya abiertos siguen apuntando al puerto anterior; renuévelos desde **Túneles**.
- **El Optimizador de memoria dice «Aún no hay datos de actividad suficientes»:** mantenga abierto **Inicio** unos minutos para recolectar muestras antes de usar el modo **Moderado**.
- **Al importar un perfil aparecen «Puertos ocupados»:** complete la importación y luego cambie esos puertos desde **Servicios → Versiones**.
