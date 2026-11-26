import type { DepsDoctor, HallazgoInterno } from '../tipos';
import { fallo, segunEscritura } from './comun';

/** Redistribuible de Visual C++ 2015+ x64 (PHP y otros binarios no arrancan sin él). */
export async function revisarVcRedist(d: DepsDoctor): Promise<HallazgoInterno[]> {
  if (await d.plataforma.vcRedistInstalado()) return [];
  return [
    {
      id: 'vcredist:ausente',
      revision: 'vcredist',
      gravedad: 'error',
      codigo: 'doctor.vcredist_ausente',
      datos: {},
      evidencia: { codigo: 'vcredist_ausente', datos: {} },
      reparacion: {
        id: 'instalar-vcredist',
        codigo: 'doctor.reparaciones.instalar_vcredist',
        requiereAdmin: true,
        soloInforma: false,
        comandoManual: d.plataforma.comandoManual({ tipo: 'instalar-vcredist' }),
      },
      aplicar: async () => {
        try {
          return segunEscritura(await d.plataforma.instalarVcRedist());
        } catch (e) {
          return fallo(e);
        }
      },
    },
  ];
}
