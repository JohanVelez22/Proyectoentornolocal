import { mkdirSync, readdirSync, readFileSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { IDS_ASISTENTE } from '../src/asistentes/asistentes';
import { aplicar, BOM, copias, escribir, leer, montar, TOKEN, URL_MCP } from './asistentesAyuda';

describe('Asistentes: clientes', () => {
  it('lista los nueve clientes en orden', () => {
    expect([...IDS_ASISTENTE]).toEqual([
      'claude-code',
      'codex',
      'opencode',
      'copilot-cli',
      'hermes',
      'gemini-cli',
      'qwen-code',
      'cursor',
      'claude-desktop',
    ]);
  });
});

describe('Asistentes: detección de estados', () => {
  it('sin nada: todos «no instalados» y no se crea ningún archivo', async () => {
    const m = await montar();
    const e = await m.as.estado();
    expect(e.map((x) => x.estado)).toEqual(Array(9).fill('no-instalado'));
    expect(readdirSync(m.inicio)).toEqual([]);
    expect(readdirSync(m.appdata)).toEqual([]);
  });

  it('instalado sin conectar, conectado y no compatible', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('gemini-cli'), '{"mcpServers":{"wolfcore":{"url":"x"},"otro":{"url":"y"}}}');
    escribir(m.ruta('claude-desktop'), '{}');
    const e = Object.fromEntries((await m.as.estado()).map((x) => [x.id, x]));
    expect(e['codex']!.estado).toBe('instalado');
    expect(e['gemini-cli']!.estado).toBe('conectado');
    expect(e['claude-desktop']!.estado).toBe('instalado');
    expect(e['claude-desktop']!.compatible).toBe(false);
    expect(e['claude-desktop']!.motivo).toBeTruthy();
    expect(e['gemini-cli']!.compatible).toBe(true);
    expect(e['claude-code']!.estado).toBe('no-instalado');
  });

  it('un archivo que no se entiende no cuenta como conectado: «no se pudo leer»', async () => {
    const m = await montar();
    escribir(m.ruta('gemini-cli'), '{ no es json');
    const e = (await m.as.estado()).find((x) => x.id === 'gemini-cli')!;
    expect(e.estado).toBe('ilegible');
    expect(e.motivoIlegible).toBe('invalido');
  });

  it('un archivo que supera el tope se marca «no se pudo leer» por su tamaño', async () => {
    const m = await montar();
    escribir(m.ruta('gemini-cli'), '{"x":"' + 'a'.repeat(5 * 1024 * 1024 + 10) + '"}');
    const e = (await m.as.estado()).find((x) => x.id === 'gemini-cli')!;
    expect(e.estado).toBe('ilegible');
    expect(e.motivoIlegible).toBe('demasiado_grande');
  });

  it('Claude Desktop vive en la carpeta de configuración de la plataforma', async () => {
    const m = await montar();
    escribir(m.ruta('claude-desktop'), '{}');
    expect(await m.as.carpetaConfig('claude-desktop')).toBe(path.join(m.appdata, 'Claude'));
  });
});

