import { describe, expect, it } from 'vitest';
import { literalPowerShell } from '../src/plataforma/literalPowerShell';
import { literal as literalHosts, scriptCopiaHosts } from '../src/plataforma/hostsAdmin';
import {
  cuerpoQuitarReglas,
  cuerpoRestaurarReglas,
  scriptCargador,
  scriptExportarReglas,
} from '../src/plataforma/firewallCambiosWin';
import { scriptQuitarCarpeta } from '../src/plataforma/redWin';
import { scriptLanzamiento } from '../src/plataforma/lanzarOculto';
import { scriptLeerVariableUsuario, scriptVariableUsuario } from '../src/plataforma/diagnosticoWin';
import { scriptEscribir, scriptLeer } from '../src/plataforma/pathUsuarioWin';
import { scriptNvidiaSmi } from '../src/plataforma/equipoWin';
import { scriptDuenoDeRuta } from '../src/plataforma/win';
import {
  analizarPowerShell,
  esperarLiteralExacto,
  VALORES_HOSTILES,
} from './soporte/parserPowerShell';

describe('literalPowerShell (único literal compartido)', () => {
  it('duplica el apóstrofo y las cuatro comillas tipográficas', () => {
    expect(literalPowerShell("a'b‘c’d‚e‛f")).toBe("'a''b‘‘c’’d‚‚e‛‛f'");
  });
  it('hosts reutiliza el mismo literal', () => {
    expect(literalHosts).toBe(literalPowerShell);
  });
});

type Caso = { nombre: string; generar: (v: string) => string };

const CASOS: Caso[] = [
  {
    nombre: 'hosts (scriptCopiaHosts)',
    generar: (v) =>
      scriptCopiaHosts({
        temporal: v,
        destino: v,
        limiteUnixMs: null,
        hashTemporal: 'AA',
        hashPrevio: null,
      }),
  },
  { nombre: 'cargador del cortafuegos', generar: (v) => scriptCargador(v, 'a'.repeat(64)) },
  {
    nombre: 'cortafuegos: quitar reglas',
    generar: (v) =>
      cuerpoQuitarReglas(
        [
          {
            id: 'a'.repeat(32),
            nombre: 'Regla de prueba',
            programa: v,
            raiz: v,
            tipo: 'propia',
            temporal: v,
          },
        ],
        null,
      ),
  },
  {
    nombre: 'cortafuegos: restaurar reglas',
    generar: (v) =>
      cuerpoRestaurarReglas(
        [{ id: 'a'.repeat(32), sha256: 'b'.repeat(64), raiz: v, tipo: 'propia', temporal: v }],
        null,
      ),
  },
  {
    nombre: 'D53: dejar de compartir (nombre y ruta)',
    generar: (v) => scriptQuitarCarpeta(v, v, 1),
  },
  {
    nombre: 'lanzador oculto',
    generar: (v) => scriptLanzamiento({ comando: v, args: [], cwd: v }, v),
  },
  { nombre: 'variable de usuario: leer', generar: (v) => scriptLeerVariableUsuario(v) },
  { nombre: 'variable de usuario: borrar', generar: (v) => scriptVariableUsuario(v, true) },
  { nombre: 'variable de usuario: fijar', generar: (v) => scriptVariableUsuario(v, false) },
  { nombre: 'PATH de usuario: leer', generar: (v) => scriptLeer(v) },
  { nombre: 'PATH de usuario: escribir', generar: (v) => scriptEscribir(v, 'String') },
  { nombre: 'nvidia-smi', generar: (v) => scriptNvidiaSmi([v, v]) },
  { nombre: 'dueño de una ruta', generar: (v) => scriptDuenoDeRuta(v) },
];

describe.skipIf(process.platform !== 'win32')(
  'cada script generado trae el valor hostil como un único literal (se parsea, no se ejecuta)',
  () => {
    const combinaciones = CASOS.flatMap((c) => VALORES_HOSTILES.map((v) => ({ c, v })));
    const analisis = analizarPowerShell(combinaciones.map(({ c, v }) => c.generar(v)));
    combinaciones.forEach(({ c, v }, i) => {
      it(`${c.nombre} con ${JSON.stringify(v.slice(0, 3))}`, () => {
        expect(esperarLiteralExacto(analisis[i]!, v)).toEqual([]);
      });
    });
  },
);

describe('los nombres de regla hostiles se rechazan antes de generar nada', () => {
  it('scriptExportarReglas', () => {
    for (const v of VALORES_HOSTILES) expect(() => scriptExportarReglas([v])).toThrow();
  });
});
