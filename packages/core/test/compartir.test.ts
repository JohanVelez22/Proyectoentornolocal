import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Compartir,
  MAX_ACCESOS,
  MAX_ACCESOS_POR_SEGUNDO,
  REVISION_MS,
  type DepsCompartir,
  type EstadoCompartir,
  type TunelAbierto,
} from '../src/compartir/compartir';
import type { AccesoCompartido } from '../src/compartir/servidor';
import { esErrorWolf } from '../src/errores';

/**
 * El túnel es SIMULADO: nunca se abre uno real ni se publica nada. El servidor sí escucha, pero en
 * 127.0.0.1 con un puerto aleatorio y sobre carpetas temporales con archivos falsos.
 */

/** Fuera de `%LOCALAPPDATA%\\Temp`: compartir rechaza cualquier ruta que pase por `AppData`. */
const DIR_PRUEBAS = path.resolve(__dirname, '..');
let base: string;
let inicio: string;
let datos: string;
let sistema: string;
let compartido: string;
let estados: EstadoCompartir[];
let accesos: AccesoCompartido[];
let tuneles: Array<{ puerto: number; proveedor: string; cerrado: number; caer: () => void }>;
let plazos: Array<{ fn: () => void; ms: number; cancelado: boolean }>;
let fallaTunel: Error | null;
let sitios: { carpeta: string; datosReales: boolean }[];
let c: Compartir;
let reloj: number;
let perfilCarpetas: string[];

const SI = true;
const DEPS = (): DepsCompartir => ({
  tunel: async (puerto, proveedor, alCaer): Promise<TunelAbierto> => {
    if (fallaTunel) throw fallaTunel;
    const t = { puerto, proveedor, cerrado: 0, caer: alCaer };
    tuneles.push(t);
    return {
      url: 'https://falso-simulado.trycloudflare.com/',
      cerrar: async () => {
        t.cerrado++;
      },
    };
  },
  carpetasPropias: () => [datos],
  carpetaInicio: () => inicio,
  carpetasSistema: () => [sistema],
  carpetasPerfil: () => perfilCarpetas,
  sitios: async () => sitios,
  alEstado: (e) => estados.push(e),
  alAcceso: (a) => accesos.push(a),
  ahora: () => reloj,
  programar: (fn, ms) => {
    const p = { fn, ms, cancelado: false };
    plazos.push(p);
    return () => {
      p.cancelado = true;
    };
  },
});

const codigoDe = async (p: Promise<unknown>): Promise<string | null> => {
  try {
    await p;
    return null;
  } catch (e) {
    return esErrorWolf(e) ? e.codigo : `otro:${String(e)}`;
  }
};

function pedir(url: string): Promise<{ codigo: number; cuerpo: string }> {
  // La URL pública es la simulada: la petición real va al puerto local con la misma ruta.
  const u = new URL(url);
  const puerto = tuneles[tuneles.length - 1]!.puerto;
  return new Promise((ok, mal) => {
    http
      .get({ host: '127.0.0.1', port: puerto, path: u.pathname }, (res) => {
        const t: Buffer[] = [];
        res.on('data', (x: Buffer) => t.push(x));
        res.on('end', () =>
          ok({ codigo: res.statusCode ?? 0, cuerpo: Buffer.concat(t).toString() }),
        );
      })
      .on('error', mal);
  });
}

beforeEach(() => {
  base = realpathSync.native(mkdtempSync(path.join(DIR_PRUEBAS, '.tmp-d52-svc-')));
  inicio = path.join(base, 'usuario');
  datos = path.join(base, 'usuario', 'AppData', 'WolfCoreDev');
  sistema = path.join(base, 'Windows');
  compartido = path.join(inicio, 'Descargas');
  for (const d of [datos, sistema, compartido]) mkdirSync(d, { recursive: true });
  writeFileSync(path.join(compartido, 'foto.txt'), 'contenido');
  reloj = 1_000_000;
  perfilCarpetas = [];
  estados = [];
  accesos = [];
  tuneles = [];
  plazos = [];
  fallaTunel = null;
  sitios = [];
  c = new Compartir(DEPS());
});

