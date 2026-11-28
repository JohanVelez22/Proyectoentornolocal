import { describe, expect, it } from 'vitest';
import { diffLineas, enmascararLinea } from '../src/asistentes/diff';

const numeradas = (n: number): string =>
  Array.from({ length: n }, (_, i) => `linea ${i + 1}`).join('\n');

describe('diffLineas: tramos iguales', () => {
  it('colapsa los tramos iguales largos en «… N líneas sin cambios …»', () => {
    const base = numeradas(40);
    const l = diffLineas(`X\n${base}\nY`, `X2\n${base}\nY2`);
    const omitida = l.find((x) => x.tipo === 'omitido');
    expect(omitida).toBeDefined();
    expect(omitida!.omitidas).toBe(40 - 4);
    expect(omitida!.texto).toBe('… 36 líneas sin cambios …');
    expect(l.length).toBeLessThan(15);
  });

  it('un tramo igual de hasta 2·contexto líneas no se colapsa', () => {
    const l = diffLineas(`A\n${numeradas(4)}\nB`, `A2\n${numeradas(4)}\nB2`);
    expect(l.some((x) => x.tipo === 'omitido')).toBe(false);
  });

  it('no deja una línea «+» vacía al final cuando el texto acaba en salto de línea', () => {
    expect(diffLineas('', 'a\nb\n')).toEqual([
      { tipo: 'mas', texto: 'a' },
      { tipo: 'mas', texto: 'b' },
    ]);
    const m = diffLineas('x\n', 'x\ny\n');
    expect(m.filter((x) => x.tipo === 'mas')).toEqual([{ tipo: 'mas', texto: 'y' }]);
  });
});

describe('enmascararLinea', () => {
  it('oculta Authorization y las claves con token, key, secret, password o pass', () => {
    const casos: [string, string][] = [
      ['GITHUB_TOKEN = "ghp_SECRETO"', 'GITHUB_TOKEN = "***"'],
      ['  "apiKey": "sk-123",', '  "apiKey": "***",'],
      ['"Authorization": "Bearer abc.def"', '"Authorization": "***"'],
      ['Authorization: Bearer abc', 'Authorization: ***'],
      ['client_secret: s3cr3t # nota', 'client_secret: ***'],
      ['DB_PASSWORD = "x"', 'DB_PASSWORD = "***"'],
      ['MY_PASS=hola', 'MY_PASS=***'],
      [
        'headers = { "X-Api-Key" = "k1", "Otro" = "ok" }',
        'headers = { "X-Api-Key" = "***", "Otro" = "ok" }',
      ],
      ['"args": ["--api-key=abc123", "--otro"]', '"args": ["--api-key=***", "--otro"]'],
    ];
    for (const [entrada, esperado] of casos) expect(enmascararLinea(entrada)).toBe(esperado);
  });

  it('no toca claves normales ni las referencias a variables de entorno', () => {
    for (const t of [
      '"url": "http://127.0.0.1:47123/mcp"',
      'bearer_token_env_var = "WOLFCORE_MCP_TOKEN"',
      '"Authorization": "Bearer ${WOLFCORE_MCP_TOKEN}"',
      '"Authorization": "Bearer ${env:WOLFCORE_MCP_TOKEN}"',
      '"Authorization": "Bearer {env:WOLFCORE_MCP_TOKEN}"',
      'Authorization: Bearer ${WOLFCORE_MCP_TOKEN}',
    ]) {
      expect(enmascararLinea(t)).toBe(t);
    }
  });
});
