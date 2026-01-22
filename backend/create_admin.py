"""
Script to verify and fix admin user in MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def fix_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ekipman_db"]
    
    print("📋 Mevcut kullanıcılar:")
    async for user in db.users.find():
        print(f"\n  Kullanıcı: {user}")
        # Test password verification
        if user.get('email') == 'ibrahimznrmak@gmail.com':
            is_valid = verify_password("admin234", user.get('password', ''))
            print(f"  Şifre doğrulama testi: {is_valid}")
    
    # Delete existing admin with new email and recreate properly
    await db.users.delete_one({"email": "ibrahimznrmak@gmail.com"})
    print("\n🗑️ Eski kullanıcı silindi")
    
    # Create new admin with all required fields
    new_admin = {
        "id": str(uuid.uuid4()),
        "username": "miharbirnz",
        "email": "ibrahimznrmak@gmail.com",
        "password": get_password_hash("admin234"),
        "role": "admin",
        "email_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "firma_adi": None,
        "verification_code": None,
        "active_session_token": None
    }
    
    await db.users.insert_one(new_admin)
    print("✅ Yeni admin oluşturuldu!")
    
    # Verify
    admin = await db.users.find_one({"email": "ibrahimznrmak@gmail.com"})
    print(f"\n� Oluşturulan admin:")
    print(f"  ID: {admin.get('id')}")
    print(f"  Username: {admin.get('username')}")
    print(f"  Email: {admin.get('email')}")
    print(f"  Role: {admin.get('role')}")
    print(f"  Email Verified: {admin.get('email_verified')}")
    
    # Test password
    is_valid = verify_password("admin234", admin.get('password', ''))
    print(f"  Şifre doğrulama: {'✅ Başarılı' if is_valid else '❌ Başarısız'}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin())
