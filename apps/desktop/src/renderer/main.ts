import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { z } from 'zod';
import App from './App.vue';
import { router } from './router';
import { usePreferencias } from './stores/preferencias';
import './estilos.css';

// La CSP no admite `eval`: sin esto zod intenta `new Function` para acelerar y deja un aviso en la
// consola en cada arranque.
z.config({ jitless: true });

const pinia = createPinia();
const app = createApp(App).use(pinia).use(router);

// Tema e idioma antes de pintar: sin destello del tema o del idioma equivocado. Si no se pueden
// leer, la interfaz arranca igual con los valores por defecto.
void usePreferencias(pinia)
  .cargar()
  .catch(() => undefined)
  .finally(() => app.mount('#app'));
