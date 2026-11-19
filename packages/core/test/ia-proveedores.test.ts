import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigSchema } from '../src/tipos';
import { ErrorWolf } from '../src/errores';
import { sanear } from '../src/proyectos/recetas';
import { clasificarErrorIa, sinSecretosIa, enmascararClave } from '../src/ia/errores';
import {
  ConfigIaSchema,
  crearClienteIa,
  PRESETS_COMPATIBLES,
  probarConexion,
  URL_BASE_POR_DEFECTO,
  validarUrlBase,
  type ConfigProveedorIa,
  type TipoProveedorIa,
} from '../src/ia/proveedores';

/** Clave centinela: claramente falsa; nunca debe salir en errores, URLs ni resultados. */
const CLAVE = 'sk-falso-CENTINELA-0123456789abcdefWXYZ';

interface Peticion {
  metodo: string;
  url: string;
  cabeceras: IncomingHttpHeaders;
  cuerpo: string;
}

type Manejador = (p: Peticion) => {
  status?: number;
  json?: unknown;
  texto?: string;
  cabeceras?: Record<string, string>;
  colgar?: boolean;
};

const servidores: Server[] = [];

afterEach(async () => {
  for (const s of servidores.splice(0)) {
    s.closeAllConnections();
    await new Promise<void>((r) => s.close(() => r()));
  }
});

/** Servidor HTTP falso en 127.0.0.1 que registra cada petición. */
async function servidorFalso(
  manejar: Manejador,
): Promise<{ base: string; peticiones: Peticion[] }> {
  const peticiones: Peticion[] = [];
  const s = createServer((req, res) => {
    const trozos: Buffer[] = [];
    req.on('data', (t: Buffer) => trozos.push(t));
    req.on('end', () => {
      const p: Peticion = {
        metodo: req.method ?? '',
        url: req.url ?? '',
        cabeceras: req.headers,
        cuerpo: Buffer.concat(trozos).toString('utf8'),
      };
      peticiones.push(p);
      const r = manejar(p);
      if (r.colgar) return; // nunca responde
      const cuerpo = r.texto ?? JSON.stringify(r.json ?? {});
      res.writeHead(r.status ?? 200, { 'content-type': 'application/json', ...r.cabeceras });
      res.end(cuerpo);
    });
  });
  servidores.push(s);
  await new Promise<void>((r) => s.listen(0, '127.0.0.1', () => r()));
  const { port } = s.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, peticiones };
}

const config = (tipo: TipoProveedorIa, urlBase: string | null): ConfigProveedorIa => ({
  id: `prueba-${tipo}`,
  tipo,
  nombre: `Prueba ${tipo}`,
  urlBase,
  modelo: null,
});

/** Ninguna petición lleva la clave en la URL (ni ?key=). */
function sinClaveEnUrl(peticiones: Peticion[]): void {
  for (const p of peticiones) {
    expect(p.url).not.toContain(CLAVE);
    expect(p.url).not.toMatch(/[?&]key=/i);
  }
}

async function capturar(fn: () => Promise<unknown>): Promise<ErrorWolf> {
  try {
    await fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErrorWolf);
    const ew = e as ErrorWolf;
    expect(ew.message).not.toContain(CLAVE);
    expect(JSON.stringify(ew.datos ?? {})).not.toContain(CLAVE);
    expect(String(ew.stack)).not.toContain(CLAVE);
    return ew;
  }
  throw new Error('se esperaba un error');
}

describe('validarUrlBase', () => {
  it('acepta https y http solo hacia 127.0.0.1 o localhost', () => {
    expect(() => validarUrlBase('https://api.openai.com/v1')).not.toThrow();
    expect(() => validarUrlBase('http://127.0.0.1:1234/v1')).not.toThrow();
    expect(() => validarUrlBase('http://localhost:11434')).not.toThrow();
  });

  it('rechaza http remoto, credenciales, otros esquemas y basura', () => {
    for (const u of [
      'http://api.openai.com/v1',
      'http://192.168.1.10:1234/v1',
      'http://127.0.0.1.evil.com/v1',
      'https://usuario:clave@api.openai.com/v1',
      'https://usuario@api.openai.com/v1',
      'ftp://127.0.0.1/',
      'file:///C:/x',
      'javascript:alert(1)',
      'no es una url',
      '',
      'https://api.openai.com/v1?key=abc',
      'https://api.openai.com/v1#x',
    ]) {
      const e = (() => {
        try {
          validarUrlBase(u);
        } catch (x) {
          return x;
        }
        return null;
      })();
      expect(e, u).toBeInstanceOf(ErrorWolf);
      expect((e as ErrorWolf).codigo, u).toBe('ia.url_invalida');
      expect((e as ErrorWolf).message).not.toContain('clave@');
    }
  });
});

