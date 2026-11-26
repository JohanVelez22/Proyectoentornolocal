import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

const core = resolve(__dirname, '../../packages/core/src/index.ts');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@pel/core'] })],
    resolve: { alias: { '@pel/core': core } },
    build: {
      rollupOptions: {
        // Además de la app, el proceso de trabajo del conversor (`utilityProcess`, D34).
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          conversorTrabajo: resolve(__dirname, 'src/main/conversorTrabajo.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    // Con sandbox:true el preload debe ser CommonJS.
    build: {
      rollupOptions: {
        // Además del puente de la app, el de la ventana de captura (D35), con sus propios canales.
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          captura: resolve(__dirname, 'src/preload/captura.ts'),
        },
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    plugins: [vue()],
    resolve: { alias: { '@': resolve(__dirname, 'src/renderer') } },
    build: {
      rollupOptions: {
        // La ventana principal y la de captura (D35) son dos páginas.
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          captura: resolve(__dirname, 'src/renderer/captura/index.html'),
        },
      },
    },
  },
});
