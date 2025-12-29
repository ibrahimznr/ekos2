from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from models import Kategori, KategoriCreate
from routers.auth import get_current_user

router = APIRouter(prefix="/kategoriler", tags=["Kategoriler"])

@router.get("", response_model=List[Kategori])
async def get_kategoriler(current_user: dict = Depends(get_current_user)):
    from server import db
    
    kategoriler = await db.kategoriler.find({}, {"_id": 0}).to_list(1000)
    for kat in kategoriler:
        if isinstance(kat['created_at'], str):
            kat['created_at'] = datetime.fromisoformat(kat['created_at'])
    return kategoriler

@router.post("", response_model=Kategori)
async def create_kategori(kategori_create: KategoriCreate, current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    kategori = Kategori(**kategori_create.model_dump())
    doc = kategori.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.kategoriler.insert_one(doc)
    return kategori

@router.put("/{kategori_id}")
async def update_kategori(kategori_id: str, kategori_update: KategoriCreate, current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.kategoriler.find_one({"id": kategori_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    update_data = kategori_update.model_dump()
    await db.kategoriler.update_one({"id": kategori_id}, {"$set": update_data})
    
    updated_kategori = await db.kategoriler.find_one({"id": kategori_id}, {"_id": 0})
    return updated_kategori

@router.delete("/{kategori_id}")
async def delete_kategori(kategori_id: str, current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.kategoriler.delete_one({"id": kategori_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    return {"message": "Kategori silindi"}

@router.post("/bulk-delete")
async def bulk_delete_kategoriler(kategori_ids: List[str], current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.kategoriler.delete_many({"id": {"$in": kategori_ids}})
    return {"message": f"{result.deleted_count} kategori silindi", "deleted_count": result.deleted_count}
