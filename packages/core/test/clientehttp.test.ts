import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ClienteHttp, type PeticionHttp, type SecretosHttp } from '../src';
import { componer, normalizar } from '../src/clientehttp/componer';
import { aCurl, importarCurl, tokenizar } from '../src/clientehttp/curl';
import { ejecutar, hostConCaWolf } from '../src/clientehttp/red';
import { esNombreSecreto, urlSinSecretos } from '../src/clientehttp/sensibles';
import { sustituir } from '../src/clientehttp/variables';
import { emitirCertificado, generarCA } from '../src/https/ca';

// Todo contra servidores de 127.0.0.1 con puerto aleatorio; nada sale a internet. Los secretos de
// estas pruebas son obviamente falsos.
const FALSO = 'http-prueba-falsa-0000';

let carpeta: string;
let almacen: Map<string, string>;
let cliente: ClienteHttp;
let caPem: string | null;
let dominios: string[];
const cerrar: (() => Promise<void>)[] = [];

const secretos: SecretosHttp = {
  guardar: async (id, v) => {
    almacen.set(id, v);
  },
  leer: async (id) => almacen.get(id) ?? null,
  borrar: async (id) => {
    almacen.delete(id);
  },
};

function escuchar(servidor: http.Server | https.Server): Promise<number> {
  return new Promise((ok) => {
    servidor.listen(0, '127.0.0.1', () => {
      cerrar.push(
        () =>
          new Promise<void>((r) => {
            servidor.closeAllConnections();
            servidor.close(() => r());
          }),
      );
      ok((servidor.address() as AddressInfo).port);
    });
  });
}

/** Eco: devuelve método, ruta, cabeceras y cuerpo en JSON. */
const eco: http.RequestListener = (req, res) => {
  const trozos: Buffer[] = [];
  req.on('data', (d: Buffer) => trozos.push(d));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        metodo: req.method,
        ruta: req.url,
        cabeceras: req.headers,
        cuerpo: Buffer.concat(trozos).toString('utf8'),
      }),
    );
  });
};

async function servidorHttp(fn: http.RequestListener = eco): Promise<number> {
  return escuchar(http.createServer(fn));
}

function peticion(url: string, extra: Partial<PeticionHttp> = {}): PeticionHttp {
  return {
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
  };
}

const textoDe = (r: { cuerpo: { tipo: string; texto?: string } }): string =>
  r.cuerpo.tipo === 'texto' ? (r.cuerpo.texto ?? '') : '';
const ecoDe = (r: Parameters<typeof textoDe>[0]) =>
  JSON.parse(textoDe(r)) as {
    metodo: string;
    ruta: string;
    cabeceras: Record<string, string>;
    cuerpo: string;
  };

beforeEach(() => {
  carpeta = mkdtempSync(path.join(os.tmpdir(), 'pel-clientehttp-'));
  almacen = new Map();
  caPem = null;
  dominios = [];
  cliente = new ClienteHttp({
    carpeta,
    secretos,
    caWolf: async () => caPem,
    dominiosWolf: async () => dominios,
  });
});
afterEach(async () => {
  await Promise.all(cerrar.splice(0).map((c) => c()));
  rmSync(carpeta, { recursive: true, force: true });
});

/** Todo lo que el cliente dejó escrito en su carpeta, como un solo texto. */
function todoEnDisco(): string {
  return readdirSync(carpeta)
    .map((f) => readFileSync(path.join(carpeta, f), 'utf8'))
    .join('\n');
}

describe('variables {{…}}', () => {
  it('sustituye en texto literal, una sola pasada y sin evaluar nada', () => {
    const v = new Map([
      ['host', 'api.test'],
      ['raro', '{{host}} ${1+1} $(x)'],
    ]);
    expect(sustituir('https://{{host}}/x', v)).toBe('https://api.test/x');
    expect(sustituir('{{ raro }}', v)).toBe('{{host}} ${1+1} $(x)');
  });
  it('una variable sin definir es un error claro con su nombre', () => {
    expect(() => sustituir('{{falta}}', new Map())).toThrowError(/falta/);
    try {
      sustituir('{{falta}}', new Map());
    } catch (e) {
      expect((e as { codigo: string }).codigo).toBe('clientehttp.variable_sin_definir');
      expect((e as { datos: unknown }).datos).toEqual({ nombre: 'falta' });
    }
  });
});

