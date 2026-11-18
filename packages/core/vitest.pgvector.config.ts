import { defineConfig } from 'vitest/config';

/**
 * Prueba real de pgvector (`npm run test:win:pgvector`). Instala Visual Studio Build Tools con
 * winget (Windows pide permiso de administrador, ~6 GB): correrla solo con permiso del usuario.
 */
export default defineConfig({
  test: {
    include: ['test/integracion/pgvector.int.test.ts'],
    testTimeout: 120 * 60_000,
    hookTimeout: 10 * 60_000,
    fileParallelism: false,
    silent: false,
    reporters: ['verbose'],
  },
});
