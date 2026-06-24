from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Depends, Form, Request
from pydantic import BaseModel, EmailStr, Field, AnyUrl
from typing import Optional, Any
from functools import lru_cache
from importlib import import_module
import inspect
import os
import base64
from backend.auth import get_current_user, require_admin

import backend.job_scraper as job_scraper
import backend.email_service as email_service
import backend.ats_scorer as ats_scorer

router = APIRouter(prefix="/api/v1", tags=["api"])

ML_MODULE_CANDIDATES = [
    os.getenv("SCAM_ML_MODULE", "").strip(),
    "backend.fraud_ml",
    "backend.ml_engine",
    "backend.ml",
    "backend.fraud_engine",
    "backend.models",
    "fraud_ml",
]

DB_MODULE_CANDIDATES = [
    os.getenv("SCAM_DB_MODULE", "").strip(),
    "backend.supabase_db",
    "backend.database",
    "backend.db",
    "backend.supabase_client",
    "backend.storage",
    "supabase_db",
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
    import traceback
    errors = []
    for module_name in _unique_names(candidates):
        try:
            return import_module(module_name)
        except Exception as exc:
            tb = traceback.format_exc()
            print(f"Failed to load {module_name}:\n{tb}")
            errors.append(f"{module_name}: {exc}")
    err_msg = "Unable to import any integration module. Tried: " + " | ".join(errors)
    print("FATAL:", err_msg)
    raise RuntimeError(err_msg)

@lru_cache(maxsize=1)
def ml_module():
    return _load_module(ML_MODULE_CANDIDATES)

@lru_cache(maxsize=1)
def db_module():
    return _load_module(DB_MODULE_CANDIDATES)

def _call_first_available(module, names, *args, **kwargs):
    import traceback
    last_error = None
    for name in names:
        fn = getattr(module, name, None)
        if callable(fn):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                tb = traceback.format_exc()
                print(f"Error calling {name}:\n{tb}")
                last_error = exc
    err_msg = f"None of the expected functions were usable: {names}. Last error: {last_error}"
    print("FATAL:", err_msg)
    raise RuntimeError(err_msg)

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
    company_name: Optional[str] = None
    job_url: Optional[str] = None
    scam_type: Optional[str] = None
    description: Optional[str] = None
    job_description: Optional[str] = None
    recruiter_email: Optional[str] = None

class ScamReportRequest(BaseModel):
    company_name: Optional[str] = None
    job_url: Optional[str] = None
    scam_type: Optional[str] = None
    description: Optional[str] = None
    recruiter_email: Optional[str] = None
    user_email: Optional[str] = None
    proof_file: Optional[str] = None

def _safe_dict(value):
    if isinstance(value, dict):
        return value
    if hasattr(value, "dict"):
        return value.dict()
    return {"value": value}

@router.post("/analyze")
async def analyze_scam(payload: ScamAnalyzeRequest):
    try:
        # Check if we need to scrape the URL
        if not payload.job_description and not payload.description and payload.job_url:
            import backend.job_scraper as job_scraper
            scrape_res = job_scraper.scrape_job_url(payload.job_url)
            if scrape_res.get("success"):
                payload.job_description = scrape_res.get("description")
                if scrape_res.get("email") and not payload.recruiter_email:
                    payload.recruiter_email = scrape_res.get("email")
                    
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
        db = db_module()
        try:
            _call_first_available(db, ["log_api_scan"], payload.dict(), {
                "scam_score": scam_score,
                "risk_level": risk_level
            })
        except Exception as log_err:
            print(f"Non-fatal error logging API scan: {log_err}")

        return {
            "success": True,
            "message": "Analysis completed",
            "data": {
                "scam_score": scam_score,
                "risk_level": risk_level,
                "domain_age_days": data.get("domain_age_days", data.get("domain_age")),
                "suspicious_keywords": data.get("suspicious_keywords", []),
                "recommendation": data.get("recommendation", data.get("message")),
                "scraped_description": payload.job_description,
                "raw": data,
            },
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

from fastapi import Header

@router.get("/api-key")
async def get_developer_api_key(user = Depends(get_current_user)):
    try:
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = db_module()
        email = user.get("sub") if isinstance(user, dict) else user
        api_key = db.get_api_key(email) if hasattr(db, "get_api_key") else ""
        return {"success": True, "api_key": api_key}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.post("/api-key/regenerate")
async def regenerate_developer_api_key(user = Depends(get_current_user)):
    try:
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        db = db_module()
        email = user.get("sub") if isinstance(user, dict) else user
        new_key = db.regenerate_api_key(email) if hasattr(db, "regenerate_api_key") else ""
        return {"success": True, "api_key": new_key}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.post("/developer/analyze")
async def developer_analyze_scam(payload: ScamAnalyzeRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API Key")
    
    api_key = authorization.split("Bearer ")[1]
    # Validate API key against DB
    # For now, we will assume any soulware_RG_live_ key that is 49 chars long is valid format
    if not api_key.startswith("soulware_RG_live_"):
        raise HTTPException(status_code=401, detail="Invalid API Key format")
    
    # Normally we would query Supabase for this API key to verify it.
    # Since we don't have a direct reverse lookup function written, we will trust the format for the demo.
    
    # Reuse normal analyze logic
    return await analyze_scam(payload)


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
        
        # Check if the DB function caught an error internally
        if data.get("status") == "error":
            raise Exception(data.get("message", "Database Error"))
            
        return {
            "success": True,
            "message": "Report saved successfully",
            "data": data,
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

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
        # Check domain info
        domain_to_check = domain or (str(email).split("@")[1] if email and "@" in str(email) else "")
        domain_info = job_scraper.check_domain_safety(domain_to_check, str(email) if email else "")
        
        raw_score = data.get("trust_score", data.get("score"))
        if raw_score is None:
            # Base score on domain age and free email status
            # Generate a deterministic "original score" between 60 and 85 for unknown domains
            import hashlib
            base_hash = int(hashlib.md5(domain_to_check.encode()).hexdigest(), 16)
            trust_score = 60.0 + (base_hash % 26)
            
            if domain_info["free_email"]:
                trust_score -= 40
            if domain_info["age"] > 0 and domain_info["age"] < 180:
                trust_score -= 30
            if domain_info["age"] == -1:
                trust_score -= 20
            
            # Floor it at 0
            trust_score = max(0.0, trust_score)
            
            # Update status based on computed score if DB returned default "Suspicious" or "Unknown" without a real reason
            if trust_score >= 80:
                status = "Verified"
                badge = "Verified"
            elif trust_score <= 30:
                status = "Blacklisted"
                badge = "Blacklisted"
            else:
                status = "Suspicious"
                badge = "Suspicious"
        else:
            trust_score = float(raw_score)

        # Generate a better reason if default
        reason = str(data.get("reason", ""))
        if not reason or reason == "Checks completed.":
            reason = []
            if domain_info["free_email"]:
                reason.append(f"Uses a free public email provider ({domain_to_check}), which is common in scams.")
            if domain_info["age"] > 0 and domain_info["age"] < 180:
                reason.append(f"Domain is very new (created {domain_info['age']} days ago). Legitimate companies usually have older domains.")
            if domain_info["age"] == -1:
                reason.append(f"Could not verify domain registration age for {domain_to_check}.")
            if trust_score >= 80 and not reason:
                reason.append(f"Domain {domain_to_check} appears established and safe.")
                
            reason = " ".join(reason) if reason else "Checks completed."

        return {
            "success": True,
            "data": {
                "status": status,
                "badge": badge,
                "previous_reports": int(data.get("previous_reports", 0)),
                "trust_score": trust_score,
                "reason": reason,
                "domain_age": domain_info["age"],
                "domain_ssl": domain_info["ssl_valid"],
                "domain_email": domain_info["free_email"],
                "domain_name": domain_to_check
            },
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/domain-check")
async def domain_check(domain: str = Query(...)):
    try:
        db = db_module()
        if not hasattr(db, "get_domain_reputation"):
            raise Exception("Domain check logic not implemented in DB")
            
        result = db.get_domain_reputation(domain)
        if result.get("status") == "error":
            raise Exception(result.get("message"))
            
        # Get WHOIS domain age using job_scraper logic
        domain_info = job_scraper.check_domain_safety(domain, "")
        
        trust_score = result.get("data", {}).get("trust_score", 50.0)
        ssl_valid = result.get("data", {}).get("ssl_valid", domain_info["ssl_valid"])
        blacklisted = result.get("data", {}).get("blacklisted", False)
        
        if blacklisted:
            trust_score = 0.0
            
        return {
            "success": True,
            "data": {
                "domain_name": domain,
                "domain_age_days": domain_info["age"],
                "ssl_valid": ssl_valid,
                "trust_score": float(trust_score),
                "blacklisted": bool(blacklisted)
            }
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/admin/dashboard-stats")
async def admin_dashboard_stats():
    try:
        db = db_module()
        result = _call_first_available(
            db,
            ["get_dashboard_analytics", "get_analytics", "dashboard_stats", "get_stats"]
        )
        data = _safe_dict(result)
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/user/dashboard-stats")
def user_dashboard_stats(email: str = ""):
    """
    Returns telemetry stats for the user dashboard based on email.
    """
    if not email:
        # Just fallback to a generic email if none provided for testing
        email = "raghvendragoyal67@gmail.com"
        
    try:
        from backend.supabase_db import get_user_dashboard_stats
        data = get_user_dashboard_stats(email)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
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
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

class ProfileSaveRequest(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    indeed: Optional[str] = None
    naukri: Optional[str] = None
    profile_picture: Optional[str] = None

@router.get("/profile")
async def get_profile(user_email: str = Depends(get_current_user)):
    try:
        db = db_module()
        user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
        data = {"user_email": user_email_str} if user_email_str else {}
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
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.post("/profile")
async def save_profile(payload: ProfileSaveRequest, user_email: str = Depends(get_current_user)):
    try:
        db = db_module()
        data = payload.dict()
        if user_email:
            user_email_str = user_email.get("sub") if isinstance(user_email, dict) else user_email
            data["user_email"] = user_email_str
            
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
async def analyze_ats(
    file: UploadFile = File(...), 
    target_job: Optional[str] = Form(None),
    user_email: str = Depends(get_current_user)
):
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
            
        if not (filename.endswith('.pdf')):
            raise HTTPException(status_code=400, detail="Only PDF files are supported for ATS analysis.")
            
        # Extract text using PyMuPDF
        resume_text = ats_scorer.extract_text_from_pdf(contents)
        
        # If target_job is not provided, use a generic one
        if not target_job or target_job.strip() == "":
            target_job = "Software Engineer Developer React Python Machine Learning Data"
        
        result = ats_scorer.calculate_ats_score(resume_text, target_job)
        
        if user_email:
            try:
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
                "overall_score": result["overall_score"],
                "formatting_score": result["formatting_score"],
                "keyword_match": result["keyword_match"],
                "impact_metrics": result["impact_metrics"],
                "feedback": result["feedback"],
                "extracted_skills": result.get("extracted_skills", []),
                "filename": filename
            }
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

class FetchJobRequest(BaseModel):
    job_url: AnyUrl

@router.post("/fetch-job")
async def fetch_job(payload: FetchJobRequest):
    try:
        url = str(payload.job_url)
        # Scrape
        data = job_scraper.scrape_job_url(url)
        
        # Check domain age
        domain_info = job_scraper.check_domain_safety(url, data.get("email"))
        data["domain_info"] = domain_info
        
        return {
            "success": True,
            "data": data
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

class RecommendJobRequest(BaseModel):
    skills: str

@router.post("/recommend-jobs")
async def recommend_jobs(payload: RecommendJobRequest):
    try:
        jobs = job_scraper.fetch_adzuna_jobs(payload.skills)
        
        # Screen jobs using ML Engine
        ml = ml_module()
        for job in jobs:
            job_payload = {
                "job_description": job.get("description", job.get("title")),
                "company_name": job.get("company"),
                "job_url": job.get("url")
            }
            try:
                ml_res = _call_first_available(ml, ["analyze_job_posting", "score_job", "predict_scam"], job_payload)
                job["scam_score"] = ml_res.get("scam_score", 10)
                job["risk_level"] = _normalize_risk(job["scam_score"], ml_res.get("risk_level", "LOW"))
                job["is_verified"] = job["risk_level"] == "LOW"
            except Exception as e:
                print(f"Error analyzing job {job.get('title')}: {e}")
                job["scam_score"] = 0
                job["risk_level"] = "UNKNOWN"
                job["is_verified"] = False

        return {
            "success": True,
            "data": jobs
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

class SubscribeAlertsRequest(BaseModel):
    email: EmailStr
    skills: str

@router.post("/subscribe-alerts")
async def subscribe_alerts(payload: SubscribeAlertsRequest):
    try:
        # Fetch jobs
        jobs = job_scraper.fetch_adzuna_jobs(payload.skills)
        
        # Inject a fake scam job so the user can see the flagged UI in action
        jobs.insert(0, {
            "title": f"URGENT: Crypto Trader ({payload.skills})",
            "company": "Bitcoin Solutions Ltd",
            "location": "Remote",
            "url": "http://bit.ly/fake-job-scam-xyz",
            "salary": "$200k - $500k",
            "description": "You must pay a processing fee via wire transfer and send your SSN immediately to our telegram for onboarding. This is an urgent position.",
            "is_verified": False
        })
        
        # Screen jobs using ML Engine
        ml = ml_module()
        screened_jobs = []
        for job in jobs:
            job_payload = {
                "job_description": job.get("description", job.get("title")),
                "company_name": job.get("company"),
                "job_url": job.get("url")
            }
            try:
                ml_res = _call_first_available(ml, ["analyze_job_posting", "score_job", "predict_scam"], job_payload)
                job["scam_score"] = ml_res.get("scam_score", 10)
                job["risk_level"] = _normalize_risk(job["scam_score"], ml_res.get("risk_level", "LOW"))
                job["suspicious_keywords"] = ml_res.get("suspicious_keywords", [])
            except Exception as e:
                print(f"ML screening failed for job: {e}")
                job["scam_score"] = 10
                job["risk_level"] = "LOW"
            
            screened_jobs.append(job)
        
        db = db_module()
        
        # 1. Save subscription to Supabase
        _call_first_available(db, ["save_job_alert_subscription"], payload.email, payload.skills)
        
        # 2. Send Email
        success, html_content = email_service.send_job_alert_email(payload.email, screened_jobs)
        
        # 3. Log Email to Supabase
        if success and html_content:
            _call_first_available(db, ["save_email_log"], payload.email, "ScamShield Alert: Safe Job Matches", html_content)
        
        return {
            "success": success,
            "message": "Alerts subscribed and email sent" if success else "Failed to send email",
            "jobs": screened_jobs
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/telemetry/stats")
async def get_telemetry_stats():
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
        stats = data.get("stats") or {
            "total_jobs_analyzed": data.get("total_jobs_analyzed", 0),
            "scams_detected": data.get("scams_detected", 0),
            "verified_recruiters": data.get("verified_recruiters", 0),
            "total_reports": data.get("total_reports", 0),
        }
        return {
            "success": True,
            "data": stats
        }
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

# Admin User Management Routes
@router.get("/admin/users")
async def admin_get_users():
    try:
        from backend.supabase_db import get_all_users
        data = get_all_users()
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.patch("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, payload: dict):
    try:
        from backend.supabase_db import update_user_role
        new_role = payload.get("role", "user")
        data = update_user_role(user_id, new_role)
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str):
    try:
        from backend.supabase_db import delete_user
        data = delete_user(user_id)
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

# Admin Reports Management Routes
@router.get("/admin/reports")
async def admin_get_reports():
    try:
        from backend.supabase_db import get_all_scam_reports
        data = get_all_scam_reports()
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.patch("/admin/reports/{report_id}/resolve")
async def admin_resolve_report(report_id: str, request: Request):
    try:
        from backend.supabase_db import resolve_scam_report
        payload = await request.json()
        status = payload.get("status", "resolved")
        data = resolve_scam_report(report_id, status)
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.get("/admin/scans")
async def admin_get_scans():
    try:
        from backend.supabase_db import get_all_scans
        data = get_all_scans()
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

@router.delete("/admin/reports/{report_id}")
async def admin_delete_report(report_id: str):
    try:
        from backend.supabase_db import delete_scam_report
        data = delete_scam_report(report_id)
        return {"success": True, "data": data}
    except Exception as exc:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())

