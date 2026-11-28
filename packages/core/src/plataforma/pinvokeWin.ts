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
    const params = f.parametros.map((p) => TIPOS_PS[p]).join(', ');
    lineas.push(
      `Add-FirmaWolf $wtb ${comillas(f.nombre)} ${comillas(f.dll)} (${TIPOS_PS[f.retorno]}) ([Type[]]@(${params}))`,
    );
  }
  lineas.push(`$${variable} = $wtb.CreateType()`);
  return lineas;
}
