/**
 * Lógica pura del asistente "Nuevo proyecto": formulario, validación (mismas reglas que el
 * núcleo), pedido para el IPC, resumen y qué hacer ante cada error. Sin Vue ni IPC.
 */
import type {
  EstadoServicio,
  IdInstancia,
  MotorBd,
  PedidoProyectoIpc,
  Plantilla,
  TipoGenerador,
} from '../../shared/api';
import type { Textos } from '../i18n';
import { REGLA_NOMBRE } from './bd';
import type { PasoConEstado } from './proyectos';

export type StarterKit = 'ninguno' | 'react' | 'vue' | 'livewire';

export interface InfoTipo {
  id: TipoGenerador;
  /** Corre sobre PHP (hay que elegir la versión). */
  usaPhp: boolean;
  /** Usa un venv de Python (FastAPI). */
  usaPython: boolean;
  /** Puede crear una base de datos. */
  usaBase: boolean;
  /** Motor que se propone primero. */
  motor: MotorBd | null;
  /** Archivo donde queda la conexión a la base (para el resumen). */
  archivoEnv: string | null;
}

/** Mismos tipos y orden que `TIPOS_GENERADOR` del núcleo (una prueba lo comprueba). */
export const TIPOS_PROYECTO: readonly InfoTipo[] = [
  {
    id: 'laravel',
    usaPhp: true,
    usaPython: false,
    usaBase: true,
    motor: 'mysql',
    archivoEnv: '.env',
  },
  {
    id: 'codeigniter4',
    usaPhp: true,
    usaPython: false,
    usaBase: true,
    motor: 'mysql',
    archivoEnv: '.env',
  },
  {
    id: 'codeigniter3',
    usaPhp: true,
    usaPython: false,
    usaBase: true,
    motor: 'mysql',
    archivoEnv: 'application/config/database.php',
  },
  {
    id: 'symfony',
    usaPhp: true,
    usaPython: false,
    usaBase: true,
    motor: 'mysql',
    archivoEnv: '.env.local',
  },
  {
    id: 'fastapi',
    usaPhp: false,
    usaPython: true,
    usaBase: true,
    motor: 'postgresql',
    archivoEnv: '.env',
  },
  {
    id: 'wordpress',
    usaPhp: true,
    usaPython: false,
    usaBase: true,
    motor: 'mysql',
    archivoEnv: 'wp-config.php',
  },
  {
    id: 'estatico',
    usaPhp: false,
    usaPython: false,
    usaBase: false,
    motor: null,
    archivoEnv: null,
  },
];

export const infoTipo = (tipo: TipoGenerador): InfoTipo =>
  TIPOS_PROYECTO.find((x) => x.id === tipo) ?? TIPOS_PROYECTO[0]!;

/** Tipo de generador que corresponde al tipo de sitio de una plantilla (el núcleo lo ignora). */
export const tipoGeneradorDe = (tipoSitio: string): TipoGenerador =>
  TIPOS_PROYECTO.find((x) => x.id === tipoSitio)?.id ?? 'estatico';

/**
 * Lo que una plantilla permite elegir: PHP si lo traía, Python si es FastAPI y una base solo si
 * guardó el esquema de una (en un motor de su misma familia).
 */
export function infoDePlantilla(pl: Plantilla): InfoTipo {
  return {
    id: tipoGeneradorDe(pl.tipo),
    usaPhp: pl.php !== null,
    usaPython: pl.tipo === 'fastapi',
    usaBase: pl.motorBase !== null,
    motor: pl.motorBase,
    archivoEnv: pl.tipo === 'wordpress' ? null : '.env',
  };
}

/** Lo que el asistente va llenando. `objetivoBd` es una instancia (`mysql@8.4`) o un motor suelto. */
export interface FormProyecto {
  tipo: TipoGenerador;
  nombre: string;
  /** Carpeta padre: solo la que salió del diálogo. */
  carpetaPadre: string | null;
  php: string | null;
  python: string | null;
  conBase: boolean;
  objetivoBd: string | null;
  nombreBase: string;
  starterKit: StarterKit;
  symfonyWebapp: boolean;
  pgvector: boolean;
  /** Casilla de WordPress: el usuario acepta la huella SHA-1 (débil). */
  confirmarHuellaDebil: boolean;
  /** Plantilla propia de la que se crea (null: un generador). */
  plantilla: Plantilla | null;
}

