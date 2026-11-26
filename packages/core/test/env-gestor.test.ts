import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { GestorEnv, MAX_BYTES_ENV } from '../src/proyectos/env/gestor';
import { diffEnv } from '../src/proyectos/env/diff';
import { aplicarCambios, diffTexto } from '../src/proyectos/env/escribir';
import { enmascarar, esSecreta, escribirEnv, leerEnv } from '../src/proyectos/env/leer';
import { PLANTILLAS_ENV } from '../src/proyectos/env/plantillas';
import { respaldar } from '../src/ia/envIa';
import type { Sitio } from '../src/tipos';

/** Valor secreto de prueba: nunca debe salir de `revelar`. */
const CENTINELA = 'centinela-secreta-d';

describe('leerEnv / escribirEnv', () => {
  const casos: Record<string, string> = {
    'comentarios, comillas y export':
      '# Mi app\nAPP_NAME="Mi App"\nexport APP_ENV=local # nota\n\nAPP_KEY=\'base64:abc\'\nVACIA=\n',
    CRLF: 'A=1\r\nB="dos"\r\n# c\r\nC = 3\r\n',
    'sin salto final': 'A=1\nB=2',
    'solo comentarios': '# uno\n# dos\n',
    'con BOM': '\ufeffA=1\nB=2\n',
    vacío: '',
    'estilo CodeIgniter 4':
      "database.default.hostname = 127.0.0.1\ndatabase.default.password = 'x'\n",
    'líneas raras': '=sin clave\nsin igual\n  # sangrado\n',
  };
  for (const [nombre, texto] of Object.entries(casos)) {
    it(`ida y vuelta exacta: ${nombre}`, () => {
      expect(escribirEnv(leerEnv(texto))).toBe(texto);
    });
  }

  it('lee clave, valor sin comillas y tipo de cada línea', () => {
    const l = leerEnv('# c\nA="x y"\nB=\'z\'\nC=3 # n\n\n');
    expect(l.map((x) => x.tipo)).toEqual([
      'comentario',
      'variable',
      'variable',
      'variable',
      'vacia',
    ]);
    expect(l[1]).toMatchObject({ clave: 'A', valor: 'x y', comillas: '"' });
    expect(l[2]).toMatchObject({ clave: 'B', valor: 'z', comillas: "'" });
    expect(l[3]).toMatchObject({ clave: 'C', valor: '3', comillas: null });
  });
});

describe('esSecreta / enmascarar', () => {
  it('por nombre', () => {
    for (const k of [
      'APP_KEY',
      'STRIPE_SECRET',
      'DB_PASSWORD',
      'MAIL_PASS',
      'GITHUB_TOKEN',
      'ADMIN_PWD',
      'AWS_SECRET_ACCESS_KEY',
      'database.default.password',
    ]) {
      expect(esSecreta(k, 'x'), k).toBe(true);
    }
    for (const k of ['APP_NAME', 'DB_HOST', 'DB_PORT', 'APP_DEBUG', 'MAIL_MAILER']) {
      expect(esSecreta(k, 'x'), k).toBe(false);
    }
  });

  it('por la forma del valor (URL con clave, token de GitHub)', () => {
    expect(esSecreta('DATABASE_URL', 'mysql://usuario:clave@127.0.0.1:3306/x')).toBe(true);
    expect(esSecreta('DATABASE_URL', 'mysql://127.0.0.1:3306/x')).toBe(false);
    expect(esSecreta('ALGO', 'ghp_abcdefghijklmnop')).toBe(true);
  });

  it('enmascara con los 4 últimos solo si el valor es largo', () => {
    expect(enmascarar(CENTINELA)).toBe('••••ta-d');
    expect(enmascarar('corta')).toBe('••••');
    expect(enmascarar('')).toBe('');
  });
});

describe('diffEnv', () => {
  it('faltan, sobran y distintas (solo nombres)', () => {
    const d = diffEnv('A=1\nB=2\nSOLO=3\n', 'A=1\nB=otro\nFALTA=4\n');
    expect(d).toEqual({ faltan: ['FALTA'], sobran: ['SOLO'], distintas: ['B'] });
  });

  it('no filtra valores secretos', () => {
    const d = diffEnv(`API_KEY=${CENTINELA}\n`, 'API_KEY=otra\nNUEVA_SECRET=otro-valor\n');
    expect(JSON.stringify(d)).not.toContain(CENTINELA);
    expect(JSON.stringify(d)).not.toContain('otro-valor');
  });
});

