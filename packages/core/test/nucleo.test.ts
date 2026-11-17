import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Eventos, type EventosNucleo } from '../src/eventos';
import { Nucleo } from '../src/nucleo';
import { Supervisor } from '../src/procesos/supervisor';
import type { Plataforma } from '../src/plataforma/tipos';
import type { EstadoHosts, EstadoServicio, Sitio } from '../src/tipos';

let base: string;
let carpeta: string;
let hostsArchivo: string;
let plataforma: Plataforma;
let nucleos: Nucleo[];

const falsa = (): Plataforma => ({
  rutaHosts: () => hostsArchivo,
  escribirComoAdmin: async (destino, contenido) => {
    writeFileSync(destino, contenido);
    return { ok: true };
  },
  quienUsaPuerto: async () => null,
  procesoVivo: async () => ({ vivo: false }),
  matarArbol: async () => undefined,
  abrirUrl: async () => undefined,
  ejecutable: (n) => `${n}.exe`,
});

const crear = async (): Promise<Nucleo> => {
  const n = await Nucleo.crear({
    base,
    plataforma,
    fetch: (async () => new Response('{}')) as typeof fetch,
  });
  nucleos.push(n);
  return n;
};

const datos = (extra: Partial<Omit<Sitio, 'id'>> = {}): Omit<Sitio, 'id'> => ({
  nombre: 'Demo',
  dominio: 'demo.test',
  alias: [],
  carpeta,
  tipo: 'estatico',
  php: null,
  puertoProxy: null,
  reglasExtra: '',
  urlBaseVar: null,
  datosReales: false,
  nota: '',
  ...extra,
});

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-nucleo-'));
  carpeta = path.join(base, 'proyecto');
  mkdirSync(carpeta);
  hostsArchivo = path.join(base, 'hosts');
  writeFileSync(hostsArchivo, '127.0.0.1 localhost\r\n');
  plataforma = falsa();
  nucleos = [];
});

afterEach(async () => {
  vi.useRealTimers();
  for (const n of nucleos) await n.cerrar({ detenerServicios: false });
  rmSync(base, { recursive: true, force: true });
});

