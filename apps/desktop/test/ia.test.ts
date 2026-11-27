import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ApiEntorno,
  EventosNucleo,
  ModeloOllama,
  ProveedorIaPublico,
  ResultadoPruebaIa,
} from '../src/shared/api';
import {
  PRESETS_COMPATIBLES as PRESETS_NUCLEO,
  TIPOS_CON_CLAVE as CON_CLAVE_NUCLEO,
  URL_BASE_POR_DEFECTO,
} from '@pel/core';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { faseDe, porcentaje, useIa, veredictoEspacio } from '../src/renderer/stores/ia';
import {
  claveEnmascarada,
  idDeNombre,
  soloGratuitos,
  documentacionDePreset,
  PRESETS_COMPATIBLES,
  TIPOS_CON_CLAVE,
  URL_POR_DEFECTO,
  urlEfectiva,
} from '../src/renderer/utilidades/ia';

type Oyente = (dato: unknown) => void;

const PROVEEDOR: ProveedorIaPublico = {
  id: 'openai',
  tipo: 'openai',
  nombre: 'OpenAI',
  urlBase: null,
  modelo: 'gpt-a',
  clave: { configurada: false, final: null },
};
// Clave claramente falsa: la tienda nunca debe guardarla.
const CLAVE = 'sk-falso-CENTINELA-store-00000000000wxyz';

