import { esReglaAcotada, type ReglaEntrada } from '../../plataforma/firewallWin';
import type { ReglaExportada } from '../../plataforma/firewallCambiosWin';
import {
  clasificarReal,
  quitarReglasPeligrosas,
  restaurables,
  restaurarReglas,
  type Objetivo,
  type ObjetivoRestaurar,
} from '../firewallCambios';
import { lineaTexto, type DepsDoctor, type Evidencia, type HallazgoInterno } from '../tipos';
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
 * Todos los campos de lo que se va a crear al restaurar: protocolo, puertos, direcciones, perfil…
 * Con los nombres de campo de netsh/PowerShell (`Profile`, `LocalPort`…): son términos técnicos
 * iguales en todos los idiomas, no frases.
 */
const lineaRestaurar = (r: ReglaExportada): string =>
  [
    `${r.nombreVisible || r.nombre} [${r.nombre}]`,
    r.programa,
    `Profile=${r.perfil || '?'}`,
    `${r.direccion}/${r.accion}`,
    `Protocol=${r.protocolo}`,
    `LocalPort=${r.puertoLocal.join(',') || 'Any'}`,
    `RemotePort=${r.puertoRemoto.join(',') || 'Any'}`,
    `LocalAddress=${r.direccionLocal.join(',') || 'Any'}`,
    `RemoteAddress=${r.direccionRemota.join(',') || 'Any'}`,
    r.habilitada ? 'Enabled' : 'Disabled',
  ].join(' · ');

const lista = (
  codigo: Evidencia['codigo'],
  datos: Evidencia['datos'],
  textos: string[],
): Evidencia => ({ codigo, datos, lineas: textos.map(lineaTexto) });

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
      evidencia: { codigo: 'firewall_no_comprobado', datos: {} },
    });
  }
  const propias: ReglaEntrada[] = [];
  const pruebas: ReglaEntrada[] = [];
  const acotadas: ReglaEntrada[] = [];
  const ajenas: ReglaEntrada[] = [];
  for (const x of r.reglas) {
    const o = (await clasificarReal(d, x.programa)).origen;
    if (o === 'ajena') ajenas.push(x);
    // Las acotadas a la red local (las que recomienda la propia app) no son peligrosas: se
    // muestran aparte, sin botón.
    else if (esReglaAcotada(x)) acotadas.push(x);
    else (o === 'propia' ? propias : pruebas).push(x);
  }
  const mias = [...propias, ...pruebas];
  if (mias.length > 0) {
    // Lo que se muestra es exactamente lo que la reparación puede quitar (y el usuario marca).
    const mostradas = mias.slice(0, MAX_REGLAS);
    const secciones = [
      ...propias.slice(0, MAX_REGLAS).map(linea),
      ...pruebas.slice(0, MAX_REGLAS).map(linea),
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
      evidencia: lista(
        'firewall_reglas',
        { propias: propias.length, pruebas: pruebas.length },
        secciones,
      ),
      elementos: mostradas.map((x) => ({ clave: x.nombre, texto: linea(x) })),
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
      aplicar: (seleccion) =>
        quitarReglasPeligrosas(d, objetivos, {
          confirmado: true,
          ...(seleccion ? { seleccion } : {}),
        }),
    });
  }
  if (acotadas.length > 0) {
    res.push({
      id: 'firewall:reglas-acotadas',
      revision: 'firewall',
      gravedad: 'info',
      codigo: 'doctor.firewall_reglas_acotadas',
      datos: { cantidad: acotadas.length },
      evidencia: lista('firewall_acotadas', {}, acotadas.slice(0, MAX_REGLAS).map(linea)),
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
      evidencia: lista('firewall_ajenas', {}, ajenas.slice(0, MAX_REGLAS).map(linea)),
    });
  }
  // Lo que se quitó antes y se puede recrear: solo de la copia protegida de la plataforma.
  const quitadas = (await restaurables(d)).slice(0, MAX_REGLAS);
  if (quitadas.length > 0) {
    const objetivos: ObjetivoRestaurar[] = quitadas.map((x) => ({
      id: x.registro.id,
      sha256: x.registro.sha256,
    }));
    res.push({
      id: 'firewall:quitadas',
      revision: 'firewall',
      gravedad: 'info',
      codigo: 'doctor.firewall_quitadas',
      datos: { cantidad: quitadas.length },
      evidencia: lista(
        'firewall_quitadas',
        {},
        quitadas.map((x) => lineaRestaurar(x.registro.regla)),
      ),
      elementos: quitadas.map((x) => ({
        clave: x.registro.id,
        texto: lineaRestaurar(x.registro.regla),
      })),
      reparacion: {
        id: 'restaurar-reglas-firewall',
        codigo: 'doctor.reparaciones.firewall_restaurar',
        requiereAdmin: true,
        soloInforma: false,
      },
      aplicar: (seleccion) =>
        restaurarReglas(d, objetivos, {
          confirmado: true,
          ...(seleccion ? { seleccion } : {}),
        }),
    });
  }
  return res;
}
