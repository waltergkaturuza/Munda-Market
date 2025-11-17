from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging

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
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://munda-market-admin.vercel.app",  # Admin Console (Vercel Production)
    "https://munda-market-buyer.vercel.app",  # Buyer Portal (Vercel Production)
    "https://admin.mundamarket.co.zw",  # Admin Console (Custom Domain)
    "https://buy.mundamarket.co.zw",  # Buyer Portal (Custom Domain)
    "https://munda-market.onrender.com",  # Backend (Render) - for direct API access
    "https://api.mundamarket.co.zw",  # Backend (Custom Domain) - when DNS is configured
]

# Log CORS configuration on startup for debugging
logger.info(f"CORS configured with {len(allowed_origins)} allowed origins")
if settings.DEBUG:
    logger.info(f"DEBUG mode: CORS origins = {allowed_origins}")

# Custom origin validator function for CORS
def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed (explicit list or Vercel preview)"""
    if not origin:
        return False
    # Check explicit list
    if origin in allowed_origins:
        return True
    # Allow all Vercel preview deployments (*.vercel.app)
    if origin.endswith(".vercel.app"):
        logger.info(f"Allowing Vercel preview origin: {origin}")
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
    allow_origins=allowed_origins,  # Explicit list of production URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

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
