import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

// Liberar memoria (D54b, revisión A): textos y estructura de `BotonMemoria.vue`, sin montar nada.

const vue = readFileSync(
  path.join(__dirname, '..', 'src', 'renderer', 'componentes', 'BotonMemoria.vue'),
  'utf8',
);
const guion = vue.slice(vue.indexOf('<script'), vue.indexOf('</script>'));
const plantilla = vue.slice(vue.indexOf('<template>'), vue.indexOf('<style'));

const idiomas = Object.keys(diccionarios) as (keyof typeof diccionarios)[];

describe('textos de liberar memoria en los 16 idiomas', () => {
  it('hay 16 idiomas y todos traen las claves nuevas de Profundo, el aviso y el aumento medido', () => {
    expect(idiomas).toHaveLength(16);
    for (const id of idiomas) {
      const t = diccionarios[id].memoria;
      expect(t.liberariaHasta('1 GB'), id).toContain('1 GB');
      expect(t.procesosCifra('1 GB'), id).toContain('1 GB');
      expect(t.procesosCifraHasta('1 GB'), id).toContain('1 GB');
      expect(t.listaEsperaCifra('2 GB'), id).toContain('2 GB');
      expect(t.avisoPantalla.length, id).toBeGreaterThan(10);
      expect(t.avisoPantallaTitulo.length, id).toBeGreaterThan(3);
      expect(t.aumentoTitulo.length, id).toBeGreaterThan(3);
      expect(t.aumentoDisponible.length, id).toBeGreaterThan(3);
      expect(t.aumentoLibre.length, id).toBeGreaterThan(3);
      expect(t.purga.sinCache.length, id).toBeGreaterThan(10);
      // Lo viejo ya no está.
      expect(t as Record<string, unknown>, id).not.toHaveProperty('liberadoReal');
      expect(t as Record<string, unknown>, id).not.toHaveProperty('liberadaTitulo');
    }
  });

  it('en español: el aumento se llama «Aumento medido ahora», no «Liberado de verdad»', () => {
    const t = diccionarios.es.memoria;
    expect(t.aumentoTitulo).toBe('Aumento medido ahora');
    expect(JSON.stringify(t)).not.toMatch(/de verdad/i);
    expect(t.notaResultado).toContain('Windows reutiliza esa memoria enseguida');
    expect(t.notaResultado).toContain('«Disponible»');
    expect(t.avisoPantalla).toBe(
      'Hay un juego o una aplicación a pantalla completa: liberar memoria puede causar tirones.',
    );
    expect(t.liberariaHasta('1 GB')).toBe('Liberaría hasta ≈ 1 GB');
    expect(t.procesosCifra('1 GB')).toBe('≈ 1 GB de procesos');
    expect(t.listaEsperaCifra('2 GB')).toBe('La lista de espera (2 GB) pasa a memoria libre');
  });

  it('«qué hace» describe recortar la memoria de trabajo y Profundo no repite el permiso de administrador', () => {
    const t = diccionarios.es.memoria;
    expect(t.queHace.liviano).toContain('Windows la recarga cuando haga falta');
    expect(t.queHace.moderado).toContain('Windows la recarga cuando haga falta');
    expect(t.queHace.profundo).not.toMatch(/administrador/i);
    for (const id of idiomas) {
      expect(diccionarios[id].memoria.queHace.profundo, id).not.toBe('');
    }
  });

  it('ningún idioma conserva el «optimizador» ni el «modo de optimización» de antes', () => {
    for (const id of idiomas) {
      const codigos = diccionarios[id].errores.codigos as Record<string, string>;
      const viejos = [
        'memoria.modo_invalido',
        'memoria.no_disponible',
        'memoria.sin_confirmar',
      ].map((c) => codigos[c] ?? '');
      for (const texto of viejos)
        expect(texto, id).not.toMatch(/optim|оптим|ऑप्टिमा|最適化|최적화|优化/i);
    }
    expect(diccionarios.es.errores.codigos['memoria.modo_invalido']).toBe(
      'Ese nivel de liberación no existe.',
    );
  });
});

describe('BotonMemoria.vue', () => {
  it('avisa de un juego o pantalla completa antes de Moderado y Profundo, nunca antes de Liviano', () => {
    expect(guion).toContain("n !== 'liviano' && pantallaOcupada.value");
    expect(guion).toContain("p !== 'libre'");
    expect(plantilla).toContain('t.avisoPantalla');
    // Sigue con la confirmación de Profundo después del aviso.
    expect(guion).toMatch(/function seguir\(n: NivelMemoria\)[\s\S]*confirmando\.value = true/);
  });

  it('el resultado se titula «aumento medido ahora» y muestra el aumento de la disponible y de la libre', () => {
    expect(plantilla).toContain(':title="t.aumentoTitulo"');
    expect(plantilla).toContain('aumento(resultado.aumentoDisponible)');
    expect(plantilla).toContain('aumento(resultado.aumentoLibre)');
    expect(vue).not.toContain('liberadoReal');
    expect(vue).not.toContain('liberadaTitulo');
  });

  it('Profundo muestra dos cifras (procesos y lista de espera) y los demás niveles una sola', () => {
    expect(guion).toContain('t.procesosCifra');
    expect(guion).toContain('t.procesosCifraHasta');
    expect(guion).toContain('t.liberariaHasta');
    expect(plantilla).toContain("previo === 'profundo' && !calculando");
    expect(plantilla).toContain('listaEspera()');
  });
});

describe('Menor 8: el plazo vencido del permiso de administrador en el Doctor', () => {
  it('«doctor.reparacion_tiempo» existe en los 16 idiomas y no habla del archivo hosts', () => {
    for (const id of idiomas) {
      const codigos = diccionarios[id].errores.codigos as Record<string, string>;
      expect(codigos['doctor.reparacion_tiempo'], id).toBeTruthy();
      expect(codigos['doctor.reparacion_tiempo'], id).not.toMatch(/hosts/i);
    }
  });

  it('se le añade el aviso de que la ventana de Windows ya no hace nada', async () => {
    const { traducirError } = await import('../src/renderer/utilidades/errores');
    const texto = traducirError({ codigo: 'doctor.reparacion_tiempo', mensaje: 'x' });
    expect(texto).toContain(diccionarios.es.errores.codigos['doctor.reparacion_tiempo']);
    expect(texto).toContain(diccionarios.es.errores.uacHuerfano);
  });
});
