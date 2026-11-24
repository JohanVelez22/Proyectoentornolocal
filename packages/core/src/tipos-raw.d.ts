/** Anillos de claves PGP fijados, importados como texto (Vite `?raw`). */
declare module '*.asc?raw' {
  const contenido: string;
  export default contenido;
}
