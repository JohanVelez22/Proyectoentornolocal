import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClienteHttp, type PeticionHttp, type SecretosHttp } from '../src';

// Correcciones de la revisión opus de D48. Todo contra 127.0.0.1 con puerto aleatorio; los
// valores son obviamente falsos.
const cerrar: (() => Promise<void>)[] = [];
let carpeta: string;
let almacen: Map<string, string>;
let cliente: ClienteHttp;
let fallarEscritura: ((destino: string) => boolean) | null;

const secretos: SecretosHttp = {
  guardar: async (id, v) => void almacen.set(id, v),
  leer: async (id) => almacen.get(id) ?? null,
  borrar: async (id) => void almacen.delete(id),
};

async function servidor(fn: http.RequestListener): Promise<number> {
  const s = http.createServer(fn);
  await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
  cerrar.push(
    () =>
      new Promise<void>((r) => {
        s.closeAllConnections();
        s.close(() => r());
      }),
  );
  return (s.address() as AddressInfo).port;
}

/** Devuelve las cabeceras que recibió. */
const eco: http.RequestListener = (req, res) => {
  const t: Buffer[] = [];
  req.on('data', (d: Buffer) => t.push(d));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        cabeceras: req.headers,
        ruta: req.url,
        cuerpo: Buffer.concat(t).toString(),
      }),
    );
  });
};

const peticion = (url: string, extra: Partial<PeticionHttp> = {}): PeticionHttp => ({
  id: '',
  nombre: '',
  metodo: 'GET',
  url,
  params: [],
  cabeceras: [],
  cuerpo: { tipo: 'ninguno' },
  auth: { tipo: 'ninguna' },
  plazoSeg: 5,
  ignorarCertificado: false,
  ...extra,
});
const auth = (valor: string, clave = 'Authorization') => ({ clave, valor, activo: true });

beforeEach(() => {
  carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-clientehttp-rev-'));
  almacen = new Map();
  fallarEscritura = null;
  cliente = new ClienteHttp({
    carpeta,
    secretos,
    caWolf: async () => null,
    dominiosWolf: async () => [],
    escribir: async (destino, datos) => {
      if (fallarEscritura?.(destino)) throw new Error('disco lleno');
      writeFileSync(destino, datos);
    },
    avisar: () => undefined,
  });
});
afterEach(async () => {
  await Promise.all(cerrar.splice(0).map((c) => c()));
  rmSync(carpeta, { recursive: true, force: true });
});

const refDe = (p: PeticionHttp, i = 0): string | undefined => p.cabeceras[i]?.ref;