describe('Asistentes: conectar y quitar (JSON)', () => {
  it('Cursor: añade solo wolfcore, conserva lo ajeno y su orden, comentarios y CRLF', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    const antes =
      '{\r\n  // mis servidores\r\n  "mcpServers": {\r\n    "otro": { "command": "x" }\r\n  },\r\n  "tema": "oscuro"\r\n}\r\n';
    escribir(m.ruta('gemini-cli'), antes);
    const r = await aplicar(m, 'gemini-cli');
    expect(r.cambiado).toBe(true);
    const t = leer(m.ruta('gemini-cli'));
    expect(t).toContain('// mis servidores');
    expect(JSON.parse(t.replace('// mis servidores', '')).mcpServers.otro).toEqual({
      command: 'x',
    });
    expect(t).toContain('"tema": "oscuro"');
    expect(t.indexOf('"otro"')).toBeLessThan(t.indexOf('"wolfcore"'));
    expect(t).toContain(URL_MCP);
    expect(t).toContain('${WOLFCORE_MCP_TOKEN}');
    expect(t).not.toContain(TOKEN);
    expect(t.replace(/\r\n/g, '')).not.toContain('\n');
    expect(copias(m.ruta('gemini-cli'))).toHaveLength(1);
  });

  it('respeta el BOM', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), BOM + '{"mcpServers":{}}');
    await aplicar(m, 'gemini-cli');
    expect(leer(m.ruta('gemini-cli')).startsWith(BOM)).toBe(true);
  });

  it('reemplaza una entrada wolfcore vieja y no toca las demás', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(
      m.ruta('gemini-cli'),
      '{"mcpServers":{"a":{"url":"1"},"wolfcore":{"url":"vieja"},"b":{"url":"2"}}}',
    );
    await aplicar(m, 'gemini-cli');
    const o = JSON.parse(leer(m.ruta('gemini-cli'))) as {
      mcpServers: Record<string, { url: string; httpUrl: string }>;
    };
    expect(Object.keys(o.mcpServers)).toEqual(['a', 'wolfcore', 'b']);
    expect(o.mcpServers['wolfcore']!.httpUrl).toBe(URL_MCP);
    expect(o.mcpServers['a']!.url).toBe('1');
  });

  it('quitar elimina solo wolfcore y hace copia', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{"mcpServers":{"a":{"url":"1"},"wolfcore":{"url":"v"}}}');
    await aplicar(m, 'gemini-cli', 'quitar');
    expect(JSON.parse(leer(m.ruta('gemini-cli')))).toEqual({ mcpServers: { a: { url: '1' } } });
    expect(copias(m.ruta('gemini-cli'))).toHaveLength(1);
  });

  it('quitar sin entrada no escribe ni copia', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{"mcpServers":{"a":{"url":"1"}}}');
    const v = await m.as.vistaPrevia('gemini-cli', 'quitar');
    expect(v.sinCambios).toBe(true);
    const r = await m.as.aplicar('gemini-cli', 'quitar', v.huella, true);
    expect(r.cambiado).toBe(false);
    expect(copias(m.ruta('gemini-cli'))).toHaveLength(0);
  });

  it('opencode usa la sección mcp y la variable con su sintaxis', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    await aplicar(m, 'opencode');
    const t = leer(m.ruta('opencode'));
    expect(t).toContain('{env:WOLFCORE_MCP_TOKEN}');
    expect(t).not.toContain(TOKEN);
    expect((JSON.parse(t) as { mcp: object }).mcp).toHaveProperty('wolfcore');
  });

  it('Claude Code y Copilot CLI usan mcpServers con ${WOLFCORE_MCP_TOKEN}', async () => {
    const m = await montar();
    m.instalados.add('claude-code').add('copilot-cli');
    await aplicar(m, 'claude-code');
    await aplicar(m, 'copilot-cli');
    for (const id of ['claude-code', 'copilot-cli'] as const) {
      const t = leer(m.ruta(id));
      expect(t).toContain('${WOLFCORE_MCP_TOKEN}');
      expect(t).not.toContain(TOKEN);
    }
  });
});

describe('Asistentes: conectar y quitar (TOML de Codex)', () => {
  const base =
    '# Mi configuración\nmodel = "gpt-5"\n\n# servidor ajeno\n[mcp_servers.otro]\ncommand = "npx"\nargs = ["-y", "algo"]\n\n[tui]\ntheme = "dark"\n';

  it('añade [mcp_servers.wolfcore] conservando comentarios, tablas y orden', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('codex'), base);
    await aplicar(m, 'codex');
    const t = leer(m.ruta('codex'));
    expect(t.startsWith(base.trimEnd())).toBe(true);
    expect(t).toContain('# Mi configuración');
    expect(t).toContain('# servidor ajeno');
    expect(t).toContain('[mcp_servers.wolfcore]');
    expect(t).toContain('bearer_token_env_var = "WOLFCORE_MCP_TOKEN"');
    expect(t).not.toContain(TOKEN);
  });

  it('quitar elimina solo la tabla wolfcore', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('codex'), base);
    await aplicar(m, 'codex');
    await aplicar(m, 'codex', 'quitar');
    expect(leer(m.ruta('codex'))).toBe(base);
  });

  it('avisa en la vista previa si se perderían comentarios de la tabla wolfcore', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(
      m.ruta('codex'),
      '[mcp_servers.wolfcore]\n# nota mía\nurl = "http://127.0.0.1:1/mcp"\n',
    );
    const v = await m.as.vistaPrevia('codex', 'conectar');
    expect(v.avisos).toContain('comentarios_perdidos');
    const w = await m.as.vistaPrevia('codex', 'quitar');
    expect(w.avisos).toContain('comentarios_perdidos');
  });

  it('sin comentarios en juego no avisa', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('codex'), base);
    expect((await m.as.vistaPrevia('codex', 'conectar')).avisos).not.toContain(
      'comentarios_perdidos',
    );
  });
});

