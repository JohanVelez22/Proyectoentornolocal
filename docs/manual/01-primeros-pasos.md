# 01 · Primeros pasos

## Para qué sirve

Este capítulo explica los requisitos del equipo, cómo instalar y abrir **WolfCore Dev** por primera vez, cómo recorrer la interfaz con el **Recorrido de bienvenida**, cómo está organizada la barra lateral y cómo moverse rápido con la **Paleta de comandos** (`Ctrl+K`).

## Requisitos del equipo

- **Sistema operativo:** Windows 10 u 11 de 64 bits (para descomprimir respaldos `.rar` o `.7z` se usa el `tar.exe` de Windows 11).
- **Conexión a internet:** necesaria para descargar versiones de servicios desde sus fuentes oficiales, abrir túneles públicos o descargar modelos de IA. Una vez instalados, los sitios locales y la pantalla **Herramientas** funcionan sin conexión.
- **Permisos:** la instalación es por usuario. Solo se pide permiso de administrador de Windows (UAC) cuando modifica el archivo `hosts`, instala herramientas del sistema (como Visual C++ o Build Tools) o ejecuta comandos opcionales del cortafuegos.

## Paso a paso

### 1. Instalar y abrir WolfCore Dev

1. Ejecute el instalador `WolfCore Dev Setup <versión>.exe`.
2. Si Windows SmartScreen muestra un aviso porque el instalador no está firmado, confirme que desea ejecutarlo.
3. Elija la carpeta de instalación del programa y complete el asistente.
4. Abra **WolfCore Dev** desde el menú Inicio o el acceso directo del escritorio.

> **Nota si actualizó desde la versión antigua «Entorno Local»:** cierre antes «Entorno Local» desde su icono de la bandeja (**Salir → Sí, apagar**) y desinstálela desde **Configuración → Aplicaciones**. La carpeta de datos se migra automáticamente de `%LOCALAPPDATA%\Proyectoentornolocal` a `%LOCALAPPDATA%\WolfCoreDev` sin borrar sus sitios ni bases.

### 2. Conocer la carpeta de datos

WolfCore Dev guarda binarios, configuraciones, certificados, bases de datos y registros en una sola carpeta:

`%LOCALAPPDATA%\WolfCoreDev`

Puede abrirla en cualquier momento desde **Ajustes → General → Abrir carpeta**. Sus proyectos nunca se mueven dentro de esta carpeta: permanecen en las carpetas donde usted los guarda (por ejemplo `C:\Proyectos\mi-sitio`).

### 3. Recorrer el Recorrido de bienvenida

Al abrir WolfCore Dev por primera vez sin proyectos creados, se abre el **Recorrido de bienvenida** (no instala ni modifica nada en su equipo):

1. Revise cada uno de los 7 pasos con **Siguiente** y **Anterior**:
   - **Bienvenido a WolfCore Dev**
   - **Servicios**
   - **Proyectos**
   - **Bases de datos**
   - **Herramientas y Ctrl+K**
   - **Doctor**
   - **Todo listo**
2. Pulse **Empezar** al finalizar (o **Saltar** / `Esc` si prefiere cerrarlo).
3. Si quiere volver a verlo más adelante, vaya a **Ajustes → Apariencia e idioma → Ver el recorrido**.

[CAPTURA: Ventana del Recorrido de bienvenida mostrando el paso 1 sobre la pantalla principal]

### 4. Orientarse en la barra lateral y la barra superior

La barra lateral izquierda agrupa las pantallas en tres bloques y un acceso fijo al final:

- **Trabajo:** **Inicio**, **Proyectos**.
- **Entorno:** **Servicios** (con pestañas **Servicios**, **Versiones** y **PHP**), **Bases de datos**, **Correo**, **IA** (con pestañas **Agentes**, **Nube** y **Modelos locales**), **Túneles** y, si activa **Mostrar secciones avanzadas** en **Ajustes**, **Contenedores**.
- **Utilidades:** **Herramientas**, **Depuración**, **Doctor**, **Registros**.
- **Ajustes:** al pie de la barra lateral.

