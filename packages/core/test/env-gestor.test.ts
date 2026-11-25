import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { carpetaTemporal } from './temporales';
import { GestorEnv, MAX_BYTES_ENV } from '../src/proyectos/env/gestor';
import { diffEnv } from '../src/proyectos/env/diff';
import { aplicarCambios, diffTexto } from '../src/proyectos/env/escribir';
import { enmascarar, esSecreta, escribirEnv, leerEnv } from '../src/proyectos/env/leer';
import { PLANTILLAS_ENV } from '../src/proyectos/env/plantillas';
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
    const ctx = { tipo: 'laravel' as const, base: null, mailpit: 1025, redis: 6379 };
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
      puertos: async () => ({ mailpit: 1025, redis: 6379 }),
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
      expect(e, JSON.stringify(cambios)).toMatchObject({ codigo: 'env.cambio_invalido' });
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
});
