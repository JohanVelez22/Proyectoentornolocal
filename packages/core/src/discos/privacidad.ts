/**
 * Privacidad de la salud de los discos (D57): ningún número de serie ni identificador único sale
 * de aquí. Lo ideal es no leerlos (los scripts no los piden); esto enmascara lo que llegara por
 * error dentro de un texto del sistema.
 */

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/g;

/**
 * Lo que no puede formar parte de una palabra (se usa en vez de `\b`). El guion bajo cuenta como
 * SEPARADOR: en `WD_WCC4E1234567` o `Disk_S4EWNX0R123456A` la serie va tras un `_` y se tapa.
 */
const FUERA = '(?<![A-Za-z0-9])';
const FIN = '(?![A-Za-z0-9])';

/**
 * Una palabra larga (≥ 16) que mezcla letras y cifras parece un número de serie o un identificador:
 * se tapa. Un modelo normal (`Samsung SSD 970 EVO Plus 1TB`) no la tiene.
 */
const PARECE_SERIE = new RegExp(
  `${FUERA}(?=[A-Za-z0-9]*\\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{16,}${FIN}`,
  'g',
);
/**
 * Series más cortas (`S4EWNX0R123456A`, `WX12A1234567`, `21025A801234`, `1907E1A2B3C4`): 10 o más
 * caracteres alfanuméricos seguidos con al menos 6 cifras entre ellos. Con guion (`WD-WCC4E1234567`)
 * la parte con las cifras es la que se tapa.
 */
const PARECE_SERIE_CORTA = new RegExp(`${FUERA}(?=(?:[A-Za-z]*\\d){6})[A-Za-z0-9]{10,}${FIN}`, 'g');
/** EUI/NGUID de un NVMe: `0025_3852_1170_0B5C.` (con el punto final del sistema) y `eui.0025385211700000`. */
const PARECE_EUI_GRUPOS = new RegExp(`${FUERA}(?:[0-9A-Fa-f]{4}_){3}[0-9A-Fa-f]{4}\\.?`, 'g');
const PARECE_EUI_PREFIJO = new RegExp(`${FUERA}(?:eui|nguid)\\.[0-9a-f]{16,32}${FIN}`, 'gi');
/** GUID. */
const PARECE_GUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
/** `0x` + 16 o más cifras hexadecimales (identificadores de bajo nivel). */
const PARECE_HEX_LARGO = /\b0x[0-9a-f]{16,}\b/gi;

/**
 * `serieCorta` (por defecto sí) añade la regla de las series de 10 o más caracteres con 6 cifras. Los
 * MODELOS (`ST2000DM008`, `HDS721010CLA332`) tienen esa misma forma y no se pueden distinguir de una
 * serie corta, así que `modeloSeguro` la desactiva y solo tapa lo inequívoco (largos, EUI, GUID).
 */
export function enmascararSerie(texto: string, opciones: { serieCorta?: boolean } = {}): string {
  const base = texto
    .replace(PARECE_EUI_PREFIJO, '…')
    .replace(PARECE_EUI_GRUPOS, '…')
    .replace(PARECE_GUID, '…')
    .replace(PARECE_HEX_LARGO, '…')
    .replace(PARECE_SERIE, '…');
  return opciones.serieCorta === false ? base : base.replace(PARECE_SERIE_CORTA, '…');
}

/**
 * Ruta de usuario (`C:\Users\nombre\…`, `\Users\nombre\…` sin unidad, `\\?\C:\Users\…` y
 * `\Device\HarddiskVolume3\Users\…`), también con `/`. El nombre puede llevar espacios: se tapa
 * entero hasta el siguiente separador y el resto de la ruta hasta el primer espacio.
 */
