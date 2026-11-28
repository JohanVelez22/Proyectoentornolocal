/**
 * P/Invoke en memoria para los scripts de PowerShell (D54b, I3).
 *
 * Por qué no `Add-Type`: en Windows PowerShell 5.1 `Add-Type` compila con `csc.exe` y deja el
 * `.cs`, el `.cmdline` y la `.dll` en el %TEMP% del usuario, una carpeta que comparte con procesos
 * de integridad media. En un proceso ELEVADO eso permite que otro proceso del mismo usuario
 * sustituya la `.dll` antes de que se cargue y ejecute código como administrador. Aquí no hay
 * compilador ni archivos: el tipo se define en memoria con `System.Reflection.Emit`
 * (`DefineDynamicAssembly` con `AssemblyBuilderAccess.Run`, `DefineDynamicModule` y
 * `DefinePInvokeMethod`).
 *
 * Limitaciones a propósito: solo tipos simples (enteros, punteros, cadenas, `StringBuilder` y
 * parámetros por referencia a enteros o punteros). Nada de estructuras ni `SetLastError`: lo que
 * haga falta se resuelve con otra API (p. ej. `RtlAdjustPrivilege`, que devuelve un `NTSTATUS`).
 * Todas las firmas se declaran en TypeScript, se validan aquí y se prueban con el parser y con
 * una PowerShell real sin elevar.
 */

/** Tipos admitidos y su equivalente en PowerShell. */
const TIPOS_PS = {
  void: '[void]',
  ptr: '[IntPtr]',
  bool: '[bool]',
  u8: '[byte]',
  i32: '[int32]',
  u32: '[uint32]',
  i64: '[int64]',
  str: '[string]',
  sb: '[Text.StringBuilder]',
  'ref-u8': '[byte].MakeByRefType()',
  'ref-i32': '[int32].MakeByRefType()',
  'ref-i64': '[int64].MakeByRefType()',
  'ref-ptr': '[IntPtr].MakeByRefType()',
} as const;

export type TipoPInvoke = keyof typeof TIPOS_PS;

export interface FirmaPInvoke {
  /** Nombre del método (y de la función exportada por la DLL). */
  nombre: string;
  /** DLL del sistema, solo el nombre (`kernel32.dll`): nunca una ruta. */
  dll: string;
  retorno: TipoPInvoke;
  parametros: readonly TipoPInvoke[];
}

const NOMBRE = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const DLL = /^[a-z0-9]{1,32}\.dll$/;

