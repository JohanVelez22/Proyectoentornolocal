import { spawn } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { PlataformaWindows } from '../src/plataforma/index';

/** Consultas reales de Windows: solo leen, no cambian nada del equipo. */
describe.skipIf(process.platform !== 'win32')('PlataformaWindows real (solo Windows)', () => {
  const hijos: { kill(): boolean }[] = [];
  afterEach(() => {
    for (const h of hijos.splice(0)) h.kill();
  });

  it('buscarEjecutable encuentra cmd en el PATH', async () => {
    const r = await new PlataformaWindows().buscarEjecutable('cmd');
    expect(r?.toLowerCase()).toMatch(/\\system32\\cmd\.exe$/);
  });

  it('descendientes ve un hijo de este proceso', async () => {
    const hijo = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    hijos.push(hijo);
    await new Promise((r) => hijo.once('spawn', r));
    const d = await new PlataformaWindows().descendientes([process.pid]);
    expect(d.get(process.pid)).toContain(hijo.pid);
  }, 30_000);

  it('restringirAlUsuario deja un archivo temporal sin herencia y legible por este usuario', async () => {
    const { mkdtemp, readFile, rm, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const path = await import('node:path');
    const carpeta = await mkdtemp(path.join(tmpdir(), 'pel-acl-'));
    try {
      const archivo = path.join(carpeta, 'token.tmp');
      await writeFile(archivo, '');
      expect(await new PlataformaWindows().restringirAlUsuario(archivo)).toBe(true);
      await writeFile(archivo, 'secreto');
      expect(await readFile(archivo, 'utf8')).toBe('secreto');
      const { execFileSync } = await import('node:child_process');
      const acl = execFileSync('icacls', [archivo], { encoding: 'utf8', windowsHide: true });
      // Sin entradas heredadas "(I)": solo la del usuario.
      expect(acl).not.toContain('(I)');
      expect(acl).toContain(process.env.USERNAME ?? '');
    } finally {
      await rm(carpeta, { recursive: true, force: true });
    }
  }, 30_000);

  it('AlmacenCredenciales (D38c): el archivo creado y el reescrito quedan solo para este usuario, sin herencia y sin restos', async () => {
    const { mkdtemp, readdir, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const path = await import('node:path');
    const { execFileSync } = await import('node:child_process');
    const { AlmacenCredenciales } = await import('../src/almacen');
    const { Rutas } = await import('../src/rutas');
    // Carpeta temporal propia: nunca la carpeta de datos real.
    const carpeta = await mkdtemp(path.join(tmpdir(), 'pel-acl-cred-'));
    try {
      const rutas = new Rutas(carpeta);
      const plat = new PlataformaWindows();
      let fallos = 0;
      const c = new AlmacenCredenciales(rutas, undefined, {
        restringir: (ruta) => plat.restringirAlUsuario(ruta),
        alFallarProteccion: () => fallos++,
      });
      const aclDe = () =>
        execFileSync('icacls', [rutas.credenciales()], { encoding: 'utf8', windowsHide: true });
      await c.guardar('mysql', { usuario: 'root', clave: 'clave-de-prueba' });
      expect(aclDe()).not.toContain('(I)');
      expect(aclDe()).toContain(process.env.USERNAME ?? '');
      // Reescribir (otro temporal que reemplaza al archivo) conserva la restricción.
      await c.guardar('mcp', { usuario: 'mcp', clave: 'otra-falsa' });
      expect(aclDe()).not.toContain('(I)');
      expect(await c.leer('mcp')).toEqual({ usuario: 'mcp', clave: 'otra-falsa' });
      expect(fallos).toBe(0);
      expect(await readdir(path.join(carpeta, 'etc'))).toEqual(['credenciales.json']);
    } finally {
      await rm(carpeta, { recursive: true, force: true });
    }
  }, 60_000);

  it('rangosReservados devuelve rangos válidos (o ninguno)', async () => {
    const r = await new PlataformaWindows().rangosReservados('tcp');
    for (const x of r) {
      expect(x.desde).toBeGreaterThan(0);
      expect(x.hasta).toBeGreaterThanOrEqual(x.desde);
      expect(x.hasta).toBeLessThanOrEqual(65535);
    }
  }, 30_000);
});

/**
 * QA 8 (sospecha de sockets heredados): un servidor lanzado con el lanzador oculto
 * (spawn → PowerShell → Process.Start, que en .NET hereda los handles heredables) no debe
 * retener un puerto que este proceso escuchaba. Los sockets de Node/libuv se crean no
 * heredables; si eso cambiara, el puerto quedaría LISTENING a nombre del PID muerto.
 */
describe.skipIf(process.platform !== 'win32')('handles heredados (solo Windows)', () => {
  it('un servidor lanzado por el lanzador oculto no retiene el puerto del padre', async () => {
    const { createServer } = await import('node:net');
    const { mkdtemp, open, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { crearLanzadorOculto } = await import('../src/plataforma/lanzarOculto');
    const plat = new PlataformaWindows();
    const dir = await mkdtemp(join(tmpdir(), 'pel-herencia-'));
    const servidor = createServer();
    await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
    const puerto = (servidor.address() as { port: number }).port;
    const log = await open(join(dir, 'hijo.log'), 'a');
    let pid = 0;
    try {
      const lanzar = crearLanzadorOculto({
        procesoVivo: (p) => plat.procesoVivo(p),
        matarArbol: (p) => plat.matarArbol(p),
        carpetaTmp: dir,
      });
      pid = await lanzar(
        { comando: process.execPath, args: ['-e', 'setTimeout(() => {}, 60000)'] },
        log.fd,
      );
      expect(pid).toBeGreaterThan(0);
      await new Promise<void>((r) => servidor.close(() => r()));
      // El puerto vuelve a estar libre aunque el hijo siga vivo.
      expect((await plat.procesoVivo(pid)).vivo).toBe(true);
      const otro = createServer();
      await new Promise<void>((resolve, reject) => {
        otro.once('error', reject);
        otro.listen(puerto, '127.0.0.1', () => resolve());
      });
      await new Promise<void>((r) => otro.close(() => r()));
      expect(await plat.quienUsaPuerto(puerto)).toBeNull();
    } finally {
      if (pid) await plat.matarArbol(pid);
      await log.close();
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }, 60_000);
});
