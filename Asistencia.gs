function obtenerHoja_(ss, nombre) {
  const hoja = ss.getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la hoja ' + nombre + '. Ejecuta prepararBaseDatos().');
  return hoja;
}

function leerFilas_(hoja, columnas) {
  return hoja.getLastRow() < 2 ? [] :
    hoja.getRange(2, 1, hoja.getLastRow() - 1, columnas).getValues();
}

function buscarSesion_(ss, idSesion) {
  const hoja = obtenerHoja_(ss, HOJAS.SESIONES);
  const filas = leerFilas_(hoja, 5);
  const posicion = filas.findIndex(fila => fila[0] === idSesion);
  if (!idSesion || posicion < 0) throw new Error('Selecciona una sesión válida.');
  return { hoja, posicion };
}

function obtenerSesiones() {
  const ss = obtenerLibro_();
  return leerFilas_(obtenerHoja_(ss, HOJAS.SESIONES), 5).map(fila => ({
    id: fila[0], numero: fila[1],
    fecha: fila[2] instanceof Date
      ? Utilities.formatDate(fila[2], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(fila[2]),
    tema: fila[3], estado: fila[4]
  }));
}

function obtenerParticipantes(idSesion) {
  const ss = obtenerLibro_();
  buscarSesion_(ss, idSesion);
  const estados = new Map();
  leerFilas_(obtenerHoja_(ss, HOJAS.ASISTENCIAS), 4).forEach(fila => {
    if (fila[0] === idSesion) estados.set(fila[1], fila[2]);
  });
  return leerFilas_(obtenerHoja_(ss, HOJAS.PARTICIPANTES), 4)
    .filter(fila => fila[3] === true)
    .map(fila => ({
      id: fila[0], nombre: fila[1], correo: fila[2],
      presente: estados.get(fila[0]) === 'PRESENTE'
    }));
}

function guardarAsistencia(idSesion, participantes) {
  if (!Array.isArray(participantes) || participantes.length === 0) {
    throw new Error('No se recibieron participantes.');
  }
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(30000);
  try {
    const ss = obtenerLibro_();
    buscarSesion_(ss, idSesion);
    const activos = leerFilas_(obtenerHoja_(ss, HOJAS.PARTICIPANTES), 4)
      .filter(fila => fila[3] === true).map(fila => fila[0]);
    const ids = new Set();
    participantes.forEach(p => {
      if (!p || !activos.includes(p.id) || typeof p.presente !== 'boolean' || ids.has(p.id)) {
        throw new Error('Hay participantes inválidos, inactivos o repetidos. Recarga la sesión.');
      }
      ids.add(p.id);
    });
    if (ids.size !== activos.length) {
      throw new Error('La lista de participantes cambió o está incompleta. Recarga la sesión.');
    }
    const hoja = obtenerHoja_(ss, HOJAS.ASISTENCIAS);
    const existentes = leerFilas_(hoja, 4);
    const indice = new Map();
    existentes.forEach((fila, i) => {
      const clave = JSON.stringify([fila[0], fila[1]]);
      if (indice.has(clave)) throw new Error('Hay asistencias duplicadas en la hoja. Corrígelas antes de guardar.');
      indice.set(clave, i);
    });
    const ahora = new Date();
    participantes.forEach(p => {
      const clave = JSON.stringify([idSesion, p.id]);
      const registro = [idSesion, p.id, p.presente ? 'PRESENTE' : 'AUSENTE', ahora];
      if (indice.has(clave)) existentes[indice.get(clave)] = registro;
      else {
        indice.set(clave, existentes.length);
        existentes.push(registro);
      }
    });
    // Escribir sin borrar primero: un fallo no deja la tabla vacía.
    hoja.getRange(2, 1, existentes.length, 4).setValues(existentes);
    hoja.getRange(2, 4, existentes.length, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    marcarSesionRegistrada_(ss, idSesion);
    SpreadsheetApp.flush();
    const presentes = participantes.filter(p => p.presente).length;
    return { ok: true, idSesion, presentes, ausentes: participantes.length - presentes, total: participantes.length };
  } finally {
    bloqueo.releaseLock();
  }
}

function marcarSesionRegistrada_(ss, idSesion) {
  const sesion = buscarSesion_(ss, idSesion);
  sesion.hoja.getRange(sesion.posicion + 2, 5).setValue('REGISTRADA');
}
