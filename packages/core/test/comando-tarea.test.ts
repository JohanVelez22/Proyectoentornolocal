import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { huellaTarea, validarComandoTarea } from '../src/tareas/comando';

const bs = String.fromCharCode(92);
const malo = (c: unknown): void => {
  try {
    validarComandoTarea(c);
  } catch (e) {
    expect(e, JSON.stringify(c)).toBeInstanceOf(ErrorWolf);
    expect((e as ErrorWolf).codigo).toBe('tareas.comando_invalido');
    return;
  }
  throw new Error(`debía rechazar: ${JSON.stringify(c)}`);
};

describe('validarComandoTarea (lista cerrada)', () => {
  it('acepta los comandos de proyecto de siempre', () => {
    for (const c of [
      ['php', 'artisan', 'schedule:run'],
      ['php', 'spark', 'tasks:run'],
      ['PHP.exe', 'artisan', 'queue:work', '--stop-when-empty'],
      ['python', 'manage.py', 'clearsessions'],
      ['php', '-f', 'bin/job.php', 'x'],
      ['python', '-m', 'celery', 'worker'],
      ['python', '-m', 'django', 'clearsessions'],
      ['npm', 'run', 'cron', '--', '--rapido'],
      ['node', 'scripts/limpiar.js'],
      ['npm', 'run', 'cron'],
      ['npm', 'run-script', 'cron', '--', '--rapido'],
    ]) {
      expect(() => validarComandoTarea(c), c.join(' ')).not.toThrow();
    }
  });

  it('rechaza programas fuera de la lista, rutas, .cmd/.bat y npx', () => {
    for (const c of [
      ['curl', 'https://ejemplo.test'],
      ['bash', '-c', 'x'],
      ['cmd', '/c', 'dir'],
      ['powershell', '-Command', 'x'],
      ['npx', 'cowsay'],
      ['composer', 'install'],
      ['git', 'pull'],
      ['C:\\php\\php.exe', 'x.php'],
      ['./php', 'x.php'],
      ['php/../../x', 'a'],
      ['deploy.cmd'],
      ['deploy.bat'],
      ['php.cmd', 'x'],
      ['node.exe.bat', 'x'],
    ]) {
      malo(c);
    }
  });

  it('lista blanca por posición: nada de opciones antes del archivo (casos de la revisión)', () => {
    for (const c of [
      ['php', '-recho 1;'],
      ['php', '-r', 'system("x");'],
      ['php', '-d', 'auto_prepend_file=x.php', 'a.php'],
      ['php', '-dauto_prepend_file=x.php', 'a.php'],
      ['php', '-a'],
      ['php', '-S', 'localhost:8000'],
      ['php', '-f', '-r', 'x'],
      ['php', '-f'],
      ['node', '-pe', '1'],
      ['node', '-e', 'x'],
      ['node', '--eval=x'],
      ['node', '--loader', 'x.mjs', 'a.js'],
      ['node', '--inspect=0.0.0.0', 'a.js'],
      ['node', '--require', 'x.js', 'a.js'],
      ['node', '--import=x', 'a.js'],
      ['python', '-cprint(1)'],
      ['python', '-c', 'import os'],
      ['python', '-Ic', 'x'],
      ['python', '-i'],
      ['python', '-m', 'pip', 'install', 'x'],
      ['python', '-m', 'http.server'],
      ['python', '-mpip', 'x'],
      ['python', '-m'],
      ['npm', 'run', 'x', '--script-shell=cmd.exe'],
      ['npm', 'run', '--script-shell=cmd.exe', 'x'],
      ['npm', '--prefix', 'x', 'run', 'y'],
      ['npm', 'run', 'x', '--node-options=--require=y'],
      ['npm', 'run', '-w', 'x'],
      ['npm', 'run', '--prefix=x'],
    ]) {
      malo(c);
    }
  });

  it('el primer argumento no puede ser una ruta absoluta, de unidad, UNC ni salir con ..', () => {
    for (const prog of ['php', 'node', 'python']) {
      for (const f of [
        '/etc/x.php',
        bs + 'x.php',
        bs + bs + 'srv' + bs + 'share' + bs + 'a.php',
        '//srv/share/a.php',
        'C:' + bs + 'x' + bs + 'a.php',
        'c:a.php',
        '../a.php',
        'a/../../b.php',
        'a' + bs + '..' + bs + '..' + bs + 'b.php',
      ]) {
        malo([prog, f]);
      }
    }
    malo(['php', '-f', bs + bs + 'srv' + bs + 'a.php']);
  });

  it('exige algo que ejecutar y acota la forma', () => {
    malo(['php']);
    malo(['node']);
    malo(['python']);
    malo([]);
    malo('php artisan x');
    malo(null);
    malo(['php', '']);
    malo(['php', 5]);
    malo(['php', 'a\nb']);
    malo(['php', 'a\u0000b']);
    malo(['php', 'x'.repeat(501)]);
    malo(['php', ...Array.from({ length: 50 }, () => 'a')]);
  });
});

describe('huellaTarea', () => {
  it('cambia con cualquier argumento, su orden o el programa', () => {
    const base = huellaTarea(['php', 'artisan', 'schedule:run']);
    expect(base).toMatch(/^[0-9a-f]{64}$/);
    expect(huellaTarea(['php', 'artisan', 'schedule:run'])).toBe(base);
    expect(huellaTarea(['php', 'artisan', 'schedule:work'])).not.toBe(base);
    expect(huellaTarea(['php', 'schedule:run', 'artisan'])).not.toBe(base);
    expect(huellaTarea(['php.exe', 'artisan', 'schedule:run'])).not.toBe(base);
    // Sin ambigüedad al unir argumentos.
    expect(huellaTarea(['php', 'a b'])).not.toBe(huellaTarea(['php', 'a', 'b']));
  });
});