describe('Asistentes: archivo inválido', () => {
  it('JSON inválido: no se escribe, no hay copia y falla con agentes.config_ilegible', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{ "mcpServers": { ');
    await expect(m.as.vistaPrevia('gemini-cli', 'conectar')).rejects.toMatchObject({
      codigo: 'agentes.config_ilegible',
    });
    expect(leer(m.ruta('gemini-cli'))).toBe('{ "mcpServers": { ');
    expect(copias(m.ruta('gemini-cli'))).toHaveLength(0);
  });

  it('TOML inválido: igual, sin tocar nada', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('codex'), 'esto = = no es toml');
    await expect(m.as.vistaPrevia('codex', 'conectar')).rejects.toMatchObject({
      codigo: 'agentes.config_ilegible',
    });
    await expect(m.as.aplicar('codex', 'conectar', 'x', true)).rejects.toBeTruthy();
    expect(leer(m.ruta('codex'))).toBe('esto = = no es toml');
    expect(copias(m.ruta('codex'))).toHaveLength(0);
  });
});

describe('Asistentes: copia previa, límite y escritura atómica', () => {
  it('la copia queda junto al archivo con la fecha y el contenido anterior', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{"mcpServers":{}}');
    const r = await aplicar(m, 'gemini-cli');
    expect(path.basename(r.respaldo!)).toBe('settings.json.wolfcore-20261127-100000.bak');
    expect(path.dirname(r.respaldo!)).toBe(path.dirname(m.ruta('gemini-cli')));
    expect(leer(r.respaldo!)).toBe('{"mcpServers":{}}');
  });

  it('guarda como mucho 5 copias', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{"mcpServers":{}}');
    for (let i = 0; i < 8; i++) {
      await aplicar(m, 'gemini-cli', 'conectar');
      await aplicar(m, 'gemini-cli', 'quitar');
    }
    expect(copias(m.ruta('gemini-cli')).length).toBeLessThanOrEqual(5);
    expect(copias(m.ruta('gemini-cli')).length).toBeGreaterThan(0);
  });

  it('no deja archivos temporales y el resultado es válido', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{}');
    await aplicar(m, 'gemini-cli');
    const nombres = readdirSync(path.dirname(m.ruta('gemini-cli')));
    expect(nombres.filter((n) => n.includes('pel-tmp'))).toEqual([]);
    expect(() => JSON.parse(leer(m.ruta('gemini-cli')))).not.toThrow();
  });
});

describe('Asistentes: enlaces simbólicos', () => {
  it('rechaza un archivo que es un enlace', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    const real = path.join(m.inicio, 'real.json');
    escribir(real, '{}');
    mkdirSync(path.dirname(m.ruta('gemini-cli')), { recursive: true });
    try {
      symlinkSync(real, m.ruta('gemini-cli'), 'file');
    } catch {
      return; // sin permiso para crear enlaces en este equipo
    }
    await expect(m.as.vistaPrevia('gemini-cli', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.enlace_rechazado',
    });
    expect(leer(real)).toBe('{}');
  });

  it('rechaza una carpeta de configuración que es un enlace o unión', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    const real = path.join(m.inicio, 'otra');
    mkdirSync(real);
    try {
      symlinkSync(real, path.join(m.inicio, '.gemini'), 'junction');
    } catch {
      return;
    }
    await expect(m.as.vistaPrevia('gemini-cli', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.enlace_rechazado',
    });
    expect(readdirSync(real)).toEqual([]);
  });
});

