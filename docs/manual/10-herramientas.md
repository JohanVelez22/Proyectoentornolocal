# 10 · Herramientas

## Para qué sirve

La pantalla **Herramientas** reúne utilidades diarias pensadas para desarrolladores que funcionan **100 % sin conexión** y sin enviar sus archivos ni datos a servicios externos, organizadas en 5 secciones y con buscador instantáneo.

## Paso a paso

1. Abra **Herramientas** en la barra lateral (o pulse `Ctrl+K` y escriba directamente el nombre de la utilidad que busca).
2. Use el campo **Buscar herramienta…** arriba para filtrar al instante por nombre o descripción.
3. Haga clic en cualquier tarjeta: se abre en un panel lateral deslizable (las tarjetas **Comparar**, **QR** y **Guías** contienen varias pestañas dentro del mismo panel).

[CAPTURA: Pantalla Herramientas mostrando el buscador y las secciones Código, Red, Seguridad, Archivos y medios y Sistema]

### Catálogo completo por sección

#### Código

- **Editor de código:** editor ligero con resaltado de sintaxis para archivos de texto. Al guardar pide confirmación y crea antes una copia previa en la carpeta de datos. Si abre un archivo con posibles secretos o de un sitio con datos reales, pide escribir el nombre del archivo para confirmar; si intenta abrir un `.env`, le redirige a **Variables .env…**.
- **Buscar:** busca texto literal o expresiones regulares en nombres y contenido de un proyecto, carpeta o archivo (omite `node_modules`, `vendor`, `.git` y binarios por defecto, sin seguir enlaces). Permite abrir cada coincidencia en la línea exacta con su editor predeterminado.
- **Comparar** (2 pestañas):
  - **Textos:** compara dos textos o dos archivos lado a lado (hasta 5 MB).
  - **Carpetas:** compara dos carpetas listando archivos solo en una, solo en la otra o distintos, con el diff de cada archivo.
- **Expresiones regulares:** probador con coincidencias resaltadas, grupos de captura, banderas y referencia rápida.
- **JSON:** formatea, valida (indicando línea y columna de error), minifica y muestra el árbol interactivo.
- **Vista previa de Markdown:** escribe Markdown y ve la vista renderizada al lado.

#### Red

- **Cliente HTTP:** prueba APIs locales o remotas con peticiones, cabeceras, cuerpo, pestaña de autenticación, entornos, variables (los secretos se guardan cifrados), colecciones, historial e importación de comandos `curl`.
- **Puertos y procesos:** lista qué proceso escucha en cada puerto con su PID y direcciones, permite filtrar y finalizar procesos (con confirmación; bloquea procesos del sistema y a WolfCore Dev).
- **Cliente WebSocket:** conecta a un servidor WebSocket, envía mensajes y muestra el historial recibido.
- **Certificados:** emite certificados locales firmados con la CA de WolfCore Dev para cualquier dominio o IP que necesite en pruebas.
- **Compartir carpeta o archivo:** publica una carpeta o un archivo con un enlace temporal en internet, de solo lectura (el enlace vence a los 15 minutos, 1 hora o 4 horas). Se rechazan `.env*`, claves, `.git`, `.ssh`, datos de programas, archivos con secretos, la carpeta de datos de WolfCore Dev, la raíz de una unidad y la carpeta de usuario entera; un archivo comprimido se comparte tal cual, sin revisar su interior.
- **Guías** (3 pestañas):
  - **HTTP:** referencia buscable de métodos y códigos de estado HTTP con ejemplos; cada ejemplo se abre en el **Cliente HTTP** con el botón **Probar** (no se envía nada hasta que usted pulse **Enviar**).
  - **Túneles:** guía paso a paso de Cloudflare y ngrok con comandos listos para copiar.
  - **Git:** guía de Git y GitHub más un **Laboratorio Git** aislado en una carpeta propia de WolfCore Dev (con ejercicio guiado de resolución de conflictos) que nunca toca sus proyectos ni usa internet.

#### Seguridad

- **Contraseñas:** incluye un medidor local de fortaleza y una auditoría de hashes sobre una tabla de usuarios de una base local (compara contra 200 contraseñas muy comunes en bcrypt, PBKDF2 de Django, MD5/SHA-1 y Argon2 si está disponible; marca cuentas débiles **sin mostrar nunca la contraseña** y ofrece restablecerla guardando copia previa de la fila).
- **Cripto:** calcula hashes, codifica/decodifica Base64 y URL, genera UUID y contraseñas seguras e inspecciona tokens JWT localmente.
- **Entorno del sistema:** muestra el PATH, versiones detectadas y variables de entorno (enmascarando las que parecen secretas).

#### Archivos y medios

- **Imágenes:** convierte imágenes a `.ico` o `.png` y comprime JPEG/WebP mostrando el peso antes y después sin sobrescribir el original.
- **ZIP y PDF:** comprime archivos o carpetas a `.zip` y optimiza archivos `.pdf` sin tocar el original.
- **Conversor de documentos:** convierte localmente Word (`.docx` → HTML/Markdown), Excel/CSV (`.xlsx` ↔ `.csv`), Markdown → HTML/PDF, PDF → texto y HTML → PDF en un proceso separado (los formatos `odt`, `pptx` o `doc` aparecen solo si tiene LibreOffice instalado).
- **Información de archivo:** muestra tamaño, tipo y hashes criptográficos de cualquier archivo.
- **Uso del disco:** muestra qué ocupa espacio en una unidad o carpeta con un árbol, los archivos y carpetas mayores y el desglose por extensión (solo lectura).
- **Limpieza BOM UTF-8:** detecta y quita la marca de orden de bytes (BOM) de archivos o carpetas.
- **QR** (2 pestañas):
  - **QR:** genera códigos QR descargables en PNG desde cualquier texto o enlace de túnel.
  - **Wi-Fi:** genera un QR para conectar dispositivos a su Wi-Fi (advierte que el QR contiene la clave).
- **Captura de pantalla:** captura **Región**, **Ventana** o **Pantalla completa** con editor rápido (recuadro, flecha, línea, resaltador, texto, **Pixelar** y **Ocultar** con relleno sólido — use **Ocultar** para datos sensibles), copiar, guardar PNG/JPG o **Enviar al conversor de imágenes**. El atajo global se configura en **Ajustes → Captura de pantalla**.
- **Grabar pantalla:** abre la grabadora integrada del sistema (en Windows, Recortes con `Win + Shift + R` o Xbox Game Bar con `Win + Alt + R`).

#### Sistema

- **Limpieza de disco:** analiza primero cuánto ocupan categorías seguras (`%TEMP%` con más de 24 h, cachés de Chrome/Edge/Brave/Firefox **solo con el navegador cerrado**, descargas y registros antiguos de WolfCore Dev, y opcionalmente Prefetch de Windows como administrador) y borra únicamente lo que usted confirme. Nunca toca proyectos, bases de datos, respaldos ni `.env`.
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
- **No funciona el atajo global de Captura de pantalla:** revise **Ajustes → Captura de pantalla**; el atajo está desactivado por defecto o podría estar ocupado por otro programa.
