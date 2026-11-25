import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  Instantaneas,
  MAX_AUTOMATICAS,
  type DepsInstantaneas,
  type RespaldosInstantaneas,
} from '../src/bd/instantaneas';
import { ErrorWolf } from '../src/errores';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const CENTINELA = 'centinela-datos-d19';

let dir: string;
let rutas: Rutas;
let llamadas: string[];
let contenido: string;
let tablasDump: number;
let fallaRespaldar: boolean;
let fallaAcotada: boolean;
let fallaRestaurar: boolean;
let restringidos: string[];
let reloj: number;
let estado: { tablas: number; bytes: number };
let libre: number;
/** Lo que se leyó del archivo en cada restauración (para saber qué se aplicó). */
let aplicado: string[];

const respaldos: RespaldosInstantaneas = {
  async respaldar(objetivo, base, carpeta) {
    llamadas.push(`respaldar:${base}`);
    if (fallaRespaldar) throw new Error('mysqldump falló');
    const archivo = path.join(
      carpeta!,
      `${base}-20261125-1030.${objetivo === 'postgresql' ? 'dump' : 'sql'}`,
    );
    writeFileSync(archivo, contenido);
    return { archivo };
  },
  async restaurar(_o, archivo, base, opts) {
    llamadas.push(
      `restaurar:${base}:${opts?.confirmarSobrescribir === true ? 'confirmado' : 'sin'}`,
    );
    aplicado.push(readFileSync(archivo, 'utf8'));
    if (fallaRestaurar) throw new Error('no se pudo');
    return { advertencias: [] };
  },
  async restaurarAcotada(_o, archivo, base) {
    llamadas.push(`acotada:${base}`);
    aplicado.push(readFileSync(archivo, 'utf8'));
    if (fallaAcotada) throw new Error('ERROR 1227: sin permiso');
    return { advertencias: ['aviso'] };
  },
  async inspeccionar() {
    return { tablas: tablasDump };
  },
};

