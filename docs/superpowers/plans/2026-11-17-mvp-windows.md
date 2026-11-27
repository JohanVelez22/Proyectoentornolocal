# Entorno Local — Plan del MVP (fases 0 y 1, Windows)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** construir un programa de escritorio para Windows que instale y administre Nginx, PHP (varias versiones) y cloudflared. Debe crear sitios `.test` ilimitados (Laravel, CodeIgniter 3, estático, proxy y personalizado) y abrir un túnel rápido por sitio con enlace visible.

**Architecture:** monorepo con npm workspaces.
- `packages/core` (`@pel/core`) es TypeScript puro y no depende de Electron. Contiene toda la lógica: catálogo, instalador, supervisor de procesos, sitios, Nginx, hosts y túneles. Expone una fachada `Nucleo` con eventos.
- `apps/desktop` es Electron + Vue 3 + Naive UI. Llama a `Nucleo` por IPC tipado y no tiene lógica de negocio.

**Tech Stack:** Node ≥ 22, TypeScript 5 estricto, Vitest, zod, extract-zip, Electron 39, electron-vite, Vue 3, Pinia, vue-router, Naive UI, electron-builder (NSIS).

**Spec:** `docs/superpowers/specs/2026-11-17-proyectoentornolocal-design.md`

## Global Constraints

- Todo el texto visible está en español y en `apps/desktop/src/renderer/i18n/es.ts`. Nombre visible: **"Entorno Local"**. Paquete y repositorio: `Proyectoentornolocal`.
- Carpeta de datos en Windows: `%LOCALAPPDATA%\Proyectoentornolocal`, con las subcarpetas `bin/ etc/nginx/ etc/nginx/sites/ etc/php/<ver>/ logs/ logs/sitios/ logs/tuneles/ run/` y los archivos `config.json` y `run/estado.json`.
- `@pel/core` no importa `electron`. Todo lo que depende del sistema operativo pasa por la interfaz `Plataforma`.
- Los binarios se descargan de fuentes oficiales: windows.php.net (NTS x64), nginx.org y `github.com/cloudflare/cloudflared/releases`. Se verifica su SHA-256 antes de mover nada a `bin/`.
- Un servicio está "encendido" solo si su PID vive **y** su puerto acepta conexión TCP. El sondeo corre cada 3000 ms.
- El archivo hosts se toca únicamente entre `# >>> Proyectoentornolocal (no editar a mano)` y `# <<< Proyectoentornolocal`. Cada dominio tiene dos líneas: `127.0.0.1  dominio` y `::1  dominio`.
- En Windows, PHP corre como `php-cgi.exe -b 127.0.0.1:<puerto>` con `PHP_FCGI_MAX_REQUESTS=0`. El grupo es de 2 trabajadores por defecto. El puerto base es `9000 + mayor*100 + menor*10` (8.3 → 9830 y 9831, 8.4 → 9840 y 9841), así no choca con los 908x de FlyEnv.
- Nginx escucha en el puerto 80. Si está ocupado, el error dice qué proceso lo ocupa (nombre y PID).
- Túnel rápido: `cloudflared tunnel --no-autoupdate --url http://127.0.0.1:<puertoNginx> --http-host-header <dominio> --logfile <logs/tuneles/<id>.log>`. La URL se busca con `/https:\/\/[a-z0-9-]+\.trycloudflare\.com/`. Si no aparece en 30 s, se cierra el proceso y se informa el error.
- Commits pequeños, con mensajes en español, formato `tipo: descripción` y la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No se copia código de FlyEnv ni de ServBay.

## Review Focus

1. **Rutas con espacios y tildes** (`C:\Proyectos\WolfCore System`): los vhosts usan barras `/` y las rutas van entre comillas dobles en `root` e `include`. Prueba en la tarea 3.
2. **Hosts que ya tienen los mismos dominios fuera del bloque** (FlyEnv los escribió). Se conservan y se informan como `duplicadosFuera`. Además se conservan CRLF y la codificación original, y una BOM no rompe el análisis. Prueba en la tarea 4.
3. **UAC cancelado o escritura denegada:** hosts queda igual, `sincronizar()` devuelve `{ok:false, motivo:'cancelado'|'denegado'}` y el sitio aparece como `hostsPendiente`. Prueba en la tarea 4.
4. **Programa reabierto con servicios corriendo:** se reutilizan por PID y ejecutable. Si el PID ahora pertenece a otro programa, se descarta. No se duplican procesos. Prueba en la tarea 7.
5. **`.env` sin la variable de URL base:** se agrega al abrir el túnel y se elimina al cerrarlo. Si sí estaba, se restaura el valor exacto. Prueba en la tarea 10.

---

### Task 1: Monorepo, herramientas y CI

