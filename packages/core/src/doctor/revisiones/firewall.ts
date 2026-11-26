import type { ReglaEntrada } from '../../plataforma/firewallWin';
import {
  clasificarReal,
  quitarReglasPeligrosas,
  restaurables,
  restaurarReglas,
  type Objetivo,
} from '../firewallCambios';
import type { DepsDoctor, HallazgoInterno } from '../tipos';
import { origenDeRegla, type Origen } from './firewallOrigen';

export { origenDeRegla, type Origen };

/** Cuántas reglas se listan en la evidencia y en el comando (el resto se cuenta pero no se muestra). */
const MAX_REGLAS = 100;

const perfiles = (rs: { perfil: string }[]): string =>
  [...new Set(rs.map((x) => x.perfil || '?'))].sort().join(', ');

/** Nombre, programa, perfil y dirección: lo que el usuario ve antes de confirmar. */
const linea = (x: {
  nombre: string;
  nombreVisible: string;
  perfil: string;
  programa: string;
}): string =>
  `${x.nombreVisible || x.nombre} [${x.nombre}] · ${x.programa} · ${x.perfil || '?'} · Inbound/Allow`;

/**
 * Reglas de entrada Allow para nginx, PHP, bases de datos y demás servicios de WolfCore Dev.
 * Windows las crea cuando el usuario acepta el aviso del cortafuegos ("permitir acceso") y dejan
 * al programa abierto a la red. La reparación (D46, solo con confirmación y UAC) quita ÚNICAMENTE
 * las de WolfCore Dev (su carpeta de datos y los restos de sus pruebas), por su `Name` exacto;
 * las de otros programas (FlyEnv, Laragon, XAMPP…) se muestran como información y nunca se
 * tocan. Si no se pueden leer (sin permisos), se informa "no se pudo comprobar", no un error.
 */
export async function revisarFirewall(d: DepsDoctor): Promise<HallazgoInterno[]> {
  const res: HallazgoInterno[] = [];
  const r = await d.plataforma.reglasEntradaPermitidas();
  if (!r.ok) {
    res.push({
      id: 'firewall:no-comprobado',
      revision: 'firewall',
      gravedad: 'info',
      codigo: 'doctor.firewall_no_comprobado',
      datos: {},
      evidencia:
        'No se pudieron leer las reglas del cortafuegos (puede hacer falta administrador).',
    });
  }
  const propias: ReglaEntrada[] = [];
  const pruebas: ReglaEntrada[] = [];
  const ajenas: ReglaEntrada[] = [];
  for (const x of r.reglas) {
    const o = (await clasificarReal(d, x.programa)).origen;
    (o === 'propia' ? propias : o === 'prueba' ? pruebas : ajenas).push(x);
  }
  const mias = [...propias, ...pruebas];
  if (mias.length > 0) {
    // Lo que se muestra es exactamente lo que la reparación quita.
    const mostradas = mias.slice(0, MAX_REGLAS);
    const secciones = [
      ...(propias.length ? ['WolfCore Dev:', ...propias.slice(0, MAX_REGLAS).map(linea)] : []),
      ...(pruebas.length
        ? [
            `Restos de pruebas de WolfCore (${pruebas.length}):`,
            ...pruebas.slice(0, MAX_REGLAS).map(linea),
          ]
        : []),
    ];
    const objetivos: Objetivo[] = mostradas.map((x) => ({
      nombre: x.nombre,
      programa: x.programa,
    }));
    res.push({
      id: 'firewall:reglas-entrada',
      revision: 'firewall',
      gravedad: 'aviso',
      codigo: 'doctor.firewall_reglas',
      datos: {
        cantidad: mias.length,
        perfiles: perfiles(mias),
        programa: mias[0]!.programa,
      },
      evidencia: secciones.join('\n'),
      reparacion: {
        id: 'quitar-reglas-firewall',
        codigo: 'doctor.reparaciones.firewall',
        requiereAdmin: true,
        soloInforma: false,
        comandoManual: d.plataforma.comandoManual({
          tipo: 'quitar-reglas-firewall',
          nombres: mostradas.map((x) => x.nombre),
        }),
      },
      // Solo se llega aquí por `Doctor.reparar`, que exige `confirmacion === true`.
      aplicar: () => quitarReglasPeligrosas(d, objetivos, { confirmado: true }),
    });
  }
  if (ajenas.length > 0) {
    // Información: no son de WolfCore Dev (FlyEnv, Laragon, XAMPP…), nunca entran en un comando.
    res.push({
      id: 'firewall:reglas-ajenas',
      revision: 'firewall',
      gravedad: 'info',
      codigo: 'doctor.firewall_reglas_ajenas',
      datos: { cantidad: ajenas.length, perfiles: perfiles(ajenas) },
      evidencia: ajenas.slice(0, MAX_REGLAS).map(linea).join('\n'),
    });
  }
  // Lo que se quitó antes y se puede recrear (el registro es de WolfCore Dev, no del cortafuegos).
  const quitadas = (await restaurables(d)).slice(0, MAX_REGLAS);
  if (quitadas.length > 0) {
    const objetivos: Objetivo[] = quitadas.map((x) => ({
      nombre: x.entrada.nombre,
      programa: x.entrada.programa,
    }));
    res.push({
      id: 'firewall:quitadas',
      revision: 'firewall',
      gravedad: 'info',
      codigo: 'doctor.firewall_quitadas',
      datos: { cantidad: quitadas.length },
      evidencia: quitadas
        .map((x) => linea({ ...x.entrada, nombreVisible: x.entrada.regla.nombreVisible }))
        .join('\n'),
      reparacion: {
        id: 'restaurar-reglas-firewall',
        codigo: 'doctor.reparaciones.firewall_restaurar',
        requiereAdmin: true,
        soloInforma: false,
      },
      aplicar: () => restaurarReglas(d, objetivos, { confirmado: true }),
    });
  }
  return res;
}
