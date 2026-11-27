import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { huellaSha1 } from '../src/https/ca';
import { GestorHttps } from '../src/https/certificados';
import type { ResultadoEscritura } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { carpetaTemporal } from './temporales';

/** `cp` real, salvo cuando la prueba pide que falle una copia cuyo destino cumple `fallarCp`. */
let fallarCp: ((destino: string) => boolean) | null = null;
vi.mock('node:fs/promises', async (original) => {
  const real = await original<typeof import('node:fs/promises')>();
  return {
    ...real,
    cp: async (...args: Parameters<typeof real.cp>) => {
      if (fallarCp?.(String(args[1]))) throw new Error('disco lleno (falso)');
      return real.cp(...args);
    },
  };
});

let rutas: Rutas;
let instalados: string[];
let quitados: string[];
let quitar: (h: string) => ResultadoEscritura;

const gestor = (): GestorHttps =>
  new GestorHttps({
    rutas,
    plataforma: {
      instalarCertificadoUsuario: async (r) => {
        instalados.push(huellaSha1(readFileSync(r, 'utf8')));
        return { ok: true };
      },
      quitarCertificadoUsuario: async (h) => {
        quitados.push(h);
        return quitar(h);
      },
      certificadoInstalado: async () => true,
      duenosDePuertos: async () => new Map(),
      descendientes: async () => new Map(),
    },
  });

const carpetaCa = () => path.dirname(rutas.caCrt());
const ocultos = () => readdirSync(carpetaCa()).filter((n) => n.startsWith('.'));

beforeEach(async () => {
  rutas = new Rutas(await carpetaTemporal('pel-regca-'));
  instalados = [];
  quitados = [];
  quitar = () => ({ ok: true });
  fallarCp = null;
});

const preparar = async () => {
  const g = gestor();
  await g.instalarCA();
  await g.asegurarCertificado({ id: 's1', dominio: 'a.test', alias: [] });
  instalados = [];
  return { g, crt: readFileSync(rutas.caCrt(), 'utf8') };
};
const respaldo = () => path.join(path.dirname(carpetaCa()), 'respaldos');

describe('regenerarCA: vuelta atrás honesta (N2)', () => {
  it('si falla la copia de los certificados tras confiar la nueva, quita la nueva antes de fallar', async () => {
    const { g, crt } = await preparar();
    fallarCp = (d) => path.basename(d).startsWith('.certs-');
    let aplicado = false;
    const r = await g.regenerarCA(respaldo(), async () => (aplicado = true));
    expect(r).toMatchObject({ ok: false, motivo: 'error' });
    expect(instalados).toHaveLength(1);
    expect(quitados).toEqual(instalados);
    expect(aplicado).toBe(false);
    expect(readFileSync(rutas.caCrt(), 'utf8')).toBe(crt);
  });

  it('si el aplicar de la vuelta atrás falla, lo informa (no dice "como estaba")', async () => {
    const { g, crt } = await preparar();
    const r = await g.regenerarCA(respaldo(), async () => false);
    expect(r).toMatchObject({ ok: false, motivo: 'error', vueltaAtrasIncompleta: true });
    if (!r.ok) expect(r.mensaje).not.toMatch(/como estaba/);
    // Los archivos sí volvieron.
    expect(readFileSync(rutas.caCrt(), 'utf8')).toBe(crt);
  });

  it('si no se puede quitar la nueva del almacén al volver atrás, lo informa', async () => {
    const { g } = await preparar();
    quitar = (h) => (h === instalados[0] ? { ok: false, motivo: 'cancelado' } : { ok: true });
    let intentos = 0;
    const r = await g.regenerarCA(respaldo(), async () => ++intentos > 1);
    expect(r).toMatchObject({ ok: false, vueltaAtrasIncompleta: true });
    if (!r.ok) expect(r.mensaje).not.toMatch(/como estaba/);
  });

  it('vuelta atrás completa: "como estaba" y sin temporales', async () => {
    const { g } = await preparar();
    let intentos = 0;
    const r = await g.regenerarCA(respaldo(), async () => ++intentos > 1);
    expect(r).toMatchObject({ ok: false, motivo: 'error' });
    expect(r).not.toHaveProperty('vueltaAtrasIncompleta');
    if (!r.ok) expect(r.mensaje).toMatch(/como estaba/);
    expect(ocultos()).toEqual([]);
  });

  it('si no se pudieron restaurar los certificados, .certs-<id> se conserva', async () => {
    const { g } = await preparar();
    const carpetaCerts = path.dirname(rutas.certCrt('x'));
    fallarCp = (d) => path.resolve(d) === path.resolve(carpetaCerts);
    const r = await g.regenerarCA(respaldo(), async () => false);
    expect(r).toMatchObject({ ok: false, vueltaAtrasIncompleta: true });
    const quedan = ocultos().filter((n) => n.startsWith('.certs-'));
    expect(quedan).toHaveLength(1);
    expect(existsSync(path.join(carpetaCa(), quedan[0]!, 's1.crt'))).toBe(true);
    if (!r.ok) expect(r.mensaje).toContain(quedan[0]!);
  });
});
