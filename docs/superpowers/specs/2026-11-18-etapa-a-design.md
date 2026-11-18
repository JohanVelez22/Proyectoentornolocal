# WolfCore Dev — Etapa A: HTTPS, bases de datos, Composer y correo

Fecha: 2026-11-18 · Estado: aprobado por el usuario (2026-11-18) · Base: rama `feat/mvp-windows` (MVP terminado)

## 1. Para qué

El MVP ya administra Nginx, PHP, sitios `.test` sin límite y túneles. Para dejar FlyEnv del todo, el usuario necesita además:

- correr sus proyectos por **HTTPS**;
- tener sus **bases de datos** propias: MySQL para System y Rents, PostgreSQL con datos reales para Diamantes y Dollar, PostgreSQL con pgvector para el bot de IA, y Redis;
- tener **Composer** a mano;
- probar **correos** sin enviarlos de verdad.

Con esta etapa el programa cubre lo que FlyEnv y ServBay hacen en el día a día de un desarrollador Laravel/CodeIgniter en Windows.

**Éxito:** los 5 proyectos WolfCore corren en WolfCore Dev con HTTPS y con sus bases de datos restauradas desde los respaldos reales. El bot usa pgvector en ese mismo PostgreSQL. Los correos de Laravel se ven en Mailpit. FlyEnv ya no hace falta para nada.

### Metas
1. Cambiar el nombre visible a **WolfCore Dev**.
2. HTTPS local con autoridad certificadora propia, certificado por sitio e interruptor por sitio.
3. Servicios de base de datos: **MySQL 8.4 LTS, MariaDB 11.4 LTS, PostgreSQL 17 con pgvector, Redis 8, MongoDB 8**. Cada uno con instalar, encender, apagar, estado real y puerto configurable.
4. Módulo **Bases de datos**:
   - crear y borrar bases (y usuario opcional);
   - restaurar respaldos `.sql`, `pg_dump` en formato custom, `.gz`, `.zip` y `.rar`;
   - crear respaldos;
   - **importar desde otro servidor** (por ejemplo el MySQL o el PostgreSQL de FlyEnv, sin modificarlo);
   - datos de conexión y bloque `.env` listo para copiar;
   - **Adminer** integrado.
5. **Composer**: instalado y verificado. Se ejecuta con el PHP de cada sitio. Incluye un botón "Terminal aquí" con PHP y Composer del sitio en el PATH y un botón opcional "Agregar al PATH del usuario".
6. **Mailpit**: SMTP local, buzón web y bloque `.env` de correo para Laravel.
7. **IA local con Ollama**: servicio, descarga y borrado de modelos con progreso, y datos de conexión (sección 4.5b).
8. **Servidor FTP**: integrado, con usuario por sitio encerrado en su carpeta (sección 4.5c).

### Fuera de alcance (etapas B y C)
MCP, Node/Python por proyecto, Git, túneles con nombre, contenedores, FTPS/SFTP, DNS propio, Apache/Caddy, copias programadas y Let's Encrypt.

### Lo que sería un fracaso aunque funcione
- Que una restauración o importación **toque el servidor de origen** o mezcle datos en una base existente sin preguntar.
- Que una clave de base de datos quede escrita en un archivo del proyecto sin que el usuario lo pida.
- Que el HTTPS rompa los túneles o los sitios que no lo activaron.
- Que haya un choque silencioso de puertos con FlyEnv mientras los dos conviven.

## 2. Nombre: WolfCore Dev

- Nombre visible en la ventana, la bandeja, el instalador, el `productName`, los textos y el README: **WolfCore Dev**.
- `appId`: `com.johanvelez.wolfcoredev`.
- Carpeta de datos: `%LOCALAPPDATA%\WolfCoreDev`.
- Marcadores del bloque de hosts: `# >>> WolfCore Dev (no editar a mano)` / `# <<< WolfCore Dev`.
- El repositorio y el paquete npm siguen llamándose `Proyectoentornolocal`.
- **Migración:** el MVP nunca se instaló en uso real, así que no hay datos que mover. Si al arrancar existe `%LOCALAPPDATA%\Proyectoentornolocal`, el programa lo renombra una sola vez a `WolfCoreDev`, siempre que este no exista. También reemplaza en hosts el bloque viejo `Proyectoentornolocal` por el nuevo, junto con la próxima sincronización.

