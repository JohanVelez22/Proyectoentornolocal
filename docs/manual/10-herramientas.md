# 10 · Herramientas

## Para qué sirve

La pantalla **Herramientas** reúne utilidades diarias pensadas para desarrolladores que funcionan sin conexión y sin servicios externos, organizadas en 5 secciones (**Código**, **Red**, **Seguridad**, **Archivos y medios** y **Sistema**) y con buscador instantáneo. Solo usan la red las que por su naturaleza lo necesitan y solo cuando usted las acciona: **Cliente HTTP**, **Cliente WebSocket** y **Compartir carpeta o archivo**.

## Paso a paso

1. Abra **Herramientas** en la barra lateral (o pulse `Ctrl+K` y escriba directamente el nombre de la utilidad que busca).
2. Use el campo **Buscar herramienta…** arriba para filtrar al instante por nombre o descripción.
3. Haga clic en cualquier tarjeta: se abre en un panel lateral deslizable (las tarjetas **Comparar**, **QR** y **Guías** contienen varias pestañas dentro del mismo panel). El buscador también encuentra una herramienta por el nombre de sus pestañas.
4. Otras pantallas lo llevan aquí directamente: la paleta `Ctrl+K`, el botón **Ver qué ocupa más** de **Inicio** o el botón **Probar** de la **Guía HTTP**.

[CAPTURA: Pantalla Herramientas mostrando el buscador y las secciones Código, Red, Seguridad, Archivos y medios y Sistema]

### Catálogo completo por sección

Hay **26 tarjetas** repartidas en las 5 secciones (las tarjetas **Comparar**, **QR** y **Guías** reúnen varias herramientas en pestañas). Cada sección se lista en el orden en que aparece en pantalla.

#### Código

- **Editor de código:** editor ligero con resaltado de sintaxis para archivos de texto de hasta 2 MB. Pulse **Abrir archivo…**, edite y pulse **Guardar**: siempre pide confirmación (**Guardar con copia previa**) y deja antes una copia en la carpeta de datos (la ruta aparece como **Copia previa**). El pie indica **Sin cambios** o **Cambios sin guardar** y la línea y columna del cursor. Casos especiales:
  - Si el archivo parece contener secretos o es de un sitio con **datos reales**, pide escribir el nombre del archivo para confirmar (**Archivo delicado**: **Abrir de todos modos** o **Guardar de todos modos**).
  - Si intenta abrir un `.env`, el editor no lo abre y ofrece el botón **Abrir el .env de la raíz del proyecto**, que lleva al gestor de variables del proyecto (**Variables .env…**); ese botón abre el `.env` de la raíz, que puede no ser el archivo que intentó abrir.
  - Si el archivo mezcla saltos de línea, debe marcar **Acepto normalizar los saltos de línea** (al guardar se convierten todos a LF).
  - Si el archivo es un enlace duro, avisa de que al guardar se rompe ese enlace.
  - Si otro programa lo cambió mientras estaba abierto, aparece **El archivo cambió fuera del editor**: elija **Recargar y descartar mis cambios** o **Sobrescribir…**.
  - Al salir con cambios sin guardar, pide **Descartar cambios** o **Seguir editando**.
- **Buscar:** busca texto literal o expresiones regulares en nombres y contenido de un proyecto, carpeta o archivo (omite `node_modules`, `vendor`, `.git` y binarios por defecto, sin seguir enlaces). Elija **Dónde buscar**, el modo (**Nombres**, **Contenido** o **Ambos**) y pulse **Buscar**; cada coincidencia se abre en la línea exacta con **Abrir en el editor** (el editor predeterminado). Los archivos sensibles indican que hay coincidencia pero no muestran su contenido.
- **Comparar** (2 pestañas):
  - **Textos:** compara dos textos o dos archivos lado a lado (hasta 5 MB cada uno) con **Cargar archivo** y **Comparar**.
  - **Carpetas:** compara dos carpetas (**Carpeta A** y **Carpeta B**) sin cambiar nada, listando **Solo en A**, **Solo en B** y **Distintos**, con el diff de cada archivo. Los archivos sensibles (`.env`, claves o datos reales) se marcan como distintos pero no muestran su contenido.
- **Expresiones regulares:** probador con coincidencias resaltadas, grupos de captura, banderas y **Referencia rápida**.
- **JSON:** formatea, valida (indicando línea y columna de error), minifica y muestra el árbol interactivo.
- **Vista previa de Markdown:** escribe Markdown y ve la vista renderizada al lado (el HTML crudo se muestra como texto y las imágenes no se cargan).

