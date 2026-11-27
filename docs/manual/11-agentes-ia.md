# 11 · Agentes e IA

## Para qué sirve

La pantalla **IA** reúne en tres pestañas todo lo relacionado con inteligencia artificial: gestionar **Agentes** de programación en terminal conectados al servidor MCP de WolfCore Dev, configurar proveedores de **IA en la nube** con claves cifradas y ejecutar modelos locales sin conexión con **Ollama**.

## Paso a paso

### 1. Instalar, registrar y abrir Agentes de IA (`IA → Agentes`)

1. Abra **IA** en la barra lateral y seleccione la pestaña **Agentes** (también accesible desde `Ctrl+K` escribiendo `Agentes`, o desde el menú `…` → **Abrir agente** en cualquier tarjeta de proyecto).
2. WolfCore Dev detecta agentes compatibles (**Claude Code**, **Codex CLI**, **Hermes Agent**, **Opencode**, **Gemini CLI**, **Qwen Code**, **GitHub Copilot CLI** y **Antigravity CLI**) indicando si están instalados, su origen (propio, npm global o sistema) y si el MCP está registrado.
3. Si desea instalar un agente soportado por npm, pulse **Instalar** y confirme: se instala aislado con el Node de WolfCore Dev en su carpeta de datos, sin tocar su npm global. Para los que no tienen instalador con huella fija, pulse **Guía de instalación**.
4. Para conectar el agente con sus sitios, servicios y bases de datos, pulse **Registrar MCP** y confirme:
   - WolfCore Dev solo añade o actualiza la entrada `wolfcore` en el archivo de configuración del agente, guardando antes una copia con fecha (`<archivo>.wolfcore-AAAAMMDD-HHmmss.bak`, conserva las 5 últimas).
   - **El token del MCP nunca se escribe en archivos**: viaja únicamente en la variable de entorno `WOLFCORE_MCP_TOKEN` de la terminal que abre WolfCore Dev.
5. Pulse **Abrir en un proyecto**, elija el **Proyecto** y opcionalmente un **Proveedor de IA** con clave guardada, y pulse **Abrir terminal**. La primera vez aparece un aviso de costo recordando que un agente consume tokens de su cuenta y puede leer/modificar archivos y ejecutar comandos. **WolfCore Dev nunca abre un agente solo.**

[CAPTURA: Pantalla IA en la pestaña Agentes mostrando las tarjetas de Claude Code, Codex CLI y Opencode con botones Registrar MCP y Abrir en un proyecto]

### 2. Activar y controlar el Servidor MCP (`Ajustes → Servidor MCP`)

1. Vaya a **Ajustes → Servidor MCP** y pulse **Activar** (escucha únicamente en `http://127.0.0.1:7790/mcp`, puerto configurable).
2. Use **Copiar configuración para Claude Code** si desea pegarla manualmente, o **Regenerar token** para invalidar al instante el token anterior.
3. Cuando un agente conectado por MCP intenta realizar una acción delicada (borrar o restaurar una base, correr una receta, finalizar un proceso o limpiar volcados), aparece un diálogo modal **Un asistente pide confirmación** en WolfCore Dev con botones **Aprobar** y **Rechazar**.

### 3. Configurar proveedores de IA en la nube (`IA → IA en la nube`)

1. En **IA**, abra la pestaña de proveedores en la nube y pulse **Agregar proveedor**.
2. Elija entre **OpenAI**, **Anthropic**, **Gemini**, **Hermes** (Nous Research) o un preset **compatible con OpenAI** (como OpenRouter, Groq, LM Studio, Kilo, OmniRouter o FreeLLMAPI).
3. Escriba su clave API: se guarda cifrada con `safeStorage` en `etc/secretos/` (nunca en `config.json`, URLs ni registros; la interfaz solo muestra los 4 últimos caracteres).
4. Pulse **Probar conexión** (gratis: lista modelos y mide latencia; permite filtrar modelos gratuitos) o **Probar un mensaje** (pide confirmación previa porque consume tokens).
5. Pulse **Usar en un proyecto** para escribir el bloque `.env` del proveedor (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `AI_MODEL`, etc.) con vista previa enmascarada, copia previa y protección de `.gitignore`.

### 4. Usar IA local con Ollama (`IA → IA local`)

1. Instale **Ollama** desde **Servicios** y enciéndalo (corre solo en `127.0.0.1:11434`, con modelos en `data/ollama/actual/models`).
2. En **IA**, abra la pestaña de IA local.
3. Elija una sugerencia (`llama3.2`, `qwen2.5-coder`, `mistral`, `nomic-embed-text`) o escriba el nombre del modelo y pulse **Descargar** (los modelos pueden ocupar de 1 a más de 40 GB).
4. Pruebe cualquier modelo instalado con un mensaje desde la sección de prueba o copie los datos de conexión (`http://127.0.0.1:11434` y el endpoint compatible con OpenAI `http://127.0.0.1:11434/v1`).

### 5. Mensajes de commit sugeridos con IA

En el panel Git de cualquier tarjeta en **Proyectos**, puede pedir una sugerencia de mensaje de commit con un proveedor configurado: WolfCore Dev envía únicamente el `git diff --cached` (excluyendo `.env*`, claves y binarios, hasta 20 000 caracteres) y le deja editar el texto antes de confirmar. **Hacer commit** nunca ejecuta `git add` ni `git push`.

## Ejemplo

Quiere usar Claude Code en `mi-tienda.test` con acceso controlado a los logs y bases locales de WolfCore Dev:

1. Active el **Servidor MCP** en **Ajustes → Servidor MCP**.
2. Vaya a **IA → Agentes**, pulse **Registrar MCP** en la tarjeta de **Claude Code** y confirme.
3. Pulse **Abrir en un proyecto**, seleccione `mi-tienda` y pulse **Abrir terminal**.
4. Cuando Claude Code pida consultar logs o estado, responde de inmediato; si pide correr una receta o restaurar una base, usted aprueba o rechaza desde la ventana de WolfCore Dev.

## Si algo falla

- **El agente ve la entrada `wolfcore` pero no puede conectarse al MCP:** ocurrió porque abrió el agente desde una terminal externa. Ábralo desde **IA → Agentes → Abrir en un proyecto** para que reciba `WOLFCORE_MCP_TOKEN`, y verifique que el **Servidor MCP** esté activo en **Ajustes**.
- **Aviso de que un archivo del agente traía el token escrito:** WolfCore Dev limpió el token en texto plano y lo enmascaró (`***`) en la copia de respaldo. Vaya a **Ajustes → Servidor MCP** y pulse **Regenerar token**.
- **Un agente dice que no soporta registro automático de MCP:** su documentación no admite tomar el token desde una variable de entorno; WolfCore Dev nunca escribe el token en archivos.
- **Al cambiar la URL base de un proveedor de IA aparece una confirmación extra:** es una protección para evitar que su clave guardada se envíe por accidente a otro servidor.
