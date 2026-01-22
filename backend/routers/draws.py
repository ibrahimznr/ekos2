"""
Çekiliş (Draws) Router
Çekiliş havuzu yönetimi için API endpoint'leri
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel, Field
import pandas as pd
import io
import random
from datetime import datetime, timezone
import uuid

from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/draws", tags=["draws"])


# Models
class DrawCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    main_count: int = Field(ge=1, le=1000)
    backup_count: int = Field(ge=0, le=1000)


class ParticipantCreate(BaseModel):
    id_no: str = Field(min_length=1)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    contact: str = Field(min_length=1)


@router.post("")
async def create_draw(draw_data: DrawCreate, current_user=Depends(get_current_user)):
    """Yeni çekiliş oluştur"""
    draw_id = str(uuid.uuid4())
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    
    draw_dict = {
        "id": draw_id,
        "user_id": user_id,
        "name": draw_data.name,
        "main_count": draw_data.main_count,
        "backup_count": draw_data.backup_count,
        "status": "pending",
        "participant_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    
    await db.draws.insert_one(draw_dict)
    
    # Return without _id
    draw_dict.pop('_id', None)
    draw_dict['created_at'] = datetime.fromisoformat(draw_dict['created_at'])
    return draw_dict


@router.get("")
async def list_draws(current_user=Depends(get_current_user)):
    """Kullanıcının tüm çekilişlerini listele"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draws = await db.draws.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=None)
    
    for draw in draws:
        if isinstance(draw.get('created_at'), str):
            draw['created_at'] = datetime.fromisoformat(draw['created_at'])
        if draw.get('completed_at') and isinstance(draw['completed_at'], str):
            draw['completed_at'] = datetime.fromisoformat(draw['completed_at'])
    
    return draws


@router.get("/{draw_id}")
async def get_draw(draw_id: str, current_user=Depends(get_current_user)):
    """Çekiliş detayını getir"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one(
        {"id": draw_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    if isinstance(draw.get('created_at'), str):
        draw['created_at'] = datetime.fromisoformat(draw['created_at'])
    if draw.get('completed_at') and isinstance(draw['completed_at'], str):
        draw['completed_at'] = datetime.fromisoformat(draw['completed_at'])
    
    return draw


@router.post("/{draw_id}/participants")
async def add_participant(draw_id: str, participant_data: ParticipantCreate, current_user=Depends(get_current_user)):
    """Çekilişe manuel katılımcı ekle"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    if draw["status"] == "completed":
        raise HTTPException(status_code=400, detail="Tamamlanmış çekilişe katılımcı eklenemez")
    
    existing = await db.participants.find_one({
        "draw_id": draw_id,
        "id_no": participant_data.id_no
    })
    if existing:
        raise HTTPException(status_code=400, detail="Bu ID No zaten kayıtlı")
    
    participant_id = str(uuid.uuid4())
    participant_dict = {
        "id": participant_id,
        "draw_id": draw_id,
        "user_id": user_id,
        "id_no": participant_data.id_no,
        "first_name": participant_data.first_name,
        "last_name": participant_data.last_name,
        "contact": participant_data.contact,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.participants.insert_one(participant_dict)
    await db.draws.update_one({"id": draw_id}, {"$inc": {"participant_count": 1}})
    
    participant_dict.pop('_id', None)
    participant_dict['created_at'] = datetime.fromisoformat(participant_dict['created_at'])
    return participant_dict


@router.post("/{draw_id}/participants/upload")
async def upload_participants(draw_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    """Excel dosyasından toplu katılımcı yükle"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    if draw["status"] == "completed":
        raise HTTPException(status_code=400, detail="Tamamlanmış çekilişe katılımcı eklenemez")
    
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower().strip()
            if 'id' in col_lower or 'no' in col_lower:
                column_mapping['id_no'] = col
            elif 'ad' in col_lower or 'first' in col_lower:
                column_mapping['first_name'] = col
            elif 'soyad' in col_lower or 'last' in col_lower:
                column_mapping['last_name'] = col
            elif 'iletişim' in col_lower or 'contact' in col_lower or 'email' in col_lower or 'telefon' in col_lower:
                column_mapping['contact'] = col
        
        required = ['id_no', 'first_name', 'last_name', 'contact']
        missing = [r for r in required if r not in column_mapping]
        if missing:
            raise HTTPException(status_code=400, detail=f"Excel'de gerekli sütunlar bulunamadı: {missing}")
        
        existing_ids = set()
        existing_participants = await db.participants.find({"draw_id": draw_id}, {"id_no": 1}).to_list(length=None)
        existing_ids = {p["id_no"] for p in existing_participants}
        
        added_count = 0
        duplicate_count = 0
        participants = []
        
        for _, row in df.iterrows():
            try:
                id_no = str(row[column_mapping['id_no']]).strip()
                first_name = str(row[column_mapping['first_name']]).strip()
                last_name = str(row[column_mapping['last_name']]).strip()
                contact = str(row[column_mapping['contact']]).strip()
                
                if not id_no or id_no == 'nan':
                    continue
                
                if id_no in existing_ids:
                    duplicate_count += 1
                    continue
                
                participant_dict = {
                    "id": str(uuid.uuid4()),
                    "draw_id": draw_id,
                    "user_id": user_id,
                    "id_no": id_no,
                    "first_name": first_name,
                    "last_name": last_name,
                    "contact": contact,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                participants.append(participant_dict)
                existing_ids.add(id_no)
                added_count += 1
                
            except Exception:
                continue
        
        if participants:
            await db.participants.insert_many(participants)
            await db.draws.update_one({"id": draw_id}, {"$inc": {"participant_count": added_count}})
        
        return {
            "success": True,
            "added": added_count,
            "duplicates": duplicate_count,
            "total_participants": added_count + len(existing_participants)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dosya işlenirken hata: {str(e)}")


@router.get("/{draw_id}/participants")
async def list_participants(draw_id: str, current_user=Depends(get_current_user)):
    """Çekiliş katılımcılarını listele"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    participants = await db.participants.find({"draw_id": draw_id}, {"_id": 0}).to_list(length=None)
    
    for p in participants:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return participants


@router.delete("/{draw_id}/participants/{participant_id}")
async def delete_participant(draw_id: str, participant_id: str, current_user=Depends(get_current_user)):
    """Katılımcıyı sil"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    if draw["status"] == "completed":
        raise HTTPException(status_code=400, detail="Tamamlanmış çekilişten katılımcı silinemez")
    
    result = await db.participants.delete_one({"id": participant_id, "draw_id": draw_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Katılımcı bulunamadı")
    
    await db.draws.update_one({"id": draw_id}, {"$inc": {"participant_count": -1}})
    
    return {"success": True, "deleted": result.deleted_count}


@router.post("/{draw_id}/execute")
async def execute_draw(draw_id: str, current_user=Depends(get_current_user)):
    """Çekilişi gerçekleştir"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    if draw["status"] == "completed":
        raise HTTPException(status_code=400, detail="Bu çekiliş zaten tamamlanmış")
    
    participants = await db.participants.find({"draw_id": draw_id}, {"_id": 0}).to_list(length=None)
    
    total_needed = draw["main_count"] + draw["backup_count"]
    if len(participants) < total_needed:
        raise HTTPException(status_code=400, detail=f"Yetersiz katılımcı! Gerekli: {total_needed}, Mevcut: {len(participants)}")
    
    random.shuffle(participants)
    winners = participants[:draw["main_count"]]
    backups = participants[draw["main_count"]:total_needed]
    
    for p in winners + backups:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    result_dict = {
        "draw_id": draw_id,
        "user_id": user_id,
        "winners": winners,
        "backups": backups,
        "draw_date": datetime.now(timezone.utc).isoformat()
    }
    
    await db.draw_results.insert_one(result_dict)
    await db.draws.update_one({"id": draw_id}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}})
    
    result_dict.pop('_id', None)
    result_dict['draw_date'] = datetime.fromisoformat(result_dict['draw_date'])
    return result_dict


