import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  conValores,
  diffLineas,
  ARGS_PRUEBA_INI_SITIO,
  IniPhp,
  rutaHuellaGenerado,
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
    const respuestas = [false, true];
    const p = crear({ sano: async () => respuestas.shift() ?? true });
    await expect(p.guardar('8.4', conValores(INI, { memory_limit: '1G' }))).rejects.toMatchObject({
      codigo: 'php.no_arranco',
    });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect(reinicios).toBe(2);
    // La marca no existía antes: la vuelta atrás la quita.
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(false);

    // Si tras restaurar sigue sin responder, se dice tal cual (no "sigue como antes").
    reinicios = 0;
    sano = false;
    await expect(
      crear().guardar('8.4', conValores(INI, { memory_limit: '1G' })),
    ).rejects.toMatchObject({ codigo: 'php.caido_tras_restaurar', datos: { rama: '8.4' } });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    expect(reinicios).toBe(2);

    // Con la marca de antes, la vuelta atrás la conserva.
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await expect(crear().guardar('8.4', 'memory_limit = 1G')).rejects.toBeInstanceOf(ErrorWolf);
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(true);

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

  it('la prueba fuerza mostrar los fallos de arranque aunque el ini los apague y los mande a un log', async () => {
    // PHP falso: con display_errors=Off y error_log, el aviso solo sale si se fuerzan los -d.
    const php: Ejecutor = async (_cmd, args) => {
      llamadas.push(args);
      const d = (k: string) => args.includes(k);
      const visible =
        d('display_errors=stderr') &&
        d('display_startup_errors=1') &&
        d('log_errors=0') &&
        args.some((a) => /^error_log=(NUL|\/dev\/null)?$/.test(a));
      return {
        codigo: 0,
        stdout: SALIDA_OK,
        stderr: visible ? "PHP Warning:  PHP Startup: Unable to load dynamic library 'nada'" : '',
      };
    };
    const p = crear({ exec: php });
    const roto = [
      'display_errors = Off',
      'display_startup_errors = Off',
      'log_errors = On',
      'error_log = "C:/logs/php.log"',
      'extension=nada',
    ].join('\n');
    await expect(p.guardar('8.4', roto)).rejects.toMatchObject({ codigo: 'php.ini_invalido' });
    expect(readFileSync(ini, 'utf8')).toBe(INI);
    // Los -d van después de -c: pisan lo que diga el archivo.
    const a = llamadas[0]!;
    expect(a.indexOf('-c')).toBeLessThan(a.indexOf('display_errors=stderr'));
  });

  it('probar acepta -d extra después de los forzados (el ini de un sitio: sin depurar al probar)', async () => {
    await crear().probar('8.4', 'memory_limit = 1G', ARGS_PRUEBA_INI_SITIO);
    const a = llamadas[0]!;
    expect(a.slice(-3)).toEqual(['-d', 'xdebug.start_with_request=no', '-v']);
  });

  it('copia y vuelta atrás byte a byte (php.ini en cp1252, no UTF-8)', async () => {
    // "; Configuración" en Windows-1252: 0xF3 no es UTF-8 válido.
    const bytes = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\r\nmemory_limit = 128M\r\n', 'latin1'),
    ]);
    writeFileSync(ini, bytes);
    encendida = true;
    const respuestas = [false, true];
    const p = crear({ sano: async () => respuestas.shift() ?? true, ahora: () => new Date() });
    await expect(p.guardar('8.4', 'memory_limit = 1G')).rejects.toMatchObject({
      codigo: 'php.no_arranco',
    });
    expect(readFileSync(ini).equals(bytes)).toBe(true);
    const [copia] = await p.respaldos('8.4');
    const rutaCopia = path.join(rutaRespaldosIni(rutas, '8.4'), copia!.nombre);
    expect(readFileSync(rutaCopia).equals(bytes)).toBe(true);
    // Restaurar esa copia también deja los bytes tal cual.
    await p.guardar('8.4', 'memory_limit = 1G');
    await p.restaurar('8.4', copia!.nombre);
    expect(readFileSync(ini).equals(bytes)).toBe(true);
  });

  it('leer y guardar un ini en cp1252 no lo corrompe: lo no tocado queda byte a byte (N1)', async () => {
    const bytes = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\r\nmemory_limit = 128M\r\n', 'latin1'),
    ]);
    writeFileSync(ini, bytes);
    const p = crear();
    const texto = await p.leer('8.4');
    expect(texto).toContain('; Configuración');
    await p.guardar('8.4', conValores(texto, { memory_limit: '1G' }));
    const esperado = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\r\nmemory_limit = 1G\r\n', 'latin1'),
    ]);
    expect(readFileSync(ini).equals(esperado)).toBe(true);
    // El diff tampoco ve cambios fantasma en la línea con tilde.
    expect(await p.diff('8.4', await p.leer('8.4'))).toBe('');
    // Un carácter que cp1252 no tiene: el archivo pasa entero a UTF-8 (la copia guarda el original).
    await p.guardar('8.4', `${await p.leer('8.4')}; ✓\r\n`);
    const utf8 = readFileSync(ini, 'utf8');
    expect(utf8).toContain('; Configuración');
    expect(utf8).toContain('; ✓');
  });

  it('un ini con BOM UTF-8 conserva el BOM al guardar', async () => {
    writeFileSync(ini, Buffer.from('\uFEFFmemory_limit = 128M\n', 'utf8'));
    const p = crear();
    expect(await p.leer('8.4')).toBe('memory_limit = 128M\n');
    await p.guardar('8.4', 'memory_limit = 1G\n');
    expect(
      readFileSync(ini)
        .subarray(0, 3)
        .equals(Buffer.from([0xef, 0xbb, 0xbf])),
    ).toBe(true);
  });

  it('las copias con fecha rotan: quedan las 20 más nuevas', async () => {
    const carpeta = rutaRespaldosIni(rutas, '8.4');
    mkdirSync(carpeta, { recursive: true });
    for (let i = 0; i < 25; i++) {
      const n = String(i).padStart(2, '0');
      writeFileSync(path.join(carpeta, `php.ini-2026-01-01T00-00-${n}-000Z.txt`), `v${i}`);
    }
    writeFileSync(path.join(carpeta, 'nota-del-usuario.txt'), 'no se toca');
    await crear().guardar('8.4', 'memory_limit = 1G');
    const copias = await crear().respaldos('8.4');
    expect(copias).toHaveLength(20);
    expect(copias[0]!.nombre).toMatch(/^php\.ini-2026-11-23/);
    expect(existsSync(path.join(carpeta, 'nota-del-usuario.txt'))).toBe(true);
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

function servicioSimple(rutas: Rutas): ServicioPhp {
  return new ServicioPhp(
    rutas,
    { quienUsaPuerto: async () => null, ejecutable: (n: string) => `${n}.exe` } as never,
    { iniciar: vi.fn(), detener: vi.fn(), estado: () => 'apagado', pid: () => null } as never,
    { instalado: async () => true } as never,
    async () => ({ servicios: { php: { trabajadores: 1 } } }) as never,
  );
}

describe('ServicioPhp y el php.ini de la rama', () => {
  async function montar() {
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
    const copias = () =>
      existsSync(rutaRespaldosIni(rutas, '8.4')) ? readdirSync(rutaRespaldosIni(rutas, '8.4')) : [];
    return { rutas, bin, srv, ini, supervisor, copias };
  }

  it('iniciar no regenera un ini editado; solo corrige extension_dir (con copia previa)', async () => {
    const { rutas, bin, srv, ini, supervisor, copias } = await montar();
    const propio = '; mío\nextension_dir="C:/viejo/ext"\nmemory_limit = 3G\n';
    writeFileSync(ini, propio);
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await srv.iniciar('8.4');
    const despues = readFileSync(ini, 'utf8');
    expect(despues).toContain('; mío');
    expect(despues).toContain('memory_limit = 3G');
    expect(despues).not.toContain('C:/viejo/ext');
    expect(despues).toContain(`${bin.replace(/\\/g, '/')}/ext`);
    expect(copias()).toHaveLength(1);
    expect(supervisor.iniciar).toHaveBeenCalled();
    // Sin cambios que hacer, no hay otra copia.
    await srv.asegurarPhpIni('8.4');
    expect(copias()).toHaveLength(1);
  });

  it('extension_dir equivalente (barras, mayúsculas, comillas, comentario) no se reescribe', async () => {
    const { rutas, bin, srv, ini, copias } = await montar();
    const dir = `${bin.replace(/\//g, '\\')}\\ext\\`.toUpperCase();
    const propio = `; mío\nextension_dir = ${dir} ; carpeta de extensiones\nmemory_limit = 3G\n`;
    writeFileSync(ini, propio);
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await srv.iniciar('8.4');
    expect(readFileSync(ini, 'utf8')).toBe(propio);
    expect(copias()).toEqual([]);
  });

  it('un ini sin marca editado por fuera (huella distinta de la generada) se trata como editado', async () => {
    const { rutas, srv, ini, copias } = await montar();
    await srv.iniciar('8.4');
    const generado = readFileSync(ini, 'utf8');
    writeFileSync(ini, generado + '\nmemory_limit = 3G\n');
    await srv.iniciar('8.4');
    expect(readFileSync(ini, 'utf8')).toContain('memory_limit = 3G');
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(true);
    expect(copias()).toEqual([]);
  });

  it('carpeta de datos con tildes y un ini editado en cp1252: extension_dir sale en UTF-8 (N2)', async () => {
    const rutas = new Rutas(await carpetaTemporal('pel-ini-áé-'));
    const bin = rutas.bin('php', '8.4');
    mkdirSync(path.join(bin, 'ext'), { recursive: true });
    const srv = servicioSimple(rutas);
    const ini = rutas.phpIni('8.4');
    mkdirSync(path.dirname(ini), { recursive: true });
    const original = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\r\nextension_dir="C:/viejo/ext"\r\nmemory_limit = 3G\r\n', 'latin1'),
    ]);
    writeFileSync(ini, original);
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await srv.asegurarPhpIni('8.4');
    const despues = readFileSync(ini);
    // UTF-8 válido de punta a punta: PHP lee las rutas en UTF-8.
    const texto = new TextDecoder('utf-8', { fatal: true }).decode(despues);
    expect(texto).toContain(`${bin.replace(/\\/g, '/')}/ext`);
    expect(texto).toContain('; Configuración');
    expect(texto).toContain('memory_limit = 3G');
    const carpeta = rutaRespaldosIni(rutas, '8.4');
    expect(readdirSync(carpeta)).toHaveLength(1);
    expect(readFileSync(path.join(carpeta, readdirSync(carpeta)[0]!)).equals(original)).toBe(true);
    // Estable: otra vuelta no cambia nada ni hace otra copia.
    await srv.asegurarPhpIni('8.4');
    expect(readFileSync(ini).equals(despues)).toBe(true);
    expect(readdirSync(carpeta)).toHaveLength(1);
  });

  it('un ini en cp1252 con extension_dir con tildes en cp1252 pasa a UTF-8', async () => {
    const rutas = new Rutas(await carpetaTemporal('pel-ini-ñ-'));
    const bin = rutas.bin('php', '8.4');
    mkdirSync(path.join(bin, 'ext'), { recursive: true });
    const srv = servicioSimple(rutas);
    const ini = rutas.phpIni('8.4');
    mkdirSync(path.dirname(ini), { recursive: true });
    writeFileSync(ini, Buffer.from(`extension_dir="${bin.replace(/\\/g, '/')}/ext"\n`, 'latin1'));
    writeFileSync(rutaMarcaEditado(rutas, '8.4'), '');
    await srv.asegurarPhpIni('8.4');
    const texto = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(ini));
    expect(texto).toContain(`${bin.replace(/\\/g, '/')}/ext`);
  });

  it('la huella del ini generado se anota antes de escribirlo: un corte en medio no lo vuelve editado (N4)', async () => {
    const { rutas, srv, ini } = await montar();
    await srv.iniciar('8.4');
    const generado = readFileSync(ini);
    const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
    // Estado tras un corte entre la huella y el ini: la huella trae la anterior y la pendiente.
    writeFileSync(
      rutaHuellaGenerado(rutas, '8.4'),
      `${sha(Buffer.from('otro'))}\n${sha(generado)}\n`,
    );
    await srv.iniciar('8.4');
    expect(existsSync(rutaMarcaEditado(rutas, '8.4'))).toBe(false);
    // Tras escribir, la huella queda solo con lo generado.
    expect(readFileSync(rutaHuellaGenerado(rutas, '8.4'), 'utf8').trim()).toBe(
      sha(readFileSync(ini)),
    );
  });

  it('al arrancar la rama se borran las DLL apartadas de una actualización (N5)', async () => {
    const { bin, srv } = await montar();
    const ext = path.join(bin, 'ext');
    writeFileSync(path.join(ext, 'php_xdebug.dll'), 'nueva');
    writeFileSync(path.join(ext, 'php_xdebug.dll.anterior-0a1b2c3d'), 'vieja');
    writeFileSync(path.join(ext, 'php_xdebug.dll.descartada-0a1b2c3d'), 'mala');
    writeFileSync(path.join(ext, 'notas.anterior-x.txt'), 'del usuario');
    await srv.iniciar('8.4');
    expect(readdirSync(ext).sort()).toEqual(['notas.anterior-x.txt', 'php_xdebug.dll']);
  });

  it('los trabajadores de la rama exigen hora de creación al readoptar', async () => {
    const { srv, supervisor } = await montar();
    await srv.iniciar('8.4');
    expect(supervisor.iniciar).toHaveBeenCalledWith(
      expect.objectContaining({ exigirInicio: true }),
    );
  });

  it('un ini viejo sin huella que difiere del regenerado se copia antes de regenerarlo', async () => {
    const { srv, ini, copias, rutas } = await montar();
    writeFileSync(ini, '; de una versión anterior\nmemory_limit = 3G\n');
    await srv.iniciar('8.4');
    expect(readFileSync(ini, 'utf8')).not.toContain('memory_limit = 3G');
    expect(copias()).toHaveLength(1);
    expect(readFileSync(path.join(rutaRespaldosIni(rutas, '8.4'), copias()[0]!), 'utf8')).toContain(
      'memory_limit = 3G',
    );
    // Arrancar otra vez con el regenerado intacto: ni copia ni cambio.
    await srv.iniciar('8.4');
    expect(copias()).toHaveLength(1);
  });
});
