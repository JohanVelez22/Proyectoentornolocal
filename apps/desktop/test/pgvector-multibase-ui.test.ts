import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

const leer = (n: string): string =>
  readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'componentes', n), 'utf8');
const seccion = leer('SeccionPgvector.vue');
const dialogo = leer('DialogoVectorBases.vue');

describe('pgvector en varias bases y en las bases nuevas: textos y estructura (D54b)', () => {
  it('la ayuda de una frase está en es y en los 16 idiomas', () => {
    expect(diccionarios.es.bd.pgvector.ayuda).toBe(
      'pgvector permite guardar y buscar "vectores" (listas de números que representan el significado de un texto o una imagen), útil para búsquedas con IA. En PostgreSQL se activa base por base porque cada base tiene sus propias extensiones.',
    );
    for (const [id, d] of Object.entries(diccionarios)) {
      const p = d.bd.pgvector;
      expect(p.ayuda.length, id).toBeGreaterThan(60);
      expect(p.variasBoton, id).toBeTruthy();
      expect(p.plantilla.explicacion, id).toContain('template1');
      expect(p.variasConfirmarTexto(3), id).toContain('3');
      expect(d.errores.codigos['bd.vector_confirmacion'], id).toBeTruthy();
      expect(d.errores.codigos['bd.vector_no_instalado'], id).toBeTruthy();
    }
  });

  it('template1 nunca está activada por defecto: solo se pide con diálogo de confirmación y confirmado: true', () => {
    // La única llamada a la plantilla va tras la confirmación y manda confirmado: true.
    expect(seccion.match(/pgvector\.plantilla\(/g)?.length).toBe(1);
    expect(seccion).toContain('confirmado: true');
    expect(seccion).toMatch(
      /dialog\.warning\(\{[\s\S]*onPositiveClick[\s\S]*cambiarPlantilla\(activar\)/,
    );
    // No hay casilla ni interruptor preactivados que la lancen (ni al montar ni al elegir bases).
    expect(seccion).not.toMatch(/onMounted\([^)]*plantilla\(/);
    expect(dialogo).not.toContain('pgvector.plantilla');
  });

  it('en varias bases no hay nada elegido de entrada, se confirma antes y se manda confirmado: true', () => {
    expect(dialogo).toContain('elegidas.value = [];');
    expect(dialogo).toMatch(/dialog\.warning\(\{[\s\S]*t\.variasConfirmarTitulo/);
    expect(dialogo).toContain('confirmado: true');
    // Las bases con la extensión ya puesta no se ofrecen y las de datos reales piden aviso aparte.
    expect(dialogo).toContain(':disabled="b.activo || trabajando"');
    expect(dialogo).toContain('datosRealesConfirmadas');
  });

  it('el botón de varias bases y su ayuda están junto a la instalación de pgvector', () => {
    expect(seccion).toContain('data-testid="ayuda-vector"');
    expect(seccion).toContain('t.variasBoton');
  });
});
