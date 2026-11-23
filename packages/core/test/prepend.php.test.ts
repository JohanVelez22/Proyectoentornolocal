/**
 * Prueba real del prepend de la captura de dumps con un PHP de verdad y de `wolfdump` con un
 * Python de verdad. PHP sale de `PEL_PHP_DIR` (carpeta con el ejecutable) o del zip de
 * windows.php.net que dejó la prueba de integración en la caché de descargas; sin ninguno, esa
 * parte se salta. Python: el del PATH (python3 o python); sin él, se salta.
 *
 * Review Focus 5: con el receptor apagado la página responde igual y en menos de 250 ms extra;
 * `dd()` sigue deteniendo; el token nunca aparece en la salida.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extraerZip } from '../src/catalogo/zip';
import { asegurarArchivosDepuracion, rutasDepuracion } from '../src/depuracion/prepend';
import { ReceptorDumps, type ResumenDump } from '../src/depuracion/receptor';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

const CACHE = process.env.PEL_INT_CACHE ?? path.join(os.tmpdir(), 'pel-etapa-a-cache');
const ejecutablePhp = process.platform === 'win32' ? 'php.exe' : 'php';

function zipPhp(): string | null {
  if (process.platform !== 'win32' || !existsSync(CACHE)) return null;
  const zip = readdirSync(CACHE).find((n) =>
    /^windows\.php\.net_php-8[\d.-]+nts.*x64\.zip$/.test(n),
  );
  return zip ? path.join(CACHE, zip) : null;
}

function zipVarDumper(): string | null {
  const dir = path.join(CACHE, 'composer-cache', 'files', 'symfony', 'var-dumper');
  if (!existsSync(dir)) return null;
  const zip = readdirSync(dir).find((n) => n.endsWith('.zip'));
  return zip ? path.join(dir, zip) : null;
}

const dirPhpEnv = process.env.PEL_PHP_DIR;
const hayPhp =
  (!!dirPhpEnv && existsSync(path.join(dirPhpEnv, ejecutablePhp))) || zipPhp() !== null;

function buscarPython(): string | null {
  for (const c of ['python3', 'python']) {
    const r = spawnSync(c, ['-c', 'import sys; print(sys.version_info[0])'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15_000,
    });
    if (r.status === 0 && r.stdout.trim() === '3') return c;
  }
  return null;
}
const python = buscarPython();

interface Corrida {
  codigo: number | null;
  salida: string;
  error: string;
}

/** Receptor real en un puerto libre, con lo que llega a la vista. */
async function receptorReal(base: string): Promise<{
  r: ReceptorDumps;
  llegados: ResumenDump[];
}> {
  const llegados: ResumenDump[] = [];
  const r = new ReceptorDumps({
    rutas: new Rutas(base),
    puerto: async () => 0,
    emitir: (d) => llegados.push(d),
  });
  await r.iniciar();
  return { r, llegados };
}

const esperarDump = async (llegados: ResumenDump[], n = 1): Promise<void> => {
  for (let i = 0; i < 50 && llegados.length < n; i++) await new Promise((r) => setTimeout(r, 20));
};