describe('Nucleo', () => {
  it('crea el árbol de datos y arma un sitio estático emitiendo sitio:cambio', async () => {
    const n = await crear();
    expect(n.rutas.base).toBe(base);
    const cambios: Sitio[][] = [];
    n.eventos.on('sitio:cambio', (s) => cambios.push(s));
    const { sitio, aplicar } = await n.guardarSitio(datos());
    expect(sitio.id).toBe('demo');
    expect(cambios.length).toBeGreaterThan(0);
    expect(cambios.at(-1)?.[0]?.dominio).toBe('demo.test');
    expect(aplicar.hosts.ok).toBe(true);
    expect(readFileSync(hostsArchivo, 'utf8')).toContain('demo.test');
    expect((await n.config.leer()).sitios).toHaveLength(1);
  });

  it('guardarSitio con id edita el sitio y aplica', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const { sitio } = await n.guardarSitio({ ...datos(), nota: 'hola' }, 'demo');
    expect(sitio.nota).toBe('hola');
    expect(await n.sitios.listar()).toHaveLength(1);
  });

  it('crear emite hosts:estado inicial para los dominios de los sitios existentes', async () => {
    const a = await crear();
    await a.guardarSitio(datos());
    await a.cerrar({ detenerServicios: false });
    // Se quita el bloque de hosts para que el estado inicial lo reporte pendiente.
    writeFileSync(hostsArchivo, '127.0.0.1 localhost\r\n');
    const visto: EstadoHosts[] = [];
    const n = await Nucleo.crear({
      base,
      plataforma,
      fetch: (async () => new Response('{}')) as typeof fetch,
      alIniciar: (e) => e.on('hosts:estado', (h) => visto.push(h)),
    });
    nucleos.push(n);
    expect(visto).toHaveLength(1);
    expect(visto[0]?.pendientes).toEqual(['demo.test']);
  });

  it('borrarSitio cierra el túnel antes de borrar y luego aplica', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const orden: string[] = [];
    vi.spyOn(n.tuneles, 'cerrar').mockImplementation(async () => {
      orden.push('cerrar');
    });
    const borrar = n.sitios.borrar.bind(n.sitios);
    vi.spyOn(n.sitios, 'borrar').mockImplementation(async (id) => {
      orden.push('borrar');
      return borrar(id);
    });
    const aplicar = n.sitios.aplicar.bind(n.sitios);
    vi.spyOn(n.sitios, 'aplicar').mockImplementation(async () => {
      orden.push('aplicar');
      return aplicar();
    });
    const r = await n.borrarSitio('demo');
    expect(orden).toEqual(['cerrar', 'borrar', 'aplicar']);
    expect(r.hosts.ok).toBe(true);
    expect(await n.sitios.listar()).toEqual([]);
  });

  it('borrarSitio ignora el error de túnel no abierto', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    vi.spyOn(n.tuneles, 'cerrar').mockRejectedValue(new Error('no abierto'));
    await expect(n.borrarSitio('demo')).resolves.toBeDefined();
    expect(await n.sitios.listar()).toEqual([]);
  });

  it('estadoGeneral reúne servicios, sitios, túneles y hosts', async () => {
    const n = await crear();
    await n.guardarSitio(datos());
    const g = await n.estadoGeneral();
    expect(g.servicios.find((s) => s.id === 'nginx')?.estado).toBe('apagado');
    expect(g.sitios).toHaveLength(1);
    expect(g.tuneles).toEqual([]);
    expect(g.hosts.pendientes).toEqual([]);
  });

  describe('sondeo', () => {
    it('emite servicio:estado cada 3000 ms solo cuando cambia', async () => {
      const n = await crear();
      let externo = false;
      vi.spyOn(n.servicios, 'estados').mockImplementation(async () => {
        const actuales: EstadoServicio[] = [
          {
            id: 'nginx',
            nombre: 'Nginx',
            version: null,
            estado: 'apagado',
            puertos: [80],
            pid: null,
          },
        ];
        if (!externo) return actuales;
        return [
          ...actuales,
          {
            id: 'mysql',
            nombre: 'MySQL (externo)',
            version: null,
            estado: 'externo',
            puertos: [3306],
            pid: null,
          } satisfies EstadoServicio,
        ];
      });
      vi.useFakeTimers();
      const vistos: EstadoServicio[] = [];
      n.eventos.on('servicio:estado', (e) => vistos.push(e));
      n.iniciarSondeo();
      n.iniciarSondeo(); // idempotente
      await vi.advanceTimersByTimeAsync(3000);
      const primeros = vistos.length;
      expect(vistos.filter((v) => v.id === 'nginx')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(6000);
      expect(vistos).toHaveLength(primeros);
      externo = true;
      await vi.advanceTimersByTimeAsync(3000);
      expect(vistos.filter((v) => v.id === 'mysql')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(3000);
      expect(vistos.filter((v) => v.id === 'mysql')).toHaveLength(1);
    });

    it('no solapa ticks y cerrar detiene el sondeo', async () => {
      const n = await crear();
      let llamadas = 0;
      let liberar!: () => void;
      vi.spyOn(n.servicios, 'estados').mockImplementation(() => {
        llamadas++;
        return new Promise<EstadoServicio[]>((r) => {
          liberar = () => r([]);
        });
      });
      vi.useFakeTimers();
      n.iniciarSondeo();
      await vi.advanceTimersByTimeAsync(9000);
      expect(llamadas).toBe(1);
      liberar();
      await vi.advanceTimersByTimeAsync(3000);
      expect(llamadas).toBe(2);
      liberar();
      await n.cerrar({ detenerServicios: false });
      await vi.advanceTimersByTimeAsync(9000);
      expect(llamadas).toBe(2);
    });
  });

  it('cerrar con detenerServicios cierra túneles y detiene todo', async () => {
    const n = await crear();
    vi.spyOn(n.tuneles, 'estados').mockReturnValue([
      { sitioId: 'a', estado: 'activo', url: 'https://x.trycloudflare.com' },
    ]);
    const cerrar = vi.spyOn(n.tuneles, 'cerrar').mockResolvedValue();
    const detener = vi.spyOn(n.servicios, 'detenerTodo').mockResolvedValue();
    await n.cerrar({ detenerServicios: true });
    expect(cerrar).toHaveBeenCalledWith('a');
    expect(detener).toHaveBeenCalled();
  });

  it('cerrar cierra el supervisor aunque falle un túnel o detenerTodo, y relanza el primer error', async () => {
    const n = await crear();
    vi.spyOn(n.tuneles, 'estados').mockReturnValue([
      { sitioId: 'a', estado: 'activo', url: 'https://x.trycloudflare.com' },
    ]);
    vi.spyOn(n.tuneles, 'cerrar').mockRejectedValue(new Error('túnel'));
    vi.spyOn(n.servicios, 'detenerTodo').mockRejectedValue(new Error('detener'));
    const sup = vi.spyOn(
      (n as unknown as { supervisor: { cerrar(): Promise<void> } }).supervisor,
      'cerrar',
    );
    await expect(n.cerrar({ detenerServicios: true })).rejects.toThrow('túnel');
    expect(sup).toHaveBeenCalled();
  });

  it('crear cierra el supervisor y relanza si falla un paso posterior', async () => {
    const cerrar = vi.spyOn(Supervisor.prototype, 'cerrar');
    vi.spyOn(Supervisor.prototype, 'readoptar').mockRejectedValue(new Error('boom'));
    await expect(crear()).rejects.toThrow('boom');
    expect(cerrar).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('solo los estados agregados llegan al flujo público; los eventos crudos del supervisor no', async () => {
    const n = await crear();
    const internos = (n as unknown as { supervisor: { eventos: Eventos<EventosNucleo> } })
      .supervisor.eventos;
    const vistos: EstadoServicio[] = [];
    n.eventos.on('servicio:estado', (e) => vistos.push(e));
    const crudo = (id: string): EstadoServicio => ({
      id,
      nombre: id,
      version: null,
      estado: 'encendido',
      puertos: [],
      pid: 1,
    });
    internos.emit('servicio:estado', crudo('php-8.4-0'));
    internos.emit('servicio:estado', crudo('tunel-x'));
    internos.emit('servicio:estado', crudo('nginx'));
    await vi.waitFor(() => expect(vistos.length).toBeGreaterThan(0));
    const ids = vistos.map((v) => v.id);
    expect(ids).toContain('nginx');
    expect(ids).not.toContain('php-8.4-0');
    expect(ids.some((i) => i.startsWith('tunel-'))).toBe(false);
    expect(vistos.find((v) => v.id === 'nginx')).toMatchObject({
      nombre: 'Nginx',
      puertos: [80],
      estado: 'apagado',
    });
  });
});
