import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  EditorCodigo,
  MAX_ARCHIVOS_CON_COPIAS,
  MAX_BYTES_EDITOR,
  MAX_COPIAS_POR_ARCHIVO,
  type DepsEditorCodigo,
  type OpcionesGuardarArchivo,
} from '../src/herramientas/editorCodigo';
import { carpetaTemporal } from './temporales';

/** Clave privada de prueba: solo la cabecera, obviamente falsa. */
const CLAVE_FALSA =
  '-----BEGIN RSA PRIVATE KEY-----\nFALSA-SOLO-PARA-PRUEBAS\n-----END RSA PRIVATE KEY-----\n';

type Sitios = (proyecto: string) => { carpeta: string; datosReales: boolean }[];

/**
 * Todo vive en una carpeta temporal: `datos` hace de carpeta de datos de WolfCore y `proyecto` de
 * carpeta del usuario. Nada toca la carpeta real de WolfCore Dev.
 */
async function escenario(extra: Partial<DepsEditorCodigo> = {}, sitios: Sitios = () => []) {
  const raiz = realpathSync(await carpetaTemporal('pel-editor-'));
  const datos = path.join(raiz, 'WolfCoreDatos');
  const proyecto = path.join(raiz, 'proyecto');
  mkdirSync(path.join(datos, 'data', 'mysql'), { recursive: true });
  mkdirSync(proyecto, { recursive: true });
  let reloj = Date.UTC(2026, 10, 26, 12, 0, 0);
  const deps: DepsEditorCodigo = {
    carpetaCopias: () => path.join(datos, 'editor-copias'),
    carpetasPropias: () => [datos],
    sitios: async () => sitios(proyecto),
    ahora: () => (reloj += 1000),
    ...extra,
  };
  const editor = new EditorCodigo(deps);
  const archivo = (nombre: string, contenido: string | Buffer): string => {
    const r = path.join(proyecto, nombre);
    writeFileSync(r, contenido);
    return r;
  };
  const codigo = async (p: Promise<unknown>): Promise<string> => {
    try {
      await p;
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorWolf);
      return (e as ErrorWolf).codigo;
    }
    return 'sin-error';
  };
  const abrirOk = async (r: string, riesgo = false) => {
    const a = await editor.abrir(r, riesgo ? { confirmadoRiesgo: true } : {});
    if (a.estado !== 'abierto') throw new Error('no se abrió');
    return a.archivo;
  };
  const guardarCon = (
    a: Awaited<ReturnType<typeof abrirOk>>,
    contenido: string,
    otras: Partial<OpcionesGuardarArchivo> = {},
  ): OpcionesGuardarArchivo => ({
    contenido,
    huella: a.huella,
    eol: a.eol,
    bom: a.bom,
    confirmado: true,
    ...otras,
  });
  const copias = (): string[] => {
    const raizCopias = path.join(datos, 'editor-copias');
    if (!existsSync(raizCopias)) return [];
    return readdirSync(raizCopias).flatMap((d) =>
      readdirSync(path.join(raizCopias, d)).map((f) => path.join(raizCopias, d, f)),
    );
  };
  return { raiz, datos, proyecto, editor, archivo, codigo, abrirOk, guardarCon, copias };
}

const HUELLA_CUALQUIERA = { tamano: 4, mtimeMs: 1, hash: 'a'.repeat(64) };

