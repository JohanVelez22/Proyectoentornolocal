# Cómo continuar WolfCore Dev

Este documento sirve para retomar el proyecto en otro equipo, con otra herramienta o con otra persona. Resume el estado al 2026-11-28, las reglas de trabajo y lo que falta.

## 1. Estado actual

- **Rama de trabajo:** `feat/etapa-c`. La rama `main` está en `8eac050` («Etapa D: entorno completo…», D1–D52), que es la última fusión aprobada por el usuario.
- **Etapa D cerrada en `feat/etapa-c`:**
  - D53 (red y NTLM), D54a/D54b (memoria, interfaz, pgvector multibase), D54c (segunda pasada de diseño), D54d (fuente única de problemas, caché de discos, «Iniciar todo»), D55–D58 (rendimiento, salud de discos, asistentes MCP).
  - CI en verde en los 6 trabajos (Windows, Linux y macOS × verificar y empaquetado) en el último commit de cada tanda.
  - Nota de diseño de la interfaz: 7,5/10 (segunda pasada, 2026-11-28), frente a 6,5 en la primera.
- **Fusión a `main`:** pendiente. Solo la aprueba el usuario.
- **Plataforma:** solo Windows. El CI corre en los 3 sistemas para que el código siga siendo portable, pero la app solo arranca en Windows (`crearPlataforma` lanza «Plataforma aún no soportada» en los demás).

### Pendiente con el usuario (pruebas reales)

Estas pruebas no se pueden automatizar o necesitan su presencia:

- Confirmar los avisos de UAC.
- Primer túnel real con ngrok («Conectar su cuenta» con su token) y «Dejar de compartir».
- Instalar la versión nueva sobre sus datos reales.
- Escanear «Mi red»: antes, cambiar el perfil de la Wi-Fi de Pública a Privada.
- Prueba de velocidad real.
- Lectura con administrador de la salud de discos (D57).
- Revisar la unidad D: (58 eventos de NTFS, ID 55, del 2026-11-15); hoy no está conectada.
- Repetir el borrado de un sitio real (pide UAC).
- Cancelar el aviso viejo del cortafuegos para nginx.
- Borrar las carpetas vacías `C:\wc-tmp-d52` y `C:\wc-d40`.

## 2. Cómo empezar en otro equipo

1. Instale Node.js 22.12 o posterior y Git.
2. Clone el repositorio y cambie a la rama de trabajo:

   ```powershell
   git clone https://github.com/JohanVelez22/Proyectoentornolocal.git
   ```

   ```powershell
   git -C Proyectoentornolocal switch feat/etapa-c
   ```

3. Instale dependencias desde la raíz: `npm ci`.
4. Verifique que todo pasa:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
   - `node scripts/i18n-faltantes.mjs` (debe dar 0 faltantes en los 16 idiomas)
5. Arranque en desarrollo: `npm run dev`.
6. Para no tocar datos reales en pruebas manuales, defina `WOLFCORE_DATOS` con una carpeta temporal fuera de `%LOCALAPPDATA%`.

Las pruebas de integración de pgvector (`npm run test:win:pgvector`) compilan pgvector y necesitan Visual Studio Build Tools (unos 6 GB).

## 3. Reglas de trabajo

### Proceso

- TDD y commits pequeños. Todo en español.
- Antes de cada push, la cadena completa, en este orden: lint → typecheck → test → `i18n-faltantes` → nada ajeno preparado → push → CI en los 6 trabajos. Si un paso falla, se para.
- `git add` siempre con rutas explícitas.
- Revisión de seguridad independiente para todo lo que toque seguridad, red, permisos de administrador o configuración de programas de terceros.
- Capturas de las vistas tocadas, en claro y oscuro, y en un idioma largo (de o ru) para detectar textos que desbordan.
- Nada de fusionar a `main` sin aprobación explícita del usuario.

### Seguridad y datos (no negociables)

- El repositorio es **público**: nunca suba `.env`, respaldos, datos de clientes ni claves reales.
- Los tokens y secretos nunca van en configuración, URLs ni registros, y nunca se imprimen.
- La carpeta de datos real es `%LOCALAPPDATA%\WolfCoreDev`: ninguna prueba la usa.
- Nunca detener, matar ni reconfigurar procesos de FlyEnv. Los procesos se matan solo si son propios y por PID, nunca por nombre de imagen.
- Las pruebas no tocan el archivo hosts real, el almacén de certificados ni el PATH del usuario, y no abren ventanas reales del sistema.
- Los servicios nuevos escuchan solo en 127.0.0.1. Nada de reglas de cortafuegos reales.
- Las acciones destructivas exigen `confirmado === true` en el núcleo, no solo en la interfaz.
- Los errores salen del catálogo (`ErrorWolf` con código) y se traducen en los 16 idiomas.

### Código

- Sin `process.platform` en `packages/core` fuera de `plataforma/`; el guardián de pruebas lo detecta.
- El renderer no importa nada de Node. El IPC se valida en `apps/desktop/src/main/validacion.ts` con claves cerradas.
- Ejecutables del sistema por ruta absoluta de System32, a partir de `raizSistema` (validada). `winget` solo desde `%LOCALAPPDATA%\Microsoft\WindowsApps`.
- En procesos elevados: nada de `Add-Type` (se usa P/Invoke con Reflection.Emit, `pinvokeWin.ts`) y nada de escritura en `%TEMP%`. Para literales de PowerShell se usa `literalPowerShell`.
- Configuración de programas de terceros: vista previa, respaldo, escritura atómica y fusión solo de la entrada de WolfCore. Nunca se escriben tokens.
- Textos en 16 idiomas: es, en, pt y fr en sus propios archivos; los otros 12 en `apps/desktop/src/renderer/i18n/extra/<id>.ts`, con trato formal («usted», «vous»). La palabra «rama» solo en textos de Git.

