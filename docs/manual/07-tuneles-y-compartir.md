# 07 · Túneles y compartir

## Para qué sirve

WolfCore Dev permite mostrar un proyecto local a otra persona o probarlo desde un teléfono móvil sin subirlo a un servidor: mediante **túneles públicos** (Cloudflare rápido o con nombre, ngrok, Expose y Tailscale) o mediante **Red local** con código QR e instalación guiada de la CA en el móvil.

## Paso a paso

### 1. Abrir un túnel rápido de Cloudflare (sin cuenta)

1. Asegúrese de tener **Nginx** encendido y **cloudflared** instalado (en **Servicios**).
2. En **Proyectos**, busque la tarjeta del sitio y asegúrese de que tenga marcada la confianza del proyecto si fue clonado o importado.
3. En la sección **Túnel** de la tarjeta, active el interruptor.
4. Lea el diálogo de confirmación (**Publicar el sitio en internet**) y pulse **Publicar**.
5. Espere unos segundos a que aparezca el enlace público `https://….trycloudflare.com`. Mientras esté abierto, WolfCore Dev actualiza la variable de URL base (por ejemplo, `APP_URL`) en el `.env` con copia previa y la restaura automáticamente al cerrar el túnel.
6. Use los botones para **Abrir el enlace público**, **Copiar el enlace público**, **Mostrar el código QR del enlace**, **Renovar (nuevo enlace)** o **Cerrar túnel**.

> **Nota sobre datos reales:** si un sitio está marcado con **datos reales**, cada publicación pide confirmación reforzada. Los túneles nunca se abren con **Iniciar todo**.

[CAPTURA: Pantalla Túneles con un túnel activo mostrando sitio, estado, enlace público y acciones Abrir, Copiar, Renovar y Cerrar]

### 2. Elegir otro proveedor en `Opciones del túnel`

En la tarjeta del proyecto, abra **Opciones del túnel** para elegir proveedor:

- **Rápido (sin cuenta):** enlace temporal de `trycloudflare.com` que cambia cada vez que se abre.
- **Con nombre (su dominio):** enlace fijo en un subdominio propio en Cloudflare (por ejemplo, `demo.ejemplo.com`):
  1. Pulse **Conectar con Cloudflare** y autorice en el navegador que se abre (el certificado queda en `<datos>/etc/cloudflared/`).
  2. Escriba el **Nombre del túnel** (minúsculas, números y guiones) y el **Dominio público**.
  3. Pulse **Crear y enrutar**. También dispone de **Recrear el túnel**, **Olvidar el túnel** u **Olvidar solo aquí**.
- **ngrok:** requiere tener `ngrok` instalado en su equipo. Pegue el **Token de ngrok** (se guarda cifrado y solo se pasa por variable de entorno), pulse **Guardar el token** y luego **Usar este proveedor**.
- **Expose:** requiere Expose instalado o `expose.phar` en `bin/expose` dentro de la carpeta de datos. Guarde el **Token de Expose**. Por seguridad, **Expose está bloqueado en sitios con datos reales** porque su inspector de peticiones queda visible en la red local.
- **Tailscale:** requiere tener Tailscale instalado y con sesión iniciada (WolfCore Dev no instala Tailscale). Elija el alcance:
  - **Serve: solo su tailnet** (privado para los equipos de su red Tailscale; no sale a internet).
  - **Funnel: todo internet** (público en internet; usa el puerto HTTPS `8443`).

### 3. Ver y administrar todos los túneles abiertos

Abra **Túneles** en la barra lateral para ver la tabla de túneles activos con sus columnas **Sitio**, **Estado**, **Enlace** y **Acciones** (**Abrir**, **Copiar**, **Renovar** y **Cerrar túnel**). Si cierra WolfCore Dev eligiendo dejar los servicios encendidos, los túneles siguen activos hasta que apague el equipo o los cierre; al apagar el equipo o cerrar el túnel, el `.env` se restaura.

### 4. Compartir en la red local con código QR (probar en el móvil)

Para abrir un sitio en su teléfono u otro equipo conectado al mismo Wi-Fi sin salir a internet:

1. Asegúrese de que **Nginx** esté encendido y el equipo esté conectado a una red local (Wi-Fi o Ethernet).
2. En la tarjeta del proyecto, active el interruptor **Red local**.
3. En el diálogo **Compartir en la red local**, verifique la **Red (IP de este equipo)** y elija si desea **Usar HTTPS** (obligatorio si el sitio redirige a HTTPS).
4. Pulse **Compartir en la red**. WolfCore Dev asigna un puerto LAN propio al sitio (en el rango `8100–8199`) y muestra la dirección y el botón **Mostrar el QR**.
5. Escanee el QR con su móvil conectado a la misma red. Al apagar el interruptor o cerrar WolfCore Dev, el sitio deja de compartirse automáticamente.

