import type { PeticionHttp } from '@pel/core';
import { reactive } from 'vue';
import { api } from '../api';
import { abrirConPeticion } from './clienteHttp';

/**
 * Servidor de ejemplo de la guía HTTP (D49), visto desde la ventana. Arranca al pulsar «Probar»
 * (nunca al abrir la guía), escucha solo en 127.0.0.1 y se apaga al salir de la guía o del cliente
 * HTTP, o tras 10 min sin uso (lo decide el proceso principal). Nada se envía solo: solo se abre
 * el cliente con la petición ya rellena.
 */
export const servidorEjemplo = reactive({
  /** Puerto mientras el servidor está activo; null si no. */
  puerto: null as number | null,
  /** Hay un arranque en curso. */
  iniciando: false,
});

/** Arranca el servidor y abre el cliente con la petición que construye `crear(puerto)`. */
export async function probar(crear: (puerto: number) => Partial<PeticionHttp>): Promise<void> {
  if (servidorEjemplo.iniciando) return;
  servidorEjemplo.iniciando = true;
  try {
    const { puerto } = await api().ejemploHttp.iniciar();
    servidorEjemplo.puerto = puerto;
    retenerEjemplo('guia');
    abrirConPeticion(crear(puerto));
  } finally {
    servidorEjemplo.iniciando = false;
  }
}

/** Quién está usando el servidor: la guía (tras «Probar») y el cliente HTTP abierto. */
const usuarios = new Set<string>();
/** Margen para el relevo guía → cliente, que no ocurre en el mismo instante. */
const GRACIA_MS = 1500;

export function retenerEjemplo(quien: string): void {
  if (servidorEjemplo.puerto !== null) usuarios.add(quien);
}

/** Suelta el servidor; si nadie más lo usa tras un instante, se apaga. */
export function soltarEjemplo(quien: string): void {
  usuarios.delete(quien);
  if (servidorEjemplo.puerto === null) return;
  setTimeout(() => {
    if (usuarios.size === 0) void detenerEjemplo();
  }, GRACIA_MS);
}

/** Apaga el servidor (se puede repetir) y olvida el puerto. */
export async function detenerEjemplo(): Promise<void> {
  usuarios.clear();
  if (servidorEjemplo.puerto === null) return;
  servidorEjemplo.puerto = null;
  try {
    await api().ejemploHttp.detener();
  } catch {
    // ya estaba apagado o la ventana se cierra: no hay nada más que hacer
  }
}
