import net from 'node:net';
import tls from 'node:tls';

export interface OpcionesSmtpFalso {
  /** TLS desde el primer byte (puerto 465). */
  implicito?: { cert: string; key: string };
  /** Ofrece STARTTLS con este certificado. */
  starttls?: { cert: string; key: string };
  usuario?: string;
  clave?: string;
  /** No contesta nada (para probar plazos). */
  mudo?: boolean;
  /** Rechaza al destinatario con 550. */
  rechazaDestinatario?: boolean;
}

export interface MensajeRecibido {
  de: string;
  para: string;
  datos: string;
}

/**
 * Servidor SMTP falso en 127.0.0.1 (puerto libre): nunca sale a internet. Guarda lo que recibe y
 * si alguna credencial llegó por una conexión sin cifrar.
 */
export class ServidorSmtpFalso {
  readonly mensajes: MensajeRecibido[] = [];
  /** Se vio AUTH en una conexión sin TLS. */
  authEnTextoPlano = false;
  conexiones = 0;
  puerto = 0;
  private servidor!: net.Server;
  private readonly sockets = new Set<net.Socket>();

  constructor(private readonly o: OpcionesSmtpFalso = {}) {}

  async iniciar(): Promise<void> {
    const manejar = (socket: net.Socket, cifrado: boolean): void => {
      this.conexiones++;
      this.sockets.add(socket);
      socket.on('close', () => this.sockets.delete(socket));
      socket.on('error', () => undefined);
      if (this.o.mudo) return;
      this.sesion(socket, cifrado);
    };
    this.servidor = this.o.implicito
      ? (tls.createServer({ cert: this.o.implicito.cert, key: this.o.implicito.key }, (s) =>
          manejar(s, true),
        ) as unknown as net.Server)
      : net.createServer((s) => manejar(s, false));
    await new Promise<void>((r) => this.servidor.listen(0, '127.0.0.1', r));
    this.puerto = (this.servidor.address() as net.AddressInfo).port;
  }

  async cerrar(): Promise<void> {
    for (const s of this.sockets) s.destroy();
    await new Promise<void>((r) => this.servidor.close(() => r()));
  }

  private sesion(inicial: net.Socket, cifradoInicial: boolean): void {
    let socket = inicial;
    let cifrado = cifradoInicial;
    let buffer = '';
    let enDatos = false;
    let datos = '';
    let de = '';
    let para = '';
    let esperaAuth: 'plain' | 'usuario' | 'clave' | null = null;
    let usuarioLogin = '';
    const enviar = (t: string): void => void socket.write(`${t}\r\n`);
    const credencialesOk = (u: string, c: string): boolean =>
      this.o.usuario === undefined || (u === this.o.usuario && c === this.o.clave);
    const autenticar = (u: string, c: string): void => {
      if (!cifrado) this.authEnTextoPlano = true;
      if (credencialesOk(u, c)) enviar('235 2.7.0 Autenticado');
      else enviar('535 5.7.8 Credenciales no válidas');
    };

    const linea = (l: string): void => {
      if (enDatos) {
        if (l === '.') {
          enDatos = false;
          this.mensajes.push({ de, para, datos });
          datos = '';
          enviar('250 2.0.0 Aceptado id=fake');
        } else datos += `${l}\r\n`;
        return;
      }
      if (esperaAuth === 'plain') {
        esperaAuth = null;
        const [, u, c] = Buffer.from(l, 'base64').toString('utf8').split('\0');
        autenticar(u ?? '', c ?? '');
        return;
      }
      if (esperaAuth === 'usuario') {
        usuarioLogin = Buffer.from(l, 'base64').toString('utf8');
        esperaAuth = 'clave';
        enviar(`334 ${Buffer.from('Password:').toString('base64')}`);
        return;
      }
      if (esperaAuth === 'clave') {
        esperaAuth = null;
        autenticar(usuarioLogin, Buffer.from(l, 'base64').toString('utf8'));
        return;
      }
      const cmd = l.toUpperCase();
      if (cmd.startsWith('EHLO') || cmd.startsWith('HELO')) {
        const ext = ['250-fake.local'];
        if (this.o.starttls && !cifrado) ext.push('250-STARTTLS');
        ext.push('250 AUTH PLAIN LOGIN');
        for (const e of ext) enviar(e);
      } else if (cmd === 'STARTTLS' && this.o.starttls && !cifrado) {
        enviar('220 2.0.0 Listo para TLS');
        const seguro = new tls.TLSSocket(socket, {
          isServer: true,
          cert: this.o.starttls.cert,
          key: this.o.starttls.key,
        });
        seguro.on('error', () => undefined);
        this.sockets.add(seguro);
        socket.removeAllListeners('data');
        socket = seguro;
        cifrado = true;
        buffer = '';
        seguro.on('data', alDato);
      } else if (cmd === 'STARTTLS') {
        enviar('502 5.5.1 STARTTLS no disponible');
      } else if (cmd.startsWith('AUTH PLAIN')) {
        const resto = l.slice(10).trim();
        if (resto) {
          const [, u, c] = Buffer.from(resto, 'base64').toString('utf8').split('\0');
          autenticar(u ?? '', c ?? '');
        } else {
          esperaAuth = 'plain';
          enviar('334 ');
        }
      } else if (cmd.startsWith('AUTH LOGIN')) {
        esperaAuth = 'usuario';
        enviar(`334 ${Buffer.from('Username:').toString('base64')}`);
      } else if (cmd.startsWith('MAIL FROM')) {
        de = l.slice(10).replace(/[<>]/g, '').trim();
        enviar('250 2.1.0 OK');
      } else if (cmd.startsWith('RCPT TO')) {
        if (this.o.rechazaDestinatario) enviar('550 5.1.1 Destinatario rechazado');
        else {
          para = l.slice(8).replace(/[<>]/g, '').trim();
          enviar('250 2.1.5 OK');
        }
      } else if (cmd === 'DATA') {
        enDatos = true;
        enviar('354 Siga');
      } else if (cmd === 'QUIT') {
        enviar('221 Adiós');
        socket.end();
      } else enviar('250 OK');
    };

    const alDato = (chunk: Buffer): void => {
      buffer += chunk.toString('utf8');
      let i: number;
      while ((i = buffer.indexOf('\r\n')) >= 0) {
        const l = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        linea(l);
      }
    };
    socket.on('data', alDato);
    enviar('220 fake.local ESMTP listo');
  }
}
