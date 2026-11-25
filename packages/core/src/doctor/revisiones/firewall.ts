import os from 'node:os';
import type { ReglaEntrada } from '../../plataforma/firewallWin';
import type { DepsDoctor, HallazgoInterno } from '../tipos';

/** Cuántas reglas se listan en la evidencia y en el comando (el resto se cuenta pero no se muestra). */
const MAX_REGLAS = 100;

/** Ruta en minúsculas, con `/`, sin barra final ni variables sin expandir (las de Windows son sin distinguir mayúsculas). */
function normalizar(ruta: string): string {
  return ruta
    .replace(/^"|"$/g, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .toLowerCase();
}

const bajo = (ruta: string, carpeta: string): boolean =>
  carpeta !== '' && (ruta === carpeta || ruta.startsWith(`${carpeta}/`));

/** Carpetas que dejan las pruebas de WolfCore Dev bajo la carpeta temporal. */
const RESTO_PRUEBA =
  /\/(pel-int-[^/]*|pel-etapa-[^/]*|pel-vhost-real-[^/]*|scratchpad\/ngx[^/]*)\//;

export type Origen = 'propia' | 'prueba' | 'ajena';

/**
 * De quién es una regla según la ruta del programa: `propia` si cuelga de la carpeta de datos de
 * WolfCore Dev; `prueba` si es un resto de pruebas de WolfCore bajo la carpeta temporal; `ajena`
 * el resto (FlyEnv, Laragon, XAMPP, el propio PHP o MySQL del usuario…). Solo las dos primeras
 * pueden entrar en un comando de limpieza.
 */
export function origenDeRegla(
  programa: string,
  carpetaDatos: string,
  carpetaTemporal: string,
): Origen {
  const p = normalizar(programa);
  // Una ruta con variables sin expandir o relativa nunca se atribuye a WolfCore Dev.
  if (p.includes('%') || p.includes('..') || !/^([a-z]:)?\//.test(p)) return 'ajena';
  if (bajo(p, normalizar(carpetaDatos))) return 'propia';
  const tmp = normalizar(carpetaTemporal);
  if ((bajo(p, tmp) || /\/temp\//.test(p)) && RESTO_PRUEBA.test(p)) return 'prueba';
  return 'ajena';
}

const perfiles = (rs: ReglaEntrada[]): string =>
  [...new Set(rs.map((x) => x.perfil || '?'))].sort().join(', ');

const linea = (x: ReglaEntrada): string =>
  `${x.perfil || '?'} · ${x.programa} · ${x.nombreVisible || x.nombre}`;

/**
 * Reglas de entrada Allow para nginx, PHP, MySQL o PostgreSQL. Windows las crea cuando el usuario
 * acepta el aviso del cortafuegos ("permitir acceso") y dejan al programa abierto a la red. Aquí
 * solo se leen: el comando para quitarlas lleva únicamente las de WolfCore Dev (su carpeta de
 * datos y los restos de sus pruebas); las de otros programas (FlyEnv, Laragon, XAMPP…) se
 * muestran como información y nunca entran en el comando. Si no se pueden leer (sin permisos),
 * se informa "no se pudo comprobar", no un error.
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
  const tmp = d.carpetaTemporal ?? os.tmpdir();
  const propias: ReglaEntrada[] = [];
  const pruebas: ReglaEntrada[] = [];
  const ajenas: ReglaEntrada[] = [];
  for (const x of r.reglas) {
    const o = origenDeRegla(x.programa, d.carpetaDatos, tmp);
    (o === 'propia' ? propias : o === 'prueba' ? pruebas : ajenas).push(x);
  }
  const res: HallazgoInterno[] = [];
  const mias = [...propias, ...pruebas];
  if (mias.length > 0) {
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
        soloInforma: true,
        comandoManual: d.plataforma.comandoManual({
          tipo: 'quitar-reglas-firewall',
          nombres: mostradas.map((x) => x.nombre),
        }),
      },
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
  return res;
}
