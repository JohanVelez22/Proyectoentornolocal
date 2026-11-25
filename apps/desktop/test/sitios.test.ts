import { describe, expect, it } from 'vitest';
import type { DatosSitio, EstadoHttps, Sitio } from '../src/shared/api';
import {
  armarDominio,
  baseDominio,
  datosParaDuplicar,
  derivarEstadoSitio,
  elegirPhp,
  estadoHttpsSitio,
  falloHostsDe,
  filtrarSitios,
  limpiarDatos,
  motivoTunelBloqueado,
  confirmacionDeTunel,
  tunelConfirmadoDe,
  usaCloudflared,
  nombreDeCarpeta,
  normalizarAlias,
  ordenarSitios,
  redirigirHabilitado,
  confirmacionTunel,
  sitioVacio,
  urlHttps,
  urlLocal,
  validarFormularioSitio,
} from '../src/renderer/utilidades/sitios';
import { bloqueEnvCorreo } from '../src/renderer/utilidades/correo';

const sitio = (o: Partial<Sitio> = {}): Sitio => ({
  id: 'wolf',
  nombre: 'WolfCore',
  dominio: 'wolfcore.test',
  alias: [],
  carpeta: 'C:\\Proyectos\\WolfCore System',
  tipo: 'laravel',
  php: '8.4',
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: 'APP_URL',
  datosReales: false,
  https: false,
  redirigirHttps: false,
  confiado: false,
  git: null,
  procesos: [],
  runtimes: {},
  nota: '',
  ...o,
});

const datos = (o: Partial<DatosSitio> = {}): DatosSitio => {
  const { id: _id, ...resto } = sitio(o);
  void _id;
  return resto;
};

describe('derivarEstadoSitio', () => {
  it('en línea solo con Nginx encendido y todos los dominios en hosts', () => {
    expect(derivarEstadoSitio(sitio(), 'encendido', [])).toEqual({
      punto: 'encendido',
      etiqueta: 'En línea',
      faltanEnHosts: [],
    });
  });

  it('un alias pendiente en hosts marca el sitio con aviso', () => {
    const r = derivarEstadoSitio(sitio({ alias: ['api.wolfcore.test'] }), 'encendido', [
      'otro.test',
      'api.wolfcore.test',
    ]);
    expect(r.punto).toBe('aviso');
    expect(r.etiqueta).toBe('Falta en hosts');
    expect(r.faltanEnHosts).toEqual(['api.wolfcore.test']);
  });

  it('refleja el estado de Nginx y sigue informando los dominios pendientes', () => {
    expect(derivarEstadoSitio(sitio(), undefined, []).punto).toBe('apagado');
    expect(derivarEstadoSitio(sitio(), 'apagado', ['wolfcore.test'])).toMatchObject({
      punto: 'apagado',
      etiqueta: 'Nginx apagado',
      faltanEnHosts: ['wolfcore.test'],
    });
    expect(derivarEstadoSitio(sitio(), 'iniciando', []).punto).toBe('iniciando');
    expect(derivarEstadoSitio(sitio(), 'error', []).etiqueta).toBe('Error en Nginx');
    expect(derivarEstadoSitio(sitio(), 'externo', []).punto).toBe('externo');
  });
});

describe('motivoTunelBloqueado', () => {
  it('pide encender Nginx o instalar cloudflared antes de abrir', () => {
    expect(
      motivoTunelBloqueado({ nginx: 'apagado', cloudflaredInstalado: true, tunel: 'apagado' }),
    ).toBe('Encienda Nginx primero');
    expect(
      motivoTunelBloqueado({ nginx: 'encendido', cloudflaredInstalado: false, tunel: 'apagado' }),
    ).toBe('Instale cloudflared en Servicios');
    expect(
      motivoTunelBloqueado({ nginx: 'encendido', cloudflaredInstalado: true, tunel: 'apagado' }),
    ).toBeNull();
  });

  it('mientras no se sabe si cloudflared está instalado no se bloquea', () => {
    expect(
      motivoTunelBloqueado({
        nginx: 'encendido',
        cloudflaredInstalado: undefined,
        tunel: 'apagado',
      }),
    ).toBeNull();
  });

  it('reintentar un túnel con error también exige Nginx encendido y cloudflared', () => {
    expect(
      motivoTunelBloqueado({ nginx: 'apagado', cloudflaredInstalado: true, tunel: 'error' }),
    ).toBe('Encienda Nginx primero');
    expect(
      motivoTunelBloqueado({ nginx: 'encendido', cloudflaredInstalado: false, tunel: 'error' }),
    ).toBe('Instale cloudflared en Servicios');
    expect(
      motivoTunelBloqueado({ nginx: 'encendido', cloudflaredInstalado: true, tunel: 'error' }),
    ).toBeNull();
  });

  it('un túnel activo o abriéndose siempre se puede cerrar', () => {
    for (const tunel of ['activo', 'iniciando'] as const) {
      expect(motivoTunelBloqueado({ nginx: 'apagado', cloudflaredInstalado: false, tunel })).toBe(
        null,
      );
    }
  });
});

