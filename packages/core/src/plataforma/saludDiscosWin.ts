import {
  DIAS_EVENTOS_DISCO,
  IDS_EVENTO_DISCO,
  MAX_EVENTOS_DISCO,
  PROVEEDORES_EVENTO_DISCO,
} from '../discos/eventos';
import { modeloSeguro } from '../discos/privacidad';
import type {
  BusDisco,
  ContadoresDisco,
  DiscoLeido,
  EstadoPrediccion,
  LecturaDiscos,
  MedioDisco,
  MotivoSinContadores,
  SaludReportada,
} from '../discos/tipos';

/**
 * Lectura de la salud de los discos en Windows (D57). SOLO LECTURA y sin instalar nada:
 * `Get-PhysicalDisk` (estado, tipo, bus, tamaño y modelo), `Get-StorageReliabilityCounter`
 * (temperatura, desgaste y errores; casi siempre pide administrador), la predicción de fallo de
 * `root\wmi` (`MSStorageDriver_FailurePredictStatus`, si responde sin administrador) y las letras
 * de unidad de cada disco (`Get-Partition`).
 *
 * NO se pide ni `SerialNumber`, ni `UniqueId`, ni `ObjectId`, ni el `PNPDeviceID` sale del
 * script (solo se usa dentro de él para emparejar la predicción con el número de disco). Los
 * números salen como texto invariable (sin coma decimal) y las fechas del registro como ISO, así
 * que un Windows en otro idioma da lo mismo; aun así el intérprete tolera comas decimales.
 */
const CABECERA = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  "$ProgressPreference = 'SilentlyContinue'",
];

/** Cuerpo común: deja el JSON en `$json`. Se usa tal cual con y sin elevación. */
const CUERPO_SALUD = [
  'function L($v) { if ($null -eq $v) { return $null }; try { return [long]$v } catch { return $null } }',
  '$letras = @{}',
  'try { Get-Partition | Where-Object { $_.DriveLetter } | ForEach-Object { $k = [string]$_.DiskNumber; if (-not $letras.ContainsKey($k)) { $letras[$k] = @() }; $letras[$k] += [string]$_.DriveLetter } } catch { }',
  '$pred = @{}',
  "$estadoPred = 'no_disponible'",
  'try {',
  '  $indice = @{}',
  '  Get-CimInstance -ClassName Win32_DiskDrive | ForEach-Object { $indice[([string]$_.PNPDeviceID).ToUpperInvariant() + "_0"] = [string]$_.Index }',
  '  $fallos = @(Get-CimInstance -Namespace root\\wmi -ClassName MSStorageDriver_FailurePredictStatus -ErrorAction Stop)',
  "  $estadoPred = 'ok'",
  '  foreach ($f in $fallos) { $k = ([string]$f.InstanceName).ToUpperInvariant(); if ($indice.ContainsKey($k)) { $pred[$indice[$k]] = [bool]$f.PredictFailure } }',
  '} catch {',
  '  $n = [string]$_.Exception.NativeErrorCode',
  "  if ($n -eq 'AccessDenied' -or $_.Exception -is [UnauthorizedAccessException]) { $estadoPred = 'sin_acceso' }",
  '}',
  '$discos = @(Get-PhysicalDisk | ForEach-Object {',
  '  $d = $_',
  '  $k = [string]$d.DeviceId',
  '  $c = $null',
  "  $cs = 'ok'",
  '  try { $c = $d | Get-StorageReliabilityCounter -ErrorAction Stop } catch {',
  '    $x = $_.Exception',
  '    $n = [string]$x.NativeErrorCode',
  "    $cs = if ($n -eq 'AccessDenied' -or $x -is [UnauthorizedAccessException]) { 'admin' } elseif ($n -eq 'NotSupported') { 'no_soportado' } else { 'error' }",
  '  }',
  "  if ($cs -eq 'ok' -and $null -eq $c) { $cs = 'sin_datos' }",
  '  [pscustomobject]@{',
  '    n = $k',
  '    modelo = [string]$d.FriendlyName',
  '    medio = [string]$d.MediaType',
  '    bus = [string]$d.BusType',
  '    tam = L $d.Size',
  '    salud = [string]$d.HealthStatus',
  '    oper = @($d.OperationalStatus | ForEach-Object { [string]$_ })',
  '    cs = $cs',
  '    c = if ($null -eq $c) { $null } else { [pscustomobject]@{ t = L $c.Temperature; tm = L $c.TemperatureMax; w = L $c.Wear; rc = L $c.ReadErrorsCorrected; ru = L $c.ReadErrorsUncorrected; wc = L $c.WriteErrorsCorrected; wu = L $c.WriteErrorsUncorrected; h = L $c.PowerOnHours } }',
  '    pf = if ($pred.ContainsKey($k)) { $pred[$k] } else { $null }',
  '    letras = @(if ($letras.ContainsKey($k)) { $letras[$k] })',
  '  }',
  '})',
  '$json = ConvertTo-Json -InputObject ([pscustomobject]@{ p = $estadoPred; discos = $discos }) -Depth 5 -Compress',
];

