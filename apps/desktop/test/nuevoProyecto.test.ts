import { TIPOS_GENERADOR } from '@pel/core';
import { describe, expect, it } from 'vitest';
import { textos } from '../src/renderer/i18n';
import {
  accionDeError,
  aPedido,
  formularioInicial,
  nombreBaseDe,
  opcionesBase,
  ordenarRamas,
  ramasPython,
  resumen,
  sePuedeOmitirPaso,
  sitioNuevo,
  TIPOS_PROYECTO,
  validarPedido,
  type FormProyecto,
} from '../src/renderer/utilidades/nuevoProyecto';

const t = textos.nuevoProyecto.errores;

const form = (extra: Partial<FormProyecto> = {}): FormProyecto => ({
  ...formularioInicial('laravel'),
  nombre: 'tienda',
  carpetaPadre: 'C:\\Proyectos',
  php: '8.4',
  objetivoBd: 'mysql@8.4',
  nombreBase: 'tienda',
  ...extra,
});

describe('tipos de proyecto', () => {
  it('son los mismos que los generadores del núcleo, en el mismo orden', () => {
    expect(TIPOS_PROYECTO.map((x) => x.id)).toEqual([...TIPOS_GENERADOR]);
  });
});

describe('validarPedido', () => {
  it('un pedido completo no tiene errores', () => {
    expect(validarPedido(form(), t)).toBeNull();
  });
  it('nombre vacío', () => {
    expect(validarPedido(form({ nombre: '' }), t)).toBe(t.nombreVacio);
    expect(validarPedido(form({ nombre: '   ' }), t)).toBe(t.nombreVacio);
  });
  it('mayúsculas, espacios y guiones mal puestos', () => {
    for (const n of ['Tienda', 'mi tienda', '-tienda', 'tienda-', 'a--b', 'con', 'ñandú']) {
      expect(validarPedido(form({ nombre: n }), t), n).toBe(t.nombreInvalido);
    }
    expect(validarPedido(form({ nombre: 'a'.repeat(41) }), t)).toBe(t.nombreInvalido);
  });
  it('sin carpeta padre elegida en el diálogo', () => {
    expect(validarPedido(form({ carpetaPadre: null }), t)).toBe(t.sinCarpeta);
  });
  it('base marcada pero sin instancia ni motor', () => {
    expect(validarPedido(form({ objetivoBd: null }), t)).toBe(t.sinInstancia);
  });
  it('nombre de base inválido según el motor', () => {
    expect(validarPedido(form({ nombreBase: '' }), t)).toBe(t.baseInvalida);
    expect(validarPedido(form({ nombreBase: 'a-b' }), t)).toBe(t.baseInvalida);
    expect(validarPedido(form({ objetivoBd: 'postgresql@17', nombreBase: 'Tienda' }), t)).toBe(
      t.baseInvalida,
    );
  });
  it('sin base no se piden instancia ni nombre', () => {
    expect(validarPedido(form({ conBase: false, objetivoBd: null, nombreBase: '' }), t)).toBeNull();
  });
  it('FastAPI exige Python y los de PHP exigen PHP', () => {
    expect(validarPedido(form({ php: null }), t)).toBe(t.sinPhp);
    const f = { ...formularioInicial('fastapi'), nombre: 'api', carpetaPadre: 'C:\\P' };
    expect(validarPedido({ ...f, objetivoBd: 'postgresql@17', nombreBase: 'api' }, t)).toBe(
      t.sinPython,
    );
    expect(
      validarPedido({ ...f, python: '3.13', objetivoBd: 'postgresql@17', nombreBase: 'api' }, t),
    ).toBeNull();
  });
  it('WordPress sin la casilla de huella débil', () => {
    const wp = {
      ...formularioInicial('wordpress'),
      nombre: 'blog',
      carpetaPadre: 'C:\\P',
      php: '8.4',
      objetivoBd: 'mysql@8.4',
      nombreBase: 'blog',
    };
    expect(validarPedido(wp, t)).toBe(t.huellaDebil);
    expect(validarPedido({ ...wp, confirmarHuellaDebil: true }, t)).toBeNull();
  });
  it('WordPress solo con MySQL o MariaDB y pgvector solo con PostgreSQL', () => {
    const wp = {
      ...formularioInicial('wordpress'),
      nombre: 'blog',
      carpetaPadre: 'C:\\P',
      php: '8.4',
      confirmarHuellaDebil: true,
      nombreBase: 'blog',
    };
    expect(validarPedido({ ...wp, objetivoBd: 'postgresql@17' }, t)).toBe(t.motorNoVale);
    const api = {
      ...formularioInicial('fastapi'),
      nombre: 'api',
      carpetaPadre: 'C:\\P',
      python: '3.13',
      nombreBase: 'api',
      pgvector: true,
    };
    expect(validarPedido({ ...api, objetivoBd: 'mysql@8.4' }, t)).toBe(t.pgvectorMotor);
    expect(validarPedido({ ...api, objetivoBd: 'postgresql@17' }, t)).toBeNull();
  });
  it('el estático no usa base aunque la casilla venga marcada', () => {
    const e = { ...formularioInicial('estatico'), nombre: 'web', carpetaPadre: 'C:\\P' };
    expect(validarPedido({ ...e, conBase: true, objetivoBd: null }, t)).toBeNull();
  });
});

