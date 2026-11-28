import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'jsonc-parser';
import { describe, expect, it, vi } from 'vitest';
import {
  AGENTES,
  Agentes,
  defAgente,
  IDS_AGENTE,
  INSTRUCCION_COMMIT,
  MAX_TOKENS_COMMIT,
  NPMRC_AGENTES,
  limpiarMensajeCommit,
  type DepsAgentes,
} from '../src/agentes/agentes';
import { editarConfigAgente, editarEntradaMcp } from '../src/agentes/configArchivo';
import { REGISTRO_NPM_AGENTES, urlOficial } from '../src/catalogo/catalogo';
import { archivoSensible, Git } from '../src/git/git';
import type { ClienteIa, ConfigProveedorIa } from '../src/ia/proveedores';
import { PlataformaFalsa } from '../src/plataforma/falsa';
import type { Ejecutor } from '../src/plataforma/tipos';
import { ejecutorPorDefecto } from '../src/plataforma/win';
import { carpetaTemporal } from './temporales';

// Valores claramente falsos: nunca deben aparecer en argumentos ni en archivos de los agentes.
const TOKEN_MCP = 'token-mcp-FALSO-agentes-0000000000000000000000';
const CLAVE = 'sk-ant-falsa-CENTINELA-agentes-000000000000wxyz';
const URL_MCP = 'http://127.0.0.1:47123/mcp';

const ANTHROPIC: ConfigProveedorIa = {
  id: 'anthropic',
  tipo: 'anthropic',
  nombre: 'Anthropic',
  urlBase: null,
  modelo: null,
};
const GEMINI: ConfigProveedorIa = {
  id: 'gemini',
  tipo: 'gemini',
  nombre: 'Gemini',
  urlBase: null,
  modelo: null,
};

interface Montaje {
  agentes: Agentes;
  plat: PlataformaFalsa;
  inicio: string;
  prefijo: string;
  dirNode: string;
  proyecto: string;
  exec: ReturnType<typeof vi.fn>;
  llamadas: { cmd: string; args: string[] }[];
}

/** Ejecutor falso: registra cada llamada; `responder` decide el resultado (0 por defecto). */
async function montar(
  o: {
    responder?: (
      cmd: string,
      args: string[],
    ) =>
      | Promise<{ codigo: number; stdout?: string; stderr?: string }>
      | { codigo: number; stdout?: string; stderr?: string };
    sinNode?: boolean;
  } = {},
): Promise<Montaje> {
  const inicio = await carpetaTemporal('pel-ag-inicio-');
  const prefijo = await carpetaTemporal('pel-ag-prefijo-');
  const dirNode = await carpetaTemporal('pel-ag-node-');
  const proyecto = await carpetaTemporal('pel-ag-proy-');
  const plat = new PlataformaFalsa({ carpetaInicio: inicio });
  if (!o.sinNode) {
    writeFileSync(path.join(dirNode, plat.nombreEjecutable('node')), '');
    mkdirSync(path.join(dirNode, 'node_modules', 'npm', 'bin'), { recursive: true });
    writeFileSync(path.join(dirNode, 'node_modules', 'npm', 'bin', 'npm-cli.js'), '');
  }
  const llamadas: { cmd: string; args: string[] }[] = [];
  const exec = vi.fn(async (cmd: string, args: string[]) => {
    llamadas.push({ cmd, args });
    const r =
      (await o.responder?.(cmd, args)) ??
      (args[0] === '--version' && /node/i.test(cmd)
        ? { codigo: 0, stdout: 'v22.12.0\n' }
        : { codigo: 0 });
    return { codigo: r.codigo, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  });
  const deps: DepsAgentes = {
    plataforma: plat,
    exec: exec as unknown as Ejecutor,
    nodePropio: async () => (o.sinNode ? null : dirNode),
    carpetaAgentes: () => prefijo,
    mcp: { url: async () => URL_MCP, token: async () => TOKEN_MCP },
    sitio: async (id) => {
      if (id !== 'tienda') throw new Error('no existe');
      return { carpeta: proyecto };
    },
    proveedorIa: async (id) => {
      if (id === 'anthropic') return ANTHROPIC;
      if (id === 'gemini') return GEMINI;
      throw new Error('no existe');
    },
    diffPreparado: async () => ({ diff: '', omitidos: [], truncado: false }),
    commitPreparado: async () => undefined,
    ahora: () => new Date(2026, 10, 19, 10, 30, 0),
  };
  return {
    agentes: new Agentes(deps),
    plat,
    inicio,
    prefijo,
    dirNode,
    proyecto,
    exec,
    llamadas,
  };
}

/** Simula un paquete de npm instalado globalmente en `prefijo`. */
function paquete(
  prefijo: string,
  nombre: string,
  binario: string,
  version: string,
  bin = 'cli.js',
) {
  const dir = path.join(prefijo, 'node_modules', ...nombre.split('/'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: nombre, version, bin: { [binario]: bin } }),
  );
  if (!bin.includes('..')) {
    mkdirSync(path.dirname(path.join(dir, bin)), { recursive: true });
    writeFileSync(path.join(dir, bin), '#!/usr/bin/env node\n');
  }
  return path.join(dir, bin);
}

const copias = (dir: string, base: string): string[] =>
  readdirSync(dir).filter((n) => n.startsWith(`${base}.wolfcore-`) && n.endsWith('.bak'));

