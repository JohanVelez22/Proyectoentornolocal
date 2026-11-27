import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import forge from 'node-forge';
import type { Plataforma, ResultadoEscritura } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { emitirCertificado, generarCA, huellaSha1, type ParCertificado } from './ca';

export type ResultadoCA =
  | { ok: true; avisoCaVieja?: true }
  | {
      ok: false;
      motivo: 'cancelado' | 'error';
      mensaje: string;
      /** Al volver atrás algo no se pudo deshacer (el mensaje dice qué). */
      vueltaAtrasIncompleta?: true;
    };

/** Estado completo de HTTPS para la interfaz: autoridad, puerto y quién lo ocupa. */
export interface EstadoHttps {
  caCreada: boolean;
  caInstalada: boolean;
  puerto: number;
  /** Programa ajeno que usa el puerto HTTPS (los sitios quedan en HTTP), o null. */
  ocupadoPor: { pid: number; nombre: string } | null;
}

export interface DepsHttps {
  rutas: Rutas;
  plataforma: Pick<
    Plataforma,
    | 'instalarCertificadoUsuario'
    | 'quitarCertificadoUsuario'
    | 'certificadoInstalado'
    | 'duenosDePuertos'
    | 'descendientes'
    | 'rutaProceso'
  >;
  /** PID de nuestro nginx (si corre): un puerto suyo (o de sus workers) cuenta como libre. */
  pidNginx?: () => number | null;
  ahora?: () => Date;
}

export interface DominiosCertificado {
  id: string;
  dominio: string;
  alias: string[];
}

const DIA_MS = 86_400_000;
const MARGEN_RENOVAR_DIAS = 30;

export class GestorHttps {
  constructor(private readonly d: DepsHttps) {}

  private get ahora(): Date {
    return this.d.ahora ? this.d.ahora() : new Date();
  }

  caCreada(): boolean {
    return existsSync(this.d.rutas.caCrt()) && existsSync(this.d.rutas.caKey());
  }

  async estado(): Promise<{ caCreada: boolean; caInstalada: boolean }> {
    const caCreada = this.caCreada();
    if (!caCreada) return { caCreada, caInstalada: false };
    try {
      const huella = huellaSha1(await readFile(this.d.rutas.caCrt(), 'utf8'));
      return { caCreada, caInstalada: await this.d.plataforma.certificadoInstalado(huella) };
    } catch {
      return { caCreada, caInstalada: false };
    }
  }

  private async leerCA(): Promise<ParCertificado> {
    return {
      certPem: await readFile(this.d.rutas.caCrt(), 'utf8'),
      keyPem: await readFile(this.d.rutas.caKey(), 'utf8'),
    };
  }

  /** Crea la CA si falta (sin instalarla en ningún almacén): el móvil necesita su `ca.crt`. */
  async crearCaSiFalta(): Promise<void> {
    await this.asegurarCA();
  }

  private creandoCA: Promise<ParCertificado> | null = null;

  /** Una sola creación a la vez: dos primeras llamadas concurrentes no generan dos CA. */
  private asegurarCA(): Promise<ParCertificado> {
    this.creandoCA ??= this.crearCA().finally(() => {
      this.creandoCA = null;
    });
    return this.creandoCA;
  }

  private async crearCA(): Promise<ParCertificado> {
    if (this.caCreada()) return this.leerCA();
    const ca = generarCA(this.ahora);
    await mkdir(path.dirname(this.d.rutas.caCrt()), { recursive: true });
    // La clave privada nunca se registra. El modo 0o600 no hace nada en Windows: la protección
    // real es la ACL del perfil del usuario (la carpeta de datos está en %LOCALAPPDATA%).
    await writeFile(this.d.rutas.caKey(), ca.keyPem, { encoding: 'utf8', mode: 0o600 });
    await writeFile(this.d.rutas.caCrt(), ca.certPem, 'utf8');
    return ca;
  }

  private resultado(r: ResultadoEscritura, verbo: 'instalar' | 'quitar'): ResultadoCA {
    if (r.ok) return { ok: true };
    if (r.motivo === 'cancelado') {
      return {
        ok: false,
        motivo: 'cancelado',
        mensaje:
          'Se canceló la operación. Windows pide confirmación para modificar los certificados de confianza; acepte el aviso para continuar.',
      };
    }
    return {
      ok: false,
      motivo: 'error',
      mensaje: `No se pudo ${verbo} la autoridad de certificados de WolfCore Dev${r.detalle ? `: ${r.detalle}` : '.'}`,
    };
  }

  /** Crea la CA si falta y la agrega al almacén de certificados del usuario (Windows confirma). */
  async instalarCA(): Promise<ResultadoCA> {
    await this.asegurarCA();
    return this.resultado(
      await this.d.plataforma.instalarCertificadoUsuario(this.d.rutas.caCrt()),
      'instalar',
    );
  }

