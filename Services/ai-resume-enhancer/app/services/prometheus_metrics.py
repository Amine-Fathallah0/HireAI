from prometheus_client import Histogram, Counter

from prometheus_client import Histogram, Counter

LLM_LATENCY = Histogram('ai_llm_request_latency_seconds', 'Latency for calls to LLM provider', ['agent'])
LLM_CALLS = Counter('ai_llm_calls_total', 'Total number of LLM calls', ['agent', 'status'])