**Files:**
- Create: `package.json` (workspaces `packages/*`, `apps/*`; scripts `test`, `lint`, `typecheck`, `dev`, `build`), `tsconfig.base.json` (strict, `moduleResolution: bundler`, ES2023), `eslint.config.mjs` (typescript-eslint + vue), `.prettierrc`, `.editorconfig`, `README.md` (qué es, cómo correrlo y estado por fase)
- Create: `packages/core/package.json` (`name: @pel/core`, `type: module`, `main: src/index.ts`), `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/src/index.ts`
- Create: `.github/workflows/ci.yml` (matriz windows-latest, macos-latest, ubuntu-latest: `npm ci && npm run lint && npm run typecheck && npm test`)
- Test: `packages/core/test/humo.test.ts`

- [ ] Paso 1: escribir `humo.test.ts`, que verifica que `import * as core from '../src'` exporta `VERSION === '0.1.0'`.
- [ ] Paso 2: `npm install` y luego `npm test -w @pel/core`. Debe fallar porque falta `VERSION`.
- [ ] Paso 3: exportar `VERSION` en `src/index.ts`.
- [ ] Paso 4: `npm test`, `npm run lint` y `npm run typecheck` terminan en verde.
- [ ] Paso 5: commit `chore: monorepo con core, lint, pruebas y CI`.

### Task 2: Tipos, rutas, almacén y eventos

**Files:**
- Create: `packages/core/src/tipos.ts`, `src/rutas.ts`, `src/almacen.ts`, `src/eventos.ts`
- Test: `test/almacen.test.ts`, `test/rutas.test.ts`

**Interfaces:**
- Produces:
  - `type TipoSitio = 'laravel'|'codeigniter3'|'estatico'|'proxy'|'personalizado'`
  - `interface Sitio { id: string; nombre: string; dominio: string; alias: string[]; carpeta: string; tipo: TipoSitio; php: string|null /* "8.4" */; puertoProxy: number|null; reglasExtra: string; urlBaseVar: string|null; datosReales: boolean; nota: string }`
  - `function raizDeSitio(s: Sitio): string` (laravel → `carpeta/public`, proxy → `carpeta`, resto → `carpeta`)
  - `interface Config { version: 1; sitios: Sitio[]; servicios: { nginx: { version: string|null; puerto: number }; php: { versiones: string[]; trabajadores: number } ; cloudflared: { version: string|null } } }`
  - `class Rutas { constructor(base: string); bin(servicio: string, version: string): string; nginxConf(): string; vhost(id: string): string; phpIni(version: string): string; logs(...p: string[]): string; estado(): string; config(): string; tmp(): string; asegurar(): Promise<void> }`
  - `function rutaBasePorDefecto(env = process.env, plataforma = process.platform): string` (Windows `%LOCALAPPDATA%\Proyectoentornolocal`)
  - `class Almacen { constructor(rutas: Rutas); leer(): Promise<Config>; guardar(c: Config): Promise<void> }`: valida con zod; si el archivo no existe, devuelve la config por defecto (`nginx.puerto=80`, `trabajadores=2`). La escritura es atómica (archivo `.tmp` y luego rename). Si el JSON es inválido, lo renombra a `config.corrupto-<fecha>.json` y devuelve la config por defecto.
  - `class Eventos<M extends Record<string, unknown>>`, con los métodos `on(evento, fn): () => void` y `emit(evento, dato)`. Mapa `EventosNucleo = { 'servicio:estado': EstadoServicio; 'sitio:cambio': Sitio[]; 'tunel:estado': EstadoTunel; 'instalacion:progreso': ProgresoInstalacion; 'hosts:estado': EstadoHosts }`. Los tipos de esos payloads se definen en `tipos.ts`:
    - `EstadoServicio {id:string; nombre:string; version:string|null; estado:'apagado'|'iniciando'|'encendido'|'error'|'externo'; puertos:number[]; pid:number|null; mensaje?:string}`
    - `EstadoTunel {sitioId:string; estado:'apagado'|'iniciando'|'activo'|'error'; url:string|null; mensaje?:string}`
    - `ProgresoInstalacion {servicio:string; version:string; fase:'descargando'|'verificando'|'extrayendo'|'listo'|'error'; porcentaje:number; mensaje?:string}`
    - `EstadoHosts {pendientes:string[]; duplicadosFuera:string[]; mensaje?:string}`

