from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from models import Proje, ProjeCreate
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/projeler", tags=["Projeler"])

@router.get("", response_model=List[Proje])
async def get_projeler(current_user: dict = Depends(get_current_user)):
    projeler = await db.projeler.find({}, {"_id": 0}).to_list(1000)
    for proje in projeler:
        if isinstance(proje['created_at'], str):
            proje['created_at'] = datetime.fromisoformat(proje['created_at'])
    return projeler

@router.post("", response_model=Proje)
async def create_proje(proje_create: ProjeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    proje = Proje(**proje_create.model_dump())
    doc = proje.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.projeler.insert_one(doc)
    return proje

@router.put("/{proje_id}")
async def update_proje(proje_id: str, proje_update: ProjeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.projeler.find_one({"id": proje_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    
    update_data = proje_update.model_dump()
    await db.projeler.update_one({"id": proje_id}, {"$set": update_data})
    
    updated_proje = await db.projeler.find_one({"id": proje_id}, {"_id": 0})
    return updated_proje

@router.delete("/{proje_id}")
async def delete_proje(proje_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.projeler.delete_one({"id": proje_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    return {"message": "Proje silindi"}

@router.post("/bulk-delete")
async def bulk_delete_projeler(proje_ids: List[str], current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.projeler.delete_many({"id": {"$in": proje_ids}})
    return {"message": f"{result.deleted_count} proje silindi", "deleted_count": result.deleted_count}
