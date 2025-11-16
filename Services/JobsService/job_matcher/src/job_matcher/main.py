#!/usr/bin/env python
from random import randint
from typing import Dict, List
import json
import re
import os

from pydantic import BaseModel

from crewai.flow import Flow, listen, start

from job_matcher.crews.Job_Matcher.jobmatcher_crew import JobMatcherCrew


# Define the state model for the flow
class JobMatcherState(BaseModel):
    """State model for JobMatcher Flow"""
    cv_data: Dict = {}
    candidate_id: str = ""
    job_url: str = ""
    scraped_content: str = ""  # Add this to store raw scraped content
    scraped_job: Dict = {}
    match_result: Dict = {}

class JobMatcherFlow(Flow[JobMatcherState]):

    @start()
    def initialize_with_cv_data(self, crewai_trigger_payload: dict = None):
        """
        Receives parsed CV data from Resume Parser microservice
        Stores it in state for later use by Job Matcher Agent
        """
        if not crewai_trigger_payload:
            raise Exception("CV data required from Resume Parser service")
        
        # Store CV data from external microservice
        self.state.cv_data = crewai_trigger_payload.get('cv_data')
        self.state.candidate_id = crewai_trigger_payload.get('candidate_id')
        self.state.job_url = crewai_trigger_payload.get('job_url', '')
        
        if not self.state.job_url:
            raise Exception("Job URL is required ")
        
        print(f"✅ Initialized with CV data for candidate: {self.state.candidate_id}")
        print(f"🔗 Job URL: {self.state.job_url}")  # ✅ This field exists in JobMatcherState
    @listen(initialize_with_cv_data)
    def scrape_jobs(self):
        """
        Pre-scrape job content using Firecrawl, then pass to agent for extraction
        """
        print("\n" + "="*60)
        print(f"� Pre-scraping job with Firecrawl: {self.state.job_url}")
        print("="*60)
        
        import time
        from crewai_tools import FirecrawlScrapeWebsiteTool
        
        # Get Firecrawl API key
        firecrawl_api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not firecrawl_api_key:
            raise ValueError("FIRECRAWL_API_KEY not found in environment")
        
        # STEP 1: Pre-scrape with Firecrawl BEFORE calling the agent
        print("📡 Calling Firecrawl API...")
        scraper = FirecrawlScrapeWebsiteTool(api_key=firecrawl_api_key)
        
        try:
            scraped_result = scraper._run(url=self.state.job_url)
            
            # Extract content from Document object
            if hasattr(scraped_result, 'page_content'):
                scraped_content = scraped_result.page_content
            elif hasattr(scraped_result, 'content'):
                scraped_content = scraped_result.content
            elif isinstance(scraped_result, str):
                scraped_content = scraped_result
            else:
                scraped_content = str(scraped_result)
            
            self.state.scraped_content = scraped_content
            print(f"✅ Scraped {len(scraped_content)} characters")
            print(f"📄 Preview: {scraped_content[:300]}...")
            
            # Check what was actually scraped
            if "data scientist" in scraped_content.lower():
                print("✅ Found 'data scientist' in scraped content")
            elif "warehouse" in scraped_content.lower():
                print("⚠️  WARNING: Found 'warehouse' - wrong job scraped!")
            
        except Exception as e:
            print(f"❌ Firecrawl scraping failed: {e}")
            raise
        
        # STEP 2: Now pass the pre-scraped content to agent for extraction
        print("\n🤖 Sending scraped content to extraction agent...")
        start_time = time.time()
        
        result = (
            JobMatcherCrew()
            .scraper_crew()  # Use scraper_crew() instead of crew()
            .kickoff(inputs={
                "job_url": self.state.job_url,
                "scraped_content": self.state.scraped_content,  # Pass pre-scraped content
            })
        )
        
        elapsed = time.time() - start_time
        print(f"⏱️  Agent extraction took {elapsed:.2f} seconds")
        
        # Extract scraped job data and parse JSON
        raw_result = result.raw if hasattr(result, 'raw') else str(result)
        
        # Try to parse JSON from the result
        self.state.scraped_job = self._parse_json_from_result(raw_result)
        
        if isinstance(self.state.scraped_job, dict):
            print(f"✅ Extracted job: {self.state.scraped_job.get('title', 'Unknown')}")
            print(f"🏢 Company: {self.state.scraped_job.get('company', 'Unknown')}")
            print(f"📍 Location: {self.state.scraped_job.get('location', 'Unknown')}")
        else:
            print(f"⚠️  Warning: Could not parse job data as JSON")
            print(f"Raw result preview: {str(raw_result)[:200]}...")

    @listen(scrape_jobs)
    def match_jobs_and_optimize(self):
        """
     Step 2: Match CV to job and generate resume optimization feedback

        """
        print("\n" + "="*60)
        print("🎯 Analyzing CV-Job match and generating resume feedback...")
        print("="*60)
        
        import time
        start_time = time.time()
        
        result = (
            JobMatcherCrew()
            .matcher_crew()  # Use matcher_crew() instead of crew()
            .kickoff(inputs={
                "cv_data": self.state.cv_data,           
                "scraped_job_details": self.state.scraped_job,  
                "candidate_id": self.state.candidate_id
            })
        )
        
        elapsed = time.time() - start_time
        print(f"⏱️  Matching took {elapsed:.2f} seconds")
        
        # Parse match result
        raw_result = result.raw if hasattr(result, 'raw') else str(result)
        self.state.match_result = self._parse_json_from_result(raw_result)
        
        if isinstance(self.state.match_result, dict):
            match_score = self.state.match_result.get('overall_match_score', 0)
            print(f"✅ Match Score: {match_score}/100")
            print(f"📝 Resume optimization feedback generated")
        else:
            print(f"⚠️  Warning: Could not parse match result as JSON")
        
        return self.state.match_result

    def _parse_json_from_result(self, result: str) -> Dict:
        """
        Parse JSON from crew result string
        Handles various formats: markdown code blocks, plain JSON, etc.
        """
        if isinstance(result, dict):
            return result
        
        result_str = str(result)
        
        # Try to extract JSON from markdown code blocks
        json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
        matches = re.findall(json_pattern, result_str, re.DOTALL)
        
        if matches:
            try:
                return json.loads(matches[0])
            except json.JSONDecodeError:
                pass
        
        # Try to find JSON object directly
        try:
            # Find the first { and last }
            start = result_str.find('{')
            end = result_str.rfind('}')
            if start != -1 and end != -1:
                json_str = result_str[start:end+1]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # If all parsing fails, return raw string wrapped in dict
        print("⚠️  Could not parse JSON from result, returning raw string")
        return {"raw_output": result_str, "parsing_failed": True}

