import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClienteOllama, SUGERIDOS, bloqueEnvIa } from '../src/ia/ollama';
import type { ProgresoIa } from '../src/eventos';
import { carpetaTemporal } from './temporales';

type Resp = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  body?: ReadableStream<Uint8Array> | null;
};

const json = (datos: unknown, status = 200): Resp => ({
  ok: status < 400,
  status,
  json: async () => datos,
});

function flujo(trozos: (string | Uint8Array)[]): Resp {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const t of trozos) c.enqueue(typeof t === 'string' ? enc.encode(t) : t);
      c.close();
    },
  });
  return { ok: true, status: 200, json: async () => ({}), body };
}

function cliente(fetchFalso: (url: string, init?: RequestInit) => Promise<Resp>, extra = {}) {
  const eventos: ProgresoIa[] = [];
  const c = new ClienteOllama({
    base: () => 'http://127.0.0.1:11434',
    modelosDir: () => '/no/existe',
    emitir: (e) => eventos.push(e),
    fetch: fetchFalso as never,
    ...extra,
  });
  return { c, eventos };
}

describe('ClienteOllama', () => {
  it('parsea /api/tags', async () => {
    const { c } = cliente(async (url) => {
      expect(url).toBe('http://127.0.0.1:11434/api/tags');
      return json({
        models: [{ name: 'llama3.2:latest', size: 2000, modified_at: '2026-01-01T00:00:00Z' }],
      });
    });
    expect(await c.modelos()).toEqual([
      { nombre: 'llama3.2:latest', tamanoBytes: 2000, modificado: '2026-01-01T00:00:00Z' },
    ]);
  });

  it('servicio apagado: mensaje claro', async () => {
    const { c } = cliente(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(c.modelos()).rejects.toThrow('Encienda Ollama para usar la IA local');
  });

  it('rechaza nombres inválidos sin llamar a la red', async () => {
    let llamadas = 0;
    const { c } = cliente(async () => {
      llamadas++;
      return json({});
    });
    for (const malo of ['', '../x', 'a b', '-x', 'a;b']) {
      await expect(c.descargar(malo)).rejects.toThrow('Nombre de modelo no válido');
    }
    await expect(c.borrar('a b')).rejects.toThrow('Nombre de modelo no válido');
    await expect(c.probar('a b', 'hola')).rejects.toThrow('Nombre de modelo no válido');
    expect(llamadas).toBe(0);
  });

  it('descarga con NDJSON partido entre chunks y UTF-8 multibyte', async () => {
    const enc = new TextEncoder();
    const l1 = '{"status":"pulling ñ","completed":10,"total":100}\n';
    const l2 = '{"status":"pulling manifest","completed":100,"total":100}\n';
    const l3 = '{"status":"success"}\n';
    const todo = enc.encode(l1 + l2 + l3);
    const corte = enc.encode(l1.slice(0, 18)).length + 0; // corta dentro de la línea
    const eñe = todo.indexOf(0xc3) + 1; // parte la ñ en dos bytes
    const { c, eventos } = cliente(async (url, init) => {
      expect(url).toBe('http://127.0.0.1:11434/api/pull');
      expect(JSON.parse(String(init?.body))).toEqual({ model: 'llama3.2', stream: true });
      return flujo([
        todo.slice(0, corte),
        todo.slice(corte, eñe),
        todo.slice(eñe, eñe + 30),
        todo.slice(eñe + 30),
      ]);
    });
    await c.descargar('llama3.2');
    expect(eventos[0]).toEqual({
      modelo: 'llama3.2',
      estado: 'pulling ñ',
      completado: 10,
      total: 100,
    });
    expect(eventos.at(-1)).toEqual({
      modelo: 'llama3.2',
      estado: 'success',
      completado: 0,
      total: 0,
    });
  });

  it('limita el progreso pero emite el estado final', async () => {
    const lineas = Array.from(
      { length: 50 },
      (_, i) => `{"status":"p","completed":${i},"total":100}\n`,
    );
    lineas.push('{"status":"success"}\n');
    const { c, eventos } = cliente(async () => flujo(lineas), { ahora: () => 1000 });
    await c.descargar('mistral');
    expect(eventos.length).toBeLessThan(5);
    expect(eventos.at(-1)?.estado).toBe('success');
  });

  it('una línea {"error"} se vuelve un error en español', async () => {
    const { c } = cliente(async () =>
      flujo(['{"error":"pull model manifest: file does not exist"}\n']),
    );
    await expect(c.descargar('nada')).rejects.toThrow(
      'Ollama no pudo descargar nada: pull model manifest: file does not exist',
    );
  });

  it('cancelarDescarga aborta con código cancelado', async () => {
    const { c } = cliente(
      (_url, init) =>
        new Promise<Resp>((_res, rej) => {
          init?.signal?.addEventListener('abort', () =>
            rej(new DOMException('abort', 'AbortError')),
          );
        }),
    );
    const p = c.descargar('llama3.2');
    const asercion = expect(p).rejects.toMatchObject({
      codigo: 'cancelado',
      message: 'Descarga cancelada',
    });
    expect(c.cancelarDescarga('llama3.2')).toBe(true);
    await asercion;
    expect(c.cancelarDescarga('llama3.2')).toBe(false);
  });

  it('borrar usa DELETE /api/delete', async () => {
    const { c } = cliente(async (url, init) => {
      expect(url).toBe('http://127.0.0.1:11434/api/delete');
      expect(init?.method).toBe('DELETE');
      expect(JSON.parse(String(init?.body))).toEqual({ model: 'mistral' });
      return json({});
    });
    await c.borrar('mistral');
  });

  it('probar devuelve la respuesta con stream:false', async () => {
    const { c } = cliente(async (url, init) => {
      expect(url).toBe('http://127.0.0.1:11434/api/generate');
      expect(JSON.parse(String(init?.body))).toEqual({
        model: 'mistral',
        prompt: 'hola',
        stream: false,
      });
      return json({ response: 'Hola, mundo' });
    });
    expect(await c.probar('mistral', 'hola')).toBe('Hola, mundo');
  });

  it('espacioUsado suma recursivamente y tolera carpeta ausente', async () => {
    const dir = await carpetaTemporal('pel-ollama-');
    mkdirSync(path.join(dir, 'blobs', 'x'), { recursive: true });
    writeFileSync(path.join(dir, 'a'), Buffer.alloc(100));
    writeFileSync(path.join(dir, 'blobs', 'x', 'b'), Buffer.alloc(250));
    const { c } = cliente(async () => json({}), { modelosDir: () => dir });
    expect(await c.espacioUsado()).toBe(350);
    const { c: c2 } = cliente(async () => json({}), { modelosDir: () => path.join(dir, 'nada') });
    expect(await c2.espacioUsado()).toBe(0);
  });

  it('constantes', () => {
    expect(SUGERIDOS).toEqual(['llama3.2', 'qwen2.5-coder', 'mistral', 'nomic-embed-text']);
    expect(bloqueEnvIa()).toBe(
      'OLLAMA_BASE_URL=http://127.0.0.1:11434\nOPENAI_BASE_URL=http://127.0.0.1:11434/v1',
    );
  });
});