describe('configuración de proveedores', () => {
  it('URL por defecto de Hermes (Nous) y presets de compatibles', () => {
    expect(URL_BASE_POR_DEFECTO.hermes).toBe('https://inference-api.nousresearch.com/v1');
    const nombres = PRESETS_COMPATIBLES.map((p) => p.nombre);
    expect(nombres).toEqual(
      expect.arrayContaining(['OpenRouter', 'Groq', 'Mistral', 'DeepSeek', 'LM Studio']),
    );
    expect(PRESETS_COMPATIBLES.find((p) => p.nombre === 'LM Studio')?.urlBase).toBe(
      'http://127.0.0.1:1234/v1',
    );
    for (const p of PRESETS_COMPATIBLES) expect(() => validarUrlBase(p.urlBase)).not.toThrow();
  });

  it('el esquema descarta claves pegadas por error y proveedores inválidos sin perder los demás', () => {
    const c = ConfigIaSchema.parse({
      proveedores: [
        {
          id: 'openai',
          tipo: 'openai',
          nombre: 'OpenAI',
          urlBase: null,
          modelo: null,
          clave: CLAVE,
        },
        { id: 'malo', tipo: 'inventado', nombre: 'x', urlBase: null, modelo: null },
        {
          id: 'remoto',
          tipo: 'compatible',
          nombre: 'x',
          urlBase: 'http://10.0.0.1/v1',
          modelo: null,
        },
        { id: 'Mal Id', tipo: 'openai', nombre: 'x', urlBase: null, modelo: null },
      ],
    });
    expect(c.proveedores.map((p) => p.id)).toEqual(['openai']);
    expect(JSON.stringify(c)).not.toContain(CLAVE);
    expect(ConfigIaSchema.parse(undefined)).toEqual({ proveedores: [] });
    expect(ConfigIaSchema.parse({ proveedores: 'x' })).toEqual({ proveedores: [] });
  });

  it('un compatible sin URL base no se puede usar', async () => {
    const e = await capturar(async () => crearClienteIa(config('compatible', null)));
    expect(e.codigo).toBe('ia.url_invalida');
  });
});

