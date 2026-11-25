import { availableParallelism } from 'node:os';
import { defineConfig } from 'vitest/config';

/**
 * Las pruebas de integración reales (*.int.test.ts) solo corren con `npm run test:win`.
 *
 * Tiempos y paralelismo: muchas pruebas levantan servidores, procesos hijos o cifran con scrypt
 * (CPU a propósito). Con un archivo por trabajador y tantos trabajadores como núcleos, en una
 * máquina cargada (o con pocos núcleos) los 5 s por omisión de vitest se pasan sin que nada esté
 * mal: aparecían como fallos intermitentes distintos en cada corrida. Se deja la mitad de los
 * núcleos para el sistema y para los procesos que las propias pruebas lanzan, y un margen de 30 s
 * por prueba y por gancho. No hay reintentos: una prueba que falla, falla.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/integracion/**', '**/node_modules/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    maxWorkers: Math.max(2, Math.floor(availableParallelism() / 2)),
  },
});