describe('EditorCodigo: abrir', () => {
  it('abre un archivo normal con su huella, saltos y BOM', async () => {
    const e = await escenario();
    const r = e.archivo('a.php', '﻿<?php\r\necho 1;\r\n');
    const a = await e.abrirOk(r);
    expect(a.contenido).toBe('<?php\necho 1;\n');
    expect(a.eol).toBe('crlf');
    expect(a.bom).toBe(true);
    expect(a.nombre).toBe('a.php');
    expect(a.ruta).toBe(r);
    expect(a.huella.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.huella.tamano).toBe(readFileSync(r).length);
    expect(a.riesgos).toEqual([]);
  });

  it('rechaza rutas no válidas, inexistentes y que no son archivos', async () => {
    const e = await escenario();
    expect(await e.codigo(e.editor.abrir('relativa.txt'))).toBe('editor.ruta_invalida');
    expect(await e.codigo(e.editor.abrir(`${e.proyecto}\\a.txt:flujo`))).toBe(
      'editor.ruta_invalida',
    );
    expect(await e.codigo(e.editor.abrir(path.join(e.proyecto, 'no.txt')))).toBe(
      'editor.no_existe',
    );
    expect(await e.codigo(e.editor.abrir(e.proyecto))).toBe('editor.no_regular');
  });

  it('rechaza los .env de cualquier forma, al abrir y al guardar', async () => {
    const e = await escenario();
    for (const n of ['.env', '.env.local', '.env.example', '.ENV', 'prod.env']) {
      const r = e.archivo(n, 'A=1\n');
      expect(await e.codigo(e.editor.abrir(r)), n).toBe('editor.archivo_env');
      const o = {
        contenido: 'A=2\n',
        huella: HUELLA_CUALQUIERA,
        eol: 'lf',
        bom: false,
        confirmado: true,
      } as const;
      expect(await e.codigo(e.editor.guardar(r, o)), n).toBe('editor.archivo_env');
      expect(readFileSync(r, 'utf8')).toBe('A=1\n');
    }
  });

  it('el `env` de CodeIgniter 4 en la raíz de un sitio cuenta como .env', async () => {
    const e = await escenario({}, (p) => [{ carpeta: p, datosReales: false }]);
    const r = e.archivo('env', 'CI_ENVIRONMENT = development\n');
    expect(await e.codigo(e.editor.abrir(r))).toBe('editor.archivo_env');
    // Fuera de la raíz de un sitio, un archivo llamado `env` es un archivo cualquiera.
    const sin = await escenario();
    expect(await sin.codigo(sin.editor.abrir(sin.archivo('env', 'x\n')))).toBe('sin-error');
  });

  it('rechaza binarios (bytes NUL o UTF-8 inválido)', async () => {
    const e = await escenario();
    const nul = e.archivo('a.bin', Buffer.from([0x50, 0x4b, 0, 3]));
    expect(await e.codigo(e.editor.abrir(nul))).toBe('editor.binario');
    const malo = e.archivo('b.txt', Buffer.from([0x61, 0xff, 0xfe, 0x62]));
    expect(await e.codigo(e.editor.abrir(malo))).toBe('editor.binario');
  });

  it('aplica el tope de tamaño', async () => {
    const e = await escenario();
    const justo = e.archivo('justo.txt', Buffer.alloc(MAX_BYTES_EDITOR, 0x61));
    expect(await e.codigo(e.editor.abrir(justo))).toBe('sin-error');
    const grande = e.archivo('grande.txt', Buffer.alloc(MAX_BYTES_EDITOR + 1, 0x61));
    expect(await e.codigo(e.editor.abrir(grande))).toBe('editor.demasiado_grande');
  });

  it('un archivo dentro de la carpeta de datos de WolfCore no se abre', async () => {
    const e = await escenario();
    const r = path.join(e.datos, 'data', 'mysql', 'x.txt');
    writeFileSync(r, 'dato');
    expect(await e.codigo(e.editor.abrir(r))).toBe('editor.ruta_vetada');
  });

  it('una unión hacia una carpeta vetada se rechaza por su ruta real, al abrir y al guardar', async () => {
    const e = await escenario();
    const destino = path.join(e.datos, 'data', 'mysql');
    writeFileSync(path.join(destino, 'x.txt'), 'dato');
    const enlace = path.join(e.proyecto, 'enlace');
    try {
      symlinkSync(destino, enlace, 'junction');
    } catch {
      return; // sin permiso para crear enlaces en este equipo
    }
    const ruta = path.join(enlace, 'x.txt');
    expect(await e.codigo(e.editor.abrir(ruta))).toBe('editor.ruta_vetada');
    const o = {
      contenido: 'otro',
      huella: HUELLA_CUALQUIERA,
      eol: 'lf',
      bom: false,
      confirmado: true,
    } as const;
    expect(await e.codigo(e.editor.guardar(ruta, o))).toBe('editor.ruta_vetada');
    expect(readFileSync(path.join(destino, 'x.txt'), 'utf8')).toBe('dato');
  });

  it('un enlace a un archivo normal fuera de lo vetado se guarda sobre el destino real', async () => {
    const e = await escenario();
    const real = e.archivo('real.txt', 'uno\n');
    const enlace = path.join(e.proyecto, 'enlace.txt');
    try {
      symlinkSync(real, enlace, 'file');
    } catch {
      return;
    }
    const a = await e.abrirOk(enlace);
    expect(a.ruta).toBe(real);
    await e.editor.guardar(enlace, e.guardarCon(a, 'dos\n'));
    expect(readFileSync(real, 'utf8')).toBe('dos\n');
  });
});