describe('aplicarCambios y diffTexto', () => {
  const dotenv = (): 'dotenv' => 'dotenv';

  it('cambia solo el valor: conserva export, espacios, comillas y comentario', () => {
    const t = '# c\nexport A = "uno" # nota\nB=2\n';
    const r = escribirEnv(aplicarCambios(leerEnv(t), { A: 'dos' }, dotenv));
    expect(r).toBe('# c\nexport A = "dos" # nota\nB=2\n');
  });

  it('agrega las nuevas al final con el fin de línea del archivo (también sin salto final)', () => {
    expect(escribirEnv(aplicarCambios(leerEnv('A=1\r\nB=2'), { C: '3' }, dotenv))).toBe(
      'A=1\r\nB=2\r\nC=3\r\n',
    );
  });

  it('null quita la variable', () => {
    expect(escribirEnv(aplicarCambios(leerEnv('A=1\nB=2\n'), { A: null }, dotenv))).toBe('B=2\n');
  });

  it('un valor con espacios o comillas se escribe de forma que se vuelve a leer igual', () => {
    for (const v of ['con espacios', "it's", 'a"b', 'C:\\Program Files\\x', '$HOME']) {
      const t = escribirEnv(aplicarCambios([], { A: v }, dotenv));
      expect(leerEnv(t)[0]!.valor, v).toBe(v);
    }
  });

  it('el diff enmascara los secretos y deja ver lo demás', () => {
    const antes = leerEnv(`APP_NAME=Uno\nAPI_KEY=${CENTINELA}\n`);
    const despues = aplicarCambios(
      antes,
      { APP_NAME: 'Dos', API_KEY: 'otra-clave-muy-larga-1234' },
      dotenv,
    );
    const d = diffTexto(antes, despues);
    expect(d).toContain('-APP_NAME=Uno');
    expect(d).toContain('+APP_NAME=Dos');
    expect(d).toContain('••••');
    expect(d).not.toContain(CENTINELA);
    expect(d).not.toContain('otra-clave-muy-larga-1234');
  });
});

describe('plantillas de bloques', () => {
  it('ningún bloque trae una clave', () => {
    const ctx = { tipo: 'laravel' as const, base: null, correo: 1025, redis: 6379 };
    for (const [nombre, f] of Object.entries(PLANTILLAS_ENV)) {
      for (const [k, v] of Object.entries(f(ctx))) {
        if (esSecreta(k, v)) expect(v === '' || v === 'null', `${nombre}.${k}`).toBe(true);
      }
    }
  });
});

