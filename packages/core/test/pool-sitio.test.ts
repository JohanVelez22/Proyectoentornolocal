import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { generarVhost } from '../src/nginx/plantillas';
import { generarNginxPrincipal, puertosPhp } from '../src/nginx/principal';
import {
  AjustesPhpSitio,
  asignarPuertosPools,
  esFalloAjenoAlIni,
  iniSitio,
  necesitaPoolPropio,
  nombreUpstreamSitio,
  PoolsSitio,
  RANGO_POOLS_SITIO,
  validarPhpIni,
  type AvisoPoolSitio,
  type DepsAjustesPhpSitio,
} from '../src/php/poolSitio';
import type { DefProceso, EstadoProceso } from '../src/procesos/supervisor';
import { Rutas } from '../src/rutas';
import { SitioSchema, type Sitio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

const X = { activo: true, modo: ['debug' as const], puerto: 9003, inicio: 'trigger' as const };

const sitio = (o: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'tienda',
    nombre: 'Tienda',
    dominio: 'tienda.test',
    carpeta: 'C:/Proyectos/Tienda',
    tipo: 'laravel',
    php: '8.4',
    ...o,
  });

const OPCIONES_VHOST = {
  puertoNginx: 80,
  rutasLogs: { acceso: 'C:/W/logs/a.log', error: 'C:/W/logs/e.log' },
};

