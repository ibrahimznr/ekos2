from fastapi import APIRouter

from constants import SEHIRLER, KATEGORI_ALT_KATEGORI

router = APIRouter(tags=["Static Data"])

@router.get("/sehirler")
async def get_sehirler():
    """Tüm şehirlerin listesini döndürür"""
    return SEHIRLER

@router.get("/kategori-alt-kategoriler")
async def get_kategori_alt_kategoriler():
    """Kategori ve alt kategori eşleşmesini döndürür"""
    return KATEGORI_ALT_KATEGORI
