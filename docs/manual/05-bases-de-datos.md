# 05 · Bases de datos

## Para qué sirve

La pantalla **Bases de datos** administra sus servidores locales de **MySQL**, **MariaDB**, **PostgreSQL** (con soporte para **pgvector**), **Redis** y **MongoDB**: crear y borrar bases, obtener datos de conexión y bloques `.env`, respaldar, restaurar, importar desde otro servidor, tomar instantáneas con un clic, inspeccionar el esquema de tablas y revisar consultas lentas.

## Paso a paso

### 1. Elegir motor e instancia

1. Abra **Bases de datos** en la barra lateral.
2. En la parte superior, seleccione la pestaña del motor instalado (**MySQL**, **MariaDB**, **PostgreSQL** o **MongoDB**; si no hay ninguno instalado, pulse **Ir a Servicios** para instalarlo).
3. Si tiene varias versiones principales del mismo motor (por ejemplo, `postgresql@16` y `postgresql@17`), elija la instancia en el desplegable **Instancia**.
4. Si la instancia está apagada, pulse **Encender** directamente desde esta pantalla.

Puertos predeterminados (y alternativos sugeridos si otro programa los ocupa):

| Motor | Puerto predeterminado | Puerto alternativo | Acceso inicial |
| --- | --- | --- | --- |
| MySQL | `3306` | `3308` | `root` con clave aleatoria |
| MariaDB | `3307` | `3309` | `root` con clave aleatoria |
| PostgreSQL | `5432` | `5433` | `postgres` con clave aleatoria (SCRAM) |
| Redis | `6379` | `6380` | sin clave, solo `127.0.0.1` |
| MongoDB | `27017` | `27018` | sin autenticación, solo `127.0.0.1` |

### 2. Crear una base y copiar los datos de conexión

1. Pulse **Crear base**.
2. Escriba el nombre de la base (por ejemplo, `mi_tienda_demo`).
3. Opcionalmente cree un usuario propio con permisos limitados solo a esa base (recomendado frente a usar el usuario administrador).
4. En la fila de la base creada, pulse **Datos de conexión** para ver host (`127.0.0.1`), puerto, usuario, clave y el **bloque `.env`** listo para copiar en formato Laravel (`DB_*`), CodeIgniter 4 (`database.default.*`) o CodeIgniter 3.
5. Para administrar tablas y registros desde el navegador, pulse **Abrir en Adminer** (en `http://127.0.0.1:8090`, requiere PHP encendido) o use **phpMyAdmin** (instalable en **Servicios**). Desde la tarjeta de un proyecto, ambos abren ya autenticados mediante un token de un solo uso sin exponer la contraseña en la URL.

[CAPTURA: Pantalla Bases de datos mostrando la pestaña PostgreSQL con selector de instancia, lista de bases y botones de Respaldar, Restaurar, Instantáneas y Ver esquema]

### 3. Respaldar, restaurar e importar desde otro servidor

- **Respaldar:** pulse **Respaldar** en la fila de la base. Ejecuta `mysqldump --single-transaction --routines --triggers` (MySQL/MariaDB) o `pg_dump -Fc` (PostgreSQL) y guarda el archivo por defecto en `Documentos\WolfCore Dev\Respaldos`.
- **Restaurar respaldo:** pulse **Restaurar respaldo** y elija un archivo `.sql`, `.dump` (incluidos volcados `pg_dump` custom aunque tengan extensión `.sql`), `.gz`, `.zip`, `.rar` o `.7z`.
  - Si la base destino ya contiene tablas, WolfCore Dev pide confirmación, guarda primero una copia de seguridad (`<base>-antes-de-sobrescribir-<fecha>`) y reemplaza por completo sin mezclar datos.
  - Restaure únicamente respaldos de confianza: un volcado SQL puede ejecutar sentencias dentro del servidor.
- **Importar desde otro servidor:** útil para migrar desde FlyEnv, XAMPP o Laragon encendido. Pulse **Importar desde otro servidor**, ingrese `127.0.0.1`, el puerto de origen, usuario, clave y base de origen. WolfCore Dev solo lee del servidor origen y crea una base local nueva sin modificar el origen.

