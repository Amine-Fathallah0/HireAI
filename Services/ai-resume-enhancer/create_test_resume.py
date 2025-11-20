"""
Quick script to create a test resume in MongoDB for testing the enhancement endpoint
"""
import asyncio
from datetime import datetime
from app.db_mongo import get_db

async def create_test_resume():
    db = get_db()
    
    # Create a test resume document
    resume_doc = {
        "_id": "test-resume-001",
        "resume_id": "test-resume-001",
        "user_id": "test@example.com",
        "filename": "test_resume.pdf",
        "sections": [
            {
                "type": "summary",
                "text": "I am a software engineer with experience in Python."
            },
            {
                "type": "experience",
                "text": "Worked on various software projects."
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert or replace
    await db.resumes.replace_one(
        {"_id": "test-resume-001"},
        resume_doc,
        upsert=True
    )
    
    print("✓ Test resume created: test-resume-001")
    print(f"  User: {resume_doc['user_id']}")
    print(f"  Sections: {len(resume_doc['sections'])}")
    print("\nNow you can test with:")
    print('$headers = @{"x-user-id" = "test@example.com"; "Content-Type" = "application/json"}')
    print('$body = @{section = "summary"; text = "I am a software engineer with Python experience."} | ConvertTo-Json')
    print('Invoke-RestMethod -Uri "http://localhost:8000/api/resumes/test-resume-001/enhance" -Method POST -Headers $headers -Body $body')

if __name__ == "__main__":
    asyncio.run(create_test_resume())
