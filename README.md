# Control de asistencia

Web App móvil para 30 participantes y 10 sesiones semanales. Google Sheets almacena los datos y Google Apps Script ejecuta el backend.

## Archivos y responsabilidades

- `Config.gs`: SPREADSHEET_ID, HOJAS y apertura del libro.
- `Setup.gs`: prepararBaseDatos(), creación y validación de encabezados, carga inicial y formato.
- `Asistencia.gs`: obtenerSesiones(), obtenerParticipantes(), guardarAsistencia() y auxiliares privados terminados en _.
- `Code.gs`: doGet(), entrada de la Web App.
- `index.html`: interfaz adaptable al móvil, contador, selección y guardado mediante google.script.run.
- `appsscript.json`: manifiesto V8 con America/Mexico_City.
- `.clasp.json`: vínculo existente al proyecto remoto. El scriptId NO es el ID de Google Sheets.
- `.gitignore`: exclusión de credenciales, configuración local y dependencias de Git.
- `.claspignore`: lista explícita de archivos que se sincronizan con Apps Script.
- `Código.js`: ejemplo previo conservado, excluido de la sincronización.
- `README.md`: configuración y operación.

## Base de datos: BD_Control_Asistencia

Crea un libro con ese nombre. Sus hojas se preparan mediante prepararBaseDatos():

| Hoja          | Columnas                                          | Clave lógica               |
| ------------- | ------------------------------------------------- | --------------------------- |
| Participantes | id_participante, nombre, correo, activo           | id_participante             |
| Sesiones      | id_sesion, numero, fecha, tema, estado            | id_sesion                   |
| Asistencias   | id_sesion, id_participante, estado, hora_registro | id_sesion + id_participante |

Se generan P01–P30 con nombres y correos ficticios y activo TRUE (booleano de Sheets), y S01–S10 con estado PENDIENTE. La primera fecha es el día de inicialización y las siguientes avanzan siete días. La preparación ajusta la zona horaria del libro a la del script. Cada tabla se carga solo si no tiene filas de datos; repetir la preparación no repone filas eliminadas ni cambia las fechas existentes. Los encabezados incorrectos producen un error.

Reemplaza los datos de ejemplo por los reales sin cambiar los IDs. Usa FALSE para desactivar participantes: sus asistencias históricas permanecen almacenadas y ya no aparecen en la lista activa.

## Puesta en operación

1. Copia el ID de la URL del libro: https://docs.google.com/spreadsheets/d/ID_DEL_LIBRO/edit.
2. Sustituye el marcador SPREADSHEET_ID en Config.gs.
3. En la terminal del proyecto, con clasp instalado y la cuenta autorizada, ejecuta:
   ```sh
   clasp login
   clasp show-file-status
   clasp push
   clasp open-script
   ```

   Omite login si ya tienes sesión. Revisa el destino de .clasp.json antes del push: sincroniza el contenido local con el proyecto remoto.
4. En el editor de Apps Script ejecuta prepararBaseDatos() y concede los permisos solicitados. La cuenta ejecutora necesita permiso de edición del libro.
5. Comprueba las tres hojas: 30 participantes, 10 sesiones y Asistencias con solo encabezados.
6. En Implementar > Probar implementaciones, selecciona Aplicación web y abre la URL /dev (accesible para editores del proyecto).
7. Selecciona una sesión desde el móvil, marca presentes y guarda.
8. Repite el guardado y comprueba que actualiza los registros sin duplicarlos.
9. Cuando termines las pruebas, usa Implementar > Nueva implementación > Aplicación web para obtener /exec. Configura la identidad de ejecución y el acceso para las personas autorizadas a tomar asistencia. Si ejecuta como propietario, esas personas escriben con sus permisos; la aplicación no incluye roles propios.
10. Para publicar cambios posteriores, ejecuta clasp push y actualiza la implementación /exec a una nueva versión.

## Reglas y pruebas de aceptación

- Una sesión nueva muestra a todos los participantes activos desmarcados; al guardar, los desmarcados se registran como AUSENTE.
- Guarda S01 con 20 presentes y 10 ausentes: deben existir 30 registros y S01 debe quedar REGISTRADA.
- Cambia una marca y guarda S01 otra vez: deben seguir existiendo 30 registros con los nuevos estados.
- Guarda S02: deben existir 60 registros y conservarse los de S01.
- Recarga S01: deben recuperarse sus marcas.
- Repite prepararBaseDatos(): los datos y fechas deben conservarse.
- Desactiva P30, recarga la sesión y comprueba que quedan 29 participantes visibles y que su historial sigue en Sheets.
- El backend rechaza sesiones desconocidas, IDs repetidos o inactivos, valores no booleanos y listas incompletas antes de escribir.
- LockService serializa los guardados de esta aplicación. Si dos usuarios guardan la misma sesión, prevalece el último guardado completo; no se crean duplicados.
- Duplicados ya introducidos manualmente en Asistencias producen un error y requieren corrección en Sheets.
- El bloqueo no impide ediciones manuales en Sheets. No edites las tablas durante el guardado.
- La interfaz deshabilita controles mientras carga o guarda y muestra los errores. Si falla la carga inicial, recarga la página.
- Sheets no ofrece una transacción conjunta entre estas hojas: si falla una escritura, recarga y vuelve a guardar; la operación es repetible.

## Validación local y remota

La sintaxis y las reglas del backend pueden probarse localmente con servicios simulados. La autorización, el acceso real a Sheets y el funcionamiento móvil deben comprobarse con /dev. Abrir index.html directamente no conecta con Apps Script.

Referencias: [clasp](https://github.com/google/clasp), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service), [Web Apps](https://developers.google.com/apps-script/guides/web).
