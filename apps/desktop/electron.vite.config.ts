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
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } },
    },
  },
  renderer: {
    plugins: [vue()],
    resolve: { alias: { '@': resolve(__dirname, 'src/renderer') } },
  },
});