describe('GestorEnv', () => {
  let proyecto: string;
  let respaldos: string;
  let sitio: Sitio;
  let versionado: boolean | null;
  let gestor: GestorEnv;

  const env = (): string => path.join(proyecto, '.env');

  beforeEach(async () => {
    proyecto = await carpetaTemporal('pel-env-proy-');
    respaldos = await carpetaTemporal('pel-env-resp-');
    versionado = false;
    sitio = {
      id: 'tienda-test',
      nombre: 'Tienda',
      dominio: 'tienda.test',
      alias: [],
      carpeta: proyecto,
      tipo: 'laravel',
      php: '8.4',
      puertoProxy: null,
      reglasExtra: '',
      urlBaseVar: null,
      datosReales: false,
      https: true,
      redirigirHttps: false,
      confiado: true,
      git: null,
      procesos: [],
      runtimes: {},
      nota: '',
    } as Sitio;
    gestor = new GestorEnv({
      sitio: async (id) => (id === sitio.id ? sitio : undefined),
      carpetaRespaldos: () => respaldos,
      versionado: async () => versionado,
      puertos: async () => ({ correo: 1025, redis: 6379 }),
    });
  });

  const contenido = `# Laravel\nAPP_NAME=Tienda\nAPP_KEY=base64:${CENTINELA}\nDB_PASSWORD=${CENTINELA}\nDB_HOST=127.0.0.1\n`;

  it('ver nunca devuelve el valor completo de una secreta', async () => {
    await writeFile(env(), contenido);
    const v = await gestor.ver(sitio.id);
    expect(JSON.stringify(v)).not.toContain(CENTINELA);
    const fila = v.filas.find((f) => f.clave === 'DB_PASSWORD')!;
    expect(fila).toMatchObject({ secreta: true, valorVisible: '••••ta-d' });
    expect(v.filas.find((f) => f.clave === 'APP_NAME')).toMatchObject({
      secreta: false,
      valorVisible: 'Tienda',
    });
    expect(v.existe).toBe(true);
  });

  it('ver sin .env: no existe y no falla', async () => {
    const v = await gestor.ver(sitio.id);
    expect(v).toMatchObject({ existe: false, filas: [], hayEjemplo: false });
  });

  it('revelar devuelve solo la clave pedida; una inexistente da env.clave_inexistente', async () => {
    await writeFile(env(), contenido);
    expect(await gestor.revelar(sitio.id, 'DB_PASSWORD')).toBe(CENTINELA);
    await expect(gestor.revelar(sitio.id, 'NO_EXISTE')).rejects.toMatchObject({
      codigo: 'env.clave_inexistente',
    });
  });

  it('un .env de más de 1 MB da env.archivo_grande (en ver, revelar y guardar)', async () => {
    await writeFile(env(), 'A=' + 'x'.repeat(MAX_BYTES_ENV + 10));
    await expect(gestor.ver(sitio.id)).rejects.toMatchObject({ codigo: 'env.archivo_grande' });
    await expect(gestor.revelar(sitio.id, 'A')).rejects.toMatchObject({
      codigo: 'env.archivo_grande',
    });
    await expect(gestor.guardar(sitio.id, { cambios: { A: '1' } }, true)).rejects.toMatchObject({
      codigo: 'env.archivo_grande',
    });
  });

  it('vistaPrevia enmascara los secretos y no escribe nada', async () => {
    await writeFile(env(), contenido);
    const r = await gestor.vistaPrevia(sitio.id, {
      cambios: { DB_PASSWORD: 'nueva-clave-secreta-9999', APP_NAME: 'Otra' },
    });
    expect(r.diff).toContain('-APP_NAME=Tienda');
    expect(r.diff).toContain('+APP_NAME=Otra');
    expect(r.diff).not.toContain(CENTINELA);
    expect(r.diff).not.toContain('nueva-clave-secreta-9999');
    expect(await readFile(env(), 'utf8')).toBe(contenido);
    expect(await readdir(respaldos)).toEqual([]);
  });

  it('guardar deja una copia y solo cambia las claves pedidas', async () => {
    await writeFile(env(), contenido);
    const r = await gestor.guardar(sitio.id, { cambios: { APP_NAME: 'Otra' } }, true);
    expect(r.copia).toMatch(/^env-tienda-test-.*\.respaldo$/);
    expect(await readFile(path.join(respaldos, r.copia!), 'utf8')).toBe(contenido);
    expect(await readFile(env(), 'utf8')).toBe(
      contenido.replace('APP_NAME=Tienda', 'APP_NAME=Otra'),
    );
    // Sin archivos temporales sueltos en el proyecto.
    expect((await readdir(proyecto)).filter((n) => n.includes('tmp'))).toEqual([]);
  });

  it('guardar sin confirmado falla y no toca nada', async () => {
    await writeFile(env(), contenido);
    await expect(
      gestor.guardar(sitio.id, { cambios: { A: '1' } }, false as unknown as true),
    ).rejects.toMatchObject({ codigo: 'env.sin_confirmar' });
    expect(await readFile(env(), 'utf8')).toBe(contenido);
  });

  it('agrega las que faltan desde .env.example sin que el renderer vea sus valores', async () => {
    await writeFile(env(), 'A=1\n');
    await writeFile(path.join(proyecto, '.env.example'), `A=1\nNUEVA_SECRET=${CENTINELA}\nB=dos\n`);
    const v = await gestor.ver(sitio.id);
    expect(v.diff.faltan).toEqual(['NUEVA_SECRET', 'B']);
    expect(JSON.stringify(v)).not.toContain(CENTINELA);
    const previa = await gestor.vistaPrevia(sitio.id, { desdeEjemplo: ['NUEVA_SECRET', 'B'] });
    expect(previa.diff).not.toContain(CENTINELA);
    await gestor.guardar(sitio.id, { desdeEjemplo: ['NUEVA_SECRET', 'B'] }, true);
    expect(await readFile(env(), 'utf8')).toBe(`A=1\nNUEVA_SECRET=${CENTINELA}\nB=dos\n`);
  });

  it('desdeEjemplo con una clave que el ejemplo no tiene falla', async () => {
    await writeFile(env(), 'A=1\n');
    await expect(gestor.guardar(sitio.id, { desdeEjemplo: ['X'] }, true)).rejects.toMatchObject({
      codigo: 'env.clave_inexistente',
    });
  });

  it('bloques de plantilla: redis agrega sus variables sin claves', async () => {
    await writeFile(env(), 'A=1\n');
    await gestor.guardar(sitio.id, { bloques: ['redis'] }, true);
    const t = await readFile(env(), 'utf8');
    expect(t).toContain('REDIS_HOST=127.0.0.1');
    expect(t).toContain('REDIS_PORT=6379');
  });

  it('I1: el bloque de Meilisearch lleva su clave, enmascarada en la vista previa', async () => {
    const CLAVE_MEILI = 'CLAVE-MEILI-DE-PRUEBA-FALSA-1234';
    const conMeili = new GestorEnv({
      sitio: async (id) => (id === sitio.id ? sitio : undefined),
      carpetaRespaldos: () => respaldos,
      versionado: async () => versionado,
      puertos: async () => ({ correo: 1025, redis: 6379 }),
      meilisearch: async () => ({ puerto: 7701, clave: CLAVE_MEILI }),
    });
    await writeFile(env(), 'A=1\n');
    const previa = await conMeili.vistaPrevia(sitio.id, { bloques: ['meilisearch'] });
    expect(previa.diff).toContain('SCOUT_DRIVER=meilisearch');
    expect(previa.diff).toContain('MEILISEARCH_HOST=http://127.0.0.1:7701');
    expect(previa.diff).toContain('MEILISEARCH_KEY=••••');
    expect(previa.diff).not.toContain(CLAVE_MEILI);
    // Nada se escribió con la vista previa.
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
    // Ver el .env después de guardar tampoco la devuelve.
    await conMeili.guardar(sitio.id, { bloques: ['meilisearch'] }, true);
    expect(await readFile(env(), 'utf8')).toContain(`MEILISEARCH_KEY=${CLAVE_MEILI}`);
    const v = await conMeili.ver(sitio.id);
    expect(JSON.stringify(v)).not.toContain(CLAVE_MEILI);
    expect(v.filas.find((f) => f.clave === 'MEILISEARCH_KEY')).toMatchObject({ secreta: true });
  });

  it('el bloque de Meilisearch sin Meilisearch instalado da env.meilisearch_no_disponible', async () => {
    await writeFile(env(), 'A=1\n');
    await expect(gestor.vistaPrevia(sitio.id, { bloques: ['meilisearch'] })).rejects.toMatchObject({
      codigo: 'env.meilisearch_no_disponible',
    });
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
  });

  it('bloque de correo: apunta al captador elegido y no se aplica con proveedor SMTP (D21)', async () => {
    await writeFile(env(), 'A=1\n');
    await gestor.guardar(sitio.id, { bloques: ['correo'] }, true);
    expect(await readFile(env(), 'utf8')).toContain('MAIL_PORT=1025');
    await writeFile(env(), 'A=1\n');
    sitio.correo = { modo: 'smtp', proveedor: 'brevo' };
    await gestor.guardar(sitio.id, { bloques: ['correo'] }, true);
    expect(await readFile(env(), 'utf8')).not.toContain('MAIL_');
  });

  it('cambios inválidos (nombre raro, salto de línea) se rechazan sin repetir el valor', async () => {
    await writeFile(env(), 'A=1\n');
    const malos: Record<string, string | null>[] = [
      { 'MAL NOMBRE': 'x' },
      { A: `a\n${CENTINELA}` },
      { A: 5 as never },
    ];
    for (const cambios of malos) {
      const e = await gestor
        .guardar(sitio.id, { cambios }, true)
        .then(() => null)
        .catch((x: unknown) => x as Error);
      expect(e, JSON.stringify(cambios)).toMatchObject({ codigo: 'env.variable_invalida' });
      expect(JSON.stringify(e)).not.toContain(CENTINELA);
      expect(String((e as Error).message)).not.toContain(CENTINELA);
    }
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
  });

  it('git ya sigue el .env: exige aceptarVersionado; sin saberlo, también', async () => {
    await writeFile(env(), 'A=1\n');
    versionado = true;
    await expect(gestor.guardar(sitio.id, { cambios: { A: '2' } }, true)).rejects.toMatchObject({
      codigo: 'env.versionado',
    });
    versionado = null;
    await expect(gestor.guardar(sitio.id, { cambios: { A: '2' } }, true)).rejects.toMatchObject({
      codigo: 'env.versionado_desconocido',
    });
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
    await gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, { aceptarVersionado: true });
    expect(await readFile(env(), 'utf8')).toBe('A=2\n');
  });

  it('agregarGitignore agrega .env al .gitignore', async () => {
    await writeFile(env(), 'A=1\n');
    await writeFile(path.join(proyecto, '.gitignore'), 'vendor\n');
    const r = await gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, {
      agregarGitignore: true,
    });
    expect(r.gitignoreAgregado).toBe(true);
    expect(await readFile(path.join(proyecto, '.gitignore'), 'utf8')).toContain('.env');
  });

  it('sin .env, guardar lo crea (sin copia)', async () => {
    const r = await gestor.guardar(sitio.id, { cambios: { A: '1' } }, true);
    expect(r.copia).toBeNull();
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
  });

  it('solo se conservan las últimas copias', async () => {
    await writeFile(env(), 'A=0\n');
    for (let i = 1; i <= 8; i++) {
      await gestor.guardar(sitio.id, { cambios: { A: String(i) } }, true);
    }
    expect((await gestor.copias(sitio.id)).length).toBe(5);
  });

  it('volver a una copia: antes guarda otra del .env actual', async () => {
    await writeFile(env(), 'A=original\n');
    await gestor.guardar(sitio.id, { cambios: { A: 'cambiado' } }, true);
    const [copia] = await gestor.copias(sitio.id);
    const r = await gestor.restaurarCopia(sitio.id, copia!, true);
    expect(await readFile(env(), 'utf8')).toBe('A=original\n');
    expect(await readFile(path.join(respaldos, r.copia!), 'utf8')).toBe('A=cambiado\n');
  });

  it('restaurarCopia rechaza nombres que no son de este sitio o llevan rutas', async () => {
    await writeFile(env(), 'A=1\n');
    for (const n of ['../x.respaldo', 'env-otro-20240101-000000-000-abcdef.respaldo', 'a']) {
      await expect(gestor.restaurarCopia(sitio.id, n, true)).rejects.toMatchObject({
        codigo: 'env.copia_invalida',
      });
    }
    await expect(
      gestor.restaurarCopia(
        sitio.id,
        'env-tienda-test-20240101-000000-000-abcdef.respaldo',
        false as never,
      ),
    ).rejects.toMatchObject({ codigo: 'env.sin_confirmar' });
  });

  it('un id de sitio con .. o que no existe se rechaza', async () => {
    await expect(gestor.ver('../x')).rejects.toThrow();
    await expect(gestor.ver('otro')).rejects.toMatchObject({ codigo: 'proyectos.no_existe' });
  });

  it('un .env que es una carpeta no se lee ni se toca', async () => {
    await mkdir(env());
    await expect(gestor.ver(sitio.id)).rejects.toMatchObject({ codigo: 'env.no_regular' });
    expect((await stat(env())).isDirectory()).toBe(true);
  });

  it('ponerUsuarioBd cambia solo usuario y clave de la conexión, con copia', async () => {
    await writeFile(
      env(),
      'DB_HOST=127.0.0.1\nDB_DATABASE=tienda\nDB_USERNAME=root\nDB_PASSWORD=vieja-clave-1234\nAPP_NAME=T\n',
    );
    const r = await gestor.ponerUsuarioBd(sitio.id, 'wolf_u_tienda', 'clave-nueva-prueba-0000');
    expect(JSON.stringify(r)).not.toContain('clave-nueva-prueba-0000');
    expect(await readFile(env(), 'utf8')).toBe(
      'DB_HOST=127.0.0.1\nDB_DATABASE=tienda\nDB_USERNAME=wolf_u_tienda\nDB_PASSWORD=clave-nueva-prueba-0000\nAPP_NAME=T\n',
    );
    expect(await readFile(path.join(respaldos, r.copia!), 'utf8')).toContain('root');
  });

  it('ponerUsuarioBd en DATABASE_URL cambia el usuario y la clave de la URL', async () => {
    await writeFile(env(), 'DATABASE_URL=mysql://root:vieja@127.0.0.1:3306/tienda\n');
    await gestor.ponerUsuarioBd(sitio.id, 'wolf_u_tienda', 'clave-nueva-prueba-0000');
    expect(await readFile(env(), 'utf8')).toBe(
      'DATABASE_URL=mysql://wolf_u_tienda:clave-nueva-prueba-0000@127.0.0.1:3306/tienda\n',
    );
  });

  it('ponerUsuarioBd sin variables de conexión falla (env.sin_base)', async () => {
    await writeFile(env(), 'A=1\n');
    await expect(gestor.ponerUsuarioBd(sitio.id, 'u', 'c')).rejects.toMatchObject({
      codigo: 'env.sin_base',
    });
  });

  it('antes() corre tras las comprobaciones: si git lo impide, no se llama', async () => {
    await writeFile(env(), 'A=1\n');
    versionado = true;
    let llamado = false;
    await expect(
      gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, {
        antes: async () => {
          llamado = true;
        },
      }),
    ).rejects.toMatchObject({ codigo: 'env.versionado' });
    expect(llamado).toBe(false);
  });

  /* ───── Revisión de D16 ───── */

  it('I1: un bloque no pisa variables que ya existen (DB_PASSWORD, OPENAI_API_KEY, REDIS_PASSWORD)', async () => {
    const original = `DB_HOST=10.0.0.9\nDB_PASSWORD=${CENTINELA}\nOPENAI_API_KEY=sk-prueba-falsa-0000\nREDIS_PASSWORD=secreta-redis-1234\n`;
    await writeFile(env(), original);
    const previa = await gestor.vistaPrevia(sitio.id, { bloques: ['bd', 'ia', 'redis'] });
    expect(previa.diff).not.toMatch(/^-/m);
    await gestor.guardar(sitio.id, { bloques: ['bd', 'ia', 'redis'] }, true);
    const t = await readFile(env(), 'utf8');
    expect(t.startsWith(original)).toBe(true);
    expect(t).toContain(`DB_PASSWORD=${CENTINELA}`);
    expect(t).toContain('OPENAI_API_KEY=sk-prueba-falsa-0000');
    expect(t).toContain('REDIS_PASSWORD=secreta-redis-1234');
    expect(t).not.toContain('REDIS_PASSWORD=null');
    // Las que faltaban sí se agregan.
    expect(t).toContain('DB_DATABASE=');
    expect(t).toContain('REDIS_PORT=6379');
  });

  it('menor 3: DATABASE_URL, *_URI y *_DSN con @ son secretas en ver y en el diff', async () => {
    await writeFile(
      env(),
      `DATABASE_URL=mysql://u@127.0.0.1/x?k=${CENTINELA}\nSENTRY_DSN=https://${CENTINELA}@o1.ingest.example.test/1\nAPP_URL=https://tienda.test\n`,
    );
    const v = await gestor.ver(sitio.id);
    expect(JSON.stringify(v)).not.toContain(CENTINELA);
    expect(v.filas.find((f) => f.clave === 'SENTRY_DSN')?.secreta).toBe(true);
    expect(v.filas.find((f) => f.clave === 'APP_URL')?.secreta).toBe(false);
    const previa = await gestor.vistaPrevia(sitio.id, {
      cambios: { SENTRY_DSN: `https://otro-${CENTINELA}@o2.ingest.example.test/2` },
    });
    expect(previa.diff).not.toContain(CENTINELA);
  });

  it('menor 4: una variable multilínea se ve pero es de solo lectura, y la ida y vuelta es exacta', async () => {
    const texto = 'A=1\nCLAVE_PEM="-----BEGIN-----\nabc\n-----END-----"\nB=2\n';
    expect(escribirEnv(leerEnv(texto))).toBe(texto);
    expect(
      leerEnv(texto)
        .filter((l) => l.tipo === 'variable')
        .map((l) => l.clave),
    ).toEqual(['A', 'CLAVE_PEM', 'B']);
    await writeFile(env(), texto);
    const v = await gestor.ver(sitio.id);
    expect(v.filas.find((f) => f.clave === 'CLAVE_PEM')).toMatchObject({ soloLectura: true });
    for (const cambios of [{ CLAVE_PEM: 'x' }, { CLAVE_PEM: null }]) {
      await expect(gestor.guardar(sitio.id, { cambios }, true)).rejects.toMatchObject({
        codigo: 'env.solo_lectura',
        datos: { clave: 'CLAVE_PEM' },
      });
    }
    await gestor.guardar(sitio.id, { cambios: { B: '3' } }, true);
    expect(await readFile(env(), 'utf8')).toBe(texto.replace('B=2', 'B=3'));
  });

  it('menor 4: con claves repetidas se muestra, se revela y se cambia la última (y se avisa)', async () => {
    await writeFile(env(), 'A=primero\nB=x\nA=ultimo\n');
    const v = await gestor.ver(sitio.id);
    expect(v.filas.filter((f) => f.clave === 'A')).toEqual([
      expect.objectContaining({ valorVisible: 'ultimo', duplicada: true }),
    ]);
    expect(await gestor.revelar(sitio.id, 'A')).toBe('ultimo');
    await gestor.guardar(sitio.id, { cambios: { A: 'nuevo' } }, true);
    expect(await readFile(env(), 'utf8')).toBe('A=primero\nB=x\nA=nuevo\n');
  });

  it('menor 4: $ entre comillas dobles se escapa al escribir y se lee igual', async () => {
    await writeFile(env(), 'CLAVE="vieja"\n');
    await gestor.guardar(sitio.id, { cambios: { CLAVE: 'a$b${C}' } }, true);
    const t = await readFile(env(), 'utf8');
    expect(t).toBe('CLAVE="a\\$b\\${C}"\n');
    expect(leerEnv(t)[0]).toMatchObject({ valor: 'a$b${C}' });
    expect(await gestor.revelar(sitio.id, 'CLAVE')).toBe('a$b${C}');
  });

  it('menor 4: KEY= # nota tiene valor vacío y un valor nuevo no se pega al comentario', async () => {
    expect(leerEnv('KEY= # nota\n')[0]).toMatchObject({ clave: 'KEY', valor: '' });
    expect(leerEnv('KEY=#nota\n')[0]).toMatchObject({ valor: '#nota' });
    await writeFile(env(), 'KEY= # nota\n');
    await gestor.guardar(sitio.id, { cambios: { KEY: 'valor' } }, true);
    const t = await readFile(env(), 'utf8');
    expect(t).toBe('KEY=valor # nota\n');
    expect(leerEnv(t)[0]).toMatchObject({ valor: 'valor' });
  });

  it('menor 5: ponerUsuarioBd agrega la clave si el .env tiene el usuario pero no la clave', async () => {
    await writeFile(env(), 'DB_DATABASE=tienda\nDB_USERNAME=root\n');
    await gestor.ponerUsuarioBd(sitio.id, 'wolf_u_tienda', 'clave-nueva-prueba-0000');
    expect(await readFile(env(), 'utf8')).toBe(
      'DB_DATABASE=tienda\nDB_USERNAME=wolf_u_tienda\nDB_PASSWORD=clave-nueva-prueba-0000\n',
    );
  });

  it('menor 6: guardar con la huella de la vista previa; si el .env cambió por fuera, env.cambio_externo', async () => {
    await writeFile(env(), 'A=1\n');
    const { huella } = await gestor.vistaPrevia(sitio.id, { cambios: { A: '2' } });
    expect(huella).toMatch(/^[0-9a-f]{64}$/);
    expect((await gestor.ver(sitio.id)).huella).toBe(huella);
    await writeFile(env(), 'A=1\nB=lo-escribio-otro\n');
    await expect(
      gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, { huella }),
    ).rejects.toMatchObject({ codigo: 'env.cambio_externo' });
    expect(await readFile(env(), 'utf8')).toBe('A=1\nB=lo-escribio-otro\n');
    const otra = await gestor.vistaPrevia(sitio.id, { cambios: { A: '2' } });
    await gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, { huella: otra.huella });
    expect(await readFile(env(), 'utf8')).toBe('A=2\nB=lo-escribio-otro\n');
  });

  it('menor 6: si antes() falla, el .gitignore no se toca', async () => {
    await writeFile(env(), 'A=1\n');
    await writeFile(path.join(proyecto, '.gitignore'), 'vendor/\n');
    await expect(
      gestor.guardar(sitio.id, { cambios: { A: '2' } }, true, {
        agregarGitignore: true,
        antes: async () => {
          throw new Error('no se pudo crear el usuario');
        },
      }),
    ).rejects.toThrow(/usuario/);
    expect(await readFile(path.join(proyecto, '.gitignore'), 'utf8')).toBe('vendor/\n');
    expect(await readFile(env(), 'utf8')).toBe('A=1\n');
  });

  it('menor 7: env.cambio_invalido sin variable no lleva {clave}; con variable, env.variable_invalida', async () => {
    await writeFile(env(), 'A=1\n');
    const muchos = Object.fromEntries(Array.from({ length: 201 }, (_, i) => [`V${i}`, 'x']));
    const e = await gestor
      .guardar(sitio.id, { cambios: muchos }, true)
      .catch((x: unknown) => x as { codigo: string; datos?: unknown });
    expect(e).toMatchObject({ codigo: 'env.cambio_invalido' });
    expect((e as { datos?: unknown }).datos ?? {}).toEqual({});
    await expect(
      gestor.guardar(sitio.id, { cambios: { 'MAL NOMBRE': 'x' } }, true),
    ).rejects.toMatchObject({ codigo: 'env.variable_invalida', datos: { clave: 'MAL NOMBRE' } });
  });
});

