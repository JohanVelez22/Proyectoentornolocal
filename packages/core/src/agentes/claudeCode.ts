import path from 'node:path';
import { urlBaseDe } from '../ia/proveedores';
import type { DefAgente } from './agentes';
import { VARIABLE_TOKEN_MCP } from './configArchivo';

/**
 * Claude Code (`@anthropic-ai/claude-code`). Configuración del usuario en `~/.claude.json`
 * (`mcpServers`, ámbito "user").
 */
export const CLAUDE_CODE: DefAgente = {
  id: 'claude-code',
  nombre: 'Claude Code',
  binario: 'claude',
  paquete: '@anthropic-ai/claude-code',
  // Su `postinstall` (install.cjs) deja el binario nativo de la plataforma en `bin/`: sin él el
  // paquete no funciona, así que sus scripts de instalación quedan permitidos.
  scriptsInstalacion: true,
  guia: 'https://docs.anthropic.com/en/docs/claude-code/setup',
  soportaMcp: true,
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
  variablesClave: (p, clave) => {
    if (p.tipo !== 'anthropic') return null;
    const env: Record<string, string> = { ANTHROPIC_API_KEY: clave };
    if (p.urlBase !== null) env.ANTHROPIC_BASE_URL = urlBaseDe(p);
    return env;
  },
};
