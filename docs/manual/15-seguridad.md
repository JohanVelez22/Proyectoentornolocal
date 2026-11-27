# 15 · Seguridad

## Para qué sirve

Este capítulo resume cómo **WolfCore Dev** protege sus credenciales, proyectos, bases de datos, red local y descargas, y qué decisiones dependen siempre de su confirmación explícita.

## Principios de seguridad de WolfCore Dev

1. **Todo corre en local (`127.0.0.1`) por defecto:** Nginx local, MySQL, MariaDB, PostgreSQL, Redis, MongoDB, Mailpit y demás captadores, Ollama, Adminer, phpMyAdmin, receptor de Depuración, servidor MCP y servidor CLI escuchan únicamente en `127.0.0.1`. Nada se expone a la red ni a internet sin una acción y confirmación suyas.
2. **Secretos cifrados y nunca exportados:**
   - Las claves de IA en la nube, el token de GitHub, las claves SMTP y los tokens de túneles (ngrok/Expose) se almacenan cifrados mediante `safeStorage` en `etc/secretos/`, nunca en `config.json`, URLs, registros ni eventos.
   - Los secretos del **Cliente HTTP** (tokens, contraseñas y claves de API) también van cifrados: la colección, el historial y los entornos solo guardan una referencia, y el historial oculta las cabeceras sensibles.
   - Al exportar una **plantilla** o un **perfil `.wolfperfil`**, jamás se incluyen claves, tokens ni contraseñas (si incluye bases de datos o la CA en un perfil, se cifran con scrypt + AES-256-GCM usando la frase que usted elija).
   - Al usar **Abrir en Adminer** o **phpMyAdmin** desde un proyecto, el acceso autenticado usa un token de un solo uso canjeado en el servidor (la contraseña nunca pasa por la URL).
   - El token del **Servidor MCP** (`WOLFCORE_MCP_TOKEN`) nunca se escribe en los archivos de configuración de los agentes; solo se inyecta en la terminal abierta desde WolfCore Dev.
3. **Confianza explícita antes de ejecutar código de terceros:**
   - Un proyecto clonado, importado o creado desde una plantilla importada nace **sin confianza**. Ninguna receta, proceso ni tarea programada corre hasta que usted marque **Confío en este repositorio**.
   - Si `wolfcore.yml` cambia después de haber confiado, el proyecto vuelve a pedir revisión antes de correr recetas o tareas.
4. **Protección reforzada para sitios con «datos reales»:**
   - Un sitio marcado con **datos reales** queda **bloqueado** para compartirse en **Red local** y para usar **Expose** (cuyo inspector es visible en la red local).
   - Publicarlo por otros túneles (desde la ventana o desde `wolf share`) exige confirmación reforzada escribiendo su dominio exacto.
   - En **Consultas lentas**, se oculta el SQL literal cuando el servidor tiene bases con datos reales.
   - En el **Editor de código**, abrir o guardar un archivo de un sitio con datos reales exige escribir el nombre del archivo para confirmar.
5. **Descargas verificadas de fuentes oficiales:**
   - Cada servicio y runtime se descarga únicamente desde listas explícitas de hosts oficiales (verificando cada redirección salto a salto).
   - Se verifica la huella **SHA-256 / SHA-512** o la **firma OpenPGP v4** (con claves fijadas en la app, como en Node, Composer y Nginx).
   - Las descargas sin huella fuerte (o WordPress con SHA-1) muestran una advertencia clara y solo se instalan si usted acepta explícitamente el riesgo.
6. **Confirmación y copias previas antes de cambios delicados:**
   - Modificar `php.ini`, vhosts de Nginx, `.env`, `.gitignore`, archivos de agentes, restaurar bases sobre bases con tablas, actualizar versiones, importar perfiles o reparar con Doctor siempre muestra qué va a cambiar y crea copias previas antes de escribir.
   - **Cortafuegos:** Doctor nunca cambia el Firewall de Windows por su cuenta. Solo quita las reglas de entrada de programas de WolfCore Dev abiertas a la red que usted marque, una por una, tras confirmar y con el permiso de administrador de Windows, y antes guarda una copia en el registro protegido (`HKLM`, que solo un administrador puede modificar) con la que puede recrearlas. Las reglas de otros programas y las acotadas a la red local solo se muestran.
   - **Compartir carpeta o archivo** rechaza `.env*`, claves, `.git`, `.ssh`, datos de programas, archivos con secretos, la carpeta de datos de WolfCore Dev, la raíz de una unidad y la carpeta de usuario entera; el enlace es de solo lectura, lleva un código secreto, vence en 15 minutos, 1 hora o 4 horas y un archivo comprimido se publica sin revisar su interior.
   - WolfCore Dev nunca detiene, mata ni modifica programas externos (como FlyEnv), nunca toca reglas de cortafuegos de otros programas y nunca sigue enlaces simbólicos al limpiar disco o versiones.

## Paso a paso para trabajar de forma segura

1. **Marque los sitios con datos reales:** al editar un sitio que contenga datos de clientes o copias de producción, active la marca de **datos reales** en su formulario.
2. **Use usuarios propios de base de datos:** en **Variables .env…**, use **Usar usuario propio** para que cada proyecto MySQL/MariaDB acceda únicamente a su base y no con `root`.
3. **Mantenga `.env` fuera de Git:** verifique siempre que `.env` esté en `.gitignore` y nunca confirme el guardado si el gestor le avisa que Git ya lo rastrea (retírelo antes con `git rm --cached .env`).
4. **Cierre túneles y red local al terminar:** cierre cualquier túnel público en **Túneles** en cuanto finalice la demostración.
5. **No use FTP en red local en redes públicas:** el servidor FTP integrado no cifra el tráfico (sin FTPS/SFTP); deje desactivada la opción de red local salvo en una red privada de plena confianza.
6. **Revise capturas antes de compartirlas:** en **Herramientas → Captura de pantalla**, use **Ocultar** (relleno sólido) y no **Pixelar** para tapar tokens, claves o datos de clientes.

[CAPTURA: Diálogo de confirmación reforzada al intentar publicar un sitio marcado con datos reales]

## Ejemplo

Va a depurar una copia local de la base de datos de un cliente en `cliente-demo.test`:

1. Edite el sitio `cliente-demo.test` y marque que tiene **datos reales**.
2. Revise que no esté abierto ningún túnel ni **Red local** (ambos quedan protegidos).
3. Si necesita mostrar una pantalla de error, use **Captura de pantalla → Ocultar** sobre nombres, correos o tokens antes de guardar.

## Si algo falla

- **«El cifrado del sistema no está disponible» (`secretos.sin_cifrado`):** `safeStorage` de Electron depende del almacén de credenciales del usuario en Windows. Cierre sesión y vuelva a iniciar sesión en Windows, o revise si algún servicio del sistema de credenciales está detenido; mientras no esté disponible, WolfCore Dev no guarda claves nuevas en texto plano.
- **Un agente de IA solicita una acción inesperada por MCP:** pulse **Rechazar** en el diálogo **Un asistente pide confirmación** y, si sospecha exposición del token, pulse **Regenerar token** en **Ajustes → Servidor MCP**.
- **Instalar una CA sin restricciones desde un perfil `.wolfperfil`:** si el asistente avisa que la CA del perfil no tiene restricciones de nombre, impórtela **solo** si es suya y coincide exactamente con la huella SHA-256 de su equipo de origen; de lo contrario, elija no importarla para generar una CA nueva restringida.
