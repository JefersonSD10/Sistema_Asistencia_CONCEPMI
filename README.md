# Sistema de Registro de Asistencia

Sistema web Flask para gestionar el registro de asistencia mediante escáner de códigos de barras de DNI. Diseñado para eventos con asistencia general y ponencias con cupos limitados.

## Características

- *Registro de Asistencia General*: Escáner de códigos de barras de DNI para registro rápido
- *Gestión de Ponencias*: Control de cupos y validación de asistencia previa
- *Interface Mobile-First*: Optimizado para dispositivos móviles
- *Exportación de Datos*: Descarga de reportes en CSV y JSON
- *Integración con Google Sheets*: Mediante Google Apps Script
- *Docker Support*: Contenedorización completa

## Estructura de Datos

### Google Sheet Principal "Asistentes"
- *DNI*: Documento de identidad (8 dígitos)
- *Nombre*: Nombre completo del participante
- *Asistencia General*: Estado del registro general (TRUE/FALSE)
- *[session_ids]*: Columnas dinámicas para cada ponencia (TRUE/FALSE)

Ejemplo:

| DNI      | Nombre      | Asistencia General | session_id_1 | ponencia_tech | workshop_liderazgo |
|----------|-------------|-------------------|--------------|---------------|--------------------|
| 12345678 | Juan Pérez  | TRUE              | FALSE        | TRUE          | FALSE              |


### Google Sheet "Ponencias"  
- *ID*: Identificador único de la ponencia (usado como nombre de columna)
- *Nombre*: Nombre descriptivo de la ponencia
- *Descripción*: Descripción opcional de la ponencia  
- *Cupos Totales*: Capacidad máxima de la ponencia

Ejemplo:

| ID                | Nombre                           | Descripción                      | Cupos Totales |
|-------------------|----------------------------------|----------------------------------|---------------|
| session_id_1      | Conferencia de Marketing Digital | Estrategias modernas             | 50            |
| ponencia_tech     | Innovaciones Tecnológicas 2025  | Tendencias y avances             | 30            |
| workshop_liderazgo| Workshop de Liderazgo           |                                  | 60            |


*Ventajas del Sistema Dinámico*:
- Soporte para N ponencias (no limitado a 3)
- Fácil agregar/quitar ponencias sin cambiar código
- Nombres descriptivos para cada ponencia
- Capacidades individuales por ponencia

## Estructura de Google Sheets (Detallada)

El sistema requiere *2 hojas* en el Google Sheets con estructuras específicas:

### 📊 *Hoja 1: "Asistentes"* (Datos principales)

*Columnas obligatorias*:
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| DNI | Texto | Documento de identidad (8 dígitos) | 12345678 |
| Nombre | Texto | Nombre completo del participante | Juan Pérez |
| Asistencia General | Boolean | Registro de asistencia general | TRUE / FALSE |

*Columnas dinámicas* (una por cada ponencia):
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| {session_id} | Boolean | Registro en ponencia específica | TRUE / FALSE |

*Ejemplo completo*:

┌──────────┬─────────────┬──────────────────┬──────────────┬─────────────────┬────────────────────┐
│ DNI      │ Nombre      │ Asistencia       │ session_id_1 │ ponencia_tech   │ workshop_liderazgo │
│          │             │ General          │              │                 │                    │
├──────────┼─────────────┼──────────────────┼──────────────┼─────────────────┼────────────────────┤
│ 12345678 │ Juan Pérez  │ TRUE             │ FALSE        │ TRUE            │ FALSE              │
│ 87654321 │ María García│ TRUE             │ TRUE         │ FALSE           │ TRUE               │
│ 11223344 │ Carlos López│ FALSE            │ FALSE        │ FALSE           │ FALSE              │
└──────────┴─────────────┴──────────────────┴──────────────┴─────────────────┴────────────────────┘


### 📋 *Hoja 2: "Ponencias"* (Configuración de eventos)

*Columnas obligatorias*:
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| ID | Texto | Identificador único (usado como nombre de columna en hoja Asistentes) | session_id_1 |
| Nombre | Texto | Nombre descriptivo de la ponencia | Conferencia de Marketing Digital |
| Descripción | Texto | Descripción opcional | Estrategias modernas de marketing |
| Cupos Totales | Número | Capacidad máxima de la ponencia | 50 |

*Ejemplo completo*:

