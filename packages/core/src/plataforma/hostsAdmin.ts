import { createHash } from 'node:crypto';
import type { ResultadoEscritura } from './tipos';

/** Prefijo de los temporales de hosts en %TEMP% (`pel-hosts-<pid>-…`). */
export const PREFIJO_TEMPORAL_HOSTS = 'pel-hosts-';

export const sha256 = (b: Buffer | string): string =>
  createHash('sha256').update(b).digest('hex').toUpperCase();

/** Códigos de salida del script elevado. */
export const SALIDA_COPIA = {
  ok: 0,
  vencido: 11,
  sinTemporal: 12,
  temporalAlterado: 13,
  hostsCambiado: 14,
} as const;

/** Cómo se informa cada salida del script (0 se confirma leyendo el archivo). */
export const MOTIVO_SALIDA_COPIA: Record<number, ResultadoEscritura> = {
  [SALIDA_COPIA.vencido]: { ok: false, motivo: 'tiempo' },
  [SALIDA_COPIA.sinTemporal]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo temporal ya no estaba; no se copió nada',
  },
  [SALIDA_COPIA.temporalAlterado]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo temporal cambió antes de copiarlo; no se copió nada',
  },
  [SALIDA_COPIA.hostsCambiado]: {
    ok: false,
    motivo: 'error',
    detalle: 'el archivo hosts cambió mientras se esperaba el permiso; vuelva a aplicar',
  },
};

const literal = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;

/**
 * Script que corre ELEVADO: antes de copiar comprueba que no venció el plazo (hora UTC
 * incrustada), que el temporal es el que se escribió (SHA-256) y que hosts sigue igual que
 * cuando se calculó el contenido nuevo (SHA-256; `NINGUNO` si no existía). Si algo no cuadra,
 * sale con su código sin tocar nada.
 */
export function scriptCopiaHosts(o: {
  temporal: string;
  destino: string;
  limiteUnixMs: number | null;
  hashTemporal: string;
  hashPrevio: string | null;
}): string {
  const lineas = [
    "$ErrorActionPreference = 'Stop'",
    ...(o.limiteUnixMs === null
      ? []
      : [
          `if ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() -gt ${Math.floor(o.limiteUnixMs)}) { exit ${SALIDA_COPIA.vencido} }`,
        ]),
    `$t = ${literal(o.temporal)}`,
    `$d = ${literal(o.destino)}`,
    `if (-not (Test-Path -LiteralPath $t)) { exit ${SALIDA_COPIA.sinTemporal} }`,
    `if ((Get-FileHash -LiteralPath $t -Algorithm SHA256).Hash -ne ${literal(o.hashTemporal.toUpperCase())}) { exit ${SALIDA_COPIA.temporalAlterado} }`,
    ...(o.hashPrevio === null
      ? []
      : [
          `$h = if (Test-Path -LiteralPath $d) { (Get-FileHash -LiteralPath $d -Algorithm SHA256).Hash } else { 'NINGUNO' }`,
          `if ($h -ne ${literal(o.hashPrevio.toUpperCase())}) { exit ${SALIDA_COPIA.hostsCambiado} }`,
        ]),
    'Copy-Item -LiteralPath $t -Destination $d -Force',
    'ipconfig /flushdns | Out-Null',
    `exit ${SALIDA_COPIA.ok}`,
  ];
  return lineas.join('\n');
}

/** Script en base64 UTF-16LE para `-EncodedCommand` (sin problemas de comillas). */
export const codificarComando = (script: string): string =>
  Buffer.from(script, 'utf16le').toString('base64');
