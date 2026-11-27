# Guía de túneles locales (Cloudflare y ngrok)

Esta guía explica cómo mostrar un sitio que corre en su computadora (por ejemplo `http://localhost:8000` o `https://mi-sitio.test`) a través de una dirección pública temporal en internet, de forma segura y sin configurar su router.

---

## 0. En WolfCore Dev: lo más fácil

No necesita escribir comandos. En **Proyectos**, en la tarjeta de su sitio, active el interruptor **Túnel**. La app se encarga de lo demás:
- **le pide confirmación antes de publicar** (botón **Publicar**): el sitio queda en internet mientras el túnel siga abierto. En los sitios marcados como **Tiene datos reales de clientes** el aviso es más fuerte, y con Expose directamente no se permite;
- usa por defecto el túnel rápido de Cloudflare (sin cuenta). Para elegir otro proveedor (Cloudflare con nombre, ngrok, Expose o Tailscale) pulse el engranaje **Opciones del túnel**, junto al interruptor;
- necesita Nginx encendido y, con Cloudflare, cloudflared instalado desde **Servicios**; si falta algo, el interruptor se lo indica;
- abre el túnel hacia su sitio local con su dominio `.test` correcto;
- si el sitio tiene configurada una **Variable de URL base** (en Laravel se detecta `APP_URL`), escribe el enlace público en su `.env` mientras el túnel está abierto y lo deja como estaba al cerrarlo;
- muestra el enlace en la tarjeta, con los botones **Abrir el enlace público**, **Copiar el enlace público**, **Mostrar el código QR del enlace** y **Renovar (nuevo enlace)**. El código QR también está en **Herramientas → Generador de QR**.

Para cerrarlo, apaga el interruptor **Túnel**. La vista **Túneles** lista los que están abiertos.

Los comandos de esta guía sirven para entender qué pasa por debajo o para usar los túneles fuera de la app.

---

## 1. Qué es un túnel y cuándo usarlo

Un **túnel** crea un puente temporal y cifrado entre un servidor público en internet y un puerto de su computadora. Quien abra la dirección pública del túnel verá su proyecto local como si estuviera publicado en un servidor.

Cuándo conviene usarlo:
- **Mostrar un avance a un cliente**: compartes un enlace temporal para que revise el diseño o una pantalla sin tener que subir el proyecto a un hosting.
- **Probar en el celular o en otro equipo**: abre su sitio desde su teléfono con datos móviles (sin estar en el mismo Wi-Fi) para revisar diseño adaptable, cámara o pagos.
- **Recibir webhooks en local**: servicios externos (pasarelas de pago, bots, GitHub, mensajería) necesitan una dirección HTTPS pública para avisar a su aplicación cuando ocurre un evento.

---

## 2. Riesgos y reglas de seguridad

> **ADVERTENCIA:** Al abrir un túnel, **su sitio local queda publicado en internet**. Cualquiera que tenga o descubra el enlace puede entrar.

Siga siempre estas reglas:
1. **NUNCA abras túneles de sitios que contengan datos reales de clientes** (bases de datos de producción, correos reales, documentos, contraseñas o claves activas). Use siempre datos ficticios o de prueba (usuario `"demo"`, correos `@ejemplo.com`).
2. **Cierre el túnel en cuanto termine** la prueba o la demostración (`Ctrl+C` en la terminal o desde el botón de detener).
3. **Desactive herramientas peligrosas** antes de compartir: no exponga paneles de base de datos (phpMyAdmin/Adminer), rutas de depuración sin contraseña ni archivos `.env`.
4. **No deje `APP_DEBUG=true`** si va a pasar el enlace a terceros, ya que una página de error puede mostrar variables de entorno y rutas internas de su equipo.

---

## 3. Cloudflare rápido (`trycloudflare`)

Es la forma más rápida de obtener un enlace HTTPS temporal: **no requiere cuenta** ni dominio propio.

### Comando básico

Si su proyecto corre en el puerto `8000` (por ejemplo FastAPI, Vite o PHP):

```bash
cloudflared tunnel --url http://localhost:8000
```

Si su sitio pasa por Nginx local con un dominio `.test` (por ejemplo `mi-sitio.test` en el puerto `80`), indique también el dominio, porque Nginx elige el sitio según la cabecera `Host`:

```bash
cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test
```

En pocos segundos verá una URL temporal parecida a:

```text
https://ejemplo-aleatorio.trycloudflare.com
```

### Limitaciones de `trycloudflare`
- La dirección **cambia cada vez** que cierra y vuelve a abrir el túnel.
- Está pensado para pruebas cortas y demostraciones, **no para producción**.
- No ofrece SLA ni panel de inspección de tráfico local como ngrok.
- Si reinicia el proceso, tendrá que volver a pegar la nueva URL en sus webhooks o enviarla otra vez al cliente.

