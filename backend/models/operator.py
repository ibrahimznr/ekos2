from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Operator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_id: str  # İlişkili proje ID'si
    proje_adi: str  # Proje adı
    ad_soyad: str  # Operatör adı soyadı
    telefon: str  # Telefon numarası
    makine_cinsi: Optional[str] = None  # Kullanacağı makine cinsi
    belge_no: str  # Belge numarası
    belge_turu: Optional[str] = None  # Belge türü (Ekipler, vb.)
    son_gecerlilik: str  # Son geçerlilik tarihi
    durum: str = "Geçerli"  # Geçerli/Süresi Dolmuş
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class OperatorCreate(BaseModel):
    proje_id: str
    proje_adi: str
    ad_soyad: str
    telefon: str
    makine_cinsi: Optional[str] = None
    belge_no: str
    belge_turu: Optional[str] = None
    son_gecerlilik: str
    durum: str = "Geçerli"
    aciklama: Optional[str] = None

class OperatorUpdate(BaseModel):
    proje_id: Optional[str] = None
    proje_adi: Optional[str] = None
    ad_soyad: Optional[str] = None
    telefon: Optional[str] = None
    makine_cinsi: Optional[str] = None
    belge_no: Optional[str] = None
    belge_turu: Optional[str] = None
    son_gecerlilik: Optional[str] = None
    durum: Optional[str] = None
    aciklama: Optional[str] = None
