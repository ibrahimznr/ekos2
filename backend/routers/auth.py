from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import EmailStr
import jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import os
import logging
import random
import uuid

from models import User, UserCreate, UserLogin, UserResponse, VerifyEmail, Token
from database import db

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

# JWT & Password Config
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

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
        session_token: str = payload.get("session")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Geçersiz kimlik")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    
    # Check if session token matches (single session enforcement)
    if session_token and user.get("active_session_token") != session_token:
        raise HTTPException(
            status_code=401, 
            detail="SESSION_EXPIRED_OTHER_DEVICE"
        )
    
    if "username" not in user:
        user["username"] = user["email"].split("@")[0]
    
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_create: UserCreate):
    
    if user_create.password != user_create.password_confirm:
        raise HTTPException(status_code=400, detail="Şifreler eşleşmiyor")
    
    if len(user_create.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")
    
    firma_exists = await db.raporlar.find_one({"firma": user_create.firma_adi}, {"_id": 0, "firma": 1})
    if not firma_exists:
        raise HTTPException(status_code=404, detail="FIRMA_NOT_FOUND")
    
    existing_email = await db.users.find_one({"email": user_create.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    existing_username = await db.users.find_one({"username": user_create.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
    
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    user = User(
        username=user_create.username,
        email=user_create.email,
        password=get_password_hash(user_create.password),
        role="viewer",
        firma_adi=user_create.firma_adi,
        email_verified=False,
        verification_code=verification_code
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    logger.info(f"Verification code for {user.email}: {verification_code}")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        firma_adi=user.firma_adi,
        email_verified=user.email_verified,
        created_at=user.created_at
    )

@router.post("/verify-email")
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

@router.post("/resend-code")
async def resend_verification_code(email: EmailStr):
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email zaten doğrulanmış")
    
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"verification_code": verification_code}}
    )
    
    logger.info(f"New verification code for {email}: {verification_code}")
    
    return {"message": "Doğrulama kodu yeniden gönderildi"}

@router.post("/login", response_model=Token)
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
            firma_adi=user.get("firma_adi"),
            email_verified=user.get("email_verified", False),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        firma_adi=current_user.get("firma_adi"),
        email_verified=current_user.get("email_verified", False),
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )
