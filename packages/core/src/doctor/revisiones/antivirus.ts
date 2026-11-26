import type { DepsDoctor, HallazgoInterno } from '../tipos';

/**
 * Antivirus activo sin exclusión para la carpeta de datos (arranques lentos de `php-cgi`).
 * Solo informa: cambiar la seguridad del equipo lo decide el usuario con el comando que se le
 * muestra.
 */
export async function revisarAntivirus(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const a = await d.plataforma.antivirus(d.carpetaDatos);
  if (!a || !a.activo || a.excluida === true) return [];
  return [
    {
      id: 'antivirus:exclusion',
      revision: 'antivirus',
      gravedad: 'info',
      codigo: 'doctor.antivirus_sin_exclusion',
      datos: {},
      evidencia: {
        codigo: a.excluida === null ? 'antivirus_sin_leer' : 'antivirus_sin_exclusion',
        datos: {},
      },
      reparacion: {
        id: 'antivirus-exclusion',
        codigo: 'doctor.reparaciones.antivirus',
        requiereAdmin: true,
        soloInforma: true,
        comandoManual: d.plataforma.comandoManual({
          tipo: 'exclusion-antivirus',
          carpeta: d.carpetaDatos,
        }),
      },
    },
  ];
}