## 3. Enfoques decididos

| Tema | Elegido | Alternativa descartada y por qué |
|---|---|---|
| pgvector en Windows | **PostgreSQL 17 nativo y pgvector compilado una vez** con Visual Studio Build Tools, que el programa instala vía `winget` con permiso del usuario | El contenedor Podman solo para el bot exige una máquina WSL encendida (más memoria) y deja dos PostgreSQL. El usuario dejó la elección al constructor. |
| Redis en Windows | Compilación comunitaria **redis-windows/redis-windows** (msys2), fijada por SHA-256 en el catálogo | Memurai pide registro. El contenedor tiene el mismo costo que el de arriba. |
| Autoridad HTTPS | **CA propia generada por el programa** (node-forge), instalada en el almacén **de usuario** con `certutil -user -addstore Root`. Windows muestra su propia confirmación y no hace falta UAC. | mkcert es un binario extra que hace lo mismo. Instalar en el almacén de máquina exigiría administrador. |
| Gestor visual de BD | **Adminer** (un solo archivo PHP) servido por el Nginx del programa en un puerto interno | phpMyAdmin solo sirve para MySQL. Adminer cubre MySQL, MariaDB, PostgreSQL y SQLite. |
| Correo | **Mailpit**, binario oficial | — |

## 4. Diseño

### 4.1 HTTPS
- **CA:** al activar HTTPS por primera vez, el programa genera `ca/wolfcore-dev-ca.key|crt` (RSA 3072, 10 años, CN "WolfCore Dev CA") en la carpeta de datos y la instala en el almacén raíz del usuario. Un botón "Reinstalar autoridad" y otro "Quitar autoridad" la administran.
  - Chrome y Edge confían en ella de inmediato.
  - Para Firefox se muestra la instrucción de activar `security.enterprise_roots.enabled`.
- **Certificado por sitio:** se emite con SAN = dominio + alias, validez de 825 días, en `certs/<id>.crt|key`. Se regenera solo al cambiar el dominio o los alias y 30 días antes de vencer.
- **Campos nuevos del sitio:** `https: boolean` (falso por defecto) y `redirigirHttps: boolean`.
  - Con HTTPS, el vhost añade `listen <puertoHttps> ssl;` con `http2 on;`, el certificado y la llave.
  - El puerto HTTPS se configura en Ajustes y por defecto es 443.
- **Túneles:** cloudflared sigue apuntando al puerto HTTP del sitio. Si `redirigirHttps` está activo, la redirección se omite cuando la petición trae la cabecera `Cf-Connecting-Ip` o `X-Forwarded-Proto: https`, para no crear un bucle en el túnel.
- **Puerto 443 ocupado** (hoy lo tiene el Nginx de FlyEnv): el mismo aviso con nombre de proceso y PID que ya existe para el puerto 80.

### 4.2 Servicios de base de datos
Todos usan el supervisor, el catálogo verificado por SHA-256 y el estado real (PID y puerto) que ya existen.

| Servicio | Fuente oficial | Puerto por defecto | Inicialización |
|---|---|---|---|
| MySQL 8.4 LTS | dev.mysql.com, zip sin instalador | 3306 | `mysqld --initialize-insecure`, luego clave root aleatoria |
| MariaDB 11.4 LTS | archive.mariadb.org, zip | **3307** (para convivir con MySQL) | `mariadb-install-db --password=<aleatoria>` |
| PostgreSQL 17 | Binarios zip de EnterpriseDB | 5432 | `initdb -U postgres -E UTF8 --auth-local=scram-sha-256 --auth-host=scram-sha-256` con clave aleatoria |
| Redis 8 | github.com/redis-windows/redis-windows (fijado por hash) | 6379 | `redis.conf` generado: bind 127.0.0.1, sin clave |
| MongoDB 8 + mongosh | fastdl.mongodb.org y downloads.mongodb.com | 27017 | `--dbpath`, bind 127.0.0.1 |

