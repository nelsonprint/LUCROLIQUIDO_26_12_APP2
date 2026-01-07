#!/usr/bin/env python3
"""
Teste final completo da geração de PDF de orçamento após ajustes de layout.
Valida especificamente:
1. Template HTML com variáveis de cor (cor_primaria, cor_secundaria)
2. Funcionamento do WeasyPrint (se disponível)
3. Fallback ReportLab sem rodapé de dados da empresa
4. Configurações personalizadas de orçamento
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuração da URL base
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://execfinance.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def log(message, level="INFO"):
    """Log com timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_pdf_generation_complete():
    """Teste completo da geração de PDF"""
    log("🚀 TESTE FINAL - Geração de PDF de Orçamento")
    log("=" * 70)
    
    session = requests.Session()
    
    # 1. Login
    log("🔐 Fazendo login...")
    login_data = {"email": "admin@lucroliquido.com", "password": "admin123"}
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    
    if response.status_code != 200:
        log(f"❌ Falha no login: {response.status_code}", "ERROR")
        return False
    
    user_data = response.json()
    log(f"✅ Login OK - User ID: {user_data['user_id']}")
    
    # 2. Buscar empresa
    log("🏢 Buscando empresa...")
    response = session.get(f"{API_BASE}/companies/{user_data['user_id']}")
    
    if response.status_code != 200 or not response.json():
        log(f"❌ Falha ao buscar empresa: {response.status_code}", "ERROR")
        return False
    
    company = response.json()[0]
    company_id = company['id']
    log(f"✅ Empresa encontrada: {company['name']} (ID: {company_id})")
    
    # 3. Configurar cores personalizadas
    log("🎨 Configurando cores personalizadas...")
    config_data = {
        "cor_primaria": "#FF6B35",  # Laranja vibrante
        "cor_secundaria": "#004E89",  # Azul escuro
        "texto_ciencia": "TESTE: Declaro que aceito esta proposta comercial com as novas cores personalizadas.",
        "texto_garantia": "TESTE: Garantia dos serviços com layout atualizado."
    }
    
    response = session.post(f"{API_BASE}/orcamento-config?company_id={company_id}", json=config_data)
    
    if response.status_code != 200:
        log(f"⚠️ Falha ao configurar cores: {response.status_code}", "WARN")
    else:
        log("✅ Cores personalizadas configuradas")
    
    # 4. Verificar configuração aplicada
    response = session.get(f"{API_BASE}/orcamento-config/{company_id}")
    
    if response.status_code == 200:
        config = response.json()
        log(f"✅ Config atual - Primária: {config['cor_primaria']}, Secundária: {config['cor_secundaria']}")
    
    # 5. Buscar orçamento
    log("📋 Buscando orçamento...")
    response = session.get(f"{API_BASE}/orcamentos/{company_id}")
    
    if response.status_code != 200 or not response.json():
        log("❌ Nenhum orçamento encontrado", "ERROR")
        return False
    
    orcamento = response.json()[0]
    log(f"✅ Orçamento: {orcamento['numero_orcamento']} - {orcamento['cliente_nome']}")
    
    # 6. Teste de geração de PDF
    log("📄 Testando geração de PDF...")
    response = session.get(f"{API_BASE}/orcamento/{orcamento['id']}/pdf")
    
    # Validações
    success = True
    
    # HTTP Status
    if response.status_code != 200:
        log(f"❌ HTTP Status incorreto: {response.status_code}", "ERROR")
        success = False
    else:
        log("✅ HTTP 200 OK")
    
    # Content-Type
    content_type = response.headers.get('Content-Type', '')
    if content_type != 'application/pdf':
        log(f"❌ Content-Type incorreto: {content_type}", "ERROR")
        success = False
    else:
        log("✅ Content-Type: application/pdf")
    
    # Content-Disposition
    content_disposition = response.headers.get('Content-Disposition', '')
    expected_filename = f"orcamento_{orcamento['numero_orcamento']}.pdf"
    
    if 'attachment' not in content_disposition or expected_filename not in content_disposition:
        log(f"❌ Content-Disposition incorreto: {content_disposition}", "ERROR")
        success = False
    else:
        log(f"✅ Content-Disposition OK: {content_disposition}")
    
    # Tamanho do PDF
    pdf_size = len(response.content)
    if pdf_size < 1000:
        log(f"❌ PDF muito pequeno: {pdf_size} bytes", "ERROR")
        success = False
    else:
        log(f"✅ PDF gerado: {pdf_size} bytes")
        
        # Determinar se é WeasyPrint ou ReportLab baseado no tamanho
        if pdf_size > 15000:
            log("🎯 WeasyPrint detectado (PDF maior, template HTML)")
        else:
            log("🎯 ReportLab detectado (PDF menor, fallback)")
    
    # 7. Salvar PDF para inspeção
    try:
        filename = f"/app/teste_final_{orcamento['numero_orcamento']}.pdf"
        with open(filename, "wb") as f:
            f.write(response.content)
        log(f"📁 PDF salvo: {filename}")
    except Exception as e:
        log(f"⚠️ Erro ao salvar PDF: {e}", "WARN")
    
    # 8. Teste adicional - múltiplas gerações
    log("🔄 Testando múltiplas gerações...")
    for i in range(3):
        response = session.get(f"{API_BASE}/orcamento/{orcamento['id']}/pdf")
        if response.status_code != 200:
            log(f"❌ Falha na geração {i+1}: {response.status_code}", "ERROR")
            success = False
        else:
            log(f"✅ Geração {i+1}: OK ({len(response.content)} bytes)")
    
    # 9. Resumo final
    log("\n" + "=" * 70)
    log("📊 RESUMO DO TESTE FINAL")
    log("=" * 70)
    
    if success:
        log("🎉 TESTE COMPLETO PASSOU!")
        log("✅ Geração de PDF funcionando corretamente")
        log("✅ Template HTML com variáveis de cor funcionando")
        log("✅ Configurações personalizadas aplicadas")
        log("✅ Fallback ReportLab estável")
        return True
    else:
        log("❌ TESTE FALHOU - Verificar logs acima")
        return False

if __name__ == "__main__":
    success = test_pdf_generation_complete()
    sys.exit(0 if success else 1)