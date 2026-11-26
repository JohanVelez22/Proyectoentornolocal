<script setup lang="ts">
import { Pulse, ShieldCheckmark } from '@vicons/ionicons5';
import {
  NAlert,
  NButton,
  NCheckbox,
  NEmpty,
  NIcon,
  NModal,
  NSpace,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Hallazgo, Reparacion } from '../../shared/api';
import { api } from '../api';
import TarjetaHallazgo from '../componentes/TarjetaHallazgo.vue';
import { useAccion } from '../composables/useAccion';
import { useFoco } from '../composables/useFoco';
import { textos } from '../i18n';
import { useDoctor } from '../stores/doctor';
import { destinoHallazgo, textoReparacion } from '../utilidades/doctor';
import { traducirError } from '../utilidades/errores';

const t = textos.doctor;
const router = useRouter();
const tc = textos.doctor.confianza;
const doctor = useDoctor();
const message = useMessage();
const { ejecutar, ocupado } = useAccion();
useFoco();

onMounted(() => {
  void ejecutar('cargar', () => doctor.cargar());
  void doctor.cargarConfianza().catch(() => undefined);
});

/* ───────────── Reparación con diálogo ───────────── */

interface Pedido {
  hallazgo: Hallazgo;
  reparacion: Reparacion;
  alternativa: boolean;
}
const pedido = ref<Pedido | null>(null);

function pedir(h: Hallazgo, alternativa: boolean): void {
  const reparacion = alternativa ? h.alternativa : h.reparacion;
  if (!reparacion || reparacion.soloInforma) return;
  pedido.value = { hallazgo: h, reparacion, alternativa };
  // Reglas del cortafuegos: todas empiezan marcadas; el usuario desmarca las que no quiere tocar.
  marcadas.value = new Set((h.elementos ?? []).map((e) => e.clave));
}

/** Elementos que el usuario puede marcar o desmarcar en el diálogo (D46). */
const marcadas = ref<Set<string>>(new Set());
function alternar(clave: string, v: boolean): void {
  const n = new Set(marcadas.value);
  if (v) n.add(clave);
  else n.delete(clave);
  marcadas.value = n;
}

const puertoNuevo = computed(() => {
  const p = pedido.value;
  if (!p || p.reparacion.id !== 'cambiar-puerto') return null;
  return p.hallazgo.datos['alternativo'] ?? null;
});

/** Hallazgo con elementos (reglas del cortafuegos, D46): el diálogo los lista, uno por uno, con casilla. */
const conLista = computed(() => (pedido.value?.hallazgo.elementos?.length ?? 0) > 0);
const sinSeleccion = computed(() => conLista.value && marcadas.value.size === 0);

/** Única vía a `reparar`: el botón "Aplicar" del diálogo, que pasa la confirmación explícita. */
function aplicar(): void {
  const p = pedido.value;
  if (!p) return;
  pedido.value = null;
  const alternativa = p.alternativa ? 'cambiar-puerto' : undefined;
  if (p.hallazgo.elementos?.length) {
    // Solo lo marcado, en el orden en que se mostró.
    const marcado = p.hallazgo.elementos.filter((e) => marcadas.value.has(e.clave));
    if (marcado.length === 0) return;
    void doctor.reparar(
      p.hallazgo.id,
      true,
      alternativa,
      marcado.map((e) => e.clave),
    );
    return;
  }
  void doctor.reparar(p.hallazgo.id, true, alternativa);
}

/** Lleva a la tarjeta del servicio o del proyecto del hallazgo y la resalta (D41). */
function verTarjeta(h: Hallazgo): void {
  const destino = destinoHallazgo(h);
  if (destino) void router.push(destino);
}
function copiar(comando: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(comando), { exito: t.copiado });
}

/* ───────────── Confianza de la CA ───────────── */

type Confirmacion = { tipo: 'node'; activar: boolean } | { tipo: 'firefox'; activar: boolean };
const confirmacion = ref<Confirmacion | null>(null);

const textoConfirmacion = computed(() => {
  const c = confirmacion.value;
  if (!c) return '';
  if (c.tipo === 'node') return c.activar ? tc.node.confirmarActivar : tc.node.confirmarDesactivar;
  return c.activar ? tc.firefox.confirmarActivar : tc.firefox.confirmarQuitar;
});

/** Casilla aparte para los perfiles fuera de la carpeta de Firefox (siempre empieza apagada). */
const incluirFuera = ref(false);
const perfilesFuera = computed(
  () => conf.value?.firefox.filter((p) => p.fuera).map((p) => p.perfil) ?? [],
);

