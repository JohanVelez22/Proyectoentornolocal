import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Opencode (`opencode-ai`, paquete oficial; npm en Windows, macOS y Linux). Configuración global
 * en `~/.config/opencode/opencode.json` (también se admite JSONC); servidor remoto en
 * `mcp.<nombre>` con `type: "remote"`, `url` y `headers`, y `{env:VAR}` para tomar el valor de
 * una variable de entorno (el token nunca queda escrito).
 *
 * Fuentes: opencode.ai/v1/docs/mcp-servers y opencode.ai/v1/docs/config. La V2 de Opencode
 * agrupa los servidores en `mcp.servers`, pero reconoce también los miembros de la V1 dentro de
 * `mcp` (guía de migración); el paquete `opencode-ai` (latest) sigue en V1.
 */
export const OPENCODE: DefAgente = {
  id: 'opencode',
  nombre: 'Opencode',
  binario: 'opencode',
  paquete: 'opencode-ai',
  // Su `postinstall` deja el binario nativo de la plataforma: sin él no funciona.
  scriptsInstalacion: true,
  guia: 'https://opencode.ai/docs/',
  formato: 'json',
  seccion: 'mcp',
  soportaMcp: true,
  archivoConfig: (inicio) => path.join(inicio, '.config', 'opencode', 'opencode.json'),
  archivosConfigExtra: (inicio) => [path.join(inicio, '.config', 'opencode', 'opencode.jsonc')],
  carpetasConocidas: (inicio) => [path.join(inicio, '.opencode', 'bin')],
  entradaMcp: (url) => ({
    type: 'remote',
    url,
    // Sin OAuth: la autenticación es la cabecera con el token (si no, probaría un inicio de sesión).
    oauth: false,
    headers: { Authorization: `Bearer {env:${VARIABLE_TOKEN_MCP}}` },
  }),
  variablesClave: (p, clave) => {
    // Sus proveedores propios leen las variables estándar de cada fabricante.
    if (p.tipo === 'anthropic') {
      const env: Record<string, string> = { ANTHROPIC_API_KEY: clave };
      // Su ANTHROPIC_BASE_URL lleva la versión (`/v1`): se agrega si falta.
      if (p.urlBase !== null) env.ANTHROPIC_BASE_URL = urlBaseDe(p).replace(/(?<!\/v1)$/, '/v1');
      return env;
    }
    if (p.tipo === 'openai') {
      const env: Record<string, string> = { OPENAI_API_KEY: clave };
      if (p.urlBase !== null) env.OPENAI_BASE_URL = urlBaseDe(p);
      return env;
    }
    return null;
  },
};