/** Info del tipo del formulario: la de la plantilla si se parte de una. */
export const infoDe = (f: Pick<FormProyecto, 'tipo' | 'plantilla'>): InfoTipo =>
  f.plantilla ? infoDePlantilla(f.plantilla) : infoTipo(f.tipo);

/** Generador del formulario (null si se parte de una plantilla: no hay huella ni starter kit). */
const generadorDe = (f: Pick<FormProyecto, 'tipo' | 'plantilla'>): TipoGenerador | null =>
  f.plantilla ? null : f.tipo;

export function formularioInicial(tipo: TipoGenerador): FormProyecto {
  return {
    tipo,
    nombre: '',
    carpetaPadre: null,
    php: null,
    python: null,
    conBase: infoTipo(tipo).usaBase,
    objetivoBd: null,
    nombreBase: '',
    starterKit: 'ninguno',
    symfonyWebapp: false,
    pgvector: false,
    confirmarHuellaDebil: false,
    plantilla: null,
  };
}

/** Formulario de un proyecto que parte de una plantilla propia. */
export function formularioDePlantilla(pl: Plantilla): FormProyecto {
  return {
    ...formularioInicial(tipoGeneradorDe(pl.tipo)),
    plantilla: pl,
    php: pl.php,
    conBase: pl.motorBase !== null,
  };
}

/** Mismo patrón que `NOMBRE_PROYECTO` y las reglas de `validarNombreProyecto` del núcleo. */
const NOMBRE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const RESERVADOS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;

export const nombreValido = (n: string): boolean =>
  NOMBRE.test(n) && !n.endsWith('-') && !n.includes('--') && !RESERVADOS.test(n);

/** Nombre de base sugerido: el del proyecto con guiones bajos (`mi-tienda` → `mi_tienda`). */
export const nombreBaseDe = (nombre: string): string => nombre.replace(/-/g, '_');

/** Motor de un objetivo: `mysql@8.4` → `mysql`; un motor suelto, él mismo. */
export const motorDeObjetivo = (o: string): MotorBd => o.split('@')[0] as MotorBd;

/** El tipo crea de verdad una base con este formulario. */
export const usaBase = (f: FormProyecto): boolean => infoDe(f).usaBase && f.conBase;

/**
 * El esquema de la plantilla es de MySQL y el servidor elegido es MariaDB (o al revés): el resumen
 * lo avisa y el pedido lleva la confirmación (el usuario la vio antes de pulsar "Crear").
 */
export function motorDistinto(f: FormProyecto): boolean {
  const pl = f.plantilla;
  if (!pl?.archivoEsquema || pl.motorBase === null || pl.motorBase === 'postgresql') return false;
  if (!usaBase(f) || !f.objetivoBd) return false;
  return motorDeObjetivo(f.objetivoBd) !== pl.motorBase;
}

/** Primer error del formulario (texto ya traducido) o null si se puede pedir. */
export function validarPedido(
  f: FormProyecto,
  t: Textos['nuevoProyecto']['errores'],
): string | null {
  const nombre = f.nombre.trim();
  if (!nombre) return t.nombreVacio;
  if (!nombreValido(nombre)) return t.nombreInvalido;
  if (!f.carpetaPadre) return t.sinCarpeta;
  const info = infoDe(f);
  if (info.usaPhp && !f.php) return t.sinPhp;
  if (info.usaPython && !f.python) return t.sinPython;
  if (usaBase(f)) {
    if (!f.objetivoBd) return t.sinInstancia;
    const motor = motorDeObjetivo(f.objetivoBd);
    if (generadorDe(f) === 'wordpress' && motor !== 'mysql' && motor !== 'mariadb') {
      return t.motorNoVale;
    }
    // El esquema de una plantilla solo entra en un motor de su familia.
    if (f.plantilla && (f.plantilla.motorBase === 'postgresql') !== (motor === 'postgresql')) {
      return t.motorNoVale;
    }
    if (f.pgvector && motor !== 'postgresql') return t.pgvectorMotor;
    if (!REGLA_NOMBRE[motor]?.test(f.nombreBase)) return t.baseInvalida;
  }
  if (generadorDe(f) === 'wordpress' && !f.confirmarHuellaDebil) return t.huellaDebil;
  return null;
}

