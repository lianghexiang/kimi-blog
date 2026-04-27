from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from app.auth.router import router as auth_router
from app.routers.posts import router as posts_router
from app.routers.images import router as images_router
from app.routers.tags import router as tags_router
from app.routers.contacts import router as contacts_router
from app.routers.users import router as users_router
from app.routers.roles import router as roles_router
from app.routers.albums import router as albums_router
from app.routers.site_configs import router as site_configs_router
from app.schemas import PingResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import async_engine
    from app.models import Base
    from app.seed import ensure_defaults

    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await ensure_defaults()
    yield


app = FastAPI(lifespan=lifespan)

# CORS
from app.config import settings as app_settings

def _get_cors_origins():
    default = ["http://localhost:3000", "http://localhost:5000"]
    if app_settings.cors_origins:
        return [o.strip() for o in app_settings.cors_origins.split(",") if o.strip()]
    return default

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping", response_model=PingResponse)
async def ping():
    import time
    return {"ok": True, "ts": int(time.time() * 1000)}


app.include_router(auth_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(tags_router, prefix="/api")
app.include_router(contacts_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(roles_router, prefix="/api")
app.include_router(albums_router, prefix="/api")
app.include_router(site_configs_router, prefix="/api")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"error": "Not Found"})
    # Let SPA fallback handle non-API routes
    return JSONResponse(status_code=404, content={"error": "Not Found"})


# Uploads static files
import os

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "app", "public", "uploads")
if os.path.isdir(UPLOADS_DIR):
    from fastapi.staticfiles import StaticFiles
    app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# SPA fallback — mount static files and catch-all
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "app", "dist", "public")

if os.path.isdir(STATIC_DIR):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"error": "Not Found"})
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"error": "Not Found"})
