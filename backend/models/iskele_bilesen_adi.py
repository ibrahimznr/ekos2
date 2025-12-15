from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class IskeleBilesenAdi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bilesen_adi: str
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IskeleBilesenAdiCreate(BaseModel):
    bilesen_adi: str
    aciklama: Optional[str] = None