/** Lectura sin permisos de administrador: imprime el JSON por la salida estándar. */
export const SCRIPT_SALUD_DISCOS = [
  ...CABECERA,
  ...CUERPO_SALUD,
  '[Console]::Out.Write($json)',
].join('\n');

const lit = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/** Salidas propias del cuerpo elevado (aparte de las del cargador). */
export const SALIDA_SALUD_ADMIN = { sinSalida: 52, salidaInsegura: 53 } as const;

/**
 * Cuerpo que corre ELEVADO (UAC, solo al pulsar el botón): hace la misma lectura de solo
 * consulta y deja el JSON en `salida`, un archivo temporal propio que la aplicación creó vacío
 * antes. No escribe nada más; si el archivo no existe o es un enlace, sale sin escribir.
 */
export function cuerpoSaludDiscosAdmin(salida: string): string {
  return [
    ...CABECERA,
    ...CUERPO_SALUD,
    `$o = ${lit(salida)}`,
    `if (-not [IO.File]::Exists($o)) { exit ${SALIDA_SALUD_ADMIN.sinSalida} }`,
    `if (([IO.File]::GetAttributes($o) -band [IO.FileAttributes]::ReparsePoint) -ne 0) { exit ${SALIDA_SALUD_ADMIN.salidaInsegura} }`,
    '[IO.File]::WriteAllText($o, $json, [Text.UTF8Encoding]::new($false))',
    'exit 0',
  ].join('\n');
}

/** Eventos del disco de los últimos días (solo lectura del registro System). */
export const SCRIPT_EVENTOS_DISCO = [
  ...CABECERA,
  `$desde = [DateTime]::Now.AddDays(-${DIAS_EVENTOS_DISCO})`,
  `$filtro = @{ LogName = 'System'; ProviderName = @(${PROVEEDORES_EVENTO_DISCO.map(lit).join(', ')}); Id = @(${IDS_EVENTO_DISCO.join(', ')}); StartTime = $desde }`,
  `$ev = @(Get-WinEvent -FilterHashtable $filtro -MaxEvents ${MAX_EVENTOS_DISCO} -ErrorAction SilentlyContinue | ForEach-Object {`,
  '  $m = [string]$_.Message',
  '  if ($m.Length -gt 400) { $m = $m.Substring(0, 400) }',
  "  [pscustomobject]@{ f = $_.TimeCreated.ToUniversalTime().ToString('o', [Globalization.CultureInfo]::InvariantCulture); id = [int]$_.Id; p = [string]$_.ProviderName; m = $m }",
  '})',
  '[Console]::Out.Write((ConvertTo-Json -InputObject $ev -Depth 3 -Compress))',
].join('\n');

// ---- Interpretación ----

const objeto = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const lista = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v === undefined || v === null ? [] : [v];

/** Un contador de 32 bits sin valor (`0xFFFFFFFF`) no es un dato. */
const SIN_VALOR = 4_294_967_295;

/**
 * Número de un texto o un valor. Tolera la coma decimal de otro idioma (`36,5`) y los separadores
 * de miles (`1.000.204.886.016`); lo que no es un número claro es null, nunca 0.
 */
