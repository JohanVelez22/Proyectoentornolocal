import { chmodSync, mkdirSync, readFileSync, renameSync, statSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { editarConfigAgente } from '../src/agentes/configArchivo';
import { aplicar, copias, escribir, leer, montar, TOKEN, URL_MCP } from './asistentesAyuda';

// Revisión de D58: todo en carpetas falsas; nunca se lee ni se escribe una configuración real.

describe('Cursor y Claude Desktop: «Conectar» desactivado', () => {
  it('Cursor no se puede conectar (app gráfica), pero sí quitar y copiar', async () => {
    const m = await montar();
    escribir(m.ruta('cursor'), '{"mcpServers":{"wolfcore":{"url":"x"},"b":{"url":"y"}}}');
    const e = (await m.as.estado()).find((x) => x.id === 'cursor')!;
    expect(e).toMatchObject({
      estado: 'conectado',
      compatible: true,
      conectable: false,
      motivo: 'app_grafica',
    });
    await expect(m.as.vistaPrevia('cursor', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.no_compatible',
    });
    await aplicar(m, 'cursor', 'quitar');
    expect(JSON.parse(leer(m.ruta('cursor')))).toEqual({ mcpServers: { b: { url: 'y' } } });
    expect(await m.as.configuracion('cursor')).toContain('WOLFCORE_MCP_TOKEN');
  });

  it('Claude Desktop: no compatible por servidores locales; el resto sí es conectable', async () => {
    const m = await montar();
    const e = Object.fromEntries((await m.as.estado()).map((x) => [x.id, x]));
    expect(e['claude-desktop']).toMatchObject({
      compatible: false,
      conectable: false,
      motivo: 'solo_servidores_locales',
    });
    for (const id of ['claude-code', 'codex', 'opencode', 'hermes', 'gemini-cli', 'qwen-code']) {
      expect(e[id]!.conectable, id).toBe(true);
    }
  });
});

describe('Hermes, Gemini CLI y Qwen Code', () => {
  it('se conectan con la variable y sin el token', async () => {
    const m = await montar();
    m.instalados.add('hermes').add('gemini-cli').add('qwen-code');
    for (const id of ['hermes', 'gemini-cli', 'qwen-code'] as const) {
      await aplicar(m, id);
      const t = leer(m.ruta(id));
      expect(t, id).toContain('${WOLFCORE_MCP_TOKEN}');
      expect(t, id).toContain(URL_MCP);
      expect(t, id).not.toContain(TOKEN);
    }
    const e = Object.fromEntries((await m.as.estado()).map((x) => [x.id, x.estado]));
    expect([e['hermes'], e['gemini-cli'], e['qwen-code']]).toEqual(Array(3).fill('conectado'));
  });
});

describe('TOML: la tabla wolfcore se reemplaza en su sitio', () => {
  it('no se mueve al final y lo de después queda igual', async () => {
    const m = await montar();
    m.instalados.add('codex');
    const antes =
      '[mcp_servers.a]\ncommand = "a"\n\n[mcp_servers.wolfcore]\nurl = "http://127.0.0.1:1/mcp"\n\n[mcp_servers.b]\ncommand = "b"\n\n[tui]\ntheme = "dark"\n';
    escribir(m.ruta('codex'), antes);
    await aplicar(m, 'codex');
    const t = leer(m.ruta('codex'));
    const orden = ['[mcp_servers.a]', '[mcp_servers.wolfcore]', '[mcp_servers.b]', '[tui]'].map(
      (x) => t.indexOf(x),
    );
    expect(orden.every((x) => x >= 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(t).toContain('theme = "dark"');
    expect(t.endsWith('\n[tui]\ntheme = "dark"\n')).toBe(true);
    expect(t).toContain(`url = "${URL_MCP}"`);
    const v = await m.as.vistaPrevia('codex', 'conectar');
    expect(v.sinCambios).toBe(true);
  });

  it('una entrada en línea o con claves con puntos da un error claro y no escribe', async () => {
    const m = await montar();
    m.instalados.add('codex');
    for (const antes of [
      '[mcp_servers]\nwolfcore = { url = "http://x" }\n',
      'mcp_servers.wolfcore.url = "http://x"\n',
      '[mcp_servers]\nwolfcore.url = "http://x"\n',
    ]) {
      escribir(m.ruta('codex'), antes);
      await expect(m.as.vistaPrevia('codex', 'conectar'), antes).rejects.toMatchObject({
        codigo: 'asistentes.entrada_no_editable',
      });
      await expect(m.as.vistaPrevia('codex', 'quitar'), antes).rejects.toMatchObject({
        codigo: 'asistentes.entrada_no_editable',
      });
      expect(leer(m.ruta('codex'))).toBe(antes);
      expect(copias(m.ruta('codex'))).toHaveLength(0);
    }
  });

  it('un archivo con finales de línea mezclados no se normaliza', async () => {
    const m = await montar();
    m.instalados.add('codex');
    const antes = 'a = 1\r\nb = 2\n[tui]\r\ntheme = "x"\n';
    escribir(m.ruta('codex'), antes);
    await aplicar(m, 'codex');
    const t = leer(m.ruta('codex'));
    expect(t.startsWith(antes)).toBe(true);
    await aplicar(m, 'codex', 'quitar');
    expect(leer(m.ruta('codex'))).toBe(antes);
  });

  it('en YAML (que se reescribe entero) la vista previa avisa de los finales mezclados', async () => {
    const m = await montar();
    m.instalados.add('hermes');
    escribir(m.ruta('hermes'), 'a: 1\r\nb: 2\n');
    const v = await m.as.vistaPrevia('hermes', 'conectar');
    expect(v.avisos).toContain('finales_mezclados');
  });
});

describe('Vista previa: sin secretos de otros servidores', () => {
  it('Codex: un GITHUB_TOKEN vecino no aparece ni en las líneas ni en ningún campo', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(
      m.ruta('codex'),
      '[mcp_servers.github]\ncommand = "npx"\n\n[mcp_servers.github.env]\nGITHUB_TOKEN = "ghp_SECRETO"\n\n[mcp_servers.wolfcore]\nurl = "http://127.0.0.1:1/mcp"\n',
    );
    for (const accion of ['conectar', 'quitar'] as const) {
      const v = await m.as.vistaPrevia('codex', accion);
      expect(JSON.stringify(v)).not.toContain('ghp_SECRETO');
    }
    escribir(m.ruta('codex'), '[mcp_servers.github.env]\nGITHUB_TOKEN = "ghp_SECRETO"\n');
    const v = await m.as.vistaPrevia('codex', 'conectar');
    expect(JSON.stringify(v)).not.toContain('ghp_SECRETO');
    expect(v.lineas.some((l) => l.texto.includes('GITHUB_TOKEN = "***"'))).toBe(true);
  });

  it('Claude Code: secretos de proyectos y de otros servidores quedan ocultos, y el tramo largo se colapsa', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    const proyectos: Record<string, unknown> = {};
    for (let i = 0; i < 60; i++) {
      proyectos[`C:/p${i}`] = {
        mcpServers: { s: { env: { API_KEY: `sk-secreto-${i}`, HOLA: 'x' } } },
      };
    }
    escribir(
      m.ruta('claude-code'),
      JSON.stringify(
        {
          mcpServers: {
            github: { headers: { Authorization: 'Bearer ghp_SECRETO' } },
            wolfcore: { type: 'http', url: 'http://127.0.0.1:1/mcp' },
          },
          projects: proyectos,
        },
        null,
        2,
      ),
    );
    const v = await m.as.vistaPrevia('claude-code', 'conectar');
    const todo = JSON.stringify(v);
    expect(todo).not.toContain('ghp_SECRETO');
    expect(todo).not.toContain('sk-secreto');
    expect(v.lineas.length).toBeLessThan(30);
  });

  it('en YAML (Hermes) también se oculta lo sensible de otros servidores', async () => {
    const m = await montar();
    m.instalados.add('hermes');
    escribir(
      m.ruta('hermes'),
      'mcp_servers:\n  otro:\n    command: x\n    env:\n      MI_PASSWORD: ghp_SECRETO\n',
    );
    const v = await m.as.vistaPrevia('hermes', 'conectar');
    expect(JSON.stringify(v)).not.toContain('ghp_SECRETO');
  });
});

describe('Aviso del token que sigue escrito en otra parte', () => {
  it('si solo estaba en la entrada wolfcore, «ya no lo tiene»', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    escribir(
      m.ruta('claude-code'),
      JSON.stringify({ mcpServers: { wolfcore: { url: URL_MCP, headers: { A: TOKEN } } } }),
    );
    const r = await aplicar(m, 'claude-code');
    expect(r.tokenEscrito).toBe(true);
    expect(r.tokenSigueEn).toBeUndefined();
  });

  it('si también está en otra parte (projects…), avisa dónde sin mostrar el token', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    escribir(
      m.ruta('claude-code'),
      JSON.stringify({
        mcpServers: { wolfcore: { url: URL_MCP, headers: { A: TOKEN } } },
        projects: { 'C:/p': { mcpServers: { x: { env: { T: TOKEN } } } } },
      }),
    );
    const r = await aplicar(m, 'claude-code');
    expect(r.tokenEscrito).toBeUndefined();
    expect(r.tokenSigueEn).toBe('projects…');
    expect(JSON.stringify(r)).not.toContain(TOKEN);
    expect(leer(r.respaldo!)).not.toContain(TOKEN);
  });
});

