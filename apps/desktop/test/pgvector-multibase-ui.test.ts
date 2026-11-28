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
    expect(dialogo).toContain(':disabled="b.activo || !b.valida || trabajando"');
    expect(dialogo).toContain('datosRealesConfirmadas');
  });

  it('el botón de varias bases y su ayuda están junto a la instalación de pgvector', () => {
    expect(seccion).toContain('data-testid="ayuda-vector"');
    expect(seccion).toContain('t.variasBoton');
  });

  it('la plantilla usa la ruta ligera, descarta lecturas viejas y no admite un segundo clic mientras corre', () => {
    expect(seccion).toContain('pgvector.plantillaEstado(');
    expect(seccion).not.toContain('estadoBases(');
    expect(seccion).toContain('const mia = ++lecturaPlantilla');
    expect(seccion).toContain('if (mia === lecturaPlantilla)');
    expect(seccion).toContain("if (bloqueado.value || ocupado('plantilla')) return;");
    expect(seccion.match(/:disabled="bloqueado \|\| ocupado\('plantilla'\)"/g)?.length).toBe(2);
    // Sin lectura posible se dice (null), no se finge «no activada».
    expect(seccion).toContain('t.plantilla.noSePudo');
  });

  it('el diálogo deshabilita las bases de nombre no válido con su motivo y avisa si la lista está truncada', () => {
    expect(dialogo).toContain(':disabled="b.activo || !b.valida || trabajando"');
    expect(dialogo).toContain('t.motivos.nombreNoValido');
    expect(dialogo).toContain('estado.truncado');
  });

  it('la ruta de una sola base pasa por el mismo camino y muestra el aviso de datos reales', () => {
    const vista = readFileSync(
      path.join(__dirname, '..', 'src', 'renderer', 'vistas', 'BasesDeDatos.vue'),
      'utf8',
    );
    expect(vista).toContain("r.estado === 'requiere-aviso'");
    expect(vista).toContain('datosRealesConfirmadas: [base]');
    const nucleo = readFileSync(
      path.join(__dirname, '..', '..', '..', 'packages', 'core', 'src', 'nucleo.ts'),
      'utf8',
    );
    expect(nucleo).toMatch(
      /async activarVector\(base: string\)[\s\S]{0,200}activarVectorEnBases\('postgresql'/,
    );
  });
});
