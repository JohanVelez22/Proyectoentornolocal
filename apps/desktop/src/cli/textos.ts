import { en } from '../renderer/i18n/en';
import { es } from '../renderer/i18n/es';
import { fr } from '../renderer/i18n/fr';
import { pt } from '../renderer/i18n/pt';

/** Idiomas del cliente: los mismos de la interfaz (el de la app sale de `run/cli.json`). */
export type Idioma = 'es' | 'en' | 'pt' | 'fr';
export const IDIOMAS_CLI: readonly Idioma[] = ['es', 'en', 'pt', 'fr'];

export const esIdioma = (v: unknown): v is Idioma =>
  typeof v === 'string' && (IDIOMAS_CLI as readonly string[]).includes(v);

/** `es-AR`, `pt_BR`, `fr`… → el idioma de la interfaz que corresponde (si no, español). */
export function idiomaDeLocale(locale: string | undefined): Idioma {
  const base = (locale ?? '').trim().split(/[-_.]/)[0]?.toLowerCase() ?? '';
  return esIdioma(base) ? base : 'es';
}

/** Textos propios de la línea de órdenes. Los errores del núcleo salen del diccionario de la interfaz. */
export interface TextosCli {
  uso: string;
  usoIncorrecto: (detalle: string) => string;
  argumentoDesconocido: (a: string) => string;
  faltaArgumento: (cual: string) => string;
  sobraArgumento: (a: string) => string;
  versionInvalida: string;
  appCerrada: string;
  appCerradaAbrir: string;
  archivoInseguro: string;
  archivoViejo: string;
  abriendoApp: string;
  appNoAbrio: string;
  noResponde: string;
  noAutorizado: string;
  errorOrden: (mensaje: string) => string;
  respuestaInvalida: string;
  preguntaCompartir: (dominio: string, proveedor: string) => string;
  preguntaPhpGlobal: (version: string) => string;
  preguntaDatosReales: (dominio: string) => string;
  datosRealesNoCoincide: string;
  datosRealesFalta: string;
  necesitaTerminal: string;
  cancelado: string;
  confirmeEnApp: string;
  si: readonly string[];
  vinculado: (nombre: string, url: string) => string;
  vigilando: (carpeta: string) => string;
  dejoDeVigilar: string;
  usando: (servicio: string, version: string, sitio: string) => string;
  phpGlobal: (version: string) => string;
  asegurado: (sitio: string, url: string) => string;
  yaSeguro: (sitio: string) => string;
  caNoConfiable: string;
  tunelActivo: (url: string) => string;
  tunelEstado: (estado: string) => string;
  tunelCerrado: (sitio: string) => string;
  abierto: (url: string) => string;
  abrirManual: (url: string) => string;
  sinRegistros: string;
  seguimientoTermina: string;
  iniciado: (que: string) => string;
  detenido: (que: string) => string;
  todo: string;
  elemento: (nombre: string, estado: string) => string;
  doctorSinHallazgos: string;
  doctorTitulo: (n: number) => string;
  cabSitios: string;
  cabServicios: string;
  cabTuneles: string;
  sinSitios: string;
  sinServicios: string;
  sinTuneles: string;
  gravedad: Record<'error' | 'aviso' | 'info', string>;
  estados: Record<string, string>;
}

const ESTADOS: Record<Idioma, Record<string, string>> = {
  es: {
    encendido: 'encendido',
    apagado: 'apagado',
    error: 'con error',
    iniciando: 'iniciando',
    deteniendo: 'deteniendo',
    activo: 'activo',
  },
  en: {
    encendido: 'running',
    apagado: 'stopped',
    error: 'error',
    iniciando: 'starting',
    deteniendo: 'stopping',
    activo: 'active',
  },
  pt: {
    encendido: 'ligado',
    apagado: 'desligado',
    error: 'com erro',
    iniciando: 'iniciando',
    deteniendo: 'parando',
    activo: 'ativo',
  },
  fr: {
    encendido: 'démarré',
    apagado: 'arrêté',
    error: 'en erreur',
    iniciando: 'démarrage',
    deteniendo: 'arrêt',
    activo: 'actif',
  },
};

