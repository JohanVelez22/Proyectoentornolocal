import { describe, expect, it } from 'vitest';
import { CODIGOS_ERROR, ErrorWolf, esErrorWolf, PARAMETROS_ERROR } from '../src/errores';

describe('ErrorWolf', () => {
  it('conserva el mensaje en español, el código y los datos', () => {
    const e = new ErrorWolf('servicios.no_instalado', 'PHP no está instalado.', { nombre: 'PHP' });
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe('PHP no está instalado.');
    expect(e.codigo).toBe('servicios.no_instalado');
    expect(e.datos).toEqual({ nombre: 'PHP' });
    expect(esErrorWolf(e)).toBe(true);
    expect(esErrorWolf(new Error('x'))).toBe(false);
    expect(esErrorWolf({ codigo: 'git.sin_rama' })).toBe(false);
  });

  it('lista todos los códigos, con sus parámetros permitidos', () => {
    expect(CODIGOS_ERROR.length).toBeGreaterThan(20);
    expect(new Set(CODIGOS_ERROR).size).toBe(CODIGOS_ERROR.length);
    for (const c of CODIGOS_ERROR) expect(Array.isArray(PARAMETROS_ERROR[c])).toBe(true);
  });

  it('solo conserva los parámetros declarados para el código', () => {
    const e = new ErrorWolf('git.plazo', 'x', { minutos: 5 });
    expect(e.datos).toEqual({ minutos: 5 });
  });
});

describe('datosPermitidos', () => {
  it('deja pasar solo los parámetros declarados y de tipo simple', async () => {
    const { datosPermitidos } = await import('../src/errores');
    expect(
      datosPermitidos('servicios.puerto_asignado', {
        puerto: 80,
        otro: 'PHP',
        clave: 'CENTINELA',
        ruta: 'C:/x',
      }),
    ).toEqual({ puerto: 80, otro: 'PHP' });
    expect(datosPermitidos('git.cambios_locales', { clave: 'CENTINELA' })).toBeUndefined();
    expect(datosPermitidos('desconocido', { a: 1 })).toBeUndefined();
    expect(datosPermitidos('git.plazo', { minutos: 'x'.repeat(201) })).toBeUndefined();
    expect(datosPermitidos('git.plazo', { minutos: Number.NaN })).toBeUndefined();
  });
});

describe('errores del núcleo con código', () => {
  const codigoDe = (f: () => unknown): { codigo?: string; datos?: unknown; message: string } => {
    try {
      f();
    } catch (e) {
      return e as { codigo?: string; datos?: unknown; message: string };
    }
    throw new Error('no lanzó');
  };

  it('git: token y URL con credenciales', async () => {
    const { validarToken, validarUrlGit } = await import('../src/git/git');
    expect(codigoDe(() => validarToken('con espacio')).codigo).toBe('git.token_invalido');
    expect(codigoDe(() => validarUrlGit('https://u:p@github.com/a/b.git')).codigo).toBe(
      'git.url_con_credenciales',
    );
  });

  it('hosts y certificados', async () => {
    const { normalizarDominios } = await import('../src/hosts/bloque');
    const { validarDominiosLibres } = await import('../src/herramientas/certificadosLibres');
    expect(codigoDe(() => normalizarDominios(['no valido'])).codigo).toBe('hosts.dominio_invalido');
    expect(codigoDe(() => validarDominiosLibres([])).codigo).toBe('herramientas.sin_seleccion');
    expect(codigoDe(() => validarDominiosLibres(['a b'])).codigo).toBe(
      'herramientas.dominio_invalido',
    );
    const muchos = Array.from({ length: 500 }, (_, i) => `s${i}.test`);
    const r = codigoDe(() => validarDominiosLibres(muchos));
    expect(r.codigo).toBe('herramientas.demasiados_dominios');
    expect(r.datos).toEqual({ maximo: expect.any(Number) });
  });

  it('puerto ocupado: código, datos y mensaje en español', async () => {
    const { ErrorPuertoOcupado } = await import('../src/servicios/nginx');
    const e = new ErrorPuertoOcupado(80, 4, 'httpd', 8080);
    expect(e.codigo).toBe('servicios.puerto_ocupado');
    expect(e.datos).toEqual({ puerto: 80, pid: 4, nombre: 'httpd', alternativo: 8080 });
    expect(e.message).toContain('Use el puerto 8080');
    expect(new ErrorPuertoOcupado(80, 4, 'httpd').datos).not.toHaveProperty('alternativo');
  });
});
