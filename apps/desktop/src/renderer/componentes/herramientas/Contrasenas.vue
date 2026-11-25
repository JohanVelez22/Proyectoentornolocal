<script setup lang="ts">
import { NButton, NInput, NTabPane, NTabs, NTag } from 'naive-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ResultadoAuditoria } from '@pel/core';
import type { MotorBd, SeleccionAuditoria } from '../../../shared/api';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import { useBd } from '../../stores/bd';
import { useServicios } from '../../stores/servicios';
import { esMotorSql, MOTORES } from '../../utilidades/bd';
import Desplegable from '../Desplegable.vue';
import DialogoRestablecerClave from '../DialogoRestablecerClave.vue';
import MedidorClave from './MedidorClave.vue';

/**
 * Contraseñas (D20): medidor de fortaleza local y auditoría de las bases propias. La auditoría
 * solo marca cuentas "débiles" (contraseña muy común o formato md5/sha1 sin sal) y nunca dice
 * cuál contraseña coincidió; para una cuenta olvidada ofrece restablecerla, no recuperarla.
 */
const t = textos.herramientas.contrasenas;
const { ejecutar, ocupado } = useAccion();
const servicios = useServicios();
const bd = useBd();

// ---- Fortaleza ----
const clave = ref('');
// Lo escrito no se conserva al cerrar la herramienta.
onBeforeUnmount(() => (clave.value = ''));

// ---- Auditoría ----
const motores = computed<MotorBd[]>(() =>
  MOTORES.filter(
    (m) => esMotorSql(m) && !!servicios.porId[m] && servicios.porId[m]!.estado !== 'externo',
  ),
);
const motor = ref<MotorBd | null>(null);
watch(
  motores,
  (l) => {
    if (!motor.value || !l.includes(motor.value)) motor.value = l[0] ?? null;
  },
  { immediate: true },
);

const servicio = computed(() => (motor.value ? servicios.porId[motor.value] : undefined));
const encendido = computed(() => {
  const m = motor.value;
  if (!m) return false;
  const objetivo = bd.objetivo(m);
  const inst = servicio.value?.instancias?.find((i) => i.id === objetivo);
  return inst ? inst.estado === 'encendido' : servicio.value?.estado === 'encendido';
});
const objetivo = computed(() => (motor.value ? bd.objetivo(motor.value) : null));
const bases = computed(() => (motor.value ? (bd.bases[motor.value] ?? null) : null));
const base = ref<string | null>(null);

watch(
  [motor, encendido],
  () => {
    base.value = null;
    resultado.value = null;
    if (motor.value && encendido.value) void bd.cargarBases(motor.value);
  },
  { immediate: true },
);
watch(bases, (l) => {
  if (l && (!base.value || !l.some((b) => b.nombre === base.value)))
    base.value = l[0]?.nombre ?? null;
});

const tabla = ref('users');
const columnaUsuario = ref('email');
const columnaHash = ref('password');
const resultado = ref<ResultadoAuditoria | null>(null);
/** Selección con la que se revisó (la que usan las acciones de restablecer). */
const revisada = ref<{ base: string; seleccion: SeleccionAuditoria } | null>(null);

const puedeRevisar = computed(
  () =>
    !!objetivo.value &&
    !!base.value &&
    encendido.value &&
    tabla.value.trim() !== '' &&
    columnaUsuario.value.trim() !== '' &&
    columnaHash.value.trim() !== '',
);

const MAX_FILAS = 200;
const debiles = computed(() => resultado.value?.debiles.slice(0, MAX_FILAS) ?? []);
const restantes = computed(() => Math.max(0, (resultado.value?.debiles.length ?? 0) - MAX_FILAS));

async function revisar(): Promise<void> {
  if (!puedeRevisar.value || !objetivo.value || !base.value) return;
  const seleccion: SeleccionAuditoria = {
    tabla: tabla.value.trim(),
    columnaUsuario: columnaUsuario.value.trim(),
    columnaHash: columnaHash.value.trim(),
  };
  resultado.value = null;
  const r = await ejecutar('auditar', () =>
    api().auditoriaClaves.auditar(objetivo.value as never, base.value!, seleccion),
  );
  if (!r) return;
  resultado.value = r;
  revisada.value = { base: base.value, seleccion };
}

// ---- Restablecer ----
const dialogo = ref(false);
const cuenta = ref('');
function pedirRestablecer(usuario: string): void {
  cuenta.value = usuario;
  dialogo.value = true;
}

onMounted(() => {
  void Promise.all(MOTORES.map((m) => servicios.cargarInstalados(m).catch(() => undefined)));
});

const opcionesMotor = computed(() =>
  motores.value.map((m) => ({ value: m, label: textos.bd.motores[m] ?? m })),
);
const opcionesBase = computed(() =>
  (bases.value ?? []).map((b) => ({ value: b.nombre, label: b.nombre })),
);
</script>

