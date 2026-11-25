import type { IdiomaUi } from '@pel/core';

/** Textos del proceso principal (bandeja y diálogos nativos) en los idiomas de la interfaz. */
const TEXTOS = {
  es: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar todo',
    detenerTodo: 'Detener todo',
    salir: 'Salir',
    preguntaApagar: '¿Apagar los servicios?',
    siApagar: 'Sí, apagar',
    noApagar: 'No, dejarlos encendidos',
    cancelar: 'Cancelar',
    carpetaDatos: 'carpeta de datos',
  },
  en: {
    abrir: 'Open',
    iniciarTodo: 'Start all',
    detenerTodo: 'Stop all',
    salir: 'Quit',
    preguntaApagar: 'Stop the services?',
    siApagar: 'Yes, stop them',
    noApagar: 'No, keep them running',
    cancelar: 'Cancel',
    carpetaDatos: 'data folder',
  },
  pt: {
    abrir: 'Abrir',
    iniciarTodo: 'Iniciar tudo',
    detenerTodo: 'Parar tudo',
    salir: 'Sair',
    preguntaApagar: 'Desligar os serviços?',
    siApagar: 'Sim, desligar',
    noApagar: 'Não, deixá-los ligados',
    cancelar: 'Cancelar',
    carpetaDatos: 'pasta de dados',
  },
  fr: {
    abrir: 'Ouvrir',
    iniciarTodo: 'Tout démarrer',
    detenerTodo: 'Tout arrêter',
    salir: 'Quitter',
    preguntaApagar: 'Arrêter les services ?',
    siApagar: 'Oui, les arrêter',
    noApagar: 'Non, les laisser actifs',
    cancelar: 'Annuler',
    carpetaDatos: 'dossier de données',
  },
} satisfies Record<IdiomaUi, Record<string, string>>;

export type TextosMain = (typeof TEXTOS)['es'];

export function textosMain(idioma: IdiomaUi | null): TextosMain {
  return TEXTOS[idioma ?? 'es'];
}
