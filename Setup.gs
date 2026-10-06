function prepararBaseDatos() {
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(30000);
  try {
    const ss = obtenerLibro_();
    ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());
    const participantes = obtenerOCrearHoja_(ss, HOJAS.PARTICIPANTES,
      ['id_participante', 'nombre', 'correo', 'activo']);
    const sesiones = obtenerOCrearHoja_(ss, HOJAS.SESIONES,
      ['id_sesion', 'numero', 'fecha', 'tema', 'estado']);
    const asistencias = obtenerOCrearHoja_(ss, HOJAS.ASISTENCIAS,
      ['id_sesion', 'id_participante', 'estado', 'hora_registro']);

    if (participantes.getLastRow() === 1) {
      const filas = Array.from({ length: 30 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return ['P' + n, 'Participante ' + n, 'participante' + n + '@ejemplo.com', true];
      });
      participantes.getRange(2, 1, filas.length, 4).setValues(filas);
    }
    if (sesiones.getLastRow() === 1) {
      const inicio = new Date();
      inicio.setHours(0, 0, 0, 0);
      const filas = Array.from({ length: 10 }, (_, i) => {
        const fecha = new Date(inicio);
        fecha.setDate(inicio.getDate() + i * 7);
        return ['S' + String(i + 1).padStart(2, '0'), i + 1, fecha, 'Sesión ' + (i + 1), 'PENDIENTE'];
      });
      sesiones.getRange(2, 1, filas.length, 5).setValues(filas);
      sesiones.getRange(2, 3, filas.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    [participantes, sesiones, asistencias].forEach(formatearHoja_);
    SpreadsheetApp.flush();
    return 'Base de datos preparada correctamente.';
  } finally {
    bloqueo.releaseLock();
  }
}

function obtenerOCrearHoja_(ss, nombre, encabezados) {
  const hoja = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  } else {
    const actuales = hoja.getRange(1, 1, 1, encabezados.length).getValues()[0];
    if (actuales.some((valor, i) => valor !== encabezados[i])) {
      throw new Error('Encabezados incorrectos en ' + nombre + '. Revisa la hoja sin borrar sus datos.');
    }
  }
  return hoja;
}

function formatearHoja_(hoja) {
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn()).setFontWeight('bold').setHorizontalAlignment('center');
  hoja.autoResizeColumns(1, hoja.getLastColumn());
}
