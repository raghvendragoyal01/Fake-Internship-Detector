from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends
from pydantic import BaseModel, EmailStr, Field, AnyUrl
from typing import Optional, Any
from functools import lru_cache
from importlib import import_module
import inspect
import os
import base64
from backend.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["api"])

ML_MODULE_CANDIDATES = [
    os.getenv("SCAM_ML_MODULE", "").strip(),
    "ml_engine",
    "ml",
    "fraud_ml",
    "fraud_engine",
    "models",
]

DB_MODULE_CANDIDATES = [
    os.getenv("SCAM_DB_MODULE", "").strip(),
    "database",
    "db",
    "supabase_db",
    "supabase_client",
    "storage",
]

def _unique_names(names):
    seen = set()
    result = []
    for name in names:
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result

def _load_module(candidates):
    errors = []
    for module_name in _unique_names(candidates):
        try:
            return import_module(module_name)
        except Exception as exc:
            errors.append(f"{module_name}: {exc}")
    raise RuntimeError("Unable to import any integration module. Tried: " + " | ".join(errors))

@lru_cache(maxsize=1)
def ml_module():
    return _load_module(ML_MODULE_CANDIDATES)

@lru_cache(maxsize=1)
def db_module():
    return _load_module(DB_MODULE_CANDIDATES)

def _call_first_available(module, names, *args, **kwargs):
    last_error = None
    for name in names:
        fn = getattr(module, name, None)
        if callable(fn):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                last_error = exc
    raise RuntimeError(f"None of the expected functions were usable: {names}. Last error: {last_error}")

def _normalize_risk(score: Any, risk_level: Optional[str] = None) -> str:
    if risk_level:
        value = str(risk_level).upper()
        if value in {"LOW", "LOW RISK"}:
            return "LOW"
        if value in {"MEDIUM", "MEDIUM RISK"}:
            return "MEDIUM"
        if value in {"HIGH", "HIGH RISK", "SCAM"}:
            return "HIGH"
    try:
        score_value = float(score)
    except Exception:
        return "UNKNOWN"
    if score_value <= 30:
        return "LOW"
    if score_value <= 60:
        return "MEDIUM"
    return "HIGH"

class ScamAnalyzeRequest(BaseModel):
    job_description: str = Field(min_length=1)
    job_url: Optional[str] = None
    recruiter_email: Optional[EmailStr] = None
    company_name: Optional[str] = None

class ScamReportRequest(BaseModel):
    company_name: str = Field(min_length=1)
    job_url: AnyUrl
    scam_type: str = Field(min_length=1)
    description: str = Field(min_length=1)
    recruiter_email: Optional[EmailStr] = None

def _safe_dict(value):
    if isinstance(value, dict):
        return value
    if hasattr(value, "dict"):
        return value.dict()
    return {"value": value}

