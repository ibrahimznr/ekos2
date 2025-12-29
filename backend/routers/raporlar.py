from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path

from models import Rapor, RaporCreate
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/raporlar", tags=["Raporlar"])

class RaporUpdate(BaseModel):
    proje_id: Optional[str] = None
    sehir: Optional[str] = None
    ekipman_adi: Optional[str] = None
    kategori: Optional[str] = None
    alt_kategori: Optional[str] = None
    firma: Optional[str] = None
    lokasyon: Optional[str] = None
    marka_model: Optional[str] = None
    seri_no: Optional[str] = None
    periyot: Optional[str] = None
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    uygunluk: Optional[str] = None

@router.get("", response_model=List[Rapor])
async def get_raporlar(
    arama: Optional[str] = None,
    kategori: Optional[str] = None,
    periyot: Optional[str] = None,
    uygunluk: Optional[str] = None,
    firma: Optional[str] = None,
    limit: int = 500,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    from server import db
    
    query = {}
    
    user_firma = current_user.get("firma_adi")
    if user_firma and current_user.get("role") == "viewer":
        query["firma"] = user_firma
    elif firma:
        query["firma"] = firma
    
    if arama:
        if user_firma and current_user.get("role") == "viewer":
            query["$and"] = [
                {"firma": user_firma},
                {"$or": [
                    {"rapor_no": {"$regex": arama, "$options": "i"}},
                    {"ekipman_adi": {"$regex": arama, "$options": "i"}},
                    {"firma": {"$regex": arama, "$options": "i"}}
                ]}
            ]
        else:
            query["$or"] = [
                {"rapor_no": {"$regex": arama, "$options": "i"}},
                {"ekipman_adi": {"$regex": arama, "$options": "i"}},
                {"firma": {"$regex": arama, "$options": "i"}}
            ]
    
    if kategori:
        query["kategori"] = kategori
    
    if periyot:
        query["periyot"] = periyot
    
    if uygunluk:
        query["uygunluk"] = uygunluk
    
    raporlar = await db.raporlar.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for rapor in raporlar:
        if isinstance(rapor['created_at'], str):
            rapor['created_at'] = datetime.fromisoformat(rapor['created_at'])
        if isinstance(rapor['updated_at'], str):
            rapor['updated_at'] = datetime.fromisoformat(rapor['updated_at'])
        if 'created_by_username' not in rapor or not rapor['created_by_username']:
            rapor['created_by_username'] = 'Bilinmiyor'
    
    return raporlar

@router.get("/{rapor_id}", response_model=Rapor)
async def get_rapor(rapor_id: str, current_user: dict = Depends(get_current_user)):
    from server import db
    
    rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    if isinstance(rapor['created_at'], str):
        rapor['created_at'] = datetime.fromisoformat(rapor['created_at'])
    if isinstance(rapor['updated_at'], str):
        rapor['updated_at'] = datetime.fromisoformat(rapor['updated_at'])
    if 'created_by_username' not in rapor or not rapor['created_by_username']:
        rapor['created_by_username'] = 'Bilinmiyor'
    
    return rapor

@router.post("", response_model=Rapor)
async def create_rapor(rapor_create: RaporCreate, current_user: dict = Depends(get_current_user)):
    from server import db, generate_rapor_no
    from constants import SEHIRLER
    
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor oluşturma yetkiniz yok")
    
    proje = await db.projeler.find_one({"id": rapor_create.proje_id}, {"_id": 0})
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    
    sehir_obj = next((s for s in SEHIRLER if s["isim"] == rapor_create.sehir), None)
    if not sehir_obj:
        raise HTTPException(status_code=400, detail="Geçersiz şehir")
    
    rapor_no = await generate_rapor_no(rapor_create.sehir)
    
    rapor = Rapor(
        rapor_no=rapor_no,
        proje_id=proje["id"],
        proje_adi=proje["proje_adi"],
        sehir=rapor_create.sehir,
        sehir_kodu=sehir_obj["kod"],
        created_by=current_user["id"],
        created_by_username=current_user["username"],
        ekipman_adi=rapor_create.ekipman_adi,
        kategori=rapor_create.kategori,
        alt_kategori=rapor_create.alt_kategori,
        firma=rapor_create.firma,
        lokasyon=rapor_create.lokasyon,
        marka_model=rapor_create.marka_model,
        seri_no=rapor_create.seri_no,
        periyot=rapor_create.periyot,
        gecerlilik_tarihi=rapor_create.gecerlilik_tarihi,
        aciklama=rapor_create.aciklama,
        uygunluk=rapor_create.uygunluk
    )
    
    doc = rapor.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.raporlar.insert_one(doc)
    
    return rapor

@router.put("/{rapor_id}", response_model=Rapor)
async def update_rapor(
    rapor_id: str,
    rapor_update: RaporUpdate,
    current_user: dict = Depends(get_current_user)
):
    from server import db
    
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor düzenleme yetkiniz yok")
    
    rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    update_data = {k: v for k, v in rapor_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.raporlar.update_one({"id": rapor_id}, {"$set": update_data})
    
    updated_rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if isinstance(updated_rapor['created_at'], str):
        updated_rapor['created_at'] = datetime.fromisoformat(updated_rapor['created_at'])
    if isinstance(updated_rapor['updated_at'], str):
        updated_rapor['updated_at'] = datetime.fromisoformat(updated_rapor['updated_at'])
    
    return updated_rapor

@router.delete("/{rapor_id}")
async def delete_rapor(rapor_id: str, current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor silme yetkiniz yok")
    
    dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
    for dosya in dosyalar:
        dosya_path = Path(dosya["dosya_yolu"])
        if dosya_path.exists():
            dosya_path.unlink()
    
    await db.medya_dosyalari.delete_many({"rapor_id": rapor_id})
    
    result = await db.raporlar.delete_one({"id": rapor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    return {"message": "Rapor silindi"}

@router.patch("/{rapor_id}/durum")
async def toggle_rapor_durum(rapor_id: str, current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor durumunu değiştirme yetkiniz yok")
    
    rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    yeni_durum = "Pasif" if rapor.get("durum", "Aktif") == "Aktif" else "Aktif"
    
    await db.raporlar.update_one(
        {"id": rapor_id},
        {"$set": {"durum": yeni_durum, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Rapor durumu {yeni_durum} olarak güncellendi", "durum": yeni_durum}

@router.post("/bulk-delete")
async def bulk_delete_raporlar(rapor_ids: List[str], current_user: dict = Depends(get_current_user)):
    from server import db
    
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor silme yetkiniz yok")
    
    for rapor_id in rapor_ids:
        dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
        for dosya in dosyalar:
            dosya_path = Path(dosya["dosya_yolu"])
            if dosya_path.exists():
                dosya_path.unlink()
        await db.medya_dosyalari.delete_many({"rapor_id": rapor_id})
    
    result = await db.raporlar.delete_many({"id": {"$in": rapor_ids}})
    return {"message": f"{result.deleted_count} rapor silindi", "deleted_count": result.deleted_count}
