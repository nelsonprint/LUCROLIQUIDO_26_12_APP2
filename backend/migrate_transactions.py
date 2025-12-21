"""
Script de migração para atualizar lançamentos antigos com:
1. category_id (vinculando ao Plano de Contas)
2. competence_month (baseado no campo date)
3. Denormalização (category_name, category_group, is_indirect_for_markup)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
import re

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def migrate_transactions():
    """Migrar lançamentos antigos para a nova estrutura"""
    
    print("🔍 Iniciando migração de lançamentos...\n")
    
    # Buscar todas as transações que não têm category_id
    old_transactions = await db.transactions.find({
        "category_id": {"$exists": False}
    }).to_list(10000)
    
    total = len(old_transactions)
    print(f"📊 Total de lançamentos a migrar: {total}\n")
    
    if total == 0:
        print("✅ Nenhum lançamento para migrar!")
        return
    
    migrated = 0
    skipped = 0
    errors = []
    
    for transaction in old_transactions:
        try:
            transaction_id = transaction.get("id")
            company_id = transaction.get("company_id")
            old_category = transaction.get("category", "")
            date_str = transaction.get("date", "")
            
            # Extrair competence_month do campo date (YYYY-MM-DD -> YYYY-MM)
            competence_month = None
            if date_str:
                match = re.match(r"(\d{4}-\d{2})", date_str)
                if match:
                    competence_month = match.group(1)
            
            if not competence_month:
                errors.append(f"❌ {transaction_id}: Data inválida '{date_str}'")
                skipped += 1
                continue
            
            # Buscar categoria no Plano de Contas por nome (matching aproximado)
            category = await db.expense_categories.find_one({
                "company_id": company_id,
                "name": {"$regex": f"^{re.escape(old_category)}$", "$options": "i"}
            }, {"_id": 0})
            
            # Se não encontrou, tentar criar categoria no Plano de Contas
            if not category:
                # Determinar grupo baseado no nome
                category_group = "FIXA"  # Default
                is_indirect = True  # Default
                
                # Lógica de classificação baseada em palavras-chave
                lower_cat = old_category.lower()
                if any(word in lower_cat for word in ["material", "obra", "subempreit", "operacion", "equipamento"]):
                    category_group = "DIRETA_OBRA"
                    is_indirect = False
                elif any(word in lower_cat for word in ["combustivel", "manutencao", "escritorio"]):
                    category_group = "VARIAVEL_INDIRETA"
                
                # Criar categoria no Plano de Contas
                from uuid import uuid4
                new_category = {
                    "id": str(uuid4()),
                    "company_id": company_id,
                    "name": old_category,
                    "type": transaction.get("type", "despesa"),
                    "group": category_group,
                    "is_indirect_for_markup": is_indirect,
                    "description": f"Migrado automaticamente de lançamento antigo",
                    "active": True,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                await db.expense_categories.insert_one(new_category)
                category = new_category
                print(f"✨ Criada categoria: '{old_category}' ({category_group})")
            
            # Atualizar o lançamento
            update_data = {
                "category_id": category["id"],
                "competence_month": competence_month,
                "category_name": category["name"],
                "category_group": category.get("group"),
                "is_indirect_for_markup": category.get("is_indirect_for_markup", False)
            }
            
            await db.transactions.update_one(
                {"id": transaction_id},
                {"$set": update_data}
            )
            
            migrated += 1
            
            if migrated % 50 == 0:
                print(f"⏳ Progresso: {migrated}/{total} migrados...")
        
        except Exception as e:
            errors.append(f"❌ {transaction_id}: {str(e)}")
            skipped += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Migração concluída!")
    print(f"📊 Migrados: {migrated}")
    print(f"⚠️  Pulados: {skipped}")
    
    if errors:
        print(f"\n⚠️  Erros ({len(errors)}):")
        for error in errors[:10]:  # Mostrar apenas os primeiros 10
            print(f"   {error}")
        if len(errors) > 10:
            print(f"   ... e mais {len(errors) - 10} erros")
    
    print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(migrate_transactions())
