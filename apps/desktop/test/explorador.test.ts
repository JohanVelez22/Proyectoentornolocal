import { describe, expect, it, vi } from 'vitest';
import { abrirRecursoEnExplorador, rutaExplorer } from '../src/main/explorador';

/** D53: el lanzador es un doble; ninguna prueba abre el Explorador de verdad. */
const ENTORNO = { SystemRoot: 'C:\\Windows' } as NodeJS.ProcessEnv;
const UNC = (ip: string, recurso: string): string => `\\\\${ip}\\${recurso}`;

describe('abrir un recurso de red con explorer.exe (D53)', () => {
  it('usa explorer.exe de %SystemRoot% por ruta absoluta y la UNC como único argumento', () => {
    const lanzar = vi.fn();
    abrirRecursoEnExplorador(UNC('192.168.1.5', 'Docs'), lanzar, ENTORNO);
    expect(lanzar).toHaveBeenCalledExactlyOnceWith('C:\\Windows\\explorer.exe', [
      UNC('192.168.1.5', 'Docs'),
    ]);
    expect(rutaExplorer({} as NodeJS.ProcessEnv)).toBe('C:\\Windows\\explorer.exe');
  });

  it('revalida la ruta: nada que no sea \\\\IPv4privada\\recurso llega al sistema', () => {
    const lanzar = vi.fn();
    for (const mala of [
      UNC('8.8.8.8', 'Docs'),
      UNC('equipo', 'Docs'),
      UNC('192.168.1.5', 'C$'),
      UNC('192.168.1.5', 'Docs\\sub'),
      UNC('192.168.1.5', 'Do/cs'),
      UNC('192.168.1.5', 'Fotos\u202efdp'),
      '/e,C:\\Windows',
      'C:\\Windows\\notepad.exe',
      'https://ejemplo.com',
      '',
      5,
      null,
    ]) {
      expect(() => abrirRecursoEnExplorador(mala, lanzar, ENTORNO), String(mala)).toThrowError(
        expect.objectContaining({ codigo: 'red.recurso_no_valido' }),
      );
    }
    expect(lanzar).not.toHaveBeenCalled();
  });
});
