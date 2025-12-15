from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Proje(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_adi: str
    proje_kodu: Optional[str] = None
    lokasyon: Optional[str] = None
    baslangic_tarihi: Optional[str] = None
    bitis_tarihi: Optional[str] = None
    durum: str = "Aktif"
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjeCreate(BaseModel):
    proje_adi: str
    proje_kodu: str
    lokasyon: Optional[str] = None
    baslangic_tarihi: Optional[str] = None
    bitis_tarihi: Optional[str] = None
    durum: str = "Aktif"
    aciklama: Optional[str] = None
