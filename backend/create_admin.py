"""
Script to create initial admin user for QUESTEDUCA
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import hash_password
import os
from datetime import datetime, timezone
import uuid

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'questeduca')

ADMIN_EMAIL = "info@serv2all.pt"
ADMIN_PASSWORD = "Quest1234*"
ADMIN_NAME = "Administrador QUESTEDUCA"

async def create_admin():
    """Create admin user if not exists"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Check if admin exists
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    
    if existing:
        print(f"Admin user already exists: {ADMIN_EMAIL}")
        # Update must_change_password flag
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"must_change_password": True}}
        )
        print("Updated must_change_password flag to True")
        return existing['user_id']
    
    # Create new admin
    user_id = f"admin_{uuid.uuid4().hex[:12]}"
    hashed_pw = await hash_password(ADMIN_PASSWORD)
    
    admin_user = {
        "user_id": user_id,
        "email": ADMIN_EMAIL,
        "name": ADMIN_NAME,
        "role": "admin",
        "picture": None,
        "password": hashed_pw,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "must_change_password": True,
        "is_active": True
    }
    
    await db.users.insert_one(admin_user)
    
    print(f"✅ Admin user created successfully!")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   Password: {ADMIN_PASSWORD}")
    print(f"   User ID: {user_id}")
    print(f"   ⚠️  Must change password on first login")
    
    client.close()
    return user_id

if __name__ == "__main__":
    asyncio.run(create_admin())
