import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import forge from 'node-forge';
import type { Plataforma, ResultadoEscritura } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { emitirCertificado, generarCA, huellaSha1, type ParCertificado } from './ca';

export type ResultadoCA =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'error'; mensaje: string };

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
  >;
  /** PID de nuestro nginx (si corre): un puerto suyo cuenta como libre. */
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

  async quitarCA(): Promise<ResultadoCA> {
    if (!this.caCreada()) return { ok: true };
    const huella = huellaSha1(await readFile(this.d.rutas.caCrt(), 'utf8'));
    return this.resultado(await this.d.plataforma.quitarCertificadoUsuario(huella), 'quitar');
  }

  /** Programa ajeno que ocupa el puerto HTTPS, o null si está libre o lo usa nuestro nginx. */
  async ocupantePuerto(puerto: number): Promise<{ pid: number; nombre: string } | null> {
    const dueno = (await this.d.plataforma.duenosDePuertos([puerto])).get(puerto);
    if (!dueno || this.d.pidNginx?.() === dueno.pid) return null;
    return { pid: dueno.pid, nombre: dueno.nombre };
  }

  /** El puerto HTTPS sirve si está libre o lo usa nuestro propio nginx. */
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