- [ ] Paso 1: pruebas en un directorio temporal:
  - `leer()` sin archivo devuelve la config por defecto.
  - `guardar` seguido de `leer` devuelve lo mismo.
  - Un JSON corrupto se renombra y se devuelve la config por defecto.
  - `raizDeSitio` de laravel da `…/public`.
  - `rutaBasePorDefecto({LOCALAPPDATA:'C:\\X'}, 'win32')` es igual a `C:\X\Proyectoentornolocal`.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): tipos, rutas, almacén validado y bus de eventos`.

### Task 3: Detección de proyecto y generación de Nginx

**Files:**
- Create: `packages/core/src/sitios/detectar.ts`, `src/nginx/plantillas.ts`, `src/nginx/principal.ts`
- Test: `test/detectar.test.ts`, `test/plantillas.test.ts`

**Interfaces:**
- Produces:
  - `detectarProyecto(carpeta: string): Promise<{ tipo: TipoSitio; php: string|null; sugerenciaDominio: string; urlBaseVar: string|null }>`. Si existe `artisan`, es laravel. En ese caso `php` sale de `composer.json` `require.php` (`^8.4.1` → `"8.4"`, `^8.3` → `"8.3"`) y `urlBaseVar` es `'APP_URL'`. Si existen `application/` y `system/core/CodeIgniter.php`, es codeigniter3 con `urlBaseVar` igual a `'APP_BASE_URL'` si el `.env` la contiene, o `null` si no. Si hay `index.php` es personalizado; si no, estático. El dominio sugerido es el nombre de la carpeta en minúsculas, sin acentos, con espacios convertidos en `-`, más `.test` (`WolfCore System` → `wolfcore-system.test`).
  - `generarVhost(s: Sitio, o: { puertoNginx: number; rutasLogs: { acceso: string; error: string } }): string`
  - `generarNginxPrincipal(o: { prefijo: string; sitesDir: string; phpUpstreams: { version: string; puertos: number[] }[]; logsDir: string }): string`. Genera `worker_processes 1`, `events`, `http` con `mime.types`, `client_max_body_size 64m`, un `upstream php83 { server 127.0.0.1:9830; server 127.0.0.1:9831; }` por versión e `include "<sitesDir>/*.conf"`.
  - `puertosPhp(version: string, trabajadores: number): number[]` (`'8.4', 2` → `[9840, 9841]`)
- Reglas de plantillas (afirmar el texto exacto en las pruebas):
  - Todas generan `server_name <dominio> <alias...>;`, `listen <puerto>;`, `charset utf-8;`, `access_log "<ruta>";` y `error_log "<ruta>";`. Además incluyen `reglasExtra` tal cual, **antes** de los `location` de la plantilla.
  - **laravel:** `root "<carpeta>/public";`, `index index.php index.html;`, `location / { try_files $uri $uri/ /index.php?$query_string; }`, `location = /index.php { fastcgi_pass php84; include fastcgi_params; fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; }`, `location ~ \.php$ { return 404; }` y `location ~ /\.(?!well-known) { deny all; }`.
  - **codeigniter3:** `root "<carpeta>";`. Bloques `location ^~ /application/`, `/system/`, `/sql/`, `/docs/` y `/tests/` con `deny all`. `location ~ /\. { deny all; }`. `location ~* \.(sql|md|rst|lock|log|ini|sh|py|bak|old|dist|dump|backup)$ { deny all; }`. `location ~* (^|/)(composer|package)(-lock)?\.json$ { deny all; }`. `location ^~ /vendor/ { location ~* \.php$ { deny all; } try_files $uri =404; }`. `location / { try_files $uri $uri/ /index.php$is_args$query_string; }`. El bloque de `index.php` es igual al de laravel. `location ~ \.php$ { return 404; }`.
  - **estatico:** `root`, `index index.html` y `try_files $uri $uri/ =404;`.
  - **proxy:** `location / { proxy_pass http://127.0.0.1:<puertoProxy>; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto; }`.
  - **personalizado:** solo `root` y el texto de `reglasExtra`, más un bloque genérico `location ~ \.php$` con fastcgi si hay PHP.
  - Las rutas de Windows se normalizan a `/`.

- [ ] Paso 1: pruebas. Detección con carpetas falsas en un directorio temporal: laravel con `^8.4.1`, ci3 con `.env` que tiene `APP_BASE_URL` y estático. Plantillas: una prueba por tipo que afirma las líneas clave de arriba; una prueba de ruta `C:\Proyectos\WolfCore System` → `root "C:/Proyectos/WolfCore System/public";` (Review Focus 1); y una prueba de que en ci3 `/application/` sale **antes** de `location /`.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): detección de proyectos y plantillas nginx`.

### Task 4: Archivo hosts y plataforma Windows

**Files:**
- Create: `packages/core/src/hosts/bloque.ts`, `src/hosts/hosts.ts`, `src/plataforma/tipos.ts`, `src/plataforma/win.ts`, `src/plataforma/index.ts`
- Test: `test/hosts-bloque.test.ts`, `test/hosts.test.ts`

**Interfaces:**
- Produces:
  - `aplicarBloque(contenido: string, dominios: string[]): string`. Es una función pura: reemplaza o crea el bloque, conserva el resto byte a byte y usa el salto de línea predominante del archivo (CRLF/LF). Con lista vacía elimina el bloque.
  - `analizarHosts(contenido: string): { enBloque: string[]; fuera: string[] }` (ignora la BOM y los comentarios)
  - `interface Plataforma { rutaHosts(): string; escribirComoAdmin(destino: string, contenido: string): Promise<{ok:true}|{ok:false; motivo:'cancelado'|'denegado'|'error'; detalle?:string}>; quienUsaPuerto(puerto: number): Promise<{pid:number; nombre:string}|null>; procesoVivo(pid:number): Promise<{vivo:boolean; ejecutable?:string}>; matarArbol(pid:number): Promise<void>; abrirUrl(url:string): Promise<void>; ejecutable(nombre:'nginx'|'php-cgi'|'php'|'cloudflared'): string /* agrega .exe en win */ }`
  - `crearPlataforma(): Plataforma` (en Windows devuelve `PlataformaWindows`; en otro SO lanza "Plataforma aún no soportada (fase 4)")
  - `class GestorHosts { constructor(p: Plataforma, eventos); estado(dominios: string[]): Promise<EstadoHosts>; sincronizar(dominios: string[]): Promise<{ok:true}|{ok:false; motivo:string; comandoManual:string}> }`
- `PlataformaWindows.escribirComoAdmin` sigue estos pasos:
  1. Escribe el contenido en `%TEMP%\pel-hosts-<n>.txt`.
  2. Ejecuta `powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile','-Command','Copy-Item -LiteralPath <tmp> -Destination <destino> -Force; ipconfig /flushdns | Out-Null'"`.
  3. Si sale el error `canceled by the user` / `cancelado por el usuario`, devuelve `cancelado`.
  4. Después compara el contenido del destino con lo esperado: si es igual, devuelve `ok`; si no, `denegado`.
