import type { DepsDoctor, HallazgoInterno } from '../tipos';

/**
 * Rust con el toolchain MSVC necesita el enlazador de Visual Studio Build Tools (las
 * herramientas de C++). Solo se revisa si hay un toolchain de Rust instalado. Solo informa: la
 * instalación de las Build Tools (varios GB y permiso de administrador) la hace el usuario con el
 * comando que se muestra.
 */
export async function revisarEnlazadorMsvc(d: DepsDoctor): Promise<HallazgoInterno[]> {
  if (!d.rustInstalado || !(await d.rustInstalado())) return [];
  if (await d.plataforma.enlazadorMsvc()) return [];
  return [
    {
      id: 'enlazador-msvc:ausente',
      revision: 'enlazador-msvc',
      gravedad: 'info',
      codigo: 'doctor.enlazador_msvc_ausente',
      datos: {},
      evidencia: { codigo: 'enlazador_ausente', datos: {} },
      reparacion: {
        id: 'instalar-build-tools',
        codigo: 'doctor.reparaciones.instalar_build_tools',
        requiereAdmin: true,
        soloInforma: true,
        comandoManual: d.plataforma.comandoManual({ tipo: 'instalar-build-tools' }),
      },
    },
  ];
}
