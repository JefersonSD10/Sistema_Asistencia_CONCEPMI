# API Endpoints - Sistema de Registro de Asistencia

## Resumen

Este documento especifica todos los endpoints de la API del Sistema de Registro de Asistencia, incluyendo los endpoints del frontend Flask y los endpoints esperados de Google Apps Script.

## Endpoints Flask (Frontend)

### 1. Búsqueda de Asistente

**Endpoint**: `GET /api/v1/attendees/search/{dni}`

**Descripción**: Busca un asistente por su DNI en la base de datos.

**Parámetros de Ruta**:
- `dni` (string): DNI del asistente (8 dígitos)

**Input**: Ninguno (DNI en URL)

**Output**:
```json
{
  "success": boolean,
  "data": {
    "dni": "12345678",
    "nombre": "Juan Pérez",
    "asistencia_general": true,
    "session_id_1": false,
    "session_id_2": true,
    "ponencia_marketing": false,
    "conferencia_tech": true
  },
  "message": "Asistente encontrado"
}
```

**Nota**: Los campos de sesión son dinámicos y dependen de las ponencias configuradas en Google Sheets.

**Códigos de Estado**:
- `200`: Éxito
- `500`: Error interno del servidor

---

### 2. Registro de Asistencia General

**Endpoint**: `POST /api/v1/attendees/general`

**Descripción**: Registra la asistencia general de un participante.

**Input**:
```json
{
  "dni": "12345678"
}
```

**Output**:
```json
{
  "success": true,
  "message": "Asistencia general registrada exitosamente. Kit entregado",
  "data": {
    "dni": "12345678",
    "timestamp": "2025-01-20T10:30:00",
    "registered": true,
    "kit_entregado": true
  },
  "kit_entregado": true
}
```

**Nota**: El campo `kit_entregado` indica si se entregó el kit de bienvenida al participante durante el registro.

**Códigos de Estado**:
- `200`: Registro exitoso
- `400`: DNI inválido o faltante
- `500`: Error interno del servidor

---

### 3. Lista de Ponencias Disponibles

**Endpoint**: `GET /api/v1/sessions`

**Descripción**: Obtiene la lista de todas las ponencias disponibles configuradas en el sistema.

**Input**: Ninguno

**Output**:
```json
{
  "success": true,
  "data": [
    {
      "id": "session_id_1",
      "name": "Conferencia de Marketing Digital",
      "description": "Estrategias modernas de marketing digital"
    },
    {
      "id": "ponencia_tech",
      "name": "Innovaciones Tecnológicas 2025",
      "description": "Tendencias y avances tecnológicos"
    },
    {
      "id": "workshop_liderazgo",
      "name": "Workshop de Liderazgo"
    }
  ],
  "message": "Lista de ponencias obtenida exitosamente"
}
```

**Códigos de Estado**:
- `200`: Éxito
- `500`: Error interno del servidor

---

### 4. Consulta de Capacidad de Ponencias

**Endpoint**: `GET /api/v1/sessions/capacity`

**Descripción**: Obtiene la capacidad y cupos disponibles de todas las ponencias.

**Input**: Ninguno

**Output**:
```json
{
  "success": true,
  "data": {
    "session_id_1": {
      "available": 25,
      "total": 50,
      "name": "Conferencia de Marketing Digital"
    },
    "ponencia_tech": {
      "available": 10,
      "total": 30,
      "name": "Innovaciones Tecnológicas 2025"
    },
    "workshop_liderazgo": {
      "available": 40,
      "total": 60,
      "name": "Workshop de Liderazgo"
    }
  },
  "message": "Capacidad de ponencias obtenida exitosamente"
}
```

**Nota**: Las claves del objeto `data` corresponden a los IDs de las sesiones configuradas dinámicamente en Google Sheets.

**Códigos de Estado**:
- `200`: Éxito
- `500`: Error interno del servidor

---

### 5. Registro en Ponencias

**Endpoint**: `POST /api/v1/sessions/register`

**Descripción**: Registra a un asistente en una ponencia específica.

**Input**:
```json
{
  "dni": "12345678",
  "session_id": "session_id_1"
}
```

**Validaciones**:
- `dni`: Requerido, 8 dígitos
- `session_id`: Requerido, debe ser un ID válido de ponencia existente

**Output Exitoso**:
```json
{
  "success": true,
  "message": "Registrado exitosamente en Conferencia de Marketing Digital",
  "data": {
    "dni": "12345678",
    "session_id": "session_id_1",
    "session_name": "Conferencia de Marketing Digital",
    "registered_at": "2025-01-20T14:30:00",
    "cupos_restantes": 24
  }
}
```

**Output Error - Sin Asistencia General**:
```json
{
  "success": false,
  "message": "Debe registrar asistencia general primero"
}
```

**Output Error - Sin Cupos**:
```json
{
  "success": false,
  "message": "No hay cupos disponibles para Conferencia de Marketing Digital"
}
```

**Output Error - Ya Registrado**:
```json
{
  "success": false,
  "message": "Ya está registrado en Conferencia de Marketing Digital"
}
```

