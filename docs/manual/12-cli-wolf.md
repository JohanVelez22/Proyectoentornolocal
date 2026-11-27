# 12 · CLI `wolf`

## Para qué sirve

La interfaz de línea de órdenes **`wolf`** permite controlar WolfCore Dev desde PowerShell, `cmd` o Git Bash (ver estado, vincular carpetas, cambiar la versión de PHP o runtimes, activar HTTPS, publicar túneles, leer logs y ejecutar el Doctor) reutilizando exactamente las mismas puertas de seguridad y confirmaciones que la ventana gráfica.

## Paso a paso

### 1. Activar `wolf` en el PATH del usuario

1. Abra **Ajustes** en la barra lateral y busque la tarjeta **Terminal: comando wolf**.
2. Pulse **Agregar wolf al PATH** y confirme el diálogo **¿Agregar wolf al PATH del usuario?**.
3. WolfCore Dev copia el cliente `wolf` a su carpeta de datos, agrega esa carpeta al PATH de su usuario (guardando una copia previa del PATH original) y enciende el servidor local de órdenes en `127.0.0.1` con un token de sesión aleatorio guardado únicamente para su usuario (`run/cli.json`).
4. **Abra una terminal nueva** (las terminales que ya estaban abiertas no ven el nuevo PATH).
5. Si en cualquier momento desea desactivarlo, pulse **Quitar wolf del PATH** en la misma tarjeta.

> **Requisitos:** `wolf` solo funciona con WolfCore Dev abierto (salvo que pase `--abrir`). Cuando usa una carpeta de datos de prueba (`WOLFCORE_DATOS`), el PATH del usuario no se modifica.

[CAPTURA: Tarjeta Terminal: comando wolf en Ajustes mostrando el estado Disponible en el PATH y el botón Quitar wolf del PATH]

### 2. Órdenes disponibles

| Orden | Qué hace |
| --- | --- |
| `wolf status` | Muestra el estado de sitios, servicios y túneles. |
| `wolf link [carpeta]` | Vincula una carpeta como sitio (admite `--nombre` y `--dominio`). Nace sin marca de confianza. |
| `wolf park [carpeta]` | Configura la carpeta vigilada de proyectos (`--quitar` deja de vigilar). |
| `wolf use php@<versión>` | Cambia el PHP del sitio en la carpeta actual; con `--global` cambia el PHP predeterminado de todas las terminales (exige confirmación). |
| `wolf use <runtime>@<versión>` | Cambia la versión de `node`, `python`, `java`, `dotnet`, `go` o `rust` del sitio actual. |
| `wolf secure <sitio>` | Activa HTTPS en el sitio indicado (no instala la CA automáticamente; avisa si aún falta confiarla). |
| `wolf share <sitio>` | Publica el sitio por túnel (`--proveedor`, `--cerrar`, `--si`). |
| `wolf open <sitio>` | Abre el sitio en el navegador predeterminado. |
| `wolf logs <sitio> [-f]` | Muestra o sigue en vivo (`-f`) los registros del sitio (`--fuente error\|acceso\|laravel\|ci3\|tunel`, `-n <líneas>`). |
| `wolf doctor` | Ejecuta las revisiones del Doctor en modo de solo lectura (nunca repara desde CLI). |
| `wolf start [workspace\|servicio]` | Enciende todo, un workspace o un servicio concreto (nunca abre túneles). |
| `wolf stop [workspace\|servicio]` | Apaga todo, un workspace o un servicio concreto. |

### 3. Opciones generales y códigos de salida

- `--json`: devuelve salida estructurada en JSON (sin secretos; todos los textos pasan por enmascaramiento).
- `--abrir`: si WolfCore Dev está cerrado, lo abre y espera a que responda.
- `--si`: omite la pregunta interactiva en la terminal, **pero nunca omite la confirmación en la ventana de WolfCore Dev** para acciones sensibles (`wolf share` o `wolf use php@<v> --global`).
- `-h` / `--help`: muestra la ayuda en el idioma configurado en la aplicación, siempre que sea español, inglés, portugués o francés (la línea de órdenes solo está traducida a esos cuatro). Con cualquiera de los otros doce idiomas de la interfaz, la ayuda sale en el idioma del sistema si es uno de esos cuatro y, si no, en español.

Códigos de salida estables:

- `0`: operación completada sin errores.
- `1`: error al ejecutar la orden.
- `2`: uso o argumentos incorrectos.
- `3`: WolfCore Dev no está abierto o la CLI está apagada.

### 4. Confirmaciones en acciones delicadas

- **Publicar un sitio (`wolf share`)** y **cambiar el PHP global (`wolf use php@8.4 --global`)** siempre abren un diálogo de confirmación nativo en la ventana de WolfCore Dev (dispondrá de unos 45 segundos para aprobar o rechazar).
- Si el sitio tiene **datos reales**, `wolf share` exige además escribir el **dominio exacto** del sitio en la terminal (o mediante `--datos-reales=<dominio>`) y confirmarlo de nuevo en la ventana de la app.

## Ejemplo

Flujo rápido desde PowerShell dentro de `C:\Proyectos\mi-tienda`:

```powershell
# Ver qué está encendido
wolf status

# Vincular la carpeta actual con dominio mi-tienda.test y activar HTTPS
wolf link --dominio mi-tienda.test
wolf secure mi-tienda

# Fijar PHP 8.4 para este sitio y seguir su registro de Laravel en vivo
wolf use php@8.4
wolf logs mi-tienda --fuente laravel -f
```

También puede usar la línea de órdenes del ejecutable directamente para arrancar o detener todo:

```powershell
& "$env:LOCALAPPDATA\Programs\WolfCore Dev\WolfCore Dev.exe" --iniciar-todo
& "$env:LOCALAPPDATA\Programs\WolfCore Dev\WolfCore Dev.exe" --detener-todo
```

## Si algo falla

- **PowerShell dice que no reconoce el comando `wolf`:** abra una terminal nueva tras pulsar **Agregar wolf al PATH**. Si sigue sin aparecer, revise **Ajustes → Terminal: comando wolf** y pulse **Reparar** si indica que falta el comando.
- **«WolfCore Dev no está abierto, o la CLI está apagada» (código 3):** abra la aplicación o añada `--abrir` a su comando (por ejemplo, `wolf status --abrir`).
- **«WolfCore Dev rechazó el acceso»:** la aplicación se reinició y regeneró su token de sesión; simplemente vuelva a ejecutar la orden.
- **«Nadie confirmó en la ventana de WolfCore Dev a tiempo»:** vuelva a lanzar el comando y apruebe el diálogo de confirmación en la ventana antes de 45 segundos.