describe('familia OpenAI (openai, hermes, compatible)', () => {
  for (const tipo of ['openai', 'hermes', 'compatible'] as const) {
    it(`${tipo}: Authorization Bearer, lista de modelos y mensaje con maxTokens`, async () => {
      const { base, peticiones } = await servidorFalso((p) => {
        if (p.metodo === 'GET' && p.url === '/v1/models') {
          return { json: { data: [{ id: 'modelo-b' }, { id: 'modelo-a' }] } };
        }
        if (p.metodo === 'POST' && p.url === '/v1/chat/completions') {
          return {
            json: {
              choices: [{ message: { content: 'hola' } }],
              usage: { prompt_tokens: 5, completion_tokens: 2 },
            },
          };
        }
        return { status: 404, json: {} };
      });
      const c = crearClienteIa(config(tipo, `${base}/v1`));
      expect(await c.modelos(CLAVE)).toEqual([
        { id: 'modelo-a', nombre: 'modelo-a' },
        { id: 'modelo-b', nombre: 'modelo-b' },
      ]);
      const r = await c.mensaje(CLAVE, 'modelo-a', 'di hola', { maxTokens: 16 });
      expect(r).toEqual({ texto: 'hola', tokens: { entrada: 5, salida: 2 } });
      for (const p of peticiones) {
        expect(p.cabeceras.authorization).toBe(`Bearer ${CLAVE}`);
        expect(p.cabeceras['x-api-key']).toBeUndefined();
      }
      const cuerpo = JSON.parse(peticiones[1]!.cuerpo) as Record<string, unknown>;
      expect(cuerpo.model).toBe('modelo-a');
      expect(cuerpo.messages).toEqual([{ role: 'user', content: 'di hola' }]);
      // OpenAI usa max_completion_tokens (los modelos nuevos rechazan max_tokens).
      if (tipo === 'openai') expect(cuerpo.max_completion_tokens).toBe(16);
      else expect(cuerpo.max_tokens).toBe(16);
      sinClaveEnUrl(peticiones);
    });
  }

  it('un compatible local (LM Studio) funciona sin clave y sin cabecera Authorization', async () => {
    const { base, peticiones } = await servidorFalso(() => ({ json: { data: [{ id: 'local' }] } }));
    const c = crearClienteIa(config('compatible', `${base}/v1`));
    expect(await c.modelos(null)).toEqual([{ id: 'local', nombre: 'local' }]);
    expect(peticiones[0]!.cabeceras.authorization).toBeUndefined();
  });

  it('OpenAI y Hermes exigen clave', async () => {
    for (const tipo of ['openai', 'hermes', 'anthropic', 'gemini'] as const) {
      const e = await capturar(() =>
        crearClienteIa(config(tipo, 'http://127.0.0.1:9/v1')).modelos(null),
      );
      expect(e.codigo).toBe('ia.sin_clave');
    }
  });

  it('una clave con saltos de línea o espacios se rechaza sin repetirla', async () => {
    const c = crearClienteIa(config('openai', 'http://127.0.0.1:9/v1'));
    const e = await capturar(() => c.modelos(`${CLAVE}\r\nX-Inyectada: 1`));
    expect(e.codigo).toBe('ia.clave_mal_formada');
  });

  it('un nombre de modelo extraño se rechaza antes de llamar', async () => {
    const { base, peticiones } = await servidorFalso(() => ({ json: {} }));
    const c = crearClienteIa(config('openai', `${base}/v1`));
    const e = await capturar(() => c.mensaje(CLAVE, '../x\n', 'hola'));
    expect(e.codigo).toBe('ia.modelo_invalido');
    expect(peticiones).toHaveLength(0);
  });

  it('maxTokens se acota a 16 por defecto y nunca pasa de lo pedido', async () => {
    const { base, peticiones } = await servidorFalso(() => ({
      json: { choices: [{ message: { content: 'x' } }] },
    }));
    const c = crearClienteIa(config('hermes', `${base}/v1`));
    await c.mensaje(CLAVE, 'Hermes-4-70B', 'hola');
    expect(JSON.parse(peticiones[0]!.cuerpo).max_tokens).toBe(16);
    await c.mensaje(CLAVE, 'Hermes-4-70B', 'hola', { maxTokens: 4 });
    expect(JSON.parse(peticiones[1]!.cuerpo).max_tokens).toBe(4);
  });
});

describe('Anthropic', () => {
  it('x-api-key y anthropic-version, sin Authorization; modelos y mensaje', async () => {
    const { base, peticiones } = await servidorFalso((p) => {
      if (p.metodo === 'GET' && p.url.startsWith('/v1/models')) {
        return { json: { data: [{ id: 'claude-x', display_name: 'Claude X' }] } };
      }
      if (p.url === '/v1/messages') {
        return {
          json: {
            content: [{ type: 'text', text: 'hola' }],
            usage: { input_tokens: 7, output_tokens: 1 },
          },
        };
      }
      return { status: 404 };
    });
    const c = crearClienteIa(config('anthropic', base));
    expect(await c.modelos(CLAVE)).toEqual([{ id: 'claude-x', nombre: 'Claude X' }]);
    expect(await c.mensaje(CLAVE, 'claude-x', 'hola', { maxTokens: 16 })).toEqual({
      texto: 'hola',
      tokens: { entrada: 7, salida: 1 },
    });
    for (const p of peticiones) {
      expect(p.cabeceras['x-api-key']).toBe(CLAVE);
      expect(p.cabeceras['anthropic-version']).toBe('2023-06-01');
      expect(p.cabeceras.authorization).toBeUndefined();
    }
    const cuerpo = JSON.parse(peticiones[1]!.cuerpo);
    expect(cuerpo).toMatchObject({ model: 'claude-x', max_tokens: 16 });
    sinClaveEnUrl(peticiones);
  });
});

