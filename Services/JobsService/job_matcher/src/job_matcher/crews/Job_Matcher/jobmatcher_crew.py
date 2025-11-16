from typing import List
import os

from crewai import Agent, Crew, Process, Task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.project import CrewBase, agent, crew, task
from pathlib import Path

from dotenv import load_dotenv
from crewai import LLM


env_path = Path(__file__).parent.parent.parent.parent.parent / '.env'

load_dotenv(dotenv_path=env_path)

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

if not api_key:
    raise ValueError(
        f"GEMINI_API_KEY not found! Please check your .env file at: {env_path.absolute()}"
    )

print(f"✅ Loaded API key from: {env_path.absolute()}")
print(f"🔑 API Key starts with: {api_key[:10]}...")

# Configure LLM with Gemini - Lower temperature for extraction
model_name = os.environ.get("MODEL", "gemini/gemini-1.5-flash")
print(f"📦 Using model: {model_name}")

llm = LLM(
    model=model_name,
    api_key=api_key,
    temperature=0.1  # Very low temperature for accurate extraction
)


@CrewBase
class JobMatcherCrew:
    """Job Matcher Crew"""

    agents: List[BaseAgent]
    tasks: List[Task]
    llm: LLM = llm
    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    _job_url: str = "https://www.indeed.com/viewjob?jk=2a4913120e775350&from=shareddesktop_copy"

    def set_job_url(self, job_url: str):
        """Set the job URL for scraping"""
        self._job_url = job_url

    # If you would lik to add tools to your crew, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    @agent
    def job_scraper_agent(self) -> Agent:
        """Job data extraction agent - works with pre-scraped content"""
        return Agent(
            config=self.agents_config["job_scraper_agent"],  # type: ignore[index]
            tools=[],  # No tools needed - content is pre-scraped
            llm=llm,
            verbose=True,
            allow_delegation=False
        )
    
    @agent
    def job_matching_agent(self) -> Agent:
        """Job matching and resume optimization agent"""
        return Agent(
            config=self.agents_config["job_matching_agent"],  # type: ignore[index]
            llm=llm,
            verbose=True,
            allow_delegation=False
        )
    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def job_scraper_task(self) -> Task:
        """Task for extracting structured data from pre-scraped content"""
        return Task(
            config=self.tasks_config["job_scraper_task"],  # type: ignore[index]
        )
    
    @task
    def job_matching_task(self) -> Task:
        """Task for matching CV to job and providing optimization"""
        return Task(
            config=self.tasks_config["job_matching_task"],  # type: ignore[index]
        )
    
    @crew
    def crew(self) -> Crew:
        """Creates the Job Matcher Crew - DEPRECATED: Use scraper_crew() or matcher_crew() instead"""
        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
        )
    
    def scraper_crew(self) -> Crew:
        """Creates a crew with only the scraper agent and task"""
        return Crew(
            agents=[self.job_scraper_agent()],
            tasks=[self.job_scraper_task()],
            process=Process.sequential,
            verbose=True,
        )
    
    def matcher_crew(self) -> Crew:
        """Creates a crew with only the matching agent and task"""
        return Crew(
            agents=[self.job_matching_agent()],
            tasks=[self.job_matching_task()],
            process=Process.sequential,
            verbose=True,
        )
    

