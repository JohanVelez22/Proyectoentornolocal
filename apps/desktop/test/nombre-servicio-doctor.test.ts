import { describe, expect, it } from 'vitest';
import { nombreVisibleDeId } from '../src/renderer/utilidades/nombreServicio';
import { traducirError } from '../src/renderer/utilidades/errores';

describe('nombres visibles de servicio en el Doctor (D54c)', () => {
  it('los identificadores salen con su nombre de producto', () => {
    expect(nombreVisibleDeId('nginx')).toBe('Nginx');
    expect(nombreVisibleDeId('mysql')).toBe('MySQL');
    expect(nombreVisibleDeId('postgresql')).toBe('PostgreSQL');
    expect(nombreVisibleDeId('php-8.4')).toBe('PHP 8.4');
    expect(nombreVisibleDeId('Nginx')).toBe('Nginx');
    expect(nombreVisibleDeId('desconocido')).toBe('Desconocido');
  });
  it('el texto del hallazgo de puertos usa el nombre visible, no el identificador', () => {
    const texto = traducirError({
      codigo: 'doctor.puerto_ocupado',
      datos: { puerto: 80, servicio: nombreVisibleDeId('nginx'), proceso: 'httpd.exe' },
    });
    expect(texto).toContain('Nginx');
    expect(texto).not.toContain('nginx');
  });
});