describe('Gemini', () => {
  it('x-goog-api-key en la cabecera, nunca ?key= en la URL', async () => {
    const { base, peticiones } = await servidorFalso((p) => {
      if (p.metodo === 'GET' && p.url.startsWith('/v1beta/models')) {
        return {
          json: {
            models: [
              {
                name: 'models/gemini-x',
                displayName: 'Gemini X',
                supportedGenerationMethods: ['generateContent'],
              },
              {
                name: 'models/embedding-y',
                displayName: 'Embedding',
                supportedGenerationMethods: ['embedContent'],
              },
            ],
          },
        };
      }
      if (p.url === '/v1beta/models/gemini-x:generateContent') {
        return {
          json: {
            candidates: [{ content: { parts: [{ text: 'ho' }, { text: 'la' }] } }],
            usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2 },
          },
        };
      }
      return { status: 404 };
    });
    const c = crearClienteIa(config('gemini', base));
    expect(await c.modelos(CLAVE)).toEqual([{ id: 'gemini-x', nombre: 'Gemini X' }]);
    expect(await c.mensaje(CLAVE, 'models/gemini-x', 'hola', { maxTokens: 16 })).toEqual({
      texto: 'hola',
      tokens: { entrada: 3, salida: 2 },
    });
    for (const p of peticiones) {
      expect(p.cabeceras['x-goog-api-key']).toBe(CLAVE);
      expect(p.cabeceras.authorization).toBeUndefined();
    }
    expect(JSON.parse(peticiones[1]!.cuerpo).generationConfig.maxOutputTokens).toBe(16);
    sinClaveEnUrl(peticiones);
  });

  it('un modelo de Gemini con barra o ".." no arma otra ruta', async () => {
    const c = crearClienteIa(config('gemini', 'http://127.0.0.1:9'));
    const e = await capturar(() => c.mensaje(CLAVE, 'models/../tunedModels/x', 'hola'));
    expect(e.codigo).toBe('ia.modelo_invalido');
  });
});

describe('Ollama (adaptador)', () => {
  it('lista con /api/tags y responde con /api/chat acotado por num_predict', async () => {
    const { base, peticiones } = await servidorFalso((p) => {
      if (p.url === '/api/tags') return { json: { models: [{ name: 'llama3.2' }] } };
      if (p.url === '/api/chat') {
        return { json: { message: { content: 'hola' }, prompt_eval_count: 4, eval_count: 1 } };
      }
      return { status: 404 };
    });
    const c = crearClienteIa(config('ollama', base));
    expect(await c.modelos(null)).toEqual([{ id: 'llama3.2', nombre: 'llama3.2' }]);
    expect(await c.mensaje(null, 'llama3.2', 'hola', { maxTokens: 16 })).toEqual({
      texto: 'hola',
      tokens: { entrada: 4, salida: 1 },
    });
    const cuerpo = JSON.parse(peticiones[1]!.cuerpo);
    expect(cuerpo).toMatchObject({
      model: 'llama3.2',
      stream: false,
      options: { num_predict: 16 },
    });
  });
});

