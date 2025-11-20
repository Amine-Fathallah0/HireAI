import uuid
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.middleware.base import BaseHTTPMiddleware
import structlog


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Bind to structlog context for this request
        logger = structlog.get_logger()
        logger = logger.bind(request_id=request_id, path=request.url.path)
        request.state.request_id = request_id
        # attach logger to request for handlers
        request.state.logger = logger
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
