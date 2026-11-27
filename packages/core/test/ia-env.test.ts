import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  agregarEnvAGitignore,
  aplicarBloqueEnvIa,
  bloqueEnvIa,
  bloqueEnvIaEnmascarado,
  escribirEnvIa,
  estadoGitignore,
  limpiarRespaldosEnv,
  type OpcionesEscribirEnvIa,
  MARCA_FIN_IA,
  MARCA_INICIO_IA,
} from '../src/ia/envIa';
import type { ConfigProveedorIa, TipoProveedorIa } from '../src/ia/proveedores';
import { carpetaTemporal } from './temporales';

const BOM = String.fromCharCode(0xfeff);
const CLAVE = 'sk-falso-CENTINELA-0123456789abcdefWXYZ';

const config = (
  tipo: TipoProveedorIa,
  urlBase: string | null = null,
  modelo: string | null = null,
): ConfigProveedorIa => ({ id: `p-${tipo}`, tipo, nombre: tipo, urlBase, modelo });

/** Opciones de escritura de prueba: sitio fijo y .env no versionado. */
const opc = (
  carpetaRespaldos: string,
  extra: Partial<OpcionesEscribirEnvIa> = {},
): OpcionesEscribirEnvIa => ({
  confirmado: true,
  carpetaRespaldos,
  sitioId: 'mi-sitio',
  versionado: async () => false,
  ...extra,
});

const lineas = (b: string): string[] => b.split('\n').filter((l) => l && !l.startsWith('#'));

describe('bloqueEnvIa', () => {
  it('OpenAI: clave, URL base y modelo entre marcas propias', () => {
    const b = bloqueEnvIa(config('openai'), CLAVE, 'gpt-x');
    expect(b.startsWith(`${MARCA_INICIO_IA}\n`)).toBe(true);
    expect(b.endsWith(`${MARCA_FIN_IA}\n`)).toBe(true);
    expect(lineas(b)).toEqual([
      `OPENAI_API_KEY=${CLAVE}`,
      'OPENAI_BASE_URL=https://api.openai.com/v1',
      'AI_MODEL=gpt-x',
    ]);
  });

  it('Hermes y compatibles usan las variables OPENAI_* con su URL base', () => {
    expect(lineas(bloqueEnvIa(config('hermes'), CLAVE))).toEqual([
      `OPENAI_API_KEY=${CLAVE}`,
      'OPENAI_BASE_URL=https://inference-api.nousresearch.com/v1',
    ]);
    expect(
      lineas(bloqueEnvIa(config('compatible', 'https://openrouter.ai/api/v1', 'a/b:free'), CLAVE)),
    ).toEqual([
      `OPENAI_API_KEY=${CLAVE}`,
      'OPENAI_BASE_URL=https://openrouter.ai/api/v1',
      'AI_MODEL=a/b:free',
    ]);
  });

  it('Anthropic y Gemini con su variable; URL base solo si se cambió', () => {
    expect(lineas(bloqueEnvIa(config('anthropic'), CLAVE))).toEqual([`ANTHROPIC_API_KEY=${CLAVE}`]);
    expect(lineas(bloqueEnvIa(config('anthropic', 'https://proxy.ejemplo.com'), CLAVE))).toEqual([
      `ANTHROPIC_API_KEY=${CLAVE}`,
      'ANTHROPIC_BASE_URL=https://proxy.ejemplo.com',
    ]);
    expect(lineas(bloqueEnvIa(config('gemini', null, 'gemini-x'), CLAVE))).toEqual([
      `GEMINI_API_KEY=${CLAVE}`,
      'AI_MODEL=gemini-x',
    ]);
  });

  it('Ollama sin clave: OLLAMA_HOST y la URL compatible con OpenAI', () => {
    expect(lineas(bloqueEnvIa(config('ollama', 'http://127.0.0.1:11500'), ''))).toEqual([
      'OLLAMA_HOST=http://127.0.0.1:11500',
      'OLLAMA_BASE_URL=http://127.0.0.1:11500',
      'OPENAI_BASE_URL=http://127.0.0.1:11500/v1',
    ]);
  });

  it('respeta el lector del proyecto y rechaza saltos de línea', () => {
    const conComilla = "sk-falso-con'comilla";
    expect(bloqueEnvIa(config('openai'), conComilla, undefined, 'dotenv')).toContain(
      `OPENAI_API_KEY="${conComilla}"`,
    );
    expect(() => bloqueEnvIa(config('openai'), 'sk-falso\nX=1')).toThrow(ErrorWolf);
    expect(() => bloqueEnvIa(config('openai'), CLAVE, 'm\nX=1')).toThrow(ErrorWolf);
  });

  it('sin clave para un proveedor que la exige falla con ia.sin_clave', () => {
    try {
      bloqueEnvIa(config('gemini'), '');
      throw new Error('no falló');
    } catch (e) {
      expect((e as ErrorWolf).codigo).toBe('ia.sin_clave');
    }
  });

  it('la versión enmascarada nunca muestra la clave', () => {
    const b = bloqueEnvIaEnmascarado(config('openai'), CLAVE, 'gpt-x');
    expect(b).not.toContain(CLAVE);
    expect(b).toContain('OPENAI_API_KEY=****WXYZ');
    expect(b).toContain('AI_MODEL=gpt-x');
    expect(bloqueEnvIaEnmascarado(config('anthropic'), null)).toContain('ANTHROPIC_API_KEY=****');
  });
});

