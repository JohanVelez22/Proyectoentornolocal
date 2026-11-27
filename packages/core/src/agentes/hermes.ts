import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Hermes Agent (Nous Research). Su instalador oficial es un script remoto (`install.ps1` /
 * `install.sh`) sin huella publicada que no se puede fijar: WolfCore Dev no lo ejecuta; solo lo
 * detecta y enlaza a la guía oficial. Configuración en `~/.hermes/config.yaml` (`mcp_servers`,
 * cabeceras con `${VAR}` que Hermes resuelve al conectar). No tiene un `mcp add` general: el
 * registro es por archivo.
 */
export const HERMES: DefAgente = {
  id: 'hermes',
  nombre: 'Hermes Agent',
  binario: 'hermes',
  paquete: null,
  scriptsInstalacion: false,
  guia: 'https://hermes-agent.nousresearch.com/docs/getting-started/installation',
  soportaMcp: true,
  formato: 'yaml',
  seccion: 'mcp_servers',
  archivoConfig: (inicio) => path.join(inicio, '.hermes', 'config.yaml'),
  carpetasConocidas: (inicio) => [path.join(inicio, '.local', 'bin')],
  entradaMcp: (url) => ({
    url,
    headers: { Authorization: `Bearer \${${VARIABLE_TOKEN_MCP}}` },
  }),
  variablesClave: (p, clave): Record<string, string> | null => {
    switch (p.tipo) {
      case 'hermes':
        return { NOUS_API_KEY: clave };
      case 'openai':
        return { OPENAI_API_KEY: clave };
      case 'anthropic':
        return { ANTHROPIC_API_KEY: clave };
      case 'gemini':
        return { GEMINI_API_KEY: clave, GOOGLE_API_KEY: clave };
      case 'compatible':
        return { OPENAI_API_KEY: clave, OPENAI_BASE_URL: urlBaseDe(p) };
      default:
        return null;
    }
  },
};
