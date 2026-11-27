import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { registrarIpc, type IpcMainLike, type NucleoIpc, type VentanaLike } from '../src/main/ipc';
import { en } from '../src/renderer/i18n/en';
import { es } from '../src/renderer/i18n/es';
import { fr } from '../src/renderer/i18n/fr';
import { pt } from '../src/renderer/i18n/pt';

/** D52: IPC de «Compartir carpeta o archivo» (todo con dobles: no abre túneles ni diálogos) y textos. */

const RAIZ = join(__dirname, '..', '..', '..');
const CARPETA = join(RAIZ, 'apps');

type Manejador = (evento: unknown, ...args: unknown[]) => unknown;

function preparar(opciones: { elegirCarpeta?: string | null; elegirArchivo?: string | null } = {}) {
  const canales = new Map<string, Manejador>();
  const ipcMain: IpcMainLike = { handle: (c, fn) => void canales.set(c, fn as Manejador) };
  const compartir = {
    vista: vi.fn(async (ruta: string) => ({ ruta, real: ruta, tipo: 'carpeta', difiere: false })),
    estado: vi.fn(() => ({ fase: 'inactiva' })),
    accesos: vi.fn(() => []),
    iniciar: vi.fn(async () => ({ fase: 'activa' })),
    detener: vi.fn(async () => ({ fase: 'inactiva' })),
  };
  const nucleo = { eventos: { on: () => () => undefined }, compartir } as unknown as NucleoIpc;
  const ventana: VentanaLike = { isDestroyed: () => false, webContents: { send: () => undefined } };
  const sistema = {
    elegirCarpeta: vi.fn(async () => opciones.elegirCarpeta ?? null),
    elegirArchivo: vi.fn(async () => opciones.elegirArchivo ?? null),
    abrirUrl: vi.fn(),
    abrirGrabadora: vi.fn(),
    abrirCarpeta: vi.fn(),
    copiar: vi.fn(),
    version: vi.fn(async () => '1'),
    guardarArchivo: vi.fn(async () => null),
    elegirArchivos: vi.fn(async () => []),
  };
  registrarIpc(nucleo, ipcMain, ventana, sistema);
  const llamar = (c: string, ...a: unknown[]) =>
    canales.get(`entorno:${c}`)!({}, ...a) as Promise<{ ok: boolean; valor?: unknown }>;
  return { llamar, compartir, sistema };
}

describe('IPC de Compartir (D52)', () => {
  it('la ruta solo sirve si salió del diálogo de Compartir, y exige confirmado === true', async () => {
    const t = preparar({ elegirCarpeta: 'C:\\Publica' });
    // Sin elegir nada: no hay ruta válida.
    expect(
      (await t.llamar('compartir.iniciar', 'C:\\Publica', 60, 'cloudflare-rapido', true)).ok,
    ).toBe(false);
    expect(await t.llamar('compartir.elegir', 'carpeta')).toMatchObject({
      ok: true,
      valor: 'C:\\Publica',
    });
    for (const c of [false, undefined, 'true', 1, null]) {
      expect(
        (await t.llamar('compartir.iniciar', 'C:\\Publica', 60, 'cloudflare-rapido', c)).ok,
      ).toBe(false);
    }
    expect(t.compartir.iniciar).not.toHaveBeenCalled();
    expect(
      (await t.llamar('compartir.iniciar', 'C:\\Publica', 60, 'cloudflare-rapido', true)).ok,
    ).toBe(true);
    expect(t.compartir.iniciar).toHaveBeenCalledWith({
      ruta: 'C:\\Publica',
      duracionMin: 60,
      proveedor: 'cloudflare-rapido',
      confirmado: true,
    });
  });

  it('una ruta elegida para otra cosa (Buscar, Uso del disco…) no se puede compartir', async () => {
    const t = preparar({ elegirCarpeta: 'C:\\OtraCosa' });
    expect(await t.llamar('sistema.elegirCarpeta')).toMatchObject({ ok: true });
    const r = await t.llamar('compartir.iniciar', 'C:\\OtraCosa', 60, 'cloudflare-rapido', true);
    expect(r.ok).toBe(false);
    expect(t.compartir.iniciar).not.toHaveBeenCalled();
  });

  it('elegir un archivo también lo registra; el tipo solo puede ser carpeta o archivo', async () => {
    const t = preparar({ elegirArchivo: 'C:\\Publica\\a.pdf' });
    expect(await t.llamar('compartir.elegir', 'archivo')).toMatchObject({
      ok: true,
      valor: 'C:\\Publica\\a.pdf',
    });
    expect(t.sistema.elegirArchivo).toHaveBeenCalled();
    expect((await t.llamar('compartir.elegir', 'todo')).ok).toBe(false);
    expect((await t.llamar('compartir.iniciar', 'C:\\Publica\\a.pdf', 15, 'ngrok', true)).ok).toBe(
      true,
    );
  });

  it('valida la forma de la duración y del proveedor', async () => {
    const t = preparar({ elegirCarpeta: 'C:\\P' });
    await t.llamar('compartir.elegir', 'carpeta');
    for (const d of ['60', -5, 1.5, null, {}]) {
      expect((await t.llamar('compartir.iniciar', 'C:\\P', d, 'ngrok', true)).ok).toBe(false);
    }
    for (const p of [1, null, '', 'x'.repeat(41)]) {
      expect((await t.llamar('compartir.iniciar', 'C:\\P', 60, p, true)).ok).toBe(false);
    }
    expect(t.compartir.iniciar).not.toHaveBeenCalled();
  });

  it('la vista previa solo acepta una ruta elegida para compartir', async () => {
    const t = preparar({ elegirCarpeta: 'C:\\Publica' });
    expect((await t.llamar('compartir.vista', 'C:\\Publica')).ok).toBe(false);
    await t.llamar('compartir.elegir', 'carpeta');
    expect((await t.llamar('compartir.vista', 'C:\\Publica')).ok).toBe(true);
    expect((await t.llamar('compartir.vista', 'C:\\Otra')).ok).toBe(false);
    expect(t.compartir.vista).toHaveBeenCalledTimes(1);
  });

  it('estado, accesos y detener pasan al núcleo', async () => {
    const t = preparar();
    expect(await t.llamar('compartir.estado')).toMatchObject({ ok: true });
    expect(await t.llamar('compartir.accesos')).toMatchObject({ ok: true });
    expect(await t.llamar('compartir.detener')).toMatchObject({ ok: true });
    expect(t.compartir.detener).toHaveBeenCalledOnce();
  });
});

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? fuentes(p) : /\.(ts|vue)$/.test(n) ? [p] : [];
  });
}

