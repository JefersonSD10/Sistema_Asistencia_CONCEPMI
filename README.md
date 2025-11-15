# Sistema de Registro de Asistencia - CONCEPMI

Sistema web para registro de asistencia a eventos con escaneo de códigos de barras y gestión de ponencias.

## 🚀 Características

-  Registro de asistencia general multi-día con control de kit único
-  Registro en múltiples ponencias con validación de horarios
-  Escaneo de códigos de barras DNI con cámara
-  Validación de ventanas de tiempo para registro en ponencias
-  Control de capacidad y prevención de solapamientos
-  Exportación de datos de asistencia
-  Interfaz responsive y moderna

## 🛠️ Tecnologías

- **Backend**: Python Flask 3.0
- **Frontend**: Bootstrap 5, JavaScript ES6
- **Almacenamiento**: Google Sheets vía Apps Script
- **Escaneo**: ZXing Library
- **Deployment**: Docker

## 📋 Requisitos

- Python 3.12+
- Docker (opcional)
- Google Apps Script configurado
- Navegador moderno con soporte para getUserMedia (cámara)

## 🔧 Instalación

### Usando Docker (Recomendado)

```bash
# Clonar repositorio
git clone <repository-url>
cd Sistema_Asistencia_CONCEPMI

# Configurar variable de entorno (opcional)
# Editar docker-compose.yml con tu URL de AppScript

# Iniciar contenedor
docker compose up --build -d
```

### Instalación Local

```bash
# Clonar repositorio
git clone <repository-url>
cd Sistema_Asistencia_CONCEPMI

# Instalar dependencias con uv
pip install uv
uv sync

# Ejecutar aplicación
uv run flask run --host=0.0.0.0 --port=5000 --debug
```

## ⚙️ Configuración

### Google Apps Script

1. Crea un proyecto en [Google Apps Script](https://script.google.com)
2. Copia el contenido del archivo `APPSCRIPT_VALIDACION_TIEMPO.js`
3. Configura tus hojas de Google Sheets con las siguientes pestañas:
   - **Attendees**: Datos de participantes
   - **Sessions**: Configuración de ponencias
   - **GeneralAttendance**: Registro de asistencia general
   - **SessionAttendance**: Registro por ponencia
4. Despliega como Web App y copia la URL
5. Actualiza `APPSCRIPT_BASE_URL` en `docker-compose.yml` o `.env`

### Variables de Entorno

```bash
FLASK_ENV=development
FLASK_DEBUG=1
APPSCRIPT_BASE_URL=<tu-url-de-appscript>
```

## 📊 Estructura de Google Sheets

### Hoja: Attendees
```
NOMBRES | APELLIDOS | E-MAIL | CELULAR | DNI
```

### Hoja: Sessions
```
ID | Ponente | Tipo | Eje | Cupos totales | Dia | Duracion | Tiempo Inicio | Tiempo Fin | Horas
```

### Hoja: GeneralAttendance
```
Doc. Identidad | Marca de tiempo | Kit Entregado
```

### Hoja: SessionAttendance
```
Doc. Identidad | Sesion ID | Marca de tiempo
```

## 🎯 Casuísticas y Respuestas Esperadas

### 1️⃣ Asistencia General

#### Caso 1.1: Primera vez (Día 1)
**Acción**: Registrar DNI nuevo  
**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Asistencia general registrada exitosamente. Kit entregado",
  "kit_entregado": true
}
```
**UI**: 🎁 Mensaje de éxito con icono de regalo

#### Caso 1.2: Duplicado mismo día
**Acción**: Intentar registrar mismo DNI el mismo día  
**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Ya registró asistencia hoy. Kit entregado anteriormente",
  "kit_entregado": true,
  "already_registered_today": true
}
```
**UI**: ℹ️ Mensaje informativo