const USO: Record<Idioma, string> = {
  es: `Uso: wolf <orden> [opciones]

Órdenes:
  status                       Estado de sitios, servicios y túneles
  link [carpeta]               Vincula una carpeta como sitio (--nombre, --dominio)
  park [carpeta]               Carpeta vigilada de proyectos (--quitar la deja de vigilar)
  use php@<versión> [--global] PHP del sitio de la carpeta actual (o de las terminales)
  use node@<versión>           Lo mismo para node, python, java, dotnet, go y rust
  secure <sitio>               Activa HTTPS en el sitio
  share <sitio>                Publica el sitio en internet (--proveedor, --cerrar, --si)
  open <sitio>                 Abre el sitio en el navegador
  logs <sitio> [-f]            Registros del sitio (--fuente, -n <líneas>)
  doctor                       Revisa el entorno (solo informa)
  start [workspace|servicio]   Enciende todo, un workspace o un servicio
  stop [workspace|servicio]    Apaga todo, un workspace o un servicio

Opciones generales:
  --json     Salida en JSON
  --abrir    Si la app está cerrada, la abre y espera
  --si       Salta la pregunta de la terminal (la ventana de la app siempre confirma)
  -h, --help Esta ayuda

Códigos de salida: 0 bien, 1 error de la orden, 2 uso incorrecto, 3 la app no está disponible.`,
  en: `Usage: wolf <command> [options]

Commands:
  status                       Status of sites, services and tunnels
  link [folder]                Link a folder as a site (--nombre, --dominio)
  park [folder]                Watched projects folder (--quitar stops watching)
  use php@<version> [--global] PHP of the site in the current folder (or of the terminals)
  use node@<version>           Same for node, python, java, dotnet, go and rust
  secure <site>                Turn on HTTPS for the site
  share <site>                 Publish the site on the internet (--proveedor, --cerrar, --si)
  open <site>                  Open the site in the browser
  logs <site> [-f]             Site logs (--fuente, -n <lines>)
  doctor                       Check the environment (read-only)
  start [workspace|service]    Start everything, a workspace or a service
  stop [workspace|service]     Stop everything, a workspace or a service

General options:
  --json     JSON output
  --abrir    If the app is closed, open it and wait
  --si       Skip the terminal question (the app window always confirms)
  -h, --help This help

Exit codes: 0 ok, 1 command error, 2 wrong usage, 3 the app is not available.`,
  pt: `Uso: wolf <comando> [opções]

Comandos:
  status                       Estado de sites, serviços e túneis
  link [pasta]                 Vincula uma pasta como site (--nombre, --dominio)
  park [pasta]                 Pasta vigiada de projetos (--quitar deixa de vigiar)
  use php@<versão> [--global]  PHP do site da pasta atual (ou dos terminais)
  use node@<versão>            O mesmo para node, python, java, dotnet, go e rust
  secure <site>                Ativa o HTTPS no site
  share <site>                 Publica o site na internet (--proveedor, --cerrar, --si)
  open <site>                  Abre o site no navegador
  logs <site> [-f]             Registros do site (--fuente, -n <linhas>)
  doctor                       Revisa o ambiente (só informa)
  start [workspace|serviço]    Liga tudo, um workspace ou um serviço
  stop [workspace|serviço]     Desliga tudo, um workspace ou um serviço

Opções gerais:
  --json     Saída em JSON
  --abrir    Se o app estiver fechado, abre e espera
  --si       Pula a pergunta do terminal (a janela do app sempre confirma)
  -h, --help Esta ajuda

Códigos de saída: 0 certo, 1 erro do comando, 2 uso incorreto, 3 o app não está disponível.`,
  fr: `Utilisation : wolf <commande> [options]

Commandes :
  status                       État des sites, services et tunnels
  link [dossier]               Lie un dossier comme site (--nombre, --dominio)
  park [dossier]               Dossier de projets surveillé (--quitar arrête la surveillance)
  use php@<version> [--global] PHP du site du dossier courant (ou des terminaux)
  use node@<version>           Idem pour node, python, java, dotnet, go et rust
  secure <site>                Active le HTTPS du site
  share <site>                 Publie le site sur internet (--proveedor, --cerrar, --si)
  open <site>                  Ouvre le site dans le navigateur
  logs <site> [-f]             Journaux du site (--fuente, -n <lignes>)
  doctor                       Vérifie l’environnement (lecture seule)
  start [workspace|service]    Démarre tout, un workspace ou un service
  stop [workspace|service]     Arrête tout, un workspace ou un service

Options générales :
  --json     Sortie en JSON
  --abrir    Si l’application est fermée, l’ouvre et attend
  --si       Passe la question du terminal (la fenêtre de l’application confirme toujours)
  -h, --help Cette aide

Codes de sortie : 0 réussi, 1 erreur de la commande, 2 mauvaise utilisation, 3 l’application n’est pas disponible.`,
};

