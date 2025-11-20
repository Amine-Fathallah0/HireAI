"""Check the ai_analysis that was written to MongoDB"""
import asyncio
from app.db_mongo import get_db

async def check_ai_analysis():
    db = get_db()
    resume = await db.resumes.find_one({"_id": "test-resume-001"})
    
    if resume and "ai_analysis" in resume:
        analysis = resume["ai_analysis"]
        print("\n=== AI ANALYSIS IN MONGODB ===\n")
        
        print(f"Overall ATS Score: {analysis.get('overall_ats_score', 'N/A')}")
        print(f"Last Analyzed: {analysis.get('last_analyzed', 'N/A')}")
        
        print(f"\nSection Scores:")
        for section, score in analysis.get('section_scores', {}).items():
            print(f"  {section}: {score}")
        
        print(f"\nEnhancement History ({len(analysis.get('enhancement_history', []))} entries):")
        for i, entry in enumerate(analysis.get('enhancement_history', [])[:3], 1):
            print(f"\n  Entry {i}:")
            print(f"    Section: {entry.get('section')}")
            print(f"    Timestamp: {entry.get('timestamp')}")
            print(f"    ATS Before: {entry.get('ats_score_before')}")
            print(f"    ATS After: {entry.get('ats_score_after')}")
            print(f"    Confidence: {entry.get('confidence')}")
            print(f"    Keywords Added: {entry.get('keywords_added', [])[:5]}")
            if entry.get('context'):
                print(f"    Context: {entry.get('context')}")
    else:
        print("No ai_analysis found in resume document")

if __name__ == "__main__":
    asyncio.run(check_ai_analysis())