#### Caso 1.3: Segundo día (sin kit)
**Acción**: Registrar mismo DNI al día siguiente  
**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Asistencia general registrada exitosamente. Kit ya entregado anteriormente",
  "kit_entregado": false
}
```
**UI**: ✅ Mensaje de éxito, sin icono de regalo

---

### 2️⃣ Registro en Ponencias

#### Caso 2.1: Registro exitoso
**Acción**: Registrar DNI con asistencia general en ponencia dentro de ventana válida  
**Respuesta Esperada**:
```json
{
  "success": true,
  "message": "Registrado exitosamente en CHARLA 3",
  "data": {
    "dni": "12345678",
    "session_id": "sesion_3",
    "session_name": "CHARLA 3"
  }
}
```
**UI**: ✅ Toast de éxito

#### Caso 2.2: Sin asistencia general previa
**Acción**: Intentar registrar en ponencia sin tener asistencia general  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "Debe registrar asistencia general primero"
}
```
**UI**: ❌ Toast de error

#### Caso 2.3: Ya registrado en la ponencia
**Acción**: Intentar registrarse dos veces en la misma ponencia  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "Ya está registrado en CHARLA 3"
}
```
**UI**: ℹ️ Toast informativo

#### Caso 2.4: Sin cupos disponibles
**Acción**: Intentar registrarse en ponencia llena  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "No hay cupos disponibles para CHARLA 3"
}
```
**UI**: 🚫 Toast de advertencia

---

### 3️⃣ Validaciones de Tiempo

#### Caso 3.1: Demasiado pronto (>1 hora antes)
**Acción**: Intentar registrarse más de 1 hora antes del inicio  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "Demasiado pronto para CHARLA 3. Falta 2 hora(s) y 30 minuto(s) para el inicio. Solo puede registrarse hasta 1 hora antes.",
  "too_early": true,
  "hours": 2,
  "minutes": 30
}
```
**UI**: ⏳ Toast de advertencia

#### Caso 3.2: Ventana válida (1 hora antes hasta inicio)
**Acción**: Registrarse entre 1 hora antes y el inicio  
**Respuesta Esperada**: ✅ Registro exitoso (igual que Caso 2.1)

#### Caso 3.3: Durante la sesión (0-15 minutos después)
**Acción**: Registrarse hasta 15 minutos después del inicio  
**Respuesta Esperada**: ✅ Registro exitoso (igual que Caso 2.1)

#### Caso 3.4: Demasiado tarde (>15 minutos después)
**Acción**: Intentar registrarse más de 15 minutos después del inicio  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "Muy tarde para CHARLA 3. La sesión inició hace 20 minuto(s). Solo se permite registro hasta 15 minutos después del inicio.",
  "too_late": true,
  "minutes_late": 20
}
```
**UI**: ⏰ Toast de error

#### Caso 3.5: Sesión finalizada
**Acción**: Intentar registrarse después de la hora de fin  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "La sesión CHARLA 3 ya finalizó"
}
```
**UI**: 🕐 Toast de advertencia

---

### 4️⃣ Validación de Solapamiento

#### Caso 4.1: Sesiones simultáneas
**Acción**: Intentar registrarse en dos sesiones con horarios solapados  
**Respuesta Esperada**:
```json
{
  "success": false,
  "message": "Esta sesión se solapa con CHARLA 2",
  "conflict_with": "sesion_2",
  "conflict_name": "CHARLA 2"
}
```
**UI**: ⏰ Toast de advertencia con mensaje de conflicto

---

## ⏰ Ventana de Registro para Ponencias

```
┌─────────────────────────────────────────────────────────────┐
│                   LÍNEA DE TIEMPO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Más de 1 hora    │  ✅ 1 hora antes  │  ✅ +15 min │  ❌ Después │
│  "Demasiado pronto"  │   VENTANA DE      │  Permitido  │ Finalizada │
│                      │   REGISTRO        │             │            │
└─────────────────────────────────────────────────────────────┘
                       ▲                   ▲             ▲
                    INICIO               +15min        FIN
