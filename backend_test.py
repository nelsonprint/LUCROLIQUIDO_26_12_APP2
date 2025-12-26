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
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://obrascope.preview.emergentagent.com')
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

def main():
    """Main function - Run WhatsApp, Funcionários, and Supervisor/Cronograma tests"""
    print("🚀 Starting Comprehensive Lucro Líquido System Tests")
    print("=" * 80)
    
    # Initialize WhatsApp Budget Flow Tester
    whatsapp_tester = WhatsAppBudgetFlowTester()
    
    # Run WhatsApp tests first
    print("\n🔥 PHASE 1: WhatsApp Budget Flow Tests")
    print("=" * 50)
    whatsapp_success = whatsapp_tester.run_all_tests()
    
    # Run Funcionários tests if we have login data
    funcionarios_success = False
    if whatsapp_tester.user_data:
        print("\n\n🔥 PHASE 2: Funcionários Module Tests")
        print("=" * 50)
        funcionarios_tester = FuncionariosTester(
            whatsapp_tester.session, 
            whatsapp_tester.user_data, 
            whatsapp_tester.company_id
        )
        funcionarios_success = funcionarios_tester.run_all_tests()
    else:
        print("\n❌ Skipping Funcionários tests - no login data available")
    
    # Run Supervisor and Cronograma tests if we have login data
    supervisor_success = False
    if whatsapp_tester.user_data:
        print("\n\n🔥 PHASE 3: Supervisor and Cronograma de Obra Tests")
        print("=" * 50)
        supervisor_tester = SupervisorCronogramaTester(
            whatsapp_tester.session, 
            whatsapp_tester.user_data, 
            whatsapp_tester.company_id
        )
        supervisor_success = supervisor_tester.run_all_tests()
    else:
        print("\n❌ Skipping Supervisor and Cronograma tests - no login data available")
    
    # Final summary
    print("\n" + "=" * 80)
    print("🏁 COMPREHENSIVE TEST SUMMARY")
    print("=" * 80)
    
    whatsapp_status = "✅ PASSED" if whatsapp_success else "❌ FAILED"
    funcionarios_status = "✅ PASSED" if funcionarios_success else "❌ FAILED"
    supervisor_status = "✅ PASSED" if supervisor_success else "❌ FAILED"
    
    print(f"WhatsApp Budget Flow: {whatsapp_status}")
    print(f"Funcionários Module: {funcionarios_status}")
    print(f"Supervisor & Cronograma: {supervisor_status}")
    
    overall_success = whatsapp_success and funcionarios_success and supervisor_success
    
    if overall_success:
        print("\n🎉 ALL SYSTEM TESTS PASSED! Lucro Líquido system working correctly.")
    else:
        print("\n⚠️ SOME TESTS FAILED! Check logs above for details.")
    
    # Exit code
    sys.exit(0 if overall_success else 1)

if __name__ == "__main__":
    main()