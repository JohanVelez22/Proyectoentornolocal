import { describe, expect, it } from 'vitest';
import {
  filtrarComandos,
  moverSeleccion,
  normalizar,
  puntuar,
  type Comando,
} from '../src/renderer/utilidades/paleta';

const c = (id: string, titulo: string, extra: Partial<Comando> = {}): Comando => ({
  id,
  grupo: 'general',
  titulo,
  ejecutar: () => undefined,
  ...extra,
});

const COMANDOS = [
  c('ir-inicio', 'Ir a Inicio'),
  c('ir-tuneles', 'Ir a Túneles'),
  c('ir-servicios', 'Ir a Servicios'),
  c('enc-nginx', 'Encender Nginx'),
  c('enc-php', 'Encender PHP 8.4'),
  c('abrir-tienda', 'Abrir Tienda en el navegador', { detalle: 'tienda.test' }),
  c('traer-tienda', 'Traer cambios en Tienda', { detalle: 'tienda.test' }),
  c('herr-puertos', 'Abrir Puertos en uso', { claves: 'ports netstat' }),
];

const ids = (l: Comando[]) => l.map((x) => x.id);

describe('paleta de comandos', () => {
  it('normalizar quita tildes y mayúsculas', () => {
    expect(normalizar('Túneles ÁÉ')).toBe('tuneles ae');
  });

  it('sin consulta devuelve todo en el orden original', () => {
    expect(ids(filtrarComandos(COMANDOS, '  '))).toEqual(ids(COMANDOS));
  });

  it('encuentra sin tildes y con mayúsculas', () => {
    expect(ids(filtrarComandos(COMANDOS, 'TUNEL'))).toEqual(['ir-tuneles']);
  });

  it('todas las palabras deben aparecer, en cualquier orden', () => {
    expect(ids(filtrarComandos(COMANDOS, 'tienda traer'))).toEqual(['traer-tienda']);
    expect(filtrarComandos(COMANDOS, 'tienda mysql')).toEqual([]);
  });

  it('acepta subsecuencias (difusa) y pone primero lo contiguo', () => {
    const r = ids(filtrarComandos(COMANDOS, 'ngx'));
    expect(r[0]).toBe('enc-nginx');
    const s = ids(filtrarComandos(COMANDOS, 'serv'));
    expect(s[0]).toBe('ir-servicios');
  });

  it('el comienzo de una palabra gana a una coincidencia en medio', () => {
    const a = puntuar({ titulo: 'Encender PHP' }, 'php')!;
    const b = puntuar({ titulo: 'Abrir aphpx' }, 'php')!;
    expect(a).toBeGreaterThan(b);
  });

  it('busca también en el detalle y las claves, con menos peso que el título', () => {
    expect(ids(filtrarComandos(COMANDOS, 'netstat'))).toEqual(['herr-puertos']);
    const enTitulo = puntuar({ titulo: 'Tienda' }, 'tienda')!;
    const enDetalle = puntuar({ titulo: 'Otro', detalle: 'tienda' }, 'tienda')!;
    expect(enTitulo).toBeGreaterThan(enDetalle);
  });

  it('respeta el máximo', () => {
    expect(filtrarComandos(COMANDOS, '', 3)).toHaveLength(3);
  });

  it('moverSeleccion da la vuelta en ambos sentidos', () => {
    expect(moverSeleccion(0, 3, -1)).toBe(2);
    expect(moverSeleccion(2, 3, 1)).toBe(0);
    expect(moverSeleccion(0, 0, 1)).toBe(0);
  });
});

describe('asistente de primer uso: lo básico', () => {
  const v = (servicio: string, version: string, rama?: string) =>
    ({ servicio, version, ...(rama ? { rama } : {}) }) as never;

  it('propone la versión más nueva; en PHP, la más nueva de la rama 8.4', async () => {
    const { BASICOS, versionBasica } = await import('../src/renderer/utilidades/asistenteInicio');
    const php = BASICOS.find((b) => b.servicio === 'php')!;
    const node = BASICOS.find((b) => b.servicio === 'node')!;
    const lista = [
      v('php', '8.3.20', '8.3'),
      v('php', '8.4.9', '8.4'),
      v('php', '8.4.12', '8.4'),
      v('php', '8.5.0', '8.5'),
      v('node', '22.20.0'),
      v('node', '24.11.1'),
    ];
    expect(versionBasica(php, lista)?.version).toBe('8.4.12');
    expect(versionBasica(node, lista)?.version).toBe('24.11.1');
    expect(versionBasica(BASICOS[0]!, lista)).toBeUndefined();
  });

  it('ya instalado: cualquier versión, o la rama en PHP', async () => {
    const { BASICOS, yaInstalado } = await import('../src/renderer/utilidades/asistenteInicio');
    const php = BASICOS.find((b) => b.servicio === 'php')!;
    expect(yaInstalado(php, ['8.3'])).toBe(false);
    expect(yaInstalado(php, ['8.4'])).toBe(true);
    expect(yaInstalado(php, ['8.4.12'])).toBe(true);
    expect(yaInstalado(BASICOS[0]!, [])).toBe(false);
    expect(yaInstalado(BASICOS[0]!, ['1.28.0'])).toBe(true);
  });
});
