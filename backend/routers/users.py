from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models import UserResponse, User
from routers.auth import get_current_user, get_password_hash
from database import db

router = APIRouter(prefix="/users", tags=["Users"])

# Admin User Create/Update Models
class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirm: str
    role: str = "viewer"

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    password_confirm: Optional[str] = None
    role: Optional[str] = None

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

@router.post("", response_model=UserResponse)
async def admin_create_user(user_data: AdminUserCreate, current_user: dict = Depends(get_current_user)):
    """Admin tarafından kullanıcı oluşturma"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    if user_data.password != user_data.password_confirm:
        raise HTTPException(status_code=400, detail="Şifreler eşleşmiyor")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")
    
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=get_password_hash(user_data.password),
        role=user_data.role,
        email_verified=True  # Admin oluşturduğu için doğrulanmış sayılır
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        email_verified=user.email_verified,
        created_at=user.created_at
    )

@router.put("/{user_id}", response_model=UserResponse)
async def admin_update_user(user_id: str, user_data: AdminUserUpdate, current_user: dict = Depends(get_current_user)):
    """Admin tarafından kullanıcı güncelleme"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    update_data = {}
    
    if user_data.username and user_data.username != existing_user.get("username"):
        existing_username = await db.users.find_one({"username": user_data.username, "id": {"$ne": user_id}})
        if existing_username:
            raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
        update_data["username"] = user_data.username
    
    if user_data.email and user_data.email != existing_user.get("email"):
        existing_email = await db.users.find_one({"email": user_data.email, "id": {"$ne": user_id}})
        if existing_email:
            raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
        update_data["email"] = user_data.email
    
    if user_data.role:
        update_data["role"] = user_data.role
    
    if user_data.password:
        if user_data.password != user_data.password_confirm:
            raise HTTPException(status_code=400, detail="Şifreler eşleşmiyor")
        if len(user_data.password) < 6:
            raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")
        update_data["password"] = get_password_hash(user_data.password)
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    return UserResponse(
        id=updated_user["id"],
        username=updated_user.get("username", updated_user["email"].split("@")[0]),
        email=updated_user["email"],
        role=updated_user["role"],
        email_verified=updated_user.get("email_verified", False),
        created_at=datetime.fromisoformat(updated_user["created_at"]) if isinstance(updated_user["created_at"], str) else updated_user["created_at"]
    )

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