- **Datos** en `data/<servicio>/<mayor.menor>/`. Desinstalar un binario nunca borra datos. "Borrar datos" es otra acción y pide escribir el nombre del servicio para confirmar.
- **Claves** generadas en `config.json` (equipo local, uso personal) y visibles en la interfaz. No se escriben en los proyectos salvo que el usuario copie el bloque `.env`.
- **Convivencia con FlyEnv:** si el puerto por defecto está ocupado, el aviso dice quién lo ocupa y ofrece "Usar otro puerto": 3308, 5433, 6380 y 27018. Cambiar el puerto de un servicio actualiza su configuración y el bloque `.env` mostrado.
- **pgvector:**
  1. El botón "Instalar pgvector" comprueba si hay Build Tools. Si no hay, pide permiso e instala `Microsoft.VisualStudio.2022.BuildTools` con la carga VCTools vía `winget`. Esto pasa por UAC y descarga unos 6 GB; se muestra el progreso.
  2. Descarga el código de la última versión etiquetada de `pgvector/pgvector` (zip del tag, con huella anotada en el catálogo) y lo compila con `nmake /F Makefile.win` usando `PGROOT`.
  3. Instala la extensión en la carpeta de ese PostgreSQL.
  4. Después, cada base de PostgreSQL ofrece el botón "Activar vector", que ejecuta `CREATE EXTENSION IF NOT EXISTS vector`.

### 4.3 Módulo Bases de datos (pantalla nueva)
- **Lista por servidor** (MySQL, MariaDB, PostgreSQL, MongoDB): bases con su tamaño. Las acciones son crear, borrar, respaldar, restaurar, abrir en Adminer y datos de conexión.
- **Crear:** nombre, codificación (utf8mb4 o UTF8) y usuario/clave propios opcionales.
- **Borrar:** pide escribir el nombre de la base.
- **Restaurar:**
  - Elige el archivo y detecta el formato: `.sql` plano; `PGDMP` (pg_dump custom) aunque la extensión sea `.sql`; `.gz`; y `.zip`/`.rar`/`.7z` mediante el `tar.exe` de Windows 11 (bsdtar), descomprimiendo en `tmp/`.
  - **Restaura siempre en una base nueva o vacía.** Si la base destino tiene tablas, pide confirmación explícita.
  - Muestra el progreso y la salida de `psql`/`pg_restore`/`mysql` en un panel de registro.
  - Sobre los errores de `pg_restore`: los de roles inexistentes no detienen la restauración, porque se usan `--no-owner --no-privileges`. Al final se muestra el resumen de advertencias.
- **Respaldar:** usa `pg_dump -Fc` o `mysqldump --single-transaction --routines --triggers` y guarda en una carpeta que elige el usuario. La carpeta por defecto es `Documentos\WolfCore Dev\Respaldos`, con nombre `<base>-<fecha>.dump|.sql`.
- **Importar desde otro servidor:** pide host, puerto, usuario, clave y base de origen. Hace `pg_dump`/`mysqldump` contra el origen (solo lectura) hacia un archivo temporal y lo restaura en la base local nueva. Está pensado para traer los datos del MySQL o PostgreSQL de FlyEnv. Nunca escribe en el origen.
- **Datos de conexión:** host, puerto, usuario y clave, más un bloque `.env` según el tipo de proyecto: Laravel (`DB_CONNECTION`, `DB_HOST`…) o CodeIgniter (las variables que usa el `.env` del proyecto, detectadas leyéndolo). Tiene un botón "Copiar".
- **Adminer:**
  - Se descarga de adminer.org (versión fijada por hash) en `tools/adminer/` y se sirve en `http://127.0.0.1:<puertoAdminer>` (8090 por defecto) con un vhost interno.
  - Solo escucha en 127.0.0.1, no usa hosts ni túnel y usa el PHP más reciente instalado.
  - "Abrir en Adminer" abre con el servidor y el usuario ya puestos.

### 4.4 Composer y terminal
- Instalar Composer descarga `composer.phar` de getcomposer.org, verificado con la huella publicada, a `tools/composer/`. Se crean shims `composer.cmd` y `php.cmd` en `tools/bin/` que usan el PHP por defecto (Ajustes).
- **"Terminal aquí"** en cada sitio abre Windows Terminal (o PowerShell si no está) en la carpeta del sitio. El PATH empieza por el PHP del sitio y `tools/bin`, así que `php artisan` y `composer install` usan la versión correcta.
- **"Agregar al PATH del usuario"** es opcional y no pide administrador: añade `tools/bin` al PATH del usuario. Hay un botón para quitarlo.
- El panel de Servicios muestra la versión de Composer y un botón "Actualizar" (`composer self-update`).

