import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  conValores,
  diffLineas,
  IniPhp,
  rutaMarcaEditado,
  rutaRespaldosIni,
  VALORES_RAPIDOS,
  valoresDe,
  type DepsIniPhp,
} from '../src/php/ini';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { ServicioPhp } from '../src/servicios/php';
import { carpetaTemporal } from './temporales';

const INI = [
  '[PHP]',
  '; Límite de memoria por script',
  'memory_limit = 128M',
  ';memory_limit = 2G',
  '',
  '; display_errors',
  ';   Default Value: On',
  'display_errors = On',
  'error_reporting = E_ALL',
  '',
  '[Date]',
  '; Zona horaria por defecto',
  ';date.timezone =',
  '',
  '[opcache]',
  ';opcache.enable=1',
].join('\r\n');

const SALIDA_OK =
  'PHP 8.4.13 (cli) (built: Oct 1 2026) (NTS Visual C++ 2022 x64)\r\nCopyright (c) The PHP Group\r\nZend Engine v4.4.13, Copyright (c) Zend Technologies\r\n    with Zend OPcache v8.4.13, Copyright (c), by Zend Technologies\r\n';

describe('valores rápidos', () => {
  it('ida y vuelta: cambia los valores y conserva cada comentario y los saltos CRLF', () => {
    const nuevo = conValores(INI, {
      memory_limit: '1G',
      'date.timezone': 'America/Bogota',
      display_errors: 'Off',
      'opcache.enable': '1',
      max_execution_time: '300',
    });
    expect(
      valoresDe(nuevo, [
        'memory_limit',
        'date.timezone',
        'display_errors',
        'opcache.enable',
        'max_execution_time',
        'post_max_size',
      ]),
    ).toEqual({
      memory_limit: '1G',
      'date.timezone': 'America/Bogota',
      display_errors: 'Off',
      'opcache.enable': '1',
      max_execution_time: '300',
      post_max_size: null,
    });
    const comentarios = (t: string) =>
      t.split(/\r?\n/).filter((l) => l.trimStart().startsWith(';'));
    expect(comentarios(nuevo)).toEqual(comentarios(INI));
    expect(nuevo.split('\r\n').length).toBeGreaterThan(INI.split('\r\n').length);
    expect(nuevo.replace(/\r\n/g, '')).not.toContain('\n');
    // La zona horaria queda junto a su ejemplo comentado, no al final.
    const lineas = nuevo.split('\r\n');
    expect(lineas[lineas.indexOf(';date.timezone =') + 1]).toBe('date.timezone = America/Bogota');
    // Volver a aplicar lo mismo no cambia nada.
    expect(conValores(nuevo, { memory_limit: '1G' })).toBe(nuevo);
  });

  it('la última línea activa es la que vale y es la que se cambia', () => {
    const t = 'memory_limit = 128M\nmemory_limit = 256M ; comentario\n';
    expect(valoresDe(t, ['memory_limit'])).toEqual({ memory_limit: '256M' });
    expect(conValores(t, { memory_limit: '1G' })).toBe('memory_limit = 128M\nmemory_limit = 1G\n');
    expect(valoresDe('date.timezone = "UTC"', ['date.timezone'])).toEqual({
      'date.timezone': 'UTC',
    });
  });

  it('cada clave tiene su validador y un valor inválido no se escribe', () => {
    const ok: [string, string][] = [
      ['memory_limit', '512M'],
      ['memory_limit', '-1'],
      ['upload_max_filesize', '64M'],
      ['post_max_size', '2G'],
      ['max_execution_time', '0'],
      ['display_errors', 'stderr'],
      ['error_reporting', 'E_ALL & ~E_DEPRECATED & ~E_STRICT'],
      ['error_reporting', '-1'],
      ['date.timezone', 'America/Bogota'],
      ['date.timezone', 'UTC'],
      ['opcache.enable', 'Off'],
    ];
    for (const [k, v] of ok)
      expect(VALORES_RAPIDOS[k as keyof typeof VALORES_RAPIDOS](v), `${k}=${v}`).toBe(true);
    const malos: [string, string][] = [
      ['memory_limit', '12X'],
      ['memory_limit', '512M; extension=evil'],
      ['upload_max_filesize', '-1'],
      ['max_execution_time', '1.5'],
      ['max_execution_time', '999999'],
      ['display_errors', 'quizas'],
      ['error_reporting', 'system("calc")'],
      ['error_reporting', ''],
      ['date.timezone', 'Marte/Base'],
      ['date.timezone', 'America/Bogota\nextension=evil'],
      ['opcache.enable', '2'],
    ];
    for (const [k, v] of malos) {
      expect(VALORES_RAPIDOS[k as keyof typeof VALORES_RAPIDOS](v), `${k}=${v}`).toBe(false);
      expect(() => conValores(INI, { [k]: v }), `${k}=${v}`).toThrow(ErrorWolf);
    }
    try {
      conValores(INI, { extension_dir: 'C:/otro' });
      expect.unreachable();
    } catch (e) {
      expect((e as ErrorWolf).codigo).toBe('php.valor_invalido');
      expect((e as ErrorWolf).datos).toEqual({ clave: 'extension_dir' });
    }
  });
});

