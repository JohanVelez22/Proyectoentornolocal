# Entorno Local

Entorno Local es un reemplazo propio de FlyEnv y ServBay, para uso personal. Es una aplicación de escritorio (Electron + Vue 3 + TypeScript) que administra un entorno de desarrollo local en Windows: Nginx, varias versiones de PHP, dominios `.test` y túneles de Cloudflare.

El repositorio se llama `Proyectoentornolocal`. El diseño completo está en `docs/superpowers/specs/2026-11-17-proyectoentornolocal-design.md`.

## Qué trae el MVP (fase 1, Windows)

- **Servicios:** instala Nginx, PHP (NTS x64, varias ramas a la vez) y cloudflared desde sus fuentes oficiales (nginx.org, windows.php.net y GitHub), verificando el SHA-256 antes de usarlos. Los enciende, los apaga y los vigila: un servicio está "encendido" solo si su proceso vive y su puerto responde. Si se caen, se reinician con espera creciente.
- **PHP por sitio:** cada rama corre como `php-cgi.exe -b 127.0.0.1:<puerto>` con 2 trabajadores (8.3 → 9830/9831, 8.4 → 9840/9841), sin chocar con los puertos 908x de FlyEnv.
- **Sitios `.test`:** detecta Laravel, CodeIgniter 3, estático, proxy (Vite, FastAPI, Node…) o personalizado. Genera el vhost con reglas de seguridad (bloqueo de `.env`, archivos ocultos y carpetas internas de CodeIgniter) y valida con `nginx -t` antes de recargar. Las rutas con espacios y tildes funcionan.
- **Archivo hosts:** escribe solo su propio bloque (`# >>> Proyectoentornolocal`), pide permiso de administrador una vez por cambio y, si se cancela, ofrece el comando para pegar a mano. Avisa si un dominio ya estaba fuera del bloque (por ejemplo, escrito por FlyEnv).
- **Túneles rápidos de Cloudflare:** un interruptor por sitio abre `https://…trycloudflare.com` hacia el sitio, cambia la variable de URL base del `.env` mientras está abierto y la restaura al cerrarlo.
- **Reapertura segura:** al reabrir la aplicación con servicios corriendo, los reutiliza por PID y ejecutable en lugar de duplicarlos.
- **Bases de datos externas:** MySQL (3306) y PostgreSQL (5432) que ya estén corriendo aparecen como "externo".

Los datos viven en `%LOCALAPPDATA%\Proyectoentornolocal` (`bin/`, `etc/`, `logs/`, `run/` y `config.json`). Los proyectos nunca se mueven ni se borran.

## Requisitos

- Windows 10 u 11 de 64 bits.
- Para desarrollar: Node 22.12 o superior y npm.
- Conexión a internet para descargar los binarios y para los túneles.

## Estructura

- `packages/core` (`@pel/core`): lógica en TypeScript puro, sin Electron (catálogo, instalador, supervisor de procesos, Nginx, PHP, sitios, hosts y túneles).
- `apps/desktop` (`@pel/desktop`): la aplicación de escritorio (Electron + Vue 3 + Naive UI).

## Desarrollo

```bash
npm install
npm run dev         # abre la aplicación con recarga en caliente
npm run lint        # ESLint y Prettier
npm run typecheck   # TypeScript estricto
```

## Pruebas

```bash
npm test            # pruebas unitarias de todos los paquetes (sin red ni procesos reales)
npm run test:win    # prueba de integración real en Windows
```

`npm run test:win` descarga Nginx, PHP 8.4 y cloudflared oficiales en una carpeta temporal, levanta Nginx en el puerto **8089** (para no chocar con otro Nginx en el 80), crea un sitio estático, uno Laravel en una carpeta con espacio y "Ñ" y uno CodeIgniter 3, y comprueba las respuestas reales y las reglas de seguridad. También abre un túnel rápido y pide la URL pública (si Cloudflare no responde, ese paso se marca como omitido). No toca el archivo hosts del sistema ni pide permiso de administrador, y al final apaga todo y borra la carpeta temporal. Tarda unos minutos y fuera de Windows se omite.

## Instalador

```bash
npm run dist:win -w @pel/desktop
```

Genera el instalador NSIS en `apps/desktop/release/` (`Entorno Local Setup <versión>.exe`). El instalador es por usuario y permite elegir la carpeta. No está firmado, así que Windows SmartScreen puede pedir confirmación la primera vez.

## Transición desde FlyEnv

1. **Puerto 80:** Entorno Local usa el puerto 80 para Nginx. Si el Nginx de FlyEnv está encendido, apáguelo desde FlyEnv para liberar el puerto. Si prefiere mantener los dos, cambie el puerto de Nginx en **Ajustes** (por ejemplo, 8080). Si el puerto está ocupado, el error dice qué programa lo usa y su PID.
2. **PHP:** no hay conflicto. FlyEnv usa los puertos 908x y Entorno Local usa 98xx.
3. **Bases de datos:** mientras llega la fase 2, MySQL y PostgreSQL siguen siendo los de FlyEnv. Aparecen en Servicios como **"externo"**, sin botones de encender o apagar.
4. **Archivo hosts:** si FlyEnv ya escribió los mismos dominios, se conservan y la aplicación lo avisa. Puede quitarlos de FlyEnv cuando ya no lo use.
5. **Sitios:** se crean de nuevo en **Sitios → Nuevo**, eligiendo la carpeta del proyecto. El tipo se detecta solo.

## Hoja de ruta

| Fase | Contenido                                                                                                                               | Estado    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 0    | Base: repositorio, monorepo, lint, pruebas, CI y diseño                                                                                 | Hecha     |
| 1    | MVP en Windows: Nginx, PHP, sitios, hosts, túneles rápidos e interfaz                                                                   | Hecha     |
| 2    | Datos: MySQL, PostgreSQL con pgvector, Redis, módulo de bases de datos, Composer por versión de PHP, visor de logs                      | Pendiente |
| 3    | Integración: túneles con nombre, servidor MCP, Node y Python, CLI `pel`, importar sitios de FlyEnv, HTTPS local, contenedores y MailPit | Pendiente |
| 4    | Multiplataforma: macOS y Linux (php-fpm, instaladores dmg y AppImage, CI)                                                               | Pendiente |
| 5    | Extras: Ollama y modelos locales, más servicios del catálogo                                                                            | Pendiente |

## Licencia

MIT. FlyEnv (BSD-3) y ServBay se usaron solo como referencia de producto; no se copió código de ninguno de los dos.