### 4.5 Mailpit
- Es un servicio más: SMTP en 1025 y buzón web en 8025, ambos solo en 127.0.0.1.
- Botón "Abrir buzón" y bloque `.env` de correo para Laravel: `MAIL_MAILER=smtp`, `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`, sin cifrado.
- La pantalla Inicio muestra el número de correos sin leer, leído de la API de Mailpit.

### 4.5b IA local con Ollama (agregado a pedido del usuario)
- **Servicio Ollama:** se instala desde el zip oficial de Windows (`ollama-windows-amd64.zip`, releases de `ollama/ollama`, verificado por SHA-256) y corre como `ollama serve` bajo el supervisor.
  - Escucha en `127.0.0.1:11434`.
  - `OLLAMA_MODELS` apunta a `data/ollama/models`.
  - Usa la GPU si existe, sin configuración.
- **Pantalla "IA local":**
  - **Modelos:** lista de modelos instalados (`/api/tags`) con su tamaño.
  - **Descargar:** campo con sugerencias (llama3.2, qwen2.5-coder, mistral, nomic-embed-text para embeddings del bot) y barra de progreso real (`/api/pull` por streaming).
  - **Mantenimiento:** borrar un modelo, probarlo con un chat mínimo de una línea y ver el espacio usado en disco.
- **Datos de conexión:** URL base, endpoint compatible con OpenAI (`http://127.0.0.1:11434/v1`) y un bloque `.env` de ejemplo (`OLLAMA_BASE_URL`, `OPENAI_BASE_URL`) para Laravel o para el bot FastAPI.
- La descarga de modelos puede pesar varios GB, así que se muestra el tamaño antes de confirmar cuando la API lo informa.

- **Hermes Agent y otros agentes:** Ollama es el motor de modelos; Hermes Agent (instalado en el equipo, v0.23.1), Claude Code y Codex son agentes que lo usan. El módulo "Agentes IA" (detectar, conectar a Ollama o al MCP de WolfCore Dev con un clic, abrir en el proyecto) va en la **Etapa B** junto al servidor MCP, como hace FlyEnv.

### 4.5c Servidor FTP (agregado a pedido del usuario)
- **Servidor FTP integrado:** usa la librería `ftp-srv` (MIT) dentro del proceso del núcleo, sin binarios extra. Es un servicio más con encender, apagar, estado y puerto.
  - Puerto de control 2121 y puertos pasivos 50000–50100.
  - **Solo escucha en 127.0.0.1 por defecto.** La opción "Permitir conexiones de la red local" usa 0.0.0.0 y avisa que el tráfico FTP va sin cifrar.
- **Usuario por sitio:** cada sitio tiene el interruptor "FTP". Al activarlo se crea el usuario `<id del sitio>` con una clave aleatoria, encerrado en la carpeta del sitio, sin poder salir de ella.
  - En la fila del sitio se muestran host, puerto, usuario y clave, con botón Copiar.
  - Se puede regenerar la clave y elegir solo lectura.
- No hay FTPS ni SFTP en esta etapa. Quedan anotados como mejora.
- Pruebas:
  - Unitarias: encierro en la carpeta (no permite `..` ni rutas absolutas), autenticación y solo lectura.
  - Integración: subir y bajar un archivo con un cliente FTP de Node.

### 4.6 Interfaz
- **Barra lateral:** Inicio, Sitios, Servicios, **Bases de datos**, **Correo**, **IA local**, Túneles, Ajustes. El FTP se maneja en Servicios y en cada sitio.
- **Servicios:** agrupa por categoría (Web, PHP, Bases de datos, Herramientas) y muestra el puerto con un enlace a "Usar otro puerto" si hay conflicto.
- **Sitios:** el formulario gana los interruptores HTTPS y "Redirigir a HTTPS". La fila muestra el candado y los enlaces http y https. Se agrega el botón "Terminal aquí".
- **Ajustes:**
  - puerto HTTPS, puerto de Adminer;
  - versión de PHP por defecto para la terminal y los shims;
  - estado de la autoridad HTTPS (instalada o no, botones);
  - PATH del usuario.

### 4.7 MCP-ready
Cada acción nueva se expone como método de `Nucleo` (no solo desde la interfaz), para que el servidor MCP de la Etapa B las publique sin tocar la lógica.

