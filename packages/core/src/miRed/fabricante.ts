/**
 * Fabricante por el OUI (los tres primeros bytes de la MAC) con una tabla pequeña INCLUIDA en la
 * aplicación: no se descarga nada ni se consulta ningún servicio. Solo trae prefijos conocidos de
 * fabricantes muy comunes; lo que no está (y las direcciones aleatorias de los teléfonos) sale sin
 * fabricante. Los prefijos van en mayúsculas, sin separadores.
 */
const TABLA: Readonly<Record<string, string>> = {
  // Virtualización
  '000C29': 'VMware',
  '000569': 'VMware',
  '005056': 'VMware',
  '080027': 'VirtualBox',
  '00155D': 'Microsoft (Hyper-V)',
  // Raspberry Pi
  B827EB: 'Raspberry Pi',
  DCA632: 'Raspberry Pi',
  E45F01: 'Raspberry Pi',
  D83ADD: 'Raspberry Pi',
  // Apple
  '000393': 'Apple',
  '000A27': 'Apple',
  '000A95': 'Apple',
  '001124': 'Apple',
  '001451': 'Apple',
  '0016CB': 'Apple',
  '0017F2': 'Apple',
  '0019E3': 'Apple',
  '001B63': 'Apple',
  '001CB3': 'Apple',
  '001EC2': 'Apple',
  '0021E9': 'Apple',
  '002312': 'Apple',
  '002500': 'Apple',
  '0026BB': 'Apple',
  // Routers y puntos de acceso
  '50C7BF': 'TP-Link',
  '14CC20': 'TP-Link',
  EC086B: 'TP-Link',
  F4F26D: 'TP-Link',
  '00055D': 'D-Link',
  '000D88': 'D-Link',
  '001195': 'D-Link',
  '00095B': 'Netgear',
  '000FB5': 'Netgear',
  '00146C': 'Netgear',
  '001B2F': 'Netgear',
  '001E2A': 'Netgear',
  '00223F': 'Netgear',
  '24A43C': 'Ubiquiti',
  '44D9E7': 'Ubiquiti',
  '788A20': 'Ubiquiti',
  F09FC2: 'Ubiquiti',
  '00000C': 'Cisco',
  '000142': 'Cisco',
  '000143': 'Cisco',
  // Fabricantes de equipos
  '00065B': 'Dell',
  '000874': 'Dell',
  '000BDB': 'Dell',
  '000D56': 'Dell',
  '000F1F': 'Dell',
  '001143': 'Dell',
  '0001E6': 'Hewlett-Packard',
  '0001E7': 'Hewlett-Packard',
  '0002A5': 'Hewlett-Packard',
  '0004EA': 'Hewlett-Packard',
  '000802': 'Hewlett-Packard',
  '000883': 'Hewlett-Packard',
  '0002B3': 'Intel',
  '000347': 'Intel',
  '0007E9': 'Intel',
  '000E0C': 'Intel',
  '001302': 'Intel',
  '0000F0': 'Samsung',
  '001247': 'Samsung',
  '001599': 'Samsung',
  '001632': 'Samsung',
  '00E0FC': 'Huawei',
  // Dispositivos de casa
  '240AC4': 'Espressif',
  '30AEA4': 'Espressif',
  '3C71BF': 'Espressif',
  '5CCF7F': 'Espressif',
  A4CF12: 'Espressif',
  '000E58': 'Sonos',
  '5CAAFD': 'Sonos',
  '00FC8B': 'Amazon',
  '0C47C9': 'Amazon',
  '34D270': 'Amazon',
  '40B4CD': 'Amazon',
  '44650D': 'Amazon',
};

/** Prefijos de la tabla (para las pruebas). */
export const PREFIJOS_CONOCIDOS: readonly string[] = Object.keys(TABLA);

/** Dirección «administrada localmente» (bit 2 del primer byte): aleatoria o de una máquina virtual. */
export function esMacAleatoria(mac: string): boolean {
  const primero = parseInt(mac.replace(/[^0-9a-f]/gi, '').slice(0, 2), 16);
  return Number.isInteger(primero) && (primero & 2) === 2;
}

/** Fabricante por el OUI de la MAC, o null si no está en la tabla o la MAC es aleatoria. */
export function fabricantePorMac(mac: string): string | null {
  const limpia = mac.replace(/[^0-9a-f]/gi, '').toUpperCase();
  if (limpia.length !== 12 || esMacAleatoria(limpia)) return null;
  return TABLA[limpia.slice(0, 6)] ?? null;
}
