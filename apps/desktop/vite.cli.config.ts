import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * El cliente `wolf` (D32) como un solo archivo CommonJS: `out/cli/wolf.cjs`. La app lo copia a
 * `<datos>/bin/cli/` y `wolf.cmd` lo corre con su propio Electron como Node. Sin dependencias
 * externas: solo módulos `node:`.
 */
export default defineConfig({
  build: {
    outDir: 'out/cli',
    emptyOutDir: true,
    target: 'node22',
    minify: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, 'src/cli/wolf.ts'),
      formats: ['cjs'],
      fileName: () => 'wolf.cjs',
    },
    rollupOptions: { external: [/^node:/] },
  },
});
