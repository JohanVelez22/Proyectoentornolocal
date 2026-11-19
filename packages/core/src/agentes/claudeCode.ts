import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { NOMBRE_ENTRADA_MCP, VARIABLE_TOKEN_MCP } from './configArchivo';

/** Cabecera con el token por variable: Claude Code expande `${VAR}` al conectar. */
const CABECERA = `Authorization: Bearer \${${VARIABLE_TOKEN_MCP}}`;

/**
 * Claude Code (`@anthropic-ai/claude-code`). Configuración del usuario en `~/.claude.json`
 * (`mcpServers`, ámbito "user"); registro con `claude mcp add --scope user`.
 */
export const CLAUDE_CODE: DefAgente = {
  id: 'claude-code',
  nombre: 'Claude Code',
  binario: 'claude',
  paquete: '@anthropic-ai/claude-code',
  guia: 'https://docs.anthropic.com/en/docs/claude-code/setup',
  formato: 'json',
  seccion: 'mcpServers',
  archivoConfig: (inicio) => path.join(inicio, '.claude.json'),
  // Instalador nativo (~/.local/bin) e instalación local antigua (~/.claude/local).
  carpetasConocidas: (inicio) => [
    path.join(inicio, '.local', 'bin'),
    path.join(inicio, '.claude', 'local'),
  ],
  entradaMcp: (url) => ({
    type: 'http',
    url,
    headers: { Authorization: `Bearer \${${VARIABLE_TOKEN_MCP}}` },
  }),
  argsRegistrar: (url) => [
    'mcp',
    'add',
    '--transport',
    'http',
    '--scope',
    'user',
    NOMBRE_ENTRADA_MCP,
    url,
    '--header',
    CABECERA,
  ],
  argsQuitar: () => ['mcp', 'remove', '--scope', 'user', NOMBRE_ENTRADA_MCP],
  variablesClave: (p, clave) => {
    if (p.tipo !== 'anthropic') return null;
    const env: Record<string, string> = { ANTHROPIC_API_KEY: clave };
    if (p.urlBase !== null) env.ANTHROPIC_BASE_URL = urlBaseDe(p);
    return env;
  },
};