describe('errores de los proveedores', () => {
  const casos: [string, number, unknown, TipoProveedorIa, string][] = [
    [
      '401',
      401,
      { error: { message: `Incorrect API key provided: ${CLAVE}` } },
      'openai',
      'ia.clave_invalida',
    ],
    ['402', 402, { error: { message: 'Payment required' } }, 'compatible', 'ia.sin_saldo'],
    [
      '403 región',
      403,
      { error: { code: 'unsupported_country_region_territory', message: 'Country not supported' } },
      'openai',
      'ia.region',
    ],
    [
      'Gemini región',
      400,
      {
        error: {
          status: 'FAILED_PRECONDITION',
          message: 'User location is not supported for the API use.',
        },
      },
      'gemini',
      'ia.region',
    ],
    [
      'Gemini clave',
      400,
      {
        error: {
          status: 'INVALID_ARGUMENT',
          message: 'API key not valid. Please pass a valid API key.',
          details: [{ reason: 'API_KEY_INVALID' }],
        },
      },
      'gemini',
      'ia.clave_invalida',
    ],
    ['429', 429, { error: { message: 'Rate limit reached' } }, 'openai', 'ia.limite'],
    [
      'insufficient_quota',
      429,
      { error: { type: 'insufficient_quota', message: 'You exceeded your current quota' } },
      'openai',
      'ia.sin_saldo',
    ],
    [
      'Anthropic sin crédito',
      400,
      {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'Your credit balance is too low to access the Anthropic API.',
        },
      },
      'anthropic',
      'ia.sin_saldo',
    ],
    ['500', 500, { error: 'boom' }, 'openai', 'ia.respuesta_rara'],
  ];

  for (const [nombre, status, cuerpo, tipo, codigo] of casos) {
    it(`${nombre} → ${codigo}`, async () => {
      expect(clasificarErrorIa(status, JSON.stringify(cuerpo), tipo)).toBe(codigo);
      const { base } = await servidorFalso(() => ({ status, json: cuerpo }));
      const urlBase = tipo === 'anthropic' || tipo === 'gemini' ? base : `${base}/v1`;
      const e = await capturar(() => crearClienteIa(config(tipo, urlBase)).modelos(CLAVE));
      expect(e.codigo).toBe(codigo);
    });
  }

  it('cuerpos que repiten la clave se resumen sin ella', async () => {
    const { base } = await servidorFalso(() => ({
      status: 500,
      texto: `fallo con la clave ${CLAVE} y Bearer ${CLAVE} y sk-ant-api03-OTRAfalsa123456789`,
    }));
    const e = await capturar(() => crearClienteIa(config('openai', `${base}/v1`)).modelos(CLAVE));
    expect(e.codigo).toBe('ia.respuesta_rara');
    expect(e.message).not.toContain('sk-ant-api03-OTRAfalsa');
    expect(String(e.datos?.detalle ?? '')).not.toContain('sk-ant-api03-OTRAfalsa');
  });

  it('ECONNREFUSED → ia.sin_red', async () => {
    const { base } = await servidorFalso(() => ({ json: {} }));
    for (const s of servidores.splice(0)) await new Promise<void>((r) => s.close(() => r()));
    const e = await capturar(() => crearClienteIa(config('openai', `${base}/v1`)).modelos(CLAVE));
    expect(e.codigo).toBe('ia.sin_red');
  });

  it('timeout → ia.plazo', async () => {
    const { base } = await servidorFalso(() => ({ colgar: true }));
    const c = crearClienteIa(config('openai', `${base}/v1`), undefined, { plazoMs: 150 });
    const e = await capturar(() => c.modelos(CLAVE));
    expect(e.codigo).toBe('ia.plazo');
  });

  it('cancelación con la señal → ia.cancelado', async () => {
    const { base } = await servidorFalso(() => ({ colgar: true }));
    const c = crearClienteIa(config('openai', `${base}/v1`));
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 50);
    const e = await capturar(() => c.modelos(CLAVE, { senal: ctl.signal }));
    expect(e.codigo).toBe('ia.cancelado');
  });

  it('una redirección no se sigue (la clave nunca viaja a otro host)', async () => {
    const otro = await servidorFalso(() => ({ json: { data: [] } }));
    const { base } = await servidorFalso(() => ({
      status: 302,
      cabeceras: { location: `${otro.base}/robar` },
    }));
    const e = await capturar(() => crearClienteIa(config('openai', `${base}/v1`)).modelos(CLAVE));
    expect(e.codigo).toBe('ia.respuesta_rara');
    expect(otro.peticiones).toHaveLength(0);
  });

  it('una respuesta que no es JSON o sin la forma esperada → ia.respuesta_rara', async () => {
    const { base } = await servidorFalso(() => ({ texto: '<html>hola</html>' }));
    const e = await capturar(() => crearClienteIa(config('openai', `${base}/v1`)).modelos(CLAVE));
    expect(e.codigo).toBe('ia.respuesta_rara');
  });

  it('un cuerpo enorme se corta sin agotar la memoria', async () => {
    const { base } = await servidorFalso(() => ({ texto: 'x'.repeat(9 * 1024 * 1024) }));
    const e = await capturar(() => crearClienteIa(config('openai', `${base}/v1`)).modelos(CLAVE));
    expect(e.codigo).toBe('ia.respuesta_rara');
  });
});