def kickoff():
    """
    Run the flow with default/test data
    """
    job_flow = JobMatcherFlow()
    job_flow.kickoff()


def plot():
    """
    Visualize the flow structure
    """
    job_flow = JobMatcherFlow()
    job_flow.plot()


def run_with_trigger():
    """
    Run the flow with trigger payload.
    """
    import json
    import sys

    # Get trigger payload from command line argument
    if len(sys.argv) < 2:
        raise Exception("No trigger payload provided. Please provide JSON payload as argument.")

    try:
        trigger_payload = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        raise Exception("Invalid JSON payload provided as argument")

    # Create flow and kickoff with trigger payload
    # The @start() methods will automatically receive crewai_trigger_payload parameter
    job_flow = JobMatcherFlow()

    try:
        result = job_flow.kickoff(inputs={"crewai_trigger_payload": trigger_payload})
        return result
    except Exception as e:
        raise Exception(f"An error occurred while running the flow with trigger: {e}")


def test_with_dummy_data():
    """
    Quick test with dummy CV data and a real job URL
    """
    dummy_cv = {
        "personal_info": {
            "name": "Test User",
            "email": "test@example.com",
            "location": "New York, NY"
        },
        "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "REST APIs"],
        "experience": [
            {
                "title": "Backend Developer",
                "company": "Tech Corp",
                "duration": "2 years",
                "achievements": [
                    "Built microservices with FastAPI",
                    "Optimized database queries"
                ]
            }
        ],
        "education": [
            {
                "degree": "BS Computer Science",
                "university": "Tech University",
                "graduation_year": 2021
            }
        ],
        "experience_level": "mid"
    }
    
    test_payload = {
        "cv_data": dummy_cv,
        "candidate_id": "test_123",
        # Replace with a real job URL for testing
        "job_url": "https://www.indeed.com/viewjob?jk=2a4913120e775350&from=shareddesktop_copy"
    }
    
    print("🧪 Testing JobMatcher Flow with specific job URL...")
    print("="*60)
    job_flow = JobMatcherFlow()
    result = job_flow.kickoff(inputs={"crewai_trigger_payload": test_payload})
    
    print("\n" + "="*60)
    print("✅ Test completed!")
    print("="*60)
    
    if isinstance(result, dict):
        print("\n📊 Match Result:")
        print(f"Score: {result.get('overall_match_score', 'N/A')}/100")
        print(f"Missing Skills: {len(result.get('missing_skills', []))}")
        
        resume_opt = result.get('resume_optimization', {})
        if isinstance(resume_opt, dict):
            keywords = resume_opt.get('keywords_to_add', [])
            print(f"Resume Optimization Tips: {len(keywords)} keywords to add")
    else:
        print("\n⚠️  Result is not in expected format")
        print(f"Result type: {type(result)}")
    
    return result


if __name__ == "__main__":
    test_with_dummy_data()