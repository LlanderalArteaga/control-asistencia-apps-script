const SPREADSHEET_ID = '1pfSFil8G7UinyMIHKS5CKIfvoQmN2AsJLm1_fxdLy8Y';

const HOJAS = Object.freeze({
  PARTICIPANTES: 'Participantes',
  SESIONES: 'Sesiones',
  ASISTENCIAS: 'Asistencias'
});

function obtenerLibro_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('PEGA_AQUI')) {
    throw new Error('Configura SPREADSHEET_ID en Config.gs antes de ejecutar la aplicación.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
