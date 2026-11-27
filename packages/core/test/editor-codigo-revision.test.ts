import {
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import {
  EditorCodigo,
  saltosDe,
  type DepsEditorCodigo,
  type OpcionesGuardarArchivo,
} from '../src/herramientas/editorCodigo';
import { carpetaTemporal } from './temporales';

/** Revisión opus de D43: UNC, saltos mezclados, falla cerrado, enlaces duros y atado a `abrir`. */
async function escenario(extra: Partial<DepsEditorCodigo> = {}) {
  const raiz = realpathSync.native(await carpetaTemporal('pel-editor-rev-'));
  const datos = path.join(raiz, 'WolfCoreDatos');
  const proyecto = path.join(raiz, 'proyecto');
  mkdirSync(path.join(datos, 'data'), { recursive: true });
  mkdirSync(proyecto, { recursive: true });
  const reloj = Date.UTC(2026, 10, 26, 12, 0, 0);
  const deps: DepsEditorCodigo = {
    carpetaCopias: () => path.join(datos, 'editor-copias'),
    carpetasPropias: () => [datos],
    sitios: async () => [],
    ahora: () => reloj,
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
  return { raiz, datos, proyecto, editor, archivo, codigo, abrirOk, guardarCon };
}

const HUELLA = { tamano: 4, mtimeMs: 1, hash: 'a'.repeat(64) };

describe('I1: rutas UNC', () => {
  it('se rechazan las rutas UNC y de dispositivo, con barras de cualquier tipo', async () => {
    const e = await escenario();
    for (const r of [
      '\\\\localhost\\C$\\Windows\\win.ini',
      '//localhost/c$/Windows/win.ini',
      '\\\\servidor\\recurso\\a.txt',
      '\\\\?\\C:\\a.txt',
      '\\\\.\\C:\\a.txt',
    ]) {
      expect(await e.codigo(e.editor.abrir(r)), r).toBe('editor.ruta_invalida');
      const o = {
        contenido: 'x',
        huella: HUELLA,
        eol: 'lf',
        bom: false,
        confirmado: true,
      } as const;
      expect(await e.codigo(e.editor.guardar(r, o)), r).toBe('editor.ruta_invalida');
    }
  });

  it.skipIf(process.platform !== 'win32')(
    'la carpeta de datos vista por el recurso administrativo (\\\\localhost\\C$) no se salta el veto',
    async () => {
      const e = await escenario();
      const dentro = path.join(e.datos, 'data', 'sitios.json');
      writeFileSync(dentro, '[]');
      const unidad = /^([A-Za-z]):/.exec(dentro)![1]!;
      const unc = `\\\\localhost\\${unidad}$\\${dentro.slice(3)}`;
      expect(await e.codigo(e.editor.abrir(unc))).toBe('editor.ruta_invalida');
      expect(readFileSync(dentro, 'utf8')).toBe('[]');
    },
  );
});

describe('I2: saltos de línea mezclados', () => {
  it('saltosDe distingue lf, crlf y mixto (incluye \\r sueltos)', () => {
    expect(saltosDe('a\nb\n')).toBe('lf');
    expect(saltosDe('a\r\nb\r\n')).toBe('crlf');
    expect(saltosDe('a\r\nb\nc\n')).toBe('mixto');
    expect(saltosDe('a\rb\r')).toBe('mixto');
    expect(saltosDe('sin saltos')).toBe('lf');
  });

  it('abrir devuelve eol mixto y guardar exige aceptarNormalizar', async () => {
    const e = await escenario();
    const r = e.archivo('m.txt', 'uno\r\ndos\ntres\r');
    const a = await e.abrirOk(r);
    expect(a.eol).toBe('mixto');
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'uno\ndos\ntres\n')))).toBe(
      'editor.eol_mixto',
    );
    expect(readFileSync(r, 'utf8')).toBe('uno\r\ndos\ntres\r');
    expect(readdirSync(path.join(e.datos)).includes('editor-copias')).toBe(false);
    await e.editor.guardar(r, e.guardarCon(a, 'uno\ndos\ntres\n', { aceptarNormalizar: true }));
    expect(readFileSync(r, 'utf8')).toBe('uno\ndos\ntres\n');
  });

  it('M-B: si los saltos en disco ya no son los de la ventana, sobrescribir pide aceptarNormalizar', async () => {
    const e = await escenario();
    const r = e.archivo('c.txt', 'uno\r\ndos\r\n');
    const a = await e.abrirOk(r);
    expect(a.eol).toBe('crlf');
    // Alguien lo reescribe por fuera con LF (no mixto) mientras la ventana sigue creyendo CRLF.
    writeFileSync(r, 'uno\ndos\ntres\n');
    expect(
      await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'uno\ndos\n', { sobrescribir: true }))),
    ).toBe('editor.archivo_cambiado');
    expect(readFileSync(r, 'utf8')).toBe('uno\ndos\ntres\n');
    // Con la confirmación aparte de normalizar, sí se guarda.
    await e.editor.guardar(
      r,
      e.guardarCon(a, 'uno\ndos\n', { sobrescribir: true, aceptarNormalizar: true }),
    );
    expect(readFileSync(r, 'utf8')).toBe('uno\r\ndos\r\n');
  });

  it('un renderer que diga lf sobre un archivo mixto no esquiva la confirmación', async () => {
    const e = await escenario();
    const r = e.archivo('m.txt', 'a\r\nb\nc\n');
    const a = await e.abrirOk(r);
    expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, 'x\n', { eol: 'lf' })))).toBe(
      'editor.eol_mixto',
    );
  });

  it('un archivo con saltos uniformes sigue guardándose sin confirmación extra', async () => {
    const e = await escenario();
    const r = e.archivo('u.txt', 'a\r\nb\r\n');
    const a = await e.abrirOk(r);
    expect(a.eol).toBe('crlf');
    await e.editor.guardar(r, e.guardarCon(a, 'a\nc\n'));
    expect(readFileSync(r, 'utf8')).toBe('a\r\nc\r\n');
  });
});