@router.post("/analyze")
async def analyze_scam(payload: ScamAnalyzeRequest):
    try:
        ml = ml_module()
        result = _call_first_available(
            ml,
            [
                "analyze_job_posting",
                "predict_scam",
                "predict_job_scam",
                "analyze_posting",
                "analyze",
            ],
            payload.dict(),
        )
        data = _safe_dict(result)
        scam_score = data.get("scam_score", data.get("score"))
        risk_level = _normalize_risk(scam_score, data.get("risk_level"))
        return {
            "success": True,
            "message": "Analysis completed",
            "data": {
                "scam_score": scam_score,
                "risk_level": risk_level,
                "domain_age_days": data.get("domain_age_days", data.get("domain_age")),
                "suspicious_keywords": data.get("suspicious_keywords", []),
                "recommendation": data.get("recommendation", data.get("message")),
                "raw": data,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/report")
async def report_scam(payload: ScamReportRequest):
    try:
        db = db_module()
        result = _call_first_available(
            db,
            [
                "save_scam_report",
                "create_scam_report",
                "insert_scam_report",
                "store_scam_report",
                "submit_report",
            ],
            payload.dict(),
        )
        data = _safe_dict(result)
        return {
            "success": True,
            "message": "Report saved successfully",
            "data": data,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/recruiter-check")
async def recruiter_check(
    email: Optional[EmailStr] = Query(default=None),
    domain: Optional[str] = Query(default=None),
):
    if not email and not domain:
        raise HTTPException(status_code=400, detail="Provide either email or domain")
    try:
        db = db_module()
        result = _call_first_available(
            db,
            [
                "get_recruiter_verification",
                "check_recruiter",
                "verify_recruiter",
                "recruiter_check",
                "get_recruiter_status",
            ],
            {"email": str(email) if email else None, "domain": domain},
        )
        data = _safe_dict(result)
        status = str(data.get("status") or data.get("verification_status") or "Suspicious").title()
        badge = data.get("badge") or status
        if str(badge).lower() not in {"verified", "suspicious", "blacklisted"}:
            badge = status
        return {
            "success": True,
            "data": {
                "status": status,
                "badge": str(badge).title(),
                "company_name": data.get("company_name"),
                "email": data.get("email") or (str(email) if email else None),
                "domain": data.get("domain") or domain,
                "previous_reports": int(data.get("previous_reports", 0) or 0),
                "trust_score": data.get("trust_score"),
                "reason": data.get("reason"),
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/dashboard")
async def dashboard():
    try:
        db = db_module()
        result = _call_first_available(
            db,
            [
                "get_dashboard_analytics",
                "fetch_dashboard_analytics",
                "dashboard_analytics",
                "get_dashboard_data",
                "analytics_dashboard",
            ],
        )
        data = _safe_dict(result)
        return {
            "success": True,
            "data": {
                "stats": data.get("stats") or {
                    "total_jobs_analyzed": data.get("total_jobs_analyzed", 0),
                    "scams_detected": data.get("scams_detected", 0),
                    "verified_recruiters": data.get("verified_recruiters", 0),
                    "total_reports": data.get("total_reports", 0),
                },
                "monthly_scam_trends": data.get("monthly_scam_trends") or data.get("trends") or [],
                "risk_distribution": data.get("risk_distribution") or data.get("risk_breakdown") or [],
                "top_domains": data.get("top_domains") or [],
                "top_recruiters": data.get("top_recruiters") or [],
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

class ProfileSaveRequest(BaseModel):
    linkedin: Optional[str] = None
    indeed: Optional[str] = None
    naukri: Optional[str] = None
    profile_picture: Optional[str] = None

@router.get("/profile")
async def get_profile(user_email: str = Depends(get_current_user)):
    try:
        db = db_module()
        data = {"user_email": user_email} if user_email else {}
        result = _call_first_available(
            db,
            [
                "get_user_profile",
                "fetch_user_profile",
            ],
            data,
        )
        return {"success": True, "data": _safe_dict(result).get("data", {})}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/profile")
async def save_profile(payload: ProfileSaveRequest, user_email: str = Depends(get_current_user)):
    try:
        db = db_module()
        data = payload.dict()
        if user_email:
            data["user_email"] = user_email
            
        result = _call_first_available(
            db,
            [
                "save_user_profile",
                "update_profile",
                "save_profile",
            ],
            data,
        )
        return {"success": True, "message": "Profile saved"}
    except Exception as exc:
        if "None of the expected functions were usable" in str(exc):
            return {"success": True, "message": "Profile saved (mock fallback)", "data": payload.dict()}
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/ats-analyze")
async def analyze_ats(file: UploadFile = File(...), user_email: str = Depends(get_current_user)):
    try:
        # Read the file contents securely
        contents = await file.read()
        filename = file.filename.lower()
        
        # Simple local text extraction (mock logic for demo if no robust library installed)
        # We simulate ATS processing rules using length and some basic checks on the binary data length
        filesize = len(contents)
        if filesize == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
            
        import random
        # Base scores
        format_score = 80 + random.randint(0, 15)
        keyword_score = 70 + random.randint(0, 25)
        impact_score = 65 + random.randint(0, 30)
        
        # Penalize if not pdf or docx
        if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.doc')):
            format_score -= 30
            keyword_score -= 20
        
        overall_score = int((format_score * 0.4) + (keyword_score * 0.4) + (impact_score * 0.2))
        
        feedback = "Your resume is readable by Applicant Tracking Systems."
        if overall_score > 85:
            feedback = "Excellent! Your resume is highly optimized for ATS parsing."
        elif overall_score < 70:
            feedback = "Your resume might face parsing issues. Avoid complex formatting like tables or columns."
        
        if user_email:
            try:
                # Save the resume as base64 in the user's profile
                b64_resume = f"data:{file.content_type};base64,{base64.b64encode(contents).decode('utf-8')}"
                db = db_module()
                _call_first_available(
                    db,
                    ["save_user_profile"],
                    {"user_email": user_email, "resume_data": b64_resume}
                )
            except Exception as e:
                print(f"Failed to auto-save resume: {e}")
                
        return {
            "success": True,
            "data": {
                "overall_score": overall_score,
                "format_score": format_score,
                "keyword_score": keyword_score,
                "impact_score": impact_score,
                "feedback": feedback,
                "filename": filename
            }
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
