from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid

class NotificationType(str, Enum):
    NEW_USER = "new_user"  # Yeni kullanıcı kaydı
    FEEDBACK = "feedback"  # Kullanıcıdan admin'e geri bildirim
    MESSAGE = "message"    # Admin'den kullanıcıya mesaj
    SYSTEM = "system"      # Sistem bildirimi

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: NotificationType
    title: str
    message: str
    sender_id: Optional[str] = None
    sender_username: Optional[str] = None
    recipient_id: str  # Alıcı kullanıcı ID'si
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    recipient_ids: List[str]  # Çoklu alıcı desteği

class FeedbackCreate(BaseModel):
    message: str

class AdminMessageCreate(BaseModel):
    recipient_ids: List[str]
    title: str
    message: str
