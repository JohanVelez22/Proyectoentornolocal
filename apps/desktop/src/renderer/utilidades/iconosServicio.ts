import { CodeSlash, Construct, Globe, Mail, Server, Sparkles } from '@vicons/ionicons5';
import type { Component } from 'vue';
import { categoriaDe, type CategoriaUi } from '../stores/servicios';

/**
 * Icono de cada tipo de servicio (D54b C2): un único lugar para las tarjetas y los grupos de
 * Servicios. Cada tipo tiene el suyo: el servidor web (Nginx) es un globo y no comparte el de las
 * bases de datos. El tipado obliga a dar uno a cada categoría nueva.
 */
export const ICONOS_CATEGORIA: Record<CategoriaUi, Component> = {
  web: Globe,
  php: CodeSlash,
  bd: Server,
  correo: Mail,
  ia: Sparkles,
  herramientas: Construct,
};

export function iconoDeServicio(s: {
  id: string;
  categoria?: Parameters<typeof categoriaDe>[0]['categoria'];
}): Component {
  return ICONOS_CATEGORIA[categoriaDe(s)];
}
