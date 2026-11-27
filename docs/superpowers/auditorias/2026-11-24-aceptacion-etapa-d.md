# Aceptación de la Etapa D (D40)

Recorrido de `docs/superpowers/aceptacion-d40-lista.md` sobre la instalación real del usuario, el 27/11/2026. Lo hizo Claude por encargo del usuario, que lo confirmó en el chat de la sesión. Versión instalada: commit `c0c7499`, con el instalador NSIS en modo silencioso sobre la versión anterior. Este documento no contiene rutas personales ni datos de clientes.

Leyenda: ✅ bien · ⚠️ funciona con reparos · ❌ falla.

| #   | Paso                    | Resultado | Notas |
| --- | ----------------------- | --------- | ----- |
| 1   | Copia de seguridad      | ✅        | Copia en frío con los servicios apagados: 27 955 archivos y 5,81 GB. Las huellas SHA-256 de todos los archivos coinciden y el usuario confirmó la carpeta. También se copiaron el programa instalado anterior y el instalador nuevo. |
| 2   | Instantánea del entorno | ⚠️        | El punto de vuelta previo a la instalación es la copia en frío. La instantánea de entorno de la app (`perfiles.instantanea`) se tomó tras instalar y funcionó. |
| 3   | Instalar versión nueva  | ⚠️        | Instalación silenciosa con código 0 y datos intactos. Pero los sitios dejaron de responder por HTTPS (fallo F1). |
| 4   | Recorrido de bienvenida | ⚠️        | No aparece al actualizar con proyectos, por diseño: solo se muestra en el primer uso sin proyectos. Se puede abrir desde Ajustes. |
| 5   | Los 6 proyectos         | ✅ tras F1 | Responden por HTTPS: System, Rents y Coffe con 302, y Diamantes, Dollar y el bot con 200. |
| 6   | Botones de proyecto     | —         | No se pulsaron editor, Terminal ni LAN para no abrir ventanas ni tocar el cortafuegos. Queda para el usuario. |
| 7   | Ollama                  | ⚠️        | Aviso de tamaño y espacio (398 MB / 400 GB), progreso, cancelar, descarga en 18 s y chat, todo bien. Borrar falla (F2). |
| 8   | Compartir               | ✅        | Con código: 200 y el archivo. Sin código o con uno inventado: 404. El registro de accesos no guarda el código. «Dejar de compartir» corta el enlace al momento. |
| 9   | Túnel 1A                | ✅        | Con un sitio de prueba vacío: 200 mientras está abierto, 502 al cerrarlo, sin `cloudflared` restantes. El sitio de prueba se borró. |
| 10  | Recorrido rápido        | ✅        | 12 vistas sin errores de consola ni desbordes. |
| 11  | «PC nuevo»              | ⚠️        | El perfil no lleva secretos. Al importarlo en una carpeta aislada aparecen los 6 sitios y las instancias, con los puertos reasignados a 3307 y 5433, y sin arrancar bases. Las versiones de PHP no están en el catálogo (F4). La app real no cambió. |
| 12  | Pendientes manuales     | —         | Para el usuario: borrar las carpetas vacías `C:\wc-tmp-d52` y `C:\wc-d40`, y cerrar con «Cancelar» el aviso del cortafuegos sobre nginx. |
| 13  | Fusión a `main`         | pendiente | Tras corregir los fallos y con el CI en verde. |

## Fallos encontrados

- **F1 (crítico): al actualizar no se regeneran los vhosts.**
  - Los vhosts de la versión anterior usan `listen 443 ssl;`. El `nginx.conf` nuevo pone el servidor por defecto en `127.0.0.1:443`, y nginx da prioridad a la dirección concreta, así que todo HTTPS caía en el certificado `localhost`.
  - Los vhosts antiguos además escuchaban en todas las interfaces, por eso Windows mostró el aviso del cortafuegos.
  - Se resolvió en vivo con `sitios.aplicar()` de la propia app. La corrección en el código está en curso.
- **F1b (crítico): se quita el HTTPS de todos los sitios sin avisar.**
  - Al borrar un sitio, `aplicar` decidió que el 443 no era usable y regeneró los 6 vhosts sin HTTPS.
  - Causa probable: `ocupantePuerto` no reconoce al worker de nginx como propio cuando la consulta de procesos hijos falla, y el equipo estaba con la memoria al 92 %.
  - Debe fallar de forma segura y avisar. Corrección en curso.
- **F2 (importante): borrar un modelo de Ollama da error.** El modelo se borra, pero la app muestra «Unexpected end of JSON input», porque Ollama 0.40 responde con el cuerpo vacío.
- **F3 (importante): túneles huérfanos.** Si la app muere de golpe, los `cloudflared` siguen vivos con el túnel público abierto. Se encontraron 3, de pruebas anteriores, y se cerraron por PID.
- **F4 (importante): versiones de PHP fuera del catálogo.** Al importar un perfil en un PC nuevo, PHP 8.3.36 y 8.4.27 ya no están en el catálogo y quedan pendientes. Debería instalarse la última de la misma rama.
- **F7 (importante): el UAC de hosts no se cierra cuando la app deja de esperarlo.** Cada sitio de prueba creado abrió un UAC para sincronizar hosts. La app se rinde por tiempo, pero el diálogo sigue en pantalla; el usuario lo aceptó más tarde y el archivo hosts no cambió.
- **F5 (menor):** un proceso de proyecto que arranca solo (uvicorn del bot) falla si su base no arranca sola, y el aviso queda mucho tiempo en pantalla.
- **F6 (menor):** al importar, el proceso del bot aparece como «procesos_quitados». Hay que revisar si es lo esperado.

## Correcciones y nueva verificación

Todo se corrigió con pruebas (`c0c7499..045f199`) y pasó una revisión con opus. Los puntos que esa revisión encontró también están corregidos. Después se reinstaló sobre los datos reales.

- **F1:** al encender Nginx, los vhosts se alinean con la plantilla actual. Si `nginx -t` falla, se vuelve a los anteriores. En la reinstalación, los 6 sitios respondieron por HTTPS sin hacer nada a mano.
- **F1b:** «quién ocupa el 443» falla de forma segura. Ya no cuentan como ajenos un nginx propio, un worker que se cierra tras una recarga ni un PID que ya no existe. Si alguna vez se quita el HTTPS, siempre se avisa (`avisos.https_quitado`).
  - En la versión intermedia, borrar un sitio volvió a quitar el HTTPS, pero el aviso nuevo identificó la causa: el dueño era un PID que ya no existía.
  - Con `045f199`, tres rondas de reinicio de Nginx y `aplicar` conservan los 6 sitios.
  - Queda por repetir el borrado real de un sitio cuando el usuario esté, porque crear el sitio de prueba pide un UAC.
- **F2:** borrar un modelo de Ollama ya no da error. Verificado en la app real.
- **F3:** al arrancar se cierran por PID los cloudflared huérfanos de su `bin/`, solo si son anteriores al arranque y con la ruta y la hora de creación comprobadas. El barrido no frena el arranque y las pruebas no lo ejecutan. Atarlos a un Job Object queda para después.
- **F4:** al importar en un equipo sin esa versión de PHP, se instala la última de la misma versión menor y se avisa. Una versión ya instalada no se toca. El botón «Actualizar a 8.3.x / 8.4.x» queda pendiente.
- **CI:** se verifica en los 3 sistemas en cada subida.