afterEach(async () => {
  await c.cerrar();
  rmSync(base, { recursive: true, force: true });
});

const iniciar = (ruta = compartido, extra: Partial<Parameters<Compartir['iniciar']>[0]> = {}) =>
  c.iniciar({ ruta, duracionMin: 60, proveedor: 'cloudflare-rapido', confirmado: SI, ...extra });

describe('confirmación y datos', () => {
  it('sin confirmado === true no se toca nada', async () => {
    for (const confirmado of [undefined, false, 'true', 1, null] as unknown[]) {
      expect(
        await codigoDe(
          c.iniciar({
            ruta: compartido,
            duracionMin: 60,
            proveedor: 'cloudflare-rapido',
            confirmado: confirmado as boolean,
          }),
        ),
      ).toBe('compartir.confirmacion_requerida');
    }
    expect(tuneles).toHaveLength(0);
    expect(estados).toHaveLength(0);
  });

  it('la duración es obligatoria y de la lista', async () => {
    for (const d of [0, 5, 30, 61, 241, -1, NaN, '60' as unknown as number]) {
      expect(await codigoDe(iniciar(compartido, { duracionMin: d }))).toBe(
        'compartir.duracion_invalida',
      );
    }
    for (const d of [15, 60, 240]) {
      expect(await codigoDe(iniciar(compartido, { duracionMin: d }))).toBeNull();
      await c.detener();
    }
  });

  it('solo Cloudflare rápido o ngrok', async () => {
    for (const p of ['tailscale', 'expose', 'cloudflare-nombre', '', 'x']) {
      expect(await codigoDe(iniciar(compartido, { proveedor: p }))).toBe(
        'compartir.proveedor_invalido',
      );
    }
    expect(await codigoDe(iniciar(compartido, { proveedor: 'ngrok' }))).toBeNull();
    expect(tuneles[0]!.proveedor).toBe('ngrok');
  });
});