function pedirConfianza(c: Confirmacion): void {
  incluirFuera.value = false;
  confirmacion.value = c;
}

function confirmarConfianza(): void {
  const c = confirmacion.value;
  if (!c) return;
  confirmacion.value = null;
  if (c.tipo === 'node') {
    void ejecutar('node', async () => {
      await doctor.cambiarNode(c.activar, true);
      const aviso = doctor.confianza?.aviso;
      if (aviso) message.warning(traducirError({ codigo: aviso }), { duration: 10000 });
    });
    return;
  }
  const fuera = incluirFuera.value ? (true as const) : undefined;
  void ejecutar('firefox', async () => {
    const r = await doctor.cambiarFirefox(c.activar, true, fuera);
    const ok = r.filter((x) => x.ok).length;
    const abiertos = r.filter((x) => x.codigo === 'firefox.abierto').length;
    const saltados = r.filter((x) => x.codigo === 'firefox.fuera').length;
    const errores = r.length - ok - abiertos - saltados;
    if (ok) message.success(tc.firefox.resultadoOk(ok));
    if (abiertos) message.warning(tc.firefox.resultadoAbiertos(abiertos), { duration: 8000 });
    if (saltados) message.info(tc.firefox.resultadoFuera(saltados), { duration: 8000 });
    if (errores) message.error(tc.firefox.resultadoError(errores));
  });
}

const conf = computed(() => doctor.confianza);
const firefoxInactivos = computed(() => conf.value?.firefox.some((p) => !p.activo) ?? false);
const firefoxActivos = computed(() => conf.value?.firefox.some((p) => p.activo) ?? false);
</script>

