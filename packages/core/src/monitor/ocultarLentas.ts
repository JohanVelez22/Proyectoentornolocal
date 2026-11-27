/**
 * El log de PostgreSQL (`postgresql.log`) lleva, con `log_min_duration_statement`, el SQL de las
 * consultas lentas con sus literales (`LOG:  duration: … statement: …`, `execute …:`) y, con
 * `DETAIL:  parameters: …`, los valores enlazados. Ese contenido solo se muestra en Bases de datos ›
 * Consultas lentas (con sus reglas de datos reales); el visor de registros y el MCP no lo ven.
 */

export const MARCA_CONSULTA_LENTA =
  '[consulta lenta oculta: véase Bases de datos › Consultas lentas]';

const CON_SQL =
  /\bLOG:\s+(?:duration:\s*[0-9.]+\s*ms\s+)?(?:statement|execute [^:]*|parse [^:]*|bind [^:]*):|\bSTATEMENT:\s/;
const PARAMETROS = /\bDETAIL:\s+parameters:/;

/** ¿Es una fuente del log de PostgreSQL? (`servicio:postgresql`, `servicio:postgresql-17`…). */
export const esFuentePostgres = (id: string): boolean => id.startsWith('servicio:postgresql');

/**
 * Filtro con estado (las continuaciones de una sentencia llegan en líneas aparte, sangradas con un
 * tabulador). Se empieza «dentro de una sentencia»: lo primero que llega puede ser la cola de una
 * que empezó antes, y ante la duda se oculta.
 */
export class FiltroLentasPg {
  private dentro = true;

  procesar(lineas: readonly string[]): string[] {
    const salida: string[] = [];
    for (const l of lineas) {
      if (/^\s/.test(l)) {
        // Continuación (o línea vacía): pertenece a la anterior.
        if (!this.dentro) salida.push(l);
        continue;
      }
      this.dentro = false;
      if (PARAMETROS.test(l)) {
        this.dentro = true;
        continue;
      }
      if (CON_SQL.test(l)) {
        this.dentro = true;
        salida.push(MARCA_CONSULTA_LENTA);
        continue;
      }
      salida.push(l);
    }
    return salida;
  }
}
