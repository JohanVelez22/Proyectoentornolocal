import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  comandoReverb,
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

function entorno(s: Sitio) {
  const estado = { actual: s, guardados: 0, iniciados: [] as string[], detenidos: [] as string[] };
  const d: DepsReverb = {
    sitio: async () => estado.actual,
    guardarProcesos: async (_s, procesos: ProcesoProyecto[]) => {
      estado.guardados++;
      estado.actual = { ...estado.actual, procesos };
    },
    puertoLibre: async (o) => (o.reservados.includes(o.preferido) ? o.preferido + 1 : o.preferido),
    iniciar: async (_s, p) => void estado.iniciados.push(p),
    detener: async (_s, p) => void estado.detenidos.push(p),
    estado: () => 'apagado',
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
