<script setup lang="ts">
import { NAlert, NButton, NCheckbox, NInput, NModal } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useVersiones, type FilaVersion } from '../stores/versiones';

/**
 * Desinstala solo el binario de una versión. En un servicio de datos los datos quedan por
 * defecto; "Borrar también los datos" es una casilla aparte que exige escribir el id de la
 * instancia (y es otra llamada, después).
 */
const props = defineProps<{
  nombre: string;
  fila: FilaVersion;
  datos: boolean;
  /** Es la versión activa de un servicio con una sola encendida (Nginx, Mailpit, Ollama). */
  unica?: boolean;
}>();
const mostrar = defineModel<boolean>('show', { required: true });

const t = textos.versiones.dialogoDesinstalar;
const versiones = useVersiones();
const { ejecutar, ocupado } = useAccion();

const borrarDatos = ref(false);
const escrito = ref('');

watch(mostrar, (v) => {
  if (!v) return;
  borrarDatos.value = false;
  escrito.value = '';
});

const id = computed(() => props.fila.instancia);
const puede = computed(() => !borrarDatos.value || (!!id.value && escrito.value === id.value));

async function desinstalar(): Promise<void> {
  if (!puede.value) return;
  const ok = await ejecutar(
    'desinstalar',
    async () => {
      await versiones.desinstalar(props.fila);
      if (borrarDatos.value && id.value) await versiones.borrarDatos(id.value, escrito.value);
      return true;
    },
    { exito: t.hecho(`${props.nombre} ${props.fila.version}`) },
  );
  await versiones.cargar().catch(() => undefined);
  if (ok) mostrar.value = false;
}
</script>

<template>
  <NModal
    :show="mostrar"
    preset="card"
    :title="t.titulo(`${nombre} ${fila.version}`)"
    size="small"
    :bordered="false"
    :style="{ width: '520px', maxWidth: 'calc(100vw - 32px)' }"
    @update:show="(v: boolean) => (mostrar = v)"
  >
    <p class="texto">{{ t.binario }}</p>
    <template v-if="datos && id">
      <p class="texto">{{ t.instancia(id) }}</p>
      <NAlert v-if="fila.predeterminada" type="warning" :bordered="false" class="alerta">
        {{ t.predeterminada(id) }}
      </NAlert>
      <p class="texto">{{ t.datosQuedan }}</p>
      <NCheckbox v-model:checked="borrarDatos" class="casilla">{{ t.borrarDatos }}</NCheckbox>
      <template v-if="borrarDatos">
        <NAlert type="error" :bordered="false" class="alerta">{{ t.borrarAviso(id) }}</NAlert>
        <NInput
          v-model:value="escrito"
          size="small"
          class="confirmacion"
          :placeholder="id"
          :aria-label="t.escriba(id)"
        />
      </template>
    </template>
    <p v-else-if="datos" class="texto">{{ t.datosQuedan }}</p>
    <NAlert v-if="unica" type="warning" :bordered="false" class="alerta">{{ t.unica }}</NAlert>
    <template #footer>
      <div class="pie">
        <NButton size="small" :disabled="ocupado('desinstalar')" @click="mostrar = false">
          {{ textos.acciones.cancelar }}
        </NButton>
        <NButton
          size="small"
          :type="borrarDatos ? 'error' : 'primary'"
          :disabled="!puede"
          :loading="ocupado('desinstalar')"
          @click="desinstalar"
        >
          {{ borrarDatos ? t.desinstalarYBorrar : t.desinstalar }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.texto {
  margin: 0 0 10px;
  line-height: 1.5;
}
.casilla {
  margin-top: 4px;
}
.alerta {
  margin-top: 10px;
}
.confirmacion {
  margin-top: 8px;
}
.pie {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
