from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
import base64
from constants import SEHIRLER, KATEGORI_ALT_KATEGORI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT & Password
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="EKOS - Ekipman Kontrol Otomasyon Sistemi")
api_router = APIRouter(prefix="/api")

# Upload directory
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password: str
    role: str = "viewer"  # admin, inspector, viewer
    email_verified: bool = False
    verification_code: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirm: str
    role: str = "viewer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    email_verified: bool
    created_at: datetime

class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

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

class Proje(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proje_adi: str
    aciklama: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjeCreate(BaseModel):
    proje_adi: str
    aciklama: Optional[str] = None

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

class MedyaDosyasi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rapor_id: str
    dosya_adi: str
    dosya_yolu: str
    dosya_tipi: str
    dosya_boyutu: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Geçersiz kimlik")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    
    # Fallback for old users without username
    if "username" not in user:
        user["username"] = user["email"].split("@")[0]
    
    return user

def get_sehir_kodu(sehir_ismi: str) -> str:
    """Get city code from city name"""
    for sehir in SEHIRLER:
        if sehir['isim'] == sehir_ismi:
            return sehir['kod']
    return "XXX"  # Default if not found

async def generate_rapor_no(sehir: str):
    """
    Generate report number in format: PKYYYY-SEHIRKODU###
    Example: PK2025-ANK025 (for Ankara)
    """
    now = datetime.now(timezone.utc)
    year = now.strftime("%Y")
    
    # Get city code from city name
    sehir_kodu = get_sehir_kodu(sehir)
    prefix = f"PK{year}-{sehir_kodu}"
    
    # Get the last report for this city and year
    last_report = await db.raporlar.find_one(
        {"rapor_no": {"$regex": f"^{prefix}"}},
        sort=[("created_at", -1)]
    )
    
    if last_report:
        last_no_str = last_report["rapor_no"].split(sehir_kodu)[-1]
        last_no = int(last_no_str)
        new_no = last_no + 1
    else:
        new_no = 1
    
    return f"{prefix}{str(new_no).zfill(3)}"

# Initialize default admin
@app.on_event("startup")
async def startup_db():
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

# Auth Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_create: UserCreate):
    # Validate passwords match
    if user_create.password != user_create.password_confirm:
        raise HTTPException(status_code=400, detail="Şifreler eşleşmiyor")
    
    # Check password length
    if len(user_create.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")
    
    # Check if email exists
    existing_email = await db.users.find_one({"email": user_create.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": user_create.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
    
    # Generate verification code
    import random
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    user = User(
        username=user_create.username,
        email=user_create.email,
        password=get_password_hash(user_create.password),
        role=user_create.role,
        email_verified=False,
        verification_code=verification_code
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # In production, send email here
    # For now, just log the code
    logger.info(f"Verification code for {user.email}: {verification_code}")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        email_verified=user.email_verified,
        created_at=user.created_at
    )

@api_router.post("/auth/verify-email")
async def verify_email(verify_data: VerifyEmail):
    user = await db.users.find_one({"email": verify_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email zaten doğrulanmış")
    
    if user.get("verification_code") != verify_data.code:
        raise HTTPException(status_code=400, detail="Doğrulama kodu hatalı")
    
    await db.users.update_one(
        {"email": verify_data.email},
        {"$set": {"email_verified": True, "verification_code": None}}
    )
    
    return {"message": "Email başarıyla doğrulandı"}

@api_router.post("/auth/resend-code")
async def resend_verification_code(email: EmailStr):
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email zaten doğrulanmış")
    
    # Generate new code
    import random
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"verification_code": verification_code}}
    )
    
    logger.info(f"New verification code for {email}: {verification_code}")
    
    return {"message": "Doğrulama kodu yeniden gönderildi"}

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    if not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            role=user["role"],
            email_verified=user.get("email_verified", False),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        email_verified=current_user.get("email_verified", False),
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )

# Kategori Routes
@api_router.get("/kategoriler", response_model=List[Kategori])
async def get_kategoriler(current_user: dict = Depends(get_current_user)):
    kategoriler = await db.kategoriler.find({}, {"_id": 0}).to_list(1000)
    for kat in kategoriler:
        if isinstance(kat['created_at'], str):
            kat['created_at'] = datetime.fromisoformat(kat['created_at'])
    return kategoriler

@api_router.post("/kategoriler", response_model=Kategori)
async def create_kategori(kategori_create: KategoriCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    kategori = Kategori(**kategori_create.model_dump())
    doc = kategori.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.kategoriler.insert_one(doc)
    return kategori

@api_router.delete("/kategoriler/{kategori_id}")
async def delete_kategori(kategori_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.kategoriler.delete_one({"id": kategori_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    return {"message": "Kategori silindi"}

# Rapor Routes
@api_router.get("/raporlar", response_model=List[Rapor])
async def get_raporlar(
    arama: Optional[str] = None,
    kategori: Optional[str] = None,
    periyot: Optional[str] = None,
    uygunluk: Optional[str] = None,
    limit: int = 500,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if arama:
        query["$or"] = [
            {"rapor_no": {"$regex": arama, "$options": "i"}},
            {"ekipman_adi": {"$regex": arama, "$options": "i"}},
            {"firma": {"$regex": arama, "$options": "i"}}
        ]
    
    if kategori:
        query["kategori"] = kategori
    
    if periyot:
        query["periyot"] = periyot
    
    if uygunluk:
        query["uygunluk"] = uygunluk
    
    # Limit to 500 records by default for better performance
    raporlar = await db.raporlar.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for rapor in raporlar:
        if isinstance(rapor['created_at'], str):
            rapor['created_at'] = datetime.fromisoformat(rapor['created_at'])
        if isinstance(rapor['updated_at'], str):
            rapor['updated_at'] = datetime.fromisoformat(rapor['updated_at'])
        # Fallback for old reports without username
        if 'created_by_username' not in rapor or not rapor['created_by_username']:
            rapor['created_by_username'] = 'Bilinmiyor'
    
    return raporlar

@api_router.get("/raporlar/{rapor_id}", response_model=Rapor)
async def get_rapor(rapor_id: str, current_user: dict = Depends(get_current_user)):
    rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    if isinstance(rapor['created_at'], str):
        rapor['created_at'] = datetime.fromisoformat(rapor['created_at'])
    if isinstance(rapor['updated_at'], str):
        rapor['updated_at'] = datetime.fromisoformat(rapor['updated_at'])
    # Fallback for old reports
    if 'created_by_username' not in rapor or not rapor['created_by_username']:
        rapor['created_by_username'] = 'Bilinmiyor'
    
    return rapor

@api_router.post("/raporlar", response_model=Rapor)
async def create_rapor(rapor_create: RaporCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor oluşturma yetkiniz yok")
    
    # Get proje
    proje = await db.projeler.find_one({"id": rapor_create.proje_id}, {"_id": 0})
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    
    # Get sehir kodu
    sehir_obj = next((s for s in SEHIRLER if s["isim"] == rapor_create.sehir), None)
    if not sehir_obj:
        raise HTTPException(status_code=400, detail="Geçersiz şehir")
    
    rapor_no = await generate_rapor_no(sehir_obj["kod"])
    
    rapor = Rapor(
        rapor_no=rapor_no,
        proje_id=proje["id"],
        proje_adi=proje["proje_adi"],
        sehir=rapor_create.sehir,
        sehir_kodu=sehir_obj["kod"],
        created_by=current_user["id"],
        created_by_username=current_user["username"],
        ekipman_adi=rapor_create.ekipman_adi,
        kategori=rapor_create.kategori,
        alt_kategori=rapor_create.alt_kategori,
        firma=rapor_create.firma,
        lokasyon=rapor_create.lokasyon,
        marka_model=rapor_create.marka_model,
        seri_no=rapor_create.seri_no,
        periyot=rapor_create.periyot,
        gecerlilik_tarihi=rapor_create.gecerlilik_tarihi,
        aciklama=rapor_create.aciklama,
        uygunluk=rapor_create.uygunluk
    )
    
    doc = rapor.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.raporlar.insert_one(doc)
    
    return rapor

@api_router.put("/raporlar/{rapor_id}", response_model=Rapor)
async def update_rapor(
    rapor_id: str,
    rapor_update: RaporUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor düzenleme yetkiniz yok")
    
    rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    update_data = {k: v for k, v in rapor_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.raporlar.update_one({"id": rapor_id}, {"$set": update_data})
    
    updated_rapor = await db.raporlar.find_one({"id": rapor_id}, {"_id": 0})
    if isinstance(updated_rapor['created_at'], str):
        updated_rapor['created_at'] = datetime.fromisoformat(updated_rapor['created_at'])
    if isinstance(updated_rapor['updated_at'], str):
        updated_rapor['updated_at'] = datetime.fromisoformat(updated_rapor['updated_at'])
    
    return updated_rapor

@api_router.delete("/raporlar/{rapor_id}")
async def delete_rapor(rapor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Rapor silme yetkiniz yok")
    
    # Delete associated files
    dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
    for dosya in dosyalar:
        dosya_path = Path(dosya["dosya_yolu"])
        if dosya_path.exists():
            dosya_path.unlink()
    
    await db.medya_dosyalari.delete_many({"rapor_id": rapor_id})
    
    result = await db.raporlar.delete_one({"id": rapor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    return {"message": "Rapor silindi"}

# File Upload Routes
@api_router.post("/upload/{rapor_id}")
async def upload_file(
    rapor_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Dosya yükleme yetkiniz yok")
    
    # Check file size (4GB)
    content = await file.read()
    if len(content) > 4 * 1024 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 4GB'dan büyük olamaz")
    
    # Check file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Sadece JPG, PNG ve PDF formatları desteklenir")
    
    # Check if report exists
    rapor = await db.raporlar.find_one({"id": rapor_id})
    if not rapor:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    # Save file
    file_ext = file.filename.split(".")[-1]
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Save to database
    medya = MedyaDosyasi(
        rapor_id=rapor_id,
        dosya_adi=file.filename,
        dosya_yolu=str(file_path),
        dosya_tipi=file.content_type,
        dosya_boyutu=len(content)
    )
    
    doc = medya.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.medya_dosyalari.insert_one(doc)
    
    return {"message": "Dosya yüklendi", "file_id": medya.id}

@api_router.get("/dosyalar/{rapor_id}")
async def get_dosyalar(rapor_id: str, current_user: dict = Depends(get_current_user)):
    dosyalar = await db.medya_dosyalari.find({"rapor_id": rapor_id}, {"_id": 0}).to_list(100)
    for dosya in dosyalar:
        if isinstance(dosya['created_at'], str):
            dosya['created_at'] = datetime.fromisoformat(dosya['created_at'])
    return dosyalar

@api_router.delete("/dosyalar/{dosya_id}")
async def delete_dosya(dosya_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Dosya silme yetkiniz yok")
    
    dosya = await db.medya_dosyalari.find_one({"id": dosya_id}, {"_id": 0})
    if not dosya:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    
    dosya_path = Path(dosya["dosya_yolu"])
    if dosya_path.exists():
        dosya_path.unlink()
    
    await db.medya_dosyalari.delete_one({"id": dosya_id})
    return {"message": "Dosya silindi"}

# Excel Routes
@api_router.get("/excel/export")
async def export_excel(current_user: dict = Depends(get_current_user)):
    raporlar = await db.raporlar.find({}, {"_id": 0}).to_list(10000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Raporlar"
    
    # Headers
    headers = [
        "Rapor No", "Ekipman Adı", "Kategori", "Firma", "Lokasyon",
        "Marka/Model", "Seri No", "Alt Kategori", "Periyot",
        "Geçerlilik Tarihi", "Uygunluk", "Açıklama", "Oluşturma Tarihi"
    ]
    
    # Style headers
    header_fill = PatternFill(start_color="1e40af", end_color="1e40af", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Data
    for row_idx, rapor in enumerate(raporlar, 2):
        ws.cell(row=row_idx, column=1, value=rapor.get("rapor_no", ""))
        ws.cell(row=row_idx, column=2, value=rapor.get("ekipman_adi", ""))
        ws.cell(row=row_idx, column=3, value=rapor.get("kategori", ""))
        ws.cell(row=row_idx, column=4, value=rapor.get("firma", ""))
        ws.cell(row=row_idx, column=5, value=rapor.get("lokasyon", ""))
        ws.cell(row=row_idx, column=6, value=rapor.get("marka_model", ""))
        ws.cell(row=row_idx, column=7, value=rapor.get("seri_no", ""))
        ws.cell(row=row_idx, column=8, value=rapor.get("alt_kategori", ""))
        ws.cell(row=row_idx, column=9, value=rapor.get("periyot", ""))
        ws.cell(row=row_idx, column=10, value=rapor.get("gecerlilik_tarihi", ""))
        ws.cell(row=row_idx, column=11, value=rapor.get("uygunluk", ""))
        ws.cell(row=row_idx, column=12, value=rapor.get("aciklama", ""))
        created_at = rapor.get("created_at", "")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        ws.cell(row=row_idx, column=13, value=created_at.strftime("%Y-%m-%d %H:%M") if created_at else "")
    
    # Adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column].width = adjusted_width
    
    # Save to bytes
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=raporlar.xlsx"}
    )

@api_router.get("/excel/template")
async def download_template():
    wb = Workbook()
    ws = wb.active
    ws.title = "Rapor Şablonu"
    
    headers = [
        "Ekipman Adı", "Kategori", "Firma", "Lokasyon", "Marka/Model",
        "Seri No", "Alt Kategori", "Periyot", "Geçerlilik Tarihi",
        "Uygunluk", "Açıklama"
    ]
    
    header_fill = PatternFill(start_color="1e40af", end_color="1e40af", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Example row
    example = [
        "Asansör A1", "Asansör", "ABC Firma", "İstanbul", "Otis 2000",
        "SN12345", "Yolcu Asansörü", "6 Aylık", "2025-12-31",
        "Uygun", "Örnek açıklama"
    ]
    
    for col, value in enumerate(example, 1):
        ws.cell(row=2, column=col, value=value)
    
    for col in ws.columns:
        column = col[0].column_letter
        ws.column_dimensions[column].width = 20
    
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=rapor_sablonu.xlsx"}
    )

@api_router.post("/excel/import")
async def import_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "inspector"]:
        raise HTTPException(status_code=403, detail="Excel içe aktarma yetkiniz yok")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Sadece Excel dosyaları yüklenebilir")
    
    content = await file.read()
    excel_file = io.BytesIO(content)
    
    try:
        wb = load_workbook(excel_file)
        ws = wb.active
        
        headers = [cell.value for cell in ws[1]]
        
        imported_count = 0
        errors = []
        
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), 2):
            if not any(row):  # Skip empty rows
                continue
            
            try:
                rapor_no = await generate_rapor_no()
                
                rapor_data = {
                    "rapor_no": rapor_no,
                    "ekipman_adi": str(row[0]) if row[0] else "",
                    "kategori": str(row[1]) if row[1] else "",
                    "firma": str(row[2]) if row[2] else "",
                    "lokasyon": str(row[3]) if row[3] else None,
                    "marka_model": str(row[4]) if row[4] else None,
                    "seri_no": str(row[5]) if row[5] else None,
                    "alt_kategori": str(row[6]) if row[6] else None,
                    "periyot": str(row[7]) if row[7] else None,
                    "gecerlilik_tarihi": str(row[8]) if row[8] else None,
                    "uygunluk": str(row[9]) if row[9] else None,
                    "aciklama": str(row[10]) if row[10] else None,
                    "created_by": current_user["id"]
                }
                
                if not rapor_data["ekipman_adi"] or not rapor_data["kategori"] or not rapor_data["firma"]:
                    errors.append(f"Satır {row_idx}: Zorunlu alanlar eksik")
                    continue
                
                rapor = Rapor(**rapor_data)
                doc = rapor.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['updated_at'] = doc['updated_at'].isoformat()
                await db.raporlar.insert_one(doc)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Satır {row_idx}: {str(e)}")
        
        return {
            "message": f"{imported_count} rapor başarıyla içe aktarıldı",
            "imported_count": imported_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel işleme hatası: {str(e)}")

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Total reports
    total_raporlar = await db.raporlar.count_documents({})
    
    # This month reports
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    monthly_raporlar = await db.raporlar.count_documents({
        "created_at": {"$gte": start_of_month.isoformat()}
    })
    
    # Uygunluk stats
    uygun_count = await db.raporlar.count_documents({"uygunluk": "Uygun"})
    uygun_degil_count = await db.raporlar.count_documents({"uygunluk": "Uygun Değil"})
    
    # Expiring reports (30 days) - optimized query
    now_date = now.date()
    thirty_days = (now + timedelta(days=30)).date()
    seven_days = (now + timedelta(days=7)).date()
    
    # Only fetch gecerlilik_tarihi field for performance
    raporlar_with_dates = await db.raporlar.find(
        {"gecerlilik_tarihi": {"$ne": None, "$ne": ""}}, 
        {"gecerlilik_tarihi": 1, "_id": 0}
    ).limit(5000).to_list(5000)
    
    expiring_30_days = 0
    expiring_7_days = 0
    
    for rapor in raporlar_with_dates:
        gecerlilik_str = rapor.get("gecerlilik_tarihi")
        if gecerlilik_str and str(gecerlilik_str).strip():
            try:
                from datetime import datetime as dt
                # Try multiple date formats
                gecerlilik = None
                for fmt in ["%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]:
                    try:
                        gecerlilik = dt.strptime(str(gecerlilik_str), fmt).date()
                        break
                    except:
                        continue
                
                if gecerlilik:
                    if now_date <= gecerlilik <= thirty_days:
                        expiring_30_days += 1
                    if now_date <= gecerlilik <= seven_days:
                        expiring_7_days += 1
            except Exception as e:
                continue
    
    # Category distribution (top 6) - get unique categories from reports
    pipeline = [
        {"$group": {"_id": "$kategori", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 6},
        {"$project": {"kategori": "$_id", "count": 1, "_id": 0}}
    ]
    
    kategori_dagilim = await db.raporlar.aggregate(pipeline).to_list(6)
    
    return {
        "total_raporlar": total_raporlar,
        "monthly_raporlar": monthly_raporlar,
        "uygun_count": uygun_count,
        "uygun_degil_count": uygun_degil_count,
        "expiring_30_days": expiring_30_days,
        "expiring_7_days": expiring_7_days,
        "kategori_dagilim": kategori_dagilim
    }

# Users Management (Admin only)
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    result = []
    for user in users:
        result.append(UserResponse(
            id=user["id"],
            username=user.get("username", user["email"].split("@")[0]),
            email=user["email"],
            role=user["role"],
            email_verified=user.get("email_verified", False),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        ))
    
    return result

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return {"message": "Kullanıcı silindi"}

# Şehirler endpoint
@api_router.get("/sehirler")
async def get_sehirler():
    return SEHIRLER

# Kategori-Alt Kategori Map
@api_router.get("/kategori-alt-kategoriler")
async def get_kategori_alt_kategoriler():
    return KATEGORI_ALT_KATEGORI

# Projeler endpoints
@api_router.get("/projeler", response_model=List[Proje])
async def get_projeler(current_user: dict = Depends(get_current_user)):
    projeler = await db.projeler.find({}, {"_id": 0}).to_list(1000)
    for proje in projeler:
        if isinstance(proje['created_at'], str):
            proje['created_at'] = datetime.fromisoformat(proje['created_at'])
    return projeler

@api_router.post("/projeler", response_model=Proje)
async def create_proje(proje_create: ProjeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    proje = Proje(**proje_create.model_dump())
    doc = proje.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.projeler.insert_one(doc)
    return proje

@api_router.delete("/projeler/{proje_id}")
async def delete_proje(proje_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.projeler.delete_one({"id": proje_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    return {"message": "Proje silindi"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
