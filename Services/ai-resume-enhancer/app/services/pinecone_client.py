from typing import List, Dict, Optional
import structlog
from app.core.config import settings
from app.services.embeddings import create_embedding

logger = structlog.get_logger()


class PineconeClient:
    def __init__(self):
        self._inited = False
        self._index = None

    def _init(self):
        if self._inited:
            return
        try:
            import pinecone

            api_key = settings.pinecone_api_key
            env = settings.pinecone_env
            index_name = settings.pinecone_index_name
            if not api_key or not env or not index_name:
                logger.info("pinecone.config.missing", api_key=bool(api_key), env=bool(env), index=bool(index_name))
                self._inited = False
                return

            pinecone.init(api_key=api_key, environment=env)
            # Ensure index exists
            if index_name not in pinecone.list_indexes():
                # create minimal index with same vector dim as embedding
                dim = len(create_embedding("test"))
                pinecone.create_index(index_name, dimension=dim)

            self._index = pinecone.Index(index_name)
            self._inited = True
            logger.info("pinecone.init", index=index_name)
        except Exception as e:
            logger.error("pinecone.init.failed", error=str(e))
            self._inited = False

    def upsert_resume_section(self, resume_id: str, section_type: str, text: str, metadata: Optional[Dict] = None) -> Dict:
        vec = create_embedding(text)
        self._init()
        if not self._inited or not self._index:
            logger.info("pinecone.upsert.stub", resume_id=resume_id, section=section_type)
            return {"status": "stubbed", "vector_id": f"vec-{resume_id}-{section_type}", "vector": vec}

        try:
            id_ = f"{resume_id}-{section_type}"
            # metadata should be JSON-serializable
            self._index.upsert([(id_, vec, metadata or {})])
            logger.info("pinecone.upsert", id=id_)
            return {"status": "ok", "vector_id": id_, "vector": vec}
        except Exception as e:
            logger.error("pinecone.upsert.error", error=str(e))
            return {"status": "error", "error": str(e)}

    def query_similar(self, text: str, top_k: int = 5) -> Dict:
        vec = create_embedding(text)
        self._init()
        if not self._inited or not self._index:
            logger.info("pinecone.query.stub")
            return {"matches": []}
        try:
            res = self._index.query(vec, top_k=top_k, include_metadata=True)
            return {"matches": res.get("matches", [])}
        except Exception as e:
            logger.error("pinecone.query.error", error=str(e))
            return {"matches": []}


_client = PineconeClient()


def upsert_resume_section(resume_id: str, section_type: str, text: str, metadata: Optional[Dict] = None) -> Dict:
    return _client.upsert_resume_section(resume_id, section_type, text, metadata)


def query_similar(text: str, top_k: int = 5) -> Dict:
    return _client.query_similar(text, top_k=top_k)
