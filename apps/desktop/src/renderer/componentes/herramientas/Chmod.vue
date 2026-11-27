<script setup lang="ts">
import { NButton, NCheckbox, NInput } from 'naive-ui';
import { computed, ref } from 'vue';
import { api } from '../../api';
import { useAccion } from '../../composables/useAccion';
import { textos } from '../../i18n';
import {
  alternarPermiso,
  aOctal,
  aSimbolico,
  comandoChmod,
  desdeOctal,
  desdeSimbolico,
  type Bit,
  type Clase,
  type Especial,
  type PermisosChmod,
} from '../../utilidades/chmod';

const t = textos.herramientas.chmod;
const { ejecutar } = useAccion();

const CLASES: readonly Clase[] = ['propietario', 'grupo', 'otros'];
const BITS: readonly Bit[] = ['r', 'w', 'x'];
const ESPECIALES: readonly Especial[] = ['setuid', 'setgid', 'sticky'];
const HABITUALES = ['644', '755', '600', '700'] as const;

const etiquetaBit: Record<Bit, string> = {
  r: t.leer,
  w: t.escribir,
  x: t.ejecutar,
};

const permisos = ref<PermisosChmod>(desdeOctal('755')!);
const archivo = ref('archivo');

/** Lo que el usuario está escribiendo en cada campo; null = se muestra el valor calculado. */
const escritoOctal = ref<string | null>(null);
const escritoSimbolico = ref<string | null>(null);

const octal = computed(() => escritoOctal.value ?? aOctal(permisos.value));
const simbolico = computed(() => escritoSimbolico.value ?? aSimbolico(permisos.value));
const octalInvalido = computed(
  () => escritoOctal.value !== null && desdeOctal(escritoOctal.value) === null,
);
const simbolicoInvalido = computed(
  () => escritoSimbolico.value !== null && desdeSimbolico(escritoSimbolico.value) === null,
);
const comando = computed(() => comandoChmod(permisos.value, archivo.value));
const escribeOtros = computed(() => permisos.value.otros.w);

function poner(p: PermisosChmod): void {
  permisos.value = p;
  escritoOctal.value = null;
  escritoSimbolico.value = null;
}

function alternar(clase: Clase, bit: Bit): void {
  poner(alternarPermiso(permisos.value, clase, bit));
}
function alternarEspecial(bit: Especial): void {
  poner(alternarPermiso(permisos.value, 'especial', bit));
}

function escribirOctal(v: string): void {
  escritoOctal.value = v;
  const p = desdeOctal(v);
  if (!p) return;
  permisos.value = p;
  escritoSimbolico.value = null;
}

function escribirSimbolico(v: string): void {
  escritoSimbolico.value = v;
  const p = desdeSimbolico(v);
  if (!p) return;
  permisos.value = p;
  escritoOctal.value = null;
}

/** Al salir del campo se vuelve al valor calculado, aunque lo escrito no fuera válido. */
function soltarCampos(): void {
  escritoOctal.value = null;
  escritoSimbolico.value = null;
}

function copiar(texto: string): void {
  void ejecutar('copiar', () => api().sistema.copiar(texto), {
    exito: textos.herramientas.copiado,
  });
}
</script>

<template>
  <div class="herr">
    <p class="herr-tenue" data-testid="chmod-nota">{{ t.nota }}</p>

    <div>
      <div class="herr-etiqueta">{{ t.permisos }}</div>
      <table class="chmod-tabla">
        <thead>
          <tr>
            <td></td>
            <th v-for="b in BITS" :key="b" scope="col">{{ etiquetaBit[b] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in CLASES" :key="c">
            <th scope="row">{{ t[c] }}</th>
            <td v-for="b in BITS" :key="b">
              <NCheckbox
                :checked="permisos[c][b]"
                :aria-label="`${t[c]}: ${etiquetaBit[b]}`"
                :data-testid="`chmod-${c}-${b}`"
                @update:checked="alternar(c, b)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <div class="herr-etiqueta">{{ t.especiales }}</div>
      <div class="chmod-especiales">
        <NCheckbox
          v-for="e in ESPECIALES"
          :key="e"
          :checked="permisos[e]"
          :data-testid="`chmod-${e}`"
          @update:checked="alternarEspecial(e)"
        >
          {{ t[e] }}
        </NCheckbox>
      </div>
    </div>

    <div class="herr-columnas">
      <div>
        <label class="herr-etiqueta" for="chmod-octal">{{ t.octal }}</label>
        <NInput
          :value="octal"
          :input-props="{ id: 'chmod-octal', spellcheck: false, autocomplete: 'off' }"
          :status="octalInvalido ? 'error' : undefined"
          class="herr-mono"
          maxlength="4"
          @update:value="escribirOctal"
          @blur="soltarCampos"
        />
        <p v-if="octalInvalido" class="herr-error">{{ t.octalInvalido }}</p>
      </div>
      <div>
        <label class="herr-etiqueta" for="chmod-simbolico">{{ t.simbolico }}</label>
        <NInput
          :value="simbolico"
          :input-props="{ id: 'chmod-simbolico', spellcheck: false, autocomplete: 'off' }"
          :status="simbolicoInvalido ? 'error' : undefined"
          class="herr-mono"
          maxlength="10"
          @update:value="escribirSimbolico"
          @blur="soltarCampos"
        />
        <p v-if="simbolicoInvalido" class="herr-error">{{ t.simbolicoInvalido }}</p>
      </div>
    </div>

    <div>
      <div class="herr-etiqueta">{{ t.habituales }}</div>
      <div class="herr-fila">
        <NButton
          v-for="h in HABITUALES"
          :key="h"
          size="small"
          secondary
          class="herr-mono"
          @click="poner(desdeOctal(h)!)"
        >
          {{ h }}
        </NButton>
      </div>
    </div>

    <p v-if="escribeOtros" class="herr-error" role="status" data-testid="chmod-aviso">
      {{ t.avisoOtros }}
    </p>

    <div>
      <label class="herr-etiqueta" for="chmod-archivo">{{ t.archivo }}</label>
      <NInput
        v-model:value="archivo"
        :input-props="{ id: 'chmod-archivo', spellcheck: false, autocomplete: 'off' }"
        class="herr-mono"
        maxlength="200"
      />
    </div>

    <div>
      <div class="herr-etiqueta">{{ t.ejemplo }}</div>
      <div class="herr-fila">
        <code class="chmod-comando" data-testid="chmod-comando">{{ comando }}</code>
        <NButton secondary size="small" @click="copiar(comando)">
          {{ textos.herramientas.copiar }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chmod-tabla {
  border-collapse: collapse;
}
.chmod-tabla th,
.chmod-tabla td {
  padding: 4px 18px 4px 0;
  text-align: left;
  font-weight: normal;
}
.chmod-tabla thead th {
  font-size: 12px;
  opacity: 0.72;
}
.chmod-especiales {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chmod-comando {
  font-family: var(--fuente-mono);
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--color-fondo-codigo, rgba(127, 127, 127, 0.14));
  word-break: break-all;
}
</style>
