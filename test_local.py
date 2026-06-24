import asyncio
import os
from backend.routes import analyze_scam, ScamAnalyzeRequest
from backend.supabase_db import log_api_scan

async def test():
    req = ScamAnalyzeRequest(
        company_name="Tech Corp",
        job_url="https://example.com/job",
        scam_type="Data Entry",
        description="We are hiring for data analyst get 5000 ruppees daily"
    )
    try:
        res = await analyze_scam(req)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
