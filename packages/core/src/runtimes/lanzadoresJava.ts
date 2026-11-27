import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ErrorWolf } from '../errores';

/** Primer archivo de `carpeta` cuyo nombre cumple `patron` (orden alfabético), o null. */
async function archivoDe(carpeta: string, patron: RegExp): Promise<string | null> {
  try {
    const nombres = (await readdir(carpeta)).filter((n) => patron.test(n)).sort();
    return nombres[0] === undefined ? null : path.join(carpeta, nombres[0]);
  } catch {
    return null;
  }
}

/**
 * Maven se entrega como `mvn.cmd`, que no se puede lanzar sin shell. Aquí se arma lo mismo que
 * hace ese script: `java -classpath boot\plexus-classworlds-*.jar … Launcher <argumentos>`. El
 * JDK lo da `java` (el `JAVA_HOME` del proyecto) y `carpeta` es la raíz del proyecto.
 */
export async function lanzamientoMaven(
  maven: string,
  java: string,
  carpeta: string,
  args: readonly string[],
): Promise<{ cmd: string; args: string[] }> {
  const jar = await archivoDe(path.join(maven, 'boot'), /^plexus-classworlds-.+\.jar$/);
  if (jar === null) {
    throw new ErrorWolf(
      'runtimes.instalacion_incompleta',
      'La instalación de Maven está incompleta (falta plexus-classworlds). Reinstálela.',
      { nombre: 'Maven' },
    );
  }
  return {
    cmd: java,
    args: [
      '-classpath',
      jar,
      `-Dclassworlds.conf=${path.join(maven, 'bin', 'm2.conf')}`,
      `-Dmaven.home=${maven}`,
      `-Dmaven.multiModuleProjectDirectory=${carpeta}`,
      'org.codehaus.plexus.classworlds.launcher.Launcher',
      ...args,
    ],
  };
}

/**
 * Gradle se entrega como `gradle.bat`: se arma lo que hace ese script. Desde Gradle 8 el arranque
 * es `-jar lib\gradle-gradle-cli-main-*.jar`; antes, `lib\gradle-launcher-*.jar` con `GradleMain`.
 */
export async function lanzamientoGradle(
  gradle: string,
  java: string,
  args: readonly string[],
): Promise<{ cmd: string; args: string[] }> {
  const lib = path.join(gradle, 'lib');
  const agente = await archivoDe(
    path.join(lib, 'agents'),
    /^gradle-instrumentation-agent-.+\.jar$/,
  );
  const base = ['-Xmx64m', '-Xms64m', ...(agente ? [`-javaagent:${agente}`] : [])];
  const nuevo = await archivoDe(lib, /^gradle-gradle-cli-main-.+\.jar$/);
  if (nuevo !== null) {
    return {
      cmd: java,
      args: [...base, '-Dorg.gradle.appname=gradle', '-jar', nuevo, ...args],
    };
  }
  const viejo = await archivoDe(lib, /^gradle-launcher-.+\.jar$/);
  if (viejo === null) {
    throw new ErrorWolf(
      'runtimes.instalacion_incompleta',
      'La instalación de Gradle está incompleta (falta su lanzador). Reinstálela.',
      { nombre: 'Gradle' },
    );
  }
  return {
    cmd: java,
    args: [
      ...base,
      '-Dorg.gradle.appname=gradle',
      '-classpath',
      viejo,
      'org.gradle.launcher.GradleMain',
      ...args,
    ],
  };
}
