import { errorIa } from './errores';
import { forma, numero, objeto, pedirJsonIa } from './http';
import {
  ordenarModelos,
  validarModeloIa,
  type ClienteIa,
  type ContextoCliente,
  type ModeloIa,
} from './proveedores';

/** `models/gemini-x` → `gemini-x`; sin barras ni `..` (no puede armar otra ruta). */
function idModelo(modelo: string): string {
  validarModeloIa(modelo);
  const id = modelo.replace(/^models\//, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(id) || id.includes('..')) {
    throw errorIa('ia.modelo_invalido');
  }
  return id;
}

/**
 * Google Gemini: `GET /v1beta/models` y `POST /v1beta/models/{modelo}:generateContent`. La
 * clave va SIEMPRE en la cabecera `x-goog-api-key`, nunca como `?key=` en la URL.
 */
export function clienteGemini(ctx: ContextoCliente): ClienteIa {
  const cabeceras = (clave: string | null): Record<string, string> =>
    clave ? { 'x-goog-api-key': clave } : {};
  return {
    async modelos(clave, o) {
      const k = ctx.exigirClave(clave);
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/v1beta/models?pageSize=1000`,
          metodo: 'GET',
          cabeceras: cabeceras(k),
          clave: k,
          ...(o?.senal ? { senal: o.senal } : {}),
          plazoMs: ctx.plazoMs,
          fetchImpl: ctx.fetchImpl,
        }),
      );
      if (!d || !Array.isArray(d.models)) throw forma();
      const lista: ModeloIa[] = [];
      for (const m of d.models) {
        const x = objeto(m);
        if (typeof x?.name !== 'string') continue;
        const metodos = x.supportedGenerationMethods;
        // Solo los que generan texto (no los de embeddings).
        if (Array.isArray(metodos) && !metodos.includes('generateContent')) continue;
        const id = x.name.replace(/^models\//, '');
        if (!id) continue;
        const nombre = typeof x.displayName === 'string' && x.displayName ? x.displayName : id;
        lista.push({ id, nombre });
      }
      return ordenarModelos(lista);
    },

    async mensaje(clave, modelo, texto, o) {
      const id = idModelo(modelo);
      const k = ctx.exigirClave(clave);
      const d = objeto(
        await pedirJsonIa({
          tipo: ctx.tipo,
          url: `${ctx.base}/v1beta/models/${id}:generateContent`,
          metodo: 'POST',
          cabeceras: cabeceras(k),
          cuerpo: {
            contents: [{ role: 'user', parts: [{ text: texto }] }],
            generationConfig: { maxOutputTokens: ctx.maxTokens(o) },
          },
          clave: k,
          ...(o?.senal ? { senal: o.senal } : {}),
          plazoMs: ctx.plazoMs,
          fetchImpl: ctx.fetchImpl,
        }),
      );
      if (!d || !Array.isArray(d.candidates)) throw forma();
      const partes = objeto(objeto(d.candidates[0])?.content)?.parts;
      const textoRespuesta = Array.isArray(partes)
        ? partes
            .map((p) => objeto(p)?.text)
            .filter((t): t is string => typeof t === 'string')
            .join('')
        : '';
      const uso = objeto(d.usageMetadata);
      const entrada = numero(uso?.promptTokenCount);
      const salida = numero(uso?.candidatesTokenCount);
      return {
        texto: textoRespuesta,
        ...(entrada !== undefined && salida !== undefined ? { tokens: { entrada, salida } } : {}),
      };
    },
  };
}
