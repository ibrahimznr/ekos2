from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from models.cephe_iskelesi import CepheIskelesi, CepheIskelesiCreate, CepheIskelesiUpdate
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/cephe-iskeleleri", tags=["Cephe İskeleleri"])

@router.get("", response_model=List[CepheIskelesi])
async def get_cephe_iskeleleri(current_user: dict = Depends(get_current_user)):
    """Tüm cephe iskelelerini listele"""
    iskeleleri = await db.cephe_iskeleleri.find({}, {"_id": 0}).to_list(1000)
    for iskele in iskeleleri:
        if isinstance(iskele.get('created_at'), str):
            iskele['created_at'] = datetime.fromisoformat(iskele['created_at'])
        if isinstance(iskele.get('updated_at'), str):
            iskele['updated_at'] = datetime.fromisoformat(iskele['updated_at'])
    return iskeleleri

@router.get("/{iskele_id}", response_model=CepheIskelesi)
async def get_cephe_iskelesi(iskele_id: str, current_user: dict = Depends(get_current_user)):
    """Tek bir cephe iskelesini ID ile getir"""
    iskele = await db.cephe_iskeleleri.find_one({"id": iskele_id}, {"_id": 0})
    if not iskele:
        raise HTTPException(status_code=404, detail="Cephe iskelesi bulunamadı")
    if isinstance(iskele.get('created_at'), str):
        iskele['created_at'] = datetime.fromisoformat(iskele['created_at'])
    if isinstance(iskele.get('updated_at'), str):
        iskele['updated_at'] = datetime.fromisoformat(iskele['updated_at'])
    return iskele

@router.post("", response_model=CepheIskelesi)
async def create_cephe_iskelesi(iskele_create: CepheIskelesiCreate, current_user: dict = Depends(get_current_user)):
    """Yeni cephe iskelesi raporu ekle"""
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    iskele = CepheIskelesi(**iskele_create.model_dump())
    doc = iskele.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('updated_at'):
        doc['updated_at'] = doc['updated_at'].isoformat()
    await db.cephe_iskeleleri.insert_one(doc)
    return iskele

@router.put("/{iskele_id}", response_model=CepheIskelesi)
async def update_cephe_iskelesi(iskele_id: str, iskele_update: CepheIskelesiUpdate, current_user: dict = Depends(get_current_user)):
    """Cephe iskelesi güncelle"""
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.cephe_iskeleleri.find_one({"id": iskele_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Cephe iskelesi bulunamadı")
    
    update_data = iskele_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.cephe_iskeleleri.update_one({"id": iskele_id}, {"$set": update_data})
    
    updated_iskele = await db.cephe_iskeleleri.find_one({"id": iskele_id}, {"_id": 0})
    if isinstance(updated_iskele.get('created_at'), str):
        updated_iskele['created_at'] = datetime.fromisoformat(updated_iskele['created_at'])
    if isinstance(updated_iskele.get('updated_at'), str):
        updated_iskele['updated_at'] = datetime.fromisoformat(updated_iskele['updated_at'])
    return updated_iskele

@router.delete("/{iskele_id}")
async def delete_cephe_iskelesi(iskele_id: str, current_user: dict = Depends(get_current_user)):
    """Cephe iskelesi sil"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.cephe_iskeleleri.delete_one({"id": iskele_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cephe iskelesi bulunamadı")
    return {"message": "Cephe iskelesi silindi"}

@router.post("/bulk-delete")
async def bulk_delete_cephe_iskeleleri(iskele_ids: List[str], current_user: dict = Depends(get_current_user)):
    """Toplu cephe iskelesi sil"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.cephe_iskeleleri.delete_many({"id": {"$in": iskele_ids}})
    return {"message": f"{result.deleted_count} cephe iskelesi silindi", "deleted_count": result.deleted_count}
