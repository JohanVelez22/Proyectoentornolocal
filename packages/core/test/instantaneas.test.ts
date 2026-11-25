import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CerrojoBases } from '../src/bd/cerrojoBases';
import {
  Instantaneas,
  MAX_AUTOMATICAS,
  type DepsInstantaneas,
  type RespaldosInstantaneas,
} from '../src/bd/instantaneas';
import { ErrorBaseTocada } from '../src/bd/respaldos';
import { ErrorWolf } from '../src/errores';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const CENTINELA = 'centinela-datos-d19';

let dir: string;
let rutas: Rutas;
let llamadas: string[];
let contenido: string;
let tablasDump: number;
let extensionesDump: string[];
let fallaRespaldar: boolean;
/** 'tocada' | 'sin-tocar' | null para cada camino de restauración. */
let fallaAcotada: 'tocada' | 'sin-tocar' | null;
let fallaEstricta: 'tocada' | 'sin-tocar' | null;
let fallasEstrictas: number;
let restringidos: string[];
let restringirOk: boolean;
let reloj: number;
let estado: { tablas: number; bytes: number };
let libre: number;
/** Lo que se leyó del archivo en cada restauración, y desde qué carpeta. */
let aplicado: { camino: string; contenido: string; ruta: string }[];
let opcionesRespaldar: ({ eventos?: boolean } | undefined)[];
/** El volcado falso espera a que lo corten (vigilancia) y escribe `tamanoLargo` bytes. */
let volcadoLargo: number | null;

function fallo(modo: 'tocada' | 'sin-tocar'): Error {
  return modo === 'tocada'
    ? new ErrorBaseTocada(new Error('ERROR 1227: sin permiso'))
    : new ErrorWolf('bd.extension_no_permitida', 'extensión no permitida', { nombre: 'file_fdw' });
}

const respaldos: RespaldosInstantaneas = {
  async respaldar(objetivo, base, carpeta, opciones) {
    llamadas.push(`respaldar:${base}`);
    opcionesRespaldar.push(opciones);
    if (fallaRespaldar) throw new Error('mysqldump falló');
    const archivo = path.join(
      carpeta!,
      `${base}-20261125-1030.${objetivo === 'postgresql' ? 'dump' : 'sql'}`,
    );
    if (volcadoLargo !== null) {
      writeFileSync(archivo, 'x'.repeat(volcadoLargo));
      await new Promise<void>((resolver, rechazar) => {
        const s = opciones?.senal;
        if (!s) return resolver();
        if (s.aborted) return rechazar(new Error('cortado'));
        s.addEventListener('abort', () => rechazar(new Error('cortado')));
      });
      return { archivo };
    }
    writeFileSync(archivo, contenido);
    return { archivo };
  },
  async restaurarEstricta(_o, archivo, base) {
    llamadas.push(`estricta:${base}`);
    aplicado.push({ camino: 'estricta', contenido: readFileSync(archivo, 'utf8'), ruta: archivo });
    if (fallaEstricta && fallasEstrictas-- > 0) throw fallo(fallaEstricta);
    return { advertencias: [] };
  },
  async restaurarAcotada(_o, archivo, base) {
    llamadas.push(`acotada:${base}`);
    aplicado.push({ camino: 'acotada', contenido: readFileSync(archivo, 'utf8'), ruta: archivo });
    if (fallaAcotada) throw fallo(fallaAcotada);
    return { advertencias: ['aviso'] };
  },
  async inspeccionar() {
    return { tablas: tablasDump, extensiones: extensionesDump };
  },
};

function armar(extra: Partial<DepsInstantaneas> = {}): Instantaneas {
  return new Instantaneas({
    rutas,
    respaldos,
    estadoBase: async () => ({ ...estado }),
    restringir: async (r) => {
      restringidos.push(r);
      return restringirOk;
    },
    espacioLibre: async () => libre,
    reloj: () => new Date(reloj),
    intervaloVigilanciaMs: 5,
    ...extra,
  });
}

const codigoDe = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    return e instanceof ErrorWolf ? e.codigo : `otro: ${String(e)}`;
  }
  return 'sin error';
};

const carpeta = (inst = 'mysql', base = 'tienda'): string => rutas.instantaneas(inst, base);
const huellas = (): Record<string, { sha256: string }> =>
  JSON.parse(readFileSync(rutas.huellasInstantaneas(), 'utf8'));