describe('ciclo de vida', () => {
  it('inicia, da la URL con el token y registra el vencimiento', async () => {
    const e = await iniciar();
    expect(e.fase).toBe('activa');
    expect(e.url).toMatch(/^https:\/\/falso-simulado\.trycloudflare\.com\/[A-Za-z0-9_-]{22}\/$/);
    expect(e.expira).toBe(1_000_000 + 60 * 60_000);
    // El vencimiento se revisa por el reloj, cada 15 s (un temporizador largo no cuenta lo suspendido).
    expect(plazos[0]!.ms).toBe(REVISION_MS);
    expect(estados.map((x) => x.fase)).toEqual(['iniciando', 'activa']);
    const r = await pedir(e.url!);
    expect(r.codigo).toBe(200);
    expect(r.cuerpo).toContain('foto.txt');
  });

  it('el token son 128 bits y es distinto en cada compartición', async () => {
    const a = (await iniciar()).url!;
    await c.detener();
    const b = (await iniciar()).url!;
    expect(a).not.toBe(b);
    const tok = (u: string) => new URL(u).pathname.split('/')[1]!;
    expect(Buffer.from(tok(a), 'base64url')).toHaveLength(16);
  });

  it('solo una compartición a la vez', async () => {
    await iniciar();
    expect(await codigoDe(iniciar())).toBe('compartir.ocupado');
    expect(tuneles).toHaveLength(1);
  });

  it('dos inicios simultáneos: uno gana y el otro es «ocupado»', async () => {
    const r = await Promise.all([codigoDe(iniciar()), codigoDe(iniciar())]);
    expect(r.filter((x) => x === null)).toHaveLength(1);
    expect(r.filter((x) => x === 'compartir.ocupado')).toHaveLength(1);
    expect(tuneles).toHaveLength(1);
  });

  it('«Dejar de compartir» cierra el túnel y el servidor', async () => {
    const e = await iniciar();
    const puerto = tuneles[0]!.puerto;
    const fin = await c.detener();
    expect(fin.fase).toBe('inactiva');
    expect(fin.fin).toBe('usuario');
    expect(fin.url).toBeNull();
    expect(tuneles[0]!.cerrado).toBe(1);
    expect(plazos[0]!.cancelado).toBe(true);
    await expect(
      new Promise((ok, mal) =>
        http
          .get({ host: '127.0.0.1', port: puerto, path: new URL(e.url!).pathname }, ok)
          .on('error', mal),
      ),
    ).rejects.toBeTruthy();
    // idempotente
    await c.detener();
    expect(tuneles[0]!.cerrado).toBe(1);
  });

  it('al vencer se cierran el servidor y el túnel', async () => {
    await iniciar();
    const puerto = tuneles[0]!.puerto;
    reloj += 60 * 60_000;
    plazos.at(-1)!.fn();
    await new Promise((r) => setTimeout(r, 50));
    expect(c.estado().fase).toBe('inactiva');
    expect(c.estado().fin).toBe('vencio');
    expect(tuneles[0]!.cerrado).toBe(1);
    await expect(
      new Promise((ok, mal) =>
        http.get({ host: '127.0.0.1', port: puerto, path: '/' }, ok).on('error', mal),
      ),
    ).rejects.toBeTruthy();
  });

  it('si el túnel cae por su cuenta, todo se cierra', async () => {
    await iniciar();
    tuneles[0]!.caer();
    await new Promise((r) => setTimeout(r, 50));
    expect(c.estado().fase).toBe('inactiva');
    expect(c.estado().fin).toBe('tunel');
  });

  it('al cerrar la app se cierra todo', async () => {
    await iniciar();
    await c.cerrar();
    expect(c.estado().fase).toBe('inactiva');
    expect(c.estado().fin).toBe('cierre');
    expect(tuneles[0]!.cerrado).toBe(1);
  });

  it('si el túnel no abre, el servidor se cierra y el error sube', async () => {
    fallaTunel = new Error('sin red');
    expect(await codigoDe(iniciar())).toMatch(/^otro:/);
    expect(c.estado().fase).toBe('inactiva');
    // se puede volver a intentar
    fallaTunel = null;
    expect(await codigoDe(iniciar())).toBeNull();
  });

  it('dejar de compartir mientras el túnel se abre no deja nada abierto', async () => {
    let soltar!: () => void;
    const espera = new Promise<void>((r) => (soltar = r));
    const deps = DEPS();
    const abierto = { cerrado: 0 };
    c = new Compartir({
      ...deps,
      tunel: async (_p, _pr, _al, senal) => {
        // Un túnel que se abría cuando llega la cancelación: termina de abrirse y hay que cerrarlo.
        senal.addEventListener('abort', () => soltar());
        await espera;
        return {
          url: 'https://x.trycloudflare.com',
          cerrar: async () => {
            abierto.cerrado++;
          },
        };
      },
    });
    const p = iniciar();
    await new Promise((r) => setTimeout(r, 30));
    await c.detener();
    soltar();
    await p;
    expect(c.estado().fase).toBe('inactiva');
    expect(abierto.cerrado).toBe(1);
    expect(plazos).toHaveLength(0);
  });

  it('compartir un archivo da la URL con su nombre', async () => {
    const e = await iniciar(path.join(compartido, 'foto.txt'));
    expect(e.tipo).toBe('archivo');
    expect(e.url).toMatch(/\/foto\.txt$/);
    expect((await pedir(e.url!)).cuerpo).toBe('contenido');
  });
});

describe('vencimiento por el reloj', () => {
  it('antes de vencer, el temporizador solo se reprograma', async () => {
    await iniciar();
    reloj += 10 * 60_000;
    plazos.at(-1)!.fn();
    await new Promise((r) => setTimeout(r, 20));
    expect(c.estado().fase).toBe('activa');
    expect(plazos.length).toBe(2);
    expect(plazos[0]!.cancelado).toBe(false);
  });

  it('tras suspender el equipo (el temporizador no corrió), el servidor ya no responde', async () => {
    const e = await iniciar();
    const r1 = await pedir(e.url!);
    expect(r1.codigo).toBe(200);
    reloj += 61 * 60_000; // pasó la hora y el temporizador no se enteró
    const r2 = await pedir(e.url!);
    expect(r2.codigo).toBe(404);
    // y en cuanto el temporizador corre, se cierra todo
    plazos.at(-1)!.fn();
    await new Promise((r) => setTimeout(r, 50));
    expect(c.estado().fin).toBe('vencio');
  });
});