describe.skipIf(!hayPhp)('prepend de dumps con un PHP real', () => {
  let base: string;
  let dirPhp: string;
  let proyecto: string;
  let ini: string;
  let prepend: string;
  let receptor: string;
  let dirVd: string | null = null;

  beforeAll(async () => {
    // Propia (no carpetaTemporal): vive para todas las pruebas del bloque.
    base = await mkdtemp(path.join(os.tmpdir(), 'pel-prepend-real-'));
    if (dirPhpEnv && existsSync(path.join(dirPhpEnv, ejecutablePhp))) dirPhp = dirPhpEnv;
    else {
      dirPhp = path.join(base, 'php');
      await extraerZip(zipPhp()!, dirPhp);
    }
    const r = await asegurarArchivosDepuracion(new Rutas(base));
    prepend = r.prepend;
    receptor = rutasDepuracion(new Rutas(base)).receptor;
    proyecto = path.join(base, 'proyecto');
    await mkdir(proyecto, { recursive: true });
    ini = path.join(base, 'php.ini');
    const lineas = [
      '[PHP]',
      'display_errors = On',
      'error_reporting = E_ALL',
      `extension_dir = "${path.join(dirPhp, 'ext').replace(/\\/g, '/')}"`,
      ...(existsSync(path.join(dirPhp, 'ext')) ? ['extension = mbstring'] : []),
      'wolfcore.sitio = "demo"',
      `auto_prepend_file = "${prepend.replace(/\\/g, '/')}"`,
    ];
    await writeFile(ini, lineas.join('\n') + '\n');
    const vd = zipVarDumper();
    if (vd) {
      dirVd = path.join(base, 'var-dumper');
      await extraerZip(vd, dirVd);
      // El zip de Composer trae una carpeta raíz (symfony-var-dumper-<hash>).
      const dentro = await readdir(dirVd);
      if (dentro.length === 1 && !existsSync(path.join(dirVd, 'VarDumper.php'))) {
        dirVd = path.join(dirVd, dentro[0]!);
      }
    }
  }, 120_000);

  const correr = async (codigo: string, extraIni: string[] = []): Promise<Corrida> => {
    const script = path.join(proyecto, `s${Date.now()}${Math.random().toString(36).slice(2)}.php`);
    await writeFile(script, codigo);
    let iniUsado = ini;
    if (extraIni.length > 0) {
      iniUsado = `${script}.ini`;
      const { readFile } = await import('node:fs/promises');
      await writeFile(iniUsado, `${await readFile(ini, 'utf8')}${extraIni.join('\n')}\n`);
    }
    // spawnSync bloquearía el receptor (mismo hilo): se espera el proceso de forma asíncrona.
    const { spawn } = await import('node:child_process');
    return new Promise((ok, mal) => {
      const p = spawn(path.join(dirPhp, ejecutablePhp), ['-c', iniUsado, script], {
        cwd: proyecto,
        windowsHide: true,
      });
      let salida = '';
      let error = '';
      p.stdout.on('data', (b: Buffer) => (salida += b.toString('utf8')));
      p.stderr.on('data', (b: Buffer) => (error += b.toString('utf8')));
      p.on('error', mal);
      p.on('close', (c) => ok({ codigo: c, salida, error }));
    });
  };

  it('dump() llega con archivo, línea, sitio y texto; la salida no cambia y no lleva el token', async () => {
    const { r, llegados } = await receptorReal(base);
    try {
      const { token } = JSON.parse(
        await (await import('node:fs/promises')).readFile(receptor, 'utf8'),
      ) as { token: string };
      const c = await correr(
        '<?php\n$x = ["clave" => "valor", "n" => 42];\n$y = dump($x);\necho "\\nFIN:", $y["n"];\n',
      );
      expect(c.codigo).toBe(0);
      expect(c.salida).toContain('[clave] => valor');
      expect(c.salida).toContain('FIN:42');
      expect(c.salida + c.error).not.toContain(token);
      await esperarDump(llegados);
      expect(llegados).toHaveLength(1);
      const d = r.leer(llegados[0]!.id)!;
      expect(d.origen).toBe('php');
      expect(d.sitioId).toBe('demo');
      expect(path.basename(d.archivo!)).toMatch(/^s.*\.php$/);
      expect(d.linea).toBe(3);
      expect(d.texto).toContain('[clave] => valor');
    } finally {
      await r.detener();
    }
  });

  it('el token no aparece en trazas con argumentos (exception_ignore_args=Off) ni con un manejador que lanza', async () => {
    // Un receptor que acepta y corta: fwrite/fread fallan dentro de enviar().
    const cortador = net.createServer((s) => s.destroy());
    await new Promise<void>((ok) => cortador.listen(0, '127.0.0.1', () => ok()));
    const puerto = (cortador.address() as net.AddressInfo).port;
    const token = 'c'.repeat(64);
    const fs = await import('node:fs/promises');
    await fs.writeFile(receptor, JSON.stringify({ puerto, token, pid: process.pid }));
    try {
      const c = await correr(
        [
          '<?php',
          // Como Laravel: todo aviso se vuelve excepción, y las excepciones se muestran con traza.
          'set_error_handler(function ($n, $m, $f, $l) { throw new ErrorException($m, 0, $n, $f, $l); });',
          'set_exception_handler(function ($e) { echo "TRAZA:", $e->getTraceAsString(), print_r($e->getTrace(), true); });',
          'register_shutdown_function(function () { echo "\\nERR:", print_r(error_get_last(), true); });',
          'for ($i = 0; $i < 3; $i++) { dump(["i" => $i]); wd($i); }',
          'echo "\\nFIN";',
          'throw new RuntimeException("adrede");',
        ].join('\n'),
        ['zend.exception_ignore_args = Off', 'display_errors = On', 'html_errors = Off'],
      );
      expect(c.salida).toContain('FIN');
      expect(c.salida).toContain('TRAZA:');
      expect(c.salida + c.error).not.toContain(token);
    } finally {
      await fs.rm(receptor, { force: true });
      cortador.close();
    }
  });

  it('wd() solo envía; dd() envía, muestra y detiene con código 1', async () => {
    const { r, llegados } = await receptorReal(base);
    try {
      const w = await correr('<?php\n$v = wd("solo-enviar");\necho "R:", $v;\n');
      expect(w.salida).toBe('R:solo-enviar');
      const d = await correr('<?php\necho "antes\\n";\ndd([1, 2]);\necho "NUNCA";\n');
      expect(d.codigo).toBe(1);
      expect(d.salida).toContain('antes');
      expect(d.salida).not.toContain('NUNCA');
      await esperarDump(llegados, 2);
      expect(llegados.map((x) => x.linea)).toEqual([2, 3]);
    } finally {
      await r.detener();
    }
  });

  it('con el receptor apagado: misma salida y menos de 250 ms extra', async () => {
    // Sin archivo del receptor (lo normal al apagarlo).
    const codigo =
      '<?php\n$t = microtime(true);\n$r = dump(["a" => 1]);\n$t = microtime(true) - $t;\necho "\\nT=", $t;\n';
    const sin = await correr(codigo);
    expect(sin.codigo).toBe(0);
    expect(sin.salida).toContain('[a] => 1');
    expect(sin.error).toBe('');
    expect(Number(/T=([\d.E-]+)/.exec(sin.salida)![1])).toBeLessThan(0.25);
    // Con el archivo de una sesión que se cortó: el puerto ya no escucha.
    const { r } = await receptorReal(base);
    const fs = await import('node:fs/promises');
    const guardado = await fs.readFile(receptor, 'utf8');
    await r.detener();
    await fs.writeFile(receptor, guardado);
    try {
      const caido = await correr(codigo);
      expect(caido.codigo).toBe(0);
      expect(caido.salida).toContain('[a] => 1');
      expect(caido.salida).not.toMatch(/Warning|Notice|Fatal/);
      expect(Number(/T=([\d.E-]+)/.exec(caido.salida)![1])).toBeLessThan(0.25);
    } finally {
      await fs.rm(receptor, { force: true });
    }
  });

  it('un archivo del receptor sin latido reciente (la app se cortó) no se usa', async () => {
    const { r, llegados } = await receptorReal(base);
    try {
      const viejo = new Date(Date.now() - 10 * 60_000);
      const { utimes } = await import('node:fs/promises');
      await utimes(receptor, viejo, viejo);
      const c = await correr('<?php\nwd(1);\necho "OK";\n');
      expect(c.salida).toBe('OK');
      await new Promise((ok) => setTimeout(ok, 300));
      expect(llegados).toHaveLength(0);
    } finally {
      await r.detener();
    }
  });

  it('un receptor colgado (acepta y no responde) solo demora el plazo', async () => {
    const colgado = net.createServer(() => undefined);
    await new Promise<void>((ok) => colgado.listen(0, '127.0.0.1', () => ok()));
    const puerto = (colgado.address() as net.AddressInfo).port;
    const fs = await import('node:fs/promises');
    await fs.writeFile(
      receptor,
      JSON.stringify({ puerto, token: 'f'.repeat(64), pid: process.pid }),
    );
    try {
      const c = await correr(
        '<?php\n$t = microtime(true);\ndump(1);\necho "\\nT=", microtime(true) - $t;\n',
      );
      expect(c.codigo).toBe(0);
      expect(Number(/T=([\d.E-]+)/.exec(c.salida)![1])).toBeLessThan(0.6);
    } finally {
      await fs.rm(receptor, { force: true });
      colgado.close();
    }
  });

  it('un receptor que no lee un cuerpo grande: el plazo es total, no por escritura', async () => {
    const colgado = net.createServer((s) => s.pause());
    await new Promise<void>((ok) => colgado.listen(0, '127.0.0.1', () => ok()));
    const puerto = (colgado.address() as net.AddressInfo).port;
    const fs = await import('node:fs/promises');
    await fs.mkdir(path.dirname(receptor), { recursive: true });
    await fs.writeFile(
      receptor,
      JSON.stringify({ puerto, token: 'f'.repeat(64), pid: process.pid }),
    );
    try {
      const c = await correr(
        '<?php\n$t = microtime(true);\nfor ($i = 0; $i < 3; $i++) { wd(str_repeat("x", 250000)); }\necho "T=", (microtime(true) - $t) / 3;\n',
      );
      expect(c.codigo).toBe(0);
      // Cada envío espera como mucho el plazo (0,2 s) más un margen.
      expect(Number(/T=([\d.E-]+)/.exec(c.salida)![1])).toBeLessThan(0.3);
    } finally {
      await fs.rm(receptor, { force: true });
      colgado.close();
    }
  });

  it('el auto_prepend_file anterior del sitio sigue cargándose en el ámbito global', async () => {
    const previo = path.join(base, 'previo.php');
    await writeFile(previo, '<?php $DEL_PREVIO = "si";\n');
    const c = await correr('<?php\necho "P:", $DEL_PREVIO ?? "no";\n', [
      `wolfcore.prepend_previo = "${previo.replace(/\\/g, '/')}"`,
    ]);
    expect(c.salida).toBe('P:si');
  });

  it('dump() dentro de un manejador de ob_start no rompe la página y llega igual', async () => {
    const { r, llegados } = await receptorReal(base);
    try {
      const c = await correr(
        [
          '<?php',
          'class Nodo { public $hijo; protected $p = "pp"; private $q = "qq"; }',
          '$n = new Nodo(); $n->hijo = $n;',
          'ob_start(function ($b) use ($n) { wd(["en" => "manejador", "n" => $n]); dump([1]); return strtoupper($b); });',
          'echo "hola";',
          'ob_end_flush();',
          'echo "\\nFIN";',
        ].join('\n'),
      );
      expect(c.error).toBe('');
      expect(c.salida).not.toMatch(/Fatal|Cannot use output buffering/);
      expect(c.salida).toContain('HOLA');
      expect(c.salida).toContain('FIN');
      await esperarDump(llegados, 2);
      const textos = llegados.map((x) => r.leer(x.id)!.texto).join('\n');
      expect(textos).toContain('[en] => manejador');
      expect(textos).toContain('Nodo Object');
      expect(textos).toContain('*RECURSION*');
      expect(textos).toContain('[p:protected] => pp');
      expect(textos).toContain('[q:Nodo:private] => qq');
    } finally {
      await r.detener();
    }
  });

  it('un prepend anterior que apunta al nuestro no entra en recursión', async () => {
    const otraForma = prepend.replace(/\\/g, '/');
    const c = await correr('<?php\necho "OK:", function_exists("wd") ? "si" : "no";\n', [
      `wolfcore.prepend_previo = "${process.platform === 'win32' ? otraForma.toUpperCase() : otraForma}"`,
    ]);
    expect(c.error).toBe('');
    expect(c.codigo).toBe(0);
    expect(c.salida).toBe('OK:si');
  });

  it('un autoloader propio que hace require de cualquier clase no se dispara', async () => {
    const { r, llegados } = await receptorReal(base);
    try {
      const c = await correr(
        '<?php\nspl_autoload_register(function ($c) { require __DIR__ . "/no-existe/" . $c . ".php"; });\ndump(5);\necho "\\nOK";\n',
      );
      expect(c.codigo).toBe(0);
      expect(c.salida).toContain('OK');
      await esperarDump(llegados);
      expect(llegados).toHaveLength(1);
    } finally {
      await r.detener();
    }
  });

  it.skipIf(zipVarDumper() === null)(
    'con VarDumper y un manejador propio (como Laravel): se captura y se muestra con él',
    async () => {
      if (!dirVd) throw new Error('No se pudo extraer symfony/var-dumper');
      const { r, llegados } = await receptorReal(base);
      const vd = dirVd.replace(/\\/g, '/');
      try {
        // Un ClassLoader mínimo con el nombre de Composer (findFile + loadClass).
        const c = await correr(
          `<?php
namespace Composer\\Autoload {
  class ClassLoader {
    public function findFile($c) {
      $p = 'Symfony\\\\Component\\\\VarDumper\\\\';
      if (strpos($c, $p) !== 0) return false;
      $f = '${vd}/' . str_replace('\\\\', '/', substr($c, strlen($p))) . '.php';
      return is_file($f) ? $f : false;
    }
    public function loadClass($c) { $f = $this->findFile($c); if ($f) { require $f; return true; } }
  }
}
namespace {
  $l = new Composer\\Autoload\\ClassLoader();
  spl_autoload_register([$l, 'loadClass'], true, true);
  require '${vd}/Resources/functions/dump.php';
  Symfony\\Component\\VarDumper\\VarDumper::setHandler(function ($v) { echo "PROPIO:", json_encode($v), "\\n"; });
  dump(['k' => 'v']);
}
`,
        );
        expect(c.error).toBe('');
        expect(c.salida).toContain('PROPIO:{"k":"v"}');
        await esperarDump(llegados);
        const d = r.leer(llegados[0]!.id)!;
        // Texto de CliDumper (sin colores), no print_r.
        expect(d.texto).toMatch(/array:1 \[/);
        expect(d.texto).toContain('"k" => "v"');
        expect(d.linea).toBe(18);
      } finally {
        await r.detener();
      }
    },
  );

  afterAll(async () => {
    await rm(base, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  });
});

describe.skipIf(!python)('wolfdump con un Python real', () => {
  const correrPy = (carpetaPython: string, codigo: string, cwd: string): Promise<Corrida> =>
    new Promise((ok, mal) => {
      void import('node:child_process').then(({ spawn }) => {
        const p = spawn(python!, ['-c', codigo], {
          cwd,
          windowsHide: true,
          env: { ...process.env, PYTHONPATH: carpetaPython, WOLFCORE_SITIO: 'api' },
        });
        let salida = '';
        let error = '';
        p.stdout.on('data', (b: Buffer) => (salida += b.toString('utf8')));
        p.stderr.on('data', (b: Buffer) => (error += b.toString('utf8')));
        p.on('error', mal);
        p.on('close', (c) => ok({ codigo: c, salida, error }));
      });
    });

  it('dump() llega con archivo, línea y sitio; sin receptor sigue rápido y en silencio', async () => {
    const base = await carpetaTemporal('pel-wolfdump-real-');
    const { carpetaPython } = await asegurarArchivosDepuracion(new Rutas(base));
    const codigo = [
      'import time',
      'from wolfdump import dump',
      't = time.time()',
      'v = dump({"a": [1, 2]})',
      'print("T=%f" % (time.time() - t))',
      'print("V=%r" % (v,))',
    ].join('\n');
    const { r, llegados } = await receptorReal(base);
    try {
      const c = await correrPy(carpetaPython, codigo, base);
      expect(c.error).toBe('');
      expect(c.salida).toContain("V={'a': [1, 2]}");
      await esperarDump(llegados);
      const d = r.leer(llegados[0]!.id)!;
      expect(d.origen).toBe('python');
      expect(d.sitioId).toBe('api');
      expect(d.linea).toBe(4);
      expect(d.texto).toBe("{'a': [1, 2]}");
    } finally {
      await r.detener();
    }
    // Con el archivo de un receptor cuyo proceso ya no existe: no envía.
    const { r: r2, llegados: l2 } = await receptorReal(base);
    try {
      const { spawn } = await import('node:child_process');
      const muerto = await new Promise<number>((ok) => {
        const p = spawn(process.execPath, ['-e', ''], { windowsHide: true });
        p.on('exit', () => ok(p.pid!));
      });
      const fs = await import('node:fs/promises');
      const ruta = rutasDepuracion(new Rutas(base)).receptor;
      const c = JSON.parse(await fs.readFile(ruta, 'utf8')) as Record<string, unknown>;
      await fs.writeFile(ruta, JSON.stringify({ ...c, pid: muerto }));
      const m = await correrPy(carpetaPython, codigo, base);
      expect(m.error).toBe('');
      await new Promise((ok) => setTimeout(ok, 300));
      expect(l2).toHaveLength(0);
    } finally {
      await r2.detener();
    }
    const sin = await correrPy(carpetaPython, codigo, base);
    expect(sin.codigo).toBe(0);
    expect(sin.error).toBe('');
    expect(Number(/T=([\d.]+)/.exec(sin.salida)![1])).toBeLessThan(0.25);
  });
});