## 5. Calidad
- Pruebas unitarias: generación de la CA y del certificado (SAN, validez, cadena), plantillas con HTTPS y redirección sin bucle por túnel, detección de formato de respaldo, armado de comandos de restaurar, respaldar e importar, bloque `.env`, migración de la carpeta de datos y de los marcadores de hosts, parches de configuración de cada base de datos.
- Prueba de integración real (`npm run test:win`), ampliada:
  - instala MySQL, MariaDB, PostgreSQL, Redis, MongoDB, Mailpit, Composer y Adminer en una carpeta temporal con puertos altos;
  - crea, respalda y restaura una base en cada motor SQL, y restaura un `pg_dump` custom de prueba;
  - envía un correo a Mailpit y lo lee por API;
  - sirve un sitio por HTTPS verificando la cadena contra la CA temporal, **sin instalar la CA en el almacén real**.
- **pgvector:** prueba de integración aparte (`npm run test:win:pgvector`), opcional porque requiere las Build Tools. Se corre una vez en este equipo con permiso del usuario.

## 6. Decisiones del constructor (revisar)
- **pgvector y Redis:** opción nativa (sección 3).
- **Versiones:** MySQL 8.4 LTS, MariaDB 11.4 LTS, PostgreSQL 17, Redis 8, MongoDB 8.
- **Puertos por defecto:** MariaDB en 3307 para no chocar con MySQL. Alternativos 3308, 5433, 6380 y 27018 cuando FlyEnv ocupa los puertos estándar.
- **CA en el almacén de usuario**, sin administrador.
- **Restaurar siempre a una base nueva o vacía**, salvo confirmación explícita.
- **Respaldos** en `Documentos\WolfCore Dev\Respaldos` por defecto.
- **Adminer** en `127.0.0.1:8090`, sin dominio `.test`.
- **Claves de las bases** guardadas en `config.json` del equipo (uso personal), sin cifrar en esta etapa.
- **Carpeta de datos** renombrada a `WolfCoreDev`, con migración automática.

### Aclaraciones (revisión previa del diseño; son decisiones del constructor)
- **Rama:** `feat/etapa-a` sale de `feat/mvp-windows`, verificado: contiene todo el MVP (Nucleo, supervisor, catálogo, túneles).
- **Versiones y huellas:** se toma el último parche de cada línea indicada y se calcula su SHA-256 al construir, con acceso a la red. Si una línea no existe para Windows, se usa la anterior y queda anotado. Redis 8.10.3 sí está publicado en redis-windows.
- **Puerto 443 ocupado:**
  - Los vhosts no generan el bloque `ssl` mientras el puerto HTTPS esté ocupado por otro proceso. Así los sitios HTTP siguen funcionando.
  - El sitio muestra "HTTPS pendiente: el puerto 443 lo usa nginx.exe (PID…)".
  - Si el puerto HTTPS no es 443, las URLs mostradas incluyen `:puerto`.
- **`.rar`/`.7z`:** se intenta con `tar.exe`. Si falla (RAR5, cifrado), se muestra un error claro: "Descomprima el archivo y elija el .sql o .dump que contiene". No se empaqueta 7-Zip.
- **Sin autenticación en Redis y MongoDB:** es deliberado porque solo escuchan en 127.0.0.1. Adminer recibe servidor y usuario, **nunca la clave en la URL**.
- **Importar entre versiones:** se usan las herramientas cliente locales más nuevas instaladas. Si el servidor de origen es más nuevo que el cliente local, se bloquea con un mensaje claro que indica la versión necesaria.
- **pgvector:**
  - El entorno de compilación se carga con `vswhere` y `vcvars64.bat`.
  - Si no hay `winget`, se muestra cómo instalar las Build Tools a mano.
  - La prueba `test:win:pgvector` se escribe y se corre una vez en este equipo, **pidiendo antes permiso al usuario** (UAC y unos 6 GB).
- **Renombrar la carpeta de datos:** si el programa está abierto o la carpeta nueva ya existe, se omite y se avisa. No cambian las claves de `config.json`. Los respaldos en `run/` viajan con la carpeta.
- **Shims de PHP y Composer:** usan la versión de PHP por defecto. "Terminal aquí" antepone el PHP del sitio al PATH.

## 7. Lo que queda al constructor
Nombres internos, la forma exacta de la pantalla Bases de datos dentro del estilo existente, los intervalos de sondeo, los mensajes intermedios de progreso y los detalles de cada parche de configuración, siempre que respeten lo de arriba.
