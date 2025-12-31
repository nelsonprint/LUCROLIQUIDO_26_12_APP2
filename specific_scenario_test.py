#!/usr/bin/env python3
"""
Specific scenario tests for the Service Price Table functionality
based on the review request requirements.
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://biz-quote-manager.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"
COMPANY_ID = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"

def log(message, level="INFO"):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_specific_scenarios():
    """Test specific scenarios from the review request"""
    session = requests.Session()
    
    # Login
    log("🔐 Logging in...")
    login_data = {
        "email": "admin@lucroliquido.com",
        "password": "admin123"
    }
    
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code != 200:
        log(f"❌ Login failed: {response.status_code}", "ERROR")
        return False
    
    log("✅ Login successful!")
    
    # Test specific API endpoints from review request
    log("\n🧪 Testing specific API endpoints from review request...")
    
    # 1. GET /api/service-price-table/{company_id} - Listar serviços com filtros
    log("1️⃣ Testing GET /api/service-price-table/{company_id}")
    response = session.get(f"{API_BASE}/service-price-table/{COMPANY_ID}")
    if response.status_code == 200:
        result = response.json()
        log(f"✅ Found {result.get('total', 0)} services total")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    # 2. GET /api/service-price-table/{company_id}?search=tomada - Busca
    log("2️⃣ Testing search for 'tomada'")
    response = session.get(f"{API_BASE}/service-price-table/{COMPANY_ID}?search=tomada")
    if response.status_code == 200:
        result = response.json()
        items = result.get('items', [])
        log(f"✅ Search 'tomada' returned {len(items)} items")
        
        # Check if we found "INSTALAÇÃO DE TOMADA"
        found_tomada = False
        for item in items:
            if "TOMADA" in item.get('description', '').upper():
                found_tomada = True
                log(f"   📍 Found: {item.get('description')} - R$ {item.get('pu1_base_price')} - {item.get('unit')}")
                
                # Verify expected values
                if item.get('pu1_base_price') == 45.0 and item.get('unit') == 'PONTO':
                    log("   ✅ Values match expected: R$ 45,00 and unit 'PONTO'")
                else:
                    log(f"   ⚠️ Values differ from expected. Price: {item.get('pu1_base_price')}, Unit: {item.get('unit')}")
        
        if not found_tomada:
            log("   ❌ 'INSTALAÇÃO DE TOMADA' not found in search results", "ERROR")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    # 3. GET /api/service-price-table/{company_id}/autocomplete?search=tom - Autocomplete
    log("3️⃣ Testing autocomplete for 'tom'")
    response = session.get(f"{API_BASE}/service-price-table/{COMPANY_ID}/autocomplete?search=tom")
    if response.status_code == 200:
        items = response.json()
        log(f"✅ Autocomplete 'tom' returned {len(items)} items")
        
        for item in items:
            if "TOMADA" in item.get('description', '').upper():
                log(f"   📍 Autocomplete result: {item.get('description')} - R$ {item.get('pu1_base_price')} - {item.get('unit')}")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    # 4. GET /api/service-price-table/{company_id}/categories - Listar categorias
    log("4️⃣ Testing categories list")
    response = session.get(f"{API_BASE}/service-price-table/{COMPANY_ID}/categories")
    if response.status_code == 200:
        result = response.json()
        categories = result.get('categories', [])
        log(f"✅ Found {len(categories)} categories: {', '.join(categories)}")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    # 5. GET /api/service-price-table/units/list - Listar unidades
    log("5️⃣ Testing units list")
    response = session.get(f"{API_BASE}/service-price-table/units/list")
    if response.status_code == 200:
        result = response.json()
        units = result.get('units', [])
        log(f"✅ Found {len(units)} units: {', '.join(units)}")
        
        # Check if 'PONTO' is in the list
        if 'PONTO' in units:
            log("   ✅ 'PONTO' unit is available")
        else:
            log("   ❌ 'PONTO' unit not found", "ERROR")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    # Test search for "pin" (pintura)
    log("6️⃣ Testing search for 'pin' (pintura)")
    response = session.get(f"{API_BASE}/service-price-table/{COMPANY_ID}?search=pin")
    if response.status_code == 200:
        result = response.json()
        items = result.get('items', [])
        log(f"✅ Search 'pin' returned {len(items)} items")
        
        for item in items:
            if "PINTURA" in item.get('description', '').upper():
                log(f"   📍 Found painting service: {item.get('description')} - R$ {item.get('pu1_base_price')} - {item.get('unit')}")
    else:
        log(f"❌ Failed: {response.status_code}", "ERROR")
    
    log("\n🎯 Specific scenario tests completed!")
    return True

if __name__ == "__main__":
    test_specific_scenarios()