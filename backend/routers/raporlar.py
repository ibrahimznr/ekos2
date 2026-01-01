from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path
import io
import os
import zipfile
import shutil
import tempfile

from models import Rapor, RaporCreate, RaporUpdate
from routers.auth import get_current_user
from database import db
from utils import generate_rapor_no
from constants import SEHIRLER

router = APIRouter(prefix="/raporlar", tags=["Raporlar"])

# ZIP Export Request Model
class ZipExportRequest(BaseModel):
    rapor_ids: List[str]

@router.get("", response_model=List[Rapor])
async def get_raporlar(
    arama: Optional[str] = None,
    kategori: Optional[str] = None,
    periyot: Optional[str] = None,
    uygunluk: Optional[str] = None,
    firma: Optional[str] = None,
    proje_id: Optional[str] = None,
    limit: int = 500,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Proje filtresi - en öncelikli
    if proje_id:
        query["proje_id"] = proje_id
    
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

# ZIP Export Route - Seçili raporları ZIP olarak indir
@router.post("/zip-export")
async def zip_export_raporlar(
    request: ZipExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Seçilen raporları kategoriye göre gruplandırılmış klasör yapısıyla ZIP dosyası olarak indirir.
    
    Yapı:
    ZIP/
    ├── Kategori_A/
    │   ├── RAPOR_001/
    │   │   ├── bilgi.txt
    │   │   └── dosyalar...
    │   └── RAPOR_002/
    ├── Kategori_B/
    │   └── RAPOR_003/
    └── ...
    """
    rapor_ids = request.rapor_ids
    
    if not rapor_ids:
        raise HTTPException(status_code=400, detail="En az bir rapor seçilmelidir")
    
    if len(rapor_ids) > 100:
        raise HTTPException(status_code=400, detail="En fazla 100 rapor seçilebilir")
    
    # Seçilen raporları getir
    raporlar = await db.raporlar.find({"id": {"$in": rapor_ids}}, {"_id": 0}).to_list(100)
    
    if not raporlar:
        raise HTTPException(status_code=404, detail="Seçilen raporlar bulunamadı")
    
    # Geçici klasör oluştur
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Raporları kategoriye göre grupla
        kategori_raporlar = {}
        for rapor in raporlar:
            kategori = rapor.get("kategori", "Kategorisiz")
            if kategori not in kategori_raporlar:
                kategori_raporlar[kategori] = []
            kategori_raporlar[kategori].append(rapor)
        
        # Her kategori için klasör oluştur ve raporları içine yerleştir
        for kategori, kategori_rapor_listesi in kategori_raporlar.items():
            # Kategori klasör adını güvenli hale getir
            safe_kategori = "".join(c if c.isalnum() or c in "-_ ()" else "_" for c in kategori)
            kategori_folder = os.path.join(temp_dir, safe_kategori)
            os.makedirs(kategori_folder, exist_ok=True)
            
            # Bu kategorideki her rapor için klasör oluştur
            for rapor in kategori_rapor_listesi:
                rapor_no = rapor.get("rapor_no", f"RAPOR_{rapor.get('id', 'unknown')[:8]}")
                # Klasör adını güvenli hale getir (özel karakterleri kaldır)
                safe_rapor_no = "".join(c if c.isalnum() or c in "-_" else "_" for c in rapor_no)
                rapor_folder = os.path.join(kategori_folder, f"RAPOR_{safe_rapor_no}")
                os.makedirs(rapor_folder, exist_ok=True)
                
                # bilgi.txt dosyası oluştur
                bilgi_content = f"""╔══════════════════════════════════════════════════════════════╗
║                    RAPOR BİLGİLERİ                           ║
╚══════════════════════════════════════════════════════════════╝

📋 Rapor No        : {rapor.get('rapor_no', 'Belirtilmemiş')}
📅 Oluşturma Tarihi: {rapor.get('created_at', 'Belirtilmemiş')[:10] if rapor.get('created_at') else 'Belirtilmemiş'}
🏢 Firma           : {rapor.get('firma', 'Belirtilmemiş')}
🔧 Ekipman Adı     : {rapor.get('ekipman_adi', 'Belirtilmemiş')}
📂 Kategori        : {rapor.get('kategori', 'Belirtilmemiş')}
📁 Alt Kategori    : {rapor.get('alt_kategori', 'Belirtilmemiş')}
📍 Lokasyon        : {rapor.get('lokasyon', 'Belirtilmemiş')}
🏭 Marka/Model     : {rapor.get('marka_model', 'Belirtilmemiş')}
🔢 Seri No         : {rapor.get('seri_no', 'Belirtilmemiş')}
⏱️ Periyot         : {rapor.get('periyot', 'Belirtilmemiş')}
📅 Geçerlilik      : {rapor.get('gecerlilik_tarihi', 'Belirtilmemiş')}
✅ Uygunluk        : {rapor.get('uygunluk', 'Belirtilmemiş')}
🏙️ Şehir           : {rapor.get('sehir', 'Belirtilmemiş')}
📝 Proje           : {rapor.get('proje_adi', 'Belirtilmemiş')}
👤 Oluşturan       : {rapor.get('created_by_username', 'Belirtilmemiş')}
📊 Durum           : {rapor.get('durum', 'Aktif')}

═══════════════════════════════════════════════════════════════
📝 AÇIKLAMA:
───────────────────────────────────────────────────────────────
{rapor.get('aciklama', 'Açıklama bulunmamaktadır.')}
═══════════════════════════════════════════════════════════════

Bu dosya EKOS - Ekipman Kontrol Otomasyon Sistemi tarafından 
otomatik olarak oluşturulmuştur.
Tarih: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M:%S')} UTC
"""
                
                bilgi_path = os.path.join(rapor_folder, "bilgi.txt")
                with open(bilgi_path, "w", encoding="utf-8") as f:
                    f.write(bilgi_content)
                
                # Rapora ait dosyaları kopyala
                rapor_id = rapor.get("id")
                dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
                
                for idx, dosya in enumerate(dosyalar):
                    dosya_path = Path(dosya.get("dosya_yolu", ""))
                    if dosya_path.exists():
                        # Orijinal dosya adını kullan
                        original_name = dosya.get("dosya_adi", f"dosya_{idx}")
                        # Dosya adını güvenli hale getir
                        safe_name = "".join(c if c.isalnum() or c in ".-_" else "_" for c in original_name)
                        dest_path = os.path.join(rapor_folder, safe_name)
                        
                        # Aynı isimde dosya varsa numara ekle
                        counter = 1
                        base_name, ext = os.path.splitext(safe_name)
                        while os.path.exists(dest_path):
                            dest_path = os.path.join(rapor_folder, f"{base_name}_{counter}{ext}")
                            counter += 1
                        
                        shutil.copy2(str(dosya_path), dest_path)
        
        # ZIP dosyası oluştur
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, temp_dir)
                    zip_file.write(file_path, arcname)
        
        zip_buffer.seek(0)
        
        # Dosya adı oluştur - kategori sayısını da ekle
        now = datetime.now(timezone.utc)
        username = current_user.get("username", "user")
        kategori_count = len(kategori_raporlar)
        rapor_count = len(raporlar)
        zip_filename = f"Raporlar_{kategori_count}Kategori_{rapor_count}Rapor_{now.strftime('%Y%m%d_%H%M')}.zip"
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{zip_filename}"',
                "Content-Type": "application/zip"
            }
        )
        
    finally:
        # Geçici klasörü temizle
        shutil.rmtree(temp_dir, ignore_errors=True)

