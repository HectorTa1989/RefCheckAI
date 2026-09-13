"""RefCheck AI — FastAPI backend entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.candidates import router as candidates_router
from api.references import router as references_router
from api.templates import router as templates_router
from api.calle_webhook import router as calle_router
from api.reports import router as reports_router
from api.shared import router as shared_router
from db.client import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 RefCheck AI backend starting…")
    yield
    print("👋 Shutting down")


app = FastAPI(
    title="RefCheck AI",
    description="Automated employment reference verification by phone",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(candidates_router)
app.include_router(references_router)
app.include_router(templates_router)
app.include_router(calle_router)
app.include_router(reports_router)
app.include_router(shared_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "refcheck-ai"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
