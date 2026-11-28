import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AYUDA_RUTA,
  cuerpoQuitarReglas,
  cuerpoRestaurarReglas,
  scriptCargador,
} from '../src/plataforma/firewallCambiosWin';
import { codificarComando, scriptCopiaHosts } from '../src/plataforma/hostsAdmin';
import { scriptPurgarListaEspera, scriptVaciarWorkingSets } from '../src/plataforma/memoriaWin';
import { FIRMAS, lineasPInvoke } from '../src/plataforma/pinvokeWin';
import { scriptQuitarCarpeta } from '../src/plataforma/redWin';
import { cuerpoSaludDiscosAdmin } from '../src/plataforma/saludDiscosWin';
import { PlataformaWindows } from '../src/plataforma/win';
import { analizarPowerShell, hayPowerShell } from './soporte/parserPowerShell';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

/**
 * I3 (D54b): un proceso elevado no puede compilar nada. En Windows PowerShell 5.1 `Add-Type`
 * compila con csc y deja `.cs`, `.cmdline` y `.dll` en el %TEMP% del usuario (que comparten los
 * procesos de integridad media): quien sustituya la `.dll` ejecutaría código como administrador.
 */
const PROHIBIDO_EN_ELEVADOS =
  /Add-Type|\bcsc(\.exe)?\b|CompileAssemblyFromSource|CSharpCodeProvider|\[\s*(System\.)?Reflection\.Assembly\s*\]\s*::\s*(LoadFile|LoadFrom|UnsafeLoadFrom)|Assembly\]::Load\(/i;

const regla = {
  id: 'a'.repeat(32),
  nombre: '{A-1}',
  programa: 'C:\\Datos\\bin\\nginx\\nginx.exe',
  raiz: 'C:\\Datos',
  tipo: 'propia' as const,
  temporal: 'C:\\Temp',
};

/** Lo que corre elevado, tal cual lo recibiría el comando elevado (cuerpos y comandos sueltos). */
async function cuerposElevados(): Promise<Record<string, string>> {
  const cuerpos: Record<string, string> = {
    'copia de hosts (sistema)': scriptCopiaHosts({
      temporal: 'C:\\Temp\\pel-hosts-1.txt',
      destino: null,
      limiteUnixMs: 1_800_000_000_000,
      hashTemporal: 'A'.repeat(64),
      hashPrevio: 'B'.repeat(64),
    }),
    'copia de hosts (archivo)': scriptCopiaHosts({
      temporal: 'C:\\Temp\\pel-hosts-1.txt',
      destino: 'C:\\Temp\\hosts',
      limiteUnixMs: null,
      hashTemporal: 'A'.repeat(64),
      hashPrevio: null,
    }),
    'purga de memoria': scriptPurgarListaEspera(),
    'quitar carpeta compartida': scriptQuitarCarpeta('Datos', 'C:\\Datos', 1_800_000_000_000),
    'cargador del cortafuegos': scriptCargador('C:\\Temp\\pel-fw-1.txt', 'c'.repeat(64)),
    'quitar reglas del cortafuegos': cuerpoQuitarReglas([regla], 1_800_000_000_000),
    'restaurar reglas del cortafuegos': cuerpoRestaurarReglas([], null),
    'salud de los discos (admin)': cuerpoSaludDiscosAdmin('1-1-abc'),
    'ayuda de rutas': AYUDA_RUTA.join('\n'),
  };
  // Los comandos elevados que viven dentro de `win.ts`: se capturan con un ejecutor falso.
  const capturados: string[] = [];
  const p = new PlataformaWindows(
    async (_c, args) => {
      const externo = args[args.indexOf('-Command') + 1] ?? '';
      const b64 = /FromBase64String\('([A-Za-z0-9+/=]+)'\)/.exec(externo)?.[1] ?? '';
      capturados.push(Buffer.from(b64, 'base64').toString('utf16le'));
      return { codigo: 0, stdout: '', stderr: '' };
    },
    undefined,
    { entorno: { SystemRoot: 'C:\\Windows' } },
  );
  await p.detenerServicioSistema('Spooler');
  await p.quitarSoloLecturaHosts();
  await p.purgarListaEspera();
  capturados.forEach((c, i) => {
    cuerpos[`comando elevado de win.ts #${i + 1}`] = c;
  });
  return cuerpos;
}

describe('I3: ningún script elevado compila ni carga código de disco', () => {
  it('ningún cuerpo elevado contiene Add-Type, csc, CompileAssemblyFromSource ni LoadFile', async () => {
    const cuerpos = await cuerposElevados();
    expect(Object.keys(cuerpos).length).toBeGreaterThanOrEqual(10);
    for (const [nombre, cuerpo] of Object.entries(cuerpos)) {
      expect(cuerpo.length, nombre).toBeGreaterThan(20);
      expect(cuerpo, nombre).not.toMatch(PROHIBIDO_EN_ELEVADOS);
    }
  });

  it('Add-Type solo queda en el script (sin elevar) que avisa del cambio de PATH del usuario', () => {
    const dir = path.join(SRC, 'plataforma');
    const conAddType = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /Add-Type/.test(sinComentarios(readFileSync(path.join(dir, f), 'utf8'))));
    expect(conAddType).toEqual(['pathUsuarioWin.ts']);
  });

  it.skipIf(!hayPowerShell())('los cuerpos nuevos son PowerShell válido', async () => {
    const cuerpos = await cuerposElevados();
    const nombres = Object.keys(cuerpos);
    const analisis = analizarPowerShell([
      ...Object.values(cuerpos),
      scriptVaciarWorkingSets([{ pid: 100, inicio: '133000000000000000' }]),
    ]);
    analisis.forEach((a, i) => expect(a.errores, nombres[i] ?? 'vaciado').toEqual([]));
  });

  it('las firmas P/Invoke son DLL del sistema por nombre, sin estructuras ni SetLastError', () => {
    const todas = Object.values(FIRMAS).flat();
    expect(todas.length).toBeGreaterThanOrEqual(10);
    for (const f of todas) {
      expect(f.dll, f.nombre).toMatch(/^(kernel32|psapi|ntdll|shell32|advapi32)\.dll$/);
    }
    const s = lineasPInvoke('P', 'WolfP', FIRMAS.purga).join('\n');
    expect(s).toContain('DefineDynamicAssembly');
    expect(s).toContain('AssemblyBuilderAccess]::Run');
    expect(s).toContain('DefineDynamicModule');
    expect(s).toContain('DefinePInvokeMethod');
    expect(s).toContain('PreserveSig');
    expect(s).toContain(
      "'RtlAdjustPrivilege' 'ntdll.dll' ([int32]) ([Type[]]@([int32], [byte], [byte], [byte].MakeByRefType()))",
    );
    expect(() =>
      lineasPInvoke('P', 'WolfP', [{ ...FIRMAS.purga[0], dll: 'C:\\x\\a.dll' }]),
    ).toThrow();
    expect(() => lineasPInvoke('P', 'WolfP', [{ ...FIRMAS.purga[0], nombre: "a'b" }])).toThrow();
  });
});

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');

