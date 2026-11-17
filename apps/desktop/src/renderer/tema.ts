import type { GlobalThemeOverrides } from 'naive-ui';

const FUENTE =
  "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
const FUENTE_MONO = "'Cascadia Mono', 'Cascadia Code', Consolas, 'SF Mono', Menlo, monospace";

/** Índigo sobrio como color de marca; cambia de luminosidad según el tema. */
const comunes = {
  fontFamily: FUENTE,
  fontFamilyMono: FUENTE_MONO,
  borderRadius: '8px',
  borderRadiusSmall: '6px',
};

export const temaClaro: GlobalThemeOverrides = {
  common: {
    ...comunes,
    primaryColor: '#4f5bd5',
    primaryColorHover: '#6470e0',
    primaryColorPressed: '#3d48b8',
    primaryColorSuppl: '#6470e0',
    bodyColor: '#f5f6f8',
  },
  Layout: { siderColor: '#fbfbfc', headerColor: '#f5f6f8', color: '#f5f6f8' },
  Card: { borderColor: '#e6e8ec' },
};

export const temaOscuro: GlobalThemeOverrides = {
  common: {
    ...comunes,
    primaryColor: '#8b93ff',
    primaryColorHover: '#a3a9ff',
    primaryColorPressed: '#747cf0',
    primaryColorSuppl: '#a3a9ff',
    bodyColor: '#121317',
  },
  Layout: { siderColor: '#17181d', headerColor: '#121317', color: '#121317' },
  Card: { color: '#1a1b21', borderColor: '#2a2c34' },
};