describe('registro de accesos', () => {
  it('una avalancha de peticiones no inunda el registro', async () => {
    const e = await iniciar();
    for (let i = 0; i < MAX_ACCESOS_POR_SEGUNDO + 30; i++) await pedir(`${e.url}x${i}`);
    expect(c.accesos()).toHaveLength(MAX_ACCESOS_POR_SEGUNDO);
    expect(accesos).toHaveLength(MAX_ACCESOS_POR_SEGUNDO);
    reloj += 1500;
    await pedir(e.url!);
    expect(c.accesos()).toHaveLength(MAX_ACCESOS_POR_SEGUNDO + 1);
  });

  it('guarda un tope y nunca muestra el token', async () => {
    const e = await iniciar();
    const token = new URL(e.url!).pathname.split('/')[1]!;
    for (let i = 0; i < MAX_ACCESOS + 25; i++) {
      reloj += 100;
      await pedir(`${e.url}n${i}.txt`);
    }
    expect(c.accesos()).toHaveLength(MAX_ACCESOS);
    expect(JSON.stringify(c.accesos())).not.toContain(token);
    expect(accesos.length).toBe(MAX_ACCESOS + 25);
    // los más recientes se conservan
    expect(c.accesos().at(-1)!.ruta).toBe(`/n${MAX_ACCESOS + 24}.txt`);
  });

  it('una compartición nueva empieza con el registro vacío', async () => {
    const e = await iniciar();
    await pedir(e.url!);
    await c.detener();
    expect(c.accesos()).toHaveLength(1);
    await iniciar();
    expect(c.accesos()).toHaveLength(0);
  });
});