### 3.1 Archivos protegidos

`packages/core/src/plataforma/unidadesWin.ts` no se añade nunca a un commit.

El 2026-11-28 el usuario levantó la protección de los otros 7 archivos (`Inicio.vue`, `PanelRendimiento.vue`, `TarjetaDisco.vue`, `Regex.vue`, `stores/servicios.ts`, `utilidades/disco.ts` y `utilidades/herramientas.ts`). Ya se editan con normalidad, revisando con `git diff` antes de cada `git add` que solo lleven cambios propios.

## 4. Lo que falta

### 4.1 Hecho en D54d (2026-11-28)

- Inicio, la pastilla de la cabecera y la campana leen los problemas de una sola fuente (`stores/problemas.ts`). En Inicio, «Problemas detectados» tiene su propio bloque antes de «Rendimiento».
- El distintivo de memoria alta va dentro de la cabecera del gráfico de RAM.
- La caché de unidades vive en `stores/metricas.ts`: caduca a los 5 minutos, las consultas simultáneas comparten una lectura y los fallos no se guardan.
- «Iniciar todo» y el contador «por arrancar» usan el mismo criterio del núcleo (`Servicios.porArrancar()`), con el mismo orden de arranque y el mismo manejo de errores, probado. Ahora el contador incluye también los servicios con inicio automático (por ejemplo, Mailpit) y los procesos de proyecto.

### 4.2 Etapa F (solo Windows, primero)

Del plan de etapas (`docs/superpowers/roadmap/2026-11-19-plan-etapas.md`) más lo que salió de la Etapa D:

- **Interfaz:**
  - ancho de vista único a 1600 px;
  - índice fijo en Ajustes;
  - aplicar `AvisoPlegable` al resto de avisos largos;
  - «sin instalar» repetido en las tarjetas de Herramientas;
  - separador «·» del disco en los idiomas distintos del inglés (se ve «C: · 382 GB libres»);
  - el aviso «No hay servicios instalados que encender» del botón «Iniciar todo», que ahora también cuenta procesos de proyecto;
  - pruebas con DOM de los plegables.
- **Funciones anotadas:**
  - puente `wolf mcp` por stdio;
  - diagrama de bases al estilo DBeaver;
  - botón «Actualizar a 8.3.x» de PHP;
  - idiomas vi, th, sv, cs, ro y el;
  - WSL, Sandbox, grabación de terminal, Oh My Posh;
  - instalador de reglas y vídeos de guía;
  - texto del motivo de CPU en «ram-justo» (D55);
  - Job Object para cloudflared;
  - `Metricas.inactividadMs`, que no se usa.
- **Del plan original:**
  - DNS propio y comodín `*.proyecto.test`;
  - Apache/Caddy y `.htaccess`;
  - FrankenPHP/Octane;
  - contenedores;
  - Meilisearch, RabbitMQ y Reverb;
  - inspectores de SQL, jobs, HTTP y webhooks;
  - perfilado;
  - rama como subdominio con `git worktree`;
  - WordPress completo;
  - pruebas por sitio;
  - arranque perezoso;
  - modo portable;
  - sincronizar entre equipos;
  - RAG local con pgvector;
  - restos técnicos de la CA, FTP y restauración.
- **Sin probar todavía:**
  - pgvector multibase y herencia desde `template1` contra un PostgreSQL real;
  - revisión nativa de los textos nuevos en los 14 idiomas no base.

### 4.3 Etapa E (multiplataforma, al final)

Aplazada por decisión del usuario (2026-11-26). El desglose está en el plan de etapas:

- **Beta (unas 12–15 h):**
  - `PlataformaLinux` y `PlataformaMac` mínimas, sin elevación y con `*.localhost`;
  - catálogo por sistema y arquitectura;
  - AppImage y `.dmg` en CI;
  - `safeStorage` en Linux.
- **Completa (unas 35–45 h):**
  - elevación y hosts;
  - CA automática;
  - puertos 80/443;
  - `.deb`;
  - autoactualización;
  - desinstalación limpia;
  - pgvector con `make`.

Linux solo se puede probar a medias en WSL2. macOS, solo en CI.

## 5. Dónde está cada cosa

- **Diseños por etapa:** `docs/superpowers/specs/`.
- **Planes:** `docs/superpowers/plans/` (Etapa D: `2026-11-24-etapa-d.md`).
- **Auditorías:** `docs/superpowers/auditorias/`, entre ellas `2026-11-27-diseno-ui.md`.
- **Manual de usuario:** `docs/manual/` (índice en `00-indice.md`) y notas de versión en `docs/manual/notas-version-etapa-d.md`.
- **Código:**
  - `packages/core`: núcleo, detrás de `Nucleo`; la capa `plataforma/` es lo único que depende del sistema.
  - `apps/desktop`: Electron (main y renderer, con Vue 3, Naive UI y Pinia).
  - La CLI `wolf` es un cliente que la app copia a su carpeta de datos y que habla con el servidor local de órdenes de `apps/desktop` (ver `docs/manual/12-cli-wolf.md`).
- **CI:** `.github/workflows/ci.yml`.