describe('diffLineas', () => {
  it('muestra solo los cambios con contexto y nada si son iguales', () => {
    expect(diffLineas(INI, INI)).toBe('');
    const d = diffLineas(INI, conValores(INI, { memory_limit: '1G' }));
    expect(d).toContain('-memory_limit = 128M');
    expect(d).toContain('+memory_limit = 1G');
    expect(d).toMatch(/^@@ -\d+,\d+ \+\d+,\d+ @@/m);
    expect(d).not.toContain('opcache');
  });

  it('archivos enormes no cuelgan: se muestran como reemplazo completo', () => {
    const a = Array.from({ length: 5000 }, (_, i) => `a${i}`).join('\n');
    const b = Array.from({ length: 5000 }, (_, i) => `b${i}`).join('\n');
    const d = diffLineas(a, b);
    expect(d.split('\n').filter((l) => l.startsWith('-')).length).toBe(5000);
  });
});

describe('IniPhp', () => {
  let rutas: Rutas;
  let llamadas: string[][];
  let salida: { codigo: number; stdout: string; stderr: string };
  let encendida: boolean;
  let sano: boolean;
  let reinicios: number;
  let ini: string;

  const exec: Ejecutor = async (_cmd, args) => {
    llamadas.push(args);
    // Lo que se prueba es el archivo temporal: debe existir mientras corre php.
    const i = args.indexOf('-c');
    expect(existsSync(args[i + 1]!)).toBe(true);
    return salida;
  };

  const crear = (extra: Partial<DepsIniPhp> = {}) =>
    new IniPhp({
      rutas,
      exec,
      phpCli: (r) => path.join(rutas.bin('php', r), 'php'),
      ramasInstaladas: async () => ['8.4'],
      asegurarIni: async (r) => rutas.phpIni(r),
      encendida: () => encendida,
      reiniciar: async () => {
        reinicios++;
      },
      sano: async () => sano,
      ahora: () => new Date('2026-11-23T10:00:00.000Z'),
      ...extra,
    });

  beforeEach(async () => {
    rutas = new Rutas(await carpetaTemporal('pel-ini-'));
    llamadas = [];
    salida = { codigo: 0, stdout: SALIDA_OK, stderr: '' };
    encendida = false;
    sano = true;
    reinicios = 0;
    ini = rutas.phpIni('8.4');
    mkdirSync(path.dirname(ini), { recursive: true });
    writeFileSync(ini, INI);
  });

  it('guardar: copia con fecha, prueba con php -c <temporal> -v, escribe y marca editado', async () => {
    const p = crear();
    const nuevo = conValores(INI, { memory_limit: '1G' });
    expect(await p.diff('8.4', nuevo)).toContain('+memory_limit = 1G');
    const r = await p.guardar('8.4', nuevo);
    expect(readFileSync(ini, 'utf8')).toBe(nuevo);
    expect(r.respaldo).toMatch(/^php\.ini-2026-11-23T10-00-00-000Z\.txt$/);
    expect(readFileSync(path.join(rutaRespaldosIni(rutas, '8.4'), r.respaldo), 'utf8')).toBe(INI);
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(true);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]).toContain('-v');
    expect(llamadas[0]![llamadas[0]!.indexOf('-c') + 1]).not.toBe(ini);
    // El temporal de prueba no queda.
    expect(readdirSync(path.dirname(ini)).filter((n) => n.includes('prueba'))).toEqual([]);
    expect(reinicios).toBe(0);
    expect(await p.valores('8.4', ['memory_limit'])).toEqual({ memory_limit: '1G' });
    // Sobre el borrador del editor (sin escribir nada).
    expect(await p.conValores('8.4', { memory_limit: '2G' }, '; borrador\nmemory_limit=1M')).toBe(
      '; borrador\nmemory_limit = 2G',
    );
    expect(readFileSync(ini, 'utf8')).toBe(nuevo);
    expect((await p.respaldos('8.4')).map((x) => x.nombre)).toEqual([r.respaldo]);
  });

  it('php -v falla → php.ini_invalido con la salida y el archivo queda como estaba (Review Focus 3)', async () => {
    salida = {
      codigo: 0,
      stdout: SALIDA_OK,
      stderr:
        "PHP Warning:  PHP Startup: Unable to load dynamic library 'nada' in Unknown on line 0",
    };
    const p = crear();
    try {
      await p.guardar('8.4', INI + '\r\nextension=nada');
      expect.unreachable();
    } catch (e) {
      expect((e as ErrorWolf).codigo).toBe('php.ini_invalido');
      expect(String((e as ErrorWolf).datos?.['salida'])).toContain(
        'Unable to load dynamic library',
      );
      expect(String((e as ErrorWolf).datos?.['salida']).length).toBeLessThanOrEqual(200);
    }
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(false);
    expect(readdirSync(path.dirname(ini)).filter((n) => n.includes('prueba'))).toEqual([]);

    // Código de salida distinto de 0 o sin la línea de versión: también inválido.
    salida = {
      codigo: 255,
      stdout: '',
      stderr: "PHP:  syntax error, unexpected '=' in x on line 3",
    };
    await expect(p.guardar('8.4', 'a = = b')).rejects.toMatchObject({ codigo: 'php.ini_invalido' });
    salida = { codigo: 0, stdout: 'nada', stderr: '' };
    await expect(p.guardar('8.4', 'x=1')).rejects.toMatchObject({ codigo: 'php.ini_invalido' });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
  });

  it('con el pool encendido reinicia y, si no queda sano, restaura el anterior y reinicia otra vez', async () => {
    encendida = true;
    sano = false;
    const p = crear();
    await expect(p.guardar('8.4', conValores(INI, { memory_limit: '1G' }))).rejects.toMatchObject({
      codigo: 'php.no_arranco',
    });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect(reinicios).toBe(2);

    sano = true;
    reinicios = 0;
    await p.guardar('8.4', conValores(INI, { memory_limit: '1G' }));
    expect(reinicios).toBe(1);
  });

  it('un reinicio que lanza también restaura', async () => {
    encendida = true;
    let n = 0;
    const p = crear({
      reiniciar: async () => {
        n++;
        if (n === 1) throw new Error('php-cgi murió');
      },
    });
    await expect(p.guardar('8.4', 'memory_limit = 1G')).rejects.toMatchObject({
      codigo: 'php.no_arranco',
    });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect(n).toBe(2);
  });

  it('restaurar una copia la vuelve a aplicar (con su propia copia previa)', async () => {
    const p = crear({ ahora: () => new Date() });
    const r1 = await p.guardar('8.4', 'memory_limit = 1G');
    await p.restaurar('8.4', r1.respaldo);
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect((await p.respaldos('8.4')).length).toBe(2);
  });

  it('rechaza ramas no instaladas, copias inexistentes y textos inválidos', async () => {
    const p = crear();
    await expect(p.leer('7.4')).rejects.toMatchObject({ codigo: 'php.rama_no_instalada' });
    await expect(p.guardar('../8.4', 'x')).rejects.toMatchObject({
      codigo: 'php.rama_no_instalada',
    });
    for (const nombre of ['../php.ini', 'php.ini-x.txt', 'C:\\php.ini', '']) {
      await expect(p.restaurar('8.4', nombre)).rejects.toMatchObject({
        codigo: 'php.respaldo_no_existe',
      });
    }
    await expect(p.guardar('8.4', 'a\0b')).rejects.toMatchObject({
      codigo: 'php.argumento_invalido',
    });
    await expect(p.guardar('8.4', 'x'.repeat(1024 * 1024 + 1))).rejects.toMatchObject({
      codigo: 'php.argumento_invalido',
    });
    expect(llamadas).toEqual([]);
  });

  it('dos guardados a la vez van en fila (ninguno pisa la copia del otro)', async () => {
    const p = crear({ ahora: () => new Date() });
    await Promise.all([p.guardar('8.4', 'a=1'), p.guardar('8.4', 'a=2')]);
    const copias = await p.respaldos('8.4');
    const contenidos = copias.map((c) =>
      readFileSync(path.join(rutaRespaldosIni(rutas, '8.4'), c.nombre), 'utf8'),
    );
    expect(contenidos.sort()).toEqual([INI, 'a=1'].sort());
    expect(readFileSync(ini, 'utf8')).toBe('a=2');
  });
});