export function numeroLocal(v: unknown, entero = false): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let t = v.trim().replace(/\s/g, '');
  if (t === '' || !/^-?[\d.,]+$/.test(t)) return null;
  const coma = t.lastIndexOf(',');
  const punto = t.lastIndexOf('.');
  if (coma >= 0 && punto >= 0) {
    // El último separador es el decimal; el otro, de miles.
    t = coma > punto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (coma >= 0) {
    // Un solo grupo de tres cifras es de miles solo si se sabe que el valor es entero.
    const miles = entero ? /^-?\d{1,3}(,\d{3})+$/ : /^-?\d{1,3}(,\d{3}){2,}$/;
    t = miles.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (entero ? /^-?\d{1,3}(\.\d{3})+$/.test(t) : /^-?\d{1,3}(\.\d{3}){2,}$/.test(t)) {
    t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function contador(v: unknown, max = Number.POSITIVE_INFINITY, entero = true): number | null {
  const n = numeroLocal(v, entero);
  return n === null || n < 0 || n >= SIN_VALOR || n > max ? null : Math.round(n);
}

const BUS_NUMERO: Record<number, BusDisco> = {
  1: 'scsi',
  3: 'ata',
  7: 'usb',
  8: 'raid',
  10: 'sas',
  11: 'sata',
  17: 'nvme',
};
const BUS_TEXTO: Record<string, BusDisco> = {
  nvme: 'nvme',
  sata: 'sata',
  ata: 'ata',
  atapi: 'ata',
  sas: 'sas',
  scsi: 'scsi',
  usb: 'usb',
  raid: 'raid',
};

export function busDeDisco(v: unknown): BusDisco | null {
  if (typeof v === 'number') return BUS_NUMERO[v] ?? 'otro';
  if (typeof v !== 'string' || v.trim() === '') return null;
  const t = v.trim().toLowerCase();
  if (/^\d+$/.test(t)) return BUS_NUMERO[Number(t)] ?? 'otro';
  return BUS_TEXTO[t] ?? 'otro';
}

export function medioDeDisco(v: unknown): MedioDisco | null {
  const t = String(v ?? '')
    .trim()
    .toLowerCase();
  if (t === 'ssd' || t === '4') return 'ssd';
  if (t === 'hdd' || t === '3') return 'hdd';
  return null;
}

export function saludDeDisco(v: unknown): SaludReportada | null {
  const t = String(v ?? '')
    .trim()
    .toLowerCase();
  if (t === 'healthy' || t === '0') return 'healthy';
  if (t === 'warning' || t === '1') return 'warning';
  if (t === 'unhealthy' || t === '2') return 'unhealthy';
  return null;
}

function interpretarContadores(c: unknown): ContadoresDisco | null {
  const o = objeto(c);
  if (Object.keys(o).length === 0) return null;
  // Una temperatura de 0 o fuera de lo creíble es un controlador mudo, no un dato.
  const temp = (v: unknown): number | null => {
    const n = contador(v, 150, false);
    return n !== null && n >= 1 ? n : null;
  };
  const r: ContadoresDisco = {
    temperaturaC: temp(o['t']),
    temperaturaMaxC: temp(o['tm']),
    desgastePct: contador(o['w'], 100),
    erroresLecturaCorregidos: contador(o['rc']),
    erroresLecturaNoCorregidos: contador(o['ru']),
    erroresEscrituraCorregidos: contador(o['wc']),
    erroresEscrituraNoCorregidos: contador(o['wu']),
    horasEncendido: contador(o['h']),
  };
  return Object.values(r).some((x) => x !== null) ? r : null;
}

function motivoSinContadores(estado: string, bus: BusDisco | null): MotivoSinContadores {
  if (bus === 'usb' || bus === 'raid') return 'bus';
  if (estado === 'admin') return 'admin';
  if (estado === 'no_soportado') return 'no_soportado';
  return 'no_leidos';
}

/**
 * Interpreta la salida JSON de `SCRIPT_SALUD_DISCOS` (o la del cuerpo elevado). Devuelve `null`
 * si no es una lectura válida. Solo se copian campos conocidos: un número de serie que llegara
 * por error no sale de aquí, y el modelo pasa por `modeloSeguro` (enmascara lo que parezca una
 * serie).
 */
export function interpretarSaludDiscos(stdout: string): LecturaDiscos | null {
  let crudo: unknown;
  try {
    crudo = JSON.parse(stdout.replace(/^﻿/, '').trim());
  } catch {
    return null;
  }
  const d = objeto(crudo);
  if (!('discos' in d) && !('p' in d)) return null;
  const p = d['p'];
  const prediccion: EstadoPrediccion =
    p === 'ok' || p === 'sin_acceso' || p === 'no_disponible' ? p : 'no_disponible';
  const discos: DiscoLeido[] = [];
  for (const x of lista(d['discos']).map(objeto)) {
    const numero = numeroLocal(x['n'], true);
    if (numero === null || !Number.isInteger(numero) || numero < 0) continue;
    const bus = busDeDisco(x['bus']);
    const contadores = interpretarContadores(x['c']);
    const pf = x['pf'];
    discos.push({
      numero,
      modelo: modeloSeguro(x['modelo']),
      medio: medioDeDisco(x['medio']),
      bus,
      tamanoBytes: (() => {
        const n = numeroLocal(x['tam'], true);
        return n !== null && n > 0 ? n : null;
      })(),
      salud: saludDeDisco(x['salud']),
      operacional: lista(x['oper'])
        .filter((s): s is string => typeof s === 'string')
        .map((s) => s.trim().slice(0, 40))
        .filter((s) => s !== ''),
      contadores,
      motivoSinContadores:
        contadores === null ? motivoSinContadores(String(x['cs'] ?? ''), bus) : null,
      prediccionFallo: typeof pf === 'boolean' ? pf : null,
      unidades: lista(x['letras'])
        .filter((s): s is string => typeof s === 'string' && /^[A-Za-z]$/.test(s.trim()))
        .map((s) => `${s.trim().toUpperCase()}:`)
        .sort(),
    });
  }
  discos.sort((a, b) => a.numero - b.numero);
  return { discos, prediccion };
}