const sha = (t: string): string => createHash('sha256').update(t).digest('hex');

beforeEach(async () => {
  dir = await carpetaTemporal('pel-inst-');
  rutas = new Rutas(path.join(dir, 'base'));
  llamadas = [];
  aplicado = [];
  opcionesRespaldar = [];
  contenido = 'CREATE TABLE a (id int);\nINSERT INTO a VALUES (1);\n';
  tablasDump = 3;
  extensionesDump = [];
  fallaRespaldar = false;
  fallaAcotada = null;
  fallaEstricta = null;
  fallasEstrictas = 1;
  restringidos = [];
  restringirOk = true;
  reloj = Date.UTC(2026, 10, 25, 10, 30, 0);
  estado = { tablas: 3, bytes: 1000 };
  libre = 10 * 1024 * 1024 * 1024;
  volcadoLargo = null;
  // Datos reales del servicio: ninguna operación de las instantáneas los toca.
  const datos = path.join(rutas.base, 'data', 'mysql', '8.4');
  mkdirSync(datos, { recursive: true });
  writeFileSync(path.join(datos, 'centinela.txt'), CENTINELA);
});

const centinelaIntacta = (): void => {
  expect(readFileSync(path.join(rutas.base, 'data', 'mysql', '8.4', 'centinela.txt'), 'utf8')).toBe(
    CENTINELA,
  );
};

describe('Instantaneas.tomar y lista', () => {
  it('guarda el volcado, su registro y la huella (también fuera de la carpeta), con permisos restringidos', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', '  antes del   cambio ');
    expect(t).toMatchObject({
      instancia: 'mysql',
      base: 'tienda',
      nota: 'antes del   cambio',
      tablas: 3,
      automatica: false,
      origen: null,
      extensionesNoPermitidas: [],
      fecha: new Date(reloj).toISOString(),
    });
    expect(t.id).toMatch(/^20261125-103000-[0-9a-f]{6}$/);
    expect(readdirSync(carpeta()).sort()).toEqual([`${t.id}.json`, `${t.id}.sql`]);
    const reg = JSON.parse(readFileSync(path.join(carpeta(), `${t.id}.json`), 'utf8'));
    expect(reg.sha256).toBe(sha(contenido));
    // El registro de huellas vive fuera de la carpeta de las instantáneas.
    expect(rutas.huellasInstantaneas().startsWith(carpeta())).toBe(false);
    expect(huellas()[t.id]).toMatchObject({
      sha256: sha(contenido),
      motor: 'mysql',
      instancia: 'mysql',
      base: 'tienda',
    });
    expect(restringidos).toContain(carpeta());
    expect(restringidos).toContain(path.join(carpeta(), `${t.id}.sql`));
    expect(restringidos).toContain(rutas.huellasInstantaneas());
    expect(await i.lista('mysql', 'tienda')).toEqual([t]);
    expect(readdirSync(carpeta()).some((n) => n.startsWith('.tomando'))).toBe(false);
    centinelaIntacta();
  });

  it('el volcado incluye los eventos programados', async () => {
    await armar().tomar('mysql', 'tienda', '');
    expect(opcionesRespaldar[0]?.eventos).toBe(true);
  });

  it('avisa al tomarla si trae extensiones que el camino acotado no acepta', async () => {
    extensionesDump = ['pgcrypto', 'file_fdw'];
    const t = await armar().tomar('postgresql', 'tienda', '');
    expect(t.extensionesNoPermitidas).toEqual(['file_fdw']);
  });

  it('PostgreSQL guarda .dump y la lista va de la más reciente a la más antigua', async () => {
    const i = armar();
    const a = await i.tomar('postgresql', 'tienda', 'a');
    reloj += 60_000;
    await i.tomar('postgresql', 'tienda', 'b');
    expect(existsSync(path.join(carpeta('postgresql'), `${a.id}.dump`))).toBe(true);
    expect((await i.lista('postgresql', 'tienda')).map((x) => x.nota)).toEqual(['b', 'a']);
  });

  it('la nota se sanea (sin controles) y se acota', async () => {
    const t = await armar().tomar('mysql', 'tienda', `a\u0000b\n${'x'.repeat(500)}`);
    expect(t.nota).toMatch(/^a b x+$/);
    expect(t.nota.length).toBeLessThanOrEqual(200);
  });

  it('un registro dañado, ajeno o sin su volcado no aparece', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'buena');
    writeFileSync(path.join(carpeta(), '20261125-000000-aaaaaa.json'), '{ roto');
    writeFileSync(
      path.join(carpeta(), '20261125-000001-bbbbbb.json'),
      JSON.stringify({ version: 1, id: '20261125-000001-bbbbbb', archivo: '../../x.sql' }),
    );
    const sinVolcado = await i.tomar('mysql', 'tienda', 'sin volcado');
    rmSync(path.join(carpeta(), `${sinVolcado.id}.sql`));
    expect((await i.lista('mysql', 'tienda')).map((x) => x.id)).toEqual([t.id]);
  });

  it('MongoDB no tiene instantáneas y un nombre de base raro se rechaza', async () => {
    const i = armar();
    expect(await codigoDe(i.tomar('mongodb', 'tienda', ''))).toBe(
      'instantaneas.motor_no_soportado',
    );
    await expect(i.tomar('mysql', '../datos', '')).rejects.toThrow();
    await expect(i.tomar('mysql', 'a/b', '')).rejects.toThrow();
  });

  it('si el volcado falla o queda vacío no queda nada', async () => {
    const i = armar();
    fallaRespaldar = true;
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.tomar_fallo');
    fallaRespaldar = false;
    contenido = '';
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.tomar_fallo');
    expect(readdirSync(carpeta())).toEqual([]);
  });

  it('los nombres reservados de Windows y los que acaban en punto van a una carpeta codificada', async () => {
    expect(path.basename(rutas.instantaneas('mysql', 'con'))).toBe('%con');
    expect(path.basename(rutas.instantaneas('mysql', 'NUL.x'))).toBe('%NUL.x');
    expect(path.basename(rutas.instantaneas('mysql', 'com1'))).toBe('%com1');
    expect(path.basename(rutas.instantaneas('mysql', 'tienda.'))).toBe('%tienda.');
    expect(path.basename(rutas.instantaneas('mysql', 'tienda'))).toBe('tienda');
    const i = armar();
    const t = await i.tomar('mysql', 'con', 'x');
    expect(existsSync(path.join(rutas.instantaneas('mysql', 'con'), `${t.id}.sql`))).toBe(true);
    expect((await i.lista('mysql', 'con')).map((x) => x.id)).toEqual([t.id]);
  });

  it('la carpeta raíz solo se da por restringida si el sistema pudo', async () => {
    restringirOk = false;
    const i = armar();
    await i.tomar('mysql', 'tienda', '');
    reloj += 1000;
    await i.tomar('mysql', 'tienda', '');
    const raiz = path.join(rutas.base, 'instantaneas');
    expect(restringidos.filter((r) => r === raiz)).toHaveLength(2);
    restringirOk = true;
    reloj += 1000;
    await i.tomar('mysql', 'tienda', '');
    reloj += 1000;
    await i.tomar('mysql', 'tienda', '');
    expect(restringidos.filter((r) => r === raiz)).toHaveLength(3);
  });
});

