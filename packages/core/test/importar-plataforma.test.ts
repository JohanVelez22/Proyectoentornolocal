import { mkdir, open, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';
import { leerTexto, MAX_BYTES_TEXTO } from '../src/proyectos/archivos';
import { carpetaTemporal } from './temporales';

describe('leerTexto de los proyectos', () => {
  it('no abre archivos enormes ni carpetas, y quita el BOM', async () => {
    const d = await carpetaTemporal('pel-imp-');
    const grande = path.join(d, 'composer.json');
    const f = await open(grande, 'w');
    await f.truncate(MAX_BYTES_TEXTO + 1);
    await f.close();
    expect(await leerTexto(grande)).toBeNull();
    expect(await leerTexto(d)).toBeNull();
    await writeFile(path.join(d, 'ok.json'), '﻿{"a":1}');
    expect(await leerTexto(path.join(d, 'ok.json'))).toBe('{"a":1}');
  });
});

describe('Plataforma.instalacionesAjenas', () => {
  it('la falsa devuelve lo que se le configura (sin tocar el equipo)', async () => {
    const p = new PlataformaFalsa();
    expect(await p.instalacionesAjenas()).toEqual([]);
    p.instalaciones = [{ programa: 'xampp', raiz: '/x' }];
    expect(await p.instalacionesAjenas()).toEqual([{ programa: 'xampp', raiz: '/x' }]);
  });

  it.skipIf(process.platform !== 'win32')(
    'Windows: solo informa las carpetas que existen y nunca abre archivos',
    async () => {
      const perfil = await carpetaTemporal('pel-perfil-');
      await mkdir(path.join(perfil, 'Herd'), { recursive: true });
      await mkdir(path.join(perfil, '.config', 'herd'), { recursive: true });
      // La unidad del sistema inventada: no se consultan el laragon ni el xampp reales del equipo.
      const p = new PlataformaWindows(undefined, undefined, {
        entorno: { USERPROFILE: perfil, SystemDrive: 'Q:' },
      });
      expect(await p.instalacionesAjenas()).toEqual([
        { programa: 'herd', raiz: path.join(perfil, 'Herd') },
        { programa: 'herd', raiz: path.join(perfil, '.config', 'herd') },
      ]);
    },
  );
});
