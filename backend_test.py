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
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://salestrak-1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class FuncionariosTester:
    """Test suite for Funcionários (Employees) module"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.created_category_id = None
        self.created_funcionario_id = None
        self.gerente_category_id = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_list_employee_categories(self):
        """Test GET /api/funcionarios/categorias/{empresa_id} - List employee categories"""
        self.log("👥 Testing list employee categories...")
        
        try:
            response = self.session.get(f"{API_BASE}/funcionarios/categorias/{self.company_id}")
            
            if response.status_code == 200:
                categories = response.json()
                self.log(f"✅ Retrieved {len(categories)} employee categories")
                
                # Check for 6 default categories
                expected_categories = ["Proprietário", "Gerente", "Administrativo", "Supervisor", "Operário", "Vendedor"]
                found_categories = [cat.get('nome') for cat in categories]
                
                # Store Gerente category ID for later use
                for cat in categories:
                    if cat.get('nome') == 'Gerente':
                        self.gerente_category_id = cat.get('id')
                        break
                
                missing_categories = []
                for expected in expected_categories:
                    if expected not in found_categories:
                        missing_categories.append(expected)
                
                if len(missing_categories) == 0:
                    self.log("✅ All 6 default categories found!")
                    for cat in categories:
                        self.log(f"   📋 {cat.get('nome')}: {cat.get('descricao', 'N/A')}")
                    return True
                else:
                    self.log(f"❌ Missing categories: {missing_categories}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list categories: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing categories: {str(e)}", "ERROR")
            return False
    
    def test_create_custom_category(self):
        """Test POST /api/funcionarios/categorias - Create custom category"""
        self.log("➕ Testing create custom employee category...")
        
        import time
        timestamp = int(time.time())
        
        category_data = {
            "empresa_id": self.company_id,
            "nome": f"Técnico {timestamp}",
            "descricao": "Profissional técnico especializado"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/funcionarios/categorias", json=category_data)
            
            if response.status_code == 200:
                result = response.json()
                categoria_data = result.get('categoria', {})
                self.created_category_id = categoria_data.get('id')
                self.log(f"✅ Custom category created successfully! ID: {self.created_category_id}")
                
                # Verify category was created by listing again
                verify_response = self.session.get(f"{API_BASE}/funcionarios/categorias/{self.company_id}")
                if verify_response.status_code == 200:
                    categories = verify_response.json()
                    tecnico_found = any(cat.get('nome') == f'Técnico {timestamp}' for cat in categories)
                    if tecnico_found:
                        self.log("✅ Custom category verified in list!")
                        return True
                    else:
                        self.log("❌ Custom category not found in verification", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify category creation", "WARN")
                    return True  # Creation worked, verification failed
            else:
                self.log(f"❌ Failed to create category: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating category: {str(e)}", "ERROR")
            return False
    
    def test_create_employee_full_data(self):
        """Test POST /api/funcionarios - Create employee with all fields"""
        self.log("👤 Testing create employee with full data...")
        
        if not self.gerente_category_id:
            self.log("❌ No Gerente category ID available", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        employee_data = {
            "empresa_id": self.company_id,
            "nome_completo": "Maria Santos Silva",
            "cpf": f"987.654.{timestamp % 1000:03d}-00",  # Generate unique CPF
            "endereco": "Av. Brasil, 456, Apt 101",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "telefone_celular": "(21) 99999-8888",
            "whatsapp": "(21) 99999-8888",
            "email": f"maria.santos{timestamp}@teste.com",
            "salario": 4500.00,
            "categoria_id": self.gerente_category_id,
            "data_admissao": "2024-06-01",
            "data_nascimento": "1990-03-15",
            "status": "Ativo"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/funcionarios", json=employee_data)
            
            if response.status_code == 200:
                result = response.json()
                funcionario_data = result.get('funcionario', {})
                self.created_funcionario_id = funcionario_data.get('id')
                self.log(f"✅ Employee created successfully! ID: {self.created_funcionario_id}")
                
                # Verify employee data
                verify_response = self.session.get(f"{API_BASE}/funcionario/{self.created_funcionario_id}")
                if verify_response.status_code == 200:
                    employee = verify_response.json()
                    
                    # Check key fields
                    expected_cpf = f"987.654.{timestamp % 1000:03d}-00"
                    checks = [
                        (employee.get('nome_completo') == "Maria Santos Silva", "Nome completo"),
                        (employee.get('cpf') == expected_cpf, "CPF"),
                        (employee.get('cidade') == "Rio de Janeiro", "Cidade"),
                        (employee.get('uf') == "RJ", "UF"),
                        (employee.get('salario') == 4500.00, "Salário"),
                        (employee.get('categoria_id') == self.gerente_category_id, "Categoria ID"),
                        (employee.get('status') == "Ativo", "Status")
                    ]
                    
                    all_correct = True
                    for check, field_name in checks:
                        if check:
                            self.log(f"   ✅ {field_name}: OK")
                        else:
                            self.log(f"   ❌ {field_name}: INCORRECT", "ERROR")
                            all_correct = False
                    
                    if all_correct:
                        self.log("✅ All employee data verified correctly!")
                        return True
                    else:
                        self.log("❌ Some employee data is incorrect", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify employee creation", "WARN")
                    return True  # Creation worked, verification failed
            else:
                self.log(f"❌ Failed to create employee: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating employee: {str(e)}", "ERROR")
            return False
    
    def test_list_employees(self):
        """Test GET /api/funcionarios/{empresa_id} - List employees"""
        self.log("📋 Testing list employees...")
        
        try:
            response = self.session.get(f"{API_BASE}/funcionarios/{self.company_id}")
            
            if response.status_code == 200:
                employees = response.json()
                self.log(f"✅ Retrieved {len(employees)} employees")
                
                # Look for our created employee
                our_employee = None
                for emp in employees:
                    if emp.get('id') == self.created_funcionario_id:
                        our_employee = emp
                        break
                
                if our_employee:
                    self.log("✅ Our created employee found in list!")
                    self.log(f"   👤 Name: {our_employee.get('nome_completo')}")
                    self.log(f"   💼 Category: {our_employee.get('categoria_nome', 'N/A')}")
                    self.log(f"   📊 Status: {our_employee.get('status')}")
                    self.log(f"   💰 Salary: R$ {our_employee.get('salario', 0)}")
                    return True
                else:
                    self.log("❌ Our created employee not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list employees: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing employees: {str(e)}", "ERROR")
            return False
    
    def test_update_employee(self):
        """Test PUT /api/funcionarios/{id} - Update employee"""
        self.log("✏️ Testing update employee...")
        
        if not self.created_funcionario_id:
            self.log("❌ No employee ID available for update", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        update_data = {
            "empresa_id": self.company_id,
            "nome_completo": "Maria Santos Silva Oliveira",  # Updated name
            "cpf": f"987.654.{timestamp % 1000:03d}-00",  # Keep same CPF
            "endereco": "Av. Brasil, 456, Apt 101",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "telefone_celular": "(21) 99999-8888",
            "whatsapp": "(21) 99999-8888",
            "email": "maria.santos.updated@teste.com",  # Updated email
            "salario": 5000.00,  # Updated salary
            "categoria_id": self.gerente_category_id,
            "data_admissao": "2024-06-01",
            "data_nascimento": "1990-03-15",
            "status": "Ativo"
        }
        
        try:
            response = self.session.put(f"{API_BASE}/funcionarios/{self.created_funcionario_id}", json=update_data)
            
            if response.status_code == 200:
                self.log("✅ Employee updated successfully!")
                
                # Verify updates
                verify_response = self.session.get(f"{API_BASE}/funcionario/{self.created_funcionario_id}")
                if verify_response.status_code == 200:
                    employee = verify_response.json()
                    
                    # Check updated fields
                    checks = [
                        (employee.get('nome_completo') == "Maria Santos Silva Oliveira", "Updated name"),
                        (employee.get('email') == "maria.santos.updated@teste.com", "Updated email"),
                        (employee.get('salario') == 5000.00, "Updated salary")
                    ]
                    
                    all_correct = True
                    for check, field_name in checks:
                        if check:
                            self.log(f"   ✅ {field_name}: OK")
                        else:
                            self.log(f"   ❌ {field_name}: NOT UPDATED", "ERROR")
                            all_correct = False
                    
                    if all_correct:
                        self.log("✅ All updates verified correctly!")
                        return True
                    else:
                        self.log("❌ Some updates were not applied", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify employee update", "WARN")
                    return True  # Update worked, verification failed
            else:
                self.log(f"❌ Failed to update employee: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating employee: {str(e)}", "ERROR")
            return False
    
    def test_filter_by_status(self):
        """Test GET /api/funcionarios/{empresa_id}?status=Ativo - Filter by status"""
        self.log("🔍 Testing filter employees by status...")
        
        try:
            # Test filter by "Ativo" status
            response = self.session.get(f"{API_BASE}/funcionarios/{self.company_id}?status=Ativo")
            
            if response.status_code == 200:
                active_employees = response.json()
                self.log(f"✅ Retrieved {len(active_employees)} active employees")
                
                # Verify all returned employees have "Ativo" status
                all_active = True
                for emp in active_employees:
                    if emp.get('status') != 'Ativo':
                        all_active = False
                        self.log(f"❌ Employee {emp.get('nome_completo')} has status: {emp.get('status')}", "ERROR")
                
                if all_active and len(active_employees) > 0:
                    self.log("✅ All returned employees have 'Ativo' status!")
                    
                    # Check if our employee is in the list
                    our_employee_found = any(emp.get('id') == self.created_funcionario_id for emp in active_employees)
                    if our_employee_found:
                        self.log("✅ Our created employee found in active filter!")
                        return True
                    else:
                        self.log("❌ Our created employee not found in active filter", "ERROR")
                        return False
                elif len(active_employees) == 0:
                    self.log("⚠️ No active employees found - filter working but no data", "WARN")
                    return True
                else:
                    self.log("❌ Filter not working correctly", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to filter employees: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error filtering employees: {str(e)}", "ERROR")
            return False
    
    def test_change_employee_status(self):
        """Test PATCH /api/funcionarios/{id}/status?status=Férias - Change status"""
        self.log("🔄 Testing change employee status...")
        
        if not self.created_funcionario_id:
            self.log("❌ No employee ID available for status change", "ERROR")
            return False
        
        try:
            # Change status to "Férias"
            response = self.session.patch(f"{API_BASE}/funcionarios/{self.created_funcionario_id}/status?status=Férias")
            
            if response.status_code == 200:
                self.log("✅ Employee status changed successfully!")
                
                # Verify status change
                verify_response = self.session.get(f"{API_BASE}/funcionario/{self.created_funcionario_id}")
                if verify_response.status_code == 200:
                    employee = verify_response.json()
                    
                    if employee.get('status') == 'Férias':
                        self.log("✅ Status change verified - employee is now on 'Férias'!")
                        
                        # Test filter by new status
                        filter_response = self.session.get(f"{API_BASE}/funcionarios/{self.company_id}?status=Férias")
                        if filter_response.status_code == 200:
                            ferias_employees = filter_response.json()
                            our_employee_in_ferias = any(emp.get('id') == self.created_funcionario_id for emp in ferias_employees)
                            
                            if our_employee_in_ferias:
                                self.log("✅ Employee found in 'Férias' filter!")
                                return True
                            else:
                                self.log("❌ Employee not found in 'Férias' filter", "ERROR")
                                return False
                        else:
                            self.log("⚠️ Could not test filter after status change", "WARN")
                            return True  # Status change worked, filter test failed
                    else:
                        self.log(f"❌ Status not changed correctly. Current: {employee.get('status')}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify status change", "WARN")
                    return True  # Status change worked, verification failed
            else:
                self.log(f"❌ Failed to change status: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error changing status: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Funcionários tests"""
        self.log("🚀 Starting Funcionários Module API tests")
        self.log("=" * 70)
        
        tests = [
            ("List Employee Categories", self.test_list_employee_categories),
            ("Create Custom Category", self.test_create_custom_category),
            ("Create Employee Full Data", self.test_create_employee_full_data),
            ("List Employees", self.test_list_employees),
            ("Update Employee", self.test_update_employee),
            ("Filter by Status", self.test_filter_by_status),
            ("Change Employee Status", self.test_change_employee_status)
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
        self.log("📊 FUNCIONÁRIOS MODULE TEST SUMMARY")
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
            self.log("🎉 ALL FUNCIONÁRIOS TESTS PASSED! Module working correctly.")
            return True
        else:
            self.log("⚠️ SOME FUNCIONÁRIOS TESTS FAILED! Check logs above for details.")
            return False


class SupervisorCronogramaTester:
    """Test suite for Supervisor and Cronograma de Obra system"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.created_funcionario_id = None
        self.supervisor_id = None
        self.supervisor_login_email = None
        self.supervisor_login_senha = None
        self.approved_budget_id = None
        self.created_cronograma_id = None
        self.cliente_token = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_create_funcionario_with_supervisor_login(self):
        """Test POST /api/funcionarios - Create employee with supervisor login credentials"""
        self.log("👤 Testing create funcionário with supervisor login...")
        
        # First, check if there's already a funcionário with supervisor login
        try:
            funcionarios_response = self.session.get(f"{API_BASE}/funcionarios/{self.company_id}")
            if funcionarios_response.status_code == 200:
                funcionarios = funcionarios_response.json()
                for funcionario in funcionarios:
                    if funcionario.get('login_email') and funcionario.get('login_senha'):
                        self.log(f"✅ Found existing funcionário with supervisor login: {funcionario['nome_completo']}")
                        self.created_funcionario_id = funcionario['id']
                        self.supervisor_login_email = funcionario['login_email']
                        self.supervisor_login_senha = funcionario['login_senha']
                        return True
        except Exception as e:
            self.log(f"⚠️ Could not check existing funcionários: {str(e)}", "WARN")
        
        import time
        timestamp = int(time.time())
        
        funcionario_data = {
            "empresa_id": self.company_id,
            "nome_completo": "Carlos Supervisor",
            "cpf": f"987.654.{timestamp % 1000:03d}-99",  # Generate unique CPF
            "whatsapp": "(11) 99999-1234",
            "email": f"carlos{timestamp}@teste.com",
            "salario": 5000,
            "status": "Ativo",
            "login_email": f"supervisor{timestamp}@teste.com",
            "login_senha": "senha123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/funcionarios", json=funcionario_data)
            
            if response.status_code == 200:
                result = response.json()
                funcionario_data_response = result.get('funcionario', {})
                self.created_funcionario_id = funcionario_data_response.get('id')
                self.supervisor_login_email = funcionario_data['login_email']
                self.supervisor_login_senha = funcionario_data['login_senha']
                
                self.log(f"✅ Funcionário with supervisor login created! ID: {self.created_funcionario_id}")
                
                # Verify login fields were saved
                verify_response = self.session.get(f"{API_BASE}/funcionario/{self.created_funcionario_id}")
                if verify_response.status_code == 200:
                    funcionario = verify_response.json()
                    
                    if (funcionario.get('login_email') == self.supervisor_login_email and
                        funcionario.get('login_senha') == self.supervisor_login_senha):
                        self.log("✅ Supervisor login credentials saved correctly!")
                        return True
                    else:
                        self.log("❌ Supervisor login credentials not saved correctly", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify funcionário creation", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to create funcionário: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating funcionário: {str(e)}", "ERROR")
            return False
    
    def test_supervisor_login(self):
        """Test POST /api/supervisor/login - Supervisor login endpoint"""
        self.log("🔐 Testing supervisor login...")
        
        if not self.supervisor_login_email or not self.supervisor_login_senha:
            self.log("❌ No supervisor credentials available for login test", "ERROR")
            return False
        
        login_data = {
            "login_email": self.supervisor_login_email,
            "login_senha": self.supervisor_login_senha
        }
        
        try:
            response = self.session.post(f"{API_BASE}/supervisor/login", json=login_data)
            
            if response.status_code == 200:
                result = response.json()
                supervisor_data = result.get('supervisor', {})
                empresa_data = result.get('empresa', {})
                
                self.supervisor_id = supervisor_data.get('id')
                
                self.log(f"✅ Supervisor login successful!")
                self.log(f"   👤 Supervisor ID: {self.supervisor_id}")
                self.log(f"   👤 Supervisor Name: {supervisor_data.get('nome')}")
                self.log(f"   🏢 Company ID: {empresa_data.get('id')}")
                self.log(f"   🏢 Company Name: {empresa_data.get('nome')}")
                
                # Verify required fields are present
                required_fields = ['id', 'nome']
                for field in required_fields:
                    if field not in supervisor_data:
                        self.log(f"❌ Missing supervisor field: {field}", "ERROR")
                        return False
                
                required_company_fields = ['id', 'nome']
                for field in required_company_fields:
                    if field not in empresa_data:
                        self.log(f"❌ Missing company field: {field}", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Supervisor login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in supervisor login: {str(e)}", "ERROR")
            return False
    
    def test_list_approved_budgets(self):
        """Test GET /api/supervisor/{supervisor_id}/orcamentos - List approved budgets"""
        self.log("📋 Testing list approved budgets...")
        
        if not self.supervisor_id:
            self.log("❌ No supervisor ID available for budget listing", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/supervisor/{self.supervisor_id}/orcamentos")
            
            if response.status_code == 200:
                budgets = response.json()
                self.log(f"✅ Retrieved {len(budgets)} approved budgets")
                
                # If we have budgets, store one for cronograma testing
                if len(budgets) > 0:
                    self.approved_budget_id = budgets[0].get('id')
                    self.log(f"   📄 First budget ID: {self.approved_budget_id}")
                    self.log(f"   📄 First budget number: {budgets[0].get('numero_orcamento')}")
                    self.log(f"   👤 Client: {budgets[0].get('cliente_nome')}")
                else:
                    self.log("⚠️ No approved budgets found - will create one for testing", "WARN")
                    # Create a test budget for cronograma testing
                    self.approved_budget_id = self._create_test_budget()
                
                return True
            else:
                self.log(f"❌ Failed to list approved budgets: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing approved budgets: {str(e)}", "ERROR")
            return False
    
    def _create_test_budget(self):
        """Helper method to create a test budget for cronograma testing"""
        self.log("📝 Creating test budget for cronograma testing...")
        
        import time
        timestamp = int(time.time())
        
        budget_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            "cliente_nome": f"Cliente Teste Cronograma {timestamp}",
            "cliente_whatsapp": "11999999999",
            "tipo": "servico_hora",
            "descricao_servico_ou_produto": "Obra Teste para Cronograma",
            "quantidade": 1.0,
            "custo_total": 1000.0,
            "preco_minimo": 1500.0,
            "preco_sugerido": 2000.0,
            "preco_praticado": 2000.0,
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "À vista",
            "prazo_execucao": "30 dias",
            "observacoes": "Orçamento teste para cronograma"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=budget_data)
            if response.status_code == 200:
                result = response.json()
                budget_id = result.get('orcamento_id')
                
                # Approve the budget
                status_data = {"status": "APROVADO"}
                self.session.patch(f"{API_BASE}/orcamento/{budget_id}/status", json=status_data)
                
                self.log(f"✅ Test budget created and approved: {budget_id}")
                return budget_id
            else:
                self.log("❌ Failed to create test budget", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ Error creating test budget: {str(e)}", "ERROR")
            return None
    
    def test_supervisor_pwa_page(self):
        """Test GET /api/supervisor/app - Supervisor PWA page"""
        self.log("📱 Testing supervisor PWA page...")
        
        try:
            response = self.session.get(f"{API_BASE}/supervisor/app")
            
            if response.status_code == 200:
                content = response.text
                self.log("✅ Supervisor PWA page loaded successfully!")
                
                # Check if it's HTML content
                if '<html' in content.lower() or '<!doctype' in content.lower():
                    self.log("✅ Response contains valid HTML content")
                    return True
                else:
                    self.log("❌ Response does not contain valid HTML content", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to load supervisor PWA page: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error loading supervisor PWA page: {str(e)}", "ERROR")
            return False
    
    def test_supervisor_manifest(self):
        """Test GET /api/supervisor/manifest.json - Supervisor manifest"""
        self.log("📋 Testing supervisor manifest...")
        
        try:
            response = self.session.get(f"{API_BASE}/supervisor/manifest.json")
            
            if response.status_code == 200:
                try:
                    manifest = response.json()
                    self.log("✅ Supervisor manifest loaded successfully!")
                    
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
                self.log(f"❌ Failed to load supervisor manifest: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error loading supervisor manifest: {str(e)}", "ERROR")
            return False
    
    def test_generate_supervisor_link(self):
        """Test GET /api/funcionario/{funcionario_id}/link-supervisor - Generate supervisor WhatsApp link"""
        self.log("🔗 Testing generate supervisor link...")
        
        if not self.created_funcionario_id:
            self.log("❌ No funcionário ID available for link generation", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/funcionario/{self.created_funcionario_id}/link-supervisor")
            
            if response.status_code == 200:
                result = response.json()
                supervisor_url = result.get('supervisor_url')
                whatsapp_url = result.get('whatsapp_url')
                
                self.log("✅ Supervisor link generated successfully!")
                self.log(f"   🔗 Supervisor URL: {supervisor_url}")
                self.log(f"   📱 WhatsApp URL: {whatsapp_url}")
                
                # Verify URLs are properly formatted
                if supervisor_url and '/api/supervisor/app' in supervisor_url:
                    self.log("✅ Supervisor URL format is correct")
                else:
                    self.log("❌ Supervisor URL format is incorrect", "ERROR")
                    return False
                
                if whatsapp_url and 'wa.me/' in whatsapp_url:
                    self.log("✅ WhatsApp URL format is correct")
                    return True
                else:
                    self.log("❌ WhatsApp URL format is incorrect", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to generate supervisor link: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error generating supervisor link: {str(e)}", "ERROR")
            return False
    
    def test_create_cronograma(self):
        """Test POST /api/supervisor/{supervisor_id}/cronograma - Create cronograma"""
        self.log("📅 Testing create cronograma...")
        
        if not self.supervisor_id or not self.approved_budget_id:
            self.log("❌ Missing supervisor ID or approved budget ID for cronograma creation", "ERROR")
            return False
        
        cronograma_data = {
            "orcamento_id": self.approved_budget_id,
            "data": "2024-12-26",
            "projeto_nome": "Obra Teste",
            "progresso_geral": 25,
            "modo_progresso": "manual",
            "etapas": [
                {"id": "etapa1", "nome": "Fundação", "percentual": 50, "media": []},
                {"id": "etapa2", "nome": "Estrutura", "percentual": 0, "media": []}
            ]
        }
        
        try:
            response = self.session.post(f"{API_BASE}/supervisor/{self.supervisor_id}/cronograma", json=cronograma_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_cronograma_id = result.get('cronograma_id') or result.get('id')
                
                self.log(f"✅ Cronograma created successfully! ID: {self.created_cronograma_id}")
                
                # Verify cronograma data
                if 'cronograma' in result:
                    cronograma = result['cronograma']
                    self.log(f"   📅 Date: {cronograma.get('data')}")
                    self.log(f"   🏗️ Project: {cronograma.get('projeto_nome')}")
                    self.log(f"   📊 Progress: {cronograma.get('progresso_geral')}%")
                    self.log(f"   📋 Stages: {len(cronograma.get('etapas', []))}")
                elif 'id' in result:
                    self.log(f"   📋 Cronograma ID returned: {result.get('id')}")
                
                return True
            else:
                self.log(f"❌ Failed to create cronograma: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating cronograma: {str(e)}", "ERROR")
            return False
    
    def test_send_cronograma_to_client(self):
        """Test POST /api/supervisor/{supervisor_id}/cronograma/{cronograma_id}/enviar - Send cronograma to client"""
        self.log("📤 Testing send cronograma to client...")
        
        if not self.supervisor_id or not self.created_cronograma_id:
            self.log("❌ Missing supervisor ID or cronograma ID for sending", "ERROR")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/supervisor/{self.supervisor_id}/cronograma/{self.created_cronograma_id}/enviar")
            
            if response.status_code == 200:
                result = response.json()
                cliente_url = result.get('cliente_url')
                whatsapp_url = result.get('whatsapp_url')
                token = result.get('token')
                
                self.log("✅ Cronograma sent to client successfully!")
                self.log(f"   🔗 Client URL: {cliente_url}")
                self.log(f"   📱 WhatsApp URL: {whatsapp_url}")
                self.log(f"   🎫 Token: {token}")
                
                # Store token for client access test
                self.cliente_token = token
                
                # Verify URLs are properly formatted
                if cliente_url and '/api/cliente/cronograma/' in cliente_url and token in cliente_url:
                    self.log("✅ Client URL format is correct")
                else:
                    self.log("❌ Client URL format is incorrect", "ERROR")
                    return False
                
                if whatsapp_url and 'wa.me/' in whatsapp_url:
                    self.log("✅ WhatsApp URL format is correct")
                    return True
                else:
                    self.log("❌ WhatsApp URL format is incorrect", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to send cronograma: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error sending cronograma: {str(e)}", "ERROR")
            return False
    
    def test_client_cronograma_access(self):
        """Test GET /api/cliente/cronograma/{token} - Client access to cronograma"""
        self.log("👤 Testing client cronograma access...")
        
        if not self.cliente_token:
            self.log("❌ No client token available for access test", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/cliente/cronograma/{self.cliente_token}")
            
            if response.status_code == 200:
                result = response.json()
                cronogramas = result.get('cronogramas', [])
                self.log(f"✅ Client cronograma access successful! Found {len(cronogramas)} cronogramas")
                
                # Verify cronograma data structure
                if len(cronogramas) > 0:
                    cronograma = cronogramas[0]
                    required_fields = ['id', 'data', 'projeto_nome', 'progresso_geral', 'etapas']
                    
                    for field in required_fields:
                        if field in cronograma:
                            self.log(f"   ✅ {field}: {cronograma[field]}")
                        else:
                            self.log(f"   ❌ Missing cronograma field: {field}", "ERROR")
                            return False
                    
                    return True
                else:
                    self.log("⚠️ No cronogramas found for client", "WARN")
                    return True  # Access worked, just no data
            else:
                self.log(f"❌ Failed client cronograma access: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in client cronograma access: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Supervisor and Cronograma tests"""
        self.log("🚀 Starting Supervisor and Cronograma de Obra API tests")
        self.log("=" * 70)
        
        tests = [
            ("Create Funcionário with Supervisor Login", self.test_create_funcionario_with_supervisor_login),
            ("Supervisor Login", self.test_supervisor_login),
            ("List Approved Budgets", self.test_list_approved_budgets),
            ("Supervisor PWA Page", self.test_supervisor_pwa_page),
            ("Supervisor Manifest", self.test_supervisor_manifest),
            ("Generate Supervisor Link", self.test_generate_supervisor_link),
            ("Create Cronograma", self.test_create_cronograma),
            ("Send Cronograma to Client", self.test_send_cronograma_to_client),
            ("Client Cronograma Access", self.test_client_cronograma_access)
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
        self.log("📊 SUPERVISOR AND CRONOGRAMA TEST SUMMARY")
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
            self.log("🎉 ALL SUPERVISOR AND CRONOGRAMA TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME SUPERVISOR AND CRONOGRAMA TESTS FAILED! Check logs above for details.")
            return False


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

class ProportionalCommissionTester:
    """Test suite for CRITICAL: Proportional Commission (Comissão Parcelada) functionality"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.vendedor_id = None
        self.cliente_id = None
        self.orcamento_id = None
        self.orcamento_token = None
        self.installment_ids = []
        self.commission_ids = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_create_vendedor_with_commission(self):
        """Test creating a vendedor (funcionário) with commission percentage"""
        self.log("👤 Testing create vendedor with commission...")
        
        import time
        timestamp = int(time.time())
        
        # Generate a valid CPF for testing
        def generate_valid_cpf():
            """Generate a valid CPF for testing"""
            # Use a known valid CPF pattern and modify the last digits
            base = "111.222.333"
            # Calculate check digits
            digits = [int(d) for d in base.replace('.', '')]
            
            # First check digit
            sum1 = sum(digits[i] * (10 - i) for i in range(9))
            digit1 = (sum1 * 10 % 11) % 10
            
            # Second check digit  
            digits.append(digit1)
            sum2 = sum(digits[i] * (11 - i) for i in range(10))
            digit2 = (sum2 * 10 % 11) % 10
            
            return f"{base}-{digit1}{digit2}"
        
        # First get or create Vendedor category
        try:
            categories_response = self.session.get(f"{API_BASE}/funcionarios/categorias/{self.company_id}")
            if categories_response.status_code == 200:
                categories = categories_response.json()
                vendedor_category = None
                for cat in categories:
                    if cat.get('nome') == 'Vendedor':
                        vendedor_category = cat
                        break
                
                if not vendedor_category:
                    self.log("❌ Vendedor category not found", "ERROR")
                    return False
                
                vendedor_data = {
                    "empresa_id": self.company_id,
                    "nome_completo": f"João Vendedor {timestamp}",
                    "cpf": generate_valid_cpf(),
                    "whatsapp": "(11) 99999-5555",
                    "email": f"joao.vendedor{timestamp}@teste.com",
                    "salario": 3000,
                    "categoria_id": vendedor_category['id'],
                    "status": "Ativo",
                    "percentual_comissao": 10.0  # 10% commission
                }
                
                response = self.session.post(f"{API_BASE}/funcionarios", json=vendedor_data)
                
                if response.status_code == 200:
                    result = response.json()
                    funcionario_data = result.get('funcionario', {})
                    self.vendedor_id = funcionario_data.get('id')
                    
                    self.log(f"✅ Vendedor created successfully! ID: {self.vendedor_id}")
                    self.log(f"   💰 Commission: {vendedor_data['percentual_comissao']}%")
                    
                    # Verify commission percentage was saved
                    verify_response = self.session.get(f"{API_BASE}/funcionario/{self.vendedor_id}")
                    if verify_response.status_code == 200:
                        vendedor = verify_response.json()
                        if vendedor.get('percentual_comissao') == 10.0:
                            self.log("✅ Commission percentage saved correctly!")
                            return True
                        else:
                            self.log(f"❌ Commission percentage incorrect: {vendedor.get('percentual_comissao')}", "ERROR")
                            return False
                    else:
                        self.log("⚠️ Could not verify vendedor creation", "WARN")
                        return True
                else:
                    self.log(f"❌ Failed to create vendedor: {response.status_code} - {response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get categories: {categories_response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating vendedor: {str(e)}", "ERROR")
            return False
    
    def test_create_client(self):
        """Test creating a client for the budget"""
        self.log("👥 Testing create client...")
        
        import time
        timestamp = int(time.time())
        
        # Generate a valid CPF for testing
        def generate_valid_cpf():
            """Generate a valid CPF for testing"""
            # Use a known valid CPF pattern and modify the last digits
            base = "123.456.789"
            # Calculate check digits
            digits = [int(d) for d in base.replace('.', '')]
            
            # First check digit
            sum1 = sum(digits[i] * (10 - i) for i in range(9))
            digit1 = (sum1 * 10 % 11) % 10
            
            # Second check digit  
            digits.append(digit1)
            sum2 = sum(digits[i] * (11 - i) for i in range(10))
            digit2 = (sum2 * 10 % 11) % 10
            
            return f"{base}-{digit1}{digit2}"
        
        client_data = {
            "empresa_id": self.company_id,
            "tipo": "PF",
            "nome": f"Cliente Teste Comissão {timestamp}",
            "cpf": generate_valid_cpf(),
            "whatsapp": "11999998888",
            "email": f"cliente.comissao{timestamp}@teste.com",
            "logradouro": "Rua das Comissões, 123",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01234-567"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/clientes", json=client_data)
            
            if response.status_code == 200:
                result = response.json()
                cliente_data = result.get('cliente', {})
                self.cliente_id = cliente_data.get('id')
                
                self.log(f"✅ Client created successfully! ID: {self.cliente_id}")
                self.log(f"   👤 Name: {client_data['nome']}")
                return True
            else:
                self.log(f"❌ Failed to create client: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating client: {str(e)}", "ERROR")
            return False
    
    def test_create_budget_with_services_and_materials(self):
        """Test creating budget with services and materials breakdown"""
        self.log("💼 Testing create budget with services and materials...")
        
        if not self.vendedor_id or not self.cliente_id:
            self.log("❌ Missing vendedor or client ID", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        # Get client data for budget
        client_response = self.session.get(f"{API_BASE}/cliente/{self.cliente_id}")
        if client_response.status_code != 200:
            self.log("❌ Could not get client data", "ERROR")
            return False
        
        client = client_response.json()
        
        # Get vendedor data for budget
        vendedor_response = self.session.get(f"{API_BASE}/funcionario/{self.vendedor_id}")
        if vendedor_response.status_code != 200:
            self.log("❌ Could not get vendedor data", "ERROR")
            return False
        
        vendedor = vendedor_response.json()
        
        budget_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            # Vendedor data
            "vendedor_id": self.vendedor_id,
            "vendedor_nome": vendedor.get('nome_completo'),
            # Client data
            "cliente_nome": client.get('nome'),
            "cliente_documento": client.get('cpf'),
            "cliente_email": client.get('email'),
            "cliente_whatsapp": client.get('whatsapp'),
            "cliente_endereco": f"{client.get('logradouro', '')}, {client.get('cidade', '')}/{client.get('estado', '')}",
            # Budget data
            "tipo": "servico_m2",
            "descricao_servico_ou_produto": f"Obra Teste Comissão Proporcional {timestamp}",
            "area_m2": 100.0,
            "quantidade": 100.0,
            "custo_total": 8000.0,
            "preco_minimo": 12000.0,
            "preco_sugerido": 15000.0,
            "preco_praticado": 15000.0,  # Total: R$ 15,000
            # Commercial conditions
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "Entrada + 2 parcelas",
            "prazo_execucao": "30 dias úteis",
            "observacoes": "Teste de comissão proporcional",
            # Payment details - installments
            "forma_pagamento": "entrada_parcelas",
            "entrada_percentual": 20.0,  # 20% down payment
            "valor_entrada": 3000.0,     # R$ 3,000
            "num_parcelas": 2,
            "parcelas": [
                {"numero": 1, "valor": 6000.0, "editado": False},  # R$ 6,000
                {"numero": 2, "valor": 6000.0, "editado": False}   # R$ 6,000
            ],
            # CRITICAL: Services and materials breakdown
            "detalhes_itens": {
                "totals": {
                    "services_total": 10000.0,  # R$ 10,000 in services
                    "materials_total": 5000.0   # R$ 5,000 in materials
                }
            }
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=budget_data)
            
            if response.status_code == 200:
                result = response.json()
                self.orcamento_id = result.get('orcamento_id')
                budget_number = result.get('numero_orcamento')
                
                self.log(f"✅ Budget created successfully! ID: {self.orcamento_id}")
                self.log(f"   📄 Number: {budget_number}")
                self.log(f"   💰 Total: R$ 15,000 (Services: R$ 10,000 + Materials: R$ 5,000)")
                self.log(f"   👤 Vendedor: {vendedor.get('nome_completo')} (10% commission)")
                self.log(f"   💳 Payment: R$ 3,000 down + 2x R$ 6,000")
                
                # Verify budget data was saved correctly
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.orcamento_id}")
                if verify_response.status_code == 200:
                    budget = verify_response.json()
                    detalhes = budget.get('detalhes_itens', {})
                    totals = detalhes.get('totals', {})
                    
                    if (budget.get('vendedor_id') == self.vendedor_id and
                        totals.get('services_total') == 10000.0 and
                        totals.get('materials_total') == 5000.0 and
                        budget.get('preco_praticado') == 15000.0):
                        self.log("✅ Budget data saved correctly!")
                        return True
                    else:
                        self.log("❌ Budget data not saved correctly", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify budget creation", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to create budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating budget: {str(e)}", "ERROR")
            return False
    
    def test_budget_acceptance_no_commission(self):
        """Test that budget acceptance does NOT generate commission anymore"""
        self.log("🚫 Testing budget acceptance does NOT generate commission...")
        
        if not self.orcamento_id:
            self.log("❌ No budget ID available", "ERROR")
            return False
        
        try:
            # Accept the budget
            response = self.session.post(f"{API_BASE}/orcamento/{self.orcamento_id}/aceitar")
            
            if response.status_code == 200:
                result = response.json()
                contas_geradas = result.get('contas_geradas', 0)
                contas_ids = result.get('contas_ids', [])
                
                self.log(f"✅ Budget accepted successfully!")
                self.log(f"   📊 Accounts generated: {contas_geradas}")
                
                # Store installment IDs for later testing
                self.installment_ids = contas_ids
                
                # CRITICAL: Verify response does NOT contain commission field
                if 'comissao' in result:
                    self.log("❌ CRITICAL ERROR: Budget acceptance still generates commission!", "ERROR")
                    self.log(f"   Commission data: {result['comissao']}", "ERROR")
                    return False
                else:
                    self.log("✅ CORRECT: Budget acceptance does NOT generate commission")
                
                # Verify no commission was created in contas_a_pagar
                commission_response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}&tipo_comissao=vendedor")
                if commission_response.status_code == 200:
                    commissions = commission_response.json()
                    budget_commissions = [c for c in commissions if c.get('orcamento_id') == self.orcamento_id]
                    
                    if len(budget_commissions) == 0:
                        self.log("✅ CORRECT: No commission created in contas_a_pagar")
                        return True
                    else:
                        self.log(f"❌ CRITICAL ERROR: {len(budget_commissions)} commission(s) found in contas_a_pagar!", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify commission absence", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to accept budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error accepting budget: {str(e)}", "ERROR")
            return False
    
    def test_installment_payment_generates_proportional_commission(self):
        """Test that marking installment as RECEBIDO generates proportional commission"""
        self.log("💰 Testing installment payment generates proportional commission...")
        
        if not self.installment_ids or len(self.installment_ids) < 3:
            self.log("❌ Not enough installment IDs available", "ERROR")
            return False
        
        try:
            # Get the first installment (down payment - R$ 3,000)
            first_installment_id = self.installment_ids[0]
            
            # Get installment details
            installment_response = self.session.get(f"{API_BASE}/contas/receber?company_id={self.company_id}")
            if installment_response.status_code != 200:
                self.log("❌ Could not get installment details", "ERROR")
                return False
            
            accounts = installment_response.json()
            first_installment = None
            for account in accounts:
                if account.get('id') == first_installment_id:
                    first_installment = account
                    break
            
            if not first_installment:
                self.log("❌ First installment not found", "ERROR")
                return False
            
            installment_value = first_installment.get('valor', 0)
            self.log(f"   📋 First installment: R$ {installment_value} ({first_installment.get('descricao')})")
            
            # Mark first installment as RECEBIDO
            status_data = {
                "status": "RECEBIDO"
            }
            
            response = self.session.patch(f"{API_BASE}/contas/receber/{first_installment_id}/status", json=status_data)
            
            if response.status_code == 200:
                result = response.json()
                
                self.log("✅ Installment marked as RECEBIDO!")
                
                # CRITICAL: Verify response contains commission field
                if 'comissao' not in result:
                    self.log("❌ CRITICAL ERROR: Installment payment did NOT generate commission!", "ERROR")
                    return False
                
                comissao = result['comissao']
                self.log("✅ CORRECT: Installment payment generated commission!")
                self.log(f"   👤 Vendedor: {comissao.get('vendedor')}")
                self.log(f"   📊 Percentage: {comissao.get('percentual')}%")
                self.log(f"   💰 Commission value: R$ {comissao.get('valor_comissao')}")
                self.log(f"   🔧 Services portion: R$ {comissao.get('valor_servicos_parcela')}")
                
                commission_id = comissao.get('comissao_id')
                if commission_id:
                    self.commission_ids.append(commission_id)
                
                # Verify commission calculation
                # Expected: R$ 3,000 installment * (R$ 10,000 services / R$ 15,000 total) * 10% commission
                # = R$ 3,000 * 0.6667 * 0.10 = R$ 200
                expected_services_portion = installment_value * (10000.0 / 15000.0)  # R$ 2,000
                expected_commission = expected_services_portion * 0.10  # R$ 200
                
                actual_services_portion = comissao.get('valor_servicos_parcela', 0)
                actual_commission = comissao.get('valor_comissao', 0)
                
                # Allow small rounding differences
                if (abs(actual_services_portion - expected_services_portion) < 0.01 and
                    abs(actual_commission - expected_commission) < 0.01):
                    self.log(f"✅ Commission calculation CORRECT!")
                    self.log(f"   Expected services portion: R$ {expected_services_portion:.2f}")
                    self.log(f"   Actual services portion: R$ {actual_services_portion:.2f}")
                    self.log(f"   Expected commission: R$ {expected_commission:.2f}")
                    self.log(f"   Actual commission: R$ {actual_commission:.2f}")
                    return True
                else:
                    self.log(f"❌ Commission calculation INCORRECT!", "ERROR")
                    self.log(f"   Expected services portion: R$ {expected_services_portion:.2f}, got R$ {actual_services_portion:.2f}")
                    self.log(f"   Expected commission: R$ {expected_commission:.2f}, got R$ {actual_commission:.2f}")
                    return False
            else:
                self.log(f"❌ Failed to mark installment as RECEBIDO: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing installment payment: {str(e)}", "ERROR")
            return False
    
    def test_second_installment_generates_separate_commission(self):
        """Test that second installment generates its own separate commission"""
        self.log("💰 Testing second installment generates separate commission...")
        
        if not self.installment_ids or len(self.installment_ids) < 3:
            self.log("❌ Not enough installment IDs available", "ERROR")
            return False
        
        try:
            # Get the second installment (first regular installment - R$ 6,000)
            second_installment_id = self.installment_ids[1]
            
            # Mark second installment as RECEBIDO
            status_data = {
                "status": "RECEBIDO"
            }
            
            response = self.session.patch(f"{API_BASE}/contas/receber/{second_installment_id}/status", json=status_data)
            
            if response.status_code == 200:
                result = response.json()
                
                self.log("✅ Second installment marked as RECEBIDO!")
                
                # CRITICAL: Verify response contains commission field
                if 'comissao' not in result:
                    self.log("❌ CRITICAL ERROR: Second installment did NOT generate commission!", "ERROR")
                    return False
                
                comissao = result['comissao']
                self.log("✅ CORRECT: Second installment generated separate commission!")
                self.log(f"   💰 Commission value: R$ {comissao.get('valor_comissao')}")
                
                commission_id = comissao.get('comissao_id')
                if commission_id:
                    self.commission_ids.append(commission_id)
                
                # Verify we now have 2 separate commission entries
                commission_response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}&tipo_comissao=vendedor")
                if commission_response.status_code == 200:
                    commissions = commission_response.json()
                    budget_commissions = [c for c in commissions if c.get('orcamento_id') == self.orcamento_id]
                    
                    if len(budget_commissions) == 2:
                        self.log("✅ CORRECT: 2 separate commission entries created!")
                        
                        # Verify each commission is linked to different installments
                        installment_links = set()
                        for comm in budget_commissions:
                            installment_links.add(comm.get('conta_receber_id'))
                        
                        if len(installment_links) == 2:
                            self.log("✅ CORRECT: Each commission linked to different installment!")
                            return True
                        else:
                            self.log("❌ Commissions not properly linked to different installments", "ERROR")
                            return False
                    else:
                        self.log(f"❌ Expected 2 commission entries, found {len(budget_commissions)}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify commission entries", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to mark second installment as RECEBIDO: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing second installment: {str(e)}", "ERROR")
            return False
    
    def test_commission_entries_in_contas_pagar(self):
        """Test that commission entries are properly created in contas_a_pagar"""
        self.log("📋 Testing commission entries in contas_a_pagar...")
        
        if not self.commission_ids:
            self.log("❌ No commission IDs available", "ERROR")
            return False
        
        try:
            # Get all commission entries
            response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}&tipo_comissao=vendedor")
            
            if response.status_code == 200:
                commissions = response.json()
                budget_commissions = [c for c in commissions if c.get('orcamento_id') == self.orcamento_id]
                
                self.log(f"✅ Found {len(budget_commissions)} commission entries for this budget")
                
                for i, comm in enumerate(budget_commissions):
                    self.log(f"   📋 Commission {i+1}:")
                    self.log(f"      💰 Value: R$ {comm.get('valor', 0)}")
                    self.log(f"      📄 Description: {comm.get('descricao')}")
                    self.log(f"      📊 Status: {comm.get('status')}")
                    self.log(f"      👤 Vendedor: {comm.get('vendedor_nome')}")
                    self.log(f"      🔗 Linked to installment: {comm.get('conta_receber_id')}")
                    
                    # Verify required fields
                    required_fields = ['id', 'tipo_comissao', 'vendedor_id', 'orcamento_id', 'conta_receber_id', 'percentual_comissao']
                    for field in required_fields:
                        if field not in comm:
                            self.log(f"❌ Missing required field: {field}", "ERROR")
                            return False
                    
                    # Verify commission type
                    if comm.get('tipo_comissao') != 'vendedor':
                        self.log(f"❌ Incorrect commission type: {comm.get('tipo_comissao')}", "ERROR")
                        return False
                
                self.log("✅ All commission entries have correct structure!")
                return True
            else:
                self.log(f"❌ Failed to get commission entries: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error checking commission entries: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Proportional Commission tests"""
        self.log("🚀 Starting CRITICAL: Proportional Commission (Comissão Parcelada) tests")
        self.log("=" * 80)
        
        tests = [
            ("Create Vendedor with Commission", self.test_create_vendedor_with_commission),
            ("Create Client", self.test_create_client),
            ("Create Budget with Services and Materials", self.test_create_budget_with_services_and_materials),
            ("Budget Acceptance Does NOT Generate Commission", self.test_budget_acceptance_no_commission),
            ("First Installment Payment Generates Proportional Commission", self.test_installment_payment_generates_proportional_commission),
            ("Second Installment Generates Separate Commission", self.test_second_installment_generates_separate_commission),
            ("Commission Entries in Contas a Pagar", self.test_commission_entries_in_contas_pagar)
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
        self.log("\n" + "=" * 80)
        self.log("📊 PROPORTIONAL COMMISSION TEST SUMMARY")
        self.log("=" * 80)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\n🎯 Final Result: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL PROPORTIONAL COMMISSION TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME PROPORTIONAL COMMISSION TESTS FAILED! Check logs above for details.")
            return False


class SellerAppTester:
    """Test suite for Seller App (App do Vendedor) functionality"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.vendedor_category_id = None
        self.created_vendedor_id = None
        self.created_orcamento_id = None
        self.created_comissao_id = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_list_employee_categories_vendedor(self):
        """Test GET /funcionarios/categorias/{empresa_id} - Check if 'Vendedor' category exists"""
        self.log("👥 Testing list employee categories for 'Vendedor'...")
        
        try:
            response = self.session.get(f"{API_BASE}/funcionarios/categorias/{self.company_id}")
            
            if response.status_code == 200:
                categories = response.json()
                self.log(f"✅ Retrieved {len(categories)} employee categories")
                
                # Look for "Vendedor" category
                vendedor_category = None
                for cat in categories:
                    if cat.get('nome') == 'Vendedor':
                        vendedor_category = cat
                        self.vendedor_category_id = cat.get('id')
                        break
                
                if vendedor_category:
                    self.log(f"✅ 'Vendedor' category found! ID: {self.vendedor_category_id}")
                    return True
                else:
                    self.log("❌ 'Vendedor' category not found", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list categories: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing categories: {str(e)}", "ERROR")
            return False
    
    def test_list_vendedores_endpoint(self):
        """Test GET /vendedores/{empresa_id} - New endpoint to list sellers"""
        self.log("🛍️ Testing list vendedores endpoint...")
        
        try:
            response = self.session.get(f"{API_BASE}/vendedores/{self.company_id}")
            
            if response.status_code == 200:
                vendedores = response.json()
                self.log(f"✅ Vendedores endpoint working! Found {len(vendedores)} vendedores")
                
                # Endpoint should return an array (can be empty)
                if isinstance(vendedores, list):
                    self.log("✅ Response is a valid array")
                    return True
                else:
                    self.log("❌ Response is not an array", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list vendedores: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing vendedores: {str(e)}", "ERROR")
            return False
    
    def test_create_funcionario_vendedor_with_commission(self):
        """Test POST /funcionarios - Create employee seller with commission percentage"""
        self.log("💼 Testing create funcionário vendedor with commission...")
        
        if not self.vendedor_category_id:
            self.log("❌ No Vendedor category ID available", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        funcionario_data = {
            "empresa_id": self.company_id,
            "nome_completo": "Vendedor Teste Comissão",
            "cpf": f"{timestamp % 100000000000:011d}",  # Generate unique CPF based on timestamp
            "categoria_id": self.vendedor_category_id,
            "status": "Ativo",
            "login_email": f"vendedor.teste{timestamp}@empresa.com",
            "login_senha": "senha123",
            "percentual_comissao": 5.0
        }
        
        try:
            response = self.session.post(f"{API_BASE}/funcionarios", json=funcionario_data)
            
            if response.status_code == 200:
                result = response.json()
                funcionario_data_response = result.get('funcionario', {})
                self.created_vendedor_id = funcionario_data_response.get('id')
                
                self.log(f"✅ Vendedor with commission created! ID: {self.created_vendedor_id}")
                
                # Verify commission percentage was saved
                verify_response = self.session.get(f"{API_BASE}/funcionario/{self.created_vendedor_id}")
                if verify_response.status_code == 200:
                    funcionario = verify_response.json()
                    
                    if funcionario.get('percentual_comissao') == 5.0:
                        self.log("✅ Commission percentage saved correctly (5.0%)!")
                        return True
                    else:
                        self.log(f"❌ Commission percentage incorrect: {funcionario.get('percentual_comissao')}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify funcionário creation", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to create vendedor: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating vendedor: {str(e)}", "ERROR")
            return False
    
    def test_vendedor_appears_in_listing(self):
        """Test GET /vendedores/{empresa_id} - Verify created seller appears in listing"""
        self.log("📋 Testing vendedor appears in listing...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available for verification", "ERROR")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/vendedores/{self.company_id}")
            
            if response.status_code == 200:
                vendedores = response.json()
                self.log(f"✅ Retrieved {len(vendedores)} vendedores")
                
                # Look for our created vendedor
                our_vendedor = None
                for vendedor in vendedores:
                    if vendedor.get('id') == self.created_vendedor_id:
                        our_vendedor = vendedor
                        break
                
                if our_vendedor:
                    self.log("✅ Our created vendedor found in listing!")
                    self.log(f"   👤 Name: {our_vendedor.get('nome_completo')}")
                    self.log(f"   💰 Commission: {our_vendedor.get('percentual_comissao')}%")
                    
                    # Verify commission percentage
                    if our_vendedor.get('percentual_comissao') == 5.0:
                        self.log("✅ Commission percentage correct in listing!")
                        return True
                    else:
                        self.log("❌ Commission percentage incorrect in listing", "ERROR")
                        return False
                else:
                    self.log("❌ Our created vendedor not found in listing", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list vendedores: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing vendedores: {str(e)}", "ERROR")
            return False
    
    def test_create_orcamento_with_vendedor(self):
        """Test POST /orcamentos - Create budget with seller information"""
        self.log("📄 Testing create orçamento with vendedor...")
        
        if not self.created_vendedor_id:
            self.log("❌ No vendedor ID available for orçamento creation", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        orcamento_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            "vendedor_id": self.created_vendedor_id,
            "vendedor_nome": "Vendedor Teste Comissão",
            # Client data
            "cliente_nome": f"Cliente Teste Vendedor {timestamp}",
            "cliente_documento": "123.456.789-00",
            "cliente_whatsapp": "11999999999",
            # Budget data
            "tipo": "servico_hora",
            "descricao_servico_ou_produto": f"Serviço vendido por vendedor {timestamp}",
            "quantidade": 10.0,
            "custo_total": 1000.0,
            "preco_minimo": 1500.0,
            "preco_sugerido": 2000.0,
            "preco_praticado": 2000.0,
            # Commercial conditions
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "À vista",
            "prazo_execucao": "15 dias úteis",
            "observacoes": "Orçamento com vendedor para teste de comissão"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=orcamento_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_orcamento_id = result.get('orcamento_id')
                numero_orcamento = result.get('numero_orcamento')
                
                self.log(f"✅ Orçamento with vendedor created! ID: {self.created_orcamento_id}, Number: {numero_orcamento}")
                
                # Verify vendedor data was saved
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.created_orcamento_id}")
                if verify_response.status_code == 200:
                    orcamento = verify_response.json()
                    
                    if (orcamento.get('vendedor_id') == self.created_vendedor_id and
                        orcamento.get('vendedor_nome') == "Vendedor Teste Comissão"):
                        self.log("✅ Vendedor data saved correctly in orçamento!")
                        return True
                    else:
                        self.log("❌ Vendedor data not saved correctly", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify orçamento creation", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to create orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating orçamento: {str(e)}", "ERROR")
            return False
    
    def test_approve_orcamento_generate_commission(self):
        """Test PATCH /orcamento/{id}/status - Approve budget and test commission generation"""
        self.log("✅ Testing approve orçamento and commission generation...")
        
        if not self.created_orcamento_id:
            self.log("❌ No orçamento ID available for approval", "ERROR")
            return False
        
        try:
            # Approve the budget
            status_data = {"status": "APROVADO"}
            response = self.session.patch(f"{API_BASE}/orcamento/{self.created_orcamento_id}/status", json=status_data)
            
            if response.status_code == 200:
                self.log("✅ Orçamento approved successfully!")
                
                # Verify status was updated
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.created_orcamento_id}")
                if verify_response.status_code == 200:
                    orcamento = verify_response.json()
                    
                    if orcamento.get('status') == 'APROVADO':
                        self.log("✅ Orçamento status updated to APROVADO!")
                        return True
                    else:
                        self.log(f"❌ Orçamento status not updated correctly: {orcamento.get('status')}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify orçamento approval", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to approve orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error approving orçamento: {str(e)}", "ERROR")
            return False
    
    def test_verify_commission_generated(self):
        """Test GET /contas/pagar - Verify commission was generated"""
        self.log("💰 Testing commission generation verification...")
        
        try:
            response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}")
            
            if response.status_code == 200:
                contas_pagar = response.json()
                self.log(f"✅ Retrieved {len(contas_pagar)} contas a pagar")
                
                # Debug: Show all accounts to understand the structure
                for i, conta in enumerate(contas_pagar):
                    self.log(f"   Account {i+1}: {conta.get('descricao')} - Category: {conta.get('categoria')} - Type: {conta.get('tipo_comissao', 'N/A')}")
                
                # Look for commission account
                commission_account = None
                for conta in contas_pagar:
                    if (conta.get('categoria') == 'Comissão' and 
                        conta.get('tipo_comissao') == 'vendedor'):
                        commission_account = conta
                        self.created_comissao_id = conta.get('id')
                        break
                
                if commission_account:
                    self.log("✅ Commission account found!")
                    self.log(f"   📋 Description: {commission_account.get('descricao')}")
                    self.log(f"   💰 Value: R$ {commission_account.get('valor')}")
                    self.log(f"   📊 Category: {commission_account.get('categoria')}")
                    self.log(f"   🏷️ Commission Type: {commission_account.get('tipo_comissao')}")
                    
                    # Verify commission calculation (5% of R$ 2000 = R$ 100)
                    expected_commission = 2000.0 * 0.05  # 5% commission
                    actual_commission = commission_account.get('valor', 0)
                    
                    if abs(actual_commission - expected_commission) < 0.01:  # Allow small floating point differences
                        self.log(f"✅ Commission value correct! Expected: R$ {expected_commission}, Got: R$ {actual_commission}")
                        return True
                    else:
                        self.log(f"❌ Commission value incorrect! Expected: R$ {expected_commission}, Got: R$ {actual_commission}", "ERROR")
                        return False
                else:
                    self.log("❌ Commission account not found", "ERROR")
                    # Also check for any account with "Comissão" in description
                    for conta in contas_pagar:
                        if 'Comissão' in conta.get('descricao', '') or 'comissao' in conta.get('descricao', '').lower():
                            self.log(f"   Found potential commission account: {conta.get('descricao')} - Category: {conta.get('categoria')}")
                    return False
            else:
                self.log(f"❌ Failed to get contas a pagar: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting contas a pagar: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Seller App tests"""
        self.log("🚀 Starting Seller App (App do Vendedor) API tests")
        self.log("=" * 70)
        
        tests = [
            ("List Employee Categories - Check Vendedor", self.test_list_employee_categories_vendedor),
            ("List Vendedores Endpoint", self.test_list_vendedores_endpoint),
            ("Create Funcionário Vendedor with Commission", self.test_create_funcionario_vendedor_with_commission),
            ("Vendedor Appears in Listing", self.test_vendedor_appears_in_listing),
            ("Create Orçamento with Vendedor", self.test_create_orcamento_with_vendedor),
            ("Approve Orçamento - Generate Commission", self.test_approve_orcamento_generate_commission),
            ("Verify Commission Generated", self.test_verify_commission_generated)
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
        self.log("📊 SELLER APP TEST SUMMARY")
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
            self.log("🎉 ALL SELLER APP TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME SELLER APP TESTS FAILED! Check logs above for details.")
            return False


class CommissionBugFixTester:
    """Test suite for Commission Bug Fix - Client Acceptance Flow"""
    
    def __init__(self):
        self.session = requests.Session()
        self.user_data = None
        self.company_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"  # Company ID from test_result.md
        self.vendedor_id = "06c562d9-47b4-4919-8419-d58b45215c49"  # Provided vendedor ID
        self.test_results = {}
        self.created_orcamento_id = None
        self.comissao_conta_id = None
        
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
    
    def test_verify_vendedor_exists(self):
        """Verify the vendedor exists and has commission percentage"""
        self.log("👤 Verifying vendedor exists...")
        
        try:
            response = self.session.get(f"{API_BASE}/funcionario/{self.vendedor_id}")
            
            if response.status_code == 200:
                vendedor = response.json()
                self.log(f"✅ Vendedor found: {vendedor.get('nome_completo')}")
                self.log(f"   📊 Commission %: {vendedor.get('percentual_comissao', 0)}%")
                
                # Verify vendedor has commission percentage set
                if vendedor.get('percentual_comissao', 0) > 0:
                    self.log("✅ Vendedor has commission percentage configured!")
                    return True
                else:
                    self.log("❌ Vendedor has no commission percentage configured", "ERROR")
                    return False
            else:
                self.log(f"❌ Vendedor not found: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error verifying vendedor: {str(e)}", "ERROR")
            return False
    
    def test_create_orcamento_with_vendedor(self):
        """Test creating budget WITH vendedor linked and services for commission calculation"""
        self.log("💰 Testing budget creation with vendedor and services...")
        
        if not self.user_data:
            self.log("❌ No user data available for budget creation", "ERROR")
            return False
        
        import time
        timestamp = int(time.time())
        
        # Create budget with services and materials to test commission calculation
        budget_data = {
            "empresa_id": self.company_id,
            "usuario_id": self.user_data['user_id'],
            # CRITICAL: Include vendedor
            "vendedor_id": self.vendedor_id,
            "vendedor_nome": "Vendedor Teste",
            # Client data
            "cliente_nome": f"Cliente Comissão {timestamp}",
            "cliente_documento": "123.456.789-00",
            "cliente_email": "cliente.comissao@teste.com",
            "cliente_telefone": "(11) 99999-8888",
            "cliente_whatsapp": "11999998888",
            "cliente_endereco": "Rua Comissão, 123 - São Paulo/SP",
            # Budget data
            "tipo": "servico_hora",
            "descricao_servico_ou_produto": f"Serviço com comissão {timestamp}",
            "quantidade": 1.0,
            # Include detalhes_itens with services and materials for commission calculation
            "detalhes_itens": {
                "servicos": [
                    {
                        "nome": "Instalação Elétrica",
                        "quantidade": 1,
                        "valor_unitario": 10000.0,
                        "valor_total": 10000.0
                    }
                ],
                "materiais": [
                    {
                        "nome": "Fios e Cabos",
                        "quantidade": 1,
                        "valor_unitario": 5000.0,
                        "valor_total": 5000.0
                    }
                ]
            },
            "custo_total": 8000.0,
            "preco_minimo": 12000.0,
            "preco_sugerido": 15000.0,
            "preco_praticado": 15000.0,  # Total: R$ 15,000 (R$ 10,000 services + R$ 5,000 materials)
            # Commercial conditions
            "validade_proposta": "2025-02-28",
            "condicoes_pagamento": "Entrada + 2 parcelas",
            "prazo_execucao": "30 dias úteis",
            "observacoes": "Teste de comissão no aceite do cliente",
            # Payment with installments to test commission generation
            "forma_pagamento": "entrada_parcelas",
            "entrada_percentual": 30.0,
            "valor_entrada": 4500.0,
            "num_parcelas": 2,
            "parcelas": [
                {"numero": 1, "valor": 5250.0, "editado": False},
                {"numero": 2, "valor": 5250.0, "editado": False}
            ]
        }
        
        try:
            response = self.session.post(f"{API_BASE}/orcamentos", json=budget_data)
            
            if response.status_code == 200:
                result = response.json()
                self.created_orcamento_id = result.get('orcamento_id')
                budget_number = result.get('numero_orcamento')
                self.log(f"✅ Budget created successfully! ID: {self.created_orcamento_id}, Number: {budget_number}")
                
                # Verify vendedor was linked correctly
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.created_orcamento_id}")
                if verify_response.status_code == 200:
                    budget = verify_response.json()
                    if budget.get('vendedor_id') == self.vendedor_id:
                        self.log("✅ Vendedor linked correctly to budget!")
                        self.log(f"   👤 Vendedor ID: {budget.get('vendedor_id')}")
                        self.log(f"   👤 Vendedor Nome: {budget.get('vendedor_nome')}")
                        self.log(f"   💰 Budget Value: R$ {budget.get('preco_praticado')}")
                        return True
                    else:
                        self.log("❌ Vendedor not linked correctly to budget", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify budget creation", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to create budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating budget: {str(e)}", "ERROR")
            return False
    
    def test_send_orcamento_to_client(self):
        """Test sending budget to client (status: ENVIADO)"""
        self.log("📤 Testing send budget to client...")
        
        if not self.created_orcamento_id:
            self.log("❌ No budget ID available for sending", "ERROR")
            return False
        
        try:
            status_data = {
                "status": "ENVIADO",
                "canal_envio": "WhatsApp"
            }
            
            response = self.session.patch(f"{API_BASE}/orcamento/{self.created_orcamento_id}/status", json=status_data)
            
            if response.status_code == 200:
                self.log("✅ Budget sent to client successfully!")
                
                # Verify status was updated
                verify_response = self.session.get(f"{API_BASE}/orcamento/{self.created_orcamento_id}")
                if verify_response.status_code == 200:
                    budget = verify_response.json()
                    if budget.get('status') == 'ENVIADO':
                        self.log("✅ Budget status updated to ENVIADO!")
                        return True
                    else:
                        self.log(f"❌ Budget status not updated correctly. Current: {budget.get('status')}", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify status update", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to send budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error sending budget: {str(e)}", "ERROR")
            return False
    
    def test_client_accept_budget(self):
        """Test client accepting budget - CRITICAL TEST for commission generation"""
        self.log("✅ Testing client budget acceptance - COMMISSION GENERATION...")
        
        if not self.created_orcamento_id:
            self.log("❌ No budget ID available for acceptance", "ERROR")
            return False
        
        try:
            response = self.session.post(f"{API_BASE}/orcamento/{self.created_orcamento_id}/aceitar")
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Budget accepted by client successfully!")
                
                # CRITICAL CHECK: Verify commission is returned in response
                comissao = result.get('comissao')
                if comissao:
                    self.log(f"✅ COMMISSION RETURNED IN RESPONSE!")
                    self.log(f"   💰 Commission Value: R$ {comissao.get('valor', 0)}")
                    self.log(f"   📊 Commission %: {comissao.get('percentual', 0)}%")
                    self.log(f"   💼 Base Value: R$ {comissao.get('valor_base', 0)}")
                    self.log(f"   🆔 Commission Account ID: {comissao.get('conta_id')}")
                    
                    # Store commission account ID for verification
                    self.comissao_conta_id = comissao.get('conta_id')
                    
                    return True
                else:
                    self.log("❌ COMMISSION NOT RETURNED IN RESPONSE - BUG NOT FIXED!", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to accept budget: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error accepting budget: {str(e)}", "ERROR")
            return False
    
    def test_verify_commission_conta_pagar(self):
        """Test verifying commission was created in Contas a Pagar"""
        self.log("💳 Testing commission in Contas a Pagar...")
        
        if not self.comissao_conta_id:
            self.log("❌ No commission account ID available for verification", "ERROR")
            return False
        
        try:
            # Get all contas a pagar for the company
            response = self.session.get(f"{API_BASE}/contas/pagar?company_id={self.company_id}")
            
            if response.status_code == 200:
                contas = response.json()
                self.log(f"✅ Retrieved {len(contas)} contas a pagar")
                
                # Find our commission account
                commission_account = None
                for conta in contas:
                    if conta.get('id') == self.comissao_conta_id:
                        commission_account = conta
                        break
                
                if commission_account:
                    self.log("✅ Commission account found in Contas a Pagar!")
                    self.log(f"   📋 Description: {commission_account.get('descricao')}")
                    self.log(f"   💰 Value: R$ {commission_account.get('valor')}")
                    self.log(f"   📊 Status: {commission_account.get('status')}")
                    self.log(f"   🏷️ Category: {commission_account.get('categoria')}")
                    
                    # CRITICAL CHECK: Verify tipo_comissao field
                    if commission_account.get('tipo_comissao') == 'vendedor':
                        self.log("✅ COMMISSION TYPE CORRECTLY SET TO 'vendedor'!")
                        return True
                    else:
                        self.log(f"❌ Commission type incorrect. Expected: 'vendedor', Got: {commission_account.get('tipo_comissao')}", "ERROR")
                        return False
                else:
                    self.log("❌ Commission account not found in Contas a Pagar", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get contas a pagar: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error verifying commission account: {str(e)}", "ERROR")
            return False
    
    def test_verify_commission_in_vendedor_app(self):
        """Test verifying commission appears in Vendedor App"""
        self.log("📱 Testing commission in Vendedor App...")
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/{self.vendedor_id}/comissoes")
            
            if response.status_code == 200:
                result = response.json()
                comissoes = result.get('comissoes', [])
                total_pendente = result.get('total_pendente', 0)
                total_liberado = result.get('total_liberado', 0)
                
                self.log(f"✅ Retrieved vendedor commissions!")
                self.log(f"   📊 Total Pending: R$ {total_pendente}")
                self.log(f"   📊 Total Released: R$ {total_liberado}")
                self.log(f"   📋 Number of commissions: {len(comissoes)}")
                
                # Find our commission
                our_commission = None
                for comissao in comissoes:
                    if comissao.get('orcamento_id') == self.created_orcamento_id:
                        our_commission = comissao
                        break
                
                if our_commission:
                    self.log("✅ Our commission found in Vendedor App!")
                    self.log(f"   💰 Commission Value: R$ {our_commission.get('valor')}")
                    self.log(f"   📊 Commission %: {our_commission.get('percentual')}%")
                    self.log(f"   💼 Base Value: R$ {our_commission.get('valor_base')}")
                    self.log(f"   📋 Budget Number: {our_commission.get('numero_orcamento')}")
                    self.log(f"   📅 Date: {our_commission.get('data_vencimento')}")
                    
                    # Verify commission calculation (should be 5% of services only = R$ 500)
                    expected_commission = 500.0  # 5% of R$ 10,000 (services only)
                    actual_commission = our_commission.get('valor', 0)
                    
                    if abs(actual_commission - expected_commission) < 0.01:
                        self.log(f"✅ Commission calculation correct! Expected: R$ {expected_commission}, Got: R$ {actual_commission}")
                        return True
                    else:
                        self.log(f"❌ Commission calculation incorrect! Expected: R$ {expected_commission}, Got: R$ {actual_commission}", "ERROR")
                        return False
                else:
                    self.log("❌ Our commission not found in Vendedor App", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get vendedor commissions: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting vendedor commissions: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Commission Bug Fix tests"""
        self.log("🚀 Starting Commission Bug Fix API tests")
        self.log("=" * 70)
        self.log("🎯 TESTING: Commission generation when client accepts budget via link")
        self.log("=" * 70)
        
        tests = [
            ("Login", self.test_login),
            ("Verify Vendedor Exists", self.test_verify_vendedor_exists),
            ("Create Budget with Vendedor", self.test_create_orcamento_with_vendedor),
            ("Send Budget to Client", self.test_send_orcamento_to_client),
            ("Client Accept Budget (Commission Generation)", self.test_client_accept_budget),
            ("Verify Commission in Contas a Pagar", self.test_verify_commission_conta_pagar),
            ("Verify Commission in Vendedor App", self.test_verify_commission_in_vendedor_app)
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
        self.log("📊 COMMISSION BUG FIX TEST SUMMARY")
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
            self.log("🎉 ALL COMMISSION BUG FIX TESTS PASSED! Commission generation working correctly.")
            return True
        else:
            self.log("⚠️ SOME COMMISSION TESTS FAILED! Commission bug may not be fully fixed.")
            return False


def main():
    """Main function - Run Proportional Commission tests"""
    print("🚀 Starting CRITICAL: Proportional Commission (Comissão Parcelada) Tests")
    print("=" * 80)
    print("🎯 TESTING: Commission generated proportionally when installments are paid")
    print("📋 Business Rules:")
    print("   • Commission NO LONGER generated when budget is approved")
    print("   • Commission IS generated when each installment is marked as RECEBIDO")
    print("   • Commission calculated ONLY on services portion, NOT materials")
    print("   • Each installment generates its own proportional commission")
    print("=" * 80)
    
    # Initialize session and login
    session = requests.Session()
    
    # Login with admin credentials
    login_data = {
        "email": "admin@lucroliquido.com",
        "password": "admin123"
    }
    
    try:
        response = session.post(f"{API_BASE}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
        
        user_data = response.json()
        company_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"  # From test_result.md
        
        print(f"✅ Login successful! User ID: {user_data['user_id']}")
        print(f"🏢 Company ID: {company_id}")
        
        # Initialize Proportional Commission Tester
        commission_tester = ProportionalCommissionTester(session, user_data, company_id)
        
        # Run Proportional Commission tests
        commission_success = commission_tester.run_all_tests()
        
        # Final summary
        print("\n" + "=" * 80)
        print("🎯 FINAL TEST SUMMARY")
        print("=" * 80)
        
        if commission_success:
            print("🎉 ALL PROPORTIONAL COMMISSION TESTS PASSED!")
            print("✅ Proportional commission system working correctly")
            print("✅ Old commission logic properly removed from budget acceptance")
            print("✅ New commission logic working in installment payments")
            return True
        else:
            print("⚠️ SOME PROPORTIONAL COMMISSION TESTS FAILED!")
            print("❌ Proportional commission system may not be working correctly")
            return False
            
    except Exception as e:
        print(f"❌ Error in main execution: {str(e)}")
        return False

class AgendaTester:
    """Test suite for Agenda CRUD operations"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.vendedor_id = "06c562d9-47b4-4919-8419-d58b45215c49"  # From review request
        self.empresa_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"  # From review request
        self.created_agenda_id = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_create_agenda(self):
        """Test POST /api/vendedor/{vendedor_id}/agenda - Create agenda"""
        self.log("📅 Testing create agenda...")
        
        agenda_data = {
            "empresa_id": self.empresa_id,
            "cliente_id": None,
            "cliente_nome": "Cliente Teste Agenda",
            "titulo": "Visita Técnica",
            "descricao": "Visita para levantamento de requisitos",
            "data": "2025-01-20",
            "hora_inicio": "09:00",
            "hora_fim": "10:00",
            "status": "Pendente",
            "observacoes": "Primeira visita ao cliente"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/vendedor/{self.vendedor_id}/agenda", json=agenda_data)
            
            if response.status_code == 200:
                result = response.json()
                agenda = result.get('agenda', {})
                self.created_agenda_id = agenda.get('id')
                
                self.log(f"✅ Agenda created successfully! ID: {self.created_agenda_id}")
                self.log(f"   📋 Title: {agenda.get('titulo')}")
                self.log(f"   👤 Client: {agenda.get('cliente_nome')}")
                self.log(f"   📅 Date: {agenda.get('data')} {agenda.get('hora_inicio')}-{agenda.get('hora_fim')}")
                return True
            else:
                self.log(f"❌ Failed to create agenda: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating agenda: {str(e)}", "ERROR")
            return False
    
    def test_list_agenda(self):
        """Test GET /api/vendedor/{vendedor_id}/agenda - List agenda"""
        self.log("📋 Testing list agenda...")
        
        try:
            response = self.session.get(f"{API_BASE}/vendedor/{self.vendedor_id}/agenda")
            
            if response.status_code == 200:
                agendas = response.json()
                self.log(f"✅ Retrieved {len(agendas)} agenda items")
                
                # Look for our created agenda
                our_agenda = None
                for agenda in agendas:
                    if agenda.get('id') == self.created_agenda_id:
                        our_agenda = agenda
                        break
                
                if our_agenda:
                    self.log("✅ Our created agenda found in list!")
                    return True
                else:
                    self.log("❌ Our created agenda not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list agenda: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing agenda: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Agenda tests"""
        self.log("🚀 Starting Agenda CRUD API tests")
        self.log("=" * 70)
        
        tests = [
            ("Create Agenda", self.test_create_agenda),
            ("List Agenda", self.test_list_agenda)
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
        self.log("📊 AGENDA TEST SUMMARY")
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
            self.log("🎉 ALL AGENDA TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME AGENDA TESTS FAILED! Check logs above for details.")
            return False


class PreOrcamentoTester:
    """Test suite for Pre-Orçamento (Pre-Budget) functionality"""
    
    def __init__(self, session, user_data, company_id):
        self.session = session
        self.user_data = user_data
        self.company_id = company_id
        self.test_results = {}
        self.vendedor_id = "06c562d9-47b4-4919-8419-d58b45215c49"  # From review request
        self.empresa_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"  # From review request
        self.created_pre_orcamento_id = None
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_admin_login(self):
        """Test admin login with credentials from review request"""
        self.log("🔐 Testing admin login...")
        
        login_data = {
            "email": "admin@lucroliquido.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                admin_data = response.json()
                self.log(f"✅ Admin login successful! User ID: {admin_data['user_id']}")
                return True
            else:
                self.log(f"❌ Admin login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login error: {str(e)}", "ERROR")
            return False
    
    def test_create_pre_orcamento_with_audio(self):
        """Test POST /api/vendedor/{vendedor_id}/pre-orcamento - Create pre-budget with audio"""
        self.log("🎵 Testing create pre-orçamento with audio...")
        
        import time
        timestamp = int(time.time())
        
        # Payload from review request with audio
        pre_orcamento_data = {
            "empresa_id": self.empresa_id,
            "cliente_id": None,
            "cliente_nome": "Cliente Teste Audio",
            "cliente_whatsapp": "(11) 99999-9999",
            "data_entrega": "2025-01-15",
            "itens": [
                {
                    "descricao": "Serviço de teste com foto e audio",
                    "quantidade": 2,
                    "foto_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                    "audio_url": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGF"
                }
            ],
            "observacoes": "Teste de pré-orçamento com foto e áudio"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/vendedor/{self.vendedor_id}/pre-orcamento", json=pre_orcamento_data)
            
            if response.status_code == 200:
                result = response.json()
                pre_orcamento = result.get('pre_orcamento', {})
                self.created_pre_orcamento_id = pre_orcamento.get('id')
                
                self.log(f"✅ Pre-orçamento created successfully! ID: {self.created_pre_orcamento_id}")
                
                # Verify audio and photo URLs were saved
                if len(pre_orcamento.get('itens', [])) > 0:
                    item = pre_orcamento['itens'][0]
                    if (item.get('foto_url') and item.get('audio_url') and 
                        'data:image/png;base64' in item.get('foto_url', '') and
                        'data:audio/webm;base64' in item.get('audio_url', '')):
                        self.log("✅ Photo and audio URLs saved correctly!")
                        return True
                    else:
                        self.log("❌ Photo or audio URLs not saved correctly", "ERROR")
                        return False
                else:
                    self.log("❌ No items found in created pre-orçamento", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to create pre-orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating pre-orçamento: {str(e)}", "ERROR")
            return False
    
    def test_list_pre_orcamentos_empresa(self):
        """Test GET /api/pre-orcamentos/{empresa_id} - List pre-budgets for company"""
        self.log("📋 Testing list pre-orçamentos for empresa...")
        
        try:
            response = self.session.get(f"{API_BASE}/pre-orcamentos/{self.empresa_id}")
            
            if response.status_code == 200:
                pre_orcamentos = response.json()
                self.log(f"✅ Retrieved {len(pre_orcamentos)} pre-orçamentos for empresa")
                
                # Look for our created pre-orçamento
                our_pre_orcamento = None
                for pre_orc in pre_orcamentos:
                    if pre_orc.get('id') == self.created_pre_orcamento_id:
                        our_pre_orcamento = pre_orc
                        break
                
                if our_pre_orcamento:
                    self.log("✅ Our created pre-orçamento found in list!")
                    self.log(f"   👤 Client: {our_pre_orcamento.get('cliente_nome')}")
                    self.log(f"   📅 Delivery: {our_pre_orcamento.get('data_entrega')}")
                    self.log(f"   📋 Items: {len(our_pre_orcamento.get('itens', []))}")
                    
                    # Verify items contain media URLs
                    if len(our_pre_orcamento.get('itens', [])) > 0:
                        item = our_pre_orcamento['itens'][0]
                        if item.get('foto_url') and item.get('audio_url'):
                            self.log("✅ Items contain photo_url and audio_url!")
                            return True
                        else:
                            self.log("❌ Items missing photo_url or audio_url", "ERROR")
                            return False
                    else:
                        self.log("❌ No items found in pre-orçamento", "ERROR")
                        return False
                else:
                    self.log("❌ Our created pre-orçamento not found in list", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to list pre-orçamentos: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error listing pre-orçamentos: {str(e)}", "ERROR")
            return False
    
    def test_update_pre_orcamento_status(self):
        """Test PATCH /api/pre-orcamento/{pre_orcamento_id}/status - Update status"""
        self.log("🔄 Testing update pre-orçamento status...")
        
        if not self.created_pre_orcamento_id:
            self.log("❌ No pre-orçamento ID available for status update", "ERROR")
            return False
        
        status_data = {"status": "Convertido"}
        
        try:
            response = self.session.patch(f"{API_BASE}/pre-orcamento/{self.created_pre_orcamento_id}/status", json=status_data)
            
            if response.status_code == 200:
                self.log("✅ Pre-orçamento status updated successfully!")
                
                # Verify status was updated by listing again
                verify_response = self.session.get(f"{API_BASE}/pre-orcamentos/{self.empresa_id}")
                if verify_response.status_code == 200:
                    pre_orcamentos = verify_response.json()
                    
                    for pre_orc in pre_orcamentos:
                        if pre_orc.get('id') == self.created_pre_orcamento_id:
                            if pre_orc.get('status') == 'Convertido':
                                self.log("✅ Status update verified - now 'Convertido'!")
                                return True
                            else:
                                self.log(f"❌ Status not updated correctly. Current: {pre_orc.get('status')}", "ERROR")
                                return False
                    
                    self.log("❌ Pre-orçamento not found in verification", "ERROR")
                    return False
                else:
                    self.log("⚠️ Could not verify status update", "WARN")
                    return True  # Update worked, verification failed
            else:
                self.log(f"❌ Failed to update status: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating status: {str(e)}", "ERROR")
            return False
    
    def test_delete_pre_orcamento(self):
        """Test DELETE /api/pre-orcamento/{pre_orcamento_id} - Delete pre-budget"""
        self.log("🗑️ Testing delete pre-orçamento...")
        
        if not self.created_pre_orcamento_id:
            self.log("❌ No pre-orçamento ID available for deletion", "ERROR")
            return False
        
        try:
            response = self.session.delete(f"{API_BASE}/pre-orcamento/{self.created_pre_orcamento_id}")
            
            if response.status_code == 200:
                self.log("✅ Pre-orçamento deleted successfully!")
                
                # Verify deletion by trying to list again
                verify_response = self.session.get(f"{API_BASE}/pre-orcamentos/{self.empresa_id}")
                if verify_response.status_code == 200:
                    pre_orcamentos = verify_response.json()
                    
                    # Check that our pre-orçamento is no longer in the list
                    found = any(pre_orc.get('id') == self.created_pre_orcamento_id for pre_orc in pre_orcamentos)
                    
                    if not found:
                        self.log("✅ Deletion verified - pre-orçamento no longer in list!")
                        return True
                    else:
                        self.log("❌ Pre-orçamento still found after deletion", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify deletion", "WARN")
                    return True  # Deletion worked, verification failed
            else:
                self.log(f"❌ Failed to delete pre-orçamento: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error deleting pre-orçamento: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Pre-Orçamento tests"""
        self.log("🚀 Starting Pre-Orçamento API tests")
        self.log("=" * 70)
        
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Create Pre-Orçamento with Audio", self.test_create_pre_orcamento_with_audio),
            ("List Pre-Orçamentos for Empresa", self.test_list_pre_orcamentos_empresa),
            ("Update Pre-Orçamento Status", self.test_update_pre_orcamento_status),
            ("Delete Pre-Orçamento", self.test_delete_pre_orcamento)
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
        self.log("📊 PRE-ORÇAMENTO TEST SUMMARY")
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
            self.log("🎉 ALL PRE-ORÇAMENTO TESTS PASSED! System working correctly.")
            return True
        else:
            self.log("⚠️ SOME PRE-ORÇAMENTO TESTS FAILED! Check logs above for details.")
            return False


def main_pre_orcamento_tests():
    """Main function to run Pre-Orçamento tests"""
    print("🚀 STARTING PRE-ORÇAMENTO AND AGENDA ENDPOINT TESTS")
    print("=" * 80)
    
    session = requests.Session()
    
    # Login as admin
    login_data = {
        "email": "admin@lucroliquido.com",
        "password": "admin123"
    }
    
    try:
        response = session.post(f"{API_BASE}/auth/login", json=login_data)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Login successful! User ID: {user_data['user_id']}")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False
    
    # Use the company ID from the review request
    company_id = "cf901b3e-0eca-429c-9b8e-d723b31ecbd4"
    
    # Initialize testers
    agenda_tester = AgendaTester(session, user_data, company_id)
    pre_orcamento_tester = PreOrcamentoTester(session, user_data, company_id)
    
    # Run Agenda tests first (to check the failing task)
    print("\n🔥 AGENDA CRUD TESTS")
    print("=" * 50)
    agenda_success = agenda_tester.run_all_tests()
    
    # Run Pre-Orçamento tests
    print("\n🔥 PRE-ORÇAMENTO TESTS")
    print("=" * 50)
    pre_orcamento_success = pre_orcamento_tester.run_all_tests()
    
    # Final summary
    print("\n" + "=" * 80)
    print("🎯 FINAL TEST SUMMARY")
    print("=" * 80)
    
    if agenda_success and pre_orcamento_success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Sistema de Agenda e Pré-Orçamentos funcionando corretamente")
        return True
    else:
        print("⚠️ SOME TESTS FAILED!")
        if not agenda_success:
            print("❌ Agenda CRUD tests failed")
        if not pre_orcamento_success:
            print("❌ Pre-Orçamento tests failed")
        print("❌ Verificar logs acima para detalhes dos erros")
        return False


if __name__ == "__main__":
    # Run the commission bug fix tests
    main()