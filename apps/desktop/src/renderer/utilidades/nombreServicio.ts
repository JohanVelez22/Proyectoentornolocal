import { textos } from '../i18n';

/**
 * El núcleo nombra los servicios externos «MySQL (externo)» en español; en pantalla el sufijo
 * sale en el idioma elegido («MySQL (external)», «MySQL (externe)»…).
 */
export function nombreServicio(nombre: string): string {
  const m = /^(.*) \(externo\)$/.exec(nombre);
  return m ? `${m[1]} (${textos.estado.externo.toLowerCase()})` : nombre;
}

const NOMBRES_CONOCIDOS: Record<string, string> = {
  nginx: 'Nginx',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  postgresql: 'PostgreSQL',
  redis: 'Redis',
  mongodb: 'MongoDB',
  mailpit: 'Mailpit',
  ollama: 'Ollama',
  meilisearch: 'Meilisearch',
  ftp: 'FTP',
};

/**
 * Nombre visible de un servicio a partir de su identificador (D54c): «nginx» → «Nginx»,
 * «mysql» → «MySQL», «php-8.4» → «PHP 8.4». Si ya viene escrito con mayúsculas se deja igual.
 */
export function nombreVisibleDeId(id: string): string {
  const conocido = NOMBRES_CONOCIDOS[id];
  if (conocido) return conocido;
  const php = /^php-(\d+(?:\.\d+)*)$/.exec(id);
  if (php) return `PHP ${php[1]}`;
  return id === id.toLowerCase() && /^[a-z]/.test(id) ? id[0]!.toUpperCase() + id.slice(1) : id;
}