describe('confirmacionTunel (abrir y renovar)', () => {
  it('todo túnel pide confirmación; con datos reales, el aviso fuerte', () => {
    expect(confirmacionTunel(sitio({ datosReales: true }))).toBe('reales');
    expect(confirmacionTunel(sitio({ datosReales: false }))).toBe('publico');
    expect(confirmacionTunel(undefined)).toBe('publico');
  });
});

describe('validarFormularioSitio', () => {
  it('acepta un sitio correcto', () => {
    expect(validarFormularioSitio(datos(), [])).toEqual({});
  });

  it('usa los mismos mensajes que el núcleo', () => {
    expect(validarFormularioSitio(datos({ dominio: 'wolfcore.local' }), []).dominio).toBe(
      'El dominio debe terminar en .test',
    );
    expect(validarFormularioSitio(datos({ dominio: '.test' }), []).dominio).toBe(
      'El dominio debe terminar en .test',
    );
    expect(validarFormularioSitio(datos({ alias: ['wolfcore.test'] }), []).alias).toBe(
      'El alias wolfcore.test es igual al dominio del sitio',
    );
    expect(validarFormularioSitio(datos({ alias: ['a.test', 'a.test'] }), []).alias).toBe(
      'El alias a.test está repetido',
    );
    expect(validarFormularioSitio(datos({ php: null }), []).php).toBe(
      'Seleccione una versión de PHP para este sitio',
    );
    expect(validarFormularioSitio(datos({ tipo: 'proxy', php: null }), []).puertoProxy).toBe(
      'Un sitio proxy necesita un puerto',
    );
  });

  it('tipos nuevos: CI4 y WordPress piden PHP; FastAPI y Node, un puerto', () => {
    for (const tipo of ['codeigniter4', 'wordpress'] as const) {
      expect(validarFormularioSitio(datos({ tipo, php: null }), []).php).toBeDefined();
      expect(validarFormularioSitio(datos({ tipo }), [])).toEqual({});
    }
    for (const tipo of ['fastapi', 'node'] as const) {
      expect(validarFormularioSitio(datos({ tipo, php: null }), []).puertoProxy).toBeDefined();
      expect(validarFormularioSitio(datos({ tipo, puertoProxy: 8001 }), [])).toEqual({});
      const proceso = {
        id: 'dev',
        nombre: 'Dev',
        comando: ['npm', 'run', 'dev'],
        cwd: 'raiz',
        autoIniciar: true,
        reiniciar: false,
        puerto: 5173,
        proxy: false,
      };
      expect(validarFormularioSitio(datos({ tipo, procesos: [proceso] }), [])).toEqual({});
      expect(limpiarDatos(datos({ tipo, puertoProxy: 8001 })).puertoProxy).toBe(8001);
    }
  });

  it('detecta dominios o alias ya usados por otro sitio', () => {
    const otros = [sitio({ id: 'b', dominio: 'otro.test', alias: ['api.test'] })];
    expect(validarFormularioSitio(datos({ dominio: 'otro.test' }), otros).dominio).toBe(
      'Ya existe un sitio con el dominio otro.test',
    );
    expect(validarFormularioSitio(datos({ alias: ['api.test'] }), otros).alias).toBe(
      'Ya existe un sitio con el dominio api.test',
    );
  });

  it('compara sin mayúsculas ni espacios, como el núcleo al limpiar', () => {
    const otros = [sitio({ id: 'b', dominio: 'otro.test' })];
    expect(validarFormularioSitio(datos({ dominio: ' Otro.TEST ' }), otros).dominio).toBe(
      'Ya existe un sitio con el dominio otro.test',
    );
  });

  it('rechaza caracteres que Nginx no acepta en un dominio', () => {
    expect(validarFormularioSitio(datos({ dominio: 'mi sitio.test' }), []).dominio).toBe(
      'Use solo letras, números, guiones y puntos',
    );
    expect(validarFormularioSitio(datos({ dominio: '-x.test' }), []).dominio).toBeDefined();
  });

  it('exige carpeta, puerto en rango y un nombre de variable válido', () => {
    const e = validarFormularioSitio(
      datos({ carpeta: '', tipo: 'proxy', php: null, puertoProxy: 70000, urlBaseVar: 'APP URL' }),
      [],
    );
    expect(e.carpeta).toBe('Elija la carpeta del proyecto');
    expect(e.puertoProxy).toBe('El puerto debe estar entre 1 y 65535');
    expect(e.urlBaseVar).toBeDefined();
  });

  it('estático y proxy no piden PHP', () => {
    expect(validarFormularioSitio(datos({ tipo: 'estatico', php: null }), [])).toEqual({});
    expect(
      validarFormularioSitio(datos({ tipo: 'proxy', php: null, puertoProxy: 5173 }), []),
    ).toEqual({});
  });
});

