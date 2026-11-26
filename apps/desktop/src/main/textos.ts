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
    cliTitulo: 'Orden de la terminal (wolf)',
    cliTunelInternet:
      'Una orden de la terminal quiere publicar {dominio} en internet con {proveedor}. Cualquiera con el enlace podrá verlo.',
    cliTunelTailnet:
      'Una orden de la terminal quiere compartir {dominio} con los equipos de su tailnet ({proveedor}).',
    cliPublicoEn: 'Dirección pública: https://{publico}',
    cliDatosReales:
      'ATENCIÓN: {dominio} tiene DATOS REALES. Para continuar, elija abajo su dominio exacto. Si no pidió esto, cancele.',
    cliPublicar: 'Publicar',
    cliPhpGlobal:
      'Una orden de la terminal quiere cambiar el PHP de todas las terminales a la versión {version}.',
    cliCambiar: 'Cambiar',
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
    cliTitulo: 'Terminal command (wolf)',
    cliTunelInternet:
      'A terminal command wants to publish {dominio} on the internet with {proveedor}. Anyone with the link will be able to see it.',
    cliTunelTailnet:
      'A terminal command wants to share {dominio} with the devices on your tailnet ({proveedor}).',
    cliPublicoEn: 'Public address: https://{publico}',
    cliDatosReales:
      'WARNING: {dominio} has REAL DATA. To continue, choose its exact domain below. If you did not ask for this, cancel.',
    cliPublicar: 'Publish',
    cliPhpGlobal:
      'A terminal command wants to change the PHP of all terminals to version {version}.',
    cliCambiar: 'Change',
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
    cliTitulo: 'Comando do terminal (wolf)',
    cliTunelInternet:
      'Um comando do terminal quer publicar {dominio} na internet com {proveedor}. Qualquer pessoa com o link poderá vê-lo.',
    cliTunelTailnet:
      'Um comando do terminal quer compartilhar {dominio} com os dispositivos da sua tailnet ({proveedor}).',
    cliPublicoEn: 'Endereço público: https://{publico}',
    cliDatosReales:
      'ATENÇÃO: {dominio} tem DADOS REAIS. Para continuar, escolha abaixo o domínio exato. Se não pediu isto, cancele.',
    cliPublicar: 'Tornar público',
    cliPhpGlobal:
      'Um comando do terminal quer mudar o PHP de todos os terminais para a versão {version}.',
    cliCambiar: 'Mudar',
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
    cliTitulo: 'Commande du terminal (wolf)',
    cliTunelInternet:
      'Une commande du terminal veut publier {dominio} sur internet avec {proveedor}. Toute personne ayant le lien pourra le voir.',
    cliTunelTailnet:
      'Une commande du terminal veut partager {dominio} avec les appareils de votre tailnet ({proveedor}).',
    cliPublicoEn: 'Adresse publique : https://{publico}',
    cliDatosReales:
      'ATTENTION : {dominio} contient des DONNÉES RÉELLES. Pour continuer, choisissez ci-dessous son domaine exact. Si ce n’était pas voulu, annulez.',
    cliPublicar: 'Publier',
    cliPhpGlobal:
      'Une commande du terminal veut changer le PHP de tous les terminaux vers la version {version}.',
    cliCambiar: 'Changer',
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
