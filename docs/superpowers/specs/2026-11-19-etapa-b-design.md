# WolfCore Dev — Etapa B: proyectos desde GitHub, herramientas, tema e idiomas

Fecha: 2026-11-19 · Estado: aprobado por el usuario (2026-11-19) · Base: rama `feat/etapa-a` (Etapa A terminada)

Insumos: [referentes](../roadmap/2026-11-18-referentes.md) · [EnvKit, GitHub y UI](../roadmap/2026-11-18-envkit-github-ui.md)

## 1. Para qué

El usuario quiere terminar el programa y usarlo ya para montar y probar todos sus proyectos:

- **WolfCore System**, **Rents** y **Coffe**: Laravel.
- **Diamantes** y **Dollar**: CodeIgniter 3.
- **El bot de IA**: FastAPI con pgvector.

**Prioridad:** que montar un proyecto, nuevo o desde GitHub, sea un flujo guiado de pocos clics.

Además pide tres cosas para la Etapa B:

- el módulo de **Herramientas** aprobado;
- una interfaz **pulida, con tema Sistema/Claro/Oscuro**;
- **multilenguaje**.

**Éxito:** desde WolfCore Dev, el usuario elige uno de sus repositorios de GitHub, el programa lo clona en `C:\Proyectos` y lo prepara, y el sitio queda abierto en `https://<proyecto>.test`. Los 6 proyectos quedan montados y se pueden probar sin pasos manuales fuera del programa, salvo restaurar los respaldos reales, que ya existe.

**Fuera de alcance (Etapa C):**

- módulo de agentes (Hermes, Claude Code, Codex);
- túneles con nombre;
- captura de `dump()`, Xdebug, editor de `php.ini` y gestor de extensiones;
- contenedores y DNS propio;
- más lenguajes de programación;
- copias programadas;
- macOS y Linux.

## 2. Decisiones de enfoque

| Tema | Elegido | Por qué |
|---|---|---|
| Acceso a GitHub | **CLI `gh`** si está instalado y con sesión; si no, ofrecer instalarlo (`winget install GitHub.cli`) y ejecutar `gh auth login`. Como alternativa, un **token personal** (PAT de grano fino) guardado con `safeStorage` de Electron. | El usuario ya tiene `gh` con sesión. Así no hace falta registrar una OAuth App propia, y el token nunca va en `config.json`, en remotos ni en logs. |
| Preparar proyectos | **Recetas por tipo de framework**, editables en `wolfcore.yml` dentro del proyecto. Cada paso es visible, con su registro, y se puede reintentar. | Así funcionan Herd, Lerd y EnvKit, pero WolfCore Dev lleva el ciclo completo de clonar, preparar y montar, que ninguno ofrece entero. |
| Node y Python | **Runtimes propios** descargados de fuentes oficiales (Node LTS de nodejs.org, Python de python.org en su versión embebible o de NuGet), por versión. El proyecto elige la suya en `wolfcore.yml` o se detecta (`.nvmrc`, `package.json engines`, `pyproject`). | Son necesarios para `npm run build` (Vite) y para el bot. Siguen el mismo patrón verificado del catálogo. |
| Idiomas | **vue-i18n** sobre el `es.ts` actual. Se entregan español e inglés, y la estructura queda lista para más. | Los textos ya están centralizados. |
| Tema | Preferencia Sistema/Claro/Oscuro en Pinia, más `nativeTheme.themeSource` en main para la barra y los diálogos nativos. | Es el estándar de Herd, ServBay y EnvKit. |

## 3. Diseño

### 3.1 Proyectos (pantalla "Proyectos", sustituye y amplía "Sitios")

- **Agregar proyecto**, con tres opciones:
  1. **Desde GitHub:**
     - Muestra la lista de repositorios del usuario, propios y de organizaciones, incluidos los privados. Tiene buscador e indica cuáles ya están clonados.
     - Se elige la carpeta destino; por defecto `C:\Proyectos\<nombre>`.
     - Se clona con `gh repo clone` o con `git` usando el token.
     - Antes de ejecutar nada aparece una casilla: "Confío en este repositorio: ejecutar sus pasos de instalación".
  2. **Desde una URL de Git** (cualquier host). Es igual que el anterior, pero con la URL.
  3. **Carpeta existente**, que es el flujo actual de sitios. Se suma **"Vigilar C:\Proyectos"** (*park*): detecta las carpetas nuevas y ofrece montarlas.
