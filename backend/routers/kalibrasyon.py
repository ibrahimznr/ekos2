from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from models.kalibrasyon import KalibrasyonCihazi, KalibrasyonCihaziCreate
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/kalibrasyon", tags=["Kalibrasyon"])

@router.get("", response_model=List[KalibrasyonCihazi])
async def get_kalibrasyon_cihazlari(current_user: dict = Depends(get_current_user)):
    """Tüm kalibrasyon cihazlarını listele"""
    cihazlar = await db.kalibrasyon_cihazlari.find({}, {"_id": 0}).to_list(1000)
    for cihaz in cihazlar:
        if isinstance(cihaz.get('created_at'), str):
            cihaz['created_at'] = datetime.fromisoformat(cihaz['created_at'])
    return cihazlar

@router.post("", response_model=KalibrasyonCihazi)
async def create_kalibrasyon_cihazi(
    cihaz_data: KalibrasyonCihaziCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Yeni kalibrasyon cihazı ekle"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    cihaz = KalibrasyonCihazi(
        cihaz_adi=cihaz_data.cihaz_adi,
        seri_no=cihaz_data.seri_no,
        kalibrasyon_tarihi=cihaz_data.kalibrasyon_tarihi,
        created_by=current_user["id"],
        created_by_username=current_user.get("username", current_user["email"])
    )
    
    doc = cihaz.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.kalibrasyon_cihazlari.insert_one(doc)
    
    return cihaz

@router.put("/{cihaz_id}", response_model=KalibrasyonCihazi)
async def update_kalibrasyon_cihazi(
    cihaz_id: str,
    cihaz_data: KalibrasyonCihaziCreate,
    current_user: dict = Depends(get_current_user)
):
    """Kalibrasyon cihazını güncelle"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.kalibrasyon_cihazlari.find_one({"id": cihaz_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    
    await db.kalibrasyon_cihazlari.update_one(
        {"id": cihaz_id},
        {"$set": {
            "cihaz_adi": cihaz_data.cihaz_adi,
            "seri_no": cihaz_data.seri_no,
            "kalibrasyon_tarihi": cihaz_data.kalibrasyon_tarihi
        }}
    )
    
    updated = await db.kalibrasyon_cihazlari.find_one({"id": cihaz_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@router.delete("/{cihaz_id}")
async def delete_kalibrasyon_cihazi(cihaz_id: str, current_user: dict = Depends(get_current_user)):
    """Kalibrasyon cihazını sil"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.kalibrasyon_cihazlari.delete_one({"id": cihaz_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    
    return {"message": "Cihaz silindi"}
