# 13 · Perfiles y ajustes

## Para qué sirve

La pantalla **Ajustes** reúne todas las preferencias del entorno (tema, idioma, avisos, puertos web, HTTPS, editor y terminal predeterminados, CLI `wolf`, captura de pantalla, servidor MCP) y la sección **Respaldo y perfiles** para llevar su entorno a otro equipo o restaurar instantáneas de configuración. Además, la barra superior incluye el botón **Liberar memoria**, con tres niveles.

## Paso a paso

### 1. Personalizar apariencia, idioma y avisos

1. Abra **Ajustes** en la parte inferior de la barra lateral.
2. En **Apariencia e idioma**:
   - Elija **Tema** (**Sistema**, **Claro** u **Oscuro**), **Idioma** y **Color de acento** (**Índigo**, **Azul**, **Verde**, **Violeta**, **Naranja**, **Rosa** o personalizado). Los cambios se aplican al instante y se guardan en este equipo.
   - **Idioma:** la interfaz está disponible en **16 idiomas**, y cada uno se muestra con su nombre nativo para que pueda reconocerlo aunque la interfaz esté en otro: Español, English, Português, Français, Deutsch, Italiano, Русский, 简体中文, 日本語, 한국어, हिन्दी, Türkçe, Bahasa Indonesia, Polski, Nederlands y Українська. Puede cambiarlo aquí o con el botón **Cambiar idioma** de la barra superior. Los cuatro primeros (español, inglés, portugués y francés) tienen traducción propia y completa; los otros doce llevan junto a su nombre el aviso **Traducción automática revisada** (en el idioma que esté usando y, al pasar el cursor, en el propio idioma). Si a un idioma le falta algún texto, ese texto se muestra en inglés; la guía de HTTP y la de Git avisan **Sin traducción a este idioma: se muestra en inglés** cuando una entrada no está traducida.
   - La primera vez que abre WolfCore Dev, el idioma se toma del idioma de su sistema si es uno de los 16; si no, se usa español. Al cambiar de idioma, el menú de la bandeja y los diálogos de la aplicación también cambian.
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
- **Terminal: comando wolf**, **Captura de pantalla** y **Servidor MCP:** controlan la CLI `wolf`, el atajo global de captura y el servidor MCP. La ayuda de `wolf` solo existe en español, inglés, portugués y francés (ver [12 · CLI `wolf`](12-cli-wolf.md)).

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

### 4. Liberar memoria

1. En la barra superior derecha, pulse **Liberar memoria**. Se abre un menú con tres niveles.
2. Pase el ratón por un nivel (o enfóquelo con el teclado) para ver qué hace y cuánto liberaría. La cifra se calcula cada vez que abre el menú, con la memoria de ese momento:
   - **Liviano:** recorta la memoria de trabajo de WolfCore Dev y de lo que supervisa (sus servicios, instancias y procesos de proyecto); Windows la recarga cuando haga falta. No pide permiso de administrador.
   - **Moderado:** lo anterior, y además la de los programas abiertos que no son críticos. No cierra ninguno ni pide permiso de administrador.
   - **Profundo:** lo anterior, y además vacía la caché de archivos y la lista de espera de Windows. Pide una confirmación y el permiso de administrador (UAC) de Windows; si lo cancela, solo se recortan los procesos.
3. Las cifras son honestas:
   - En **Liviano** y **Moderado** verá «Liberaría ≈ N» (calculado con la memoria privada de cada proceso) o «Liberaría hasta ≈ N» cuando Windows no deja leer esa memoria privada sin administrador y solo se puede dar un tope.
   - En **Profundo** verá dos cifras: «≈ N de procesos» y «La lista de espera (N) pasa a memoria libre».
   - Lo que no se pueda medir dice **No disponible**; nunca se inventa un número.
4. Si Windows indica que hay un juego, una presentación o una aplicación a pantalla completa, antes de **Moderado** y **Profundo** aparece el aviso «Hay un juego o una aplicación a pantalla completa: liberar memoria puede causar tirones.»; puede continuar o cancelar.
5. Al terminar se abre **Aumento medido ahora**, con la memoria disponible antes y después, el aumento de la memoria disponible y el de la memoria libre. «Disponible» es la memoria libre más la lista de espera de Windows, la misma que usa la tarjeta **Memoria** de **Inicio**. Es lo medido en ese instante: Windows reutiliza esa memoria enseguida, así que puede volver a bajar en cuanto otro programa la pida.

Nada se cierra ni se termina: solo se vacía el conjunto de trabajo de los procesos de su usuario y sesión, comprobando de nuevo cada uno justo antes de actuar. Nunca se tocan los procesos del sistema, los servicios de Windows, los de otros usuarios, los elevados, los antivirus, FlyEnv ni PhpWebStudy. Si algo no se puede vaciar, se omite y el resumen lo cuenta.

## Ejemplo

Va a cambiar de computadora y quiere llevar su entorno de desarrollo:

1. En el equipo actual, abra **Ajustes → Respaldo y perfiles**, marque **Incluir las bases de datos**, escriba una frase segura y pulse **Exportar perfil…** para generar `mi-entorno.wolfperfil`.
2. En el equipo nuevo, instale WolfCore Dev, abra **Ajustes → Respaldo y perfiles → Importar perfil…**, elija `mi-entorno.wolfperfil`, reasigne la ruta de sus carpetas de proyectos (por ejemplo `D:\Proyectos` → `C:\Proyectos`) y confirme.
3. Por último, vuelva a introducir sus claves de IA o tokens en el equipo nuevo y confíe en la CA desde **Ajustes → HTTPS**.

## Si algo falla

- **Olvidó la frase de un archivo `.wolfperfil`:** no es posible recuperar las bases ni la CA cifradas sin esa frase; aun así puede marcar **Importar sin las bases** para importar sitios, versiones, plantillas y ajustes.
- **Al cambiar el puerto de Nginx los túneles abiertos dejaron de responder:** los túneles ya abiertos siguen apuntando al puerto anterior; renuévelos desde **Túneles**.
- **Liberar memoria muestra «Liberaría hasta ≈ N» o «No disponible»:** Windows no dejó leer la memoria privada de algún proceso sin permiso de administrador (da un tope) o no se pudo medir ese dato; nada se inventa. Si el listado de procesos falla, la estimación sale como **No disponible** y puede volver a abrir el menú.
- **En Profundo cancelé el permiso de administrador, no respondí a tiempo o Windows no vació la caché:** el resultado lo dice (solo se vaciaron los procesos, o la lista de espera se vació pero la caché de archivos no). Si la ventana del permiso de Windows sigue abierta, puede cancelarla: ya no hace nada.
- **Al importar un perfil aparecen «Puertos ocupados»:** complete la importación y luego cambie esos puertos desde **Servicios → Versiones**.
