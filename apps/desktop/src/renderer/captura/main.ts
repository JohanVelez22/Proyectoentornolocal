import { createApp } from 'vue';
import Captura from './Captura.vue';

// La ventana de captura es una página aparte de la app: sin router, sin tienda y sin red.
createApp(Captura).mount('#app');
