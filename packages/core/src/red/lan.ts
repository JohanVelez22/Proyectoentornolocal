import net from 'node:net';
import os from 'node:os';
import { ErrorWolf } from '../errores';
import { generarVhostProxy, type VhostsAuxiliares } from '../nginx/auxiliares';
import type { PerfilRed } from '../plataforma/firewallWin';
import type { Sitio } from '../tipos';

type Interfaces = NodeJS.Dict<os.NetworkInterfaceInfo[]>;

/** Prefijo de los vhosts de la red local (`lan-<sitio>`): los de los túneles empiezan por `tunel-`. */
export const PREFIJO_VHOST_LAN = 'lan-';
export const idVhostLan = (sitioId: string): string => `${PREFIJO_VHOST_LAN}${sitioId}`;
/**
 * Id del certificado de un sitio en la red local. Empieza por `_`, que el slug de un dominio nunca
 * produce: ningún sitio puede llamarse así y pisar el certificado de otro.
 */
export const idCertLan = (sitioId: string): string => `_lan-${sitioId}`;

/** Primer puerto de la red local y último que se prueba (cien sitios compartidos de sobra). */
export const PRIMER_PUERTO_LAN = 8100;
export const ULTIMO_PUERTO_LAN = 8199;

/**
 * Adaptadores que no son la red del usuario: máquinas virtuales, WSL, Docker, VPN y Tailscale
 * (compartir ahí lo expondría a una red que el usuario no eligió).
 */
const ADAPTADOR_VIRTUAL =
  /vethernet|vmware|virtualbox|vbox|docker|wsl|hyper-v|tailscale|zerotier|loopback|bluetooth|npcap|\bvpn\b|^(tun|tap|utun|br-|veth|virbr)/i;

function esPrivada(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = p as [number, number, number, number];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/**
 * Las IPv4 privadas de la red del usuario, en el orden del sistema: nunca loopback, nunca
 * 169.254/16 (sin DHCP), nunca el rango de Tailscale (100.64/10) ni adaptadores virtuales.
 * El sistema no dice cuál tiene puerta de enlace: la elección final la confirma el usuario.
 */
export function ipsLocales(interfaces: Interfaces = os.networkInterfaces()): string[] {
  const res: string[] = [];
  for (const [nombre, lista] of Object.entries(interfaces)) {
    if (ADAPTADOR_VIRTUAL.test(nombre)) continue;
    for (const i of lista ?? []) {
      const v4 = i.family === 'IPv4' || (i.family as unknown) === 4;
      if (!v4 || i.internal || !esPrivada(i.address)) continue;
      if (i.address.startsWith('169.254.') || res.includes(i.address)) continue;
      res.push(i.address);
    }
  }
  return res;
}

/** La IP que se anuncia por defecto (la primera de `ipsLocales`), o null si no hay red. */
export function ipLocal(interfaces?: Interfaces): string | null {
  return ipsLocales(interfaces)[0] ?? null;
}

/** ¿Se puede escuchar en `ip:puerto` ahora? (en la IP real: un puerto de 127.0.0.1 no basta). */
export function puertoLibreEn(ip: string, puerto: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.listen({ host: ip, port: puerto, exclusive: true }, () => s.close(() => resolve(true)));
  });
}

/**
 * Puerto de la red local de un sitio: `preferido` si sigue sirviendo; si no, el primero de
 * 8100–8199 que no esté en `ocupados` (instancias, puertos fijos, rangos reservados, otros
 * sitios compartidos) y se pueda abrir.
 */
export async function puertoLan(o: {
  ocupados: Iterable<number>;
  preferido?: number | null;
  probar: (puerto: number) => Promise<boolean>;
}): Promise<number> {
  const ocupados = new Set(o.ocupados);
  const pref = o.preferido;
  if (pref && !ocupados.has(pref) && (await o.probar(pref))) return pref;
  for (let p = PRIMER_PUERTO_LAN; p <= ULTIMO_PUERTO_LAN; p++) {
    if (ocupados.has(p)) continue;
    if (await o.probar(p)) return p;
  }
  throw new ErrorWolf(
    'lan.sin_puertos',
    `No hay puertos libres entre ${PRIMER_PUERTO_LAN} y ${ULTIMO_PUERTO_LAN} para la red local.`,
  );
}

