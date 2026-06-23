import requests
import json

# Replace this with your actual Render URL
RENDER_URL = "https://fake-internship-detector-t2dx.onrender.com"

print("=== Enter Job Details for Analysis ===")
company_name = input("Company Name (press Enter to skip): ")
job_url = input("Job URL (press Enter to skip): ")
scam_type = input("Scam Type (e.g., Data Entry) (press Enter to skip): ")
description = input("Job Description (press Enter to skip): ")

headers = {
    "Authorization": "Bearer soulware_RG_live_voREt13ErrWDRxeLLfZikJQ5cxGIfpJo",
    "Content-Type": "application/json"
}

payload = {}
if company_name: payload["company_name"] = company_name
if job_url: payload["job_url"] = job_url
if scam_type: payload["scam_type"] = scam_type
if description: payload["description"] = description

print("\nSending request to API...")
# Make the request to the live Render URL
response = requests.post(f"{RENDER_URL}/api/v1/developer/analyze", headers=headers, json=payload)

print(f"\nStatus Code: {response.status_code}")
try:
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception:
    print(f"Raw Response: {response.text}")
