#!/usr/bin/env python
"""
Test script for JobMatcherFlow with dummy CV data
Run this to test your crew without external dependencies
"""

from src.job_matcher.main import JobMatcherFlow

# Dummy CV data for testing
DUMMY_CV_DATA = {
    "personal_info": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1-555-0123",
        "location": "New York, NY"
    },
    "summary": "Experienced Python developer with 5 years of backend development expertise. Strong skills in FastAPI, Django, and microservices architecture. Passionate about building scalable APIs and distributed systems.",
    "skills": [
        "Python",
        "FastAPI",
        "Django",
        "Docker",
        "PostgreSQL",
        "Redis",
        "REST APIs",
        "Microservices",
        "Git",
        "AWS"
    ],
    "experience": [
        {
            "title": "Backend Developer",
            "company": "Tech Solutions Inc",
            "duration": "2021-2024",
            "description": "Built and maintained REST APIs using FastAPI. Designed microservices architecture for e-commerce platform. Optimized database queries resulting in 40% performance improvement.",
            "key_achievements": [
                "Led migration from monolith to microservices",
                "Reduced API response time by 40%",
                "Mentored 3 junior developers"
            ]
        },
        {
            "title": "Junior Python Developer",
            "company": "StartupXYZ",
            "duration": "2019-2021",
            "description": "Developed backend features for SaaS platform using Django. Implemented authentication and payment integrations.",
            "key_achievements": [
                "Integrated Stripe payment gateway",
                "Built user authentication system"
            ]
        }
    ],
    "education": [
        {
            "degree": "Bachelor of Science in Computer Science",
            "institution": "University of Technology",
            "graduation_year": 2019,
            "field_of_study": "Computer Science"
        }
    ],
    "certifications": [
        "AWS Certified Developer - Associate",
        "Python Professional Certificate"
    ],
    "languages": ["English", "Spanish"],
    "experience_level": "mid",  # junior, mid, senior
    "location": "New York, NY",
    "preferences": {
        "desired_roles": ["Backend Engineer", "Python Developer", "API Developer"],
        "locations": ["New York", "Remote"],
        "remote_preference": True
    }
}


# Test trigger payload (simulating what Resume Parser would send)
TEST_TRIGGER_PAYLOAD = {
    "cv_data": DUMMY_CV_DATA,
    "candidate_id": "test_candidate_12345"
}


def test_job_matcher_flow():
    """
    Test the JobMatcherFlow with dummy data
    """
    print("=" * 60)
    print("Testing JobMatcherFlow with Dummy CV Data")
    print("=" * 60)
    print()
    
    # Display test data
    print("📋 Test CV Summary:")
    print(f"  Candidate: {DUMMY_CV_DATA['personal_info']['name']}")
    print(f"  Experience Level: {DUMMY_CV_DATA['experience_level']}")
    print(f"  Location: {DUMMY_CV_DATA['location']}")
    print(f"  Top Skills: {', '.join(DUMMY_CV_DATA['skills'][:5])}")
    print()
    print("-" * 60)
    print()
    
    try:
        # Create and kickoff the flow
        print("🚀 Starting JobMatcherFlow...")
        print()
        
        flow = JobMatcherFlow()
        result = flow.kickoff(inputs={"crewai_trigger_payload": TEST_TRIGGER_PAYLOAD})
        
        print()
        print("=" * 60)
        print("✅ Flow Completed Successfully!")
        print("=" * 60)
        print()
        
        # Display results
        print("📊 Results:")
        print()
        
        if hasattr(flow.state, 'scraped_jobs'):
            print(f"  Scraped Jobs: {len(flow.state.scraped_jobs) if flow.state.scraped_jobs else 0}")
        
        if hasattr(flow.state, 'job_recommendations'):
            print(f"  Job Recommendations: {len(flow.state.job_recommendations) if flow.state.job_recommendations else 0}")
            print()
            print("  Top Recommendations:")
            if flow.state.job_recommendations:
                for i, job in enumerate(flow.state.job_recommendations[:5], 1):
                    print(f"    {i}. {job}")
        
        print()
        print("-" * 60)
        print()
        print("🎉 Test completed successfully!")
        
        return result
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ Flow Failed!")
        print("=" * 60)
        print()
        print(f"Error: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    test_job_matcher_flow()
