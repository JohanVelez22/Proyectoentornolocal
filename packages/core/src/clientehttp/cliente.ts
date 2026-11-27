import { randomBytes } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';
import { enmascararSecretos } from '../patronesSecretos';
import { escribirAtomico } from '../sitios/urlbase';
import { componer, normalizar } from './componer';
import { aCurl, importarCurl, type ImportacionCurl } from './curl';
import { ejecutar, hostConCaWolf, raicesConCa } from './red';
import {
  MARCA_SECRETO,
  MASCARA,
  esNombreSecreto,
  esSoloVariables,
  urlSinSecretos,
} from './sensibles';
import {
  MAX_COLECCION_HTTP,
  MAX_ENTORNOS_HTTP,
  MAX_HISTORIAL_HTTP,
  type AuthHttp,
  type AvisoCurl,
  type EntornoHttp,
  type EntradaHistorialHttp,
  type EstadoClienteHttp,
  type ParHttp,
  type PeticionHttp,
  type RespuestaHttp,
} from './tipos';
import { entornoValido, idValido, peticionValida, refValida } from './validar';

/** Lo que usa el cliente del almacén de secretos (ids `http:<16 hex>`). */
export interface SecretosHttp {
  guardar(id: string, valor: string): Promise<void>;
  leer(id: string): Promise<string | null>;
  borrar(id: string): Promise<void>;
}

export interface DepsClienteHttp {
  /** Carpeta de las colecciones, los entornos y el historial (bajo la carpeta de datos). */
  carpeta: string;
  secretos: SecretosHttp;
  /** Certificado (PEM) de la CA de WolfCore, o null si aún no existe. */
  caWolf: () => Promise<string | null>;
  /** Dominios (y alias) de los sitios de WolfCore, además de `*.test`. */
  dominiosWolf: () => Promise<string[]>;
  ahora?: () => Date;
  /** Escritura de los archivos de datos (inyectable en pruebas); por defecto, atómica. */
  escribir?: (destino: string, datos: Buffer) => Promise<void>;
  /** Aviso de un archivo ignorado (p. ej. por tamaño); por defecto, la consola del proceso. */
  avisar?: (mensaje: string) => void;
}

/** Lo que una operación creó o sobrescribió en el almacén, para deshacerla si falla. */
class Transaccion {
  readonly creadas: string[] = [];
  readonly previos = new Map<string, string | null>();
}

interface ArchivoColeccion {
  version: 1;
  peticiones: PeticionHttp[];
}
interface ArchivoEntornos {
  version: 1;
  activo: string | null;
  entornos: EntornoHttp[];
}
interface ArchivoHistorial {
  version: 1;
  entradas: EntradaHistorialHttp[];
}

const idNuevo = (): string => randomBytes(8).toString('hex');
const refNueva = (): string => `http:${randomBytes(8).toString('hex')}`;

function refsDe(p: PeticionHttp): string[] {
  const r: string[] = [];
  const de = (l: ParHttp[]): void => {
    for (const x of l) if (x.ref) r.push(x.ref);
  };
  de(p.params);
  de(p.cabeceras);
  if (p.cuerpo.tipo === 'form' || p.cuerpo.tipo === 'multipart') de(p.cuerpo.campos);
  if (p.auth.tipo !== 'ninguna' && p.auth.ref) r.push(p.auth.ref);
  return r;
}
const refsDeEntorno = (e: EntornoHttp): string[] =>
  e.variables.flatMap((v) => (v.ref ? [v.ref] : []));

/**
 * Descarta las refs que no están en `propias` (las de otra petición o entorno) y los `***` del
 * historial puestos en una fila de nombre secreto. Una fila que se queda sin valor ni ref queda
 * marcada como `faltante`: el envío se bloquea hasta que se escriba. Nunca se guarda `***`.
 */