describe('Enlaces y uniones, también en carpetas intermedias', () => {
  function unir(real: string, enlace: string): boolean {
    try {
      mkdirSync(real, { recursive: true });
      symlinkSync(real, enlace, 'junction');
      return true;
    } catch {
      return false;
    }
  }

  it('opencode: ~/.config convertida en unión se rechaza y no se escribe en su destino', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    const real = path.join(m.inicio, 'dotfiles', 'config');
    if (!unir(real, path.join(m.inicio, '.config'))) return;
    mkdirSync(path.join(real, 'opencode'), { recursive: true });
    escribir(path.join(real, 'opencode', 'opencode.json'), '{}');
    await expect(m.as.vistaPrevia('opencode', 'conectar')).rejects.toMatchObject({
      codigo: 'asistentes.enlace_rechazado',
    });
    expect(leer(path.join(real, 'opencode', 'opencode.json'))).toBe('{}');
  });

  it('una unión intermedia que aparece entre la vista previa y el reemplazo también se rechaza', async () => {
    const m = await montar();
    const dir = path.join(m.inicio, '.config', 'opencode');
    const archivo = path.join(dir, 'opencode.json');
    escribir(archivo, '{}');
    const intruso = path.join(m.inicio, 'intruso');
    mkdirSync(intruso);
    escribir(path.join(intruso, 'opencode.json'), '{}');
    let hecho = false;
    await expect(
      editarConfigAgente(
        archivo,
        'json',
        'mcp',
        { type: 'remote', url: URL_MCP },
        undefined,
        {
          antesDeReemplazar: async () => {
            // El atacante cambia la carpeta por una unión justo antes del rename.
            renameSync(path.join(m.inicio, '.config'), path.join(m.inicio, '.config-x'));
            hecho = unir(intruso, path.join(m.inicio, '.config'));
            if (!hecho) throw new Error('sin permiso para crear uniones');
          },
        },
        undefined,
        { rechazarEnlaces: true, raizSinEnlaces: m.inicio },
      ),
    ).rejects.toMatchObject({ codigo: 'asistentes.enlace_rechazado' });
    if (!hecho) return;
    expect(readFileSync(path.join(intruso, 'opencode.json'), 'utf8')).toBe('{}');
  });

  it('rechazarEnlaces: un archivo que es un enlace lanza en vez de seguirlo', async () => {
    const m = await montar();
    const real = path.join(m.inicio, 'real.json');
    escribir(real, '{}');
    const enlace = path.join(m.inicio, 'enlace.json');
    try {
      symlinkSync(real, enlace, 'file');
    } catch {
      return;
    }
    await expect(
      editarConfigAgente(enlace, 'json', 'mcpServers', { url: 'x' }, undefined, {}, undefined, {
        rechazarEnlaces: true,
      }),
    ).rejects.toMatchObject({ codigo: 'asistentes.enlace_rechazado' });
    // Sin la opción sigue el enlace (gestores de dotfiles del flujo antiguo).
    await editarConfigAgente(enlace, 'json', 'mcpServers', { url: 'x' });
    expect(JSON.parse(leer(real))).toEqual({ mcpServers: { wolfcore: { url: 'x' } } });
  });

  it('Claude Code: la carpeta que cuenta es ~, no ~/.claude', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    const real = path.join(m.inicio, 'otra');
    if (!unir(real, path.join(m.inicio, '.claude'))) return;
    escribir(m.ruta('claude-code'), '{}');
    // ~/.claude es una unión, pero el archivo real vive en ~: no es un obstáculo.
    await aplicar(m, 'claude-code');
    expect(leer(m.ruta('claude-code'))).toContain('wolfcore');
  });
});

