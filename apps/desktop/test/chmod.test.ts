import { describe, expect, it } from 'vitest';
import {
  alternarPermiso,
  aOctal,
  aSimbolico,
  comandoChmod,
  desdeOctal,
  desdeSimbolico,
  permisosVacios,
  type PermisosChmod,
} from '../src/renderer/utilidades/chmod';

const p = (octal: string): PermisosChmod => desdeOctal(octal)!;

describe('chmod: octal ↔ permisos', () => {
  it('755 son rwx para el propietario y r-x para grupo y otros', () => {
    expect(p('755')).toEqual({
      propietario: { r: true, w: true, x: true },
      grupo: { r: true, w: false, x: true },
      otros: { r: true, w: false, x: true },
      setuid: false,
      setgid: false,
      sticky: false,
    });
  });

  it('acepta 3 o 4 dígitos y rechaza lo que no es octal', () => {
    expect(aOctal(p('0644'))).toBe('644');
    expect(desdeOctal('')).toBeNull();
    expect(desdeOctal('75')).toBeNull();
    expect(desdeOctal('758')).toBeNull();
    expect(desdeOctal('77777')).toBeNull();
    expect(desdeOctal('rwx')).toBeNull();
    expect(desdeOctal(' 755 ')).not.toBeNull();
  });

  it('ida y vuelta de las 512 combinaciones de 3 dígitos', () => {
    for (let n = 0; n < 512; n++) {
      const o = n.toString(8).padStart(3, '0');
      expect(aOctal(p(o))).toBe(o);
    }
  });

  it('los bits especiales pasan a un cuarto dígito', () => {
    expect(aOctal(p('4755'))).toBe('4755');
    expect(p('4755').setuid).toBe(true);
    expect(p('2755').setgid).toBe(true);
    expect(p('1777').sticky).toBe(true);
    expect(aOctal(p('7000'))).toBe('7000');
    expect(aOctal(p('0000'))).toBe('000');
  });
});

describe('chmod: simbólico', () => {
  it('rwxr-xr-x es 755', () => {
    expect(aSimbolico(p('755'))).toBe('rwxr-xr-x');
    expect(aSimbolico(p('644'))).toBe('rw-r--r--');
    expect(aSimbolico(p('000'))).toBe('---------');
    expect(aSimbolico(p('777'))).toBe('rwxrwxrwx');
  });

  it('setuid y setgid van como «s» (o «S» sin ejecución) y sticky como «t» (o «T»)', () => {
    expect(aSimbolico(p('4755'))).toBe('rwsr-xr-x');
    expect(aSimbolico(p('4644'))).toBe('rwSr--r--');
    expect(aSimbolico(p('2755'))).toBe('rwxr-sr-x');
    expect(aSimbolico(p('2745'))).toBe('rwxr-Sr-x');
    expect(aSimbolico(p('1777'))).toBe('rwxrwxrwt');
    expect(aSimbolico(p('1776'))).toBe('rwxrwxrwT');
  });

  it('se lee de vuelta, también con el tipo de archivo de «ls -l» delante', () => {
    expect(aOctal(desdeSimbolico('rwxr-xr-x')!)).toBe('755');
    expect(aOctal(desdeSimbolico('-rw-r--r--')!)).toBe('644');
    expect(aOctal(desdeSimbolico('drwxr-xr-x')!)).toBe('755');
    expect(aOctal(desdeSimbolico('rwsr-xr-x')!)).toBe('4755');
    expect(aOctal(desdeSimbolico('rwxrwxrwt')!)).toBe('1777');
    expect(aOctal(desdeSimbolico('rwSr--r--')!)).toBe('4644');
  });

  it('rechaza lo que no es una cadena simbólica válida', () => {
    for (const malo of [
      '',
      'rwx',
      'rwxrwxrw',
      'rwxrwxrwxx',
      'xwrxwrxwr',
      'rwxr-xr-q',
      'RWXR-XR-X',
    ]) {
      expect(desdeSimbolico(malo), malo).toBeNull();
    }
  });

  it('ida y vuelta simbólica de las 4096 combinaciones', () => {
    for (let n = 0; n < 4096; n++) {
      const o = n.toString(8).padStart(4, '0');
      const original = p(o);
      expect(desdeSimbolico(aSimbolico(original))).toEqual(original);
    }
  });
});

describe('chmod: casillas', () => {
  it('alternar una casilla cambia solo ese bit', () => {
    const base = p('644');
    const conX = alternarPermiso(base, 'propietario', 'x');
    expect(aOctal(conX)).toBe('744');
    expect(aOctal(alternarPermiso(conX, 'propietario', 'x'))).toBe('644');
    expect(aOctal(base)).toBe('644'); // no muta
    expect(aOctal(alternarPermiso(base, 'otros', 'w'))).toBe('646');
    expect(aOctal(alternarPermiso(base, 'grupo', 'x'))).toBe('654');
  });

  it('los bits especiales se alternan por su nombre', () => {
    const b = alternarPermiso(p('755'), 'especial', 'setuid');
    expect(aOctal(b)).toBe('4755');
    expect(aOctal(alternarPermiso(b, 'especial', 'sticky'))).toBe('5755');
    expect(aOctal(alternarPermiso(b, 'especial', 'setgid'))).toBe('6755');
  });

  it('permisosVacios no da ningún permiso', () => {
    expect(aOctal(permisosVacios())).toBe('000');
  });
});

describe('chmod: comando de ejemplo', () => {
  it('chmod 755 archivo', () => {
    expect(comandoChmod(p('755'))).toBe('chmod 755 archivo');
    expect(comandoChmod(p('4755'), 'script.sh')).toBe('chmod 4755 script.sh');
  });

  it('pone entre comillas un nombre con espacios o caracteres del intérprete', () => {
    expect(comandoChmod(p('644'), 'mi archivo.txt')).toBe("chmod 644 'mi archivo.txt'");
    expect(comandoChmod(p('644'), "a'b; rm -rf /")).toBe("chmod 644 'a'\\''b; rm -rf /'");
    expect(comandoChmod(p('644'), '')).toBe('chmod 644 archivo');
  });
});
