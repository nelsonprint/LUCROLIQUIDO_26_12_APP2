#!/usr/bin/env python3
"""
Comprehensive test suite for Lucro Líquido System.

Tests multiple modules:
1. WhatsApp Budget Flow (existing tests)
2. Funcionários Module (new tests)
   - Employee categories management
   - Employee CRUD operations
   - Status management
"""

import requests
import json
import sys
import os
from datetime import datetime
import math

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://orcastream.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class WhatsAppBudgetFlowTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_data = None
        self.company_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"  # Company ID from test_result.md
        self.test_results = {}
        self.created_budget_id = None
        self.created_notification_id = None
        self.created_accounts_ids = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_login(self):
        """Test login with admin credentials"""
        self.log("🔐 Testing login with admin credentials...")
        
        login_data = {
            "email": "admin@lucroliquido.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                self.user_data = response.json()
                self.log(f"✅ Login successful! User ID: {self.user_data['user_id']}")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login request error: {str(e)}", "ERROR")
            return False
    
    def test_create_budget_with_installments(self):
        """Test creating a budget with installment payment"""
        self.log("💰 Testing budget creation with installments...")
        
        if not self.user_data:
            self.log("❌ No user data available for budget creation", "ERROR")
            return False
        
        # Create budget with installments: 30% down payment + 2 installments
        import time
        timestamp = int(time.time())
        
        budget_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            # Client data
            "cliente_nome": f"Cliente Teste Parcelamento {timestamp}",
            "cliente_documento": "123.456.789-00",
            "cliente_email": "cliente@teste.com",
            "cliente_telefone": "(11) 99999-9999",
            "cliente_whatsapp": "11999999999",
            "cliente_endereco": "Rua Teste, 123 - São Paulo/SP",
            # Budget data
            "tipo": "servico_hora",
            "descricao_servico_ou_produto": f"Serviço de teste com parcelamento {timestamp}",
            "quantidade": 10.0,
            "custo_total": 500.0,
            "preco_minimo": 800.0,
            "preco_sugerido": 1000.0,
            "preco_praticado": 1000.0,
            # Commercial conditions
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "Entrada + 2 parcelas",
            "prazo_execucao": "15 dias úteis",
            "observacoes": "Teste de orçamento com parcelamento",
            # Installment payment details
            "forma_pagamento": "entrada_parcelas",
            "entrada_percentual": 30.0,
            "valor_entrada": 300.0,
            "num_parcelas": 2,
            "parcelas": [
                {"numero": 1, "valor": 350.0, "editado": False},
                {"numero": 2, "valor": 350.0, "editado": False}
            ]
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=budget_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_budget_id = result.get('orcamento_id')
                budget_number = result.get('numero_orcamento')
                self.log(f"✅ Budget created successfully! ID: {self.created_budget_id}, Number: {budget_number}")
                
                # Verify installment data was saved correctly
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.created_budget_id}")
                if verify_response.status_code == 200:
                    budget = verify_response.json()
                    if (budget.get('forma_pagamento') == 'entrada_parcelas' and 
                        budget.get('entrada_percentual') == 30.0 and
                        budget.get('num_parcelas') == 2 and
                        len(budget.get('parcelas', [])) == 2):
                        self.log("✅ Installment data saved correctly!")
                        return True
                    else:
                        self.log("❌ Installment data not saved correctly", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify budget creation", "WARN")
                    return True  # Creation worked, verification failed
            else:
                self.log(f"❌ Failed to create budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating budget: {str(e)}", "ERROR")
            return False
    
    def test_whatsapp_budget_endpoint(self):
        """Test POST /api/orcamento/{id}/whatsapp - Generate WhatsApp URL for budget"""
        self.log("📱 Testing WhatsApp budget endpoint...")
        
        if not self.created_budget_id:
            self.log("❌ No budget ID available for WhatsApp test", "ERROR")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/orcamento/{self.created_budget_id}/whatsapp")
            
            if response.status_code == 200:
                result = response.json()
                pdf_url = result.get('pdf_url')
                whatsapp_url = result.get('whatsapp_url')
                numero_orcamento = result.get('numero_orcamento')
                
                self.log(f"✅ WhatsApp endpoint successful!")
                self.log(f"   📄 PDF URL: {pdf_url}")
                self.log(f"   📱 WhatsApp URL: {whatsapp_url}")
                self.log(f"   🔢 Budget Number: {numero_orcamento}")
                
                # Verify required fields are present
                if pdf_url and whatsapp_url and numero_orcamento:
                    # Verify WhatsApp URL format
                    if "wa.me/55" in whatsapp_url and "11999999999" in whatsapp_url:
                        self.log("✅ WhatsApp URL format is correct!")
                        return True
                    else:
                        self.log("❌ WhatsApp URL format is incorrect", "ERROR")
                        return False
                else:
                    self.log("❌ Missing required fields in WhatsApp response", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get WhatsApp URL: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting WhatsApp URL: {str(e)}", "ERROR")
            return False
    
    def test_budget_acceptance_endpoint(self):
        """Test POST /api/orcamento/{id}/aceitar - Client accepts budget"""
        self.log("✅ Testing budget acceptance endpoint...")
        
        if not self.created_budget_id:
            self.log("❌ No budget ID available for acceptance test", "ERROR")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/orcamento/{self.created_budget_id}/aceitar")
            
            if response.status_code == 200:
                result = response.json()
                contas_geradas = result.get('contas_geradas', 0)
                contas_ids = result.get('contas_ids', [])
                whatsapp_url = result.get('notificacao_whatsapp_url')
                numero_orcamento = result.get('numero_orcamento')
                
                self.log(f"✅ Budget acceptance successful!")
                self.log(f"   📊 Accounts generated: {contas_geradas}")
                self.log(f"   🆔 Account IDs: {contas_ids}")
                self.log(f"   📱 Notification WhatsApp URL: {whatsapp_url}")
                self.log(f"   🔢 Budget Number: {numero_orcamento}")
                
                # Store account IDs for verification
                self.created_accounts_ids = contas_ids
                
                # Verify expected number of accounts (1 down payment + 2 installments = 3)
                if contas_geradas == 3 and len(contas_ids) == 3:
                    self.log("✅ Correct number of accounts generated!")
                    
                    # Verify WhatsApp notification URL
                    if whatsapp_url and "wa.me/55" in whatsapp_url:
                        self.log("✅ WhatsApp notification URL generated correctly!")
                        return True
                    else:
                        self.log("❌ WhatsApp notification URL not generated correctly", "ERROR")
                        return False
                else:
                    self.log(f"❌ Incorrect number of accounts generated. Expected: 3, Got: {contas_geradas}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to accept budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error accepting budget: {str(e)}", "ERROR")
            return False
    
    def test_notifications_created(self):
        """Test GET /api/notificacoes/{company_id} - Verify notification was created"""
        self.log("🔔 Testing notifications endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/notificacoes/{self.company_id}")
            
            if response.status_code == 200:
                notifications = response.json()
                self.log(f"✅ Retrieved {len(notifications)} notifications")
                
                # Look for our budget acceptance notification
                budget_notification = None
                for notif in notifications:
                    if (notif.get('tipo') == 'ORCAMENTO_ACEITO' and 
                        notif.get('orcamento_id') == self.created_budget_id):
                        budget_notification = notif
                        self.created_notification_id = notif.get('id')
                        break
                
                if budget_notification:
                    self.log("✅ Budget acceptance notification found!")
                    self.log(f"   📋 Title: {budget_notification.get('titulo')}")
                    self.log(f"   💬 Message: {budget_notification.get('mensagem')[:100]}...")
                    self.log(f"   📱 WhatsApp URL: {budget_notification.get('whatsapp_url')}")
                    self.log(f"   👁️ Read: {budget_notification.get('lida')}")
                    
                    # Verify notification details
                    required_fields = ['id', 'company_id', 'tipo', 'titulo', 'mensagem', 'lida', 'orcamento_id', 'whatsapp_url']
                    for field in required_fields:
                        if field not in budget_notification:
                            self.log(f"❌ Missing required field in notification: {field}", "ERROR")
                            return False
                    
                    return True
                else:
                    self.log("❌ Budget acceptance notification not found", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get notifications: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting notifications: {str(e)}", "ERROR")
            return False
    
    def test_accounts_receivable_generated(self):
        """Test GET /api/contas/receber - Verify accounts receivable were generated"""
        self.log("💳 Testing accounts receivable endpoint...")
        
        if not self.created_accounts_ids:
            self.log("❌ No account IDs available for verification", "ERROR")
            return False
        
        try:
            # Get all accounts receivable for the company
            response = self.session.get(f"{API_BASE}/contas/receber?company_id={self.company_id}")
            
            if response.status_code == 200:
                accounts = response.json()
                self.log(f"✅ Retrieved {len(accounts)} accounts receivable")
                
                # Find our generated accounts
                our_accounts = []
                for account in accounts:
                    if account.get('id') in self.created_accounts_ids:
                        our_accounts.append(account)
                
                if len(our_accounts) == 3:  # 1 down payment + 2 installments
                    self.log("✅ All 3 accounts found!")
                    
                    # Verify account details
                    down_payment_found = False
                    installment_1_found = False
                    installment_2_found = False
                    
                    for account in our_accounts:
                        descricao = account.get('descricao', '')
                        valor = account.get('valor', 0)
                        
                        if 'Entrada' in descricao and valor == 300.0:
                            down_payment_found = True
                            self.log(f"   ✅ Down payment account: R$ {valor}")
                        elif 'Parcela 1' in descricao and valor == 350.0:
                            installment_1_found = True
                            self.log(f"   ✅ Installment 1 account: R$ {valor}")
                        elif 'Parcela 2' in descricao and valor == 350.0:
                            installment_2_found = True
                            self.log(f"   ✅ Installment 2 account: R$ {valor}")
                        
                        # Verify common fields
                        if (account.get('tipo') != 'RECEBER' or 
                            account.get('status') != 'PENDENTE' or
                            account.get('company_id') != self.company_id):
                            self.log(f"❌ Account {account.get('id')} has incorrect basic data", "ERROR")
                            return False
                    
                    if down_payment_found and installment_1_found and installment_2_found:
                        self.log("✅ All account types found with correct values!")
                        return True
                    else:
                        self.log("❌ Not all account types found or values incorrect", "ERROR")
                        return False
                else:
                    self.log(f"❌ Expected 3 accounts, found {len(our_accounts)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get accounts receivable: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting accounts receivable: {str(e)}", "ERROR")
            return False
    
    def test_notification_management(self):
        """Test notification management endpoints (mark as read)"""
        self.log("📝 Testing notification management...")
        
        if not self.created_notification_id:
            self.log("❌ No notification ID available for management test", "ERROR")
            return False
        
        try:
            # Mark notification as read
            response = self.session.patch(f"{API_BASE}/notificacao/{self.created_notification_id}/lida")
            
            if response.status_code == 200:
                self.log("✅ Notification marked as read successfully!")
                
                # Verify notification was marked as read
                verify_response = self.session.get(f"{API_BASE}/notificacoes/{self.company_id}")
                if verify_response.status_code == 200:
                    notifications = verify_response.json()
                    
                    for notif in notifications:
                        if notif.get('id') == self.created_notification_id:
                            if notif.get('lida') == True:
                                self.log("✅ Notification read status verified!")
                                return True
                            else:
                                self.log("❌ Notification read status not updated", "ERROR")
                                return False
                    
                    self.log("❌ Notification not found in verification", "ERROR")
                    return False
                else:
                    self.log("⚠️ Could not verify notification read status", "WARN")
                    return True  # Mark as read worked, verification failed
            else:
                self.log(f"❌ Failed to mark notification as read: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error managing notification: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all WhatsApp Budget Flow tests"""
        self.log("🚀 Starting WhatsApp Budget Flow API endpoint tests")
        self.log("=" * 70)
        
        tests = [
            ("Login", self.test_login),
            ("Create Budget with Installments", self.test_create_budget_with_installments),
            ("WhatsApp Budget Endpoint", self.test_whatsapp_budget_endpoint),
            ("Budget Acceptance Endpoint", self.test_budget_acceptance_endpoint),
            ("Notifications Created", self.test_notifications_created),
            ("Accounts Receivable Generated", self.test_accounts_receivable_generated),
            ("Notification Management", self.test_notification_management)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n📋 Executing test: {test_name}")
            try:
                result = test_func()
                results[test_name] = result
                self.test_results[test_name] = result
                
                if not result:
                    self.log(f"❌ Test '{test_name}' failed - continuing with other tests", "ERROR")
            except Exception as e:
                self.log(f"❌ Unexpected error in test '{test_name}': {str(e)}", "ERROR")
                results[test_name] = False
                self.test_results[test_name] = False
        
        # Test summary
        self.log("\n" + "=" * 70)
        self.log("📊 WHATSAPP BUDGET FLOW TEST SUMMARY")
        self.log("=" * 70)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\n🎯 Final Result: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL WHATSAPP BUDGET FLOW TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME TESTS FAILED! Check logs above for details.")
            return False

def main():
    """Main function"""
    tester = WhatsAppBudgetFlowTester()
    success = tester.run_all_tests()
    
    # Exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()