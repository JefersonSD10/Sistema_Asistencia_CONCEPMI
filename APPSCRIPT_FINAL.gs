/*******************************
 *  AppScript - Sistema de Asistencia
 *  - Registro de asistencia general con kit único
 *  - Registro de asistencia a ponencias
 *  - Sin validaciones de tiempo
 *******************************/

const SHEET_ATTENDEES = 'Attendees';
const SHEET_SESSIONS   = 'Sessions';
const SHEET_GENERAL    = 'GeneralAttendance';
const SHEET_SESSION    = 'SessionAttendance';

const HDR_ATTENDEES = ['NOMBRES','APELLIDOS','E-MAIL','CELULAR','DNI'];
const HDR_SESSIONS = [
  'ID','Ponente','Tipo','Eje','Cupos totales',
  'Dia','Duracion','Tiempo Inicio','Tiempo Fin','Horas'
];
const HDR_GENERAL = ['Doc. Identidad','Marca de tiempo','Kit Entregado'];
const HDR_SESSIONS_ATTN = ['Doc. Identidad','Sesion ID','Marca de tiempo'];

/*******************************
 *          WEB APP
 *******************************/
function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    let out;

    if (action === 'getAttendeeByDNI') {
      const dni = (e.parameter.dni || '').trim();
      out = getAttendeeByDNI(dni);
    } else if (action === 'getSessionsList') {
      out = getSessionsList();
    } else if (action === 'getSessionsCapacity') {
      out = getSessionsCapacity();
    } else if (action === 'exportAttendeesData') {
      out = exportAttendeesData();
    } else {
      out = { error: 'Acción GET no soportada.' };
    }

    return jsonResponse(out);
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};
    const action = (body.action || '').trim();
    let out;

    if (action === 'registerGeneralAttendance') {
      out = registerGeneralAttendance(body.dni, body.timestamp || new Date().toISOString());
    } else if (action === 'registerSessionAttendance') {
      out = registerSessionAttendance(
        body.dni,
        body.session_id,
        body.timestamp || new Date().toISOString()
      );
    } else {
      out = { error: 'Acción POST no soportada.' };
    }

    return jsonResponse(out);
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

/*******************************
 *      ENDPOINT FUNCTIONS
 *******************************/

function getAttendeeByDNI(dni) {
  if (!dni || dni.length !== 8)
    return { error: 'dni inválido (8 dígitos)' };

  const attendees = readSheetAsObjects(SHEET_ATTENDEES, HDR_ATTENDEES);
  const att = attendees.find(r => String(r['DNI']).trim() === dni);

  if (!att)
    return { error: 'DNI no encontrado.' };

  const general = readSheetAsObjects(SHEET_GENERAL, HDR_GENERAL);
  const asistencia_general = general.some(r => String(r['Doc. Identidad']).trim() === dni);

  const sesAttn = readSheetAsObjects(SHEET_SESSION, HDR_SESSIONS_ATTN);
  const sesiones = sesAttn
    .filter(r => String(r['Doc. Identidad']).trim() === dni)
    .map(r => String(r['Sesion ID']).trim());

  const asistidasSet = new Set(sesiones);
  const sessions = readSheetAsObjects(SHEET_SESSIONS, HDR_SESSIONS);

  const result = {
    dni,
    nombre: (att['NOMBRES'] + ' ' + att['APELLIDOS']).trim(),
    asistencia_general
  };

  sessions.forEach(s => {
    const id = String(s['ID']).trim();
    result[id] = asistidasSet.has(id);
  });

  return result;
}

function getSessionsList() {
  const sessions = readSheetAsObjects(SHEET_SESSIONS, HDR_SESSIONS);
  return sessions.map(s => ({
    id: s['ID'],
    name: s['Tipo'],
    description: s['Eje']
  }));
}

function getSessionsCapacity() {
  const sessions = readSheetAsObjects(SHEET_SESSIONS, HDR_SESSIONS);
  const sesAttn = readSheetAsObjects(SHEET_SESSION, HDR_SESSIONS_ATTN);

  const countBySession = {};
  sesAttn.forEach(r => {
    const sid = r['Sesion ID'];
    countBySession[sid] = (countBySession[sid] || 0) + 1;
  });

  const out = {};
  sessions.forEach(s => {
    const id = s['ID'];
    const total = toNumber(s['Cupos totales']);
    const registered = countBySession[id] || 0;

    out[id] = {
      available: Math.max(0, total - registered),
      total,
      name: s['Tipo']
    };
  });

  return out;
}

