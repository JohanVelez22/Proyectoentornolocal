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
// Parámetros enlazados y valores de una violación de clave o de una fila (DETAIL de un error).
const DETALLE_CON_DATOS = /\bDETAIL:\s+(?:parameters:|Key \(|Failing row contains)/;

/** ¿Es una fuente del log de PostgreSQL? (`servicio:postgresql`, `servicio:postgresql-17`…). */
export const esFuentePostgres = (id: string): boolean => id.startsWith('servicio:postgresql');

/**
 * Filtro con estado (las continuaciones de una sentencia llegan en líneas aparte, sangradas con un
 * tabulador). Se empieza «dentro de una sentencia»: lo primero que llega puede ser la cola de una
 * que empezó antes, y ante la duda se oculta. Quien lee por trozos (la cola que sigue un archivo)
 * avisa con `continuacion` cuando un trozo no empieza en un inicio de línea, y con
 * `reiniciarDuda()` cuando se saltó parte del archivo.
 */
export class FiltroLentasPg {
  private dentro = true;

  /** Se perdió contexto (salto en el archivo): se oculta hasta la siguiente cabecera de mensaje. */
  reiniciarDuda(): void {
    this.dentro = true;
  }

  /**
   * Una línea (o un trozo de ella): su texto, o null si se oculta. Una línea sin sangría que no es
   * continuación es la cabecera de un mensaje nuevo.
   */
  linea(l: string, continuacion = false): string | null {
    if (continuacion || /^\s/.test(l)) return this.dentro ? null : l;
    this.dentro = false;
    if (DETALLE_CON_DATOS.test(l)) {
      this.dentro = true;
      return null;
    }
    if (CON_SQL.test(l)) {
      this.dentro = true;
      return MARCA_CONSULTA_LENTA;
    }
    return l;
  }

  procesar(lineas: readonly string[]): string[] {
    const salida: string[] = [];
    for (const l of lineas) {
      const r = this.linea(l);
      if (r !== null) salida.push(r);
    }
    return salida;
  }
}
