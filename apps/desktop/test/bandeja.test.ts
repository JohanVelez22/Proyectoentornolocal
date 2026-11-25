import { describe, expect, it, vi } from 'vitest';
import { plantillaBandeja, type AccionesBandeja } from '../src/main/bandejaPlantilla';
import { textosMain } from '../src/main/textos';

function acciones(): AccionesBandeja {
  return {
    abrir: vi.fn(),
    iniciarTodo: vi.fn(),
    detenerTodo: vi.fn(),
    alternarWorkspace: vi.fn(),
    salir: vi.fn(),
  };
}

describe('bandeja: workspaces (D28)', () => {
  it('sin workspaces el menú es el de siempre', () => {
    const t = textosMain('es');
    const m = plantillaBandeja(acciones(), t);
    expect(m.map((x) => x.label ?? x.type)).toEqual([
      'Abrir',
      'Iniciar todo',
      'Detener todo',
      'separator',
      'Salir',
    ]);
  });

  it('con workspaces suma un submenú: encendido con casilla, parcial lo dice', () => {
    const a = acciones();
    const m = plantillaBandeja(a, textosMain('es'), [
      { id: 'bot', nombre: 'Bot FastAPI', estado: 'encendido' },
      { id: 'web', nombre: 'Web', estado: 'parcial' },
      { id: 'otro', nombre: 'Otro', estado: 'apagado' },
    ]);
    const sub = m.find((x) => x.label === 'Workspaces')!.submenu as {
      label: string;
      checked: boolean;
      click: () => void;
    }[];
    expect(sub.map((x) => [x.label, x.checked])).toEqual([
      ['Bot FastAPI', true],
      ['Web (parcial)', false],
      ['Otro', false],
    ]);
    sub[0]!.click();
    sub[1]!.click();
    expect(a.alternarWorkspace).toHaveBeenNthCalledWith(1, 'bot', 'encendido');
    expect(a.alternarWorkspace).toHaveBeenNthCalledWith(2, 'web', 'parcial');
    expect(m.at(-1)!.label).toBe('Salir');
  });

  it('el submenú tiene texto en los cuatro idiomas', () => {
    for (const i of ['es', 'en', 'pt', 'fr'] as const) {
      const t = textosMain(i);
      expect(t.workspaces.length).toBeGreaterThan(0);
      expect(t.workspaceParcial.length).toBeGreaterThan(0);
    }
  });
});
