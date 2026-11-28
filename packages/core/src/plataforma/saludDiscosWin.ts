import { z } from 'zod';
import { CODIFICACION_UTF8, lineasAlmacen, RUTA_CLAVE_SALUD } from './firewallCambiosWin';
import { literalPowerShell } from './literalPowerShell';
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

/** Salidas propias del cuerpo elevado (aparte de las del cargador). */
export const SALIDA_SALUD_ADMIN = { almacenInseguro: 54, fallo: 55 } as const;

/** `detalle` con el que la plataforma informa que la clave del registro no es de fiar. */
export const DETALLE_SALUD_INSEGURA = 'almacen-inseguro';

/** Tope de la lectura (caracteres): el cuerpo elevado la recorta en origen y la app la rechaza si lo pasa. */
export const MAX_LECTURA_ADMIN = 512 * 1024;
/** Antigüedad máxima de la lectura: pasado este tiempo desde que se pidió, no se acepta. */
export const MAX_ANTIGUEDAD_LECTURA_MS = 10 * 60 * 1000;
/** Holgura entre el reloj del proceso elevado y el de la app (el mismo equipo, pero por si acaso). */
const HOLGURA_RELOJ_MS = 60_000;

/** Id de la petición: solo letras, cifras, `_` y `-`. Es lo ÚNICO que el cuerpo elevado incrusta. */
export const ID_PETICION_ADMIN = /^[\w-]{1,100}$/;

const TIPO_CADENA = '[Microsoft.Win32.RegistryValueKind]::String';

/**
 * Cuerpo que corre ELEVADO (UAC, solo al pulsar el botón): hace la misma lectura de solo consulta
 * y deja el JSON en el registro, NO en el sistema de archivos: un `WriteAllText` a un `.json` de
 * %TEMP% seguiría enlaces, uniones y redirecciones y permitiría escribir en una ruta privilegiada.
 *
 * Escribe en la clave `HKLM\SOFTWARE\WolfCoreDev\SaludDiscos` (la crea con la ACL protegida y no
 * la usa si el dueño o los permisos no son de fiar, igual que la copia del cortafuegos) tres
 * valores REG_SZ que SIEMPRE se sobrescriben: `Lectura` (el JSON, recortado en origen a
 * `MAX_LECTURA_ADMIN`), `Creado` (UTC) e `Id` (el de esta petición, escrito el último). Lo único
 * que se incrusta en el script es el id ya validado.
 *
 * Decisión: el valor se DEJA tras leerlo (la app, sin elevar, no puede borrarlo y no se abre un
 * segundo UAC solo para eso): es solo el estado de los discos, sin números de serie, y la
 * siguiente lectura con administrador lo sobrescribe.
 */
export function cuerpoSaludDiscosAdmin(id: string): string {
  if (!ID_PETICION_ADMIN.test(id)) throw new Error(`Id de petición no válido: ${id}`);
  return [
    ...CABECERA,
    ...CUERPO_SALUD,
    // Recorte en origen: se quitan discos del final hasta que quepa.
    `while ($json.Length -gt ${MAX_LECTURA_ADMIN} -and $discos.Count -gt 0) { $discos = @($discos | Select-Object -First ($discos.Count - 1)); $json = ConvertTo-Json -InputObject ([pscustomobject]@{ p = $estadoPred; discos = $discos }) -Depth 5 -Compress }`,
    "$ErrorActionPreference = 'Stop'",
    ...lineasAlmacen(RUTA_CLAVE_SALUD),
    `$id = ${literalPowerShell(id)}`,
    '$k = Open-ClaveWolf $true',
    `if ($null -eq $k) { exit ${SALIDA_SALUD_ADMIN.almacenInseguro} }`,
    'try {',
    "  $k.DeleteValue('Id', $false)",
    `  $k.SetValue('Lectura', $json, ${TIPO_CADENA})`,
    `  $k.SetValue('Creado', [DateTime]::UtcNow.ToString('o', [Globalization.CultureInfo]::InvariantCulture), ${TIPO_CADENA})`,
    `  $k.SetValue('Id', $id, ${TIPO_CADENA})`,
    `} catch { exit ${SALIDA_SALUD_ADMIN.fallo} } finally { $k.Dispose() }`,
    'exit 0',
  ].join('\n');
}

/**
 * Lectura SIN elevar del valor que dejó el cuerpo elevado (HKLM es legible por los usuarios).
 * Antes de leer comprueba el dueño y la ACL de la clave y de su superior (solo Administradores y
 * SYSTEM pueden escribir): si no, imprime `INSEGURO` y no lee nada. Salida: `OK`, id, creado y el
 * JSON, una por línea; `SIN` si no hay clave o valores; `GRANDE` si pasa del tope.
 */
export const SCRIPT_LEER_SALUD_ADMIN = [
  "$ErrorActionPreference = 'Stop'",
  CODIFICACION_UTF8,
  ...lineasAlmacen(RUTA_CLAVE_SALUD),
  '$k = $hklm.OpenSubKey($rutaClave)',
  "if ($null -eq $k) { [Console]::Out.WriteLine('SIN'); exit 0 }",
  'try {',
  '  $base = $hklm.OpenSubKey($rutaBase)',
  '  $bien = (Test-ClaveWolf $base) -and (Test-ClaveWolf $k)',
  '  if ($null -ne $base) { $base.Dispose() }',
  "  if (-not $bien) { [Console]::Out.WriteLine('INSEGURO'); exit 0 }",
  '  $v = @{}',
  "  foreach ($n in @('Id', 'Creado', 'Lectura')) {",
  '    $x = $k.GetValue($n, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)',
  "    if (($x -isnot [string]) -or ($k.GetValueKind($n) -ne 'String')) { [Console]::Out.WriteLine('SIN'); exit 0 }",
  '    $v[$n] = $x',
  '  }',
  `  if ($v['Lectura'].Length -gt ${MAX_LECTURA_ADMIN}) { [Console]::Out.WriteLine('GRANDE'); exit 0 }`,
  "  [Console]::Out.WriteLine('OK')",
  "  [Console]::Out.WriteLine($v['Id'])",
  "  [Console]::Out.WriteLine($v['Creado'])",
  "  [Console]::Out.WriteLine($v['Lectura'])",
  '} finally { $k.Dispose() }',
].join('\n');

