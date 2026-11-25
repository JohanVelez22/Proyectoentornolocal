import type { IdiomaUi } from '@pel/core';

/** Textos del proceso principal (bandeja y diálogos nativos) en los idiomas de la interfaz. */
const TEXTOS = {
  es: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar todo',
    detenerTodo: 'Detener todo',
    salir: 'Salir',
    workspaces: 'Workspaces',
    workspaceParcial: 'parcial',
    preguntaApagar: '¿Apagar los servicios?',
    siApagar: 'Sí, apagar',
    noApagar: 'No, dejarlos encendidos',
    cancelar: 'Cancelar',
    carpetaDatosAislada:
      'carpeta de datos de prueba, sin tocar hosts, PATH ni certificados del sistema',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS no es una carpeta de datos válida: debe ser absoluta, no del sistema y distinta de la carpeta real (y de la anterior). La app se cierra sin tocar nada.',
  },
  en: {
    abrir: 'Open',
    iniciarTodo: 'Start all',
    detenerTodo: 'Stop all',
    salir: 'Quit',
    workspaces: 'Workspaces',
    workspaceParcial: 'partial',
    preguntaApagar: 'Stop the services?',
    siApagar: 'Yes, stop them',
    noApagar: 'No, keep them running',
    cancelar: 'Cancel',
    carpetaDatosAislada:
      'test data folder, without touching the system hosts, PATH or certificates',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS is not a valid data folder: it must be absolute, not a system folder and different from the real one (and the previous one). The app closes without touching anything.',
  },
  pt: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar tudo',
    detenerTodo: 'Parar tudo',
    salir: 'Sair',
    workspaces: 'Espaços de trabalho',
    workspaceParcial: 'em parte',
    preguntaApagar: 'Desligar os serviços?',
    siApagar: 'Sim, desligar',
    noApagar: 'Não, deixá-los ligados',
    cancelar: 'Cancelar',
    carpetaDatosAislada:
      'pasta de dados de teste, sem tocar o hosts, o PATH nem os certificados do sistema',
    carpetaDatosInvalida:
      'WOLFCORE_DATOS não é uma pasta de dados válida: deve ser absoluta, não do sistema e diferente da pasta real (e da anterior). O app fecha sem tocar em nada.',
  },
  fr: {
    abrir: 'Ouvrir',
    iniciarTodo: 'Tout démarrer',
    detenerTodo: 'Tout arrêter',
    salir: 'Quitter',
    workspaces: 'Espaces de travail',
    workspaceParcial: 'partiel',
    preguntaApagar: 'Arrêter les services ?',
    siApagar: 'Oui, les arrêter',
    noApagar: 'Non, les laisser actifs',
    cancelar: 'Annuler',
    carpetaDatosAislada:
      'dossier de données de test, sans toucher au hosts, au PATH ni aux certificats du système',
    carpetaDatosInvalida:
      "WOLFCORE_DATOS n'est pas un dossier de données valide : il doit être absolu, hors des dossiers système et différent du dossier réel (et du précédent). L'application se ferme sans rien toucher.",
  },
} satisfies Record<IdiomaUi, Record<string, string>>;

export type TextosMain = (typeof TEXTOS)['es'];

export function textosMain(idioma: IdiomaUi | null): TextosMain {
  return TEXTOS[idioma ?? 'es'];
}

/** Idioma de la interfaz para un locale del sistema (`es-CO` → `es`); inglés si no es de los cuatro. */
export function idiomaDeLocale(locale: string): IdiomaUi {
  const l = (locale || '').slice(0, 2).toLowerCase();
  return l === 'es' || l === 'pt' || l === 'fr' ? l : 'en';
}
