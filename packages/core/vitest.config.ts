import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Las pruebas de integración reales (*.int.test.ts) solo corren con `npm run test:win`.
  test: { include: ['test/**/*.test.ts'], exclude: ['test/integracion/**', '**/node_modules/**'] },
});
