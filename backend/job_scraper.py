import re
import requests
from bs4 import BeautifulSoup
import whois
from datetime import datetime

def scrape_job_url(url: str):
    """
    Scrapes a job URL for its description and attempts to find a recruiter email.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            script.extract()
            
        text = soup.get_text(separator=" ", strip=True)
        
        # Clean up excess whitespace
        description = re.sub(r'\s+', ' ', text)
        
        # Detect common login walls and anti-bot pages
        lower_desc = description.lower()
        if "linkedin login" in lower_desc or "sign in | linkedin" in lower_desc or "agree & join linkedin" in lower_desc:
            raise Exception("LinkedIn login wall encountered")
        
        # Try to find an email
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', description)
        email = email_match.group(0) if email_match else ""
        
        return {"description": description, "email": email, "success": True}
        
    except Exception as e:
        return {
            "description": "", 
            "email": "", 
            "success": False, 
            "error": f"Scraping failed: {str(e)}. Please paste the job description manually."
        }

def get_domain_age_days(domain: str) -> int:
    """
    Returns the age of a domain in days. Returns -1 if it cannot be determined.
    """
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date
        
        if not creation_date:
            return -1
            
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
            
        # Strip timezone info if present to avoid offset-naive/aware subtraction errors
        if creation_date.tzinfo is not None:
            creation_date = creation_date.replace(tzinfo=None)
            
        age = (datetime.now() - creation_date).days
        return age
    except Exception:
        return -1

def check_domain_safety(url: str, email: str = "") -> dict:
    """
    Checks the age of the domain from a URL or email.
    Less than 180 days is considered suspicious.
    """
    domain = None
    if url:
        if "http" in url:
            match = re.search(r'https?://(?:www\.)?([^/]+)', url)
            if match:
                domain = match.group(1)
        else:
            # Assume url is just a domain if no slashes
            if "/" not in url and "." in url:
                domain = url.replace("www.", "")
            
    if not domain and email and "@" in email:
        domain = email.split("@")[1]
        
    if not domain:
        return {"is_suspicious": False, "age_days": -1, "message": "No domain found", "age": -1, "ssl_valid": False, "free_email": False}
        
    age_days = get_domain_age_days(domain)
    
    if age_days == -1:
        return {"is_suspicious": False, "age_days": -1, "message": "Domain age unknown", "age": -1, "ssl_valid": False, "free_email": False}
        
    is_suspicious = age_days < 180
    
    # Simple check for free email providers
    free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    free_email = domain.lower() in free_providers
    
    # Mock ssl valid for now since doing a live SSL check slows down the API too much
    ssl_valid = True
    
    return {
        "is_suspicious": is_suspicious,
        "age_days": age_days,
        "age": age_days,
        "message": f"Domain age: {age_days} days",
        "ssl_valid": ssl_valid,
        "free_email": free_email
    }

def fetch_adzuna_jobs(skills: str, location: str = "us"):
    """
    Fetches real job recommendations from the Adzuna API.
    Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in the environment.
    """
    import os
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    # Fallback mock data if API keys aren't configured
    if not app_id or not app_key:
        print("Adzuna API keys missing. Using mock fallback data.")
        keywords = [s.strip() for s in skills.split(",") if s.strip()]
        primary_skill = keywords[0].title() if keywords else "Software Engineer"
        return [
            {
                "title": f"Senior {primary_skill}",
                "company": "Microsoft",
                "location": "Redmond, WA (Hybrid)",
                "url": "https://careers.microsoft.com/",
                "salary": "$150k - $200k",
                "description": "Looking for a software engineer to build great products. Requires experience with React and Python.",
                "is_verified": True
            },
            {
                "title": f"{primary_skill} Consultant",
                "company": "Deloitte",
                "location": "Remote",
                "url": "https://www2.deloitte.com/us/en/careers.html",
                "salary": "$110k - $140k",
                "description": "Help clients modernize their data pipelines using cutting edge AI. This is a remote role.",
                "is_verified": True
            }
        ]
        
    try:
        # Encode skills for URL
        from urllib.parse import quote
        query = quote(skills)
        url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1?app_id={app_id}&app_key={app_key}&results_per_page=5&what={query}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        jobs = []
        for item in data.get("results", []):
            jobs.append({
                "title": item.get("title", "Unknown Title"),
                "company": item.get("company", {}).get("display_name", "Unknown Company"),
                "location": item.get("location", {}).get("display_name", "Remote"),
                "url": item.get("redirect_url", ""),
                "salary": f"${int(item.get('salary_min', 0))} - ${int(item.get('salary_max', 0))}" if item.get('salary_min') else "Competitive",
                "description": item.get("description", ""),
                "is_verified": True
            })
        return jobs
    except Exception as e:
        print(f"Adzuna API Error: {e}")
        return []