describe('rechazos', () => {
  it('la raíz de una unidad', async () => {
    expect(await codigoDe(iniciar(path.parse(base).root))).toBe('compartir.raiz_unidad');
  });

  it('la carpeta del usuario entera y las que la contienen, pero no una subcarpeta', async () => {
    expect(await codigoDe(iniciar(inicio))).toBe('compartir.carpeta_usuario');
    expect(await codigoDe(iniciar(path.dirname(inicio)))).toBe('compartir.carpeta_usuario');
    expect(await codigoDe(iniciar(compartido))).toBeNull();
  });

  it('la carpeta de datos de WolfCore Dev, dentro de ella y la que la contiene', async () => {
    expect(await codigoDe(iniciar(datos))).toBe('compartir.carpeta_datos');
    mkdirSync(path.join(datos, 'logs'));
    expect(await codigoDe(iniciar(path.join(datos, 'logs')))).toBe('compartir.carpeta_datos');
    expect(await codigoDe(iniciar(path.dirname(datos)))).toBe('compartir.carpeta_datos');
  });

  it('un archivo dentro de la carpeta de datos', async () => {
    writeFileSync(path.join(datos, 'config.json'), '{}');
    expect(await codigoDe(iniciar(path.join(datos, 'config.json')))).toBe(
      'compartir.carpeta_datos',
    );
  });

  it('una unión hacia la carpeta de datos no la esquiva', async () => {
    const union = path.join(compartido, 'atajo');
    symlinkSync(datos, union, 'junction');
    expect(await codigoDe(iniciar(union))).toBe('compartir.carpeta_datos');
  });

  it('las carpetas del sistema y lo de dentro', async () => {
    mkdirSync(path.join(sistema, 'System32'));
    expect(await codigoDe(iniciar(sistema))).toBe('compartir.carpeta_sistema');
    expect(await codigoDe(iniciar(path.join(sistema, 'System32')))).toBe(
      'compartir.carpeta_sistema',
    );
  });

  it('un sitio con datos reales y sus subcarpetas, pero no uno sin ellos', async () => {
    const sitio = path.join(base, 'sitio');
    mkdirSync(path.join(sitio, 'public'), { recursive: true });
    sitios = [{ carpeta: sitio, datosReales: true }];
    expect(await codigoDe(iniciar(sitio))).toBe('compartir.sitio_datos_reales');
    expect(await codigoDe(iniciar(path.join(sitio, 'public')))).toBe(
      'compartir.sitio_datos_reales',
    );
    sitios = [{ carpeta: sitio, datosReales: false }];
    expect(await codigoDe(iniciar(sitio))).toBeNull();
  });

  it.each(['.ssh', '.gnupg', '.aws', '.azure', '.kube', '.docker', '.git'])(
    'la carpeta %s y las que la tienen en su raíz',
    async (n) => {
      const contiene = path.join(base, `con-${n.slice(1)}`);
      mkdirSync(path.join(contiene, n), { recursive: true });
      expect(await codigoDe(iniciar(contiene))).toBe('compartir.carpeta_secretos');
      expect(await codigoDe(iniciar(path.join(contiene, n)))).toBe('compartir.carpeta_secretos');
    },
  );

  it('un archivo dentro de una carpeta de claves', async () => {
    mkdirSync(path.join(base, '.aws'));
    writeFileSync(path.join(base, '.aws', 'config'), 'x');
    expect(await codigoDe(iniciar(path.join(base, '.aws', 'config')))).toBe(
      'compartir.carpeta_secretos',
    );
  });

  it('archivos sensibles', async () => {
    writeFileSync(path.join(compartido, '.env'), 'A=1');
    writeFileSync(path.join(compartido, 'id_rsa'), 'x');
    writeFileSync(
      path.join(compartido, 'nota.txt'),
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    );
    for (const n of ['.env', 'id_rsa', 'nota.txt']) {
      expect(await codigoDe(iniciar(path.join(compartido, n)))).toBe('compartir.archivo_sensible');
    }
  });

  it.each(['', 'relativa/x', '\\\\servidor\\recurso', 'C:\\no\\existe\\jamas', 'a\u0000b'])(
    'ruta no válida: %j',
    async (r) => {
      expect(await codigoDe(iniciar(r))).toBe('compartir.ruta_invalida');
    },
  );

  it('un rechazo deja el estado limpio y no abre túnel', async () => {
    await codigoDe(iniciar(datos));
    expect(c.estado().fase).toBe('inactiva');
    expect(tuneles).toHaveLength(0);
  });
});