  /**
   * Quita del almacén de confianza una CA anterior por su huella SHA-1 (la que dejó un perfil al
   * reemplazarla). Nunca la actual: si coincide con la CA de este equipo, se rechaza.
   */
  async quitarPorHuella(huella: string): Promise<ResultadoCA> {
    if (!/^[0-9A-Fa-f]{40}$/.test(huella)) {
      return { ok: false, motivo: 'error', mensaje: 'La huella no es válida.' };
    }
    let actual: string | null = null;
    try {
      if (this.caCreada()) actual = huellaSha1(await readFile(this.d.rutas.caCrt(), 'utf8'));
    } catch {
      // una CA actual ilegible no impide quitar la anterior
    }
    if (actual?.toUpperCase() === huella.toUpperCase()) {
      return { ok: false, motivo: 'error', mensaje: 'Esa es la CA actual de este equipo.' };
    }
    return this.resultado(
      await this.d.plataforma.quitarCertificadoUsuario(huella.toUpperCase()),
      'quitar',
    );
  }

  async quitarCA(): Promise<ResultadoCA> {
    if (!this.caCreada()) return { ok: true };
    const huella = huellaSha1(await readFile(this.d.rutas.caCrt(), 'utf8'));
    return this.resultado(await this.d.plataforma.quitarCertificadoUsuario(huella), 'quitar');
  }

