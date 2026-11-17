/** Todos los textos visibles de la interfaz. Nada en español va escrito directo en los componentes. */

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

export const es = {
  app: {
    nombre: 'Entorno Local',
    lema: 'PHP y Nginx sin complicaciones',
    version: 'Versión',
  },
  nav: {
    inicio: 'Inicio',
    sitios: 'Sitios',
    servicios: 'Servicios',
    tuneles: 'Túneles',
    ajustes: 'Ajustes',
    contraer: 'Contraer menú',
    expandir: 'Expandir menú',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'servicio encendido', 'servicios encendidos'),
    tuneles: (n: number) => plural(n, 'túnel activo', 'túneles activos'),
    cargando: 'Conectando con el núcleo…',
  },
  estado: {
    encendido: 'Encendido',
    apagado: 'Apagado',
    iniciando: 'Iniciando…',
    error: 'Error',
    externo: 'Externo',
    activo: 'Activo',
  },
  acciones: {
    encender: 'Encender',
    apagar: 'Apagar',
    iniciarTodo: 'Iniciar todo',
    detenerTodo: 'Detener todo',
    abrir: 'Abrir',
    copiar: 'Copiar',
    copiado: 'Copiado al portapapeles',
    guardar: 'Guardar',
    cerrar: 'Cerrar',
    abrirCarpeta: 'Abrir carpeta',
    instalar: 'Instalar',
    reintentar: 'Reintentar',
  },
  errores: {
    titulo: 'No se pudo completar la acción',
    arranque: 'No se pudo leer el estado del entorno',
    desconocido: 'Ocurrió un error inesperado.',
  },
  inicio: {
    titulo: 'Inicio',
    bienvenida: 'Su entorno de desarrollo, de un vistazo.',
    tiles: {
      servicios: 'Servicios encendidos',
      serviciosDe: (total: number) => `de ${total}`,
      sitios: 'Sitios',
      tuneles: 'Túneles activos',
      hosts: 'Hosts pendientes',
      hostsOk: 'Todo en orden',
      hostsFaltan: 'Requiere atención',
    },
    hosts: {
      titulo: 'Hay dominios sin registrar en el archivo hosts',
      texto:
        'Estos dominios todavía no apuntan a su equipo. Al corregirlo, Windows pedirá permiso de administrador.',
      corregir: 'Corregir hosts',
      corregido: 'Archivo hosts actualizado',
      fallo: 'No se pudo actualizar el archivo hosts',
      verInstrucciones: 'Ver instrucciones',
      duplicados:
        'Estos dominios ya están en hosts fuera del bloque de Entorno Local (se conservan):',
      motivos: {
        cancelado: 'Se canceló el permiso de administrador. El archivo hosts quedó igual.',
        denegado:
          'Windows no permitió escribir el archivo hosts. Es posible que un antivirus lo bloquee.',
      } as Record<string, string>,
      modalTitulo: 'Corregir hosts manualmente',
      modalTexto:
        'Abra PowerShell como administrador (clic derecho en Inicio → Terminal (administrador)), pegue este comando y presione Enter.',
    },
    servicios: {
      titulo: 'Servicios',
      ver: 'Ver servicios',
      vacio: 'Todavía no hay servicios instalados.',
    },
    tuneles: {
      titulo: 'Túneles activos',
      vacio: 'No hay túneles abiertos. Puede abrir uno desde Sitios.',
      sitioDesconocido: 'Sitio sin nombre',
    },
  },
  servicios: {
    titulo: 'Servicios',
    descripcion: 'Encienda y apague Nginx y PHP. El estado se actualiza solo.',
    puertos: 'Puertos',
    pid: 'PID',
    sinVersion: 'sin versión',
    sinPuertos: '—',
    externo: 'Administrado fuera de Entorno Local',
    verDetalle: 'Ver detalle del error',
    vacioTitulo: 'Aún no hay servicios',
    vacio: 'Instale Nginx y una versión de PHP para empezar.',
    irAInstalar: 'Ir a instalar',
  },
  instalar: {
    titulo: 'Instalar',
    descripcion:
      'Descargue versiones oficiales. Cada archivo se verifica con su huella SHA-256 antes de usarse.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Servidor web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Túneles públicos (Cloudflare)' },
    },
    instalados: 'Instalado',
    ninguno: 'Ninguna versión instalada',
    elegir: 'Elija una versión',
    buscando: 'Buscando versiones…',
    sinVersiones: 'No se encontraron versiones',
    rama: (rama: string) => `rama ${rama}`,
    yaInstalada: 'ya instalada',
    fases: {
      descargando: 'Descargando',
      verificando: 'Verificando SHA-256',
      extrayendo: 'Extrayendo',
      listo: 'Instalado',
      error: 'Falló la instalación',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} instalado`,
  },
  sitios: {
    titulo: 'Sitios',
    pronto: 'Aquí podrá crear y administrar sus sitios .test.',
  },
  tuneles: {
    titulo: 'Túneles',
    pronto: 'Aquí podrá compartir sus sitios con una URL pública temporal.',
  },
  ajustes: {
    titulo: 'Ajustes',
    descripcion: 'Preferencias del entorno.',
    general: 'General',
    carpetaDatos: 'Carpeta de datos',
    carpetaDatosAyuda: 'Binarios, configuración y registros. Se puede abrir, no cambiar.',
    servicios: 'Servicios',
    puertoNginx: 'Puerto de Nginx',
    puertoNginxAyuda: 'Normalmente 80. Si lo cambia, las URL locales llevarán el puerto.',
    trabajadores: 'Trabajadores PHP',
    trabajadoresAyuda:
      'Procesos php-cgi por versión. Más trabajadores atienden más peticiones a la vez.',
    nota: 'Los cambios se aplican al reiniciar los servicios.',
    guardado: 'Ajustes guardados. Reinicie los servicios para aplicarlos.',
    acerca: 'Acerca de',
    versionPrograma: 'Versión del programa',
  },
};

export type Textos = typeof es;
