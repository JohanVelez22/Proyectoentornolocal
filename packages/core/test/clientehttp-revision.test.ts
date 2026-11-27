import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClienteHttp, type PeticionHttp, type SecretosHttp } from '../src';
import { importarCurl } from '../src/clientehttp/curl';
import { esNombreSecreto } from '../src/clientehttp/sensibles';
import { emitirCertificado, generarCA } from '../src/https/ca';

// Correcciones de la revisión opus de D48. Todo contra 127.0.0.1 con puerto aleatorio; los
// valores son obviamente falsos.
const cerrar: (() => Promise<void>)[] = [];
let carpeta: string;
let almacen: Map<string, string>;
let cliente: ClienteHttp;
let caPem: string | null;
let dominios: string[];
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
  caPem = null;
  dominios = [];
  cliente = new ClienteHttp({
    carpeta,
    secretos,
    caWolf: async () => caPem,
    dominiosWolf: async () => dominios,
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

const textoDe = (r: { cuerpo: { tipo: string; texto?: string } }): string =>
  r.cuerpo.tipo === 'texto' ? (r.cuerpo.texto ?? '') : '';

describe('M2: una API key en la consulta no se ve en los saltos ni en la URL final', () => {
  it('sustituye el valor (también codificado) por *** en saltos y urlFinal', async () => {
    const puerto = await servidor((req, res) => {
      if (req.url!.startsWith('/a')) {
        res.writeHead(302, { location: '/b' + req.url!.slice(2) });
        res.end();
      } else eco(req, res);
    });
    const valor = 'clave falsa&=1';
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/a`, {
        auth: { tipo: 'apikey', nombre: 'k', en: 'query', valor },
      }),
    );
    const visto = JSON.stringify([r.saltos, r.urlFinal]);
    expect(visto).not.toContain('falsa');
    expect(visto).not.toContain(encodeURIComponent(valor));
    expect(r.saltos[0]!.url).toContain('***');
    expect(r.urlFinal).toContain('***');
  });
});

describe('M3: al cambiar de origen solo pasa una lista blanca de cabeceras', () => {
  it('X-Session y X-Auth no llegan al otro origen; sí Accept-Language y User-Agent', async () => {
    const destino = await servidor(eco);
    const origen = await servidor((_q, res) => {
      res.writeHead(307, { location: `http://127.0.0.1:${destino}/otro` });
      res.end();
    });
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${origen}/`, {
        metodo: 'POST',
        cabeceras: [
          { clave: 'X-Session', valor: 'S', activo: true },
          { clave: 'X-Auth', valor: 'A', activo: true },
          { clave: 'X-Normal', valor: 'N', activo: true },
          { clave: 'Accept-Language', valor: 'es', activo: true },
          { clave: 'Cache-Control', valor: 'no-cache', activo: true },
          { clave: 'User-Agent', valor: 'prueba', activo: true },
        ],
        cuerpo: { tipo: 'json', texto: '{"a":1}' },
      }),
    );
    const h = JSON.parse(textoDe(r)).cabeceras;
    expect(h['x-session']).toBeUndefined();
    expect(h['x-auth']).toBeUndefined();
    expect(h['x-normal']).toBeUndefined();
    expect(h['accept-language']).toBe('es');
    expect(h['cache-control']).toBe('no-cache');
    expect(h['user-agent']).toBe('prueba');
    expect(h['content-type']).toBe('application/json');
  });

  it('en el mismo origen se conservan todas', async () => {
    const puerto = await servidor((req, res) => {
      if (req.url === '/a') {
        res.writeHead(302, { location: '/b' });
        res.end();
      } else eco(req, res);
    });
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/a`, {
        cabeceras: [{ clave: 'X-Session', valor: 'S', activo: true }],
      }),
    );
    expect(JSON.parse(textoDe(r)).cabeceras['x-session']).toBe('S');
  });
});