describe('nombres secretos y URL', () => {
  it('reconoce cabeceras y nombres de secreto', () => {
    for (const n of [
      'Authorization',
      'cookie',
      'Proxy-Authorization',
      'X-Api-Key',
      'x-auth-token',
      'password',
      'client_secret',
    ]) {
      expect(esNombreSecreto(n), n).toBe(true);
    }
    for (const n of ['Accept', 'Content-Type', 'page', 'q'])
      expect(esNombreSecreto(n), n).toBe(false);
  });
  it('urlSinSecretos quita credenciales y enmascara claves de la consulta', () => {
    expect(urlSinSecretos('https://u:p@h.test/a?token=abc&q=1')).toBe(
      'https://***@h.test/a?token=***&q=1',
    );
  });
  it('normalizar pasa la consulta de la URL a params y quita el fragmento', () => {
    const p = normalizar(peticion('http://h.test/a?x=1%202&token=zzz#frag'));
    expect(p.url).toBe('http://h.test/a');
    expect(p.params.map((x) => [x.clave, x.valor])).toEqual([
      ['x', '1 2'],
      ['token', 'zzz'],
    ]);
  });
});

describe('importar curl (entrada no confiable)', () => {
  it("tokeniza comillas, $'…', continuaciones y no evalúa nada", () => {
    const t = tokenizar("curl -H 'A: b c' -d \"x\\\"y\" $'a\\nb' \\\n  http://h.test");
    expect(t.tokens).toEqual(['curl', '-H', 'A: b c', '-d', 'x"y', 'a\nb', 'http://h.test']);
    expect(tokenizar('curl http://h.test/$(rm -rf x)').sinEvaluar).toBe(true);
    expect(tokenizar('curl http://h.test/`id`').sinEvaluar).toBe(true);
  });
  it('un operador sin comillas termina el comando y se avisa', () => {
    const r = importarCurl('curl http://h.test | sh -c "cosa"; rm -rf /');
    expect(r.peticion.url).toBe('http://h.test');
    expect(r.avisos.map((a) => a.codigo)).toContain('comando_cortado');
  });
  it('reconoce -X, -H, -d, -u, --url y el resto se ignora con aviso', () => {
    const r = importarCurl(
      `curl -X PUT --url http://h.test/a -H 'Accept: x/y' -H 'Content-Type: application/json' ` +
        `-d '{"a":1}' -u usuario:${FALSO} --raro -L -k -o salida.txt`,
    );
    const p = r.peticion;
    expect(p.metodo).toBe('PUT');
    expect(p.url).toBe('http://h.test/a');
    expect(p.cuerpo).toEqual({ tipo: 'json', texto: '{"a":1}' });
    expect(p.cabeceras.map((c) => c.clave)).toEqual(['Accept']);
    expect(p.auth).toEqual({ tipo: 'basic', usuario: 'usuario', valor: FALSO });
    expect(p.ignorarCertificado).toBe(false);
    const codigos = r.avisos.map((a) => `${a.codigo}:${a.dato ?? ''}`);
    expect(codigos).toContain('opcion_ignorada:--raro');
    expect(codigos).toContain('opcion_ignorada:-o');
    expect(codigos).toContain('inseguro_ignorado:');
  });
  it('Authorization: Bearer pasa a la autenticación; -d con @archivo no lee nada', () => {
    const r = importarCurl(
      `curl http://h.test -H 'Authorization: Bearer ${FALSO}' -d @secreto.txt`,
    );
    expect(r.peticion.auth).toEqual({ tipo: 'bearer', valor: FALSO });
    expect(r.peticion.cabeceras).toEqual([]);
    expect(r.peticion.cuerpo).toEqual({ tipo: 'ninguno' });
    expect(r.avisos.map((a) => a.codigo)).toContain('archivo_ignorado');
  });
  it('un -d sin tipo es un formulario y -F un multipart de texto', () => {
    expect(importarCurl("curl http://h.test -d 'a=1&b=x+y'").peticion.cuerpo).toEqual({
      tipo: 'form',
      campos: [
        { clave: 'a', valor: '1', activo: true },
        { clave: 'b', valor: 'x y', activo: true },
      ],
    });
    const m = importarCurl("curl http://h.test -F 'a=1' -F 'f=@/etc/passwd'");
    expect(m.peticion.cuerpo).toEqual({
      tipo: 'multipart',
      campos: [{ clave: 'a', valor: '1', activo: true }],
    });
    expect(m.avisos.map((a) => a.codigo)).toContain('archivo_ignorado');
  });
  it('rechaza lo que no es curl, sin URL, sin cerrar comillas o demasiado grande', () => {
    expect(() => importarCurl('wget http://h.test')).toThrowError();
    expect(() => importarCurl('curl -X GET')).toThrowError();
    expect(() => importarCurl("curl 'http://h.test")).toThrowError();
    expect(() => importarCurl(`curl http://h.test/${'a'.repeat(70_000)}`)).toThrowError();
  });
});

