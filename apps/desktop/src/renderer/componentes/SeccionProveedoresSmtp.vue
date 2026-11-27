<script setup lang="ts">
import { Add, CreateOutline, PaperPlaneOutline, TrashOutline } from '@vicons/ionicons5';
import { NAlert, NButton, NIcon, NInput, NSkeleton, useDialog, useMessage } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import type { PresetSmtp, ProveedorSmtpPublico } from '../../shared/api';
import { api } from '../api';
import { useAccion, mensajeDeError } from '../composables/useAccion';
import { textos } from '../i18n';
import DialogoEnvSmtp from './DialogoEnvSmtp.vue';
import DialogoProveedorSmtp from './DialogoProveedorSmtp.vue';

const t = textos.correo.proveedores;
const dialog = useDialog();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();

const proveedores = ref<ProveedorSmtpPublico[] | null>(null);
const presets = ref<PresetSmtp[]>([]);
const errorLista = ref<string | null>(null);

const dialogo = ref(false);
const enEdicion = ref<ProveedorSmtpPublico | null>(null);
const dialogoEnv = ref(false);
const paraEnv = ref<ProveedorSmtpPublico | null>(null);

/** Destino de la prueba por proveedor (lo escribe el usuario). */
const destinos = ref<Record<string, string>>({});
/** Resultado de la última prueba por proveedor: texto ya traducido. */
const resultados = ref<Record<string, { ok: boolean; texto: string }>>({});

const ids = computed(() => (proveedores.value ?? []).map((p) => p.id));

async function recargar(): Promise<void> {
  try {
    const [lista, ps] = await Promise.all([api().correo.proveedores(), api().correo.presets()]);
    proveedores.value = lista;
    presets.value = ps;
    errorLista.value = null;
  } catch (e) {
    errorLista.value = mensajeDeError(e);
  }
}
onMounted(() => void recargar());

function nuevo(): void {
  enEdicion.value = null;
  dialogo.value = true;
}
function editar(p: ProveedorSmtpPublico): void {
  enEdicion.value = p;
  dialogo.value = true;
}
function usar(p: ProveedorSmtpPublico): void {
  paraEnv.value = p;
  dialogoEnv.value = true;
}

function alGuardar(lista: ProveedorSmtpPublico[]): void {
  proveedores.value = lista;
}

function confirmar(titulo: string, texto: string, boton: string): Promise<boolean> {
  return new Promise((resolver) => {
    dialog.warning({
      title: titulo,
      content: texto,
      positiveText: boton,
      negativeText: textos.acciones.cancelar,
      autoFocus: false,
      onPositiveClick: () => resolver(true),
      onNegativeClick: () => resolver(false),
      onClose: () => resolver(false),
      onMaskClick: () => resolver(false),
    });
  });
}

async function borrarProveedor(p: ProveedorSmtpPublico): Promise<void> {
  if (
    !(await confirmar(t.tarjeta.borrarTitulo(p.nombre), t.tarjeta.borrarTexto, t.tarjeta.borrar))
  ) {
    return;
  }
  const ok = await ejecutar('borrar', async () => {
    await api().correo.borrarProveedor(p.id);
    return true;
  });
  if (ok) message.success(t.tarjeta.borrado(p.nombre));
  await recargar();
}

async function borrarClave(p: ProveedorSmtpPublico): Promise<void> {
  if (
    !(await confirmar(
      t.dialogo.borrarClaveTitulo(p.nombre),
      t.dialogo.borrarClaveTexto,
      t.dialogo.borrarClave,
    ))
  ) {
    return;
  }
  const ok = await ejecutar('borrarClave', async () => {
    await api().correo.borrarClave(p.id);
    return true;
  });
  if (ok) {
    message.success(t.dialogo.claveBorrada);
    dialogo.value = false;
  }
  await recargar();
}

/** Proveedores cuya prueba dijo que el servidor es de este equipo o de la red local. */
const hostLocal = ref<Record<string, boolean>>({});

async function probar(p: ProveedorSmtpPublico): Promise<void> {
  const para = (destinos.value[p.id] ?? '').trim();
  delete resultados.value[p.id];
  hostLocal.value[p.id] = false;
  const r = await ejecutar(`probar-${p.id}`, async () => {
    try {
      return await api().correo.probarEnvio(p.id, para);
    } catch (e) {
      // El nombre se resuelve a la red local: se ofrece confirmarlo en la misma tarjeta.
      if ((e as { codigo?: unknown }).codigo !== 'correo.host_local') throw e;
      hostLocal.value[p.id] = true;
      return null;
    }
  });
  if (!r) return;
  resultados.value[p.id] = r.ok
    ? { ok: true, texto: t.tarjeta.enviado(para) }
    : { ok: false, texto: t.tarjeta.fallos[r.codigo] };
}

async function confirmarRedLocal(p: ProveedorSmtpPublico): Promise<void> {
  if (
    !(await confirmar(
      t.dialogo.redLocalTitulo,
      t.dialogo.redLocalTexto(p.host),
      t.dialogo.redLocalConfirmar,
    ))
  ) {
    return;
  }
  const datos = {
    id: p.id,
    nombre: p.nombre,
    host: p.host,
    puerto: p.puerto,
    seguridad: p.seguridad,
    usuario: p.usuario,
    ...(p.remitente ? { remitente: p.remitente } : {}),
  };
  const lista = await ejecutar('red-local', () =>
    api().correo.guardarProveedor(datos, { confirmarRedLocal: true }),
  );
  if (lista) {
    proveedores.value = lista;
    hostLocal.value[p.id] = false;
  }
}

