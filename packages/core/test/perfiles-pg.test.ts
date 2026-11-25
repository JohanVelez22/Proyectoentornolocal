import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Respaldos, type DepsRespaldos } from '../src/bd/respaldos';
import { Rutas } from '../src/rutas';
import type { EstadoServicio } from '../src/tipos';
import { carpetaTemporal } from './temporales';

/**
 * PostgreSQL desde un perfil (D26): lo que las dependencias falsas de `perfiles.test.ts` no ven:
 * el formato exigido y la auditoría del catálogo después de restaurar.
 */
let dir: string;
let problemas: string[];
let eventos: string[];

function armar(): Respaldos {
  const deps: DepsRespaldos = {
    bd: {
      conexion: async () => ({
        host: '127.0.0.1' as const,
        puerto: 5432,
        usuario: 'postgres',
        clave: 'x',
      }),
      crear: async () => ({ usuarioActualizado: false }),
      tieneTablas: async () => false,
      usuarioTemporal: async () => ({ usuario: 'wolf_tmp_x', clave: 'y', retirar: async () => {} }),
      auditarEsquema: async (_o: string, base: string, o: { importada: boolean }) => {
        eventos.push(`auditar:${base}:${o.importada}`);
        return problemas;
      },
      reiniciarBase: async (_o: string, base: string) => void eventos.push(`vaciar:${base}`),
    } as never,
    servicios: {
      estados: async () =>
        [
          {
            id: 'postgresql',
            nombre: 'PostgreSQL',
            version: '17.2',
            estado: 'encendido',
            puertos: [5432],
            pid: 1,
          },
        ] as EstadoServicio[],
    },
    rutas: new Rutas(path.join(dir, 'base')),
    exec: async () => ({ codigo: 0, stdout: '', stderr: '' }),
    plataforma: { carpetaDocumentos: async () => dir },
  };
  const r = new Respaldos(deps);
  vi.spyOn(r, 'restaurarAcotada').mockImplementation(async (_o, _a, base) => {
    eventos.push(`acotada:${base}`);
    return { advertencias: [] };
  });
  return r;
}

async function archivo(nombre: string, contenido: string | Buffer): Promise<string> {
  const p = path.join(dir, nombre);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, contenido);
  return p;
}

beforeEach(async () => {
  dir = await carpetaTemporal('pel-perfil-pg-');
  problemas = [];
  eventos = [];
});

describe('Respaldos.restaurarPgDePerfil', () => {
  it('solo un volcado de pg_dump: SQL plano se rechaza sin tocar nada', async () => {
    const sql = await archivo('volcado.dump', 'CREATE TABLE t (a int);\n\\! calc\n');
    await expect(armar().restaurarPgDePerfil('postgresql', sql, 'tienda')).rejects.toMatchObject({
      codigo: 'perfiles.danado',
    });
    expect(eventos).toEqual([]);
  });

  it('restaura por el camino acotado y audita el catálogo como origen ajeno', async () => {
    const dump = await archivo(
      'volcado.dump',
      Buffer.concat([Buffer.from('PGDMP'), Buffer.alloc(64)]),
    );
    await armar().restaurarPgDePerfil('postgresql', dump, 'tienda');
    expect(eventos).toEqual(['acotada:tienda', 'auditar:tienda:true']);
  });

  it('si la auditoría encuentra algo que no se permite, la base se vacía y falla', async () => {
    problemas = ['función con SECURITY DEFINER'];
    const dump = await archivo(
      'volcado.dump',
      Buffer.concat([Buffer.from('PGDMP'), Buffer.alloc(64)]),
    );
    await expect(armar().restaurarPgDePerfil('postgresql', dump, 'tienda')).rejects.toMatchObject({
      codigo: 'bd.esquema_fallo',
    });
    expect(eventos).toEqual(['acotada:tienda', 'auditar:tienda:true', 'vaciar:tienda']);
  });
});