describe('Agentes: detección', () => {
  it('sin nada instalado: no instalado; Claude y Codex instalables, Hermes solo con guía', async () => {
    const { agentes } = await montar();
    const e = await agentes.estado();
    expect(e.map((x) => [x.id, x.instalado, x.instalable, x.mcpRegistrado])).toEqual([
      ['claude-code', false, true, false],
      ['codex', false, true, false],
      ['hermes', false, false, false],
      ['opencode', false, true, false],
      ['gemini-cli', false, true, false],
      ['qwen-code', false, true, false],
      ['copilot-cli', false, true, false],
      ['antigravity', false, false, false],
    ]);
    expect(e[2]!.guia).toMatch(/^https:\/\/hermes-agent\.nousresearch\.com\//);
    // Lo que muestran los diálogos: paquete que se instalaría y archivo que se tocaría.
    expect(e.map((x) => [x.nombre, x.paquete, path.basename(x.archivoConfig)])).toEqual([
      ['Claude Code', '@anthropic-ai/claude-code', '.claude.json'],
      ['Codex CLI', '@openai/codex', 'config.toml'],
      ['Hermes Agent', null, 'config.yaml'],
      ['Opencode', 'opencode-ai', 'opencode.json'],
      ['Gemini CLI', '@google/gemini-cli', 'settings.json'],
      ['Qwen Code', '@qwen-code/qwen-code', 'settings.json'],
      ['GitHub Copilot CLI', '@github/copilot', 'mcp-config.json'],
      ['Antigravity CLI', null, 'mcp_config.json'],
    ]);
    // Solo Antigravity no admite el registro: no documenta el token por variable de entorno.
    expect(e.map((x) => x.mcpSoportado)).toEqual([true, true, true, true, true, true, true, false]);
  });

  it('detecta el paquete propio, el npm global del usuario y el ejecutable sin ejecutarlo', async () => {
    const { agentes, prefijo, plat, exec } = await montar({
      responder: (_c, a) =>
        a[0] === '--version' ? { codigo: 0, stdout: 'hermes 0.9.1\n' } : { codigo: 1 },
    });
    const cli = paquete(prefijo, '@anthropic-ai/claude-code', 'claude', '2.1.0');
    const global = await carpetaTemporal('pel-ag-npmg-');
    plat.npmGlobal = [global];
    const codex = paquete(global, '@openai/codex', 'codex', '0.50.0', 'bin/codex.js');
    plat.ejecutables.set('hermes', '/bin/hermes');
    const e = await agentes.estado();
    expect(e[0]).toMatchObject({ instalado: true, ruta: cli, version: '2.1.0', origen: 'propio' });
    expect(e[1]).toMatchObject({
      instalado: true,
      ruta: codex,
      version: '0.50.0',
      origen: 'npm-usuario',
    });
    // Un ejecutable del PATH o de ~/.local/bin no se ejecuta solo por abrir la pantalla:
    // "versión desconocida" hasta que el usuario la pida.
    expect(e[2]).toMatchObject({
      instalado: true,
      ruta: '/bin/hermes',
      version: null,
      origen: 'ejecutable',
    });
    expect(exec).not.toHaveBeenCalled();
    // A pedido del usuario sí se pregunta `--version`.
    expect(await agentes.version('hermes')).toBe('0.9.1');
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec.mock.calls[0]![0]).toBe('/bin/hermes');
    expect(exec.mock.calls[0]![1]).toEqual(['--version']);
    // De un paquete la versión sale de su package.json, sin ejecutar nada.
    expect(await agentes.version('claude-code')).toBe('2.1.0');
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('version de un agente que no está: null; de uno que no existe: agentes.no_existe', async () => {
    const { agentes, exec } = await montar();
    expect(await agentes.version('codex')).toBeNull();
    await expect(agentes.version('otro' as never)).rejects.toMatchObject({
      codigo: 'agentes.no_existe',
    });
    expect(exec).not.toHaveBeenCalled();
  });

  it('abrir no pregunta la versión de un ejecutable del PATH', async () => {
    const { agentes, plat, exec } = await montar();
    plat.ejecutables.set('claude', '/bin/claude');
    await agentes.abrir('claude-code', 'tienda');
    expect(exec).not.toHaveBeenCalled();
  });

  it('un binario declarado fuera de la carpeta del paquete no cuenta', async () => {
    const { agentes, prefijo } = await montar();
    paquete(prefijo, '@anthropic-ai/claude-code', 'claude', '2.1.0', '../../fuera.js');
    expect((await agentes.estado())[0]!.instalado).toBe(false);
  });

  it('mcpRegistrado lee la entrada wolfcore de cada archivo', async () => {
    const { agentes, inicio } = await montar();
    writeFileSync(
      path.join(inicio, '.claude.json'),
      JSON.stringify({ mcpServers: { wolfcore: { type: 'http', url: URL_MCP } } }),
    );
    mkdirSync(path.join(inicio, '.codex'));
    writeFileSync(path.join(inicio, '.codex', 'config.toml'), '[mcp_servers.otro]\nurl = "x"\n');
    const e = await agentes.estado();
    expect(e.map((x) => x.mcpRegistrado)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('Agentes: instalación', () => {
  it('usa npm del Node propio con el paquete oficial, el prefijo propio y registry.npmjs.org', async () => {
    const { agentes, llamadas, dirNode, prefijo, plat } = await montar();
    await agentes.instalar('claude-code', true);
    await agentes.instalar('codex', true);
    const npm = path.join(dirNode, 'node_modules', 'npm', 'bin', 'npm-cli.js');
    const nodo = path.join(dirNode, plat.nombreEjecutable('node'));
    const npmrc = path.join(prefijo, NPMRC_AGENTES);
    const esperado = (p: string, scripts: boolean) => ({
      cmd: nodo,
      args: [
        npm,
        'install',
        '--global',
        '--prefix',
        prefijo,
        '--registry',
        'https://registry.npmjs.org/',
        // La configuración de npm del usuario (registro, proxy, scripts…) no cuenta: un archivo
        // vacío de WolfCore Dev en su lugar.
        '--userconfig',
        npmrc,
        '--globalconfig',
        npmrc,
        '--no-fund',
        '--no-audit',
        // Codex no tiene scripts de instalación; Claude Code sí los necesita (install.cjs).
        ...(scripts ? [] : ['--ignore-scripts']),
        p,
      ],
    });
    expect(llamadas).toEqual([
      esperado('@anthropic-ai/claude-code', true),
      esperado('@openai/codex', false),
    ]);
    expect(readFileSync(npmrc, 'utf8')).toBe('');
    // Si alguien escribió en él, se vacía antes de instalar.
    writeFileSync(npmrc, 'registry=https://otro.example.test/\n');
    await agentes.instalar('codex', true);
    expect(readFileSync(npmrc, 'utf8')).toBe('');
    expect(REGISTRO_NPM_AGENTES).toBe('https://registry.npmjs.org/');
    // El registro de npm no se vuelve un host del catálogo de binarios.
    expect(urlOficial('https://registry.npmjs.org/x.tgz')).toBe(false);
  });

  it('sin confirmación, Hermes, sin Node o con fallo: errores con código y nada ejecutado de más', async () => {
    const m = await montar({
      responder: () => ({ codigo: 1, stderr: `npm ERR! 401 OPENAI_API_KEY=${CLAVE}` }),
    });
    await expect(m.agentes.instalar('claude-code', false as never)).rejects.toMatchObject({
      codigo: 'agentes.sin_confirmar',
    });
    await expect(m.agentes.instalar('hermes', true)).rejects.toMatchObject({
      codigo: 'agentes.no_instalable',
      datos: { guia: expect.stringContaining('hermes-agent.nousresearch.com') },
    });
    expect(m.exec).not.toHaveBeenCalled();
    const e = await m.agentes.instalar('codex', true).catch((x: unknown) => x);
    expect(e).toMatchObject({ codigo: 'agentes.instalacion_fallo' });
    expect(JSON.stringify(e)).not.toContain(CLAVE);
    const sin = await montar({ sinNode: true });
    await expect(sin.agentes.instalar('codex', true)).rejects.toMatchObject({
      codigo: 'agentes.sin_node',
    });
    expect(sin.exec).not.toHaveBeenCalled();
  });
});

describe('Edición de configuraciones de agentes: casos que se rechazan', () => {
  it('una sección mcp_servers que no es tabla, o una edición que cambiaría otras cosas, se rechaza', () => {
    expect(() =>
      editarEntradaMcp('json', '{"mcpServers": 3}', 'mcpServers', { url: 'u' }, 'x.json'),
    ).toThrow(expect.objectContaining({ codigo: 'agentes.config_ilegible' }));
    // wolfcore definido con claves con punto: error propio, no se edita.
    expect(() =>
      editarEntradaMcp(
        'toml',
        '[mcp_servers]\nwolfcore.url = "a"\n',
        'mcp_servers',
        { url: 'u' },
        'c.toml',
      ),
    ).toThrow(expect.objectContaining({ codigo: 'asistentes.entrada_no_editable' }));
  });
});

describe('Agentes: abrir en un proyecto', () => {
  it('la clave y el token van solo en el entorno de ese proceso', async () => {
    const m = await montar();
    const cli = paquete(m.prefijo, '@anthropic-ai/claude-code', 'claude', '2.1.0');
    await m.agentes.abrir('claude-code', 'tienda', { proveedorIa: 'anthropic', clave: CLAVE });
    expect(m.plat.terminales).toHaveLength(1);
    const t = m.plat.terminales[0]!;
    expect(t.cwd).toBe(m.proyecto);
    expect(t.env).toEqual({ ANTHROPIC_API_KEY: CLAVE, WOLFCORE_MCP_TOKEN: TOKEN_MCP });
    expect(t.comando).toEqual([path.join(m.dirNode, m.plat.nombreEjecutable('node')), cli]);
    expect(JSON.stringify(t.comando)).not.toContain(CLAVE);
    // Nada escrito en la carpeta del usuario ni en el proyecto.
    expect(readdirSync(m.inicio)).toEqual([]);
    expect(readdirSync(m.proyecto)).toEqual([]);
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('sin proveedor solo lleva el token; con uno que el agente no admite, falla', async () => {
    const m = await montar();
    m.plat.ejecutables.set('claude', '/bin/claude');
    await m.agentes.abrir('claude-code', 'tienda');
    expect(m.plat.terminales[0]!.env).toEqual({ WOLFCORE_MCP_TOKEN: TOKEN_MCP });
    expect(m.plat.terminales[0]!.comando).toEqual(['/bin/claude']);
    await expect(
      m.agentes.abrir('claude-code', 'tienda', { proveedorIa: 'gemini', clave: CLAVE }),
    ).rejects.toMatchObject({ codigo: 'agentes.proveedor_incompatible' });
    await expect(
      m.agentes.abrir('claude-code', 'tienda', { proveedorIa: 'anthropic' }),
    ).rejects.toMatchObject({ codigo: 'ia.sin_clave' });
    expect(m.plat.terminales).toHaveLength(1);
  });

  it('un agente que no está instalado da agentes.no_instalado', async () => {
    const m = await montar();
    await expect(m.agentes.abrir('codex', 'tienda')).rejects.toMatchObject({
      codigo: 'agentes.no_instalado',
    });
    expect(m.plat.terminales).toEqual([]);
  });
});

describe('Agentes: mensaje de commit sugerido', () => {
  it('manda la instrucción fija y el diff, con tope de tokens, y limpia la respuesta', async () => {
    const m = await montar();
    const deps = (m.agentes as unknown as { d: DepsAgentes }).d;
    deps.diffPreparado = async () => ({
      diff: 'diff --git a/x b/x\n+hola\n',
      omitidos: [],
      truncado: false,
    });
    const mensaje = vi.fn(async () => ({ texto: '```\nfeat: saludo\n```' }));
    const cliente = { modelos: vi.fn(), mensaje } as unknown as ClienteIa;
    expect(await m.agentes.sugerirCommit(m.proyecto, cliente, CLAVE, 'claude-x')).toBe(
      'feat: saludo',
    );
    expect(mensaje).toHaveBeenCalledWith(
      CLAVE,
      'claude-x',
      `${INSTRUCCION_COMMIT}diff --git a/x b/x\n+hola\n`,
      { maxTokens: MAX_TOKENS_COMMIT },
    );
    deps.diffPreparado = async () => ({ diff: '', omitidos: ['.env'], truncado: false });
    await expect(
      m.agentes.sugerirCommit(m.proyecto, cliente, CLAVE, 'claude-x'),
    ).rejects.toMatchObject({ codigo: 'agentes.sin_cambios_preparados' });
    expect(limpiarMensajeCommit('"fix: algo"')).toBe('fix: algo');
  });

  it('archivoSensible reconoce .env*, claves y llaves', () => {
    for (const r of ['.env', 'app/.env.local', 'certs/a.pem', 'x.key', 'id_ed25519', 'b.pfx']) {
      expect(archivoSensible(r), r).toBe(true);
    }
    for (const r of ['src/env.ts', 'README.md', 'llave.txt'])
      expect(archivoSensible(r), r).toBe(false);
  });

  it('archivoSensible reconoce credenciales comunes de herramientas y frameworks', () => {
    for (const r of [
      'auth.json',
      'composer/auth.json',
      '.git-credentials',
      'public/.htpasswd',
      'infra/prod.tfvars',
      'infra/prod.tfvars.json',
      'infra/terraform.tfstate',
      'infra/terraform.tfstate.backup',
      'wp-config.php',
      'web/wp-config.php',
      'secrets.yml',
      'config/secrets.json',
      'secrets.env',
      'kubeconfig',
      '.kube/config',
      '.dockercfg',
      '.docker/config.json',
      'config/database.yml',
      'app/config/database.yml',
      'config/credentials.yml.enc',
      '.aws/credentials',
      '.pgpass',
      '.my.cnf',
      '.s3cfg',
      'local.settings.json',
    ]) {
      expect(archivoSensible(r), r).toBe(true);
    }
    for (const r of [
      'database.yml',
      'src/secretsManager.ts',
      'docs/kubeconfig.md',
      'config/app.php',
      'wp-config-sample.php',
      'package.json',
    ]) {
      expect(archivoSensible(r), r).toBe(false);
    }
  });
});

const hayGit = spawnSync('git', ['--version'], { windowsHide: true }).status === 0;

describe.skipIf(!hayGit)(
  'Git real: diff preparado y commit solo de lo preparado',
  { timeout: 30_000 },
  () => {
    const correr = (cwd: string, ...args: string[]): string => {
      const r = spawnSync('git', args, { cwd, windowsHide: true, encoding: 'utf8' });
      if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
      return r.stdout;
    };

    async function repo(): Promise<string> {
      const dir = await carpetaTemporal('pel-ag-git-');
      correr(dir, 'init', '-q');
      correr(dir, 'config', 'user.name', 'Prueba');
      correr(dir, 'config', 'user.email', 'prueba@example.test');
      correr(dir, 'config', 'commit.gpgsign', 'false');
      correr(dir, 'config', 'core.autocrlf', 'false');
      writeFileSync(path.join(dir, 'base.txt'), 'base\n');
      correr(dir, 'add', 'base.txt');
      correr(dir, 'commit', '-q', '-m', 'base');
      return dir;
    }

    it('el diff omite .env*, claves y binarios, enmascara secretos y se acota', async () => {
      const dir = await repo();
      mkdirSync(path.join(dir, 'src'));
      writeFileSync(path.join(dir, 'src', 'app.js'), `const k = 'x';\nOPENAI_API_KEY=${CLAVE}\n`);
      writeFileSync(path.join(dir, '.env'), `ANTHROPIC_API_KEY=${CLAVE}\n`);
      writeFileSync(path.join(dir, 'server.pem'), '-----BEGIN PRIVATE KEY-----\n');
      writeFileSync(path.join(dir, 'logo.png'), Buffer.from([0x89, 0x50, 0, 0, 1, 2, 3]));
      correr(dir, 'add', '-A');
      const git = new Git();
      const d = await git.diffPreparado(dir);
      expect(d.diff).toContain('src/app.js');
      expect(d.diff).not.toContain(CLAVE);
      expect(d.diff).not.toContain('.env');
      expect(d.diff).not.toContain('PRIVATE KEY');
      expect(d.omitidos.sort()).toEqual(['.env', 'logo.png', 'server.pem']);
      expect(d.truncado).toBe(false);
      const corto = await git.diffPreparado(dir, 40);
      expect(corto.diff).toHaveLength(40);
      expect(corto.truncado).toBe(true);
    });

    it('el diff no usa textconv ni diff externo del repositorio (no ejecuta sus comandos)', async () => {
      const dir = await repo();
      // Un repositorio clonado puede traer .gitattributes con un driver; la configuración del
      // driver (aquí en el repo) ejecutaría un comando al hacer `git diff`.
      correr(dir, 'config', 'diff.raro.textconv', 'echo TEXTCONV-EJECUTADO');
      correr(dir, 'config', 'diff.raro.command', 'echo EXTDIFF-EJECUTADO');
      writeFileSync(path.join(dir, '.gitattributes'), '*.txt diff=raro\n');
      writeFileSync(path.join(dir, 'nota.txt'), 'contenido real\n');
      correr(dir, 'add', '-A');
      const llamadas: string[][] = [];
      const exec: Ejecutor = (cmd, args, o) => {
        llamadas.push(args);
        return ejecutorPorDefecto(cmd, args, o);
      };
      const d = await new Git({ exec }).diffPreparado(dir);
      expect(d.diff).toContain('contenido real');
      expect(d.diff).not.toContain('TEXTCONV-EJECUTADO');
      expect(d.diff).not.toContain('EXTDIFF-EJECUTADO');
      for (const a of llamadas.filter((x) => x.includes('diff'))) {
        expect(a).toContain('--no-textconv');
        expect(a).toContain('--no-ext-diff');
      }
    });

    it('commitPreparado hace commit solo de lo preparado, nunca add ni push', async () => {
      const dir = await repo();
      writeFileSync(path.join(dir, 'preparado.txt'), 'sí\n');
      writeFileSync(path.join(dir, 'base.txt'), 'cambiado sin preparar\n');
      writeFileSync(path.join(dir, 'nuevo.txt'), 'sin seguir\n');
      correr(dir, 'add', 'preparado.txt');
      const llamadas: string[][] = [];
      const exec: Ejecutor = (cmd, args, o) => {
        llamadas.push(args);
        return ejecutorPorDefecto(cmd, args, o);
      };
      const git = new Git({ exec });
      await git.commitPreparado(dir, 'feat: solo lo preparado\n\nCuerpo.');
      expect(correr(dir, 'log', '-1', '--format=%B').trim()).toBe(
        'feat: solo lo preparado\n\nCuerpo.',
      );
      expect(correr(dir, 'show', '--name-only', '--format=', 'HEAD').trim()).toBe('preparado.txt');
      const estado = correr(dir, 'status', '--porcelain');
      expect(estado).toContain(' M base.txt');
      expect(estado).toContain('?? nuevo.txt');
      const planas = llamadas.flat();
      expect(planas).not.toContain('add');
      expect(planas).not.toContain('push');
      expect(planas).not.toContain('-a');
      expect(planas).not.toContain('--all');
      await expect(git.commitPreparado(dir, 'otra')).rejects.toMatchObject({
        codigo: 'agentes.sin_cambios_preparados',
      });
      await expect(git.commitPreparado(dir, '   ')).rejects.toMatchObject({
        codigo: 'git.mensaje_invalido',
      });
      expect(existsSync(path.join(dir, '.git'))).toBe(true);
    });
  },
);

describe('Plataforma: prefijos de npm global del usuario', () => {
  it('Windows usa la carpeta npm de APPDATA; sin APPDATA, ninguna', async () => {
    const { PlataformaWindows } = await import('../src/plataforma/win');
    const con = new PlataformaWindows(undefined, undefined, {
      entorno: { APPDATA: 'C:\\Users\\u\\AppData\\Roaming' },
    });
    expect(con.carpetasNpmGlobal()).toEqual(['C:\\Users\\u\\AppData\\Roaming\\npm']);
    expect(
      new PlataformaWindows(undefined, undefined, { entorno: {} }).carpetasNpmGlobal(),
    ).toEqual([]);
  });
});

describe('Configuración de agentes: copias acotadas y cambios a la vez', () => {
  const entrada = { type: 'http', url: URL_MCP };

  it('guarda como mucho 5 copias por archivo (las más nuevas) y no toca otros archivos', async () => {
    const dir = await carpetaTemporal('pel-ag-copias-');
    const ruta = path.join(dir, '.claude.json');
    writeFileSync(ruta, '{"a": 1}\n');
    // Copias viejas propias (y una con sufijo por choque en el mismo segundo).
    const viejas = [
      '20260101-000000',
      '20260102-000000',
      '20260103-000000',
      '20260104-000000',
      '20260105-000000',
      '20260105-000000-1',
    ];
    for (const v of viejas) writeFileSync(`${ruta}.wolfcore-${v}.bak`, v);
    // Ajenos: no son copias nuestras (o son de otro archivo).
    writeFileSync(`${ruta}.wolfcore-notas.bak`, 'mío');
    writeFileSync(path.join(dir, 'otro.json.wolfcore-20250101-000000.bak'), 'otro');
    mkdirSync(`${ruta}.wolfcore-20240101-000000.bak`);
    const r = await editarConfigAgente(
      ruta,
      'json',
      'mcpServers',
      entrada,
      new Date(2026, 10, 19, 10, 30, 0),
    );
    expect(r.respaldo).toBe(`${ruta}.wolfcore-20261119-103000.bak`);
    expect(copias(dir, '.claude.json').sort()).toEqual(
      [
        '.claude.json.wolfcore-20240101-000000.bak',
        '.claude.json.wolfcore-20260103-000000.bak',
        '.claude.json.wolfcore-20260104-000000.bak',
        '.claude.json.wolfcore-20260105-000000.bak',
        '.claude.json.wolfcore-20260105-000000-1.bak',
        '.claude.json.wolfcore-20261119-103000.bak',
        '.claude.json.wolfcore-notas.bak',
      ].sort(),
    );
    expect(existsSync(path.join(dir, 'otro.json.wolfcore-20250101-000000.bak'))).toBe(true);
  });

  it('si el archivo cambia mientras se edita, vuelve a leerlo una vez y conserva el cambio', async () => {
    const dir = await carpetaTemporal('pel-ag-carrera-');
    const ruta = path.join(dir, '.claude.json');
    writeFileSync(ruta, '{"mcpServers": {"otro": {"url": "x"}}}\n');
    let veces = 0;
    const r = await editarConfigAgente(ruta, 'json', 'mcpServers', entrada, undefined, {
      antesDeReemplazar: async () => {
        veces++;
        // El agente escribe su archivo justo entonces (solo la primera vez).
        if (veces === 1) writeFileSync(ruta, '{"mcpServers": {"otro": {"url": "x"}}, "b": 2}\n');
      },
    });
    expect(r.cambiado).toBe(true);
    expect(veces).toBe(2);
    const final = parse(readFileSync(ruta, 'utf8')) as Record<string, unknown>;
    expect(final).toEqual({
      mcpServers: { otro: { url: 'x' }, wolfcore: entrada },
      b: 2,
    });
  });

  it('si sigue cambiando, falla con agentes.config_en_uso y deja el archivo del agente', async () => {
    const dir = await carpetaTemporal('pel-ag-carrera2-');
    const ruta = path.join(dir, '.claude.json');
    writeFileSync(ruta, '{"a": 0}\n');
    let n = 0;
    const e = await editarConfigAgente(ruta, 'json', 'mcpServers', entrada, undefined, {
      antesDeReemplazar: async () => {
        n++;
        writeFileSync(ruta, `{"a": ${n}}\n`);
      },
    }).catch((x: unknown) => x);
    expect(e).toMatchObject({
      codigo: 'agentes.config_en_uso',
      datos: { archivo: '.claude.json' },
    });
    // Queda lo que escribió el agente, no la edición de WolfCore Dev.
    expect(readFileSync(ruta, 'utf8')).toBe(`{"a": ${n}}\n`);
    expect(readdirSync(dir).filter((x) => x.includes('pel-tmp'))).toEqual([]);
  });
});

/* ───────────── D3: Opencode, Gemini CLI, Qwen Code, Copilot CLI y Antigravity ───────────── */

/** Agentes nuevos que cumplen los 4 criterios: se instalan y se registran enteros. */
const NUEVOS = [
  {
    id: 'opencode',
    paquete: 'opencode-ai',
    binario: 'opencode',
    fixture: 'opencode.json',
    archivo: ['.config', 'opencode', 'opencode.json'],
    seccion: 'mcp',
    entrada: {
      type: 'remote',
      url: URL_MCP,
      oauth: false,
      headers: { Authorization: 'Bearer {env:WOLFCORE_MCP_TOKEN}' },
    },
    scripts: true,
  },
  {
    id: 'gemini-cli',
    paquete: '@google/gemini-cli',
    binario: 'gemini',
    fixture: 'gemini-settings.json',
    archivo: ['.gemini', 'settings.json'],
    seccion: 'mcpServers',
    entrada: { httpUrl: URL_MCP, headers: { Authorization: 'Bearer ${WOLFCORE_MCP_TOKEN}' } },
    scripts: false,
  },
  {
    id: 'qwen-code',
    paquete: '@qwen-code/qwen-code',
    binario: 'qwen',
    fixture: 'qwen-settings.json',
    archivo: ['.qwen', 'settings.json'],
    seccion: 'mcpServers',
    entrada: { httpUrl: URL_MCP, headers: { Authorization: 'Bearer ${WOLFCORE_MCP_TOKEN}' } },
    scripts: false,
  },
  {
    id: 'copilot-cli',
    paquete: '@github/copilot',
    binario: 'copilot',
    fixture: 'copilot-mcp-config.json',
    archivo: ['.copilot', 'mcp-config.json'],
    seccion: 'mcpServers',
    entrada: {
      type: 'http',
      url: URL_MCP,
      headers: { Authorization: 'Bearer ${WOLFCORE_MCP_TOKEN}' },
      tools: ['*'],
    },
    scripts: false,
  },
] as const;

describe('Agentes D3: la lista sale de IDS_AGENTE', () => {
  it('IDS_AGENTE, AGENTES y defAgente coinciden y no hay ids repetidos', () => {
    expect([...IDS_AGENTE]).toEqual([
      'claude-code',
      'codex',
      'hermes',
      'opencode',
      'gemini-cli',
      'qwen-code',
      'copilot-cli',
      'antigravity',
    ]);
    expect(Object.keys(AGENTES).sort()).toEqual([...IDS_AGENTE].sort());
    for (const id of IDS_AGENTE) expect(defAgente(id).id).toBe(id);
  });
});

describe.each(NUEVOS)('Agentes D3: $id', (n) => {
  it('instalar usa el paquete oficial con el Node propio', async () => {
    const m = await montar();
    await m.agentes.instalar(n.id, true);
    const a = m.llamadas.at(-1)!.args;
    expect(a[a.length - 1]).toBe(n.paquete);
    expect(a).toContain(REGISTRO_NPM_AGENTES);
    expect(a.includes('--ignore-scripts')).toBe(!n.scripts);
  });

  it('abrir inyecta el token solo en el env del proceso', async () => {
    const m = await montar();
    const cli = paquete(m.prefijo, n.paquete, n.binario, '1.0.0');
    await m.agentes.abrir(n.id, 'tienda');
    const t = m.plat.terminales[0]!;
    expect(t.cwd).toBe(m.proyecto);
    expect(t.env).toEqual({ WOLFCORE_MCP_TOKEN: TOKEN_MCP });
    expect(t.comando).toContain(cli);
    expect(JSON.stringify(t.comando)).not.toContain(TOKEN_MCP);
    // Nada se escribió en la carpeta del usuario ni en el proyecto.
    expect(readdirSync(m.inicio)).toEqual([]);
    expect(readdirSync(m.proyecto)).toEqual([]);
  });
});

describe('Agentes D3: claves de proveedor por agente', () => {
  const OPENAI: ConfigProveedorIa = {
    id: 'openai',
    tipo: 'openai',
    nombre: 'OpenAI',
    urlBase: null,
    modelo: null,
  };
  it('cada agente declara solo los proveedores que admite', () => {
    expect(AGENTES['opencode'].variablesClave(ANTHROPIC, CLAVE)).toEqual({
      ANTHROPIC_API_KEY: CLAVE,
    });
    expect(AGENTES['opencode'].variablesClave(OPENAI, CLAVE)).toEqual({ OPENAI_API_KEY: CLAVE });
    expect(AGENTES['gemini-cli'].variablesClave(GEMINI, CLAVE)).toEqual({ GEMINI_API_KEY: CLAVE });
    // Con URL base propia la clave iría a otro servidor: solo con GOOGLE_GEMINI_BASE_URL (documentada).
    expect(
      AGENTES['gemini-cli'].variablesClave(
        { ...GEMINI, urlBase: 'https://proxy.ejemplo.test' },
        CLAVE,
      ),
    ).toEqual({ GEMINI_API_KEY: CLAVE, GOOGLE_GEMINI_BASE_URL: 'https://proxy.ejemplo.test' });
    // Opencode: ANTHROPIC_BASE_URL lleva /v1 (se agrega si falta, una sola vez).
    for (const u of ['https://proxy.ejemplo.test', 'https://proxy.ejemplo.test/v1/']) {
      expect(AGENTES['opencode'].variablesClave({ ...ANTHROPIC, urlBase: u }, CLAVE)).toEqual({
        ANTHROPIC_API_KEY: CLAVE,
        ANTHROPIC_BASE_URL: 'https://proxy.ejemplo.test/v1',
      });
    }
    expect(AGENTES['gemini-cli'].variablesClave(ANTHROPIC, CLAVE)).toBeNull();
    expect(AGENTES['qwen-code'].variablesClave(OPENAI, CLAVE)).toEqual({ OPENAI_API_KEY: CLAVE });
    expect(AGENTES['copilot-cli'].variablesClave(OPENAI, CLAVE)).toBeNull();
    expect(AGENTES['antigravity'].variablesClave(GEMINI, CLAVE)).toBeNull();
  });
});

describe('Agentes D3: Antigravity solo con detección y guía', () => {
  it('instalar falla con agentes.no_instalable y la guía oficial, sin ejecutar nada', async () => {
    const m = await montar();
    await expect(m.agentes.instalar('antigravity', true)).rejects.toMatchObject({
      codigo: 'agentes.no_instalable',
      datos: { guia: expect.stringContaining('antigravity.google') },
    });
    expect(m.exec).not.toHaveBeenCalled();
  });

  it('se detecta el ejecutable agy y se abre con solo el token', async () => {
    const m = await montar();
    const exe = path.join(m.inicio, 'AppData', 'Local', 'agy', 'bin', 'agy');
    m.plat.ejecutables.set('agy', exe);
    const e = (await m.agentes.estado()).find((x) => x.id === 'antigravity')!;
    expect(e).toMatchObject({ instalado: true, origen: 'ejecutable', mcpSoportado: false });
    await m.agentes.abrir('antigravity', 'tienda');
    expect(m.plat.terminales[0]!.comando).toEqual([exe]);
    // No admite el MCP por variable: el token no se le da ni en el entorno.
    expect(m.plat.terminales[0]!.env).toEqual({});
    expect(JSON.stringify(m.plat.terminales[0]!)).not.toContain(TOKEN_MCP);
  });
});

describe('Agentes D3: revisión', () => {
  it('Antigravity: la entrada MCP falla con el nombre del agente', () => {
    let e: unknown;
    try {
      AGENTES['antigravity'].entradaMcp(URL_MCP);
    } catch (x) {
      e = x;
    }
    expect(e).toMatchObject({
      codigo: 'agentes.mcp_no_soportado',
      datos: { agente: 'Antigravity CLI' },
    });
  });

  it('el registro de Opencode también se detecta en opencode.jsonc', async () => {
    const m = await montar();
    const dir = path.join(m.inicio, '.config', 'opencode');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, 'opencode.jsonc'),
      `// comentario\n{\n  "mcp": { "wolfcore": { "type": "remote", "url": "${URL_MCP}" }, },\n}\n`,
    );
    const e = (await m.agentes.estado()).find((x) => x.id === 'opencode')!;
    expect(e.mcpRegistrado).toBe(true);
  });

  it('un valor con lista de textos (tools) se escribe también en TOML y YAML', () => {
    const v = { url: URL_MCP, tools: ['*'] };
    const toml = editarEntradaMcp('toml', '', 'mcp_servers', v, 'x.toml');
    expect(toml).toContain('tools = ["*"]');
    const yaml = editarEntradaMcp('yaml', '', 'mcp_servers', v, 'x.yaml');
    expect(yaml).toContain('tools:');
    expect(yaml).toContain('"*"');
  });
});

describe('Agentes D5: Node mínimo de Copilot CLI y Qwen Code', () => {
  const NODE_VIEJO = (cmd: string, args: string[]) =>
    args[0] === '--version' && /node/i.test(cmd)
      ? { codigo: 0, stdout: 'v20.18.1\n' }
      : { codigo: 0 };
  const NODE_NUEVO = (cmd: string, args: string[]) =>
    args[0] === '--version' && /node/i.test(cmd)
      ? { codigo: 0, stdout: 'v22.12.0\n' }
      : { codigo: 0 };

  it('declaran Node 22 y los demás no exigen versión', () => {
    expect(AGENTES['copilot-cli'].nodeMinimo).toBe(22);
    expect(AGENTES['qwen-code'].nodeMinimo).toBe(22);
    expect(AGENTES['claude-code'].nodeMinimo).toBeUndefined();
  });

  it.each(['copilot-cli', 'qwen-code'] as const)(
    '%s: instalar con Node 20 falla con agentes.node_antiguo y no corre npm install',
    async (id) => {
      const m = await montar({ responder: NODE_VIEJO });
      await expect(m.agentes.instalar(id, true)).rejects.toMatchObject({
        codigo: 'agentes.node_antiguo',
        datos: { requerida: 22, actual: '20.18.1' },
      });
      expect(m.llamadas.some((l) => l.args.includes('install'))).toBe(false);
    },
  );

  it('con Node 22 instala', async () => {
    const m = await montar({ responder: NODE_NUEVO });
    await m.agentes.instalar('copilot-cli', true);
    expect(m.llamadas.some((l) => l.args.includes('install'))).toBe(true);
  });

  it('si no se puede leer la versión del Node, falla con agentes.node_version_desconocida', async () => {
    const sinVersion = (_c: string, a: string[]) =>
      a[0] === '--version' ? { codigo: 1 } : { codigo: 0 };
    const m = await montar({ responder: sinVersion });
    await expect(m.agentes.instalar('qwen-code', true)).rejects.toMatchObject({
      codigo: 'agentes.node_version_desconocida',
      datos: { requerida: 22 },
    });
    expect(m.llamadas.some((l) => l.args.includes('install'))).toBe(false);
    paquete(m.prefijo, '@github/copilot', 'copilot', '1.0.0');
    await expect(m.agentes.abrir('copilot-cli', 'tienda')).rejects.toMatchObject({
      codigo: 'agentes.node_version_desconocida',
    });
    expect(m.plat.terminales).toHaveLength(0);
    // Un agente sin requisito de versión no necesita saberla.
    await m.agentes.instalar('claude-code', true);
  });

  it('un agente sin requisito se instala aunque el Node sea viejo', async () => {
    const m = await montar({ responder: NODE_VIEJO });
    await m.agentes.instalar('claude-code', true);
    expect(m.llamadas.some((l) => l.args.includes('install'))).toBe(true);
  });

  it('abrir con Node 20 falla con el mismo código y no abre la terminal', async () => {
    const m = await montar({ responder: NODE_VIEJO });
    paquete(m.prefijo, '@github/copilot', 'copilot', '1.0.0');
    await expect(m.agentes.abrir('copilot-cli', 'tienda')).rejects.toMatchObject({
      codigo: 'agentes.node_antiguo',
    });
    expect(m.plat.terminales).toHaveLength(0);
  });

  it('abrir con Node 22 abre la terminal', async () => {
    const m = await montar({ responder: NODE_NUEVO });
    paquete(m.prefijo, '@qwen-code/qwen-code', 'qwen', '1.0.0');
    await m.agentes.abrir('qwen-code', 'tienda');
    expect(m.plat.terminales).toHaveLength(1);
  });
});
