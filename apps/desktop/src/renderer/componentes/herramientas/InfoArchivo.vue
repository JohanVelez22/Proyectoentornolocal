<script setup lang="ts">
import { NSpin } from 'naive-ui';
import { ref } from 'vue';
import { crearTrabajador, useCopiar } from '../../composables/useHerramienta';
import { formatearFecha, formatearNumero, textos } from '../../i18n';
import { ejecutarEnTrabajador, hashTexto, tamanoLegible } from '../../utilidades/herramientas';

const t = textos.herramientas.infoArchivo;
const MAX_BYTES = 200 * 1024 * 1024;
const copiar = useCopiar();

interface Info {
  nombre: string;
  tamano: number;
  tipo: string;
  modificado: string;
}

const info = ref<Info | null>(null);
const hashes = ref<[string, string][]>([]);
const calculando = ref(false);
const error = ref<string | null>(null);
let turno = 0;

/**
 * El archivo se elige con el input del navegador y se lee en la interfaz: no hace falta una ruta
 * del núcleo y la ruta completa no sale del diálogo.
 */
async function elegido(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  const mio = ++turno;
  error.value = null;
  hashes.value = [];
  info.value = {
    nombre: archivo.name,
    tamano: archivo.size,
    tipo: archivo.type || t.sinTipo,
    modificado: formatearFecha(archivo.lastModified, { dateStyle: 'medium', timeStyle: 'medium' }),
  };
  if (archivo.size > MAX_BYTES) {
    error.value = t.grande;
    return;
  }
  calculando.value = true;
  try {
    const datos = new Uint8Array(await archivo.arrayBuffer());
    const [sha1, sha256] = await Promise.all([
      hashTexto('SHA-1', datos),
      hashTexto('SHA-256', datos),
    ]);
    // MD5 en un Worker: con archivos grandes no congela la ventana.
    const copia = datos.buffer;
    const r = await ejecutarEnTrabajador<string>(
      { tipo: 'md5', datos: copia },
      crearTrabajador,
      120_000,
      [copia],
    );
    if (mio !== turno) return;
    hashes.value = [
      ['MD5', r.estado === 'ok' ? r.resultado : '—'],
      ['SHA-1', sha1],
      ['SHA-256', sha256],
    ];
  } catch (e) {
    if (mio === turno) error.value = (e as Error).message;
  } finally {
    if (mio === turno) calculando.value = false;
  }
}
</script>

<template>
  <div class="herr">
    <div class="herr-fila">
      <label class="boton">
        <input type="file" @change="elegido" />
        <span>{{ t.elegir }}</span>
      </label>
      <span class="herr-tenue">{{ t.ayuda }}</span>
    </div>
    <dl v-if="info" class="herr-datos">
      <dt>{{ t.nombre }}</dt>
      <dd>{{ info.nombre }}</dd>
      <dt>{{ t.tamano }}</dt>
      <dd>{{ tamanoLegible(info.tamano) }} ({{ formatearNumero(info.tamano) }} B)</dd>
      <dt>{{ t.tipo }}</dt>
      <dd>{{ info.tipo }}</dd>
      <dt>{{ t.modificado }}</dt>
      <dd>{{ info.modificado }}</dd>
      <template v-for="[a, h] in hashes" :key="a">
        <dt>{{ a }}</dt>
        <dd class="copiable" @click="copiar(h)">{{ h }}</dd>
      </template>
    </dl>
    <div v-if="calculando" class="herr-fila">
      <NSpin :size="16" />
      <span class="herr-tenue">{{ t.calculando }}</span>
    </div>
    <p v-if="error" class="herr-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.boton {
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  height: 34px;
  border-radius: 6px;
  background: #4f5bd5;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.boton:focus-within {
  outline: 2px solid rgba(79, 91, 213, 0.5);
  outline-offset: 2px;
}
.boton input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.copiable {
  cursor: copy;
}
</style>
