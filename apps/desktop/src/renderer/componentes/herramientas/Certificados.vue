<script setup lang="ts">
import { NAlert, NButton, NInput } from 'naive-ui';
import { computed, ref } from 'vue';
import type { CertificadoGuardado } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { validarDominios } from '../../utilidades/herramientas';

const t = textos.herramientas.certificados;
const { ejecutar, ocupado } = useAccion();

const texto = ref('');
const guardado = ref<CertificadoGuardado | null>(null);
const validacion = computed(() => validarDominios(texto.value));
const tocado = ref(false);

const nombreSugerido = computed(() => {
  const primero = validacion.value.dominios[0] ?? 'certificado';
  return `${primero.replace(/^\*\./, 'comodin.').replace(/[^a-z0-9.-]/gi, '_')}.crt`;
});

async function emitir(): Promise<void> {
  tocado.value = true;
  const { dominios, error } = validacion.value;
  if (error) return;
  const destino = await ejecutar('guardar', () =>
    api().sistema.guardarArchivo(nombreSugerido.value),
  );
  if (!destino) return;
  const r = await ejecutar(
    'emitir',
    () => api().herramientas.emitirCertificado([...dominios], destino),
    {
      exito: t.guardado,
    },
  );
  if (r) guardado.value = r;
}

function abrirCarpeta(): void {
  const ruta = guardado.value?.certificado;
  if (ruta)
    void ejecutar('carpeta', () => api().sistema.abrirCarpeta(ruta.replace(/[\\/][^\\/]*$/, '')));
}
</script>

<template>
  <div class="herr">
    <NAlert type="info" :show-icon="false">{{ t.explicacion }}</NAlert>
    <div>
      <div class="herr-etiqueta">{{ t.dominios }}</div>
      <NInput
        v-model:value="texto"
        type="textarea"
        class="herr-mono"
        :autosize="{ minRows: 3, maxRows: 8 }"
        :placeholder="t.ejemplo"
      />
      <p v-if="tocado && validacion.error" class="herr-error">{{ validacion.error }}</p>
    </div>
    <div class="herr-fila">
      <NButton type="primary" :loading="ocupado('guardar') || ocupado('emitir')" @click="emitir">{{
        t.emitir
      }}</NButton>
    </div>
    <template v-if="guardado">
      <dl class="herr-datos">
        <dt>{{ t.certificado }}</dt>
        <dd>{{ guardado.certificado }}</dd>
        <dt>{{ t.clave }}</dt>
        <dd>{{ guardado.clave }}</dd>
      </dl>
      <div>
        <NButton secondary @click="abrirCarpeta">{{ textos.acciones.abrirCarpeta }}</NButton>
      </div>
    </template>
  </div>
</template>
