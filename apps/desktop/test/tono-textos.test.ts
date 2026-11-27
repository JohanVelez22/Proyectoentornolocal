import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

/** Todas las cadenas de un diccionario (las funciones se evalúan con argumentos de prueba). */
function hojas(v: unknown, ruta = ''): [string, string][] {
  if (typeof v === 'string') return [[ruta, v]];
  if (typeof v === 'function') {
    try {
      const r = (v as (...a: unknown[]) => unknown)('x', 'x', 'x');
      return typeof r === 'string' ? [[ruta, r]] : hojas(r, ruta);
    } catch {
      return [];
    }
  }
  if (Array.isArray(v)) return v.flatMap((x, i) => hojas(x, `${ruta}[${i}]`));
  if (v && typeof v === 'object') {
    return Object.entries(v).flatMap(([k, x]) => hojas(x, ruta ? `${ruta}.${k}` : k));
  }
  return [];
}

const TUTEO: Record<string, RegExp> = {
  // Solo formas inequívocas del tuteo: «abre» o «crea» también son verbos en tercera persona.
  es: /(?<![\p{L}])(puedes|tienes|quieres|necesitas|tu|tus|contigo|abriste|confirmes|(?<!usted )pulsa|preguntarte|vuelve a (analizar|abrirlo|verla))(?![\p{L}])|(?<=^|[.:;]\s*)(elige|confirma|revisa la lista|abre un archivo)(?![\p{L}])/iu,
  fr: /(?<![\p{L}])(tu|toi|ton|ta|tes|te|t’|t')(?![\p{L}])/iu,
  pt: /(?<![\p{L}])(tu|teu|tua|teus|tuas|contigo)(?![\p{L}])/iu,
};

describe('Tono de los textos: usted en español, «vous» en francés, «você» en portugués (D38b)', () => {
  for (const [id, re] of Object.entries(TUTEO)) {
    it(`${id}: ningún texto de la interfaz tutea`, () => {
      const malos = hojas(diccionarios[id as keyof typeof diccionarios])
        .filter(([, t]) => re.test(t))
        .map(([r, t]) => `${r}: ${t.slice(0, 80)}`);
      expect(malos).toEqual([]);
    });
  }
});

describe('Etiquetas cortas del Doctor (D38b)', () => {
  it('el nombre de cada revisión es una etiqueta, no un párrafo (firewall tenía el texto de su reparación)', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      for (const [k, v] of Object.entries(d.doctor.revisiones)) {
        expect((v as string).length, `${id}/${k}`).toBeLessThanOrEqual(40);
      }
    }
  });
});

describe('Nombre de servicios externos (D38b)', () => {
  it('el sufijo «(externo)» del núcleo sale en el idioma de la interfaz', async () => {
    const { nombreServicio } = await import('../src/renderer/utilidades/nombreServicio');
    const sufijo = /^MySQL \((\S+)\)$/.exec(nombreServicio('MySQL (externo)'))?.[1];
    expect(sufijo).toBeTruthy();
    expect(nombreServicio('Nginx')).toBe('Nginx');
  });
});

// ---- Contenido de las guías (docs/contenido/*.json y *.md): el mismo trato que la interfaz ----
const RAIZ_CONTENIDO = join(__dirname, '../../../docs/contenido');
const INICIO = String.raw`(?:^|[.;:!?]\s+|\n\s*(?:[-*>]\s*|\d+\.\s*)?)\**`;
const FIN = String.raw`(?![\p{L}\p{N}_-])`;
const PALABRA = String.raw`(?<![\p{L}\p{N}_-])`;

/**
 * Formas del tuteo que no se confunden con otra cosa. «Usa», «abre» o «crea» no están: también son
 * verbos en tercera persona («Laravel usa…», «Abre un túnel…» en una tabla); lo que sí se mira es
 * el imperativo inequívoco al empezar una frase («Revisa…», «Asegúrate…»).
 */
const TUTEO_DOCS: Record<string, RegExp[]> = {
  es: [
    new RegExp(
      `${PALABRA}(tu|tus|tuyo|tuya|tuyos|tuyas|contigo|ti|te|tienes|puedes|necesitas|quieres|eres|debes|estás|verás|podrás|tendrás|sabes|haces|ves|usas|envías|llamas|recibes|escribes|olvidas|dejas|subes|cambias|configuras|ejecutas|depuras|importas|abres|cierras|reinicias|trabajas|desarrollas|controlas|guardas|borras|pides|accedes|creas|eliges|intentas)${FIN}`,
      'giu',
    ),
    // Pretérito de «tú» (enviaste, hiciste…); las palabras que solo terminan igual se descartan.
    new RegExp(
      `${PALABRA}(?!(?:triste|existe|insiste|persiste|consiste|resiste|asiste|subsiste|desiste|contraste)${FIN})\\p{L}{2,}(?:aste|iste)${FIN}`,
      'giu',
    ),
    new RegExp(
      `${INICIO}(revisa|comprueba|verifica|actualiza|agrega|añade|valida|reintenta|repite|espera|asegúrate|pulsa|registra|descarga|instala|recuerda|evita|elige|ejecuta|escribe|pega|cierra|deja|borra)${FIN}`,
      'giu',
    ),
  ],
  pt: [
    new RegExp(
      `${PALABRA}(tu|teu|tua|teus|tuas|ti|te|contigo|tens|podes|precisas|queres|és|estás)${FIN}`,
      'giu',
    ),
    new RegExp(
      `${INICIO}(verifica|revisa|confirma|atualiza|adiciona|espera|repete|certifica-te|lê|instala|escolhe)${FIN}`,
      'giu',
    ),
  ],
  fr: [
    new RegExp(`${PALABRA}(tu|toi|ton|ta|tes|te)${FIN}`, 'giu'),
    new RegExp(String.raw`(?<![\p{L}\p{N}_'’])t['’](?=\p{L})`, 'giu'),
    new RegExp(
      `${INICIO}(vérifie|consulte|relance|regarde|essaie|attends|répète|corrige|assure-toi)${FIN}`,
      'giu',
    ),
  ],
};

