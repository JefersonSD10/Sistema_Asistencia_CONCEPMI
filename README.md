# Sistema de Registro de Asistencia

Sistema web Flask para gestionar el registro de asistencia mediante escáner de códigos de barras de DNI. Diseñado para eventos con asistencia general y ponencias con cupos limitados.

## Características

- **Registro de Asistencia General**: Escáner de códigos de barras de DNI para registro rápido
- **Gestión de Ponencias**: Control de cupos y validación de asistencia previa
- **Interface Mobile-First**: Optimizado para dispositivos móviles
- **Exportación de Datos**: Descarga de reportes en CSV y JSON
- **Integración con Google Sheets**: Mediante Google Apps Script
- **Docker Support**: Contenedorización completa

## Estructura de Datos

### Google Sheet Principal "Asistentes"
- **DNI**: Documento de identidad (8 dígitos)
- **Nombre**: Nombre completo del participante
- **Asistencia General**: Estado del registro general (TRUE/FALSE)
- **[session_ids]**: Columnas dinámicas para cada ponencia (TRUE/FALSE)

Ejemplo:
```
| DNI      | Nombre      | Asistencia General | session_id_1 | ponencia_tech | workshop_liderazgo |
|----------|-------------|-------------------|--------------|---------------|--------------------|
| 12345678 | Juan Pérez  | TRUE              | FALSE        | TRUE          | FALSE              |
```

### Google Sheet "Ponencias"  
- **ID**: Identificador único de la ponencia (usado como nombre de columna)
- **Nombre**: Nombre descriptivo de la ponencia
- **Descripción**: Descripción opcional de la ponencia  
- **Cupos Totales**: Capacidad máxima de la ponencia

Ejemplo:
```
| ID                | Nombre                           | Descripción                      | Cupos Totales |
|-------------------|----------------------------------|----------------------------------|---------------|
| session_id_1      | Conferencia de Marketing Digital | Estrategias modernas             | 50            |
| ponencia_tech     | Innovaciones Tecnológicas 2025  | Tendencias y avances             | 30            |
| workshop_liderazgo| Workshop de Liderazgo           |                                  | 60            |
```

**Ventajas del Sistema Dinámico**:
- Soporte para N ponencias (no limitado a 3)
- Fácil agregar/quitar ponencias sin cambiar código
- Nombres descriptivos para cada ponencia
- Capacidades individuales por ponencia

## Requisitos

- Python 3.12+
- Docker y Docker Compose
- UV (para gestión de dependencias)
- Google Apps Script configurado

## Instalación

### Con Docker (Recomendado)

1. Clona el repositorio:
```bash
git clone <repository-url>
cd registro-asistencia
```

2. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tu APPSCRIPT_BASE_URL
```

3. Construye y ejecuta con Docker Compose:
```bash
docker-compose up --build
```

4. Accede a la aplicación en `http://localhost:5000`

### Instalación Local

1. Instala UV:
```bash
pip install uv
```

2. Instala dependencias:
```bash
uv sync
```

3. Configura variables de entorno:
```bash
export APPSCRIPT_BASE_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
export FLASK_ENV=development
```

4. Ejecuta la aplicación:
```bash
uv run flask run --debug
```

## Configuración de Google Apps Script

El sistema requiere endpoints de Google Apps Script para funcionar. Los endpoints esperados son:

### GET Endpoints

- `?action=getAttendeeByDNI&dni={dni}`: Buscar participante por DNI
- `?action=getSessionsList`: Obtener lista de ponencias disponibles
- `?action=getSessionsCapacity`: Obtener capacidad de ponencias
- `?action=exportAttendeesData`: Exportar datos de asistentes

### POST Endpoints

- `action=registerGeneralAttendance`: Registrar asistencia general
- `action=registerSessionAttendance`: Registrar en ponencia (usa `session_id`)

## API Endpoints

### Lista de Ponencias Disponibles
```
GET /api/v1/sessions
```

### Búsqueda de Asistentes
```
GET /api/v1/attendees/search/{dni}
```

### Registro de Asistencia General
```
POST /api/v1/attendees/general
Body: {"dni": "12345678"}
```

### Consulta de Capacidad de Ponencias
```
GET /api/v1/sessions/capacity
```

### Registro en Ponencias
```
POST /api/v1/sessions/register  
Body: {"dni": "12345678", "session_id": "session_id_1"}
```

### Exportación de Datos
```
GET /api/v1/attendees/export
```

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
```
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
```

### Scripts de Desarrollo

```bash
# Ejecutar en modo desarrollo
uv run flask run --debug

# Instalar nuevas dependencias
uv add package-name

# Ejecutar tests (cuando se implementen)
uv run pytest

# Formatear código
uv run black .
```

## Tecnologías Utilizadas

- **Backend**: Flask, Python 3.11
- **Frontend**: Bootstrap 5, Vanilla JavaScript
- **Scanner**: QuaggaJS para códigos de barras
- **Containerización**: Docker, Docker Compose
- **Gestión de Paquetes**: UV
- **Storage**: Google Sheets via Apps Script

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