describe('ayudas del formulario', () => {
  it('separa y arma el dominio con el sufijo .test fijo', () => {
    expect(baseDominio('WolfCore.test')).toBe('wolfcore');
    expect(baseDominio('wolfcore')).toBe('wolfcore');
    expect(armarDominio('wolfcore')).toBe('wolfcore.test');
    expect(armarDominio('wolfcore.test')).toBe('wolfcore.test');
    expect(armarDominio('')).toBe('');
  });

  it('normaliza los alias y les agrega .test', () => {
    expect(normalizarAlias(' API.WolfCore ')).toBe('api.wolfcore.test');
    expect(normalizarAlias('admin.test')).toBe('admin.test');
    expect(normalizarAlias('   ')).toBe('');
  });

  it('toma el nombre de la carpeta en rutas de Windows con espacios', () => {
    expect(nombreDeCarpeta('C:\\Proyectos\\WolfCore System\\')).toBe('WolfCore System');
    expect(nombreDeCarpeta('/home/u/sitio')).toBe('sitio');
  });

  it('limpia los campos que el tipo no usa y pone el nombre por defecto', () => {
    const l = limpiarDatos(
      datos({ nombre: '  ', tipo: 'estatico', php: '8.4', puertoProxy: 3000, urlBaseVar: ' ' }),
    );
    expect(l.nombre).toBe('WolfCore System');
    expect(l.php).toBeNull();
    expect(l.puertoProxy).toBeNull();
    expect(l.urlBaseVar).toBeNull();
  });

  it('duplica con dominio libre, sin alias y conservando el resto', () => {
    const original = sitio({ alias: ['api.wolfcore.test'], datosReales: true });
    const otros = [original, sitio({ id: 'c', dominio: 'wolfcore-copia.test' })];
    const copia = datosParaDuplicar(original, otros);
    expect(copia).not.toHaveProperty('id');
    expect(copia.dominio).toBe('wolfcore-copia-2.test');
    expect(copia.alias).toEqual([]);
    expect(copia.nombre).toBe('WolfCore (copia)');
    expect(copia.datosReales).toBe(true);
    expect(copia.carpeta).toBe(original.carpeta);
    expect(validarFormularioSitio(copia, otros)).toEqual({});
  });

  it('elige la versión de PHP pedida o la más nueva instalada', () => {
    expect(elegirPhp('8.3', ['8.3', '8.4'])).toEqual({ php: '8.3', noInstalada: null });
    expect(elegirPhp('8.2', ['8.3', '8.4'])).toEqual({ php: '8.4', noInstalada: '8.2' });
    expect(elegirPhp(null, ['8.10', '8.4'])).toEqual({ php: '8.10', noInstalada: null });
    expect(elegirPhp('8.2', [])).toEqual({ php: null, noInstalada: '8.2' });
  });

  it('el formulario vacío necesita carpeta y dominio', () => {
    const e = validarFormularioSitio(sitioVacio(), []);
    expect(Object.keys(e).sort()).toEqual(['carpeta', 'dominio', 'php']);
  });
});