describe('I3: la lista de sitios falla cerrado', () => {
  it('si la lista de sitios rechaza, ni se abre ni se guarda', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const roto = new EditorCodigo({
      carpetaCopias: () => path.join(e.datos, 'editor-copias'),
      carpetasPropias: () => [e.datos],
      sitios: async () => {
        throw new Error('sitios.json ilegible');
      },
    });
    expect(await e.codigo(roto.abrir(r))).toBe('editor.lectura_fallo');
    expect(await e.codigo(roto.guardar(r, e.guardarCon(a, 'dos\n')))).toBe('editor.lectura_fallo');
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
  });
});

describe('M1: enlaces duros', () => {
  it('un archivo con más de un nombre pide refuerzo al abrir y al guardar', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    try {
      linkSync(r, path.join(e.proyecto, 'otro-nombre.txt'));
    } catch {
      return; // el sistema de archivos no admite enlaces duros
    }
    expect(await e.editor.abrir(r)).toMatchObject({
      estado: 'confirmar',
      riesgos: ['enlace-duro'],
    });
    const a = await e.abrirOk(r, true);
    expect(a.riesgos).toEqual(['enlace-duro']);
    await expect(e.editor.guardar(r, e.guardarCon(a, 'dos\n'))).rejects.toMatchObject({
      codigo: 'editor.confirmacion_reforzada',
      datos: { riesgos: 'enlace-duro' },
    });
    await e.editor.guardar(r, e.guardarCon(a, 'dos\n', { confirmadoRiesgo: true }));
    expect(readFileSync(r, 'utf8')).toBe('dos\n');
  });

  it('un enlace duro a algo de la carpeta de datos no se puede ocultar con otro nombre', async () => {
    const e = await escenario();
    const dentro = path.join(e.datos, 'data', 'sitios.json');
    writeFileSync(dentro, '[]');
    const fuera = path.join(e.proyecto, 'inocente.txt');
    try {
      linkSync(dentro, fuera);
    } catch {
      return;
    }
    // Por nombre no se detecta, pero se trata como sensible: nunca se abre sin refuerzo.
    expect(await e.editor.abrir(fuera)).toMatchObject({ estado: 'confirmar' });
  });
});

describe('M3 y M4: guardar solo sobre lo que abrir entregó', () => {
  it('sin abrir antes, ni guardar ni sobrescribir valen', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const o = {
      contenido: 'dos\n',
      huella: HUELLA,
      eol: 'lf',
      bom: false,
      confirmado: true,
    } as const;
    expect(await e.codigo(e.editor.guardar(r, o))).toBe('editor.no_abierto');
    expect(await e.codigo(e.editor.guardar(r, { ...o, sobrescribir: true }))).toBe(
      'editor.no_abierto',
    );
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
  });

  it('una huella que abrir no entregó no vale ni con sobrescribir', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const ajena = { ...a.huella, hash: 'b'.repeat(64) };
    expect(
      await e.codigo(
        e.editor.guardar(r, e.guardarCon(a, 'dos\n', { huella: ajena, sobrescribir: true })),
      ),
    ).toBe('editor.no_abierto');
  });

  it('abrir un archivo no autoriza guardar otro', async () => {
    const e = await escenario();
    const a1 = e.archivo('a.txt', 'uno\n');
    const b1 = e.archivo('b.txt', 'uno\n');
    const a = await e.abrirOk(a1);
    expect(await e.codigo(e.editor.guardar(b1, e.guardarCon(a, 'dos\n')))).toBe(
      'editor.no_abierto',
    );
  });

  it('abrir que pide confirmación no entrega nada', async () => {
    const e = await escenario();
    const r = e.archivo('id_rsa', 'x\n');
    const x = await e.editor.abrir(r);
    expect(x.estado).toBe('confirmar');
    const o = {
      contenido: 'y\n',
      huella: HUELLA,
      eol: 'lf',
      bom: false,
      confirmado: true,
    } as const;
    expect(await e.codigo(e.editor.guardar(r, o))).toBe('editor.no_abierto');
  });
});