/** Promesa que la prueba resuelve o rechaza a mano (una descarga en curso). */
function diferida<T = void>() {
  let resolver!: (v: T) => void;
  let rechazar!: (e: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

const cancelada = (): Error =>
  Object.assign(new Error('Descarga cancelada'), { codigo: 'cancelado' });

function apiFalsa() {
  const oyentes = new Map<string, Set<Oyente>>();
  const descargas = new Map<string, ReturnType<typeof diferida<void>>>();
  let modelos: ModeloOllama[] = [];
  const api = {
    ia: {
      modelos: vi.fn(async () => modelos),
      descargar: vi.fn((nombre: string) => {
        const d = diferida<void>();
        descargas.set(nombre, d);
        return d.promesa;
      }),
      cancelar: vi.fn(async (nombre: string) => {
        const d = descargas.get(nombre);
        if (!d) return false;
        d.rechazar(cancelada());
        return true;
      }),
      borrar: vi.fn(async () => undefined),
      probar: vi.fn(async () => 'Hola'),
      espacioUsado: vi.fn(async () => 1024),
      infoDescarga: vi.fn(async () => ({ tamanoBytes: 2_000_000_000, libreBytes: 50_000_000_000 })),
      bloqueEnv: vi.fn(async () => 'OLLAMA_BASE_URL=http://127.0.0.1:11434'),
      sugeridos: vi.fn(async () => ['llama3.2']),
      proveedores: vi.fn(async (): Promise<ProveedorIaPublico[]> => [PROVEEDOR]),
      guardarProveedor: vi.fn(async (): Promise<ProveedorIaPublico[]> => [PROVEEDOR]),
      borrarProveedor: vi.fn(async () => undefined),
      guardarClave: vi.fn(async () => ({ configurada: true, final: 'wxyz' })),
      borrarClave: vi.fn(async () => ({ sitiosLimpios: 0 })),
      estadoClave: vi.fn(async () => ({ configurada: true, final: 'wxyz' })),
      respaldosClave: vi.fn(async () => ({ sitios: [] })),
      probarConexion: vi.fn(async (): Promise<ResultadoPruebaIa> => ({
        ok: true,
        latenciaMs: 120,
        modelos: [{ id: 'gpt-a', nombre: 'gpt-a' }],
        modelosGratis: [],
      })),
      probarMensaje: vi.fn(async () => ({ texto: 'ok', latenciaMs: 300 })),
      previsualizarEnv: vi.fn(),
      escribirEnv: vi.fn(),
    },
    on: vi.fn((nombre: string, fn: Oyente) => {
      const set = oyentes.get(nombre) ?? new Set<Oyente>();
      set.add(fn);
      oyentes.set(nombre, set);
      return () => void set.delete(fn);
    }),
  };
  const emitir = <K extends keyof EventosNucleo>(nombre: K, dato: EventosNucleo[K]): void => {
    for (const fn of oyentes.get(nombre) ?? []) fn(dato);
  };
  const ponerModelos = (m: ModeloOllama[]): void => {
    modelos = m;
  };
  return { api, emitir, descargas, ponerModelos };
}

describe('utilidades de IA local', () => {
  it('traduce el estado de Ollama a una fase en español', () => {
    expect(faseDe('pulling manifest')).toBe('preparando');
    expect(faseDe('pulling 6a0746a1ec1a')).toBe('descargando');
    expect(faseDe('verifying sha256 digest')).toBe('verificando');
    expect(faseDe('writing manifest')).toBe('guardando');
    expect(faseDe('success')).toBe('listo');
    expect(faseDe('algo nuevo')).toBe('descargando');
  });

  it('el porcentaje solo existe si se conoce el total', () => {
    expect(porcentaje({ completado: 0, total: 0 })).toBeNull();
    expect(porcentaje({ completado: 50, total: 200 })).toBe(25);
    expect(porcentaje({ completado: 300, total: 200 })).toBe(100);
  });
});

describe('store de IA local', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('el progreso se guarda por modelo, sin mezclar descargas', () => {
    const ia = useIa();
    ia.iniciar();
    void ia.descargar('llama3.2');
    void ia.descargar('mistral');
    falsa.emitir('ia:progreso', {
      modelo: 'llama3.2',
      estado: 'pulling abc',
      completado: 10,
      total: 100,
    });
    falsa.emitir('ia:progreso', {
      modelo: 'mistral',
      estado: 'pulling manifest',
      completado: 0,
      total: 0,
    });
    expect(ia.descargas['llama3.2']).toMatchObject({
      estado: 'descargando',
      fase: 'descargando',
      completado: 10,
      total: 100,
    });
    expect(ia.descargas['mistral']).toMatchObject({ fase: 'preparando', total: 0 });
    expect(ia.activas.map((d) => d.modelo).sort()).toEqual(['llama3.2', 'mistral']);
  });

  it('al completar queda lista y se recargan la lista de modelos y el espacio', async () => {
    const ia = useIa();
    ia.iniciar();
    const p = ia.descargar('llama3.2');
    falsa.ponerModelos([{ nombre: 'llama3.2:latest', tamanoBytes: 2_000_000_000, modificado: '' }]);
    falsa.descargas.get('llama3.2')!.resolver();
    await p;
    expect(ia.descargas['llama3.2']?.estado).toBe('listo');
    expect(ia.modelos?.map((m) => m.nombre)).toEqual(['llama3.2:latest']);
    expect(ia.espacio).toBe(1024);
    expect(ia.activas).toEqual([]);
  });

  it('cancelar marca la descarga como cancelada, sin error, e ignora eventos tardíos', async () => {
    const ia = useIa();
    ia.iniciar();
    const p = ia.descargar('llama3.2');
    await ia.cancelar('llama3.2');
    await p;
    expect(falsa.api.ia.cancelar).toHaveBeenCalledWith('llama3.2');
    expect(ia.descargas['llama3.2']).toMatchObject({ estado: 'cancelado' });
    expect(ia.descargas['llama3.2']?.error).toBeUndefined();
    falsa.emitir('ia:progreso', { modelo: 'llama3.2', estado: 'pulling', completado: 5, total: 9 });
    expect(ia.descargas['llama3.2']?.estado).toBe('cancelado');
  });

  it('un fallo deja el mensaje del núcleo', async () => {
    const ia = useIa();
    const p = ia.descargar('llama3.2');
    falsa.descargas.get('llama3.2')!.rechazar(new Error('Encienda Ollama para usar la IA local'));
    await p;
    expect(ia.descargas['llama3.2']).toMatchObject({
      estado: 'error',
      error: 'Encienda Ollama para usar la IA local',
    });
  });

  it('no inicia dos descargas del mismo modelo a la vez', () => {
    const ia = useIa();
    void ia.descargar('llama3.2');
    void ia.descargar('LLAMA3.2');
    expect(falsa.api.ia.descargar).toHaveBeenCalledTimes(1);
  });

  it('borrar recarga la lista', async () => {
    const ia = useIa();
    await ia.borrar('llama3.2');
    expect(falsa.api.ia.borrar).toHaveBeenCalledWith('llama3.2');
    expect(falsa.api.ia.modelos).toHaveBeenCalled();
  });
});

describe('store de IA en la nube', () => {
  let falsa: ReturnType<typeof apiFalsa>;

  beforeEach(() => {
    setActivePinia(createPinia());
    falsa = apiFalsa();
    vi.stubGlobal('window', { entorno: falsa.api as unknown as ApiEntorno });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('probar conexión pasa por probando y queda ok con latencia y modelos', async () => {
    const ia = useIa();
    const d = diferida<ResultadoPruebaIa>();
    falsa.api.ia.probarConexion.mockReturnValueOnce(d.promesa);
    const p = ia.probarConexion('openai');
    expect(ia.pruebas['openai']).toEqual({ estado: 'probando' });
    d.resolver({
      ok: true,
      latenciaMs: 120,
      modelos: [{ id: 'gpt-a', nombre: 'gpt-a' }],
      modelosGratis: [],
    });
    await p;
    expect(ia.pruebas['openai']).toEqual({
      estado: 'ok',
      latenciaMs: 120,
      modelos: [{ id: 'gpt-a', nombre: 'gpt-a' }],
      modelosGratis: [],
    });
    expect(ia.modelosDe('openai')).toEqual(['gpt-a']);
  });

  it('un fallo del proveedor queda como error traducido con su código', async () => {
    const ia = useIa();
    falsa.api.ia.probarConexion.mockResolvedValueOnce({
      ok: false,
      latenciaMs: 80,
      modelos: [],
      modelosGratis: [],
      error: { codigo: 'ia.clave_invalida' },
    });
    await ia.probarConexion('openai');
    expect(ia.pruebas['openai']).toMatchObject({
      estado: 'error',
      codigo: 'ia.clave_invalida',
      latenciaMs: 80,
    });
    expect((ia.pruebas['openai'] as { error: string }).error).toMatch(/clave/);
    // Un rechazo del IPC también queda como error, sin lanzar.
    falsa.api.ia.probarConexion.mockRejectedValueOnce(new Error('sin red'));
    await ia.probarConexion('openai');
    expect(ia.pruebas['openai']).toMatchObject({ estado: 'error', error: 'sin red' });
  });

  it('una prueba vieja que termina tarde no pisa la más nueva', async () => {
    const ia = useIa();
    const vieja = diferida<ResultadoPruebaIa>();
    falsa.api.ia.probarConexion.mockReturnValueOnce(vieja.promesa);
    const p1 = ia.probarConexion('openai');
    const p2 = ia.probarConexion('openai');
    await p2;
    vieja.resolver({
      ok: false,
      latenciaMs: 1,
      modelos: [],
      modelosGratis: [],
      error: { codigo: 'ia.sin_red' },
    });
    await p1;
    expect(ia.pruebas['openai']).toMatchObject({ estado: 'ok' });
  });

  it('el mensaje de prueba manda la confirmación y guarda la respuesta', async () => {
    const ia = useIa();
    await ia.probarMensaje('openai', 'gpt-a');
    expect(falsa.api.ia.probarMensaje).toHaveBeenCalledWith('openai', 'gpt-a', true);
    expect(ia.mensajes['openai']).toEqual({ estado: 'ok', texto: 'ok', latenciaMs: 300 });
    falsa.api.ia.probarMensaje.mockRejectedValueOnce(
      Object.assign(new Error('x'), { codigo: 'ia.sin_saldo' }),
    );
    await ia.probarMensaje('openai', 'gpt-a');
    expect(ia.mensajes['openai']).toMatchObject({ estado: 'error', codigo: 'ia.sin_saldo' });
  });

  it('guardar la clave solo deja {configurada, final}; la clave no queda en la tienda', async () => {
    const ia = useIa();
    await ia.cargarProveedores();
    await ia.probarConexion('openai');
    const estado = await ia.guardarClave('openai', CLAVE);
    expect(estado).toEqual({ configurada: true, final: 'wxyz' });
    expect(falsa.api.ia.guardarClave).toHaveBeenCalledWith('openai', CLAVE);
    expect(ia.proveedores?.[0]?.clave).toEqual({ configurada: true, final: 'wxyz' });
    // La prueba anterior ya no vale para la clave nueva.
    expect(ia.pruebas['openai']).toBeUndefined();
    expect(JSON.stringify(ia.$state)).not.toContain(CLAVE);
  });

  it('borrar la clave pasa la opción de limpiar copias y actualiza el estado', async () => {
    const ia = useIa();
    await ia.cargarProveedores();
    falsa.api.ia.borrarClave.mockResolvedValueOnce({ sitiosLimpios: 2 });
    expect(await ia.borrarClave('openai', true)).toBe(2);
    expect(falsa.api.ia.borrarClave).toHaveBeenCalledWith('openai', { limpiarRespaldos: true });
    expect(ia.proveedores?.[0]?.clave).toEqual({ configurada: false, final: null });
  });

  it('guardar un proveedor reemplaza la lista y propaga el pedido de confirmación', async () => {
    const ia = useIa();
    const datos = { id: 'openai', tipo: 'openai', nombre: 'OpenAI', urlBase: null, modelo: null };
    await ia.guardarProveedor(datos as never);
    expect(falsa.api.ia.guardarProveedor).toHaveBeenCalledWith(datos, undefined);
    expect(ia.proveedores).toEqual([PROVEEDOR]);
    falsa.api.ia.guardarProveedor.mockRejectedValueOnce(
      Object.assign(new Error('confirme'), { codigo: 'ia.url_cambia_con_clave' }),
    );
    await expect(ia.guardarProveedor(datos as never)).rejects.toMatchObject({
      codigo: 'ia.url_cambia_con_clave',
    });
    await ia.guardarProveedor(datos as never, true);
    expect(falsa.api.ia.guardarProveedor).toHaveBeenLastCalledWith(datos, true);
  });
});

describe('utilidades de IA en la nube', () => {
  it('las copias de la interfaz coinciden con el núcleo', () => {
    expect(URL_POR_DEFECTO).toEqual(URL_BASE_POR_DEFECTO);
    expect(PRESETS_COMPATIBLES).toEqual(PRESETS_NUCLEO);
    expect([...TIPOS_CON_CLAVE].sort()).toEqual([...CON_CLAVE_NUCLEO].sort());
  });

  it('documentacionDePreset da el enlace https del preset y null si no hay', () => {
    for (const p of PRESETS_COMPATIBLES) {
      expect(documentacionDePreset(p.nombre)).toBe(p.documentacion);
      expect(documentacionDePreset(p.nombre)).toMatch(/^https:\/\//);
    }
    expect(documentacionDePreset('')).toBeNull();
    expect(documentacionDePreset(null)).toBeNull();
    expect(documentacionDePreset('Inexistente')).toBeNull();
  });

  it('el diálogo del proveedor tiene su texto del enlace en es y en', () => {
    expect(es.ia.dialogo.documentacion).toBeTruthy();
    expect(en.ia.dialogo.documentacion).toBeTruthy();
  });

  it('filtro Solo gratuitos', () => {
    const todos = ['a:free', 'b', 'c'];
    expect(soloGratuitos(todos, ['a:free', 'b'], true)).toEqual(['a:free', 'b']);
    expect(soloGratuitos(todos, ['a:free', 'b'], false)).toEqual(todos);
    expect(soloGratuitos(todos, [], true)).toEqual([]);
  });

  it('id a partir del nombre, sin repetir', () => {
    expect(idDeNombre('OpenRouter personal', 'compatible', [])).toBe('openrouter-personal');
    expect(idDeNombre('Ñandú IA', 'openai', [])).toBe('nandu-ia');
    expect(idDeNombre('***', 'gemini', ['gemini'])).toBe('gemini-2');
    expect(idDeNombre('x'.repeat(80), 'openai', [])).toHaveLength(34);
  });

  it('URL efectiva y clave enmascarada', () => {
    expect(urlEfectiva({ tipo: 'openai', urlBase: null })).toBe('https://api.openai.com/v1');
    expect(urlEfectiva({ tipo: 'compatible', urlBase: 'https://a.example/v1/' })).toBe(
      'https://a.example/v1',
    );
    expect(claveEnmascarada({ clave: { configurada: true, final: 'wxyz' } })).toBe('••••wxyz');
    expect(claveEnmascarada({ clave: { configurada: false, final: null } })).toBeNull();
  });
});

describe('aviso de tamaño y espacio libre antes de descargar', () => {
  it('veredictoEspacio: sin espacio solo si se sabe que no cabe', () => {
    expect(veredictoEspacio({ tamanoBytes: 10, libreBytes: 5 })).toBe('sin-espacio');
    expect(veredictoEspacio({ tamanoBytes: 5, libreBytes: 5 })).toBe('ok');
    expect(veredictoEspacio({ tamanoBytes: null, libreBytes: 5 })).toBe('desconocido');
    expect(veredictoEspacio({ tamanoBytes: 5, libreBytes: null })).toBe('desconocido');
  });

  it('la store pide el tamaño al núcleo y, si falla, devuelve «no se pudo saber»', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const api = { ia: { infoDescarga: vi.fn(async () => ({ tamanoBytes: 7, libreBytes: 9 })) } };
    vi.stubGlobal('window', { entorno: api });
    const ia = useIa();
    expect(await ia.infoDescarga('llama3.2')).toEqual({ tamanoBytes: 7, libreBytes: 9 });
    expect(api.ia.infoDescarga).toHaveBeenCalledWith('llama3.2');
    api.ia.infoDescarga.mockRejectedValueOnce(new Error('x'));
    expect(await ia.infoDescarga('llama3.2')).toEqual({ tamanoBytes: null, libreBytes: null });
    vi.unstubAllGlobals();
  });
});
