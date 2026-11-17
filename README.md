# Entorno Local

Entorno Local es un reemplazo propio de FlyEnv y ServBay, para uso personal. Es una aplicación de escritorio (Electron + Vue 3 + TypeScript) que administra un entorno de desarrollo local: Nginx, varias versiones de PHP, dominios `.test` y túneles de Cloudflare.

El repositorio se llama `Proyectoentornolocal`. El diseño completo está en `docs/superpowers/specs/2026-11-17-proyectoentornolocal-design.md`.

## Estructura

- `packages/core` (`@pel/core`): lógica en TypeScript puro, sin Electron.
- `apps/desktop`: la aplicación de escritorio (se agrega en el MVP).

## Instalación y pruebas

Requiere Node 22 o superior y npm.

```bash
npm install
npm test            # pruebas de todos los paquetes
npm run lint        # ESLint y Prettier
npm run typecheck   # TypeScript estricto
```

## Estado por fase

| Fase | Contenido                                                     | Estado      |
| ---- | ------------------------------------------------------------- | ----------- |
| 0    | Base: repositorio, monorepo, lint, pruebas, CI y diseño       | En progreso |
| 1    | MVP en Windows: Nginx, PHP, sitios, hosts, túneles e interfaz | En progreso |
| 2    | Datos: MySQL, PostgreSQL, Redis, Composer y visor de logs     | Pendiente   |
| 3    | Integración: túneles con nombre, MCP, Node, Python, CLI y más | Pendiente   |
| 4    | Multiplataforma: macOS y Linux                                | Pendiente   |
| 5    | Extras: Ollama y más servicios del catálogo                   | Pendiente   |

## Licencia

MIT. FlyEnv (BSD-3) y ServBay se usaron solo como referencia de producto; no se copió código de ninguno de los dos.
