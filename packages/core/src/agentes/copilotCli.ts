import path from 'node:path';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * GitHub Copilot CLI (`@github/copilot`, GitHub; npm y WinGet en Windows, macOS y Linux; el
 * binario llega como dependencia opcional por plataforma, sin scripts). Configuración de usuario
 * en `~/.copilot/mcp-config.json`, sección `mcpServers`: `type: "http"`, `url` y `headers` con
 * `${VAR}` (ejemplo de la guía oficial de GitHub: "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}").
 *
 * Fuentes: docs.github.com (Copilot CLI, add-mcp-servers), github/copilot-cli (README) y la guía
 * install-copilot-cli.md de github/github-mcp-server. La expansión de `${VAR}` en cabeceras se
 * apoya en esa guía (la página de referencia no la describe): si el agente no la resolviera, la
 * cabecera llegaría con el texto literal y el MCP rechazaría la conexión; el token no se filtra.
 * No usa proveedores de IA externos (su inicio de sesión es el de GitHub).
 */
export const COPILOT_CLI: DefAgente = {
  id: 'copilot-cli',
  nombre: 'GitHub Copilot CLI',
  binario: 'copilot',
  paquete: '@github/copilot',
  scriptsInstalacion: false,
  // Exige Node 22 o superior (engines del paquete).
  nodeMinimo: 22,
  guia: 'https://docs.github.com/en/copilot/how-tos/copilot-cli',
  formato: 'json',
  seccion: 'mcpServers',
  soportaMcp: true,
  archivoConfig: (inicio) => path.join(inicio, '.copilot', 'mcp-config.json'),
  carpetasConocidas: () => [],
  entradaMcp: (url) => ({
    type: 'http',
    url,
    headers: { Authorization: `Bearer \${${VARIABLE_TOKEN_MCP}}` },
    // Todas las herramientas del servidor (lo que pone `copilot mcp add` por defecto).
    tools: ['*'],
  }),
  variablesClave: () => null,
};