**Output Error - Conflicto de Horario (Nuevo)**:
```json
{
  "success": false,
  "message": "Esta sesión se solapa con Innovaciones Tecnológicas 2025",
  "conflict_with": "ponencia_tech",
  "conflict_name": "Innovaciones Tecnológicas 2025"
}
```

**Nota sobre Conflictos de Horario**: El sistema valida que un participante no pueda inscribirse en dos sesiones que se realicen al mismo tiempo. Si intenta registrarse en una sesión que se solapa con otra en la que ya está inscrito, recibirá este error.

**Códigos de Estado**:
- `200`: Éxito o error controlado
- `400`: Parámetros inválidos
- `500`: Error interno del servidor

---

### 6. Exportación de Datos

**Endpoint**: `GET /api/v1/attendees/export`

**Descripción**: Exporta todos los datos de asistencia con columnas dinámicas según las ponencias configuradas.

**Input**: Ninguno

**Output CSV** (Content-Type: text/csv):
```
DNI,Nombre,Asistencia General,Conferencia de Marketing Digital,Innovaciones Tecnológicas 2025,Workshop de Liderazgo
12345678,Juan Pérez,Sí,No,Sí,No
87654321,María García,Sí,Sí,No,Sí
```

**Output JSON**:
```json
{
  "success": true,
  "data": [
    {
      "dni": "12345678",
      "nombre": "Juan Pérez",
      "asistencia_general": true,
      "session_id_1": false,
      "ponencia_tech": true,
      "workshop_liderazgo": false
    },
    {
      "dni": "87654321",
      "nombre": "María García",
      "asistencia_general": true,
      "session_id_1": true,
      "ponencia_tech": false,
      "workshop_liderazgo": true
    }
  ],
  "message": "Datos exportados exitosamente"
}
```

**Nota**: Las columnas de sesión se generan dinámicamente basado en las ponencias configuradas en Google Sheets.

**Códigos de Estado**:
- `200`: Éxito
- `500`: Error interno del servidor

---

## Endpoints Google Apps Script (Backend)

Estos son los endpoints que debe implementar Google Apps Script para que el sistema funcione correctamente.

### 1. Buscar Asistente por DNI

**URL**: `{APPSCRIPT_BASE_URL}?action=getAttendeeByDNI&dni={dni}`
**Método**: GET

**Parámetros**:
- `action`: "getAttendeeByDNI"
- `dni`: DNI del asistente (8 dígitos)

**Respuesta Esperada**:
```json
{
  "dni": "12345678",
  "nombre": "Juan Pérez",
  "asistencia_general": true,
  "session_id_1": false,
  "ponencia_tech": true,
  "workshop_liderazgo": false
}
```

**Nota**: Los campos de sesión deben corresponder exactamente con los IDs configurados en la hoja de ponencias.

---

### 2. Obtener Lista de Ponencias

**URL**: `{APPSCRIPT_BASE_URL}?action=getSessionsList`
**Método**: GET

**Parámetros**:
- `action`: "getSessionsList"

**Respuesta Esperada**:
```json
[
  {
    "id": "session_id_1",
    "name": "Conferencia de Marketing Digital",
    "description": "Estrategias modernas de marketing digital"
  },
  {
    "id": "ponencia_tech",
    "name": "Innovaciones Tecnológicas 2025",
    "description": "Tendencias y avances tecnológicos"
  },
  {
    "id": "workshop_liderazgo",
    "name": "Workshop de Liderazgo"
  }
]
```

**Implementación Sugerida**: Lee la hoja "ponencias" y retorna los datos configurados.

---

### 3. Obtener Capacidad de Ponencias

**URL**: `{APPSCRIPT_BASE_URL}?action=getSessionsCapacity`
**Método**: GET

**Parámetros**:
- `action`: "getSessionsCapacity"

**Respuesta Esperada**:
```json
{
  "session_id_1": {
    "available": 25,
    "total": 50,
    "name": "Conferencia de Marketing Digital"
  },
  "ponencia_tech": {
    "available": 10,
    "total": 30,
    "name": "Innovaciones Tecnológicas 2025"
  },
  "workshop_liderazgo": {
    "available": 40,
    "total": 60,
    "name": "Workshop de Liderazgo"
  }
}
```

**Implementación Sugerida**: Combina datos de la hoja "ponencias" (capacidad total) con conteo de registros actuales.

---

### 4. Registrar Asistencia General

**URL**: `{APPSCRIPT_BASE_URL}`
**Método**: POST

