from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import auth, universities, programmes, dashboard, exchange_rates, budgets
from app.scheduler import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()

app = FastAPI(
    title="German MSc Programme Explorer API",
    description="API for browsing and tracking German MSc programmes.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
import os
cors_allowed_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_allowed_origins_raw:
    origins = [origin.strip() for origin in cors_allowed_origins_raw.split(",") if origin.strip()]
else:
    # Default secure development origins
    origins = [
        "http://localhost:5173",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://127.0.0.1"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(universities.router, prefix="/api/v1/universities", tags=["universities"])
app.include_router(programmes.router, prefix="/api/v1/programmes", tags=["programmes"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(exchange_rates.router, prefix="/api/v1/exchange-rates", tags=["exchange-rates"])
app.include_router(budgets.router, prefix="/api/v1/budgets", tags=["budgets"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
