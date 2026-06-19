import sys
import os

# Ensure the root of fake_job_scam_system is in the python path
# so it can find the 'src' package we just copied.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from src.models.inference import run_inference

def predict_scam(payload: dict) -> dict:
    """
    Bridge function to connect FastAPI payload to the Graphura ML inference logic.
    """
    # Map API payload to what run_inference expects
    job_data = {
        "job_title": "", # the api doesn't have job_title explicitly, maybe it's in the description or just omit
        "company_name": payload.get("company_name", ""),
        "job_description": payload.get("job_description", ""),
        "salary": "" # api doesn't provide salary
    }
    
    # Run inference
    result = run_inference(job_data)
    
    # Extract prediction
    prob = result.get("fraud_probability", 0.0)
    base_score = prob * 100
    
    # Apply heuristics for edge cases that the ML model might miss
    # (e.g. perfectly written job descriptions with suspicious links/emails)
    heuristic_penalty = 0
    keywords = []
    
    text = str(job_data.get("job_description") or "").lower()
    
    # Fetch keywords from DB
    from backend.supabase_db import get_flagged_keywords
    db_keywords = get_flagged_keywords()
    
    if db_keywords:
        for item in db_keywords:
            term = item.get("keyword", "").lower()
            weight = item.get("fraud_weight", 0.0)
            if term and term in text:
                keywords.append(term)
                heuristic_penalty += float(weight) * 100 # convert 0.95 to 95 penalty points
    else:
        # Fallback if DB is empty
        suspicious_terms = [
            "urgent", "wire transfer", "bank account", "crypto", "bitcoin", 
            "ssn", "social security", "pay immediately", "telegram", "whatsapp"
        ]
        extreme_red_flags = [
            "security deposit", "refundable deposit", "registration fee", 
            "processing fee", "document verification fee", "onboarding fee"
        ]
        
        for term in suspicious_terms:
            if term in text:
                keywords.append(term)
                heuristic_penalty += 5  # Add 5 points per suspicious keyword
                
        for term in extreme_red_flags:
            if term in text:
                keywords.append(term)
                heuristic_penalty += 50  # Instant +50 penalty for asking for money
            
    # Check URL and WHOIS domain age
    job_url_raw = payload.get("job_url")
    job_url = str(job_url_raw).lower() if job_url_raw else ""
    if job_url:
        suspicious_domains = [".xyz", ".tk", "bit.ly", "tinyurl", "forms.gle", "t.me", "wa.me"]
        if any(sd in job_url for sd in suspicious_domains):
            heuristic_penalty += 25
            keywords.append("Suspicious URL domain")
        else:
            try:
                import whois
                from urllib.parse import urlparse
                from datetime import datetime
                
                parsed_url = urlparse(job_url if "://" in job_url else f"http://{job_url}")
                domain = parsed_url.netloc or parsed_url.path
                
                w = whois.whois(domain)
                if w.creation_date:
                    # Some registries return a list of dates
                    creation_date = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
                    if creation_date.tzinfo is not None:
                        creation_date = creation_date.replace(tzinfo=None)
                    age_days = (datetime.now() - creation_date).days
                    if age_days < 180:
                        heuristic_penalty += 60
                        keywords.append(f"Newly registered domain ({age_days} days old)")
            except Exception as e:
                # WHOIS might fail or timeout, fail gracefully
                pass
    else:
        heuristic_penalty += 10 # Missing URL is slightly suspicious
        
    # Check Email
    email_raw = payload.get("recruiter_email")
    email = str(email_raw).lower() if email_raw else ""
    if email:
        free_emails = ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com"]
        if any(fe in email for fe in free_emails):
            heuristic_penalty += 20
            keywords.append("Free email provider")
            
    # Calculate final score (cap at 99)
    final_score = min(99.0, round(base_score + heuristic_penalty, 2))
            
    if final_score >= 60:
        recommendation = "High risk of scam. Do not provide personal information or money."
        risk_level = "HIGH"
    elif final_score >= 30:
        recommendation = "Moderate risk. Exercise caution and verify the company independently."
        risk_level = "MEDIUM"
    else:
        recommendation = "Low risk detected. Always remain vigilant."
        risk_level = "LOW"
    
    return {
        "scam_score": final_score,
        "risk_level": risk_level,
        "suspicious_keywords": keywords,
        "recommendation": recommendation,
        "domain_age_days": age_days if 'age_days' in locals() else None
    }

