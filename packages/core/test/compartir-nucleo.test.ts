import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';

let nucleo: Nucleo | null = null;
let carpeta: string | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
  nucleo = null;
  // Fuera de %LOCALAPPDATA%\Temp: compartir rechaza cualquier ruta que pase por AppData.
  if (carpeta) rmSync(carpeta, { recursive: true, force: true });
  carpeta = null;
});

describe('Nucleo: Compartir (D52)', () => {
  it('rechaza lo vetado con la plataforma y no abre ningún túnel (cloudflared no está instalado)', async () => {
    const raiz = (carpeta = realpathSync.native(
      mkdtempSync(path.join(path.resolve(__dirname, '..'), '.tmp-d52-nucleo-')),
    ));
    const base = path.join(raiz, 'datos');
    const inicio = path.join(raiz, 'usuario');
    const sistema = path.join(raiz, 'Windows');
    for (const d of [base, inicio, sistema]) mkdirSync(d, { recursive: true });
    const falsa = new PlataformaFalsa({ carpetaDatos: base, carpetaInicio: inicio });
    falsa.carpetasSistema = [sistema];
    const roaming = path.join(inicio, 'AppData', 'Roaming');
    mkdirSync(roaming, { recursive: true });
    falsa.carpetasDePerfil = [roaming];
    nucleo = await Nucleo.crear({
      barrerHuerfanos: false,
      base,
      aislado: true,
      plataforma: falsa,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
    const estados: string[] = [];
    nucleo.eventos.on('compartir:estado', (e) => estados.push(e.fase));
    const ok = path.join(inicio, 'publica');
    mkdirSync(ok);
    writeFileSync(path.join(ok, 'a.txt'), 'x');
    const pedir = (ruta: string, confirmado = true) =>
      nucleo!.compartir.iniciar({
        ruta,
        duracionMin: 15,
        proveedor: 'cloudflare-rapido',
        confirmado,
      });

    await expect(pedir(ok, false)).rejects.toMatchObject({
      codigo: 'compartir.confirmacion_requerida',
    });
    await expect(pedir(base)).rejects.toMatchObject({ codigo: 'compartir.carpeta_datos' });
    await expect(pedir(inicio)).rejects.toMatchObject({ codigo: 'compartir.carpeta_usuario' });
    await expect(pedir(sistema)).rejects.toMatchObject({ codigo: 'compartir.carpeta_sistema' });
    await expect(pedir(roaming)).rejects.toMatchObject({ codigo: 'compartir.carpeta_perfil' });
    // Lo válido llega hasta el túnel, que aquí falla porque cloudflared no está instalado.
    await expect(pedir(ok)).rejects.toMatchObject({ codigo: 'tuneles.cloudflared_no_instalado' });
    expect(nucleo.compartir.estado().fase).toBe('inactiva');
    expect(estados.at(-1)).toBe('inactiva');
  });
});
