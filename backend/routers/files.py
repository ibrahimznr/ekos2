from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path
from datetime import datetime, timezone
import uuid

from routers.auth import get_current_user
from database import db

router = APIRouter(tags=["Files"])

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload/{rapor_id}")
async def upload_file(
    rapor_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Dosya yükleme yetkiniz yok")
    
    content = await file.read()
    if len(content) > 4 * 1024 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 4GB'dan büyük olamaz")
    
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Sadece JPG, PNG ve PDF formatları desteklenir")
    
    rapor = await db.raporlar.find_one({"id": rapor_id})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    file_ext = file.filename.split(".")[-1]
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    medya = {
        "id": file_id,
        "rapor_id": rapor_id,
        "dosya_adi": file.filename,
        "dosya_yolu": str(file_path),
        "dosya_tipi": file.content_type,
        "dosya_boyutu": len(content),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.medya_dosyalari.insert_one(medya)
    
    return {"message": "Dosya yüklendi", "file_id": file_id}

@router.get("/dosyalar/{rapor_id}")
async def get_dosyalar(rapor_id: str, current_user: dict = Depends(get_current_user)):
    dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
    for dosya in dosyalar:
        if isinstance(dosya['created_at'], str):
            dosya['created_at'] = datetime.fromisoformat(dosya['created_at'])
    return dosyalar

@router.get("/dosyalar/{dosya_id}/indir")
async def download_dosya(dosya_id: str, current_user: dict = Depends(get_current_user)):
    dosya = await db.medya_dosyalari.find_one({"id": dosya_id}, {"_id": 0})
    if not dosya:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    
    dosya_path = Path(dosya["dosya_yolu"])
    if not dosya_path.exists():
        raise HTTPException(status_code=404, detail="Dosya sistemde bulunamadı")
    
    file_ext = dosya["dosya_adi"].lower().split('.')[-1]
    media_type_map = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
    }
    
    media_type = media_type_map.get(file_ext, dosya.get("dosya_tipi", "application/octet-stream"))
    
    return FileResponse(
        path=str(dosya_path),
        filename=dosya["dosya_adi"],
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{dosya["dosya_adi"]}"',
            "Cache-Control": "public, max-age=3600"
        }
    )

@router.delete("/dosyalar/{dosya_id}")
async def delete_dosya(dosya_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Dosya silme yetkiniz yok")
    
    dosya = await db.medya_dosyalari.find_one({"id": dosya_id}, {"_id": 0})
    if not dosya:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    
    dosya_path = Path(dosya["dosya_yolu"])
    if dosya_path.exists():
        dosya_path.unlink()
    
    await db.medya_dosyalari.delete_one({"id": dosya_id})
    return {"message": "Dosya silindi"}
