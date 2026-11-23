import { describe, expect, it } from 'vitest';
import { ordenTerminalUnix, terminalesUnix } from '../src/plataforma/terminalUnix';

describe('terminales de Linux y macOS', () => {
  it('Linux: la del sistema y las conocidas instaladas, con la carpeta como argumento', () => {
    const hay = new Set(['/usr/bin/x-terminal-emulator', '/usr/bin/konsole']);
    const ts = terminalesUnix('linux', (r) => hay.has(r));
    expect(ts.map((t) => t.id)).toEqual(['sistema', 'konsole']);
    expect(ordenTerminalUnix('linux', ts[1]!, '/home/u/Mi Proyecto')).toEqual({
      cmd: '/usr/bin/konsole',
      args: ['--workdir', '/home/u/Mi Proyecto'],
      heredaEntorno: true,
    });
    expect(ordenTerminalUnix('linux', ts[0]!, '/home/u/p')).toEqual({
      cmd: '/usr/bin/x-terminal-emulator',
      args: [],
      heredaEntorno: true,
    });
  });

  it('macOS: Terminal e iTerm con `open -a`, que NO pasa el entorno', () => {
    const hay = new Set(['/System/Applications/Utilities/Terminal.app', '/Applications/iTerm.app']);
    const ts = terminalesUnix('darwin', (r) => hay.has(r));
    expect(ts.map((t) => [t.id, t.nombre])).toEqual([
      ['sistema', 'Terminal'],
      ['iterm', 'iTerm2'],
    ]);
    expect(ordenTerminalUnix('darwin', ts[0]!, '/Users/u/p q')).toEqual({
      cmd: '/usr/bin/open',
      args: ['-a', 'Terminal', '/Users/u/p q'],
      heredaEntorno: false,
    });
  });

  it('otro sistema o una terminal ajena: nada', () => {
    expect(terminalesUnix('win32', () => true)).toEqual([]);
    expect(
      ordenTerminalUnix('linux', { id: 'iterm', nombre: 'iTerm2', ruta: '/x' }, '/p'),
    ).toBeNull();
  });
});