#### Red

- **Cliente HTTP:** prueba APIs locales o remotas. Tiene cuatro pestañas:
  - **Petición:** elija el **Método**, escriba la **URL** (puede usar variables como `{{base}}`) y complete **Parámetros**, **Cabeceras**, **Cuerpo** (**JSON**, **Formulario (urlencoded)**, **Multipart (solo texto)** o **Texto sin formato**), **Autenticación** (**Bearer**, **Basic** o **API key**) y **Opciones** (plazo de 1 a 120 segundos; **Ignorar errores de certificado en esta petición**, que es peligroso y solo vale para esa petición). Pulse **Enviar** (`Ctrl+Enter`). La respuesta muestra **Estado**, **Tiempo**, **Tamaño**, **Cuerpo**, **Cabeceras** y **Redirecciones** (hasta 10 MB de respuesta y 10 redirecciones; sin cookies guardadas ni proxy del sistema). Con **Copiar como curl** obtiene el comando equivalente y con **Importar curl** pega uno existente (solo se lee como texto, nunca se ejecuta).
  - **Colección:** las peticiones guardadas con **Guardar en la colección**.
  - **Historial:** las últimas 100 peticiones, con las cabeceras sensibles ocultas como `***`.
  - **Entornos:** variables como `{{base}}` o `{{token}}`; las marcadas como **Secreta** se guardan cifradas. Elija el **Entorno** activo arriba.

  Los secretos (tokens, contraseñas, claves de API) se guardan cifrados en el equipo: la colección, el historial y los entornos solo guardan una referencia. Los sitios `.test` de WolfCore Dev se validan con su propia CA.
- **Puertos y procesos:** lista qué proceso escucha en cada puerto con su PID y direcciones, permite filtrar y finalizar procesos (con confirmación: debe escribir el nombre del proceso; bloquea procesos del sistema y a WolfCore Dev).
- **Cliente WebSocket:** conecta a un servidor `ws://` o `wss://`, envía mensajes y muestra el historial (los últimos 500).
- **Certificados:** emite certificados locales firmados con la CA de WolfCore Dev para cualquier dominio o IP que necesite en pruebas. El `.crt` se guarda donde elija y la clave `.key` junto a él.
- **Compartir carpeta o archivo:** publica una carpeta o un archivo con un enlace temporal en internet, de solo lectura (quien tenga el enlace puede ver y descargar, no subir ni cambiar nada). Para usarlo:
  1. Elija la carpeta o el archivo (**Elegir carpeta…** o **Elegir archivo…**).
  2. Elija en cuánto tiempo se deja de compartir (**Dejar de compartir en**: **15 minutos**, **1 hora** o **4 horas**) y el **Túnel** (**Cloudflare (rápido, sin cuenta)** o **ngrok (con su token)**).
  3. Pulse **Compartir…** y confirme **Compartir en internet** (la confirmación muestra la ruta exacta y la ruta real con los enlaces resueltos).
  4. Use **Copiar enlace** o el **Código QR del enlace**. La lista de **Accesos** (los últimos 200, solo en memoria) muestra hora, IP, ruta y código de cada visita sin revelar el código secreto. **Dejar de compartir** lo cierra antes de tiempo.

  Se rechazan `.env*`, claves, `.git`, `.ssh`, datos de programas, archivos con secretos, la carpeta de datos de WolfCore Dev, la raíz de una unidad y la carpeta de usuario entera. Los archivos de texto o de tipo desconocido de más de 8 MB no se comparten, porque no se pueden revisar por completo. Un archivo comprimido (`.zip`, `.7z`, `.gz`) se comparte tal cual, sin revisar su interior: si dentro hay un `.env` o claves, se publican. Solo hay una compartición a la vez y el FTP nunca se comparte por túnel. Ver también [07 · Túneles y compartir](07-tuneles-y-compartir.md).