describe('aplicarBloqueEnvIa', () => {
  const bloque = bloqueEnvIa(config('openai'), CLAVE, 'gpt-x');

  it('agrega al final y conserva lo demás y los finales CRLF', () => {
    const r = aplicarBloqueEnvIa('APP_NAME=x\r\nDB_HOST=127.0.0.1\r\n', bloque);
    expect(r.conflictos).toEqual([]);
    expect(r.texto.startsWith('APP_NAME=x\r\nDB_HOST=127.0.0.1\r\n')).toBe(true);
    expect(r.texto).toContain(`\r\n${MARCA_INICIO_IA}\r\nOPENAI_API_KEY=${CLAVE}\r\n`);
    expect(r.texto.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('reemplaza el bloque anterior en su sitio', () => {
    const viejo = bloqueEnvIa(config('anthropic'), 'sk-falso-vieja');
    const r = aplicarBloqueEnvIa(`A=1\n${viejo}B=2\n`, bloque);
    expect(r.texto).not.toContain('sk-falso-vieja');
    expect(r.texto).not.toContain('ANTHROPIC_API_KEY');
    expect(r.texto).toBe(`A=1\n${bloque}B=2\n`);
  });

  it('no pisa una clave ajena distinta sin confirmación', () => {
    const actual = 'OPENAI_API_KEY=sk-falso-del-usuario\nAI_MODEL=gpt-x\n';
    try {
      aplicarBloqueEnvIa(actual, bloque);
      throw new Error('no falló');
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorWolf);
      expect((e as ErrorWolf).codigo).toBe('ia.env_conflicto');
      expect((e as ErrorWolf).datos).toEqual({ claves: 'OPENAI_API_KEY' });
      expect((e as ErrorWolf).message).not.toContain('sk-falso-del-usuario');
    }
    const r = aplicarBloqueEnvIa(actual, bloque, { reemplazarAjenas: true });
    expect(r.conflictos).toEqual(['OPENAI_API_KEY']);
    expect(r.texto).not.toContain('sk-falso-del-usuario');
    // La de igual valor fuera del bloque se quita para que no haya dos definiciones.
    expect(r.texto.match(/^AI_MODEL=/gm)).toHaveLength(1);
  });
});

describe('escribirEnvIa', () => {
  it('exige confirmación', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await expect(
      escribirEnvIa(dir, 'x', { ...opc(dir), confirmado: false as never }),
    ).rejects.toMatchObject({ codigo: 'ia.env_sin_confirmar' });
  });

  it('crea el .env si no existe, sin copia', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    const resp = path.join(dir, 'respaldos');
    const bloque = bloqueEnvIa(config('gemini'), CLAVE);
    const r = await escribirEnvIa(dir, bloque, opc(resp));
    expect(r.respaldo).toBeNull();
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toBe(bloque);
  });

  it('copia el .env anterior fuera del proyecto y escribe de forma atómica', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    const resp = path.join(await carpetaTemporal('pel-envia-r-'), 'env');
    await writeFile(path.join(dir, '.env'), `${BOM}APP=1\n`);
    const bloque = bloqueEnvIa(config('gemini'), CLAVE);
    const r = await escribirEnvIa(dir, bloque, opc(resp));
    expect(r.respaldo).not.toBeNull();
    expect(path.dirname(r.respaldo!)).toBe(resp);
    expect(await readFile(r.respaldo!, 'utf8')).toBe(`${BOM}APP=1\n`);
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toBe(`${BOM}APP=1\n${bloque}`);
    expect((await readdir(dir)).filter((n) => n.includes('tmp'))).toEqual([]);
  });

  it('con conflicto no toca nada', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await writeFile(path.join(dir, '.env'), 'GEMINI_API_KEY=otra\n');
    await expect(
      escribirEnvIa(dir, bloqueEnvIa(config('gemini'), CLAVE), opc(path.join(dir, 'r'))),
    ).rejects.toMatchObject({ codigo: 'ia.env_conflicto' });
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toBe('GEMINI_API_KEY=otra\n');
  });
});

