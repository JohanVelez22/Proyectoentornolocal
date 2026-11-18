import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import forge from 'node-forge';
import type { Plataforma, ResultadoEscritura } from '../plataforma/tipos';
import type { Rutas } from '../rutas';
import { emitirCertificado, generarCA, huellaSha1, type ParCertificado } from './ca';

export type ResultadoCA =
  { ok: true } | { ok: false; motivo: 'cancelado' | 'error'; mensaje: string };

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

  private async asegurarCA(): Promise<ParCertificado> {
    if (this.caCreada()) return this.leerCA();
    const ca = generarCA(this.ahora);
    await mkdir(path.dirname(this.d.rutas.caCrt()), { recursive: true });
    // La clave privada nunca se registra; vive solo bajo la carpeta de datos del usuario.
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

  /** El puerto HTTPS sirve si está libre o lo usa nuestro propio nginx. */
  async puertoUsable(puerto: number): Promise<boolean> {
    const dueno = (await this.d.plataforma.duenosDePuertos([puerto])).get(puerto);
    if (!dueno) return true;
    return this.d.pidNginx?.() === dueno.pid;
  }

  /** Opciones HTTPS del servidor por defecto (certificado de localhost) o null si no es usable. */
  async datosPrincipal(
    puerto: number,
  ): Promise<{ puerto: number; crt: string; key: string } | null> {
    if (!this.caCreada() || !(await this.puertoUsable(puerto))) return null;
    const c = await this.asegurarCertificado({ id: '_localhost', dominio: 'localhost', alias: [] });
    return { puerto, ...c };
  }

  private vigente(pem: string, dominios: string[], ca: ParCertificado): boolean {
    try {
      const c = forge.pki.certificateFromPem(pem);
      const san = c.getExtension('subjectAltName') as { altNames?: { value: string }[] } | null;
      const actuales = (san?.altNames ?? []).map((a) => a.value).join('\n');
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
