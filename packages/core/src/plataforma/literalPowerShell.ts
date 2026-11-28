/**
 * Literal de PowerShell entre comillas simples: LA ÚNICA función que se usa para meter un texto
 * en un script. PowerShell trata como comilla simple no solo `'` sino también las tipográficas
 * ‘ ’ ‚ ‛ (p. ej. un perfil «Johan’s»): se duplican TODAS, si no cortarían el literal y el resto
 * del texto se ejecutaría como código (a veces elevado). No dupliques solo `'` en ningún sitio.
 */
export const literalPowerShell = (t: string): string => `'${t.replace(/['‘’‚‛]/g, '$&$&')}'`;