<template>
  <div class="doctor">
    <div class="cabecera">
      <p class="descripcion">{{ t.descripcion }}</p>
      <NButton
        type="primary"
        :loading="doctor.revisando"
        @click="ejecutar('revisar', () => doctor.revisar())"
      >
        <template #icon
          ><NIcon><Pulse /></NIcon
        ></template>
        {{ doctor.revisando ? t.revisando : t.revisarAhora }}
      </NButton>
    </div>

    <NEmpty
      v-if="doctor.hallazgos.length === 0"
      :description="doctor.cargado ? t.sinHallazgos : t.sinRevision"
      class="vacio"
    />
    <section v-for="g in doctor.porGravedad" :key="g.gravedad" class="grupo">
      <h3>{{ t.gravedades[g.gravedad] }} ({{ g.hallazgos.length }})</h3>
      <TarjetaHallazgo
        v-for="h in g.hallazgos"
        :key="h.id"
        :hallazgo="h"
        :reparacion="doctor.reparaciones[h.id]"
        @pedir="(alt) => pedir(h, alt)"
        @copiar="copiar"
        @ver="verTarjeta(h)"
      />
    </section>

    <section class="confianza">
      <h3>
        <NIcon><ShieldCheckmark /></NIcon> {{ tc.titulo }}
      </h3>
      <p class="descripcion">{{ tc.texto }}</p>
      <NAlert v-if="conf && !conf.caCreada" type="info" :show-icon="false">
        {{ tc.sinCa }}
      </NAlert>
      <template v-else-if="conf">
        <div class="bloque">
          <strong>{{ tc.node.titulo }}</strong>
          <p>{{ conf.node.ajena ? tc.node.ajena : tc.node.proyectos }}</p>
          <label class="interruptor">
            <NSwitch
              :value="conf.node.global"
              :loading="ocupado('node')"
              :disabled="conf.node.ajena"
              @update:value="(v: boolean) => pedirConfianza({ tipo: 'node', activar: v })"
            />
            {{ tc.node.global }}
          </label>
        </div>
        <div class="bloque">
          <strong>{{ tc.python.titulo }}</strong>
          <p>{{ tc.python.texto }}</p>
        </div>
        <div class="bloque">
          <strong>{{ tc.firefox.titulo }}</strong>
          <p v-if="conf.firefox.length === 0">{{ tc.firefox.sinPerfiles }}</p>
          <ul v-else class="perfiles">
            <li v-for="p in conf.firefox" :key="p.perfil">
              <code>{{ p.perfil }}</code>
              <NTag size="small" :type="p.activo ? 'success' : 'default'" :bordered="false">
                {{ p.activo ? tc.firefox.activo : tc.firefox.inactivo }}
              </NTag>
              <NTag v-if="p.abierto" size="small" type="warning" :bordered="false">
                {{ tc.firefox.abierto }}
              </NTag>
              <NTag v-if="p.fuera" size="small" type="info" :bordered="false">
                {{ tc.firefox.fuera }}
              </NTag>
            </li>
          </ul>
          <NSpace v-if="conf.firefox.length" size="small">
            <NButton
              v-if="firefoxInactivos"
              size="small"
              type="primary"
              :loading="ocupado('firefox')"
              @click="pedirConfianza({ tipo: 'firefox', activar: true })"
            >
              {{ tc.firefox.activar }}
            </NButton>
            <NButton
              v-if="firefoxActivos"
              size="small"
              secondary
              :loading="ocupado('firefox')"
              @click="pedirConfianza({ tipo: 'firefox', activar: false })"
            >
              {{ tc.firefox.quitar }}
            </NButton>
          </NSpace>
        </div>
      </template>
    </section>

    <NModal
      :show="pedido !== null"
      preset="card"
      :title="t.dialogo.titulo"
      :style="{ width: '560px', maxWidth: '92vw' }"
      @update:show="(v: boolean) => !v && (pedido = null)"
    >
      <template v-if="pedido">
        <p class="hallazgo-dialogo">
          {{ traducirError({ codigo: pedido.hallazgo.codigo, datos: pedido.hallazgo.datos }) }}
        </p>
        <p>{{ t.dialogo.queHara }}</p>
        <p class="que-hara">{{ textoReparacion(pedido.reparacion.codigo) }}</p>
        <template v-if="conLista">
          <p>{{ t.dialogo.reglas }}</p>
          <ul class="lista-exacta">
            <li v-for="e in pedido.hallazgo.elementos" :key="e.clave">
              <NCheckbox
                :checked="marcadas.has(e.clave)"
                @update:checked="(v: boolean) => alternar(e.clave, v)"
              >
                <code>{{ e.texto }}</code>
              </NCheckbox>
            </li>
          </ul>
          <NAlert v-if="sinSeleccion" type="warning" :show-icon="false">
            {{ t.dialogo.sinSeleccion }}
          </NAlert>
          <p>{{ t.dialogo.reglasNota }}</p>
        </template>
        <p v-if="puertoNuevo !== null">{{ t.dialogo.puerto(puertoNuevo) }}</p>
        <NAlert v-if="pedido.reparacion.requiereAdmin" type="warning" :show-icon="false">
          {{ t.dialogo.admin }}
        </NAlert>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="pedido = null">{{ t.dialogo.cancelar }}</NButton>
          <NButton type="primary" :disabled="sinSeleccion" @click="aplicar">
            {{ t.dialogo.aplicar }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      :show="confirmacion !== null"
      preset="card"
      :title="tc.titulo"
      :style="{ width: '520px', maxWidth: '92vw' }"
      @update:show="(v: boolean) => !v && (confirmacion = null)"
    >
      <p>{{ textoConfirmacion }}</p>
      <div v-if="confirmacion?.tipo === 'firefox' && perfilesFuera.length" class="fuera">
        <p>{{ tc.firefox.avisoFuera(perfilesFuera.join(', ')) }}</p>
        <NCheckbox v-model:checked="incluirFuera">{{ tc.firefox.incluirFuera }}</NCheckbox>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="confirmacion = null">{{ tc.cancelar }}</NButton>
          <NButton type="primary" @click="confirmarConfianza">{{ tc.confirmar }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.descripcion {
  margin: 0 0 10px;
  opacity: 0.75;
}
.vacio {
  padding: 32px 0;
  border: 1px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
}
.grupo {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 15px;
}
.confianza {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}
.bloque {
  margin: 12px 0;
}
.bloque p {
  margin: 4px 0 8px;
  line-height: 1.5;
}
.interruptor {
  display: flex;
  align-items: center;
  gap: 8px;
}
.perfiles {
  list-style: none;
  padding: 0;
  margin: 6px 0 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.perfiles li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fuera {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.1);
}
.fuera p {
  margin: 0 0 6px;
}
.hallazgo-dialogo {
  font-weight: 600;
}
.que-hara {
  line-height: 1.5;
}
.lista-exacta {
  max-height: 220px;
  overflow: auto;
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.14);
  color: inherit;
  font-size: 12px;
  line-height: 1.5;
  list-style: none;
  overflow-wrap: anywhere;
}
.lista-exacta li {
  padding: 4px 0;
}
.lista-exacta code {
  white-space: pre-wrap;
}
</style>