- **Guías** (3 pestañas):
  - **HTTP:** referencia buscable (**Buscar por número, nombre o texto**) con dos vistas, **Métodos** y **Códigos de estado** (con filtro por **Familia**: 1xx a 5xx). Cada entrada explica sus **Causas comunes** y **Cómo solucionarlo**, y trae un **Ejemplo** que puede copiar (**Copiar el ejemplo**) o abrir en el **Cliente HTTP** con el botón **Probar**; no se envía nada hasta que usted pulse **Enviar**. Los ejemplos apuntan a un servidor de ejemplo que WolfCore Dev levanta solo en `127.0.0.1` (accesible únicamente desde su equipo) mientras usa la guía o el cliente, y que se apaga al salir o tras 10 minutos sin uso.
  - **Túneles:** guía paso a paso de Cloudflare y ngrok con comandos listos para copiar (**Copiar el comando**).
  - **Git:** tiene dos vistas, **Guía** y **Laboratorio**.
    - **Guía:** temas y comandos buscables (**Buscar un tema o comando**) por grupo (**Lo básico**, **Ramas**, **Deshacer**, **Remotos y etiquetas** y **GitHub**), con ejemplos, **Errores comunes** y la marca **Peligroso** en los comandos que pueden hacer perder trabajo. La parte de GitHub es solo explicación: WolfCore Dev no crea cuentas, no inicia sesión en GitHub ni usa tokens desde esta guía. El botón **Practicar en el laboratorio** lleva a la otra vista.
    - **Laboratorio:** un repositorio de práctica y un «remoto» local en una carpeta propia de WolfCore Dev, con el git de su sistema (si no está instalado, dice **Git no está instalado**). No usa internet ni GitHub y no toca sus proyectos ni su configuración de git. Tiene botones de órdenes agrupados (**Lo básico**, **Ramas**, **Guardar y deshacer** y **Remoto local**), **Archivos de práctica** que puede editar (hasta 2000 caracteres), el panel **Salida**, el **Historial** de commits, **Reiniciar laboratorio** (borra solo la carpeta de práctica) y el **Ejercicio guiado: un conflicto**, de 6 pasos (**Ejecutar este paso**, **Empezar de nuevo**), para aprender a resolver un conflicto de merge.

#### Seguridad

- **Contraseñas** (2 pestañas):
  - **Fortaleza:** mide una contraseña localmente, sin enviarla ni guardarla.
  - **Auditar una base:** revisa una tabla de usuarios de una base local de MySQL, MariaDB o PostgreSQL (compara cada hash contra unas 200 contraseñas muy comunes en bcrypt, PBKDF2 de Django, MD5/SHA-1 y Argon2 si está disponible; no es un ataque de fuerza bruta). Marca las cuentas débiles **sin mostrar nunca la contraseña** y ofrece **Restablecer**, guardando antes una instantánea de la base y una copia de la fila. En bases de sitios con datos reales pide una confirmación adicional.
- **Cripto:** calcula hashes, codifica/decodifica Base64 y URL, genera UUID y contraseñas seguras e inspecciona tokens JWT localmente (sin verificar su firma).
- **Entorno del sistema:** muestra el PATH, versiones detectadas y variables de entorno (enmascarando las que parecen secretas).

#### Archivos y medios

- **Imágenes:** convierte imágenes a `.ico` o `.png` y comprime JPEG/WebP mostrando el peso antes y después sin sobrescribir el original.
- **ZIP y PDF:** comprime archivos o carpetas a `.zip` y optimiza archivos `.pdf` sin tocar el original.
- **Conversor de documentos:** convierte localmente Word (`.docx` → HTML/Markdown), Excel/CSV (`.xlsx` ↔ `.csv`), Markdown → HTML/PDF, PDF → texto y HTML → PDF en un proceso separado (los formatos `odt`, `pptx` o `doc` aparecen solo si tiene LibreOffice instalado; WolfCore Dev no lo instala).
- **Información de archivo:** muestra tamaño, tipo y hashes criptográficos de cualquier archivo (hasta 200 MB).
- **Uso del disco:** muestra qué ocupa espacio en una unidad (elija una de **Unidades**) o en una carpeta (**Elegir carpeta…**). Solo lee nombres y tamaños, nunca el contenido; no borra, mueve ni cambia nada. El resultado tiene cuatro vistas: **Árbol** (ordenado por tamaño; lo que pesa menos del 0,5 % del total se resume en **Otros**), **Carpetas** (las 50 con más peso propio), **Archivos** (los 50 más grandes) y **Extensiones** (las 20 que más ocupan). En cada fila puede **Abrir en el Explorador** o **Copiar ruta**. Avisa de lo que no pudo contar (enlaces o uniones que no sigue y carpetas sin permiso; sin permisos de administrador no se leen algunas carpetas del sistema) y de que los tamaños son lógicos, no el espacio realmente ocupado. Debajo, **Liberar espacio** remite a **Limpieza de disco** y a **Versiones sin uso** (en **Servicios**). También se llega desde **Inicio** → **Espacio en disco** → **Liberar espacio** → **Ver qué ocupa más**.
- **Limpieza BOM UTF-8:** detecta y quita la marca de orden de bytes (BOM) de archivos o carpetas, guardando una copia `.bak-bom` de cada uno.
- **QR** (2 pestañas):
  - **QR:** genera códigos QR descargables en PNG desde cualquier texto o enlace de túnel.
  - **Wi-Fi:** genera un QR para conectar dispositivos a su Wi-Fi (advierte que el QR contiene la clave; usted la escribe, WolfCore Dev nunca lee las contraseñas guardadas en el sistema).