describe('Compartir: lo que no debe existir', () => {
  it('el MCP y la CLI no exponen la función', () => {
    const carpetas = [
      join(RAIZ, 'packages', 'core', 'src', 'mcp'),
      join(RAIZ, 'packages', 'core', 'src', 'cli'),
      join(RAIZ, 'apps', 'desktop', 'src', 'cli'),
    ];
    for (const c of carpetas) {
      for (const f of fuentes(c)) {
        expect(readFileSync(f, 'utf8'), f).not.toMatch(
          /\.compartir\b|compartir\.(iniciar|detener)|new Compartir|compartir\/compartir/,
        );
      }
    }
  });

  it('la interfaz no interpreta HTML ni escribe rutas, y la confirmación arranca en Cancelar', () => {
    const f = readFileSync(
      join(CARPETA, 'desktop', 'src', 'renderer', 'componentes', 'herramientas', 'Compartir.vue'),
      'utf8',
    );
    expect(f).not.toMatch(/v-html|innerHTML/);
    // El campo de ruta no existe: solo se ve la elegida con el diálogo.
    expect(f).not.toMatch(/v-model:value="(ruta|elegido)/);
    expect(f).toMatch(/botonCancelar/);
    // La confirmación enseña la ruta real (validada por el núcleo antes) y se puede cancelar mientras se abre.
    expect(f).toMatch(/api\(\)\s*\.compartir\.vista\(e\.ruta\)/);
    expect(f).toMatch(/compartir-ruta-real-confirmar/);
    expect(f).toMatch(/compartir-cancelar-inicio/);
    expect(f).toMatch(/:auto-focus="false"/);
    expect(f).toMatch(
      /api\(\)\.compartir\.iniciar\(e\.ruta, duracion\.value, proveedor\.value, true\)/,
    );
  });
});

describe('textos de D52 en los cuatro idiomas', () => {
  it('existen en es, en, pt y fr, con la ayuda de FTP y sin tuteo', () => {
    for (const [id, d] of Object.entries({ es, en, pt, fr })) {
      const t = d.herramientas.compartir;
      expect(t.explicacion, id).not.toBe('');
      expect(d.herramientas.lista.compartir.nombre, id).not.toBe('');
      expect(t.confirmar.aviso('1 h'), id).toContain('1 h');
      expect(t.grandes, id).toMatch(/8 ?(MB|Mo)/);
      expect(t.comprimidos, id).toMatch(/\.zip/);
      expect(t.comprimidos, id).toMatch(/\.env/);
      expect(t.confirmar.rutaReal, id).not.toBe('');
      expect(d.errores.codigos['compartir.carpeta_perfil'], id).not.toBe('');
      expect(d.errores.codigos['compartir.archivo_grande'], id).not.toBe('');
      expect(t.vence('14:30', '5 min'), id).toContain('14:30');
      expect(t.restan(5), id).toContain('5');
      expect(d.servicios.ftp.compartir.ayuda, id).toMatch(/HTTP/);
      expect(d.servicios.ftp.compartir.enlace, id).not.toBe('');
      expect(d.tuneles.compartir.enlace, id).not.toBe('');
      expect(d.errores.codigos['compartir.tunel_sin_url'], id).toContain('{segundos}');
    }
    const textoEs = JSON.stringify([
      es.herramientas.compartir,
      es.servicios.ftp.compartir,
      es.tuneles.compartir,
    ]);
    expect(textoEs).not.toMatch(/\b(elige|usa|puedes|tu|tus|asegúrate|revisa|pulsa)\b/i);
    const textoFr = JSON.stringify([
      fr.herramientas.compartir,
      fr.servicios.ftp.compartir,
      fr.tuneles.compartir,
    ]);
    expect(textoFr).toMatch(/Choisissez|Publiez|utilisez/);
    expect(textoFr).not.toMatch(/\b(tu|ton|ta|tes|choisis|utilise)\b/i);
  });
});
