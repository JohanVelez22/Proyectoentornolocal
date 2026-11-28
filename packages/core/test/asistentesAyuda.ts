import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Asistentes, type IdAsistente } from '../src/asistentes/asistentes';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

// Todo ocurre en carpetas falsas (inicio y APPDATA simulados): nunca se toca la configuración real.
export const TOKEN = 'token-mcp-FALSO-asistentes-00000000000000000000000';
export const URL_MCP = 'http://127.0.0.1:47123/mcp';
export const BOM = String.fromCharCode(0xfeff);

export interface Montaje {
  as: Asistentes;
  inicio: string;
  appdata: string;
  ruta(id: IdAsistente): string;
  instalados: Set<string>;
}

export async function montar(): Promise<Montaje> {
  const inicio = await carpetaTemporal('pel-as-inicio-');
  const appdata = await carpetaTemporal('pel-as-appdata-');
  const plat = new PlataformaFalsa({ carpetaInicio: inicio, carpetaConfigApps: appdata });
  const instalados = new Set<string>();
  const as = new Asistentes({
    plataforma: plat,
    agentes: {
      estado: async () => [...instalados].map((id) => ({ id, instalado: true }) as never),
    },
    mcp: { url: async () => URL_MCP, token: async () => TOKEN },
    ahora: () => new Date(2026, 10, 27, 10, 0, 0),
  });
  const rutas: Record<IdAsistente, string> = {
    'claude-code': path.join(inicio, '.claude.json'),
    codex: path.join(inicio, '.codex', 'config.toml'),
    opencode: path.join(inicio, '.config', 'opencode', 'opencode.json'),
    'copilot-cli': path.join(inicio, '.copilot', 'mcp-config.json'),
    hermes: path.join(inicio, '.hermes', 'config.yaml'),
    'gemini-cli': path.join(inicio, '.gemini', 'settings.json'),
    'qwen-code': path.join(inicio, '.qwen', 'settings.json'),
    cursor: path.join(inicio, '.cursor', 'mcp.json'),
    'claude-desktop': path.join(appdata, 'Claude', 'claude_desktop_config.json'),
  };
  return { as, inicio, appdata, ruta: (id) => rutas[id], instalados };
}

export function escribir(ruta: string, texto: string): void {
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
}
export const leer = (ruta: string): string => readFileSync(ruta, 'utf8');
export const copias = (ruta: string): string[] =>
  readdirSync(path.dirname(ruta)).filter(
    (n) => n.startsWith(`${path.basename(ruta)}.wolfcore-`) && n.endsWith('.bak'),
  );

export async function aplicar(
  m: Montaje,
  id: IdAsistente,
  accion: 'conectar' | 'quitar' = 'conectar',
) {
  const v = await m.as.vistaPrevia(id, accion);
  return m.as.aplicar(id, accion, v.huella, true);
}