export interface SitioCompartido {
  sitioId: string;
  url: string;
  ip: string;
  puerto: number;
  https: boolean;
}

export interface OpcionesActivarLan {
  /** El usuario confirmó (en la ventana) exponer el sitio a la red local; sin `true`, nada se abre. */
  confirmado: boolean;
  /** La IP que se le mostró: si ya no es una de la red local, no se abre (lo confirmado manda). */
  ip: string;
  https: boolean;
}

export interface DepsGestorLan {
  sitios: {
    listar(): Promise<Sitio[]>;
    editar(id: string, cambios: Partial<Sitio>): Promise<Sitio>;
  };
  vhosts: Pick<VhostsAuxiliares, 'agregar' | 'quitar' | 'quitarSinRecargar' | 'ids' | 'barrer'>;
  /** Certificado del sitio para la IP (emitido por la CA propia; la crea si falta). */
  certificado: (s: {
    id: string;
    dominio: string;
    alias: string[];
  }) => Promise<{ crt: string; key: string }>;
  /** Borra el `.crt` y el `.key` del certificado de un sitio (idempotente). */
  quitarCertificado: (id: string) => Promise<void>;
  /** Perfil de la red de esa IP (Windows: pública, privada, dominio); solo lectura. */
  perfilRedDe?: (ip: string) => Promise<PerfilRed | null>;
  /** Se llama con los dominios que se dejaron de compartir porque la IP ya no es de este equipo. */
  avisarRedCambio?: (dominios: string[]) => void;
  /** Puerto de Nginx al que se reenvía (donde viven los sitios por `server_name`). */
  puertoNginx: () => Promise<number>;
  interfaces?: () => Interfaces;
  /** Puertos que no se pueden usar: servicios, instancias, rangos reservados del sistema… */
  reservados: () => Promise<number[]>;
  probar?: (ip: string, puerto: number) => Promise<boolean>;
}

export function urlLan(https: boolean, ip: string, puerto: number): string {
  return `${https ? 'https' : 'http'}://${ip}:${puerto}`;
}

/**
 * Compartir un sitio en la red local. Cada sitio compartido tiene su `server` de Nginx
 * (`lan-<sitio>`, vhost auxiliar) que escucha SOLO en la IP elegida y en su propio puerto, y
 * reenvía a Nginx con el `Host` del sitio. Se quita al dejar de compartir, al cerrar la app y al
 * arrancar (`restaurar`): nada queda expuesto entre sesiones.
 */
export class GestorLan {
  private cola: Promise<unknown> = Promise.resolve();
  /** IP con la que está compartido cada sitio (en memoria: tras reiniciar no hay ninguno). */
  private readonly activos = new Map<string, string>();

  constructor(private readonly d: DepsGestorLan) {}

