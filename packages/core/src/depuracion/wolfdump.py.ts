/**
 * Módulo `wolfdump` para los procesos Python de los sitios con la captura activa (lo encuentran
 * por el PYTHONPATH que les pone WolfCore Dev): `from wolfdump import dump`.
 *
 * Igual que el prepend de PHP: lee puerto y token de `rutaReceptor` solo al volcar, envía con un
 * plazo de 200 ms y, si el receptor no responde, sigue sin decir nada. Nunca imprime el token.
 */
export function wolfdumpPy(o: { rutaReceptor: string }): string {
  // JSON.stringify da una cadena válida en Python (comillas dobles, \\ y \" escapados).
  return PLANTILLA_PY.replace('__RECEPTOR__', () => JSON.stringify(o.rutaReceptor));
}

const PLANTILLA_PY = String.raw`"""WolfCore Dev: dump() hacia la pantalla "Depuración".

Uso:  from wolfdump import dump
      dump(valor, otro)   # devuelve el valor (o la tupla) y no imprime nada

Archivo generado por WolfCore Dev (se reescribe al iniciar): no lo edite.
"""
import http.client
import json
import os
import pprint
import re
import sys
import time

_RECEPTOR = __RECEPTOR__
_MAX_TEXTO = 262144
_MAX_CUERPO = 1000000
_PLAZO = 0.2
# Segundos sin latido del receptor tras los que su archivo se da por viejo (la app se cortó).
_VIGENCIA = 60

__all__ = ["dump"]


def _vivo(pid):
    """¿Sigue vivo el proceso del receptor? (mejor esfuerzo: ante la duda, sí)"""
    if not isinstance(pid, int) or isinstance(pid, bool) or pid <= 0:
        return False
    if os.name == "nt":
        # En Windows os.kill(pid, 0) TERMINA el proceso: se pregunta con OpenProcess.
        try:
            import ctypes

            k = ctypes.windll.kernel32
            h = k.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
            if not h:
                return False
            try:
                codigo = ctypes.c_ulong(0)
                if not k.GetExitCodeProcess(h, ctypes.byref(codigo)):
                    return True
                return codigo.value == 259  # STILL_ACTIVE
            finally:
                k.CloseHandle(h)
        except Exception:
            return True
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except Exception:
        return True
    return True


def _config():
    try:
        if abs(time.time() - os.path.getmtime(_RECEPTOR)) > _VIGENCIA:
            return None
        with open(_RECEPTOR, "r", encoding="utf-8") as f:
            c = json.loads(f.read(4096))
    except Exception:
        return None
    if not isinstance(c, dict):
        return None
    puerto, token = c.get("puerto"), c.get("token")
    if not isinstance(puerto, int) or not isinstance(token, str):
        return None
    if not re.fullmatch(r"[0-9a-f]{64}", token):
        return None
    if not _vivo(c.get("pid")):
        return None
    return puerto, token


def _texto(v):
    try:
        t = pprint.pformat(v, width=100)
    except Exception:
        try:
            t = repr(v)
        except Exception:
            t = "<sin representación>"
    return t if len(t) <= _MAX_TEXTO else t[:_MAX_TEXTO] + "\n…"


def _enviar(datos):
    c = _config()
    if c is None:
        return
    puerto, token = c
    cuerpo = json.dumps(datos, ensure_ascii=False).encode("utf-8", "replace")
    if len(cuerpo) > _MAX_CUERPO:
        return
    con = http.client.HTTPConnection("127.0.0.1", puerto, timeout=_PLAZO)
    try:
        con.request(
            "POST",
            "/dump",
            body=cuerpo,
            headers={
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json",
            },
        )
        con.getresponse().read(64)
    finally:
        con.close()


def dump(*valores):
    """Envía los valores a WolfCore Dev. Si no está escuchando, no pasa nada."""
    try:
        marco = sys._getframe(1)
        _enviar(
            {
                "origen": "python",
                "sitio": os.environ.get("WOLFCORE_SITIO") or None,
                "archivo": marco.f_code.co_filename,
                "linea": marco.f_lineno,
                "url": None,
                "texto": "\n".join(_texto(v) for v in valores)[: _MAX_TEXTO + 2],
            }
        )
    except Exception:
        pass
    if len(valores) == 1:
        return valores[0]
    return valores if valores else None
`;
