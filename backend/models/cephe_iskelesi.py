from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class CepheIskelesi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_id: str  # İlişkili proje ID'si
    proje_adi: str  # Proje adı
    proje_muhendisi: Optional[str] = None  # Proje Mühendisi
    statik_raporu: bool = False  # Statik raporu var mı?
    kurulum_projesi: bool = False  # Kurulum projesi var mı?
    lokasyon: Optional[str] = None  # Lokasyon
    blok_yapi_adi: Optional[str] = None  # Blok veya Yapı Adı
    yapi_yonu: Optional[str] = None  # Yapı Yönü (Doğu, Batı, Kuzey, Güney)
    gecerlilik_tarihi: Optional[str] = None  # Geçerlilik Tarihi
    aciklama: Optional[str] = None  # Açıklama
    durum: str = "Aktif"  # Aktif/Pasif
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CepheIskelesiCreate(BaseModel):
    proje_id: str
    proje_adi: str
    proje_muhendisi: Optional[str] = None
    statik_raporu: bool = False
    kurulum_projesi: bool = False
    lokasyon: Optional[str] = None
    blok_yapi_adi: Optional[str] = None
    yapi_yonu: Optional[str] = None
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    durum: str = "Aktif"

class CepheIskelesiUpdate(BaseModel):
    proje_id: Optional[str] = None
    proje_adi: Optional[str] = None
    proje_muhendisi: Optional[str] = None
    statik_raporu: Optional[bool] = None
    kurulum_projesi: Optional[bool] = None
    lokasyon: Optional[str] = None
    blok_yapi_adi: Optional[str] = None
    yapi_yonu: Optional[str] = None
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    durum: Optional[str] = None