describe('colecciones, entornos e historial: nunca guardan valores secretos', () => {
  it('guarda una petición con Authorization, token en la consulta y autenticación solo por referencia', async () => {
    const g = await cliente.guardarPeticion(
      peticion('http://h.test/a?api_key=' + FALSO, {
        nombre: 'prueba',
        cabeceras: [
          { clave: 'Authorization', valor: 'Bearer ' + FALSO, activo: true },
          { clave: 'Accept', valor: 'text/plain', activo: true },
        ],
        auth: { tipo: 'apikey', nombre: 'X-Clave', en: 'cabecera', valor: FALSO + '-2' },
      }),
    );
    expect(todoEnDisco()).not.toContain(FALSO);
    expect(g.cabeceras[0]).toMatchObject({ clave: 'Authorization', valor: '' });
    expect(g.cabeceras[0]!.ref).toMatch(/^http:[a-f0-9]{16}$/);
    expect(g.params[0]!.ref).toBeDefined();
    expect(g.cabeceras[1]).toMatchObject({ valor: 'text/plain' });
    expect(g.auth).not.toHaveProperty('valor');
    expect([...almacen.values()].sort()).toEqual(['Bearer ' + FALSO, FALSO, FALSO + '-2'].sort());
    // «Mostrar» devuelve el valor de una referencia propia y nada de lo ajeno.
    expect(await cliente.revelar(g.cabeceras[0]!.ref)).toBe('Bearer ' + FALSO);
    expect(await cliente.revelar('http:0000000000000000')).toBeNull();
  });
  it('un Authorization que solo usa {{variables}} no es un secreto literal', async () => {
    const g = await cliente.guardarPeticion(
      peticion('http://h.test', {
        cabeceras: [{ clave: 'Authorization', valor: 'Bearer {{token}}', activo: true }],
      }),
    );
    expect(g.cabeceras[0]).toEqual({
      clave: 'Authorization',
      valor: 'Bearer {{token}}',
      activo: true,
    });
    expect(almacen.size).toBe(0);
  });
  it('borrar la petición o cambiar su secreto suelta los secretos huérfanos', async () => {
    const g = await cliente.guardarPeticion(
      peticion('http://h.test', { auth: { tipo: 'bearer', valor: FALSO } }),
    );
    expect(almacen.size).toBe(1);
    const sin = await cliente.guardarPeticion({ ...g, auth: { tipo: 'ninguna' } });
    expect(almacen.size).toBe(0);
    await cliente.guardarPeticion(
      peticion('http://h.test', { id: sin.id, auth: { tipo: 'bearer', valor: FALSO } }),
    );
    await cliente.borrarPeticion(sin.id);
    expect(almacen.size).toBe(0);
  });
  it('rechaza una URL con usuario y clave', async () => {
    await expect(cliente.guardarPeticion(peticion('http://u:p@h.test/'))).rejects.toMatchObject({
      codigo: 'clientehttp.url_con_credenciales',
    });
  });
  it('un fallo al guardar un secreto no deja otros a medias', async () => {
    const roto = new ClienteHttp({
      carpeta,
      secretos: {
        ...secretos,
        guardar: async () => {
          throw new Error('safeStorage');
        },
      },
      caWolf: async () => null,
      dominiosWolf: async () => [],
    });
    await expect(
      roto.guardarPeticion(peticion('http://h.test', { auth: { tipo: 'bearer', valor: FALSO } })),
    ).rejects.toMatchObject({ codigo: 'clientehttp.secreto_no_guardado' });
    expect((await roto.estado()).coleccion).toEqual([]);
  });
  it('variables secretas (o con nombre de secreto) van al almacén; las demás quedan visibles', async () => {
    const e = await cliente.guardarEntorno({
      id: '',
      nombre: 'local',
      variables: [
        { nombre: 'host', valor: 'h.test', secreta: false },
        { nombre: 'clave', valor: FALSO, secreta: true },
        { nombre: 'api_token', valor: FALSO + '-3', secreta: false },
      ],
    });
    expect(todoEnDisco()).not.toContain(FALSO);
    expect(e.variables.map((v) => [v.nombre, v.secreta, v.valor])).toEqual([
      ['host', false, 'h.test'],
      ['clave', true, ''],
      ['api_token', true, ''],
    ]);
    await cliente.borrarEntorno(e.id);
    expect(almacen.size).toBe(0);
  });
  it('el historial guarda las últimas 100, con las cabeceras sensibles enmascaradas y sin autenticación', async () => {
    const puerto = await servidorHttp();
    const p = peticion(`http://127.0.0.1:${puerto}/x?token=${FALSO}`, {
      cabeceras: [
        { clave: 'Authorization', valor: 'Bearer ' + FALSO, activo: true },
        { clave: 'Cookie', valor: 'sid=' + FALSO, activo: true },
        { clave: 'X-Api-Key', valor: FALSO, activo: true },
        { clave: 'X-Otro', valor: 'visible', activo: true },
      ],
      auth: { tipo: 'basic', usuario: 'yo', valor: FALSO },
    });
    await cliente.enviar(p);
    const [h] = (await cliente.estado()).historial;
    expect(h!.estado).toBe(200);
    expect(todoEnDisco()).not.toContain(FALSO);
    expect(h!.peticion.cabeceras.map((c) => c.valor)).toEqual(['***', '***', '***', 'visible']);
    expect(h!.peticion.params[0]).toMatchObject({ clave: 'token', valor: '***' });
    expect(h!.peticion.auth).toEqual({ tipo: 'basic', usuario: 'yo' });
    for (let i = 0; i < 104; i++) await cliente.enviar(peticion(`http://127.0.0.1:${puerto}/${i}`));
    const lista = (await cliente.estado()).historial;
    expect(lista).toHaveLength(100);
    expect(lista[0]!.peticion.url).toContain('/103');
    await cliente.limpiarHistorial();
    expect((await cliente.estado()).historial).toEqual([]);
  }, 30_000);
  it('importar curl guarda la petición y los secretos solo en el almacén', async () => {
    const r = await cliente.importarCurl(
      `curl http://h.test/a -u yo:${FALSO} -H 'Cookie: s=${FALSO}2'`,
    );
    expect(todoEnDisco()).not.toContain(FALSO);
    expect(r.peticion.id).toMatch(/^[a-f0-9]{16}$/);
    expect(r.avisos.map((a) => a.codigo)).toContain('secretos_guardados');
    expect(almacen.size).toBe(2);
  });
  it('un archivo dañado se lee como vacío en vez de romper', async () => {
    const { writeFileSync } = await import('node:fs');
    await cliente.guardarPeticion(peticion('http://h.test'));
    writeFileSync(path.join(carpeta, 'coleccion.json'), '{ no es json');
    expect((await cliente.estado()).coleccion).toEqual([]);
  });
});