function armar(extra: Partial<DepsInstantaneas> = {}): Instantaneas {
  return new Instantaneas({
    rutas,
    respaldos,
    estadoBase: async () => ({ ...estado }),
    restringir: async (r) => {
      restringidos.push(r);
      return true;
    },
    espacioLibre: async () => libre,
    reloj: () => new Date(reloj),
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

beforeEach(async () => {
  dir = await carpetaTemporal('pel-inst-');
  rutas = new Rutas(path.join(dir, 'base'));
  llamadas = [];
  aplicado = [];
  contenido = 'CREATE TABLE a (id int);\nINSERT INTO a VALUES (1);\n';
  tablasDump = 3;
  fallaRespaldar = false;
  fallaAcotada = false;
  fallaRestaurar = false;
  restringidos = [];
  reloj = Date.UTC(2026, 10, 25, 10, 30, 0);
  estado = { tablas: 3, bytes: 1000 };
  libre = 10 * 1024 * 1024 * 1024;
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
  it('guarda el volcado y su registro con huella, tablas y nota, en la carpeta de datos restringida', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', '  antes del   cambio ');
    expect(t).toMatchObject({
      instancia: 'mysql',
      base: 'tienda',
      nota: 'antes del   cambio',
      tablas: 3,
      automatica: false,
      fecha: new Date(reloj).toISOString(),
    });
    expect(t.bytes).toBe(Buffer.byteLength(contenido));
    expect(t.id).toMatch(/^20261125-103000-[0-9a-f]{6}$/);
    const archivos = readdirSync(carpeta()).sort();
    expect(archivos).toEqual([`${t.id}.json`, `${t.id}.sql`]);
    const reg = JSON.parse(readFileSync(path.join(carpeta(), `${t.id}.json`), 'utf8'));
    expect(reg.sha256).toMatch(/^[0-9a-f]{64}$/);
    // Carpeta de datos de WolfCore Dev, restringida al usuario (carpeta y archivos).
    expect(carpeta().startsWith(rutas.base)).toBe(true);
    expect(restringidos).toContain(carpeta());
    expect(restringidos).toContain(path.join(carpeta(), `${t.id}.sql`));
    expect(restringidos).toContain(path.join(carpeta(), `${t.id}.json`));
    expect(await i.lista('mysql', 'tienda')).toEqual([t]);
    // La carpeta de preparación no queda.
    expect(readdirSync(carpeta()).some((n) => n.startsWith('.tomando'))).toBe(false);
    centinelaIntacta();
  });

  it('PostgreSQL guarda .dump y la lista va de la más reciente a la más antigua', async () => {
    const i = armar();
    const a = await i.tomar('postgresql', 'tienda', 'a');
    reloj += 60_000;
    const b = await i.tomar('postgresql', 'tienda', 'b');
    expect(a.id.endsWith('.dump')).toBe(false);
    expect(existsSync(path.join(carpeta('postgresql'), `${a.id}.dump`))).toBe(true);
    expect((await i.lista('postgresql', 'tienda')).map((x) => x.nota)).toEqual(['b', 'a']);
    expect(b.fecha > a.fecha).toBe(true);
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
    await import('node:fs/promises').then((f) =>
      f.rm(path.join(carpeta(), `${sinVolcado.id}.sql`)),
    );
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

  it('si el volcado falla no queda nada', async () => {
    fallaRespaldar = true;
    const i = armar();
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.tomar_fallo');
    expect(readdirSync(carpeta())).toEqual([]);
  });

  it('un volcado vacío no se guarda', async () => {
    contenido = '';
    const i = armar();
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.tomar_fallo');
    expect(readdirSync(carpeta())).toEqual([]);
  });
});

describe('topes de tamaño, espacio y cantidad', () => {
  it('una base más grande que el tope no se vuelca', async () => {
    estado = { tablas: 1, bytes: 5000 };
    const i = armar({ maxBytes: 4096 });
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.demasiado_grande');
    expect(llamadas).toEqual([]);
  });

  it('un volcado que pasa el tope se borra', async () => {
    contenido = 'x'.repeat(5000);
    const i = armar({ maxBytes: 4096 });
    expect(await codigoDe(i.tomar('mysql', 'tienda', ''))).toBe('instantaneas.demasiado_grande');
    expect(readdirSync(carpeta())).toEqual([]);
  });

  it('sin espacio libre para el volcado no se intenta', async () => {
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
    // Otra base tiene su propio tope.
    await expect(i.tomar('mysql', 'otra', '1')).resolves.toBeDefined();
  });
});

describe('Instantaneas.volver', () => {
  it('respalda el estado actual antes de restaurar, y restaura con el usuario limitado', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    reloj += 60_000;
    const r = await i.volver('mysql', 'tienda', viva.id, true);
    expect(llamadas).toEqual(['respaldar:tienda', 'acotada:tienda']);
    expect(r.respaldoPrevio.automatica).toBe(true);
    expect(r.respaldoPrevio.nota).toContain('Antes de volver');
    expect(r.advertencias).toEqual(['aviso']);
    // El respaldo previo queda en la lista, y la restauración no pasó por el administrador.
    expect((await i.lista('mysql', 'tienda')).map((x) => x.id)).toContain(r.respaldoPrevio.id);
    expect(llamadas.some((l) => l.startsWith('restaurar:'))).toBe(false);
    centinelaIntacta();
  });

  it('si el respaldo previo falla, no restaura', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    fallaRespaldar = true;
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.respaldo_previo_fallo',
    );
    expect(llamadas).toEqual(['respaldar:tienda']);
  });

  it('sin espacio para el respaldo previo, no restaura', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    libre = 1024;
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.sin_espacio',
    );
    expect(llamadas).toEqual([]);
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

  it('si la restauración falla, la base vuelve sola al estado de antes', async () => {
    const i = armar();
    contenido = 'ESTADO-VIEJO';
    const viva = await i.tomar('mysql', 'tienda', 'vieja');
    contenido = 'ESTADO-ACTUAL';
    llamadas = [];
    aplicado = [];
    fallaAcotada = true;
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.restauracion_fallo',
    );
    expect(llamadas).toEqual(['respaldar:tienda', 'acotada:tienda', 'restaurar:tienda:confirmado']);
    // Lo último que se aplicó es el estado que tenía la base antes (el respaldo previo).
    expect(aplicado.at(-1)).toBe('ESTADO-ACTUAL');
    centinelaIntacta();
  });

  it('si ni siquiera se puede volver atrás, el error nombra la instantánea con el estado anterior', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    fallaAcotada = true;
    fallaRestaurar = true;
    let error: unknown;
    try {
      await i.volver('mysql', 'tienda', viva.id, true);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ErrorWolf);
    const e = error as ErrorWolf;
    expect(e.codigo).toBe('instantaneas.restauracion_sin_revertir');
    const id = String(e.datos?.respaldo);
    const previa = (await i.lista('mysql', 'tienda')).find((x) => x.id === id);
    expect(previa?.automatica).toBe(true);
    expect(existsSync(path.join(carpeta(), `${id}.sql`))).toBe(true);
  });

  it('un archivo alterado (huella distinta) no se restaura ni se toca la base', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    const sql = path.join(carpeta(), `${viva.id}.sql`);
    writeFileSync(sql, contenido.replace('INSERT', 'insert')); // mismo largo, otro contenido
    expect(await codigoDe(i.volver('mysql', 'tienda', viva.id, true))).toBe(
      'instantaneas.huella_no_coincide',
    );
    writeFileSync(sql, `${contenido}DROP DATABASE otra;`); // otro largo
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
    }
    expect(await codigoDe(i.volver('mysql', 'tienda', '20261125-103000-aaaaaa', true))).toBe(
      'instantaneas.no_encontrada',
    );
    expect(llamadas).toEqual([]);
  });

  it('una instantánea de otra base no se puede aplicar a esta', async () => {
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
    // Tampoco una instantánea de otra instancia con el mismo nombre de base.
    expect(await codigoDe(i.volver('mariadb', 'otra', deOtra.id, true))).toBe(
      'instantaneas.no_encontrada',
    );
    expect(llamadas).toEqual([]);
  });

  it('un registro que dice ser de otro motor tampoco se aplica', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    const json = path.join(carpeta(), `${t.id}.json`);
    const reg = JSON.parse(readFileSync(json, 'utf8'));
    writeFileSync(json, JSON.stringify({ ...reg, motor: 'postgresql' }));
    expect(await codigoDe(i.volver('mysql', 'tienda', t.id, true))).toBe('instantaneas.otra_base');
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

  it('las operaciones de una misma base se hacen de una en una', async () => {
    const i = armar();
    const viva = await i.tomar('mysql', 'tienda', 'buena');
    llamadas = [];
    const a = i.volver('mysql', 'tienda', viva.id, true);
    const b = i.volver('mysql', 'tienda', viva.id, true);
    await Promise.all([a, b]);
    expect(llamadas).toEqual([
      'respaldar:tienda',
      'acotada:tienda',
      'respaldar:tienda',
      'acotada:tienda',
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
});

describe('Instantaneas.borrar y la papelera', () => {
  it('borrar mueve el volcado y su registro a la papelera, recuperables', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    await i.borrar('mysql', 'tienda', t.id);
    expect(await i.lista('mysql', 'tienda')).toEqual([]);
    expect(readdirSync(carpeta())).toEqual([]);
    const pap = readdirSync(rutas.papelera()).sort();
    expect(pap).toEqual([`mysql__tienda__${t.id}.json`, `mysql__tienda__${t.id}.sql`]);
    expect(readFileSync(path.join(rutas.papelera(), pap[1]!), 'utf8')).toBe(contenido);
    centinelaIntacta();
  });

  it('purga lo que lleva más de 7 días y deja lo reciente y lo ajeno', async () => {
    const i = armar();
    const a = await i.tomar('mysql', 'tienda', 'a');
    reloj += 1000;
    const b = await i.tomar('mysql', 'tienda', 'b');
    await i.borrar('mysql', 'tienda', a.id);
    await i.borrar('mysql', 'tienda', b.id);
    const pap = rutas.papelera();
    const ajeno = path.join(pap, 'notas-del-usuario.txt');
    writeFileSync(ajeno, 'no es mío');
    const viejo = new Date(reloj - 8 * 24 * 60 * 60 * 1000);
    for (const n of readdirSync(pap)) {
      if (n.includes(a.id) || n === 'notas-del-usuario.txt')
        utimesSync(path.join(pap, n), viejo, viejo);
    }
    expect(await i.purgarPapelera()).toBe(2);
    expect(readdirSync(pap).sort()).toEqual(
      [`mysql__tienda__${b.id}.json`, `mysql__tienda__${b.id}.sql`, 'notas-del-usuario.txt'].sort(),
    );
    // Borrar otra vez dispara la purga sola.
    reloj += 8 * 24 * 60 * 60 * 1000;
    const c = await i.tomar('mysql', 'tienda', 'c');
    await i.borrar('mysql', 'tienda', c.id);
    expect(readdirSync(pap).filter((n) => n.includes(b.id))).toEqual([]);
    expect(readFileSync(ajeno, 'utf8')).toBe('no es mío');
    centinelaIntacta();
  });

  it('borrar una instantánea cuyo volcado falta limpia lo que quede', async () => {
    const i = armar();
    const t = await i.tomar('mysql', 'tienda', 'x');
    await import('node:fs/promises').then((f) => f.rm(path.join(carpeta(), `${t.id}.sql`)));
    await i.borrar('mysql', 'tienda', t.id);
    expect(readdirSync(carpeta())).toEqual([]);
  });
});
