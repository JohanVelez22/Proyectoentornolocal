import { describe, expect, it } from 'vitest';
import { Git } from '../src/git/git';
import {
  carpetasPath,
  entornoSistema,
  esNombreSecreto,
  MASCARA,
  MAX_VALOR_VARIABLE,
  variablesEnmascaradas,
} from '../src/herramientas/entorno';

describe('entorno del sistema', () => {
  it('detecta nombres de secretos sin importar mayúsculas', () => {
    for (const n of [
      'GITHUB_TOKEN',
      'api_key',
      'AWS_SECRET_ACCESS_KEY',
      'DB_PASSWORD',
      'MYSQL_PASS',
      'PGPASSWORD',
      'PWD',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'NPM_AUTH',
      'SESSION_ID',
      'COOKIE_JAR',
      'SSH_PRIVATE',
    ]) {
      expect(esNombreSecreto(n), n).toBe(true);
    }
    for (const n of ['PATH', 'USERNAME', 'COMPUTERNAME', 'NODE_ENV', 'TEMP']) {
      expect(esNombreSecreto(n), n).toBe(false);
    }
  });

  it('enmascara los valores secretos, ordena y acota los largos', () => {
    const v = variablesEnmascaradas({
      zeta: 'z',
      GITHUB_TOKEN: 'ghp_abcdef123456',
      Path: 'C:\\a',
      LARGA: 'x'.repeat(MAX_VALOR_VARIABLE + 50),
      VACIA: undefined,
    });
    expect(v.map((x) => x.nombre)).toEqual(['GITHUB_TOKEN', 'LARGA', 'Path', 'zeta']);
    expect(v[0]).toEqual({ nombre: 'GITHUB_TOKEN', valor: MASCARA, enmascarada: true });
    expect(JSON.stringify(v)).not.toContain('ghp_abcdef123456');
    expect(v[1]?.valor).toHaveLength(MAX_VALOR_VARIABLE + 1);
    expect(v[2]).toEqual({ nombre: 'Path', valor: 'C:\\a', enmascarada: false });
  });

  it('parte el PATH (clave en cualquier caja) sin vacías ni comillas', () => {
    expect(carpetasPath({ Path: 'C:\\a; ;"C:\\b c";C:\\d;' })).toEqual([
      'C:\\a',
      'C:\\b c',
      'C:\\d',
    ]);
    expect(carpetasPath({})).toEqual([]);
  });

  it('consulta las herramientas en paralelo con plazo y aísla los fallos', async () => {
    const inicio = Date.now();
    const r = await entornoSistema({
      env: { PATH: 'C:\\x', API_KEY: 's3cr3t' },
      plazoMs: 100,
      herramientas: [
        { nombre: 'PHP', leer: async () => ['8.3.1', '8.2.9'] },
        { nombre: 'Lenta', leer: () => new Promise<string[]>(() => undefined) },
        { nombre: 'Rota', leer: () => Promise.reject(new Error('x')) },
        { nombre: 'Ausente', leer: async () => [] },
      ],
    });
    expect(Date.now() - inicio).toBeLessThan(1000);
    expect(r.path).toEqual(['C:\\x']);
    expect(r.herramientas).toEqual([
      { nombre: 'PHP', versiones: ['8.3.1', '8.2.9'] },
      { nombre: 'Lenta', versiones: [], sinRespuesta: true },
      { nombre: 'Rota', versiones: [], sinRespuesta: true },
      { nombre: 'Ausente', versiones: [] },
    ]);
    expect(JSON.stringify(r)).not.toContain('s3cr3t');
  });
});

describe('Git.version', () => {
  it('lee git --version con plazo corto y sin preguntar nada', async () => {
    const llamadas: { cmd: string; args: string[]; timeoutMs?: number }[] = [];
    const git = new Git({
      entorno: { Path: 'C:\\Git\\cmd' },
      existe: (r) => r === 'C:\\Git\\cmd\\git.exe',
      exec: async (cmd, args, o) => {
        llamadas.push({ cmd, args, ...(o?.timeoutMs ? { timeoutMs: o.timeoutMs } : {}) });
        return { codigo: 0, stdout: 'git version 2.47.1.windows.1\n', stderr: '' };
      },
    });
    expect(await git.version('git', 3000)).toEqual(['2.47.1']);
    expect(llamadas).toEqual([
      { cmd: 'C:\\Git\\cmd\\git.exe', args: ['--version'], timeoutMs: 3000 },
    ]);
    // gh no está: no se ejecuta nada.
    expect(await git.version('gh')).toEqual([]);
    expect(llamadas).toHaveLength(1);
  });

  it('una salida con error no inventa versiones', async () => {
    const git = new Git({
      entorno: { Path: 'C:\\gh' },
      existe: () => true,
      exec: async () => ({ codigo: 1, stdout: '', stderr: 'fallo' }),
    });
    expect(await git.version('gh')).toEqual([]);
  });
});

describe('variables con credenciales en el valor', () => {
  it('sanea un valor con usuario y clave aunque el nombre sea inocente', () => {
    const [v] = variablesEnmascaradas({ DATABASE_URL: 'postgres://yo:clave123@127.0.0.1/app' });
    expect(v!.enmascarada).toBe(false);
    expect(v!.valor).not.toContain('clave123');
  });
});