describe('topes de tamaño, espacio y cantidad', () => {
  it('una base más grande que el tope no se vuelca (MySQL)', async () => {
    estado = { tablas: 1, bytes: 5000 };
    const i = armar({ maxBytes: 4096 });
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.demasiado_grande');
    expect(llamadas).toEqual([]);
  });

  it('en PostgreSQL el tamaño de la base no bloquea: cuenta el del volcado', async () => {
    estado = { tablas: 1, bytes: 50_000 };
    const i = armar({ maxBytes: 4096 });
    await expect(i.tomar('postgresql', 'tienda', '')).resolves.toBeDefined();
  });

  it('un volcado que pasa el tope se corta mientras se escribe y no deja nada', async () => {
    volcadoLargo = 5000;
    const i = armar({ maxBytes: 4096 });
    expect(await codigoDe(i.tomar('postgresql', 'tienda', ''))).toBe(
      'instantaneas.demasiado_grande',
    );
    expect(readdirSync(carpeta('postgresql'))).toEqual([]);
  });

  it('si se acaba el espacio libre durante el volcado, se corta', async () => {
    volcadoLargo = 100;
    libre = 10 * 1024 * 1024; // menos que el mínimo que debe quedar
    const i = armar();
    expect(await codigoDe(i.tomar('postgresql', 'tienda', ''))).toBe('instantaneas.sin_espacio');
    expect(readdirSync(carpeta('postgresql'))).toEqual([]);
  });

  it('sin espacio libre para el volcado de MySQL no se intenta', async () => {
    libre = 10 * 1024 * 1024;
    const i = armar();
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.sin_espacio');
    expect(llamadas).toEqual([]);
  });

  it('tope de instantáneas manuales por base', async () => {
    const i = armar({ maxPorBase: 2 });
    await i.tomar('mysql', 'tienda', '1');
    reloj += 1000;
    await i.tomar('mysql', 'tienda', '2');
    reloj += 1000;
    expect(await codigoDe(i.tomar('mysql', 'tienda', '3'))).toBe('instantaneas.limite');
    await expect(i.tomar('mysql', 'otra', '1')).resolves.toBeDefined();
  });
});

