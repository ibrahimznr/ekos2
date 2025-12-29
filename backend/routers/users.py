from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from models import UserResponse
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for user in users:
        result.append(UserResponse(
            id=user["id"],
            username=user.get("username", user["email"].split("@")[0]),
            email=user["email"],
            role=user["role"],
            email_verified=user.get("email_verified", False),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        ))
    
    return result

@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return {"message": "Kullanıcı silindi"}

@router.post("/bulk-delete")
async def bulk_delete_users(user_ids: List[str], current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    user_ids = [uid for uid in user_ids if uid != current_user["id"]]
    
    if not user_ids:
        raise HTTPException(status_code=400, detail="Silinecek kullanıcı bulunamadı veya kendi hesabınızı silemezsiniz")
    
    result = await db.users.delete_many({"id": {"$in": user_ids}})
    return {"message": f"{result.deleted_count} kullanıcı silindi", "deleted_count": result.deleted_count}
