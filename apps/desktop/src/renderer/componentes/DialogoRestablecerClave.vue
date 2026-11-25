<script setup lang="ts">
import { NButton, NCheckbox, NInput, NModal, NSkeleton } from 'naive-ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { VistaPreviaRestablecer } from '@pel/core';
import type { ObjetivoSqlIpc, SeleccionAuditoria } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { generarContrasena } from '../utilidades/herramientas';
import MedidorClave from './herramientas/MedidorClave.vue';

/**
 * Restablecer la contraseña de UNA cuenta (nunca recuperarla): vista previa de la sentencia sin
 * los valores, contraseña nueva escrita o generada, confirmación escribiendo el usuario y
 * resultado. El núcleo toma antes una instantánea de la base y guarda una copia de la fila. La
 * contraseña nueva solo vive en este diálogo y se borra al cerrarlo.
 */
const props = defineProps<{
  objetivo: ObjetivoSqlIpc;
  base: string;
  seleccion: SeleccionAuditoria;
  usuario: string;
}>();
const mostrar = defineModel<boolean>('show', { required: true });
const emit = defineEmits<{ hecho: [] }>();

const t = textos.herramientas.contrasenas.restablecer;
const { ejecutar } = useAccion();

const previa = ref<VistaPreviaRestablecer | null>(null);
const cargando = ref(false);
const clave = ref('');
const verClave = ref(false);
const escrito = ref('');
const aBcrypt = ref(false);
const reales = ref(false);
const trabajando = ref(false);
const hecho = ref<{
  copiaFila: string;
  copiaRestringida: boolean;
  instantanea: string;
} | null>(null);

const esLegado = computed(
  () => previa.value?.formato === 'md5' || previa.value?.formato === 'sha1',
);
const cambiaFormato = computed(() => esLegado.value && aBcrypt.value);
const datosReales = computed(() => previa.value?.datosReales === true);
const valido = computed(
  () =>
    !!previa.value &&
    clave.value !== '' &&
    escrito.value === props.usuario &&
    (!datosReales.value || reales.value) &&
    !trabajando.value,
);

function limpiar(): void {
  clave.value = '';
  escrito.value = '';
  verClave.value = false;
  aBcrypt.value = false;
  reales.value = false;
}

watch(mostrar, async (v) => {
  if (!v) {
    limpiar();
    return;
  }
  previa.value = null;
  hecho.value = null;
  limpiar();
  cargando.value = true;
  const p = await ejecutar('vista-previa', () =>
    api().auditoriaClaves.vistaPrevia(props.objetivo, props.base, props.seleccion, props.usuario),
  );
  cargando.value = false;
  if (p) previa.value = p;
  else mostrar.value = false;
});

// La contraseña nunca queda en memoria de la interfaz al salir.
onBeforeUnmount(limpiar);

function generar(): void {
  clave.value = generarContrasena(20, {
    mayusculas: true,
    minusculas: true,
    numeros: true,
    simbolos: true,
  });
  verClave.value = true;
}

async function restablecer(): Promise<void> {
  if (!valido.value) return;
  trabajando.value = true;
  const r = await ejecutar(
    'restablecer',
    () =>
      api().auditoriaClaves.restablecer(
        props.objetivo,
        props.base,
        props.seleccion,
        props.usuario,
        clave.value,
        escrito.value,
        esLegado.value && aBcrypt.value ? true : undefined,
        datosReales.value && reales.value ? true : undefined,
      ),
    { exito: t.hecho },
  );
  trabajando.value = false;
  if (!r) return;
  hecho.value = r;
  // La clave se queda visible solo si se generó (para anotarla); al cerrar se borra.
  emit('hecho');
}
</script>

