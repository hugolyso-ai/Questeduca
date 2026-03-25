#!/usr/bin/env python3
"""
Script para inicializar dados básicos do QUESTEDUCA no MongoDB
Dados reais de escolas portuguesas extraídos dos ficheiros Excel oficiais
"""
import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from schools_data import PORTUGUESE_DISTRICTS, PORTUGUESE_SCHOOLS

load_dotenv('/app/backend/.env')

async def init_database():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Conectando a {mongo_url} - Database: {db_name}")
    
    # Initialize Districts
    print("Inicializando distritos...")
    await db.districts.delete_many({})
    if PORTUGUESE_DISTRICTS:
        await db.districts.insert_many(PORTUGUESE_DISTRICTS)
        print(f"✅ {len(PORTUGUESE_DISTRICTS)} distritos inseridos")
    
    # Initialize Schools with real Portuguese school data
    print("Inicializando escolas (dados reais)...")
    await db.schools.delete_many({})
    if PORTUGUESE_SCHOOLS:
        await db.schools.insert_many(PORTUGUESE_SCHOOLS)
        print(f"✅ {len(PORTUGUESE_SCHOOLS)} escolas reais inseridas")
    
    # Create indexes
    print("Criando índices...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.students.create_index("user_id", unique=True)
    await db.students.create_index("student_id", unique=True)
    await db.parents.create_index("user_id", unique=True)
    await db.associations.create_index("association_code", unique=True)
    await db.giftcards.create_index("code", unique=True)
    
    print("✅ Índices criados")
    
    # Count documents
    users_count = await db.users.count_documents({})
    districts_count = await db.districts.count_documents({})
    schools_count = await db.schools.count_documents({})
    
    print("\n📊 Estatísticas do Database:")
    print(f"   - Utilizadores: {users_count}")
    print(f"   - Distritos: {districts_count}")
    print(f"   - Escolas: {schools_count}")
    
    print("\n✨ Database inicializado com sucesso!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