---

## 4. Cloudflare con dominio propio (túnel con nombre)

Si necesita una dirección fija (por ejemplo `demo.ejemplo.com`) y tiene un dominio administrado en Cloudflare, puede crear un túnel con nombre.

> En los ejemplos siguientes sustituya `ejemplo.com` por su dominio de prueba y `mi-tunel-demo` por el nombre que elija.

### Paso 1: Iniciar sesión en Cloudflare

```bash
cloudflared tunnel login
```

Se abrirá el navegador para elegir el dominio que quiere autorizar y se guardará un certificado en su equipo.

### Paso 2: Crear el túnel

```bash
cloudflared tunnel create mi-tunel-demo
```

Cloudflare asignará un identificador (UUID) y guardará el archivo de credenciales local del túnel.

### Paso 3: Asociar un subdominio DNS

```bash
cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com
```

Esto crea un registro CNAME en Cloudflare apuntando `demo.ejemplo.com` hacia su túnel.

### Paso 4: Ejecutar el túnel

Puede iniciarlo directamente apuntando a su puerto local:

```bash
cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo
```

Cuando ya no quiera publicar el sitio, pulse `Ctrl+C` en la terminal.

### Paso 5: Borrar el túnel cuando ya no lo necesites

```bash
cloudflared tunnel cleanup mi-tunel-demo
cloudflared tunnel delete mi-tunel-demo
```

Recuerde eliminar también el registro DNS de prueba en el panel de Cloudflare si no va a reutilizar el subdominio.

---

## 5. ngrok

`ngrok` es otra herramienta muy popular para túneles locales. Su gran ventaja para desarrolladores es el **inspector local** que permite ver y reenviar cada petición HTTP (ideal para depurar webhooks).

### Instalación y configuración inicial

1. Descargue e instale `ngrok` (o use la versión instalada en su entorno).
2. Cree una cuenta gratuita en ngrok y copie su token de autenticación.
3. Registre su token una sola vez (reemplace `MI_TOKEN` por su token real):

```bash
ngrok config add-authtoken MI_TOKEN
```

### Abrir un túnel a un puerto local

```bash
ngrok http 8000
```

### Abrir un túnel a un sitio con dominio `.test` (Nginx)

Nginx elige el sitio según la cabecera `Host`, así que ngrok debe enviarla con su dominio local. Apunte al puerto HTTP (`80`): ngrok ya entrega el enlace público con HTTPS.

```bash
ngrok http 80 --host-header=mi-sitio.test
```

> **Nota:** en las versiones recientes de ngrok, `--host-header` está marcado como obsoleto. Lo recomendado es una *política de tráfico* (un archivo YAML que reescribe la cabecera `Host`) que se pasa con `--traffic-policy-file`. Si su versión avisa que la opción está obsoleta, consulte la documentación oficial de *Traffic Policy* de ngrok. WolfCore Dev ya usa la política de tráfico por usted.

> **Evite** `ngrok http 443`: así ngrok le habla en HTTP sin cifrar a un puerto que espera HTTPS, y el sitio falla. Si de verdad necesita el puerto 443, la dirección debe empezar por `https://` (`ngrok http https://localhost:443 ...`) y el certificado local debe ser de confianza.

### Inspector local

Mientras ngrok está corriendo, abra en su navegador:

```text
http://127.0.0.1:4040
```

Ahí verá en vivo cada petición que llega por el túnel (cabeceras, JSON, código HTTP) y podrá pulsar **Replay** para volver a disparar un webhook sin tener que repetir la acción en el servicio externo.

### Límites del plan gratuito (en términos generales)
- Requiere cuenta y `authtoken`.
- La primera vez que un visitante abre el enlace en un navegador, ngrok muestra una pantalla de aviso intersticial que el usuario debe aceptar.
- Existen límites en la cantidad de túneles simultáneos, tráfico mensual y conexiones activas, que pueden cambiar según las condiciones vigentes de ngrok.

---

## 6. Problemas comunes y cómo resolverlos

### Error `502 Bad Gateway`
- **Causa:** el túnel está activo, pero no hay ningún servicio escuchando en el puerto local indicado, o PHP (php-cgi en Windows, PHP-FPM en Linux y macOS) o su servidor de desarrollo está apagado.
- **Solución:** compruebe primero en su propio equipo que `http://localhost:PUERTO` o `https://mi-sitio.test` abre bien antes de iniciar el túnel.

### `"Invalid Host header"` (Vite, Webpack, Angular, Django)
- **Causa:** el servidor de desarrollo bloquea peticiones cuyo encabezado `Host` no coincide con `localhost`.
- **Solución:** permite el host del túnel en la configuración de desarrollo (por ejemplo `server.allowedHosts` en Vite o `ALLOWED_HOSTS` en Django) solo mientras dure la prueba.

