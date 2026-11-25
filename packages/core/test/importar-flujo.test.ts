import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ErrorTrasReemplazo,
  type OpcionesImportarAjeno,
  type OrigenImportar,
} from '../src/bd/respaldos';
import { ErrorWolf } from '../src/errores';
import { Importador, type DepsImportar } from '../src/importar/importar';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { SitioSchema, type Sitio } from '../src/tipos';
import { copiarFixture, hashArbol } from './importar-ayuda';

const CLAVE_ORIGEN = 'centinela-origen-d15';

let sitios: Sitio[];
let guardados: Omit<Sitio, 'id'>[];
let aplicaciones: number;
let phpInstaladas: string[];
let existentes: string[];
let llamadasBase: {
  objetivo: string;
  origen: OrigenImportar;
  destino: string;
  opciones: OpcionesImportarAjeno;
}[];
let respuestaBase: (
  destino: string,
) => Promise<{ advertencias: string[]; respaldoPrevio?: string }>;
let datosDatos: string;
let registro: string[];

const sitio = (o: Partial<Sitio>): Sitio =>
  SitioSchema.parse({
    id: 'x',
    nombre: 'x',
    dominio: 'x.test',
    carpeta: '/x',
    tipo: 'estatico',
    ...o,
  });

async function armar(
  raices: { programa: 'laragon' | 'xampp' | 'herd'; raiz: string }[],
  extra: Partial<DepsImportar> = {},
): Promise<Importador> {
  const plataforma = new PlataformaFalsa();
  plataforma.instalaciones = raices;
  return new Importador({
    instalaciones: () => plataforma.instalacionesAjenas(),
    prohibidas: [datosDatos],
    sitios: async () => sitios,
    guardarSitio: async (datos) => {
      guardados.push(datos);
      const s = sitio({ ...datos, id: `s${guardados.length}` });
      sitios = [...sitios, s];
      return { sitio: s };
    },
    aplicar: async () => {
      aplicaciones++;
      return true;
    },
    phpInstaladas: async () => phpInstaladas,
    basesDe: async () => existentes,
    importarBase: async (objetivo, origen, destino, opciones) => {
      llamadasBase.push({ objetivo, origen, destino, opciones });
      registro.push(`base:${destino}`);
      return respuestaBase(destino);
    },
    ...extra,
  });
}

const origen = { host: '127.0.0.1' as const, puerto: 3399, usuario: 'root', clave: CLAVE_ORIGEN };

beforeEach(() => {
  sitios = [];
  guardados = [];
  aplicaciones = 0;
  phpInstaladas = ['8.2', '8.3'];
  existentes = [];
  llamadasBase = [];
  registro = [];
  datosDatos = path.join(path.sep, 'datos-de-wolfcore-que-no-existen');
  respuestaBase = async () => ({ advertencias: [] });
});

