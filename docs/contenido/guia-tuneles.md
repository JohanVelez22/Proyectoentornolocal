# Guía de túneles locales (Cloudflare y ngrok)

Esta guía explica cómo mostrar un sitio que corre en tu computadora (por ejemplo `http://localhost:8000` o `https://mi-sitio.test`) a través de una dirección pública temporal en internet, de forma segura y sin configurar tu router.

---

## 0. En WolfCore Dev: lo más fácil

No necesitas escribir comandos. En la tarjeta de tu sitio activa el interruptor **Túnel** y elige el proveedor. La app se encarga de lo demás:
- abre el túnel hacia tu sitio local con su dominio `.test` correcto;
- ajusta la URL de tu `.env` (por ejemplo `APP_URL`) mientras el túnel está abierto, y la deja como estaba al cerrarlo;
- te muestra el enlace y su código QR, en **Herramientas → QR**;
- **bloquea o exige una confirmación reforzada** en los sitios marcados con datos reales de clientes.

Los comandos de esta guía sirven para entender qué pasa por debajo o para usar los túneles fuera de la app.

---

## 1. Qué es un túnel y cuándo usarlo

Un **túnel** crea un puente temporal y cifrado entre un servidor público en internet y un puerto de tu computadora. Quien abra la dirección pública del túnel verá tu proyecto local como si estuviera publicado en un servidor.

Cuándo conviene usarlo:
- **Mostrar un avance a un cliente**: compartes un enlace temporal para que revise el diseño o una pantalla sin tener que subir el proyecto a un hosting.
- **Probar en el celular o en otro equipo**: abres tu sitio desde tu teléfono con datos móviles (sin estar en el mismo Wi-Fi) para revisar diseño adaptable, cámara o pagos.
- **Recibir webhooks en local**: servicios externos (pasarelas de pago, bots, GitHub, mensajería) necesitan una dirección HTTPS pública para avisar a tu aplicación cuando ocurre un evento.

---

## 2. Riesgos y reglas de seguridad

> **ADVERTENCIA:** Al abrir un túnel, **tu sitio local queda publicado en internet**. Cualquiera que tenga o descubra el enlace puede entrar.

Sigue siempre estas reglas:
1. **NUNCA abras túneles de sitios que contengan datos reales de clientes** (bases de datos de producción, correos reales, documentos, contraseñas o claves activas). Usa siempre datos ficticios o de prueba (usuario `"demo"`, correos `@ejemplo.com`).
2. **Cierra el túnel en cuanto termines** la prueba o la demostración (`Ctrl+C` en la terminal o desde el botón de detener).
3. **Desactiva herramientas peligrosas** antes de compartir: no expongas paneles de base de datos (phpMyAdmin/Adminer), rutas de depuración sin contraseña ni archivos `.env`.
4. **No dejes `APP_DEBUG=true`** si vas a pasar el enlace a terceros, ya que una página de error puede mostrar variables de entorno y rutas internas de tu equipo.

---

## 3. Cloudflare rápido (`trycloudflare`)

Es la forma más rápida de obtener un enlace HTTPS temporal: **no requiere cuenta** ni dominio propio.

### Comando básico

Si tu proyecto corre en el puerto `8000` (por ejemplo FastAPI, Vite o PHP):

```bash
cloudflared tunnel --url http://localhost:8000
```

Si tu sitio pasa por Nginx local con un dominio `.test` (por ejemplo `mi-sitio.test` en el puerto `80`), indica también el dominio, porque Nginx elige el sitio según la cabecera `Host`:

```bash
cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test
```

En pocos segundos verás una URL temporal parecida a:

```text
https://ejemplo-aleatorio.trycloudflare.com
```

### Limitaciones de `trycloudflare`
- La dirección **cambia cada vez** que cierras y vuelves a abrir el túnel.
- Está pensado para pruebas cortas y demostraciones, **no para producción**.
- No ofrece SLA ni panel de inspección de tráfico local como ngrok.
- Si reinicias el proceso, tendrás que volver a pegar la nueva URL en tus webhooks o enviarla otra vez al cliente.

---

## 4. Cloudflare con dominio propio (túnel con nombre)

Si necesitas una dirección fija (por ejemplo `demo.ejemplo.com`) y tienes un dominio administrado en Cloudflare, puedes crear un túnel con nombre.

> En los ejemplos siguientes sustituye `ejemplo.com` por tu dominio de prueba y `mi-tunel-demo` por el nombre que elijas.

### Paso 1: Iniciar sesión en Cloudflare

