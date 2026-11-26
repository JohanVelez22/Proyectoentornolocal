import { linkSync, mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sitiosConRutasReales } from '../src/herramientas/archivoSensible';
import {
  compararArchivo,
  diffLineasMyers,
  ejecutarDiffEnProceso,
  LIMITES_DIFF,
  type ResultadoArchivoDiff,
} from '../src/herramientas/diffCarpetas';
import { DiffCarpetas } from '../src/herramientas/diffCarpetasServicio';
import { carpetaTemporal } from './temporales';

/** D44, segunda ronda: diff sin pila rota, veto por realpath y archivos sensibles. */
const CLAVE_FALSA =
  '-----BEGIN RSA PRIVATE KEY-----\nFALSA-SOLO-PARA-PRUEBAS\n-----END RSA PRIVATE KEY-----\n';

async function escenario() {
  const raiz = realpathSync.native(await carpetaTemporal('pel-diff2-'));
  const a = path.join(raiz, 'A');
  const b = path.join(raiz, 'B');
  mkdirSync(a);
  mkdirSync(b);
  const poner = (lado: string, rel: string, contenido: string | Buffer): void => {
    const d = path.join(lado, ...rel.split('/'));
    mkdirSync(path.dirname(d), { recursive: true });
    writeFileSync(d, contenido);
  };
  return { raiz, a, b, poner };
}

describe('I-1: el diff aguanta cientos de miles de líneas', () => {
  it('más de 200 000 líneas con cambios al principio y al final no revientan la pila', () => {
    const n = 250_000;
    const a = Array.from({ length: n }, (_, i) => `linea ${i}`);
    const b = [...a];
    b[0] = 'cambiada al principio';
    b[n - 1] = 'cambiada al final';
    b[Math.floor(n / 2)] = 'cambiada en medio';
    const ops = diffLineasMyers(a, b, 100)!;
    expect(ops).not.toBeNull();
    expect(ops.filter((o) => o.tipo !== 'igual')).toHaveLength(6);
    expect(ops.length).toBeGreaterThan(n);
  });

  it('por el camino completo (archivo de texto) también', async () => {
    const e = await escenario();
    const n = 210_000;
    const lineas = Array.from({ length: n }, () => 'x');
    const otras = [...lineas];
    otras[0] = 'y';
    otras[n - 1] = 'y';
    // Un archivo de más de 2 MB no entra en el diff de texto: se sube el tope solo en esta prueba.
    e.poner(e.a, 'g.txt', lineas.join('\n'));
    e.poner(e.b, 'g.txt', otras.join('\n'));
    const r = await compararArchivo({
      op: 'archivo',
      a: e.a,
      b: e.b,
      rel: 'g.txt',
      sitios: [],
      lim: { ...LIMITES_DIFF, bytesTexto: 8 * 1024 * 1024 },
    });
    expect(r).toMatchObject({ tipo: 'texto', agregadas: 2, quitadas: 2 });
  });
});

describe('I-3: el veto del servicio llega al trabajador con su realpath', () => {
  it('una carpeta propia escrita a través de una unión, con una raíz que la contiene, no se compara', async () => {
    const e = await escenario();
    const real = path.join(e.a, 'datos');
    e.poner(e.a, 'datos/data/sitios.json', '[]');
    e.poner(e.a, 'proyecto/a.txt', 'a');
    const enlace = path.join(e.raiz, 'enlace-a-datos');
    try {
      symlinkSync(real, enlace, 'junction');
    } catch {
      return; // sin permiso para crear enlaces
    }
    let vetadasEnviadas: string[] = [];
    const s = new DiffCarpetas({
      ejecutor: (m, o) => {
        if (m.op === 'carpetas') vetadasEnviadas = m.vetadas;
        return ejecutarDiffEnProceso(m, o);
      },
      // La carpeta propia se declara por la unión.
      carpetasPropias: () => [enlace],
    });
    const c = await s.comparar(e.a, e.b);
    expect(vetadasEnviadas).toContain(path.resolve(enlace));
    expect(vetadasEnviadas).toContain(real);
    expect(c.soloA.map((x) => x.ruta)).toEqual(['proyecto/a.txt']);
  });
});