### Redirecciones inesperadas a `http://` o a `mi-sitio.test`
- **Causa:** su aplicación o Nginx genera URLs absolutas usando el dominio local o el esquema `http` porque no confía en las cabeceras del proxy (`X-Forwarded-Proto`, `X-Forwarded-Host`).
- **Solución:** configure la aplicación para confiar en proxies (en Laravel, revise `TrustProxies`; en FastAPI/uvicorn, use `--proxy-headers`).

### `APP_URL` en Laravel
- **Causa:** si `APP_URL=http://mi-sitio.test` en `.env`, los enlaces de correos, redirecciones o rutas firmadas apuntarán a `mi-sitio.test` (que no existe en el celular del cliente).
- **Solución:** durante la demo, actualice temporalmente `APP_URL` a la URL HTTPS del túnel y ejecute `php artisan config:clear`. Al terminar, vuelva a dejar su `APP_URL` local.

### Cookies, sesión y error `419 Page Expired` (CSRF)
- **Causa:** `SESSION_DOMAIN` en `.env` está fijado a `mi-sitio.test` (el navegador descarta la cookie al visitar el dominio del túnel) o `SESSION_SECURE_COOKIE` no coincide con HTTPS.
- **Solución:** deje `SESSION_DOMAIN=null` (vacío) durante la prueba por túnel, ejecute `php artisan config:clear`, borre las cookies del navegador y recargue el formulario.

### Mixed Content (estilos o scripts bloqueados)
- **Causa:** el túnel abre en `https://`, pero la página intenta cargar CSS, JS o imágenes desde `http://`. El navegador bloquea esos recursos por seguridad.
- **Solución:** use rutas relativas (`/assets/app.css`) o fuerza esquema HTTPS cuando la petición viene por proxy (`URL::forceScheme('https')` en Laravel cuando corresponda).

---

## 7. Por qué FTP NO se comparte por túnel

**Nunca compartas un servidor FTP clásico (puerto 21) mediante un túnel a internet:**
- El protocolo FTP estándar envía **el usuario, la contraseña y los archivos en texto plano (sin cifrar)**, además de usar múltiples puertos dinámicos para transferir datos que suelen fallar a través de túneles HTTP.
- Exponer FTP a internet abre una superficie de ataque innecesaria sobre los archivos de su equipo.
- Por eso **WolfCore Dev no ofrece un túnel TCP de ngrok para FTP**: un túnel TCP público dejaría la clave a la vista de cualquiera que pueda observar el tráfico.

### Alternativas recomendadas
- **En la misma oficina o casa (red local):** use el interruptor **Red local** de su sitio, o el FTP con la red local activada, para compartir los archivos dentro de su red privada sin salir a internet.
- **Transferencia cifrada:** **SFTP** (sobre SSH) o **FTPS** (FTP con TLS) con cuentas dedicadas y contraseñas fuertes. WolfCore Dev lo incorporará más adelante. Mientras tanto, también puede sincronizar el código con **Git** (GitHub/GitLab/Bitbucket).

---

## 8. Chuleta de comandos

| Herramienta | Comando | Para qué sirve |
|---|---|---|
| `cloudflared` | `cloudflared tunnel --url http://localhost:8000` | Abre un túnel HTTPS rápido y temporal sin cuenta (`trycloudflare`). |
| `cloudflared` | `cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test` | Abre un túnel rápido enviando la cabecera `Host` de un sitio local en Nginx. |
| `cloudflared` | `cloudflared tunnel login` | Autoriza su equipo en su cuenta de Cloudflare para usar un dominio propio. |
| `cloudflared` | `cloudflared tunnel create mi-tunel-demo` | Crea un túnel con nombre persistente. |
| `cloudflared` | `cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com` | Conecta un subdominio de su dominio en Cloudflare al túnel. |
| `cloudflared` | `cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo` | Inicia el túnel con nombre apuntando a su puerto local. |
| `cloudflared` | `cloudflared tunnel cleanup mi-tunel-demo` | Cierra las conexiones que hayan quedado abiertas del túnel antes de borrarlo. |
| `cloudflared` | `cloudflared tunnel delete mi-tunel-demo` | Elimina un túnel con nombre que ya no necesita. |
| `ngrok` | `ngrok config add-authtoken MI_TOKEN` | Guarda su token de cuenta en la configuración local de ngrok. |
| `ngrok` | `ngrok http 8000` | Expone el puerto local `8000` con una URL pública HTTPS. |
| `ngrok` | `ngrok http 80 --host-header=mi-sitio.test` | Expone un sitio local de Nginx enviando su dominio `.test` en la cabecera `Host`; el enlace público ya sale con HTTPS. |
| `ngrok` | Abrir `http://127.0.0.1:4040` en el navegador | Muestra el inspector local de peticiones y permite reenviar webhooks. |
