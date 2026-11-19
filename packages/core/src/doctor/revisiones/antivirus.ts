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
      evidencia:
        a.excluida === null
          ? 'El antivirus está activo; no se pudieron leer sus exclusiones (hace falta administrador)'
          : 'El antivirus está activo y la carpeta de datos de WolfCore Dev no está excluida',
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