describe('pool propio por sitio', () => {
  it('sin ajustes sigue en el pool compartido; con ajustes o Xdebug activo, pool propio', () => {
    expect(necesitaPoolPropio(sitio())).toBe(false);
    expect(necesitaPoolPropio(sitio({ phpIni: { memory_limit: '1G' } }))).toBe(true);
    expect(necesitaPoolPropio(sitio({ xdebug: X }))).toBe(true);
    expect(necesitaPoolPropio(sitio({ xdebug: { ...X, activo: false } }))).toBe(false);
    // Sin PHP no hay pool aunque queden ajustes guardados.
    expect(necesitaPoolPropio(sitio({ tipo: 'estatico', php: null, xdebug: X }))).toBe(false);
    // Los sitios viejos (config.json sin los campos) nacen sin ajustes.
    const viejo = SitioSchema.parse({
      id: 'a',
      nombre: 'A',
      dominio: 'a.test',
      carpeta: 'C:/a',
      tipo: 'laravel',
      php: '8.4',
    });
    expect(viejo.phpIni ?? {}).toEqual({});
    expect(viejo.xdebug ?? null).toBeNull();
    expect(necesitaPoolPropio(viejo)).toBe(false);
  });

  it('vhost exacto: el sitio con Xdebug usa su upstream; el resto, el de la rama', () => {
    expect(generarVhost(sitio(), OPCIONES_VHOST)).toContain('fastcgi_pass php84;');
    expect(generarVhost(sitio({ id: 'mi-tienda', xdebug: X }), OPCIONES_VHOST)).toBe(
      [
        'server {',
        '    listen 80;',
        '    server_name tienda.test;',
        '    charset utf-8;',
        '    root "C:/Proyectos/Tienda/public";',
        '    access_log "C:/W/logs/a.log";',
        '    error_log "C:/W/logs/e.log";',
        '    index index.php index.html;',
        '    location / { try_files $uri $uri/ /index.php?$query_string; }',
        '    location = /index.php {',
        '        fastcgi_pass phpsitio_mi_tienda;',
        '        include fastcgi_params;',
        '        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;',
        '    }',
        '    location ~* \\.php$ { return 404; }',
        '    location ~* /\\.(?!well-known) { deny all; }',
        '}',
        '',
      ].join('\n'),
    );
    expect(nombreUpstreamSitio('mi-tienda-2')).toBe('phpsitio_mi_tienda_2');
  });

  it('nginx.conf declara el upstream del sitio con sus puertos', () => {
    const conf = generarNginxPrincipal({
      prefijo: 'C:/n',
      sitesDir: 'C:/s',
      logsDir: 'C:/l',
      puerto: 80,
      phpUpstreams: [
        { version: '8.4', puertos: [9840] },
        { version: '8.4', nombre: 'phpsitio_tienda', puertos: [19000, 19001] },
      ],
    });
    expect(conf).toContain(
      '    upstream phpsitio_tienda {\n        server 127.0.0.1:19000;\n        server 127.0.0.1:19001;\n    }',
    );
    expect(conf).toContain('    upstream php84 {\n        server 127.0.0.1:9840;\n    }');
  });

  it('puertos sin choque: fuera de los reservados, de los pools de rama y entre sitios', () => {
    const sitios = [
      sitio({ id: 'b', xdebug: X }),
      sitio({ id: 'a', phpIni: { memory_limit: '1G' } }),
      sitio({ id: 'c' }),
      sitio({ id: 'd', xdebug: X }),
    ];
    const ocupados = [
      RANGO_POOLS_SITIO.desde,
      RANGO_POOLS_SITIO.desde + 2,
      ...puertosPhp('8.4', 8),
    ];
    const m = asignarPuertosPools(sitios, ocupados);
    // Orden estable por id; 1 trabajador con ajustes, 2 con Xdebug.
    expect([...m.keys()]).toEqual(['a', 'b', 'd']);
    expect(m.get('a')).toEqual([RANGO_POOLS_SITIO.desde + 1]);
    expect(m.get('b')).toEqual([RANGO_POOLS_SITIO.desde + 3, RANGO_POOLS_SITIO.desde + 4]);
    const todos = [...m.values()].flat();
    expect(new Set(todos).size).toBe(todos.length);
    for (const p of todos) {
      expect(ocupados).not.toContain(p);
      expect(p).toBeGreaterThanOrEqual(RANGO_POOLS_SITIO.desde);
      expect(p).toBeLessThanOrEqual(RANGO_POOLS_SITIO.hasta);
    }
    // Igual entrada → igual salida (nginx y los pools ven los mismos puertos).
    expect(asignarPuertosPools(sitios, ocupados)).toEqual(m);
  });

  it('un sitio nuevo con pool no mueve los puertos de los que ya estaban', () => {
    const antes = asignarPuertosPools([sitio({ id: 'b', xdebug: X })], []);
    const despues = asignarPuertosPools(
      [sitio({ id: 'a', xdebug: X }), sitio({ id: 'b', xdebug: X })],
      [],
      antes,
    );
    expect(despues.get('b')).toEqual(antes.get('b'));
    expect(despues.get('a')).toEqual([RANGO_POOLS_SITIO.desde + 2, RANGO_POOLS_SITIO.desde + 3]);
    // Si ya no alcanza (pasó de 1 a 2 trabajadores) o un puerto quedó ocupado, se reasigna.
    const ocupado = asignarPuertosPools(
      [sitio({ id: 'b', xdebug: X })],
      [antes.get('b')![0]!],
      antes,
    );
    expect(ocupado.get('b')).not.toContain(antes.get('b')![0]);
  });

  it('sin puertos libres: el sitio que no cabe queda fuera (sin romper a los demás)', () => {
    const todos: number[] = [];
    for (let p = RANGO_POOLS_SITIO.desde + 1; p <= RANGO_POOLS_SITIO.hasta; p++) todos.push(p);
    const sinLugar: string[] = [];
    const m = asignarPuertosPools(
      [sitio({ id: 'a', phpIni: { a: '1' } }), sitio({ id: 'b', xdebug: X })],
      todos,
      new Map(),
      sinLugar,
    );
    expect([...m.keys()]).toEqual(['a']);
    expect(sinLugar).toEqual(['b']);
  });

  it('fallos ajenos al ini (puerto ocupado, sin puertos) no son culpa del ini de la rama', () => {
    const ajeno = Object.assign(new Error('x'), { codigo: 'servicios.puerto_ocupado' });
    const sinPuertos = Object.assign(new Error('x'), { codigo: 'php.sin_puertos_sitio' });
    const otro = new Error('php-cgi terminó');
    expect(esFalloAjenoAlIni(ajeno)).toBe(true);
    expect(esFalloAjenoAlIni(sinPuertos)).toBe(true);
    expect(esFalloAjenoAlIni(otro)).toBe(false);
  });
});

