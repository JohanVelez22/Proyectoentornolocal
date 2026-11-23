import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baseDelProyecto, baseDeVariables } from '../src/bd/baseProyecto';
import { urlAdminerProyecto } from '../src/herramientas/adminer';
import { leerVariablesEnv } from '../src/proyectos/detectar';
import { carpetaTemporal } from './temporales';

const vars = (t: string): Map<string, string> => leerVariablesEnv(t);

describe('baseDeVariables', () => {
  it('Laravel: motor, base y usuario; nunca la clave', () => {
    const b = baseDeVariables(
      vars(
        'DB_CONNECTION=pgsql\nDB_DATABASE=rents\nDB_USERNAME=app\nDB_PASSWORD=clave-de-prueba\n',
      ),
    );
    expect(b).toEqual({ motor: 'postgresql', base: 'rents', usuario: 'app' });
    expect(JSON.stringify(b)).not.toContain('clave-de-prueba');
  });

  it('CI3 con DB_NAME/DB_USER y el puerto como pista del motor', () => {
    expect(
      baseDeVariables(vars('DB_HOST=127.0.0.1\nDB_PORT=5432\nDB_NAME=sys\nDB_USER=u\n')),
    ).toEqual({ motor: 'postgresql', base: 'sys', usuario: 'u' });
    expect(baseDeVariables(vars('DB_NAME=sys\nDB_USER=u\n'))?.motor).toBe('mysql');
  });

  it('CodeIgniter 4 (database.default.*)', () => {
    expect(
      baseDeVariables(
        vars(
          'database.default.database = tienda\ndatabase.default.username = app\ndatabase.default.DBDriver = Postgre\n',
        ),
      ),
    ).toEqual({ motor: 'postgresql', base: 'tienda', usuario: 'app' });
  });

  it('DATABASE_URL: sin la clave que trae la URL', () => {
    const b = baseDeVariables(
      vars('DATABASE_URL=postgresql+psycopg://bot:clave-de-prueba@127.0.0.1:5432/asistente\n'),
    );
    expect(b).toEqual({ motor: 'postgresql', base: 'asistente', usuario: 'bot' });
  });

  it('incompleto, MongoDB o nombres raros: null', () => {
    expect(baseDeVariables(vars('DB_DATABASE=x\n'))).toBeNull();
    expect(
      baseDeVariables(vars('DB_CONNECTION=mongodb\nDB_DATABASE=x\nDB_USERNAME=u\n')),
    ).toBeNull();
    expect(baseDeVariables(vars('DB_DATABASE=a&b\nDB_USERNAME=u\n'))).toBeNull();
    expect(baseDeVariables(vars('APP_NAME=x\n'))).toBeNull();
  });
});

describe('baseDelProyecto y urlAdminerProyecto', () => {
  it('lee el .env de la carpeta; la URL lleva servidor, usuario y base, nunca la clave', async () => {
    const dir = path.join(await carpetaTemporal('pel-basepro-'), 'WolfCore System');
    mkdirSync(dir, { recursive: true });
    expect(await baseDelProyecto(dir)).toBeNull();
    writeFileSync(
      path.join(dir, '.env'),
      'DB_CONNECTION=mysql\nDB_DATABASE=ricambio_demo\nDB_USERNAME=app\nDB_PASSWORD=clave-de-prueba\n',
    );
    const b = await baseDelProyecto(dir);
    expect(b).toEqual({ motor: 'mysql', base: 'ricambio_demo', usuario: 'app' });
    const url = urlAdminerProyecto(b!, 3307);
    expect(url).toBe('http://127.0.0.1:8090/?server=127.0.0.1:3307&username=app&db=ricambio_demo');
    expect(url).not.toContain('clave-de-prueba');
    expect(url).not.toMatch(/password/i);
    expect(urlAdminerProyecto({ motor: 'postgresql', base: 'b', usuario: 'u' }, 5433)).toBe(
      'http://127.0.0.1:8090/?pgsql=127.0.0.1:5433&username=u&db=b',
    );
  });
});
