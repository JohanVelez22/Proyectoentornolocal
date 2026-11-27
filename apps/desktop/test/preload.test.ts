import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { crearBusEventos } from '../src/preload/eventos';
import { CANAL_EVENTO } from '../src/shared/api';

function montar() {
  const ipc = new EventEmitter();
  // Como Electron: avisa al pasar de 10 oyentes en un canal.
  const avisos: Error[] = [];
  process.on('warning', (w) => avisos.push(w));
  const bus = crearBusEventos(ipc, CANAL_EVENTO, ['serviciosCambio', 'progreso']);
  const emitir = (nombre: string, dato: unknown): boolean =>
    ipc.emit(CANAL_EVENTO, {}, { nombre, dato });
  return { ipc, bus, emitir, avisos };
}

describe('bus de eventos del preload', () => {
  it('50 suscripciones dejan un solo oyente en ipcRenderer, sin aviso de fugas', async () => {
    const { ipc, bus, avisos } = montar();
    const bajas = Array.from({ length: 50 }, () => bus.on('progreso', () => undefined));
    expect(ipc.listenerCount(CANAL_EVENTO)).toBe(1);
    await new Promise((r) => setImmediate(r));
    expect(avisos.filter((a) => a.name === 'MaxListenersExceededWarning')).toEqual([]);
    bajas.forEach((b) => b());
    expect(ipc.listenerCount(CANAL_EVENTO)).toBe(0);
  });

  it('reparte cada evento solo a los suscritos a ese nombre', () => {
    const { bus, emitir } = montar();
    const a = vi.fn();
    const b = vi.fn();
    const otro = vi.fn();
    bus.on('progreso', a);
    bus.on('progreso', b);
    bus.on('serviciosCambio', otro);
    emitir('progreso', 7);
    expect(a).toHaveBeenCalledWith(7);
    expect(b).toHaveBeenCalledWith(7);
    expect(otro).not.toHaveBeenCalled();
  });

  it('la baja de uno no afecta a los demás, y es idempotente', () => {
    const { ipc, bus, emitir } = montar();
    const a = vi.fn();
    const b = vi.fn();
    const bajaA = bus.on('progreso', a);
    bus.on('progreso', b);
    bajaA();
    bajaA();
    emitir('progreso', 1);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(1);
    expect(ipc.listenerCount(CANAL_EVENTO)).toBe(1);
  });

  it('la misma función suscrita dos veces recibe el evento dos veces y se baja por separado', () => {
    const { bus, emitir } = montar();
    const f = vi.fn();
    const b1 = bus.on('progreso', f);
    bus.on('progreso', f);
    emitir('progreso', 1);
    expect(f).toHaveBeenCalledTimes(2);
    b1();
    emitir('progreso', 2);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it('un suscriptor que falla no impide que los demás reciban el evento', () => {
    const { bus, emitir } = montar();
    const b = vi.fn();
    bus.on('progreso', () => {
      throw new Error('falla');
    });
    bus.on('progreso', b);
    emitir('progreso', 1);
    expect(b).toHaveBeenCalledWith(1);
  });

  it('un nombre desconocido no suscribe y los mensajes mal formados se ignoran', () => {
    const { ipc, bus, emitir } = montar();
    const f = vi.fn();
    bus.on('inventado', f)();
    expect(ipc.listenerCount(CANAL_EVENTO)).toBe(0);
    bus.on('progreso', f);
    ipc.emit(CANAL_EVENTO, {}, null);
    ipc.emit(CANAL_EVENTO, {}, { nombre: 5 });
    emitir('inventado', 1);
    expect(f).not.toHaveBeenCalled();
  });

  it('se puede volver a suscribir tras bajar a todos', () => {
    const { ipc, bus, emitir } = montar();
    bus.on('progreso', () => undefined)();
    const f = vi.fn();
    bus.on('progreso', f);
    expect(ipc.listenerCount(CANAL_EVENTO)).toBe(1);
    emitir('progreso', 3);
    expect(f).toHaveBeenCalledWith(3);
  });
});
