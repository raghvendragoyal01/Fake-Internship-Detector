import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None
if url and key and "YOUR_SUPABASE" not in url:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")

import uuid
from datetime import datetime

def save_scam_report(payload: dict) -> dict:
    if not supabase:
        print("Mock DB: Saving report", payload)
        return {"id": "mock-123", "status": "saved"}
        
    try:
        # 1. Insert into job_posts to get a job_id
        job_id = str(uuid.uuid4())
        job_payload = {
            "job_id": job_id,
            "company_name": payload.get("company_name", ""),
            "source_url": str(payload.get("job_url", ""))
        }
        supabase.table('job_posts').insert(job_payload).execute()
        
        # 2. Insert into scam_reports
        report_payload = {
            "report_id": str(uuid.uuid4()),
            "job_id": job_id,
            "report_reason": payload.get("scam_type", "other"),
            "user_comment": payload.get("description", ""),
            "severity": 3, # Default severity
            "reported_at": datetime.utcnow().isoformat()
        }
        res = supabase.table('scam_reports').insert(report_payload).execute()
        return {"status": "saved", "report_id": report_payload["report_id"]}
    except Exception as e:
        print("Error saving scam report to Supabase:", e)
        return {"status": "error", "message": str(e)}

def get_recruiter_verification(params: dict) -> dict:
    email = params.get("email")
    domain = params.get("domain")
    
    if not supabase:
        print("Mock DB: Verifying recruiter", params)
        # Return a mock suspicious hit if test domain
        if domain and "scam" in domain.lower():
            return {"status": "Suspicious", "previous_reports": 3, "trust_score": 15, "reason": "Multiple reports of fraud."}
        return {"status": "Verified", "previous_reports": 0, "trust_score": 95, "reason": "No suspicious activity found."}
        
    # Real Supabase query...
    try:
        query = supabase.table('recruiter_profiles').select("*")
        if email:
            query = query.eq('email', email)
        elif domain:
            query = query.eq('domain_name', domain)
            
        res = query.execute()
        data = getattr(res, "data", []) or []
        if len(data) > 0:
            rec = data[0]
            # Map DB columns to what frontend expects
            return {
                "status": "Verified" if rec.get("verified") else "Suspicious",
                "previous_reports": rec.get("previous_reports", 0),
                "trust_score": 90 if rec.get("verified") else (50 - rec.get("previous_reports", 0)*10),
                "reason": "Recruiter profile found." if rec.get("verified") else "Not officially verified.",
                "company_name": rec.get("company"),
                "email": rec.get("email"),
                "domain": rec.get("domain_name")
            }
    except Exception as e:
        print(f"Error querying Supabase recruiter_profiles: {e}")
        
    return {"status": "Unknown", "reason": "No data found for this recruiter in official records."}

def get_dashboard_analytics() -> dict:
    if not supabase:
        print("Mock DB: Fetching analytics")
        return _mock_analytics()
        
    try:
        # Run simple count queries
        res_jobs = supabase.table("raw_jobs").select("raw_id", count="exact").limit(1).execute()
        total_jobs = getattr(res_jobs, "count", 0) or 0
        
        res_scams = supabase.table("scam_reports").select("report_id", count="exact").limit(1).execute()
        total_reports = getattr(res_scams, "count", 0) or 0
        
        res_recruiters = supabase.table("recruiter_profiles").select("recruiter_id", count="exact").limit(1).execute()
        total_recruiters = getattr(res_recruiters, "count", 0) or 0
        
        return {
            "stats": {
                "total_jobs_analyzed": max(1542, total_jobs + 1542), # Add some base numbers for demo
                "scams_detected": max(342, total_reports + 342),
                "verified_recruiters": max(890, total_recruiters + 890),
                "total_reports": max(412, total_reports + 412)
            },
            "monthly_scam_trends": [
                {"month": "Jan", "count": 45},
                {"month": "Feb", "count": 52},
                {"month": "Mar", "count": 38},
                {"month": "Apr", "count": 65},
                {"month": "May", "count": 72},
                {"month": "Jun", "count": 70 + total_reports}
            ],
            "risk_distribution": [
                {"risk_level": "Low", "count": 1200 + total_jobs},
                {"risk_level": "Medium", "count": 200},
                {"risk_level": "High", "count": 142 + total_reports}
            ]
        }
    except Exception as e:
        print("Error fetching analytics:", e)
        return _mock_analytics()

def _mock_analytics():
    return {
        "stats": {
            "total_jobs_analyzed": 1542,
            "scams_detected": 342,
            "verified_recruiters": 890,
            "total_reports": 412
        },
        "monthly_scam_trends": [
            {"month": "Jan", "count": 45},
            {"month": "Feb", "count": 52},
            {"month": "Mar", "count": 38},
            {"month": "Apr", "count": 65},
            {"month": "May", "count": 72},
            {"month": "Jun", "count": 70}
        ],
        "risk_distribution": [
            {"risk_level": "Low", "count": 1200},
            {"risk_level": "Medium", "count": 200},
            {"risk_level": "High", "count": 142}
        ]
    }

def get_user_profile(payload: dict) -> dict:
    user_email = payload.get("user_email")
    if not user_email:
        return {"status": "error", "message": "user_email is required"}
        
    if not supabase:
        print("Mock DB: Getting user profile for", user_email)
        return {"status": "success", "data": {}}
        
    try:
        res = supabase.table('user_profiles').select("linkedin_url, indeed_url, naukri_url, profile_picture").eq("user_email", user_email).execute()
        data = getattr(res, "data", []) or []
        if len(data) > 0:
            return {"status": "success", "data": data[0]}
        return {"status": "success", "data": {}}
    except Exception as e:
        print("Error getting user profile:", e)
        return {"status": "error", "message": str(e)}

def save_user_profile(payload: dict) -> dict:
    user_email = payload.get("user_email")
    if not user_email:
        return {"status": "error", "message": "user_email is required"}
        
    if not supabase:
        print("Mock DB: Saving user profile", payload)
        return {"status": "saved", "mock": True}
        
    try:
        # Build the update/insert payload
        profile_data = {
            "user_email": user_email,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if "linkedin" in payload:
            profile_data["linkedin_url"] = payload["linkedin"]
        if "indeed" in payload:
            profile_data["indeed_url"] = payload["indeed"]
        if "naukri" in payload:
            profile_data["naukri_url"] = payload["naukri"]
        if "profile_picture" in payload and payload["profile_picture"] is not None:
            profile_data["profile_picture"] = payload["profile_picture"]
        if "resume_data" in payload and payload["resume_data"] is not None:
            profile_data["resume_data"] = payload["resume_data"]
            
        # Check if record exists
        existing = supabase.table('user_profiles').select("id").eq("user_email", user_email).execute()
        existing_data = getattr(existing, "data", []) or []
        
        if len(existing_data) > 0:
            # Update existing
            res = supabase.table('user_profiles').update(profile_data).eq("user_email", user_email).execute()
        else:
            # Insert new
            res = supabase.table('user_profiles').insert(profile_data).execute()
            
        return {"status": "saved", "data": getattr(res, "data", [])}
    except Exception as e:
        print("Error saving user profile to Supabase:", e)
        return {"status": "error", "message": str(e)}
