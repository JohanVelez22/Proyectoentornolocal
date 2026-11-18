import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiEntorno, EventosNucleo, ModeloOllama } from '../src/shared/api';
import { faseDe, porcentaje, useIa } from '../src/renderer/stores/ia';

type Oyente = (dato: unknown) => void;

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
      bloqueEnv: vi.fn(async () => 'OLLAMA_BASE_URL=http://127.0.0.1:11434'),
      sugeridos: vi.fn(async () => ['llama3.2']),
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
