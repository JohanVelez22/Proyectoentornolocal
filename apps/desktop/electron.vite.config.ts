import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

const core = resolve(__dirname, '../../packages/core/src/index.ts');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@pel/core'] })],
    resolve: { alias: { '@pel/core': core } },
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
