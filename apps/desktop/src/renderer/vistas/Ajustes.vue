<script setup lang="ts">
import { FolderOpen, InformationCircle } from '@vicons/ionicons5';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputGroup,
  NInputNumber,
  NSkeleton,
  useMessage,
  useNotification,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { Config } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { es } from '../i18n/es';

const t = es.ajustes;
const { ejecutar, ocupado } = useAccion();
const message = useMessage();
const notification = useNotification();

const config = ref<Config | null>(null);
const carpeta = ref('');
const version = ref('');
const puerto = ref<number | null>(80);
const trabajadores = ref<number | null>(2);

const cambiado = computed(
  () =>
    !!config.value &&
    (puerto.value !== config.value.servicios.nginx.puerto ||
      trabajadores.value !== config.value.servicios.php.trabajadores),
);
const valido = computed(
  () =>
    puerto.value !== null &&
    puerto.value >= 1 &&
    puerto.value <= 65535 &&
    trabajadores.value !== null &&
    trabajadores.value >= 1 &&
    trabajadores.value <= 8,
);

onMounted(() => {
  void ejecutar('cargar', async () => {
    const [c, ruta, v] = await Promise.all([
      api().config.leer(),
      api().carpetaDatos(),
      api().sistema.version(),
    ]);
    config.value = c;
    carpeta.value = ruta;
    version.value = v;
    puerto.value = c.servicios.nginx.puerto;
    trabajadores.value = c.servicios.php.trabajadores;
  });
});

async function guardar(): Promise<void> {
  if (!config.value || !valido.value) return;
  // Solo viajan puerto y trabajadores: el núcleo los guarda en su cola y los aplica.
  const r = await ejecutar('guardar', async () => {
    const res = await api().ajustes.guardar({
      puerto: puerto.value ?? 80,
      trabajadores: trabajadores.value ?? 2,
    });
    return { res, config: await api().config.leer() };
  });
  if (!r) return;
  config.value = r.config;
  const fallos = [
    ...(r.res.aplicar.nginx.ok ? [] : [r.res.aplicar.nginx.salida]),
    ...r.res.errores,
  ];
  if (fallos.length) {
    notification.warning({
      title: t.errorAplicar,
      content: fallos.join('\n'),
      duration: 10000,
      keepAliveOnHover: true,
    });
  } else {
    message.success(t.guardado(r.res.reiniciados));
  }
}

function abrirCarpeta(): void {
  void ejecutar('abrir', () => api().sistema.abrirCarpeta(carpeta.value));
}
</script>

<template>
  <div class="ajustes">
    <p class="descripcion">{{ t.descripcion }}</p>

    <NCard :title="t.general" size="small" class="tarjeta">
      <NForm label-placement="top" :show-feedback="false">
        <NFormItem :label="t.carpetaDatos">
          <div class="campo">
            <NSkeleton v-if="!carpeta" text :height="34" />
            <NInputGroup v-else>
              <NInput :value="carpeta" readonly class="ruta" />
              <NButton secondary :loading="ocupado('abrir')" @click="abrirCarpeta">
                <template #icon
                  ><NIcon><FolderOpen /></NIcon
                ></template>
                {{ es.acciones.abrirCarpeta }}
              </NButton>
            </NInputGroup>
            <small class="ayuda">{{ t.carpetaDatosAyuda }}</small>
          </div>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :title="t.servicios" size="small" class="tarjeta">
      <NForm label-placement="top" :show-feedback="false" :disabled="!config">
        <div class="dos">
          <NFormItem :label="t.puertoNginx">
            <div class="campo">
              <NInputNumber v-model:value="puerto" :min="1" :max="65535" />
              <small class="ayuda">{{ t.puertoNginxAyuda }}</small>
            </div>
          </NFormItem>
          <NFormItem :label="t.trabajadores">
            <div class="campo">
              <NInputNumber v-model:value="trabajadores" :min="1" :max="8" />
              <small class="ayuda">{{ t.trabajadoresAyuda }}</small>
            </div>
          </NFormItem>
        </div>
      </NForm>
      <template #action>
        <div class="pie">
          <span class="nota">
            <NIcon :size="16"><InformationCircle /></NIcon>
            {{ t.nota }}
          </span>
          <NButton
            type="primary"
            size="small"
            :disabled="!cambiado || !valido"
            :loading="ocupado('guardar')"
            @click="guardar"
          >
            {{ es.acciones.guardar }}
          </NButton>
        </div>
      </template>
    </NCard>

    <NCard :title="t.acerca" size="small" class="tarjeta">
      <dl class="acerca">
        <dt>{{ es.app.nombre }}</dt>
        <dd>
          {{ t.versionPrograma }} <code>{{ version || '…' }}</code>
        </dd>
      </dl>
    </NCard>
  </div>
</template>

<style scoped>
.descripcion {
  margin: 0 0 18px;
  opacity: 0.65;
}
.tarjeta {
  border-radius: 12px;
  margin-bottom: 14px;
  max-width: 760px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.ruta :deep(input) {
  font-family: var(--fuente-mono);
  font-size: 12.5px;
}
.ayuda {
  font-size: 12px;
  opacity: 0.6;
}
.dos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.nota {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  opacity: 0.75;
}
.acerca {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
}
.acerca dt {
  font-weight: 600;
}
.acerca dd {
  margin: 0;
  opacity: 0.75;
}
.acerca code {
  font-family: var(--fuente-mono);
}
</style>