@router.get("/{draw_id}/results")
async def get_results(draw_id: str, current_user=Depends(get_current_user)):
    """Çekiliş sonuçlarını getir"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    result = await db.draw_results.find_one({"draw_id": draw_id, "user_id": user_id}, {"_id": 0})
    
    if not result:
        raise HTTPException(status_code=404, detail="Sonuç bulunamadı")
    
    if isinstance(result.get('draw_date'), str):
        result['draw_date'] = datetime.fromisoformat(result['draw_date'])
    
    for p in result['winners'] + result['backups']:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    
    return result


@router.get("/{draw_id}/export")
async def export_results(draw_id: str, current_user=Depends(get_current_user)):
    """Çekiliş sonuçlarını Excel'e aktar"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    result = await db.draw_results.find_one({"draw_id": draw_id})
    if not result:
        raise HTTPException(status_code=404, detail="Çekiliş henüz yapılmamış")
    
    winners_data = []
    for i, winner in enumerate(result['winners'], 1):
        winners_data.append({
            'Sıra': i,
            'ID No': winner['id_no'],
            'Ad': winner['first_name'],
            'Soyad': winner['last_name'],
            'İletişim': winner['contact']
        })
    
    backups_data = []
    for i, backup in enumerate(result['backups'], 1):
        backups_data.append({
            'Sıra': i,
            'ID No': backup['id_no'],
            'Ad': backup['first_name'],
            'Soyad': backup['last_name'],
            'İletişim': backup['contact']
        })
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if winners_data:
            df_winners = pd.DataFrame(winners_data)
            df_winners.to_excel(writer, sheet_name='Asıl Talihliler', index=False)
        
        if backups_data:
            df_backups = pd.DataFrame(backups_data)
            df_backups.to_excel(writer, sheet_name='Yedek Talihliler', index=False)
        
        draw_date = result['draw_date']
        if isinstance(draw_date, str):
            draw_date = datetime.fromisoformat(draw_date)
        
        summary_data = {
            'Bilgi': ['Çekiliş Adı', 'Çekiliş Tarihi', 'Asıl Talihli Sayısı', 'Yedek Talihli Sayısı', 'Toplam Katılımcı'],
            'Değer': [
                draw['name'],
                draw_date.strftime('%Y-%m-%d %H:%M:%S'),
                draw['main_count'],
                draw['backup_count'],
                draw['participant_count']
            ]
        }
        df_summary = pd.DataFrame(summary_data)
        df_summary.to_excel(writer, sheet_name='Özet', index=False)
    
    output.seek(0)
    
    filename = f"cekilis_{draw['name'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/{draw_id}")
async def delete_draw(draw_id: str, current_user=Depends(get_current_user)):
    """Çekilişi sil"""
    user_id = current_user.get("username") or current_user.get("email", "").split("@")[0]
    draw = await db.draws.find_one({"id": draw_id, "user_id": user_id})
    if not draw:
        raise HTTPException(status_code=404, detail="Çekiliş bulunamadı")
    
    await db.participants.delete_many({"draw_id": draw_id})
    await db.draw_results.delete_many({"draw_id": draw_id})
    await db.draws.delete_one({"id": draw_id})
    
    return {"success": True, "message": "Çekiliş silindi"}