describe('copiar como curl', () => {
  const conSecretos = async (): Promise<PeticionHttp> =>
    cliente.guardarPeticion(
      peticion('http://h.test/a', {
        metodo: 'POST',
        cabeceras: [{ clave: 'Authorization', valor: 'Bearer ' + FALSO, activo: true }],
        cuerpo: { tipo: 'json', texto: '{"a":1}' },
        auth: { tipo: 'apikey', nombre: 'k', en: 'query', valor: FALSO + '-q' },
      }),
    );
  it('sin credenciales los secretos salen como <secreto>', async () => {
    const g = await conSecretos();
    const c = await cliente.copiarComoCurl(g, null, false);
    expect(c).not.toContain(FALSO);
    expect(c).toContain('<secreto>');
    expect(c).toContain('-X POST');
    expect(c).toContain('--data-raw \'{"a":1}\'');
  });
  it('con «incluir credenciales» salen los valores', async () => {
    const g = await conSecretos();
    const c = await cliente.copiarComoCurl(g, null, true);
    expect(c).toContain(FALSO + '-q');
    expect(c).toContain('Bearer ' + FALSO);
  });
  it('el curl copiado se puede importar de vuelta', async () => {
    const g = await conSecretos();
    const c = await cliente.copiarComoCurl(g, null, true);
    const r = importarCurl(c);
    expect(r.peticion.metodo).toBe('POST');
    expect(r.peticion.cuerpo).toEqual({ tipo: 'json', texto: '{"a":1}' });
  });
  it('las variables secretas del entorno no salen sin credenciales', async () => {
    const e = await cliente.guardarEntorno({
      id: '',
      nombre: 'e',
      variables: [{ nombre: 'clave', valor: FALSO, secreta: true }],
    });
    const p = peticion('http://h.test/{{clave}}');
    expect(await cliente.copiarComoCurl(p, e.id, false)).toContain('<secreto>');
    expect(await cliente.copiarComoCurl(p, e.id, true)).toContain(FALSO);
  });
});