- **Detección:**
  - Laravel, CodeIgniter 3 y 4, WordPress, FastAPI, Vite/Node y estático.
  - La versión de PHP se toma de `composer.json` y la de Node de `.nvmrc` o `engines`. La de Python se toma de `pyproject` o `.python-version`.
  - Las bases de datos y los servicios necesarios se sacan de `.env.example` (`DB_CONNECTION`, `REDIS_*`, `MAIL_*`).
- **Receta** (editable, guardada en `wolfcore.yml` en la raíz del proyecto):
  - **Laravel:**
    1. `composer install`
    2. copiar `.env.example` a `.env`, rellenado con el bloque de conexión de WolfCore Dev y `APP_URL`
    3. `php artisan key:generate`
    4. crear la base y migrar (`migrate --seed` es opcional) o restaurar un respaldo
    5. `php artisan storage:link`
    6. `npm ci && npm run build` si hay `package.json`
    7. crear el sitio `.test` con su PHP y HTTPS
  - **CodeIgniter 3:**
    1. `composer install` si hay `composer.json`
    2. `.env` según el lector del proyecto
    3. crear la base y restaurar un respaldo si se elige uno
    4. crear el sitio con la plantilla CI3
  - **FastAPI:**
    1. `python -m venv .venv`
    2. `pip install -r requirements.txt`
    3. `.env`
    4. base de datos PostgreSQL con `CREATE EXTENSION vector` si se detecta pgvector
    5. **proceso supervisado** `uvicorn app:app --port <libre>`
    6. sitio `proxy` hacia ese puerto
  - Cada paso muestra su estado (pendiente, en curso, listo, error), su registro en vivo y los botones **Reintentar** y **Omitir**. Si falla un paso, nada se deshace y el usuario decide.
  - La receta se puede volver a ejecutar en cualquier momento ("Reinstalar dependencias").
- **Actualizar desde Git:**
  - Botón **"Traer cambios"**: hace `git pull --ff-only` y, según qué cambió, ofrece los pasos que tocan:
    - si cambió `composer.lock`, `composer install`;
    - si cambió `package-lock`, `npm ci && build`;
    - si hay migraciones nuevas, `migrate`.
  - Si hay cambios locales sin guardar, avisa y no toca nada.
- **Procesos del proyecto (supervisados):**
  - Por proyecto se pueden definir comandos de larga duración: `npm run dev`, `php artisan queue:work`, `schedule:work` y `uvicorn`.
  - Cada uno tiene su interruptor, su registro y la opción de reiniciarse solo. Usan el lanzador oculto.
- **Tarjeta del proyecto:**
  - estado y enlaces http/https;
  - rama Git y si tiene cambios;
  - túnel;
  - accesos rápidos: carpeta, terminal, editor (VS Code si existe) y GitHub.

### 3.2 Runtimes Node y Python

- Se agregan al catálogo: Node (versiones LTS con su SHASUMS256 oficial) y Python 3.12/3.13 (paquete NuGet `python`, con hash).
- Cada uno se instala, se lista y se puede desinstalar.
- "Terminal aquí" y los procesos del proyecto anteponen al PATH el Node y el Python del proyecto, igual que ya se hace con PHP.

### 3.3 Herramientas (pantalla nueva)

Son utilidades **propias**, hechas en el renderer o en el núcleo, sin servicios externos.