function exportAttendeesData() {
  const attendees = readSheetAsObjects(SHEET_ATTENDEES, HDR_ATTENDEES);
  const general   = readSheetAsObjects(SHEET_GENERAL, HDR_GENERAL);
  const sesAttn   = readSheetAsObjects(SHEET_SESSION, HDR_SESSIONS_ATTN);
  const sessions  = readSheetAsObjects(SHEET_SESSIONS, HDR_SESSIONS);

  const generalSet = new Set(
    general.map(r => String(r['Doc. Identidad']).trim())
  );

  const byDniSessions = {};
  sesAttn.forEach(r => {
    const dni = String(r['Doc. Identidad']).trim();
    const sid = String(r['Sesion ID']).trim();
    if (!byDniSessions[dni]) byDniSessions[dni] = new Set();
    byDniSessions[dni].add(sid);
  });

  const sessionsSorted = sessions.sort((a,b)=>
    a['ID'].localeCompare(b['ID'])
  );

  const header = ['DNI','Nombre','Asistencia General']
    .concat(sessionsSorted.map(s => s['Tipo']));

  const rows = [header];

  attendees.forEach(a => {
    const dni = String(a['DNI']).trim();
    const nombre = (a['NOMBRES'] + ' ' + a['APELLIDOS']).trim();
    const ag = generalSet.has(dni) ? 'Sí' : 'No';
    const setSes = byDniSessions[dni] || new Set();

    const sesFlags = sessionsSorted.map(s =>
      setSes.has(s['ID']) ? 'Sí' : 'No'
    );

    rows.push([dni, nombre, ag].concat(sesFlags));
  });

  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');

  return { csv_data: csv };
}

function registerGeneralAttendance(dni, timestampISO) {
  if (!dni || dni.length !== 8)
    return { error: "dni inválido" };

  if (!existsAttendee(dni))
    return { error: "DNI no existe en Attendees." };

  const general = readSheetAsObjects(SHEET_GENERAL, HDR_GENERAL);
  
  const today = new Date(timestampISO);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const existingToday = general.find(r => {
    if (String(r['Doc. Identidad']).trim() !== dni) return false;
    
    const recordDate = new Date(r['Marca de tiempo']);
    const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    
    return recordDateOnly.getTime() === todayDate.getTime();
  });

  if (existingToday) {
    const hasKit = general.some(r => 
      String(r['Doc. Identidad']).trim() === dni && 
      r['Kit Entregado'] === true
    );
    
    return {
      registered: true,
      dni,
      timestamp: existingToday['Marca de tiempo'],
      kit_entregado: hasKit,
      already_registered_today: true
    };
  }

  const isFirstTime = !general.some(r => String(r['Doc. Identidad']).trim() === dni);
  
  const lock = LockService.getScriptLock();
  lock.waitLock(2000);

  try {
    const sh = getSheet(SHEET_GENERAL, HDR_GENERAL);
    sh.appendRow([dni, timestampISO, isFirstTime ? true : false]);
  } finally {
    lock.releaseLock();
  }

  return {
    registered: true,
    dni,
    timestamp: timestampISO,
    kit_entregado: isFirstTime
  };
}

