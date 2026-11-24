import { forma, numero, objeto, pedirJsonIa } from './http';
import {
  esModeloGratis,
  ordenarModelos,
  validarModeloIa,
  type ClienteIa,
  type ContextoCliente,
  type ModeloIa,
} from './proveedores';

/**
 * OpenAI y compatibles (Hermes de Nous Research, OpenRouter, Groq, Mistral, DeepSeek, LM
 * Studio): `GET {base}/models` y `POST {base}/chat/completions` con `Authorization: Bearer`.
 */
export function clienteOpenAi(ctx: ContextoCliente): ClienteIa {
  const cabeceras = (clave: string | null): Record<string, string> =>
    clave ? { authorization: `Bearer ${clave}` } : {};
  return {
    async modelos(clave, o) {
      const k = ctx.exigirClave(clave);
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/models`,
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
        const o = objeto(m);
        const id = o?.id;
        if (typeof id !== 'string' || !id) continue;
        const precio = objeto(o?.pricing);
        const gratis = esModeloGratis({
          id,
          pricing: {
            ...(typeof precio?.prompt === 'string' ? { prompt: precio.prompt } : {}),
            ...(typeof precio?.completion === 'string' ? { completion: precio.completion } : {}),
          },
        });
        lista.push({ id, nombre: id, ...(gratis ? { gratis } : {}) });
      }
      return ordenarModelos(lista);
    },

    async mensaje(clave, modelo, texto, o) {
      validarModeloIa(modelo);
      const k = ctx.exigirClave(clave);
      const max = ctx.maxTokens(o);
      // Los modelos nuevos de OpenAI rechazan max_tokens; los compatibles solo conocen ese.
      const limite = ctx.tipo === 'openai' ? { max_completion_tokens: max } : { max_tokens: max };
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/chat/completions`,
          metodo: 'POST',
          cabeceras: cabeceras(k),
          cuerpo: { model: modelo, messages: [{ role: 'user', content: texto }], ...limite },
          clave: k,
          ...(o?.senal ? { senal: o.senal } : {}),
          plazoMs: ctx.plazoMs,
          fetchImpl: ctx.fetchImpl,
        }),
      );
      const eleccion = Array.isArray(d?.choices) ? objeto(d.choices[0]) : null;
      if (!eleccion) throw forma();
      const contenido = objeto(eleccion.message)?.content;
      const uso = objeto(d?.usage);
      const entrada = numero(uso?.prompt_tokens);
      const salida = numero(uso?.completion_tokens);
      return {
        texto: typeof contenido === 'string' ? contenido : '',
        ...(entrada !== undefined && salida !== undefined ? { tokens: { entrada, salida } } : {}),
      };
    },
  };
}
