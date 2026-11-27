import { realpath } from 'node:fs/promises';
import path from 'node:path';
import { nombreDeRuta } from '../rutas/nombreDeRuta';
import { rutaDentroDe } from '../plataforma/sistema';
import { esNombreArchivoEnv } from '../proyectos/env/leer';
import { llevaSecreto } from '../proyectos/plantillas';
import { NOMBRE_SECRETO } from './editorCodigo';

/**
 * Qué archivos son «sensibles» para Buscar y el Diff de carpetas (D44). Es la misma regla que el
 * editor de código (D43): un `.env` (o `env` de CodeIgniter 4 en la raíz de un sitio), un archivo
 * con nombre o contenido de secreto (clave privada, token, credenciales…), un archivo de un sitio
 * con `datosReales` o uno con más de un enlace duro. De esos archivos nunca se muestra su
 * contenido (ni una línea, ni su contexto, ni un diff): solo se dice que existen y que coinciden o
 * son distintos. Abrirlos en el editor sigue pidiendo su refuerzo (o el gestor de .env).
 */

export interface SitioSensible {
  carpeta: string;
  datosReales: boolean;
}

export interface DetectorSensible {
  /** Por la ruta (sin leer el archivo): nombre, sitio con datos reales o enlaces duros. */
  porRuta(ruta: string, enlaces: number): boolean;
  /** Por el contenido (texto o bytes): parece una clave o una contraseña. */
  porContenido(contenido: string | Buffer): boolean;
}

/** Cada sitio con su carpeta tal cual y con su `realpath` (uniones y nombres 8.3 no esquivan la regla). */
export async function sitiosConRutasReales(
  sitios: readonly { carpeta: string; datosReales: boolean }[],
): Promise<SitioSensible[]> {
  const salida: SitioSensible[] = [];
  for (const s of sitios) {
    salida.push({ carpeta: path.resolve(s.carpeta), datosReales: s.datosReales });
    const real = await realpath(s.carpeta).catch(() => null);
    if (real) salida.push({ carpeta: real, datosReales: s.datosReales });
  }
  return salida;
}

export function crearDetectorSensible(sitios: readonly SitioSensible[]): DetectorSensible {
  return {
    porRuta(ruta, enlaces) {
      const nombre = nombreDeRuta(ruta);
      if (esNombreArchivoEnv(nombre) || NOMBRE_SECRETO.test(nombre)) return true;
      if (enlaces > 1) return true;
      const carpeta = path.dirname(ruta).toLowerCase();
      for (const s of sitios) {
        if (s.datosReales && rutaDentroDe(s.carpeta, ruta)) return true;
        if (nombre.toLowerCase() === 'env' && carpeta === s.carpeta.toLowerCase()) return true;
      }
      return false;
    },
    porContenido: (c) => llevaSecreto(c),
  };
}