/** Firmas que usan los scripts de WolfCore Dev (las revisa una prueba que las lee de aquí). */
export const FIRMAS = {
  /** Vaciar el conjunto de trabajo de un proceso y comprobar su hora de creación en el handle. */
  procesos: [
    {
      nombre: 'OpenProcess',
      dll: 'kernel32.dll',
      retorno: 'ptr',
      parametros: ['u32', 'bool', 'i32'],
    },
    { nombre: 'CloseHandle', dll: 'kernel32.dll', retorno: 'bool', parametros: ['ptr'] },
    {
      nombre: 'GetProcessTimes',
      dll: 'kernel32.dll',
      retorno: 'bool',
      parametros: ['ptr', 'ref-i64', 'ref-i64', 'ref-i64', 'ref-i64'],
    },
    { nombre: 'EmptyWorkingSet', dll: 'psapi.dll', retorno: 'bool', parametros: ['ptr'] },
  ],
  /** Purga ELEVADA de la lista de espera y de la caché de archivos. */
  purga: [
    {
      nombre: 'RtlAdjustPrivilege',
      dll: 'ntdll.dll',
      retorno: 'i32',
      parametros: ['i32', 'u8', 'u8', 'ref-u8'],
    },
    {
      nombre: 'NtSetSystemInformation',
      dll: 'ntdll.dll',
      retorno: 'i32',
      parametros: ['i32', 'ref-i32', 'i32'],
    },
    {
      nombre: 'SetSystemFileCacheSize',
      dll: 'kernel32.dll',
      retorno: 'bool',
      parametros: ['ptr', 'ptr', 'i32'],
    },
  ],
  /** Ruta real de un archivo o carpeta (cortafuegos, elevado). */
  ruta: [
    {
      nombre: 'CreateFileW',
      dll: 'kernel32.dll',
      retorno: 'ptr',
      parametros: ['str', 'u32', 'u32', 'ptr', 'u32', 'u32', 'ptr'],
    },
    {
      nombre: 'GetFinalPathNameByHandleW',
      dll: 'kernel32.dll',
      retorno: 'u32',
      parametros: ['ptr', 'sb', 'u32', 'u32'],
    },
    { nombre: 'CloseHandle', dll: 'kernel32.dll', retorno: 'bool', parametros: ['ptr'] },
  ],
  /**
   * Dueño, elevación y sesión de un proceso leyendo su token, sin administrador y sin CIM:
   * `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`, `OpenProcessToken(TOKEN_QUERY)`,
   * `GetTokenInformation` (TokenUser y TokenElevation), `ConvertSidToStringSidW`.
   */
  dueno: [
    {
      nombre: 'OpenProcess',
      dll: 'kernel32.dll',
      retorno: 'ptr',
      parametros: ['u32', 'bool', 'i32'],
    },
    { nombre: 'CloseHandle', dll: 'kernel32.dll', retorno: 'bool', parametros: ['ptr'] },
    {
      nombre: 'ProcessIdToSessionId',
      dll: 'kernel32.dll',
      retorno: 'bool',
      parametros: ['u32', 'ref-i32'],
    },
    { nombre: 'LocalFree', dll: 'kernel32.dll', retorno: 'ptr', parametros: ['ptr'] },
    {
      nombre: 'OpenProcessToken',
      dll: 'advapi32.dll',
      retorno: 'bool',
      parametros: ['ptr', 'u32', 'ref-ptr'],
    },
    {
      nombre: 'GetTokenInformation',
      dll: 'advapi32.dll',
      retorno: 'bool',
      parametros: ['ptr', 'i32', 'ptr', 'u32', 'ref-i32'],
    },
    {
      nombre: 'ConvertSidToStringSidW',
      dll: 'advapi32.dll',
      retorno: 'bool',
      parametros: ['ptr', 'ref-ptr'],
    },
  ],
  /** Estado de notificación del usuario (juego o pantalla completa), sin administrador. */
  notificacion: [
    {
      nombre: 'SHQueryUserNotificationState',
      dll: 'shell32.dll',
      retorno: 'i32',
      parametros: ['ref-i32'],
    },
  ],
} as const satisfies Record<string, readonly FirmaPInvoke[]>;

const comillas = (t: string): string => `'${t.replace(/'/g, "''")}'`;

/**
 * Líneas de PowerShell que crean en memoria el tipo `nombreTipo` con las `firmas` y dejan en
 * `$variable` el tipo creado (se llama así: `$variable::Metodo(...)`). Dos conjuntos de líneas en el
 * mismo script se pisan los auxiliares `$wab` y `$wtb`, no la variable del tipo.
 */
export function lineasPInvoke(
  variable: string,
  nombreTipo: string,
  firmas: readonly FirmaPInvoke[],
): string[] {
  if (!/^[A-Za-z][A-Za-z0-9]{0,30}$/.test(variable)) throw new Error('Variable no válida.');
  if (!NOMBRE.test(nombreTipo)) throw new Error('Nombre de tipo no válido.');
  const lineas = [
    `$wab = [AppDomain]::CurrentDomain.DefineDynamicAssembly([Reflection.AssemblyName]::new(${comillas(nombreTipo)}), [Reflection.Emit.AssemblyBuilderAccess]::Run)`,
    `$wtb = $wab.DefineDynamicModule(${comillas(nombreTipo)}).DefineType(${comillas(`Wolf.${nombreTipo}`)}, [Reflection.TypeAttributes]'Public, Abstract, Sealed')`,
    'function Add-FirmaWolf($tb, [string]$n, [string]$dll, [Type]$ret, [Type[]]$par) {',
    "  $m = $tb.DefinePInvokeMethod($n, $dll, $n, [Reflection.MethodAttributes]'Public, Static, PinvokeImpl', [Reflection.CallingConventions]::Standard, $ret, $par, [Runtime.InteropServices.CallingConvention]::Winapi, [Runtime.InteropServices.CharSet]::Unicode)",
    '  $m.SetImplementationFlags($m.GetMethodImplementationFlags() -bor [Reflection.MethodImplAttributes]::PreserveSig)',
    '}',
  ];
  for (const f of firmas) {
    if (!NOMBRE.test(f.nombre)) throw new Error(`Nombre no válido: ${f.nombre}`);
    if (!DLL.test(f.dll)) throw new Error(`DLL no válida: ${f.dll}`);
    for (const t of [...f.parametros, f.retorno]) {
      if (!Object.hasOwn(TIPOS_PS, t)) throw new Error(`Tipo no admitido: ${String(t)}`);
    }
    const params = f.parametros.map((p) => TIPOS_PS[p]).join(', ');
    lineas.push(
      `Add-FirmaWolf $wtb ${comillas(f.nombre)} ${comillas(f.dll)} (${TIPOS_PS[f.retorno]}) ([Type[]]@(${params}))`,
    );
  }
  lineas.push(`$${variable} = $wtb.CreateType()`);
  return lineas;
}