```bash
cloudflared tunnel login
```

Se abrirá el navegador para elegir el dominio que quieres autorizar y se guardará un certificado en tu equipo.

### Paso 2: Crear el túnel

```bash
cloudflared tunnel create mi-tunel-demo
```

Cloudflare asignará un identificador (UUID) y guardará el archivo de credenciales local del túnel.

### Paso 3: Asociar un subdominio DNS

```bash
cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com
```

Esto crea un registro CNAME en Cloudflare apuntando `demo.ejemplo.com` hacia tu túnel.

### Paso 4: Ejecutar el túnel

Puedes iniciarlo directamente apuntando a tu puerto local:

```bash
cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo
```

Cuando ya no quieras publicar el sitio, pulsa `Ctrl+C` en la terminal.

### Paso 5: Borrar el túnel cuando ya no lo necesites

```bash
cloudflared tunnel cleanup mi-tunel-demo
cloudflared tunnel delete mi-tunel-demo
```

Recuerda eliminar también el registro DNS de prueba en el panel de Cloudflare si no vas a reutilizar el subdominio.

---

## 5. ngrok

`ngrok` es otra herramienta muy popular para túneles locales. Su gran ventaja para desarrolladores es el **inspector local** que permite ver y reenviar cada petición HTTP (ideal para depurar webhooks).

### Instalación y configuración inicial

1. Descarga e instala `ngrok` (o usa la versión instalada en tu entorno).
2. Crea una cuenta gratuita en ngrok y copia tu token de autenticación.
3. Registra tu token una sola vez (reemplaza `TU_TOKEN` por tu token real):

```bash
ngrok config add-authtoken TU_TOKEN
```

### Abrir un túnel a un puerto local

```bash
ngrok http 8000
```

### Abrir un túnel a un sitio con dominio `.test` (Nginx)

Nginx elige el sitio según la cabecera `Host`, así que ngrok debe enviarla con tu dominio local. Apunta al puerto HTTP (`80`): ngrok ya entrega el enlace público con HTTPS.

```bash
ngrok http 80 --host-header=mi-sitio.test
```

> **Nota:** en las versiones recientes de ngrok, `--host-header` está marcado como obsoleto. Lo recomendado es una *política de tráfico* (un archivo YAML que reescribe la cabecera `Host`) que se pasa con `--traffic-policy-file`. Si tu versión avisa que la opción está obsoleta, consulta la documentación oficial de *Traffic Policy* de ngrok. WolfCore Dev ya usa la política de tráfico por ti.

> **Evita** `ngrok http 443`: así ngrok le habla en HTTP sin cifrar a un puerto que espera HTTPS, y el sitio falla. Si de verdad necesitas el puerto 443, la dirección debe empezar por `https://` (`ngrok http https://localhost:443 ...`) y el certificado local debe ser de confianza.

### Inspector local

Mientras ngrok está corriendo, abre en tu navegador:

```text
http://127.0.0.1:4040
```

Ahí verás en vivo cada petición que llega por el túnel (cabeceras, JSON, código HTTP) y podrás pulsar **Replay** para volver a disparar un webhook sin tener que repetir la acción en el servicio externo.

### Límites del plan gratuito (en términos generales)
- Requiere cuenta y `authtoken`.
- La primera vez que un visitante abre el enlace en un navegador, ngrok muestra una pantalla de aviso intersticial que el usuario debe aceptar.
- Existen límites en la cantidad de túneles simultáneos, tráfico mensual y conexiones activas, que pueden cambiar según las condiciones vigentes de ngrok.

---

## 6. Problemas comunes y cómo resolverlos

### Error `502 Bad Gateway`
- **Causa:** el túnel está activo, pero no hay ningún servicio escuchando en el puerto local indicado, o PHP (php-cgi en Windows, PHP-FPM en Linux y macOS) o tu servidor de desarrollo está apagado.
- **Solución:** comprueba primero en tu propio equipo que `http://localhost:PUERTO` o `https://mi-sitio.test` abre bien antes de iniciar el túnel.

### `"Invalid Host header"` (Vite, Webpack, Angular, Django)
- **Causa:** el servidor de desarrollo bloquea peticiones cuyo encabezado `Host` no coincide con `localhost`.
- **Solución:** permite el host del túnel en la configuración de desarrollo (por ejemplo `server.allowedHosts` en Vite o `ALLOWED_HOSTS` en Django) solo mientras dure la prueba.

