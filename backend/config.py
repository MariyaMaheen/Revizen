from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    llm_model: str = "google/gemini-2.5-flash"
    llm_max_tokens: int = 2048
    embedding_model: str = "all-MiniLM-L6-v2"
    chroma_path: str = "./chroma_db"
    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k: int = 5
    distance_threshold: float = 0.8
    chat_history_turns: int = 5
    jwt_secret: str = "revizen-secret-change-in-production"
    jwt_expire_minutes: int = 480
    db_path: str = "./revizen.db"
    insights_path: str = "./insights"
    cors_origins: str = "http://localhost:5173,https://5173-i0h5tiiyv6lcsgh4ugn8g-5b262517.sg1.manus.computer"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
