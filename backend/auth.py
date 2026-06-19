from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
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
        return payload
    except Exception:
        return None

def require_admin(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

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
            role = "admin" if req.email.lower() == "admin@scamshield.io" else "user"
            token = create_access_token({"sub": req.email, "user_id": user_id, "role": role})
            return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": req.name or "Demo User", "role": role}}
        raise HTTPException(status_code=500, detail="Database error during signup")
    
    if len(data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(req.password)
    user_id = str(uuid.uuid4())
    
    role = "admin" if req.email.lower() == "admin@scamshield.io" else "user"
    
    new_user = {
        "id": user_id,
        "email": req.email,
        "name": req.name,
        "password_hash": hashed_password,
        "role": role
    }
    
    try:
        ins_res = supabase.table("users").insert(new_user).execute()
        ins_data = getattr(ins_res, "data", []) or []
        if len(ins_data) == 0:
            raise Exception("No data returned")
    except Exception as e:
        print("Signup error:", e)
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    token = create_access_token({"sub": req.email, "user_id": user_id, "role": role})
    return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": req.name, "role": role}}

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
            token = create_access_token({"sub": req.email, "user_id": user_id, "role": "admin"}) # Give admin in offline
            return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": "Demo User", "role": "admin"}}
        print("Login DB error:", e)
        raise HTTPException(status_code=500, detail="Database error")
        
    if len(data) == 0:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user = data[0]
    
    # If the user doesn't have a password hash, they can't login here
    pwd_hash = user.get("password_hash")
    if not pwd_hash or not verify_password(req.password, pwd_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    role = "admin" if user["email"].lower() == "admin@scamshield.io" else user.get("role", "user")
        
    token = create_access_token({"sub": user["email"], "user_id": user["id"], "role": role})
    return {"success": True, "token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name", ""), "role": role}}

class OAuthRequest(BaseModel):
    email: EmailStr
    name: str = "Google User"

@router.post("/oauth-login")
async def oauth_login(req: OAuthRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    try:
        res = supabase.table("users").select("*").eq("email", req.email).execute()
        data = getattr(res, "data", []) or []
    except Exception as e:
        print("OAuth login DB error:", e)
        raise HTTPException(status_code=500, detail="Database error")
        
    if len(data) == 0:
        # User doesn't exist, create them
        user_id = str(uuid.uuid4())
        role = "admin" if req.email.lower() == "admin@scamshield.io" else "user"
        new_user = {
            "id": user_id,
            "email": req.email,
            "name": req.name,
            "password_hash": "", # No password for OAuth users
            "role": role
        }
        try:
            supabase.table("users").insert(new_user).execute()
        except Exception as e:
            print("OAuth Signup error:", e)
            raise HTTPException(status_code=500, detail="Failed to create OAuth user")
    else:
        user_id = data[0]["id"]
        role = "admin" if data[0]["email"].lower() == "admin@scamshield.io" else data[0].get("role", "user")
        
    token = create_access_token({"sub": req.email, "user_id": user_id, "role": role})
    return {"success": True, "token": token, "user": {"id": user_id, "email": req.email, "name": req.name, "role": role}}

class UpdateSettingsRequest(BaseModel):
    name: str
    email_alerts: bool
    push_alerts: bool
    weekly_report: bool
    two_factor_enabled: bool
    avatar: Optional[str] = None

@router.get("/settings")
async def get_settings(user_email: str = Depends(get_current_user)):
    try:
        user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
        res = supabase.table("user_profiles").select("skills_data, profile_picture").eq("user_email", user_email_str).execute()
        data = getattr(res, "data", []) or []
        settings = {}
        if len(data) > 0:
            import json
            skills_data_str = data[0].get("skills_data", "{}")
            if skills_data_str:
                try:
                    settings = json.loads(skills_data_str)
                except Exception:
                    pass
            settings["avatar"] = data[0].get("profile_picture")
            
        # Get user name
        u_res = supabase.table("users").select("name").eq("email", user_email_str).execute()
        u_data = getattr(u_res, "data", []) or []
        if len(u_data) > 0:
            settings["name"] = u_data[0].get("name")
            
        return {"success": True, "data": settings}
    except Exception as e:
        print("Error getting settings:", e)
        raise HTTPException(status_code=500, detail="Failed to get settings")

@router.post("/update-settings")
async def update_settings(req: UpdateSettingsRequest, user_email: str = Depends(get_current_user)):
    try:
        user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
        import json
        settings_json = json.dumps({
            "email_alerts": req.email_alerts,
            "push_alerts": req.push_alerts,
            "weekly_report": req.weekly_report,
            "two_factor_enabled": req.two_factor_enabled
        })
        
        # Update user profile
        profile_data = {"user_email": user_email_str, "skills_data": settings_json}
        if req.avatar:
            profile_data["profile_picture"] = req.avatar
            
        existing = supabase.table('user_profiles').select("id").eq("user_email", user_email_str).execute()
        if len(getattr(existing, "data", []) or []) > 0:
            supabase.table('user_profiles').update(profile_data).eq("user_email", user_email_str).execute()
        else:
            supabase.table('user_profiles').insert(profile_data).execute()
            
        # Update name in users
        supabase.table("users").update({"name": req.name}).eq("email", user_email_str).execute()
        
        return {"success": True}
    except Exception as e:
        print("Error updating settings:", e)
        raise HTTPException(status_code=500, detail="Failed to update settings")

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/update-password")
async def update_password(req: UpdatePasswordRequest, user_email: str = Depends(get_current_user)):
    try:
        user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
        res = supabase.table("users").select("password_hash").eq("email", user_email_str).execute()
        data = getattr(res, "data", []) or []
        if len(data) == 0:
            raise HTTPException(status_code=404, detail="User not found")
            
        pwd_hash = data[0].get("password_hash")
        # Check if old password matches, unless it's a social account without a password
        if pwd_hash and not verify_password(req.old_password, pwd_hash):
            raise HTTPException(status_code=400, detail="Incorrect old password")
            
        new_hashed = get_password_hash(req.new_password)
        supabase.table("users").update({"password_hash": new_hashed}).eq("email", user_email_str).execute()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print("Error updating password:", e)
        raise HTTPException(status_code=500, detail="Failed to update password")

@router.delete("/delete-account")
async def delete_account(user_email: str = Depends(get_current_user)):
    try:
        user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
        supabase.table("user_profiles").delete().eq("user_email", user_email_str).execute()
        supabase.table("users").delete().eq("email", user_email_str).execute()
        # Also clean up alerts, reports, etc if necessary (cascade usually handles this if set)
        return {"success": True}
    except Exception as e:
        print("Error deleting account:", e)
        raise HTTPException(status_code=500, detail="Failed to delete account")
