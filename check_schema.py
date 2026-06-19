import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "https://hptftktcjtxbgfxnhkuq.supabase.co")
key = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdGZ0a3RjanR4YmdmeG5oa3VxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk4NzM0NywiZXhwIjoyMDk2NTYzMzQ3fQ.ANsalhAl8kxV4v4yNe2JIMmuzmefyuEFemt8MO7_9mU")

try:
    supabase = create_client(url, key)
    res = supabase.table('user_profiles').select("*").limit(1).execute()
    print("Columns:", res.data[0].keys() if res.data else "Empty")
    
    # Check users table
    res2 = supabase.table('users').select("*").limit(1).execute()
    print("Users columns:", res2.data[0].keys() if res2.data else "Empty")
except Exception as e:
    print("Error:", e)