### Redirecciones inesperadas a `http://` o a `mi-sitio.test`
- **Causa:** tu aplicación o Nginx genera URLs absolutas usando el dominio local o el esquema `http` porque no confía en las cabeceras del proxy (`X-Forwarded-Proto`, `X-Forwarded-Host`).
- **Solución:** configura la aplicación para confiar en proxies (en Laravel, revisa `TrustProxies`; en FastAPI/uvicorn, usa `--proxy-headers`).

### `APP_URL` en Laravel
- **Causa:** si `APP_URL=http://mi-sitio.test` en `.env`, los enlaces de correos, redirecciones o rutas firmadas apuntarán a `mi-sitio.test` (que no existe en el celular del cliente).
- **Solución:** durante la demo, actualiza temporalmente `APP_URL` a la URL HTTPS del túnel y ejecuta `php artisan config:clear`. Al terminar, vuelve a dejar tu `APP_URL` local.

### Cookies, sesión y error `419 Page Expired` (CSRF)
- **Causa:** `SESSION_DOMAIN` en `.env` está fijado a `mi-sitio.test` (el navegador descarta la cookie al visitar el dominio del túnel) o `SESSION_SECURE_COOKIE` no coincide con HTTPS.
- **Solución:** deja `SESSION_DOMAIN=null` (vacío) durante la prueba por túnel, ejecuta `php artisan config:clear`, borra las cookies del navegador y recarga el formulario.

### Mixed Content (estilos o scripts bloqueados)
- **Causa:** el túnel abre en `https://`, pero la página intenta cargar CSS, JS o imágenes desde `http://`. El navegador bloquea esos recursos por seguridad.
- **Solución:** usa rutas relativas (`/assets/app.css`) o fuerza esquema HTTPS cuando la petición viene por proxy (`URL::forceScheme('https')` en Laravel cuando corresponda).

---

## 7. Por qué FTP NO se comparte por túnel

**Nunca compartas un servidor FTP clásico (puerto 21) mediante un túnel a internet:**
- El protocolo FTP estándar envía **el usuario, la contraseña y los archivos en texto plano (sin cifrar)**, además de usar múltiples puertos dinámicos para transferir datos que suelen fallar a través de túneles HTTP.
- Exponer FTP a internet abre una superficie de ataque innecesaria sobre los archivos de tu equipo.

### Alternativas recomendadas
- **En la misma oficina o casa (red local):** comparte los archivos dentro de tu red privada sin salir a internet.
- **Transferencia cifrada:** usa **SFTP** (sobre SSH) o **FTPS** (FTP con TLS) con cuentas dedicadas y contraseñas fuertes, o simplemente sincroniza el código mediante **Git** (GitHub/GitLab/Bitbucket).

---

## 8. Chuleta de comandos

| Herramienta | Comando | Para qué sirve |
|---|---|---|
| `cloudflared` | `cloudflared tunnel --url http://localhost:8000` | Abre un túnel HTTPS rápido y temporal sin cuenta (`trycloudflare`). |
| `cloudflared` | `cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test` | Abre un túnel rápido enviando la cabecera `Host` de un sitio local en Nginx. |
| `cloudflared` | `cloudflared tunnel login` | Autoriza tu equipo en tu cuenta de Cloudflare para usar un dominio propio. |
| `cloudflared` | `cloudflared tunnel create mi-tunel-demo` | Crea un túnel con nombre persistente. |
| `cloudflared` | `cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com` | Conecta un subdominio de tu dominio en Cloudflare al túnel. |
| `cloudflared` | `cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo` | Inicia el túnel con nombre apuntando a tu puerto local. |
| `cloudflared` | `cloudflared tunnel cleanup mi-tunel-demo` | Cierra las conexiones que hayan quedado abiertas del túnel antes de borrarlo. |
| `cloudflared` | `cloudflared tunnel delete mi-tunel-demo` | Elimina un túnel con nombre que ya no necesitas. |
| `ngrok` | `ngrok config add-authtoken TU_TOKEN` | Guarda tu token de cuenta en la configuración local de ngrok. |
| `ngrok` | `ngrok http 8000` | Expone el puerto local `8000` con una URL pública HTTPS. |
| `ngrok` | `ngrok http 80 --host-header=mi-sitio.test` | Expone un sitio local de Nginx enviando su dominio `.test` en la cabecera `Host`; el enlace público ya sale con HTTPS. |
| `ngrok` | Abrir `http://127.0.0.1:4040` en el navegador | Muestra el inspector local de peticiones y permite reenviar webhooks. |