- `quienUsaPuerto` interpreta `netstat -ano -p TCP` (estado `LISTENING`, local `:puerto`) y luego `tasklist /FI "PID eq n" /FO CSV /NH`. `procesoVivo` usa `tasklist` por PID.
- `comandoManual` es el texto para pegar en una PowerShell de administrador: un `Set-Content` del bloque completo.

- [ ] Paso 1: pruebas de `aplicarBloque`:
  - crea el bloque en un hosts sin él;
  - reemplaza un bloque existente;
  - conserva CRLF;
  - con BOM al inicio, `analizarHosts` no se confunde;
  - un dominio que ya está fuera del bloque sigue fuera y aparece en `fuera`;
  - una lista vacía elimina el bloque.
  
  Pruebas de `GestorHosts` con una `Plataforma` falsa: si devuelve `cancelado`, `sincronizar` da `{ok:false, motivo:'cancelado'}` y `estado` sigue listando los pendientes (Review Focus 2 y 3). Pruebas de los intérpretes de `netstat` y `tasklist` con salidas de ejemplo fijas.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): bloque de hosts con elevación y plataforma Windows`.

### Task 5: Catálogo e instalador

**Files:**
- Create: `packages/core/src/catalogo/catalogo.json`, `src/catalogo/catalogo.ts`, `src/catalogo/instalador.ts`
- Test: `test/catalogo.test.ts`, `test/instalador.test.ts`

**Interfaces:**
- Produces:
  - `catalogo.json`: `{ "nginx": [{version, url, sha256, formato:"zip", subcarpeta:"nginx-1.28.x"}], "cloudflared": [{version, url, sha256, formato:"exe"}] }`. Las versiones y los hashes **reales** de la última estable de Nginx y de cloudflared para windows-amd64 se obtienen al implementar. Se descarga el archivo y se calcula el SHA-256, contrastándolo con el que publica la release de cloudflared.
  - `listarVersiones(servicio:'nginx'|'php'|'cloudflared', f?: typeof fetch): Promise<VersionDisponible[]>`, con `VersionDisponible {servicio; version; url; sha256: string|null; formato:'zip'|'exe'; subcarpeta?: string}`. PHP se consulta en vivo en `https://windows.php.net/downloads/releases/releases.json`: el objeto `<mayor.menor>` y su entrada `nts-vs17-x64` (o `nts-vs16-x64`), que tiene `zip.path` y `zip.sha256`. La URL base es `https://windows.php.net/downloads/releases/`. Solo se listan las versiones 8.1 en adelante.
  - `class Instalador { constructor(rutas: Rutas, eventos, f?: typeof fetch); instalado(servicio, version): Promise<boolean>; instalados(servicio): Promise<string[]>; instalar(v: VersionDisponible): Promise<void>; desinstalar(servicio, version): Promise<void> }`. El flujo es:
    1. Descarga a `rutas.tmp()` emitiendo `instalacion:progreso`.
    2. Verifica el sha256. Si no coincide, emite `fase:'error'` con el mensaje "La descarga no coincide con la huella publicada", borra el temporal y lanza el error.
    3. Extrae con `extract-zip` a `tmp/<id>`. Si hay `subcarpeta`, toma su contenido.
    4. Hace rename a `bin/<servicio>/<version>`. En `exe`, copia a `bin/cloudflared/<v>/cloudflared.exe`.
    5. Para PHP, copia `php.ini-development` como base. El `php.ini` final lo genera la tarea 8.

