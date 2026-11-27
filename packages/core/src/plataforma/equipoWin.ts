import path from 'node:path';
import {
  equipoDesconocido,
  type DiscoEquipo,
  type GpuEquipo,
  type InfoEquipo,
} from '../equipo/tipos';

/**
 * Lectura del equipo en Windows (D55). SOLO CONSULTA, sin permisos de administrador: CIM
 * (`Win32_OperatingSystem`, `Win32_Processor`, `Win32_BaseBoard`, `Win32_ComputerSystem`,
 * `Win32_VideoController`, `Win32_LogicalDisk`), el registro de la clase de adaptadores de vídeo
 * (lectura) y el almacenamiento (`Get-PhysicalDisk`). NO se piden números de serie, UUID,
 * `ProcessorId`, `PNPDeviceID`, MAC ni el nombre del equipo o del usuario: solo modelos y tamaños.
 *
 * La VRAM: `Win32_VideoController.AdapterRAM` es de 32 bits y se queda en 4 GB; por eso se lee la
 * clave `HardwareInformation.qwMemorySize` (64 bits) del adaptador en el registro y, si hay
 * `nvidia-smi` en una de las dos rutas fijas del controlador (nunca por el PATH), su valor manda
 * (script aparte, con su propio plazo).
 */
export const SCRIPT_EQUIPO = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  "$ProgressPreference = 'SilentlyContinue'",
  '$so = Get-CimInstance -ClassName Win32_OperatingSystem',
  '$cpu = @(Get-CimInstance -ClassName Win32_Processor | ForEach-Object {',
  '  [pscustomobject]@{ nombre = [string]$_.Name; nucleos = $_.NumberOfCores; hilos = $_.NumberOfLogicalProcessors }',
  '})',
  '$pl = Get-CimInstance -ClassName Win32_BaseBoard',
  '$sis = Get-CimInstance -ClassName Win32_ComputerSystem',
  '$gpus = @(Get-CimInstance -ClassName Win32_VideoController | ForEach-Object {',
  '  [pscustomobject]@{ nombre = [string]$_.Name; wmi = $_.AdapterRAM }',
  '})',
  "$clase = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11cd-be10-08002be10318}'",
  '$reg = @(Get-ChildItem -Path $clase | Where-Object { $_.PSChildName -match "^\\d{4}$" } | ForEach-Object {',
  '  $p = Get-ItemProperty -Path $_.PSPath',
  "  $v = $p.'HardwareInformation.qwMemorySize'",
  '  if ($v -is [byte[]]) { if ($v.Length -eq 8) { $v = [BitConverter]::ToUInt64($v, 0) } else { $v = $null } }',
  '  if ($p.DriverDesc) { [pscustomobject]@{ nombre = [string]$p.DriverDesc; vram = $v } }',
  '})',
  '$tipos = @{}',
  'try {',
  '  $fis = @{}',
  '  Get-PhysicalDisk | ForEach-Object { $fis[[string]$_.DeviceID] = [string]$_.MediaType }',
  '  Get-Partition | Where-Object { $_.DriveLetter } | ForEach-Object { $tipos[[string]$_.DriveLetter] = $fis[[string]$_.DiskNumber] }',
  '} catch { }',
  '$discos = @(Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {',
  '  $l = ([string]$_.DeviceID).TrimEnd(":")',
  '  [pscustomobject]@{ id = [string]$_.DeviceID; total = $_.Size; libre = $_.FreeSpace; tipo = $tipos[$l] }',
  '})',
  '$r = [pscustomobject]@{',
  '  so = [pscustomobject]@{ caption = [string]$so.Caption; version = [string]$so.Version; build = [string]$so.BuildNumber }',
  '  cpu = $cpu',
  '  ram = [pscustomobject]@{ totalKb = $so.TotalVisibleMemorySize; libreKb = $so.FreePhysicalMemory }',
  '  placa = [pscustomobject]@{ fabricante = [string]$pl.Manufacturer; modelo = [string]$pl.Product }',
  '  sistema = [pscustomobject]@{ fabricante = [string]$sis.Manufacturer; modelo = [string]$sis.Model }',
  '  gpus = $gpus',
  '  reg = $reg',
  '  discos = $discos',
  '}',
  '[Console]::Out.Write((ConvertTo-Json -InputObject $r -Depth 4 -Compress))',
].join('\n');

/**
 * Rutas donde el controlador de NVIDIA deja `nvidia-smi.exe`: System32 y la carpeta NVSMI de
 * Archivos de programa. Nunca se busca en el PATH (podría apuntar a un programa del proyecto).
 */