describe('opencode V1 y V2', () => {
  it('sin mcp.servers escribe en mcp.wolfcore (V1)', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    escribir(m.ruta('opencode'), '{"mcp":{"otro":{"type":"local"}}}');
    await aplicar(m, 'opencode');
    const o = JSON.parse(leer(m.ruta('opencode'))) as { mcp: Record<string, unknown> };
    expect(Object.keys(o.mcp)).toEqual(['otro', 'wolfcore']);
  });

  it('con mcp.servers escribe en mcp.servers.wolfcore y lo reconoce como conectado', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    escribir(m.ruta('opencode'), '{"mcp":{"servers":{"otro":{"type":"local"}},"opcion":1}}');
    await aplicar(m, 'opencode');
    const o = JSON.parse(leer(m.ruta('opencode'))) as {
      mcp: { servers: Record<string, unknown>; opcion: number; wolfcore?: unknown };
    };
    expect(Object.keys(o.mcp.servers)).toEqual(['otro', 'wolfcore']);
    expect(o.mcp.wolfcore).toBeUndefined();
    expect(o.mcp.opcion).toBe(1);
    expect((await m.as.estado()).find((x) => x.id === 'opencode')!.estado).toBe('conectado');
    await aplicar(m, 'opencode', 'quitar');
    expect(JSON.parse(leer(m.ruta('opencode')))).toEqual({
      mcp: { servers: { otro: { type: 'local' } }, opcion: 1 },
    });
  });

  it('una entrada V1 con mcp.servers presente se reconoce y «Quitar» la quita de donde está', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    escribir(
      m.ruta('opencode'),
      '{"mcp":{"servers":{"otro":{"type":"local"}},"wolfcore":{"type":"remote","url":"x"}}}',
    );
    expect((await m.as.estado()).find((x) => x.id === 'opencode')!.estado).toBe('conectado');
    await aplicar(m, 'opencode', 'quitar');
    expect(JSON.parse(leer(m.ruta('opencode')))).toEqual({
      mcp: { servers: { otro: { type: 'local' } } },
    });
  });
});