describe('iniSitio', () => {
  const RAMA = '[PHP]\r\nmemory_limit = 128M\r\nextension_dir = "C:/php/ext"\r\n';

  it('el bloque del sitio abre con [PHP] (el ini de la rama puede terminar en [PATH=…])', () => {
    const conSeccion = '[PHP]\nmemory_limit = 128M\n[PATH=C:/otro]\ndisplay_errors = On\n';
    const t = iniSitio(sitio({ phpIni: { memory_limit: '1G' } }), conSeccion);
    const resto = t.slice(conSeccion.length).split('\n');
    expect(resto[0]).toBe('[PHP]');
    expect(resto).toContain('memory_limit = 1G');
  });

  it('ajustes guardados que ya no son válidos (config.json editado) se descartan y se informan', () => {
    const descartados: string[] = [];
    const t = iniSitio(
      sitio({
        phpIni: { extension: 'evil', memory_limit: '1G; extension=x', post_max_size: '64M' },
      }),
      RAMA,
      null,
      descartados,
    );
    expect(t).toContain('post_max_size = 64M');
    expect(t).not.toContain('evil');
    expect(t).not.toContain('extension=x');
    expect(descartados.sort()).toEqual(['extension', 'memory_limit']);
  });

  it('ini de la rama + ajustes del sitio al final (la última línea vale) con sus saltos', () => {
    const t = iniSitio(sitio({ phpIni: { memory_limit: '1G', 'date.timezone': 'UTC' } }), RAMA);
    expect(t.startsWith(RAMA)).toBe(true);
    const fin = t.slice(RAMA.length).split('\r\n');
    expect(fin).toContain('memory_limit = 1G');
    expect(fin).toContain('date.timezone = UTC');
    expect(t).not.toContain('xdebug');
    expect(t.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('con Xdebug: carga la DLL y sus ajustes; si la rama ya la carga, no la repite', () => {
    const dll = 'C:\\php\\ext\\php_xdebug.dll';
    const t = iniSitio(sitio({ xdebug: X }), RAMA, dll);
    expect(t).toContain('zend_extension="C:/php/ext/php_xdebug.dll"');
    expect(t).toContain('xdebug.mode=debug');
    expect(t).toContain('xdebug.client_host=127.0.0.1');
    const conXdebug = `${RAMA}zend_extension=xdebug\r\n`;
    expect(iniSitio(sitio({ xdebug: X }), conXdebug, dll)).not.toContain(
      'zend_extension="C:/php/ext/php_xdebug.dll"',
    );
    // Xdebug apagado: nada de Xdebug.
    expect(
      iniSitio(sitio({ xdebug: { ...X, activo: false }, phpIni: { a: '1' } }), RAMA, dll),
    ).not.toContain('xdebug');
  });
});

describe('validarPhpIni', () => {
  it('acepta ajustes comunes y rechaza lo que carga código o rompe el archivo', () => {
    expect(
      validarPhpIni({
        memory_limit: '1G',
        'session.gc_maxlifetime': '7200',
        error_reporting: 'E_ALL & ~E_DEPRECATED',
        'date.timezone': 'America/Bogota',
      }),
    ).toEqual({
      memory_limit: '1G',
      'session.gc_maxlifetime': '7200',
      error_reporting: 'E_ALL & ~E_DEPRECATED',
      'date.timezone': 'America/Bogota',
    });
    expect(validarPhpIni({})).toEqual({});
    for (const malo of [
      { extension: 'evil' },
      { zend_extension: 'evil' },
      { extension_dir: 'C:/x' },
      { 'xdebug.mode': 'debug' },
      { memory_limit: '1G; extension=evil' },
      { memory_limit: '1G\nextension=evil' },
      { memory_limit: '"1G"' },
      { memory_limit: 'x'.repeat(300) },
      { memory_limit: 'mucho' },
      { 'mal nombre': '1' },
      { a: '${PATH}' },
      { a: 1 },
      { __proto__: { a: '1' } },
      Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`k${i}`, '1'])),
      'memory_limit=1G',
      null,
    ]) {
      expect(() => validarPhpIni(malo), JSON.stringify(malo)).toThrow(
        expect.objectContaining({
          codigo: expect.stringMatching(/^php\.(valor|argumento)_invalido$/),
        }),
      );
    }
  });
});

