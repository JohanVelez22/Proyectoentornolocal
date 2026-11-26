import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf, IDS_AGENTE, type EstadoAgente } from '@pel/core';
import { idAgente } from '../src/main/validacion';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { RUTAS_IPC, type ApiEntorno } from '../src/shared/api';
import { useAgentes } from '../src/renderer/stores/agentes';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';

// Valores claramente falsos: nunca deben salir del proceso principal.
const CLAVE = 'sk-falso-CENTINELA-agentes-ipc-0000000000wxyz';

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;
type Resultado = {
  ok: boolean;
  valor?: unknown;
  error?: { mensaje: string; codigo?: string; datos?: Record<string, unknown> };
};

const ESTADO: EstadoAgente[] = [
  {
    id: 'claude-code',
    nombre: 'Claude Code',
    paquete: '@anthropic-ai/claude-code',
    archivoConfig: '/casa/.claude.json',
    instalado: true,
    ruta: '/x/claude',
    version: '2.1.0',
    origen: 'propio',
    mcpRegistrado: false,
    mcpSoportado: true,
    instalable: true,
    guia: 'https://docs.anthropic.com/en/docs/claude-code/setup',
  },
];

function montarIpc(clave: string | null = CLAVE) {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const agentes = {
    estado: vi.fn(async () => ESTADO),
    version: vi.fn(async () => '0.9.1'),
    instalar: vi.fn(async () => undefined),
    registrarMcp: vi.fn(async () => ({
      respaldo: '/casa/.claude.json.wolfcore-x.bak',
      metodo: 'cli',
    })),
    quitarMcp: vi.fn(async () => ({ respaldo: null, metodo: 'archivo' })),
    abrir: vi.fn(async () => undefined),
    sugerirCommitSitio: vi.fn(async () => 'feat: algo'),
    commitPreparado: vi.fn(async () => undefined),
  };
  const nucleo = {
    eventos: { on: () => () => undefined },
    sitios: { listar: vi.fn(async () => [{ id: 'tienda' }]) },
    ia: { proveedor: vi.fn(async (id: string) => ({ id })) },
    agentes,
  };
  const guardadas = new Map<string, string>();
  if (clave) guardadas.set('ia:openai', clave);
  const secretos = {
    guardar: vi.fn(),
    leer: vi.fn(async (id: string) => guardadas.get(id) ?? null),
    borrar: vi.fn(),
    hay: vi.fn((id: string) => guardadas.has(id)),
    estado: vi.fn(),
    guardarTokenGithub: vi.fn(),
    leerTokenGithub: vi.fn(async () => null),
    borrarTokenGithub: vi.fn(),
    hayTokenGithub: vi.fn(() => false),
  };
  registrarIpc(
    nucleo as unknown as NucleoIpc,
    ipcMain,
    { isDestroyed: () => false, webContents: { send: () => undefined } },
    {
      elegirCarpeta: vi.fn(),
      elegirArchivo: vi.fn(),
      abrirUrl: vi.fn(),
      abrirGrabadora: vi.fn(),
      abrirCarpeta: vi.fn(),
      copiar: vi.fn(),
      version: vi.fn(),
      guardarArchivo: vi.fn(),
      elegirArchivos: vi.fn(),
    },
    () => true,
    undefined,
    { secretos: secretos as never },
  );
  const llamar = async (ruta: string, ...a: unknown[]) =>
    (await canales.get(`entorno:${ruta}`)!({}, ...a)) as Resultado;
  return { agentes, llamar, secretos, canales };
}

const RUTAS = [
  'agentes.estado',
  'agentes.version',
  'agentes.instalar',
  'agentes.registrarMcp',
  'agentes.quitarMcp',
  'agentes.abrir',
  'git.sugerirCommit',
  'git.commitPreparado',
] as const;