┌────────────────────┬─────────────────────────────────┬────────────────────────────┬───────────────┐
│ ID                 │ Nombre                          │ Descripción                │ Cupos Totales │
├────────────────────┼─────────────────────────────────┼────────────────────────────┼───────────────┤
│ session_id_1       │ Conferencia de Marketing Digital│ Estrategias modernas       │ 50            │
│ ponencia_tech      │ Innovaciones Tecnológicas 2025 │ Tendencias y avances       │ 30            │
│ workshop_liderazgo │ Workshop de Liderazgo          │ Desarrollo de habilidades  │ 60            │
│ charla_ia          │ Inteligencia Artificial Práctica│ Aplicaciones reales de IA  │ 40            │
└────────────────────┴─────────────────────────────────┴────────────────────────────┴───────────────┘


### 🔗 *Relación entre las hojas*:

1. *Los IDs de la hoja "Ponencias"* se convierten en *nombres de columnas* en la hoja "Asistentes"
2. *Cada vez que agregas una ponencia* nueva en la hoja "Ponencias", el sistema automáticamente la detecta
3. *Las columnas dinámicas* se crean automáticamente según las ponencias configuradas

### ⚠ *Reglas importantes*:

- *IDs únicos*: Cada ponencia debe tener un ID único en la hoja "Ponencias"
- *Sin espacios en IDs*: Usar session_id_1 en lugar de session id 1
- *Columnas exactas*: Los nombres de columnas deben coincidir exactamente
- *Tipos de datos*: Respetar los tipos (TRUE/FALSE para booleans, números para cupos)
- *Orden flexible*: El orden de las ponencias no importa, el sistema se adapta automáticamente

## Requisitos

- Python 3.12+
- Docker y Docker Compose
- UV (para gestión de dependencias)
- Google Apps Script configurado

## Instalación

### Con Docker (Recomendado)

1. Clona el repositorio:
bash
git clone <repository-url>
cd registro-asistencia


2. Configura las variables de entorno:
bash
cp .env.example .env
# Edita .env con tu APPSCRIPT_BASE_URL


3. Construye y ejecuta con Docker Compose:
bash
docker-compose up --build


4. Accede a la aplicación en http://localhost:5000

### Instalación Local

1. Instala UV:
bash
pip install uv


2. Instala dependencias:
bash
uv sync


3. Configura variables de entorno:
bash
export APPSCRIPT_BASE_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
export FLASK_ENV=development


4. Ejecuta la aplicación:
bash
uv run flask run --debug


## Configuración de Google Apps Script

El sistema requiere *6 endpoints* de Google Apps Script para funcionar:

### 📥 *GET Endpoints* (4 endpoints)

#### 1. Buscar Participante por DNI

GET ?action=getAttendeeByDNI&dni={dni}

*Input*: dni (8 dígitos)
*Output*:
json
{
  "dni": "12345678",
  "nombre": "Juan Pérez", 
  "asistencia_general": true,
  "session_id_1": false,
  "ponencia_tech": true
}


#### 2. Lista de Ponencias Disponibles

GET ?action=getSessionsList

*Input*: Ninguno
*Output*:
json
[
  {
    "id": "session_id_1",
    "name": "Conferencia de Marketing Digital",
    "description": "Estrategias modernas"
  }
]


#### 3. Capacidad de Ponencias

GET ?action=getSessionsCapacity

*Input*: Ninguno
*Output*:
json
{
  "session_id_1": {
    "available": 25,
    "total": 50,
    "name": "Conferencia de Marketing Digital"
  }
}


#### 4. Exportar Datos de Asistentes

GET ?action=exportAttendeesData

*Input*: Ninguno
*Output*:
json
{
  "csv_data": "DNI,Nombre,Asistencia General,Conferencia...\n12345678,Juan Pérez,Sí,No..."
}


### 📤 *POST Endpoints* (2 endpoints)

#### 5. Registrar Asistencia General

POST {APPSCRIPT_URL}

*Input*:
json
{
  "action": "registerGeneralAttendance",
  "dni": "12345678",
  "timestamp": "2025-01-20T10:30:00.000Z"
}

*Output*:
json
{
  "registered": true,
  "dni": "12345678",
  "timestamp": "2025-01-20T10:30:00.000Z"
}


#### 6. Registrar en Ponencia

POST {APPSCRIPT_URL}

*Input*:
json
{
  "action": "registerSessionAttendance",
  "dni": "12345678",
  "session_id": "session_id_1",
  "timestamp": "2025-01-20T14:30:00.000Z"
}

*Output*:
json
{
  "registered": true,
  "dni": "12345678",
  "session_id": "session_id_1",
  "session_name": "Conferencia de Marketing Digital"
}


### 🔧 *Validaciones requeridas en Apps Script*:

- *getAttendeeByDNI*: Verificar DNI existe en hoja "Asistentes"
- *getSessionsList*: Leer hoja "Ponencias" y retornar todas las filas
- *getSessionsCapacity*: Calcular cupos disponibles (total - registrados)
- *registerGeneralAttendance*: Validar DNI y marcar TRUE en "Asistencia General"
- *registerSessionAttendance*: Validar asistencia general previa + cupos disponibles
- *exportAttendeesData*: Generar CSV con todas las columnas dinámicamente