  /**
   * Regenera la CA (Doctor, CA vencida o por vencer) sin dejar nunca al usuario sin una CA de
   * confianza:
   * 1. copia con fecha de la CA y los certificados en `carpetaRespaldo/ca-<fecha>`;
   * 2. crea la CA nueva en una carpeta temporal y la CONFÍA primero (las dos conviven en el
   *    almacén). Si se cancela o falla, no se toca nada más;
   * 3. reemplaza los archivos de la CA (guardando los viejos y una copia de los certificados) y
   *    llama a `aplicar`, que vuelve a emitir los certificados de los sitios y recarga Nginx;
   * 4. si `aplicar` falla, vuelve atrás (CA y certificados viejos, `aplicar` otra vez) y quita
   *    la nueva del almacén. Si algo de eso falla, se dice qué (`vueltaAtrasIncompleta`) y la
   *    copia `.certs-<id>` se conserva si los certificados no se pudieron restaurar;
   * 5. si salió bien, quita la vieja del almacén; si eso falla, solo se avisa (`avisoCaVieja`).
   */
  async regenerarCA(
    carpetaRespaldo: string,
    aplicar: () => Promise<boolean>,
  ): Promise<ResultadoCA> {
    if (!this.caCreada()) return this.instalarCA();
    const carpetaCa = path.dirname(this.d.rutas.caCrt());
    const carpetaCerts = path.dirname(this.d.rutas.certCrt('x'));
    const fecha = this.ahora.toISOString().replace(/[:.]/g, '-');
    const destino = path.join(carpetaRespaldo, `ca-${fecha}`);
    await mkdir(destino, { recursive: true });
    const sinPisar = { recursive: true, force: false, errorOnExist: true } as const;
    await cp(carpetaCa, path.join(destino, 'ca'), {
      ...sinPisar,
      filter: (o) => !path.basename(o).startsWith('.'),
    });
    if (existsSync(carpetaCerts)) await cp(carpetaCerts, path.join(destino, 'certs'), sinPisar);

    const vieja = await this.leerCA();
    const huellaVieja = huellaSha1(vieja.certPem);
    const id = randomUUID().slice(0, 8);
    const tmp = path.join(carpetaCa, `.nueva-${id}`);
    const certsViejos = path.join(carpetaCa, `.certs-${id}`);
    let certsConservados = false;
    try {
      const nueva = generarCA(this.ahora);
      await mkdir(tmp, { recursive: true });
      const tmpCrt = path.join(tmp, path.basename(this.d.rutas.caCrt()));
      await writeFile(path.join(tmp, path.basename(this.d.rutas.caKey())), nueva.keyPem, {
        encoding: 'utf8',
        mode: 0o600,
      });
      await writeFile(tmpCrt, nueva.certPem, 'utf8');
      const confiada = this.resultado(
        await this.d.plataforma.instalarCertificadoUsuario(tmpCrt),
        'instalar',
      );
      if (!confiada.ok) return confiada;

      const huellaNueva = huellaSha1(nueva.certPem);
      /** Quita la nueva del almacén; false si no se pudo. */
      const quitarNueva = async (): Promise<boolean> =>
        (
          await this.d.plataforma
            .quitarCertificadoUsuario(huellaNueva)
            .catch((): ResultadoEscritura => ({ ok: false, motivo: 'error' }))
        ).ok;

      const tieneCerts = existsSync(carpetaCerts);
      if (tieneCerts) {
        try {
          await cp(carpetaCerts, certsViejos, sinPisar);
        } catch (e) {
          // Aún no se tocó ningún archivo: solo hay que sacar la nueva del almacén.
          const quitada = await quitarNueva();
          return {
            ok: false,
            motivo: 'error',
            mensaje: `No se pudo guardar una copia de los certificados (${e instanceof Error ? e.message : String(e)}); no se cambió nada.${quitada ? '' : ' La autoridad nueva quedó en el almacén de confianza: quítela desde certmgr.msc.'}`,
            ...(quitada ? {} : { vueltaAtrasIncompleta: true as const }),
          };
        }
      }
      /** Vuelve atrás; devuelve lo que no se pudo deshacer. */
      const volverAtras = async (): Promise<string[]> => {
        const faltas: string[] = [];
        try {
          await writeFile(this.d.rutas.caKey(), vieja.keyPem, { encoding: 'utf8', mode: 0o600 });
          await writeFile(this.d.rutas.caCrt(), vieja.certPem, 'utf8');
        } catch {
          faltas.push(`no se pudo restaurar la autoridad (hay una copia en ${destino})`);
        }
        try {
          await rm(carpetaCerts, { recursive: true, force: true });
          if (tieneCerts) await cp(certsViejos, carpetaCerts, { recursive: true });
        } catch {
          certsConservados = true;
          faltas.push(`no se pudieron restaurar los certificados (están en ${certsViejos})`);
        }
        if (!(await aplicar().catch(() => false))) {
          faltas.push('no se pudo volver a aplicar la configuración de los sitios');
        }
        if (!(await quitarNueva())) {
          faltas.push('la autoridad nueva quedó en el almacén de confianza');
        }
        return faltas;
      };
      let ok = false;
      try {
        await writeFile(this.d.rutas.caKey(), nueva.keyPem, { encoding: 'utf8', mode: 0o600 });
        await writeFile(this.d.rutas.caCrt(), nueva.certPem, 'utf8');
        ok = await aplicar();
      } catch {
        ok = false;
      }
      if (!ok) {
        const faltas = await volverAtras();
        if (faltas.length > 0) {
          return {
            ok: false,
            motivo: 'error',
            mensaje: `No se pudo aplicar la autoridad de certificados nueva y la vuelta atrás quedó incompleta: ${faltas.join('; ')}.`,
            vueltaAtrasIncompleta: true,
          };
        }
        return {
          ok: false,
          motivo: 'error',
          mensaje:
            'No se pudo aplicar la autoridad de certificados nueva; se dejó todo como estaba.',
        };
      }
      const quitada = await this.d.plataforma
        .quitarCertificadoUsuario(huellaVieja)
        .catch((): ResultadoEscritura => ({ ok: false, motivo: 'error' }));
      return quitada.ok ? { ok: true } : { ok: true, avisoCaVieja: true };
    } finally {
      await rm(tmp, { recursive: true, force: true }).catch(() => undefined);
      // La copia de los certificados solo se borra si ya no hace falta para recuperarlos.
      if (!certsConservados) {
        await rm(certsViejos, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }

  /**
   * Quién tiene el puerto HTTPS: nadie (`libre`), nuestro nginx (`propio`: el maestro, un proceso
   * cuyo ejecutable está bajo nuestro `bin/nginx` o un worker hijo del maestro), otro programa
   * (`ajeno`) o `desconocido` (no se pudo averiguar de quién es: no se concluye «ajeno»).
   */
  async estadoPuerto(puerto: number): Promise<{
    estado: 'libre' | 'propio' | 'ajeno' | 'desconocido';
    dueno?: { pid: number; nombre: string };
  }> {
    const dueno = (await this.d.plataforma.duenosDePuertos([puerto])).get(puerto);
    if (!dueno) return { estado: 'libre' };
    const maestro = this.d.pidNginx?.() ?? null;
    if (maestro !== null && maestro === dueno.pid) return { estado: 'propio', dueno };
    // Un nginx.exe de nuestra carpeta es nuestro, aunque la lista de hijos falle o esté vieja.
    const ruta = this.d.plataforma.rutaProceso
      ? await this.d.plataforma.rutaProceso(dueno.pid).catch(() => null)
      : null;
    if (ruta && this.esDeNuestroNginx(ruta)) return { estado: 'propio', dueno };
    if (maestro !== null && this.d.plataforma.descendientes) {
      // En Windows el socket que escucha suele figurar a nombre del worker (hijo del maestro).
      const hijos = await this.d.plataforma.descendientes([maestro]).catch(() => null);
      // Sin la lista no se sabe: es peor quitar el HTTPS de todos los sitios que dejarlo.
      if (hijos === null) return { estado: 'desconocido', dueno };
      if ((hijos.get(maestro) ?? []).includes(dueno.pid)) return { estado: 'propio', dueno };
    }
    return { estado: 'ajeno', dueno };
  }

  private esDeNuestroNginx(ruta: string): boolean {
    const norm = (t: string): string => path.resolve(t).replaceAll('\\', '/').toLowerCase();
    const raiz = norm(path.dirname(this.d.rutas.bin('nginx', 'x')));
    return norm(ruta).startsWith(`${raiz}/`);
  }

  /** Programa ajeno que ocupa el puerto HTTPS, o null si está libre, lo usa nuestro nginx o no se sabe. */
  async ocupantePuerto(puerto: number): Promise<{ pid: number; nombre: string } | null> {
    const r = await this.estadoPuerto(puerto);
    return r.estado === 'ajeno' && r.dueno ? { pid: r.dueno.pid, nombre: r.dueno.nombre } : null;
  }

  /** El puerto HTTPS sirve si está libre, lo usa nuestro nginx o no se pudo saber de quién es. */
  async puertoUsable(puerto: number): Promise<boolean> {
    return (await this.ocupantePuerto(puerto)) === null;
  }

  /** Opciones HTTPS del servidor por defecto (certificado de localhost) o null si no es usable. */
  async datosPrincipal(
    puerto: number,
  ): Promise<{ puerto: number; crt: string; key: string } | null> {
    if (!this.caCreada() || !(await this.puertoUsable(puerto))) return null;
    try {
      const c = await this.asegurarCertificado({
        id: '_localhost',
        dominio: 'localhost',
        alias: [],
      });
      return { puerto, ...c };
    } catch {
      // Sin certificado de localhost nginx debe arrancar igual, solo con HTTP.
      return null;
    }
  }

  private vigente(pem: string, dominios: string[], ca: ParCertificado): boolean {
    try {
      const c = forge.pki.certificateFromPem(pem);
      const san = c.getExtension('subjectAltName') as {
        altNames?: { value: string; ip?: string }[];
      } | null;
      // Las IP (tipo 7) se comparan por su texto, no por los bytes de `value`.
      const actuales = (san?.altNames ?? []).map((a) => a.ip ?? a.value).join('\n');
      if (actuales !== dominios.join('\n')) return false;
      if (c.validity.notAfter.getTime() - this.ahora.getTime() < MARGEN_RENOVAR_DIAS * DIA_MS) {
        return false;
      }
      return forge.pki.certificateFromPem(ca.certPem).verify(c);
    } catch {
      return false;
    }
  }

  /**
   * Días que le quedan a la CA (`id: 'ca'`) y a cada certificado emitido (negativo: ya venció).
   * Un archivo ilegible se omite.
   */
  async vencimientos(): Promise<{ id: string; dias: number }[]> {
    const dias = (pem: string): number =>
      Math.floor(
        (forge.pki.certificateFromPem(pem).validity.notAfter.getTime() - this.ahora.getTime()) /
          DIA_MS,
      );
    const res: { id: string; dias: number }[] = [];
    try {
      res.push({ id: 'ca', dias: dias(await readFile(this.d.rutas.caCrt(), 'utf8')) });
    } catch {
      // sin CA todavía
    }
    let nombres: string[] = [];
    try {
      nombres = await readdir(path.dirname(this.d.rutas.certCrt('x')));
    } catch {
      // sin certificados todavía
    }
    for (const n of nombres.filter((x) => x.endsWith('.crt'))) {
      const id = n.slice(0, -'.crt'.length);
      try {
        res.push({ id, dias: dias(await readFile(this.d.rutas.certCrt(id), 'utf8')) });
      } catch {
        // certificado ilegible: se regenera al usarlo
      }
    }
    return res;
  }

  /** Certificado del sitio (o de `localhost`): se regenera si cambian los dominios o vence pronto. */
  async asegurarCertificado(s: DominiosCertificado): Promise<{ crt: string; key: string }> {
    const ca = await this.asegurarCA();
    const crt = this.d.rutas.certCrt(s.id);
    const key = this.d.rutas.certKey(s.id);
    const dominios = [s.dominio, ...s.alias];
    if (existsSync(crt) && existsSync(key)) {
      if (this.vigente(await readFile(crt, 'utf8'), dominios, ca)) return { crt, key };
    }
    const nuevo = emitirCertificado(ca, dominios, this.ahora);
    await mkdir(path.dirname(crt), { recursive: true });
    await writeFile(key, nuevo.keyPem, { encoding: 'utf8', mode: 0o600 });
    await writeFile(crt, nuevo.certPem, 'utf8');
    return { crt, key };
  }
}
