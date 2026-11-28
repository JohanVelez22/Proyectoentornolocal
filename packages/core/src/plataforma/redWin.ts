import { esPrivadaRfc1918 } from '../miRed/rfc1918';
import { interpretarPerfilRed, type PerfilRed } from './firewallWin';

/**
 * Lecturas y acciones de red de Windows para «Mi red» (D53): carpetas compartidas de este equipo,
 * adaptadores, tabla ARP, ping y carpetas compartidas de otro equipo. Los scripts de PowerShell
 * solo LEEN (Get-SmbShare, Get-NetIPAddress, Get-NetNeighbor…); lo único que cambia algo es
 * `scriptQuitarCarpeta`, que corre elevado (UAC) y solo tras la confirmación de la persona.
 *
 * La salida de PowerShell viaja como JSON en Base64 de UTF-8: nombres con tildes o caracteres no
 * latinos llegan intactos sin depender de la página de códigos de la consola.
 */

/** Carpeta o recurso que ESTE equipo comparte (Get-SmbShare). */
export interface CarpetaCompartida {
  nombre: string;
  /** Carpeta local que se comparte (vacía en los recursos sin carpeta, como IPC$). */
  ruta: string;
  descripcion: string;
  tipo: 'carpeta' | 'impresora' | 'otro';
  /** Administrativa o especial (`C$`, `ADMIN$`, `IPC$`, `print$`…): nunca se deja de compartir desde la app. */
  administrativa: boolean;
  /** Termina en `$`: no aparece al explorar la red. */
  oculta: boolean;
  usuarios: number | null;
}

/** IPv4 de un adaptador, con su perfil de red de Windows. */
export interface AdaptadorRed {
  indice: number;
  nombre: string;
  ip: string;
  prefijo: number;
  /** Tiene la ruta por defecto de menor costo: es la red por la que sale este equipo. */
  predeterminado: boolean;
  /** `null` si Windows no dio el perfil. */
  perfil: PerfilRed | null;
}

/** Fila de la tabla ARP (Get-NetNeighbor). La MAC va en minúsculas con `:`. */
export interface VecinoRed {
  ip: string;
  mac: string;
  estado: string;
  indice: number;
}

export interface OpcionesPing {
  /** 1 a 10 paquetes. */
  intentos: number;
  /** Plazo de cada respuesta, en milisegundos (100 a 5000). */
  plazoMs: number;
  /** Cancela y mata el proceso. */
  senal?: AbortSignal;
}

export interface ResultadoPing {
  enviados: number;
  recibidos: number;
  /** Tiempo de cada respuesta recibida, en ms (0 = menos de 1 ms). */
  tiemposMs: number[];
  cancelado: boolean;
}

/** Recurso compartido de OTRO equipo, tal como lo lista `net view`. */
export interface RecursoRed {
  nombre: string;
  /** Tipo tal como lo escribe el sistema (idioma de Windows): «Disco», «Disk», «Print»… */
  tipo: string;
  comentario: string;
}

export type MotivoSinRecursos = 'denegado' | 'inaccesible' | 'error';
export type ResultadoRecursos =
  { ok: true; recursos: RecursoRed[] } | { ok: false; motivo: MotivoSinRecursos };

/** Tope de paquetes por ping y plazos admitidos. */
export const MAX_INTENTOS_PING = 10;
export const MIN_PLAZO_PING_MS = 100;
export const MAX_PLAZO_PING_MS = 5000;

const MODULOS =
  "$env:PSModulePath = [IO.Path]::Combine([Environment]::SystemDirectory, 'WindowsPowerShell', 'v1.0', 'Modules')";
const SALIDA_BASE64 =
  '[Console]::Out.WriteLine([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($j)))';

/** Texto entre comillas simples de PowerShell (también duplica las comillas tipográficas). */
const literal = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;

/** Decodifica la salida (JSON en Base64) y siempre devuelve una lista; null si no se pudo leer. */
function decodificarLista(salida: string): Record<string, unknown>[] | null {
  const limpio = salida.trim();
  if (limpio === '') return [];
  try {
    const datos: unknown = JSON.parse(Buffer.from(limpio, 'base64').toString('utf8'));
    const lista = Array.isArray(datos) ? datos : datos === null ? [] : [datos];
    return lista.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
  } catch {
    return null;
  }
}

const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
const entero = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : null;

// ---- Carpetas compartidas de este equipo ----

export const SCRIPT_CARPETAS_COMPARTIDAS = [
  "$ErrorActionPreference = 'Stop'",
  MODULOS,
  '$l = @(Get-SmbShare | ForEach-Object { [pscustomobject]@{ n = [string]$_.Name; r = [string]$_.Path; d = [string]$_.Description; t = [string]$_.ShareType; s = [bool]$_.Special; u = [int]$_.CurrentUsers } })',
  '$j = ConvertTo-Json -InputObject $l -Compress',
  SALIDA_BASE64,
].join('\n');

