<script setup lang="ts">
import { NButton, NCheckbox, NInput, NInputNumber, NSwitch, NTabPane, NTabs } from 'naive-ui';
import { computed, ref } from 'vue';
import { mensajeDeError } from '../../composables/useAccion';
import { useCopiar } from '../../composables/useHerramienta';
import { textos } from '../../i18n';
import {
  aBase64,
  bcryptComparar,
  bcryptHash,
  bcryptTrunca,
  codificarUrl,
  COSTE_BCRYPT_MAX,
  decodificarJwt,
  decodificarUrl,
  desdeBase64,
  generarContrasena,
  hashTexto,
  type JwtDecodificado,
} from '../../utilidades/herramientas';

const t = textos.herramientas.cripto;
const copiar = useCopiar();

// Hash
const textoHash = ref('');
const hashes = ref<[string, string][]>([]);
const coste = ref(10);
const bcrypt = ref('');
const bcryptVerificar = ref('');
const verificacion = ref<boolean | null>(null);
const ocupadoBcrypt = ref(false);
const errorHash = ref<string | null>(null);

async function calcularHashes(): Promise<void> {
  const v = textoHash.value;
  hashes.value = await Promise.all(
    (['MD5', 'SHA-1', 'SHA-256'] as const).map(
      async (a) => [a, await hashTexto(a, v)] as [string, string],
    ),
  );
}

async function calcularBcrypt(): Promise<void> {
  errorHash.value = null;
  ocupadoBcrypt.value = true;
  try {
    bcrypt.value = await bcryptHash(textoHash.value, coste.value);
  } catch (e) {
    errorHash.value = mensajeDeError(e);
  } finally {
    ocupadoBcrypt.value = false;
  }
}

async function verificarBcrypt(): Promise<void> {
  errorHash.value = null;
  ocupadoBcrypt.value = true;
  try {
    verificacion.value = await bcryptComparar(textoHash.value, bcryptVerificar.value.trim());
  } catch (e) {
    errorHash.value = mensajeDeError(e);
  } finally {
    ocupadoBcrypt.value = false;
  }
}

// Base64 y URL
const textoCodif = ref('');
const variante = ref(false);
const salidaCodif = ref('');
const errorCodif = ref<string | null>(null);

function codif(fn: () => string): void {
  errorCodif.value = null;
  try {
    salidaCodif.value = fn();
  } catch (e) {
    salidaCodif.value = '';
    errorCodif.value = mensajeDeError(e);
  }
}

// UUID y contraseñas
const uuids = ref<string[]>([crypto.randomUUID()]);
function generarUuids(n: number): void {
  uuids.value = Array.from({ length: n }, () => crypto.randomUUID());
}
const longitud = ref(20);
const conjuntos = ref({ mayusculas: true, minusculas: true, numeros: true, simbolos: true });
const contrasena = ref('');
const errorContrasena = ref<string | null>(null);

function nuevaContrasena(): void {
  errorContrasena.value = null;
  try {
    contrasena.value = generarContrasena(longitud.value, conjuntos.value);
  } catch (e) {
    contrasena.value = '';
    errorContrasena.value = mensajeDeError(e);
  }
}
nuevaContrasena();

// JWT
const token = ref('');
const jwt = computed<{ ok: JwtDecodificado } | { error: string } | null>(() => {
  if (!token.value.trim()) return null;
  try {
    return { ok: decodificarJwt(token.value) };
  } catch (e) {
    return { error: mensajeDeError(e) };
  }
});
const json = (v: unknown): string => JSON.stringify(v, null, 2);
</script>

