import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  comandoReverb,
  esComandoPropio,
  hayPaqueteReverb,
  ID_PROCESO_REVERB,
  procesoReverb,
  ReverbSitio,
  variablesReverb,
  type DepsReverb,
} from '../src/proyectos/reverb';
import { validarComandoTarea } from '../src/tareas/comando';
import { SitioSchema, type ProcesoProyecto, type Sitio } from '../src/tipos';

let carpeta: string;
beforeEach(() => {
  carpeta = mkdtempSync(path.join(tmpdir(), 'pel-reverb-'));
});
afterEach(() => rmSync(carpeta, { recursive: true, force: true }));

function conPaquete(): void {
  const d = path.join(carpeta, 'vendor', 'laravel', 'reverb');
  mkdirSync(d, { recursive: true });
  writeFileSync(path.join(d, 'composer.json'), '{}');
}

function sitio(o: Partial<Sitio> = {}): Sitio {
  return SitioSchema.parse({
    id: 'app',
    nombre: 'app',
    dominio: 'app.test',
    carpeta,
    tipo: 'laravel',
    confiado: true,
    ...o,
  });
}

function entorno(s: Sitio, o: { vivo?: boolean; ocupados?: number[] } = {}) {
  const estado = {
    actual: s,
    guardados: 0,
    iniciados: [] as string[],
    detenidos: [] as string[],
    pedidos: [] as { reservados: number[]; preferido: number }[],
  };
  const d: DepsReverb = {
    sitio: async () => estado.actual,
    guardarProcesos: async (_s, procesos: ProcesoProyecto[]) => {
      estado.guardados++;
      estado.actual = { ...estado.actual, procesos };
    },
    puertoLibre: async (p) => {
      estado.pedidos.push({ reservados: p.reservados, preferido: p.preferido });
      let x = p.preferido;
      while (p.reservados.includes(x) || (o.ocupados ?? []).includes(x)) x++;
      return x;
    },
    iniciar: async (_s, p) => void estado.iniciados.push(p),
    detener: async (_s, p) => void estado.detenidos.push(p),
    estado: () => (o.vivo ? 'encendido' : 'apagado'),
  };
  return { estado, reverb: new ReverbSitio(d) };
}

describe('comando de Reverb', () => {
  it('escucha solo en 127.0.0.1 de forma explícita y entra en la lista cerrada de D29', () => {
    const c = comandoReverb(8081);
    expect(c).toEqual(['php', 'artisan', 'reverb:start', '--host=127.0.0.1', '--port=8081']);
    expect(() => validarComandoTarea(c)).not.toThrow();
    const p = procesoReverb(8081);
    expect(p).toMatchObject({ id: ID_PROCESO_REVERB, autoIniciar: false, puerto: 8081 });
    expect(p.comando.some((a) => /0\.0\.0\.0|--host=(?!127\.0\.0\.1$)/.test(a))).toBe(false);
  });

  it('las variables propuestas apuntan a 127.0.0.1 y no llevan claves', () => {
    const v = variablesReverb(8081);
    expect(v['REVERB_SERVER_HOST']).toBe('127.0.0.1');
    expect(v['REVERB_SERVER_PORT']).toBe('8081');
    expect(Object.keys(v).some((k) => /KEY|SECRET|APP_ID/.test(k))).toBe(false);
  });
});

describe('ReverbSitio', () => {
  it('sin confirmar no hace nada', async () => {
    conPaquete();
    const { reverb, estado } = entorno(sitio());
    await expect(reverb.activar('app', false)).rejects.toMatchObject({
      codigo: 'reverb.sin_confirmar',
    });
    expect(estado.guardados).toBe(0);
    expect(estado.iniciados).toEqual([]);
  });

  it('solo en sitios Laravel, de confianza y con laravel/reverb', async () => {
    const a = entorno(sitio({ tipo: 'estatico' }));
    await expect(a.reverb.activar('app', true)).rejects.toMatchObject({
      codigo: 'reverb.no_laravel',
    });
    const b = entorno(sitio({ confiado: false }));
    conPaquete();
    await expect(b.reverb.activar('app', true)).rejects.toMatchObject({
      codigo: 'reverb.no_confiado',
    });
    rmSync(path.join(carpeta, 'vendor'), { recursive: true });
    const c = entorno(sitio());
    await expect(c.reverb.activar('app', true)).rejects.toMatchObject({
      codigo: 'reverb.sin_paquete',
    });
    expect((await c.reverb.estado('app')).motivo).toBe('reverb.sin_paquete');
  });

  it('activa con puerto libre, lo enciende, y desactiva quitándolo del sitio', async () => {
    conPaquete();
    const otro: ProcesoProyecto = {
      id: 'vite',
      nombre: 'vite',
      comando: ['npm', 'run', 'dev'],
      cwd: 'raiz',
      autoIniciar: false,
      reiniciar: false,
      puerto: 8080,
      proxy: false,
    };
    const { reverb, estado } = entorno(sitio({ procesos: [otro] }));
    const r = await reverb.activar('app', true);
    expect(r.puerto).toBe(8081);
    expect(estado.iniciados).toEqual(['reverb']);
    expect(estado.actual.procesos.map((p) => p.id)).toEqual(['vite', 'reverb']);
    expect((await reverb.estado('app')).activo).toBe(true);
    expect(await reverb.variables('app')).toMatchObject({ REVERB_PORT: '8081' });

    await reverb.desactivar('app');
    expect(estado.detenidos).toEqual(['reverb']);
    expect(estado.actual.procesos.map((p) => p.id)).toEqual(['vite']);
    await expect(reverb.variables('app')).rejects.toMatchObject({ codigo: 'reverb.sin_activar' });
  });

  it('un proceso reverb editado a mano se reemplaza por el comando propio', async () => {
    conPaquete();
    const malo: ProcesoProyecto = {
      id: 'reverb',
      nombre: 'x',
      comando: ['php', 'artisan', 'reverb:start', '--host=0.0.0.0', '--port=8085'],
      cwd: 'raiz',
      autoIniciar: true,
      reiniciar: false,
      puerto: 8085,
      proxy: false,
    };
    const { reverb, estado } = entorno(sitio({ procesos: [malo] }));
    await reverb.activar('app', true);
    const p = estado.actual.procesos.find((x) => x.id === 'reverb')!;
    expect(p.comando).toContain('--host=127.0.0.1');
    expect(p.comando).not.toContain('--host=0.0.0.0');
    expect(p.autoIniciar).toBe(false);
  });
});