export function interpretarCarpetasCompartidas(salida: string): CarpetaCompartida[] | null {
  const lista = decodificarLista(salida);
  if (lista === null) return null;
  const res: CarpetaCompartida[] = [];
  for (const x of lista) {
    const nombre = texto(x['n']);
    if (nombre === '') continue;
    const t = texto(x['t']).toLowerCase();
    const tipo =
      t === 'filesystemdirectory' ? 'carpeta' : t === 'printqueue' ? 'impresora' : 'otro';
    const oculta = nombre.endsWith('$');
    res.push({
      nombre,
      ruta: texto(x['r']),
      descripcion: texto(x['d']),
      tipo,
      // Todo lo especial, oculto o que no sea una carpeta se trata como administrativo.
      administrativa: x['s'] === true || oculta || tipo !== 'carpeta',
      oculta,
      usuarios: entero(x['u']),
    });
  }
  return res;
}

/** Códigos de salida del script elevado que deja de compartir una carpeta. */
export const SALIDA_QUITAR_CARPETA = {
  /** Venció el plazo antes de empezar: no se hizo nada. */
  vencido: 11,
  /** No es una carpeta compartida normal (administrativa, especial…): no se toca. */
  noPermitida: 41,
  /** Ya no existe: nada que quitar. */
  noExiste: 42,
  /** `Remove-SmbShare` falló. */
  fallo: 43,
} as const;

/**
 * Script que corre ELEVADO: vuelve a leer la carpeta compartida y solo la quita si sigue siendo
 * una carpeta normal (no especial, sin `$` y de tipo carpeta); con el plazo UTC incrustado, para
 * que un UAC aceptado tarde no haga nada. El nombre ya viene validado y va como literal.
 */
export function scriptQuitarCarpeta(nombre: string, limiteUnixMs: number): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    `if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(limiteUnixMs)}) { exit ${SALIDA_QUITAR_CARPETA.vencido} }`,
    MODULOS,
    `try { $s = Get-SmbShare -Name ${literal(nombre)} -ErrorAction Stop } catch { exit ${SALIDA_QUITAR_CARPETA.noExiste} }`,
    `if ($s.Special -or $s.Name.EndsWith('$') -or [string]$s.ShareType -ne 'FileSystemDirectory') { exit ${SALIDA_QUITAR_CARPETA.noPermitida} }`,
    `try { Remove-SmbShare -Name ${literal(nombre)} -Force -ErrorAction Stop } catch { exit ${SALIDA_QUITAR_CARPETA.fallo} }`,
    'exit 0',
  ].join('\n');
}

// ---- Adaptadores y vecinos ----

export const SCRIPT_ADAPTADORES = [
  "$ErrorActionPreference = 'Stop'",
  MODULOS,
  "$rutas = @(Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue)",
  '$perfiles = @(Get-NetConnectionProfile -ErrorAction SilentlyContinue)',
  '$ifs = @(Get-NetIPInterface -AddressFamily IPv4 -ErrorAction SilentlyContinue)',
  '$mejor = $null',
  'foreach ($r in $rutas) { $im = ($ifs | Where-Object { $_.InterfaceIndex -eq $r.InterfaceIndex } | Select-Object -First 1).InterfaceMetric; $t = [int]$r.RouteMetric + [int]$im; if ($null -eq $mejor -or $t -lt $mejor.t) { $mejor = @{ i = [int]$r.InterfaceIndex; t = $t } } }',
  "$l = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' -and [string]$_.AddressState -eq 'Preferred' } | ForEach-Object { $i = [int]$_.InterfaceIndex; $p = $perfiles | Where-Object { [int]$_.InterfaceIndex -eq $i } | Select-Object -First 1; [pscustomobject]@{ i = $i; n = [string]$_.InterfaceAlias; a = [string]$_.IPAddress; p = [int]$_.PrefixLength; d = [bool]($null -ne $mejor -and $mejor.i -eq $i); c = $(if ($p) { [string]$p.NetworkCategory } else { '' }) } })",
  '$j = ConvertTo-Json -InputObject $l -Compress',
  SALIDA_BASE64,
].join('\n');

export function interpretarAdaptadores(salida: string): AdaptadorRed[] | null {
  const lista = decodificarLista(salida);
  if (lista === null) return null;
  const res: AdaptadorRed[] = [];
  for (const x of lista) {
    const ip = texto(x['a']);
    const indice = entero(x['i']);
    const prefijo = entero(x['p']);
    if (indice === null || prefijo === null || prefijo < 0 || prefijo > 32) continue;
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) continue;
    res.push({
      indice,
      nombre: texto(x['n']),
      ip,
      prefijo,
      predeterminado: x['d'] === true,
      perfil: interpretarPerfilRed(texto(x['c'])),
    });
  }
  return res;
}

export const SCRIPT_VECINOS = [
  "$ErrorActionPreference = 'Stop'",
  MODULOS,
  "$l = @(Get-NetNeighbor -AddressFamily IPv4 | Where-Object { [string]$_.State -ne 'Unreachable' -and [string]$_.State -ne 'Incomplete' -and $_.LinkLayerAddress } | ForEach-Object { [pscustomobject]@{ a = [string]$_.IPAddress; m = [string]$_.LinkLayerAddress; e = [string]$_.State; i = [int]$_.InterfaceIndex } })",
  '$j = ConvertTo-Json -InputObject $l -Compress',
  SALIDA_BASE64,
].join('\n');

