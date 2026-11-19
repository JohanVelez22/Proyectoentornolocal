<script setup lang="ts">
import { Copy, Eye, EyeOff } from '@vicons/ionicons5';
import {
  NButton,
  NFormItem,
  NIcon,
  NModal,
  NSelect,
  NSkeleton,
  NTooltip,
  useMessage,
} from 'naive-ui';
import { computed, ref, watch } from 'vue';
import type { DatosConexion, MotorBd } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useSitios } from '../stores/sitios';

/** Datos de conexión de una base y su bloque .env. La clave solo vive mientras está abierto. */
const props = defineProps<{ motor: MotorBd; base: string }>();
const mostrar = defineModel<boolean>('show', { required: true });

/** Valor del selector cuando no se elige un sitio. */
const GENERICO = '';

const t = textos.bd.dialogoConexion;
const message = useMessage();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const datos = ref<DatosConexion | null>(null);
const bloque = ref('');
const verClave = ref(false);
/** Id del sitio cuyo .env se toma como referencia, o GENERICO. */
const sitioId = ref<string>(GENERICO);

/** MongoDB solo tiene MONGODB_URI: no depende del proyecto. */
const conSitios = computed(() => props.motor !== 'mongodb' && sitios.lista.length > 0);
const opcionesSitio = computed(() => [
  ...[...sitios.lista]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((s) => ({
      label: `${s.nombre} · ${textos.sitios.tipos[s.tipo] ?? s.tipo}`,
      value: s.id,
    })),
  { label: t.generico, value: GENERICO },
]);

const filas = computed(() => {
  const d = datos.value;
  if (!d) return [];
  const f: { clave: string; etiqueta: string; valor: string; secreto?: boolean }[] = [
    { clave: 'host', etiqueta: t.host, valor: d.host },
    { clave: 'puerto', etiqueta: t.puerto, valor: String(d.puerto) },
  ];
  if (d.usuario) f.push({ clave: 'usuario', etiqueta: t.usuario, valor: d.usuario });
  if (d.clave !== null)
    f.push({ clave: 'clave', etiqueta: t.clave, valor: d.clave, secreto: true });
  f.push({ clave: 'base', etiqueta: t.base, valor: props.base });
  return f;
});

function olvidar(): void {
  datos.value = null;
  bloque.value = '';
  verClave.value = false;
}

async function cargarBloque(): Promise<void> {
  const id = sitioId.value;
  const b = await ejecutar('bloque', () =>
    id === GENERICO
      ? api().bd.bloqueEnv(props.motor, props.base, 'generico')
      : api().bd.bloqueEnvSitio(id, props.motor, props.base),
  );
  // Si se cambió de sitio mientras tanto, este bloque ya no vale.
  if (id !== sitioId.value) return;
  if (b !== undefined && mostrar.value) bloque.value = b;
}

watch(mostrar, async (v) => {
  olvidar();
  if (!v) return;
  sitioId.value = GENERICO;
  const d = await ejecutar('datos', () => api().bd.conexion(props.motor));
  if (!mostrar.value) return;
  datos.value = d ?? null;
  if (d) await cargarBloque();
});

watch(sitioId, () => {
  if (mostrar.value && datos.value) void cargarBloque();
});

function copiar(texto: string): void {
  void ejecutar('copiar', async () => {
    await api().sistema.copiar(texto);
    message.success(textos.acciones.copiado);
  });
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(base)"
    size="small"
    :bordered="false"
    :style="{ width: '540px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <div v-if="ocupado('datos')" aria-busy="true" :aria-label="t.cargando">
      <NSkeleton text :repeat="4" />
    </div>
    <template v-else-if="datos">
      <dl class="datos">
        <div v-for="f in filas" :key="f.clave" class="dato">
          <dt>{{ f.etiqueta }}</dt>
          <dd>
            <code>{{ f.secreto && !verClave ? '••••••••••••' : f.valor }}</code>
            <NTooltip v-if="f.secreto">
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="verClave ? t.ocultar : t.mostrar"
                  @click="verClave = !verClave"
                >
                  <template #icon>
                    <NIcon><EyeOff v-if="verClave" /><Eye v-else /></NIcon>
                  </template>
                </NButton>
              </template>
              {{ verClave ? t.ocultar : t.mostrar }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="t.copiarDato(f.etiqueta.toLowerCase())"
                  @click="copiar(f.valor)"
                >
                  <template #icon
                    ><NIcon><Copy /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.copiarDato(f.etiqueta.toLowerCase()) }}
            </NTooltip>
          </dd>
        </div>
        <div v-if="datos.clave === null" class="dato">
          <dt>{{ t.clave }}</dt>
          <dd class="tenue">{{ t.sinClave }}</dd>
        </div>
      </dl>

      <NFormItem v-if="conSitios" :label="t.sitio" :feedback="t.sitioAyuda" class="tipo">
        <NSelect
          v-model:value="sitioId"
          :options="opcionesSitio"
          size="small"
          :consistent-menu-width="false"
        />
      </NFormItem>

      <div class="env">
        <div class="env-cabeza">
          <span>{{ t.env }}</span>
          <NButton
            size="tiny"
            secondary
            :disabled="!bloque || ocupado('bloque')"
            @click="copiar(bloque)"
          >
            <template #icon
              ><NIcon><Copy /></NIcon
            ></template>
            {{ t.copiarEnv }}
          </NButton>
        </div>
        <pre class="bloque" :aria-busy="ocupado('bloque')">{{ bloque }}</pre>
        <small class="tenue">{{ t.envAyuda }}</small>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.datos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin: 0 0 16px;
}
.dato dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
}
.dato dd {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 2px 0 0;
  min-width: 0;
}
.dato code {
  font-family: var(--fuente-mono);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 4px;
}
.tipo {
  margin-bottom: 14px;
}
.env-cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}
.bloque {
  margin: 0 0 6px;
  min-height: 48px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
  font-family: var(--fuente-mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: text;
}
.tenue {
  font-size: 12px;
  opacity: 0.6;
}
</style>