<template>
  <NModal
    v-model:show="mostrar"
    preset="card"
    :title="t.titulo(usuario)"
    size="small"
    :bordered="false"
    :mask-closable="!trabajando"
    :close-on-esc="!trabajando"
    :style="{ width: '600px', maxWidth: 'calc(100vw - 32px)' }"
  >
    <div v-if="cargando" class="cargando" role="status">
      <NSkeleton text :repeat="3" />
      <span class="oculto">{{ t.cargando }}</span>
    </div>

    <div v-else-if="previa && !hecho" class="cuerpo">
      <p class="ayuda">{{ t.ayuda }}</p>

      <div class="bloque">
        <span class="etiqueta">{{ t.sentencia }}</span>
        <code class="sentencia">{{ previa.sentencia }}</code>
        <span class="nota">{{ t.formatoActual(previa.formato) }}</span>
      </div>

      <template v-if="esLegado">
        <p class="aviso">{{ t.avisoLegado }}</p>
        <NCheckbox v-model:checked="aBcrypt">{{ t.aBcrypt }}</NCheckbox>
        <p v-if="cambiaFormato" class="aviso">{{ t.cambiaFormato }}</p>
      </template>

      <div v-if="datosReales" class="reales" role="alert">
        <strong>{{ t.datosReales.titulo }}</strong>
        <p>{{ t.datosReales.texto }}</p>
        <NCheckbox v-model:checked="reales">{{ t.datosReales.casilla }}</NCheckbox>
      </div>

      <div class="bloque">
        <label class="etiqueta" for="clave-nueva-auditoria">{{ t.nueva }}</label>
        <div class="fila">
          <NInput
            id="clave-nueva-auditoria"
            v-model:value="clave"
            :type="verClave ? 'text' : 'password'"
            :maxlength="1024"
            autocomplete="new-password"
            :input-props="{ spellcheck: false, autocapitalize: 'off', autocorrect: 'off' }"
          />
          <NButton secondary @click="verClave = !verClave">{{
            verClave ? t.ocultar : t.mostrar
          }}</NButton>
          <NButton secondary @click="generar">{{ t.generar }}</NButton>
        </div>
        <MedidorClave :clave="clave" :avisos="false" />
        <span v-if="clave" class="nota">{{ t.anotar }}</span>
      </div>

      <div class="bloque">
        <label class="etiqueta" for="usuario-confirmar-auditoria">{{
          t.escribaUsuario(usuario)
        }}</label>
        <NInput
          id="usuario-confirmar-auditoria"
          v-model:value="escrito"
          :input-props="{ spellcheck: false, autocomplete: 'off' }"
        />
      </div>

      <div class="acciones">
        <NButton :disabled="trabajando" @click="mostrar = false">{{ t.cancelar }}</NButton>
        <NButton type="error" :disabled="!valido" :loading="trabajando" @click="restablecer">{{
          t.confirmar
        }}</NButton>
      </div>
    </div>

    <div v-else-if="hecho" class="cuerpo">
      <p class="exito">{{ t.hecho }}</p>
      <div class="bloque">
        <span class="etiqueta">{{ t.copiaFila }}</span>
        <code class="sentencia">{{ hecho.copiaFila }}</code>
        <p v-if="!hecho.copiaRestringida" class="aviso">{{ t.copiaSinRestringir }}</p>
      </div>
      <div class="bloque">
        <span class="etiqueta">{{ t.instantanea }} {{ hecho.instantanea }}</span>
        <span class="nota">{{ t.instantaneaAyuda }}</span>
      </div>
      <div v-if="clave" class="bloque">
        <label class="etiqueta" for="clave-hecha-auditoria">{{ t.nueva }}</label>
        <div class="fila">
          <NInput
            id="clave-hecha-auditoria"
            :value="clave"
            readonly
            :type="verClave ? 'text' : 'password'"
          />
          <NButton secondary @click="verClave = !verClave">{{
            verClave ? t.ocultar : t.mostrar
          }}</NButton>
        </div>
        <span class="nota">{{ t.anotar }}</span>
      </div>
      <div class="acciones">
        <NButton type="primary" @click="mostrar = false">{{ t.cerrar }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.cuerpo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ayuda,
.exito {
  margin: 0;
}
.exito {
  font-weight: 600;
  color: #16a34a;
}
.bloque {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.etiqueta {
  font-size: 13px;
  font-weight: 600;
}
.nota {
  font-size: 12px;
  opacity: 0.7;
}
.sentencia {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.12);
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
.fila {
  display: flex;
  gap: 8px;
}
.aviso {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--texto-aviso);
  background: rgba(234, 179, 8, 0.12);
}
.reales {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.5);
  background: rgba(220, 38, 38, 0.08);
}
.reales p {
  margin: 0;
  font-size: 12.5px;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
