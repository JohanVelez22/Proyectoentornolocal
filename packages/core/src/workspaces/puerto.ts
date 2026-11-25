import { ErrorWolf } from '../errores';
import type { EstadoProceso, Supervisor } from '../procesos/supervisor';
import type { ProcesosProyecto } from '../proyectos/procesos';
import { idSupervisor } from '../proyectos/procesos';
import type { ServicioPhp } from '../servicios/php';
import type { ServiciosDatos } from '../servicios/definicion';
import type { Servicios } from '../servicios/servicios';
import type { Config, ElementoWorkspace, IdInstancia, IdServicioDatos, Sitio } from '../tipos';
import type { PuertoWorkspaces } from './workspaces';

const CAPTADORES: readonly IdServicioDatos[] = ['mailpit', 'smtp4dev', 'inbucket', 'papercut'];

export interface DepsPuertoWorkspaces {
  servicios: Pick<
    Servicios,
    'iniciar' | 'detener' | 'ramasPhpEnUso' | 'esperarSaludDe' | 'baseSinResponderDe'
  > & {
    datos: Pick<ServiciosDatos, 'listaInstancias'>;
    php: Pick<ServicioPhp, 'idTrabajador'>;
  };
  supervisor: Pick<Supervisor, 'estado'>;
  /** Los procesos de los proyectos: su `iniciar` ya exige la confianza en los sitios de un perfil. */
  procesos: Pick<ProcesosProyecto, 'iniciar' | 'detener'>;
  leerSitios: () => Promise<Sitio[]>;
  leerConfig: () => Promise<Config>;
  /** ¿Hay alguna versión de Nginx instalada? */
  nginxInstalado: () => Promise<boolean>;
}

const enMarcha = (e: EstadoProceso): boolean => e === 'encendido' || e === 'iniciando';

/** Servicio de datos de un elemento (`mysql`, `ollama`…), o null si es Nginx, PHP o un proceso. */
function servicioDatos(e: ElementoWorkspace): IdServicioDatos | null {
  if (e.tipo === 'instancia') return e.id.slice(0, e.id.indexOf('@')) as IdServicioDatos;
  if (e.tipo === 'servicio' && e.id !== 'nginx' && e.id !== 'php') return e.id;
  return null;
}

/**
 * Lo que un workspace puede hacer sobre el resto del núcleo. Todo pasa por las mismas puertas de la
 * aplicación: `Servicios.iniciar` (puertos, instancias bloqueadas, grupo exclusivo de captadores),
 * `ProcesosProyecto.iniciar` (los procesos de un sitio importado de un perfil no arrancan sin
 * confianza) y la comprobación de que la base local de un proyecto responde antes de arrancar sus
 * procesos. No hay ninguna dependencia de túneles ni de la red local: un workspace nunca abre un
 * túnel ni comparte en la LAN.
 */