const valor = z.union([z.string().max(64), z.number(), z.null()]).optional();
const textoCorto = (max: number) => z.string().max(max).nullish();

/** Esquema estricto de lo que deja el cuerpo elevado: cualquier campo de más lo rechaza. */
export const ESQUEMA_LECTURA_ADMIN = z.strictObject({
  p: z.enum(['ok', 'sin_acceso', 'no_disponible']),
  discos: z
    .array(
      z.strictObject({
        n: valor,
        modelo: textoCorto(300),
        medio: textoCorto(32),
        bus: textoCorto(32),
        tam: valor,
        salud: textoCorto(32),
        oper: z
          .union([z.string().max(64), z.array(z.string().max(64)).max(16), z.null()])
          .optional(),
        cs: textoCorto(32),
        c: z
          .strictObject({
            t: valor,
            tm: valor,
            w: valor,
            rc: valor,
            ru: valor,
            wc: valor,
            wu: valor,
            h: valor,
          })
          .nullish(),
        pf: z.boolean().nullish(),
        letras: z
          .union([z.string().max(2), z.array(z.string().max(2)).max(26), z.null()])
          .optional(),
      }),
    )
    .max(64),
});

export type ResultadoLecturaRegistro =
  { ok: true; lectura: LecturaDiscos } | { ok: false; detalle: string };

/**
 * Interpreta la salida de `SCRIPT_LEER_SALUD_ADMIN` para UNA petición: el id tiene que ser el de
 * esta petición, `Creado` no puede ser anterior a su inicio ni más viejo que
 * `MAX_ANTIGUEDAD_LECTURA_MS` ni del futuro, el JSON no pasa del tope y se valida con un esquema
 * estricto antes de interpretarlo. Lo demás se rechaza con su motivo (sin valores inventados).
 */
export function interpretarLecturaRegistro(
  salida: string,
  esperado: { id: string; desde: number; ahora: number },
): ResultadoLecturaRegistro {
  const no = (detalle: string): ResultadoLecturaRegistro => ({ ok: false, detalle });
  if (salida.length > MAX_LECTURA_ADMIN * 2 + 1000) return no('salida demasiado grande');
  const lineas = salida.replace(/^\uFEFF/, '').split(/\r?\n/);
  const estado = lineas[0]?.trim();
  if (estado === 'INSEGURO') return no(DETALLE_SALUD_INSEGURA);
  if (estado === 'GRANDE') return no('salida demasiado grande');
  if (estado !== 'OK' || lineas.length < 4) return no('sin lectura');
  if (lineas[1]!.trim() !== esperado.id) return no('la lectura es de otra petición');
  const creadoTxt = lineas[2]!.trim();
  const creado = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(creadoTxt) ? Date.parse(creadoTxt) : NaN;
  if (!Number.isFinite(creado)) return no('fecha de la lectura no válida');
  if (creado < esperado.desde - HOLGURA_RELOJ_MS) return no('la lectura es anterior a la petición');
  if (creado > esperado.ahora + HOLGURA_RELOJ_MS) return no('la lectura es del futuro');
  if (esperado.ahora - creado > MAX_ANTIGUEDAD_LECTURA_MS) {
    return no('la lectura es demasiado vieja');
  }
  const texto = lineas[3]!.trim();
  if (texto.length > MAX_LECTURA_ADMIN) return no('salida demasiado grande');
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return no('la lectura no se pudo interpretar');
  }
  if (!ESQUEMA_LECTURA_ADMIN.safeParse(crudo).success) {
    return no('la lectura no tiene la forma esperada');
  }
  const lectura = interpretarSaludDiscos(texto);
  return lectura ? { ok: true, lectura } : no('la lectura no se pudo interpretar');
}

/** Eventos del disco de los últimos días (solo lectura del registro System). */
export const SCRIPT_EVENTOS_DISCO = [
  ...CABECERA,
  `$desde = [DateTime]::Now.AddDays(-${DIAS_EVENTOS_DISCO})`,
  `$filtro = @{ LogName = 'System'; ProviderName = @(${PROVEEDORES_EVENTO_DISCO.map(literalPowerShell).join(', ')}); Id = @(${IDS_EVENTO_DISCO.join(', ')}); StartTime = $desde }`,
  `$ev = @(Get-WinEvent -FilterHashtable $filtro -MaxEvents ${MAX_EVENTOS_DISCO} -ErrorAction SilentlyContinue | ForEach-Object {`,
  '  $m = [string]$_.Message',
  // Solo un tope de seguridad: el recorte útil se hace DESPUÉS de enmascarar (en la app).
  '  if ($m.Length -gt 4000) { $m = $m.Substring(0, 4000) }',
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
    // El desgaste NVMe puede pasar de 100 (hasta 255): por encima de 100 el disco ya agotó su vida útil.
    desgastePct: contador(o['w'], 255),
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
    crudo = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
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
