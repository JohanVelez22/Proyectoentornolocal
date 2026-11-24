import { nombreEjecutable } from '../../plataforma/sistema';
import { fuenteGithub } from './github';

/**
 * Deno: releases de `denoland/deno` (etiqueta `v2.9.8`). El zip de Windows x64 trae `deno.exe`
 * en la raíz; su SHA-256 es el `digest` del asset (o su `.sha256sum`). Deno no publica firmas.
 */
export const fuenteDeno = fuenteGithub({
  servicio: 'deno',
  dueno: 'denoland',
  repo: 'deno',
  asset: () => 'deno-x86_64-pc-windows-msvc.zip',
  formato: 'zip',
  ejecutable: nombreEjecutable('deno'),
});