**Body**:
```json
{
  "action": "registerGeneralAttendance",
  "dni": "12345678",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

**Respuesta Esperada**:
```json
{
  "registered": true,
  "dni": "12345678",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

---

### 5. Registrar Asistencia a Ponencia

**URL**: `{APPSCRIPT_BASE_URL}`
**Método**: POST

**Body**:
```json
{
  "action": "registerSessionAttendance",
  "dni": "12345678",
  "session_id": "session_id_1",
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

**Respuesta Exitosa**:
```json
{
  "registered": true,
  "dni": "12345678",
  "session_id": "session_id_1",
  "session_name": "Conferencia de Marketing Digital",
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

**Respuesta - Ya Registrado**:
```json
{
  "already_registered": true,
  "dni": "12345678",
  "session_id": "session_id_1",
  "session_name": "Conferencia de Marketing Digital"
}
```

**Respuesta - Sin Asistencia General**:
```json
{
  "no_general_attendance": true,
  "dni": "12345678"
}
```

**Respuesta - Sin Cupos**:
```json
{
  "no_capacity": true,
  "session_id": "session_id_1",
  "session_name": "Conferencia de Marketing Digital",
  "available_capacity": 0
}
```

---

### 6. Exportar Datos de Asistentes

**URL**: `{APPSCRIPT_BASE_URL}?action=exportAttendeesData`
**Método**: GET

**Parámetros**:
- `action`: "exportAttendeesData"

**Respuesta CSV**:
```json
{
  "csv_data": "DNI,Nombre,Asistencia General,Conferencia de Marketing Digital,Innovaciones Tecnológicas 2025,Workshop de Liderazgo\n12345678,Juan Pérez,Sí,No,Sí,No\n87654321,María García,Sí,Sí,No,Sí"
}
```

**Respuesta JSON**:
```json
{
  "data": [
    {
      "dni": "12345678",
      "nombre": "Juan Pérez",
      "asistencia_general": true,
      "session_id_1": false,
      "ponencia_tech": true,
      "workshop_liderazgo": false
    },
    {
      "dni": "87654321",
      "nombre": "María García",
      "asistencia_general": true,
      "session_id_1": true,
      "ponencia_tech": false,
      "workshop_liderazgo": true
    }
  ]
}
```

**Implementación Sugerida**: Genera las columnas dinámicamente basado en las ponencias configuradas en la hoja "ponencias".

---

## Estructura de Google Sheets

### Hoja Principal "Asistentes"
Esta hoja contiene los datos de los participantes con columnas dinámicas:

```
| DNI      | Nombre      | Asistencia General | session_id_1 | ponencia_tech | workshop_liderazgo |
|----------|-------------|-------------------|--------------|---------------|--------------------|
| 12345678 | Juan Pérez  | TRUE              | FALSE        | TRUE          | FALSE              |
| 87654321 | María García| TRUE              | TRUE         | FALSE         | TRUE               |
```

**Columnas Fijas**:
- `DNI`: Documento de identidad (8 dígitos)
- `Nombre`: Nombre completo del participante  
- `Asistencia General`: Boolean para registro general

**Columnas Dinámicas**:
- Una columna por cada ponencia usando su `session_id`
- Valores: TRUE/FALSE para indicar registro

### Hoja "Ponencias"
Esta hoja define las ponencias disponibles y sus capacidades:

```
| ID                | Nombre                           | Descripción                      | Cupos Totales |
|-------------------|----------------------------------|----------------------------------|---------------|
| session_id_1      | Conferencia de Marketing Digital | Estrategias modernas             | 50            |
| ponencia_tech     | Innovaciones Tecnológicas 2025  | Tendencias y avances             | 30            |
| workshop_liderazgo| Workshop de Liderazgo           |                                  | 60            |
```

**Columnas**:
- `ID`: Identificador único usado en el sistema (corresponde a nombres de columnas en hoja principal)
- `Nombre`: Nombre descriptivo de la ponencia
- `Descripción`: Descripción opcional
- `Cupos Totales`: Capacidad máxima de la ponencia

---

## Manejo de Errores

Todos los endpoints deben manejar errores de la siguiente manera:

### Errores de Apps Script
```json
{
  "error": "Descripción del error específico"
}
```

### Errores del Frontend Flask
```json
{
  "success": false,
  "message": "Mensaje de error para el usuario",
  "error": "Detalles técnicos del error (opcional)"
}
```

---

## Configuración de URLs

### URL Base de Apps Script
La URL base debe configurarse en la variable de entorno:
```
APPSCRIPT_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### URLs del Frontend Flask
- Desarrollo: `http://localhost:5000`
- Producción: Configurar según el dominio

---

## Consideraciones de Seguridad

1. **Validación de DNI**: Siempre validar formato (8 dígitos numéricos)
2. **Rate Limiting**: Considerar implementar límites de frecuencia
3. **CORS**: Configurar correctamente para producción
4. **HTTPS**: Usar conexiones seguras en producción
5. **Autenticación**: Considerar implementar para funciones administrativas

---

## Testing

### Casos de Prueba Recomendados

1. **Búsqueda de Asistente**:
   - DNI existente
   - DNI inexistente
   - DNI con formato inválido

2. **Registro General**:
   - Primer registro
   - Registro duplicado
   - DNI inválido

3. **Registro en Ponencias**:
   - Con asistencia general previa
   - Sin asistencia general
   - Sin cupos disponibles
   - Ya registrado en la ponencia

4. **Exportación**:
   - Con datos
   - Sin datos
   - Diferentes formatos

---

Este documento debe mantenerse actualizado conforme evolucione la API.