describe('.gitignore', () => {
  for (const patron of ['.env', '.env*', '/.env', '*.env', '**/.env']) {
    it(`"${patron}" ignora .env`, async () => {
      const dir = await carpetaTemporal('pel-gi-');
      await writeFile(path.join(dir, '.gitignore'), `node_modules\n# comentario\n${patron}\n`);
      expect(await estadoGitignore(dir)).toMatchObject({ existe: true, ignoraEnv: true });
    });
  }

  for (const patron of ['.env.example', '.env/', '# .env', 'env', '.env.*']) {
    it(`"${patron}" no ignora .env`, async () => {
      const dir = await carpetaTemporal('pel-gi-');
      await writeFile(path.join(dir, '.gitignore'), `${patron}\n`);
      expect(await estadoGitignore(dir)).toMatchObject({ existe: true, ignoraEnv: false });
    });
  }

  it('una negación posterior anula la regla', async () => {
    const dir = await carpetaTemporal('pel-gi-');
    await writeFile(path.join(dir, '.gitignore'), '.env*\n!.env\n');
    expect(await estadoGitignore(dir)).toMatchObject({ existe: true, ignoraEnv: false });
  });

  it('sin .gitignore', async () => {
    const dir = await carpetaTemporal('pel-gi-');
    expect(await estadoGitignore(dir)).toMatchObject({ existe: false, ignoraEnv: false });
  });

  it('agregarEnvAGitignore deja copia y conserva el contenido y CRLF', async () => {
    const dir = await carpetaTemporal('pel-gi-');
    const resp = path.join(await carpetaTemporal('pel-gi-r-'), 'gi');
    await writeFile(path.join(dir, '.gitignore'), 'vendor\r\nnode_modules');
    const r = await agregarEnvAGitignore(dir, resp);
    expect(await readFile(path.join(dir, '.gitignore'), 'utf8')).toBe(
      'vendor\r\nnode_modules\r\n.env\r\n',
    );
    expect(await readFile(r.respaldo!, 'utf8')).toBe('vendor\r\nnode_modules');
    expect(await estadoGitignore(dir)).toMatchObject({ existe: true, ignoraEnv: true });
    // Una segunda vez no duplica.
    await agregarEnvAGitignore(dir, resp);
    expect((await readFile(path.join(dir, '.gitignore'), 'utf8')).match(/^\.env$/gm)).toHaveLength(
      1,
    );
  });

  it('agregarEnvAGitignore crea el archivo si no existe', async () => {
    const dir = await carpetaTemporal('pel-gi-');
    const r = await agregarEnvAGitignore(dir, path.join(dir, 'r'));
    expect(r.respaldo).toBeNull();
    expect(await readFile(path.join(dir, '.gitignore'), 'utf8')).toBe('.env\n');
  });
});

