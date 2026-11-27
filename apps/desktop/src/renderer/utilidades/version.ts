/** ¿El valor es un número de versión (8.3.1, v2.1)? Solo entonces se pinta con monoespaciada. */
export function esNumeroVersion(valor: string | null | undefined): boolean {
  return typeof valor === 'string' && /^v?\d/.test(valor.trim());
}
