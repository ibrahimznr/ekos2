"""
Script to update existing projects with firma_adi field
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def update_projects():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ekipman_db"]
    
    # Update all projects without firma_adi
    result = await db.projeler.update_many(
        {"firma_adi": {"$exists": False}},
        {"$set": {"firma_adi": "ABC Firma"}}
    )
    
    print(f"✅ {result.modified_count} proje güncellendi!")
    
    # Also update projects with null firma_adi
    result2 = await db.projeler.update_many(
        {"firma_adi": None},
        {"$set": {"firma_adi": "ABC Firma"}}
    )
    
    print(f"✅ {result2.modified_count} proje daha güncellendi!")
    
    # Show all projects
    print("\n📋 Mevcut projeler:")
    async for proje in db.projeler.find():
        print(f"  - {proje.get('proje_adi')} | Firma: {proje.get('firma_adi', 'YOK')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_projects())
