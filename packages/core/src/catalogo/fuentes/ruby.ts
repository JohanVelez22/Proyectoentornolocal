import type { SoporteVersion } from '../catalogo';
import { nombreEjecutable } from '../../plataforma/sistema';
import { fuenteGithub } from './github';
import type { FuenteVersiones } from './tipos';

/**
 * Fin de soporte (AAAA-MM-DD) de las ramas de Ruby que lo tienen publicado en
 * ruby-lang.org/en/downloads/branches. Una rama que no está (la más nueva) sigue con soporte.
 */
const FIN_SOPORTE_RUBY: Readonly<Record<string, string>> = {
  '3.2': '2026-04-01',
  '3.3': '2027-03-31',
};

const base = fuenteGithub({
  servicio: 'ruby',
  dueno: 'oneclick',
  repo: 'rubyinstaller2',
  // Etiqueta `RubyInstaller-3.4.13-1`; el número tras el guion es la compilación del instalador.
  prefijoTag: 'RubyInstaller-',
  // El `.7z` (sin Devkit ni instalador): no escribe en el registro ni en el PATH del usuario. Su
  // SHA-256 es el `digest` que GitHub da al asset.
  asset: (v) => `rubyinstaller-${v}-x64.7z`,
  formato: '7z',
  subcarpeta: (v) => `rubyinstaller-${v}-x64`,
  ejecutable: `bin/${nombreEjecutable('ruby')}`,
});

/**
 * Ruby (RubyInstaller2): releases de `oneclick/rubyinstaller2`. El soporte de cada rama sale de la
 * tabla de arriba, no de "la última es la actual" (3.3 sigue con soporte aunque haya 3.4 y 4.0).
 */
export const fuenteRuby: FuenteVersiones = {
  ...base,
  async listar(ctx) {
    const versiones = await base.listar(ctx);
    const ahora = (ctx.ahora ?? new Date()).toISOString().slice(0, 10);
    return versiones.map((v) => {
      const fin = FIN_SOPORTE_RUBY[v.rama ?? ''] ?? null;
      const soporte: SoporteVersion =
        v.soporte === 'preview' ? 'preview' : fin !== null && fin <= ahora ? 'fin' : 'actual';
      return { ...v, soporte, finSoporte: fin };
    });
  },
};