const estadoClave = (p: ProveedorSmtpPublico): string =>
  !p.clave.configurada
    ? t.tarjeta.sinClave
    : p.clave.final
      ? `••••${p.clave.final}`
      : t.tarjeta.claveIlegible;
</script>

<template>
  <section class="proveedores" :aria-label="textos.correo.seccionProveedores">
    <div class="cabeza">
      <h3 class="titulo">{{ textos.correo.seccionProveedores }}</h3>
      <NButton size="small" type="primary" secondary @click="nuevo">
        <template #icon
          ><NIcon><Add /></NIcon
        ></template>
        {{ t.agregar }}
      </NButton>
    </div>
    <p class="tenue">{{ t.descripcion }}</p>

    <NAlert v-if="errorLista" type="error" :title="t.errorLista">{{ errorLista }}</NAlert>
    <NSkeleton v-else-if="proveedores === null" height="90px" class="esqueleto" />
    <p v-else-if="!proveedores.length" class="tenue">{{ t.vacio }}</p>
    <div v-else class="lista">
      <article v-for="p in proveedores" :key="p.id" class="tarjeta">
        <div class="tarjeta-cabeza">
          <strong>{{ p.nombre }}</strong>
          <span class="espacio" />
          <NButton size="tiny" secondary @click="usar(p)">{{ t.tarjeta.usar }}</NButton>
          <NButton size="tiny" quaternary :aria-label="t.tarjeta.editar" @click="editar(p)">
            <template #icon
              ><NIcon><CreateOutline /></NIcon
            ></template>
          </NButton>
          <NButton
            size="tiny"
            quaternary
            type="error"
            :aria-label="t.tarjeta.borrar"
            :loading="ocupado('borrar')"
            @click="borrarProveedor(p)"
          >
            <template #icon
              ><NIcon><TrashOutline /></NIcon
            ></template>
          </NButton>
        </div>
        <dl class="datos">
          <dt>{{ t.tarjeta.servidor }}</dt>
          <dd class="mono">
            {{ p.host }}:{{ p.puerto }} ·
            {{ p.seguridad === 'tls' ? t.dialogo.tls : t.dialogo.starttls }}
          </dd>
          <dt>{{ t.tarjeta.usuario }}</dt>
          <dd class="mono">{{ p.usuario }}</dd>
          <dt>{{ t.tarjeta.clave }}</dt>
          <dd class="mono">{{ estadoClave(p) }}</dd>
          <template v-if="p.redLocal">
            <dt>{{ t.tarjeta.red }}</dt>
            <dd>{{ t.tarjeta.redLocal }}</dd>
          </template>
        </dl>
        <form class="prueba" @submit.prevent="probar(p)">
          <NInput
            v-model:value="destinos[p.id]"
            size="small"
            :placeholder="t.tarjeta.destinoPlaceholder"
            :aria-label="t.tarjeta.destino"
            :maxlength="254"
            :disabled="!p.clave.configurada"
            :input-props="{ type: 'email', spellcheck: false, autocomplete: 'off' }"
          />
          <NButton
            size="small"
            attr-type="submit"
            :disabled="!p.clave.configurada || !(destinos[p.id] ?? '').trim()"
            :loading="ocupado(`probar-${p.id}`)"
          >
            <template #icon
              ><NIcon><PaperPlaneOutline /></NIcon
            ></template>
            {{ ocupado(`probar-${p.id}`) ? t.tarjeta.probando : t.tarjeta.probar }}
          </NButton>
        </form>
        <small class="tenue">{{
          p.clave.configurada ? t.tarjeta.probarAyuda : t.tarjeta.sinClaveParaProbar
        }}</small>
        <div v-if="hostLocal[p.id]" class="resultado mal" role="alert">
          {{ t.tarjeta.hostLocal }}
          <NButton
            size="tiny"
            secondary
            :loading="ocupado('red-local')"
            @click="confirmarRedLocal(p)"
          >
            {{ t.tarjeta.confirmarRed }}
          </NButton>
        </div>
        <p
          v-if="resultados[p.id]"
          :class="['resultado', resultados[p.id]!.ok ? 'ok' : 'mal']"
          :role="resultados[p.id]!.ok ? 'status' : 'alert'"
        >
          {{ resultados[p.id]!.texto }}
        </p>
      </article>
    </div>

    <DialogoProveedorSmtp
      v-model:show="dialogo"
      :proveedor="enEdicion"
      :presets="presets"
      :existentes="ids"
      @guardado="alGuardar"
      @borrar-clave="borrarClave"
    />
    <DialogoEnvSmtp v-if="paraEnv" v-model:show="dialogoEnv" :proveedor="paraEnv" />
  </section>
</template>

<style scoped>
.proveedores {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(128, 128, 128, 0.2);
}
.cabeza {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.titulo {
  margin: 0;
  font-size: 15px;
}
.esqueleto {
  border-radius: 12px;
}
.lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.22);
  background: rgba(128, 128, 128, 0.04);
}
.tarjeta-cabeza {
  display: flex;
  align-items: center;
  gap: 4px;
}
.espacio {
  flex: 1;
}
.datos {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 12px;
  margin: 0;
  font-size: 12.5px;
}
.datos dt {
  opacity: 0.72;
}
.datos dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
.mono {
  font-family: var(--fuente-mono);
}
.prueba {
  display: flex;
  gap: 8px;
}
.resultado {
  margin: 0;
  font-size: 12.5px;
}
.resultado.ok {
  color: var(--texto-exito, #18a058);
}
.resultado.mal {
  color: var(--texto-error);
}
.tenue {
  font-size: 12px;
  opacity: 0.75;
  margin: 0;
}
</style>