export function crearPuertoWorkspaces(d: DepsPuertoWorkspaces): PuertoWorkspaces {
  const instanciaDe = async (e: ElementoWorkspace) => {
    if (e.tipo === 'instancia') {
      return (await d.servicios.datos.listaInstancias()).find((i) => i.id === e.id) ?? null;
    }
    const s = servicioDatos(e);
    if (s === null) return null;
    return (await d.servicios.datos.listaInstancias(s)).find((i) => i.predeterminada) ?? null;
  };

  const trabajadoresPhp = async (rama: string): Promise<string[]> => {
    const n = (await d.leerConfig()).servicios.php.trabajadores;
    return Array.from({ length: n }, (_, i) => d.servicios.php.idTrabajador(rama, i));
  };

  const buscarProceso = async (e: Extract<ElementoWorkspace, { tipo: 'proceso' }>) => {
    const sitio = (await d.leerSitios()).find((s) => s.id === e.sitioId);
    return sitio?.procesos.some((p) => p.id === e.procesoId) === true;
  };

  /** Referencia con la que `Servicios` enciende la instancia de datos del elemento. */
  const refDatos = (e: ElementoWorkspace): IdServicioDatos | IdInstancia =>
    (e.tipo === 'instancia' ? e.id : e.tipo === 'servicio' ? e.id : '') as
      IdServicioDatos | IdInstancia;

  return {
    async existe(e) {
      if (e.tipo === 'proceso') return buscarProceso(e);
      if (e.tipo === 'servicio' && e.id === 'nginx') return d.nginxInstalado();
      if (e.tipo === 'servicio' && e.id === 'php')
        return (await d.servicios.ramasPhpEnUso()).length > 0;
      return (await instanciaDe(e)) !== null;
    },

    async encendido(e) {
      if (e.tipo === 'proceso') {
        return enMarcha(d.supervisor.estado(idSupervisor(e.sitioId, e.procesoId)));
      }
      if (e.tipo === 'servicio' && e.id === 'nginx') return enMarcha(d.supervisor.estado('nginx'));
      if (e.tipo === 'servicio' && e.id === 'php') {
        for (const rama of await d.servicios.ramasPhpEnUso()) {
          for (const id of await trabajadoresPhp(rama)) {
            if (enMarcha(d.supervisor.estado(id))) return true;
          }
        }
        return false;
      }
      const inst = await instanciaDe(e);
      return inst !== null && enMarcha(inst.estado);
    },

    async encendidosExclusivos(e) {
      const propio = servicioDatos(e);
      if (propio === null || !CAPTADORES.includes(propio)) return [];
      const res: ElementoWorkspace[] = [];
      for (const otro of CAPTADORES) {
        if (otro === propio) continue;
        const inst = (await d.servicios.datos.listaInstancias(otro)).find((i) => i.predeterminada);
        if (inst && enMarcha(inst.estado)) {
          res.push({
            tipo: 'servicio',
            id: otro as 'mailpit' | 'smtp4dev' | 'inbucket' | 'papercut',
          });
        }
      }
      return res;
    },

    async iniciar(e) {
      if (e.tipo === 'proceso') {
        // Su base local debe responder: si no, el proceso se caería al instante.
        const motivo = await d.servicios.baseSinResponderDe(e.sitioId);
        if (motivo !== null) {
          throw new ErrorWolf(
            'workspaces.base_no_responde',
            `${e.sitioId}/${e.procesoId}: ${motivo}`,
            { elemento: `${e.sitioId}/${e.procesoId}` },
          );
        }
        await d.procesos.iniciar(e.sitioId, e.procesoId);
        return;
      }
      if (e.tipo === 'servicio' && e.id === 'nginx') {
        await d.servicios.iniciar('nginx');
        return;
      }
      if (e.tipo === 'servicio' && e.id === 'php') {
        let primero: unknown;
        for (const rama of await d.servicios.ramasPhpEnUso()) {
          try {
            await d.servicios.iniciar(`php-${rama}`);
          } catch (err) {
            primero ??= err;
          }
        }
        if (primero !== undefined) throw primero;
        return;
      }
      const ref = refDatos(e);
      await d.servicios.iniciar(ref);
      // Los datos se esperan: lo que arranca después los necesita respondiendo.
      await d.servicios.esperarSaludDe(ref);
    },

    async detener(e) {
      if (e.tipo === 'proceso') {
        await d.procesos.detener(e.sitioId, e.procesoId);
        return;
      }
      if (e.tipo === 'servicio' && e.id === 'nginx') {
        await d.servicios.detener('nginx');
        return;
      }
      if (e.tipo === 'servicio' && e.id === 'php') {
        let primero: unknown;
        for (const rama of await d.servicios.ramasPhpEnUso()) {
          try {
            await d.servicios.detener(`php-${rama}`);
          } catch (err) {
            primero ??= err;
          }
        }
        if (primero !== undefined) throw primero;
        return;
      }
      await d.servicios.detener(refDatos(e));
    },
  };
}
