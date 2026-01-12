from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4

class KalibrasyonCihazi(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    cihaz_adi: str
    seri_no: str
    kalibrasyon_tarihi: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    created_by_username: Optional[str] = None

class KalibrasyonCihaziCreate(BaseModel):
    cihaz_adi: str
    seri_no: str
    kalibrasyon_tarihi: str
