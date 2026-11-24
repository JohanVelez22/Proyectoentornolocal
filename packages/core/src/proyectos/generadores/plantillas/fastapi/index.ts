/** Archivos de la plantilla interna de FastAPI (texto plano: no hay nada que descargar). */
export interface OpcionesFastapi {
  nombre: string;
  /** Con base de datos: SQLAlchemy y el driver del motor. */
  motor: 'mysql' | 'mariadb' | 'postgresql' | 'mongodb' | null;
  pgvector: boolean;
}

const LF = '\n';

export function archivosFastapi(o: OpcionesFastapi): Record<string, string> {
  const requisitos = ['fastapi>=0.115,<1', 'uvicorn[standard]>=0.30,<1', 'python-dotenv>=1.0,<2'];
  if (o.motor === 'postgresql') requisitos.push('sqlalchemy>=2.0,<3', 'psycopg[binary]>=3.2,<4');
  else if (o.motor === 'mysql' || o.motor === 'mariadb') {
    requisitos.push('sqlalchemy>=2.0,<3', 'pymysql>=1.1,<2', 'cryptography>=43');
  } else if (o.motor === 'mongodb') requisitos.push('pymongo>=4.8,<5');
  if (o.pgvector) requisitos.push('pgvector>=0.3,<1');

  const main = [
    '"""API de ' + o.nombre + ' (FastAPI). Arranca desde WolfCore Dev con uvicorn."""',
    'from fastapi import FastAPI',
    '',
    'app = FastAPI(title="' + o.nombre + '")',
    '',
    '',
    '@app.get("/")',
    'def inicio() -> dict[str, str]:',
    '    return {"proyecto": "' + o.nombre + '", "estado": "listo"}',
    '',
    '',
    '@app.get("/salud")',
    'def salud() -> dict[str, bool]:',
    '    return {"ok": True}',
    '',
  ].join(LF);

  return {
    'main.py': main,
    'requirements.txt': requisitos.join(LF) + LF,
    // Nunca se versionan el entorno virtual ni el .env (lleva la conexión a la base).
    '.gitignore': ['.venv/', '__pycache__/', '*.pyc', '.env', '.env.*', '!.env.example', ''].join(
      LF,
    ),
  };
}