describe('I1: cada referencia http:<id> es de una sola petición o entorno', () => {
  it('A/B: guardar B con la ref de A no la comparte; borrar B no rompe A', async () => {
    const puerto = await servidor(eco);
    const u = `http://127.0.0.1:${puerto}/`;
    const A = await cliente.guardarPeticion(
      peticion(u, { nombre: 'A', cabeceras: [auth('Bearer SECRETO-A')] }),
    );
    const rA = refDe(A)!;
    const B = await cliente.guardarPeticion(
      peticion(u, {
        nombre: 'B',
        cabeceras: [{ clave: 'Authorization', valor: '', activo: true, ref: rA }],
      }),
    );
    expect(refDe(B)).toBeUndefined();
    expect(B.cabeceras[0]).toMatchObject({ faltante: true });
    await cliente.borrarPeticion(B.id);
    expect(almacen.get(rA)).toBe('Bearer SECRETO-A');
    const r = await cliente.enviar(A);
    expect(
      JSON.parse(r.cuerpo.tipo === 'texto' ? r.cuerpo.texto : '{}').cabeceras.authorization,
    ).toBe('Bearer SECRETO-A');
  });

  it('C/D: una ref ajena con valor nuevo no pisa el secreto de otra petición', async () => {
    const C = await cliente.guardarPeticion(
      peticion('http://h.test/', { cabeceras: [auth('Bearer SECRETO-C')] }),
    );
    const rC = refDe(C)!;
    const D = await cliente.guardarPeticion(
      peticion('http://h.test/d', {
        cabeceras: [{ clave: 'X-Nota', valor: 'pisado', activo: true, ref: rC }],
      }),
    );
    expect(almacen.get(rC)).toBe('Bearer SECRETO-C');
    // Sin la ref ajena, un nombre que no es secreto queda como valor normal.
    expect(D.cabeceras[0]).toMatchObject({ valor: 'pisado' });
    expect(refDe(D)).toBeUndefined();
  });

  it('una ref en una petición nueva sin id se descarta, también la de la autenticación', async () => {
    const A = await cliente.guardarPeticion(
      peticion('http://h.test/', { auth: { tipo: 'bearer', valor: 'TOKEN-A' } }),
    );
    const refAuth = (A.auth as { ref: string }).ref;
    const copia = await cliente.guardarPeticion({ ...A, id: '' });
    expect((copia.auth as { ref?: string }).ref).toBeUndefined();
    await cliente.borrarPeticion(copia.id);
    expect(almacen.get(refAuth)).toBe('TOKEN-A');
  });

  it('copiarComoCurl y enviar rechazan una ref ajena (no devuelven su valor)', async () => {
    const puerto = await servidor(eco);
    const A = await cliente.guardarPeticion(
      peticion(`http://127.0.0.1:${puerto}/`, { cabeceras: [auth('Bearer SECRETO-A')] }),
    );
    const robada = peticion(`http://127.0.0.1:${puerto}/`, {
      cabeceras: [{ clave: 'Authorization', valor: '', activo: true, ref: refDe(A)! }],
    });
    await expect(cliente.copiarComoCurl(robada, null, true)).rejects.toMatchObject({
      codigo: 'clientehttp.secreto_faltante',
    });
    await expect(cliente.enviar(robada)).rejects.toMatchObject({
      codigo: 'clientehttp.secreto_faltante',
    });
    // Con el id de otra petición tampoco vale.
    const otra = await cliente.guardarPeticion(peticion('http://h.test/otra'));
    await expect(
      cliente.copiarComoCurl({ ...robada, id: otra.id }, null, true),
    ).rejects.toMatchObject({
      codigo: 'clientehttp.secreto_faltante',
    });
    // La petición guardada con su propio id sí funciona.
    expect(await cliente.copiarComoCurl(A, null, true)).toContain('Bearer SECRETO-A');
  });

  it('entornos: una ref ajena no se reutiliza ni se pisa', async () => {
    const E1 = await cliente.guardarEntorno({
      id: '',
      nombre: 'uno',
      variables: [{ nombre: 'clave', valor: 'VALOR-E1', secreta: true }],
    });
    const r1 = E1.variables[0]!.ref!;
    const E2 = await cliente.guardarEntorno({
      id: '',
      nombre: 'dos',
      variables: [{ nombre: 'clave', valor: 'VALOR-E2', secreta: true, ref: r1 }],
    });
    expect(almacen.get(r1)).toBe('VALOR-E1');
    expect(E2.variables[0]!.ref).not.toBe(r1);
    expect(almacen.get(E2.variables[0]!.ref!)).toBe('VALOR-E2');
    // Sin valor: la variable queda sin secreto y enviar con ella falla.
    const E3 = await cliente.guardarEntorno({
      id: '',
      nombre: 'tres',
      variables: [{ nombre: 'clave', valor: '', secreta: true, ref: r1 }],
    });
    expect(E3.variables[0]!.ref).toBeUndefined();
    await cliente.borrarEntorno(E3.id);
    await cliente.borrarEntorno(E2.id);
    expect(almacen.get(r1)).toBe('VALOR-E1');
    // Una petición no puede usar la ref de una variable de entorno.
    const P = await cliente.guardarPeticion(
      peticion('http://h.test/', {
        cabeceras: [{ clave: 'X-Y', valor: '', activo: true, ref: r1 }],
      }),
    );
    expect(refDe(P)).toBeUndefined();
  });

  it('una fila con «falta el secreto» bloquea el envío hasta que se rellena', async () => {
    const puerto = await servidor(eco);
    const p = peticion(`http://127.0.0.1:${puerto}/`, {
      cabeceras: [{ clave: 'X-Nota', valor: '', activo: true, faltante: true }],
    });
    await expect(cliente.enviar(p)).rejects.toMatchObject({
      codigo: 'clientehttp.secreto_faltante',
    });
    p.cabeceras[0]!.valor = 'ya';
    await expect(cliente.enviar(p)).resolves.toMatchObject({ estado: 200 });
  });
});

describe('M1: un fallo de escritura no pierde secretos existentes', () => {
  it('al actualizar una petición, el secreto anterior se restaura y no se borra', async () => {
    const E = await cliente.guardarPeticion(
      peticion('http://h.test/', { auth: { tipo: 'bearer', valor: 'VIEJO' } }),
    );
    const rE = (E.auth as { ref: string }).ref;
    fallarEscritura = (d) => d.endsWith('coleccion.json');
    await expect(
      cliente.guardarPeticion({ ...E, auth: { tipo: 'bearer', ref: rE, valor: 'NUEVO' } }),
    ).rejects.toThrowError();
    expect(almacen.get(rE)).toBe('VIEJO');
  });

  it('al guardar una petición nueva que falla, no quedan secretos huérfanos', async () => {
    fallarEscritura = (d) => d.endsWith('coleccion.json');
    await expect(
      cliente.guardarPeticion(peticion('http://h.test/', { auth: { tipo: 'bearer', valor: 'X' } })),
    ).rejects.toThrowError();
    expect(almacen.size).toBe(0);
  });

  it('lo mismo con los entornos', async () => {
    const E = await cliente.guardarEntorno({
      id: '',
      nombre: 'e',
      variables: [{ nombre: 'clave', valor: 'VIEJO', secreta: true }],
    });
    const ref = E.variables[0]!.ref!;
    fallarEscritura = (d) => d.endsWith('entornos.json');
    await expect(
      cliente.guardarEntorno({
        ...E,
        variables: [{ nombre: 'clave', valor: 'NUEVO', secreta: true, ref }],
      }),
    ).rejects.toThrowError();
    expect(almacen.get(ref)).toBe('VIEJO');
  });
});

void mkdirSync;
void readFileSync;