```

| Momento | ¿Puede registrarse? | Mensaje |
|---------|---------------------|---------|
| Más de 1 hora antes | ❌ No | ⏳ Demasiado pronto |
| 1 hora antes - inicio | ✅ **SÍ** | ✅ Registro exitoso |
| Inicio - +15 min | ✅ **SÍ** | ✅ Registro exitoso |
| Más de +15 min | ❌ No | ⏰ Demasiado tarde |
| Después del fin | ❌ No | 🕐 Sesión finalizada |

---

## 🌐 Endpoints de la API

### Asistencia General

**`GET /api/v1/attendees/search/{dni}`**  
Busca un asistente por DNI

**`POST /api/v1/attendees/general`**  
Registra asistencia general
```json
{
  "dni": "12345678"
}
```

### Ponencias

**`GET /api/v1/sessions`**  
Lista todas las ponencias disponibles

**`GET /api/v1/sessions/capacity`**  
Obtiene capacidad de todas las ponencias

**`POST /api/v1/sessions/register`**  
Registra asistencia en una ponencia
```json
{
  "dni": "12345678",
  "session_id": "sesion_3"
}
```

### Exportación

**`GET /api/v1/attendees/export`**  
Exporta datos de asistentes en CSV/JSON

---

## 🎨 Interfaz de Usuario

### Páginas

- **`/`** - Página principal
- **`/register`** - Registro de asistencia general
- **`/sessions`** - Registro en ponencias
- **`/export`** - Exportación de datos

### Iconos Contextuales

| Icono | Significado |
|-------|-------------|
| 🎁 | Kit entregado |
| ✅ | Operación exitosa |
| ℹ️ | Información |
| ⏳ | Demasiado pronto |
| ⏰ | Conflicto/Demasiado tarde |
| 🚫 | Sin cupos |
| 🕐 | Sesión finalizada |
| ❌ | Error |

---

## 🧪 Testing

Ejecutar pruebas completas:

```bash
python test_completo.py
```

El script prueba:
- ✅ Endpoints de infraestructura
- ✅ Registro general con kit
- ✅ Validaciones de ponencias
- ✅ Validaciones de tiempo
- ✅ Validaciones de capacidad
- ✅ Validaciones de solapamiento

---

## 📁 Estructura del Proyecto

```
Sistema_Asistencia_CONCEPMI/
├── app.py                              # Aplicación Flask principal
├── docker-compose.yml                  # Configuración Docker
├── Dockerfile                          # Imagen Docker
├── pyproject.toml                      # Dependencias Python
├── APPSCRIPT_VALIDACION_TIEMPO.js     # Código de Google Apps Script
├── static/
│   ├── css/
│   │   └── style.css                  # Estilos personalizados
│   └── js/
│       └── main.js                    # JavaScript común
├── templates/
│   ├── base.html                      # Template base
│   ├── index.html                     # Página principal
│   ├── register.html                  # Registro general
│   ├── sessions.html                  # Registro ponencias
│   └── export.html                    # Exportación datos
└── test_completo.py                   # Script de pruebas
```

---

## 🐛 Troubleshooting

### Error: "DNI no encontrado"
- Verificar que el DNI exista en la hoja "Attendees" de Google Sheets
- Asegurarse que el DNI tenga exactamente 8 dígitos

### Error: "Cabeceras inválidas en hoja Sessions"
- Verificar que las columnas de la hoja "Sessions" coincidan exactamente con:
  ```
  ID | Ponente | Tipo | Eje | Cupos totales | Dia | Duracion | Tiempo Inicio | Tiempo Fin | Horas
  ```

### Escaneo de cámara no funciona
- Asegurar que el navegador tenga permisos de cámara
- Usar HTTPS en producción (getUserMedia requiere conexión segura)
- Probar en navegador diferente (Chrome/Firefox recomendados)

### Validaciones de tiempo no funcionan
- Verificar que la columna "Dia" tenga formato correcto (e.g., "15-nov")
- Verificar que "Tiempo Inicio" y "Tiempo Fin" estén en formato 24h (e.g., "14:00")
- Asegurarse de haber actualizado el código de AppScript con `isWithinRegistrationWindow()`

---

## 📝 Licencia

Este proyecto es de uso interno para eventos CONCEPMI.

## 👥 Contribuciones

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