En la barra superior encontrará, de izquierda a derecha:

1. El título de la pantalla actual.
2. El buscador central (**Buscar o ejecutar un comando**, atajo `Ctrl+K`).
3. El botón **Memoria** (abre el **Optimizador de memoria**).
4. La campana de **Avisos** (abre el **Centro de avisos**).
5. Los selectores rápidos de **Cambiar idioma** (muestra el código del idioma activo, por ejemplo `ES`; la interfaz está disponible en 16 idiomas, ver [13 · Perfiles y ajustes](13-perfiles-y-ajustes.md)) y **Cambiar tema** (Claro, Oscuro o Sistema).
6. La **pastilla de estado** global, siempre visible con un texto corto:
   - **Conectando…** mientras carga y **Sin conexión** si no hay conexión con el núcleo.
   - **Todo apagado** si no hay ningún servicio encendido.
   - **N encendidos** (por ejemplo, `3 encendidos`) cuando hay servicios en marcha.
   - **N con error** (por ejemplo, `1 con error`) si algún servicio falló; el error manda sobre lo demás y la pastilla se tiñe de alerta.

   Al pasar el cursor por encima verá el detalle completo (servicios encendidos y túneles activos) y, al pulsarla, abre **Servicios**.

### 5. Usar la Paleta de comandos (`Ctrl+K`)

1. Pulse `Ctrl+K` desde cualquier pantalla (o haga clic en el buscador central de la barra superior).
2. Escriba parte del nombre de una pantalla, un servicio, un proyecto, una herramienta o una acción (por ejemplo, `php`, `nuevo`, `tema`, `doctor`).
3. Muévase con las teclas `↑` y `↓`, pulse `Enter` para ejecutar o `Esc` para cerrar.

[CAPTURA: Paleta de comandos abierta con Ctrl+K mostrando resultados agrupados por Ir a, Servicios, Proyectos y Herramientas]

### 6. Cerrar la aplicación y el icono de la bandeja

Al cerrar la ventana con la `X`, WolfCore Dev no se cierra: solo oculta la ventana y sigue en la bandeja del sistema, con sus servicios como estaban. Para abrirla de nuevo use el icono de la bandeja (**Abrir**). Para salir por completo:

1. Haga clic derecho en el icono de **WolfCore Dev** en la bandeja del sistema y elija **Salir**.
2. En el diálogo **¿Apagar los servicios?**, elija **Sí, apagar** para detener todo al salir o **No, dejarlos encendidos** para que sigan en segundo plano (los servicios arrancan sin ventanas de consola).

## Ejemplo

Un flujo habitual en los primeros 5 minutos tras instalar WolfCore Dev:

1. Pulse `Ctrl+K`, escriba `versiones` y entre en **Servicios → Versiones**.
2. Instale **Nginx**, **PHP 8.4** y **Composer**.
3. Pulse el botón de **Cambiar tema** en la barra superior para elegir tema **Oscuro**.
4. Vaya a **Ajustes → HTTPS** y pulse **Instalar autoridad** para confiar en los certificados locales `.test`.

## Si algo falla

- **Windows SmartScreen bloquea el instalador:** haga clic en *Más información* y luego en *Ejecutar de todas formas* si descargó el instalador de una fuente oficial del proyecto.
- **Al abrir aparece «Sin conexión con el núcleo»:** cierre la aplicación por completo y ábrala de nuevo. Si persiste, revise los registros en `%LOCALAPPDATA%\WolfCoreDev\logs`.
- **La carpeta de datos vieja no se renombró al migrar:** cierre cualquier programa que esté usando archivos dentro de `%LOCALAPPDATA%\Proyectoentornolocal` (como «Entorno Local» o una terminal abierta en esa ruta) y reinicie WolfCore Dev.
- **No ve «Contenedores» en la barra lateral:** pulse `Ctrl+K` y escriba `Contenedores`, o active **Mostrar secciones avanzadas** en **Ajustes → Apariencia e idioma**.