> **Seguridad:** los sitios marcados con **datos reales** no se pueden compartir en la red local, ni siquiera con confirmación.

[CAPTURA: Diálogo de Red local con el código QR, dirección IP local y el botón Instalar la CA en el móvil]

### 5. Instalar la CA en el móvil (para HTTPS en red local)

Si compartió un sitio por red local con **Usar HTTPS** y quiere evitar el aviso de certificado en el móvil:

1. Pulse **Instalar la CA en el móvil**.
2. WolfCore Dev abre un enlace temporal en la red local que entrega únicamente el archivo público `ca.crt` (nunca la clave privada) y se cierra solo pasados unos minutos.
3. Escanee el QR desde el móvil y siga los pasos que aparecen en el diálogo para **Android** o **iPhone o iPad**, **comparando siempre la huella SHA-256 (Android) o SHA-1 (iOS)** antes de confiar.
4. Instale la CA únicamente en sus propios dispositivos y retírela cuando ya no la necesite.

### 6. Compartir una carpeta o un archivo suelto

Para publicar algo que no es un sitio (por ejemplo, un PDF o una carpeta de capturas) no hace falta crear un proyecto:

1. Abra **Túneles** y pulse el enlace **Compartir carpeta o archivo…** (o abra directamente **Herramientas → Red → Compartir carpeta o archivo**; también hay un acceso con ese nombre en la tarjeta del servicio FTP de **Servicios**, porque el FTP nunca se comparte por túnel).
2. Elija la carpeta o el archivo, cuánto tiempo debe durar (**15 minutos**, **1 hora** o **4 horas**) y el túnel (**Cloudflare (rápido, sin cuenta)** o **ngrok (con su token)**).
3. Pulse **Compartir…**, lea la confirmación **Compartir en internet** (muestra la ruta exacta) y confirme.
4. Copie el **Enlace público** o muestre su **Código QR**. El enlace lleva un código secreto, es de solo lectura y se cierra solo al vencer el plazo. Pulse **Dejar de compartir** para cerrarlo antes.

El detalle de lo que se rechaza por seguridad y del registro de **Accesos** está en [10 · Herramientas](10-herramientas.md).

## Ejemplo

Necesita mostrar un avance de `mi-tienda.test` a un cliente remoto y probar el diseño en su teléfono:

1. En su escritorio, active **Red local** en la tarjeta de `mi-tienda.test`, escanee el QR con el teléfono y revise la vista móvil. Cuando termine, apague **Red local**.
2. Para la reunión con el cliente, abra **Opciones del túnel**, elija **Rápido (sin cuenta)**, active el interruptor **Túnel**, confirme en **Publicar** y envíe el enlace `https://….trycloudflare.com`. Al terminar la reunión, pulse **Cerrar túnel**.

## Si algo falla

- **No abre en el móvil al compartir en Red local:** compruebe que el móvil esté en la misma red Wi-Fi y que la red en Windows esté marcada como **Privada** (no Pública). WolfCore Dev nunca modifica el cortafuegos automáticamente: pulse **¿No abre en el móvil?** y copie el comando de PowerShell como administrador para abrir solo ese puerto en su subred local y redes privadas.
- **«No hay puertos libres entre 8100 y 8199»:** deje de compartir algún otro sitio en red local o cierre el diálogo de la CA móvil y reintente.
- **El túnel rápido da error al abrir o el enlace deja de responder:** compruebe que Nginx siga encendido y pulse **Renovar (nuevo enlace)** en **Túneles** o en la tarjeta del proyecto.
- **Cloudflare con nombre dice que registró un dominio distinto:** el dominio no pertenece a la zona autorizada en Cloudflare; elimine el registro incorrecto desde el panel web de Cloudflare y vuelva a autorizar la zona correcta.
- **Compartir carpeta o archivo dice que ngrok necesita su token:** guarde el token en las opciones del túnel de un sitio (**Opciones del túnel**) y vuelva a intentarlo; solo hay una compartición a la vez.
- **Quiere aprender más sobre Cloudflare y ngrok:** abra **Herramientas → Red → Guías → Túneles** para consultar la guía completa paso a paso con comandos copiables.