describe('Importador', () => {
  it('la vista previa muestra sitio, carpeta, dominio, PHP y base, y si la base ya existe', async () => {
    const raiz = await copiarFixture('laragon');
    existentes = ['Tienda_DB'];
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp.vistaPrevia('mysql');
    expect(v.programas).toEqual(['laragon']);
    const t = v.filas.find((f) => f.nombre === 'tienda')!;
    expect(t).toMatchObject({
      dominioFinal: 'tienda.test',
      dominioEnUso: false,
      yaVinculado: false,
      phpFinal: '8.2',
      // La comparación no distingue mayúsculas (MySQL y MariaDB).
      baseExiste: true,
    });
    expect(v.filas.find((f) => f.nombre === 'blog')!.baseExiste).toBe(false);
    // Sin dominio de origen: se propone uno.
    expect(v.filas.find((f) => f.nombre === 'solo')).toMatchObject({
      dominio: null,
      dominioFinal: 'solo.test',
      baseExiste: null,
    });
    // La vista previa no escribe nada.
    expect(guardados).toEqual([]);
    expect(llamadasBase).toEqual([]);
  });

  it('importar vincula sin mover: la carpeta de origen y su contenido quedan iguales', async () => {
    const raiz = await copiarFixture('laragon');
    const antes = await hashArbol(raiz);
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp.vistaPrevia();
    const ids = v.filas.map((f) => f.id);
    const r = await imp.importar(ids);
    expect(r.sitios.every((s) => s.ok)).toBe(true);
    expect(guardados).toHaveLength(3);
    expect(aplicaciones).toBe(1);
    expect(r.aplicado).toBe(true);
    expect(await hashArbol(raiz)).toBe(antes);
    // Cada sitio apunta a su carpeta, sin confianza en recetas y con su dominio.
    const t = guardados.find((g) => g.nombre === 'tienda')!;
    expect(t).toMatchObject({
      dominio: 'tienda.test',
      tipo: 'laravel',
      php: '8.2',
      confiado: false,
      https: false,
    });
    expect(path.basename(t.carpeta)).toBe('tienda');
    expect(t.nota).toMatch(/Laragon/);
    expect(guardados.find((g) => g.nombre === 'solo')!.dominio).toBe('solo.test');
  });

  it('usa otra versión de PHP instalada si la del origen no está, y lo dice', async () => {
    const raiz = await copiarFixture('laragon');
    phpInstaladas = ['8.4'];
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp.vistaPrevia();
    const r = await imp.importar([v.filas.find((f) => f.nombre === 'tienda')!.id]);
    expect(r.sitios[0]).toMatchObject({ ok: true, php: '8.4', phpDistinto: true });
  });

  it('un sitio PHP sin ningún PHP instalado falla con su código; los demás siguen', async () => {
    const raiz = await copiarFixture('laragon');
    phpInstaladas = [];
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp.vistaPrevia();
    const r = await imp.importar(v.filas.map((f) => f.id));
    expect(r.sitios.find((s) => s.codigo === 'importar.sin_php')).toBeDefined();
    // El sitio estático (solo/index.html) no necesita PHP.
    expect(guardados.map((g) => g.nombre)).toEqual(['solo']);
  });

  it('una carpeta ya vinculada y un dominio en uso no se importan', async () => {
    const raiz = await copiarFixture('laragon');
    const imp0 = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp0.vistaPrevia();
    const tienda = v.filas.find((f) => f.nombre === 'tienda')!;
    const blog = v.filas.find((f) => f.nombre === 'blog')!;
    sitios = [
      sitio({ id: 'a', carpeta: tienda.carpeta, dominio: 'otro.test' }),
      sitio({ id: 'b', carpeta: '/otra', dominio: 'blog.test' }),
    ];
    const r = await (await armar([{ programa: 'laragon', raiz }])).importar([tienda.id, blog.id]);
    expect(r.sitios.map((s) => s.codigo)).toEqual([
      'importar.ya_vinculado',
      'importar.dominio_existe',
    ]);
    expect(guardados).toEqual([]);
    expect(r.aplicado).toBeNull();
  });

  it('un id que ya no existe en el programa de origen se informa sin tocar nada', async () => {
    const raiz = await copiarFixture('laragon');
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const r = await imp.importar(['laragon-000000000000']);
    expect(r.sitios).toEqual([
      { id: 'laragon-000000000000', ok: false, codigo: 'importar.candidato_desconocido' },
    ]);
  });

  it('nunca vincula la carpeta de datos de WolfCore Dev ni una instalación que la contiene', async () => {
    const raiz = await copiarFixture('laragon');
    datosDatos = path.join(raiz, 'www', 'tienda');
    const imp = await armar([{ programa: 'laragon', raiz }]);
    const v = await imp.vistaPrevia();
    expect(v.filas.map((f) => f.nombre)).not.toContain('tienda');
    datosDatos = raiz;
    expect((await (await armar([{ programa: 'laragon', raiz }])).vistaPrevia()).filas).toEqual([]);
  });

  describe('bases', () => {
    it('importa la base con la instancia elegida, sin repetir una compartida y sin guardar la clave', async () => {
      const raiz = await copiarFixture('laragon');
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia('mysql@8.0');
      const r = await imp.importar(
        v.filas.map((f) => f.id),
        { origenBd: origen, instancia: 'mysql@8.0' },
      );
      expect(r.bases.map((b) => [b.nombre, b.ok]).sort()).toEqual([
        ['blog_wp', true],
        ['tienda_db', true],
      ]);
      for (const l of llamadasBase) {
        expect(l.objetivo).toBe('mysql@8.0');
        expect(l.origen).toMatchObject({ host: '127.0.0.1', puerto: 3399, clave: CLAVE_ORIGEN });
        expect(l.opciones).toEqual({ confirmarSobrescribir: false, baseNueva: true });
      }
      // La clave de origen no está en ningún resultado ni en lo que se guarda de los sitios.
      expect(JSON.stringify(r)).not.toContain(CLAVE_ORIGEN);
      expect(JSON.stringify(guardados)).not.toContain(CLAVE_ORIGEN);
    });

    it('una base que ya existe no se toca sin confirmación (sin mayúsculas) y con ella se pide el reemplazo', async () => {
      const raiz = await copiarFixture('laragon');
      existentes = ['TIENDA_db'];
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia('mysql');
      const ids = v.filas.map((f) => f.id);
      const r = await imp.importar(ids, { origenBd: origen, instancia: 'mysql' });
      expect(r.bases.find((b) => b.nombre === 'tienda_db')).toEqual({
        nombre: 'tienda_db',
        ok: false,
        codigo: 'importar.base_existe',
        respaldoPrevio: null,
      });
      expect(llamadasBase.map((l) => l.destino)).toEqual(['blog_wp']);
      // Con la confirmación: reemplazo y respaldo previo.
      llamadasBase = [];
      sitios = [];
      respuestaBase = async () => ({ advertencias: [], respaldoPrevio: 'C:/Respaldos/previo.sql' });
      const r2 = await (
        await armar([{ programa: 'laragon', raiz }])
      ).importar(ids, {
        origenBd: origen,
        instancia: 'mysql',
        reemplazar: ['Tienda_DB'],
      });
      const t = r2.bases.find((b) => b.nombre === 'tienda_db')!;
      expect(t).toMatchObject({ ok: true, respaldoPrevio: 'C:/Respaldos/previo.sql' });
      expect(llamadasBase.find((l) => l.destino === 'tienda_db')!.opciones).toEqual({
        confirmarSobrescribir: true,
        baseNueva: false,
      });
    });

    it('servidor de origen apagado: error con código en cada base y los sitios igual se importan', async () => {
      const raiz = await copiarFixture('laragon');
      respuestaBase = async () => {
        throw new ErrorWolf('importar.origen_apagado', 'apagado');
      };
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia();
      const r = await imp.importar(
        v.filas.map((f) => f.id),
        { origenBd: origen, instancia: 'mysql' },
      );
      expect(r.sitios.every((s) => s.ok)).toBe(true);
      expect(guardados).toHaveLength(3);
      expect(r.bases.map((b) => b.codigo)).toEqual([
        'importar.origen_apagado',
        'importar.origen_apagado',
      ]);
      // No insiste base por base contra un servidor que no responde.
      expect(llamadasBase).toHaveLength(1);
      expect(JSON.stringify(r)).not.toContain(CLAVE_ORIGEN);
    });

    it('un fallo tras reemplazar informa el respaldo previo', async () => {
      const raiz = await copiarFixture('laragon');
      existentes = ['tienda_db'];
      respuestaBase = async () => {
        throw new ErrorTrasReemplazo('tienda_db', 'C:/Respaldos/previo.sql', new Error('x'));
      };
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia();
      const r = await imp.importar([v.filas.find((f) => f.nombre === 'tienda')!.id], {
        origenBd: origen,
        instancia: 'mysql',
        reemplazar: ['tienda_db'],
      });
      expect(r.bases[0]).toEqual({
        nombre: 'tienda_db',
        ok: false,
        codigo: 'importar.base_fallo',
        respaldoPrevio: 'C:/Respaldos/previo.sql',
      });
    });

    it('un sitio que no se importó no importa su base', async () => {
      const raiz = await copiarFixture('laragon');
      phpInstaladas = [];
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia();
      await imp.importar(
        v.filas.filter((f) => f.nombre !== 'solo').map((f) => f.id),
        { origenBd: origen, instancia: 'mysql' },
      );
      expect(llamadasBase).toEqual([]);
    });

    it('datos de origen mal formados se rechazan antes de tocar nada', async () => {
      const raiz = await copiarFixture('laragon');
      const imp = await armar([{ programa: 'laragon', raiz }]);
      const v = await imp.vistaPrevia();
      const ids = v.filas.map((f) => f.id);
      for (const malo of [
        { ...origen, host: '10.0.0.5' as never },
        { ...origen, puerto: 0 },
        { ...origen, usuario: '' },
        { ...origen, clave: 'a\nb' },
      ]) {
        await expect(
          imp.importar(ids, { origenBd: malo, instancia: 'mysql' }),
        ).rejects.toMatchObject({
          codigo: 'importar.origen_invalido',
        });
      }
      await expect(imp.importar([])).rejects.toMatchObject({ codigo: 'importar.sin_seleccion' });
      expect(guardados).toEqual([]);
    });

    it('dos importaciones a la vez: la segunda se rechaza', async () => {
      const raiz = await copiarFixture('laragon');
      let soltar: () => void = () => undefined;
      let entro: () => void = () => undefined;
      const dentro = new Promise<void>((r) => (entro = r));
      const imp = await armar([{ programa: 'laragon', raiz }], {
        guardarSitio: async (d) => {
          entro();
          await new Promise<void>((r) => (soltar = r));
          return { sitio: sitio({ ...d }) };
        },
      });
      const v = await imp.vistaPrevia();
      const primera = imp.importar([v.filas[0]!.id]);
      await dentro;
      await expect(imp.importar([v.filas[0]!.id])).rejects.toMatchObject({
        codigo: 'importar.en_curso',
      });
      soltar();
      await primera;
    });
  });

  it('XAMPP: una base de XAMPP se declara MariaDB y un proyecto con un .env enorme no cuelga la detección', async () => {
    const raiz = await copiarFixture('xampp');
    await writeFile(path.join(raiz, 'htdocs', 'otro', '.env'), 'x'.repeat(3 * 1024 * 1024));
    const imp = await armar([{ programa: 'xampp', raiz }]);
    const v = await imp.vistaPrevia();
    expect(v.filas.find((f) => f.nombre === 'miapp')!.base).toEqual({
      motor: 'mariadb',
      nombre: 'miapp_ci',
    });
    expect(v.problemas.map((p) => p.codigo)).toContain('importar.archivo_grande');
  });

  it('Herd: la carpeta de configuración y la de sitios no duplican candidatos', async () => {
    const raiz = await copiarFixture('herd');
    const imp = await armar([
      { programa: 'herd', raiz },
      { programa: 'herd', raiz: path.join(raiz, 'sitios') },
    ]);
    const v = await imp.vistaPrevia();
    expect(v.filas.map((f) => f.nombre).sort()).toEqual(['Mi Sitio Raro', 'api', 'web']);
  });
});