describe('I-4: archivos sensibles en el diff', () => {
  async function sensible(
    montar: (e: Awaited<ReturnType<typeof escenario>>) => {
      rel: string;
      sitios?: { carpeta: string; datosReales: boolean }[];
    },
  ): Promise<ResultadoArchivoDiff> {
    const e = await escenario();
    const { rel, sitios } = montar(e);
    const servicio = new DiffCarpetas({
      ejecutor: ejecutarDiffEnProceso,
      carpetasPropias: () => [],
      sitios: async () => sitios ?? [],
    });
    const c = await servicio.comparar(e.a, e.b);
    const entrada = c.distintos.find((x) => x.ruta === rel);
    expect(entrada, `${rel} debe salir como distinto`).toBeDefined();
    return servicio.archivo(c.id, entrada!.id);
  }

  it('un .env (y .env.local, prod.env) sale como distinto sensible, sin filas de texto', async () => {
    for (const nombre of ['.env', '.env.local', 'prod.env']) {
      const r = await sensible((e) => {
        e.poner(e.a, nombre, 'DB_PASSWORD=uno\n');
        e.poner(e.b, nombre, 'DB_PASSWORD=dos\n');
        return { rel: nombre };
      });
      expect(r, nombre).toEqual({ tipo: 'sensible' });
      expect(JSON.stringify(r)).not.toContain('uno');
    }
  });

  it('id_rsa y un archivo con forma de clave privada (por contenido) también', async () => {
    const porNombre = await sensible((e) => {
      e.poner(e.a, 'id_rsa', 'texto cualquiera uno');
      e.poner(e.b, 'id_rsa', 'texto cualquiera dos');
      return { rel: 'id_rsa' };
    });
    expect(porNombre).toEqual({ tipo: 'sensible' });
    const porContenido = await sensible((e) => {
      e.poner(e.a, 'notas.txt', `${CLAVE_FALSA}uno\n`);
      e.poner(e.b, 'notas.txt', `${CLAVE_FALSA}dos\n`);
      return { rel: 'notas.txt' };
    });
    expect(porContenido).toEqual({ tipo: 'sensible' });
    expect(JSON.stringify(porContenido)).not.toContain('FALSA');
  });

  it('un archivo común dentro de un sitio con datosReales es sensible; sin datosReales se muestra', async () => {
    const con = await sensible((e) => {
      e.poner(e.a, 'src/app.php', 'uno');
      e.poner(e.b, 'src/app.php', 'dos');
      return { rel: 'src/app.php', sitios: [{ carpeta: e.a, datosReales: true }] };
    });
    expect(con).toEqual({ tipo: 'sensible' });
    const sin = await sensible((e) => {
      e.poner(e.a, 'src/app.php', 'uno');
      e.poner(e.b, 'src/app.php', 'dos');
      return { rel: 'src/app.php', sitios: [{ carpeta: e.a, datosReales: false }] };
    });
    expect(sin.tipo).toBe('texto');
  });

  it('un enlace duro hace sensible el archivo', async () => {
    const r = await sensible((e) => {
      e.poner(e.a, 'dato.txt', 'uno');
      e.poner(e.b, 'dato.txt', 'dos');
      try {
        linkSync(path.join(e.a, 'dato.txt'), path.join(e.raiz, 'otro-nombre.txt'));
      } catch {
        // el sistema no admite enlaces duros: se omite esta parte
        return { rel: 'dato.txt', sitios: [{ carpeta: e.a, datosReales: true }] };
      }
      return { rel: 'dato.txt' };
    });
    expect(r).toEqual({ tipo: 'sensible' });
  });

  it('si no se puede saber qué sitios hay, no se compara el archivo (falla cerrado)', async () => {
    const e = await escenario();
    e.poner(e.a, 'a.txt', 'uno');
    e.poner(e.b, 'a.txt', 'dos');
    const s = new DiffCarpetas({
      ejecutor: ejecutarDiffEnProceso,
      carpetasPropias: () => [],
      sitios: async () => {
        throw new Error('sin sitios');
      },
    });
    const c = await s.comparar(e.a, e.b);
    await expect(s.archivo(c.id, c.distintos[0]!.id)).rejects.toMatchObject({
      codigo: 'diff.fallo',
    });
  });

  it('sitiosConRutasReales añade el realpath de cada sitio', async () => {
    const e = await escenario();
    const enlace = path.join(e.raiz, 'via');
    try {
      symlinkSync(e.a, enlace, 'junction');
    } catch {
      return;
    }
    const l = await sitiosConRutasReales([{ carpeta: enlace, datosReales: true }]);
    expect(l.map((x) => x.carpeta)).toEqual([path.resolve(enlace), e.a]);
  });
});