<template>
  <NTabs type="line" size="small" animated>
    <NTabPane name="hash" :tab="t.hash">
      <div class="herr">
        <NInput
          v-model:value="textoHash"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :placeholder="t.texto"
        />
        <div class="herr-fila">
          <NButton type="primary" @click="calcularHashes">{{ t.calcular }}</NButton>
        </div>
        <dl v-if="hashes.length" class="herr-datos">
          <template v-for="[a, h] in hashes" :key="a">
            <dt>{{ a }}</dt>
            <dd class="copiable" @click="copiar(h)">{{ h }}</dd>
          </template>
        </dl>
        <div class="herr-fila">
          <span class="herr-etiqueta">{{ t.bcryptCoste }}</span>
          <NInputNumber
            v-model:value="coste"
            :min="4"
            :max="COSTE_BCRYPT_MAX"
            size="small"
            class="coste"
          />
          <NButton secondary :loading="ocupadoBcrypt" @click="calcularBcrypt">{{
            t.bcrypt
          }}</NButton>
        </div>
        <p v-if="bcryptTrunca(textoHash)" class="herr-tenue">{{ t.bcryptTrunca }}</p>
        <pre v-if="bcrypt" class="herr-salida copiable" @click="copiar(bcrypt)">{{ bcrypt }}</pre>
        <div class="herr-fila">
          <NInput
            v-model:value="bcryptVerificar"
            class="herr-mono campo"
            :placeholder="t.bcryptVerificar"
          />
          <NButton
            secondary
            :disabled="!bcryptVerificar"
            :loading="ocupadoBcrypt"
            @click="verificarBcrypt"
            >{{ t.verificar }}</NButton
          >
        </div>
        <p v-if="verificacion !== null" :class="verificacion ? 'herr-ok' : 'herr-error'">
          {{ verificacion ? t.coincide : t.noCoincide }}
        </p>
        <p v-if="errorHash" class="herr-error">{{ errorHash }}</p>
      </div>
    </NTabPane>

    <NTabPane name="codificar" :tab="t.pestanaCodificar">
      <div class="herr">
        <NInput
          v-model:value="textoCodif"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 3, maxRows: 10 }"
          :placeholder="t.texto"
        />
        <div class="herr-fila">
          <NButton secondary @click="codif(() => aBase64(textoCodif, variante))">{{
            t.codificarBase64
          }}</NButton>
          <NButton secondary @click="codif(() => desdeBase64(textoCodif))">{{
            t.decodificarBase64
          }}</NButton>
          <NSwitch v-model:value="variante" size="small" />
          <span class="herr-tenue">{{ t.base64Url }}</span>
        </div>
        <div class="herr-fila">
          <NButton secondary @click="codif(() => codificarUrl(textoCodif))">{{ t.url }}</NButton>
          <NButton secondary @click="codif(() => decodificarUrl(textoCodif))">{{
            t.decodificarUrl
          }}</NButton>
        </div>
        <p v-if="errorCodif" class="herr-error">{{ errorCodif }}</p>
        <template v-else-if="salidaCodif">
          <div class="herr-etiqueta">{{ t.salida }}</div>
          <pre class="herr-salida copiable" @click="copiar(salidaCodif)">{{ salidaCodif }}</pre>
        </template>
      </div>
    </NTabPane>

    <NTabPane name="generar" :tab="t.pestanaGenerar">
      <div class="herr">
        <div class="herr-etiqueta">{{ t.uuid }}</div>
        <pre class="herr-salida copiable" @click="copiar(uuids.join('\n'))">{{
          uuids.join('\n')
        }}</pre>
        <div class="herr-fila">
          <NButton secondary @click="generarUuids(1)">{{ t.generar }}</NButton>
          <NButton secondary @click="generarUuids(10)">{{ t.generarDiez }}</NButton>
        </div>
        <div class="herr-etiqueta">{{ t.contrasena }}</div>
        <div class="herr-fila">
          <span class="herr-tenue">{{ t.longitud }}</span>
          <NInputNumber v-model:value="longitud" :min="4" :max="256" size="small" class="coste" />
          <NCheckbox v-model:checked="conjuntos.mayusculas">{{ t.mayusculas }}</NCheckbox>
          <NCheckbox v-model:checked="conjuntos.minusculas">{{ t.minusculas }}</NCheckbox>
          <NCheckbox v-model:checked="conjuntos.numeros">{{ t.numeros }}</NCheckbox>
          <NCheckbox v-model:checked="conjuntos.simbolos">{{ t.simbolos }}</NCheckbox>
        </div>
        <div class="herr-fila">
          <NButton type="primary" @click="nuevaContrasena">{{ t.generar }}</NButton>
        </div>
        <p v-if="errorContrasena" class="herr-error">{{ errorContrasena }}</p>
        <pre v-else-if="contrasena" class="herr-salida copiable" @click="copiar(contrasena)">{{
          contrasena
        }}</pre>
      </div>
    </NTabPane>

    <NTabPane name="jwt" :tab="t.jwt">
      <div class="herr">
        <NInput
          v-model:value="token"
          type="textarea"
          class="herr-mono"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :placeholder="t.jwtToken"
        />
        <template v-if="jwt && 'ok' in jwt">
          <p class="aviso" role="note">{{ jwt.ok.aviso }}</p>
          <p v-if="jwt.ok.vencido !== null" :class="jwt.ok.vencido ? 'herr-error' : 'herr-ok'">
            {{ jwt.ok.vencido ? t.vencido : t.vigente }}
          </p>
          <div class="herr-etiqueta">{{ t.cabecera }}</div>
          <pre class="herr-salida">{{ json(jwt.ok.cabecera) }}</pre>
          <div class="herr-etiqueta">{{ t.carga }}</div>
          <pre class="herr-salida">{{ json(jwt.ok.carga) }}</pre>
        </template>
        <p v-else-if="jwt" class="herr-error">{{ jwt.error }}</p>
      </div>
    </NTabPane>
  </NTabs>
</template>

<style scoped>
.coste {
  width: 110px;
}
.campo {
  flex: 1;
}
.copiable {
  cursor: copy;
}
.aviso {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  color: #b45309;
  background: rgba(234, 179, 8, 0.12);
}
</style>
