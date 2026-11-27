import { fuenteGithub } from './github';

/**
 * Kotlin: releases de `JetBrains/kotlin` (etiqueta `v2.4.21`). `kotlin-compiler-<v>.zip` trae la
 * carpeta `kotlinc/` (`bin/kotlinc.bat`); su SHA-256 es el `digest` del asset (o su `.sha256`).
 * No publica firmas. El compilador necesita un Java instalado (ver `variablesRuntime`).
 */
export const fuenteKotlin = fuenteGithub({
  servicio: 'kotlin',
  dueno: 'JetBrains',
  repo: 'kotlin',
  asset: (v) => `kotlin-compiler-${v}.zip`,
  formato: 'zip',
  subcarpeta: () => 'kotlinc',
  ejecutable: 'bin/kotlinc.bat',
});