describe('ServicioPhp con un php.ini editado por el usuario', () => {
  it('iniciar no lo regenera; solo corrige extension_dir (con copia previa)', async () => {
    const rutas = new Rutas(await carpetaTemporal('pel-ini-srv-'));
    const bin = rutas.bin('php', '8.4');
    mkdirSync(path.join(bin, 'ext'), { recursive: true });
    writeFileSync(path.join(bin, 'php.ini-development'), ';extension=curl\n');
    writeFileSync(path.join(bin, 'php-cgi.exe'), '');
    const supervisor = {
      iniciar: vi.fn(async () => undefined),
      detener: vi.fn(),
      estado: () => 'apagado',
      pid: () => null,
    };
    const srv = new ServicioPhp(
      rutas,
      { quienUsaPuerto: async () => null, ejecutable: (n: string) => `${n}.exe` } as never,
      supervisor as never,
      { instalado: async () => true } as never,
      async () => ({ servicios: { php: { trabajadores: 1 } } }) as never,
    );
    const ini = rutas.phpIni('8.4');
    mkdirSync(path.dirname(ini), { recursive: true });
    const propio = '; mío\nextension_dir="C:/viejo/ext"\nmemory_limit = 3G\n';
    writeFileSync(ini, propio);
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await srv.iniciar('8.4');
    const despues = readFileSync(ini, 'utf8');
    expect(despues).toContain('; mío');
    expect(despues).toContain('memory_limit = 3G');
    expect(despues).not.toContain('C:/viejo/ext');
    expect(despues).toContain(`${bin.replace(/\\/g, '/')}/ext`);
    expect(readdirSync(rutaRespaldosIni(rutas, '8.4'))).toHaveLength(1);
    expect(supervisor.iniciar).toHaveBeenCalled();
    // Sin cambios que hacer, no hay otra copia.
    await srv.asegurarPhpIni('8.4');
    expect(readdirSync(rutaRespaldosIni(rutas, '8.4'))).toHaveLength(1);
  });
});