describe('EditorCodigo: confirmación reforzada', () => {
  it('un archivo con clave privada no devuelve su contenido hasta confirmar con refuerzo', async () => {
    const e = await escenario();
    const r = e.archivo('config.txt', CLAVE_FALSA);
    const sin = await e.editor.abrir(r);
    expect(sin).toEqual({ estado: 'confirmar', nombre: 'config.txt', riesgos: ['secreto'] });
    expect(JSON.stringify(sin)).not.toContain('FALSA');
    const a = await e.abrirOk(r, true);
    expect(a.contenido).toContain('FALSA');
    expect(a.riesgos).toEqual(['secreto']);
  });

  it('los nombres típicos de secretos también piden refuerzo', async () => {
    const e = await escenario();
    for (const n of ['id_rsa', 'servidor.pem', 'clave.key', 'auth.json', '.npmrc']) {
      const r = e.archivo(n, 'contenido inocente\n');
      const x = await e.editor.abrir(r);
      expect(x.estado, n).toBe('confirmar');
    }
  });

  it('un sitio con datosReales pide refuerzo aunque el archivo sea común, al abrir y al guardar', async () => {
    const e = await escenario({}, (p) => [{ carpeta: p, datosReales: true }]);
    const r = e.archivo('index.php', '<?php echo 1;\n');
    expect(await e.editor.abrir(r)).toMatchObject({
      estado: 'confirmar',
      riesgos: ['datos-reales'],
    });
    const a = await e.abrirOk(r, true);
    expect(a.riesgos).toEqual(['datos-reales']);
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, '<?php echo 2;\n')))).toBe(
      'editor.confirmacion_reforzada',
    );
    expect(readFileSync(r, 'utf8')).toBe('<?php echo 1;\n');
    await e.editor.guardar(r, e.guardarCon(a, '<?php echo 2;\n', { confirmadoRiesgo: true }));
    expect(readFileSync(r, 'utf8')).toBe('<?php echo 2;\n');
  });

  it('guardar un secreto pide refuerzo, también si el texto nuevo lo trae', async () => {
    const e = await escenario();
    const r = e.archivo('notas.txt', 'nada\n');
    const a = await e.abrirOk(r);
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, CLAVE_FALSA)))).toBe(
      'editor.confirmacion_reforzada',
    );
    expect(readFileSync(r, 'utf8')).toBe('nada\n');
    await e.editor.guardar(r, e.guardarCon(a, CLAVE_FALSA, { confirmadoRiesgo: true }));
    expect(readFileSync(r, 'utf8')).toBe(CLAVE_FALSA);
  });
});

