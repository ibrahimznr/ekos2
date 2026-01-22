"""
Ayarlar (Settings) Router - Kullanıcı sözleşmesi ve diğer ayarlar
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import db
from routers.auth import get_current_user

router = APIRouter(prefix="/api/ayarlar", tags=["Ayarlar"])

class UserAgreementUpdate(BaseModel):
    content: str

class UserAgreement(BaseModel):
    content: str
    updated_at: Optional[str] = None

DEFAULT_AGREEMENT = """# EKOS Kullanıcı Sözleşmesi

## 1. Genel Hükümler

Bu sözleşme, EKOS (Ekipman Kontrol Otomasyon Sistemi) platformunu kullanan tüm kullanıcılar için geçerlidir.

## 2. Kullanım Şartları

- Kullanıcı, sisteme doğru ve güncel bilgiler sağlamakla yükümlüdür.
- Kullanıcı hesabı kişiseldir ve başkalarıyla paylaşılamaz.
- Sistem üzerindeki tüm veriler gizlidir ve yetkisiz erişime karşı korunmalıdır.

## 3. Sorumluluklar

- Kullanıcı, hesap bilgilerinin güvenliğinden sorumludur.
- Yanlış veya yanıltıcı rapor oluşturmak yasaktır.
- Sistem kaynaklarının kötüye kullanımı yasaktır.

## 4. Gizlilik

- Kişisel verileriniz KVKK kapsamında korunmaktadır.
- Verileriniz üçüncü taraflarla paylaşılmaz.
- Çerezler ve oturum verileri güvenlik amacıyla kullanılır.

## 5. Değişiklikler

Bu sözleşme önceden haber vermeksizin güncellenebilir. Güncel sözleşme her zaman sistem üzerinden erişilebilir olacaktır.

---

*Bu sözleşmeyi kabul ederek yukarıdaki şartları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.*
"""

@router.get("/kullanici-sozlesmesi")
async def get_user_agreement():
    """Kullanıcı sözleşmesini getir - herkes erişebilir"""
    settings = await db.ayarlar.find_one({"key": "user_agreement"})
    if settings:
        return {"content": settings.get("content", DEFAULT_AGREEMENT)}
    return {"content": DEFAULT_AGREEMENT}

@router.put("/kullanici-sozlesmesi")
async def update_user_agreement(
    agreement: UserAgreementUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Kullanıcı sözleşmesini güncelle - sadece admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    from datetime import datetime, timezone
    
    await db.ayarlar.update_one(
        {"key": "user_agreement"},
        {"$set": {
            "key": "user_agreement",
            "content": agreement.content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": current_user.get("id")
        }},
        upsert=True
    )
    
    return {"message": "Kullanıcı sözleşmesi güncellendi", "content": agreement.content}
