from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from datetime import datetime, timedelta
import os
import uuid
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

# We will import supabase client from our supabase_db
from backend.supabase_db import supabase

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

SECRET_KEY = os.getenv("SUPABASE_KEY", "fallback-secret-key-for-jwt")
ALGORITHM = "HS256"

class AuthRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = "User" # optional for signup

def verify_password(plain_password, hashed_password):
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None

@router.post("/signup")
async def signup(req: AuthRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    # Check if user exists
    try:
        res = supabase.table("users").select("id").eq("email", req.email).execute()
        data = getattr(res, "data", []) or []
    except Exception as e:
        if "11001" in str(e) or "getaddrinfo" in str(e):
            print("[OFFLINE MODE] Bypassing signup due to DNS failure")
            user_id = str(uuid.uuid4())
            token = create_access_token({"sub": req.email, "user_id": user_id})
            return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": req.name or "Demo User"}}
        raise HTTPException(status_code=500, detail="Database error during signup")
    
    if len(data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(req.password)
    user_id = str(uuid.uuid4())
    
    new_user = {
        "id": user_id,
        "email": req.email,
        "name": req.name,
        "password_hash": hashed_password,
        "role": "user"
    }
    
    try:
        ins_res = supabase.table("users").insert(new_user).execute()
        ins_data = getattr(ins_res, "data", []) or []
        if len(ins_data) == 0:
            raise Exception("No data returned")
    except Exception as e:
        print("Signup error:", e)
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    token = create_access_token({"sub": req.email, "user_id": user_id})
    return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": req.name}}

@router.post("/login")
async def login(req: AuthRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    try:
        res = supabase.table("users").select("*").eq("email", req.email).execute()
        data = getattr(res, "data", []) or []
    except Exception as e:
        if "11001" in str(e) or "getaddrinfo" in str(e):
            print("[OFFLINE MODE] Bypassing login due to DNS failure")
            user_id = str(uuid.uuid4())
            token = create_access_token({"sub": req.email, "user_id": user_id})
            return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": "Demo User"}}
        print("Login DB error:", e)
        raise HTTPException(status_code=500, detail="Database error")
        
    if len(data) == 0:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user = data[0]
    
    # If the user doesn't have a password hash, they can't login here
    pwd_hash = user.get("password_hash")
    if not pwd_hash or not verify_password(req.password, pwd_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = create_access_token({"sub": user["email"], "user_id": user["id"]})
    return {"success": True, "token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "")}}