## API Endpoints

### 1. Lista de Ponencias Disponibles

GET /api/v1/sessions

*Input*: Ninguno
*Output*:
json
{
  "success": true,
  "data": [
    {
      "id": "session_id_1",
      "name": "Conferencia de Marketing Digital",
      "description": "Estrategias modernas"
    }
  ],
  "message": "Lista de ponencias obtenida exitosamente"
}


### 2. Búsqueda de Asistentes

GET /api/v1/attendees/search/{dni}

*Input*: DNI de 8 dígitos en la URL
*Output*:
json
{
  "success": true,
  "data": {
    "dni": "12345678",
    "nombre": "Juan Pérez",
    "asistencia_general": true,
    "session_id_1": false,
    "ponencia_tech": true
  },
  "message": "Asistente encontrado"
}


### 3. Registro de Asistencia General

POST /api/v1/attendees/general

*Input*:
json
{"dni": "12345678"}

*Output*:
json
{
  "success": true,
  "message": "Asistencia general registrada exitosamente",
  "data": {
    "dni": "12345678",
    "registered_at": "2025-01-20T10:30:00"
  }
}


### 4. Consulta de Capacidad de Ponencias

GET /api/v1/sessions/capacity

*Input*: Ninguno
*Output*:
json
{
  "success": true,
  "data": {
    "session_id_1": {
      "available": 25,
      "total": 50,
      "name": "Conferencia de Marketing Digital"
    }
  },
  "message": "Capacidad de ponencias obtenida exitosamente"
}


### 5. Registro en Ponencias

POST /api/v1/sessions/register

*Input*:
json
{"dni": "12345678", "session_id": "session_id_1"}

*Output*:
json
{
  "success": true,
  "message": "Registrado exitosamente en Conferencia de Marketing Digital",
  "data": {
    "dni": "12345678",
    "session_id": "session_id_1",
    "session_name": "Conferencia de Marketing Digital"
  }
}


### 6. Exportación de Datos

GET /api/v1/attendees/export

*Input*: Ninguno
*Output*: Archivo CSV o JSON con todos los datos de asistencia

## Uso

### 1. Registro de Asistencia General

1. Navega a la sección "Registro"
2. Escanea el código de barras del DNI o ingresa manualmente
3. Verifica la información del participante
4. Confirma el registro

### 2. Registro a Ponencias

1. Navega a la sección "Ponencias"
2. Escanea el DNI del participante
3. Selecciona la ponencia deseada
4. El sistema valida automáticamente:
   - Asistencia general previa
   - Disponibilidad de cupos
   - Estado previo de registro

### 3. Exportación de Datos

1. Navega a la sección "Exportar"
2. Selecciona el formato deseado (CSV/JSON)
3. Descarga el archivo generado

## Desarrollo

### Estructura del Proyecto

registro-asistencia/
├── app.py                 # Aplicación Flask principal
├── templates/             # Templates HTML
│   ├── base.html         # Template base
│   ├── index.html        # Página principal
│   ├── register.html     # Registro general
│   ├── sessions.html     # Ponencias
│   └── export.html       # Exportación
├── static/               # Archivos estáticos
│   ├── css/
│   │   └── style.css     # Estilos CSS
│   └── js/
│       └── main.js       # JavaScript principal
├── pyproject.toml        # Configuración UV
├── Dockerfile            # Configuración Docker
└── docker-compose.yml    # Docker Compose


### Scripts de Desarrollo

bash
# Ejecutar en modo desarrollo
uv run flask run --debug

# Instalar nuevas dependencias
uv add package-name

# Ejecutar tests (cuando se implementen)
uv run pytest

# Formatear código
uv run black .


## Tecnologías Utilizadas

- *Backend*: Flask, Python 3.11
- *Frontend*: Bootstrap 5, Vanilla JavaScript
- *Scanner*: QuaggaJS para códigos de barras
- *Containerización*: Docker, Docker Compose
- *Gestión de Paquetes*: UV
- *Storage*: Google Sheets via Apps Script

## Características de Seguridad

- Validación de entrada de DNI
- CORS habilitado para desarrollo
- Manejo de errores robusto
- Validación de estado de red
- Almacenamiento local para cache

## Próximas Mejoras

- [ ] Autenticación de usuarios
- [ ] Panel de administración
- [ ] Reportes avanzados
- [ ] Notificaciones push
- [ ] Cache Redis
- [ ] Tests automatizados
- [ ] Logging avanzado

## Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo.

## Licencia

Este proyecto es de uso interno organizacional.