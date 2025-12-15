from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid

class Kategori(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    isim: str
    alt_kategoriler: List[str] = []
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KategoriCreate(BaseModel):
    isim: str
    alt_kategoriler: List[str] = []
    aciklama: Optional[str] = None