describe('lista de sitios', () => {
  const lista = [
    sitio({ id: '1', nombre: 'Diamantes', dominio: 'wolfcore-diamantes.test' }),
    sitio({ id: '2', nombre: 'Árbol', dominio: 'arbol.test', alias: ['api-arbol.test'] }),
    sitio({ id: '3', nombre: '', dominio: 'blog.test' }),
  ];

  it('filtra por nombre, dominio o alias sin importar tildes ni mayúsculas', () => {
    expect(filtrarSitios(lista, 'arbol').map((s) => s.id)).toEqual(['2']);
    expect(filtrarSitios(lista, 'API-').map((s) => s.id)).toEqual(['2']);
    expect(filtrarSitios(lista, 'wolfcore').map((s) => s.id)).toEqual(['1']);
    expect(filtrarSitios(lista, '  ')).toHaveLength(3);
  });

  it('ordena por nombre (o dominio si no tiene)', () => {
    expect(ordenarSitios(lista).map((s) => s.id)).toEqual(['2', '3', '1']);
  });

  it('la URL local lleva el puerto solo si no es 80', () => {
    expect(urlLocal('a.test', 80)).toBe('http://a.test');
    expect(urlLocal('a.test', undefined)).toBe('http://a.test');
    expect(urlLocal('a.test', 8080)).toBe('http://a.test:8080');
  });

  it('traduce el resultado de aplicar al aviso de hosts', () => {
    expect(
      falloHostsDe({ nginx: { ok: true, salida: '' }, hosts: { ok: true }, httpsPendiente: [] }),
    ).toBeNull();
    expect(
      falloHostsDe({
        nginx: { ok: true, salida: '' },
        hosts: { ok: false, motivo: 'cancelado', comandoManual: 'Copy-Item x' },
        httpsPendiente: [],
      }),
    ).toEqual({ motivo: 'cancelado', comandoManual: 'Copy-Item x' });
  });
});

describe('HTTPS de un sitio', () => {
  const estado = (o: Partial<EstadoHttps> = {}): EstadoHttps => ({
    caCreada: true,
    caInstalada: true,
    puerto: 443,
    ocupadoPor: null,
    ...o,
  });

  it('"Redirigir a HTTPS" solo se habilita con HTTPS activo', () => {
    expect(redirigirHabilitado({ https: false })).toBe(false);
    expect(redirigirHabilitado({ https: true })).toBe(true);
  });

  it('al guardar sin HTTPS la redirección se apaga sola', () => {
    const base = sitioVacio();
    expect(
      limpiarDatos({ ...base, carpeta: 'C:/x', https: false, redirigirHttps: true }).redirigirHttps,
    ).toBe(false);
    expect(
      limpiarDatos({ ...base, carpeta: 'C:/x', https: true, redirigirHttps: true }).redirigirHttps,
    ).toBe(true);
  });

  it('la URL https lleva el puerto solo si no es 443', () => {
    expect(urlHttps('a.test', 443)).toBe('https://a.test');
    expect(urlHttps('a.test', 8443)).toBe('https://a.test:8443');
  });

  it('explica por qué un sitio HTTPS está pendiente', () => {
    const s = { https: true };
    expect(
      estadoHttpsSitio({ https: false }, estado({ ocupadoPor: { pid: 1, nombre: 'x' } })),
    ).toEqual({ pendiente: null, sinConfianza: false });
    expect(estadoHttpsSitio(s, null)).toEqual({ pendiente: null, sinConfianza: false });
    expect(estadoHttpsSitio(s, estado())).toEqual({ pendiente: null, sinConfianza: false });
    expect(
      estadoHttpsSitio(s, estado({ ocupadoPor: { pid: 4321, nombre: 'nginx.exe' } })).pendiente,
    ).toBe('HTTPS pendiente: el puerto 443 lo usa nginx.exe (PID 4321).');
    expect(estadoHttpsSitio(s, estado({ caCreada: false, caInstalada: false })).pendiente).toMatch(
      /^HTTPS pendiente: /,
    );
    expect(estadoHttpsSitio(s, estado({ caInstalada: false }))).toEqual({
      pendiente: null,
      sinConfianza: true,
    });
  });
});

describe('Correo', () => {
  it('el bloque .env de Laravel apunta al SMTP local de Mailpit, sin usuario ni cifrado', () => {
    expect(bloqueEnvCorreo()).toBe(
      [
        'MAIL_MAILER=smtp',
        'MAIL_HOST=127.0.0.1',
        'MAIL_PORT=1025',
        'MAIL_USERNAME=null',
        'MAIL_PASSWORD=null',
        'MAIL_ENCRYPTION=null',
      ].join('\n'),
    );
    expect(bloqueEnvCorreo(2525)).toContain('MAIL_PORT=2525');
  });
});