  private serializar<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.cola.then(fn, fn);
    this.cola = p.catch(() => undefined);
    return p;
  }

  private ips(): string[] {
    return ipsLocales(this.d.interfaces?.());
  }

  /**
   * Deja de compartir lo que está en una IP que ya no es de este equipo (cambió la red: el
   * `listen` no se podría abrir y Nginx no arrancaría). Quita el vhost sin recargar —quien llama
   * ya está a punto de generar o recargar la configuración—, marca el sitio y avisa. Devuelve los
   * dominios que se dejaron de compartir.
   */
  async podarRed(): Promise<string[]> {
    const ips = this.ips();
    const caidos = [...this.activos].filter(([, ip]) => !ips.includes(ip)).map(([id]) => id);
    if (caidos.length === 0) return [];
    const lista = await this.d.sitios.listar().catch(() => [] as Sitio[]);
    const dominios: string[] = [];
    for (const id of caidos) {
      this.activos.delete(id);
      await this.d.vhosts.quitarSinRecargar(idVhostLan(id));
      await this.d.quitarCertificado(idCertLan(id)).catch(() => undefined);
      dominios.push(lista.find((s) => s.id === id)?.dominio ?? id);
    }
    await this.marcarInactivo(caidos);
    this.d.avisarRedCambio?.(dominios);
    return dominios;
  }

  async estado(): Promise<{
    ips: string[];
    sitios: SitioCompartido[];
    /** Perfil de cada red (`null`: no se pudo leer). Una red pública merece un aviso. */
    perfiles: Record<string, PerfilRed | null>;
    /** Dominios que se dejaron de compartir en esta consulta porque la red cambió. */
    redCambio: string[];
  }> {
    const redCambio = await this.podarRed();
    const lista = await this.d.sitios.listar();
    const sitios: SitioCompartido[] = [];
    for (const s of lista) {
      const ip = this.activos.get(s.id);
      if (!ip || !s.lan?.activo) continue;
      sitios.push({
        sitioId: s.id,
        url: urlLan(s.lan.https, ip, s.lan.puerto),
        ip,
        puerto: s.lan.puerto,
        https: s.lan.https,
      });
    }
    const ips = this.ips();
    const perfiles: Record<string, PerfilRed | null> = {};
    for (const ip of ips) perfiles[ip] = (await this.d.perfilRedDe?.(ip).catch(() => null)) ?? null;
    return { ips, sitios, perfiles, redCambio };
  }

  activar(
    sitioId: string,
    o: OpcionesActivarLan,
  ): Promise<{ url: string; ip: string; puerto: number }> {
    return this.serializar(() => this.activarInterno(sitioId, o));
  }

  private async activarInterno(
    sitioId: string,
    o: OpcionesActivarLan,
  ): Promise<{ url: string; ip: string; puerto: number }> {
    const lista = await this.d.sitios.listar();
    const sitio = lista.find((s) => s.id === sitioId);
    if (!sitio) throw new ErrorWolf('lan.sitio_no_encontrado', 'Sitio no encontrado');
    // Con datos reales no se comparte en la red, ni con confirmación (como Expose): cualquiera en
    // esa red los vería sin contraseña.
    if (sitio.datosReales) {
      throw new ErrorWolf(
        'lan.datos_reales',
        `${sitio.dominio} tiene datos reales: no se comparte en la red local.`,
        { dominio: sitio.dominio },
      );
    }
    // Sin confirmación no se toca nada.
    if ((o as { confirmado?: unknown }).confirmado !== true) {
      throw new ErrorWolf(
        'lan.confirmacion_requerida',
        `${sitio.dominio}: compartirlo en la red local exige confirmarlo en la ventana de WolfCore Dev.`,
        { dominio: sitio.dominio },
      );
    }
    // El sitio redirige a HTTPS: sin TLS propio, el móvil iría a un dominio que no resuelve.
    if (sitio.redirigirHttps && !o.https) {
      throw new ErrorWolf(
        'lan.requiere_https',
        `${sitio.dominio} redirige a HTTPS: compártalo con HTTPS.`,
        { dominio: sitio.dominio },
      );
    }
    const ips = this.ips();
    if (ips.length === 0) {
      throw new ErrorWolf('lan.sin_red', 'No hay una red local conectada.');
    }
    // Solo una IP de la red local (nunca 0.0.0.0 ni una que ya no esté): lo confirmado manda.
    if (typeof o.ip !== 'string' || !ips.includes(o.ip)) {
      throw new ErrorWolf(
        'lan.ip_no_valida',
        'La IP de la red local cambió desde que se confirmó: confirme de nuevo.',
        { ip: typeof o.ip === 'string' ? o.ip.slice(0, 45) : '' },
      );
    }

    const ya = sitio.lan?.activo === true && this.activos.has(sitioId);
    const probar = this.d.probar ?? puertoLibreEn;
    const propios = lista
      .filter((s) => s.id !== sitioId && s.lan?.activo)
      .map((s) => s.lan!.puerto);
    const ajenos = lista
      .filter((s) => s.id !== sitioId)
      .flatMap((s) => [
        ...(s.puertoProxy ? [s.puertoProxy] : []),
        ...s.procesos.flatMap((p) => (p.puerto === null ? [] : [p.puerto])),
      ]);
    const puerto = await puertoLan({
      ocupados: [...(await this.d.reservados()), ...propios, ...ajenos],
      preferido: sitio.lan?.puerto ?? null,
      // Su propio puerto, si ya está compartido, lo ocupa él mismo.
      probar: async (p) => (ya && p === sitio.lan?.puerto) || probar(o.ip, p),
    });

    const ssl = o.https
      ? await this.d.certificado({ id: idCertLan(sitioId), dominio: o.ip, alias: [] })
      : undefined;
    await this.d.vhosts.agregar(
      idVhostLan(sitioId),
      generarVhostProxy({
        escucha: o.ip,
        puerto,
        destino: await this.d.puertoNginx(),
        host: sitio.dominio,
        ...(ssl ? { ssl } : {}),
      }),
    );
    try {
      await this.d.sitios.editar(sitioId, { lan: { activo: true, puerto, https: o.https } });
    } catch (e) {
      await this.d.vhosts.quitar(idVhostLan(sitioId)).catch(() => undefined);
      throw e;
    }
    this.activos.set(sitioId, o.ip);
    return { url: urlLan(o.https, o.ip, puerto), ip: o.ip, puerto };
  }

  /** Un puerto libre del rango de la red local en esa IP, para el servidor de la CA del móvil. */
  async puertoParaCa(ip: string): Promise<number> {
    const lista = await this.d.sitios.listar();
    const probar = this.d.probar ?? puertoLibreEn;
    return puertoLan({
      ocupados: [
        ...(await this.d.reservados()),
        ...lista.filter((s) => s.lan?.activo).map((s) => s.lan!.puerto),
      ],
      probar: (p) => probar(ip, p),
    });
  }

  desactivar(sitioId: string): Promise<void> {
    return this.serializar(async () => {
      await this.d.vhosts.quitar(idVhostLan(sitioId));
      await this.d.quitarCertificado(idCertLan(sitioId)).catch(() => undefined);
      this.activos.delete(sitioId);
      await this.marcarInactivo([sitioId]);
    });
  }

  /** Al cerrar la app: quita todos los `server` de la red local y los marca apagados. */
  apagarTodo(): Promise<void> {
    return this.serializar(async () => {
      const ids = await this.d.vhosts.ids(PREFIJO_VHOST_LAN);
      for (const id of ids) {
        await this.d.vhosts.quitar(id);
        await this.d
          .quitarCertificado(idCertLan(id.slice(PREFIJO_VHOST_LAN.length)))
          .catch(() => undefined);
      }
      this.activos.clear();
      const lista = await this.d.sitios.listar().catch(() => [] as Sitio[]);
      await this.marcarInactivo(lista.filter((s) => s.lan?.activo).map((s) => s.id));
    });
  }

  /** Al arrancar: lo que una caída dejó (vhost o marca de "compartido") se limpia. */
  restaurar(): Promise<void> {
    return this.apagarTodo();
  }

  private async marcarInactivo(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const lista = await this.d.sitios.listar().catch(() => [] as Sitio[]);
    for (const id of ids) {
      const s = lista.find((x) => x.id === id);
      if (!s?.lan?.activo) continue;
      // Un sitio que ya no se puede editar (carpeta borrada…) no impide apagar los demás.
      await this.d.sitios
        .editar(id, { lan: { ...s.lan, activo: false } })
        .catch((e: unknown) => console.error('No se pudo marcar el sitio como no compartido:', e));
    }
  }
}