describe('envío (servidor local)', () => {
  it('compone el cuerpo, los parámetros y la autenticación en el proceso principal', async () => {
    const puerto = await servidorHttp();
    const url = `http://127.0.0.1:${puerto}/ruta?a=1`;
    const e = await cliente.guardarEntorno({
      id: '',
      nombre: 'e',
      variables: [
        { nombre: 'ruta', valor: 'ruta', secreta: false },
        { nombre: 'clave', valor: FALSO, secreta: true },
      ],
    });
    const r = await cliente.enviar(
      peticion(url.replace('/ruta', '/{{ruta}}'), {
        metodo: 'POST',
        params: [
          { clave: 'b', valor: 'x y', activo: true },
          { clave: 'off', valor: '1', activo: false },
        ],
        cabeceras: [{ clave: 'X-Clave', valor: '{{clave}}', activo: true }],
        cuerpo: { tipo: 'json', texto: '{"n":1}' },
        auth: { tipo: 'bearer', valor: FALSO },
      }),
      { entornoId: e.id },
    );
    const x = ecoDe(r);
    expect(r.estado).toBe(200);
    expect(x.metodo).toBe('POST');
    expect(x.ruta).toBe('/ruta?a=1&b=x%20y');
    expect(x.cabeceras['authorization']).toBe('Bearer ' + FALSO);
    expect(x.cabeceras['x-clave']).toBe(FALSO);
    expect(x.cabeceras['content-type']).toBe('application/json');
    expect(x.cuerpo).toBe('{"n":1}');
    expect(r.cuerpo).toMatchObject({ tipo: 'texto' });
    expect(r.cuerpo.tipo === 'texto' && r.cuerpo.json).toContain('\n  "metodo"');
    expect(r.tamano).toBeGreaterThan(10);
    expect(r.tiempoMs).toBeGreaterThanOrEqual(0);
    expect(r.cabeceras.some(([k]) => k.toLowerCase() === 'content-type')).toBe(true);
    // El valor de una variable secreta nunca va a disco.
    expect(todoEnDisco()).not.toContain(FALSO);
  });
  it('Basic y API key en la consulta; form y multipart de texto', async () => {
    const puerto = await servidorHttp();
    const base = `http://127.0.0.1:${puerto}/`;
    const b = ecoDe(
      await cliente.enviar(
        peticion(base, { auth: { tipo: 'basic', usuario: 'yo', valor: 'clave falsa' } }),
      ),
    );
    expect(b.cabeceras['authorization']).toBe(
      'Basic ' + Buffer.from('yo:clave falsa').toString('base64'),
    );
    const k = ecoDe(
      await cliente.enviar(
        peticion(base, { auth: { tipo: 'apikey', nombre: 'k', en: 'query', valor: FALSO } }),
      ),
    );
    expect(k.ruta).toBe('/?k=' + FALSO);
    const f = ecoDe(
      await cliente.enviar(
        peticion(base, {
          metodo: 'POST',
          cuerpo: { tipo: 'form', campos: [{ clave: 'a b', valor: 'ñ&=', activo: true }] },
        }),
      ),
    );
    expect(f.cabeceras['content-type']).toBe('application/x-www-form-urlencoded');
    expect(f.cuerpo).toBe('a%20b=%C3%B1%26%3D');
    const m = ecoDe(
      await cliente.enviar(
        peticion(base, {
          metodo: 'PUT',
          cuerpo: { tipo: 'multipart', campos: [{ clave: 'campo', valor: 'hola', activo: true }] },
        }),
      ),
    );
    expect(m.cabeceras['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    expect(m.cuerpo).toContain('name="campo"\r\n\r\nhola');
  });
  it('no sigue cookies ni usa proxy: cada petición sale limpia', async () => {
    const puerto = await servidorHttp((req, res) => {
      res.setHeader('set-cookie', 'sid=1');
      eco(req, res);
    });
    const base = `http://127.0.0.1:${puerto}/`;
    await cliente.enviar(peticion(base));
    expect(ecoDe(await cliente.enviar(peticion(base))).cabeceras['cookie']).toBeUndefined();
  });
  it('variable sin definir: error y no se envía nada', async () => {
    let llegadas = 0;
    const puerto = await servidorHttp((req, res) => {
      llegadas++;
      eco(req, res);
    });
    await expect(
      cliente.enviar(peticion(`http://127.0.0.1:${puerto}/{{x}}`)),
    ).rejects.toMatchObject({
      codigo: 'clientehttp.variable_sin_definir',
    });
    expect(llegadas).toBe(0);
  });
  it('rechaza protocolos que no son http(s), usuario en la URL y cabeceras con saltos de línea', async () => {
    await expect(cliente.enviar(peticion('file:///etc/passwd'))).rejects.toMatchObject({
      codigo: 'clientehttp.protocolo',
    });
    await expect(cliente.enviar(peticion('ftp://h.test/'))).rejects.toMatchObject({
      codigo: 'clientehttp.protocolo',
    });
    await expect(cliente.enviar(peticion('http://u:p@127.0.0.1/'))).rejects.toMatchObject({
      codigo: 'clientehttp.url_con_credenciales',
    });
    await expect(
      cliente.enviar(
        peticion('http://127.0.0.1/', {
          cabeceras: [{ clave: 'X', valor: 'a\r\nb: c', activo: true }],
        }),
      ),
    ).rejects.toMatchObject({ codigo: 'clientehttp.cabecera_invalida' });
    await expect(cliente.enviar(peticion('no es url'))).rejects.toMatchObject({
      codigo: 'clientehttp.url_invalida',
    });
  });
  it('un servidor que no escucha da un error con código', async () => {
    const puerto = await servidorHttp();
    await cerrar.pop()!();
    await expect(cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.sin_conexion',
      datos: { motivo: 'ECONNREFUSED' },
    });
    expect((await cliente.estado()).historial[0]).toMatchObject({
      estado: null,
      error: 'clientehttp.sin_conexion',
    });
  });
  it('plazo: corta si el servidor no responde', async () => {
    const puerto = await servidorHttp(() => undefined);
    await expect(
      cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`, { plazoSeg: 1 })),
    ).rejects.toMatchObject({ codigo: 'clientehttp.plazo', datos: { segundos: 1 } });
  }, 10_000);
  it('se puede cancelar un envío en curso', async () => {
    const puerto = await servidorHttp(() => undefined);
    const e = cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`, { plazoSeg: 30 }), {
      idEnvio: 'uno',
    });
    setTimeout(() => cliente.cancelar('uno'), 100);
    await expect(e).rejects.toMatchObject({ codigo: 'clientehttp.cancelado' });
  });
  it('una respuesta binaria no se muestra; HEAD no trae cuerpo', async () => {
    const puerto = await servidorHttp((req, res) => {
      res.setHeader('content-type', 'image/png');
      res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2]));
    });
    const r = await cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`));
    expect(r.cuerpo).toEqual({ tipo: 'binario' });
    expect(r.tamano).toBe(7);
    expect(r.tipoContenido).toBe('image/png');
    const h = await cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`, { metodo: 'HEAD' }));
    expect(h.tamano).toBe(0);
  });
  it('un HTML llega como texto plano (nunca se interpreta)', async () => {
    const puerto = await servidorHttp((_q, res) => {
      res.setHeader('content-type', 'text/html');
      res.end('<script>alert(1)</script>');
    });
    const r = await cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`));
    expect(r.cuerpo).toEqual({ tipo: 'texto', texto: '<script>alert(1)</script>', json: null });
  });
});

describe('tope de la respuesta', () => {
  it('corta y marca como truncada la que pasa del tope', async () => {
    const puerto = await servidorHttp((_q, res) => {
      res.setHeader('content-type', 'text/plain');
      res.end('x'.repeat(5000));
    });
    const c = await componer(peticion(`http://127.0.0.1:${puerto}/`), {
      variables: new Map(),
      leerSecreto: async () => null,
      incluirSecretos: true,
    });
    const r = await ejecutar(c, { maxCuerpo: 1000 });
    expect(r.truncada).toBe(true);
    expect(r.tamano).toBe(1000);
    expect(textoDe(r)).toHaveLength(1000);
  });
});