- **Captura de pantalla:** captura **Región**, **Ventana** o **Pantalla completa** con editor rápido (**Recuadro**, **Flecha**, **Línea**, **Resaltador**, **Texto**, **Pixelar** y **Ocultar** con relleno sólido; use **Ocultar** para datos sensibles, porque **Pixelar** no es seguro), copiar, **Guardar…** en PNG/JPG o **Enviar al conversor de imágenes**. El atajo global se configura en **Ajustes → Captura de pantalla**.
- **Grabar pantalla:** WolfCore Dev no tiene grabadora propia: el botón **Abrir la grabadora** abre la que trae su sistema (en Windows, Recortes; la herramienta explica los atajos `Win + Shift + R` para Recortes y `Win + Alt + R` para la Xbox Game Bar). El video queda donde esa herramienta lo guarde.

#### Sistema

- **Limpieza de disco:** pulse **Analizar** para ver cuánto ocupan categorías seguras (**Archivos temporales** con más de 24 h, cachés de **Chrome**, **Edge**, **Brave** y **Firefox** **solo con el navegador cerrado**, **Descargas en caché de WolfCore Dev**, **Registros de WolfCore Dev** de más de 30 días y, opcionalmente, **Prefetch de Windows** como administrador), marque las que quiera y pulse **Limpiar lo marcado**; solo se borra lo que usted confirme. Los temporales y cachés se borran definitivamente (se regeneran solos); los registros y descargas de WolfCore Dev van a la papelera del sistema. Nunca toca proyectos, bases de datos, respaldos ni `.env`.
- **Tiempo:** convierte entre *timestamps* (segundos o milisegundos) y fechas con zonas horarias e ISO 8601.

[CAPTURA: Panel lateral abierto con la herramienta Cliente HTTP probando un endpoint local en https://mi-tienda.test/api/demo]

## Ejemplo

Quiere probar un endpoint local, inspeccionar su JSON y capturar una pantalla para enviarla al equipo ocultando un token:

1. Pulse `Ctrl+K`, escriba `Cliente HTTP` y haga una petición `GET` a `https://mi-tienda.test/api/productos`.
2. Copie la respuesta y ábrala en **Herramientas → Código → JSON** para navegar el árbol.
3. Abra **Herramientas → Archivos y medios → Captura de pantalla**, elija **Región**, use la herramienta **Ocultar** sobre cualquier dato privado y pulse **Guardar…**.

## Si algo falla

- **Limpieza de disco bloquea la caché de Edge o Chrome:** cierre por completo el navegador (en Edge desactive también el inicio rápido y las extensiones en segundo plano) y pulse **Analizar** de nuevo.
- **El Editor de código avisa que el archivo cambió fuera del editor:** otro programa lo modificó mientras estaba abierto; elija **Recargar y descartar mis cambios** o **Sobrescribir…** (guarda copia previa del contenido en disco).
- **El Laboratorio Git dice «Git no está instalado»:** instale Git en Windows y vuelva a abrir la pestaña; WolfCore Dev no instala Git automáticamente.
- **Compartir carpeta o archivo rechaza una ruta:** elija una carpeta más específica; no se pueden compartir la raíz de una unidad, la carpeta de usuario entera, la carpeta de datos de WolfCore Dev ni archivos con secretos. Si dice que ya hay algo compartido, pulse **Dejar de compartir** primero: solo hay una compartición a la vez.
- **Uso del disco avisa «No se pudo leer» en algunas carpetas:** son carpetas sin permiso (por ejemplo, del sistema); la herramienta solo lee y no pide administrador, así que esos tamaños no se cuentan.
- **No funciona el atajo global de Captura de pantalla:** revise **Ajustes → Captura de pantalla**; el atajo está desactivado por defecto o podría estar ocupado por otro programa.
