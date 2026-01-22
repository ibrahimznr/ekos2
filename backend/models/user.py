from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime, timezone, date
import uuid

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password: str
    role: str = "viewer"  # admin, inspector, viewer
    firma_adi: Optional[str] = None  # Firma-based access control
    email_verified: bool = False
    verification_code: Optional[str] = None
    # New profile fields
    ad: Optional[str] = None
    soyad: Optional[str] = None
    sehir: Optional[str] = None
    dogum_tarihi: Optional[str] = None  # ISO date string YYYY-MM-DD
    profil_resmi: Optional[str] = None  # URL or path to profile image
    telefon: Optional[str] = None  # Phone number
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirm: str
    firma_adi: str  # Required for registration
    role: str = "viewer"
    # New profile fields (optional during registration)
    ad: Optional[str] = None
    soyad: Optional[str] = None
    sehir: Optional[str] = None
    dogum_tarihi: Optional[str] = None  # ISO date string YYYY-MM-DD
    profil_resmi: Optional[str] = None
    telefon: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    firma_adi: Optional[str] = None
    email_verified: bool
    # New profile fields
    ad: Optional[str] = None
    soyad: Optional[str] = None
    sehir: Optional[str] = None
    dogum_tarihi: Optional[str] = None
    profil_resmi: Optional[str] = None
    telefon: Optional[str] = None
    created_at: datetime

class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