/** MAC en minúsculas con `:`; null si no es una dirección de un equipo (difusión, grupo, ceros). */
export function normalizarMac(bruta: string): string | null {
  const m =
    /^([0-9a-f]{2})[-:]?([0-9a-f]{2})[-:]?([0-9a-f]{2})[-:]?([0-9a-f]{2})[-:]?([0-9a-f]{2})[-:]?([0-9a-f]{2})$/i.exec(
      bruta.trim(),
    );
  if (!m) return null;
  const partes = m.slice(1).map((p) => p.toLowerCase());
  if (partes.every((p) => p === '00') || partes.every((p) => p === 'ff')) return null;
  // Bit de grupo (multidifusión): no es un equipo.
  if ((parseInt(partes[0]!, 16) & 1) === 1) return null;
  return partes.join(':');
}

/** Solo equipos de la red privada con una MAC de equipo; sin repetir IP. */
export function interpretarVecinos(salida: string): VecinoRed[] | null {
  const lista = decodificarLista(salida);
  if (lista === null) return null;
  const vistos = new Set<string>();
  const res: VecinoRed[] = [];
  for (const x of lista) {
    const ip = texto(x['a']);
    const mac = normalizarMac(texto(x['m']));
    const indice = entero(x['i']);
    if (!esPrivadaRfc1918(ip) || mac === null || indice === null || vistos.has(ip)) continue;
    vistos.add(ip);
    res.push({ ip, mac, estado: texto(x['e']), indice });
  }
  return res;
}

// ---- ping y net view ----

/** Argumentos de `ping.exe` (IPv4, sin resolver nombres): la IP ya está validada. */
export function argumentosPing(ip: string, o: OpcionesPing): string[] {
  if (!esPrivadaRfc1918(ip)) throw new Error('Equipo no válido');
  if (!Number.isInteger(o.intentos) || o.intentos < 1 || o.intentos > MAX_INTENTOS_PING) {
    throw new Error('Intentos de ping no válidos');
  }
  if (
    !Number.isInteger(o.plazoMs) ||
    o.plazoMs < MIN_PLAZO_PING_MS ||
    o.plazoMs > MAX_PLAZO_PING_MS
  ) {
    throw new Error('Plazo de ping no válido');
  }
  return ['-4', '-n', String(o.intentos), '-w', String(o.plazoMs), ip];
}

/**
 * Respuestas de `ping`: una línea con `TTL=` que menciona la IP es una respuesta del equipo (el
 * «host de destino inaccesible» de la puerta de enlace no lleva TTL). El tiempo es el número justo
 * antes de `TTL`, en cualquier idioma (`tiempo=12ms`, `Zeit<1ms`, `время=3мс`…).
 */
export function interpretarPing(salida: string, ip: string, enviados: number): ResultadoPing {
  const tiempos: number[] = [];
  // La IP como token (en fr, ja, ko… no va pegada a «:»): sin dígitos ni puntos a los lados.
  const conIp = new RegExp(`(?<![\\d.])${ip.replace(/\./g, '\\.')}(?![\\d.])`);
  for (const linea of salida.split(/\r?\n/)) {
    if (!/\bTTL\s*=/i.test(linea) || !conIp.test(linea)) continue;
    const t = /([=<])\s*(\d+)\s*\p{L}+\s+TTL\s*=/iu.exec(linea);
    tiempos.push(t ? (t[1] === '<' ? 0 : Number(t[2])) : 0);
  }
  return {
    enviados,
    recibidos: Math.min(tiempos.length, enviados),
    tiemposMs: tiempos.slice(0, enviados),
    cancelado: false,
  };
}

/**
 * Lista de `net view \\IP`: tras la línea de guiones, cada fila es nombre, tipo y comentario
 * separados por dos o más espacios; la última línea («El comando se completó…») no tiene esa forma.
 */
export function interpretarNetView(salida: string): RecursoRed[] {
  const lineas = salida.split(/\r?\n/);
  const inicio = lineas.findIndex((l) => /^-{5,}\s*$/.test(l.trim()));
  if (inicio < 0) return [];
  const res: RecursoRed[] = [];
  for (const bruta of lineas.slice(inicio + 1)) {
    const linea = bruta.trimEnd();
    if (linea.trim() === '') {
      if (res.length > 0) break;
      continue;
    }
    const m = /^(\S.*?)\s{2,}(\S+)(?:\s+(.*))?$/.exec(linea);
    if (!m) continue;
    res.push({ nombre: m[1]!.trim(), tipo: m[2]!, comentario: (m[3] ?? '').trim() });
  }
  return res;
}

/** Por qué falló `net view`, según el número de error del sistema que imprime (en cualquier idioma). */
export function motivoNetView(salida: string): MotivoSinRecursos {
  const n = /\b(5|53|64|67|1219|1231|1326|2250|6118)\b/.exec(salida)?.[1];
  if (n === '5' || n === '1219' || n === '1326') return 'denegado';
  if (n !== undefined) return 'inaccesible';
  return 'error';
}