- **Generador de QR:** a partir de texto o de la URL del túnel de un sitio; se puede descargar en PNG.
- **JSON:** formatear, validar y minificar, con árbol.
- **Expresiones regulares:** probador con resaltado de coincidencias y grupos, más una hoja de referencia.
- **Comparar textos y archivos:** vista lado a lado.
- **Tiempo:** convertir entre timestamp y fecha, con zona horaria.
- **Puertos y procesos:** lista de puertos en uso con su proceso y el botón "Finalizar". Pide confirmación y bloquea los procesos del sistema.
- **Limpieza BOM UTF-8:** sobre un archivo o una carpeta. Primero muestra qué archivos cambiaría y crea copias.
- **Certificados:** emitir con la CA de WolfCore Dev para cualquier nombre y descargar los PEM.
- **Cripto:** hash (MD5, SHA-1, SHA-256, bcrypt), base64, codificar URL, UUID, contraseñas aleatorias y decodificador de JWT.
- **Vista previa de Markdown.**
- **Entorno del sistema:** PATH, versiones y variables.
- **Información de archivo:** tamaño, hashes y tipo.
- **Cliente WebSocket.**

### 3.4 Panel y registros

- **Inicio**, como panel de rendimiento:
  - Tarjetas de CPU, RAM, disco de datos y red, con gráficas de 5 minutos. Se muestrea cada 3 s, solo con la ventana visible.
  - Tabla de servicios y procesos de proyecto con CPU %, RAM, PID, puerto, tiempo encendido y acciones.
  - Alertas: puerto en conflicto (con "Finalizar proceso"), RAM alta y php-cgi huérfano.
- **Visor de registros unificado:**
  - Fuentes: Nginx (acceso y error por sitio), PHP, cada servicio, `storage/logs/laravel.log` de cada proyecto Laravel, procesos del proyecto y túneles.
  - Seguimiento en vivo, filtro de texto y nivel, pausa y copia.

### 3.5 Interfaz: tema, idiomas y pulido

- **Tema:** Sistema, Claro u Oscuro, en Ajustes y en la barra superior. El acento es configurable; el actual es el predeterminado.
- **Idiomas:** español e inglés, con selector en Ajustes y detección inicial por el idioma del sistema. Cubre fechas, números y la locale de Naive UI.
- **Pulido:**
  - Revisión visual tomando patrones de Herd, ServBay, Local y EnvKit: barra lateral con grupos, tarjetas con jerarquía clara, chips de estado, estados vacíos ilustrados, densidad cómoda y transiciones suaves.
  - **Paleta de comandos `Ctrl+K`:** ir a pantallas, encender o apagar servicios, abrir sitios, clonar repositorios y abrir herramientas.
  - **Asistente de primer uso:** elegir carpeta de proyectos, instalar lo básico (Nginx, PHP, Composer, Node), confiar la CA y conectar GitHub.

### 3.6 Servidor MCP

- Servidor MCP local en `127.0.0.1` con token, usando el SDK oficial. Publica los métodos de `Nucleo`:
  - sitios y proyectos;
  - servicios;
  - bases de datos: listar, crear, respaldar y restaurar, con las mismas confirmaciones;
  - túneles;
  - herramientas útiles.
- Las acciones destructivas exigen confirmación en la ventana.
- Botón "Copiar configuración para Claude Code".

## 4. Calidad

- Pruebas unitarias en cada módulo del núcleo.
- Pruebas de interfaz para tienda y utilidades.
- Prueba de integración real ampliada:
  - clonar un repositorio público pequeño de Laravel en una carpeta temporal y ejecutar la receta completa con Node, Composer y MySQL;
  - montar un FastAPI mínimo con venv y uvicorn como proceso supervisado;
  - verificar el sitio por HTTPS;
  - verificar que no queden ventanas visibles ni procesos huérfanos.
- Aceptación con los proyectos reales del usuario: después de construir la etapa, se montan los 6 proyectos desde WolfCore Dev. Los datos reales salen de los respaldos de `C:\Proyectos\_respaldos`.

## 5. Decisiones del constructor (para revisar)

- Acceso a GitHub por `gh`, con PAT en `safeStorage` como alternativa. Sin OAuth App propia.
- El nombre de la pantalla pasa de "Sitios" a **"Proyectos"**. Un proyecto puede tener sitio, procesos y receta.
- `wolfcore.yml` dentro del repositorio del proyecto; el usuario decide si lo versiona.
- Node LTS más reciente y Python 3.12 como versiones por defecto.
- Idiomas iniciales: español e inglés.
- MCP en esta etapa; agentes de IA en la Etapa C.