describe('opencode.jsonc', () => {
  it('si la entrada está en opencode.jsonc, el estado lo indica y «Quitar» actúa ahí', async () => {
    const m = await montar();
    m.instalados.add('opencode');
    const jsonc = path.join(path.dirname(m.ruta('opencode')), 'opencode.jsonc');
    escribir(
      jsonc,
      '{\n  // mis servidores\n  "mcp": {\n    "wolfcore": { "type": "remote", "url": "x" },\n    "b": { "type": "local" }\n  }\n}\n',
    );
    const e = (await m.as.estado()).find((x) => x.id === 'opencode')!;
    expect(e.estado).toBe('conectado');
    expect(e.archivoConfig).toBe(jsonc);
    await aplicar(m, 'opencode', 'quitar');
    const t = leer(jsonc);
    expect(t).toContain('// mis servidores');
    expect(t).not.toContain('wolfcore');
    expect(t).toContain('"b"');
    expect(copias(jsonc)).toHaveLength(1);
  });
});

describe('Huella: se verifica donde se escribe', () => {
  it('editarConfigAgente con huellaEsperada que no coincide falla con vista_desfasada, sin reintento', async () => {
    const m = await montar();
    const ruta = path.join(m.inicio, 'c.json');
    escribir(ruta, '{}');
    let llamadas = 0;
    await expect(
      editarConfigAgente(
        ruta,
        'json',
        'mcpServers',
        { url: 'x' },
        undefined,
        {
          antesDeReemplazar: async () => {
            llamadas++;
          },
        },
        undefined,
        { huellaEsperada: 'a'.repeat(64) },
      ),
    ).rejects.toMatchObject({ codigo: 'asistentes.vista_desfasada' });
    expect(llamadas).toBe(0);
    expect(leer(ruta)).toBe('{}');
  });

  it('si el archivo cambia justo antes de escribir y lo mostrado ya no vale, no reintenta', async () => {
    const m = await montar();
    m.instalados.add('codex');
    escribir(m.ruta('codex'), 'a = 1\n');
    const v = await m.as.vistaPrevia('codex', 'conectar');
    // Otro programa modifica el archivo antes de que se aplique.
    escribir(m.ruta('codex'), 'a = 2\n');
    await expect(m.as.aplicar('codex', 'conectar', v.huella, true)).rejects.toMatchObject({
      codigo: 'asistentes.vista_desfasada',
    });
    expect(leer(m.ruta('codex'))).toBe('a = 2\n');
  });

  it('Claude Code: lo ajeno que cambia entre la vista previa y aplicar NO desfasa y se conserva', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    escribir(m.ruta('claude-code'), '{"numStartups":1,"mcpServers":{"otro":{"command":"x"}}}');
    const v = await m.as.vistaPrevia('claude-code', 'conectar');
    // Claude Code reescribe su archivo: otro contador, otro proyecto.
    escribir(
      m.ruta('claude-code'),
      '{"numStartups":2,"projects":{"C:/p":{"x":1}},"mcpServers":{"otro":{"command":"x"}}}',
    );
    await m.as.aplicar('claude-code', 'conectar', v.huella, true);
    const o = JSON.parse(leer(m.ruta('claude-code'))) as Record<string, unknown>;
    expect(o['numStartups']).toBe(2);
    expect(o['projects']).toEqual({ 'C:/p': { x: 1 } });
    expect(Object.keys(o['mcpServers'] as object)).toEqual(['otro', 'wolfcore']);
  });

  it('Claude Code: si lo que cambia es la entrada wolfcore, sí desfasa', async () => {
    const m = await montar();
    m.instalados.add('claude-code');
    escribir(m.ruta('claude-code'), '{"mcpServers":{"wolfcore":{"url":"vieja"}}}');
    const v = await m.as.vistaPrevia('claude-code', 'quitar');
    escribir(m.ruta('claude-code'), '{"mcpServers":{}}');
    // Quitar una entrada que ya no está: la huella (null) coincide y no hay nada que hacer.
    const r = await m.as.aplicar('claude-code', 'quitar', v.huella, true);
    expect(r.cambiado).toBe(false);
  });
});

describe('Permisos de lo que se escribe (no en Windows)', () => {
  it.skipIf(process.platform === 'win32')(
    'la copia enmascarada y el archivo nuevo conservan el modo del original',
    async () => {
      const m = await montar();
      m.instalados.add('gemini-cli');
      escribir(
        m.ruta('gemini-cli'),
        JSON.stringify({ mcpServers: { wolfcore: { url: URL_MCP, headers: { A: TOKEN } } } }),
      );
      chmodSync(m.ruta('gemini-cli'), 0o600);
      const r = await aplicar(m, 'gemini-cli');
      expect(statSync(r.respaldo!).mode & 0o777).toBe(0o600);
      expect(statSync(m.ruta('gemini-cli')).mode & 0o777).toBe(0o600);
    },
  );
});
