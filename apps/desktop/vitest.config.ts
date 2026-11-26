import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Guardián: ninguna prueba usa la carpeta de datos real (ver el archivo).
    setupFiles: ['test/soporte/guardian-datos-reales.ts'],
  },
});