describe('M6: reforzar lleva los riesgos reales', () => {
  it('el error de refuerzo trae los riesgos que faltan por confirmar', async () => {
    const e = await escenario();
    const r = e.archivo('notas.txt', 'nada\n');
    const a = await e.abrirOk(r);
    const clave = '-----BEGIN RSA PRIVATE KEY-----\nFALSA\n-----END RSA PRIVATE KEY-----\n';
    await expect(e.editor.guardar(r, e.guardarCon(a, clave))).rejects.toMatchObject({
      codigo: 'editor.confirmacion_reforzada',
      datos: { riesgos: 'secreto' },
    });
  });
});

describe('M8: copias sin choques y rotación al abortar', () => {
  it('dos guardados en el mismo milisegundo dejan dos copias distintas', async () => {
    const e = await escenario(); // el reloj no avanza
    const r = e.archivo('a.txt', 'v0\n');
    const a = await e.abrirOk(r);
    const g1 = await e.editor.guardar(r, e.guardarCon(a, 'v1\n'));
    const g2 = await e.editor.guardar(r, e.guardarCon(a, 'v2\n', { huella: g1.huella! }));
    expect(g1.copia).not.toBe(g2.copia);
    expect(readFileSync(g1.copia, 'utf8')).toBe('v0\n');
    expect(readFileSync(g2.copia, 'utf8')).toBe('v1\n');
  });

  it('un guardado abortado también rota las copias', async () => {
    let fallar = false;
    const e = await escenario({
      renombrar: async () => {
        if (fallar) throw Object.assign(new Error('x'), { code: 'EPERM' });
      },
    });
    const carpetaCopias = path.join(e.datos, 'editor-copias');
    const r = e.archivo('a.txt', 'v0\n');
    const a = await e.abrirOk(r);
    // Siembra 5 copias viejas en la carpeta de este archivo con un guardado fallido tras otro.
    fallar = true;
    for (let i = 0; i < 8; i++) {
      expect(await e.codigo(e.editor.guardar(r, e.guardarCon(a, `x${i}\n`)))).toBe(
        'editor.escritura_fallo',
      );
    }
    const total = readdirSync(carpetaCopias).flatMap((d) =>
      readdirSync(path.join(carpetaCopias, d)),
    );
    expect(total.length).toBe(5);
  });
});

describe('M11: huella tras escribir', () => {
  it('devuelve la huella real del archivo escrito', async () => {
    const e = await escenario();
    const r = e.archivo('a.txt', 'uno\n');
    const a = await e.abrirOk(r);
    const t = new Date(Date.now() - 100_000);
    utimesSync(r, t, t);
    const g = await e.editor.guardar(r, e.guardarCon(a, 'dos\n', { sobrescribir: true }));
    expect(g.huella).not.toBeNull();
    expect(g.huella!.mtimeMs).toBeGreaterThan(t.getTime());
    expect(g.huella!.mtimeMs).not.toBe(0);
  });
});

describe('M12: UTF-8 inválido que no es binario', () => {
  it('da editor.codificacion (y NUL sigue siendo binario)', async () => {
    const e = await escenario();
    const latin1 = e.archivo('l.txt', Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a]));
    expect(await e.codigo(e.editor.abrir(latin1))).toBe('editor.codificacion');
    const nul = e.archivo('n.bin', Buffer.from([0x61, 0, 0x62]));
    expect(await e.codigo(e.editor.abrir(nul))).toBe('editor.binario');
  });
});

describe('M16: el .env rechazado dice a qué sitio pertenece', () => {
  it('el error lleva el id del sitio cuando el archivo está en su carpeta', async () => {
    const e = await escenario({});
    const dir = e.proyecto;
    const con = new EditorCodigo({
      carpetaCopias: () => path.join(e.datos, 'editor-copias'),
      carpetasPropias: () => [e.datos],
      sitios: async () => [{ carpeta: dir, datosReales: false, id: 'sitio-1' }],
    });
    const env = e.archivo('.env', 'A=1\n');
    await expect(con.abrir(env)).rejects.toMatchObject({
      codigo: 'editor.archivo_env',
      datos: { sitio: 'sitio-1' },
    });
    await expect(e.editor.abrir(env)).rejects.toMatchObject({ datos: { sitio: '' } });
  });
});