describe.skipIf(process.platform === 'win32')('copias del .env en POSIX (I5)', () => {
  it('la carpeta de copias queda en 0700 y cada copia en 0600', async () => {
    const proyecto = await carpetaTemporal('pel-env-modo-');
    const carpeta = path.join(await carpetaTemporal('pel-env-modo-resp-'), 'respaldos', 'env');
    await mkdir(carpeta, { recursive: true, mode: 0o755 });
    await writeFile(path.join(proyecto, '.env'), `DB_PASSWORD=${CENTINELA}\n`, { mode: 0o644 });
    const copia = await respaldar(path.join(proyecto, '.env'), carpeta, 'env-tienda-test');
    expect((await stat(carpeta)).mode & 0o777).toBe(0o700);
    expect((await stat(copia)).mode & 0o777).toBe(0o600);
  });
});

describe('revisión final de D16: estilo python y multilínea sin cierre', () => {
  it('FastAPI (python-dotenv): $ sin escapar, entre comillas simples', async () => {
    const proyecto = await carpetaTemporal('pel-env-py-');
    const respaldos = await carpetaTemporal('pel-env-py-resp-');
    const sitio = {
      id: 'api-test',
      nombre: 'API',
      dominio: 'api.test',
      carpeta: proyecto,
      tipo: 'fastapi',
    } as unknown as Sitio;
    const gestor = new GestorEnv({
      sitio: async (id) => (id === sitio.id ? sitio : undefined),
      carpetaRespaldos: () => respaldos,
      versionado: async () => false,
      puertos: async () => ({ correo: null, redis: null }),
    });
    const env = path.join(proyecto, '.env');
    await writeFile(env, 'A="vieja"\nB=x\n');
    await gestor.guardar(sitio.id, { cambios: { A: 'a$b c', B: 'p$q', C: "it's $x" } }, true);
    const t = await readFile(env, 'utf8');
    expect(t).toBe("A='a$b c'\nB='p$q'\nC=\"it's $x\"\n");
    expect(t).not.toContain('\\$');
  });

  it('una comilla que no se cierra en 200 líneas también queda en solo lectura', () => {
    const texto = 'A=1\nROTA="sin cierre\nB=2\n';
    const l = leerEnv(texto);
    expect(escribirEnv(l)).toBe(texto);
    expect(l.find((x) => x.clave === 'ROTA')).toMatchObject({ multilinea: true });
    expect(() => aplicarCambios(l, { ROTA: 'otro' }, () => 'dotenv')).toThrow(
      expect.objectContaining({ codigo: 'env.solo_lectura' }),
    );
  });
});
