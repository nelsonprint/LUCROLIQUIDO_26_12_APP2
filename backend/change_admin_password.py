#!/usr/bin/env python3
"""
Script para alterar a senha do administrador
Uso: python change_admin_password.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def change_admin_password():
    # Conectar ao MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'lucro_liquido_db')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔐 Alterar Senha do Administrador")
    print("=" * 50)
    
    # Solicitar nova senha
    new_password = input("\nDigite a nova senha: ")
    confirm_password = input("Confirme a nova senha: ")
    
    if new_password != confirm_password:
        print("❌ Senhas não coincidem!")
        return
    
    if len(new_password) < 6:
        print("❌ Senha deve ter no mínimo 6 caracteres!")
        return
    
    # Atualizar senha no banco
    result = await db.users.update_one(
        {"email": "admin@lucroliquido.com"},
        {"$set": {"password": new_password}}
    )
    
    if result.modified_count > 0:
        print(f"\n✅ Senha do admin alterada com sucesso!")
        print(f"📧 Email: admin@lucroliquido.com")
        print(f"🔑 Nova senha: {new_password}")
    else:
        print("❌ Admin não encontrado no banco de dados!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(change_admin_password())
