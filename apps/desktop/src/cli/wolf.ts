/**
 * Cliente `wolf` (D32): se ejecuta con el Electron de la app como Node (`ELECTRON_RUN_AS_NODE=1`,
 * que pone `wolf.cmd` solo para este proceso). Habla con el servidor de órdenes de la app por HTTP
 * en 127.0.0.1 con el token de `run/cli.json`. Nunca importa nada de la app ni del renderer.
 */
import { ejecutarCli } from './cliente';
import { depsReales } from './entorno';

const corte = new AbortController();
// Ctrl+C: termina el seguimiento de registros con un cierre normal.
process.once('SIGINT', () => corte.abort());

void ejecutarCli(process.argv.slice(2), depsReales(__dirname, corte.signal)).then(
  (codigo) => {
    process.exitCode = codigo;
  },
  (e: unknown) => {
    // Un fallo propio nunca imprime una traza con datos: solo el mensaje.
    process.stderr.write(`wolf: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exitCode = 1;
  },
);