- [ ] Paso 1: pruebas con un `fetch` falso que sirve un zip pequeño generado en la prueba:
  - instala, queda en `bin/nginx/x`, `instalados` lo lista y se emiten las fases en orden;
  - si el hash es incorrecto, no queda nada en `bin/` y se lanza el error;
  - `listarVersiones('php')` con un `releases.json` de ejemplo (fixture) devuelve 8.3 y 8.4 con URL y sha256.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): catálogo oficial e instalador verificado`.

### Task 6: Supervisor de procesos

**Files:**
- Create: `packages/core/src/procesos/supervisor.ts`, `src/procesos/sonda.ts`
- Test: `test/supervisor.test.ts`

**Interfaces:**
- Produces:
  - `puertoResponde(puerto: number, host='127.0.0.1', ms=800): Promise<boolean>` (TCP connect)
  - `interface DefProceso { id: string /* 'nginx', 'php-8.4-0', 'tunel-<sitio>' */; comando: string; args: string[]; cwd?: string; env?: Record<string,string>; puerto?: number; log: string; reiniciar: boolean }`
  - `class Supervisor { constructor(rutas, plataforma, eventos, opts?: {intervaloMs?: number; spawn?: typeof child_process.spawn}); iniciar(def: DefProceso): Promise<void>; detener(id: string): Promise<void>; estado(id: string): 'apagado'|'iniciando'|'encendido'|'error'; pid(id): number|null; readoptar(): Promise<void>; alSalir(fn) ; cerrar(): Promise<void> }`
- Comportamiento:
  - El proceso se lanza con `windowsHide:true` y `detached:true`, con stdout y stderr hacia el archivo de log. El estado se guarda en `run/estado.json` como `{id, pid, ejecutable, args, puerto}`.
  - Pasa a `encendido` cuando el PID vive y el puerto responde. Si no hay `puerto`, basta con que el PID viva.
  - Si muere sin un `detener()` previo y `reiniciar` es true, reintenta con esperas de 1, 2, 4, 8 y 16 s. Tras 5 fallos queda en `error` con las últimas 20 líneas del log.
  - `readoptar()` lee `estado.json` y adopta cada PID **solo** si `procesoVivo(pid).ejecutable` coincide con el `comando` guardado. Si no coincide, lo descarta.
  - `detener` usa `matarArbol`.

- [ ] Paso 1: pruebas con `spawn` y plataforma falsos y temporizadores falsos de Vitest:
  - iniciar → encendido;
  - una muerte inesperada reinicia;
  - tras 5 fallos queda en error;
  - `detener` no reinicia;
  - `readoptar` con un PID vivo y el mismo ejecutable lo adopta sin lanzar un proceso nuevo;
  - `readoptar` con un PID vivo pero otro ejecutable lo descarta (Review Focus 4).
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): supervisor de procesos con reinicio y readopción`.

### Task 7: Servicios Nginx y PHP

**Files:**
- Create: `packages/core/src/servicios/nginx.ts`, `src/servicios/php.ts`, `src/servicios/servicios.ts`
- Test: `test/servicios.test.ts`

