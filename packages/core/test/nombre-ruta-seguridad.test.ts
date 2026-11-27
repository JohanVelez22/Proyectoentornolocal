import { describe, expect, it } from 'vitest';
import { detectorCompartir } from '../src/compartir/contenido';
import { archivoSensible } from '../src/git/git';
import { crearDetectorSensible } from '../src/herramientas/archivoSensible';
import { motivoProtegido } from '../src/sistema/memoria';

/**
 * Las clasificaciones de seguridad por nombre tienen que dar lo mismo con una ruta de Windows que
 * con una POSIX, en cualquier sistema: `path.basename` fuera de Windows no separa por `\`.
 */
const SENSIBLES = [
  'C:\\proyecto\\.env',
  'C:\\proyecto\\.env.local',
  'C:\\proyecto\\certs\\servidor.pem',
  'C:\\a/b\\.env',
  '/srv/proyecto/.env',
  '/srv/proyecto/certs/servidor.pem',
];
const NORMALES = [
  'C:\\proyecto\\index.php',
  '/srv/proyecto/index.php',
  'C:\\proyecto\\.envio\\x.txt',
];

describe('detector de archivo sensible (Buscar y Diff)', () => {
  const d = crearDetectorSensible([]);
  it.each(SENSIBLES)('%s es sensible', (r) => expect(d.porRuta(r, 1)).toBe(true));
  it.each(NORMALES)('%s no es sensible', (r) => expect(d.porRuta(r, 1)).toBe(false));
});

describe('detector de Compartir', () => {
  const d = detectorCompartir(crearDetectorSensible([]));
  it.each([
    'C:\\Users\\u\\.ssh\\id_rsa',
    'C:\\Users\\u\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\x.default\\cookies.sqlite.baklz4',
    'C:\\Users\\u\\.netrc',
    '/home/u/.netrc',
    'D:\\copia/Login Data',
  ])('%s es sensible', (r) => expect(d.porRuta(r, 1)).toBe(true));
  it.each(NORMALES)('%s no es sensible', (r) => expect(d.porRuta(r, 1)).toBe(false));
});

describe('archivoSensible de Git (lo que no sale hacia la IA)', () => {
  it.each([
    ...SENSIBLES,
    'app\\config\\.env.production',
    'llaves\\id_ed25519.pub.key',
    'C:\\u\\.aws\\credentials',
    'app\\config\\database.yml',
  ])('%s se omite', (r) => expect(archivoSensible(r)).toBe(true));
  it.each(['src\\app.ts', 'src/app.ts'])('%s no se omite', (r) =>
    expect(archivoSensible(r)).toBe(false),
  );
});

describe('motivoProtegido: el nombre sale de la ruta sea cual sea el separador', () => {
  const ctx = {
    usuario: 'u',
    sesion: 1,
    rutasSistema: [],
    rutasPropias: [],
    pidsPropios: new Set<number>(),
  };
  const base = {
    pid: 500,
    nombre: 'otro.exe',
    inicio: 'i',
    memoria: 1,
    ventana: true,
    sesion: 1,
    usuario: 'u',
  };
  it.each(['C:\\Windows\\System32\\lsass.exe', '/usr/bin/lsass.exe', 'C:/x\\lsass.exe'])(
    '%s se protege',
    (ruta) => expect(motivoProtegido({ ...base, ruta }, ctx)).toBe('sistema'),
  );
});