describe('IPC de agentes y del commit sugerido', () => {
  it('las rutas existen', () => {
    const { canales } = montarIpc();
    for (const r of RUTAS) {
      expect(RUTAS_IPC).toContain(r);
      expect(canales.has(`entorno:${r}`)).toBe(true);
    }
  });

  it('rechaza argumentos inválidos de cada ruta con su código, sin llamar al núcleo', async () => {
    const { agentes, llamar } = montarIpc();
    const casos: [string, unknown[], string][] = [
      ['agentes.version', ['otro'], 'agentes.no_existe'],
      ['agentes.version', [7], 'agentes.no_existe'],
      ['agentes.instalar', ['otro', true], 'agentes.no_existe'],
      ['agentes.instalar', ['codex'], 'agentes.sin_confirmar'],
      ['agentes.instalar', ['codex', 'true'], 'agentes.sin_confirmar'],
      ['agentes.instalar', ['codex', 1], 'agentes.sin_confirmar'],
      ['agentes.registrarMcp', ['codex', false], 'agentes.sin_confirmar'],
      ['agentes.registrarMcp', ['../codex', true], 'agentes.no_existe'],
      ['agentes.quitarMcp', ['codex', {}], 'agentes.sin_confirmar'],
      ['agentes.abrir', ['otro', 'tienda'], 'agentes.no_existe'],
      ['agentes.abrir', ['codex', '../tienda'], 'agentes.argumento_invalido'],
      ['agentes.abrir', ['codex', 'C:\\Proyectos\\tienda'], 'agentes.argumento_invalido'],
      ['agentes.abrir', ['codex', 42], 'agentes.argumento_invalido'],
      ['agentes.abrir', ['codex', 'tienda', 'OpenAI Mal'], 'ia.argumento_invalido'],
      ['agentes.abrir', ['codex', 'tienda', 7], 'ia.argumento_invalido'],
      ['git.sugerirCommit', ['tienda\n', 'openai', 'gpt-a'], 'agentes.argumento_invalido'],
      ['git.sugerirCommit', ['tienda', '../openai', 'gpt-a'], 'ia.argumento_invalido'],
      ['git.sugerirCommit', ['tienda', 'openai', '../../x'], 'ia.modelo_invalido'],
      ['git.sugerirCommit', ['tienda', 'openai'], 'ia.modelo_invalido'],
      ['git.commitPreparado', ['tienda', ''], 'git.mensaje_invalido'],
      ['git.commitPreparado', ['tienda', '   \n '], 'git.mensaje_invalido'],
      ['git.commitPreparado', ['tienda', 7], 'git.mensaje_invalido'],
      ['git.commitPreparado', ['tienda', 'a\0b'], 'git.mensaje_invalido'],
      ['git.commitPreparado', ['tienda', 'x'.repeat(10_001)], 'git.mensaje_invalido'],
      ['git.commitPreparado', ['/otra/carpeta', 'fix: x'], 'agentes.argumento_invalido'],
    ];
    for (const [ruta, args, codigo] of casos) {
      const r = await llamar(ruta, ...args);
      expect(r.ok, `${ruta} ${JSON.stringify(args)}`).toBe(false);
      expect(r.error?.codigo, `${ruta} ${JSON.stringify(args)}`).toBe(codigo);
    }
    for (const [nombre, m] of Object.entries(agentes)) expect(m, nombre).not.toHaveBeenCalled();
  });

  it('las acciones que escriben pasan la confirmación exacta al núcleo', async () => {
    const { agentes, llamar } = montarIpc();
    expect(await llamar('agentes.estado')).toEqual({ ok: true, valor: ESTADO });
    expect(await llamar('agentes.version', 'hermes')).toEqual({ ok: true, valor: '0.9.1' });
    expect(agentes.version).toHaveBeenCalledWith('hermes');
    expect((await llamar('agentes.instalar', 'codex', true)).ok).toBe(true);
    expect(agentes.instalar).toHaveBeenCalledWith('codex', true);
    const reg = await llamar('agentes.registrarMcp', 'claude-code', true);
    expect(reg).toEqual({
      ok: true,
      valor: { respaldo: '/casa/.claude.json.wolfcore-x.bak', metodo: 'cli' },
    });
    expect(agentes.registrarMcp).toHaveBeenCalledWith('claude-code', true);
    expect((await llamar('agentes.quitarMcp', 'hermes', true)).ok).toBe(true);
    expect(agentes.quitarMcp).toHaveBeenCalledWith('hermes', true);
    expect((await llamar('git.commitPreparado', 'tienda', 'feat: x\n\nCuerpo.')).ok).toBe(true);
    expect(agentes.commitPreparado).toHaveBeenCalledWith('tienda', 'feat: x\n\nCuerpo.');
  });

  it('la clave sale del almacén hacia el núcleo y nunca vuelve al renderer', async () => {
    const { agentes, llamar } = montarIpc();
    const salidas: Resultado[] = [];
    salidas.push(await llamar('agentes.abrir', 'codex', 'tienda', 'openai'));
    expect(agentes.abrir).toHaveBeenLastCalledWith('codex', 'tienda', {
      proveedorIa: 'openai',
      clave: CLAVE,
    });
    salidas.push(await llamar('git.sugerirCommit', 'tienda', 'openai', 'gpt-a'));
    expect(agentes.sugerirCommitSitio).toHaveBeenLastCalledWith('tienda', 'openai', CLAVE, 'gpt-a');
    expect(salidas.every((s) => s.ok)).toBe(true);
    // Errores que la repiten salen limpios.
    agentes.abrir.mockRejectedValueOnce(
      new ErrorWolf('agentes.proveedor_incompatible', `no con ${CLAVE}`, { agente: CLAVE }),
    );
    salidas.push(await llamar('agentes.abrir', 'codex', 'tienda', 'openai'));
    agentes.sugerirCommitSitio.mockRejectedValueOnce(new Error(`eco ${CLAVE}`));
    salidas.push(await llamar('git.sugerirCommit', 'tienda', 'openai', 'gpt-a'));
    // Un mensaje sugerido que la lleve (eco del proveedor) no sale.
    agentes.sugerirCommitSitio.mockResolvedValueOnce(`feat: ${CLAVE}`);
    const eco = await llamar('git.sugerirCommit', 'tienda', 'openai', 'gpt-a');
    expect(eco.ok).toBe(false);
    salidas.push(eco);
    expect(JSON.stringify(salidas)).not.toContain(CLAVE);
    expect(JSON.stringify(salidas)).not.toContain('CENTINELA');
  });

  it('sin proveedor, abrir no lee ninguna clave; el proveedor sin clave va con null', async () => {
    const { agentes, llamar, secretos } = montarIpc(null);
    expect((await llamar('agentes.abrir', 'claude-code', 'tienda')).ok).toBe(true);
    expect(agentes.abrir).toHaveBeenLastCalledWith('claude-code', 'tienda', {});
    expect(secretos.leer).not.toHaveBeenCalled();
    await llamar('agentes.abrir', 'claude-code', 'tienda', 'openai');
    expect(agentes.abrir).toHaveBeenLastCalledWith('claude-code', 'tienda', {
      proveedorIa: 'openai',
    });
    await llamar('git.sugerirCommit', 'tienda', 'openai', 'gpt-a');
    expect(agentes.sugerirCommitSitio).toHaveBeenLastCalledWith('tienda', 'openai', null, 'gpt-a');
  });

  it('ningún agente se abre sin un pedido: registrar el IPC y las demás rutas no lo abren', async () => {
    const { agentes, llamar } = montarIpc();
    for (const r of RUTAS) {
      if (r === 'agentes.abrir') continue;
      await llamar(r, 'codex', true);
    }
    expect(agentes.abrir).not.toHaveBeenCalled();
    // En el proceso principal, la única llamada a `agentes.abrir` es la de su ruta.
    const dir = path.join(__dirname, '..', 'src', 'main');
    const usos = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .flatMap((f) =>
        (readFileSync(path.join(dir, f), 'utf8').match(/agentes\.abrir\(/g) ?? []).map(() => f),
      );
    expect(new Set(usos)).toEqual(new Set(['ipc.ts']));
    const ipc = readFileSync(path.join(dir, 'ipc.ts'), 'utf8');
    const desde = ipc.indexOf("'agentes.abrir':");
    const hasta = ipc.indexOf("'git.sugerirCommit':");
    expect(desde).toBeGreaterThan(0);
    for (const m of ipc.matchAll(/agentes\.abrir\(/g)) {
      expect(m.index).toBeGreaterThan(desde);
      expect(m.index).toBeLessThan(hasta);
    }
  });
});

function apiFalsa() {
  const estados = structuredClone(ESTADO).concat([
    {
      id: 'hermes',
      nombre: 'Hermes Agent',
      paquete: null,
      archivoConfig: '/casa/.hermes/config.yaml',
      instalado: true,
      ruta: '/bin/hermes',
      version: null,
      origen: 'ejecutable',
      mcpRegistrado: true,
      mcpSoportado: true,
      instalable: false,
      guia: 'https://hermes-agent.nousresearch.com/docs',
    },
  ]);
  const agentes = {
    estado: vi.fn(async () => structuredClone(estados)),
    version: vi.fn(async () => '0.9.1'),
    instalar: vi.fn(async () => undefined),
    registrarMcp: vi.fn(async () => ({ respaldo: null, metodo: 'archivo' as const })),
    quitarMcp: vi.fn(async () => ({ respaldo: '/casa/x.bak', metodo: 'archivo' as const })),
    abrir: vi.fn(async () => undefined),
  };
  const api = { agentes } as unknown as ApiEntorno;
  (globalThis as unknown as { window: unknown }).window = { entorno: api };
  return agentes;
}

describe('store de agentes', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('cargar trae el estado y no abre ni instala nada', async () => {
    const api = apiFalsa();
    const s = useAgentes();
    await s.cargar();
    expect(s.estados.map((e) => e.id)).toEqual(['claude-code', 'hermes']);
    expect(s.porId['hermes']?.version).toBeNull();
    expect(api.abrir).not.toHaveBeenCalled();
    expect(api.instalar).not.toHaveBeenCalled();
    expect(api.version).not.toHaveBeenCalled();
  });

  it('la versión de un ejecutable suelto solo se pregunta a pedido', async () => {
    const api = apiFalsa();
    const s = useAgentes();
    await s.cargar();
    await s.preguntarVersion('hermes');
    expect(api.version).toHaveBeenCalledWith('hermes');
    expect(s.porId['hermes']?.version).toBe('0.9.1');
  });

  it('instalar, registrar y quitar pasan `true` y vuelven a cargar el estado', async () => {
    const api = apiFalsa();
    const s = useAgentes();
    await s.instalar('codex', true);
    expect(api.instalar).toHaveBeenCalledWith('codex', true);
    expect(await s.registrarMcp('claude-code', true)).toEqual({
      respaldo: null,
      metodo: 'archivo',
    });
    expect(api.registrarMcp).toHaveBeenCalledWith('claude-code', true);
    expect(await s.quitarMcp('hermes', true)).toEqual({
      respaldo: '/casa/x.bak',
      metodo: 'archivo',
    });
    expect(api.estado).toHaveBeenCalledTimes(3);
  });

  it('una instalación en curso no se pide dos veces', async () => {
    const api = apiFalsa();
    let soltar!: () => void;
    api.instalar.mockImplementationOnce(
      () => new Promise<undefined>((r) => (soltar = () => r(undefined))),
    );
    const s = useAgentes();
    const a = s.instalar('codex', true);
    const b = s.instalar('codex', true);
    expect(s.instalando('codex')).toBe(true);
    soltar();
    await Promise.all([a, b]);
    expect(api.instalar).toHaveBeenCalledTimes(1);
    expect(s.instalando('codex')).toBe(false);
  });

  it('abrir pasa agente, proyecto y proveedor (sin clave)', async () => {
    const api = apiFalsa();
    const s = useAgentes();
    await s.abrir('codex', 'tienda');
    expect(api.abrir).toHaveBeenLastCalledWith('codex', 'tienda', undefined);
    await s.abrir('codex', 'tienda', 'openai');
    expect(api.abrir).toHaveBeenLastCalledWith('codex', 'tienda', 'openai');
  });
});

describe('textos de agentes', () => {
  it('es y en tienen los mismos textos de la pantalla y del commit sugerido', () => {
    expect(Object.keys(en.agentes).sort()).toEqual(Object.keys(es.agentes).sort());
    expect(Object.keys(en.proyectos.git.commitIa).sort()).toEqual(
      Object.keys(es.proyectos.git.commitIa).sort(),
    );
    expect(es.nav.agentes).toBeTruthy();
    expect(en.nav.agentes).toBeTruthy();
  });
});

describe('agentes D3: Opencode, Gemini CLI, Qwen Code, Copilot CLI y Antigravity', () => {
  const NUEVOS = ['opencode', 'gemini-cli', 'qwen-code', 'copilot-cli', 'antigravity'];

  it('la lista de agentes de la pantalla sale de IDS_AGENTE', () => {
    for (const id of NUEVOS) expect(IDS_AGENTE).toContain(id);
    // La validación del IPC acepta exactamente los de IDS_AGENTE.
    for (const id of IDS_AGENTE) expect(idAgente(id)).toBe(id);
    expect(() => idAgente('otro')).toThrow();
    // La pantalla no lleva una lista propia: pinta lo que devuelve el núcleo.
    const pantalla = readFileSync(
      path.join(__dirname, '..', 'src', 'renderer', 'vistas', 'Agentes.vue'),
      'utf8',
    );
    for (const id of NUEVOS) expect(pantalla).not.toContain(`'${id}'`);
  });

  it('un agente sin registro de MCP (Antigravity) no ofrece registrar ni quitar', () => {
    const tarjeta = readFileSync(
      path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'TarjetaAgente.vue'),
      'utf8',
    );
    expect(tarjeta).toContain('mcpSoportado');
    // Quitar solo se ofrece donde el registro es posible.
    expect(tarjeta).toMatch(/v-if="a\.mcpSoportado && a\.mcpRegistrado"/);
  });

  it('es y en traen el texto del agente sin registro y el error nuevo', () => {
    expect(es.agentes.mcpNoSoportado).toBeTruthy();
    expect(en.agentes.mcpNoSoportado).toBeTruthy();
    expect(es.agentes.tokenEscrito).toBeTruthy();
    expect(en.agentes.tokenEscrito).toBeTruthy();
    // La descripción no promete el MCP para todos.
    expect(es.agentes.descripcion).toContain('Los que lo permiten');
    expect(en.agentes.descripcion).toContain('Those that allow it');
    const errEs = JSON.stringify(es);
    const errEn = JSON.stringify(en);
    expect(errEs).toContain('agentes.mcp_no_soportado');
    expect(errEn).toContain('agentes.mcp_no_soportado');
  });
});
