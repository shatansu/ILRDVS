"""
FastAPI Main Application for BhoomiVerify AI (ILRDVS).
Intelligent Land Record Digitization and Validation System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.documents import router as documents_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for BhoomiVerify AI — Quality-Aware Land Record Intelligence System",
    version="1.0.0"
)

# CORS configuration for Frontend Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins during prototype development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(documents_router, prefix=f"{settings.API_V1_STR}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "quality_analyzer": "online",
        "enhancement_engine": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
