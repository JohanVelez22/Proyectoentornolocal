import { describe, expect, it } from 'vitest';
import {
  analizarHora,
  comandoATexto,
  comandoSeRepresenta,
  cronDePreset,
  duracionCorta,
  presetDeCron,
  textoAComando,
  textoHora,
  tipoEstadoEjecucion,
} from '../src/renderer/utilidades/tareas';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

describe('atajos de horario (D29)', () => {
  it('cada atajo da su expresión cron', () => {
    expect(cronDePreset({ tipo: 'cadaMinuto' })).toBe('* * * * *');
    expect(cronDePreset({ tipo: 'cadaN', minutos: 15 })).toBe('*/15 * * * *');
    expect(cronDePreset({ tipo: 'cadaHora' })).toBe('0 * * * *');
    expect(cronDePreset({ tipo: 'diaria', hora: 3, minuto: 0 })).toBe('0 3 * * *');
    expect(cronDePreset({ tipo: 'laborables', hora: 9, minuto: 30 })).toBe('30 9 * * 1-5');
    expect(cronDePreset({ tipo: 'personalizada', expr: '  */5 9-17 * * 1-5 ' })).toBe(
      '*/5 9-17 * * 1-5',
    );
  });

  it('una hora fuera de rango se acota (el núcleo valida de todos modos)', () => {
    expect(cronDePreset({ tipo: 'diaria', hora: 99, minuto: -4 })).toBe('0 23 * * *');
    expect(cronDePreset({ tipo: 'diaria', hora: Number.NaN, minuto: 75 })).toBe('59 0 * * *');
  });

  it('vuelve del cron al atajo y lo que no es de ninguno queda personalizado', () => {
    expect(presetDeCron('* * * * *')).toEqual({ tipo: 'cadaMinuto' });
    expect(presetDeCron('*/30 * * * *')).toEqual({ tipo: 'cadaN', minutos: 30 });
    expect(presetDeCron('0 * * * *')).toEqual({ tipo: 'cadaHora' });
    expect(presetDeCron('5 3 * * *')).toEqual({ tipo: 'diaria', hora: 3, minuto: 5 });
    expect(presetDeCron('  0   3  * * 1-5 ')).toEqual({ tipo: 'laborables', hora: 3, minuto: 0 });
    for (const e of ['*/7 * * * *', '0 3 1 * *', '0 3 * * 0', '60 3 * * *', '0 24 * * *', 'x']) {
      expect(presetDeCron(e), e).toEqual({ tipo: 'personalizada', expr: e });
    }
  });

  it('cada atajo vuelve a sí mismo', () => {
    for (const p of [
      { tipo: 'cadaMinuto' },
      { tipo: 'cadaN', minutos: 5 },
      { tipo: 'cadaHora' },
      { tipo: 'diaria', hora: 23, minuto: 59 },
      { tipo: 'laborables', hora: 0, minuto: 0 },
    ] as const) {
      expect(presetDeCron(cronDePreset(p))).toEqual(p);
    }
  });

  it('horas: formato y análisis', () => {
    expect(textoHora(3, 5)).toBe('03:05');
    expect(analizarHora('3:05')).toEqual({ hora: 3, minuto: 5 });
    expect(analizarHora(' 23:59 ')).toEqual({ hora: 23, minuto: 59 });
    for (const m of ['24:00', '12:60', '12', '12:5', 'ab:cd', '', '-1:00']) {
      expect(analizarHora(m), m).toBeNull();
    }
  });
});

