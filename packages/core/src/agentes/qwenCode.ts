import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Qwen Code (`@qwen-code/qwen-code`, Qwen; npm en Windows, macOS y Linux). Configuración de
 * usuario en `~/.qwen/settings.json`, sección `mcpServers` con `httpUrl` y `headers`; los textos
 * del archivo admiten `$VAR` y `${VAR}` (se resuelven al cargar): el token no se escribe.
 *
 * Fuentes: qwenlm.github.io/qwen-code-docs (users/features/mcp) y docs/users/configuration/
 * settings.md del repositorio QwenLM/qwen-code.
 */
export const QWEN_CODE: DefAgente = {
  id: 'qwen-code',
  nombre: 'Qwen Code',
  binario: 'qwen',
  paquete: '@qwen-code/qwen-code',
  scriptsInstalacion: false,
  guia: 'https://github.com/QwenLM/qwen-code#installation',
  formato: 'json',
  seccion: 'mcpServers',
  soportaMcp: true,
  archivoConfig: (inicio) => path.join(inicio, '.qwen', 'settings.json'),
  carpetasConocidas: () => [],
  entradaMcp: (url) => ({
    httpUrl: url,
    headers: { Authorization: `Bearer \${${VARIABLE_TOKEN_MCP}}` },
  }),
  variablesClave: (p, clave) => {
    if (p.tipo === 'openai') {
      const env: Record<string, string> = { OPENAI_API_KEY: clave };
      if (p.urlBase !== null) env.OPENAI_BASE_URL = urlBaseDe(p);
      return env;
    }
    if (p.tipo === 'compatible') return { OPENAI_API_KEY: clave, OPENAI_BASE_URL: urlBaseDe(p) };
    return null;
  },
};
