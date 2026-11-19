import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { usePreferencias } from './stores/preferencias';
import './estilos.css';

const pinia = createPinia();
const app = createApp(App).use(pinia).use(router);

// Tema e idioma antes de pintar: sin destello del tema o del idioma equivocado. Si no se pueden
// leer, la interfaz arranca igual con los valores por defecto.
void usePreferencias(pinia)
  .cargar()
  .catch(() => undefined)
  .finally(() => app.mount('#app'));
