# 03 · Versiones e instancias

## Para qué sirve

La pestaña **Servicios → Versiones** permite instalar, actualizar, desinstalar y administrar múltiples versiones de servicios y lenguajes (PHP, Nginx, MySQL, MariaDB, PostgreSQL, Redis, MongoDB, Node.js, Python, Composer, captadores de correo, Ollama, cloudflared, Java, .NET, Go, Rust, Bun, Deno, Zig, Kotlin, Dart, Ruby, Maven y Gradle), manteniendo instancias paralelas aisladas y verificando cada descarga.

## Paso a paso

### 1. Consultar el catálogo de versiones

1. Abra **Servicios** en la barra lateral y seleccione la pestaña **Versiones**.
2. En el desplegable **Servicio**, elija el programa o lenguaje que quiere gestionar (por ejemplo, `PHP`, `PostgreSQL` o `Node.js`).
3. Filtre por versión principal con el selector **Versión** si la lista es larga, o marque **Mostrar todas** para incluir versiones *Preview* y versiones **Sin soporte** (fin de vida).
4. En la cabecera verá el origen de la lista:
   - **En línea:** recién leída de las fuentes oficiales.
   - **Caché de hace X h:** guardada localmente hasta 6 horas.
   - **Lista sin conexión:** catálogo fijo integrado en la app (se usa sin internet o si una fuente oficial devuelve datos anómalos).
5. Pulse **Actualizar lista** si desea volver a consultar la fuente oficial.

[CAPTURA: Pestaña Servicios → Versiones mostrando PostgreSQL con etiquetas LTS, Instalada, Encendida, Actualización y el botón Actualizar lista]

### 2. Instalar una versión y entender las marcas de verificación

1. Busque la versión que necesita y pulse **Instalar**.
2. Fíjese en la marca de seguridad de la fila:
   - **Con firma PGP** o huella **SHA-256 / SHA-512:** WolfCore Dev verifica automáticamente la firma OpenPGP o la huella oficial antes de extraer el archivo. Si la verificación falla, no se instala nada.
   - **Solo huella MD5** o **Sin huella publicada:** algunos fabricantes (como EnterpriseDB para los ZIP de Windows de PostgreSQL, o MySQL en descargas directas) no publican una huella fuerte. Al pulsar **Instalar**, WolfCore Dev muestra un diálogo que explica el riesgo y sugiere si existe una versión verificada; deberá marcar **Entiendo el riesgo y quiero instalarla sin verificar** y confirmar con **Instalar sin verificar**.

### 3. Trabajar con instancias paralelas y versión predeterminada

El comportamiento al tener varias versiones instaladas depende del tipo de servicio:

- **Instancias paralelas (MySQL, MariaDB, PostgreSQL, Redis, MongoDB):** cada versión principal (por ejemplo, `postgresql@16` y `postgresql@17`) tiene su propia carpeta `data/<servicio>/<versión>`, sus propias credenciales y su propio puerto. Puede encender varias al mismo tiempo.
- **Pool propio por versión (PHP):** cada versión principal encendida corre su propio grupo de procesos `php-cgi`, así un proyecto puede usar PHP 8.3 y otro PHP 8.4 a la vez.
- **Versión única activa (Nginx, captadores de correo, etc.):** puede instalar varias versiones, pero solo una permanece encendida a la vez.
- **Lenguajes y herramientas por proyecto (Node.js, Python, Java, .NET, Go, Rust, Bun, Deno, Zig, Kotlin, Dart, Ruby, Maven, Gradle):** no se encienden como servicio; cada proyecto usa la versión que solicita o la marcada como predeterminada. Maven y Gradle se lanzan con un JDK de WolfCore Dev (instale Java desde la lista de servicios).
  - **Maven y Gradle** se ejecutan con un JDK de WolfCore Dev: si todavía no hay ninguno, la pestaña le avisa (*Instale Java (Temurin) desde la lista de servicios*). Por seguridad, WolfCore Dev lanza Maven directamente y **no lee `.mvn/jvm.config` ni la variable `MAVEN_OPTS`**; si su proyecto las necesita, ejecute Maven desde una terminal.
  - **Ruby** se instala sin Devkit (MSYS2), sin instalador y sin tocar el PATH ni el registro de Windows. Las gemas con extensiones nativas que no traen binario precompilado necesitan el Devkit, que es un paso manual: abra una terminal desde el proyecto y ejecute `ridk install` (instala MSYS2 y descarga de internet).
  - Estos lenguajes solo entran al entorno de un proyecto cuando lo pide un archivo suyo (por ejemplo `pom.xml`, `build.gradle`, `.csproj`, `go.mod` o `.ruby-version`) o usted lo fija en la tarjeta del proyecto; no se suman al PATH de todos los proyectos.

