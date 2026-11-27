import { afterEach, describe, expect, it } from 'vitest';
import { api } from '../src/renderer/api';
import { fr } from '../src/renderer/i18n/fr';
import { traducirError } from '../src/renderer/utilidades/errores';
import { ErrorIpc, rechazoDe, rehidratar } from '../src/shared/errorIpc';

// Contrato del puente de errores (I4): el preload rechaza con un objeto plano que sobrevive al clon
// estructurado (lo que hace contextBridge) y la ventana lo vuelve a convertir en un Error con código.

describe('errores a través del puente', () => {
  const rechazo = rechazoDe({
    mensaje: 'Los archivos .env se gestionan desde las variables del proyecto.',
    codigo: 'editor.archivo_env',
    datos: { sitio: 'sitio-1' },
  });

  it('la forma del rechazo sobrevive a structuredClone con su código y sus datos', () => {
    const clon = structuredClone(rechazo);
    expect(clon).toEqual(rechazo);
    expect(clon.codigo).toBe('editor.archivo_env');
    expect(clon.datos).toEqual({ sitio: 'sitio-1' });
  });

  it('la rehidratación devuelve un ErrorIpc (instanceof Error) con código y datos', () => {
    const e = rehidratar(structuredClone(rechazo));
    expect(e).toBeInstanceOf(ErrorIpc);
    expect(e).toBeInstanceOf(Error);
    const x = e as ErrorIpc;
    expect(x.codigo).toBe('editor.archivo_env');
    expect(x.datos).toEqual({ sitio: 'sitio-1' });
    expect(x.message).toBe(rechazo.mensaje);
  });

  it('un error sin código ni datos también cruza, y lo que no es un rechazo se deja tal cual', () => {
    const e = rehidratar(structuredClone(rechazoDe({ mensaje: 'x' }))) as ErrorIpc;
    expect(e.codigo).toBeUndefined();
    expect(e.datos).toBeUndefined();
    const otro = new Error('otro');
    expect(rehidratar(otro)).toBe(otro);
    expect(rehidratar('texto')).toBe('texto');
    expect(rehidratar(null)).toBeNull();
  });

  it('un error con código llega traducido a francés', () => {
    const e = rehidratar(rechazo) as ErrorIpc;
    const texto = traducirError(e, { errores: fr.errores } as never);
    expect(texto).toBe(fr.errores.codigos['editor.archivo_env']);
    expect(texto).toMatch(/\.env/);
    expect(texto).not.toBe(rechazo.mensaje);
  });
});

describe('api() rehidrata en un solo punto', () => {
  const g = globalThis as unknown as { window?: unknown };
  const previo = g.window;
  afterEach(() => {
    g.window = previo;
  });

  it('las promesas que rechazan con el objeto plano rechazan con ErrorIpc, en cualquier espacio', async () => {
    const plano = structuredClone(rechazoDe({ mensaje: 'fallo', codigo: 'disco.sin_analisis' }));
    g.window = {
      entorno: {
        limpiezaDisco: { limpiar: () => Promise.reject(plano), cancelar: () => Promise.resolve(5) },
        suscribir: (cb: () => void) => cb,
      },
    };
    const entorno = api() as unknown as {
      limpiezaDisco: { limpiar: () => Promise<unknown>; cancelar: () => Promise<number> };
      suscribir: (cb: () => void) => () => void;
    };
    const e = await entorno.limpiezaDisco.limpiar().catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ErrorIpc);
    expect((e as ErrorIpc).codigo).toBe('disco.sin_analisis');
    // Lo que sale bien y lo que no es una promesa pasan sin tocarse.
    expect(await entorno.limpiezaDisco.cancelar()).toBe(5);
    const cb = (): void => undefined;
    expect(entorno.suscribir(cb)).toBe(cb);
  });
});
