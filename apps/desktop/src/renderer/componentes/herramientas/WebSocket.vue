<script setup lang="ts">
import { NButton, NInput } from 'naive-ui';
import { computed, onBeforeUnmount, ref } from 'vue';
import { es } from '../../i18n/es';
import { agregarAcotado, recortarTexto, validarUrlWs } from '../../utilidades/herramientas';

const t = es.herramientas.websocket;
const MAX_MENSAJES = 500;
/** Lo que se muestra de cada mensaje (10 KB); el resto se descarta. */
const MAX_MOSTRADO = 10 * 1024;

interface Entrada {
  id: number;
  hora: string;
  tipo: 'enviado' | 'recibido' | 'sistema' | 'error';
  texto: string;
}

const url = ref('ws://127.0.0.1:8080');
const mensaje = ref('');
const estado = ref<'desconectado' | 'conectando' | 'conectado'>('desconectado');
const registro = ref<Entrada[]>([]);
const errorUrl = ref<string | null>(null);
let ws: WebSocket | null = null;
let siguiente = 0;

function anotar(tipo: Entrada['tipo'], texto: string): void {
  registro.value = agregarAcotado(
    registro.value,
    {
      id: siguiente++,
      hora: new Date().toLocaleTimeString('es'),
      tipo,
      texto: recortarTexto(texto, MAX_MOSTRADO),
    },
    MAX_MENSAJES,
  );
}

/** Solo la URL ws:// o wss:// escrita por el usuario. */
function conectar(): void {
  const destino = validarUrlWs(url.value);
  errorUrl.value = destino ? null : t.urlInvalida;
  if (!destino) return;
  cerrar();
  estado.value = 'conectando';
  anotar('sistema', `${t.conectando} ${destino}`);
  let socket: WebSocket;
  try {
    socket = new WebSocket(destino);
  } catch (e) {
    estado.value = 'desconectado';
    anotar('error', (e as Error).message || t.error);
    return;
  }
  ws = socket;
  socket.binaryType = 'arraybuffer';
  socket.onopen = () => {
    if (ws !== socket) return;
    estado.value = 'conectado';
    anotar('sistema', t.conectado);
  };
  socket.onmessage = (e: MessageEvent<unknown>) => {
    if (ws !== socket) return;
    const d = e.data;
    anotar('recibido', typeof d === 'string' ? d : t.binario((d as ArrayBuffer).byteLength ?? 0));
  };
  socket.onerror = () => {
    if (ws === socket) anotar('error', t.error);
  };
  socket.onclose = (e) => {
    if (ws !== socket) return;
    ws = null;
    estado.value = 'desconectado';
    anotar('sistema', t.cerrado(e.code, e.reason));
  };
}

function cerrar(): void {
  const s = ws;
  ws = null;
  if (s && s.readyState <= WebSocket.OPEN) s.close(1000);
  if (s) anotar('sistema', t.desconectado);
  estado.value = 'desconectado';
}

function enviar(): void {
  if (!ws || estado.value !== 'conectado' || !mensaje.value) return;
  ws.send(mensaje.value);
  anotar('enviado', mensaje.value);
  mensaje.value = '';
}

const textoEstado = computed(() => t[estado.value]);

onBeforeUnmount(() => {
  const s = ws;
  ws = null;
  s?.close(1000);
});
</script>

<template>
  <div class="herr">
    <div>
      <div class="herr-etiqueta">{{ t.url }}</div>
      <div class="herr-fila">
        <NInput v-model:value="url" class="herr-mono campo" @keyup.enter="conectar" />
        <NButton v-if="estado === 'desconectado'" type="primary" @click="conectar">{{
          t.conectar
        }}</NButton>
        <NButton v-else secondary @click="cerrar">{{ t.desconectar }}</NButton>
      </div>
      <p v-if="errorUrl" class="herr-error">{{ errorUrl }}</p>
      <p v-else class="herr-tenue" aria-live="polite">{{ textoEstado }}</p>
    </div>
    <div class="herr-fila">
      <NInput
        v-model:value="mensaje"
        type="textarea"
        class="herr-mono campo"
        :autosize="{ minRows: 1, maxRows: 5 }"
        :placeholder="t.mensaje"
        :disabled="estado !== 'conectado'"
        @keydown.enter.exact.prevent="enviar"
      />
      <NButton :disabled="estado !== 'conectado' || !mensaje" @click="enviar">{{
        t.enviar
      }}</NButton>
    </div>
    <div class="registro" role="log">
      <p v-if="!registro.length" class="herr-tenue">{{ t.vacio }}</p>
      <div v-for="m in registro" :key="m.id" class="linea" :class="m.tipo">
        <span class="hora">{{ m.hora }}</span>
        <span class="marca">{{
          m.tipo === 'enviado' ? '↑' : m.tipo === 'recibido' ? '↓' : m.tipo === 'error' ? '!' : '·'
        }}</span>
        <span class="texto">{{ m.texto }}</span>
      </div>
    </div>
    <p class="herr-tenue">{{ t.tope }}</p>
  </div>
</template>

<style scoped>
.campo {
  flex: 1;
}
.registro {
  max-height: 420px;
  min-height: 160px;
  overflow: auto;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  font-family: var(--fuente-mono);
  font-size: 12px;
}
.linea {
  display: flex;
  gap: 8px;
  padding: 1px 0;
}
.hora {
  opacity: 0.5;
  flex: none;
}
.marca {
  width: 10px;
  flex: none;
  text-align: center;
}
.texto {
  white-space: pre-wrap;
  word-break: break-all;
}
.enviado .marca {
  color: #6470e0;
}
.recibido .marca {
  color: #16a34a;
}
.error {
  color: #dc2626;
}
.sistema {
  opacity: 0.7;
}
</style>
