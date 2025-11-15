// ============================================
// CÓDIGO PARA AGREGAR A TU GOOGLE APPS SCRIPT
// ============================================
//
// INSTRUCCIONES:
// 1. Copia esta función y pégala ANTES de la función registerSessionAttendance
// 2. Luego REEMPLAZA tu función registerSessionAttendance con la que está más abajo

// ============================================
// FUNCIÓN NUEVA: isWithinRegistrationWindow
// ============================================

function isWithinRegistrationWindow(session) {
  // Obtener fecha/hora de la sesión
  const {day, month} = convertDay(session['Dia']);
  const year = 2025;
  const startTime = parseHour(session['Tiempo Inicio']);
  
  // Crear fecha/hora de inicio de la sesión
  const sessionStart = new Date(year, month, day, startTime.h, startTime.m);
  
  // Obtener hora actual
  const now = new Date();
  
  // Calcular diferencia en milisegundos
  const diffMs = sessionStart.getTime() - now.getTime();
  
  // Convertir a minutos
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Si ya pasó la hora de inicio (diferencia negativa)
  if (diffMinutes < 0) {
    // La sesión ya comenzó
    const minutesSinceStart = Math.abs(diffMinutes);
    
    // Solo permitir hasta 15 minutos después del inicio
    if (minutesSinceStart <= 15) {
      return { allowed: true };
    } else {
      // Ya pasó más de 15 minutos desde el inicio
      const endTime = parseHour(session['Tiempo Fin']);
      const sessionEnd = new Date(year, month, day, endTime.h, endTime.m);
      
      // Verificar si la sesión ya finalizó
      if (now > sessionEnd) {
        return { 
          allowed: false, 
          reason: 'session_ended',
          message: 'La sesión ya finalizó'
        };
      } else {
        // La sesión aún está en curso pero ya pasaron más de 15 min
        return {
          allowed: false,
          reason: 'too_late',
          minutes_late: minutesSinceStart,
          message: `Ya es muy tarde para registrarse. La sesión inició hace ${minutesSinceStart} minuto(s). Solo se permite registro hasta 15 minutos después del inicio.`
        };
      }
    }
  }
  
  // Si falta más de 60 minutos (1 hora), no permitir
  if (diffMinutes > 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return {
      allowed: false,
      reason: 'too_early',
      minutes_remaining: diffMinutes,
      hours: hours,
      minutes: minutes,
      message: `Falta ${hours > 0 ? hours + ' hora(s) y ' : ''}${minutes} minuto(s) para el inicio. Solo puede registrarse hasta 1 hora antes.`
    };
  }
  
  // Dentro de la ventana de 1 hora antes hasta el inicio
  return { allowed: true };
}


// ============================================
// FUNCIÓN MODIFICADA: registerSessionAttendance
// (REEMPLAZA tu función actual con esta)
// ============================================

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

  // ⭐ NUEVA VALIDACIÓN: Verificar ventana de registro
  const registrationCheck = isWithinRegistrationWindow(ses);
  if (!registrationCheck.allowed) {
    return {
      too_early: registrationCheck.reason === 'too_early',
      session_ended: registrationCheck.reason === 'session_ended',
      session_id: sessionId,
      session_name: ses['Tipo'],
      minutes_remaining: registrationCheck.minutes_remaining,
      hours: registrationCheck.hours,
      minutes: registrationCheck.minutes,
      message: registrationCheck.message
    };
  }

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

  // 🚫 Verificar solapamiento de horarios
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

// ============================================
// FIN DEL CÓDIGO
// ============================================