<template>
  <NTabs type="line" animated default-value="fortaleza">
    <NTabPane name="fortaleza" :tab="t.pestanaFortaleza">
      <div class="seccion">
        <label class="etiqueta" for="clave-medir">{{ t.fortaleza.etiqueta }}</label>
        <NInput
          id="clave-medir"
          v-model:value="clave"
          type="password"
          show-password-on="click"
          :placeholder="t.fortaleza.marcador"
          :maxlength="256"
          autocomplete="off"
          :input-props="{ spellcheck: false, autocapitalize: 'off', autocorrect: 'off' }"
        />
        <MedidorClave :clave="clave" />
        <p class="nota">{{ t.fortaleza.privacidad }}</p>
      </div>
    </NTabPane>

    <NTabPane name="auditar" :tab="t.pestanaAuditar">
      <div class="seccion">
        <p class="aviso">{{ t.auditar.limite }}</p>
        <p class="nota">{{ t.auditar.privacidad }}</p>

        <p v-if="!motores.length" class="nota">{{ t.auditar.sinMotores }}</p>
        <template v-else>
          <div class="rejilla">
            <label class="campo">
              <span class="etiqueta">{{ t.auditar.motor }}</span>
              <Desplegable
                v-model:value="motor"
                :options="opcionesMotor"
                :aria-label="t.auditar.motor"
              />
            </label>
            <label class="campo">
              <span class="etiqueta">{{ t.auditar.base }}</span>
              <Desplegable
                v-model:value="base"
                :options="opcionesBase"
                :disabled="!encendido || !opcionesBase.length"
                :aria-label="t.auditar.base"
              />
            </label>
            <label class="campo">
              <span class="etiqueta">{{ t.auditar.tabla }}</span>
              <NInput
                v-model:value="tabla"
                :maxlength="128"
                :placeholder="t.auditar.tablaMarcador"
              />
            </label>
            <label class="campo">
              <span class="etiqueta">{{ t.auditar.columnaUsuario }}</span>
              <NInput
                v-model:value="columnaUsuario"
                :maxlength="128"
                :placeholder="t.auditar.usuarioMarcador"
              />
            </label>
            <label class="campo">
              <span class="etiqueta">{{ t.auditar.columnaHash }}</span>
              <NInput
                v-model:value="columnaHash"
                :maxlength="128"
                :placeholder="t.auditar.hashMarcador"
              />
            </label>
          </div>
          <p v-if="!encendido" class="nota">{{ t.auditar.apagado }}</p>
          <p v-else-if="bases && !bases.length" class="nota">{{ t.auditar.sinBases }}</p>

          <div>
            <NButton
              type="primary"
              :disabled="!puedeRevisar"
              :loading="ocupado('auditar')"
              @click="revisar"
            >
              {{ ocupado('auditar') ? t.auditar.revisando : t.auditar.revisar }}
            </NButton>
          </div>

          <div v-if="resultado" class="resultado" aria-live="polite">
            <p class="resumen">
              {{ t.auditar.resumen(resultado.revisadas, resultado.debiles.length) }}
            </p>
            <p v-if="!resultado.debiles.length" class="nota">{{ t.auditar.sinDebiles }}</p>
            <p v-if="resultado.noRevisables" class="nota">
              {{ t.auditar.noRevisables(resultado.noRevisables) }}
            </p>
            <p v-if="resultado.truncado" class="aviso">{{ t.auditar.truncado }}</p>

            <table v-if="debiles.length" class="tabla">
              <thead>
                <tr>
                  <th scope="col">{{ t.auditar.usuario }}</th>
                  <th scope="col">{{ t.auditar.motivo }}</th>
                  <th scope="col">{{ t.auditar.accion }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(d, i) in debiles" :key="i">
                  <td class="usuario">{{ d.usuario }}</td>
                  <td>
                    <NTag size="small" :type="d.motivo === 'comun' ? 'error' : 'warning'">
                      {{ t.auditar.motivos[d.motivo] }}
                    </NTag>
                  </td>
                  <td>
                    <NButton size="small" secondary @click="pedirRestablecer(d.usuario)">
                      {{ t.auditar.restablecer }}
                    </NButton>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="restantes" class="nota">{{ t.auditar.mas(restantes) }}</p>
          </div>
        </template>
      </div>

      <DialogoRestablecerClave
        v-if="revisada && objetivo"
        v-model:show="dialogo"
        :objetivo="objetivo as never"
        :base="revisada.base"
        :seleccion="revisada.seleccion"
        :usuario="cuenta"
        @hecho="revisar"
      />
    </NTabPane>
  </NTabs>
</template>

<style scoped>
.seccion {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.etiqueta {
  font-size: 13px;
  font-weight: 600;
}
.nota {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.7;
}
.aviso {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--texto-aviso);
  background: rgba(234, 179, 8, 0.12);
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.resultado {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.resumen {
  margin: 0;
  font-weight: 600;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.tabla th,
.tabla td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
.usuario {
  overflow-wrap: anywhere;
}
</style>