describe('Asistentes: confirmación, vista previa y token', () => {
  it('sin confirmado === true no escribe', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{}');
    const v = await m.as.vistaPrevia('gemini-cli', 'conectar');
    await expect(
      m.as.aplicar('gemini-cli', 'conectar', v.huella, false as never),
    ).rejects.toMatchObject({ codigo: 'agentes.sin_confirmar' });
    expect(leer(m.ruta('gemini-cli'))).toBe('{}');
  });

  it('si el archivo cambió desde la vista previa, no escribe', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{}');
    const v = await m.as.vistaPrevia('gemini-cli', 'conectar');
    escribir(m.ruta('gemini-cli'), '{"otra":1}');
    await expect(m.as.aplicar('gemini-cli', 'conectar', v.huella, true)).rejects.toMatchObject({
      codigo: 'asistentes.vista_desfasada',
    });
    expect(leer(m.ruta('gemini-cli'))).toBe('{"otra":1}');
  });

  it('la vista previa trae las líneas que cambian y nunca el token', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(m.ruta('gemini-cli'), '{\n  "mcpServers": {}\n}\n');
    const v = await m.as.vistaPrevia('gemini-cli', 'conectar');
    expect(v.lineas.some((l) => l.tipo === 'mas' && l.texto.includes('wolfcore'))).toBe(true);
    expect(v.lineas.some((l) => l.tipo === 'menos')).toBe(true);
    expect(JSON.stringify(v)).not.toContain(TOKEN);
    expect(v.variable).toBe('WOLFCORE_MCP_TOKEN');
    expect(v.existeArchivo).toBe(true);
  });

  it('nunca guarda el token en claro; si el archivo ya lo traía, la copia lo enmascara', async () => {
    const m = await montar();
    m.instalados.add('gemini-cli');
    escribir(
      m.ruta('gemini-cli'),
      JSON.stringify({ mcpServers: { wolfcore: { url: URL_MCP, headers: { A: TOKEN } } } }),
    );
    const r = await aplicar(m, 'gemini-cli');
    expect(leer(m.ruta('gemini-cli'))).not.toContain(TOKEN);
    expect(leer(r.respaldo!)).not.toContain(TOKEN);
    expect(leer(r.respaldo!)).toContain('***');
    expect(r.tokenEscrito).toBe(true);
  });

  it('un cliente no instalado no se conecta ni se crea su configuración', async () => {
    const m = await montar();
    await expect(m.as.vistaPrevia('gemini-cli', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.no_instalado',
    });
    expect(readdirSync(m.inicio)).toEqual([]);
  });

  it('Claude Desktop no es compatible: conectar falla y no escribe', async () => {
    const m = await montar();
    escribir(m.ruta('claude-desktop'), '{}');
    await expect(m.as.vistaPrevia('claude-desktop', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.no_compatible',
    });
    await expect(m.as.configuracion('claude-desktop')).rejects.toMatchObject({
      codigo: 'asistentes.no_compatible',
    });
    expect(leer(m.ruta('claude-desktop'))).toBe('{}');
  });

  it('Claude Desktop con una entrada wolfcore a mano se puede quitar', async () => {
    const m = await montar();
    escribir(
      m.ruta('claude-desktop'),
      '{"mcpServers":{"wolfcore":{"command":"x"},"b":{"command":"y"}}}',
    );
    await aplicar(m, 'claude-desktop', 'quitar');
    expect(JSON.parse(leer(m.ruta('claude-desktop')))).toEqual({
      mcpServers: { b: { command: 'y' } },
    });
  });
});

describe('Asistentes: copiar configuración y carpeta', () => {
  it('JSON y TOML sin el token, con la variable', async () => {
    const m = await montar();
    const cursor = await m.as.configuracion('gemini-cli');
    expect(JSON.parse(cursor)).toHaveProperty('mcpServers.wolfcore.httpUrl', URL_MCP);
    expect(cursor).toContain('WOLFCORE_MCP_TOKEN');
    const codex = await m.as.configuracion('codex');
    expect(codex).toContain('[mcp_servers.wolfcore]');
    for (const id of IDS_ASISTENTE.filter((x) => x !== 'claude-desktop')) {
      expect(await m.as.configuracion(id)).not.toContain(TOKEN);
    }
  });

  it('carpetaConfig solo devuelve carpetas de la lista y que existan', async () => {
    const m = await montar();
    await expect(m.as.carpetaConfig('gemini-cli')).rejects.toMatchObject({
      codigo: 'asistentes.sin_carpeta',
    });
    mkdirSync(path.join(m.inicio, '.gemini'));
    expect(await m.as.carpetaConfig('gemini-cli')).toBe(path.join(m.inicio, '.gemini'));
    await expect(m.as.carpetaConfig('nada' as never)).rejects.toMatchObject({
      codigo: 'asistentes.no_existe',
    });
  });
});

describe('Asistentes: el servidor MCP solo escucha en 127.0.0.1', () => {
  it('la URL que se escribe es local y el servidor fija esa dirección', async () => {
    const m = await montar();
    expect(await m.as.configuracion('gemini-cli')).toContain('http://127.0.0.1:');
    const fuente = readFileSync(path.join(__dirname, '..', 'src', 'mcp', 'servidor.ts'), 'utf8');
    expect(fuente).toContain("const DIRECCION = '127.0.0.1'");
    expect(fuente).toMatch(/servidor\.listen\(puerto, DIRECCION/);
    expect(fuente).not.toMatch(/0\.0\.0\.0/);
  });
});
