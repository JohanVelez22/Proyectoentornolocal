import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Ejecutor } from '../src/plataforma/tipos';
import { Rutas } from '../src/rutas';
import { DEFINICIONES } from '../src/servicios/datos';
import type { CtxServicio } from '../src/servicios/definicion';
import { contenidoRedis, defRedis } from '../src/servicios/bd/redis';
import { defMongodb } from '../src/servicios/bd/mongodb';
import { defMailpit, Mailpit } from '../src/servicios/mailpit';
import { defOllama } from '../src/servicios/ollama';

let base: string;
let llamadas: { cmd: string; args: string[] }[];

const exec: Ejecutor = async (cmd, args) => {
  llamadas.push({ cmd, args });
  return { codigo: 0, stdout: '', stderr: '' };
};

const ctx = (
  id: string,
  version: string,
  puerto: number,
  def: { claveDatos?(v: string): string },
): CtxServicio => {
  const rutas = new Rutas(base);
  return {
    rutas,
    bin: rutas.bin(id, version),
    datos: rutas.datos(id, version, def.claveDatos ? (v) => def.claveDatos!(v) : undefined),
    puerto,
    version,
    credenciales: { usuario: 'x', clave: 'Secr3toSuperClave99' },
    exec,
  };
};

beforeEach(() => {
  base = mkdtempSync(path.join(os.tmpdir(), 'pel-extra-'));
  llamadas = [];
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

describe('registro y datos', () => {
  it('registra los cuatro servicios con sus puertos y categorías', () => {
    const ids = DEFINICIONES.map((d) => d.id);
    for (const id of ['redis', 'mongodb', 'mailpit', 'ollama']) expect(ids).toContain(id);
    expect(defRedis()).toMatchObject({
      categoria: 'bd',
      puertoPorDefecto: 6379,
      puertoAlternativo: 6380,
    });
    expect(defMongodb()).toMatchObject({
      categoria: 'bd',
      puertoPorDefecto: 27017,
      puertoAlternativo: 27018,
    });
    expect(defMailpit()).toMatchObject({
      categoria: 'herramienta',
      puertoPorDefecto: 1025,
      puertosExtra: [8025],
    });
    expect(defOllama()).toMatchObject({ categoria: 'ia', puertoPorDefecto: 11434 });
  });

  it('claves de datos', () => {
    expect(defRedis().claveDatos!('8.10.3')).toBe('8');
    expect(defMongodb().claveDatos).toBeUndefined();
    expect(defMailpit().claveDatos!('1.34.0')).toBe('actual');
    expect(defOllama().claveDatos!('0.40.16')).toBe('actual');
  });
});

describe('Redis', () => {
  it('redis.conf con bind local, puerto, ruta con "/" entre comillas y AOF', () => {
    const t = contenidoRedis('C:\\Users\\Un Nombre\\data\\redis\\8', 6380);
    expect(t).toContain('bind 127.0.0.1');
    expect(t).toContain('port 6380');
    expect(t).toContain('dir "C:/Users/Un Nombre/data/redis/8"');
    expect(t).toContain('appendonly yes');
    expect(t).toContain('protected-mode yes');
  });

  it('inicializar crea los datos; proceso regenera el conf con el puerto actual', async () => {
    const def = defRedis();
    const c = ctx('redis', '8.10.3', 6379, def);
    await def.inicializar(c);
    const p1 = await def.proceso(c);
    expect(readFileSync(p1.args[0]!, 'utf8')).toContain('port 6379');
    const p2 = await def.proceso({ ...c, puerto: 6380 });
    expect(readFileSync(p2.args[0]!, 'utf8')).toContain('port 6380');
    expect(p2).toMatchObject({
      id: 'redis',
      comando: path.join(c.bin, 'redis-server.exe'),
      puerto: 6380,
      reiniciar: false,
    });
    expect(p2.env).toBeUndefined();
  });

  it('detenerLimpio usa redis-cli shutdown sin clave', async () => {
    const def = defRedis();
    const c = ctx('redis', '8.10.3', 6380, def);
    await def.detenerLimpio!(c);
    expect(llamadas[0]).toEqual({
      cmd: path.join(c.bin, 'redis-cli.exe'),
      args: ['-h', '127.0.0.1', '-p', '6380', 'shutdown'],
    });
  });
});

describe('MongoDB', () => {
  it('inicializar crea dbpath y proceso pasa dbpath, puerto y bind_ip', async () => {
    const def = defMongodb();
    const c = ctx('mongodb', '8.0.38', 27018, def);
    await def.inicializar(c);
    const p = await def.proceso(c);
    expect(p.comando).toBe(path.join(c.bin, 'bin', 'mongod.exe'));
    expect(p.args).toEqual(['--dbpath', c.datos, '--port', '27018', '--bind_ip', '127.0.0.1']);
    expect(p.puerto).toBe(27018);
    expect(c.datos.endsWith(path.join('mongodb', '8.0'))).toBe(true);
  });

  it('detenerLimpio solo si mongosh está instalado', async () => {
    const def = defMongodb();
    const c = ctx('mongodb', '8.0.38', 27017, def);
    await def.detenerLimpio!(c);
    expect(llamadas).toEqual([]);
    const sh = path.join(base, 'bin', 'mongosh', '2.14.2', 'bin');
    mkdirSync(sh, { recursive: true });
    writeFileSync(path.join(sh, 'mongosh.exe'), '');
    await def.detenerLimpio!(c);
    expect(llamadas[0]!.cmd).toBe(path.join(sh, 'mongosh.exe'));
    expect(llamadas[0]!.args).toEqual([
      '--host',
      '127.0.0.1',
      '--port',
      '27017',
      '--quiet',
      '--eval',
      "db.getSiblingDB('admin').shutdownServer()",
    ]);
  });
});

describe('Mailpit', () => {
  it('args con SMTP y web locales y base en datos', async () => {
    const def = defMailpit();
    const c = ctx('mailpit', '1.34.0', 1026, def);
    await def.inicializar(c);
    const p = await def.proceso(c);
    expect(p.comando).toBe(path.join(c.bin, 'mailpit.exe'));
    expect(p.args).toEqual([
      '--smtp',
      '127.0.0.1:1026',
      '--listen',
      '127.0.0.1:8025',
      '--database',
      path.join(c.datos, 'mailpit.db'),
    ]);
    expect(p.puerto).toBe(8025);
    expect(def.detenerLimpio).toBeUndefined();
  });

  it('noLeidos lee unread con fetch falso', async () => {
    let url = '';
    const m = new Mailpit(8025, (async (u: string) => {
      url = u;
      return { ok: true, json: async () => ({ unread: 3, total: 9 }) };
    }) as never);
    expect(await m.noLeidos()).toBe(3);
    expect(url).toBe('http://127.0.0.1:8025/api/v1/messages?limit=1');
  });

  it('noLeidos explica en español si no responde', async () => {
    const m = new Mailpit(8025, (async () => {
      throw new Error('ECONNREFUSED');
    }) as never);
    await expect(m.noLeidos()).rejects.toThrow(/Mailpit no responde/);
    const mal = new Mailpit(8025, (async () => ({ ok: false, status: 500 })) as never);
    await expect(mal.noLeidos()).rejects.toThrow(/Mailpit/);
  });
});

describe('Ollama', () => {
  it('serve con OLLAMA_HOST y OLLAMA_MODELS bajo datos/ollama/actual', async () => {
    const def = defOllama();
    const c = ctx('ollama', '0.40.16', 11435, def);
    await def.inicializar(c);
    const p = await def.proceso(c);
    expect(p.comando).toBe(path.join(c.bin, 'ollama.exe'));
    expect(p.args).toEqual(['serve']);
    expect(p.env).toEqual({
      OLLAMA_HOST: '127.0.0.1:11435',
      OLLAMA_MODELS: path.join(base, 'data', 'ollama', 'actual', 'models'),
    });
    expect(p.puerto).toBe(11435);
    expect(def.detenerLimpio).toBeUndefined();
  });
});
