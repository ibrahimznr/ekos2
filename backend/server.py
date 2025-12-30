"""
EKOS - Ekipman Kontrol Otomasyon Sistemi
Backend Server - Refactored Version

Bu dosya sadece:
- FastAPI uygulaması kurulumu
- CORS middleware
- Startup events (DB indexes, default data)
- Router registrations

içerir. Tüm endpoint'ler /routers/ klasöründeki modüllere taşınmıştır.
"""

from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from datetime import datetime, timezone

from database import db
from constants import KATEGORI_ALT_KATEGORI
from models import User, Kategori, Proje
from routers.auth import get_password_hash

# Routers
from routers import (
    auth_router,
    kategoriler_router,
    raporlar_router,
    files_router,
    excel_router,
    dashboard_router,
    users_router,
    projeler_router,
    iskele_router,
    static_router
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(
    title="EKOS - Ekipman Kontrol Otomasyon Sistemi",
    description="Ekipman kontrol ve rapor yönetim sistemi API'si",
    version="2.0.0"
)

# API Router with /api prefix
api_router = APIRouter(prefix="/api")

# Register all routers
api_router.include_router(auth_router)
api_router.include_router(kategoriler_router)
api_router.include_router(raporlar_router)
api_router.include_router(files_router)
api_router.include_router(excel_router)
api_router.include_router(dashboard_router)
api_router.include_router(users_router)
api_router.include_router(projeler_router)
api_router.include_router(iskele_router)
api_router.include_router(static_router)

# Include the main API router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db():
    """Initialize database indexes and default data on startup"""
    
    # Create indexes for better performance
    try:
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username")
        
        # Raporlar collection indexes
        await db.raporlar.create_index("rapor_no", unique=True)
        await db.raporlar.create_index("kategori")
        await db.raporlar.create_index("created_at")
        await db.raporlar.create_index("gecerlilik_tarihi")
        await db.raporlar.create_index("uygunluk")
        await db.raporlar.create_index([("created_at", -1)])  # Descending for latest first
        
        # Kategoriler collection indexes
        await db.kategoriler.create_index("isim", unique=True)
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Index creation error (may already exist): {e}")
    
    # Create default admin if not exists
    admin_exists = await db.users.find_one({"email": "admin@ekipman.com"})
    if not admin_exists:
        admin = User(
            username="admin",
            email="admin@ekipman.com",
            password=get_password_hash("admin123"),
            role="admin",
            email_verified=True
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        logger.info("Default admin created")
    
    # Create default categories with subcategories
    for cat_name, alt_kats in KATEGORI_ALT_KATEGORI.items():
        exists = await db.kategoriler.find_one({"isim": cat_name})
        if not exists:
            kategori = Kategori(
                isim=cat_name,
                alt_kategoriler=alt_kats,
                aciklama=f"{cat_name} ekipmanları"
            )
            doc = kategori.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.kategoriler.insert_one(doc)
    
    # Create default project
    default_proje_exists = await db.projeler.find_one({"proje_adi": "Çukurova Deprem Konutları Projesi"})
    if not default_proje_exists:
        default_proje = Proje(
            proje_adi="Çukurova Deprem Konutları Projesi",
            aciklama="Varsayılan proje"
        )
        doc = default_proje.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.projeler.insert_one(doc)
        logger.info("Default project created")
        
        # Assign all existing reports to this project
        default_proje_id = doc["id"]
        await db.raporlar.update_many(
            {"proje_id": {"$exists": False}},
            {"$set": {
                "proje_id": default_proje_id,
                "proje_adi": "Çukurova Deprem Konutları Projesi",
                "sehir": "Adana",
                "sehir_kodu": "ADA"
            }}
        )
        logger.info("Existing reports assigned to default project")


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
