import { nombreEjecutable } from '../../plataforma/sistema';
import { fuenteGithub } from './github';

/**
 * Bun: releases de `oven-sh/bun` (etiqueta `bun-v1.4.5`). El zip de Windows x64 trae la carpeta
 * `bun-windows-x64/bun.exe`; su SHA-256 es el `digest` del asset (o, si falta, `SHASUMS256.txt`
 * de la misma release). La release también publica `SHASUMS256.txt.asc`, pero no hay una página
 * oficial con la huella de la clave que firma: no se puede fijar un anillo de confianza, así que
 * no se verifica (solo huella SHA-256).
 */
export const fuenteBun = fuenteGithub({
  servicio: 'bun',
  prefijoTag: 'bun-v',
  dueno: 'oven-sh',
  repo: 'bun',
  asset: () => 'bun-windows-x64.zip',
  formato: 'zip',
  subcarpeta: () => 'bun-windows-x64',
  ejecutable: nombreEjecutable('bun'),
});
