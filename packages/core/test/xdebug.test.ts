import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { parse } from 'jsonc-parser';
import { describe, expect, it } from 'vitest';
import { SitioSchema, type Sitio } from '../src/tipos';
import {
  configPhpStorm,
  escribirLaunchJson,
  launchJson,
  NOMBRE_LAUNCH,
  validarXdebug,
  vistaLaunchJson,
  xdebugIni,
  type XdebugSitio,
} from '../src/php/xdebug';
import { carpetaTemporal } from './temporales';

const X: XdebugSitio = {
  activo: true,
  modo: ['debug', 'develop'],
  puerto: 9003,
  inicio: 'trigger',
};

const sitio = (o: Partial<Sitio> = {}): Sitio =>
  SitioSchema.parse({
    id: 'tienda',
    nombre: 'Tienda',
    dominio: 'tienda.test',
    carpeta: 'C:/Proyectos/Tienda',
    tipo: 'laravel',
    php: '8.4',
    xdebug: X,
    ...o,
  });

describe('xdebugIni', () => {
  it('carga la DLL por ruta y fija modo, cliente local, puerto e inicio', () => {
    expect(xdebugIni(X, 'C:\\WolfCore\\bin\\php\\8.4\\ext\\php_xdebug.dll')).toBe(
      [
        'zend_extension="C:/WolfCore/bin/php/8.4/ext/php_xdebug.dll"',
        'xdebug.mode=debug,develop',
        'xdebug.client_host=127.0.0.1',
        'xdebug.client_port=9003',
        'xdebug.start_with_request=trigger',
      ].join('\n'),
    );
    // Sin DLL (ya la carga el ini de la rama): solo los ajustes.
    expect(xdebugIni({ ...X, inicio: 'yes' }, null)).not.toContain('zend_extension');
    expect(xdebugIni({ ...X, inicio: 'yes' }, null)).toContain('xdebug.start_with_request=yes');
    expect(xdebugIni({ ...X, activo: false }, 'x')).toBe('');
  });

  it('validarXdebug acepta lo bueno y rechaza modos, puertos e inicios raros', () => {
    expect(validarXdebug(X)).toEqual(X);
    expect(validarXdebug(null)).toBeNull();
    // Modos repetidos se quitan.
    expect(validarXdebug({ ...X, modo: ['debug', 'debug'] })?.modo).toEqual(['debug']);
    for (const malo of [
      { ...X, modo: [] },
      { ...X, modo: ['debug', 'remote'] },
      { ...X, modo: 'debug' },
      { ...X, puerto: 80 },
      { ...X, puerto: 70000 },
      { ...X, puerto: 9003.5 },
      { ...X, inicio: 'siempre' },
      { ...X, activo: 'si' },
      { ...X, extra: 1 },
      'debug',
    ]) {
      expect(() => validarXdebug(malo), JSON.stringify(malo)).toThrow(
        expect.objectContaining({ codigo: 'php.argumento_invalido' }),
      );
    }
  });
});

describe('launchJson', () => {
  it('nuevo: versión 0.2.0 y una configuración PHP que escucha solo en 127.0.0.1', () => {
    const t = launchJson(sitio(), null);
    expect(JSON.parse(t)).toEqual({
      version: '0.2.0',
      configurations: [
        {
          name: NOMBRE_LAUNCH('tienda.test'),
          type: 'php',
          request: 'launch',
          port: 9003,
          hostname: '127.0.0.1',
        },
      ],
    });
  });

  it('fusiona por nombre: reemplaza solo la suya y conserva las demás y los comentarios', () => {
    const existente = [
      '{',
      '  // Mis configuraciones',
      '  "version": "0.2.0",',
      '  "configurations": [',
      '    { "name": "Node: servidor", "type": "node", "request": "launch" }, // la mía',
      `    { "name": "${NOMBRE_LAUNCH('tienda.test')}", "type": "php", "request": "launch", "port": 9000 },`,
      '  ],',
      '}',
    ].join('\n');
    const t = launchJson(sitio({ xdebug: { ...X, puerto: 9010 } }), existente);
    expect(t).toContain('// Mis configuraciones');
    expect(t).toContain('// la mía');
    const v = parse(t) as { configurations: { name: string; port?: number }[] };
    expect(v.configurations.map((c) => c.name)).toEqual([
      'Node: servidor',
      NOMBRE_LAUNCH('tienda.test'),
    ]);
    expect(v.configurations[1]!.port).toBe(9010);
    // Otra vez lo mismo: sin cambios.
    expect(launchJson(sitio({ xdebug: { ...X, puerto: 9010 } }), t)).toBe(t);
  });

  it('agrega la suya al final si no estaba, y crea configurations si falta', () => {
    const otra = '{ "version": "0.2.0", "configurations": [ { "name": "A", "type": "node" } ] }';
    const v = parse(launchJson(sitio(), otra)) as { configurations: { name: string }[] };
    expect(v.configurations.map((c) => c.name)).toEqual(['A', NOMBRE_LAUNCH('tienda.test')]);
    const sin = parse(launchJson(sitio(), '{ "version": "0.2.0" }')) as {
      configurations: unknown[];
    };
    expect(sin.configurations).toHaveLength(1);
  });

  it('un launch.json ilegible no se toca: xdebug.launch_invalido', () => {
    for (const malo of ['{ "configurations": [ ', '[]', '{ "configurations": {} }', 'null']) {
      expect(() => launchJson(sitio(), malo), malo).toThrow(
        expect.objectContaining({ codigo: 'xdebug.launch_invalido' }),
      );
    }
  });
});

