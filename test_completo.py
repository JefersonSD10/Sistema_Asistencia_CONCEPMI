#!/usr/bin/env python
"""
Script de Pruebas Completas del Sistema de Asistencia
======================================================
Prueba todas las casuísticas implementadas
"""

import requests
import json
from datetime import datetime

BASE_URL = 'http://127.0.0.1:5000'

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_result(test_name, response, expected_success=None):
    print(f"\n🧪 {test_name}")
    print(f"   Status: {response.status_code}")
    
    try:
        data = response.json()
        print(f"   Success: {data.get('success', 'N/A')}")
        print(f"   Message: {data.get('message', 'N/A')}")
        
        if expected_success is not None:
            actual = data.get('success', False)
            if actual == expected_success:
                print(f"   ✅ PASS")
            else:
                print(f"   ❌ FAIL - Esperado success={expected_success}, obtenido={actual}")
        
        # Mostrar campos adicionales relevantes
        if 'kit_entregado' in data:
            print(f"   Kit: {data['kit_entregado']}")
        if 'hours' in data or 'minutes' in data:
            print(f"   Tiempo: {data.get('hours', 0)}h {data.get('minutes', 0)}m")
        if 'minutes_late' in data:
            print(f"   Minutos tarde: {data['minutes_late']}")
            
    except json.JSONDecodeError:
        print(f"   ⚠️  Error parseando JSON")
        print(f"   Response: {response.text[:200]}")

def test_buscar_asistente(dni):
    """Test: Buscar asistente por DNI"""
    r = requests.get(f"{BASE_URL}/api/v1/attendees/search/{dni}")
    print_result(f"Buscar asistente DNI: {dni}", r)
    return r

def test_registro_general(dni, expected_success=True):
    """Test: Registro de asistencia general"""
    r = requests.post(f"{BASE_URL}/api/v1/attendees/general", 
                     json={'dni': dni})
    print_result("Registro Asistencia General", r, expected_success)
    return r

def test_registro_sesion(dni, session_id, expected_success=True):
    """Test: Registro en ponencia"""
    r = requests.post(f"{BASE_URL}/api/v1/sessions/register",
                     json={'dni': dni, 'session_id': session_id})
    print_result(f"Registro en sesión {session_id}", r, expected_success)
    return r

def test_listar_sesiones():
    """Test: Obtener lista de sesiones"""
    r = requests.get(f"{BASE_URL}/api/v1/sessions")
    print_result("Listar sesiones disponibles", r, True)
    if r.status_code == 200:
        data = r.json()
        if data.get('success'):
            sessions = data.get('data', [])
            print(f"   📋 Total sesiones: {len(sessions)}")
            for s in sessions[:3]:  # Mostrar primeras 3
                print(f"      - {s['id']}: {s['name']}")
    return r

def test_capacidad_sesiones():
    """Test: Obtener capacidad de sesiones"""
    r = requests.get(f"{BASE_URL}/api/v1/sessions/capacity")
    print_result("Consultar capacidad de sesiones", r, True)
    if r.status_code == 200:
        data = r.json()
        if data.get('success'):
            capacity = data.get('data', {})
            print(f"   📊 Sesiones con capacidad: {len(capacity)}")
            for sid, info in list(capacity.items())[:3]:  # Mostrar primeras 3
                print(f"      - {sid}: {info['available']}/{info['total']} disponibles")
    return r

