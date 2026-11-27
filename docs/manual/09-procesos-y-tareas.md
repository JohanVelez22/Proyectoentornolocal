# 09 · Procesos y tareas programadas

## Para qué sirve

Muchos proyectos necesitan procesos en segundo plano (`npm run dev`, `php artisan queue:work`, `uvicorn`, Laravel Reverb) o tareas periódicas (`php artisan schedule:run`). WolfCore Dev los ejecuta con consola oculta, registros en vivo y control de confianza desde la propia tarjeta de cada proyecto.

## Paso a paso

### 1. Agregar y encender procesos supervisados

1. Abra **Proyectos** y despliegue la sección de **Procesos** en la tarjeta del proyecto (asegúrese de haber marcado **Confío en este repositorio**).
2. Pulse el botón para añadir un proceso (o edite uno detectado desde `wolfcore.yml`).
3. Configure:
   - **Nombre:** una etiqueta corta (por ejemplo, `Vite` o `Colas`).
   - **Comando:** el comando del proyecto (por ejemplo, `npm run dev`, `php artisan queue:work` o `uvicorn main:app`).
   - **Opciones:** si debe **reiniciarse** al fallar, si tiene **inicio automático** (arranca con **Iniciar todo** solo si la base de datos del proyecto responde) y, en sitios proxy como FastAPI o Node, si es el proceso al que Nginx enviará el tráfico.
4. Guarde y active el interruptor del proceso.
5. Para ver la salida en tiempo real, pulse el botón de **Registros** junto al proceso (también puede abrir la carpeta de logs o verlos en la pantalla **Registros**).

> **Cómo informa el final de un proceso:** cuando un proceso sin reinicio termina con código `0`, pasa a estado **Apagado** y genera un aviso informativo de que terminó sin errores. Si sale con otro código, queda en **Error** y llega un aviso con su código de salida.

[CAPTURA: Sección de Procesos en una tarjeta de proyecto con interruptores para npm run dev y queue:work y el panel de log en vivo]

### 2. Encender Laravel Reverb (en proyectos Laravel)

Si su proyecto usa Laravel Reverb para WebSockets:

1. En la tarjeta del proyecto Laravel, abra la sección **Reverb**.
2. Active el interruptor y confirme en **¿Encender Reverb?** (ejecuta `php artisan reverb:start` escuchando únicamente en `127.0.0.1` en un puerto libre).
3. Pulse **Proponer variables `REVERB_*`** si desea cargar los valores recomendados en el gestor de `.env` y revisarlos antes de guardar.

### 3. Crear y controlar tareas programadas (cron)

Las tareas programadas corren **solo mientras WolfCore Dev está abierto**, únicamente en proyectos con **Confío en este repositorio** marcado y con el comando confirmado:

1. En la tarjeta del proyecto, despliegue la sección de **Tareas programadas** (si el proyecto trae propuestas en `wolfcore.yml`, también puede adoptarlas desde allí).
2. Pulse **Nueva tarea** (o el botón **+**) y complete:
   - **Nombre** (por ejemplo, `Planificador Laravel`).
   - **Horario:** elija una ayuda rápida (**cada minuto**, **cada hora**, **diaria**, **días laborables**) o escriba una expresión cron de 5 campos (`minuto hora día-mes mes día-semana`, por ejemplo `0 3 * * *` para las 3:00).
   - **Comando:** el comando permitido del proyecto (se aceptan `php`, `node`, `npm run` o `python` con un archivo del proyecto; por seguridad no se permiten flags de código en línea como `-r`, `-e` ni `-c`, ni comandos arbitrarios de shell).
3. Confirme el comando y guarde.
4. Use el interruptor para pausar o activar la tarea, pulse **Ejecutar ahora** para probarla al instante y abra su **registro / historial** (se conservan las últimas 50 ejecuciones con duración y código de salida).
5. Opcionalmente puede guardar la tarea dentro del archivo `wolfcore.yml` del proyecto desde su botón correspondiente.

[CAPTURA: Sección de Tareas programadas en una tarjeta de proyecto mostrando una tarea cron cada minuto con historial y botón Ejecutar ahora]

## Ejemplo

Quiere correr un proyecto Laravel (`mi-tienda.test`) con Vite en vivo y el planificador ejecutándose cada minuto:

1. En la tarjeta de `mi-tienda`, marque **Confío en este repositorio**.
2. En **Procesos**, añada `Vite` con comando `npm run dev` y encienda su interruptor.
3. En **Tareas programadas**, cree `Schedule` con horario `* * * * *` (cada minuto) y comando `php artisan schedule:run`, confirme el comando y pulse **Ejecutar ahora** para verificar que termina con código `0`.

## Si algo falla

- **Una tarea programada aparece bloqueada y no corre:** revise el motivo en el aviso de la campana o en la sección de tareas:
  - El proyecto no tiene marcado **Confío en este repositorio**.
  - La receta (`wolfcore.yml`) cambió después de confiar: revísela y vuelva a confirmar la confianza.
  - Está usando una carpeta de datos de prueba (`WOLFCORE_DATOS`): pulse el botón para permitir tareas en modo aislado si realmente desea probarlas allí.
- **«El comando no está permitido» al crear una tarea:** use `php`, `node`, `npm run` o `python` apuntando a un archivo dentro del proyecto (por ejemplo, `php artisan schedule:run`), sin `-r`, `-e` o `-c`.
- **Un proceso de inicio automático no arrancó con «Iniciar todo»:** compruebe que la base de datos configurada en el `.env` del proyecto esté encendida y respondiendo; el supervisor espera a la base antes de lanzar procesos dependientes.
- **Un proceso no aparece al importar un perfil `.wolfperfil` en otro equipo:** por seguridad, los comandos de procesos y tareas de otro equipo nunca se importan automáticamente; créelos de nuevo o adóptelos tras revisar `wolfcore.yml`.