describe('escribirLaunchJson', () => {
  async function montar() {
    const raiz = await carpetaTemporal('pel-launch-');
    const carpeta = path.join(raiz, 'Mi Tienda');
    mkdirSync(carpeta, { recursive: true });
    const respaldos = path.join(raiz, 'respaldos');
    return { carpeta, respaldos, s: sitio({ carpeta }) };
  }

  it('crea .vscode/launch.json si no existe (sin copia porque no había nada)', async () => {
    const { carpeta, respaldos, s } = await montar();
    const vista = await vistaLaunchJson(s);
    expect(vista.existe).toBe(false);
    const r = await escribirLaunchJson(s, respaldos);
    expect(r).toEqual({ creado: true, respaldo: null });
    const t = readFileSync(path.join(carpeta, '.vscode', 'launch.json'), 'utf8');
    expect(t).toBe(vista.contenido);
    expect(existsSync(respaldos)).toBe(false);
  });

  it('con uno existente: copia con fecha antes y fusiona sin perder lo ajeno', async () => {
    const { carpeta, respaldos, s } = await montar();
    mkdirSync(path.join(carpeta, '.vscode'));
    const previo =
      '{\n  // nota\n  "version": "0.2.0",\n  "configurations": [{ "name": "A" }]\n}\n';
    writeFileSync(path.join(carpeta, '.vscode', 'launch.json'), previo);
    const vista = await vistaLaunchJson(s);
    expect(vista.existe).toBe(true);
    expect(vista.diff).toContain(`+`);
    const r = await escribirLaunchJson(s, respaldos);
    expect(r.creado).toBe(false);
    expect(readdirSync(respaldos)).toEqual([r.respaldo]);
    expect(readFileSync(path.join(respaldos, r.respaldo!), 'utf8')).toBe(previo);
    const t = readFileSync(path.join(carpeta, '.vscode', 'launch.json'), 'utf8');
    expect(t).toContain('// nota');
    expect(t).toContain('"name": "A"');
    expect(t).toContain(NOMBRE_LAUNCH('tienda.test'));
  });

  it('un launch.json ilegible queda intacto y sin copia', async () => {
    const { carpeta, respaldos, s } = await montar();
    mkdirSync(path.join(carpeta, '.vscode'));
    writeFileSync(path.join(carpeta, '.vscode', 'launch.json'), '{ roto');
    await expect(escribirLaunchJson(s, respaldos)).rejects.toMatchObject({
      codigo: 'xdebug.launch_invalido',
    });
    expect(readFileSync(path.join(carpeta, '.vscode', 'launch.json'), 'utf8')).toBe('{ roto');
  });

  it('.vscode que apunta fuera del proyecto (enlace) no se sigue', async () => {
    const { carpeta, respaldos, s } = await montar();
    const fuera = path.join(path.dirname(carpeta), 'fuera');
    mkdirSync(fuera);
    // 'junction' no pide permisos de administrador en Windows; en los demás SO se ignora.
    symlinkSync(fuera, path.join(carpeta, '.vscode'), 'junction');
    await expect(escribirLaunchJson(s, respaldos)).rejects.toMatchObject({
      codigo: 'xdebug.launch_no_seguro',
    });
    expect(readdirSync(fuera)).toEqual([]);
  });

  it('sin Xdebug configurado no escribe nada', async () => {
    const { carpeta, respaldos } = await montar();
    await expect(
      escribirLaunchJson(sitio({ carpeta, xdebug: null }), respaldos),
    ).rejects.toMatchObject({ codigo: 'xdebug.sin_configurar' });
    expect(existsSync(path.join(carpeta, '.vscode'))).toBe(false);
  });
});

describe('configPhpStorm', () => {
  it('trae puerto, servidor (dominio) y que escucha conexiones de depuración', () => {
    const t = configPhpStorm(sitio({ xdebug: { ...X, puerto: 9010 }, https: true }));
    expect(t).toContain('9010');
    expect(t).toContain('tienda.test');
    expect(t).toContain('443');
    expect(t).toContain('Xdebug');
  });
});
