import os
import sys
from dotenv import load_dotenv
load_dotenv()

sys.path.append('.')
import uuid
from backend.supabase_db import save_scam_report

payload = {
    'company_name': 'Test Co',
    'job_url': 'http://test.com',
    'scam_type': 'phishing',
    'description': 'test',
    'recruiter_email': 'raghvendragoyal18@gmail.com'
}

res = save_scam_report(payload)
print('RESULT:', res)