describe('confirmación de túnel por proveedor (D24)', () => {
  const base = { dominio: 'wolf.test', datosReales: false };

  it('Tailscale Serve dice que solo llega a la tailnet; Funnel, que es internet', () => {
    const serve = confirmacionDeTunel({ ...base, tunel: { proveedor: 'tailscale' } });
    expect(serve.contenido).toContain('Tailscale Serve');
    expect(serve.contenido).toContain('no se publica en internet');
    expect(
      confirmacionDeTunel({ ...base, tunel: { proveedor: 'tailscale', modo: 'serve' } }),
    ).toEqual(serve);
    const funnel = confirmacionDeTunel({
      ...base,
      tunel: { proveedor: 'tailscale', modo: 'funnel' },
    });
    expect(funnel.contenido).toContain('Tailscale Funnel');
    expect(funnel.contenido).toContain('en internet');
    expect(funnel.titulo).not.toBe(serve.titulo);
  });

  it('ngrok y Expose dicen el proveedor y que es internet', () => {
    expect(confirmacionDeTunel({ ...base, tunel: { proveedor: 'ngrok' } }).contenido).toContain(
      'ngrok',
    );
    expect(confirmacionDeTunel({ ...base, tunel: { proveedor: 'expose' } }).contenido).toContain(
      'Expose',
    );
  });

  it('con datos reales: internet usa el aviso fuerte y Serve el suyo (sin decir que es público)', () => {
    const reales = { ...base, datosReales: true };
    expect(confirmacionDeTunel({ ...reales, tunel: { proveedor: 'ngrok' } }).titulo).toBe(
      'Publicar un sitio con datos reales',
    );
    const serve = confirmacionDeTunel({ ...reales, tunel: { proveedor: 'tailscale' } });
    expect(serve.contenido).toContain('datos reales');
    expect(serve.contenido).toContain('tailnet');
  });

  it('sin proveedor elegido se confirma como antes (Cloudflare rápido)', () => {
    expect(confirmacionDeTunel({ ...base, tunel: undefined }).contenido).toContain('Cloudflare');
  });

  it('solo los proveedores de Cloudflare necesitan cloudflared', () => {
    expect(usaCloudflared(undefined)).toBe(true);
    expect(usaCloudflared({ proveedor: 'cloudflare-nombre' })).toBe(true);
    for (const proveedor of ['ngrok', 'expose', 'tailscale'] as const) {
      expect(usaCloudflared({ proveedor })).toBe(false);
    }
  });
});

describe('confirmación de túnel: revisión de D24', () => {
  const base = { dominio: 'wolf.test', datosReales: false };

  it('con Serve el botón no dice Publicar (dice Compartir) y el texto no habla de internet como destino', () => {
    const c = confirmacionDeTunel({ ...base, tunel: { proveedor: 'tailscale' } });
    expect(c.boton).toBe('Compartir');
    const otro = confirmacionDeTunel({ ...base, tunel: { proveedor: 'ngrok' } });
    expect(otro.boton).toBe('Publicar');
    const funnel = confirmacionDeTunel({
      ...base,
      tunel: { proveedor: 'tailscale', modo: 'funnel' },
    });
    expect(funnel.boton).toBe('Publicar');
  });

  it('con datos reales nombra el proveedor y el dominio público', () => {
    const reales = { ...base, datosReales: true };
    expect(confirmacionDeTunel({ ...reales, tunel: { proveedor: 'ngrok' } }).contenido).toContain(
      'ngrok',
    );
    expect(confirmacionDeTunel({ ...reales, tunel: { proveedor: 'ngrok' } }).contenido).toContain(
      'wolf.test',
    );
    const c = confirmacionDeTunel({
      ...reales,
      tunel: { proveedor: 'cloudflare-nombre', nombre: 'wolf-dev', dominio: 'demo.midominio.com' },
    }).contenido;
    expect(c).toContain('Cloudflare');
    expect(c).toContain('https://demo.midominio.com');
    expect(
      confirmacionDeTunel({ ...reales, tunel: { proveedor: 'tailscale', modo: 'funnel' } })
        .contenido,
    ).toContain('Tailscale Funnel');
  });

  it('Expose avisa de que su inspector queda visible en la red local', () => {
    expect(confirmacionDeTunel({ ...base, tunel: { proveedor: 'expose' } }).contenido).toContain(
      'red local',
    );
  });

  it('lo confirmado lleva proveedor, nombre, dominio y modo (Serve por defecto en Tailscale)', () => {
    expect(tunelConfirmadoDe({ tunel: undefined })).toEqual({ proveedor: 'cloudflare-rapido' });
    expect(tunelConfirmadoDe({ tunel: { proveedor: 'tailscale' } })).toEqual({
      proveedor: 'tailscale',
      modo: 'serve',
    });
    expect(tunelConfirmadoDe({ tunel: { proveedor: 'tailscale', modo: 'funnel' } })).toEqual({
      proveedor: 'tailscale',
      modo: 'funnel',
    });
    expect(
      tunelConfirmadoDe({
        tunel: {
          proveedor: 'cloudflare-nombre',
          nombre: 'wolf-dev',
          dominio: 'demo.midominio.com',
        },
      }),
    ).toEqual({
      proveedor: 'cloudflare-nombre',
      nombre: 'wolf-dev',
      dominio: 'demo.midominio.com',
    });
  });
});
