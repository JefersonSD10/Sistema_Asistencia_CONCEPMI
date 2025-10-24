from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import io

# Load environment variables
load_dotenv()

app = Flask(_name_)
CORS(app)

# Configuration
APPSCRIPT_BASE_URL = os.getenv('APPSCRIPT_BASE_URL', 'https://script.google.com/macros/s/AKfycbzRdrkrLLfbNq-dOjphGljbJoalvEbk_sM1D7XtmlKntWZ0jiVS1xfU6axM5jxEwdJs/exec')

class AppScriptAPI:
    """Clase para manejar las llamadas a Google Apps Script"""
    
    def _init_(self, base_url):
        self.base_url = base_url
    
    def get_attendee_by_dni(self, dni):
        """Buscar asistente por DNI"""
        try:
            url = f"{self.base_url}?action=getAttendeeByDNI&dni={dni}"
            print(f"[DEBUG] Buscando DNI: {dni}")
            print(f"[DEBUG] URL completa: {url}")
            response = requests.get(url, timeout=10)
            print(f"[DEBUG] Status: {response.status_code}")
            print(f"[DEBUG] Respuesta completa: {response.text}")
            if response.status_code == 200:
                data = response.json()
                print(f"[DEBUG] JSON parseado: {data}")
                return data
            else:
                print(f"[ERROR] HTTP error: {response.status_code}")
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            print(f"[ERROR] Exception en get_attendee_by_dni: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}
    
    def register_general_attendance(self, dni):
        """Registrar asistencia general"""
        try:
            response = requests.post(f"{self.base_url}", json={
                "action": "registerGeneralAttendance",
                "dni": dni,
                "timestamp": datetime.now().isoformat()
            })
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_sessions_list(self):
        """Obtener lista de ponencias disponibles"""
        try:
            url = f"{self.base_url}?action=getSessionsList"
            print(f"[DEBUG] Llamando a: {url}")
            response = requests.get(url, timeout=10)
            print(f"[DEBUG] Status: {response.status_code}")
            print(f"[DEBUG] Respuesta: {response.text[:500]}")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            print(f"[ERROR] Exception en get_sessions_list: {str(e)}")
            return {"error": str(e)}
    
    def get_sessions_capacity(self):
        """Obtener capacidad de todas las ponencias"""
        try:
            url = f"{self.base_url}?action=getSessionsCapacity"
            print(f"[DEBUG] Llamando a: {url}")
            response = requests.get(url, timeout=10)
            print(f"[DEBUG] Status: {response.status_code}")
            print(f"[DEBUG] Respuesta: {response.text[:500]}")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            print(f"[ERROR] Exception en get_sessions_capacity: {str(e)}")
            return {"error": str(e)}
    
    def register_session_attendance(self, dni, session_id):
        """Registrar asistencia a ponencia"""
        try:
            response = requests.post(f"{self.base_url}", json={
                "action": "registerSessionAttendance",
                "dni": dni,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}
    
    def export_attendees_data(self):
        """Exportar datos de asistentes"""
        try:
            response = requests.get(f"{self.base_url}?action=exportAttendeesData")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}: {response.text}"}
        except Exception as e:
            return {"error": str(e)}

# Initialize API client
api_client = AppScriptAPI(APPSCRIPT_BASE_URL)

# Routes
@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/register')
def register_page():
    """Página de registro"""
    return render_template('register.html')

@app.route('/sessions')
def sessions_page():
    """Página de ponencias"""
    return render_template('sessions.html')

@app.route('/export')
def export_page():
    """Página de exportación"""
    return render_template('export.html')

# API Routes
@app.route('/api/v1/attendees/search/<dni>', methods=['GET'])
def search_attendee(dni):
    """
    Buscar asistente por DNI
    
    Input: DNI como parámetro de ruta
    Output: {
        "success": boolean,
        "data": {
            "dni": string,
            "nombre": string,
            "asistencia_general": boolean,
            "ponencia_1": boolean,
            "ponencia_2": boolean,
            "ponencia_3": boolean
        },
        "message": string
    }
    """
    try:
        result = api_client.get_attendee_by_dni(dni)
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": "Error al buscar asistente",
                "error": result['error']
            }), 500
        
        return jsonify({
            "success": True,
            "data": result,
            "message": "Asistente encontrado" if result else "Asistente no encontrado"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/attendees/general', methods=['POST'])
def register_general_attendance():
    """
    Registrar asistencia general
    
    Input: {
        "dni": string
    }
    Output: {
        "success": boolean,
        "message": string,
        "data": object (opcional)
    }
    """
    try:
        data = request.get_json()
        dni = data.get('dni')
        
        if not dni:
            return jsonify({
                "success": False,
                "message": "DNI es requerido"
            }), 400
        
        result = api_client.register_general_attendance(dni)
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": "Error al registrar asistencia",
                "error": result['error']
            }), 500
        
        return jsonify({
            "success": True,
            "message": "Asistencia general registrada exitosamente",
            "data": result
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/sessions', methods=['GET'])
def get_sessions_list():
    """
    Obtener lista de ponencias disponibles
    
    Input: Ninguno
    Output: {
        "success": boolean,
        "data": [
            {
                "id": string,
                "name": string,
                "description": string (opcional)
            }
        ],
        "message": string
    }
    """
    try:
        result = api_client.get_sessions_list()
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": "Error al obtener lista de ponencias",
                "error": result['error']
            }), 500
        
        return jsonify({
            "success": True,
            "data": result,
            "message": "Lista de ponencias obtenida exitosamente"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/sessions/capacity', methods=['GET'])
def get_sessions_capacity():
    """
    Obtener capacidad de ponencias
    
    Input: Ninguno
    Output: {
        "success": boolean,
        "data": {
            "session_id_1": {"available": number, "total": number, "name": string},
            "session_id_2": {"available": number, "total": number, "name": string},
            ...
        },
        "message": string
    }
    """
    try:
        result = api_client.get_sessions_capacity()
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": "Error al obtener capacidad de ponencias",
                "error": result['error']
            }), 500
        
        return jsonify({
            "success": True,
            "data": result,
            "message": "Capacidad de ponencias obtenida exitosamente"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/sessions/register', methods=['POST'])
def register_session_attendance():
    """
    Registrar asistencia a ponencia
    
    Input: {
        "dni": string,
        "session_id": string
    }
    Output: {
        "success": boolean,
        "message": string,
        "data": object (opcional)
    }
    """
    try:
        data = request.get_json()
        dni = data.get('dni')
        session_id = data.get('session_id')
        
        if not dni or not session_id:
            return jsonify({
                "success": False,
                "message": "DNI y session_id son requeridos"
            }), 400
        
        result = api_client.register_session_attendance(dni, session_id)
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": f"Error al registrar en ponencia {session_id}",
                "error": result['error']
            }), 500
        
        # Verificar si el registro fue exitoso según la respuesta
        if result.get('registered'):
            session_name = result.get('session_name', session_id)
            return jsonify({
                "success": True,
                "message": f"Registrado exitosamente en {session_name}",
                "data": result
            })
        elif result.get('already_registered'):
            session_name = result.get('session_name', session_id)
            return jsonify({
                "success": False,
                "message": f"Ya está registrado en {session_name}"
            })
        elif result.get('no_general_attendance'):
            return jsonify({
                "success": False,
                "message": "Debe registrar asistencia general primero"
            })
        elif result.get('no_capacity'):
            session_name = result.get('session_name', session_id)
            return jsonify({
                "success": False,
                "message": f"No hay cupos disponibles para {session_name}"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Error desconocido al registrar en ponencia"
            })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/attendees/export', methods=['GET'])