describe('aPedido', () => {
  it('manda la carpeta padre y el nombre, nunca una carpeta final', () => {
    const p = aPedido(form());
    expect(p).toMatchObject({
      tipo: 'laravel',
      nombre: 'tienda',
      carpetaPadre: 'C:\\Proyectos',
      php: '8.4',
      base: { instancia: 'mysql@8.4', nombre: 'tienda' },
    });
    expect('carpeta' in p).toBe(false);
  });
  it('un motor sin instancias configuradas va como motor', () => {
    expect(aPedido(form({ objetivoBd: 'postgresql' })).base).toEqual({
      instancia: null,
      motor: 'postgresql',
      nombre: 'tienda',
    });
  });
  it('sin base, el estático y las opciones propias de cada tipo', () => {
    expect(aPedido(form({ conBase: false })).base).toBeNull();
    const e = aPedido({ ...formularioInicial('estatico'), nombre: 'web', carpetaPadre: 'C:\\P' });
    expect(e.base).toBeNull();
    expect('php' in e).toBe(false);
    expect(aPedido(form({ starterKit: 'vue' })).opciones).toEqual({ starterKit: 'vue' });
    // El starter kit de otro tipo no viaja (el núcleo lo rechazaría).
    expect(aPedido(form({ tipo: 'symfony', starterKit: 'vue' })).opciones).toEqual({});
    expect(aPedido(form({ tipo: 'symfony', symfonyWebapp: true })).opciones).toEqual({
      symfonyWebapp: true,
    });
  });
  it('la confirmación de huella débil solo viaja en WordPress y como true', () => {
    expect(aPedido(form({ confirmarHuellaDebil: true })).opciones).toEqual({});
    const wp = aPedido(
      form({ tipo: 'wordpress', confirmarHuellaDebil: true, objetivoBd: 'mysql@8.4' }),
    );
    expect(wp.opciones).toEqual({ confirmarHuellaDebil: true });
    expect(aPedido(form({ tipo: 'wordpress', confirmarHuellaDebil: false })).opciones).toEqual({});
  });
  it('FastAPI manda Python y pgvector', () => {
    const p = aPedido({
      ...formularioInicial('fastapi'),
      nombre: 'api',
      carpetaPadre: 'C:\\P',
      python: '3.13',
      objetivoBd: 'postgresql@17',
      nombreBase: 'api',
      pgvector: true,
    });
    expect(p).toMatchObject({ python: '3.13', opciones: { pgvector: true } });
    expect('php' in p).toBe(false);
  });
});

describe('resumen', () => {
  const claves = (f: FormProyecto): string[] => resumen(f).map((l) => l.clave);

  it('lista sitio, dominio, base y .env', () => {
    const r = resumen(form());
    expect(r.find((l) => l.clave === 'carpeta')?.valor).toBe('C:\\Proyectos\\tienda');
    expect(r.find((l) => l.clave === 'dominio')?.valor).toBe('tienda.test');
    expect(r.find((l) => l.clave === 'base')?.valor).toContain('tienda');
    expect(claves(form())).toEqual(expect.arrayContaining(['sitio', 'dominio', 'base', 'env']));
  });
  it('sin base no hay base ni .env con conexión; el estático tampoco', () => {
    expect(claves(form({ conBase: false }))).not.toContain('base');
    const e = { ...formularioInicial('estatico'), nombre: 'web', carpetaPadre: 'C:\\P' };
    expect(claves(e)).not.toContain('base');
    expect(claves(e)).not.toContain('env');
  });
  it('WordPress dice wp-config.php en lugar de .env', () => {
    const wp = {
      ...formularioInicial('wordpress'),
      nombre: 'blog',
      carpetaPadre: 'C:\\P',
      php: '8.4',
      objetivoBd: 'mysql@8.4',
      nombreBase: 'blog',
    };
    const r = resumen(wp).find((l) => l.clave === 'env');
    expect(r?.valor).toContain('wp-config.php');
  });
  it('normaliza la barra final de la carpeta padre', () => {
    const r = resumen(form({ carpetaPadre: 'C:\\Proyectos\\' }));
    expect(r.find((l) => l.clave === 'carpeta')?.valor).toBe('C:\\Proyectos\\tienda');
  });
});