**Interfaces:**
- Consumes: `Supervisor`, `Instalador`, `generarNginxPrincipal`, `puertosPhp`, `Plataforma.quienUsaPuerto`
- Produces:
  - `class ServicioNginx { iniciar(); detener(); recargar(): Promise<void>; probarConfig(): Promise<{ok:boolean; salida:string}> }`. Arranca con `nginx.exe -p <bin/nginx/v> -c <etc/nginx/nginx.conf>`, recarga con `-s reload` y prueba con `-t`. Antes de arrancar ejecuta `quienUsaPuerto(80)`. Si el puerto está ocupado, lanza `ErrorPuertoOcupado` con el mensaje "El puerto 80 lo usa nginx.exe (PID 1234). Ciérrelo o cambie el puerto en Ajustes."
  - `class ServicioPhp { iniciar(version); detener(version); generarIni(version): Promise<void> }`. El `php.ini` parte de `php.ini-development` y fija `extension_dir="<bin>/ext"`; activa `curl, fileinfo, gd, intl, mbstring, openssl, pdo_mysql, pdo_pgsql, pdo_sqlite, pgsql, sqlite3, zip, sodium`; y fija `memory_limit=512M`, `upload_max_filesize=64M`, `post_max_size=64M`, `date.timezone=America/Bogota` y `cgi.fix_pathinfo=0`. Arranca un `DefProceso` por puerto de `puertosPhp`.
  - `class Servicios { constructor(...); estados(): Promise<EstadoServicio[]>; iniciar(id: 'nginx'|`php-${string}`); detener(id); iniciarTodo(); detenerTodo() }`. Si MySQL (3306) o PostgreSQL (5432) responden pero no los inició el programa, aparecen con `estado:'externo'`.
- [ ] Paso 1: pruebas con un supervisor falso:
  - el `php.ini` generado contiene las extensiones y los valores indicados;
  - iniciar PHP 8.4 lanza dos procesos en 9840 y 9841 con `PHP_FCGI_MAX_REQUESTS=0`;
  - Nginx con el puerto ocupado lanza `ErrorPuertoOcupado` con nombre y PID;
  - `estados()` marca 3306 como externo cuando la sonda falsa responde.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): servicios nginx y php-cgi con grupos de trabajadores`.

### Task 8: Gestor de sitios

**Files:**
- Create: `packages/core/src/sitios/sitios.ts`
- Test: `test/sitios.test.ts`

**Interfaces:**
- Consumes: `Almacen`, `generarVhost`, `generarNginxPrincipal`, `ServicioNginx`, `GestorHosts`
- Produces: `class GestorSitios { listar(): Promise<Sitio[]>; crear(d: Omit<Sitio,'id'>): Promise<Sitio>; editar(id, cambios: Partial<Sitio>): Promise<Sitio>; borrar(id): Promise<void>; aplicar(): Promise<{nginx:{ok:boolean; salida:string}; hosts: {ok:boolean; motivo?:string; comandoManual?:string}}> }`
- Reglas:
  - El dominio debe terminar en `.test` y ser único. Si `tipo='proxy'`, se exige `puertoProxy`. Si el tipo es laravel, codeigniter3 o personalizado, la versión de PHP debe estar instalada.
  - `aplicar()` hace, en este orden:
    1. Escribe los vhosts y el `nginx.conf` principal (con upstreams de las versiones de PHP en uso).
    2. Ejecuta `probarConfig()`. Si falla, **restaura los archivos anteriores** y devuelve `ok:false` con la salida.
    3. Si está bien y Nginx está encendido, recarga.
    4. Sincroniza hosts con todos los dominios y alias.
  - `borrar` nunca toca la carpeta del proyecto.
- [ ] Paso 1: pruebas:
  - crear un sitio con un dominio duplicado lanza "Ya existe un sitio con el dominio X";
  - un dominio sin `.test` es rechazado;
  - `aplicar` con `probarConfig` falso fallido deja el vhost anterior intacto;
  - `borrar` elimina el vhost pero la carpeta sigue existiendo;
  - se pueden crear 10 sitios (no hay límite).
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): gestor de sitios ilimitados con validación y reversión`.

### Task 9: Túneles rápidos y URL base

**Files:**
- Create: `packages/core/src/tuneles/url.ts`, `src/tuneles/tuneles.ts`, `src/sitios/urlbase.ts`
- Test: `test/tuneles.test.ts`, `test/urlbase.test.ts`

**Interfaces:**
- Produces:
  - `extraerUrlTunel(texto: string): string|null`
  - `ponerVariableEnv(contenido: string, nombre: string, valor: string|null): string`. Con `null` elimina la línea. Conserva comillas, CRLF y el resto del archivo.
  - `class UrlBase { aplicar(s: Sitio, url: string): Promise<void>; restaurar(s: Sitio): Promise<void> }`. Guarda el valor anterior (o su ausencia) en `run/urlbase-<id>.json` y una copia en `<carpeta>/.env.pel-respaldo`. Si el sitio es laravel y existe `bootstrap/cache/config.php`, ejecuta `php artisan config:clear` con el PHP del sitio.
  - `class Tuneles { abrir(sitioId): Promise<EstadoTunel>; cerrar(sitioId): Promise<void>; estados(): EstadoTunel[] }`. Lanza el proceso mediante el `Supervisor` con id `tunel-<sitioId>` y `reiniciar:false`. Lee el log cada 500 ms hasta encontrar la URL o hasta 30 s. Si muere el proceso, emite `tunel:estado` en `error` con el mensaje "El túnel se cerró. Use Renovar.".
