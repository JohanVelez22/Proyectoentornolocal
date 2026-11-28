<script setup lang="ts">
import { tokenTunelValido } from '@pel/core';
import { NButton, NInput } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { EstadoClaveIa } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';

/**
 * Paso guiado «Conectar su cuenta de ngrok» (tarjeta de ngrok en Servicios). El authtoken viaja una
 * sola vez al proceso principal, que lo guarda cifrado en el almacén de secretos (`tunel:ngrok`);
 * el renderer solo vuelve a ver si hay uno y sus 4 últimos caracteres. Al abrir un túnel, el
 * núcleo se lo pasa a ngrok únicamente en `NGROK_AUTHTOKEN` del proceso, con una configuración
 * propia en la carpeta de datos: nunca en la línea de órdenes ni en el `ngrok.yml` del usuario.
 */
const t = textos.instalar.ngrokCuenta;
const { ejecutar, ocupado } = useAccion();

/** Página oficial donde ngrok muestra el authtoken de la cuenta. */
const URL_AUTHTOKEN = 'https://dashboard.ngrok.com/get-started/your-authtoken';

const token = ref('');
const estado = ref<EstadoClaveIa>({ configurada: false, final: null });
const valido = computed(() => tokenTunelValido(token.value.trim()));

async function leer(): Promise<void> {
  try {
    estado.value = await api().tuneles.estadoToken('ngrok');
  } catch {
    estado.value = { configurada: false, final: null };
  }
}

async function guardar(): Promise<void> {
  const valor = token.value.trim();
  const nuevo = await ejecutar('ngrok-token', () => api().tuneles.guardarToken('ngrok', valor), {
    tituloError: t.titulo,
  });
  // El campo se vacía siempre: el authtoken ya no vuelve a verse.
  token.value = '';
  if (nuevo) estado.value = nuevo;
}

async function borrar(): Promise<void> {
  await ejecutar('ngrok-token-borrar', () => api().tuneles.borrarToken('ngrok'), {
    tituloError: t.titulo,
  });
  await leer();
}

function abrirPanel(): void {
  void ejecutar('ngrok-panel', () => api().sistema.abrirUrl(URL_AUTHTOKEN));
}

onMounted(() => void leer());
</script>

<template>
  <section class="paso" aria-labelledby="ngrok-cuenta-titulo">
    <h4 id="ngrok-cuenta-titulo">{{ t.titulo }}</h4>
    <p class="intro">{{ t.intro }}</p>
    <ol class="pasos">
      <li>
        <span>{{ t.paso1 }}</span>
        <NButton size="small" secondary :loading="ocupado('ngrok-panel')" @click="abrirPanel">
          {{ t.abrirPanel }}
        </NButton>
      </li>
      <li>
        <span>{{ t.paso2 }}</span>
        <NInput
          v-model:value="token"
          size="small"
          type="password"
          show-password-on="click"
          autocomplete="off"
          :maxlength="200"
          :placeholder="t.marcador"
          :aria-label="t.etiqueta"
          :status="token && !valido ? 'error' : undefined"
          class="campo"
        />
      </li>
      <li>
        <span>{{ t.paso3 }}</span>
        <div class="botones">
          <NButton
            size="small"
            type="primary"
            :disabled="!valido"
            :loading="ocupado('ngrok-token')"
            @click="guardar"
          >
            {{ t.guardar }}
          </NButton>
          <NButton
            v-if="estado.configurada"
            size="small"
            secondary
            type="error"
            :loading="ocupado('ngrok-token-borrar')"
            @click="borrar"
          >
            {{ t.borrar }}
          </NButton>
        </div>
      </li>
    </ol>
    <p class="estado" role="status">
      {{ estado.configurada ? t.guardado(estado.final ?? '') : t.sinGuardar }}
    </p>
    <p class="nota">{{ t.nota }}</p>
  </section>
</template>

<style scoped>
.paso {
  grid-column: 1 / -1;
  padding: 12px 14px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  border-radius: 8px;
}
h4 {
  margin: 0 0 4px;
  font-size: 14px;
}
.intro,
.estado,
.nota {
  margin: 4px 0;
  font-size: 12px;
}
.nota {
  opacity: 0.72;
}
.pasos {
  margin: 8px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}
.pasos li {
  padding-left: 4px;
}
.pasos li > span {
  display: block;
  margin-bottom: 4px;
}
.campo {
  max-width: 420px;
}
.botones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
