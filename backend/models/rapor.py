from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Rapor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rapor_no: str
    proje_id: str
    proje_adi: str
    sehir: str
    sehir_kodu: str
    ekipman_adi: str
    kategori: str
    alt_kategori: Optional[str] = None
    firma: str
    lokasyon: Optional[str] = None
    marka_model: Optional[str] = None
    seri_no: Optional[str] = None
    periyot: Optional[str] = None  # 3/6/12 Aylık
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    uygunluk: Optional[str] = None  # Uygun/Uygun Değil
    durum: str = "Aktif"  # Aktif/Pasif
    created_by: str
    created_by_username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RaporCreate(BaseModel):
    proje_id: str
    sehir: str
    ekipman_adi: str
    kategori: str
    alt_kategori: Optional[str] = None
    firma: str
    lokasyon: Optional[str] = None
    marka_model: Optional[str] = None
    seri_no: Optional[str] = None
    periyot: Optional[str] = None
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    uygunluk: Optional[str] = None

class RaporUpdate(BaseModel):
    proje_id: Optional[str] = None
    sehir: Optional[str] = None
    ekipman_adi: Optional[str] = None
    kategori: Optional[str] = None
    alt_kategori: Optional[str] = None
    firma: Optional[str] = None
    lokasyon: Optional[str] = None
    marka_model: Optional[str] = None
    seri_no: Optional[str] = None
    periyot: Optional[str] = None
    gecerlilik_tarihi: Optional[str] = None
    aciklama: Optional[str] = None
    uygunluk: Optional[str] = None