- [ ] Paso 1: pruebas:
  - `extraerUrlTunel` con un log real de ejemplo devuelve la URL e ignora `https://api.trycloudflare.com` si aparece;
  - `ponerVariableEnv` reemplaza una variable existente, agrega una ausente y elimina con `null`;
  - abrir y luego cerrar sobre un `.env` sin la variable deja el `.env` igual al original (Review Focus 5);
  - si no hay URL en 30 s, se mata el proceso y el estado queda en error.
- [ ] Paso 2: correr las pruebas y confirmar que fallan.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): túneles rápidos por sitio y url base temporal`.

### Task 10: Fachada Nucleo

**Files:**
- Create: `packages/core/src/nucleo.ts`. Modify: `src/index.ts` (exportar la API pública).
- Test: `test/nucleo.test.ts`

**Interfaces:**
- Produces: `class Nucleo { static crear(o?: {base?: string; plataforma?: Plataforma; fetch?: typeof fetch}): Promise<Nucleo>; eventos: Eventos<EventosNucleo>; sitios: GestorSitios; servicios: Servicios; tuneles: Tuneles; instalador: Instalador; hosts: GestorHosts; detectarProyecto: typeof detectarProyecto; listarVersiones: typeof listarVersiones; iniciarSondeo(): void; cerrar(o:{detenerServicios:boolean}): Promise<void> }`. `crear` ejecuta `rutas.asegurar()` y `supervisor.readoptar()`. El sondeo emite `servicio:estado` cada 3000 ms solo cuando el estado cambia.
- [ ] Paso 1: una prueba que arma un `Nucleo` con plataforma y `fetch` falsos, crea un sitio estático, aplica y comprueba que se emitió `sitio:cambio`.
- [ ] Paso 2: correr la prueba y confirmar que falla.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr las pruebas y confirmar que pasan.
- [ ] Paso 5: commit `feat(core): fachada Nucleo`.

### Task 11: App de escritorio: base, IPC y bandeja

**Files:**
- Create: `apps/desktop/package.json` (dependencias: electron, electron-vite, vue, pinia, vue-router, naive-ui, @vicons/ionicons5, electron-builder), `electron.vite.config.ts` (`externalizeDepsPlugin({ exclude: ['@pel/core'] })`), `electron-builder.yml` (appId `com.johanvelez.entornolocal`, productName `Entorno Local`, NSIS por usuario sin admin), `src/main/index.ts`, `src/main/ipc.ts`, `src/main/bandeja.ts`, `src/preload/index.ts`, `src/shared/api.ts`, `resources/icono.png`
- Test: `apps/desktop/test/ipc.test.ts`

**Interfaces:**
- Produces:
  - `src/shared/api.ts`: `interface ApiEntorno` refleja los métodos del núcleo que usa la UI (`sitios.listar/crear/editar/borrar/aplicar`, `servicios.estados/iniciar/detener`, `instalador.listarVersiones/instalar/instalados`, `tuneles.abrir/cerrar/estados`, `hosts.estado/sincronizar`, `detectarProyecto`, `sistema.elegirCarpeta/abrirUrl/abrirCarpeta/copiar`) y `on(evento, fn)`.
  - El preload expone `window.entorno: ApiEntorno`.
  - `ipc.ts` define `registrarIpc(nucleo, ventana)`, que mapea el canal `entorno:<ruta>` → método y reenvía los eventos del núcleo con `webContents.send`. Los errores viajan como `{error: {mensaje, codigo}}`; nunca se envían trazas al renderer.
- Comportamiento:
  - Una sola instancia (`requestSingleInstanceLock`).
  - Cerrar la ventana la oculta y deja el programa en la bandeja.
  - El menú de la bandeja tiene "Abrir", "Iniciar todo", "Detener todo" y "Salir". Al salir se pregunta "¿Apagar los servicios?" y la respuesta por defecto es Sí.
  - `contextIsolation:true` y `sandbox:true`.
- [ ] Paso 1: prueba de `registrarIpc` con un `ipcMain` falso: una llamada a `entorno:sitios.listar` devuelve los sitios, y un error del núcleo llega como `{error:{mensaje}}`.
- [ ] Paso 2: correr la prueba y confirmar que falla.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr la prueba y confirmar que pasa. `npm run dev -w apps/desktop` abre la ventana sin errores en la consola.
- [ ] Paso 5: commit `feat(desktop): electron con ipc tipado, instancia única y bandeja`.

### Task 12: Interfaz: estructura, Inicio y Servicios

**Files:**
- Create: `apps/desktop/src/renderer/index.html`, `src/renderer/main.ts`, `App.vue` (barra lateral: Inicio, Sitios, Servicios, Túneles, Ajustes; tema según el sistema con `useOsTheme`), `i18n/es.ts`, `stores/servicios.ts`, `stores/sitios.ts`, `stores/tuneles.ts` (los stores se suscriben a los eventos y nunca piden refresco manual), `vistas/Inicio.vue`, `vistas/Servicios.vue`, `vistas/Ajustes.vue`, `componentes/EstadoPunto.vue`
- Test: `apps/desktop/test/stores.test.ts`

Comportamiento:
- **Servicios:** una tarjeta por servicio con su punto de estado (verde encendido, gris apagado, amarillo iniciando, rojo error, azul externo), versión y puertos, y un botón Encender o Apagar. "Instalar versión" abre un selector con `listarVersiones` y una barra de progreso.
- Los errores se muestran con `useNotification`, usando el mensaje claro del núcleo.
- **Inicio:** resumen con servicios encendidos, sitios, túneles activos y hosts pendientes (con el botón "Corregir hosts").
- **Ajustes:** carpeta de datos (solo lectura), puerto de Nginx, trabajadores PHP y versión del programa.
- [ ] Paso 1: prueba del store de servicios: un evento `servicio:estado` actualiza la tarjeta correspondiente sin llamar a `estados()`.
- [ ] Paso 2: correr la prueba y confirmar que falla.
- [ ] Paso 3: implementar.
- [ ] Paso 4: correr la prueba y confirmar que pasa.
- [ ] Paso 5: commit `feat(ui): estructura, inicio, servicios y ajustes`.

### Task 13: Interfaz: Sitios y Túneles

**Files:**
- Create: `apps/desktop/src/renderer/vistas/Sitios.vue`, `vistas/Tuneles.vue`, `componentes/FormSitio.vue`, `componentes/FilaSitio.vue`, `componentes/InterruptorTunel.vue`

Comportamiento:
- **Lista de sitios:** cada fila muestra punto de estado, dominio (enlace que abre `http://dominio`), tipo, PHP, la etiqueta "datos reales" si corresponde y ⚠ si el hosts está pendiente. Botones: Abrir, Carpeta y un menú `⋯` con Editar, Duplicar y Borrar (con confirmación). Debajo de cada fila va el `InterruptorTunel`: al encenderlo con `datosReales` se pide confirmación ("Este sitio tiene datos reales de clientes…"). Cuando está activo muestra la URL con los botones Abrir, Copiar y Renovar.
- **FormSitio:**
  1. Elegir carpeta (diálogo nativo).
  2. Se ejecuta `detectarProyecto` y se rellenan tipo, PHP, dominio y variable de URL base.
  3. Campos editables: alias, reglas extra (un textarea monoespaciado) y datos reales.
  4. Al guardar se ejecuta `aplicar()`. Si Nginx falla, se muestra su salida. Si el hosts queda pendiente, aparece un aviso persistente con "Reintentar con permiso" y "Ver instrucciones" (que muestra `comandoManual` con un botón Copiar).