export const TEXTOS_CLI: Record<Idioma, TextosCli> = {
  es: {
    uso: USO.es,
    usoIncorrecto: (d) => `Uso incorrecto: ${d}\nEscriba «wolf --help» para ver las órdenes.`,
    argumentoDesconocido: (a) => `argumento desconocido: ${a}`,
    faltaArgumento: (c) => `falta ${c}`,
    sobraArgumento: (a) => `sobra el argumento: ${a}`,
    versionInvalida: 'use el formato servicio@versión, por ejemplo php@8.4',
    appCerrada:
      'WolfCore Dev no está abierto, o la CLI está apagada. Abra la app y agregue wolf al PATH desde Ajustes (eso enciende la CLI).',
    appCerradaAbrir: 'Con «--abrir» wolf abre la app y espera.',
    archivoInseguro:
      'El archivo de acceso de la CLI no es seguro (es un enlace o no es solo de su usuario): no se usa.',
    archivoViejo:
      'El archivo de acceso de la CLI es de una sesión anterior (WolfCore Dev no está abierto).',
    abriendoApp: 'Abriendo WolfCore Dev…',
    appNoAbrio: 'WolfCore Dev no respondió a tiempo. Revise que la CLI esté activada en Ajustes.',
    noResponde: 'WolfCore Dev no responde. ¿Se cerró la app?',
    noAutorizado:
      'WolfCore Dev rechazó el acceso (la app se reinició). Vuelva a ejecutar la orden.',
    errorOrden: (m) => `Error: ${m}`,
    respuestaInvalida: 'WolfCore Dev contestó algo que wolf no entiende.',
    preguntaCompartir: (d, p) =>
      `Esto publicará ${d} en internet con ${p}: cualquiera con el enlace podrá verlo. ¿Continuar? [s/N] `,
    preguntaPhpGlobal: (v) =>
      `Esto cambia el PHP de TODAS las terminales a ${v}. ¿Continuar? [s/N] `,
    preguntaDatosReales: (d) =>
      `${d} tiene DATOS REALES. Para continuar escriba su dominio exacto: `,
    datosRealesNoCoincide: 'El dominio escrito no coincide: no se hizo nada.',
    datosRealesFalta:
      'Este sitio tiene datos reales: escriba su dominio con --datos-reales=<dominio> o ejecute la orden en una terminal interactiva.',
    necesitaTerminal:
      'Esta orden necesita confirmar en la terminal: ejecútela en una terminal interactiva o agregue --si.',
    cancelado: 'Cancelado: no se hizo nada.',
    confirmeEnApp:
      'Falta un paso: confirme también en la ventana de WolfCore Dev (tiene unos 45 segundos).',
    si: ['s', 'si', 'sí', 'y', 'yes'],
    vinculado: (n, u) => `Sitio vinculado: ${n} → ${u}`,
    vigilando: (c) => `Carpeta vigilada: ${c}`,
    dejoDeVigilar: 'Ya no se vigila ninguna carpeta.',
    usando: (s, v, sitio) => `${sitio} usa ahora ${s} ${v}.`,
    phpGlobal: (v) => `PHP ${v} es ahora el de todas las terminales nuevas.`,
    asegurado: (s, u) => `HTTPS activado en ${s}: ${u}`,
    yaSeguro: (s) => `${s} ya tenía HTTPS.`,
    caNoConfiable:
      'Falta confiar en la autoridad de WolfCore Dev: hágalo desde Ajustes para que el navegador no avise.',
    tunelActivo: (u) => `Túnel activo: ${u}`,
    tunelEstado: (e) => `Estado del túnel: ${e}`,
    tunelCerrado: (s) => `Túnel de ${s} cerrado.`,
    abierto: (u) => `Abierto: ${u}`,
    abrirManual: (u) => `La app no pudo abrir el navegador. Dirección: ${u}`,
    sinRegistros: '(sin líneas todavía)',
    seguimientoTermina: 'WolfCore Dev dejó de enviar registros.',
    iniciado: (q) => `Encendido: ${q}`,
    detenido: (q) => `Apagado: ${q}`,
    todo: 'todo',
    elemento: (n, e) => `${n}: ${e}`,
    doctorSinHallazgos: 'El Doctor no encontró nada que atender.',
    doctorTitulo: (n) => `El Doctor encontró ${n} cosa(s):`,
    cabSitios: 'Sitios',
    cabServicios: 'Servicios',
    cabTuneles: 'Túneles',
    sinSitios: '(ninguno)',
    sinServicios: '(ninguno)',
    sinTuneles: '(ninguno)',
    gravedad: { error: 'error', aviso: 'aviso', info: 'info' },
    estados: ESTADOS.es,
  },
  en: {
    uso: USO.en,
    usoIncorrecto: (d) => `Wrong usage: ${d}\nType “wolf --help” to see the commands.`,
    argumentoDesconocido: (a) => `unknown argument: ${a}`,
    faltaArgumento: (c) => `missing ${c}`,
    sobraArgumento: (a) => `extra argument: ${a}`,
    versionInvalida: 'use the form service@version, for example php@8.4',
    appCerrada:
      'WolfCore Dev is not open, or the CLI is off. Open the app and add wolf to the PATH from Settings (that turns the CLI on).',
    appCerradaAbrir: 'With “--abrir” wolf opens the app and waits.',
    archivoInseguro:
      'The CLI access file is not safe (it is a link or it is not private to your user): it is not used.',
    archivoViejo: 'The CLI access file is from a previous session (WolfCore Dev is not open).',
    abriendoApp: 'Opening WolfCore Dev…',
    appNoAbrio: 'WolfCore Dev did not answer in time. Check that the CLI is on in Settings.',
    noResponde: 'WolfCore Dev is not answering. Did the app close?',
    noAutorizado: 'WolfCore Dev refused the access (the app restarted). Run the command again.',
    errorOrden: (m) => `Error: ${m}`,
    respuestaInvalida: 'WolfCore Dev answered something wolf does not understand.',
    preguntaCompartir: (d, p) =>
      `This will publish ${d} on the internet with ${p}: anyone with the link will be able to see it. Continue? [y/N] `,
    preguntaPhpGlobal: (v) => `This changes the PHP of ALL terminals to ${v}. Continue? [y/N] `,
    preguntaDatosReales: (d) => `${d} has REAL DATA. To continue, type its exact domain: `,
    datosRealesNoCoincide: 'The domain you typed does not match: nothing was done.',
    datosRealesFalta:
      'This site has real data: type its domain with --datos-reales=<domain> or run the command in an interactive terminal.',
    necesitaTerminal:
      'This command needs a confirmation in the terminal: run it in an interactive terminal or add --si.',
    cancelado: 'Cancelled: nothing was done.',
    confirmeEnApp:
      'One more step: also confirm in the WolfCore Dev window (you have about 45 seconds).',
    si: ['y', 'yes', 's', 'si', 'sí'],
    vinculado: (n, u) => `Site linked: ${n} → ${u}`,
    vigilando: (c) => `Watched folder: ${c}`,
    dejoDeVigilar: 'No folder is watched any more.',
    usando: (s, v, sitio) => `${sitio} now uses ${s} ${v}.`,
    phpGlobal: (v) => `PHP ${v} is now the one for all new terminals.`,
    asegurado: (s, u) => `HTTPS turned on for ${s}: ${u}`,
    yaSeguro: (s) => `${s} already had HTTPS.`,
    caNoConfiable:
      'The WolfCore Dev authority is not trusted yet: do it from Settings so the browser does not warn.',
    tunelActivo: (u) => `Tunnel active: ${u}`,
    tunelEstado: (e) => `Tunnel state: ${e}`,
    tunelCerrado: (s) => `Tunnel of ${s} closed.`,
    abierto: (u) => `Opened: ${u}`,
    abrirManual: (u) => `The app could not open the browser. Address: ${u}`,
    sinRegistros: '(no lines yet)',
    seguimientoTermina: 'WolfCore Dev stopped sending logs.',
    iniciado: (q) => `Started: ${q}`,
    detenido: (q) => `Stopped: ${q}`,
    todo: 'everything',
    elemento: (n, e) => `${n}: ${e}`,
    doctorSinHallazgos: 'The Doctor found nothing to take care of.',
    doctorTitulo: (n) => `The Doctor found ${n} thing(s):`,
    cabSitios: 'Sites',
    cabServicios: 'Services',
    cabTuneles: 'Tunnels',
    sinSitios: '(none)',
    sinServicios: '(none)',
    sinTuneles: '(none)',
    gravedad: { error: 'error', aviso: 'warning', info: 'info' },
    estados: ESTADOS.en,
  },
  pt: {
    uso: USO.pt,
    usoIncorrecto: (d) => `Uso incorreto: ${d}\nDigite «wolf --help» para ver os comandos.`,
    argumentoDesconocido: (a) => `argumento desconhecido: ${a}`,
    faltaArgumento: (c) => `falta ${c}`,
    sobraArgumento: (a) => `argumento a mais: ${a}`,
    versionInvalida: 'use o formato serviço@versão, por exemplo php@8.4',
    appCerrada:
      'O WolfCore Dev não está aberto, ou a CLI está desligada. Abra o app e adicione o wolf ao PATH em Ajustes (isso liga a CLI).',
    appCerradaAbrir: 'Com «--abrir» o wolf abre o app e espera.',
    archivoInseguro:
      'O arquivo de acesso da CLI não é seguro (é um link ou não é só do seu usuário): não é usado.',
    archivoViejo:
      'O arquivo de acesso da CLI é de uma sessão anterior (o WolfCore Dev não está aberto).',
    abriendoApp: 'Abrindo o WolfCore Dev…',
    appNoAbrio: 'O WolfCore Dev não respondeu a tempo. Verifique se a CLI está ligada em Ajustes.',
    noResponde: 'O WolfCore Dev não responde. O app foi fechado?',
    noAutorizado: 'O WolfCore Dev recusou o acesso (o app reiniciou). Execute o comando de novo.',
    errorOrden: (m) => `Erro: ${m}`,
    respuestaInvalida: 'O WolfCore Dev respondeu algo que o wolf não entende.',
    preguntaCompartir: (d, p) =>
      `Isto vai publicar ${d} na internet com ${p}: qualquer pessoa com o link poderá vê-lo. Continuar? [s/N] `,
    preguntaPhpGlobal: (v) => `Isto muda o PHP de TODOS os terminais para ${v}. Continuar? [s/N] `,
    preguntaDatosReales: (d) => `${d} tem DADOS REAIS. Para continuar, digite o domínio exato: `,
    datosRealesNoCoincide: 'O domínio digitado não confere: nada foi feito.',
    datosRealesFalta:
      'Este site tem dados reais: informe o domínio com --datos-reales=<domínio> ou execute o comando em um terminal interativo.',
    necesitaTerminal:
      'Este comando precisa de confirmação no terminal: execute-o em um terminal interativo ou adicione --si.',
    cancelado: 'Cancelado: nada foi feito.',
    confirmeEnApp:
      'Falta um passo: confirme também na janela do WolfCore Dev (você tem cerca de 45 segundos).',
    si: ['s', 'sim', 'si', 'y', 'yes'],
    vinculado: (n, u) => `Site vinculado: ${n} → ${u}`,
    vigilando: (c) => `Pasta vigiada: ${c}`,
    dejoDeVigilar: 'Nenhuma pasta é vigiada agora.',
    usando: (s, v, sitio) => `${sitio} agora usa ${s} ${v}.`,
    phpGlobal: (v) => `O PHP ${v} agora é o de todos os terminais novos.`,
    asegurado: (s, u) => `HTTPS ativado em ${s}: ${u}`,
    yaSeguro: (s) => `${s} já tinha HTTPS.`,
    caNoConfiable:
      'Falta confiar na autoridade do WolfCore Dev: faça isso em Ajustes para o navegador não avisar.',
    tunelActivo: (u) => `Túnel ativo: ${u}`,
    tunelEstado: (e) => `Estado do túnel: ${e}`,
    tunelCerrado: (s) => `Túnel de ${s} fechado.`,
    abierto: (u) => `Aberto: ${u}`,
    abrirManual: (u) => `O app não conseguiu abrir o navegador. Endereço: ${u}`,
    sinRegistros: '(ainda sem linhas)',
    seguimientoTermina: 'O WolfCore Dev parou de enviar registros.',
    iniciado: (q) => `Ligado: ${q}`,
    detenido: (q) => `Desligado: ${q}`,
    todo: 'tudo',
    elemento: (n, e) => `${n}: ${e}`,
    doctorSinHallazgos: 'O Doctor não encontrou nada para resolver.',
    doctorTitulo: (n) => `O Doctor encontrou ${n} item(ns):`,
    cabSitios: 'Sites',
    cabServicios: 'Serviços',
    cabTuneles: 'Túneis',
    sinSitios: '(nenhum)',
    sinServicios: '(nenhum)',
    sinTuneles: '(nenhum)',
    gravedad: { error: 'erro', aviso: 'aviso', info: 'info' },
    estados: ESTADOS.pt,
  },
  fr: {
    uso: USO.fr,
    usoIncorrecto: (d) =>
      `Mauvaise utilisation : ${d}\nTapez « wolf --help » pour voir les commandes.`,
    argumentoDesconocido: (a) => `argument inconnu : ${a}`,
    faltaArgumento: (c) => `il manque ${c}`,
    sobraArgumento: (a) => `argument en trop : ${a}`,
    versionInvalida: 'utilisez la forme service@version, par exemple php@8.4',
    appCerrada:
      'WolfCore Dev n’est pas ouvert, ou la CLI est désactivée. Ouvrez l’application et ajoutez wolf au PATH depuis les Réglages (cela active la CLI).',
    appCerradaAbrir: 'Avec « --abrir », wolf ouvre l’application et attend.',
    archivoInseguro:
      'Le fichier d’accès de la CLI n’est pas sûr (c’est un lien ou il n’est pas réservé à votre utilisateur) : il n’est pas utilisé.',
    archivoViejo:
      'Le fichier d’accès de la CLI date d’une session précédente (WolfCore Dev n’est pas ouvert).',
    abriendoApp: 'Ouverture de WolfCore Dev…',
    appNoAbrio:
      'WolfCore Dev n’a pas répondu à temps. Vérifiez que la CLI est activée dans les Réglages.',
    noResponde: 'WolfCore Dev ne répond pas. L’application a-t-elle été fermée ?',
    noAutorizado:
      'WolfCore Dev a refusé l’accès (l’application a redémarré). Relancez la commande.',
    errorOrden: (m) => `Erreur : ${m}`,
    respuestaInvalida: 'WolfCore Dev a répondu quelque chose que wolf ne comprend pas.',
    preguntaCompartir: (d, p) =>
      `Cela va publier ${d} sur internet avec ${p} : toute personne ayant le lien pourra le voir. Continuer ? [o/N] `,
    preguntaPhpGlobal: (v) =>
      `Cela change le PHP de TOUS les terminaux en ${v}. Continuer ? [o/N] `,
    preguntaDatosReales: (d) =>
      `${d} contient des DONNÉES RÉELLES. Pour continuer, saisissez son domaine exact : `,
    datosRealesNoCoincide: 'Le domaine saisi ne correspond pas : rien n’a été fait.',
    datosRealesFalta:
      'Ce site contient des données réelles : indiquez son domaine avec --datos-reales=<domaine> ou lancez la commande dans un terminal interactif.',
    necesitaTerminal:
      'Cette commande demande une confirmation dans le terminal : lancez-la dans un terminal interactif ou ajoutez --si.',
    cancelado: 'Annulé : rien n’a été fait.',
    confirmeEnApp:
      'Une étape de plus : confirmez aussi dans la fenêtre de WolfCore Dev (vous avez environ 45 secondes).',
    si: ['o', 'oui', 'y', 'yes', 's'],
    vinculado: (n, u) => `Site lié : ${n} → ${u}`,
    vigilando: (c) => `Dossier surveillé : ${c}`,
    dejoDeVigilar: 'Plus aucun dossier n’est surveillé.',
    usando: (s, v, sitio) => `${sitio} utilise maintenant ${s} ${v}.`,
    phpGlobal: (v) => `PHP ${v} est maintenant celui de tous les nouveaux terminaux.`,
    asegurado: (s, u) => `HTTPS activé sur ${s} : ${u}`,
    yaSeguro: (s) => `${s} avait déjà le HTTPS.`,
    caNoConfiable:
      'Il reste à faire confiance à l’autorité de WolfCore Dev : faites-le dans les Réglages pour que le navigateur n’avertisse plus.',
    tunelActivo: (u) => `Tunnel actif : ${u}`,
    tunelEstado: (e) => `État du tunnel : ${e}`,
    tunelCerrado: (s) => `Tunnel de ${s} fermé.`,
    abierto: (u) => `Ouvert : ${u}`,
    abrirManual: (u) => `L’application n’a pas pu ouvrir le navigateur. Adresse : ${u}`,
    sinRegistros: '(pas encore de lignes)',
    seguimientoTermina: 'WolfCore Dev a cessé d’envoyer des journaux.',
    iniciado: (q) => `Démarré : ${q}`,
    detenido: (q) => `Arrêté : ${q}`,
    todo: 'tout',
    elemento: (n, e) => `${n} : ${e}`,
    doctorSinHallazgos: 'Le Doctor n’a rien trouvé à traiter.',
    doctorTitulo: (n) => `Le Doctor a trouvé ${n} point(s) :`,
    cabSitios: 'Sites',
    cabServicios: 'Services',
    cabTuneles: 'Tunnels',
    sinSitios: '(aucun)',
    sinServicios: '(aucun)',
    sinTuneles: '(aucun)',
    gravedad: { error: 'erreur', aviso: 'avertissement', info: 'info' },
    estados: ESTADOS.fr,
  },
};

const DICCIONARIOS = { es, en, pt, fr } as const;

/**
 * Texto de un código de error del núcleo en ese idioma (el mismo diccionario de la interfaz).
 * Un código sin traducción sale como su código: nunca el texto crudo de otro lugar.
 */
export function textoDeCodigo(
  codigo: string,
  datos: Record<string, string | number> | undefined,
  idioma: Idioma,
): string {
  const t = DICCIONARIOS[idioma].errores;
  const codigos = t.codigos as Record<string, string | undefined>;
  const plantilla = Object.hasOwn(codigos, codigo) ? codigos[codigo] : undefined;
  if (!plantilla) return codigo;
  const detalles = t.detalles as Record<string, string | undefined>;
  return plantilla.replace(/\{(\w+)\}/g, (marca, k: string) => {
    const v = datos?.[k];
    if (v === undefined) return marca;
    const texto = String(v);
    return Object.hasOwn(detalles, texto) ? (detalles[texto] ?? texto) : texto;
  });
}
