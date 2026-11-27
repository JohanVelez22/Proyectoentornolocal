import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import {
  escribirAtomico,
  ponerVariableEnv,
  restaurarUrlBaseSincrono,
  UrlBase,
} from '../src/sitios/urlbase';
import { SitioSchema, type Sitio } from '../src/tipos';
import { extraerUrlTunel } from '../src/tuneles/url';

describe('extraerUrlTunel', () => {
  const banner = [
    '2026-11-17T10:00:00Z INF Requesting new quick Tunnel on trycloudflare.com...',
    '2026-11-17T10:00:01Z INF POST https://api.trycloudflare.com/tunnel',
    '2026-11-17T10:00:02Z INF +--------------------------------------------------+',
    '2026-11-17T10:00:02Z INF |  https://lucky-words-here.trycloudflare.com      |',
    '2026-11-17T10:00:02Z INF +--------------------------------------------------+',
  ].join('\n');
  it('devuelve la URL del túnel e ignora api.trycloudflare.com', () => {
    expect(extraerUrlTunel(banner)).toBe('https://lucky-words-here.trycloudflare.com');
  });
  it('null si solo aparece la API o nada', () => {
    expect(extraerUrlTunel('POST https://api.trycloudflare.com/tunnel')).toBeNull();
    expect(extraerUrlTunel('')).toBeNull();
  });
});

describe('ponerVariableEnv', () => {
  it('reemplaza conservando posición y CRLF', () => {
    const src = 'A=1\r\nAPP_URL=http://x\r\nB=2\r\n';
    expect(ponerVariableEnv(src, 'APP_URL', 'https://t.trycloudflare.com/')).toBe(
      'A=1\r\nAPP_URL=https://t.trycloudflare.com/\r\nB=2\r\n',
    );
  });
  it('conserva comillas dobles y simples', () => {
    expect(ponerVariableEnv('APP_URL="http://x"\n', 'APP_URL', 'u')).toBe('APP_URL="u"\n');
    expect(ponerVariableEnv("APP_URL='http://x'\n", 'APP_URL', 'u')).toBe("APP_URL='u'\n");
  });
  it('agrega la ausente al final con el salto del archivo', () => {
    expect(ponerVariableEnv('A=1\r\nB=2\r\n', 'X', 'v')).toBe('A=1\r\nB=2\r\nX=v\r\n');
    expect(ponerVariableEnv('A=1', 'X', 'v')).toBe('A=1\nX=v\n');
  });
  it('null elimina la línea', () => {
    expect(ponerVariableEnv('A=1\nX=v\nB=2\n', 'X', null)).toBe('A=1\nB=2\n');
  });
  it('no confunde prefijos de nombre', () => {
    expect(ponerVariableEnv('APP_URL_X=1\n', 'APP_URL', 'u')).toBe('APP_URL_X=1\nAPP_URL=u\n');
  });
});

