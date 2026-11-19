<script setup lang="ts">
import { DocumentText, Stop } from '@vicons/ionicons5';
import { NButton, NIcon, NTag, NTooltip } from 'naive-ui';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { MuestraSistema, PuertoEnUso } from '../../shared/api';
import { api } from '../api';
import { useAccion } from '../composables/useAccion';
import { textos } from '../i18n';
import { useServicios } from '../stores/servicios';
import { useSitios } from '../stores/sitios';
import {
  formatoBytes,
  formatoDuracion,
  formatoPorcentaje,
  servicioDeProceso,
} from '../utilidades/metricas';
import { fuenteDeProceso } from '../utilidades/registros';

/** Servicios y procesos de proyecto de la última muestra, con sus acciones. */
const props = defineProps<{ procesos: MuestraSistema['procesos']; puertos: PuertoEnUso[] }>();

const t = textos.panel.procesos;
const router = useRouter();
const servicios = useServicios();
const sitios = useSitios();
const { ejecutar, ocupado } = useAccion();

interface Fila {
  id: string;
  nombre: string;
  tipo: 'servicio' | 'proyecto';
  cpu: number;
  ram: number;
  pid: number;
  puertos: number[];
  uptime: number;
  fuente: string;
  detener: () => Promise<void>;
}

const filas = computed<Fila[]>(() => {
  const puertosPorPid = new Map<number, Set<number>>();
  for (const p of props.puertos) {
    const set = puertosPorPid.get(p.pid) ?? new Set<number>();
    set.add(p.puerto);
    puertosPorPid.set(p.pid, set);
  }
  return props.procesos
    .map((p): Fila => {
      const escuchando = [...(puertosPorPid.get(p.pid) ?? [])].sort((a, b) => a - b);
      if (p.sitioId && p.procesoId) {
        const sitio = sitios.porId(p.sitioId);
        const proceso = sitio?.procesos.find((x) => x.id === p.procesoId);
        const sitioId = p.sitioId;
        const procesoId = p.procesoId;
        return {
          id: p.id,
          nombre: t.procesoDe(
            sitio?.nombre || sitio?.dominio || sitioId,
            proceso?.nombre || procesoId,
          ),
          tipo: 'proyecto',
          cpu: p.cpu,
          ram: p.ramBytes,
          pid: p.pid,
          puertos: escuchando,
          uptime: p.uptimeS,
          fuente: fuenteDeProceso(p.id),
          detener: () => api().procesos.detener(sitioId, procesoId),
        };
      }
      const idServicio = servicioDeProceso(p.id);
      const servicio = servicios.porId[idServicio];
      const trabajador =
        p.id !== idServicio
          ? ` ${textos.unidades.trabajador(p.id.slice(idServicio.length + 1))}`
          : '';
      return {
        id: p.id,
        nombre: `${servicio?.nombre ?? idServicio}${trabajador}`,
        tipo: 'servicio',
        cpu: p.cpu,
        ram: p.ramBytes,
        pid: p.pid,
        puertos: escuchando.length ? escuchando : (servicio?.puertos ?? []),
        uptime: p.uptimeS,
        fuente: fuenteDeProceso(p.id),
        detener: () => api().servicios.detener(idServicio),
      };
    })
    .sort((a, b) => b.cpu - a.cpu || b.ram - a.ram || a.nombre.localeCompare(b.nombre, 'es'));
});

function detener(f: Fila): void {
  void ejecutar(`detener-${f.id}`, f.detener);
}
function verRegistros(f: Fila): void {
  void router.push({ name: 'registros', query: { fuente: f.fuente } });
}
</script>

<template>
  <div class="tabla-envoltura">
    <table v-if="filas.length" class="tabla">
      <thead>
        <tr>
          <th>{{ t.nombre }}</th>
          <th class="num">{{ t.cpu }}</th>
          <th class="num">{{ t.ram }}</th>
          <th class="num">{{ t.pid }}</th>
          <th>{{ t.puerto }}</th>
          <th class="num">{{ t.encendido }}</th>
          <th class="acciones">
            <span class="oculto">{{ t.acciones }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in filas" :key="f.id">
          <td class="nombre">
            <span>{{ f.nombre }}</span>
            <NTag size="tiny" :bordered="false" :type="f.tipo === 'proyecto' ? 'info' : 'default'">
              {{ f.tipo === 'proyecto' ? t.proyecto : t.servicio }}
            </NTag>
          </td>
          <td class="num">{{ formatoPorcentaje(f.cpu) }}</td>
          <td class="num">{{ formatoBytes(f.ram) }}</td>
          <td class="num mono">{{ f.pid }}</td>
          <td class="mono">{{ f.puertos.join(' · ') || '—' }}</td>
          <td class="num">{{ formatoDuracion(f.uptime) }}</td>
          <td class="acciones">
            <NTooltip>
              <template #trigger>
                <NButton size="tiny" quaternary :aria-label="t.registros" @click="verRegistros(f)">
                  <template #icon
                    ><NIcon><DocumentText /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.registros }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NButton
                  size="tiny"
                  quaternary
                  :aria-label="t.detener"
                  :loading="ocupado(`detener-${f.id}`)"
                  @click="detener(f)"
                >
                  <template #icon
                    ><NIcon><Stop /></NIcon
                  ></template>
                </NButton>
              </template>
              {{ t.detener }}
            </NTooltip>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="vacio">{{ t.vacio }}</p>
  </div>
</template>

<style scoped>
.tabla-envoltura {
  overflow-x: auto;
}
.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  font-weight: 500;
  font-size: 12px;
  opacity: 0.6;
  padding: 6px 8px;
  white-space: nowrap;
}
td {
  padding: 7px 8px;
  border-top: 1px solid rgba(128, 128, 128, 0.14);
  white-space: nowrap;
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.mono {
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.nombre {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  white-space: normal;
}
.acciones {
  text-align: right;
  width: 1%;
}
.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.vacio {
  margin: 6px 0;
  opacity: 0.6;
}
</style>
