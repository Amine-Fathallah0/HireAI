try:
    # pydantic v2 moved BaseSettings to pydantic-settings package
    from pydantic_settings import BaseSettings
except Exception:
    # fallback for older pydantic versions
    from pydantic import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    debug: bool = True
    crewai_api_key: str | None = None
    crewai_api_url: str | None = None
    groq_api_key: str | None = None
    groq_api_url: str | None = None
    pinecone_api_key: str | None = None
    pinecone_env: str | None = None
    pinecone_index_name: str | None = None
    database_url: str | None = None
    mongo_url: str | None = "mongodb://localhost:27017"
    mongo_db_name: str = "resume_db"
    llm_timeout_seconds: int = 30
    enable_crewai: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