- **Túneles:** tabla con todos los túneles (sitio, estado, URL y acciones).
- [ ] Paso 1: `npm run typecheck` y `npm run lint` terminan en verde.
- [ ] Paso 2: verificación manual en `npm run dev` (en la tarea 14 con binarios reales).
- [ ] Paso 3: commit `feat(ui): sitios con detección, aviso de hosts y túneles por sitio`.

### Task 14: Prueba real en Windows, empaquetado y README

**Files:**
- Create: `packages/core/test/integracion/windows.int.test.ts` (se ejecuta con `npm run test:win`; se salta fuera de win32): instala Nginx y PHP 8.4 reales en una carpeta temporal, con el puerto de Nginx en 8089 para no chocar. Crea un sitio estático y uno laravel mínimo (un `public/index.php` que hace echo) sin tocar hosts: el hosts se sustituye por una Plataforma envoltorio. Hace un `fetch` con la cabecera `Host` y espera 200 con el texto esperado. Después apaga todo.
- Modify: `README.md` (instalación, uso, transición desde FlyEnv: apagar su Nginx y que MySQL y PostgreSQL de FlyEnv aparecerán como "externo")
- [ ] Paso 1: `npm run test:win`: PASS.
- [ ] Paso 2: `npm run build -w apps/desktop` y `npx electron-builder --win` generan el instalador NSIS en `apps/desktop/release/`.
- [ ] Paso 3: prueba manual con los proyectos reales:
  1. Instalar Nginx, PHP 8.3, PHP 8.4 y cloudflared desde la interfaz.
  2. Crear wolfcore-coffe.test.
  3. Abrir el túnel y confirmar que la URL responde.
- [ ] Paso 4: commit `test: integración real en Windows; docs: README y empaquetado`.
