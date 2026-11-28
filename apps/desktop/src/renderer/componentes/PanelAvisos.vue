<script setup lang="ts">
import { Notifications, Warning } from '@vicons/ionicons5';
import { NButton, NDrawer, NDrawerContent, NIcon, NTag } from 'naive-ui';
import EstadoVacio from './EstadoVacio.vue';
import type { Aviso } from '../../shared/api';
import { computed } from 'vue';
import { formatearFecha, idioma, textos } from '../i18n';
import { textoAviso } from '../../shared/textosAvisos';
import { useAvisos } from '../stores/avisos';
import { useProblemas } from '../stores/problemas';
import { argsDeAviso } from '../stores/versiones';

/** Historial de avisos en un panel lateral; cada aviso con acción lleva a su pantalla. */
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ abrir: [aviso: Aviso] }>();

const avisos = useAvisos();
const problemas = useProblemas();
const t = textos.avisos;

const TONO = { info: 'info', aviso: 'warning', error: 'error' } as const;

/** Texto traducido del aviso en el idioma activo (se vuelve a calcular al cambiar de idioma). */
const filas = computed(() =>
  avisos.lista.map((a) => ({ aviso: a, texto: textoAviso(idioma.value, a) })),
);

/**
 * Texto del botón: "Actualizar" en un aviso de versión nueva con huella fuerte (abre el diálogo
 * de actualización, nunca actualiza solo); "Ver versiones" si no hay atajo; "Ver" en el resto.
 */
function textoBoton(a: Aviso): string {
  // Salud de un disco (D57): lleva a los respaldos y las instantáneas; no respalda por sí solo.
  if (a.tipo === 'salud-disco') return t.hacerRespaldo;
  if (a.tipo !== 'version-nueva') return t.ver;
  return argsDeAviso(a.accion?.args)?.actualizar ? t.actualizar : t.verVersiones;
}

function ver(a: Aviso): void {
  void avisos.marcarLeidos([a.id]).catch(() => undefined);
  emit('abrir', a);
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="400" placement="right">
    <NDrawerContent :title="t.titulo" closable :native-scrollbar="false">
      <!-- Los mismos problemas que ve Inicio (almacén compartido): cuentan en la insignia. -->
      <section
        v-if="problemas.total"
        class="problemas"
        :aria-label="textos.panel.alertas.grupo(problemas.total)"
      >
        <h3>
          <NIcon :size="16" aria-hidden="true"><Warning /></NIcon>
          {{ textos.panel.alertas.grupo(problemas.total) }}
        </h3>
        <ul>
          <li v-for="p in problemas.lista" :key="p.clave">{{ p.texto }}</li>
        </ul>
      </section>
      <!-- Sin avisos no hay nada que marcar ni limpiar: los botones no se muestran. -->
      <div v-if="avisos.lista.length > 0" class="acciones">
        <NButton
          v-if="avisos.noLeidos > 0"
          size="small"
          secondary
          @click="avisos.marcarLeidos().catch(() => undefined)"
        >
          {{ t.marcarTodos }}
        </NButton>
        <NButton size="small" secondary @click="avisos.limpiar().catch(() => undefined)">
          {{ t.limpiar }}
        </NButton>
      </div>
      <EstadoVacio
        v-if="filas.length === 0 && problemas.total === 0"
        pequena
        :icono="Notifications"
        :titulo="textos.estadosVacios.avisos.titulo"
        :texto="textos.estadosVacios.avisos.texto"
      />
      <ul v-else-if="filas.length" class="lista">
        <li v-for="f in filas" :key="f.aviso.id" class="aviso" :class="{ nuevo: !f.aviso.leido }">
          <div class="cabecera">
            <NTag size="small" :type="TONO[f.aviso.nivel]" :bordered="false">
              {{ t.niveles[f.aviso.nivel] }}
            </NTag>
            <time :datetime="f.aviso.fecha">
              {{ formatearFecha(f.aviso.fecha, { dateStyle: 'short', timeStyle: 'short' }) }}
            </time>
          </div>
          <strong>{{ f.texto.titulo }}</strong>
          <p>{{ f.texto.cuerpo }}</p>
          <NButton
            v-if="f.aviso.accion"
            size="tiny"
            quaternary
            type="primary"
            @click="ver(f.aviso)"
          >
            {{ textoBoton(f.aviso) }}
          </NButton>
        </li>
      </ul>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.problemas {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #dc2626;
  background: rgba(220, 38, 38, 0.08);
  font-size: 13px;
}
.problemas h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}
.problemas ul {
  margin: 0;
  padding-inline-start: 22px;
}
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.aviso {
  padding: 10px 12px;
  border: 1px solid var(--n-border-color, rgba(128, 128, 128, 0.25));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.aviso.nuevo {
  border-inline-start: 3px solid var(--n-color-target, #2080f0);
}
.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  opacity: 0.8;
}
.aviso p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}
.vacio {
  margin-top: 40px;
}
</style>
