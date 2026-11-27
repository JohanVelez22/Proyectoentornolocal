import type { MenuItemConstructorOptions } from 'electron';
import type { EstadoWorkspace } from '../shared/api';
import type { TextosMain } from './textos';

/** Un workspace en el menú de la bandeja. */
export interface WorkspaceBandeja {
  id: string;
  nombre: string;
  estado: EstadoWorkspace;
}

export interface AccionesBandeja {
  abrir(): void;
  iniciarTodo(): void;
  detenerTodo(): void;
  /** Enciende (apagado o parcial) o apaga (encendido) el workspace. */
  alternarWorkspace(id: string, estado: EstadoWorkspace): void;
  salir(): void;
}

/**
 * Plantilla del menú de la bandeja: abrir, iniciar y detener todo, los workspaces (si hay: uno con
 * casilla encendida si está encendido, "(parcial)" si solo está en parte) y salir. No importa
 * `electron` como valor: se prueba sin él.
 */
export function plantillaBandeja(
  a: AccionesBandeja,
  t: TextosMain,
  workspaces: readonly WorkspaceBandeja[] = [],
): MenuItemConstructorOptions[] {
  const lista: MenuItemConstructorOptions[] = [
    { label: t.abrir, click: a.abrir },
    { label: t.iniciarTodo, click: a.iniciarTodo },
    { label: t.detenerTodo, click: a.detenerTodo },
  ];
  if (workspaces.length > 0) {
    lista.push(
      { type: 'separator' },
      {
        label: t.workspaces,
        submenu: workspaces.map((w) => ({
          label: w.estado === 'parcial' ? `${w.nombre} (${t.workspaceParcial})` : w.nombre,
          type: 'checkbox' as const,
          checked: w.estado === 'encendido',
          click: () => a.alternarWorkspace(w.id, w.estado),
        })),
      },
    );
  }
  lista.push({ type: 'separator' }, { label: t.salir, click: a.salir });
  return lista;
}