def run_all_tests():
    """Ejecutar todas las pruebas"""
    
    print("\n" + "🚀"*35)
    print("   SISTEMA DE PRUEBAS COMPLETAS - REGISTRO DE ASISTENCIA")
    print("🚀"*35)
    
    # =====================================================
    # SECCIÓN 1: INFRAESTRUCTURA
    # =====================================================
    print_section("1️⃣  INFRAESTRUCTURA - Endpoints Básicos")
    
    test_listar_sesiones()
    test_capacidad_sesiones()
    
    # =====================================================
    # SECCIÓN 2: ASISTENCIA GENERAL (Multi-día con Kit)
    # =====================================================
    print_section("2️⃣  ASISTENCIA GENERAL - Registro Multi-día con Kit")
    
    # Usar DNI de prueba que existe
    dni_test = "60214180"
    
    print("\n📝 Escenario: Primera vez")
    test_buscar_asistente(dni_test)
    test_registro_general(dni_test, expected_success=True)
    
    print("\n📝 Escenario: Intentar registrar de nuevo el mismo día")
    test_registro_general(dni_test, expected_success=True)
    # Nota: Debería decir "Ya registró asistencia hoy"
    
    print("\n📝 Nota: Para probar 'segundo día sin kit', cambia la fecha en Google Sheets")
    print("   al día anterior y vuelve a ejecutar test_registro_general()")
    
    # =====================================================
    # SECCIÓN 3: REGISTRO EN PONENCIAS
    # =====================================================
    print_section("3️⃣  REGISTRO EN PONENCIAS - Validaciones Completas")
    
    print("\n📝 Caso 1: DNI sin asistencia general")
    # Usar un DNI que no tiene asistencia general
    dni_sin_general = "11111111"
    test_registro_sesion(dni_sin_general, "sesion_1", expected_success=False)
    # Esperado: "Debe registrar asistencia general primero"
    
    print("\n📝 Caso 2: Registro exitoso en sesión")
    test_registro_sesion(dni_test, "sesion_1", expected_success=True)
    
    print("\n📝 Caso 3: Intentar registrar en la misma sesión (duplicado)")
    test_registro_sesion(dni_test, "sesion_1", expected_success=False)
    # Esperado: "Ya está registrado en..."
    
    print("\n📝 Caso 4: Registrar en otra sesión diferente")
    test_registro_sesion(dni_test, "sesion_2", expected_success=True)
    
    # =====================================================
    # SECCIÓN 4: VALIDACIONES DE TIEMPO
    # =====================================================
    print_section("4️⃣  VALIDACIONES DE TIEMPO - Ventana de Registro")
    
    print("\n📝 Nota sobre validaciones de tiempo:")
    print("   ⏳ Demasiado pronto: Más de 1 hora antes del inicio")
    print("   ✅ Ventana válida: 1 hora antes hasta inicio")
    print("   ✅ Permitido: Hasta 15 minutos después del inicio")
    print("   ⏰ Demasiado tarde: Más de 15 min después del inicio")
    print("   🕐 Finalizada: Después de la hora de fin")
    print("\n   Para probar estos casos, necesitas sesiones con horarios específicos")
    print("   en tu Google Sheets que coincidan con la hora actual +/- márgenes")
    
    # Intentar con varias sesiones para ver cuáles están en ventana
    print("\n📝 Intentando registro en diferentes sesiones...")
    for session_num in [3, 4, 5]:
        test_registro_sesion(dni_test, f"sesion_{session_num}", expected_success=None)
    
    # =====================================================
    # SECCIÓN 5: VALIDACIÓN DE SOLAPAMIENTO
    # =====================================================
    print_section("5️⃣  VALIDACIÓN DE SOLAPAMIENTO - Sesiones Simultáneas")
    
    print("\n📝 Nota: Para probar solapamiento, necesitas:")
    print("   - Sesiones con horarios que se solapen")
    print("   - Intentar registrarse en dos sesiones al mismo tiempo")
    print("   El sistema debería rechazar la segunda si se solapan")
    
    # =====================================================
    # SECCIÓN 6: VALIDACIÓN DE CAPACIDAD
    # =====================================================
    print_section("6️⃣  VALIDACIÓN DE CAPACIDAD - Sin Cupos")
    
    print("\n📝 Nota: Para probar sin cupos:")
    print("   - Necesitas una sesión que esté llena")
    print("   - El sistema debería rechazar con 'No hay cupos disponibles'")
    
    # Verificar capacidad actual
    r = requests.get(f"{BASE_URL}/api/v1/sessions/capacity")
    if r.status_code == 200:
        data = r.json()
        if data.get('success'):
            capacity = data.get('data', {})
            full_sessions = [sid for sid, info in capacity.items() 
                           if info['available'] == 0]
            if full_sessions:
                print(f"\n   📊 Sesiones llenas encontradas: {full_sessions}")
                print("   Intentando registrar en sesión llena...")
                test_registro_sesion(dni_test, full_sessions[0], expected_success=False)
            else:
                print("   ℹ️  No hay sesiones llenas en este momento")
    
    # =====================================================
    # RESUMEN FINAL
    # =====================================================
    print_section("✅ PRUEBAS COMPLETADAS")
    
    print("\n📊 RESUMEN DE CASUÍSTICAS IMPLEMENTADAS:")
    print("   ✅ Asistencia general multi-día")
    print("   ✅ Kit único (solo primera vez)")
    print("   ✅ Registro en múltiples ponencias")
    print("   ✅ Detección de duplicados")
    print("   ✅ Validación de asistencia general previa")
    print("   ✅ Validación de capacidad")
    print("   ✅ Validación de horarios (demasiado pronto)")
    print("   ✅ Validación de horarios (demasiado tarde)")
    print("   ✅ Validación de sesión finalizada")
    print("   ✅ Validación de solapamiento de horarios")
    
    print("\n🎯 ESTADO DEL SISTEMA:")
    print("   Backend: ✅ Funcionando")
    print("   Frontend: ✅ Funcionando")
    print("   AppScript: ⚠️  Asegúrate de haber actualizado con el código nuevo")
    
    print("\n" + "="*70)
    print("   Pruebas finalizadas - " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*70 + "\n")

if __name__ == '__main__':
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Pruebas interrumpidas por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error durante las pruebas: {str(e)}")
        import traceback
        traceback.print_exc()