function registerSessionAttendance(dni, sessionId, timestampISO) {
  if (!dni || dni.length !== 8)
    return { error: "dni inválido" };
  if (!sessionId)
    return { error: "session_id requerido" };
  if (!existsAttendee(dni))
    return { error: "DNI no existe" };

  const sessions = readSheetAsObjects(SHEET_SESSIONS, HDR_SESSIONS);
  const ses = sessions.find(s => String(s['ID']) === sessionId);
  if (!ses)
    return { error: "session_id no existe" };

  const general = readSheetAsObjects(SHEET_GENERAL, HDR_GENERAL);
  const hasGeneral = general.some(r => String(r['Doc. Identidad']) === dni);
  if (!hasGeneral)
    return { no_general_attendance: true, dni };

  // ⭐ VALIDACIÓN DE TIEMPO ELIMINADA - Permite registro en cualquier momento

  const sesAttn = readSheetAsObjects(SHEET_SESSION, HDR_SESSIONS_ATTN);

  // Capacidad
  const totalCap = toNumber(ses['Cupos totales']);
  const registeredCount = sesAttn.filter(r => String(r['Sesion ID']) === sessionId).length;

  if (registeredCount >= totalCap)
    return {
      no_capacity: true,
      session_id: sessionId,
      session_name: ses['Tipo'],
      available_capacity: 0
    };

  // Duplicado
  const dup = sesAttn.some(r =>
    String(r['Doc. Identidad']) === dni &&
    String(r['Sesion ID']) === sessionId
  );

  if (dup)
    return {
      already_registered: true,
      dni,
      session_id: sessionId,
      session_name: ses['Tipo']
    };

  // Verificar solapamiento
  const targetRange = sessionTimeRange(ses);
  const userSessions = sesAttn.filter(r => String(r['Doc. Identidad']) === dni);

  for (const r of userSessions) {
    const s2 = sessions.find(s => s['ID'] === r['Sesion ID']);
    if (s2) {
      const r2 = sessionTimeRange(s2);
      if (overlap(targetRange, r2)) {
        return {
          overlap: true,
          conflict_with: s2['ID'],
          conflict_name: s2['Tipo']
        };
      }
    }
  }

  // Registrar
  const lock = LockService.getScriptLock();
  lock.waitLock(2000);
  try {
    const sh = getSheet(SHEET_SESSION, HDR_SESSIONS_ATTN);
    sh.appendRow([dni, sessionId, timestampISO]);
  } finally {
    lock.releaseLock();
  }

  return {
    registered: true,
    dni,
    session_id: sessionId,
    session_name: ses['Tipo'],
    timestamp: timestampISO
  };
}

/*******************************
 *         HELPERS
 *******************************/
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name, expectedHeaders) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('No existe hoja: ' + name);

  const headers = sh.getRange(1,1,1,sh.getLastColumn())
    .getValues()[0]
    .map(h => String(h).trim());

  const want = expectedHeaders.map(h => h.trim());

  const match = headers.length === want.length &&
                headers.every((h,i) => h === want[i]);

  if (!match)
    throw new Error('Cabeceras inválidas en hoja "'+name+'"');

  return sh;
}

function readSheetAsObjects(name, headers) {
  const sh = getSheet(name, headers);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();

  if (lastRow < 2) return [];

  const values = sh.getRange(2,1,lastRow-1,lastCol).getValues();

  return values.map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = row[i]);
    return obj;
  });
}

function existsAttendee(dni) {
  return readSheetAsObjects(SHEET_ATTENDEES, HDR_ATTENDEES)
    .some(r => String(r['DNI']).trim() === dni);
}

function toNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function csvCell(v) {
  const s = String(v == null ? '' : v);
  if (s.includes('"') || s.includes(',') || s.includes('\n'))
    return '"' + s.replace(/"/g,'""') + '"';
  return s;
}

function parseHour(hhmm) {
  const pm = hhmm.toLowerCase().includes('pm');
  let [h, m] = hhmm.replace(/am|pm/gi,'').trim().split(':').map(Number);
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  return {h,m};
}

function convertDay(diaValue) {
  if (!diaValue) {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth() };
  }
  
  if (diaValue instanceof Date) {
    return { day: diaValue.getDate(), month: diaValue.getMonth() };
  }
  
  const diaStr = String(diaValue).trim();
  if (diaStr.includes('-')) {
    const [day, monStr] = diaStr.split("-");
    const months = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,set:8,oct:9,nov:10,dic:11};
    return { day: Number(day), month: months[monStr.toLowerCase()] };
  }
  
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() };
}

function sessionTimeRange(session) {
  const {day,month} = convertDay(session['Dia']);
  const year = 2025;

  const t1 = parseHour(session['Tiempo Inicio']);
  const t2 = parseHour(session['Tiempo Fin']);

  return {
    start: new Date(year,month,day,t1.h,t1.m),
    end:   new Date(year,month,day,t2.h,t2.m)
  };
}

function overlap(a,b) {
  return a.start < b.end && b.start < a.end;
}