function tuteosEn(texto: string, idioma: string): string[] {
  // El código (bloques y trozos entre comillas invertidas) no es prosa.
  const prosa = texto.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');
  const malos: string[] = [];
  for (const re of TUTEO_DOCS[idioma] ?? []) {
    for (const m of prosa.matchAll(new RegExp(re.source, re.flags))) {
      malos.push(
        prosa.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25).replace(/\n/g, ' '),
      );
    }
  }
  return malos;
}

function cadenas(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(cadenas);
  if (v && typeof v === 'object') return Object.values(v).flatMap(cadenas);
  return [];
}

describe('Tono del contenido de las guías: usted, «você» y «vous» (D50)', () => {
  it('el detector distingue el tuteo de lo que no lo es (control)', () => {
    expect(tuteosEn('Revisa tu token y asegúrate de que puedes entrar.', 'es')).toHaveLength(3);
    expect(tuteosEn('Si te pide la clave, ve a ti.', 'es').length).toBeGreaterThanOrEqual(2);
    expect(
      tuteosEn('Laravel usa su caché. Pide datos al servidor. Revise su token.', 'es'),
    ).toEqual([]);
    expect(tuteosEn('Verifica o token. Você pode usar `tu` em código.', 'pt')).toHaveLength(1);
    expect(tuteosEn('Usa-se para ler. Verifique o token; use o seu.', 'pt')).toEqual([]);
    expect(tuteosEn("Vérifie ton jeton. Consultez le guide, t'aider.", 'fr').length).toBe(3);
    expect(tuteosEn('Vérifiez votre jeton. Le serveur consulte la base.', 'fr')).toEqual([]);
  });

  it('los .json de docs/contenido: ningún bloque es/pt/fr tutea', () => {
    const malos: string[] = [];
    for (const f of readdirSync(RAIZ_CONTENIDO).filter((n) => n.endsWith('.json'))) {
      const j = JSON.parse(readFileSync(join(RAIZ_CONTENIDO, f), 'utf8')) as Record<
        string,
        unknown[]
      >;
      for (const lista of Object.values(j)) {
        for (const e of lista as Record<string, unknown>[]) {
          for (const idioma of Object.keys(TUTEO_DOCS)) {
            for (const t of cadenas(e[idioma])) {
              for (const x of tuteosEn(t, idioma)) {
                malos.push(`${f} ${String(e.codigo ?? e.nombre ?? e.id)} ${idioma}: …${x}…`);
              }
            }
          }
        }
      }
    }
    expect(malos).toEqual([]);
  });

  it('los .md de las guías (es, pt y fr) no tutean', () => {
    const malos: string[] = [];
    for (const f of readdirSync(RAIZ_CONTENIDO).filter((n) => n.endsWith('.md'))) {
      const idioma = /\.(en|pt|fr)\.md$/.exec(f)?.[1] ?? 'es';
      if (idioma === 'en') continue;
      for (const x of tuteosEn(readFileSync(join(RAIZ_CONTENIDO, f), 'utf8'), idioma)) {
        malos.push(`${f}: …${x}…`);
      }
    }
    expect(malos).toEqual([]);
  });
});

describe('Textos del pulido de diseño (D54a, I7)', () => {
  it('el control del TUTEO detecta los casos nuevos y no confunde la tercera persona', () => {
    const re = TUTEO.es!;
    for (const malo of [
      'Elige un modo y revisa la lista.',
      'hasta que lo confirmes',
      'pueden preguntarte si guardas',
      'Para salir, pulsa Esc y después Tab.',
      'Abre un archivo para empezar.',
    ]) {
      expect(re.test(malo), malo).toBe(true);
    }
    for (const bueno of [
      'Elija un modo y revise la lista.',
      'Si elige el borrado definitivo, se guarda una copia.',
      'El Doctor revisa puertos y hosts.',
      'si usted pulsa «Mostrar» en esa variable',
      'Abra un archivo para empezar a editar.',
    ]) {
      expect(re.test(bueno), bueno).toBe(false);
    }
  });

  it('los nombres viejos ya no están: «Proyectos» y no «Sitios» en el enlace de Túneles y en FTP', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      if (['es', 'en', 'fr', 'pt'].includes(id)) {
        expect(d.tuneles.irAProyectos, id).toMatch(/Project|Projet|Projeto|Proyecto/);
      }
      expect(d.tuneles.irAProyectos, id).not.toMatch(/Sites?\b|Sitios/);
      expect(d.app.lema, id).not.toMatch(/PHP|Nginx/);
    }
    expect(diccionarios.es.app.lema).toBe('Su entorno local, listo para trabajar');
    expect(diccionarios.en.app.lema).toBe('Your local stack, ready to work');
  });

  it('Memoria › Liviano no dice «no RAM» y aclara que libera disco sin cerrar nada', () => {
    for (const [id, d] of Object.entries(diccionarios)) {
      expect(d.memoria.descripciones.liviano, id).not.toMatch(/\bRAM\b/);
    }
    expect(diccionarios.es.memoria.descripciones.liviano).toBe(
      'Vacía la caché de la aplicación. Libera espacio en disco; no cierra ni detiene nada.',
    );
  });
});