describe('Instantaneas.volver', () => {
  it('restaura una copia privada como administrador estricto cuando la huella coincide con el registro', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    reloj += 60_000;
    const r = await i.volver('mysql', 'tienda', viva.id, true);
    expect(llamadas).toEqual(['respaldar:tienda', 'estricta:tienda']);
    expect(r.respaldoPrevio).toMatchObject({ automatica: true, origen: viva.id, nota: '' });
    // Se restaura la copia (en tmp), no el archivo de la carpeta de instantáneas, y se limpia.
    const ruta = aplicado[0]!.ruta;
    expect(ruta.startsWith(rutas.tmp())).toBe(true);
    expect(ruta.startsWith(carpeta())).toBe(false);
    expect(existsSync(path.dirname(ruta))).toBe(false);
    expect(restringidos).toContain(path.dirname(ruta));
    expect(aplicado[0]!.contenido).toBe(contenido);
    expect((await i.lista('mysql', 'tienda')).map((x) => x.id)).toContain(r.respaldoPrevio!.id);
    centinelaIntacta();
  });

  it('con registro y archivo cambiados a la vez, la huella no coincide con el registro: camino acotado', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    const nuevo = 'DROP DATABASE otra;';
    writeFileSync(path.join(carpeta(), `${viva.id}.sql`), nuevo);
    const json = path.join(carpeta(), `${viva.id}.json`);
    const reg = JSON.parse(readFileSync(json, 'utf8'));
    writeFileSync(json, JSON.stringify({ ...reg, sha256: sha(nuevo), bytes: nuevo.length }));
    llamadas = [];
    await i.volver('mysql', 'tienda', viva.id, true);
    expect(llamadas).toEqual(['respaldar:tienda', 'acotada:tienda']);
    expect(aplicado[0]!.contenido).toBe(nuevo);
  });

  it('una instantánea que no está en el registro de huellas se restaura por el camino acotado', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    rmSync(rutas.huellasInstantaneas());
    llamadas = [];
    await i.volver('mysql', 'tienda', viva.id, true);
    expect(llamadas).toEqual(['respaldar:tienda', 'acotada:tienda']);
  });

  it('si el respaldo previo falla o no hay espacio, no restaura', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    fallaRespaldar = true;
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.respaldo_previo_fallo',
    );
    fallaRespaldar = false;
    libre = 1024;
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.sin_espacio',
    );
    expect(llamadas).toEqual(['respaldar:tienda']);
  });

  /** Provoca el fallo del respaldo previo y devuelve el vale que emite el núcleo. */
  async function valeDeFallo(i: Instantaneas, id: string): Promise<string> {
    fallaRespaldar = true;
    let error: unknown;
    try {
      await i.volver('mysql', 'tienda', id, true);
    } catch (e) {
      error = e;
    }
    fallaRespaldar = false;
    const e = error as ErrorWolf;
    expect(e.codigo).toBe('instantaneas.respaldo_previo_fallo');
    const vale = String(e.datos?.vale);
    expect(vale).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    return vale;
  }

  it('si no se puede guardar el estado actual, el núcleo da un vale y con él se vuelve sin guardarlo', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    const vale = await valeDeFallo(i, viva.id);
    llamadas = [];
    fallaRespaldar = true;
    const r = await i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale });
    expect(r.respaldoPrevio).toBeNull();
    expect(llamadas).toEqual(['estricta:tienda']);
    // Y si esa restauración toca la base y falla, el error dice que no hay copia a la que volver.
    const otro = await valeDeFallo(i, viva.id);
    fallaEstricta = 'tocada';
    fallasEstrictas = 5;
    expect(
      await codigoDe(
        i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale: otro }),
      ),
    ).toBe('instantaneas.restauracion_sin_copia');
  });

  it('sinGuardarEstado sin vale, con uno ajeno, gastado o vencido no se obedece: toma la automática o falla', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    const otra = await i.tomar('mysql', 'tienda', 'otra');
    // Sin vale: con el respaldo previo roto, falla y no restaura.
    llamadas = [];
    fallaRespaldar = true;
    expect(
      await codigoDe(i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true })),
    ).toBe('instantaneas.respaldo_previo_fallo');
    expect(
      await codigoDe(
        i.volver('mysql', 'tienda', viva.id, true, {
          sinGuardarEstado: true,
          vale: 'inventado-0123456789',
        }),
      ),
    ).toBe('instantaneas.respaldo_previo_fallo');
    expect(llamadas.some((l) => l.startsWith('estricta') || l.startsWith('acotada'))).toBe(false);
    // Sin vale y con el respaldo previo sano: toma la automática y restaura.
    fallaRespaldar = false;
    llamadas = [];
    const r = await i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true });
    expect(r.respaldoPrevio).not.toBeNull();
    expect(llamadas).toEqual(['respaldar:tienda', 'estricta:tienda']);
    // Un vale es de una instantánea concreta.
    const vale = await valeDeFallo(i, viva.id);
    fallaRespaldar = true;
    expect(
      await codigoDe(i.volver('mysql', 'tienda', otra.id, true, { sinGuardarEstado: true, vale })),
    ).toBe('instantaneas.respaldo_previo_fallo');
    // Se gastó al probarlo con otra instantánea: ya no sirve ni con la suya.
    expect(
      await codigoDe(i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale })),
    ).toBe('instantaneas.respaldo_previo_fallo');
    // De un solo uso, y vence a los 10 minutos.
    fallaRespaldar = false;
    const v2 = await valeDeFallo(i, viva.id);
    fallaRespaldar = true;
    reloj += 11 * 60 * 1000;
    expect(
      await codigoDe(
        i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale: v2 }),
      ),
    ).toBe('instantaneas.respaldo_previo_fallo');
    const v3 = await valeDeFallo(i, viva.id);
    fallaRespaldar = true;
    await i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale: v3 });
    expect(
      await codigoDe(
        i.volver('mysql', 'tienda', viva.id, true, { sinGuardarEstado: true, vale: v3 }),
      ),
    ).toBe('instantaneas.respaldo_previo_fallo');
  });

  it('sin espacio para la copia privada lo dice (no "no encontrada") y no toca la base', async () => {
    const i = armar({
      espacioLibre: async (r) => (r.startsWith(rutas.tmp()) ? 1024 : libre),
    });
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.sin_espacio',
    );
    expect(llamadas).toEqual([]);
  });

  it('un registro de huellas dañado no se pisa: se guarda aparte y esa instantánea va por el camino acotado', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    writeFileSync(rutas.huellasInstantaneas(), '{ dañado');
    llamadas = [];
    await i.volver('mysql', 'tienda', viva.id, true);
    expect(llamadas).toEqual(['respaldar:tienda', 'acotada:tienda']);
    // Al anotar la huella de la automática, el dañado se apartó (no se pisó) y se empezó otro.
    const aparte = readdirSync(path.dirname(rutas.huellasInstantaneas())).filter((n) =>
      n.includes('.danado-'),
    );
    expect(aparte).toHaveLength(1);
    expect(
      readFileSync(path.join(path.dirname(rutas.huellasInstantaneas()), aparte[0]!), 'utf8'),
    ).toBe('{ dañado');
    expect(Object.keys(huellas())).toHaveLength(1);
  });

  it('una base que no existe o está vacía se restaura sin instantánea automática', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    estado = { tablas: 0, bytes: 0 };
    const r = await i.volver('mysql', 'tienda', viva.id, true);
    expect(r.respaldoPrevio).toBeNull();
    expect(llamadas).toEqual(['estricta:tienda']);
  });

  it('sin confirmación no hace nada', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, undefined as never))).toBe(
      'instantaneas.sin_confirmar',
    );
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, false as never))).toBe(
      'instantaneas.sin_confirmar',
    );
    expect(llamadas).toEqual([]);
  });

  it('si falla sin tocar la base, no revierte y el error es el original', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    fallaEstricta = 'sin-tocar';
    llamadas = [];
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'bd.extension_no_permitida',
    );
    // Se guardó el estado actual, se intentó y no se hizo ninguna vuelta atrás.
    expect(llamadas).toEqual(['respaldar:tienda', 'estricta:tienda']);
  });

  it('si falla después de tocar la base, vuelve sola al estado de antes con el mismo camino estricto', async () => {
    const i = armar();
    contenido = 'ESTADO-VIEJO';
    const viva = await i.tomar('mysql', 'tienda', 'vieja');
    contenido = 'ESTADO-ACTUAL';
    llamadas = [];
    aplicado = [];
    fallaEstricta = 'tocada';
    let error: unknown;
    try {
      await i.volver('mysql', 'tienda', viva.id, true);
    } catch (e) {
      error = e;
    }
    const e = error as ErrorWolf;
    expect(e.codigo).toBe('instantaneas.restauracion_fallo');
    // Trae el detalle del error original.
    expect(String(e.datos?.detalle)).toContain('ERROR 1227');
    expect(llamadas).toEqual(['respaldar:tienda', 'estricta:tienda', 'estricta:tienda']);
    expect(aplicado.map((a) => a.contenido)).toEqual(['ESTADO-VIEJO', 'ESTADO-ACTUAL']);
    centinelaIntacta();
  });

  it('si ni siquiera se puede volver atrás, el error nombra la instantánea con el estado anterior', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    fallaEstricta = 'tocada';
    fallasEstrictas = 5;
    let error: unknown;
    try {
      await i.volver('mysql', 'tienda', viva.id, true);
    } catch (e) {
      error = e;
    }
    const e = error as ErrorWolf;
    expect(e.codigo).toBe('instantaneas.restauracion_sin_revertir');
    const id = String(e.datos?.respaldo);
    expect((await i.lista('mysql', 'tienda')).find((x) => x.id === id)?.automatica).toBe(true);
    expect(existsSync(path.join(carpeta(), `${id}.sql`))).toBe(true);
  });

  it('un archivo alterado (huella distinta) no se restaura ni se toca la base', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    const sql = path.join(carpeta(), `${viva.id}.sql`);
    writeFileSync(sql, contenido.replace('INSERT', 'insert'));
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.huella_no_coincide',
    );
    writeFileSync(sql, `${contenido}DROP DATABASE otra;`);
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.huella_no_coincide',
    );
    expect(llamadas).toEqual([]);
  });

  it('un id con .. o con forma rara se rechaza y uno que no existe no se encuentra', async () => {
    const i = armar();
    for (const malo of ['../x', '..', '20261125-103000-aaaaaa/../../x', 'x', '']) {
      expect(await codigoDe(i.volver('mysql', 'tienda', malo, true))).toBe(
        'instantaneas.id_invalido',
      );
      expect(await codigoDe(i.vistaPrevia('mysql', 'tienda', malo))).toBe(
        'instantaneas.id_invalido',
      );
      expect(await codigoDe(i.borrar('mysql', 'tienda', malo))).toBe('instantaneas.id_invalido');
      expect(await codigoDe(i.recuperar('mysql', 'tienda', malo))).toBe('instantaneas.id_invalido');
    }
    expect(await codigoDe(i.volver('mysql', 'tienda', '20261125-103000-aaaaaa', true))).toBe(
      'instantaneas.no_encontrada',
    );
    expect(llamadas).toEqual([]);
  });

  it('una instantánea de otra base, otra instancia u otro motor no se puede aplicar a esta', async () => {
    const i = armar();
    const deOtra = await i.tomar('mysql', 'otra', 'de otra');
    mkdirSync(carpeta(), { recursive: true });
    for (const ext of ['sql', 'json']) {
      writeFileSync(
        path.join(carpeta(), `${deOtra.id}.${ext}`),
        readFileSync(path.join(carpeta('mysql', 'otra'), `${deOtra.id}.${ext}`)),
      );
    }
    llamadas = [];
    expect(await codigoDe(i.volver('mysql', 'tienda', deOtra.id, true))).toBe(
      'instantaneas.otra_base',
    );
    expect(await codigoDe(i.vistaPrevia('mysql', 'tienda', deOtra.id))).toBe(
      'instantaneas.otra_base',
    );
    expect(await codigoDe(i.volver('mariadb', 'otra', deOtra.id, true))).toBe(
      'instantaneas.no_encontrada',
    );
    const json = path.join(carpeta(), `${deOtra.id}.json`);
    const reg = JSON.parse(readFileSync(json, 'utf8'));
    writeFileSync(json, JSON.stringify({ ...reg, base: 'tienda', motor: 'postgresql' }));
    expect(await codigoDe(i.volver('mysql', 'tienda', deOtra.id, true))).toBe(
      'instantaneas.otra_base',
    );
    expect(llamadas).toEqual([]);
  });

  it('la vista previa trae la instantánea y el estado actual, sin tocar nada', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    llamadas = [];
    estado = { tablas: 7, bytes: 4242 };
    expect(await i.vistaPrevia('mysql', 'tienda', t.id)).toEqual({
      instantanea: t,
      estadoActual: { tablas: 7, bytes: 4242 },
    });
    expect(llamadas).toEqual([]);
  });

  it('las operaciones de una misma base se hacen de una en una (y comparten el cerrojo del núcleo)', async () => {
    const cerrojo = new CerrojoBases();
    const i = armar({ cerrojo });
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    const a = i.volver('mysql', 'tienda', viva.id, true);
    const b = i.volver('mysql', 'tienda', viva.id, true);
    // Otra operación del núcleo sobre la misma base espera a que terminen.
    const c = cerrojo.con('mysql', 'tienda', async () => llamadas.push('ajena'));
    await Promise.all([a, b, c]);
    expect(llamadas).toEqual([
      'respaldar:tienda',
      'estricta:tienda',
      'respaldar:tienda',
      'estricta:tienda',
      'ajena',
    ]);
  });

  it('solo se conservan las últimas automáticas; las demás van a la papelera', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    for (let n = 0; n < MAX_AUTOMATICAS + 2; n++) {
      reloj += 60_000;
      await i.volver('mysql', 'tienda', viva.id, true);
    }
    const lista = await i.lista('mysql', 'tienda');
    expect(lista.filter((x) => x.automatica)).toHaveLength(MAX_AUTOMATICAS);
    expect(lista.filter((x) => !x.automatica)).toHaveLength(1);
    expect(readdirSync(rutas.papelera()).filter((n) => n.endsWith('.sql'))).toHaveLength(2);
  });

  it('volver a la automática más antigua con el tope alcanzado no la manda a la papelera', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    for (let n = 0; n < MAX_AUTOMATICAS; n++) {
      reloj += 60_000;
      await i.volver('mysql', 'tienda', viva.id, true);
    }
    const autos = (await i.lista('mysql', 'tienda')).filter((x) => x.automatica);
    expect(autos).toHaveLength(MAX_AUTOMATICAS);
    const masAntigua = autos.at(-1)!;
    reloj += 60_000;
    await i.volver('mysql', 'tienda', masAntigua.id, true);
    // La que se aplicó sigue en su sitio; la poda quitó otra (la siguiente más antigua).
    const despues = await i.lista('mysql', 'tienda');
    expect(despues.map((x) => x.id)).toContain(masAntigua.id);
    expect(despues.filter((x) => x.automatica)).toHaveLength(MAX_AUTOMATICAS);
    expect(existsSync(path.join(carpeta(), `${masAntigua.id}.sql`))).toBe(true);
  });

  it('también poda si la restauración falla, sin tocar la instantánea a la que se volvía', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    for (let n = 0; n < MAX_AUTOMATICAS; n++) {
      reloj += 60_000;
      await i.volver('mysql', 'tienda', viva.id, true);
    }
    const masAntigua = (await i.lista('mysql', 'tienda')).filter((x) => x.automatica).at(-1)!;
    fallaEstricta = 'sin-tocar';
    reloj += 60_000;
    await codigoDe(i.volver('mysql', 'tienda', masAntigua.id, true));
    const despues = await i.lista('mysql', 'tienda');
    expect(despues.filter((x) => x.automatica)).toHaveLength(MAX_AUTOMATICAS);
    expect(despues.map((x) => x.id)).toContain(masAntigua.id);
    expect(readdirSync(rutas.papelera()).filter((n) => n.endsWith('.sql'))).toHaveLength(1);
  });
});