def export_attendees():
    """
    Exportar datos de asistentes
    
    Input: Ninguno
    Output: Archivo CSV o JSON con los datos
    """
    try:
        result = api_client.export_attendees_data()
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "message": "Error al exportar datos",
                "error": result['error']
            }), 500
        
        # Si la respuesta contiene un archivo CSV
        if 'csv_data' in result:
            output = io.StringIO()
            output.write(result['csv_data'])
            output.seek(0)
            
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'asistentes_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            )
        
        # Si la respuesta es JSON
        return jsonify({
            "success": True,
            "data": result,
            "message": "Datos exportados exitosamente"
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@app.route('/api/v1/debug/scanned-code', methods=['POST'])
def debug_scanned_code():
    """
    Endpoint para debugging - recibe cualquier código escaneado
    
    Input: {
        "code": string,
        "format": string,
        "source": string
    }
    Output: {
        "success": boolean,
        "message": string
    }
    """
    try:
        data = request.get_json()
        code = data.get('code', '')
        format_type = data.get('format', 'unknown')
        source = data.get('source', 'unknown')
        
        # IMPRIMIR EN CONSOLA DEL SERVIDOR
        print("=" * 60)
        print("🔍 CÓDIGO ESCANEADO DETECTADO:")
        print(f"📱 Fuente: {source}")
        print(f"📋 Código: {code}")
        print(f"🔖 Formato: {format_type}")
        print(f"📏 Longitud: {len(code)} caracteres")
        
        # Si es detección de boxes solamente
        if code == '[BOXES_DETECTED]':
            boxes_info = data.get('boxes_info', {})
            print(f"📦 Detección de boxes: {boxes_info.get('count', 0)} boxes encontrados")
            print("🔍 QuaggaJS detectó formas que parecen códigos pero no logró decodificarlos")
            
            # Imprimir información de los boxes
            if 'boxes' in boxes_info:
                for i, box in enumerate(boxes_info['boxes'][:3]):  # Solo primeros 3 boxes
                    print(f"   📦 Box {i+1}: {box}")
        else:
            # Intentar extraer números
            numbers = ''.join(filter(str.isdigit, code))
            print(f"🔢 Solo números: {numbers} (longitud: {len(numbers)})")
            
            # Verificar si podría ser DNI
            if len(numbers) >= 8:
                possible_dni = numbers[:8]
                print(f"✅ Posible DNI: {possible_dni}")
            else:
                print("❌ No contiene suficientes números para ser DNI")
        
        print("=" * 60)
        
        return jsonify({
            "success": True,
            "message": "Código recibido y procesado en servidor",
            "debug_info": {
                "code": code,
                "format": format_type,
                "numbers_extracted": numbers,
                "possible_dni": numbers[:8] if len(numbers) >= 8 else None
            }
        })
        
    except Exception as e:
        print(f"❌ Error procesando código escaneado: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error procesando código",
            "error": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Endpoint no encontrado"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "message": "Error interno del servidor"
    }), 500

if _name_ == '_main_':
    app.run(debug=True, host='0.0.0.0', port=5000)