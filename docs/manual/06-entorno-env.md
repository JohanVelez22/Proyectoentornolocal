# 06 · Entorno y archivos `.env`

## Para qué sirve

El gestor de **Variables `.env`** permite ver, editar, agregar y comparar las variables de entorno de cada proyecto desde una tabla clara, manteniendo los secretos enmascarados por defecto, guardando copias con fecha antes de escribir y evitando que las claves acaben en Git por accidente.

## Paso a paso

### 1. Abrir el gestor de `.env` de un proyecto

1. Vaya a **Proyectos**.
2. En la tarjeta del proyecto, abra el menú de acciones (`…`) y pulse **Variables .env…**.
3. Si el proyecto todavía no tiene un archivo `.env`, el gestor le avisa que se creará automáticamente al guardar.

> Si intenta abrir un archivo `.env` desde el **Editor de código** de **Herramientas**, WolfCore Dev le recuerda que los `.env` se gestionan desde este panel protegido y ofrece un botón directo para abrir el `.env` de la raíz del proyecto.

[CAPTURA: Gestor de Variables .env mostrando variables normales, valores secretos enmascarados con el botón Mostrar y la sección de bloques]

### 2. Ver y editar variables manteniendo los secretos protegidos

1. Todas las variables aparecen en una tabla conservando su orden, comentarios y formato de comillas.
2. Las variables sensibles (como claves, tokens y contraseñas: `*_KEY`, `*_SECRET`, `*_PASSWORD`, `*_TOKEN` o valores que coinciden con patrones de secretos) llevan la etiqueta **secreta** y su valor aparece oculto.
3. Para consultar un valor secreto, pulse **Mostrar** en esa fila: el valor completo aparece temporalmente y **se vuelve a ocultar automáticamente a los 30 segundos** (o antes si pulsa **Ocultar**). Los valores revelados nunca pasan por registros ni eventos.
4. Pulse **Cambiar** para editar un valor, **Deshacer** para revertir esa línea o **Quitar** para eliminar la variable al guardar.
5. Para añadir una nueva variable, use el formulario **Agregar una variable** (`NOMBRE` y `valor`) y pulse **Agregar**.

Casos especiales que marca la tabla:

- **repetida:** la variable aparece más de una vez en el `.env`; el gestor muestra y edita la última ocurrencia.
- **varias líneas:** la variable ocupa varias líneas y queda en solo lectura para editarla a mano en el archivo sin romper su formato.

### 3. Comparar con `.env.example` y agregar bloques rápidos

1. En la sección **Comparar con el archivo de ejemplo**, WolfCore Dev analiza `.env.example` y le indica cuántas variables **faltan**, cuántas **sobran** y cuántas tienen un **valor distinto**.
2. Pulse **Agregar las que faltan** para incorporarlas al borrador con los valores del ejemplo y revisarlas antes de guardar.
3. En **Agregar un bloque de variables**, elija un tema (**Base de datos**, **Correo**, **IA**, **Redis** o **Meilisearch (con su clave)**): solo agrega las claves que falten, sin sobrescribir las existentes y sin inventar contraseñas.

### 4. Cambiar a un usuario propio de base de datos

Si un proyecto Laravel o PHP usa el usuario administrador de MySQL o MariaDB:

1. Dentro del gestor de `.env`, abra **Usar usuario propio**.
2. Pulse **Crear y usar** y confirme el diálogo.
3. WolfCore Dev crea un usuario dedicado con contraseña aleatoria y permisos únicamente sobre la base de ese proyecto, guarda una copia previa del `.env` y actualiza las variables de conexión.
4. Si otro proyecto comparte la misma base, el asistente le pregunta si desea **Compartir el usuario** sin cambiar la contraseña para no desconectar el otro proyecto.

### 5. Revisar el diff, proteger `.gitignore` y guardar

1. Cuando termine de editar, pulse **Revisar y guardar…**.
2. Revise la vista previa de los cambios (los secretos siguen apareciendo enmascarados).
3. Si `.env` no figura en `.gitignore`, marque **Agregar .env al .gitignore del proyecto**.
4. Si Git ya rastrea el archivo `.env`, WolfCore Dev muestra una alerta fuerte recomendando quitarlo del índice con `git rm --cached .env`; solo podrá guardar si marca explícitamente **Entiendo el riesgo y quiero guardar de todos modos**.
5. Pulse **Guardar cambios**. Se guarda una copia con fecha del `.env` anterior (fuera de la carpeta del proyecto) y el archivo se escribe de forma atómica.

### 6. Volver a una copia anterior del `.env`

1. En la sección **Volver a una copia**, revise la lista de copias con fecha guardadas.
2. Pulse **Volver a esta copia** y confirme. Antes de reemplazar, WolfCore Dev guarda también una copia del `.env` actual para que siempre pueda deshacer.

## Ejemplo

Clonó un proyecto `mi-tienda` que trae `.env.example` y necesita prepararlo para trabajar con Mailpit y un usuario de base propio:

1. Abra **Proyectos → `mi-tienda` → `…` → Variables .env…**.
2. En **Comparar con el archivo de ejemplo**, pulse **Agregar las que faltan**.
3. En **Agregar un bloque de variables**, pulse **Correo** para añadir las variables de Mailpit (`127.0.0.1:1025`).
4. Use **Usar usuario propio** para asignar un usuario exclusivo de MySQL a `mi_tienda_demo`.
5. Pulse **Revisar y guardar…**, marque **Agregar .env al .gitignore del proyecto** y confirme con **Guardar cambios**.

## Si algo falla

- **Un cambio en el `.env` no surte efecto en Laravel:** ejecute `php artisan config:clear` desde **Terminal** en la tarjeta del proyecto (si tenía la configuración cacheada).
- **Una contraseña con `#`, `$` o espacios rompe la lectura del `.env`:** el gestor de WolfCore Dev rodea automáticamente esos valores con comillas adecuadas según el lector del proyecto (phpdotenv, CodeIgniter 4 o CodeIgniter 3). Edítela desde **Variables .env…** en lugar de pegarla sin comillas.
- **Borró una clave importante al editar:** abra **Volver a una copia** dentro del gestor de `.env` y restaure la copia inmediatamente anterior.
- **Un túnel se cerró bruscamente y `APP_URL` quedó con la URL temporal:** al abrir o cerrar túneles, WolfCore Dev guarda una copia en `run/urlbase-<id>.respaldo` y restaura el `.env` al cerrar o al reiniciar la app; revise también **Volver a una copia** si editó el archivo mientras el túnel estaba abierto.
