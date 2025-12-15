from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class IskeleBileseni(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_id: str
    proje_adi: str
    bileşen_adi: str
    malzeme_kodu: str  # Seri no'ya karşılık geliyor
    bileşen_adedi: int
    firma_adi: str
    iskele_periyodu: str = "6 Aylık"  # Sabit değer
    gecerlilik_tarihi: Optional[str] = None
    uygunluk: str = "Uygun"  # Uygun/Uygun Değil
    aciklama: Optional[str] = None
    gorseller: List[str] = Field(default_factory=list)  # Max 3 görsel URL
    created_by: str
    created_by_username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IskeleBileseniCreate(BaseModel):
    proje_id: str
    bileşen_adi: str
    malzeme_kodu: str
    bileşen_adedi: int
    firma_adi: str
    gecerlilik_tarihi: Optional[str] = None
    uygunluk: str = "Uygun"
    aciklama: Optional[str] = None
    gorseller: List[str] = Field(default_factory=list)
