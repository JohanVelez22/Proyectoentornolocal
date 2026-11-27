/**
 * Colores del editor por tema. Salen de los tokens de la aplicación (fondo de las tarjetas y texto
 * de `estilos.css` / `tema.ts`) y cada texto llega a AA (4.5:1) sobre el fondo en que se pinta:
 * `contraste-editor.test.ts` lo comprueba.
 */
export const COLORES_EDITOR = {
  claro: {
    fondo: '#ffffff',
    texto: '#1f2328',
    margen: '#f5f6f8',
    numeros: '#59606a',
    activa: '#eef0f6',
    comentario: '#59606a',
    palabra: '#6d28d9',
    cadena: '#0c6b3a',
    numero: '#9a4207',
    funcion: '#1558b8',
    etiqueta: '#b0213f',
    atributo: '#8a3b06',
    enlace: '#4f5bd5',
  },
  oscuro: {
    fondo: '#1a1b21',
    texto: '#e6e8ee',
    margen: '#17181d',
    numeros: '#9ca3b3',
    activa: '#23252d',
    comentario: '#9ca3b3',
    palabra: '#c4a7ff',
    cadena: '#7ee0a0',
    numero: '#ffb38a',
    funcion: '#8bb8ff',
    etiqueta: '#ff9c9c',
    atributo: '#fbbf24',
    enlace: '#8b93ff',
  },
} as const;

export type TemaEditor = keyof typeof COLORES_EDITOR;
