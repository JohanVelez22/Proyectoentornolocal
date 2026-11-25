import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { aislarPlataforma } from '../src/plataforma/aislada';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
  nucleo = null;
});

describe('WOLFCORE_DATOS: carpeta de datos aislada (D26)', () => {
  it('el núcleo aislado nunca escribe el hosts (ni pide la escritura elevada)', async () => {
    const dir = await carpetaTemporal('pel-aislado-');
    const hosts = path.join(dir, 'hosts');
    await writeFile(hosts, '127.0.0.1 localhost\n');
    const plataforma = new PlataformaFalsa({ carpetaDatos: dir, rutaHosts: hosts });
    const escribir = vi.spyOn(plataforma, 'escribirComoAdmin');
    nucleo = await Nucleo.crear({
      base: path.join(dir, 'datos'),
      aislado: true,
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
    const r = await nucleo.hosts.sincronizar(['tienda.test']);
    expect(r.ok).toBe(false);
    expect(escribir).not.toHaveBeenCalled();
    expect(await readFile(hosts, 'utf8')).toBe('127.0.0.1 localhost\n');
  });

  it('sin aislar, la misma llamada sí escribe (la prueba de arriba mide algo real)', async () => {
    const dir = await carpetaTemporal('pel-aislado-');
    const hosts = path.join(dir, 'hosts');
    await writeFile(hosts, '127.0.0.1 localhost\n');
    const plataforma = new PlataformaFalsa({ carpetaDatos: dir, rutaHosts: hosts });
    nucleo = await Nucleo.crear({
      base: path.join(dir, 'datos'),
      plataforma,
      sonda: async () => false,
      fetch: (async () => new Response('{}')) as typeof fetch,
    });
    await nucleo.hosts.sincronizar(['tienda.test']);
    expect(await readFile(hosts, 'utf8')).toContain('tienda.test');
  });

  it('almacén de certificados, variables y PATH del usuario: denegados y avisados', async () => {
    const dir = await carpetaTemporal('pel-aislado-');
    const falsa = new PlataformaFalsa({ carpetaDatos: dir });
    const vistos: string[] = [];
    const p = aislarPlataforma(falsa, (q) => vistos.push(q));
    const instalar = vi.spyOn(falsa, 'instalarCertificadoUsuario');
    const variable = vi.spyOn(falsa, 'variableUsuario');
    expect(await p.instalarCertificadoUsuario()).toMatchObject({
      ok: false,
      motivo: 'denegado',
    });
    expect(await p.variableUsuario('NODE_EXTRA_CA_CERTS', 'x')).toMatchObject({ ok: false });
    await expect(p.pathUsuario().escribir(['C:/x'])).rejects.toThrow(/WOLFCORE_DATOS/);
    expect(instalar).not.toHaveBeenCalled();
    expect(variable).not.toHaveBeenCalled();
    expect(vistos).toEqual([
      'instalarCertificadoUsuario',
      'variableUsuario',
      'pathUsuario.escribir',
    ]);
    // Lo que solo lee sigue funcionando.
    expect(p.rutaHosts()).toBe(falsa.rutaHosts());
    expect(existsSync(dir)).toBe(true);
  });
});
