import { defineConfig } from 'vitest/config';

/** Pruebas reales en Windows: descargan binarios y levantan procesos. */
export default defineConfig({
  test: {
    include: ['test/integracion/**/*.int.test.ts'],
    // pgvector instala Visual Studio Build Tools (UAC, ~6 GB): solo con `npm run test:win:pgvector`.
    exclude: ['test/integracion/pgvector.int.test.ts', '**/node_modules/**'],
    testTimeout: 10 * 60_000,
    hookTimeout: 5 * 60_000,
    fileParallelism: false,
    silent: false,
    reporters: ['verbose'],
  },
});
