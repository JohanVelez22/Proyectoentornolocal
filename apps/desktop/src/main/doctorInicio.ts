/** Retraso de la revisión del Doctor al iniciar: deja arrancar primero los servicios. */
export const RETRASO_DOCTOR_INICIO_MS = 15_000;

/**
 * Corre el Doctor una vez en segundo plano, sin bloquear el arranque. Si encuentra errores, el
 * propio Doctor publica el aviso `doctor.hallazgos`. Devuelve la función para cancelarlo.
 */
export function programarDoctorAlIniciar(
  n: { doctor: { revisar(): Promise<unknown> } },
  retrasoMs: number = RETRASO_DOCTOR_INICIO_MS,
): () => void {
  const t = setTimeout(() => {
    n.doctor.revisar().catch((e: unknown) => {
      console.error('El Doctor no pudo revisar al iniciar:', e instanceof Error ? e.message : e);
    });
  }, retrasoMs);
  t.unref?.();
  return () => clearTimeout(t);
}