/**
 * Líneas que definen `Get-DuenoWolf $pid [$handle]`: devuelve `@{ Sid; Elevado; Sesion }` leyendo el
 * token del proceso, o `$null` si no se puede (de sistema, protegido, elevado o de otro usuario: se
 * trata como «no propio» y nunca se toca). Si falla CUALQUIER lectura del token, también la de la
 * elevación, devuelve `$null` y el proceso queda excluido. Sin `$handle` abre el proceso con
 * `PROCESS_QUERY_LIMITED_INFORMATION`; con el de quien llama (el que se va a vaciar) lee el token de ESE
 * mismo handle y no lo cierra. Sin estructuras: `TOKEN_USER` se lee de un buffer con
 * `Marshal.ReadIntPtr` (su primer campo es el puntero al SID). Todo se libera en `finally`.
 */
export function lineasDuenoProceso(): string[] {
  return [
    ...lineasPInvoke('Dw', 'WolfDw', FIRMAS.dueno),
    'function Get-DuenoWolf([int]$id, [IntPtr]$hext = [IntPtr]::Zero) {',
    '  $m = [Runtime.InteropServices.Marshal]',
    '  $h = $hext; $propio = $false',
    '  if ($h -eq [IntPtr]::Zero) { $h = $Dw::OpenProcess(0x1000, $false, $id); $propio = $true }',
    '  if ($h -eq [IntPtr]::Zero) { return $null }',
    '  $t = [IntPtr]::Zero; $b = [IntPtr]::Zero; $e = [IntPtr]::Zero; $c = [IntPtr]::Zero',
    '  try {',
    '    if (-not $Dw::OpenProcessToken($h, 8, [ref]$t)) { return $null }',
    '    $n = [int32]0',
    '    $null = $Dw::GetTokenInformation($t, 1, [IntPtr]::Zero, 0, [ref]$n)',
    '    if ($n -le 0 -or $n -gt 4096) { return $null }',
    '    $b = $m::AllocHGlobal($n)',
    '    if (-not $Dw::GetTokenInformation($t, 1, $b, $n, [ref]$n)) { return $null }',
    '    if (-not $Dw::ConvertSidToStringSidW($m::ReadIntPtr($b), [ref]$c)) { return $null }',
    '    $sid = $m::PtrToStringUni($c)',
    '    $e = $m::AllocHGlobal(4); $m::WriteInt32($e, 0)',
    '    $k = [int32]4',
    '    if (-not $Dw::GetTokenInformation($t, 20, $e, 4, [ref]$k)) { return $null }',
    '    $el = $m::ReadInt32($e)',
    '    $ses = [int32]-1',
    '    if (-not $Dw::ProcessIdToSessionId($id, [ref]$ses)) { return $null }',
    '    return [pscustomobject]@{ Sid = $sid; Elevado = ($el -ne 0); Sesion = $ses }',
    '  } catch { return $null } finally {',
    '    if ($c -ne [IntPtr]::Zero) { $null = $Dw::LocalFree($c) }',
    '    if ($b -ne [IntPtr]::Zero) { $m::FreeHGlobal($b) }',
    '    if ($e -ne [IntPtr]::Zero) { $m::FreeHGlobal($e) }',
    '    if ($t -ne [IntPtr]::Zero) { $null = $Dw::CloseHandle($t) }',
    '    if ($propio) { $null = $Dw::CloseHandle($h) }',
    '  }',
    '}',
  ];
}
