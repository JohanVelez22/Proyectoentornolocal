import type { DepsDoctor, HallazgoInterno } from '../tipos';

/** Cuántas reglas se listan en la evidencia y en el comando (el resto se cuenta pero no se muestra). */
const MAX_REGLAS = 100;

/**
 * Reglas de entrada Allow para nginx, PHP, MySQL o PostgreSQL. Windows las crea cuando el usuario
 * acepta el aviso del cortafuegos ("permitir acceso") y dejan al programa abierto a la red: aquí
 * solo se leen y se muestra el comando para quitarlas. WolfCore Dev no toca el cortafuegos. Si no
 * se pueden leer (sin permisos), se informa "no se pudo comprobar", no un error.
 */
export async function revisarFirewall(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const r = await d.plataforma.reglasEntradaPermitidas();
  if (!r.ok) {
    return [
      {
        id: 'firewall:no-comprobado',
        revision: 'firewall',
        gravedad: 'info',
        codigo: 'doctor.firewall_no_comprobado',
        datos: {},
        evidencia:
          'No se pudieron leer las reglas del cortafuegos (puede hacer falta administrador).',
      },
    ];
  }
  if (r.reglas.length === 0) return [];
  const mostradas = r.reglas.slice(0, MAX_REGLAS);
  const perfiles = [...new Set(r.reglas.map((x) => x.perfil || '?'))].sort().join(', ');
  const programas = [...new Set(r.reglas.map((x) => x.programa))].sort();
  return [
    {
      id: 'firewall:reglas-entrada',
      revision: 'firewall',
      gravedad: 'aviso',
      codigo: 'doctor.firewall_reglas',
      datos: {
        cantidad: r.reglas.length,
        perfiles,
        programa: programas[0] ?? '',
      },
      evidencia: mostradas
        .map((x) => `${x.perfil || '?'} · ${x.programa} · ${x.nombreVisible || x.nombre}`)
        .join('\n'),
      reparacion: {
        id: 'quitar-reglas-firewall',
        codigo: 'doctor.reparaciones.firewall',
        requiereAdmin: true,
        soloInforma: true,
        comandoManual: d.plataforma.comandoManual({
          tipo: 'quitar-reglas-firewall',
          nombres: mostradas.map((x) => x.nombre),
        }),
      },
    },
  ];
}
