#!/usr/bin/env python3
"""
Comprehensive test suite for App do Vendedor (Seller App).
Tests all the functionality described in the review request.
"""

import requests
import json
import sys
import os
from datetime import datetime
import time

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://exec-reports-2.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class VendedorAppTester:
    """Test suite for App do Vendedor functionality"""
    
    def __init__(self):
        self.session = requests.Session()
        self.user_data = None
        self.company_id = None
        self.vendedor_category_id = None
        self.created_vendedor_id = None
        self.vendedor_login_email = None
        self.vendedor_login_senha = None
        self.created_orcamento_id = None
        self.created_comissao_id = None
        self.created_agenda_id = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_admin_login(self):
        """Test login with admin credentials"""
        self.log("🔐 Testing admin login...")
        
        login_data = {
            "email": "admin@lucroliquido.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                self.user_data = response.json()
                self.log(f"✅ Admin login successful! User ID: {self.user_data['user_id']}")
                
                # Get admin's company
                companies_response = self.session.get(f"{API_BASE}/companies/{self.user_data['user_id']}")
                if companies_response.status_code == 200:
                    companies = companies_response.json()
                    if companies:
                        self.company_id = companies[0]['id']
                        self.log(f"✅ Company ID: {self.company_id}")
                        return True
                    else:
                        self.log("❌ No companies found for admin", "ERROR")
                        return False
                else:
                    self.log("❌ Failed to get companies", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login error: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_app_endpoint(self):
        """Test GET /api/vendedor/app - Should return HTML"""
        self.log("📱 Testing vendedor app endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/app")
            
            if response.status_code == 200:
                content = response.text
                self.log("✅ Vendedor app endpoint working!")
                
                # Check if it's HTML content
                if '<html' in content.lower() or '<!doctype' in content.lower():
                    self.log("✅ Response contains valid HTML content")
                    return True
                else:
                    self.log("❌ Response does not contain valid HTML content", "ERROR")
                    self.log(f"Content preview: {content[:200]}...")
                    return False
            else:
                self.log(f"❌ Failed to load vendedor app: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error loading vendedor app: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_manifest(self):
        """Test GET /api/vendedor/manifest.json - Should return valid JSON"""
        self.log("📋 Testing vendedor manifest...")
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/manifest.json")
            
            if response.status_code == 200:
                try:
                    manifest = response.json()
                    self.log("✅ Vendedor manifest loaded successfully!")
                    
                    # Check for required manifest fields
                    required_fields = ['name', 'short_name', 'start_url', 'display']
                    for field in required_fields:
                        if field in manifest:
                            self.log(f"   ✅ {field}: {manifest[field]}")
                        else:
                            self.log(f"   ⚠️ Missing manifest field: {field}", "WARN")
                    
                    return True
                except json.JSONDecodeError:
                    self.log("❌ Manifest response is not valid JSON", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to load vendedor manifest: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error loading vendedor manifest: {str(e)}", "ERROR")
            return False
    
    def test_get_vendedor_category(self):
        """Get or create Vendedor category"""
        self.log("👥 Getting Vendedor category...")
        
        try:
            response = self.session.get(f"{API_BASE}/funcionarios/categorias/{self.company_id}")
            
            if response.status_code == 200:
                categories = response.json()
                
                # Look for Vendedor category
                for cat in categories:
                    if cat.get('nome') == 'Vendedor':
                        self.vendedor_category_id = cat.get('id')
                        self.log(f"✅ Found Vendedor category! ID: {self.vendedor_category_id}")
                        return True
                
                self.log("❌ Vendedor category not found", "ERROR")
                return False
            else:
                self.log(f"❌ Failed to get categories: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting categories: {str(e)}", "ERROR")
            return False
    
    def test_create_vendedor_funcionario(self):
        """Create funcionário with Vendedor category and login credentials"""
        self.log("👤 Creating vendedor funcionário...")
        
        if not self.vendedor_category_id:
            self.log("❌ No Vendedor category ID available", "ERROR")
            return False
        
        timestamp = int(time.time())
        self.vendedor_login_email = f"vendedor{timestamp}@teste.com"
        self.vendedor_login_senha = "vendedor123"
        
        funcionario_data = {
            "empresa_id": self.company_id,
            "nome_completo": f"Vendedor Teste {timestamp}",
            "cpf": f"123.456.{timestamp % 1000:03d}-99",
            "whatsapp": "(11) 99999-5555",
            "email": f"vendedor{timestamp}@teste.com",
            "salario": 3000,
            "categoria_id": self.vendedor_category_id,
            "status": "Ativo",
            "login_email": self.vendedor_login_email,
            "login_senha": self.vendedor_login_senha,
            "percentual_comissao": 5.0  # 5% commission
        }
        
        try:
            response = self.session.post(f"{API_BASE}/funcionarios", json=funcionario_data)
            
            if response.status_code == 200:
                result = response.json()
                funcionario_data_response = result.get('funcionario', {})
                self.created_vendedor_id = funcionario_data_response.get('id')
                
                self.log(f"✅ Vendedor funcionário created! ID: {self.created_vendedor_id}")
                self.log(f"   📧 Login email: {self.vendedor_login_email}")
                self.log(f"   🔑 Login password: {self.vendedor_login_senha}")
                self.log(f"   💰 Commission: 5.0%")
                
                return True
            else:
                self.log(f"❌ Failed to create vendedor: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating vendedor: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_login(self):
        """Test POST /api/vendedor/login"""
        self.log("🔐 Testing vendedor login...")
        
        if not self.vendedor_login_email or not self.vendedor_login_senha:
            self.log("❌ No vendedor credentials available", "ERROR")
            return False
        
        login_data = {
            "login_email": self.vendedor_login_email,
            "login_senha": self.vendedor_login_senha
        }
        
        try:
            response = self.session.post(f"{API_BASE}/vendedor/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                vendedor_data = result.get('vendedor', {})
                empresa_data = result.get('empresa', {})
                
                self.log(f"✅ Vendedor login successful!")
                self.log(f"   👤 Vendedor ID: {vendedor_data.get('id')}")
                self.log(f"   👤 Vendedor Name: {vendedor_data.get('nome')}")
                self.log(f"   🏢 Company ID: {empresa_data.get('id')}")
                self.log(f"   🏢 Company Name: {empresa_data.get('nome')}")
                
                return True
            else:
                self.log(f"❌ Vendedor login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in vendedor login: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_orcamentos_endpoint(self):
        """Test GET /api/vendedor/{vendedor_id}/orcamentos"""
        self.log("📄 Testing vendedor orçamentos endpoint...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/{self.created_vendedor_id}/orcamentos")
            
            if response.status_code == 200:
                orcamentos = response.json()
                self.log(f"✅ Vendedor orçamentos endpoint working! Found {len(orcamentos)} orçamentos")
                return True
            else:
                self.log(f"❌ Failed to get vendedor orçamentos: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting vendedor orçamentos: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_comissoes_endpoint(self):
        """Test GET /api/vendedor/{vendedor_id}/comissoes"""
        self.log("💰 Testing vendedor comissões endpoint...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/{self.created_vendedor_id}/comissoes")
            
            if response.status_code == 200:
                comissoes = response.json()
                self.log(f"✅ Vendedor comissões endpoint working! Found {len(comissoes)} comissões")
                return True
            else:
                self.log(f"❌ Failed to get vendedor comissões: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting vendedor comissões: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_agenda_endpoint(self):
        """Test GET /api/vendedor/{vendedor_id}/agenda"""
        self.log("📅 Testing vendedor agenda endpoint...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/{self.created_vendedor_id}/agenda")
            
            if response.status_code == 200:
                agenda = response.json()
                self.log(f"✅ Vendedor agenda endpoint working! Found {len(agenda)} agenda items")
                return True
            else:
                self.log(f"❌ Failed to get vendedor agenda: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting vendedor agenda: {str(e)}", "ERROR")
            return False
    
    def test_create_orcamento_with_services_and_materials(self):
        """Create orçamento with vendedor and separate services/materials for commission testing"""
        self.log("📄 Creating orçamento with services and materials...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        timestamp = int(time.time())
        
        # Create orçamento with detailed services and materials breakdown
        orcamento_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            "vendedor_id": self.created_vendedor_id,
            "vendedor_nome": f"Vendedor Teste {timestamp}",
            "cliente_nome": f"Cliente Teste Comissão {timestamp}",
            "cliente_whatsapp": "11999999999",
            "tipo": "servico_hora",
            "descricao_servico_ou_produto": "Serviço com materiais para teste de comissão",
            "quantidade": 1.0,
            "custo_total": 7500.0,  # R$ 7.500 total cost
            "preco_minimo": 12000.0,
            "preco_sugerido": 15000.0,
            "preco_praticado": 15000.0,  # R$ 15.000 total
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "À vista",
            "prazo_execucao": "30 dias",
            "observacoes": "Teste de comissão sobre serviços apenas",
            # CRITICAL: Detailed breakdown for commission calculation
            "detalhes_itens": {
                "totals": {
                    "services_total": 10000.0,  # R$ 10.000 in services
                    "materials_total": 5000.0   # R$ 5.000 in materials
                }
            }
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=orcamento_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_orcamento_id = result.get('orcamento_id')
                numero_orcamento = result.get('numero_orcamento')
                
                self.log(f"✅ Orçamento created! ID: {self.created_orcamento_id}, Number: {numero_orcamento}")
                self.log(f"   💰 Total: R$ 15.000 (R$ 10.000 services + R$ 5.000 materials)")
                self.log(f"   👤 Vendedor: {self.created_vendedor_id}")
                
                return True
            else:
                self.log(f"❌ Failed to create orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating orçamento: {str(e)}", "ERROR")
            return False
    
    def test_approve_orcamento_and_commission_logic(self):
        """CRITICAL TEST: Approve orçamento and verify commission is calculated ONLY on services"""
        self.log("✅ CRITICAL TEST: Approving orçamento and testing commission logic...")
        
        if not self.created_orcamento_id:
            self.log("❌ No orçamento ID available", "ERROR")
            return False
        
        try:
            # Approve the orçamento
            status_data = {"status": "APROVADO"}
            response = self.session.patch(f"{API_BASE}/orcamento/{self.created_orcamento_id}/status", json=status_data)
            
            if response.status_code == 200:
                self.log("✅ Orçamento approved successfully!")
                
                # Wait a moment for commission generation
                time.sleep(2)
                
                # Check if commission was generated in contas a pagar
                contas_response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}")
                
                if contas_response.status_code == 200:
                    contas = contas_response.json()
                    
                    # Look for commission account
                    commission_account = None
                    for conta in contas:
                        if (conta.get('categoria') == 'Comissão' and 
                            conta.get('vendedor_id') == self.created_vendedor_id):
                            commission_account = conta
                            self.created_comissao_id = conta.get('id')
                            break
                    
                    if commission_account:
                        valor_comissao = commission_account.get('valor', 0)
                        valor_base_servicos = commission_account.get('valor_base_servicos', 0)
                        valor_materiais_excluidos = commission_account.get('valor_materiais_excluidos', 0)
                        
                        self.log("✅ Commission account found!")
                        self.log(f"   💰 Commission value: R$ {valor_comissao}")
                        self.log(f"   🔧 Services base: R$ {valor_base_servicos}")
                        self.log(f"   🧱 Materials excluded: R$ {valor_materiais_excluidos}")
                        
                        # CRITICAL VERIFICATION: Commission should be 5% of R$ 10.000 = R$ 500
                        expected_commission = 10000.0 * 0.05  # 5% of services only
                        
                        if abs(valor_comissao - expected_commission) < 0.01:
                            self.log("✅ CRITICAL TEST PASSED: Commission calculated ONLY on services!")
                            self.log(f"   Expected: R$ {expected_commission}, Got: R$ {valor_comissao}")
                            
                            if valor_base_servicos == 10000.0:
                                self.log("✅ Services base value correct!")
                            else:
                                self.log(f"⚠️ Services base value: Expected R$ 10000.0, Got R$ {valor_base_servicos}", "WARN")
                            
                            if valor_materiais_excluidos == 5000.0:
                                self.log("✅ Materials excluded value correct!")
                            else:
                                self.log(f"⚠️ Materials excluded: Expected R$ 5000.0, Got R$ {valor_materiais_excluidos}", "WARN")
                            
                            return True
                        else:
                            self.log(f"❌ CRITICAL TEST FAILED: Commission value incorrect!", "ERROR")
                            self.log(f"   Expected: R$ {expected_commission}, Got: R$ {valor_comissao}")
                            return False
                    else:
                        self.log("❌ Commission account not found", "ERROR")
                        return False
                else:
                    self.log("❌ Failed to get contas a pagar", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to approve orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in commission test: {str(e)}", "ERROR")
            return False
    
    def test_create_agenda_visit(self):
        """Test POST /api/vendedor/{vendedor_id}/agenda - Create visit"""
        self.log("📅 Testing create agenda visit...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        timestamp = int(time.time())
        
        agenda_data = {
            "empresa_id": self.company_id,
            "cliente_nome": f"Cliente Visita {timestamp}",
            "titulo": "Visita Comercial",
            "descricao": "Apresentação de proposta comercial",
            "data": "2025-01-15",
            "hora_inicio": "14:00",
            "hora_fim": "15:00",
            "status": "Pendente",
            "observacoes": "Visita para apresentação de proposta"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/vendedor/{self.created_vendedor_id}/agenda", json=agenda_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_agenda_id = result.get('agenda_id') or result.get('id')
                
                self.log(f"✅ Agenda visit created! ID: {self.created_agenda_id}")
                self.log(f"   👤 Client: {agenda_data['cliente_nome']}")
                self.log(f"   📅 Date: {agenda_data['data']} from {agenda_data['hora_inicio']} to {agenda_data['hora_fim']}")
                
                return True
            else:
                self.log(f"❌ Failed to create agenda visit: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating agenda visit: {str(e)}", "ERROR")
            return False
    
    def test_update_agenda_visit(self):
        """Test PUT /api/vendedor/{vendedor_id}/agenda/{id} - Update visit"""
        self.log("✏️ Testing update agenda visit...")
        
        if not self.created_vendedor_id or not self.created_agenda_id:
            self.log("❌ No vendedor ID or agenda ID available", "ERROR")
            return False
        
        update_data = {
            "empresa_id": self.company_id,
            "cliente_nome": "Cliente Visita Atualizada",
            "titulo": "Visita Comercial Reagendada",
            "descricao": "Apresentação de proposta comercial - reagendada",
            "data": "2025-01-16",
            "hora_inicio": "15:00",
            "hora_fim": "16:00",
            "status": "Reagendado",
            "observacoes": "Visita reagendada a pedido do cliente"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/vendedor/{self.created_vendedor_id}/agenda/{self.created_agenda_id}", json=update_data)
            
            if response.status_code == 200:
                self.log("✅ Agenda visit updated successfully!")
                self.log(f"   📅 New date: {update_data['data']} from {update_data['hora_inicio']} to {update_data['hora_fim']}")
                self.log(f"   📊 New status: {update_data['status']}")
                
                return True
            else:
                self.log(f"❌ Failed to update agenda visit: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating agenda visit: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_link_generation(self):
        """Test GET /api/funcionario/{funcionario_id}/link-vendedor"""
        self.log("🔗 Testing vendedor link generation...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/funcionario/{self.created_vendedor_id}/link-vendedor")
            
            if response.status_code == 200:
                result = response.json()
                vendedor_url = result.get('vendedor_url')
                whatsapp_url = result.get('whatsapp_url')
                
                self.log("✅ Vendedor link generated successfully!")
                self.log(f"   🔗 Vendedor URL: {vendedor_url}")
                self.log(f"   📱 WhatsApp URL: {whatsapp_url}")
                
                # Verify URLs are properly formatted
                if vendedor_url and '/api/vendedor/app' in vendedor_url:
                    self.log("✅ Vendedor URL format is correct")
                else:
                    self.log("❌ Vendedor URL format is incorrect", "ERROR")
                    return False
                
                if whatsapp_url and 'wa.me/' in whatsapp_url:
                    self.log("✅ WhatsApp URL format is correct")
                    return True
                else:
                    self.log("❌ WhatsApp URL format is incorrect", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to generate vendedor link: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error generating vendedor link: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Vendedor App tests"""
        self.log("🚀 Starting App do Vendedor (Seller App) Tests")
        self.log("=" * 80)
        
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Vendedor App Endpoint", self.test_vendedor_app_endpoint),
            ("Vendedor Manifest", self.test_vendedor_manifest),
            ("Get Vendedor Category", self.test_get_vendedor_category),
            ("Create Vendedor Funcionário", self.test_create_vendedor_funcionario),
            ("Vendedor Login", self.test_vendedor_login),
            ("Vendedor Orçamentos Endpoint", self.test_vendedor_orcamentos_endpoint),
            ("Vendedor Comissões Endpoint", self.test_vendedor_comissoes_endpoint),
            ("Vendedor Agenda Endpoint", self.test_vendedor_agenda_endpoint),
            ("Create Orçamento with Services/Materials", self.test_create_orcamento_with_services_and_materials),
            ("CRITICAL: Commission Logic Test", self.test_approve_orcamento_and_commission_logic),
            ("Create Agenda Visit", self.test_create_agenda_visit),
            ("Update Agenda Visit", self.test_update_agenda_visit),
            ("Vendedor Link Generation", self.test_vendedor_link_generation)
        ]
        
        results = {}
        critical_tests = ["CRITICAL: Commission Logic Test"]
        
        for test_name, test_func in tests:
            self.log(f"\n📋 Executing test: {test_name}")
            try:
                result = test_func()
                results[test_name] = result
                
                if not result:
                    if test_name in critical_tests:
                        self.log(f"❌ CRITICAL TEST '{test_name}' FAILED!", "ERROR")
                    else:
                        self.log(f"❌ Test '{test_name}' failed - continuing with other tests", "ERROR")
            except Exception as e:
                self.log(f"❌ Unexpected error in test '{test_name}': {str(e)}", "ERROR")
                results[test_name] = False
        
        # Test summary
        self.log("\n" + "=" * 80)
        self.log("📊 APP DO VENDEDOR TEST SUMMARY")
        self.log("=" * 80)
        
        passed = 0
        total = len(results)
        critical_failed = []
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
            elif test_name in critical_tests:
                critical_failed.append(test_name)
        
        self.log(f"\n🎯 Final Result: {passed}/{total} tests passed")
        
        if critical_failed:
            self.log(f"🚨 CRITICAL TESTS FAILED: {', '.join(critical_failed)}", "ERROR")
            return False
        elif passed == total:
            self.log("🎉 ALL APP DO VENDEDOR TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME TESTS FAILED! Check logs above for details.")
            return False

def main():
    """Main test execution"""
    tester = VendedorAppTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()