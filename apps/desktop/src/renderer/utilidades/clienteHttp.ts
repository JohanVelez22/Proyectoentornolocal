import { esNombreSecreto, type ParHttp, type PeticionHttp } from '@pel/core';

/** Lo que el historial pone en lugar de un valor secreto. */
const MASCARA = '***';

const sinRef = (p: ParHttp): ParHttp => {
  if (p.ref === undefined) return p;
  const { ref: _r, ...resto } = p;
  void _r;
  return p.valor === '' ? { ...resto, faltante: true } : resto;
};

/**
 * Una copia que ya no es la petición guardada: sin `id` y sin ninguna `ref` (cada secreto guardado
 * es de una sola petición). Las filas que tenían secreto quedan marcadas «falta el secreto» y el
 * envío se bloquea hasta que se escriba. Para `abrirConPeticion` y para una petición borrada.
 */
export function sinReferencias(p: PeticionHttp): PeticionHttp {
  const c = p.cuerpo;
  let auth = p.auth;
  if (auth.tipo !== 'ninguna' && auth.ref !== undefined) {
    const copia: Record<string, unknown> = { ...auth };
    delete copia['ref'];
    auth = copia as unknown as PeticionHttp['auth'];
  }
  return {
    ...p,
    id: '',
    params: p.params.map(sinRef),
    cabeceras: p.cabeceras.map(sinRef),
    cuerpo:
      c.tipo === 'form' || c.tipo === 'multipart' ? { ...c, campos: c.campos.map(sinRef) } : c,
    auth,
  };
}

const sinMascara = (p: ParHttp): ParHttp => {
  const q = sinRef(p);
  if (q.valor === MASCARA && (esNombreSecreto(q.clave) || q.ref !== undefined)) {
    return { clave: q.clave, valor: '', activo: q.activo, faltante: true };
  }
  return q;
};

/**
 * Una petición del historial: sus valores `***` pasan a filas vacías marcadas «falta el secreto»
 * (nunca se reenvía ni se guarda `***` como secreto).
 */
export function desdeHistorial(p: PeticionHttp): PeticionHttp {
  const base = sinReferencias(p);
  const c = base.cuerpo;
  return {
    ...base,
    params: base.params.map(sinMascara),
    cabeceras: base.cabeceras.map(sinMascara),
    cuerpo:
      c.tipo === 'form' || c.tipo === 'multipart' ? { ...c, campos: c.campos.map(sinMascara) } : c,
  };
}
