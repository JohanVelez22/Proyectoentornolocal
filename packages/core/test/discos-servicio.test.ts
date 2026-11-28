import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntradaAviso } from '../src/avisos/avisos';
import { aislarPlataforma } from '../src/plataforma/aislada';
import { SaludDiscos, unidadDeRuta, claveDisco } from '../src/discos/servicio';
import type { DiscoLeido, EventoDisco, LecturaDiscos } from '../src/discos/tipos';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import { PlataformaWindows } from '../src/plataforma/win';
import { SCRIPT_SALUD_DISCOS } from '../src/plataforma/saludDiscosWin';
import { completarPlataforma } from '../src/plataforma/index';

const contadoresNulos = {
  temperaturaC: null,
  temperaturaMaxC: null,
  desgastePct: null,
  erroresLecturaCorregidos: null,
  erroresLecturaNoCorregidos: null,
  erroresEscrituraCorregidos: null,
  erroresEscrituraNoCorregidos: null,
  horasEncendido: null,
};

const nvme = (extra: Partial<DiscoLeido> = {}): DiscoLeido => ({
  numero: 0,
  modelo: 'Disco NVMe de ejemplo',
  medio: 'ssd',
  bus: 'nvme',
  tamanoBytes: 1_000_204_886_016,
  salud: 'healthy',
  operacional: ['OK'],
  contadores: null,
  motivoSinContadores: 'admin',
  prediccionFallo: null,
  unidades: ['C:'],
  ...extra,
});
const usb = (): DiscoLeido => ({
  numero: 2,
  modelo: 'Memoria USB de ejemplo',
  medio: null,
  bus: 'usb',
  tamanoBytes: 32_010_928_128,
  salud: 'healthy',
  operacional: ['OK'],
  contadores: null,
  motivoSinContadores: 'bus',
  prediccionFallo: null,
  unidades: ['E:'],
});

let carpeta: string;
beforeEach(async () => {
  carpeta = await mkdtemp(path.join(tmpdir(), 'pel-discos-'));
});
const creados: SaludDiscos[] = [];
afterEach(async () => {
  await Promise.all(creados.splice(0).map((x) => x.guardado()));
  await rm(carpeta, { recursive: true, force: true });
});

function montar(lectura: LecturaDiscos | null, activados = true) {
  const plataforma = new PlataformaFalsa();
  plataforma.discos = lectura;
  const avisos: EntradaAviso[] = [];
  let ahora = 1_800_000_000_000;
  const s = new SaludDiscos({
    plataforma,
    archivoEstado: path.join(carpeta, 'run', 'salud-discos.json'),
    carpetaDatos: () => 'C:\\Users\\prueba\\AppData\\Local\\WolfCoreDev',
    carpetasProyectos: async () => ['D:\\Proyectos\\web', 'C:\\Sitios\\otro'],
    publicar: (a) => avisos.push(a),
    avisosActivados: async () => activados,
    ahora: () => ahora,
  });
  creados.push(s);
  return { s, plataforma, avisos, avanzar: (ms: number) => (ahora += ms) };
}