describe('.env versionado en git', () => {
  it('estadoGitignore informa envVersionado con el comprobador dado (null si no hay)', async () => {
    const dir = await carpetaTemporal('pel-gi-');
    await writeFile(path.join(dir, '.gitignore'), '.env\n');
    expect(await estadoGitignore(dir)).toEqual({
      existe: true,
      ignoraEnv: true,
      envVersionado: null,
    });
    expect(await estadoGitignore(dir, { versionado: async () => true })).toEqual({
      existe: true,
      ignoraEnv: true,
      envVersionado: true,
    });
  });

  it('escribirEnvIa se niega si git ya versiona el .env, sin tocar nada', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await writeFile(path.join(dir, '.env'), 'APP=1\n');
    const resp = path.join(dir, 'r');
    await expect(
      escribirEnvIa(
        dir,
        bloqueEnvIa(config('gemini'), CLAVE),
        opc(resp, { versionado: async () => true }),
      ),
    ).rejects.toMatchObject({ codigo: 'ia.env_versionado' });
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toBe('APP=1\n');
    // Con la confirmación aparte, sí.
    await escribirEnvIa(
      dir,
      bloqueEnvIa(config('gemini'), CLAVE),
      opc(resp, { versionado: async () => true, aceptarVersionado: true }),
    );
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toContain('GEMINI_API_KEY=');
  });

  it('desconocido (sin git) no bloquea', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await escribirEnvIa(
      dir,
      bloqueEnvIa(config('gemini'), CLAVE),
      opc(path.join(dir, 'r'), { versionado: async () => null }),
    );
    expect(await readFile(path.join(dir, '.env'), 'utf8')).toContain('GEMINI_API_KEY=');
  });
});

describe('copias del .env', () => {
  it('llevan el id del sitio, se quedan en 5 por sitio y se limpian al borrar la clave', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    const otro = await carpetaTemporal('pel-envia-');
    const resp = path.join(await carpetaTemporal('pel-envia-r-'), 'env');
    await writeFile(path.join(dir, '.env'), 'APP=1\n');
    await writeFile(path.join(otro, '.env'), 'APP=2\n');
    await escribirEnvIa(otro, bloqueEnvIa(config('gemini'), CLAVE), opc(resp, { sitioId: 'otro' }));
    for (let i = 0; i < 7; i++) {
      await escribirEnvIa(
        dir,
        bloqueEnvIa(config('gemini'), `sk-falso-ronda-${i}-0123456789`),
        opc(resp),
      );
    }
    const nombres = await readdir(resp);
    const propias = nombres.filter((n) => n.startsWith('env-mi-sitio-'));
    expect(propias).toHaveLength(5);
    expect(nombres.filter((n) => n.startsWith('env-otro-'))).toHaveLength(1);
    await limpiarRespaldosEnv(resp, 'mi-sitio');
    expect((await readdir(resp)).filter((n) => n.startsWith('env-mi-sitio-'))).toEqual([]);
    expect((await readdir(resp)).filter((n) => n.startsWith('env-otro-'))).toHaveLength(1);
    await limpiarRespaldosEnv(resp);
    expect((await readdir(resp)).filter((n) => n.startsWith('env-'))).toEqual([]);
  });

  it('un id de sitio raro se rechaza', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await expect(
      escribirEnvIa(dir, bloqueEnvIa(config('gemini'), CLAVE), opc(dir, { sitioId: '../x' })),
    ).rejects.toThrow();
    await expect(limpiarRespaldosEnv(dir, '../x')).rejects.toThrow();
  });

  it('limpiar una carpeta que no existe no falla', async () => {
    const dir = await carpetaTemporal('pel-envia-');
    await expect(limpiarRespaldosEnv(path.join(dir, 'nada'))).resolves.toBeUndefined();
  });
});
