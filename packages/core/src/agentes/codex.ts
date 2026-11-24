import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { NOMBRE_ENTRADA_MCP, VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Codex CLI (`@openai/codex`). Configuración en `~/.codex/config.toml` (`[mcp_servers.<id>]`
 * con `url` y `bearer_token_env_var`: el token se lee de la variable, nunca queda escrito).
 */
export const CODEX: DefAgente = {
  id: 'codex',
  nombre: 'Codex CLI',
  binario: 'codex',
  paquete: '@openai/codex',
  // Sin scripts de instalación (el binario llega como dependencia opcional por plataforma).
  scriptsInstalacion: false,
  guia: 'https://developers.openai.com/codex/cli',
  soportaMcp: true,
  formato: 'toml',
  seccion: 'mcp_servers',
  archivoConfig: (inicio) => path.join(inicio, '.codex', 'config.toml'),
  carpetasConocidas: () => [],
  entradaMcp: (url) => ({ url, bearer_token_env_var: VARIABLE_TOKEN_MCP }),
  argsRegistrar: (url) => [
    'mcp',
    'add',
    NOMBRE_ENTRADA_MCP,
    '--url',
    url,
    '--bearer-token-env-var',
    VARIABLE_TOKEN_MCP,
  ],
  argsQuitar: () => ['mcp', 'remove', NOMBRE_ENTRADA_MCP],
  variablesClave: (p, clave) => {
    // El proveedor por defecto de Codex es el de OpenAI; los compatibles, por su URL base.
    if (p.tipo === 'openai') {
      const env: Record<string, string> = { OPENAI_API_KEY: clave };
      if (p.urlBase !== null) env.OPENAI_BASE_URL = urlBaseDe(p);
      return env;
    }
    if (p.tipo === 'compatible' || p.tipo === 'hermes') {
      return { OPENAI_API_KEY: clave, OPENAI_BASE_URL: urlBaseDe(p) };
    }
    return null;
  },
};