export function rutasNvidiaSmi(env: NodeJS.ProcessEnv): string[] {
  const raiz = env.SystemRoot ?? env.SYSTEMROOT ?? 'C:\\Windows';
  const pf = env.ProgramFiles ?? 'C:\\Program Files';
  return [
    path.win32.join(raiz, 'System32', 'nvidia-smi.exe'),
    path.win32.join(pf, 'NVIDIA Corporation', 'NVSMI', 'nvidia-smi.exe'),
  ];
}

const literal = (ruta: string): string => `'${ruta.replace(/'/g, "''")}'`;

/** `nombre, MiB` por tarjeta con la primera de `rutas` que exista; si no hay ninguna, no imprime nada. */
export function scriptNvidiaSmi(rutas: readonly string[]): string {
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    `$exe = @(${rutas.map(literal).join(', ')}) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1`,
    'if ($null -eq $exe) { exit 0 }',
    "& $exe '--query-gpu=name,memory.total' '--format=csv,noheader,nounits'",
  ].join('\n');
}

/** Textos de relleno que los fabricantes dejan sin cambiar: no dicen nada. */
const RELLENO =
  /^(to be filled by o\.?e\.?m\.?|default string|system (manufacturer|product name|version)|not applicable|not specified|n\/a|none|unknown|o\.?e\.?m\.?|type1productconfigid|base board.*)$/i;

/** Adaptadores que no son una tarjeta de vídeo de verdad (escritorio remoto, virtuales). */
const GPU_VIRTUAL =
  /(remote display|virtual|basic display|basic render|hyper-v|vmware svga|displaylink|indirect display|parsec|meta )/i;

/**
 * GPU integrada (comparte la RAM del equipo): su «memoria» no es VRAM dedicada, por grande que la
 * declare el controlador. Por el nombre, porque Windows no lo dice de otra forma fiable.
 */
export const GPU_INTEGRADA =
  /(Intel\(R\) (UHD|Iris|HD)|Intel\(R\) Arc\(TM\) Graphics$|Intel\(R\) Graphics$|Radeon\(TM\) (Vega |)Graphics|Radeon\(TM\) \d{3,4}M( Graphics)?$|Vega \d+ Graphics|Adreno)/i;

export const esGpuIntegrada = (nombre: string): boolean => GPU_INTEGRADA.test(nombre);

const LIMITE_TEXTO = 120;
/** AdapterRAM es de 32 bits: a partir de aquí el valor es un tope, no la memoria real. */
const TOPE_WMI = 4_000_000_000;

function texto(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITE_TEXTO)
    .trim();
  return t && !RELLENO.test(t) ? t : null;
}

const numero = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

const entero = (v: unknown): number | null => {
  const n = numero(v);
  return n !== null && Number.isInteger(n) && n >= 1 ? n : null;
};

const objeto = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** PowerShell da un objeto suelto cuando la lista tiene un solo elemento. */
const lista = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v === undefined || v === null ? [] : [v];

const clave = (nombre: string): string => nombre.toLowerCase().replace(/\s+/g, ' ').trim();

interface GpuWmi {
  nombre: string;
  wmi: number | null;
}
interface GpuRegistro {
  nombre: string;
  vram: number | null;
}
export interface GpuNvidia {
  nombre: string;
  vramBytes: number;
}

/** Saca de `candidatas` la primera (sin usar) con ese nombre; con una sola NVIDIA, también por marca. */
function emparejar<T extends { nombre: string }>(
  nombre: string,
  candidatas: T[],
  usadas: Set<T>,
): T | null {
  const k = clave(nombre);
  const igual = candidatas.find((c) => !usadas.has(c) && clave(c.nombre) === k);
  if (igual) {
    usadas.add(igual);
    return igual;
  }
  return null;
}

/**
 * Une las tres fuentes de VRAM por tarjeta: `nvidia-smi` (la más exacta), el registro de 64 bits
 * y, solo si es menor de 4 GB (por debajo del tope de 32 bits), `AdapterRAM` de WMI.
 */