describe('datos de los programas del usuario (AppData y carpetas de configuración)', () => {
  beforeEach(() => {
    mkdirSync(path.join(inicio, 'AppData', 'Roaming', 'Mozilla', 'Firefox'), { recursive: true });
    mkdirSync(path.join(inicio, 'AppData', 'Local'), { recursive: true });
    perfilCarpetas = [path.join(inicio, 'AppData'), path.join(inicio, 'AppData', 'Roaming')];
  });

  it('AppData, Roaming y lo que hay dentro se rechazan', async () => {
    const roaming = path.join(inicio, 'AppData', 'Roaming');
    // (`AppData` entera contiene la carpeta de datos de esta prueba: la rechaza antes por ese motivo.)
    for (const r of [
      roaming,
      path.join(roaming, 'Mozilla'),
      path.join(roaming, 'Mozilla', 'Firefox'),
      path.join(inicio, 'AppData', 'Local'),
    ]) {
      expect(await codigoDe(iniciar(r)), r).toBe('compartir.carpeta_perfil');
    }
    expect(tuneles).toHaveLength(0);
  });

  it('un archivo dentro de Roaming también', async () => {
    const f = path.join(inicio, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'cookies.sqlite');
    writeFileSync(f, 'SQLite format 3 falso');
    expect(await codigoDe(iniciar(f))).toBe('compartir.carpeta_perfil');
  });

  it('una unión hacia Roaming no lo esquiva', async () => {
    const union = path.join(compartido, 'atajo-roaming');
    symlinkSync(path.join(inicio, 'AppData', 'Roaming'), union, 'junction');
    expect(await codigoDe(iniciar(union))).toBe('compartir.carpeta_perfil');
  });

  it.each([
    '.claude',
    '.codex',
    '.config',
    '.npm',
    '.m2',
    '.gradle',
    '.cargo',
    '.nuget',
    '.vscode',
    '.idea',
    '.mozilla',
  ])('%s en la carpeta del usuario y lo de dentro se rechazan', async (n) => {
    const d = path.join(inicio, n);
    mkdirSync(path.join(d, 'sub'), { recursive: true });
    expect(await codigoDe(iniciar(d))).toBe('compartir.carpeta_perfil');
    expect(await codigoDe(iniciar(path.join(d, 'sub')))).toBe('compartir.carpeta_perfil');
  });

  it('fuera de la carpeta del usuario, una carpeta con ese nombre también se rechaza', async () => {
    const d = path.join(base, 'otro', '.claude');
    mkdirSync(d, { recursive: true });
    expect(await codigoDe(iniciar(d))).toBe('compartir.carpeta_perfil');
  });

  it('una carpeta normal con cookies.sqlite y key4.db se comparte (esos archivos no se sirven)', async () => {
    writeFileSync(path.join(compartido, 'cookies.sqlite'), 'SQLite format 3 falso');
    writeFileSync(path.join(compartido, 'key4.db'), 'SQLite format 3 falso');
    const e = await iniciar();
    const u = new URL(e.url!);
    for (const n of ['cookies.sqlite', 'key4.db']) {
      expect((await pedir(`${u.origin}${u.pathname}${n}`)).codigo, n).toBe(404);
    }
    const l = (await pedir(e.url!)).cuerpo;
    expect(l).not.toContain('cookies.sqlite');
    expect(l).not.toContain('key4.db');
  });

  it('un proyecto con .vscode o .idea en su raíz se puede compartir (esas carpetas no salen)', async () => {
    mkdirSync(path.join(compartido, '.vscode'));
    mkdirSync(path.join(compartido, '.idea'));
    const e = await iniciar();
    expect((await pedir(e.url!)).cuerpo).not.toContain('.vscode');
  });

  it('un archivo de texto de más de 8 MB no se comparte; un paquete sí', async () => {
    writeFileSync(path.join(compartido, 'volcado.txt'), Buffer.alloc(8 * 1024 * 1024 + 10, 65));
    writeFileSync(path.join(compartido, 'copia.zip'), Buffer.alloc(8 * 1024 * 1024 + 10, 65));
    expect(await codigoDe(iniciar(path.join(compartido, 'volcado.txt')))).toBe(
      'compartir.archivo_grande',
    );
    expect(await codigoDe(iniciar(path.join(compartido, 'copia.zip')))).toBeNull();
  });
});

describe('ruta real y vista previa', () => {
  it('vista da la ruta real y avisa de que difiere si hay una unión de por medio', async () => {
    const union = path.join(inicio, 'enlace-a-descargas');
    symlinkSync(compartido, union, 'junction');
    const v = await c.vista(union);
    expect(v.difiere).toBe(true);
    expect(v.real).toBe(compartido);
    expect(v.ruta).toBe(union);
    const n = await c.vista(compartido);
    expect(n.difiere).toBe(false);
  });

  it('vista rechaza lo mismo que iniciar, antes de confirmar nada', async () => {
    expect(await codigoDe(c.vista(datos))).toBe('compartir.carpeta_datos');
    expect(tuneles).toHaveLength(0);
  });

  it('el estado trae la ruta real cuando difiere, y null cuando no', async () => {
    const union = path.join(inicio, 'enlace-a-descargas');
    symlinkSync(compartido, union, 'junction');
    const e = await iniciar(union);
    expect(e.ruta).toBe(union);
    expect(e.rutaReal).toBe(compartido);
    await c.detener();
    expect((await iniciar(compartido)).rutaReal).toBeNull();
  });
});

