from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone

from models import Notification, NotificationType, FeedbackCreate, AdminMessageCreate
from routers.auth import get_current_user
from database import db

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    """Kullanıcının bildirimlerini getir"""
    notifications = await db.notifications.find(
        {"recipient_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime strings
    for n in notifications:
        if isinstance(n.get('created_at'), str):
            n['created_at'] = datetime.fromisoformat(n['created_at'].replace('Z', '+00:00'))
    
    return notifications


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Okunmamış bildirim sayısını getir"""
    count = await db.notifications.count_documents({
        "recipient_id": current_user["id"],
        "is_read": False
    })
    return {"count": count}


@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Bildirimi okundu olarak işaretle"""
    result = await db.notifications.update_one(
        {"id": notification_id, "recipient_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    
    return {"message": "Bildirim okundu olarak işaretlendi"}


@router.put("/mark-all-read")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Tüm bildirimleri okundu olarak işaretle"""
    result = await db.notifications.update_many(
        {"recipient_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": f"{result.modified_count} bildirim okundu olarak işaretlendi"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Bildirimi sil"""
    result = await db.notifications.delete_one({
        "id": notification_id,
        "recipient_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    
    return {"message": "Bildirim silindi"}


@router.post("/feedback")
async def send_feedback(feedback: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    """Kullanıcıdan Admin'e geri bildirim gönder"""
    if not feedback.message.strip():
        raise HTTPException(status_code=400, detail="Mesaj boş olamaz")
    
    # Tüm admin kullanıcılarını bul
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).to_list(100)
    
    if not admins:
        raise HTTPException(status_code=404, detail="Sistemde admin bulunamadı")
    
    # Her admin için bildirim oluştur
    notifications = []
    for admin in admins:
        notification = Notification(
            type=NotificationType.FEEDBACK,
            title="Yeni Geri Bildirim",
            message=feedback.message,
            sender_id=current_user["id"],
            sender_username=current_user.get("username") or current_user.get("email", "").split("@")[0],
            recipient_id=admin["id"]
        )
        doc = notification.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        notifications.append(doc)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {"message": "Geri bildiriminiz iletildi"}


@router.post("/admin-message")
async def send_admin_message(message_data: AdminMessageCreate, current_user: dict = Depends(get_current_user)):
    """Admin'den kullanıcılara mesaj gönder"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    if not message_data.message.strip():
        raise HTTPException(status_code=400, detail="Mesaj boş olamaz")
    
    if not message_data.recipient_ids:
        raise HTTPException(status_code=400, detail="En az bir alıcı seçmelisiniz")
    
    # Her alıcı için bildirim oluştur
    notifications = []
    for recipient_id in message_data.recipient_ids:
        notification = Notification(
            type=NotificationType.MESSAGE,
            title=message_data.title or "Yönetimden Mesaj",
            message=message_data.message,
            sender_id=current_user["id"],
            sender_username=current_user.get("username") or "Yönetim",
            recipient_id=recipient_id
        )
        doc = notification.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        notifications.append(doc)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {"message": f"{len(notifications)} kullanıcıya mesaj gönderildi"}


@router.get("/users-for-message")
async def get_users_for_message(current_user: dict = Depends(get_current_user)):
    """Mesaj gönderilebilecek kullanıcıları listele (Admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    users = await db.users.find(
        {},
        {"_id": 0, "id": 1, "username": 1, "email": 1, "role": 1}
    ).to_list(1000)
    
    return users


# Helper function to send notification on new user registration
async def notify_admins_new_user(new_user_username: str, new_user_email: str):
    """Yeni kullanıcı kaydında adminlere bildirim gönder"""
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "id": 1}).to_list(100)
    
    notifications = []
    for admin in admins:
        notification = Notification(
            type=NotificationType.NEW_USER,
            title="Yeni Kullanıcı Kaydı",
            message=f"'{new_user_username}' ({new_user_email}) sisteme kayıt oldu.",
            sender_id=None,
            sender_username="Sistem",
            recipient_id=admin["id"]
        )
        doc = notification.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        notifications.append(doc)
    
    if notifications:
        await db.notifications.insert_many(notifications)
