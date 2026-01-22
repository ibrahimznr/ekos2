from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Makine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_id: str  # İlişkili proje ID'si
    proje_adi: str  # Proje adı
    makine_turu: str  # Otomobil, Traktör, vb.
    firma: str  # Firma adı
    plaka_seri_no: str  # Plaka veya Seri numarası
    sasi_motor_no: Optional[str] = None  # Şasi/Motor No
    imalat_yili: Optional[str] = None  # İmalat Yılı
    servis_bakim_tarihi: Optional[str] = None  # Servis Bakım Tarihi
    sigorta_tarihi: Optional[str] = None  # Sigorta Tarihi
    periyodik_kontrol_tarihi: Optional[str] = None  # Periyodik Kontrol Tarihi
    ruhsat_muayene_tarihi: Optional[str] = None  # Ruhsat Muayene Tarihi
    operator_adi: Optional[str] = None  # Operatör Adı
    operator_belge_tarihi: Optional[str] = None  # Operatör Belge Tarihi
    belge_kurumu: Optional[str] = None  # Belge Kurumu
    telefon: Optional[str] = None  # Telefon
    durum: str = "Aktif"  # Aktif/Pasif
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class MakineCreate(BaseModel):
    proje_id: str
    proje_adi: str
    makine_turu: str
    firma: str
    plaka_seri_no: str
    sasi_motor_no: Optional[str] = None
    imalat_yili: Optional[str] = None
    servis_bakim_tarihi: Optional[str] = None
    sigorta_tarihi: Optional[str] = None
    periyodik_kontrol_tarihi: Optional[str] = None
    ruhsat_muayene_tarihi: Optional[str] = None
    operator_adi: Optional[str] = None
    operator_belge_tarihi: Optional[str] = None
    belge_kurumu: Optional[str] = None
    telefon: Optional[str] = None
    durum: str = "Aktif"
    aciklama: Optional[str] = None

class MakineUpdate(BaseModel):
    proje_id: Optional[str] = None
    proje_adi: Optional[str] = None
    makine_turu: Optional[str] = None
    firma: Optional[str] = None
    plaka_seri_no: Optional[str] = None
    sasi_motor_no: Optional[str] = None
    imalat_yili: Optional[str] = None
    servis_bakim_tarihi: Optional[str] = None
    sigorta_tarihi: Optional[str] = None
    periyodik_kontrol_tarihi: Optional[str] = None
    ruhsat_muayene_tarihi: Optional[str] = None
    operator_adi: Optional[str] = None
    operator_belge_tarihi: Optional[str] = None
    belge_kurumu: Optional[str] = None
    telefon: Optional[str] = None
    durum: Optional[str] = None
    aciklama: Optional[str] = None
