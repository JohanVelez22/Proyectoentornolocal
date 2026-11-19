import { forma, numero, objeto, pedirJsonIa } from './http';
import {
  ordenarModelos,
  validarModeloIa,
  type ClienteIa,
  type ContextoCliente,
  type ModeloIa,
} from './proveedores';

/** Versión de la API de Anthropic que se envía en `anthropic-version`. */
export const VERSION_ANTHROPIC = '2023-06-01';

/** Anthropic: `GET /v1/models` y `POST /v1/messages` con `x-api-key` y `anthropic-version`. */
export function clienteAnthropic(ctx: ContextoCliente): ClienteIa {
  const cabeceras = (clave: string | null): Record<string, string> => ({
    ...(clave ? { 'x-api-key': clave } : {}),
    'anthropic-version': VERSION_ANTHROPIC,
  });
  return {
    async modelos(clave, o) {
      const k = ctx.exigirClave(clave);
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/v1/models?limit=1000`,
          metodo: 'GET',
          cabeceras: cabeceras(k),
          clave: k,
          ...(o?.senal ? { senal: o.senal } : {}),
          plazoMs: ctx.plazoMs,
          fetchImpl: ctx.fetchImpl,
        }),
      );
      if (!d || !Array.isArray(d.data)) throw forma();
      const lista: ModeloIa[] = [];
      for (const m of d.data) {
        const x = objeto(m);
        if (typeof x?.id !== 'string' || !x.id) continue;
        const nombre = typeof x.display_name === 'string' && x.display_name ? x.display_name : x.id;
        lista.push({ id: x.id, nombre });
      }
      return ordenarModelos(lista);
    },

    async mensaje(clave, modelo, texto, o) {
      validarModeloIa(modelo);
      const k = ctx.exigirClave(clave);
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/v1/messages`,
          metodo: 'POST',
          cabeceras: cabeceras(k),
          cuerpo: {
            model: modelo,
            max_tokens: ctx.maxTokens(o),
            messages: [{ role: 'user', content: texto }],
          },
          clave: k,
          ...(o?.senal ? { senal: o.senal } : {}),
          plazoMs: ctx.plazoMs,
          fetchImpl: ctx.fetchImpl,
        }),
      );
      if (!d || !Array.isArray(d.content)) throw forma();
      const partes = d.content
        .map((p) => objeto(p))
        .filter((p) => p?.type === 'text' && typeof p.text === 'string')
        .map((p) => p!.text as string);
      const uso = objeto(d.usage);
      const entrada = numero(uso?.input_tokens);
      const salida = numero(uso?.output_tokens);
      return {
        texto: partes.join(''),
        ...(entrada !== undefined && salida !== undefined ? { tokens: { entrada, salida } } : {}),
      };
    },
  };
}