describe('UrlBase', () => {
  let base: string;
  let carpeta: string;
  let rutas: Rutas;
  let llamadas: { cmd: string; args: string[]; opts?: { timeoutMs?: number; cwd?: string } }[];
  let codigo: number;
  const exec: Ejecutor = async (cmd, args, opts) => {
    llamadas.push({ cmd, args, opts });
    return { codigo, stdout: '', stderr: codigo ? 'boom' : '' };
  };
  const sitio = (extra: Partial<Sitio> = {}): Sitio =>
    SitioSchema.parse({
      id: 's1',
      nombre: 'S',
      dominio: 's.test',
      carpeta,
      tipo: 'laravel',
      php: '8.3',
      urlBaseVar: 'APP_URL',
      ...extra,
    });
  const env = () => path.join(carpeta, '.env');
  const estadoPath = () => path.join(rutas.base, 'run', 'urlbase-s1.json');
  const respaldoPath = () => path.join(rutas.base, 'run', 'urlbase-s1.respaldo');
  const copiasRespaldo = () =>
    readdirSync(path.join(rutas.base, 'run')).filter((f) => f.startsWith('urlbase-s1.respaldo-'));

  beforeEach(() => {
    base = mkdtempSync(path.join(os.tmpdir(), 'pel-ub-'));
    carpeta = path.join(base, 'Mi Sitio ñ');
    mkdirSync(carpeta, { recursive: true });
    rutas = new Rutas(path.join(base, 'datos'));
    llamadas = [];
    codigo = 0;
  });
  afterEach(() => rmSync(base, { recursive: true, force: true }));

  it('variable ausente: se agrega y al restaurar el .env queda idéntico (sin salto final)', async () => {
    const original = 'APP_NAME=Demo\r\nAPP_KEY=abc';
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a-b.trycloudflare.com/');
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL=https://a-b.trycloudflare.com/\r\n');
    expect(readFileSync(respaldoPath(), 'utf8')).toBe(original);
    expect(existsSync(path.join(carpeta, '.env.pel-respaldo'))).toBe(false);
    await ub.restaurar(sitio());
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(existsSync(estadoPath())).toBe(false);
    expect(existsSync(respaldoPath())).toBe(false);
  });

  it('variable ausente con salto final: queda idéntico', async () => {
    const original = 'APP_NAME=Demo\nAPP_KEY=abc\n';
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    await ub.restaurar(sitio());
    expect(readFileSync(env(), 'utf8')).toBe(original);
  });

  it('variable existente con comillas: se restaura la línea exacta', async () => {
    const original = 'A=1\r\nAPP_URL = "http://wolf.test"  \r\nB=2\r\n';
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL = "https://a.trycloudflare.com/"');
    await ub.restaurar(sitio());
    expect(readFileSync(env(), 'utf8')).toBe(original);
  });

  it('aplicar dos veces no pierde el valor original ni pisa el respaldo', async () => {
    const original = 'APP_URL=http://wolf.test\n';
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    await ub.aplicar(sitio(), 'https://b.trycloudflare.com/');
    expect(readFileSync(respaldoPath(), 'utf8')).toBe(original);
    await ub.restaurar(sitio());
    expect(readFileSync(env(), 'utf8')).toBe(original);
  });

  it('guarda el estado previo en run/urlbase-<id>.json', async () => {
    writeFileSync(env(), 'APP_URL="http://wolf.test"\n');
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    expect(JSON.parse(readFileSync(estadoPath(), 'utf8'))).toEqual({
      existia: true,
      hashAplicado: expect.any(String),
      sitio: { carpeta, urlBaseVar: 'APP_URL', tipo: 'laravel', php: '8.3' },
      valor: 'http://wolf.test',
      lineaOriginal: 'APP_URL="http://wolf.test"',
    });
  });

  it('sin .env no hace nada y avisa', async () => {
    const ub = new UrlBase({ rutas, ejecutor: exec });
    expect(await ub.aplicar(sitio(), 'https://a.trycloudflare.com/')).toBe(
      'El sitio no tiene .env',
    );
    expect(existsSync(env())).toBe(false);
  });

  it('laravel con config.php en caché ejecuta config:clear con el php del sitio', async () => {
    writeFileSync(env(), 'A=1\n');
    mkdirSync(path.join(carpeta, 'bootstrap', 'cache'), { recursive: true });
    writeFileSync(path.join(carpeta, 'bootstrap', 'cache', 'config.php'), '<?php');
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    await ub.restaurar(sitio());
    expect(llamadas).toHaveLength(2);
    expect(llamadas[0]!.cmd).toBe(path.join(rutas.bin('php', '8.3'), 'php.exe'));
    expect(llamadas[0]!.args).toEqual(['artisan', 'config:clear']);
    expect(llamadas[0]!.opts).toEqual({ timeoutMs: 30_000, cwd: carpeta });
  });

  it('si config:clear falla devuelve mensaje sin lanzar y el .env igual cambia', async () => {
    writeFileSync(env(), 'A=1\n');
    mkdirSync(path.join(carpeta, 'bootstrap', 'cache'), { recursive: true });
    writeFileSync(path.join(carpeta, 'bootstrap', 'cache', 'config.php'), '<?php');
    codigo = 1;
    const ub = new UrlBase({ rutas, ejecutor: exec });
    const m = await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    expect(m).toContain('caché de configuración');
    expect(readFileSync(env(), 'utf8')).toContain('APP_URL=');
  });

  it('dos APP_URL y un byte latin1: idéntico byte a byte tras aplicar y restaurar', async () => {
    const original = Buffer.concat([
      Buffer.from('APP_URL=http://a.test\r\nNOMBRE=Jos'),
      Buffer.from([0xe9]),
      Buffer.from('\r\nAPP_URL=http://b.test\r\n'),
    ]);
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    const medio = readFileSync(env()).toString('latin1');
    expect(medio).toContain('APP_URL=https://a.trycloudflare.com/\r\n');
    expect(medio).toContain('APP_URL=http://b.test');
    await ub.restaurar(sitio());
    expect(readFileSync(env()).equals(original)).toBe(true);
    expect(existsSync(respaldoPath())).toBe(false);
  });

  it('si el usuario editó el .env entre medias, restaura solo la línea', async () => {
    writeFileSync(env(), 'APP_URL=http://a.test\nAPP_URL=http://b.test\n');
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    writeFileSync(env(), readFileSync(env(), 'utf8') + 'NUEVA=1\n');
    const aviso = await ub.restaurar(sitio());
    expect(readFileSync(env(), 'utf8')).toBe(
      'APP_URL=http://a.test\nAPP_URL=http://b.test\nNUEVA=1\n',
    );
    // Restauración por línea: el respaldo se conserva con fecha y se avisa.
    expect(existsSync(respaldoPath())).toBe(false);
    const copias = copiasRespaldo();
    expect(copias).toHaveLength(1);
    expect(readFileSync(path.join(rutas.base, 'run', copias[0]!), 'utf8')).toBe(
      'APP_URL=http://a.test\nAPP_URL=http://b.test\n',
    );
    expect(aviso).toContain('se restauró solo la variable APP_URL');
    expect(aviso).toContain(copias[0]!);
  });

  it('restauración por hash borra el respaldo sin dejar copias', async () => {
    writeFileSync(env(), 'APP_URL=http://a.test\n');
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    expect(await ub.restaurar(sitio())).toBeNull();
    expect(copiasRespaldo()).toEqual([]);
    expect(existsSync(respaldoPath())).toBe(false);
  });

  describe('sitio editado con el túnel abierto', () => {
    let carpetaB: string;
    const original = Buffer.concat([
      Buffer.from('APP_NAME=A\r\nAPP_URL="http://a.test"\r\nN=Jos'),
      Buffer.from([0xe9]),
      Buffer.from('\r\n'),
    ]);
    const envB = 'APP_NAME=B\nAPP_URL=http://b.test\n';
    beforeEach(() => {
      carpetaB = path.join(base, 'Proyecto B');
      mkdirSync(carpetaB);
      writeFileSync(path.join(carpetaB, '.env'), envB);
      writeFileSync(env(), original);
    });

    it('cambio de carpeta A→B: A vuelve byte a byte y B queda intacto', async () => {
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      expect(readFileSync(env(), 'latin1')).toContain('https://a.trycloudflare.com/');
      await ub.restaurar(sitio({ carpeta: carpetaB }));
      expect(readFileSync(env()).equals(original)).toBe(true);
      expect(readFileSync(path.join(carpetaB, '.env'), 'utf8')).toBe(envB);
      expect(existsSync(estadoPath())).toBe(false);
    });

    it('urlBaseVar → null: A vuelve byte a byte', async () => {
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      await ub.restaurar(sitio({ urlBaseVar: null }));
      expect(readFileSync(env()).equals(original)).toBe(true);
      expect(existsSync(estadoPath())).toBe(false);
    });

    it('la limpieza de caché usa la carpeta, tipo y PHP guardados al aplicar', async () => {
      mkdirSync(path.join(carpeta, 'bootstrap', 'cache'), { recursive: true });
      writeFileSync(path.join(carpeta, 'bootstrap', 'cache', 'config.php'), '<?php');
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      llamadas = [];
      await ub.restaurar(sitio({ carpeta: carpetaB, tipo: 'estatico', php: null }));
      expect(llamadas).toHaveLength(1);
      expect(llamadas[0]!.cmd).toBe(path.join(rutas.bin('php', '8.3'), 'php.exe'));
      expect(llamadas[0]!.opts?.cwd).toBe(carpeta);
    });

    it('aplicar con otra carpeta restaura primero la anterior', async () => {
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      await ub.aplicar(sitio({ carpeta: carpetaB }), 'https://b.trycloudflare.com/');
      expect(readFileSync(env()).equals(original)).toBe(true);
      await ub.restaurar(sitio({ carpeta: carpetaB }));
      expect(readFileSync(path.join(carpetaB, '.env'), 'utf8')).toBe(envB);
    });
  });

  it('usa y borra un .env.pel-respaldo antiguo de la carpeta del proyecto', async () => {
    const original = 'A=1\n';
    writeFileSync(env(), 'A=1\nAPP_URL=https://viejo.trycloudflare.com/\n');
    writeFileSync(path.join(carpeta, '.env.pel-respaldo'), original);
    mkdirSync(path.join(rutas.base, 'run'), { recursive: true });
    writeFileSync(
      estadoPath(),
      JSON.stringify({
        existia: false,
        valor: null,
        lineaOriginal: null,
        hashAplicado: createHash('sha256').update(readFileSync(env())).digest('hex'),
        sitio: { carpeta, urlBaseVar: 'APP_URL', tipo: 'estatico', php: null },
      }),
    );
    const ub = new UrlBase({ rutas, ejecutor: exec });
    expect(await ub.restaurarPorId('s1')).toBeNull();
    expect(readFileSync(env(), 'utf8')).toBe(original);
    expect(existsSync(path.join(carpeta, '.env.pel-respaldo'))).toBe(false);
  });

  it('si falta el .env al restaurar, conserva el respaldo con fecha y avisa', async () => {
    writeFileSync(env(), 'A=1\n');
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    rmSync(env());
    const aviso = await ub.restaurar(sitio());
    expect(aviso).toContain('No se encontró');
    expect(copiasRespaldo()).toHaveLength(1);
  });

  describe('escritura atómica', () => {
    it('reintenta el rename ante EBUSY y escribe el archivo', async () => {
      writeFileSync(env(), 'A=1\n');
      let fallos = 2;
      const renombrar = async (de: string, a: string): Promise<void> => {
        if (fallos-- > 0) throw Object.assign(new Error('ocupado'), { code: 'EBUSY' });
        renameSync(de, a);
      };
      await escribirAtomico(env(), Buffer.from('B=2\n'), { renombrar });
      expect(readFileSync(env(), 'utf8')).toBe('B=2\n');
      expect(readdirSync(carpeta).filter((f) => f.includes('pel-tmp'))).toEqual([]);
    });

    it('si el rename falla siempre, el .env original queda intacto y sin temporales', async () => {
      writeFileSync(env(), 'A=1\n');
      const renombrar = async (): Promise<void> => {
        throw Object.assign(new Error('denegado'), { code: 'EPERM' });
      };
      const ub = new UrlBase({ rutas, ejecutor: exec, renombrar });
      await expect(ub.aplicar(sitio(), 'https://a.trycloudflare.com/')).rejects.toThrow('denegado');
      expect(readFileSync(env(), 'utf8')).toBe('A=1\n');
      expect(readdirSync(carpeta).filter((f) => f.includes('pel-tmp'))).toEqual([]);
    });
  });

  describe('restaurarUrlBaseSincrono', () => {
    it('restaura byte a byte sin ediciones y limpia el estado y la caché de Laravel', async () => {
      const original = Buffer.concat([
        Buffer.from('APP_URL=http://a.test\r\nX='),
        Buffer.from([0xf1]),
      ]);
      writeFileSync(env(), original);
      mkdirSync(path.join(carpeta, 'bootstrap', 'cache'), { recursive: true });
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      writeFileSync(path.join(carpeta, 'bootstrap', 'cache', 'config.php'), '<?php');
      expect(restaurarUrlBaseSincrono(rutas)).toEqual([]);
      expect(readFileSync(env()).equals(original)).toBe(true);
      expect(existsSync(estadoPath())).toBe(false);
      expect(existsSync(respaldoPath())).toBe(false);
      expect(existsSync(path.join(carpeta, 'bootstrap', 'cache', 'config.php'))).toBe(false);
    });

    it('conserva el respaldo con fecha si el .env se editó', async () => {
      writeFileSync(env(), 'APP_URL=http://a.test\n');
      const ub = new UrlBase({ rutas, ejecutor: exec });
      await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
      writeFileSync(env(), readFileSync(env(), 'utf8') + 'NUEVA=1\n');
      const avisos = restaurarUrlBaseSincrono(rutas);
      expect(readFileSync(env(), 'utf8')).toBe('APP_URL=http://a.test\nNUEVA=1\n');
      expect(avisos).toHaveLength(1);
      expect(copiasRespaldo()).toHaveLength(1);
    });

    it('sin carpeta run no hace nada', () => {
      expect(restaurarUrlBaseSincrono(new Rutas(path.join(base, 'nada')))).toEqual([]);
    });
  });

  it('aplicar y restaurar concurrentes se serializan por sitio', async () => {
    const original = 'A=1\n';
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    const a = ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    const r = ub.restaurar(sitio());
    await Promise.all([a, r]);
    expect(readFileSync(env(), 'utf8')).toBe(original);
  });

  it('BOM + APP_URL en la primera línea: se reemplaza en su sitio y se restaura byte a byte', async () => {
    const original = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('APP_URL=http://wolf.test\r\nB=2\r\n'),
    ]);
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    const medio = readFileSync(env());
    expect(medio.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(true);
    expect(medio.toString('latin1').split('APP_URL=')).toHaveLength(2);
    expect(medio.toString('utf8')).toContain('APP_URL=https://a.trycloudflare.com/\r\nB=2');
    // Edición del usuario: fuerza la restauración por línea.
    const editado = Buffer.concat([medio, Buffer.from('C=3\r\n')]);
    writeFileSync(env(), editado);
    await ub.restaurar(sitio());
    expect(readFileSync(env()).equals(Buffer.concat([original, Buffer.from('C=3\r\n')]))).toBe(
      true,
    );
  });

  it('BOM sin ediciones: restauración idéntica', async () => {
    const original = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('APP_URL=x\n')]);
    writeFileSync(env(), original);
    const ub = new UrlBase({ rutas, ejecutor: exec });
    await ub.aplicar(sitio(), 'https://a.trycloudflare.com/');
    await ub.restaurar(sitio());
    expect(readFileSync(env()).equals(original)).toBe(true);
  });
});