describe('comando como texto y como lista (sin shell)', () => {
  it('parte por espacios y respeta comillas', () => {
    expect(textoAComando('php artisan schedule:run')).toEqual(['php', 'artisan', 'schedule:run']);
    expect(textoAComando('  php   artisan  ')).toEqual(['php', 'artisan']);
    expect(textoAComando('python "mi script.py" --modo \'a b\'')).toEqual([
      'python',
      'mi script.py',
      '--modo',
      'a b',
    ]);
    expect(textoAComando('php "" x')).toEqual(['php', '', 'x']);
    expect(textoAComando('')).toEqual([]);
  });

  it('la barra invertida es un carácter más y los metacaracteres de shell no hacen nada', () => {
    expect(textoAComando('php C:\\proy\\a.php')).toEqual(['php', 'C:\\proy\\a.php']);
    expect(textoAComando('php a.php && rm -rf / ; echo $HOME | x')).toEqual([
      'php',
      'a.php',
      '&&',
      'rm',
      '-rf',
      '/',
      ';',
      'echo',
      '$HOME',
      '|',
      'x',
    ]);
  });

  it('comillas sin cerrar: null', () => {
    expect(textoAComando('php "a')).toBeNull();
    expect(textoAComando("php 'a")).toBeNull();
  });

  it('ida y vuelta con argumentos con espacios', () => {
    const c = ['python', 'mi script.py', '--x=1', 'a b c'];
    expect(textoAComando(comandoATexto(c))).toEqual(c);
    expect(comandoATexto(['php', 'artisan', 'schedule:run'])).toBe('php artisan schedule:run');
  });
});

describe('comando con comillas: nunca se quitan en silencio', () => {
  it('un argumento con comillas dobles se escribe con simples y vuelve igual', () => {
    const c = ['php', 'job.php', 'dice "hola"'];
    expect(comandoATexto(c)).toBe('php job.php \'dice "hola"\'');
    expect(textoAComando(comandoATexto(c))).toEqual(c);
    expect(comandoSeRepresenta(c)).toBe(true);
    expect(comandoSeRepresenta(['php', "it's"])).toBe(true);
  });

  it('un argumento con las dos clases de comillas no se puede escribir: se marca', () => {
    const c = ['php', 'job.php', `a "b" y 'c'`];
    expect(comandoSeRepresenta(c)).toBe(false);
  });
});

describe('presentación', () => {
  it('colores de estado y duraciones', () => {
    expect(tipoEstadoEjecucion('ok')).toBe('success');
    expect(tipoEstadoEjecucion('fallo')).toBe('error');
    expect(tipoEstadoEjecucion('tiempo')).toBe('error');
    expect(tipoEstadoEjecucion('bloqueada')).toBe('warning');
    expect(tipoEstadoEjecucion('otro')).toBe('default');
    expect(duracionCorta(850)).toBe('850 ms');
    expect(duracionCorta(12_000)).toBe('12 s');
    expect(duracionCorta(300_000)).toBe('5 min');
  });
});

describe('textos de tareas programadas en los cuatro idiomas', () => {
  const motivos = [
    'aislado',
    'no_confiado',
    'receta_cambio',
    'sin_confirmar',
    'comando_invalido',
    'cron_invalida',
    'carpeta',
    'solapada',
    'retraso',
    'error',
  ];
  const estados = ['ok', 'fallo', 'tiempo', 'cancelada', 'omitida', 'bloqueada'];
  it('cada motivo y cada estado que da el núcleo tiene texto', () => {
    for (const t of [es, en, pt, fr]) {
      for (const m of motivos)
        expect((t.tareas.motivo as Record<string, string>)[m], m).toBeTruthy();
      for (const e of estados)
        expect((t.tareas.estado as Record<string, string>)[e], e).toBeTruthy();
    }
  });

  it('avisa que lo del repositorio se ejecuta tal cual, en los cuatro idiomas', () => {
    for (const t of [es, en, pt, fr]) {
      expect(t.tareas.repoEjecuta).toMatch(/artisan/);
      expect(t.tareas.repoEjecuta).toMatch(/package\.json/);
      expect(t.tareas.dialogo.comandoFijo).toBeTruthy();
    }
  });

  it('avisa claro que solo corren con la aplicación abierta y que no usan el Programador de Windows', () => {
    expect(es.tareas.soloAbierta).toMatch(/abierto/);
    expect(es.tareas.soloAbierta).toMatch(/Programador de tareas de Windows/);
    expect(en.tareas.soloAbierta).toMatch(/open/);
    expect(en.tareas.soloAbierta).toMatch(/Task Scheduler/);
    expect(pt.tareas.soloAbierta).toMatch(/aberto/);
    expect(pt.tareas.soloAbierta).toMatch(/Agendador de Tarefas do Windows/);
    expect(fr.tareas.soloAbierta).toMatch(/ouvert/);
    expect(fr.tareas.soloAbierta).toMatch(/Planificateur de tâches de Windows/);
  });
});