### 4. Tomar y restaurar instantáneas

1. En la fila de una base SQL, abra **Instantáneas** para guardar un punto de control rápido antes de correr migraciones o pruebas destructivas.
2. Pulse **Tomar instantánea**, agregue una nota breve (por ejemplo, `antes-de-migracion-pagos`) y confirme.
3. Para volver atrás, abra **Instantáneas**, elija la copia deseada y pulse **Volver a esta instantánea**. WolfCore Dev muestra tamaño, fecha y tablas, pide confirmación y toma un respaldo automático del estado actual antes de restaurar.
4. Incluso si borró una base por error, las bases con instantáneas guardadas siguen apareciendo para poder recrearlas. Las instantáneas borradas van a la papelera de WolfCore Dev durante 7 días.

### 5. Instalar y activar `pgvector` en PostgreSQL

1. En la pestaña **PostgreSQL**, abra la sección de **pgvector** y pulse **Instalar pgvector**.
2. Si faltan herramientas de compilación C++, WolfCore Dev ofrece instalar `Microsoft.VisualStudio.2022.BuildTools` (carga VCTools) mediante `winget` (Windows pedirá permiso de administrador y descargará varios GB).
3. Luego descarga el código oficial de pgvector (SHA-256 verificado), lo compila con `nmake` y lo instala reiniciando brevemente PostgreSQL.
4. En cada base que necesite búsqueda por vectores, pulse **Activar vector** (`CREATE EXTENSION IF NOT EXISTS vector`).

### 6. Inspeccionar esquema y consultas lentas

- **Ver esquema:** en la fila de una base, pulse **Ver esquema** para explorar tablas, vistas, columnas, tipos, claves primarias (`PK`), índices y relaciones de entrada y salida en modo **solo lectura** (no lee ninguna fila de datos).
- **Consultas lentas:** pulse **Consultas lentas** en la barra del motor SQL. En el diálogo **Consultas lentas de <motor>** verá el estado del registro, el campo **Anotar consultas de más de (segundos)** y los botones **Activar el registro**, **Cambiar el tiempo** y **Desactivar el registro** (afecta a todo el servidor, por lo que pide confirmación). Las columnas son **Duración**, **Filas examinadas**, **Base**, **Fecha** y **Consulta**. Por privacidad, los valores literales aparecen reemplazados por `?` y se bloquea mostrarlos (**Ver literal**) cuando el servidor tiene bases marcadas con datos reales o la consulta no puede atribuirse con seguridad.

[CAPTURA: Diálogo Ver esquema mostrando la lista de tablas a la izquierda y columnas, índices y relaciones a la derecha]

## Ejemplo

Antes de ejecutar una migración delicada en `mi_tienda_demo` (MySQL 8.4):

1. Abra **Bases de datos → MySQL**, elija la instancia `mysql@8.4`.
2. En la fila de `mi_tienda_demo`, abra **Instantáneas** y guarde una con la nota `pre-migracion-clientes`.
3. Corra sus migraciones desde la terminal del proyecto.
4. Si algo sale mal, vuelva a **Instantáneas** y restaure `pre-migracion-clientes`.
5. Al terminar, pulse **Ver esquema** para verificar las columnas e índices creados.

## Si algo falla

- **«Encienda <motor> para administrar sus bases»:** la instancia seleccionada está apagada. Pulse **Encender** en la pantalla o desde **Servicios**.
- **«Falta mongosh» al usar MongoDB:** vaya a **Servicios**, instale `mongosh` y recargue la pestaña de MongoDB.
- **No se puede borrar una base:** por seguridad, borrar exige escribir el **nombre exacto** de la base en el campo de confirmación.
- **Error de versión al importar desde otro servidor:** si el servidor externo es más nuevo que su instancia local, instale una versión igual o superior desde **Servicios → Versiones** e intente de nuevo.
- **Quiere revisar contraseñas débiles en una tabla de usuarios:** use **Herramientas → Seguridad → Contraseñas** (ver [10 · Herramientas](10-herramientas.md)).
