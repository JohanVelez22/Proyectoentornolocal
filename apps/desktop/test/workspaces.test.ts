import { describe, expect, it } from 'vitest';
import { diccionarios } from '../src/renderer/i18n';
import {
  accionPrincipal,
  alternarElemento,
  claveElemento,
  elementoReemplazado,
  idDesdeNombre,
  nombreElemento,
  opcionesElementos,
  resumirResultado,
  textoItem,
} from '../src/renderer/utilidades/workspaces';
import type { ElementoWorkspace, ResultadoWorkspace } from '../src/shared/api';

const pg: ElementoWorkspace = { tipo: 'instancia', id: 'postgresql@17' };
const mailpit: ElementoWorkspace = { tipo: 'servicio', id: 'mailpit' };
const smtp4dev: ElementoWorkspace = { tipo: 'servicio', id: 'smtp4dev' };
const ollama: ElementoWorkspace = { tipo: 'servicio', id: 'ollama' };

describe('workspaces (D28): selección de elementos', () => {
  it('agrega y quita; la clave es estable', () => {
    expect(claveElemento(pg)).toBe('instancia:postgresql@17');
    expect(claveElemento({ tipo: 'proceso', sitioId: 'bot', procesoId: 'uvicorn' })).toBe(
      'proceso:bot/uvicorn',
    );
    let s = alternarElemento([], pg);
    s = alternarElemento(s, ollama);
    expect(s).toEqual([pg, ollama]);
    expect(alternarElemento(s, pg)).toEqual([ollama]);
  });

  it('un captador reemplaza al anterior (grupo exclusivo)', () => {
    let s = alternarElemento([pg], mailpit);
    s = alternarElemento(s, smtp4dev);
    expect(s).toEqual([pg, smtp4dev]);
  });

  it('las opciones salen de lo instalado: motores como instancia, el resto como servicio', () => {
    const o = opcionesElementos(
      [
        { id: 'postgresql@17', servicio: 'postgresql', version: '17.2' },
        { id: 'ollama@actual', servicio: 'ollama', version: '0.5' },
        { id: 'redis@actual', servicio: 'redis', version: '7' },
      ],
      ['nginx', 'php-8.4', 'ollama', 'mailpit', 'postgresql'],
      [
        {
          id: 'bot',
          nombre: 'Bot',
          dominio: 'bot.test',
          procesos: [{ id: 'uvicorn', nombre: 'API' }] as never,
        },
      ],
    );
    expect(o.instancias.map((i) => i.elemento)).toEqual([
      { tipo: 'instancia', id: 'postgresql@17' },
      { tipo: 'instancia', id: 'redis@actual' },
    ]);
    expect(o.servicios.map((s) => claveElemento(s.elemento))).toEqual([
      'servicio:nginx',
      'servicio:php',
      'servicio:ollama',
      'servicio:mailpit',
    ]);
    expect(o.procesos.map((p) => claveElemento(p.elemento))).toEqual(['proceso:bot/uvicorn']);
  });

  it('el id sale del nombre, sin tildes ni símbolos, y no se repite', () => {
    expect(idDesdeNombre('Bot FastAPI', [])).toBe('bot-fastapi');
    expect(idDesdeNombre('Bot FastAPI', ['bot-fastapi'])).toBe('bot-fastapi-2');
    expect(idDesdeNombre('Año ñandú ¡Ya!', [])).toBe('ano-nandu-ya');
    expect(idDesdeNombre('###', [])).toBe('workspace');
    expect(idDesdeNombre('x'.repeat(80), []).length).toBeLessThanOrEqual(36);
  });
});

describe('workspaces (D28): resultado de encender y apagar', () => {
  const r = (extra: Partial<ResultadoWorkspace> & { elemento: string }): ResultadoWorkspace => ({
    ok: true,
    encendido: true,
    ...extra,
  });

  it('el botón enciende salvo que esté encendido del todo', () => {
    expect(accionPrincipal('apagado')).toBe('iniciar');
    expect(accionPrincipal('parcial')).toBe('iniciar');
    expect(accionPrincipal('encendido')).toBe('detener');
  });

  it('resume qué quedó encendido, qué falló, qué se ignoró y qué se compartió', () => {
    const items: ResultadoWorkspace[] = [
      r({ elemento: 'instancia:postgresql@17' }),
      r({
        elemento: 'servicio:ollama',
        ok: false,
        encendido: false,
        codigo: 'workspaces.elemento_fallo',
      }),
      r({ elemento: 'servicio:nginx', encendido: false, aviso: 'no_existe' }),
      r({ elemento: 'instancia:redis@actual', aviso: 'compartido' }),
    ];
    expect(resumirResultado(items)).toEqual({
      encendidos: ['instancia:postgresql@17', 'instancia:redis@actual'],
      fallidos: [items[1]],
      ignorados: ['servicio:nginx'],
      compartidos: ['instancia:redis@actual'],
    });
  });

  it('los nombres son legibles', () => {
    expect(nombreElemento('instancia:mysql@8.4')).toBe('mysql 8.4');
    expect(nombreElemento('servicio:php')).toBe('PHP');
    expect(nombreElemento('proceso:bot/uvicorn')).toBe('bot · uvicorn');
    expect(elementoReemplazado('reemplaza:servicio:smtp4dev')).toBe('servicio:smtp4dev');
    expect(elementoReemplazado('compartido')).toBeNull();
  });

  it('la frase de cada elemento sale en los cuatro idiomas y dice si quedó encendido o no', () => {
    for (const idioma of ['es', 'en', 'pt', 'fr'] as const) {
      const t = diccionarios[idioma].workspaces.resultado;
      const encendido = textoItem(r({ elemento: 'servicio:nginx' }), 'iniciar', t);
      const fallo = textoItem(
        r({ elemento: 'servicio:nginx', ok: false, encendido: false }),
        'iniciar',
        t,
      );
      const sigue = textoItem(
        r({ elemento: 'servicio:nginx', ok: false, encendido: true }),
        'detener',
        t,
      );
      expect(new Set([encendido, fallo, sigue]).size).toBe(3);
      expect(
        textoItem(
          r({ elemento: 'servicio:mailpit', aviso: 'reemplaza:servicio:smtp4dev' }),
          'iniciar',
          t,
        ),
      ).toContain('smtp4dev');
      expect(
        textoItem(r({ elemento: 'x:y', encendido: false, aviso: 'no_existe' }), 'iniciar', t),
      ).toBe(t.noExiste);
    }
  });
});