export function combinarGpus(
  wmi: GpuWmi[],
  registro: GpuRegistro[],
  nvidia: GpuNvidia[],
): GpuEquipo[] {
  const usadasReg = new Set<GpuRegistro>();
  const usadasNv = new Set<GpuNvidia>();
  return wmi.map((g) => {
    const marca = esGpuIntegrada(g.nombre) ? { integrada: true } : {};
    const nv = emparejar(g.nombre, nvidia, usadasNv);
    if (nv && nv.vramBytes > 0) {
      return { nombre: g.nombre, vramBytes: nv.vramBytes, origenVram: 'nvidia-smi', ...marca };
    }
    const rg = emparejar(g.nombre, registro, usadasReg);
    if (rg && rg.vram !== null && rg.vram > 0) {
      return { nombre: g.nombre, vramBytes: rg.vram, origenVram: 'registro', ...marca };
    }
    if (g.wmi !== null && g.wmi > 0 && g.wmi < TOPE_WMI) {
      return { nombre: g.nombre, vramBytes: g.wmi, origenVram: 'wmi', ...marca };
    }
    return { nombre: g.nombre, vramBytes: null, origenVram: null, ...marca };
  });
}

/** Salida de `nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits` (MiB). */
export function interpretarNvidiaSmi(stdout: string): GpuNvidia[] {
  const res: GpuNvidia[] = [];
  for (const linea of stdout.split(/\r?\n/)) {
    const m = /^(.+),\s*(\d{1,9})\s*$/.exec(linea.trim());
    if (!m) continue;
    const nombre = texto(m[1]);
    const mib = Number(m[2]);
    if (nombre && mib > 0) res.push({ nombre, vramBytes: mib * 1024 * 1024 });
  }
  return res;
}

/**
 * Interpreta la salida JSON de `SCRIPT_EQUIPO`. Lo que no se entiende queda en `null` y nada
 * lanza. Solo se copian los campos conocidos (lo demás se ignora), así un identificador que
 * llegara por error no sale de aquí.
 */
export function interpretarEquipo(stdout: string, nvidia: GpuNvidia[] = []): InfoEquipo {
  const e = equipoDesconocido();
  let crudo: unknown;
  try {
    crudo = JSON.parse(stdout.trim());
  } catch {
    return e;
  }
  const d = objeto(crudo);

  const so = objeto(d['so']);
  e.so = {
    nombre: texto(
      typeof so['caption'] === 'string' ? so['caption'].replace(/^Microsoft\s+/i, '') : null,
    ),
    version: texto(so['version']),
    compilacion: texto(so['build']),
  };

  const cpus = lista(d['cpu']).map(objeto);
  const nucleos = cpus.map((c) => entero(c['nucleos'])).filter((n): n is number => n !== null);
  const hilos = cpus.map((c) => entero(c['hilos'])).filter((n): n is number => n !== null);
  e.cpu = {
    modelo: cpus.map((c) => texto(c['nombre'])).find((n) => n !== null) ?? null,
    nucleos: nucleos.length ? nucleos.reduce((a, b) => a + b, 0) : null,
    hilos: hilos.length ? hilos.reduce((a, b) => a + b, 0) : null,
  };

  const ram = objeto(d['ram']);
  const kb = (v: unknown): number | null => {
    const n = numero(v);
    return n === null ? null : n * 1024;
  };
  e.ram = { totalBytes: kb(ram['totalKb']), libreBytes: kb(ram['libreKb']) };

  const placa = objeto(d['placa']);
  const sistema = objeto(d['sistema']);
  const fabricante = texto(placa['fabricante']) ?? texto(sistema['fabricante']);
  const modelo = texto(placa['modelo']) ?? texto(sistema['modelo']);
  e.placa = { fabricante, modelo };

  const gpusWmi: GpuWmi[] = [];
  for (const g of lista(d['gpus']).map(objeto)) {
    const nombre = texto(g['nombre']);
    if (!nombre || GPU_VIRTUAL.test(nombre)) continue;
    gpusWmi.push({ nombre, wmi: numero(g['wmi']) });
  }
  const registro: GpuRegistro[] = [];
  for (const g of lista(d['reg']).map(objeto)) {
    const nombre = texto(g['nombre']);
    if (nombre) registro.push({ nombre, vram: numero(g['vram']) });
  }
  e.gpus = combinarGpus(gpusWmi, registro, nvidia);

  const discos: DiscoEquipo[] = [];
  for (const x of lista(d['discos']).map(objeto)) {
    const m = typeof x['id'] === 'string' ? /^([A-Za-z]):$/.exec(x['id']) : null;
    if (!m) continue;
    const tipo = typeof x['tipo'] === 'string' ? x['tipo'].toUpperCase() : '';
    discos.push({
      unidad: `${m[1]!.toUpperCase()}:`,
      totalBytes: numero(x['total']),
      libreBytes: numero(x['libre']),
      tipo: tipo === 'SSD' ? 'ssd' : tipo === 'HDD' ? 'hdd' : null,
    });
  }
  e.discos = discos.sort((a, b) => (a.unidad < b.unidad ? -1 : 1));
  return e;
}