describe.skipIf(process.platform !== 'win32' || !hayPowerShell())(
  'con PowerShell real, sin elevar: el tipo se crea en memoria',
  () => {
    const ps = (script: string) =>
      spawnSync(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-EncodedCommand', codificarComando(script)],
        { encoding: 'utf8', windowsHide: true, timeout: 120_000 },
      );
    const temporales = (): Set<string> => new Set(readdirSync(tmpdir()));

    it('las firmas declaradas son las del tipo creado y no se escribe nada en %TEMP%', () => {
      const antes = temporales();
      const lineas = [
        "$ErrorActionPreference = 'Stop'",
        ...lineasPInvoke('Pur', 'WolfPur', FIRMAS.purga),
        ...lineasPInvoke('Ws', 'WolfWs', FIRMAS.procesos),
        ...lineasPInvoke('Ru', 'WolfRu', FIRMAS.ruta),
        ...lineasPInvoke('No', 'WolfNo', FIRMAS.notificacion),
        'foreach ($t in @($Pur, $Ws, $Ru, $No)) { foreach ($m in $t.GetMethods([Reflection.BindingFlags]"Public,Static,DeclaredOnly")) { [Console]::Out.WriteLine($m.Name + ":" + $m.ReturnType.Name + ":" + (($m.GetParameters() | ForEach-Object { $_.ParameterType.Name }) -join ",")) } }',
      ].join('\n');
      const r = ps(lineas);
      expect(r.status).toBe(0);
      const salida = r.stdout.trim().split(/\r?\n/).sort();
      const esperado = [
        'RtlAdjustPrivilege:Int32:Int32,Byte,Byte,Byte&',
        'NtSetSystemInformation:Int32:Int32,Int32&,Int32',
        'SetSystemFileCacheSize:Boolean:IntPtr,IntPtr,Int32',
        'OpenProcess:IntPtr:UInt32,Boolean,Int32',
        'CloseHandle:Boolean:IntPtr',
        'GetProcessTimes:Boolean:IntPtr,Int64&,Int64&,Int64&,Int64&',
        'EmptyWorkingSet:Boolean:IntPtr',
        'CreateFileW:IntPtr:String,UInt32,UInt32,IntPtr,UInt32,UInt32,IntPtr',
        'GetFinalPathNameByHandleW:UInt32:IntPtr,StringBuilder,UInt32,UInt32',
        'CloseHandle:Boolean:IntPtr',
        'SHQueryUserNotificationState:Int32:Int32&',
      ].sort();
      expect(salida).toEqual(esperado);
      const nuevos = [...temporales()].filter(
        (f) => !antes.has(f) && /\.(cs|cmdline|dll|out|err|pdb)$/i.test(f),
      );
      expect(nuevos).toEqual([]);
    });

    it('OpenProcess, GetProcessTimes y CloseHandle funcionan de verdad sobre el propio proceso', () => {
      const r = ps(
        [
          "$ErrorActionPreference = 'Stop'",
          ...lineasPInvoke('Ws', 'WolfWs', FIRMAS.procesos),
          '$h = $Ws::OpenProcess(0x1000, $false, $PID)',
          'if ($h -eq [IntPtr]::Zero) { exit 3 }',
          '$a = [int64]0; $b = [int64]0; $k = [int64]0; $u = [int64]0',
          'if (-not $Ws::GetProcessTimes($h, [ref]$a, [ref]$b, [ref]$k, [ref]$u)) { exit 4 }',
          '$esperado = [Diagnostics.Process]::GetCurrentProcess().StartTime.ToFileTimeUtc()',
          '[Console]::Out.Write([math]::Abs($a - $esperado))',
          'if (-not $Ws::CloseHandle($h)) { exit 5 }',
        ].join('\n'),
      );
      expect(r.status).toBe(0);
      expect(Number(r.stdout)).toBeLessThan(1_000_000);
    });

    it('Get-RutaReal expande un nombre corto 8.3 y deja intacto lo que falta al final', () => {
      const r = ps(
        [
          "$ErrorActionPreference = 'Stop'",
          ...AYUDA_RUTA,
          "$real = Get-RutaReal ([IO.Path]::Combine([Environment]::SystemDirectory, 'no-existe', 'a.exe'))",
          '$sys = Get-RutaReal ([Environment]::SystemDirectory)',
          "[Console]::Out.Write($real + '|' + $sys + '|' + [Environment]::SystemDirectory)",
        ].join('\n'),
      );
      expect(r.status).toBe(0);
      const [real, sys, esperado] = r.stdout.split('|');
      expect(sys!.toLowerCase()).toBe(esperado!.toLowerCase());
      expect(real!.toLowerCase()).toBe(`${esperado}\\no-existe\\a.exe`.toLowerCase());
    });
  },
);
