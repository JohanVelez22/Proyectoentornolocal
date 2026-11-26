import { describe, expect, it, vi } from 'vitest';
import { crearConfirmarCli, senuelos, type OpcionesDialogoCli } from '../src/main/confirmarCli';
import { textosMain } from '../src/main/textos';

const tunel = {
  tipo: 'tunel',
  sitio: 'clientes',
  dominio: 'clientes.test',
  datosReales: false,
  proveedor: 'cloudflare-rapido',
  alcance: 'internet',
  publicoEn: null,
} as const;

function montar(respuesta: (o: OpcionesDialogoCli) => number, aleatorio?: () => number) {
  const mostrar = vi.fn(async (o: OpcionesDialogoCli) => ({ response: respuesta(o) }));
  const confirmar = crearConfirmarCli({
    mostrar,
    textos: () => textosMain('es'),
    ...(aleatorio ? { aleatorio } : {}),
  });
  return { mostrar, confirmar };
}

describe('confirmación de la CLI en un diálogo nativo (D31)', () => {
  it('publicar: Cancelar es lo predeterminado; solo "Publicar" aprueba', async () => {
    const { mostrar, confirmar } = montar(() => 1);
    expect(await confirmar(tunel)).toBe(true);
    const o = mostrar.mock.calls[0]![0];
    expect(o.defaultId).toBe(0);
    expect(o.cancelId).toBe(0);
    expect(o.message).toContain('clientes.test');
    expect(o.message).toContain('cloudflare-rapido');
    expect(await montar(() => 0).confirmar(tunel)).toBe(false);
  });

  it('con datos reales no hay botón de publicar: hay que elegir el dominio exacto', async () => {
    const real = { ...tunel, datosReales: true };
    let botones: string[] = [];
    const bien = montar((o) => {
      botones = o.buttons;
      return o.buttons.indexOf('clientes.test');
    });
    expect(await bien.confirmar(real)).toBe(true);
    expect(botones).toHaveLength(4);
    expect(botones[0]).toBe(textosMain('es').cancelar);
    expect(botones).toContain('clientes.test');
    expect(bien.mostrar.mock.calls[0]![0].message).toContain('DATOS REALES');
    for (const senuelo of senuelos('clientes.test')) {
      expect(await montar((o) => o.buttons.indexOf(senuelo)).confirmar(real)).toBe(false);
    }
    expect(await montar(() => 0).confirmar(real)).toBe(false);
    expect(await montar(() => -1).confirmar(real)).toBe(false);
  });

  it('el orden de los dominios cambia con el azar', async () => {
    const orden = async (azar: () => number): Promise<string[]> => {
      let b: string[] = [];
      await montar((o) => {
        b = o.buttons;
        return 0;
      }, azar).confirmar({ ...tunel, datosReales: true });
      return b;
    };
    let n = 0;
    const a = await orden(() => 0);
    const b = await orden(() => (n++ % 3) / 3 + 0.1 * (3 - n));
    expect(a.length).toBe(b.length);
    expect(a.slice(1).sort()).toEqual(b.slice(1).sort());
  });

  it('PHP global pide confirmar; Tailscale Serve dice que es solo la tailnet', async () => {
    const g = montar(() => 1);
    expect(await g.confirmar({ tipo: 'php-global', version: '8.4' })).toBe(true);
    expect(g.mostrar.mock.calls[0]![0].message).toContain('8.4');
    expect(await montar(() => 0).confirmar({ tipo: 'php-global', version: '8.4' })).toBe(false);
    const t = montar(() => 0);
    await t.confirmar({
      ...tunel,
      alcance: 'tailnet',
      proveedor: 'tailscale',
      publicoEn: 'x.example.com',
    });
    expect(t.mostrar.mock.calls[0]![0].message).toContain('tailnet');
    expect(t.mostrar.mock.calls[0]![0].detail).toContain('https://x.example.com');
  });

  it('tiene texto en los cuatro idiomas', () => {
    for (const i of ['es', 'en', 'pt', 'fr'] as const) {
      const t = textosMain(i);
      for (const k of [
        'cliTitulo',
        'cliTunelInternet',
        'cliDatosReales',
        'cliPublicar',
        'cliPhpGlobal',
      ] as const) {
        expect(t[k], `${i}:${k}`).toBeTruthy();
      }
    }
  });
});