describe('opcionesBase', () => {
  const servicios = [
    {
      id: 'mysql',
      nombre: 'MySQL',
      instancias: [
        { id: 'mysql@8.4', clave: '8.4', puerto: 3306, predeterminada: true, estado: 'encendido' },
        { id: 'mysql@8.0', clave: '8.0', puerto: 3308, predeterminada: false, estado: 'apagado' },
      ],
    },
    { id: 'mariadb', nombre: 'MariaDB', instancias: [] },
    { id: 'postgresql', nombre: 'PostgreSQL', instancias: undefined },
    { id: 'mongodb', nombre: 'MongoDB', instancias: [] },
  ] as never;

  it('filtra los motores por tipo y marca las instancias apagadas', () => {
    const o = opcionesBase('laravel', false, servicios);
    expect(o.map((x) => x.value)).toEqual(['mysql@8.4', 'mysql@8.0', 'mariadb', 'postgresql']);
    expect(o.find((x) => x.value === 'mysql@8.0')?.apagada).toBe(true);
    expect(o[0]?.predeterminada).toBe(true);
  });
  it('WordPress solo MySQL y MariaDB; pgvector solo PostgreSQL; estático nada', () => {
    expect(opcionesBase('wordpress', false, servicios).map((x) => x.value)).toEqual([
      'mysql@8.4',
      'mysql@8.0',
      'mariadb',
    ]);
    expect(opcionesBase('fastapi', true, servicios).map((x) => x.value)).toEqual(['postgresql']);
    expect(opcionesBase('estatico', false, servicios)).toEqual([]);
  });
});

describe('nombreBaseDe', () => {
  it('pasa los guiones a guiones bajos', () => {
    expect(nombreBaseDe('mi-tienda-web')).toBe('mi_tienda_web');
    expect(nombreBaseDe('tienda')).toBe('tienda');
  });
});

describe('errores con acción', () => {
  it('cada error de carpeta, base y paso lleva la acción que corresponde', () => {
    expect(accionDeError('proyectos.carpeta_no_vacia')).toBe('cambiarCarpeta');
    expect(accionDeError('proyectos.carpeta_de_otro_sitio')).toBe('cambiarCarpeta');
    expect(accionDeError('proyectos.carpeta_invalida')).toBe('cambiarCarpeta');
    expect(accionDeError('proyectos.base_existe')).toBe('cambiarBase');
    expect(accionDeError('proyectos.nombre_invalido')).toBe('cambiarNombre');
    expect(accionDeError('proyectos.dominio_existe')).toBe('cambiarNombre');
    expect(accionDeError('proyectos.paso_base_no_omitible')).toBe('reintentarPaso');
    expect(accionDeError('proyectos.sin_php')).toBe('servicios');
    expect(accionDeError('proyectos.php_no_instalado')).toBe('servicios');
    expect(accionDeError('proyectos.python_no_instalado')).toBe('servicios');
    expect(accionDeError('proyectos.sin_python')).toBe('servicios');
    expect(accionDeError('catalogo.huella_debil')).toBe('confirmarHuella');
  });
  it('un código desconocido o ausente no trae acción', () => {
    expect(accionDeError('otra.cosa')).toBeNull();
    expect(accionDeError(undefined)).toBeNull();
  });
  it('la base de un proyecto nuevo no se ofrece para omitir', () => {
    const paso = (tipo: string, args?: Record<string, unknown>) =>
      ({
        id: tipo,
        tipo,
        titulo: '',
        estado: 'error',
        log: [],
        ...(args ? { args } : {}),
      }) as never;
    expect(sePuedeOmitirPaso(paso('bd-crear', { nueva: true }))).toBe(false);
    expect(sePuedeOmitirPaso(paso('migrar'))).toBe(true);
    expect(sePuedeOmitirPaso(paso('sitio-crear'))).toBe(false);
  });
});

describe('sitioNuevo', () => {
  it('es la primera receta que no estaba antes de crear', () => {
    expect(sitioNuevo(['a', 'b'], ['a', 'b', 'c'])).toBe('c');
    expect(sitioNuevo(['a'], ['a'])).toBeNull();
    expect(sitioNuevo([], [])).toBeNull();
  });
});

describe('versiones', () => {
  it('ordena las ramas de PHP de más nueva a más vieja', () => {
    expect(ordenarRamas(['8.2', '8.4', '7.4', '8.10'])).toEqual(['8.10', '8.4', '8.2', '7.4']);
  });
  it('Python: de versiones completas a ramas sin repetir', () => {
    expect(ramasPython(['3.12.7', '3.13.1', '3.13.0', 'raro'])).toEqual(['3.13', '3.12']);
  });
});
