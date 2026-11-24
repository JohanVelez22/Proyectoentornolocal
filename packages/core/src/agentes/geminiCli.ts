import path from 'node:path';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Gemini CLI (`@google/gemini-cli`, Google, Apache-2.0; npm en Windows, macOS y Linux).
 * Configuración de usuario en `~/.gemini/settings.json`, sección `mcpServers`: `httpUrl` para
 * Streamable HTTP y `headers`. Los valores de texto del archivo admiten `$VAR` y `${VAR}` y se
 * resuelven al cargar la configuración, así que el token nunca queda escrito.
 *
 * Fuentes: github.com/google-gemini/gemini-cli (docs/tools/mcp-server.md y
 * docs/reference/configuration.md). Google lo reemplaza por Antigravity CLI para el nivel
 * gratuito (aviso en su documentación): sigue publicado y funcionando para quien lo usa.
 */
export const GEMINI_CLI: DefAgente = {
  id: 'gemini-cli',
  nombre: 'Gemini CLI',
  binario: 'gemini',
  paquete: '@google/gemini-cli',
  // Paquete empaquetado (`bundle/gemini.js`), sin scripts de instalación.
  scriptsInstalacion: false,
  guia: 'https://github.com/google-gemini/gemini-cli#installation',
  formato: 'json',
  seccion: 'mcpServers',
  soportaMcp: true,
  archivoConfig: (inicio) => path.join(inicio, '.gemini', 'settings.json'),
  carpetasConocidas: () => [],
  entradaMcp: (url) => ({
    httpUrl: url,
    headers: { Authorization: `Bearer \${${VARIABLE_TOKEN_MCP}}` },
  }),
  variablesClave: (p, clave) => (p.tipo === 'gemini' ? { GEMINI_API_KEY: clave } : null),
};