describe('papelera, recuperar y huérfanos', () => {
  it('borrar mueve el volcado y su registro a la papelera con la fecha del borrado', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    await i.borrar('mysql', 'tienda', t.id);
    expect(await i.lista('mysql', 'tienda')).toEqual([]);
    expect(readdirSync(carpeta())).toEqual([]);
    expect(readdirSync(rutas.papelera()).sort()).toEqual([
      `mysql__tienda__${t.id}.borrado`,
      `mysql__tienda__${t.id}.json`,
      `mysql__tienda__${t.id}.sql`,
    ]);
    expect(await i.papelera('mysql', 'tienda')).toEqual([
      { ...t, borrada: new Date(reloj).toISOString() },
    ]);
    centinelaIntacta();
  });

  it('recuperar la devuelve a la lista de su base', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    await i.borrar('mysql', 'tienda', t.id);
    expect(await i.recuperar('mysql', 'tienda', t.id)).toEqual(t);
    expect(await i.lista('mysql', 'tienda')).toEqual([t]);
    expect(readdirSync(rutas.papelera())).toEqual([]);
    expect(await i.papelera('mysql', 'tienda')).toEqual([]);
    expect(await codigoDe(i.recuperar('mysql', 'tienda', t.id))).toBe('instantaneas.no_encontrada');
    // De otra base no se recupera.
    await i.borrar('mysql', 'tienda', t.id);
    expect(await codigoDe(i.recuperar('mysql', 'otra', t.id))).toBe('instantaneas.no_encontrada');
  });

  it('purga lo que lleva más de 7 días según su fecha de borrado y deja lo reciente y lo ajeno', async () => {
    const i = armar();
    const a = await i.tomar('mysql', 'tienda', 'a');
    reloj += 1000;
    const b = await i.tomar('mysql', 'tienda', 'b');
    await i.borrar('mysql', 'tienda', a.id);
    await i.borrar('mysql', 'tienda', b.id);
    const pap = rutas.papelera();
    const ajeno = path.join(pap, 'notas-del-usuario.txt');
    writeFileSync(ajeno, 'no es mío');
    const viejo = new Date(reloj - 8 * 24 * 60 * 60 * 1000).toISOString();
    writeFileSync(path.join(pap, `mysql__tienda__${a.id}.borrado`), `${viejo}\n`);
    expect(await i.purgarPapelera()).toBe(2);
    expect(readdirSync(pap).sort()).toEqual(
      [
        `mysql__tienda__${b.id}.borrado`,
        `mysql__tienda__${b.id}.json`,
        `mysql__tienda__${b.id}.sql`,
        'notas-del-usuario.txt',
      ].sort(),
    );
    expect(readFileSync(ajeno, 'utf8')).toBe('no es mío');
    centinelaIntacta();
  });

  it('borrar una instantánea cuyo volcado falta limpia lo que quede', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    rmSync(path.join(carpeta(), `${t.id}.sql`));
    await i.borrar('mysql', 'tienda', t.id);
    expect(readdirSync(carpeta())).toEqual([]);
  });

  it('lista las instantáneas de toda la instancia, también las de bases que ya no existen', async () => {
    const i = armar();
    const a = await i.tomar('mysql', 'tienda', 'a');
    reloj += 1000;
    const b = await i.tomar('mysql', 'con', 'b');
    reloj += 1000;
    await i.tomar('mariadb', 'otra', 'c');
    expect((await i.listaInstancia('mysql')).map((x) => x.id)).toEqual([b.id, a.id]);
    expect(await i.listaInstancia('mongodb')).toEqual([]);
  });

  it('al arrancar quita lo que dejó una instantánea interrumpida (de más de 10 minutos) y nada más', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'buena');
    mkdirSync(path.join(carpeta(), '.tomando-abc'));
    writeFileSync(path.join(carpeta(), '.tomando-abc', 'x.sql'), 'parcial');
    writeFileSync(path.join(carpeta(), '20261125-000000-aaaaaa.sql'), 'sin registro');
    writeFileSync(path.join(carpeta(), '20261125-000000-aaaaaa.json.1a2b.tmp'), '{');
    writeFileSync(path.join(carpeta(), 'notas.txt'), 'mío');
    // Recién creados pueden ser una instantánea en curso: no se tocan.
    expect(await i.limpiarHuerfanos()).toBe(0);
    const viejo = new Date(Date.now() - 20 * 60 * 1000);
    for (const n of [
      '.tomando-abc',
      '20261125-000000-aaaaaa.sql',
      '20261125-000000-aaaaaa.json.1a2b.tmp',
    ]) {
      utimesSync(path.join(carpeta(), n), viejo, viejo);
    }
    expect(await i.limpiarHuerfanos()).toBe(3);
    expect(readdirSync(carpeta()).sort()).toEqual(
      [`${t.id}.json`, `${t.id}.sql`, 'notas.txt'].sort(),
    );
    centinelaIntacta();
  });
});