/** Pedido para `proyectos.crear`: la carpeta es la padre; el main arma la final. */
export function aPedido(f: FormProyecto): PedidoProyectoIpc {
  const info = infoDe(f);
  const gen = generadorDe(f);
  const opciones: PedidoProyectoIpc['opciones'] = {};
  if (gen === 'laravel' && f.starterKit !== 'ninguno') opciones.starterKit = f.starterKit;
  if (gen === 'symfony' && f.symfonyWebapp) opciones.symfonyWebapp = true;
  if ((gen === 'fastapi' || f.plantilla?.tipo === 'fastapi') && f.pgvector && usaBase(f)) {
    opciones.pgvector = true;
  }
  if (gen === 'wordpress' && f.confirmarHuellaDebil) opciones.confirmarHuellaDebil = true;
  if (motorDistinto(f)) opciones.confirmarMotorDistinto = true;
  let base: PedidoProyectoIpc['base'] = null;
  if (usaBase(f) && f.objetivoBd) {
    const motor = motorDeObjetivo(f.objetivoBd);
    base = f.objetivoBd.includes('@')
      ? { instancia: f.objetivoBd as IdInstancia, nombre: f.nombreBase }
      : { instancia: null, motor, nombre: f.nombreBase };
  }
  return {
    tipo: f.tipo,
    nombre: f.nombre.trim(),
    carpetaPadre: f.carpetaPadre ?? '',
    ...(f.plantilla ? { plantilla: f.plantilla.id } : {}),
    ...(info.usaPhp && f.php ? { php: f.php } : {}),
    ...(info.usaPython && f.python ? { python: f.python } : {}),
    base,
    opciones,
  };
}

export interface LineaResumen {
  clave: 'tipo' | 'carpeta' | 'sitio' | 'dominio' | 'php' | 'python' | 'base' | 'env' | 'https';
  valor: string;
}

/** Carpeta final del proyecto: la padre (sin barra final) más el nombre. */
export const carpetaFinal = (f: Pick<FormProyecto, 'carpetaPadre' | 'nombre'>): string =>
  `${(f.carpetaPadre ?? '').replace(/[\\/]+$/, '')}\\${f.nombre.trim()}`;

/** Lo que se va a crear, en el orden en que se muestra. */
export function resumen(f: FormProyecto): LineaResumen[] {
  const info = infoDe(f);
  const n = f.nombre.trim();
  const r: LineaResumen[] = [
    { clave: 'tipo', valor: f.tipo },
    { clave: 'carpeta', valor: carpetaFinal(f) },
    { clave: 'sitio', valor: n },
    { clave: 'dominio', valor: `${n}.test` },
    { clave: 'https', valor: `https://${n}.test` },
  ];
  if (info.usaPhp && f.php) r.push({ clave: 'php', valor: f.php });
  if (info.usaPython && f.python) r.push({ clave: 'python', valor: f.python });
  if (usaBase(f) && f.objetivoBd) {
    r.push({ clave: 'base', valor: `${f.nombreBase} (${f.objetivoBd})` });
    if (info.archivoEnv) r.push({ clave: 'env', valor: info.archivoEnv });
  }
  return r;
}

export type AccionError =
  | 'cambiarCarpeta'
  | 'cambiarBase'
  | 'cambiarNombre'
  | 'reintentarPaso'
  | 'servicios'
  | 'confirmarHuella';

const ACCIONES: Record<string, AccionError> = {
  'proyectos.carpeta_no_vacia': 'cambiarCarpeta',
  'proyectos.carpeta_de_otro_sitio': 'cambiarCarpeta',
  'proyectos.carpeta_invalida': 'cambiarCarpeta',
  'proyectos.base_existe': 'cambiarBase',
  'proyectos.nombre_invalido': 'cambiarNombre',
  'proyectos.dominio_existe': 'cambiarNombre',
  'proyectos.paso_base_no_omitible': 'reintentarPaso',
  'proyectos.sin_php': 'servicios',
  'proyectos.php_no_instalado': 'servicios',
  'proyectos.sin_python': 'servicios',
  'proyectos.python_no_instalado': 'servicios',
  'catalogo.huella_debil': 'confirmarHuella',
};