describe('I2: no se fía de un proceso reverb que ya existe', () => {
  const malo = (puerto = 8085): ProcesoProyecto => ({
    id: 'reverb',
    nombre: 'x',
    comando: ['php', 'artisan', 'reverb:start', '--host=0.0.0.0', `--port=${puerto}`],
    cwd: 'raiz',
    autoIniciar: true,
    reiniciar: false,
    puerto,
    proxy: false,
  });

  it('estado() expone modificado cuando el comando no es el propio', async () => {
    conPaquete();
    const a = entorno(sitio({ procesos: [malo()] }));
    expect(await a.reverb.estado('app')).toMatchObject({ activo: true, modificado: true });
    const b = entorno(sitio({ procesos: [procesoReverb(8090)] }));
    expect(await b.reverb.estado('app')).toMatchObject({ activo: true, modificado: false });
    expect(esComandoPropio(procesoReverb(8090))).toBe(true);
    expect(esComandoPropio({ ...procesoReverb(8090), puerto: null })).toBe(false);
    const c = entorno(sitio());
    expect((await c.reverb.estado('app')).modificado).toBe(false);
  });

  it('un proceso vivo con --host=0.0.0.0 se detiene antes y se reemplaza', async () => {
    conPaquete();
    const { reverb, estado } = entorno(sitio({ procesos: [malo()] }), { vivo: true });
    await reverb.activar('app', true);
    expect(estado.detenidos).toEqual(['reverb']);
    const p = estado.actual.procesos.find((x) => x.id === 'reverb')!;
    expect(p.comando).toContain('--host=127.0.0.1');
    expect(p.comando.join(' ')).not.toContain('0.0.0.0');
    expect(estado.iniciados).toEqual(['reverb']);
  });

  it('siempre pide un puerto libre al núcleo, con el anterior o 8080 como preferencia', async () => {
    conPaquete();
    const a = entorno(sitio({ procesos: [malo(8085)] }));
    await a.reverb.activar('app', true);
    expect(a.estado.pedidos[0]!.preferido).toBe(8085);
    rmSync(carpeta, { recursive: true, force: true });
    mkdirSync(carpeta, { recursive: true });
    conPaquete();
    const b = entorno(sitio());
    await b.reverb.activar('app', true);
    expect(b.estado.pedidos[0]!.preferido).toBe(8080);
  });

  it('un puerto reservado u ocupado no se usa', async () => {
    conPaquete();
    const otro: ProcesoProyecto = {
      id: 'vite',
      nombre: 'vite',
      comando: ['npm', 'run', 'dev'],
      cwd: 'raiz',
      autoIniciar: false,
      reiniciar: false,
      puerto: 8080,
      proxy: false,
    };
    const { reverb, estado } = entorno(sitio({ procesos: [otro] }), { ocupados: [8081] });
    const r = await reverb.activar('app', true);
    expect(estado.pedidos[0]!.reservados).toContain(8080);
    expect(r.puerto).toBe(8082);
    // El puerto del propio proceso reverb no cuenta como reservado por otro.
    const b = entorno(sitio({ procesos: [procesoReverb(8085)] }));
    await b.reverb.activar('app', true);
    expect(b.estado.pedidos[0]!.reservados).not.toContain(8085);
  });
});

describe('M4: vendor/laravel/reverb debe ser una carpeta de verdad', () => {
  it('rechaza un enlace o unión que apunte fuera del proyecto', async () => {
    const fuera = mkdtempSync(path.join(tmpdir(), 'pel-reverb-fuera-'));
    try {
      writeFileSync(path.join(fuera, 'composer.json'), '{}');
      mkdirSync(path.join(carpeta, 'vendor', 'laravel'), { recursive: true });
      const destino = path.join(carpeta, 'vendor', 'laravel', 'reverb');
      try {
        // En Windows una unión no pide privilegios; en el resto, un enlace simbólico.
        symlinkSync(fuera, destino, 'junction');
      } catch {
        return; // sin permiso para crear enlaces: no se puede probar aquí
      }
      expect(await hayPaqueteReverb(carpeta)).toBe(false);
      const { reverb } = entorno(sitio());
      await expect(reverb.activar('app', true)).rejects.toMatchObject({
        codigo: 'reverb.sin_paquete',
      });
    } finally {
      rmSync(fuera, { recursive: true, force: true });
    }
  });

  it('acepta la carpeta normal y rechaza un archivo con ese nombre', async () => {
    conPaquete();
    expect(await hayPaqueteReverb(carpeta)).toBe(true);
    rmSync(path.join(carpeta, 'vendor'), { recursive: true });
    mkdirSync(path.join(carpeta, 'vendor', 'laravel'), { recursive: true });
    writeFileSync(path.join(carpeta, 'vendor', 'laravel', 'reverb'), 'x');
    expect(await hayPaqueteReverb(carpeta)).toBe(false);
  });
});
