import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Aviso } from '@pel/core';
import { registrarIpc, type IpcMainLike, type NucleoIpc } from '../src/main/ipc';
import { Notificador, type NotificacionNativa } from '../src/main/notificaciones';
import { textoAviso, CODIGOS_AVISO } from '../src/shared/textosAvisos';
import { RUTAS_IPC, type ApiEntorno } from '../src/shared/api';
import { useAvisos } from '../src/renderer/stores/avisos';

function aviso(extra: Partial<Aviso> = {}): Aviso {
  return {
    id: 'a1',
    nivel: 'error',
    tipo: 'servicio-caido',
    codigo: 'avisos.servicio_caido',
    datos: { fuente: 'mysql', nombre: 'MySQL' },
    fecha: '2026-11-19T10:00:00.000Z',
    leido: false,
    accion: { ruta: 'servicios' },
    ...extra,
  };
}

describe('Notificador (main)', () => {
  function montar(opciones: { foco?: boolean; permitida?: boolean; soportada?: boolean } = {}) {
    const creadas: { title: string; body: string; silent: boolean }[] = [];
    const clics: Aviso[] = [];
    const oyentes: Record<string, () => void>[] = [];
    let t = 1_000_000;
    const estado = { foco: opciones.foco ?? false };
    const n = new Notificador({
      soportada: () => opciones.soportada ?? true,
      crear: (o) => {
        creadas.push(o);
        const mios: Record<string, () => void> = {};
        oyentes.push(mios);
        return {
          show: vi.fn(),
          on: (ev: string, fn: () => void) => void (mios[ev] = fn),
        } as unknown as NotificacionNativa;
      },
      ventanaConFoco: () => estado.foco,
      permitida: () => opciones.permitida ?? true,
      alClic: (a) => void clics.push(a),
      ahora: () => t,
    });
    return { n, creadas, clics, oyentes, estado, avanzar: (ms: number) => (t += ms) };
  }
  const texto = { titulo: 'T', cuerpo: 'C' };

  it('con la ventana con foco no muestra nada; sin foco, sí', () => {
    const { n, creadas, estado } = montar({ foco: true });
    expect(n.mostrar(aviso(), texto)).toBe(false);
    expect(creadas).toHaveLength(0);
    estado.foco = false;
    expect(n.mostrar(aviso(), texto)).toBe(true);
    expect(creadas).toEqual([{ title: 'T', body: 'C', silent: false }]);
  });

  it('respeta las preferencias y el soporte del sistema', () => {
    expect(montar({ permitida: false }).n.mostrar(aviso(), texto)).toBe(false);
    expect(montar({ soportada: false }).n.mostrar(aviso(), texto)).toBe(false);
  });

  it('límite: una por tipo y fuente cada 5 minutos', () => {
    const { n, creadas, avanzar } = montar();
    expect(n.mostrar(aviso(), texto)).toBe(true);
    avanzar(4 * 60_000);
    expect(n.mostrar(aviso({ id: 'a2' }), texto)).toBe(false);
    // otra fuente y otro tipo pasan
    expect(n.mostrar(aviso({ datos: { fuente: 'redis' } }), texto)).toBe(true);
    expect(n.mostrar(aviso({ tipo: 'tunel-caido' }), texto)).toBe(true);
    avanzar(61_000);
    expect(n.mostrar(aviso({ id: 'a3' }), texto)).toBe(true);
    expect(creadas).toHaveLength(4);
  });

  it('los avisos que no son de error salen en silencio', () => {
    const { n, creadas } = montar();
    n.mostrar(aviso({ nivel: 'info' }), texto);
    expect(creadas[0]!.silent).toBe(true);
  });

  it('el clic avisa con el aviso completo', () => {
    const { n, oyentes, clics } = montar();
    const a = aviso();
    n.mostrar(a, texto);
    oyentes[0]!['click']!();
    expect(clics).toEqual([a]);
  });

  it('versión nueva: botón "Actualizar" en el toast (si el sistema lo admite) que abre igual que el clic', () => {
    const { n, creadas, oyentes, clics } = montar();
    const a = aviso({
      tipo: 'version-nueva',
      nivel: 'info',
      codigo: 'avisos.version_nueva',
      datos: { fuente: 'mysql', servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15' },
      accion: {
        ruta: 'servicios.versiones',
        args: [{ servicio: 'mysql', version: '8.4.15', instancia: 'mysql@8.4', actualizar: true }],
      },
    });
    n.mostrar(a, { ...texto, accion: 'Actualizar' });
    expect(creadas[0]).toMatchObject({ actions: [{ type: 'button', text: 'Actualizar' }] });
    oyentes[0]!['action']!();
    expect(clics).toEqual([a]);
    // Sin huella fuerte (sin atajo) no lleva el botón: solo el clic, que abre la pestaña.
    const sin = aviso({
      ...a,
      id: 'a9',
      datos: { ...a.datos, fuente: 'redis' },
      accion: {
        ruta: 'servicios.versiones',
        args: [{ servicio: 'redis', version: '8', actualizar: false }],
      },
    });
    n.mostrar(sin, { ...texto, accion: 'Actualizar' });
    expect(creadas[1]).not.toHaveProperty('actions');
  });

  it('el texto de un aviso de versión nueva trae la acción "Actualizar" (es/en)', () => {
    const datos = { servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15' };
    expect(
      textoAviso('es', { tipo: 'version-nueva', codigo: 'avisos.version_nueva', datos }).accion,
    ).toBe('Actualizar');
    expect(
      textoAviso('en', { tipo: 'version-nueva', codigo: 'avisos.rama_nueva', datos }).accion,
    ).toBe('Update');
  });

  it('si Notification falla al crearse no rompe', () => {
    const n = new Notificador({
      soportada: () => true,
      crear: () => {
        throw new Error('sin servicio de notificaciones');
      },
      ventanaConFoco: () => false,
      permitida: () => true,
      alClic: () => undefined,
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(n.mostrar(aviso(), texto)).toBe(false);
    err.mockRestore();
  });
});

describe('textoAviso', () => {
  it('cada código tiene texto en es y en, sin marcas sin resolver', () => {
    for (const codigo of CODIGOS_AVISO) {
      for (const idioma of ['es', 'en'] as const) {
        const t = textoAviso(idioma, {
          tipo: 'servicio-caido',
          codigo,
          datos: { fuente: 'x', nombre: 'Nombre', puerto: 80, dias: 5 },
        });
        expect(t.titulo, codigo).not.toBe('');
        expect(t.cuerpo, codigo).not.toMatch(/\{|undefined|\[object/);
      }
    }
  });

  it('en inglés no hay tildes ni signos del español', () => {
    for (const codigo of CODIGOS_AVISO) {
      const t = textoAviso('en', { tipo: 'doctor', codigo, datos: {} });
      expect(`${t.titulo} ${t.cuerpo}`).not.toMatch(/[áéíóúñ¿¡]/);
    }
  });

  it('un código desconocido usa el texto genérico del tipo', () => {
    expect(textoAviso('es', { tipo: 'doctor', codigo: 'doctor.x', datos: {} }).titulo).toMatch(
      /Doctor/,
    );
    expect(
      textoAviso('en', { tipo: 'contenedor-detenido', codigo: 'otro', datos: {} }).titulo,
    ).toBe('A container stopped');
  });

  it('versión nueva y rama nueva: servicio y versiones en el texto, sin prometer instalar solo', () => {
    const datos = { servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15' };
    const es = textoAviso('es', { tipo: 'version-nueva', codigo: 'avisos.version_nueva', datos });
    expect(es.titulo).toContain('mysql');
    expect(es.cuerpo).toContain('8.4.15');
    expect(es.cuerpo).toContain('8.4.13');
    const en = textoAviso('en', { tipo: 'version-nueva', codigo: 'avisos.rama_nueva', datos });
    expect(`${en.titulo} ${en.cuerpo}`).toContain('8.4.15');
  });

  it('sin huella publicada: el texto lo dice (es/en), en parche y en rama (T17-M1)', () => {
    const datos = { servicio: 'mysql', actual: '8.4.13', nueva: '8.4.15', huella: 'sin' };
    for (const codigo of ['avisos.version_nueva_sin_huella', 'avisos.rama_nueva_sin_huella']) {
      const es = textoAviso('es', { tipo: 'version-nueva', codigo, datos });
      expect(es.cuerpo).toContain('sin huella publicada');
      expect(es.cuerpo).toContain('8.4.15');
      const en = textoAviso('en', { tipo: 'version-nueva', codigo, datos });
      expect(en.cuerpo).toContain('no published checksum');
    }
  });

  it('no deja pasar rutas ni textos largos de los datos', () => {
    const t = textoAviso('es', {
      tipo: 'servicio-caido',
      codigo: 'avisos.servicio_caido',
      datos: { nombre: 'C:\\Users\\yo\\secreto\\app.exe' },
    });
    expect(`${t.titulo} ${t.cuerpo}`).not.toMatch(/secreto|Users/);
    const largo = textoAviso('es', {
      tipo: 'servicio-caido',
      codigo: 'avisos.servicio_caido',
      datos: { nombre: 'x'.repeat(200) },
    });
    expect(largo.cuerpo.length).toBeLessThan(150);
  });
});

describe('IPC de avisos', () => {
  function montar() {
    const canales = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn) };
    const avisos = {
      lista: vi.fn(() => [aviso()]),
      marcarLeidos: vi.fn(),
      limpiar: vi.fn(),
    };
    const nucleo = {
      avisos,
      eventos: { on: () => () => undefined },
    } as unknown as NucleoIpc;
    registrarIpc(
      nucleo,
      ipcMain,
      { isDestroyed: () => false, webContents: { send: vi.fn() } },
      {} as never,
    );
    return { canales, avisos };
  }

  function montarConConfig(configurarAvisos: ReturnType<typeof vi.fn>) {
    const canales = new Map<string, (e: unknown, ...a: unknown[]) => unknown>();
    const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn) };
    const nucleo = {
      avisos: { lista: vi.fn(), marcarLeidos: vi.fn(), limpiar: vi.fn() },
      configurarAvisos,
      eventos: { on: () => () => undefined },
    } as unknown as NucleoIpc;
    registrarIpc(
      nucleo,
      ipcMain,
      { isDestroyed: () => false, webContents: { send: vi.fn() } },
      {} as never,
    );
    return { canales, nucleo };
  }

  it('las tres rutas están en la lista blanca', () => {
    for (const r of ['avisos.lista', 'avisos.marcarLeidos', 'avisos.limpiar']) {
      expect(RUTAS_IPC).toContain(r);
    }
  });

  it('lista, marca leídos (con y sin ids) y limpia', async () => {
    const { canales, avisos } = montar();
    expect(await canales.get('entorno:avisos.lista')!({})).toEqual({ ok: true, valor: [aviso()] });
    await canales.get('entorno:avisos.marcarLeidos')!({}, ['a1', 'a2']);
    expect(avisos.marcarLeidos).toHaveBeenLastCalledWith(['a1', 'a2']);
    await canales.get('entorno:avisos.marcarLeidos')!({});
    expect(avisos.marcarLeidos).toHaveBeenLastCalledWith(undefined);
    await canales.get('entorno:avisos.limpiar')!({});
    expect(avisos.limpiar).toHaveBeenCalled();
  });

  it('configurar: nativas y tipos válidos llegan al núcleo; lo demás se rechaza', async () => {
    const configurarAvisos = vi.fn(async () => ({ nativas: false, tipos: {} }));
    const { canales, nucleo } = montarConConfig(configurarAvisos);
    expect(RUTAS_IPC).toContain('avisos.configurar');
    const ok = (await canales.get('entorno:avisos.configurar')!(
      {},
      { nativas: false, tipos: { 'servicio-caido': false } },
    )) as { ok: boolean };
    expect(ok.ok).toBe(true);
    expect(configurarAvisos).toHaveBeenCalledWith({
      nativas: false,
      tipos: { 'servicio-caido': false },
    });
    for (const malo of [
      { nativas: 'no' },
      { tipos: { inventado: true } },
      { tipos: { 'servicio-caido': 1 } },
      { otra: true },
      'x',
    ]) {
      const r = (await canales.get('entorno:avisos.configurar')!({}, malo)) as { ok: boolean };
      expect(r.ok).toBe(false);
    }
    expect(configurarAvisos).toHaveBeenCalledTimes(1);
    void nucleo;
  });

  it('rechaza ids que no son una lista de textos cortos', async () => {
    const { canales, avisos } = montar();
    const malos = ['a1', [1], [{}], Array.from({ length: 300 }, () => 'x'), ['x'.repeat(100)]];
    for (const malo of malos) {
      const r = (await canales.get('entorno:avisos.marcarLeidos')!({}, malo)) as { ok: boolean };
      expect(r.ok).toBe(false);
    }
    expect(avisos.marcarLeidos).not.toHaveBeenCalled();
  });
});

describe('store de avisos', () => {
  type Oyente = (d: unknown) => void;
  let oyentes: Map<string, Set<Oyente>>;
  let lista: Aviso[];
  let api: {
    avisos: {
      lista: ReturnType<typeof vi.fn>;
      marcarLeidos: ReturnType<typeof vi.fn>;
      limpiar: ReturnType<typeof vi.fn>;
    };
    on: ReturnType<typeof vi.fn>;
  };
  const emitir = (n: string, d: unknown): void => oyentes.get(n)?.forEach((f) => f(d));

  beforeEach(() => {
    setActivePinia(createPinia());
    oyentes = new Map();
    lista = [aviso({ id: 'viejo', leido: true })];
    api = {
      avisos: {
        lista: vi.fn(async () => lista),
        marcarLeidos: vi.fn(async () => undefined),
        limpiar: vi.fn(async () => undefined),
      },
      on: vi.fn((n: string, f: Oyente) => {
        const s = oyentes.get(n) ?? new Set<Oyente>();
        s.add(f);
        oyentes.set(n, s);
        return () => void s.delete(f);
      }),
    };
    vi.stubGlobal('window', { entorno: api as unknown as ApiEntorno });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('carga el historial y cuenta los no leídos', async () => {
    const s = useAvisos();
    await s.cargar();
    expect(s.lista.map((a) => a.id)).toEqual(['viejo']);
    expect(s.noLeidos).toBe(0);
  });

  it('aviso:nuevo entra primero y suma; el historial se acota a 200', async () => {
    const s = useAvisos();
    await s.cargar();
    s.iniciar(() => undefined);
    emitir('aviso:nuevo', aviso({ id: 'n1' }));
    expect(s.lista[0]!.id).toBe('n1');
    expect(s.noLeidos).toBe(1);
    for (let i = 0; i < 250; i++) emitir('aviso:nuevo', aviso({ id: `x${i}` }));
    expect(s.lista).toHaveLength(200);
  });

  it('marcarLeidos y limpiar llaman al IPC y actualizan el estado', async () => {
    const s = useAvisos();
    await s.cargar();
    s.iniciar(() => undefined);
    emitir('aviso:nuevo', aviso({ id: 'n1' }));
    emitir('aviso:nuevo', aviso({ id: 'n2' }));
    await s.marcarLeidos(['n1']);
    expect(api.avisos.marcarLeidos).toHaveBeenCalledWith(['n1']);
    expect(s.noLeidos).toBe(1);
    await s.marcarLeidos();
    expect(api.avisos.marcarLeidos).toHaveBeenLastCalledWith(undefined);
    expect(s.noLeidos).toBe(0);
    await s.limpiar();
    expect(s.lista).toEqual([]);
  });

  it('aviso:abrir marca leído y navega a la acción', async () => {
    const navegar = vi.fn();
    const s = useAvisos();
    await s.cargar();
    s.iniciar(navegar);
    emitir('aviso:nuevo', aviso({ id: 'n1' }));
    emitir('aviso:abrir', aviso({ id: 'n1' }));
    expect(navegar).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
    expect(s.lista.find((a) => a.id === 'n1')!.leido).toBe(true);
  });

  it('una sola suscripción por evento aunque se inicie dos veces; detener las quita', () => {
    const s = useAvisos();
    s.iniciar(() => undefined);
    s.iniciar(() => undefined);
    expect(oyentes.get('aviso:nuevo')!.size).toBe(1);
    s.detener();
    expect(oyentes.get('aviso:nuevo')!.size).toBe(0);
    expect(oyentes.get('aviso:abrir')!.size).toBe(0);
  });
});

describe('aviso de credenciales sin proteger (D38c)', () => {
  it('tiene texto propio en es, en, pt y fr y no menciona rutas', () => {
    const a = {
      tipo: 'doctor' as const,
      codigo: 'avisos.credenciales_sin_proteccion',
      datos: { fuente: 'credenciales' },
    };
    const genericos = new Set<string>();
    for (const id of ['es', 'en', 'pt', 'fr'] as const) {
      const t = textoAviso(id, a);
      const g = textoAviso(id, { ...a, codigo: 'otro' });
      expect(t.titulo, id).not.toBe(g.titulo);
      expect(t.cuerpo, id).not.toMatch(/[\\/]|credenciales\.json/);
      genericos.add(t.titulo);
    }
    expect(genericos.size).toBe(4);
  });
});
