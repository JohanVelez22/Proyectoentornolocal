# 14 · Doctor, Depuración y problemas

## Para qué sirve

WolfCore Dev incluye tres pantallas en el grupo **Utilidades** para diagnosticar y resolver fallos sin adivinar: **Doctor** revisa el entorno y propone reparaciones guiadas, **Depuración** captura volcados `dump()`/`dd()` y agrupa errores de los registros, y **Registros** sigue en vivo los archivos de log de servicios, sitios, procesos y túneles.

## Paso a paso

### 1. Diagnosticar y reparar con `Doctor`

1. Abra **Doctor** en la barra lateral (también corre una revisión en segundo plano al iniciar la app).
2. Pulse **Revisar ahora**. Doctor comprueba:
   - **Puertos** ocupados (identifica IIS, FlyEnv, Skype, XAMPP) y **Rangos reservados** por Hyper-V/WSL/Docker.
   - **Autoridad de certificados (CA)** y **Certificados** vencidos o por vencer.
   - **Confianza de la CA** en Node, Python y Firefox.
   - **Archivo hosts** (bloques duplicados o sin cierre, codificación UTF-16, solo lectura, dominios faltantes).
   - **PATH del usuario**, **Visual C++** (`vcredist`), **Enlazador de C++** (para Rust/pgvector), **Antivirus**, **Cortafuegos** (reglas de entrada que dejan programas abiertos a la red; ver el paso 2) y **Servicios** en error.
3. Los hallazgos se agrupan en **Errores**, **Avisos** e **Información**, cada uno con **Lo que se vio** (evidencia).
4. En cada hallazgo reparable, pulse **Reparar** (o **Mover el puerto de WolfCore Dev** si prefiere no tocar un programa externo): se abre **Confirmar la reparación** mostrando exactamente qué se hará y si Windows pedirá administrador. Nada cambia hasta que pulse **Aplicar**.
5. En hallazgos que WolfCore Dev nunca cambia solo (exclusiones de antivirus, rangos reservados o Build Tools), pulse **Copiar comando** para ejecutarlo usted mismo en una consola de administrador si lo decide.

[CAPTURA: Pantalla Doctor mostrando hallazgos agrupados por Errores y Avisos con botones Reparar, Ver y la sección Confianza de la CA abajo]

### 2. Revisar el cortafuegos y quitar reglas peligrosas

En la revisión **Cortafuegos**, Doctor lee las reglas de entrada de Windows y le avisa cuando alguna deja programas de WolfCore Dev (nginx, PHP o bases de datos) abiertos a la red:

1. Pulse **Reparar** en el hallazgo de cortafuegos. Se abre **Confirmar la reparación** con la lista **Reglas afectadas: desmarque las que no quiera tocar** y el botón **Aplicar**.
2. La reparación **Quitar esas reglas de entrada del cortafuegos** elimina las reglas peligrosas una por una y por su nombre exacto. Antes se guarda una copia protegida en `etc/cortafuegos-quitadas.json` para poder recrearlas, y Windows pide permiso de administrador. Nada cambia hasta que confirme.
3. Las reglas de **otros programas** (FlyEnv, Laragon, XAMPP u otros) y las **acotadas a la red local** solo se muestran: **nunca se quitan desde aquí**.
4. Si antes quitó reglas, el hallazgo **Reglas quitadas que se pueden restaurar** permite volver a crearlas con los mismos programa, perfil, protocolo, puertos y direcciones a partir de la copia protegida.

### 3. Configurar Confianza de la CA en Node, Python y Firefox

En la parte inferior de **Doctor**, la sección **Confianza de la CA** muestra cómo confía cada herramienta en sus certificados `.test`:

- **Node:** los procesos de proyecto y la terminal de WolfCore Dev ya reciben `NODE_EXTRA_CA_CERTS`. Opcionalmente active el interruptor **También como variable del usuario** para otras terminales (no reemplaza una `NODE_EXTRA_CA_CERTS` suya ya existente).
- **Python:** los proyectos con `.venv` reciben automáticamente `REQUESTS_CA_BUNDLE` y `SSL_CERT_FILE` combinando las raíces de `certifi` (o Windows) con la CA local.
- **Firefox:** cierre Firefox y pulse **Activar en Firefox** para escribir `security.enterprise_roots.enabled` en `user.js` de cada perfil (con copia previa en `etc/respaldos`; `prefs.js` no se toca y los perfiles abiertos se saltan). Puede revertirlo con **Quitar de Firefox**.

### 4. Capturar `dump()`, `dd()`, `wd()` y ver errores agrupados (`Depuración`)

1. Abra **Depuración** en la barra lateral.
2. En la pestaña **Volcados**, active la **Captura de dumps** (escucha en `127.0.0.1:9912` con un token de sesión aleatorio).
3. En la lista **Sitios**, active el interruptor del sitio PHP o FastAPI que desea capturar y confirme:
   - **PHP:** inyecta `auto_prepend_file` solo en el PHP propio de ese sitio. En Laravel/Symfony use `dump($x)` y `dd($x)` como siempre; en CodeIgniter 3 u otros, use `wd($x)` para enviar el volcado sin mostrar nada en la página.
   - **Python (FastAPI):** agrega el módulo `wolfdump` al `PYTHONPATH` desde el próximo reinicio del proceso (`from wolfdump import dump` y `dump(valor)`).
4. Filtre los volcados por sitio, origen o texto (se guardan solo los últimos 500 en memoria y se pierden al cerrar; **Copiar** enmascara claves conocidas).
5. Abra la pestaña **Errores** para ver agrupados los errores de PHP, Nginx, `laravel.log`, CodeIgniter 3 y Python con su contador, primera/última vez, traza y botón **Abrir en el editor** (abre el archivo directamente en la línea del error).

[CAPTURA: Pantalla Depuración mostrando un volcado PHP con archivo, línea y URL, y la pestaña Errores al lado]

### 5. Seguir logs en tiempo real (`Registros`)

1. Abra **Registros** en la barra lateral (o **Ver registros** desde el menú de una tarjeta de proyecto).
2. Elija la fuente en el desplegable superior (Nginx, PHP, bases de datos, `laravel.log`, procesos de proyecto o túneles).
3. Use el filtro de texto y nivel, pause la lectura si necesita copiar líneas o pulse **Abrir carpeta** para ver el archivo original en el Explorador.

## Ejemplo

Su sitio `https://mi-tienda.test` devuelve error `500` y una petición con `fetch` desde Node rechaza el certificado local:

1. Abra **Depuración → Errores**, haga clic en el error más reciente de `laravel.log`, revise la traza y pulse **Abrir en el editor** para corregir el fallo en la línea exacta.
2. Abra **Doctor**, baje a **Confianza de la CA → Node** y verifique que `NODE_EXTRA_CA_CERTS` esté activa para sus terminales.

## Si algo falla

- **Un sitio PHP da error de función redeclarada al activar Depuración:** el proyecto define su propia función `dump()` o `dd()` sin comprobar `function_exists`; desactive la captura en ese sitio.
- **Firefox sigue mostrando advertencia de certificado después de activar la confianza:** asegúrese de que Firefox estaba completamente cerrado al pulsar **Activar en Firefox** (los perfiles marcados como **Abierto** se saltan). Ciérrelo y vuelva a pulsar **Activar en Firefox**.
- **Depuración y Xdebug `trace`:** no use la captura de dumps a la vez que `xdebug.mode=trace` si le preocupa que los argumentos internos queden en el archivo de traza de Xdebug.
- **La pantalla Registros aparece vacía:** los archivos de log aparecen en cuanto un servicio, sitio o proceso escribe su primera línea; encienda el servicio correspondiente y vuelva a seleccionar la fuente.