const RUTA_USUARIO =
  /(?:\\\\\?\\)?(?:[A-Za-z]:|\\Device\\HarddiskVolume\d+)?[\\/]+Users[\\/]+[^\\/"'<>|\r\n]{1,64}(?:[\\/][^\s"'<>|]*)?/gi;
/** Ruta de red `\\servidor\recurso\…` (no las de dispositivo `\\?\` ni `\\.\`). */
const RUTA_UNC = /\\\\(?![?.])[^\\/\s"'<>|]+(?:[\\/][^\s"'<>|]*)?/g;
/**
 * Ruta de instancia de un dispositivo (`SCSI\Disk&Ven_…\5&1a2b3c4d&0&000000`,
 * `USBSTOR\Disk&Ven_…\0123456789ABCDEF&0`) y su forma de interfaz (`\\?\SCSI#Disk&Ven_…#{guid}`).
 */
const RUTA_INSTANCIA =
  /(?<![A-Za-z0-9_])[A-Za-z]{2,12}\\(?:[^\s\\"'<>|]+\\)+[0-9A-Za-z_]*&[^\s"'<>|]+/g;
const RUTA_INTERFAZ = /\\\\[?.]\\[A-Za-z]{2,12}#[^\s"'<>|]+/g;

/** Nombre del equipo y del usuario de Windows (`COMPUTERNAME`, `USERNAME`), que da la plataforma. */
export interface IdentidadLocal {
  equipo?: string | null;
  usuario?: string | null;
}

const escaparRegex = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tapa el nombre del equipo y del usuario donde aparezcan como palabra (sin mayúsculas ni minúsculas). */
function taparIdentidad(texto: string, id: IdentidadLocal): string {
  let t = texto;
  for (const [valor, marca] of [
    [id.equipo, '[equipo]'],
    [id.usuario, '[usuario]'],
  ] as const) {
    const v = (valor ?? '').trim();
    // Los nombres de 1 o 2 caracteres también se tapan, pero SOLO como palabra completa y sin
    // distinguir mayúsculas: en un texto con un usuario «a» se verá «[usuario]» donde diga «a». Es
    // el precio de no dejar salir un nombre corto; los rodeados de letras o cifras no se tocan.
    if (v === '') continue;
    t = t.replace(
      new RegExp(`(?<![\\p{L}\\p{N}_])${escaparRegex(v)}(?![\\p{L}\\p{N}_])`, 'giu'),
      marca,
    );
  }
  return t;
}

/** Tope de caracteres que se miran antes de enmascarar (lo demás nunca se vería). */
const MAX_ENTRADA = 20_000;

/**
 * Texto del sistema listo para mostrar o copiar: sin caracteres de control, sin rutas de usuario
 * ni de red, sin rutas de instancia de dispositivos, sin identificadores que parezcan series, sin
 * el nombre del equipo ni del usuario y acotado. Se enmascara ANTES de recortar: un identificador
 * partido por el corte no se escaparía.
 */
export function sanearTextoSistema(
  texto: unknown,
  max = 300,
  identidad: IdentidadLocal = {},
): string {
  if (typeof texto !== 'string') return '';
  const t = taparIdentidad(
    texto
      .slice(0, MAX_ENTRADA)
      .replace(CONTROL, ' ')
      .replace(RUTA_USUARIO, '[ruta de usuario]')
      .replace(RUTA_UNC, '[ruta de red]')
      .replace(RUTA_INTERFAZ, '[dispositivo]')
      .replace(RUTA_INSTANCIA, '[dispositivo]')
      .replace(/\s+/g, ' ')
      .trim(),
    identidad,
  );
  const sinSerie = enmascararSerie(t);
  return sinSerie.length > max ? `${sinSerie.slice(0, max).trimEnd()}…` : sinSerie;
}

/** Token con al menos una cifra: lo que sigue a un separador y parece una serie, no un nombre. */
const CON_CIFRA = '(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]';
/** `Disk_S4EWNX0R123456A`: el token con cifras tras un guion bajo (6 o más caracteres). */
const TRAS_GUION_BAJO = new RegExp(`(?<=_)${CON_CIFRA}{6,}${FIN}`, 'g');
/**
 * `WD-WCC4E1234567`: el token con cifras (8 o más) tras el prefijo de un fabricante y un guion. Un
 * modelo como `WD10EZEX-08WN4A0` o `ST4000DM004-2CV104` no empieza por el prefijo solo.
 */
const TRAS_PREFIJO_FABRICANTE = new RegExp(
  `(${FUERA}(?:WDC|WD|HGST|ST|SEAGATE|TOSHIBA|SAMSUNG|MAXTOR|HITACHI)-)${CON_CIFRA}{8,}${FIN}`,
  'gi',
);

/** Tapa lo que va detrás de `_` o de un prefijo de fabricante con guion y parece una serie. */
const taparTrasSeparador = (t: string): string =>
  t.replace(TRAS_GUION_BAJO, '…').replace(TRAS_PREFIJO_FABRICANTE, '$1…');

/**
 * Modelo del disco: texto corto, sin control y sin lo que parezca una serie; null si queda vacío.
 * No aplica la regla de las series cortas (`serieCorta: false`): `ST2000DM008` o `HDS721010CLA332`
 * son modelos y deben verse. Las series largas, los EUI y los GUID se siguen tapando.
 */
export function modeloSeguro(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = taparTrasSeparador(
    enmascararSerie(v.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim(), {
      serieCorta: false,
    }),
  )
    .slice(0, 80)
    .trim();
  return t === '' || /^[…\s]+$/.test(t) ? null : t;
}
