import { mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Nucleo } from '../src/nucleo';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { carpetaTemporal } from './temporales';

let nucleo: Nucleo | null = null;
afterEach(async () => {
  await nucleo?.cerrar({ detenerServicios: true }).catch(() => undefined);
  nucleo = null;
});

/** Núcleo aislado (`WOLFCORE_DATOS`) con plataforma falsa: todo en una carpeta temporal. */
async function crear() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-editor-nucleo-'));
  const base = path.join(raiz, 'datos');
  const usuario = path.join(raiz, 'usuario');
  mkdirSync(usuario, { recursive: true });
  const plataforma = new PlataformaFalsa({ carpetaDatos: base });
  nucleo = await Nucleo.crear({
    base,
    aislado: true,
    plataforma,
    sonda: async () => false,
    fetch: (async () => new Response('{}')) as typeof fetch,
  });
  return { n: nucleo, base, usuario };
}

describe('Nucleo: editor de código (D43)', () => {
  it('abre y guarda un archivo del usuario con la copia previa dentro de la carpeta de datos', async () => {
    const { n, base, usuario } = await crear();
    const r = path.join(usuario, 'a.php');
    writeFileSync(r, '<?php echo 1;\n');
    const a = await n.abrirArchivoEditor(r);
    expect(a.estado).toBe('abierto');
    if (a.estado !== 'abierto') return;
    const g = await n.guardarArchivoEditor(r, {
      contenido: '<?php echo 2;\n',
      huella: a.archivo.huella,
      eol: a.archivo.eol,
      bom: a.archivo.bom,
      confirmado: true,
    });
    expect(readFileSync(r, 'utf8')).toBe('<?php echo 2;\n');
    expect(g.copia.startsWith(path.join(base, 'editor-copias'))).toBe(true);
    expect(readFileSync(g.copia, 'utf8')).toBe('<?php echo 1;\n');
    // Junto al archivo del usuario no queda nada más.
    expect(readdirSync(usuario)).toEqual(['a.php']);
  });

  it('nada de la carpeta de datos de WolfCore (data, respaldos, etc…) se abre ni se guarda', async () => {
    const { n, base } = await crear();
    for (const carpeta of ['data', 'respaldos', 'etc', 'editor-copias']) {
      mkdirSync(path.join(base, carpeta), { recursive: true });
      const r = path.join(base, carpeta, 'x.txt');
      writeFileSync(r, 'dato');
      await expect(n.abrirArchivoEditor(r), carpeta).rejects.toMatchObject({
        codigo: 'editor.ruta_vetada',
      });
      await expect(
        n.guardarArchivoEditor(r, {
          contenido: 'otro',
          huella: { tamano: 4, mtimeMs: 1, hash: 'a'.repeat(64) },
          eol: 'lf',
          bom: false,
          confirmado: true,
        }),
        carpeta,
      ).rejects.toMatchObject({ codigo: 'editor.ruta_vetada' });
      expect(readFileSync(r, 'utf8')).toBe('dato');
    }
  });

  it('rechaza el .env y exige `confirmado === true` en el núcleo', async () => {
    const { n, usuario } = await crear();
    const env = path.join(usuario, '.env');
    writeFileSync(env, 'A=1\n');
    await expect(n.abrirArchivoEditor(env)).rejects.toMatchObject({ codigo: 'editor.archivo_env' });
    const r = path.join(usuario, 'a.txt');
    writeFileSync(r, 'uno\n');
    const a = await n.abrirArchivoEditor(r);
    if (a.estado !== 'abierto') throw new Error('no se abrió');
    await expect(
      n.guardarArchivoEditor(r, {
        contenido: 'dos\n',
        huella: a.archivo.huella,
        eol: 'lf',
        bom: false,
        confirmado: undefined as unknown as true,
      }),
    ).rejects.toMatchObject({ codigo: 'editor.sin_confirmar' });
    expect(readFileSync(r, 'utf8')).toBe('uno\n');
  });
});