describe('PoolsSitio', () => {
  let rutas: Rutas;
  let sitios: Sitio[];
  let encendidas: Set<string>;
  let estados: Map<string, EstadoProceso>;
  let iniciados: DefProceso[];
  let detenidos: string[];
  let iniRama: string;

  const supervisor = {
    iniciar: async (d: DefProceso) => {
      iniciados.push(d);
      estados.set(d.id, 'encendido');
    },
    detener: async (id: string) => {
      detenidos.push(id);
      estados.set(id, 'apagado');
    },
    estado: (id: string) => estados.get(id) ?? 'apagado',
    pid: () => null,
    ids: () => [...estados.keys()],
  };

  const crear = () =>
    new PoolsSitio({
      rutas,
      plataforma: { ejecutable: (n) => `${n}.exe`, quienUsaPuerto: async () => null },
      supervisor,
      leerSitios: async () => sitios,
      ramasInstaladas: async () => ['8.3', '8.4'],
      ramaEncendida: (r) => encendidas.has(r),
      leerIniRama: async () => Buffer.from(iniRama, 'utf8'),
      rutaDllXdebug: (r) => path.join(rutas.bin('php', r), 'ext', 'php_xdebug.dll'),
      ocupados: async () => ocupados,
      puertosRama: async (r) => (r === '8.4' ? [9840, 9841] : [9830]),
      avisar: (a) => avisos.push(a),
      sonda: async () => true,
      ...(usoPuerto
        ? { plataforma: { ejecutable: (n: string) => `${n}.exe`, quienUsaPuerto: usoPuerto } }
        : {}),
    });

  let ocupados: number[];
  let avisos: AvisoPoolSitio[];
  let usoPuerto: ((p: number) => Promise<{ pid: number; nombre: string } | null>) | null;

  beforeEach(async () => {
    ocupados = [];
    avisos = [];
    usoPuerto = null;
    rutas = new Rutas(await carpetaTemporal('pel-pool-'));
    sitios = [
      sitio({ id: 'tienda', xdebug: X }),
      sitio({ id: 'blog' }),
      sitio({ id: 'viejo', php: '8.3', phpIni: { memory_limit: '1G' } }),
    ];
    encendidas = new Set(['8.4']);
    estados = new Map();
    iniciados = [];
    detenidos = [];
    iniRama = 'memory_limit = 128M\n';
  });

  it('arranca solo los pools de sitios con ajustes cuya rama está encendida', async () => {
    const p = crear();
    await p.sincronizar();
    expect(iniciados.map((d) => d.id)).toEqual(['php-sitio-tienda-0', 'php-sitio-tienda-1']);
    const d = iniciados[0]!;
    expect(d.comando).toBe(path.join(rutas.bin('php', '8.4'), 'php-cgi.exe'));
    expect(d.args).toEqual(['-c', p.rutaIni('tienda'), '-b', `127.0.0.1:${d.puerto}`]);
    expect(d.reiniciar).toBe(true);
    // Al readoptar se exige la hora de creación: un PID reutilizado por otro php-cgi no se toca.
    expect(d.exigirInicio).toBe(true);
    const ini = readFileSync(p.rutaIni('tienda'), 'utf8');
    expect(ini).toContain('memory_limit = 128M');
    expect(ini).toContain('xdebug.mode=debug');
    // Su upstream y sus puertos son los mismos que se anuncian a nginx.
    const ups = await p.upstreams();
    expect(ups).toEqual(
      [
        { version: '8.4', nombre: 'phpsitio_tienda', puertos: iniciados.map((x) => x.puerto) },
        { version: '8.3', nombre: 'phpsitio_viejo', puertos: [expect.any(Number)] },
      ].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    expect(await p.sanoSitio('tienda')).toBe(true);
  });

  it('sin cambios no reinicia; si cambia el ini (o se fuerza la rama) sí', async () => {
    const p = crear();
    await p.sincronizar();
    iniciados = [];
    await p.sincronizar();
    expect(iniciados).toEqual([]);
    iniRama = 'memory_limit = 256M\n';
    await p.sincronizar();
    expect(iniciados.map((d) => d.id)).toEqual(['php-sitio-tienda-0', 'php-sitio-tienda-1']);
    iniciados = [];
    await p.reiniciarRama('8.4');
    expect(iniciados).toHaveLength(2);
  });

  it('un sitio que deja de tener ajustes (o se borra) apaga su pool; una rama apagada, también', async () => {
    const p = crear();
    await p.sincronizar();
    sitios = [sitio({ id: 'tienda' })];
    await p.sincronizar();
    expect(detenidos).toEqual(['php-sitio-tienda-0', 'php-sitio-tienda-1']);
    expect(existsSync(p.rutaIni('tienda'))).toBe(false);
    sitios = [sitio({ id: 'tienda', xdebug: X })];
    await p.sincronizar();
    detenidos = [];
    await p.detenerRama('8.4');
    expect(detenidos).toEqual(['php-sitio-tienda-0', 'php-sitio-tienda-1']);
    // Pool de una sesión anterior (readoptado) de un sitio que ya no existe: también se apaga.
    estados.set('php-sitio-borrado-0', 'encendido');
    detenidos = [];
    await p.sincronizar();
    expect(detenidos).toContain('php-sitio-borrado-0');
  });

  it('un puerto ocupado por otro programa: error de ese sitio, los demás arrancan', async () => {
    sitios = [sitio({ id: 'a', phpIni: { a: '1' } }), sitio({ id: 'b', phpIni: { b: '1' } })];
    const pa = RANGO_POOLS_SITIO.desde;
    usoPuerto = async (p) => (p === pa ? { pid: 4242, nombre: 'httpd.exe' } : null);
    const errores = await crear().sincronizar();
    expect([...errores.keys()]).toEqual(['a']);
    expect(errores.get('a')).toMatchObject({ codigo: 'servicios.puerto_ocupado' });
    expect(iniciados.map((d) => d.id)).toEqual(['php-sitio-b-0']);
    expect(avisos).toContainEqual(expect.objectContaining({ sitio: 'tienda.test', tipo: 'fallo' }));
  });

  it('sin puertos libres: el sitio va al upstream de su rama y se avisa; nginx sigue siendo válido', async () => {
    for (let p = RANGO_POOLS_SITIO.desde; p <= RANGO_POOLS_SITIO.hasta; p++) ocupados.push(p);
    const p = crear();
    const errores = await p.sincronizar();
    expect(errores.get('tienda')).toMatchObject({ codigo: 'php.sin_puertos_sitio' });
    expect(iniciados).toEqual([]);
    const ups = await p.upstreams();
    expect(ups.find((u) => u.nombre === 'phpsitio_tienda')?.puertos).toEqual([9840, 9841]);
    expect(avisos).toContainEqual(expect.objectContaining({ tipo: 'sin_puertos' }));
  });

  it('ajustes guardados inválidos se descartan del ini y se avisa', async () => {
    sitios = [sitio({ id: 'tienda', phpIni: { extension: 'evil', memory_limit: '1G' } })];
    const p = crear();
    await p.sincronizar();
    const ini = readFileSync(p.rutaIni('tienda'), 'utf8');
    expect(ini).not.toContain('evil');
    expect(ini).toContain('memory_limit = 1G');
    expect(avisos).toContainEqual(
      expect.objectContaining({ tipo: 'descartados', claves: ['extension'] }),
    );
  });

  it('un ini de la rama en cp1252 se copia al del sitio con la misma codificación', async () => {
    const bytes = Buffer.concat([
      Buffer.from('; Configuraci', 'latin1'),
      Buffer.from([0xf3]),
      Buffer.from('n\n'),
    ]);
    const p = new PoolsSitio({
      ...(crear() as unknown as { d: ConstructorParameters<typeof PoolsSitio>[0] }).d,
      leerIniRama: async () => bytes,
    });
    await p.sincronizar();
    const ini = readFileSync(p.rutaIni('tienda'));
    expect(ini.subarray(0, bytes.length).equals(bytes)).toBe(true);
  });
});

describe('AjustesPhpSitio (guardar con prueba, salud y vuelta atrás)', () => {
  let guardado: Map<
    string,
    { phpIni: Record<string, string>; xdebug: Sitio['xdebug']; capturaDumps: boolean }
  >;
  let pruebas: string[];
  let sincronizaciones: number;
  let sano: boolean[];
  let aplicados: number;
  let aplicarOk: boolean;
  let instalados: string[];
  let hayDll: boolean;
  let probarFalla: boolean;

  const base = sitio({ id: 'tienda', phpIni: { memory_limit: '256M' } });

  const crear = (extra: Partial<DepsAjustesPhpSitio> = {}) =>
    new AjustesPhpSitio({
      leerSitio: async (id) => {
        const g = guardado.get(id);
        return id === 'tienda' ? { ...base, ...g } : undefined;
      },
      guardar: async (id, campos) => {
        guardado.set(id, campos);
      },
      iniPrueba: async (s) => Buffer.from(iniSitio(s, 'memory_limit = 128M\n', 'C:/x.dll')),
      probarIni: async (_rama, texto) => {
        pruebas.push(texto.toString('utf8'));
        if (probarFalla) {
          throw Object.assign(new Error('mal'), { codigo: 'php.ini_invalido' });
        }
      },
      dllXdebug: () => hayDll,
      instalarXdebug: async (r) => {
        instalados.push(r);
        hayDll = true;
      },
      sincronizar: async () => {
        sincronizaciones++;
        return erroresSync.shift() ?? new Map();
      },
      puertosOcupados: async () => [9840, 3306],
      sanoSitio: async () => sano.shift() ?? true,
      aplicar: async () => {
        aplicados++;
        return {
          nginx: { ok: aplicarOk, salida: aplicarOk ? 'ok' : 'nginx: emerg' },
          hosts: { ok: true },
          httpsPendiente: [],
        };
      },
      ...extra,
    });

  let erroresSync: Map<string, unknown>[];

  beforeEach(() => {
    erroresSync = [];
    guardado = new Map();
    pruebas = [];
    sincronizaciones = 0;
    sano = [];
    aplicados = 0;
    aplicarOk = true;
    instalados = [];
    hayDll = true;
    probarFalla = false;
  });

  it('guarda los ajustes probados, sincroniza el pool, comprueba y aplica nginx', async () => {
    const r = await crear().guardarPhpIni('tienda', { memory_limit: '1G' });
    expect(guardado.get('tienda')?.phpIni).toEqual({ memory_limit: '1G' });
    expect(pruebas[0]).toContain('memory_limit = 1G');
    expect(sincronizaciones).toBe(1);
    expect(aplicados).toBe(1);
    expect(r.aplicar.nginx.ok).toBe(true);
  });

  it('captura de dumps: guarda, conserva ajustes y Xdebug y prueba el ini con el prepend', async () => {
    const a = crear({
      iniPrueba: async (s) =>
        Buffer.from(iniSitio(s, 'memory_limit = 128M\n', 'C:/x.dll', [], 'C:/d/prepend.php')),
    });
    await a.captura('tienda', true);
    expect(guardado.get('tienda')).toEqual({
      phpIni: { memory_limit: '256M' },
      xdebug: null,
      capturaDumps: true,
    });
    expect(pruebas[0]).toContain('auto_prepend_file = "C:/d/prepend.php"');
    expect(aplicados).toBe(1);
    // Los ajustes y Xdebug guardados después conservan la captura.
    await a.guardarPhpIni('tienda', { memory_limit: '1G' });
    expect(guardado.get('tienda')?.capturaDumps).toBe(true);
    await a.captura('tienda', false);
    expect(guardado.get('tienda')?.capturaDumps).toBe(false);
  });

  it('captura con un pool que no responde → vuelve a sin captura', async () => {
    sano = [false];
    await expect(crear().captura('tienda', true)).rejects.toMatchObject({
      codigo: 'php.sitio_no_arranco',
    });
    expect(guardado.get('tienda')?.capturaDumps).toBe(false);
    expect(aplicados).toBe(0);
  });

  it('un ini que PHP rechaza no se guarda ni toca el pool', async () => {
    probarFalla = true;
    await expect(crear().guardarPhpIni('tienda', { memory_limit: '1G' })).rejects.toMatchObject({
      codigo: 'php.ini_invalido',
    });
    expect(guardado.size).toBe(0);
    expect(sincronizaciones).toBe(0);
    expect(aplicados).toBe(0);
  });

  it('pool que no responde → vuelve lo anterior, resincroniza y php.sitio_no_arranco', async () => {
    sano = [false];
    await expect(crear().xdebug('tienda', X)).rejects.toMatchObject({
      codigo: 'php.sitio_no_arranco',
      datos: { sitio: 'tienda.test' },
    });
    expect(guardado.get('tienda')).toEqual({
      phpIni: { memory_limit: '256M' },
      xdebug: null,
      capturaDumps: false,
    });
    expect(sincronizaciones).toBe(2);
    // Nginx todavía no había cambiado: no hay nada que volver a aplicar.
    expect(aplicados).toBe(0);
  });

  it('nginx que no acepta el cambio → vuelve lo anterior y lo informa', async () => {
    aplicarOk = false;
    const r = await crear().xdebug('tienda', X);
    expect(r.aplicar.nginx.ok).toBe(false);
    expect(guardado.get('tienda')).toEqual({
      phpIni: { memory_limit: '256M' },
      xdebug: null,
      capturaDumps: false,
    });
    expect(aplicados).toBe(2);
  });

  it('Xdebug sin la DLL: la instala del catálogo (sin activarla en la rama) antes de probar', async () => {
    hayDll = false;
    await crear().xdebug('tienda', X);
    expect(instalados).toEqual(['8.4']);
    expect(pruebas[0]).toContain('xdebug.mode=debug');
    // Apagar Xdebug no instala nada.
    instalados = [];
    hayDll = false;
    await crear().xdebug('tienda', { ...X, activo: false });
    expect(instalados).toEqual([]);
  });

  it('solo cuenta el error del propio sitio: el de otro no frena; el suyo vuelve atrás', async () => {
    erroresSync = [new Map([['otro', new Error('ajeno')]])];
    await crear().guardarPhpIni('tienda', { memory_limit: '1G' });
    expect(guardado.get('tienda')?.phpIni).toEqual({ memory_limit: '1G' });
    const propio = Object.assign(new Error('puerto'), { codigo: 'servicios.puerto_ocupado' });
    erroresSync = [new Map([['tienda', propio]])];
    await expect(crear().guardarPhpIni('tienda', { memory_limit: '2G' })).rejects.toBe(propio);
    expect(guardado.get('tienda')?.phpIni).toEqual({ memory_limit: '1G' });
  });

  it('avisa si el puerto de Xdebug choca con un PHP u otro servicio', async () => {
    const r = await crear().xdebug('tienda', { ...X, puerto: 9840 });
    expect(r.avisoPuerto).toBe(9840);
    expect((await crear().xdebug('tienda', X)).avisoPuerto).toBeNull();
  });

  it('sitio sin PHP o inexistente → error claro, nada guardado', async () => {
    await expect(crear().guardarPhpIni('nada', {})).rejects.toMatchObject({
      codigo: 'php.sitio_sin_php',
    });
    const sinPhp = crear({
      leerSitio: async () => sitio({ id: 'e', tipo: 'estatico', php: null }),
    });
    await expect(sinPhp.xdebug('e', X)).rejects.toMatchObject({ codigo: 'php.sitio_sin_php' });
    expect(guardado.size).toBe(0);
  });

  it('quitar todos los ajustes vuelve al pool compartido sin probar nada', async () => {
    await crear().guardarPhpIni('tienda', {});
    expect(pruebas).toEqual([]);
    expect(guardado.get('tienda')?.phpIni).toEqual({});
    expect(sincronizaciones).toBe(1);
    expect(aplicados).toBe(1);
  });
});