describe('redirecciones manuales', () => {
  it('cada salto queda visible; en el mismo origen se conservan Authorization y Cookie', async () => {
    const puerto = await servidorHttp((req, res) => {
      if (req.url === '/a') {
        res.statusCode = 302;
        res.setHeader('location', '/b?token=' + FALSO);
        res.end();
      } else eco(req, res);
    });
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${puerto}/a`, {
        cabeceras: [{ clave: 'Cookie', valor: 'a=1', activo: true }],
        auth: { tipo: 'bearer', valor: FALSO },
      }),
    );
    expect(r.saltos).toHaveLength(1);
    expect(r.saltos[0]).toMatchObject({ estado: 302 });
    // La clave de la consulta no se muestra en los saltos.
    expect(JSON.stringify(r.saltos)).not.toContain(FALSO);
    expect(r.urlFinal).toContain('token=***');
    const x = ecoDe(r);
    expect(x.cabeceras['authorization']).toBe('Bearer ' + FALSO);
    expect(x.cabeceras['cookie']).toBe('a=1');
  });
  it('al cambiar de origen se quitan Authorization, Cookie y las cabeceras de credenciales', async () => {
    const destino = await servidorHttp();
    const origen = await servidorHttp((_q, res) => {
      res.statusCode = 307;
      res.setHeader('location', `http://127.0.0.1:${destino}/otro`);
      res.end();
    });
    const r = await cliente.enviar(
      peticion(`http://127.0.0.1:${origen}/`, {
        metodo: 'POST',
        cabeceras: [
          { clave: 'Cookie', valor: 'a=1', activo: true },
          { clave: 'X-Api-Key', valor: FALSO, activo: true },
          { clave: 'X-Normal', valor: 'ok', activo: true },
        ],
        cuerpo: { tipo: 'json', texto: '{"a":1}' },
        auth: { tipo: 'bearer', valor: FALSO },
      }),
    );
    const x = ecoDe(r);
    expect(x.ruta).toBe('/otro');
    expect(x.metodo).toBe('POST');
    expect(x.cuerpo).toBe('{"a":1}');
    expect(x.cabeceras['authorization']).toBeUndefined();
    expect(x.cabeceras['cookie']).toBeUndefined();
    expect(x.cabeceras['x-api-key']).toBeUndefined();
    expect(x.cabeceras['x-normal']).toBe('ok');
  });
  it('303 convierte POST en GET sin cuerpo', async () => {
    const puerto = await servidorHttp((req, res) => {
      if (req.url === '/p') {
        res.statusCode = 303;
        res.setHeader('location', '/g');
        res.end();
      } else eco(req, res);
    });
    const x = ecoDe(
      await cliente.enviar(
        peticion(`http://127.0.0.1:${puerto}/p`, {
          metodo: 'POST',
          cuerpo: { tipo: 'json', texto: '{}' },
        }),
      ),
    );
    expect(x.metodo).toBe('GET');
    expect(x.cuerpo).toBe('');
  });
  it('más de 10 redirecciones es un error', async () => {
    const puerto = await servidorHttp((_q, res) => {
      res.statusCode = 302;
      res.setHeader('location', '/otra');
      res.end();
    });
    await expect(cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.demasiadas_redirecciones',
      datos: { max: 10 },
    });
  });
  it('una redirección a un protocolo ajeno se rechaza', async () => {
    const puerto = await servidorHttp((_q, res) => {
      res.statusCode = 302;
      res.setHeader('location', 'file:///etc/passwd');
      res.end();
    });
    await expect(cliente.enviar(peticion(`http://127.0.0.1:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.protocolo',
    });
  });
});

describe('TLS: verificado siempre; CA de WolfCore solo para .test y sitios', () => {
  let ca: { certPem: string; keyPem: string };
  let puerto: number;
  beforeAll(() => {
    ca = generarCA();
  }, 60_000);
  beforeEach(async () => {
    const hoja = emitirCertificado(ca, ['localhost', '127.0.0.1']);
    puerto = await escuchar(https.createServer({ key: hoja.keyPem, cert: hoja.certPem }, eco));
  });
  afterAll(() => undefined);

  it('hostConCaWolf: *.test y los dominios de sitios, nada más', () => {
    expect(hostConCaWolf('api.mi.test', [])).toBe(true);
    expect(hostConCaWolf('TEST', [])).toBe(true);
    expect(hostConCaWolf('example.com', [])).toBe(false);
    expect(hostConCaWolf('evil-test', [])).toBe(false);
    expect(hostConCaWolf('sitio.local', ['sitio.local'])).toBe(true);
  });
  it('sin la CA de WolfCore el certificado no se acepta', async () => {
    await expect(cliente.enviar(peticion(`https://localhost:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.certificado',
    });
  });
  it('con la CA y el dominio de un sitio de WolfCore se acepta', async () => {
    caPem = ca.certPem;
    dominios = ['localhost'];
    const r = await cliente.enviar(peticion(`https://localhost:${puerto}/`));
    expect(r.estado).toBe(200);
    expect(r.caWolf).toBe(true);
    expect(r.certificadoIgnorado).toBe(false);
  });
  it('la CA no vale para un host que no es .test ni un sitio', async () => {
    caPem = ca.certPem;
    dominios = ['localhost'];
    await expect(cliente.enviar(peticion(`https://127.0.0.1:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.certificado',
    });
  });
  it('«ignorar errores de certificado» solo vale para esa petición', async () => {
    const r = await cliente.enviar(
      peticion(`https://127.0.0.1:${puerto}/`, { ignorarCertificado: true }),
    );
    expect(r.estado).toBe(200);
    expect(r.certificadoIgnorado).toBe(true);
    // La siguiente, sin la opción, vuelve a verificar.
    await expect(cliente.enviar(peticion(`https://127.0.0.1:${puerto}/`))).rejects.toMatchObject({
      codigo: 'clientehttp.certificado',
    });
    expect(process.env['NODE_TLS_REJECT_UNAUTHORIZED']).toBeUndefined();
  });
  it('aCurl no incluye -k', () => {
    expect(
      aCurl({
        metodo: 'GET',
        url: 'https://h.test/',
        cabeceras: [],
        cuerpo: { tipo: 'ninguno' },
        plazoMs: 1000,
        ignorarCertificado: true,
        secretos: [],
      }),
    ).toBe("curl 'https://h.test/'");
  });
});
