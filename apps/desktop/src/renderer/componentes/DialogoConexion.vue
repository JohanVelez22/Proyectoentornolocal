<script setup lang="ts">
import { Copy, Eye, EyeOff } from '@vicons/ionicons5';
import { NButton, NFormItem, NIcon, NModal, NSkeleton, NTooltip, useMessage } from 'naive-ui';
import Desplegable from './Desplegable.vue';
import { computed, ref, watch } from 'vue';
import type { DatosConexionVista, IdInstancia, MotorBd } from '../../shared/api';
import { api } from '../api';
import { useBd } from '../stores/bd';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useSitios } from '../stores/sitios';

/**
 * Datos de conexión de una base y su bloque .env. La clave NO llega con los datos: el diálogo
 * muestra una máscara y la pide aparte al pulsar «Mostrar» o «Copiar» (mismo modelo que
 * `env.revelar`). Una vez revelada solo vive mientras el diálogo está abierto y visible.
 */
const props = defineProps<{
  motor?: MotorBd;
  base?: string;
  /** Meilisearch (o una de sus instancias): host, puerto y master key, sin usuario ni base. */
  servicio?: 'meilisearch' | IdInstancia;
}>();
const mostrar = defineModel<boolean>('show', { required: true });
const bd = useBd();

/** Valor del selector cuando no se elige un sitio. */
const GENERICO = '';

const t = textos.bd.dialogoConexion;
const message = useMessage();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

const datos = ref<DatosConexionVista | null>(null);
/** Bloque .env con la clave enmascarada (el completo solo se pide al copiarlo). */
const bloque = ref('');
/** La clave, solo mientras el usuario la tiene a la vista; null = oculta (y no está en memoria). */
const claveVisible = ref<string | null>(null);
const verClave = computed(() => claveVisible.value !== null);
const MASCARA = '••••••••••••';
/** Id del sitio cuyo .env se toma como referencia, o GENERICO. */
const sitioId = ref<string>(GENERICO);

/** MongoDB solo tiene MONGODB_URI: no depende del proyecto. */
const conSitios = computed(
  () => props.servicio === undefined && props.motor !== 'mongodb' && sitios.lista.length > 0,
);
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
  if (d.tieneClave) {
    f.push({
      clave: 'clave',
      etiqueta: t.clave,
      valor: claveVisible.value ?? MASCARA,
      secreto: true,
    });
  }
  if (props.servicio === undefined)
    f.push({ clave: 'base', etiqueta: t.base, valor: props.base ?? '' });
  return f;
});

function olvidar(): void {
  datos.value = null;
  bloque.value = '';
  claveVisible.value = null;
}

/** Pide la clave al núcleo (un solo clic en «Mostrar» o «Copiar»); undefined si falló o no hay. */
async function pedirClave(): Promise<string | undefined> {
  const v = await ejecutar('revelar', () =>
    props.servicio !== undefined
      ? api().servicios.revelarSecreto(props.servicio)
      : api().bd.revelar(bd.objetivo(props.motor!)),
  );
  return v ?? undefined;
}

async function alternarClave(): Promise<void> {
  if (claveVisible.value !== null) {
    claveVisible.value = null;
    return;
  }
  const v = await pedirClave();
  // Si se cerró el diálogo mientras tanto, la clave no se guarda.
  if (v !== undefined && mostrar.value) claveVisible.value = v;
}

async function cargarBloque(): Promise<void> {
  if (props.servicio !== undefined || props.motor === undefined) return;
  const motor = props.motor;
  const base = props.base ?? '';
  const id = sitioId.value;
  const b = await ejecutar('bloque', () =>
    id === GENERICO
      ? api().bd.bloqueEnv(bd.objetivo(motor), base, 'generico')
      : api().bd.bloqueEnvSitio(id, bd.objetivo(motor), base),
  );
  // Si se cambió de sitio mientras tanto, este bloque ya no vale.
  if (id !== sitioId.value) return;
  if (b !== undefined && mostrar.value) bloque.value = b;
}

watch(mostrar, async (v) => {
  olvidar();
  if (!v) return;
  sitioId.value = GENERICO;
  const d = await ejecutar('datos', () =>
    props.servicio !== undefined
      ? api().servicios.conexion(props.servicio)
      : api().bd.conexion(bd.objetivo(props.motor!)),
  );
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

/** «Copiar» de la fila de la clave: la pide en ese momento (y no la deja a la vista). */
function copiarClave(): void {
  void ejecutar('copiar', async () => {
    const v = claveVisible.value ?? (await pedirClave());
    if (v === undefined) return;
    await api().sistema.copiar(v);
    message.success(textos.acciones.copiado);
  });
}

/** «Copiar .env»: el bloque completo (con la clave) se pide en ese momento. */
function copiarEnv(): void {
  if (props.motor === undefined) return;
  const motor = props.motor;
  const base = props.base ?? '';
  const id = sitioId.value;
  void ejecutar('copiar', async () => {
    const completo = await api().bd.revelarBloqueEnv(
      bd.objetivo(motor),
      base,
      id === GENERICO ? null : id,
    );
    await api().sistema.copiar(completo);
    message.success(textos.acciones.copiado);
  });
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="servicio !== undefined ? t.tituloServicio : t.titulo(base ?? '')"
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
            <code>{{ f.valor }}</code>
            <NTooltip v-if="f.secreto">
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  circle
                  :aria-label="verClave ? t.ocultar : t.mostrar"
                  @click="alternarClave"
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
                  @click="f.secreto ? copiarClave() : copiar(f.valor)"
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
        <div v-if="!datos.tieneClave" class="dato">
          <dt>{{ t.clave }}</dt>
          <dd class="tenue">{{ t.sinClave }}</dd>
        </div>
      </dl>

      <NFormItem v-if="conSitios" :label="t.sitio" :feedback="t.sitioAyuda" class="tipo">
        <Desplegable
          v-model:value="sitioId"
          :options="opcionesSitio"
          size="small"
          :consistent-menu-width="false"
        />
      </NFormItem>

      <p v-if="servicio !== undefined" class="nota-servicio" role="note">{{ t.notaMeilisearch }}</p>
      <div v-else class="env">
        <div class="env-cabeza">
          <span>{{ t.env }}</span>
          <NButton
            size="tiny"
            secondary
            :disabled="!bloque || ocupado('bloque')"
            @click="copiarEnv"
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
  opacity: 0.72;
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
.nota-servicio {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
}
.tenue {
  font-size: 12px;
  opacity: 0.72;
}
</style>
