from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from models.operator import Operator, OperatorCreate, OperatorUpdate
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/operatorler", tags=["Operatorler"])

@router.get("", response_model=List[Operator])
async def get_operatorler(current_user: dict = Depends(get_current_user)):
    """Tüm operatörleri listele"""
    operatorler = await db.operatorler.find({}, {"_id": 0}).to_list(1000)
    for operator in operatorler:
        if isinstance(operator.get('created_at'), str):
            operator['created_at'] = datetime.fromisoformat(operator['created_at'])
        if isinstance(operator.get('updated_at'), str):
            operator['updated_at'] = datetime.fromisoformat(operator['updated_at'])
    return operatorler

@router.get("/{operator_id}", response_model=Operator)
async def get_operator(operator_id: str, current_user: dict = Depends(get_current_user)):
    """Tek bir operatörü ID ile getir"""
    operator = await db.operatorler.find_one({"id": operator_id}, {"_id": 0})
    if not operator:
        raise HTTPException(status_code=404, detail="Operatör bulunamadı")
    if isinstance(operator.get('created_at'), str):
        operator['created_at'] = datetime.fromisoformat(operator['created_at'])
    if isinstance(operator.get('updated_at'), str):
        operator['updated_at'] = datetime.fromisoformat(operator['updated_at'])
    return operator

@router.post("", response_model=Operator)
async def create_operator(operator_create: OperatorCreate, current_user: dict = Depends(get_current_user)):
    """Yeni operatör ekle"""
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    # Aynı belge numarası var mı kontrol et
    existing = await db.operatorler.find_one({"belge_no": operator_create.belge_no})
    if existing:
        raise HTTPException(status_code=400, detail="Bu belge numarası zaten kayıtlı")
    
    operator = Operator(**operator_create.model_dump())
    doc = operator.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('updated_at'):
        doc['updated_at'] = doc['updated_at'].isoformat()
    await db.operatorler.insert_one(doc)
    return operator

@router.put("/{operator_id}", response_model=Operator)
async def update_operator(operator_id: str, operator_update: OperatorUpdate, current_user: dict = Depends(get_current_user)):
    """Operatör güncelle"""
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.operatorler.find_one({"id": operator_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Operatör bulunamadı")
    
    # Belge numarası değişiyorsa, başka operatör kullanıyor mu kontrol et
    if operator_update.belge_no and operator_update.belge_no != existing.get('belge_no'):
        duplicate = await db.operatorler.find_one({"belge_no": operator_update.belge_no})
        if duplicate:
            raise HTTPException(status_code=400, detail="Bu belge numarası zaten kayıtlı")
    
    update_data = operator_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.operatorler.update_one({"id": operator_id}, {"$set": update_data})
    
    updated_operator = await db.operatorler.find_one({"id": operator_id}, {"_id": 0})
    if isinstance(updated_operator.get('created_at'), str):
        updated_operator['created_at'] = datetime.fromisoformat(updated_operator['created_at'])
    if isinstance(updated_operator.get('updated_at'), str):
        updated_operator['updated_at'] = datetime.fromisoformat(updated_operator['updated_at'])
    return updated_operator

@router.delete("/{operator_id}")
async def delete_operator(operator_id: str, current_user: dict = Depends(get_current_user)):
    """Operatör sil"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.operatorler.delete_one({"id": operator_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Operatör bulunamadı")
    return {"message": "Operatör silindi"}

@router.post("/bulk-delete")
async def bulk_delete_operatorler(operator_ids: List[str], current_user: dict = Depends(get_current_user)):
    """Toplu operatör sil"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.operatorler.delete_many({"id": {"$in": operator_ids}})
    return {"message": f"{result.deleted_count} operatör silindi", "deleted_count": result.deleted_count}