export function sanearRefs(p: PeticionHttp, propias: ReadonlySet<string>): PeticionHttp {
  const par = (x: ParHttp): ParHttp => {
    let ref = x.ref;
    let valor = x.valor;
    let faltante = x.faltante === true;
    if (ref !== undefined && !propias.has(ref)) {
      ref = undefined;
      if (valor === '') faltante = true;
    }
    if (ref === undefined && valor === MASCARA && esNombreSecreto(x.clave)) {
      valor = '';
      faltante = true;
    }
    return {
      clave: x.clave,
      valor,
      activo: x.activo,
      ...(ref !== undefined ? { ref } : {}),
      ...(faltante && valor === '' && ref === undefined ? { faltante: true } : {}),
    };
  };
  const c = p.cuerpo;
  let auth = p.auth;
  if (auth.tipo !== 'ninguna' && auth.ref !== undefined && !propias.has(auth.ref)) {
    const copia: Record<string, unknown> = { ...auth };
    delete copia['ref'];
    auth = copia as unknown as AuthHttp;
  }
  return {
    ...p,
    params: p.params.map(par),
    cabeceras: p.cabeceras.map(par),
    cuerpo: c.tipo === 'form' || c.tipo === 'multipart' ? { ...c, campos: c.campos.map(par) } : c,
    auth,
  };
}

/** Cliente HTTP: colecciones, entornos, historial y envío. Solo vive en el proceso principal. */
export class ClienteHttp {
  private cola: Promise<unknown> = Promise.resolve();
  private readonly envios = new Map<string, AbortController>();
  private raices: { ca: string; lista: string[] } | null = null;

