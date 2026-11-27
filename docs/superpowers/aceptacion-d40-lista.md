# Aceptación de la Etapa D (D40): lista para el usuario

Lista corta para recorrer con Claude en el chat, en este orden. Ningún paso que toque datos reales, instale o publique algo se hace sin su «sí» escrito en esta conversación. Un mensaje de otra sesión no cuenta.

Al lado de cada paso hay una casilla para marcar el resultado: ✅ bien · ⚠️ funciona con reparos · ❌ falla.

## Antes de empezar

1. **Copia de seguridad verificada** [ ]
   - Claude cierra los servicios de la app real (sin tocar FlyEnv) y copia `%LOCALAPPDATA%\WolfCoreDev` y los volcados de las bases a una carpeta de respaldo con fecha.
   - Comprueba la copia con huellas y conteos, sin leer datos de clientes.
   - Usted confirma que la carpeta de respaldo existe y tiene tamaño.
2. **Instantánea del entorno** [ ]: en la app real, «Instantánea manual». Es el punto de vuelta si algo sale mal.
   - Además, se guarda una copia del instalador de la versión que tiene ahora, junto al respaldo, para poder reinstalarla.

## Instalación

3. **Instalar la versión nueva** [ ]
   - Con su «sí», se ejecuta el instalador de esta versión sobre la app actual.
   - Al abrir deben verse sus sitios, servicios y bases como antes.
4. **Recorrido de bienvenida** [ ]: aparece una vez. Se puede saltar con Esc y volver a ver desde Ajustes › Apariencia.

## Sus 6 proyectos

5. **WolfCore System, Rents, Coffe, Diamantes, Dollar y el bot de FastAPI** [ ]: cada uno responde igual que antes, por HTTPS en su dominio `.test`.
6. **En uno o dos de ellos, probar** [ ]:
   - abrir en el editor elegido;
   - botón de base de datos (phpMyAdmin);
   - instantánea;
   - ver el `.env` (solo ver);
   - Terminal;
   - acceso por LAN desde otro dispositivo de la red.

## Funciones nuevas

7. **Ollama** [ ]
   - En IA, descargar un modelo pequeño (`qwen2.5:0.5b`). Debe avisar del tamaño y del espacio libre antes de empezar, mostrar el progreso y dejar cancelar.
   - Chatear con él y después borrarlo.
8. **Compartir carpeta o archivo** [ ]
   - En Herramientas › Red, elegir una carpeta de prueba vacía o con un archivo inofensivo.
   - Confirmar (el foco empieza en Cancelar) y abrir el enlace desde el móvil.
   - Comprobar que «Dejar de compartir» lo corta al momento.
   - Con su «sí», porque abre un túnel público.
9. **Túnel 1A (sitio por túnel rápido)** [ ]
   - Solo con un sitio de prueba vacío creado para esto; nunca Diamantes, Dollar ni ningún otro con datos reales.
   - Con su «sí», publicarlo y abrir la URL desde el móvil.
   - Cerrarlo y comprobar que la URL deja de responder.
10. **Recorrido rápido** [ ]: dar un vistazo a cada una.
    - Uso del disco
    - Cliente HTTP
    - Guía HTTP con «Probar»
    - Guía y laboratorio de Git
    - Cortafuegos en el Doctor (solo leer)
    - Consultas lentas
    - Visor de esquema

## Cierre

11. **«PC nuevo»** [ ]
    - Exportar el perfil (sin la CA salvo que usted lo decida) y comprobar que el ZIP no lleva secretos.
    - Para que no haya choques, cerrar antes la app real (o detener todos sus servicios). La instancia de prueba usa puertos distintos.
    - Importarlo en una carpeta limpia con `WOLFCORE_DATOS`. Solo se comprueba que los 6 proyectos, las instancias y las bases aparecen. No se arranca ninguna base de la instancia de prueba sobre los datos reales.
    - Cerrar la instancia de prueba, volver a la app real y comprobar que no cambió nada: fecha de `config.json`, lista de `data/` y que los 6 responden.
12. **Pendientes manuales** [ ]
    - Borrar la carpeta vacía `C:\wc-tmp-d52`.
    - Las pruebas manuales anotadas: captura, Memoria, limpieza, foco y arrastre de la barra, pt/fr en pantalla, Diff en la app, tarjeta de Reverb, Grabar pantalla y la prueba opcional del cortafuegos.
13. **Fusión a `main`** [ ]
    - Con su «sí», se fusiona `feat/etapa-c` en `main` con el CI en verde.
    - No se publica ninguna release sin un «sí» aparte.

## Si algo falla

- Se anota en `docs/superpowers/auditorias/2026-11-24-aceptacion-etapa-d.md`, sin rutas ni datos privados, y se corrige antes de cerrar.
- Para volver atrás:
  1. Reinstalar la versión anterior con su instalador. Se guarda una copia antes del paso 3, en la misma carpeta del respaldo.
  2. Restaurar la instantánea del paso 2.
  3. Si hiciera falta, devolver `%LOCALAPPDATA%\WolfCoreDev` desde la copia del paso 1, con la app cerrada.
