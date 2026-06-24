import asyncio
import os
from backend.routes import analyze_scam, ScamAnalyzeRequest
from backend.supabase_db import log_api_scan

async def test():
    req = ScamAnalyzeRequest(
        company_name="Test Company",
        job_url="https://example.com/job",
        scam_type="Data Entry",
        description="Earn $500/hr by typing from home!"
    )
    try:
        res = await analyze_scam(req)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
