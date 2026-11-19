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
  if (oscuro) {
    return {
      common: { ...comunes, ...primarios, bodyColor: '#121317' },
      Layout: { siderColor: '#17181d', headerColor: '#121317', color: '#121317' },
      Card: { color: '#1a1b21', borderColor: '#2a2c34' },
    };
  }
  return {
    common: { ...comunes, ...primarios, bodyColor: '#f5f6f8' },
    Layout: { siderColor: '#fbfbfc', headerColor: '#f5f6f8', color: '#f5f6f8' },
    Card: { borderColor: '#e6e8ec' },
  };
}

/** Compatibilidad: los temas fijos con el acento por defecto. */
export const temaClaro = temaDe(false, null);
export const temaOscuro = temaDe(true, null);