  constructor(private readonly d: DepsClienteHttp) {}

  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const r = this.cola.then(fn, fn);
    this.cola = r.catch(() => undefined);
    return r;
  }

  // ---- Archivos ----

  private ruta(nombre: string): string {
    return path.join(this.d.carpeta, nombre);
  }

  private async leerJson(nombre: string): Promise<unknown> {
    try {
      return JSON.parse(await readFile(this.ruta(nombre), 'utf8')) as unknown;
    } catch {
      return null;
    }
  }

  private async escribirJson(nombre: string, datos: unknown): Promise<void> {
    await mkdir(this.d.carpeta, { recursive: true });
    const escribir = this.d.escribir ?? ((d: string, b: Buffer) => escribirAtomico(d, b));
    await escribir(this.ruta(nombre), Buffer.from(JSON.stringify(datos, null, 2), 'utf8'));
  }

  private async coleccion(): Promise<PeticionHttp[]> {
    const j = (await this.leerJson('coleccion.json')) as Partial<ArchivoColeccion> | null;
    const r: PeticionHttp[] = [];
    for (const p of Array.isArray(j?.peticiones) ? j.peticiones : []) {
      try {
        r.push(peticionValida(p));
      } catch {
        // Una entrada dañada no tumba las demás.
      }
    }
    return r;
  }

  private async entornos(): Promise<{ activo: string | null; entornos: EntornoHttp[] }> {
    const j = (await this.leerJson('entornos.json')) as Partial<ArchivoEntornos> | null;
    const entornos: EntornoHttp[] = [];
    for (const e of Array.isArray(j?.entornos) ? j.entornos : []) {
      try {
        entornos.push(entornoValido(e));
      } catch {
        // idem
      }
    }
    const activo =
      typeof j?.activo === 'string' && entornos.some((e) => e.id === j.activo) ? j.activo : null;
    return { activo, entornos };
  }

  private async historial(): Promise<EntradaHistorialHttp[]> {
    const j = (await this.leerJson('historial.json')) as Partial<ArchivoHistorial> | null;
    const r: EntradaHistorialHttp[] = [];
    for (const e of Array.isArray(j?.entradas) ? j.entradas : []) {
      try {
        const x = e as Partial<EntradaHistorialHttp>;
        if (typeof x.id !== 'string' || typeof x.fecha !== 'string') continue;
        r.push({
          id: x.id,
          fecha: x.fecha,
          peticion: peticionValida(x.peticion),
          estado: typeof x.estado === 'number' ? x.estado : null,
          tiempoMs: typeof x.tiempoMs === 'number' ? x.tiempoMs : 0,
          tamano: typeof x.tamano === 'number' ? x.tamano : 0,
          ...(typeof x.error === 'string' ? { error: x.error.slice(0, 80) } : {}),
        });
      } catch {
        // idem
      }
    }
    return r.slice(0, MAX_HISTORIAL_HTTP);
  }

  async estado(): Promise<EstadoClienteHttp> {
    const [coleccion, e, historial] = await Promise.all([
      this.coleccion(),
      this.entornos(),
      this.historial(),
    ]);
    return { coleccion, historial, entornos: e.entornos, entornoActivo: e.activo };
  }

  // ---- Secretos ----

  private async guardarSecreto(
    ref: string,
    valor: string,
    tx: Transaccion,
    propias: ReadonlySet<string>,
  ): Promise<void> {
    if (propias.has(ref)) {
      // Se sobrescribe un secreto que ya existía: se recuerda el anterior por si algo falla.
      if (!tx.previos.has(ref)) {
        tx.previos.set(ref, await this.d.secretos.leer(ref).catch(() => null));
      }
    } else {
      tx.creadas.push(ref);
    }
    try {
      await this.d.secretos.guardar(ref, valor);
    } catch {
      throw new ErrorWolf(
        'clientehttp.secreto_no_guardado',
        'No se pudo guardar un valor secreto (formato no válido o cifrado del sistema no disponible).',
      );
    }
  }

  /** Deshace una operación a medias: borra lo creado y restaura lo sobrescrito. */
  private async deshacer(tx: Transaccion): Promise<void> {
    await Promise.all(tx.creadas.map((r) => this.d.secretos.borrar(r).catch(() => undefined)));
    for (const [ref, previo] of tx.previos) {
      if (previo !== null) await this.d.secretos.guardar(ref, previo).catch(() => undefined);
    }
  }

  /** Todas las refs que hoy pertenecen a algo guardado. */
  private async refsGuardadas(): Promise<Set<string>> {
    const [coleccion, e] = await Promise.all([this.coleccion(), this.entornos()]);
    return new Set([...coleccion.flatMap(refsDe), ...e.entornos.flatMap(refsDeEntorno)]);
  }

  /** Borra los secretos de `antes` que ya no pertenecen a nada guardado. */
  private async soltar(antes: string[]): Promise<void> {
    const vivas = await this.refsGuardadas();
    await Promise.all(
      [...new Set(antes)]
        .filter((r) => !vivas.has(r))
        .map((r) => this.d.secretos.borrar(r).catch(() => undefined)),
    );
  }

  /** Refs que ya son de la petición guardada con ese id (ninguna si no existe o no tiene id). */
  private async refsDeLaPeticion(id: string): Promise<Set<string>> {
    if (!id) return new Set();
    const x = (await this.coleccion()).find((p) => p.id === id);
    return new Set(x ? refsDe(x) : []);
  }

  /**
   * Mueve los valores secretos en línea al almacén; la petición solo conserva `ref`. Las refs que
   * no son de esta petición ya se descartaron (`sanearRefs`).
   */
  private async sellar(
    p: PeticionHttp,
    tx: Transaccion,
    propias: ReadonlySet<string>,
  ): Promise<PeticionHttp> {
    const par = async (x: ParHttp): Promise<ParHttp> => {
      const secreto =
        x.valor !== '' &&
        (x.ref !== undefined || (esNombreSecreto(x.clave) && !esSoloVariables(x.valor)));
      if (!secreto) {
        if (x.faltante && x.valor === '' && x.ref === undefined) return x;
        const { faltante: _f, ...resto } = x;
        void _f;
        return resto;
      }
      const ref = x.ref ?? refNueva();
      await this.guardarSecreto(ref, x.valor, tx, propias);
      return { clave: x.clave, valor: '', activo: x.activo, ref };
    };
    const pares = (l: ParHttp[]): Promise<ParHttp[]> => Promise.all(l.map(par));
    const a: AuthHttp = p.auth;
    let auth: AuthHttp = a;
    if (a.tipo !== 'ninguna' && a.valor !== undefined) {
      const ref = a.ref ?? refNueva();
      await this.guardarSecreto(ref, a.valor, tx, propias);
      const { valor: _v, ...resto } = a;
      void _v;
      auth = { ...resto, ref } as AuthHttp;
    }
    const c = p.cuerpo;
    return {
      ...p,
      params: await pares(p.params),
      cabeceras: await pares(p.cabeceras),
      cuerpo:
        c.tipo === 'form' || c.tipo === 'multipart' ? { ...c, campos: await pares(c.campos) } : c,
      auth,
    };
  }

  // ---- Colección ----

  async guardarPeticion(entrada: unknown): Promise<PeticionHttp> {
    const p = normalizar(peticionValida(entrada));
    if (/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*@/i.test(p.url)) {
      throw new ErrorWolf(
        'clientehttp.url_con_credenciales',
        'La URL no puede llevar usuario ni clave: use la pestaña de autenticación.',
      );
    }
    return this.serializar(async () => {
      const lista = await this.coleccion();
      const i = p.id ? lista.findIndex((x) => x.id === p.id) : -1;
      if (i < 0 && lista.length >= MAX_COLECCION_HTTP) {
        throw new ErrorWolf('clientehttp.limite', 'Se alcanzó el máximo de peticiones guardadas.');
      }
      // Solo se aceptan las refs que ya son de esta misma petición guardada.
      const propias = new Set(i >= 0 ? refsDe(lista[i]!) : []);
      const limpia = sanearRefs(p, propias);
      const tx = new Transaccion();
      let sellada: PeticionHttp;
      try {
        sellada = await this.sellar(limpia, tx, propias);
        sellada = { ...sellada, id: p.id || idNuevo(), nombre: p.nombre.trim() || nombreDe(p) };
        const antes = i >= 0 ? refsDe(lista[i]!) : [];
        const nueva = [...lista];
        if (i >= 0) nueva[i] = sellada;
        else nueva.push(sellada);
        await this.escribirJson('coleccion.json', { version: 1, peticiones: nueva });
        await this.soltar(antes);
      } catch (e) {
        await this.deshacer(tx);
        throw e;
      }
      return sellada;
    });
  }

  borrarPeticion(id: unknown): Promise<void> {
    const i = idValido(id);
    return this.serializar(async () => {
      const lista = await this.coleccion();
      const x = lista.find((p) => p.id === i);
      if (!x) return;
      await this.escribirJson('coleccion.json', {
        version: 1,
        peticiones: lista.filter((p) => p.id !== i),
      });
      await this.soltar(refsDe(x));
    });
  }

  // ---- Entornos ----

  async guardarEntorno(entrada: unknown): Promise<EntornoHttp> {
    const e = entornoValido(entrada);
    return this.serializar(async () => {
      const { activo, entornos } = await this.entornos();
      const i = e.id ? entornos.findIndex((x) => x.id === e.id) : -1;
      if (i < 0 && entornos.length >= MAX_ENTORNOS_HTTP) {
        throw new ErrorWolf('clientehttp.limite', 'Se alcanzó el máximo de entornos.');
      }
      // Solo se aceptan las refs que ya son de este mismo entorno guardado.
      const propias = new Set(i >= 0 ? refsDeEntorno(entornos[i]!) : []);
      const tx = new Transaccion();
      let guardado: EntornoHttp;
      try {
        const variables = await Promise.all(
          e.variables.map(async (v) => {
            const secreta = v.secreta || esNombreSecreto(v.nombre);
            if (!secreta) return { nombre: v.nombre, valor: v.valor, secreta: false };
            let ref = v.ref !== undefined && propias.has(v.ref) ? v.ref : undefined;
            if (v.valor !== '') {
              ref ??= refNueva();
              await this.guardarSecreto(ref, v.valor, tx, propias);
            }
            return { nombre: v.nombre, valor: '', secreta: true, ...(ref ? { ref } : {}) };
          }),
        );
        guardado = { id: e.id || idNuevo(), nombre: e.nombre, variables };
        const antes = i >= 0 ? refsDeEntorno(entornos[i]!) : [];
        const nuevos = [...entornos];
        if (i >= 0) nuevos[i] = guardado;
        else nuevos.push(guardado);
        await this.escribirJson('entornos.json', { version: 1, activo, entornos: nuevos });
        await this.soltar(antes);
      } catch (err) {
        await this.deshacer(tx);
        throw err;
      }
      return guardado;
    });
  }

  borrarEntorno(id: unknown): Promise<void> {
    const i = idValido(id);
    return this.serializar(async () => {
      const { activo, entornos } = await this.entornos();
      const x = entornos.find((e) => e.id === i);
      if (!x) return;
      await this.escribirJson('entornos.json', {
        version: 1,
        activo: activo === i ? null : activo,
        entornos: entornos.filter((e) => e.id !== i),
      });
      await this.soltar(refsDeEntorno(x));
    });
  }

  activarEntorno(id: unknown): Promise<void> {
    const i = id === null ? null : idValido(id);
    return this.serializar(async () => {
      const { entornos } = await this.entornos();
      if (i !== null && !entornos.some((e) => e.id === i)) {
        throw new ErrorWolf('clientehttp.no_existe', 'El entorno ya no existe.');
      }
      await this.escribirJson('entornos.json', { version: 1, activo: i, entornos });
    });
  }

  // ---- Historial ----

  limpiarHistorial(): Promise<void> {
    return this.serializar(() => this.escribirJson('historial.json', { version: 1, entradas: [] }));
  }

  /** Copia para el historial: sin ningún valor secreto (los sensibles quedan como `***`). */
  paraHistorial(entrada: PeticionHttp): PeticionHttp {
    const p = normalizar(entrada);
    const par = (x: ParHttp): ParHttp => {
      const secreto =
        x.ref !== undefined || (esNombreSecreto(x.clave) && !esSoloVariables(x.valor));
      return {
        clave: x.clave,
        valor: secreto ? (x.valor === '' && !x.ref ? '' : MASCARA) : enmascararSecretos(x.valor),
        activo: x.activo,
      };
    };
    const c = p.cuerpo;
    const a = p.auth;
    return {
      ...p,
      id: '',
      url: urlSinSecretos(p.url),
      params: p.params.map(par),
      cabeceras: p.cabeceras.map(par),
      cuerpo:
        c.tipo === 'form' || c.tipo === 'multipart'
          ? { tipo: c.tipo, campos: c.campos.map(par) }
          : c.tipo === 'json' || c.tipo === 'raw'
            ? { ...c, texto: enmascararSecretos(c.texto) }
            : c,
      auth: sinSecreto(a),
    };
  }

  private async registrar(
    p: PeticionHttp,
    r: { estado: number | null; tiempoMs: number; tamano: number; error?: string },
  ): Promise<void> {
    await this.serializar(async () => {
      const lista = await this.historial();
      lista.unshift({
        id: idNuevo(),
        fecha: (this.d.ahora?.() ?? new Date()).toISOString(),
        peticion: this.paraHistorial(p),
        ...r,
      });
      await this.escribirJson('historial.json', {
        version: 1,
        entradas: lista.slice(0, MAX_HISTORIAL_HTTP),
      });
    });
  }

  // ---- Envío ----

  /** Variables del entorno; las secretas con su valor o, sin credenciales, como `<secreto>`. */
  private async variables(
    entornoId: string | null,
    incluir: boolean,
  ): Promise<Map<string, string>> {
    const m = new Map<string, string>();
    if (entornoId === null) return m;
    const { entornos } = await this.entornos();
    const e = entornos.find((x) => x.id === entornoId);
    if (!e) throw new ErrorWolf('clientehttp.no_existe', 'El entorno ya no existe.');
    for (const v of e.variables) {
      if (!v.secreta) {
        m.set(v.nombre, v.valor);
      } else if (!incluir) {
        m.set(v.nombre, MARCA_SECRETO);
      } else {
        const s = v.ref ? await this.d.secretos.leer(v.ref).catch(() => null) : null;
        if (s === null) {
          throw new ErrorWolf('clientehttp.secreto_faltante', 'Falta un valor secreto.');
        }
        m.set(v.nombre, s);
      }
    }
    return m;
  }

  private entornoDe(v: unknown): string | null {
    return v === undefined || v === null || v === '' ? null : idValido(v, 'entorno');
  }

  async enviar(
    entrada: unknown,
    opciones: { entornoId?: unknown; idEnvio?: unknown } = {},
  ): Promise<RespuestaHttp> {
    const valida = peticionValida(entrada);
    const p = sanearRefs(valida, await this.refsDeLaPeticion(valida.id));
    const entorno = this.entornoDe(opciones.entornoId);
    const idEnvio = typeof opciones.idEnvio === 'string' ? opciones.idEnvio.slice(0, 64) : '';
    const resuelta = await componer(p, {
      variables: await this.variables(entorno, true),
      leerSecreto: (r) => this.d.secretos.leer(refValida(r)),
      incluirSecretos: true,
    });
    const wolf = await this.d.caWolf().catch(() => null);
    const dominios = wolf ? await this.d.dominiosWolf().catch(() => []) : [];
    if (wolf && this.raices?.ca !== wolf) this.raices = { ca: wolf, lista: raicesConCa(wolf) };
    const ctl = new AbortController();
    if (idEnvio) this.envios.set(idEnvio, ctl);
    const inicio = Date.now();
    try {
      const r = await ejecutar(resuelta, {
        senal: ctl.signal,
        caPara: (host) => (wolf && hostConCaWolf(host, dominios) ? this.raices?.lista : undefined),
      });
      await this.registrar(p, { estado: r.estado, tiempoMs: r.tiempoMs, tamano: r.tamano });
      return r;
    } catch (e) {
      await this.registrar(p, {
        estado: null,
        tiempoMs: Date.now() - inicio,
        tamano: 0,
        error: e instanceof ErrorWolf ? e.codigo : 'clientehttp.sin_conexion',
      }).catch(() => undefined);
      throw e;
    } finally {
      if (idEnvio) this.envios.delete(idEnvio);
    }
  }

  cancelar(idEnvio: unknown): void {
    if (typeof idEnvio === 'string') this.envios.get(idEnvio)?.abort();
  }

  // ---- Curl ----

  /** Comando curl; sin `incluirCredenciales`, los valores secretos salen como `<secreto>`. */
  async copiarComoCurl(
    entrada: unknown,
    entornoId: unknown,
    incluirCredenciales: unknown,
  ): Promise<string> {
    const valida = peticionValida(entrada);
    const p = sanearRefs(valida, await this.refsDeLaPeticion(valida.id));
    const incluir = incluirCredenciales === true;
    const resuelta = await componer(p, {
      variables: await this.variables(this.entornoDe(entornoId), incluir),
      leerSecreto: (r) => this.d.secretos.leer(refValida(r)),
      incluirSecretos: incluir,
    });
    return aCurl(resuelta);
  }

  /** Importa un curl: lo guarda en la colección (los secretos van al almacén) y lo devuelve. */
  async importarCurl(texto: unknown): Promise<{ peticion: PeticionHttp; avisos: AvisoCurl[] }> {
    if (typeof texto !== 'string') {
      throw new ErrorWolf('clientehttp.curl_invalido', 'El texto de curl no es válido.');
    }
    const r: ImportacionCurl = importarCurl(texto);
    const peticion = await this.guardarPeticion(r.peticion);
    const avisos =
      refsDe(peticion).length > 0
        ? [...r.avisos, { codigo: 'secretos_guardados' } as AvisoCurl]
        : r.avisos;
    return { peticion, avisos };
  }

  // ---- Mostrar ----

  /** El valor de un secreto de una petición o entorno guardados (el botón «Mostrar»). */
  async revelar(ref: unknown): Promise<string | null> {
    const r = refValida(ref);
    const { coleccion, entornos } = await this.estado().then((e) => ({
      coleccion: e.coleccion,
      entornos: e.entornos,
    }));
    const propio =
      coleccion.some((p) => refsDe(p).includes(r)) ||
      entornos.some((e) => refsDeEntorno(e).includes(r));
    if (!propio) return null;
    return this.d.secretos.leer(r);
  }
}

/** La autenticación sin su valor ni su referencia. */
function sinSecreto(a: AuthHttp): AuthHttp {
  if (a.tipo === 'ninguna') return a;
  const copia: Record<string, unknown> = { ...a };
  delete copia['valor'];
  delete copia['ref'];
  return copia as unknown as AuthHttp;
}

function nombreDe(p: PeticionHttp): string {
  try {
    const u = new URL(p.url.replace(/\{\{[^}]*\}\}/g, 'x'));
    return `${p.metodo} ${u.host}${u.pathname === '/' ? '' : u.pathname}`.slice(0, 120);
  } catch {
    return `${p.metodo} ${p.url}`.slice(0, 120);
  }
}
