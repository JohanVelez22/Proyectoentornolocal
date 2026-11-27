import { linkSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  Busquedas,
  buscar,
  type FinBusqueda,
  type OpcionesBusqueda,
  type ResultadoBusqueda,
} from '../src/herramientas/buscar';
import { carpetaTemporal } from './temporales';

/** D44, segunda ronda: veto por realpath, archivos sensibles y regex sin pila. */
const CLAVE_FALSA =
  '-----BEGIN RSA PRIVATE KEY-----\nFALSA-SOLO-PARA-PRUEBAS\n-----END RSA PRIVATE KEY-----\n';
type Sitios = NonNullable<OpcionesBusqueda['sitios']>;

async function escenario() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-buscar2-'));
  const poner = (rel: string, contenido: string | Buffer): string => {
    const d = path.join(raiz, ...rel.split('/'));
    mkdirSync(path.dirname(d), { recursive: true });
    writeFileSync(d, contenido);
    return d;
  };
  const buscarEn = async (o: Partial<OpcionesBusqueda>) => {
    const res: ResultadoBusqueda[] = [];
    const resumen = await buscar(
      {
        raiz,
        consulta: 'aguja',
        modo: 'contenido',
        regex: false,
        mayusculas: false,
        incluir: [],
        excluir: [],
        ...o,
      },
      (r) => res.push(r),
      new AbortController().signal,
    );
    return { res, resumen };
  };
  const rel = (r: ResultadoBusqueda): string => path.relative(raiz, r.archivo).replace(/\\/g, '/');
  return { raiz, poner, buscarEn, rel };
}

describe('I-2: el veto compara la ruta real, no solo el texto de la raíz', () => {
  it('una unión en un componente intermedio de la raíz no mete la búsqueda en la carpeta de datos', async () => {
    const e = await escenario();
    e.poner('exterior/interior/datos/respaldos/dump.sql', 'INSERT aguja');
    e.poner('exterior/interior/proyecto/a.txt', 'aguja');
    const enlace = path.join(e.raiz, 'atajo');
    try {
      symlinkSync(path.join(e.raiz, 'exterior'), enlace, 'junction');
    } catch {
      return; // sin permiso para crear enlaces
    }
    const datosReal = path.join(e.raiz, 'exterior', 'interior', 'datos');
    // La raíz pasa por la unión y la carpeta de datos se declara con su ruta real.
    const { res } = await e.buscarEn({
      raiz: path.join(enlace, 'interior'),
      vetadas: [datosReal],
    });
    expect(res.map((r) => path.basename(r.archivo))).toEqual(['a.txt']);
    expect(JSON.stringify(res)).not.toContain('dump.sql');
    // Y por nombre tampoco aparece la carpeta vetada ni lo que hay dentro.
    const n = await e.buscarEn({
      raiz: path.join(enlace, 'interior'),
      vetadas: [datosReal],
      consulta: 'dump',
      modo: 'nombre',
    });
    expect(n.res).toHaveLength(0);
  });

  it('una vetada declarada por la unión también vale si la raíz contiene la carpeta real', async () => {
    const e = await escenario();
    e.poner('base/datos/data/sitios.json', 'aguja');
    e.poner('base/proyecto/a.txt', 'aguja');
    const enlace = path.join(e.raiz, 'enlace-datos');
    try {
      symlinkSync(path.join(e.raiz, 'base', 'datos'), enlace, 'junction');
    } catch {
      return;
    }
    const { res } = await e.buscarEn({
      raiz: path.join(e.raiz, 'base'),
      vetadas: [enlace],
    });
    expect(res.map((r) => path.basename(r.archivo))).toEqual(['a.txt']);
  });
});