describe('SaludDiscos', () => {
  it('sin discos: resultado vacío, no un error', async () => {
    const { s } = montar({ discos: [], prediccion: 'ok' });
    const r = await s.leer();
    expect(r.discos).toEqual([]);
    expect(r.conAdmin).toBe(false);
  });

  it('sin lectura: error del catálogo', async () => {
    const { s } = montar(null);
    await expect(s.leer()).rejects.toMatchObject({ codigo: 'discos.sin_lectura' });
  });

  it('USB sin contadores: «bien» por su estado, sin inventar contadores', async () => {
    const { s, avisos } = montar({ discos: [usb()], prediccion: 'no_disponible' });
    const r = await s.leer();
    expect(r.discos[0]).toMatchObject({
      veredicto: 'bien',
      contadores: null,
      motivoSinContadores: 'bus',
    });
    expect(avisos).toEqual([]);
  });

  it('destaca el disco con los datos de WolfCore y el de los proyectos', async () => {
    const { s } = montar({
      discos: [nvme(), nvme({ numero: 1, modelo: 'Otro', unidades: ['D:'] }), usb()],
      prediccion: 'ok',
    });
    const r = await s.leer();
    expect(r.discos.map((d) => [d.contieneDatos, d.contieneProyectos])).toEqual([
      [true, true],
      [false, true],
      [false, false],
    ]);
  });

  it('NVMe con desgaste alto: atención y UN aviso con la acción hacia los respaldos', async () => {
    const lectura: LecturaDiscos = {
      discos: [nvme({ contadores: { ...contadoresNulos, desgastePct: 91, temperaturaC: 45 } })],
      prediccion: 'ok',
    };
    const { s, avisos, avanzar } = montar(lectura);
    const r = await s.leer();
    expect(r.discos[0]?.veredicto).toBe('atencion');
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: 'salud-disco',
      nivel: 'aviso',
      codigo: 'avisos.disco_salud',
      accion: { ruta: 'basesDeDatos' },
      datos: { estado: 'atencion', modelo: 'Disco NVMe de ejemplo' },
    });
    // La revisión siguiente no repite el aviso.
    avanzar(30 * 60_000);
    await s.leer();
    expect(avisos).toHaveLength(1);
    await s.guardado();
  });

  it('un evento crítico del disco se lista con su disco y gravedad', async () => {
    const { s, plataforma } = montar({ discos: [], prediccion: 'ok' });
    const ev: EventoDisco = {
      fecha: '2026-11-20T08:30:00.000Z',
      id: 7,
      proveedor: 'disk',
      codigo: 'disco_7',
      gravedad: 'critico',
      disco: { tipo: 'disco', valor: '1' },
      detalle: 'bad block',
    };
    plataforma.eventosDeDisco = [ev];
    expect(await s.eventos()).toEqual([ev]);
    plataforma.eventosDeDisco = null;
    await expect(s.eventos()).rejects.toMatchObject({ codigo: 'discos.sin_eventos' });
  });

  it('con los avisos desactivados no avisa y la revisión ni siquiera lee', async () => {
    const lectura: LecturaDiscos = {
      discos: [nvme({ salud: 'unhealthy' })],
      prediccion: 'ok',
    };
    const { s, avisos, plataforma } = montar(lectura, false);
    const leer = vi.spyOn(plataforma, 'saludDiscos');
    await s.revisar();
    expect(leer).not.toHaveBeenCalled();
    await s.leer();
    expect(avisos).toEqual([]);
  });

  it('la revisión en segundo plano nunca pide administrador', async () => {
    const { s, plataforma } = montar({ discos: [nvme()], prediccion: 'ok' });
    await s.revisar();
    await s.revisar();
    expect(plataforma.lecturasAdminDiscos).toBe(0);
  });

  it('la lectura con administrador solo ocurre cuando se pide y sale marcada', async () => {
    const { s, plataforma } = montar({ discos: [nvme()], prediccion: 'ok' });
    const r = await s.leer({ admin: true });
    expect(r.conAdmin).toBe(true);
    expect(plataforma.lecturasAdminDiscos).toBe(1);
  });

  it('un UAC cancelado o fallido es un error del catálogo', async () => {
    const { s, plataforma } = montar({ discos: [nvme()], prediccion: 'ok' });
    plataforma.discosAdmin = { ok: false, motivo: 'cancelado' };
    await expect(s.leer({ admin: true })).rejects.toMatchObject({
      codigo: 'discos.admin_cancelado',
    });
    plataforma.discosAdmin = { ok: false, motivo: 'tiempo' };
    await expect(s.leer({ admin: true })).rejects.toMatchObject({ codigo: 'discos.admin_tiempo' });
    plataforma.discosAdmin = { ok: false, motivo: 'error' };
    await expect(s.leer({ admin: true })).rejects.toMatchObject({ codigo: 'discos.admin_fallo' });
  });

  it('guarda el estado sin series y vuelve a leerlo en otra instancia', async () => {
    const lectura: LecturaDiscos = {
      discos: [nvme({ contadores: { ...contadoresNulos, desgastePct: 85 } })],
      prediccion: 'ok',
    };
    const a = montar(lectura);
    await a.s.leer();
    await a.s.guardado();
    const texto = await readFile(path.join(carpeta, 'run', 'salud-discos.json'), 'utf8');
    expect(texto).toContain('atencion');
    expect(texto).not.toMatch(/serial|unique/i);
    // Otra instancia con el mismo archivo no repite el aviso ya dado.
    const b = montar(lectura);
    await b.s.leer();
    expect(b.avisos).toHaveLength(0);
    const c = new SaludDiscos({
      plataforma: a.plataforma,
      archivoEstado: path.join(carpeta, 'run', 'salud-discos.json'),
      carpetaDatos: () => 'C:\\x',
      carpetasProyectos: async () => [],
      publicar: () => {
        throw new Error('no debía avisar');
      },
      avisosActivados: async () => true,
    });
    await c.leer();
  });

  it('iniciar difiere la primera revisión y cerrar la cancela', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    try {
      const { s, plataforma } = montar({ discos: [nvme()], prediccion: 'ok' });
      const leer = vi.spyOn(plataforma, 'saludDiscos');
      s.iniciar(1000, 5000);
      expect(leer).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1001);
      expect(leer).toHaveBeenCalledTimes(1);
      // Espera a que la primera revisión termine de verdad (deja su estado en disco).
      for (let i = 0; i < 500; i++) {
        const hecho = await access(path.join(carpeta, 'run', 'salud-discos.json')).then(
          () => true,
          () => false,
        );
        if (hecho) break;
        await new Promise((r) => setImmediate(r));
      }
      await s.guardado();
      await new Promise((r) => setImmediate(r));
      await vi.advanceTimersByTimeAsync(5000);
      expect(leer).toHaveBeenCalledTimes(2);
      await s.cerrar();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(leer).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('lectura sin administrador tras una con administrador (I1) y cola (M5)', () => {
  const sinContadores = (): LecturaDiscos => ({ discos: [nvme()], prediccion: 'no_disponible' });
  const conErrores = (): LecturaDiscos => ({
    discos: [
      nvme({
        motivoSinContadores: null,
        contadores: { ...contadoresNulos, erroresLecturaNoCorregidos: 3, temperaturaC: 40 },
      }),
    ],
    prediccion: 'ok',
  });

  it('el veredicto de los contadores leídos con administrador no se rebaja ni se vuelve a avisar', async () => {
    const { s, plataforma, avisos, avanzar } = montar(sinContadores());
    plataforma.discosAdmin = { ok: true, lectura: conErrores() };
    expect((await s.leer()).discos[0]?.veredicto).toBe('bien');
    const admin = await s.leer({ admin: true });
    expect(admin.discos[0]).toMatchObject({ veredicto: 'critico', datoConservado: null });
    expect(avisos).toHaveLength(1);
    avanzar(60_000);
    const luego = await s.leer();
    expect(luego.discos[0]).toMatchObject({
      veredicto: 'critico',
      motivos: ['errores_sin_corregir'],
      contadores: null,
      datoConservado: { origen: 'admin', en: new Date(1_800_000_000_000).toISOString() },
    });
    avanzar(8 * 3_600_000);
    expect((await s.leer()).discos[0]?.veredicto).toBe('critico');
    // Recuperar la misma información con administrador tampoco repite el aviso.
    await s.leer({ admin: true });
    expect(avisos).toHaveLength(1);
  });

  it('una Atención por temperatura conservada de una lectura con administrador caduca a las 24 h; los errores sin corregir no', async () => {
    const caliente = (): LecturaDiscos => ({
      discos: [
        nvme({
          motivoSinContadores: null,
          contadores: { ...contadoresNulos, temperaturaC: 75 },
        }),
      ],
      prediccion: 'ok',
    });
    const { s, plataforma, avanzar } = montar(sinContadores());
    plataforma.discosAdmin = { ok: true, lectura: caliente() };
    expect((await s.leer({ admin: true })).discos[0]?.veredicto).toBe('atencion');
    avanzar(23 * 3_600_000);
    expect((await s.leer()).discos[0]).toMatchObject({ veredicto: 'atencion' });
    avanzar(2 * 3_600_000);
    expect((await s.leer()).discos[0]).toMatchObject({ veredicto: 'bien', datoConservado: null });
    // Los errores sin corregir, en cambio, se conservan hasta una nueva lectura con administrador.
    plataforma.discosAdmin = { ok: true, lectura: conErrores() };
    expect((await s.leer({ admin: true })).discos[0]?.veredicto).toBe('critico');
    avanzar(30 * 24 * 3_600_000);
    expect((await s.leer()).discos[0]).toMatchObject({ veredicto: 'critico' });
  });

  it('el dato conservado sobrevive a reiniciar la app (se guarda en el estado)', async () => {
    const { s, plataforma } = montar(sinContadores());
    plataforma.discosAdmin = { ok: true, lectura: conErrores() };
    await s.leer({ admin: true });
    await s.guardado();
    const otro = montar(sinContadores());
    const nuevo = new SaludDiscos({
      plataforma: otro.plataforma,
      archivoEstado: path.join(carpeta, 'run', 'salud-discos.json'),
      carpetaDatos: () => 'C:\\x',
      carpetasProyectos: async () => [],
      publicar: () => undefined,
      avisosActivados: async () => true,
      ahora: () => 1_800_000_100_000,
    });
    creados.push(nuevo);
    expect((await nuevo.leer()).discos[0]).toMatchObject({
      veredicto: 'critico',
      datoConservado: { origen: 'admin' },
    });
  });

  it('una lectura con contadores sanos sí lo sustituye', async () => {
    const { s, plataforma } = montar(sinContadores());
    plataforma.discosAdmin = { ok: true, lectura: conErrores() };
    await s.leer({ admin: true });
    plataforma.discosAdmin = {
      ok: true,
      lectura: {
        discos: [
          nvme({ motivoSinContadores: null, contadores: { ...contadoresNulos, temperaturaC: 35 } }),
        ],
        prediccion: 'ok',
      },
    };
    expect((await s.leer({ admin: true })).discos[0]?.veredicto).toBe('bien');
    expect((await s.leer()).discos[0]).toMatchObject({ veredicto: 'bien', datoConservado: null });
  });

  it('la lectura con administrador y el sondeo van en cola: un solo aviso', async () => {
    const { s, plataforma, avisos } = montar(conErrores());
    plataforma.discosAdmin = { ok: true, lectura: conErrores() };
    const [a, b] = await Promise.all([s.leer({ admin: true }), s.leer()]);
    expect(a.discos[0]?.veredicto).toBe('critico');
    expect(b.discos[0]?.veredicto).toBe('critico');
    expect(avisos).toHaveLength(1);
  });

  it('un fallo de una lectura no bloquea la cola', async () => {
    const { s, plataforma } = montar(null);
    plataforma.discosAdmin = { ok: false, motivo: 'cancelado' };
    await expect(s.leer({ admin: true })).rejects.toMatchObject({
      codigo: 'discos.admin_cancelado',
    });
    plataforma.discos = sinContadores();
    expect((await s.leer()).discos).toHaveLength(1);
  });
});

describe('ayudas', () => {
  it('unidadDeRuta y claveDisco', () => {
    expect(unidadDeRuta('d:\\x')).toBe('D:');
    expect(unidadDeRuta('C:')).toBe('C:');
    expect(unidadDeRuta('/home/x')).toBeNull();
    expect(claveDisco({ modelo: null, tamanoBytes: null, numero: 3 })).toBe('disco|0|3');
  });
});

describe('plataforma', () => {
  it('con una carpeta de datos de prueba la lectura elevada se niega y no llega a la plataforma', async () => {
    const real = new PlataformaFalsa();
    const aislada = aislarPlataforma(real);
    const r = await aislada.saludDiscosAdmin();
    expect(r).toMatchObject({ ok: false, motivo: 'denegado' });
    expect(real.lecturasAdminDiscos).toBe(0);
  });

  it('fuera de Windows se usa el respaldo neutro: sin lectura y sin PowerShell', async () => {
    const respaldo = new PlataformaWindows();
    const p = completarPlataforma({} as never, respaldo as never, 'linux');
    expect(await p.saludDiscos()).toBeNull();
    expect(await p.eventosDisco()).toBeNull();
    expect(await p.saludDiscosAdmin()).toMatchObject({ ok: false, motivo: 'error' });
  });
});

describe('PlataformaWindows (ejecutor falso)', () => {
  const entorno = { SystemRoot: 'C:\\Windows' };
  const JSON_OK = JSON.stringify({
    p: 'ok',
    discos: [
      {
        n: '0',
        modelo: 'Disco de ejemplo',
        medio: 'SSD',
        bus: 'NVMe',
        tam: 5e11,
        salud: 'Healthy',
        oper: ['OK'],
        cs: 'admin',
        c: null,
        pf: null,
        letras: ['C'],
      },
    ],
  });

  it('lee por la ruta absoluta de System32 con -EncodedCommand', async () => {
    const ej = vi.fn(async () => ({ codigo: 0, stdout: JSON_OK, stderr: '' }));
    const p = new PlataformaWindows(ej, undefined, { entorno, carpetaTemporal: carpeta });
    const r = await p.saludDiscos();
    expect(r?.discos[0]?.motivoSinContadores).toBe('admin');
    const [cmd, args] = ej.mock.calls[0] as unknown as [string, string[]];
    expect(cmd).toBe('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
    expect(args).toContain('-EncodedCommand');
    expect(Buffer.from(args[args.length - 1]!, 'base64').toString('utf16le')).toBe(
      SCRIPT_SALUD_DISCOS,
    );
  });

  it('un fallo del ejecutor o una salida rara: null, sin lanzar', async () => {
    const falla = new PlataformaWindows(
      async () => {
        throw new Error('x');
      },
      undefined,
      { entorno, carpetaTemporal: carpeta },
    );
    expect(await falla.saludDiscos()).toBeNull();
    expect(await falla.eventosDisco()).toBeNull();
    const rara = new PlataformaWindows(
      async () => ({ codigo: 0, stdout: 'basura', stderr: '' }),
      undefined,
      {
        entorno,
        carpetaTemporal: carpeta,
      },
    );
    expect(await rara.saludDiscos()).toBeNull();
    expect(await rara.eventosDisco()).toEqual([]);
  });
});