/** Qué puede hacer el usuario ante un error con código (null: solo leer el mensaje). */
export function accionDeError(codigo: string | undefined): AccionError | null {
  return codigo !== undefined && Object.hasOwn(ACCIONES, codigo) ? ACCIONES[codigo]! : null;
}

/** "Omitir" no se ofrece donde el núcleo lo rechaza: la base de un proyecto nuevo. */
export function sePuedeOmitirPaso(p: Pick<PasoConEstado, 'tipo' | 'args'>): boolean {
  if (p.tipo === 'sitio-crear') return false;
  return !(p.tipo === 'bd-crear' && p.args?.['nueva'] === true);
}

/** Receta que no estaba al empezar: la del proyecto que se está creando (null si aún no hay). */
export function sitioNuevo(antes: readonly string[], ahora: readonly string[]): string | null {
  return ahora.find((id) => !antes.includes(id)) ?? null;
}

export interface OpcionBase {
  value: string;
  label: string;
  motor: MotorBd;
  apagada: boolean;
  predeterminada: boolean;
}

const MOTORES_SQL: readonly MotorBd[] = ['mysql', 'mariadb', 'postgresql'];

/**
 * Bases donde se puede crear la del proyecto: instancias (o el motor suelto si no tiene
 * instancias configuradas), solo de los motores que sirven al tipo. WordPress: MySQL o MariaDB;
 * con pgvector: PostgreSQL. El estático no usa base.
 */
export function opcionesBase(
  tipo: TipoGenerador,
  pgvector: boolean,
  servicios: readonly Pick<EstadoServicio, 'id' | 'nombre' | 'instancias'>[],
  plantilla: Pick<Plantilla, 'motorBase'> | null = null,
): OpcionBase[] {
  if (plantilla ? plantilla.motorBase === null : !infoTipo(tipo).usaBase) return [];
  // Una plantilla solo admite motores de la familia de su esquema (MySQL y MariaDB se entienden).
  const validos = plantilla
    ? plantilla.motorBase === 'postgresql'
      ? (['postgresql'] as MotorBd[])
      : (['mysql', 'mariadb'] as MotorBd[])
    : pgvector
      ? (['postgresql'] as MotorBd[])
      : tipo === 'wordpress'
        ? (['mysql', 'mariadb'] as MotorBd[])
        : [...MOTORES_SQL];
  const r: OpcionBase[] = [];
  for (const motor of validos) {
    const s = servicios.find((x) => x.id === motor);
    if (!s) continue;
    if (s.instancias && s.instancias.length > 0) {
      for (const i of s.instancias) {
        r.push({
          value: i.id,
          label: `${s.nombre} ${i.clave} · ${i.puerto}`,
          motor,
          apagada: i.estado !== 'encendido',
          predeterminada: i.predeterminada,
        });
      }
    } else {
      r.push({ value: motor, label: s.nombre, motor, apagada: false, predeterminada: true });
    }
  }
  return r;
}

/** Elige la primera instancia predeterminada (o la primera) de la lista. */
export function baseSugerida(
  opciones: readonly OpcionBase[],
  motor: MotorBd | null,
): string | null {
  const delMotor = opciones.filter((o) => o.motor === motor);
  return (delMotor.find((o) => o.predeterminada) ?? delMotor[0] ?? opciones[0])?.value ?? null;
}

const numeros = (v: string): number[] => v.split('.').map((x) => Number.parseInt(x, 10) || 0);

/** De más nueva a más vieja: `8.4`, `8.3`… */
export function ordenarRamas(versiones: readonly string[]): string[] {
  return [...versiones].sort((a, b) => {
    const [a1 = 0, a2 = 0] = numeros(a);
    const [b1 = 0, b2 = 0] = numeros(b);
    return b1 - a1 || b2 - a2;
  });
}

/** Ramas (`3.13`) de las versiones completas de Python instaladas (`3.13.1`), sin repetir. */
export function ramasPython(versiones: readonly string[]): string[] {
  const ramas = new Set(
    versiones
      .map((v) => v.split('.').slice(0, 2).join('.'))
      .filter((v) => /^\d{1,2}\.\d{1,2}$/.test(v)),
  );
  return ordenarRamas([...ramas]);
}