Para definir qué versión usarán los proyectos nuevos y las recetas:

1. Pulse el icono de estrella (**Usar para proyectos nuevos**) en la versión deseada.
2. Si necesita cambiar el puerto de una instancia, pulse **Cambiar** junto al puerto. Si algún proyecto todavía tenía el puerto viejo en su `.env`, WolfCore Dev le avisa con la lista de proyectos para que lo actualice.

### 4. Actualizar una versión con respaldo automático

Cuando hay una versión menor más reciente (por ejemplo, MariaDB `11.4.13` → `11.4.14`), la fila muestra la marca **Actualización** y el botón **Actualizar**:

1. Pulse **Actualizar** (también puede llegar desde un aviso de la campana; nunca se actualiza solo).
2. Revise el diálogo de actualización: muestra el espacio libre, el espacio necesario y la carpeta de respaldo.
3. Pulse **Actualizar con respaldo**. WolfCore Dev sigue este orden:
   - Instala la versión nueva junto a la actual (sin borrar la anterior).
   - Vuelca cada base de datos con la versión actual.
   - Detiene el servicio y hace una **copia en frío** de toda la carpeta de datos.
   - Arranca la versión nueva y comprueba que responda.
   - Si no arranca, vuelve automáticamente a la versión anterior con sus datos y conserva la copia.
4. Si en lugar de un parche elige una **versión principal nueva** (por ejemplo, PostgreSQL 17 → 18), WolfCore Dev crea una **instancia nueva** con su propio puerto sin tocar la anterior, y le permite elegir entre **Empezar vacía** o **Copiar datos desde** la instancia existente.

[CAPTURA: Diálogo de actualización mostrando los pasos de respaldo en frío, espacio libre y botón Actualizar con respaldo]

### 5. Desinstalar versiones y limpiar versiones sin uso

- **Desinstalar una versión:** pulse **Desinstalar** en la fila correspondiente. Por defecto **solo borra los ejecutables (`bin/`) y conserva los datos en disco**. Si además quiere eliminar la carpeta de datos de una instancia, marque **Borrar también los datos**, escriba el identificador exacto de la instancia y confirme (no se puede deshacer).
- **Limpiar versiones sin uso:** al pie de **Servicios → Versiones**, pulse **Limpiar versiones sin uso…**:
  1. Revise las versiones que ningún sitio, instancia, plantilla ni workspace utiliza (las versiones encendidas o predeterminadas aparecen bloqueadas).
  2. Elija si desea **Mover a la papelera** (recuperables durante 7 días) o **Borrar de forma definitiva** (guarda antes una instantánea de configuración y exige confirmar).
  3. Si movió una versión a la papelera, puede recuperarla desde la sección **En la papelera** con **Recuperar**.
- **Respaldos de las actualizaciones:** las copias en frío y los volcados de actualizaciones anteriores se muestran aparte en **Respaldos de las actualizaciones**, donde puede borrarlos manualmente cuando ya no los necesite (nunca aparece allí la carpeta activa de una instancia).

## Ejemplo

Necesita probar un sistema legado en PHP 8.3 mientras desarrolla un proyecto nuevo en PHP 8.4 y mantiene PostgreSQL 16 y 17 en paralelo:

1. En **Servicios → Versiones**, elija **PHP**, instale **8.3** y **8.4**, y marque la estrella en **8.4** como predeterminada.
2. Cambie el selector a **PostgreSQL**, instale **16** y **17**; cada una quedará en su propia instancia (`postgresql@16` y `postgresql@17`) con puertos distintos (por ejemplo, `5432` y `5433`).
3. Cuando termine con una versión antigua de Node.js que ya no usa ningún proyecto, pulse **Limpiar versiones sin uso…**, márquela y muévala a la papelera.

## Si algo falla

- **Una instancia aparece como «Bloqueada» tras una actualización fallida:** ocurre si falló la actualización y tampoco se pudieron restaurar los datos automáticamente. WolfCore Dev no arranca encima de datos dudosos ni borra nada. Pulse **Resolver**, revise la carpeta apartada y los respaldos disponibles, elija **Devolver el respaldo** (recomendado) y confirme escribiendo el identificador de la instancia.
- **«No hay espacio suficiente para la copia» al actualizar:** libere espacio en disco o elimine copias antiguas en **Respaldos de las actualizaciones** y vuelva a intentarlo.
- **Error de firma PGP o huella al instalar:** significa que el archivo descargado no coincide con la firma o huella oficial. Reintente más tarde (puede haber sido una descarga cortada) y nunca instale binarios manipulados.
- **No aparece la versión recién publicada de un servicio:** pulse **Actualizar lista**. Si la fuente oficial está caída o devolvió datos inválidos, WolfCore Dev mantiene la caché o la **Lista sin conexión**.