describe('certificadoIgnorado solo es true si de verdad se ignoró en el host final', () => {
  it('en http o con un certificado válido es false aunque se pida ignorar', async () => {
    const puerto = await servidor(eco);
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/`, { ignorarCertificado: true }),
    );
    expect(r.certificadoIgnorado).toBe(false);
  });

  it('con https: true solo si el certificado no se pudo verificar', async () => {
    const ca = generarCA();
    const hoja = emitirCertificado(ca, ['localhost', '127.0.0.1']);
    const s = https.createServer({ key: hoja.keyPem, cert: hoja.certPem }, eco);
    await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
    cerrar.push(
      () =>
        new Promise<void>((r) => {
          s.closeAllConnections();
          s.close(() => r());
        }),
    );
    const puerto = (s.address() as AddressInfo).port;
    const ignorando = await cliente.enviar(
      peticion(`https://127.0.0.1:${puerto}/`, { ignorarCertificado: true }),
    );
    expect(ignorando.certificadoIgnorado).toBe(true);
    caPem = ca.certPem;
    dominios = ['localhost'];
    const verificado = await cliente.enviar(
      peticion(`https://localhost:${puerto}/`, { ignorarCertificado: true }),
    );
    expect(verificado.estado).toBe(200);
    expect(verificado.certificadoIgnorado).toBe(false);
  }, 60_000);
});

describe('el Content-Type del cuerpo raw no admite saltos de línea', () => {
  it('un {{variable}} con CR/LF en el tipo de contenido se rechaza', async () => {
    const puerto = await servidor(eco);
    const e = await cliente.guardarEntorno({
      id: '',
      nombre: 'e',
      variables: [{ nombre: 'v', valor: 'x\r\nInjected: 1', secreta: false }],
    });
    await expect(
      cliente.enviar(
        peticion(`http://127.0.0.1:${puerto}/`, {
          metodo: 'POST',
          cuerpo: { tipo: 'raw', texto: 'a', tipoContenido: 'text/plain{{v}}' },
        }),
        { entornoId: e.id },
      ),
    ).rejects.toMatchObject({ codigo: 'clientehttp.cabecera_invalida' });
  });
});

describe('M5: más nombres sensibles, también en el cuerpo JSON', () => {
  it('reconoce sesión, sid, auth, jwt, code, sig, signature y csrf, sin falsos obvios', () => {
    for (const n of [
      'session',
      'X-Session',
      'sessionId',
      'sid',
      'auth',
      'X-Auth',
      'jwt',
      'code',
      'authCode',
      'sig',
      'Signature',
      'X-CSRF-Token',
      'xsrf-header',
    ]) {
      expect(esNombreSecreto(n), n).toBe(true);
    }
    for (const n of ['Accept', 'codec', 'author', 'page', 'X-Request-Id', 'sidebar']) {
      expect(esNombreSecreto(n), n).toBe(false);
    }
  });

  it('el historial enmascara cabeceras, consulta y claves JSON con nombre de secreto', async () => {
    const puerto = await servidor(eco);
    const cuerpo = JSON.stringify({
      password: 'hunter2-falsa',
      ok: 'visible',
      nested: { session: 'SESION-falsa', lista: [{ jwt: 'JWT-falso', n: 1 }] },
    });
    await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/?code=OAUTHCODE-falso&sig=FIRMA-falsa&q=ver`, {
        metodo: 'POST',
        cabeceras: [{ clave: 'X-Session', valor: 'SESION-123-falsa', activo: true }],
        cuerpo: { tipo: 'json', texto: cuerpo },
      }),
    );
    const h = readFileSync(path.join(carpeta, 'historial.json'), 'utf8');
    for (const s of ['hunter2', 'SESION', 'OAUTHCODE', 'FIRMA', 'JWT-falso']) {
      expect(h, s).not.toContain(s);
    }
    expect(h).toContain('visible');
    expect(h).toContain('q');
  });

  it('copiar como curl sin credenciales también oculta esas claves del cuerpo y las cabeceras', async () => {
    const curl = await cliente.copiarComoCurl(
      peticion('http://h.test/', {
        metodo: 'POST',
        cabeceras: [{ clave: 'X-Session', valor: 'SESION-falsa', activo: true }],
        cuerpo: {
          tipo: 'json',
          texto: '{"token":"tok-falso","nombre":"Ana","a":{"csrf":"c-falso"}}',
        },
      }),
      null,
      false,
    );
    expect(curl).not.toContain('falso');
    expect(curl).toContain('Ana');
    expect(curl).toContain('<secreto>');
    // Con credenciales, el cuerpo sale tal cual.
    expect(
      await cliente.copiarComoCurl(
        peticion('http://h.test/', {
          metodo: 'POST',
          cuerpo: { tipo: 'json', texto: '{"token":"tok-falso"}' },
        }),
        null,
        true,
      ),
    ).toContain('tok-falso');
  });
});

describe('M8: tamaño del historial y de los archivos de datos', () => {
  it('recorta a 8 KB el cuerpo guardado en el historial', async () => {
    const puerto = await servidor(eco);
    await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/`, {
        metodo: 'POST',
        cuerpo: { tipo: 'raw', texto: 'x'.repeat(100_000), tipoContenido: 'text/plain' },
      }),
    );
    const [h] = (await cliente.estado()).historial;
    const c = h!.peticion.cuerpo;
    expect(c.tipo === 'raw' ? c.texto.length : -1).toBeLessThanOrEqual(8192);
    expect(readFileSync(path.join(carpeta, 'historial.json')).length).toBeLessThan(40_000);
  });

  it('ignora con aviso (y no lee) un archivo de datos de más de 20 MB', async () => {
    const avisos: string[] = [];
    const c = new ClienteHttp({
      carpeta,
      secretos,
      caWolf: async () => null,
      dominiosWolf: async () => [],
      avisar: (m) => avisos.push(m),
    });
    await c.guardarPeticion(peticion('http://h.test/', { nombre: 'uno' }));
    writeFileSync(path.join(carpeta, 'coleccion.json'), Buffer.alloc(21 * 1024 * 1024, 32));
    expect((await c.estado()).coleccion).toEqual([]);
    expect(avisos.some((m) => m.includes('coleccion.json'))).toBe(true);
  });
});

