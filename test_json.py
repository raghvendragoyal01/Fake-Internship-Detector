import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "https://hptftktcjtxbgfxnhkuq.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGZ0a3RjanR4YmdmeG5oa3VxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk4NzM0NywiZXhwIjoyMDk2NTYzMzQ3fQ.ANsalhAl8kxV4v4yNe2JIMmuzmefyuEFemt8MO7_9mU")

try:
    supabase = create_client(url, key)
    # create a dummy profile
    res = supabase.table('user_profiles').upsert({
        'user_email': 'test_settings@scamshield.io',
        'skills_data': '{"email_alerts": true, "two_factor_enabled": false}'
    }).execute()
    print("Success:", res.data)
except Exception as e:
    print("Error:", e)
