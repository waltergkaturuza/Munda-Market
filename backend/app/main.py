from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging
import re

from .core.config import settings
from .core.database import create_tables
from .api.v1 import api_router
from .services.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="A two-sided digital marketplace for fresh produce trading",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
)

# CORS middleware - Allow admin console and buyer portal
# IMPORTANT: When allow_credentials=True, browsers do NOT allow wildcard origins ("*")
# We must always use explicit origin lists, even in DEBUG mode
allowed_origins = [
    "http://localhost:3000",  # Buyer Portal
    "http://localhost:3001",  # Admin Console
    "http://localhost:3002",  # Farmer App
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://munda-market-admin.vercel.app",  # Admin Console (Vercel Production)
    "https://munda-market-buyer.vercel.app",  # Buyer Portal (Vercel Production)
    "https://munda-market-farmer.vercel.app",  # Farmer App (Vercel Production)
    "https://admin.mundamarket.co.zw",  # Admin Console (Custom Domain)
    "https://buy.mundamarket.co.zw",  # Buyer Portal (Custom Domain)
    "https://munda-market.onrender.com",  # Backend (Render) - for direct API access
    "https://api.mundamarket.co.zw",  # Backend (Custom Domain) - when DNS is configured
]

# Log CORS configuration on startup for debugging
logger.info(f"CORS configured with {len(allowed_origins)} allowed origins")
if settings.DEBUG:
    logger.info(f"DEBUG mode: CORS origins = {allowed_origins}")

# Custom CORS middleware to handle both explicit origins and regex patterns
# This is needed because FastAPI's CORSMiddleware doesn't support both
# allow_origin_regex and allow_origins together with allow_credentials=True
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response

class CustomCORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware that supports both explicit origins and regex patterns"""
    
    async def dispatch(self, request: StarletteRequest, call_next):
        origin = request.headers.get("origin")
        
        # Check if origin is allowed
        is_allowed = False
        if origin:
            # Check explicit list
            if origin in allowed_origins:
                is_allowed = True
            # Check regex pattern for Vercel deployments
            elif re.match(r"https://.*\.vercel\.app", origin):
                logger.info(f"Allowing Vercel origin: {origin}")
                is_allowed = True
            else:
                logger.warning(f"CORS: Origin not allowed: {origin}")
        
        # Handle preflight OPTIONS request
        if request.method == "OPTIONS":
            if is_allowed and origin:
                response = Response(status_code=200)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Max-Age"] = "3600"
                logger.info(f"CORS: Allowed OPTIONS preflight for origin: {origin}")
                return response
            else:
                # Reject preflight for disallowed origins
                logger.warning(f"CORS: Rejected OPTIONS preflight for origin: {origin}")
                return Response(status_code=403)
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to response if origin is allowed
        if is_allowed and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Expose-Headers"] = "*"
            logger.debug(f"CORS: Added headers for origin: {origin}")
        
        return response

app.add_middleware(CustomCORSMiddleware)

# Trusted hosts middleware (security)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        },
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": time.time()
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.PROJECT_VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production",
        "health": "/health"
    }

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")
    if settings.DEBUG:
        logger.info("Debug mode is enabled")
        # Create tables in development (use Alembic migrations in production)
        try:
            create_tables()
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.error(f"Error creating database tables: {e}")
    
    # Start background scheduler for alerts and stock history
    try:
        start_scheduler()
        logger.info("Background scheduler started")
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.PROJECT_NAME}")
    stop_scheduler()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