describe('M7: importador de curl', () => {
  const sinAvisos = (c: string): string[] => importarCurl(c).avisos.map((a) => a.codigo);

  it('separa las opciones cortas agrupadas', () => {
    const a = importarCurl('curl -sX POST https://h.test/a');
    expect(a.peticion.metodo).toBe('POST');
    expect(a.avisos).toEqual([]);
    expect(importarCurl('curl -sSL https://h.test/a').avisos).toEqual([]);
    expect(importarCurl('curl -sXPUT https://h.test/a').peticion.metodo).toBe('PUT');
    const b = importarCurl("curl -sH 'Accept: x/y' -sd 'a=1' https://h.test/a");
    expect(b.peticion.cabeceras[0]).toMatchObject({ clave: 'Accept', valor: 'x/y' });
    expect(b.peticion.metodo).toBe('POST');
    expect(importarCurl('curl -sIL https://h.test/a').peticion.metodo).toBe('HEAD');
  });

  it('una opción larga desconocida consume su valor si no parece una opción ni una URL', () => {
    const a = importarCurl('curl --raro valor https://h.test/x');
    expect(a.peticion.url).toBe('https://h.test/x');
    expect(a.avisos.map((x) => x.codigo)).toEqual(['opcion_ignorada']);
    // Si lo siguiente es una URL o una opción, no se consume.
    expect(importarCurl('curl --raro https://h.test/y').peticion.url).toBe('https://h.test/y');
    expect(importarCurl('curl --raro -H "A: b" https://h.test/z').peticion.cabeceras).toHaveLength(
      1,
    );
    expect(importarCurl('curl --raro=valor https://h.test/w').peticion.url).toBe(
      'https://h.test/w',
    );
    // Una opción sin valor conocida no consume nada.
    expect(importarCurl('curl --compressed https://h.test/v').peticion.url).toBe(
      'https://h.test/v',
    );
  });

  it('-G pasa los datos a la consulta y deja un GET', () => {
    const a = importarCurl('curl -G -d a=1 --data-urlencode "b=x y" https://h.test/p');
    expect(a.peticion.metodo).toBe('GET');
    expect(a.peticion.cuerpo).toEqual({ tipo: 'ninguno' });
    expect(a.peticion.url).toBe('https://h.test/p?a=1&b=x%20y');
    expect(importarCurl('curl --get -d c=3 "https://h.test/p?z=9"').peticion.url).toBe(
      'https://h.test/p?z=9&c=3',
    );
    expect(sinAvisos('curl -G -d a=1 https://h.test/p')).toEqual([]);
  });

  it('un -H con CR/LF avisa al importar y no entra', () => {
    const r = importarCurl("curl -H $'X: a\r\nY: b' https://h.test/");
    expect(r.peticion.cabeceras).toEqual([]);
    expect(r.avisos.map((a) => a.codigo)).toContain('cabecera_invalida');
  });
});