describe('EditorCodigo: guardar', () => {
  it('guarda con confirmación: copia previa en la carpeta de datos y sin temporales', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\r\ndos\r\n');
    const a = await e.abrirOk(r);
    const res = await e.editor.guardar(r, e.guardarCon(a, 'uno\ntres\n'));
    expect(readFileSync(r, 'utf8')).toBe('uno\r\ntres\r\n');
    expect(res.copia.startsWith(path.join(e.datos, 'editor-copias'))).toBe(true);
    expect(readFileSync(res.copia, 'utf8')).toBe('uno\r\ndos\r\n');
    expect(e.copias()).toEqual([res.copia]);
    expect(readdirSync(e.proyecto)).toEqual(['a.txt']);
    // La huella devuelta vale para el siguiente guardado.
    const otra = await e.editor.guardar(r, { ...e.guardarCon(a, 'cuatro\n'), huella: res.huella });
    expect(readFileSync(r, 'utf8')).toBe('cuatro\r\n');
    expect(otra.huella.hash).not.toBe(res.huella.hash);
  });

  it('conserva el BOM', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', '﻿hola\n');
    const a = await e.abrirOk(r);
    await e.editor.guardar(r, e.guardarCon(a, 'adiós\n'));
    expect(readFileSync(r)[0]).toBe(0xef);
    expect(readFileSync(r, 'utf8')).toBe('﻿adiós\n');
  });

  it('sin `confirmado === true` se rechaza y no se toca nada', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    for (const c of [undefined, false, 'true', 1]) {
      const o = { ...e.guardarCon(a, 'dos\n'), confirmado: c } as unknown as OpcionesGuardarArchivo;
      expect(await e.codigo(e.editor.guardar(r, o))).toBe('editor.sin_confirmar');
    }
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
    expect(e.copias()).toEqual([]);
  });

  it('rechaza si el archivo cambió fuera del editor; sobrescribir es otra confirmación', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    writeFileSync(r, 'otro programa\n');
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'dos\n')))).toBe(
      'editor.archivo_cambiado',
    );
    expect(readFileSync(r, 'utf8')).toBe('otro programa\n');
    expect(e.copias()).toEqual([]);
    const res = await e.editor.guardar(r, e.guardarCon(a, 'dos\n', { sobrescribir: true }));
    expect(readFileSync(r, 'utf8')).toBe('dos\n');
    // La copia previa guarda lo que había en disco, no lo que se abrió.
    expect(readFileSync(res.copia, 'utf8')).toBe('otro programa\n');
  });

  it('un cambio solo de fecha también cuenta como cambio por fuera', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const t = new Date(Date.now() + 60_000);
    utimesSync(r, t, t);
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'dos\n')))).toBe(
      'editor.archivo_cambiado',
    );
  });

  it('exige una huella válida', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const o = {
      ...e.guardarCon(a, 'dos\n'),
      huella: { tamano: 1 },
    } as unknown as OpcionesGuardarArchivo;
    expect(await e.codigo(e.editor.guardar(r, o))).toBe('editor.huella_invalida');
  });

  it('aplica el tope y rechaza texto con NUL o inválido', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const grande = e.guardarCon(a, 'a'.repeat(MAX_BYTES_EDITOR + 1));
    expect(await e.codigo(e.editor.guardar(r, grande))).toBe('editor.demasiado_grande');
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'a\0b')))).toBe('editor.binario');
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'a\ud800b')))).toBe(
      'editor.contenido_invalido',
    );
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
  });

  it('si la copia previa falla, no se escribe nada', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    // La "carpeta de copias" es un archivo: no se puede crear nada dentro.
    const bloqueo = e.archivo('bloqueo', 'x');
    const editor = new EditorCodigo({
      carpetaCopias: () => bloqueo,
      carpetasPropias: () => [e.datos],
      sitios: async () => [],
    });
    const a = await e.abrirOk(r);
    expect(await e.codigo(editor.guardar(r, e.guardarCon(a, 'dos\n')))).toBe('editor.copia_fallo');
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
  });

  it('si el rename falla, el original queda intacto y no sobra el temporal', async () => {
    const e = await escenario({
      renombrar: async () => {
        throw Object.assign(new Error('x'), { code: 'EXDEV' });
      },
    });
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'dos\n')))).toBe(
      'editor.escritura_fallo',
    );
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
    expect(readdirSync(e.proyecto)).toEqual(['a.txt']);
  });

  it('rota las copias: solo quedan las últimas por archivo', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'v0\n');
    let huella = (await e.abrirOk(r)).huella;
    const total = MAX_COPIAS_POR_ARCHIVO + 3;
    for (let i = 1; i <= total; i++) {
      const res = await e.editor.guardar(r, {
        contenido: `v${i}\n`,
        huella,
        eol: 'lf',
        bom: false,
        confirmado: true,
      });
      huella = res.huella;
    }
    const contenidos = e
      .copias()
      .map((c) => readFileSync(c, 'utf8'))
      .sort();
    // La última escritura respaldó v(total-1); quedan esa y las 4 anteriores.
    const esperadas = Array.from(
      { length: MAX_COPIAS_POR_ARCHIVO },
      (_, i) => `v${total - MAX_COPIAS_POR_ARCHIVO + i}\n`,
    );
    expect(contenidos).toEqual(esperadas);
  });

  it('el tope de archivos con copias borra los más antiguos', async () => {
    const e = await escenario();
    const raizCopias = path.join(e.datos, 'editor-copias');
    mkdirSync(raizCopias, { recursive: true });
    for (let i = 0; i < MAX_ARCHIVOS_CON_COPIAS + 5; i++) {
      const d = path.join(raizCopias, `viejo${String(i).padStart(3, '0')}`);
      mkdirSync(d);
      writeFileSync(path.join(d, 'x'), 'x');
      const t = new Date(Date.now() - 10_000_000 + i * 1000);
      utimesSync(d, t, t);
    }
    const r = e.archivo('a.txt', 'v0\n');
    const a = await e.abrirOk(r);
    await e.editor.guardar(r, e.guardarCon(a, 'v1\n'));
    const quedan = readdirSync(raizCopias);
    expect(quedan.length).toBeLessThanOrEqual(MAX_ARCHIVOS_CON_COPIAS);
    expect(quedan).not.toContain('viejo000');
  });
});
