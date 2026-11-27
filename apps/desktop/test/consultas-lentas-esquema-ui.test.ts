import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pedidoLentas } from '../src/main/validacion';

/** D45b y D45d: lo que la interfaz y el IPC deben cumplir, comprobado sobre el código fuente. */
const raiz = path.join(__dirname, '..', '..', '..');
const fuente = (...p: string[]): string => readFileSync(path.join(raiz, ...p), 'utf8');

function archivos(dir: string, salida: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const r = path.join(dir, n);
    if (statSync(r).isDirectory()) archivos(r, salida);
    else if (/\.(ts|vue)$/.test(n)) salida.push(r);
  }
  return salida;
}

describe('consultas lentas: pedido del IPC', () => {
  it('solo acepta activo, segundos y confirmado; confirmado es true solo si llegó true', () => {
    expect(pedidoLentas({ activo: true, segundos: 2, confirmado: true })).toEqual({
      activo: true,
      segundos: 2,
      confirmado: true,
    });
    expect(pedidoLentas({ activo: false }).confirmado).toBe(false);
    expect(pedidoLentas({ activo: true, confirmado: 'true' }).confirmado).toBe(false);
  });

  it('rechaza claves de más, tipos raros y números no finitos', () => {
    for (const malo of [
      null,
      [],
      'x',
      { activo: 'si' },
      { activo: true, extra: 1 },
      { activo: true, segundos: '1' },
      { activo: true, segundos: Number.NaN },
      { activo: true, ruta: '/falsa' },
    ]) {
      expect(() => pedidoLentas(malo)).toThrow();
    }
  });
});

describe('consultas lentas: diálogo', () => {
  const v = fuente(
    'apps',
    'desktop',
    'src',
    'renderer',
    'componentes',
    'DialogoConsultasLentas.vue',
  );

  it('«Ver literal» solo se ofrece si el núcleo lo permite', () => {
    expect(v).toMatch(/v-if="e\.literalPermitido && literales\[e\.id\] === undefined"/);
  });

  it('el cambio global pide confirmación y solo ahí se envía confirmado: true', () => {
    expect(v).toContain('@click="pedirCambio(\'activar\')"');
    expect(v).toContain('@click="pedirCambio(\'desactivar\')"');
    expect(v.match(/confirmado: true/g)).toHaveLength(1);
    expect(v).toMatch(/async function confirmarCambio\(\)[\s\S]*confirmado: true/);
  });

  it('los valores literales se olvidan al cerrar', () => {
    expect(v).toMatch(/watch\(mostrar[\s\S]*literales\.value = \{\}/);
  });

  it('muestra un estado vacío que explica cómo activarlo', () => {
    expect(v).toContain('<EstadoVacio');
    expect(v).toContain('vacioTextoApagado');
  });
});

describe('visor de esquema: diálogo', () => {
  const v = fuente('apps', 'desktop', 'src', 'renderer', 'componentes', 'DialogoEsquema.vue');

  it('lista tablas con buscador, relaciones con enlace y estado vacío', () => {
    expect(v).toMatch(/<NInput[^>]*v-model:value="busqueda"/);
    expect(v).toContain('@click="elegir(f.destino)"');
    expect(v).toContain('@click="elegir(f.origen)"');
    expect(v).toContain('<EstadoVacio');
  });

  it('no importa nada de Node', () => {
    expect(v).not.toMatch(/from 'node:|from "node:|require\(/);
  });
});

describe('SQL oculto (política «ante la duda, ocultar»)', () => {
  const v = fuente(
    'apps',
    'desktop',
    'src',
    'renderer',
    'componentes',
    'DialogoConsultasLentas.vue',
  );

  it('una entrada con sqlNormalizado null muestra «SQL oculto» y no se puede copiar', () => {
    expect(v).toContain('e.sqlNormalizado === null');
    expect(v).toContain('t.sqlOculto');
    expect(v).toMatch(/:disabled="e\.sqlNormalizado === null/);
  });

  it('el texto existe en los 4 idiomas', () => {
    for (const l of ['es', 'en', 'pt', 'fr']) {
      const t = fuente('apps', 'desktop', 'src', 'renderer', 'i18n', `${l}.ts`);
      expect(t, l).toMatch(/sqlOculto: '/);
      expect(t, l).toMatch(/sqlOcultoAyuda:/);
    }
  });
});

// La prueba de comportamiento de que el MCP `leer_registro` y el visor no sacan SQL crudo de las
// consultas lentas (PostgreSQL ni el slow log de MySQL) está en packages/core/test/registros-lentas.test.ts.
describe('privacidad: nada de esto sale por la CLI ni el MCP', () => {
  it('ni la CLI ni el MCP del núcleo tocan consultas lentas ni el esquema', () => {
    const dirs = [
      path.join(raiz, 'packages', 'core', 'src', 'cli'),
      path.join(raiz, 'packages', 'core', 'src', 'mcp'),
      path.join(raiz, 'apps', 'desktop', 'src', 'cli'),
    ];
    for (const d of dirs) {
      for (const f of archivos(d)) {
        const t = readFileSync(f, 'utf8');
        expect(t, f).not.toMatch(/consultasLentas|lentasLeer|lentasLiteral|esquemaBd|bd\.esquema/);
      }
    }
  });

  it('las rutas nuevas están en la lista del IPC y en el preload', () => {
    const api = fuente('apps', 'desktop', 'src', 'shared', 'api.ts');
    const pre = fuente('apps', 'desktop', 'src', 'preload', 'index.ts');
    for (const r of ['lentasEstado', 'lentasCambiar', 'lentasLeer', 'lentasLiteral', 'esquema']) {
      expect(api).toContain(`'bd.${r}'`);
      expect(pre).toContain(`'bd.${r}'`);
    }
  });
});
