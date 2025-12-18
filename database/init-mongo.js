// Script de Inicialização do MongoDB - Lucro Líquido
// Execute com: mongosh < init-mongo.js

// Usar/criar banco de dados
use lucro_liquido

print("\n=== Iniciando configuração do banco de dados ===")

// ==========================================
// CRIAR ÍNDICES PARA PERFORMANCE
// ==========================================

print("\nCriando índices...")

// Users
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "id": 1 })
print("✓ Índices de users criados")

// Companies
db.companies.createIndex({ "user_id": 1 })
db.companies.createIndex({ "id": 1 })
print("✓ Índices de companies criados")

// Clientes
db.clientes.createIndex({ "empresa_id": 1 })
db.clientes.createIndex({ "cpf": 1 }, { sparse: true })
db.clientes.createIndex({ "cnpj": 1 }, { sparse: true })
db.clientes.createIndex({ "id": 1 })
print("✓ Índices de clientes criados")

// Orçamentos
db.orcamentos.createIndex({ "empresa_id": 1 })
db.orcamentos.createIndex({ "numero_orcamento": 1 })
db.orcamentos.createIndex({ "created_at": -1 })
db.orcamentos.createIndex({ "id": 1 })
print("✓ Índices de orcamentos criados")

// Transactions
db.transactions.createIndex({ "company_id": 1, "date": -1 })
db.transactions.createIndex({ "type": 1 })
db.transactions.createIndex({ "id": 1 })
print("✓ Índices de transactions criados")

// Contas
db.contas.createIndex({ "empresa_id": 1 })
db.contas.createIndex({ "status": 1 })
db.contas.createIndex({ "data_vencimento": 1 })
print("✓ Índices de contas criados")

// Materials
db.materials.createIndex({ "company_id": 1 })
print("✓ Índices de materials criados")

// Categories
db.categories.createIndex({ "company_id": 1 })
print("✓ Índices de categories criados")

print("\n=== Configuração concluída com sucesso! ===")
print("\nColeções disponíveis:")
db.getCollectionNames().forEach(function(collection) {
    print("  - " + collection)
})