describe('probarConexion', () => {
  it('ok con latencia y modelos, sin gastar tokens (solo GET de modelos)', async () => {
    const { base, peticiones } = await servidorFalso(() => ({ json: { data: [{ id: 'm' }] } }));
    const r = await probarConexion(config('openai', `${base}/v1`), CLAVE);
    expect(r.ok).toBe(true);
    expect(r.latenciaMs).toBeGreaterThanOrEqual(0);
    expect(r.modelos).toEqual([{ id: 'm', nombre: 'm' }]);
    expect(r.error).toBeUndefined();
    expect(peticiones.map((p) => p.metodo)).toEqual(['GET']);
  });

  it('error con código y sin la clave en ninguna parte del resultado', async () => {
    const { base } = await servidorFalso(() => ({
      status: 401,
      json: { error: { message: `bad key ${CLAVE}` } },
    }));
    const r = await probarConexion(config('openai', `${base}/v1`), CLAVE);
    expect(r.ok).toBe(false);
    expect(r.error?.codigo).toBe('ia.clave_invalida');
    expect(JSON.stringify(r)).not.toContain(CLAVE);
  });

  it('URL base inválida → ia.url_invalida sin llamar a nada', async () => {
    const r = await probarConexion(config('compatible', 'http://10.1.1.1/v1'), CLAVE);
    expect(r).toMatchObject({ ok: false, error: { codigo: 'ia.url_invalida' } });
  });
});

describe('utilidades', () => {
  it('sanear (registros de recetas y procesos) también enmascara claves de IA', () => {
    const t = sanear(`OPENAI_API_KEY=${CLAVE} GEMINI=AIzaSyFalsa0123456789abcdefghijklmnopq`);
    expect(t).not.toContain(CLAVE);
    expect(t).not.toContain('AIzaSyFalsa0123456789');
  });

  it('config.json guarda ia.proveedores y nunca una clave', () => {
    const c = ConfigSchema.parse({
      ia: {
        proveedores: [
          {
            id: 'groq',
            tipo: 'compatible',
            nombre: 'Groq',
            urlBase: 'https://api.groq.com/openai/v1',
            modelo: null,
            clave: CLAVE,
          },
        ],
      },
    });
    expect(c.ia.proveedores).toEqual([
      {
        id: 'groq',
        tipo: 'compatible',
        nombre: 'Groq',
        urlBase: 'https://api.groq.com/openai/v1',
        modelo: null,
      },
    ]);
    expect(JSON.stringify(c)).not.toContain(CLAVE);
    expect(ConfigSchema.parse({}).ia).toEqual({ proveedores: [] });
    // Una sección ia rota no tira el resto de la configuración.
    expect(ConfigSchema.parse({ ia: 'roto', mcp: { puerto: 7791 } }).mcp.puerto).toBe(7791);
  });

  it('sinSecretosIa quita la clave y patrones de claves conocidos', () => {
    const t = sinSecretosIa(
      `a ${CLAVE} b sk-proj-abcdefghijklmnop1234 c AIzaSyFalsa0123456789abcdefghijklmnopq d Bearer xyz.abc-123`,
      CLAVE,
    );
    expect(t).not.toContain(CLAVE);
    expect(t).not.toContain('sk-proj-abcdefghijklmnop1234');
    expect(t).not.toContain('AIzaSyFalsa0123456789');
    expect(t).not.toContain('xyz.abc-123');
    expect(sinSecretosIa('x'.repeat(1000)).length).toBeLessThanOrEqual(201);
  });

  it('enmascararClave deja solo los 4 últimos', () => {
    expect(enmascararClave(CLAVE)).toBe('****WXYZ');
    expect(enmascararClave('abc')).toBe('****');
  });
});
