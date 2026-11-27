import path from 'node:path';
import { ErrorWolf } from '../errores';
import type { DefAgente } from './agentes';

/**
 * Antigravity CLI (`agy`, Google). Su instalador oficial es un script remoto
 * (`irm https://antigravity.google/cli/install.ps1 | iex`, o `winget install
 * Google.AntigravityCLI`) sin huella publicada que se pueda fijar: WolfCore Dev no lo ejecuta;
 * solo lo detecta y enlaza a la guía oficial (igual que Hermes). Configuración global en
 * `~/.gemini/config/mcp_config.json` (`mcpServers` con `serverUrl` y `headers`), pero su
 * documentación no describe cómo tomar un valor de una variable de entorno en las cabeceras
 * (solo muestra valores literales): sin eso el token tendría que quedar escrito, así que
 * WolfCore Dev NO registra el MCP en él (`soportaMcp: false`).
 *
 * Fuentes: antigravity.google/docs/mcp (pestaña CLI) y antigravity.google/docs/cli/install.
 */
export const ANTIGRAVITY: DefAgente = {
  id: 'antigravity',
  nombre: 'Antigravity CLI',
  binario: 'agy',
  paquete: null,
  scriptsInstalacion: false,
  guia: 'https://antigravity.google/docs/cli/install',
  formato: 'json',
  seccion: 'mcpServers',
  soportaMcp: false,
  archivoConfig: (inicio) => path.join(inicio, '.gemini', 'config', 'mcp_config.json'),
  // El instalador de Windows lo deja en %LOCALAPPDATA%\agy\bin; en macOS y Linux, en ~/.local/bin.
  carpetasConocidas: (inicio) => [
    path.join(inicio, 'AppData', 'Local', 'agy', 'bin'),
    path.join(inicio, '.local', 'bin'),
  ],
  entradaMcp: () => {
    throw new ErrorWolf(
      'agentes.mcp_no_soportado',
      'Antigravity CLI no documenta el token por variable de entorno: no se registra el MCP.',
      { agente: 'Antigravity CLI' },
    );
  },
  variablesClave: () => null,
};
