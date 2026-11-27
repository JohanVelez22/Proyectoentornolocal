import type { GlobalThemeOverrides } from 'naive-ui';

const FUENTE =
  "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const FUENTE_MONO = "'Cascadia Mono', 'Cascadia Code', Consolas, 'SF Mono', Menlo, monospace";

const comunes = {
  fontFamily: FUENTE,
  fontFamilyMono: FUENTE_MONO,
  fontSize: '14px',
  borderRadius: '8px',
  borderRadiusSmall: '6px',
};

/** Acentos que se ofrecen en Ajustes; `null` en la configuración es el índigo de siempre. */
export const ACENTOS = [
  { id: 'indigo', claro: '#4f5bd5', oscuro: '#8b93ff' },
  { id: 'azul', claro: '#2563eb', oscuro: '#60a5fa' },
  { id: 'verde', claro: '#16a34a', oscuro: '#4ade80' },
  { id: 'violeta', claro: '#7c3aed', oscuro: '#a78bfa' },
  { id: 'naranja', claro: '#ea580c', oscuro: '#fb923c' },
  { id: 'rosa', claro: '#db2777', oscuro: '#f472b6' },
] as const;
export type IdAcento = (typeof ACENTOS)[number]['id'];

/** El acento guardado es el color del tema claro; el oscuro sale de la tabla (o se aclara). */
export function acentoDe(guardado: string | null): (typeof ACENTOS)[number] | null {
  if (!guardado) return ACENTOS[0];
  return ACENTOS.find((a) => a.claro.toLowerCase() === guardado.toLowerCase()) ?? null;
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla `hex` con blanco (t > 0) o negro (t < 0). */
export function mezclar(hex: string, t: number): string {
  const destino = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  return `#${rgb(hex)
    .map((c) =>
      Math.round(c + (destino - c) * k)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function luminancia(hex: string): number {
  const f = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contraste WCAG entre dos colores `#rrggbb`. */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

const TEXTO_OSCURO = '#10121a';

/** Texto (blanco u oscuro) que se lee mejor sobre un fondo del color del acento. */
export function textoSobre(fondo: string): string {
  return contraste('#ffffff', fondo) >= contraste(TEXTO_OSCURO, fondo) ? '#ffffff' : TEXTO_OSCURO;
}

/** Color primario del tema a partir del acento guardado (`#rrggbb` o null). */
export function primarioDe(acento: string | null, oscuro: boolean): string {
  const a = acentoDe(acento);
  if (a) return oscuro ? a.oscuro : a.claro;
  // Un color propio (editado a mano en config.json): en oscuro se aclara para que se lea.
  return oscuro ? mezclar(acento!, 0.35) : acento!;
}

/** Ajustes del tema de Naive UI para el modo y el acento dados. */
export function temaDe(oscuro: boolean, acento: string | null): GlobalThemeOverrides {
  const p = primarioDe(acento, oscuro);
  const primarios = {
    primaryColor: p,
    primaryColorHover: mezclar(p, 0.15),
    primaryColorPressed: mezclar(p, -0.15),
    primaryColorSuppl: mezclar(p, 0.15),
  };
  const sobre = textoSobre(p);
  const botonPrimario = {
    textColorPrimary: sobre,
    textColorHoverPrimary: sobre,
    textColorPressedPrimary: sobre,
    textColorFocusPrimary: sobre,
  };
  if (oscuro) {
    return {
      // Marcadores y textos vacíos de Naive UI: por defecto llegan a 2.9:1; AA pide 4.5:1.
      common: {
        ...comunes,
        ...primarios,
        bodyColor: '#121317',
        placeholderColor: 'rgba(255, 255, 255, 0.62)',
        textColor3: 'rgba(255, 255, 255, 0.68)',
        // El texto de los botones y etiquetas de aviso lleva el color del tipo sobre un fondo teñido:
        // los tonos por defecto de Naive UI quedan en 3.9–4.2:1.
        errorColor: '#ff9c9c',
        errorColorHover: '#ffb0b0',
        errorColorPressed: '#ff8585',
        errorColorSuppl: '#ff9c9c',
      },
      // La insignia de la campana: texto blanco sobre rojo (el rosa claro de errorColor no da contraste).
      Badge: { color: '#c42a43', textColor: '#ffffff' },
      Button: {
        ...botonPrimario,
        colorOpacitySecondary: '0.07',
        colorOpacitySecondaryHover: '0.11',
        colorOpacitySecondaryPressed: '0.15',
      },
      Empty: { textColor: 'rgba(255, 255, 255, 0.66)' },
      Layout: { siderColor: '#17181d', headerColor: '#121317', color: '#121317' },
      Card: { color: '#1a1b21', borderColor: '#2a2c34' },
    };
  }
  return {
    // Por defecto Naive UI da 4.0:1 al texto terciario, 1.8:1 al marcador y 1.7:1 al texto vacío, y
    // blanco sobre su ámbar (2.1:1) en los botones de aviso: todo por debajo de AA (4.5:1).
    common: {
      ...comunes,
      ...primarios,
      bodyColor: '#f5f6f8',
      textColor3: '#59606a',
      placeholderColor: '#636a75',
      warningColor: '#9a4207',
      warningColorHover: '#8a3b06',
      warningColorPressed: '#7a3305',
      warningColorSuppl: '#9a4207',
      errorColor: '#b0213f',
      errorColorHover: '#a01c38',
      errorColorPressed: '#8f1a33',
      errorColorSuppl: '#b0213f',
      successColor: '#0c6b3a',
      successColorHover: '#0a5c32',
      successColorPressed: '#084d2a',
      successColorSuppl: '#0c6b3a',
      infoColor: '#1558b8',
      infoColorHover: '#124ca0',
      infoColorPressed: '#0f4088',
      infoColorSuppl: '#1558b8',
    },
    // Los botones "secundarios" y las etiquetas tiñen su fondo con el color del tipo: con menos tinte
    // el texto del mismo color llega a 4.5:1 (con el 16 % por defecto se quedaba en 3.5–4.1:1).
    Button: {
      ...botonPrimario,
      colorOpacitySecondary: '0.05',
      colorOpacitySecondaryHover: '0.09',
      colorOpacitySecondaryPressed: '0.13',
    },
    Empty: { textColor: '#59606a' },
    Layout: { siderColor: '#fbfbfc', headerColor: '#f5f6f8', color: '#f5f6f8' },
    Card: { borderColor: '#e6e8ec' },
  };
}

/** Compatibilidad: los temas fijos con el acento por defecto. */
export const temaClaro = temaDe(false, null);
export const temaOscuro = temaDe(true, null);