describe('dejar de compartir mientras se abre el túnel', () => {
  it('parar durante «iniciando» aborta la apertura, cierra todo y deja iniciar de nuevo sin «ocupado»', async () => {
    let abortado = false;
    let abiertos = 0;
    const deps = DEPS();
    let modo: 'colgado' | 'normal' = 'colgado';
    c = new Compartir({
      ...deps,
      tunel: (puerto, proveedor, alCaer, senal) => {
        if (modo === 'normal') return deps.tunel(puerto, proveedor, alCaer, senal);
        return new Promise((_ok, mal) => {
          senal.addEventListener('abort', () => {
            abortado = true;
            mal(new Error('abortado por el usuario'));
          });
        });
      },
    });
    const primero = iniciar();
    await new Promise((r) => setTimeout(r, 50));
    expect(c.estado().fase).toBe('iniciando');
    const fin = await c.detener();
    expect(fin.fase).toBe('inactiva');
    expect(abortado).toBe(true);
    // el primer iniciar termina sin error (se canceló a propósito)
    expect((await primero).fase).toBe('inactiva');
    modo = 'normal';
    abiertos++;
    const segundo = await iniciar();
    expect(segundo.fase).toBe('activa');
    expect(tuneles).toHaveLength(abiertos);
  });

  it('el tunel recibe una señal que sigue sin abortar mientras todo va bien', async () => {
    let senal: AbortSignal | null = null;
    const deps = DEPS();
    c = new Compartir({
      ...deps,
      tunel: (p, pr, al, s) => {
        senal = s;
        return deps.tunel(p, pr, al, s);
      },
    });
    await iniciar();
    expect(senal!.aborted).toBe(false);
    await c.detener();
  });
});

describe('copias de AppData y de perfiles de navegador fuera de la carpeta del usuario', () => {
  const w = (p: string, c = 'falso') => {
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, c);
  };

  it.each([
    ['Backup', 'Users', 'X', 'AppData', 'Roaming'],
    [
      'Backup',
      'Users',
      'X',
      'AppData',
      'Roaming',
      'Mozilla',
      'Firefox',
      'Profiles',
      'abcd.default',
    ],
    ['Windows.old', 'Users', 'X', 'AppData', 'Local'],
    ['otra-unidad', 'APPDATA', 'Roaming'],
  ])('%s se rechaza aunque no esté en la carpeta del usuario', async (...tramos) => {
    const d = path.join(base, ...tramos);
    mkdirSync(d, { recursive: true });
    expect(await codigoDe(iniciar(d))).toBe('compartir.carpeta_perfil');
    // y un archivo de dentro también
    w(path.join(d, 'recovery.jsonlz4'));
    expect(await codigoDe(iniciar(path.join(d, 'recovery.jsonlz4')))).toBe(
      'compartir.carpeta_perfil',
    );
  });

  it('un perfil de Firefox copiado suelto (por su contenido) y un Default de Chrome copiado', async () => {
    const ff = path.join(base, 'copia', 'abcd.default-release');
    w(path.join(ff, 'prefs.js'));
    w(path.join(ff, 'places.sqlite'));
    expect(await codigoDe(iniciar(ff))).toBe('compartir.carpeta_perfil');
    const ch = path.join(base, 'copia', 'Default');
    w(path.join(ch, 'Login Data'));
    w(path.join(ch, 'Preferences'));
    mkdirSync(path.join(ch, 'Network'));
    expect(await codigoDe(iniciar(ch))).toBe('compartir.carpeta_perfil');
    const ud = path.join(base, 'copia2', 'User Data');
    mkdirSync(ud, { recursive: true });
    expect(await codigoDe(iniciar(ud))).toBe('compartir.carpeta_perfil');
  });

  it('una carpeta normal con un nombre parecido se comparte', async () => {
    const d = path.join(base, 'Profiles-de-clientes');
    w(path.join(d, 'a.txt'));
    expect(await codigoDe(iniciar(d))).toBeNull();
  });
});
