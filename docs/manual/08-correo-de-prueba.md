# 08 · Correo de prueba

## Para qué sirve

La pantalla **Correo** le permite probar los correos que envían sus proyectos sin mandar mensajes reales a clientes por accidente, mediante **Captadores locales** que atrapan todo en `127.0.0.1`, y también configurar **Proveedores SMTP remotos** cifrados para validar envíos reales antes de pasar a producción.

## Paso a paso

### 1. Instalar y elegir un captador local

1. Abra **Correo** en la barra lateral.
2. En **Captadores locales** verá los captadores disponibles (todos escuchan solo en `127.0.0.1` y solo uno permanece encendido a la vez):
   - **Mailpit** (recomendado): incluye conteo de correos **Sin leer** actualizado cada 15 segundos en **Correo** y en **Inicio**, y protege su buzón web con una ruta secreta propia de su equipo.
   - **smtp4dev:** excelente alternativa con protección frente a cabeceras `Host` ajenas.
   - **Papercut SMTP** e **Inbucket:** opciones adicionales (Inbucket no tiene protección frente a *DNS rebinding*; apáguelo cuando no lo use).
   - *Nota:* MailHog y MailDev no se incluyen porque MailHog no publica huella verificable y MailDev solo se distribuye por npm.
3. Si el captador aún no está instalado, pulse **Instalar** (lo lleva a **Servicios → Versiones**).
4. Pulse **Usar este** en el captador que desea activar.
5. Pulse **Abrir buzón** para ver los correos atrapados en el navegador.

[CAPTURA: Pantalla Correo mostrando Mailpit activo con contador de Sin leer, botón Abrir buzón y el bloque .env para Laravel]

### 2. Conectar un proyecto al captador local

1. En la sección **Bloque para el `.env` de Laravel** dentro de **Correo**, pulse **Copiar bloque**.
2. Péguelo en el `.env` de su proyecto (o agréguelo desde **Proyectos → `…` → Variables .env… → Agregar un bloque de variables → Correo**):
   - `MAIL_MAILER=smtp`
   - `MAIL_HOST=127.0.0.1`
   - `MAIL_PORT=1025` (o el puerto SMTP del captador elegido)
3. Ningún correo enviado al captador sale a internet.

### 3. Configurar un proveedor SMTP remoto (envío real)

1. En **Correo**, baje a **Proveedores SMTP remotos** y pulse **Agregar proveedor**.
2. Elija un preset (**Mailtrap**, **Resend**, **Brevo**, **Mailgun**, **SendGrid**, **Postmark**, **Amazon SES**, **SMTP2GO** o **Gmail**) o **Otro (escribir los datos)**.
3. Complete **Nombre**, **Servidor (host)** (sin `smtp://` ni puerto), **Puerto**, **Cifrado** (**TLS directo (puerto 465)** o **STARTTLS (puerto 587)** — nunca texto plano), **Usuario**, **Clave SMTP** y opcionalmente el **Remitente de la prueba**.
4. Pulse **Guardar**. La clave se guarda cifrada con `safeStorage` en este equipo y nunca vuelve a mostrarse.
5. Para validar la configuración, escriba una **Dirección de destino de la prueba** (por ejemplo, `pruebas@ejemplo.com`) y pulse **Probar envío** (máximo un envío cada 15 segundos).

### 4. Usar un proveedor SMTP en un proyecto (o volver al captador)

1. En la tarjeta del proveedor SMTP, pulse **Usar en un proyecto** y elija el proyecto.
2. Revise la vista previa de cambios en el `.env`.
3. Por defecto el bloque se escribe **sin** `MAIL_PASSWORD`. Si marca **Escribir también la clave en el .env**, WolfCore Dev le advierte que quedará en texto plano y le ofrece agregar `.env` al `.gitignore`.
4. Pulse **Escribir en el .env**.
5. Si más adelante desea que ese proyecto vuelva a usar el captador local, use **Volver al captador local** y reescriba el bloque `MAIL_*` de su `.env` (WolfCore Dev no modifica el `.env` al borrar un proveedor para no romper su archivo sin aviso).

## Ejemplo

Quiere verificar el correo de recuperación de contraseña de `mi-tienda.test` sin enviar nada fuera de su PC:

1. En **Correo**, active **Mailpit** con **Usar este**.
2. En **Proyectos → `mi-tienda` → `…` → Variables .env…**, agregue el bloque **Correo** y guarde.
3. Dispare el envío desde `https://mi-tienda.test`, vuelva a **Correo** y pulse **Abrir buzón** para leer el mensaje y probar el enlace.

## Si algo falla

- **«Mailpit no responde»:** el captador está apagado; pulse **Usar este** en **Correo** o enciéndalo desde **Servicios**.
- **Al probar un proveedor SMTP aparece «El servidor rechazó el mensaje o una dirección»:** muchos proveedores (como Resend, Amazon SES o Postmark) exigen que el **Remitente de la prueba** pertenezca a una dirección o dominio verificado en su cuenta.
- **«La conexión cifrada no es válida»:** revise si el servidor espera TLS directo (`465`) o STARTTLS (`587`) y que el nombre de host coincida con su certificado.
- **Aviso de servidor en este equipo o red local al guardar SMTP:** si su servidor SMTP apunta a una IP local, deberá confirmar explícitamente (**Sí, es mío**) antes de que WolfCore Dev se conecte.