describe('I-4: archivos sensibles en Buscar', () => {
  const sitiosCon =
    (carpeta: string, datosReales: boolean): Sitios =>
    async () => [{ carpeta, datosReales }];

  it('un .env sale como «coincidencia en la línea N», sin extracto ni contexto', async () => {
    const e = await escenario();
    e.poner('.env', 'APP=uno\nDB_PASSWORD=contrasena-falsa-123\nOTRA=2\n');
    e.poner('prod.env', 'DB_PASSWORD=otra-falsa\n');
    const { res } = await e.buscarEn({ consulta: 'DB_PASSWORD', contexto: 2 });
    expect(res).toHaveLength(2);
    for (const r of res) {
      expect(r).toMatchObject({ sensible: true, extracto: '', antes: [], despues: [] });
      expect(r.linea).toBeGreaterThan(0);
    }
    expect(res.find((r) => rel(r) === '.env')?.linea).toBe(2);
    expect(JSON.stringify(res)).not.toMatch(/contrasena-falsa|otra-falsa|APP=uno/);
    function rel(r: ResultadoBusqueda): string {
      return path.basename(r.archivo);
    }
  });

  it('id_rsa y un archivo con clave privada en su contenido (incluso tardía) no muestran nada', async () => {
    const e = await escenario();
    e.poner('id_rsa', 'cualquier cosa con aguja dentro\n');
    // La clave aparece DESPUÉS de más de un trozo de lectura: los resultados anteriores se ocultan igual.
    const relleno = Array.from({ length: 8000 }, (_, i) => `linea ${i} aguja`).join('\n');
    e.poner('notas.txt', `${relleno}\n${CLAVE_FALSA}`);
    e.poner('normal.txt', 'una aguja común');
    const { res } = await e.buscarEn({ contexto: 1 });
    const porArchivo = (n: string) => res.filter((r) => path.basename(r.archivo) === n);
    expect(porArchivo('id_rsa')[0]).toMatchObject({ sensible: true, extracto: '' });
    const notas = porArchivo('notas.txt');
    expect(notas.length).toBeGreaterThan(1000);
    expect(notas.every((r) => r.sensible && r.extracto === '' && r.antes.length === 0)).toBe(true);
    expect(JSON.stringify(notas)).not.toContain('FALSA');
    // Un archivo común sigue mostrando todo.
    expect(porArchivo('normal.txt')[0]).toMatchObject({
      sensible: false,
      extracto: 'una aguja común',
    });
  });

  it('un archivo común dentro de un sitio con datosReales es sensible; sin datosReales no', async () => {
    const e = await escenario();
    e.poner('sitio/app.php', 'return "aguja";');
    const con = await e.buscarEn({ sitios: sitiosCon(path.join(e.raiz, 'sitio'), true) });
    expect(con.res[0]).toMatchObject({ sensible: true, extracto: '' });
    const sin = await e.buscarEn({ sitios: sitiosCon(path.join(e.raiz, 'sitio'), false) });
    expect(sin.res[0]).toMatchObject({ sensible: false, extracto: 'return "aguja";' });
  });

  it('un enlace duro vuelve sensible el archivo', async () => {
    const e = await escenario();
    const original = e.poner('dato.txt', 'una aguja');
    try {
      linkSync(original, path.join(e.raiz, 'dato-otro-nombre.txt'));
    } catch {
      return; // el sistema no admite enlaces duros
    }
    const { res } = await e.buscarEn({});
    expect(res).toHaveLength(2);
    expect(res.every((r) => r.sensible && r.extracto === '')).toBe(true);
  });

  it('buscar.iniciar con la raíz de un sitio (sin diálogo) ya no puede volcar los .env', async () => {
    const e = await escenario();
    e.poner('sitio/.env', 'APP_KEY=base64:CLAVE-FALSA-0000\nDB_PASSWORD=falsa\n');
    e.poner('sitio/config/secrets.json', '{"token":"ghp_FALSO000000000000000000000000000000"}');
    e.poner('sitio/index.php', '<?php // DB_PASSWORD en el código');
    const lotes: ResultadoBusqueda[] = [];
    const fines: FinBusqueda[] = [];
    const b = new Busquedas({
      resultado: (l) => lotes.push(...l.resultados),
      fin: (f) => fines.push(f),
    });
    b.iniciar({
      raiz: path.join(e.raiz, 'sitio'),
      consulta: '(KEY|PASSWORD|token)',
      modo: 'ambos',
      regex: true,
      mayusculas: false,
      incluir: [],
      excluir: [],
      contexto: 3,
      sitios: sitiosCon(path.join(e.raiz, 'sitio'), true),
    });
    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        if (fines.length) {
          clearInterval(t);
          resolve();
        }
      }, 5);
    });
    expect(fines[0]!.error).toBeNull();
    const texto = JSON.stringify(lotes);
    expect(texto).not.toMatch(/CLAVE-FALSA|ghp_FALSO|falsa|base64/);
    expect(lotes.filter((r) => r.tipo === 'contenido').every((r) => r.sensible)).toBe(true);
  });

  it('si no se puede saber qué sitios hay, la búsqueda falla en vez de arriesgarse', async () => {
    const e = await escenario();
    e.poner('a.txt', 'aguja');
    await expect(
      e.buscarEn({
        sitios: async () => {
          throw new Error('sin sitios');
        },
      }),
    ).rejects.toThrow();
  });
});

describe('M-1: un RangeError del motor de regex se informa como regex_lenta', () => {
  it('una expresión que agota la pila sobre una línea enorme', async () => {
    const e = await escenario();
    e.poner('enorme.txt', 'ab'.repeat(2_400_000));
    await expect(e.buscarEn({ consulta: '^(a|b)*c', regex: true })).rejects.toMatchObject({
      codigo: 'buscar.regex_lenta',
    });
  }, 30_000);
});
