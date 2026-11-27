/**
 * Cómo se agrupa la pantalla Herramientas (D38a): 5 secciones de tarjetas, y tres tarjetas que
 * reúnen varias herramientas en pestañas. Los ids de las herramientas (`textos.herramientas.lista`)
 * no cambian: la paleta, `solicitudes.herramienta`, `abrirEnEditor` y los enlaces de Inicio siguen
 * pidiendo `diff`, `diffCarpetas`, `qrWifi`, `guiaHttp` o `guiaTuneles` y abren la tarjeta
 * unificada en la pestaña correcta (`resolverHerramienta`).
 */

export const SECCIONES_HERRAMIENTAS = [
  'codigo',
  'red',
  'seguridad',
  'archivos',
  'sistema',
] as const;
export type SeccionHerramientas = (typeof SECCIONES_HERRAMIENTAS)[number];

/** Pestañas de las tarjetas unificadas: la primera es la que se abre por defecto. */
export const PESTANAS_TARJETA = {
  comparar: ['diff', 'diffCarpetas'],
  qr: ['qr', 'qrWifi'],
  // D50 agrega aquí `guiaGit` (la guía de Git): basta el id nuevo en esta lista, su componente y
  // su texto en `herramientas.lista`; no hace falta tocar nada más.
  guias: ['guiaHttp', 'guiaTuneles'],
} as const;
export type TarjetaConPestanas = keyof typeof PESTANAS_TARJETA;

/**
 * Tarjetas de cada sección, en orden. Un id de tarjeta es el de su herramienta, salvo `comparar`
 * y `guias`, que son tarjetas nuevas con pestañas (`qr` conserva su id).
 *
 * Ubicación: lo que un desarrollador PHP/Laravel busca primero va arriba de cada sección. `tiempo`
 * (timestamps y zonas horarias) va en Sistema junto a la limpieza de disco.
 */
export const TARJETAS_POR_SECCION: Record<SeccionHerramientas, readonly string[]> = {
  codigo: ['editor', 'buscar', 'comparar', 'regex', 'json', 'markdown'],
  red: ['clienteHttp', 'puertos', 'websocket', 'certificados', 'guias'],
  seguridad: ['contrasenas', 'cripto', 'entorno'],
  archivos: [
    'imagenes',
    'comprimir',
    'conversor',
    'infoArchivo',
    'bom',
    'qr',
    'captura',
    'grabarPantalla',
  ],
  sistema: ['limpiezaDisco', 'tiempo'],
};

/** Todas las tarjetas en el orden en que se ven. */
export const TARJETAS: readonly string[] = SECCIONES_HERRAMIENTAS.flatMap(
  (s) => TARJETAS_POR_SECCION[s],
);

/** Pestañas de una tarjeta, o `[]` si es una herramienta sola. */
export function pestanasDe(tarjeta: string): readonly string[] {
  return tarjeta in PESTANAS_TARJETA ? PESTANAS_TARJETA[tarjeta as TarjetaConPestanas] : [];
}

/** Tarjeta y pestaña a las que lleva un id de herramienta (vacío si el id no existe). */
export interface DestinoHerramienta {
  tarjeta: string;
  /** Herramienta que se muestra dentro de la tarjeta (la misma tarjeta si no tiene pestañas). */
  herramienta: string;
}

/**
 * Resuelve un id pedido desde la paleta, `solicitudes`, `abrirEnEditor` o Inicio:
 * - el id de una tarjeta (`comparar`, `qr`, `puertos`…) → su primera pestaña;
 * - el id de una herramienta que ahora vive en una pestaña (`diffCarpetas`, `qrWifi`, `guiaHttp`…)
 *   → su tarjeta, en esa pestaña;
 * - cualquier otro id → null.
 */
export function resolverHerramienta(id: string): DestinoHerramienta | null {
  for (const [tarjeta, pestanas] of Object.entries(PESTANAS_TARJETA)) {
    if (id === tarjeta) return { tarjeta, herramienta: pestanas[0] };
    if ((pestanas as readonly string[]).includes(id)) return { tarjeta, herramienta: id };
  }
  return TARJETAS.includes(id) ? { tarjeta: id, herramienta: id } : null;
}

/** Herramientas que necesitan el panel ancho (dos columnas o tablas). */
export const HERRAMIENTAS_ANCHAS: readonly string[] = [
  'diff',
  'diffCarpetas',
  'puertos',
  'regex',
  'json',
  'markdown',
  'buscar',
  'contrasenas',
  'limpiezaDisco',
  'guiaTuneles',
  'guiaHttp',
  'clienteHttp',
  'editor',
];
