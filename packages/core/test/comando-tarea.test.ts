import { describe, expect, it } from 'vitest';
import { ErrorWolf } from '../src/errores';
import { huellaTarea, validarComandoTarea } from '../src/tareas/comando';

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
      ['python', '-m', 'app.tareas'],
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

  it('rechaza el código dado en la propia línea y los modos interactivos', () => {
    for (const c of [
      ['php', '-r', 'system("x");'],
      ['php', '-a'],
      ['php', '-S', 'localhost:8000'],
      ['node', '-e', 'x'],
      ['node', '--eval=x'],
      ['node', '-p', '1'],
      ['node', '--require', 'x.js', 'a.js'],
      ['node', '--import=x', 'a.js'],
      ['python', '-c', 'import os'],
      ['python', '-i'],
    ]) {
      malo(c);
    }
  });

  it('npm solo admite "run <script>"', () => {
    for (const c of [
      ['npm'],
      ['npm', 'install'],
      ['npm', 'exec', 'x'],
      ['npm', 'run'],
      ['npm', 'x', 'run', 'cron'],
    ]) {
      malo(c);
    }
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
