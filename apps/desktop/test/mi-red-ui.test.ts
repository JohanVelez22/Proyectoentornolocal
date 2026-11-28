import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';

/** D53: lo que la interfaz de Mi red no puede hacer, y que sus textos existan en los 16 idiomas. */
const RAIZ = join(__dirname, '..', '..', '..');
const VUE = readFileSync(
  join(RAIZ, 'apps', 'desktop', 'src', 'renderer', 'componentes', 'herramientas', 'MiRed.vue'),
  'utf8',
);

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? fuentes(p) : /\.(ts|vue)$/.test(n) ? [p] : [];
  });
}

/** Código sin comentarios (los comentarios pueden decir «nada de RDP»). */
const sinComentarios = (t: string): string =>
  t
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
    .join('\n');

describe('Mi red: la interfaz', () => {
  it('no interpreta HTML, no importa Node ni abre nada por su cuenta', () => {
    expect(VUE).not.toMatch(/v-html|innerHTML/);
    expect(VUE).not.toMatch(/from 'node:|require\(|child_process|openPath|openExternal/);
    expect(VUE).not.toMatch(/https?:\/\//);
  });

  it('no hay control remoto: nada de RDP, VNC, mstsc ni ejecución remota', () => {
    for (const f of fuentes(join(RAIZ, 'packages', 'core', 'src', 'miRed'))) {
      expect(sinComentarios(readFileSync(f, 'utf8')), f).not.toMatch(
        /\b(mstsc|rdp|vnc|psexec|Invoke-Command|Enter-PSSession)\b/i,
      );
    }
    expect(VUE).not.toMatch(/\b(mstsc|rdp|vnc)\b/i);
  });

  it('no manda rangos, rutas ni comandos: solo la confirmación o una IP/nombre de la lista', () => {
    expect(VUE).toMatch(/api\(\)\.miRed\.escanear\(true\)/);
    expect(VUE).toMatch(/api\(\)\.miRed\.medirVelocidad\(true\)/);
    expect(VUE).toMatch(/api\(\)\.miRed\.dejarDeCompartir\(c\.nombre, c\.ruta, true\)/);
    expect(VUE).not.toMatch(/v-model:value/);
  });

  it('dejar de compartir: la confirmación arranca en Cancelar y exige marcar que se entiende el UAC', () => {
    expect(VUE).toMatch(/botonCancelarQuitar/);
    expect(VUE).toMatch(/:auto-focus="false"/);
    expect(VUE).toMatch(/:disabled="!entiendeUac"/);
    // `quitar` no hace nada si no se marcó la casilla.
    expect(VUE).toMatch(/if \(!c \|\| !entiendeUac\.value\) return/);
    // Las administrativas no tienen botón.
    expect(VUE).toMatch(/v-if="!c\.administrativa"/);
    // Se muestran ocultas por defecto.
    expect(VUE).toMatch(/verAdministrativas = ref\(false\)/);
  });

  it('el escaneo y la medición piden confirmación y el escaneo se desactiva sin permiso', () => {
    expect(VUE).toMatch(/:disabled="!escaneo\?\.permitido"/);
    expect(VUE).toMatch(/botonCancelarEscaneo/);
    expect(VUE).toMatch(/botonCancelarVelocidad/);
    expect(VUE).toMatch(/PLAN_VELOCIDAD\.bajadaMb/);
  });

  it('el MCP y la CLI no exponen nada de Mi red', () => {
    const carpetas = [
      join(RAIZ, 'packages', 'core', 'src', 'mcp'),
      join(RAIZ, 'packages', 'core', 'src', 'cli'),
      join(RAIZ, 'apps', 'desktop', 'src', 'cli'),
    ];
    for (const c of carpetas) {
      for (const f of fuentes(c)) {
        expect(readFileSync(f, 'utf8'), f).not.toMatch(/\.miRed\b|miRed\/|MiRed|dejarDeCompartir/);
      }
    }
  });

  it('el núcleo solo habla con speed.cloudflare.com y no usa process.platform en Mi red', () => {
    const urls = new Set<string>();
    for (const f of fuentes(join(RAIZ, 'packages', 'core', 'src', 'miRed'))) {
      const texto = readFileSync(f, 'utf8');
      expect(texto, f).not.toMatch(/process\.platform/);
      for (const m of texto.matchAll(/https?:\/\/[a-z0-9.-]+/gi)) urls.add(m[0]);
    }
    expect([...urls].filter((u) => !/speed\.cloudflare\.com/.test(u))).toEqual([]);
  });
});

describe('Mi red: textos en los 16 idiomas', () => {
  const ids = Object.keys(diccionarios) as (keyof typeof diccionarios)[];

  it('hay 16 idiomas y todos traen los textos con sus parámetros', () => {
    expect(ids).toHaveLength(16);
    for (const id of ids) {
      const d = diccionarios[id];
      const t = d.herramientas.miRed;
      expect(d.herramientas.lista.miRed.nombre, id).not.toBe('');
      expect(t.explicacion, id).not.toBe('');
      expect(t.carpetas.confirmar.pregunta('Fotos'), id).toContain('Fotos');
      expect(t.carpetas.resultado.quitada('Fotos'), id).toContain('Fotos');
      expect(t.equipos.progreso(3, 254), id).toMatch(/3/);
      expect(t.equipos.progreso(3, 254), id).toMatch(/254/);
      expect(t.equipos.escaneoListo(7, '192.168.1.0/24'), id).toContain('192.168.1.0/24');
      expect(t.equipos.confirmar.texto('192.168.1.0/24', 253), id).toContain('253');
      expect(t.equipos.confirmar.texto('192.168.1.0/24', 253), id).toContain('192.168.1.0/24');
      expect(t.ping.resultado(3, 4, 12), id).toMatch(/12/);
      expect(t.recursos.titulo('192.168.1.5'), id).toContain('192.168.1.5');
      // El aviso de consumo dice los MB (25, 10 y 35).
      const v = t.velocidad.confirmar.texto(25, 10, 35);
      expect(v, id).toMatch(/25/);
      expect(v, id).toMatch(/10/);
      expect(v, id).toMatch(/35/);
      expect(v, id).toContain('speed.cloudflare.com');
      // La confirmación de dejar de compartir explica el UAC y que no se cambia nada si se cancela.
      expect(t.carpetas.confirmar.uac, id).toMatch(/UAC/);
      expect(t.equipos.publica, id).not.toBe('');
    }
  });

  it('las frases clave de seguridad coinciden con lo pedido, en español e inglés', () => {
    expect(diccionarios.es.herramientas.miRed.equipos.publica).toBe(
      'En redes públicas no se exploran otros equipos.',
    );
    expect(diccionarios.es.herramientas.miRed.carpetas.confirmar.uac).toMatch(/administrador/);
    expect(diccionarios.en.herramientas.miRed.carpetas.confirmar.uac).toMatch(/administrator/);
  });
});
