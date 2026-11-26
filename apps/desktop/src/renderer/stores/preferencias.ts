import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CambiosPreferenciasUi, PreferenciasUi } from '@pel/core';
import { api } from '../api';
import { cambiarIdioma, idioma, type Idioma } from '../i18n';

export type TemaUi = PreferenciasUi['tema'];

/** ¿Se pinta oscuro? 'sistema' sigue al de Windows (`prefers-color-scheme`). */
export function esOscuro(tema: TemaUi, sistemaOscuro: boolean): boolean {
  return tema === 'sistema' ? sistemaOscuro : tema === 'oscuro';
}

/**
 * Tema, idioma, acento y asistente de primer uso. Los cambios se aplican al instante (en caliente)
 * y se guardan en `config.json` → `ui`; si guardar falla, se vuelve al valor anterior.
 */
export const usePreferencias = defineStore('preferencias', () => {
  const tema = ref<TemaUi>('sistema');
  const acento = ref<string | null>(null);
  const asistenteVisto = ref(true);
  /** Ya se avisó del costo de abrir un agente (se muestra una sola vez). */
  const avisoCostoAgentes = ref(false);
  /** Muestra las secciones avanzadas de la barra lateral (Contenedores). */
  const seccionesAvanzadas = ref(false);
  const cargado = ref(false);

  function aplicar(p: PreferenciasUi): void {
    tema.value = p.tema;
    acento.value = p.acento;
    asistenteVisto.value = p.asistenteVisto;
    avisoCostoAgentes.value = p.avisoCostoAgentes;
    seccionesAvanzadas.value = p.seccionesAvanzadas === true;
    if (p.idioma) cambiarIdioma(p.idioma);
  }

  async function cargar(): Promise<void> {
    try {
      aplicar(await api().preferencias.leer());
    } finally {
      cargado.value = true;
    }
  }

  async function guardar(cambios: CambiosPreferenciasUi): Promise<void> {
    const previo: PreferenciasUi = {
      tema: tema.value,
      idioma: idioma.value,
      acento: acento.value,
      asistenteVisto: asistenteVisto.value,
      avisoCostoAgentes: avisoCostoAgentes.value,
      seccionesAvanzadas: seccionesAvanzadas.value,
    };
    aplicar({ ...previo, ...cambios });
    try {
      aplicar(await api().preferencias.guardar({ ...cambios }));
    } catch (e) {
      aplicar(previo);
      throw e;
    }
  }

  return {
    tema,
    idioma: computed<Idioma>(() => idioma.value),
    acento,
    asistenteVisto,
    avisoCostoAgentes,
    seccionesAvanzadas,
    cargado,
    cargar,
    guardar,
    cambiarTema: (t: TemaUi) => guardar({ tema: t }),
    cambiarIdioma: (i: Idioma) => guardar({ idioma: i }),
    cambiarAcento: (a: string | null) => guardar({ acento: a }),
    marcarAsistenteVisto: () => guardar({ asistenteVisto: true }),
    cambiarSeccionesAvanzadas: (v: boolean) => guardar({ seccionesAvanzadas: v }),
    marcarAvisoCostoAgentes: () => guardar({ avisoCostoAgentes: true }),
  };
});
